/**
 * Backend API Client
 * ==================
 * Handles all communication with the FastAPI backend.
 * 
 * SECURITY:
 * - All requests include Firebase ID token
 * - No API keys exposed to frontend
 * - All medical data requires consent verification on backend
 */

import { getIdToken } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getIdToken();

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add content type for JSON if body is not FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
}

// ==================== SYMPTOM ENDPOINTS ====================

export interface SymptomUploadResponse {
    id: string;
    status: 'queued' | 'processing' | 'completed';
    message: string;
}

/**
 * Upload audio recording for processing
 * 
 * ETHICAL SAFEGUARD:
 * - Consent ID is required
 * - Backend verifies consent before processing
 */
export async function uploadRecording(
    recordingId: string,
    audioBlob: Blob,
    language: string,
    consentId: string
): Promise<SymptomUploadResponse> {
    const formData = new FormData();
    formData.append('recording_id', recordingId);
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);
    formData.append('consent_id', consentId);

    return apiRequest<SymptomUploadResponse>('/api/symptoms/upload', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Upload text symptom
 */
export async function uploadSymptom(
    symptomId: string,
    text: string,
    language: string,
    consentId: string
): Promise<SymptomUploadResponse> {
    return apiRequest<SymptomUploadResponse>('/api/symptoms/upload-text', {
        method: 'POST',
        body: JSON.stringify({
            symptom_id: symptomId,
            text,
            language,
            consent_id: consentId,
        }),
    });
}

// ==================== SUMMARY ENDPOINTS ====================

export interface StructuredSummary {
    chiefComplaint: string;
    symptomTimeline: string;
    severity: string;
    pastHistory?: string;
    attachedReports?: string[];
}

export interface SummaryResponse {
    id: string;
    summary: StructuredSummary;
    translation?: string;
    translationLanguage?: string;
    aiFailed: boolean;
    rawTranscript?: string;
}

/**
 * Get processed summary for a recording
 */
export async function getRecordingSummary(
    recordingId: string
): Promise<SummaryResponse> {
    return apiRequest<SummaryResponse>(`/api/symptoms/${recordingId}/summary`);
}

// ==================== CONSULTATION ENDPOINTS ====================

export interface ConsultationSummary {
    id: string;
    patientId: string;
    summary: StructuredSummary;
    consentScope: string[];
    createdAt: string;
    doctorNotes?: string;
}

/**
 * Get consultations for doctor (doctor-only endpoint)
 */
export async function getDoctorConsultations(): Promise<ConsultationSummary[]> {
    return apiRequest<ConsultationSummary[]>('/api/consultations');
}

/**
 * Get specific consultation (doctor-only endpoint)
 */
export async function getConsultation(
    consultationId: string
): Promise<ConsultationSummary> {
    return apiRequest<ConsultationSummary>(`/api/consultations/${consultationId}`);
}

/**
 * Submit doctor's visit notes
 */
export async function submitDoctorNotes(
    consultationId: string,
    notes: string
): Promise<{ success: boolean; translatedNotes?: string }> {
    return apiRequest<{ success: boolean; translatedNotes?: string }>(
        `/api/consultations/${consultationId}/notes`,
        {
            method: 'POST',
            body: JSON.stringify({ notes }),
        }
    );
}

// ==================== TELECONSULTATION ENDPOINTS ====================

export interface TelemedToken {
    token: string;
    channel: string;
    uid: number;
    expiresAt: number;
}

/**
 * Get WebRTC token for teleconsultation
 * 
 * SECURITY:
 * - Token is appointment-bound
 * - Only valid participants get tokens
 */
export async function getTelemedToken(
    appointmentId: string
): Promise<TelemedToken> {
    return apiRequest<TelemedToken>(`/api/telemed/${appointmentId}/token`);
}

/**
 * Get teleconsult token with appId for Agora (alias with extended response)
 */
export async function getTeleconsultToken(
    appointmentId: string
): Promise<{ token: string; channelName: string; appId: string }> {
    const response = await getTelemedToken(appointmentId);
    // App ID from environment or from backend response
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
    return {
        token: response.token,
        channelName: response.channel,
        appId,
    };
}

// ==================== TEXT-TO-SPEECH ====================

/**
 * Read text aloud using Web Speech API (browser TTS)
 * This is client-side only, no API call needed
 */
export function speakText(text: string, language: string): void {
    if (!('speechSynthesis' in window)) {
        console.warn('[TTS] Speech synthesis not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language based on input
    const langMap: { [key: string]: string } = {
        english: 'en-IN',
        tamil: 'ta-IN',
        hindi: 'hi-IN',
        telugu: 'te-IN',
    };

    utterance.lang = langMap[language.toLowerCase()] || 'en-IN';
    utterance.rate = 0.9; // Slightly slower for clarity

    window.speechSynthesis.speak(utterance);
}

/**
 * Stop text-to-speech
 */
export function stopSpeaking(): void {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}
