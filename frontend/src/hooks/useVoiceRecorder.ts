'use client';

/**
 * Voice Recorder Hook
 * ===================
 * Handles audio recording using Web Audio API.
 * Records in WebM format for efficient storage and transmission.
 * 
 * ETHICAL SAFEGUARD:
 * - REQUIRES consent before recording starts
 * - Clear visual feedback during recording
 * - Audio stored locally first, then synced
 */

import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    error: string | null;
}

export function useVoiceRecorder() {
    const [state, setState] = useState<RecordingState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    /**
     * Start recording
     * REQUIRES consent check before calling
     */
    const startRecording = useCallback(async () => {
        // Reset state
        setState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioBlob: null,
            audioUrl: null,
            error: null,
        });
        chunksRef.current = [];

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            streamRef.current = stream;

            // Create MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            // Handle data chunks
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                const audioUrl = URL.createObjectURL(audioBlob);

                setState((prev) => ({
                    ...prev,
                    isRecording: false,
                    isPaused: false,
                    audioBlob,
                    audioUrl,
                }));

                // Stop stream tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second

            // Start duration timer
            timerRef.current = setInterval(() => {
                setState((prev) => ({
                    ...prev,
                    duration: prev.duration + 1,
                }));
            }, 1000);

            setState((prev) => ({
                ...prev,
                isRecording: true,
                error: null,
            }));
        } catch (error) {
            let errorMessage = 'Failed to start recording';
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Microphone access denied. Please allow microphone access.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No microphone found. Please connect a microphone.';
                }
            }
            setState((prev) => ({
                ...prev,
                error: errorMessage,
            }));
        }
    }, []);

    /**
     * Stop recording
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop();

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [state.isRecording]);

    /**
     * Pause recording
     */
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
            mediaRecorderRef.current.pause();

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            setState((prev) => ({
                ...prev,
                isPaused: true,
            }));
        }
    }, [state.isRecording, state.isPaused]);

    /**
     * Resume recording
     */
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isPaused) {
            mediaRecorderRef.current.resume();

            timerRef.current = setInterval(() => {
                setState((prev) => ({
                    ...prev,
                    duration: prev.duration + 1,
                }));
            }, 1000);

            setState((prev) => ({
                ...prev,
                isPaused: false,
            }));
        }
    }, [state.isPaused]);

    /**
     * Clear recording
     */
    const clearRecording = useCallback(() => {
        if (state.audioUrl) {
            URL.revokeObjectURL(state.audioUrl);
        }

        setState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioBlob: null,
            audioUrl: null,
            error: null,
        });
    }, [state.audioUrl]);

    /**
     * Format duration as MM:SS
     */
    const formatDuration = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        ...state,
        formattedDuration: formatDuration(state.duration),
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearRecording,
        hasRecording: !!state.audioBlob,
    };
}
