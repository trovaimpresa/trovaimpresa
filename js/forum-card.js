/* Card «Forum Edilizia» nel pannello di imprese, artigiani e professionisti.
   Mostra le richieste dei clienti per il TUO mestiere e la TUA zona, a cui non hai ancora risposto.
   Niente email: l'impresa le vede qui. La lista scorre (altezza fissa) cosi' non diventa mai enorme. */
(function () {
  var URL_SB = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var KEY_SB = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  var box = document.getElementById('forum-card');
  if (!box || !window.supabase) return;

  var norm = function (s) { return String(s || '').trim().toLowerCase(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function fa(d) {
    var m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 60000));
    if (m < 60) return m + ' min fa';
    var h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' ora fa' : ' ore fa');
    var g = Math.round(h / 24); return g === 1 ? 'ieri' : g + ' giorni fa';
  }
  function combacia(imp, q) {
    var ms = [imp.mestiere].concat(imp.mestieri || []).map(norm).filter(Boolean);
    var mq = norm(q.mestiere);
    if (mq && mq !== 'altro' && ms.indexOf(mq) === -1) return false;
    var cq = norm(q.citta);
    if (!cq) return true;
    return [imp.citta, imp.provincia].map(norm).indexOf(cq) !== -1;
  }

  var sb = window.supabase.createClient(URL_SB, KEY_SB);

  function disegna(imp, lista) {
    var chiave = 'ti_forum_visto_' + imp.id, visto = 0;
    try { visto = parseInt(localStorage.getItem(chiave), 10) || 0; } catch (e) {}
    var nuove = lista.filter(function (q) { return new Date(q.confermato_il).getTime() > visto; }).length;
    var righe = lista.map(function (q) {
      var nome = q.nome_pubblico || 'Un cliente';
      return '<div class="fx-r"><div class="fx-av">' + esc(nome.charAt(0).toUpperCase()) + '</div>' +
        '<div class="fx-tx"><b>' + esc(nome) + '</b> ha pubblicato<div class="fx-ti">' + esc(q.titolo) + '</div>' +
        '<small>' + esc([q.citta, q.mestiere, fa(q.confermato_il)].filter(Boolean).join(' · ')) + '</small></div>' +
        '<a class="fx-rs" data-fx href="/forum-richiesta?s=' + encodeURIComponent(q.slug) + '#rispondi">Rispondi</a></div>';
    }).join('');
    box.innerHTML = '<style>' +
      '.fx{background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),radial-gradient(600px 300px at 92% 0%,rgba(0,102,255,.45),transparent 70%);background-size:34px 34px,34px 34px,auto;border-radius:20px;padding:26px 28px 22px;margin-bottom:20px;box-shadow:0 4px 16px rgba(0,0,0,.12);color:#fff}' +
      '.fx-top{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:6px}' +
      '.fx-logo{flex:none;background:#fff;border-radius:14px;padding:8px 14px;box-shadow:0 6px 18px rgba(0,0,0,.25);display:inline-block}.fx-logo img{height:64px;display:block}' +
      '.fx-t{flex:1;min-width:200px}.fx-t h3{font-family:"Playfair Display",Georgia,serif;font-size:1.7rem;color:#fff;margin:0 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
      '.fx-b{background:#ff8800;color:#fff;font-weight:800;font-size:.8rem;border-radius:12px;padding:3px 10px;font-family:inherit}' +
      '.fx-s{color:#cfe0f7;font-size:1rem}' +
      '.fx-lista{max-height:272px;overflow-y:auto;overscroll-behavior:contain;margin-top:14px;display:grid;gap:10px}' +
      '.fx-r{display:flex;align-items:center;gap:14px;padding:12px 14px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.2);border-radius:14px}' +
      '.fx-av{flex:none;width:40px;height:40px;border-radius:50%;background:#ff8800;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}' +
      '.fx-tx{flex:1;min-width:0;color:#e6f0ff;font-size:.95rem}.fx-tx b{color:#fff}.fx-ti{color:#fff;font-weight:700;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fx-tx small{color:#a9c9f5;font-size:.82rem}' +
      '.fx-rs{flex:none;background:#ff8800;color:#fff!important;font-weight:800;text-decoration:none;border-radius:12px;padding:10px 20px;font-size:.95rem}.fx-rs:hover{background:#e67a00}' +
      '.fx-tutto{display:inline-block;margin-top:16px;border:2px solid rgba(255,255,255,.55);color:#fff;font-weight:800;text-decoration:none;font-size:.95rem;padding:10px 20px;border-radius:12px}.fx-tutto:hover{background:rgba(255,255,255,.12)}' +
      '.fx-vuoto{margin-top:14px;padding:14px 16px;color:#cfe0f7;line-height:1.5;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:14px}' +
      '@media(max-width:600px){.fx{padding:18px 16px}.fx-logo img{height:52px}.fx-t h3{font-size:1.4rem}.fx-r{flex-wrap:wrap}.fx-rs{width:100%;box-sizing:border-box;text-align:center}.fx-ti{white-space:normal}.fx-tutto{display:block;text-align:center}}' +
      '</style><div class="fx"><div class="fx-top"><div class="fx-logo"><img src="/img/trovaimpresa-forum-edilizia-logo.svg" alt="TrovaImpresa Forum Edilizia"></div>' +
      '<div class="fx-t"><h3>Forum Edilizia' +
      (nuove ? '<span class="fx-b">' + nuove + (nuove === 1 ? ' nuova' : ' nuove') + '</span>' : '') + '</h3>' +
      '<div class="fx-s">Richieste dei clienti per il tuo mestiere e la tua zona</div></div></div>' +
      (righe ? '<div class="fx-lista">' + righe + '</div>' : '<div class="fx-vuoto">Per ora nessuna richiesta nuova per te. Quando un cliente scrive, la vedi qui.</div>') +
      '<a class="fx-tutto" data-fx href="/forum">Vai al Forum Edilizia →</a></div>';
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-fx]')) { try { localStorage.setItem(chiave, String(Date.now())); } catch (x) {} }
    });
  }

  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session; if (!s) return;
    return sb.from('imprese').select('id,mestiere,mestieri,citta,provincia').eq('user_id', s.user.id).maybeSingle().then(function (ri) {
      var imp = ri.data; if (!imp) return;
      var da = new Date(Date.now() - 60 * 864e5).toISOString();
      return Promise.all([
        sb.from('bacheca_richieste').select('id,slug,titolo,mestiere,citta,nome_pubblico,confermato_il').eq('stato', 'pubblicata').gte('confermato_il', da).order('confermato_il', { ascending: false }).limit(60),
        sb.from('bacheca_risposte').select('richiesta_id').eq('impresa_id', imp.id)
      ]).then(function (x) {
        var fatte = {}; (x[1].data || []).forEach(function (a) { fatte[a.richiesta_id] = 1; });
        var lista = (x[0].data || []).filter(function (q) { return !fatte[q.id] && combacia(imp, q); });
        disegna(imp, lista);
      });
    });
  }).catch(function () {});
})();
