const CACHE = 'senkyo-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const offline = await fetch('/offline');
    if (!offline.ok) throw new Error('Offline shell unavailable');
    const html = await offline.clone().text();
    await cache.put('/offline', offline);
    // Cache only public JS/CSS dependencies of the static offline screen.
    const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^" ]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
    await cache.addAll([...new Set(['/icon.svg', '/manifest.webmanifest', ...assets])]);
  })());
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const saved = await caches.match('/offline');
      return saved ?? Response.error();
    }));
  }
});
