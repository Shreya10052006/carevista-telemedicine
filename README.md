<p align="center">
  <img src="https://img.shields.io/badge/🏥-CareVista-0d9488?style=for-the-badge&labelColor=0f172a" alt="CareVista" />
</p>

<h1 align="center">
  🩺 CareVista
</h1>

<p align="center">
  <strong>Rural Telemedicine Platform — Bridging Healthcare Gaps</strong>
</p>

<p align="center">
  A consent-first, multilingual telemedicine platform designed for rural and underserved communities.<br/>
  Empowering patients, enabling doctors, and facilitating health workers — all in one seamless experience.
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-0d9488?style=flat-square" alt="Features" /></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-059669?style=flat-square" alt="Quick Start" /></a>
  <a href="#-demo-mode"><img src="https://img.shields.io/badge/Demo-d97706?style=flat-square" alt="Demo" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Tech%20Stack-6366f1?style=flat-square" alt="Tech Stack" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20DB-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Whisper-STT-74aa9c?style=flat-square&logo=openai" alt="Whisper" />
  <img src="https://img.shields.io/badge/Groq-AI-f55036?style=flat-square" alt="Groq" />
</p>

---

## 🌟 Why CareVista?

> **800 million+ people** in rural India lack access to quality healthcare. CareVista bridges this gap through technology designed for the realities of rural healthcare delivery.

<table>
<tr>
<td width="50%">

### 🚧 The Problem
- Limited access to specialist doctors
- Language barriers in healthcare
- Low digital literacy among patients
- Poor internet connectivity
- Lack of medical records

</td>
<td width="50%">

### ✅ Our Solution
- Teleconsultation with certified doctors
- Multilingual voice-first interface
- Health worker assisted mode
- Offline-first architecture
- Secure digital health records

</td>
</tr>
</table>

---

## 🏥 Three Portals, One Platform

<table>
<tr>
<td align="center" width="33%">

### 👤 Patient Portal
<img src="https://img.shields.io/badge/Self--Access-0d9488?style=for-the-badge" alt="Patient" />

**For Patients**
- 🎤 Voice symptom logging
- 🌐 Multilingual (EN/HI/TA)
- 🔒 Consent control
- 📞 Video consultations
- 📋 Health logbook

</td>
<td align="center" width="33%">

### 👨‍⚕️ Doctor Portal
<img src="https://img.shields.io/badge/Clinical%20Authority-059669?style=for-the-badge" alt="Doctor" />

**For Doctors**
- 📊 AI-structured summaries
- 🩺 Triage queue
- 💊 Prescription writing
- 📹 Teleconsultation
- 📝 Visit notes

</td>
<td align="center" width="33%">

### 🏪 Health Worker Portal
<img src="https://img.shields.io/badge/Facilitator%20Only-d97706?style=for-the-badge" alt="Health Worker" />

**For Field Staff**
- 👥 Assisted mode
- 📤 Document upload
- ⏱️ Session-based access
- 🔐 No data access
- ✅ Consent capture

</td>
</tr>
</table>

---

## ⚕️ Core Design Principles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   🤖 AI is ASSISTIVE ONLY                                               │
│   ├── No diagnosis, no treatment suggestions                           │
│   ├── Only structures and summarizes patient-reported symptoms         │
│   └── Transparent failures (shows raw transcript, never fabricates)    │
│                                                                         │
│   👨‍⚕️ DOCTORS ARE THE SOLE CLINICAL AUTHORITY                          │
│   ├── AI summaries are for reference only                              │
│   ├── All medical decisions require doctor approval                    │
│   └── Prescriptions only by licensed physicians                        │
│                                                                         │
│   🔒 CONSENT-FIRST & PRIVACY-PRESERVING                                 │
│   ├── Explicit consent before any data processing                      │
│   ├── Granular consent (recording, transcription, sharing)             │
│   └── Patients can revoke consent anytime                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

<table>
<tr>
<th>Layer</th>
<th>Technology</th>
<th>Purpose</th>
</tr>
<tr>
<td><strong>Frontend</strong></td>
<td><img src="https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js" /> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" /></td>
<td>App Router, SSR, PWA-ready</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td><img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" /> <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=flat-square&logo=python&logoColor=white" /></td>
<td>REST API, async processing</td>
</tr>
<tr>
<td><strong>Auth & DB</strong></td>
<td><img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" /></td>
<td>Phone OTP, Email auth, Firestore</td>
</tr>
<tr>
<td><strong>Speech-to-Text</strong></td>
<td><img src="https://img.shields.io/badge/Whisper-74aa9c?style=flat-square&logo=openai&logoColor=white" /></td>
<td>Local STT, multilingual support</td>
</tr>
<tr>
<td><strong>AI Summaries</strong></td>
<td><img src="https://img.shields.io/badge/Groq-f55036?style=flat-square" /> <img src="https://img.shields.io/badge/Gemini-8E75B2?style=flat-square&logo=google&logoColor=white" /></td>
<td>LLaMA 3 (primary), Gemini (fallback)</td>
</tr>
<tr>
<td><strong>Video Calls</strong></td>
<td><img src="https://img.shields.io/badge/Agora-099DFD?style=flat-square" /></td>
<td>WebRTC teleconsultation</td>
</tr>
<tr>
<td><strong>Offline</strong></td>
<td><img src="https://img.shields.io/badge/IndexedDB-green?style=flat-square" /></td>
<td>Local-first data storage</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
✅ Node.js 18+
✅ Python 3.11+

