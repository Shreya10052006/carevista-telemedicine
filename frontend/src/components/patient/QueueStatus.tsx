'use client';

/**
 * Queue Status Component (Patient View)
 * =====================================
 * Shows consultation queue position safely.
 * 
 * WHAT WE SHOW:
 * ✓ Status text (waiting, reviewing, starting soon)
 * ✓ Estimated wait time (optional, approximate)
 * ✓ Refresh indicator
 * 
 * WHAT WE DON'T SHOW:
 * ✗ Triage colors
 * ✗ Severity labels
 * ✗ Patient ranking
 * ✗ Medical language
 */

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// ==================== TYPES ====================

export type QueueStatusType =
    | 'waiting'
    | 'reviewing'
    | 'starting_soon'
    | 'in_progress'
    | 'unknown';

interface QueueStatusData {
    status: QueueStatusType;
    estimatedWaitMinutes?: number;
    lastUpdated: number;
}

// ==================== STATUS MESSAGES ====================

const STATUS_MESSAGES: Record<QueueStatusType, { en: string; ta: string; hi: string }> = {
    waiting: {
        en: 'Waiting for doctor',
        ta: 'மருத்துவருக்காக காத்திருக்கிறது',
        hi: 'डॉक्टर की प्रतीक्षा में',
    },
    reviewing: {
        en: 'Doctor is reviewing your details',
        ta: 'மருத்துவர் உங்கள் விவரங்களை பார்க்கிறார்',
        hi: 'डॉक्टर आपकी जानकारी देख रहे हैं',
    },
    starting_soon: {
        en: 'Consultation starting soon',
        ta: 'ஆலோசனை விரைவில் தொடங்கும்',
        hi: 'परामर्श जल्द शुरू होगा',
    },
    in_progress: {
        en: 'Consultation in progress',
        ta: 'ஆலோசனை நடைபெறுகிறது',
        hi: 'परामर्श जारी है',
    },
    unknown: {
        en: 'Your consultation is queued. We will notify you.',
        ta: 'உங்கள் ஆலோசனை வரிசையில் உள்ளது. நாங்கள் உங்களுக்கு தெரிவிப்போம்.',
        hi: 'आपका परामर्श कतार में है। हम आपको सूचित करेंगे।',
    },
};

// ==================== COMPONENT ====================

interface QueueStatusProps {
    consultationId?: string;
    onStatusChange?: (status: QueueStatusType) => void;
}

export function QueueStatus({ consultationId, onStatusChange }: QueueStatusProps) {
    const { t, language } = useLanguage();

    const [data, setData] = useState<QueueStatusData>({
        status: 'unknown',
        lastUpdated: Date.now(),
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Simulate queue status updates (in production, poll backend)
    const fetchStatus = useCallback(async () => {
        if (!consultationId) return;

        setIsRefreshing(true);

        try {
            // Demo mode: simulate status progression
            const elapsed = Date.now() - data.lastUpdated;
            let newStatus: QueueStatusType = data.status;
            let waitMinutes = data.estimatedWaitMinutes;

            // Simulate progression every 30 seconds
            if (elapsed > 30000 && data.status === 'unknown') {
                newStatus = 'waiting';
                waitMinutes = Math.floor(Math.random() * 10) + 5;
            } else if (elapsed > 60000 && data.status === 'waiting') {
                newStatus = 'reviewing';
                waitMinutes = Math.floor(Math.random() * 5) + 2;
            } else if (elapsed > 90000 && data.status === 'reviewing') {
                newStatus = 'starting_soon';
                waitMinutes = 1;
            }

            setData({
                status: newStatus,
                estimatedWaitMinutes: waitMinutes,
                lastUpdated: Date.now(),
            });

            onStatusChange?.(newStatus);
        } catch (error) {
            console.error('Failed to fetch queue status:', error);
            // On error, show fail-safe message
            setData(prev => ({ ...prev, status: 'unknown' }));
        } finally {
            setIsRefreshing(false);
        }
    }, [consultationId, data, onStatusChange]);

    // Poll for updates every 15 seconds
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Get status message
    const statusMessage = STATUS_MESSAGES[data.status][language] || STATUS_MESSAGES[data.status].en;

    // Get status icon
    const getStatusIcon = () => {
        switch (data.status) {
            case 'waiting': return '⏳';
            case 'reviewing': return '👁️';
            case 'starting_soon': return '🔔';
            case 'in_progress': return '📞';
            default: return '📋';
        }
    };

    return (
        <div style={styles.container}>
            {/* Status Card */}
            <div style={styles.statusCard}>
                <div style={styles.iconContainer}>
                    <span style={styles.icon}>{getStatusIcon()}</span>
                </div>

                <div style={styles.statusContent}>
                    <p style={styles.statusText}>{statusMessage}</p>

                    {data.estimatedWaitMinutes !== undefined && data.status !== 'unknown' && (
                        <p style={styles.waitTime}>
                            {t('Estimated wait')}: ~{data.estimatedWaitMinutes} {t('minutes')}
                        </p>
                    )}
                </div>

                {/* Refresh Indicator */}
                <button
                    onClick={fetchStatus}
                    disabled={isRefreshing}
                    style={styles.refreshBtn}
                    aria-label="Refresh status"
                >
                    {isRefreshing ? '🔄' : '↻'}
                </button>
            </div>

            {/* Reassurance Message */}
            <p style={styles.reassurance}>
                {t('You will be notified when the doctor is ready')}
            </p>
        </div>
    );
}

// ==================== STYLES ====================

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '16px',
    },
    statusCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    },
    iconContainer: {
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdfa, #ecfeff)',
        borderRadius: '50%',
    },
    icon: {
        fontSize: '28px',
    },
    statusContent: {
        flex: 1,
    },
    statusText: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: '#0f172a',
    },
    waitTime: {
        margin: '6px 0 0 0',
        fontSize: '14px',
        color: '#64748b',
    },
    refreshBtn: {
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '50%',
        fontSize: '18px',
        cursor: 'pointer',
    },
    reassurance: {
        marginTop: '12px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#64748b',
    },
};

export default QueueStatus;
