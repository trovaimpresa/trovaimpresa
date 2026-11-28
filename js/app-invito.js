/* 15 nov 2026 — L'INVITO A METTERE L'APP SUL TELEFONO
   Una striscia in basso, SOLO sul telefono:
   - sul sito: «Metti TrovaImpresa sul telefono» (icona con la i)
   - nel gestionale e nelle sue pagine: «Metti il Gestionale sul telefono» (icona coi petali)
   Non compare: sul computer, dentro l'app gia' installata, a chi l'ha chiusa
   con la X (non torna piu'), dentro i browser di Facebook/Instagram/WhatsApp
   (li' non si puo' installare niente).
   Aspetta che il banner dei cookie sia chiuso, per non coprirlo.
   iPhone: «Come si fa» apre i 3 passaggi (Condividi -> Aggiungi alla Home).
   Android (Chrome): «Installa» fa comparire la finestra di installazione vera.
   Per vederla sul computer, per prova: aggiungere ?prova-app=1 all'indirizzo. */
(function () {
  var prova = /[?&]prova-app=1/.test(location.search);
  // Gestionale o sito? Lo decide l'app che la pagina fa installare (il manifest):
  // cosi' le pagine che presentano il Gestionale invitano al Gestionale.
  var gest = !!document.querySelector('link[rel=manifest][href="/manifest.json"],link[rel=manifest][href="/manifest-noleggio.json"]');
  var CHIAVE = gest ? 'ti-app-invito-gestionale' : 'ti-app-invito-sito';
  var ua = navigator.userAgent || '';
  var iphone = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var dentroSocial = /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp/i.test(ua);
  var installata = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var chiusa = false;
  try { chiusa = localStorage.getItem(CHIAVE) === '1'; } catch (e) {}

  if (!prova && (installata || chiusa || dentroSocial || !(iphone || android))) return;

  var nome = gest ? 'il Gestionale' : 'TrovaImpresa';
  var icona = gest ? '/img/app/gestionale-192.png' : '/img/app/trovaimpresa-192.png';
  var promptAndroid = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptAndroid = e; });

  var css = ''
    + '#ti-app-invito{position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483000;background:#0a2a4d;'
    + 'background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);'
    + 'background-size:40px 40px;color:#fff;border-radius:18px;padding:14px;border:2px solid #ff8800;box-shadow:0 8px 28px rgba(0,0,0,.45);'
    + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;box-sizing:border-box}'
    /* 16 nov 2026 — con un modulo aperto l'invito copriva «Annulla» e «Salva»
       (computo, e le schede del Noleggio a 360 px): finche' c'e' una finestra
       aperta l'invito si fa da parte, e torna quando la chiudi. */
    + 'body:has(.overlay.open) #ti-app-invito,body:has(.tif-ov) #ti-app-invito{display:none}'
    + '#ti-app-invito .r{display:flex;align-items:center;gap:12px}'
    + '#ti-app-invito img.ic{width:56px;height:56px;border-radius:13px;flex:none;border:1px solid rgba(255,255,255,.25)}'
    + '#ti-app-invito .t{flex:1;min-width:0}'
    + '#ti-app-invito .t b{display:block;font-size:19px;line-height:1.25}'
    + '#ti-app-invito .t span{display:block;font-size:16px;opacity:.85;margin-top:3px}'
    + '#ti-app-invito .x{background:none;border:0;color:#fff;font-size:32px;line-height:1;padding:0 4px;opacity:.85;flex:none;align-self:flex-start}'
    + '#ti-app-invito .bt{display:block;width:100%;margin-top:12px;background:#ff8800;color:#fff;border:0;border-radius:12px;font-size:18px;font-weight:700;padding:13px}'
    + '#ti-app-invito ol{margin:14px 0 0;padding:0 0 0 24px;font-size:17px;line-height:1.5}'
    + '#ti-app-invito ol li{margin:6px 0}'
    + '#ti-app-invito ol svg{vertical-align:-4px;margin:0 2px}';

  var condividi = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

  function mostra() {
    if (document.getElementById('ti-app-invito')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'ti-app-invito';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Metti ' + nome + ' sul telefono');
    d.innerHTML = '<div class="r"><img class="ic" src="' + icona + '" alt="">'
      + '<div class="t"><b>Metti ' + nome + ' sul telefono</b><span>Si apre come un\'app, con un tocco</span></div>'
      + '<button class="x" type="button" aria-label="Chiudi">&times;</button></div>'
      + '<button class="bt" type="button">' + (android && !iphone && !prova ? 'Installa' : 'Come si fa') + '</button>';
    document.body.appendChild(d);

    d.querySelector('.x').onclick = function () {
      try { localStorage.setItem(CHIAVE, '1'); } catch (e) {}
      d.remove();
    };
    d.querySelector('.bt').onclick = function () {
      var bt = this;
      if (promptAndroid) {
        promptAndroid.prompt();
        promptAndroid.userChoice.then(function (r) { if (r && r.outcome === 'accepted') d.remove(); });
        return;
      }
      if (d.querySelector('ol')) { d.remove(); return; }
      var ol = document.createElement('ol');
      ol.innerHTML = (iphone || prova)
        ? '<li>Tocca <b>Condividi</b> ' + condividi + ' nella barra di Safari</li>'
          + '<li>Tocca <b>«Aggiungi alla schermata Home»</b></li>'
          + '<li>Tocca <b>«Aggiungi»</b> in alto a destra</li>'
        : '<li>Tocca i <b>tre puntini</b> in alto a destra</li>'
          + '<li>Tocca <b>«Installa app»</b> o <b>«Aggiungi a schermata Home»</b></li>';
      d.insertBefore(ol, bt);
      bt.textContent = 'Ho capito';
    };
  }

  // Aspetta che il banner dei cookie sia chiuso, poi un attimo ancora.
  var giri = 0;
  function quando() {
    var cookie = document.querySelector('.fc-consent-root, .fc-dialog-container');
    var visibile = cookie && cookie.offsetParent !== null;
    if (visibile && giri++ < 120) return setTimeout(quando, 1000);
    setTimeout(mostra, prova ? 0 : 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', quando); else quando();
})();

/* 28 nov 2026 — IL BOTTONE «SCARICA SU APP STORE»
   Un solo posto per tutto il sito: questo file e' gia' caricato da tutte le
   pagine (home, forum, subappalti, gestionale, guide, blog...), quindi il
   bottone si mette da qui e non pagina per pagina.
   Dove compare:
   - in ogni elemento con data-app-store (in cima e nella fascia in mezzo della home);
   - nella fascia della home con data-app-store-sez (resta nascosta finche' e' spento);
   - nel piede di ogni pagina che ha un <footer> (nella home: sotto i dati di Alessio);
   - nel gestionale: in fondo al menu a sinistra (solo sul computer).
   Non compare dentro l'app (sarebbe assurdo: ce l'hai gia').
   ⛔ ACCESO = false finche' Apple non finisce la verifica «operatore commerciale»
      e l'app non si apre davvero nell'App Store. Prima porterebbe a «pagina non trovata».
   Per vederlo da spento, per prova: aggiungere ?prova-appstore=1 all'indirizzo. */
(function () {
  var ACCESO = false;
  var LINK = 'https://apps.apple.com/it/app/trovaimpresa-italia/id6839027320';
  var prova = /[?&]prova-appstore=1/.test(location.search);
  if (!ACCESO && !prova) return;
  var dentroApp = (window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform())
    || !!(window.webkit && webkit.messageHandlers && webkit.messageHandlers.bridge)
    || navigator.standalone === true
    || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (dentroApp && !prova) return;

  var MELA = '<svg width="34" height="40" viewBox="0 0 384 512" aria-hidden="true"><path fill="#fff" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
  var BADGE = '<a class="ti-appstore" href="' + LINK + '" target="_blank" rel="noopener" aria-label="Scarica TrovaImpresa su App Store">'
    + MELA + '<span><small>Scarica su</small><b>App Store</b></span></a>';

  var css = ''
    + '.ti-appstore{display:inline-flex;align-items:center;gap:12px;background:#000;color:#fff!important;border:1px solid #a6a6a6;border-radius:12px;padding:10px 22px 10px 16px;text-decoration:none!important;line-height:1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}'
    + '.ti-appstore:hover{background:#1a1a1a}'
    + '.ti-appstore span{display:flex;flex-direction:column;gap:4px;text-align:left}'
    + '.ti-appstore small{font-size:14px;color:#fff}'
    + '.ti-appstore b{font-size:28px;font-weight:600;color:#fff;letter-spacing:-.5px}'
    + '.ti-appstore-piede{margin:22px 0 4px;text-align:center}'
    + '.ti-appstore-piede .tit{display:block;font-weight:700;font-size:17px;margin-bottom:10px}'
    + '.footer .footer-section .ti-appstore-piede{text-align:left}'
    + '.ti-appstore-menu{margin:16px 2px 6px}'
    + '.ti-appstore-menu .ti-appstore{gap:9px;padding:8px 16px 8px 12px;border-radius:10px}'
    + '.ti-appstore-menu .ti-appstore svg{width:26px;height:31px}'
    + '.ti-appstore-menu .ti-appstore small{font-size:13px}'
    + '.ti-appstore-menu .ti-appstore b{font-size:21px}'
    + '@media(max-width:900px){.ti-appstore-menu{display:none}}'
    + '.hb-app:not(:empty){margin-top:22px}'
    + '[data-app-store-sez]{display:none}'
    + '.ti-appstore-on [data-app-store-sez]{display:block}';

  function metti() {
    if (document.documentElement.classList.contains('ti-appstore-on')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.documentElement.classList.add('ti-appstore-on');

    // 1. i posti segnati nella pagina
    var posti = document.querySelectorAll('[data-app-store]');
    for (var i = 0; i < posti.length; i++) posti[i].innerHTML = BADGE;

    // 2. il piede della pagina
    // l'ultimo <footer>: alcune pagine hanno altri footer dentro le schede
    var tutti = document.querySelectorAll('footer');
    var piede = tutti[tutti.length - 1];
    if (piede) {
      var d = document.createElement('div');
      d.className = 'ti-appstore-piede';
      d.innerHTML = '<span class="tit">Scarica l\'app</span>' + BADGE;
      var colonna = piede.querySelector('.footer-section');
      if (colonna) colonna.appendChild(d);
      else {
        var basso = piede.querySelector('.bot, .footer-bottom');
        if (basso) piede.insertBefore(d, basso); else piede.appendChild(d);
      }
    }

    // 3. il menu a sinistra del gestionale
    var menu = document.querySelector('aside.side');
    if (menu && !menu.querySelector('.ti-appstore-menu')) {
      var m = document.createElement('div');
      m.className = 'ti-appstore-menu';
      m.innerHTML = BADGE;
      menu.appendChild(m);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', metti); else metti();
})();
