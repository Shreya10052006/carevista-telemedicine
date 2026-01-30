'use client';

/**
 * Symptom Intake Page
 * ===================
 * Main page for patients to record symptoms via voice or text.
 * Works fully OFFLINE - data stored in IndexedDB.
 * 
 * ETHICAL SAFEGUARD:
 * - Consent required before any recording
 * - Clear offline/online status
 * - No AI processing offline
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';
import { useConsent } from '@/hooks/useConsent';
import { ConsentScreen } from '@/components/consent/ConsentScreen';
import { VoiceRecorder } from '@/components/symptoms/VoiceRecorder';
import { TextInput } from '@/components/symptoms/TextInput';
import { SymptomSummary } from '@/components/symptoms/SymptomSummary';
import { saveRecording, saveSymptom, getUserSummaries } from '@/lib/indexedDB';
import { getRecordingSummary } from '@/lib/api';
import { DEMO_MODE } from '@/lib/demoData';

type InputMode = 'voice' | 'text';
type PageState = 'consent' | 'input' | 'summary';

const LANGUAGES = [
    { code: 'english', label: 'English' },
    { code: 'tamil', label: 'Tamil' },
    { code: 'hindi', label: 'Hindi' },
    { code: 'telugu', label: 'Telugu' },
];

export default function SymptomsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isOnline, isOffline, pendingCount, isSyncing, forceSync } = useOffline();

    const [pageState, setPageState] = useState<PageState>('consent');
    const [inputMode, setInputMode] = useState<InputMode>('voice');
    const [language, setLanguage] = useState('english');
    const [consentId, setConsentId] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [savedRecordingId, setSavedRecordingId] = useState<string | null>(null);

    // Demo mode: check for demo user in localStorage
    const [demoUserId, setDemoUserId] = useState<string | null>(null);
    const [demoChecked, setDemoChecked] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (DEMO_MODE) {
                const demoId = localStorage.getItem('demo_user_id');
                if (demoId) {
                    setDemoUserId(demoId);
                }
            }
            setDemoChecked(true);
        }
    }, []);

    // Effective user ID (real user or demo user)
    const effectiveUserId = user?.uid || demoUserId;

    const {
        hasRecordingConsent,
        hasTranscriptionConsent,
        grantConsent,
        loading: consentLoading,
    } = useConsent(effectiveUserId);

    // Redirect if not authenticated (skip for demo mode)
    useEffect(() => {
        if (!authLoading && demoChecked && !user && !demoUserId && !DEMO_MODE) {
            router.push('/auth/patient');
        }
    }, [authLoading, demoChecked, user, demoUserId, router]);

    // Check if already has all consents
    useEffect(() => {
        if (hasRecordingConsent && hasTranscriptionConsent) {
            setPageState('input');
        }
    }, [hasRecordingConsent, hasTranscriptionConsent]);

    // Handle consent completion
    const handleConsentComplete = useCallback(
        async (consents: { [key: string]: boolean }) => {
            console.log('[Symptoms] Consent complete, effectiveUserId:', effectiveUserId, 'demoUserId:', demoUserId);

            // In demo mode, always proceed
            if (DEMO_MODE) {
                try {
                    if (consents.recording && effectiveUserId) {
                        const id = await grantConsent('recording', language);
                        setConsentId(id || 'demo-consent-id');
                    } else {
                        setConsentId('demo-consent-id');
                    }
                    if (consents.transcription && effectiveUserId) {
                        await grantConsent('transcription', language);
                    }
                } catch (error) {
                    console.log('[Symptoms] Demo consent storage failed (ok):', error);
                    setConsentId('demo-consent-id');
                }
                setPageState('input');
                return;
            }

            // Production mode - require user
            if (!effectiveUserId) return;

            try {
                if (consents.recording) {
                    const id = await grantConsent('recording', language);
                    setConsentId(id || 'demo-consent-id');
                }
                if (consents.transcription) {
                    await grantConsent('transcription', language);
                }
                if (consents.doctor_sharing) {
                    await grantConsent('doctor_sharing', language);
                }

                setPageState('input');
            } catch (error) {
                console.error('Consent error:', error);
            }
        },
        [effectiveUserId, demoUserId, language, grantConsent]
    );

    // Handle voice recording completion
    const handleRecordingComplete = useCallback(
        async (audioBlob: Blob) => {
            if (!effectiveUserId || !consentId) return;

            try {
                // Save locally first (OFFLINE-FIRST)
                const recordingId = await saveRecording(
                    effectiveUserId,
                    audioBlob,
                    language,
                    consentId
                );
                setSavedRecordingId(recordingId);

                // If online, process immediately
                if (isOnline) {
                    setProcessing(true);
                    try {
                        // This will trigger backend sync
                        await forceSync();

                        // Get summary (may take time for Whisper + AI)
                        const result = await getRecordingSummary(recordingId);
                        setSummary(result);
                        setPageState('summary');
                    } catch (error) {
                        console.error('Processing error:', error);
                        // Still show success - data is saved locally
                        setPageState('summary');
                    } finally {
                        setProcessing(false);
                    }
                } else {
                    // Offline - just show confirmation
                    setSummary({
                        aiFailed: true,
                        rawTranscript: 'Your recording is saved. It will be processed when you are online.',
                    });
                    setPageState('summary');
                }
            } catch (error) {
                console.error('Save error:', error);
            }
        },
        [effectiveUserId, consentId, language, isOnline, forceSync]
    );

    // Handle text submission
    const handleTextSubmit = useCallback(
        async (text: string, lang: string) => {
            if (!effectiveUserId || !consentId) return;

            try {
                // Save locally
                const symptomId = await saveSymptom(effectiveUserId, text, lang, consentId);

                // If online, try to sync
                if (isOnline) {
                    setProcessing(true);
                    try {
                        await forceSync();
                        // Simulate summary for text (same flow as recording)
                        setSummary({
                            summary: {
                                chiefComplaint: text,
                                symptomTimeline: 'See description above',
                                severity: 'To be assessed by doctor',
                            },
                        });
                    } catch (error) {
                        console.error('Sync error:', error);
                    } finally {
                        setProcessing(false);
                    }
                }

                setPageState('summary');
            } catch (error) {
                console.error('Save error:', error);
            }
        },
        [effectiveUserId, consentId, isOnline, forceSync]
    );

    // Record another
    const handleRecordAnother = () => {
        setSummary(null);
        setSavedRecordingId(null);
        setPageState('input');
    };

    if (authLoading || consentLoading || !demoChecked) {
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
                    📡 You are offline. Your data will sync when connected.
                    {pendingCount > 0 && ` (${pendingCount} items pending)`}
                </div>
            )}

            {/* Syncing Indicator */}
            {isSyncing && (
                <div style={styles.syncBanner}>
                    🔄 Syncing your data...
                </div>
            )}

            {/* Consent Flow */}
            {pageState === 'consent' && (
                <ConsentScreen
                    language={language}
                    requiredConsents={['recording', 'transcription']}
                    onComplete={handleConsentComplete}
                    onCancel={() => router.push('/patient/dashboard')}
                />
            )}

            {/* Input Mode */}
            {pageState === 'input' && (
                <div style={styles.container}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>📝 Describe Your Symptoms</h1>
                        <p style={styles.subtitle}>
                            Speak or type to describe what you're experiencing
                        </p>
                    </div>

                    {/* Language Selector */}
                    <div style={styles.langSection}>
                        <label style={styles.langLabel}>I speak:</label>
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

                    {/* Voice Recorder */}
                    {inputMode === 'voice' && (
                        <VoiceRecorder
                            hasConsent={hasRecordingConsent}
                            onRecordingComplete={handleRecordingComplete}
                            language={language}
                        />
                    )}

                    {/* Text Input */}
                    {inputMode === 'text' && (
                        <TextInput
                            hasConsent={hasRecordingConsent}
                            onSubmit={handleTextSubmit}
                        />
                    )}

                    {/* Processing Indicator */}
                    {processing && (
                        <div style={styles.processing}>
                            <div style={styles.spinner} />
                            <p>Processing your symptoms...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Summary View */}
            {pageState === 'summary' && (
                <div style={styles.container}>
                    <SymptomSummary
                        summary={summary?.summary}
                        translation={summary?.translation}
                        language={language}
                        aiFailed={summary?.aiFailed}
                        rawTranscript={summary?.rawTranscript}
                        isLoading={processing}
                    />

                    <div style={styles.summaryActions}>
                        <button onClick={handleRecordAnother} style={styles.primaryBtn}>
                            + Record Another Symptom
                        </button>
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            style={styles.secondaryBtn}
                        >
                            ← Back to Dashboard
                        </button>
                    </div>

                    {isOffline && (
                        <div style={styles.offlineNote}>
                            📡 You are offline. Summary will be processed when connected.
                        </div>
                    )}
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
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-warning)',
        color: '#1a1a1a',
        textAlign: 'center',
        fontWeight: 600,
        zIndex: 1000,
    },
    syncBanner: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        textAlign: 'center',
        fontWeight: 600,
        zIndex: 1000,
    },
    container: {
        maxWidth: '700px',
        margin: '0 auto',
        paddingTop: 'var(--spacing-xl)',
    },
    header: {
        textAlign: 'center',
        marginBottom: 'var(--spacing-xl)',
    },
    title: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        marginBottom: 'var(--spacing-sm)',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-base)',
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
    processing: {
        textAlign: 'center',
        padding: 'var(--spacing-xl)',
    },
    summaryActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        marginTop: 'var(--spacing-lg)',
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
    offlineNote: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
    },
};
