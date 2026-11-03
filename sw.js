const CORE = "atlas-core-v2", RUNTIME = "atlas-runtime-v2";
const ASSETS = ["./","index.html","css/app.css","js/app.js","js/viewer.js","data/families.js","manifest.webmanifest",
  "vendor/three.module.min.js","vendor/addons/controls/OrbitControls.js","vendor/addons/loaders/GLTFLoader.js","vendor/addons/utils/BufferGeometryUtils.js","vendor/addons/libs/meshopt_decoder.module.js",
  "icons/icon-192.png",  "thumbs/bugdoydoshlar.webp",  "thumbs/burchoqdoshlar.webp",  "thumbs/gulxayridoshlar.webp",  "thumbs/ituzumdoshlar.webp",  "thumbs/karamdoshlar.webp",  "thumbs/loladoshlar.webp",  "thumbs/piyozdoshlar.webp",  "thumbs/qoqiotdoshlar.webp",  "thumbs/qovoqdoshlar.webp",  "thumbs/ranodoshlar.webp",  "thumbs/shoradoshlar.webp",  "thumbs/tokdoshlar.webp",];
self.addEventListener("install", e => { e.waitUntil(caches.open(CORE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CORE && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Modellar va shriftlar: birinchi marta ochilganda saqlanadi, keyin internetsiz ishlaydi
  if (url.pathname.endsWith(".glb") || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(RUNTIME).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Sahifa fayllari: avval tarmoq (yangilanish uchun), bo'lmasa kesh
  e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CORE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match("index.html"))));
});
