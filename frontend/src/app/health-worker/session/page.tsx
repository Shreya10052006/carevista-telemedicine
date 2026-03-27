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

// Locale map for Speech Synthesis
const LOCALE_MAP: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
};

// Consent text by language (keyed by translation keys)
const CONSENT_TEXT_KEYS = {
    para1_en: "Your health information will be shared with the doctor to help them understand your condition and provide treatment. This includes symptoms you've described and any documents you've uploaded.",
    para2_en: "You can withdraw your consent at any time. The doctor and health worker cannot access your information after the consultation ends without your permission.",
    para3_en: 'Do you understand and agree to share your health information?"',
};

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

    // Read Aloud state
    const [isReadingAloud, setIsReadingAloud] = useState(false);

    // Voice Consent Recording state
    const [isRecordingConsent, setIsRecordingConsent] = useState(false);
    const [consentAudioBlob, setConsentAudioBlob] = useState<Blob | null>(null);
    const [consentAudioUrl, setConsentAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            // Cleanup speech synthesis on unmount
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            // Cleanup audio URL
            if (consentAudioUrl) {
                URL.revokeObjectURL(consentAudioUrl);
            }
        };
    }, []);

    // Cancel speech when language changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsReadingAloud(false);
        }
    }, [uiLanguage]);

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
        setErrorMessage(t('Session expired. All access has been revoked.'));
    };

    const startSession = () => {
        if (!presenceConfirmed || !roleUnderstood) {
            setErrorMessage(t('Please confirm all requirements before starting.'));
            return;
        }

        if (!patientId.trim() && !patientName.trim()) {
            setErrorMessage(t('Please enter Patient ID or Name.'));
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
        setSuccessMessage(t('Session started. Patient must remain present for all actions.'));
        resetForm();
    };

    const endSession = () => {
        setSession(null);
        setActiveScreen('dashboard');
        setShowEndConfirm(false);
        setSuccessMessage(t('Session ended. All access has been revoked.'));
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
        // Reset voice consent
        setConsentAudioBlob(null);
        if (consentAudioUrl) {
            URL.revokeObjectURL(consentAudioUrl);
            setConsentAudioUrl(null);
        }
    };

    const handleSaveSymptoms = () => {
        if (!symptomText.trim()) return;
        // In production, this would call the API
        setSuccessMessage(t('Symptoms saved to patient logbook.'));
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
                    setSuccessMessage(t('Document uploaded successfully.'));
                    return 100;
                }
                return prev + 20;
            });
        }, 300);
    };

    const handleInitiateConsultation = () => {
        setWaitingForDoctor(true);
        const type = consultationType === 'video' ? t('Video') : t('Audio');
        setSuccessMessage(`${type} ${t('consultation initiated. Waiting for doctor...')}`);
    };

    const clearMessages = () => {
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    // ==================== Read Aloud ====================
    const getConsentFullText = (): string => {
        const p1 = t('consent_para_1');
        const p2 = t('consent_para_2');
        const p3 = t('consent_para_3');
        // If translations return the keys themselves (English), use the original text
        const para1 = p1 === 'consent_para_1'
            ? CONSENT_TEXT_KEYS.para1_en
            : p1;
        const para2 = p2 === 'consent_para_2'
            ? CONSENT_TEXT_KEYS.para2_en
            : p2;
        const para3 = p3 === 'consent_para_3'
            ? CONSENT_TEXT_KEYS.para3_en
            : p3;
        return `${para1} ${para2} ${para3}`;
    };

    const handleReadAloud = () => {
        if (!window.speechSynthesis) return;

        if (isReadingAloud) {
            window.speechSynthesis.cancel();
            setIsReadingAloud(false);
            return;
        }

        const text = getConsentFullText();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LOCALE_MAP[uiLanguage] || 'en-IN';
        utterance.rate = 0.9;
        utterance.onend = () => setIsReadingAloud(false);
        utterance.onerror = () => setIsReadingAloud(false);

        window.speechSynthesis.cancel(); // Clear any pending
        window.speechSynthesis.speak(utterance);
        setIsReadingAloud(true);
    };

    // ==================== Voice Consent Recording ====================
    const startConsentRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setConsentAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setConsentAudioUrl(url);
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecordingConsent(true);
        } catch {
            setErrorMessage('Microphone access denied. Please allow microphone access.');
        }
    };

    const stopConsentRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecordingConsent(false);
    };

    const resetConsentRecording = () => {
        if (consentAudioUrl) {
            URL.revokeObjectURL(consentAudioUrl);
        }
        setConsentAudioBlob(null);
        setConsentAudioUrl(null);
    };

    // Render functions
    const renderDashboard = () => (
        <div className={styles.dashboard}>
            {/* Left Column - Action Cards */}
            <div className={styles.leftColumn}>
                <h2 className={styles.columnTitle}>{t('Allowed Actions')}</h2>
                <p className={styles.columnSubtitle}>{t('Patient must be present for all actions')}</p>

                <div className={styles.actionCards}>
                    {/* Assisted Symptom Logging */}
                    <button
                        className={styles.actionCard}
                        onClick={() => setActiveScreen('symptoms')}
                        disabled={!session}
                    >
                        <div className={styles.actionIcon}>📝</div>
                        <div className={styles.actionContent}>
                            <h3>{t('Assisted Symptom Logging')}</h3>
                            <p>{t('Record symptoms as patient describes them')}</p>
                            <span className={styles.actionNote}>{t('Voice-first • Multi-language')}</span>
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
                            <h3>{t('Document Upload')}</h3>
                            <p>{t('Upload medical reports and prescriptions')}</p>
                            <span className={styles.actionNote}>{t('Camera • File upload')}</span>
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
                            <h3>{t('Consent Explanation')}</h3>
                            <p>{t('Explain consent and help patient confirm')}</p>
                            <span className={styles.actionNote}>{t('Read-aloud • Patient confirms')}</span>
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
                            <h3>{t('Initiate Consultation')}</h3>
                            <p>{t('Start audio or video call with doctor')}</p>
                            <span className={styles.actionNote}>{t('Audio • Video options')}</span>
                        </div>
                        <div className={styles.actionArrow}>→</div>
                    </button>
                </div>

                {!session && (
                    <div className={styles.noSessionOverlay}>
                        <div className={styles.noSessionContent}>
                            <span className={styles.lockIcon}>🔒</span>
                            <p>{t('Start a session to enable actions')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column - Restrictions & Rules */}
            <div className={styles.rightColumn}>
                {/* Restrictions Panel - ALWAYS VISIBLE */}
                <div className={styles.restrictionsPanel}>
                    <h3 className={styles.restrictionsTitle}>{t('🔒 You CANNOT Do These')}</h3>
                    <ul className={styles.restrictionsList}>
                        <li><span className={styles.restrictIcon}>🔒</span> {t('View AI intake summaries')}</li>
                        <li><span className={styles.restrictIcon}>🔒</span> {t('View triage priority')}</li>
                        <li><span className={styles.restrictIcon}>🔒</span> {t('View doctor notes')}</li>
                        <li><span className={styles.restrictIcon}>🔒</span> {t('View prescriptions')}</li>
                        <li><span className={styles.restrictIcon}>🔒</span> {t('Access patient data after session')}</li>
                        <li><span className={styles.restrictIcon}>🔒</span> {t('Provide medical advice')}</li>
                    </ul>
                    <p className={styles.restrictionsNote}>
                        🛡️ {t('These restrictions protect patient privacy and ensure clinical decisions remain with qualified doctors.')}
                    </p>
                </div>

                {/* Session Rules Panel */}
                <div className={styles.rulesPanel}>
                    <h3 className={styles.rulesTitle}>{t('📋 Session Rules')}</h3>
                    <ul className={styles.rulesList}>
                        <li><span className={styles.ruleIcon}>⏱️</span> {t('Sessions are time-limited (30 min)')}</li>
                        <li><span className={styles.ruleIcon}>👤</span> {t('Patient presence is mandatory')}</li>
                        <li><span className={styles.ruleIcon}>📊</span> {t('All actions are logged')}</li>
                        <li><span className={styles.ruleIcon}>🏷️</span> {t('All uploads are patient-tagged')}</li>
                        <li><span className={styles.ruleIcon}>🔐</span> {t('Access revoked when session ends')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderSymptomsScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                {t('← Back to Dashboard')}
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>📝</span>
                    <h2>{t('Assisted Symptom Logging')}</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    {t('You are recording what the patient says. Do not interpret or diagnose.')}
                </div>

                <div className={styles.languageSelector}>
                    <label>{t("Patient's Language:")}</label>
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
                    <p className={styles.micHint}>{t('Tap to use voice input')}</p>
                </div>

                <div className={styles.textInputArea}>
                    <label>{t('Or type symptoms as patient describes:')}</label>
                    <textarea
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                        placeholder={uiLanguage === 'en' ? "Patient says: 'I have had a headache for 3 days...'" : uiLanguage === 'hi' ? "मरीज कहता है: 'मुझे 3 दिनों से सिरदर्द है...'" : "நோயாளி சொல்கிறார்: 'எனக்கு 3 நாட்களாக தலைவலி...'"}
                        rows={6}
                    />
                </div>

                <button
                    className={styles.primaryButton}
                    onClick={handleSaveSymptoms}
                    disabled={!symptomText.trim()}
                >
                    {t('Save to Patient Logbook')}
                </button>

                <p className={styles.screenNote}>
                    ℹ️ {t("Symptoms are saved directly to patient's logbook. You will NOT see previous entries.")}
                </p>
            </div>
        </div>
    );

    const renderUploadScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                {t('← Back to Dashboard')}
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>📄</span>
                    <h2>{t('Document Upload')}</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    {t('Upload documents for the patient. You will NOT see document contents or history.')}
                </div>

                <div className={styles.uploadArea}>
                    {uploadProgress === null && !uploadSuccess ? (
                        <>
                            <div className={styles.uploadButtons}>
                                <label className={styles.uploadButton}>
                                    <span>📷</span>
                                    <span>{t('Camera')}</span>
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
                                    <span>{t('Choose File')}</span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleFileUpload}
                                        hidden
                                    />
                                </label>
                            </div>
                            <p className={styles.uploadHint}>
                                {t('Supported: Images, PDF documents')}
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
                            <p>{t('Uploading...')} {uploadProgress}%</p>
                        </div>
                    ) : (
                        <div className={styles.uploadComplete}>
                            <span className={styles.checkmark}>✓</span>
                            <p>{t('Document uploaded successfully')}</p>
                            <button
                                className={styles.secondaryButton}
                                onClick={() => { setUploadProgress(null); setUploadSuccess(false); }}
                            >
                                {t('Upload Another')}
                            </button>
                        </div>
                    )}
                </div>

                <p className={styles.screenNote}>
                    ℹ️ {t('Documents are tagged to patient and require their consent before doctor can view.')}
                </p>
            </div>
        </div>
    );

    const renderConsentScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                {t('← Back to Dashboard')}
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>✓</span>
                    <h2>{t('Consent Explanation')}</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    {t('Your role: Explain consent clearly. The PATIENT must confirm, not you.')}
                </div>

                <div className={styles.consentText}>
                    <h4>{t('Read Aloud to Patient:')}</h4>
                    <div className={styles.consentBox}>
                        <p>
                            {uiLanguage === 'en'
                                ? `"${CONSENT_TEXT_KEYS.para1_en}`
                                : t('consent_para_1')}
                        </p>
                        <p>
                            {uiLanguage === 'en'
                                ? CONSENT_TEXT_KEYS.para2_en
                                : t('consent_para_2')}
                        </p>
                        <p>
                            {uiLanguage === 'en'
                                ? CONSENT_TEXT_KEYS.para3_en
                                : t('consent_para_3')}
                        </p>
                    </div>
                    <button
                        className={styles.readAloudBtn}
                        onClick={handleReadAloud}
                    >
                        {isReadingAloud ? t('⏹ Stop Reading') : t('🔊 Read Aloud')}
                    </button>
                </div>

                <div className={styles.consentConfirmation}>
                    <label className={styles.consentCheck}>
                        <input
                            type="checkbox"
                            checked={consentExplained}
                            onChange={(e) => setConsentExplained(e.target.checked)}
                        />
                        <span>{t('I have explained consent to the patient')}</span>
                    </label>

                    <label className={`${styles.consentCheck} ${styles.patientCheck}`}>
                        <input
                            type="checkbox"
                            checked={patientConfirmedConsent}
                            onChange={(e) => setPatientConfirmedConsent(e.target.checked)}
                            disabled={!consentExplained}
                        />
                        <span>{t('PATIENT has confirmed they understand and consent')}</span>
                    </label>
                </div>

                {/* Voice Consent Recording */}
                <div className={styles.voiceConsentArea}>
                    <p className={styles.voiceConsentLabel}>
                        {t('Optional: Patient can give verbal consent via recording')}
                    </p>
                    {!consentAudioUrl ? (
                        <button
                            className={`${styles.voiceConsentBtn} ${isRecordingConsent ? styles.recording : ''}`}
                            onClick={isRecordingConsent ? stopConsentRecording : startConsentRecording}
                        >
                            {isRecordingConsent ? t('⏹ Stop Recording') : t('🎤 Record Patient Consent')}
                        </button>
                    ) : (
                        <div className={styles.voiceConsentPlayback}>
                            <p className={styles.voiceConsentStatus}>{t('Patient voice consent recorded')}</p>
                            <audio controls src={consentAudioUrl} className={styles.audioPlayer} />
                            <div className={styles.voiceConsentActions}>
                                <button
                                    className={styles.secondaryButton}
                                    onClick={resetConsentRecording}
                                >
                                    {t('🔄 Re-record')}
                                </button>
                            </div>
                            <p className={styles.voiceConsentAttached}>
                                {t('✅ Voice consent attached to session')}
                            </p>
                        </div>
                    )}
                </div>

                <button
                    className={styles.primaryButton}
                    disabled={!consentExplained || !patientConfirmedConsent}
                    onClick={() => {
                        setSuccessMessage(t('Patient consent recorded. Proceeding to consultation...'));
                        setTimeout(() => setActiveScreen('consult'), 1500);
                    }}
                >
                    {t('Record Consent & Proceed to Consultation')}
                </button>

                <p className={styles.screenNote}>
                    ℹ️ {t('Patient can revoke consent at any time through their own app.')}
                </p>
            </div>
        </div>
    );

    const renderConsultScreen = () => (
        <div className={styles.actionScreen}>
            <button className={styles.backButton} onClick={() => setActiveScreen('dashboard')}>
                {t('← Back to Dashboard')}
            </button>

            <div className={styles.screenCard}>
                <div className={styles.screenHeader}>
                    <span className={styles.screenIcon}>📞</span>
                    <h2>{t('Initiate Consultation')}</h2>
                </div>

                <div className={styles.roleReminder}>
                    <span>⚕️</span>
                    {t('You initiate the call. Leave if patient requests privacy during consultation.')}
                </div>

                {!waitingForDoctor ? (
                    <>
                        <div className={styles.consultOptions}>
                            <button
                                className={`${styles.consultOption} ${consultationType === 'audio' ? styles.selected : ''}`}
                                onClick={() => setConsultationType('audio')}
                            >
                                <span>📞</span>
                                <span>{t('Audio Call')}</span>
                            </button>
                            <button
                                className={`${styles.consultOption} ${consultationType === 'video' ? styles.selected : ''}`}
                                onClick={() => setConsultationType('video')}
                            >
                                <span>📹</span>
                                <span>{t('Video Call')}</span>
                            </button>
                        </div>

                        <button
                            className={styles.primaryButton}
                            onClick={handleInitiateConsultation}
                        >
                            {t('Start Consultation')}
                        </button>
                    </>
                ) : (
                    <div className={styles.waitingState}>
                        <div className={styles.waitingSpinner}></div>
                        <h3>{t('Waiting for Doctor...')}</h3>
                        <p>{t('The patient is in queue. A doctor will join shortly.')}</p>
                        <button
                            className={styles.cancelButton}
                            onClick={() => setWaitingForDoctor(false)}
                        >
                            {t('Cancel')}
                        </button>
                    </div>
                )}

                <p className={styles.screenNote}>
                    ℹ️ {t('Do not speak on behalf of doctor or interpret their advice.')}
                </p>
            </div>
        </div>
    );

    if (!mounted) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>{t('Loading Health Worker Portal...')}</p>
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
                        <span className={styles.logoText}>{t('CareVista')}</span>
                    </div>
                    <div className={styles.headerDivider}></div>
                    <h1 className={styles.portalTitle}>{t('Health Worker Portal')}</h1>
                    <span className={styles.facilitatorBadge}>{t('Facilitator Only')}</span>
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
                        <span className={styles.demoBadge}>🧪 {t('Demo Mode')}</span>
                    )}
                    {session ? (
                        <div className={styles.sessionIndicator}>
                            <span className={styles.sessionActive}>{t('Active Session')}</span>
                            <span className={styles.sessionTimer}>⏱️ {session.remainingMinutes} {t('min')}</span>
                        </div>
                    ) : (
                        <span className={styles.sessionInactive}>{t('No Active Session')}</span>
                    )}
                    <button className={styles.signOutBtn} onClick={() => router.push('/auth/health-worker')}>{t('Sign Out')}</button>
                </div>
            </header>

            {/* Session Banner */}
            {session && (
                <div className={styles.sessionBanner}>
                    <div className={styles.sessionInfo}>
                        <span className={styles.sessionLabel}>{t('Active Session:')}</span>
                        <span className={styles.sessionPatient}>{t('Patient ID:')} {session.patientId.slice(0, 12)}...</span>
                        <span className={styles.sessionLang}>{t('Preferred Language')}: {session.language.toUpperCase()}</span>
                    </div>
                    <div className={styles.sessionActions}>
                        <span className={styles.timerLarge}>⏱️ {session.remainingMinutes} {t('min remaining')}</span>
                        <button
                            className={styles.endSessionBtn}
                            onClick={() => setShowEndConfirm(true)}
                        >
                            {t('End Session')}
                        </button>
                    </div>
                </div>
            )}

            {/* Role Disclaimer - Always Visible */}
            <div className={styles.roleDisclaimer}>
                <span className={styles.disclaimerIcon}>⚠️</span>
                <span><strong>{t('This is an Assisted Session.')}</strong> {t('The patient must be present. You are a facilitator only — no medical decisions, no patient data access outside session.')}</span>
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
                        {t('Start Assisted Session')}
                    </button>
                </div>
            )}

            {/* Start Session Modal */}
            {showStartModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>{t('Start Assisted Session')}</h2>

                        <div className={styles.confirmChecks}>
                            <label className={styles.confirmCheck}>
                                <input
                                    type="checkbox"
                                    checked={presenceConfirmed}
                                    onChange={(e) => setPresenceConfirmed(e.target.checked)}
                                />
                                <span>{t('Patient is physically present with me now')}</span>
                            </label>
                            <label className={styles.confirmCheck}>
                                <input
                                    type="checkbox"
                                    checked={roleUnderstood}
                                    onChange={(e) => setRoleUnderstood(e.target.checked)}
                                />
                                <span>{t('I understand I am a facilitator only, not a medical provider')}</span>
                            </label>
                        </div>

                        <div className={styles.formFields}>
                            <div className={styles.formField}>
                                <label>{t('Patient ID (if registered)')}</label>
                                <input
                                    type="text"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    placeholder={t('Enter patient ID or phone')}
                                />
                            </div>
                            <div className={styles.formDivider}>
                                <span>{t('or')}</span>
                            </div>
                            <div className={styles.formField}>
                                <label>{t('Patient Name (for new/temp patient)')}</label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    placeholder={t('Enter patient name')}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label>{t('Preferred Language')}</label>
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
                                {t('Cancel')}
                            </button>
                            <button
                                className={styles.startBtn}
                                onClick={startSession}
                                disabled={!presenceConfirmed || !roleUnderstood || (!patientId.trim() && !patientName.trim())}
                            >
                                {t('Start Session')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* End Session Confirm Modal */}
            {showEndConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>{t('End Session?')}</h2>
                        <p className={styles.endWarning}>
                            {t('This will immediately revoke all access to patient actions. Any unsaved work will be lost.')}
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowEndConfirm(false)}
                            >
                                {t('Continue Session')}
                            </button>
                            <button
                                className={styles.endBtn}
                                onClick={endSession}
                            >
                                {t('End Session')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className={styles.footer}>
                <p>{t('Health Worker Portal • Facilitator Access Only • All actions are logged')}</p>
            </footer>
        </div>
    );
}
