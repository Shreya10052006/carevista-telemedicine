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

            {/* GoFundMe Section */}
            <section className={styles.gofundmeSection}>
                <div className={styles.gofundmeContent}>
                    {/* Left - Illustration */}
                    <div className={styles.gofundmeLeft}>
                        <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.gofundmeIllustration}>
                            {/* Background circle */}
                            <circle cx="200" cy="160" r="140" fill="#e0f2fe" opacity="0.5" />
                            <circle cx="200" cy="160" r="100" fill="#bae6fd" opacity="0.3" />
                            {/* Doctor figure */}
                            <circle cx="160" cy="110" r="22" fill="#0d9488" />
                            <path d="M140 140 Q160 180 160 200 L160 250" stroke="#0d9488" strokeWidth="4" fill="none" />
                            <path d="M130 165 L160 155 L190 165" stroke="#0d9488" strokeWidth="4" fill="none" />
                            <rect x="148" y="95" width="24" height="4" rx="2" fill="white" />
                            <line x1="160" y1="93" x2="160" y2="101" stroke="white" strokeWidth="3" />
                            {/* Patient figure */}
                            <circle cx="250" cy="125" r="18" fill="#7dd3fc" />
                            <path d="M235 150 Q250 185 250 200 L250 240" stroke="#7dd3fc" strokeWidth="4" fill="none" />
                            <path d="M225 170 L250 162 L275 170" stroke="#7dd3fc" strokeWidth="4" fill="none" />
                            {/* Heart */}
                            <path d="M200 75 C195 65, 180 65, 180 78 C180 90, 200 102, 200 102 C200 102, 220 90, 220 78 C220 65, 205 65, 200 75Z" fill="#f472b6" opacity="0.8" />
                            {/* Connecting hand */}
                            <path d="M185 165 Q205 150 225 162" stroke="#14b8a6" strokeWidth="3" strokeDasharray="4 3" fill="none" />
                            {/* Coins */}
                            <circle cx="300" cy="200" r="14" fill="#fbbf24" opacity="0.8" />
                            <text x="296" y="205" fontSize="12" fill="#92400e" fontWeight="bold">₹</text>
                            <circle cx="110" cy="210" r="11" fill="#fbbf24" opacity="0.6" />
                            <text x="107" y="215" fontSize="10" fill="#92400e" fontWeight="bold">₹</text>
                            {/* Small sparkles */}
                            <circle cx="280" cy="100" r="3" fill="#5eead4" />
                            <circle cx="130" cy="90" r="2.5" fill="#5eead4" />
                            <circle cx="310" cy="150" r="2" fill="#a78bfa" />
                        </svg>
                    </div>

                    {/* Right - Content */}
                    <div className={styles.gofundmeRight}>
                        <div className={styles.gofundmeBadge}>
                            <span>💙</span>
                            <span>Community Support</span>
                        </div>
                        <h2 className={styles.gofundmeTitle}>
                            Go Fund Me – <span className={styles.gofundmeTitleAccent}>Support Rural Patients</span>
                        </h2>
                        <p className={styles.gofundmeDesc}>
                            Help patients in need by contributing anonymously. Small amounts can save lives.
                            Your donation goes directly to verified patients in rural communities who need medical care the most.
                        </p>
                        <div className={styles.gofundmeButtons}>
                            <Link href="/gofundme" className={styles.donateNowBtn}>
                                💰 Donate Now
                            </Link>
                            <Link href="/request-funds" className={styles.requestFundsBtn}>
                                📝 Request Funds
                            </Link>
                        </div>
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
