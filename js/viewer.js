import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const FILES = {ranodoshlar:"47_Ranodoshlar",karamdoshlar:"48_Karamdoshlar",shoradoshlar:"49_Shoradoshlar",gulxayridoshlar:"50_Gulxayridoshlar",
  burchoqdoshlar:"51_Burchoqdoshlar",ituzumdoshlar:"52_Ituzumdoshlar",tokdoshlar:"53_Tokdoshlar",qovoqdoshlar:"54_Qovoqdoshlar",
  qoqiotdoshlar:"55_Qoqiotdoshlar",loladoshlar:"56_Loladoshlar",piyozdoshlar:"57_Piyozdoshlar",bugdoydoshlar:"58_Bugdoydoshlar"};
const SPECIMEN = {ranodoshlar:"Olma",karamdoshlar:"Xantal",shoradoshlar:"Lavlagi",gulxayridoshlar:"G‘o‘za",burchoqdoshlar:"No‘xat",
  ituzumdoshlar:"Pomidor",tokdoshlar:"Tok",qovoqdoshlar:"Oshqovoq",qoqiotdoshlar:"Kungaboqar",loladoshlar:"Lola",piyozdoshlar:"Piyoz",bugdoydoshlar:"Bug‘doy"};

const $ = (s, r = document) => r.querySelector(s);
const ui = document.createElement("div");
ui.className = "v3d"; ui.hidden = true;
ui.innerHTML = `
  <div class="v3d-sheet" role="dialog" aria-modal="true" aria-labelledby="v3d-title">
    <div class="v3d-top">
      <div><p class="v3d-sub" id="v3d-sub"></p><h2 id="v3d-title"></h2></div>
      <button class="v3d-close" data-act="close" aria-label="Yopish">Yopish</button>
    </div>
    <div class="v3d-stage">
      <canvas aria-label="3D model: barmoq bilan aylantiring, ikki barmoq bilan yaqinlashtiring"></canvas>
      <div class="v3d-load" id="v3d-load"><span></span>Model yuklanmoqda…</div>
      <p class="v3d-hint" id="v3d-hint">Bir barmoq — aylantirish · ikki barmoq — yaqinlashtirish</p>
    </div>
    <div class="v3d-tools" role="toolbar" aria-label="Model boshqaruvi">
      <button data-act="left" aria-label="Chapga burish">⟲</button>
      <button data-act="right" aria-label="O‘ngga burish">⟳</button>
      <button data-act="in" aria-label="Yaqinlashtirish">＋</button>
      <button data-act="out" aria-label="Uzoqlashtirish">－</button>
      <button data-act="spin" aria-pressed="false" class="v3d-wide">Avto aylanish</button>
      <button data-act="reset" class="v3d-wide">Boshlang‘ich holat</button>
    </div>
    <p class="v3d-note" id="v3d-note"></p>
  </div>`;
document.body.appendChild(ui);
const canvas = $("canvas", ui);

let renderer, scene, camera, controls, current, home = null, raf = 0, lastFocus = null, loadId = 0;
const loader = new GLTFLoader(), cache = new Map();

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x6b7a55, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 5, 4); scene.add(sun);
  const rim = new THREE.DirectionalLight(0xdfe9ff, 0.8); rim.position.set(-4, 2, -3); scene.add(rim);
  // yumshoq soya diski
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(40,50,30,.35)"); grd.addColorStop(1, "rgba(40,50,30,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.name = "shadow"; scene.add(shadow);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.rotateSpeed = 0.7;
  controls.autoRotateSpeed = 1.2; controls.maxPolarAngle = Math.PI * 0.95;
  controls.addEventListener("start", () => { $("#v3d-hint").classList.add("off"); });
  new ResizeObserver(resize).observe(canvas.parentElement);
}

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  if (!r.width) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  if (current && home) fit(false);
}

