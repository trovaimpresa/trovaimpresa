/* 19 ott 2026 — Stesso avviso di js/avviso-richieste.js, per il pannello professionisti.
   Qui le richieste sono «incarichi» (tabella incarichi_richieste), e la lista si apre
   col pulsante «Rispondi».
   8 nov 2026: la funzione segna_incarico_visto(bigint) non poteva funzionare (gli
   id degli incarichi sono uuid) e la card cercava un id fatto di sole cifre: il
   «Ho visto» non compariva mai. Adesso si scrive direttamente sulla riga (la regola
   del database lo permette solo al professionista a cui e' mandata).
   E lo stato e' UNO SOLO col gestionale («Richieste dal sito»): sta nella colonna
   stato della riga — nuova · vista · preventivo · chiusa — e la risposta mandata
   (risposta_at) vale per tutti e due. */
(function () {
  if (window.__avvisoIncarichiOk) return;
  window.__avvisoIncarichiOk = true;

  var css = [
    '#avviso-richieste{display:none;align-items:center;gap:12px;background:#c0392b;color:#fff;',
    'border-radius:12px;padding:14px 16px;margin:0 0 16px;font-weight:700;font-size:17px;',
    'cursor:pointer;animation:avviso-lampeggia 1s steps(2,start) infinite}',
    '#avviso-richieste.on{display:flex}',
    '#avviso-richieste .av-n{background:#fff;color:#c0392b;border-radius:999px;min-width:34px;height:34px;',
    'display:grid;place-items:center;font-size:18px;flex:0 0 auto}',
    '#avviso-richieste small{display:block;font-weight:400;font-size:14px;opacity:.95}',
    '@keyframes avviso-lampeggia{0%{box-shadow:0 0 0 0 rgba(192,57,43,.7)}50%{box-shadow:0 0 0 10px rgba(192,57,43,0)}100%{box-shadow:0 0 0 0 rgba(192,57,43,0)}}',
    '.prev-card .av-visto{margin-left:8px;background:#eef3ff;color:#0066ff;border:0;border-radius:8px;',
    'padding:8px 12px;font-size:15px;font-weight:700;cursor:pointer}',
    '.prev-card .av-visto:hover{background:#dfe9ff}'
  ].join('');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function idImpresa() {
    return (typeof impresaCorrente !== 'undefined' && impresaCorrente && impresaCorrente.id) ? impresaCorrente.id : null;
  }

  async function nonLette() {
    var id = idImpresa();
    if (!id || typeof sb === 'undefined') return [];
    try {
      var r = await sb.from('incarichi_richieste').select('id')
        .eq('professionista_id', id).is('visto_il', null);
      return r.data || [];
    } catch (e) { return []; }
  }

  async function segna(richiestaId) {
    try {
      var r = await sb.from('incarichi_richieste').update({ visto_il: new Date().toISOString() })
        .eq('id', String(richiestaId)).is('visto_il', null).select('id');
      if (r.error) return false;
      if (statiRighe[String(richiestaId)]) statiRighe[String(richiestaId)].visto = true;
      return true;
    } catch (e) { return false; }
  }

  /* ---- lo stato di ogni richiesta, uguale a quello del gestionale ---- */
  var STATI = {
    nuova:      { lab: '🆕 Nuova',            cls: 'badge-nuovo' },
    vista:      { lab: '👁 Vista',            cls: 'badge-inviato' },
    preventivo: { lab: '🧾 Preventivo fatto', cls: 'badge-inviato' },
    chiusa:     { lab: '✔ Chiusa',            cls: 'badge-inviato' },
    risposto:   { lab: '✅ Risposto',          cls: 'badge-inviato' }
  };
  var statiRighe = {};   /* id -> {stato, visto, risposto} letti dal database */

  async function leggiStati() {
    var id = idImpresa();
    if (!id || typeof sb === 'undefined') return;
    try {
      var r = await sb.from('incarichi_richieste').select('id,stato,visto_il,risposta_at').eq('professionista_id', id);
      var m = {};
      ((r && r.data) || []).forEach(function (x) {
        m[String(x.id)] = { stato: x.stato, visto: !!x.visto_il, risposto: !!x.risposta_at };
      });
      statiRighe = m;
    } catch (e) {}
  }

  function statoDi(id) {
    var x = statiRighe[String(id)]; if (!x) return 'nuova';
    var st = (['vista', 'preventivo', 'chiusa'].indexOf(x.stato) >= 0) ? x.stato : 'nuova';
    if (st === 'nuova' && x.visto) st = 'vista';
    if (x.risposto && (st === 'nuova' || st === 'vista')) st = 'risposto';
    return st;
  }

  async function scriviStato(id, stato) {
    try {
      var agg = { stato: stato };
      var x = statiRighe[String(id)];
      if (!x || !x.visto) agg.visto_il = new Date().toISOString();
      var r = await sb.from('incarichi_richieste').update(agg).eq('id', String(id)).select('id');
      if (r.error || !r.data || !r.data.length) { alert('Non sono riuscito a salvare. Riprova.'); return false; }
      statiRighe[String(id)] = Object.assign(x || {}, { stato: stato, visto: true });
      return true;
    } catch (e) { alert('Non sono riuscito a salvare. Riprova.'); return false; }
  }

  function sistemaCard(card) {
    var id = idDaCard(card); if (!id) return;
    var badge = card.querySelector('.prev-badge'); if (!badge) return;
    var st = statoDi(id), d = STATI[st] || STATI.nuova;
    badge.textContent = d.lab;
    badge.classList.remove('badge-nuovo', 'badge-inviato'); badge.classList.add(d.cls);
    var t = card.querySelector('.rs-tasto');
    if (!t) {
      t = document.createElement('button');
      t.type = 'button'; t.className = 'rs-tasto';
      t.style.cssText = 'margin-left:8px;background:#fff;color:#0a2a4d;border:2px solid #0a2a4d;border-radius:10px;padding:8px 14px;font:inherit;font-size:15px;font-weight:700;cursor:pointer';
      var piede = card.querySelector('.prev-footer') || card;
      piede.appendChild(t);
      t.addEventListener('click', async function (e) {
        e.stopPropagation();
        var nuovo = statoDi(id) === 'chiusa' ? 'vista' : 'chiusa';
        if (await scriviStato(id, nuovo)) { sistemaCard(card); contaDaGuardare(); window.avvisoRichiesteRicontrolla(); }
      });
    }
    t.textContent = st === 'chiusa' ? '↩ Riapri' : '✔ Segna chiusa';
    var hv = card.querySelector('.av-visto'); if (hv && st !== 'nuova') hv.remove();
    var pf = card.querySelector('.prev-footer'); if (pf) { pf.style.flexWrap = 'wrap'; pf.style.gap = '8px'; }
  }

  /* il numerino sulla card del riepilogo: solo quelle ancora da guardare */
  function contaDaGuardare() {
    var b = document.getElementById('badge-prev-card'); if (!b) return;
    var n = 0;
    Object.keys(statiRighe).forEach(function (k) { var st = statoDi(k); if (st === 'nuova' || st === 'vista') n++; });
    b.textContent = n; b.style.display = n > 0 ? 'inline-block' : 'none';
  }

  async function aggiornaTutto() {
    await leggiStati();
    document.querySelectorAll('#lista-preventivi .prev-card').forEach(sistemaCard);
    contaDaGuardare();
  }

  function banner() {
    var b = document.getElementById('avviso-richieste');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'avviso-richieste';
    b.setAttribute('role', 'button');
    b.setAttribute('tabindex', '0');
    b.innerHTML = '<span class="av-n" id="avviso-richieste-n"></span>' +
      '<div><span id="avviso-richieste-t"></span><small>Tocca per vedere le richieste dei clienti</small></div>';
    b.addEventListener('click', function () {
      if (typeof showSectionById === 'function') showSectionById('preventivi');
    });
    var main = document.querySelector('main.main');
    if (main) main.insertBefore(b, main.firstChild);
    return b;
  }

  window.avvisoRichiesteRicontrolla = async function () {
    var lista = await nonLette();
    var b = banner();
    var n = lista.length;
    if (n > 0) {
      b.classList.add('on');
      document.getElementById('avviso-richieste-n').textContent = n;
      document.getElementById('avviso-richieste-t').textContent =
        n === 1 ? 'Hai 1 richiesta da leggere' : 'Hai ' + n + ' richieste da leggere';
    } else {
      b.classList.remove('on');
    }
    return n;
  };

  // Ogni card ha il pulsante «Elimina» con l'id: da lì si ricava la richiesta
  function idDaCard(card) {
    var m = (card.innerHTML || '').match(/eliminaIncarico\('([0-9a-fA-F-]+)'\)/);
    return m ? m[1] : null;
  }

  function decora() {
    var cards = document.querySelectorAll('#lista-preventivi .prev-card');
    cards.forEach(function (card) {
      var id = idDaCard(card);
      var badge = card.querySelector('.prev-badge');
      var nuova = badge && badge.classList.contains('badge-nuovo');
      if (!id || !nuova || statoDi(id) !== 'nuova' || card.querySelector('.av-visto')) return;
      var footer = card.querySelector('.prev-footer');
      if (!footer) return;
      var bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'av-visto';
      bt.textContent = '✓ Ho visto';
      bt.addEventListener('click', async function () {
        bt.disabled = true;
        var ok = await segna(id);
        if (!ok) { bt.disabled = false; alert('Non sono riuscito a segnarla come vista. Riprova.'); return; }
        bt.remove();
        sistemaCard(card); contaDaGuardare();
        window.avvisoRichiesteRicontrolla();
      });
      footer.appendChild(bt);
    });
  }

  // Aprire «Rispondi» vuol dire averla letta
  var origRisp = window.toggleRisposta;
  if (typeof origRisp === 'function') {
    window.toggleRisposta = async function (richiestaId) {
      await segna(richiestaId);
      var r = await origRisp.apply(this, arguments);
      var c = Array.prototype.slice.call(document.querySelectorAll('#lista-preventivi .prev-card'))
        .filter(function (x) { return idDaCard(x) === String(richiestaId); })[0];
      if (c) { sistemaCard(c); contaDaGuardare(); }
      window.avvisoRichiesteRicontrolla();
      return r;
    };
  }

  var origCarica = window.caricaPreventivi;
  if (typeof origCarica === 'function') {
    window.caricaPreventivi = async function () {
      var r = await origCarica.apply(this, arguments);
      await aggiornaTutto();
      decora();
      window.avvisoRichiesteRicontrolla();
      return r;
    };
  }

  var tentativi = 0;
  var attesa = setInterval(function () {
    tentativi++;
    if (idImpresa()) {
      clearInterval(attesa);
      aggiornaTutto().then(decora);
      window.avvisoRichiesteRicontrolla();
      setInterval(function () { decora(); window.avvisoRichiesteRicontrolla(); }, 60000);
    } else if (tentativi > 120) {
      clearInterval(attesa);
    }
  }, 1000);
})();
