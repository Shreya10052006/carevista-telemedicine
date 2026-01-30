'use client';

/**
 * Agora Call Hook (Phase 2)
 * =========================
 * Manages Agora RTC client lifecycle for audio calls.
 * 
 * MINIMAL SCOPE:
 * - Audio only (no video)
 * - Join, leave, mute controls
 * - Token fetched from backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    IMicrophoneAudioTrack,
    IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { getTeleconsultToken } from '@/lib/api';
import { useAuth } from './useAuth';

export interface CallState {
    status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
    error: string | null;
    isMuted: boolean;
    remoteUsers: string[];
    duration: number;
}

export function useAgoraCall(appointmentId: string | null) {
    const { user } = useAuth();
    const [state, setState] = useState<CallState>({
        status: 'idle',
        error: null,
        isMuted: false,
        remoteUsers: [],
        duration: 0,
    });

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Agora client
    useEffect(() => {
        if (typeof window === 'undefined') return;

        clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
        });

        // Handle remote user joined
        clientRef.current.on('user-published', async (remoteUser, mediaType) => {
            if (clientRef.current) {
                await clientRef.current.subscribe(remoteUser, mediaType);
                if (mediaType === 'audio') {
                    remoteUser.audioTrack?.play();
                }
                setState((prev) => ({
                    ...prev,
                    remoteUsers: [...prev.remoteUsers, remoteUser.uid.toString()],
                }));
            }
        });

        // Handle remote user left
        clientRef.current.on('user-left', (remoteUser) => {
            setState((prev) => ({
                ...prev,
                remoteUsers: prev.remoteUsers.filter((uid) => uid !== remoteUser.uid.toString()),
            }));
        });

        return () => {
            if (clientRef.current) {
                clientRef.current.leave();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Join call
    const joinCall = useCallback(async () => {
        if (!clientRef.current || !appointmentId || !user?.uid) {
            setState((prev) => ({
                ...prev,
                status: 'error',
                error: 'Missing required parameters',
            }));
            return;
        }

        setState((prev) => ({ ...prev, status: 'connecting', error: null }));

        try {
            // Get token from backend
            const { token, channelName, appId } = await getTeleconsultToken(appointmentId);

            // Join the channel
            await clientRef.current.join(appId, channelName, token, user.uid);

            // Create and publish local audio track
            localTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
            await clientRef.current.publish([localTrackRef.current]);

            // Start duration timer
            timerRef.current = setInterval(() => {
                setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
            }, 1000);

            setState((prev) => ({ ...prev, status: 'connected' }));
        } catch (error: any) {
            console.error('Join call error:', error);
            setState((prev) => ({
                ...prev,
                status: 'error',
                error: error.message || 'Failed to join call',
            }));
        }
    }, [appointmentId, user?.uid]);

    // Leave call
    const leaveCall = useCallback(async () => {
        try {
            if (localTrackRef.current) {
                localTrackRef.current.close();
                localTrackRef.current = null;
            }

            if (clientRef.current) {
                await clientRef.current.leave();
            }

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            setState({
                status: 'disconnected',
                error: null,
                isMuted: false,
                remoteUsers: [],
                duration: 0,
            });
        } catch (error: any) {
            console.error('Leave call error:', error);
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localTrackRef.current) {
            const newMuteState = !state.isMuted;
            localTrackRef.current.setEnabled(!newMuteState);
            setState((prev) => ({ ...prev, isMuted: newMuteState }));
        }
    }, [state.isMuted]);

    return {
        ...state,
        joinCall,
        leaveCall,
        toggleMute,
        isInCall: state.status === 'connected',
    };
}
