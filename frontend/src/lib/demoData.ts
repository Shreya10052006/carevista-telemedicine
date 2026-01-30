/**
 * Demo Data Service
 * =================
 * Isolated demo data for demonstration purposes.
 * This data NEVER touches production storage.
 * 
 * DEMO MODE: Enable via NEXT_PUBLIC_DEMO_MODE=true
 */

// ==================== DEMO MODE FLAG ====================

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// ==================== DEMO CREDENTIALS ====================

export interface DemoCredential {
    phone: string;
    otp: string;
    userId: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
    { phone: '9999990001', otp: '123456', userId: 'demo-patient-ramesh' },
    { phone: '9999990002', otp: '654321', userId: 'demo-patient-sita' },
];

export function isDemoPhone(phone: string): boolean {
    return DEMO_MODE && DEMO_CREDENTIALS.some(c => c.phone === phone);
}

export function validateDemoOTP(phone: string, otp: string): DemoCredential | null {
    if (!DEMO_MODE) return null;
    return DEMO_CREDENTIALS.find(c => c.phone === phone && c.otp === otp) || null;
}

// ==================== PATIENT PROFILES ====================

export interface PatientProfile {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    preferredLanguage: 'en' | 'ta' | 'hi';
    location: string;
    emergencyContact?: string;
    isDemo: true;
}

export const DEMO_PATIENTS: Record<string, PatientProfile> = {
    'demo-patient-ramesh': {
        id: 'demo-patient-ramesh',
        name: 'Ramesh Kumar',
        phone: '9999990001',
        age: 48,
        gender: 'male',
        preferredLanguage: 'ta',
        location: 'Thanjavur, Tamil Nadu',
        emergencyContact: '9999990099',
        isDemo: true,
    },
    'demo-patient-sita': {
        id: 'demo-patient-sita',
        name: 'Sita Devi',
        phone: '9999990002',
        age: 36,
        gender: 'female',
        preferredLanguage: 'hi',
        location: 'Varanasi, Uttar Pradesh',
        emergencyContact: '9999990098',
        isDemo: true,
    },
};

// ==================== LOGBOOK ENTRIES ====================

export type LogbookEntryType = 'manual' | 'voice' | 'chatbot';

export interface LogbookEntry {
    id: string;
    patientId: string;
    type: LogbookEntryType;
    createdAt: string;
    originalText: string;
    structuredSummary: {
        chiefComplaint: string;
        duration?: string;
        severity?: string;
        additionalNotes?: string;
    };
    audioRef?: string;
    sharedWithDoctor: boolean;
    doctorReviewed: boolean;
}

export const DEMO_LOGBOOK_ENTRIES: LogbookEntry[] = [
    // Ramesh Kumar's entries
    {
        id: 'log-ramesh-1',
        patientId: 'demo-patient-ramesh',
        type: 'manual',
        createdAt: '2026-01-25T09:30:00+05:30',
        originalText: 'தலைவலி காலை முதல் இருக்கிறது, லேசான வலி. மருந்து எடுக்கவில்லை.',
        structuredSummary: {
            chiefComplaint: 'Headache since morning',
            duration: 'Since morning',
            severity: 'Mild',
            additionalNotes: 'No medication taken',
        },
        sharedWithDoctor: true,
        doctorReviewed: true,
    },
    {
        id: 'log-ramesh-2',
        patientId: 'demo-patient-ramesh',
        type: 'voice',
        createdAt: '2026-01-26T14:15:00+05:30',
        originalText: 'இரண்டு நாட்களாக சாப்பிட்ட பிறகு வயிற்று அசெளகரியம். வாந்தி இல்லை.',
        structuredSummary: {
            chiefComplaint: 'Stomach discomfort after meals',
            duration: '2 days',
            severity: 'Moderate',
            additionalNotes: 'No vomiting',
        },
        audioRef: 'demo-audio-ramesh-2',
        sharedWithDoctor: false,
        doctorReviewed: false,
    },
    {
        id: 'log-ramesh-3',
        patientId: 'demo-patient-ramesh',
        type: 'chatbot',
        createdAt: '2026-01-27T11:00:00+05:30',
        originalText: 'கடந்த வாரம் காய்ச்சல் மற்றும் உடல் வலி இருந்தது. இப்போது நல்லது.',
        structuredSummary: {
            chiefComplaint: 'Fever and body pain last week',
            duration: 'Last week, resolved',
            severity: 'Was moderate, now resolved',
            additionalNotes: 'Patient reports improvement',
        },
        sharedWithDoctor: true,
        doctorReviewed: true,
    },
    {
        id: 'log-ramesh-4',
        patientId: 'demo-patient-ramesh',
        type: 'manual',
        createdAt: '2026-01-28T16:45:00+05:30',
        originalText: 'இரவில் தூக்கமின்மை, 3 நாட்களாக. மன அழுத்தம் இருக்கலாம்.',
        structuredSummary: {
            chiefComplaint: 'Difficulty sleeping at night',
            duration: '3 days',
            severity: 'Mild to moderate',
            additionalNotes: 'Patient suspects stress',
        },
        sharedWithDoctor: false,
        doctorReviewed: false,
    },
    // Sita Devi's entries
    {
        id: 'log-sita-1',
        patientId: 'demo-patient-sita',
        type: 'manual',
        createdAt: '2026-01-24T10:00:00+05:30',
        originalText: 'घुटनों में दर्द, विशेषकर सीढ़ियाँ चढ़ते समय। सूजन नहीं है।',
        structuredSummary: {
            chiefComplaint: 'Knee pain',
            duration: 'Ongoing',
            severity: 'Moderate',
            additionalNotes: 'Worse when climbing stairs, no swelling',
        },
        sharedWithDoctor: true,
        doctorReviewed: true,
    },
    {
        id: 'log-sita-2',
        patientId: 'demo-patient-sita',
        type: 'voice',
        createdAt: '2026-01-26T08:30:00+05:30',
        originalText: 'बहुत थकान महसूस हो रही है। रात को ठीक से नींद नहीं आती।',
        structuredSummary: {
            chiefComplaint: 'Fatigue and tiredness',
            duration: 'Recent',
            severity: 'Moderate',
            additionalNotes: 'Poor sleep at night',
        },
        audioRef: 'demo-audio-sita-2',
        sharedWithDoctor: false,
        doctorReviewed: false,
    },
    {
        id: 'log-sita-3',
        patientId: 'demo-patient-sita',
        type: 'chatbot',
        createdAt: '2026-01-28T15:00:00+05:30',
        originalText: 'सिर में हल्का दर्द और चक्कर आ रहा है। खून की जांच नहीं हुई है।',
        structuredSummary: {
            chiefComplaint: 'Mild headache with dizziness',
            duration: 'Today',
            severity: 'Mild',
            additionalNotes: 'No recent blood tests done',
        },
        sharedWithDoctor: true,
        doctorReviewed: false,
    },
];

