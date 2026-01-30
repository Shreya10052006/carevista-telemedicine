/**
 * Text-to-Speech Service
 * ======================
 * Browser-based TTS for reading consent screens and summaries aloud.
 * Supports multiple Indian languages for accessibility.
 * 
 * ACCESSIBILITY:
 * - Elder-friendly: Read important information aloud
 * - Multi-language: Tamil, Hindi, Telugu, English
 * - Controls: Play, pause, stop
 */

// Supported languages with their BCP 47 codes
const LANGUAGE_CODES: { [key: string]: string } = {
    english: 'en-IN',
    tamil: 'ta-IN',
    hindi: 'hi-IN',
    telugu: 'te-IN',
};

// TTS state
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isPaused = false;

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available voices for a language
 */
export function getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    if (!isTTSSupported()) return [];

    const langCode = LANGUAGE_CODES[language.toLowerCase()] || 'en-IN';
    const voices = window.speechSynthesis.getVoices();

    return voices.filter((voice) => voice.lang.startsWith(langCode.split('-')[0]));
}

/**
 * Speak text aloud
 */
export function speak(
    text: string,
    language: string = 'english',
    options: {
        rate?: number;
        pitch?: number;
        volume?: number;
        onStart?: () => void;
        onEnd?: () => void;
        onError?: (error: string) => void;
    } = {}
): void {
    if (!isTTSSupported()) {
        options.onError?.('Text-to-speech is not supported in this browser');
        return;
    }

    // Stop any current speech
    stop();

    const langCode = LANGUAGE_CODES[language.toLowerCase()] || 'en-IN';

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = langCode;
    currentUtterance.rate = options.rate ?? 0.85; // Slower for elder-friendly
    currentUtterance.pitch = options.pitch ?? 1;
    currentUtterance.volume = options.volume ?? 1;

    // Try to find a voice for this language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang === langCode) ||
        voices.find((v) => v.lang.startsWith(langCode.split('-')[0]));

    if (matchingVoice) {
        currentUtterance.voice = matchingVoice;
    }

    // Event handlers
    currentUtterance.onstart = () => {
        isPaused = false;
        options.onStart?.();
    };

    currentUtterance.onend = () => {
        currentUtterance = null;
        isPaused = false;
        options.onEnd?.();
    };

    currentUtterance.onerror = (event) => {
        currentUtterance = null;
        isPaused = false;
        options.onError?.(event.error);
    };

    window.speechSynthesis.speak(currentUtterance);
}

/**
 * Pause speech
 */
export function pause(): void {
    if (isTTSSupported() && currentUtterance) {
        window.speechSynthesis.pause();
        isPaused = true;
    }
}

/**
 * Resume speech
 */
export function resume(): void {
    if (isTTSSupported() && isPaused) {
        window.speechSynthesis.resume();
        isPaused = false;
    }
}

/**
 * Stop speech
 */
export function stop(): void {
    if (isTTSSupported()) {
        window.speechSynthesis.cancel();
        currentUtterance = null;
        isPaused = false;
    }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
    return isTTSSupported() && window.speechSynthesis.speaking && !isPaused;
}

/**
 * Check if paused
 */
export function getIsPaused(): boolean {
    return isPaused;
}

/**
 * Read consent text with enhanced accessibility
 * Slower rate, clear pronunciation
 */
export function readConsent(
    text: string,
    language: string,
    callbacks?: {
        onStart?: () => void;
        onEnd?: () => void;
    }
): void {
    speak(text, language, {
        rate: 0.75, // Extra slow for consent
        onStart: callbacks?.onStart,
        onEnd: callbacks?.onEnd,
    });
}

/**
 * Read summary with normal rate
 */
export function readSummary(
    text: string,
    language: string,
    callbacks?: {
        onStart?: () => void;
        onEnd?: () => void;
    }
): void {
    speak(text, language, {
        rate: 0.85,
        onStart: callbacks?.onStart,
        onEnd: callbacks?.onEnd,
    });
}

// Initialize voices (some browsers need this)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Load voices
    window.speechSynthesis.getVoices();

    // Some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
