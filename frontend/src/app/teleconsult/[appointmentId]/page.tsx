'use client';

/**
 * Teleconsultation Page (Phase 2)
 * ================================
 * Audio call page for patient-doctor consultation.
 * 
 * ETHICAL SAFEGUARD:
 * - Pre-call consent check is performed
 * - Call is appointment-bound
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AudioCall } from '@/components/teleconsult/AudioCall';
import { hasActiveConsent } from '@/lib/firebase';

export default function TeleconsultPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params?.appointmentId as string;
    const { user, loading: authLoading, isDoctor, isPatient } = useAuth();

    const [hasConsent, setHasConsent] = useState<boolean | null>(null);
    const [checkingConsent, setCheckingConsent] = useState(true);

    // Check consent on mount
    useEffect(() => {
        async function checkConsent() {
            if (!user?.uid) return;

            try {
                // For patients, check their own consent
                // For doctors, we'll trust the backend verification
                if (isPatient) {
                    const consent = await hasActiveConsent(user.uid, 'doctor_sharing');
                    setHasConsent(consent);
                } else {
                    setHasConsent(true); // Doctors bypass consent check, backend verifies
                }
            } catch (error) {
                console.error('Consent check error:', error);
                setHasConsent(false);
            } finally {
                setCheckingConsent(false);
            }
        }

        if (user) {
            checkConsent();
        }
    }, [user, isPatient]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Handle call end
    const handleCallEnd = () => {
        if (isDoctor) {
            router.push('/doctor/dashboard');
        } else {
            router.push('/patient/dashboard');
        }
    };

    if (authLoading || checkingConsent) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner} />
                <p>Loading...</p>
            </div>
        );
    }

    if (!hasConsent) {
        return (
            <main style={styles.main}>
                <div style={styles.container}>
                    <div style={styles.card}>
                        <h1 style={styles.title}>⚠️ Consent Required</h1>
                        <p style={styles.message}>
                            You need to grant consent for doctor sharing before joining a
                            teleconsultation.
                        </p>
                        <button
                            onClick={() => router.push('/patient/symptoms')}
                            style={styles.primaryBtn}
                        >
                            Go to Symptoms Page
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={styles.main}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <button onClick={handleCallEnd} style={styles.backBtn}>
                        ← Back
                    </button>
                    <h1 style={styles.title}>📞 Teleconsultation</h1>
                </div>

                {/* Disclaimer */}
                <div style={styles.disclaimer}>
                    ⚠️ <strong>IMPORTANT:</strong> This teleconsultation is NOT for
                    emergencies. For emergencies, please visit the nearest hospital
                    immediately.
                </div>

                {/* Audio Call Component */}
                <AudioCall
                    appointmentId={appointmentId}
                    onCallEnd={handleCallEnd}
                />

                {/* Info */}
                <div style={styles.info}>
                    <h3>📋 Before the Call</h3>
                    <ul>
                        <li>Make sure you are in a quiet place</li>
                        <li>Check that your microphone is working</li>
                        <li>Have your symptom summary ready</li>
                        <li>Prepare any questions for the doctor</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    main: {
        minHeight: '100vh',
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-primary)',
    },
    loading: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid var(--border-color)',
        borderTop: '4px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    container: {
        maxWidth: '600px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
    },
    backBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
    },
    title: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
        margin: 0,
    },
    disclaimer: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning-dark)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-lg)',
        textAlign: 'center',
    },
    card: {
        padding: 'var(--spacing-xl)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
    },
    message: {
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-lg)',
    },
    primaryBtn: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    info: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
    },
};
