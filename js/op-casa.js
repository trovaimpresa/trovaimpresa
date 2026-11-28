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
    + "body:not(.oh-sez) #oh-back{display:none}"
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
      va.insertBefore(b, va.firstChild);
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
      b.innerHTML = '<span style="font-size:24px">‹</span><b>' + e(nomi[sez] || "Indietro") + '</b><span style="font-size:15px;color:#64707c;font-weight:600">Indietro</span>';
    }
    if (!sez) disegna();
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
      b.innerHTML = '<span style="font-size:24px">‹</span>Indietro';
      b.onclick = function () { if (location.hash.indexOf("#sez-") === 0) history.back(); else { var na = $("#nav-agenda"); if (na) na.click(); casa(); } };
      w.insertBefore(b, w.firstChild);
    });
  }

  function parti() {
    var st = document.createElement("style"); st.id = "oh-css"; st.textContent = css; document.head.appendChild(st);
    var giri = 0;
    (function aspetta() {
      /* si parte quando l'agenda e' pronta (permessi letti): se no si riprova */
      if (typeof MIO === "undefined" || !MIO.impresaId || !$("#view-agenda")) { if (++giri < 120) setTimeout(aspetta, 500); return; }
      frecceViste();
      if (location.hash.indexOf("#sez-") === 0) history.replaceState(null, "", location.pathname + location.search);
      casa();
      /* i riquadri si rifanno quando arrivano i numeri (giornate, lavori, chat) */
      [1500, 4000, 9000].forEach(function (t) { setTimeout(function () { if (!SEZ) disegna(); }, t); });
    })();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", parti); else parti();
  window.opCasa = casa;
})();
