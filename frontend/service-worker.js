const CACHE = 'elders-veil-v8-perf-fix';
const BASE = new URL('./', self.location.href);
const CORE = ['index.html', 'comics.html', 'manifest.json', 'assets/icon-192.png', 'assets/icon-512.png', 'css/global.css', 'css/navbar.css', 'css/variables.css', 'js/api.js', 'js/auth.js', 'js/components.js'].map(x => new URL(x, BASE).toString());

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Do not store dynamic API responses in static SW cache
  if (url.pathname.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'Network error. Please check internet connection.' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match(new URL('index.html', BASE).toString())))
  );
});
