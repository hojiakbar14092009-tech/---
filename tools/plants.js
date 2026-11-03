// Botanika Atlasi — 12 ta o'simlikning protsedurali 3D modellari.
// Brauzerda ishlaydi (tools/build.html), natija models/*.glb ga eksport qilinadi.
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI, TAU = 2 * PI;
let S = 1;
const seed = (s) => (S = s);
const rnd = () => (S = (S * 16807) % 2147483647) / 2147483647;
const rr = (a, b) => a + (b - a) * rnd();
const C = (h) => new THREE.Color(h);
const clamp = THREE.MathUtils.clamp;
const mix = (a, b, t) => C(a).lerp(C(b), clamp(t, 0, 1));
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
function hash(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), f = (t) => t * t * (3 - 2 * t);
  const u = f(x - xi), v = f(y - yi), w = f(z - zi); let r = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++)
    r += hash(xi + a, yi + b, zi + c) * (a ? u : 1 - u) * (b ? v : 1 - v) * (c ? w : 1 - w);
  return r;
}
const fbm = (x, y, z) => noise(x, y, z) * 0.6 + noise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + noise(x * 4.3, y * 4.3, z * 4.3) * 0.1;

function mat(o) { return new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide, metalness: 0 }, o)); }
const MATS = () => ({
  leaf: mat({ roughness: 0.58, name: "barg" }), stem: mat({ roughness: 0.72, name: "poya" }), bark: mat({ roughness: 0.92, name: "po'stloq" }),
  petal: mat({ roughness: 0.5, name: "gulbarg" }), fruit: mat({ roughness: 0.3, name: "meva" }), matte: mat({ roughness: 0.78, name: "xira" }),
  root: mat({ roughness: 0.95, name: "ildiz" }), fluff: mat({ roughness: 1, name: "tola" })
});

function mk(pos, col, idx, nor) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  if (nor) g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); else g.computeVertexNormals();
  return g;
}
function paint(g, fn) {
  const p = g.attributes.position, a = new Float32Array(p.count * 3), v = V();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = fn(v, i); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
}
// Mahalliy +Y o'qini d yo'nalishga, +Z ni (yuzaning normali) hint tomonga buradi
function frame(pos, d, hint = UP, s = 1, roll = 0) {
  const y = d.clone().normalize();
  let z = hint.clone().sub(y.clone().multiplyScalar(hint.dot(y)));
  if (z.lengthSq() < 1e-6) z = V(0, 0, 1).sub(y.clone().multiplyScalar(y.z));
  z.normalize(); if (roll) z.applyAxisAngle(y, roll);
  const x = V().crossVectors(y, z);
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  m.scale(V(s, s, s)); m.setPosition(pos); return m;
}
const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

class Plant {
  constructor() { this.g = {}; }
  add(m, geo, mtx) {
    for (const k of Object.keys(geo.attributes)) if (!["position", "normal", "color"].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.color) paint(geo, () => C("#ffffff"));
    if (mtx) geo.applyMatrix4(mtx);
    (this.g[m] = this.g[m] || []).push(geo);
  }
  build(name) {
    const grp = new THREE.Group(); grp.name = name; const M = MATS();
    for (const k in this.g) { const geo = mergeGeometries(this.g[k], false); const mesh = new THREE.Mesh(geo, M[k]); mesh.name = k; grp.add(mesh); }
    return grp;
  }
}

