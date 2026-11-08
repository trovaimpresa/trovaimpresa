/* js/citta-automatica.js — 4 nov 2026 (decisione di Alessio)
 *
 * La home nazionale resta l'ingresso (e' quella che vede Google), ma la
 * pagina della citta' deve aprirsi il piu' possibile da sola:
 *
 *  1. Chi ha GIA' scelto una citta' (localStorage ti_citta_scelta, la scrive
 *     anche js/citta-obbligatoria.js) entrando su trovaimpresa.com va dritto
 *     alla sua pagina citta'. Google non tiene memoria: vede sempre la nazionale.
 *  2. Chi entra la prima volta vede in cima la fascia «Sei a Rieti?», con la
 *     citta' presa dalla connessione (netlify/functions/dove-sei.js).
 *  3. Nella pagina citta' il titolo dice la citta' («L'edilizia a Roma») e c'e'
 *     «Cambia citta'», che porta a /?nazionale=1 e dimentica la scelta.
 *
 * Va caricato nel <head> di index.html, SENZA defer: il rinvio parte prima
 * che la pagina si disegni.
 */
(function () {
  'use strict';
  var CHIAVE = 'ti_citta_scelta';
  var p = new URLSearchParams(location.search);
  var citta = (p.get('citta') || '').trim();
  var bot = /bot|crawl|spider|slurp|google|bing|yandex|lighthouse|headless|facebookexternalhit|preview|pagespeed/i.test(navigator.userAgent || '');

  function leggi() { try { return (localStorage.getItem(CHIAVE) || '').trim(); } catch (e) { return ''; } }
  function scrivi(c) { try { if (c) localStorage.setItem(CHIAVE, c); else localStorage.removeItem(CHIAVE); } catch (e) {} }

  // «Cambia citta'»: si torna alla nazionale e la scelta si dimentica
  if (p.get('nazionale') === '1') scrivi('');

  // 1. rinvio automatico a chi ha gia' una citta'
  var home = location.pathname === '/' || location.pathname === '/index.html';
  if (home && !citta && !p.has('nazionale') && !bot) {
    var mia = leggi();
    if (mia) { location.replace('/?citta=' + encodeURIComponent(mia)); return; }
  }

  // da qui in avanti serve la pagina disegnata
  function pronta(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function stile() {
    if (document.getElementById('ti-qui-css')) return;
    var s = document.createElement('style');
    s.id = 'ti-qui-css';
    s.textContent = [
      '.ti-qui{background:#ff8800;color:#fff;font-family:inherit}',
      '.ti-qui .in{max-width:1240px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}',
      '.ti-qui svg{width:30px;height:30px;flex:0 0 auto}',
      '.ti-qui .tx{font-size:22px;font-weight:800}',
      '.ti-qui a.va{background:#0a2a4d;color:#fff;text-decoration:none;font-weight:800;font-size:19px;padding:13px 26px;border-radius:12px}',
      '.ti-qui button.ca{background:none;border:0;color:#fff;font:inherit;font-size:17px;font-weight:700;text-decoration:underline;cursor:pointer;padding:6px}',
      '@media(max-width:700px){.ti-qui .in{gap:10px;padding:14px 16px}.ti-qui .tx{font-size:20px}',
      '.ti-qui a.va{width:100%;text-align:center;box-sizing:border-box;font-size:18px}}',
      '.ti-dove{background:#ff8800;color:#fff;font-family:inherit}',
      '.ti-dove .in{max-width:1240px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}',
      '.ti-dove svg{width:28px;height:28px;flex:0 0 auto}',
      '.ti-dove .tx{font-size:22px;font-weight:800}',
      '.ti-dove button{background:#0a2a4d;color:#fff;border:0;font:inherit;font-weight:800;font-size:19px;padding:11px 24px;border-radius:12px;cursor:pointer}',
      '@media(max-width:700px){.ti-dove .in{gap:10px;padding:10px 14px}.ti-dove .tx{font-size:19px}.ti-dove button{font-size:17px;padding:10px 18px}}'
    ].join('');
    document.head.appendChild(s);
  }

  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  function nomeBello(c) { return c.charAt(0).toUpperCase() + c.slice(1); }

  // 8 nov 2026: «Cambia citta'» apre subito la finestra per scegliere la
  // citta' (quella di js/citta-obbligatoria.js) e porta alla pagina nuova.
  // Prima mandava alla nazionale e la scelta non si trovava piu'.
  function scegliCitta() {
    function apri() {
      if (!window.TICitta || !window.TICitta.chiedi) { location.href = '/?nazionale=1'; return; }
      window.TICitta.chiedi(function (c) { location.href = '/?citta=' + encodeURIComponent(c); });
    }
    if (window.TICitta) apri(); else window.addEventListener('load', apri);
  }

  // 3. pagina citta': il titolo dice dove sei, e la scelta si ricorda
  function paginaCitta() {
    var nome = nomeBello(citta);
    scrivi(nome);
    stile();
    var h1 = document.querySelector('.hero-h1');
    if (h1) {
      h1.textContent = "L'edilizia a ";
      var sp = document.createElement('span'); sp.className = 'ar'; sp.textContent = nome;
      h1.appendChild(sp);
    }
    var h2 = document.querySelector('.hero-h2');
    if (h2) h2.textContent = 'Imprese, artigiani e professionisti di ' + nome + ' e provincia';
    // 8 nov 2026 (Alessio): «Cambia citta'» sta IN ALTO, sopra il logo, dove
    // lo si cerca. Una fascia arancione: «Stai guardando X» + pulsante.
    var nav = document.querySelector('nav.navbar, nav, header');
    if (nav && !document.querySelector('.ti-dove')) {
      var f = document.createElement('div'); f.className = 'ti-dove';
      var inn = document.createElement('div'); inn.className = 'in'; inn.innerHTML = PIN;
      var tx = document.createElement('span'); tx.className = 'tx'; tx.textContent = 'Stai guardando ' + nome;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Cambia città';
      b.addEventListener('click', scegliCitta);
      inn.appendChild(tx); inn.appendChild(b); f.appendChild(inn);
      nav.insertAdjacentElement('beforebegin', f);
    }
    try { document.title = "L'edilizia a " + nome + ' — imprese e artigiani | TrovaImpresa'; } catch (e) {}
  }

  // 2. prima volta: la fascia «Sei a X?»
  function fascia(nome) {
    var nav = document.querySelector('nav, header');
    if (!nav || document.querySelector('.ti-qui')) return;
    stile();
    var d = document.createElement('div');
    d.className = 'ti-qui';
    var in_ = document.createElement('div'); in_.className = 'in';
    in_.innerHTML = PIN;
    var t = document.createElement('span'); t.className = 'tx'; t.textContent = 'Sei a ' + nome + '?';
    var va = document.createElement('a'); va.className = 'va'; va.href = '/?citta=' + encodeURIComponent(nome);
    va.textContent = 'Vai alla pagina di ' + nome;
    var ca = document.createElement('button'); ca.type = 'button'; ca.className = 'ca'; ca.textContent = 'Cambia città';
    ca.addEventListener('click', function () { scegliCitta(); });
    in_.appendChild(t); in_.appendChild(va); in_.appendChild(ca);
    d.appendChild(in_);
    nav.insertAdjacentElement('afterend', d);
  }

  function cercaPosizione() {
    var giaVisto;
    try { giaVisto = sessionStorage.getItem('ti_dove_sei'); } catch (e) {}
    if (giaVisto !== null && giaVisto !== undefined) { if (giaVisto) fascia(giaVisto); return; }
    var ctl = window.AbortController ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 5000) : null;
    fetch('/.netlify/functions/dove-sei', { signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) {
        if (t) clearTimeout(t);
        var c = d && typeof d.citta === 'string' ? d.citta : '';
        try { sessionStorage.setItem('ti_dove_sei', c); } catch (e) {}
        if (c) fascia(c);
      })
      .catch(function () {});
  }

  pronta(function () {
    if (citta) { paginaCitta(); return; }
    if (p.get('scegli') === '1') { scegliCitta(); return; }
    if (home && !bot && !p.has('nazionale')) cercaPosizione();
  });
})();
