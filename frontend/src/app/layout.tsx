import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: 'CareVista - Rural Telemedicine',
    description: 'Offline-first, consent-first telemedicine platform for rural healthcare access',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'CareVista',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#3b82f6',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            </head>
            <body>
                <Providers>
                    {children}
                </Providers>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              // Register service worker for offline support
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('[SW] Registered:', reg.scope))
                    .catch((err) => console.error('[SW] Registration failed:', err));
                });
              }
            `,
                    }}
                />
            </body>
        </html>
    );
}

