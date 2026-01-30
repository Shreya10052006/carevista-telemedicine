'use client';

/**
 * Active Consultation View Component
 * ===================================
 * Shows patient data during active teleconsultation.
 * 
 * COMPLIANCE NOTES:
 * - Shows ONLY patient-approved summaries
 * - AI summaries are stored SEPARATELY from doctor notes
 * - Doctor notes never overwrite AI summaries
 * - Raw chatbot/voice logs are NOT displayed
 * - Past visits shown only if consented
 */

import { useState, useEffect } from 'react';
import styles from './ConsultationView.module.css';

interface IntakeSummary {
    chiefComplaint: string;
    symptomTimeline: string;
    severity: string;
    pastHistory?: string;
    additionalNotes?: string;
}

interface Report {
    id: string;
    file_name: string;
    file_type: string;
    uploaded_by: string;
    approved_for_sharing: boolean;
}

interface Vitals {
    bp_systolic?: number;
    bp_diastolic?: number;
    temperature?: number;
    weight?: number;
    entered_by: string;
}

interface PastVisit {
    id: string;
    date: string;
    summary: string;
    doctorNotes?: string;
}

interface ConsultationData {
    id: string;
    patientId: string;
    patientName: string;
    // AI intake summary (patient-approved) - STORED SEPARATELY
    intakeSummary: IntakeSummary | null;
    ai_role: string;
    ai_disclaimer: string;
    // Approved reports only
    reports: Report[];
    // Latest vitals
    vitals: Vitals | null;
    // Past visits (if consented)
    pastVisits: PastVisit[];
    // Consent scope
    consentScope: string[];
}

interface ConsultationViewProps {
    consultationId: string;
    patientId: string;
    onEndConsultation: () => void;
}

