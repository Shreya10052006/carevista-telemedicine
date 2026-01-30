"""
Reports Router (Phase 3)
========================
Handles report/image uploads and metadata storage.

ETHICAL SAFEGUARD:
- NO automatic analysis of images
- NO AI interpretation of reports
- Metadata only - no processing logic
- Doctors see reports ONLY if approved
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportMetadata(BaseModel):
    """
    Report metadata model.
    
    ETHICAL SAFEGUARD: Stores metadata only, no AI processing.
    """
    file_name: str
    file_type: str
    file_size: int
    uploaded_by: str  # 'patient' or 'health_worker'
    patient_uid: str
    symptom_id: Optional[str] = None
    approved_for_sharing: bool = False


class ReportResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    uploaded_by: str
    approved_for_sharing: bool
    created_at: datetime


@router.post("/metadata", response_model=ReportResponse)
async def create_report_metadata(
    metadata: ReportMetadata,
    current_user: dict = Depends(get_current_user)
):
    """
    Store report metadata.
    
    ETHICAL SAFEGUARD:
    - Stores metadata ONLY
    - NO processing or analysis
    - File itself stored separately (client-side or cloud storage)
    """
    db = get_firestore_client()
    
    now = datetime.utcnow()
    report_id = f"report-{now.timestamp()}"
    
    report_data = {
        "id": report_id,
        "patient_uid": metadata.patient_uid,
        "file_name": metadata.file_name,
        "file_type": metadata.file_type,
        "file_size": metadata.file_size,
        "uploaded_by": metadata.uploaded_by,
        "uploaded_by_uid": current_user["uid"],
        "symptom_id": metadata.symptom_id,
        "approved_for_sharing": metadata.approved_for_sharing,
        "created_at": now,
    }
    
    db.collection("reports").document(report_id).set(report_data)
    
    return ReportResponse(
        id=report_id,
        file_name=metadata.file_name,
        file_type=metadata.file_type,
        uploaded_by=metadata.uploaded_by,
        approved_for_sharing=metadata.approved_for_sharing,
        created_at=now,
    )


@router.patch("/{report_id}/approve")
async def approve_report_sharing(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Approve report for sharing with doctor.
    
    Only the patient can approve their own reports.
    """
    db = get_firestore_client()
    doc = db.collection("reports").document(report_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Report not found")
    
    data = doc.to_dict()
    
    # Only patient can approve
    if data.get("patient_uid") != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Only the patient can approve sharing")
    
    db.collection("reports").document(report_id).update({
        "approved_for_sharing": True,
        "approved_at": datetime.utcnow(),
    })
    
    return {"status": "approved", "report_id": report_id}


@router.get("/patient/{patient_uid}")
async def get_patient_reports(
    patient_uid: str,
    approved_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Get reports for a patient.
    
    Doctors only see approved reports.
    """
    db = get_firestore_client()
    
    # Doctors can only see approved reports
    if current_user.get("role") == "doctor":
        approved_only = True
    
    query = db.collection("reports").where("patient_uid", "==", patient_uid)
    
    if approved_only:
        query = query.where("approved_for_sharing", "==", True)
    
    docs = query.get()
    
    reports = []
    for doc in docs:
        data = doc.to_dict()
        reports.append({
            "id": data.get("id"),
            "file_name": data.get("file_name"),
            "file_type": data.get("file_type"),
            "uploaded_by": data.get("uploaded_by"),
            "approved_for_sharing": data.get("approved_for_sharing"),
            "created_at": data.get("created_at"),
        })
    
    return {"reports": reports}
