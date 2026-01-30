# CareVista Testing Suite

## Quick Start

### Backend Tests (pytest)
```powershell
cd backend
pip install pytest httpx
pytest tests/ -v
```

### Frontend Tests (Playwright)
```powershell
cd e2e
npm install
npx playwright install
npx playwright test
```

---

## Test Structure

### Backend (`backend/tests/`)
| File | Tests |
|------|-------|
| `test_auth.py` | Role-based access control |
| `test_consent.py` | Consent enforcement |
| `test_triage.py` | Triage logic & visibility |
| `test_sessions.py` | Assisted session rules |
| `test_prescriptions.py` | Doctor-only prescriptions |

### Frontend (`e2e/tests/`)
| File | Tests |
|------|-------|
| `page-loads.spec.ts` | All pages load |
| `ui-elements.spec.ts` | TopBar, banners, indicators |
| `patient-flow.spec.ts` | Symptom → Consent → Wait |
| `doctor-flow.spec.ts` | Queue → Summary → Prescription |
| `health-worker-flow.spec.ts` | Session → Upload → Timeout |
| `offline.spec.ts` | Offline persistence |

---

## Run Modes

```powershell
# Headless (CI)
npx playwright test

# Headed (Visual)
npx playwright test --headed

# Interactive UI
npx playwright test --ui

# View Report
npx playwright show-report
```

---

## What's Tested

✅ Role-based route protection  
✅ Consent required for doctor access  
✅ Triage hidden from patients  
✅ Session timeout revokes access  
✅ Prescriptions doctor-only (no AI)  
✅ Offline data persistence  
✅ Compliance banners visible
