
const CACHE = 'solarsat-v7-' + (self.registration ? self.registration.scope : 'scope');
const CORE = [
  'index.html','solar.html','mapa.html','ar.html','vr.html','README.html',
  'assets/css/styles.css','assets/js/solar3d.js','assets/js/satmap.js',
  'assets/img/favicon.svg','manifest.webmanifest'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k.startsWith('solarsat-v7-')?null:caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // Runtime cache for CelesTrak
  if(url.hostname.includes('celestrak.org')){
    e.respondWith(caches.open(CACHE).then(async cache=>{
      try{
        const res = await fetch(e.request);
        cache.put(e.request, res.clone());
        return res;
      }catch(err){
        const cached = await cache.match(e.request);
        if(cached) return cached;
        throw err;
      }
    }));
    return;
  }
  // Cache-first for same-origin and CORE
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});


// Cache GLB/GLTF models at runtime (cache-first)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.pathname.endsWith('.glb') || url.pathname.endsWith('.gltf')){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached = await cache.match(event.request);
      if(cached) return cached;
      const res = await fetch(event.request);
      cache.put(event.request, res.clone());
      return res;
    }));
  }
});