# Optional (for local Whisper)
🎯 NVIDIA GPU with ~1GB VRAM
```

### Installation

<details>
<summary><strong>📦 Frontend Setup</strong></summary>

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your Firebase config
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Start development server
npm run dev
```

**Frontend runs at:** http://localhost:3000

</details>

<details>
<summary><strong>⚙️ Backend Setup</strong></summary>

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your API keys
# GROQ_API_KEY=...
# GEMINI_API_KEY=...

# Start server
uvicorn app.main:app --reload --port 8000
```

**Backend runs at:** http://localhost:8000  
**API Docs at:** http://localhost:8000/docs

</details>

---

## 🎮 Demo Mode

CareVista includes a **safe demo mode** with pre-configured accounts and dummy data.  
Perfect for testing, presentations, and development.

<table>
<tr>
<th>Portal</th>
<th>Login Credentials</th>
<th>Features Available</th>
</tr>
<tr>
<td>👤 <strong>Patient</strong></td>
<td>
Phone: <code>+91 98765 43210</code><br/>
OTP: <code>123456</code>
</td>
<td>Full patient experience with sample logbook</td>
</tr>
<tr>
<td>👨‍⚕️ <strong>Doctor</strong></td>
<td>
Email: <code>demo.doctor@carevista.health</code><br/>
Password: <code>demo123</code>
</td>
<td>Triage queue with sample patients</td>
</tr>
<tr>
<td>🏪 <strong>Health Worker</strong></td>
<td>
Worker ID: <code>HW-DEMO-001</code><br/>
Password: <code>demo123</code>
</td>
<td>Session-based assisted access demo</td>
</tr>
</table>

> ⚠️ **Note**: Demo mode uses simulated data. No real patient information is included.

---

## 📁 Project Structure

```
carevista-telemedicine/
│
├── 📂 frontend/                    # Next.js 14 Application
│   ├── 📂 src/
│   │   ├── 📂 app/                 # App Router pages
│   │   │   ├── 📂 patient/         # Patient portal
│   │   │   ├── 📂 doctor/          # Doctor portal
│   │   │   ├── 📂 health-worker/   # Health worker portal
│   │   │   └── 📂 auth/            # Authentication pages
│   │   ├── 📂 components/          # Reusable React components
│   │   ├── 📂 hooks/               # Custom React hooks
│   │   ├── 📂 contexts/            # React Context providers
│   │   └── 📂 lib/                 # Services & utilities
│   └── 📂 public/                  # Static assets
│
├── 📂 backend/                     # FastAPI Application
│   └── 📂 app/
│       ├── 📂 routers/             # API route handlers
│       │   ├── health.py           # Health check endpoints
│       │   ├── transcription.py    # Whisper STT
│       │   ├── summary.py          # AI summarization
│       │   └── consultation.py     # Teleconsultation
│       └── 📂 services/            # Business logic
│           ├── whisper_service.py  # Speech-to-text
│           ├── groq_service.py     # Groq AI integration
│           └── firebase_admin.py   # Firebase admin SDK
│
├── 📂 docs/                        # Documentation
├── 📂 e2e/                         # End-to-end tests
├── 📄 .gitignore                   # Git ignore rules
└── 📄 README.md                    # This file!
```

---

## 🔐 Environment Variables

<details>
<summary><strong>Frontend (.env.local)</strong></summary>

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Demo Mode (set to 'true' for development)
NEXT_PUBLIC_DEMO_MODE=true

# Agora (for video calls)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
```

</details>

<details>
<summary><strong>Backend (.env)</strong></summary>

```env
# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# AI Services
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Agora WebRTC
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# Optional: Whisper Configuration
WHISPER_MODEL=small
WHISPER_DEVICE=cuda  # or 'cpu'
```

</details>

---

## 🛡️ Ethical Safeguards

CareVista is built with **strict ethical constraints** to ensure patient safety:

| Safeguard | Implementation |
|-----------|----------------|
| 🚫 **No Diagnosis** | AI never suggests diseases, causes, or treatments |
| ✅ **Consent-First** | All processing requires explicit patient consent |
| 👨‍⚕️ **Doctor Authority** | Only licensed doctors provide medical advice |
| 🔍 **Transparency** | AI failures show raw data, never fabrication |
| ⏱️ **Session Access** | Health workers have time-limited, auto-revoked access |
| 🔒 **Data Minimization** | Only essential data collected and stored |

---

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting PRs.

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'feat: add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Healthcare workers** in rural India who inspired this project
- **Open source community** for the amazing tools
- **Firebase, Groq, and Agora** for their excellent APIs

---

<p align="center">
  <strong>Built with ❤️ for Rural Healthcare Accessibility</strong>
</p>

<p align="center">
  <em>Making quality healthcare accessible to underserved communities through technology.</em>
</p>

<p align="center">
  <a href="https://github.com/Shreya10052006/carevista-telemedicine">
    <img src="https://img.shields.io/badge/⭐_Star_this_repo-0d9488?style=for-the-badge" alt="Star" />
  </a>
</p>
