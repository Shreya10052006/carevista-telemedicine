"""
Symptoms Router
===============
Handles symptom upload, transcription, and summarization.

ETHICAL SAFEGUARD:
- Consent verified before any processing
- AI ONLY summarizes, NEVER diagnoses
- Raw transcript shown if AI fails
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import logging

from app.routers.auth import get_current_user
from app.services.consent_service import require_recording_consent, can_process_audio
from app.services.firebase_admin import store_symptom_record, store_summary, get_summary
from app.services.whisper_stt import transcribe_audio
from app.services.ai_orchestrator import generate_summary, translate_text

router = APIRouter()
logger = logging.getLogger(__name__)


class SymptomUploadResponse(BaseModel):
    id: str
    status: str
    message: str


class TextSymptomRequest(BaseModel):
    symptom_id: str
    text: str
    language: str
    consent_id: str


class StructuredSummary(BaseModel):
    chiefComplaint: str
    symptomTimeline: str
    severity: str
    pastHistory: Optional[str] = None
    additionalNotes: Optional[str] = None


class SummaryResponse(BaseModel):
    id: str
    summary: Optional[StructuredSummary] = None
    translation: Optional[str] = None
    translationLanguage: Optional[str] = None
    aiFailed: bool = False
    rawTranscript: Optional[str] = None


@router.post("/upload", response_model=SymptomUploadResponse)
async def upload_recording(
    recording_id: str = Form(...),
    language: str = Form(...),
    consent_id: str = Form(...),
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Upload audio recording for processing.
    
    ETHICAL SAFEGUARD:
    - Consent verified before processing
    - Audio transcribed locally via Whisper
    - Summary generated with strict ethical constraints
    """
    patient_uid = user["uid"]
    
    # Verify consent
    try:
        await require_recording_consent(patient_uid)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    # Check if can process (has transcription consent too)
    can_process = await can_process_audio(patient_uid)
    
    try:
        # Read audio bytes
        audio_bytes = await audio.read()
        
        # Store record in Firestore
        await store_symptom_record(
            patient_uid=patient_uid,
            recording_id=recording_id,
            data={
                "language": language,
                "consentId": consent_id,
                "status": "uploaded",
                "hasAudio": True,
            },
        )
        
        # If can process, do transcription and summarization
        if can_process:
            # Transcribe with Whisper
            logger.info(f"[Symptoms] Transcribing recording {recording_id}")
            transcription = await transcribe_audio(audio_bytes, language)
            transcript = transcription.get("transcript", "")
            
            # Generate AI summary (with ethical constraints)
            logger.info(f"[Symptoms] Generating summary for {recording_id}")
            ai_result = await generate_summary(transcript)
            
            # Translate if needed
            translation = None
            if language.lower() != "english" and ai_result.get("summary"):
                # Format summary for translation
                summary_text = _format_summary_for_translation(ai_result["summary"])
                translation = await translate_text(summary_text, "english", language)
            
            # Store summary
            await store_summary(
                patient_uid=patient_uid,
                recording_id=recording_id,
                summary=ai_result.get("summary"),
                translation=translation,
            )
            
            return SymptomUploadResponse(
                id=recording_id,
                status="completed",
                message="Recording processed successfully",
            )
        else:
            return SymptomUploadResponse(
                id=recording_id,
                status="uploaded",
                message="Recording saved. Processing requires transcription consent.",
            )
            
    except Exception as e:
        logger.error(f"[Symptoms] Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload-text", response_model=SymptomUploadResponse)
async def upload_text_symptom(
    request: TextSymptomRequest,
    user: dict = Depends(get_current_user),
):
    """
    Upload text symptom description.
    """
    patient_uid = user["uid"]
    
    # Verify consent
    try:
        await require_recording_consent(patient_uid)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    try:
        # Store record
        await store_symptom_record(
            patient_uid=patient_uid,
            recording_id=request.symptom_id,
            data={
                "language": request.language,
                "consentId": request.consent_id,
                "status": "completed",
                "hasAudio": False,
                "text": request.text,
            },
        )
        
        # Generate AI summary
        ai_result = await generate_summary(request.text)
        
        # Translate if needed
        translation = None
        if request.language.lower() != "english" and ai_result.get("summary"):
            summary_text = _format_summary_for_translation(ai_result["summary"])
            translation = await translate_text(summary_text, "english", request.language)
        
        # Store summary
        await store_summary(
            patient_uid=patient_uid,
            recording_id=request.symptom_id,
            summary=ai_result.get("summary"),
            translation=translation,
        )
        
        return SymptomUploadResponse(
            id=request.symptom_id,
            status="completed",
            message="Symptom saved and processed",
        )
        
    except Exception as e:
        logger.error(f"[Symptoms] Text upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{recording_id}/summary", response_model=SummaryResponse)
async def get_recording_summary(
    recording_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Get processed summary for a recording.
    """
    summary_data = await get_summary(recording_id)
    
    if not summary_data:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    # Verify ownership
    if summary_data.get("patientUid") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    summary = summary_data.get("summary")
    
    return SummaryResponse(
        id=recording_id,
        summary=StructuredSummary(**summary) if summary else None,
        translation=summary_data.get("translation"),
        aiFailed=summary is None,
        rawTranscript=summary_data.get("rawTranscript"),
    )


def _format_summary_for_translation(summary: dict) -> str:
    """Format summary dict as readable text for translation."""
    parts = []
    if summary.get("chiefComplaint"):
        parts.append(f"Main problem: {summary['chiefComplaint']}")
    if summary.get("symptomTimeline"):
        parts.append(f"Timeline: {summary['symptomTimeline']}")
    if summary.get("severity"):
        parts.append(f"Severity: {summary['severity']}")
    if summary.get("pastHistory"):
        parts.append(f"Past history: {summary['pastHistory']}")
    return ". ".join(parts)