// ---------- Asosiy shakllar ----------
// Torayib boruvchi naycha (poya, ildiz, jingalak)
function tube(pts, r0, r1, c0, c1, radial = 7, rfn) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const seg = clamp(Math.round(curve.getLength() * 60) + pts.length * 2, 6, 90);
  const fr = curve.computeFrenetFrames(seg, false), pos = [], nor = [], col = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, p = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i];
    const r = rfn ? rfn(t) : r0 + (r1 - r0) * Math.pow(t, 0.9), c = mix(c0, c1 || c0, t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU, cs = Math.cos(a), sn = Math.sin(a);
      const n = V(N.x * cs + B.x * sn, N.y * cs + B.y * sn, N.z * cs + B.z * sn);
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r); nor.push(n.x, n.y, n.z);
      const k = 0.9 + 0.12 * noise(t * 30, j * 0.7, r0 * 99); col.push(c.r * k, c.g * k, c.b * k);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  return mk(pos, col, idx, nor);
}
// Sferani deformatsiya qilish (mevalar, piyozbosh)
function blob(r, ws, hs, fn, cfn) {
  let g = new THREE.SphereGeometry(r, ws, hs); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g);
  const p = g.attributes.position, v = V(), cols = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const d = v.clone().normalize(); fn && fn(v, d); p.setXYZ(i, v.x, v.y, v.z);
    const c = cfn ? cfn(d, v) : C("#fff"); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
}
function lathe(prof, seg, cfn, deform) {
  let g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g);
  const p = g.attributes.position, v = V(), cols = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const phi = Math.atan2(v.z, v.x); deform && deform(v, phi); p.setXYZ(i, v.x, v.y, v.z);
    const c = cfn ? cfn(v, phi) : C("#fff"); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
}
// Barg / gulbarg: +Y bo'ylab cho'zilgan, normali +Z
const SH = {
  ovate: (t) => Math.pow(Math.sin(PI * Math.pow(t, 0.72)), 0.85),
  elliptic: (t) => Math.pow(Math.sin(PI * t), 0.75),
  lance: (t) => Math.pow(Math.sin(PI * Math.pow(t, 0.85)), 1.25),
  heart: (t) => Math.pow(Math.sin(PI * Math.pow(t, 0.5)), 0.6) * (0.75 + 0.25 * Math.min(1, t * 6)),
  obovate: (t) => Math.pow(Math.sin(PI * Math.pow(t, 1.5)), 0.7),
  round: (t) => Math.pow(Math.sin(PI * t), 0.5),
  linear: (t) => Math.min(1, (1 - t) * 4) * Math.min(1, 0.6 + t * 8),
};
function leaf(o) {
  const L = o.L || 1, W = o.W || 0.4, shape = o.shape || SH.ovate, bend = o.bend ?? 0.25, fold = o.fold ?? 0.12, serr = o.serr || 0, serrN = o.serrN || 20;
  const wave = o.wave ?? 0.03, segL = o.segL || 20, segW = o.segW || 5, veins = o.veins ?? 7, lobes = o.lobes, curlTip = o.curl || 0, sd = o.seed || rnd() * 100;
  const cb = C(o.base || "#3d6b2f"), ct = C(o.tip || o.base || "#5c8c3a"), cv = C(o.vein || "#9fc07a"), edge = o.edge ?? 0.82, tw = o.twist || 0;
  const pos = [], col = [], idx = [], cols = segW * 2;
  for (let i = 0; i <= segL; i++) {
    const t = i / segL; let w = (W / 2) * shape(t) * (lobes ? lobes(t) : 1);
    if (serr) w *= 1 - serr * (1 - ((t * serrN) % 1));
    const ang = tw * t;
    for (let j = 0; j <= cols; j++) {
      const u = j / segW - 1, au = Math.abs(u);
      let x = u * w, y = t * L, z = -bend * L * t * t + fold * W * u * u * shape(t) + wave * W * (fbm(t * 6 + sd, u * 2, sd) - 0.5) * (0.3 + au);
      if (curlTip) z -= curlTip * L * Math.pow(t, 6);
      const xr = x * Math.cos(ang) - z * Math.sin(ang), zr = x * Math.sin(ang) + z * Math.cos(ang);
      pos.push(xr, y, zr);
      const c = cb.clone().lerp(ct, t);
      const side = Math.abs(((t * veins - au * 0.9) % 1 + 1) % 1);
      if (au < 0.07) c.lerp(cv, 0.65 * (1 - t * 0.5)); else if (side < 0.07 && au < 0.85) c.lerp(cv, 0.28);
      if (au > 0.8) c.multiplyScalar(edge + (1 - edge) * (1 - au) * 5);
      c.multiplyScalar((0.93 + 0.12 * noise(t * 9 + sd, u * 4, 1)) * (o.gain || 1.18)); col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segL; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + cols + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  return mk(pos, col, idx);
}
// Panjasimon barg (tok, qovoq, g'o'za): markaz — band birikkan joy
function palm(o) {
  const R = o.R || 1, n = o.lobes || 5, depth = o.depth ?? 0.35, serr = o.serr ?? 0.04, serrN = o.serrN || 60, cup = o.cup ?? 0.12;
  const segR = 12, segA = 72, cb = C(o.base || "#3e6b2e"), ct = C(o.tip || "#5a8a3a"), cv = C(o.vein || "#a9c784"), sd = o.seed || rnd() * 100, back = o.back ?? 0.7;
  const pos = [], col = [], idx = [];
  for (let i = 0; i <= segR; i++) {
    const s = i / segR;
    for (let j = 0; j <= segA; j++) {
      const th = -PI + (j / segA) * TAU, lob = Math.abs(Math.cos((th * n) / 2));
      let r = R * (1 - depth + depth * Math.pow(lob, 0.7)) * (back + (1 - back) * (0.5 + 0.5 * Math.cos(th)));
      r *= 1 - serr * (1 - (((th + PI) / TAU) * serrN % 1));
      const x = s * r * Math.sin(th), y = s * r * Math.cos(th);
      const z = -cup * R * s * s + 0.05 * R * s * Math.pow(lob, 4) + 0.06 * R * s * (fbm(x * 6 + sd, y * 6, sd) - 0.5);
      pos.push(x, y, z);
      const c = cb.clone().lerp(ct, s), vein = Math.abs(Math.sin((th * n) / 2));
      if (vein < 0.06 / (s + 0.25)) c.lerp(cv, 0.6);
      else { const sec = Math.abs(((s * 6 - vein * 1.4) % 1 + 1) % 1); if (sec < 0.08) c.lerp(cv, 0.22); }
      if (s > 0.92) c.multiplyScalar(0.85);
      c.multiplyScalar((0.92 + 0.14 * noise(x * 9 + sd, y * 9, 2)) * 1.2); col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segR; i++) for (let j = 0; j < segA; j++) { const a = i * (segA + 1) + j, b = a + segA + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  return mk(pos, col, idx);
}
function helix(base, dir, len, r, turns, w, c) {
  const pts = [], d = dir.clone().normalize(), a = V().crossVectors(d, Math.abs(d.y) > 0.9 ? V(1, 0, 0) : UP).normalize(), b = V().crossVectors(d, a);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, ang = t * turns * TAU, rad = r * Math.min(1, t * 3) * (1 - t * 0.4);
    pts.push(base.clone().add(d.clone().multiplyScalar(len * t)).add(a.clone().multiplyScalar(Math.cos(ang) * rad)).add(b.clone().multiplyScalar(Math.sin(ang) * rad)));
  }
  return tube(pts, w, w * 0.4, c, c, 5);
}
function roots(P, at, n, len, r, c, spread = 0.6) {
  for (let k = 0; k < n; k++) {
    const ang = rnd() * TAU, s = rr(0.3, 1) * spread, dir = V(Math.cos(ang) * s, -1, Math.sin(ang) * s).normalize();
    let p = at.clone(); const pts = [p.clone()], L = len * rr(0.6, 1.2);
    for (let i = 0; i < 6; i++) { p = p.clone().add(dir.clone().multiplyScalar(L / 6)); dir.x += rr(-0.35, 0.35); dir.z += rr(-0.35, 0.35); dir.y -= 0.15; dir.normalize(); pts.push(p); }
    P.add("root", tube(pts, r * rr(0.7, 1.1), r * 0.15, c, c, 5));
  }
}
function taproot(P, at, len, r, c, laterals = 10) {
  const pts = []; for (let i = 0; i <= 6; i++) pts.push(at.clone().add(V(rr(-0.02, 0.02) * i, (-len * i) / 6, rr(-0.02, 0.02) * i)));
  P.add("root", tube(pts, r, r * 0.08, c, c, 7));
  const curve = new THREE.CatmullRomCurve3(pts);
  for (let k = 0; k < laterals; k++) { const t = rr(0.12, 0.85); roots(P, curve.getPointAt(t), 1, len * 0.45 * (1 - t * 0.6), r * 0.25, c, 2.2); }
}
// Shoxlangan novda bo'ylab nuqtalar
function pointsOn(pts, n, from = 0, to = 1) { const c = new THREE.CatmullRomCurve3(pts); return Array.from({ length: n }, (_, i) => { const t = from + ((to - from) * (i + 0.5)) / n; return { p: c.getPointAt(t), d: c.getTangentAt(t), t }; }); }
const out = (d, ang, elev) => { const h = V().crossVectors(d, Math.abs(d.y) > 0.95 ? V(1, 0, 0) : UP).normalize(); h.applyAxisAngle(d.clone().normalize(), ang); return h.multiplyScalar(Math.cos(elev)).add(UP.clone().multiplyScalar(Math.sin(elev))).normalize(); };

// Gul: F matritsa (gul +Y ga qaragan mahalliy tizim)
function flower(P, F, o) {
  const n = o.n || 5, tilt = o.tilt ?? 1.0, rot = o.rot || 0;
  for (let k = 0; k < (o.rows || 1); k++) for (let i = 0; i < n; i++) {
    const ph = rot + (i / n) * TAU + (k * PI) / n, a = tilt - k * (o.rowStep || 0.25) + rr(-0.06, 0.06);
    const d = V(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph));
    const base = V(Math.cos(ph), 0, Math.sin(ph)).multiplyScalar(o.r0 || 0.003);
    const g = leaf(Object.assign({ segL: 12, segW: 4, veins: 0, wave: 0.04, seed: i * 7 + k }, o.petal));
    P.add("petal", g, F.clone().multiply(frame(base, d, UP, 1 - k * (o.rowShrink || 0.12), o.petalRoll || 0)));
  }
}
function stamens(P, F, n, len, rad, cf, ca, spread = 0.5) {
  for (let i = 0; i < n; i++) {
    const ph = rnd() * TAU, a = rr(0.1, spread), l = len * rr(0.8, 1.1), d = V(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph));
    P.add("matte", tube([V(), d.clone().multiplyScalar(l)], 0.0006 * rad, 0.0005 * rad, cf, cf, 4), F);
    P.add("matte", blob(0.0018 * rad, 6, 4, (v) => v.y *= 1.5, () => C(ca)), F.clone().multiply(T(d.x * l, d.y * l, d.z * l)));
  }
}

// ================= O'SIMLIKLAR =================
const SPECIES = {};

// 47 — Olma novdasi (gul + meva)
SPECIES.ranodoshlar = () => {
  seed(47); const P = new Plant();
  const br = [V(-0.42, -0.05, 0), V(-0.2, 0.05, 0.02), V(0.05, 0.1, -0.02), V(0.3, 0.2, 0.03), V(0.48, 0.34, 0)];
  P.add("bark", tube(br, 0.024, 0.007, "#5b4636", "#7b6a52", 9));
  const tw1 = [V(-0.05, 0.08, 0), V(0.0, 0.2, 0.05), V(0.04, 0.32, 0.04)], tw2 = [V(0.18, 0.15, 0), V(0.26, 0.12, 0.12), V(0.36, 0.08, 0.2)];
  P.add("bark", tube(tw1, 0.011, 0.005, "#6a5440", "#7e6c55", 7)); P.add("bark", tube(tw2, 0.01, 0.005, "#6a5440", "#7e6c55", 7));
  const lf = (p, d, i) => {
    const dir = out(d, i * 2.4 + rr(-0.4, 0.4), rr(0.0, 0.6)), L = rr(0.12, 0.16);
    const pe = p.clone().add(dir.clone().multiplyScalar(0.025));
    P.add("stem", tube([p, pe], 0.0022, 0.0016, "#7a8a46"));
    P.add("leaf", leaf({ L, W: L * 0.55, shape: SH.ovate, serr: 0.05, serrN: 26, bend: 0.35, fold: 0.18, base: "#335f27", tip: "#4f8135", vein: "#a8c47e", veins: 8 }), frame(pe, dir, UP, 1, rr(-0.3, 0.3)));
  };
  pointsOn(br, 9, 0.15, 0.97).forEach((q, i) => lf(q.p, q.d, i));
  pointsOn(tw1, 4, 0.3, 1).forEach((q, i) => lf(q.p, q.d, i + 3));
  pointsOn(tw2, 3, 0.3, 1).forEach((q, i) => lf(q.p, q.d, i + 7));
  // Olmalar
  const apple = (at, r, blush) => {
    const top = at.clone().add(V(0, r * 0.82, 0));
    P.add("fruit", blob(r, 40, 30, (v, d) => {
      v.y *= 0.9; v.x *= 1 + 0.06 * d.y; v.z *= 1 + 0.06 * d.y;
      const ay = Math.abs(d.y); if (ay > 0.8) v.multiplyScalar(1 - 0.5 * Math.pow((ay - 0.8) / 0.2, 2) * 0.4);
    }, (d) => {
      const s = clamp(0.5 + 0.5 * (d.x * blush.x + d.z * blush.z) + (fbm(d.x * 3, d.y * 3, d.z * 3) - 0.5) * 0.8, 0, 1);
      const c = mix("#b9b03c", "#a61e22", s); if (hash(Math.round(d.x * 60), Math.round(d.y * 60), Math.round(d.z * 60)) > 0.93) c.lerp(C("#e8d9a0"), 0.5);
      if (Math.abs(d.y) > 0.9) c.lerp(C("#6f7a2c"), 0.5); return c;
    }), T(at.x, at.y, at.z));
    return top;
  };
  [[V(-0.12, -0.12, 0.06), 0.06, V(1, 0, 0.3), V(-0.12, 0.06, 0.01)], [V(0.03, -0.1, 0.02), 0.068, V(0.2, 0, 1), V(0.04, 0.1, 0)], [V(0.32, -0.02, 0.14), 0.055, V(-1, 0, 0.5), V(0.3, 0.11, 0.15)]]
    .forEach(([at, r, b, hang]) => { const top = apple(at, r, b); P.add("bark", tube([hang, hang.clone().lerp(top, 0.5).add(V(0.01, 0, 0)), top.clone().add(V(0, -0.01, 0))], 0.0028, 0.0022, "#6b5236", "#5a4430", 5)); });
  // Gullar (tw1 uchida)
  const tip = V(0.04, 0.32, 0.04);
  [[0, 0.9, 0.04], [2.1, 0.7, 0.05], [4.2, 0.8, 0.045], [1.1, 0.25, 0.03], [3.3, 0.35, 0.035]].forEach(([ang, el, l], i) => {
    const d = V(Math.cos(ang) * Math.cos(el), Math.sin(el), Math.sin(ang) * Math.cos(el)), fp = tip.clone().add(d.clone().multiplyScalar(l));
    P.add("stem", tube([tip, tip.clone().lerp(fp, 0.5).add(V(0, 0.008, 0)), fp], 0.0016, 0.0014, "#7c8a3e", "#8b6a4a", 4));
    const F = frame(fp, d.clone().lerp(UP, 0.3), V(0.3, 0, 1));
    if (i < 3) {
      flower(P, F, { n: 5, tilt: 1.15, petal: { L: 0.024, W: 0.022, shape: SH.round, fold: 0.25, bend: -0.1, base: "#e6a7b8", tip: "#fbf4f3", wave: 0.06 } });
      stamens(P, F, 20, 0.009, 1, "#f2efe2", "#d9b23a", 0.6);
      flower(P, F.clone().multiply(T(0, -0.002, 0)), { n: 5, tilt: 2.1, rot: 0.6, petal: { L: 0.007, W: 0.004, shape: SH.lance, base: "#5d7a32", tip: "#6f8a3a" } });
    } else {
      P.add("petal", blob(0.008, 14, 10, (v) => { v.y *= 1.35; }, (d) => mix("#f3dfe3", "#d97f98", 0.5 + d.y * 0.5)), F.clone().multiply(T(0, 0.008, 0)));
      flower(P, F, { n: 5, tilt: 0.5, petal: { L: 0.008, W: 0.005, shape: SH.lance, base: "#5d7a32", tip: "#6f8a3a" } });
    }
  });
  return P.build("Olma novdasi");
};

// 48 — Xantal (gullagan karamdosh)
SPECIES.karamdoshlar = () => {
  seed(48); const P = new Plant(), base = V(0, 0, 0);
  const main = [base, V(0.01, 0.25, 0), V(-0.01, 0.55, 0.01), V(0.0, 0.85, 0), V(0.01, 1.02, 0.005)];
  P.add("stem", tube(main, 0.011, 0.003, "#5e7f3a", "#7f9a4c", 8));
  const brs = [[0.45, 0.9, 0.35], [0.62, 3.3, 0.28], [0.72, 5.2, 0.22]].map(([t, a, l]) => {
    const c = new THREE.CatmullRomCurve3(main), p = c.getPointAt(t), d = V(Math.cos(a), 0, Math.sin(a));
    const pts = [p, p.clone().add(d.clone().multiplyScalar(l * 0.35)).add(V(0, l * 0.4, 0)), p.clone().add(d.clone().multiplyScalar(l * 0.5)).add(V(0, l, 0))];
    P.add("stem", tube(pts, 0.005, 0.0025, "#62833c", "#809a4c", 6)); return pts;
  });
  const lyrate = (t) => (0.45 + 0.55 * Math.pow(Math.abs(Math.sin(t * PI * 3.2)), 0.6)) * (0.6 + 0.6 * t);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + rr(-0.2, 0.2), d = V(Math.cos(a), rr(0.25, 0.5), Math.sin(a)), L = rr(0.24, 0.32);
    P.add("leaf", leaf({ L, W: L * 0.42, shape: SH.obovate, lobes: lyrate, serr: 0.06, serrN: 30, bend: 0.5, fold: 0.1, base: "#43692d", tip: "#5c853b", vein: "#b9cf92" }), frame(V(0, 0.01, 0), d, UP, 1, rr(-0.2, 0.2))); }
  pointsOn(main, 4, 0.15, 0.6).forEach((q, i) => { const d = out(q.d, i * 2.4, 0.4), L = 0.13 - i * 0.02;
    P.add("leaf", leaf({ L, W: L * 0.32, shape: SH.lance, serr: 0.05, serrN: 18, bend: 0.3, base: "#4c7331", tip: "#628a3d", vein: "#b9cf92" }), frame(q.p, d)); });
  const raceme = (pts, nf, ns) => {
    const c = new THREE.CatmullRomCurve3(pts), tip = c.getPointAt(1), d = c.getTangentAt(1);
    // qo'zoqlar (pastda)
    for (let k = 0; k < ns; k++) { const t = 0.35 + (0.5 * k) / ns, p = c.getPointAt(t), dd = out(c.getTangentAt(t), k * 2.4, 0.9);
      const pe = p.clone().add(dd.clone().multiplyScalar(0.012)), pod = dd.clone().lerp(UP, 0.6).normalize(), L = rr(0.045, 0.06);
      P.add("stem", tube([p, pe], 0.001, 0.001, "#7f9a4c"));
      P.add("matte", tube([pe, pe.clone().add(pod.clone().multiplyScalar(L * 0.5)).add(V(0.003, 0, 0)), pe.clone().add(pod.clone().multiplyScalar(L))], 0.0024, 0.0006, "#86a14a", "#9fb35c", 6, (t) => 0.0024 * (t < 0.08 ? t / 0.08 : t > 0.85 ? (1 - t) / 0.15 * 0.8 + 0.2 : 1 + 0.12 * Math.sin(t * 40)))); }
    // gullar (uchida)
    for (let k = 0; k < nf; k++) {
      const a = k * 2.4, el = 0.2 + (k / nf) * 1.2, dd = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), fp = tip.clone().add(dd.clone().multiplyScalar(0.012 + 0.006 * (1 - k / nf))).add(V(0, -0.015 * (1 - k / nf), 0));
      P.add("stem", tube([tip.clone().add(V(0, -0.015 * (1 - k / nf), 0)), fp], 0.0008, 0.0008, "#86a14a"));
      const F = frame(fp, dd.clone().lerp(UP, 0.4), V(1, 0, 0));
      if (k > nf - 4) { P.add("petal", blob(0.0035, 8, 6, (v) => v.y *= 1.4, () => C("#c9b52a")), F); continue; }
      flower(P, F, { n: 4, tilt: 1.05, petal: { L: 0.016, W: 0.012, shape: SH.obovate, fold: 0.1, bend: -0.1, base: "#e6b41c", tip: "#f6d63a" } });
      stamens(P, F, 6, 0.005, 1, "#e9df9a", "#e0a81c", 0.3);
    }
  };
  raceme(main, 14, 10); brs.forEach((b) => raceme(b, 10, 6));
  taproot(P, base, 0.22, 0.008, "#cdbf98", 8);
  return P.build("Xantal");
};

