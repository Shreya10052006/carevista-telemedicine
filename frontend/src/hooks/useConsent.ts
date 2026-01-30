'use client';

/**
 * Consent Hook
 * ============
 * Manages consent state for recording, transcription, and doctor sharing.
 * 
 * ETHICAL SAFEGUARD:
 * - All actions require explicit consent
 * - Consent can be revoked anytime
 * - Consent is timestamped and stored
 */

import { useState, useEffect, useCallback } from 'react';
import {
    storeConsent,
    hasActiveConsent,
    revokeConsent as revokeFirebaseConsent,
} from '@/lib/firebase';
import {
    saveLocalConsent,
    checkLocalConsent,
} from '@/lib/indexedDB';

export type ConsentType = 'recording' | 'transcription' | 'doctor_sharing';

export interface ConsentState {
    recording: boolean;
    transcription: boolean;
    doctorSharing: boolean;
    loading: boolean;
}

export function useConsent(userId: string | null) {
    const [state, setState] = useState<ConsentState>({
        recording: false,
        transcription: false,
        doctorSharing: false,
        loading: true,
    });

    // Load consent status on mount
    useEffect(() => {
        async function loadConsent() {
            if (!userId) {
                setState((prev) => ({ ...prev, loading: false }));
                return;
            }

            try {
                // Check local consent first (for offline support)
                const [localRecording, localTranscription, localDoctorSharing] =
                    await Promise.all([
                        checkLocalConsent('recording'),
                        checkLocalConsent('transcription'),
                        checkLocalConsent('doctor_sharing'),
                    ]);

                // If online, also check Firebase
                if (navigator.onLine) {
                    const [fbRecording, fbTranscription, fbDoctorSharing] =
                        await Promise.all([
                            hasActiveConsent(userId, 'recording'),
                            hasActiveConsent(userId, 'transcription'),
                            hasActiveConsent(userId, 'doctor_sharing'),
                        ]);

                    setState({
                        recording: localRecording || fbRecording,
                        transcription: localTranscription || fbTranscription,
                        doctorSharing: localDoctorSharing || fbDoctorSharing,
                        loading: false,
                    });
                } else {
                    setState({
                        recording: localRecording,
                        transcription: localTranscription,
                        doctorSharing: localDoctorSharing,
                        loading: false,
                    });
                }
            } catch (error) {
                console.error('[Consent] Error loading consent:', error);
                setState((prev) => ({ ...prev, loading: false }));
            }
        }

        loadConsent();
    }, [userId]);

    /**
     * Grant consent
     */
    const grantConsent = useCallback(
        async (type: ConsentType, language: string = 'english') => {
            if (!userId) return null;

            try {
                // Save locally first (offline-first)
                const localId = await saveLocalConsent(type, true, language);

                // Try to save to Firebase if online
                if (navigator.onLine) {
                    await storeConsent(userId, type, true, language);
                }

                // Update state
                setState((prev) => ({
                    ...prev,
                    [type === 'doctor_sharing' ? 'doctorSharing' : type]: true,
                }));

                return localId;
            } catch (error) {
                console.error(`[Consent] Error granting ${type}:`, error);
                throw error;
            }
        },
        [userId]
    );

    /**
     * Revoke consent
     */
    const revokeConsent = useCallback(
        async (type: ConsentType, language: string = 'english') => {
            if (!userId) return;

            try {
                // Save revocation locally
                await saveLocalConsent(type, false, language);

                // Try to revoke in Firebase if online
                if (navigator.onLine) {
                    await revokeFirebaseConsent(userId, type);
                }

                // Update state
                setState((prev) => ({
                    ...prev,
                    [type === 'doctor_sharing' ? 'doctorSharing' : type]: false,
                }));
            } catch (error) {
                console.error(`[Consent] Error revoking ${type}:`, error);
                throw error;
            }
        },
        [userId]
    );

    /**
     * Check if all required consents are granted
     */
    const hasAllConsents = useCallback(
        (required: ConsentType[]): boolean => {
            return required.every((type) => {
                if (type === 'recording') return state.recording;
                if (type === 'transcription') return state.transcription;
                if (type === 'doctor_sharing') return state.doctorSharing;
                return false;
            });
        },
        [state]
    );

    return {
        ...state,
        grantConsent,
        revokeConsent,
        hasAllConsents,
        hasRecordingConsent: state.recording,
        hasTranscriptionConsent: state.transcription,
        hasDoctorSharingConsent: state.doctorSharing,
    };
}
