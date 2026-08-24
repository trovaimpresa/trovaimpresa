/* =====================================================================
   IL CONTO DI UN NOLEGGIO — TrovaImpresa, 22 agosto 2026

   prezzo = tempo + contaore + chilometri + materiale consumato + usura
   La cauzione NON entra nel totale: e' un deposito, non un ricavo.

   ⛔ QUESTO FILE NON TOCCA LA PAGINA. Non legge caselle, non scrive niente
   sullo schermo: prende due oggetti (il mezzo e il noleggio) e restituisce
   il conto riga per riga. E' fatto cosi' apposta, per due motivi:
     1. si puo' provare su un banco senza aprire un browser;
     2. quando il noleggio finira' dentro il gestionale imprese e dentro
        quello del negozio, il conto sara' LO STESSO, non una seconda copia
        che col tempo si scolla dalla prima.

   ⚠️ I SOLDI SI CONTANO IN CENTESIMI, non in euro.
   In JavaScript 0.1 + 0.2 non fa 0.3. Su un noleggio di dieci giorni con
   quattro voci l'errore si vede: il totale finisce a 1.489,99 invece di
   1.490,00, e un cliente che ricontrolla la fattura trova un centesimo che
   non torna. Qui dentro si lavora con numeri interi e si torna in euro solo
   alla fine.
   ===================================================================== */
