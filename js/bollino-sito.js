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
   5 nov 2026: riquadro piccolo in basso a destra (#ti-bollino),
   non piu' la finestra grande al centro.
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

  // 5 nov 2026 sera: non piu' una finestra al centro ma un riquadro piccolo
  // in basso a destra (Alex: «messo cosi' e' strano», «anche piu' piccolo»).
  function stile() {
    if (document.getElementById('ti-bollino-stile')) return;
    var s = document.createElement('style');
    s.id = 'ti-bollino-stile';
    s.textContent =
      '#ti-bollino{position:fixed;right:24px;bottom:96px;z-index:900;width:330px;background:#fff;border:1px solid #dde3ea;border-radius:14px;box-shadow:0 10px 30px rgba(10,42,77,.18);padding:14px 16px 16px;font-family:inherit;color:#0a2a4d;box-sizing:border-box}' +
      '#ti-bollino .tb-top{display:flex;align-items:flex-start;gap:8px}' +
      '#ti-bollino .tb-tit{font-size:15.5px;font-weight:800;flex:1;line-height:1.3;margin:0}' +
      '#ti-bollino .tb-x{border:0;background:none;font-size:18px;color:#64748b;cursor:pointer;padding:0 2px;line-height:1}' +
      '#ti-bollino .tb-txt{font-size:14px;color:#475569;margin:6px 0 12px;line-height:1.4}' +
      '#ti-bollino .tb-btns{display:flex;gap:8px}' +
      '#ti-bollino .tb-btns button{flex:1;font:inherit;font-size:14px;font-weight:700;border-radius:10px;padding:10px 8px;cursor:pointer}' +
      '#ti-bollino .tb-copia{background:#0a2a4d;color:#fff;border:0}' +
      '#ti-bollino .tb-fatto{background:#fff;color:#0a2a4d;border:1.5px solid #0a2a4d}' +
      '@media(max-width:600px){#ti-bollino{left:12px;right:12px;width:auto;bottom:84px}}';
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
    var o = document.getElementById('ti-bollino');
    if (o) o.remove();
    if (modo === 'fatto') {
      salva({ bollino_messo_il: new Date().toISOString(), bollino_rimanda_al: null });
    } else {
      var d = new Date(); d.setDate(d.getDate() + GIORNI_RIMANDO);
      salva({ bollino_rimanda_al: d.toISOString() });
    }
  }

  function apri(imp) {
    if (document.getElementById('ti-bollino')) return;
    stile();
    var codice = codiceBollino(imp.id);
    var o = document.createElement('div');
    o.id = 'ti-bollino';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-labelledby', 'tb-titolo');
    o.innerHTML =
      '<div class="tb-top"><p class="tb-tit" id="tb-titolo">⭐ Hai un sito? Mettici il bollino</p>' +
        '<button class="tb-x" type="button" aria-label="Più tardi" data-b="tardi">✕</button></div>' +
      '<div class="tb-txt">Un riquadro «Ci trovi su TrovaImpresa»: i clienti leggono le tue recensioni.</div>' +
      '<div class="tb-btns"><button class="tb-copia" type="button" data-b="copia">📋 Copia il codice</button>' +
        '<button class="tb-fatto" type="button" data-b="fatto">✓ L\'ho messo</button></div>';
    document.body.appendChild(o);

    o.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-b]');
      if (!b) return;
      var cosa = b.getAttribute('data-b');
      if (cosa === 'copia') {
        var fatto = function () { b.textContent = '✓ Copiato'; setTimeout(function () { b.textContent = '📋 Copia il codice'; }, 3000); };
        // Prima la strada vecchia (funziona sempre), poi quella nuova come riserva
        var ok = false;
        try {
          var ta = document.createElement('textarea');
          ta.value = codice; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
        } catch (e) {}
        if (ok) return fatto();
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(codice).then(fatto, function () {});
        return;
      }
      chiudi(cosa);
    });
  }

  function vaMostrata(imp) {
    if (!imp || typeof imp.id !== 'number') return false;          // impresa vera (id numerico)
    if (!sitoVero(imp.sito_web)) return false;
    if (imp.bollino_messo_il) return false;
    if (imp.bollino_rimanda_al && new Date(imp.bollino_rimanda_al) > new Date()) return false;
    try { if (sessionStorage.getItem(CHIAVE_VISTA)) return false; } catch (e) {}
    if (document.getElementById('ti-bollino')) return false;
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