// 49 — Lavlagi
SPECIES.shoradoshlar = () => {
  seed(49); const P = new Plant();
  P.add("fruit", lathe([[0.001, -0.3], [0.008, -0.25], [0.025, -0.19], [0.07, -0.12], [0.105, -0.06], [0.118, -0.01], [0.11, 0.03], [0.08, 0.055], [0.04, 0.068], [0.001, 0.072]], 48,
    (v, phi) => { const c = mix("#4a0a22", "#6e1532", fbm(v.x * 20, v.y * 30, v.z * 20)); if (v.y > 0.03) c.lerp(C("#5a4a3a"), clamp((v.y - 0.03) * 20, 0, 0.6)); if (hash(Math.round(phi * 30), Math.round(v.y * 60), 3) > 0.94) c.multiplyScalar(0.7); return c; },
    (v, phi) => { const k = 1 + 0.03 * (fbm(phi * 2, v.y * 12, 1) - 0.5); v.x *= k; v.z *= k; }));
  taproot(P, V(0, -0.29, 0), 0.18, 0.004, "#7a3046", 4);
  for (let i = 0; i < 10; i++) {
    const a = i * 2.4 + rr(-0.2, 0.2), inner = i > 6, el = inner ? rr(1.1, 1.3) : rr(0.6, 1.0), d = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const pl = (inner ? 0.12 : rr(0.18, 0.26)), p0 = V(Math.cos(a) * 0.015, 0.065, Math.sin(a) * 0.015), p1 = p0.clone().add(d.clone().multiplyScalar(pl)).add(V(0, inner ? 0.02 : -0.02, 0));
    P.add("stem", tube([p0, p0.clone().lerp(p1, 0.5).add(V(0, 0.03, 0)), p1], 0.0055, 0.003, "#9c2340", "#b8344c", 6));
    const L = inner ? 0.14 : rr(0.22, 0.28), ld = d.clone().lerp(UP, inner ? 0.2 : -0.1).normalize();
    P.add("leaf", leaf({ L, W: L * 0.58, shape: SH.ovate, bend: inner ? 0.1 : 0.4, fold: 0.14, wave: 0.12, base: "#3d6e31", tip: "#548a3c", vein: "#a8324e", veins: 7, segL: 24, segW: 7 }), frame(p1, ld, UP, 1, rr(-0.2, 0.2)));
  }
  return P.build("Lavlagi");
};

