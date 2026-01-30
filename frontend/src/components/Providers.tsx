'use client';

/**
 * Client-side Providers Wrapper
 * =============================
 * Wraps the app with client-side providers like LanguageContext.
 * This is needed because layout.tsx is a server component.
 */

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <LanguageProvider>
            {children}
        </LanguageProvider>
    );
}
