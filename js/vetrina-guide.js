/* ============================================================
   vetrina-guide.js — 22 settembre 2026

   A COSA SERVE
   Riempie lo spazio vuoto ai lati delle GUIDE, del BLOG e dei BANDI.
   Fino a oggi quelle pagine — le piu' lette, perche' arrivano da Google —
   non mostravano niente: ne' le locandine di TrovaImpresa ne' i cartelli
   di chi ha comprato uno spazio.

   COSA MOSTRA, IN ORDINE
   1) I CARTELLI PAGATI della citta' di chi legge. Chi paga passa davanti,
      sempre, e prende i posti piu' in alto.
   2) Le LOCANDINE di TrovaImpresa negli altri posti, cosi' non resta mai
      un buco bianco.
   Se la citta' non si sa (arrivo da Google), si mostrano SOLO locandine:
   un cartello di Torino a chi legge da Bari non serve a nessuno dei due.

   COME SONO MESSI
   Una coppia (sinistra + destra) ogni 900 px, cioe' uno schermo intero di
   distanza: a schermo se ne vedono sempre due, mai di piu'. La prima coppia
   parte SOTTO il titolo, per non rubare la scena alla guida.
   Massimo 7 coppie = i 14 posti del listino.

   QUANDO NON SI VEDE
   - se ai lati non c'e' abbastanza spazio (finestra stretta)
   - sul telefono: li' passano solo i cartelli paganti, mai le locandine
     (decisione del 7 set 2026)
   - nelle pagine citta', dove comanda gia' js/spazi-citta.js

   I NUMERI
   Viste e clic dei cartelli paganti si contano con la stessa funzione
   `conta_annuncio` usata dalle pagine citta': l'impresa li ritrova nel suo
   pannello, insieme agli altri.

   NON DEVE MAI ROMPERE LA PAGINA: tutto in try/catch, e se la rete non
   risponde restano le locandine.
   ============================================================ */
