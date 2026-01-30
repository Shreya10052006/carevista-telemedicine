'use client';

/**
 * Health Worker Portal - Premium Redesign
 * ========================================
 * Professional facilitator-only, session-based interface.
 * 
 * CORE ROLE (NON-NEGOTIABLE):
 * - Health Workers are FACILITATORS ONLY
 * - Session-driven, not account-driven
 * - NO access to patient medical history
 * - NO access to AI summaries, triage, or prescriptions
 * - All actions require patient presence
 * 
 * UI PHILOSOPHY:
 * - Tool-like, not personal
 * - Hospital workstation feel
 * - No emotional language or personalization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Logo } from '@/components/common/Logo';
import { useLanguage } from '@/contexts/LanguageContext';

// Session types
interface Session {
    sessionId: string;
    patientId: string;
    patientName: string;
    startedAt: Date;
    expiresAt: Date;
    remainingMinutes: number;
    language: string;
}

type ActionScreen = 'dashboard' | 'symptoms' | 'upload' | 'consent' | 'consult';

// Demo mode check
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function HealthWorkerPortal() {
    const router = useRouter();
    const { language: uiLanguage, setLanguage: setUILanguage, t } = useLanguage();

    // Session state
    const [session, setSession] = useState<Session | null>(null);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [activeScreen, setActiveScreen] = useState<ActionScreen>('dashboard');
    const [mounted, setMounted] = useState(false);

    // Start session form
    const [patientId, setPatientId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [language, setLanguage] = useState('en');
    const [presenceConfirmed, setPresenceConfirmed] = useState(false);
    const [roleUnderstood, setRoleUnderstood] = useState(false);

    // Action states
    const [symptomText, setSymptomText] = useState('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [consentExplained, setConsentExplained] = useState(false);
    const [patientConfirmedConsent, setPatientConfirmedConsent] = useState(false);
    const [consultationType, setConsultationType] = useState<'audio' | 'video'>('audio');
    const [waitingForDoctor, setWaitingForDoctor] = useState(false);

    // Messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Session timer countdown
    useEffect(() => {
        if (!session) return;

        timerRef.current = setInterval(() => {
            const now = new Date();
            const remaining = Math.max(0, Math.floor((session.expiresAt.getTime() - now.getTime()) / 60000));

            if (remaining <= 0) {
                // Auto-timeout
                handleSessionTimeout();
            } else {
                setSession(prev => prev ? { ...prev, remainingMinutes: remaining } : null);
            }
        }, 10000); // Update every 10 seconds

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [session?.sessionId]);

    const handleSessionTimeout = () => {
        setSession(null);
        setActiveScreen('dashboard');
        setErrorMessage('Session expired. All access has been revoked.');
    };

    const startSession = () => {
        if (!presenceConfirmed || !roleUnderstood) {
            setErrorMessage('Please confirm all requirements before starting.');
            return;
        }

        if (!patientId.trim() && !patientName.trim()) {
            setErrorMessage('Please enter Patient ID or Name.');
            return;
        }

        // Create demo session
        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 60000); // 30 minutes

        setSession({
            sessionId: `session-${Date.now()}`,
            patientId: patientId || `temp-${Date.now()}`,
            patientName: patientName || 'Patient',
            startedAt: now,
            expiresAt: expires,
            remainingMinutes: 30,
            language,
        });

        setShowStartModal(false);
        setSuccessMessage('Session started. Patient must remain present for all actions.');
        resetForm();
    };

    const endSession = () => {
        setSession(null);
        setActiveScreen('dashboard');
        setShowEndConfirm(false);
        setSuccessMessage('Session ended. All access has been revoked.');
        resetActionStates();
    };

    const resetForm = () => {
        setPatientId('');
        setPatientName('');
        setLanguage('en');
        setPresenceConfirmed(false);
        setRoleUnderstood(false);
    };

    const resetActionStates = () => {
        setSymptomText('');
        setUploadProgress(null);
        setUploadSuccess(false);
        setConsentExplained(false);
        setPatientConfirmedConsent(false);
        setWaitingForDoctor(false);
    };

    const handleSaveSymptoms = () => {
        if (!symptomText.trim()) return;
        // In production, this would call the API
        setSuccessMessage('Symptoms saved to patient logbook.');
        setSymptomText('');
        setTimeout(() => setActiveScreen('dashboard'), 1500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simulate upload
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev === null || prev >= 100) {
                    clearInterval(interval);
                    setUploadSuccess(true);
                    setSuccessMessage('Document uploaded successfully.');
                    return 100;
                }
                return prev + 20;
            });
        }, 300);
    };

    const handleInitiateConsultation = () => {
        setWaitingForDoctor(true);
        setSuccessMessage(`${consultationType === 'video' ? 'Video' : 'Audio'} consultation initiated. Waiting for doctor...`);
    };

    const clearMessages = () => {
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    // Render functions
    const renderDashboard = () => (
        <div className={styles.dashboard}>
            {/* Left Column - Action Cards */}
            <div className={styles.leftColumn}>
                <h2 className={styles.columnTitle}>Allowed Actions</h2>
                <p className={styles.columnSubtitle}>Patient must be present for all actions</p>

                <div className={styles.actionCards}>
                    {/* Assisted Symptom Logging */}
                    <button
                        className={styles.actionCard}
                        onClick={() => setActiveScreen('symptoms')}
                        disabled={!session}
                    >
                        <div className={styles.actionIcon}>📝</div>
                        <div className={styles.actionContent}>
                            <h3>Assisted Symptom Logging</h3>
                            <p>Record symptoms as patient describes them</p>
                            <span className={styles.actionNote}>Voice-first • Multi-language</span>
                        </div>
                        <div className={styles.actionArrow}>→</div>
                    </button>

                    {/* Document Upload */}
                    <button
                        className={styles.actionCard}
                        onClick={() => setActiveScreen('upload')}
                        disabled={!session}
                    >
                        <div className={styles.actionIcon}>📄</div>
                        <div className={styles.actionContent}>
                            <h3>Document Upload</h3>
                            <p>Upload medical reports and prescriptions</p>
                            <span className={styles.actionNote}>Camera • File upload</span>
                        </div>
                        <div className={styles.actionArrow}>→</div>
                    </button>

                    {/* Consent Explanation */}
                    <button
                        className={styles.actionCard}
                        onClick={() => setActiveScreen('consent')}
                        disabled={!session}
                    >
                        <div className={styles.actionIcon}>✓</div>
                        <div className={styles.actionContent}>
                            <h3>Consent Explanation</h3>
                            <p>Explain consent and help patient confirm</p>
                            <span className={styles.actionNote}>Read-aloud • Patient confirms</span>
                        </div>
                        <div className={styles.actionArrow}>→</div>
                    </button>

                    {/* Initiate Consultation */}
                    <button
                        className={styles.actionCard}
                        onClick={() => setActiveScreen('consult')}
                        disabled={!session}
                    >
                        <div className={styles.actionIcon}>📞</div>
                        <div className={styles.actionContent}>
                            <h3>Initiate Consultation</h3>
                            <p>Start audio or video call with doctor</p>
                            <span className={styles.actionNote}>Audio • Video options</span>
                        </div>
                        <div className={styles.actionArrow}>→</div>
                    </button>
                </div>

                {!session && (
                    <div className={styles.noSessionOverlay}>
                        <div className={styles.noSessionContent}>
                            <span className={styles.lockIcon}>🔒</span>
                            <p>Start a session to enable actions</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column - Restrictions & Rules */}
            <div className={styles.rightColumn}>
                {/* Restrictions Panel - ALWAYS VISIBLE */}
                <div className={styles.restrictionsPanel}>
                    <h3 className={styles.restrictionsTitle}>🔒 You CANNOT Do These</h3>
                    <ul className={styles.restrictionsList}>
                        <li><span className={styles.restrictIcon}>🔒</span> View AI intake summaries</li>
                        <li><span className={styles.restrictIcon}>🔒</span> View triage priority</li>
                        <li><span className={styles.restrictIcon}>🔒</span> View doctor notes</li>
                        <li><span className={styles.restrictIcon}>🔒</span> View prescriptions</li>
                        <li><span className={styles.restrictIcon}>🔒</span> Access patient data after session</li>
                        <li><span className={styles.restrictIcon}>🔒</span> Provide medical advice</li>
                    </ul>
                    <p className={styles.restrictionsNote}>
                        🛡️ These restrictions protect patient privacy and ensure clinical decisions remain with qualified doctors.
                    </p>
                </div>

                {/* Session Rules Panel */}
                <div className={styles.rulesPanel}>
                    <h3 className={styles.rulesTitle}>📋 Session Rules</h3>
                    <ul className={styles.rulesList}>
                        <li><span className={styles.ruleIcon}>⏱️</span> Sessions are time-limited (30 min)</li>
                        <li><span className={styles.ruleIcon}>👤</span> Patient presence is mandatory</li>
                        <li><span className={styles.ruleIcon}>📊</span> All actions are logged</li>
                        <li><span className={styles.ruleIcon}>🏷️</span> All uploads are patient-tagged</li>
                        <li><span className={styles.ruleIcon}>🔐</span> Access revoked when session ends</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderSymptomsScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                ← Back to Dashboard
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>📝</span>
                    <h2>Assisted Symptom Logging</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    You are recording what the patient says. Do not interpret or diagnose.
                </div>

                <div className={styles.languageSelector}>
                    <label>Patient's Language:</label>
                    <select value={session?.language || 'en'} disabled>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                        <option value="kn">Kannada</option>
                        <option value="ml">Malayalam</option>
                        <option value="mr">Marathi</option>
                        <option value="bn">Bengali</option>
                    </select>
                </div>

                <div className={styles.microphoneArea}>
                    <button className={styles.micButton}>
                        🎤
                    </button>
                    <p className={styles.micHint}>Tap to use voice input</p>
                </div>

                <div className={styles.textInputArea}>
                    <label>Or type symptoms as patient describes:</label>
                    <textarea
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                        placeholder="Patient says: 'I have had a headache for 3 days...'"
                        rows={6}
                    />
                </div>

                <button
                    className={styles.primaryButton}
                    onClick={handleSaveSymptoms}
                    disabled={!symptomText.trim()}
                >
                    Save to Patient Logbook
                </button>

                <p className={styles.screenNote}>
                    ℹ️ Symptoms are saved directly to patient's logbook. You will NOT see previous entries.
                </p>
            </div>
        </div>
    );

    const renderUploadScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                ← Back to Dashboard
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>📄</span>
                    <h2>Document Upload</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    Upload documents for the patient. You will NOT see document contents or history.
                </div>

                <div className={styles.uploadArea}>
                    {uploadProgress === null && !uploadSuccess ? (
                        <>
                            <div className={styles.uploadButtons}>
                                <label className={styles.uploadButton}>
                                    <span>📷</span>
                                    <span>Camera</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileUpload}
                                        hidden
                                    />
                                </label>
                                <label className={styles.uploadButton}>
                                    <span>📁</span>
                                    <span>Choose File</span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleFileUpload}
                                        hidden
                                    />
                                </label>
                            </div>
                            <p className={styles.uploadHint}>
                                Supported: Images, PDF documents
                            </p>
                        </>
                    ) : uploadProgress !== null && uploadProgress < 100 ? (
                        <div className={styles.uploadProgress}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p>Uploading... {uploadProgress}%</p>
                        </div>
                    ) : (
                        <div className={styles.uploadComplete}>
                            <span className={styles.checkmark}>✓</span>
                            <p>Document uploaded successfully</p>
                            <button
                                className={styles.secondaryButton}
                                onClick={() => { setUploadProgress(null); setUploadSuccess(false); }}
                            >
                                Upload Another
                            </button>
                        </div>
                    )}
                </div>

                <p className={styles.screenNote}>
                    ℹ️ Documents are tagged to patient and require their consent before doctor can view.
                </p>
            </div>
        </div>
    );

    const renderConsentScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                ← Back to Dashboard
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>✓</span>
                    <h2>Consent Explanation</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    Your role: Explain consent clearly. The PATIENT must confirm, not you.
                </div>

                <div className={styles.consentText}>
                    <h4>Read Aloud to Patient:</h4>
                    <div className={styles.consentBox}>
                        <p>
                            "Your health information will be shared with the doctor to help them understand your condition
                            and provide treatment. This includes symptoms you've described and any documents you've uploaded.
                        </p>
                        <p>
                            You can withdraw your consent at any time. The doctor and health worker cannot access your
                            information after the consultation ends without your permission.
                        </p>
                        <p>
                            Do you understand and agree to share your health information?"
                        </p>
                    </div>
                    <button className={styles.readAloudBtn}>
                        🔊 Read Aloud
                    </button>
                </div>

                <div className={styles.consentConfirmation}>
                    <label className={styles.consentCheck}>
                        <input
                            type="checkbox"
                            checked={consentExplained}
                            onChange={(e) => setConsentExplained(e.target.checked)}
                        />
                        <span>I have explained consent to the patient</span>
                    </label>

                    <label className={`${styles.consentCheck} ${styles.patientCheck}`}>
                        <input
                            type="checkbox"
                            checked={patientConfirmedConsent}
                            onChange={(e) => setPatientConfirmedConsent(e.target.checked)}
                            disabled={!consentExplained}
                        />
                        <span>PATIENT has confirmed they understand and consent</span>
                    </label>
                </div>

                <button
                    className={styles.primaryButton}
                    disabled={!consentExplained || !patientConfirmedConsent}
                    onClick={() => {
                        setSuccessMessage('Patient consent recorded. Proceeding to consultation...');
                        setTimeout(() => setActiveScreen('consult'), 1500);
                    }}
                >
                    Record Consent & Proceed to Consultation
                </button>

                <p className={styles.screenNote}>
                    ℹ️ Patient can revoke consent at any time through their own app.
                </p>
            </div>
        </div>
    );

    const renderConsultScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                ← Back to Dashboard
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>📞</span>
                    <h2>Initiate Consultation</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    You initiate the call. Leave if patient requests privacy during consultation.
                </div>

                {!waitingForDoctor ? (
                    <>
                        <div className={styles.consultOptions}>
                            <button
                                className={`${styles.consultOption} ${consultationType === 'audio' ? styles.selected : ''}`}
                                onClick={() => setConsultationType('audio')}
                            >
                                <span>📞</span>
                                <span>Audio Call</span>
                            </button>
                            <button
                                className={`${styles.consultOption} ${consultationType === 'video' ? styles.selected : ''}`}
                                onClick={() => setConsultationType('video')}
                            >
                                <span>📹</span>
                                <span>Video Call</span>
                            </button>
                        </div>

                        <button
                            className={styles.primaryButton}
                            onClick={handleInitiateConsultation}
                        >
                            Start Consultation
                        </button>
                    </>
                ) : (
                    <div className={styles.waitingState}>
                        <div className={styles.waitingSpinner}></div>
                        <h3>Waiting for Doctor...</h3>
                        <p>The patient is in queue. A doctor will join shortly.</p>
                        <button
                            className={styles.cancelButton}
                            onClick={() => setWaitingForDoctor(false)}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <p className={styles.screenNote}>
                    ℹ️ Do not speak on behalf of doctor or interpret their advice.
                </p>
            </div>
        </div>
    );

    if (!mounted) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading Health Worker Portal...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logo}>
                        <Logo size="small" theme="primary" showText={false} />
                        <span className={styles.logoText}>CareVista</span>
                    </div>
                    <div className={styles.headerDivider}></div>
                    <h1 className={styles.portalTitle}>Health Worker Portal</h1>
                    <span className={styles.facilitatorBadge}>Facilitator Only</span>
                </div>
                <div className={styles.headerRight}>
                    {/* Multilingual Selector - Full Labels */}
                    <div className={styles.languageSelectorHeader}>
                        <button
                            className={`${styles.langBtn} ${uiLanguage === 'en' ? styles.langBtnActive : ''}`}
                            onClick={() => setUILanguage('en')}
                            title="English"
                        >
                            EN
                        </button>
                        <button
                            className={`${styles.langBtn} ${uiLanguage === 'hi' ? styles.langBtnActive : ''}`}
                            onClick={() => setUILanguage('hi')}
                            title="Hindi"
                        >
                            हिंदी
                        </button>
                        <button
                            className={`${styles.langBtn} ${uiLanguage === 'ta' ? styles.langBtnActive : ''}`}
                            onClick={() => setUILanguage('ta')}
                            title="Tamil"
                        >
                            தமிழ்
                        </button>
                    </div>
                    {mounted && DEMO_MODE && (
                        <span className={styles.demoBadge}>🧪 Demo Mode</span>
                    )}
                    {session ? (
                        <div className={styles.sessionIndicator}>
                            <span className={styles.sessionActive}>Active Session</span>
                            <span className={styles.sessionTimer}>⏱️ {session.remainingMinutes} min</span>
                        </div>
                    ) : (
                        <span className={styles.sessionInactive}>No Active Session</span>
                    )}
                    <button className={styles.signOutBtn} onClick={() => router.push('/auth/health-worker')}>Sign Out</button>
                </div>
            </header>

            {/* Session Banner */}
            {session && (
                <div className={styles.sessionBanner}>
                    <div className={styles.sessionInfo}>
                        <span className={styles.sessionLabel}>Active Session:</span>
                        <span className={styles.sessionPatient}>Patient ID: {session.patientId.slice(0, 12)}...</span>
                        <span className={styles.sessionLang}>Language: {session.language.toUpperCase()}</span>
                    </div>
                    <div className={styles.sessionActions}>
                        <span className={styles.timerLarge}>⏱️ {session.remainingMinutes} min remaining</span>
                        <button
                            className={styles.endSessionBtn}
                            onClick={() => setShowEndConfirm(true)}
                        >
                            End Session
                        </button>
                    </div>
                </div>
            )}

            {/* Role Disclaimer - Always Visible */}
            <div className={styles.roleDisclaimer}>
                <span className={styles.disclaimerIcon}>⚠️</span>
                <span><strong>This is an Assisted Session.</strong> The patient must be present. You are a facilitator only — no medical decisions, no patient data access outside session.</span>
            </div>

            {/* Messages */}
            {(successMessage || errorMessage) && (
                <div className={`${styles.message} ${errorMessage ? styles.errorMessage : styles.successMessage}`}>
                    <span>{successMessage || errorMessage}</span>
                    <button onClick={clearMessages}>✕</button>
                </div>
            )}

            {/* Main Content */}
            <main className={styles.main}>
                {activeScreen === 'dashboard' && renderDashboard()}
                {activeScreen === 'symptoms' && renderSymptomsScreen()}
                {activeScreen === 'upload' && renderUploadScreen()}
                {activeScreen === 'consent' && renderConsentScreen()}
                {activeScreen === 'consult' && renderConsultScreen()}
            </main>

            {/* Start Session Button (Fixed) */}
            {!session && activeScreen === 'dashboard' && (
                <div className={styles.startSessionFixed}>
                    <button
                        className={styles.startSessionBtn}
                        onClick={() => setShowStartModal(true)}
                    >
                        Start Assisted Session
                    </button>
                </div>
            )}

            {/* Start Session Modal */}
            {showStartModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>Start Assisted Session</h2>

                        <div className={styles.confirmChecks}>
                            <label className={styles.confirmCheck}>
                                <input
                                    type="checkbox"
                                    checked={presenceConfirmed}
                                    onChange={(e) => setPresenceConfirmed(e.target.checked)}
                                />
                                <span>Patient is physically present with me now</span>
                            </label>
                            <label className={styles.confirmCheck}>
                                <input
                                    type="checkbox"
                                    checked={roleUnderstood}
                                    onChange={(e) => setRoleUnderstood(e.target.checked)}
                                />
                                <span>I understand I am a facilitator only, not a medical provider</span>
                            </label>
                        </div>

                        <div className={styles.formFields}>
                            <div className={styles.formField}>
                                <label>Patient ID (if registered)</label>
                                <input
                                    type="text"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    placeholder="Enter patient ID or phone"
                                />
                            </div>
                            <div className={styles.formDivider}>
                                <span>or</span>
                            </div>
                            <div className={styles.formField}>
                                <label>Patient Name (for new/temp patient)</label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    placeholder="Enter patient name"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label>Preferred Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="ta">Tamil</option>
                                    <option value="te">Telugu</option>
                                    <option value="kn">Kannada</option>
                                    <option value="ml">Malayalam</option>
                                    <option value="mr">Marathi</option>
                                    <option value="bn">Bengali</option>
                                    <option value="gu">Gujarati</option>
                                    <option value="pa">Punjabi</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => { setShowStartModal(false); resetForm(); }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.startBtn}
                                onClick={startSession}
                                disabled={!presenceConfirmed || !roleUnderstood || (!patientId.trim() && !patientName.trim())}
                            >
                                Start Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* End Session Confirm Modal */}
            {showEndConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>End Session?</h2>
                        <p className={styles.endWarning}>
                            This will immediately revoke all access to patient actions.
                            Any unsaved work will be lost.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowEndConfirm(false)}
                            >
                                Continue Session
                            </button>
                            <button
                                className={styles.endBtn}
                                onClick={endSession}
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className={styles.footer}>
                <p>Health Worker Portal • Facilitator Access Only • All actions are logged</p>
            </footer>
        </div>
    );
}