// 50 — G'o'za
SPECIES.gulxayridoshlar = () => {
  seed(50); const P = new Plant(), main = [V(0, 0, 0), V(0.01, 0.2, 0), V(-0.01, 0.45, 0.01), V(0.01, 0.7, 0), V(0, 0.85, 0)];
  P.add("stem", tube(main, 0.012, 0.003, "#6a5a36", "#6f8a3a", 8));
  const c = new THREE.CatmullRomCurve3(main), brs = [];
  [[0.25, 0.3, 0.3], [0.4, 2.6, 0.28], [0.55, 4.6, 0.24], [0.7, 1.4, 0.18]].forEach(([t, a, l]) => {
    const p = c.getPointAt(t), d = V(Math.cos(a), 0, Math.sin(a)), pts = [p, p.clone().add(d.clone().multiplyScalar(l * 0.5)).add(V(0, l * 0.25, 0)), p.clone().add(d.clone().multiplyScalar(l)).add(V(0, l * 0.45, 0))];
    P.add("stem", tube(pts, 0.006, 0.0025, "#6c5c38", "#73903e", 6)); brs.push(pts);
  });
  const pleaf = (p, d, i, R) => { const dir = out(d, i * 2.4, rr(0.2, 0.6)), pe = p.clone().add(dir.clone().multiplyScalar(R * 0.9));
    P.add("stem", tube([p, p.clone().lerp(pe, 0.5).add(V(0, 0.01, 0)), pe], 0.0018, 0.0014, "#7a7a3a", "#6f8a3a", 4));
    P.add("leaf", palm({ R, lobes: 3, depth: 0.5, serr: 0, cup: 0.18, back: 0.55, base: "#355f28", tip: "#4d7a34", vein: "#9cbb76" }), frame(pe, dir.clone().lerp(UP, -0.2), UP, 1, rr(-0.3, 0.3))); };
  pointsOn(main, 5, 0.2, 0.95).forEach((q, i) => pleaf(q.p, q.d, i, rr(0.12, 0.14)));
  brs.forEach((b, k) => pointsOn(b, 2, 0.3, 0.8).forEach((q, i) => pleaf(q.p, q.d, i + k, 0.1)));
  const bracts = (F, s) => { for (let i = 0; i < 3; i++) P.add("leaf", leaf({ L: 0.04 * s, W: 0.035 * s, shape: SH.heart, serr: 0.25, serrN: 7, fold: 0.3, bend: -0.15, base: "#5a7d36", tip: "#7a9a48", vein: "#a8c07c", veins: 4 }), F.clone().multiply(frame(V(), V(Math.cos((i * TAU) / 3) * 0.5, 1, Math.sin((i * TAU) / 3) * 0.5), UP))); };
  const tipOf = (pts) => new THREE.CatmullRomCurve3(pts).getPointAt(1);
  // Gul
  { const p = tipOf(main), F = frame(p.clone().add(V(0, 0.01, 0)), V(0.2, 1, 0.3), V(0, 0, 1)); bracts(F, 1.1);
    flower(P, F, { n: 5, tilt: 0.55, petal: { L: 0.05, W: 0.045, shape: SH.obovate, fold: 0.2, bend: -0.08, twist: 0.3, base: "#9b2a3a", tip: "#f2e4a6", wave: 0.05 } });
    P.add("matte", tube([V(), V(0, 0.028, 0)], 0.003, 0.0022, "#efe0a0", "#f3e4a8", 6), F); stamens(P, F.clone().multiply(T(0, 0.012, 0)), 24, 0.006, 1, "#f2e6b0", "#f0d070", 1.2); }
  // Yashil ko'sak
  { const p = tipOf(brs[3]), F = frame(p, V(0.3, 1, 0), V(0, 0, 1)); bracts(F, 0.9);
    P.add("fruit", blob(0.022, 24, 18, (v, d) => { v.y *= 1.35; if (d.y > 0) v.y *= 1 + 0.25 * d.y * d.y; }, (d) => mix("#5d7d34", "#7d9c45", 0.5 + 0.5 * d.y + (noise(d.x * 9, d.y * 9, d.z * 9) - 0.5) * 0.3)), F.clone().multiply(T(0, 0.022, 0))); }
  // Ochilgan ko'saklar
  [brs[0], brs[1], brs[2]].forEach((b, k) => {
    const p = tipOf(b), F = frame(p, V(rr(-0.3, 0.3), 1, rr(-0.3, 0.3)), V(0, 0, 1));
    P.add("matte", blob(0.012, 12, 8, (v) => v.y *= 0.8, () => C("#5a3c24")), F);
    for (let i = 0; i < 4; i++) { const ph = (i / 4) * TAU + 0.4;
      P.add("matte", leaf({ L: 0.045, W: 0.03, shape: SH.elliptic, fold: -0.45, bend: -0.25, base: "#4d321e", tip: "#7a5634", vein: "#5a3c24", veins: 0 }), F.clone().multiply(frame(V(), V(Math.cos(ph) * 1.4, 1, Math.sin(ph) * 1.4), UP)));
      P.add("fluff", blob(0.02, 18, 14, (v, d) => { const n = fbm(d.x * 6 + i, d.y * 6, d.z * 6 + k); v.multiplyScalar(0.8 + 0.45 * n); v.y *= 1.15; }, (d) => mix("#e9e6dc", "#fbfaf6", noise(d.x * 12, d.y * 12, d.z * 12 + i))),
        F.clone().multiply(T(Math.cos(ph + PI / 4) * 0.014, 0.024, Math.sin(ph + PI / 4) * 0.014))); }
  });
  taproot(P, V(0, 0, 0), 0.2, 0.009, "#c9b890", 8);
  return P.build("G'o'za");
};

