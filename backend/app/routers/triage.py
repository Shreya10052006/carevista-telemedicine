"""
Triage Router
=============
Rule-based urgency classification for scheduling prioritization.

╔══════════════════════════════════════════════════════════════════╗
║                    CRITICAL SAFETY RULES                          ║
╠══════════════════════════════════════════════════════════════════╣
║ 1. TRIAGE ≠ DIAGNOSIS                                             ║
║    Triage is priority classification ONLY, NOT medical diagnosis  ║
║                                                                   ║
║ 2. RULE-BASED ONLY                                                ║
║    - Uses scalar inputs (severity, duration)                      ║
║    - Uses keyword flags (predefined patterns)                     ║
║    - NO medical term expansion                                    ║
║    - NO synonym inference                                         ║
║    - NO model-based reasoning                                     ║
║                                                                   ║
║ 3. DOCTOR OVERRIDE                                                ║
║    Doctor can override triage priority at ANY time                ║
║                                                                   ║
║ 4. VISIBILITY RULES                                               ║
║    - Triage visible to: Doctors, Scheduling System                ║
║    - Triage NOT visible to: Patients, Health Workers (default)    ║
║                                                                   ║
║ 5. NON-CLINICAL                                                   ║
║    All triage outputs are assistive only, not medical advice      ║
╚══════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import get_current_user

router = APIRouter(prefix="/triage", tags=["triage"])


class TriageLevel(str, Enum):
    """
    Triage levels - priority classification ONLY.
    
    IMPORTANT: These are NOT clinical urgency levels.
    They are scheduling priority classifications.
    """
    ROUTINE = "routine"
    CONSULTATION_NEEDED = "consultation_needed"
    URGENT_ATTENTION_SUGGESTED = "urgent_attention_suggested"


class TriageInput(BaseModel):
    """
    Input for triage computation.
    Uses scalar values and text ONLY.
    """
    symptom_id: str
    severity: int = 3  # 1-10 scale
    duration_days: int = 30  # How long symptoms have been present
    symptom_text: str = ""  # Raw symptom description
    patient_uid: str


class TriageResult(BaseModel):
    """
    Triage result with compliance flags.
    """
    symptom_id: str
    triage_level: TriageLevel
    # COMPLIANCE: Reason is rule-based, never diagnostic
    classification_reason: str
    # COMPLIANCE: Machine-readable flags
    ai_role: str = "non_clinical_scheduling_only"
    ai_disclaimer: str = "This is scheduling priority only, not medical advice. Doctor is sole clinical authority."
    # Doctor can override
    doctor_override: Optional[TriageLevel] = None
    doctor_override_reason: Optional[str] = None
    computed_at: datetime = datetime.utcnow()


# ===================== RULE-BASED TRIAGE LOGIC =====================
# CRITICAL: This logic uses ONLY:
# - Scalar thresholds (severity, duration)
# - Keyword flags (predefined patterns)
# 
# NO clinical reasoning, NO synonym inference, NO ML models

# Predefined keyword patterns that suggest urgent attention
# These are NOT disease names, just symptom descriptors
URGENT_KEYWORDS = [
    "sudden", "severe", "worst", "chest", "breathing",
    "unconscious", "unresponsive", "bleeding heavily",
    "cannot breathe", "fainting", "collapse"
]

def compute_triage(
    severity: int,
    duration_days: int,
    symptom_text: str
) -> tuple[TriageLevel, str]:
    """
    Compute triage level using RULE-BASED logic only.
    
    Rules:
    1. High severity (>=8) OR urgent keywords → URGENT_ATTENTION_SUGGESTED
    2. Medium severity (>=5) OR short duration (<=3 days) → CONSULTATION_NEEDED
    3. Otherwise → ROUTINE
    
    Returns:
        (triage_level, classification_reason)
    
    NOTE: Queue sorting ≠ clinical urgency
          Sorting is assistive only
          Doctor override always takes precedence
    """
    text_lower = symptom_text.lower()
    
    # Check for urgent keywords (exact match only, no expansion)
    has_urgent_keyword = any(kw in text_lower for kw in URGENT_KEYWORDS)
    
    # Rule 1: Urgent attention suggested
    if severity >= 8 or has_urgent_keyword:
        reason = "Rule triggered: "
        if severity >= 8:
            reason += f"High severity ({severity}/10). "
        if has_urgent_keyword:
            reason += "Symptom description contains urgent indicators."
        return (TriageLevel.URGENT_ATTENTION_SUGGESTED, reason.strip())
    
    # Rule 2: Consultation needed
    if severity >= 5 or duration_days <= 3:
        reason = "Rule triggered: "
        if severity >= 5:
            reason += f"Moderate severity ({severity}/10). "
        if duration_days <= 3:
            reason += f"Recent onset ({duration_days} days)."
        return (TriageLevel.CONSULTATION_NEEDED, reason.strip())
    
    # Rule 3: Routine
    return (
        TriageLevel.ROUTINE,
        f"Rule: Stable symptoms, severity {severity}/10, duration {duration_days} days."
    )


@router.post("/compute", response_model=TriageResult)
async def compute_symptom_triage(
    input: TriageInput,
    current_user: dict = Depends(get_current_user)
):
    """
    Compute triage for a symptom entry.
    
    ACCESS: Internal system use only.
    Patients do NOT see triage results.
    """
    # Compute triage using rules
    level, reason = compute_triage(
        severity=input.severity,
        duration_days=input.duration_days,
        symptom_text=input.symptom_text
    )
    
    result = TriageResult(
        symptom_id=input.symptom_id,
        triage_level=level,
        classification_reason=reason,
        computed_at=datetime.utcnow()
    )
    
    # Store in database
    db = get_firestore_client()
    db.collection("triage").document(input.symptom_id).set({
        "symptom_id": input.symptom_id,
        "patient_uid": input.patient_uid,
        "triage_level": level.value,
        "classification_reason": reason,
        "ai_role": "non_clinical_scheduling_only",
        "ai_disclaimer": result.ai_disclaimer,
        "doctor_override": None,
        "computed_at": result.computed_at,
    })
    
    return result


@router.get("/symptom/{symptom_id}")
async def get_triage(
    symptom_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get triage for a symptom.
    
    VISIBILITY RULES:
    - Doctors: Can see full triage
    - Patients: CANNOT see triage directly
    - Health Workers: CANNOT see triage by default
    """
    # COMPLIANCE: Only doctors can see triage
    if current_user.get("role") not in ["doctor"]:
        raise HTTPException(
            status_code=403,
            detail="Triage information is only visible to doctors"
        )
    
    db = get_firestore_client()
    doc = db.collection("triage").document(symptom_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Triage not found")
    
    return doc.to_dict()


@router.patch("/{symptom_id}/override")
async def doctor_override_triage(
    symptom_id: str,
    new_level: TriageLevel,
    reason: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Doctor override for triage priority.
    
    CRITICAL: Doctor can ALWAYS override triage.
    Doctor is the sole clinical authority.
    """
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can override triage"
        )
    
    db = get_firestore_client()
    doc = db.collection("triage").document(symptom_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Triage not found")
    
    db.collection("triage").document(symptom_id).update({
        "doctor_override": new_level.value,
        "doctor_override_reason": reason,
        "overridden_by": current_user["uid"],
        "overridden_at": datetime.utcnow(),
    })
    
    return {
        "status": "override_applied",
        "symptom_id": symptom_id,
        "new_level": new_level.value,
        "message": "Doctor override recorded. Doctor is sole clinical authority."
    }
