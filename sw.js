// App screen works offline; the scanner, bill reader and other libraries are kept after the first download.
// OneDrive and Microsoft sign-in requests always go to the network.
const CACHE = 'claims-v2';
const LIBS = 'claims-libs-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const LIB_HOSTS = ['cdn.jsdelivr.net', 'docs.opencv.org', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== LIBS).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(LIB_HOSTS.includes(url.hostname)){
    // pinned library versions: use the saved copy, download only once
    e.respondWith(caches.open(LIBS).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if(r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    }))));
    return;
  }
  if(url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch:true}).then(r => r || caches.match('./index.html')))
  );
});
