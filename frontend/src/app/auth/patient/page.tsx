'use client';

/**
 * Patient Login Page
 * ==================
 * Phone OTP authentication for patients.
 * Supports DEMO MODE with bypassed OTP for demo phones.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    setupRecaptcha,
    sendPhoneOTP,
    verifyOTP,
    createUserProfile,
} from '@/lib/firebase';
import {
    DEMO_MODE,
    isDemoPhone,
    validateDemoOTP,
    getDemoPatient
} from '@/lib/demoData';
import { ConfirmationResult } from 'firebase/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/common/Logo';

export default function PatientLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, setLanguage } = useLanguage();
    const isAssistedMode = searchParams.get('mode') === 'assisted';

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isDemoLogin, setIsDemoLogin] = useState(false);

    const formatPhoneNumber = (value: string): string => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 10) return `+91${cleaned}`;
        if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
        return value;
    };

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError(t('Please enter a valid 10-digit phone number'));
            return;
        }

        setLoading(true);
        setError('');

        // Check for demo phone
        if (isDemoPhone(phoneNumber)) {
            setIsDemoLogin(true);
            setStep('otp');
            setLoading(false);
            return;
        }

        try {
            const recaptchaVerifier = setupRecaptcha('recaptcha-container');
            const formattedPhone = formatPhoneNumber(phoneNumber);
            const result = await sendPhoneOTP(formattedPhone, recaptchaVerifier);
            setConfirmationResult(result);
            setStep('otp');
        } catch (err: any) {
            console.error('OTP send error:', err);
            setError(err.message || t('Failed to send OTP'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setError(t('Please enter the 6-digit OTP'));
            return;
        }

        setLoading(true);
        setError('');

        // Demo login bypass
        if (isDemoLogin) {
            const demoCredential = validateDemoOTP(phoneNumber, otp);
            if (demoCredential) {
                const patient = getDemoPatient(demoCredential.userId);
                if (patient) {
                    // Set preferred language
                    setLanguage(patient.preferredLanguage);
                    // Store demo session
                    localStorage.setItem('demo_user_id', demoCredential.userId);
                    localStorage.setItem('demo_mode', 'true');
                    router.push('/patient/dashboard');
                    return;
                }
            }
            setError(t('Invalid OTP'));
            setLoading(false);
            return;
        }

        // Real Firebase OTP verification
        if (!confirmationResult) {
            setError(t('Please request a new OTP'));
            setLoading(false);
            return;
        }

        try {
            const user = await verifyOTP(confirmationResult, otp);
            const profileData: Record<string, string> = {};
            if (user.phoneNumber) profileData.phoneNumber = user.phoneNumber;
            if (user.displayName) profileData.displayName = user.displayName;

            await createUserProfile(
                user.uid,
                isAssistedMode ? 'health_worker' : 'patient',
                profileData
            );

            router.push(isAssistedMode ? '/health-worker/assist' : '/patient/dashboard');
        } catch (err: any) {
            console.error('OTP verify error:', err);
            setError(err.message || t('Invalid OTP'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={styles.main}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>
                        <Logo size="large" theme="primary" />
                    </div>
                    <h1 style={styles.title}>
                        {isAssistedMode ? t('Health Worker Login') : t('Patient Login')}
                    </h1>
                    <p style={styles.subtitle}>
                        {isAssistedMode
                            ? t('Login to assist patients')
                            : t('Login with your phone number')}
                    </p>
                </div>

                {/* Demo Mode Banner with Quick Fill */}
                {DEMO_MODE && (
                    <div style={styles.demoBanner}>
                        <strong>🎭 Demo Mode - Click to Auto-Fill:</strong>
                        <div style={styles.demoCredentials}>
                            <button
                                type="button"
                                onClick={() => {
                                    setPhoneNumber('9999990001');
                                    if (step === 'otp') setOtp('123456');
                                }}
                                style={styles.quickFillBtn}
                            >
                                👤 Ramesh (9999990001)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPhoneNumber('9999990002');
                                    if (step === 'otp') setOtp('654321');
                                }}
                                style={styles.quickFillBtn}
                            >
                                👤 Sita (9999990002)
                            </button>
                        </div>
                        <p style={styles.demoHint}>OTP: Ramesh=123456, Sita=654321</p>
                    </div>
                )}

                {/* Mode Badge */}
                {isAssistedMode && (
                    <div style={styles.modeBadge}>
                        🩺 {t('Assisted Mode')}
                    </div>
                )}

                {/* Error Display */}
                {error && <div style={styles.error}>{error}</div>}

                {/* Phone Input Step */}
                {step === 'phone' && (
                    <div style={styles.form}>
                        <label style={styles.label}>{t('Phone Number')}</label>
                        <div style={styles.phoneInput}>
                            <span style={styles.countryCode}>+91</span>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder={t('Enter 10-digit number')}
                                style={styles.input}
                                maxLength={10}
                                autoComplete="tel"
                            />
                        </div>

                        <div id="recaptcha-container" />

                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? t('Sending OTP...') : t('Get OTP')}
                        </button>
                    </div>
                )}

                {/* OTP Verification Step */}
                {step === 'otp' && (
                    <div style={styles.form}>
                        <div style={styles.otpSent}>
                            ✓ {isDemoLogin ? t('Demo Mode') + ' - ' : ''}{t('OTP sent to')} +91{phoneNumber}
                        </div>

                        <label style={styles.label}>{t('Enter OTP')}</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="6-digit OTP"
                            style={styles.otpInput}
                            maxLength={6}
                            autoComplete="one-time-code"
                        />

                        <button
                            onClick={handleVerifyOTP}
                            disabled={loading}
                            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? t('Verifying...') : t('Verify & Login')}
                        </button>

                        <button
                            onClick={() => {
                                setStep('phone');
                                setOtp('');
                                setConfirmationResult(null);
                                setIsDemoLogin(false);
                            }}
                            style={styles.resendBtn}
                        >
                            ← {t('Change Number')}
                        </button>
                    </div>
                )}

                {/* Back Link */}
                <a href="/" style={styles.backLink}>
                    ← {t('Back to Home')}
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
        padding: '24px',
        background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
    },
    container: {
        width: '100%',
        maxWidth: '420px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    logo: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '8px',
    },
    subtitle: {
        color: '#64748b',
        fontSize: '16px',
    },
    demoBanner: {
        padding: '16px',
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        marginBottom: '24px',
        textAlign: 'center',
    },
    demoCredentials: {
        marginTop: '8px',
        fontSize: '14px',
        color: '#92400e',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap' as const,
        justifyContent: 'center',
    },
    quickFillBtn: {
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        border: 'none',
        borderRadius: '10px',
        color: '#78350f',
        fontWeight: 600,
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
    },
    demoHint: {
        marginTop: '8px',
        fontSize: '12px',
        color: '#92400e',
        opacity: 0.8,
    },
    modeBadge: {
        padding: '12px',
        background: '#dbeafe',
        color: '#1e40af',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '24px',
        fontWeight: 600,
    },
    error: {
        padding: '16px',
        background: '#fee2e2',
        color: '#dc2626',
        borderRadius: '12px',
        marginBottom: '16px',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '28px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    label: {
        color: '#475569',
        fontSize: '14px',
        fontWeight: 600,
    },
    phoneInput: {
        display: 'flex',
        gap: '8px',
    },
    countryCode: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: '#f1f5f9',
        borderRadius: '10px',
        color: '#1e293b',
        fontWeight: 600,
    },
    input: {
        flex: 1,
        padding: '16px',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        color: '#1e293b',
        fontSize: '18px',
    },
    otpInput: {
        padding: '16px',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        color: '#1e293b',
        fontSize: '28px',
        textAlign: 'center',
        letterSpacing: '10px',
        fontFamily: 'monospace',
    },
    otpSent: {
        padding: '12px',
        background: '#dcfce7',
        color: '#16a34a',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '14px',
    },
    button: {
        padding: '16px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: '56px',
    },
    resendBtn: {
        padding: '12px',
        background: 'transparent',
        color: '#64748b',
        border: 'none',
        fontSize: '15px',
        cursor: 'pointer',
    },
    backLink: {
        display: 'block',
        textAlign: 'center',
        marginTop: '24px',
        color: '#64748b',
        textDecoration: 'none',
    },
};
