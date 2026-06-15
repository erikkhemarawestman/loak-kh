const CACHE = 'loak-kh-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@500;600;700&family=Hanuman:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', e => {
  // Skip non-GET and Supabase API calls
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('supabase.co')) return;
  if(e.request.url.includes('googleapis.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback — serve cached version
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // For navigation requests, return index.html
          if(e.request.mode === 'navigate'){
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Push notifications (future use)
self.addEventListener('push', e => {
  if(!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'Loak.kh', {
    body: data.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data?.url || '/')
  );
});
