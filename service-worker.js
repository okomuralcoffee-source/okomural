const CACHE_NAME = 'okomural-erp-v1';

// Install — minimal cache, hanya app shell
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — hanya cache request dari domain sendiri
// Semua request eksternal (Supabase, Google, font, CDN) → biarkan browser handle
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip: bukan GET
  if (e.request.method !== 'GET') return;

  // Skip: semua domain eksternal — biarkan browser handle normal
  const ownOrigin = self.location.origin; // https://erp.okomural.com
  if (url.origin !== ownOrigin) return;

  // Skip: Vercel internal
  if (url.pathname.startsWith('/_next') || url.pathname.startsWith('/api')) return;

  // Untuk request dari domain sendiri → Network first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
