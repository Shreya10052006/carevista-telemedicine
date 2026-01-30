"""
Consent Verification Service
============================
Ensures all data processing respects patient consent.

ETHICAL SAFEGUARD:
- NO processing without explicit consent
- Consent verification before every operation
- Consent can be revoked anytime
"""

from typing import Optional
from app.services.firebase_admin import verify_consent, get_consent_scope


async def require_recording_consent(patient_uid: str) -> bool:
    """
    Verify patient has consented to audio recording.
    Raises exception if not consented.
    """
    has_consent = await verify_consent(patient_uid, "recording")
    if not has_consent:
        raise PermissionError(
            "Patient has not consented to audio recording. "
            "Recording consent is required before saving audio."
        )
    return True


async def require_transcription_consent(patient_uid: str) -> bool:
    """
    Verify patient has consented to transcription.
    Raises exception if not consented.
    """
    has_consent = await verify_consent(patient_uid, "transcription")
    if not has_consent:
        raise PermissionError(
            "Patient has not consented to transcription. "
            "Transcription consent is required before processing audio."
        )
    return True


async def require_doctor_sharing_consent(patient_uid: str) -> bool:
    """
    Verify patient has consented to sharing with doctors.
    Raises exception if not consented.
    """
    has_consent = await verify_consent(patient_uid, "doctor_sharing")
    if not has_consent:
        raise PermissionError(
            "Patient has not consented to doctor sharing. "
            "Doctor sharing consent is required before showing to doctor."
        )
    return True


async def get_patient_consent_scope(patient_uid: str) -> list:
    """
    Get all active consents for a patient.
    Used to determine what data can be shown to doctors.
    """
    return await get_consent_scope(patient_uid)


async def can_process_audio(patient_uid: str) -> bool:
    """
    Check if audio can be processed (needs recording + transcription consent).
    """
    try:
        await require_recording_consent(patient_uid)
        await require_transcription_consent(patient_uid)
        return True
    except PermissionError:
        return False


async def can_share_with_doctor(patient_uid: str) -> bool:
    """
    Check if data can be shared with doctor.
    """
    try:
        await require_doctor_sharing_consent(patient_uid)
        return True
    except PermissionError:
        return False
