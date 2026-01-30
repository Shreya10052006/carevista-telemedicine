'use client';

/**
 * Text Input Component for Symptoms
 * ==================================
 * Large, accessible text input for typing symptoms.
 */

import React, { useState } from 'react';

interface TextInputProps {
    hasConsent: boolean;
    onSubmit: (text: string, language: string) => void;
    disabled?: boolean;
}

const LANGUAGES = [
    { code: 'english', label: 'English', native: 'English' },
    { code: 'tamil', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hindi', label: 'Hindi', native: 'हिंदी' },
    { code: 'telugu', label: 'Telugu', native: 'తెలుగు' },
];

export function TextInput({ hasConsent, onSubmit, disabled = false }: TextInputProps) {
    const [text, setText] = useState('');
    const [language, setLanguage] = useState('english');
    const [showConsentWarning, setShowConsentWarning] = useState(false);

    const handleSubmit = () => {
        if (!hasConsent) {
            setShowConsentWarning(true);
            return;
        }

        if (text.trim()) {
            onSubmit(text.trim(), language);
            setText('');
            setShowConsentWarning(false);
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

            {/* Language Selector */}
            <div style={styles.languageSelector}>
                <label style={styles.label}>Writing in:</label>
                <div style={styles.languageButtons}>
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            style={{
                                ...styles.languageBtn,
                                ...(language === lang.code ? styles.languageBtnActive : {}),
                            }}
                        >
                            {lang.native}
                        </button>
                    ))}
                </div>
            </div>

            {/* Text Area */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe your symptoms here... (e.g., I have had a headache for 3 days)"
                style={styles.textarea}
                disabled={disabled}
                rows={6}
            />

            {/* Character Count */}
            <div style={styles.charCount}>{text.length} characters</div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={disabled || !text.trim()}
                style={{
                    ...styles.submitBtn,
                    opacity: disabled || !text.trim() ? 0.5 : 1,
                }}
            >
                ✓ Save Symptoms
            </button>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--spacing-lg)',
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
        textAlign: 'center',
    },
    languageSelector: {
        marginBottom: 'var(--spacing-md)',
    },
    label: {
        display: 'block',
        marginBottom: 'var(--spacing-sm)',
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
    },
    languageButtons: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
    },
    languageBtn: {
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
    languageBtnActive: {
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
    },
    textarea: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        lineHeight: 1.6,
        resize: 'vertical',
        minHeight: '150px',
    },
    charCount: {
        textAlign: 'right',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-sm)',
        marginTop: 'var(--spacing-xs)',
        marginBottom: 'var(--spacing-md)',
    },
    submitBtn: {
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
};
