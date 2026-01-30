/**
 * LLM Service Client
 * ==================
 * Frontend client for backend LLM API endpoints.
 * 
 * USAGE:
 * - Symptom classification
 * - Intake structuring
 * - Summary generation
 * - Translation
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ClassifyResponse {
    symptom_category: string;
    confidence: string;
    ai_role: string;
    ai_disclaimer: string;
}

export interface StructureResponse {
    chief_complaint: string;
    duration: string | null;
    severity: string | null;
    associated_symptoms: string[];
    additional_notes: string | null;
    ai_role: string;
    ai_disclaimer: string;
}

export interface SummaryResponse {
    summary_text: string;
    ai_role: string;
    ai_disclaimer: string;
}

export interface TranslateResponse {
    translated_text: string;
    method: string;
}

/**
 * Classify symptom text into a predefined category.
 */
export async function classifySymptoms(
    symptomText: string,
    language: string = 'en'
): Promise<ClassifyResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/llm/classify-symptoms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symptom_text: symptomText,
                language,
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[LLM] Classification failed:', error);
        return {
            symptom_category: 'general',
            confidence: 'low',
            ai_role: 'non_clinical_intake_only',
            ai_disclaimer: 'Fallback used due to error.',
        };
    }
}

/**
 * Structure intake responses into organized fields.
 */
export async function structureIntake(
    symptomText: string,
    responses: Array<{ question: string; answer: string }>,
    language: string = 'en'
): Promise<StructureResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/llm/structure-intake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symptom_text: symptomText,
                responses,
                language,
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[LLM] Structuring failed:', error);
        return {
            chief_complaint: symptomText,
            duration: null,
            severity: null,
            associated_symptoms: [],
            additional_notes: 'LLM structuring unavailable',
            ai_role: 'non_clinical_intake_only',
            ai_disclaimer: 'Fallback used due to error.',
        };
    }
}

/**
 * Generate intake summary for doctor.
 */
export async function generateSummary(
    structuredIntake: Record<string, unknown>,
    patientName?: string
): Promise<SummaryResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/llm/generate-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                structured_intake: structuredIntake,
                patient_name: patientName,
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[LLM] Summary failed:', error);
        return {
            summary_text: 'Summary generation unavailable. See structured intake.',
            ai_role: 'non_clinical_intake_only',
            ai_disclaimer: 'Fallback used due to error.',
        };
    }
}

/**
 * Translate text between languages.
 */
export async function translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
): Promise<TranslateResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/llm/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                source_language: sourceLanguage,
                target_language: targetLanguage,
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[LLM] Translation failed:', error);
        return {
            translated_text: text,
            method: 'fallback_original',
        };
    }
}

/**
 * Check LLM service health.
 */
export async function checkLLMHealth(): Promise<{
    groq_available: boolean;
    gemini_available: boolean;
}> {
    try {
        const response = await fetch(`${API_BASE}/api/llm/health`);
        return await response.json();
    } catch {
        return { groq_available: false, gemini_available: false };
    }
}
