/* VISTI SU FACEBOOK (24 nov 2026, passo 4 deciso con Alex)
   - Home citta' (index.html?citta=X): riquadro «Visti su Facebook a X» con le
     ultime 3 imprese di quella citta' uscite nella Vetrina della pagina.
     Si mette sotto «Cerchi idee per casa?» (#le-idee). Se nessuna, non si vede.
   - Pannelli (impresa, artigiano, professionisti): «Sei uscito su Facebook!»
     sotto l'intestazione della dashboard, solo se l'impresa e' gia' uscita.
   I dati arrivano da /.netlify/functions/fb-vetrine. */
(function () {
  var PAGINA = 'https://www.facebook.com/profile.php?id=61575390415610';
  var MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  function data(g) { var p = String(g).split('-'); return parseInt(p[2], 10) + ' ' + MESI[parseInt(p[1], 10) - 1]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function stile() {
    if (document.getElementById('vfb-stile')) return;
    var st = document.createElement('style'); st.id = 'vfb-stile';
    st.textContent =
      '.vfb-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;margin:6px 0 20px}' +
      '.vfb-c{display:block;background:#fff;border:1px solid var(--ti-bd,#dde3ea);border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 4px 14px rgba(10,42,77,.07)}' +
      '.vfb-c img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#eef2f7}' +
      '.vfb-t{padding:14px 16px 16px}.vfb-t b{display:block;font-size:19px;color:#0a2a4d;line-height:1.25}' +
      '.vfb-t span{display:block;font-size:16px;color:#475569;margin-top:3px}' +
      '.vfb-d{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:15px;font-weight:700;color:#1877f2;background:#e8f1fe;border-radius:999px;padding:5px 11px;font-style:normal}' +
      '.vfb-b{text-align:center}.vfb-b a{display:inline-block}' +
      '@media(max-width:600px){.vfb-g{grid-template-columns:1fr}.vfb-c+.vfb-c{display:grid;grid-template-columns:120px 1fr}.vfb-c+.vfb-c img{height:100%;aspect-ratio:auto}}' +
      '.vfb-pan{background:#fff;border:1px solid #dde3ea;border-top:5px solid #1877f2;border-radius:16px;padding:22px 24px;margin:18px 0;box-shadow:0 8px 24px rgba(10,42,77,.09)}' +
      '.vfb-pan h3{font-size:23px;color:#0a2a4d;margin:0 0 6px}.vfb-pan p{font-size:17px;color:#1a2f47;margin:0 0 14px;line-height:1.5}' +
      '.vfb-pan .vfb-go{display:inline-block;background:#1877f2;color:#fff;font-weight:800;font-size:17px;padding:13px 22px;border-radius:10px;text-decoration:none}' +
      '.vfb-pan small{display:block;font-size:15px;color:#475569;margin-top:14px}';
    document.head.appendChild(st);
  }

  // ---- Home citta'
  var citta = new URLSearchParams(location.search).get('citta');
  var ancora = document.getElementById('le-idee');
  if (citta && ancora) {
    fetch('/.netlify/functions/fb-vetrine?citta=' + encodeURIComponent(citta)).then(function (r) { return r.json(); }).then(function (d) {
      var L = (d && d.imprese || []).filter(function (x) { return x.foto; });
      if (!L.length) return;
      stile();
      var s = document.createElement('section');
      s.className = 'hcard'; s.id = 'visti-fb'; s.style.cssText = '--hc:#1877f2;--hb:#f0f6ff;';
      s.innerHTML = '<div class="hcard-h"><span class="hcard-k">📣 Su Facebook</span><h2>Visti su Facebook a ' + esc(citta) + '</h2>' +
        '<p class="hcard-s">Ogni giorno presentiamo sulla nostra pagina un\'impresa con le foto dei suoi lavori.</p></div>' +
        '<div class="vfb-g">' + L.map(function (x) {
          return '<a class="vfb-c" href="/profilo-impresa.html?id=' + x.id + '"><img src="' + esc(x.foto) + '" alt="' + esc(x.nome) + '" loading="lazy">' +
            '<div class="vfb-t"><b>' + esc(x.nome) + '</b><span>' + esc(x.mestiere) + '</span><em class="vfb-d">f &nbsp;Uscita il ' + data(x.giorno) + '</em></div></a>';
        }).join('') + '</div>' +
        '<div class="vfb-b"><a class="posto-btn gest-btn" href="' + PAGINA + '" target="_blank" rel="noopener">Segui la pagina Facebook</a></div>';
      ancora.after(s);
    }).catch(function () {});
  }

  // ---- Pannelli: impresaCorrente lo riempie la pagina dopo il login
  var hero = document.getElementById('dash-hero');
  if (hero) {
    var giri = 0;
    var t = setInterval(function () {
      giri++;
      var imp = (typeof impresaCorrente !== 'undefined') ? impresaCorrente : null; // eslint-disable-line no-undef
      if (giri > 60) return clearInterval(t);
      if (!imp || !imp.nome_attivita && !imp.piano) return;
      clearInterval(t);
      fetch('/.netlify/functions/fb-vetrine?impresa=' + encodeURIComponent(imp.id)).then(function (r) { return r.json(); }).then(function (d) {
        if (!d || !d.uscita || document.getElementById('vfb-pan')) return;
        stile();
        var b = document.createElement('div');
        b.className = 'vfb-pan'; b.id = 'vfb-pan';
        b.innerHTML = '<h3>📣 Sei uscito su Facebook!</h3><p>Il <b>' + data(d.uscita) + '</b> abbiamo presentato la tua impresa sulla pagina <b>Trova impresa</b>, con le foto dei tuoi lavori.</p>' +
          '<a class="vfb-go" href="' + PAGINA + '" target="_blank" rel="noopener">Guarda la pagina Facebook</a>' +
          '<small>Più foto metti nei tuoi lavori, più belle vengono le tue vetrine.</small>';
        hero.after(b);
      }).catch(function () {});
    }, 500);
  }
})();
