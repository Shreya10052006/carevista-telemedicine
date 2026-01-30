"""
LLM Service Router
==================
Centralized LLM endpoints for the telemedicine platform.

ALLOWED LLM USES:
✓ Symptom text understanding & structuring
✓ Symptom category classification
✓ Intake summary generation (doctor-only)
✓ Consent text simplification
✓ Translation (as fallback to Google Translate)

FORBIDDEN LLM USES:
✗ Diagnosis
✗ Treatment
✗ Triage decisions
✗ Medical reasoning
✗ Question generation
✗ Prescription logic
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
from groq import Groq
import google.generativeai as genai

from app.config import get_settings

router = APIRouter(prefix="/llm", tags=["llm"])
settings = get_settings()
logger = logging.getLogger(__name__)

# Initialize clients
groq_client: Optional[Groq] = None
gemini_configured = False


def init_clients():
    """Initialize LLM clients."""
    global groq_client, gemini_configured
    
    if settings.groq_api_key and not groq_client:
        groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("[LLM] Groq client initialized")
    
    if settings.gemini_api_key and not gemini_configured:
        genai.configure(api_key=settings.gemini_api_key)
        gemini_configured = True
        logger.info("[LLM] Gemini client initialized")


# ==================== MODELS ====================

class ClassifyRequest(BaseModel):
    symptom_text: str
    language: str = "en"


class ClassifyResponse(BaseModel):
    symptom_category: str
    confidence: str
    ai_role: str = "non_clinical_intake_only"
    ai_disclaimer: str = "Classification is for question routing only, not diagnosis."


class StructureRequest(BaseModel):
    symptom_text: str
    responses: List[Dict[str, str]]  # [{question, answer}, ...]
    language: str = "en"


class StructureResponse(BaseModel):
    chief_complaint: str
    duration: Optional[str]
    severity: Optional[str]
    associated_symptoms: List[str]
    additional_notes: Optional[str]
    ai_role: str = "non_clinical_intake_only"
    ai_disclaimer: str = "Structured for organization, not clinical assessment."


class SummaryRequest(BaseModel):
    structured_intake: Dict[str, Any]
    patient_name: Optional[str] = "Patient"


class SummaryResponse(BaseModel):
    summary_text: str
    ai_role: str = "non_clinical_intake_only"
    ai_disclaimer: str = "Non-clinical, assistive only. Doctor is sole clinical authority."


class ConsentRequest(BaseModel):
    legal_text: str
    target_language: str = "en"


class ConsentResponse(BaseModel):
    simplified_text: str
    ai_role: str = "non_clinical_intake_only"
    ai_disclaimer: str = "Simplified for readability. Original legal terms apply."


class TranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str


class TranslateResponse(BaseModel):
    translated_text: str
    method: str  # "google_translate" or "llm_fallback"


# ==================== SYMPTOM CATEGORIES ====================

VALID_CATEGORIES = [
    "pain",
    "fever",
    "gastrointestinal",
    "respiratory",
    "skin",
    "menstrual",
    "general"
]


# ==================== ENDPOINTS ====================

@router.post("/classify-symptoms", response_model=ClassifyResponse)
async def classify_symptoms(request: ClassifyRequest):
    """
    Classify symptom text into a predefined category.
    
    LLM ROLE: Understanding natural language → map to fixed category
    LLM MUST NOT: Diagnose, suggest treatment, or generate questions
    """
    init_clients()
    
    prompt = f"""You are a medical intake classifier. Your ONLY job is to classify patient symptoms into ONE category.

VALID CATEGORIES (choose exactly one):
- pain: headaches, body aches, joint pain, cramps
- fever: temperature, chills, sweating
- gastrointestinal: stomach, nausea, vomiting, diarrhea, digestion
- respiratory: cough, breathing, chest, throat, congestion
- skin: rash, itching, swelling, bumps
- menstrual: period-related symptoms
- general: anything else

YOU MUST NOT:
- Diagnose any condition
- Name any disease
- Suggest any treatment

Patient said: "{request.symptom_text}"

Respond with ONLY valid JSON:
{{"symptom_category": "category_name", "confidence": "high/medium/low"}}"""

    try:
        if groq_client:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=100,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            
            # Validate category
            category = data.get("symptom_category", "general").lower()
            if category not in VALID_CATEGORIES:
                category = "general"
            
            logger.info(f"[LLM] Classified '{request.symptom_text[:50]}...' as '{category}'")
            
            return ClassifyResponse(
                symptom_category=category,
                confidence=data.get("confidence", "medium")
            )
    except Exception as e:
        logger.warning(f"[LLM] Groq classification failed: {e}")
    
    # Fallback to Gemini
    try:
        if gemini_configured:
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config={"temperature": 0.1, "max_output_tokens": 100}
            )
            response = model.generate_content(prompt)
            data = json.loads(response.text)
            category = data.get("symptom_category", "general").lower()
            if category not in VALID_CATEGORIES:
                category = "general"
            
            return ClassifyResponse(
                symptom_category=category,
                confidence=data.get("confidence", "medium")
            )
    except Exception as e:
        logger.warning(f"[LLM] Gemini classification failed: {e}")
    
    # Final fallback: keyword-based
    logger.warning("[LLM] All LLM providers failed, using keyword fallback")
    return ClassifyResponse(
        symptom_category="general",
        confidence="low"
    )


@router.post("/structure-intake", response_model=StructureResponse)
async def structure_intake(request: StructureRequest):
    """
    Structure free-text patient input into organized fields.
    
    LLM ROLE: Extract and organize information
    LLM MUST NOT: Diagnose, interpret medically, or add information
    """
    init_clients()
    
    # Format responses for context
    qa_text = "\n".join([
        f"Q: {r['question']}\nA: {r['answer']}"
        for r in request.responses
    ])
    
    prompt = f"""You are a medical intake organizer. Structure the patient's symptoms into clear fields.

