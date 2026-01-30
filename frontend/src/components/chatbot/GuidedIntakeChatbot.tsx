'use client';

/**
 * Guided Intake Chatbot
 * =====================
 * Finite, safe medical intake assistant.
 * 
 * FLOW:
 * 1. Ask primary symptom (text or voice)
 * 2. Classify into category
 * 3. Ask FIXED questions (max 3-5) from category set
 * 4. Ask "Is there anything else?"
 * 5. Generate structured summary → Save to logbook
 * 
 * ETHICAL SAFEGUARDS:
 * ✓ No diagnosis or medical advice
 * ✓ No triage or severity claims
 * ✓ No LLM-generated questions (fixed sets only)
 * ✓ Doctor is sole clinical authority
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { DEMO_MODE, LogbookEntry } from '@/lib/demoData';
import { createLogbookEntry } from '@/lib/demoSessionStore';

// ==================== TYPES ====================

type ChatStep =
    | 'welcome'
    | 'primary_symptom'
    | 'asking_questions'
    | 'final_check'
    | 'generating_summary'
    | 'done';

type SymptomCategory = 'pain' | 'digestive' | 'respiratory' | 'skin' | 'general' | 'unknown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface IntakeSummary {
    chiefComplaint: string;
    duration?: string;
    severity?: string;
    additionalNotes?: string;
    category: SymptomCategory;
    answers: { question: string; answer: string }[];
}

// ==================== FIXED QUESTION SETS ====================

interface QuestionSet {
    questions: {
        en: string;
        ta: string;
        hi: string;
    }[];
}

const QUESTION_SETS: Record<SymptomCategory, QuestionSet> = {
    pain: {
        questions: [
            { en: 'Where exactly do you feel the pain?', ta: 'வலி எங்கே உள்ளது?', hi: 'दर्द कहाँ है?' },
            { en: 'How long have you had this pain?', ta: 'இந்த வலி எவ்வளவு நாட்களாக உள்ளது?', hi: 'यह दर्द कितने दिनों से है?' },
            { en: 'Is it constant or does it come and go?', ta: 'இது தொடர்ந்து இருக்கிறதா அல்லது வந்து போகிறதா?', hi: 'क्या यह लगातार है या आता-जाता है?' },
            { en: 'Does anything make it better or worse?', ta: 'எது மேம்படுத்துகிறது அல்லது மோசமாக்குகிறது?', hi: 'क्या कुछ इसे बेहतर या बदतर बनाता है?' },
        ],
    },
    digestive: {
        questions: [
            { en: 'When did this start?', ta: 'இது எப்போது தொடங்கியது?', hi: 'यह कब शुरू हुआ?' },
            { en: 'Have you had any vomiting or nausea?', ta: 'வாந்தி அல்லது குமட்டல் இருக்கிறதா?', hi: 'क्या उल्टी या मतली हुई है?' },
            { en: 'Any changes in your appetite?', ta: 'பசியில் ஏதேனும் மாற்றம் உள்ளதா?', hi: 'भूख में कोई बदलाव?' },
            { en: 'Any changes in bowel movements?', ta: 'மலம் கழிப்பதில் ஏதேனும் மாற்றம்?', hi: 'मल त्याग में कोई बदलाव?' },
        ],
    },
    respiratory: {
        questions: [
            { en: 'Do you have difficulty breathing?', ta: 'சுவாசிப்பதில் சிரமம் உள்ளதா?', hi: 'क्या सांस लेने में कठिनाई है?' },
            { en: 'Do you have a cough? If yes, is it dry or with phlegm?', ta: 'இருமல் இருக்கிறதா? சளியுடன் இருக்கிறதா?', hi: 'क्या खांसी है? सूखी या बलगम के साथ?' },
            { en: 'Do you have any fever?', ta: 'காய்ச்சல் இருக்கிறதா?', hi: 'क्या बुखार है?' },
            { en: 'How long have you had these symptoms?', ta: 'இந்த அறிகுறிகள் எவ்வளவு நாட்களாக உள்ளன?', hi: 'ये लक्षण कितने दिनों से हैं?' },
        ],
    },
    skin: {
        questions: [
            { en: 'Where on your body is the issue?', ta: 'உடலின் எந்த பகுதியில் பிரச்சனை உள்ளது?', hi: 'शरीर के किस हिस्से में समस्या है?' },
            { en: 'Is there any itching or pain?', ta: 'அரிப்பு அல்லது வலி உள்ளதா?', hi: 'क्या खुजली या दर्द है?' },
            { en: 'When did you first notice this?', ta: 'இதை முதலில் எப்போது கவனித்தீர்கள்?', hi: 'आपने इसे पहली बार कब देखा?' },
            { en: 'Has it spread or changed?', ta: 'இது பரவியதா அல்லது மாறியதா?', hi: 'क्या यह फैला या बदला है?' },
        ],
    },
    general: {
        questions: [
            { en: 'How long have you been feeling this way?', ta: 'இப்படி எவ்வளவு நாட்களாக உணர்கிறீர்கள்?', hi: 'आप कितने दिनों से ऐसा महसूस कर रहे हैं?' },
            { en: 'Is it affecting your daily activities?', ta: 'இது உங்கள் தினசரி நடவடிக்கைகளை பாதிக்கிறதா?', hi: 'क्या यह आपकी दैनिक गतिविधियों को प्रभावित कर रहा है?' },
            { en: 'Have you taken any medication for this?', ta: 'இதற்கு ஏதேனும் மருந்து எடுத்தீர்களா?', hi: 'क्या आपने इसके लिए कोई दवा ली है?' },
        ],
    },
    unknown: {
        questions: [
            { en: 'Can you describe what you are experiencing?', ta: 'நீங்கள் அனுபவிப்பதை விவரிக்க முடியுமா?', hi: 'आप क्या अनुभव कर रहे हैं, बता सकते हैं?' },
            { en: 'How long have you had this problem?', ta: 'இந்த பிரச்சனை எவ்வளவு நாட்களாக உள்ளது?', hi: 'यह समस्या कितने दिनों से है?' },
            { en: 'Is there anything else you would like to add?', ta: 'வேறு ஏதாவது சேர்க்க விரும்புகிறீர்களா?', hi: 'क्या आप कुछ और जोड़ना चाहते हैं?' },
        ],
    },
};

// ==================== CATEGORY KEYWORDS ====================

const CATEGORY_KEYWORDS: Record<SymptomCategory, string[]> = {
    pain: ['pain', 'ache', 'hurt', 'sore', 'வலி', 'நோவு', 'दर्द', 'पीड़ा', 'headache', 'backache', 'தலைவலி'],
    digestive: ['stomach', 'vomit', 'nausea', 'diarrhea', 'constipation', 'வயிறு', 'வாந்தி', 'पेट', 'उल्टी', 'acidity', 'indigestion'],
    respiratory: ['cough', 'breathe', 'cold', 'fever', 'flu', 'இருமல்', 'சளி', 'காய்ச்சல்', 'खांसी', 'सर्दी', 'बुखार', 'wheeze'],
    skin: ['skin', 'rash', 'itch', 'bump', 'wound', 'தோல்', 'அரிப்பு', 'त्वचा', 'खुजली', 'allergy'],
    general: ['tired', 'fatigue', 'weak', 'sleep', 'சோர்வு', 'தூக்கம்', 'थकान', 'कमजोरी', 'नींद'],
    unknown: [],
};

// ==================== UI MESSAGES ====================

const UI_MESSAGES = {
    welcome: {
        en: "Hello! 👋 I'm here to help you describe your symptoms.\n\n⚠️ Important: I am NOT a doctor. I cannot diagnose or give medical advice. Only your doctor can do that.\n\nWhat is your main concern today?",
        ta: "வணக்கம்! 👋 உங்கள் அறிகுறிகளை விவரிக்க உதவ வந்துள்ளேன்.\n\n⚠️ முக்கியம்: நான் மருத்துவர் அல்ல. நோயறிதல் அல்லது மருத்துவ ஆலோசனை தர இயலாது.\n\nஇன்று உங்கள் முக்கிய கவலை என்ன?",
        hi: "नमस्ते! 👋 मैं आपके लक्षणों को समझने में मदद करने आया हूं।\n\n⚠️ महत्वपूर्ण: मैं डॉक्टर नहीं हूं। मैं निदान या चिकित्सा सलाह नहीं दे सकता।\n\nआज आपकी मुख्य समस्या क्या है?",
    },
    finalCheck: {
        en: "Thank you for sharing. Is there anything else you want to add before I create your summary?",
        ta: "பகிர்ந்ததற்கு நன்றி. சுருக்கத்தை உருவாக்குவதற்கு முன் வேறு ஏதாவது சேர்க்க விரும்புகிறீர்களா?",
        hi: "साझा करने के लिए धन्यवाद। सारांश बनाने से पहले क्या आप कुछ और जोड़ना चाहते हैं?",
    },
    generatingSummary: {
        en: "Creating your intake summary...",
        ta: "உங்கள் தகவல் சுருக்கத்தை உருவாக்குகிறது...",
        hi: "आपका सारांश बना रहा है...",
    },
    summaryComplete: {
        en: "✅ Your symptom summary has been saved to your logbook. You can share it with your doctor when ready.",
        ta: "✅ உங்கள் அறிகுறி சுருக்கம் பதிவேட்டில் சேமிக்கப்பட்டது. தயாரானதும் மருத்துவருடன் பகிரலாம்.",
        hi: "✅ आपका लक्षण सारांश लॉगबुक में सहेजा गया। तैयार होने पर डॉक्टर के साथ साझा कर सकते हैं।",
    },
    noKeywords: [
        'no', 'nothing', 'nope', "that's all", 'done',
        'இல்லை', 'போதும்', 'முடிந்தது',
        'नहीं', 'बस', 'हो गया',
    ],
};

// ==================== COMPONENT ====================

interface GuidedIntakeChatbotProps {
    onComplete?: (entry: LogbookEntry) => void;
}

export function GuidedIntakeChatbot({ onComplete }: GuidedIntakeChatbotProps) {
    const router = useRouter();
    const { t, language } = useLanguage();

    // State
    const [step, setStep] = useState<ChatStep>('welcome');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Intake data
    const [primarySymptom, setPrimarySymptom] = useState('');
    const [category, setCategory] = useState<SymptomCategory>('unknown');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial welcome message
    useEffect(() => {
        const welcomeMsg = UI_MESSAGES.welcome[language] || UI_MESSAGES.welcome.en;
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: welcomeMsg,
            timestamp: Date.now(),
        }]);
        setStep('primary_symptom');
    }, [language]);

    // Detect category from symptom text
    const detectCategory = useCallback((text: string): SymptomCategory => {
        const lowerText = text.toLowerCase();

        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (cat === 'unknown') continue;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    return cat as SymptomCategory;
                }
            }
        }
        return 'general'; // Default to general questions
    }, []);

    // Check if user said "no" / "nothing"
    const isNoResponse = useCallback((text: string): boolean => {
        const lowerText = text.toLowerCase().trim();
        return UI_MESSAGES.noKeywords.some(kw => lowerText.includes(kw.toLowerCase()));
    }, []);

    // Get current question
    const getCurrentQuestion = useCallback((): string => {
        const questionSet = QUESTION_SETS[category];
        if (currentQuestionIndex >= questionSet.questions.length) {
            return UI_MESSAGES.finalCheck[language] || UI_MESSAGES.finalCheck.en;
        }
        const q = questionSet.questions[currentQuestionIndex];
        return q[language] || q.en;
    }, [category, currentQuestionIndex, language]);

    // Add assistant message
    const addAssistantMessage = useCallback((content: string) => {
        setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content,
            timestamp: Date.now(),
        }]);
    }, []);

    // Save to logbook
    const saveToLogbook = useCallback(async () => {
        const demoUserId = localStorage.getItem('demo_user_id') || 'unknown';

        // For demo mode, use the centralized demo session store
        if (DEMO_MODE) {
            const entry = createLogbookEntry(
                demoUserId,
                'chatbot',
                primarySymptom + (additionalNotes ? `\n\nAdditional: ${additionalNotes}` : ''),
                {
                    chiefComplaint: primarySymptom,
                    additionalNotes: answers.map(a => `${a.question}: ${a.answer}`).join('\n'),
                }
            );
            return entry;
        }

        // For non-demo, create entry manually (would integrate with real backend)
        const entry: LogbookEntry = {
            id: `log-chatbot-${Date.now()}`,
            patientId: demoUserId,
            type: 'chatbot',
            createdAt: new Date().toISOString(),
            originalText: primarySymptom + (additionalNotes ? `\n\nAdditional: ${additionalNotes}` : ''),
            structuredSummary: {
                chiefComplaint: primarySymptom,
                additionalNotes: answers.map(a => `${a.question}: ${a.answer}`).join('\n'),
            },
            sharedWithDoctor: false,
            doctorReviewed: false,
        };

        return entry;
    }, [primarySymptom, additionalNotes, answers]);

    // Handle send
    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setMessages(prev => [...prev, {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userText,
            timestamp: Date.now(),
        }]);
        setInput('');
        setIsLoading(true);

        try {
            if (step === 'primary_symptom') {
                // Save primary symptom and detect category
                setPrimarySymptom(userText);
                const detectedCategory = detectCategory(userText);
                setCategory(detectedCategory);

                // Move to asking questions
                setStep('asking_questions');
                setCurrentQuestionIndex(0);

                // Ask first question
                setTimeout(() => {
                    const q = QUESTION_SETS[detectedCategory].questions[0];
                    addAssistantMessage(q[language] || q.en);
                }, 500);

            } else if (step === 'asking_questions') {
                // Save answer
                const currentQ = QUESTION_SETS[category].questions[currentQuestionIndex];
                setAnswers(prev => [...prev, {
                    question: currentQ.en,
                    answer: userText
                }]);

                const nextIndex = currentQuestionIndex + 1;
                const questionSet = QUESTION_SETS[category];

                if (nextIndex >= questionSet.questions.length) {
                    // Move to final check
                    setStep('final_check');
                    setTimeout(() => {
                        addAssistantMessage(UI_MESSAGES.finalCheck[language] || UI_MESSAGES.finalCheck.en);
                    }, 500);
                } else {
                    // Ask next question
                    setCurrentQuestionIndex(nextIndex);
                    setTimeout(() => {
                        const q = questionSet.questions[nextIndex];
                        addAssistantMessage(q[language] || q.en);
                    }, 500);
                }

            } else if (step === 'final_check') {
                // Check if user said no
                if (isNoResponse(userText)) {
                    // Generate summary
                    setStep('generating_summary');
                    addAssistantMessage(UI_MESSAGES.generatingSummary[language] || UI_MESSAGES.generatingSummary.en);

                    // Save and complete
                    const entry = await saveToLogbook();

                    setTimeout(() => {
                        setStep('done');
                        addAssistantMessage(UI_MESSAGES.summaryComplete[language] || UI_MESSAGES.summaryComplete.en);
                        onComplete?.(entry);
                    }, 1000);
                } else {
                    // Save additional notes and complete
                    setAdditionalNotes(userText);
                    setStep('generating_summary');
                    addAssistantMessage(UI_MESSAGES.generatingSummary[language] || UI_MESSAGES.generatingSummary.en);

                    const entry = await saveToLogbook();

                    setTimeout(() => {
                        setStep('done');
                        addAssistantMessage(UI_MESSAGES.summaryComplete[language] || UI_MESSAGES.summaryComplete.en);
                        onComplete?.(entry);
                    }, 1000);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, step, language, detectCategory, category, currentQuestionIndex, addAssistantMessage, isNoResponse, saveToLogbook, onComplete]);

    // View logbook
    const handleViewLogbook = useCallback(() => {
        router.push('/patient/logbook');
    }, [router]);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>💬 {t('Health Intake')}</h2>
                <p style={styles.subtitle}>{t('Answer a few questions about how you feel')}</p>
            </div>

            {/* Ethical Disclaimer */}
            <div style={styles.disclaimer}>
                ⚠️ {t('This is intake only — not medical advice or diagnosis.')}
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        style={{
                            ...styles.message,
                            ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
                        }}
                    >
                        <p style={styles.messageContent}>{msg.content}</p>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ ...styles.message, ...styles.assistantMessage }}>
                        <p style={styles.messageContent}>...</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {step !== 'done' && step !== 'generating_summary' && (
                <div style={styles.inputArea}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('Type your answer...')}
                        style={styles.input}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        style={{
                            ...styles.sendBtn,
                            ...(!input.trim() || isLoading ? styles.sendBtnDisabled : {}),
                        }}
                    >
                        ➤
                    </button>
                </div>
            )}

            {/* Done Actions */}
            {step === 'done' && (
                <div style={styles.doneActions}>
                    <button onClick={handleViewLogbook} style={styles.viewLogbookBtn}>
                        📋 {t('View Logbook')}
                    </button>
                    <button onClick={() => router.push('/patient/consult')} style={styles.consultBtn}>
                        🩺 {t('Consult a Doctor')}
                    </button>
                </div>
            )}

            {/* Safety Notice */}
            <div style={styles.safetyNotice}>
                🚨 <strong>{t('For Emergencies')}</strong>: {t('Visit your nearest hospital')}
            </div>
        </div>
    );
}

