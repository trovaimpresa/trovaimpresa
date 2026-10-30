/* =====================================================================
   TrovaImpresa — «LA TUA SCHEDA E' COMPLETA AL …%» — 30 ottobre 2026

   Un riquadro in cima al Riepilogo dei tre pannelli (impresa, artigiano,
   professionisti), subito sotto la copertina. Dice quanto e' completa la
   scheda che vedono i clienti e cosa manca, con un tasto per ogni cosa.

   Perche': il 30 ottobre solo →25← schede su →187← erano complete, e un
   terzo delle schede aperte dai clienti non aveva nemmeno una foto.
   Una scheda vuota il cliente la chiude e non chiama.

   - Le voci sono quelle del profilo minimo del gestionale (js/gate-gestionale.js,
     VOCI_PROFILO) piu' «almeno una foto dei lavori». Se cambiano li',
     vanno cambiate anche qui (le regole sono copiate uguali).
   - Completa al 100%: il riquadro sparisce.
   - Non scrive niente: legge e basta. I tasti portano dove si fa la cosa.
   - File chiuso in se' (IIFE). Usa il `sb` della pagina.
   ===================================================================== */
(function () {
  if (!document.getElementById('dash-hero')) return;
  var DESCR_MIN = 100;

  function pieno(v) { return String(v == null ? '' : v).trim() !== ''; }
  function telValido(t) {
    var s = String(t == null ? '' : t).replace(/[\s.\-()\/]/g, '').replace(/^(\+39|0039)/, '');
    if (!/^\d+$/.test(s) || /^(\d)\1+$/.test(s)) return false;
    return /^3\d{8,9}$/.test(s) || /^0\d{5,10}$/.test(s) || /^(800|803|199|848)\d{3,7}$/.test(s);
  }
  function haMestiere(r) {
    var l = r.mestieri;
    return pieno(r.mestiere) || (Array.isArray(l) ? l.filter(Boolean).length > 0 : pieno(l));
  }

  var VOCI = [
    { id: 'logo',        nome: 'Il logo o una tua foto',      ok: function (r) { return pieno(r.logo_url); },
      tasto: 'Carica il logo', fai: function () { var i = document.getElementById('input-logo-impresa'); if (i) i.click(); } },
    { id: 'foto',        nome: 'Almeno una foto dei lavori',  ok: function (r, n) { return n > 0; },
      tasto: 'Aggiungi foto', fai: function () { vai('sec-foto-lavori'); } },
    { id: 'descrizione', nome: 'Due righe su di te',          ok: function (r) { return String(r.descrizione || '').trim().length >= DESCR_MIN; },
      tasto: 'Scrivi', fai: profilo },
    { id: 'mestiere',    nome: 'Il tuo mestiere',             ok: haMestiere, tasto: 'Aggiungi', fai: profilo },
    { id: 'citta',       nome: 'La tua città',                ok: function (r) { return pieno(r.citta); }, tasto: 'Aggiungi', fai: profilo },
    { id: 'telefono',    nome: 'Il telefono',                 ok: function (r) { return telValido(r.telefono); }, tasto: 'Aggiungi', fai: profilo },
    { id: 'nome',        nome: 'Il nome della tua attività',  ok: function (r) { return pieno(r.nome_attivita) || pieno(r.nome); }, tasto: 'Aggiungi', fai: profilo },
    { id: 'email',       nome: 'L\'email confermata',         ok: function (r) { return r.email_confermata === true; }, tasto: null }
  ];
  function profilo() { window.location.href = '/modifica-profilo.html'; }
  function vai(id) {
    if (typeof window.showSectionById === 'function') { window.showSectionById(id); window.scrollTo(0, 0); return; }
    var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  var css = ''
    + '#scheda-completa{background:#fff;border:2px solid #e2e8f0;border-left:9px solid #ff8800;border-radius:16px;'
    +   'padding:22px 24px;margin:18px 0 22px;font-family:inherit;color:#0f172a}'
    + '#scheda-completa .sc-tit{font-size:22px;font-weight:800;margin:0 0 4px}'
    + '#scheda-completa .sc-sub{font-size:16px;color:#475569;margin:0 0 14px;line-height:1.5}'
    + '#scheda-completa .sc-barra{height:16px;background:#eef2f7;border-radius:10px;overflow:hidden;margin:0 0 18px}'
    + '#scheda-completa .sc-barra>span{display:block;height:100%;background:#ff8800;border-radius:10px;transition:width .4s}'
    + '#scheda-completa .sc-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}'
    + '#scheda-completa .sc-voce{display:flex;align-items:center;gap:12px;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;font-size:16.5px}'
    + '#scheda-completa .sc-voce b{flex:1;font-weight:600}'
    + '#scheda-completa .sc-pallino{width:24px;height:24px;border-radius:50%;border:2.5px solid #cbd5e1;flex:none}'
    + '#scheda-completa .sc-voce button{font:inherit;font-size:15.5px;font-weight:700;background:#0066ff;color:#fff;border:0;'
    +   'border-radius:10px;padding:10px 14px;cursor:pointer;white-space:nowrap;min-height:44px}'
    + '#scheda-completa .sc-nota{font-size:15px;color:#475569}'
    + '@media(max-width:600px){#scheda-completa{padding:18px 16px}#scheda-completa .sc-lista{grid-template-columns:1fr}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function disegna(r, nFoto) {
    var fatte = 0, mancano = [];
    VOCI.forEach(function (v) { if (v.ok(r, nFoto)) fatte++; else mancano.push(v); });
    var perc = Math.round(fatte * 100 / VOCI.length);
    var box = document.getElementById('scheda-completa');
    if (!mancano.length) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div'); box.id = 'scheda-completa';
      var hero = document.getElementById('dash-hero');
      hero.parentNode.insertBefore(box, hero.nextSibling);
    }
    box.innerHTML = '<div class="sc-tit">La tua scheda è completa al ' + perc + '%</div>'
      + '<div class="sc-sub">Le schede complete le aprono e le chiamano molto di più. Mancano ' + mancano.length
      + (mancano.length === 1 ? ' cosa' : ' cose') + '.</div>'
      + '<div class="sc-barra"><span style="width:' + perc + '%"></span></div>'
      + '<div class="sc-lista">' + mancano.map(function (v, i) {
          return '<div class="sc-voce"><span class="sc-pallino"></span><b>' + v.nome + '</b>'
            + (v.tasto ? '<button type="button" data-sc="' + i + '">' + v.tasto + '</button>'
                       : '<span class="sc-nota">Guarda la tua posta</span>') + '</div>';
        }).join('') + '</div>';
    box.querySelectorAll('[data-sc]').forEach(function (b) {
      b.onclick = function () { mancano[Number(b.getAttribute('data-sc'))].fai(); };
    });
  }

  async function carica() {
    try {
      if (typeof sb === 'undefined' || !sb) return;
      var u = await sb.auth.getUser();
      var user = u && u.data && u.data.user;
      if (!user) return;
      var r = await sb.from('imprese')
        .select('nome,nome_attivita,mestiere,mestieri,citta,telefono,descrizione,logo_url,email_confermata')
        .eq('user_id', user.id).maybeSingle();
      if (!r || r.error || !r.data) return;
      var f = await sb.from('lavori_foto').select('id', { count: 'exact', head: true }).eq('owner_id', user.id);
      disegna(r.data, (f && f.count) || 0);
    } catch (e) { /* il riquadro e' un aiuto: se non si carica, il pannello va avanti */ }
  }
  window.schedaCompletaAggiorna = carica;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(carica, 600); });
  else setTimeout(carica, 600);
  /* quando torna al Riepilogo dopo aver caricato logo o foto, si rilegge */
  var _ultima = 0;
  function forse() { if (Date.now() - _ultima < 15000) return; _ultima = Date.now(); carica(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) forse(); });
  window.addEventListener('focus', forse);
})();
