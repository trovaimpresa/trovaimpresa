/* js/loghi-ospiti.js — 4 nov 2026
 *
 * PROVA DEI LOGHI: per tre mesi (fino al 4 febbraio 2027) i loghi delle
 * imprese iscritte compaiono gratis negli spazi liberi delle pagine che
 * stanno su Google:
 *   - pagine citta'           (imprese-roma.html)      -> tutte le imprese della citta'
 *   - pagine mestiere+citta'  (muratore-roma.html)     -> solo le imprese elencate in quella pagina
 *   - pagina citta' del sito  (index.html?citta=Roma)  -> solo la riga del telefono
 *     (sul computer ai lati ci pensa gia' js/spazi-citta.js)
 *
 * Computer: due schede per lato, nello spazio libero accanto alla colonna.
 * Telefono (o schermo stretto): una riga «Imprese di <citta'>» sotto il titolo,
 * coi loghi che si scorrono col dito.
 *
 * Chi ha pagato vince sempre: se su un lato c'e' un annuncio pagato
 * (.ti-spazio di spazi-laterali.js), quel lato resta suo.
 *
 * Lo carica da solo js/pagine-citta.js (presente in tutte le pagine citta'
 * e mestiere): nessuna pagina va toccata. In index.html c'e' il suo <script>
 * con data-modo="telefono".
 *
 * Finita la prova, il file non fa piu' niente da solo.
 */
