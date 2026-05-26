const CACHE_VERSION = 'v2026-05-26-14';
const CACHE_NAME = `jef-hris-cache-${CACHE_VERSION}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/employee/beranda.html',
  '/employee/attendance.html',
  '/employee/tasks.html',
  '/employee/leave.html',
  '/employee/history.html',
  '/admin/dashboard.html',
  '/admin/users.html',
  '/admin/approval.html',
  '/admin/attendance.html',
  '/admin/leave-report.html',
  '/admin/positions.html',
  '/admin/tasks.html',
  '/admin/holidays.html',
  '/admin/config.html',
  '/css/style.css',
  '/js/script.js',
  '/img/logomark.png',
  '/img/profile.png'
];

const isSameOrigin = request => new URL(request.url).origin === self.location.origin;
const isApiRequest = request => {
  const url = request.url;
  return url.includes('script.google.com') || url.includes('action=');
};

async function clearOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => {
    if (cacheName !== CACHE_NAME) {
      return caches.delete(cacheName);
    }
    return Promise.resolve();
  }));
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' }))))
      .catch(() => undefined)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    clearOldCaches().then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data === 'CLEAR_CACHE') {
    event.waitUntil(clearOldCaches());
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET' || !isSameOrigin(request) || isApiRequest(request)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If the network returned an error status (e.g. 404), fall back to cached shell
          if (!response || !response.ok) {
            return caches.match(request).then(cached => cached || caches.match('/index.html'));
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
