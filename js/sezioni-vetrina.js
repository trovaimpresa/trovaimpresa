/* =====================================================================
   LA GRAFICA DI «FOTO DEI LAVORI» E «MESSAGGI» NEI PANNELLI
   (26 settembre 2026 — Alessio: «si puo' migliorare la grafica?»,
   «queste linee lunghe e piatte»)

   Lo caricano i tre pannelli: impresa, artigiano, professionisti.
   NON riscrive le funzioni che c'erano: salvare una foto, aprire una
   conversazione, rispondere restano quelle di prima. Qui si fa soltanto:
   - si mette uno stile nuovo, valido SOLO dentro #sec-foto-lavori e
     #sec-messaggi (non esce dalle due sezioni);
   - si spostano gli elementi che c'erano gia', con i loro id, dentro
     riquadri piu' ordinati;
   - si aggiungono cose che si vedono e basta (anteprima della foto,
     l'iniziale del cliente, l'ora dell'ultimo messaggio).

   ⚠️ L'elenco delle foto gia' messe (#lista-lavori-foto) stava nel
      RIEPILOGO, lontano dal modulo per aggiungerle: qui si porta dentro
      «Foto dei lavori». La funzione che lo riempie
      (caricaListaLavoriFoto) lo cerca per id, quindi continua a funzionare.
   ⚠️ Le righe non vanno piu' da un bordo all'altro dello schermo: la
      sezione si ferma a 1100 px, il testo si legge senza girare la testa.
   ===================================================================== */
