"""
Prescriptions Router
====================
Doctor-only prescription management.

╔══════════════════════════════════════════════════════════════════╗
║                    AUTHORITY RULES                                ║
╠══════════════════════════════════════════════════════════════════╣
║ Prescriptions can ONLY be:                                        ║
║ ✓ Created by authenticated doctors                                ║
║ ✓ Edited by the authoring doctor                                  ║
║ ✓ Finalized by the authoring doctor                               ║
║                                                                   ║
║ AI MUST NOT:                                                       ║
║ ✗ Auto-populate medicines                                         ║
║ ✗ Suggest dosages                                                 ║
║ ✗ Recommend durations                                             ║
║ ✗ Modify doctor decisions                                         ║
╚══════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import require_doctor_role

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


class Medicine(BaseModel):
    """Single medicine entry - doctor-authored only."""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    """Prescription creation request."""
    consultation_id: str
    patient_uid: str
    medicines: List[Medicine]
    notes: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: str
    consultation_id: str
    patient_uid: str
    doctor_uid: str
    medicines: List[Medicine]
    notes: Optional[str]
    created_at: datetime
    finalized: bool


@router.post("/", response_model=PrescriptionResponse)
async def create_prescription(
    prescription: PrescriptionCreate,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Create a new prescription.
    
    AUTHORITY: Doctor-only
    AI has NO role in this endpoint.
    """
    db = get_firestore_client()
    
    now = datetime.utcnow()
    prescription_id = f"rx-{now.timestamp()}"
    
    # Store prescription - fully doctor-authored
    prescription_data = {
        "id": prescription_id,
        "consultation_id": prescription.consultation_id,
        "patient_uid": prescription.patient_uid,
        "doctor_uid": doctor["uid"],
        "medicines": [m.dict() for m in prescription.medicines],
        "notes": prescription.notes,
        "created_at": now,
        "updated_at": now,
        "finalized": False,
        # COMPLIANCE: Mark as doctor-authored
        "authored_by": "doctor",
        "ai_involvement": None,  # Explicitly None - AI has no role
    }
    
    db.collection("prescriptions").document(prescription_id).set(prescription_data)
    
    return PrescriptionResponse(
        id=prescription_id,
        consultation_id=prescription.consultation_id,
        patient_uid=prescription.patient_uid,
        doctor_uid=doctor["uid"],
        medicines=prescription.medicines,
        notes=prescription.notes,
        created_at=now,
        finalized=False,
    )


@router.patch("/{prescription_id}")
async def update_prescription(
    prescription_id: str,
    medicines: List[Medicine],
    notes: Optional[str] = None,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Update an existing prescription.
    
    Only the authoring doctor can edit.
    """
    db = get_firestore_client()
    doc = db.collection("prescriptions").document(prescription_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    data = doc.to_dict()
    
    # Only authoring doctor can edit
    if data.get("doctor_uid") != doctor["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Only the authoring doctor can edit this prescription"
        )
    
    # Cannot edit finalized prescriptions
    if data.get("finalized"):
        raise HTTPException(
            status_code=400,
            detail="Cannot edit a finalized prescription"
        )
    
    db.collection("prescriptions").document(prescription_id).update({
        "medicines": [m.dict() for m in medicines],
        "notes": notes,
        "updated_at": datetime.utcnow(),
    })
    
    return {"status": "updated", "prescription_id": prescription_id}


@router.patch("/{prescription_id}/finalize")
async def finalize_prescription(
    prescription_id: str,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Finalize a prescription (locks it for editing).
    
    Only the authoring doctor can finalize.
    """
    db = get_firestore_client()
    doc = db.collection("prescriptions").document(prescription_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    data = doc.to_dict()
    
    if data.get("doctor_uid") != doctor["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Only the authoring doctor can finalize this prescription"
        )
    
    db.collection("prescriptions").document(prescription_id).update({
        "finalized": True,
        "finalized_at": datetime.utcnow(),
    })
    
    return {
        "status": "finalized",
        "prescription_id": prescription_id,
        "message": "Prescription is now locked and will be sent to patient."
    }


@router.get("/consultation/{consultation_id}")
async def get_consultation_prescriptions(
    consultation_id: str,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Get all prescriptions for a consultation.
    """
    db = get_firestore_client()
    docs = db.collection("prescriptions").where(
        "consultation_id", "==", consultation_id
    ).get()
    
    prescriptions = []
    for doc in docs:
        data = doc.to_dict()
        prescriptions.append({
            "id": data.get("id"),
            "medicines": data.get("medicines", []),
            "notes": data.get("notes"),
            "finalized": data.get("finalized", False),
            "created_at": data.get("created_at"),
        })
    
    return {"prescriptions": prescriptions}


@router.get("/patient/{patient_uid}")
async def get_patient_prescriptions(
    patient_uid: str,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Get prescription history for a patient.
    """
    # Note: In production, should verify consent for accessing history
    db = get_firestore_client()
    docs = db.collection("prescriptions").where(
        "patient_uid", "==", patient_uid
    ).where(
        "finalized", "==", True
    ).get()
    
    prescriptions = []
    for doc in docs:
        data = doc.to_dict()
        prescriptions.append({
            "id": data.get("id"),
            "consultation_id": data.get("consultation_id"),
            "medicines": data.get("medicines", []),
            "finalized_at": data.get("finalized_at"),
        })
    
    return {"prescriptions": prescriptions}
