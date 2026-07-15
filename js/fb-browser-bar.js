/* Barra "apri nel browser" mostrata solo dentro i browser interni di
   Facebook / Instagram / Messenger. Aiuta l'utente a passare a Chrome/Safari,
   dove la registrazione funziona senza intoppi. */
(function () {
  var ua = navigator.userAgent || '';
  var isInApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line|MicroMessenger/i.test(ua);
  if (!isInApp) return;

  var isAndroid = /Android/i.test(ua);
  var url = location.href;

  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#0d2a4a;color:#fff;padding:16px;box-shadow:0 -4px 20px rgba(0,0,0,.25);';

  var msg = document.createElement('div');
  msg.style.cssText = 'font-size:14px;line-height:1.4;margin-bottom:10px;text-align:center;';
  msg.innerHTML = '⚠️ Per registrarti apri il sito nel tuo browser (Chrome o Safari).';

  var btn = document.createElement(isAndroid ? 'a' : 'button');
  btn.style.cssText = 'display:block;width:100%;background:#ff8800;color:#fff;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:700;text-align:center;text-decoration:none;cursor:pointer;box-sizing:border-box;';

  if (isAndroid) {
    btn.textContent = '👉 Apri in Chrome';
    btn.href = 'intent://' + location.host + location.pathname + location.search +
               '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
               encodeURIComponent(url) + ';end';
  } else {
    btn.textContent = '📋 Copia il link (poi aprilo su Safari)';
    btn.onclick = function () {
      try { navigator.clipboard.writeText(url); } catch (e) {}
      msg.innerHTML = '✅ Link copiato! Apri <b>Safari</b>, tocca la barra in alto e <b>incolla</b>.<br>Oppure tocca <b>•••</b> in alto a destra → <b>Apri in browser</b>.';
      btn.style.display = 'none';
    };
  }

  var close = document.createElement('div');
  close.textContent = 'Continua qui comunque';
  close.style.cssText = 'text-align:center;font-size:12.5px;color:#cdd9e5;margin-top:10px;text-decoration:underline;cursor:pointer;';
  close.onclick = function () { bar.remove(); };

  bar.appendChild(msg);
  bar.appendChild(btn);
  bar.appendChild(close);
  document.body.appendChild(bar);
})();
