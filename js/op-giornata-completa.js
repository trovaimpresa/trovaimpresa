/* =====================================================================
   10 nov 2026 — L'OPERAIO FA TUTTO DAL TELEFONO: «LA GIORNATA COMPLETA»
   Dentro «Segna la giornata» c'e' una scelta in piu', la prima:
       La giornata completa — foto, spese e bolla: la controlla il capo
   In una schermata sola: il giorno, cosa hai fatto, le FOTO, le SPESE e
   la BOLLA (o fattura) fotografata. «Manda al capo» la mette in
   gest_giornate_proposte («aspetta il capo»): nel gestionale, in
   Giornate → Da approvare, il capo vede tutto e con «Approva» entra nei
   conti (js/gest-giornata-completa.js). Prima di «Approva» non entra niente.
   · basta il permesso «Lavori» (come «Racconta la tua giornata»);
   · i file vanno in gestionale-foto, <impresa>/giornate/<operatore>/...
     (sql/giornata-completa.sql: l'operaio vede e carica solo la sua cartella)
   · il motore di «Segna la giornata» (js/op-rapido-voce.js) non e' toccato:
     si aggiunge una voce a RV_TIPI e si avvolge rvDisegna.
   ===================================================================== */
(function () {
  if (typeof RV_TIPI === "undefined" || typeof rvDisegna !== "function") return;

  var MAX_FOTO = 12, MAX_SPESE = 10, MAX_BOLLE = 6;
  var GC = null;   /* {data, dove, cosa, foto:[{file,url}], spese:[{importo,cosa}], bolle:[{file,url,nome,pdf}], msg, k, invio} */

  /* la scelta nuova, prima di tutte; e via l'emoji dalla voce «Racconta» */
  RV_TIPI.unshift({ k: "completa", lab: "La giornata completa", sub: "Foto, spese e bolla: la controlla il capo", perm: "lavori" });
  RV_TIPI.forEach(function (t) { if (t.lab) t.lab = t.lab.replace(/^\S*\u{1F399}\S*\s*/u, ""); });

  function oggi() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nuovo(cosa) { return { data: oggi(), dove: "", cosa: cosa || "", foto: [], spese: [], bolle: [], msg: "", k: "", invio: false }; }

  var IC = {
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  var st = document.createElement("style");
  st.textContent =
    ".gc-sez{border-top:1px solid var(--line);padding-top:14px;margin-top:14px}" +
    ".gc-tit{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:800;color:#0b1220;margin-bottom:10px}" +
    ".gc-tit svg{width:26px;height:26px;color:#1a3f7d;flex:0 0 auto}" +
    ".gc-lab{display:block;font-size:16px;font-weight:700;color:#1f2937;margin:12px 0 4px}" +
    ".gc-in{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:17px;padding:13px;border:1.5px solid var(--line);border-radius:12px;background:#fff}" +
    "textarea.gc-in{min-height:96px;resize:vertical}" +
    ".gc-foto{display:flex;flex-wrap:wrap;gap:10px}" +
    ".gc-th{position:relative;width:84px;height:84px;border-radius:12px;overflow:hidden;background:#e5e9ee;border:1px solid var(--line)}" +
    ".gc-th img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".gc-th .gc-pdf{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:800;color:#b3261e;background:#fff}" +
    ".gc-via{position:absolute;top:4px;right:4px;width:32px!important;height:32px!important;min-width:0!important;min-height:0!important;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-sizing:border-box}" +
    ".gc-via svg{width:16px;height:16px}" +
    ".gc-add{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;margin-top:10px;border:2px dashed #1a3f7d;border-radius:14px;background:#f4f7fc;color:#1a3f7d;font:inherit;font-size:17px;font-weight:800;cursor:pointer}" +
    ".gc-add svg{width:24px;height:24px}" +
    ".gc-sp{display:flex;gap:8px;align-items:center;margin-bottom:8px}" +
    ".gc-sp .gc-in{margin:0}" +
    ".gc-sp .gc-imp{flex:0 0 110px}" +
    ".gc-sp .gc-cosa{flex:1;min-width:0}" +
    ".gc-sp .gc-via{position:static;flex:0 0 44px;width:44px!important;height:44px!important;background:#fdeaea;color:#b3261e}" +
    ".gc-tot{font-size:17px;font-weight:800;text-align:right;margin-top:4px}" +
    ".gc-msg{font-size:17px;margin-top:12px}.gc-msg.err{color:#b3261e;font-weight:700}" +
    ".gc-nota{font-size:16px;color:#1f2937;margin-top:8px;line-height:1.45}";
  document.head.appendChild(st);

  function leggi() {
    if (!GC) return;
    var v = function (id) { var x = document.getElementById(id); return x ? x.value : null; };
    if (v("gc-data") != null) GC.data = v("gc-data") || GC.data;
    if (v("gc-dove") != null) GC.dove = v("gc-dove");
    if (v("gc-cosa") != null) GC.cosa = v("gc-cosa");
    GC.spese.forEach(function (s, i) {
      if (v("gc-imp-" + i) != null) s.importo = v("gc-imp-" + i);
      if (v("gc-sc-" + i) != null) s.cosa = v("gc-sc-" + i);
    });
  }

  function euro(n) { return (+n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
  function numero(t) { return typeof _numIt === "function" ? _numIt(t) : parseFloat(String(t || "").replace(",", ".")); }

  function modulo() {
    var corpo = document.getElementById("rv-corpo"), tit = document.getElementById("rv-tit");
    if (!corpo || !GC) return;
    tit.textContent = "La giornata completa";
    var nome = RV.lavoro && typeof rvNomeLavoro === "function" ? rvNomeLavoro(RV.lavoro) : "";
    var tot = GC.spese.reduce(function (s, x) { var n = numero(x.importo); return s + (n > 0 ? n : 0); }, 0);
    corpo.innerHTML =
      (nome ? '<div class="rv-nota">' + e(nome) + '</div>'
            : '<label class="gc-lab" for="gc-dove">Cantiere</label><input class="gc-in" id="gc-dove" type="text" value="' + e(GC.dove) + '" placeholder="Dove hai lavorato">')
      + '<label class="gc-lab" for="gc-data">Giorno</label><input class="gc-in" id="gc-data" type="date" max="' + oggi() + '" value="' + e(GC.data) + '">'
      + '<label class="gc-lab" for="gc-cosa">Cosa hai fatto</label><textarea class="gc-in" id="gc-cosa" placeholder="Puoi anche dettarlo col microfono della tastiera">' + e(GC.cosa) + '</textarea>'

      + '<div class="gc-sez"><div class="gc-tit">' + IC.cam + 'Foto del lavoro' + (GC.foto.length ? " (" + GC.foto.length + ")" : "") + '</div>'
      + (GC.foto.length ? '<div class="gc-foto">' + GC.foto.map(function (f, i) { return '<div class="gc-th"><img alt="" src="' + e(f.url) + '"><button type="button" class="gc-via" data-gc="via-foto" data-i="' + i + '" aria-label="Togli la foto">' + IC.x + '</button></div>'; }).join("") + '</div>' : "")
      + (GC.foto.length < MAX_FOTO ? '<button type="button" class="gc-add" data-gc="foto">' + IC.cam + 'Aggiungi foto</button>' : "")
      + '</div>'

      + '<div class="gc-sez"><div class="gc-tit">' + IC.euro + 'Spese</div>'
      + GC.spese.map(function (s, i) {
          return '<div class="gc-sp"><input class="gc-in gc-imp" id="gc-imp-' + i + '" type="text" inputmode="decimal" placeholder="€" value="' + e(s.importo) + '">'
            + '<input class="gc-in gc-cosa" id="gc-sc-' + i + '" type="text" placeholder="Per cosa? (es. viti)" value="' + e(s.cosa) + '">'
            + '<button type="button" class="gc-via" data-gc="via-spesa" data-i="' + i + '" aria-label="Togli la spesa">' + IC.x + '</button></div>';
        }).join("")
      + (GC.spese.length > 1 && tot > 0 ? '<div class="gc-tot">Totale ' + euro(tot) + '</div>' : "")
      + (GC.spese.length < MAX_SPESE ? '<button type="button" class="gc-add" data-gc="spesa">' + IC.euro + 'Aggiungi una spesa</button>' : "")
      + '</div>'

      + '<div class="gc-sez"><div class="gc-tit">' + IC.doc + 'Bolla o fattura' + (GC.bolle.length ? " (" + GC.bolle.length + ")" : "") + '</div>'
      + (GC.bolle.length ? '<div class="gc-foto">' + GC.bolle.map(function (f, i) { return '<div class="gc-th">' + (f.pdf ? '<div class="gc-pdf">PDF</div>' : '<img alt="" src="' + e(f.url) + '">') + '<button type="button" class="gc-via" data-gc="via-bolla" data-i="' + i + '" aria-label="Togli la bolla">' + IC.x + '</button></div>'; }).join("") + '</div>' : "")
      + (GC.bolle.length < MAX_BOLLE ? '<button type="button" class="gc-add" data-gc="bolla">' + IC.doc + 'Fotografa la bolla</button>' : "")
      + '</div>'

      + '<div class="gc-msg ' + e(GC.k) + '">' + e(GC.msg) + '</div>'
      + '<button type="button" class="rv-ok" id="gc-manda"' + (GC.invio ? " disabled" : "") + '>' + (GC.invio ? "Mando…" : "Manda al capo") + '</button>'
      + '<div class="gc-nota">Il capo la controlla e la approva. Fino ad allora non entra nei conti.</div>';
  }

  /* rvDisegna avvolta: al passo 3 della «giornata completa» c'e' il modulo;
     al passo 2 senza lavori si va dritti al modulo col cantiere da scrivere */
  var _disegna = rvDisegna;
  window.rvDisegna = function () {
    if (RV.tipo === "completa" && RV.passo === 2 && typeof rvLavori === "function" && !rvLavori().length) { RV.passo = 3; RV.lavoro = null; }
    if (RV.tipo === "completa" && RV.passo === 3) {
      var back = document.getElementById("rv-indietro"); if (back) back.classList.remove("hidden");
      if (!GC) GC = nuovo("");
      return modulo();
    }
    var unaSola = typeof puo === "function" && RV_TIPI.filter(function (t) { return puo(t.perm); }).length === 1;
    if (RV.tipo === "completa" && RV.passo === 2) {
      var r2 = _disegna.apply(this, arguments);
      var bk = document.getElementById("rv-indietro"); if (bk && unaSola) bk.classList.add("hidden");
      return r2;
    }
    if (RV.passo <= 1 && !(GC && GC.cosa)) GC = null;
    /* se l'unica cosa che puo' segnare e' la giornata completa, niente scelta da fare */
    if (RV.passo === 1 && unaSola && puo("lavori")) {
      RV.tipo = "completa";
      var solo = typeof rvUnicoDiOggi === "function" ? rvUnicoDiOggi() : null;
      if (solo) { RV.lavoro = solo; RV.passo = 3; RV.autoLavoro = true; } else { RV.lavoro = null; RV.passo = 2; RV.autoLavoro = false; }
      return window.rvDisegna();
    }
    return _disegna.apply(this, arguments);
  };
  try { rvDisegna = window.rvDisegna; } catch (x) {}

  function scegli(accetta, multi, poi) {
    var f = document.createElement("input");
    f.type = "file"; f.accept = accetta; f.multiple = !!multi; f.style.display = "none";
    document.body.appendChild(f);
    f.onchange = function () { var l = Array.from(f.files || []); f.remove(); if (l.length) poi(l); };
    f.click();
  }

  document.getElementById("rv-corpo").addEventListener("click", function (ev) {
    if (!(RV.tipo === "completa" && GC)) return;
    var b = ev.target.closest("[data-gc]"); if (!b && !ev.target.closest("#gc-manda")) return;
    leggi();
    if (ev.target.closest("#gc-manda")) { manda(); return; }
    var a = b.dataset.gc, i = +b.dataset.i;
    if (a === "foto") {
      scegli("image/*", true, function (l) {
        l.slice(0, MAX_FOTO - GC.foto.length).forEach(function (f) { GC.foto.unshift({ file: f, url: URL.createObjectURL(f) }); });
        GC.msg = ""; modulo();
      });
      return;
    }
    if (a === "bolla") {
      scegli("image/*,application/pdf", true, function (l) {
        l.slice(0, MAX_BOLLE - GC.bolle.length).forEach(function (f) {
          var pdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name || "");
          GC.bolle.unshift({ file: f, url: pdf ? "" : URL.createObjectURL(f), nome: f.name, pdf: pdf });
        });
        GC.msg = ""; modulo();
      });
      return;
    }
    if (a === "spesa") { GC.spese.push({ importo: "", cosa: "" }); modulo(); var x = document.getElementById("gc-imp-" + (GC.spese.length - 1)); if (x) x.focus(); return; }
    if (a === "via-foto") { GC.foto.splice(i, 1); modulo(); return; }
    if (a === "via-bolla") { GC.bolle.splice(i, 1); modulo(); return; }
    if (a === "via-spesa") { GC.spese.splice(i, 1); modulo(); return; }
  });

  async function carica(file, cartella, comprimi) {
    var f = file, nome = file.name || "file";
    if (comprimi && typeof preparaFileUpload === "function") {
      var p = await preparaFileUpload(file);
      if (p.errore) throw new Error(p.errore);
      f = p.file; nome = p.nome || nome;
    }
    var safe = String(nome).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    var path = MIO.impresaId + "/giornate/" + MIO.operatoreId + "/" + Date.now() + "_" + Math.floor(Math.random() * 100000) + "_" + safe;
    var up = await sb.storage.from("gestionale-foto").upload(path, f);
    if (up.error) throw new Error("file non caricato (" + up.error.message + ")");
    return { path: path, nome: nome, tipo: f.type || file.type || "" };
  }

  async function manda() {
    var sbagliato = "";
    var dove = RV.lavoro && typeof rvNomeLavoro === "function" ? rvNomeLavoro(RV.lavoro) : String(GC.dove || "").trim();
    var spese = [];
    GC.spese.forEach(function (s) {
      var vuota = !String(s.importo || "").trim() && !String(s.cosa || "").trim();
      if (vuota) return;
      var n = numero(s.importo);
      if (!(n > 0) || n > 100000) { sbagliato = sbagliato || "Una spesa non ha un importo giusto (es. 12,50)."; return; }
      spese.push({ importo: Math.round(n * 100) / 100, cosa: String(s.cosa || "").trim().slice(0, 200) || "Spesa" });
    });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(GC.data)) sbagliato = "Scegli il giorno.";
    else if (GC.data > oggi()) sbagliato = "Il giorno non può essere nel futuro.";
    else if (!dove) sbagliato = "Scrivi in quale cantiere hai lavorato.";
    if (sbagliato) { GC.msg = sbagliato; GC.k = "err"; modulo(); return; }
    if (!MIO || !MIO.impresaId || !MIO.operatoreId) { GC.msg = "Non sei collegato a una squadra: chiedi al capo di rimandarti l'invito."; GC.k = "err"; modulo(); return; }

    GC.invio = true; GC.msg = ""; modulo();
    try {
      var foto = [], bolle = [];
      for (var i = GC.foto.length - 1; i >= 0; i--) foto.push(await carica(GC.foto[i].file, "foto", true));
      for (var j = GC.bolle.length - 1; j >= 0; j--) bolle.push(await carica(GC.bolle[j].file, "bolle", !GC.bolle[j].pdf));
      var riga = {
        user_id: MIO.impresaId, operatore_id: MIO.operatoreId,
        lavoro_id: RV.lavoro ? RV.lavoro.id : null,
        data: GC.data, dove: dove.slice(0, 120), cosa: String(GC.cosa || "").trim().slice(0, 2000) || null,
        extra: { spese: spese, foto: foto, bolle: bolle }
      };
      var r = await sb.from("gest_giornate_proposte").insert(riga).select("id");
      if (r.error || !r.data || !r.data.length) throw new Error((r.error && r.error.message) || "non arrivata");
    } catch (err) {
      GC.invio = false; GC.msg = "Non mandata: " + err.message + ". Riprova: quello che hai scritto è ancora qui."; GC.k = "err"; modulo();
      return;
    }
    var pezzi = [];
    if (GC.foto.length) pezzi.push(GC.foto.length + " foto");
    if (spese.length) pezzi.push(spese.length === 1 ? "1 spesa" : spese.length + " spese");
    if (GC.bolle.length) pezzi.push(GC.bolle.length === 1 ? "1 bolla" : GC.bolle.length + " bolle");
    GC = null;
    if (typeof rvChiudi === "function") rvChiudi();
    if (typeof window.tiSpunta === "function") window.tiSpunta("Mandata al capo", pezzi.length ? { sotto: "Con " + pezzi.join(", ") } : null);
    else if (typeof toast === "function") toast("Mandata al capo" + (pezzi.length ? ", con " + pezzi.join(", ") : ""));
  }

  /* la freccia «‹» rifà la schermata: prima si tiene quello che ha scritto */
  var ind = document.getElementById("rv-indietro");
  if (ind) ind.addEventListener("click", function () { if (RV.tipo === "completa") leggi(); }, true);

  /* «Racconta la tua giornata» (Le mie giornate) e la voce di «Parla»
     portano qui: un posto solo per mandare la giornata al capo */
  function apri(testo) {
    if (typeof rvApri !== "function") return;
    rvApri();
    GC = nuovo(testo || "");
    RV.tipo = "completa";
    var solo = typeof rvUnicoDiOggi === "function" ? rvUnicoDiOggi() : null;
    if (solo) { RV.lavoro = solo; RV.passo = 3; RV.autoLavoro = true; } else { RV.lavoro = null; RV.passo = 2; RV.autoLavoro = false; }
    window.rvDisegna();
  }
  window.opGiornataCompleta = apri;
  window.mgRacconta = apri;
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest('#mie-giornate [data-mg="racconta"]');
    if (!b) return;
    ev.stopPropagation(); ev.preventDefault();
    apri("");
  }, true);
})();
