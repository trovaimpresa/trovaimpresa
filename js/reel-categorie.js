/* 9 nov 2026 — I REEL PER CATEGORIA (artigiano, impresa, professionisti, clienti).
   Scelta di Alex: un video per chi guarda, nelle pagine di iscrizione, nella
   home prima di scegliere, nel Forum, in Lavoro Edilizia e nella pagina del
   Gestionale. Il video generico («Cos'è TrovaImpresa») resta dov'è.
   Come si usa: nella pagina si mette un segnaposto
     <div data-ti-reel="artigiano,impresa,professionisti,clienti"></div>
   e si carica questo file. Con UN solo nome si disegna la carta orizzontale
   (pagine di iscrizione), con più nomi la fila di carte verticali.
   I video stanno in /video/reel-<nome>.mp4 (+ -poster.jpg).
   Non si carica mai due volte; se qualcosa va storto la pagina resta com'è. */
(function () {
  'use strict';
  if (window.__tiReel) return;
  window.__tiReel = true;

  var REEL = {
    artigiano:      { nome: 'Artigiano', per: 'Per gli artigiani', dura: '35 secondi', go: '/registrazione-artigiano.html', goTxt: 'Iscriviti gratis' },
    impresa:        { nome: 'Impresa edile', per: 'Per le imprese edili', dura: '35 secondi', go: '/registrazione-impresa.html', goTxt: 'Iscriviti gratis' },
    professionisti: { nome: 'Professionista', per: 'Per geometri, architetti e ingegneri', dura: '38 secondi', go: '/registrazione-professionista.html', goTxt: 'Iscriviti gratis' },
    clienti:        { nome: 'Cliente', per: 'Per chi cerca un\'impresa', dura: '33 secondi', go: '/', goTxt: 'Cerca un\'impresa' }
  };

  var CSS =
    '.ti-reel{box-sizing:border-box;max-width:1100px;margin:44px auto;padding:34px 40px;border-radius:22px;color:#fff;font-family:inherit;text-align:left;' +
      'background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);' +
      'background-size:40px 40px;border:3px solid #ff8800 !important;box-shadow:0 12px 30px rgba(0,0,0,.25) !important;' +
      'display:flex;align-items:center;justify-content:space-between;gap:28px}' +
    '.ti-reel *{box-sizing:border-box}' +
    '.ti-reel > div,.ti-reel .trl-su,.ti-reel .trl-h,.ti-reel .trl-p{border:0 !important;background:none !important;box-shadow:none !important;padding-left:0;padding-right:0}' +
    '.ti-reel .trl-h::before,.ti-reel .trl-h::after,.ti-reel > div::before,.ti-reel > div::after{display:none !important;content:none !important}' +
    '.ti-reel .trl-su{font-size:15px;font-weight:800;color:#ffb27a;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px}' +
    '.ti-reel .trl-h{font-size:32px;line-height:1.15;font-weight:900;color:#fff !important;margin:0 0 8px}' +
    '.ti-reel .trl-p{font-size:18px;line-height:1.4;font-weight:600;color:#fff !important;opacity:.95;margin:0}' +
    '.ti-reel .trl-btns{flex:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}' +
    '.ti-reel .trl-btns.uno{grid-template-columns:1fr}' +
    '.ti-reel .trl-btn{display:inline-flex;align-items:center;gap:14px;background:#fff;color:#0a2a4d;border:0;border-radius:16px;' +
      'padding:12px 22px 12px 12px;cursor:pointer;font-family:inherit;text-align:left;box-shadow:0 8px 22px rgba(0,0,0,.3)}' +
    '.ti-reel .trl-btn:hover{box-shadow:0 0 0 3px #ff8800,0 8px 22px rgba(0,0,0,.3)}' +
    '.ti-reel .trl-btn b{flex:none;display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:#ff8800;color:#fff;' +
      'font-size:26px;padding-left:4px;animation:trlPulsa 2s infinite}' +
    '@keyframes trlPulsa{0%,100%{box-shadow:0 0 0 0 rgba(255,136,0,.6)}50%{box-shadow:0 0 0 12px rgba(255,136,0,0)}}' +
    '.ti-reel .trl-btn span{font-size:21px;font-weight:900;line-height:1.15}' +
    '.ti-reel .trl-btn small{display:block;font-size:15px;font-weight:600;color:#3b4a5c}' +
    '.ti-reel.uno{max-width:680px;margin:0 auto 24px;padding:22px 24px;flex-direction:column;align-items:stretch;gap:16px}' +
    '.ti-reel.uno .trl-h{font-size:25px}.ti-reel.uno .trl-p{font-size:17px}' +
    '#ti-reel-modale{display:none;position:fixed;inset:0;z-index:99999;background:rgba(5,15,30,.85);align-items:center;justify-content:center;padding:16px}' +
    '#ti-reel-modale.on{display:flex}' +
    '#ti-reel-modale .trm-box{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}' +
    '#ti-reel-modale video{height:min(80vh,760px);max-width:92vw;aspect-ratio:9/16;border-radius:18px;background:#000}' +
    '#ti-reel-modale .trm-x{position:absolute;top:-14px;right:-14px;width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#0a2a4d;' +
      'font-size:22px;font-weight:900;cursor:pointer;z-index:2;box-shadow:0 4px 12px rgba(0,0,0,.4)}' +
    '#ti-reel-modale .trm-go{background:#ff8800;color:#fff;text-decoration:none;font-weight:900;font-size:20px;padding:14px 36px;border-radius:14px;font-family:inherit}' +
    '@media (max-width:1000px){.ti-reel{flex-direction:column;align-items:stretch;gap:20px}}' +
    '@media (max-width:760px){.ti-reel{padding:24px 16px;margin:30px 12px;gap:18px}' +
      '.ti-reel .trl-h{font-size:25px}.ti-reel .trl-p{font-size:16px}' +
      '.ti-reel .trl-btns{grid-template-columns:1fr}.ti-reel .trl-btn span{font-size:19px}' +
      '.ti-reel.uno{margin:0 0 20px}' +
      '#ti-reel-modale video{height:auto;width:88vw;max-height:72vh}#ti-reel-modale .trm-x{top:-8px;right:-4px}}';

  function chiudi() {
    var m = document.getElementById('ti-reel-modale');
    if (!m) return;
    m.classList.remove('on');
    var v = m.querySelector('video');
    if (v) { v.pause(); }
  }

  function apri(chiave) {
    var r = REEL[chiave];
    if (!r) return;
    var m = document.getElementById('ti-reel-modale');
    if (!m) {
      m = document.createElement('div');
      m.id = 'ti-reel-modale';
      m.innerHTML = '<div class="trm-box"><button type="button" class="trm-x" aria-label="Chiudi">&#10005;</button>' +
        '<video controls playsinline preload="none"></video><a class="trm-go" href="/"></a></div>';
      m.addEventListener('click', function (e) { if (e.target === m) chiudi(); });
      m.querySelector('.trm-x').addEventListener('click', chiudi);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudi(); });
      document.body.appendChild(m);
    }
    var v = m.querySelector('video');
    v.poster = '/video/reel-' + chiave + '-poster.jpg';
    v.src = '/video/reel-' + chiave + '.mp4';
    var go = m.querySelector('.trm-go');
    go.href = r.go;
    go.innerHTML = r.goTxt + ' &rarr;';
    /* sulla pagina di iscrizione il pulsante chiude e basta: sei già nel posto giusto */
    var qui = location.pathname.replace(/\/$/, '') === r.go.replace(/\/$/, '') ||
      location.pathname.replace(/\.html$/, '') === r.go.replace(/\.html$/, '');
    go.style.display = qui ? 'none' : '';
    m.classList.add('on');
    try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
  }

  function bottone(chiave, solo) {
    var r = REEL[chiave];
    return '<button type="button" class="trl-btn" data-reel="' + chiave + '"><b>&#9654;</b><span>' +
      (solo ? 'Guarda il video' : r.nome) + '<small>' + (solo ? 'Come funziona, in ' + r.dura : 'Il video in ' + r.dura) + '</small></span></button>';
  }

  function disegna(el) {
    var nomi = (el.getAttribute('data-ti-reel') || '').split(',').map(function (s) { return s.trim(); })
      .filter(function (k) { return REEL[k]; });
    if (!nomi.length) return;
    el.classList.add('ti-reel');
    if (nomi.length === 1) {
      var r = REEL[nomi[0]];
      el.classList.add('uno');
      el.innerHTML = '<div><div class="trl-su">' + r.per + '</div><h2 class="trl-h">Prima di iscriverti, guarda come funziona</h2></div>' +
        '<div class="trl-btns uno">' + bottone(nomi[0], true) + '</div>';
    } else {
      var su = el.getAttribute('data-titolo-su') || 'Un video per ognuno';
      var h = el.getAttribute('data-titolo') || 'Guarda il video giusto per te';
      var p = el.getAttribute('data-testo') || 'Scegli chi sei: ti facciamo vedere come funziona TrovaImpresa per te.';
      el.innerHTML = '<div><div class="trl-su">' + su + '</div><h2 class="trl-h">' + h + '</h2><p class="trl-p">' + p + '</p></div>' +
        '<div class="trl-btns">' + nomi.map(function (k) { return bottone(k, false); }).join('') + '</div>';
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-reel]');
      if (b) apri(b.getAttribute('data-reel'));
    });
  }

  function avvio() {
    try {
      var posti = document.querySelectorAll('[data-ti-reel]');
      if (!posti.length) return;
      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);
      for (var i = 0; i < posti.length; i++) disegna(posti[i]);
      /* data-dopo-promo: la fila va subito SOTTO il riquadro «Cos'è TrovaImpresa»
         (lo mette js/promo-pagine.js, che arriva dopo): si aspetta fino a 6 s */
      var giri = 0;
      (function sposta() {
        var promo = document.getElementById('ti-video-promo');
        var d = document.querySelector('[data-ti-reel][data-dopo-promo]');
        if (!d) return;
        if (promo && promo.parentNode) { promo.parentNode.insertBefore(d, promo.nextSibling); return; }
        if (++giri < 30) setTimeout(sposta, 200);
      })();
    } catch (e) { /* la pagina non si rompe mai per i reel */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
