/* =====================================================================
   ti-finestra.js — TrovaImpresa (11 novembre 2026)

   LA FINESTRA NOSTRA, al posto di quelle grigie del browser
   (alert e confirm). Grande, in italiano, coi pulsanti chiari.
   UNA funzione sola, usata da tutti i gestionali:

     await tiChiedi("Elimino il cliente?", {si:"Sì, elimina", no:"No", rosso:true})
       → true se preme «Sì», false se preme «No» o chiude
     await tiAvviso("Salvato.")              → si chiude con «Ho capito»

   In piu', LA DOMANDA PRIMA DI USCIRE (Alessio, 10 nov 2026):
   se in un modulo hai scritto qualcosa e premi «Indietro» o «Annulla»,
   prima di buttare via tutto chiede «Hai scritto qualcosa: esco senza
   salvare?». Solo se c'e' DAVVERO qualcosa di scritto da te.
   Vale per i moduli di tutti i gestionali (finestre #sheet e moduli
   dentro la pagina dell'app operaio).
   ===================================================================== */
(function () {
  'use strict';
  if (window.tiChiedi) return;

  var CSS = ''
    + '#tif-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(10,42,77,.55);display:flex;align-items:center;justify-content:center;padding:18px}'
    + '#tif-box{background:#fff;color:#0f172a;border-radius:18px;max-width:560px;width:100%;padding:28px 26px 22px;'
    +   'box-shadow:0 18px 60px rgba(0,0,0,.35);font-family:"IBM Plex Sans",Inter,system-ui,sans-serif}'
    + '#tif-box h3{margin:0 0 10px;font-size:23px;line-height:1.3;font-weight:800}'
    + '#tif-box p{margin:0;font-size:19px;line-height:1.5;white-space:pre-line;color:#334155}'
    + '#tif-az{display:flex;gap:12px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap}'
    + '#tif-az button{font:inherit;font-size:19px;font-weight:700;min-height:54px;padding:0 24px;border-radius:12px;cursor:pointer}'
    + '.tif-no{background:#fff;color:#0a2a4d;border:1.5px solid #c9d4e3}'
    + '.tif-si{background:#0066ff;color:#fff;border:0}'
    + '.tif-si.tif-rosso{background:#dc2626}'
    + '#tif-az button:focus-visible{outline:3px solid #ff8800;outline-offset:2px}'
    + '@media(max-width:600px){#tif-box{padding:22px 18px 18px}#tif-az{flex-direction:column-reverse}#tif-az button{width:100%}}';

  function stile() {
    if (document.getElementById('tif-css')) return;
    var s = document.createElement('style'); s.id = 'tif-css'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* il messaggio vecchio aveva spesso un titolo nella prima riga: se e'
     corta e c'e' altro dopo, diventa il titolo grande */
  function dividi(testo, titolo) {
    testo = String(testo == null ? '' : testo).trim();
    if (titolo) return { t: titolo, c: testo };
    var a = testo.split('\n');
    if (a.length > 1 && a[0].length <= 80) return { t: a[0], c: a.slice(1).join('\n').trim() };
    if (testo.length <= 90) return { t: testo, c: '' };
    return { t: '', c: testo };
  }

  var coda = Promise.resolve();
  function apri(testo, o) {
    o = o || {};
    var lavoro = coda.then(function () {
      return new Promise(function (fine) {
        stile();
        var d = dividi(testo, o.titolo);
        var ov = document.createElement('div');
        ov.id = 'tif-ov';
        ov.setAttribute('role', 'alertdialog'); ov.setAttribute('aria-modal', 'true');
        ov.innerHTML = '<div id="tif-box">'
          + (d.t ? '<h3>' + esc(d.t) + '</h3>' : '')
          + (d.c ? '<p>' + esc(d.c) + '</p>' : '')
          + '<div id="tif-az">'
          + (o.solo ? '' : '<button type="button" class="tif-no">' + esc(o.no || 'No') + '</button>')
          + '<button type="button" class="tif-si' + (o.rosso ? ' tif-rosso' : '') + '">' + esc(o.si || (o.solo ? 'Ho capito' : 'Sì')) + '</button>'
          + '</div></div>';
        var prima = document.activeElement;
        function chiudi(v) {
          document.removeEventListener('keydown', tasti, true);
          if (ov.parentNode) ov.parentNode.removeChild(ov);
          try { if (prima && prima.focus) prima.focus(); } catch (e) {}
          fine(v);
        }
        function tasti(e) {
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); chiudi(o.solo ? true : false); }
          if (e.key === 'Enter' && document.activeElement && document.activeElement.closest && document.activeElement.closest('#tif-box')) return;
        }
        ov.addEventListener('click', function (e) {
          e.stopPropagation();
          if (e.target === ov) return chiudi(o.solo ? true : false);
          if (e.target.closest('.tif-si')) return chiudi(true);
          if (e.target.closest('.tif-no')) return chiudi(false);
        });
        document.addEventListener('keydown', tasti, true);
        document.body.appendChild(ov);
        var b = ov.querySelector(o.rosso ? '.tif-no' : '.tif-si') || ov.querySelector('button');
        if (b) b.focus();
      });
    });
    coda = lavoro.catch(function () {});
    return lavoro;
  }

  window.tiChiedi = function (testo, o) { return apri(testo, o); };
  window.tiAvviso = function (testo, o) { o = o || {}; o.solo = true; return apri(testo, o); };

  /* =================================================================
     LA DOMANDA PRIMA DI USCIRE
     ================================================================= */
  var CAMPI = 'input,textarea,select,[contenteditable="true"]';
  /* segno le caselle in cui l'utente ha scritto davvero, con la tastiera
     o col dettato (gli eventi «input» veri). Quelle riempite dal codice
     all'apertura non contano. */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches(CAMPI)) return;
    if (t.closest('#tif-box,#gv-bolla,#ass-box,.chat-wrap,#chat')) return;
    if (t.type === 'search' || /cerca/i.test(t.placeholder || '') || /cerca|search|filtro/i.test(t.id || '')) return;
    t.setAttribute('data-ti-scritto', '1');
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('input[type=file]') && t.files && t.files.length) t.setAttribute('data-ti-scritto', '1');
  }, true);

  function haScritto(dove) {
    if (!dove) return false;
    var c = dove.querySelectorAll('[data-ti-scritto]');
    for (var i = 0; i < c.length; i++) {
      var e = c[i];
      if (!e.isConnected) continue;
      if (e.type === 'file') { if (e.files && e.files.length) return true; continue; }
      if (e.type === 'checkbox' || e.type === 'radio') return true;
      var v = e.isContentEditable ? e.textContent : e.value;
      if (String(v || '').trim() !== '') return true;
    }
    return false;
  }
  function pulisci(dove) {
    if (!dove) return;
    var c = dove.querySelectorAll('[data-ti-scritto]');
    for (var i = 0; i < c.length; i++) c[i].removeAttribute('data-ti-scritto');
  }

  /* dove sta il modulo di questo pulsante: la finestra #sheet, oppure il
     primo contenitore che ha dentro delle caselle (moduli dell'app operaio) */
  function moduloDi(b) {
    var s = b.closest('#sheet');
    if (s) return s;
    var p = b.parentElement;
    while (p && p !== document.body) {
      if (p.querySelector(CAMPI)) return p;
      p = p.parentElement;
    }
    return null;
  }
  function eUscita(b) {
    if (b.matches('[data-action="close"],.sh-back,.ti-back')) return true;
    /* dentro le finestre del gestionale si esce SOLO da questi: un «Annulla»
       con un'altra azione chiude un pezzetto del modulo, non il modulo */
    if (b.closest('#sheet')) return false;
    var t = (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return t === 'annulla' || t === 'indietro';
  }
  function eSalva(b) {
    var t = (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return /^(salva|invia|manda|crea|registra)/.test(t) || b.matches('.btn-primary[data-action^="save"]');
  }

  var lascia = null;   /* il clic gia' confermato, che deve passare */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button,a,[role=button],[data-action]');
    if (!b || b.closest('#tif-box')) return;
    if (b === lascia) { lascia = null; return; }
    var dove = moduloDi(b);
    if (!dove) return;
    if (eSalva(b)) { setTimeout(function () { pulisci(dove); }, 0); return; }
    if (!eUscita(b) || !haScritto(dove)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    apri('Quello che hai scritto non è ancora salvato. Se esci, lo perdi.', {
      titolo: 'Hai scritto qualcosa: esco senza salvare?',
      si: 'Sì, esco', no: 'No, resto qui', rosso: true
    }).then(function (ok) {
      if (!ok) return;
      pulisci(dove);
      lascia = b; b.click();
    });
  }, true);

  /* clic sul grigio fuori dalla finestra: stessa domanda */
  document.addEventListener('click', function (e) {
    if (!e.target || e.target.id !== 'overlay') return;
    var s = document.getElementById('sheet');
    if (!haScritto(s)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    apri('Quello che hai scritto non è ancora salvato. Se esci, lo perdi.', { titolo: 'Hai scritto qualcosa: esco senza salvare?', si: 'Sì, esco', no: 'No, resto qui', rosso: true })
      .then(function (ok) {
        if (!ok) return;
        pulisci(s);
        var o = document.getElementById('overlay'); if (o) o.classList.remove('open');
      });
  }, true);

  window.tiModuloScritto = haScritto;
  window.tiModuloPulito = pulisci;
})();
