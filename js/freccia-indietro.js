/* ============================================================
   freccia-indietro.js — TrovaImpresa (4 settembre 2026)

   SI ESCE SEMPRE ALLO STESSO MODO.
   Nel gestionale, dal 16 agosto 2026, da ogni finestra si torna
   indietro con UNA freccia grande in alto a sinistra con scritto
   «Indietro» (`.sh-back` in css/gestionale.css). Fuori dal
   gestionale invece c'era un po' di tutto: in certe pagine una
   scritta piccola «← Torna» in fondo, in certe sezioni niente.
   Alex il 4 set: «manca la freccia per tornare indietro come lo
   abbiamo messo nel gestionale».

   Questo file mette la STESSA freccia dappertutto, senza toccare
   il resto della pagina.

   COME SI USA
   Una riga sola, prima di </body>:
       <script src="/js/freccia-indietro.js"></script>

   Dove va a finire quando la premi:
   1. se la pagina ha le sezioni del pannello (.section#sec-...),
      la freccia sta in cima a ogni sezione che non e' la
      dashboard e riporta alla dashboard;
   2. se no, la freccia sta in cima al contenuto e torna alla
      pagina da cui sei arrivato; se non c'e' (link aperto da
      fuori, pagina aperta a mano) usa `data-indietro` del <body>,
      e se non c'e' nemmeno quello va alla home.

   NON la mette:
   - sulla dashboard (sei gia' a casa),
   - se nella pagina c'e' gia' una `.sh-back` (il gestionale ha
     la sua e non si tocca).
   Le vecchie scritte «← Torna» le TRASFORMA nella freccia nuova,
   cosi' non restano due modi di uscire dalla stessa schermata.
   ============================================================ */
(function () {
  'use strict';

  var ICONA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" '
            + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            + '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';

  /* Stessi numeri di .sh-back in css/gestionale.css: 46px di altezza,
     bordo 1.5px, testo 16px/700. Qui i colori sono scritti per esteso
     perche' fuori dal gestionale le variabili --bordo-forte non ci sono. */
  var CSS = [
    '.ti-back{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 18px 0 14px;',
    'background:#fff;border:1.5px solid #c9d4e3;border-radius:12px;color:#0a2a4d;',
    'font-family:inherit;font-size:16px;font-weight:700;line-height:1;cursor:pointer;',
    'text-decoration:none;transition:background .15s,border-color .15s,color .15s;',
    '-webkit-appearance:none;appearance:none}',
    '.ti-back:hover{background:#eaf2ff;border-color:#0066ff;color:#0047b3}',
    '.ti-back:focus-visible{outline:3px solid #0066ff;outline-offset:2px}',
    '.ti-back svg{width:22px;height:22px;flex:0 0 auto}',
    '.ti-back-riga{margin:0 0 18px}',
    '@media(max-width:900px){.ti-back{height:44px;padding:0 14px 0 11px;font-size:15px}}'
  ].join('');

  function mettiStile() {
    if (document.getElementById('ti-back-css')) return;
    var st = document.createElement('style');
    st.id = 'ti-back-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function bottone(alClic) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ti-back';
    b.title = 'Torna indietro';
    b.setAttribute('aria-label', 'Torna indietro');
    b.innerHTML = ICONA + '<span>Indietro</span>';
    b.addEventListener('click', alClic);
    return b;
  }

  function riga(btn) {
    var r = document.createElement('div');
    r.className = 'ti-back-riga';
    r.appendChild(btn);
    return r;
  }

  /* Dove si torna quando la pagina non e' un pannello a sezioni. */
  function indietroPagina() {
    var fallback = document.body.getAttribute('data-indietro') || '/';
    var stessoSito = false;
    try {
      stessoSito = !!document.referrer &&
        new URL(document.referrer).origin === window.location.origin &&
        new URL(document.referrer).pathname !== window.location.pathname;
    } catch (e) { stessoSito = false; }
    if (stessoSito && window.history.length > 1) window.history.back();
    else window.location.href = fallback;
  }

  /* Trova le vecchie uscite: «← Torna», «← Torna al pannello». */
  function vecchie(dentro) {
    var fuori = [];
    var candidati = dentro.querySelectorAll('span,a');
    for (var i = 0; i < candidati.length; i++) {
      var el = candidati[i];
      if (el.closest('.ti-back-riga') || el.classList.contains('ti-back')) continue;
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^[←<]\s*Torna\b/i.test(t)) fuori.push(el);
    }
    return fuori;
  }

  /* Il clic della vecchia uscita, se ne aveva uno suo, va conservato:
     «← Torna al pannello» sapeva gia' dove andare. */
  function clicDi(el, ripiego) {
    var codice = el && el.getAttribute && el.getAttribute('onclick');
    var href = el && el.tagName === 'A' ? el.getAttribute('href') : null;
    return function (ev) {
      if (codice) { try { new Function(codice).call(el, ev); return; } catch (e) {} }
      if (href && href.indexOf('javascript:') !== 0 && href !== '#') { window.location.href = href; return; }
      ripiego(ev);
    };
  }

  /* Le vecchie uscite diventano la freccia nuova, NELLO STESSO POSTO
     (dentro le sezioni del pannello stanno gia' in cima). */
  function trasformaSulPosto(dentro, ripiego) {
    var el = vecchie(dentro);
    for (var i = 0; i < el.length; i++) {
      var b = bottone(clicDi(el[i], ripiego));
      el[i].parentNode.replaceChild(b, el[i]);
    }
    return el.length;
  }

  function avvia() {
    if (document.querySelector('.sh-back')) return;   /* il gestionale ha gia' la sua */
    mettiStile();

    var sezioni = document.querySelectorAll('.section[id^="sec-"]');
    if (sezioni.length) {
      for (var i = 0; i < sezioni.length; i++) {
        var sez = sezioni[i];
        if (sez.id === 'sec-dashboard') continue;
        var torna = function () {
          if (typeof window.showSection === 'function') window.showSection('dashboard');
          else indietroPagina();
        };
        if (trasformaSulPosto(sez, torna) > 0) continue;
        if (sez.querySelector('.ti-back')) continue;
        sez.insertBefore(riga(bottone(torna)), sez.firstChild);
      }
      return;
    }

    /* Pagina normale: la freccia va IN CIMA, dove la si cerca. Le vecchie
       uscite in fondo si tolgono, se no si esce in due modi diversi. */
    var casa = document.querySelector('main, .container, .wrap, .contenuto') || document.body;
    if (casa.querySelector('.ti-back')) return;
    var vecchia = vecchie(casa)[0] || null;
    var alClic = vecchia ? clicDi(vecchia, indietroPagina) : indietroPagina;
    vecchie(casa).forEach(function (el) { el.parentNode.removeChild(el); });
    casa.insertBefore(riga(bottone(alClic)), casa.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
