'use client';

/**
 * Patient History Page
 * ====================
 * View past symptom logs and consultations.
 */

import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';

export default function PatientHistoryPage() {
    return (
        <div style={styles.page}>
            <TopBar role="patient" />

            <main style={styles.main}>
                <div style={styles.header}>
                    <Link href="/patient/dashboard" style={styles.backLink}>
                        ← Back to Dashboard
                    </Link>
                    <h1 style={styles.title}>My Records</h1>
                    <p style={styles.subtitle}>Your symptom logs and consultation history</p>
                </div>

                {/* Empty State */}
                <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>📄</span>
                    <h2 style={styles.emptyTitle}>No Records Yet</h2>
                    <p style={styles.emptyText}>
                        Your symptom logs, consultation summaries, and prescriptions
                        will appear here.
                    </p>
                    <Link href="/patient/symptoms" style={styles.actionButton}>
                        Start by Logging Symptoms →
                    </Link>
                </div>

                {/* Privacy Notice */}
                <div style={styles.notice}>
                    🔒 <strong>Your data is private.</strong> Only you and the doctors
                    you consent to share with can see your records.
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
    emptyState: {
        textAlign: 'center',
        padding: 'var(--spacing-2xl)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
    },
    emptyIcon: { fontSize: '64px', marginBottom: 'var(--spacing-md)', display: 'block' },
    emptyTitle: { fontSize: 'var(--font-size-xl)', margin: '0 0 var(--spacing-sm) 0' },
    emptyText: { color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' },
    actionButton: {
        display: 'inline-block',
        padding: 'var(--spacing-md) var(--spacing-xl)',
        background: 'var(--color-primary)',
        color: 'white',
        borderRadius: 'var(--radius-lg)',
        fontWeight: 600,
        textDecoration: 'none',
    },
    notice: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-success-50)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--font-size-sm)',
    },
};
