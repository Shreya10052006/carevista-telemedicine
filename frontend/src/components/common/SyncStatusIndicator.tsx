'use client';

/**
 * Sync Status Indicator (Phase 3)
 * ================================
 * Shows clear sync status for offline data.
 * 
 * OFFLINE-FIRST:
 * - Shows pending items count
 * - Indicates sync in progress
 * - Shows last sync time
 */

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
    getUnsyncedRecordings,
    getUnsyncedSymptoms,
    getUnsyncedVitals,
    getUnsyncedReports,
} from '@/lib/indexedDB';

interface SyncStatusIndicatorProps {
    compact?: boolean;
    onSyncClick?: () => void;
}

export function SyncStatusIndicator({
    compact = false,
    onSyncClick,
}: SyncStatusIndicatorProps) {
    const isOnline = useOnlineStatus();
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

    // Check pending items
    const checkPending = useCallback(async () => {
        try {
            const [recordings, symptoms, vitals, reports] = await Promise.all([
                getUnsyncedRecordings(),
                getUnsyncedSymptoms(),
                getUnsyncedVitals(),
                getUnsyncedReports(),
            ]);
            const total =
                recordings.length + symptoms.length + vitals.length + reports.length;
            setPendingCount(total);
        } catch (error) {
            console.error('Failed to check pending items:', error);
        }
    }, []);

    // Check on mount and when online status changes
    useEffect(() => {
        checkPending();
        const interval = setInterval(checkPending, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [checkPending, isOnline]);

    // Handle sync click
    const handleSync = useCallback(async () => {
        if (!isOnline || pendingCount === 0) return;
        setIsSyncing(true);
        onSyncClick?.();
        // Simulate sync delay (actual sync would be in syncService)
        setTimeout(() => {
            setIsSyncing(false);
            setLastSyncTime(Date.now());
            checkPending();
        }, 2000);
    }, [isOnline, pendingCount, onSyncClick, checkPending]);

    // Format last sync time
    const formatLastSync = (time: number) => {
        const diff = Date.now() - time;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
    };

    // Status color and icon
    const getStatus = () => {
        if (!isOnline) {
            return { icon: '📴', text: 'Offline', color: 'var(--color-warning)' };
        }
        if (isSyncing) {
            return { icon: '🔄', text: 'Syncing...', color: 'var(--color-primary)' };
        }
        if (pendingCount > 0) {
            return {
                icon: '⏳',
                text: `${pendingCount} pending`,
                color: 'var(--color-warning)',
            };
        }
        return { icon: '✓', text: 'Synced', color: 'var(--color-success)' };
    };

    const status = getStatus();

    if (compact) {
        return (
            <div
                style={{
                    ...styles.compactContainer,
                    background: status.color,
                }}
                onClick={handleSync}
            >
                <span>{status.icon}</span>
                {!isOnline && <span style={styles.compactText}>Offline</span>}
                {pendingCount > 0 && isOnline && (
                    <span style={styles.compactText}>{pendingCount}</span>
                )}
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.statusRow}>
                <div style={styles.statusInfo}>
                    <span style={{ ...styles.statusDot, background: status.color }} />
                    <span style={styles.statusText}>{status.text}</span>
                </div>

                {isOnline && pendingCount > 0 && !isSyncing && (
                    <button onClick={handleSync} style={styles.syncBtn}>
                        🔄 Sync Now
                    </button>
                )}
            </div>

            {lastSyncTime && (
                <p style={styles.lastSync}>
                    Last synced: {formatLastSync(lastSyncTime)}
                </p>
            )}

            {!isOnline && (
                <p style={styles.offlineNote}>
                    📴 Working offline. Data will sync when connected.
                </p>
            )}
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
    },
    statusRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    statusDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
    },
    statusText: {
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
    },
    syncBtn: {
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
        cursor: 'pointer',
    },
    lastSync: {
        fontSize: 'var(--font-size-xs)',
        color: 'var(--text-muted)',
        margin: 'var(--spacing-xs) 0 0',
    },
    offlineNote: {
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-warning)',
        margin: 'var(--spacing-xs) 0 0',
    },
    compactContainer: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: 'var(--radius-full)',
        color: 'white',
        fontSize: 'var(--font-size-xs)',
        cursor: 'pointer',
    },
    compactText: {
        fontWeight: 600,
    },
};
