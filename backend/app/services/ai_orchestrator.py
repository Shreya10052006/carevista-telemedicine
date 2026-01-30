"""
AI Orchestrator Service
=======================
Handles AI-generated summaries with ethical guardrails and failover logic.

ETHICAL SAFEGUARDS - CRITICAL:
=================================
1. This system NEVER diagnoses diseases
2. This system NEVER suggests treatment or medication
3. This system NEVER gives medical advice
4. AI is ONLY for structuring and summarizing patient-reported symptoms
5. Doctors are the ONLY clinical authority
6. If AI fails completely, raw transcript is returned

FAILOVER LOGIC:
- Primary: Groq LLaMA
- Secondary: Gemini
- Final fallback: Return raw transcript with failure flag
"""

import json
import logging
from typing import Optional, Dict, Any
from groq import Groq
import google.generativeai as genai

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Initialize clients
groq_client: Optional[Groq] = None
gemini_configured = False


def init_groq_client():
    """Initialize Groq client."""
    global groq_client
    if settings.groq_api_key and not groq_client:
        groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("[AI] Groq client initialized")


def init_gemini_client():
    """Initialize Gemini client."""
    global gemini_configured
    if settings.gemini_api_key and not gemini_configured:
        genai.configure(api_key=settings.gemini_api_key)
        gemini_configured = True
        logger.info("[AI] Gemini client initialized")


# =============================================
# ETHICAL SYSTEM PROMPT - DO NOT MODIFY
# =============================================
SYSTEM_PROMPT = """You are a medical information organizer for a rural telemedicine platform.

Your ONLY role is to:
1. Structure patient-reported symptoms into a clear, organized format
2. Summarize what the patient described in their own words
3. Extract timeline information if mentioned

YOU MUST NEVER:
❌ Name or suggest any disease or condition
❌ Suggest any cause for symptoms
❌ Recommend any treatment, medication, or remedy
❌ Give any medical advice whatsoever
❌ Provide probabilities or diagnoses
❌ Speculate about what might be wrong
❌ Suggest when to see a doctor (that decision is already made)

OUTPUT FORMAT (JSON only, no extra text):
{
  "chiefComplaint": "Brief description of main issue in patient's words",
  "symptomTimeline": "When symptoms started and any progression",
  "severity": "Patient's own description of how severe it feels",
  "pastHistory": "Only if patient mentioned relevant history and consented",
  "additionalNotes": "Any other details patient mentioned"
}

Remember: You are ONLY organizing information, NOT providing medical assessment."""


async def generate_summary(transcript: str) -> Dict[str, Any]:
    """
    Generate structured summary with ethical guardrails.
    
    FAILOVER: Groq LLaMA → Gemini → Raw Transcript
    
    Args:
        transcript: Raw patient transcript
        
    Returns:
        Structured summary or raw transcript if AI fails
    """
    # Initialize clients if needed
    init_groq_client()
    init_gemini_client()
    
    user_prompt = f"""Patient said:
\"\"\"
{transcript}
\"\"\"

Organize this into the structured format. Remember: ONLY organize, do NOT diagnose or advise."""
    
    # Try primary LLM (Groq LLaMA)
    try:
        result = await _call_groq(user_prompt)
        if result:
            return {
                "summary": result,
                "ai_provider": "groq",
                "ai_failed": False,
                # COMPLIANCE: Machine-readable flags
                "ai_role": "non_clinical_intake_only",
                "ai_disclaimer": "Non-clinical, assistive only. Doctor is sole clinical authority.",
            }
    except Exception as e:
        logger.warning(f"[AI] Groq failed: {e}")
    
    # Try secondary LLM (Gemini)
    try:
        result = await _call_gemini(user_prompt)
        if result:
            return {
                "summary": result,
                "ai_provider": "gemini",
                "ai_failed": False,
                # COMPLIANCE: Machine-readable flags
                "ai_role": "non_clinical_intake_only",
                "ai_disclaimer": "Non-clinical, assistive only. Doctor is sole clinical authority.",
            }
    except Exception as e:
        logger.warning(f"[AI] Gemini failed: {e}")
    
    # Final fallback: Return raw transcript
    logger.error("[AI] All AI providers failed. Returning raw transcript.")
    return {
        "summary": None,
        "raw_transcript": transcript,
        "ai_provider": None,
        "ai_failed": True,
        "message": "AI summary unavailable. Doctor will see raw transcript.",
        # COMPLIANCE: Machine-readable flags
        "ai_role": "non_clinical_intake_only",
        "ai_disclaimer": "Non-clinical, assistive only. Doctor is sole clinical authority.",
    }


async def _call_groq(user_prompt: str) -> Optional[Dict[str, str]]:
    """Call Groq LLaMA for summarization."""
    global groq_client
    
    if not groq_client:
        raise ValueError("Groq client not initialized")
    
    # MODEL LOCK: Groq LLaMA 3.8 70B Instruct - DO NOT CHANGE
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # LOCKED: Primary summarization model
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,  # Low temperature for consistency
        max_tokens=500,
        response_format={"type": "json_object"},
    )
    
    content = response.choices[0].message.content
    return _parse_json_response(content)


async def _call_gemini(user_prompt: str) -> Optional[Dict[str, str]]:
    """Call Gemini for summarization (fallback)."""
    if not gemini_configured:
        raise ValueError("Gemini client not initialized")
    
    # MODEL LOCK: Gemini 2.5 Flash - FALLBACK ONLY - DO NOT CHANGE
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",  # LOCKED: Fallback model only
        system_instruction=SYSTEM_PROMPT,
        generation_config={
            "temperature": 0.3,
            "max_output_tokens": 500,
            "response_mime_type": "application/json",
        },
    )
    
    response = model.generate_content(user_prompt)
    content = response.text
    return _parse_json_response(content)


def _parse_json_response(content: str) -> Optional[Dict[str, str]]:
    """Parse JSON response from AI."""
    try:
        # Try to parse as JSON
        data = json.loads(content)
        
        # Validate required fields
        if "chiefComplaint" not in data:
            raise ValueError("Missing chiefComplaint field")
        
        return {
            "chiefComplaint": data.get("chiefComplaint", ""),
            "symptomTimeline": data.get("symptomTimeline", ""),
            "severity": data.get("severity", ""),
            "pastHistory": data.get("pastHistory"),
            "additionalNotes": data.get("additionalNotes"),
        }
    except json.JSONDecodeError as e:
        logger.error(f"[AI] JSON parse error: {e}")
        return None
    except Exception as e:
        logger.error(f"[AI] Response parse error: {e}")
        return None


async def translate_text(
    text: str,
    source_language: str,
    target_language: str
) -> Optional[str]:
    """
    Translate text between languages.
    Uses AI for translation when on-device translation is not available.
    """
    init_groq_client()
    
    if source_language == target_language:
        return text
    
    prompt = f"""Translate the following text from {source_language} to {target_language}.
Only output the translation, nothing else.

Text:
{text}"""
    
    try:
        if groq_client:
            # MODEL LOCK: Same model for translation
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # LOCKED
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"[AI] Translation failed: {e}")
    
    return None
