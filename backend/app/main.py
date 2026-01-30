"""
CareVista Backend - Main Application
=====================================
FastAPI application entry point.

ETHICAL SAFEGUARDS:
1. This system NEVER diagnoses diseases
2. This system NEVER suggests treatment or medication
3. This system NEVER gives medical advice
4. AI is ONLY for structuring, summarizing, and translating
5. Doctors are the ONLY clinical authority
6. Telemedicine is NOT emergency care
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.config import get_settings
from app.services.firebase_admin import initialize_firebase
from app.routers import auth, symptoms, consultations, telemed
# Phase 3 routers
from app.routers import vitals, reports, temporary_patients, chatbot
# Compliance enhancement routers
from app.routers import triage, lab
# Doctor portal routers
from app.routers import prescriptions, discussions
# Health worker portal router
from app.routers import health_worker
# LLM service router
from app.routers import llm
# Translation service router
from app.routers import translation

# Load environment variables
load_dotenv()

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("[CareVista] Starting up...")
    initialize_firebase()
    print("[CareVista] Firebase initialized")
    
    yield
    
    # Shutdown
    print("[CareVista] Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="CareVista Telemedicine API",
    description="""
    Rural telemedicine platform backend.
    
    **IMPORTANT**: This system does NOT provide medical diagnosis or treatment.
    It only structures and summarizes patient-reported symptoms for doctor review.
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(symptoms.router, prefix="/api/symptoms", tags=["Symptoms"])
app.include_router(consultations.router, prefix="/api/consultations", tags=["Consultations"])
app.include_router(telemed.router, prefix="/api/telemed", tags=["Teleconsultation"])

# Phase 3 routers
app.include_router(vitals.router, prefix="/api", tags=["Vitals"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(temporary_patients.router, prefix="/api", tags=["Temporary Patients"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])

# Compliance enhancement routers (triage + lab technician)
app.include_router(triage.router, prefix="/api", tags=["Triage"])
app.include_router(lab.router, prefix="/api", tags=["Lab Technician"])

# Doctor portal routers
app.include_router(prescriptions.router, prefix="/api", tags=["Prescriptions"])
app.include_router(discussions.router, prefix="/api", tags=["Discussions"])

# Health worker portal router
app.include_router(health_worker.router, prefix="/api", tags=["Health Worker"])

# LLM service router
app.include_router(llm.router, prefix="/api", tags=["LLM Service"])

# Translation service router
app.include_router(translation.router, prefix="/api", tags=["Translation"])


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "name": "CareVista Telemedicine API",
        "version": "1.0.0",
        "status": "healthy",
        "notice": "This system does NOT provide medical diagnosis. Consult a doctor for medical advice.",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
