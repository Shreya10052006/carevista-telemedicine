/**
 * Offline → Online Sync Queue
 * ===========================
 * Handles automatic synchronization of offline data when network becomes available.
 * 
 * OFFLINE-FIRST STRATEGY:
 * - All data saved locally first
 * - Background sync when online
 * - Last-write-wins conflict resolution
 * - User always sees local data immediately
 * 
 * ETHICAL SAFEGUARD:
 * - Only syncs data with valid consent
 * - Consent verification happens on backend
 */

import {
    getUnsyncedRecordings,
    getUnsyncedSymptoms,
    getSyncQueue,
    addToSyncQueue,
    updateSyncQueueItem,
    removeFromSyncQueue,
    markRecordingSynced,
    markSymptomSynced,
} from './indexedDB';
import { uploadRecording, uploadSymptom } from './api';

// Sync state
let isSyncing = false;
let syncListeners: ((status: SyncStatus) => void)[] = [];

export interface SyncStatus {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt: number | null;
    errors: string[];
}

let currentStatus: SyncStatus = {
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    errors: [],
};

/**
 * Initialize sync service
 * Sets up network listeners for auto-sync
 */
export function initSyncService(): void {
    if (typeof window === 'undefined') return;

    // Listen for online status
    window.addEventListener('online', () => {
        console.log('[Sync] Network available, starting sync...');
        triggerSync();
    });

    // Listen for service worker sync messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_TRIGGERED') {
                triggerSync();
            }
        });
    }

    // Initial sync if online
    if (navigator.onLine) {
        triggerSync();
    }

    // Update pending count periodically
    setInterval(updatePendingCount, 10000);
}

/**
 * Subscribe to sync status updates
 */
export function onSyncStatusChange(
    callback: (status: SyncStatus) => void
): () => void {
    syncListeners.push(callback);
    callback(currentStatus); // Immediate callback with current status

    return () => {
        syncListeners = syncListeners.filter((cb) => cb !== callback);
    };
}

/**
 * Notify all listeners of status change
 */
function notifyStatusChange(): void {
    syncListeners.forEach((cb) => cb(currentStatus));
}

/**
 * Update pending count
 */
async function updatePendingCount(): Promise<void> {
    const recordings = await getUnsyncedRecordings();
    const symptoms = await getUnsyncedSymptoms();
    currentStatus.pendingCount = recordings.length + symptoms.length;
    notifyStatusChange();
}

/**
 * Trigger sync process
 */
export async function triggerSync(): Promise<void> {
    if (isSyncing || !navigator.onLine) return;

    isSyncing = true;
    currentStatus.isSyncing = true;
    currentStatus.errors = [];
    notifyStatusChange();

    console.log('[Sync] Starting synchronization...');

    try {
        // Sync recordings
        await syncRecordings();

        // Sync text symptoms
        await syncSymptoms();

        // Retry failed items from queue
        await retryFailedItems();

        currentStatus.lastSyncAt = Date.now();
        console.log('[Sync] Synchronization complete');
    } catch (error) {
        console.error('[Sync] Synchronization failed:', error);
        currentStatus.errors.push(String(error));
    } finally {
        isSyncing = false;
        currentStatus.isSyncing = false;
        await updatePendingCount();
        notifyStatusChange();
    }
}

/**
 * Sync audio recordings to backend
 */
async function syncRecordings(): Promise<void> {
    const unsyncedRecordings = await getUnsyncedRecordings();

    for (const recording of unsyncedRecordings) {
        try {
            await uploadRecording(
                recording.id,
                recording.audioBlob,
                recording.language,
                recording.consentId
            );
            await markRecordingSynced(recording.id);
            console.log(`[Sync] Recording ${recording.id} synced`);
        } catch (error) {
            console.warn(`[Sync] Recording ${recording.id} failed:`, error);
            await addToSyncQueue('recording', recording.id);
        }
    }
}

/**
 * Sync text symptoms to backend
 */
async function syncSymptoms(): Promise<void> {
    const unsyncedSymptoms = await getUnsyncedSymptoms();

    for (const symptom of unsyncedSymptoms) {
        try {
            await uploadSymptom(
                symptom.id,
                symptom.text,
                symptom.language,
                symptom.consentId
            );
            await markSymptomSynced(symptom.id);
            console.log(`[Sync] Symptom ${symptom.id} synced`);
        } catch (error) {
            console.warn(`[Sync] Symptom ${symptom.id} failed:`, error);
            await addToSyncQueue('symptom', symptom.id);
        }
    }
}

/**
 * Retry failed items from sync queue
 */
async function retryFailedItems(): Promise<void> {
    const queue = await getSyncQueue();

    for (const item of queue) {
        // Skip items with too many attempts (max 5)
        if (item.attempts >= 5) {
            console.warn(`[Sync] Skipping ${item.id} - max attempts reached`);
            continue;
        }

        // Skip if last attempt was less than 30 seconds ago
        if (Date.now() - item.lastAttempt < 30000) {
            continue;
        }

        try {
            if (item.type === 'recording') {
                // Fetch recording from IndexedDB and retry
                const recordings = await getUnsyncedRecordings();
                const recording = recordings.find((r) => r.id === item.dataId);
                if (recording) {
                    await uploadRecording(
                        recording.id,
                        recording.audioBlob,
                        recording.language,
                        recording.consentId
                    );
                    await markRecordingSynced(recording.id);
                }
            } else if (item.type === 'symptom') {
                const symptoms = await getUnsyncedSymptoms();
                const symptom = symptoms.find((s) => s.id === item.dataId);
                if (symptom) {
                    await uploadSymptom(
                        symptom.id,
                        symptom.text,
                        symptom.language,
                        symptom.consentId
                    );
                    await markSymptomSynced(symptom.id);
                }
            }

            // Remove from queue on success
            await removeFromSyncQueue(item.id);
            console.log(`[Sync] Retry successful for ${item.id}`);
        } catch (error) {
            await updateSyncQueueItem(item.id, String(error));
            console.warn(`[Sync] Retry failed for ${item.id}:`, error);
        }
    }
}

/**
 * Force sync (user-initiated)
 */
export async function forceSync(): Promise<void> {
    if (!navigator.onLine) {
        throw new Error('Cannot sync while offline');
    }
    return triggerSync();
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
    return { ...currentStatus };
}

/**
 * Check if there are pending items
 */
export async function hasPendingItems(): Promise<boolean> {
    const recordings = await getUnsyncedRecordings();
    const symptoms = await getUnsyncedSymptoms();
    return recordings.length > 0 || symptoms.length > 0;
}
