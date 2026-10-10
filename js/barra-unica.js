/* js/barra-unica.js — 10 ott 2026
   Barra in alto UGUALE su tutte le pagine (come la home): riga 1 logo + bottone Accedi,
   linea blu scuro, riga 2 gli stessi link. Solo computer (>=1100px): il telefono non cambia.
   Non tocca home, gestionale e forum (hanno gia' la loro barra uguale). Tutto in try/catch. */
(function () {
  try {
    if (window.__barraUnica) return;
    window.__barraUnica = 1;
    var LINKS = [
      ['/forum', 'Forum'], ['/gestionale', 'Gestionale'], ['/bandi', 'Bandi e fondi'],
      ['/blog', 'Guide e costi'], ['/offerte-lavoro', 'Bacheca offerte lavoro'],
      ['/candidature-lavoro', 'Bacheca candidature lavoro'], ['/subappalto', 'Subappalti'],
      ['/prezzi', 'Prezzi'], ['/pubblicita', 'Pubblicità']
    ];


    /* ---------- TELEFONO (<1100px): barra uguale su tutte le pagine ---------- */
    var CSSM = '' +
      '.tbm{width:100%;align-self:stretch;flex:0 0 auto;position:sticky;top:0;z-index:99990;background:#fff;font-family:"DM Sans",sans-serif;box-shadow:0 2px 8px rgba(10,42,77,.12)}' +
      '.tbm *{box-sizing:border-box}' +
      '.tbm-top{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:3px solid #0a2a4d;background:#fff}' +
      '.tbm-logo{display:block;line-height:0}.tbm-logo img{display:block;width:150px;height:auto}' +
      '.tbm-mn{font:800 18px/1.2 "DM Sans",sans-serif;color:#0a2a4d;background:#fff;border:2px solid #0a2a4d;border-radius:12px;padding:9px 16px;cursor:pointer}' +
      '.tbm-panel{display:none;max-height:calc(100vh - 70px);overflow:auto;padding:6px 14px 18px;background:#fff}' +
      '.tbm.open .tbm-panel{display:block}' +
      '.tbm-panel a.tbm-btn{display:block;text-align:center;margin:10px 0;padding:13px;border:2px solid #0a2a4d;border-radius:12px;background:#fff;color:#0a2a4d;font:800 19px/1.3 "DM Sans",sans-serif;text-decoration:none}' +
      '.tbm-panel a.tbm-l{display:block;padding:13px 4px;border-bottom:1px solid #dde4ee;color:#0a2a4d;font:800 19px/1.3 "DM Sans",sans-serif;text-decoration:none}' +
      '.tbm-panel a.tbm-l.on{border-left:4px solid #ff8800;padding-left:10px}' +
      /* logo bianco centrato nella parte blu, senza riquadro bianco */
      'html body .hb-logo-centro,html body .hg-logo-centro,html body .fs-logo-centro{display:block !important;width:240px !important;max-width:80% !important;height:auto !important;margin:0 auto 16px !important}' +
      'html body:has(.hb-logo-centro) .hero-logo,html body:has(.hg-logo-centro) .hero-logo,html body .fs-card{display:none !important}' +
      'html body .feature-icon{background:#e7eef8 !important}html body .feature-icon svg{stroke:#0a2a4d !important}';

    function telefono() {
      if (document.querySelector('.tbm')) return;
      var forum = document.querySelector('.fs-nav');
      var el = forum || pagina();
      if (!el) { var fc = document.body.firstElementChild; if (fc && /(^|\s)(logo|logobar|barra)(\s|$)/.test(fc.className || '')) el = fc; }
      if (!el) return;
      var path = location.pathname.replace(/\.html$/, '');
      var logo = /^\/gestionale/.test(path) ? '/img/trovaimpresa-gestionale-logo.svg' : (/^\/forum/.test(path) ? '/img/trovaimpresa-forum-edilizia-logo.svg' : '/img/trovaimpresa-logo.svg');
      var home = /^\/gestionale/.test(path) ? '/gestionale' : (/^\/forum/.test(path) ? '/forum' : '/');
      var h = '<div class="tbm-top"><a class="tbm-logo" href="' + home + '"><img src="' + logo + '" alt="TrovaImpresa"></a><button type="button" class="tbm-mn" aria-expanded="false">&#9776; Menu</button></div><div class="tbm-panel">' +
        '<a class="tbm-btn" href="' + (path === '/' || path === '/index' ? '/login-impresa' : '/') + '">Accedi al sito TrovaImpresa</a>' +
        '<a class="tbm-btn" href="' + (/^\/gestionale/.test(path) ? '/login-impresa?redirect=gestionale' : '/gestionale') + '">Accedi al gestionale</a>' +
        '<a class="tbm-btn" href="' + (/^\/forum/.test(path) ? '/login-impresa?redirect=forum' : '/forum') + '">Accedi al forum</a>';
      LINKS.forEach(function (l) { h += '<a class="tbm-l' + (path === l[0] ? ' on' : '') + '" href="' + l[0] + '">' + l[1] + '</a>'; });
      var pren = document.querySelector('#nav-prenota');
      if (pren) h = h.replace('<a class="tbm-btn" href="/">', '<a class="tbm-btn tbm-pren" href="#">' + (pren.textContent || 'Prenota').trim() + '</a><a class="tbm-btn" href="/">');
      h += '</div>';
      var st = document.createElement('style');
      st.textContent = '@media(max-width:1099px){' + CSSM +
        (forum ? '.fs-nav .fs-logo,.fs-nav .fs-links{display:none !important}' : '') + '}';
      document.head.appendChild(st);
      var bar = document.createElement('div');
      bar.className = 'tbm';
      bar.innerHTML = h;
      if (!forum) el.style.setProperty('display', 'none', 'important');
      document.body.insertBefore(bar, document.body.firstChild);
      var pb = bar.querySelector('.tbm-pren');
      if (pb) pb.addEventListener('click', function (e) { e.preventDefault(); bar.classList.remove('open'); pren.click(); });
      bar.querySelector('.tbm-mn').addEventListener('click', function () {
        var o = bar.classList.toggle('open');
        this.setAttribute('aria-expanded', o ? 'true' : 'false');
        this.innerHTML = o ? '&#10005; Chiudi' : '&#9776; Menu';
      });
    }

    if (window.innerWidth < 1100) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', telefono);
      else telefono();
      return;
    }

    var CSS = '' +
      '.tb-bar{display:block !important;position:static !important;float:none !important;width:auto !important;max-width:none !important;height:auto !important;min-height:0 !important;margin:0 !important;padding:10px 40px 0 !important;background:#fff !important;border:0 !important;box-shadow:none !important;text-align:left !important;font-family:"DM Sans",sans-serif !important}' +
      '.tb-bar .tb-top{display:flex;align-items:center;gap:22px}' +
      '.tb-bar .tb-logo{display:block;width:268px;flex:0 0 268px;margin:0;padding:0}' +
      '.tb-bar .tb-logo img{display:block;width:268px;height:auto;max-width:none;margin:0}' +
      '.tb-bar a.tb-btn{display:inline-block;margin:0;font-size:21px;font-weight:800;line-height:1.35;padding:13px 26px;border-radius:12px;border:2px solid #0a2a4d;background:#fff;color:#0a2a4d;text-decoration:none;white-space:nowrap;font-family:inherit}' +
      '.tb-bar a.tb-btn:hover{background:#0a2a4d;color:#fff}' +
      '.tb-bar .tb-links{display:flex;justify-content:space-between;border-top:3px solid #0a2a4d;margin-top:4px}' +
      '.tb-bar .tb-links a{display:block;margin:0;padding:10px 4px;font-size:clamp(16px,1.05vw,21px);font-weight:800;line-height:1.35;color:#0a2a4d;background:none;border:0;border-radius:0;border-bottom:4px solid transparent;text-decoration:none;white-space:nowrap;font-family:inherit}' +
      '.tb-bar .tb-links a:hover,.tb-bar .tb-links a.on{border-bottom-color:#ff8800}';

    function pagina() {
      var b = document.querySelector('nav.navbar');
      if (b) return b;
      var cand = document.querySelectorAll('header, nav'), i, e;
      for (i = 0; i < cand.length; i++) {
        e = cand[i];
        if (e.closest('main,article,footer,section') ) continue;
        if (e.querySelector('a[href="/"] img, a[href="/"] svg, a[href="/index.html"] img, img[src*="logo"], .logo, .nav-logo, .ti-accedi')) return e;
      }
      return null;
    }

    function costruisci() {
      if (document.querySelector('.tb-bar,.nav-std,#nav-links,.fs-nav,#nav-prenota')) return;
      var el = pagina();
      if (!el) return;
      var path = location.pathname.replace(/\.html$/, '');
      var h = '<div class="tb-top"><a class="tb-logo" href="/"><img src="/img/trovaimpresa-logo.svg" alt="TrovaImpresa"></a>' +
        '<a class="tb-btn" href="/login-impresa">Accedi al sito TrovaImpresa</a><a class="tb-btn" href="/login-impresa?redirect=gestionale">Accedi al gestionale</a><a class="tb-btn" href="/login-impresa">Accedi al forum</a></div><div class="tb-links">';
      LINKS.forEach(function (l) {
        h += '<a href="' + l[0] + '"' + (path === l[0] ? ' class="on"' : '') + '>' + l[1] + '</a>';
      });
      h += '</div>';
      var st = document.createElement('style');
      st.textContent = '@media(min-width:1100px){' + CSS + '}';
      document.head.appendChild(st);
      el.className = 'tb-bar';
      el.removeAttribute('style');
      el.innerHTML = h;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', costruisci);
    else costruisci();
  } catch (e) {}
})();
