// js/spazi-laterali.js
// Crea e riempie gli spazi pubblicitari ai lati di una pagina.
//
// Perche' esiste: il listino di pubblicita.html vende ogni spazio come se
// stesse su una pagina precisa ("nelle pagine profilo impresa", "accanto alle
// offerte di lavoro"). Prima erano tutti sulla homepage. Questo file li mette
// dove il listino promette, senza dover riscrivere il layout di ogni pagina:
// i riquadri sono posizionati ai bordi della finestra, fuori dal contenuto.
//
// Uso, in fondo alla pagina prima di </body>:
//   <script src="/js/spazi-laterali.js" data-spazi="imprese-sx,imprese-dx"></script>
//
// La citta' viene letta, in ordine: da ?citta= nell'URL, poi da window.TI_CITTA
// (che la pagina puo' impostare, per esempio profilo-impresa con la citta'
// dell'impresa mostrata). Senza citta' i riquadri restano come "spazio libero".

(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  var script = document.currentScript;
  var lista = ((script && script.dataset.spazi) || '').split(',')
    .map(function (s) { return s.trim(); }).filter(Boolean);
  if (!lista.length) return;

  function citta() {
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
      'aspect-ratio:400/260;background:#fff;border:1px solid #e3e8ef;border-radius:12px;',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;',
      'text-align:center;text-decoration:none;overflow:hidden;padding:12px;z-index:40}',
      '.ti-spazio.sx{left:16px}.ti-spazio.dx{right:16px}',
      '.ti-spazio.n2{transform:translateY(calc(-50% + 190px))}',
      '.ti-spazio b{font-size:13px;font-weight:700;color:#0a2a4d}',
      '.ti-spazio small{font-size:11.5px;color:#8b98a9}',
      '.ti-spazio .ti-i{width:22px;height:22px;border-radius:6px;background:#f4f6f9;display:block}',
      // Sotto i 1400px il contenuto arriva vicino ai bordi: i riquadri
      // coprirebbero la pagina, quindi spariscono.
      '@media (max-width:1400px){.ti-spazio{display:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function crea() {
    stile();
    var q = citta() ? '?citta=' + encodeURIComponent(citta()) : '';
    lista.forEach(function (sid) {
      if (document.querySelector('a.pub-link[data-spazio-id="' + sid + '"]')) return;
      var a = document.createElement('a');
      a.className = 'ti-spazio pub-link ' + (sid.indexOf('-sx') !== -1 ? 'sx' : 'dx')
                  + (/-(sx|dx)-2$/.test(sid) ? ' n2' : '');
      a.setAttribute('data-spazio-id', sid);
      a.href = '/pubblicita' + q;
      a.innerHTML = '<span class="ti-i"></span><b>Il tuo annuncio qui</b>'
                  + '<small>' + (citta()
                      ? 'Visibile a chi cerca a ' + citta().charAt(0).toUpperCase() + citta().slice(1)
                      : 'Visibile a chi cerca nella tua zona') + '</small>';
      document.body.appendChild(a);
    });
  }

  async function riempi() {
    var c = citta();
    if (!c) return; // senza citta' non si sa quali annunci mostrare
    var client = window.sb || window.supabaseClient;
    if (!client) {
      if (!window.supabase || !window.supabase.createClient) return;
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    var oggi = new Date().toISOString().slice(0, 10);
    var res = await client.from('annunci_pubblicitari')
      .select('spazio_id, logo_url, link_url')
      .in('spazio_id', lista)
      .ilike('citta', c)
      .eq('stato', 'pagato')
      .gte('data_fine', oggi);
    if (res.error || !res.data) return;
    res.data.forEach(function (ann) {
      var a = document.querySelector('a.pub-link[data-spazio-id="' + ann.spazio_id + '"]');
      if (!a) return;
      a.href = ann.link_url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.padding = '0';
      a.style.border = 'none';
      a.innerHTML = '<img src="' + ann.logo_url + '" alt="Pubblicità" '
                  + 'style="width:100%;height:100%;object-fit:cover;display:block">';
    });
  }

  function avvia() {
    crea();
    // Alcune pagine (profilo-impresa) scoprono la citta' solo dopo aver
    // caricato i dati: se non c'e' ancora, riprovo per qualche secondo.
    if (citta()) { riempi(); return; }
    var tentativi = 0;
    var t = setInterval(function () {
      if (citta()) { clearInterval(t); aggiornaTesti(); riempi(); }
      else if (++tentativi > 20) clearInterval(t);   // ~5 secondi e mi fermo
    }, 250);
  }

  // Rinfresca "Visibile a chi cerca a X" quando la citta' arriva in ritardo
  function aggiornaTesti() {
    var c = citta(); if (!c) return;
    var testo = 'Visibile a chi cerca a ' + c.charAt(0).toUpperCase() + c.slice(1);
    lista.forEach(function (sid) {
      var a = document.querySelector('a.ti-spazio[data-spazio-id="' + sid + '"] small');
      if (a) a.textContent = testo;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }
})();
