'use client';

/**
 * Offline Status Hook
 * ===================
 * Tracks network status and sync state for offline-first behavior.
 */

import { useState, useEffect } from 'react';
import {
    initSyncService,
    onSyncStatusChange,
    getSyncStatus,
    triggerSync,
    forceSync,
    SyncStatus,
} from '@/lib/syncQueue';

export function useOffline() {
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

    useEffect(() => {
        // Check initial online status
        setIsOnline(navigator.onLine);

        // Network status listeners
        const handleOnline = () => {
            setIsOnline(true);
            triggerSync();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initialize sync service
        initSyncService();

        // Subscribe to sync status changes
        const unsubscribe = onSyncStatusChange(setSyncStatus);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline,
        syncStatus,
        isSyncing: syncStatus.isSyncing,
        pendingCount: syncStatus.pendingCount,
        lastSyncAt: syncStatus.lastSyncAt,
        syncErrors: syncStatus.errors,
        forceSync: async () => {
            if (isOnline) {
                await forceSync();
            }
        },
    };
}
