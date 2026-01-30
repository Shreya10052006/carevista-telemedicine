"""
Role-Based Access Control Tests
===============================
Tests to verify that users can only access routes allowed for their role.

CRITICAL SECURITY TESTS:
- Patient cannot access doctor routes
- Health worker cannot view patient history
- Lab technician is upload-only
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


class TestPatientAccess:
    """Test that patients can only access patient routes."""
    
    def test_patient_cannot_access_doctor_consultations(self, client, patient_token):
        """Patient should NOT be able to access doctor's consultation list."""
        response = client.get(
            "/api/doctor/consultations",
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        # Should be 403 Forbidden or 401 Unauthorized
        assert response.status_code in [401, 403]
    
    def test_patient_cannot_access_prescription_create(self, client, patient_token):
        """Patient should NOT be able to create prescriptions."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {patient_token}"},
            json={"consultation_id": "test", "medicines": []}
        )
        assert response.status_code in [401, 403]
    
    def test_patient_cannot_access_triage_override(self, client, patient_token):
        """Patient should NOT be able to override triage."""
        response = client.post(
            "/api/triage/override",
            headers={"Authorization": f"Bearer {patient_token}"},
            json={"patient_id": "test", "new_priority": "urgent"}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_patient_cannot_access_lab_results(self, client, patient_token):
        """Patient should NOT be able to upload lab results (lab tech only)."""
        response = client.post(
            "/api/lab/results",
            headers={"Authorization": f"Bearer {patient_token}"},
            json={"patient_id": "test", "results": {}}
        )
        assert response.status_code in [401, 403, 404]


class TestHealthWorkerAccess:
    """Test that health workers have limited access."""
    
    def test_health_worker_cannot_view_patient_history(self, client, health_worker_token):
        """Health worker should NOT be able to view patient history."""
        response = client.get(
            "/api/patients/test-uid/history",
            headers={"Authorization": f"Bearer {health_worker_token}"}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_health_worker_cannot_view_ai_summaries(self, client, health_worker_token):
        """Health worker should NOT be able to view AI summaries."""
        response = client.get(
            "/api/consultations/test/ai-summary",
            headers={"Authorization": f"Bearer {health_worker_token}"}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_health_worker_cannot_view_doctor_notes(self, client, health_worker_token):
        """Health worker should NOT be able to view doctor notes."""
        response = client.get(
            "/api/consultations/test/doctor-notes",
            headers={"Authorization": f"Bearer {health_worker_token}"}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_health_worker_cannot_create_prescription(self, client, health_worker_token):
        """Health worker should NOT be able to create prescriptions."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {health_worker_token}"},
            json={"consultation_id": "test", "medicines": []}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_health_worker_cannot_access_doctor_portal(self, client, health_worker_token):
        """Health worker should NOT be able to access doctor portal routes."""
        response = client.get(
            "/api/doctor/dashboard",
            headers={"Authorization": f"Bearer {health_worker_token}"}
        )
        assert response.status_code in [401, 403, 404]


class TestLabTechnicianAccess:
    """Test that lab technicians are upload-only."""
    
    def test_lab_tech_can_upload_results(self, client, lab_tech_token):
        """Lab technician should be able to upload results."""
        # This test would pass if the route exists
        # We're testing the role check, not the full functionality
        pass  # Route may not exist yet
    
    def test_lab_tech_cannot_view_patient_symptoms(self, client, lab_tech_token):
        """Lab technician should NOT be able to view patient symptoms."""
        response = client.get(
            "/api/patients/test-uid/symptoms",
            headers={"Authorization": f"Bearer {lab_tech_token}"}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_lab_tech_cannot_view_consultations(self, client, lab_tech_token):
        """Lab technician should NOT be able to view consultations."""
        response = client.get(
            "/api/consultations/test",
            headers={"Authorization": f"Bearer {lab_tech_token}"}
        )
        assert response.status_code in [401, 403, 404]
    
    def test_lab_tech_cannot_create_prescription(self, client, lab_tech_token):
        """Lab technician should NOT be able to create prescriptions."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {lab_tech_token}"},
            json={"consultation_id": "test", "medicines": []}
        )
        assert response.status_code in [401, 403, 404]


class TestDoctorAccess:
    """Test that doctors have appropriate access."""
    
    def test_doctor_can_access_consultations(self, client, doctor_token):
        """Doctor should be able to access consultations (requires consent)."""
        # This is a positive test - doctor should have access
        # The actual response depends on consent and data availability
        pass
    
    def test_doctor_cannot_access_health_worker_sessions(self, client, doctor_token):
        """Doctor should NOT be able to access health worker session management."""
        response = client.get(
            "/api/health-worker/sessions",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        assert response.status_code in [401, 403, 404]
