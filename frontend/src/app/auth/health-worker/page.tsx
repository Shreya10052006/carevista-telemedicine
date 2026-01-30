'use client';

/**
 * Health Worker Login Page
 * ========================
 * Worker ID + Password authentication for health workers.
 * 
 * DEMO MODE: When NEXT_PUBLIC_DEMO_MODE=true,
 * use demo credentials (hw_priya/demo123, hw_sunita/demo456, hw_kavitha/demo789)
 * 
 * ETHICAL SAFEGUARD:
 * - All actions by health workers are logged with their ID
 * - Helps track who assisted which patient
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_MODE, validateDemoHealthWorker } from '@/lib/demoData';
import { Logo } from '@/components/common/Logo';

export default function HealthWorkerLoginPage() {
    const router = useRouter();
    const [workerId, setWorkerId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Handle demo mode on client-side only to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
        setIsDemoMode(DEMO_MODE);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!workerId || !password) {
            setError('Please enter Worker ID and password');
            return;
        }

        setLoading(true);
        setError('');

        // ==================== DEMO MODE LOGIN ====================
        if (DEMO_MODE) {
            const healthWorker = validateDemoHealthWorker(workerId, password);

            if (healthWorker) {
                // Store health worker session locally
                localStorage.setItem('demo_health_worker_id', healthWorker.id);
                localStorage.setItem('demo_health_worker_name', healthWorker.name);
                localStorage.setItem('demo_health_worker_facility', healthWorker.facility);
                localStorage.setItem('demo_health_worker_location', healthWorker.facilityLocation);
                localStorage.setItem('demo_health_worker_languages', JSON.stringify(healthWorker.languages));
                localStorage.setItem('demo_health_worker_years', String(healthWorker.yearsActive));
                localStorage.setItem('demo_health_worker_patients', String(healthWorker.patientsAssisted));

                // Redirect to health worker assist page
                router.push('/health-worker/assist');
                return;
            } else {
                setLoading(false);
                setError('Invalid credentials. Try: hw_priya / demo123');
                return;
            }
        }

        // ==================== PRODUCTION LOGIN ====================
        // In production, this would verify against a backend
        try {
            // TODO: Implement production health worker authentication
            setError('Production mode not yet implemented');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={styles.main}>
            <div style={styles.container}>
                {/* Demo Mode Badge */}
                {mounted && isDemoMode && (
                    <div style={styles.demoBadge}>
                        🧪 Demo Mode Active
                    </div>
                )}

                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>
                        <Logo size="large" theme="primary" />
                    </div>
                    <h1 style={styles.title}>Health Worker Login</h1>
                    <p style={styles.subtitle}>Access patient assist mode</p>
                </div>

                {/* Error Display */}
                {error && <div style={styles.error}>{error}</div>}

                {/* Login Form */}
                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Worker ID</label>
                        <input
                            type="text"
                            value={workerId}
                            onChange={(e) => setWorkerId(e.target.value)}
                            placeholder={isDemoMode ? 'hw_priya' : 'Enter your worker ID'}
                            style={styles.input}
                            autoComplete="username"
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isDemoMode ? 'demo123' : 'Enter your password'}
                            style={styles.input}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Demo Credentials Helper - Clickable */}
                {mounted && isDemoMode && (
                    <div style={styles.demoHelp}>
                        <strong>🎭 Click to Auto-Fill:</strong>
                        <div style={styles.credentialGrid}>
                            <button
                                type="button"
                                onClick={() => {
                                    setWorkerId('hw_priya');
                                    setPassword('demo123');
                                }}
                                style={styles.quickFillBtn}
                            >
                                <span style={styles.credLabel}>Priya Lakshmi (PHC)</span>
                                <code>hw_priya / demo123</code>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setWorkerId('hw_sunita');
                                    setPassword('demo456');
                                }}
                                style={styles.quickFillBtn}
                            >
                                <span style={styles.credLabel}>Sunita Kumar (CHC)</span>
                                <code>hw_sunita / demo456</code>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setWorkerId('hw_kavitha');
                                    setPassword('demo789');
                                }}
                                style={styles.quickFillBtn}
                            >
                                <span style={styles.credLabel}>Kavitha Reddy (PHC)</span>
                                <code>hw_kavitha / demo789</code>
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Notice */}
                <div style={styles.notice}>
                    <p>
                        <strong>🔒 Accountability:</strong> All patient assistance is logged
                        with your Worker ID for audit and safety purposes.
                    </p>
                </div>

                {/* Back Link */}
                <a href="/" style={styles.backLink}>
                    ← Back to Home
                </a>
            </div>
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    main: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-lg)',
        background: 'linear-gradient(180deg, #fdf4ff 0%, #ffffff 50%)',
    },
    container: {
        width: '100%',
        maxWidth: '450px',
    },
    demoBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '1px solid #fbbf24',
        borderRadius: '50px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#92400e',
        marginBottom: '20px',
    },
    header: {
        textAlign: 'center',
        marginBottom: 'var(--spacing-xl)',
    },
    logo: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 'var(--spacing-md)',
    },
    title: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        marginBottom: 'var(--spacing-xs)',
        color: '#a855f7',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-base)',
    },
    error: {
        padding: 'var(--spacing-md)',
        background: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-xl)',
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
    },
    label: {
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
    },
    input: {
        padding: '14px 16px',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        color: 'var(--text-primary)',
        fontSize: 'var(--font-size-base)',
        transition: 'border-color 0.2s',
    },
    button: {
        padding: '16px',
        background: 'linear-gradient(135deg, #a855f7, #c084fc)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
        marginTop: 'var(--spacing-sm)',
        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
    },
    demoHelp: {
        marginTop: '24px',
        padding: '16px',
        background: '#fdf4ff',
        border: '1px solid #e9d5ff',
        borderRadius: '12px',
        fontSize: '14px',
    },
    credentialGrid: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        marginTop: '12px',
    },
    quickFillBtn: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f5d0fe, #e9d5ff)',
        border: '2px solid #c084fc',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        flexWrap: 'wrap' as const,
        gap: '8px',
    },
    credLabel: {
        fontWeight: 600,
        color: '#a855f7',
        fontSize: '13px',
    },
    notice: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: '#fef3c7',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        color: '#92400e',
        textAlign: 'center',
    },
    backLink: {
        display: 'block',
        textAlign: 'center',
        marginTop: 'var(--spacing-lg)',
        color: 'var(--text-secondary)',
    },
};
