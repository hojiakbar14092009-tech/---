(function(){
  var F = window.FAMILIES, C = window.COLUMNS;
  var ACCENT = {ranodoshlar:"#B04E66",karamdoshlar:"#6F8A2E",shoradoshlar:"#8A7447",gulxayridoshlar:"#B0638A",burchoqdoshlar:"#557F3E",
    ituzumdoshlar:"#B44A36",tokdoshlar:"#6A4A80",qovoqdoshlar:"#C27A22",qoqiotdoshlar:"#B38B12",loladoshlar:"#B03434",piyozdoshlar:"#8E5D86",bugdoydoshlar:"#A8842F"};
  var P = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var ICON = {
    osimliklar:'<path d="M12 21V10"/><path d="M12 10C12 6 9 4 5 4c0 4 3 6 7 6Z"/><path d="M12 13c0-3 3-5 7-5 0 3-3 5-7 5Z"/>',
    gbt:'<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10 6 12 3 12 3s2 3 0 6.8M14.2 12C18 10 21 12 21 12s-3 2-6.8 0M12 14.2C14 18 12 21 12 21s-2-3 0-6.8M9.8 12C6 14 3 12 3 12s3-2 6.8 0"/>',
    rang:'<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-1.4-1.4-1.6-1.4-3 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    joy:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    oxshash:'<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
    farq:'<path d="M7 4v16M17 4v16"/><path d="m4 9 3-3 3 3M14 15l3 3 3-3"/>',
    soni:'<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
    tabobat:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M9 9V6a3 3 0 0 1 6 0v3M12 12v5M9.5 14.5h5"/>',
    belgi:'<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.8Z"/>',
    sinf:'<path d="M12 20v-7"/><path d="M12 13c-4 0-6-3-6-6 4 0 6 2.5 6 6Zm0 0c4 0 6-3 6-6-4 0-6 2.5-6 6Z"/>'
  };
  function icon(k){ return '<svg class="ico" '+P+' aria-hidden="true">'+(ICON[k]||"")+'</svg>'; }
  var state = { q:"", f:"all", v:"list" };
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function norm(s){ return String(s).toLowerCase().replace(/[‘’ʻʼ`']/g,"'"); }
  function hl(s){
    s = esc(s); if(!state.q) return s;
    var q = state.q, out = "", low = norm(s), i = 0, j;
    while((j = low.indexOf(q, i)) > -1){ out += s.slice(i,j) + "<mark>" + s.slice(j, j+q.length) + "</mark>"; i = j + q.length; }
    return out + s.slice(i);
  }
  function num(f){ return f.par.replace("-§",""); }
  function sty(f){ return 'style="--c:'+ACCENT[f.id]+'"'; }
  function tag(f){ return '<span class="tag'+(f.sinf[0]==="B"?" mono":"")+'">'+f.sinf+'</span>'; }
  function key(f){ return '<span class="key"><svg '+P+' aria-hidden="true">'+ICON.belgi+'</svg>'+esc(f.belgi)+'</span>'; }
  function cell(f, k){
    if(k === "gbt") return '<p><span class="lbl">Guli:</span> '+hl(f.gul)+'</p><p><span class="lbl">Bargi:</span> '+hl(f.barg)+'</p><p><span class="lbl">To‘pguli:</span> '+hl(f.topgul)+'</p><p><span class="lbl">Mevasi:</span> '+hl(f.meva)+'</p>';
    var t = '<p>'+hl(f[k])+'</p>';
    if(k === "tabobat" && f.tabobatQoshimcha) t += '<p class="note">Qo‘shimcha ma’lumot (darslikda yo‘q)</p>';
    return t;
  }
  function match(f){
    if(state.f !== "all" && f.sinf !== state.f) return false;
    if(!state.q) return true;
    return norm([f.nom,f.osimliklar,f.gul,f.barg,f.topgul,f.meva,f.rang,f.joy,f.oxshash,f.farq,f.soni,f.tabobat,f.belgi].join(" ")).indexOf(state.q) > -1;
  }
  var EXTRA = window.FAMILY_EXTRA || function(){ return ""; };

  $("thead").innerHTML = "<tr><th><span>Oila nomi</span></th>" + C.map(function(c){ return "<th><span>"+icon(c.key)+c.label+"</span></th>"; }).join("") + "</tr>";

  function renderList(){
    var list = F.filter(match), none = '<div class="empty">Hech narsa topilmadi. Boshqa so‘z bilan qidirib ko‘ring.</div>';
    $("count").textContent = list.length === F.length ? "12 ta oila" : list.length + " ta oila topildi";
    if(!list.length){ $("tbody").innerHTML = '<tr><td colspan="9">'+none+'</td></tr>'; $("cards").innerHTML = none; return; }
    $("tbody").innerHTML = list.map(function(f){
      return '<tr '+sty(f)+'><th scope="row"><div class="famhead"><span class="seal">'+num(f)+'</span><div><span class="fam">'+hl(f.nom)+'</span>'+tag(f)+'</div></div>'+key(f)+EXTRA(f)+'</th>' +
        C.map(function(c){ return "<td>"+cell(f, c.key)+"</td>"; }).join("") + "</tr>";
    }).join("");
    var open = !!state.q;
    $("cards").innerHTML = list.map(function(f){
      return '<article class="card" '+sty(f)+'><header><span class="seal">'+num(f)+'</span><div><h2>'+hl(f.nom)+'</h2>'+tag(f)+'</div></header>'+key(f)+
        '<p class="plants"><b>Oilaga kiruvchi o‘simliklar</b>'+hl(f.osimliklar)+'</p>'+EXTRA(f)+
        C.slice(1).map(function(c){ return '<details'+(open?" open":"")+'><summary>'+icon(c.key)+c.label+'</summary><div>'+cell(f, c.key)+'</div></details>'; }).join("") +
        '</article>';
    }).join("");
  }

  var opts = F.map(function(f,i){ return '<option value="'+i+'">'+f.par+' '+f.nom+'</option>'; }).join("");
  $("a").innerHTML = opts; $("b").innerHTML = opts; $("a").value = "10"; $("b").value = "11";
  function renderCmp(){
    var A = F[$("a").value], B = F[$("b").value];
    var rows = [{key:"belgi",label:"Asosiy belgisi"},{key:"sinf",label:"Sinfi"}].concat(C);
    $("rows").innerHTML = rows.map(function(c){
      return '<div class="row"><h3>'+icon(c.key)+c.label+'</h3><div class="two"><div '+sty(A)+'><b>'+esc(A.nom)+'</b>'+cell(A,c.key)+'</div><div '+sty(B)+'><b>'+esc(B.nom)+'</b>'+cell(B,c.key)+'</div></div></div>';
    }).join("");
  }

  $("q").addEventListener("input", function(e){ state.q = norm(e.target.value.trim()); renderList(); });
  document.querySelectorAll("[data-f]").forEach(function(b){ b.addEventListener("click", function(){
    state.f = b.dataset.f; document.querySelectorAll("[data-f]").forEach(function(x){ x.setAttribute("aria-pressed", x===b); }); renderList();
  });});
  document.querySelectorAll("[data-v]").forEach(function(b){ b.addEventListener("click", function(){
    state.v = b.dataset.v; document.querySelectorAll("[data-v]").forEach(function(x){ x.setAttribute("aria-pressed", x===b); });
    var l = state.v === "list";
    $("list").style.display = l ? "" : "none"; $("cmp").style.display = l ? "none" : "block";
    document.querySelector(".search").style.display = l ? "" : "none"; $("segF").style.display = l ? "" : "none";
    if(!l) renderCmp();
  });});
  $("a").addEventListener("change", renderCmp); $("b").addEventListener("change", renderCmp);
  window.ATLAS = { accent: ACCENT, rerender: renderList };
  renderList();
})();
