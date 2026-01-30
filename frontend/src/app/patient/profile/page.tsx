'use client';

/**
 * Patient Profile Page
 * ====================
 * Complete patient profile with edit functionality.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
    DEMO_MODE,
    getDemoPatient,
    PatientProfile as PatientProfileType
} from '@/lib/demoData';

export default function ProfilePage() {
    const { t, language, setLanguage } = useLanguage();
    const [demoPatient, setDemoPatient] = useState<PatientProfileType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: 'male' as 'male' | 'female' | 'other',
        location: '',
        emergencyContact: '',
        preferredLanguage: 'en' as Language,
    });

    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (demoUserId && DEMO_MODE) {
            const patient = getDemoPatient(demoUserId);
            if (patient) {
                setDemoPatient(patient);
                setFormData({
                    name: patient.name,
                    phone: patient.phone,
                    age: String(patient.age),
                    gender: patient.gender,
                    location: patient.location,
                    emergencyContact: patient.emergencyContact || '',
                    preferredLanguage: patient.preferredLanguage,
                });
            }
        }
    }, []);

    const handleSave = () => {
        // In demo mode, just update local state
        if (demoPatient) {
            setDemoPatient({
                ...demoPatient,
                name: formData.name,
                age: parseInt(formData.age) || demoPatient.age,
                location: formData.location,
                emergencyContact: formData.emergencyContact,
                preferredLanguage: formData.preferredLanguage,
            });
        }
        setLanguage(formData.preferredLanguage);
        setIsEditing(false);
    };

    const genderLabels = {
        male: { en: 'Male', ta: 'ஆண்', hi: 'पुरुष' },
        female: { en: 'Female', ta: 'பெண்', hi: 'महिला' },
        other: { en: 'Other', ta: 'மற்றவை', hi: 'अन्य' },
    };

    return (
        <div style={styles.page}>
            <TopBar role="patient" />

            {DEMO_MODE && (
                <div style={styles.demoBadge}>
                    🎭 {t('Demo Data')}
                </div>
            )}

            <main style={styles.main}>
                <div style={styles.header}>
                    <Link href="/patient/dashboard" style={styles.backLink}>
                        ← {t('Dashboard')}
                    </Link>
                    <h1 style={styles.title}>👤 {t('My Profile')}</h1>
                </div>

                <div style={styles.profileCard}>
                    {/* Avatar */}
                    <div style={styles.avatarSection}>
                        <div style={styles.avatar}>
                            {formData.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={styles.profileName}>{formData.name}</h2>
                        <p style={styles.profilePhone}>📱 +91 {formData.phone}</p>
                    </div>

                    {/* Profile Details */}
                    {!isEditing ? (
                        <div style={styles.detailsSection}>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>{t('Age')}</span>
                                <span style={styles.detailValue}>{formData.age} {t('years')}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>{t('Gender')}</span>
                                <span style={styles.detailValue}>
                                    {genderLabels[formData.gender][language]}
                                </span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>{t('Location')}</span>
                                <span style={styles.detailValue}>{formData.location}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>{t('Preferred Language')}</span>
                                <span style={styles.detailValue}>
                                    {formData.preferredLanguage === 'ta' ? 'தமிழ்' :
                                        formData.preferredLanguage === 'hi' ? 'हिंदी' : 'English'}
                                </span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>{t('Emergency Contact')}</span>
                                <span style={styles.detailValue}>
                                    {formData.emergencyContact || t('Not set')}
                                </span>
                            </div>

                            <button
                                style={styles.editButton}
                                onClick={() => setIsEditing(true)}
                            >
                                ✏️ {t('Edit Profile')}
                            </button>
                        </div>
                    ) : (
                        <div style={styles.editForm}>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{t('Name')}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={styles.formInput}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{t('Age')}</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    style={styles.formInput}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{t('Gender')}</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                    style={styles.formSelect}
                                >
                                    <option value="male">{genderLabels.male[language]}</option>
                                    <option value="female">{genderLabels.female[language]}</option>
                                    <option value="other">{genderLabels.other[language]}</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{t('Location')}</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    style={styles.formInput}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{t('Preferred Language')}</label>
                                <select
                                    value={formData.preferredLanguage}
                                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as Language })}
                                    style={styles.formSelect}
                                >
                                    <option value="en">English</option>
                                    <option value="ta">தமிழ் (Tamil)</option>
                                    <option value="hi">हिंदी (Hindi)</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{t('Emergency Contact')}</label>
                                <input
                                    type="tel"
                                    value={formData.emergencyContact}
                                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                    style={styles.formInput}
                                    placeholder={t('10-digit phone number')}
                                />
                            </div>

                            <div style={styles.formActions}>
                                <button
                                    style={styles.cancelButton}
                                    onClick={() => setIsEditing(false)}
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    style={styles.saveButton}
                                    onClick={handleSave}
                                >
                                    {t('Save Changes')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Privacy Notice */}
                <div style={styles.privacyNotice}>
                    🔒 {t('Your profile is only visible to you and doctors you consult')}
                </div>
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: '#f8fafc' },
    demoBadge: {
        padding: '8px 16px',
        background: '#fef3c7',
        textAlign: 'center',
        fontSize: '13px',
        color: '#92400e',
    },
    main: { maxWidth: '500px', margin: '0 auto', padding: '24px 16px' },
    header: { marginBottom: '24px' },
    backLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '8px 0 0 0' },
    profileCard: {
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    avatarSection: {
        padding: '32px 24px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #0d9488 100%)',
        textAlign: 'center',
    },
    avatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'white',
        color: '#3b82f6',
        fontSize: '36px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    profileName: { color: 'white', fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' },
    profilePhone: { color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '15px' },
    detailsSection: { padding: '24px' },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: '1px solid #f1f5f9',
    },
    detailLabel: { color: '#64748b', fontSize: '14px' },
    detailValue: { color: '#0f172a', fontSize: '14px', fontWeight: 500 },
    editButton: {
        width: '100%',
        padding: '14px',
        marginTop: '16px',
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#334155',
        cursor: 'pointer',
    },
    editForm: { padding: '24px' },
    formGroup: { marginBottom: '16px' },
    formLabel: { display: 'block', fontSize: '14px', color: '#64748b', marginBottom: '6px' },
    formInput: {
        width: '100%',
        padding: '14px',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    formSelect: {
        width: '100%',
        padding: '14px',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '16px',
        background: 'white',
    },
    formActions: { display: 'flex', gap: '12px', marginTop: '20px' },
    cancelButton: {
        flex: 1,
        padding: '14px',
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#64748b',
        cursor: 'pointer',
    },
    saveButton: {
        flex: 1,
        padding: '14px',
        background: '#3b82f6',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        color: 'white',
        cursor: 'pointer',
    },
    privacyNotice: {
        marginTop: '20px',
        padding: '14px',
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#16a34a',
        fontSize: '14px',
    },
};
