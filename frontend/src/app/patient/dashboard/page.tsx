'use client';

/**
 * Patient Dashboard - Hospital-Grade Premium Redesign
 * ====================================================
 * Medical-grade dashboard with clear action hierarchy.
 * Consent-first, calm, trustworthy design.
 * Voice-first with large, accessible touch targets.
 * 
 * Design Philosophy:
 * - Patient Portal = Control & Clarity
 * - No diagnostic language
 * - Intake + control only
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';
import { useLanguage } from '@/contexts/LanguageContext';
import { TopBar } from '@/components/common/TopBar';
import {
    DEMO_MODE,
    getDemoPatient,
    getDemoLogbook,
    getDemoConsultations,
    PatientProfile,
    LogbookEntry,
    Consultation
} from '@/lib/demoData';
import styles from './page.module.css';

export default function PatientDashboard() {
    const router = useRouter();
    const { user, loading: authLoading, logout, profile } = useAuth();
    const { isOnline, pendingCount, isSyncing, forceSync } = useOffline();
    const { t, language } = useLanguage();

    const [demoPatient, setDemoPatient] = useState<PatientProfile | null>(null);
    const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);

    // Load demo data
    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (demoUserId && DEMO_MODE) {
            const patient = getDemoPatient(demoUserId);
            if (patient) {
                setDemoPatient(patient);
                setLogbookEntries(getDemoLogbook(demoUserId));
                setConsultations(getDemoConsultations(demoUserId));
            }
        }
    }, []);

    // Redirect if not logged in (skip for demo)
    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (!authLoading && !user && !demoUserId) {
            router.push('/auth/patient');
        }
    }, [authLoading, user, router]);

    const handleLogout = async () => {
        localStorage.removeItem('demo_user_id');
        localStorage.removeItem('demo_mode');
        await logout();
        router.push('/');
    };

    // Greeting based on time and language
    const getGreeting = () => {
        const hour = new Date().getHours();
        const greetings = {
            en: { morning: 'Good Morning', afternoon: 'Good Afternoon', evening: 'Good Evening' },
            ta: { morning: 'காலை வணக்கம்', afternoon: 'நல்ல மதியம்', evening: 'மாலை வணக்கம்' },
            hi: { morning: 'सुप्रभात', afternoon: 'नमस्ते', evening: 'शुभ संध्या' },
        };
        const g = greetings[language] || greetings.en;
        if (hour < 12) return g.morning;
        if (hour < 17) return g.afternoon;
        return g.evening;
    };

    const patientName = demoPatient?.name || profile?.displayName || t('Patient');
    const hasUnreadMessages = consultations.some(c => c.status === 'completed');
    const recentLogbookCount = logbookEntries.filter(e => !e.sharedWithDoctor).length;

    if (authLoading && !demoPatient) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>{t('Loading')}</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <TopBar role="patient" />

            {/* Status Banner Stack */}
            <div className={styles.bannerStack}>
                {/* Demo Badge */}
                {DEMO_MODE && demoPatient && (
                    <div className={styles.demoBadge}>
                        <span className={styles.demoDot}></span>
                        {t('Demo Mode')} — {demoPatient.name}
                    </div>
                )}

                {/* Offline Banner */}
                {!isOnline && (
                    <div className={styles.offlineBanner}>
                        <span className={styles.offlineIcon}>📴</span>
                        {t('Offline')} — {t('Data saved locally')}
                    </div>
                )}

                {/* Syncing Banner */}
                {isSyncing && (
                    <div className={styles.syncingBanner}>
                        <span className={styles.syncSpinner}></span>
                        {t('Syncing')}...
                    </div>
                )}
            </div>

            <main className={styles.main}>
                {/* Welcome Section */}
                <section className={styles.welcomeSection}>
                    <p className={styles.greeting}>{getGreeting()}</p>
                    <h1 className={styles.patientName}>{patientName}</h1>
                    <p className={styles.welcomeSubtext}>{t('How can we help you today?')}</p>
                </section>

                {/* Alert Cards */}
                {hasUnreadMessages && (
                    <div className={styles.alertCard}>
                        <div className={styles.alertIconWrap}>
                            <span className={styles.alertIcon}>💬</span>
                        </div>
                        <div className={styles.alertContent}>
                            <strong>{t('Doctor Summary Available')}</strong>
                            <p>{t('View your recent consultation summary')}</p>
                        </div>
                        <Link href="/patient/records" className={styles.alertAction}>{t('View')}</Link>
                    </div>
                )}

                {recentLogbookCount > 0 && (
                    <div className={styles.alertCardInfo}>
                        <div className={styles.alertIconWrap}>
                            <span className={styles.alertIcon}>📋</span>
                        </div>
                        <div className={styles.alertContent}>
                            <strong>{recentLogbookCount} {t('entries not shared')}</strong>
                            <p>{t('Share with your doctor when ready')}</p>
                        </div>
                    </div>
                )}

                {/* Primary Action Zone */}
                <section className={styles.actionSection}>
                    <h2 className={styles.sectionTitle}>{t('Record Your Health')}</h2>

                    <div className={styles.primaryGrid}>
                        {/* Voice Intake - DARK FOCUSED CARD */}
                        <Link href="/patient/logbook/voice" className={styles.voiceCard}>
                            <div className={styles.voiceIconContainer}>
                                <span className={styles.voiceIcon}>🎤</span>
                                <div className={styles.voicePulse}></div>
                            </div>
                            <div className={styles.voiceContent}>
                                <h3>{t('Voice Intake')}</h3>
                                <p>{t('Speak your symptoms naturally')}</p>
                            </div>
                            <span className={styles.voiceBadge}>{t('Recommended')}</span>
                        </Link>

                        {/* Manual Log Entry */}
                        <Link href="/patient/logbook/new?type=manual" className={styles.actionCard}>
                            <div className={styles.cardIcon}>✍️</div>
                            <h3 className={styles.cardTitle}>{t('Log Symptoms')}</h3>
                            <p className={styles.cardDesc}>{t('Write how you feel')}</p>
                        </Link>

                        {/* Health Assistant */}
                        <Link href="/patient/chat" className={styles.actionCard}>
                            <div className={styles.cardIcon}>💬</div>
                            <h3 className={styles.cardTitle}>{t('Health Intake')}</h3>
                            <p className={styles.cardDesc}>{t('Guided questions')}</p>
                            <span className={styles.cardTag}>{t('5 questions')}</span>
                        </Link>
                    </div>
                </section>

                {/* Consult Doctor - PRIMARY CTA */}
                <section className={styles.consultSection}>
                    <Link href="/patient/consult" className={styles.consultCard}>
                        <div className={styles.consultLeft}>
                            <span className={styles.consultIcon}>🩺</span>
                            <div>
                                <h3>{t('Consult a Doctor')}</h3>
                                <p>{t('Audio or video consultation')}</p>
                            </div>
                        </div>
                        <div className={styles.consultTypes}>
                            <span className={styles.consultType}>📞 {t('Audio')}</span>
                            <span className={styles.consultType}>📹 {t('Video')}</span>
                        </div>
                    </Link>
                </section>

                {/* Secondary Actions */}
                <section className={styles.secondarySection}>
                    <h2 className={styles.sectionTitleSmall}>{t('Your Health Records')}</h2>

                    <div className={styles.secondaryGrid}>
                        {/* Symptom Logbook */}
                        <Link href="/patient/logbook" className={styles.secondaryCard}>
                            <span className={styles.secondaryIcon}>📋</span>
                            <div className={styles.secondaryContent}>
                                <h4>{t('Symptom Logbook')}</h4>
                                <span className={styles.secondaryMeta}>{logbookEntries.length} {t('entries')}</span>
                            </div>
                            <span className={styles.secondaryArrow}>→</span>
                        </Link>

                        {/* Appointments */}
                        <Link href="/patient/appointments" className={styles.secondaryCard}>
                            <span className={styles.secondaryIcon}>📅</span>
                            <div className={styles.secondaryContent}>
                                <h4>{t('Appointments')}</h4>
                                <span className={styles.secondaryMeta}>
                                    {consultations.length > 0 ? `${consultations.length} ${t('past')}` : t('None scheduled')}
                                </span>
                            </div>
                            <span className={styles.secondaryArrow}>→</span>
                        </Link>

                        {/* Medical Records */}
                        <Link href="/patient/records" className={styles.secondaryCard}>
                            <span className={styles.secondaryIcon}>📁</span>
                            <div className={styles.secondaryContent}>
                                <h4>{t('Medical Records')}</h4>
                                <span className={styles.secondaryMeta}>{t('Reports & prescriptions')}</span>
                            </div>
                            <span className={styles.secondaryArrow}>→</span>
                        </Link>

                        {/* Upload Reports */}
                        <Link href="/patient/upload" className={styles.secondaryCard}>
                            <span className={styles.secondaryIcon}>📎</span>
                            <div className={styles.secondaryContent}>
                                <h4>{t('Upload Reports')}</h4>
                                <span className={styles.secondaryMeta}>{t('Lab results, scans')}</span>
                            </div>
                            <span className={styles.secondaryArrow}>→</span>
                        </Link>
                    </div>
                </section>

                {/* Privacy & Consent Notice */}
                <div className={styles.privacyNotice}>
                    <span className={styles.privacyIcon}>🔒</span>
                    <span>{t('Your health data is private. You control what is shared with doctors.')}</span>
                </div>

                {/* Pending Sync */}
                {pendingCount > 0 && (
                    <section className={styles.syncSection}>
                        <div className={styles.syncCard}>
                            <div className={styles.syncInfo}>
                                <span className={styles.syncIcon}>⏳</span>
                                <div>
                                    <strong>{pendingCount} {t('items')}</strong> {t('waiting to sync')}
                                </div>
                            </div>
                            {isOnline && !isSyncing && (
                                <button className={styles.syncButton} onClick={forceSync}>
                                    {t('Sync Now')}
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Quick Links */}
                <section className={styles.quickLinks}>
                    <Link href="/patient/profile" className={styles.quickLink}>
                        👤 {t('My Profile')}
                    </Link>
                    <Link href="/patient/consent" className={styles.quickLink}>
                        ⚙️ {t('Privacy Settings')}
                    </Link>
                </section>

                {/* Emergency Notice - Subtle Footer */}
                <div className={styles.emergencyNotice}>
                    <span className={styles.emergencyIcon}>ℹ️</span>
                    <span>{t('For emergencies, please visit your nearest hospital or call emergency services.')}</span>
                </div>

                {/* Logout */}
                <div className={styles.logoutSection}>
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        {t('Logout')}
                    </button>
                </div>
            </main>
        </div>
    );
}
