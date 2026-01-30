/**
 * IndexedDB Service for Offline Storage
 * =====================================
 * Stores symptom recordings, consent records, and sync queue locally.
 * 
 * ETHICAL SAFEGUARD:
 * - Audio recordings are stored ONLY after consent is given
 * - Consent records are stored with timestamps
 * - All data is user-scoped (no cross-user access)
 * 
 * OFFLINE-FIRST:
 * - Works entirely without network
 * - Syncs automatically when online
 * - User always sees local data first
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface CareVistaDB extends DBSchema {
    // Audio recordings with consent
    recordings: {
        key: string;
        value: {
            id: string;
            userId: string;
            audioBlob: Blob;
            language: string;
            createdAt: number;
            consentId: string;
            synced: boolean;
            syncedAt?: number;
        };
        indexes: { 'by-user': string; 'by-synced': number };
    };

    // Text symptoms
    symptoms: {
        key: string;
        value: {
            id: string;
            userId: string;
            text: string;
            language: string;
            createdAt: number;
            consentId: string;
            synced: boolean;
            syncedAt?: number;
        };
        indexes: { 'by-user': string; 'by-synced': number };
    };

    // Consent records (local copy)
    consents: {
        key: string;
        value: {
            id: string;
            type: 'recording' | 'transcription' | 'doctor_sharing';
            granted: boolean;
            timestamp: number;
            language: string;
        };
        indexes: { 'by-type': string };
    };

    // Sync queue for failed uploads
    syncQueue: {
        key: string;
        value: {
            id: string;
            type: 'recording' | 'symptom' | 'logbook';
            dataId: string;
            attempts: number;
            lastAttempt: number;
            error?: string;
        };
        indexes: { 'by-attempts': number };
    };

    // Logbook entries (offline storage)
    logbookEntries: {
        key: string;
        value: {
            id: string;
            userId: string;
            type: 'manual' | 'voice' | 'chatbot';
            originalText: string;
            structuredSummary: {
                chiefComplaint: string;
                duration?: string;
                severity?: string;
                additionalNotes?: string;
            };
            audioRef?: string;
            sharedWithDoctor: boolean;
            createdAt: number;
            synced: boolean;
            syncedAt?: number;
        };
        indexes: { 'by-user': string; 'by-synced': number };
    };

    // AI summaries (cached)
    summaries: {
        key: string;
        value: {
            id: string;
            userId: string;
            recordingId?: string;
            symptomId?: string;
            summary: {
                chiefComplaint: string;
                symptomTimeline: string;
                severity: string;
                pastHistory?: string;
                attachedReports?: string[];
            };
            translation?: string;
            translationLanguage?: string;
            createdAt: number;
            // Phase 2: Approval status for doctor sharing
            approvalStatus: 'pending' | 'approved' | 'rejected';
            approvedAt?: number;
            editedSummary?: {
                chiefComplaint: string;
                symptomTimeline: string;
                severity: string;
                pastHistory?: string;
                additionalNotes?: string;
            };
        };
        indexes: { 'by-user': string; 'by-approval': string };
    };

    // Phase 3: Vitals (raw values only - NO interpretation)
    vitals: {
        key: string;
        value: {
            id: string;
            userId: string;
            symptomId?: string;  // Link to symptom entry
            bpSystolic: number | null;
            bpDiastolic: number | null;
            temperature: number | null;
            weight: number | null;
            enteredBy: 'patient' | 'health_worker';
            enteredByUid?: string;  // Health worker UID if assisted
            createdAt: number;
            synced: boolean;
            syncedAt?: number;
        };
        indexes: { 'by-user': string; 'by-synced': number };
    };

    // Phase 3: Reports/Images (consent-gated, no AI interpretation)
    reports: {
        key: string;
        value: {
            id: string;
            userId: string;
            symptomId?: string;
            fileName: string;
            fileType: string;  // 'image/jpeg', 'application/pdf', etc.
            fileBlob: Blob;
            uploadedBy: 'patient' | 'health_worker';
            uploadedByUid?: string;
            approvedForSharing: boolean;  // Must be true for doctor access
            createdAt: number;
            synced: boolean;
            syncedAt?: number;
        };
        indexes: { 'by-user': string; 'by-synced': number };
    };

    // Phase 3: Temporary patient IDs for camp-based care
    temporaryPatients: {
        key: string;
        value: {
            id: string;  // Temporary ID
            name: string;
            phone?: string;
            age?: number;
            gender?: string;
            createdByUid: string;  // Health worker who created
            campName?: string;
            linkedToUid?: string;  // Permanent account when linked
            linkedAt?: number;
            createdAt: number;
        };
        indexes: { 'by-created-by': string; 'by-linked': string };
    };
}

const DB_NAME = 'carevista-db';
const DB_VERSION = 3;  // Added logbookEntries store

let dbInstance: IDBPDatabase<CareVistaDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<CareVistaDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<CareVistaDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Recordings store
            if (!db.objectStoreNames.contains('recordings')) {
                const recordingsStore = db.createObjectStore('recordings', { keyPath: 'id' });
                recordingsStore.createIndex('by-user', 'userId');
                recordingsStore.createIndex('by-synced', 'synced');
            }

            // Symptoms store
            if (!db.objectStoreNames.contains('symptoms')) {
                const symptomsStore = db.createObjectStore('symptoms', { keyPath: 'id' });
                symptomsStore.createIndex('by-user', 'userId');
                symptomsStore.createIndex('by-synced', 'synced');
            }

            // Consents store
            if (!db.objectStoreNames.contains('consents')) {
                const consentsStore = db.createObjectStore('consents', { keyPath: 'id' });
                consentsStore.createIndex('by-type', 'type');
            }

            // Sync queue store
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                syncQueueStore.createIndex('by-attempts', 'attempts');
            }

            // Summaries store
            if (!db.objectStoreNames.contains('summaries')) {
                const summariesStore = db.createObjectStore('summaries', { keyPath: 'id' });
                summariesStore.createIndex('by-user', 'userId');
            }

            // Phase 3: Vitals store
            if (!db.objectStoreNames.contains('vitals')) {
                const vitalsStore = db.createObjectStore('vitals', { keyPath: 'id' });
                vitalsStore.createIndex('by-user', 'userId');
                vitalsStore.createIndex('by-synced', 'synced');
            }

            // Phase 3: Reports store
            if (!db.objectStoreNames.contains('reports')) {
                const reportsStore = db.createObjectStore('reports', { keyPath: 'id' });
                reportsStore.createIndex('by-user', 'userId');
                reportsStore.createIndex('by-synced', 'synced');
            }

            // Phase 3: Temporary patients store
            if (!db.objectStoreNames.contains('temporaryPatients')) {
                const tempPatientsStore = db.createObjectStore('temporaryPatients', { keyPath: 'id' });
                tempPatientsStore.createIndex('by-created-by', 'createdByUid');
                tempPatientsStore.createIndex('by-linked', 'linkedToUid');
            }

            // Logbook entries store (offline persistence)
            if (!db.objectStoreNames.contains('logbookEntries')) {
                const logbookStore = db.createObjectStore('logbookEntries', { keyPath: 'id' });
                logbookStore.createIndex('by-user', 'userId');
                logbookStore.createIndex('by-synced', 'synced');
            }
        },
    });

    return dbInstance;
}

// ==================== RECORDING OPERATIONS ====================

/**
 * Save audio recording locally
 * 
 * ETHICAL SAFEGUARD: Requires consent ID before saving
 */
