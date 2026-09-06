// js/locandine-home.js
// Locandine di TrovaImpresa negli spazi liberi della home nazionale.
//
// Regole:
// - Gira SOLO sulla home nazionale ("/" senza ?citta=): li' la pubblicita' a
//   pagamento e' disattivata per scelta, quindi gli spazi sono sempre liberi.
// - Se uno spazio e' stato riempito da un annuncio pagato, non lo tocca.
// - Le locandine sono FERME: ognuna sta sempre al suo posto, non ruotano.
// - Tutte allineate sulla stessa colonna, a 20 px dal bordo dello schermo.
// - Si scende a scalare: ogni fascia e' l'85% di quella sopra.

(function () {
  'use strict';

  var BASE  = '/img/locandine/loc-';
  var BORDO = 20;                 // distanza dal bordo dello schermo
  var LARGA = 600;                // larghezza voluta per le due in alto
  var SCALINO = 0.85;             // ogni fascia e' l'85% di quella sopra
  var MINIMA = 140;               // sotto questa non si mostra: coprirebbe il testo
  var TELEFONO = '(max-width:1100px)';

  // Chi sta dove. Ogni posto ha la sua locandina, sempre la stessa.
  var IN_ALTO = [
    { spazio: 'hero-sx', file: '01-vetrina', link: '/#registrati' },
    { spazio: 'hero-dx', file: '05-diretto', link: '/cerca-imprese' }
  ];
  var IN_COLONNA = [
    { sez: '#categorie',        lato: 'sx', passo: 1, file: '02-gestionale',  link: '/software-gestionale-imprese-edili' },
    { sez: '#categorie',        lato: 'dx', passo: 1, file: '06-guide',       link: '/costi-ristrutturazione' },
    { sez: '#registrati',       lato: 'sx', passo: 2, file: '07-bandi',       link: '/bandi' },
    { sez: '#registrati',       lato: 'dx', passo: 2, file: '08-subappalti',  link: '/subappalto' },
    { sez: '.guide-costi-home', lato: 'sx', passo: 3, file: '13-blog',        link: '/blog' },
    { sez: '.guide-costi-home', lato: 'dx', passo: 3, file: '03-computo',     link: '/software-gestionale-imprese-edili' },
    { sez: '.why-section',      lato: 'sx', passo: 4, file: '09-offerte',     link: '/offerte-lavoro' },
    { sez: '.why-section',      lato: 'dx', passo: 4, file: '14-recensioni',  link: '/cerca-imprese' },
    { sez: '#ti-recensioni',    lato: 'sx', passo: 5, pila: 0, file: '11-citta',       link: '/citta' },
    { sez: '#ti-recensioni',    lato: 'sx', passo: 5, pila: 1, file: '04-preventivi',  link: '/software-gestionale-imprese-edili' },
    { sez: '#ti-recensioni',    lato: 'dx', passo: 5, pila: 0, file: '10-candidature', link: '/candidature-lavoro' },
    { sez: '#ti-recensioni',    lato: 'dx', passo: 5, pila: 1, file: '12-chi-cerchi',  link: '/cerca-artigiani' }
  ];

  // --- solo home nazionale ------------------------------------------------
  var percorso = window.location.pathname.replace(/index\.html$/, '');
  if (percorso !== '/') return;
  if ((new URLSearchParams(window.location.search).get('citta') || '').trim()) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(avvia, 80); });
  } else {
    setTimeout(avvia, 80);
  }

  // --- avvio ---------------------------------------------------------------
  function avvia() {
    var alto = [];
    IN_ALTO.forEach(function (v) {
      var a = document.querySelector('a.pub-link[data-spazio-id="' + v.spazio + '"]');
      if (a && libero(a)) { riempi(a, v); alto.push({ a: a, lato: v.spazio.indexOf('sx') > 0 ? 'sx' : 'dx' }); }
    });
    if (!alto.length) return;

    creaColonna();
    sistema(alto);
    window.addEventListener('resize', function () { sistema(alto); }, { passive: true });
  }

  // uno spazio e' libero se non ha dentro un annuncio pagato
  function libero(a) {
    var img = a.querySelector('img');
    var src = img ? (img.getAttribute('src') || '') : '';
    return !img || /\/img\/hero-(sx|dx)\.svg$/.test(src);
  }

  function riempi(a, v) {
    a.innerHTML = '';
    a.style.setProperty('padding', '0', 'important');
    a.style.setProperty('border', 'none', 'important');
    a.style.setProperty('overflow', 'hidden', 'important');
    a.style.cursor = 'pointer';
    a.setAttribute('href', v.link);
    a.setAttribute('rel', 'noopener');
    a.setAttribute('data-locandina', v.file);

    var img = document.createElement('img');
    img.alt = 'TrovaImpresa';
    img.src = BASE + v.file + '.svg';
    img.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block;border-radius:inherit';
    a.appendChild(img);

    a.addEventListener('click', function () {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'locandina_click', { locandina: v.file });
      }
    });
  }

  function creaColonna() {
    IN_COLONNA.forEach(function (v) {
      if (!document.querySelector(v.sez)) return;
      var a = document.createElement('a');
      a.className = 'ti-loc-col';
      a.setAttribute('data-sez', v.sez);
      a.setAttribute('data-lato', v.lato);
      a.setAttribute('data-passo', v.passo);
      a.setAttribute('data-pila', v.pila === undefined ? -1 : v.pila);
      a.setAttribute('href', v.link);
      a.setAttribute('rel', 'noopener');
      a.setAttribute('data-locandina', v.file);
      a.style.cssText = 'position:absolute;display:none;border-radius:12px;overflow:hidden;'
        + 'z-index:5;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.12)';
      var img = document.createElement('img');
      img.alt = 'TrovaImpresa';
      img.src = BASE + v.file + '.svg';
      img.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block';
      a.appendChild(img);
      a.addEventListener('click', function () {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'locandina_click', { locandina: v.file });
        }
      });
      document.body.appendChild(a);
    });
  }

  function larghezzaSchermo() {
    return document.documentElement.clientWidth || window.innerWidth;
  }

  // quanto spazio c'e' davvero ai lati: si guarda il contenuto piu' largo
  // dentro la sezione, non la scatola esterna (certe sezioni sono larghe
  // quanto tutta la pagina ma il testo dentro sta al centro)
  function spazioLibero(el) {
    var largo = el.getBoundingClientRect().width;
    var figli = el.children;
    if (figli.length) {
      largo = 0;
      for (var i = 0; i < figli.length; i++) {
        var w = figli[i].getBoundingClientRect().width;
        if (w > largo) largo = w;
      }
      if (!largo) largo = el.getBoundingClientRect().width;
    }
    return (larghezzaSchermo() - largo) / 2 - BORDO * 2;
  }

  function sistema(alto) {
    var telefono = window.matchMedia(TELEFONO).matches;

    // le due in alto: le piu' grandi, allineate al bordo
    var hero = document.querySelector('.hero-inner');
    var largaOk = hero ? Math.min(LARGA, Math.round(spazioLibero(hero))) : 0;
    alto.forEach(function (o) {
      if (telefono) { o.a.style.setProperty('display', 'flex', 'important'); return; }
      if (largaOk < MINIMA) { o.a.style.setProperty('display', 'none', 'important'); return; }
      o.a.style.setProperty('display', 'flex', 'important');
      o.a.style.setProperty('width', largaOk + 'px', 'important');
      o.a.style.setProperty('max-width', largaOk + 'px', 'important');
      o.a.style.setProperty(o.lato === 'sx' ? 'left' : 'right', BORDO + 'px', 'important');
    });

    // la colonna: ogni fascia piu' piccola di quella sopra (scala dolce),
    // e comunque mai piu' larga dello spazio libero di quella zona
    var l = document.querySelectorAll('.ti-loc-col');
    var precedente = largaOk;
    var perPasso = {};
    for (var p = 1; p <= 5; p++) {
      var spazio = 99999;
      for (var k = 0; k < l.length; k++) {
        if (parseInt(l[k].getAttribute('data-passo'), 10) !== p) continue;
        var sz = document.querySelector(l[k].getAttribute('data-sez'));
        if (sz) spazio = Math.min(spazio, Math.round(spazioLibero(sz)));
      }
      if (spazio === 99999) { perPasso[p] = 0; continue; }
      perPasso[p] = Math.max(0, Math.min(spazio, Math.round(precedente * SCALINO)));
      if (perPasso[p] >= MINIMA) precedente = perPasso[p];
    }

    for (var i = 0; i < l.length; i++) {
      var a = l[i];
      var sez = document.querySelector(a.getAttribute('data-sez'));
      var passo = parseInt(a.getAttribute('data-passo'), 10) || 1;
      var L = perPasso[passo] || 0;
      if (!sez || telefono || L < MINIMA) { a.style.display = 'none'; continue; }
      var H = Math.round(L * 260 / 400);
      var r = sez.getBoundingClientRect();
      var centro = r.top + window.scrollY + r.height / 2;   // ferma nella pagina
      var pila = parseInt(a.getAttribute('data-pila'), 10);
      if (pila === 0) centro -= (H / 2 + 7);      // quella sopra
      if (pila === 1) centro += (H / 2 + 7);      // quella sotto
      a.style.display = 'block';
      a.style.width = L + 'px';
      a.style.height = H + 'px';
      a.style.top = Math.round(centro - H / 2) + 'px';
      if (a.getAttribute('data-lato') === 'sx') { a.style.left = BORDO + 'px'; a.style.right = 'auto'; }
      else { a.style.right = BORDO + 'px'; a.style.left = 'auto'; }
    }
  }
})();
