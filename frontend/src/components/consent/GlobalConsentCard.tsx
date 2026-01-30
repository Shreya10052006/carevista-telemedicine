'use client';

/**
 * Global Consent Card
 * ===================
 * ONE consent decision per consultation.
 * 
 * CONSENT MODEL:
 * - Patient gives global consent when starting consultation
 * - Can choose: Share ALL entries OR selected date range
 * - Consent can be revoked anytime
 * - Revocation immediately stops data sharing
 * 
 * UI REQUIREMENTS:
 * - Plain language (non-technical)
 * - Multilingual (EN/TA/HI)
 * - Clear indication of what will be shared
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    grantGlobalConsent,
    getGlobalConsent,
    revokeGlobalConsent,
    GlobalConsent
} from '@/lib/demoSessionStore';

interface GlobalConsentCardProps {
    consultationId: string;
    entryCount: number;
    onConsentChange?: (granted: boolean) => void;
}

export function GlobalConsentCard({
    consultationId,
    entryCount,
    onConsentChange
}: GlobalConsentCardProps) {
    const { t } = useLanguage();
    const [consent, setConsent] = useState<GlobalConsent | null>(null);
    const [shareAll, setShareAll] = useState(true);
    const [includeReports, setIncludeReports] = useState(true);

    // Load existing consent
    useEffect(() => {
        const existing = getGlobalConsent();
        if (existing && existing.consultationId === consultationId) {
            setConsent(existing);
        }
    }, [consultationId]);

    const handleGrantConsent = () => {
        const newConsent = grantGlobalConsent(
            consultationId,
            shareAll ? 'all' : 'selected',
            undefined,
            includeReports
        );
        setConsent(newConsent);
        onConsentChange?.(true);
    };

    const handleRevokeConsent = () => {
        revokeGlobalConsent();
        setConsent(null);
        onConsentChange?.(false);
    };

    // If consent already granted, show status
    if (consent?.granted) {
        return (
            <div style={styles.consentedCard}>
                <div style={styles.consentedHeader}>
                    <span style={styles.checkIcon}>✓</span>
                    <div>
                        <strong style={styles.consentedTitle}>{t('Data Sharing Active')}</strong>
                        <p style={styles.consentedDesc}>
                            {consent.scope === 'all'
                                ? t('All health notes are shared with your doctor')
                                : t('Selected entries are shared with your doctor')}
                        </p>
                    </div>
                </div>

                <div style={styles.sharedInfo}>
                    <span>📋 {entryCount} {t('entries shared')}</span>
                    {consent.includeReports && <span>📄 {t('Reports included')}</span>}
                </div>

                <button onClick={handleRevokeConsent} style={styles.revokeBtn}>
                    🔒 {t('Stop Sharing')}
                </button>

                <p style={styles.revokeNote}>
                    {t('You can stop sharing anytime. Your data will remain in your logbook.')}
                </p>
            </div>
        );
    }

    // Consent request card
    return (
        <div style={styles.consentCard}>
            <div style={styles.consentHeader}>
                <span style={styles.consentIcon}>🔐</span>
                <h3 style={styles.consentTitle}>{t('Share Health Data')}</h3>
            </div>

            <p style={styles.consentDescription}>
                {t('This will share your health notes and reports with the doctor for this consultation only.')}
            </p>

            <div style={styles.whatShared}>
                <p style={styles.whatSharedTitle}>{t('What will be shared')}:</p>
                <ul style={styles.sharedList}>
                    <li>📋 {t('Your symptom entries')} ({entryCount})</li>
                    <li>💬 {t('Chatbot intake summaries')}</li>
                    {includeReports && <li>📄 {t('Uploaded reports')}</li>}
                </ul>
            </div>

            {/* Share Options */}
            <div style={styles.optionsSection}>
                <label style={styles.optionRow}>
                    <input
                        type="radio"
                        checked={shareAll}
                        onChange={() => setShareAll(true)}
                        style={styles.radio}
                    />
                    <span>{t('Share all entries')} <span style={styles.recommended}>({t('Recommended')})</span></span>
                </label>

                <label style={styles.optionRow}>
                    <input
                        type="checkbox"
                        checked={includeReports}
                        onChange={(e) => setIncludeReports(e.target.checked)}
                        style={styles.checkbox}
                    />
                    <span>{t('Include uploaded reports')}</span>
                </label>
            </div>

            {/* Grant Button */}
            <button onClick={handleGrantConsent} style={styles.grantBtn}>
                ✓ {t('I Agree to Share')}
            </button>

            {/* Privacy Note */}
            <p style={styles.privacyNote}>
                🔒 {t('You control your data. You can revoke access anytime.')}
            </p>
        </div>
    );
}

// ==================== STYLES ====================

const styles: { [key: string]: React.CSSProperties } = {
    consentCard: {
        padding: '24px',
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        borderRadius: '16px',
        border: '2px solid #e2e8f0',
        marginBottom: '20px',
    },
    consentHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    consentIcon: {
        fontSize: '32px',
    },
    consentTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 700,
        color: '#1e293b',
    },
    consentDescription: {
        color: '#475569',
        fontSize: '15px',
        lineHeight: 1.6,
        marginBottom: '20px',
    },
    whatShared: {
        padding: '16px',
        background: '#f0f9ff',
        borderRadius: '12px',
        marginBottom: '20px',
    },
    whatSharedTitle: {
        margin: '0 0 10px 0',
        fontWeight: 600,
        color: '#0369a1',
        fontSize: '14px',
    },
    sharedList: {
        margin: 0,
        paddingLeft: '20px',
        color: '#0369a1',
        fontSize: '14px',
        lineHeight: 1.8,
    },
    optionsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '20px',
    },
    optionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        color: '#475569',
    },
    radio: {
        width: '18px',
        height: '18px',
    },
    checkbox: {
        width: '18px',
        height: '18px',
    },
    recommended: {
        color: '#059669',
        fontSize: '13px',
    },
    grantBtn: {
        width: '100%',
        padding: '16px',
        background: 'linear-gradient(135deg, #059669, #10b981)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    privacyNote: {
        marginTop: '16px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '13px',
    },

    // Consented state
    consentedCard: {
        padding: '20px',
        background: '#f0fdf4',
        borderRadius: '16px',
        border: '2px solid #86efac',
        marginBottom: '20px',
    },
    consentedHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    checkIcon: {
        width: '36px',
        height: '36px',
        background: '#22c55e',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
    },
    consentedTitle: {
        display: 'block',
        fontSize: '16px',
        color: '#166534',
    },
    consentedDesc: {
        margin: '4px 0 0',
        fontSize: '14px',
        color: '#16a34a',
    },
    sharedInfo: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#166534',
    },
    revokeBtn: {
        width: '100%',
        padding: '12px',
        background: '#fef2f2',
        color: '#dc2626',
        border: '2px solid #fecaca',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    revokeNote: {
        marginTop: '12px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '12px',
    },
};

export default GlobalConsentCard;
