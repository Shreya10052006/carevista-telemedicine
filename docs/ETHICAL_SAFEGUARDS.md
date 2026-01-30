# CareVista Ethical Safeguards Documentation

## Overview

CareVista is a rural telemedicine platform designed with strict ethical constraints to ensure patient safety and regulatory compliance. This document outlines the safeguards built into the system.

## Core Principles

### 1. THIS IS NOT A DIAGNOSIS SYSTEM

**The system NEVER:**
- ❌ Diagnoses any disease or condition
- ❌ Suggests causes for symptoms
- ❌ Recommends treatments or medications
- ❌ Gives medical advice of any kind
- ❌ Provides probabilities or risk assessments

**The system ONLY:**
- ✅ Structures patient-reported symptoms
- ✅ Summarizes what the patient described
- ✅ Translates between languages
- ✅ Facilitates communication between patient and doctor

### 2. DOCTORS ARE THE ONLY CLINICAL AUTHORITY

- All clinical decisions are made by licensed doctors
- AI summaries are presented as "patient-reported symptoms" only
- Doctors have access to structured summaries, never raw recommendations
- Final visit notes are written by doctors, not AI

### 3. TELEMEDICINE IS NOT EMERGENCY CARE

- Clear disclaimers on all screens
- Users advised to visit nearest hospital for emergencies
- No emergency triage or priority recommendations
- No symptom-to-urgency mapping

## Consent System

### Explicit, Informed Consent

Every data processing action requires explicit patient consent:

1. **Recording Consent** - Before any audio is recorded
2. **Transcription Consent** - Before audio is converted to text
3. **Doctor Sharing Consent** - Before any data is shown to doctors

### Consent Properties

- **Plain Language**: One idea per screen, no legal jargon
- **Voice-Readable**: TTS support for elder accessibility
- **Timestamped**: All consents stored with exact timestamp
- **Revocable**: Patients can revoke consent anytime
- **Granular**: Each consent type is independent

### Implementation

```python
# Every data processing function checks consent
async def process_audio(patient_uid: str, audio: bytes):
    # CONSENT VERIFICATION (mandatory)
    await require_recording_consent(patient_uid)
    await require_transcription_consent(patient_uid)
    
    # Only then proceed with processing
    ...
```

## AI Safeguards

### System Prompt (Hardcoded)

```
You are a medical information organizer.

Your ONLY role is to:
1. Structure patient-reported symptoms
2. Summarize what the patient described

YOU MUST NEVER:
❌ Name or suggest any disease
❌ Suggest any cause for symptoms
❌ Recommend any treatment
❌ Give any medical advice
❌ Provide probabilities or diagnoses
```

### Failover Strategy

1. **Primary AI (Groq LLaMA)** - Uses ethical system prompt
2. **Secondary AI (Gemini)** - Same ethical constraints
3. **Final Fallback** - Raw transcript shown with clear "AI Unavailable" message

The system NEVER silently fails or fabricates data.

## Data Access Controls

### Patient Data Visibility

| Data Type | Patient | Health Worker | Doctor |
|-----------|---------|---------------|--------|
| Audio Recording | ✅ (own) | ❌ | ❌ |
| Raw Transcript | ✅ (own) | ❌ | ❌ |
| Structured Summary | ✅ (own) | ❌ | ✅ (with consent) |
| Doctor Notes | ✅ (own, translated) | ❌ | ✅ (own) |

### Health Worker Mode

Health workers can assist patients but:
- Cannot view patient history without consent
- Cannot see doctor notes
- Cannot access other patients' data
- All actions logged with patient ID

## Offline Behavior

### What Works Offline

- ✅ Recording symptoms (audio/text)
- ✅ Viewing own saved data
- ✅ Consent flow

### What Requires Online

- ❌ AI summarization
- ❌ Transcription
- ❌ Doctor consultations
- ❌ Data sync to server

### Sync Safety

- Local data is never overwritten by server
- User always sees local data first
- Sync conflicts use last-write-wins (user's device wins)

## Code Implementation

Ethical safeguards are enforced at multiple levels:

1. **Frontend**: Consent gates before any recording
2. **Backend**: Consent verification on every API call
3. **AI Layer**: Hardcoded ethical system prompt
4. **Database**: Firestore security rules enforce isolation

## Audit Trail

All significant actions are logged:
- Consent grants and revocations
- Data access by doctors
- AI processing requests
- Teleconsultation sessions

## Regulatory Considerations

This system is designed to comply with:
- Patient data privacy requirements
- Informed consent standards
- Telemedicine disclosure requirements

**Note**: This system should be reviewed by legal/compliance teams before deployment in any jurisdiction.
