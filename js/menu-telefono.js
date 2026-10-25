/* 25 ott 2026 — IL MENU «☰ Menu» SUL TELEFONO, COME NELLA HOME.
   Forum, Lavoro Edilizia e Gestionale sul telefono nascondevano tutte le voci
   del menu: da li' non si arrivava ad altre pagine. Questo file aggiunge lo
   stesso bottone della home (stesse misure e colori) e, toccandolo, apre le
   voci gia' scritte nella pagina. Non scrive voci nuove: mostra quelle che ci sono.
   Sul computer il bottone non esiste (display:none). */
(function () {
  'use strict';
  var fs = document.querySelector('.fs-nav .in');            /* Forum e Lavoro Edilizia */
  var ge = document.querySelector('.navbar .menu');          /* Gestionale */
  var dove = fs || ge;
  if (!dove || document.getElementById('menu-tel-btn')) return;
  var limite = fs ? 1099 : 760;   /* sotto questa larghezza le voci erano nascoste */
  var barra = fs ? document.querySelector('.fs-nav') : document.querySelector('.navbar');

  var css = document.createElement('style');
  css.textContent =
    '#menu-tel-btn{display:none}' +
    '@media(max-width:' + limite + 'px){' +
    /* il bottone: copiato da .nav-menu-btn della home */
    '#menu-tel-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;margin-left:auto;flex-shrink:0;cursor:pointer;' +
    'font-family:inherit;font-size:13px;font-weight:700;color:#0a2a4d;background:#fff;border:2px solid #0a2a4d;border-radius:8px;padding:6px 10px;white-space:nowrap}' +
    /* il menu aperto: una voce per riga, grandi e facili da toccare */
    '.menu-aperto .fs-links{display:flex !important;flex-direction:column;align-items:stretch;width:100%;flex-basis:100%;order:20;gap:0;margin-top:8px;border-top:3px solid #0a2a4d}' +
    '.menu-aperto .fs-links a.hide,.menu-aperto .menu a.solo-grande{display:block !important;width:100%;box-sizing:border-box;padding:13px 4px !important;font-size:17px !important;font-weight:800 !important;' +
    'color:#0a2a4d !important;background:none !important;border:0 !important;border-bottom:1px solid #d6e2f5 !important;border-radius:0 !important;text-align:left;margin:0 !important}' +
    '.menu-aperto .fs-links a.on{color:#ff8800 !important}' +
    '.menu-aperto .fs-links a.acc,.menu-aperto .menu a.btn-accedi{display:block !important;width:100%;box-sizing:border-box;text-align:center;margin:8px 0 0 !important;padding:12px 14px !important;font-size:16px !important;font-weight:800 !important;' +
    'border:2px solid #0a2a4d !important;border-radius:10px !important;color:#0a2a4d !important;background:#fff !important}' +
    '.menu-aperto .menu{display:flex !important;flex-direction:column;align-items:stretch;width:100%;flex-basis:100%;order:20;margin-top:8px;border-top:3px solid #0a2a4d}' +
    '.menu-aperto .menu .frase-corta{display:none !important}.menu-aperto .menu .frase-lunga{display:inline !important}' +
    (ge ? '.navbar{flex-wrap:wrap}' : '') +
    '}';
  document.head.appendChild(css);

  var b = document.createElement('button');
  b.type = 'button';
  b.id = 'menu-tel-btn';
  b.setAttribute('aria-expanded', 'false');
  b.innerHTML = '&#9776; Menu';
  b.addEventListener('click', function () {
    var aperto = barra.classList.toggle('menu-aperto');
    b.setAttribute('aria-expanded', aperto ? 'true' : 'false');
    b.innerHTML = aperto ? '&#10005; Chiudi' : '&#9776; Menu';
  });
  if (fs) {
    var logo = fs.querySelector('.fs-logo');
    logo && logo.nextSibling ? fs.insertBefore(b, logo.nextSibling) : fs.appendChild(b);
  } else {
    barra.insertBefore(b, ge);
  }
})();
