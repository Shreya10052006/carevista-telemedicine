'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './gofundme.module.css';

/* ═══════════════════════════════════════════════════════════
 * MOCK DATA
 * ═══════════════════════════════════════════════════════════ */

const PATIENTS = [
    {
        id: 1,
        name: 'Lakshmi',
        age: 52,
        village: 'Thiruvallur, Tamil Nadu',
        condition: 'Kidney Dialysis',
        required: 80000,
        raised: 45000,
        category: 'Chronic Care',
        anonymous: false,
    },
    {
        id: 2,
        name: 'Anonymous Child',
        age: 8,
        village: 'Madurai Rural',
        condition: 'Heart Surgery',
        required: 150000,
        raised: 90000,
        category: 'Surgery',
        anonymous: true,
    },
    {
        id: 3,
        name: 'Raman',
        age: 67,
        village: 'Villupuram',
        condition: 'Cataract + Diabetes Complications',
        required: 40000,
        raised: 18000,
        category: 'Chronic Care',
        anonymous: false,
    },
    {
        id: 4,
        name: 'Meena',
        age: 34,
        village: 'Dharmapuri, Tamil Nadu',
        condition: 'Emergency C-Section',
        required: 60000,
        raised: 52000,
        category: 'Emergency',
        anonymous: false,
    },
];

const FILTERS = ['All', 'Emergency', 'Surgery', 'Chronic Care'];

const TOTAL_RAISED = 325000;

/* ═══════════════════════════════════════════════════════════
 * HELPERS
 * ═══════════════════════════════════════════════════════════ */

function formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
}

/* ═══════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════ */

