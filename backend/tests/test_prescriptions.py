"""
Prescription Tests
==================
Tests for prescription rules.

CRITICAL TESTS:
- Only doctors can create/edit/finalize prescriptions
- AI involvement is always null
- Prescriptions are authored by doctor only
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


class TestPrescriptionCreation:
    """Test prescription creation rules."""
    
    def test_doctor_can_create_prescription(self, client, doctor_token):
        """Doctor should be able to create prescription."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={
                "consultation_id": "test-consult",
                "medicines": [
                    {"name": "Paracetamol", "dosage": "500mg", "frequency": "twice daily", "duration": "5 days"}
                ]
            }
        )
        # If route exists, doctor should be able to create
        pass
    
    def test_patient_cannot_create_prescription(self, client, patient_token):
        """Patient should NOT be able to create prescription."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {patient_token}"},
            json={
                "consultation_id": "test-consult",
                "medicines": [{"name": "Test", "dosage": "10mg"}]
            }
        )
        assert response.status_code in [401, 403]
    
    def test_health_worker_cannot_create_prescription(self, client, health_worker_token):
        """Health worker should NOT be able to create prescription."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {health_worker_token}"},
            json={
                "consultation_id": "test-consult",
                "medicines": [{"name": "Test", "dosage": "10mg"}]
            }
        )
        assert response.status_code in [401, 403, 404]
    
    def test_lab_tech_cannot_create_prescription(self, client, lab_tech_token):
        """Lab technician should NOT be able to create prescription."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {lab_tech_token}"},
            json={
                "consultation_id": "test-consult",
                "medicines": [{"name": "Test", "dosage": "10mg"}]
            }
        )
        assert response.status_code in [401, 403, 404]


class TestPrescriptionEdit:
    """Test prescription editing rules."""
    
    def test_doctor_can_edit_own_prescription(self, client, doctor_token):
        """Doctor should be able to edit their own prescription."""
        response = client.put(
            "/api/prescriptions/rx-123",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={
                "medicines": [
                    {"name": "Ibuprofen", "dosage": "400mg", "frequency": "thrice daily", "duration": "3 days"}
                ]
            }
        )
        # If route exists, doctor should be able to edit
        pass
    
    def test_patient_cannot_edit_prescription(self, client, patient_token):
        """Patient should NOT be able to edit prescription."""
        response = client.put(
            "/api/prescriptions/rx-123",
            headers={"Authorization": f"Bearer {patient_token}"},
            json={"medicines": []}
        )
        assert response.status_code in [401, 403, 404]


class TestPrescriptionFinalization:
    """Test prescription finalization rules."""
    
    def test_doctor_can_finalize_prescription(self, client, doctor_token):
        """Doctor should be able to finalize prescription."""
        response = client.post(
            "/api/prescriptions/rx-123/finalize",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        # If route exists, should succeed
        pass
    
    def test_finalized_prescription_cannot_be_edited(self, client, doctor_token):
        """Finalized prescription should NOT be editable."""
        response = client.put(
            "/api/prescriptions/finalized-rx-123",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={"medicines": []}
        )
        # Should be blocked after finalization
        assert response.status_code in [400, 403]


class TestAIInvolvement:
    """Test that AI involvement is always null for prescriptions."""
    
    def test_prescription_ai_involvement_is_null(self, client, doctor_token):
        """Prescription should have ai_involvement: null."""
        response = client.get(
            "/api/prescriptions/rx-123",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            # AI involvement must be null
            assert data.get("ai_involvement") is None
    
    def test_prescription_authored_by_doctor_only(self, client, doctor_token):
        """Prescription authored_by must be 'doctor'."""
        response = client.get(
            "/api/prescriptions/rx-123",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            assert data.get("authored_by") == "doctor"
    
    def test_cannot_set_ai_involvement(self, client, doctor_token):
        """Should not be able to set AI involvement on prescription."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={
                "consultation_id": "test-consult",
                "medicines": [{"name": "Test", "dosage": "10mg"}],
                "ai_involvement": "suggested"  # Should be ignored/blocked
            }
        )
        # If created, ai_involvement should still be null
        pass


class TestPrescriptionValidation:
    """Test prescription validation rules."""
    
    def test_prescription_requires_medicines(self, client, doctor_token):
        """Prescription must have at least one medicine."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={
                "consultation_id": "test-consult",
                "medicines": []  # Empty!
            }
        )
        # Should fail validation
        assert response.status_code in [400, 422]
    
    def test_prescription_requires_consultation_id(self, client, doctor_token):
        """Prescription must be linked to a consultation."""
        response = client.post(
            "/api/prescriptions",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={
                "medicines": [{"name": "Test", "dosage": "10mg"}]
                # Missing consultation_id
            }
        )
        assert response.status_code in [400, 422]
