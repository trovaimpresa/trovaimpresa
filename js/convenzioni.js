/* ============================================================
   LE TUE CONVENZIONI — 10 settembre 2026
   ------------------------------------------------------------
   Il riquadro dei fornitori convenzionati di zona.

   DOVE SI VEDE
   - in fondo alla dashboard dei 3 pannelli (artigiano, impresa,
     professionisti): fino a 3 fornitori
   - in fondo alla scheda pubblica profilo-impresa.html: 1 solo

   COME SI AGGIUNGE UN FORNITORE
   Si scrive una riga dentro CONVENZIONI qui sotto. Niente altro.

   SE L'ELENCO E' VUOTO IL RIQUADRO NON COMPARE PROPRIO.
   Serve a non far vedere fornitori finti a chi usa il sito.

   PER GUARDARLO SENZA PUBBLICARE NIENTE
   Aggiungi ?convenzioni=prova in fondo all'indirizzo della pagina:
   escono gli esempi qui sotto, ma solo a chi mette quella scritta.

   QUANDO I FORNITORI SARANNO TANTI
   Questa lista diventera' una tabella su Supabase e cambiera' SOLO
   la funzione elencoConvenzioni(). Tutto il resto resta uguale.
   ============================================================ */
(function () {
  'use strict';

  /* --- I POSTI CHE SI POSSONO COMPRARE, divisi per famiglia ---
     In ogni citta' ogni posto e' di UNO SOLO. Se in una citta' nessuno lo
     ha preso, sulla pagina delle convenzioni si vede «posto libero». --- */
  var POSTI = [
    { posto:'Ferramenta',              famiglia:'Materiali e ferramenta', icona:'\uD83D\uDD29' },
    { posto:'Magazzino edile',         famiglia:'Materiali e ferramenta', icona:'\uD83E\uDDF1' },
    { posto:'Colorificio',             famiglia:'Materiali e ferramenta', icona:'\uD83C\uDFA8' },
    { posto:'Materiale idraulico',     famiglia:'Materiali e ferramenta', icona:'\uD83D\uDEBF' },
    { posto:'Materiale elettrico',     famiglia:'Materiali e ferramenta', icona:'\uD83D\uDCA1' },
    { posto:'Legname',                 famiglia:'Materiali e ferramenta', icona:'\uD83E\uDEB5' },
    { posto:'Antinfortunistica',       famiglia:'Materiali e ferramenta', icona:'\uD83E\uDDE4' },
    { posto:'Sicurezza e formazione',  famiglia:'Sicurezza e obblighi',   icona:'\uD83E\uDDBA' },
    { posto:'Assicurazioni',           famiglia:'Sicurezza e obblighi',   icona:'\uD83D\uDEE1\uFE0F' },
    { posto:'Commercialista',          famiglia:'Sicurezza e obblighi',   icona:'\uD83D\uDCCA' },
    { posto:'Noleggio attrezzi',       famiglia:'Noleggio e mezzi',       icona:'\uD83D\uDEA7' },
    { posto:'Noleggio mezzi',          famiglia:'Noleggio e mezzi',       icona:'\uD83D\uDE9C' },
    { posto:'Ponteggi',                famiglia:'Noleggio e mezzi',       icona:'\uD83C\uDFD7\uFE0F' },
    { posto:'Container e smaltimento', famiglia:'Noleggio e mezzi',       icona:'\uD83D\uDDD1\uFE0F' },
    { posto:'Agenzia immobiliare',     famiglia:'Chi porta lavoro',       icona:'\uD83C\uDFE0' },
    { posto:'Amministratore di condominio', famiglia:'Chi porta lavoro',  icona:'\uD83C\uDFE2' }
  ];

  var FAMIGLIE = ['Materiali e ferramenta','Sicurezza e obblighi','Noleggio e mezzi','Chi porta lavoro'];

  /* --- I FORNITORI VERI. Aggiungi qui. --- */
  var CONVENZIONI = [
    /* esempio di come si scrive una riga:
    {
      nome:      'Ferramenta Rossi',
      posto:     'Ferramenta',        // uno dei POSTI qui sotto
      categoria: 'Ferramenta e utensileria',
      citta:     'Rieti',
      indirizzo: 'via Salaria 12',
      offerta:   '-10% su tutta la merce',
      icona:     '🔩',
      link:      'https://...',
      mestieri:  []
    },
    */
  ];

  /* --- Gli esempi che si vedono solo con ?convenzioni=prova --- */
  var ESEMPI = [
    { nome:'Ferramenta Rossi', posto:'Ferramenta', categoria:'Ferramenta e utensileria', citta:'Rieti',
      indirizzo:'via Salaria 12', offerta:'-10% su tutta la merce',
      icona:'🔩', link:'', mestieri:[] },
    { nome:'Sicura Formazione', posto:'Sicurezza e formazione', categoria:'Corsi sicurezza, DVR e POS', citta:'Rieti',
      indirizzo:'via Terminillo 8', offerta:'-15% sui corsi',
      icona:'🦺', link:'', mestieri:[] },
    { nome:'Noleggio Velino', posto:'Noleggio attrezzi', categoria:'Piattaforme, ponteggi e mezzi', citta:'Rieti',
      indirizzo:'via Salaria per l\'Aquila', offerta:'Mezza giornata al prezzo di 4 ore',
      icona:'🚜', link:'', mestieri:[] }
  ];

  function modoProva() {
    try { return /[?&]convenzioni=prova\b/.test(window.location.search); }
    catch (e) { return false; }
  }

  function elencoConvenzioni() {
    return modoProva() ? ESEMPI : CONVENZIONI;
  }

  /* --- utilita' --- */
  function pulita(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function scappa(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Sceglie chi mostrare: prima la citta' giusta, poi il mestiere giusto. */
  function scegli(tutte, citta, mestiere, quanti) {
    var c = pulita(citta);
    var m = pulita(mestiere);
    var diZona = tutte.filter(function (x) { return c && pulita(x.citta) === c; });
    if (!diZona.length) return [];
    var suoi = [], altri = [];
    diZona.forEach(function (x) {
      var lista = Array.isArray(x.mestieri) ? x.mestieri.map(pulita) : [];
      if (m && lista.length && lista.indexOf(m) !== -1) suoi.push(x); else altri.push(x);
    });
    return suoi.concat(altri).slice(0, quanti);
  }

  /* --- lo stile, scritto qui per non toccare il CSS delle pagine --- */
  var STILE = ''
    + '.cnv-tit{font-size:15px;font-weight:800;color:#5f6b7a;text-transform:uppercase;'
    +   'letter-spacing:1px;margin-bottom:12px;display:flex;align-items:baseline;'
    +   'justify-content:space-between;gap:12px}'
    + '.cnv-tit .cnv-spo{font-size:13px;font-weight:700;letter-spacing:.5px;color:#98a2b3}'
    + '.cnv-box{background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.08);'
    +   'border-top:4px solid #e8733a;overflow:hidden;margin-bottom:20px}'
    + '.cnv-riga{display:flex;align-items:center;gap:16px;padding:16px 20px;'
    +   'border-bottom:1px solid rgba(0,0,0,.08);text-decoration:none;color:inherit}'
    + '.cnv-riga:last-child{border-bottom:0}'
    + '.cnv-logo{width:52px;height:52px;border-radius:12px;background:#f0f3f7;flex:none;'
    +   'display:flex;align-items:center;justify-content:center;font-size:26px}'
    + '.cnv-testo{flex:1;min-width:0}'
    + '.cnv-nome{font-weight:700;font-size:17px;color:#1a1a1a;line-height:1.35}'
    + '.cnv-sotto{font-size:15px;color:#5f6b7a;line-height:1.4;margin-top:2px}'
    + '.cnv-chip{background:#fff3ec;color:#b8501c;font-weight:800;font-size:15px;'
    +   'padding:8px 14px;border-radius:999px;white-space:nowrap;flex:none}'
    + '.cnv-tutte{margin:-8px 0 20px;font-size:15px}'
    + '.cnv-tutte a{color:#0066ff;font-weight:700;text-decoration:none}'
    + '.cnv-tutte a:hover{text-decoration:underline}'
    + '@media(max-width:640px){'
    +   '.cnv-riga{gap:12px;padding:14px 15px;flex-wrap:wrap}'
    +   '.cnv-logo{width:44px;height:44px;font-size:22px}'
    +   '.cnv-testo{flex:1 1 60%}'
    +   '.cnv-chip{margin-left:56px}'
    + '}';

  function mettiStile() {
    if (document.getElementById('cnv-stile')) return;
    var s = document.createElement('style');
    s.id = 'cnv-stile';
    s.textContent = STILE;
    document.head.appendChild(s);
  }

  function disegna(el, righe, citta, titolo) {
    if (!righe.length) { el.innerHTML = ''; return; }
    mettiStile();
    var html = ''
      + '<div class="cnv-tit"><span>' + scappa(titolo || 'Le tue convenzioni')
      + (citta ? ' · ' + scappa(citta) : '')
      + '</span><span class="cnv-spo">Sponsor</span></div>'
      + '<div class="cnv-box">';
    righe.forEach(function (x) {
      var tag = x.link ? 'a' : 'div';
      var attr = x.link
        ? ' href="' + scappa(x.link) + '" target="_blank" rel="noopener nofollow sponsored"'
        : '';
      var sotto = [x.categoria, x.indirizzo].filter(Boolean).map(scappa).join(' · ');
      html += '<' + tag + ' class="cnv-riga"' + attr + '>'
        + '<div class="cnv-logo">' + scappa(x.icona || '🏪') + '</div>'
        + '<div class="cnv-testo">'
        +   '<div class="cnv-nome">' + scappa(x.nome) + '</div>'
        +   (sotto ? '<div class="cnv-sotto">' + sotto + '</div>' : '')
        + '</div>'
        + (x.offerta ? '<div class="cnv-chip">' + scappa(x.offerta) + '</div>' : '')
        + '</' + tag + '>';
    });
    html += '</div>';
    if (citta && el.getAttribute('data-tutte') !== 'no') {
      html += '<div class="cnv-tutte"><a href="/convenzioni.html?citta='
        + encodeURIComponent(citta) + '">Vedi tutte le convenzioni di '
        + scappa(citta) + ' &rarr;</a></div>';
    }
    el.innerHTML = html;
  }

  /* Da dove arrivano citta' e mestiere:
     - nei pannelli dalla variabile impresaCorrente
     - nella scheda pubblica da window.convenzioniDati, che la pagina riempie */
  function datiPagina() {
    if (window.convenzioniDati) return window.convenzioniDati;
    try {
      if (typeof impresaCorrente !== 'undefined' && impresaCorrente) return impresaCorrente;
    } catch (e) { /* non c'e': va bene */ }
    return null;
  }

  function avvia() {
    var el = document.getElementById('convenzioni-zona');
    if (!el) return;
    var quanti = parseInt(el.getAttribute('data-max'), 10) || 3;
    var tentativi = 0;
    var timer = setInterval(function () {
      tentativi++;
      var d = datiPagina();
      if (!d && tentativi < 40) return;      // aspetta al massimo 10 secondi
      clearInterval(timer);
      if (!d) return;
      var righe = scegli(elencoConvenzioni(), d.citta, d.mestiere, quanti);
      disegna(el, righe, d.citta, el.getAttribute('data-titolo'));
    }, 250);
  }

  /* Quello che serve alla pagina /convenzioni.html: una sola fonte. */
  window.Convenzioni = {
    elenco:   elencoConvenzioni,
    posti:    function () { return POSTI.slice(); },
    famiglie: function () { return FAMIGLIE.slice(); },
    scappa:   scappa,
    pulita:   pulita
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }
})();
