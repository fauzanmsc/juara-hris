const CACHE_NAME = 'jef-hris-cache-v8';
const urlsToCache = [
  '/',
  '/index.html',
  '/employee.html',
  '/attendance.html',
  '/leave.html',
  '/history.html',
  '/admin.html',
  '/css/style.css',
  '/js/script.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Clearing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Stale-While-Revalidate Caching Strategy
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Bypass caching for Apps Script API requests to prevent stale API responses
  if (event.request.url.includes('script.google.com') || event.request.url.includes('action=')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchedResponse = fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Swallow network errors silently
        });

        // Return cached response immediately if available, otherwise fetch from network
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
