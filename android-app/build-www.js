// Sayt fayllarini android-app/www ga nusxalaydi (ilova ichiga joylanadigan papka).
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, ".."), out = path.join(__dirname, "www");
const include = ["index.html", "css", "js", "data", "models", "thumbs", "icons", "fonts", "vendor", "manifest.webmanifest"];
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const f of include) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
// Ilova rejimi belgisi: service worker kerak emas, hamma fayl ilova ichida.
const p = path.join(out, "index.html");
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace("<!--APP-FLAG-->", "<script>window.IS_APP=true</script>"));
let n = 0, sz = 0; (function w(d){ for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); e.isDirectory() ? w(f) : (n++, sz += fs.statSync(f).size); } })(out);
console.log(`www tayyor: ${n} fayl, ${(sz / 1048576).toFixed(1)} MB`);
