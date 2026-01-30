'use client';

/**
 * TopBar Component
 * ================
 * Global navigation bar visible on all pages.
 * Shows network status, sync indicator, and language selector.
 * Uses global LanguageContext for translations.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage, Language, LANGUAGE_NAMES } from '@/contexts/LanguageContext';
import { Logo } from '@/components/common/Logo';
import styles from './TopBar.module.css';

interface TopBarProps {
    role?: 'patient' | 'doctor' | 'health_worker';
    showLanguage?: boolean;
}

export function TopBar({ role, showLanguage = true }: TopBarProps) {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);

    useEffect(() => {
        // Check online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for sync events
        const handleSync = (e: CustomEvent) => {
            setIsSyncing(e.detail?.syncing ?? false);
        };
        window.addEventListener('sync-status' as any, handleSync);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sync-status' as any, handleSync);
        };
    }, []);

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setShowLangMenu(false);
    };

    const languages: { code: Language; name: string }[] = [
        { code: 'en', name: 'English' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'hi', name: 'हिंदी (Hindi)' },
    ];

    const getRoleBadge = () => {
        switch (role) {
            case 'doctor':
                return <span className={`${styles.roleBadge} ${styles.roleDoctor}`}>{t('Doctor')}</span>;
            case 'health_worker':
                return <span className={`${styles.roleBadge} ${styles.roleHealthWorker}`}>{t('Health Worker')}</span>;
            case 'patient':
                return <span className={`${styles.roleBadge} ${styles.rolePatient}`}>{t('Patient')}</span>;
            default:
                return null;
        }
    };

    return (
        <header className={styles.topBar}>
            {/* Logo */}
            <div className={styles.left}>
                <button
                    className={styles.logo}
                    onClick={() => router.push('/')}
                    aria-label="Go to home"
                >
                    <Logo size="small" theme="primary" showText={true} />
                </button>
                {getRoleBadge()}
            </div>

            {/* Status Indicators */}
            <div className={styles.right}>
                {/* Network Status */}
                <div className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
                    <span className={styles.statusDot}></span>
                    <span className={styles.statusText}>
                        {isOnline ? t('Online') : t('Offline')}
                    </span>
                </div>

                {/* Sync Indicator */}
                {isSyncing && (
                    <div className={styles.syncIndicator}>
                        <span className={styles.syncIcon}>🔄</span>
                        <span>{t('Syncing')}</span>
                    </div>
                )}

                {/* Language Selector */}
                {showLanguage && (
                    <div className={styles.languageWrapper}>
                        <button
                            className={styles.languageButton}
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            aria-expanded={showLangMenu}
                            aria-label="Select language"
                        >
                            🌐 {LANGUAGE_NAMES[language]}
                        </button>

                        {showLangMenu && (
                            <div className={styles.languageMenu}>
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`${styles.languageOption} ${language === lang.code ? styles.active : ''}`}
                                        onClick={() => handleLanguageChange(lang.code)}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
