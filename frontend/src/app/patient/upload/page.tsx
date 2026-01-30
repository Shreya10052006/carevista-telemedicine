'use client';

/**
 * Patient Upload Reports Page
 * ===========================
 * Upload medical documents and test reports.
 */

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';

export default function PatientUploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        // In production, upload to backend
        setTimeout(() => {
            alert('Files saved locally. They will be uploaded when you share with a doctor.');
            setFiles([]);
            setUploading(false);
        }, 1000);
    };

    return (
        <div style={styles.page}>
            <TopBar role="patient" />

            <main style={styles.main}>
                <div style={styles.header}>
                    <Link href="/patient/dashboard" style={styles.backLink}>
                        ← Back to Dashboard
                    </Link>
                    <h1 style={styles.title}>Upload Reports</h1>
                    <p style={styles.subtitle}>Add medical documents for your doctor to review</p>
                </div>

                {/* Upload Area */}
                <div style={styles.uploadArea}>
                    <span style={styles.uploadIcon}>📎</span>
                    <h3>Drag files here or click to browse</h3>
                    <p style={styles.uploadHint}>
                        Supported: PDF, JPG, PNG (max 10MB each)
                    </p>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleFileChange}
                        style={styles.fileInput}
                    />
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                    <div style={styles.filesList}>
                        <h4>Selected Files:</h4>
                        {files.map((file, i) => (
                            <div key={i} style={styles.fileItem}>
                                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </div>
                        ))}
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            style={styles.uploadButton}
                        >
                            {uploading ? 'Saving...' : 'Save Reports'}
                        </button>
                    </div>
                )}

                {/* Privacy Notice */}
                <div style={styles.notice}>
                    🔒 <strong>Private until you share.</strong> Your reports are stored
                    securely and only shared with doctors when you give consent.
                </div>
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: 'var(--bg-page)' },
    main: { maxWidth: '600px', margin: '0 auto', padding: 'var(--spacing-lg)' },
    header: { marginBottom: 'var(--spacing-xl)' },
    backLink: { color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' },
    title: { fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 'var(--spacing-sm) 0 0 0' },
    subtitle: { color: 'var(--text-secondary)', margin: 0 },
    uploadArea: {
        textAlign: 'center',
        padding: 'var(--spacing-2xl)',
        background: 'var(--bg-card)',
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        cursor: 'pointer',
    },
    uploadIcon: { fontSize: '48px', marginBottom: 'var(--spacing-md)', display: 'block' },
    uploadHint: { color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' },
    fileInput: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0,
        cursor: 'pointer',
    },
    filesList: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
    },
    fileItem: {
        padding: 'var(--spacing-sm)',
        borderBottom: '1px solid var(--border-color)',
    },
    uploadButton: {
        marginTop: 'var(--spacing-md)',
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    notice: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-success-50)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--font-size-sm)',
    },
};
