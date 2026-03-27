'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './request-funds.module.css';

export default function RequestFundsPage() {
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        patientName: '',
        age: '',
        village: '',
        condition: '',
        hospital: '',
        amount: '',
        description: '',
    });

    const update = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <main className={styles.main}>
            <div className={styles.bgPattern}></div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backLink}>
                        ← Back to Home
                    </Link>
                    <span className={styles.headerTitle}>Request Funds</span>
                </div>
            </header>

            <section className={styles.content}>
                <div className={styles.card}>
                    {!submitted ? (
                        <>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardIcon}>📝</span>
                                <h1 className={styles.cardTitle}>Request Medical Funds</h1>
                                <p className={styles.cardSub}>
                                    Fill out the details below. Our team will verify and list your request within 24 hours.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Patient Name</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Full name"
                                            value={form.patientName}
                                            onChange={(e) => update('patientName', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Age</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            placeholder="Age"
                                            value={form.age}
                                            onChange={(e) => update('age', e.target.value)}
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Village / Town</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="e.g. Thiruvallur, Tamil Nadu"
                                        value={form.village}
                                        onChange={(e) => update('village', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Medical Condition</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="e.g. Kidney Dialysis"
                                            value={form.condition}
                                            onChange={(e) => update('condition', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Hospital Name</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Hospital name"
                                            value={form.hospital}
                                            onChange={(e) => update('hospital', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Required Amount (₹)</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        placeholder="e.g. 50000"
                                        value={form.amount}
                                        onChange={(e) => update('amount', e.target.value)}
                                        required
                                        min="1"
                                    />
                                </div>

                                {/* File Upload (UI only) */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Upload Medical Proof</label>
                                    <div className={styles.uploadArea}>
                                        <span className={styles.uploadIcon}>📎</span>
                                        <p className={styles.uploadText}>
                                            Click to upload or drag & drop medical documents
                                        </p>
                                        <p className={styles.uploadHint}>
                                            PDF, JPG, PNG up to 5 MB
                                        </p>
                                        <input type="file" className={styles.uploadInput} accept=".pdf,.jpg,.jpeg,.png" />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Short Description</label>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Briefly describe the patient's situation and why support is needed..."
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => update('description', e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className={styles.submitBtn}>
                                    📤 Submit Request
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.successState}>
                            <div className={styles.successIcon}>
                                <svg viewBox="0 0 80 80" fill="none">
                                    <circle cx="40" cy="40" r="38" stroke="#0d9488" strokeWidth="3" />
                                    <path d="M22 42l12 12 24-24" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className={styles.successTitle}>Request Submitted!</h2>
                            <p className={styles.successText}>
                                Our team will verify and list your request within <strong>24 hours</strong>.
                                You will be notified once the listing is live.
                            </p>
                            <div className={styles.successActions}>
                                <Link href="/" className={styles.homeBtn}>
                                    🏠 Back to Home
                                </Link>
                                <button className={styles.newRequestBtn} onClick={() => {
                                    setSubmitted(false);
                                    setForm({ patientName: '', age: '', village: '', condition: '', hospital: '', amount: '', description: '' });
                                }}>
                                    📝 Submit Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