export default function GoFundMePage() {
    const [activeTab, setActiveTab] = useState<'patients' | 'donate'>('patients');
    const [activeFilter, setActiveFilter] = useState('All');

    // Donation form state
    const [donationAmount, setDonationAmount] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [donorName, setDonorName] = useState('');
    const [donorMessage, setDonorMessage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [showSuccess, setShowSuccess] = useState(false);

    const filteredPatients =
        activeFilter === 'All'
            ? PATIENTS
            : PATIENTS.filter((p) => p.category === activeFilter);

    const handleDonate = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setDonationAmount('');
            setDonorName('');
            setDonorMessage('');
        }, 4000);
    };

    return (
        <main className={styles.main}>
            {/* Background */}
            <div className={styles.bgPattern}></div>

            {/* Header Bar */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backLink}>
                        ← Back to Home
                    </Link>
                    <span className={styles.headerTitle}>CareVista Community Fund</span>
                </div>
            </header>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.heroBadge}>
                        <span>💙</span> Community Crowdfunding
                    </div>
                    <h1 className={styles.heroTitle}>
                        CareVista <span className={styles.heroAccent}>Community Fund</span>
                    </h1>
                    <p className={styles.heroSub}>
                        Support verified rural patients with medical emergencies. Donations are secure and anonymous.
                    </p>

                    {/* Stats */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>💰</span>
                            <div>
                                <div className={styles.statValue}>{formatCurrency(TOTAL_RAISED)}</div>
                                <div className={styles.statLabel}>Raised So Far</div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🧑‍⚕️</span>
                            <div>
                                <div className={styles.statValue}>{PATIENTS.length}</div>
                                <div className={styles.statLabel}>Active Requests</div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>✅</span>
                            <div>
                                <div className={styles.statValue}>12</div>
                                <div className={styles.statLabel}>Patients Helped</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <div className={styles.tabContainer}>
                <div className={styles.tabRow}>
                    <button
                        className={`${styles.tab} ${activeTab === 'patients' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('patients')}
                    >
                        🧑‍⚕️ Patients Requesting Funds
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'donate' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('donate')}
                    >
                        💰 Make a Donation
                    </button>
                </div>
            </div>

            {/* Content */}
            <section className={styles.content}>
                {activeTab === 'patients' && (
                    <div className={styles.patientsSection}>
                        {/* Filters */}
                        <div className={styles.filterRow}>
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    className={`${styles.filterChip} ${activeFilter === f ? styles.filterActive : ''}`}
                                    onClick={() => setActiveFilter(f)}
                                >
                                    {f === 'Emergency' && '🚨 '}
                                    {f === 'Surgery' && '🏥 '}
                                    {f === 'Chronic Care' && '💊 '}
                                    {f === 'All' && '📋 '}
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Patient Cards */}
                        <div className={styles.cardGrid}>
                            {filteredPatients.map((patient) => {
                                const pct = Math.round((patient.raised / patient.required) * 100);
                                return (
                                    <div key={patient.id} className={styles.patientCard}>
                                        {/* Verified Badge */}
                                        <div className={styles.verifiedBadge}>
                                            <span>✅</span> Verified by CareVista
                                        </div>

                                        {/* Category Tag */}
                                        <span
                                            className={`${styles.categoryTag} ${patient.category === 'Emergency'
                                                    ? styles.tagEmergency
                                                    : patient.category === 'Surgery'
                                                        ? styles.tagSurgery
                                                        : styles.tagChronic
                                                }`}
                                        >
                                            {patient.category}
                                        </span>

                                        {/* Patient Info */}
                                        <div className={styles.patientHeader}>
                                            <div className={styles.patientAvatar}>
                                                {patient.anonymous ? '👤' : patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className={styles.patientName}>{patient.name}</h3>
                                                <p className={styles.patientMeta}>
                                                    Age {patient.age} • {patient.village}
                                                </p>
                                            </div>
                                        </div>

                                        <p className={styles.conditionText}>
                                            <span className={styles.conditionIcon}>🩺</span> {patient.condition}
                                        </p>

                                        {/* Amounts */}
                                        <div className={styles.amountRow}>
                                            <div>
                                                <div className={styles.amountLabel}>Required</div>
                                                <div className={styles.amountValue}>{formatCurrency(patient.required)}</div>
                                            </div>
                                            <div>
                                                <div className={styles.amountLabel}>Raised</div>
                                                <div className={styles.amountValueGreen}>{formatCurrency(patient.raised)}</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className={styles.progressWrapper}>
                                            <div className={styles.progressTrack}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>
                                            <span className={styles.progressPct}>{pct}%</span>
                                        </div>

                                        {/* Donate Button */}
                                        <button
                                            className={styles.cardDonateBtn}
                                            onClick={() => {
                                                setActiveTab('donate');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            💝 Donate to {patient.anonymous ? 'this Patient' : patient.name}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'donate' && (
                    <div className={styles.donateSection}>
                        <div className={styles.donateCard}>
                            <div className={styles.donateHeader}>
                                <span className={styles.donateIcon}>💝</span>
                                <h2 className={styles.donateTitle}>Make a Donation</h2>
                                <p className={styles.donateSub}>
                                    Every rupee counts. Your generosity directly helps a patient in need.
                                </p>
                            </div>

                            <form onSubmit={handleDonate} className={styles.donateForm}>
                                {/* Amount */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Donation Amount (₹)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        placeholder="Enter amount, e.g. 500"
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        required
                                        min="1"
                                    />
                                    <div className={styles.quickAmounts}>
                                        {[100, 500, 1000, 5000].map((a) => (
                                            <button
                                                type="button"
                                                key={a}
                                                className={styles.quickChip}
                                                onClick={() => setDonationAmount(String(a))}
                                            >
                                                ₹{a.toLocaleString('en-IN')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Anonymous Toggle */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Donate As</label>
                                    <div className={styles.toggleRow}>
                                        <button
                                            type="button"
                                            className={`${styles.toggleBtn} ${isAnonymous ? styles.toggleActive : ''}`}
                                            onClick={() => setIsAnonymous(true)}
                                        >
                                            🕶️ Anonymous
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.toggleBtn} ${!isAnonymous ? styles.toggleActive : ''}`}
                                            onClick={() => setIsAnonymous(false)}
                                        >
                                            😊 Show My Name
                                        </button>
                                    </div>
                                </div>

                                {/* Name (conditional) */}
                                {!isAnonymous && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Your Name</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter your name"
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                {/* Message */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Message <span className={styles.optional}>(optional)</span>
                                    </label>
                                    <textarea
                                        className={styles.formTextarea}
                                        placeholder="Write a message of support..."
                                        rows={3}
                                        value={donorMessage}
                                        onChange={(e) => setDonorMessage(e.target.value)}
                                    />
                                </div>

                                {/* Payment Method */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Payment Method</label>
                                    <select
                                        className={styles.formSelect}
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="upi">UPI</option>
                                        <option value="card">Credit / Debit Card</option>
                                        <option value="netbanking">Net Banking</option>
                                    </select>
                                </div>

                                <button type="submit" className={styles.submitDonateBtn}>
                                    💝 Donate {donationAmount ? formatCurrency(Number(donationAmount)) : 'Now'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </section>

            {/* Success Modal */}
            {showSuccess && (
                <div className={styles.modalOverlay} onClick={() => setShowSuccess(false)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalCheckmark}>
                            <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                                <circle cx="26" cy="26" r="25" fill="none" stroke="#0d9488" strokeWidth="2" className={styles.checkmarkCircle} />
                                <path fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7 7 16-16" className={styles.checkmarkPath} />
                            </svg>
                        </div>
                        <h2 className={styles.modalTitle}>Thank You! ❤️</h2>
                        <p className={styles.modalText}>
                            Thank you for supporting rural healthcare. Your generosity can save a life.
                        </p>
                        <button className={styles.modalClose} onClick={() => setShowSuccess(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
