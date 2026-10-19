/* 19 ott 2026 — Stesso avviso di js/avviso-richieste.js, per il pannello professionisti.
   Qui le richieste sono «incarichi» (tabella incarichi_richieste), e la lista si apre
   col pulsante «Rispondi». Lettura vera: funzione del database segna_incarico_visto. */
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
      var r = await sb.rpc('segna_incarico_visto', { p_id: Number(richiestaId) });
      return !r.error;
    } catch (e) { return false; }
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
    var m = (card.innerHTML || '').match(/eliminaIncarico\('(\d+)'\)/);
    return m ? m[1] : null;
  }

  function decora() {
    var cards = document.querySelectorAll('#lista-preventivi .prev-card');
    cards.forEach(function (card) {
      var id = idDaCard(card);
      var badge = card.querySelector('.prev-badge');
      var nuova = badge && badge.classList.contains('badge-nuovo');
      if (!id || !nuova || card.querySelector('.av-visto')) return;
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
        if (badge) { badge.textContent = '👁 Vista'; badge.classList.remove('badge-nuovo'); badge.classList.add('badge-inviato'); }
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
      window.avvisoRichiesteRicontrolla();
      return r;
    };
  }

  var origCarica = window.caricaPreventivi;
  if (typeof origCarica === 'function') {
    window.caricaPreventivi = async function () {
      var r = await origCarica.apply(this, arguments);
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
      decora();
      window.avvisoRichiesteRicontrolla();
      setInterval(function () { decora(); window.avvisoRichiesteRicontrolla(); }, 60000);
    } else if (tentativi > 120) {
      clearInterval(attesa);
    }
  }, 1000);
})();
