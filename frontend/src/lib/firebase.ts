/**
 * Firebase Client Configuration
 * =============================
 * Initializes Firebase for client-side authentication.
 * 
 * SECURITY:
 * - API keys are loaded from environment variables
 * - Never commit actual credentials to version control
 * - Phone auth for patients, email/password for doctors
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    ConfirmationResult,
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
} from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

// ==================== AUTHENTICATION ====================

/**
 * Setup reCAPTCHA for phone authentication
 */
export function setupRecaptcha(elementId: string): RecaptchaVerifier {
    if (typeof window === 'undefined' || !auth) {
        throw new Error('Cannot setup reCAPTCHA on server side');
    }
    return new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA verified
        },
    });
}

/**
 * Send OTP to phone number (for patients)
 */
export async function sendPhoneOTP(
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
    if (!auth) throw new Error('Firebase auth not initialized');
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

/**
 * Verify OTP and sign in
 */
export async function verifyOTP(
    confirmationResult: ConfirmationResult,
    otp: string
): Promise<User> {
    const result = await confirmationResult.confirm(otp);
    return result.user;
}

/**
 * Sign in with email and password (for doctors)
 */
export async function signInDoctor(
    email: string,
    password: string
): Promise<User> {
    if (!auth) throw new Error('Firebase auth not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

/**
 * Sign out
 */
export async function logOut(): Promise<void> {
    if (typeof window === 'undefined' || !auth) return;
    return signOut(auth);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
    return auth?.currentUser || null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
    if (typeof window === 'undefined' || !auth) {
        // Return a no-op unsubscribe during SSR
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
}

/**
 * Get user's Firebase ID token
 */
export async function getIdToken(): Promise<string | null> {
    const user = getCurrentUser();
    if (!user) return null;
    return user.getIdToken();
}

// ==================== USER ROLES ====================

export type UserRole = 'patient' | 'doctor' | 'health_worker';

export interface UserProfile {
    uid: string;
    role: UserRole;
    displayName?: string;
    phoneNumber?: string;
    email?: string;
    createdAt: Timestamp;
    lastLogin: Timestamp;
}

/**
 * Create or update user profile
 */
export async function createUserProfile(
    uid: string,
    role: UserRole,
    additionalData: Partial<UserProfile> = {}
): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const now = Timestamp.now();

    // Filter out undefined values to prevent Firestore error
    const cleanData: Record<string, any> = {
        uid,
        role,
        lastLogin: now,
        createdAt: now,
    };

    // Only add defined values from additionalData
    Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanData[key] = value;
        }
    });

    await setDoc(userRef, cleanData, { merge: true });
}

/**
 * Get user profile and role
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) return null;
    return snapshot.data() as UserProfile;
}

// ==================== CONSENT MANAGEMENT ====================

export interface ConsentRecord {
    id: string;
    patientUid: string;
    consentType: 'recording' | 'transcription' | 'doctor_sharing';
    granted: boolean;
    grantedAt: Timestamp;
    revokedAt?: Timestamp;
    language: string;
    // Phase 2: Assisted Mode fields
    isAssistedSession?: boolean;
    assistedByUid?: string;  // Health worker's UID if assisted
}

/**
 * Store consent record
 * 
 * ETHICAL SAFEGUARD:
 * - Every consent is timestamped
 * - Consent can be revoked anytime
 * - No processing without explicit consent
 */
export async function storeConsent(
    patientUid: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    language: string,
    // Phase 2: Optional assisted mode parameters
    assistedByUid?: string
): Promise<string> {
    const consentRef = doc(collection(db, 'consents'));
    const now = Timestamp.now();

    const consentData: any = {
        id: consentRef.id,
        patientUid,
        consentType,
        granted,
        grantedAt: now,
        language,
    };

    // Phase 2: Mark consent as assisted if health worker is facilitating
    if (assistedByUid) {
        consentData.isAssistedSession = true;
        consentData.assistedByUid = assistedByUid;
    }

    await setDoc(consentRef, consentData);

    return consentRef.id;
}

/**
 * Check if user has active consent
 */
export async function hasActiveConsent(
    patientUid: string,
    consentType: ConsentRecord['consentType']
): Promise<boolean> {
    const consentsRef = collection(db, 'consents');
    const q = query(
        consentsRef,
        where('patientUid', '==', patientUid),
        where('consentType', '==', consentType),
        where('granted', '==', true)
    );

    const snapshot = await getDocs(q);

    // Check if any consent is not revoked
    for (const doc of snapshot.docs) {
        const consent = doc.data() as ConsentRecord;
        if (!consent.revokedAt) {
            return true;
        }
    }

    return false;
}

/**
 * Revoke consent
 */
export async function revokeConsent(
    patientUid: string,
    consentType: ConsentRecord['consentType']
): Promise<void> {
    const consentsRef = collection(db, 'consents');
    const q = query(
        consentsRef,
        where('patientUid', '==', patientUid),
        where('consentType', '==', consentType),
        where('granted', '==', true)
    );

    const snapshot = await getDocs(q);
    const now = Timestamp.now();

    for (const docSnapshot of snapshot.docs) {
        await setDoc(doc(db, 'consents', docSnapshot.id), {
            revokedAt: now,
            granted: false,
        }, { merge: true });
    }
}

export { auth, db };
