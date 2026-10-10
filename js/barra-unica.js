/* js/barra-unica.js — 10 ott 2026
   Barra in alto UGUALE su tutte le pagine (come la home): riga 1 logo + bottone Accedi,
   linea blu scuro, riga 2 gli stessi link. Solo computer (>=1100px): il telefono non cambia.
   Non tocca home, gestionale e forum (hanno gia' la loro barra uguale). Tutto in try/catch. */
(function () {
  try {
    if (window.__barraUnica) return;
    window.__barraUnica = 1;
    if (window.innerWidth < 1100) return;

    var LINKS = [
      ['/forum', 'Forum'], ['/gestionale', 'Gestionale'], ['/bandi', 'Bandi e fondi'],
      ['/blog', 'Guide e costi'], ['/offerte-lavoro', 'Bacheca offerte lavoro'],
      ['/candidature-lavoro', 'Bacheca candidature lavoro'], ['/subappalto', 'Subappalti'],
      ['/prezzi', 'Prezzi'], ['/pubblicita', 'Pubblicità']
    ];

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
        '<a class="tb-btn" href="/login-impresa">Accedi al sito TrovaImpresa</a><a class="tb-btn" href="/login-impresa?redirect=gestionale">Accedi al gestionale</a><a class="tb-btn" href="/login-impresa?redirect=forum">Accedi al forum</a></div><div class="tb-links">';
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
