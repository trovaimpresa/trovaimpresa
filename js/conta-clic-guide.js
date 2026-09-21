/* ============================================================
   conta-clic-guide.js — 21 settembre 2026

   COSA CONTA
   I clic sui riquadri «Trova un …» e «Registrati gratis» dentro le guide,
   nella pagina Guide, nei Bandi e — dal 21 set 2026 — anche nelle pagine
   «mestiere + citta'» (muratore-roma e compagnia), che sono quelle che la
   gente trova da Google.
   Di ogni clic segna due cose sole:
     - DA DOVE: il riquadro in cima, la striscia a meta' pagina o il
       riquadro in fondo
     - QUALE LATO: «cerca» (arancione) o «registra» (verde)
   Serve a sapere quale dei tre punti fa entrare davvero la gente nel
   sito, per poi tenere quelli che funzionano e togliere gli altri.

   DOVE FINISCE
   Nella tabella `visite_clienti` che c'e' gia' (tipo = 'clic_guida'):
   dal sito si puo' solo SCRIVERE, nessuno puo' rileggere quelle righe.
   Si vedono solo nel pannello admin, in «Ricerche e visite».

   COSA NON FA
   Nessun cookie, nessun IP, nessun nome. L'id di sessione e' lo stesso
   numero a caso di conta-visita.js e muore chiudendo la scheda.

   NON DEVE MAI ROMPERE LA PAGINA ne' rallentare il clic: la riga parte
   in sottofondo (keepalive) e il link va per la sua strada come sempre.
   ============================================================ */
(function () {
  'use strict';

  var URL_DB = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var CHIAVE = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

  try {
    var ua = (navigator && navigator.userAgent) || '';
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i.test(ua)) return;
    if (navigator.webdriver) return;

    var sessione = null;
    try {
      sessione = sessionStorage.getItem('ti_visita');
      if (!sessione) {
        sessione = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('ti_visita', sessione);
      }
    } catch (e) { /* navigazione privata: si conta lo stesso, senza id */ }

    var largh = null;
    try { largh = window.innerWidth || null; } catch (e) {}

    function taglia(s, n) {
      if (s === null || s === undefined || s === '') return null;
      return String(s).trim().slice(0, n) || null;
    }

    function manda(punto, lato) {
      try {
        fetch(URL_DB + '/rest/v1/visite_clienti', {
          method: 'POST',
          keepalive: true, // la riga parte anche se la pagina sta gia' cambiando
          headers: {
            'apikey': CHIAVE,
            'Authorization': 'Bearer ' + CHIAVE,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            tipo: 'clic_guida',
            cosa: punto,
            dove: lato,
            pagina: taglia(location.pathname, 200),
            sessione: taglia(sessione, 60),
            telefono: largh !== null ? largh < 768 : null
          })
        })['catch'](function () {});
      } catch (e) {}
    }

    /* DA DOVE arriva il clic.
       La striscia di mezzo si riconosce dalla classe. Per i due riquadri
       grandi (uguali in cima e in fondo) si guarda dove stanno nella
       pagina: il primo che compare e' quello in cima. */
    function punto(link) {
      try {
        if (link.closest('.ti-riga')) return 'meta';
        /* pagine mestiere+citta': il riquadro blu in alto e quello in fondo */
        if (link.closest('.hero')) return 'cima';
        if (link.closest('.cta-box')) return 'fondo';
        var box = link.closest('.ti-promo');
        if (!box) return 'altro';
        var tutti = document.querySelectorAll('.ti-promo');
        if (tutti.length < 2) return 'cima';
        return (box === tutti[0]) ? 'cima' : 'fondo';
      } catch (e) {}
      return 'altro';
    }

    /* QUALE LATO: arancione = sta cercando qualcuno; verde = si iscrive. */
    function lato(link) {
      try {
        if (link.classList.contains('ti-promo-b2')) return 'registra';
        if (link.classList.contains('verde')) return 'registra';
        var href = (link.getAttribute('href') || '').toLowerCase();
        if (href.indexOf('registrazione') !== -1 || href.indexOf('registrati') !== -1) return 'registra';
        if (href.indexOf('#registrati') !== -1) return 'registra';
      } catch (e) {}
      return 'cerca';
    }

    document.addEventListener('click', function (ev) {
      try {
        var t = ev.target;
        if (!t || !t.closest) return;
        var link = t.closest(
          '.ti-promo-b, .ti-riga-btns a,' +
          /* pagine mestiere+citta' */
          '.hero-btn, .hero-iscriviti a, .cta-box a'
        );
        if (!link) return;
        manda(punto(link), lato(link));
      } catch (e) {}
    }, true); // in cattura: si conta prima che la pagina cambi

  } catch (e) { /* il conteggio non deve mai rompere la pagina */ }
})();
