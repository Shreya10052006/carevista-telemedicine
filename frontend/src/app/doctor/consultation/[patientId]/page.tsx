'use client';

/**
 * Doctor Consultation Screen - Product Grade
 * ===========================================
 * Premium clinical consultation interface with two-column layout:
 * 
 * LEFT COLUMN (Clinical Context):
 * - Patient Snapshot Card
 * - AI Intake Summary (Assistive, Non-Clinical)
 * - Symptom Logbook Timeline
 * 
 * RIGHT COLUMN (Consultation Interaction):
 * - Live Call Area
 * - Clinical Notes Editor
 * - Prescription Module
 * - Case Actions
 * 
 * COMPLIANCE:
 * - Doctor is sole clinical authority
 * - AI is non-diagnostic, assistive only
 * - No AI treatment suggestions
 * - Consent-first, revocable at any time
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    DEMO_MODE,
    getDemoDoctor,
    getDemoPatient,
    getDemoLogbook,
    Prescription,
    PatientProfile,
    LogbookEntry,
    DemoDoctor,
    getDemoQueue,
    QueuedPatient,
    ConsentState,
    IntakeSummary,
} from '@/lib/demoData';
import { getGlobalConsent, addDemoPrescription, getDemoPrescriptions } from '@/lib/demoSessionStore';
import styles from './page.module.css';

export default function DoctorConsultationPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;

    const [demoDoctor, setDemoDoctor] = useState<DemoDoctor | null>(null);
    const [patient, setPatient] = useState<PatientProfile | null>(null);
    const [queuedPatient, setQueuedPatient] = useState<QueuedPatient | null>(null);
    const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
    // CRITICAL: Tri-state consent with explicit 'loading' state
    // Protected data MUST NOT render during 'loading'
    const [consentState, setConsentState] = useState<'loading' | ConsentState>('loading');
    const [consentResolved, setConsentResolved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Call state
    const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    // Prescription form
    const [showPrescription, setShowPrescription] = useState(false);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [newRx, setNewRx] = useState<Prescription>({
        medicine: '',
        dosage: '',
        frequency: '',
        duration: '',
    });
    const [consultationNotes, setConsultationNotes] = useState('');
    const [saved, setSaved] = useState(false);
    const [followUpRequired, setFollowUpRequired] = useState(false);
    const [consentRevokedAt, setConsentRevokedAt] = useState<string | null>(null);

    // Lab Request
    const [showLabRequest, setShowLabRequest] = useState(false);
    const [labRequests, setLabRequests] = useState<{ testName: string; notes: string }[]>([]);
    const [newLabTest, setNewLabTest] = useState('');
    const [newLabNotes, setNewLabNotes] = useState('');

    useEffect(() => {
        setMounted(true);

        if (!DEMO_MODE) {
            router.push('/auth/doctor');
            return;
        }

        const doctorId = localStorage.getItem('demo_doctor_id');
        if (!doctorId) {
            router.push('/auth/doctor');
            return;
        }

        const doctor = getDemoDoctor(doctorId);
        if (!doctor) {
            router.push('/auth/doctor');
            return;
        }

        setDemoDoctor(doctor);

        // Load patient data
        const patientData = getDemoPatient(patientId);
        setPatient(patientData);

        // STEP 1: Resolve consent state FIRST before loading any protected data
        const queue = getDemoQueue(doctorId);
        const queuedPatientData = queue.find(p => p.patientId === patientId);

        let resolvedConsent: ConsentState = 'pending';

        if (queuedPatientData) {
            setQueuedPatient(queuedPatientData);
            resolvedConsent = queuedPatientData.consentState;
        } else {
            // Check global consent for existing patients
            const consent = getGlobalConsent();
            if (consent && consent.granted) {
                resolvedConsent = 'granted';
            }
        }

        // Set consent state and mark as resolved
        setConsentState(resolvedConsent);
        setConsentResolved(true);

        // STEP 2: ONLY load protected data AFTER consent is confirmed granted
        if (resolvedConsent === 'granted') {
            setLogbook(getDemoLogbook(patientId));
        }
        // DO NOT fetch logbook if consent is not granted

        // Load existing prescriptions (non-protected)
        setPrescriptions(getDemoPrescriptions(patientId));

        setLoading(false);
    }, [patientId, router]);

    // Monitor consent changes (for demo purposes) - ONLY after initial consent is resolved
    useEffect(() => {
        // Don't start polling until consent is initially resolved
        if (!consentResolved) return;

        const interval = setInterval(() => {
            const consent = getGlobalConsent();
            if (consent && consent.granted && consentState !== 'granted') {
                // Consent was just granted
                setConsentState('granted');
                setLogbook(getDemoLogbook(patientId));
            } else if (consent && !consent.granted && consentState === 'granted') {
                // Consent was just revoked - record timestamp
                setConsentState('revoked');
                setConsentRevokedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
                setLogbook([]);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [patientId, consentState, consentResolved]);

    const handleStartCall = () => {
        setCallStatus('connecting');
        setTimeout(() => setCallStatus('connected'), 2000);
    };

    const handleEndCall = () => {
        setCallStatus('idle');
    };

    const handleAddPrescription = () => {
        if (!newRx.medicine || !newRx.dosage) return;

        const updated = [...prescriptions, { ...newRx }];
        setPrescriptions(updated);
        setNewRx({ medicine: '', dosage: '', frequency: '', duration: '' });
    };

    const handleRemovePrescription = (index: number) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== index));
    };

    const handleCompleteConsultation = () => {
        if (!demoDoctor || !patient) return;

        // Save to demo session store
        addDemoPrescription(patientId, demoDoctor.id, prescriptions, consultationNotes);
        setSaved(true);

        setTimeout(() => {
            router.push('/doctor/dashboard');
        }, 2000);
    };

    const getConsentBadge = () => {
        switch (consentState) {
            case 'granted':
                return <span className={styles.consentGranted}>✓ Data Access Active</span>;
            case 'revoked':
                return <span className={styles.consentRevoked}>⚠ Access Revoked</span>;
            case 'pending':
                return <span className={styles.consentPending}>⏳ Awaiting Consent</span>;
        }
    };

    if (loading || !mounted) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading Consultation...</p>
            </div>
        );
    }

    // CRITICAL: Block all rendering until consent is resolved
    // This prevents any flash of protected data
    if (consentState === 'loading' || !consentResolved) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Checking patient data access...</p>
            </div>
        );
    }

    // DEV ASSERTION: Prevent rendering protected data if consent not granted
    if (process.env.NODE_ENV === 'development') {
        if (logbook.length > 0 && consentState !== 'granted') {
            console.error('[CONSENT VIOLATION] Logbook data exists but consent is not granted!');
        }
        if (queuedPatient && consentState !== 'granted' && logbook.length > 0) {
            console.error('[CONSENT VIOLATION] Intake data exists but consent is not granted!');
        }
    }

    // Create fallback patient data for unknown patients
    const displayPatient = patient || {
        name: queuedPatient?.patientName || 'Unknown Patient',
        age: queuedPatient?.age || 0,
        gender: queuedPatient?.gender || 'other',
        location: queuedPatient?.location || 'Unknown',
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/doctor/dashboard" className={styles.backBtn}>
                        ← Back to Dashboard
                    </Link>
                    <span className={styles.headerTitle}>Active Consultation</span>
                </div>
                <div className={styles.headerRight}>
                    {mounted && DEMO_MODE && (
                        <span className={styles.demoBadge}>🧪 Demo Mode</span>
                    )}
                    <span className={styles.callStatusBadge}>
                        {callStatus === 'connected' ? '🟢 Connected' :
                            callStatus === 'connecting' ? '🟡 Connecting...' : '⚪ Not Started'}
                    </span>
                </div>
            </header>

            {/* Compliance Notice */}
            <div className={styles.complianceNotice}>
                <span className={styles.complianceIcon}>⚕️</span>
                You are the sole clinical authority. AI summaries are for intake reference only.
            </div>

            <main className={styles.main}>
                {/* Two Column Layout */}
                <div className={styles.columns}>
                    {/* LEFT COLUMN - Clinical Context */}
                    <div className={styles.leftColumn}>
                        {/* Section A: Patient Snapshot Card */}
                        <section className={styles.patientCard}>
                            <div className={styles.patientHeader}>
                                <div className={styles.patientAvatar}>
                                    {displayPatient.name.charAt(0)}
                                </div>
                                <div className={styles.patientInfo}>
                                    <h1 className={styles.patientName}>{displayPatient.name}</h1>
                                    <p className={styles.patientMeta}>
                                        {displayPatient.age}y • {displayPatient.gender === 'male' ? 'Male' : displayPatient.gender === 'female' ? 'Female' : 'Other'} • {displayPatient.location}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.patientBadges}>
                                {getConsentBadge()}
                                {queuedPatient && (
                                    <span className={
                                        queuedPatient.priority === 'high' ? styles.priorityHigh :
                                            queuedPatient.priority === 'medium' ? styles.priorityMedium :
                                                styles.priorityLow
                                    }>
                                        {queuedPatient.priority.charAt(0).toUpperCase() + queuedPatient.priority.slice(1)} Priority
                                    </span>
                                )}
                            </div>
                        </section>

                        {/* Consent Revoked Warning with Audit Note */}
                        {consentState === 'revoked' && (
                            <section className={styles.revokedWarning}>
                                <div className={styles.warningIcon}>🔒</div>
                                <h3>Data Access Revoked</h3>
                                <p>The patient has revoked consent to share their health data.</p>
                                {consentRevokedAt && (
                                    <p className={styles.auditNote}>
                                        Patient revoked data access at {consentRevokedAt}
                                    </p>
                                )}
                                <p className={styles.warningNote}>
                                    You can still conduct the consultation, but previous intake data is no longer accessible.
                                </p>
                            </section>
                        )}

                        {/* No Consent Warning */}
                        {consentState === 'pending' && (
                            <section className={styles.pendingWarning}>
                                <div className={styles.warningIcon}>⏳</div>
                                <h3>Awaiting Consent</h3>
                                <p>The patient has not yet granted consent to share their health data.</p>
                                <p className={styles.warningNote}>
                                    You may proceed with the consultation without access to logbook data.
                                </p>
                            </section>
                        )}

                        {/* Section B: AI Intake Summary (Only if consent granted) */}
                        {consentState === 'granted' && queuedPatient && (
                            <section className={styles.intakeCard}>
                                <div className={styles.intakeHeader}>
                                    <h2>AI Intake Summary</h2>
                                    <span className={styles.intakeLabel}>Assistive, Non-Clinical</span>
                                </div>
                                {/* Case Context Indicator */}
                                <div className={styles.caseContext}>
                                    Patient data shared from the past {queuedPatient.symptomOnsetDays} days
                                </div>
                                <div className={styles.intakeContent}>
                                    <div className={styles.intakeRow}>
                                        <span className={styles.intakeKey}>Chief Complaint</span>
                                        <span className={styles.intakeValue}>{queuedPatient.chiefComplaint}</span>
                                    </div>
                                    <div className={styles.intakeRow}>
                                        <span className={styles.intakeKey}>Duration</span>
                                        <span className={styles.intakeValue}>{queuedPatient.symptomOnsetDays} days</span>
                                    </div>
                                    <div className={styles.intakeRow}>
                                        <span className={styles.intakeKey}>Severity</span>
                                        <span className={styles.intakeValue}>
                                            {queuedPatient.priority === 'high' ? 'Severe (patient-reported)' :
                                                queuedPatient.priority === 'medium' ? 'Moderate' : 'Mild'}
                                        </span>
                                    </div>
                                    <div className={styles.intakeRow}>
                                        <span className={styles.intakeKey}>Intake Source</span>
                                        <span className={styles.intakeValue}>
                                            {queuedPatient.intakeSource === 'chatbot' ? '🤖 AI Chatbot' :
                                                queuedPatient.intakeSource === 'logbook' ? '📝 Patient Logbook' :
                                                    queuedPatient.intakeSource === 'health_worker' ? '👩‍⚕️ Health Worker' : '👤 Self-reported'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.intakeDisclaimer}>
                                    ℹ️ This summary is AI-generated from patient-provided information.
                                    All clinical decisions remain at your discretion.
                                </div>
                            </section>
                        )}

                        {/* Section C: CONSOLIDATED INTAKE SUMMARY (Replaces Raw Logbook) */}
                        {/* Doctors NEVER see raw logs - only this consolidated summary */}
                        {consentState === 'granted' && queuedPatient?.intakeSummary ? (
                            <section className={styles.intakeSummaryCard}>
                                <div className={styles.summaryHeader}>
                                    <h2>🧾 Patient Intake Summary</h2>
                                    <span className={styles.assistiveBadge}>Assistive, Non-Clinical</span>
                                </div>

                                <div className={styles.summaryContent}>
                                    <div className={styles.summaryRow}>
                                        <span className={styles.summaryLabel}>Chief Complaint</span>
                                        <span className={styles.summaryValue}>{queuedPatient.intakeSummary.chiefComplaint}</span>
                                    </div>

                                    <div className={styles.summaryRow}>
                                        <span className={styles.summaryLabel}>Symptom Timeline</span>
                                        <span className={styles.summaryValue}>{queuedPatient.intakeSummary.symptomTimeline}</span>
                                    </div>

                                    <div className={styles.summaryRow}>
                                        <span className={styles.summaryLabel}>Severity (Patient-Reported)</span>
                                        <span className={`${styles.summaryValue} ${styles.severityBadge} ${queuedPatient.intakeSummary.severityReported === 'Severe' ? styles.severitySevere :
                                                queuedPatient.intakeSummary.severityReported === 'Moderate' ? styles.severityModerate :
                                                    styles.severityMild
                                            }`}>
                                            {queuedPatient.intakeSummary.severityReported}
                                        </span>
                                    </div>

                                    <div className={styles.summarySection}>
                                        <span className={styles.summaryLabel}>Associated Symptoms</span>
                                        <ul className={styles.bulletList}>
                                            {queuedPatient.intakeSummary.associatedSymptoms.map((symptom, idx) => (
                                                <li key={idx}>{symptom}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className={styles.summarySection}>
                                        <span className={styles.summaryLabel}>Relevant Context</span>
                                        <ul className={styles.bulletList}>
                                            {queuedPatient.intakeSummary.relevantContext.map((ctx, idx) => (
                                                <li key={idx}>{ctx}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className={styles.summaryFooter}>
                                    <div className={styles.dataSource}>
                                        <span className={styles.footerLabel}>Data Source:</span>
                                        <span>{queuedPatient.intakeSummary.dataSources.join(', ')}</span>
                                    </div>
                                    <div className={styles.dataSource}>
                                        <span className={styles.footerLabel}>Consolidated at:</span>
                                        <span>{new Date(queuedPatient.intakeSummary.generatedAt).toLocaleString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                </div>

                                <div className={styles.summaryDisclaimer}>
                                    ℹ️ {queuedPatient.intakeSummary.ai_disclaimer}
                                </div>
                            </section>
                        ) : consentState === 'revoked' ? (
                            <section className={styles.consentRevokedCard}>
                                <div className={styles.revokedIcon}>🔒</div>
                                <h3>Patient has revoked access to intake data</h3>
                                <p>The patient has withdrawn consent for sharing their intake information. You may proceed with the consultation based on direct patient interaction only.</p>
                            </section>
                        ) : null}
                    </div>

                    {/* RIGHT COLUMN - Consultation Interaction */}
                    <div className={styles.rightColumn}>
                        {/* Section D: Live Call Area */}
                        <section className={styles.callArea}>
                            {callStatus === 'idle' ? (
                                <div className={styles.callPlaceholder}>
                                    <div className={styles.callIcon}>
                                        {queuedPatient?.consultationType === 'video' ? '📹' : '📞'}
                                    </div>
                                    <h3>{queuedPatient?.consultationType === 'video' ? 'Video' : 'Audio'} Call</h3>
                                    <p>Click to start the consultation call</p>
                                    <button onClick={handleStartCall} className={styles.startCallBtn}>
                                        Start {queuedPatient?.consultationType === 'video' ? 'Video' : 'Audio'} Call
                                    </button>
                                </div>
                            ) : callStatus === 'connecting' ? (
                                <div className={styles.callConnecting}>
                                    <div className={styles.connectingSpinner}></div>
                                    <p>Connecting to patient...</p>
                                </div>
                            ) : (
                                <div className={styles.callConnected}>
                                    <div className={styles.callVideo}>
                                        <div className={styles.patientVideo}>
                                            <span className={styles.videoPlaceholder}>
                                                {displayPatient.name.charAt(0)}
                                            </span>
                                            <span className={styles.videoLabel}>Patient</span>
                                        </div>
                                        <div className={styles.doctorVideo}>
                                            <span className={styles.videoPlaceholder}>👨‍⚕️</span>
                                            <span className={styles.videoLabel}>You</span>
                                        </div>
                                    </div>
                                    <div className={styles.callControls}>
                                        <button
                                            className={`${styles.callControlBtn} ${isMuted ? styles.controlActive : ''}`}
                                            onClick={() => setIsMuted(!isMuted)}
                                        >
                                            {isMuted ? '🔇' : '🎤'}
                                        </button>
                                        <button
                                            className={`${styles.callControlBtn} ${isCameraOff ? styles.controlActive : ''}`}
                                            onClick={() => setIsCameraOff(!isCameraOff)}
                                        >
                                            {isCameraOff ? '📷' : '📹'}
                                        </button>
                                        <button className={styles.endCallBtn} onClick={handleEndCall}>
                                            End Call
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Section E: Clinical Notes */}
                        <section className={styles.notesCard}>
                            <h2>📝 Clinical Notes (Doctor Authored)</h2>
                            <p className={styles.notesSubtitle}>Doctor-only notes — no AI auto-fill</p>
                            <textarea
                                value={consultationNotes}
                                onChange={(e) => setConsultationNotes(e.target.value)}
                                placeholder="Enter your clinical observations, findings, and recommendations..."
                                className={styles.notesTextarea}
                                rows={6}
                            />
                        </section>

                        {/* Section F: Prescription Module */}
                        <section className={styles.prescriptionCard}>
                            <div className={styles.prescriptionHeader}>
                                <h2>💊 Prescription (Doctor Authored)</h2>
                                <button
                                    onClick={() => setShowPrescription(!showPrescription)}
                                    className={styles.addRxBtn}
                                >
                                    {showPrescription ? 'Hide Form' : '+ Add Medicine'}
                                </button>
                            </div>

                            {showPrescription && (
                                <div className={styles.rxForm}>
                                    <input
                                        type="text"
                                        placeholder="Medicine name (e.g., Paracetamol 500mg)"
                                        value={newRx.medicine}
                                        onChange={(e) => setNewRx({ ...newRx, medicine: e.target.value })}
                                        className={styles.rxInput}
                                    />
                                    <div className={styles.rxRow}>
                                        <input
                                            type="text"
                                            placeholder="Dosage"
                                            value={newRx.dosage}
                                            onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                                            className={styles.rxInputSmall}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Frequency"
                                            value={newRx.frequency}
                                            onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                                            className={styles.rxInputSmall}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Duration"
                                            value={newRx.duration}
                                            onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                                            className={styles.rxInputSmall}
                                        />
                                    </div>
                                    <button onClick={handleAddPrescription} className={styles.addMedBtn}>
                                        Add to Prescription
                                    </button>
                                </div>
                            )}

                            {prescriptions.length > 0 && (
                                <div className={styles.rxList}>
                                    {prescriptions.map((rx, index) => (
                                        <div key={index} className={styles.rxItem}>
                                            <div className={styles.rxDetails}>
                                                <strong>{rx.medicine}</strong>
                                                <span>{rx.dosage} • {rx.frequency} • {rx.duration}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemovePrescription(index)}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className={styles.demoNote}>
                                ⚠️ Demo Prescription – Not for Real Use
                            </p>
                        </section>

                        {/* Section G: Case Actions */}
                        <section className={styles.actionsCard}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={followUpRequired}
                                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                                />
                                <span>Mark as Follow-up Required</span>
                            </label>

                            <div className={styles.actionButtons}>
                                {saved ? (
                                    <div className={styles.savedMessage}>
                                        ✓ Consultation Saved! Redirecting...
                                    </div>
                                ) : (
                                    <>
                                        {callStatus === 'connected' && (
                                            <button onClick={handleEndCall} className={styles.endCallAction}>
                                                End Call
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowLabRequest(true)}
                                            className={styles.labRequestBtn}
                                        >
                                            🔬 Request Investigation
                                        </button>
                                        <button onClick={handleCompleteConsultation} className={styles.completeBtn}>
                                            Complete Consultation
                                        </button>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* Requested Investigations List */}
                        {labRequests.length > 0 && (
                            <section className={styles.labRequestsCard}>
                                <h3>Requested Investigations</h3>
                                <ul className={styles.labList}>
                                    {labRequests.map((lab, idx) => (
                                        <li key={idx}>
                                            <strong>🔬 {lab.testName}</strong>
                                            {lab.notes && <span> - {lab.notes}</span>}
                                        </li>
                                    ))}
                                </ul>
                                <p className={styles.labDisclaimer}>
                                    These are documentation requests only. They do not auto-trigger any lab scheduling.
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* Lab Request Modal */}
            {showLabRequest && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Request Investigation</h2>
                        <p className={styles.modalSubtitle}>
                            Document your investigation request. This is visible to patient and health worker.
                        </p>

                        <div className={styles.formField}>
                            <label>Test Name</label>
                            <select
                                value={newLabTest}
                                onChange={(e) => setNewLabTest(e.target.value)}
                                className={styles.selectField}
                            >
                                <option value="">Select a test...</option>
                                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                                <option value="Blood Sugar (Fasting)">Blood Sugar (Fasting)</option>
                                <option value="HbA1c">HbA1c</option>
                                <option value="Lipid Profile">Lipid Profile</option>
                                <option value="Thyroid Profile (TSH, T3, T4)">Thyroid Profile (TSH, T3, T4)</option>
                                <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                                <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                                <option value="Urine Routine">Urine Routine</option>
                                <option value="Chest X-Ray">Chest X-Ray</option>
                                <option value="ECG">ECG</option>
                                <option value="Other">Other (specify in notes)</option>
                            </select>
                        </div>

                        <div className={styles.formField}>
                            <label>Notes (Optional)</label>
                            <textarea
                                value={newLabNotes}
                                onChange={(e) => setNewLabNotes(e.target.value)}
                                placeholder="Any specific instructions or rationale..."
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalDisclaimer}>
                            ⚠️ This does NOT trigger automated scheduling. It is intent documentation only.
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => { setShowLabRequest(false); setNewLabTest(''); setNewLabNotes(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={() => {
                                    if (newLabTest) {
                                        setLabRequests([...labRequests, { testName: newLabTest, notes: newLabNotes }]);
                                        setShowLabRequest(false);
                                        setNewLabTest('');
                                        setNewLabNotes('');
                                    }
                                }}
                                disabled={!newLabTest}
                            >
                                Add Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
