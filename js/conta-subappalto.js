/* =====================================================================
   SUBAPPALTI — QUANTI APRONO L'ANNUNCIO E QUANTI CONTATTANO (19 nov 2026)

   - Sulla pagina /subappalto-annuncio?id=N conta una «vista».
   - Su tutte le pagine dei subappalti conta un «contatto» quando qualcuno
     tocca il telefono, un'email o «Mostra email» di un annuncio.
   - Una volta al giorno per persona e per annuncio (lo decide il
     database, funzione conta_subappalto): i numeri non si gonfiano.
   - I numeri vanno nelle colonne subappalti.visite / subappalti.contatti:
     li vede Alex nell'admin e l'impresa in «I tuoi annunci».
   - Non blocca mai niente: se la chiamata fallisce, il telefono parte lo stesso.
   ===================================================================== */
(function () {
  'use strict';
  var URL_RPC = 'https://nacvrsgkyfavykxjxszu.supabase.co/rest/v1/rpc/conta_subappalto';
  var CHIAVE = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  if (navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent || '')) return;

  function sessione() {
    var s = '';
    try { s = localStorage.getItem('ti_sub_sess') || ''; } catch (e) {}
    if (!/^[a-z0-9]{12,40}$/.test(s)) {
      s = (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 24);
      try { localStorage.setItem('ti_sub_sess', s); } catch (e) {}
    }
    return s;
  }
  function conta(id, azione) {
    id = parseInt(id, 10);
    if (!id) return;
    try {
      fetch(URL_RPC, {
        method: 'POST', keepalive: true,
        headers: { apikey: CHIAVE, Authorization: 'Bearer ' + CHIAVE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_id: id, p_azione: azione, p_sessione: sessione() })
      }).catch(function () {});
    } catch (e) {}
  }
  function idDaLink(a) {
    var m = String(a && a.getAttribute('href') || '').match(/subappalto-annuncio(?:\.html)?\?id=(\d+)/);
    return m ? m[1] : null;
  }

  var suAnnuncio = /\/subappalto-annuncio(\.html)?$/.test(location.pathname);
  var idPagina = suAnnuncio ? (new URLSearchParams(location.search).get('id') || '') : '';
  if (idPagina) conta(idPagina, 'vista');

  /* L'annuncio a cui appartiene un clic: risale dal punto toccato finché
     trova un riquadro con UN solo annuncio dentro (la sua scheda). */
  function annuncioDi(el) {
    if (idPagina) return document.getElementById('sa-contenuto') && document.getElementById('sa-contenuto').contains(el) ? idPagina : null;
    for (var n = el, salti = 0; n && n !== document.body && salti < 8; n = n.parentElement, salti++) {
      var links = n.querySelectorAll ? n.querySelectorAll('a[href*="subappalto-annuncio"]') : [];
      if (!links.length) continue;
      var ids = {};
      for (var i = 0; i < links.length; i++) { var x = idDaLink(links[i]); if (x) ids[x] = 1; }
      var k = Object.keys(ids);
      return k.length === 1 ? k[0] : null;
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me"], #sa-mostra-email') : null;
    if (!t) return;
    var id = annuncioDi(t);
    if (id) conta(id, 'contatto');
  }, true);
})();
