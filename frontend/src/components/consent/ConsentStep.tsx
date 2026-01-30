'use client';

/**
 * Consent Step Component
 * ======================
 * Single consent screen with one idea.
 * Large text, clear buttons, voice support.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { isTTSSupported, isSpeaking as checkIsSpeaking } from '@/lib/tts';

interface ConsentStepProps {
    title: string;
    description: string;
    details: string[];
    onAgree: () => void;
    onDecline: () => void;
    onBack: () => void;
    onReadAloud: () => void;
    showBack: boolean;
}

export function ConsentStep({
    title,
    description,
    details,
    onAgree,
    onDecline,
    onBack,
    onReadAloud,
    showBack,
}: ConsentStepProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsSupported, setTtsSupported] = useState(true);

    // Check TTS support on mount
    useEffect(() => {
        setTtsSupported(isTTSSupported());
    }, []);

    // Poll for speaking state
    useEffect(() => {
        if (!isSpeaking) return;

        const interval = setInterval(() => {
            if (!checkIsSpeaking()) {
                setIsSpeaking(false);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [isSpeaking]);

    const handleReadAloud = useCallback(() => {
        setIsSpeaking(true);
        onReadAloud();
    }, [onReadAloud]);

    return (
        <div style={styles.container}>
            {/* Title */}
            <h1 style={styles.title}>{title}</h1>

            {/* Read Aloud Button */}
            <button
                onClick={handleReadAloud}
                style={{
                    ...styles.readAloudBtn,
                    ...(isSpeaking ? styles.readAloudBtnActive : {}),
                    ...((!ttsSupported) ? styles.readAloudBtnDisabled : {}),
                }}
                disabled={!ttsSupported}
                title={!ttsSupported ? 'Text-to-speech not supported in this browser' : ''}
            >
                {isSpeaking ? '🔊 Speaking...' : '🔊 Read Aloud'}
            </button>

            {!ttsSupported && (
                <p style={styles.ttsWarning}>
                    ⚠️ Voice reading not available in this browser
                </p>
            )}

            {/* Description */}
            <p style={styles.description}>{description}</p>

            {/* Details List */}
            <ul style={styles.detailsList}>
                {details.map((detail, index) => (
                    <li key={index} style={styles.detailItem}>
                        <span style={styles.checkIcon}>✓</span>
                        <span>{detail}</span>
                    </li>
                ))}
            </ul>

            {/* Action Buttons */}
            <div style={styles.actions}>
                <button onClick={onAgree} style={styles.agreeBtn}>
                    ✓ I Agree
                </button>
                <button onClick={onDecline} style={styles.declineBtn}>
                    ✗ I Do Not Agree
                </button>
            </div>

            {/* Back Button */}
            {showBack && (
                <button onClick={onBack} style={styles.backBtn}>
                    ← Go Back
                </button>
            )}

            {/* Privacy Note */}
            <p style={styles.privacyNote}>
                🔒 Your data is private and secure. You can change your mind anytime.
            </p>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
    },
    title: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        marginBottom: 'var(--spacing-md)',
        color: 'var(--text-primary)',
    },
    readAloudBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: 'var(--spacing-lg)',
    },
    description: {
        fontSize: 'var(--font-size-lg)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--spacing-lg)',
        lineHeight: 1.6,
    },
    detailsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        width: '100%',
        marginBottom: 'var(--spacing-xl)',
    },
    detailItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-sm)',
        textAlign: 'left',
        fontSize: 'var(--font-size-base)',
        color: 'var(--text-secondary)',
    },
    checkIcon: {
        color: 'var(--color-success)',
        fontWeight: 'bold',
        fontSize: '1.2em',
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        width: '100%',
        marginBottom: 'var(--spacing-lg)',
    },
    agreeBtn: {
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
    declineBtn: {
        padding: 'var(--spacing-md) var(--spacing-xl)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
    },
    backBtn: {
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: 'none',
        fontSize: 'var(--font-size-base)',
        cursor: 'pointer',
        marginBottom: 'var(--spacing-md)',
    },
    privacyNote: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        marginTop: 'auto',
    },
    readAloudBtnActive: {
        background: 'var(--color-primary)',
        color: 'white',
        animation: 'pulse 1.5s infinite',
    },
    readAloudBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    ttsWarning: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        marginBottom: 'var(--spacing-md)',
    },
};
