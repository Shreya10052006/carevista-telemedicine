'use client';

/**
 * Doctor Dashboard - Product Grade (Finalized)
 * =============================================
 * Premium clinical dashboard with 5 sections:
 * 1. Doctor Identity Header with Status
 * 2. Live Consultation Queue
 * 3. Dashboard Stats
 * 4. Past Consultations Panel (with drill-down)
 * 5. Community Wall (Professional Discussions)
 * 
 * COMPLIANCE:
 * - Doctor is sole clinical authority
 * - AI is non-clinical, assistive only
 * - Consent-first, revocable at any time
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    DEMO_MODE,
    getDemoDoctor,
    getDemoQueue,
    getExtendedConsultations,
    QueuedPatient,
    ExtendedConsultation,
    CommunityPost,
    DemoDoctor,
    ConsentState,
    PriorityLevel,
} from '@/lib/demoData';
import {
    getAllCommunityPosts,
    addCommunityReply,
    addCommunityPost,
} from '@/lib/demoSessionStore';
import { Logo } from '@/components/common/Logo';
import styles from './page.module.css';

type DashboardTab = 'queue' | 'history' | 'community';
type DoctorStatus = 'available' | 'in_consultation' | 'offline';

export default function DoctorDashboard() {
    const router = useRouter();
    const [demoDoctor, setDemoDoctor] = useState<DemoDoctor | null>(null);
    const [queue, setQueue] = useState<QueuedPatient[]>([]);
    const [consultations, setConsultations] = useState<ExtendedConsultation[]>([]);
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
    const [activeTab, setActiveTab] = useState<DashboardTab>('queue');
    const [doctorStatus, setDoctorStatus] = useState<DoctorStatus>('available');
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Past consultation drill-down
    const [selectedConsultation, setSelectedConsultation] = useState<ExtendedConsultation | null>(null);

    // Community new post modal
    const [showNewPostModal, setShowNewPostModal] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostTags, setNewPostTags] = useState('');

    // Community reply modal
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyPostId, setReplyPostId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        setMounted(true);

        if (!DEMO_MODE) {
            router.push('/auth/doctor');
            return;
        }

        const doctorId = localStorage.getItem('demo_doctor_id');
        if (!doctorId) {
            router.push('/auth/doctor');
            return;
        }

        const doctor = getDemoDoctor(doctorId);
        if (!doctor) {
            router.push('/auth/doctor');
            return;
        }

        setDemoDoctor(doctor);
        setQueue(getDemoQueue(doctorId));
        setConsultations(getExtendedConsultations());
        setCommunityPosts(getAllCommunityPosts());
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('demo_doctor_id');
        localStorage.removeItem('demo_doctor_name');
        localStorage.removeItem('demo_doctor_specialty');
        localStorage.removeItem('demo_doctor_experience');
        localStorage.removeItem('demo_doctor_languages');
        router.push('/');
    };

    const handleStartConsultation = (patientId: string) => {
        setDoctorStatus('in_consultation');
        router.push(`/doctor/consultation/${patientId}`);
    };

    // Community handlers
    const handleOpenReplyModal = (postId: string) => {
        setReplyPostId(postId);
        setReplyContent('');
        setShowReplyModal(true);
    };

    const handleSubmitReply = () => {
        if (!demoDoctor || !replyPostId || !replyContent.trim()) return;

        addCommunityReply(
            replyPostId,
            demoDoctor.id,
            demoDoctor.name,
            demoDoctor.specialty,
            replyContent.trim()
        );

        // Refresh posts
        setCommunityPosts(getAllCommunityPosts());

        // Close modal
        setShowReplyModal(false);
        setReplyPostId(null);
        setReplyContent('');
    };

    const handleSubmitNewPost = () => {
        if (!demoDoctor || !newPostTitle.trim() || !newPostContent.trim()) return;

        const tags = newPostTags.split(',').map(t => t.trim()).filter(t => t);

        addCommunityPost(
            demoDoctor.id,
            demoDoctor.name,
            demoDoctor.specialty,
            newPostTitle.trim(),
            newPostContent.trim(),
            tags
        );

        // Refresh posts
        setCommunityPosts(getAllCommunityPosts());

        // Close modal
        setShowNewPostModal(false);
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostTags('');
    };

    const getConsentBadge = (state: ConsentState) => {
        switch (state) {
            case 'granted':
                return <span className={styles.consentGranted}>✓ Consent Granted</span>;
            case 'revoked':
                return <span className={styles.consentRevoked}>⚠ Consent Revoked</span>;
            case 'pending':
                return <span className={styles.consentPending}>⏳ Awaiting Consent</span>;
        }
    };

    const getPriorityBadge = (priority: PriorityLevel) => {
        switch (priority) {
            case 'high':
                return <span className={styles.priorityHigh}>High</span>;
            case 'medium':
                return <span className={styles.priorityMedium}>Medium</span>;
            case 'low':
                return <span className={styles.priorityLow}>Low</span>;
        }
    };

    const getIntakeSourceLabel = (source: string) => {
        switch (source) {
            case 'chatbot': return '🤖 AI Chatbot';
            case 'logbook': return '📝 Logbook';
            case 'health_worker': return '👩‍⚕️ Health Worker';
            case 'self': return '👤 Self';
            default: return source;
        }
    };

    const getDoctorStatusBadge = () => {
        switch (doctorStatus) {
            case 'available':
                return <span className={styles.statusAvailable}>🟢 Available</span>;
            case 'in_consultation':
                return <span className={styles.statusBusy}>🟡 In Consultation</span>;
            case 'offline':
                return <span className={styles.statusOffline}>⚪ Offline</span>;
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return `${diffMins}m ago`;
    };

    // Calculate stats
    const stats = {
        waiting: queue.length,
        today: consultations.length + queue.length,
        consented: queue.filter(p => p.consentState === 'granted').length,
        completed: consultations.filter(c => c.status === 'completed').length,
    };

    if (loading || !mounted) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    if (!demoDoctor) {
        return (
            <div className={styles.loadingScreen}>
                <p>Access denied. Please log in.</p>
                <Link href="/auth/doctor">Go to Login</Link>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.logo}>
                        <Logo size="small" theme="primary" />
                    </Link>
                    <span className={styles.portalLabel}>Doctor Portal</span>
                </div>
                <div className={styles.headerRight}>
                    {getDoctorStatusBadge()}
                    <select
                        className={styles.statusSelect}
                        value={doctorStatus}
                        onChange={(e) => setDoctorStatus(e.target.value as DoctorStatus)}
                    >
                        <option value="available">Available</option>
                        <option value="in_consultation">In Consultation</option>
                        <option value="offline">Offline</option>
                    </select>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Compliance Banner */}
            <div className={styles.complianceBanner}>
                <span>⚕️</span>
                <span>Doctor is sole clinical authority • AI is assistive only (non-diagnostic) • Patient consent revocable at any time</span>
            </div>

            <main className={styles.main}>
                {/* Section 2: Doctor Identity Card */}
                <section className={styles.doctorCard}>
                    <div className={styles.doctorAvatar}>
                        👨‍⚕️
                    </div>
                    <div className={styles.doctorInfo}>
                        <h1 className={styles.doctorName}>{demoDoctor.name}</h1>
                        <p className={styles.doctorSpecialty}>{demoDoctor.specialty}</p>
                        <div className={styles.doctorMeta}>
                            <span className={styles.metaItem}>
                                <strong>{demoDoctor.experience}</strong> years experience
                            </span>
                            <span className={styles.metaDivider}>•</span>
                            <span className={styles.metaItem}>
                                Languages: {demoDoctor.languages.map(l => l.toUpperCase()).join(', ')}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Section 3: Dashboard Stats */}
                <section className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>⏳</span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.waiting}</span>
                            <span className={styles.statLabel}>Patients Waiting</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>📅</span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.today}</span>
                            <span className={styles.statLabel}>Consultations Today</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>✓</span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.consented}</span>
                            <span className={styles.statLabel}>With Consent</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>✅</span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.completed}</span>
                            <span className={styles.statLabel}>Completed</span>
                        </div>
                    </div>
                </section>

                {/* Tab Navigation */}
                <div className={styles.tabNav}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'queue' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('queue'); setSelectedConsultation(null); }}
                    >
                        📋 Live Queue ({queue.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('history'); setSelectedConsultation(null); }}
                    >
                        📂 Past Consultations
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'community' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('community'); setSelectedConsultation(null); }}
                    >
                        💬 Community
                    </button>
                </div>

                {/* Queue Tab */}
                {activeTab === 'queue' && (
                    <section className={styles.queueSection}>
                        {queue.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>✓</span>
                                <p>No patients in queue</p>
                            </div>
                        ) : (
                            <div className={styles.queueGrid}>
                                {queue.map((patient) => (
                                    <div key={patient.patientId} className={styles.patientCard}>
                                        {/* Urgent Context Marker */}
                                        {patient.priority === 'high' && (
                                            <div className={styles.urgentMarker}>
                                                ⚠️ Patient was advised urgent consultation based on intake
                                            </div>
                                        )}

                                        <div className={styles.patientHeader}>
                                            <div className={styles.patientAvatar}>
                                                {patient.patientName.charAt(0)}
                                            </div>
                                            <div className={styles.patientBasic}>
                                                <h3>{patient.patientName}</h3>
                                                <p>{patient.age} yrs, {patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'O'}</p>
                                            </div>
                                            {getPriorityBadge(patient.priority)}
                                        </div>

                                        <div className={styles.patientDetails}>
                                            {/* Language Indicator */}
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🌐 Language</span>
                                                <span className={styles.detailValue}>
                                                    {patient.language?.toUpperCase() || 'EN'}
                                                    <span className={styles.translatorBadge}>Auto-translated</span>
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Chief Complaint</span>
                                                <span className={styles.detailValue}>{patient.chiefComplaint}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Duration</span>
                                                <span className={styles.detailValue}>{patient.symptomOnsetDays} days</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Intake Source</span>
                                                <span className={styles.detailValue}>{getIntakeSourceLabel(patient.intakeSource)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.patientFooter}>
                                            {getConsentBadge(patient.consentState)}
                                            <button
                                                className={`${styles.startBtn} ${patient.consentState === 'revoked' ? styles.startBtnDisabled : ''}`}
                                                onClick={() => handleStartConsultation(patient.patientId)}
                                                disabled={patient.consentState === 'revoked'}
                                            >
                                                {patient.consentState === 'granted'
                                                    ? 'Start Consultation'
                                                    : patient.consentState === 'pending'
                                                        ? 'Proceed Without Data'
                                                        : 'Access Revoked'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* History Tab */}
                {activeTab === 'history' && !selectedConsultation && (
                    <section className={styles.historySection}>
                        <div className={styles.historyHeader}>
                            <h2>Past Consultations</h2>
                            <span className={styles.readOnlyBanner}>📋 Read-only – Clinical Records</span>
                        </div>

                        {consultations.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📂</span>
                                <p>No past consultations</p>
                            </div>
                        ) : (
                            <div className={styles.historyList}>
                                {consultations.map((consult) => (
                                    <div
                                        key={consult.id}
                                        className={styles.historyCard}
                                        onClick={() => setSelectedConsultation(consult)}
                                    >
                                        <div className={styles.historyLeft}>
                                            <div className={styles.historyAvatar}>
                                                {consult.patientName.charAt(0)}
                                            </div>
                                            <div className={styles.historyInfo}>
                                                <h3>{consult.patientName}</h3>
                                                <p>{consult.chiefComplaint}</p>
                                            </div>
                                        </div>
                                        <div className={styles.historyRight}>
                                            <span className={styles.historyDate}>{formatDateTime(consult.date)}</span>
                                            <span className={`${styles.historyType} ${consult.type === 'video' ? styles.typeVideo : styles.typeAudio}`}>
                                                {consult.type === 'video' ? '📹' : '📞'} {consult.type}
                                            </span>
                                            {consult.followUpRequired && (
                                                <span className={styles.followUpBadge}>Follow-up Recommended</span>
                                            )}
                                            {consult.consentStateAtTime === 'revoked' && (
                                                <span className={styles.revokedBadge}>Consent Revoked</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Past Consultation Drill-Down View */}
                {activeTab === 'history' && selectedConsultation && (
                    <section className={styles.consultationDetail}>
                        <button
                            className={styles.backButton}
                            onClick={() => setSelectedConsultation(null)}
                        >
                            ← Back to List
                        </button>

                        <div className={styles.readOnlyBannerLarge}>
                            📋 Read-only – Previous Visit Record
                        </div>

                        {/* Patient Snapshot */}
                        <div className={styles.detailCard}>
                            <h3>Patient Snapshot</h3>
                            <div className={styles.snapshotGrid}>
                                <div className={styles.snapshotItem}>
                                    <span className={styles.snapshotLabel}>Name</span>
                                    <span className={styles.snapshotValue}>{selectedConsultation.patientName}</span>
                                </div>
                                <div className={styles.snapshotItem}>
                                    <span className={styles.snapshotLabel}>Age / Gender</span>
                                    <span className={styles.snapshotValue}>{selectedConsultation.patientAge} yrs, {selectedConsultation.patientGender}</span>
                                </div>
                                <div className={styles.snapshotItem}>
                                    <span className={styles.snapshotLabel}>Language</span>
                                    <span className={styles.snapshotValue}>{selectedConsultation.patientLanguage}</span>
                                </div>
                                <div className={styles.snapshotItem}>
                                    <span className={styles.snapshotLabel}>Date</span>
                                    <span className={styles.snapshotValue}>{formatDateTime(selectedConsultation.date)}</span>
                                </div>
                                <div className={styles.snapshotItem}>
                                    <span className={styles.snapshotLabel}>Duration</span>
                                    <span className={styles.snapshotValue}>{selectedConsultation.duration} minutes</span>
                                </div>
                                <div className={styles.snapshotItem}>
                                    <span className={styles.snapshotLabel}>Type</span>
                                    <span className={styles.snapshotValue}>{selectedConsultation.type === 'video' ? '📹 Video' : '📞 Audio'}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Intake Summary (if consented) */}
                        {selectedConsultation.consentStateAtTime === 'granted' && (
                            <div className={styles.detailCard}>
                                <div className={styles.cardHeader}>
                                    <h3>AI Intake Summary</h3>
                                    <span className={styles.nonClinicalBadge}>Assistive, Non-Clinical</span>
                                </div>
                                <div className={styles.intakeContent}>
                                    <div className={styles.intakeRow}>
                                        <span className={styles.intakeLabel}>Chief Complaint</span>
                                        <span className={styles.intakeValue}>{selectedConsultation.chiefComplaint}</span>
                                    </div>
                                    <p className={styles.intakeText}>{selectedConsultation.intakeSummary}</p>
                                </div>
                            </div>
                        )}

                        {/* Doctor Notes */}
                        <div className={styles.detailCard}>
                            <div className={styles.cardHeader}>
                                <h3>Doctor Notes</h3>
                                <span className={styles.doctorAuthoredBadge}>Doctor Authored</span>
                            </div>
                            <p className={styles.notesText}>{selectedConsultation.doctorNotes}</p>
                        </div>

                        {/* Prescription */}
                        {selectedConsultation.prescription.length > 0 && (
                            <div className={styles.detailCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Prescription</h3>
                                    <span className={styles.doctorAuthoredBadge}>Doctor Authored</span>
                                </div>
                                <table className={styles.rxTable}>
                                    <thead>
                                        <tr>
                                            <th>Medicine</th>
                                            <th>Dosage</th>
                                            <th>Frequency</th>
                                            <th>Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedConsultation.prescription.map((rx, idx) => (
                                            <tr key={idx}>
                                                <td>{rx.medicine}</td>
                                                <td>{rx.dosage}</td>
                                                <td>{rx.frequency}</td>
                                                <td>{rx.duration}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Lab Requests */}
                        {selectedConsultation.labRequests.length > 0 && (
                            <div className={styles.detailCard}>
                                <h3>Investigations Requested</h3>
                                <ul className={styles.labList}>
                                    {selectedConsultation.labRequests.map((lab, idx) => (
                                        <li key={idx}>🔬 {lab}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Audit Trail */}
                        <div className={styles.auditCard}>
                            <h3>📋 Audit Information</h3>
                            <div className={styles.auditGrid}>
                                <div className={styles.auditItem}>
                                    <span className={styles.auditLabel}>Consent Granted At</span>
                                    <span className={styles.auditValue}>
                                        {selectedConsultation.consentGrantedAt
                                            ? formatDateTime(selectedConsultation.consentGrantedAt)
                                            : 'N/A'}
                                    </span>
                                </div>
                                {selectedConsultation.consentRevokedAt && (
                                    <div className={styles.auditItem}>
                                        <span className={styles.auditLabel}>Consent Revoked At</span>
                                        <span className={`${styles.auditValue} ${styles.auditRevoked}`}>
                                            {formatDateTime(selectedConsultation.consentRevokedAt)}
                                        </span>
                                    </div>
                                )}
                                <div className={styles.auditItem}>
                                    <span className={styles.auditLabel}>Intake Summary Viewed</span>
                                    <span className={styles.auditValue}>
                                        {selectedConsultation.intakeViewed ? '✔️ Yes' : '❌ No'}
                                    </span>
                                </div>
                                <div className={styles.auditItem}>
                                    <span className={styles.auditLabel}>Logbook Accessed</span>
                                    <span className={styles.auditValue}>
                                        {selectedConsultation.logbookViewed ? '✔️ Yes' : '❌ No'}
                                    </span>
                                </div>
                                <div className={styles.auditItem}>
                                    <span className={styles.auditLabel}>Prescription Issued</span>
                                    <span className={styles.auditValue}>
                                        {selectedConsultation.prescriptionIssued ? '✔️ Yes' : '❌ No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Community Tab */}
                {activeTab === 'community' && (
                    <section className={styles.communitySection}>
                        <div className={styles.communityHeader}>
                            <div>
                                <h2>Professional Community</h2>
                                <p className={styles.communitySubtitle}>Doctor-only discussions • No patient data allowed</p>
                            </div>
                            <button
                                className={styles.newPostBtn}
                                onClick={() => setShowNewPostModal(true)}
                            >
                                + New Discussion
                            </button>
                        </div>

                        <div className={styles.communityWarning}>
                            <span>⚠️</span>
                            <span>This is a professional collaboration space. Do NOT share patient names, IDs, reports, or any identifiable information. Discuss only hypothetical cases and general protocols.</span>
                        </div>

                        <div className={styles.postsList}>
                            {communityPosts.map((post) => (
                                <div key={post.id} className={styles.postCard}>
                                    <div className={styles.postHeader}>
                                        <div className={styles.postAuthor}>
                                            <div className={styles.authorAvatar}>
                                                {post.doctorName.charAt(4)}
                                            </div>
                                            <div className={styles.authorInfo}>
                                                <strong>{post.doctorName}</strong>
                                                <span>{post.specialty}</span>
                                            </div>
                                        </div>
                                        <span className={styles.postTime}>{formatTimeAgo(post.createdAt)}</span>
                                    </div>

                                    <h3 className={styles.postTitle}>{post.title}</h3>
                                    <p className={styles.postContent}>{post.content}</p>

                                    <div className={styles.postTags}>
                                        {post.tags.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>

                                    {/* Replies */}
                                    {post.replies.length > 0 && (
                                        <div className={styles.repliesSection}>
                                            <h4>{post.replies.length} Replies</h4>
                                            {post.replies.map((reply) => (
                                                <div key={reply.id} className={styles.replyCard}>
                                                    <div className={styles.replyHeader}>
                                                        <strong>{reply.doctorName}</strong>
                                                        <span className={styles.replySpecialty}>{reply.specialty}</span>
                                                        <span className={styles.replyTime}>{formatTimeAgo(reply.createdAt)}</span>
                                                    </div>
                                                    <p className={styles.replyContent}>{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        className={styles.replyBtn}
                                        onClick={() => handleOpenReplyModal(post.id)}
                                    >
                                        💬 Add Reply
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* New Post Modal */}
            {showNewPostModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>New Discussion</h2>

                        <div className={styles.modalWarning}>
                            ⚠️ Do NOT include patient names, IDs, reports, or identifiable information.
                        </div>

                        <div className={styles.formField}>
                            <label>Title</label>
                            <input
                                type="text"
                                value={newPostTitle}
                                onChange={(e) => setNewPostTitle(e.target.value)}
                                placeholder="Discussion topic..."
                            />
                        </div>

                        <div className={styles.formField}>
                            <label>Content</label>
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share your question or experience..."
                                rows={6}
                            />
                        </div>

                        <div className={styles.formField}>
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={newPostTags}
                                onChange={(e) => setNewPostTags(e.target.value)}
                                placeholder="#RuralCare, #Protocols..."
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowNewPostModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={handleSubmitNewPost}
                                disabled={!newPostTitle.trim() || !newPostContent.trim()}
                            >
                                Post Discussion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Add Reply</h2>

                        <div className={styles.modalWarning}>
                            ⚠️ Do NOT include patient names, IDs, reports, or identifiable information.
                        </div>

                        <div className={styles.formField}>
                            <label>Your Reply</label>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Share your response or feedback..."
                                rows={4}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowReplyModal(false);
                                    setReplyPostId(null);
                                    setReplyContent('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={handleSubmitReply}
                                disabled={!replyContent.trim()}
                            >
                                Post Reply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className={styles.footer}>
                <p>Doctor Portal • CareVista Telemedicine • All clinical decisions are doctor-authored</p>
            </footer>
        </div>
    );
}