YOU MUST:
- Extract chief complaint in patient's own words
- Extract duration if mentioned
- Extract severity descriptors
- List any associated symptoms

YOU MUST NOT:
- Diagnose ANY condition
- Name ANY disease
- Suggest ANY treatment
- Interpret symptoms medically

Patient's initial description: "{request.symptom_text}"

Follow-up Q&A:
{qa_text}

Respond with ONLY valid JSON:
{{
  "chief_complaint": "main issue in patient's words",
  "duration": "when it started / how long",
  "severity": "patient's description of intensity",
  "associated_symptoms": ["symptom1", "symptom2"],
  "additional_notes": "any other relevant details"
}}"""

    try:
        if groq_client:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
            data = json.loads(response.choices[0].message.content)
            
            logger.info("[LLM] Structured intake successfully")
            
            return StructureResponse(
                chief_complaint=data.get("chief_complaint", request.symptom_text),
                duration=data.get("duration"),
                severity=data.get("severity"),
                associated_symptoms=data.get("associated_symptoms", []),
                additional_notes=data.get("additional_notes")
            )
    except Exception as e:
        logger.warning(f"[LLM] Structure intake failed: {e}")
    
    # Fallback: return raw data
    return StructureResponse(
        chief_complaint=request.symptom_text,
        duration=None,
        severity=None,
        associated_symptoms=[],
        additional_notes="LLM structuring unavailable"
    )


@router.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """
    Generate a concise intake summary for doctors.
    
    LLM ROLE: Summarize facts neutrally in professional language
    LLM MUST NOT: Diagnose, rank severity, or suggest urgency
    """
    init_clients()
    
    prompt = f"""You are a medical intake summarizer. Create a brief, professional summary for a doctor.

YOU MUST:
- Summarize facts neutrally
- Use professional but non-clinical language
- Be concise (2-3 sentences)

YOU MUST NOT:
- Diagnose or suggest any condition
- Rank severity or urgency
- Recommend any treatment

Intake data:
{json.dumps(request.structured_intake, indent=2)}

Write a brief summary paragraph for the doctor (no headers, no bullet points):"""

    try:
        if groq_client:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200,
            )
            summary = response.choices[0].message.content.strip()
            
            logger.info("[LLM] Generated summary successfully")
            
            return SummaryResponse(summary_text=summary)
    except Exception as e:
        logger.warning(f"[LLM] Summary generation failed: {e}")
    
    # Fallback
    return SummaryResponse(
        summary_text=f"Patient reports: {request.structured_intake.get('chief_complaint', 'See raw intake data')}"
    )


@router.post("/simplify-consent", response_model=ConsentResponse)
async def simplify_consent(request: ConsentRequest):
    """
    Simplify legal consent text into plain language.
    
    LLM ROLE: Preserve meaning, improve readability
    LLM MUST NOT: Change meaning, persuade, or add content
    """
    init_clients()
    
    prompt = f"""Simplify this legal consent text into plain, patient-friendly language.

RULES:
- Preserve EXACT meaning
- Use simple words
- Be neutral (don't persuade or nudge)
- Keep it short

Original text:
"{request.legal_text}"

Write the simplified version:"""

    try:
        if groq_client:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=300,
            )
            simplified = response.choices[0].message.content.strip()
            
            logger.info("[LLM] Simplified consent text")
            
            return ConsentResponse(simplified_text=simplified)
    except Exception as e:
        logger.warning(f"[LLM] Consent simplification failed: {e}")
    
    # Fallback: return original
    return ConsentResponse(simplified_text=request.legal_text)


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Translate text between languages.
    
    Primary: Google Translate API (deterministic, safe)
    Fallback: LLM translation
    """
    init_clients()
    
    if request.source_language == request.target_language:
        return TranslateResponse(
            translated_text=request.text,
            method="no_translation_needed"
        )
    
    # TODO: Integrate Google Translate API here
    # For now, use LLM as fallback
    
    prompt = f"""Translate this text from {request.source_language} to {request.target_language}.
Only output the translation, nothing else.

Text: "{request.text}"

Translation:"""

    try:
        if groq_client:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500,
            )
            translated = response.choices[0].message.content.strip()
            
            logger.info(f"[LLM] Translated: {request.source_language} → {request.target_language}")
            
            return TranslateResponse(
                translated_text=translated,
                method="llm_fallback"
            )
    except Exception as e:
        logger.warning(f"[LLM] Translation failed: {e}")
    
    # Final fallback
    return TranslateResponse(
        translated_text=request.text,
        method="fallback_original"
    )


@router.get("/health")
async def llm_health():
    """Check LLM service health."""
    init_clients()
    
    return {
        "groq_available": groq_client is not None,
        "gemini_available": gemini_configured,
        "groq_key_set": bool(settings.groq_api_key),
        "gemini_key_set": bool(settings.gemini_api_key),
    }
