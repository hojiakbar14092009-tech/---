#!/usr/bin/env python3
"""Ikonka (SVG) va ilova ochilish animatsiyasini (splash) bitta geometriyadan yaratadi.
Natija: icons/icon.svg, android-app/assets/*.svg, va index.html ichidagi <!--SPLASH--> bloki.
PNG ga aylantirish: node tools/render-brand.js (Playwright kerak)."""
import os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BG1, BG2, BG3 = "#2E6B4A", "#1E4630", "#112A1C"      # zumrad fon
CREAM1, CREAM2 = "#FBF7E8", "#CFE2BF"                 # barg
GOLD1, GOLD2 = "#F3D98E", "#C69B3E"                   # tomirlar

LEAF = "M512 196 C668 292 752 466 706 622 C674 738 594 802 512 816 C430 802 350 738 318 622 C272 466 356 292 512 196 Z"
LEFT = "M512 196 C356 292 272 466 318 622 C350 738 430 802 512 816 C506 640 508 380 512 196 Z"
MID = "M512 826 C520 680 506 430 512 232"
VEINS_R = ["M514 690 C580 664 636 618 676 556", "M512 586 C568 560 612 520 644 468", "M510 486 C548 466 578 438 598 402", "M510 396 C530 384 548 366 558 340"]
VEINS_L = ["M514 690 C448 664 392 618 352 556", "M512 586 C456 560 412 520 380 468", "M510 486 C472 466 442 438 422 402", "M510 396 C490 384 472 366 462 340"]
STEM = "M512 826 C506 874 478 904 430 930"
TILT = 32


def defs(uid):
    return f'''<defs>
<radialGradient id="bg{uid}" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="{BG1}"/><stop offset=".55" stop-color="{BG2}"/><stop offset="1" stop-color="{BG3}"/></radialGradient>
<radialGradient id="glow{uid}" cx="50%" cy="46%" r="50%"><stop offset="0" stop-color="#9FD6A8" stop-opacity=".34"/><stop offset="1" stop-color="#9FD6A8" stop-opacity="0"/></radialGradient>
<linearGradient id="lf{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{CREAM1}"/><stop offset="1" stop-color="{CREAM2}"/></linearGradient>
<linearGradient id="gd{uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{GOLD2}"/><stop offset="1" stop-color="{GOLD1}"/></linearGradient>
<filter id="sh{uid}" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="22"/><feOffset dy="26"/><feComponentTransfer><feFuncA type="linear" slope=".5"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>'''


def leaf_group(uid, scale=1.0, shadow=True):
    veins = "".join(f'<path d="{d}"/>' for d in VEINS_R + VEINS_L)
    f = f' filter="url(#sh{uid})"' if shadow else ""
    return f'''<g transform="translate(512 512) scale({scale}) rotate({TILT}) translate(-512 -512)">
<g{f}><path d="{LEAF}" fill="url(#lf{uid})"/></g>
<path d="{LEFT}" fill="#1E4630" opacity=".10"/>
<path d="{LEAF}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>
<g fill="none" stroke="url(#gd{uid})" stroke-linecap="round"><path d="{MID}" stroke-width="15"/><path d="{STEM}" stroke-width="15"/><g stroke-width="8">{veins}</g></g>
</g>'''


def svg(kind):
    """kind: full (to'liq ikonka), fg (adaptive oldingi qatlam), bg (adaptive fon)"""
    u = kind
    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">' + defs(u)
    if kind == "bg":
        return head + f'<rect width="1024" height="1024" fill="url(#bg{u})"/><rect width="1024" height="1024" fill="url(#glow{u})"/></svg>'
    if kind == "fg":
        return head + leaf_group(u, 0.62) + "</svg>"
    return head + f'<rect width="1024" height="1024" fill="url(#bg{u})"/><rect width="1024" height="1024" fill="url(#glow{u})"/>' + leaf_group(u, 0.8) + "</svg>"


