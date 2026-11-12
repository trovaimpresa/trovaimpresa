/* 7 nov 2026 — VIDEO «Cos'è TrovaImpresa» + FASCIA NEGOZI su TUTTE le pagine
   pubbliche indicizzate (città, mestiere+città, guide, blog, gestionale…).
   Scelta di Alex del 7 nov: «mettilo anche nelle 106 città e in tutte le
   pagine indicizzate… anche la pubblicità Moulinex e Comet, lavoro completo».
   Si carica da cookie-banner.js (già su quasi tutte le pagine pubbliche),
   e a mano nelle 27 pagine del gestionale che il banner non ce l'hanno.
   Cosa fa, prima del <footer>:
   1) un riquadro blu «Guarda il video» che apre il video in una finestra;
   2) la fascia dei negozi (la disegna js/marchi-citta.js).
   Fuori: pagine private, pagine noindex, la home e /iscriviti (hanno già
   il loro video e la loro fascia). Non si carica mai due volte. */
(function () {
  'use strict';
  if (window.__tiPromoPagine) return;
  window.__tiPromoPagine = true;

  var VIDEO = '/video/video-trovaimpresa.mp4';
  var POSTER = '/video/video-trovaimpresa-poster.jpg';

  function esclusa() {
    var p = location.pathname || '/';
    if (p === '/' || p === '/index.html' || p === '/index') return true;
    if (/^\/(admin|pannello-|login-|registrazione-|iscriviti|accedi|conferma|attiva-profilo|cancella-iscrizione|email-|gestionale-(app|negozio|noleggio|operatore|config|invito)|demo-|preventivo-pdf|stampa)/i.test(p)) return true;
    var r = document.querySelector('meta[name="robots"]');
    if (r && /noindex/i.test(r.getAttribute('content') || '')) return true;
    return false;
  }

  var CSS =
    '#ti-video-promo{box-sizing:border-box;max-width:1100px;margin:44px auto;padding:34px 40px;border-radius:22px;color:#fff;' +
      'background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);' +
      'background-size:40px 40px;display:flex;align-items:center;justify-content:space-between;gap:28px;font-family:inherit;text-align:left}' +
    '#ti-video-promo *{box-sizing:border-box}' +
    /* le pagine hanno i loro stili su section/div/h2 (righe, bordi, ::before): qui si azzerano */
    '#ti-video-promo{border:3px solid #ff8800 !important;box-shadow:0 12px 30px rgba(0,0,0,.25) !important}' +
    '#ti-video-promo > div,#ti-video-promo .tvp-su,#ti-video-promo .tvp-h,#ti-video-promo .tvp-p{border:0 !important;background:none !important;box-shadow:none !important;padding-left:0;padding-right:0}' +
    '#ti-video-promo .tvp-h::before,#ti-video-promo .tvp-h::after,#ti-video-promo > div::before,#ti-video-promo > div::after{display:none !important;content:none !important}' +
    '#ti-video-promo .tvp-su{font-size:15px;font-weight:800;color:#ffb27a;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px}' +
    '#ti-video-promo .tvp-h{font-size:32px;line-height:1.15;font-weight:900;color:#fff;margin:0 0 8px}' +
    '#ti-video-promo .tvp-p{font-size:18px;line-height:1.4;font-weight:600;color:#fff;opacity:.95;margin:0}' +
    '#ti-video-promo .tvp-btn{flex:none;display:inline-flex;align-items:center;gap:14px;background:#fff;color:#0a2a4d;border:0;border-radius:16px;' +
      'padding:12px 24px 12px 12px;cursor:pointer;font-family:inherit;text-align:left;box-shadow:0 8px 22px rgba(0,0,0,.3)}' +
    '#ti-video-promo .tvp-btn:hover{box-shadow:0 0 0 3px #ff8800,0 8px 22px rgba(0,0,0,.3)}' +
    '#ti-video-promo .tvp-btn b{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:#ff8800;color:#fff;' +
      'font-size:26px;padding-left:4px;animation:tvpPulsa 2s infinite}' +
    '@keyframes tvpPulsa{0%,100%{box-shadow:0 0 0 0 rgba(255,136,0,.6)}50%{box-shadow:0 0 0 12px rgba(255,136,0,0)}}' +
    '#ti-video-promo .tvp-btn span{font-size:22px;font-weight:900;line-height:1.15}' +
    '#ti-video-promo .tvp-btn small{display:block;font-size:15px;font-weight:600;color:#3b4a5c}' +
    '#ti-video-modale{display:none;position:fixed;inset:0;z-index:99999;background:rgba(5,15,30,.85);align-items:center;justify-content:center;padding:16px}' +
    '#ti-video-modale.on{display:flex}' +
    '#ti-video-modale .tvm-box{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}' +
    '#ti-video-modale video{height:min(80vh,760px);max-width:92vw;aspect-ratio:9/16;border-radius:18px;background:#000}' +
    '#ti-video-modale .tvm-x{position:absolute;top:-14px;right:-14px;width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#0a2a4d;' +
      'font-size:22px;font-weight:900;cursor:pointer;z-index:2;box-shadow:0 4px 12px rgba(0,0,0,.4)}' +
    '#ti-video-modale .tvm-go{background:#ff8800;color:#fff;text-decoration:none;font-weight:900;font-size:20px;padding:14px 36px;border-radius:14px;font-family:inherit}' +
    '@media (max-width:760px){#ti-video-promo{flex-direction:column;align-items:stretch;padding:24px 16px;margin:30px 12px;gap:18px}' +
      '#ti-video-promo .tvp-h{font-size:25px}#ti-video-promo .tvp-p{font-size:16px}' +
      '#ti-video-promo .tvp-btn{width:100%}#ti-video-promo .tvp-btn span{font-size:19px}' +
      '#ti-video-modale video{height:auto;width:88vw;max-height:72vh}#ti-video-modale .tvm-x{top:-8px;right:-4px}}';

  function chiudi() {
    var m = document.getElementById('ti-video-modale');
    if (!m) return;
    m.classList.remove('on');
    var v = m.querySelector('video');
    if (v) v.pause();
  }

  function apri() {
    var m = document.getElementById('ti-video-modale');
    if (!m) {
      m = document.createElement('div');
      m.id = 'ti-video-modale';
      m.innerHTML = '<div class="tvm-box"><button type="button" class="tvm-x" aria-label="Chiudi">&#10005;</button>' +
        '<video src="' + VIDEO + '" poster="' + POSTER + '" controls playsinline preload="none"></video>' +
        '<a class="tvm-go" href="/iscriviti.html">Iscriviti gratis &rarr;</a></div>';
      m.addEventListener('click', function (e) { if (e.target === m) chiudi(); });
      m.querySelector('.tvm-x').addEventListener('click', chiudi);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudi(); });
      document.body.appendChild(m);
    }
    m.classList.add('on');
    var v = m.querySelector('video');
    try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
  }

  function puntoDiInserimento() {
    var f = document.querySelector('footer');
    if (f && f.parentNode) return f;
    return null;
  }

  function avvio() {
    try {
      if (esclusa()) return;
      if (document.getElementById('ti-video-promo') || document.getElementById('v3-modale')) return;

      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);

      var box = document.createElement('section');
      box.id = 'ti-video-promo';
      box.innerHTML = '<div><div class="tvp-su">Clienti, imprese e professionisti</div>' +
        '<h2 class="tvp-h">Cos\'è TrovaImpresa? Guardalo in 40 secondi</h2>' +
        '<p class="tvp-p">Trovi imprese e artigiani in tutta Italia e chiedi preventivi gratis. Se lavori nell\'edilizia, ti iscrivi gratis con il gestionale con AI compreso.</p></div>' +
        '<button type="button" class="tvp-btn"><b>&#9654;</b><span>Guarda il video<small>Come funziona, in 40 secondi</small></span></button>';
      box.querySelector('.tvp-btn').addEventListener('click', apri);

      var f = puntoDiInserimento();
      if (f) f.parentNode.insertBefore(box, f); else document.body.appendChild(box);

      /* la fascia dei negozi: la disegna marchi-citta.js (stesso elenco ovunque) */
      if (!document.getElementById('ti-marchi') && !document.querySelector('script[src*="marchi-citta"]')) {
        var m = document.createElement('script');
        m.src = '/js/marchi-citta.js?v=6';
        m.defer = true;
        document.head.appendChild(m);
      }
    } catch (e) { /* la pagina non si rompe mai per questo riquadro */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
