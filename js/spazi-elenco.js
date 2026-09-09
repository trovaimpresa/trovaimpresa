// js/spazi-elenco.js
// ============================================================================
// L'ELENCO UNICO DEGLI SPAZI PUBBLICITARI  —  8 settembre 2026
// ============================================================================
//
// QUESTO FILE E' L'UNICO POSTO dove e' scritto quale cartello va in quale
// pagina. Il listino (pubblicita.html) e le pagine che mostrano i cartelli
// leggono tutte da qui. Se una cosa non e' scritta qui dentro, non esiste.
//
// PERCHE' ESISTE
// Il 7 settembre 2026 un cliente (Service House, Torino) ha comprato lo
// spazio "imprese-dx" e il suo cartello e' finito in 161 pagine sbagliate,
// mentre nella pagina dove doveva stare non c'era. Il motivo: nessuno aveva
// mai scritto da nessuna parte dove andasse ogni spazio. Lo decideva una riga
// incollata a mano dentro l'HTML, pagina per pagina. Bastava copiare una
// pagina vecchia per copiare anche l'errore.
//
// LE REGOLE
// 1. Gli spazi sono 10 e sono questi. Non se ne inventano di nuovi: il
//    listino e i pagamenti Stripe sono costruiti su questi.
// 2. Ogni spazio dice in QUALI pagine si vede. Se si vede in due posti, qui
//    ci sono due righe: cosi' il listino lo puo' dire al cliente invece di
//    nasconderglielo.
// 3. Chi mostra i cartelli chiede a questo file "cosa va nella mia pagina?"
//    e non lo decide da solo.
//
// COME SI CAMBIA
// Per spostare un cartello da una pagina all'altra si cambia SOLO questo
// file. Non si tocca l'HTML delle pagine.
// ============================================================================

