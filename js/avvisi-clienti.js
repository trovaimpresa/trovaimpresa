/* ============================================================
   js/avvisi-clienti.js — 27 ottobre 2026
   Il riquadro blu «Sei un cliente e non hai trovato quello che cercavi?»
   sotto i risultati di cerca-imprese / cerca-artigiani / cerca-professionisti.

   Si mette con:  <script src="/js/avvisi-clienti.js" data-tipo="artigiano" defer></script>
   data-tipo = impresa | artigiano | professionista

   La tendina dei lavori NON e' scritta qui: si copia dal filtro che la pagina
   ha gia' (#mestiereSelect o #professioneSelect). Cosi' negli artigiani ci sono
   solo artigiani, nelle imprese solo imprese, nei professionisti solo
   professionisti (decisione di Alex: se no si mischiano e la tendina diventa
   gigante). E se un giorno si aggiunge un mestiere al filtro, compare anche qui.

   Salva con netlify/functions/avvisi-iscrivi.js; le mail le manda
   avvisi-invio.js ogni ora.
   ============================================================ */
(function () {
  'use strict';
  var script = document.currentScript;
  var TIPO = (script && script.getAttribute('data-tipo')) || 'impresa';
  var TUTTI = TIPO === 'professionista' ? 'Tutte le professioni' : 'Tutti i lavori';

  var CSS = '' +
    '.avvisi-box{margin:34px 0 10px;background:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:40px 40px;border-radius:22px;padding:38px 44px;color:#fff;display:flex;gap:36px;align-items:center;box-shadow:0 10px 30px rgba(10,42,77,.18);box-sizing:border-box}' +
    '.avvisi-box *{box-sizing:border-box}' +
    '.avvisi-ico{flex:0 0 86px;width:86px;height:86px;border-radius:50%;background:#ff8800;display:flex;align-items:center;justify-content:center}' +
    '.avvisi-ico svg{width:46px;height:46px;stroke:#fff}' +
    '.avvisi-testo{flex:1;min-width:0}' +
    '.avvisi-testo h3{margin:0 0 8px;font-size:30px;line-height:1.2;color:#fff !important;font-weight:800}' +
    '.avvisi-testo p{margin:0;font-size:20px;line-height:1.45;color:#fff;font-weight:600}' +
    '.avvisi-form{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}' +
    '.avvisi-form input,.avvisi-form select{font-size:19px;padding:16px 18px;border-radius:12px;border:0;color:#0a2a4d;background:#fff;font-family:inherit;margin:0}' +
    '.avvisi-form .av-citta{flex:0 0 200px;min-width:0;font-weight:600}' +
    '.avvisi-form select{flex:0 0 230px;min-width:0;font-weight:600;padding:16px 14px;cursor:pointer}' +
    '.avvisi-form .av-email{flex:1;min-width:240px}' +
    '.avvisi-form button{font-size:20px;font-weight:800;padding:16px 30px;border-radius:12px;border:0;background:#ff8800;color:#fff;cursor:pointer;font-family:inherit}' +
    '.avvisi-form button[disabled]{opacity:.6;cursor:wait}' +
    '.avvisi-form .av-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.avvisi-nota{margin-top:12px;font-size:16px;color:#fff;opacity:.85}' +
    '.avvisi-err{margin-top:12px;font-size:17px;font-weight:700;color:#ffb35c}' +
    '.avvisi-fatto{margin-top:18px;background:#fff;color:#0a2a4d;border-radius:14px;padding:18px 20px;font-size:19px;font-weight:700;line-height:1.45}' +
    '@media(max-width:700px){.avvisi-box{flex-direction:column;align-items:flex-start;padding:26px 20px;gap:16px;margin:24px 0}.avvisi-ico{flex-basis:64px;width:64px;height:64px}.avvisi-ico svg{width:34px;height:34px}.avvisi-testo h3{font-size:24px}.avvisi-testo p{font-size:18px}.avvisi-form input,.avvisi-form button,.avvisi-form select,.avvisi-form .av-citta,.avvisi-form .av-email{width:100%;flex:1 1 100%}}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  function regioneDi(citta) {
    try {
      var g = window.GEO_ITALIA || {}, c = String(citta || '').toLowerCase().trim();
      for (var r in g) for (var p in g[r]) {
        var cc = g[r][p];
        if (Array.isArray(cc)) for (var k = 0; k < cc.length; k++) if (String(cc[k]).toLowerCase() === c) return r;
        if (String(p).toLowerCase() === c) return r;
      }
    } catch (e) {}
    var sel = $('regioneSelect');
    return (sel && sel.value) || '';
  }

  function monta() {
    var ris = $('risultati');
    if (!ris || $('avvisi-box')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var filtro = $('mestiereSelect') || $('professioneSelect');
    var opzioni = '<option value="">' + TUTTI + '</option>';
    if (filtro) {
      for (var k = 0; k < filtro.options.length; k++) {
        var o = filtro.options[k];
        if (!o.value || o.value === 'tutti' || o.value === 'tutte') continue;
        opzioni += '<option value="' + esc(o.value) + '">' + esc(o.textContent.trim()) + '</option>';
      }
    }
    var box = document.createElement('div');
    box.id = 'avvisi-box';
    box.className = 'avvisi-box';
    box.innerHTML =
      '<div class="avvisi-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>' +
      '<div class="avvisi-testo">' +
        '<h3>Sei un cliente e non hai trovato quello che cercavi?</h3>' +
        '<p>Iscriviti gratis: scegli città e lavoro, e quando arriva una nuova impresa o professionista ti avvisiamo noi.</p>' +
        '<form class="avvisi-form" novalidate>' +
          '<input class="av-citta" type="text" maxlength="80" placeholder="Città" aria-label="Città" autocomplete="address-level2">' +
          '<select class="av-mest" aria-label="Lavoro">' + opzioni + '</select>' +
          '<input class="av-email" type="email" maxlength="200" placeholder="La tua email" aria-label="La tua email" autocomplete="email">' +
          '<input class="av-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<button type="submit">Avvisami gratis</button>' +
        '</form>' +
        '<div class="avvisi-err" role="alert" hidden></div>' +
        '<div class="avvisi-nota">Niente password. Ti cancelli con un clic.</div>' +
      '</div>';
    ris.parentNode.insertBefore(box, ris.nextSibling);

    var fCitta = box.querySelector('.av-citta'), fMest = box.querySelector('.av-mest'),
        fEmail = box.querySelector('.av-email'), fHp = box.querySelector('.av-hp'),
        form = box.querySelector('form'), btn = box.querySelector('button'), err = box.querySelector('.avvisi-err');
    var cittaToccata = false, mestToccato = false;

    // la citta' e il lavoro seguono la ricerca della pagina, finche' il cliente non li cambia lui
    function segui() {
      var ci = $('cittaInput');
      if (!cittaToccata && ci && ci.value.trim()) fCitta.value = ci.value.trim();
      if (!mestToccato && filtro) {
        var v = filtro.value;
        if (v === 'tutti' || v === 'tutte') v = '';
        fMest.value = v;
        if (fMest.value !== v) fMest.value = ''; // valore che la tendina non ha
      }
    }
    segui();
    fCitta.addEventListener('input', function () { cittaToccata = true; });
    fMest.addEventListener('change', function () { mestToccato = true; });
    var ci = $('cittaInput');
    if (ci) { ci.addEventListener('change', segui); ci.addEventListener('input', segui); }
    if (filtro) filtro.addEventListener('change', segui);
    // i filtri della pagina cambiano anche da codice (chip, link): si ricontrolla ogni tanto
    setInterval(segui, 1500);

    function errore(t) { err.textContent = t; err.hidden = !t; }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      errore('');
      var citta = fCitta.value.trim(), email = fEmail.value.trim();
      if (citta.length < 2) { errore('Scrivi la città.'); fCitta.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { errore('Scrivi un indirizzo email valido.'); fEmail.focus(); return; }
      btn.disabled = true; btn.textContent = 'Un attimo…';
      fetch('/.netlify/functions/avvisi-iscrivi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, citta: citta, regione: regioneDi(citta), tipo: TIPO, mestiere: fMest.value,
          origine: location.pathname.replace(/^\//, '').slice(0, 60), sito_web_extra: fHp.value })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok || !x.j.ok) throw new Error((x.j && x.j.error) || 'Non sono riuscito a salvare. Riprova fra poco.');
          var cosa = (fMest.value ? fMest.options[fMest.selectedIndex].textContent + ' a ' : 'novità a ') + citta;
          var testo = x.j.stato === 'attivo'
            ? 'Fatto! Ti scriviamo noi quando arriva qualcuno di nuovo: <b>' + esc(cosa) + '</b>.'
            : 'Ci siamo quasi: ti abbiamo mandato una email a <b>' + esc(email) + '</b>. Clicca il pulsante dentro per attivare gli avvisi. Se non la trovi, guarda nello spam.';
          form.outerHTML = '<div class="avvisi-fatto">' + testo + '</div>';
        })
        .catch(function (e) {
          btn.disabled = false; btn.textContent = 'Avvisami gratis';
          errore(e && e.message ? e.message : 'Non sono riuscito a salvare. Riprova fra poco.');
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta);
  else monta();
})();
