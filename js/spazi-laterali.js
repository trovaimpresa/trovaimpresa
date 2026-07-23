// js/spazi-laterali.js
// Mostra gli spazi pubblicitari ai lati di una pagina — SOLO se lo spazio è
// stato effettivamente comprato per la città corrente.
//
// Regola: niente segnaposti "Il tuo annuncio qui". Il riquadro compare solo
// quando esiste un annuncio con stato = 'pagato' per quello spazio_id e quella
// città (non scaduto). Se non c'è nulla comprato, non appare nessun riquadro.
//
// Uso, in fondo alla pagina prima di </body>:
//   <script src="/js/spazi-laterali.js" data-spazi="imprese-sx-1,imprese-dx-1"></script>
//
// La città viene letta, in ordine: da ?citta= nell'URL, poi da window.TI_CITTA
// (che la pagina può impostare, es. profilo-impresa con la città dell'impresa).
// La pubblicità è per città: chi compra a Roma si vede solo su Roma.

(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  var script = document.currentScript;
  var lista = ((script && script.dataset.spazi) || '').split(',')
    .map(function (s) { return s.trim(); }).filter(Boolean);
  if (!lista.length) return;

  var cittaFissa = (script && script.dataset.citta || '').trim();

  function citta() {
    if (cittaFissa) return cittaFissa;
    var p = new URLSearchParams(window.location.search).get('citta');
    if (p && p.trim()) return p.trim();
    if (window.TI_CITTA && String(window.TI_CITTA).trim()) return String(window.TI_CITTA).trim();
    return '';
  }

  function stile() {
    if (document.getElementById('ti-spazi-css')) return;
    var s = document.createElement('style');
    s.id = 'ti-spazi-css';
    s.textContent = [
      '.ti-spazio{position:fixed;top:50%;transform:translateY(-50%);width:260px;',
      'aspect-ratio:400/260;background:#fff;border:none;border-radius:12px;',
      'overflow:hidden;text-decoration:none;z-index:40}',
      '.ti-spazio.sx{left:16px}.ti-spazio.dx{right:16px}',
      '.ti-spazio.n2{transform:translateY(calc(-50% + 190px))}',
      // Sotto i 1400px il contenuto arriva vicino ai bordi: i riquadri
      // coprirebbero la pagina, quindi spariscono.
      '@media (max-width:1400px){.ti-spazio{display:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function classiSlot(sid) {
    return 'ti-spazio pub-link ' + (sid.indexOf('-sx') !== -1 ? 'sx' : 'dx')
         + (/-(sx|dx)-2$/.test(sid) ? ' n2' : '');
  }

  function rimuoviBox(sid) {
    var el = document.querySelector('a.pub-link[data-spazio-id="' + sid + '"]');
    if (el) el.parentNode.removeChild(el);
  }

  function mostraAd(sid, ann) {
    var a = document.querySelector('a.pub-link[data-spazio-id="' + sid + '"]');
    if (!a) {
      a = document.createElement('a');
      a.setAttribute('data-spazio-id', sid);
      document.body.appendChild(a);
    }
    a.className = classiSlot(sid);
    a.href = ann.link_url || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = '<img src="' + ann.logo_url + '" alt="Pubblicità" '
                + 'style="width:100%;height:100%;object-fit:cover;display:block">';
  }

  async function riempi() {
    var c = citta();
    if (!c) { lista.forEach(rimuoviBox); return; }
    var oggi = new Date().toISOString().slice(0, 10);
    var url = SUPABASE_URL + '/rest/v1/annunci_pubblicitari'
            + '?select=spazio_id,logo_url,link_url'
            + '&spazio_id=in.(' + lista.join(',') + ')'
            + '&citta=ilike.' + encodeURIComponent(c)
            + '&stato=eq.pagato'
            + '&data_fine=gte.' + oggi;
    var trovati = {};
    try {
      var r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY } });
      if (r.ok) {
        var dati = await r.json();
        dati.forEach(function (ann) { if (ann.logo_url) trovati[ann.spazio_id] = ann; });
      }
    } catch (e) { /* rete assente: non mostro nulla */ }
    stile();
    lista.forEach(function (sid) {
      if (trovati[sid]) mostraAd(sid, trovati[sid]);
      else rimuoviBox(sid);
    });
  }

  var ultimaCitta = null;
  function controlla() {
    var c = citta();
    if (c === ultimaCitta) return;
    ultimaCitta = c;
    riempi();
  }

  function avvia() {
    controlla();
    // La città può arrivare dopo (profilo dopo il fetch, filtri dopo l'input):
    // la tengo d'occhio e ricarico se cambia.
    setInterval(controlla, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }
})();
