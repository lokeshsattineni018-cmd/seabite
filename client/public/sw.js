const CACHE_NAME = 'seabite-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Ignore API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          console.warn("Fetch failed for:", event.request.url);
          // Optional: Return a fallback offline page here if needed
        });
      })
  );
});