(function () {
  'use strict';

  // --- le 4 fasce, dalla piu' cara alla piu' economica ----------------------
  // "dove" e' la frase che il CLIENTE legge nel listino: deve dire il vero,
  // compreso quando lo stesso cartello si vede in piu' di una pagina.
  var FASCE = {
    hero:       { nome: 'Hero — banner in alto', prezzo: 20, misura: 340,
                  dove: 'In cima alla pagina della tua città' },
    imprese:    { nome: "Trova un'impresa",      prezzo: 17, misura: 270,
                  dove: 'Nella pagina della tua città, accanto a «Scegli la categoria»' },
    inserzioni: { nome: 'Inserzioni lavoro',     prezzo: 15, misura: 210,
                  dove: 'Accanto alle offerte di lavoro e nella pagina della tua città' },
    guide:      { nome: 'Guide e costi',         prezzo: 13, misura: 311,
                  dove: 'Nella pagina della tua città, accanto alle guide «quanto costa»' },
    perche:     { nome: 'Perché TrovaImpresa',    prezzo: 10, misura: 264,
                  dove: 'Nella pagina della tua città, accanto a «Perché scegliere TrovaImpresa»' },
    profiloAlto:  { nome: 'Recensioni — cartello alto',  prezzo: 7, misura: 170,
                  dove: 'Nelle schede delle imprese e nella pagina della tua città' },
    profiloBasso: { nome: 'Recensioni — cartello basso', prezzo: 5, misura: 170,
                  dove: 'Nelle schede delle imprese e nella pagina della tua città' }
  };

  // --- dove si vede ogni spazio --------------------------------------------
  // pagina : il file. 'index.html' con citta:true vuol dire index.html?citta=X
  // dove   : la frase che legge il CLIENTE nel listino. Deve dire il vero.
  // ancora : a quale pezzo della pagina si aggancia (solo pagina citta')
  var SPAZI = [
    { id: 'hero-sx', fascia: 'hero', lato: 'Sinistra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'In cima alla pagina della tua città, a sinistra', ancora: '.hero-inner', passo: 0 }
    ]},
    { id: 'hero-dx', fascia: 'hero', lato: 'Destra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'In cima alla pagina della tua città, a destra', ancora: '.hero-inner', passo: 0 }
    ]},

    { id: 'imprese-sx', fascia: 'imprese', lato: 'Sinistra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'Nella pagina della tua città, accanto a «Scegli la categoria»', ancora: '#categorie', passo: 1 }
    ]},
    { id: 'imprese-dx', fascia: 'imprese', lato: 'Destra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'Nella pagina della tua città, accanto a «Scegli la categoria»', ancora: '#categorie', passo: 1 }
    ]},

    // ATTENZIONE: questi due si vedono in DUE posti. Non e' un errore, e'
    // come funziona oggi — e adesso il listino lo dice al cliente.
    { id: 'inserzioni-sx', fascia: 'inserzioni', lato: 'Sinistra', pagine: [
      { pagina: 'offerte-lavoro.html', dove: 'Accanto alle offerte di lavoro della tua città' },
      { pagina: 'index.html', citta: true, dove: 'e nella pagina della tua città, accanto a «Prendi il tuo spazio»', ancora: '#registrati', passo: 2 }
    ]},
    { id: 'inserzioni-dx', fascia: 'inserzioni', lato: 'Destra', pagine: [
      { pagina: 'offerte-lavoro.html', dove: 'Accanto alle offerte di lavoro della tua città' },
      { pagina: 'index.html', citta: true, dove: 'e nella pagina della tua città, accanto a «Prendi il tuo spazio»', ancora: '#registrati', passo: 2 }
    ]},

    // 9 set 2026 — I QUATTRO POSTI CHE C'ERANO GIA' E NESSUNO POTEVA COMPRARE.
    // Erano disegnati in js/spazi-citta.js dentro LOC_EXTRA come locandine
    // informative: si vedevano ma non avevano nome, quindi niente listino,
    // niente prezzo, niente Stripe. Ora sono spazi veri come tutti gli altri.
    // Se nessuno li compra ci resta la locandina, esattamente come prima.
    { id: 'guide-sx', fascia: 'guide', lato: 'Sinistra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'Nella pagina della tua città, accanto alle guide «quanto costa»', ancora: '.guide-costi-home', passo: 3 }
    ]},
    { id: 'guide-dx', fascia: 'guide', lato: 'Destra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'Nella pagina della tua città, accanto alle guide «quanto costa»', ancora: '.guide-costi-home', passo: 3 }
    ]},

    { id: 'perche-sx', fascia: 'perche', lato: 'Sinistra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'Nella pagina della tua città, accanto a «Perché scegliere TrovaImpresa»', ancora: '.why-section', passo: 4 }
    ]},
    { id: 'perche-dx', fascia: 'perche', lato: 'Destra', pagine: [
      { pagina: 'index.html', citta: true, dove: 'Nella pagina della tua città, accanto a «Perché scegliere TrovaImpresa»', ancora: '.why-section', passo: 4 }
    ]},

    { id: 'profilo-sx-1', fascia: 'profiloAlto', lato: 'Sinistra 1', pagine: [
      { pagina: 'profilo-impresa.html', dove: 'Nelle schede delle imprese della tua città' },
      { pagina: 'index.html', citta: true, dove: 'e nella pagina della tua città, accanto alle recensioni', ancora: '#ti-recensioni', passo: 5, pila: 0 }
    ]},
    { id: 'profilo-sx-2', fascia: 'profiloBasso', lato: 'Sinistra 2', pagine: [
      { pagina: 'profilo-impresa.html', dove: 'Nelle schede delle imprese della tua città' },
      { pagina: 'index.html', citta: true, dove: 'e nella pagina della tua città, accanto alle recensioni', ancora: '#ti-recensioni', passo: 5, pila: 1 }
    ]},
    { id: 'profilo-dx-1', fascia: 'profiloAlto', lato: 'Destra 1', pagine: [
      { pagina: 'profilo-impresa.html', dove: 'Nelle schede delle imprese della tua città' },
      { pagina: 'index.html', citta: true, dove: 'e nella pagina della tua città, accanto alle recensioni', ancora: '#ti-recensioni', passo: 5, pila: 0 }
    ]},
    { id: 'profilo-dx-2', fascia: 'profiloBasso', lato: 'Destra 2', pagine: [
      { pagina: 'profilo-impresa.html', dove: 'Nelle schede delle imprese della tua città' },
      { pagina: 'index.html', citta: true, dove: 'e nella pagina della tua città, accanto alle recensioni', ancora: '#ti-recensioni', passo: 5, pila: 1 }
    ]}
  ];

  // --- come si chiede qualcosa all'elenco -----------------------------------

  function nomeFilePagina() {
    var f = window.location.pathname.split('/').pop();
    if (!f || f.indexOf('.') < 0) f = 'index.html';   // "/" e "/citta" -> index
    return f;
  }

  function haCitta() {
    return !!(new URLSearchParams(window.location.search).get('citta') || '').trim();
  }

  // Gli spazi che vanno nella pagina in cui stiamo adesso.
  // Restituisce [{ id, fascia, lato, prezzo, misura, ancora, passo, pila }]
  function diQuestaPagina() {
    var file = nomeFilePagina(), conCitta = haCitta(), out = [];
    SPAZI.forEach(function (s) {
      s.pagine.forEach(function (p) {
        if (p.pagina !== file) return;
        if (p.citta && !conCitta) return;      // index.html senza ?citta= = home nazionale
        if (!p.citta && conCitta && file === 'index.html') return;
        out.push({
          id: s.id, fascia: s.fascia, lato: s.lato,
          prezzo: FASCE[s.fascia].prezzo, misura: FASCE[s.fascia].misura,
          ancora: p.ancora || null, passo: p.passo === undefined ? null : p.passo,
          pila: p.pila === undefined ? -1 : p.pila
        });
      });
    });
    return out;
  }

  // Solo gli id, per chi deve interrogare il database.
  function idDiQuestaPagina() {
    return diQuestaPagina().map(function (s) { return s.id; });
  }

  // La frase da mostrare al cliente nel listino: tutte le pagine dove si vedra'.
  function doveSiVede(id) {
    var s = null;
    SPAZI.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return '';
    return s.pagine.map(function (p) { return p.dove; }).join(', ');
  }

  function fasciaDi(id) {
    var s = null;
    SPAZI.forEach(function (x) { if (x.id === id) s = x; });
    return s ? FASCE[s.fascia] : null;
  }

  function prezzoDi(id) { var f = fasciaDi(id); return f ? f.prezzo : null; }
  function misuraDi(id) { var f = fasciaDi(id); return f ? f.misura : 260; }

  function latoDi(id) {
    var s = null;
    SPAZI.forEach(function (x) { if (x.id === id) s = x; });
    return s ? s.lato : id;
  }

  function nomeFascia(id) { var f = fasciaDi(id); return f ? f.nome : id; }

  // Le 4 fasce per il listino, ognuna coi suoi spazi.
  function perIlListino() {
    var ordine = ['hero', 'imprese', 'inserzioni', 'guide', 'perche', 'profiloAlto', 'profiloBasso'], out = [];
    ordine.forEach(function (k) {
      var ids = SPAZI.filter(function (s) { return s.fascia === k; })
                     .map(function (s) { return s.id; });
      out.push({
        chiave: k, nome: FASCE[k].nome, prezzo: FASCE[k].prezzo,
        misura: FASCE[k].misura, spazi: ids,
        desc: FASCE[k].dove
      });
    });
    return out;
  }

  window.SPAZI_TI = {
    aggiornato: '2026-09-09',
    FASCE: FASCE,
    SPAZI: SPAZI,
    diQuestaPagina: diQuestaPagina,
    idDiQuestaPagina: idDiQuestaPagina,
    doveSiVede: doveSiVede,
    prezzoDi: prezzoDi,
    misuraDi: misuraDi,
    latoDi: latoDi,
    nomeFascia: nomeFascia,
    perIlListino: perIlListino,
    nomeFilePagina: nomeFilePagina
  };
})();
