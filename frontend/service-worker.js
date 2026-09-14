/* Replaced with a content-specific version and complete asset list during build. */
const CACHE = '__CACHE_NAME__';
const PREFIX = '__CACHE_PREFIX__';
const BASE = '__BASE_URL__';
const ASSETS = __PRECACHE_ASSETS__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  // New versions wait until all existing app windows have closed.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Always use the shell matching this worker's assets, including while updating.
    if (event.request.mode === 'navigate') return (await cache.match(`${BASE}index.html`)) || fetch(event.request);
    return (await cache.match(event.request)) || fetch(event.request);
  })());
});
