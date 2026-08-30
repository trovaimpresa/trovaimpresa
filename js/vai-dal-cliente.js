/* ============================================================================
   VAI DAL CLIENTE — 21 agosto 2026
   Sotto la mappa della barra laterale: un campo. Scrivi la via con la citta',
   e la mappa che sta GIA' li' si sposta sul punto col segnalino. Sotto
   compare il pulsante che apre il navigatore del telefono.

   ⛔ NIENTE FINESTRE CHE SI APRONO. Deciso da Alessio: «non capisco perche'
      si deve aprire, lasciala cosi' come sta, aggiungi solamente una via con
      la citta' e basta». La mappa resta quella della barra: non si allarga,
      non copre niente.

   ⛔ UN FILE SOLO, non quattro copie: una correzione qui vale per impresa,
      artigiano, studio e negozio.

   ⚠️ La strada non si disegna: senza voce e senza traffico non serve a chi
      guida. Il pulsante porta al navigatore vero — Mappe su iPhone, Google
      Maps altrove.

   I punti arrivano da Nominatim (OpenStreetMap), lo stesso servizio che usa
   gia' mappa.html: gratis, senza chiavi, una richiesta al secondo.
   ========================================================================== */
(function () {
  'use strict';

  var TEMPO_MAX = 8000;      /* oltre gli 8 secondi si molla e si avvisa */
  var PAUSA_MINIMA = 1100;   /* Nominatim: non piu' di una richiesta al secondo */
  var ZOOM_VIA = 17;         /* la via con le case intorno */
  var ultimaRichiesta = 0;
  var inCorso = false;

  function suIphone() {
    var s = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(s) ||
           (/Macintosh/.test(s) && navigator.maxTouchPoints > 1);
  }

  /* ⚠️ Il punto di partenza non si scrive: lo mette il telefono, che sa
     dov'e'. Scriverlo noi vorrebbe dire chiedere la posizione. */
  function linkStrada(lat, lon) {
    if (suIphone()) {
      return 'https://maps.apple.com/?daddr=' + lat + ',' + lon + '&dirflg=d';
    }
    return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lon;
  }

  function ricorda(chiave, valore) {
    try { sessionStorage.setItem('ti_ind_' + chiave, JSON.stringify(valore)); } catch (e) {}
  }

  function ricordato(chiave) {
    try {
      var v = sessionStorage.getItem('ti_ind_' + chiave);
      return v ? JSON.parse(v) : undefined;
    } catch (e) { return undefined; }
  }

  /* Torna {lat, lon, nome}, oppure null se l'indirizzo non esiste.
     ⚠️ Lancia un errore se e' colpa della rete: «non trovato» e «non ha
        risposto» sono due cose diverse, e vanno dette diverse. */
  function trovaPunto(indirizzo, fetchUsata) {
    var f = fetchUsata || window.fetch;
    var chiave = indirizzo.trim().toLowerCase();
    var vecchio = ricordato(chiave);
    if (vecchio !== undefined) return Promise.resolve(vecchio);

    var attesa = Math.max(0, PAUSA_MINIMA - (Date.now() - ultimaRichiesta));
    return new Promise(function (ok) { setTimeout(ok, attesa); }).then(function () {
      ultimaRichiesta = Date.now();
      var taglia = (typeof AbortController === 'function') ? new AbortController() : null;
      var orologio = setTimeout(function () { if (taglia) taglia.abort(); }, TEMPO_MAX);
      var url = 'https://nominatim.openstreetmap.org/search?q=' +
                encodeURIComponent(indirizzo) +
                '&countrycodes=it&format=json&addressdetails=0&limit=1';
      return f(url, {
        headers: { 'Accept': 'application/json', 'Accept-Language': 'it' },
        signal: taglia ? taglia.signal : undefined
      }).then(function (r) {
        clearTimeout(orologio);
        if (!r || !r.ok) throw new Error('rete');
        return r.json();
      }).then(function (dati) {
        if (!dati || !dati.length) { ricorda(chiave, null); return null; }
        var p = {
          lat: parseFloat(dati[0].lat),
          lon: parseFloat(dati[0].lon),
          nome: String(dati[0].display_name || indirizzo)
        };
        if (!isFinite(p.lat) || !isFinite(p.lon)) { ricorda(chiave, null); return null; }
        ricorda(chiave, p);
        return p;
      }).catch(function () {
        clearTimeout(orologio);
        throw new Error('rete');
      });
    });
  }

  function stile() {
    if (document.getElementById('vdc-stile')) return;
    var s = document.createElement('style');
    s.id = 'vdc-stile';
    s.textContent =
      '#vdc { padding:0 16px 12px; }' +
      '#vdc .vdc-tit { font-size:13px; font-weight:700; color:#0a2a4d; margin:0 0 7px; }' +
      '#vdc input { width:100%; box-sizing:border-box; padding:10px 11px;' +
      '  border:1.5px solid #d8dee7; border-radius:9px; font-size:0.85rem;' +
      '  font-family:inherit; color:#0a2a4d; background:#fff; }' +
      '#vdc input:focus { outline:none; border-color:#0066ff; }' +
      /* ⚠️ min-height 46px: sotto i 44 il dito su un telefono lo sbaglia.
         Preso da un rosso del banco — era alto 39. */
      '#vdc .vdc-btn { width:100%; box-sizing:border-box; margin-top:7px;' +
      '  padding:12px 14px; min-height:46px; border:none; border-radius:9px;' +
      '  cursor:pointer; font-family:inherit; font-size:0.85rem; font-weight:700;' +
      '  color:#fff; background:#0066ff; text-align:center; text-decoration:none;' +
      '  display:flex; align-items:center; justify-content:center;' +
      '  transition:background 0.15s; }' +
      '#vdc .vdc-btn:hover { background:#0052cc; }' +
      '#vdc .vdc-btn[disabled] { background:#9db8e8; cursor:default; }' +
      '#vdc .vdc-strada { background:#12874a; display:none; }' +
      '#vdc .vdc-strada:hover { background:#0d6b3a; }' +
      '#vdc .vdc-esito { font-size:13px; line-height:1.35; margin-top:7px;' +
      '  color:#5a6b80; word-break:break-word; }' +
      '#vdc .vdc-esito.vdc-male { color:#c0392b; }';
    document.head.appendChild(s);
  }

  function costruisci(mappaEl) {
    stile();
    var box = document.createElement('div');
    box.id = 'vdc';
    box.innerHTML =
      '<div class="vdc-tit">📍 Devi andare da un cliente?</div>' +
      '<label for="vdc-indirizzo" style="position:absolute;left:-9999px">Via e città del cliente</label>' +
      '<input id="vdc-indirizzo" type="text" autocomplete="off" placeholder="Via Roma 12, Rieti">' +
      '<button id="vdc-cerca" class="vdc-btn" type="button">Vedi dove sta</button>' +
      '<a id="vdc-strada" class="vdc-btn vdc-strada" target="_blank" rel="noopener">🧭 Fammi strada</a>' +
      '<div id="vdc-esito" class="vdc-esito"></div>';
    mappaEl.parentNode.insertBefore(box, mappaEl.nextSibling);
    return box;
  }

  function dico(testo, male) {
    var e = document.getElementById('vdc-esito');
    if (!e) return;
    e.textContent = testo || '';   /* ⛔ mai innerHTML: il nome arriva da fuori */
    e.className = 'vdc-esito' + (male ? ' vdc-male' : '');
  }

  /* Sposta la mappa che sta GIA' nella barra laterale, col segnalino sul punto.
     ⚠️ Se Leaflet non e' arrivato non si finge niente: il pulsante del
        navigatore resta, ed e' quello che porta dal cliente. */
  function spostaLaMappa(punto) {
    var m = window.sidebarMap;
    if (!m || typeof window.L === 'undefined') return false;
    try {
      if (window._vdcSegnalino) m.removeLayer(window._vdcSegnalino);
      window._vdcSegnalino = window.L.marker([punto.lat, punto.lon]).addTo(m);
      m.setView([punto.lat, punto.lon], ZOOM_VIA);
      setTimeout(function () { try { m.invalidateSize(); } catch (e) {} }, 60);
      return true;
    } catch (e) { return false; }
  }

  function cerca() {
    if (inCorso) return;
    var campo = document.getElementById('vdc-indirizzo');
    var bottone = document.getElementById('vdc-cerca');
    var strada = document.getElementById('vdc-strada');
    var indirizzo = (campo && campo.value || '').trim();

    strada.style.display = 'none';

    if (indirizzo.length < 4) {
      dico('Scrivi la via con la città — per esempio «Via Roma 12, Rieti».', true);
      if (campo) campo.focus();
      return;
    }

    inCorso = true;
    bottone.disabled = true;
    var etichetta = bottone.textContent;
    bottone.textContent = 'Sto cercando…';
    dico('');

    return trovaPunto(indirizzo).then(function (punto) {
      if (!punto) {
        dico('Non ho trovato questo indirizzo. Prova a scrivere la via con la città, ' +
             'o solo la via e il paese.', true);
        return;
      }
      var sullaMappa = spostaLaMappa(punto);
      strada.href = linkStrada(punto.lat, punto.lon);
      strada.style.display = 'flex';
      dico(sullaMappa ? punto.nome
                      : punto.nome + ' — la mappa non si è caricata, ma «Fammi strada» ti ci porta lo stesso.');
    }).catch(function () {
      dico('Non sono riuscito a cercare l’indirizzo: controlla la connessione e riprova.', true);
    }).then(function () {
      inCorso = false;
      bottone.disabled = false;
      bottone.textContent = etichetta;
    });
  }

  function avvia() {
    var mappaEl = document.getElementById('sidebar-map');
    if (!mappaEl) return;                       /* pagina senza barra laterale */
    if (document.getElementById('vdc')) return; /* gia' costruito */
    costruisci(mappaEl);
    var bottone = document.getElementById('vdc-cerca');
    var campo = document.getElementById('vdc-indirizzo');
    if (bottone) bottone.addEventListener('click', cerca);
    if (campo) campo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); cerca(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }

  /* aperto per il banco di prova */
  window.VaiDalCliente = {
    trovaPunto: trovaPunto, linkStrada: linkStrada, suIphone: suIphone,
    spostaLaMappa: spostaLaMappa, avvia: avvia, cerca: cerca, ZOOM_VIA: ZOOM_VIA
  };
})();
