'use client';

/**
 * Sync Banner Component
 * =====================
 * Shows offline sync status clearly to users.
 * 
 * STATES:
 * - "Saved locally" → offline but data saved
 * - "Syncing…" → sync in progress
 * - "All data synced" → everything up to date
 */

import { useOffline } from '@/hooks/useOffline';
import { useLanguage } from '@/contexts/LanguageContext';

// ==================== STATUS MESSAGES ====================

const STATUS_CONFIG = {
    offline: {
        icon: '📴',
        messageKey: 'You are offline. Data saved locally.',
        color: '#f59e0b',
        bgColor: '#fef3c7',
    },
    syncing: {
        icon: '🔄',
        messageKey: 'Syncing your data...',
        color: '#3b82f6',
        bgColor: '#dbeafe',
    },
    synced: {
        icon: '✅',
        messageKey: 'All data synced',
        color: '#10b981',
        bgColor: '#d1fae5',
    },
    pending: {
        icon: '⏳',
        messageKey: 'Data pending sync',
        color: '#f59e0b',
        bgColor: '#fef3c7',
    },
};

// ==================== COMPONENT ====================

interface SyncBannerProps {
    showWhenSynced?: boolean; // Whether to show when everything is synced
    compact?: boolean; // Smaller version
}

export function SyncBanner({ showWhenSynced = false, compact = false }: SyncBannerProps) {
    const { isOnline, isSyncing, pendingCount, lastSyncAt } = useOffline();
    const { t } = useLanguage();

    // Determine current state
    let status: keyof typeof STATUS_CONFIG;

    if (!isOnline) {
        status = 'offline';
    } else if (isSyncing) {
        status = 'syncing';
    } else if (pendingCount > 0) {
        status = 'pending';
    } else {
        status = 'synced';
    }

    // Hide if synced and showWhenSynced is false
    if (status === 'synced' && !showWhenSynced) {
        return null;
    }

    const config = STATUS_CONFIG[status];
    const message = t(config.messageKey);

    // Format last sync time
    const formatLastSync = () => {
        if (!lastSyncAt) return '';
        const date = new Date(lastSyncAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return t('Just now');
        if (diffMins < 60) return `${diffMins} ${t('minutes ago')}`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (compact) {
        return (
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: config.bgColor,
                    color: config.color,
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                }}
            >
                <span>{config.icon}</span>
                <span>{message}</span>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: config.bgColor,
                color: config.color,
            }}
        >
            <span style={{ fontSize: '18px' }}>{config.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>

            {/* Pending count */}
            {pendingCount > 0 && (
                <span style={{ fontSize: '13px' }}>
                    ({pendingCount} {t('pending')})
                </span>
            )}

            {/* Last sync time (when synced) */}
            {status === 'synced' && lastSyncAt && (
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                    • {formatLastSync()}
                </span>
            )}
        </div>
    );
}

export default SyncBanner;
