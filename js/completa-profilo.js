/* ============================================================
   completa-profilo.js — TrovaImpresa (agosto 2026)

   Mostra in cima al pannello una fascia con la percentuale di
   completamento del profilo e l'elenco di cosa manca.
   Sparisce da sola quando il profilo è al 100%.

   COME SI USA
   Aggiungere UNA riga prima di </body> nei 4 pannelli:
       <script src="/js/completa-profilo.js"></script>
   (i pannelli caricano già supabase-js, non serve altro)

   NOTE
   - Non tocca il resto della pagina: si inserisce da solo in cima al body.
   - È difensivo: se una colonna non esiste nella tabella, la salta
     invece di rompersi. Così non si spacca se il database cambia.
   - Si può chiudere, ma torna al prossimo accesso: è voluto.
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  // Cosa conta, e quanto pesa. Totale 100.
  // "chiavi" = come si chiama la colonna nel database (più di una se serve).
  var VOCI = [
    { peso: 25, etichetta: 'Indirizzo',        chiavi: ['indirizzo'] },
    { peso: 25, etichetta: 'Descrizione',      chiavi: ['descrizione'] },
    { peso: 12, etichetta: 'Telefono',         chiavi: ['telefono'] },
    { peso: 10, etichetta: 'Mestiere',         chiavi: ['mestiere'] },
    { peso: 10, etichetta: 'Zone servite',     chiavi: ['zone'] },
    { peso:  8, etichetta: 'Specializzazioni', chiavi: ['specializzazioni'] },
    { peso:  8, etichetta: 'Prestazioni',      chiavi: ['prestazioni'] },
    { peso:  5, etichetta: 'Partita IVA',      chiavi: ['partita_iva'] },
    { peso:  5, etichetta: 'Sito web',         chiavi: ['sito_web'] },
    // Le foto non sono una colonna di "imprese": le contiamo a parte (vedi avvia())
    // e le infiliamo nella riga come _foto. Per un'impresa edile sono la cosa che
    // convince di più chi apre il profilo, quindi pesano parecchio.
    { peso: 15, etichetta: 'Foto dei lavori',  chiavi: ['_foto'] }
  ];

  var CSS = [
    '#ti-completa{position:relative;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;',
    'background:linear-gradient(135deg,#0066ff,#0a2a4d);color:#fff;padding:16px 18px;box-shadow:0 2px 14px rgba(10,42,77,.22)}',
    '#ti-completa .ti-wrap{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:14px}',
    '#ti-completa .ti-testo{flex:1 1 260px;min-width:0}',
    '#ti-completa .ti-titolo{font-size:17px;font-weight:800;line-height:1.3;margin:0 0 4px}',
    '#ti-completa .ti-sub{font-size:13.5px;opacity:.92;line-height:1.5;margin:0}',
    '#ti-completa .ti-barra{height:9px;border-radius:99px;background:rgba(255,255,255,.25);overflow:hidden;margin:9px 0 8px;max-width:420px}',
    '#ti-completa .ti-riemp{height:100%;border-radius:99px;background:#ffb300;transition:width .6s ease}',
    '#ti-completa .ti-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}',
    '#ti-completa .ti-chip{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:99px;',
    'padding:3px 10px;font-size:12.5px;font-weight:600;white-space:nowrap}',
    '#ti-completa .ti-cta{background:#ff8800;color:#fff;text-decoration:none;font-weight:800;font-size:15px;',
    'padding:12px 22px;border-radius:10px;white-space:nowrap;flex:0 0 auto;box-shadow:0 2px 8px rgba(0,0,0,.18)}',
    '#ti-completa .ti-cta:hover{background:#e67a00}',
    '#ti-completa .ti-x{position:absolute;top:8px;right:10px;background:none;border:0;color:rgba(255,255,255,.75);',
    'font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}',
    '#ti-completa .ti-x:hover{color:#fff}',
    '@media(max-width:600px){#ti-completa{padding:14px 14px 16px}#ti-completa .ti-titolo{font-size:15.5px}',
    '#ti-completa .ti-cta{width:100%;text-align:center}}'
  ].join('');

  function pieno(v) {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return String(v).trim() !== '';
  }

  // Conta solo le voci le cui colonne esistono davvero nella riga:
  // se il database cambia, la fascia non si rompe e non chiede cose inesistenti.
  function calcola(riga) {
    var totale = 0, fatto = 0, mancanti = [];
    VOCI.forEach(function (voce) {
      var esiste = voce.chiavi.some(function (k) { return k in riga; });
      if (!esiste) return;
      totale += voce.peso;
      var ok = voce.chiavi.every(function (k) { return pieno(riga[k]); });
      if (ok) fatto += voce.peso;
      else mancanti.push(voce);
    });
    if (!totale) return null;
    return { perc: Math.round((fatto / totale) * 100), mancanti: mancanti };
  }

  function disegna(esito, nome) {
    if (document.getElementById('ti-completa')) return;

    var stile = document.createElement('style');
    stile.textContent = CSS;
    document.head.appendChild(stile);

    var titolo, sub;
    if (esito.perc < 40) {
      titolo = 'Il tuo profilo &egrave; completo al ' + esito.perc + '%: cos&igrave; non ti trova nessuno';
      sub = 'TrovaImpresa serve a farti vedere dai clienti, ma pu&ograve; mostrare solo quello che c&rsquo;&egrave;. Bastano pochi minuti.';
    } else if (esito.perc < 80) {
      titolo = 'Il tuo profilo &egrave; completo al ' + esito.perc + '%: ci sei quasi';
      sub = 'Ancora qualche dato e il tuo profilo sar&agrave; completo. Pi&ugrave; &egrave; ricco, pi&ugrave; convince chi lo apre.';
    } else {
      titolo = 'Il tuo profilo &egrave; completo al ' + esito.perc + '%: manca pochissimo';
      sub = 'Sei a un passo dal profilo completo.';
    }

    var chips = esito.mancanti.slice(0, 6).map(function (v) {
      return '<span class="ti-chip">' + v.etichetta + '</span>';
    }).join('');

    var barra = document.createElement('div');
    barra.id = 'ti-completa';
    barra.innerHTML =
      '<button class="ti-x" type="button" aria-label="Chiudi">&times;</button>' +
      '<div class="ti-wrap">' +
        '<div class="ti-testo">' +
          '<p class="ti-titolo">' + titolo + '</p>' +
          '<div class="ti-barra"><div class="ti-riemp" style="width:0%"></div></div>' +
          '<p class="ti-sub">' + sub + '</p>' +
          (chips ? '<div class="ti-chips"><span class="ti-chip" style="background:none;border:0;padding-left:0;opacity:.85">Manca:</span>' + chips + '</div>' : '') +
        '</div>' +
        '<a class="ti-cta" href="/modifica-profilo.html">Completa il profilo &rarr;</a>' +
      '</div>';

    document.body.insertBefore(barra, document.body.firstChild);

    // riempimento animato, così si nota
    setTimeout(function () {
      var r = barra.querySelector('.ti-riemp');
      if (r) r.style.width = esito.perc + '%';
    }, 120);

    barra.querySelector('.ti-x').addEventListener('click', function () {
      barra.remove();
      try { sessionStorage.setItem('ti_fascia_chiusa', '1'); } catch (e) {}
    });
  }

  function avvia() {
    try {
      if (sessionStorage.getItem('ti_fascia_chiusa') === '1') return;
    } catch (e) {}

    if (!window.supabase || !window.supabase.createClient) return;

    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    sb.auth.getUser().then(function (res) {
      var user = res && res.data && res.data.user;
      if (!user) return;
      return sb.from('imprese').select('*').eq('user_id', user.id).maybeSingle()
        .then(function (r) {
          if (r.error || !r.data) return;
          // quante foto ha caricato: serve per la voce "Foto dei lavori"
          return sb.from('lavori_foto').select('id', { count: 'exact', head: true })
            .eq('impresa_id', r.data.id)
            .then(function (f) { return { riga: r.data, foto: (f && f.count) || 0 }; })
            .catch(function () { return { riga: r.data, foto: 0 }; });
        })
        .then(function (x) {
          if (!x) return;
          var riga = x.riga;
          riga._foto = x.foto > 0 ? x.foto : '';   // vuoto = voce mancante
          var esito = calcola(riga);
          if (!esito || esito.perc >= 100) return;
          disegna(esito, riga.nome_attivita || riga.nome || '');
        });
    }).catch(function () { /* in silenzio: la fascia non deve mai disturbare il pannello */ });
  }

  // aspetta che supabase-js sia caricato (max ~5 secondi)
  var tentativi = 0;
  (function attendi() {
    if (window.supabase && window.supabase.createClient) { avvia(); return; }
    if (++tentativi > 50) return;
    setTimeout(attendi, 100);
  })();
})();
