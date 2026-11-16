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
  var BORDO_MIN = 6;              // piu' vicino di cosi' al bordo schermo non si va
  var DISTANZA_MIN = 8;           // distanza minima dal riquadro della pagina
  var SCALINO = 0.85;            // ogni fascia e' l'85% di quella sopra
  var MINIMA = 140;               // sotto questa non si mostra: coprirebbe il testo
  var TELEFONO = '(max-width:1100px)';

  // Chi sta dove. Ogni posto ha la sua locandina, sempre la stessa.
  // 15 nov 2026 (Alex): «i miei spazi erano solo dimostrativi»: al posto delle
  // sue locandine ci vanno i marchi famosi (Awin) e, dove avanzano, gli annunci
  // Google. I marchi non stanno piu' sparsi ai lati: js/marchi-lati.js sulla
  // home nazionale si ferma e lascia fare a questo file.
  var AWIN_ME = '3137864';
  var ADS_CLIENT = 'ca-pub-3621975687116775', ADS_SLOT = '7886156385';
  var M = {
    vevor:   { id: 118433, nome: 'Vevor',      logo: 'vevor.webp',      cosa: 'Attrezzi e macchinari da cantiere', c: '#ff5023' },
    comet:   { id: 23030,  nome: 'Comet',      logo: 'comet.webp',      cosa: 'Elettrodomestici e illuminazione',  c: '#e30613' },
    rowenta: { id: 23309,  nome: 'Rowenta',    logo: 'rowenta.webp',    cosa: 'Piccoli elettrodomestici',          c: '#8a9bb0' },
    moulinex:{ id: 9450,   nome: 'Moulinex',   logo: 'moulinex.webp',   cosa: 'Cucina e casa',                     c: '#d0021b' },
    lampade: { id: 10404,  nome: 'Lampade.it', logo: 'lampade-it.webp', cosa: 'Lampade e luci',                    c: '#e5233b' },
    trotec:  { id: 115365, nome: 'Trotec',     logo: 'trotec.webp',     cosa: 'Deumidificatori, misuratori e utensili', c: '#ffe200' },
    vonroc:  { id: 126387, nome: 'Vonroc',     logo: 'vonroc.webp',     cosa: 'Elettroutensili per casa e giardino', c: '#35beae' },
    kasanova:{ id: 17198,  nome: 'Kasanova',   logo: 'kasanova.webp',   cosa: 'Casalinghi e arredo', c: '#ff00a4' }
  };

  // Chi sta dove. marchio = carta del negozio, google = annuncio Google.
  // In alto, negli spazi piu' grandi, i marchi piu' vicini all'edilizia (Alex, 15 nov).
  var IN_ALTO = [
    { spazio: 'hero-sx', marchio: 'vevor' },
    { spazio: 'hero-dx', marchio: 'trotec' }
  ];
  var IN_COLONNA = [
    // 15 nov 2026 (Alex): «devono essere 14». Sulla home nazionale #categorie non
    // c'e', quindi la coppia del passo 1 si aggancia a «Cerchi idee per casa?».
    { sez: '#le-idee',          lato: 'sx', passo: 1, marchio: 'vonroc' },
    { sez: '#le-idee',          lato: 'dx', passo: 1, marchio: 'lampade' },
    { sez: '#registrati',       lato: 'sx', passo: 2, marchio: 'comet' },
    { sez: '#registrati',       lato: 'dx', passo: 2, marchio: 'rowenta' },
    { sez: '.guide-costi-home', lato: 'sx', passo: 3, marchio: 'moulinex' },
    { sez: '.guide-costi-home', lato: 'dx', passo: 3, marchio: 'kasanova' }, // 16 nov: accanto a Moulinex
    { sez: '.why-section',      lato: 'sx', passo: 4, google: true },
    { sez: '.why-section',      lato: 'dx', passo: 4, google: true }
    // 16 nov 2026 (Alex, «la pubblicita di google e tutta uguale»): tolti i 4 spazi
    // Google accanto alle recensioni. Con 6 spazi uno sotto l'altro AdSense
    // mostrava lo stesso annuncio ovunque. Restano i 2 qui sopra + quello al centro.
  ];

  var CSS = '.tlm{display:flex;flex-direction:column;width:100%;height:100%;background:#fff;border:2px solid #ff8800;' +
      'border-radius:14px;overflow:hidden;text-decoration:none;color:#0a2a4d;box-sizing:border-box;font-family:inherit;line-height:1.15}' +
    '.tlm *{box-sizing:border-box}' +
    '.tlm-sopra{background:#ff8800;color:#fff;font-weight:800;font-size:clamp(10px,3.4cqw,14px);letter-spacing:.06em;text-transform:uppercase;padding:5px 8px;text-align:center}' +
    '.tlm-mid{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6% 8%;' +
      'background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);' +
      'background-size:28px 28px;border-bottom:5px solid var(--c,#ff8800)}' +
    '.tlm-logo{width:100%;height:100%;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
    '.tlm-logo img{max-width:85%;max-height:80%;object-fit:contain;display:block}' +
    '.tlm-giu{display:flex;align-items:center;gap:10px;padding:8px 12px}' +
    '.tlm-nome{flex:1;min-width:0;text-align:left;font-weight:900;font-size:clamp(14px,5cqw,24px)}' +
    '.tlm-nome small{display:block;font-weight:500;font-size:clamp(11px,3.2cqw,15px);color:#3d4b5f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.tlm-btn{background:#ff8800;color:#fff;font-weight:900;font-size:clamp(12px,3.8cqw,17px);padding:9px 12px;border-radius:10px;white-space:nowrap}' +
    '.tlm:hover .tlm-btn{background:#e06a00}' +
    '.tlm-box{container-type:inline-size}a.tlm-box,a.tlm-box *{text-decoration:none !important}' +
    '.tlg{width:100%;height:100%;display:flex;flex-direction:column;background:transparent}' +
    '.tlg small{display:block;font:600 11px/1.4 system-ui,sans-serif;letter-spacing:.06em;color:#8a94a3;text-transform:uppercase;text-align:center;margin-bottom:4px}' +
    '.tlg.vuoto{visibility:hidden}';

  function cartaMarchio(m) {
    return '<span class="tlm" style="--c:' + m.c + '"><span class="tlm-sopra">Negozio consigliato</span>' +
      '<span class="tlm-mid"><span class="tlm-logo"><img src="/img/marchi/' + m.logo + '" alt="' + m.nome + '"></span></span>' +
      '<span class="tlm-giu"><span class="tlm-nome">' + m.nome + '<small>' + m.cosa + '</small></span>' +
      '<span class="tlm-btn">Vai al negozio →</span></span></span>';
  }
  function linkMarchio(m) { return 'https://www.awin1.com/cread.php?awinmid=' + m.id + '&awinaffid=' + AWIN_ME; }

  // l'annuncio Google parte solo quando lo spazio si vede ed ha la sua misura
  function accendiGoogle(box) {
    if (box.getAttribute('data-acceso') === '1') return;
    var r = box.getBoundingClientRect();
    if (r.width < 120 || r.height < 80) return;
    box.setAttribute('data-acceso', '1');
    var w = Math.floor(r.width), h = Math.floor(r.height) - 20;
    box.innerHTML = '<div class="tlg"><small>Pubblicit&agrave;</small><ins class="adsbygoogle" style="display:inline-block;width:' + w +
      'px;height:' + h + 'px" data-ad-client="' + ADS_CLIENT + '" data-ad-slot="' + ADS_SLOT + '"></ins></div>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    // se Google non ha niente da mostrare, lo spazio resta vuoto (niente scritta da sola)
    var ins = box.querySelector('ins');
    var guarda = setInterval(function () {
      var st = ins.getAttribute('data-ad-status');
      if (st === 'unfilled') { box.querySelector('.tlg').classList.add('vuoto'); clearInterval(guarda); }
      if (st === 'filled') clearInterval(guarda);
    }, 1000);
    setTimeout(function () { clearInterval(guarda); }, 30000);
  }

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
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
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
    a.style.setProperty('background', 'transparent', 'important');
    a.classList.add('tlm-box');
    if (v.marchio) {
      var m = M[v.marchio];
      a.setAttribute('href', linkMarchio(m));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'sponsored nofollow noopener');
      a.setAttribute('data-marchio', v.marchio);
      a.innerHTML = cartaMarchio(m);
    } else {
      a.removeAttribute('href');
      a.setAttribute('data-google', '1');
      a.style.cursor = 'default';
    }
  }

  function creaColonna() {
    IN_COLONNA.forEach(function (v) {
      if (!document.querySelector(v.sez)) return;
      var a = document.createElement(v.marchio ? 'a' : 'div');
      a.className = 'ti-loc-col tlm-box';
      a.setAttribute('data-sez', v.sez);
      a.setAttribute('data-lato', v.lato);
      a.setAttribute('data-passo', v.passo);
      a.setAttribute('data-pila', v.pila === undefined ? -1 : v.pila);
      a.style.cssText = 'position:absolute;display:none;border-radius:14px;overflow:hidden;z-index:5';
      if (v.marchio) {
        var m = M[v.marchio];
        a.setAttribute('href', linkMarchio(m));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'sponsored nofollow noopener');
        a.setAttribute('data-marchio', v.marchio);
        a.style.boxShadow = '0 2px 12px rgba(0,0,0,.12)';
        a.innerHTML = cartaMarchio(m);
      } else {
        a.setAttribute('data-google', '1');
      }
      document.body.appendChild(a);
    });
  }

  function larghezzaSchermo() {
    return document.documentElement.clientWidth || window.innerWidth;
  }

  // quanto spazio c'e' davvero ai lati: si guarda il contenuto piu' largo
  // dentro la sezione, non la scatola esterna (certe sezioni sono larghe
  // quanto tutta la pagina ma il testo dentro sta al centro)
  // larghezza VERA del riquadro visibile: il contenuto piu' largo + il
  // margine interno e il bordo della sezione (prima si contava solo il
  // contenuto, e i cartelli finivano sopra il bordo del riquadro)
  function larghezzaRiquadro(el) {
    var largo = el.getBoundingClientRect().width;
    var figli = el.children;
    if (figli.length) {
      largo = 0;
      for (var i = 0; i < figli.length; i++) {
        var w = figli[i].getBoundingClientRect().width;
        if (w > largo) largo = w;
      }
      if (!largo) return el.getBoundingClientRect().width;
      var cs = window.getComputedStyle(el);
      largo += (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
             + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
    }
    return largo;
  }

  // spazio libero per lato, togliendo un margine (come prima: 2 x BORDO)
  function spazioLibero(el, margine) {
    return (larghezzaSchermo() - larghezzaRiquadro(el)) / 2 - (margine === undefined ? BORDO * 2 : margine);
  }

  function sistema(alto) {
    var telefono = window.matchMedia(TELEFONO).matches;

    // le due in alto: le piu' grandi, allineate al bordo
    var hero = document.querySelector('.hero-inner');
    var largaOk = hero ? Math.min(LARGA, Math.round(spazioLibero(hero))) : 0;
    alto.forEach(function (o) {
      // sul telefono i marchi stanno nella fascia in mezzo alla pagina: in cima,
      // prima del titolo, la prima cosa vista sarebbe la pubblicita'
      if (telefono) { o.a.style.setProperty('display', 'none', 'important'); return; }
      if (largaOk < MINIMA) { o.a.style.setProperty('display', 'none', 'important'); return; }
      o.a.style.setProperty('display', 'flex', 'important');
      o.a.style.setProperty('width', largaOk + 'px', 'important');
      o.a.style.setProperty('max-width', largaOk + 'px', 'important');
      o.a.style.setProperty(o.lato === 'sx' ? 'left' : 'right', BORDO + 'px', 'important');
    });

    // la colonna: ogni fascia piu' piccola di quella sopra (scala dolce),
    // e comunque mai piu' larga dello spazio libero di quella zona
    var l = document.querySelectorAll('.ti-loc-col');
    var bordoComune = BORDO;
    var precedente = largaOk;
    var perPasso = {};
    for (var p = 1; p <= 5; p++) {
      var spazio = 99999;
      for (var k = 0; k < l.length; k++) {
        if (parseInt(l[k].getAttribute('data-passo'), 10) !== p) continue;
        var sz = document.querySelector(l[k].getAttribute('data-sez'));
        // la misura venduta non si restringe: si toglie solo il margine minimo
        if (sz) spazio = Math.min(spazio, Math.round(spazioLibero(sz, BORDO_MIN + DISTANZA_MIN)));
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
      // distanza dal bordo dello schermo: 20 px se c'e' posto, altrimenti si
      // avvicina (min 6 px) cosi' la misura resta quella e non tocca il riquadro
      var lib = (larghezzaSchermo() - larghezzaRiquadro(sez)) / 2;
      var bordo = Math.max(BORDO_MIN, Math.min(BORDO, Math.floor(lib - L - DISTANZA_MIN)));
      if (bordo < bordoComune) bordoComune = bordo;
    }

    // TUTTE alla stessa distanza dal bordo (la piu' stretta che serve), cosi'
    // stanno sulla stessa colonna: la misura venduta non cambia mai
    for (var j = 0; j < l.length; j++) {
      var c = l[j];
      if (c.style.display === 'none') continue;
      if (c.getAttribute('data-lato') === 'sx') { c.style.left = bordoComune + 'px'; c.style.right = 'auto'; }
      else { c.style.right = bordoComune + 'px'; c.style.left = 'auto'; }
    }
    if (!telefono && largaOk >= MINIMA) {
      alto.forEach(function (o) {
        o.a.style.setProperty(o.lato === 'sx' ? 'left' : 'right', bordoComune + 'px', 'important');
      });
    }

    // i marchi sono ai lati? allora la fascia dei marchi in mezzo alla pagina
    // si nasconde (stessa regola di js/marchi-lati.js: tutti o nessuno)
    var marchi = document.querySelectorAll('[data-marchio]'), tutti = marchi.length > 0;
    for (var q = 0; q < marchi.length; q++) {
      var rr = marchi[q].getBoundingClientRect();
      if (!rr.width || !rr.height) { tutti = false; break; }
    }
    // se non ci stanno tutti ai lati, i marchi restano tutti nella fascia: niente doppioni
    if (!tutti) for (var z = 0; z < marchi.length; z++) marchi[z].style.setProperty('display', 'none', 'important');
    var prima = document.documentElement.classList.contains('ti-marchi-lati');
    document.documentElement.classList.toggle('ti-marchi-lati', tutti && !telefono);
    // nascondere o mostrare la fascia cambia l'altezza della pagina: si rimisura
    if (prima !== document.documentElement.classList.contains('ti-marchi-lati')) {
      setTimeout(function () { sistema(alto); }, 0);
      return;
    }

    var gg = document.querySelectorAll('[data-google="1"]');
    for (var g = 0; g < gg.length; g++) accendiGoogle(gg[g]);
  }
})();
