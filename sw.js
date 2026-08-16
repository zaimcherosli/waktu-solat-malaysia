/* ==========================================================================
   PWA SERVICE WORKER - CACHING & SEAMLESS AUTO-UPDATE ENGINE (V7.0.0)
   ========================================================================== */

const SW_VERSION = '7.0.0';
const CACHE_NAME = `waktu-solat-v${SW_VERSION}`;
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './jakim-zones.js',
  './manifest.json',
  './audio/azan.mp3',
  './data/al-mulk.json',
  './data/al-waqiah.json',
  './fonts/hafs.18.woff2',
  './qrcode-waktusolatmy.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap'
];

// 1. INSTALL SERVICE WORKER (PRE-CACHE WITH NO-STORE TO BYPASS OLD HTTP CACHE)
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing v${SW_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((url) => {
          return cache.add(new Request(url, { cache: 'no-store' }))
            .catch(err => console.warn(`[SW] Failed to cache asset: ${url}`, err));
        })
      );
    })
  );
  // Force immediate activation
  self.skipWaiting();
});

// 2. ACTIVATE SERVICE WORKER (PURGE ALL OLD CACHES IMMEDIATELY & CLAIM CLIENTS)
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating v${SW_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Purging old cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH STRATEGY: NETWORK-FIRST WITH CACHE: 'NO-STORE' FOR ASSETS (SEAMLESS AUTO-UPDATE)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan pintas API calls ke Cloudflare Pages Functions / Workers
  if (url.pathname.startsWith('/api/')) return;

  const isHtml = event.request.headers && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html');
  const isCode = url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.json') || url.pathname === '/' || isHtml;
  const isMedia = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|mp3|woff2|woff|ttf)$/i);

  if (isCode) {
    // Network-First with { cache: 'no-store' } to guarantee fresh updates on every deploy
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback from Cache
          return caches.match(event.request);
        })
    );
  } else if (isMedia) {
    // Cache-First strategy for images, audio & fonts
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => caches.match(event.request));
      })
    );
  }
});

// 4. MESSAGE EVENT: LISTEN FOR SKIP_WAITING & CLIENT COMMANDS
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING signal — activating new version immediately');
    self.skipWaiting();
  }
});

// 5. NOTIFICATION CLICK & PUSH HANDLERS
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifTitle = event.notification ? event.notification.title : '';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            client.postMessage({ action: 'play_azan', title: notifTitle });
          } catch(e){}
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./?play_azan=true');
      }
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
    vibrate: [500, 200, 500, 200, 1000],
    tag: data.type === 'prayer' ? 'waktu-solat-prayer' : 'waktu-solat-surah',
    renotify: true,
    requireInteraction: true,
    data: { url: './', type: data.type, zone: data.zone }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
