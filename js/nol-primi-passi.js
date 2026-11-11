/* ═══ 29 settembre 2026 — PRIMI PASSI anche nel NOLEGGIO ═══════════════════
   Gemello di gest-primi-passi.js (gestionale imprese), con i passi del
   noleggio, in ordine di partenza:
     1 Dati azienda   2 primo mezzo   3 primo cliente
     4 primo noleggio 5 prima fattura
   Un passo si spunta da solo quando c'e' il dato. Fatti tutti e 5, il
   riquadro sparisce. «Lo so gia' usare» lo chiude (si ricorda nel browser,
   chiave diversa da quella del gestionale imprese).

   ⚠️ Il codice del noleggio sta dentro una (function(){...}): sb e sbUid
   da qui NON si vedono. Per questo il file si fa il suo collegamento a
   Supabase (stessa chiave pubblica della pagina, stessa sessione).
   La forma (#rie-primi, .pp-*) e' quella del gestionale imprese:
   sta in css/gestionale.css, che il noleggio carica gia'.
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  var URL_SB = "https://nacvrsgkyfavykxjxszu.supabase.co";
  var KEY_SB = "sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";
  var CHIAVE = "ti-primi-passi-nol-chiuso";
  /* 29/09/2026 — deciso con Alessio: finiti i 5 passi l'aiuto NON sparisce da
     solo. Chiede «Hai imparato: vuoi che lo togliamo?». Chi usava gia' il
     gestionale prima (e il riquadro non l'ha mai visto) non lo vede. */
  var VISTO = "ti-primi-passi-nol-visto", TIENI = "ti-primi-passi-nol-tieni";
  /* ⛔ 11 nov 2026 — TRE PASSI SOLI, come nel gestionale imprese: il mezzo,
     il cliente, il primo noleggio (che fa nascere il contratto). Dati
     azienda e fattura li trova da solo; i dati azienda hanno gia' il loro
     richiamo, e il contratto li chiede quando servono. */
  var PASSI = [
    { tit: "Aggiungi il tuo primo mezzo",   sotto: "Quello che dai a noleggio, col suo prezzo al giorno.", tab: "mezzi" },
    { tit: "Aggiungi il tuo primo cliente", sotto: "Chi prende il mezzo. Lo scrivi una volta sola.", tab: "clienti-nol" },
    { tit: "Fai il primo noleggio",         sotto: "Scegli mezzo, cliente e date: il contratto lo fa il gestionale.", tab: "noleggi" }
  ];
  var sb = null, uid = null, ultimo = 0, inCorso = false, primaQuanti = null;

  function leggi(k) { try { return localStorage.getItem(k) === "1"; } catch (_) { return false; } }
  function segna(k) { try { localStorage.setItem(k, "1"); } catch (_) {} }
  function chiuso() { try { return localStorage.getItem(CHIAVE) === "1"; } catch (_) { return false; } }
  function nomeMenu(tab, riserva) {
    var b = document.querySelector('nav.tabs button[data-tab="' + tab + '"]');
    var t = b ? b.childNodes[0] && b.childNodes[0].nodeType === 3 ? b.childNodes[0].textContent.trim() : b.textContent.trim() : "";
    return t || riserva;
  }
  async function conta(tab, extra) {
    try {
      var q = sb.from(tab).select("id", { count: "exact", head: true }).eq("user_id", uid).is("eliminato_il", null);
      if (extra) q = extra(q);
      var r = await q;
      return r.error ? null : (r.count || 0);
    } catch (_) { return null; }
  }

  async function disegna(forza) {
    var rie = document.querySelector("#riepilogo"), dopo = rie && rie.querySelector(".nrc-grid");
    if (!rie || !dopo) return;
    var box = document.querySelector("#rie-primi");
    if (chiuso() || !sb || !uid) { if (box) box.remove(); return; }
    if (inCorso || (!forza && Date.now() - ultimo < 4000)) return;
    inCorso = true;
    try {
      var res = await Promise.all([
        conta("gest_mezzi", function (q) { return q.eq("noleggiabile", true); }),
        conta("gest_clienti"),
        conta("nol_noleggi")
      ]);
      ultimo = Date.now();
      if (res.some(function (x) { return x === null; })) { if (box) box.remove(); return; }
      var fatti = res.map(function (n) { return n > 0; });
      var quanti = fatti.filter(Boolean).length;
      var finito = quanti === PASSI.length;
      if (finito && !leggi(VISTO)) { if (box) box.remove(); return; }   /* chi lo sapeva gia' usare */
      if (!finito) segna(VISTO);
      var prossimo = fatti.indexOf(false);

      var righe = PASSI.map(function (p, i) {
        var fatto = fatti[i], ora = i === prossimo;
        return '<div class="pp-riga' + (fatto ? " fatto" : "") + (ora ? " ora" : "") + '">'
          + '<span class="pp-num">' + (fatto ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : (i + 1)) + '</span>'
          + '<span class="pp-t"><b>' + p.tit + '</b><small>' + (fatto ? "Fatto" : p.sotto) + '</small></span>'
          + (!fatto && ora ? '<button type="button" class="btn-primary pp-vai" data-pp-tab="' + p.tab + '">Inizia da qui</button>' : '')
          + '</div>';
      }).join("");

      var html = finito && !leggi(TIENI)
        ? '<div class="pp-fine"><b>Bravo, hai fatto il tuo primo noleggio!</b><span>Il contratto lo trovi nella scheda del noleggio. Vuoi che togliamo l\'aiuto?</span>'
          + '<div class="pp-fine-btn"><button type="button" class="btn-primary" data-pp-chiudi="1">Sì, toglilo</button>'
          + '<button type="button" class="btn" data-pp-tieni="1">Tienilo ancora</button></div></div>'
        : '<div class="pp-primo pp-tre"><div class="pp-tre-testa"><div><h3>' + (finito ? 'Fatto: il primo noleggio è partito' : 'Il tuo primo noleggio in 3 passi') + '</h3>'
          + '<p>Mezzo, cliente, noleggio. Ci vogliono pochi minuti.</p></div>'
          + '<button type="button" class="pp-chiudi" data-pp-chiudi="1">Togli l\'aiuto</button></div>'
          + '<div class="pp-barra"><i style="width:' + Math.round(quanti / PASSI.length * 100) + '%"></i></div>'
          + '<div class="pp-conto"><b>' + quanti + '</b> ' + (quanti === 1 ? 'fatto' : 'fatti') + ' su <b>' + PASSI.length + '</b></div></div>'
          + '<div class="pp-dentro"><div class="pp-lista">' + righe + '</div></div>';
      if (finito && primaQuanti !== null && primaQuanti < PASSI.length && typeof window.tiSpunta === "function")
        window.tiSpunta("Hai fatto il tuo primo noleggio!", { durata: 2200 });
      primaQuanti = quanti;
      if (!box) { box = document.createElement("div"); box.id = "rie-primi"; dopo.parentNode.insertBefore(box, dopo); }
      box.innerHTML = html;
      box.classList.toggle("pp-ha-primo", !(finito && !leggi(TIENI)));
    } finally { inCorso = false; }
  }

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-pp-tab],[data-pp-chiudi],[data-pp-tieni],nav.tabs button[data-tab=\"riepilogo\"]") : null;
    if (!t) return;
    if (t.dataset.tab === "riepilogo") { setTimeout(function () { disegna(false); }, 300); return; }
    if (t.dataset.ppTieni) { segna(TIENI); ultimo = 0; disegna(true); return; }
    if (t.dataset.ppChiudi) {
      try { localStorage.setItem(CHIAVE, "1"); } catch (_) {}
      var b = document.querySelector("#rie-primi"); if (b) b.remove();
      return;
    }
    var tab = document.querySelector('nav.tabs button[data-tab="' + t.dataset.ppTab + '"]');
    if (tab) { tab.click(); window.scrollTo(0, 0); }
  });

  function avvio() {
    if (!window.supabase || !window.supabase.createClient) return;
    try { sb = window.supabase.createClient(URL_SB, KEY_SB); } catch (_) { return; }
    sb.auth.getSession().then(function (r) {
      uid = r && r.data && r.data.session ? r.data.session.user.id : null;
      disegna(true);
    });
    sb.auth.onAuthStateChange(function (_e, s) {
      var n = s ? s.user.id : null;
      if (n !== uid) { uid = n; disegna(true); }
    });
    /* chi torna sulla pagina dopo aver salvato altrove: si rilegge */
    document.addEventListener("visibilitychange", function () { if (!document.hidden) disegna(false); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvio); else avvio();
})();