export async function saveRecording(
    userId: string,
    audioBlob: Blob,
    language: string,
    consentId: string
): Promise<string> {
    const db = await getDB();
    const id = `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('recordings', {
        id,
        userId,
        audioBlob,
        language,
        createdAt: Date.now(),
        consentId,
        synced: false,
    });

    return id;
}

/**
 * Get all recordings for a user
 */
export async function getUserRecordings(userId: string) {
    const db = await getDB();
    return db.getAllFromIndex('recordings', 'by-user', userId);
}

/**
 * Get unsynced recordings
 */
export async function getUnsyncedRecordings() {
    const db = await getDB();
    const all = await db.getAll('recordings');
    return all.filter((r) => !r.synced);
}

/**
 * Mark recording as synced
 */
export async function markRecordingSynced(id: string): Promise<void> {
    const db = await getDB();
    const recording = await db.get('recordings', id);
    if (recording) {
        recording.synced = true;
        recording.syncedAt = Date.now();
        await db.put('recordings', recording);
    }
}

// ==================== SYMPTOM OPERATIONS ====================

/**
 * Save text symptom locally
 */
export async function saveSymptom(
    userId: string,
    text: string,
    language: string,
    consentId: string
): Promise<string> {
    const db = await getDB();
    const id = `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('symptoms', {
        id,
        userId,
        text,
        language,
        createdAt: Date.now(),
        consentId,
        synced: false,
    });

    return id;
}

/**
 * Get all symptoms for a user
 */
export async function getUserSymptoms(userId: string) {
    const db = await getDB();
    return db.getAllFromIndex('symptoms', 'by-user', userId);
}

/**
 * Get unsynced symptoms
 */
export async function getUnsyncedSymptoms() {
    const db = await getDB();
    const all = await db.getAll('symptoms');
    return all.filter((s) => !s.synced);
}

/**
 * Mark symptom as synced
 */
