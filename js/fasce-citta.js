/* js/fasce-citta.js — 27 nov 2026
 * ============================================================================
 * LE FASCE LARGHE DELLA PAGINA CITTA'  (index.html?citta=X)
 * ============================================================================
 * Il fatto (Alex, 27 nov 2026): «sia dal telefono che dal PC questi spazi
 * sembrano quasi invisibili». Misurato:
 *   - portatile 1366 px: ai lati avanzano ~150 px, i cartelli escono
 *     piccolissimi e non si leggono; a 1280 px non escono proprio;
 *   - telefono: i posti liberi sono spenti (regola dell'8 set) e nessuno ha
 *     pagato, quindi a schermo non c'e' NIENTE;
 *   - app iPhone: uguale al telefono.
 *
 * Qui NON nascono spazi nuovi da vendere: listino, prezzi e Stripe restano i
 * 14 di js/spazi-elenco.js. Le fasce larghe sono una vetrina IN PIU' per chi
 * ha gia' comprato, dentro la pagina e larghe quanto la pagina, quindi si
 * vedono a ogni misura di schermo. Anteprima approvata da Alex il 27 nov.
 *
 *   A  sotto la testata, sopra la ricerca  -> chi ha comprato hero-sx / hero-dx
 *   B  sotto «Cerchi idee per casa?»       -> chi ha comprato imprese-sx / -dx
 *   C  sotto «Fatti trovare dai clienti»   -> tutti gli altri spazi pagati, a turno
 *   D  barra in basso, solo telefono/app   -> chi ha pagato, a turno (mai «libero»:
 *      una barra fissa che chiede soldi ai clienti sarebbe solo fastidio)
 *
 * Posto non venduto = cartello «SPAZIO LIBERO» che porta al listino gia' sullo
 * spazio e sulla citta' giusti. Nell'app iPhone quel cartello lo spegne da
 * solo app-ios.js (porta a /pubblicita, che Apple non vuole nell'app).
 * Piu' clienti nella stessa fascia: uno a visita, a giro.
 * Viste e clic si contano con conta_annuncio, come i cartelli di lato.
 * ============================================================================ */
