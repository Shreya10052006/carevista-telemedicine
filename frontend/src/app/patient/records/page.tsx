'use client';

/**
 * Medical Records Page - Enhanced with Reports & Read Aloud
 * =========================================================
 * View logbook, consultations, prescriptions, and scanned reports.
 * Includes accessibility features like read aloud for summaries.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { speak, stop, isSpeaking } from '@/lib/tts';
import {
    DEMO_MODE,
    getDemoPatient,
    getDemoLogbook,
    getDemoConsultations,
    getDemoScannedReports,
    PatientProfile,
    LogbookEntry,
    Consultation,
    ScannedReport
} from '@/lib/demoData';
import { getAllAppointments } from '@/lib/demoSessionStore';
import styles from './page.module.css';

type Tab = 'logbook' | 'consultations' | 'prescriptions' | 'reports';

export default function RecordsPage() {
    const { t, language } = useLanguage();
    const [tab, setTab] = useState<Tab>('consultations');
    const [demoPatient, setDemoPatient] = useState<PatientProfile | null>(null);
    const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [scannedReports, setScannedReports] = useState<ScannedReport[]>([]);
    const [readingId, setReadingId] = useState<string | null>(null);
    const [expandedConsult, setExpandedConsult] = useState<string | null>(null);
    const [expandedReport, setExpandedReport] = useState<string | null>(null);

    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (demoUserId && DEMO_MODE) {
            const patient = getDemoPatient(demoUserId);
            if (patient) {
                setDemoPatient(patient);
                setLogbookEntries(getDemoLogbook(demoUserId));
                // Use getAllAppointments to include booked consultations
                setConsultations(getAllAppointments(demoUserId));
                setScannedReports(getDemoScannedReports(demoUserId));
            }
        }
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(
            language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
            { day: 'numeric', month: 'short', year: 'numeric' }
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'voice': return '🎤';
            case 'chatbot': return '💬';
            default: return '✍️';
        }
    };

    const getReportIcon = (type: string) => {
        switch (type) {
            case 'blood_test': return '🩸';
            case 'xray': return '🩻';
            case 'scan': return '📡';
            case 'prescription': return '💊';
            default: return '📄';
        }
    };

    // Read aloud functionality for accessibility
    const handleReadAloud = useCallback((id: string, text: string) => {
        if (readingId === id) {
            stop();
            setReadingId(null);
            return;
        }

        // Stop any current reading
        stop();
        setReadingId(id);

        speak(text, language, {
            rate: 0.8, // Slower for better comprehension
            onEnd: () => setReadingId(null),
            onError: () => setReadingId(null),
        });
    }, [readingId, language]);

    const completedConsults = consultations.filter(c => c.status === 'completed');
    const prescriptionConsults = consultations.filter(c => c.prescription && c.prescription.length > 0);

    return (
        <div className={styles.page}>
            <TopBar role="patient" />

            {/* Demo Badge */}
            {DEMO_MODE && (
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
                    <h1 className={styles.title}>📁 {t('Medical Records')}</h1>
                    <p className={styles.subtitle}>{t('Your complete health history')}</p>
                </div>

                {/* Summary Card */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryRow}>
                        <button
                            className={`${styles.summaryItem} ${tab === 'consultations' ? styles.summaryItemActive : ''}`}
                            onClick={() => setTab('consultations')}
                        >
                            <span className={styles.summaryIcon}>👨‍⚕️</span>
                            <span className={styles.summaryValue}>{completedConsults.length}</span>
                            <span className={styles.summaryLabel}>{t('Consultations')}</span>
                        </button>
                        <div className={styles.summaryDivider}></div>
                        <button
                            className={`${styles.summaryItem} ${tab === 'prescriptions' ? styles.summaryItemActive : ''}`}
                            onClick={() => setTab('prescriptions')}
                        >
                            <span className={styles.summaryIcon}>💊</span>
                            <span className={styles.summaryValue}>{prescriptionConsults.length}</span>
                            <span className={styles.summaryLabel}>{t('Prescriptions')}</span>
                        </button>
                        <div className={styles.summaryDivider}></div>
                        <button
                            className={`${styles.summaryItem} ${tab === 'reports' ? styles.summaryItemActive : ''}`}
                            onClick={() => setTab('reports')}
                        >
                            <span className={styles.summaryIcon}>🩸</span>
                            <span className={styles.summaryValue}>{scannedReports.length}</span>
                            <span className={styles.summaryLabel}>{t('Reports')}</span>
                        </button>
                        <div className={styles.summaryDivider}></div>
                        <button
                            className={`${styles.summaryItem} ${tab === 'logbook' ? styles.summaryItemActive : ''}`}
                            onClick={() => setTab('logbook')}
                        >
                            <span className={styles.summaryIcon}>📋</span>
                            <span className={styles.summaryValue}>{logbookEntries.length}</span>
                            <span className={styles.summaryLabel}>{t('Logbook')}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'consultations' ? styles.tabActive : ''}`}
                        onClick={() => setTab('consultations')}
                    >
                        👨‍⚕️ {t('Doctor Summaries')}
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'prescriptions' ? styles.tabActive : ''}`}
                        onClick={() => setTab('prescriptions')}
                    >
                        💊 {t('Prescriptions')}
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'reports' ? styles.tabActive : ''}`}
                        onClick={() => setTab('reports')}
                    >
                        🩸 {t('Lab Reports')}
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'logbook' ? styles.tabActive : ''}`}
                        onClick={() => setTab('logbook')}
                    >
                        📋 {t('Logbook')}
                    </button>
                </div>

                {/* Consultations / Doctor Summaries Tab */}
                {tab === 'consultations' && (
                    <div className={styles.tabContent}>
                        <div className={styles.accessibilityNotice}>
                            🔊 {t('Tap "Read Aloud" to hear the doctor summary')}
                        </div>

                        {completedConsults.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>👨‍⚕️</span>
                                <p>{t('No consultations yet')}</p>
                                <Link href="/patient/consult" className={styles.emptyAction}>
                                    {t('Consult a Doctor')} →
                                </Link>
                            </div>
                        ) : (
                            completedConsults.map(consult => (
                                <div key={consult.id} className={styles.consultCard}>
                                    <div className={styles.consultHeader}>
                                        <div className={styles.doctorInfo}>
                                            <span className={styles.doctorAvatar}>👨‍⚕️</span>
                                            <div>
                                                <strong className={styles.doctorName}>{consult.doctorName}</strong>
                                                <p className={styles.specialty}>{consult.doctorSpecialty}</p>
                                            </div>
                                        </div>
                                        <div className={styles.consultMeta}>
                                            <span className={styles.statusBadge}>✓ {t('Completed')}</span>
                                            <span className={styles.consultDateBadge}>{formatDate(consult.date)}</span>
                                        </div>
                                    </div>

                                    {consult.doctorSummary && (
                                        <div className={styles.summarySection}>
                                            <div className={styles.summarySectionHeader}>
                                                <label>{t('Doctor Summary')}</label>
                                                <button
                                                    className={`${styles.readAloudBtn} ${readingId === consult.id ? styles.readAloudBtnActive : ''}`}
                                                    onClick={() => handleReadAloud(
                                                        consult.id,
                                                        `Doctor summary from ${consult.doctorName}: ${consult.doctorSummary}`
                                                    )}
                                                >
                                                    {readingId === consult.id ? '🔊 Stop' : '🔊 Read Aloud'}
                                                </button>
                                            </div>
                                            <p className={styles.summaryText}>{consult.doctorSummary}</p>
                                        </div>
                                    )}

                                    {consult.prescription && consult.prescription.length > 0 && (
                                        <div className={styles.prescriptionPreview}>
                                            <span className={styles.prescriptionIcon}>💊</span>
                                            <span>{consult.prescription.length} {t('medications prescribed')}</span>
                                            <button
                                                className={styles.viewPrescriptionBtn}
                                                onClick={() => setTab('prescriptions')}
                                            >
                                                {t('View')} →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Prescriptions Tab */}
                {tab === 'prescriptions' && (
                    <div className={styles.tabContent}>
                        {prescriptionConsults.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>💊</span>
                                <p>{t('No prescriptions yet')}</p>
                            </div>
                        ) : (
                            prescriptionConsults.map(consult => (
                                <div key={consult.id} className={styles.prescriptionCard}>
                                    <div className={styles.prescriptionHeader}>
                                        <div className={styles.prescriptionTitle}>
                                            <span className={styles.prescriptionIconLarge}>💊</span>
                                            <div>
                                                <strong>{t('Prescription')}</strong>
                                                <p className={styles.prescribedBy}>{t('By')} {consult.doctorName}</p>
                                            </div>
                                        </div>
                                        <span className={styles.prescriptionDate}>{formatDate(consult.date)}</span>
                                    </div>

                                    <div className={styles.medicineList}>
                                        {consult.prescription?.map((med, idx) => (
                                            <div key={idx} className={styles.medicineItem}>
                                                <div className={styles.medicineHeader}>
                                                    <strong className={styles.medicineName}>{med.medicine}</strong>
                                                </div>
                                                <div className={styles.medicineDetails}>
                                                    <span>📏 {med.dosage}</span>
                                                    <span>🔄 {med.frequency}</span>
                                                    <span>📅 {med.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Read aloud for prescription */}
                                    <button
                                        className={`${styles.readAloudBtnFull} ${readingId === `rx-${consult.id}` ? styles.readAloudBtnActive : ''}`}
                                        onClick={() => handleReadAloud(
                                            `rx-${consult.id}`,
                                            `Prescription from ${consult.doctorName}. ${consult.prescription?.map(m =>
                                                `${m.medicine}, take ${m.dosage}, ${m.frequency}, for ${m.duration}`
                                            ).join('. ')}`
                                        )}
                                    >
                                        {readingId === `rx-${consult.id}` ? '🔊 Stop Reading' : '🔊 Read Prescription Aloud'}
                                    </button>

                                    <div className={styles.demoNotice}>
                                        ⚠️ {t('Demo prescription - not for actual use')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Lab Reports Tab */}
                {tab === 'reports' && (
                    <div className={styles.tabContent}>
                        {scannedReports.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>🩸</span>
                                <p>{t('No lab reports yet')}</p>
                            </div>
                        ) : (
                            scannedReports.map(report => (
                                <div key={report.id} className={styles.reportCard}>
                                    <div
                                        className={styles.reportHeader}
                                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                                    >
                                        <div className={styles.reportInfo}>
                                            <span className={styles.reportIcon}>{getReportIcon(report.reportType)}</span>
                                            <div>
                                                <strong className={styles.reportName}>{report.reportName}</strong>
                                                {report.labName && <p className={styles.labName}>{report.labName}</p>}
                                            </div>
                                        </div>
                                        <div className={styles.reportMeta}>
                                            <span className={styles.reportDate}>{formatDate(report.uploadedAt)}</span>
                                            <span className={styles.expandIcon}>
                                                {expandedReport === report.id ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {expandedReport === report.id && (
                                        <div className={styles.reportDetails}>
                                            {report.findings && (
                                                <div className={styles.findingsSection}>
                                                    <label>{t('Findings')}</label>
                                                    <p>{report.findings}</p>
                                                    <button
                                                        className={`${styles.readAloudBtn} ${readingId === report.id ? styles.readAloudBtnActive : ''}`}
                                                        onClick={() => handleReadAloud(
                                                            report.id,
                                                            `Report: ${report.reportName}. Findings: ${report.findings}`
                                                        )}
                                                    >
                                                        {readingId === report.id ? '🔊 Stop' : '🔊 Read Aloud'}
                                                    </button>
                                                </div>
                                            )}

                                            {report.values && report.values.length > 0 && (
                                                <div className={styles.valuesTable}>
                                                    <div className={styles.valuesHeader}>
                                                        <span>{t('Test')}</span>
                                                        <span>{t('Result')}</span>
                                                        <span>{t('Status')}</span>
                                                    </div>
                                                    {report.values.map((val, idx) => (
                                                        <div key={idx} className={styles.valuesRow}>
                                                            <span className={styles.valueName}>{val.name}</span>
                                                            <span className={styles.valueResult}>{val.value} {val.unit}</span>
                                                            <span className={`${styles.valueStatus} ${styles[`status${val.status?.charAt(0).toUpperCase()}${val.status?.slice(1)}`]}`}>
                                                                {val.status === 'normal' ? '✓ Normal' :
                                                                    val.status === 'high' ? '↑ High' :
                                                                        val.status === 'low' ? '↓ Low' : '-'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Logbook Tab */}
                {tab === 'logbook' && (
                    <div className={styles.tabContent}>
                        {logbookEntries.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📋</span>
                                <p>{t('No logbook entries yet')}</p>
                                <Link href="/patient/logbook" className={styles.emptyAction}>
                                    {t('Log Symptoms')} →
                                </Link>
                            </div>
                        ) : (
                            logbookEntries.map(entry => (
                                <div key={entry.id} className={styles.recordCard}>
                                    <div className={styles.recordHeader}>
                                        <div className={styles.recordMeta}>
                                            <span className={styles.recordTypeIcon}>{getTypeIcon(entry.type)}</span>
                                            <span className={styles.recordDate}>{formatDate(entry.createdAt)}</span>
                                        </div>
                                        <span className={`${styles.recordTypeBadge} ${styles[`type${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`]}`}>
                                            {entry.type}
                                        </span>
                                    </div>
                                    <p className={styles.recordSummary}>{entry.structuredSummary.chiefComplaint}</p>
                                    <div className={styles.recordFooter}>
                                        {entry.sharedWithDoctor ? (
                                            <span className={styles.sharedBadge}>✓ {t('Shared with doctor')}</span>
                                        ) : (
                                            <span className={styles.privateBadge}>🔒 {t('Not shared')}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Privacy Notice */}
                <div className={styles.privacyNotice}>
                    <span className={styles.privacyIcon}>🔒</span>
                    <span>{t('Your records are private. You control who sees them.')}</span>
                </div>
            </main>
        </div>
    );
}
