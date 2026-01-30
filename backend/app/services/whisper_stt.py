"""
Whisper Speech-to-Text Service
==============================
Local Whisper model for transcribing patient audio.

ETHICAL SAFEGUARD:
- Whisper ONLY transcribes audio to text
- NO interpretation, NO diagnosis, NO medical advice
- Supports multiple Indian languages
"""

import whisper
import tempfile
import os
from typing import Optional
import torch

from app.config import get_settings

settings = get_settings()

# Model instance (singleton)
_whisper_model = None


def get_model():
    """Get or load Whisper model (lazy loading)."""
    global _whisper_model
    
    if _whisper_model is None:
        print(f"[Whisper] Loading {settings.whisper_model} model...")
        
        # Check CUDA availability
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Whisper] Using device: {device}")
        
        _whisper_model = whisper.load_model(settings.whisper_model, device=device)
        print("[Whisper] Model loaded successfully")
    
    return _whisper_model


# Language code mapping
LANGUAGE_MAP = {
    "english": "en",
    "tamil": "ta",
    "hindi": "hi",
    "telugu": "te",
}


async def transcribe_audio(
    audio_bytes: bytes,
    language: str = "english"
) -> dict:
    """
    Transcribe audio to text using local Whisper.
    
    ETHICAL SAFEGUARD:
    - Returns ONLY the raw transcript
    - NO interpretation or analysis
    
    Args:
        audio_bytes: Audio file bytes (WebM, MP3, WAV, etc.)
        language: Language hint for better accuracy
        
    Returns:
        dict with transcript and detected language
    """
    model = get_model()
    
    # Map language to Whisper language code
    whisper_lang = LANGUAGE_MAP.get(language.lower(), "en")
    
    # Write audio to temp file (Whisper requires file path)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        # Transcribe with language hint
        result = model.transcribe(
            tmp_path,
            language=whisper_lang,
            task="transcribe",  # Always transcribe (not translate)
            fp16=torch.cuda.is_available(),  # Use FP16 on GPU
        )
        
        transcript = result.get("text", "").strip()
        detected_language = result.get("language", whisper_lang)
        
        return {
            "transcript": transcript,
            "detected_language": detected_language,
            "segments": result.get("segments", []),
        }
        
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


async def transcribe_audio_file(
    file_path: str,
    language: str = "english"
) -> dict:
    """
    Transcribe audio from file path.
    
    Args:
        file_path: Path to audio file
        language: Language hint
        
    Returns:
        dict with transcript and detected language
    """
    with open(file_path, "rb") as f:
        audio_bytes = f.read()
    
    return await transcribe_audio(audio_bytes, language)


def get_supported_languages() -> list:
    """Get list of supported languages."""
    return list(LANGUAGE_MAP.keys())


def is_model_loaded() -> bool:
    """Check if Whisper model is loaded."""
    return _whisper_model is not None
