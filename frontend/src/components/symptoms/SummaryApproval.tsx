'use client';

/**
 * Summary Approval Component (Phase 2)
 * =====================================
 * Allows patients to review, edit, and approve AI summaries before doctor sharing.
 * 
 * ETHICAL SAFEGUARD:
 * - Patients MUST approve summary before it's visible to doctors
 * - Patients can edit minor details
 * - Clear "This will be shared" warning
 */

import { useState, useCallback } from 'react';
import { speak, stop } from '@/lib/tts';

interface StructuredSummary {
    chiefComplaint: string;
    symptomTimeline: string;
    severity: string;
    pastHistory?: string;
    additionalNotes?: string;
}

interface SummaryApprovalProps {
    summary: StructuredSummary;
    rawTranscript?: string;
    language: string;
    onApprove: (editedSummary: StructuredSummary) => void;
    onReject: () => void;
    onEdit?: () => void;
}

export function SummaryApproval({
    summary,
    rawTranscript,
    language,
    onApprove,
    onReject,
}: SummaryApprovalProps) {
    const [editMode, setEditMode] = useState(false);
    const [editedSummary, setEditedSummary] = useState<StructuredSummary>(summary);
    const [isReading, setIsReading] = useState(false);

    // Read summary aloud
    const handleReadAloud = useCallback(() => {
        if (isReading) {
            stop();
            setIsReading(false);
            return;
        }

        const text = `
      Main problem: ${editedSummary.chiefComplaint}.
      Timeline: ${editedSummary.symptomTimeline}.
      Severity: ${editedSummary.severity}.
      ${editedSummary.pastHistory ? `Past history: ${editedSummary.pastHistory}.` : ''}
      ${editedSummary.additionalNotes ? `Additional notes: ${editedSummary.additionalNotes}.` : ''}
    `;

        setIsReading(true);
        speak(text, language, { onEnd: () => setIsReading(false) });
    }, [editedSummary, language, isReading]);

    // Handle field edit
    const handleFieldChange = (field: keyof StructuredSummary, value: string) => {
        setEditedSummary((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle approve
    const handleApprove = () => {
        onApprove(editedSummary);
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>📋 Review Your Summary</h2>
                <p style={styles.subtitle}>
                    Please review before sharing with your doctor
                </p>
            </div>

            {/* Warning Banner */}
            <div style={styles.warningBanner}>
                ⚠️ <strong>Important:</strong> Once approved, this summary will be
                visible to your doctor. You can edit details before approving.
            </div>

            {/* Read Aloud Button */}
            <button onClick={handleReadAloud} style={styles.readBtn}>
                {isReading ? '🔊 Stop Reading' : '🔊 Read Aloud'}
            </button>

            {/* Summary Fields */}
            <div style={styles.summaryCard}>
                {/* Chief Complaint */}
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Main Problem</label>
                    {editMode ? (
                        <textarea
                            value={editedSummary.chiefComplaint}
                            onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
                            style={styles.textarea}
                            rows={2}
                        />
                    ) : (
                        <p style={styles.fieldValue}>{editedSummary.chiefComplaint}</p>
                    )}
                </div>

                {/* Timeline */}
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>When It Started</label>
                    {editMode ? (
                        <textarea
                            value={editedSummary.symptomTimeline}
                            onChange={(e) => handleFieldChange('symptomTimeline', e.target.value)}
                            style={styles.textarea}
                            rows={2}
                        />
                    ) : (
                        <p style={styles.fieldValue}>{editedSummary.symptomTimeline}</p>
                    )}
                </div>

                {/* Severity */}
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>How Severe</label>
                    {editMode ? (
                        <input
                            type="text"
                            value={editedSummary.severity}
                            onChange={(e) => handleFieldChange('severity', e.target.value)}
                            style={styles.input}
                        />
                    ) : (
                        <p style={styles.fieldValue}>{editedSummary.severity}</p>
                    )}
                </div>

                {/* Past History (if present) */}
                {(editedSummary.pastHistory || editMode) && (
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Past History</label>
                        {editMode ? (
                            <textarea
                                value={editedSummary.pastHistory || ''}
                                onChange={(e) => handleFieldChange('pastHistory', e.target.value)}
                                style={styles.textarea}
                                rows={2}
                                placeholder="Add any relevant past history..."
                            />
                        ) : (
                            <p style={styles.fieldValue}>
                                {editedSummary.pastHistory || 'None mentioned'}
                            </p>
                        )}
                    </div>
                )}

                {/* Additional Notes (if present) */}
                {(editedSummary.additionalNotes || editMode) && (
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Additional Notes</label>
                        {editMode ? (
                            <textarea
                                value={editedSummary.additionalNotes || ''}
                                onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
                                style={styles.textarea}
                                rows={2}
                                placeholder="Add any additional notes..."
                            />
                        ) : (
                            <p style={styles.fieldValue}>
                                {editedSummary.additionalNotes || 'None'}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Toggle */}
            <button
                onClick={() => setEditMode(!editMode)}
                style={styles.editToggle}
            >
                {editMode ? '✓ Done Editing' : '✏️ Edit Summary'}
            </button>

            {/* Raw Transcript (collapsed) */}
            {rawTranscript && (
                <details style={styles.transcriptDetails}>
                    <summary style={styles.transcriptSummary}>
                        View original recording transcript
                    </summary>
                    <p style={styles.transcript}>{rawTranscript}</p>
                </details>
            )}

            {/* Action Buttons */}
            <div style={styles.actions}>
                <button onClick={handleApprove} style={styles.approveBtn}>
                    ✓ Approve & Share with Doctor
                </button>
                <button onClick={onReject} style={styles.rejectBtn}>
                    ✕ Reject - Don't Share
                </button>
            </div>

            {/* Ethical Notice */}
            <div style={styles.notice}>
                <strong>ℹ️ Note:</strong> This summary contains ONLY what you described.
                The AI has NOT added any diagnosis or medical advice.
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
    },
    header: {
        textAlign: 'center',
        marginBottom: 'var(--spacing-lg)',
    },
    title: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
        marginBottom: 'var(--spacing-xs)',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-base)',
    },
    warningBanner: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
        textAlign: 'center',
    },
    readBtn: {
        width: '100%',
        padding: 'var(--spacing-sm)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        cursor: 'pointer',
        marginBottom: 'var(--spacing-md)',
    },
    summaryCard: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-primary)',
        marginBottom: 'var(--spacing-md)',
    },
    field: {
        marginBottom: 'var(--spacing-md)',
    },
    fieldLabel: {
        display: 'block',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-xs)',
    },
    fieldValue: {
        fontSize: 'var(--font-size-lg)',
        color: 'var(--text-primary)',
        margin: 0,
        lineHeight: 1.5,
    },
    textarea: {
        width: '100%',
        padding: 'var(--spacing-sm)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    input: {
        width: '100%',
        padding: 'var(--spacing-sm)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
    },
    editToggle: {
        width: '100%',
        padding: 'var(--spacing-sm)',
        background: 'transparent',
        color: 'var(--color-primary)',
        border: '2px dashed var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        cursor: 'pointer',
        marginBottom: 'var(--spacing-md)',
    },
    transcriptDetails: {
        marginBottom: 'var(--spacing-lg)',
    },
    transcriptSummary: {
        cursor: 'pointer',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-sm)',
    },
    transcript: {
        marginTop: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        fontStyle: 'italic',
        color: 'var(--text-muted)',
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
    },
    approveBtn: {
        padding: 'var(--spacing-lg)',
        background: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        cursor: 'pointer',
        minHeight: '64px',
    },
    rejectBtn: {
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--color-danger)',
        border: '2px solid var(--color-danger)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    notice: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        textAlign: 'center',
    },
};