(function () {
  'use strict';

  var URL_DB = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var CHIAVE = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

  var BASE_LOC   = '/img/locandine/loc-';
  var PASSO      = 900;   // distanza fra una coppia e l'altra
  var MAX_COPPIE = 7;     // 7 x 2 = i 14 posti del listino
  var LARGA_MAX  = 300;   // larghezza del cartello
  var LARGA_MIN  = 200;   // sotto questa non si mostra: sarebbe illeggibile
  var BORDO      = 24;    // aria fra il testo e il cartello

  /* Le locandine, nell'ordine in cui escono. Stesse della home. */
  var LOCANDINE = [
    ['01-vetrina',     '/#registrati'],
    ['05-diretto',     '/cerca-imprese'],
    ['02-gestionale',  '/software-gestionale-imprese-edili'],
    ['03-computo',     '/software-gestionale-imprese-edili'],
    ['07-bandi',       '/bandi'],
    ['08-subappalti',  '/subappalto'],
    ['13-blog',        '/blog'],
    ['06-guide',       '/costi-ristrutturazione'],
    ['09-offerte',     '/offerte-lavoro'],
    ['14-recensioni',  '/cerca-imprese'],
    ['11-citta',       '/citta'],
    ['04-preventivi',  '/software-gestionale-imprese-edili'],
    ['10-candidature', '/candidature-lavoro'],
    ['12-chi-cerchi',  '/cerca-artigiani']
  ];

  try {
    /* --- non si pesta i piedi con gli altri ------------------------------ */
    if (window.SPAZI_CITTA_COMANDA) return;           // pagina citta': comanda lei
    if (document.querySelector('.ti-vetrina-guide')) return;  // gia' fatto

    var ua = (navigator && navigator.userAgent) || '';
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(ua)) return;

    /* --- dove mettiamo i cartelli ---------------------------------------- */
    var CONTENITORE = document.querySelector('main.wrap')
                   || document.querySelector('.container')
                   || document.querySelector('main');
    if (!CONTENITORE) return;

    /* --- la citta' di chi legge ------------------------------------------ */
    function citta() {
      try {
        var u = new URLSearchParams(location.search).get('citta');
        if (u && u.trim()) return u.trim();
        var s = localStorage.getItem('ti_citta_scelta');   // la scrive citta-obbligatoria.js
        if (s && s.trim()) return s.trim();
      } catch (e) {}
      return '';
    }

    /* --- i conti del cliente: visto e cliccato --------------------------- */
    function conta(id, tipo) {
      if (!id) return;
      if (tipo === 'vista') {
        try {
          var k = 'ti-visto-' + id;
          if (sessionStorage.getItem(k)) return;
          sessionStorage.setItem(k, '1');
        } catch (e) {}
      }
      try {
        fetch(URL_DB + '/rest/v1/rpc/conta_annuncio', {
          method: 'POST', keepalive: true,
          headers: { apikey: CHIAVE, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_annuncio: id, p_tipo: tipo })
        })['catch'](function () {});
      } catch (e) {}
    }

    /* Meta' cartello sullo schermo per un secondo = una vista.
       Stesso metodo delle pagine citta': guardare dove sta il cartello
       funziona su tutti i browser, l'osservatore automatico no. */
    var daGuardare = [];
    function guarda() {
      var h = window.innerHeight || 0;
      daGuardare.forEach(function (v) {
        if (v.fatto) return;
        var r = v.el.getBoundingClientRect();
        var dentro = r.top < h - r.height / 2 && r.bottom > r.height / 2;
        if (!dentro) { v.da = 0; return; }
        if (!v.da) { v.da = Date.now(); return; }
        if (Date.now() - v.da >= 1000) { v.fatto = true; conta(v.id, 'vista'); }
      });
    }

    /* --- quanto spazio c'e' ai lati -------------------------------------- */
    function spazioLibero() {
      var r = CONTENITORE.getBoundingClientRect();
      var sx = r.left, dx = (window.innerWidth || 0) - r.right;
      return Math.min(sx, dx) - BORDO;
    }

    /* --- costruisce un cartello ------------------------------------------ */
    function cartello(lato, top, largo, dati) {
      var d = document.createElement('aside');
      d.className = 'ti-vetrina-guide ' + lato;
      d.style.top = top + 'px';
      d.style.width = largo + 'px';
      d.style[lato === 'sx' ? 'left' : 'right'] = '-' + (largo + BORDO) + 'px';

      var testa = dati.pagato
        ? '<p class="ti-vg-t">Impresa della tua città</p>' : '';
      var piede = dati.pagato
        ? '<p class="ti-vg-s">Spazio pubblicitario · ' + dati.citta + '</p>' : '';

      d.innerHTML = testa
        + '<a href="' + dati.link + '"' + (dati.pagato ? ' rel="sponsored"' : '') + '>'
        + '<img src="' + dati.img + '" alt="' + (dati.alt || '') + '" loading="lazy"></a>'
        + piede;

      if (dati.pagato) {
        var a = d.querySelector('a');
        a.addEventListener('click', function () { conta(dati.id, 'clic'); });
        daGuardare.push({ el: d, id: dati.id, da: 0, fatto: false });
      }
      return d;
    }

    /* --- lo stile --------------------------------------------------------- */
    function stile() {
      var s = document.createElement('style');
      s.textContent =
        '.ti-vetrina-guide{position:absolute;z-index:3}' +
        '.ti-vetrina-guide a{display:block;border-radius:14px;overflow:hidden;' +
          'box-shadow:0 4px 18px rgba(0,0,0,.12);border:1px solid #e8edf3;background:#fff;' +
          'transition:transform .15s,box-shadow .15s}' +
        '.ti-vetrina-guide a:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.18)}' +
        '.ti-vetrina-guide img{width:100%;height:auto;display:block}' +
        '.ti-vg-t{font-size:12px;letter-spacing:.4px;text-transform:uppercase;color:#8a97a6;' +
          'margin:0 0 6px 2px;font-weight:700}' +
        '.ti-vg-s{font-size:12.5px;color:#9aa7b5;margin:6px 2px 0}';
      document.head.appendChild(s);
    }

    /* --- chi ha pagato in questa citta' ---------------------------------- */
    function venduti(c) {
      if (!c) return Promise.resolve([]);
      var oggi = new Date().toISOString().slice(0, 10);
      var url = URL_DB + '/rest/v1/annunci_pubblicitari'
              + '?select=id,spazio_id,logo_url,link_url,impresa_id,citta'
              + '&citta=ilike.' + encodeURIComponent(c)
              + '&stato=eq.pagato'
              + '&data_fine=gte.' + oggi
              + '&order=spazio_id.asc';
      return fetch(url, { headers: { apikey: CHIAVE } })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (righe) {
          return (righe || []).filter(function (a) { return a.logo_url; });
        })['catch'](function () { return []; });
    }

    /* --- il giro ---------------------------------------------------------- */
    function disegna(pagati) {
      var largo = Math.min(LARGA_MAX, Math.floor(spazioLibero()));
      if (largo < LARGA_MIN) return;                 // ai lati non ci sta: niente

      var cs = getComputedStyle(CONTENITORE);
      if (cs.position === 'static') CONTENITORE.style.position = 'relative';

      /* la prima coppia parte sotto il titolo: si cerca la fine del primo
         blocco di testo, e se non si trova si scende di uno schermo */
      var ancora = CONTENITORE.querySelector('h2, .answer, .grid, .filtri');
      var primo = 700;
      try {
        if (ancora) {
          primo = ancora.getBoundingClientRect().top
                - CONTENITORE.getBoundingClientRect().top + 40;
        }
      } catch (e) {}
      if (primo < 320) primo = 320;

      var alt = CONTENITORE.scrollHeight;
      var quante = Math.max(0, Math.min(MAX_COPPIE,
                     Math.floor((alt - primo - 500) / PASSO)));
      if (!quante) return;

      var coda = pagati.slice();     // prima i paganti
      var iLoc = 0;

      for (var i = 0; i < quante; i++) {
        var top = primo + i * PASSO;
        ['dx', 'sx'].forEach(function (lato) {      // il posto migliore e' a destra
          var dati;
          var p = coda.shift();
          if (p) {
            dati = {
              pagato: true, id: p.id, citta: p.citta || '',
              img: p.logo_url,
              link: p.link_url || ('/profilo-impresa.html?id=' + p.impresa_id),
              alt: 'Spazio pubblicitario'
            };
          } else {
            var L = LOCANDINE[iLoc % LOCANDINE.length]; iLoc++;
            dati = { pagato: false, img: BASE_LOC + L[0] + '.svg', link: L[1], alt: '' };
          }
          CONTENITORE.appendChild(cartello(lato, top, largo, dati));
        });
      }

      if (daGuardare.length) {
        setInterval(guarda, 500);
        guarda();
      }
    }

    function via() {
      stile();
      venduti(citta()).then(disegna);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', via);
    else via();

  } catch (e) { /* la pagina non si rompe mai per colpa dei cartelli */ }
})();
