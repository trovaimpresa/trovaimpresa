/* 15 nov 2026 — L'INVITO A METTERE L'APP SUL TELEFONO
   Una striscia in basso, SOLO sul telefono:
   - sul sito: «Metti TrovaImpresa sul telefono» (icona con la i)
   - nel gestionale: «Metti il Gestionale sul telefono» (icona coi petali)
   Non compare: sul computer, dentro l'app gia' installata, a chi l'ha chiusa
   con la X (non torna piu'), dentro i browser di Facebook/Instagram/WhatsApp
   (li' non si puo' installare niente).
   Aspetta che il banner dei cookie sia chiuso, per non coprirlo.
   iPhone: «Come si fa» apre i 3 passaggi (Condividi -> Aggiungi alla Home).
   Android (Chrome): «Installa» fa comparire la finestra di installazione vera.
   Per vederla sul computer, per prova: aggiungere ?prova-app=1 all'indirizzo. */
(function () {
  var prova = /[?&]prova-app=1/.test(location.search);
  var gest = /^\/gestionale-(app|noleggio)(\.html)?$/.test(location.pathname);
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
