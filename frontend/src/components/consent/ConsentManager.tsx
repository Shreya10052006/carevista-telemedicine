'use client';

/**
 * Consent Manager Component (Phase 2)
 * ====================================
 * Displays active consents and allows patients to revoke them.
 * 
 * ETHICAL SAFEGUARD:
 * - Patients have full control over their consent
 * - Revocation is immediate
 * - Clear confirmation before revocation
 */

import { useState, useCallback } from 'react';
import { revokeConsent } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface ConsentItem {
    type: 'recording' | 'transcription' | 'doctor_sharing';
    label: string;
    description: string;
    icon: string;
    isActive: boolean;
}

interface ConsentManagerProps {
    consents: {
        recording: boolean;
        transcription: boolean;
        doctor_sharing: boolean;
    };
    onConsentRevoked: () => void;
}

export function ConsentManager({ consents, onConsentRevoked }: ConsentManagerProps) {
    const { user } = useAuth();
    const [revoking, setRevoking] = useState<string | null>(null);
    const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

    const consentItems: ConsentItem[] = [
        {
            type: 'recording',
            label: 'Voice Recording',
            description: 'Allow recording of voice for symptom description',
            icon: '🎤',
            isActive: consents.recording,
        },
        {
            type: 'transcription',
            label: 'Transcription',
            description: 'Allow AI to convert voice to text',
            icon: '📝',
            isActive: consents.transcription,
        },
        {
            type: 'doctor_sharing',
            label: 'Doctor Sharing',
            description: 'Allow doctors to view your symptom summaries',
            icon: '👨‍⚕️',
            isActive: consents.doctor_sharing,
        },
    ];

    const handleRevokeClick = (type: string) => {
        setConfirmRevoke(type);
    };

    const handleConfirmRevoke = useCallback(
        async (type: 'recording' | 'transcription' | 'doctor_sharing') => {
            if (!user?.uid) return;

            setRevoking(type);
            try {
                await revokeConsent(user.uid, type);
                setConfirmRevoke(null);
                onConsentRevoked();
            } catch (error) {
                console.error('Revoke error:', error);
            } finally {
                setRevoking(null);
            }
        },
        [user?.uid, onConsentRevoked]
    );

    const handleCancelRevoke = () => {
        setConfirmRevoke(null);
    };

    const activeConsents = consentItems.filter((c) => c.isActive);
    const inactiveConsents = consentItems.filter((c) => !c.isActive);

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🔐 Manage Your Consents</h3>
            <p style={styles.subtitle}>
                You can revoke any consent at any time. Revoking consent will immediately
                prevent further access.
            </p>

            {/* Active Consents */}
            {activeConsents.length > 0 && (
                <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Active Consents</h4>
                    {activeConsents.map((consent) => (
                        <div key={consent.type} style={styles.consentCard}>
                            <div style={styles.consentInfo}>
                                <span style={styles.consentIcon}>{consent.icon}</span>
                                <div>
                                    <p style={styles.consentLabel}>{consent.label}</p>
                                    <p style={styles.consentDesc}>{consent.description}</p>
                                </div>
                            </div>

                            {confirmRevoke === consent.type ? (
                                <div style={styles.confirmBox}>
                                    <p style={styles.confirmText}>
                                        Are you sure? This will immediately revoke access.
                                    </p>
                                    <div style={styles.confirmButtons}>
                                        <button
                                            onClick={() => handleConfirmRevoke(consent.type)}
                                            disabled={revoking === consent.type}
                                            style={styles.confirmBtn}
                                        >
                                            {revoking === consent.type ? 'Revoking...' : '✓ Yes, Revoke'}
                                        </button>
                                        <button onClick={handleCancelRevoke} style={styles.cancelBtn}>
                                            ✕ Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleRevokeClick(consent.type)}
                                    style={styles.revokeBtn}
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Inactive Consents */}
            {inactiveConsents.length > 0 && (
                <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Inactive Consents</h4>
                    {inactiveConsents.map((consent) => (
                        <div key={consent.type} style={styles.inactiveCard}>
                            <div style={styles.consentInfo}>
                                <span style={styles.consentIcon}>{consent.icon}</span>
                                <div>
                                    <p style={styles.consentLabel}>{consent.label}</p>
                                    <p style={styles.consentDesc}>Not currently active</p>
                                </div>
                            </div>
                            <span style={styles.inactiveBadge}>Revoked</span>
                        </div>
                    ))}
                </div>
            )}

            {activeConsents.length === 0 && inactiveConsents.length === 0 && (
                <p style={styles.noConsents}>No consents recorded yet.</p>
            )}

            {/* Information Notice */}
            <div style={styles.notice}>
                <strong>ℹ️ Your Rights:</strong>
                <ul style={styles.noticeList}>
                    <li>You can revoke consent at any time</li>
                    <li>Revocation takes effect immediately</li>
                    <li>Doctors will no longer see your data after revocation</li>
                    <li>Historical data may still exist but will not be accessible</li>
                </ul>
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
        marginBottom: 'var(--spacing-lg)',
    },
    section: {
        marginBottom: 'var(--spacing-lg)',
    },
    sectionTitle: {
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-sm)',
    },
    consentCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-md)',
        background: 'var(--color-success-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-sm)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
    },
    inactiveCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-sm)',
        opacity: 0.7,
    },
    consentInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    consentIcon: {
        fontSize: '24px',
    },
    consentLabel: {
        fontWeight: 600,
        margin: 0,
    },
    consentDesc: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        margin: 0,
    },
    revokeBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-danger)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '40px',
    },
    confirmBox: {
        width: '100%',
        marginTop: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-danger-light)',
        borderRadius: 'var(--radius-md)',
    },
    confirmText: {
        color: 'var(--color-danger)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-sm)',
    },
    confirmButtons: {
        display: 'flex',
        gap: 'var(--spacing-sm)',
    },
    confirmBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-danger)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    cancelBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'white',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        cursor: 'pointer',
    },
    inactiveBadge: {
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-muted)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
    },
    noConsents: {
        textAlign: 'center',
        color: 'var(--text-muted)',
        padding: 'var(--spacing-lg)',
    },
    notice: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary-light)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
    },
    noticeList: {
        margin: 'var(--spacing-sm) 0 0 var(--spacing-lg)',
        padding: 0,
        color: 'var(--text-secondary)',
    },
};
