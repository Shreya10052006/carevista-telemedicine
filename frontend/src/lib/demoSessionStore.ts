/**
 * Demo Session Store
 * ==================
 * Session-based storage for dynamic demo data.
 * All new entries during demo mode are stored here.
 * 
 * This allows demo accounts to behave exactly like real accounts:
 * - Add new logbook entries
 * - Complete chatbot intakes
 * - Book consultations
 * - Manage consent
 */

import { LogbookEntry, DEMO_LOGBOOK_ENTRIES, DEMO_MODE, Consultation, DEMO_CONSULTATIONS } from './demoData';

// ==================== STORAGE KEYS ====================

const STORAGE_KEYS = {
    DYNAMIC_ENTRIES: 'demo_dynamic_logbook',
    GLOBAL_CONSENT: 'demo_global_consent',
    CONSENT_TIMESTAMP: 'demo_consent_timestamp',
    SHARED_WITH_DOCTOR: 'demo_shared_data',
    BOOKED_APPOINTMENTS: 'demo_booked_appointments',
};

// ==================== LOGBOOK ENTRIES ====================

/**
 * Get all logbook entries (pre-populated + dynamic)
 */
export function getAllLogbookEntries(userId: string): LogbookEntry[] {
    if (!DEMO_MODE) return [];

    // Get pre-populated entries for this user
    const prePopulated = DEMO_LOGBOOK_ENTRIES.filter(e => e.patientId === userId);

    // Get dynamic entries from session storage
    const dynamicEntries = getDynamicEntries(userId);

    // Merge and sort by date (newest first)
    const allEntries = [...prePopulated, ...dynamicEntries];
    return allEntries.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Get only dynamic entries added during this session
 */
export function getDynamicEntries(userId: string): LogbookEntry[] {
    if (!DEMO_MODE) return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.DYNAMIC_ENTRIES);
        if (!stored) return [];

        const allDynamic: LogbookEntry[] = JSON.parse(stored);
        return allDynamic.filter(e => e.patientId === userId);
    } catch {
        return [];
    }
}

/**
 * Add a new logbook entry (demo mode)
 */
export function addLogbookEntry(entry: LogbookEntry): void {
    if (!DEMO_MODE) return;

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.DYNAMIC_ENTRIES);
        const existing: LogbookEntry[] = stored ? JSON.parse(stored) : [];
        existing.push(entry);
        localStorage.setItem(STORAGE_KEYS.DYNAMIC_ENTRIES, JSON.stringify(existing));
    } catch (error) {
        console.error('Failed to save demo entry:', error);
    }
}

/**
 * Create a new logbook entry with auto-generated ID
 */
