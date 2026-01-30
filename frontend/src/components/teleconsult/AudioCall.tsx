'use client';

/**
 * Audio Call Component (Phase 2)
 * ==============================
 * Minimal audio-only teleconsultation UI.
 * 
 * SCOPE:
 * - Audio only (no video)
 * - Join, Leave, Mute controls
 * - Connection status indicator
 */

import { useAgoraCall } from '@/hooks/useAgoraCall';

interface AudioCallProps {
    appointmentId: string;
    patientName?: string;
    doctorName?: string;
    onCallEnd?: () => void;
}

export function AudioCall({
    appointmentId,
    patientName,
    doctorName,
    onCallEnd,
}: AudioCallProps) {
    const {
        status,
        error,
        isMuted,
        remoteUsers,
        duration,
        joinCall,
        leaveCall,
        toggleMute,
        isInCall,
    } = useAgoraCall(appointmentId);

    // Format duration as MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle leave and callback
    const handleLeave = async () => {
        await leaveCall();
        onCallEnd?.();
    };

    return (
        <div style={styles.container}>
            {/* Call Status */}
            <div style={styles.statusBar}>
                <span
                    style={{
                        ...styles.statusDot,
                        background:
                            status === 'connected'
                                ? 'var(--color-success)'
                                : status === 'connecting'
                                    ? 'var(--color-warning)'
                                    : 'var(--text-muted)',
                    }}
                />
                <span style={styles.statusText}>
                    {status === 'idle' && 'Ready to connect'}
                    {status === 'connecting' && 'Connecting...'}
                    {status === 'connected' && 'Connected'}
                    {status === 'disconnected' && 'Call ended'}
                    {status === 'error' && 'Connection error'}
                </span>
            </div>

            {/* Error Display */}
            {error && (
                <div style={styles.error}>
                    ⚠️ {error}
                </div>
            )}

            {/* Call Display */}
            <div style={styles.callDisplay}>
                {/* Avatar */}
                <div style={styles.avatar}>
                    <span style={styles.avatarIcon}>
                        {isInCall ? '📞' : '🎧'}
                    </span>
                </div>

                {/* Participant Info */}
                <h2 style={styles.participantName}>
                    {patientName || doctorName || 'Waiting for participant...'}
                </h2>

                {/* Duration */}
                {isInCall && (
                    <p style={styles.duration}>{formatDuration(duration)}</p>
                )}

                {/* Remote Users Count */}
                {remoteUsers.length > 0 && (
                    <p style={styles.remoteCount}>
                        {remoteUsers.length} participant{remoteUsers.length > 1 ? 's' : ''} connected
                    </p>
                )}
            </div>

            {/* Controls */}
            <div style={styles.controls}>
                {!isInCall && status !== 'connecting' && (
                    <button onClick={joinCall} style={styles.joinBtn}>
                        📞 Join Call
                    </button>
                )}

                {isInCall && (
                    <>
                        <button
                            onClick={toggleMute}
                            style={{
                                ...styles.controlBtn,
                                ...(isMuted ? styles.controlBtnActive : {}),
                            }}
                        >
                            {isMuted ? '🔇' : '🎤'}
                            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>

                        <button onClick={handleLeave} style={styles.leaveBtn}>
                            📵 End Call
                        </button>
                    </>
                )}

                {status === 'disconnected' && (
                    <button onClick={joinCall} style={styles.rejoinBtn}>
                        📞 Rejoin Call
                    </button>
                )}
            </div>

            {/* Audio-Only Notice */}
            <p style={styles.notice}>
                🎧 This is an audio-only call. Make sure your microphone is enabled.
            </p>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
    },
    statusBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
    },
    statusDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        animation: 'pulse 2s infinite',
    },
    statusText: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        fontWeight: 600,
    },
    error: {
        padding: 'var(--spacing-md)',
        background: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-lg)',
    },
    callDisplay: {
        marginBottom: 'var(--spacing-xl)',
    },
    avatar: {
        width: '120px',
        height: '120px',
        margin: '0 auto var(--spacing-md)',
        background: 'var(--color-primary-light)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarIcon: {
        fontSize: '48px',
    },
    participantName: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 700,
        margin: '0 0 var(--spacing-sm)',
    },
    duration: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        color: 'var(--color-primary)',
        margin: 0,
        fontFamily: 'monospace',
    },
    remoteCount: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-success)',
        margin: 'var(--spacing-sm) 0 0',
    },
    controls: {
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
        flexWrap: 'wrap',
    },
    joinBtn: {
        padding: 'var(--spacing-lg) var(--spacing-xl)',
        background: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        cursor: 'pointer',
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    controlBtn: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        minWidth: '80px',
    },
    controlBtnActive: {
        background: 'var(--color-warning-light)',
        borderColor: 'var(--color-warning)',
    },
    leaveBtn: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'var(--color-danger)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    rejoinBtn: {
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 700,
        cursor: 'pointer',
    },
    notice: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        margin: 0,
    },
};
