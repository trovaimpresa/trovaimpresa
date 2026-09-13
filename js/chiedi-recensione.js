/* ============================================================
   CHIEDI UNA RECENSIONE
   13 settembre 2026

   PERCHE' ESISTE.
   Le recensioni su TrovaImpresa erano gia' costruite tutte: il
   modulo sulla scheda, la mail di conferma al cliente (che tiene
   fuori le recensioni finte), la risposta dell'impresa, la pagina
   dedicata. Collaudato dal vivo il 3 settembre.
   Eppure al 13 settembre nel database c'era UNA sola recensione
   mai arrivata in fondo, e ZERO confermate su tutto il sito.

   Il motivo non era un guasto: era che NESSUNO le chiedeva.
   Un cliente contento non si sveglia la mattina con la voglia di
   scrivere una recensione — gliela devi chiedere tu, il giorno che
   finisci il lavoro, mentre e' ancora contento.

   COSA FA.
   Mette nella dashboard, sotto la carta della vetrina, una carta con:
     · il messaggio gia' scritto, pronto da mandare
     · «Chiedila su WhatsApp» — apre WhatsApp col testo dentro,
       l'impresa sceglie il cliente e manda
     · «Copia il messaggio» — per la mail o gli SMS
     · «Vedi le mie recensioni» — la sua pagina pubblica
     · quante recensioni ha adesso

   Il link porta dritto al MODULO (#recensioni), non alla scheda
   generica: il cliente apre e ha gia' le stelle davanti. Un
   passaggio in meno e' gente che arriva in fondo.

   COME SI AGGANCIA.
   Uguale a condividi-vetrina.js: non tocca il codice del pannello,
   aspetta che `impresaCorrente` sia pronta e si infila sotto la
   carta della vetrina. Se qualcosa manca, non fa niente e non
   rompe nulla.

   Si aggiunge con una riga sola in fondo al pannello:
     <script src="/js/chiedi-recensione.js" defer></script>

   ⚠️ NON e' nel pannello NEGOZIO, come condividi-vetrina.js:
   quella categoria sta diventando solo spazio pubblicitario.
   ============================================================ */