export async function markSymptomSynced(id: string): Promise<void> {
    const db = await getDB();
    const symptom = await db.get('symptoms', id);
    if (symptom) {
        symptom.synced = true;
        symptom.syncedAt = Date.now();
        await db.put('symptoms', symptom);
    }
}

// ==================== CONSENT OPERATIONS ====================

/**
 * Save consent record locally
 */
export async function saveLocalConsent(
    type: 'recording' | 'transcription' | 'doctor_sharing',
    granted: boolean,
    language: string
): Promise<string> {
    const db = await getDB();
    const id = `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('consents', {
        id,
        type,
        granted,
        timestamp: Date.now(),
        language,
    });

    return id;
}

/**
 * Check local consent status
 */
export async function checkLocalConsent(
    type: 'recording' | 'transcription' | 'doctor_sharing'
): Promise<boolean> {
    const db = await getDB();
    const consents = await db.getAllFromIndex('consents', 'by-type', type);

    // Get the most recent consent of this type
    const sorted = consents.sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0]?.granted || false;
}

// ==================== SYNC QUEUE OPERATIONS ====================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
    type: 'recording' | 'symptom',
    dataId: string
): Promise<void> {
    const db = await getDB();
    const id = `sync-${Date.now()}`;

    await db.put('syncQueue', {
        id,
        type,
        dataId,
        attempts: 0,
        lastAttempt: 0,
    });
}

/**
 * Get all items in sync queue
 */
export async function getSyncQueue() {
    const db = await getDB();
    return db.getAll('syncQueue');
}

/**
 * Update sync queue item after attempt
 */
export async function updateSyncQueueItem(
    id: string,
    error?: string
): Promise<void> {
    const db = await getDB();
    const item = await db.get('syncQueue', id);
    if (item) {
        item.attempts += 1;
        item.lastAttempt = Date.now();
        item.error = error;
        await db.put('syncQueue', item);
    }
}

/**
 * Remove item from sync queue (after successful sync)
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('syncQueue', id);
}

// ==================== SUMMARY OPERATIONS ====================

/**
 * Save AI summary locally
 */
export async function saveSummary(
    userId: string,
    summary: CareVistaDB['summaries']['value']['summary'],
    recordingId?: string,
    symptomId?: string,
    translation?: string,
    translationLanguage?: string
): Promise<string> {
    const db = await getDB();
    const id = `summary-${Date.now()}`;

    await db.put('summaries', {
        id,
        userId,
        recordingId,
        symptomId,
        summary,
        translation,
        translationLanguage,
        createdAt: Date.now(),
        // Phase 2: Default to pending approval
        approvalStatus: 'pending',
    });

    return id;
}

/**
 * Get summaries for a user
 */
export async function getUserSummaries(userId: string) {
    const db = await getDB();
    return db.getAllFromIndex('summaries', 'by-user', userId);
}

// ==================== VITALS OPERATIONS (Phase 3) ====================

/**
 * Save vitals locally
 * 
 * ETHICAL SAFEGUARD: Raw values only, NO interpretation
 */
export async function saveVitals(
    userId: string,
    vitals: {
        bpSystolic: number | null;
        bpDiastolic: number | null;
        temperature: number | null;
        weight: number | null;
        enteredBy: 'patient' | 'health_worker';
    },
    symptomId?: string,
    enteredByUid?: string
): Promise<string> {
    const db = await getDB();
    const id = `vitals-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('vitals', {
        id,
        userId,
        symptomId,
        bpSystolic: vitals.bpSystolic,
        bpDiastolic: vitals.bpDiastolic,
        temperature: vitals.temperature,
        weight: vitals.weight,
        enteredBy: vitals.enteredBy,
        enteredByUid,
        createdAt: Date.now(),
        synced: false,
    });

    return id;
}

/**
 * Get vitals for a user
 */
export async function getUserVitals(userId: string) {
    const db = await getDB();
    return db.getAllFromIndex('vitals', 'by-user', userId);
}

/**
 * Get unsynced vitals
 */
export async function getUnsyncedVitals() {
    const db = await getDB();
    const all = await db.getAll('vitals');
    return all.filter((v) => !v.synced);
}

/**
 * Mark vitals as synced
 */
export async function markVitalsSynced(id: string): Promise<void> {
    const db = await getDB();
    const vitals = await db.get('vitals', id);
    if (vitals) {
        vitals.synced = true;
        vitals.syncedAt = Date.now();
        await db.put('vitals', vitals);
    }
}

// ==================== REPORTS OPERATIONS (Phase 3) ====================

/**
 * Save report/image locally
 * 
 * ETHICAL SAFEGUARD: No AI interpretation of reports
 */
