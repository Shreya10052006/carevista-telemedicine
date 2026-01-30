'use client';

/**
 * Doctor Login Page
 * =================
 * Email/password authentication for doctors.
 * 
 * DEMO MODE: When NEXT_PUBLIC_DEMO_MODE=true,
 * use demo credentials (doctor_vijay/demo123 or doctor_priya/demo456)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInDoctor, createUserProfile } from '@/lib/firebase';
import { DEMO_MODE, validateDemoDoctor } from '@/lib/demoData';
import { Logo } from '@/components/common/Logo';

export default function DoctorLoginPage() {
    const router = useRouter();
    const [loginId, setLoginId] = useState('');
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

        if (!loginId || !password) {
            setError('Please enter login ID and password');
            return;
        }

        setLoading(true);
        setError('');

        // ==================== DEMO MODE LOGIN ====================
        if (DEMO_MODE) {
            const demoDoctor = validateDemoDoctor(loginId, password);

            if (demoDoctor) {
                // Store demo doctor session locally
                localStorage.setItem('demo_doctor_id', demoDoctor.id);
                localStorage.setItem('demo_doctor_name', demoDoctor.name);
                localStorage.setItem('demo_doctor_specialty', demoDoctor.specialty);
                localStorage.setItem('demo_doctor_experience', String(demoDoctor.experience));
                localStorage.setItem('demo_doctor_languages', JSON.stringify(demoDoctor.languages));

                // Redirect to doctor dashboard
                router.push('/doctor/dashboard');
                return;
            } else {
                setLoading(false);
                setError('Invalid demo credentials. Try: doctor_vijay / demo123');
                return;
            }
        }

        // ==================== PRODUCTION LOGIN ====================
        try {
            const user = await signInDoctor(loginId, password); // loginId is email in production

            // Build profile data dynamically - NEVER include undefined
            const profileData: Record<string, string> = {};
            if (user.email) {
                profileData.email = user.email;
            }
            if (user.displayName) {
                profileData.displayName = user.displayName;
            }

            // Create/update doctor profile
            await createUserProfile(user.uid, 'doctor', profileData);

            router.push('/doctor/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);

            // Friendly error messages
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
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
                    <h1 style={styles.title}>Doctor Login</h1>
                    <p style={styles.subtitle}>Access your consultation dashboard</p>
                </div>

                {/* Error Display */}
                {error && <div style={styles.error}>{error}</div>}

                {/* Login Form */}
                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            {isDemoMode ? 'Login ID' : 'Email Address'}
                        </label>
                        <input
                            type={isDemoMode ? 'text' : 'email'}
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            placeholder={isDemoMode ? 'doctor_vijay' : 'doctor@hospital.com'}
                            style={styles.input}
                            autoComplete={isDemoMode ? 'username' : 'email'}
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
                                    setLoginId('doctor_vijay');
                                    setPassword('demo123');
                                }}
                                style={styles.quickFillBtn}
                            >
                                <span style={styles.credLabel}>Dr. Vijay Kumar</span>
                                <code>doctor_vijay / demo123</code>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginId('doctor_priya');
                                    setPassword('demo456');
                                }}
                                style={styles.quickFillBtn}
                            >
                                <span style={styles.credLabel}>Dr. Priya Sharma</span>
                                <code>doctor_priya / demo456</code>
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Notice (Production only) */}
                {mounted && !isDemoMode && (
                    <div style={styles.notice}>
                        <p>
                            <strong>Note:</strong> Doctor accounts are created by hospital
                            administrators. Contact your IT department if you don&apos;t have access.
                        </p>
                    </div>
                )}

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
        background: 'linear-gradient(180deg, #f0fdfa 0%, #ffffff 50%)',
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
        color: '#0d9488',
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
        background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
        marginTop: 'var(--spacing-sm)',
        boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)',
    },
    demoHelp: {
        marginTop: '24px',
        padding: '16px',
        background: '#f0fdfa',
        border: '1px solid #99f6e4',
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
        background: 'linear-gradient(135deg, #ccfbf1, #99f6e4)',
        border: '2px solid #14b8a6',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
    },
    credLabel: {
        fontWeight: 600,
        color: '#0d9488',
    },
    notice: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        textAlign: 'center',
    },
    backLink: {
        display: 'block',
        textAlign: 'center',
        marginTop: 'var(--spacing-lg)',
        color: 'var(--text-secondary)',
    },
};
