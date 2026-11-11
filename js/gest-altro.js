/* =====================================================================
   gest-altro.js — TrovaImpresa (11 novembre 2026)

   LA BARRA IN ALTO DELLA SCHERMATA DEI REPARTI: 3 PULSANTI + «Altro».
   Erano 7 pulsanti in fila: troppi da leggere per chi entra. Restano
   fuori tre (Sei anche un professionista?, Dati azienda, Noleggio).
   Gli altri NON si cancellano (regola 7): vanno sotto «Altro ▾», con lo
   stesso nome e la stessa azione di prima.
   I pulsanti arrivano anche dopo (es. «Sei anche un professionista?» lo
   aggiunge js/gest-anche-pro.js): un osservatore li sposta appena nascono.
   ===================================================================== */
(function () {
  'use strict';
  var FUORI = ['anche-pro', 'azienda', 'noleggio'];   /* 11 nov: Alex vuole «Sei anche un professionista?» fuori */
  var stretto = window.matchMedia('(max-width:880px)');

  var CSS = ''
    + '.lt-altro{position:relative;display:inline-block}'
    + '.lt-altro>summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px}'
    + '.lt-altro>summary::-webkit-details-marker{display:none}'
    + '.lt-altro-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:60;min-width:300px;background:#fff;'
    +   'border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.35);padding:8px;display:flex;flex-direction:column;gap:4px}'
    + '#landing .lt-altro-menu .lt-btn{background:#fff !important;color:#0a2a4d !important;border:0 !important;'
    +   'text-align:left;justify-content:flex-start;width:100%;font-size:17px !important;padding:13px 14px !important;'
    +   'min-height:48px;border-radius:10px !important;display:flex;align-items:center;gap:10px}'
    + '#landing .lt-altro-menu .lt-btn:hover{background:#eaf2ff !important;color:#0047b3 !important}'
    + '@media(max-width:880px){.lt-altro-menu{right:auto;left:50%;transform:translateX(-50%);min-width:min(320px,calc(100vw - 32px))}}';

  function stile() {
    if (document.getElementById('lt-altro-css')) return;
    var s = document.createElement('style'); s.id = 'lt-altro-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function sistema() {
    var barra = document.querySelector('#landing .lt-actions:not(.lt-actions--sx)');
    if (!barra) return;
    stile();
    var alt = barra.querySelector('.lt-altro');
    /* sul telefono i pulsanti stanno gia' dentro «Menu», uno sotto l'altro:
       un «Altro» dentro il menu sarebbe un menu nel menu. Li' resta tutto in fila. */
    if (stretto.matches) {
      if (alt) {
        Array.prototype.slice.call(alt.querySelectorAll('.lt-altro-menu > .lt-btn')).forEach(function (b) { barra.insertBefore(b, alt); });
        alt.remove();
      }
      return;
    }
    if (!alt) {
      alt = document.createElement('details');
      alt.className = 'lt-altro';
      alt.innerHTML = '<summary class="lt-btn">Altro <span aria-hidden="true">▾</span></summary><div class="lt-altro-menu"></div>';
      barra.appendChild(alt);
    }
    var menu = alt.querySelector('.lt-altro-menu');
    /* chi e' dei tre ma e' finito nel menu torna fuori: gest-anche-pro.js
       mette il suo pulsante accanto ad «App operaio», che sta nel menu */
    Array.prototype.slice.call(menu.children).forEach(function (b) {
      if (FUORI.indexOf(b.getAttribute('data-action')) >= 0 || FUORI.indexOf(b.id) >= 0) barra.insertBefore(b, barra.firstChild);
    });
    /* chi non e' dei tre va nel menu, nell'ordine in cui stava */
    Array.prototype.slice.call(barra.children).forEach(function (b) {
      if (b === alt || !b.classList.contains('lt-btn')) return;
      if (FUORI.indexOf(b.getAttribute('data-action')) >= 0 || FUORI.indexOf(b.id) >= 0) return;
      menu.appendChild(b);
    });
    if (barra.lastElementChild !== alt) barra.appendChild(alt);   /* «Altro» sempre per ultimo */
  }

  /* cliccando una voce, o fuori, il menu si chiude */
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.lt-altro[open]').forEach(function (d) {
      if (!d.contains(e.target) || e.target.closest('.lt-altro-menu .lt-btn')) d.removeAttribute('open');
    });
  });

  function parti() {
    sistema();
    var barra = document.querySelector('#landing .lt-actions:not(.lt-actions--sx)');
    if (barra && window.MutationObserver) new MutationObserver(function () { sistema(); }).observe(barra, { childList: true, subtree: true });
    try { stretto.addEventListener('change', sistema); } catch (e) { if (stretto.addListener) stretto.addListener(sistema); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti); else parti();
})();
