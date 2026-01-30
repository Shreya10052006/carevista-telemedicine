'use client';

/**
 * Patient Switcher Component (Phase 2)
 * =====================================
 * Allows health workers to select which patient they are assisting.
 * 
 * ETHICAL SAFEGUARD:
 * - Health workers cannot view patient history without consent
 * - All assisted actions are logged with health worker ID
 */

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PatientSwitcherProps {
    currentPatientId: string | null;
    currentPatientName: string | null;
    onPatientSelect: (patientId: string, patientName: string) => void;
    onClearPatient: () => void;
}

interface PatientRecord {
    id: string;
    displayName?: string;
    phoneNumber?: string;
}

export function PatientSwitcher({
    currentPatientId,
    currentPatientName,
    onPatientSelect,
    onClearPatient,
}: PatientSwitcherProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PatientRecord[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showNewPatient, setShowNewPatient] = useState(false);
    const [newPatientName, setNewPatientName] = useState('');
    const [newPatientPhone, setNewPatientPhone] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Search for existing patients by phone number
    const handleSearch = useCallback(async () => {
        if (searchQuery.length < 3) return;

        setIsSearching(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('role', '==', 'patient'),
                where('phoneNumber', '>=', searchQuery),
                where('phoneNumber', '<=', searchQuery + '\uf8ff')
            );

            const snapshot = await getDocs(q);
            const results: PatientRecord[] = [];
            snapshot.forEach((doc) => {
                results.push({
                    id: doc.id,
                    ...doc.data(),
                } as PatientRecord);
            });

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    // Create a new patient record for assisted session
    const handleCreatePatient = useCallback(async () => {
        if (!newPatientName.trim()) return;

        setIsCreating(true);
        try {
            // Generate a temporary patient ID for assisted session
            const patientRef = doc(collection(db, 'users'));
            const now = Timestamp.now();

            // Build data dynamically - NEVER include undefined
            const patientData: Record<string, any> = {
                uid: patientRef.id,
                role: 'patient',
                displayName: newPatientName.trim(),
                createdAt: now,
                lastLogin: now,
                createdViaAssistedMode: true,
            };

            // Only add phone if provided
            if (newPatientPhone && newPatientPhone.trim()) {
                patientData.phoneNumber = newPatientPhone.trim();
            }

            await setDoc(patientRef, patientData);

            onPatientSelect(patientRef.id, newPatientName.trim());
            setShowNewPatient(false);
            setNewPatientName('');
            setNewPatientPhone('');
        } catch (error) {
            console.error('Create patient error:', error);
        } finally {
            setIsCreating(false);
        }
    }, [newPatientName, newPatientPhone, onPatientSelect]);

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>👤 Patient Selection</h3>

            {/* Current Patient Display */}
            {currentPatientId ? (
                <div style={styles.currentPatient}>
                    <div style={styles.patientInfo}>
                        <span style={styles.patientIcon}>✓</span>
                        <div>
                            <p style={styles.patientName}>{currentPatientName || 'Patient'}</p>
                            <p style={styles.patientId}>ID: {currentPatientId.slice(0, 8)}...</p>
                        </div>
                    </div>
                    <button onClick={onClearPatient} style={styles.clearBtn}>
                        Switch Patient
                    </button>
                </div>
            ) : (
                <>
                    {/* Search Existing Patient */}
                    <div style={styles.searchSection}>
                        <p style={styles.sectionLabel}>Find existing patient:</p>
                        <div style={styles.searchBox}>
                            <input
                                type="tel"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter phone number"
                                style={styles.input}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || searchQuery.length < 3}
                                style={styles.searchBtn}
                            >
                                {isSearching ? '...' : 'Search'}
                            </button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div style={styles.results}>
                                {searchResults.map((patient) => (
                                    <button
                                        key={patient.id}
                                        onClick={() =>
                                            onPatientSelect(
                                                patient.id,
                                                patient.displayName || patient.phoneNumber || 'Patient'
                                            )
                                        }
                                        style={styles.resultItem}
                                    >
                                        <span>{patient.displayName || 'Unknown'}</span>
                                        <span style={styles.resultPhone}>{patient.phoneNumber}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={styles.divider}>
                        <span>OR</span>
                    </div>

                    {/* New Patient Form */}
                    {!showNewPatient ? (
                        <button
                            onClick={() => setShowNewPatient(true)}
                            style={styles.newPatientBtn}
                        >
                            + Register New Patient
                        </button>
                    ) : (
                        <div style={styles.newPatientForm}>
                            <p style={styles.sectionLabel}>Register new patient:</p>
                            <input
                                type="text"
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                placeholder="Patient name *"
                                style={styles.input}
                            />
                            <input
                                type="tel"
                                value={newPatientPhone}
                                onChange={(e) => setNewPatientPhone(e.target.value)}
                                placeholder="Phone number (optional)"
                                style={styles.input}
                            />
                            <div style={styles.formActions}>
                                <button
                                    onClick={handleCreatePatient}
                                    disabled={isCreating || !newPatientName.trim()}
                                    style={styles.createBtn}
                                >
                                    {isCreating ? 'Creating...' : 'Create & Select'}
                                </button>
                                <button
                                    onClick={() => setShowNewPatient(false)}
                                    style={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Assisted Mode Notice */}
            <div style={styles.notice}>
                ⚠️ You are assisting this patient. Consent will be logged as
                "assisted consent" with your ID.
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-primary)',
        marginBottom: 'var(--spacing-lg)',
    },
    title: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        marginBottom: 'var(--spacing-md)',
    },
    currentPatient: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-md)',
        background: 'var(--color-success-light)',
        borderRadius: 'var(--radius-md)',
    },
    patientInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    patientIcon: {
        fontSize: '24px',
        color: 'var(--color-success)',
    },
    patientName: {
        fontWeight: 600,
        margin: 0,
    },
    patientId: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-muted)',
        margin: 0,
    },
    clearBtn: {
        padding: 'var(--spacing-xs) var(--spacing-md)',
        background: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
    },
    searchSection: {
        marginBottom: 'var(--spacing-md)',
    },
    sectionLabel: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-xs)',
    },
    searchBox: {
        display: 'flex',
        gap: 'var(--spacing-sm)',
    },
    input: {
        flex: 1,
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
    },
    searchBtn: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
    },
    results: {
        marginTop: 'var(--spacing-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
    },
    resultItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
    },
    resultPhone: {
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-sm)',
    },
    divider: {
        textAlign: 'center',
        margin: 'var(--spacing-md) 0',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-sm)',
    },
    newPatientBtn: {
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-secondary)',
        color: 'var(--color-primary)',
        border: '2px dashed var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: 'pointer',
    },
    newPatientForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
    },
    formActions: {
        display: 'flex',
        gap: 'var(--spacing-sm)',
    },
    createBtn: {
        flex: 1,
        padding: 'var(--spacing-sm)',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
    },
    cancelBtn: {
        padding: 'var(--spacing-sm)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
    },
    notice: {
        marginTop: 'var(--spacing-md)',
        padding: 'var(--spacing-sm)',
        background: 'var(--color-warning-light)',
        color: 'var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        textAlign: 'center',
    },
};