// 51 — No'xat
SPECIES.burchoqdoshlar = () => {
  seed(51); const P = new Plant(), main = [];
  for (let i = 0; i <= 8; i++) main.push(V((i % 2 ? 0.025 : -0.025) * (i > 0), i * 0.11, Math.sin(i) * 0.02));
  P.add("stem", tube(main, 0.0065, 0.003, "#86ac68", "#9ebd7a", 7));
  const c = new THREE.CatmullRomCurve3(main), G = "#86ad66", GL = "#6f9a55";
  for (let i = 1; i < 8; i++) {
    const t = i / 8, p = c.getPointAt(t), side = i % 2 ? 1 : -1, d = V(side, 0.35, rr(-0.3, 0.3)).normalize();
    for (let s = -1; s <= 1; s += 2) P.add("leaf", leaf({ L: 0.1, W: 0.085, shape: SH.heart, bend: 0.2, fold: 0.1, base: GL, tip: G, vein: "#b8d39c", veins: 5, serr: 0.03, serrN: 8 }), frame(p, V(-side * 0.3 + s * 0.6, 0.2, s * 0.7).normalize(), UP));
    const pe = p.clone().add(d.clone().multiplyScalar(0.12)), rach = [p, p.clone().lerp(pe, 0.5).add(V(0, 0.02, 0)), pe];
    P.add("stem", tube(rach, 0.0018, 0.0012, "#8db06d"));
    pointsOn(rach, 2, 0.35, 0.8).forEach((q) => { for (let s = -1; s <= 1; s += 2) { const ld = V().crossVectors(q.d, UP).normalize().multiplyScalar(s).add(q.d.clone().multiplyScalar(0.5)).normalize();
      P.add("leaf", leaf({ L: 0.095, W: 0.06, shape: SH.elliptic, bend: 0.15, fold: 0.15, base: GL, tip: G, vein: "#b8d39c", veins: 5 }), frame(q.p, ld.lerp(UP, 0.15), UP)); } });
    for (let k = 0; k < 3; k++) P.add("stem", helix(pe, d.clone().add(V(rr(-0.4, 0.4), rr(0, 0.5), rr(-0.4, 0.4))), 0.06, 0.008, 2.5, 0.0008, "#97b878"));
    // gullar va dukkaklar
    if (i >= 3) {
      const ped = p.clone().add(V(-side * 0.06, 0.04, 0.03)); P.add("stem", tube([p, p.clone().lerp(ped, 0.5).add(V(0, 0.02, 0)), ped], 0.0013, 0.001, "#8db06d"));
      if (i >= 6) {
        const F = frame(ped, V(-side, 0.3, 0.2), UP);
        P.add("petal", leaf({ L: 0.032, W: 0.038, shape: SH.round, fold: 0.15, bend: -0.25, base: "#e9e1ee", tip: "#fbf9fc", vein: "#c9b6d8", veins: 6 }), F.clone().multiply(frame(V(0, 0.006, 0), V(0, 1, -0.4), V(0, 0, 1))));
        for (let s = -1; s <= 1; s += 2) P.add("petal", leaf({ L: 0.022, W: 0.016, shape: SH.obovate, fold: 0.3, base: "#b08cc6", tip: "#d4bde2", vein: "#a07ab8", veins: 0 }), F.clone().multiply(frame(V(s * 0.003, 0.006, 0.002), V(s * 0.25, 1, 0.6), V(s, 0, 0))));
        P.add("petal", blob(0.006, 10, 8, (v) => { v.y *= 2; v.x *= 0.6; }, () => C("#efeedd")), F.clone().multiply(frame(V(0, 0.01, 0.005), V(0, 1, 0.8), UP)));
        P.add("leaf", blob(0.004, 8, 6, (v) => v.y *= 1.6, () => C("#6f9a55")), F);
      } else {
        const L = rr(0.07, 0.085), pod = V(-side * 0.3, -1, rr(-0.2, 0.2)).normalize(), F = frame(ped, pod, V(side, 0, 0));
        P.add("fruit", blob(0.01, 28, 20, (v, d) => { const t = (v.y / 0.01 + 1) / 2; v.y *= L / 0.02; v.x *= 1 + 0.12 * Math.abs(Math.sin(t * PI * 6)); v.z *= 0.75; v.x += 0.008 * Math.pow(t - 0.5, 2) * 4; },
          (d) => mix("#6e9b3e", "#9cc35e", 0.5 + 0.3 * d.x + (noise(d.x * 8, d.y * 8, d.z * 8) - 0.5) * 0.4)), F.clone().multiply(T(0, L * 0.5, 0)));
      }
    }
  }
  roots(P, V(0, 0, 0), 9, 0.14, 0.002, "#d9cba5");
  return P.build("No'xat");
};

// 52 — Pomidor
SPECIES.ituzumdoshlar = () => {
  seed(52); const P = new Plant(), main = [V(0, 0, 0), V(0.02, 0.2, 0), V(-0.02, 0.42, 0.02), V(0.01, 0.62, 0), V(0, 0.78, 0.01)];
  P.add("stem", tube(main, 0.011, 0.004, "#4f7a33", "#6a9442", 8));
  const cmp = (p, d, L) => { const pe = p.clone().add(d.clone().multiplyScalar(L)).add(V(0, -L * 0.15, 0)), rach = [p, p.clone().lerp(pe, 0.5).add(V(0, L * 0.12, 0)), pe];
    P.add("stem", tube(rach, 0.0025, 0.0012, "#5c8a3a"));
    P.add("leaf", leaf({ L: L * 0.5, W: L * 0.3, shape: SH.ovate, lobes: (t) => 0.75 + 0.25 * Math.abs(Math.sin(t * 9)), serr: 0.035, serrN: 14, bend: 0.3, fold: 0.15, wave: 0.12, base: "#3a662f", tip: "#45733a", vein: "#8eb06e" }), frame(pe, d.clone().lerp(UP, 0.1), UP));
    pointsOn(rach, 3, 0.15, 0.85).forEach((q, k) => { for (let s = -1; s <= 1; s += 2) { const ld = V().crossVectors(q.d, UP).normalize().multiplyScalar(s).add(q.d.clone().multiplyScalar(0.4)).normalize(), Ll = L * (0.46 - k * 0.04);
      P.add("leaf", leaf({ L: Ll, W: Ll * 0.55, shape: SH.ovate, lobes: (t) => 0.75 + 0.25 * Math.abs(Math.sin(t * 9 + s)), serr: 0.035, serrN: 14, bend: 0.35, fold: 0.15, wave: 0.12, base: "#3a662f", tip: "#45733a", vein: "#8eb06e" }), frame(q.p, ld.lerp(UP, -0.1), UP, 1, s * 0.2)); } }); };
  pointsOn(main, 7, 0.12, 0.98).forEach((q, i) => cmp(q.p, out(q.d, i * 2.4, rr(0.1, 0.4)), rr(0.17, 0.24) * (1 - q.t * 0.4)));
  const cc = new THREE.CatmullRomCurve3(main);
  const calyx = (F, s = 1) => { for (let i = 0; i < 5; i++) { const ph = (i / 5) * TAU; P.add("leaf", leaf({ L: 0.022 * s, W: 0.005 * s, shape: SH.lance, bend: -0.3, base: "#3e6b2c", tip: "#5a8a3a", vein: "#7ea25a", veins: 0, twist: 0.5 }), F.clone().multiply(frame(V(), V(Math.cos(ph) * 2.5, 1, Math.sin(ph) * 2.5), UP))); } };
  // Mevalar shingili
  { const p = cc.getPointAt(0.42), sp = [p, p.clone().add(V(0.06, 0.0, 0.05)), p.clone().add(V(0.12, -0.05, 0.08))]; P.add("stem", tube(sp, 0.0035, 0.0025, "#5c8a3a"));
    const fr = [[0.2, 0.05, "#c7241b", "#d94a24"], [0.5, 0.045, "#d0391e", "#e2742a"], [0.75, 0.042, "#b8281f", "#cf4a22"], [1, 0.035, "#6f9a3a", "#93b04e"]];
    fr.forEach(([t, r, c1, c2], k) => { const q = new THREE.CatmullRomCurve3(sp).getPointAt(t), at = q.clone().add(V(rr(-0.02, 0.02), -r - 0.015, rr(-0.02, 0.02)));
      P.add("stem", tube([q, at.clone().add(V(0, r * 0.95, 0))], 0.0018, 0.0016, "#5c8a3a"));
      P.add("fruit", blob(r, 40, 28, (v, d) => { v.y *= 0.82; const phi = Math.atan2(d.z, d.x); if (d.y > -0.3) { const k2 = 1 + 0.05 * Math.cos(phi * 5) * (d.y + 0.3); v.x *= k2; v.z *= k2; } if (d.y > 0.85) v.y *= 0.9; },
        (d) => { const c = mix(c1, c2, 0.5 + 0.4 * d.x + (fbm(d.x * 3, d.y * 3, d.z * 3) - 0.5)); if (d.y > 0.88) c.lerp(C("#7a8a3a"), 0.4); return c; }), T(at.x, at.y, at.z));
      calyx(frame(at.clone().add(V(0, r * 0.8, 0)), UP, V(0, 0, 1)), r / 0.045); });
  }
  // Gullar
  { const p = cc.getPointAt(0.82), d0 = V(-0.8, 0.3, 0.2).normalize(), pe = p.clone().add(d0.clone().multiplyScalar(0.07));
    P.add("stem", tube([p, p.clone().lerp(pe, 0.5).add(V(0, 0.02, 0)), pe], 0.0022, 0.0016, "#5c8a3a"));
    for (let k = 0; k < 4; k++) { const fp = pe.clone().add(V(rr(-0.03, 0.03), rr(-0.03, 0.0), rr(-0.03, 0.03))); P.add("stem", tube([pe, fp], 0.0012, 0.001, "#5c8a3a"));
      const F = frame(fp, V(rr(-0.5, 0.5), -1, rr(-0.5, 0.5)), V(0, 0, 1));
      if (k === 3) { calyx(F, 0.5); P.add("petal", blob(0.005, 10, 8, (v) => v.y *= 1.6, () => C("#e9cf3a")), F.clone().multiply(T(0, 0.006, 0))); continue; }
      calyx(F, 0.45);
      flower(P, F, { n: 6, tilt: 2.0, petal: { L: 0.016, W: 0.006, shape: SH.lance, bend: 0.35, fold: 0.1, base: "#eec21c", tip: "#f8dc4a", vein: "#e0b018", veins: 0 } });
      P.add("matte", new THREE.ConeGeometry(0.0035, 0.012, 10, 1, true).translate(0, 0.006, 0), F); paint(P.g.matte[P.g.matte.length - 1], () => C("#e6b01a")); }
  }
  roots(P, V(0, 0, 0), 12, 0.16, 0.003, "#cbbb94");
  return P.build("Pomidor");
};

