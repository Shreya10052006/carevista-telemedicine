'use client';

/**
 * Consent Screen Component
 * ========================
 * Multi-step consent flow with one idea per screen.
 * Designed for elder-friendly accessibility.
 * 
 * ETHICAL SAFEGUARD:
 * - Plain language explanations
 * - One consent type per screen
 * - Voice-readable for elders
 * - Explicit checkbox confirmation
 * - Timestamped consent storage
 */

import { useState, useCallback } from 'react';
import { ConsentStep } from './ConsentStep';
import { speak, stop } from '@/lib/tts';

export type ConsentType = 'recording' | 'transcription' | 'doctor_sharing';

interface ConsentScreenProps {
    language: string;
    requiredConsents: ConsentType[];
    onComplete: (consents: { [key: string]: boolean }) => void;
    onCancel: () => void;
}

// Consent content in multiple languages
const CONSENT_CONTENT: {
    [lang: string]: {
        [type: string]: {
            title: string;
            description: string;
            details: string[];
        };
    };
} = {
    english: {
        recording: {
            title: 'Voice Recording Permission',
            description: 'We need your permission to record your voice.',
            details: [
                'Your voice will be recorded when you describe your symptoms',
                'The recording stays on your phone until you choose to share',
                'You can delete the recording anytime',
            ],
        },
        transcription: {
            title: 'Converting Voice to Text',
            description: 'We will convert your voice recording into written text.',
            details: [
                'A computer will write down what you said',
                'This helps doctors read your symptoms quickly',
                'The original recording is kept safe',
            ],
        },
        doctor_sharing: {
            title: 'Sharing with Doctor',
            description: 'Your symptom summary will be shared with a doctor.',
            details: [
                'Only the summary (not the recording) goes to the doctor',
                'The doctor will use this to understand your health concern',
                'You can choose which doctor to share with',
            ],
        },
    },
    tamil: {
        recording: {
            title: 'குரல் பதிவு அனுமதி',
            description: 'உங்கள் குரலை பதிவு செய்ய உங்கள் அனுமதி தேவை.',
            details: [
                'உங்கள் அறிகுறிகளை விவரிக்கும்போது உங்கள் குரல் பதிவு செய்யப்படும்',
                'நீங்கள் பகிர்வதைத் தேர்வுசெய்யும் வரை பதிவு உங்கள் தொலைபேசியில் இருக்கும்',
                'எந்த நேரத்திலும் பதிவை நீக்கலாம்',
            ],
        },
        transcription: {
            title: 'குரலை உரையாக மாற்றுதல்',
            description: 'உங்கள் குரல் பதிவை எழுத்து வடிவத்தில் மாற்றுவோம்.',
            details: [
                'கணினி நீங்கள் சொன்னதை எழுதும்',
                'இது மருத்துவர்களுக்கு உங்கள் அறிகுறிகளை விரைவாக படிக்க உதவுகிறது',
                'அசல் பதிவு பாதுகாப்பாக வைக்கப்படுகிறது',
            ],
        },
        doctor_sharing: {
            title: 'மருத்துவருடன் பகிர்தல்',
            description: 'உங்கள் அறிகுறி சுருக்கம் மருத்துவருடன் பகிரப்படும்.',
            details: [
                'சுருக்கம் மட்டுமே (பதிவு அல்ல) மருத்துவரிடம் செல்கிறது',
                'மருத்துவர் உங்கள் உடல்நலக் கவலையைப் புரிந்துகொள்ள இதைப் பயன்படுத்துவார்',
                'எந்த மருத்துவருடன் பகிர்வது என்று நீங்கள் தேர்வு செய்யலாம்',
            ],
        },
    },
    hindi: {
        recording: {
            title: 'आवाज़ रिकॉर्डिंग की अनुमति',
            description: 'हमें आपकी आवाज़ रिकॉर्ड करने की अनुमति चाहिए।',
            details: [
                'जब आप अपने लक्षण बताएंगे तब आपकी आवाज़ रिकॉर्ड होगी',
                'रिकॉर्डिंग आपके फोन में ही रहेगी जब तक आप शेयर नहीं करते',
                'आप कभी भी रिकॉर्डिंग हटा सकते हैं',
            ],
        },
        transcription: {
            title: 'आवाज़ को लिखित में बदलना',
            description: 'हम आपकी आवाज़ रिकॉर्डिंग को लिखित में बदलेंगे।',
            details: [
                'कंप्यूटर आपने जो कहा उसे लिखेगा',
                'इससे डॉक्टर को आपके लक्षण जल्दी पढ़ने में मदद मिलती है',
                'असली रिकॉर्डिंग सुरक्षित रखी जाती है',
            ],
        },
        doctor_sharing: {
            title: 'डॉक्टर के साथ साझा करना',
            description: 'आपका लक्षण सारांश डॉक्टर के साथ साझा किया जाएगा।',
            details: [
                'केवल सारांश (रिकॉर्डिंग नहीं) डॉक्टर को जाती है',
                'डॉक्टर इसे आपकी स्वास्थ्य समस्या समझने के लिए उपयोग करेंगे',
                'आप चुन सकते हैं कि किस डॉक्टर के साथ साझा करना है',
            ],
        },
    },
};

export function ConsentScreen({
    language,
    requiredConsents,
    onComplete,
    onCancel,
}: ConsentScreenProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [consents, setConsents] = useState<{ [key: string]: boolean }>({});

    const content = CONSENT_CONTENT[language.toLowerCase()] || CONSENT_CONTENT.english;
    const currentConsentType = requiredConsents[currentStep];
    const currentContent = content[currentConsentType];

    const handleConsent = useCallback(
        (granted: boolean) => {
            // Stop any TTS
            stop();

            // Update consents
            const newConsents = {
                ...consents,
                [currentConsentType]: granted,
            };
            setConsents(newConsents);

            // Move to next step or complete
            if (currentStep < requiredConsents.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                onComplete(newConsents);
            }
        },
        [currentStep, currentConsentType, consents, requiredConsents.length, onComplete]
    );

    const handleBack = useCallback(() => {
        stop();
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            onCancel();
        }
    }, [currentStep, onCancel]);

    const handleReadAloud = useCallback(() => {
        const textToRead = `${currentContent.title}. ${currentContent.description}. ${currentContent.details.join('. ')}`;
        speak(textToRead, language);
    }, [currentContent, language]);

    return (
        <div style={styles.container}>
            {/* Progress Indicator */}
            <div style={styles.progress}>
                <span>
                    Step {currentStep + 1} of {requiredConsents.length}
                </span>
                <div style={styles.progressBar}>
                    <div
                        style={{
                            ...styles.progressFill,
                            width: `${((currentStep + 1) / requiredConsents.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Consent Step */}
            <ConsentStep
                title={currentContent.title}
                description={currentContent.description}
                details={currentContent.details}
                onAgree={() => handleConsent(true)}
                onDecline={() => handleConsent(false)}
                onBack={handleBack}
                onReadAloud={handleReadAloud}
                showBack={currentStep > 0}
            />
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
    },
    progress: {
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
    },
    progressBar: {
        marginTop: 'var(--spacing-xs)',
        height: '8px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        background: 'var(--color-primary)',
        transition: 'width var(--transition-normal)',
    },
};
