// js/locandine-home.js
// Locandine informative negli spazi pubblicitari LIBERI della home nazionale.
//
// Regole:
// - Gira SOLO sulla home nazionale ("/" senza ?citta=): li' la pubblicita' a
//   pagamento e' disattivata per scelta, quindi i due spazi sono sempre liberi.
// - Se uno spazio e' stato riempito da un annuncio pagato, non lo tocca.
// - Cambia locandina ogni 7 secondi, con una dissolvenza.
// - Su telefono (sotto 1100px) ne mostra UNA sola, sotto il riquadro di ricerca.

(function () {
  'use strict';

  var LOC = [
    ['01-vetrina',     '/#registrati'],
    ['02-gestionale',  '/software-gestionale-imprese-edili'],
    ['03-computo',     '/software-gestionale-imprese-edili'],
    ['04-preventivi',  '/software-gestionale-imprese-edili'],
    ['05-diretto',     '/cerca-imprese'],
    ['06-guide',       '/costi-ristrutturazione'],
    ['07-bandi',       '/bandi'],
    ['08-subappalti',  '/subappalto'],
    ['09-offerte',     '/offerte-lavoro'],
    ['10-candidature', '/candidature-lavoro'],
    ['11-citta',       '/citta'],
    ['12-chi-cerchi',  '/cerca-artigiani'],
    ['13-blog',        '/blog'],
    ['14-recensioni',  '/cerca-imprese']
  ];

  var BASE        = '/img/locandine/loc-';
  var INTERVALLO  = 7000;    // millisecondi
  var TELEFONO    = '(max-width:1100px)';

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
    var sx = document.querySelector('a.pub-link[data-spazio-id="hero-sx"]');
    var dx = document.querySelector('a.pub-link[data-spazio-id="hero-dx"]');

    var slot = [];
    if (sx && libero(sx)) slot.push(prepara(sx, 0));
    if (dx && libero(dx)) slot.push(prepara(dx, 7));
    if (!slot.length) return;

    precarica();
    slot.forEach(disegna);

    setInterval(function () {
      slot.forEach(function (s) {
        s.i = (s.i + 1) % LOC.length;
        s.img.style.opacity = '0';
        setTimeout(function () { disegna(s); s.img.style.opacity = '1'; }, 450);
      });
    }, INTERVALLO);

    sistemaTelefono(sx, dx);
    window.addEventListener('resize', function () { sistemaTelefono(sx, dx); });
  }

  // uno spazio e' libero se non ha un annuncio pagato dentro
  function libero(a) {
    var img = a.querySelector('img');
    var src = img ? (img.getAttribute('src') || '') : '';
    return !img || /\/img\/hero-(sx|dx)\.svg$/.test(src);
  }

  function prepara(a, partenza) {
    a.innerHTML = '';
    a.style.setProperty('padding', '0', 'important');
    a.style.setProperty('border', 'none', 'important');
    a.style.setProperty('overflow', 'hidden', 'important');
    a.style.cursor = 'pointer';
    a.setAttribute('rel', 'noopener');

    var img = document.createElement('img');
    img.alt = 'TrovaImpresa';
    img.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block;'
                      + 'border-radius:inherit;opacity:1;transition:opacity .45s ease;';
    a.appendChild(img);

    a.addEventListener('click', function () {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'locandina_click', { locandina: a.getAttribute('data-locandina') || '' });
      }
    });

    return { a: a, img: img, i: partenza % LOC.length };
  }

  function disegna(s) {
    var v = LOC[s.i];
    s.img.src = BASE + v[0] + '.svg';
    s.a.setAttribute('href', v[1]);
    s.a.setAttribute('data-locandina', v[0]);
  }

  function precarica() {
    for (var i = 0; i < LOC.length; i++) {
      var im = new Image();
      im.src = BASE + LOC[i][0] + '.svg';
    }
  }

  // su telefono: una sola locandina, sotto il riquadro di ricerca
  function sistemaTelefono(sx, dx) {
    var tel  = window.matchMedia(TELEFONO).matches;
    var hero = document.querySelector('section.hero');

    if (sx) {
      sx.style.setProperty('display', 'flex', 'important');
      if (tel && hero && hero.contains(sx) && hero.lastElementChild !== sx) hero.appendChild(sx);
    }
    if (dx) {
      if (tel) dx.style.removeProperty('display');
      else dx.style.setProperty('display', 'flex', 'important');
    }
  }
})();
