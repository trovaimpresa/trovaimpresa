/* =====================================================================
   LA CASELLA «COSA FACCIAMO?» NEL NOLEGGIO — 6 novembre 2026 (sera)

   Gemella di js/gest-assistente.js (gestionale principale), approvata da
   Alessio con le foto. Le differenze, volute:
   - il Noleggio NON ha la Chat con AI: «Manda» fa la stessa strada di
     «Parla» (window.gestVoceEsegui di gest-voce.js) — prepara le schede,
     salva chi preme;
   - il Noleggio non ha la barra in basso col microfono: il «Parla» resta
     dentro la casella anche sul telefono;
   - le 4 scorciatoie aprono le sezioni, senza AI e senza crediti.
   Il «Parla» tondo in fondo si nasconde sul Riepilogo (c'e' quello nella
   casella), salvo mentre ascolta o risponde.

   ⚠️ Il riquadro e' un <div>, NON un <section> (ogni section e' una sezione).
   ⚠️ data-no-dettato sulla casella: gest-dettato.js non ci mette il suo
      microfono piccolo.
   File chiuso in se' (IIFE). Fuori non esce niente.
   ===================================================================== */
(function () {
  function $(id) { return document.getElementById(id); }

  var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>';
  var STELLA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>';

  var css = ''
    + '#ass-box{background:#fff;border:2px solid #0a2a4d;border-radius:18px;padding:22px 24px;margin:0 0 18px;box-shadow:0 6px 24px rgba(10,42,77,.10);font-family:"IBM Plex Sans",Inter,system-ui,sans-serif}'
    + '#ass-box .ass-ciao{font-size:32px;font-weight:700;color:#0a2a4d;margin:0;line-height:1.2}'
    + '#ass-box .ass-data{font-size:18px;color:#475569;margin:2px 0 18px}'
    + '#ass-box .ass-tit{display:flex;align-items:center;gap:12px;font-size:24px;font-weight:700;color:#0a2a4d;margin:0 0 12px}'
    + '#ass-box .ass-av{width:44px;height:44px;border-radius:50%;background:#0a2a4d;display:grid;place-items:center;flex:0 0 44px}'
    + '#ass-box .ass-av svg{width:24px;height:24px;color:#ff8800}'
    + '#ass-box .ass-riga{display:flex;gap:12px;align-items:stretch}'
    + '#ass-box textarea{flex:1;min-height:64px;border:2px solid #cbd5e1;border-radius:14px;padding:16px 18px;font:inherit;font-size:20px;resize:vertical;color:#0f172a;box-sizing:border-box}'
    + '#ass-box textarea:focus{outline:none;border-color:#0a2a4d}'
    + '#ass-box .ass-b{border:0;border-radius:14px;font:inherit;font-size:20px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;min-height:64px;padding:0 22px}'
    + '#ass-box .ass-b svg{width:26px;height:26px;flex:none}'
    + '#ass-box .ass-parla{background:#ff8800;color:#fff;min-width:150px}'
    + '#ass-box .ass-manda{background:#0a2a4d;color:#fff;min-width:120px}'
    + '#ass-box .ass-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}'
    + '#ass-box .ass-chip{border:2px solid #0a2a4d;color:#0a2a4d;background:#fff;border-radius:30px;padding:10px 18px;font:inherit;font-size:18px;font-weight:600;cursor:pointer}'
    + '#ass-box .ass-chip:hover{background:#eef3fa}'
    + '#ass-box .ass-nota{font-size:16px;color:#475569;margin-top:14px}'
    + '#riepilogo .rie-intro{display:none}'
    + 'body.ass-rie:not(.ass-ascolta) #gv-btn{display:none!important}'
    + '@media (max-width:880px){'
    +   '#ass-box{padding:18px 16px}'
    +   '#ass-box .ass-ciao{font-size:28px}'
    +   '#ass-box .ass-tit{font-size:21px}'
    +   '#ass-box .ass-riga{flex-wrap:wrap}'
    +   '#ass-box textarea{flex:1 1 100%;min-height:80px;font-size:19px}'
    +   '#ass-box .ass-b{flex:1 1 0;min-width:0;min-height:58px}'
    +   '#ass-box .ass-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
    +   '#ass-box .ass-chip{font-size:16px;padding:10px 8px;border-radius:14px}'
    + '}';
  var st = document.createElement('style'); st.id = 'ass-stile'; st.textContent = css;
  document.head.appendChild(st);

  /* ---------------- il saluto ---------------- */
  var nome = '', nomeChiesto = false;
  function saluto() {
    var h = new Date().getHours();
    var s = h < 13 ? 'Buongiorno' : (h < 18 ? 'Buon pomeriggio' : 'Buonasera');
    return s + (nome ? ', ' + nome : '');
  }
  function oggi() {
    try {
      var d = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      return d.charAt(0).toUpperCase() + d.slice(1);
    } catch (e) { return ''; }
  }
  async function leggiNome() {
    try {
      if (!window._gc || nomeChiesto) return;
      nomeChiesto = true;
      var s = await window._gc.auth.getSession();
      var uid = s && s.data && s.data.session && s.data.session.user && s.data.session.user.id;
      if (!uid) return;
      var r = await window._gc.from('imprese').select('nome').eq('user_id', uid).maybeSingle();
      var n = r && r.data && r.data.nome ? String(r.data.nome).trim().split(/\s+/)[0] : '';
      if (n && n.length <= 20) {
        nome = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
        var c = document.querySelector('#ass-box .ass-ciao'); if (c) c.textContent = saluto();
      }
    } catch (e) { /* il saluto senza nome va bene lo stesso */ }
  }

  /* ---------------- cosa fanno i pulsanti ---------------- */
  function vai(tab) {
    var b = document.querySelector('nav.tabs button[data-tab="' + tab + '"]');
    if (b) { b.click(); window.scrollTo(0, 0); }
  }
  function parla() {
    var g = $('gv-btn');
    if (g) { g.click(); return; }
    var t = $('ass-testo'); if (t) { t.placeholder = 'Su questo browser il microfono non c\'è: scrivi qui'; t.focus(); }
  }
  function manda() {
    var t = $('ass-testo'); if (!t) return;
    var testo = t.value.trim();
    if (!testo) { t.focus(); return; }
    var ok = false;
    if (typeof window.gestVoceEsegui === 'function') ok = window.gestVoceEsegui(testo);
    else if (typeof window.gestParla === 'function') { window.gestParla(testo, function () { return 'vecchio'; }); ok = true; }
    if (ok) t.value = '';
  }
  var SCORCIATOIE = [
    { t: 'Nuovo noleggio', fa: function () { var b = document.querySelector('[data-action="new-nol"]'); if (b) b.click(); else vai('noleggi'); } },
    { t: 'Chi deve rientrare?', fa: function () { vai('noleggi'); } },
    { t: 'Mezzi liberi', fa: function () { vai('mezzi'); } },
    { t: 'Da incassare', fa: function () { vai('fatture'); } }
  ];

  function monta() {
    var sez = $('riepilogo'); if (!sez || $('ass-box')) return;
    var box = document.createElement('div');   /* ⚠️ NON <section> */
    box.id = 'ass-box';
    var conMic = !!$('gv-btn') || !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    box.innerHTML =
        '<h2 class="ass-ciao">' + saluto() + '</h2>'
      + '<div class="ass-data">' + oggi() + '</div>'
      + '<div class="ass-tit"><span class="ass-av">' + STELLA + '</span>Cosa facciamo?</div>'
      + '<div class="ass-riga">'
      +   '<textarea id="ass-testo" data-no-dettato rows="1" placeholder="Es. «domani l\'escavatore a Rossi per 3 giorni»" aria-label="Cosa facciamo?"></textarea>'
      +   (conMic ? '<button type="button" class="ass-b ass-parla" id="ass-parla">' + MIC + 'Parla</button>' : '')
      +   '<button type="button" class="ass-b ass-manda" id="ass-manda">Manda</button>'
      + '</div>'
      + '<div class="ass-chips">' + SCORCIATOIE.map(function (x, i) {
          return '<button type="button" class="ass-chip" data-ass="' + i + '">' + x.t + '</button>';
        }).join('') + '</div>'
      + '<div class="ass-nota">Scrivi o parla come ti viene: preparo io le schede, tu controlli e salvi.</div>';
    var intro = sez.querySelector('.rie-intro');
    if (intro) intro.after(box); else sez.insertBefore(box, sez.firstChild);

    $('ass-manda').addEventListener('click', manda);
    $('ass-testo').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); manda(); }
    });
    var p = $('ass-parla'); if (p) p.addEventListener('click', parla);
    box.querySelector('.ass-chips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-ass]'); if (!c) return;
      SCORCIATOIE[+c.getAttribute('data-ass')].fa();
    });
  }

  function stato() {
    var rie = $('riepilogo');
    document.body.classList.toggle('ass-rie', !!(rie && rie.classList.contains('active')));
    var bolla = $('gv-bolla');
    document.body.classList.toggle('ass-ascolta', !!(bolla && !bolla.hidden));
    if (!$('ass-box')) monta();
    if (!nome && !nomeChiesto && window._gc) leggiNome();
  }

  function parti() { stato(); setInterval(stato, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti);
  else parti();
})();
