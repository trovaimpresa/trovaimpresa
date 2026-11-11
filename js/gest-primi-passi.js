/* ═══ 28 settembre 2026 — PRIMI PASSI ══════════════════════════════════════
   Chi entra per la prima volta vede tante sezioni e non sa da dove partire.
   In cima al Riepilogo compare un riquadro con i 5 passi, numerati e in
   ordine di partenza, ognuno col suo pulsante:
     1 Dati azienda   2 primo cliente   3 primo preventivo
     4 primo lavoro   5 prima fattura
   Un passo si spunta da solo quando c'e' il dato (letto dal database).
   Quando sono fatti tutti e 5 il riquadro sparisce. Si puo' anche chiudere
   a mano («Lo so gia' usare»): si ricorda nel browser.

   Legge i dati di TUTTA l'azienda, non del reparto: i passi sono della
   persona. I nomi delle sezioni li prende dal menu, cosi' per uno studio
   tecnico escono le sue parole (Incarichi, Parcelle...) e non le nostre.

   Nessun nome globale: tutto dentro la funzione. Vede sb e sbUid della
   pagina (sono dichiarati al primo livello, come negli altri file gest-).
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  var CHIAVE = "ti-primi-passi-chiuso";
  /* 29/09/2026 — deciso con Alessio: finiti i 5 passi l'aiuto NON sparisce da
     solo. Chiede «Hai imparato: vuoi che lo togliamo?». Chi usava gia' il
     gestionale prima (e il riquadro non l'ha mai visto) non lo vede. */
  var VISTO = "ti-primi-passi-visto", TIENI = "ti-primi-passi-tieni";
  /* ⛔ 1 nov 2026 — L'ORDINE E' CAMBIATO (Alex). Prima il PREVENTIVO, fatto
     con l'AI, e per ultimi i dati azienda: erano il primo passo e il piu'
     noioso, e tanti si fermavano li'. Misurato quel giorno: 30 entrati nel
     gestionale, 13 non hanno scritto niente, 7 hanno fatto un preventivo. */
  /* ⛔ 11 nov 2026 — TRE PASSI SOLI (Alex): cliente, preventivo, invio.
     E' il giro che fa restare chi si iscrive: alla fine ha MANDATO qualcosa
     a un cliente vero. Lavoro, fattura e dati azienda li trova da solo. */
  var PASSI = [
    { k: "clienti",    tit: "Aggiungi il tuo primo cliente", sotto: "Chi ti chiede il lavoro. Nome e telefono bastano.", tab: "clienti", apri: "new-cli" },
    { k: "preventivi", tit: "Fai il preventivo",             sotto: "Lo scrive l'AI: tu controlli e salvi.", tab: "preventivi", ai: 1 },
    { k: "invio",      tit: "Mandalo al cliente",            sotto: "Con WhatsApp o email. Lui lo apre dal telefono e lo firma.", tab: "preventivi", invia: 1 }
  ];
  var ultimo = 0, inCorso = false, ultimoPrev = null, primaQuanti = null;

  function leggi(k) { try { return localStorage.getItem(k) === "1"; } catch (_) { return false; } }
  function segna(k) { try { localStorage.setItem(k, "1"); } catch (_) {} }
  function chiuso() { try { return localStorage.getItem(CHIAVE) === "1"; } catch (_) { return false; } }
  function nomeMenu(tab, riserva) {
    var b = document.querySelector('.side nav.tabs button[data-tab="' + tab + '"] span');
    var t = b ? b.textContent.trim() : "";
    return t || riserva;
  }

  async function conta(tab, extra) {
    try {
      var q = sb.from(tab).select("id", { count: "exact", head: true }).eq("user_id", sbUid);
      if (extra) q = extra(q);
      var r = await q;
      return r.error ? null : (r.count || 0);
    } catch (_) { return null; }
  }

  async function disegna() {
    var rie = document.querySelector("#riepilogo"), alert = document.querySelector("#rie-alert");
    if (!rie || !alert) return;
    var box = document.querySelector("#rie-primi");
    if (chiuso() || typeof sb === "undefined" || !sb || typeof sbUid === "undefined" || !sbUid) { if (box) box.remove(); return; }
    if (inCorso || Date.now() - ultimo < 4000) return;
    inCorso = true;
    try {
      var nonButtato = function (q) { return q.is("eliminato_il", null); };
      /* ⚠️ l'ordine qui deve essere lo STESSO di PASSI */
      var res = await Promise.all([
        conta("gest_clienti", nonButtato),
        conta("gest_preventivi", nonButtato),
        conta("gest_preventivi", function (q) { return nonButtato(q).neq("stato", "bozza"); })
      ]);
      /* il preventivo da mandare: l'ultimo fatto */
      ultimoPrev = null;
      if (res[1] > 0 && !(res[2] > 0)) {
        try { var u = await sb.from("gest_preventivi").select("id").eq("user_id", sbUid).is("eliminato_il", null).order("created_at", { ascending: false }).limit(1); ultimoPrev = u.data && u.data[0] ? u.data[0].id : null; } catch (_) {}
      }
      ultimo = Date.now();
      if (res.some(function (x) { return x === null; })) { if (box) box.remove(); return; }   /* se una lettura non va, meglio niente che un passo sbagliato */
      var fatti = res.map(function (n) { return n > 0; });
      var quanti = fatti.filter(Boolean).length;
      var finito = quanti === PASSI.length;
      if (finito && !leggi(VISTO)) { if (box) box.remove(); return; }   /* chi lo sapeva gia' usare */
      if (!finito) segna(VISTO);
      /* 11 nov 2026 — l'ultimo passo fatto ADESSO, davanti ai suoi occhi: la spunta */
      if (finito && primaQuanti !== null && primaQuanti < PASSI.length && typeof window.tiSpunta === "function")
        window.tiSpunta("Hai mandato il tuo primo preventivo!", { durata: 2200 });
      primaQuanti = quanti;
      var prossimo = fatti.indexOf(false);

      var puoParlare = !!document.getElementById("gv-btn");
      var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
      var righe = PASSI.map(function (p, i) {
        var fatto = fatti[i], ora = i === prossimo, bott = "";
        if (!fatto && ora && p.ai) {
          bott = '<span class="pp-bott">' + (puoParlare ? '<button type="button" class="btn-primary pp-vai pp-parla2" data-pp-primo="parla">' + MIC + 'Parla</button>' : '')
            + '<button type="button" class="' + (puoParlare ? "btn" : "btn-primary") + ' pp-vai" data-pp-primo="scrivi">Scrivi</button></span>';
        } else if (!fatto && ora) {
          var att = 'data-pp-tab="' + p.tab + '"' + (p.apri ? ' data-pp-apri="' + p.apri + '"' : '') + (p.invia ? ' data-pp-invia="1"' : '');
          bott = '<button type="button" class="btn-primary pp-vai" ' + att + '>' + (p.invia ? "Mandalo adesso" : "Inizia da qui") + '</button>';
        }
        return '<div class="pp-riga' + (fatto ? " fatto" : "") + (ora ? " ora" : "") + '">'
          + '<span class="pp-num">' + (fatto ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : (i + 1)) + '</span>'
          + '<span class="pp-t"><b>' + p.tit + '</b><small>' + (fatto ? "Fatto" : p.sotto) + (!fatto && ora && p.ai ? '<em class="pp-es2">Per esempio: «rifare il bagno, piastrelle e sanitari, 6.500 euro»</em>' : '') + '</small></span>'
          + bott + '</div>';
      }).join("");

      var html = finito && !leggi(TIENI)
        ? '<div class="pp-fine"><b>Bravo, hai mandato il tuo primo preventivo!</b><span>Quando il cliente lo accetta, lo trovi in Preventivi e ne fai un lavoro. Vuoi che togliamo l\'aiuto?</span>'
          + '<div class="pp-fine-btn"><button type="button" class="btn-primary" data-pp-chiudi="1">Sì, toglilo</button>'
          + '<button type="button" class="btn" data-pp-tieni="1">Tienilo ancora</button></div></div>'
        : '<div class="pp-primo pp-tre"><div class="pp-tre-testa"><div><h3>' + (finito ? 'Fatto: il primo preventivo è partito' : 'Il tuo primo preventivo in 3 passi') + '</h3>'
          + '<p>Cliente, preventivo, invio. Ci vogliono pochi minuti.</p></div>'
          + '<button type="button" class="pp-chiudi" data-pp-chiudi="1">Togli l\'aiuto</button></div>'
          + '<div class="pp-barra"><i style="width:' + Math.round(quanti / PASSI.length * 100) + '%"></i></div>'
          + '<div class="pp-conto"><b>' + quanti + '</b> ' + (quanti === 1 ? 'fatto' : 'fatti') + ' su <b>' + PASSI.length + '</b></div></div>'
          + '<div class="pp-dentro"><div class="pp-lista">' + righe + '</div></div>';
      if (!box) { box = document.createElement("div"); box.id = "rie-primi"; alert.parentNode.insertBefore(box, alert); }
      box.innerHTML = html;
      box.classList.toggle("pp-ha-primo", !(finito && !leggi(TIENI)));
    } finally { inCorso = false; }
  }

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-pp-tab],[data-pp-chiudi],[data-pp-tieni],[data-pp-primo]") : null;
    if (t && t.dataset.ppInvia && ultimoPrev && typeof window.gestInviaCliente === "function") { window.gestInviaCliente(ultimoPrev); return; }
    if (!t) return;
    if (t.dataset.ppPrimo === "parla") { var g = document.getElementById("gv-btn"); if (g) g.click(); return; }
    if (t.dataset.ppPrimo === "scrivi") {
      if (typeof window.gestApriModuloAI === "function") window.gestApriModuloAI("preventivo");
      else { var pv = document.querySelector('.side nav.tabs button[data-tab="preventivi"]'); if (pv) pv.click(); }
      return;
    }
    if (t.dataset.ppTieni) { segna(TIENI); ultimo = 0; disegna(); return; }
    if (t.dataset.ppChiudi) {
      try { localStorage.setItem(CHIAVE, "1"); } catch (_) {}
      var b = document.querySelector("#rie-primi"); if (b) b.remove();
      return;
    }
    var tab = document.querySelector('.side nav.tabs button[data-tab="' + t.dataset.ppTab + '"]');
    if (tab) tab.click();
    if (t.dataset.ppApri) setTimeout(function () { var b = document.querySelector('#' + t.dataset.ppTab + ' [data-action="' + t.dataset.ppApri + '"]'); if (b) b.click(); }, 300);
  });

  /* il Riepilogo si ridisegna quando si entra in un reparto o si salva
     qualcosa: allora si rilegge (al massimo una volta ogni 4 secondi) */
  function avvio() {
    var grid = document.querySelector("#rie-grid");
    if (!grid) return;
    new MutationObserver(function () { ultimo = 0; setTimeout(disegna, 50); }).observe(grid, { childList: true });
    disegna();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvio); else avvio();
})();
