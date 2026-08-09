/* ==========================================================================
   PWA SERVICE WORKER - CACHING & OFFLINE ENGINE
   ========================================================================== */

const CACHE_NAME = 'waktu-solat-v1.1.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './jakim-zones.js',
  './manifest.json',
  './audio/azan.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap'
];

// 1. INSTALL SERVICE WORKER
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets v1.0.3');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 2. ACTIVATE SERVICE WORKER (PURGE OLD CACHES IMMEDIATELY)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH STRATEGY: NETWORK-FIRST WITH CACHE FALLBACK (FRESH DESIGN ASSURED)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// 4. NOTIFICATION CLICK & PUSH HANDLERS
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Waktu Solat Malaysia', body: 'Telah masuk waktu solat.' };
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }
  }
  const options = {
    body: data.body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [300, 100, 300, 100, 500]
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
