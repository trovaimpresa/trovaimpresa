// js/spazi-citta.js
// Gli spazi pubblicitari IN VENDITA nelle pagine citta' (index.html?citta=X).
//
// Riprende esattamente posizioni e misure del lavoro fatto il 6 set 2026 sulla
// home nazionale (js/locandine-home.js): stesse sezioni, bordo 20 px, ogni
// fascia l'85% di quella sopra, minimo 140 px, spente sotto 1100 px.
//
// Differenza: qui NON ci sono le locandine di TrovaImpresa. Ogni posto e' uno
// spazio da vendere. Se qualcuno l'ha pagato per questa citta' si vede il suo
// banner; se no si vede il segnaposto "questo spazio puo' essere tuo", che
// porta al modulo di acquisto gia' compilato con spazio e citta'.

(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

  // Le misure sono quelle del listino (pubblicita.html, MISURE_FASCIA):
  // quello che il cliente compra e' quello che vede.
  var MISURE = { 'hero': 340, 'imprese': 270, 'inserzioni': 210, 'profilo': 170 };
  function misuraDi(sid) { return MISURE[String(sid).split('-')[0]] || 260; }

  var BORDO   = 20;                    // distanza dal bordo dello schermo
  var LARGA   = 600;                   // larghezza voluta per le due in alto
  var SCALINO = 0.85;                  // ogni fascia e' l'85% di quella sopra
  var MINIMA  = 140;                   // sotto questa non si mostra
  var TELEFONO = '(max-width:1100px)';

  // I 12 posti in colonna: stessi ancoraggi della nazionale.
  var POSTI = [
    { sez: '#categorie',     lato: 'sx', passo: 1, spazio: 'imprese-sx' },
    { sez: '#categorie',     lato: 'dx', passo: 1, spazio: 'imprese-dx' },
    { sez: '#registrati',    lato: 'sx', passo: 2, spazio: 'inserzioni-sx' },
    { sez: '#registrati',    lato: 'dx', passo: 2, spazio: 'inserzioni-dx' },
    { sez: '#ti-recensioni', lato: 'sx', passo: 5, pila: 0, spazio: 'profilo-sx-1' },
    { sez: '#ti-recensioni', lato: 'sx', passo: 5, pila: 1, spazio: 'profilo-sx-2' },
    { sez: '#ti-recensioni', lato: 'dx', passo: 5, pila: 0, spazio: 'profilo-dx-1' },
    { sez: '#ti-recensioni', lato: 'dx', passo: 5, pila: 1, spazio: 'profilo-dx-2' }
  ];

  // --- solo pagina citta: serve ?citta= -----------------------------------
  var percorso = window.location.pathname.replace(/index\.html$/, '');
  if (percorso !== '/') return;
  var CITTA = (new URLSearchParams(window.location.search).get('citta') || '').trim();
  if (!CITTA) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(avvia, 80); });
  } else {
    setTimeout(avvia, 80);
  }

  var IN_ALTO = ['hero-sx', 'hero-dx'];


  var VENDUTI_ALTO = {};

  async function avvia() {
    var venduti = await cercaVenduti();
    IN_ALTO.forEach(function (id) { if (venduti[id]) VENDUTI_ALTO[id] = venduti[id]; });
    creaColonna(venduti);
    sistema();
    window.addEventListener('resize', sistema);
    window.addEventListener('load', sistema);
    setTimeout(sistema, 600);
    setTimeout(sistema, 1600);
  }

  // --- chi ha pagato questi spazi in questa citta' -------------------------
  async function cercaVenduti() {
    var oggi = new Date().toISOString().slice(0, 10);
    var ids = POSTI.map(function (p) { return p.spazio; })
                   .concat(IN_ALTO).join(',');
    var url = SUPABASE_URL + '/rest/v1/annunci_pubblicitari'
            + '?select=spazio_id,logo_url,link_url,impresa_id'
            + '&spazio_id=in.(' + ids + ')'
            + '&citta=ilike.' + encodeURIComponent(CITTA)
            + '&stato=eq.pagato'
            + '&data_fine=gte.' + oggi;
    var trovati = {};
    try {
      var r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY } });
      if (r.ok) {
        (await r.json()).forEach(function (a) { if (a.logo_url) trovati[a.spazio_id] = a; });
      }
    } catch (e) { /* niente rete: restano tutti segnaposto */ }
    return trovati;
  }

  // ------------------------------------------------------------------ adatta
  // Adatta la locandina o il logo del cliente allo spazio che gli diamo.
  // Molti caricano un'immagine con il bordo vuoto intorno (il ritaglio guidato
  // la fa "entrare tutta"): qui quel bordo lo togliamo e il disegno riempie il
  // riquadro. Se per qualsiasi motivo non si riesce, resta l'immagine com'e'.
  function adattaAlloSpazio(im, url) {
    var prova = new Image();
    prova.crossOrigin = 'anonymous';
    prova.onload = function () {
      try {
        var W = prova.naturalWidth, H = prova.naturalHeight;
        if (!W || !H) return;
        var c = document.createElement('canvas');
        c.width = W; c.height = H;
        var x = c.getContext('2d');
        x.drawImage(prova, 0, 0);
        var d = x.getImageData(0, 0, W, H).data;

        // il colore del bordo lo prendiamo dall'angolo in alto a sinistra
        var r0 = d[0], g0 = d[1], b0 = d[2], T = 12;
        function uguale(i) {
          return Math.abs(d[i] - r0) < T && Math.abs(d[i+1] - g0) < T && Math.abs(d[i+2] - b0) < T;
        }
        function colonnaVuota(cx) {
          for (var y = 0; y < H; y += 2) if (!uguale((y * W + cx) * 4)) return false;
          return true;
        }
        function rigaVuota(cy) {
          for (var xx = 0; xx < W; xx += 2) if (!uguale((cy * W + xx) * 4)) return false;
          return true;
        }
        var sx = 0;      while (sx < W - 1 && colonnaVuota(sx)) sx++;
        var dx = W - 1;  while (dx > sx && colonnaVuota(dx)) dx--;
        var su = 0;      while (su < H - 1 && rigaVuota(su)) su++;
        var giu = H - 1; while (giu > su && rigaVuota(giu)) giu--;

        var lc = dx - sx + 1, hc = giu - su + 1;
        if (lc < W * 0.2 || hc < H * 0.2) return;          // immagine quasi tutta vuota: non tocco
        if (lc > W * 0.97 && hc > H * 0.97) return;        // gia' piena: non serve

        // ritaglio il contenuto e lo rimetto nella forma dello spazio (800x520)
        var FW = 800, FH = 520;
        var out = document.createElement('canvas');
        out.width = FW; out.height = FH;
        var o = out.getContext('2d');
        o.fillStyle = 'rgb(' + r0 + ',' + g0 + ',' + b0 + ')';
        o.fillRect(0, 0, FW, FH);
        // ingrandisce il piu' possibile SENZA tagliare: il nome del cliente
        // non deve mai finire fuori dal riquadro
        var scala = Math.min(FW / lc, FH / hc);
        var nw = lc * scala, nh = hc * scala;
        o.drawImage(prova, sx, su, lc, hc, (FW - nw) / 2, (FH - nh) / 2, nw, nh);
        im.src = out.toDataURL('image/jpeg', 0.92);
      } catch (e) { /* immagine di un altro sito o canvas bloccato: la lascio com'e' */ }
    };
    prova.src = url;
  }

  function destinazione(ann) {
    return ann.link_url || (ann.impresa_id ? '/profilo-impresa.html?id=' + ann.impresa_id : '#');
  }

  // --- creazione dei riquadri ---------------------------------------------
  function creaColonna(venduti) {
    POSTI.forEach(function (v) {
      if (!document.querySelector(v.sez)) return;
      var a = document.createElement('a');
      a.className = 'ti-spazio-citta pub-link';
      a.setAttribute('data-spazio-id', v.spazio);
      a.setAttribute('data-sez', v.sez);
      a.setAttribute('data-lato', v.lato);
      a.setAttribute('data-passo', v.passo);
      a.setAttribute('data-pila', v.pila === undefined ? -1 : v.pila);
      a.style.cssText = 'position:absolute;display:none;border-radius:12px;overflow:hidden;'
        + 'z-index:5;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.12)';

      var ann = venduti[v.spazio];

      // Niente segnaposti: lo spazio libero non si vede. Si vede solo
      // quello comprato davvero.
      if (!ann) return;

      var im = document.createElement('img');
      im.loading = 'lazy';
      im.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block';
      a.setAttribute('href', destinazione(ann));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('data-stato', 'venduto');
      im.src = ann.logo_url;
      im.alt = 'Pubblicita';
      adattaAlloSpazio(im, ann.logo_url);
      a.appendChild(im);
      document.body.appendChild(a);
    });
  }

  // --- geometria: identica alla home nazionale ----------------------------
  function larghezzaSchermo() {
    return document.documentElement.clientWidth || window.innerWidth;
  }

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

  function sistema() {
    var telefono = window.matchMedia(TELEFONO).matches;
    var hero = document.querySelector('.hero-inner');
    var largaOk = hero ? Math.min(LARGA, Math.round(spazioLibero(hero))) : 0;

    // i due in alto: stessa misura e stesso bordo della home nazionale
    IN_ALTO.forEach(function (id) {
      var a = document.querySelector('a.pub-link[data-spazio-id="' + id + '"]');
      if (!a) return;
      // niente segnaposto: se non l'ha comprato nessuno, sparisce
      if (!VENDUTI_ALTO[id]) { a.style.setProperty('display', 'none', 'important'); return; }
      if (telefono) { a.style.setProperty('display', 'flex', 'important'); return; }
      if (largaOk < MINIMA) { a.style.setProperty('display', 'none', 'important'); return; }
      a.style.setProperty('display', 'flex', 'important');
      a.style.setProperty('width', largaOk + 'px', 'important');
      a.style.setProperty('max-width', largaOk + 'px', 'important');
      a.style.setProperty(id.indexOf('sx') >= 0 ? 'left' : 'right', BORDO + 'px', 'important');
    });

    var l = document.querySelectorAll('.ti-spazio-citta');
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
      var centro = r.top + window.scrollY + r.height / 2;
      var pila = parseInt(a.getAttribute('data-pila'), 10);
      if (pila === 0) centro -= (H / 2 + 7);
      if (pila === 1) centro += (H / 2 + 7);
      a.style.display = 'block';
      a.style.width = L + 'px';
      a.style.height = H + 'px';
      a.style.top = Math.round(centro - H / 2) + 'px';
      if (a.getAttribute('data-lato') === 'sx') { a.style.left = BORDO + 'px'; a.style.right = 'auto'; }
      else { a.style.right = BORDO + 'px'; a.style.left = 'auto'; }
    }
  }
})();
