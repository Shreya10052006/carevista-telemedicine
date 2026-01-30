'use client';

/**
 * Guided Health Intake - Hospital-Grade Finite Wizard
 * ====================================================
 * A FINITE, state-driven medical intake assistant (max 5 questions).
 * 
 * IMPORTANT DESIGN RULES:
 * ✓ Strictly limited to intake — NOT medical advice
 * ✓ Max 5 questions per session
 * ✓ Neutral, clinical language only
 * ✓ Permanent disclaimer always visible
 * ✓ Summary-first completion view
 * ✓ No conversational/chatty elements
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/common/TopBar';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { classifySymptoms, structureIntake, translateText } from '@/lib/llmService';
import { DEMO_MODE } from '@/lib/demoData';
import { createLogbookEntry } from '@/lib/demoSessionStore';
import styles from './page.module.css';

// ==================== SYMPTOM CATEGORIES ====================

type SymptomCategory = 'pain' | 'fever' | 'gastrointestinal' | 'respiratory' | 'skin' | 'menstrual' | 'general';

interface CategoryQuestions {
    category: SymptomCategory;
    questions: {
        en: string;
        ta: string;
        hi: string;
    }[];
}

// Max 4 questions per category (+ 1 final = 5 total)
const SYMPTOM_QUESTIONS: CategoryQuestions[] = [
    {
        category: 'pain',
        questions: [
            { en: 'Where exactly is the pain located?', ta: 'வலி சரியாக எங்கே உள்ளது?', hi: 'दर्द ठीक कहाँ है?' },
            { en: 'How would you describe the pain (sharp, dull, throbbing)?', ta: 'வலியை எப்படி விவரிப்பீர்கள்?', hi: 'आप दर्द का वर्णन कैसे करेंगे?' },
            { en: 'On a scale of 1 to 10, how severe is the pain?', ta: '1 முதல் 10 வரை, வலி எவ்வளவு தீவிரம்?', hi: '1 से 10 के पैमाने पर दर्द कितना है?' },
            { en: 'When did this pain start?', ta: 'இந்த வலி எப்போது தொடங்கியது?', hi: 'यह दर्द कब शुरू हुआ?' },
        ],
    },
    {
        category: 'fever',
        questions: [
            { en: 'Have you measured your temperature? If so, what was it?', ta: 'உடல் வெப்பநிலை அளந்தீர்களா?', hi: 'क्या आपने तापमान मापा?' },
            { en: 'Do you have any chills or sweating?', ta: 'குளிர் நடுக்கம் அல்லது வியர்வை இருக்கிறதா?', hi: 'क्या ठंड या पसीना आ रहा है?' },
            { en: 'When did the fever start?', ta: 'காய்ச்சல் எப்போது தொடங்கியது?', hi: 'बुखार कब शुरू हुआ?' },
            { en: 'Are you experiencing any body aches?', ta: 'உடல் வலி இருக்கிறதா?', hi: 'क्या शरीर में दर्द है?' },
        ],
    },
    {
        category: 'gastrointestinal',
        questions: [
            { en: 'Are you experiencing nausea or vomiting?', ta: 'குமட்டல் அல்லது வாந்தி இருக்கிறதா?', hi: 'क्या मतली या उल्टी हो रही है?' },
            { en: 'Have you noticed any changes in bowel movements?', ta: 'மலம் கழிப்பதில் மாற்றங்கள் இருக்கிறதா?', hi: 'क्या मल त्याग में बदलाव है?' },
            { en: 'When did you last eat, and how is your appetite?', ta: 'கடைசியாக எப்போது சாப்பிட்டீர்கள்?', hi: 'आपने आखिरी बार कब खाया?' },
            { en: 'Is the discomfort constant or does it come and go?', ta: 'அசெளகரியம் தொடர்ச்சியானதா?', hi: 'क्या तकलीफ लगातार है?' },
        ],
    },
    {
        category: 'respiratory',
        questions: [
            { en: 'Is your cough dry or producing mucus?', ta: 'இருமல் வறண்டதா அல்லது சளி வருகிறதா?', hi: 'क्या खांसी सूखी है या बलगम है?' },
            { en: 'Are you having any difficulty breathing?', ta: 'சுவாசிப்பதில் சிரமம் இருக்கிறதா?', hi: 'क्या सांस लेने में दिक्कत है?' },
            { en: 'Do you have a sore throat or nasal congestion?', ta: 'தொண்டை வலி அல்லது மூக்கடைப்பு?', hi: 'क्या गले में खराश या नाक बंद है?' },
            { en: 'When did these symptoms begin?', ta: 'இந்த அறிகுறிகள் எப்போது தொடங்கின?', hi: 'ये लक्षण कब शुरू हुए?' },
        ],
    },
    {
        category: 'skin',
        questions: [
            { en: 'Where on your body is this appearing?', ta: 'இது உடலில் எங்கே தோன்றுகிறது?', hi: 'यह शरीर के किस हिस्से पर है?' },
            { en: 'Is there any itching or pain?', ta: 'அரிப்பு அல்லது வலி இருக்கிறதா?', hi: 'क्या खुजली या दर्द है?' },
            { en: 'Have you been exposed to anything new recently?', ta: 'சமீபத்தில் புதிதாக எதற்காவது ஆளானீர்களா?', hi: 'क्या हाल ही में कुछ नए के संपर्क में आए?' },
        ],
    },
    {
        category: 'menstrual',
        questions: [
            { en: 'Is this related to your regular cycle?', ta: 'இது வழக்கமான சுழற்சியுடன் தொடர்புடையதா?', hi: 'क्या यह नियमित चक्र से संबंधित है?' },
            { en: 'Is the flow heavier or lighter than normal?', ta: 'இயல்பை விட அதிக அல்லது குறைவான உதிரப்போக்கா?', hi: 'क्या सामान्य से ज्यादा या कम रक्तस्राव है?' },
            { en: 'Is there significant pain or discomfort?', ta: 'குறிப்பிடத்தக்க வலி இருக்கிறதா?', hi: 'क्या महत्वपूर्ण दर्द है?' },
        ],
    },
    {
        category: 'general',
        questions: [
            { en: 'How long have you been experiencing this?', ta: 'எவ்வளவு காலமாக இதை அனுபவிக்கிறீர்கள்?', hi: 'आप इसे कितने समय से अनुभव कर रहे हैं?' },
            { en: 'Is this affecting your daily activities?', ta: 'இது தினசரி நடவடிக்கைகளை பாதிக்கிறதா?', hi: 'क्या यह दैनिक गतिविधियों को प्रभावित करता है?' },
            { en: 'Have you taken any medication for this?', ta: 'இதற்கு ஏதேனும் மருந்து எடுத்தீர்களா?', hi: 'क्या इसके लिए कोई दवा ली?' },
        ],
    },
];

// UI Text translations
const UI_TEXT = {
    title: { en: 'Guided Health Intake', ta: 'வழிகாட்டப்பட்ட உடல்நல தகவல்', hi: 'मार्गदर्शित स्वास्थ्य जानकारी' },
    subtitle: { en: 'Answer a few questions to record your symptoms', ta: 'உங்கள் அறிகுறிகளை பதிவு செய்ய சில கேள்விகளுக்கு பதிலளிக்கவும்', hi: 'अपने लक्षण दर्ज करने के लिए कुछ सवालों का जवाब दें' },
    initialPrompt: {
        en: "Please describe your main health concern. I will ask a few follow-up questions to record the information for your doctor.\n\nWhat problem are you experiencing?",
        ta: "உங்கள் முக்கிய உடல்நலக் கவலையை விவரிக்கவும். உங்கள் மருத்துவருக்கான தகவலை பதிவு செய்ய சில தொடர் கேள்விகள் கேட்பேன்.\n\nநீங்கள் என்ன பிரச்சனையை அனுபவிக்கிறீர்கள்?",
        hi: "कृपया अपनी मुख्य स्वास्थ्य समस्या बताएं। मैं आपके डॉक्टर के लिए जानकारी दर्ज करने के लिए कुछ अनुवर्ती प्रश्न पूछूंगा।\n\nआप किस समस्या का अनुभव कर रहे हैं?"
    },
    finalQuestion: {
        en: 'Is there anything else you want to add?',
        ta: 'வேறு ஏதாவது சேர்க்க விரும்புகிறீர்களா?',
        hi: 'क्या आप कुछ और जोड़ना चाहते हैं?'
    },
    complete: {
        en: "Information recorded. Please review the summary below.",
        ta: "தகவல் பதிவு செய்யப்பட்டது. கீழே உள்ள சுருக்கத்தை மதிப்பாய்வு செய்யவும்.",
        hi: "जानकारी दर्ज की गई। कृपया नीचे दिए गए सारांश की समीक्षा करें।"
    },
    disclaimer: {
        en: 'This is intake only — not medical advice or diagnosis.',
        ta: 'இது தகவல் சேகரிப்பு மட்டுமே — மருத்துவ ஆலோசனை அல்ல.',
        hi: 'यह सिर्फ जानकारी संग्रह है — चिकित्सा सलाह नहीं।'
    },
    send: { en: 'Next', ta: 'அடுத்து', hi: 'अगला' },
    saveButton: { en: 'Save to Logbook', ta: 'பதிவேட்டில் சேமி', hi: 'लॉगबुक में सेव करें' },
    consultButton: { en: 'Consult Doctor →', ta: 'மருத்துவரை அணுகு →', hi: 'डॉक्टर से परामर्श →' },
    placeholder: {
        initial: { en: 'Describe your main concern...', ta: 'உங்கள் முக்கிய கவலையை விவரிக்கவும்...', hi: 'अपनी मुख्य समस्या बताएं...' },
        answer: { en: 'Type your answer...', ta: 'உங்கள் பதிலை தட்டச்சு செய்யவும்...', hi: 'अपना जवाब टाइप करें...' },
    },
    maxQuestions: { en: 'Maximum 5 questions', ta: 'அதிகபட்சம் 5 கேள்விகள்', hi: 'अधिकतम 5 प्रश्न' },
};

type IntakeStage = 'initial' | 'classifying' | 'asking' | 'final' | 'structuring' | 'complete';

interface IntakeState {
    stage: IntakeStage;
    category: SymptomCategory | null;
    currentQuestionIndex: number;
    responses: { question: string; answer: string }[];
    initialSymptom: string;
    structuredData: Record<string, unknown> | null;
}

// ==================== COMPONENT ====================

export default function GuidedIntakePage() {
    const { language } = useLanguage();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<IntakeState>({
        stage: 'initial',
        category: null,
        currentQuestionIndex: 0,
        responses: [],
        initialSymptom: '',
        structuredData: null,
    });
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'assistant' | 'user'; text: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [saved, setSaved] = useState(false);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Initialize with greeting
    useEffect(() => {
        setChatHistory([{ role: 'assistant', text: UI_TEXT.initialPrompt[language] }]);
    }, [language]);

    // Get questions for category (max 4)
    const getQuestionsForCategory = useCallback((cat: SymptomCategory) => {
        const found = SYMPTOM_QUESTIONS.find((c) => c.category === cat);
        const questions = found ? found.questions : SYMPTOM_QUESTIONS[SYMPTOM_QUESTIONS.length - 1].questions;
        return questions.slice(0, 4); // Enforce max 4 follow-up questions
    }, []);

    // Check if user wants to end
    const isEndResponse = useCallback((text: string): boolean => {
        const endWords = ['no', 'nothing', 'done', "that's all", 'nope', 'none', 'no more',
            'இல்லை', 'முடிந்தது', 'வேண்டாம்',
            'नहीं', 'कुछ नहीं', 'हो गया', 'बस'
        ];
        return endWords.some((w) => text.toLowerCase().trim().includes(w.toLowerCase()));
    }, []);

    // Handle user response
    const handleSubmit = useCallback(async () => {
        if (!input.trim() || isProcessing) return;

        const userText = input.trim();
        setInput('');
        setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);

        // Translate to English if needed
        let englishText = userText;
        if (language !== 'en') {
            try {
                const translated = await translateText(userText, language, 'en');
                englishText = translated.translated_text;
            } catch (e) {
                console.error('[Translation] Failed:', e);
            }
        }

        if (state.stage === 'initial') {
            setIsProcessing(true);
            setState((s) => ({ ...s, stage: 'classifying' }));

            try {
                const result = await classifySymptoms(englishText);
                const category = result.symptom_category as SymptomCategory;
                const questions = getQuestionsForCategory(category);

                setState({
                    stage: 'asking',
                    category,
                    currentQuestionIndex: 0,
                    responses: [],
                    initialSymptom: englishText,
                    structuredData: null,
                });

                setTimeout(() => {
                    setChatHistory((prev) => [...prev, { role: 'assistant', text: questions[0][language] }]);
                    setIsProcessing(false);
                }, 400);

            } catch (e) {
                console.error('[Classification] Error:', e);
                const questions = getQuestionsForCategory('general');
                setState({
                    stage: 'asking',
                    category: 'general',
                    currentQuestionIndex: 0,
                    responses: [],
                    initialSymptom: englishText,
                    structuredData: null,
                });
                setTimeout(() => {
                    setChatHistory((prev) => [...prev, { role: 'assistant', text: questions[0][language] }]);
                    setIsProcessing(false);
                }, 400);
            }

        } else if (state.stage === 'asking') {
            const questions = getQuestionsForCategory(state.category!);
            const currentQ = questions[state.currentQuestionIndex];
            const newResponses = [...state.responses, { question: currentQ.en, answer: englishText }];
            const nextIndex = state.currentQuestionIndex + 1;

            if (nextIndex >= questions.length) {
                setState({ ...state, stage: 'final', responses: newResponses });
                setTimeout(() => {
                    setChatHistory((prev) => [
                        ...prev,
                        { role: 'assistant', text: UI_TEXT.finalQuestion[language] },
                    ]);
                }, 400);
            } else {
                setState({ ...state, currentQuestionIndex: nextIndex, responses: newResponses });
                setTimeout(() => {
                    setChatHistory((prev) => [...prev, { role: 'assistant', text: questions[nextIndex][language] }]);
                }, 400);
            }

        } else if (state.stage === 'final') {
            setIsProcessing(true);

            const newResponses = isEndResponse(englishText)
                ? state.responses
                : [...state.responses, { question: 'Additional notes', answer: englishText }];

            setState((s) => ({ ...s, stage: 'structuring' }));

            try {
                const structured = await structureIntake(state.initialSymptom, newResponses);
                setState({
                    ...state,
                    stage: 'complete',
                    responses: newResponses,
                    structuredData: structured as unknown as Record<string, unknown>,
                });
            } catch (e) {
                console.error('[Structuring] Failed:', e);
                setState({
                    ...state,
                    stage: 'complete',
                    responses: newResponses,
                    structuredData: {
                        chief_complaint: state.initialSymptom,
                        responses: newResponses,
                    },
                });
            }

            setTimeout(() => {
                setChatHistory((prev) => [
                    ...prev,
                    { role: 'assistant', text: UI_TEXT.complete[language] },
                ]);
                setIsProcessing(false);
            }, 400);
        }
    }, [input, state, language, isProcessing, getQuestionsForCategory, isEndResponse]);

    // Save to logbook
    const handleSaveToLogbook = async () => {
        const userId = localStorage.getItem('demo_user_id') || 'unknown-user';
        const summaryData = state.structuredData as any;

        if (DEMO_MODE) {
            createLogbookEntry(
                userId,
                'chatbot',
                state.initialSymptom,
                {
                    chiefComplaint: summaryData?.chief_complaint || state.initialSymptom,
                    severity: summaryData?.severity || 'To be assessed',
                    duration: summaryData?.duration,
                    additionalNotes: 'Recorded via Guided Intake',
                }
            );
        }
        setSaved(true);
    };

    // Calculate progress
    const getProgress = (): { current: number; total: number } => {
        const total = 5; // Always show out of 5
        if (state.stage === 'initial' || state.stage === 'classifying') return { current: 1, total };
        if (state.stage === 'complete' || state.stage === 'structuring') return { current: 5, total };

        const current = state.currentQuestionIndex + 2; // +1 for initial, +1 for 0-index
        return { current: Math.min(current, total), total };
    };

    const progress = getProgress();
    const isInputDisabled = state.stage === 'complete' || state.stage === 'classifying' || state.stage === 'structuring' || isProcessing;

    return (
        <div className={styles.page}>
            <TopBar role="patient" />

            {/* Demo Badge */}
            {DEMO_MODE && (
                <div className={styles.demoBadge}>
                    <span className={styles.demoDot}></span>
                    Demo Mode
                </div>
            )}

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/patient/dashboard" className={styles.backLink}>← Back</Link>
                    <h1 className={styles.title}>💬 {UI_TEXT.title[language]}</h1>
                    <p className={styles.subtitle}>{UI_TEXT.subtitle[language]}</p>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>
                            {state.stage === 'complete' ? '✓ Complete' :
                                state.stage === 'classifying' ? 'Analyzing...' :
                                    state.stage === 'structuring' ? 'Processing...' :
                                        `Question ${progress.current} of ${progress.total}`}
                        </span>
                        <span className={styles.progressMax}>{UI_TEXT.maxQuestions[language]}</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Permanent Disclaimer */}
                <div className={styles.disclaimer}>
                    <span className={styles.disclaimerIcon}>ℹ️</span>
                    <span>{UI_TEXT.disclaimer[language]}</span>
                </div>

                {/* Chat Container */}
                <div className={styles.chatContainer}>
                    {chatHistory.map((msg, i) => (
                        <div
                            key={i}
                            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                        >
                            <div className={styles.messageContent}>{msg.text}</div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className={`${styles.message} ${styles.assistantMessage}`}>
                            <div className={styles.processingDots}>
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area or Completion */}
                {!isInputDisabled ? (
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder={state.stage === 'initial' ? UI_TEXT.placeholder.initial[language] : UI_TEXT.placeholder.answer[language]}
                            className={styles.input}
                            autoFocus
                        />
                        <button onClick={handleSubmit} className={styles.sendButton}>
                            {UI_TEXT.send[language]}
                        </button>
                    </div>
                ) : state.stage === 'complete' && (
                    <div className={styles.completionSection}>
                        {/* Summary Card */}
                        <div className={styles.summaryCard}>
                            <h3 className={styles.summaryTitle}>📋 Intake Summary</h3>
                            {state.structuredData && (
                                <>
                                    <div className={styles.summaryRow}>
                                        <span className={styles.summaryLabel}>Chief Complaint:</span>
                                        <span>{(state.structuredData as any).chief_complaint || state.initialSymptom}</span>
                                    </div>
                                    {(state.structuredData as any).duration && (
                                        <div className={styles.summaryRow}>
                                            <span className={styles.summaryLabel}>Duration:</span>
                                            <span>{(state.structuredData as any).duration}</span>
                                        </div>
                                    )}
                                    {(state.structuredData as any).severity && (
                                        <div className={styles.summaryRow}>
                                            <span className={styles.summaryLabel}>Severity:</span>
                                            <span className={styles.severityValue}>{(state.structuredData as any).severity}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className={styles.aiLabel}>
                                🤖 AI Role: Information collection only — not clinical analysis
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.actionButtons}>
                            {!saved ? (
                                <button onClick={handleSaveToLogbook} className={styles.saveButton}>
                                    ✓ {UI_TEXT.saveButton[language]}
                                </button>
                            ) : (
                                <div className={styles.savedConfirm}>
                                    ✓ Saved to Logbook
                                </div>
                            )}
                            <Link href="/patient/consult" className={styles.consultButton}>
                                {UI_TEXT.consultButton[language]}
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
