// js/citta-obbligatoria.js
//
// Nessun percorso di ricerca parte senza città.
//
// Come funziona: i link verso le pagine di ricerca restano normalissimi tag <a>
// (Google li segue e li indicizza come sempre). Al clic, però, se la città non
// si sa ancora, si apre un pannellino che la chiede. Scelta una volta, resta
// salvata e non viene più richiesta: il muro si vede una volta sola.
//
// Perché serve: la pubblicità è venduta per città. Se il cliente cerca partendo
// dalla home nazionale, atterra su pagine senza città e gli spazi che le imprese
// hanno pagato non compaiono a nessuno.
//
// Uso: <script src="/js/citta-obbligatoria.js"></script> prima di </body>.

(function (w, d) {
  'use strict';

  var CHIAVE = 'ti_citta_scelta';

  // Pagine che non hanno senso senza città: sono quelle che mostrano risultati.
  var PAGINE_CON_CITTA = [
    'cerca-imprese', 'cerca-artigiani', 'cerca-negozi',
    'cerca-professionisti', 'professionisti', 'risultati', 'mappa'
  ];

  var CITTA = ['Agrigento','Alessandria','Ancona','Aosta','Arezzo','Ascoli Piceno','Asti','Avellino','Bari','Barletta','Belluno','Benevento','Bergamo','Biella','Bologna','Bolzano','Brescia','Brindisi','Cagliari','Caltanissetta','Campobasso','Caserta','Catania','Catanzaro','Cesena','Como','Cosenza','Cremona','Crotone','Cuneo','Ferrara','Firenze','Foggia','Frosinone','Genova','Grosseto','Imperia','La Spezia','Latina','Lecce','Lecco','Livorno','Lodi','Lucca','Macerata','Mantova','Marsala','Massa','Matera','Messina','Milano','Modena','Monza','Napoli','Novara','Nuoro','Oristano','Padova','Palermo','Parma','Pavia','Perugia','Pesaro','Pescara','Piacenza','Pisa','Pistoia','Pordenone','Potenza','Prato','Ragusa','Ravenna','Reggio Calabria','Reggio Emilia','Rieti','Rimini','Roma','Rovigo','Salerno','Sassari','Savona','Siena','Siracusa','Sondrio','Taranto','Terni','Torino','Trapani','Trento','Treviso','Trieste','Udine','Varese','Venezia','Verbania','Vercelli','Verona','Vibo Valentia','Vicenza','Viterbo'];

  // ---------------------------------------------------------------- stato

  function leggi() {
    var u = new URLSearchParams(w.location.search).get('citta');
    if (u && u.trim()) return u.trim();
    try {
      var s = localStorage.getItem(CHIAVE);
      if (s && s.trim()) return s.trim();
    } catch (e) { /* localStorage non disponibile */ }
    return '';
  }

  function salva(c) {
    try { localStorage.setItem(CHIAVE, c); } catch (e) { /* pazienza */ }
  }

  // Riporta la città alla forma esatta del listino (l'utente scrive "roma").
  function normalizza(testo) {
    var t = (testo || '').trim();
    if (!t) return '';
    var k = t.toLowerCase();
    for (var i = 0; i < CITTA.length; i++) {
      if (CITTA[i].toLowerCase() === k) return CITTA[i];
    }
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // ---------------------------------------------------------------- url

  function serveCitta(href) {
    if (!href) return false;
    // Solo link interni
    if (/^(https?:)?\/\//i.test(href) && href.indexOf(w.location.host) === -1) return false;
    if (/^(mailto:|tel:|#)/i.test(href)) return false;
    var file = href.split('?')[0].split('#')[0].split('/').pop().replace(/\.html$/, '');
    return PAGINE_CON_CITTA.indexOf(file) !== -1;
  }

  function conCitta(href, citta) {
    if (!citta) return href;
    if (/[?&]citta=/.test(href)) return href;
    return href + (href.indexOf('?') === -1 ? '?' : '&') + 'citta=' + encodeURIComponent(citta);
  }

  // ---------------------------------------------------------------- pannello

  function stile() {
    if (d.getElementById('ti-cit-css')) return;
    var s = d.createElement('style');
    s.id = 'ti-cit-css';
    s.textContent = [
      /* 100001: deve stare SOPRA il banner dei cookie (99999), altrimenti su telefono
         il banner copriva il campo e il pulsante Continua e il visitatore restava bloccato */
      '.ti-cit-bg{position:fixed;inset:0;background:rgba(10,42,77,.55);z-index:100001;',
      'display:flex;align-items:center;justify-content:center;padding:18px}',
      '.ti-cit-box{background:#fff;border-radius:16px;max-width:420px;width:100%;',
      'padding:26px 24px;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:inherit}',
      '.ti-cit-box h3{margin:0 0 8px;font-size:20px;color:#0a2a4d}',
      '.ti-cit-box p{margin:0 0 18px;font-size:14px;color:#666;line-height:1.5}',
      '.ti-cit-box input{width:100%;padding:13px 14px;border:2px solid #dbe3ec;',
      'border-radius:10px;font-size:16px;box-sizing:border-box}',
      '.ti-cit-box input:focus{outline:none;border-color:#0066ff}',
      '.ti-cit-err{color:#c92a2a;font-size:13px;font-weight:600;margin:8px 0 0;display:none}',
      '.ti-cit-row{display:flex;gap:10px;margin-top:16px}',
      '.ti-cit-go{flex:1;background:#0066ff;color:#fff;border:none;border-radius:10px;',
      'padding:13px;font-size:15px;font-weight:700;cursor:pointer}',
      '.ti-cit-go:hover{background:#0052cc}',
      '.ti-cit-geo{background:#f1f5fa;color:#0a2a4d;border:none;border-radius:10px;',
      'padding:13px 16px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}',
      '.ti-cit-x{background:none;border:none;color:#999;font-size:13px;cursor:pointer;',
      'margin-top:14px;padding:0;text-decoration:underline}'
    ].join('');
    d.head.appendChild(s);
  }

  var listaId = 'ti-cit-lista';

  function chiedi(callback) {
    stile();

    var bg = d.createElement('div');
    bg.className = 'ti-cit-bg';
    bg.innerHTML =
      '<div class="ti-cit-box" role="dialog" aria-modal="true" aria-labelledby="ti-cit-t">' +
        '<h3 id="ti-cit-t">📍 Prima scegli la città</h3>' +
        '<p>Le imprese, gli artigiani e i negozi cambiano da città a città. ' +
           'Dicci dove ti servono e ti mostriamo solo quelli della tua zona.</p>' +
        '<input type="text" id="ti-cit-in" list="' + listaId + '" ' +
          'placeholder="Es. Roma" autocomplete="address-level2" autofocus>' +
        '<datalist id="' + listaId + '">' +
          CITTA.map(function (c) { return '<option value="' + c + '">'; }).join('') +
        '</datalist>' +
        '<p class="ti-cit-err" id="ti-cit-err">Scrivi la città per continuare</p>' +
        '<div class="ti-cit-row">' +
          '<button type="button" class="ti-cit-go" id="ti-cit-ok">Continua</button>' +
          '<button type="button" class="ti-cit-geo" id="ti-cit-geo">📍 La mia posizione</button>' +
        '</div>' +
        '<button type="button" class="ti-cit-x" id="ti-cit-no">Annulla</button>' +
      '</div>';
    d.body.appendChild(bg);

    var input = d.getElementById('ti-cit-in');
    var err = d.getElementById('ti-cit-err');
    setTimeout(function () { input.focus(); }, 50);

    function chiudi() { if (bg.parentNode) bg.parentNode.removeChild(bg); }

    function conferma() {
      var c = normalizza(input.value);
      if (!c) { err.style.display = 'block'; input.focus(); return; }
      salva(c);
      chiudi();
      callback(c);
    }

    d.getElementById('ti-cit-ok').onclick = conferma;
    d.getElementById('ti-cit-no').onclick = chiudi;
    input.onkeydown = function (e) { if (e.key === 'Enter') conferma(); };
    bg.onclick = function (e) { if (e.target === bg) chiudi(); };

    d.getElementById('ti-cit-geo').onclick = function () {
      if (!navigator.geolocation) { err.textContent = 'Posizione non disponibile, scrivi la città'; err.style.display = 'block'; return; }
      this.textContent = '⏳';
      var btn = this;
      navigator.geolocation.getCurrentPosition(function (pos) {
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='
              + pos.coords.latitude + '&lon=' + pos.coords.longitude,
              { headers: { 'Accept-Language': 'it' } })
          .then(function (r) { return r.json(); })
          .then(function (dd) {
            var a = dd && dd.address ? dd.address : {};
            var c = a.city || a.town || a.village || '';
            btn.textContent = '📍 La mia posizione';
            if (!c) { err.textContent = 'Non riesco a rilevarti, scrivi la città'; err.style.display = 'block'; return; }
            input.value = c;
            conferma();
          })
          .catch(function () {
            btn.textContent = '📍 La mia posizione';
            err.textContent = 'Non riesco a rilevarti, scrivi la città';
            err.style.display = 'block';
          });
      }, function () {
        btn.textContent = '📍 La mia posizione';
        err.textContent = 'Non riesco a rilevarti, scrivi la città';
        err.style.display = 'block';
      });
    };
  }

  // Siamo sulla home nazionale? (index.html o "/" senza ?citta=)
  function homeNazionale() {
    var f = w.location.pathname.split('/').pop().replace(/\.html$/, '');
    if (f !== '' && f !== 'index') return false;
    var c = new URLSearchParams(w.location.search).get('citta');
    return !(c && c.trim());
  }

  // Naviga verso url mettendoci la città.
  //
  // Regola: dalla HOME NAZIONALE non si va mai dritti a una pagina di ricerca.
  // Si passa sempre dalla home della città (index.html?citta=X) — che la città
  // sia da chiedere o già salvata. È lì che il cliente vede la sua zona per
  // intero e gli spazi pubblicitari principali. Da quel momento in poi la
  // navigazione è normale: dalla home città il clic va dritto alla ricerca.
  //
  // AGGIORNAMENTO 8 agosto 2026: il passaggio dalla home citta' resta (e' li' che
  // vive la pubblicita' venduta), ma la meta' scelta dal cliente non si perde
  // piu'. Viene passata come &vai=..., e la home citta' mostra in cima un
  // pulsante grosso "Vedi gli artigiani di Roma". Prima l'utente cliccava la
  // categoria, scriveva la citta' e si ritrovava al punto di partenza, senza
  // capire che doveva ricliccare: e' li' che la gente se ne andava.
  function vaiA(url) {
    var c = leggi();
    if (c) {
      if (homeNazionale()) { w.location.href = homeConMeta(c, url); return; }
      w.location.href = conCitta(url, c);
      return;
    }
    chiedi(function (scelta) {
      w.location.href = homeConMeta(scelta, url);
    });
  }

  // index.html?citta=X&vai=pagina-scelta.html
  function homeConMeta(citta, url) {
    var base = 'index.html?citta=' + encodeURIComponent(citta);
    var meta = String(url || '').split('?')[0].split('/').pop();
    return meta ? base + '&vai=' + encodeURIComponent(meta) : base;
  }

  // ---------------------------------------------------------------- aggancio

  function avvia() {
    // Se la città arriva dall'URL, la ricordo per i clic successivi.
    var daUrl = new URLSearchParams(w.location.search).get('citta');
    if (daUrl && daUrl.trim()) salva(daUrl.trim());

    // Intercetto i clic sui link di ricerca. In fase di cattura, così vale
    // anche se qualcuno più avanti aggiunge altri handler sullo stesso link.
    d.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      if (a.hasAttribute('data-no-citta')) return;   // via di fuga per casi particolari
      if (a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (!serveCitta(href)) return;
      e.preventDefault();
      vaiA(href);
    }, true);
  }

  w.TICitta = { get: leggi, set: salva, chiedi: chiedi, vaiA: vaiA, normalizza: normalizza };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', avvia);
  else avvia();

})(window, document);
