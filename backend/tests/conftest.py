"""
CareVista Backend Tests - Configuration
========================================
Shared fixtures and test configuration for pytest.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
import json

# Import the app
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app


# ============================================================
# Mock Firebase Client
# ============================================================

class MockFirestoreDocument:
    def __init__(self, data=None, exists=True):
        self._data = data or {}
        self.exists = exists
        self.id = "mock-doc-id"
    
    def to_dict(self):
        return self._data
    
    def get(self):
        return self


class MockFirestoreCollection:
    def __init__(self, docs=None):
        self._docs = docs or []
    
    def document(self, doc_id):
        return MockFirestoreDocument()
    
    def where(self, field, op, value):
        return self
    
    def get(self):
        return self._docs
    
    def add(self, data):
        return None, MockFirestoreDocument(data)
    
    def set(self, data):
        return None


class MockFirestore:
    def __init__(self):
        self._collections = {}
    
    def collection(self, name):
        return MockFirestoreCollection()


# ============================================================
# Test Fixtures
# ============================================================

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_firestore():
    """Mock Firestore client."""
    return MockFirestore()


@pytest.fixture
def patient_token():
    """Mock JWT token for a patient role."""
    return "mock-patient-token-123"


@pytest.fixture
def doctor_token():
    """Mock JWT token for a doctor role."""
    return "mock-doctor-token-456"


@pytest.fixture
def health_worker_token():
    """Mock JWT token for a health worker role."""
    return "mock-health-worker-token-789"


@pytest.fixture
def lab_tech_token():
    """Mock JWT token for a lab technician role."""
    return "mock-lab-tech-token-abc"


@pytest.fixture
def mock_patient_user():
    """Mock patient user data."""
    return {
        "uid": "patient-uid-123",
        "email": "patient@example.com",
        "role": "patient",
        "displayName": "Test Patient",
    }


@pytest.fixture
def mock_doctor_user():
    """Mock doctor user data."""
    return {
        "uid": "doctor-uid-456",
        "email": "doctor@example.com",
        "role": "doctor",
        "displayName": "Dr. Test",
    }


@pytest.fixture
def mock_health_worker_user():
    """Mock health worker user data."""
    return {
        "uid": "hw-uid-789",
        "email": "hw@example.com",
        "role": "health_worker",
        "displayName": "Test Health Worker",
    }


@pytest.fixture
def mock_lab_tech_user():
    """Mock lab technician user data."""
    return {
        "uid": "lab-uid-abc",
        "email": "lab@example.com",
        "role": "lab_technician",
        "displayName": "Test Lab Tech",
    }


@pytest.fixture
def mock_consultation():
    """Mock consultation data."""
    return {
        "id": "consult-123",
        "patient_uid": "patient-uid-123",
        "doctor_uid": "doctor-uid-456",
        "status": "pending",
        "created_at": datetime.utcnow(),
        "consent_given": True,
        "consent_scope": ["symptoms", "reports"],
    }


@pytest.fixture
def mock_assisted_session():
    """Mock assisted session data."""
    return {
        "id": "session-123",
        "health_worker_uid": "hw-uid-789",
        "patient_uid": "patient-uid-123",
        "status": "active",
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=30),
        "permissions": {
            "can_upload": True,
            "can_log_symptoms": True,
            "can_capture_consent": True,
            "can_view_history": False,
            "can_view_ai_summary": False,
        },
    }


@pytest.fixture
def mock_prescription():
    """Mock prescription data."""
    return {
        "id": "rx-123",
        "consultation_id": "consult-123",
        "patient_uid": "patient-uid-123",
        "doctor_uid": "doctor-uid-456",
        "medicines": [
            {"name": "Paracetamol", "dosage": "500mg", "frequency": "twice daily", "duration": "5 days"}
        ],
        "status": "draft",
        "authored_by": "doctor",
        "ai_involvement": None,
    }
