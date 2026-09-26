const CACHE='elders-veil-v4';
const BASE=new URL('./',self.location.href);
const CORE=['index.html','comics.html','manifest.json','assets/icon-192.png','assets/icon-512.png','css/global.css','css/theme.css','js/api.js','js/auth.js','js/i18n.js','js/components.js'].map(x=>new URL(x,BASE).toString());
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match(new URL('404.html',BASE).toString()))));});
