/* 8 nov 2026: al computer i marchi li sposta ai lati js/marchi-lati.js
   (caricato da qui); questa fascia resta per il telefono.
   6 nov 2026 — FASCIA MARCHI nelle 106 pagine città (imprese-<città>).
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
    { id: 23030, nome: 'Comet',      logo: 'comet.webp',      w: 120, h: 60, cosa: 'Elettrodomestici e illuminazione', c: '#e30613' },
    { id: 23309, nome: 'Rowenta',    logo: 'rowenta.webp',    w: 168, h: 65, cosa: 'Piccoli elettrodomestici', c: '#8a9bb0' },
    { id: 9450,  nome: 'Moulinex',   logo: 'moulinex.webp',   w: 168, h: 93, cosa: 'Cucina e casa', c: '#d0021b' },
    { id: 10404, nome: 'Lampade.it', logo: 'lampade-it.webp', w: 168, h: 59, cosa: 'Lampade e luci', c: '#e5233b' },
    { id: 118433, nome: 'Vevor',     logo: 'vevor.webp',      w: 168, h: 60, cosa: 'Attrezzi e macchinari da cantiere', c: '#ff5023' }
  ];
  var AWIN_ME = '3137864';

  var CSS =
    '#ti-marchi-citta{background:url(/img/sfondo-negozi.svg) repeat,linear-gradient(160deg,#3a4350 0%,#232a33 100%) !important;' +
      'background-size:300px 300px,auto !important;border:0 !important;border-top:4px solid #ff8800 !important;border-bottom:4px solid #ff8800 !important;' +
      'border-radius:20px !important;padding:44px 28px !important;color:#fff}' +
    '#ti-marchi-citta.ti-marchi-fuori{box-sizing:border-box;max-width:1100px;margin:44px auto;font-family:inherit}' +
    '#ti-marchi-citta *{box-sizing:border-box}' +
    '#ti-marchi-citta h2,#ti-marchi-citta > p{border:0 !important;background:none !important;padding-left:0;padding-right:0}' +
    '#ti-marchi-citta h2::before,#ti-marchi-citta h2::after{display:none !important;content:none !important}' +
    '#ti-marchi-citta h2{margin:0 0 8px;line-height:1.2;color:#fff !important;text-align:center;font-size:32px;font-weight:900}' +
    '#ti-marchi-citta > p{margin:0;color:#ffb35c !important;text-align:center;font-size:18px;font-weight:600}' +
    '#ti-marchi-citta .tmc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:24px}' +
    '#ti-marchi-citta .tmc-card{display:flex;flex-direction:column;align-items:center;text-align:center;text-decoration:none;' +
      'color:#0a2a4d;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.45);transition:transform .2s,box-shadow .2s}' +
    '#ti-marchi-citta .tmc-card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(255,136,0,.35)}' +
    '#ti-marchi-citta .tmc-top{display:flex;align-items:center;justify-content:center;width:100%;padding:26px 18px;' +
      'background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);' +
      'background-size:28px 28px;border-bottom:6px solid var(--c,#ff8800)}' +
    '#ti-marchi-citta .tmc-logo{display:flex;align-items:center;justify-content:center;width:100%;height:110px;background:#fff;border-radius:16px;box-shadow:0 8px 22px rgba(0,0,0,.3)}' +
    '#ti-marchi-citta .tmc-logo img{width:78%;max-height:90px;height:auto;object-fit:contain}' +
    '#ti-marchi-citta .tmc-nome{font-weight:900;font-size:22px;margin:16px 12px 4px}' +
    '#ti-marchi-citta .tmc-cosa{font-size:16px;color:#3d4b5f;margin:0 12px 16px}' +
    '#ti-marchi-citta .tmc-btn{display:block;margin:auto 16px 18px;align-self:stretch;background:#ff8800;color:#fff;font-weight:900;font-size:17px;padding:13px 8px;border-radius:12px}' +
    '#ti-marchi-citta .tmc-card:hover .tmc-btn{background:#e06a00}' +
    '@media (max-width:760px){#ti-marchi-citta{padding:30px 14px !important}#ti-marchi-citta.ti-marchi-fuori{margin:30px 12px}#ti-marchi-citta h2{font-size:24px}#ti-marchi-citta > p{font-size:16px}' +
      '#ti-marchi-citta .tmc-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
      '#ti-marchi-citta .tmc-top{padding:14px 10px;border-bottom-width:4px}#ti-marchi-citta .tmc-logo{height:70px;border-radius:12px}' +
      '#ti-marchi-citta .tmc-cosa{display:none}#ti-marchi-citta .tmc-nome{font-size:17px;margin:10px 8px 8px}' +
      '#ti-marchi-citta .tmc-btn{font-size:13px;padding:11px 2px;margin:0 8px 12px;white-space:nowrap}' +
      /* 12 nov: con 5 marchi l'ultimo resta solo: prende tutta la riga */
      '#ti-marchi-citta .tmc-card:last-child:nth-child(odd){grid-column:1/-1;justify-self:center;width:calc(50% - 6px)}}';

  function avvio() {
    try {
      if (document.getElementById('ti-marchi-citta') || document.getElementById('ti-marchi')) return;
      /* 7 nov 2026: nelle 106 città sta prima di «Quanto costano i lavori»;
         in tutte le altre pagine pubbliche (la carica js/promo-pagine.js)
         sta prima del <footer>, dopo il riquadro del video. */
      var cittaPag = /^\/imprese-/.test(location.pathname);
      var prima = cittaPag ? document.getElementById('costi-lavori') : document.querySelector('footer');
      if (!prima) return;

      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);

      var carte = MARCHI.map(function (m) {
        return '<a class="tmc-card" href="https://www.awin1.com/cread.php?awinmid=' + m.id + '&amp;awinaffid=' + AWIN_ME +
          '" style="--c:' + m.c + '" target="_blank" rel="sponsored nofollow noopener">' +
          '<span class="tmc-top"><span class="tmc-logo"><img src="/img/marchi/' + m.logo + '" alt="' + m.nome + '" width="' + m.w +
          '" height="' + m.h + '" loading="lazy"></span></span>' +
          '<span class="tmc-nome">' + m.nome + '</span><span class="tmc-cosa">' + m.cosa + '</span>' +
          '<span class="tmc-btn">Vai al negozio →</span></a>';
      }).join('');

      var sez = document.createElement('div');
      sez.className = cittaPag ? 'section' : 'ti-marchi-fuori';
      sez.id = 'ti-marchi-citta';
      sez.innerHTML = '<h2>Materiali ed elettrodomestici dai migliori negozi</h2>' +
        '<p>Finiti i lavori, arreda e attrezza casa dai marchi che conosci.</p>' +
        '<div class="tmc-grid">' + carte + '</div>';
      prima.parentNode.insertBefore(sez, prima);
      /* 8 nov 2026: al computer i marchi vanno ai lati, separati (scelta di
         Alex). La fascia resta per il telefono e per chi non trova posto. */
      if (!document.querySelector('script[src*="marchi-lati"]')) {
        var ml = document.createElement('script');
        ml.src = '/js/marchi-lati.js?v=4';
        ml.defer = true;
        document.head.appendChild(ml);
      }
    } catch (e) { /* la pagina non si rompe mai per questa fascia */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
