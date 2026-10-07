const CACHE = 'renso-shell-v1';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/favicon.svg','/manifest.webmanifest','/offline.html']))); self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin || new URL(event.request.url).pathname.startsWith('/api')) return;
  if(event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
  else if(['/favicon.svg','/manifest.webmanifest'].includes(new URL(event.request.url).pathname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
