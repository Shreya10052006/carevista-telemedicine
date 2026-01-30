'use client';

/**
 * Temporary Patient Form (Phase 3)
 * =================================
 * Creates temporary patient IDs for rural health camps.
 * 
 * RULES:
 * - Created by health workers only
 * - Marked as "temporary" until linked to permanent account
 * - Same consent rules apply
 * - No data loss during linking
 */

import { useState, useCallback } from 'react';
import { createTemporaryPatient } from '@/lib/indexedDB';
import { useAuth } from '@/hooks/useAuth';

interface TemporaryPatientFormProps {
    campName?: string;
    onPatientCreated: (patient: {
        id: string;
        name: string;
        isTemporary: true;
    }) => void;
    onCancel: () => void;
}

export function TemporaryPatientForm({
    campName,
    onPatientCreated,
    onCancel,
}: TemporaryPatientFormProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [camp, setCamp] = useState(campName || '');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async () => {
        if (!name.trim()) {
            setError('Patient name is required');
            return;
        }

        if (!user?.uid) {
            setError('You must be logged in');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            // Build data dynamically - NEVER include undefined
            const patientData: {
                name: string;
                phone?: string;
                age?: number;
                gender?: string;
                campName?: string;
            } = {
                name: name.trim(),
            };
            if (phone.trim()) patientData.phone = phone.trim();
            if (age) patientData.age = parseInt(age, 10);
            if (gender) patientData.gender = gender;
            if (camp.trim()) patientData.campName = camp.trim();

            const tempId = await createTemporaryPatient(
                patientData,
                user.uid
            );

            onPatientCreated({
                id: tempId,
                name: name.trim(),
                isTemporary: true,
            });
        } catch (err) {
            setError('Failed to create temporary patient');
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    }, [name, phone, age, gender, camp, user?.uid, onPatientCreated]);

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🏥 Create Temporary Patient</h3>
            <p style={styles.subtitle}>
                For health camp use. Can be linked to a permanent account later.
            </p>

            {/* Temporary Badge */}
            <div style={styles.tempBadge}>
                ⏳ This is a TEMPORARY ID
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {/* Name (Required) */}
            <div style={styles.field}>
                <label style={styles.label}>Patient Name *</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter patient's name"
                    style={styles.input}
                />
            </div>

            {/* Phone (Optional) */}
            <div style={styles.field}>
                <label style={styles.label}>Phone Number (Optional)</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="For linking later"
                    style={styles.input}
                />
            </div>

            {/* Age and Gender Row */}
            <div style={styles.row}>
                <div style={styles.halfField}>
                    <label style={styles.label}>Age</label>
                    <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Years"
                        style={styles.input}
                        min="0"
                        max="120"
                    />
                </div>
                <div style={styles.halfField}>
                    <label style={styles.label}>Gender</label>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        style={styles.select}
                    >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            {/* Camp Name */}
            <div style={styles.field}>
                <label style={styles.label}>Camp Name</label>
                <input
                    type="text"
                    value={camp}
                    onChange={(e) => setCamp(e.target.value)}
                    placeholder="e.g., Village Health Camp - Jan 2026"
                    style={styles.input}
                />
            </div>

            {/* Actions */}
            <div style={styles.actions}>
                <button
                    onClick={handleSubmit}
                    disabled={isCreating || !name.trim()}
                    style={{
                        ...styles.submitBtn,
                        ...(isCreating || !name.trim() ? styles.submitBtnDisabled : {}),
                    }}
                >
                    {isCreating ? 'Creating...' : '✓ Create Temporary Patient'}
                </button>
                <button onClick={onCancel} style={styles.cancelBtn}>
                    Cancel
                </button>
            </div>

            {/* Notice */}
            <div style={styles.notice}>
                <strong>ℹ️ Note:</strong> This temporary ID will be stored locally and
                can be linked to a permanent account when the patient registers with
                their phone number.
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
    },
    title: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        marginBottom: 'var(--spacing-xs)',
    },
    subtitle: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-md)',
    },
    tempBadge: {
        display: 'inline-block',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning-dark)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-lg)',
    },
    error: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
    },
    field: {
        marginBottom: 'var(--spacing-md)',
    },
    label: {
        display: 'block',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-xs)',
    },
    input: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
    },
    select: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
    },
    row: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
    },
    halfField: {
        flex: 1,
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-md)',
    },
    submitBtn: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        cursor: 'pointer',
    },
    submitBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    cancelBtn: {
        padding: 'var(--spacing-md)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        cursor: 'pointer',
    },
    notice: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
    },
};