(function (radice) {
  'use strict';

  /* ---------------------------------------------------------------- */
  /* I numeri all'italiana                                            */
  /* ---------------------------------------------------------------- */
  /* "1.250,50" e "1250.50" vogliono dire la stessa cosa. `+valore` la
     virgola non la capisce e risponde NaN, che poi diventa zero e il numero
     sparisce senza dire niente: e' il difetto gia' trovato su Negozio e
     Noleggio. Qui si legge come fanno Gestionale e App operaio. */
  function numIt(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v).trim();
    if (!s) return 0;
    s = s.replace(/[€\s ]/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function cent(v) { return Math.round(numIt(v) * 100); }
  function euro(c) { return c / 100; }

  /* ⛔ 24 agosto 2026 — I PREZZI SI SCRIVONO ALL'ITALIANA.
     Al collaudo del 24 agosto, dentro il dettaglio delle righe usciva
     «1 × 600.00 €» col punto americano, e da li' finiva pari pari sul
     contratto in PDF che firma il cliente. Il totale era gia' giusto: a
     sbagliare erano solo le scritte piccole sotto la voce, che nascevano da
     .toFixed(2). Adesso passano tutte da qui. */
  function scriviEuro(c) {
    var n = c / 100;
    var neg = n < 0;
    var s = Math.abs(n).toFixed(2).split('.');
    var interi = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + interi + ',' + s[1];
  }

  /* ---------------------------------------------------------------- */
  /* Le date                                                          */
  /* ---------------------------------------------------------------- */
  /* Si legge "2026-08-22" a mano invece di darla in pasto a new Date():
     con la stringa corta il browser la interpreta a Greenwich, e in Italia
     d'estate siamo due ore avanti. Un noleggio che parte il 1° agosto
     diventava il 31 luglio, e il conto usciva di un giorno. */
  function giorno(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }

  function minuti(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
    return h * 60 + mi;
  }

  var GIORNO_MS = 86400000;

  /* I giorni di calendario in cui il mezzo e' stato fuori, compreso quello
     del rientro. Uscita e rientro lo stesso giorno = 1 giorno. */
  function giorniFra(dal, al) {
    var a = giorno(dal), b = giorno(al);
    if (a === null || b === null) return null;
    var g = Math.round((b - a) / GIORNO_MS) + 1;
    return g;
  }

  /* ---------------------------------------------------------------- */
  /* Il tempo: la combinazione che costa meno                         */
  /* ---------------------------------------------------------------- */
  /* Non si va a scaglioni e basta. Si cerca la combinazione di pacchetti
     che COSTA MENO e che copre tutti i giorni — anche quando vuol dire
     pagare per piu' giorni di quelli fatti: se sei giorni sciolti costano
     piu' di una settimana intera, si paga la settimana. E' quello che dice
     al telefono un noleggiatore vero: «ti conviene prendere la settimana». */
  var PACCHETTI = [
    { chiave: 'mese',      giorni: 30, uno: 'mese',      tanti: 'mesi' },
    { chiave: 'settimana', giorni: 7,  uno: 'settimana', tanti: 'settimane' },
    { chiave: 'giorno',    giorni: 1,  uno: 'giorno',    tanti: 'giorni' }
  ];

  function tempoAGiorni(g, mezzo) {
    var disponibili = [];
    PACCHETTI.forEach(function (p) {
      var prezzo = cent(mezzo['tariffa_' + p.chiave]);
      if (prezzo > 0) disponibili.push({ p: p, prezzo: prezzo });
    });
    /* ⚠️ dal piu' piccolo al piu' grande, e si cambia solo se costa DI MENO.
       Cosi' a parita' di prezzo vince il pacchetto piccolo: cinque giorni
       che costano quanto una settimana si scrivono "5 giorni", non
       "1 settimana" — che allo sportello sembrerebbe un errore. */
    disponibili.sort(function (a, b) { return a.p.giorni - b.p.giorni; });
    if (!disponibili.length) {
      return { righe: [], totale: 0, avviso: 'Questo mezzo non ha nessuna tariffa: il conto non si puo\' fare.' };
    }

    /* costo[i] = quanto costa, al minimo, coprire i giorni */
    var costo = new Array(g + 1), scelta = new Array(g + 1), i, k;
    costo[0] = 0; scelta[0] = null;
    for (i = 1; i <= g; i++) {
      costo[i] = Infinity;
      for (k = 0; k < disponibili.length; k++) {
        var d = disponibili[k];
        var resto = Math.max(0, i - d.p.giorni);
        var c = costo[resto] + d.prezzo;
        if (c < costo[i]) { costo[i] = c; scelta[i] = d; }
      }
    }

    /* si ripercorre all'indietro per sapere COME e' composto */
    var conteggio = {}, i2 = g;
    while (i2 > 0) {
      var s = scelta[i2];
      conteggio[s.p.chiave] = (conteggio[s.p.chiave] || 0) + 1;
      i2 = Math.max(0, i2 - s.p.giorni);
    }

    var righe = [];
    PACCHETTI.forEach(function (p) {
      var n = conteggio[p.chiave];
      if (!n) return;
      var prezzo = cent(mezzo['tariffa_' + p.chiave]);
      righe.push({
        voce: n + ' ' + (n === 1 ? p.uno : p.tanti),
        dettaglio: n + ' × ' + scriviEuro(prezzo) + ' €',
        centesimi: n * prezzo
      });
    });

    var avviso = null;
    /* si dice all'utente quando il pacchetto grande gli ha fatto risparmiare */
    var tg = cent(mezzo.tariffa_giorno);
    if (tg > 0 && costo[g] < g * tg) {
      avviso = 'Conviene il pacchetto: ' + g + ' giorni sciolti costerebbero ' +
               scriviEuro(g * tg) + ' €.';
    }
    return { righe: righe, totale: costo[g], avviso: avviso };
  }

  /* Il noleggio che esce e rientra lo stesso giorno: si paga a ore, ma mai
     piu' di quanto costerebbe la giornata intera. */
  function tempoAOre(min, mezzo) {
    var ore = Math.ceil(min / 60);
    if (ore < 1) ore = 1;
    var to = cent(mezzo.tariffa_ora), tg = cent(mezzo.tariffa_giorno);
    if (to <= 0) return null;                    /* niente tariffa oraria: si va a giornata */
    var aOre = ore * to;
    if (tg > 0 && tg <= aOre) {
      return {
        righe: [{ voce: '1 giorno', dettaglio: '1 × ' + scriviEuro(tg) + ' €', centesimi: tg }],
        totale: tg,
        avviso: 'Conviene la giornata: ' + ore + ' ore costerebbero ' + scriviEuro(aOre) + ' €.'
      };
    }
    return {
      righe: [{ voce: ore + (ore === 1 ? ' ora' : ' ore'), dettaglio: ore + ' × ' + scriviEuro(to) + ' €', centesimi: aOre }],
      totale: aOre,
      avviso: null
    };
  }

  /* ---------------------------------------------------------------- */
  /* Contaore e chilometri: si paga solo quello che sfora l'incluso   */
  /* ---------------------------------------------------------------- */
  function letture(noleggio, mezzo, giorni, cfg, avvisi) {
    var da = noleggio[cfg.campoUscita], a = noleggio[cfg.campoRientro];
    if (da === null || da === undefined || da === '' ||
        a  === null || a  === undefined || a  === '') return null;
    var fatte = numIt(a) - numIt(da);
    if (fatte < 0) {
      avvisi.push(cfg.nome + ': la lettura del rientro (' + numIt(a) + ') e\' piu\' bassa di quella dell\'uscita (' +
                  numIt(da) + '). Non l\'ho contata: controlla i due numeri.');
      return null;
    }
    var incluse = numIt(mezzo[cfg.campoIncluso]) * giorni;
    var extra = fatte - incluse;
    if (extra <= 0) {
      avvisi.push(cfg.nome + ': ' + fatte + ' ' + cfg.unita + ' su ' + incluse + ' comprese. Niente da pagare.');
      return null;
    }
    var tariffa = cent(mezzo[cfg.campoTariffa]);
    if (tariffa <= 0) {
      avvisi.push(cfg.nome + ': ' + extra + ' ' + cfg.unita + ' oltre il compreso, ma su questo mezzo non c\'e\' la tariffa. Non le ho contate.');
      return null;
    }
    return {
      voce: cfg.nome,
      dettaglio: scriviNum(fatte) + ' ' + cfg.unita + ' − ' + scriviNum(incluse) +
                 ' comprese = ' + scriviNum(extra) + ' × ' + scriviEuro(tariffa) + ' €',
      centesimi: Math.round(extra * tariffa)
    };
  }

  function arrotonda(n) { return Math.round(n * 100) / 100; }
  /* 24 agosto 2026: anche le quantita' vogliono la virgola. «2.5 × 1,80 €»
     era mezzo italiano e mezzo americano nella stessa riga. */
  function scriviNum(n) { return String(arrotonda(n)).replace('.', ','); }

  /* ---------------------------------------------------------------- */
  /* Il conto                                                         */
  /* ---------------------------------------------------------------- */
  function calcola(mezzo, noleggio) {
    mezzo = mezzo || {}; noleggio = noleggio || {};
    var avvisi = [], righe = [];

    /* fino a quando? il rientro vero se c'e', se no quello previsto */
    var fine = noleggio.data_rientro_effettivo || noleggio.data_rientro_prevista || null;
    var suPrevisione = !noleggio.data_rientro_effettivo && !!noleggio.data_rientro_prevista;

    if (!noleggio.data_uscita || !fine) {
      return { giorni: null, righe: [], totale: 0, totaleEuro: 0,
               cauzione: numIt(noleggio.cauzione || mezzo.cauzione),
               suPrevisione: suPrevisione,
               avvisi: ['Metti la data di uscita e quella di rientro: senza, il conto non si puo\' fare.'] };
    }

    var giorni = giorniFra(noleggio.data_uscita, fine);
    if (giorni === null) {
      return { giorni: null, righe: [], totale: 0, totaleEuro: 0,
               cauzione: numIt(noleggio.cauzione || mezzo.cauzione),
               suPrevisione: suPrevisione,
               avvisi: ['Le date non si leggono. Devono essere scritte come 2026-08-22.'] };
    }
    if (giorni < 1) {
      return { giorni: giorni, righe: [], totale: 0, totaleEuro: 0,
               cauzione: numIt(noleggio.cauzione || mezzo.cauzione),
               suPrevisione: suPrevisione,
               avvisi: ['Il rientro e\' prima dell\'uscita. Controlla le due date.'] };
    }

    /* ---- il tempo ---- */
    var tempo = null;
    if (giorni === 1) {
      var m1 = minuti(noleggio.ora_uscita), m2 = minuti(noleggio.ora_rientro);
      if (m1 !== null && m2 !== null && m2 > m1) tempo = tempoAOre(m2 - m1, mezzo);
      if (m1 !== null && m2 !== null && m2 <= m1) {
        avvisi.push('L\'ora del rientro non e\' dopo quella dell\'uscita: ho contato una giornata intera.');
      }
    }
    if (!tempo) tempo = tempoAGiorni(giorni, mezzo);
    if (tempo.avviso) avvisi.push(tempo.avviso);
    tempo.righe.forEach(function (r) { righe.push(r); });
    var centTempo = tempo.totale;

    /* ---- il contaore ---- */
    if (mezzo.ha_contaore) {
      var ct = letture(noleggio, mezzo, giorni, {
        nome: 'Ore di macchina', unita: 'ore',
        campoUscita: 'contaore_uscita', campoRientro: 'contaore_rientro',
        campoIncluso: 'ore_incluse_giorno', campoTariffa: 'tariffa_ora_extra'
      }, avvisi);
      if (ct) righe.push(ct);
    }

    /* ---- i chilometri ---- */
    if (mezzo.ha_contakm) {
      var km = letture(noleggio, mezzo, giorni, {
        nome: 'Chilometri', unita: 'km',
        campoUscita: 'km_uscita', campoRientro: 'km_rientro',
        campoIncluso: 'km_inclusi_giorno', campoTariffa: 'tariffa_km'
      }, avvisi);
      if (km) righe.push(km);
    }

    /* ---- il materiale consumato ---- */
    var consumi = noleggio.consumi;
    if (typeof consumi === 'string') {
      try { consumi = JSON.parse(consumi); } catch (e) { consumi = []; avvisi.push('Le righe del materiale non si leggono: le ho saltate.'); }
    }
    (Array.isArray(consumi) ? consumi : []).forEach(function (c) {
      var q = numIt(c.quantita), p = cent(c.prezzo);
      if (!q || !p) return;
      righe.push({
        voce: String(c.descrizione || 'Materiale'),
        dettaglio: scriviNum(q) + ' × ' + scriviEuro(p) + ' €',
        centesimi: Math.round(q * p)
      });
    });

    /* ---- l'usura ---- */
    var uf = cent(mezzo.usura_fissa);
    if (uf > 0) righe.push({ voce: 'Usura', dettaglio: 'quota fissa per noleggio', centesimi: uf });
    var up = numIt(mezzo.usura_percento);
    if (up > 0) {
      righe.push({ voce: 'Usura', dettaglio: scriviNum(up) + '% sul tempo (' + scriviEuro(centTempo) + ' €)',
                   centesimi: Math.round(centTempo * up / 100) });
    }

    var totale = 0;
    righe.forEach(function (r) { totale += r.centesimi; });

    if (suPrevisione) {
      avvisi.push('Il mezzo e\' ancora fuori: questo e\' il conto sul rientro PREVISTO. Quando rientra, si rifa\' da solo sui giorni veri.');
    }

    return {
      giorni: giorni,
      righe: righe.map(function (r) {
        return { voce: r.voce, dettaglio: r.dettaglio, importo: euro(r.centesimi) };
      }),
      totale: totale,
      totaleEuro: euro(totale),
      cauzione: numIt(noleggio.cauzione !== null && noleggio.cauzione !== undefined && noleggio.cauzione !== ''
                      ? noleggio.cauzione : mezzo.cauzione),
      suPrevisione: suPrevisione,
      avvisi: avvisi
    };
  }

  radice.NoleggioPrezzo = {
    calcola: calcola,
    giorniFra: giorniFra,
    numIt: numIt
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).NoleggioPrezzo;
}