// ==================== SCANNED MEDICAL REPORTS ====================

export interface ScannedReport {
    id: string;
    patientId: string;
    reportName: string;
    reportType: 'blood_test' | 'xray' | 'scan' | 'prescription' | 'other';
    labName?: string;
    uploadedAt: string;
    findings?: string;
    values?: { name: string; value: string; unit: string; status?: 'normal' | 'high' | 'low' }[];
}

export const DEMO_SCANNED_REPORTS: ScannedReport[] = [
    {
        id: 'report-ramesh-1',
        patientId: 'demo-patient-ramesh',
        reportName: 'Complete Blood Count (CBC)',
        reportType: 'blood_test',
        labName: 'Apollo Diagnostics, Thanjavur',
        uploadedAt: '2026-01-20T10:00:00+05:30',
        findings: 'All values within normal range. Mild elevation in ESR.',
        values: [
            { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', status: 'normal' },
            { name: 'WBC Count', value: '7,200', unit: '/µL', status: 'normal' },
            { name: 'Platelet Count', value: '2,40,000', unit: '/µL', status: 'normal' },
            { name: 'ESR', value: '22', unit: 'mm/hr', status: 'high' },
        ],
    },
    {
        id: 'report-ramesh-2',
        patientId: 'demo-patient-ramesh',
        reportName: 'Blood Sugar - Fasting',
        reportType: 'blood_test',
        labName: 'Apollo Diagnostics, Thanjavur',
        uploadedAt: '2026-01-22T09:00:00+05:30',
        findings: 'Fasting blood sugar slightly elevated. Recommend dietary modifications.',
        values: [
            { name: 'Fasting Glucose', value: '118', unit: 'mg/dL', status: 'high' },
            { name: 'HbA1c', value: '6.1', unit: '%', status: 'normal' },
        ],
    },
    {
        id: 'report-sita-1',
        patientId: 'demo-patient-sita',
        reportName: 'X-Ray Knee (Both)',
        reportType: 'xray',
        labName: 'City Imaging Center, Varanasi',
        uploadedAt: '2026-01-18T14:30:00+05:30',
        findings: 'Early degenerative changes noted in both knees. Joint space mildly reduced. No fracture or dislocation.',
    },
    {
        id: 'report-sita-2',
        patientId: 'demo-patient-sita',
        reportName: 'Vitamin D & Calcium',
        reportType: 'blood_test',
        labName: 'City Diagnostics, Varanasi',
        uploadedAt: '2026-01-23T11:00:00+05:30',
        findings: 'Vitamin D deficiency detected. Calcium levels normal.',
        values: [
            { name: 'Vitamin D (25-OH)', value: '18', unit: 'ng/mL', status: 'low' },
            { name: 'Serum Calcium', value: '9.2', unit: 'mg/dL', status: 'normal' },
        ],
    },
];

export function getDemoScannedReports(patientId: string): ScannedReport[] {
    return DEMO_SCANNED_REPORTS.filter(r => r.patientId === patientId);
}

// ==================== CONSULTATION HISTORY ====================

export interface Consultation {
    id: string;
    patientId: string;
    doctorName: string;
    doctorSpecialty: string;
    date: string;
    type: 'audio' | 'video';
    status: 'completed' | 'scheduled' | 'cancelled';
    doctorSummary?: string;
    prescription?: Prescription[];
}

export interface Prescription {
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export const DEMO_CONSULTATIONS: Consultation[] = [
    {
        id: 'consult-ramesh-1',
        patientId: 'demo-patient-ramesh',
        doctorName: 'Dr. Vijay Anand',
        doctorSpecialty: 'General Physician',
        date: '2026-01-27T10:30:00+05:30',
        type: 'video',
        status: 'completed',
        doctorSummary: 'Patient presented with fever and body aches. Advised rest and hydration. Prescribed medication for symptom relief. Follow-up if symptoms persist.',
        prescription: [
            { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days' },
            { medicine: 'ORS Powder', dosage: '1 sachet in 1L water', frequency: 'As needed', duration: '3 days' },
        ],
    },
    {
        id: 'consult-sita-1',
        patientId: 'demo-patient-sita',
        doctorName: 'Dr. Priya Sharma',
        doctorSpecialty: 'General Physician',
        date: '2026-01-25T14:00:00+05:30',
        type: 'audio',
        status: 'completed',
        doctorSummary: 'Patient reports knee pain, likely due to strain. Advised gentle exercises and rest. Prescribed pain relief. Recommended physiotherapy if no improvement in 2 weeks.',
        prescription: [
            { medicine: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Twice daily after meals', duration: '5 days' },
            { medicine: 'Calcium + Vitamin D3', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' },
        ],
    },
];

// ==================== DEMO DOCTORS (WITH LOGIN CREDENTIALS) ====================

export interface DemoDoctor {
    id: string;
    name: string;
    specialty: string;
    available: boolean;
    languages: string[];
    // Login credentials (DEMO ONLY)
    loginId: string;
    password: string;
    experience: number;
    profileImage?: string;
}

export const DEMO_DOCTORS: DemoDoctor[] = [
    {
        id: 'demo-doc-001',
        name: 'Dr. Vijay Kumar',
        specialty: 'General Physician',
        available: true,
        languages: ['en', 'ta'],
        loginId: 'doctor_vijay',
        password: 'demo123',
        experience: 12,
    },
    {
        id: 'demo-doc-002',
        name: 'Dr. Priya Sharma',
        specialty: 'Internal Medicine',
        available: true,
        languages: ['en', 'hi'],
        loginId: 'doctor_priya',
        password: 'demo456',
        experience: 9,
    },
];

/**
 * Validates demo doctor credentials.
 * ONLY works when DEMO_MODE is enabled.
 */
export function validateDemoDoctor(loginId: string, password: string): DemoDoctor | null {
    if (!DEMO_MODE) return null;
    return DEMO_DOCTORS.find(d => d.loginId === loginId && d.password === password) || null;
}

/**
 * Get demo doctor by ID.
 */
export function getDemoDoctor(doctorId: string): DemoDoctor | null {
    if (!DEMO_MODE) return null;
    return DEMO_DOCTORS.find(d => d.id === doctorId) || null;
}

// ==================== DEMO HEALTH WORKERS (WITH LOGIN CREDENTIALS) ====================

export interface DemoHealthWorker {
    id: string;
    name: string;
    phone: string;
    workerId: string;
    password: string;
    facility: string;
    facilityLocation: string;
    languages: string[];
    yearsActive: number;
    patientsAssisted: number;
}

export const DEMO_HEALTH_WORKERS: DemoHealthWorker[] = [
    {
        id: 'demo-hw-001',
        name: 'Priya Lakshmi',
        phone: '9876540001',
        workerId: 'hw_priya',
        password: 'demo123',
        facility: 'PHC Thanjavur',
        facilityLocation: 'Thanjavur, Tamil Nadu',
        languages: ['Tamil', 'English'],
        yearsActive: 5,
        patientsAssisted: 342,
    },
    {
        id: 'demo-hw-002',
        name: 'Sunita Kumar',
        phone: '9876540002',
        workerId: 'hw_sunita',
        password: 'demo456',
        facility: 'CHC Varanasi',
        facilityLocation: 'Varanasi, Uttar Pradesh',
        languages: ['Hindi', 'English'],
        yearsActive: 3,
        patientsAssisted: 189,
    },
    {
        id: 'demo-hw-003',
        name: 'Kavitha Reddy',
        phone: '9876540003',
        workerId: 'hw_kavitha',
        password: 'demo789',
        facility: 'PHC Hyderabad Rural',
        facilityLocation: 'Hyderabad, Telangana',
        languages: ['Telugu', 'Hindi', 'English'],
        yearsActive: 7,
        patientsAssisted: 521,
    },
];

/**
 * Validates demo health worker credentials.
 * ONLY works when DEMO_MODE is enabled.
 */
export function validateDemoHealthWorker(workerId: string, password: string): DemoHealthWorker | null {
    if (!DEMO_MODE) return null;
    return DEMO_HEALTH_WORKERS.find(hw => hw.workerId === workerId && hw.password === password) || null;
}

/**
 * Get demo health worker by ID.
 */
export function getDemoHealthWorker(healthWorkerId: string): DemoHealthWorker | null {
    if (!DEMO_MODE) return null;
    return DEMO_HEALTH_WORKERS.find(hw => hw.id === healthWorkerId) || null;
}

// ==================== DEMO CONSULTATION QUEUE (FOR DOCTORS) ====================

export type ConsentState = 'granted' | 'revoked' | 'pending';
export type IntakeSource = 'logbook' | 'chatbot' | 'health_worker' | 'self';
export type PriorityLevel = 'low' | 'medium' | 'high';

// ==================== CONSOLIDATED INTAKE SUMMARY ====================

/**
 * Consolidated Intake Summary for Doctor View
 * - Generated from all patient inputs (manual, voice, chatbot)
 * - Doctors NEVER see raw logs, only this summary
 * - AI role is STRICTLY non-clinical
 */
export interface IntakeSummary {
    chiefComplaint: string;
    symptomTimeline: string;
    severityReported: 'Mild' | 'Moderate' | 'Severe';
    associatedSymptoms: string[];
    relevantContext: string[];
    dataSources: string[];
    generatedAt: string;
    ai_role: 'non_clinical_intake_only';
    ai_disclaimer: string;
}

export interface QueuedPatient {
    id: string;
    patientId: string;
    patientName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    location: string;
    language?: string; // Patient's preferred language
    waitingTime: number; // minutes
    consultationType: 'audio' | 'video';
    consentState: ConsentState;
    scheduledAt: string;
    // Doctor-only metadata
    priority: PriorityLevel;
    symptomOnsetDays: number;
    lastInteraction: string;
    intakeSource: IntakeSource;
    chiefComplaint: string;
    // Consolidated Intake Summary (replaces raw logbook)
    intakeSummary?: IntakeSummary;
}

/**
 * Get demo consultation queue for a doctor.
 * Includes 6 patients with mixed consent states.
 */
export function getDemoQueue(doctorId: string): QueuedPatient[] {
    if (!DEMO_MODE) return [];

    const now = new Date();

    // 6 patients with mixed consent states as required
    const queue: QueuedPatient[] = [
        // 3 patients with FULL CONSENT
        {
            id: 'queue-1',
            patientId: 'demo-patient-ramesh',
            patientName: 'Ramesh Kumar',
            age: 48,
            gender: 'male',
            location: 'Thanjavur, TN',
            language: 'Tamil',
            waitingTime: 12,
            consultationType: 'video',
            consentState: 'granted',
            scheduledAt: new Date(now.getTime() - 12 * 60000).toISOString(),
            priority: 'medium',
            symptomOnsetDays: 3,
            lastInteraction: new Date(now.getTime() - 2 * 3600000).toISOString(),
            intakeSource: 'chatbot',
            chiefComplaint: 'Fever and body pain',
            intakeSummary: {
                chiefComplaint: 'Fever with body pain',
                symptomTimeline: 'Symptoms started approximately 3 days ago. Fever has been persistent with intermittent body aches. Patient reports the fever is higher in the evenings.',
                severityReported: 'Moderate',
                associatedSymptoms: [
                    'Fatigue and general weakness',
                    'Mild headache',
                    'Reduced appetite',
                    'Occasional chills'
                ],
                relevantContext: [
                    'Patient noted symptoms worsening in the evenings',
                    'No recent travel reported',
                    'No known medication allergies reported',
                    'Has been taking paracetamol for symptom relief'
                ],
                dataSources: ['Chatbot intake', 'Manual symptom entry', 'Voice recording'],
                generatedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Assistive intake summary. Doctor is sole clinical authority.'
            }
        },
        {
            id: 'queue-2',
            patientId: 'demo-patient-sita',
            patientName: 'Sita Devi',
            age: 36,
            gender: 'female',
            location: 'Varanasi, UP',
            language: 'Hindi',
            waitingTime: 8,
            consultationType: 'audio',
            consentState: 'granted',
            scheduledAt: new Date(now.getTime() - 8 * 60000).toISOString(),
            priority: 'high',
            symptomOnsetDays: 7,
            lastInteraction: new Date(now.getTime() - 1 * 3600000).toISOString(),
            intakeSource: 'logbook',
            chiefComplaint: 'Persistent joint pain',
            intakeSummary: {
                chiefComplaint: 'Persistent joint pain affecting multiple joints',
                symptomTimeline: 'Joint pain started approximately 1 week ago. Initially affected knees, now also involving wrists and fingers. Pain is worse in the morning with stiffness lasting over an hour.',
                severityReported: 'Severe',
                associatedSymptoms: [
                    'Morning stiffness lasting over 1 hour',
                    'Mild swelling in finger joints',
                    'Difficulty performing daily tasks',
                    'Disturbed sleep due to pain'
                ],
                relevantContext: [
                    'Patient reports family history of joint problems',
                    'Symptoms worse after rest, improve slightly with movement',
                    'Previous episode occurred 6 months ago',
                    'Currently not on any regular medication'
                ],
                dataSources: ['Patient logbook entries', 'Manual symptom entry'],
                generatedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Assistive intake summary. Doctor is sole clinical authority.'
            }
        },
        {
            id: 'queue-3',
            patientId: 'demo-patient-meera',
            patientName: 'Meera Reddy',
            age: 29,
            gender: 'female',
            location: 'Hyderabad, TS',
            language: 'English',
            waitingTime: 5,
            consultationType: 'video',
            consentState: 'granted',
            scheduledAt: new Date(now.getTime() - 5 * 60000).toISOString(),
            priority: 'low',
            symptomOnsetDays: 1,
            lastInteraction: new Date(now.getTime() - 30 * 60000).toISOString(),
            intakeSource: 'self',
            chiefComplaint: 'Mild headache',
            intakeSummary: {
                chiefComplaint: 'Mild tension-type headache',
                symptomTimeline: 'Headache started yesterday afternoon. Pain is described as dull and pressing, located on both sides of the head. No significant change in intensity since onset.',
                severityReported: 'Mild',
                associatedSymptoms: [
                    'Slight eye strain',
                    'Mild neck tension'
                ],
                relevantContext: [
                    'Patient attributes headache to extended screen time at work',
                    'No nausea or visual disturbances reported',
                    'Taking adequate fluids',
                    'Tried rest without significant improvement'
                ],
                dataSources: ['Self-reported intake'],
                generatedAt: new Date(now.getTime() - 10 * 60000).toISOString(),
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Assistive intake summary. Doctor is sole clinical authority.'
            }
        },
        // 1 patient with CONSENT REVOKED (previously granted)
        {
            id: 'queue-4',
            patientId: 'demo-patient-arun',
            patientName: 'Arun Krishnan',
            age: 55,
            gender: 'male',
            location: 'Kochi, KL',
            language: 'English',
            waitingTime: 18,
            consultationType: 'video',
            consentState: 'revoked',
            scheduledAt: new Date(now.getTime() - 18 * 60000).toISOString(),
            priority: 'medium',
            symptomOnsetDays: 5,
            lastInteraction: new Date(now.getTime() - 4 * 3600000).toISOString(),
            intakeSource: 'health_worker',
            chiefComplaint: 'Chest discomfort',
            // Note: Summary exists but will NOT be shown because consent is revoked
            intakeSummary: {
                chiefComplaint: 'Chest discomfort',
                symptomTimeline: 'Symptoms reported for approximately 5 days.',
                severityReported: 'Moderate',
                associatedSymptoms: ['Details hidden due to consent revocation'],
                relevantContext: ['Patient has revoked data sharing consent'],
                dataSources: ['Health worker intake'],
                generatedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Assistive intake summary. Doctor is sole clinical authority.'
            }
        },
        // 2 patients with NO CONSENT yet
        {
            id: 'queue-5',
            patientId: 'demo-patient-vijay',
            patientName: 'Vijay Sharma',
            age: 42,
            gender: 'male',
            location: 'Jaipur, RJ',
            language: 'Hindi',
            waitingTime: 22,
            consultationType: 'audio',
            consentState: 'pending',
            scheduledAt: new Date(now.getTime() - 22 * 60000).toISOString(),
            priority: 'low',
            symptomOnsetDays: 2,
            lastInteraction: new Date(now.getTime() - 3 * 3600000).toISOString(),
            intakeSource: 'chatbot',
            chiefComplaint: 'Stomach upset',
            intakeSummary: {
                chiefComplaint: 'Stomach upset with digestive discomfort',
                symptomTimeline: 'Symptoms started approximately 2 days ago. Patient reports discomfort after eating, with intermittent episodes of bloating.',
                severityReported: 'Mild',
                associatedSymptoms: [
                    'Bloating after meals',
                    'Mild nausea (no vomiting)',
                    'Reduced appetite'
                ],
                relevantContext: [
                    'Patient mentions eating outside food recently',
                    'No blood in stool reported',
                    'Bowel movements regular but slightly loose'
                ],
                dataSources: ['Chatbot intake'],
                generatedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Assistive intake summary. Doctor is sole clinical authority.'
            }
        },
        {
            id: 'queue-6',
            patientId: 'demo-patient-lakshmi',
            patientName: 'Lakshmi Iyer',
            age: 63,
            gender: 'female',
            location: 'Chennai, TN',
            language: 'Tamil',
            waitingTime: 30,
            consultationType: 'video',
            consentState: 'pending',
            scheduledAt: new Date(now.getTime() - 30 * 60000).toISOString(),
            priority: 'high',
            symptomOnsetDays: 4,
            lastInteraction: new Date(now.getTime() - 5 * 3600000).toISOString(),
            intakeSource: 'health_worker',
            chiefComplaint: 'Breathing difficulty',
            intakeSummary: {
                chiefComplaint: 'Breathing difficulty with exertional dyspnea',
                symptomTimeline: 'Breathing difficulty started approximately 4 days ago. Initially noticed during physical activity, now also present at rest. Symptoms reportedly worse when lying flat.',
                severityReported: 'Severe',
                associatedSymptoms: [
                    'Shortness of breath on exertion',
                    'Difficulty lying flat at night',
                    'Mild cough (non-productive)',
                    'Fatigue and reduced activity tolerance'
                ],
                relevantContext: [
                    'Patient has history of controlled hypertension',
                    'Currently on regular medication for blood pressure',
                    'No chest pain reported',
                    'Health worker noted patient appears anxious'
                ],
                dataSources: ['Health worker intake', 'Voice recording'],
                generatedAt: new Date(now.getTime() - 45 * 60000).toISOString(),
                ai_role: 'non_clinical_intake_only',
                ai_disclaimer: 'Assistive intake summary. Doctor is sole clinical authority.'
            }
        },
    ];

    return queue;
}

// ==================== DEMO PAST CONSULTATIONS (FOR DOCTORS) ====================

export interface DoctorConsultation {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    date: string;
    type: 'audio' | 'video';
    status: 'completed' | 'scheduled' | 'cancelled';
    doctorSummary: string;
    prescription: Prescription[];
}

export const DEMO_DOCTOR_CONSULTATIONS: DoctorConsultation[] = [
    {
        id: 'doc-consult-1',
        patientId: 'demo-patient-ramesh',
        patientName: 'Ramesh Kumar',
        doctorId: 'demo-doc-001',
        date: '2026-01-27T10:30:00+05:30',
        type: 'video',
        status: 'completed',
        doctorSummary: 'Patient presented with fever (101°F) and body aches for 2 days. No respiratory symptoms. Advised rest, hydration, and prescribed antipyretic. Follow-up if symptoms persist beyond 3 days or worsen.',
        prescription: [
            { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days' },
            { medicine: 'ORS Powder', dosage: '1 sachet in 1L water', frequency: 'As needed', duration: '3 days' },
        ],
    },
    {
        id: 'doc-consult-2',
        patientId: 'demo-patient-sita',
        patientName: 'Sita Devi',
        doctorId: 'demo-doc-002',
        date: '2026-01-28T14:00:00+05:30',
        type: 'audio',
        status: 'completed',
        doctorSummary: 'Patient reports persistent joint pain in knees for 1 week. No swelling or redness. Likely due to strain or early osteoarthritis. Advised gentle exercises, weight management, and prescribed anti-inflammatory. Refer to orthopedic if no improvement in 2 weeks.',
        prescription: [
            { medicine: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Twice daily after food', duration: '5 days' },
            { medicine: 'Calcium + Vitamin D3', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' },
        ],
    },
    {
        id: 'doc-consult-3',
        patientId: 'demo-patient-ramesh',
        patientName: 'Ramesh Kumar',
        doctorId: 'demo-doc-002',
        date: '2026-01-25T09:00:00+05:30',
        type: 'video',
        status: 'completed',
        doctorSummary: 'Follow-up consultation for elevated blood sugar. Patient reports improved diet compliance. Fasting sugar: 142 mg/dL. Continue current medication. Recheck HbA1c after 2 months.',
        prescription: [
            { medicine: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '60 days' },
        ],
    },
];

/**
 * Get past consultations for a specific doctor.
 */
export function getDoctorConsultations(doctorId: string): DoctorConsultation[] {
    if (!DEMO_MODE) return [];
    return DEMO_DOCTOR_CONSULTATIONS.filter(c => c.doctorId === doctorId);
}

/**
 * Get all past consultations (for any doctor in demo mode).
 */
export function getAllDoctorConsultations(): DoctorConsultation[] {
    if (!DEMO_MODE) return [];
    return DEMO_DOCTOR_CONSULTATIONS;
}

// ==================== HELPER FUNCTIONS ====================

export function getDemoPatient(userId: string): PatientProfile | null {
    return DEMO_PATIENTS[userId] || null;
}

export function getDemoLogbook(patientId: string): LogbookEntry[] {
    return DEMO_LOGBOOK_ENTRIES.filter(e => e.patientId === patientId);
}

export function getDemoConsultations(patientId: string): Consultation[] {
    return DEMO_CONSULTATIONS.filter(c => c.patientId === patientId);
}

export function getAvailableDoctors(): DemoDoctor[] {
    return DEMO_DOCTORS.filter(d => d.available);
}

// ==================== COMMUNITY DISCUSSIONS (DOCTOR-ONLY) ====================

export interface CommunityPost {
    id: string;
    doctorId: string;
    doctorName: string;
    specialty: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    replies: CommunityReply[];
}

export interface CommunityReply {
    id: string;
    doctorId: string;
    doctorName: string;
    specialty: string;
    content: string;
    createdAt: string;
}

export const DEMO_COMMUNITY_POSTS: CommunityPost[] = [
    {
        id: 'post-001',
        doctorId: 'demo-doc-001',
        doctorName: 'Dr. Vijay Sharma',
        specialty: 'General Medicine',
        title: 'Managing Diabetes in Rural Settings with Limited Lab Access',
        content: 'In many rural health camps, we lack access to HbA1c testing. I have been using fasting glucose combined with symptom tracking as a workaround. Has anyone developed a practical protocol for monitoring diabetic patients when regular lab testing is not available? Looking for peer experiences.',
        tags: ['#Diabetes', '#RuralCare', '#Protocols'],
        createdAt: '2026-01-28T09:30:00+05:30',
        replies: [
            {
                id: 'reply-001-1',
                doctorId: 'demo-doc-002',
                doctorName: 'Dr. Ananya Iyer',
                specialty: 'Internal Medicine',
                content: 'We use a symptom diary approach combined with monthly fasting glucose. Teaching patients to recognize hypoglycemia symptoms has been very effective. I can share our patient education material if helpful.',
                createdAt: '2026-01-28T11:15:00+05:30',
            },
            {
                id: 'reply-001-2',
                doctorId: 'demo-doc-003',
                doctorName: 'Dr. Rajesh Patil',
                specialty: 'Endocrinology',
                content: 'Consider point-of-care HbA1c devices - they\'re becoming more affordable. For immediate management, urine dipstick for glucose can give quick feedback. The key is consistent follow-up.',
                createdAt: '2026-01-28T14:45:00+05:30',
            },
        ],
    },
    {
        id: 'post-002',
        doctorId: 'demo-doc-002',
        doctorName: 'Dr. Ananya Iyer',
        specialty: 'Internal Medicine',
        title: 'Telemedicine Best Practices for Elderly Patients',
        content: 'Many elderly patients struggle with video consultations. I have started using a hybrid approach where health workers assist during the call. What are your strategies for effective remote consultations with elderly patients who have limited tech familiarity?',
        tags: ['#Telemedicine', '#GeriatricCare', '#HealthWorkers'],
        createdAt: '2026-01-27T16:00:00+05:30',
        replies: [
            {
                id: 'reply-002-1',
                doctorId: 'demo-doc-001',
                doctorName: 'Dr. Vijay Sharma',
                specialty: 'General Medicine',
                content: 'Audio-only calls work much better for elderly patients. Video often confuses them. I also ask family members to be present when possible - they can help with any technical issues and take notes.',
                createdAt: '2026-01-27T17:30:00+05:30',
            },
            {
                id: 'reply-002-2',
                doctorId: 'demo-doc-004',
                doctorName: 'Dr. Meena Krishnamurthy',
                specialty: 'Family Medicine',
                content: 'We trained ASHA workers in our area to handle the tech setup. The doctor focuses on medicine while the health worker manages the device. Patient satisfaction improved significantly.',
                createdAt: '2026-01-27T19:00:00+05:30',
            },
        ],
    },
    {
        id: 'post-003',
        doctorId: 'demo-doc-003',
        doctorName: 'Dr. Rajesh Patil',
        specialty: 'Endocrinology',
        title: 'Hypothyroidism Screening in Pregnant Women - Rural Protocol',
        content: 'Looking for input on a simplified hypothyroidism screening protocol for pregnant women in areas with limited specialist access. Current guidelines assume tertiary care availability. Any adaptations you\'ve found effective?',
        tags: ['#Thyroid', '#MaternalHealth', '#Screening'],
        createdAt: '2026-01-26T10:00:00+05:30',
        replies: [
            {
                id: 'reply-003-1',
                doctorId: 'demo-doc-002',
                doctorName: 'Dr. Ananya Iyer',
                specialty: 'Internal Medicine',
                content: 'We screen TSH for all pregnant women at first visit. If TSH > 4.0, we start low-dose levothyroxine and refer. This catches most cases early. The key is universal screening - symptomatic screening misses many.',
                createdAt: '2026-01-26T12:30:00+05:30',
            },
            {
                id: 'reply-003-2',
                doctorId: 'demo-doc-004',
                doctorName: 'Dr. Meena Krishnamurthy',
                specialty: 'Family Medicine',
                content: 'Agree with Dr. Ananya. We also do iodine supplementation for all pregnant women in our region since many are iodine-deficient. Simple and effective preventive measure.',
                createdAt: '2026-01-26T15:00:00+05:30',
            },
        ],
    },
];

/**
 * Get all community posts
 */
export function getCommunityPosts(): CommunityPost[] {
    if (!DEMO_MODE) return [];
    return DEMO_COMMUNITY_POSTS.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// ==================== LAB/INVESTIGATION REQUESTS ====================

export interface LabRequest {
    id: string;
    consultationId: string;
    patientId: string;
    doctorId: string;
    testName: string;
    notes: string;
    createdAt: string;
    status: 'pending' | 'acknowledged' | 'completed';
}

export const DEMO_LAB_REQUESTS: LabRequest[] = [
    {
        id: 'lab-001',
        consultationId: 'doc-consult-1',
        patientId: 'demo-patient-ramesh',
        doctorId: 'demo-doc-001',
        testName: 'Complete Blood Count (CBC)',
        notes: 'Check for infection markers given fever symptoms',
        createdAt: '2026-01-27T10:45:00+05:30',
        status: 'completed',
    },
    {
        id: 'lab-002',
        consultationId: 'doc-consult-2',
        patientId: 'demo-patient-sita',
        doctorId: 'demo-doc-002',
        testName: 'Serum Uric Acid',
        notes: 'Rule out gout as cause of joint pain',
        createdAt: '2026-01-28T14:20:00+05:30',
        status: 'pending',
    },
    {
        id: 'lab-003',
        consultationId: 'doc-consult-3',
        patientId: 'demo-patient-ramesh',
        doctorId: 'demo-doc-002',
        testName: 'HbA1c',
        notes: 'Diabetes control assessment',
        createdAt: '2026-01-25T09:15:00+05:30',
        status: 'acknowledged',
    },
];

export function getLabRequests(consultationId: string): LabRequest[] {
    if (!DEMO_MODE) return [];
    return DEMO_LAB_REQUESTS.filter(r => r.consultationId === consultationId);
}

export function getPatientLabRequests(patientId: string): LabRequest[] {
    if (!DEMO_MODE) return [];
    return DEMO_LAB_REQUESTS.filter(r => r.patientId === patientId);
}

// ==================== EXTENDED PAST CONSULTATIONS (WITH AUDIT) ====================

export interface ExtendedConsultation {
    id: string;
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: 'male' | 'female' | 'other';
    patientLanguage: string;
    doctorId: string;
    doctorName: string;
    date: string;
    duration: number; // in minutes
    type: 'audio' | 'video';
    status: 'completed' | 'scheduled' | 'cancelled';
    // Clinical data
    chiefComplaint: string;
    intakeSummary: string;
    doctorNotes: string;
    prescription: Prescription[];
    labRequests: string[];
    followUpRequired: boolean;
    // Consent audit
    consentGrantedAt: string | null;
    consentRevokedAt: string | null;
    consentStateAtTime: 'granted' | 'revoked' | 'pending';
    // Access audit
    intakeViewed: boolean;
    logbookViewed: boolean;
    prescriptionIssued: boolean;
}

export const DEMO_EXTENDED_CONSULTATIONS: ExtendedConsultation[] = [
    {
        id: 'ext-consult-1',
        patientId: 'demo-patient-ramesh',
        patientName: 'Ramesh Kumar',
        patientAge: 48,
        patientGender: 'male',
        patientLanguage: 'Tamil',
        doctorId: 'demo-doc-001',
        doctorName: 'Dr. Vijay Sharma',
        date: '2026-01-27T10:30:00+05:30',
        duration: 18,
        type: 'video',
        status: 'completed',
        chiefComplaint: 'Fever and body aches for 2 days',
        intakeSummary: 'Patient reports fever (101°F self-measured) with generalized body aches since 2 days. No cough, cold, or respiratory symptoms. Appetite reduced. Taking only paracetamol at home.',
        doctorNotes: 'Patient presented with fever (101°F) and body aches for 2 days. No respiratory symptoms. Advised rest, hydration, and prescribed antipyretic. Follow-up if symptoms persist beyond 3 days or worsen.',
        prescription: [
            { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days' },
            { medicine: 'ORS Powder', dosage: '1 sachet in 1L water', frequency: 'As needed', duration: '3 days' },
        ],
        labRequests: ['Complete Blood Count (CBC)'],
        followUpRequired: true,
        consentGrantedAt: '2026-01-27T10:28:00+05:30',
        consentRevokedAt: null,
        consentStateAtTime: 'granted',
        intakeViewed: true,
        logbookViewed: true,
        prescriptionIssued: true,
    },
    {
        id: 'ext-consult-2',
        patientId: 'demo-patient-sita',
        patientName: 'Sita Devi',
        patientAge: 36,
        patientGender: 'female',
        patientLanguage: 'Hindi',
        doctorId: 'demo-doc-002',
        doctorName: 'Dr. Ananya Iyer',
        date: '2026-01-28T14:00:00+05:30',
        duration: 22,
        type: 'audio',
        status: 'completed',
        chiefComplaint: 'Knee joint pain for 1 week',
        intakeSummary: 'Patient describes bilateral knee pain worsening with activity. Pain score 6/10. No history of injury. Morning stiffness present for about 15 minutes. No swelling or redness observed.',
        doctorNotes: 'Patient reports persistent joint pain in knees for 1 week. No swelling or redness. Likely due to strain or early osteoarthritis. Advised gentle exercises, weight management, and prescribed anti-inflammatory. Refer to orthopedic if no improvement in 2 weeks.',
        prescription: [
            { medicine: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Twice daily after food', duration: '5 days' },
            { medicine: 'Calcium + Vitamin D3', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' },
        ],
        labRequests: ['Serum Uric Acid'],
        followUpRequired: true,
        consentGrantedAt: '2026-01-28T13:55:00+05:30',
        consentRevokedAt: null,
        consentStateAtTime: 'granted',
        intakeViewed: true,
        logbookViewed: true,
        prescriptionIssued: true,
    },
    {
        id: 'ext-consult-3',
        patientId: 'demo-patient-ramesh',
        patientName: 'Ramesh Kumar',
        patientAge: 48,
        patientGender: 'male',
        patientLanguage: 'Tamil',
        doctorId: 'demo-doc-002',
        doctorName: 'Dr. Ananya Iyer',
        date: '2026-01-25T09:00:00+05:30',
        duration: 15,
        type: 'video',
        status: 'completed',
        chiefComplaint: 'Diabetes follow-up',
        intakeSummary: 'Scheduled follow-up for diabetes management. Patient reports improved diet compliance. Blood sugar readings from home monitoring available. No hypoglycemic episodes.',
        doctorNotes: 'Follow-up consultation for elevated blood sugar. Patient reports improved diet compliance. Fasting sugar: 142 mg/dL. Continue current medication. Recheck HbA1c after 2 months.',
        prescription: [
            { medicine: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '60 days' },
        ],
        labRequests: ['HbA1c'],
        followUpRequired: true,
        consentGrantedAt: '2026-01-25T08:55:00+05:30',
        consentRevokedAt: null,
        consentStateAtTime: 'granted',
        intakeViewed: true,
        logbookViewed: true,
        prescriptionIssued: true,
    },
    {
        id: 'ext-consult-4',
        patientId: 'demo-patient-sita',
        patientName: 'Sita Devi',
        patientAge: 36,
        patientGender: 'female',
        patientLanguage: 'Hindi',
        doctorId: 'demo-doc-001',
        doctorName: 'Dr. Vijay Sharma',
        date: '2026-01-20T11:00:00+05:30',
        duration: 12,
        type: 'audio',
        status: 'completed',
        chiefComplaint: 'Headache and fatigue',
        intakeSummary: 'Patient initially shared intake data, then withdrew consent mid-consultation.',
        doctorNotes: 'Consultation completed without access to full patient history. Patient withdrew consent during call. Basic assessment done based on verbal description. Advised rest and OTC pain relief.',
        prescription: [
            { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'As needed', duration: '3 days' },
        ],
        labRequests: [],
        followUpRequired: false,
        consentGrantedAt: '2026-01-20T10:58:00+05:30',
        consentRevokedAt: '2026-01-20T11:05:00+05:30',
        consentStateAtTime: 'revoked',
        intakeViewed: true,
        logbookViewed: false,
        prescriptionIssued: true,
    },
];

export function getExtendedConsultations(doctorId?: string): ExtendedConsultation[] {
    if (!DEMO_MODE) return [];
    if (doctorId) {
        return DEMO_EXTENDED_CONSULTATIONS.filter(c => c.doctorId === doctorId);
    }
    return DEMO_EXTENDED_CONSULTATIONS;
}

export function getExtendedConsultationById(consultationId: string): ExtendedConsultation | null {
    if (!DEMO_MODE) return null;
    return DEMO_EXTENDED_CONSULTATIONS.find(c => c.id === consultationId) || null;
}