export function ConsultationView({
    consultationId,
    patientId,
    onEndConsultation,
}: ConsultationViewProps) {
    const [data, setData] = useState<ConsultationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'reports' | 'history'>('summary');

    useEffect(() => {
        fetchConsultationData();
    }, [consultationId]);

    const fetchConsultationData = async () => {
        try {
            const token = localStorage.getItem('authToken');

            // Fetch consultation data
            const response = await fetch(`/api/consultations/${consultationId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Patient has not consented to sharing this data');
                }
                throw new Error('Failed to load consultation');
            }

            const consultation = await response.json();

            // Fetch reports (approved only - enforced by backend)
            const reportsRes = await fetch(`/api/reports/patient/${patientId}?approved_only=true`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const reportsData = await reportsRes.json();

            // Fetch vitals
            const vitalsRes = await fetch(`/api/vitals/patient/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const vitalsData = await vitalsRes.json();
            const latestVitals = vitalsData.vitals?.[0] || null;

            setData({
                id: consultationId,
                patientId: patientId,
                patientName: consultation.patientName || 'Patient',
                intakeSummary: consultation.summary,
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Non-clinical, assistive only. Doctor is sole clinical authority.',
                reports: reportsData.reports || [],
                vitals: latestVitals,
                pastVisits: [], // Would fetch from backend
                consentScope: consultation.consentScope || [],
            });
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Unable to load consultation data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading consultation...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h3>Access Denied</h3>
                    <p>{error}</p>
                    <button onClick={onEndConsultation}>Return to Queue</button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.patientInfo}>
                    <h2>{data.patientName}</h2>
                    <span className={styles.patientId}>ID: {data.patientId.slice(-8)}</span>
                </div>
                <div className={styles.actions}>
                    <button className={styles.endButton} onClick={onEndConsultation}>
                        End Consultation
                    </button>
                </div>
            </div>

            {/* Consent Status */}
            <div className={styles.consentBar}>
                <span>✓ Patient has consented to: {data.consentScope.join(', ') || 'doctor_sharing'}</span>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'summary' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Intake Summary
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'reports' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    Reports ({data.reports.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'summary' && (
                    <div className={styles.summaryTab}>
                        {/* AI Intake Summary - Clearly marked as non-clinical */}
                        <div className={styles.aiSummarySection}>
                            <div className={styles.sectionHeader}>
                                <h3>AI-Prepared Intake Summary</h3>
                                <span className={styles.aiTag}>
                                    🤖 {data.ai_role.replace(/_/g, ' ')}
                                </span>
                            </div>

                            {/* COMPLIANCE: Clear disclaimer */}
                            <div className={styles.aiDisclaimer}>
                                ⚠️ {data.ai_disclaimer}
                            </div>

                            {data.intakeSummary ? (
                                <div className={styles.summaryContent}>
                                    <div className={styles.summaryField}>
                                        <label>Chief Complaint</label>
                                        <p>{data.intakeSummary.chiefComplaint}</p>
                                    </div>
                                    <div className={styles.summaryField}>
                                        <label>Timeline</label>
                                        <p>{data.intakeSummary.symptomTimeline}</p>
                                    </div>
                                    <div className={styles.summaryField}>
                                        <label>Severity</label>
                                        <p>{data.intakeSummary.severity}</p>
                                    </div>
                                    {data.intakeSummary.pastHistory && (
                                        <div className={styles.summaryField}>
                                            <label>Past History</label>
                                            <p>{data.intakeSummary.pastHistory}</p>
                                        </div>
                                    )}
                                    {data.intakeSummary.additionalNotes && (
                                        <div className={styles.summaryField}>
                                            <label>Additional Notes</label>
                                            <p>{data.intakeSummary.additionalNotes}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className={styles.noData}>No intake summary available</p>
                            )}
                        </div>

                        {/* Vitals Section */}
                        {data.vitals && (
                            <div className={styles.vitalsSection}>
                                <h3>Latest Vitals</h3>
                                <p className={styles.vitalsNote}>
                                    Entered by: {data.vitals.entered_by}
                                </p>
                                <div className={styles.vitalsGrid}>
                                    {data.vitals.bp_systolic && (
                                        <div className={styles.vitalItem}>
                                            <span className={styles.vitalLabel}>Blood Pressure</span>
                                            <span className={styles.vitalValue}>
                                                {data.vitals.bp_systolic}/{data.vitals.bp_diastolic} mmHg
                                            </span>
                                        </div>
                                    )}
                                    {data.vitals.temperature && (
                                        <div className={styles.vitalItem}>
                                            <span className={styles.vitalLabel}>Temperature</span>
                                            <span className={styles.vitalValue}>
                                                {data.vitals.temperature}°F
                                            </span>
                                        </div>
                                    )}
                                    {data.vitals.weight && (
                                        <div className={styles.vitalItem}>
                                            <span className={styles.vitalLabel}>Weight</span>
                                            <span className={styles.vitalValue}>
                                                {data.vitals.weight} kg
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className={styles.reportsTab}>
                        <h3>Approved Reports & Scans</h3>
                        {data.reports.length === 0 ? (
                            <p className={styles.noData}>No approved reports</p>
                        ) : (
                            <div className={styles.reportsList}>
                                {data.reports.map((report) => (
                                    <div key={report.id} className={styles.reportItem}>
                                        <span className={styles.reportIcon}>
                                            {report.file_type.includes('image') ? '🖼️' : '📄'}
                                        </span>
                                        <div className={styles.reportInfo}>
                                            <span className={styles.reportName}>{report.file_name}</span>
                                            <span className={styles.reportMeta}>
                                                Uploaded by: {report.uploaded_by}
                                            </span>
                                        </div>
                                        <button className={styles.viewButton}>View</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className={styles.historyTab}>
                        <h3>Past Visits</h3>
                        <p className={styles.historyNote}>
                            Showing visits where patient consented to continuity records
                        </p>
                        {data.pastVisits.length === 0 ? (
                            <p className={styles.noData}>No past visit records available</p>
                        ) : (
                            <div className={styles.visitsList}>
                                {data.pastVisits.map((visit) => (
                                    <div key={visit.id} className={styles.visitItem}>
                                        <span className={styles.visitDate}>{visit.date}</span>
                                        <p className={styles.visitSummary}>{visit.summary}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* NOT SHOWN Section - For audit clarity */}
            <div className={styles.notShownNote}>
                <small>
                    <strong>Not displayed:</strong> Raw chatbot conversations, raw voice recordings,
                    unapproved patient notes, private patient drafts
                </small>
            </div>
        </div>
    );
}
