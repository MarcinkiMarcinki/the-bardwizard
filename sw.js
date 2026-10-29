// service worker for the web build (dist/web): the installed app opens offline, and picks up a new deploy when online.
// Network first (a cheap 304 when nothing changed), the cache when there is no network. tools/build.py fills in the version
// and the files: the page, game.js and every pack (each with its version in the URL), all cached on install.
// Redirects (e.g. a login page in front of the site) are passed through and never cached.
const CACHE = 'bardwizard-ad47753998';
const FILES = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png", "game.js?v=ff92c05ada", "packs/bard.js?v=4161004331", "packs/kick.js?v=b7ba3504ce", "packs/psy.js?v=2e2c705409", "packs/desert.js?v=0e55297dde", "packs/road.js?v=f609f8f350", "packs/tutorial.js?v=b3b066009f", "packs/rave.js?v=73b49593ab", "packs/prize.js?v=6049f2f3c5", "packs/fans.js?v=4caefc50bb", "packs/raphael.js?v=a7e9782515", "packs/rock.js?v=3d0b1f5ecb", "packs/van.js?v=816910280c", "packs/maps.js?v=c5a707b233", "packs/remix.js?v=5b540a09ec", "packs/prop.desert.cactus.js?v=72ff44c71b", "packs/prop.desert.skull.js?v=666f88d437", "packs/song0.js?v=bf64b712aa", "packs/song1.js?v=a6af2d9b8e", "packs/song2.js?v=03dbdc577a", "packs/song3.js?v=444c083740"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.searchParams.has('v')) {                     // game.js and the packs: a version in the URL never changes, so the cache first
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && res.type === 'basic' && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok && res.type === 'basic' && !res.redirected) {          // (a login page or a redirect is never kept)
      const copy = res.clone(), key = req.mode === 'navigate' ? './' : req;
      caches.open(CACHE).then(c => c.put(key, copy));
    }
    return res;
  }).catch(() => caches.match(req.mode === 'navigate' ? './' : req)
    .then(r => r || caches.match(req.mode === 'navigate' ? './' : req, { ignoreSearch: true }))
    .then(r => r || caches.match('./'))));
});
