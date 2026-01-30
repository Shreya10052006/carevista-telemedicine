'use client';

/**
 * Auth Hook
 * =========
 * Provides authentication state and methods throughout the app.
 * 
 * Phase 2: Added assisted patient management for health workers
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
    onAuthChange,
    getCurrentUser,
    logOut,
    getUserProfile,
    UserProfile,
    UserRole,
} from '@/lib/firebase';

export interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    role: UserRole | null;
    loading: boolean;
    error: string | null;
    // Phase 2: Assisted mode state
    assistedPatientId: string | null;
    assistedPatientName: string | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        role: null,
        loading: true,
        error: null,
        assistedPatientId: null,
        assistedPatientName: null,
    });

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid);
                    setState((prev) => ({
                        ...prev,
                        user,
                        profile,
                        role: profile?.role || null,
                        loading: false,
                        error: null,
                    }));
                } catch (error) {
                    setState((prev) => ({
                        ...prev,
                        user,
                        profile: null,
                        role: null,
                        loading: false,
                        error: 'Failed to load profile',
                    }));
                }
            } else {
                setState({
                    user: null,
                    profile: null,
                    role: null,
                    loading: false,
                    error: null,
                    assistedPatientId: null,
                    assistedPatientName: null,
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await logOut();
        } catch (error) {
            setState((prev) => ({ ...prev, error: 'Logout failed' }));
        }
    }, []);

    // Phase 2: Set the patient being assisted by health worker
    const setAssistedPatient = useCallback((patientId: string | null, patientName?: string) => {
        setState((prev) => ({
            ...prev,
            assistedPatientId: patientId,
            assistedPatientName: patientName || null,
        }));
    }, []);

    // Phase 2: Get effective patient ID (self or assisted patient)
    const getEffectivePatientId = useCallback(() => {
        if (state.role === 'health_worker' && state.assistedPatientId) {
            return state.assistedPatientId;
        }
        return state.user?.uid || null;
    }, [state.role, state.assistedPatientId, state.user]);

    return {
        ...state,
        logout: handleLogout,
        isAuthenticated: !!state.user,
        isPatient: state.role === 'patient',
        isDoctor: state.role === 'doctor',
        isHealthWorker: state.role === 'health_worker',
        // Phase 2: Assisted mode methods
        setAssistedPatient,
        getEffectivePatientId,
        isAssistingPatient: state.role === 'health_worker' && !!state.assistedPatientId,
    };
}

