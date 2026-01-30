'use client';

/**
 * File Upload Component (Phase 3)
 * ================================
 * Allows patients or health workers to upload reports/images.
 * 
 * ETHICAL SAFEGUARD:
 * - NO automatic analysis of images
 * - NO AI interpretation of reports
 * - Doctors see reports ONLY if approved by patient
 * 
 * OFFLINE-FIRST:
 * - Files stored locally in IndexedDB
 * - Synced when online
 */

import { useState, useCallback, useRef } from 'react';
import { saveReport, approveReportForSharing } from '@/lib/indexedDB';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
    isAssistedMode?: boolean;
    symptomId?: string;
    onUploadComplete?: (reportId: string) => void;
}

interface UploadedFile {
    id: string;
    fileName: string;
    fileType: string;
    preview?: string;
    approved: boolean;
}

export function FileUpload({
    isAssistedMode = false,
    symptomId,
    onUploadComplete,
}: FileUploadProps) {
    const { user } = useAuth();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileSelect = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || !user?.uid) return;

            setIsUploading(true);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
                if (!validTypes.includes(file.type)) {
                    alert(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`);
                    continue;
                }

                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File too large: ${file.name}. Maximum size is 10MB.`);
                    continue;
                }

                // Save to IndexedDB
                const reportId = await saveReport(
                    user.uid,
                    {
                        fileName: file.name,
                        fileType: file.type,
                        fileBlob: file,
                        uploadedBy: isAssistedMode ? 'health_worker' : 'patient',
                    },
                    symptomId,
                    isAssistedMode ? user.uid : undefined
                );

                // Create preview for images
                let preview: string | undefined;
                if (file.type.startsWith('image/')) {
                    preview = URL.createObjectURL(file);
                }

                setUploadedFiles((prev) => [
                    ...prev,
                    {
                        id: reportId,
                        fileName: file.name,
                        fileType: file.type,
                        preview,
                        approved: false,
                    },
                ]);

                onUploadComplete?.(reportId);
            }

            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [user?.uid, isAssistedMode, symptomId, onUploadComplete]
    );

    // Toggle approval for sharing
    const handleApprovalToggle = useCallback(async (id: string) => {
        const file = uploadedFiles.find((f) => f.id === id);
        if (!file) return;

        if (!file.approved) {
            await approveReportForSharing(id);
        }

        setUploadedFiles((prev) =>
            prev.map((f) =>
                f.id === id ? { ...f, approved: !f.approved } : f
            )
        );
    }, [uploadedFiles]);

    // Remove file
    const handleRemove = useCallback((id: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>📄 Upload Reports / Images</h3>
            <p style={styles.subtitle}>
                Upload medical reports, test results, or photos of prescriptions.
            </p>

            {/* Entered By Label */}
            <div style={styles.enteredByBadge}>
                {isAssistedMode ? '👩‍⚕️ Uploaded by: Health Worker' : '👤 Uploaded by: Patient'}
            </div>

            {/* Upload Area */}
            <div
                style={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <span style={styles.dropzoneIcon}>📤</span>
                <p style={styles.dropzoneText}>
                    {isUploading ? 'Uploading...' : 'Tap to select files'}
                </p>
                <p style={styles.dropzoneHint}>
                    Images (JPG, PNG) or PDFs • Max 10MB each
                </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div style={styles.fileList}>
                    <h4 style={styles.fileListTitle}>Uploaded Files</h4>
                    {uploadedFiles.map((file) => (
                        <div key={file.id} style={styles.fileItem}>
                            <div style={styles.fileInfo}>
                                {file.preview ? (
                                    <img src={file.preview} alt={file.fileName} style={styles.preview} />
                                ) : (
                                    <span style={styles.pdfIcon}>📄</span>
                                )}
                                <span style={styles.fileName}>{file.fileName}</span>
                            </div>

                            {/* Approval Checkbox */}
                            <div style={styles.approvalRow}>
                                <label style={styles.approvalLabel}>
                                    <input
                                        type="checkbox"
                                        checked={file.approved}
                                        onChange={() => handleApprovalToggle(file.id)}
                                        style={styles.checkbox}
                                    />
                                    Share with doctor
                                </label>
                                <button
                                    onClick={() => handleRemove(file.id)}
                                    style={styles.removeBtn}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ethical Notice */}
            <div style={styles.notice}>
                <strong>ℹ️ Important:</strong>
                <ul style={styles.noticeList}>
                    <li>Reports are stored locally until you approve sharing</li>
                    <li>The system does NOT analyze or interpret these documents</li>
                    <li>Only your doctor will review these reports</li>
                </ul>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--spacing-lg)',
    },
    title: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        marginBottom: 'var(--spacing-xs)',
    },
    subtitle: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-md)',
    },
    enteredByBadge: {
        display: 'inline-block',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-lg)',
    },
    dropzone: {
        padding: 'var(--spacing-xl)',
        border: '3px dashed var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        cursor: 'pointer',
        marginBottom: 'var(--spacing-lg)',
        background: 'var(--bg-secondary)',
    },
    dropzoneIcon: {
        fontSize: '48px',
        display: 'block',
        marginBottom: 'var(--spacing-sm)',
    },
    dropzoneText: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        margin: 0,
    },
    dropzoneHint: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        margin: 'var(--spacing-xs) 0 0',
    },
    fileList: {
        marginBottom: 'var(--spacing-lg)',
    },
    fileListTitle: {
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-sm)',
    },
    fileItem: {
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-sm)',
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-sm)',
    },
    preview: {
        width: '48px',
        height: '48px',
        objectFit: 'cover',
        borderRadius: 'var(--radius-sm)',
    },
    pdfIcon: {
        fontSize: '32px',
    },
    fileName: {
        flex: 1,
        fontSize: 'var(--font-size-sm)',
        wordBreak: 'break-all',
    },
    approvalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    approvalLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        fontSize: 'var(--font-size-sm)',
        cursor: 'pointer',
    },
    checkbox: {
        width: '20px',
        height: '20px',
    },
    removeBtn: {
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
    },
    notice: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning-dark)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
    },
    noticeList: {
        margin: 'var(--spacing-xs) 0 0 var(--spacing-lg)',
        padding: 0,
    },
};
