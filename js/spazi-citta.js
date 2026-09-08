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

  // Locandine di TrovaImpresa negli spazi ancora LIBERI (8 set 2026).
  // Uno spazio vuoto non rende niente; una locandina almeno racconta il sito.
  // Stesse immagini e stessi punti della home nazionale (js/locandine-home.js).
  // Se qualcuno compra quello spazio, il suo cartello prende il posto: chi
  // paga viene sempre prima. Sul TELEFONO le locandine non si mettono mai:
  // li' ogni cartello occupa mezzo schermo e va solo a chi ha pagato.
  var BASE_LOC = '/img/locandine/loc-';
  var LOCANDINE = {
    'imprese-sx':    { file: '02-gestionale',  link: '/software-gestionale-imprese-edili' },
    'imprese-dx':    { file: '03-computo',     link: '/software-gestionale-imprese-edili' },
    'inserzioni-sx': { file: '07-bandi',       link: '/bandi' },
    'inserzioni-dx': { file: '08-subappalti',  link: '/subappalto' },
    'profilo-sx-1':  { file: '11-citta',       link: '/citta' },
    'profilo-sx-2':  { file: '04-preventivi',  link: '/software-gestionale-imprese-edili' },
    'profilo-dx-1':  { file: '10-candidature', link: '/candidature-lavoro' },
    'profilo-dx-2':  { file: '12-chi-cerchi',  link: '/cerca-artigiani' }
  };

  // I due spazi grossi in alto: se nessuno li ha comprati, ci va la locandina.
  var LOC_ALTO = {
    'hero-sx': { file: '01-vetrina', link: '/#registrati' },
    'hero-dx': { file: '05-diretto', link: '/cerca-imprese' }
  };

  // Locandine SOLO informative: NON sono spazi in vendita e non entrano nel
  // listino. Stanno nei due punti che la home nazionale usa e che la pagina
  // citta' ha uguali. Servono a non lasciare la pagina spoglia.
  var LOC_EXTRA = [
    { sez: '.guide-costi-home', lato: 'sx', passo: 3, file: '13-blog',       link: '/blog' },
    { sez: '.guide-costi-home', lato: 'dx', passo: 3, file: '06-guide',      link: '/costi-ristrutturazione' },
    { sez: '.why-section',      lato: 'sx', passo: 4, file: '09-offerte',    link: '/offerte-lavoro' },
    { sez: '.why-section',      lato: 'dx', passo: 4, file: '14-recensioni', link: '/cerca-imprese' }
  ];

  var BORDO   = 20;                    // distanza dal bordo dello schermo
  var LARGA   = 600;                   // larghezza voluta per le due in alto
  var SCALINO = 0.85;                  // ogni fascia e' l'85% di quella sopra
  var MINIMA  = 140;                   // sotto questa non si mostra
  var TELEFONO = '(max-width:1100px)';

  // I posti in colonna li detta l'ELENCO UNICO (js/spazi-elenco.js): questa
  // pagina non decide piu' da sola quali cartelli mostrare. La lista qui
  // sotto resta solo come rete di sicurezza se l'elenco non fosse caricato.
  function postiDaElenco() {
    if (!(window.SPAZI_TI && window.SPAZI_TI.diQuestaPagina)) return null;
    var out = [];
    window.SPAZI_TI.diQuestaPagina().forEach(function (v) {
      if (!v.ancora || !v.passo) return;          // passo 0 = i due grossi in alto
      var p = { sez: v.ancora, lato: v.id.indexOf('-sx') >= 0 ? 'sx' : 'dx',
                passo: v.passo, spazio: v.id };
      if (v.pila === 0 || v.pila === 1) p.pila = v.pila;
      out.push(p);
    });
    return out.length ? out : null;
  }

  var POSTI = postiDaElenco() || [
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

  // Il vestito del cartello sul telefono: largo quanto lo schermo (max 420),
  // stessa forma 400x260 del riquadro che il cliente ha ritagliato.
  // -----------------------------------------------------------------------
  // 8 set 2026 — FAR CAPIRE CHE SI PUO' CLICCARE.
  // Il cartello non ha niente che dica "toccami": nemmeno Alex sapeva che si
  // cliccava. Niente scritte sopra la grafica del cliente (l'ha pagata lui):
  // si usa il movimento, che sul web vuol dire "questo si preme", piu' una
  // freccina piccola nell'angolo.
  // -----------------------------------------------------------------------
  var cssCartelliMesso = false;
  function stileCartelli() {
    if (cssCartelliMesso) return;
    cssCartelliMesso = true;
    var s = document.createElement('style');
    // ⛔ 8 set 2026, DIFETTO SEGNALATO DA ALEX E CORRETTO.
    // Il primo effetto alzava il cartello con translateY. Ma i due cartelli
    // grossi in alto sono centrati proprio con un translateY(-50%): l'effetto
    // glielo SOSTITUIVA e al passaggio del mouse crollavano di ~170 px.
    // Adesso il cartello non viene mosso mai: si muove solo l'immagine
    // DENTRO al riquadro (che ha overflow:hidden, quindi non esce), piu'
    // l'ombra, che non sposta niente. Provato su tutti e 6: zero spostamento.
    s.textContent =
        '.ti-cliccabile{transition:box-shadow .18s ease}'
      + '.ti-cliccabile img{transition:transform .18s ease}'
      + '.ti-cliccabile:hover{box-shadow:0 10px 26px rgba(0,0,0,.22)}'
      + '.ti-cliccabile:hover img{transform:scale(1.04)}'
      + '.ti-cliccabile:active img{transform:scale(.99)}'
      + '.ti-frec{position:absolute;right:8px;bottom:8px;width:26px;height:26px;'
      + 'border-radius:50%;background:rgba(255,255,255,.92);'
      + 'box-shadow:0 1px 4px rgba(0,0,0,.25);display:flex;align-items:center;'
      + 'justify-content:center;pointer-events:none}'
      + '.ti-frec svg{width:14px;height:14px;stroke:#0066ff;stroke-width:2.4;'
      + 'fill:none;stroke-linecap:round;stroke-linejoin:round}';
    document.head.appendChild(s);
  }

  // Mette la freccina in un cartello (una volta sola).
  function frecciaSu(a) {
    stileCartelli();
    if (a.className.indexOf('ti-cliccabile') < 0) a.className += ' ti-cliccabile';
    if (a.querySelector('.ti-frec')) return;
    var d = document.createElement('span');
    d.className = 'ti-frec';
    d.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">'
                + '<path d="M7 17L17 7"/><path d="M9 7h8v8"/></svg>';
    a.appendChild(d);
  }

  var cssMesso = false;
  function cssTelefono() {
    if (cssMesso) return;
    cssMesso = true;
    var s = document.createElement('style');
    s.textContent = '.ti-spazio-tel{display:block!important;position:relative!important;'
      + 'width:100%;max-width:420px;margin:16px auto;aspect-ratio:400/260;'
      + 'border-radius:12px;overflow:hidden;text-decoration:none;'
      + 'box-shadow:0 2px 12px rgba(0,0,0,.12)}';
    document.head.appendChild(s);
  }

  async function avvia() {
    var venduti = await cercaVenduti();
    IN_ALTO.forEach(function (id) { if (venduti[id]) VENDUTI_ALTO[id] = venduti[id]; });
    creaColonna(venduti);
    creaExtra();
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
            + '?select=id,spazio_id,logo_url,link_url,impresa_id'
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

  // -----------------------------------------------------------------------
  // 8 set 2026 — I NUMERI DEL CLIENTE.
  // "Visto" vuol dire visto davvero: il cartello viene contato solo quando
  // entra nello schermo e ci resta almeno un secondo. Non basta che sia in
  // fondo alla pagina dove nessuno arriva. Una vista per visita, non una a
  // ogni volta che scorri su e giu'. I clic si contano tutti.
  // Se il conteggio non parte, il cartello funziona lo stesso: non si blocca
  // mai niente per colpa di un numero.
  // -----------------------------------------------------------------------
  function conta(idAnnuncio, tipo) {
    if (!idAnnuncio) return;
    if (tipo === 'vista') {
      try {
        var k = 'ti-visto-' + idAnnuncio;
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, '1');
      } catch (e) { /* browser che non tiene niente: si conta e basta */ }
    }
    try {
      fetch(SUPABASE_URL + '/rest/v1/rpc/conta_annuncio', {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annuncio: idAnnuncio, p_tipo: tipo }),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* niente rete: pazienza */ }
  }

  // ⛔ 8 set 2026 — trovato col collaudo dal vivo.
  // Prima si usava IntersectionObserver, il modo automatico del browser per
  // sapere quando una cosa entra nello schermo. Sulla pagina vera non
  // rispondeva: il clic si contava, la vista no. Provato anche con un
  // osservatore nuovo scritto sul momento: stesso silenzio. Quindi non ci si
  // affida piu' a lui — si guarda direttamente dove sta il cartello, mezzo
  // secondo alla volta. Costa niente (i cartelli sono al massimo 10) e
  // funziona su qualunque browser.
  //
  // "Visto" = almeno meta' del cartello sullo schermo per almeno 1 secondo.
  // Si smette di controllare quando sono stati contati tutti, o dopo 5 minuti.
  function metaSulloSchermo(el) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    if (getComputedStyle(el).display === 'none') return false;
    var H = window.innerHeight || document.documentElement.clientHeight;
    var W = window.innerWidth  || document.documentElement.clientWidth;
    var alto  = Math.min(r.bottom, H) - Math.max(r.top, 0);
    var largo = Math.min(r.right, W)  - Math.max(r.left, 0);
    if (alto <= 0 || largo <= 0) return false;
    return (alto * largo) / (r.height * r.width) >= 0.5;
  }

  var daGuardare = [];
  var orologio = null;

  function guardaQuando(a, idAnnuncio) {
    a.addEventListener('click', function () { conta(idAnnuncio, 'clic'); });
    a.setAttribute('data-annuncio', idAnnuncio);
    daGuardare.push({ el: a, id: idAnnuncio, da: 0 });
    if (orologio) return;
    var giri = 0;
    orologio = setInterval(function () {
      var ora = Date.now();
      for (var i = daGuardare.length - 1; i >= 0; i--) {
        var v = daGuardare[i];
        if (!metaSulloSchermo(v.el)) { v.da = 0; continue; }
        if (!v.da) { v.da = ora; continue; }
        if (ora - v.da >= 1000) {
          conta(v.id, 'vista');
          daGuardare.splice(i, 1);
        }
      }
      if (!daGuardare.length || ++giri > 600) {
        clearInterval(orologio); orologio = null;
      }
    }, 500);
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
      var loc = LOCANDINE[v.spazio];

      // Niente segnaposti "spazio disponibile": o c'e' un cartello pagato,
      // o c'e' una locandina di TrovaImpresa. Mai un riquadro vuoto.
      if (!ann && !loc) return;

      var im = document.createElement('img');
      im.loading = 'lazy';
      im.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block';

      if (ann) {
        a.setAttribute('href', destinazione(ann));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        a.setAttribute('data-stato', 'venduto');
        im.src = ann.logo_url;
        im.alt = 'Pubblicita';
        a.setAttribute('data-annuncio', ann.id || '');
        adattaAlloSpazio(im, ann.logo_url);
      } else {
        a.setAttribute('href', loc.link);
        a.setAttribute('rel', 'noopener');
        a.setAttribute('data-stato', 'locandina');
        a.setAttribute('data-locandina', loc.file);
        im.src = BASE_LOC + loc.file + '.svg';
        im.alt = 'TrovaImpresa';
      }

      a.appendChild(im);
      frecciaSu(a);
      document.body.appendChild(a);
      if (ann && ann.id) guardaQuando(a, ann.id);
    });
  }

  // Le 4 locandine informative (non vendibili): stesso vestito delle altre.
  function creaExtra() {
    LOC_EXTRA.forEach(function (v) {
      if (!document.querySelector(v.sez)) return;
      var a = document.createElement('a');
      a.className = 'ti-spazio-citta';
      a.setAttribute('data-sez', v.sez);
      a.setAttribute('data-lato', v.lato);
      a.setAttribute('data-passo', v.passo);
      a.setAttribute('data-pila', -1);
      a.setAttribute('data-stato', 'locandina');
      a.setAttribute('data-locandina', v.file);
      a.setAttribute('href', v.link);
      a.setAttribute('rel', 'noopener');
      a.style.cssText = 'position:absolute;display:none;border-radius:12px;overflow:hidden;'
        + 'z-index:5;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.12)';
      var im = document.createElement('img');
      im.loading = 'lazy';
      im.alt = 'TrovaImpresa';
      im.src = BASE_LOC + v.file + '.svg';
      im.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block';
      a.appendChild(im);
      frecciaSu(a);
      document.body.appendChild(a);
    });
  }

  // Mette la locandina in uno dei due spazi grossi in alto rimasti liberi.
  function vestiAlto(a, loc) {
    // Si controlla l'IMMAGINE vera, non l'etichetta: se qualcun altro l'ha
    // sostituita (succedeva con pubblicita-spazi.js), qui la si rimette.
    var giaMessa = a.querySelector('img[src$="' + loc.file + '.svg"]');
    if (a.getAttribute('data-locandina') === loc.file && giaMessa) return;
    a.innerHTML = '';
    a.setAttribute('data-locandina', loc.file);
    a.setAttribute('data-stato', 'locandina');
    a.setAttribute('href', loc.link);
    a.setAttribute('rel', 'noopener');
    a.removeAttribute('target');
    a.style.setProperty('padding', '0', 'important');
    a.style.setProperty('border', 'none', 'important');
    a.style.setProperty('overflow', 'hidden', 'important');
    a.style.setProperty('border-radius', '12px', 'important');
    var im = document.createElement('img');
    im.alt = 'TrovaImpresa';
    im.src = BASE_LOC + loc.file + '.svg';
    im.style.cssText = 'width:100%;height:100%;object-fit:fill;display:block';
    a.appendChild(im);
    // La freccina si aggancia all'angolo del cartello: serve che il cartello
    // abbia una posizione propria. Se ce l'ha gia' (e' il caso sul computer)
    // non si tocca niente: non si sposta un cartello che sta gia' al posto giusto.
    if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
    frecciaSu(a);
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
      // Spazio libero: sul computer ci va la locandina di TrovaImpresa,
      // sul telefono resta vuoto (li' va solo chi ha pagato).
      if (!VENDUTI_ALTO[id]) {
        if (telefono || !LOC_ALTO[id]) { a.style.setProperty('display', 'none', 'important'); return; }
        vestiAlto(a, LOC_ALTO[id]);
      }
      if (telefono) { a.style.setProperty('display', 'flex', 'important'); return; }
      if (largaOk < MINIMA) { a.style.setProperty('display', 'none', 'important'); return; }
      a.style.setProperty('display', 'flex', 'important');
      a.style.setProperty('width', largaOk + 'px', 'important');
      a.style.setProperty('max-width', largaOk + 'px', 'important');
      a.style.setProperty(id.indexOf('sx') >= 0 ? 'left' : 'right', BORDO + 'px', 'important');
    });

    var l = document.querySelectorAll('.ti-spazio-citta');

    // --- TELEFONO (8 set 2026) ---------------------------------------------
    // Sotto i 1100 px ai lati non avanza niente: prima il cartello di chi
    // aveva pagato spariva del tutto. Ora scende DENTRO la pagina, largo
    // quanto lo schermo, subito dopo la sezione a cui e' ancorato sul
    // computer: chi compra all'altezza di "Scegli la categoria" si vede li'.
    // Stessa soluzione gia' collaudata il 6 set in js/spazi-laterali.js.
    if (telefono) {
      cssTelefono();
      for (var t = 0; t < l.length; t++) {
        var el = l[t];
        // sul telefono solo chi ha pagato: le locandine restano al computer
        if (el.getAttribute('data-stato') !== 'venduto') {
          el.style.setProperty('display', 'none', 'important');
          continue;
        }
        var sz = document.querySelector(el.getAttribute('data-sez'));
        if (!sz) { el.style.display = 'none'; continue; }
        if (el.getAttribute('data-in-pagina') !== '1') {
          el.setAttribute('data-in-pagina', '1');
          el.removeAttribute('style');
          el.className = 'ti-spazio-citta ti-spazio-tel pub-link ti-cliccabile';
          sz.insertAdjacentElement('afterend', el);
          frecciaSu(el);
        }
      }
      return;
    }
    // Si torna al computer (o si allarga la finestra): i cartelli tornano ai lati.
    for (var t2 = 0; t2 < l.length; t2++) {
      if (l[t2].getAttribute('data-in-pagina') === '1') {
        l[t2].removeAttribute('data-in-pagina');
        l[t2].className = 'ti-spazio-citta pub-link';
        l[t2].style.cssText = 'position:absolute;display:none;border-radius:12px;'
          + 'overflow:hidden;z-index:5;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.12)';
        document.body.appendChild(l[t2]);
      }
    }

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
