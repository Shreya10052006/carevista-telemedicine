'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/common/Logo';
import styles from './page.module.css';

/**
 * CareVista Landing Page
 * ======================
 * Premium medical telemedicine landing page.
 * Features: Online status, multilingual, role-based navigation.
 */

export default function HomePage() {
    const [isOnline, setIsOnline] = useState(true);
    const { t, language, setLanguage } = useLanguage();

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <main className={styles.main}>
            {/* Grid Background Pattern */}
            <div className={styles.gridBackground}></div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    {/* Logo */}
                    <div className={styles.logo}>
                        <Logo size="medium" theme="primary" />
                    </div>

                    {/* Right side: Status & Language */}
                    <div className={styles.headerRight}>
                        {/* Online Status */}
                        <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
                            <span className={styles.statusDot}></span>
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>

                        {/* Language Selector */}
                        <select
                            className={styles.langSelect}
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'en' | 'ta' | 'hi')}
                        >
                            <option value="en">English</option>
                            <option value="ta">தமிழ்</option>
                            <option value="hi">हिंदी</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    {/* Left Side */}
                    <div className={styles.heroLeft}>
                        {/* Trust Badge */}
                        <div className={styles.trustBadge}>
                            <span className={styles.badgeIcon}>🔒</span>
                            <span>{t('Secure & Confidential')}</span>
                        </div>

                        {/* Headline */}
                        <h1 className={styles.headline}>
                            {t('Healthcare')}{' '}
                            <span className={styles.headlineAccent}>{t('accessible')}</span>
                            <br />
                            <span className={styles.headlineHighlight}>{t('anytime,')}</span>
                            <br />
                            <span className={styles.headlineHighlight}>{t('anywhere.')}</span>
                        </h1>

                        {/* Subheadline */}
                        <p className={styles.subheadline}>
                            {t('Connect with certified doctors instantly. Record symptoms in your language, share securely, and get care when you need it.')}
                        </p>

                        {/* CTA Button */}
                        <Link href="#portals" className={styles.ctaButton}>
                            {t('Get Started')} →
                        </Link>
                    </div>

                    {/* Right Side - Floating Card */}
                    <div className={styles.heroRight}>
                        <div className={styles.floatingCard}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardIcon}>📞</span>
                                <span className={styles.cardTitle}>{t('Telemedicine')}</span>
                            </div>
                            <div className={styles.doctorCard}>
                                <div className={styles.doctorAvatar}>👨‍⚕️</div>
                                <div className={styles.doctorInfo}>
                                    <strong>Dr. Priya Sharma</strong>
                                    <span>{t('General Physician')} • {t('Available Now')}</span>
                                </div>
                                <button className={styles.callButton}>{t('Call')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Portal Cards Section */}
            <section className={styles.portals} id="portals">
                <div className={styles.portalGrid}>
                    {/* Patient Portal */}
                    <div className={styles.portalCard}>
                        <div className={`${styles.portalIcon} ${styles.patientIcon}`}>
                            <span>👤</span>
                        </div>
                        <h3 className={styles.portalTitle}>{t('Patient Portal')}</h3>
                        <p className={styles.portalDesc}>
                            {t('Log symptoms, schedule consultations, and access your health records securely.')}
                        </p>
                        <ul className={styles.featureList}>
                            <li>{t('Voice symptom logging')}</li>
                            <li>{t('Consent management')}</li>
                            <li>{t('Doctor consultations')}</li>
                        </ul>
                        <Link href="/auth/patient" className={styles.portalButton}>
                            {t('Enter Portal')} →
                        </Link>
                    </div>

                    {/* Doctor Portal */}
                    <div className={styles.portalCard}>
                        <div className={`${styles.portalIcon} ${styles.doctorIcon}`}>
                            <span>🩺</span>
                        </div>
                        <h3 className={styles.portalTitle}>{t('Doctor Portal')}</h3>
                        <p className={styles.portalDesc}>
                            {t('Review patient cases, conduct consultations, and manage prescriptions.')}
                        </p>
                        <ul className={styles.featureList}>
                            <li>{t('Patient queue')}</li>
                            <li>{t('Consultation tools')}</li>
                            <li>{t('Prescription writing')}</li>
                        </ul>
                        <Link href="/auth/doctor" className={styles.portalButton}>
                            {t('Enter Portal')} →
                        </Link>
                    </div>

                    {/* Health Worker Portal */}
                    <div className={styles.portalCard}>
                        <div className={`${styles.portalIcon} ${styles.workerIcon}`}>
                            <span>💝</span>
                        </div>
                        <h3 className={styles.portalTitle}>{t('Health Worker Portal')}</h3>
                        <p className={styles.portalDesc}>
                            {t('Assist patients with symptom logging and technology — with their permission.')}
                        </p>
                        <ul className={styles.featureList}>
                            <li>{t('Assisted access')}</li>
                            <li>{t('Time-limited sessions')}</li>
                            <li>{t('Upload support')}</li>
                        </ul>
                        <Link href="/auth/health-worker" className={styles.portalButtonAlt}>
                            {t('Enter Portal')} →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Consent Section */}
            <section className={styles.consentSection}>
                <div className={styles.consentContent}>
                    <div className={styles.shieldIcon}>
                        <span>🛡️</span>
                    </div>
                    <h2 className={styles.consentTitle}>{t('Your Consent, Your Control')}</h2>
                    <div className={styles.consentGrid}>
                        <div className={styles.consentItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>{t('You choose what data to share')}</span>
                        </div>
                        <div className={styles.consentItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>{t('Revoke access anytime')}</span>
                        </div>
                        <div className={styles.consentItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>{t('Transparent data usage')}</span>
                        </div>
                        <div className={styles.consentItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>{t('Doctor is the only clinical authority')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerLogo}>
                        <Logo size="small" theme="white" />
                    </div>
                    <div className={styles.footerLinks}>
                        <span>{t('About')}</span>
                        <span>{t('Privacy Policy')}</span>
                        <span>{t('Terms of Service')}</span>
                        <span>{t('Contact')}</span>
                    </div>
                    <p className={styles.footerNote}>
                        {t('This platform facilitates consultations. All clinical decisions are made by licensed doctors.')}
                    </p>
                </div>
            </footer>
        </main>
    );
}
