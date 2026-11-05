/* ============================================================
   BOLLINO «Ci trovi su TrovaImpresa» — 3 novembre 2026
   ------------------------------------------------------------
   Perche' esiste: Google sale chi viene nominato da altri siti.
   Le imprese iscritte che hanno un sito (56 su 198 il 3 nov)
   possono mettere un link al loro profilo: e' un vantaggio per
   loro (i clienti leggono le recensioni) e per TrovaImpresa.

   ⛔ NON E' UN OBBLIGO. Alessio voleva «per forza», abbiamo
   scelto l'avviso: Google punisce i link chiesti come
   condizione di un servizio. Il pulsante «Piu' tardi» deve
   restare SEMPRE visibile.

   Quando compare (tutte e quattro insieme):
   - l'iscritto ha un sito vero in imprese.sito_web
     (non Facebook / Instagram)
   - non ha mai cliccato «Fatto»     → imprese.bollino_messo_il
   - non ha rimandato da meno di 7 gg → imprese.bollino_rimanda_al
   - non e' gia' comparsa in questa visita (sessionStorage)

   Si carica nei 3 pannelli: artigiano, impresa, professionisti.
   Usa le classi delle finestre del pannello (.modal-ai-*),
   qui sotto c'e' solo lo stile del bollino.
   ============================================================ */
