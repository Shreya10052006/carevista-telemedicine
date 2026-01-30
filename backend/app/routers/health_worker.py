"""
Health Worker Router
====================
Assisted access portal with session-scoped permissions.

╔══════════════════════════════════════════════════════════════════╗
║                    ASSISTED ACCESS RULES                          ║
╠══════════════════════════════════════════════════════════════════╣
║ HEALTH WORKERS ARE FACILITATORS ONLY                              ║
║                                                                   ║
║ MANDATORY CONDITIONS:                                             ║
║ ✓ Patient must be physically present                              ║
║ ✓ One active session per health worker at a time                  ║
║ ✓ 30-minute idle timeout (hard-enforced)                          ║
║ ✓ Auto-revocation on logout/timeout                               ║
║                                                                   ║
║ HEALTH WORKERS CANNOT:                                            ║
║ ✗ View patient history                                            ║
║ ✗ See AI summaries or triage tags                                 ║
║ ✗ Access doctor notes or prescriptions                            ║
║ ✗ Reopen patient profiles after session                           ║
║ ✗ Give medical advice                                             ║
╚══════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import secrets

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import get_current_user

router = APIRouter(prefix="/health-worker", tags=["health-worker"])

# Session timeout in minutes
SESSION_TIMEOUT_MINUTES = 30


# ==================== LOGIN MODELS ====================
class LoginRequest(BaseModel):
    """Health worker login request."""
    workerId: str
    password: str


class LoginResponse(BaseModel):
    """Health worker login response."""
    id: str
    name: str
    token: str
    facility: str
    message: str


@router.post("/login", response_model=LoginResponse)
async def health_worker_login(request: LoginRequest):
    """
    Authenticate a health worker.
    
    In production, this validates against a database of registered health workers.
    For demo mode, the frontend handles validation locally.
    """
    db = get_firestore_client()
    
    # Query for health worker by worker ID
    workers = db.collection("health_workers").where(
        "worker_id", "==", request.workerId
    ).limit(1).get()
    
    worker_doc = None
    for doc in workers:
        worker_doc = doc
        break
    
    if not worker_doc:
        raise HTTPException(
            status_code=401,
            detail="Invalid Worker ID or password"
        )
    
    worker = worker_doc.to_dict()
    
    # Verify password (in production, use proper password hashing)
    # For now, simple comparison - should use bcrypt in production
    stored_password = worker.get("password_hash", worker.get("password", ""))
    if stored_password != request.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid Worker ID or password"
        )
    
    # Generate session token
    token = secrets.token_hex(32)
    
    # Store session token
    db.collection("health_worker_sessions").document(token).set({
        "worker_id": request.workerId,
        "worker_uid": worker_doc.id,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=8),
        "active": True,
    })
    
    # Audit log
    db.collection("audit_logs").add({
        "action": "health_worker_login",
        "worker_id": request.workerId,
        "timestamp": datetime.utcnow(),
    })
    
    return LoginResponse(
        id=worker_doc.id,
        name=worker.get("name", request.workerId),
        token=token,
        facility=worker.get("facility", "Unknown Facility"),
        message="Login successful"
    )


class SessionStartRequest(BaseModel):
    """Request to start an assisted session."""
    patient_uid: Optional[str] = None  # For existing patients
    is_temporary: bool = False  # For camp-based temp IDs
    patient_name: Optional[str] = None  # For temp patients
    preferred_language: str = "en"
    patient_presence_confirmed: bool = True  # MANDATORY


class SessionResponse(BaseModel):
    session_id: str
    patient_uid: str
    is_assisted: bool
    expires_at: datetime
    message: str


def require_health_worker_role(user: dict = Depends(get_current_user)):
    """Verify the user has health_worker role."""
    if user.get("role") not in ["health_worker", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Health worker access required"
        )
    return user


async def get_active_session(
    health_worker_uid: str
) -> Optional[dict]:
    """Get active session for a health worker (if any)."""
    db = get_firestore_client()
    
    sessions = db.collection("assisted_sessions").where(
        "health_worker_uid", "==", health_worker_uid
    ).where(
        "status", "==", "active"
    ).get()
    
    for session_doc in sessions:
        session = session_doc.to_dict()
        expires_at = session.get("expires_at")
        
        # Check if session has expired
        if expires_at and expires_at.replace(tzinfo=None) > datetime.utcnow():
            return session
        else:
            # Mark expired session as closed
            db.collection("assisted_sessions").document(session_doc.id).update({
                "status": "expired",
                "ended_at": datetime.utcnow(),
            })
    
    return None


@router.post("/session/start", response_model=SessionResponse)
async def start_assisted_session(
    request: SessionStartRequest,
    health_worker: dict = Depends(require_health_worker_role)
):
    """
    Start a new assisted session.
    
    CONSTRAINTS:
    - Patient presence confirmation is MANDATORY
    - Only ONE active session per health worker
    - Session expires after 30 minutes of inactivity
    """
    # Validate patient presence
    if not request.patient_presence_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Patient presence confirmation is mandatory for assisted sessions"
        )
    
    db = get_firestore_client()
    
    # Check for existing active session (only ONE allowed)
    existing_session = await get_active_session(health_worker["uid"])
    if existing_session:
        raise HTTPException(
            status_code=409,
            detail="You already have an active assisted session. "
                   "Please end it before starting a new one."
        )
    
    # Handle temporary patient (for camps)
    if request.is_temporary:
        patient_uid = f"temp-{secrets.token_hex(8)}"
        
        # Create temporary patient record
        db.collection("temporary_patients").document(patient_uid).set({
            "id": patient_uid,
            "name": request.patient_name or "Temporary Patient",
            "preferred_language": request.preferred_language,
            "created_at": datetime.utcnow(),
            "created_by": health_worker["uid"],
            "is_temporary": True,
        })
    else:
        if not request.patient_uid:
            raise HTTPException(
                status_code=400,
                detail="Patient UID required for non-temporary sessions"
            )
        patient_uid = request.patient_uid
    
    # Create session
    now = datetime.utcnow()
    session_id = f"session-{secrets.token_hex(12)}"
    expires_at = now + timedelta(minutes=SESSION_TIMEOUT_MINUTES)
    
    session_data = {
        "id": session_id,
        "health_worker_uid": health_worker["uid"],
        "patient_uid": patient_uid,
        "status": "active",
        "is_assisted": True,
        "patient_presence_confirmed": True,
        "preferred_language": request.preferred_language,
        "created_at": now,
        "last_activity": now,
        "expires_at": expires_at,
        # COMPLIANCE: Access restrictions
        "permissions": {
            "can_upload": True,
            "can_log_symptoms": True,
            "can_capture_consent": True,
            "can_view_history": False,  # NEVER
            "can_view_ai_summary": False,  # NEVER
            "can_view_triage": False,  # NEVER
            "can_view_prescriptions": False,  # NEVER
        },
    }
    
    db.collection("assisted_sessions").document(session_id).set(session_data)
    
    # Audit log
    db.collection("audit_logs").add({
        "action": "assisted_session_started",
        "health_worker_uid": health_worker["uid"],
        "patient_uid": patient_uid,
        "session_id": session_id,
        "timestamp": now,
    })
    
    return SessionResponse(
        session_id=session_id,
        patient_uid=patient_uid,
        is_assisted=True,
        expires_at=expires_at,
        message="Assisted session started. Patient must remain present."
    )


@router.post("/session/heartbeat")
async def session_heartbeat(
    session_id: str,
    health_worker: dict = Depends(require_health_worker_role)
):
    """
    Update session activity to prevent timeout.
    Must be called at least every few minutes.
    """
    db = get_firestore_client()
    
    doc = db.collection("assisted_sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = doc.to_dict()
    
    # Verify ownership
    if session.get("health_worker_uid") != health_worker["uid"]:
        raise HTTPException(status_code=403, detail="Not your session")
    
    # Check if already expired
    if session.get("status") != "active":
        raise HTTPException(
            status_code=410,
            detail="Session has expired. Start a new session with patient consent."
        )
    
    # Update activity and extend expiry
    now = datetime.utcnow()
    new_expiry = now + timedelta(minutes=SESSION_TIMEOUT_MINUTES)
    
    db.collection("assisted_sessions").document(session_id).update({
        "last_activity": now,
        "expires_at": new_expiry,
    })
    
    return {
        "status": "active",
        "expires_at": new_expiry,
        "remaining_minutes": SESSION_TIMEOUT_MINUTES,
    }


@router.post("/session/end")
async def end_assisted_session(
    session_id: str,
    health_worker: dict = Depends(require_health_worker_role)
):
    """
    End an assisted session.
    
    EFFECT: Immediately revokes all access to patient data.
    """
    db = get_firestore_client()
    
    doc = db.collection("assisted_sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = doc.to_dict()
    
    # Verify ownership
    if session.get("health_worker_uid") != health_worker["uid"]:
        raise HTTPException(status_code=403, detail="Not your session")
    
    now = datetime.utcnow()
    
    # End session - revoke all access
    db.collection("assisted_sessions").document(session_id).update({
        "status": "ended",
        "ended_at": now,
        # COMPLIANCE: Explicitly revoke permissions
        "permissions": {
            "can_upload": False,
            "can_log_symptoms": False,
            "can_capture_consent": False,
            "can_view_history": False,
            "can_view_ai_summary": False,
            "can_view_triage": False,
            "can_view_prescriptions": False,
        },
    })
    
    # Audit log
    db.collection("audit_logs").add({
        "action": "assisted_session_ended",
        "health_worker_uid": health_worker["uid"],
        "patient_uid": session.get("patient_uid"),
        "session_id": session_id,
        "timestamp": now,
    })
    
    return {
        "status": "ended",
        "message": "Session ended. Access to patient data has been revoked. "
                   "To access again, start a new session with patient consent."
    }


@router.get("/session/current")
async def get_current_session(
    health_worker: dict = Depends(require_health_worker_role)
):
    """Get the current active session (if any)."""
    session = await get_active_session(health_worker["uid"])
    
    if not session:
        return {
            "has_active_session": False,
            "message": "No active session. Start a new session with patient consent."
        }
    
    now = datetime.utcnow()
    expires_at = session.get("expires_at")
    remaining = int((expires_at.replace(tzinfo=None) - now).total_seconds() / 60)
    
    return {
        "has_active_session": True,
        "session_id": session.get("id"),
        "patient_uid": session.get("patient_uid"),
        "expires_at": expires_at,
        "remaining_minutes": max(0, remaining),
        "permissions": session.get("permissions"),
    }


async def require_active_assisted_session(
    session_id: str,
    health_worker: dict = Depends(require_health_worker_role)
) -> dict:
    """
    Dependency to verify an active assisted session exists.
    Used for session-scoped endpoints.
    """
    db = get_firestore_client()
    
    doc = db.collection("assisted_sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = doc.to_dict()
    
    # Verify ownership
    if session.get("health_worker_uid") != health_worker["uid"]:
        raise HTTPException(status_code=403, detail="Not your session")
    
    # Check if active
    if session.get("status") != "active":
        raise HTTPException(
            status_code=410,
            detail="Session has ended. Start a new session with patient consent."
        )
    
    # Check if expired
    expires_at = session.get("expires_at")
    if expires_at and expires_at.replace(tzinfo=None) <= datetime.utcnow():
        # Mark as expired
        db.collection("assisted_sessions").document(session_id).update({
            "status": "expired",
            "ended_at": datetime.utcnow(),
        })
        raise HTTPException(
            status_code=410,
            detail="Session has expired. Start a new session with patient consent."
        )
    
    return session


@router.post("/upload")
async def assisted_upload(
    session_id: str,
    file_name: str,
    file_type: str,
    file_data: str,  # Base64 encoded
    health_worker: dict = Depends(require_health_worker_role)
):
    """
    Upload a document during an assisted session.
    
    CONSTRAINTS:
    - Upload-only (no editing existing)
    - Session-scoped
    - Tagged to patient ID
    """
    session = await require_active_assisted_session(session_id, health_worker)
    
    db = get_firestore_client()
    
    now = datetime.utcnow()
    report_id = f"report-{now.timestamp()}"
    
    # Store report (upload-only)
    db.collection("reports").document(report_id).set({
        "id": report_id,
        "patient_uid": session.get("patient_uid"),
        "file_name": file_name,
        "file_type": file_type,
        "file_data": file_data,
        "uploaded_by": health_worker["uid"],
        "uploaded_via": "assisted_session",
        "session_id": session_id,
        "created_at": now,
        # COMPLIANCE: Requires patient consent for doctor visibility
        "approved_for_sharing": False,
    })
    
    # Audit log
    db.collection("audit_logs").add({
        "action": "assisted_upload",
        "health_worker_uid": health_worker["uid"],
        "patient_uid": session.get("patient_uid"),
        "session_id": session_id,
        "report_id": report_id,
        "timestamp": now,
    })
    
    return {
        "status": "uploaded",
        "report_id": report_id,
        "message": "Document uploaded. Patient must approve sharing with doctor."
    }


@router.post("/consent/capture")
async def capture_assisted_consent(
    session_id: str,
    consent_type: str,  # "data_sharing", "ai_processing", "doctor_access"
    consent_given: bool,
    health_worker: dict = Depends(require_health_worker_role)
):
    """
    Capture patient consent during assisted session.
    
    CONSTRAINTS:
    - Must be captured in patient's presence
    - Patient can revoke anytime
    - Health worker CANNOT override
    """
    session = await require_active_assisted_session(session_id, health_worker)
    
    db = get_firestore_client()
    
    now = datetime.utcnow()
    consent_id = f"consent-{now.timestamp()}"
    
    # Store consent
    db.collection("consents").document(consent_id).set({
        "id": consent_id,
        "patient_uid": session.get("patient_uid"),
        "consent_type": consent_type,
        "consent_given": consent_given,
        "is_assisted": True,  # COMPLIANCE: Mark as assisted consent
        "assisted_by": health_worker["uid"],
        "session_id": session_id,
        "created_at": now,
        # COMPLIANCE: Patient can revoke
        "revocable": True,
        "revoked": False,
    })
    
    # Audit log
    db.collection("audit_logs").add({
        "action": "assisted_consent_captured",
        "health_worker_uid": health_worker["uid"],
        "patient_uid": session.get("patient_uid"),
        "consent_type": consent_type,
        "consent_given": consent_given,
        "session_id": session_id,
        "timestamp": now,
    })
    
    return {
        "status": "captured",
        "consent_id": consent_id,
        "consent_type": consent_type,
        "consent_given": consent_given,
        "message": "Consent captured. Patient can revoke at any time."
    }