// 53 — Tok
SPECIES.tokdoshlar = () => {
  seed(53); const P = new Plant();
  const trunk = [V(0, -0.1, 0), V(0.02, 0.1, 0.01), V(-0.03, 0.3, -0.01), V(0.0, 0.5, 0.0)];
  P.add("bark", tube(trunk, 0.035, 0.022, "#4a3828", "#5e4a36", 10));
  const cane = [V(0, 0.5, 0), V(0.1, 0.6, 0.02), V(0.25, 0.66, -0.02), V(0.42, 0.65, 0.03), V(0.55, 0.6, 0)];
  const cane2 = [V(0, 0.5, 0), V(-0.12, 0.58, 0.04), V(-0.28, 0.62, 0.0), V(-0.42, 0.58, -0.03)];
  P.add("bark", tube(cane, 0.016, 0.006, "#6a5038", "#7f6a45", 8)); P.add("bark", tube(cane2, 0.014, 0.006, "#6a5038", "#7f6a45", 8));
  const vleaf = (q, i) => { const d = out(q.d, i * 2.2 + rr(-0.3, 0.3), rr(0.3, 0.7)), pe = q.p.clone().add(d.clone().multiplyScalar(0.08));
    P.add("stem", tube([q.p, q.p.clone().lerp(pe, 0.5).add(V(0, 0.02, 0)), pe], 0.0025, 0.0018, "#7f8a42", "#6c8a3a", 5));
    P.add("leaf", palm({ R: rr(0.09, 0.12), lobes: 5, depth: 0.32, serr: 0.08, serrN: 46, cup: 0.1, back: 0.75, base: "#3a6a2c", tip: "#55863a", vein: "#a6c27a" }), frame(pe, d.clone().lerp(UP, 0.3).normalize(), UP, 1, rr(-0.4, 0.4))); };
  pointsOn(cane, 6, 0.1, 0.98).forEach(vleaf); pointsOn(cane2, 4, 0.15, 0.98).forEach((q, i) => vleaf(q, i + 6));
  [[cane, 0.7], [cane2, 0.6], [cane, 0.95]].forEach(([cv, t]) => { const q = new THREE.CatmullRomCurve3(cv).getPointAt(t); P.add("stem", helix(q, V(rr(-0.5, 0.5), 0.6, rr(-0.5, 0.5)), 0.09, 0.012, 3, 0.0012, "#8a9a4a")); });
  const bunch = (top, len, wid, n) => {
    const rach = [top, top.clone().add(V(0.005, -len * 0.5, 0)), top.clone().add(V(0, -len, 0.005))]; P.add("stem", tube(rach, 0.003, 0.0012, "#6b7a3a", "#7c8a42", 5));
    for (let k = 0; k < n; k++) {
      const t = Math.pow(rnd(), 0.8), y = -len * t * 0.95, rad = wid * Math.pow(1 - t, 0.7) * Math.sqrt(rnd()) + 0.004, ph = rnd() * TAU;
      const at = top.clone().add(V(Math.cos(ph) * rad, y, Math.sin(ph) * rad)), br = 0.013 + rr(-0.0012, 0.0012), sd = k;
      P.add("fruit", blob(br, 14, 10, (v) => { v.y *= 1.12; }, (d) => { const c = mix("#2a1534", "#4a2a58", 0.5 + 0.5 * d.y); c.lerp(C("#7d6b92"), 0.3 * fbm(d.x * 4 + sd, d.y * 4, d.z * 4)); return c; }), T(at.x, at.y, at.z));
    }
  };
  bunch(V(0.2, 0.64, 0.03), 0.22, 0.065, 110); bunch(V(-0.2, 0.59, 0.03), 0.18, 0.055, 80);
  P.add("stem", tube([V(0.2, 0.66, 0), V(0.2, 0.64, 0.03)], 0.003, 0.003, "#6b7a3a")); P.add("stem", tube([V(-0.2, 0.61, 0), V(-0.2, 0.59, 0.03)], 0.003, 0.003, "#6b7a3a"));
  return P.build("Tok");
};

