# CareVista – Rural Telemedicine Platform

[![Built for Rural Healthcare](https://img.shields.io/badge/Built%20For-Rural%20Healthcare-0d9488?style=for-the-badge)](https://github.com)
[![Consent First](https://img.shields.io/badge/Consent-First-059669?style=for-the-badge)](https://github.com)
[![Multilingual](https://img.shields.io/badge/Multilingual-EN%20%7C%20HI%20%7C%20TA-d97706?style=for-the-badge)](https://github.com)

---

## Overview

CareVista is a **consent-first, multilingual telemedicine platform** designed for rural and underserved communities. It supports patient self-access, assisted access via health workers, and doctor-led consultations.

> ⚠️ **IMPORTANT**: This system does NOT provide medical diagnosis or treatment. It only structures and summarizes patient-reported symptoms for doctor review.

---

## Key Portals

| Portal | Description | Key Features |
|--------|-------------|--------------|
| **Patient Portal** | Self-service health management | Voice symptom logging, consent control, teleconsultation |
| **Doctor Portal** | Clinical workspace | Triage queue, AI summaries, prescription writing |
| **Health Worker Portal** | Assisted access for patients | Session-based, upload-only, facilitator role only |

---

## Core Principles

- 🤖 **AI is non-clinical and assistive only** – No diagnosis, no treatment suggestions
- 👨‍⚕️ **Doctors are the sole clinical authority** – AI provides structured summaries only
- 🔒 **Consent-first and privacy-preserving** – Explicit consent for all data processing
- ⏱️ **Session-based access for health workers** – Time-limited, auto-revoked access
- 📡 **Offline and low-bandwidth friendly** – Works in rural connectivity conditions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TypeScript |
| **Backend** | FastAPI, Python 3.11+ |
| **Auth & DB** | Firebase (Phone OTP, Email Auth, Firestore) |
| **AI Summaries** | Groq LLaMA (primary), Gemini (fallback) |
| **Speech-to-Text** | Whisper (local, small model) |
| **Translation** | Google Translate API |
| **Video Calls** | Agora WebRTC |

---

## Demo Mode

This project includes **demo accounts and dummy data** for safe demonstration.  
No real patient data is included.

### Demo Credentials

| Portal | Credentials |
|--------|-------------|
| Patient | Phone: `+91 98765 43210` → OTP: `123456` |
| Doctor | Email: `demo.doctor@carevista.health` / Password: `demo123` |
| Health Worker | Worker ID: `HW-DEMO-001` / Password: `demo123` |

---

## How to Run

### Prerequisites
- Node.js 18+
- Python 3.11+
- NVIDIA GPU with ~1GB VRAM (for Whisper, optional)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase config
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=true
```

### Backend (.env)
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
GROQ_API_KEY=...
GEMINI_API_KEY=...
AGORA_APP_ID=...
AGORA_APP_CERTIFICATE=...
```

---

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Services (Firebase, IndexedDB, API)
│   └── public/            # PWA manifest, icons
│
├── backend/
│   └── app/
│       ├── routers/       # FastAPI route handlers
│       └── services/      # Business logic (Whisper, AI, Firebase)
│
├── docs/                  # Documentation
└── e2e/                   # End-to-end tests
```

---

## Ethical Safeguards

This platform is designed with strict ethical constraints:

1. **No Diagnosis**: AI NEVER suggests diseases, causes, or treatments
2. **Consent-First**: All data processing requires explicit consent
3. **Doctor Authority**: Only licensed doctors provide medical advice
4. **Transparency**: AI failures show raw transcript, never fabricated data
5. **Session-Based Access**: Health workers cannot access patient data outside sessions

---

## License

MIT License - See LICENSE file for details.

---

**Built for rural healthcare accessibility** 🏥

*Making quality healthcare accessible to underserved communities through technology.*
