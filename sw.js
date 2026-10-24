// service worker for the web build (dist/web): the installed app opens offline, and picks up a new deploy when online.
// Network first (a cheap 304 when nothing changed), the cache when there is no network. tools/build.py fills in the version.
// Redirects (e.g. a login page in front of the site) are passed through and never cached.
const CACHE = 'bardwizard-ae46aa086d';
const FILES = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok && res.type === 'basic' && !res.redirected) {          // (a login page or a redirect is never kept)
      const copy = res.clone(), key = req.mode === 'navigate' ? './' : req;
      caches.open(CACHE).then(c => c.put(key, copy));
    }
    return res;
  }).catch(() => caches.match(req.mode === 'navigate' ? './' : req, { ignoreSearch: true })
    .then(r => r || caches.match('./'))));
});