(function () {
  'use strict';

  var CSS = '' +
  /* ---------- in comune ---------- */
  '#sec-foto-lavori,#sec-messaggi,#sec-prezzi{max-width:1100px}' +
  /* la freccia Indietro dentro il titolo prendeva il carattere del titolo (con le grazie) */
  '.section .ti-back{font-family:\'DM Sans\',Arial,sans-serif}' +

  /* ---------- FOTO DEI LAVORI ---------- */
  '#sec-foto-lavori .fl-card{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:26px;' +
    'box-shadow:0 8px 28px rgba(10,42,77,.08);margin:0 0 20px}' +
  '#sec-foto-lavori .fl-tit{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 18px}' +
  '#sec-foto-lavori .fl-griglia{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:26px;align-items:start}' +
  '#sec-foto-lavori .fl-scatola{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;' +
    'aspect-ratio:4/3;border:2.5px dashed #b8c4d6;border-radius:16px;background:#f5f8fc;cursor:pointer;overflow:hidden;' +
    'position:relative;text-align:center;padding:16px;transition:border-color .15s,background .15s}' +
  '#sec-foto-lavori .fl-scatola:hover{border-color:#0066ff;background:#eef4ff}' +
  '#sec-foto-lavori .fl-scatola svg{width:46px;height:46px;color:#0066ff}' +
  '#sec-foto-lavori .fl-scatola b{font-size:18px;color:#0f172a}' +
  '#sec-foto-lavori .fl-scatola small{font-size:15px;color:#5f6b7a}' +
  '#sec-foto-lavori .fl-scatola img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}' +
  '#sec-foto-lavori .fl-scatola.piena{border-style:solid;border-color:#0066ff}' +
  '#sec-foto-lavori .fl-scatola.piena img{display:block}' +
  '#sec-foto-lavori .fl-cambia{position:absolute;bottom:10px;right:10px;background:rgba(15,23,42,.8);color:#fff;' +
    'font-size:15px;font-weight:700;border-radius:999px;padding:7px 14px;display:none}' +
  '#sec-foto-lavori .fl-scatola.piena .fl-cambia{display:block}' +
  '#sec-foto-lavori #lav-foto-file{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}' +
  '#sec-foto-lavori #lav-foto-stato{font-size:15px;margin-top:8px;min-height:22px}' +
  '#sec-foto-lavori .fl-campi .form-group label{text-transform:none;letter-spacing:0;font-size:16px;color:#0f172a}' +
  '#sec-foto-lavori .fl-campi .form-group input,#sec-foto-lavori .fl-campi .form-group textarea{font-size:17px;padding:13px 15px}' +
  '#sec-foto-lavori .fl-aiuto{font-size:15px;color:#5f6b7a;margin:6px 0 0}' +
  '#sec-foto-lavori .fl-campi .btn-salva-annuncio{width:100%;font-size:18px;padding:15px}' +
  '#sec-foto-lavori .fl-elenco-tit{display:flex;align-items:baseline;gap:10px;font-size:20px;font-weight:800;color:#0f172a;margin:0 0 4px}' +
  '#sec-foto-lavori .fl-elenco-tit span{font-size:16px;color:#5f6b7a;font-weight:700}' +
  '#sec-foto-lavori .fl-elenco-sub{font-size:15px;color:#5f6b7a;margin:0}' +
  '#sec-foto-lavori .foto-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}' +
  '@media(max-width:820px){#sec-foto-lavori .fl-griglia{grid-template-columns:1fr}#sec-foto-lavori .fl-card{padding:18px}' +
    '#sec-foto-lavori .foto-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}' +

  /* ---------- MESSAGGI ---------- */
  '#sec-messaggi #lista-conversazioni{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}' +
  '#sec-messaggi .msg-conv-aiuto,#sec-messaggi #lista-conversazioni .empty-state{grid-column:1/-1}' +
  '#sec-messaggi .msg-conv-item{margin:0;padding:18px;border:1px solid #e3e8ef;border-radius:16px;background:#fff;' +
    'box-shadow:0 6px 20px rgba(10,42,77,.07);align-items:flex-start}' +
  '#sec-messaggi .msg-conv-item:hover{border-color:#0066ff;box-shadow:0 10px 26px rgba(10,42,77,.12)}' +
  '#sec-messaggi .msg-conv-item.nuovo{border-color:#ff8800;background:#fffaf3}' +
  '#sec-messaggi .msg-conv-sx{display:flex;gap:14px;align-items:flex-start;flex:1}' +
  '#sec-messaggi .mv-avatar{flex:none;width:48px;height:48px;border-radius:50%;background:#e8f0ff;color:#0052cc;' +
    'display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}' +
  '#sec-messaggi .mv-testi{min-width:0;flex:1}' +
  '#sec-messaggi .msg-conv-ultimo{max-width:none;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.45}' +
  '#sec-messaggi .mv-quando{font-size:14px;color:#5f6b7a;margin-top:6px;font-weight:600}' +
  '#sec-messaggi .msg-conv-dx{flex-direction:column;align-items:flex-end;gap:8px}' +
  '#sec-messaggi .msg-badge{background:#ff8800;height:24px;line-height:24px;padding:0 10px;border-radius:999px;font-size:14px}' +
  /* la conversazione aperta */
  '#sec-messaggi #chat-aperta{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:18px;box-shadow:0 8px 28px rgba(10,42,77,.08)}' +
  '#sec-messaggi .mv-testa{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:0 0 14px;margin:0 0 14px;border-bottom:1px solid #e3e8ef}' +
  '#sec-messaggi .mv-chi{display:flex;align-items:center;gap:12px;flex:1;min-width:200px}' +
  '#sec-messaggi .mv-chi b{display:block;font-size:19px;color:#0f172a}' +
  '#sec-messaggi .mv-chi small{display:block;font-size:15px;color:#5f6b7a}' +
  '#sec-messaggi .mv-azioni{display:flex;gap:8px;flex-wrap:wrap}' +
  '#sec-messaggi .mv-azioni button{margin:0 !important;background:#fff !important;border:1.5px solid #cbd5e1 !important;' +
    'color:#334155 !important;border-radius:10px !important;padding:9px 14px !important;font-size:15px !important}' +
  '#sec-messaggi .mv-azioni #btn-blocco-cliente{color:#b42318 !important;border-color:#f1c0bb !important}' +
  '#sec-messaggi .msg-messages{background:#f4f7fb;border:none;border-radius:14px;min-height:320px;max-height:60vh;padding:18px}' +
  '#sec-messaggi .msg-bubble{max-width:72%;font-size:17px;box-shadow:0 2px 6px rgba(10,42,77,.06)}' +
  '#sec-messaggi .msg-bubble-meta{font-size:13.5px}' +
  '#sec-messaggi .msg-input-row{gap:10px}' +
  '#sec-messaggi .msg-input-row input{flex:1;font-size:17px;padding:14px 16px;border:1.5px solid #cbd5e1;border-radius:12px;font-family:inherit}' +
  '#sec-messaggi .msg-input-row button{font-size:17px;font-weight:800;padding:0 24px;border-radius:12px;min-height:50px}' +
  '@media(max-width:820px){#sec-messaggi #lista-conversazioni{grid-template-columns:1fr}' +
    '#sec-messaggi .msg-bubble{max-width:86%}#sec-messaggi #chat-aperta{padding:12px}}';

  var ICONA_FOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

  function gruppoDi(el) { return el && el.closest ? el.closest('.form-group') : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ------------------------------------------------------------------ */
  function foto() {
    var sec = document.getElementById('sec-foto-lavori');
    var file = document.getElementById('lav-foto-file');
    if (!sec || !file || sec.getAttribute('data-vetrina')) return;
    var vecchia = file.closest('.profilo-card');
    if (!vecchia) return;
    sec.setAttribute('data-vetrina', '1');

    var gTit = gruppoDi(document.getElementById('lav-titolo'));
    var gDesc = gruppoDi(document.getElementById('lav-descrizione'));
    var gFile = gruppoDi(file);
    var gPub = gruppoDi(document.getElementById('lav-pubblico'));
    var salva = vecchia.querySelector('.btn-salva-annuncio');
    var stato = document.getElementById('lav-foto-stato');
    var nascosto = document.getElementById('lav-foto');

    var card = document.createElement('div');
    card.className = 'fl-card';
    card.innerHTML = '<div class="fl-tit">Aggiungi un lavoro</div>' +
      '<div class="fl-griglia"><div class="fl-sx">' +
        '<label class="fl-scatola" for="lav-foto-file">' + ICONA_FOTO +
          '<b>Tocca per scegliere la foto</b><small>Dal telefono puoi scattarla subito</small>' +
          '<img alt="Anteprima della foto"><span class="fl-cambia">Cambia foto</span></label>' +
      '</div><div class="fl-campi"></div></div>';
    var sx = card.querySelector('.fl-sx');
    var campi = card.querySelector('.fl-campi');
    var scatola = card.querySelector('.fl-scatola');
    var anteprima = scatola.querySelector('img');

    /* si spostano gli elementi VERI, con i loro id e i loro onchange */
    sx.appendChild(file);
    if (nascosto) sx.appendChild(nascosto);
    if (stato) sx.appendChild(stato);
    if (gTit) {
      campi.appendChild(gTit);
      var l1 = gTit.querySelector('label'); if (l1) l1.textContent = 'Titolo del lavoro';
      var a1 = document.createElement('p'); a1.className = 'fl-aiuto';
      a1.textContent = 'Cosa hai fatto e dove, per esempio «Rifacimento bagno a Rieti».';
      gTit.appendChild(a1);
    }
    if (gDesc) {
      campi.appendChild(gDesc);
      var l2 = gDesc.querySelector('label'); if (l2) l2.textContent = 'Due righe di spiegazione';
      var ta = gDesc.querySelector('textarea'); if (ta) { ta.placeholder = 'Es. Tolte le vecchie piastrelle, nuovo impianto, doccia a filo pavimento.'; ta.style.minHeight = '110px'; }
    }
    if (gPub) campi.appendChild(gPub);
    if (salva) campi.appendChild(salva);
    if (gFile) gFile.remove();
    vecchia.replaceWith(card);

    /* l'anteprima: si mostra appena scelta, prima ancora che finisca di salire */
    var urlVecchio = null;
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (urlVecchio) { URL.revokeObjectURL(urlVecchio); urlVecchio = null; }
      if (f) { urlVecchio = URL.createObjectURL(f); anteprima.src = urlVecchio; scatola.classList.add('piena'); }
      else { anteprima.removeAttribute('src'); scatola.classList.remove('piena'); }
    });
    /* dopo «Salva» il pannello svuota i campi da solo: qui si svuota anche l'anteprima */
    if (typeof window.salvaLavoroFoto === 'function' && !window.salvaLavoroFoto.__vetrina) {
      var prima = window.salvaLavoroFoto;
      var nuova = async function () {
        var r = await prima.apply(this, arguments);
        if (nascosto && !nascosto.value) { anteprima.removeAttribute('src'); scatola.classList.remove('piena'); }
        return r;
      };
      nuova.__vetrina = true;
      window.salvaLavoroFoto = nuova;
      if (salva) salva.setAttribute('onclick', 'salvaLavoroFoto()');
    }

    /* l'elenco delle foto gia' messe: dal riepilogo a qui */
    var griglia = document.getElementById('lista-lavori-foto');
    if (griglia) {
      var box = griglia.parentNode;
      var elenco = document.createElement('div');
      elenco.className = 'fl-card';
      elenco.innerHTML = '<div class="fl-elenco-tit">Le tue foto <span id="fl-quante"></span></div>' +
        '<p class="fl-elenco-sub">La prima è quella che il cliente vede per prima. Con ⭐ scegli tu quale.</p>';
      elenco.appendChild(griglia);
      sec.appendChild(elenco);
      /* il vecchio riquadro del riepilogo, rimasto col solo titolo, si toglie */
      if (box && !box.querySelector('.foto-grid')) box.remove();
      var conta = function () {
        var n = [].filter.call(griglia.children, function (c) { return !c.classList.contains('empty-state'); }).length;
        var q = document.getElementById('fl-quante');
        if (q) q.textContent = n ? '(' + n + ')' : '';
      };
      new MutationObserver(conta).observe(griglia, { childList: true });
      conta();
    }
  }

  /* ------------------------------------------------------------------ */
  function quando(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    var oggi = new Date(), ieri = new Date(Date.now() - 864e5);
    var ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === oggi.toDateString()) return 'Oggi alle ' + ora;
    if (d.toDateString() === ieri.toDateString()) return 'Ieri alle ' + ora;
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ' alle ' + ora;
  }

  function abbellisciLista(rows) {
    var ultimi = {};
    (rows || []).forEach(function (m) { if (!ultimi[m.conversation_id]) ultimi[m.conversation_id] = m; });
    document.querySelectorAll('#sec-messaggi .msg-conv-item').forEach(function (it) {
      if (it.querySelector('.mv-avatar')) return;
      var sx = it.querySelector('.msg-conv-sx'); if (!sx) return;
      var nome = (it.getAttribute('data-nome') || 'Cliente').trim();
      var av = document.createElement('div'); av.className = 'mv-avatar';
      av.textContent = (nome.charAt(0) || '?').toUpperCase();
      var testi = document.createElement('div'); testi.className = 'mv-testi';
      while (sx.firstChild) testi.appendChild(sx.firstChild);
      var u = ultimi[it.getAttribute('data-conv')];
      if (u && u.created_at) {
        var q = document.createElement('div'); q.className = 'mv-quando';
        q.textContent = (u.mittente === 'impresa' ? 'Hai risposto · ' : '') + quando(u.created_at);
        testi.appendChild(q);
      }
      sx.appendChild(av); sx.appendChild(testi);
      if (it.querySelector('.msg-badge')) it.classList.add('nuovo');
    });
  }

  function messaggi() {
    var sec = document.getElementById('sec-messaggi');
    var aperta = document.getElementById('chat-aperta');
    if (!sec || !aperta || sec.getAttribute('data-vetrina')) return;
    sec.setAttribute('data-vetrina', '1');

    /* la testa della conversazione aperta: Indietro, chi e', e i due
       pulsanti (togli dall'elenco, blocca) piccoli a destra */
    /* ⚠️ js/freccia-indietro.js parte PRIMA e trasforma gia' «← Torna alle
       conversazioni» in un pulsante .ti-back: si cerca l'uno o l'altro */
    var torna = aperta.querySelector('a[onclick*="tornaAConversazioni"]') || aperta.querySelector('.ti-back');
    var togli = aperta.querySelector('button[onclick*="togliConversazioneDalMioElenco"]');
    var blocca = document.getElementById('btn-blocco-cliente');
    var testa = document.createElement('div'); testa.className = 'mv-testa';
    var indietro = document.createElement('button');
    indietro.type = 'button'; indietro.className = 'ti-back';
    indietro.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span>Tutte le conversazioni</span>';
    indietro.addEventListener('click', function () { if (typeof window.tornaAConversazioni === 'function') window.tornaAConversazioni(); });
    var chi = document.createElement('div'); chi.className = 'mv-chi';
    chi.innerHTML = '<div class="mv-avatar" id="mv-av"></div><div><b id="mv-nome"></b><small id="mv-email"></small></div>';
    var az = document.createElement('div'); az.className = 'mv-azioni';
    if (togli) az.appendChild(togli);
    if (blocca) az.appendChild(blocca);
    testa.appendChild(indietro); testa.appendChild(chi); testa.appendChild(az);
    if (torna) torna.replaceWith(testa); else aperta.insertBefore(testa, aperta.firstChild);

    if (typeof window.apriConversazione === 'function' && !window.apriConversazione.__vetrina) {
      var primaApri = window.apriConversazione;
      var nuovaApri = function (convId, nome, email) {
        var r = primaApri.apply(this, arguments);
        var n = (nome || 'Cliente').trim();
        var a = document.getElementById('mv-av'); if (a) a.textContent = (n.charAt(0) || '?').toUpperCase();
        var b = document.getElementById('mv-nome'); if (b) b.textContent = n;
        var e = document.getElementById('mv-email'); if (e) e.textContent = email || '';
        return r;
      };
      nuovaApri.__vetrina = true;
      window.apriConversazione = nuovaApri;
    }
    if (typeof window.renderListaConversazioni === 'function' && !window.renderListaConversazioni.__vetrina) {
      var primaLista = window.renderListaConversazioni;
      var nuovaLista = function (rows) {
        var r = primaLista.apply(this, arguments);
        try { abbellisciLista(rows); } catch (e) { console.error('messaggi grafica:', e); }
        return r;
      };
      nuovaLista.__vetrina = true;
      window.renderListaConversazioni = nuovaLista;
    }
  }

  function parti() {
    var st = document.createElement('style'); st.id = 'sezioni-vetrina-css'; st.textContent = CSS;
    document.head.appendChild(st);
    try { foto(); } catch (e) { console.error('foto grafica:', e); }
    try { messaggi(); } catch (e) { console.error('messaggi grafica:', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti);
  else parti();
})();
