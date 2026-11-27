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
   - Legge e basta, tranne la descrizione (27 nov 2026): quella si scrive e si
     salva qui dentro. Gli altri tasti portano dove si fa la cosa.
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
      tasto: 'Aggiungi foto', fai: function () { vai('foto-lavori'); } },
    { id: 'descrizione', nome: 'Due righe su di te',          ok: function (r) { return String(r.descrizione || '').trim().length >= DESCR_MIN; },
      tasto: 'Scrivi', fai: function () { scriviDescrizione(); } },
    { id: 'mestiere',    nome: 'Il tuo mestiere',             ok: haMestiere, tasto: 'Aggiungi', fai: profilo },
    { id: 'citta',       nome: 'La tua città',                ok: function (r) { return pieno(r.citta); }, tasto: 'Aggiungi', fai: profilo },
    { id: 'telefono',    nome: 'Il telefono',                 ok: function (r) { return telValido(r.telefono); }, tasto: 'Aggiungi', fai: profilo },
    { id: 'nome',        nome: 'Il nome della tua attività',  ok: function (r) { return pieno(r.nome_attivita) || pieno(r.nome); }, tasto: 'Aggiungi', fai: profilo },
    { id: 'email',       nome: 'L\'email confermata',         ok: function (r) { return r.email_confermata === true; }, tasto: null }
  ];
  function profilo() { window.location.href = '/modifica-profilo.html'; }

  /* 27 nov 2026 — la descrizione si scrive e si salva QUI, nel pannello.
     Prima «Scrivi» portava a modifica-profilo.html: sul telefono la pagina e'
     lunga 5.700 px e «Salva modifiche» sta in fondo. Un iscritto (Futuraservice,
     26 nov) ha scritto «non si riesce a completare il profilo»: non aveva mai
     trovato il Salva. */
  var _riga = null, _uid = null;
  function esempio(t) {
    if (t === 'professionista') return 'Es. Sono un geometra di Milano: seguo pratiche edilizie (CILA, SCIA), catasto, APE e direzione lavori. Lavoro in tutta la provincia, primo incontro gratuito.';
    return 'Es. Siamo un\'impresa di Milano: facciamo giardini, potature e manutenzione del verde. Lavoriamo in tutta la provincia, sopralluogo e preventivo gratuiti.';
  }
  function scriviDescrizione() {
    var box = document.getElementById('scheda-completa');
    if (!box || box.querySelector('.sc-scrivi')) return;
    var vecchia = String((_riga && _riga.descrizione) || '');
    var w = document.createElement('div');
    w.className = 'sc-scrivi';
    w.innerHTML = '<label class="sc-s-tit" for="sc-desc">Due righe su di te</label>'
      + '<div class="sc-s-sub">Cosa fai, in che zona lavori, perché un cliente dovrebbe chiamarti. La leggono i clienti sulla tua scheda.</div>'
      + '<textarea id="sc-desc" rows="5"></textarea>'
      + '<div class="sc-s-conta"></div>'
      + '<div class="sc-s-msg" role="status"></div>'
      + '<div class="sc-s-bott"><button type="button" class="sc-s-salva">Salva</button>'
      + '<button type="button" class="sc-s-annulla">Annulla</button></div>';
    box.appendChild(w);
    var ta = w.querySelector('textarea'), conta = w.querySelector('.sc-s-conta'),
        msg = w.querySelector('.sc-s-msg'), salva = w.querySelector('.sc-s-salva');
    ta.value = vecchia;
    ta.placeholder = esempio(_riga && _riga.tipo);
    function aggiorna() {
      var n = ta.value.trim().length;
      conta.textContent = n >= DESCR_MIN ? n + ' caratteri: va bene' : n + ' caratteri — ne servono almeno ' + DESCR_MIN;
      conta.className = 'sc-s-conta' + (n >= DESCR_MIN ? ' ok' : '');
    }
    ta.addEventListener('input', aggiorna); aggiorna();
    w.querySelector('.sc-s-annulla').onclick = function () { w.remove(); };
    salva.onclick = async function () {
      var testo = ta.value.trim();
      if (testo.length < DESCR_MIN) {
        msg.className = 'sc-s-msg err';
        msg.textContent = 'Scrivi ancora qualcosa: servono almeno ' + DESCR_MIN + ' caratteri (ne hai ' + testo.length + ').';
        ta.focus(); return;
      }
      if (salva.disabled) return;
      salva.disabled = true; salva.textContent = 'Salvo…';
      msg.className = 'sc-s-msg'; msg.textContent = '';
      try {
        var r = await sb.from('imprese').update({ descrizione: testo }).eq('user_id', _uid).select('id');
        if (r.error || !r.data || !r.data.length) throw new Error((r.error && r.error.message) || 'nessuna riga');
        if (_riga) _riga.descrizione = testo;
        msg.className = 'sc-s-msg ok'; msg.textContent = '✔ Salvata. I clienti la vedono già sulla tua scheda.';
        setTimeout(carica, 1500);
      } catch (e) {
        salva.disabled = false; salva.textContent = 'Salva';
        msg.className = 'sc-s-msg err';
        msg.textContent = 'Non sono riuscito a salvare. Controlla la connessione e riprova.';
      }
    };
    w.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { ta.focus(); }, 350);
  }
  function vai(id) {
    if (typeof window.showSection === 'function') { window.showSection(id, null); return; }
    var el = document.getElementById('sec-' + id); if (el) el.scrollIntoView({ behavior: 'smooth' });
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
    + '#scheda-completa .sc-scrivi{margin-top:16px;border:2px solid #0066ff;border-radius:14px;padding:18px;background:#f7faff}'
    + '#scheda-completa .sc-s-tit{display:block;font-size:19px;font-weight:800;margin:0 0 4px}'
    + '#scheda-completa .sc-s-sub{font-size:16px;color:#475569;margin:0 0 10px;line-height:1.5}'
    + '#scheda-completa .sc-scrivi textarea{width:100%;box-sizing:border-box;font:inherit;font-size:17px;line-height:1.5;'
    +   'border:2px solid #cbd5e1;border-radius:12px;padding:12px;min-height:150px;resize:vertical;background:#fff;color:#0f172a}'
    + '#scheda-completa .sc-scrivi textarea:focus{outline:none;border-color:#0066ff}'
    + '#scheda-completa .sc-s-conta{font-size:15px;color:#b45309;margin:6px 0 0}'
    + '#scheda-completa .sc-s-conta.ok{color:#15803d}'
    + '#scheda-completa .sc-s-msg{font-size:16px;margin:8px 0 0;min-height:0}'
    + '#scheda-completa .sc-s-msg.ok{color:#15803d;font-weight:700}#scheda-completa .sc-s-msg.err{color:#b91c1c;font-weight:700}'
    + '#scheda-completa .sc-s-bott{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}'
    + '#scheda-completa .sc-s-bott button{font:inherit;font-size:17px;font-weight:700;border-radius:12px;padding:12px 22px;min-height:48px;cursor:pointer}'
    + '#scheda-completa .sc-s-salva{background:#0066ff;color:#fff;border:0}'
    + '#scheda-completa .sc-s-salva:disabled{opacity:.6;cursor:wait}'
    + '#scheda-completa .sc-s-annulla{background:#fff;color:#0f172a;border:2px solid #cbd5e1}'
    + '@media(max-width:600px){#scheda-completa{padding:18px 16px}#scheda-completa .sc-lista{grid-template-columns:1fr}'
    +   '#scheda-completa .sc-s-bott button{flex:1}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function disegna(r, nFoto) {
    var aperta = document.querySelector('#scheda-completa .sc-scrivi textarea');
    if (aperta && aperta.value.trim() && !document.querySelector('#scheda-completa .sc-s-msg.ok')) return;
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
      + '<div class="sc-sub">Le schede complete le aprono e le chiamano molto di più. '
      + (mancano.length === 1 ? 'Manca 1 cosa' : 'Mancano ' + mancano.length + ' cose') + '.</div>'
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
        .select('nome,nome_attivita,mestiere,mestieri,citta,telefono,descrizione,logo_url,email_confermata,tipo')
        .eq('user_id', user.id).maybeSingle();
      if (!r || r.error || !r.data) return;
      _riga = r.data; _uid = user.id;
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
