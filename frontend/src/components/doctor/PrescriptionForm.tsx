'use client';

/**
 * Digital Prescription Form Component
 * ====================================
 * Doctor-only prescription creation.
 * 
 * COMPLIANCE NOTES:
 * - Only authenticated doctors can create prescriptions
 * - AI has NO role in prescribing (no auto-populate, no suggestions)
 * - Prescriptions are doctor-generated only
 * - Stored as part of visit record
 */

import { useState } from 'react';
import styles from './PrescriptionForm.module.css';

interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface PrescriptionFormProps {
    consultationId: string;
    patientId: string;
    patientName: string;
    onSave: (prescription: any) => void;
    onCancel: () => void;
}

export function PrescriptionForm({
    consultationId,
    patientId,
    patientName,
    onSave,
    onCancel,
}: PrescriptionFormProps) {
    const [medicines, setMedicines] = useState<Medicine[]>([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addMedicine = () => {
        setMedicines([
            ...medicines,
            { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
        ]);
    };

    const removeMedicine = (index: number) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter((_, i) => i !== index));
        }
    };

    const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate at least one medicine has a name
        const validMedicines = medicines.filter((m) => m.name.trim());
        if (validMedicines.length === 0) {
            setError('Please add at least one medicine');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    consultation_id: consultationId,
                    patient_uid: patientId,
                    medicines: validMedicines,
                    notes: notes,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save prescription');
            }

            const result = await response.json();
            onSave(result);
        } catch (err: any) {
            setError(err.message || 'Failed to save prescription');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.header}>
                <h2>Digital Prescription</h2>
                <p className={styles.patientInfo}>
                    Patient: <strong>{patientName}</strong>
                </p>
            </div>

            {/* COMPLIANCE: Clear authority statement */}
            <div className={styles.authorityNote}>
                ✓ This prescription is created and authorized by you, the doctor.
                AI has no role in medication selection or dosage.
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.medicinesList}>
                <h3>Medicines</h3>

                {medicines.map((medicine, index) => (
                    <div key={index} className={styles.medicineCard}>
                        <div className={styles.medicineHeader}>
                            <span>Medicine #{index + 1}</span>
                            {medicines.length > 1 && (
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => removeMedicine(index)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className={styles.medicineFields}>
                            <div className={styles.field}>
                                <label>Medicine Name *</label>
                                <input
                                    type="text"
                                    value={medicine.name}
                                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                    placeholder="Enter medicine name"
                                    required
                                />
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label>Dosage</label>
                                    <input
                                        type="text"
                                        value={medicine.dosage}
                                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                        placeholder="e.g., 500mg"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label>Frequency</label>
                                    <select
                                        value={medicine.frequency}
                                        onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                                    >
                                        <option value="">Select frequency</option>
                                        <option value="once_daily">Once daily</option>
                                        <option value="twice_daily">Twice daily</option>
                                        <option value="three_times_daily">Three times daily</option>
                                        <option value="four_times_daily">Four times daily</option>
                                        <option value="as_needed">As needed</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        value={medicine.duration}
                                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                                        placeholder="e.g., 7 days"
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Special Instructions</label>
                                <input
                                    type="text"
                                    value={medicine.instructions}
                                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                                    placeholder="e.g., Take after meals"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    className={styles.addButton}
                    onClick={addMedicine}
                >
                    + Add Another Medicine
                </button>
            </div>

            <div className={styles.notesSection}>
                <label>Additional Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional instructions for the patient..."
                    rows={3}
                />
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Prescription'}
                </button>
            </div>

            {/* COMPLIANCE: Footer disclaimer */}
            <div className={styles.footer}>
                <small>
                    This prescription is authored by you and will be sent to the patient.
                    The patient can view it in their preferred language.
                </small>
            </div>
        </form>
    );
}
