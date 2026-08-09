/* Avviso LEGGERO mostrato solo dentro i browser interni di Facebook / Instagram.
   La registrazione funziona anche qui, quindi è solo un suggerimento opzionale,
   chiudibile e ricordato (non blocca e non allarma). */
(function () {
  var ua = navigator.userAgent || '';
  if (!/FBAN|FBAV|FB_IAB|Instagram|Messenger/i.test(ua)) return;

  // Se l'utente l'ha già chiuso, non ripresentarlo
  try { if (localStorage.getItem('tiHintBrowserChiuso') === '1') return; } catch (e) {}

  var isAndroid = /Android/i.test(ua);
  var url = location.href;

  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#eef2f7;color:#1a2f47;border-top:1px solid #d5dde8;padding:10px 12px;display:flex;align-items:center;gap:10px;font-size:13px;line-height:1.35;box-shadow:0 -2px 10px rgba(0,0,0,.08);';

  var txt = document.createElement('div');
  txt.style.cssText = 'flex:1;';
  txt.innerHTML = '💡 Per comodità puoi aprire il sito in ' + (isAndroid ? 'Chrome' : 'Safari') + '.';

  var open = document.createElement(isAndroid ? 'a' : 'button');
  open.textContent = 'Apri';
  open.style.cssText = 'background:#0066ff;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;';
  if (isAndroid) {
    open.href = 'intent://' + location.host + location.pathname + location.search +
                '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
                encodeURIComponent(url) + ';end';
  } else {
    open.onclick = function () {
      try { navigator.clipboard.writeText(url); } catch (e) {}
      txt.innerHTML = '✅ Link copiato: aprilo in Safari, oppure tocca ••• in alto a destra → Apri in browser.';
      open.style.display = 'none';
    };
  }

  var close = document.createElement('button');
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Chiudi');
  close.style.cssText = 'background:none;border:none;color:#7a8699;font-size:18px;cursor:pointer;padding:0 4px;line-height:1;';
  close.onclick = function () {
    try { localStorage.setItem('tiHintBrowserChiuso', '1'); } catch (e) {}
    bar.remove();
  };

  bar.appendChild(txt);
  bar.appendChild(open);
  bar.appendChild(close);
  document.body.appendChild(bar);
})();
