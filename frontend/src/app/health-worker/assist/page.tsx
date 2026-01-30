'use client';

/**
 * Health Worker Assist Page (Phase 2)
 * ====================================
 * Dashboard for health workers to assist patients with symptom recording.
 * 
 * ETHICAL SAFEGUARD:
 * - Health workers act as facilitators only
 * - All consents logged as "assisted" with health worker ID
 * - No access to patient history without explicit consent
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';
import { PatientSwitcher } from '@/components/health-worker/PatientSwitcher';
import { ConsentScreen } from '@/components/consent/ConsentScreen';
import { VoiceRecorder } from '@/components/symptoms/VoiceRecorder';
import { TextInput } from '@/components/symptoms/TextInput';
import { saveRecording, saveSymptom } from '@/lib/indexedDB';
import { storeConsent } from '@/lib/firebase';
import { DEMO_MODE, getDemoHealthWorker, DemoHealthWorker } from '@/lib/demoData';
import { Logo } from '@/components/common/Logo';

type PageState = 'select-patient' | 'consent' | 'record' | 'done';
type InputMode = 'voice' | 'text';

const LANGUAGES = [
    { code: 'english', label: 'English' },
    { code: 'tamil', label: 'Tamil' },
    { code: 'hindi', label: 'Hindi' },
    { code: 'telugu', label: 'Telugu' },
];

export default function HealthWorkerAssistPage() {
    const router = useRouter();
    const {
        user,
        profile,
        loading: authLoading,
        logout,
        isHealthWorker,
        assistedPatientId,
        assistedPatientName,
        setAssistedPatient,
        getEffectivePatientId,
    } = useAuth();
    const { isOnline, isOffline, pendingCount } = useOffline();

    const [pageState, setPageState] = useState<PageState>('select-patient');
    const [inputMode, setInputMode] = useState<InputMode>('voice');
    const [language, setLanguage] = useState('tamil'); // Default to Tamil for rural users
    const [consentId, setConsentId] = useState<string | null>(null);
    const [hasRecordingConsent, setHasRecordingConsent] = useState(false);

    // Demo mode health worker profile
    const [demoHealthWorker, setDemoHealthWorker] = useState<DemoHealthWorker | null>(null);
    const [mounted, setMounted] = useState(false);

    // Check demo health worker login
    useEffect(() => {
        setMounted(true);

        if (DEMO_MODE) {
            const hwId = localStorage.getItem('demo_health_worker_id');
            if (!hwId) {
                // Not logged in - redirect to login
                router.push('/auth/health-worker');
                return;
            }

            const hw = getDemoHealthWorker(hwId);
            if (hw) {
                setDemoHealthWorker(hw);
            } else {
                // Invalid session - redirect to login
                router.push('/auth/health-worker');
            }
        }
    }, [router]);

    // Redirect if not health worker (production mode)
    useEffect(() => {
        if (!DEMO_MODE) {
            if (!authLoading && !user) {
                router.push('/auth/patient?mode=assisted');
            }
            if (!authLoading && user && !isHealthWorker) {
                router.push('/patient/dashboard');
            }
        }
    }, [authLoading, user, isHealthWorker, router]);

    // Move to consent when patient selected
    useEffect(() => {
        if (assistedPatientId && pageState === 'select-patient') {
            setPageState('consent');
        }
    }, [assistedPatientId, pageState]);

    // Handle patient selection
    const handlePatientSelect = (patientId: string, patientName: string) => {
        setAssistedPatient(patientId, patientName);
    };

    // Handle patient clear
    const handleClearPatient = () => {
        setAssistedPatient(null);
        setPageState('select-patient');
        setConsentId(null);
        setHasRecordingConsent(false);
    };

    // Handle consent completion
    const handleConsentComplete = useCallback(
        async (consents: { [key: string]: boolean }) => {
            if (!user?.uid || !assistedPatientId) return;

            try {
                // Store consents with health worker ID (assisted mode)
                if (consents.recording) {
                    const id = await storeConsent(
                        assistedPatientId,
                        'recording',
                        true,
                        language,
                        user.uid // Pass health worker's UID as assistedByUid
                    );
                    setConsentId(id);
                    setHasRecordingConsent(true);
                }
                if (consents.transcription) {
                    await storeConsent(
                        assistedPatientId,
                        'transcription',
                        true,
                        language,
                        user.uid
                    );
                }
                if (consents.doctor_sharing) {
                    await storeConsent(
                        assistedPatientId,
                        'doctor_sharing',
                        true,
                        language,
                        user.uid
                    );
                }

                setPageState('record');
            } catch (error) {
                console.error('Consent error:', error);
            }
        },
        [user?.uid, assistedPatientId, language]
    );

    // Handle recording complete
    const handleRecordingComplete = useCallback(
        async (audioBlob: Blob) => {
            const patientId = getEffectivePatientId();
            if (!patientId || !consentId) return;

            try {
                await saveRecording(patientId, audioBlob, language, consentId);
                setPageState('done');
            } catch (error) {
                console.error('Save error:', error);
            }
        },
        [getEffectivePatientId, consentId, language]
    );

    // Handle text submit
    const handleTextSubmit = useCallback(
        async (text: string, lang: string) => {
            const patientId = getEffectivePatientId();
            if (!patientId || !consentId) return;

            try {
                await saveSymptom(patientId, text, lang, consentId);
                setPageState('done');
            } catch (error) {
                console.error('Save error:', error);
            }
        },
        [getEffectivePatientId, consentId]
    );

    // Record another symptom
    const handleRecordAnother = () => {
        setPageState('record');
    };

    // Assist new patient
    const handleAssistNewPatient = () => {
        handleClearPatient();
    };

    const handleLogout = async () => {
        if (DEMO_MODE) {
            // Clear demo session
            localStorage.removeItem('demo_health_worker_id');
            localStorage.removeItem('demo_health_worker_name');
            localStorage.removeItem('demo_health_worker_facility');
            localStorage.removeItem('demo_health_worker_location');
            localStorage.removeItem('demo_health_worker_languages');
            localStorage.removeItem('demo_health_worker_years');
            localStorage.removeItem('demo_health_worker_patients');
            router.push('/');
        } else {
            await logout();
            router.push('/');
        }
    };

    if (authLoading) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner} />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <main style={styles.main}>
            {/* Offline Banner */}
            {isOffline && (
                <div style={styles.offlineBanner}>
                    📡 Offline Mode - Data will sync when connected
                    {pendingCount > 0 && ` (${pendingCount} pending)`}
                </div>
            )}

            {/* Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <Logo size="small" theme="primary" showText={false} />
                        <span>Health Worker Mode</span>
                    </h1>
                    {DEMO_MODE && demoHealthWorker ? (
                        <div style={styles.hwProfile}>
                            <p style={styles.hwName}>{demoHealthWorker.name}</p>
                            <p style={styles.hwFacility}>
                                {demoHealthWorker.facility} • {demoHealthWorker.facilityLocation}
                            </p>
                            <p style={styles.hwStats}>
                                {demoHealthWorker.yearsActive} years experience • {demoHealthWorker.patientsAssisted} patients assisted
                            </p>
                        </div>
                    ) : (
                        <p style={styles.subtitle}>
                            Logged in as: {profile?.displayName || 'Health Worker'}
                        </p>
                    )}
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    Logout
                </button>
            </header>

            {/* Patient Selection */}
            {pageState === 'select-patient' && (
                <div style={styles.container}>
                    <PatientSwitcher
                        currentPatientId={assistedPatientId}
                        currentPatientName={assistedPatientName}
                        onPatientSelect={handlePatientSelect}
                        onClearPatient={handleClearPatient}
                    />

                    <div style={styles.instructions}>
                        <h3>📋 Instructions</h3>
                        <ol>
                            <li>Select or register the patient you are assisting</li>
                            <li>Explain the consent form to the patient</li>
                            <li>Record their symptoms via voice or text</li>
                            <li>The data will sync when you have internet</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Consent Flow */}
            {pageState === 'consent' && assistedPatientId && (
                <div style={styles.container}>
                    <PatientSwitcher
                        currentPatientId={assistedPatientId}
                        currentPatientName={assistedPatientName}
                        onPatientSelect={handlePatientSelect}
                        onClearPatient={handleClearPatient}
                    />

                    <ConsentScreen
                        language={language}
                        requiredConsents={['recording', 'transcription']}
                        onComplete={handleConsentComplete}
                        onCancel={handleClearPatient}
                    />
                </div>
            )}

            {/* Recording */}
            {pageState === 'record' && (
                <div style={styles.container}>
                    <PatientSwitcher
                        currentPatientId={assistedPatientId}
                        currentPatientName={assistedPatientName}
                        onPatientSelect={handlePatientSelect}
                        onClearPatient={handleClearPatient}
                    />

                    <div style={styles.recordSection}>
                        <h2>📝 Record Symptoms for {assistedPatientName}</h2>

                        {/* Language Selector */}
                        <div style={styles.langSection}>
                            <label style={styles.langLabel}>Patient's language:</label>
                            <div style={styles.langButtons}>
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        style={{
                                            ...styles.langBtn,
                                            ...(language === lang.code ? styles.langBtnActive : {}),
                                        }}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Toggle */}
                        <div style={styles.modeToggle}>
                            <button
                                onClick={() => setInputMode('voice')}
                                style={{
                                    ...styles.modeBtn,
                                    ...(inputMode === 'voice' ? styles.modeBtnActive : {}),
                                }}
                            >
                                🎤 Voice
                            </button>
                            <button
                                onClick={() => setInputMode('text')}
                                style={{
                                    ...styles.modeBtn,
                                    ...(inputMode === 'text' ? styles.modeBtnActive : {}),
                                }}
                            >
                                ⌨️ Text
                            </button>
                        </div>

                        {inputMode === 'voice' && (
                            <VoiceRecorder
                                hasConsent={hasRecordingConsent}
                                onRecordingComplete={handleRecordingComplete}
                                language={language}
                            />
                        )}

                        {inputMode === 'text' && (
                            <TextInput
                                hasConsent={hasRecordingConsent}
                                onSubmit={handleTextSubmit}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Done */}
            {pageState === 'done' && (
                <div style={styles.container}>
                    <div style={styles.doneCard}>
                        <div style={styles.doneIcon}>✅</div>
                        <h2>Symptom Recorded Successfully</h2>
                        <p>
                            Patient: <strong>{assistedPatientName}</strong>
                        </p>
                        <p style={styles.doneNote}>
                            {isOnline
                                ? 'Data has been synced to the server.'
                                : 'Data saved locally. Will sync when online.'}
                        </p>

                        <div style={styles.doneActions}>
                            <button onClick={handleRecordAnother} style={styles.primaryBtn}>
                                + Record Another Symptom
                            </button>
                            <button onClick={handleAssistNewPatient} style={styles.secondaryBtn}>
                                Assist Different Patient
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    main: {
        minHeight: '100vh',
        padding: 'var(--spacing-lg)',
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
    offlineBanner: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: 'var(--spacing-sm)',
        background: 'var(--color-warning)',
        color: '#1a1a1a',
        textAlign: 'center',
        fontWeight: 600,
        zIndex: 1000,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
        paddingBottom: 'var(--spacing-md)',
        borderBottom: '3px solid var(--color-primary)',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
        margin: 0,
        color: 'var(--color-primary)',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
        margin: 0,
    },
    logoutBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
    },
    container: {
        maxWidth: '700px',
        margin: '0 auto',
    },
    instructions: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
    },
    recordSection: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
    },
    langSection: {
        marginBottom: 'var(--spacing-lg)',
    },
    langLabel: {
        display: 'block',
        marginBottom: 'var(--spacing-sm)',
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
    },
    langButtons: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
    },
    langBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '40px',
    },
    langBtnActive: {
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
    },
    modeToggle: {
        display: 'flex',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
        padding: 'var(--spacing-xs)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
    },
    modeBtn: {
        flex: 1,
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '48px',
    },
    modeBtnActive: {
        background: 'var(--color-primary)',
        color: 'white',
    },
    doneCard: {
        padding: 'var(--spacing-xl)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
    },
    doneIcon: {
        fontSize: '64px',
        marginBottom: 'var(--spacing-md)',
    },
    doneNote: {
        color: 'var(--text-muted)',
        marginBottom: 'var(--spacing-lg)',
    },
    doneActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
    },
    primaryBtn: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
    },
    secondaryBtn: {
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '48px',
    },
    hwProfile: {
        marginTop: '4px',
    },
    hwName: {
        color: 'var(--color-primary)',
        fontWeight: 600,
        fontSize: 'var(--font-size-base)',
        margin: '0 0 4px 0',
    },
    hwFacility: {
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
        margin: '0 0 2px 0',
    },
    hwStats: {
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-xs)',
        margin: 0,
    },
};
