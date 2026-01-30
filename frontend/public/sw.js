/**
 * CareVista Service Worker
 * ========================
 * Enables offline-first functionality for the telemedicine platform.
 * 
 * ETHICAL SAFEGUARD:
 * - Audio recordings are cached ONLY with user consent
 * - No medical data is processed offline
 * - All AI processing happens online only
 */

const CACHE_NAME = 'carevista-v1';
const OFFLINE_ASSETS = [
    '/',
    '/patient/symptoms',
    '/manifest.json',
    '/offline.html',
];

// Install event - cache offline assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching offline assets');
            return cache.addAll(OFFLINE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests - these should always go to network
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((response) => {
                    // Don't cache if not successful
                    if (!response || response.status !== 200) {
                        return response;
                    }

                    // Clone and cache the response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});

// Background sync for offline symptom uploads
self.addEventListener('sync', (event) => {
    if (event.tag === 'symptom-sync') {
        event.waitUntil(syncSymptoms());
    }
});

async function syncSymptoms() {
    // This will be called when network becomes available
    // The actual sync logic is in the main app using IndexedDB
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_TRIGGERED' });
    });
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
