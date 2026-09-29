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
  var PASSI = [
    { k: "azienda",    tit: "Scrivi i dati della tua azienda", sotto: "Nome, partita IVA, indirizzo: finiscono su preventivi e fatture.", az: "azienda" },
    { k: "clienti",    tit: "Aggiungi il tuo primo cliente",   sotto: "Chi ti chiede il lavoro. Lo scrivi una volta sola.", tab: "clienti" },
    { k: "preventivi", tit: "Fai il primo preventivo",         sotto: "Scegli il cliente, scrivi le voci: il PDF lo fa il gestionale.", tab: "preventivi" },
    { k: "lavori",     tit: "Apri il primo lavoro",            sotto: "Quando il cliente accetta, il preventivo diventa un lavoro.", tab: "lavori" },
    { k: "fatture",    tit: "Fai la prima fattura",            sotto: "A lavoro finito, dal lavoro nasce la fattura.", tab: "fatture" }
  ];
  var ultimo = 0, inCorso = false;

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
      var res = await Promise.all([
        (async function () { try { var r = await sb.from("gest_azienda").select("nome").eq("user_id", sbUid).maybeSingle(); return r.data && String(r.data.nome || "").trim() ? 1 : 0; } catch (_) { return null; } })(),
        conta("gest_clienti", nonButtato),
        conta("gest_preventivi", nonButtato),
        conta("gest_lavori", nonButtato),
        conta("gest_fatture", nonButtato)
      ]);
      ultimo = Date.now();
      if (res.some(function (x) { return x === null; })) { if (box) box.remove(); return; }   /* se una lettura non va, meglio niente che un passo sbagliato */
      var fatti = res.map(function (n) { return n > 0; });
      var quanti = fatti.filter(Boolean).length;
      if (quanti === PASSI.length) { if (box) box.remove(); return; }
      var prossimo = fatti.indexOf(false);

      var righe = PASSI.map(function (p, i) {
        var fatto = fatti[i], ora = i === prossimo;
        var dove = p.az ? "Dati azienda" : nomeMenu(p.tab, p.k);
        var att = p.az ? 'data-action="' + p.az + '"' : 'data-pp-tab="' + p.tab + '"';
        return '<div class="pp-riga' + (fatto ? " fatto" : "") + (ora ? " ora" : "") + '">'
          + '<span class="pp-num">' + (fatto ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : (i + 1)) + '</span>'
          + '<span class="pp-t"><b>' + p.tit + '</b><small>' + (fatto ? "Fatto" : p.sotto) + '</small></span>'
          + (fatto ? "" : '<button type="button" class="' + (ora ? "btn-primary" : "btn") + ' pp-vai" ' + att + '>' + (ora ? "Inizia da qui" : "Apri " + dove) + '</button>')
          + '</div>';
      }).join("");

      var html = '<div class="pp-testa"><div><b>Primi passi</b><span>' + quanti + ' fatti su ' + PASSI.length + ' · segui i numeri, uno alla volta</span></div>'
        + '<button type="button" class="pp-chiudi" data-pp-chiudi="1">Lo so già usare</button></div>'
        + '<div class="pp-barra"><i style="width:' + Math.round(quanti / PASSI.length * 100) + '%"></i></div>'
        + '<div class="pp-lista">' + righe + '</div>';
      if (!box) { box = document.createElement("div"); box.id = "rie-primi"; alert.parentNode.insertBefore(box, alert); }
      box.innerHTML = html;
    } finally { inCorso = false; }
  }

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-pp-tab],[data-pp-chiudi]") : null;
    if (!t) return;
    if (t.dataset.ppChiudi) {
      try { localStorage.setItem(CHIAVE, "1"); } catch (_) {}
      var b = document.querySelector("#rie-primi"); if (b) b.remove();
      return;
    }
    var tab = document.querySelector('.side nav.tabs button[data-tab="' + t.dataset.ppTab + '"]');
    if (tab) tab.click();
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
