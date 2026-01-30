"""
Chatbot Router (Phase 3)
========================
Conversational AI for symptom intake and coordination.

╔══════════════════════════════════════════════════════════════════╗
║                    ETHICAL SAFEGUARDS                             ║
╠══════════════════════════════════════════════════════════════════╣
║ This chatbot is STRICTLY LIMITED to:                              ║
║ ✓ Helping patients describe symptoms                              ║
║ ✓ Asking non-medical clarification questions                      ║
║ ✓ Explaining consent steps                                        ║
║ ✓ Helping schedule teleconsultations                              ║
║                                                                   ║
║ EXPLICITLY FORBIDDEN:                                             ║
║ ✗ Disease names or diagnoses                                      ║
║ ✗ Treatment advice or medications                                 ║
║ ✗ Emergency guidance                                              ║
║ ✗ Risk probabilities                                              ║
║ ✗ Any medical conclusions                                         ║
╚══════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os

from app.config import get_settings

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

settings = get_settings()


# ETHICAL SAFEGUARD: System prompt with hard blocks
SYSTEM_PROMPT = """You are a friendly healthcare intake assistant for CareVista, a rural telemedicine platform.

YOUR ROLE IS STRICTLY LIMITED TO:
✓ Helping patients describe their symptoms clearly
✓ Asking follow-up questions about duration, severity, and location of symptoms
✓ Explaining the consent process
✓ Helping schedule teleconsultations
✓ Providing emotional support and reassurance

YOU ARE ABSOLUTELY FORBIDDEN FROM:
✗ Mentioning ANY disease names or diagnoses
✗ Suggesting ANY treatments, medications, or remedies
✗ Providing ANY medical advice whatsoever
✗ Discussing emergency symptoms or guidance
✗ Giving ANY risk probabilities or prognoses
✗ Making ANY medical conclusions

If a user asks for medical advice, diagnosis, or treatment suggestions, you MUST respond:
"I cannot provide medical advice or diagnoses. Only your doctor can help with that. I'm here to help you describe your symptoms so you can discuss them with your doctor."

If a user describes an emergency, you MUST respond:
"This sounds like it may need urgent attention. Please contact emergency services immediately or go to your nearest hospital. This app is not for emergencies."

Your responses should be:
- Simple and clear (for low-literacy users)
- Warm and supportive
- Focused on gathering symptom descriptions
- Never medical or diagnostic

Example good questions:
- "How long have you been feeling this way?"
- "Can you describe where it hurts?"
- "Does it get better or worse at certain times?"
- "Is there anything else you'd like to tell your doctor?"

Remember: You are NOT a doctor. You are an assistant helping patients describe symptoms."""


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    language: str = "en"


class ChatResponse(BaseModel):
    response: str
    extracted_symptoms: Optional[List[str]] = None
    # COMPLIANCE: Machine-readable flag for AI role
    ai_role: str = "non_clinical_intake_only"
    ai_disclaimer: str = "This is assistive information only, not medical advice."


@router.post("/intake", response_model=ChatResponse)
async def intake_chat(request: ChatRequest):
    """
    Process intake chatbot message.
    
    ETHICAL SAFEGUARD:
    - Hard-coded system prompt blocks medical advice
    - No diagnosis, treatment, or emergency guidance
    - Only helps describe symptoms
    """
    try:
        # Use Gemini for chat
        import google.generativeai as genai
        
        if not settings.gemini_api_key:
            # Fallback response if no API key
            return ChatResponse(
                response="I'm here to help you describe your symptoms. Could you tell me more about how you're feeling?",
                extracted_symptoms=None
            )
        
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Build conversation history
        formatted_history = SYSTEM_PROMPT + "\n\n"
        for msg in request.history[-6:]:  # Last 6 messages for context
            role = "Patient" if msg.role == "user" else "Assistant"
            formatted_history += f"{role}: {msg.content}\n"
        
        formatted_history += f"Patient: {request.message}\nAssistant:"
        
        # Generate response with safety settings
        response = model.generate_content(
            formatted_history,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 200,
            }
        )
        
        response_text = response.text.strip()
        
        # ETHICAL SAFEGUARD: Double-check response for forbidden content
        forbidden_patterns = [
            "you might have", "could be", "sounds like",
            "take medicine", "take medication", "take aspirin",
            "you should take", "diagnosis", "treatment",
            "prescribe", "prescription"
        ]
        
        for pattern in forbidden_patterns:
            if pattern.lower() in response_text.lower():
                response_text = (
                    "I'm here to help you describe your symptoms so you can "
                    "discuss them with your doctor. Could you tell me more about "
                    "what you're experiencing?"
                )
                break
        
        return ChatResponse(
            response=response_text,
            extracted_symptoms=None  # Could add symptom extraction later
        )
        
    except Exception as e:
        print(f"[Chatbot] Error: {e}")
        return ChatResponse(
            response=(
                "I apologize, but I had trouble understanding. "
                "Could you please describe your symptoms again?"
            ),
            extracted_symptoms=None
        )
