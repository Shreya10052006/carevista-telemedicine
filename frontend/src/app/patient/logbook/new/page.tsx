'use client';

/**
 * New Logbook Entry Page
 * ======================
 * Create manual text or voice-based logbook entries.
 * Supports offline persistence with IndexedDB.
 */

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { SyncBanner } from '@/components/common/SyncBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import { saveLogbookEntry } from '@/lib/indexedDB';
import { DEMO_MODE } from '@/lib/demoData';
import { createLogbookEntry } from '@/lib/demoSessionStore';

export default function NewLogbookEntryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useLanguage();
    const { isOnline } = useOffline();

    const entryType = searchParams.get('type') || 'manual';

    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [savedOffline, setSavedOffline] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleStartRecording = () => {
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Simulate STT result
        const demoTranscripts = {
            en: 'I have been feeling tired since yesterday. Mild headache in the morning.',
            ta: 'நேற்று முதல் சோர்வாக இருக்கிறேன். காலையில் லேசான தலைவலி.',
            hi: 'कल से थकान महसूस हो रही है। सुबह हल्का सिरदर्द था।',
        };
        setTranscript(demoTranscripts[language] || demoTranscripts.en);
    };

    const handleSave = async () => {
        const content = entryType === 'voice' ? transcript : text;
        if (!content.trim()) return;

        setIsSaving(true);

        try {
            const userId = localStorage.getItem('demo_user_id') || 'unknown-user';

            // Save to IndexedDB (works offline)
            await saveLogbookEntry(userId, {
                type: entryType as 'manual' | 'voice',
                originalText: content,
                structuredSummary: {
                    chiefComplaint: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
                    additionalNotes: `Entry created ${isOnline ? 'online' : 'offline'}`,
                },
            });

            // Save to demo session store for immediate display
            if (DEMO_MODE) {
                createLogbookEntry(
                    userId,
                    entryType as 'manual' | 'voice',
                    content,
                    {
                        chiefComplaint: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
                        severity: 'To be assessed',
                    }
                );
            }

            if (!isOnline) {
                setSavedOffline(true);
                // Show saved locally message briefly, then redirect
                setTimeout(() => {
                    router.push('/patient/logbook');
                }, 1500);
            } else {
                router.push('/patient/logbook');
            }
        } catch (error) {
            console.error('Failed to save entry:', error);
            alert(t('Failed to save entry. Please try again.'));
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
        <div style={styles.page}>
            <TopBar role="patient" />

            {/* Sync Banner - shows offline/syncing status */}
            <SyncBanner />

            {DEMO_MODE && (
                <div style={styles.demoBadge}>🎭 {t('Demo Mode')}</div>
            )}

            <main style={styles.main}>
                <div style={styles.header}>
                    <Link href="/patient/logbook" style={styles.backLink}>
                        ← {t('Logbook')}
                    </Link>
                    <h1 style={styles.title}>
                        {entryType === 'voice' ? '🎤' : '✍️'} {t('New Entry')}
                    </h1>
                </div>

                {/* Saved Offline Success */}
                {savedOffline && (
                    <div style={styles.offlineSuccess}>
                        ✅ {t('Saved locally! Will sync when online.')}
                    </div>
                )}

                {/* Manual Entry */}
                {entryType === 'manual' && !savedOffline && (
                    <div style={styles.entryForm}>
                        <label style={styles.label}>{t('Describe how you feel')}</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={language === 'ta' ? 'உங்கள் அறிகுறிகளை விவரிக்கவும்...' :
                                language === 'hi' ? 'अपने लक्षण बताएं...' :
                                    'Describe your symptoms...'}
                            style={styles.textarea}
                            rows={6}
                        />
                        <p style={styles.hint}>
                            💡 {t('Include when it started, how severe, and any changes')}
                        </p>
                    </div>
                )}

                {/* Voice Entry */}
                {entryType === 'voice' && !savedOffline && (
                    <div style={styles.voiceForm}>
                        {!transcript ? (
                            <>
                                <div style={styles.recordButton}>
                                    {isRecording ? (
                                        <button style={styles.stopBtn} onClick={handleStopRecording}>
                                            <span style={styles.recordingDot}></span>
                                            {formatTime(recordingTime)}
                                            <br />
                                            <small>{t('Tap to stop')}</small>
                                        </button>
                                    ) : (
                                        <button style={styles.startBtn} onClick={handleStartRecording}>
                                            🎤
                                            <br />
                                            <small>{t('Tap to record')}</small>
                                        </button>
                                    )}
                                </div>
                                <p style={styles.voiceHint}>
                                    {t('Speak clearly about your symptoms')}
                                </p>
                            </>
                        ) : (
                            <div style={styles.transcriptSection}>
                                <label style={styles.label}>{t('Transcript')}</label>
                                <textarea
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    style={styles.textarea}
                                    rows={5}
                                />
                                <p style={styles.hint}>
                                    ✏️ {t('You can edit the transcript above')}
                                </p>
                                <button
                                    style={styles.rerecordBtn}
                                    onClick={() => setTranscript('')}
                                >
                                    🔄 {t('Record again')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button */}
                {!savedOffline && (
                    <button
                        style={{ ...styles.saveButton, opacity: (entryType === 'manual' ? text : transcript) ? 1 : 0.5 }}
                        onClick={handleSave}
                        disabled={!(entryType === 'manual' ? text : transcript) || isSaving}
                    >
                        {isSaving ? t('Saving...') : t('Save to Logbook')}
                    </button>
                )}

                {/* Privacy Notice */}
                <div style={styles.privacyNotice}>
                    🔒 {t('Entry will be saved locally. You can share it with doctors later.')}
                    {!isOnline && (
                        <div style={styles.offlineNote}>
                            📴 {t('You are offline. Entry will sync when connected.')}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: '#f8fafc' },
    demoBadge: { padding: '8px', background: '#fef3c7', textAlign: 'center', fontSize: '13px', color: '#92400e' },
    main: { maxWidth: '500px', margin: '0 auto', padding: '24px 16px' },
    header: { marginBottom: '24px' },
    backLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px' },
    title: { fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '8px 0 0 0' },
    offlineSuccess: {
        padding: '16px',
        background: '#d1fae5',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#065f46',
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '16px',
    },
    entryForm: { marginBottom: '24px' },
    label: { display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '8px' },
    textarea: { width: '100%', padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
    hint: { fontSize: '14px', color: '#64748b', marginTop: '8px' },
    voiceForm: { marginBottom: '24px' },
    recordButton: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
    startBtn: { width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #0d9488)', border: 'none', color: 'white', fontSize: '48px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' },
    stopBtn: { width: '140px', height: '140px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', fontWeight: 700 },
    recordingDot: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'white', marginRight: '8px', animation: 'pulse 1s infinite' },
    voiceHint: { textAlign: 'center', color: '#64748b', fontSize: '15px' },
    transcriptSection: { marginBottom: '20px' },
    rerecordBtn: { marginTop: '12px', padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '14px', color: '#64748b', cursor: 'pointer' },
    saveButton: { width: '100%', padding: '16px', background: '#16a34a', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 600, color: 'white', cursor: 'pointer', marginBottom: '16px' },
    privacyNotice: { padding: '14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', textAlign: 'center', color: '#16a34a', fontSize: '14px' },
    offlineNote: { marginTop: '8px', color: '#dc2626', fontSize: '13px' },
};
