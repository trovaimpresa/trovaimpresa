/* ============================================================
   conta-cliente.js — 7 settembre 2026

   COSA CONTA
   1) Le SCHEDE delle imprese aperte dai clienti (profilo-impresa.html):
      quante volte e quale impresa.
   2) Le RICERCHE fatte nelle pagine cerca-artigiani / cerca-imprese /
      cerca-professionisti: che cosa cercano, dove, e quanti ne hanno
      trovati (zero = qui ti manca l'impresa).

   PERCHE' E' SEPARATO DA conta-visita.js
   Quello conta chi ARRIVA sul sito (home e registrazioni). Questo conta
   che cosa FA il cliente una volta dentro. Sono due domande diverse e
   due tabelle diverse: `visite_sito` e `visite_clienti`.

   COSA NON FA
   - Nessun cookie, nessun IP, nessun nome, nessuna email.
   - L'id di sessione e' lo stesso numero a caso di conta-visita.js
     (sessionStorage): muore chiudendo la scheda del browser.
   Statistica di prima parte, non profilazione.

   NON DEVE MAI ROMPERE LA PAGINA: tutto dentro try/catch. Se Supabase
   non risponde, la pagina non se ne accorge nemmeno.
   ============================================================ */
(function () {
  'use strict';

  var URL_DB = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  // Chiave pubblica "anon", la stessa gia' in chiaro nelle altre pagine.
  // Su questa tabella puo' SOLO scrivere: non puo' rileggere niente.
  var CHIAVE = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

  try {
    var ua = (navigator && navigator.userAgent) || '';
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i.test(ua)) return;
    if (navigator.webdriver) return;
    if (document.visibilityState === 'prerender') return;

    function taglia(s, n) {
      if (s === null || s === undefined || s === '') return null;
      return String(s).trim().slice(0, n) || null;
    }

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

    function manda(riga) {
      try {
        riga.pagina   = taglia(location.pathname, 200);
        riga.sessione = taglia(sessione, 60);
        riga.telefono = largh !== null ? largh < 768 : null;
        fetch(URL_DB + '/rest/v1/visite_clienti', {
          method: 'POST',
          keepalive: true,
          headers: {
            'apikey': CHIAVE,
            'Authorization': 'Bearer ' + CHIAVE,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(riga)
        })['catch'](function () {});
      } catch (e) {}
    }

    /* Segna una cosa sola una volta sola per un tot di minuti: se uno
       ricarica la scheda o tocca tre filtri di fila non deve risultare
       come tre visite diverse. */
    function giaFatto(chiave, minuti) {
      try {
        var ora = Date.now();
        var vecchio = sessionStorage.getItem(chiave);
        if (vecchio && (ora - parseInt(vecchio, 10)) < minuti * 60000) return true;
        sessionStorage.setItem(chiave, String(ora));
      } catch (e) {}
      return false;
    }

    var percorso = (location.pathname || '').toLowerCase();

    /* ---------- 1) LA SCHEDA DI UN'IMPRESA ---------- */
    if (percorso.indexOf('profilo-impresa') !== -1) {
      var id = null;
      try { id = new URLSearchParams(location.search).get('id'); } catch (e) {}
      if (id && /^\d+$/.test(id)) {
        if (!giaFatto('ti_scheda_' + id, 30)) {
          manda({ tipo: 'scheda', impresa_id: parseInt(id, 10) });
        }
      }
      return;
    }

    /* ---------- 2) UNA RICERCA ---------- */
    if (percorso.indexOf('cerca-artigiani') === -1 &&
        percorso.indexOf('cerca-imprese') === -1 &&
        percorso.indexOf('cerca-professionisti') === -1) return;

    // CHE COSA sta cercando: la tendina dei mestieri, oppure la pastiglia
    // accesa dei professionisti. "tutti" vuol dire "non ha scelto niente".
    function cheCosa() {
      try {
        var sel = document.getElementById('mestiereSelect');
        if (sel && sel.value && sel.value !== 'tutti') return sel.value;
        var chip = document.querySelector('.chip[data-tipo].active');
        if (chip && chip.dataset && chip.dataset.tipo && chip.dataset.tipo !== 'tutti') return chip.dataset.tipo;
      } catch (e) {}
      return null;
    }

    // DOVE: prima la citta' scritta a mano, se non c'e' la regione scelta.
    function dove() {
      try {
        var c = document.getElementById('cittaInput');
        if (c && c.value && c.value.trim()) return c.value.trim();
        var r = document.getElementById('regioneSelect');
        if (r && r.value) return r.value;
      } catch (e) {}
      return null;
    }

    // QUANTI NE HA TROVATI: lo dice gia' la riga sopra i risultati
    // ("Trovati 12 artigiani" / "Nessun risultato"). Se quella riga non
    // c'e', si contano le schede disegnate.
    function quanti() {
      try {
        var rc = document.getElementById('risultatiCount');
        if (rc) {
          var t = (rc.textContent || '').toLowerCase();
          if (t.indexOf('ricerca in corso') !== -1 || t.indexOf('scegli una citt') !== -1) return null;
          if (t.indexOf('nessun') !== -1) return 0;
          var m = t.match(/(\d+)/);
          if (m) return parseInt(m[1], 10);
        }
        var box = document.getElementById('risultati');
        if (box) {
          if ((box.textContent || '').toLowerCase().indexOf('nessun') !== -1) return 0;
          return box.querySelectorAll('.card').length;
        }
      } catch (e) {}
      return null;
    }

    function segnaRicerca() {
      try {
        var c = cheCosa();
        var d = dove();
        // Senza un dove non e' una ricerca: la pagina mostra
        // "Inserisci una citta' o regione" e non cerca niente.
        if (!d) return;
        var n = quanti();
        if (n === null) return;
        if (giaFatto('ti_ric_' + (c || '') + '|' + d, 10)) return;
        manda({ tipo: 'ricerca', cosa: taglia(c, 80), dove: taglia(d, 80), risultati: n });
      } catch (e) {}
    }

    /* La funzione cerca() della pagina non si tocca: le si mette intorno
       un guscio che, finita lei, guarda che cosa e' comparso a schermo.
       Cosi' qui non c'e' niente da tenere allineato con la ricerca. */
    var tentativi = 0;
    function aggancia() {
      try {
        if (typeof window.cerca === 'function' && !window.cerca._contata) {
          var vera = window.cerca;
          var guscio = function () {
            var esito = vera.apply(this, arguments);
            try {
              if (esito && typeof esito.then === 'function') {
                esito.then(function () { setTimeout(segnaRicerca, 300); })['catch'](function () {});
              } else {
                setTimeout(segnaRicerca, 300);
              }
            } catch (e) {}
            return esito;
          };
          guscio._contata = true;
          window.cerca = guscio;
          return;
        }
      } catch (e) {}
      if (++tentativi < 20) setTimeout(aggancia, 250);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', aggancia);
    } else {
      aggancia();
    }

  } catch (e) { /* il conteggio non deve mai rompere la pagina */ }
})();
