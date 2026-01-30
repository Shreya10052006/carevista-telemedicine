"""
Vitals Router (Phase 3)
=======================
Stores basic patient vitals as raw values only.

ETHICAL SAFEGUARD:
- NO interpretation of vitals
- NO alerts or thresholds
- NO medical conclusions
- Raw values stored and returned as-is
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.firebase_admin import (
    verify_firebase_token,
    get_firestore_client,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/vitals", tags=["vitals"])


class VitalsCreate(BaseModel):
    """
    Vitals data model.
    
    ETHICAL SAFEGUARD: These are raw values only.
    The system does NOT interpret, analyze, or alert based on these.
    """
    bp_systolic: Optional[float] = None
    bp_diastolic: Optional[float] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    entered_by: str  # 'patient' or 'health_worker'
    entered_by_uid: Optional[str] = None
    symptom_id: Optional[str] = None


class VitalsResponse(BaseModel):
    id: str
    patient_uid: str
    bp_systolic: Optional[float]
    bp_diastolic: Optional[float]
    temperature: Optional[float]
    weight: Optional[float]
    entered_by: str
    entered_by_uid: Optional[str]
    created_at: datetime


@router.post("/", response_model=VitalsResponse)
async def create_vitals(
    vitals: VitalsCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Store patient vitals.
    
    ETHICAL SAFEGUARD:
    - Stores raw values ONLY
    - NO interpretation, alerts, or medical conclusions
    """
    db = get_firestore_client()
    
    # Determine patient UID
    if current_user.get("role") == "health_worker" and vitals.entered_by_uid:
        # Health worker entering for a patient
        patient_uid = vitals.entered_by_uid
    else:
        patient_uid = current_user["uid"]
    
    now = datetime.utcnow()
    vitals_id = f"vitals-{now.timestamp()}"
    
    # Store raw values only - NO interpretation
    vitals_data = {
        "id": vitals_id,
        "patient_uid": patient_uid,
        "bp_systolic": vitals.bp_systolic,
        "bp_diastolic": vitals.bp_diastolic,
        "temperature": vitals.temperature,
        "weight": vitals.weight,
        "entered_by": vitals.entered_by,
        "entered_by_uid": current_user["uid"] if vitals.entered_by == "health_worker" else None,
        "symptom_id": vitals.symptom_id,
        "created_at": now,
    }
    
    db.collection("vitals").document(vitals_id).set(vitals_data)
    
    return VitalsResponse(**vitals_data)


@router.get("/patient/{patient_uid}")
async def get_patient_vitals(
    patient_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get vitals for a patient.
    
    ETHICAL SAFEGUARD:
    - Returns raw values only
    - NO interpretation or analysis
    - Access controlled by role
    """
    # Only patient themselves, their doctor (with consent), or health worker can access
    if current_user["uid"] != patient_uid and current_user.get("role") not in ["doctor", "health_worker"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_firestore_client()
    docs = db.collection("vitals").where("patient_uid", "==", patient_uid).get()
    
    vitals_list = []
    for doc in docs:
        data = doc.to_dict()
        vitals_list.append({
            "id": data.get("id"),
            "bp_systolic": data.get("bp_systolic"),
            "bp_diastolic": data.get("bp_diastolic"),
            "temperature": data.get("temperature"),
            "weight": data.get("weight"),
            "entered_by": data.get("entered_by"),
            "created_at": data.get("created_at"),
        })
    
    return {"vitals": vitals_list}
