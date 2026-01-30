'use client';

/**
 * Consult a Doctor - Hospital-Grade Booking Flow
 * ===============================================
 * Premium step-by-step consultation booking with:
 * - Visual step indicator
 * - Clear consent workflow
 * - Calm waiting UI
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { QueueStatus } from '@/components/patient/QueueStatus';
import { GlobalConsentCard } from '@/components/consent/GlobalConsentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    DEMO_MODE,
    getDemoPatient,
    getAvailableDoctors,
    PatientProfile,
    LogbookEntry,
    DemoDoctor
} from '@/lib/demoData';
import { getAllLogbookEntries, grantGlobalConsent, bookAppointment } from '@/lib/demoSessionStore';
import styles from './page.module.css';

type Step = 'select-type' | 'select-doctor' | 'consent' | 'confirm' | 'queued';

const STEPS: { key: Step; label: string }[] = [
    { key: 'select-type', label: 'Type' },
    { key: 'select-doctor', label: 'Doctor' },
    { key: 'consent', label: 'Consent' },
    { key: 'confirm', label: 'Confirm' },
];

export default function ConsultPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [step, setStep] = useState<Step>('select-type');
    const [demoPatient, setDemoPatient] = useState<PatientProfile | null>(null);
    const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
    const [doctors, setDoctors] = useState<DemoDoctor[]>([]);
    const [consultationId, setConsultationId] = useState<string | null>(null);

    // Selection state
    const [consultType, setConsultType] = useState<'audio' | 'video'>('video');
    const [selectedDoctor, setSelectedDoctor] = useState<DemoDoctor | null>(null);
    const [shareLogbook, setShareLogbook] = useState(true);
    const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (demoUserId && DEMO_MODE) {
            const patient = getDemoPatient(demoUserId);
            if (patient) {
                setDemoPatient(patient);
                const entries = getAllLogbookEntries(demoUserId);
                setLogbookEntries(entries);
                setSelectedEntries(entries.map((e: LogbookEntry) => e.id));
            }
        }
        setDoctors(getAvailableDoctors());
    }, []);

    const handleConfirmBooking = () => {
        // Save appointment to session storage
        if (demoPatient && selectedDoctor) {
            const appointment = bookAppointment(
                demoPatient.id,
                selectedDoctor.id,
                selectedDoctor.name,
                selectedDoctor.specialty,
                consultType,
                shareLogbook ? selectedEntries : undefined
            );
            setConsultationId(appointment.id);
        } else {
            const id = `consult-${Date.now()}`;
            setConsultationId(id);
        }
        setStep('queued');
    };

    const currentStepIndex = STEPS.findIndex(s => s.key === step);

    return (
        <div className={styles.page}>
            <TopBar role="patient" />

            {/* Demo Badge */}
            {DEMO_MODE && (
                <div className={styles.demoBadge}>
                    <span className={styles.demoDot}></span>
                    {t('Demo Mode')}
                </div>
            )}

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/patient/dashboard" className={styles.backLink}>
                        ← {t('Dashboard')}
                    </Link>
                    <h1 className={styles.title}>🩺 {t('Consult a Doctor')}</h1>
                    <p className={styles.subtitle}>{t('Book a secure consultation')}</p>
                </div>

                {/* Step Indicator */}
                {step !== 'queued' && (
                    <div className={styles.stepIndicator}>
                        {STEPS.map((s, index) => (
                            <div key={s.key} className={styles.stepItem}>
                                <div className={`${styles.stepCircle} ${index <= currentStepIndex ? styles.stepActive : ''} ${index < currentStepIndex ? styles.stepComplete : ''}`}>
                                    {index < currentStepIndex ? '✓' : index + 1}
                                </div>
                                <span className={`${styles.stepLabel} ${index <= currentStepIndex ? styles.stepLabelActive : ''}`}>
                                    {t(s.label)}
                                </span>
                                {index < STEPS.length - 1 && <div className={`${styles.stepLine} ${index < currentStepIndex ? styles.stepLineActive : ''}`}></div>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 1: Select Type */}
                {step === 'select-type' && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>{t('Choose consultation type')}</h2>

                        <div className={styles.typeOptions}>
                            <button
                                className={`${styles.typeCard} ${consultType === 'video' ? styles.typeCardSelected : ''}`}
                                onClick={() => setConsultType('video')}
                            >
                                <span className={styles.typeIcon}>📹</span>
                                <strong>{t('Video Call')}</strong>
                                <p>{t('See and talk to doctor')}</p>
                                {consultType === 'video' && <span className={styles.selectedBadge}>✓</span>}
                            </button>
                            <button
                                className={`${styles.typeCard} ${consultType === 'audio' ? styles.typeCardSelected : ''}`}
                                onClick={() => setConsultType('audio')}
                            >
                                <span className={styles.typeIcon}>📞</span>
                                <strong>{t('Audio Call')}</strong>
                                <p>{t('Voice call only')}</p>
                                {consultType === 'audio' && <span className={styles.selectedBadge}>✓</span>}
                            </button>
                        </div>

                        <button
                            className={styles.nextButton}
                            onClick={() => setStep('select-doctor')}
                        >
                            {t('Continue')} →
                        </button>
                    </div>
                )}

                {/* Step 2: Select Doctor */}
                {step === 'select-doctor' && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>{t('Select a doctor')}</h2>

                        <div className={styles.doctorList}>
                            {doctors.map(doc => (
                                <button
                                    key={doc.id}
                                    className={`${styles.doctorCard} ${selectedDoctor?.id === doc.id ? styles.doctorCardSelected : ''}`}
                                    onClick={() => setSelectedDoctor(doc)}
                                >
                                    <div className={styles.doctorAvatar}>👨‍⚕️</div>
                                    <div className={styles.doctorInfo}>
                                        <strong>{doc.name}</strong>
                                        <p>{doc.specialty}</p>
                                        <span className={styles.availableBadge}>✓ {t('Available')}</span>
                                    </div>
                                    {selectedDoctor?.id === doc.id && (
                                        <span className={styles.doctorCheck}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className={styles.stepActions}>
                            <button className={styles.backButton} onClick={() => setStep('select-type')}>
                                ← {t('Back')}
                            </button>
                            <button
                                className={`${styles.nextButton} ${!selectedDoctor ? styles.disabled : ''}`}
                                onClick={() => selectedDoctor && setStep('consent')}
                                disabled={!selectedDoctor}
                            >
                                {t('Continue')} →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Consent */}
                {step === 'consent' && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>🔒 {t('Share Health Data')}</h2>
                        <p className={styles.stepSubtitle}>{t('You control what your doctor sees')}</p>

                        {/* Consent Card */}
                        <div className={styles.consentCard}>
                            <GlobalConsentCard
                                consultationId={`temp-${Date.now()}`}
                                entryCount={logbookEntries.length}
                                onConsentChange={(granted) => {
                                    setShareLogbook(granted);
                                    if (granted) {
                                        setSelectedEntries(logbookEntries.map((e: LogbookEntry) => e.id));
                                    } else {
                                        setSelectedEntries([]);
                                    }
                                }}
                            />
                        </div>

                        <div className={styles.privacyNote}>
                            <span className={styles.privacyIcon}>🔒</span>
                            <span>{t('Your data is encrypted and only visible to your doctor')}</span>
                        </div>

                        <div className={styles.stepActions}>
                            <button className={styles.backButton} onClick={() => setStep('select-doctor')}>
                                ← {t('Back')}
                            </button>
                            <button
                                className={styles.nextButton}
                                onClick={() => setStep('confirm')}
                            >
                                {t('Continue')} →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirm */}
                {step === 'confirm' && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>✓ {t('Confirm Booking')}</h2>
                        <p className={styles.stepSubtitle}>{t('Review your consultation details')}</p>

                        <div className={styles.summaryCard}>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>{t('Type')}</span>
                                <span className={styles.summaryValue}>
                                    {consultType === 'video' ? '📹 Video Call' : '📞 Audio Call'}
                                </span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>{t('Doctor')}</span>
                                <span className={styles.summaryValue}>{selectedDoctor?.name}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>{t('Specialty')}</span>
                                <span className={styles.summaryValue}>{selectedDoctor?.specialty}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>{t('Sharing')}</span>
                                <span className={`${styles.summaryValue} ${shareLogbook ? styles.shareYes : styles.shareNo}`}>
                                    {shareLogbook ? `${selectedEntries.length} entries` : 'No data shared'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.stepActions}>
                            <button className={styles.backButton} onClick={() => setStep('consent')}>
                                ← {t('Back')}
                            </button>
                            <button
                                className={styles.confirmButton}
                                onClick={handleConfirmBooking}
                            >
                                ✓ {t('Book Consultation')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Queue Status (Calm Waiting UI) */}
                {step === 'queued' && (
                    <div className={styles.queuedContent}>
                        <div className={styles.successIcon}>✅</div>
                        <h2 className={styles.queuedTitle}>{t('Booking Confirmed')}</h2>
                        <p className={styles.queuedSubtitle}>
                            {t('Your consultation with')} <strong>{selectedDoctor?.name}</strong>
                        </p>

                        <div className={styles.bookedSummary}>
                            <div className={styles.bookedRow}>
                                <span className={styles.bookedIcon}>
                                    {consultType === 'video' ? '📹' : '📞'}
                                </span>
                                <span>
                                    {consultType === 'video' ? 'Video Call' : 'Audio Call'}
                                </span>
                            </div>
                            <div className={styles.bookedRow}>
                                <span className={styles.bookedIcon}>📋</span>
                                <span>
                                    {shareLogbook ? `${selectedEntries.length} entries shared` : 'No data shared'}
                                </span>
                            </div>
                        </div>

                        {/* Queue Status Component */}
                        <div className={styles.queueStatus}>
                            <QueueStatus consultationId={consultationId || undefined} />
                        </div>

                        {/* Wait Message */}
                        <div className={styles.waitMessage}>
                            <span className={styles.waitIcon}>⏳</span>
                            <p>{t('Please stay available. The doctor will connect with you soon.')}</p>
                        </div>

                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className={styles.returnButton}
                        >
                            ← {t('Back to Dashboard')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
