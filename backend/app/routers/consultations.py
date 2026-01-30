"""
Consultations Router
====================
Doctor-facing endpoints for viewing patient summaries.

ETHICAL SAFEGUARD:
- Doctors see ONLY approved structured summaries
- Doctors do NOT see raw audio or transcripts
- All access is consent-gated
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.routers.auth import require_doctor_role
from app.services.firebase_admin import (
    get_patient_consultations,
    get_summary,
    get_firestore_client,
)
from app.services.consent_service import require_doctor_sharing_consent
from app.services.ai_orchestrator import translate_text

router = APIRouter()


class StructuredSummary(BaseModel):
    chiefComplaint: str
    symptomTimeline: str
    severity: str
    pastHistory: Optional[str] = None
    additionalNotes: Optional[str] = None


class ConsultationSummary(BaseModel):
    id: str
    patientId: str
    summary: Optional[StructuredSummary] = None
    consentScope: List[str] = []
    createdAt: Optional[str] = None
    doctorNotes: Optional[str] = None


class DoctorNotesRequest(BaseModel):
    notes: str


class DoctorNotesResponse(BaseModel):
    success: bool
    translatedNotes: Optional[str] = None


@router.get("", response_model=List[ConsultationSummary])
async def list_consultations(user: dict = Depends(require_doctor_role)):
    """
    List all consultations accessible to this doctor.
    
    ETHICAL SAFEGUARD:
    - Only returns summaries where patient consented to doctor sharing
    - Never returns raw audio or transcripts
    """
    consultations = await get_patient_consultations(user["uid"])
    
    result = []
    for consultation in consultations:
        summary = consultation.get("summary")
        result.append(
            ConsultationSummary(
                id=consultation["id"],
                patientId=consultation["patientId"],
                summary=StructuredSummary(**summary) if summary else None,
                consentScope=["doctor_sharing"],
                createdAt=str(consultation.get("createdAt", "")),
            )
        )
    
    return result


@router.get("/{consultation_id}", response_model=ConsultationSummary)
async def get_consultation(
    consultation_id: str,
    user: dict = Depends(require_doctor_role),
):
    """
    Get a specific consultation.
    
    ETHICAL SAFEGUARD:
    - Verifies patient has doctor_sharing consent
    - Returns ONLY structured summary
    
    Phase 2: Also verifies patient has approved the summary
    """
    summary_data = await get_summary(consultation_id)
    
    if not summary_data:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    patient_uid = summary_data.get("patientUid")
    
    # Verify consent
    try:
        await require_doctor_sharing_consent(patient_uid)
    except PermissionError:
        raise HTTPException(
            status_code=403,
            detail="Patient has not consented to sharing with doctors"
        )
    
    # Phase 2: Verify patient has approved this summary
    approval_status = summary_data.get("approvalStatus", "pending")
    if approval_status != "approved":
        raise HTTPException(
            status_code=403,
            detail="Patient has not yet approved this summary for sharing"
        )
    
    # Use edited summary if patient made edits, otherwise use original
    summary = summary_data.get("editedSummary") or summary_data.get("summary")
    
    return ConsultationSummary(
        id=consultation_id,
        patientId=patient_uid,
        summary=StructuredSummary(**summary) if summary else None,
        consentScope=["doctor_sharing"],
        createdAt=str(summary_data.get("createdAt", "")),
        doctorNotes=summary_data.get("doctorNotes"),
    )


@router.post("/{consultation_id}/notes", response_model=DoctorNotesResponse)
async def submit_doctor_notes(
    consultation_id: str,
    request: DoctorNotesRequest,
    user: dict = Depends(require_doctor_role),
):
    """
    Submit doctor's visit notes for a consultation.
    Notes are written in English and translated to patient's language.
    """
    summary_data = await get_summary(consultation_id)
    
    if not summary_data:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    patient_uid = summary_data.get("patientUid")
    
    # Verify consent
    try:
        await require_doctor_sharing_consent(patient_uid)
    except PermissionError:
        raise HTTPException(
            status_code=403,
            detail="Patient has not consented to sharing with doctors"
        )
    
    # Get patient's preferred language (from original symptom)
    db = get_firestore_client()
    symptom_doc = db.collection("symptoms").document(consultation_id).get()
    patient_language = "english"
    if symptom_doc.exists:
        patient_language = symptom_doc.to_dict().get("language", "english")
    
    # Translate notes if needed
    translated_notes = None
    if patient_language.lower() != "english":
        translated_notes = await translate_text(
            request.notes,
            "english",
            patient_language
        )
    
    # Update consultation with doctor notes
    db.collection("summaries").document(consultation_id).update({
        "doctorNotes": request.notes,
        "doctorNotesTranslated": translated_notes,
        "doctorUid": user["uid"],
        "notesUpdatedAt": datetime.utcnow(),
    })
    
    return DoctorNotesResponse(
        success=True,
        translatedNotes=translated_notes,
    )


# ===================== PRIORITY QUEUE SCHEDULING =====================
# COMPLIANCE NOTES:
# - Queue sorting ≠ clinical urgency
# - Sorting is assistive only
# - Doctor override always takes precedence
# - Doctors manually pick from queue (NO auto-assignment)

# Triage level priority (lower = higher priority)
TRIAGE_PRIORITY = {
    "urgent_attention_suggested": 1,
    "consultation_needed": 2,
    "routine": 3,
}


@router.get("/queue/pending")
async def get_pending_queue(user: dict = Depends(require_doctor_role)):
    """
    Get pending consultations sorted by priority.
    
    SORTING RULES (Assistive only, NOT clinical urgency):
    1. 🔴 urgent_attention_suggested (earliest first)
    2. 🟡 consultation_needed (earliest first)
    3. 🟢 routine (earliest first)
    
    COMPLIANCE:
    - Doctors manually pick from queue
    - NO auto-assignment
    - Doctor can override priority at any time
    """
    db = get_firestore_client()
    
    # Get all pending summaries that have been approved
    summaries = db.collection("summaries").where(
        "approvalStatus", "==", "approved"
    ).where(
        "doctorNotes", "==", None  # Not yet handled
    ).get()
    
    queue = []
    for doc in summaries:
        data = doc.to_dict()
        symptom_id = doc.id
        
        # Get triage for this summary
        triage_doc = db.collection("triage").document(symptom_id).get()
        triage_level = "routine"  # Default
        doctor_override = None
        
        if triage_doc.exists:
            triage_data = triage_doc.to_dict()
            # Use doctor override if present, otherwise use computed triage
            doctor_override = triage_data.get("doctor_override")
            triage_level = doctor_override or triage_data.get("triage_level", "routine")
        
        queue.append({
            "id": symptom_id,
            "patient_uid": data.get("patientUid"),
            "summary_preview": data.get("summary", {}).get("chiefComplaint", "")[:100],
            "created_at": data.get("createdAt"),
            "triage_level": triage_level,
            "doctor_override": doctor_override,
            "priority": TRIAGE_PRIORITY.get(triage_level, 3),
            # COMPLIANCE: Mark as assistive only
            "ai_role": "non_clinical_scheduling_only",
            "ai_disclaimer": "Sorting is assistive only. Doctor is sole clinical authority."
        })
    
    # Sort by: priority (lower first), then by created_at (older first)
    queue.sort(key=lambda x: (x["priority"], x["created_at"] or datetime.min))
    
    return {
        "queue": queue,
        "total": len(queue),
        "compliance_notice": "Queue sorting is assistive only, not clinical urgency. Doctors manually select patients."
    }