export async function saveReport(
    userId: string,
    file: {
        fileName: string;
        fileType: string;
        fileBlob: Blob;
        uploadedBy: 'patient' | 'health_worker';
    },
    symptomId?: string,
    uploadedByUid?: string
): Promise<string> {
    const db = await getDB();
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('reports', {
        id,
        userId,
        symptomId,
        fileName: file.fileName,
        fileType: file.fileType,
        fileBlob: file.fileBlob,
        uploadedBy: file.uploadedBy,
        uploadedByUid,
        approvedForSharing: false,  // Must be explicitly approved
        createdAt: Date.now(),
        synced: false,
    });

    return id;
}

/**
 * Get reports for a user
 */
export async function getUserReports(userId: string) {
    const db = await getDB();
    return db.getAllFromIndex('reports', 'by-user', userId);
}

/**
 * Approve report for doctor sharing
 */
export async function approveReportForSharing(id: string): Promise<void> {
    const db = await getDB();
    const report = await db.get('reports', id);
    if (report) {
        report.approvedForSharing = true;
        await db.put('reports', report);
    }
}

/**
 * Get unsynced reports
 */
export async function getUnsyncedReports() {
    const db = await getDB();
    const all = await db.getAll('reports');
    return all.filter((r) => !r.synced);
}

// ==================== TEMPORARY PATIENTS (Phase 3) ====================

/**
 * Create temporary patient for camp-based care
 */
export async function createTemporaryPatient(
    data: {
        name: string;
        phone?: string;
        age?: number;
        gender?: string;
        campName?: string;
    },
    createdByUid: string
): Promise<string> {
    const db = await getDB();
    const id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('temporaryPatients', {
        id,
        name: data.name,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        campName: data.campName,
        createdByUid,
        createdAt: Date.now(),
    });

    return id;
}

/**
 * Get temporary patients created by a health worker
 */
export async function getTemporaryPatients(createdByUid: string) {
    const db = await getDB();
    return db.getAllFromIndex('temporaryPatients', 'by-created-by', createdByUid);
}

/**
 * Link temporary patient to permanent account
 */
export async function linkTemporaryPatient(
    temporaryId: string,
    permanentUid: string
): Promise<void> {
    const db = await getDB();
    const patient = await db.get('temporaryPatients', temporaryId);
    if (patient) {
        patient.linkedToUid = permanentUid;
        patient.linkedAt = Date.now();
        await db.put('temporaryPatients', patient);
    }
}

// ==================== LOGBOOK ENTRIES (Offline Persistence) ====================

/**
 * Save logbook entry locally
 */
export async function saveLogbookEntry(
    userId: string,
    entry: {
        type: 'manual' | 'voice' | 'chatbot';
        originalText: string;
        structuredSummary: {
            chiefComplaint: string;
            duration?: string;
            severity?: string;
            additionalNotes?: string;
        };
        audioRef?: string;
    }
): Promise<string> {
    const db = await getDB();
    const id = `logbook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('logbookEntries', {
        id,
        userId,
        type: entry.type,
        originalText: entry.originalText,
        structuredSummary: entry.structuredSummary,
        audioRef: entry.audioRef,
        sharedWithDoctor: false,
        createdAt: Date.now(),
        synced: false,
    });

    return id;
}

/**
 * Get all logbook entries for a user
 */
export async function getUserLogbookEntries(userId: string) {
    const db = await getDB();
    const entries = await db.getAllFromIndex('logbookEntries', 'by-user', userId);
    // Sort by createdAt descending (newest first)
    return entries.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get unsynced logbook entries
 */
export async function getUnsyncedLogbookEntries() {
    const db = await getDB();
    const all = await db.getAll('logbookEntries');
    return all.filter((e) => !e.synced);
}

/**
 * Mark logbook entry as synced
 */
export async function markLogbookEntrySynced(id: string): Promise<void> {
    const db = await getDB();
    const entry = await db.get('logbookEntries', id);
    if (entry) {
        entry.synced = true;
        entry.syncedAt = Date.now();
        await db.put('logbookEntries', entry);
    }
}

/**
 * Update logbook entry sharing status
 */
export async function updateLogbookEntrySharing(id: string, shared: boolean): Promise<void> {
    const db = await getDB();
    const entry = await db.get('logbookEntries', id);
    if (entry) {
        entry.sharedWithDoctor = shared;
        await db.put('logbookEntries', entry);
    }
}

// ==================== CLEANUP ====================

/**
 * Clear all local data (for logout)
 */
export async function clearAllData(): Promise<void> {
    const db = await getDB();
    await Promise.all([
        db.clear('recordings'),
        db.clear('symptoms'),
        db.clear('consents'),
        db.clear('syncQueue'),
        db.clear('summaries'),
        db.clear('vitals'),
        db.clear('reports'),
        db.clear('temporaryPatients'),
        db.clear('logbookEntries'),
    ]);
}

