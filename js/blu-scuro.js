/* ============================================================
   blu-scuro.js — 10 ottobre 2026
   Toglie l'azzurro (#0066ff e parenti) da TUTTE le pagine e mette
   il blu scuro del logo (#0a2a4d). Legge i colori VERI che il browser
   usa (non il codice), quindi funziona anche sui colori scritti dentro
   le pagine. Non tocca il fiore e il resto arancione, ne' le scritte
   chiare sui fondi scuri.
   Si inserisce UNA volta sola in Netlify (Snippet injection, prima di </head>):
     <script src="/js/blu-scuro.js"></script>
   NON DEVE MAI ROMPERE LA PAGINA: tutto dentro try/catch.
   ============================================================ */
(function () {
  'use strict';
  try {
    if (window.__bluScuro) return;
    window.__bluScuro = true;

    var BLU = 'rgb(10, 42, 77)', BLU_SCURO = 'rgb(7, 32, 59)', GRIGIO = 'rgb(238, 241, 245)', BORDO = 'rgb(217, 222, 230)';
    // azzurri forti -> blu scuro
    var FORTI = {
      'rgb(0, 102, 255)': BLU, 'rgb(0, 82, 204)': BLU_SCURO, 'rgb(0, 71, 179)': BLU, 'rgb(0, 68, 221)': BLU,
      'rgb(29, 78, 216)': BLU, 'rgb(37, 99, 235)': BLU, 'rgb(30, 64, 175)': BLU, 'rgb(30, 58, 138)': BLU,
      'rgb(59, 130, 246)': BLU, 'rgb(0, 87, 217)': BLU, 'rgb(0, 78, 204)': BLU, 'rgb(0, 51, 153)': BLU
    };
    // azzurri chiarissimi (fondi e bordi delle scatoline) -> grigio freddo
    var CHIARI_SFONDO = {
      'rgb(234, 242, 255)': GRIGIO, 'rgb(232, 241, 255)': GRIGIO, 'rgb(219, 234, 254)': GRIGIO, 'rgb(238, 245, 255)': GRIGIO,
      'rgb(240, 245, 255)': GRIGIO, 'rgb(219, 232, 255)': GRIGIO, 'rgb(227, 238, 255)': GRIGIO, 'rgb(239, 246, 255)': GRIGIO,
      'rgb(224, 236, 255)': GRIGIO, 'rgb(229, 240, 255)': GRIGIO
    };
    var CHIARI_BORDO = {
      'rgb(191, 219, 254)': BORDO, 'rgb(207, 224, 255)': BORDO, 'rgb(214, 228, 255)': BORDO, 'rgb(188, 212, 255)': BORDO,
      'rgb(219, 232, 255)': BORDO, 'rgb(188, 211, 247)': BORDO, 'rgb(143, 181, 255)': BLU
    };
    var FORTI_RE = /rgb\(0, 102, 255\)|rgb\(0, 82, 204\)|rgb\(0, 71, 179\)|rgb\(0, 68, 221\)|rgb\(29, 78, 216\)|rgb\(37, 99, 235\)/g;

    var LATI = ['Top', 'Right', 'Bottom', 'Left'];

    function fix(el) {
      if (el.nodeType !== 1 || el.id === 'ti-bolla' && false) return;
      var tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IMG' || tag === 'HEAD' || tag === 'META' || tag === 'LINK') return;
      var cs = window.getComputedStyle(el), v, i, st = el.style;
      v = FORTI[cs.color]; if (v) st.setProperty('color', v, 'important');
      v = FORTI[cs.backgroundColor] || CHIARI_SFONDO[cs.backgroundColor];
      if (v) st.setProperty('background-color', v, 'important');
      var bi = cs.backgroundImage;
      if (bi && bi !== 'none' && FORTI_RE.test(bi)) { FORTI_RE.lastIndex = 0; st.setProperty('background-image', bi.replace(FORTI_RE, BLU), 'important'); }
      FORTI_RE.lastIndex = 0;
      for (i = 0; i < 4; i++) {
        var L = LATI[i];
        if (parseFloat(cs['border' + L + 'Width']) > 0) {
          var c = cs['border' + L + 'Color'];
          v = FORTI[c] || CHIARI_BORDO[c];
          if (v) st.setProperty('border-' + L.toLowerCase() + '-color', v, 'important');
        }
      }
      if (tag === 'svg' || el.ownerSVGElement) {
        v = FORTI[cs.fill]; if (v) st.setProperty('fill', v, 'important');
        v = FORTI[cs.stroke]; if (v) st.setProperty('stroke', v, 'important');
      }
    }

    function tutto(root) {
      var els = (root || document).querySelectorAll('*');
      for (var i = 0; i < els.length; i++) { try { fix(els[i]); } catch (e) {} }
    }

    var timer = null, coda = [];
    function programma(nodi) {
      for (var i = 0; i < nodi.length; i++) coda.push(nodi[i]);
      if (timer) return;
      timer = setTimeout(function () {
        timer = null; var c = coda; coda = [];
        for (var i = 0; i < c.length; i++) {
          var n = c[i]; if (n.nodeType !== 1 || !n.isConnected) continue;
          try { fix(n); tutto(n); } catch (e) {}
        }
      }, 120);
    }

    function avvia() {
      tutto(document);
      try {
        new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) if (muts[i].addedNodes && muts[i].addedNodes.length) programma(muts[i].addedNodes);
        }).observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
      setTimeout(function () { tutto(document); }, 1200);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
    else avvia();
    window.addEventListener('load', function () { tutto(document); });
  } catch (e) { /* mai rompere la pagina */ }
})();