// 54 — Oshqovoq
SPECIES.qovoqdoshlar = () => {
  seed(54); const P = new Plant(), R = 0.16;
  P.add("fruit", blob(R, 64, 40, (v, d) => {
    const phi = Math.atan2(d.z, d.x), val = Math.exp(-Math.pow(Math.sin(phi * 5), 2) / 0.04);
    v.multiplyScalar(1 - 0.06 * val * (1 - Math.abs(d.y))); v.y *= 0.72; if (Math.abs(d.y) > 0.75) v.y *= 1 - 0.35 * (Math.abs(d.y) - 0.75);
  }, (d) => { const phi = Math.atan2(d.z, d.x), val = Math.exp(-Math.pow(Math.sin(phi * 5), 2) / 0.05); const c = mix("#e08a2a", "#c8641a", val * 0.8 + (fbm(d.x * 4, d.y * 6, d.z * 4) - 0.5) * 0.6); if (d.y > 0.9) c.lerp(C("#8a6a2a"), 0.5); return c; }), T(0, R * 0.72, 0));
  P.add("stem", tube([V(0, R * 1.32, 0), V(0.01, R * 1.5, 0.0), V(0.035, R * 1.6, 0.01)], 0.014, 0.01, "#6a7a3a", "#8a8a4a", 8, (t) => 0.014 * (1 + 0.25 * Math.max(0, 1 - t * 5)) - 0.004 * t));
  const vine = [V(0.03, R * 1.58, 0.01), V(0.12, 0.08, 0.05), V(0.3, 0.02, 0.1), V(0.5, 0.03, 0.0), V(0.7, 0.02, -0.1), V(0.85, 0.04, -0.12)];
  P.add("stem", tube(vine, 0.009, 0.005, "#5f8a3a", "#6f9a42", 7));
  pointsOn(vine, 4, 0.25, 0.95).forEach((q, i) => { const s = i % 2 ? 1 : -1, top = q.p.clone().add(V(rr(-0.05, 0.05), rr(0.18, 0.26), s * 0.12));
    P.add("stem", tube([q.p, q.p.clone().lerp(top, 0.5).add(V(0, 0, s * 0.03)), top], 0.005, 0.0035, "#5f8a3a", "#6f9a42", 6));
    P.add("leaf", palm({ R: rr(0.13, 0.16), lobes: 5, depth: 0.18, serr: 0.03, serrN: 50, cup: 0.15, back: 0.8, base: "#335f27", tip: "#4f7f35", vein: "#a6c48a" }), frame(top, V(rr(-0.3, 0.3), 0.6, s * 0.8).normalize(), UP, 1, rr(-0.3, 0.3)));
    P.add("stem", helix(q.p, V(0.3, 0.4, -s * 0.5), 0.1, 0.012, 3, 0.0014, "#7a9a4a")); });
  { const q = new THREE.CatmullRomCurve3(vine).getPointAt(0.55), fp = q.clone().add(V(0, 0.12, -0.04)); P.add("stem", tube([q, fp], 0.004, 0.0035, "#6f9a42"));
    P.add("petal", lathe([[0.004, 0], [0.012, 0.01], [0.016, 0.035], [0.024, 0.06], [0.045, 0.085], [0.06, 0.092]], 60, (v) => mix("#d98a10", "#f6b52a", v.y / 0.09),
      (v, phi) => { const k = v.y / 0.092, lob = Math.pow(Math.abs(Math.cos(phi * 2.5)), 3); v.x *= 1 + 0.25 * lob * k * k; v.z *= 1 + 0.25 * lob * k * k; v.y += 0.012 * lob * k * k; }), frame(fp, V(0.1, 1, -0.5).normalize(), UP));
    for (let i = 0; i < 5; i++) P.add("leaf", leaf({ L: 0.018, W: 0.004, shape: SH.lance, base: "#5f8a3a", tip: "#6f9a42", veins: 0 }), frame(fp, V(Math.cos(i * 1.256), 0.3, Math.sin(i * 1.256)), UP)); }
  return P.build("Oshqovoq");
};

// 55 — Kungaboqar
SPECIES.qoqiotdoshlar = () => {
  seed(55); const P = new Plant(), stem = [V(0, 0, 0), V(0.005, 0.35, 0), V(-0.005, 0.7, 0.01), V(0.0, 1.0, 0.03), V(0.0, 1.12, 0.08), V(0, 1.16, 0.12)];
  P.add("stem", tube(stem, 0.016, 0.011, "#4f7a32", "#6a8f3e", 9));
  pointsOn(stem, 9, 0.08, 0.85).forEach((q, i) => { const d = out(q.d, i * 2.4, rr(0.15, 0.5)), L = 0.26 * (1 - Math.abs(q.t - 0.4) * 0.9) + 0.08, pe = q.p.clone().add(d.clone().multiplyScalar(0.06));
    P.add("stem", tube([q.p, pe], 0.003, 0.0025, "#5f8a3a"));
    P.add("leaf", leaf({ L, W: L * 0.82, shape: SH.heart, serr: 0.04, serrN: 24, bend: 0.45, fold: 0.1, wave: 0.07, base: "#355f28", tip: "#4d7c34", vein: "#9cbd78", veins: 6, segL: 22, segW: 7 }), frame(pe, d, UP, 1, rr(-0.2, 0.2))); });
  const hc = V(0, 1.16, 0.13), F = frame(hc, V(0, 0.45, 1).normalize(), UP), Rd = 0.085;
  P.add("matte", blob(Rd * 1.05, 32, 16, (v) => { v.y = v.y > 0 ? v.y * 0.15 : v.y * 0.45; }, (d) => d.y > 0.2 ? C("#3a2410") : mix("#6a8a3a", "#4f7a32", -d.y)), F);
  const N = 520, ga = PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) { const r = Rd * Math.sqrt(i / N), a = i * ga, rel = r / Rd;
    const c = rel > 0.86 ? mix("#c8901a", "#e4b02a", rnd()) : rel < 0.25 ? mix("#5a4a1a", "#6e5c24", rnd()) : mix("#3a2410", "#4f3216", rnd());
    P.add("matte", blob(0.0042 * (0.7 + rel * 0.5), 5, 4, (v) => v.y *= 1.4, () => c), F.clone().multiply(T(Math.cos(a) * r, Rd * 0.15 + 0.002 * (1 - rel), Math.sin(a) * r))); }
  for (let k = 0; k < 2; k++) for (let i = 0; i < 26; i++) { const ph = (i / 26) * TAU + k * 0.12, d = V(Math.cos(ph), 0.12 - k * 0.15 + rr(-0.06, 0.06), Math.sin(ph)), L = rr(0.075, 0.09);
    P.add("petal", leaf({ L, W: 0.026, shape: SH.elliptic, fold: 0.15, bend: 0.12, wave: 0.08, twist: rr(-0.3, 0.3), base: "#e9a50e", tip: "#f6c41c", vein: "#e09a0a", veins: 0, segL: 14, seed: i + k * 30 }), F.clone().multiply(frame(d.clone().multiplyScalar(Rd * 0.95), d, UP))); }
  for (let i = 0; i < 28; i++) { const ph = (i / 28) * TAU, d = V(Math.cos(ph), -0.4, Math.sin(ph));
    P.add("leaf", leaf({ L: 0.04, W: 0.018, shape: SH.ovate, bend: 0.25, base: "#4d7a32", tip: "#6a9440", vein: "#8aab64", veins: 0 }), F.clone().multiply(frame(d.clone().multiplyScalar(Rd * 0.8).add(V(0, -0.01, 0)), d, V(0, -1, 0)))); }
  taproot(P, V(0, 0, 0), 0.25, 0.012, "#cbb98e", 10);
  return P.build("Kungaboqar");
};

// 56 — Lola
SPECIES.loladoshlar = () => {
  seed(56); const P = new Plant();
  P.add("matte", lathe([[0.001, -0.14], [0.02, -0.135], [0.03, -0.12], [0.032, -0.1], [0.025, -0.075], [0.012, -0.055], [0.006, -0.04], [0.001, -0.035]], 32,
    (v, phi) => mix("#8a6440", "#b48a5e", fbm(phi * 4, v.y * 60, 2)), (v, phi) => { const k = 1 + 0.06 * Math.sin(phi * 3); v.x *= k; v.z *= k; }));
  roots(P, V(0, -0.138, 0), 14, 0.07, 0.0012, "#e2d6b4", 1.2);
  const stem = [V(0, -0.04, 0), V(0.004, 0.12, 0), V(-0.004, 0.28, 0.005), V(0, 0.38, 0)];
  P.add("stem", tube(stem, 0.0055, 0.0042, "#7a9a5a", "#88a464", 8));
  [[0.0, 0.3, 0.26, 0.085], [2.2, 0.45, 0.22, 0.07], [4.3, 0.6, 0.17, 0.05]].forEach(([a, el, L, W], i) => {
    const y = 0.0 + i * 0.05, d = V(Math.cos(a) * Math.cos(1.2 - el), Math.sin(1.2 - el), Math.sin(a) * Math.cos(1.2 - el));
    P.add("leaf", leaf({ L, W, shape: SH.lance, bend: 0.45 + i * 0.1, fold: 0.35, wave: 0.18, base: "#5f7f55", tip: "#7f9a6a", vein: "#9ab088", veins: 0, segL: 26 }), frame(V(0, y, 0), d, V(-Math.cos(a), 0.3, -Math.sin(a)))); });
  const F = frame(V(0, 0.38, 0), UP, V(0, 0, 1));
  const tep = (inner) => ({ L: inner ? 0.07 : 0.075, W: inner ? 0.05 : 0.046, shape: SH.obovate, fold: -0.55, bend: -0.12, curl: -0.08, wave: 0.03, segL: 18, segW: 6, base: "#1f1410", tip: "#c41f27", vein: "#b01a22", veins: 0 });
  // Rang: tubi qora-sariq, qolgani qizil
  const recolor = (g) => paint(g, (v) => { const t = v.y / 0.075; return t < 0.12 ? mix("#1e140f", "#2a1a12", t * 8) : t < 0.2 ? mix("#d8a82a", "#c8302a", (t - 0.12) * 12) : mix("#c51d25", "#d8352c", t); });
  for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) { const ph = (i / 3) * TAU + k * (PI / 3), a = k ? 0.28 : 0.4, d = V(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph));
    const g = recolor(leaf(tep(k))); P.add("petal", g, F.clone().multiply(frame(V(Math.cos(ph) * 0.004, 0, Math.sin(ph) * 0.004), d, V(-Math.cos(ph), 0.2, -Math.sin(ph))))); }
  for (let i = 0; i < 6; i++) { const ph = (i / 6) * TAU, b = V(Math.cos(ph) * 0.005, 0.004, Math.sin(ph) * 0.005), e = b.clone().add(V(Math.cos(ph) * 0.004, 0.022, Math.sin(ph) * 0.004));
    P.add("matte", tube([b, e], 0.0012, 0.0008, "#1e1712", "#2a201a", 4), F); P.add("matte", blob(0.0028, 8, 6, (v) => v.y *= 2.2, () => C("#3a2a1a")), F.clone().multiply(T(e.x, e.y + 0.005, e.z))); }
  P.add("matte", tube([V(0, 0, 0), V(0, 0.026, 0)], 0.004, 0.0035, "#b8c07a", "#d0c87a", 8), F);
  for (let i = 0; i < 3; i++) P.add("matte", blob(0.0035, 8, 6, (v) => { v.y *= 0.5; }, () => C("#e0d08a")), F.clone().multiply(T(Math.cos(i * 2.09) * 0.003, 0.027, Math.sin(i * 2.09) * 0.003)));
  return P.build("Lola");
};