export function createLogbookEntry(
    userId: string,
    type: 'manual' | 'voice' | 'chatbot',
    originalText: string,
    structuredSummary: LogbookEntry['structuredSummary'],
    audioRef?: string
): LogbookEntry {
    const entry: LogbookEntry = {
        id: `demo-entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientId: userId,
        type,
        createdAt: new Date().toISOString(),
        originalText,
        structuredSummary,
        audioRef,
        sharedWithDoctor: false,
        doctorReviewed: false,
    };

    addLogbookEntry(entry);
    return entry;
}

// ==================== GLOBAL CONSENT ====================

export interface GlobalConsent {
    granted: boolean;
    grantedAt?: number; // Alias for timestamp for convenience
    timestamp: number;
    consultationId?: string;
    scope: 'all' | 'selected';
    selectedEntryIds?: string[];
    includeReports: boolean;
}

/**
 * Get current global consent state
 */
export function getGlobalConsent(): GlobalConsent | null {
    if (!DEMO_MODE) return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_CONSENT);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

/**
 * Grant global consent for data sharing
 */
export function grantGlobalConsent(
    consultationId: string,
    scope: 'all' | 'selected' = 'all',
    selectedEntryIds?: string[],
    includeReports: boolean = true
): GlobalConsent {
    const consent: GlobalConsent = {
        granted: true,
        timestamp: Date.now(),
        consultationId,
        scope,
        selectedEntryIds: scope === 'selected' ? selectedEntryIds : undefined,
        includeReports,
    };

    localStorage.setItem(STORAGE_KEYS.GLOBAL_CONSENT, JSON.stringify(consent));
    return consent;
}

/**
 * Revoke global consent immediately
 */
export function revokeGlobalConsent(): void {
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_CONSENT);
    localStorage.removeItem(STORAGE_KEYS.SHARED_WITH_DOCTOR);
}

/**
 * Check if data is currently shared with doctor
 */
export function isDataSharedWithDoctor(): boolean {
    const consent = getGlobalConsent();
    return consent?.granted === true;
}

/**
 * Get entries that are shared with doctor (respects consent)
 */
export function getSharedEntries(userId: string): LogbookEntry[] {
    const consent = getGlobalConsent();

    if (!consent?.granted) {
        return []; // No consent = no data shared
    }

    const allEntries = getAllLogbookEntries(userId);

    if (consent.scope === 'all') {
        return allEntries;
    }

    // Only selected entries
    if (consent.selectedEntryIds) {
        return allEntries.filter(e => consent.selectedEntryIds!.includes(e.id));
    }

    return [];
}

// ==================== SESSION CLEANUP ====================

/**
 * Clear all demo session data (on logout)
 */
export function clearDemoSession(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// ==================== PRESCRIPTIONS ====================

import { Prescription } from './demoData';

const PRESCRIPTION_KEY = 'demo_prescriptions';

export interface StoredPrescription {
    id: string;
    patientId: string;
    doctorId: string;
    prescriptions: Prescription[];
    consultationNotes: string;
    createdAt: string;
}

/**
 * Add a prescription for a patient (demo mode)
 */
export function addDemoPrescription(
    patientId: string,
    doctorId: string,
    prescriptions: Prescription[],
    consultationNotes: string
): StoredPrescription {
    if (!DEMO_MODE) {
        return {
            id: '',
            patientId,
            doctorId,
            prescriptions,
            consultationNotes,
            createdAt: new Date().toISOString(),
        };
    }

    const stored = localStorage.getItem(PRESCRIPTION_KEY);
    const existing: StoredPrescription[] = stored ? JSON.parse(stored) : [];

    const newPrescription: StoredPrescription = {
        id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientId,
        doctorId,
        prescriptions,
        consultationNotes,
        createdAt: new Date().toISOString(),
    };

    existing.push(newPrescription);
    localStorage.setItem(PRESCRIPTION_KEY, JSON.stringify(existing));

    return newPrescription;
}

/**
 * Get prescriptions for a patient (demo mode)
 */
export function getDemoPrescriptions(patientId: string): Prescription[] {
    if (!DEMO_MODE) return [];

    try {
        const stored = localStorage.getItem(PRESCRIPTION_KEY);
        if (!stored) return [];

        const allPrescriptions: StoredPrescription[] = JSON.parse(stored);
        const patientRx = allPrescriptions.find(p => p.patientId === patientId);
        return patientRx?.prescriptions || [];
    } catch {
        return [];
    }
}

export function getPatientPrescriptionHistory(patientId: string): StoredPrescription[] {
    if (!DEMO_MODE) return [];

    try {
        const stored = localStorage.getItem(PRESCRIPTION_KEY);
        if (!stored) return [];

        const allPrescriptions: StoredPrescription[] = JSON.parse(stored);
        return allPrescriptions.filter(p => p.patientId === patientId);
    } catch {
        return [];
    }
}

// ==================== COMMUNITY DISCUSSIONS ====================

const COMMUNITY_REPLIES_KEY = 'demo_community_replies';
const COMMUNITY_POSTS_KEY = 'demo_community_posts';

import { CommunityPost, CommunityReply, DEMO_COMMUNITY_POSTS } from './demoData';

export interface StoredCommunityReply {
    postId: string;
    reply: CommunityReply;
}

export interface StoredCommunityPost extends CommunityPost {
    isNew?: boolean;
}

/**
 * Add a reply to a community post (demo mode)
 */
export function addCommunityReply(
    postId: string,
    doctorId: string,
    doctorName: string,
    specialty: string,
    content: string
): CommunityReply {
    if (!DEMO_MODE) {
        return {
            id: '',
            doctorId,
            doctorName,
            specialty,
            content,
            createdAt: new Date().toISOString(),
        };
    }

    const newReply: CommunityReply = {
        id: `reply-new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        doctorId,
        doctorName,
        specialty,
        content,
        createdAt: new Date().toISOString(),
    };

    try {
        const stored = localStorage.getItem(COMMUNITY_REPLIES_KEY);
        const existing: StoredCommunityReply[] = stored ? JSON.parse(stored) : [];
        existing.push({ postId, reply: newReply });
        localStorage.setItem(COMMUNITY_REPLIES_KEY, JSON.stringify(existing));
    } catch (error) {
        console.error('Failed to save community reply:', error);
    }

    return newReply;
}

