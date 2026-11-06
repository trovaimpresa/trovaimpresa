/* 6 nov 2026 — FASCIA MARCHI nelle 106 pagine città (imprese-<città>).
   Stessa fascia della home (index.html, #ti-marchi): loghi dei negozi
   presi da Awin, per dare fiducia. Titolo onesto, NON «partner».
   Va subito PRIMA di «Quanto costano i lavori» (#costi-lavori), cioè dopo
   l'elenco delle imprese: scelta di Alex del 6 nov, «più spazio ai marchi»,
   ma le imprese restano per prime. Gira solo nelle pagine /imprese-…
   La carica js/pagine-citta.js (già presente in tutte le 106 pagine).
   Per aggiungere un marchio: una riga in MARCHI (id Awin = awinmid) e il
   logo in /img/marchi/. Tenere uguale l'elenco della home. */
(function () {
  'use strict';
  var MARCHI = [
    { id: 23030, nome: 'Comet',      logo: 'comet.webp',      w: 120, h: 60, cosa: 'Elettrodomestici e illuminazione' },
    { id: 23309, nome: 'Rowenta',    logo: 'rowenta.webp',    w: 168, h: 65, cosa: 'Piccoli elettrodomestici' },
    { id: 9450,  nome: 'Moulinex',   logo: 'moulinex.webp',   w: 168, h: 93, cosa: 'Cucina e casa' },
    { id: 10404, nome: 'Lampade.it', logo: 'lampade-it.webp', w: 168, h: 59, cosa: 'Lampade e luci' }
  ];
  var AWIN_ME = '3137864';

  var CSS =
    '#ti-marchi-citta .tmc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-top:18px}' +
    '#ti-marchi-citta .tmc-card{display:flex;flex-direction:column;align-items:center;text-align:center;text-decoration:none;' +
      'color:#0a2a4d;background:#fff;border:1.6px solid #0a2a4d;border-radius:16px;padding:20px 14px;' +
      'box-shadow:0 1px 3px rgba(10,42,77,.06);transition:transform .2s,box-shadow .2s}' +
    '#ti-marchi-citta .tmc-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(10,42,77,.12)}' +
    '#ti-marchi-citta .tmc-logo{display:flex;align-items:center;justify-content:center;width:100%;height:170px;margin-bottom:12px}' +
    '#ti-marchi-citta .tmc-logo img{width:85%;max-height:140px;height:auto;object-fit:contain}' +
    '#ti-marchi-citta .tmc-nome{font-weight:800;font-size:20px}' +
    '#ti-marchi-citta .tmc-cosa{font-size:16px;color:#555;margin-top:4px}' +
    '@media (max-width:760px){#ti-marchi-citta .tmc-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
      '#ti-marchi-citta .tmc-logo{height:90px}#ti-marchi-citta .tmc-logo img{width:100%}#ti-marchi-citta .tmc-cosa{display:none}#ti-marchi-citta .tmc-nome{font-size:16px}}';

  function avvio() {
    try {
      if (!/^\/imprese-/.test(location.pathname)) return;
      if (document.getElementById('ti-marchi-citta')) return;
      var prima = document.getElementById('costi-lavori');
      if (!prima) return;

      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);

      var carte = MARCHI.map(function (m) {
        return '<a class="tmc-card" href="https://www.awin1.com/cread.php?awinmid=' + m.id + '&amp;awinaffid=' + AWIN_ME +
          '" target="_blank" rel="sponsored nofollow noopener">' +
          '<span class="tmc-logo"><img src="/img/marchi/' + m.logo + '" alt="' + m.nome + '" width="' + m.w +
          '" height="' + m.h + '" loading="lazy"></span>' +
          '<span class="tmc-nome">' + m.nome + '</span><span class="tmc-cosa">' + m.cosa + '</span></a>';
      }).join('');

      var sez = document.createElement('div');
      sez.className = 'section';
      sez.id = 'ti-marchi-citta';
      sez.innerHTML = '<h2>Materiali ed elettrodomestici dai migliori negozi</h2>' +
        '<p>Finiti i lavori, arreda e attrezza casa dai marchi che conosci.</p>' +
        '<div class="tmc-grid">' + carte + '</div>';
      prima.parentNode.insertBefore(sez, prima);
    } catch (e) { /* la pagina non si rompe mai per questa fascia */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
