'use client';

/**
 * Patient Chatbot Page
 * ====================
 * Guided intake assistant for symptom capture.
 */

import { TopBar } from '@/components/common/TopBar';
import { GuidedIntakeChatbot } from '@/components/chatbot/GuidedIntakeChatbot';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEMO_MODE, getDemoPatient } from '@/lib/demoData';
import { useEffect, useState } from 'react';

export default function PatientChatbotPage() {
    const { t } = useLanguage();
    const [demoPatient, setDemoPatient] = useState<{ name: string } | null>(null);

    useEffect(() => {
        if (DEMO_MODE) {
            const userId = localStorage.getItem('demo_user_id');
            if (userId) {
                const patient = getDemoPatient(userId);
                if (patient) {
                    setDemoPatient({ name: patient.name });
                }
            }
        }
    }, []);

    return (
        <div style={styles.page}>
            <TopBar role="patient" />

            {/* Demo Badge */}
            {DEMO_MODE && demoPatient && (
                <div style={styles.demoBadge}>
                    🎭 {t('Demo Mode')} — {demoPatient.name}
                </div>
            )}

            <main style={styles.main}>
                <GuidedIntakeChatbot />
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f0fdfa 0%, #ecfeff 50%, #f8fafc 100%)',
    },
    demoBadge: {
        padding: '8px 16px',
        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
        color: '#78350f',
        fontSize: '13px',
        fontWeight: 600,
        textAlign: 'center',
    },
    main: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
    },
};