def splash_block():
    uid = "s"
    veins = "".join(f'<path pathLength="1" class="vein" style="--i:{i}" d="{d}"/>' for i, d in enumerate(VEINS_R + VEINS_L))
    return f'''<!--SPLASH-->
<div id="splash" aria-hidden="true">
<style>
#splash{{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:{BG2};color:#F5F1E6;transition:opacity .55s ease,visibility .55s;overflow:hidden}}
#splash.hide{{opacity:0;visibility:hidden}}
#splash::before{{content:"";position:absolute;inset:-20%;background:radial-gradient(circle at 50% 42%,rgba(159,214,168,.30),rgba(159,214,168,0) 55%);opacity:0;animation:sGlow 1.6s ease .15s forwards}}
#splash svg{{width:min(54vw,230px);height:auto;position:relative;overflow:visible}}
#splash .tile{{transform-origin:50% 50%;opacity:0;animation:sTile .7s cubic-bezier(.2,.8,.2,1) forwards}}
#splash .outline{{fill:none;stroke:#EAF3DD;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:sDraw 1.05s cubic-bezier(.5,0,.2,1) .35s forwards}}
#splash .fill{{opacity:0;animation:sFade .7s ease 1.15s forwards}}
#splash .leaf{{transform-origin:512px 700px;animation:sGrow 1.5s cubic-bezier(.2,.8,.2,1) .3s both}}
#splash .gold{{fill:none;stroke:url(#gd{uid});stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1}}
#splash .mid{{stroke-width:15;animation:sDraw .8s ease 1.2s forwards}}
#splash .vein{{stroke-width:8;stroke-dasharray:1;stroke-dashoffset:1;animation:sDraw .55s ease calc(1.55s + var(--i)*.07s) forwards}}
#splash .shine{{opacity:0;animation:sShine 1.1s ease 2.0s}}
#splash .word{{text-align:center;opacity:0;transform:translateY(10px);animation:sUp .7s cubic-bezier(.2,.8,.2,1) 1.9s forwards}}
#splash .word b{{display:block;font:600 clamp(1.5rem,7vw,2rem)/1.1 Fraunces,Georgia,serif;letter-spacing:.01em}}
#splash .word span{{display:block;margin-top:8px;font:500 .72rem/1 Inter,system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#A9D3AE}}
@keyframes sTile{{from{{opacity:0;transform:scale(.86)}}to{{opacity:1;transform:scale(1)}}}}
@keyframes sDraw{{to{{stroke-dashoffset:0}}}}
@keyframes sFade{{to{{opacity:1}}}}
@keyframes sGrow{{from{{transform:scale(.82) rotate(-6deg)}}to{{transform:scale(1) rotate(0)}}}}
@keyframes sGlow{{to{{opacity:1}}}}
@keyframes sUp{{to{{opacity:1;transform:none}}}}
@keyframes sShine{{0%{{opacity:0;transform:translateX(-120px)}}40%{{opacity:.55}}100%{{opacity:0;transform:translateX(160px)}}}}
@media (prefers-reduced-motion:reduce){{#splash *,#splash::before{{animation-duration:.01s!important;animation-delay:0s!important}}}}
</style>
<svg viewBox="0 0 1024 1024" role="img">
{defs(uid)}
<clipPath id="clipL"><path d="{LEAF}"/></clipPath>
<rect class="tile" x="32" y="32" width="960" height="960" rx="224" fill="url(#bg{uid})"/>
<g transform="translate(512 512) scale(.8) rotate({TILT}) translate(-512 -512)" class="leaf-wrap"><g class="leaf">
<g class="fill"><g filter="url(#sh{uid})"><path d="{LEAF}" fill="url(#lf{uid})"/></g><path d="{LEFT}" fill="#1E4630" opacity=".10"/></g>
<path pathLength="1" class="outline" d="{LEAF}"/>
<path pathLength="1" class="gold mid" d="{MID}"/><path pathLength="1" class="gold mid" d="{STEM}"/>
<g class="gold-veins">{veins.replace('class="vein"','class="gold vein"')}</g>
<g clip-path="url(#clipL)"><rect class="shine" x="380" y="150" width="60" height="720" fill="#fff" opacity=".0" transform="skewX(-18)"/></g>
</g></g>
</svg>
<div class="word"><b>Botanika Atlasi</b><span>6-sinf · o‘simlik oilalari</span></div>
<script>
(function(){{
  var s=document.getElementById("splash"), seen=false, force=/[?&]splash\\b/.test(location.search);
  try{{ seen=sessionStorage.getItem("splash")==="1"; }}catch(e){{}}
  var standalone=window.IS_APP||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone;
  if(!(force||(standalone&&!seen))){{ s.remove(); return; }}
  try{{ sessionStorage.setItem("splash","1"); }}catch(e){{}}
  function done(){{ s.classList.add("hide"); setTimeout(function(){{ s.remove(); }}, 700); }}
  s.style.pointerEvents="auto"; s.addEventListener("click", done);
  setTimeout(done, matchMedia("(prefers-reduced-motion: reduce)").matches ? 500 : 3300);
}})();
</script>
</div>
<!--/SPLASH-->'''


def main():
    os.makedirs(f"{R}/android-app/assets", exist_ok=True)
    open(f"{R}/icons/icon.svg", "w", encoding="utf8").write(svg("full"))
    for k in ("full", "fg", "bg"):
        open(f"{R}/android-app/assets/icon-{k}.svg", "w", encoding="utf8").write(svg(k))
    p = f"{R}/index.html"
    h = open(p, encoding="utf8").read()
    blk = splash_block()
    if "<!--SPLASH-->" in h:
        h = re.sub(r"<!--SPLASH-->.*?<!--/SPLASH-->", lambda m: blk, h, flags=re.S)
    else:
        h = h.replace("<body>", "<body>\n" + blk, 1)
    open(p, "w", encoding="utf8").write(h)
    print("brend fayllari yaratildi")


main()
