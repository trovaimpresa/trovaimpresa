/* Card «Lavoro Edilizia» nel pannello di imprese, artigiani e professionisti — 5 nov 2026.
   Gemella della card del Forum (js/forum-card.js): stessa forma, sta subito sotto,
   e tutte e due stanno SOTTO «Il tuo gestionale» (chiesto da Alex il 5 nov sera).
   Mostra le ultime offerte di lavoro e i subappalti; quelli della SUA regione vengono prima.
   Si legge e basta: il tocco porta all'annuncio. La lista scorre (altezza fissa). */
(function () {
  var URL_SB = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var KEY_SB = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  var box = document.getElementById('lavoro-card');
  if (!box || !window.supabase) return;

  var norm = function (s) { return String(s || '').trim().toLowerCase(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function fa(d) {
    if (!d) return '';
    var m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 60000));
    if (m < 60) return m + ' min fa';
    var h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' ora fa' : ' ore fa');
    var g = Math.round(h / 24); return g === 1 ? 'ieri' : g + ' giorni fa';
  }
  function oggi() { return new Date().toISOString().slice(0, 10); }

  var sb = window.supabase.createClient(URL_SB, KEY_SB);

  function disegna(imp, lista) {
    var chiave = 'ti_lavoro_visto_' + imp.id, visto = 0;
    try { visto = parseInt(localStorage.getItem(chiave), 10) || 0; } catch (e) {}
    var nuovi = lista.filter(function (x) { return new Date(x.quando).getTime() > visto; }).length;
    var righe = lista.map(function (x) {
      return '<div class="lx-r"><div class="lx-av">' + esc(x.sigla) + '</div>' +
        '<div class="lx-tx"><b>' + esc(x.chi) + '</b> ' + esc(x.cosa) + '<div class="lx-ti">' + esc(x.titolo) + '</div>' +
        '<small>' + esc([x.dove, x.mestiere, fa(x.quando)].filter(Boolean).join(' · ')) + '</small></div>' +
        '<a class="lx-rs" data-lx href="' + x.url + '">Vedi</a></div>';
    }).join('');
    box.innerHTML = '<style>' +
      '.lx{background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),radial-gradient(600px 300px at 92% 0%,rgba(0,102,255,.45),transparent 70%);background-size:34px 34px,34px 34px,auto;border-radius:20px;padding:26px 28px 22px;margin-bottom:20px;box-shadow:0 4px 16px rgba(0,0,0,.12);color:#fff}' +
      '.lx-top{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:6px}' +
      '.lx-logo img{height:64px;display:block}' +
      '.lx-t{flex:1;min-width:200px}.lx-t h3{font-family:"Playfair Display",Georgia,serif;font-size:1.7rem;color:#fff;margin:0 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
      '.lx-b{background:#ff8800;color:#fff;font-weight:800;font-size:.8rem;border-radius:12px;padding:3px 10px;font-family:inherit}' +
      '.lx-s{color:#cfe0f7;font-size:1rem}' +
      '.lx-lista{max-height:272px;overflow-y:auto;overscroll-behavior:contain;margin-top:14px;display:grid;gap:10px}' +
      '.lx-r{display:flex;align-items:center;gap:14px;padding:12px 14px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.2);border-radius:14px}' +
      '.lx-av{flex:none;width:40px;height:40px;border-radius:50%;background:#ff8800;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem}' +
      '.lx-tx{flex:1;min-width:0;color:#e6f0ff;font-size:.95rem}.lx-tx b{color:#fff}.lx-ti{color:#fff;font-weight:700;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lx-tx small{color:#a9c9f5;font-size:.82rem}' +
      '.lx-rs{flex:none;background:#ff8800;color:#fff!important;font-weight:800;text-decoration:none;border-radius:12px;padding:10px 20px;font-size:.95rem}.lx-rs:hover{background:#e67a00}' +
      '.lx-tutto{display:inline-block;margin-top:16px;border:2px solid rgba(255,255,255,.55);color:#fff;font-weight:800;text-decoration:none;font-size:.95rem;padding:10px 20px;border-radius:12px}.lx-tutto:hover{background:rgba(255,255,255,.12)}' +
      '.lx-vuoto{margin-top:14px;padding:14px 16px;color:#cfe0f7;line-height:1.5;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:14px}' +
      '@media(max-width:600px){.lx{padding:18px 16px}.lx-logo img{height:52px}.lx-t h3{font-size:1.4rem}.lx-r{flex-wrap:wrap}.lx-rs{width:100%;box-sizing:border-box;text-align:center}.lx-ti{white-space:normal}.lx-tutto{display:block;text-align:center}}' +
      '</style><div class="lx"><div class="lx-top"><div class="lx-logo"><img src="/img/trovaimpresa-lavoro-edilizia-logo-bianco.svg" alt="TrovaImpresa Lavoro Edilizia"></div>' +
      '<div class="lx-t"><h3>Lavoro Edilizia' +
      (nuovi ? '<span class="lx-b">' + nuovi + (nuovi === 1 ? ' nuovo' : ' nuovi') + '</span>' : '') + '</h3>' +
      '<div class="lx-s">Offerte di lavoro e subappalti: prima quelli della tua regione</div></div></div>' +
      (righe ? '<div class="lx-lista">' + righe + '</div>' : '<div class="lx-vuoto">Per ora nessun annuncio. Quando ne arriva uno, lo vedi qui.</div>') +
      '<a class="lx-tutto" data-lx href="/lavoro-edilizia">Vai a Lavoro Edilizia →</a></div>';
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-lx]')) { try { localStorage.setItem(chiave, String(Date.now())); } catch (x) {} }
    });
  }

  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session; if (!s) return;
    return sb.from('imprese').select('id,regione,citta,provincia').eq('user_id', s.user.id).maybeSingle().then(function (ri) {
      var imp = ri.data; if (!imp) return;
      return Promise.all([
        sb.from('offerte_lavoro').select('id,titolo,nome_azienda,citta,provincia,regione,mestiere,data_pubblicazione,created_at').eq('attiva', true)
          .or('data_scadenza_annuncio.is.null,data_scadenza_annuncio.gte.' + oggi()).order('data_pubblicazione', { ascending: false }).limit(40),
        sb.from('subappalti').select('id,tipo,nome_impresa,lavoro,descrizione,citta,regione,mestiere,created_at').eq('attivo', true)
          .order('created_at', { ascending: false }).limit(40)
      ]).then(function (x) {
        var off = (x[0].data || []).map(function (o) {
          return { chi: o.nome_azienda || 'Un\'impresa', cosa: 'cerca personale', sigla: 'LAV', titolo: o.titolo || 'Offerta di lavoro',
            dove: o.citta || o.provincia || o.regione, regione: o.regione, mestiere: o.mestiere, quando: o.data_pubblicazione || o.created_at,
            url: '/offerta-lavoro.html?id=' + encodeURIComponent(o.id) };
        });
        var sub = (x[1].data || []).map(function (a) {
          var offre = norm(a.tipo).indexOf('offr') === 0;
          return { chi: a.nome_impresa || 'Un\'impresa', cosa: offre ? 'offre un subappalto' : 'cerca chi lavora in subappalto', sigla: 'SUB',
            titolo: String(a.lavoro || a.descrizione || 'Subappalto').split('\n')[0], dove: a.citta || a.regione, regione: a.regione, mestiere: a.mestiere, quando: a.created_at,
            url: '/subappalto-annuncio.html?id=' + encodeURIComponent(a.id) };
        });
        var mia = norm(imp.regione);
        var vicino = function (v) { return mia && norm(v.regione + ' ' + v.dove).indexOf(mia) !== -1 ? 1 : 0; };
        var visti = {};
        var tutti = off.concat(sub).filter(function (v) {
          var k = norm(v.chi + '|' + v.titolo); if (visti[k]) return false; visti[k] = 1; return true;
        }).sort(function (a, b) { return (vicino(b) - vicino(a)) || (new Date(b.quando) - new Date(a.quando)); }).slice(0, 30);
        disegna(imp, tutti);
      });
    });
  }).catch(function () {});
})();
