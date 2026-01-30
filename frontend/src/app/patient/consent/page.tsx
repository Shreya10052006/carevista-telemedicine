'use client';

/**
 * Patient Consent / Privacy Settings Page
 * ========================================
 * Fully multilingual using LanguageContext.
 */

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConsentItem {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
}

export default function PatientConsentPage() {
    const { t, language } = useLanguage();

    const getConsentItems = (): ConsentItem[] => [
        {
            id: 'symptoms',
            label: t('Share Symptom Logs'),
            description: language === 'ta'
                ? 'உங்கள் அறிகுறி வரலாற்றை உங்கள் மருத்துவர் பார்க்க அனுமதிக்கவும்'
                : language === 'hi'
                    ? 'अपने डॉक्टर को अपना लक्षण इतिहास देखने दें'
                    : 'Allow your doctor to see your symptom history',
            enabled: true,
        },
        {
            id: 'reports',
            label: t('Share Uploaded Reports'),
            description: language === 'ta'
                ? 'உங்கள் மருத்துவ அறிக்கைகளை உங்கள் மருத்துவர் பார்க்க அனுமதிக்கவும்'
                : language === 'hi'
                    ? 'अपने डॉक्टर को अपनी मेडिकल रिपोर्ट देखने दें'
                    : 'Allow your doctor to view your medical reports',
            enabled: true,
        },
        {
            id: 'recording',
            label: t('Voice Recording'),
            description: language === 'ta'
                ? 'அறிகுறி பதிவுக்கு குரல் பதிவுகளை அனுமதிக்கவும்'
                : language === 'hi'
                    ? 'लक्षण लॉगिंग के लिए वॉयस रिकॉर्डिंग की अनुमति दें'
                    : 'Allow voice recordings for symptom logging',
            enabled: false,
        },
        {
            id: 'ai_summary',
            label: t('AI-Assisted Summaries'),
            description: language === 'ta'
                ? 'உங்கள் மருத்துவருக்கு AI சுருக்கங்களை உருவாக்க அனுமதிக்கவும்'
                : language === 'hi'
                    ? 'अपने डॉक्टर के लिए AI को सारांश बनाने दें'
                    : 'Allow AI to create intake summaries for your doctor',
            enabled: true,
        },
    ];

    const [consents, setConsents] = useState<ConsentItem[]>(getConsentItems());

    const toggleConsent = (id: string) => {
        setConsents((prev) =>
            prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
        );
    };

    const handleSave = () => {
        const msg = language === 'ta' ? 'தனியுரிமை அமைப்புகள் சேமிக்கப்பட்டன.'
            : language === 'hi' ? 'गोपनीयता सेटिंग्स सहेजी गईं।'
                : 'Privacy settings saved.';
        alert(msg);
    };

    return (
        <div style={styles.page}>
            <TopBar role="patient" />

            <main style={styles.main}>
                <div style={styles.header}>
                    <Link href="/patient/dashboard" style={styles.backLink}>
                        {t('← Back to Dashboard')}
                    </Link>
                    <h1 style={styles.title}>{t('Privacy Settings')}</h1>
                    <p style={styles.subtitle}>
                        {language === 'ta' ? 'மருத்துவர்களுடன் நீங்கள் பகிர்வதைக் கட்டுப்படுத்துங்கள்'
                            : language === 'hi' ? 'डॉक्टरों के साथ आप जो साझा करते हैं उसे नियंत्रित करें'
                                : 'Control what you share with doctors'}
                    </p>
                </div>

                {/* Consent Banner */}
                <div style={styles.consentBanner}>
                    🔒 <strong>{t('You are in control')}</strong>{' '}
                    {language === 'ta' ? 'அந்த தரவை உடனடியாக பகிர்வதை நிறுத்த எந்த விருப்பத்தையும் முடக்கவும்.'
                        : language === 'hi' ? 'उस डेटा को तुरंत साझा करना बंद करने के लिए कोई भी विकल्प बंद करें।'
                            : 'Turn off any option to stop sharing that data immediately.'}
                </div>

                {/* Consent Toggles */}
                <div style={styles.consentList}>
                    {consents.map((consent) => (
                        <div key={consent.id} style={styles.consentItem}>
                            <div style={styles.consentInfo}>
                                <strong>{consent.label}</strong>
                                <p style={styles.consentDesc}>{consent.description}</p>
                            </div>
                            <label style={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={consent.enabled}
                                    onChange={() => toggleConsent(consent.id)}
                                    style={styles.checkbox}
                                />
                                <span style={{
                                    ...styles.toggleTrack,
                                    background: consent.enabled ? 'var(--color-success)' : 'var(--bg-tertiary)',
                                }}>
                                    <span style={{
                                        ...styles.toggleThumb,
                                        transform: consent.enabled ? 'translateX(24px)' : 'translateX(0)',
                                    }} />
                                </span>
                            </label>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <button onClick={handleSave} style={styles.saveButton}>
                    {t('Save Settings')}
                </button>

                {/* Notice */}
                <div style={styles.notice}>
                    <strong>{language === 'ta' ? 'குறிப்பு:' : language === 'hi' ? 'नोट:' : 'Note:'}</strong>{' '}
                    {language === 'ta'
                        ? 'சம்மதத்தை திரும்பப் பெறுவது எல்லா மருத்துவர்களுடனும் அந்த தரவைப் பகிர்வதை உடனடியாக நிறுத்தும். கடந்த ஆலோசனைகள் உங்கள் வரலாற்றில் இருக்கும்.'
                        : language === 'hi'
                            ? 'सहमति रद्द करने से सभी डॉक्टरों के साथ उस डेटा को तुरंत साझा करना बंद हो जाएगा। पिछले परामर्श आपके इतिहास में रहेंगे।'
                            : 'Revoking consent will immediately stop sharing that data with all doctors. Past consultations remain in your history.'}
                </div>
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: 'var(--bg-page)' },
    main: { maxWidth: '600px', margin: '0 auto', padding: 'var(--spacing-lg)' },
    header: { marginBottom: 'var(--spacing-xl)' },
    backLink: { color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', textDecoration: 'none' },
    title: { fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 'var(--spacing-sm) 0 0 0' },
    subtitle: { color: 'var(--text-secondary)', margin: 0 },
    consentBanner: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-success-50)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--spacing-lg)',
    },
    consentList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
    },
    consentItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
    },
    consentInfo: { flex: 1 },
    consentDesc: { margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' },
    toggle: { position: 'relative', cursor: 'pointer' },
    checkbox: { opacity: 0, position: 'absolute' },
    toggleTrack: {
        display: 'block',
        width: '48px',
        height: '24px',
        borderRadius: '12px',
        transition: 'background 0.2s',
    },
    toggleThumb: {
        display: 'block',
        width: '20px',
        height: '20px',
        background: 'white',
        borderRadius: '50%',
        margin: '2px',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    },
    saveButton: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    notice: {
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
    },
};
