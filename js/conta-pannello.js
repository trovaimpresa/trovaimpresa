/* ============================================================
   conta-pannello.js — chi entra nel suo pannello, e per quanto.
   6 settembre 2026.

   PERCHE' ESISTE
   Del gestionale sapevamo gia' chi lo apre (tabella gest_accessi).
   Dei quattro PANNELLI non sapevamo niente: ne' quante volte
   un'impresa ci entra, ne' quanto ci resta. Sapevamo solo l'ultimo
   ingresso, perche' lo segna Supabase da solo.

   COSA SCRIVE (tabella public.accessi_pannello)
   Una riga per ogni apertura del pannello: id, chi, quale pannello,
   quando, quanti secondi. L'id lo genera il browser e la stessa riga
   viene riscritta mentre la persona sta dentro, cosi' i secondi
   crescono anche se poi chiude la scheda di colpo.

   ⚠️ I SECONDI CONTANO SOLO IL TEMPO DAVANTI AGLI OCCHI.
   Se la scheda va in secondo piano (cambia finestra, blocca il
   telefono) il contatore si ferma. Senza questo, uno che lascia il
   pannello aperto e va a lavorare risulterebbe "dentro 8 ore", e il
   numero racconterebbe una bugia.

   NON DEVE MAI ROMPERE LA PAGINA: tutto dentro try/catch, e se
   Supabase non risponde non succede niente.
   ============================================================ */
(function () {
  'use strict';

  var URL_DB  = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var CHIAVE  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';
  var TAVOLA  = URL_DB + '/rest/v1/accessi_pannello';
  var OGNI    = 20;   // ogni quanti secondi si riscrive la riga

  try {
    var ua = (navigator && navigator.userAgent) || '';
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(ua)) return;
    if (navigator.webdriver) return;
    if (document.visibilityState === 'prerender') return;

    /* Quale pannello, dal nome del file. Se non e' un pannello, esce. */
    var file = (location.pathname.split('/').pop() || '').replace('.html', '');
    var NOMI = {
      'pannello-impresa': 'impresa',
      'pannello-artigiano': 'artigiano',
      'pannello-professionisti': 'professionista',
      'pannello-negozio': 'negozio'
    };
    var pannello = NOMI[file];
    if (!pannello) return;

    /* Il gettone dell'iscritto: lo tiene supabase-js nella memoria del
       browser. Se non c'e', non e' entrato nessuno e non si conta niente. */
    var gettone = null, chi = null;
    try {
      var grezzo = localStorage.getItem('sb-nacvrsgkyfavykxjxszu-auth-token');
      if (!grezzo) return;
      var s = JSON.parse(grezzo);
      gettone = s && s.access_token;
      chi     = s && s.user && s.user.id;
    } catch (e) { return; }
    if (!gettone || !chi) return;

    var id;
    try {
      id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : null;
    } catch (e) { id = null; }
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    var secondi = 0, scritti = -1;

    function scrivi(ultimo) {
      if (secondi === scritti) return;
      scritti = secondi;
      var corpo = JSON.stringify([{
        id: id, user_id: chi, pannello: pannello,
        secondi: secondi, aggiornato_il: new Date().toISOString()
      }]);
      try {
        fetch(TAVOLA, {
          method: 'POST',
          keepalive: !!ultimo,          // l'ultimo colpo parte anche se la pagina si chiude
          headers: {
            'apikey': CHIAVE,
            'Authorization': 'Bearer ' + gettone,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: corpo
        }).catch(function () {});
      } catch (e) {}
    }

    scrivi(false);   // la riga nasce subito: l'apertura si conta anche se resta un attimo

    setInterval(function () {
      if (document.visibilityState === 'visible') {
        secondi++;
        if (secondi % OGNI === 0) scrivi(false);
      }
    }, 1000);

    window.addEventListener('pagehide', function () { scrivi(true); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') scrivi(true);
    });
  } catch (e) {}
})();
