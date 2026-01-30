'use client';

/**
 * Voice Intake Page - Hospital-Grade Dark Mode UI
 * ================================================
 * Full-screen, distraction-free voice recording experience.
 * Dark background for focus, prominent microphone button.
 * 
 * IMPORTANT: Voice transcription preview is for PATIENT only.
 * Doctors see only the consolidated summary, never raw transcripts.
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import { saveLogbookEntry } from '@/lib/indexedDB';
import { DEMO_MODE } from '@/lib/demoData';
import { createLogbookEntry } from '@/lib/demoSessionStore';
import styles from './page.module.css';

type RecordingState = 'idle' | 'recording' | 'processing' | 'preview' | 'saved';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
];

export default function VoiceIntakePage() {
    const router = useRouter();
    const { t, language: appLanguage } = useLanguage();
    const { isOnline } = useOffline();

    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(appLanguage);
    const [isSaving, setIsSaving] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleStartRecording = () => {
        setRecordingState('recording');
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const handleStopRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingState('processing');

        // Simulate STT processing
        setTimeout(() => {
            const demoTranscripts: Record<Language, string> = {
                en: 'I have been feeling tired since yesterday morning. There is a mild headache that comes and goes. I also noticed some body pain, especially in my shoulders and back.',
                ta: 'நேற்று காலை முதல் சோர்வாக இருக்கிறேன். லேசான தலைவலி வருகிறது போகிறது. தோள்பட்டை மற்றும் முதுகில் வலி தெரிகிறது.',
                hi: 'कल सुबह से थकान महसूस हो रही है। हल्का सिरदर्द आता जाता रहता है। कंधे और पीठ में भी दर्द है।',
            };
            setTranscript(demoTranscripts[selectedLanguage] || demoTranscripts.en);
            setRecordingState('preview');
        }, 1500);
    };

    const handleRerecord = () => {
        setTranscript('');
        setRecordingTime(0);
        setRecordingState('idle');
    };

    const handleSave = async () => {
        if (!transcript.trim()) return;

        setIsSaving(true);

        try {
            const userId = localStorage.getItem('demo_user_id') || 'unknown-user';

            // Save to IndexedDB (works offline)
            await saveLogbookEntry(userId, {
                type: 'voice',
                originalText: transcript,
                structuredSummary: {
                    chiefComplaint: transcript.slice(0, 100) + (transcript.length > 100 ? '...' : ''),
                    additionalNotes: `Voice intake in ${selectedLanguage.toUpperCase()}`,
                },
            });

            // Save to demo session store
            if (DEMO_MODE) {
                createLogbookEntry(
                    userId,
                    'voice',
                    transcript,
                    {
                        chiefComplaint: transcript.slice(0, 100) + (transcript.length > 100 ? '...' : ''),
                        severity: 'To be assessed',
                    }
                );
            }

            setRecordingState('saved');

            // Redirect after brief confirmation
            setTimeout(() => {
                router.push('/patient/logbook');
            }, 1500);

        } catch (error) {
            console.error('Failed to save voice entry:', error);
            alert(t('Failed to save. Please try again.'));
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/patient/dashboard" className={styles.backButton}>
                    ← {t('Back')}
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>🎤</span>
                    <span className={styles.headerTitle}>{t('Voice Intake')}</span>
                </div>
                <div className={styles.headerRight}>
                    {!isOnline && (
                        <span className={styles.offlineBadge}>📴 {t('Offline')}</span>
                    )}
                </div>
            </header>

            <main className={styles.main}>
                {/* Disclaimer - Always Visible */}
                <div className={styles.disclaimer}>
                    <span className={styles.disclaimerIcon}>ℹ️</span>
                    <span>{t('This is for intake only — not medical advice or diagnosis.')}</span>
                </div>

                {/* Language Selector */}
                {recordingState === 'idle' && (
                    <div className={styles.languageSection}>
                        <p className={styles.languageLabel}>{t('Speak in')}:</p>
                        <div className={styles.languageOptions}>
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    className={`${styles.langButton} ${selectedLanguage === lang.code ? styles.langButtonActive : ''}`}
                                    onClick={() => setSelectedLanguage(lang.code)}
                                >
                                    {lang.native}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Recording Area */}
                <div className={styles.recordingArea}>
                    {/* IDLE State */}
                    {recordingState === 'idle' && (
                        <div className={styles.idleState}>
                            <button
                                className={styles.micButton}
                                onClick={handleStartRecording}
                                aria-label="Start recording"
                            >
                                <span className={styles.micIcon}>🎤</span>
                                <div className={styles.micPulse}></div>
                                <div className={styles.micPulse2}></div>
                            </button>
                            <p className={styles.micHint}>{t('Tap to speak')}</p>
                            <p className={styles.micSubhint}>
                                {t('Describe your symptoms naturally in your language')}
                            </p>
                        </div>
                    )}

                    {/* RECORDING State */}
                    {recordingState === 'recording' && (
                        <div className={styles.recordingState}>
                            <button
                                className={styles.stopButton}
                                onClick={handleStopRecording}
                                aria-label="Stop recording"
                            >
                                <span className={styles.stopIcon}>■</span>
                            </button>
                            <div className={styles.recordingInfo}>
                                <span className={styles.recordingDot}></span>
                                <span className={styles.recordingText}>{t('Listening')}...</span>
                            </div>
                            <p className={styles.recordingTime}>{formatTime(recordingTime)}</p>
                            <div className={styles.waveform}>
                                <span className={styles.wave}></span>
                                <span className={styles.wave}></span>
                                <span className={styles.wave}></span>
                                <span className={styles.wave}></span>
                                <span className={styles.wave}></span>
                            </div>
                            <p className={styles.tapHint}>{t('Tap to stop')}</p>
                        </div>
                    )}

                    {/* PROCESSING State */}
                    {recordingState === 'processing' && (
                        <div className={styles.processingState}>
                            <div className={styles.processingSpinner}></div>
                            <p className={styles.processingText}>{t('Processing')}...</p>
                        </div>
                    )}

                    {/* PREVIEW State */}
                    {recordingState === 'preview' && (
                        <div className={styles.previewState}>
                            <div className={styles.transcriptCard}>
                                <div className={styles.transcriptHeader}>
                                    <span className={styles.transcriptIcon}>📝</span>
                                    <span>{t('Your recording')}</span>
                                </div>
                                <textarea
                                    className={styles.transcriptText}
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    rows={5}
                                />
                                <p className={styles.editHint}>
                                    ✏️ {t('You can edit the text above if needed')}
                                </p>
                            </div>

                            <div className={styles.previewActions}>
                                <button
                                    className={styles.rerecordButton}
                                    onClick={handleRerecord}
                                >
                                    🔄 {t('Record again')}
                                </button>
                                <button
                                    className={styles.saveButton}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? t('Saving...') : `✓ ${t('Save to Logbook')}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SAVED State */}
                    {recordingState === 'saved' && (
                        <div className={styles.savedState}>
                            <div className={styles.savedIcon}>✓</div>
                            <h2 className={styles.savedTitle}>{t('Saved Successfully')}</h2>
                            <p className={styles.savedText}>
                                {isOnline
                                    ? t('Your voice intake has been recorded.')
                                    : t('Saved locally. Will sync when online.')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Privacy Notice */}
                <div className={styles.privacyNotice}>
                    <span className={styles.privacyIcon}>🔒</span>
                    <span>{t('Your recording is private. You control what is shared with doctors.')}</span>
                </div>
            </main>
        </div>
    );
}