(function () {
  'use strict';

  var FINE_PROVA = '2027-02-04';
  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  var LARGA = 340;          // misura della scheda sul computer (fascia "hero")
  var MINIMA = 230;         // sotto questa larghezza ai lati non ci sta: si passa alla riga
  var NEL_TELEFONO = 20;    // quanti loghi al massimo nella riga
  var BORDO = 40;

  var oggi = new Date();
  var oggiTxt = oggi.getFullYear() + '-' + String(oggi.getMonth() + 1).padStart(2, '0') + '-' + String(oggi.getDate()).padStart(2, '0');
  if (oggiTxt > FINE_PROVA) return;
  if (window.__loghiOspiti) return;          // mai due volte nella stessa pagina
  window.__loghiOspiti = true;

  var script = document.currentScript;
  var modo = (script && script.getAttribute('data-modo')) || 'tutto';

  // ---- la citta' -----------------------------------------------------------
  function cittaPagina() {
    var p = new URLSearchParams(location.search).get('citta');
    if (p && p.trim()) return p.trim();
    // pagine citta' e mestiere: il pulsante in testa porta a ...?citta=Roma
    var a = document.querySelector('.hero a[href*="citta="]');
    if (a) {
      try { return new URL(a.getAttribute('href'), location.href).searchParams.get('citta') || ''; } catch (e) {}
    }
    return '';
  }

  // pagina mestiere: solo le imprese che quella pagina elenca
  function idDellaPagina() {
    if (/^\/imprese-/.test(location.pathname) || modo === 'telefono') return null;
    var ids = {};
    var l = document.querySelectorAll('a[href*="profilo-impresa"]');
    for (var i = 0; i < l.length; i++) {
      var m = (l[i].getAttribute('href') || '').match(/[?&]id=(\d+)/);
      if (m) ids[m[1]] = true;
    }
    return ids;
  }

  function mescola(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  async function cerca(c) {
    var q = SUPABASE_URL + '/rest/v1/imprese_pubbliche'
      + '?select=id,nome,mestiere,logo_url'
      + '&or=(citta.ilike.' + encodeURIComponent(c) + ',provincia.ilike.' + encodeURIComponent(c) + '*)'
      + '&logo_url=not.is.null&order=id&limit=200';
    try {
      var ctl = window.AbortController ? new AbortController() : null;
      var t = ctl ? setTimeout(function () { ctl.abort(); }, 8000) : null;
      var r = await fetch(q, { headers: { apikey: SUPABASE_ANON_KEY }, signal: ctl ? ctl.signal : undefined });
      if (t) clearTimeout(t);
      if (!r.ok) return [];
      var d = await r.json();
      return (Array.isArray(d) ? d : []).filter(function (x) {
        return x && x.id && /^https:\/\//.test(x.logo_url || '') && (x.nome || '').trim();
      });
    } catch (e) { return []; }
  }

  // ---- aspetto ---------------------------------------------------------------
  function stile() {
    if (document.getElementById('ti-ospiti-css')) return;
    var s = document.createElement('style');
    s.id = 'ti-ospiti-css';
    s.textContent = [
      '.ti-osp{position:fixed;z-index:40;box-sizing:border-box;background:#fff;border:2px solid #0a2a4d;',
      'border-radius:16px;padding:18px 18px 20px;text-align:center;text-decoration:none;',
      'box-shadow:0 6px 20px rgba(10,42,77,.15);font-family:inherit;transition:transform .15s}',
      '.ti-osp:hover{transform:translateY(-3px)}',
      '.ti-osp .o-t{color:#ff8800;font-weight:800;font-size:15px;letter-spacing:.04em;text-transform:uppercase}',
      '.ti-osp img{display:block;width:100%;height:150px;object-fit:contain;margin:12px 0}',
      '.ti-osp .o-n{color:#0a2a4d;font-weight:800;font-size:20px;line-height:1.25;overflow-wrap:anywhere}',
      '.ti-osp .o-m{color:#4b5d73;font-size:16px;margin-top:4px}',
      '.ti-osp .o-v{display:inline-block;margin-top:12px;background:#0066ff;color:#fff;font-weight:700;font-size:16px;padding:9px 18px;border-radius:10px}',
      '.ti-osp-riga{margin:18px 16px;background:#fff;border:2px solid #0a2a4d;border-radius:16px;padding:14px;box-sizing:border-box}',
      '.ti-osp-riga .o-t{color:#ff8800;font-weight:800;font-size:15px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px}',
      '.ti-osp-riga .o-r{display:flex;gap:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}',
      '.ti-osp-riga a{flex:0 0 130px;text-align:center;text-decoration:none;color:#0a2a4d;font-weight:700;font-size:14px;line-height:1.25;overflow-wrap:anywhere}',
      '.ti-osp-riga img{width:130px;height:90px;object-fit:contain;display:block;margin-bottom:6px;border:1px solid #e3e9f2;border-radius:10px;background:#fff}'
    ].join('');
    document.head.appendChild(s);
  }

  function scheda(o, c) {
    var a = document.createElement('a');
    a.className = 'ti-osp';
    a.href = '/profilo-impresa?id=' + encodeURIComponent(o.id);
    var t = document.createElement('div'); t.className = 'o-t'; t.textContent = 'Imprese di ' + c;
    var im = document.createElement('img'); im.src = o.logo_url; im.alt = 'Logo ' + o.nome; im.loading = 'lazy';
    im.onerror = function () { a.remove(); };
    var n = document.createElement('div'); n.className = 'o-n'; n.textContent = o.nome;
    a.appendChild(t); a.appendChild(im); a.appendChild(n);
    if (o.mestiere && o.mestiere !== 'Altro') {
      var m = document.createElement('div'); m.className = 'o-m'; m.textContent = o.mestiere; a.appendChild(m);
    }
    var v = document.createElement('span'); v.className = 'o-v'; v.textContent = 'Vedi la scheda';
    a.appendChild(v);
    return a;
  }

  function riga(lista, c) {
    var d = document.createElement('div');
    d.className = 'ti-osp-riga';
    var t = document.createElement('div'); t.className = 'o-t'; t.textContent = 'Imprese di ' + c;
    var r = document.createElement('div'); r.className = 'o-r';
    lista.slice(0, NEL_TELEFONO).forEach(function (o) {
      var a = document.createElement('a');
      a.href = '/profilo-impresa?id=' + encodeURIComponent(o.id);
      var im = document.createElement('img'); im.src = o.logo_url; im.alt = 'Logo ' + o.nome; im.loading = 'lazy';
      im.onerror = function () { a.remove(); };
      a.appendChild(im);
      a.appendChild(document.createTextNode(o.nome));
      r.appendChild(a);
    });
    d.appendChild(t); d.appendChild(r);
    return d;
  }

  // ---- dove vanno ------------------------------------------------------------
  var LISTA = [], CITTA = '';
  var schede = [];   // le schede ai lati oggi a schermo
  var laRiga = null;

  function colonna() {
    return document.querySelector('.section') || document.querySelector('main') || null;
  }

  function spazioLato() {
    var col = colonna();
    if (!col) return 0;
    var w = document.documentElement.clientWidth;
    return Math.floor((w - col.getBoundingClientRect().width) / 2) - BORDO * 2;
  }

  function pagatoSu(lato) {
    var l = document.querySelectorAll('.ti-spazio.' + lato);
    for (var i = 0; i < l.length; i++) if (getComputedStyle(l[i]).display !== 'none') return true;
    return false;
  }

  function togliTutto() {
    schede.forEach(function (s) { s.remove(); });
    schede = [];
    if (laRiga) { laRiga.remove(); laRiga = null; }
  }

  function metti() {
    togliTutto();
    if (!LISTA.length) return;
    var largo = Math.min(LARGA, spazioLato());
    var stretto = window.matchMedia('(max-width:1100px)').matches;

    if (modo === 'telefono' || largo < MINIMA) {
      // sul sito (index) la riga solo sul telefono: al computer ci sono gia' gli spazi
      if (modo === 'telefono' && !stretto) return;
      var h = document.querySelector('.hero');
      if (!h) return;
      laRiga = riga(LISTA, CITTA);
      h.insertAdjacentElement('afterend', laRiga);
      return;
    }

    var alto = window.innerHeight;
    var perLato = alto >= 1000 ? 2 : 1;
    var tops = perLato === 2 ? [230, 620] : [Math.max(120, Math.round(alto / 2 - 180))];
    var i = 0;
    ['sx', 'dx'].forEach(function (lato) {
      if (pagatoSu(lato)) return;
      tops.forEach(function (top) {
        var o = LISTA[i++];
        if (!o) return;
        var a = scheda(o, CITTA);
        a.setAttribute('data-lato', lato);
        a.style.width = largo + 'px';
        a.style.top = top + 'px';
        a.style[lato === 'sx' ? 'left' : 'right'] = BORDO + 'px';
        document.body.appendChild(a);
        schede.push(a);
      });
    });
  }

  // se arriva un annuncio pagato dopo di noi, quel lato gli si lascia
  function controllaPagati() {
    ['sx', 'dx'].forEach(function (lato) {
      if (!pagatoSu(lato)) return;
      schede = schede.filter(function (s) {
        if (s.getAttribute('data-lato') === lato) { s.remove(); return false; }
        return true;
      });
    });
  }

  async function avvia() {
    CITTA = cittaPagina();
    if (!CITTA) return;
    var lista = await cerca(CITTA);
    var ids = idDellaPagina();
    if (ids) lista = lista.filter(function (o) { return ids[String(o.id)]; });
    if (!lista.length) return;
    LISTA = mescola(lista);
    stile();
    metti();
    var giri = 0;
    var t = setInterval(function () { controllaPagati(); if (++giri > 30) clearInterval(t); }, 1000);
    var attesa;
    window.addEventListener('resize', function () { clearTimeout(attesa); attesa = setTimeout(metti, 200); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
