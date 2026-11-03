#!/usr/bin/env python3
"""sw.js ni avtomatik yaratadi: barcha fayllar oldindan keshlanadi. Fayl o'zgarsa versiya o'zgaradi."""
import os, hashlib, json
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {".git", ".github", "tools", "node_modules", "android-app"}
SKIPF = {"sw.js", "vercel.json", "README.md", ".gitignore"}
files = []
for d, ds, fs in os.walk(R):
    ds[:] = [x for x in ds if x not in SKIP]
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), R).replace(os.sep, "/")
        if f not in SKIPF and not f.startswith("."): files.append(rel)
files.sort()
h = hashlib.sha1()
for f in files: h.update(f.encode()); h.update(open(os.path.join(R, f), "rb").read())
ver = h.hexdigest()[:10]
big = [f for f in files if f.endswith(".glb")]
core = ["./"] + [f for f in files if f not in big]
open(os.path.join(R, "sw.js"), "w", encoding="utf8").write(f'''// Avtomatik yaratilgan (tools/make-sw.py). Qo'lda o'zgartirmang.
const VERSION = "{ver}", CACHE = "atlas-" + VERSION;
const CORE = {json.dumps(core, indent=1)};
const MODELS = {json.dumps(big, indent=1)};

self.addEventListener("install", (e) => {{
  e.waitUntil((async () => {{
    const c = await caches.open(CACHE);
    await c.addAll(CORE);                                   // asosiy fayllar: majburiy
    await Promise.allSettled(MODELS.map((m) => c.add(m)));  // modellar: internet sekin bo'lsa ham o'rnatish buzilmaydi
    await self.skipWaiting();
  }})());
}});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener("message", (e) => {{ if (e.data === "status") e.source.postMessage({{ type: "status", version: VERSION }}); }});
self.addEventListener("fetch", (e) => {{
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {{
    const c = await caches.open(CACHE);
    const hit = await c.match(req, {{ ignoreSearch: true }});
    if (hit) return hit;                                    // avval kesh: internetsiz ham, sekin internetda ham tez
    try {{ const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }}
    catch (err) {{ if (req.mode === "navigate") return (await c.match("index.html")) || Response.error(); return Response.error(); }}
  }})());
}});
''')
print("sw.js", ver, len(core), "core +", len(big), "models")
