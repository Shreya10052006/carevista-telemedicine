"""
Translation Service
===================
Google Translate API with caching for UI translation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import logging
import hashlib
import json
import os

router = APIRouter(prefix="/translate", tags=["translation"])
logger = logging.getLogger(__name__)

# In-memory cache (in production, use Redis)
_translation_cache: Dict[str, str] = {}
CACHE_FILE = "translation_cache.json"


def _load_cache():
    """Load translation cache from file."""
    global _translation_cache
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _translation_cache = json.load(f)
            logger.info(f"[Translation] Loaded {len(_translation_cache)} cached translations")
    except Exception as e:
        logger.warning(f"[Translation] Cache load failed: {e}")


def _save_cache():
    """Save translation cache to file."""
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_translation_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"[Translation] Cache save failed: {e}")


# Load cache on startup
_load_cache()


# Pre-loaded translations for common UI strings (offline support)
STATIC_TRANSLATIONS = {
    # Patient Dashboard
    "Dashboard": {"ta": "டாஷ்போர்டு", "hi": "डैशबोर्ड"},
    "Welcome": {"ta": "வரவேற்கிறோம்", "hi": "स्वागत है"},
    "Log Symptoms": {"ta": "அறிகுறிகளை பதிவு செய்", "hi": "लक्षण दर्ज करें"},
    "Talk to Health Assistant": {"ta": "சுகாதார உதவியாளரிடம் பேசு", "hi": "स्वास्थ्य सहायक से बात करें"},
    "Appointments": {"ta": "சந்திப்புகள்", "hi": "अपॉइंटमेंट"},
    "My Records": {"ta": "எனது பதிவுகள்", "hi": "मेरे रिकॉर्ड"},
    "Upload Reports": {"ta": "அறிக்கைகளை பதிவேற்று", "hi": "रिपोर्ट अपलोड करें"},
    "Privacy Settings": {"ta": "தனியுரிமை அமைப்புகள்", "hi": "गोपनीयता सेटिंग्स"},
    "Logout": {"ta": "வெளியேறு", "hi": "लॉग आउट"},
    "Back to Dashboard": {"ta": "டாஷ்போர்டுக்கு திரும்பு", "hi": "डैशबोर्ड पर वापस"},
    "Quick Actions": {"ta": "விரைவு செயல்கள்", "hi": "त्वरित कार्य"},
    "More Options": {"ta": "மேலும் விருப்பங்கள்", "hi": "अधिक विकल्प"},
    
    # Consent
    "I Consent": {"ta": "நான் சம்மதிக்கிறேன்", "hi": "मैं सहमत हूं"},
    "I Do Not Consent": {"ta": "நான் சம்மதிக்கவில்லை", "hi": "मैं सहमत नहीं हूं"},
    "Consent Required": {"ta": "சம்மதம் தேவை", "hi": "सहमति आवश्यक"},
    "You are in control": {"ta": "நீங்கள் கட்டுப்பாட்டில் இருக்கிறீர்கள்", "hi": "आप नियंत्रण में हैं"},
    
    # Status messages
    "Loading": {"ta": "ஏற்றுகிறது", "hi": "लोड हो रहा है"},
    "Error": {"ta": "பிழை", "hi": "त्रुटि"},
    "Success": {"ta": "வெற்றி", "hi": "सफलता"},
    "Offline": {"ta": "ஆஃப்லைன்", "hi": "ऑफ़लाइन"},
    "Online": {"ta": "ஆன்லைன்", "hi": "ऑनलाइन"},
    "Syncing": {"ta": "ஒத்திசைக்கிறது", "hi": "सिंक हो रहा है"},
    
    # Doctor Portal
    "Doctor Portal": {"ta": "மருத்துவர் போர்டல்", "hi": "डॉक्टर पोर्टल"},
    "Patient Queue": {"ta": "நோயாளி வரிசை", "hi": "मरीज कतार"},
    "Consultations": {"ta": "ஆலோசனைகள்", "hi": "परामर्श"},
    "Prescriptions": {"ta": "மருந்து சீட்டுகள்", "hi": "नुस्खे"},
    
    # Health Worker
    "Health Worker": {"ta": "சுகாதார பணியாளர்", "hi": "स्वास्थ्य कार्यकर्ता"},
    "Start Session": {"ta": "அமர்வைத் தொடங்கு", "hi": "सत्र शुरू करें"},
    "End Session": {"ta": "அமர்வை முடி", "hi": "सत्र समाप्त करें"},
    
    # Common
    "Save": {"ta": "சேமி", "hi": "सहेजें"},
    "Cancel": {"ta": "ரத்து செய்", "hi": "रद्द करें"},
    "Submit": {"ta": "சமர்ப்பி", "hi": "जमा करें"},
    "Next": {"ta": "அடுத்து", "hi": "अगला"},
    "Previous": {"ta": "முந்தைய", "hi": "पिछला"},
    "Close": {"ta": "மூடு", "hi": "बंद करें"},
    "Send": {"ta": "அனுப்பு", "hi": "भेजें"},
    "Search": {"ta": "தேடு", "hi": "खोजें"},
    "Filter": {"ta": "வடிகட்டு", "hi": "फ़िल्टर"},
    "View": {"ta": "காண்", "hi": "देखें"},
    "Edit": {"ta": "திருத்து", "hi": "संपादित करें"},
    "Delete": {"ta": "நீக்கு", "hi": "हटाएं"},
    
    # Emergency
    "For Emergencies": {"ta": "அவசர நிலைகளுக்கு", "hi": "आपात स्थितियों के लिए"},
    "This app is for non-emergency care only": {"ta": "இந்த செயலி அவசரமற்ற சிகிச்சைக்கு மட்டுமே", "hi": "यह ऐप केवल गैर-आपातकालीन देखभाल के लिए है"},
    
    # Symptoms
    "Symptom Logbook": {"ta": "அறிகுறி பதிவேடு", "hi": "लक्षण लॉगबुक"},
    "How are you feeling today?": {"ta": "இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?", "hi": "आज आप कैसा महसूस कर रहे हैं?"},
    "Describe your symptoms": {"ta": "உங்கள் அறிகுறிகளை விவரிக்கவும்", "hi": "अपने लक्षणों का वर्णन करें"},
    
    # Banners
    "Consent is required to share your data with doctors": {"ta": "மருத்துவர்களுடன் உங்கள் தரவைப் பகிர்ந்து கொள்ள சம்மதம் தேவை", "hi": "डॉक्टरों के साथ अपना डेटा साझा करने के लिए सहमति आवश्यक है"},
    "Your data is private and secure": {"ta": "உங்கள் தரவு தனிப்பட்டது மற்றும் பாதுகாப்பானது", "hi": "आपका डेटा निजी और सुरक्षित है"},
}


class TranslateRequest(BaseModel):
    text: str
    target_language: str  # 'ta' for Tamil, 'hi' for Hindi
    source_language: str = "en"


class TranslateResponse(BaseModel):
    original: str
    translated: str
    language: str
    cached: bool


class BatchTranslateRequest(BaseModel):
    texts: list[str]
    target_language: str
    source_language: str = "en"


class BatchTranslateResponse(BaseModel):
    translations: Dict[str, str]
    language: str


def _get_cache_key(text: str, target_lang: str) -> str:
    """Generate cache key for translation."""
    return hashlib.md5(f"{text}:{target_lang}".encode()).hexdigest()


def _translate_via_static(text: str, target_lang: str) -> Optional[str]:
    """Check static translations first."""
    if text in STATIC_TRANSLATIONS:
        return STATIC_TRANSLATIONS[text].get(target_lang)
    return None


async def _translate_via_api(text: str, target_lang: str) -> Optional[str]:
    """Translate using Google Translate API or LLM fallback."""
    from app.config import get_settings
    from groq import Groq
    
    settings = get_settings()
    
    # Try LLM translation as fallback
    if settings.groq_api_key:
        try:
            client = Groq(api_key=settings.groq_api_key)
            
            lang_name = "Tamil" if target_lang == "ta" else "Hindi" if target_lang == "hi" else target_lang
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{
                    "role": "user",
                    "content": f"Translate this English text to {lang_name}. Output ONLY the translation, nothing else:\n\n{text}"
                }],
                temperature=0.1,
                max_tokens=200,
            )
            
            translated = response.choices[0].message.content.strip()
            logger.info(f"[Translation] LLM translated: '{text[:30]}...' → '{translated[:30]}...'")
            return translated
            
        except Exception as e:
            logger.warning(f"[Translation] LLM translation failed: {e}")
    
    return None


@router.post("/single", response_model=TranslateResponse)
async def translate_single(request: TranslateRequest):
    """Translate a single text string."""
    
    # Return original if already in target language
    if request.source_language == request.target_language:
        return TranslateResponse(
            original=request.text,
            translated=request.text,
            language=request.target_language,
            cached=True
        )
    
    # Check static translations first
    static_result = _translate_via_static(request.text, request.target_language)
    if static_result:
        return TranslateResponse(
            original=request.text,
            translated=static_result,
            language=request.target_language,
            cached=True
        )
    
    # Check cache
    cache_key = _get_cache_key(request.text, request.target_language)
    if cache_key in _translation_cache:
        return TranslateResponse(
            original=request.text,
            translated=_translation_cache[cache_key],
            language=request.target_language,
            cached=True
        )
    
    # Translate via API
    translated = await _translate_via_api(request.text, request.target_language)
    
    if translated:
        # Cache the result
        _translation_cache[cache_key] = translated
        _save_cache()
        
        return TranslateResponse(
            original=request.text,
            translated=translated,
            language=request.target_language,
            cached=False
        )
    
    # Fallback: return original
    return TranslateResponse(
        original=request.text,
        translated=request.text,
        language=request.target_language,
        cached=False
    )


@router.post("/batch", response_model=BatchTranslateResponse)
async def translate_batch(request: BatchTranslateRequest):
    """Translate multiple text strings in one request."""
    
    translations = {}
    
    for text in request.texts:
        # Check static first
        static_result = _translate_via_static(text, request.target_language)
        if static_result:
            translations[text] = static_result
            continue
        
        # Check cache
        cache_key = _get_cache_key(text, request.target_language)
        if cache_key in _translation_cache:
            translations[text] = _translation_cache[cache_key]
            continue
        
        # Translate via API
        translated = await _translate_via_api(text, request.target_language)
        if translated:
            translations[text] = translated
            _translation_cache[cache_key] = translated
        else:
            translations[text] = text
    
    _save_cache()
    
    return BatchTranslateResponse(
        translations=translations,
        language=request.target_language
    )


@router.get("/static")
async def get_static_translations():
    """Get all static translations (for offline caching)."""
    return STATIC_TRANSLATIONS
