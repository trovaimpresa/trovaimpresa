/* ============================================================
   CONDIVIDI LA TUA VETRINA
   12 settembre 2026

   PERCHE' ESISTE.
   Nel pannello non c'era NESSUN link alla propria scheda pubblica:
   l'impresa non poteva nemmeno guardare come la vede un cliente,
   figurarsi mandarla a qualcuno. E il passaparola fra artigiani e'
   il canale piu' forte che questo sito abbia.

   COSA FA.
   Mette in cima alla dashboard una carta con:
     · il link alla sua scheda pubblica
     · «Apri la mia pagina» — per guardarla
     · «Copia il messaggio» — testo gia' pronto per WhatsApp
     · su telefono, il tasto Condividi del sistema

   COME SI AGGANCIA.
   Non tocca il codice del pannello: aspetta che `impresaCorrente`
   sia pronta (la riempie il pannello dopo il login) e si infila
   prima delle carte dei numeri. Se qualcosa manca, non fa niente
   e non rompe nulla.

   Si aggiunge con una riga sola in fondo al pannello:
     <script src="/js/condividi-vetrina.js" defer></script>
   ============================================================ */
(function () {
  'use strict';

  var SITO = 'https://trovaimpresa.com';

  /* le citta' che hanno le pagine mestiere+citta' generate.
     ⚠️ quando se ne aggiungono in genera-mestiere-citta.js, vanno
     aggiunte anche qui, se no il link torna alla scheda (che va bene
     lo stesso: meglio un link in meno che un link nel vuoto). */
  var CITTA = {
    'roma':'roma','milano':'milano','napoli':'napoli','torino':'torino','rieti':'rieti',
    'palermo':'palermo','genova':'genova','bologna':'bologna','firenze':'firenze','bari':'bari',
    'catania':'catania','verona':'verona','venezia':'venezia','messina':'messina','padova':'padova',
    'trieste':'trieste','brescia':'brescia','parma':'parma','modena':'modena','reggio emilia':'reggio-emilia'
  };

  /* quello che l'impresa ha scritto nel profilo -> la pagina giusta.
     Stessa tabella di netlify/functions/invia-annuncio.js: se cambia
     una, va cambiata l'altra. */
  var MESTIERI = {
    'ristrutturazione':'impresa-edile','ristrutturazione completa':'impresa-edile',
    'costruzione nuova':'impresa-edile',
    'edilizia / muratura':'muratore','muratura e strutture':'muratore',
    'idraulica':'idraulico',
    'impianti elettrici':'elettricista','antennista / allarmi':'elettricista',
    'pittura e tinteggiatura':'imbianchino',
    'pavimenti e piastrelle':'piastrellista',
    'cartongesso':'cartongessista',
    'serramenti / infissi':'serramentista','tende da sole / zanzariere':'serramentista','vetraio':'serramentista',
    'climatizzazione / caldaie':'termoidraulico',
    'fotovoltaico / pannelli solari':'installatore-fotovoltaico',
    'coperture e tetti':'rifacimento-tetti','coperture / tetti':'rifacimento-tetti',
    'geometra':'geometra','architetto':'architetto',
    'ingegnere_strutturale':'ingegnere-strutturale','ingegnere strutturale':'ingegnere-strutturale',
    'consulente_energetico':'certificato-energetico','certificatore energetico':'certificato-energetico',
    'termotecnico':'certificato-energetico',
    'direttore_lavori':'direttore-lavori','direttore dei lavori':'direttore-lavori',
    'interior_designer':'interior-designer','interior designer':'interior-designer','arredatore':'interior-designer'
  };

  function linkScheda(imp) { return SITO + '/profilo-impresa?id=' + encodeURIComponent(imp.id); }

  function linkPagina(imp) {
    var slug = CITTA[String(imp.citta || '').trim().toLowerCase()];
    if (!slug) return null;
    var voci = [].concat(Array.isArray(imp.mestieri) ? imp.mestieri : [])
                .concat(imp.mestiere ? [imp.mestiere] : [])
                .map(function (v) { return String(v).toLowerCase().trim(); });
    for (var i = 0; i < voci.length; i++) {
      if (MESTIERI[voci[i]]) return SITO + '/' + MESTIERI[voci[i]] + '-' + slug;
    }
    return SITO + '/imprese-' + slug;
  }

  function nome(imp) {
    return String(imp.nome_attivita || imp.nome || '').trim() || 'la mia attività';
  }

  function messaggio(imp) {
    var righe = [
      'Siamo su TrovaImpresa, il portale delle imprese edili e degli artigiani.',
      '',
      'Questa è la nostra scheda — foto dei lavori, recensioni e contatti:',
      linkScheda(imp)
    ];
    if (imp.citta) righe.push('', 'Ci trovi a ' + String(imp.citta).trim() + '.');
    return righe.join('\n');
  }

  var STILE = [
    '.cv-card{background:#fff;border-radius:14px;padding:20px 22px;margin:0 0 18px;',
      'box-shadow:0 2px 12px rgba(0,0,0,.07);border-left:4px solid #e8733a}',
    '.cv-tit{font-weight:800;color:#0a2a4d;font-size:1.02rem;margin:0 0 6px}',
    '.cv-sub{color:#5b6b80;font-size:.92rem;line-height:1.55;margin:0 0 14px}',
    '.cv-link{display:block;background:#f4f6f9;border:1px solid #e3e8ef;border-radius:9px;',
      'padding:10px 12px;font-size:.88rem;color:#0052cc;word-break:break-all;margin:0 0 14px;text-decoration:none}',
    '.cv-btns{display:flex;gap:10px;flex-wrap:wrap}',
    '.cv-b{border:0;border-radius:9px;padding:11px 18px;font-size:.93rem;font-weight:700;',
      'cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block}',
    '.cv-b.pri{background:#e8733a;color:#fff}',
    '.cv-b.sec{background:#fff;color:#0052cc;border:1.5px solid #0052cc}',
    '.cv-ok{color:#15803d;font-weight:700;font-size:.9rem;margin:12px 0 0;display:none}',
    '@media(max-width:520px){.cv-btns{flex-direction:column}.cv-b{text-align:center}}'
  ].join('');

  function disegna(imp) {
    if (document.getElementById('cv-card')) return;           // una volta sola
    var dove = document.querySelector('#sec-dashboard .dash-stats');
    if (!dove || !imp || !imp.id) return;

    var s = document.createElement('style'); s.textContent = STILE;
    document.head.appendChild(s);

    var pagina = linkPagina(imp);
    var card = document.createElement('div');
    card.className = 'cv-card'; card.id = 'cv-card';
    card.innerHTML =
      '<p class="cv-tit">La tua vetrina è online</p>' +
      '<p class="cv-sub">Questa è la pagina che vede il cliente quando ti cerca.' +
        (pagina ? ' Compari anche nella pagina della tua zona.' : '') +
        ' Mandala ai tuoi clienti: è il modo più veloce che hai per farti trovare.</p>' +
      '<a class="cv-link" id="cv-url" href="' + linkScheda(imp) + '" target="_blank" rel="noopener">' +
        linkScheda(imp) + '</a>' +
      '<div class="cv-btns">' +
        '<button type="button" class="cv-b pri" id="cv-copia">Copia il messaggio</button>' +
        '<a class="cv-b sec" href="' + linkScheda(imp) + '" target="_blank" rel="noopener">Apri la mia pagina</a>' +
        (pagina ? '<a class="cv-b sec" href="' + pagina + '" target="_blank" rel="noopener">Vedi dove compari</a>' : '') +
      '</div>' +
      '<p class="cv-ok" id="cv-ok">Copiato. Ora incollalo su WhatsApp.</p>';

    dove.parentNode.insertBefore(card, dove);

    document.getElementById('cv-copia').addEventListener('click', function () {
      var testo = messaggio(imp);
      var ok = document.getElementById('cv-ok');

      /* sul telefono conviene il tasto Condividi del sistema: apre
         direttamente WhatsApp invece di fermarsi agli appunti */
      if (navigator.share) {
        navigator.share({ text: testo }).catch(function () { copiaEBasta(testo, ok); });
        return;
      }
      copiaEBasta(testo, ok);
    });
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
    if (imp && imp.id) { clearInterval(orologio); disegna(imp); }
    else if (tentativi > 60) { clearInterval(orologio); }   // 30 secondi e poi lascia stare
  }, 500);
})();