// 57 — Piyoz
SPECIES.piyozdoshlar = () => {
  seed(57); const P = new Plant();
  P.add("matte", lathe([[0.001, -0.01], [0.03, -0.005], [0.07, 0.02], [0.088, 0.06], [0.08, 0.1], [0.05, 0.13], [0.022, 0.155], [0.014, 0.18], [0.012, 0.19]], 48,
    (v, phi) => { const s = Math.abs(Math.sin(phi * 22 + v.y * 6)), c = mix("#b5732e", "#d49a4e", fbm(phi * 3, v.y * 20, 4)); c.multiplyScalar(0.86 + 0.14 * s); if (v.y > 0.15) c.lerp(C("#c9a56a"), 0.5); return c; },
    (v, phi) => { const k = 1 + 0.02 * Math.sin(phi * 3 + v.y * 20); v.x *= k; v.z *= k; }));
  roots(P, V(0, -0.005, 0), 22, 0.09, 0.0012, "#e6dcc0", 1.3);
  for (let i = 0; i < 6; i++) { const a = i * 2.4, L = rr(0.36, 0.5), d = V(Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35).normalize(), b = V(0, 0.19, 0);
    const pts = [b, b.clone().add(d.clone().multiplyScalar(L * 0.4)), b.clone().add(d.clone().multiplyScalar(L * 0.7)).add(V(Math.cos(a) * L * 0.12, 0, Math.sin(a) * L * 0.12)), b.clone().add(d.clone().multiplyScalar(L * 0.85)).add(V(Math.cos(a) * L * 0.3, -L * 0.08, Math.sin(a) * L * 0.3))];
    P.add("leaf", tube(pts, 0.009, 0.0012, "#4f7f4a", "#6e9a5e", 8)); }
  const H = 0.95;
  P.add("stem", tube([V(0, 0.19, 0), V(0.005, 0.45, 0), V(-0.004, 0.75, 0.003), V(0, H, 0)], 0.01, 0.006, "#5f8f56", "#78a066", 9, (t) => 0.0065 + 0.007 * Math.exp(-Math.pow((t - 0.35) / 0.18, 2))));
  const ctr = V(0, H + 0.06, 0);
  P.add("matte", leaf({ L: 0.04, W: 0.025, shape: SH.lance, fold: 0.4, base: "#c8b48a", tip: "#e0d2b0", veins: 0 }), frame(V(0, H, 0), V(0.4, -0.6, 0.2), UP));
  for (let i = 0; i < 160; i++) { const y = 1 - (i / 159) * 1.7, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996, d = V(Math.cos(a) * r, y, Math.sin(a) * r);
    if (d.y < -0.6) continue; const tip = ctr.clone().add(d.clone().multiplyScalar(0.055)), from = V(0, H, 0);
    P.add("stem", tube([from, ctr.clone().add(d.clone().multiplyScalar(0.02)), tip], 0.0006, 0.0005, "#9ab07a", "#b8c79a", 3));
    const Fl = frame(tip, d, UP); flower(P, Fl, { n: 6, tilt: 0.9, petal: { L: 0.007, W: 0.003, shape: SH.lance, fold: 0.1, segL: 5, segW: 2, base: "#dfe6cf", tip: "#f2f4ea", veins: 0 } }); }
  return P.build("Piyoz");
};

// 58 — Bug'doy
SPECIES.bugdoydoshlar = () => {
  seed(58); const P = new Plant();
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * TAU + rr(-0.3, 0.3), lean = rr(0.04, 0.14), H = rr(0.82, 1.0), dx = Math.cos(a) * lean, dz = Math.sin(a) * lean;
    const culm = [V(Math.cos(a) * 0.008, 0, Math.sin(a) * 0.008), V(dx * 0.3, H * 0.35, dz * 0.3), V(dx * 0.7, H * 0.7, dz * 0.7), V(dx, H, dz)];
    P.add("stem", tube(culm, 0.0034, 0.0022, "#8f9a4a", "#cdb86a", 6));
    const cv = new THREE.CatmullRomCurve3(culm);
    [0.18, 0.4, 0.62].forEach((t, k) => { const p = cv.getPointAt(t), d = cv.getTangentAt(t);
      P.add("stem", blob(0.0045, 8, 6, (v) => v.y *= 0.6, () => C("#9a9a4a")), T(p.x, p.y, p.z));
      P.add("leaf", tube([p, cv.getPointAt(t + 0.08)], 0.0042, 0.0036, "#8a9c48", "#9aa650", 6));
      const ld = out(d, a + k * PI + rr(-0.4, 0.4), rr(0.4, 0.8));
      P.add("leaf", leaf({ L: rr(0.22, 0.3), W: 0.016, shape: SH.linear, bend: 0.9, fold: 0.25, wave: 0.02, twist: rr(-1, 1), segL: 26, segW: 2, base: k ? "#7f9442" : "#b0a052", tip: "#c2b060", vein: "#a8b060", veins: 0 }), frame(cv.getPointAt(t + 0.08), ld, UP)); });
    // Boshoq
    const top = cv.getPointAt(1), dir = cv.getTangentAt(1).lerp(V(dx, 0, dz).normalize(), 0.15).normalize(), EL = rr(0.08, 0.1), side = V().crossVectors(dir, UP).normalize();
    P.add("stem", tube([top, top.clone().add(dir.clone().multiplyScalar(EL))], 0.0018, 0.0012, "#c8b062"));
    for (let k = 0; k < 18; k++) { const t = (k + 0.5) / 18, sg = k % 2 ? 1 : -1, p = top.clone().add(dir.clone().multiplyScalar(EL * t)), w = 1 - Math.pow(Math.abs(t - 0.45) * 1.6, 2) * 0.4;
      const sd = dir.clone().add(side.clone().multiplyScalar(sg * 0.55)).normalize(), F = frame(p, sd, side.clone().cross(dir).normalize());
      for (let g = -1; g <= 1; g++) { P.add("matte", blob(0.0042 * w, 8, 6, (v) => { v.y *= 2.1; v.z *= 0.7; }, (d) => mix("#c49a3e", "#e2c674", 0.5 + 0.5 * d.y + rr(-0.1, 0.1))), F.clone().multiply(frame(V(g * 0.0035, 0.006, 0), V(g * 0.35, 1, 0), V(0, 0, 1))));
        const aw = F.clone().multiply(frame(V(g * 0.004, 0.013, 0), V(g * 0.2, 1, 0.1), V(0, 0, 1)));
        P.add("matte", tube([V(), V(g * 0.004, 0.04, 0.002), V(g * 0.009, 0.075, 0.004)], 0.0004, 0.0002, "#d6bc6a", "#e8d79a", 3), aw); } }
  }
  roots(P, V(0, 0, 0), 26, 0.13, 0.0012, "#dacfae", 1.1);
  return P.build("Bug'doy");
};

export { SPECIES };
