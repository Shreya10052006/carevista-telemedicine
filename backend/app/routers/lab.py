"""
Lab Technician Router
=====================
Upload-only access for lab technicians.

╔══════════════════════════════════════════════════════════════════╗
║                    ACCESS RESTRICTIONS                            ║
╠══════════════════════════════════════════════════════════════════╣
║ Lab Technician CAN:                                               ║
║ ✓ View patient ID and name                                        ║
║ ✓ Upload reports/lab results                                      ║
║                                                                   ║
║ Lab Technician CANNOT:                                            ║
║ ✗ View patient history                                            ║
║ ✗ View summaries                                                  ║
║ ✗ View triage                                                     ║
║ ✗ View doctor notes                                               ║
║ ✗ View prescriptions                                              ║
║ ✗ Access any AI outputs                                           ║
║                                                                   ║
║ UPLOADS:                                                          ║
║ - Are NOT processed by any AI                                     ║
║ - Bypass all AI pipelines                                         ║
║ - Require patient consent before doctor visibility                ║
╚══════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import get_current_user

router = APIRouter(prefix="/lab", tags=["lab"])


class LabReportUpload(BaseModel):
    """
    Lab report metadata - UNPROCESSED, no AI.
    """
    patient_uid: str
    patient_name: str  # Lab tech sees name for verification
    file_name: str
    file_type: str
    file_size: int
    test_type: Optional[str] = None  # e.g., "blood_test", "xray"
    notes: Optional[str] = None


class LabReportResponse(BaseModel):
    id: str
    patient_uid: str
    file_name: str
    file_type: str
    uploaded_by_uid: str
    # COMPLIANCE: Consent required before doctor can see
    consent_required: bool = True
    approved_for_doctor: bool = False
    created_at: datetime


def require_lab_technician(current_user: dict = Depends(get_current_user)):
    """
    Dependency to ensure user is a lab technician.
    """
    if current_user.get("role") != "lab_technician":
        raise HTTPException(
            status_code=403,
            detail="This endpoint is only for lab technicians"
        )
    return current_user


@router.post("/upload", response_model=LabReportResponse)
async def upload_lab_report(
    report: LabReportUpload,
    current_user: dict = Depends(require_lab_technician)
):
    """
    Upload lab report for a patient.
    
    CRITICAL COMPLIANCE:
    - Report is NOT processed by any AI
    - Report bypasses all AI pipelines
    - Patient must consent before doctor can view
    """
    db = get_firestore_client()
    
    now = datetime.utcnow()
    report_id = f"labreport-{now.timestamp()}"
    
    # Store report metadata - NO AI PROCESSING
    report_data = {
        "id": report_id,
        "patient_uid": report.patient_uid,
        "patient_name": report.patient_name,
        "file_name": report.file_name,
        "file_type": report.file_type,
        "file_size": report.file_size,
        "test_type": report.test_type,
        "notes": report.notes,
        "uploaded_by_uid": current_user["uid"],
        "uploaded_by_role": "lab_technician",
        # COMPLIANCE: Consent gating
        "consent_required": True,
        "approved_for_doctor": False,  # Must be approved by patient
        "created_at": now,
        # COMPLIANCE: No AI processing marker
        "ai_processed": False,
        "ai_bypassed": True,
    }
    
    db.collection("lab_reports").document(report_id).set(report_data)
    
    return LabReportResponse(
        id=report_id,
        patient_uid=report.patient_uid,
        file_name=report.file_name,
        file_type=report.file_type,
        uploaded_by_uid=current_user["uid"],
        consent_required=True,
        approved_for_doctor=False,
        created_at=now
    )


@router.get("/patient/{patient_uid}/minimal")
async def get_patient_minimal_info(
    patient_uid: str,
    current_user: dict = Depends(require_lab_technician)
):
    """
    Get minimal patient info for lab tech verification.
    
    ONLY returns: ID and name
    DOES NOT return: history, summaries, triage, notes, prescriptions
    """
    db = get_firestore_client()
    doc = db.collection("users").document(patient_uid).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    data = doc.to_dict()
    
    # COMPLIANCE: Return ONLY id and name
    return {
        "patient_uid": patient_uid,
        "patient_name": data.get("displayName", "Unknown"),
        # Explicitly mark what is NOT included
        "_excluded": ["history", "summaries", "triage", "doctor_notes", "prescriptions"]
    }


@router.get("/my-uploads")
async def get_my_uploads(
    current_user: dict = Depends(require_lab_technician)
):
    """
    Get reports uploaded by this lab technician.
    """
    db = get_firestore_client()
    docs = db.collection("lab_reports").where(
        "uploaded_by_uid", "==", current_user["uid"]
    ).get()
    
    uploads = []
    for doc in docs:
        data = doc.to_dict()
        uploads.append({
            "id": data.get("id"),
            "patient_uid": data.get("patient_uid"),
            "file_name": data.get("file_name"),
            "approved_for_doctor": data.get("approved_for_doctor", False),
            "created_at": data.get("created_at"),
        })
    
    return {"uploads": uploads}
