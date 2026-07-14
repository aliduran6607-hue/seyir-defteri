const CACHE_NAME = 'seyir-defteri-v2';
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
  // Ağ isteklerini (TVMaze, Firebase, Google API'leri) her zaman internetten çek, önbelleğe hiç bakma
  const url = event.request.url;
  if (url.includes('api.tvmaze.com') || url.includes('googleapis.com') || url.includes('gstatic.com') || url.includes('firebaseio.com') || url.includes('firestore.googleapis.com')) return;
  // Kendi dosyalarımız için: önce ağdan taze sürümü almayı dene, olmazsa önbelleğe düş
  // Bu sayede yeni güncelleme yayınlandığında eski sürüm takılı kalmaz
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
