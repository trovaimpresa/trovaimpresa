/* =====================================================================
   op-casa.js — App «Giornate di cantiere»: LA PRIMA PAGINA A RIQUADRI
   28 nov 2026 — Alex: «questa app e' un miscuglio di cose e sta tutto
   nella prima pagina». Foto approvata (anteprima-app-riquadri.png),
   impostata come la app del suo capo: riquadri grandi con icona.

   ⛔ NON si tocca il motore: le schede di prima (Lavori, Mezzi, Foto,
      Preventivi, Chat, Archivio), Le mie giornate e le viste Clienti,
      Scadenze e Fatture restano identiche. Qui si cambia solo COSA SI VEDE:
      · casa    = timbratura + «Segna la giornata» + riquadri
      · sezione = «‹ Indietro» + solo la cosa scelta
   ⛔ I riquadri seguono i permessi: un riquadro compare solo se il suo
      pulsante vero c'e' e non e' nascosto (applicaPermessi in op-base.js).
   ⛔ La freccia «indietro» del telefono (e lo scorrere da sinistra
      sull'iPhone) torna alla casa: si usa la cronologia (#sez-...).
   ===================================================================== */
(function () {
  "use strict";
  var IC = {
    giornate: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    lavori: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2"/>',
    mezzi: '<path d="M3 16V8a2 2 0 0 1 2-2h11l5 5v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
    spese: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    foto: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    altro: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    prev: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
    arch: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    clienti: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/>',
    scad: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/>',
    fatt: '<path d="M4 2h16v20l-3-2-3 2-2-2-2 2-3-2-3 2z"/><path d="M8 7h8M8 11h8M8 15h5"/>'
  };
  function svg(k, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 34) + '" height="' + (s || 34) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
  function $(s) { return document.querySelector(s); }
  function vede(el) { return !!el && !el.classList.contains("hidden") && el.style.display !== "none"; }
  function tab(s) { return document.querySelector('#op-tabs [data-s="' + s + '"]'); }
  function e(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var css = ""
    + "body.oh-on #app-nav{display:none!important}"
    + "body.oh-casa #op-tabs,body.oh-casa [id^='op-p-'],body.oh-casa #mie-giornate,body.oh-casa #opc-btn{display:none!important}"
    + "body.oh-sez #tmb-card,body.oh-sez #btn-rapido,body.oh-sez #oh-grid,body.oh-sez #opi-box,body.oh-sez #op-tabs,body.oh-sez #opc-btn{display:none!important}"
    + "body.oh-sez-giornate [id^='op-p-'],body.oh-sez-altro [id^='op-p-']{display:none!important}"
    + "body.oh-sez:not(.oh-sez-giornate) #mie-giornate{display:none!important}"
    + "body:not(.oh-sez) #oh-back,body:not(.oh-sez) #oh-tit{display:none}"
    + "#oh-tit{position:relative;display:flex;align-items:center;justify-content:center;min-height:56px;margin:6px 0 14px;padding:0 64px;text-align:center;font-size:28px;font-weight:800;color:#0a2a4d;line-height:1.2}"
    + "#oh-tit #oh-back,.oh-vback{position:absolute;left:0;top:50%;transform:translateY(-50%);width:52px!important;height:52px;margin:0!important;padding:0!important;justify-content:center;border-radius:14px!important}"
    + "#view-lavoro .ti-back-riga{position:relative;display:flex;align-items:center;justify-content:center;min-height:56px;margin:6px 0 14px}"
    + "#view-lavoro .ti-back-riga::after{content:'Lavoro';font-size:28px;font-weight:800;color:#0a2a4d}"
    + "body.oh-studio #view-lavoro .ti-back-riga::after{content:'Pratica'}"
    + "#view-lavoro #btn-back{position:absolute;left:0;top:50%;transform:translateY(-50%);width:52px!important;height:52px!important;min-width:0!important;padding:0!important;margin:0!important;display:flex;align-items:center;justify-content:center;background:#fff!important;border:1.5px solid #d5dbe3!important;border-radius:14px!important;color:#0a2a4d!important}"
    + "#view-lavoro #btn-back span{display:none}#view-lavoro #btn-back svg{width:26px;height:26px}"
    + "body.oh-sez-giornate #mie-giornate>.label{display:none}"
    + "#oh-mg-box{display:none;background:#fff;border-radius:20px;padding:16px;margin:14px 0 18px;box-shadow:0 1px 3px rgba(10,42,77,.08)}"
    + "body.oh-sez-giornate #oh-mg-box{display:block}"
    + ".oh-mg-az{display:none;flex-direction:column;gap:12px;margin:14px 0 0}"
    + "body.oh-sez-giornate .oh-mg-az{display:flex}"
    + ".oh-mg-az button{width:100%;padding:16px;border:2px solid #1d4f91;border-radius:16px;background:#fff;color:#1d4f91;font:inherit;font-size:19px;font-weight:800;cursor:pointer}"
    + ".oh-mg-az button.oh-mg-manda{background:#ff8800;border-color:#ff8800;color:#fff}"
    + ".oh-mg-seg{display:flex;background:#eceae5;border-radius:14px;padding:5px;margin-bottom:14px}"
    + ".oh-mg-seg button{flex:1;border:0;background:transparent;border-radius:11px;padding:12px 6px;font:inherit;font-size:18px;font-weight:800;color:#6b7280;cursor:pointer}"
    + ".oh-mg-seg button.on{background:#fff;color:#0a2a4d;box-shadow:0 1px 3px rgba(0,0,0,.12)}"
    + "#oh-mg-testo{width:100%;box-sizing:border-box;min-height:120px;border:2px solid #dcdad5;border-radius:16px;padding:14px;font:inherit;font-size:19px;resize:vertical;background:#f7f6f3}"
    + "#oh-mg-vai{width:100%;margin-top:12px;padding:16px;border:0;border-radius:16px;background:#ff8800;color:#fff;font:inherit;font-size:19px;font-weight:800;cursor:pointer}"
    + ".oh-mg-nota{font-size:15px;color:#64707c;margin-top:8px}"
    + "#oh-mg-ai{width:100%;margin-top:12px;padding:16px;border:0;border-radius:16px;background:#ff8800;color:#fff;font:inherit;font-size:19px;font-weight:800;cursor:pointer}"
    + "#oh-mg-mano{display:block;margin:14px auto 0;background:none;border:0;color:#64707c;font:inherit;font-size:17px;text-decoration:underline;cursor:pointer}"
    + "body.oh-sez #op-p-foto>.op-h:first-child,body.oh-sez #op-p-chat>.op-h:first-child,body.oh-sez #op-p-lavori>.op-h,body.oh-sez #op-p-archivio>.op-h:first-child,body.oh-sez #op-p-mezzi>.op-h:first-child{display:none}"
    + ".oh-sp-att{display:inline-block;margin-top:4px;padding:3px 8px;border-radius:8px;background:#fff1e0;color:#a85a00;font-size:13px;font-weight:700}"
    + "#oh-bz-lav{background:#fff7ed;border:2px solid #ff8800;border-radius:20px;padding:16px;margin:0 0 18px}#oh-bz-lav h3{margin:2px 0 10px;font-size:21px;color:#0a2a4d}"
    + "#oh-bz-card{background:#fff7ed;border:2px solid #ff8800;border-radius:20px;padding:16px;margin:0 0 18px}"
    + "#oh-bz-card h3{margin:2px 0 10px;font-size:21px;color:#0a2a4d}"
    + ".oh-bz-r{padding:12px 0;border-top:1px solid #fde1c2}.oh-bz-r b{display:block;font-size:17px;color:#0a2a4d}.oh-bz-r small{display:block;font-size:14px;color:#64707c;margin:2px 0 8px}"
    + ".oh-bz-az{display:flex;gap:8px}.oh-bz-az button{flex:1;padding:12px;border-radius:12px;font:inherit;font-size:16px;font-weight:800;cursor:pointer}"
    + ".oh-bz-apri{border:0;background:#ff8800;color:#fff}.oh-bz-via{border:1.5px solid #d5dbe3;background:#fff;color:#b3261e}"
    + "#oh-sp-card{background:#fff;border-radius:20px;padding:16px;margin:0 0 18px;box-shadow:0 1px 3px rgba(10,42,77,.08)}"
    + "#oh-sp-card h3{margin:2px 0 12px;font-size:21px;color:#0a2a4d}"
    + ".oh-sp-add{display:block;width:100%;text-align:left;margin-bottom:10px;padding:16px;border:0;border-radius:14px;background:#eceae5;color:#0a2a4d;font:inherit;font-size:19px;font-weight:800;cursor:pointer}"
    + ".oh-sp-tot{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 12px}"
    + ".oh-sp-tot div{background:#f4f3f0;border-radius:14px;padding:12px}.oh-sp-tot span{display:block;font-size:15px;color:#64707c}.oh-sp-tot b{font-size:22px;color:#0a2a4d}"
    + ".oh-sp-r{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #eceae5}.oh-sp-r b{font-size:17px;color:#0a2a4d}.oh-sp-r small{display:block;font-size:14px;color:#64707c;margin-top:2px}.oh-sp-r .imp{font-weight:800;white-space:nowrap}"
    + ".oh-sp-carta{display:inline-block;margin-top:4px;padding:3px 8px;border-radius:8px;background:#e8f5ec;color:#1e7a3c;font-size:13px;font-weight:700}"
    + "body.oh-sez-giornate.oh-mg-corr #oh-mg-nuova{display:none}"
    + ".oh-vrow{position:relative;display:flex;align-items:center;justify-content:center;min-height:56px;margin:6px 0 14px;padding:0 64px;text-align:center}"
    + "#oh-back{display:flex;align-items:center;gap:10px;width:100%;background:#fff;border:1.5px solid #d5dbe3;border-radius:14px;padding:14px 16px;font:inherit;font-size:19px;font-weight:800;color:#0a2a4d;margin:4px 0 16px;cursor:pointer}"
    + "#oh-back b{flex:1;text-align:left}"
    + "body.oh-casa #btn-rapido{background:#ff8800!important;border-color:#ff8800!important;color:#fff!important;border-radius:18px!important;padding:18px 16px!important;text-align:left;display:flex!important;align-items:center;gap:14px}"
    + "#btn-rapido .oh-sub{display:block;font-size:15px;font-weight:600;opacity:.92;margin-top:3px}"
    + "#oh-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0 18px}"
    + ".oh-t{background:#fff;border:1px solid #e3e8ef!important;border-radius:18px;padding:16px 10px 18px;text-align:center;font:inherit;color:#0b1220;cursor:pointer;box-shadow:0 2px 8px rgba(10,42,77,.07)}"
    + ".oh-t:active{transform:scale(.98)}"
    + ".oh-ic{width:62px;height:62px;border-radius:16px;background:#e8effa;color:#1a3f7d;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}"
    + ".oh-t b{display:block;font-size:18px;line-height:1.2}.oh-t small{display:block;color:#64707c;font-size:14px;margin-top:4px}"
    + ".oh-n{display:inline-block;background:#e11d48;color:#fff;border-radius:10px;font-size:13px;padding:1px 7px;margin-left:4px;vertical-align:2px}"
    + "#oh-altro .oh-r{display:flex;align-items:center;gap:14px;width:100%;background:#fff;border:1px solid #e3e8ef;border-radius:14px;padding:14px;margin-bottom:10px;font:inherit;font-size:18px;font-weight:700;color:#0b1220;cursor:pointer;text-align:left}"
    + "#oh-altro .oh-r .oh-ic{width:48px;height:48px;margin:0;border-radius:12px}";

  var SEZ = null;   /* null = casa */

  function voci() {
    var V = [];
    var mg = document.getElementById("mie-giornate");
    if (mg) {
      var tot = mg.querySelector(".mg-tot b");
      V.push({ k: "giornate", ic: "giornate", t: "Le mie giornate", s: tot ? tot.textContent.trim() + " questo mese" : "Il mese" });
    }
    if (vede(tab("lavori"))) {
      var sub = $("#op-sub"), st = sub ? sub.textContent.trim() : "";
      V.push({ k: "lavori", ic: "lavori", t: "Lavori", s: st || "Da fare e fatti" });
    }
    if (vede(tab("mezzi"))) V.push({ k: "mezzi", ic: "mezzi", t: "Mezzi", s: "Prendi e riporta" });
    if (vede($("#btn-rapido"))) V.push({ k: "spese", ic: "spese", t: "Spese e bolle", s: "Scontrini e bolle del materiale" });
    if (vede(tab("chat"))) {
      var n = $("#op-n-chat"), nn = n ? (n.textContent.match(/\d+/) || [""])[0] : "";
      V.push({ k: "chat", ic: "chat", t: "Chat col capo", n: nn, s: "Messaggi e foto" });
    }
    if (vede(tab("foto"))) V.push({ k: "foto", ic: "foto", t: "Foto", s: "Dei cantieri" });
    if (altroVoci().length) V.push({ k: "altro", ic: "altro", t: "Altro", s: altroVoci().map(function (a) { return a.c || a.t; }).slice(0, 2).join(", ") + "…" });
    return V;
  }
  function altroVoci() {
    var A = [];
    if (vede(tab("preventivi"))) A.push({ k: "preventivi", ic: "prev", t: "Preventivi" });
    if (vede(tab("archivio"))) A.push({ k: "archivio", ic: "arch", t: "Lavori vecchi e calendario", c: "Archivio" });
    if (vede($("#nav-clienti"))) A.push({ k: "v-clienti", ic: "clienti", t: "Clienti" });
    if (vede($("#nav-scadenze"))) A.push({ k: "v-scadenze", ic: "scad", t: "Scadenze" });
    if (vede($("#nav-fatture"))) A.push({ k: "v-fatture", ic: "fatt", t: "Fatture" });
    return A;
  }

  function disegna() {
    var va = $("#view-agenda"); if (!va) return;
    var g = $("#oh-grid");
    if (!g) {
      g = document.createElement("div"); g.id = "oh-grid";
      var dopo = $("#btn-rapido");
      if (dopo && dopo.parentNode === va) va.insertBefore(g, dopo.nextSibling); else va.insertBefore(g, va.firstChild);
      g.addEventListener("click", function (ev) { var b = ev.target.closest("[data-oh]"); if (b) apri(b.getAttribute("data-oh")); });
    }
    if (!$("#oh-back")) {
      var b = document.createElement("button"); b.type = "button"; b.id = "oh-back";
      /* 28 nov 2026 — il nome della sezione al centro, a sinistra una
         freccia in un riquadro bianco piccolo (deciso da Alex) */
      var tt = document.createElement("div"); tt.id = "oh-tit"; tt.innerHTML = '<span id="oh-tit-t"></span>';
      va.insertBefore(tt, va.firstChild); tt.appendChild(b);
      b.setAttribute("aria-label", "Indietro");
      b.onclick = function () { if (location.hash.indexOf("#sez-") === 0) history.back(); else casa(); };
    }
    var r = $("#btn-rapido");
    if (r && !r.querySelector(".oh-sub")) {
      var testo = Array.prototype.slice.call(r.childNodes).filter(function (x) { return x.nodeType === 3 && x.textContent.trim(); });
      var w = document.createElement("span"); w.innerHTML = "<b style='font-size:21px'>" + e(testo.map(function (x) { return x.textContent.trim(); }).join(" ") || "Segna la giornata") + "</b><span class='oh-sub'>Scrivi o detta: dove, chi, cosa</span>";
      testo.forEach(function (x) { x.remove(); }); r.appendChild(w);
    }
    var V = voci();
    g.innerHTML = V.map(function (v) {
      return '<button type="button" class="oh-t" data-oh="' + v.k + '"><div class="oh-ic">' + svg(v.ic) + '</div><b>' + e(v.t) + (v.n ? '<span class="oh-n">' + e(v.n) + '</span>' : '') + '</b><small>' + e(v.s || "") + '</small></button>';
    }).join("");
  }

  function modo(sez) {
    SEZ = sez;
    var B = document.body;
    B.classList.add("oh-on");
    B.classList.toggle("oh-casa", !sez);
    B.classList.toggle("oh-sez", !!sez);
    B.classList.toggle("oh-sez-giornate", sez === "giornate");
    B.classList.toggle("oh-sez-altro", sez === "altro");
    var alt = $("#oh-altro"); if (alt) alt.style.display = sez === "altro" ? "" : "none";
    var b = $("#oh-back");
    if (b && sez) {
      var nomi = { giornate: "Le mie giornate", lavori: "Lavori", mezzi: "Mezzi", chat: "Chat col capo", foto: "Foto", altro: "Altro", preventivi: "Preventivi", archivio: "Lavori vecchi" };
      b.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
      var tt = $("#oh-tit-t"); if (tt) tt.textContent = nomi[sez] || "";
    }
    if (!sez) disegna();
    if (sez === "giornate") { mgBox(); speseMese(); }
    if (sez === "giornate" || sez === "lavori") bozzeDisegna();
    window.scrollTo(0, 0);
  }
  function casa() { modo(null); }

  function apri(k, daStoria) {
    if (k === "spese") {
      if (typeof rvApri === "function") {
        rvApri();
        setTimeout(function () { var c = document.querySelector('#rv-corpo [data-tipo="completa"]') || document.querySelector('#rv-corpo [data-tipo="spesa"]'); if (c) c.click(); }, 60);
      }
      return;
    }
    if (k.indexOf("v-") === 0) {   /* Clienti, Scadenze, Fatture: le viste di prima */
      var nb = $("#nav-" + k.slice(2)); if (nb) nb.click();
      if (!daStoria) history.pushState({ oh: k }, "", "#sez-" + k);
      return;
    }
    if (k === "altro") {
      var va = $("#view-agenda"), al = $("#oh-altro");
      if (!al) { al = document.createElement("div"); al.id = "oh-altro"; va.insertBefore(al, $("#oh-grid").nextSibling); al.addEventListener("click", function (ev) { var b = ev.target.closest("[data-oh]"); if (b) apri(b.getAttribute("data-oh")); }); }
      al.innerHTML = altroVoci().map(function (a) { return '<button type="button" class="oh-r" data-oh="' + a.k + '"><span class="oh-ic">' + svg(a.ic, 26) + '</span>' + e(a.t) + '</button>'; }).join("");
    } else if (k !== "giornate" && typeof opVaiScheda === "function") {
      opVaiScheda(k);
    }
    if (!daStoria) history.pushState({ oh: k }, "", "#sez-" + k);
    modo(k);
  }

  /* la freccia indietro del telefono */
  window.addEventListener("popstate", function () {
    var h = location.hash.replace("#sez-", "");
    var va = $("#view-agenda");
    if (va && va.classList.contains("hidden") && h.indexOf("v-") !== 0 && typeof show === "function") { try { renderCal(); renderDay(); } catch (_) {} show("agenda"); }
    if (!h || location.hash.indexOf("#sez-") !== 0) { casa(); return; }
    if (h.indexOf("v-") !== 0) apri(h, true);
  });

  /* da Clienti / Scadenze / Fatture si torna alla casa col pulsante «‹ Indietro» delle viste */
  function frecceViste() {
    ["clienti", "scadenze", "fatture"].forEach(function (v) {
      var w = document.getElementById("view-" + v); if (!w || w.querySelector(".oh-vback")) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "oh-vback"; b.id = "oh-vback-" + v;
      b.style.cssText = "display:flex;align-items:center;gap:10px;width:100%;background:#fff;border:1.5px solid #d5dbe3;border-radius:14px;padding:14px 16px;font:inherit;font-size:19px;font-weight:800;color:#0a2a4d;margin:4px 0 16px;cursor:pointer";
      b.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
      b.onclick = function () { if (location.hash.indexOf("#sez-") === 0) history.back(); else { var na = $("#nav-agenda"); if (na) na.click(); casa(); } };
      var ti = w.querySelector(".day-title");
      b.setAttribute("aria-label", "Indietro");
      if (ti) { ti.classList.add("oh-vrow"); ti.style.cssText = "font-size:28px;font-weight:800;color:#0a2a4d"; ti.appendChild(b); } else w.insertBefore(b, w.firstChild);
    });
  }


  /* 28 nov 2026 — «Scrivi» accanto a «Parla»: chi non vuole dettare apre
     subito «Racconta la giornata» e scrive */
  function scrivi() {
    if (document.getElementById("gv-scrivi")) return;
    var st = document.createElement("style");
    st.textContent = "#gv-scrivi{position:fixed;bottom:22px;z-index:800;display:flex;align-items:center;gap:10px;background:#fff;color:#0a2a4d;border:2px solid #0a2a4d;border-radius:999px;padding:14px 22px;font:inherit;font-size:19px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer}#gv-scrivi svg{width:24px;height:24px;flex:none}@media(max-width:600px){#gv-scrivi{padding:14px 18px}}";
    document.head.appendChild(st);
    var b = document.createElement("button"); b.type = "button"; b.id = "gv-scrivi";
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Scrivi';
    b.onclick = function () {
      if (typeof rvApri !== "function") return;
      rvApri();
      setTimeout(function () { var v = document.querySelector('#rv-corpo [data-tipo="voce"]'); if (v) v.click(); }, 60);
    };
    document.body.appendChild(b);
    function posto() {
      var p = document.getElementById("gv-btn"), ov = document.getElementById("rv-ov");
      var vis = p && getComputedStyle(p).display !== "none" && p.offsetWidth > 0 && !(ov && !ov.classList.contains("hidden"));
      b.style.display = vis ? "" : "none";
      if (vis) { var r = p.getBoundingClientRect(); b.style.right = (window.innerWidth - r.left + 10) + "px"; b.style.bottom = (window.innerHeight - r.bottom) + "px"; }
    }
    posto(); setInterval(posto, 700); window.addEventListener("resize", posto);
  }

  function mgBox() {
      /* 28 nov 2026 — in «Le mie giornate» si segna la giornata da li' */
      var mg = document.getElementById("mie-giornate");
      /* come la pagina «Giornate di cantiere» del capo: Nuova giornata / Correggi */
      if (mg && !document.getElementById("oh-mg-box")) {
        var bx = document.createElement("div"); bx.id = "oh-mg-box";
        bx.innerHTML = '<div class="oh-mg-seg"><button type="button" class="on" data-mgv="nuova">Nuova giornata</button><button type="button" data-mgv="corr">Correggi</button></div>'
          + '<div id="oh-mg-nuova"><textarea id="oh-mg-testo" placeholder="🎤 «Oggi a Campoloniano, rifatto il tetto»"></textarea>'
          + '<button type="button" id="oh-mg-ai">Compila la giornata</button>'
          + '<button type="button" id="oh-mg-mano">Oppure scrivila a mano</button></div>'
          + '<div id="oh-mg-corrnota" class="oh-mg-nota" style="display:none">Qui sotto le tue giornate del mese. Quelle che aspettano il capo le correggi col pulsante «Correggi». Quelle già approvate le corregge il capo: scrivigli in Chat.</div>';
        mg.parentNode.insertBefore(bx, mg.nextSibling);
        var sp = document.createElement("div"); sp.id = "oh-sp-card";
        sp.innerHTML = '<h3>Spese, benzina, bolle e fatture</h3>'
          + '<button type="button" class="oh-sp-add" data-spa="spesa">+ Spesa</button>'
          + '<button type="button" class="oh-sp-add" data-spa="benzina">+ Benzina e km</button>'
          + '<button type="button" class="oh-sp-add" data-spa="bolla">+ Foto bolla o fattura</button>'
          + '<div id="oh-sp-elenco"></div>';
        sp.addEventListener("click", function (ev) {
          var a = ev.target.closest("[data-spa]"); if (!a) return;
          var k = a.getAttribute("data-spa");
          if (k === "benzina" && document.querySelector('#oh-grid [data-oh="mezzi"]')) { apri("mezzi"); return; }
          if (k === "spesa" && typeof puo === "function" && puo("pagamenti") && typeof rvApri === "function") {
            rvApri(); setTimeout(function () { var v = document.querySelector('#rv-corpo [data-tipo="spesa"]'); if (v) v.click(); else window.opGiornataCompleta(""); }, 60); return;
          }
          if (typeof window.opGiornataCompleta === "function") window.opGiornataCompleta(k === "benzina" ? "Benzina: " : "");
        });
        var bzc = document.createElement("div"); bzc.id = "oh-bz-card"; bzc.style.display = "none";
        bzc.addEventListener("click", async function (ev) {
          var a = ev.target.closest("[data-bz]"); if (!a || !window.opBozze) return;
          var id = a.getAttribute("data-bz");
          if (a.classList.contains("oh-bz-apri")) { window.opBozze.apri(id); return; }
          var si = typeof window.tiChiedi === "function" ? await window.tiChiedi("Buttare via questa giornata salvata? Foto e spese dentro si perdono.", { si: "Butta via", no: "Tienila", rosso: true }) : confirm("Buttare via questa giornata salvata?");
          if (si) window.opBozze.via(id);
        });
        window._ohMg = { bx: bx, sp: sp, bz: bzc };
        /* «Le mie giornate» si ridisegna da sola: dopo ogni giro riquadro e spese
           tornano subito sotto il totale, e le righe dei giorni restano in fondo */
        var metti = function () {
          var tot = mg.querySelector(".mg-tot"); if (!tot) return;
          var az = window._ohMg && window._ohMg.az;
          var primo = az || bx;
          if (primo.previousElementSibling !== tot || primo.parentNode !== mg) mg.insertBefore(primo, tot.nextSibling);
          if (az && bx.previousElementSibling !== az) mg.insertBefore(bx, az.nextSibling);
          var bz = window._ohMg && window._ohMg.bz;
          if (bz && bz.previousElementSibling !== bx) mg.insertBefore(bz, bx.nextSibling);
          var prima = bz || bx;
          if (sp.previousElementSibling !== prima) mg.insertBefore(sp, prima.nextSibling);
        };
        new MutationObserver(metti).observe(mg, { childList: true });
        metti(); speseMese(); bozzeDisegna();
        var az = document.createElement("div"); az.className = "oh-mg-az";
        az.innerHTML = '<button type="button" data-mgaz="riep">📋 Riepilogo del mese</button><button type="button" data-mgaz="pdf">📄 Scarica PDF del mese</button><button type="button" data-mgaz="manda" class="oh-mg-manda">📤 Manda il mese al capo</button>';
        window._ohMg.az = az; mg.insertBefore(az, bx);
        az.addEventListener("click", function (ev) {
          var a = ev.target.closest("[data-mgaz]"); if (!a) return;
          if (a.getAttribute("data-mgaz") === "riep") { var r1 = mg.querySelector(".mg-r,.mg-vuoto"); if (r1) r1.scrollIntoView({ behavior: "smooth", block: "start" }); }
          else pdfMese(a, a.getAttribute("data-mgaz") === "manda");
        });
        bx.addEventListener("click", function (ev) {
          var v = ev.target.closest("[data-mgv]");
          if (v) {
            bx.querySelectorAll("[data-mgv]").forEach(function (x) { x.classList.toggle("on", x === v); });
            var corr = v.getAttribute("data-mgv") === "corr";
            document.body.classList.toggle("oh-mg-corr", corr);
            document.getElementById("oh-mg-corrnota").style.display = corr ? "" : "none";
            if (corr) { var r1 = mg.querySelector(".mg-r,.mg-vuoto"); if (r1) r1.scrollIntoView({ behavior: "smooth", block: "center" }); }
            return;
          }
          var t = document.getElementById("oh-mg-testo");
          if (ev.target.closest("#oh-mg-mano")) {
            if (typeof window.opGiornataCompleta === "function") { window.opGiornataCompleta(t.value.trim()); t.value = ""; }
            return;
          }
          if (ev.target.closest("#oh-mg-ai")) {
            var testo = t.value.trim();
            if (!testo) { if (typeof toast === "function") toast("Scrivi o detta prima com'è andata la giornata"); t.focus(); return; }
            var conAI = typeof puo === "function" && puo("rapportini") && typeof rvApri === "function";
            if (!conAI) { window.opGiornataCompleta(testo); t.value = ""; return; }
            rvApri();
            setTimeout(function () { var v = document.querySelector('#rv-corpo [data-tipo="voce"]'); if (v) { v.click(); RV.detto = testo; } else window.opGiornataCompleta(testo); t.value = ""; }, 60);
          }
        });
      }
  }

  /* 28 nov 2026 — le spese del mese che ha segnato lui: quelle sui lavori
     (gest_spese, solo le sue: lo dice il database) e quelle col bancomat
     della ditta (la sua carta). In cima le ultime. */
  async function speseMese() {
    var box = document.getElementById("oh-sp-elenco"); if (!box || typeof sb === "undefined" || !MIO || !MIO.impresaId) return;
    var d = new Date(), a = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
    var n = new Date(d.getFullYear(), d.getMonth() + 1, 1), b = n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-01";
    var righe = [], totS = 0, totC = 0;
    var lav = {}; (typeof LAVORI !== "undefined" ? LAVORI : []).forEach(function (l) { lav[l.id] = l.descrizione || ""; });
    try {
      if (MIO.operatoreId && typeof puo === "function" && puo("pagamenti")) {
        var r = await sb.from("gest_spese").select("descrizione,importo,data,lavoro_id,created_at").eq("user_id", MIO.impresaId).eq("creato_da", MIO.operatoreId).is("eliminato_il", null).gte("data", a).lt("data", b);
        (r.data || []).forEach(function (x) { totS += +x.importo || 0; righe.push({ t: x.descrizione || "Spesa", imp: +x.importo || 0, data: x.data, lav: lav[x.lavoro_id] || "", quando: x.created_at || x.data, carta: false }); });
      }
      if (typeof MIA_CARTA !== "undefined" && MIA_CARTA) {
        var c = await sb.from("gest_carte_movimenti").select("causale,importo,data,lavoro_id,created_at").eq("carta_id", MIA_CARTA.carta_id).eq("tipo", "spesa").gte("data", a).lt("data", b);
        (c.data || []).forEach(function (x) { totC += +x.importo || 0; righe.push({ t: x.causale || "Spesa", imp: +x.importo || 0, data: x.data, lav: lav[x.lavoro_id] || "", quando: x.created_at || x.data, carta: true }); });
      }
      /* le spese dentro le giornate mandate e non ancora approvate dal capo */
      if (MIO.uid) {
        var p = await sb.from("gest_giornate_proposte").select("data,dove,extra,stato").eq("user_id", MIO.impresaId).eq("membro_id", MIO.uid).eq("stato", "da_vedere").gte("data", a).lt("data", b);
        (p.data || []).forEach(function (g) {
          ((g.extra && g.extra.spese) || []).forEach(function (x) { totS += +x.importo || 0; righe.push({ t: x.cosa || "Spesa", imp: +x.importo || 0, data: g.data, lav: g.dove || "", quando: g.data, carta: false, att: true }); });
        });
      }
    } catch (_) {}
    righe.sort(function (x, y) { return String(y.quando || "").localeCompare(String(x.quando || "")); });
    var eu = function (v) { return (v || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; };
    var GG = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"], MM = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
    var gg = function (s) { var x = new Date(String(s).slice(0, 10) + "T12:00:00"); return isNaN(x) ? "" : GG[x.getDay()] + " " + x.getDate() + " " + MM[x.getMonth()]; };
    box.innerHTML = (righe.length ? '<div class="oh-sp-tot"><div><span>Spese</span><b>' + eu(totS + totC) + '</b></div><div><span>Bancomat ditta</span><b>' + eu(totC) + '</b></div></div>' : '<div class="oh-mg-nota">Nessuna spesa questo mese.</div>')
      + righe.map(function (x) {
        return '<div class="oh-sp-r"><div><b>' + e(x.t) + '</b><small>' + e(gg(x.data)) + (x.lav ? " · " + e(x.lav) : "") + '</small>' + (x.carta ? '<span class="oh-sp-carta">💳 Bancomat ditta</span>' : '') + (x.att ? '<span class="oh-sp-att">aspetta il capo</span>' : '') + '</div><div class="imp">' + eu(x.imp) + '</div></div>';
      }).join("");
  }
  window.opSpeseMese = speseMese;

  /* 28 nov 2026 — le giornate salvate sul telefono e non ancora mandate */
  /* lo stesso riquadro anche in cima a «Lavori»: e' li' che uno lo cerca */
  function bozzeLav() {
    var pl = document.getElementById("op-p-lavori"); if (!pl) return null;
    var c = document.getElementById("oh-bz-lav");
    if (!c) {
      c = document.createElement("div"); c.id = "oh-bz-lav"; c.className = "oh-bz-card2"; c.style.display = "none";
      pl.insertBefore(c, pl.firstChild);
    }
    return c;
  }
  async function bozzeDisegna() {
    if (!window.opBozze) return;
    var c = window._ohMg && window._ohMg.bz, c2 = bozzeLav();
    var l = await window.opBozze.lista();
    if (c2) {
      if (!l.length) { c2.style.display = "none"; c2.innerHTML = ""; }
      else {
        c2.style.display = "";
        c2.innerHTML = '<h3>Giornate salvate da mandare (' + l.length + ')</h3>' + l.map(function (z) {
          return '<div class="oh-bz-r"><b>' + e(z.lavoroNome || z.dove || "Cantiere da scrivere") + '</b><small>' + e((z.cosa || "").slice(0, 90)) + '</small>'
            + '<div class="oh-bz-az"><button type="button" class="oh-bz-apri" data-bz2="' + e(z.id) + '">Apri e manda</button></div></div>';
        }).join("");
        c2.querySelectorAll("[data-bz2]").forEach(function (x) { x.onclick = function (ev) { ev.stopPropagation(); window.opBozze.apri(x.getAttribute("data-bz2")); }; });
      }
    }
    if (!c) return;
    if (!l.length) { c.style.display = "none"; c.innerHTML = ""; return; }
    var GG = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"], MM = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
    var gg = function (s) { var x = new Date(String(s || "").slice(0, 10) + "T12:00:00"); return isNaN(x) ? "" : GG[x.getDay()] + " " + x.getDate() + " " + MM[x.getMonth()]; };
    c.style.display = "";
    c.innerHTML = '<h3>Da mandare al capo (' + l.length + ')</h3>' + l.map(function (z) {
      var pezzi = [];
      if (z.foto && z.foto.length) pezzi.push(z.foto.length + " foto");
      if (z.spese && z.spese.length) pezzi.push(z.spese.length === 1 ? "1 spesa" : z.spese.length + " spese");
      if (z.bolle && z.bolle.length) pezzi.push(z.bolle.length === 1 ? "1 bolla" : z.bolle.length + " bolle");
      return '<div class="oh-bz-r"><b>' + e(gg(z.data)) + ' · ' + e(z.lavoroNome || z.dove || "Cantiere da scrivere") + '</b>'
        + '<small>' + e((z.cosa || "").slice(0, 90)) + (pezzi.length ? (z.cosa ? " — " : "") + pezzi.join(", ") : "") + '</small>'
        + '<div class="oh-bz-az"><button type="button" class="oh-bz-apri" data-bz="' + e(z.id) + '">Apri e manda</button><button type="button" class="oh-bz-via" data-bz="' + e(z.id) + '">Butta via</button></div></div>';
    }).join("");
  }
  window.opBozzeDisegna = bozzeDisegna;

  /* 28 nov 2026 — il PDF delle MIE giornate del mese, preso da quello che
     «Le mie giornate» ha gia' scritto a schermo (stesse righe, stesso mese) */
  function jspdf() {
    if (window.jspdf) return Promise.resolve(true);
    return new Promise(function (ok) {
      var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      sc.onload = function () { ok(!!window.jspdf); }; sc.onerror = function () { ok(false); }; document.head.appendChild(sc);
    });
  }
  async function pdfMese(btn, manda) {
    var mg = document.getElementById("mie-giornate"); if (!mg) return;
    var mese = ((mg.querySelector(".mg-mese b") || {}).textContent || "").trim();
    var tot = ((mg.querySelector(".mg-tot b") || {}).textContent || "").trim();
    var righe = Array.prototype.map.call(mg.querySelectorAll(".mg-r"), function (r) {
      var g = ((r.querySelector("small") || {}).textContent || "").trim();
      var d = ((r.querySelector("div") || {}).textContent || "").trim();
      return [g, d];
    });
    var t0 = btn.textContent; btn.disabled = true; btn.textContent = "Preparo il PDF…";
    var ok = await jspdf();
    btn.disabled = false; btn.textContent = t0;
    if (!ok) { if (typeof toast === "function") toast("Non riesco a fare il PDF adesso: controlla la rete"); return; }
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" }), y = 20, W = 210, M = 16;
    var nome = (typeof MIO !== "undefined" && MIO.nome) ? MIO.nome : "";
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("Le mie giornate — " + mese, M, y); y += 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    if (nome) { doc.text(nome, M, y); y += 6; }
    doc.text("Giorni lavorati: " + (tot || "0"), M, y); y += 10;
    if (!righe.length) { doc.text("Nessuna giornata segnata in questo mese.", M, y); y += 8; }
    righe.forEach(function (r) {
      var lin = doc.splitTextToSize(r[1] || "", W - M * 2 - 38);
      if (y + lin.length * 6 > 285) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.text(r[0] || "", M, y);
      doc.setFont("helvetica", "normal"); doc.text(lin, M + 38, y);
      y += Math.max(1, lin.length) * 6 + 3;
    });
    /* le spese del mese, come le vede in «Spese, benzina, bolle e fatture» */
    var sp = Array.prototype.map.call(document.querySelectorAll("#oh-sp-elenco .oh-sp-r"), function (r) {
      var b = ((r.querySelector("b") || {}).textContent || "").trim(), sm = ((r.querySelector("small") || {}).textContent || "").trim();
      var imp = ((r.querySelector(".imp") || {}).textContent || "").trim();
      var att = r.querySelector(".oh-sp-att") ? " (aspetta il capo)" : "", car = r.querySelector(".oh-sp-carta") ? " · bancomat ditta" : "";
      return [b + att, sm + car, imp];
    });
    if (sp.length) {
      y += 6; if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("Spese", M, y); y += 8; doc.setFontSize(12);
      sp.forEach(function (r) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold"); doc.text(r[0].slice(0, 60), M, y); doc.text(r[2], W - M, y, { align: "right" }); y += 5;
        doc.setFont("helvetica", "normal"); doc.text(r[1].slice(0, 90), M, y); y += 7;
      });
    }
    var file = "giornate-" + mese.toLowerCase().replace(/\s+/g, "-") + ".pdf";
    if (!manda) { doc.save(file); return; }
    /* 28 nov 2026 — a fine mese le giornate si mandano al capo in PDF:
       entra nella «Chat col capo» come un messaggio con il file */
    btn.disabled = true; btn.textContent = "Mando al capo…";
    try {
      var blob = doc.output("blob");
      var path = MIO.impresaId + "/chat/" + Date.now() + "_" + Math.floor(Math.random() * 1000) + "_" + file;
      var up = await sb.storage.from("gestionale-foto").upload(path, blob, { contentType: "application/pdf" });
      if (up.error) throw new Error(up.error.message);
      var ins = await sb.from("gest_messaggi").insert({ user_id: MIO.impresaId, operatore_id: MIO.operatoreId || null, lavoro_id: null, autore_nome: MIO.nome || null, testo: "Le mie giornate di " + mese + " (PDF)", allegati: [{ path: path, nome: file, tipo: "application/pdf" }] });
      if (ins.error) { try { await sb.storage.from("gestionale-foto").remove([path]); } catch (_) {} throw new Error(ins.error.message); }
      if (typeof window.tiSpunta === "function") window.tiSpunta("Mandato al capo", { sotto: "Le giornate di " + mese + " sono nella Chat col capo" });
      else if (typeof toast === "function") toast("Mandato al capo: lo trovi nella Chat col capo");
    } catch (err) {
      if (typeof toast === "function") toast("Non mandato: " + err.message + ". Riprova.");
    }
    btn.disabled = false; btn.textContent = t0;
  }

  function parti() {
    var st = document.createElement("style"); st.id = "oh-css"; st.textContent = css; document.head.appendChild(st);
    var giri = 0;
    (function aspetta() {
      /* si parte quando l'agenda e' pronta (permessi letti): se no si riprova */
      if (typeof MIO === "undefined" || !MIO.impresaId || !$("#view-agenda")) { if (++giri < 120) setTimeout(aspetta, 500); return; }
      frecceViste();
      if (MIO.tipoStudio === "professionista") document.body.classList.add("oh-studio");
      if (location.hash.indexOf("#sez-") === 0) history.replaceState(null, "", location.pathname + location.search);
      casa();
      scrivi();
      /* i riquadri si rifanno quando arrivano i numeri (giornate, lavori, chat) */
      [1500, 4000, 9000].forEach(function (t) { setTimeout(function () { if (!SEZ) disegna(); }, t); });
    })();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", parti); else parti();
  window.opCasa = casa;
})();
