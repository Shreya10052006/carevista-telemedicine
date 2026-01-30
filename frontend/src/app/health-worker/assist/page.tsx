'use client';

/**
 * Legacy Health Worker Assist Page
 * =================================
 * This page has been replaced by the new Session page.
 * Auto-redirects to /health-worker/session for backward compatibility.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAssistRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new session page
        router.replace('/health-worker/session');
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, color: '#64748b' }}>
                    Redirecting to the new Session page...
                </p>
            </div>
        </div>
    );
}
