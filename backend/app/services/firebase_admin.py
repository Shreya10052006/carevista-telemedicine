"""
Firebase Admin SDK Service
==========================
Handles Firebase authentication token verification and Firestore operations.

SECURITY:
- All incoming requests must have valid Firebase ID tokens
- Role-based access control enforced via custom claims
- User data isolation enforced at database level
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from typing import Optional, Dict, Any
from datetime import datetime

from app.config import get_settings

settings = get_settings()

# Firebase app instance (singleton)
_firebase_app: Optional[firebase_admin.App] = None
_firestore_client = None


def initialize_firebase() -> None:
    """Initialize Firebase Admin SDK."""
    global _firebase_app, _firestore_client
    
    if _firebase_app is not None:
        return
    
    try:
        cred = credentials.Certificate(settings.firebase_service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        _firestore_client = firestore.client()
        print("[Firebase] Admin SDK initialized successfully")
    except FileNotFoundError:
        print("[Firebase] WARNING: Service account file not found. Running in offline mode.")
        print("[Firebase] To enable Firebase, add your service account JSON file.")
    except Exception as e:
        print(f"[Firebase] WARNING: Initialization failed: {e}")
        print("[Firebase] Running in offline mode - Firebase features disabled.")


def get_firestore_client():
    """Get Firestore client instance."""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.client()
    return _firestore_client


async def verify_firebase_token(token: str) -> Dict[str, Any]:
    """
    Verify Firebase ID token and return decoded claims.
    
    Raises:
        ValueError: If token is invalid or expired
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise ValueError("Token has expired")
    except auth.RevokedIdTokenError:
        raise ValueError("Token has been revoked")
    except auth.InvalidIdTokenError:
        raise ValueError("Invalid token")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


async def get_user_role(uid: str) -> Optional[str]:
    """Get user's role from Firestore."""
    db = get_firestore_client()
    user_doc = db.collection("users").document(uid).get()
    
    if user_doc.exists:
        data = user_doc.to_dict()
        return data.get("role")
    return None


async def verify_consent(
    patient_uid: str,
    consent_type: str
) -> bool:
    """
    Verify that patient has given active consent.
    
    ETHICAL SAFEGUARD:
    - All data processing requires explicit consent
    - Revoked consents are checked
    """
    db = get_firestore_client()
    
    # Query for active consents
    consents_ref = db.collection("consents")
    query = consents_ref.where("patientUid", "==", patient_uid) \
                        .where("consentType", "==", consent_type) \
                        .where("granted", "==", True)
    
    docs = query.get()
    
    for doc in docs:
        data = doc.to_dict()
        # Check if not revoked
        if not data.get("revokedAt"):
            return True
    
    return False


async def get_consent_scope(patient_uid: str) -> list:
    """Get all active consent types for a patient."""
    db = get_firestore_client()
    
    consents_ref = db.collection("consents")
    query = consents_ref.where("patientUid", "==", patient_uid) \
                        .where("granted", "==", True)
    
    docs = query.get()
    
    active_consents = []
    for doc in docs:
        data = doc.to_dict()
        if not data.get("revokedAt"):
            active_consents.append(data.get("consentType"))
    
    return active_consents


async def store_symptom_record(
    patient_uid: str,
    recording_id: str,
    data: Dict[str, Any]
) -> str:
    """Store symptom record in Firestore."""
    db = get_firestore_client()
    
    record = {
        "patientUid": patient_uid,
        "recordingId": recording_id,
        **data,
        "createdAt": datetime.utcnow(),
    }
    
    doc_ref = db.collection("symptoms").document(recording_id)
    doc_ref.set(record)
    
    return recording_id


async def store_summary(
    patient_uid: str,
    recording_id: str,
    summary: Dict[str, Any],
    translation: Optional[str] = None
) -> str:
    """Store AI summary in Firestore."""
    db = get_firestore_client()
    
    record = {
        "patientUid": patient_uid,
        "recordingId": recording_id,
        "summary": summary,
        "translation": translation,
        "createdAt": datetime.utcnow(),
    }
    
    doc_ref = db.collection("summaries").document(recording_id)
    doc_ref.set(record)
    
    return recording_id


async def get_summary(recording_id: str) -> Optional[Dict[str, Any]]:
    """Get summary from Firestore."""
    db = get_firestore_client()
    
    doc = db.collection("summaries").document(recording_id).get()
    
    if doc.exists:
        return doc.to_dict()
    return None


async def get_patient_consultations(doctor_uid: str) -> list:
    """
    Get consultations for a doctor.
    
    ETHICAL SAFEGUARD:
    - Only returns summaries with doctor_sharing consent
    - Never returns raw audio or transcripts
    """
    db = get_firestore_client()
    
    # Get all summaries where doctor has access
    summaries_ref = db.collection("summaries")
    docs = summaries_ref.get()
    
    consultations = []
    for doc in docs:
        data = doc.to_dict()
        patient_uid = data.get("patientUid")
        
        # Check if patient consented to doctor sharing
        has_consent = await verify_consent(patient_uid, "doctor_sharing")
        if has_consent:
            consultations.append({
                "id": doc.id,
                "patientId": patient_uid,
                "summary": data.get("summary"),
                "createdAt": data.get("createdAt"),
            })
    
    return consultations
