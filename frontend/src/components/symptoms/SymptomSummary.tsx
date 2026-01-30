'use client';

/**
 * Symptom Summary Display Component
 * ==================================
 * Displays the AI-generated structured summary.
 * 
 * ETHICAL SAFEGUARD:
 * - Shows ONLY structured fields
 * - NO diagnosis, treatment, or medical advice
 * - If AI fails, shows raw transcript with clear message
 */

import React from 'react';
import { speak, stop, isSpeaking } from '@/lib/tts';

interface StructuredSummary {
    chiefComplaint: string;
    symptomTimeline: string;
    severity: string;
    pastHistory?: string;
    attachedReports?: string[];
}

interface SymptomSummaryProps {
    summary: StructuredSummary | null;
    translation?: string;
    language: string;
    aiFailed?: boolean;
    rawTranscript?: string;
    isLoading?: boolean;
}

export function SymptomSummary({
    summary,
    translation,
    language,
    aiFailed = false,
    rawTranscript,
    isLoading = false,
}: SymptomSummaryProps) {
    const [isSpeakingText, setIsSpeakingText] = React.useState(false);

    const handleReadAloud = () => {
        if (isSpeakingText) {
            stop();
            setIsSpeakingText(false);
        } else {
            const textToRead = translation || formatSummaryForSpeech(summary);
            speak(textToRead, language, {
                onStart: () => setIsSpeakingText(true),
                onEnd: () => setIsSpeakingText(false),
            });
        }
    };

    const formatSummaryForSpeech = (s: StructuredSummary | null): string => {
        if (!s) return '';
        let text = `Chief complaint: ${s.chiefComplaint}. `;
        text += `Timeline: ${s.symptomTimeline}. `;
        text += `Severity: ${s.severity}. `;
        if (s.pastHistory) {
            text += `Past history: ${s.pastHistory}. `;
        }
        return text;
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <div style={styles.spinner} />
                    <p>Processing your symptoms...</p>
                    <p style={styles.loadingNote}>This may take a moment</p>
                </div>
            </div>
        );
    }

    if (aiFailed) {
        return (
            <div style={styles.container}>
                <div style={styles.aiFailedBanner}>
                    <span>⚠️</span>
                    <div>
                        <strong>AI Summary Unavailable</strong>
                        <p>The doctor will see your original description below.</p>
                    </div>
                </div>
                <div style={styles.rawTranscript}>
                    <h4>Your Description:</h4>
                    <p>{rawTranscript}</p>
                </div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div style={styles.container}>
                <p style={styles.noData}>No summary available yet.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>📋 Symptom Summary</h3>
                <button onClick={handleReadAloud} style={styles.readBtn}>
                    {isSpeakingText ? '🔇 Stop' : '🔊 Read Aloud'}
                </button>
            </div>

            {/* Translated Version (if different language) */}
            {translation && (
                <div style={styles.translationBox}>
                    <p>{translation}</p>
                </div>
            )}

            {/* Structured Summary */}
            <div style={styles.summaryGrid}>
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Chief Complaint</label>
                    <p style={styles.fieldValue}>{summary.chiefComplaint}</p>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Symptom Timeline</label>
                    <p style={styles.fieldValue}>{summary.symptomTimeline}</p>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Severity</label>
                    <p style={styles.fieldValue}>{summary.severity}</p>
                </div>

                {summary.pastHistory && (
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Relevant Past History</label>
                        <p style={styles.fieldValue}>{summary.pastHistory}</p>
                    </div>
                )}

                {summary.attachedReports && summary.attachedReports.length > 0 && (
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Attached Reports</label>
                        <ul style={styles.reportList}>
                            {summary.attachedReports.map((report, i) => (
                                <li key={i}>{report}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Ethical Notice */}
            <div style={styles.notice}>
                <p>
                    <strong>Note:</strong> This is a summary of your symptoms, not a medical
                    diagnosis. A doctor will review this information.
                </p>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
    },
    title: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: 0,
    },
    readBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    translationBox: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-lg)',
        fontSize: 'var(--font-size-lg)',
        lineHeight: 1.6,
    },
    summaryGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
    },
    field: {
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
    },
    fieldLabel: {
        display: 'block',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        marginBottom: 'var(--spacing-xs)',
        fontWeight: 600,
    },
    fieldValue: {
        fontSize: 'var(--font-size-base)',
        color: 'var(--text-primary)',
        margin: 0,
        lineHeight: 1.5,
    },
    reportList: {
        margin: 0,
        paddingLeft: 'var(--spacing-lg)',
        color: 'var(--text-primary)',
    },
    notice: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-warning)',
    },
    loading: {
        textAlign: 'center',
        padding: 'var(--spacing-xl)',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid var(--border-color)',
        borderTop: '4px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto var(--spacing-md)',
    },
    loadingNote: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
    },
    aiFailedBanner: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
        color: 'var(--color-warning)',
    },
    rawTranscript: {
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
    },
    noData: {
        textAlign: 'center',
        color: 'var(--text-muted)',
        padding: 'var(--spacing-xl)',
    },
};