// ==================== STYLES ====================

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '700px',
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    header: {
        padding: '20px',
        background: 'linear-gradient(135deg, #0d9488, #3b82f6)',
        color: 'white',
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 700,
    },
    subtitle: {
        margin: '4px 0 0 0',
        fontSize: '14px',
        opacity: 0.9,
    },
    disclaimer: {
        padding: '10px 16px',
        background: '#fef3c7',
        color: '#92400e',
        fontSize: '13px',
        textAlign: 'center',
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    message: {
        maxWidth: '85%',
        padding: '12px 16px',
        borderRadius: '16px',
    },
    userMessage: {
        alignSelf: 'flex-end',
        background: '#3b82f6',
        color: 'white',
        borderBottomRightRadius: '4px',
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        background: '#f1f5f9',
        color: '#0f172a',
        borderBottomLeftRadius: '4px',
    },
    messageContent: {
        margin: 0,
        fontSize: '15px',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
    },
    inputArea: {
        display: 'flex',
        gap: '10px',
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
    },
    input: {
        flex: 1,
        padding: '14px 18px',
        border: '2px solid #e2e8f0',
        borderRadius: '24px',
        fontSize: '16px',
        outline: 'none',
    },
    sendBtn: {
        padding: '14px 20px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '24px',
        fontSize: '18px',
        cursor: 'pointer',
    },
    sendBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    doneActions: {
        display: 'flex',
        gap: '12px',
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
    },
    viewLogbookBtn: {
        flex: 1,
        padding: '14px',
        background: '#0d9488',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    consultBtn: {
        flex: 1,
        padding: '14px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    safetyNotice: {
        padding: '12px 16px',
        background: '#fef2f2',
        color: '#dc2626',
        fontSize: '13px',
        textAlign: 'center',
    },
};

export default GuidedIntakeChatbot;
