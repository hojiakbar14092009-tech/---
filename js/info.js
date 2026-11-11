/* Darslikdan ma'lumotlar: tugma bosilganda ochiladigan oyna (qo'shimcha kutubxonasiz) */
(function(){
  var B = window.BILIM || {}, F = window.FAMILIES || [];
  var ui = document.createElement("div");
  ui.className = "inf"; ui.hidden = true;
  ui.innerHTML = '<div class="inf-sheet" role="dialog" aria-modal="true" aria-labelledby="inf-title" tabindex="-1">' +
    '<div class="inf-top"><div><p class="inf-sub" id="inf-sub"></p><h2 id="inf-title"></h2></div>' +
    '<button type="button" class="inf-close" data-x aria-label="Yopish">Yopish</button></div>' +
    '<div class="inf-body" id="inf-body"></div>' +
    '<div class="inf-nav"><button type="button" data-d="-1">‹ Oldingisi</button><button type="button" data-d="1">Keyingisi ›</button></div></div>';
  document.body.appendChild(ui);
  var sheet = ui.firstChild, body = ui.querySelector("#inf-body"), cur = null, last = null;

  function esc(s){ return String(s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
  function show(id, i){
    var fam = F.filter(function(f){ return f.id === id; })[0], L = B[id]; if(!fam || !L || !L[i]) return;
    cur = {id:id, i:i, n:L.length};
    var it = L[i];
    ui.style.setProperty("--c", (window.ATLAS && window.ATLAS.accent[id]) || "#2F5D43");
    ui.querySelector("#inf-sub").textContent = fam.nom + " · darslik, " + it.bet + "-bet";
    ui.querySelector("#inf-title").textContent = it.nom;
    body.innerHTML = it.matn.map(function(p){ return "<p>" + esc(p) + "</p>"; }).join("");
    body.scrollTop = 0;
    var nav = ui.querySelectorAll(".inf-nav button");
    nav[0].disabled = i === 0; nav[1].disabled = i === L.length - 1;
    ui.querySelector(".inf-nav").style.display = L.length > 1 ? "" : "none";
  }
  function open(id, i){
    last = document.activeElement;
    show(id, i);
    if(ui.hidden){ ui.hidden = false; document.documentElement.classList.add("inf-open"); history.pushState({inf:1}, ""); }
    sheet.focus();
  }
  function close(fromHistory){
    if(ui.hidden) return;
    ui.hidden = true; document.documentElement.classList.remove("inf-open");
    if(!fromHistory && history.state && history.state.inf) history.back();
    if(last && last.focus) last.focus();
  }
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest("[data-info]");
    if(b){ var p = b.dataset.info.split(":"); return open(p[0], +p[1]); }
    if(ui.hidden) return;
    if(e.target === ui || e.target.closest("[data-x]")) return close();
    var n = e.target.closest("[data-d]");
    if(n && cur) show(cur.id, Math.max(0, Math.min(cur.n - 1, cur.i + (+n.dataset.d))));
  });
  document.addEventListener("keydown", function(e){
    if(ui.hidden) return;
    if(e.key === "Escape") close();
    else if(e.key === "ArrowRight" && cur) show(cur.id, Math.min(cur.n - 1, cur.i + 1));
    else if(e.key === "ArrowLeft" && cur) show(cur.id, Math.max(0, cur.i - 1));
  });
  window.addEventListener("popstate", function(){ close(true); });
  window.ATLASINFO = { open: open, close: close };
})();
