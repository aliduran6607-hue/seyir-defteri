const CACHE_NAME = 'seyir-defteri-v3';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Dış API'leri ve kendi sunucu fonksiyonumuzu (TMDB proxy, canlı/dinamik veri) hiç önbelleğe alma
  const disaridakiler = ['api.tvmaze.com', 'themoviedb.org', 'image.tmdb.org', 'googleapis.com', 'gstatic.com', 'firebaseio.com', 'firestore.googleapis.com', 'images.weserv.nl'];
  if (disaridakiler.some((d) => url.includes(d))) return;
  if (url.includes('/.netlify/functions/') || url.includes('/api/')) return; // kendi proxy fonksiyonlarımız - her zaman taze veri gelsin
  if (event.request.method !== 'GET') return; // sadece GET isteklerini önbellekle, yazma isteklerine dokunma

  // Kendi dosyalarımız için: önce ağdan taze sürümü almayı dene, olmazsa önbelleğe düş
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Sadece başarılı ve "basic" (aynı-kaynaklı) yanıtları önbelleğe al;
        // opak/hatalı yanıtları önbelleklemek hem gereksiz hem hataya açık.
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => { /* önbelleğe yazılamadı, önemli değil, yanıt yine de dönecek */ });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

