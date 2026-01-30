"""
Temporary Patients Router (Phase 3)
===================================
Manages temporary patient IDs for rural health camps.

RULES:
- Created by health workers only
- Marked as "temporary"
- Linked later to permanent account
- No data loss during linking
- Same consent rules apply
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import get_current_user

router = APIRouter(prefix="/temporary-patients", tags=["temporary-patients"])


class TemporaryPatientCreate(BaseModel):
    """Temporary patient data model."""
    name: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    camp_name: Optional[str] = None


class TemporaryPatientResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    camp_name: Optional[str]
    created_by_uid: str
    is_linked: bool
    linked_to_uid: Optional[str]
    created_at: datetime


@router.post("/", response_model=TemporaryPatientResponse)
async def create_temporary_patient(
    patient: TemporaryPatientCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a temporary patient ID.
    
    Only health workers can create temporary patients.
    """
    if current_user.get("role") != "health_worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can create temporary patient IDs"
        )
    
    db = get_firestore_client()
    
    now = datetime.utcnow()
    temp_id = f"temp-{now.timestamp()}-{patient.name[:3].lower()}"
    
    patient_data = {
        "id": temp_id,
        "name": patient.name,
        "phone": patient.phone,
        "age": patient.age,
        "gender": patient.gender,
        "camp_name": patient.camp_name,
        "created_by_uid": current_user["uid"],
        "linked_to_uid": None,
        "linked_at": None,
        "created_at": now,
    }
    
    db.collection("temporary_patients").document(temp_id).set(patient_data)
    
    return TemporaryPatientResponse(
        id=temp_id,
        name=patient.name,
        phone=patient.phone,
        age=patient.age,
        gender=patient.gender,
        camp_name=patient.camp_name,
        created_by_uid=current_user["uid"],
        is_linked=False,
        linked_to_uid=None,
        created_at=now,
    )


@router.post("/{temp_id}/link/{permanent_uid}")
async def link_temporary_patient(
    temp_id: str,
    permanent_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Link temporary patient to permanent account.
    
    Preserves all records and transfers ownership.
    """
    if current_user.get("role") != "health_worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can link temporary patients"
        )
    
    db = get_firestore_client()
    doc = db.collection("temporary_patients").document(temp_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Temporary patient not found")
    
    data = doc.to_dict()
    
    if data.get("linked_to_uid"):
        raise HTTPException(
            status_code=400,
            detail="Patient already linked to a permanent account"
        )
    
    now = datetime.utcnow()
    
    # Update temporary patient record
    db.collection("temporary_patients").document(temp_id).update({
        "linked_to_uid": permanent_uid,
        "linked_at": now,
    })
    
    # Transfer all related records to permanent UID
    # Update vitals
    vitals_docs = db.collection("vitals").where("patient_uid", "==", temp_id).get()
    for vdoc in vitals_docs:
        db.collection("vitals").document(vdoc.id).update({"patient_uid": permanent_uid})
    
    # Update symptoms
    symptoms_docs = db.collection("symptoms").where("patient_uid", "==", temp_id).get()
    for sdoc in symptoms_docs:
        db.collection("symptoms").document(sdoc.id).update({"patient_uid": permanent_uid})
    
    # Update reports
    reports_docs = db.collection("reports").where("patient_uid", "==", temp_id).get()
    for rdoc in reports_docs:
        db.collection("reports").document(rdoc.id).update({"patient_uid": permanent_uid})
    
    # Update summaries
    summaries_docs = db.collection("summaries").where("patientUid", "==", temp_id).get()
    for smdoc in summaries_docs:
        db.collection("summaries").document(smdoc.id).update({"patientUid": permanent_uid})
    
    # Update consents
    consents_docs = db.collection("consents").where("patientUid", "==", temp_id).get()
    for cdoc in consents_docs:
        db.collection("consents").document(cdoc.id).update({"patientUid": permanent_uid})
    
    return {
        "status": "linked",
        "temp_id": temp_id,
        "permanent_uid": permanent_uid,
        "linked_at": now.isoformat(),
    }


@router.get("/health-worker/{health_worker_uid}")
async def get_temporary_patients_by_health_worker(
    health_worker_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get temporary patients created by a health worker.
    """
    # Only the health worker themselves or admins can see this
    if current_user["uid"] != health_worker_uid:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_firestore_client()
    docs = db.collection("temporary_patients") \
        .where("created_by_uid", "==", health_worker_uid) \
        .get()
    
    patients = []
    for doc in docs:
        data = doc.to_dict()
        patients.append({
            "id": data.get("id"),
            "name": data.get("name"),
            "phone": data.get("phone"),
            "age": data.get("age"),
            "camp_name": data.get("camp_name"),
            "is_linked": bool(data.get("linked_to_uid")),
            "created_at": data.get("created_at"),
        })
    
    return {"temporary_patients": patients}
