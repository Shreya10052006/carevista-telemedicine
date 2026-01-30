'use client';

/**
 * Consultation Queue Component
 * ============================
 * Displays patients sorted by triage priority + waiting time.
 * 
 * COMPLIANCE NOTES:
 * - Triage indicates scheduling priority ONLY, not clinical urgency
 * - Doctor manually selects patients (NO auto-assignment)
 * - Doctor can override triage priority at any time
 * - All AI outputs marked as non-clinical
 */

import { useState, useEffect } from 'react';
import styles from './ConsultationQueue.module.css';

interface QueueItem {
    id: string;
    patient_uid: string;
    patient_name?: string;
    summary_preview: string;
    created_at: string;
    triage_level: 'urgent_attention_suggested' | 'consultation_needed' | 'routine';
    doctor_override?: string | null;
    waiting_time_minutes?: number;
    consent_status?: string;
    consultation_type?: 'audio' | 'video';
}

interface ConsultationQueueProps {
    onSelectPatient: (patientId: string, consultationId: string) => void;
    onOverrideTriage?: (consultationId: string, newLevel: string) => void;
}

// Triage display configuration
const TRIAGE_CONFIG = {
    urgent_attention_suggested: {
        emoji: '🔴',
        label: 'Urgent Attention Suggested',
        color: '#dc2626',
    },
    consultation_needed: {
        emoji: '🟡',
        label: 'Consultation Needed',
        color: '#ca8a04',
    },
    routine: {
        emoji: '🟢',
        label: 'Routine',
        color: '#16a34a',
    },
};

export function ConsultationQueue({ onSelectPatient, onOverrideTriage }: ConsultationQueueProps) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overrideModalOpen, setOverrideModalOpen] = useState<string | null>(null);

    useEffect(() => {
        fetchQueue();
        // Refresh queue every 30 seconds
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/consultations/queue/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch queue');

            const data = await response.json();
            setQueue(data.queue || []);
            setError(null);
        } catch (err) {
            setError('Unable to load consultation queue');
            console.error('[Queue] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOverride = async (consultationId: string, newLevel: string) => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`/api/triage/${consultationId}/override`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    new_level: newLevel,
                    reason: 'Doctor clinical judgment',
                }),
            });

            setOverrideModalOpen(null);
            fetchQueue();
            onOverrideTriage?.(consultationId, newLevel);
        } catch (err) {
            console.error('[Queue] Override error:', err);
        }
    };

    const formatWaitTime = (minutes?: number) => {
        if (!minutes) return 'Just now';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading consultation queue...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
                <button onClick={fetchQueue} className={styles.retryButton}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Consultation Queue</h2>
                <p className={styles.subtitle}>
                    {queue.length} patient{queue.length !== 1 ? 's' : ''} waiting
                </p>
                {/* COMPLIANCE: Triage disclaimer */}
                <p className={styles.disclaimer}>
                    ⓘ Triage indicates scheduling priority only. Clinical decisions are doctor-led.
                </p>
            </div>

            {queue.length === 0 ? (
                <div className={styles.empty}>
                    <p>No patients in queue</p>
                </div>
            ) : (
                <div className={styles.queue}>
                    {queue.map((item) => {
                        const triage = TRIAGE_CONFIG[item.triage_level] || TRIAGE_CONFIG.routine;
                        const isOverridden = !!item.doctor_override;

                        return (
                            <div
                                key={item.id}
                                className={styles.patientCard}
                                style={{ borderLeftColor: triage.color }}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.triageTag} style={{ backgroundColor: triage.color }}>
                                        <span>{triage.emoji}</span>
                                        <span>{triage.label}</span>
                                        {isOverridden && (
                                            <span className={styles.overrideBadge}>Override</span>
                                        )}
                                    </div>
                                    <span className={styles.waitTime}>
                                        ⏱️ {formatWaitTime(item.waiting_time_minutes)}
                                    </span>
                                </div>

                                <div className={styles.cardBody}>
                                    <h3 className={styles.patientName}>
                                        {item.patient_name || `Patient ${item.patient_uid.slice(-6)}`}
                                    </h3>
                                    <p className={styles.preview}>
                                        {item.summary_preview || 'No summary available'}
                                    </p>
                                    <div className={styles.meta}>
                                        <span className={styles.consentStatus}>
                                            {item.consent_status === 'approved' ? '✓ Consented' : '⏳ Pending'}
                                        </span>
                                        <span className={styles.consultType}>
                                            {item.consultation_type === 'video' ? '📹 Video' : '🎤 Audio'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.selectButton}
                                        onClick={() => onSelectPatient(item.patient_uid, item.id)}
                                    >
                                        Start Consultation
                                    </button>
                                    <button
                                        className={styles.overrideButton}
                                        onClick={() => setOverrideModalOpen(item.id)}
                                    >
                                        Override Priority
                                    </button>
                                </div>

                                {/* Override Modal */}
                                {overrideModalOpen === item.id && (
                                    <div className={styles.overrideModal}>
                                        <h4>Override Triage Priority</h4>
                                        <p className={styles.overrideDisclaimer}>
                                            As the clinical authority, you can adjust scheduling priority.
                                        </p>
                                        <div className={styles.overrideOptions}>
                                            <button
                                                onClick={() => handleOverride(item.id, 'urgent_attention_suggested')}
                                                style={{ backgroundColor: TRIAGE_CONFIG.urgent_attention_suggested.color }}
                                            >
                                                🔴 Urgent
                                            </button>
                                            <button
                                                onClick={() => handleOverride(item.id, 'consultation_needed')}
                                                style={{ backgroundColor: TRIAGE_CONFIG.consultation_needed.color }}
                                            >
                                                🟡 Consult
                                            </button>
                                            <button
                                                onClick={() => handleOverride(item.id, 'routine')}
                                                style={{ backgroundColor: TRIAGE_CONFIG.routine.color }}
                                            >
                                                🟢 Routine
                                            </button>
                                        </div>
                                        <button
                                            className={styles.cancelButton}
                                            onClick={() => setOverrideModalOpen(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* COMPLIANCE: AI role indicator */}
            <div className={styles.aiDisclaimer}>
                <small>
                    Queue sorting is assistive only. Doctor manually selects patients.
                    AI has no role in clinical decisions.
                </small>
            </div>
        </div>
    );
}
