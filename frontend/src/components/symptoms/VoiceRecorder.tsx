'use client';

/**
 * Voice Recorder Component
 * ========================
 * Visual audio recorder with waveform feedback.
 * 
 * ETHICAL SAFEGUARD:
 * - BLOCKS recording until consent is verified
 * - Clear visual feedback during recording
 * - Stores locally first (offline-first)
 */

import React, { useState } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderProps {
    hasConsent: boolean;
    onRecordingComplete: (audioBlob: Blob) => void;
    language: string;
    disabled?: boolean;
}

export function VoiceRecorder({
    hasConsent,
    onRecordingComplete,
    language,
    disabled = false,
}: VoiceRecorderProps) {
    const {
        isRecording,
        isPaused,
        formattedDuration,
        audioBlob,
        audioUrl,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearRecording,
        hasRecording,
    } = useVoiceRecorder();

    const [showConsentWarning, setShowConsentWarning] = useState(false);

    const handleStartRecording = () => {
        if (!hasConsent) {
            setShowConsentWarning(true);
            return;
        }
        setShowConsentWarning(false);
        startRecording();
    };

    const handleSaveRecording = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            clearRecording();
        }
    };

    return (
        <div style={styles.container}>
            {/* Consent Warning */}
            {showConsentWarning && (
                <div style={styles.consentWarning}>
                    ⚠️ Please provide recording consent first
                </div>
            )}

            {/* Error Display */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Recording Status */}
            {isRecording && (
                <div style={styles.recordingStatus}>
                    <div style={styles.recordingIndicator}>
                        <span style={styles.recordingDot} />
                        {isPaused ? 'Paused' : 'Recording'}
                    </div>
                    <div style={styles.timer}>{formattedDuration}</div>
                </div>
            )}

            {/* Waveform Visualization (simplified) */}
            {isRecording && !isPaused && (
                <div style={styles.waveform}>
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                ...styles.waveformBar,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Audio Preview */}
            {hasRecording && audioUrl && (
                <div style={styles.preview}>
                    <audio controls src={audioUrl} style={styles.audio} />
                </div>
            )}

            {/* Controls */}
            <div style={styles.controls}>
                {!isRecording && !hasRecording && (
                    <button
                        onClick={handleStartRecording}
                        disabled={disabled}
                        style={{
                            ...styles.recordBtn,
                            opacity: disabled ? 0.5 : 1,
                        }}
                    >
                        <span style={styles.recordIcon}>🎤</span>
                        Start Recording
                    </button>
                )}

                {isRecording && (
                    <>
                        {!isPaused ? (
                            <button onClick={pauseRecording} style={styles.controlBtn}>
                                ⏸️ Pause
                            </button>
                        ) : (
                            <button onClick={resumeRecording} style={styles.controlBtn}>
                                ▶️ Resume
                            </button>
                        )}
                        <button onClick={stopRecording} style={styles.stopBtn}>
                            ⏹️ Stop
                        </button>
                    </>
                )}

                {hasRecording && (
                    <>
                        <button onClick={handleSaveRecording} style={styles.saveBtn}>
                            ✓ Save Recording
                        </button>
                        <button onClick={clearRecording} style={styles.discardBtn}>
                            ✗ Discard
                        </button>
                    </>
                )}
            </div>

            {/* Language Indicator */}
            <div style={styles.languageTag}>
                Speaking in: <strong>{language}</strong>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--spacing-xl)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
    },
    consentWarning: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
        fontWeight: 600,
        width: '100%',
        textAlign: 'center',
    },
    error: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
        width: '100%',
        textAlign: 'center',
    },
    recordingStatus: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
    },
    recordingIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        color: 'var(--color-danger)',
        fontWeight: 600,
        fontSize: 'var(--font-size-lg)',
    },
    recordingDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'var(--color-danger)',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    timer: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        fontFamily: 'monospace',
        marginTop: 'var(--spacing-sm)',
    },
    waveform: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '60px',
        marginBottom: 'var(--spacing-lg)',
    },
    waveformBar: {
        width: '6px',
        background: 'var(--color-primary)',
        borderRadius: '3px',
        animation: 'waveform 0.5s ease-in-out infinite alternate',
    },
    preview: {
        width: '100%',
        marginBottom: 'var(--spacing-lg)',
    },
    audio: {
        width: '100%',
        borderRadius: 'var(--radius-md)',
    },
    controls: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-md)',
        justifyContent: 'center',
        marginBottom: 'var(--spacing-md)',
    },
    recordBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md) var(--spacing-xl)',
        background: 'var(--color-danger)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
    },
    recordIcon: {
        fontSize: '24px',
    },
    controlBtn: {
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '48px',
    },
    stopBtn: {
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        background: 'var(--color-danger)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '48px',
    },
    saveBtn: {
        padding: 'var(--spacing-md) var(--spacing-xl)',
        background: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
    },
    discardBtn: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
    },
    languageTag: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
    },
};

// Add waveform animation to global styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes waveform {
      0% { height: 10px; }
      100% { height: 40px; }
    }
  `;
    document.head.appendChild(style);
}
