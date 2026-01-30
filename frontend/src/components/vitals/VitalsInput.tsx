'use client';

/**
 * Vitals Input Component (Phase 3)
 * =================================
 * Manual entry for basic patient vitals.
 * 
 * ETHICAL SAFEGUARD:
 * - Stores RAW VALUES ONLY
 * - NO interpretation, NO alerts, NO thresholds
 * - Health workers may ENTER but NOT interpret vitals
 * - Data shared with doctor ONLY if patient consents
 * 
 * OFFLINE-FIRST:
 * - Works entirely without network
 * - Stored in IndexedDB
 * - Synced when online
 */

import { useState, useCallback } from 'react';

export interface VitalsData {
    bpSystolic: number | null;
    bpDiastolic: number | null;
    temperature: number | null;
    weight: number | null;
    enteredBy: 'patient' | 'health_worker';
    enteredAt: number;
}

interface VitalsInputProps {
    isAssistedMode?: boolean;
    onVitalsSubmit: (vitals: VitalsData) => void;
    initialValues?: Partial<VitalsData>;
}

export function VitalsInput({
    isAssistedMode = false,
    onVitalsSubmit,
    initialValues,
}: VitalsInputProps) {
    const [bpSystolic, setBpSystolic] = useState<string>(
        initialValues?.bpSystolic?.toString() || ''
    );
    const [bpDiastolic, setBpDiastolic] = useState<string>(
        initialValues?.bpDiastolic?.toString() || ''
    );
    const [temperature, setTemperature] = useState<string>(
        initialValues?.temperature?.toString() || ''
    );
    const [weight, setWeight] = useState<string>(
        initialValues?.weight?.toString() || ''
    );

    const handleSubmit = useCallback(() => {
        const vitals: VitalsData = {
            bpSystolic: bpSystolic ? parseFloat(bpSystolic) : null,
            bpDiastolic: bpDiastolic ? parseFloat(bpDiastolic) : null,
            temperature: temperature ? parseFloat(temperature) : null,
            weight: weight ? parseFloat(weight) : null,
            enteredBy: isAssistedMode ? 'health_worker' : 'patient',
            enteredAt: Date.now(),
        };
        onVitalsSubmit(vitals);
    }, [bpSystolic, bpDiastolic, temperature, weight, isAssistedMode, onVitalsSubmit]);

    // Check if at least one vital is entered
    const hasAnyVital = bpSystolic || bpDiastolic || temperature || weight;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>📊 Enter Vitals (Optional)</h3>
            <p style={styles.subtitle}>
                These values are recorded as-is. No analysis is performed.
            </p>

            {/* Entered By Label */}
            <div style={styles.enteredByBadge}>
                {isAssistedMode ? '👩‍⚕️ Entered by: Health Worker' : '👤 Entered by: Patient'}
            </div>

            {/* Blood Pressure */}
            <div style={styles.fieldGroup}>
                <label style={styles.label}>
                    💓 Blood Pressure (mmHg)
                </label>
                <div style={styles.bpRow}>
                    <input
                        type="number"
                        placeholder="Systolic"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        style={styles.input}
                        min="50"
                        max="250"
                    />
                    <span style={styles.bpSlash}>/</span>
                    <input
                        type="number"
                        placeholder="Diastolic"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        style={styles.input}
                        min="30"
                        max="150"
                    />
                </div>
            </div>

            {/* Temperature */}
            <div style={styles.fieldGroup}>
                <label style={styles.label}>
                    🌡️ Temperature (°F)
                </label>
                <input
                    type="number"
                    placeholder="e.g., 98.6"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    style={styles.inputFull}
                    step="0.1"
                    min="90"
                    max="110"
                />
            </div>

            {/* Weight */}
            <div style={styles.fieldGroup}>
                <label style={styles.label}>
                    ⚖️ Weight (kg) - Optional
                </label>
                <input
                    type="number"
                    placeholder="e.g., 65"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={styles.inputFull}
                    step="0.1"
                    min="1"
                    max="300"
                />
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!hasAnyVital}
                style={{
                    ...styles.submitBtn,
                    ...(hasAnyVital ? {} : styles.submitBtnDisabled),
                }}
            >
                ✓ Save Vitals
            </button>

            {/* Ethical Notice */}
            <div style={styles.notice}>
                <strong>ℹ️ Note:</strong> These vitals are stored as raw values only.
                The system does NOT interpret, analyze, or alert based on these values.
                Only your doctor can interpret these readings.
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--spacing-lg)',
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
    enteredByBadge: {
        display: 'inline-block',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-lg)',
    },
    fieldGroup: {
        marginBottom: 'var(--spacing-lg)',
    },
    label: {
        display: 'block',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-sm)',
    },
    bpRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    bpSlash: {
        fontSize: 'var(--font-size-xl)',
        color: 'var(--text-muted)',
    },
    input: {
        flex: 1,
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        textAlign: 'center',
    },
    inputFull: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
    },
    submitBtn: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        cursor: 'pointer',
        marginBottom: 'var(--spacing-md)',
    },
    submitBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    notice: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning-dark)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
    },
};
