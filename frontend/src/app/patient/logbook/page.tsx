'use client';

/**
 * Symptom Logbook - Hospital-Grade Timeline View
 * ==============================================
 * Chronological medical diary with visual timeline.
 * Severity indicators, consent status, and expandable details.
 * Privacy-first design with lock icons.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    DEMO_MODE,
    getDemoPatient,
    LogbookEntry,
    PatientProfile
} from '@/lib/demoData';
import { getAllLogbookEntries } from '@/lib/demoSessionStore';
import styles from './page.module.css';

type FilterType = 'all' | 'manual' | 'voice' | 'chatbot';

// Group entries by date
interface DateGroup {
    date: string;
    dateLabel: string;
    entries: LogbookEntry[];
}

export default function LogbookPage() {
    const { t, language } = useLanguage();
    const [demoPatient, setDemoPatient] = useState<PatientProfile | null>(null);
    const [entries, setEntries] = useState<LogbookEntry[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (demoUserId && DEMO_MODE) {
            const patient = getDemoPatient(demoUserId);
            if (patient) {
                setDemoPatient(patient);
                setEntries(getAllLogbookEntries(demoUserId));
            }
        }
    }, []);

    const filteredEntries = entries
        .filter(e => filter === 'all' || e.type === filter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Group by date
    const groupedByDate = filteredEntries.reduce<DateGroup[]>((groups, entry) => {
        const date = new Date(entry.createdAt).toDateString();
        const existingGroup = groups.find(g => g.date === date);

        if (existingGroup) {
            existingGroup.entries.push(entry);
        } else {
            groups.push({
                date,
                dateLabel: formatDateLabel(entry.createdAt),
                entries: [entry]
            });
        }
        return groups;
    }, []);

    function formatDateLabel(dateStr: string) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return t('Today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            return t('Yesterday');
        }

        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        };
        return date.toLocaleDateString(
            language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
            options
        );
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString(
            language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
        );
    };

    const getTypeBadge = (type: LogbookEntry['type']) => {
        const badges = {
            manual: { icon: '✍️', label: t('Manual'), color: 'blue' },
            voice: { icon: '🎤', label: t('Voice'), color: 'purple' },
            chatbot: { icon: '💬', label: t('Guided'), color: 'teal' },
        };
        return badges[type];
    };

    const getSeverityClass = (severity: string | undefined) => {
        if (!severity) return null;
        const lower = severity.toLowerCase();
        if (lower.includes('mild') || lower.includes('light')) return styles.severityMild;
        if (lower.includes('moderate') || lower.includes('medium')) return styles.severityModerate;
        if (lower.includes('severe') || lower.includes('high')) return styles.severitySevere;
        return styles.severityPending;
    };

    return (
        <div className={styles.page}>
            <TopBar role="patient" />

            {/* Demo Badge */}
            {DEMO_MODE && demoPatient && (
                <div className={styles.demoBadge}>
                    <span className={styles.demoDot}></span>
                    {t('Demo Data')}
                </div>
            )}

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/patient/dashboard" className={styles.backLink}>
                        ← {t('Dashboard')}
                    </Link>
                    <h1 className={styles.title}>📋 {t('Symptom Logbook')}</h1>
                    <p className={styles.subtitle}>{t('Your medical diary')}</p>
                </div>

                {/* Add Entry Buttons */}
                <div className={styles.addActions}>
                    <Link href="/patient/logbook/voice" className={styles.addButtonVoice}>
                        <span className={styles.addIcon}>🎤</span>
                        <span>{t('Voice')}</span>
                    </Link>
                    <Link href="/patient/logbook/new?type=manual" className={styles.addButton}>
                        <span className={styles.addIcon}>✍️</span>
                        <span>{t('Write')}</span>
                    </Link>
                    <Link href="/patient/chat" className={styles.addButton}>
                        <span className={styles.addIcon}>💬</span>
                        <span>{t('Guided')}</span>
                    </Link>
                </div>

                {/* Filters */}
                <div className={styles.filterRow}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        {t('All')} ({entries.length})
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'manual' ? styles.active : ''}`}
                        onClick={() => setFilter('manual')}
                    >
                        ✍️
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'voice' ? styles.active : ''}`}
                        onClick={() => setFilter('voice')}
                    >
                        🎤
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'chatbot' ? styles.active : ''}`}
                        onClick={() => setFilter('chatbot')}
                    >
                        💬
                    </button>
                </div>

                {/* Timeline */}
                <div className={styles.timeline}>
                    {groupedByDate.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📝</span>
                            <h3>{t('No entries yet')}</h3>
                            <p>{t('Start by recording your first symptom')}</p>
                        </div>
                    ) : (
                        groupedByDate.map((group) => (
                            <div key={group.date} className={styles.dateGroup}>
                                {/* Date Header */}
                                <div className={styles.dateHeader}>
                                    <span className={styles.dateLine}></span>
                                    <span className={styles.dateLabel}>{group.dateLabel}</span>
                                    <span className={styles.dateLine}></span>
                                </div>

                                {/* Entries for this date */}
                                <div className={styles.entriesGroup}>
                                    {group.entries.map((entry) => {
                                        const badge = getTypeBadge(entry.type);
                                        const isExpanded = expandedId === entry.id;
                                        const severityClass = getSeverityClass(entry.structuredSummary?.severity);

                                        return (
                                            <div key={entry.id} className={styles.entryCard}>
                                                {/* Timeline Connector */}
                                                <div className={styles.timelineConnector}>
                                                    <span className={styles.timelineDot}></span>
                                                    <span className={styles.timelineLine}></span>
                                                </div>

                                                {/* Entry Content */}
                                                <div className={styles.entryContent}>
                                                    {/* Entry Header */}
                                                    <div
                                                        className={styles.entryHeader}
                                                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                                    >
                                                        <div className={styles.entryMeta}>
                                                            <span className={styles.entryTime}>
                                                                {formatTime(entry.createdAt)}
                                                            </span>
                                                            <span className={`${styles.typeBadge} ${styles[badge.color]}`}>
                                                                {badge.icon} {badge.label}
                                                            </span>
                                                        </div>
                                                        <span className={styles.expandIcon}>
                                                            {isExpanded ? '−' : '+'}
                                                        </span>
                                                    </div>

                                                    {/* Summary */}
                                                    <div className={styles.entrySummary}>
                                                        <p className={styles.chiefComplaint}>
                                                            {entry.structuredSummary?.chiefComplaint || entry.originalText.slice(0, 100)}
                                                        </p>

                                                        {/* Tags Row */}
                                                        <div className={styles.tagsRow}>
                                                            {severityClass && (
                                                                <span className={`${styles.severityPill} ${severityClass}`}>
                                                                    {entry.structuredSummary?.severity}
                                                                </span>
                                                            )}

                                                            {entry.sharedWithDoctor ? (
                                                                <span className={styles.statusShared}>
                                                                    ✓ {t('Shared')}
                                                                </span>
                                                            ) : (
                                                                <span className={styles.statusNotShared}>
                                                                    🔒 {t('Private')}
                                                                </span>
                                                            )}

                                                            {entry.doctorReviewed && (
                                                                <span className={styles.statusReviewed}>
                                                                    👨‍⚕️ {t('Reviewed')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {isExpanded && (
                                                        <div className={styles.entryDetails}>
                                                            {/* Full Text - Hidden by Default */}
                                                            <div className={styles.detailSection}>
                                                                <button
                                                                    className={styles.showTranscriptBtn}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const el = e.currentTarget.nextElementSibling;
                                                                        if (el) el.classList.toggle(styles.visible);
                                                                    }}
                                                                >
                                                                    📄 {t('Show full text')}
                                                                </button>
                                                                <div className={styles.transcriptHidden}>
                                                                    <p className={styles.originalText}>
                                                                        {entry.originalText}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {entry.structuredSummary?.duration && (
                                                                <div className={styles.detailRow}>
                                                                    <span className={styles.detailLabel}>⏱️ {t('Duration')}:</span>
                                                                    <span>{entry.structuredSummary.duration}</span>
                                                                </div>
                                                            )}

                                                            {entry.structuredSummary?.additionalNotes && (
                                                                <div className={styles.detailRow}>
                                                                    <span className={styles.detailLabel}>📝 {t('Notes')}:</span>
                                                                    <span>{entry.structuredSummary.additionalNotes}</span>
                                                                </div>
                                                            )}

                                                            {entry.audioRef && (
                                                                <div className={styles.audioIndicator}>
                                                                    🔊 {t('Voice recording available')}
                                                                </div>
                                                            )}

                                                            {/* Consent Control */}
                                                            <div className={styles.consentControl}>
                                                                <span className={styles.consentLabel}>
                                                                    {entry.sharedWithDoctor
                                                                        ? `🔓 ${t('This entry is shared with your doctor')}`
                                                                        : `🔒 ${t('This entry is private')}`
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Privacy Notice */}
                <div className={styles.privacyNotice}>
                    <span className={styles.privacyIcon}>🔒</span>
                    <span>{t('Your entries are private. You control what is shared with doctors.')}</span>
                </div>
            </main>
        </div>
    );
}
