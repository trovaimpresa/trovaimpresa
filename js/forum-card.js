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
      '.fx{background:#fff;border-radius:20px;padding:20px 22px;margin-bottom:20px;box-shadow:0 4px 16px rgba(0,0,0,.08);border-top:4px solid #e8733a}' +
      '.fx-t{display:flex;align-items:center;gap:10px;margin-bottom:2px}.fx-t h3{font-family:"Playfair Display",Georgia,serif;font-size:1.2rem;color:#0a2a4d;margin:0}' +
      '.fx-b{background:#c0392b;color:#fff;font-weight:700;font-size:.8rem;border-radius:12px;padding:2px 9px}' +
      '.fx-s{color:#5b6b80;font-size:.9rem;margin-bottom:8px}' +
      '.fx-lista{max-height:272px;overflow-y:auto;overscroll-behavior:contain}' +
      '.fx-r{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #eef1f5}' +
      '.fx-av{flex:none;width:40px;height:40px;border-radius:50%;background:#0066ff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}' +
      '.fx-tx{flex:1;min-width:0;color:#12233a;font-size:.95rem}.fx-ti{color:#2b3b50;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fx-tx small{color:#5b6b80;font-size:.82rem}' +
      '.fx-rs{flex:none;background:#e8733a;color:#fff!important;font-weight:800;text-decoration:none;border-radius:22px;padding:10px 20px;font-size:.95rem}' +
      '.fx-tutto{display:block;text-align:center;margin-top:10px;color:#0066ff;font-weight:700;text-decoration:none;font-size:.93rem}' +
      '.fx-vuoto{padding:14px 0 4px;color:#5b6b80;line-height:1.5;border-top:1px solid #eef1f5}' +
      '@media(max-width:600px){.fx{padding:16px}.fx-r{flex-wrap:wrap}.fx-rs{width:100%;text-align:center}.fx-ti{white-space:normal}}' +
      'body.theme-dark .fx{background:#1e2a3a}body.theme-dark .fx-t h3,body.theme-dark .fx-tx,body.theme-dark .fx-ti{color:#e8eef6}body.theme-dark .fx-r,body.theme-dark .fx-vuoto{border-color:#2c3b50}' +
      '</style><div class="fx"><div class="fx-t"><span style="font-size:1.3rem">💬</span><h3>Forum Edilizia</h3>' +
      (nuove ? '<span class="fx-b">' + nuove + (nuove === 1 ? ' nuova' : ' nuove') + '</span>' : '') + '</div>' +
      '<div class="fx-s">Richieste dei clienti per il tuo mestiere e la tua zona</div>' +
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