(function () {
  var GIORNI_RIMANDO = 7;
  var ATTESA_MS = 2500;          // dopo il caricamento, per non coprire subito il pannello
  var CHIAVE_VISTA = 'ti-bollino-visto';

  function sitoVero(s) {
    s = (s || '').trim().toLowerCase();
    if (!s) return false;
    if (/facebook\.|instagram\.|fb\.com|tiktok\.|linkedin\./.test(s)) return false;
    return true;
  }

  function linkProfilo(id) {
    return 'https://trovaimpresa.com/profilo-impresa?id=' + encodeURIComponent(id);
  }

  // Il codice che l'impresa incolla sul suo sito: tutto in linea, cosi'
  // funziona su qualunque sito (WordPress, Wix, sito fatto a mano).
  function codiceBollino(id) {
    return '<a href="' + linkProfilo(id) + '" target="_blank" title="Leggi le recensioni su TrovaImpresa" ' +
      'style="display:inline-flex;align-items:center;gap:12px;padding:12px 18px;border:1.5px solid #dde3ea;' +
      'border-radius:14px;background:#fff;text-decoration:none;font-family:Arial,sans-serif;color:#1a1a1a">' +
      '<img src="https://trovaimpresa.com/img/trovaimpresa-logo.svg" alt="TrovaImpresa" height="46" style="height:46px;width:auto">' +
      '<span style="display:block;line-height:1.3"><b style="font-size:17px">Ci trovi su trovaimpresa.it</b><br>' +
      '<span style="font-size:15px;font-weight:600;color:#0066ff">&#9733; Leggi le recensioni &rarr;</span></span></a>';
  }

  function scappa(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function stile() {
    if (document.getElementById('ti-bollino-stile')) return;
    var s = document.createElement('style');
    s.id = 'ti-bollino-stile';
    s.textContent =
      '#modal-bollino .modal-ai{max-width:720px}' +
      '#modal-bollino .modal-ai-close{color:var(--mid)}' +
      '#modal-bollino .bollino-anteprima{display:flex;justify-content:center;padding:18px;background:#fff;border-radius:12px;border:1px dashed var(--border)}' +
      '#modal-bollino .bollino-codice{width:100%;height:96px;padding:12px 14px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg);font-family:ui-monospace,Consolas,monospace;font-size:13px;color:var(--mid);resize:none;line-height:1.5}' +
      '#modal-bollino .bollino-nota{font-size:15px;color:var(--light);margin-top:10px}' +
      '#modal-bollino .modal-footer{padding:0 28px 28px}' +
      '#modal-bollino .btn-chiudi{flex:0 0 auto}' +
      '@media(max-width:600px){#modal-bollino .modal-footer{flex-direction:column-reverse}#modal-bollino .btn-chiudi{width:100%}}';
    document.head.appendChild(s);
  }

  function salva(campi) {
    try {
      if (typeof sb === 'undefined' || typeof impresaCorrente === 'undefined') return;
      Object.assign(impresaCorrente, campi);
      sb.from('imprese').update(campi).eq('id', impresaCorrente.id).then(function (r) {
        if (r && r.error) console.warn('[bollino] salvataggio non riuscito', r.error.message);
      });
    } catch (e) { console.warn('[bollino]', e); }
  }

  function chiudi(modo) {
    var o = document.getElementById('modal-bollino');
    if (o) o.remove();
    if (modo === 'fatto') {
      salva({ bollino_messo_il: new Date().toISOString(), bollino_rimanda_al: null });
    } else {
      var d = new Date(); d.setDate(d.getDate() + GIORNI_RIMANDO);
      salva({ bollino_rimanda_al: d.toISOString() });
    }
  }

  function apri(imp) {
    stile();
    var codice = codiceBollino(imp.id);
    var o = document.createElement('div');
    o.className = 'modal-ai-overlay show';
    o.id = 'modal-bollino';
    o.innerHTML =
      '<div class="modal-ai" role="dialog" aria-modal="true" aria-labelledby="bollino-titolo">' +
        '<div class="modal-ai-header">' +
          '<div><h2 id="bollino-titolo">⭐ Fatti trovare di più</h2>' +
          '<p>Metti il bollino TrovaImpresa sul tuo sito: i clienti vedono le tue recensioni.</p></div>' +
          '<button class="modal-ai-close" type="button" aria-label="Chiudi" data-b="tardi">✕</button>' +
        '</div>' +
        '<div class="modal-ai-body">' +
          '<div class="richiesta-box">' +
            '<div class="ric-title">Così si vede sul tuo sito</div>' +
            '<div class="bollino-anteprima">' + codice.replace('target="_blank"', 'target="_blank" rel="noopener"') + '</div>' +
          '</div>' +
          '<div class="ric-title">Il codice da incollare</div>' +
          '<textarea class="bollino-codice" readonly>' + scappa(codice) + '</textarea>' +
          '<div class="ai-genera-box" style="margin-top:14px"><button class="ai-genera-btn" type="button" data-b="copia">📋 Copia il codice</button></div>' +
          '<div class="bollino-nota">Non sai dove incollarlo? Giralo a chi ti ha fatto il sito.</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn-chiudi" type="button" data-b="tardi">Più tardi</button>' +
          '<button class="btn-invia-prev" type="button" data-b="fatto">✓ Fatto, l\'ho messo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', function (ev) {
      if (ev.target === o) return chiudi('tardi');
      var b = ev.target.closest('[data-b]');
      if (!b) return;
      var cosa = b.getAttribute('data-b');
      if (cosa === 'copia') {
        var ta = o.querySelector('.bollino-codice');
        var fatto = function () { b.textContent = '✓ Codice copiato'; setTimeout(function () { b.textContent = '📋 Copia il codice'; }, 2500); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ta.value).then(fatto, function () { ta.select(); document.execCommand('copy'); fatto(); });
        } else { ta.select(); document.execCommand('copy'); fatto(); }
        return;
      }
      chiudi(cosa);
    });
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape' && document.getElementById('modal-bollino')) { chiudi('tardi'); document.removeEventListener('keydown', esc); }
    });
  }

  function vaMostrata(imp) {
    if (!imp || typeof imp.id !== 'number') return false;          // impresa vera (id numerico)
    if (!sitoVero(imp.sito_web)) return false;
    if (imp.bollino_messo_il) return false;
    if (imp.bollino_rimanda_al && new Date(imp.bollino_rimanda_al) > new Date()) return false;
    try { if (sessionStorage.getItem(CHIAVE_VISTA)) return false; } catch (e) {}
    if (document.querySelector('.modal-ai-overlay.show, .modal-overlay.show')) return false; // un'altra finestra aperta
    return true;
  }

  // Aspetta che il pannello abbia caricato l'impresa (impresaCorrente).
  var tentativi = 0;
  var giro = setInterval(function () {
    tentativi++;
    var imp = (typeof impresaCorrente !== 'undefined') ? impresaCorrente : null;
    if (imp && imp.id) {
      clearInterval(giro);
      setTimeout(function () {
        if (!vaMostrata(imp)) return;
        try { sessionStorage.setItem(CHIAVE_VISTA, '1'); } catch (e) {}
        apri(imp);
      }, ATTESA_MS);
    } else if (tentativi > 60) {
      clearInterval(giro);                                          // 30 secondi: non e' entrato nessuno
    }
  }, 500);

  // Per guardarla senza aspettare: aggiungi ?bollino=prova all'indirizzo del pannello
  window.TIBollino = { apri: function () { if (typeof impresaCorrente !== 'undefined' && impresaCorrente) apri(impresaCorrente); } };
  if (/[?&]bollino=prova/.test(location.search)) {
    try { sessionStorage.removeItem(CHIAVE_VISTA); } catch (e) {}
  }
})();
