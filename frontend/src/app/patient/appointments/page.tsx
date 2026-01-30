'use client';

/**
 * Appointments Page
 * =================
 * View upcoming and past consultations.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    DEMO_MODE,
    getDemoPatient,
    PatientProfile,
    Consultation
} from '@/lib/demoData';
import { getAllAppointments } from '@/lib/demoSessionStore';

export default function AppointmentsPage() {
    const { t, language } = useLanguage();
    const [demoPatient, setDemoPatient] = useState<PatientProfile | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);

    useEffect(() => {
        const demoUserId = localStorage.getItem('demo_user_id');
        if (demoUserId && DEMO_MODE) {
            const patient = getDemoPatient(demoUserId);
            if (patient) {
                setDemoPatient(patient);
                // Use getAllAppointments to include booked consultations
                setConsultations(getAllAppointments(demoUserId));
            }
        }
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(
            language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
            { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
        );
    };

    const pastConsultations = consultations.filter(c => c.status === 'completed');
    const upcomingConsultations = consultations.filter(c => c.status === 'scheduled');

    return (
        <div style={styles.page}>
            <TopBar role="patient" />

            {DEMO_MODE && (
                <div style={styles.demoBadge}>🎭 {t('Demo Data')}</div>
            )}

            <main style={styles.main}>
                <div style={styles.header}>
                    <Link href="/patient/dashboard" style={styles.backLink}>
                        ← {t('Dashboard')}
                    </Link>
                    <h1 style={styles.title}>📅 {t('Appointments')}</h1>
                </div>

                {/* Book New */}
                <Link href="/patient/consult" style={styles.bookButton}>
                    + {t('Book New Consultation')}
                </Link>

                {/* Upcoming Section */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>{t('Upcoming')}</h2>
                    {upcomingConsultations.length === 0 ? (
                        <div style={styles.emptyCard}>
                            <p>📅 {t('No upcoming appointments')}</p>
                        </div>
                    ) : (
                        upcomingConsultations.map(consult => (
                            <div key={consult.id} style={styles.appointmentCard}>
                                <div style={styles.appointmentIcon}>
                                    {consult.type === 'video' ? '📹' : '📞'}
                                </div>
                                <div style={styles.appointmentInfo}>
                                    <strong>{consult.doctorName}</strong>
                                    <p>{consult.doctorSpecialty}</p>
                                    <span style={styles.appointmentDate}>{formatDate(consult.date)}</span>
                                </div>
                                <span style={styles.upcomingBadge}>{t('Upcoming')}</span>
                            </div>
                        ))
                    )}
                </section>

                {/* Past Section */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>{t('Past Consultations')}</h2>
                    {pastConsultations.length === 0 ? (
                        <div style={styles.emptyCard}>
                            <p>📋 {t('No past consultations')}</p>
                        </div>
                    ) : (
                        pastConsultations.map(consult => (
                            <div key={consult.id} style={styles.appointmentCard}>
                                <div style={styles.appointmentIcon}>
                                    {consult.type === 'video' ? '📹' : '📞'}
                                </div>
                                <div style={styles.appointmentInfo}>
                                    <strong>{consult.doctorName}</strong>
                                    <p>{consult.doctorSpecialty}</p>
                                    <span style={styles.appointmentDate}>{formatDate(consult.date)}</span>
                                </div>
                                <span style={styles.completedBadge}>✓ {t('Completed')}</span>
                            </div>
                        ))
                    )}
                </section>

                {/* Info */}
                <div style={styles.infoNotice}>
                    ℹ️ {t('Consultations are with verified doctors only')}
                </div>
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: '#f8fafc' },
    demoBadge: { padding: '8px', background: '#fef3c7', textAlign: 'center', fontSize: '13px', color: '#92400e' },
    main: { maxWidth: '500px', margin: '0 auto', padding: '24px 16px' },
    header: { marginBottom: '24px' },
    backLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px' },
    title: { fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '8px 0 0 0' },
    bookButton: { display: 'block', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #0d9488)', color: 'white', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '16px', marginBottom: '24px' },
    section: { marginBottom: '24px' },
    sectionTitle: { fontSize: '16px', fontWeight: 600, color: '#64748b', marginBottom: '12px' },
    emptyCard: { padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' },
    appointmentCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '12px' },
    appointmentIcon: { fontSize: '32px' },
    appointmentInfo: { flex: 1 },
    appointmentDate: { fontSize: '13px', color: '#64748b' },
    upcomingBadge: { padding: '6px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '12px', fontWeight: 600 },
    completedBadge: { padding: '6px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '8px', fontSize: '12px', fontWeight: 600 },
    infoNotice: { padding: '14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', textAlign: 'center', color: '#0369a1', fontSize: '14px' },
};
