// Avtomatik yaratilgan (tools/make-sw.py). Qo'lda o'zgartirmang.
const VERSION = "da178fde62", CACHE = "atlas-" + VERSION;
const CORE = [
 "./",
 "css/app.css",
 "data/bilim.js",
 "data/families.js",
 "fonts/fraunces-latin-500-italic.woff2",
 "fonts/fraunces-latin-500-normal.woff2",
 "fonts/fraunces-latin-600-normal.woff2",
 "fonts/fraunces-latin-ext-500-italic.woff2",
 "fonts/fraunces-latin-ext-500-normal.woff2",
 "fonts/fraunces-latin-ext-600-normal.woff2",
 "fonts/inter-latin-400-normal.woff2",
 "fonts/inter-latin-500-normal.woff2",
 "fonts/inter-latin-600-normal.woff2",
 "fonts/inter-latin-700-normal.woff2",
 "fonts/inter-latin-ext-400-normal.woff2",
 "fonts/inter-latin-ext-500-normal.woff2",
 "fonts/inter-latin-ext-600-normal.woff2",
 "fonts/inter-latin-ext-700-normal.woff2",
 "icons/apple-touch-icon.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon.svg",
 "icons/maskable-512.png",
 "index.html",
 "js/app.js",
 "js/info.js",
 "js/viewer.js",
 "manifest.webmanifest",
 "thumbs/bugdoydoshlar.webp",
 "thumbs/burchoqdoshlar.webp",
 "thumbs/gulxayridoshlar.webp",
 "thumbs/ituzumdoshlar.webp",
 "thumbs/karamdoshlar.webp",
 "thumbs/loladoshlar.webp",
 "thumbs/piyozdoshlar.webp",
 "thumbs/qoqiotdoshlar.webp",
 "thumbs/qovoqdoshlar.webp",
 "thumbs/ranodoshlar.webp",
 "thumbs/shoradoshlar.webp",
 "thumbs/tokdoshlar.webp",
 "vendor/addons/controls/OrbitControls.js",
 "vendor/addons/libs/meshopt_decoder.module.js",
 "vendor/addons/loaders/GLTFLoader.js",
 "vendor/addons/utils/BufferGeometryUtils.js",
 "vendor/addons/utils/TextureUtils.js",
 "vendor/three.module.min.js"
];
const MODELS = [
 "models/47_Ranodoshlar.glb",
 "models/48_Karamdoshlar.glb",
 "models/49_Shoradoshlar.glb",
 "models/50_Gulxayridoshlar.glb",
 "models/51_Burchoqdoshlar.glb",
 "models/52_Ituzumdoshlar.glb",
 "models/53_Tokdoshlar.glb",
 "models/54_Qovoqdoshlar.glb",
 "models/55_Qoqiotdoshlar.glb",
 "models/56_Loladoshlar.glb",
 "models/57_Piyozdoshlar.glb",
 "models/58_Bugdoydoshlar.glb"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);                                   // asosiy fayllar: majburiy
    await Promise.allSettled(MODELS.map((m) => c.add(m)));  // modellar: internet sekin bo'lsa ham o'rnatish buzilmaydi
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "status") e.source.postMessage({ type: "status", version: VERSION }); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isModel = req.url.split("?")[0].endsWith(".glb");
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (isModel && hit) return hit;                         // katta modellar: avval kesh
    // Boshqa fayllar: avval yangisini olishga urinamiz (3 s), bo'lmasa kesh -> yangilanish darrov ko'rinadi, internetsiz ham ishlaydi
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), hit ? 3000 : 15000);
      const r = await fetch(req, { cache: "no-cache", signal: ctl.signal }); clearTimeout(t);
      if (r.ok) c.put(req, r.clone());
      return r.ok || !hit ? r : hit;
    } catch (err) {
      if (hit) return hit;
      if (req.mode === "navigate") return (await c.match("index.html")) || Response.error();
      return Response.error();
    }
  })());
});