(function () {
  'use strict';

  var SITO = 'https://trovaimpresa.com';

  function nota(msg, extra) {
    try { console.warn('[chiedi-recensione] ' + msg, extra === undefined ? '' : extra); } catch (e) {}
  }

  function nome(imp) {
    return String(imp.nome_attivita || imp.nome || '').trim();
  }

  /* il link va al modulo, non alla scheda: la card del modulo sulla
     scheda ha id="recensioni" (deciso il 3 settembre) */
  function linkModulo(imp) { return SITO + '/profilo-impresa?id=' + encodeURIComponent(imp.id) + '#recensioni'; }
  function linkPagina(imp) { return SITO + '/recensioni-impresa?id=' + encodeURIComponent(imp.id); }

  function messaggio(imp) {
    var chi = nome(imp);
    var righe = [
      chi ? ('Buongiorno, sono ' + chi + '.') : 'Buongiorno,',
      'Se si è trovato bene con il lavoro che abbiamo fatto, mi farebbe piacere una sua recensione: ci vogliono due minuti e mi aiuta molto a farmi conoscere.',
      'Grazie!',
      '',
      linkModulo(imp)
    ];
    return righe.join('\n');
  }

  var STILE = [
    /* stessa forma della carta vetrina, riga verde per distinguerla */
    '.cr-card{background:#fff;border-radius:14px;padding:20px 22px;margin:0 0 18px;',
      'box-shadow:0 2px 12px rgba(0,0,0,.07);border-left:4px solid #25D366}',
    '.cr-tit{font-weight:800;color:#0a2a4d;font-size:1.02rem;margin:0 0 6px}',
    '.cr-sub{color:#5b6b80;font-size:.92rem;line-height:1.55;margin:0 0 14px}',
    '.cr-sub b{color:#0a2a4d}',
    '.cr-msg{background:#f4f6f9;border:1px solid #e3e8ef;border-left:3px solid #25D366;border-radius:9px;',
      'padding:12px 14px;margin:0 0 14px;font-size:.89rem;color:#33415c;line-height:1.6;white-space:pre-line}',
    '.cr-btns{display:flex;gap:10px;flex-wrap:wrap}',
    '.cr-b{border:0;border-radius:9px;padding:11px 18px;font-size:.93rem;font-weight:700;',
      'cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block}',
    '.cr-b.wa{background:#25D366;color:#fff}',
    '.cr-b.sec{background:#fff;color:#0052cc;border:1.5px solid #0052cc}',
    '.cr-ok{color:#15803d;font-weight:700;font-size:.9rem;margin:12px 0 0;display:none}',
    '@media(max-width:520px){.cr-btns{flex-direction:column}.cr-b{text-align:center}}'
  ].join('');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  function disegna(imp) {
    if (document.getElementById('cr-card')) return;           // una volta sola
    var stats = document.querySelector('#sec-dashboard .dash-stats');
    if (!stats || !imp || !imp.id) return;

    var s = document.createElement('style'); s.textContent = STILE;
    document.head.appendChild(s);

    var testo = messaggio(imp);
    var card = document.createElement('div');
    card.className = 'cr-card'; card.id = 'cr-card';
    card.innerHTML =
      '<p class="cr-tit">Chiedi una recensione a chi hai già servito</p>' +
      '<p class="cr-sub">È la prima cosa che guarda chi non ti conosce. Al cliente costa due minuti, ' +
        'e la scrive lui: tu non puoi toccarla.' +
        '<br><span id="cr-quante"></span></p>' +
      '<div class="cr-msg" id="cr-testo">' + esc(testo) + '</div>' +
      '<div class="cr-btns">' +
        '<a class="cr-b wa" id="cr-wa" href="https://wa.me/?text=' + encodeURIComponent(testo) + '" ' +
          'target="_blank" rel="noopener">Chiedila su WhatsApp</a>' +
        '<button type="button" class="cr-b sec" id="cr-copia">Copia il messaggio</button>' +
        '<a class="cr-b sec" href="' + esc(linkPagina(imp)) + '" target="_blank" rel="noopener">Vedi le mie recensioni</a>' +
      '</div>' +
      '<p class="cr-ok" id="cr-ok">Copiato. Ora incollalo dove vuoi.</p>';

    /* sotto la carta della vetrina se c'e', se no sopra i numeri */
    var vetrina = document.getElementById('cv-card');
    if (vetrina && vetrina.parentNode) vetrina.parentNode.insertBefore(card, vetrina.nextSibling);
    else stats.parentNode.insertBefore(card, stats);

    document.getElementById('cr-copia').addEventListener('click', function () {
      var ok = document.getElementById('cr-ok');
      /* sul telefono il tasto Condividi del sistema apre direttamente
         WhatsApp invece di fermarsi agli appunti */
      if (navigator.share) {
        navigator.share({ text: testo }).catch(function () { copiaEBasta(testo, ok); });
        return;
      }
      copiaEBasta(testo, ok);
    });

    quanteNeHai(imp);
  }

  /* ============================================================
     QUANTE NE HAI
     `recensioni_riepilogo(id)` esiste dal 3 settembre e conta solo
     le recensioni CONFERMATE dal cliente. E' lo stesso numero che
     si vede sulla scheda pubblica: se qui ne dicessimo uno diverso,
     l'impresa penserebbe che il sito sbaglia.
     Se la chiamata non riesce, la riga resta vuota e la carta
     funziona lo stesso — ma l'errore si vede nella console.
     ============================================================ */
  function quanteNeHai(imp) {
    var riga = document.getElementById('cr-quante');
    if (!riga) return;
    var c = null;
    try { if (window.sb && window.sb.rpc) c = window.sb; } catch (e) {}
    try { if (!c && typeof sb !== 'undefined' && sb && sb.rpc) c = sb; } catch (e) {}
    if (!c) { nota('non ho trovato il collegamento Supabase della pagina'); return; }

    c.rpc('recensioni_riepilogo', { p_impresa_id: imp.id }).then(function (r) {
      if (r && r.error) { nota('non sono riuscito a contare le recensioni: ' + r.error.message); return; }
      var d = Array.isArray(r.data) ? r.data[0] : r.data;
      var n = d && d.totale ? Number(d.totale) : 0;
      if (n > 0) {
        riga.innerHTML = '<b>Hai ' + n + (n === 1 ? ' recensione' : ' recensioni') + '.</b> Ogni volta che finisci un lavoro, chiedine un\'altra.';
      } else {
        riga.innerHTML = '<b>Non ne hai ancora nessuna.</b> Basta chiederlo ai lavori che hai già finito.';
      }
    }).catch(function (e) { nota('errore di rete mentre contavo le recensioni', e && e.message); });
  }

  function copiaEBasta(testo, ok) {
    function fatto() { ok.style.display = 'block'; setTimeout(function () { ok.style.display = 'none'; }, 4000); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(testo).then(fatto, function () { vecchioModo(testo, fatto); });
    } else {
      vecchioModo(testo, fatto);
    }
  }

  /* ⚠️ la scorciatoia moderna non funziona se la pagina non e' in https
     o se il browser e' vecchio: qui sotto il modo di sempre. */
  function vecchioModo(testo, poi) {
    var t = document.createElement('textarea');
    t.value = testo; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); poi(); } catch (e) { window.prompt('Copia questo messaggio:', testo); }
    document.body.removeChild(t);
  }

  /* il pannello riempie `impresaCorrente` dopo il login: aspettiamo
     che ci sia, senza restare ad aspettare per sempre */
  var tentativi = 0;
  var orologio = setInterval(function () {
    tentativi++;
    var imp = (typeof impresaCorrente !== 'undefined' && impresaCorrente) ? impresaCorrente : null;
    if (imp && imp.id) { clearInterval(orologio); try { disegna(imp); } catch (e) { nota('non sono riuscito a disegnare la carta', e && e.message); } }
    else if (tentativi > 60) { clearInterval(orologio); }   // 30 secondi e poi lascia stare
  }, 500);
})();
