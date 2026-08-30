const CACHE_NAME = 'okomural-erp-v1';
const SHELL = ['/'];

// Install — cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL))
  );
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

// Fetch — Network first, fallback ke cache
// Supabase API selalu network (tidak di-cache)
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Supabase & Google API — selalu network
  if (url.includes('supabase.co') || url.includes('googleapis.com')) {
    return; // biarkan browser handle normal
  }

  // App shell — Network first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache response terbaru
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