(function () {
  'use strict';

  var percorso = window.location.pathname.replace(/index\.html$/, '');
  if (percorso !== '/') return;
  var CITTA = (new URLSearchParams(window.location.search).get('citta') || '').trim();
  if (!CITTA) return;
  if (window.__fasceCitta) return;
  window.__fasceCitta = true;

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  var TELEFONO = '(max-width:760px)';

  var FASCE = [
    { lettera: 'A', dopo: '.hero-banda',  spazi: ['hero-sx', 'hero-dx'] },
    { lettera: 'B', dopo: '#le-idee',     spazi: ['imprese-sx', 'imprese-dx'] },
    { lettera: 'C', dopo: '#registrati',  spazi: null, turno: true } // null = tutti gli altri
  ];
  // ⚠️ Cosa va in quale fascia lo scrive anche il listino (js/spazi-elenco.js,
  // campo «larga»): se si cambia qui, si cambia anche li'.

  function tuttiGliSpazi() {
    if (window.SPAZI_TI && window.SPAZI_TI.SPAZI) {
      return window.SPAZI_TI.SPAZI.map(function (s) { return s.id; });
    }
    return ['hero-sx', 'hero-dx', 'imprese-sx', 'imprese-dx', 'inserzioni-sx', 'inserzioni-dx',
            'guide-sx', 'guide-dx', 'perche-sx', 'perche-dx',
            'profilo-sx-1', 'profilo-sx-2', 'profilo-dx-1', 'profilo-dx-2'];
  }
  function prezzo(id) {
    try { return (window.SPAZI_TI && window.SPAZI_TI.prezzoDi(id)) || 0; } catch (e) { return 0; }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function urlSicuro(u) {
    u = String(u || '').trim();
    return /^(https?:\/\/|\/)/i.test(u) ? u : '';
  }

  // ---------------------------------------------------------------- stile
  function stile() {
    if (document.getElementById('fasce-citta-stile')) return;
    var s = document.createElement('style');
    s.id = 'fasce-citta-stile';
    s.textContent = [
      '.fc-fascia{box-sizing:border-box;display:block;width:100%;max-width:1000px;margin:24px auto;padding:0 16px}',
      '.fc-ban{position:relative;box-sizing:border-box;display:flex;align-items:center;gap:20px;border-radius:14px;padding:20px 22px;',
      'text-decoration:none!important;color:#fff;background-color:#0a2a4d;',
      'background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);',
      'background-size:40px 40px;border:3px solid #ff8800;box-shadow:0 6px 22px rgba(10,42,77,.25);transition:transform .15s,box-shadow .15s}',
      '.fc-ban:hover{box-shadow:0 10px 30px rgba(10,42,77,.35)}',
      '.fc-tag{position:absolute;top:-13px;left:18px;background:#ff8800;color:#fff;font-size:13px;font-weight:700;padding:3px 11px;border-radius:20px;letter-spacing:.5px;text-transform:uppercase}',
      '.fc-img{flex:0 0 200px;width:200px;aspect-ratio:400/260;border-radius:10px;background:#fff center/cover no-repeat;overflow:hidden}',
      '.fc-img img{width:100%;height:100%;object-fit:cover;display:block}',
      '.fc-piu{flex:0 0 74px;height:74px;border-radius:12px;background:#fff3e6;color:#ff8800;font-size:40px;font-weight:700;display:flex;align-items:center;justify-content:center}',
      '.fc-testo{flex:1 1 auto;min-width:0}',
      '.fc-t{display:block;font-size:22px;font-weight:800;line-height:1.25;color:inherit}',
      '.fc-s{display:block;font-size:16px;line-height:1.4;opacity:.92;margin-top:4px;color:inherit}',
      '.fc-btn{flex:0 0 auto;margin-left:auto;background:#ff8800;color:#fff;font-weight:700;font-size:16px;padding:12px 20px;border-radius:10px;white-space:nowrap}',
      '.fc-libero{background:#fff;background-image:none;color:#0a2a4d;border-style:dashed}',
      '@media(max-width:760px){.fc-fascia{margin:20px auto}.fc-ban{flex-wrap:wrap;padding:22px 16px 16px;gap:14px}',
      '.fc-img{flex-basis:100%;width:100%}.fc-t{font-size:20px}.fc-btn{margin-left:0;width:100%;text-align:center;box-sizing:border-box}',
      '.fc-piu{flex-basis:60px;height:60px;font-size:32px}}',
      /* D: la barra in basso */
      '.fc-bar{position:fixed;left:0;right:0;bottom:0;z-index:9990;display:flex;align-items:center;gap:12px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));',
      'background:#0a2a4d;color:#fff;border-top:3px solid #ff8800;box-shadow:0 -4px 16px rgba(0,0,0,.25);text-decoration:none!important}',
      '.fc-bar .fc-img{flex:0 0 74px;width:74px;border-radius:8px}',
      '.fc-bar .fc-testo b{display:block;font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fc-bar .fc-testo span{display:block;font-size:14px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fc-bar .fc-btn{font-size:15px;padding:10px 16px;width:auto;margin-left:auto}',
      '.fc-x{position:absolute;top:-15px;right:10px;width:30px;height:30px;border-radius:50%;border:0;background:#fff;color:#0a2a4d;',
      'font-size:18px;font-weight:700;line-height:30px;text-align:center;padding:0;cursor:pointer;box-shadow:0 1px 5px rgba(0,0,0,.3)}',
      'body.fc-con-barra{padding-bottom:96px!important}'
    ].join('');
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------------- dati
  async function cercaVenduti() {
    var oggi = new Date().toISOString().slice(0, 10);
    var url = SUPABASE_URL + '/rest/v1/annunci_pubblicitari'
      + '?select=id,spazio_id,logo_url,link_url,impresa_id'
      + '&spazio_id=in.(' + tuttiGliSpazi().join(',') + ')'
      + '&citta=ilike.' + encodeURIComponent(CITTA)
      + '&stato=eq.pagato&data_fine=gte.' + oggi;
    try {
      var r = await fetch(url, { headers: { apikey: KEY } });
      if (!r.ok) return [];
      var lista = (await r.json()).filter(function (a) { return a.logo_url; });
      // i nomi delle imprese, per scriverli accanto all'immagine
      var ids = lista.map(function (a) { return a.impresa_id; }).filter(Boolean);
      if (ids.length) {
        try {
          var q = SUPABASE_URL + '/rest/v1/imprese_pubbliche?select=id,nome_attivita,nome,mestiere,citta'
                + '&id=in.(' + ids.join(',') + ')';
          var r2 = await fetch(q, { headers: { apikey: KEY } });
          if (r2.ok) {
            var per = {};
            (await r2.json()).forEach(function (i) { per[i.id] = i; });
            lista.forEach(function (a) { a.impresa = per[a.impresa_id] || null; });
          }
        } catch (e) { /* senza nome si mostra solo l'immagine */ }
      }
      return lista;
    } catch (e) { return []; }
  }

  // a turno = tutti uguali, uno a visita (fascia C e barra in basso: lo dice il listino)
  function aCaso(lista) {
    return lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
  }
  function scegli(lista) {
    if (!lista.length) return null;
    var maxP = 0;
    lista.forEach(function (a) { maxP = Math.max(maxP, prezzo(a.spazio_id)); });
    var top = lista.filter(function (a) { return prezzo(a.spazio_id) === maxP; });
    return top[Math.floor(Math.random() * top.length)];
  }

  // ---------------------------------------------------------------- contatori
  function conta(id, tipo) {
    if (!id) return;
    if (tipo === 'vista') {
      try {
        var k = 'ti-fc-visto-' + id;
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, '1');
      } catch (e) {}
    }
    try {
      fetch(SUPABASE_URL + '/rest/v1/rpc/conta_annuncio', {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annuncio: id, p_tipo: tipo }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }
  var daGuardare = [];
  function aMeta(el) {
    if (!el.isConnected) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var H = window.innerHeight || document.documentElement.clientHeight;
    var alto = Math.min(r.bottom, H) - Math.max(r.top, 0);
    return alto > 0 && alto / r.height >= 0.5;
  }
  function guarda(el, id) {
    el.addEventListener('click', function () { conta(id, 'clic'); });
    daGuardare.push({ el: el, id: id, dal: 0 });
    if (guarda.giro) return;
    guarda.giro = setInterval(function () {
      var ora = Date.now();
      daGuardare = daGuardare.filter(function (x) {
        if (!aMeta(x.el)) { x.dal = 0; return true; }
        if (!x.dal) { x.dal = ora; return true; }
        if (ora - x.dal >= 1000) { conta(x.id, 'vista'); return false; }
        return true;
      });
      if (!daGuardare.length) { clearInterval(guarda.giro); guarda.giro = null; }
    }, 500);
  }

  // ---------------------------------------------------------------- disegno
  function destinazione(a) {
    return urlSicuro(a.link_url) || (a.impresa_id ? '/profilo-impresa.html?id=' + encodeURIComponent(a.impresa_id) : '#');
  }
  function nomeDi(a) {
    var i = a.impresa || {};
    return String(i.nome_attivita || '').trim() || String(i.nome || '').trim() || '';
  }
  function sottoDi(a) {
    var i = a.impresa || {};
    var m = String(i.mestiere || '').trim();
    var c = String(i.citta || '').trim() || CITTA;
    return (m ? m + ' a ' : 'A ') + c;
  }
  function fuori(a) {
    // un link verso un altro sito si apre a parte
    return /^https?:\/\//i.test(destinazione(a)) && destinazione(a).indexOf(location.host) < 0;
  }

  function cartelloPagato(ann) {
    var a = document.createElement('a');
    a.className = 'fc-ban fc-pagato pub-link';
    a.href = destinazione(ann);
    if (fuori(ann)) { a.target = '_blank'; a.rel = 'noopener sponsored'; } else { a.rel = 'sponsored'; }
    var nome = nomeDi(ann);
    a.innerHTML = '<span class="fc-tag">In vetrina a ' + esc(CITTA) + '</span>'
      + '<span class="fc-img"><img src="' + esc(urlSicuro(ann.logo_url)) + '" alt="' + esc(nome || 'Pubblicità') + '" loading="lazy"></span>'
      + '<span class="fc-testo">'
      + (nome ? '<span class="fc-t">' + esc(nome) + '</span><span class="fc-s">' + esc(sottoDi(ann)) + '</span>' : '')
      + '</span><span class="fc-btn">Vedi l’impresa →</span>';
    guarda(a, ann.id);
    return a;
  }

  function cartelloLibero(spazio) {
    var a = document.createElement('a');
    a.className = 'fc-ban fc-libero';
    a.href = '/pubblicita?spazio=' + encodeURIComponent(spazio) + '&citta=' + encodeURIComponent(CITTA);
    a.innerHTML = '<span class="fc-tag">Spazio libero</span><span class="fc-piu">+</span>'
      + '<span class="fc-testo"><span class="fc-t">Qui ci può stare la tua impresa</span>'
      + '<span class="fc-s">La vedono tutti quelli che cercano un’impresa a ' + esc(CITTA) + '</span></span>'
      + '<span class="fc-btn">Prendi questo spazio →</span>';
    return a;
  }

  function barra(ann) {
    try { if (sessionStorage.getItem('ti-fc-barra-chiusa')) return; } catch (e) {}
    var a = document.createElement('a');
    a.className = 'fc-bar pub-link';
    a.href = destinazione(ann);
    if (fuori(ann)) { a.target = '_blank'; a.rel = 'noopener sponsored'; } else { a.rel = 'sponsored'; }
    var nome = nomeDi(ann) || 'In vetrina a ' + CITTA;
    a.innerHTML = '<span class="fc-img"><img src="' + esc(urlSicuro(ann.logo_url)) + '" alt=""></span>'
      + '<span class="fc-testo"><b>' + esc(nome) + '</b><span>' + esc(sottoDi(ann)) + '</span></span>'
      + '<span class="fc-btn">Vedi →</span>';
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'fc-x';
    x.setAttribute('aria-label', 'Chiudi');
    x.textContent = '×';
    x.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      a.remove();
      document.body.classList.remove('fc-con-barra');
      try { sessionStorage.setItem('ti-fc-barra-chiusa', '1'); } catch (er) {}
    });
    a.appendChild(x);
    document.body.appendChild(a);
    document.body.classList.add('fc-con-barra');
    guarda(a, ann.id);
  }

  // ---------------------------------------------------------------- via
  async function avvia() {
    stile();
    var venduti = await cercaVenduti();
    var usati = {};
    var giaMostrati = [];
    FASCE.forEach(function (f) {
      var dopo = document.querySelector(f.dopo);
      if (!dopo) return;
      var miei = f.spazi
        ? venduti.filter(function (a) { return f.spazi.indexOf(a.spazio_id) >= 0; })
        : venduti.filter(function (a) { return !usati[a.spazio_id]; });
      (f.spazi || []).forEach(function (s) { usati[s] = 1; });
      var w = document.createElement('div');
      w.className = 'fc-fascia';
      w.setAttribute('data-fascia', f.lettera);
      var ann = f.turno ? aCaso(miei) : scegli(miei);
      if (ann) {
        w.appendChild(cartelloPagato(ann));
        giaMostrati.push(ann);
      } else {
        // lo spazio da proporre: il primo libero di quella fascia
        var tutti = f.spazi || tuttiGliSpazi().filter(function (s) { return !usati[s]; });
        var presi = {};
        venduti.forEach(function (v) { presi[v.spazio_id] = 1; });
        var libero = tutti.filter(function (s) { return !presi[s]; })[0];
        if (!libero) return;
        w.appendChild(cartelloLibero(libero));
      }
      dopo.insertAdjacentElement('afterend', w);
    });
    if (venduti.length && window.matchMedia(TELEFONO).matches) barra(aCaso(venduti));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(avvia, 60); });
  } else {
    setTimeout(avvia, 60);
  }
})();
