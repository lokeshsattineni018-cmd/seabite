const CACHE_NAME = 'seabite-v1.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.webp',
  '/favicon.webp',
  '/roundlogo.webp',
  '/manifest.json'
];

// Install event - caching core assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Become available to all clients immediately
  );
});

// Fetch event - sophisticated strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Ignore API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 3. Special handling for navigation requests (index.html)
  // We want a Network-First strategy here to avoid stale asset links
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with new index.html
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // 4. Standard assets (JS, CSS, Images)
  // Use Cache-First with Network-Fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // Don't cache assets from other domains unless needed
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        });
      })
  );
});

// ==========================================
// WEB PUSH NOTIFICATION EVENTS
// ==========================================

// Push event listener - display notification
self.addEventListener('push', event => {
  let data = { title: 'SeaBite Update', body: 'New update from SeaBite!' };
  try {
    data = event.data ? event.data.json() : data;
  } catch (e) {
    // If not json payload, use text
    data = { title: 'SeaBite Update', body: event.data ? event.data.text() : 'New update from SeaBite!' };
  }

  const options = {
    body: data.body,
    icon: '/roundlogo.png',
    badge: '/roundlogo.png',
    data: data.data || {},
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window open with this url and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