/**
 * Get all replies for a post (combines static + dynamic)
 */
export function getCommunityReplies(postId: string): CommunityReply[] {
    if (!DEMO_MODE) return [];

    // Get static replies from demo data
    const staticPost = DEMO_COMMUNITY_POSTS.find(p => p.id === postId);
    const staticReplies = staticPost?.replies || [];

    // Get dynamic replies from localStorage
    try {
        const stored = localStorage.getItem(COMMUNITY_REPLIES_KEY);
        if (!stored) return staticReplies;

        const allReplies: StoredCommunityReply[] = JSON.parse(stored);
        const dynamicReplies = allReplies
            .filter(r => r.postId === postId)
            .map(r => r.reply);

        return [...staticReplies, ...dynamicReplies].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    } catch {
        return staticReplies;
    }
}

/**
 * Add a new community post (demo mode)
 */
export function addCommunityPost(
    doctorId: string,
    doctorName: string,
    specialty: string,
    title: string,
    content: string,
    tags: string[]
): CommunityPost {
    const newPost: CommunityPost = {
        id: `post-new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        doctorId,
        doctorName,
        specialty,
        title,
        content,
        tags,
        createdAt: new Date().toISOString(),
        replies: [],
    };

    if (!DEMO_MODE) return newPost;

    try {
        const stored = localStorage.getItem(COMMUNITY_POSTS_KEY);
        const existing: CommunityPost[] = stored ? JSON.parse(stored) : [];
        existing.unshift(newPost);
        localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(existing));
    } catch (error) {
        console.error('Failed to save community post:', error);
    }

    return newPost;
}

/**
 * Get all community posts (combines static + dynamic)
 */
export function getAllCommunityPosts(): CommunityPost[] {
    if (!DEMO_MODE) return [];

    // Get dynamic posts from localStorage
    let dynamicPosts: CommunityPost[] = [];
    try {
        const stored = localStorage.getItem(COMMUNITY_POSTS_KEY);
        if (stored) {
            dynamicPosts = JSON.parse(stored);
        }
    } catch {
        dynamicPosts = [];
    }

    // Merge with static posts, adding dynamic replies
    const allPosts = [...dynamicPosts, ...DEMO_COMMUNITY_POSTS].map(post => ({
        ...post,
        replies: getCommunityReplies(post.id),
    }));

    return allPosts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// ==================== BOOKED APPOINTMENTS ====================

/**
 * Book a new consultation appointment (demo mode)
 */
export function bookAppointment(
    patientId: string,
    doctorId: string,
    doctorName: string,
    doctorSpecialty: string,
    type: 'audio' | 'video',
    sharedEntries?: string[]
): Consultation {
    const appointment: Consultation = {
        id: `appt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientId,
        doctorName,
        doctorSpecialty,
        date: new Date().toISOString(),
        type,
        status: 'scheduled',
    };

    if (!DEMO_MODE) return appointment;

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.BOOKED_APPOINTMENTS);
        const existing: Consultation[] = stored ? JSON.parse(stored) : [];
        existing.push(appointment);
        localStorage.setItem(STORAGE_KEYS.BOOKED_APPOINTMENTS, JSON.stringify(existing));
    } catch (error) {
        console.error('Failed to save appointment:', error);
    }

    return appointment;
}

/**
 * Get all appointments for a patient (combines static + booked)
 */
export function getAllAppointments(patientId: string): Consultation[] {
    if (!DEMO_MODE) return [];

    // Get pre-populated consultations
    const staticConsults = DEMO_CONSULTATIONS.filter(c => c.patientId === patientId);

    // Get dynamically booked appointments
    let dynamicAppointments: Consultation[] = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.BOOKED_APPOINTMENTS);
        if (stored) {
            const allBooked: Consultation[] = JSON.parse(stored);
            dynamicAppointments = allBooked.filter(a => a.patientId === patientId);
        }
    } catch {
        dynamicAppointments = [];
    }

    // Merge and sort by date (newest first)
    return [...dynamicAppointments, ...staticConsults].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/**
 * Get only dynamically booked appointments
 */
export function getBookedAppointments(patientId: string): Consultation[] {
    if (!DEMO_MODE) return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.BOOKED_APPOINTMENTS);
        if (!stored) return [];

        const allBooked: Consultation[] = JSON.parse(stored);
        return allBooked.filter(a => a.patientId === patientId);
    } catch {
        return [];
    }
}