function fit(store = true) {
  const box = new THREE.Box3().setFromObject(current), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const radius = size.length() / 2;
  const fov = THREE.MathUtils.degToRad(camera.fov), fovH = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
  const dist = radius / Math.sin(Math.min(fov, fovH) / 2) * 1.02;
  const dir = new THREE.Vector3(0.0, 0.18, 1).normalize();
  camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
  controls.minDistance = radius * 0.6; controls.maxDistance = dist * 2.2;
  const sh = scene.getObjectByName("shadow");
  sh.position.set(center.x, box.min.y + 0.001, center.z); sh.scale.setScalar(Math.max(size.x, size.z) * 1.6);
  if (store || !home) home = { pos: center.clone().add(dir.multiplyScalar(dist)), target: center.clone() };
  camera.position.copy(home.pos); controls.target.copy(home.target); controls.update();
}

function loop() { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }

async function load(id) {
  const my = ++loadId, f = FILES[id];
  $("#v3d-load").hidden = false; $("#v3d-note").textContent = "";
  if (current) { scene.remove(current); current = null; }
  try {
    let gltf = cache.get(id);
    if (!gltf) { gltf = await loader.loadAsync(`models/${f}.glb`); cache.set(id, gltf); }
    if (my !== loadId) return;
    current = gltf.scene; scene.add(current); home = null; fit(true);
  } catch (e) {
    $("#v3d-note").textContent = navigator.onLine === false ? "Bu model hali saqlanmagan. Internetga ulanib bir marta oching — keyin internetsiz ham ochiladi." : "Model yuklanmadi. Sahifani yangilab, qayta urinib ko‘ring.";
  } finally { if (my === loadId) $("#v3d-load").hidden = true; }
}

function open(id, fam) {
  if (!renderer) init();
  lastFocus = document.activeElement;
  $("#v3d-title").textContent = fam ? fam.nom : id;
  $("#v3d-sub").textContent = (fam ? fam.par + " · " : "") + (SPECIMEN[id] || "");
  ui.style.setProperty("--c", (window.ATLAS && window.ATLAS.accent[id]) || "#2F5D43");
  ui.hidden = false; document.documentElement.classList.add("v3d-open");
  $("#v3d-hint").classList.remove("off");
  const spin = $('[data-act="spin"]', ui); spin.setAttribute("aria-pressed", "false"); controls.autoRotate = false;
  resize(); cancelAnimationFrame(raf); loop(); load(id);
  history.pushState({ v3d: id }, "");
  $(".v3d-close", ui).focus();
}

function close(fromHistory) {
  if (ui.hidden) return;
  ui.hidden = true; document.documentElement.classList.remove("v3d-open");
  cancelAnimationFrame(raf); loadId++;
  if (current) { scene.remove(current); current = null; }
  if (!fromHistory && history.state && history.state.v3d) history.back();
  if (lastFocus) lastFocus.focus();
}

ui.addEventListener("click", (e) => {
  if (e.target === ui) return close();
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, off = camera.position.clone().sub(controls.target);
  if (a === "close") return close();
  if (a === "reset" && home) { camera.position.copy(home.pos); controls.target.copy(home.target); }
  if (a === "left" || a === "right") off.applyAxisAngle(new THREE.Vector3(0, 1, 0), a === "left" ? -Math.PI / 8 : Math.PI / 8), camera.position.copy(controls.target).add(off);
  if (a === "in" || a === "out") {
    const d = THREE.MathUtils.clamp(off.length() * (a === "in" ? 0.8 : 1.25), controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(off.setLength(d));
  }
  if (a === "spin") { controls.autoRotate = !controls.autoRotate; b.setAttribute("aria-pressed", controls.autoRotate); }
});
document.addEventListener("keydown", (e) => { if (!ui.hidden && e.key === "Escape") close(); });
window.addEventListener("popstate", () => close(true));
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-3d]"); if (!b) return;
  const fam = (window.FAMILIES || []).find((f) => f.id === b.dataset["3d"]);
  open(b.dataset["3d"], fam);
});

function snapshot(n = 384) {
  renderer.setPixelRatio(1); renderer.setSize(n, n, false); camera.aspect = 1; camera.updateProjectionMatrix(); fit(true);
  renderer.render(scene, camera); const url = canvas.toDataURL("image/png");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); resize(); return url;
}
window.ATLAS3D = { open, close, snapshot, ready: () => !!current && $("#v3d-load").hidden };
