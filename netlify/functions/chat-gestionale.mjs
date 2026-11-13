// =====================================================================
// ✨ CHAT CON AI — la function della chat dentro il gestionale
// 29 agosto 2026
//
// ⛔ LE TRE REGOLE DI QUESTO FILE, in ordine di quanto costano se si
//    sbagliano.
//
// 1) CHI CHIAMA SI RICAVA DAL GETTONE, NON DAL MESSAGGIO.
//    E' la lezione del 21 agosto scritta in ai-claude.js: gli id delle
//    imprese sono pubblici, quindi un `user_id` che arriva dal browser
//    non vale niente. Qui l'utente esce da `auth.getUser(token)` e da
//    nessun'altra parte.
//
// 2) OGNI LETTURA DI DATI PORTA SEMPRE DUE FILTRI: `user_id` (l'utente
//    verificato) e `mestiere_id` (il reparto aperto). Mai uno solo.
//    Alessio il 29 agosto ha deciso che la chat vede SOLO il reparto in
//    cui sei: se salta il secondo filtro, un iscritto vede i conti di un
//    suo altro reparto; se salta il primo, vede quelli di un altro
//    iscritto. Il banco `prove/chat-attrezzi/banco.js` prova ogni
//    attrezzo e pretende tutti e due i filtri.
//
// 3) I DATI SI LEGGONO COL GETTONE DELL'ISCRITTO, NON COL SERVICE ROLE.
//    ⚠️ QUESTA E' LA COSA PIU' IMPORTANTE DI TUTTO IL FILE.
//    Il service role passa sopra alle regole RLS di Supabase: con quello
//    un errore nel filtro `user_id` non lo ferma nessuno, e uno legge i
//    lavori di un altro. Leggendo col gettone dell'iscritto la RLS resta
//    accesa e diventa la SECONDA serratura: perche' esca un dato di un
//    altro devono sbagliare tutte e due, il mio filtro e la regola sul
//    database.
//    Il service role qui serve a due cose sole, e nessuna e' un dato del
//    gestionale: scrivere in `gest_chat_messaggi` (che l'iscritto non
//    puo' scrivere, apposta) e chiedere `chat_stato`.
//
// ⚠️ Le tabelle leggibili sono un ELENCO CHIUSO qui sotto. Il nome della
//    tabella non arriva mai da quello che scrive Claude: Claude sceglie
//    una parola dall'elenco, e se dice una parola che non c'e' la
//    risposta e' «non lo so».
//    E l'elenco contiene SOLO tabelle che hanno il loro `mestiere_id`:
//    le tabelle figlie (le righe di una fattura, le voci di un computo)
//    il reparto non ce l'hanno scritto, quindi non si sanno filtrare e
//    per adesso restano fuori.
// =====================================================================
import { createClient } from '@supabase/supabase-js';

/* ⛔ 29 agosto 2026 (sera) — ERA 4000, E L'HO VISTO SCATTARE DAL VIVO.
   Provando la chat sul gestionale vero, un messaggio su tre e' tornato
   indietro con «Non riesco a verificare il reparto». Non era rotto niente:
   la lettura di `gest_mestieri` misurata subito dopo ci mette 107 ms, ma la
   function su Netlify parte a freddo e i primi secondi se li mangia
   l'avvio. Quattro secondi erano troppo pochi.
   ⚠️ Il tetto serve lo stesso — senza, un messaggio potrebbe restare
   appeso — ma otto secondi sono ancora molto meno del tetto di Claude
   (30 s) e non fanno aspettare nessuno piu' di prima: si aspetta solo
   quando qualcosa e' davvero lento.
   ⛔ E questo controllo sta PRIMA di dove si scala il messaggio: se
   scatta, l'iscritto non paga niente. Verificato: il contatore non si e'
   mosso. */
const TEMPO_ACCESSO  = 8000;    // ms — tetto sui controlli d'accesso
const TEMPO_CLAUDE   = 30000;   // ms — tetto su una risposta di Claude
const GIRI_MAX       = 6;       // quante volte Claude puo' chiedere dati
/* ⛔ 10 nov 2026 — I PREZZI DI UN COMPUTO VALGONO 5 MESSAGGI (deciso da Alex).
   Misurato dal vivo: un pezzo da 30 righe costa 0,13–0,16 $ di AI, una
   domanda normale molto meno. Il conto dei messaggi compresi lo fa
   `chat_stato` CONTANDO le righe «utente» del mese in gest_chat_messaggi
   (anche quelle svuotate: svuotare non azzera il contatore). Quindi qui si
   scrivono 4 righe «utente» in piu', gia' svuotate e in una conversazione
   a parte: contano, e non si vedono ne' nella chat ne' nell'archivio.
   Chi sta usando i messaggi COMPRATI ne scala altri 4 con la stessa
   funzione di sempre. */
const PESO_PREZZI = 5;
/* ⛔ 10 nov 2026 (sera) — 20, non 30. Dal vivo un pezzo da 30 righe ha
   lavorato 35 secondi: Netlify taglia la risposta a 30 (errore 504), i
   prezzi erano pronti ma non sono mai arrivati, e i 5 messaggi si erano
   scalati lo stesso. */
const RIGHE_ZERO_MAX = 20;      // righe a zero di un computo, per pezzo
const RIGHE_MAX      = 25;      // righe per attrezzata: piu' di cosi' non serve
const STORIA_MAX     = 20;      // messaggi di chiacchierata che si rimandano

// ---------------------------------------------------------------------
// L'ELENCO CHIUSO — cosa la chat puo' guardare
// ⚠️ `campi` non e' un dettaglio: e' quello che finisce dentro il
//    messaggio mandato a Claude. Meno campi = meno costo e meno roba di
//    lui che esce di casa. Niente note libere, niente allegati.
// ---------------------------------------------------------------------
// ⚠️ I nomi delle colonne qui sotto sono stati LETTI DAL DATABASE VERO il
//    29 agosto 2026, uno per uno, non scritti a memoria. Al primo giro ne
//    avevo sbagliati →5←: `gest_fatture.totale` e `gest_preventivi.totale`
//    non esistono (il totale si fa dalle righe), la scadenza si chiama
//    `data_scadenza` e non `data`, il fornitore non ha `citta`, e la
//    mansione di una persona e' `mansione`, non `ruolo`.
//    Sarebbero stati cinque attrezzi che rispondono sempre «errore» senza
//    che nessuno capisse perche'.
const ATTREZZI = {
  /* ⛔ 7 nov 2026 — `data` dice quale colonna e' LA data di quella cosa: serve
     ai filtri «dal/al» e a scrivere accanto a ogni riga `giorni_da_oggi`,
     cosi' il modello non confronta piu' le date a mente (dal vivo aveva
     detto «nei tempi» un lavoro previsto due mesi prima). */
  lavori:       { tabella:'gest_lavori',            campi:'id,descrizione,dove,stato,data_prevista,data_fatto,importo,fatt_stato,cliente_id', ordine:'data_prevista', data:'data_prevista', nome:'i lavori' },
  preventivi:   { tabella:'gest_preventivi',        campi:'id,numero,titolo,stato,data,cliente_id',             ordine:'data',          data:'data',          nome:'i preventivi' },
  fatture:      { tabella:'gest_fatture',           campi:'id,numero,anno,data,stato,cli_nome,cliente_id,data_pagata', ordine:'data',   data:'data',          nome:'le fatture' },
  clienti:      { tabella:'gest_clienti',           campi:'id,nome,tipo,citta',                                 ordine:'nome',          nome:'i clienti' },
  fornitori:    { tabella:'gest_fornitori',         campi:'id,nome,categoria,telefono',                         ordine:'nome',          nome:'i fornitori' },
  scadenze:     { tabella:'gest_scadenze',          campi:'id,titolo,data_scadenza,stato',                      ordine:'data_scadenza', data:'data_scadenza', nome:'le scadenze' },
  computi:      { tabella:'gest_computi',           campi:'id,numero,titolo,stato,data',                        ordine:'data',          data:'data',          nome:'i computi' },
  sal:          { tabella:'gest_sal',               campi:'id,numero,stato,data',                               ordine:'data',          data:'data',          nome:'gli stati di avanzamento' },
  mezzi:        { tabella:'gest_mezzi',             campi:'id,nome,targa,stato',                                ordine:'nome',          nome:'i mezzi' },
  operatori:    { tabella:'gest_operatori',         campi:'id,nome,mansione',                                   ordine:'nome',          nome:'le persone della squadra' },
  fatture_fornitori: { tabella:'gest_fatture_fornitori', campi:'id,numero,importo,scadenza,stato',              ordine:'scadenza',      data:'scadenza',      nome:'le fatture dei fornitori' },

  // ⛔ 30 agosto 2026 — SETTE COSE CHE C'ERANO GIA' E NESSUNO LEGGEVA.
  //    Un commento di questo file diceva che le tabelle figlie «il reparto
  //    non ce l'hanno scritto». E' vero per le RIGHE dei documenti, ma NON
  //    per queste sette: il `mestiere_id` ce l'hanno tutte, letto dal
  //    database vero il 30 agosto una per una.
  //    Il buco piu' assurdo era questo: la chat sapeva che avevi la fattura
  //    2026/14, ma non quanto valeva.
  //    ⚠️ `cestino:false` dove la colonna `eliminato_il` non esiste (le
  //    quattro viste e i rifornimenti): chiederla la' fa rispondere errore.
  //    ⚠️ Le quattro viste sono `security_invoker=true` — controllato il 30
  //    agosto — quindi si portano dietro le regole delle tabelle sotto: la
  //    seconda serratura c'e' anche li'.
  /* ⛔ 30 agosto 2026, difetto trovato COL COLLAUDO DAL VIVO e non dai
     banchi: alla domanda «quante ore ho segnato» la chat ha risposto
     «3 ore». Le ore vere erano →15←, in →3← segnature. Aveva contato le
     RIGHE. Il nome dell'attrezzo diceva «le ore lavorate» e quindi
     contarle sembrava la cosa giusta: adesso dice cosa e' una riga. */
  ore:               { tabella:'gest_ore',               campi:'id,data,ore,operatore_id,lavoro_id',                                  ordine:'data',          data:'data', nome:'le segnature delle ore (ATTENZIONE: ogni riga e\' una segnatura, e la colonna `ore` dice quante ore sono. Contare le righe NON da\' le ore)' },
  rapportini:        { tabella:'gest_rapportini',        campi:'id,data,lavoro_id,materiali,note',                                    ordine:'data',          data:'data', nome:'i rapportini di cantiere' },
  preventivi_totali: { tabella:'gest_preventivi_totali', campi:'preventivo_id,imponibile,iva,totale,n_righe',                          ordine:'totale',        nome:'quanto vale ogni preventivo', cestino:false },
  fatture_totali:    { tabella:'gest_fatture_totali',    campi:'fattura_id,imponibile,iva,totale,totale_documento,ritenuta,segno',     ordine:'totale',        nome:'quanto vale ogni fattura',    cestino:false },
  mezzi_scadenze:    { tabella:'gest_mezzi_scadenze',    campi:'mezzo_id,nome,targa,aperte,scadute,prossima_data,prossimo_titolo,prossimo_tipo', ordine:'prossima_data', nome:'le scadenze dei mezzi', cestino:false },
  rifornimenti:      { tabella:'gest_rifornimenti',      campi:'id,data,mezzo_id,importo,litri,km,distributore',                       ordine:'data',          data:'data', nome:'i rifornimenti di carburante', cestino:false },
  carte_saldo:       { tabella:'gest_carte_saldo',       campi:'carta_id,nome,stato,saldo',                                           ordine:'saldo',         nome:'il saldo delle carte',        cestino:false },

  /* ⛔ 7 nov 2026 — TRE COSE CHE LA CHAT NON VEDEVA E LA GENTE CHIEDE.
     Dal registro vero: «guarda le richieste dal sito: cosa devo fare oggi?»
     e la chat rispondeva «non ho accesso».
     ⚠️ `livello` cambia il PRIMO filtro, mai lo toglie:
        'account' → promemoria e prezzi sono di tutto il gestionale, non di
                    un reparto: si filtra sull'utente e basta;
        'impresa' → le richieste dal sito sono indirizzate alla SCHEDA
                    (imprese.id). Si filtra su quell'id, letto dal server
                    col gettone dell'iscritto, MAI arrivato dal browser.
                    ⛔ Serve davvero: il fondatore per regola RLS vede le
                    richieste di TUTTI, quindi senza questo filtro la chat
                    di Alessio gliele mischierebbe.
     ⚠️ Le richieste si leggono da `preventivi_safe`: la vista SENZA email e
        telefono del cliente. Alla chat non servono e non devono uscire. */
  promemoria:      { tabella:'promemoria',       campi:'id,testo,data,ora,stato',  ordine:'data', data:'data', livello:'account', nome:'i promemoria (di tutto il gestionale, non di un reparto). stato: aperto o fatto' },
  note_calendario: { tabella:'gest_note',        campi:'id,data,testo',            ordine:'data', data:'data', cestino:false,   nome:'le note scritte sui giorni del calendario' },
  richieste_sito:  { tabella:'preventivi_safe',  campi:'id,nome,citta,categoria_lavoro,tipo_lavoro,descrizione,urgenza,budget,data_preferita,created_at,risposta_at,visto_il',
                     ordine:'created_at', data:'created_at', livello:'impresa', cestino:false,
                     nome:'le richieste di preventivo arrivate dai clienti del sito (di tutta l\'attivita\', non di un reparto). visto_il vuoto = non ancora aperta' }

};
// ---------------------------------------------------------------------
// ⛔ 30 agosto 2026 — QUELLO CHE STA DENTRO UN DOCUMENTO.
//
// Le righe di una fattura, quelle di un preventivo, le spese di un lavoro
// e le voci di un computo NON hanno la colonna `mestiere_id`: sono appese
// al documento, e il reparto ce l'ha il documento. Per questo fino a oggi
// la chat non le leggeva: senza il secondo filtro non si potevano dare.
//
// ⛔ COME SI TIENE IL REPARTO LO STESSO, ed e' la riga piu' importante di
//    questo pezzo: PRIMA si va a prendere il PADRE con i due filtri di
//    sempre (`user_id` + `mestiere_id`), e solo SE il padre esce fuori si
//    leggono i figli. Se la fattura non e' sua, o e' di un altro reparto,
//    il padre non esce e i figli non si leggono nemmeno.
//    Cosi' il reparto non si allenta di un millimetro: si sposta il
//    controllo sul documento, dove il reparto c'e' scritto davvero.
//
// ⚠️ `padre` e `chiave` NON arrivano mai da Claude: stanno qui dentro.
//    Claude sceglie una parola dall'elenco, e basta.
// ---------------------------------------------------------------------
const FIGLI = {
  righe_fattura: {
    tabella: 'gest_fattura_righe',   padre: 'fatture',    chiave: 'fattura_id',
    campi: 'id,ordine,descrizione,qta,prezzo,iva', ordine: 'ordine', crescente: true,
    nome: 'le righe di una fattura'
  },
  righe_preventivo: {
    tabella: 'gest_preventivo_righe', padre: 'preventivi', chiave: 'preventivo_id',
    campi: 'id,ordine,sezione,descrizione,qta,unita,prezzo', ordine: 'ordine', crescente: true,
    nome: 'le righe di un preventivo'
  },
  spese_del_lavoro: {
    tabella: 'gest_spese',           padre: 'lavori',     chiave: 'lavoro_id',
    campi: 'id,data,descrizione,importo,fornitore_id', ordine: 'data', cestino: true,
    nome: 'le spese di un lavoro'
  },
  voci_del_computo: {
    tabella: 'gest_computo_voci_calc', padre: 'computi',  chiave: 'computo_id',
    campi: 'id,ordine,codice,descrizione,unita,quantita,prezzo_unitario,importo', ordine: 'ordine', crescente: true,
    nome: 'le voci di un computo'
  }
};

/* ⛔ i figli: l'utente SEMPRE, e il documento padre — che a questo punto
   e' gia' stato controllato col reparto. Funzione pura, cosi' il banco la
   prova da sola. */
function costruisciLetturaFiglio(cosa, uid, idPadre, opzioni) {
  const o = opzioni || {};
  const f = FIGLI[cosa];
  if (!f) return { errore: 'non lo so guardare: ' + String(cosa) };
  if (!uid) return { errore: 'manca chi sta chiedendo' };
  if (!idPadre) return { errore: 'manca il documento di cui vuoi il dentro' };
  const q = {
    tabella: f.tabella,
    campi: f.campi,
    filtri: { user_id: uid },
    padreChiave: f.chiave,
    padreId: String(idPadre),
    senzaCestino: f.cestino === true,
    ordine: f.ordine,
    crescente: !!f.crescente,
    limite: Math.min(Math.max(parseInt(o.quanti, 10) || RIGHE_MAX, 1), RIGHE_MAX)
  };
  q.filtri[f.chiave] = String(idPadre);
  return q;
}

// ---------------------------------------------------------------------
// ⛔ 7 nov 2026 — DOVE CERCA «cerca_per_nome», ADESSO SU PIU' CASELLE.
//
// Prima era UNA casella per cosa, e per le fatture era `numero`: ma
// `gest_fatture.numero` e' un NUMERO INTERO, e `ilike` su un intero fa
// rispondere Postgres «operator does not exist: integer ~~* unknown»
// (provato il 7 nov dal vivo). Quindi «cercami la fattura 15» o «le
// fatture di Rossi» davano SEMPRE errore. Stessa cosa per preventivi e SAL.
// Adesso: le caselle di TESTO si cercano con ilike (anche piu' d'una:
// un lavoro si trova dalla descrizione O dall'indirizzo), e il numero
// intero si cerca solo se la parola e' fatta di cifre, con l'uguale.
// ---------------------------------------------------------------------
const DOVE_SI_CERCA = {
  lavori:['descrizione','dove'], preventivi:['titolo'], fatture:['cli_nome'], clienti:['nome','citta'],
  fornitori:['nome','categoria'], scadenze:['titolo'], computi:['titolo','numero'], sal:[],
  mezzi:['nome','targa'], operatori:['nome'], fatture_fornitori:['numero'],
  mezzi_scadenze:['nome','targa'], rifornimenti:['distributore'], carte_saldo:['nome'], rapportini:['note'],
  promemoria:['testo'], note_calendario:['testo'], richieste_sito:['nome','categoria_lavoro','tipo_lavoro','descrizione','citta']
};
const NUMERO_INTERO = { fatture:'numero', preventivi:'numero', sal:'numero' };
const FORMA_STATO = /^[a-z_]{2,20}$/;
const FORMA_GIORNO = /^\d{4}-\d{2}-\d{2}$/;

/* la parola entra dentro un filtro `or(...)` di PostgREST: virgole,
   parentesi e asterischi lo spezzerebbero. Si tolgono, non si scappano. */
function parolaPulita(x) {
  return String(x == null ? '' : x).replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

// ---------------------------------------------------------------------
// ⛔ IL CUORE: qui nasce OGNI lettura, e qui ci sono i due filtri.
//    E' una funzione pura apposta — il banco la puo' chiamare da sola,
//    senza database, e controllare che i filtri ci siano sempre.
//    Se un domani si aggiunge un attrezzo, passa comunque da qui.
// ⛔ 7 nov 2026: i filtri NUOVI (stato, date) si AGGIUNGONO ai due di
//    sempre e non li possono mai togliere: stanno in chiavi diverse.
// ---------------------------------------------------------------------
function costruisciLettura(cosa, uid, reparto, opzioni) {
  const o = opzioni || {};
  const a = ATTREZZI[cosa];
  // il nome della tabella NON arriva mai da Claude: o e' nell'elenco o niente
  if (!a) return { errore: 'non lo so guardare: ' + String(cosa) };
  if (!uid) return { errore: 'manca chi sta chiedendo' };
  let filtri;
  if (a.livello === 'impresa') {
    if (!o.impresaId) return { errore: 'non trovo la tua scheda su TrovaImpresa, quindi non vedo le richieste' };
    filtri = { impresa_id: String(o.impresaId) };
  } else if (a.livello === 'account') {
    filtri = { user_id: uid };
  } else {
    if (!reparto) return { errore: 'manca il reparto' };
    // ⛔ TUTTI E DUE, SEMPRE. Non e' negoziabile.
    filtri = { user_id: uid, mestiere_id: reparto };
  }
  let campi = a.campi;
  if (cosa === 'lavori' && o.ruolo === 'professionista') {
    campi += ',pratica_tipo,pratica_stato,pratica_comune,pratica_protocollo,pratica_data_dep';
  }
  const q = {
    tabella: a.tabella,
    campi: campi,
    filtri: filtri,
    // ⛔ E IL CESTINO FUORI, SEMPRE (dove la colonna c'e').
    senzaCestino: a.cestino !== false,
    ordine: a.ordine,
    crescente: !!o.prossime,
    limite: Math.min(Math.max(parseInt(o.quanti, 10) || RIGHE_MAX, 1), RIGHE_MAX),
    soloConta: !!o.soloConta
  };
  // stato: solo parole fatte di lettere minuscole e trattino basso
  if (o.stato && FORMA_STATO.test(String(o.stato))) q.stato = String(o.stato);
  if (o.escludiStato && FORMA_STATO.test(String(o.escludiStato))) q.escludiStato = String(o.escludiStato);
  if (a.data) {
    q.colData = a.data;
    if (o.dal && FORMA_GIORNO.test(String(o.dal))) q.dal = String(o.dal);
    if (o.al  && FORMA_GIORNO.test(String(o.al)))  q.al  = String(o.al);
  }
  if (o.vuoto === 'visto_il' && cosa === 'richieste_sito') q.vuoto = 'visto_il';
  if (cosa === 'lavori' && o.statoPratica && PRATICA_STATI_OK.indexOf(String(o.statoPratica)) >= 0) q.statoPratica = String(o.statoPratica);
  if (cosa === 'lavori' && o.praticheAlComune) q.inPratica = ['depositata', 'istruttoria', 'integrazioni'];
  if (q.statoPratica || q.inPratica) {
    q.ordine = 'pratica_data_dep';
    if (campi.indexOf('pratica_stato') < 0) q.campi = campi + ',pratica_tipo,pratica_stato,pratica_comune,pratica_protocollo,pratica_data_dep';
  }
  if (o.parola) {
    const v = parolaPulita(o.parola);
    const testo = DOVE_SI_CERCA[cosa] || [];
    const pezzi = [];
    if (v) testo.forEach(function (c) { pezzi.push(c + '.ilike.*' + v + '*'); });
    const cifre = String(o.parola).replace(/[^0-9]/g, '');
    if (NUMERO_INTERO[cosa] && cifre && cifre.length <= 9 && /^\D*\d+\D*$/.test(String(o.parola).trim())) {
      pezzi.push(NUMERO_INTERO[cosa] + '.eq.' + cifre);
    }
    if (!pezzi.length) return { errore: 'per questa cosa si cerca solo col numero' };
    q.oppure = pezzi.join(',');
  }
  return q;
}

/* ⛔ 7 nov 2026 — I GIORNI LI CONTA IL SERVER, NON IL MODELLO.
   Accanto a ogni riga con una data si scrive `giorni_da_oggi`:
   negativo = gia' passato, 0 = oggi, positivo = fra quanti giorni.
   Pura: il banco la prova da sola. */
function segnaGiorni(righe, campo, oggiISO) {
  if (!Array.isArray(righe) || !campo) return righe;
  const base = Date.parse(String(oggiISO) + 'T00:00:00Z');
  if (isNaN(base)) return righe;
  return righe.map(function (r) {
    const v = r && r[campo] ? String(r[campo]).slice(0, 10) : '';
    if (!FORMA_GIORNO.test(v)) return r;
    const t = Date.parse(v + 'T00:00:00Z');
    if (isNaN(t)) return r;
    return Object.assign({}, r, { giorni_da_oggi: Math.round((t - base) / 86400000) });
  });
}
function giornoPiu(oggiISO, n) {
  const t = Date.parse(String(oggiISO) + 'T12:00:00Z');
  if (isNaN(t)) return '';
  return new Date(t + n * 86400000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// ⛔ IL GRADINO 3 — «TI RIEMPIO IL MODULO, TU SALVI». 29 agosto 2026.
//
// Questo NON e' un attrezzo che legge. Non tocca il database, non ha
// filtri da mettere e non puo' sbagliare reparto, perche' non guarda
// niente: prende quello che Claude ha capito e lo rimanda al browser,
// che apre il modulo del Lavoro gia' pieno.
//
// ⛔ L'AI NON SCRIVE MAI NEL DATABASE. Vale qui come in tutto il resto
//    del gestionale: l'AI riempie le caselle, l'iscritto guarda e salva
//    lui, col codice di sempre.
//
// ⚠️ LE CASELLE SONO UN ELENCO CHIUSO, come le tabelle qui sopra: quello
//    che Claude manda in piu' si butta via. Non si gira un oggetto
//    arrivato da fuori dentro un modulo cosi' com'e'.
// ⚠️ LA DATA. La casella `j-data` e' un `<input type="date">`, che
//    accetta SOLO la forma AAAA-MM-GG. Una data scritta in un altro modo
//    la casella la rifiuta IN SILENZIO: resta vuota e nessuno capisce
//    perche'. E' lo stesso difetto degli importi del 16 agosto. Quindi
//    una data che non ha quella forma si butta qui: meglio il modulo con
//    la data vuota che con una data che non c'e' mai arrivata.
// ⚠️ Ogni pezzo si taglia a 300 caratteri: nel modulo del lavoro non c'e'
//    niente di piu' lungo, e una casella non e' il posto dove far entrare
//    un romanzo.
// ---------------------------------------------------------------------
// ⚠️ I MODULI CHE LA CHAT SA APRIRE. Uno per riga, con le sue caselle e
//    la casella SENZA LA QUALE non ha senso aprire niente. Aggiungerne
//    uno domani vuol dire aggiungere una riga qui, non un altro pezzo di
//    codice: e il banco lo gira da solo su tutti quelli che trova.
const MODULI = {
  lavoro:  { caselle: ['descrizione', 'dove', 'data', 'importo', 'cliente', 'operatore'],
             serve: 'descrizione', manca: 'manca cosa c\'e\' da fare' },
  cliente: { caselle: ['nome', 'indirizzo', 'referente', 'telefono'],
             serve: 'nome',        manca: 'manca il nome del cliente' },
  /* ⛔ 30 agosto 2026 — DUE MODULI IN PIU'.
     Erano due su tanti, e i due che mancavano di piu' sono questi: una
     scadenza da segnare («la revisione del furgone il 12 ottobre») e un
     fornitore nuovo, che di solito arriva insieme alla foto della bolla.
     ⚠️ Solo caselle di TESTO: le tendine del modulo (il tipo, il mezzo, il
     cliente) restano da riempire a mano. Una tendina si riempie per id, e
     un id inventato attaccherebbe la scadenza al mezzo sbagliato. */
  scadenza:  { caselle: ['titolo', 'data', 'note'],
               serve: 'titolo', manca: 'manca cosa scade' },
  fornitore: { caselle: ['nome', 'categoria', 'telefono', 'email', 'indirizzo', 'piva'],
               serve: 'nome',   manca: 'manca il nome del fornitore' },
  /* 8 ott 2026 — IL PREVENTIVO. Titolo + voci (descrizione, unita', quantita',
     prezzo). Le voci si puliscono in costruisciModulo: max 30, testi corti,
     numeri veri. Un prezzo che non c'e' resta VUOTO, mai 0. */
  preventivo: { caselle: ['titolo'], serve: 'titolo', manca: 'manca il titolo del preventivo' }
};
const CASELLE_LAVORO = MODULI.lavoro.caselle;    // per chi lo chiedeva prima

/* ⛔ 7 nov 2026 — LE CASELLE DELLA PRATICA (solo studio tecnico).
   Tipo e stato sono TENDINE, ma con un elenco CHIUSO e scritto qui uguale a
   PRATICA_TIPI / PRATICA_STATI di js/gest-scadenze-pratiche.js: non c'e' un id
   da indovinare, quindi si possono riempire. Una parola fuori elenco si butta.
   ⚠️ Se cambia l'elenco nel gestionale, va cambiato anche qui. */
const PRATICA_TIPI_OK  = ['CILA', 'CILAS', 'SCIA', 'SCIA alternativa al PdC', 'Permesso di Costruire', 'Autorizzazione paesaggistica', "Agibilita'", 'Sanatoria', 'Accatastamento', 'Voltura', 'Altro'];
const PRATICA_STATI_OK = ['da_preparare', 'depositata', 'istruttoria', 'integrazioni', 'approvata', 'archiviata'];
const CASELLE_PRATICA  = ['pratica_tipo', 'pratica_stato', 'pratica_comune', 'pratica_protocollo', 'pratica_data_dep', 'catasto_foglio', 'catasto_particella', 'catasto_sub'];

/* pura: prende quello che ha detto Claude e tiene solo le caselle buone */
function casellePratica(d) {
  const fuori = {};
  const x = d || {};
  CASELLE_PRATICA.forEach(function (k) {
    if (x[k] === null || x[k] === undefined) return;
    let v = String(x[k]).trim().slice(0, 120);
    if (!v) return;
    if (k === 'pratica_tipo') {
      const nn = function (z) { return z.toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''); };
      const giusto = PRATICA_TIPI_OK.find(function (t) { return nn(t) === nn(v); });
      if (!giusto) return; v = giusto;
    }
    if (k === 'pratica_stato') { v = v.toLowerCase(); if (PRATICA_STATI_OK.indexOf(v) < 0) return; }
    if (k === 'pratica_data_dep' && !FORMA_DATA.test(v)) return;
    if (/^catasto_/.test(k)) { v = v.slice(0, 20); }
    fuori[k] = v;
  });
  return fuori;
}
const LUNGHEZZA_MAX  = 300;
const FORMA_DATA     = /^\d{4}-\d{2}-\d{2}$/;

function costruisciModulo(tipo, dati, opzioni) {
  const m = MODULI[tipo];
  if (!m) return { errore: 'modulo che non conosco: ' + String(tipo) };
  const d = dati || {};
  const campi = {};
  m.caselle.forEach(function (k) {
    if (d[k] === null || d[k] === undefined) return;
    const v = String(d[k]).trim().slice(0, LUNGHEZZA_MAX);
    if (!v) return;
    if (k === 'data' && !FORMA_DATA.test(v)) return;   // vedi la nota sopra
    campi[k] = v;
  });
  /* ⛔ 7 nov 2026 — la pratica dello studio: le caselle passano dal filtro
     chiuso qui sopra, e SOLO se chi chiede e' uno studio tecnico. */
  if (tipo === 'lavoro' && opzioni && opzioni.ruolo === 'professionista') {
    Object.assign(campi, casellePratica(d));
  }
  /* ⛔ 7 nov 2026 — modificare un lavoro che c'e' gia': l'id e' quello vero,
     controllato dal server prima di arrivare qui. Si cambiano SOLO le caselle
     dette: quindi la descrizione non serve. */
  if (opzioni && opzioni.modifica) {
    if (!Object.keys(campi).length) return { errore: 'non mi hai detto cosa cambiare' };
    return { tipo: tipo, id: String(opzioni.modifica), campi: campi };
  }
  if (!campi[m.serve]) return { errore: m.manca };
  if (tipo === 'preventivo') {
    const voci = pulisciVoci(d.voci, false);
    if (voci.length) campi.voci = voci;
  }
  return { tipo: tipo, campi: campi };
}

/* 10 nov 2026 — DUE UNITA' DI MISURA SONO LA STESSA? «mq», «m²», «m2», «MQ.»
   si'; «m²» e «m³» no; una vuota non e' uguale a niente (nel dubbio no:
   un prezzo al m² su una riga in metri e' un conto sbagliato che sembra giusto). */
function normaUnita(u) {
  let x = String(u == null ? '' : u).toLowerCase().trim().replace(/²/g, '2').replace(/³/g, '3').replace(/[\s.\/]/g, '');
  const pari = { mq: 'm2', metriquadri: 'm2', metroquadro: 'm2', mc: 'm3', metricubi: 'm3', metrocubo: 'm3', ml: 'm', mt: 'm', metri: 'm', metro: 'm',
                 cad: 'cad', cadauno: 'cad', n: 'cad', nr: 'cad', num: 'cad', pz: 'cad', pezzi: 'cad', pezzo: 'cad',
                 h: 'h', ora: 'h', ore: 'h', kg: 'kg', q: 'q', ql: 'q', qli: 'q', t: 't', ton: 't',
                 acorpo: 'corpo', corpo: 'corpo', ac: 'corpo', gg: 'g', giorno: 'g', giorni: 'g', giornata: 'g' };
  return pari[x] || x;
}
function stessaUnita(a, b) {
  const x = normaUnita(a), y = normaUnita(b);
  return !!x && !!y && x === y;
}

/* ⛔ 10 nov 2026 (sera) — LA VARIANTE STA IN FONDO. Nel prezzario le varianti
   della stessa voce hanno lo STESSO inizio lungo e cambiano solo dopo l'ultimo
   «:» («...: doccia», «...: lavabo», «...: spessore 2 cm», «...: per ogni cm in
   piu'»). Al modello arrivavano i primi 220 caratteri: la variante non la
   vedeva mai, e sceglieva a caso. Qui si legge la coda, la si fa vedere, e la
   si usa per scartare le varianti sbagliate. */
function codaVoce(desc) {
  const t = String(desc || '').trim();
  const i = t.lastIndexOf(':');
  if (i < 0) return '';
  const c = t.slice(i + 1).trim().replace(/[;.]+$/, '').trim();
  return (c.length >= 2 && c.length <= 140) ? c : '';
}
function normaCoda(c) {
  return String(c || '').toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9àèéìòù,.\s]/g, ' ')
    .replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ').trim();
}
/* «per ogni cm in piu'», «maggiorazione», «aumento o diminuzione»: e' un
   SUPPLEMENTO, non la lavorazione. Le due cose non si scambiano mai. */
function eSupplemento(desc) {
  return /per\s+ogni\b[^:]{0,40}\b(in\s+pi[uù]|in\s+meno|oltre)|\bmaggiorazion|\baumento\s+o\s+diminuzion/i.test(String(desc || ''));
}
/* le misure scritte nella coda: «spessore 3 cm» -> ["3cm"], «diam. 20 mm» -> ["20mm"] */
function misureCoda(c) {
  const out = [];
  String(c || '').toLowerCase().replace(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m²|mq|m³|mc|m|kg|kw|w|l|lt|°c|%)(?![a-z])/g, function (_, n, u) {
    out.push(String(+n.replace(',', '.')) + u.replace('mq', 'm²').replace('mc', 'm³').replace('lt', 'l'));
    return _;
  });
  return out;
}
/* Dice se la candidata e' la stessa variante della riga del computo:
   'si' (coda uguale), 'no' (supplemento contro lavorazione, misure diverse,
   coda diversa sulla stessa voce), '?' (non si sa). */
function stessaVariante(rigaDesc, candDesc) {
  if (eSupplemento(rigaDesc) !== eSupplemento(candDesc)) return 'no';
  const a = codaVoce(rigaDesc), b = codaVoce(candDesc);
  if (!a || !b) return '?';
  const na = normaCoda(a), nb = normaCoda(b);
  const ia = String(rigaDesc).slice(0, 60).toLowerCase(), ib = String(candDesc).slice(0, 60).toLowerCase();
  const stessaTesta = ia === ib && ia.length >= 40;
  /* coda uguale vale solo sulla STESSA voce: «per ogni cm in piu'» c'e' sotto
     cento lavorazioni diverse */
  if (na === nb) return stessaTesta ? 'si' : '?';
  const ma = misureCoda(a), mb = misureCoda(b);
  if (ma.length && mb.length && !ma.some(function (x) { return mb.indexOf(x) >= 0; })) return 'no';
  /* stesso inizio lungo e coda diversa = un'altra variante della stessa voce */
  if (stessaTesta) return 'no';
  return '?';
}
/* come la si fa vedere al modello: l'inizio e, se e' lunga, anche la coda */
function mostraVoce(desc, quanto) {
  const t = String(desc || '').trim(), c = codaVoce(t);
  if (t.length <= quanto) return t;
  if (!c) return t.slice(0, quanto);
  return t.slice(0, Math.max(60, quanto - c.length - 5)) + ' … : ' + c;
}

/* ⛔ 10 nov 2026 — LE VOCI SI PULISCONO IN UN POSTO SOLO.
   Le usano il preventivo e il computo: max 30, testi corti, numeri veri.
   Un prezzo che non c'e' resta VUOTO, mai 0. Solo per il computo passa anche
   `prezzo_da`: da quale voce del SUO prezzario viene il prezzo (lo legge
   l'utente nella schermata di controllo, prima di far entrare la riga). */
function pulisciVoci(lista, conFonte) {
  const voci = [];
  (Array.isArray(lista) ? lista : []).slice(0, 30).forEach(function (v) {
    if (!v) return;
    const desc = String(v.descrizione == null ? '' : v.descrizione).trim().slice(0, 200);
    if (!desc) return;
    const voce = { descrizione: desc };
    const un = String(v.unita == null ? '' : v.unita).trim().slice(0, 12);
    if (un) voce.unita = un;
    const q = Number(v.quantita);
    if (isFinite(q) && q > 0 && q < 1000000) voce.quantita = q;
    /* 10 nov 2026, visto nel collaudo dal vivo: una riga «a corpo» senza
       quantita' entrava nel computo a 0 e valeva zero anche col prezzo.
       «A corpo» vuol dire UNO. Solo per il computo: il preventivo resta com'era. */
    else if (conFonte && /^(a\s+)?corpo$/i.test(un)) voce.quantita = 1;
    const pz = (v.prezzo_unitario === null || v.prezzo_unitario === undefined || v.prezzo_unitario === '') ? NaN : Number(v.prezzo_unitario);
    if (isFinite(pz) && pz >= 0 && pz < 10000000) voce.prezzo_unitario = pz;
    if (conFonte && voce.prezzo_unitario !== undefined) {
      const da = String(v.prezzo_da == null ? '' : v.prezzo_da).trim().slice(0, 160);
      if (da) voce.prezzo_da = da;
    }
    voci.push(voce);
  });
  return voci;
}

/* ⛔ 10 nov 2026 — IL COMPUTO DALLA CHAT. Due lavori, tutti e due SENZA
   scrivere niente: il browser apre la schermata «Controlla…» (la stessa del
   PDF del geometra) e a far entrare le righe e' l'utente, una spunta per riga.
   - `aggiungi`: lavorazioni nuove, in un computo che c'e' (id) o in uno nuovo
     (titolo): quello nuovo nasce solo quando lui preme «Metti dentro».
   - `prezzi`: prezzi per le righe che ci sono gia' e sono a zero. Qui passa
     solo la proposta: quale riga e' davvero del computo, e se e' ancora a
     zero, lo decide il browser sul computo aperto (e la RLS sotto). */
const FORMA_ID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function costruisciComputo(modo, dati, idVero, titoloVero) {
  const d = dati || {};
  if (modo === 'prezzi') {
    if (!idVero) return { errore: 'mi serve l\'id vero del computo: cercalo prima' };
    const prezzi = [];
    (Array.isArray(d.prezzi) ? d.prezzi : []).slice(0, 60).forEach(function (r) {
      if (!r || !FORMA_ID.test(String(r.voce_id || ''))) return;
      const pz = Number(r.prezzo_unitario);
      if (!isFinite(pz) || pz <= 0 || pz >= 10000000) return;
      const riga = { voce_id: String(r.voce_id), prezzo_unitario: pz, sicuro: r.sicuro !== false };
      if (r.varianti === true) riga.varianti = true;
      const da = String(r.prezzo_da == null ? '' : r.prezzo_da).trim().slice(0, 160);
      if (da) riga.prezzo_da = da;
      prezzi.push(riga);
    });
    if (!prezzi.length) return { errore: 'non c\'e\' nessun prezzo da proporre' };
    return { tipo: 'computo', id: String(idVero), campi: { titolo: String(titoloVero || '').slice(0, 200), prezzi: prezzi } };
  }
  const voci = pulisciVoci(d.voci, true);
  if (!voci.length) return { errore: 'manca almeno una lavorazione' };
  if (idVero) return { tipo: 'computo', id: String(idVero), campi: { titolo: String(titoloVero || '').slice(0, 200), voci: voci } };
  const titolo = String(d.titolo == null ? '' : d.titolo).trim().slice(0, 120);
  if (!titolo) return { errore: 'per un computo nuovo manca il titolo' };
  return { tipo: 'computo', campi: { titolo: titolo, voci: voci } };
}

// ---------------------------------------------------------------------
// ⛔ 29 agosto 2026 (sera) — IL NOME VERO DEL CLIENTE LO DICE IL DATABASE,
//    NON L'ORTOGRAFIA DI CLAUDE.
//
// Trovato provando la chat dal vivo, sui dati veri. Il cliente di Alessio
// si chiama «condomio la firesta». Claude ha sistemato il nome e ha
// scritto «Condominio La Firesta»: giusto in italiano, ma nella tendina
// del modulo quella voce NON C'E'. Il gestionale cerca la voce identica,
// non la trova, e lascia il cliente vuoto. Succede quasi sempre: uno
// scrive il nome come se lo ricorda, il modello lo corregge, e il
// collegamento si perde in silenzio.
//
// ⛔ La toppa NON si mette nel browser allentando il confronto: da li' non
//    si sa quale sia il nome vero, e un confronto largo attacca il lavoro
//    al cliente sbagliato. Il nome vero sta nel database, quindi si va a
//    prenderlo li'.
//
// Come: si cerca con la PAROLA PIU' LUNGA del nome («firesta»), fra i
// clienti DEL SUO REPARTO, e si tiene il nome esatto SOLO se ne esce
// esattamente UNO. Zero o due o piu' e si lascia com'era: meglio la
// tendina vuota che il lavoro sul cliente di un altro.
//
// ⚠️ La lettura passa da `costruisciLettura`, quindi si porta dietro i due
//    filtri e il cestino fuori come tutte le altre. Nessuna scorciatoia.
// ---------------------------------------------------------------------
// ⛔ E QUI NON SI INDOVINA. Il primo tentativo cercava la PAROLA PIU'
//    LUNGA del nome: su «Condominio La Firesta» avrebbe cercato
//    «condominio», che dentro «condomio la firesta» non c'e' — la parola
//    che identifica era «firesta», cioe' la piu' CORTA. E allentare il
//    confronto per farcela stare vuol dire, il giorno che i clienti sono
//    due, attaccare il lavoro a quello sbagliato. Un lavoro sul cliente
//    di un altro non si vede: si vede quando arriva la fattura.
//
//    Quindi: o il nome c'e' IDENTICO fra i suoi, o il campo si toglie e
//    si dice a Claude quali sono i nomi veri, che al giro dopo richiama
//    l'attrezzo con quello giusto. La scelta la fa lui su nomi VERI, non
//    una somiglianza inventata qui.
//
// ⚠️ minuscole, senza accenti, spazi normalizzati: e' lo stesso confronto
//    che fa `impostaSelectQuando` nel browser sulla tendina. I due devono
//    restare uguali, se no il server dice «va bene» e la tendina no.
const senzaAccenti = function (x) {
  return String(x == null ? '' : x).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
};

function scegliNome(nomeDetto, nomiVeri) {
  const cercato = senzaAccenti(nomeDetto);
  if (!cercato) return null;
  const trovato = (nomiVeri || []).filter(function (x) { return senzaAccenti(x) === cercato; });
  return trovato.length ? trovato[0] : null;
}

// i nomi veri del reparto: passa da costruisciLettura, quindi si porta
// dietro i due filtri e il cestino fuori come tutte le altre letture
async function nomiDelReparto(clientDati, cosa, uid, reparto) {
  const r = await esegui(clientDati, costruisciLettura(cosa, uid, reparto, { quanti: RIGHE_MAX }));
  if (r.errore || !r.righe) return [];
  return r.righe.map(function (x) { return x.nome; }).filter(Boolean);
}

// ---------------------------------------------------------------------
// ⛔ 29 agosto 2026 — PERCHE' ESISTE QUESTA FUNZIONCINA
// Trovato da Alessio provando la chat vera: «dati.rpc(...).catch is not
// a function». Quello che `rpc()` di Supabase restituisce NON e' una
// promessa normale: e' un costruttore di richiesta che ha `.then` ma NON
// ha `.catch`. Scrivere `.rpc(...).catch(...)` non protegge da niente —
// fa esplodere la riga stessa, e la chat rispondeva «non sono riuscito».
// ⚠️ Lo stesso errore l'avevo scritto anche dove si scala il CREDITO: li'
// sarebbe stato peggio, perche' un credito non scalato e' un messaggio
// regalato.
// Adesso ogni chiamata passa da qui: si aspetta con `await` dentro un
// try, che e' l'unico modo che funziona davvero.
// ---------------------------------------------------------------------
async function chiamaRpc(client, nome, argomenti) {
  try {
    const r = await client.rpc(nome, argomenti || {});
    if (r && r.error) return { errore: String(r.error.message || r.error) };
    return { dati: r ? r.data : null };
  } catch (e) {
    return { errore: (e && e.message) || String(e) };
  }
}

// esegue una lettura gia' costruita, col client dell'ISCRITTO (RLS accesa)
async function esegui(clientDati, q) {
  if (q.errore) return { errore: q.errore };
  let sel = clientDati.from(q.tabella).select(q.campi, q.soloConta ? { count: 'exact', head: true } : undefined);
  Object.keys(q.filtri).forEach(function(k) { sel = sel.eq(k, q.filtri[k]); });
  if (q.senzaCestino) sel = sel.is('eliminato_il', null);
  if (q.contiene) sel = sel.ilike(q.contiene.campo, '%' + q.contiene.valore + '%');
  if (q.dentro) sel = sel.in(q.dentro.campo, q.dentro.valori);
  /* tutte le parole devono esserci (10 nov 2026: con una parola sola «scavo»
     tornavano le 5 voci piu' usate, e quella giusta non c'era) */
  if (q.contieneTutte) q.contieneTutte.valori.forEach(function (w) { sel = sel.ilike(q.contieneTutte.campo, '%' + w + '%'); });
  if (q.oppure) sel = sel.or(q.oppure);
  if (q.stato) sel = sel.eq('stato', q.stato);
  /* ⚠️ `neq` da solo butta via anche le righe con lo stato VUOTO (in SQL
     null <> 'fatto' non e' vero): un lavoro senza stato e' un lavoro da
     fare, quindi si tiene. */
  if (q.escludiStato) sel = sel.or('stato.is.null,stato.neq.' + q.escludiStato);
  if (q.dal && q.colData) sel = sel.gte(q.colData, q.dal);
  if (q.al && q.colData) sel = sel.lte(q.colData, q.colData === 'created_at' ? q.al + 'T23:59:59' : q.al);
  if (q.vuoto) sel = sel.is(q.vuoto, null);
  if (q.statoPratica) sel = sel.eq('pratica_stato', q.statoPratica);
  if (q.inPratica) sel = sel.in('pratica_stato', q.inPratica);
  if (!q.soloConta) {
    /* ⛔ 30 agosto 2026 — le righe di un documento vanno lette 1, 2, 3 e non
       al contrario: un preventivo letto dal fondo non si capisce. Per tutto
       il resto resta «prima le piu' recenti», salvo `prossime`. */
    if (q.ordine) sel = sel.order(q.ordine, { ascending: !!q.crescente, nullsFirst: false });
    /* 10 nov 2026 — `salta`: per leggere un computo lungo a pezzi (righe
       31-60, 61-90…). Senza, resta il limite di sempre. */
    if (q.salta > 0) sel = sel.range(q.salta, q.salta + q.limite - 1);
    else sel = sel.limit(q.limite);
  }
  const r = await sel;
  if (r && r.error) return { errore: r.error.message };
  return q.soloConta ? { quanti: r.count || 0 } : { righe: r.data || [] };
}

// ---------------------------------------------------------------------
// ⛔ 29 agosto 2026 (sera) — IL CALENDARIO GIA' SCRITTO.
//
// Trovato dal vivo, alla seconda prova. Alessio ha scritto «giovedi'
// prossimo» e nel modulo e' finito il 4 settembre, che e' VENERDI'.
// Giovedi' era il 3.
//
// Il perche': nelle istruzioni gli passavo solo «2026-08-29», il numero.
// Un modello NON SA CONTARE i giorni della settimana da una data: se li
// immagina, e alla prima prova gli era andata bene per caso.
//
// ⛔ Una data sbagliata di un giorno e' il difetto peggiore di tutto il
//    gradino 3: non si vede — il modulo e' pieno, la data c'e', sembra
//    tutto giusto — e si scopre quando l'artigiano si presenta in
//    cantiere il giorno dopo.
//
// Quindi qui il conto non lo fa piu' lui: la fila dei giorni gliela
// scrivo io, nome per nome, e a lui resta da LEGGERE la riga giusta.
//
// ⚠️ COS'E' CHE TIENE, qui dentro: la fila si costruisce e si legge TUTTA
//    in UTC — `getUTCDay`, `getUTCDate`, `toISOString`. Il fuso della
//    macchina non entra mai, quindi il giorno non puo' slittare. Il
//    mezzogiorno e' una cintura in piu' per il giorno che qualcuno
//    passasse alle versioni locali (`getDay`, `toLocaleDateString`): li'
//    partire da mezzanotte sposterebbe il giorno di uno. Il banco lo dice
//    onestamente: quel mezzogiorno da solo non lo misura nessuna prova,
//    perche' con tutto in UTC non cambia niente.
// ⚠️ E i nomi sono scritti a mano invece che con Intl: una function su
//    Netlify puo' girare senza le lingue installate, e uscirebbero i
//    giorni in inglese.
// ---------------------------------------------------------------------
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MESI   = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
                'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

function calendarioProssimo(oggiISO, quanti) {
  const base = new Date(String(oggiISO) + 'T12:00:00Z');
  if (isNaN(base.getTime())) return '';
  const righe = [];
  const fino = (typeof quanti === 'number' && quanti > 0) ? quanti : 14;
  for (let i = 0; i <= fino; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    righe.push(GIORNI[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESI[d.getUTCMonth()]
               + ' = ' + d.toISOString().slice(0, 10));
  }
  return righe.join(' · ');
}

// ---------------------------------------------------------------------
// gli attrezzi come li vede Claude
// ---------------------------------------------------------------------
const ELENCO_COSE = Object.keys(ATTREZZI);
/* ⛔ 7 nov 2026 — i filtri. Gli stati veri del database: lavori da_fare /
   in_corso / fatto · preventivi bozza / inviato / accettato / rifiutato ·
   fatture bozza / emessa / pagata · scadenze aperta / fatta · promemoria
   aperto / fatto. Sul server ogni valore passa da FORMA_STATO e FORMA_GIORNO:
   quello che non ha la forma giusta si butta, non si gira al database. */
const FILTRI_SCHEMA = {
  cosa:          { type:'string', enum: ELENCO_COSE },
  stato:         { type:'string', description:'solo quelle in questo stato. lavori: da_fare, in_corso, fatto · preventivi: bozza, inviato, accettato, rifiutato · fatture: bozza, emessa, pagata · scadenze: aperta, fatta · promemoria: aperto, fatto' },
  escludi_stato: { type:'string', description:'tutte TRANNE quelle in questo stato (es. lavori aperti = escludi «fatto»)' },
  dal:           { type:'string', description:'dalla data AAAA-MM-GG (compresa), sulla data principale di quella cosa' },
  al:            { type:'string', description:'fino alla data AAAA-MM-GG (compresa)' },
  prima_le_prossime: { type:'boolean', description:'true = dalla data più vecchia/vicina alla più lontana (per le cose da fare); di base sono dalle più recenti' },
  stato_pratica: { type:'string', description:'SOLO studio tecnico, su lavori: da_preparare, depositata, istruttoria, integrazioni, approvata, archiviata' }
};
const STRUMENTI = [
  {
    name: 'conta_cose',
    description: 'Conta quante cose di un tipo ci sono nel reparto aperto. Con `stato` o `escludi_stato` conta solo quelle in quello stato: per «quanti lavori ho aperti» usa escludi_stato «fatto». Con `dal`/`al` conta solo quelle in quelle date.',
    input_schema: { type:'object', properties: FILTRI_SCHEMA, required:['cosa'] }
  },
  {
    name: 'elenco_cose',
    description: 'Dà l\'elenco delle cose di un tipo nel reparto aperto, dalle più recenti (o dalle più vicine con `prima_le_prossime`). Ogni riga con una data porta `giorni_da_oggi`: negativo = già passato, 0 = oggi. Filtra con `stato`, `escludi_stato`, `dal`, `al` quando la domanda parla di uno stato o di un periodo: senza filtri vedi solo le ultime 25.',
    input_schema: { type:'object', properties: Object.assign({ quanti: { type:'integer' } }, FILTRI_SCHEMA), required:['cosa'] }
  },
  {
    name: 'agenda',
    description: 'IN UN COLPO SOLO: i lavori in ritardo (non fatti e con la data già passata), i lavori dei prossimi 14 giorni, le scadenze scadute e dei prossimi 30 giorni, i promemoria da fare, le note del calendario della settimana e le richieste dal sito non ancora aperte. Ogni cosa ha già `giorni_da_oggi`. USALO per «cosa devo fare oggi/questa settimana», «cosa ho in ritardo», «cosa mi sono dimenticato». Per i soldi chiama anche `liquidita_30_giorni`.',
    input_schema: { type:'object', properties: {} }
  },
  {
    name: 'soldi_del_reparto',
    description: 'Dà i conti in soldi del reparto aperto: fatture da incassare, fatture già incassate quest\'anno, fatture in bozza, PREVENTIVI IN ATTESA di risposta e preventivi accettati, lavori finiti e non ancora fatturati, e quanto c\'è da pagare ai fornitori. Ogni voce ha imponibile, IVA e totale. USALO SEMPRE per qualsiasi domanda che riguarda soldi, incassi, fatturato, preventivi o quanto si deve: i numeri non si sommano a mano.',
    input_schema: { type:'object', properties: {} }
  },
  {
    name: 'liquidita_30_giorni',
    description: 'Dà la LIQUIDITÀ dei prossimi 30 giorni del reparto aperto: quanti soldi dovrebbero ENTRARE (fatture emesse e non pagate, divise per scadenza: già scadute, entro 7 giorni, da 8 a 14, da 15 a 30) e quanti dovrebbero USCIRE (fatture dei fornitori da pagare, stessa divisione), più il saldo previsto. USALO per domande come «quanti soldi entrano e escono questo mese», «come sto messo a soldi», «riesco a pagare i fornitori». I conti li fa il gestionale: non sommare a mano.',
    input_schema: { type:'object', properties: {} }
  },
  {
    name: 'cerca_per_nome',
    description: 'Cerca una parola nel nome o nel titolo delle cose di un tipo, dentro il reparto aperto. Usalo quando l\'utente nomina un cliente, un lavoro o un documento.',
    input_schema: { type:'object', properties: { cosa: { type:'string', enum: ELENCO_COSE }, parola: { type:'string' } }, required:['cosa','parola'] }
  },
  {
    name: 'dentro_al_documento',
    description: 'Dà quello che sta DENTRO un documento preciso: le righe di una fattura o di un preventivo, le spese di un lavoro, le voci di un computo. Serve l\'id del documento, che devi aver letto prima con elenco_cose o cerca_per_nome. Usalo per domande come «cosa c\'è dentro la fattura 14» o «quanto è costato quel cantiere».',
    input_schema: {
      type: 'object',
      properties: {
        cosa: { type: 'string', enum: Object.keys(FIGLI) },
        id:   { type: 'string', description: 'l\'id del documento padre, quello vero letto con un altro attrezzo' },
        quanti: { type: 'integer' }
      },
      required: ['cosa', 'id']
    }
  },
  {
    // ⛔ l'unico attrezzo che NON legge niente: vedi costruisciModulo
    name: 'compila_lavoro',
    description: 'Apre nel gestionale il modulo «Nuovo lavoro» GIA\' COMPILATO coi dati che hai capito. Usalo quando ti chiede di segnare, aggiungere o creare un lavoro nuovo. NON salva niente e non scrive niente: l\'utente guarda le caselle e preme Salva lui. Mettici solo quello che ti ha detto davvero.',
    input_schema: {
      type: 'object',
      properties: {
        descrizione: { type:'string', description:'cosa c\'è da fare' },
        dove:        { type:'string', description:'l\'indirizzo o il cantiere' },
        data:        { type:'string', description:'la data prevista, SOLO nella forma AAAA-MM-GG. Se non la sai con certezza, non metterla.' },
        importo:     { type:'string', description:'l\'importo in euro, solo il numero' },
        cliente:     { type:'string', description:'il nome del cliente, scritto come sta nel gestionale' },
        operatore:   { type:'string', description:'il nome di chi ci va' },
        pratica_tipo:       { type:'string', description:'SOLO studio tecnico: CILA, CILAS, SCIA, SCIA alternativa al PdC, Permesso di Costruire, Autorizzazione paesaggistica, Agibilita\', Sanatoria, Accatastamento, Voltura, Altro' },
        pratica_stato:      { type:'string', description:'SOLO studio tecnico: da_preparare, depositata, istruttoria, integrazioni, approvata, archiviata' },
        pratica_comune:     { type:'string', description:'SOLO studio tecnico: il Comune, senza «Comune di»' },
        pratica_protocollo: { type:'string', description:'SOLO studio tecnico: il numero di protocollo, solo se detto o letto' },
        pratica_data_dep:   { type:'string', description:'SOLO studio tecnico: data di deposito AAAA-MM-GG' },
        catasto_foglio:     { type:'string' },
        catasto_particella: { type:'string' },
        catasto_sub:        { type:'string' }
      },
      required: ['descrizione']
    }
  },
  {
    // ⛔ 7 nov 2026 — come compila_lavoro, ma su un lavoro (o pratica) che C'E' GIA'
    name: 'modifica_lavoro',
    description: 'Apre nel gestionale un lavoro (per lo studio: una pratica) CHE ESISTE GIÀ, con dentro SOLO le caselle da cambiare («spostalo a giovedì», «segna il protocollo 4567 sulla CILA di Rossi», «è stata depositata ieri»). Serve l\'id vero del lavoro letto prima con cerca_per_nome o elenco_cose. NON salva: l\'utente guarda e preme Salva lui. Metti solo le caselle che cambiano.',
    input_schema: {
      type: 'object',
      properties: {
        id:          { type:'string', description:'l\'id del lavoro, letto con un attrezzo' },
        descrizione: { type:'string' }, dove: { type:'string' },
        data:        { type:'string', description:'nuova data prevista AAAA-MM-GG' },
        importo:     { type:'string' },
        pratica_tipo: { type:'string' }, pratica_stato: { type:'string' }, pratica_comune: { type:'string' },
        pratica_protocollo: { type:'string' }, pratica_data_dep: { type:'string' },
        catasto_foglio: { type:'string' }, catasto_particella: { type:'string' }, catasto_sub: { type:'string' }
      },
      required: ['id']
    }
  },
  {
    // ⛔ come compila_lavoro: non legge e non scrive niente
    name: 'compila_scadenza',
    description: 'Apre nel gestionale il modulo della scadenza GIA\' COMPILATO. Usalo quando ti chiede di segnare qualcosa che scade: una revisione, un\'assicurazione, una pratica, un pagamento. NON salva niente: l\'utente guarda e preme Salva lui. Il tipo, il mezzo e il cliente li sceglie lui dalle tendine.',
    input_schema: {
      type: 'object',
      properties: {
        titolo: { type:'string', description:'cosa scade' },
        data:   { type:'string', description:'la data, SOLO nella forma AAAA-MM-GG. Se non la sai con certezza, non metterla.' },
        note:   { type:'string', description:'due parole in piu\', se te le ha dette' }
      },
      required: ['titolo']
    }
  },
  {
    // ⛔ come compila_lavoro: non legge e non scrive niente
    name: 'compila_fornitore',
    description: 'Apre nel gestionale il modulo del fornitore nuovo GIA\' COMPILATO. Usalo quando ti chiede di aggiungere un fornitore, anche partendo dai dati letti su una bolla o una fattura che ti ha mandato. NON salva niente: l\'utente guarda e preme Salva lui.',
    input_schema: {
      type: 'object',
      properties: {
        nome:      { type:'string', description:'il nome della ditta' },
        categoria: { type:'string', description:'che roba vende' },
        telefono:  { type:'string' },
        email:     { type:'string' },
        indirizzo: { type:'string', description:'via e numero' },
        piva:      { type:'string', description:'la partita IVA, solo le cifre' }
      },
      required: ['nome']
    }
  },
  {
    // ⛔ come compila_lavoro: non legge e non scrive niente
    name: 'compila_cliente',
    description: 'Apre nel gestionale il modulo del cliente nuovo GIA\' COMPILATO coi dati che hai capito. Usalo quando ti chiede di aggiungere o segnare un cliente nuovo. NON salva niente: l\'utente guarda le caselle e preme Salva lui. Mettici solo quello che ti ha detto davvero.',
    input_schema: {
      type: 'object',
      properties: {
        nome:      { type:'string', description:'il nome del cliente, del condominio o della ditta' },
        indirizzo: { type:'string', description:'via e numero' },
        referente: { type:'string', description:'la persona con cui si parla' },
        telefono:  { type:'string', description:'il numero di telefono' }
      },
      required: ['nome']
    }
  },
  {
    // ⛔ come compila_lavoro: non legge e non scrive niente
    name: 'compila_preventivo',
    description: 'Apre nel gestionale il modulo «Nuovo preventivo» GIÀ COMPILATO con titolo e voci. Usalo quando ti chiede un preventivo. PRIMA guarda i SUOI prezzi con `miei_prezzi` e, se serve, i suoi preventivi vecchi. NON salva niente: l\'utente controlla e preme Salva lui. Il prezzo di una voce lo metti SOLO se lo hai letto fra i suoi prezzi o nei suoi preventivi: altrimenti lo lasci fuori (resta vuoto, lo scrive lui). La quantità la metti solo se te l\'ha detta o si ricava dalle misure che ti ha dato.',
    input_schema: {
      type: 'object',
      properties: {
        titolo: { type:'string', description:'titolo breve, per esempio «Rifacimento bagno 6 mq — Rossi»' },
        voci: {
          type: 'array',
          description: 'le voci di costo, nell\'ordine di lavoro',
          items: {
            type: 'object',
            properties: {
              descrizione:     { type:'string' },
              unita:           { type:'string', description:'mq, ml, cad, ore…' },
              quantita:        { type:'number' },
              prezzo_unitario: { type:'number', description:'euro per unità, SOLO se è un prezzo suo che hai letto' }
            },
            required: ['descrizione']
          }
        }
      },
      required: ['titolo']
    }
  },
  {
    // ⛔ 10 nov 2026 — come compila_preventivo: non scrive niente
    name: 'compila_computo',
    description: 'Prepara delle LAVORAZIONI da AGGIUNGERE a un computo: gli apre la schermata «Controlla le lavorazioni», dove lui guarda riga per riga e preme «Metti dentro». NON scrive niente. Se il computo c\'è già passa il suo `id` vero (letto con cerca_per_nome o elenco_cose su computi); se è nuovo passa `titolo` (nasce solo quando lui conferma). PRIMA cerca i SUOI prezzi con `miei_prezzi`, una parola per lavorazione. Il prezzo lo metti SOLO se l\'hai letto fra i suoi, con la STESSA unità di misura, e in `prezzo_da` scrivi la voce da cui l\'hai preso; altrimenti lascialo fuori. La quantità solo se te l\'ha detta o si ricava dalle sue misure.',
    input_schema: {
      type: 'object',
      properties: {
        id:     { type:'string', description:'l\'id del computo che c\'è già, letto con un attrezzo' },
        titolo: { type:'string', description:'solo per un computo NUOVO' },
        voci: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              descrizione:     { type:'string' },
              unita:           { type:'string', description:'m², m, cad, ore, a corpo…' },
              quantita:        { type:'number' },
              prezzo_unitario: { type:'number', description:'euro per unità, SOLO se è un prezzo suo che hai letto' },
              prezzo_da:       { type:'string', description:'la voce del suo prezzario da cui viene il prezzo, come sta scritta (corta)' }
            },
            required: ['descrizione']
          }
        }
      },
      required: ['voci']
    }
  },
  {
    // ⛔ 10 nov 2026 — i prezzi sulle righe che ci sono gia': non scrive niente
    name: 'prezzi_computo',
    description: 'TERZO PASSO. Gli apre la schermata «Controlla i prezzi» (conferma lui: NON scrive niente). Passa l\'`id` del computo e le tue `scelte`: per ogni riga il suo `n` e la lettera `k` della voce candidata che è la STESSA lavorazione (leggi tutta la descrizione: profondità, spessore, tipo di terreno, altezza; la `variante` della riga e la parte dopo «…:» della candidata devono essere la STESSA cosa — «per ogni cm in più» è un supplemento e non va mai su una lavorazione, e viceversa). ⛔ Una voce di un\'ALTRA lavorazione (scavo aperto per uno scavo obbligato, alberi per una siepe) NON si propone: la riga resta fuori. Se due candidate sono varianti della stessa voce e non sai quale, scegli la più vicina: lui la vede SENZA spunta e decide. Il prezzo non lo scrivi tu: lo prende il gestionale dalla voce scelta. La spunta ce l\'hanno solo le righe trovate per codice di tariffa, che aggiunge da solo il gestionale: chiama questo attrezzo ANCHE con `scelte` vuote se ce ne sono.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type:'string', description:'l\'id vero del computo' },
        scelte: {
          type: 'array',
          items: { type:'object', properties: { n: { type:'integer' }, k: { type:'string' } }, required:['n','k'] }
        }
      },
      required: ['id']
    }
  },
  {
    // 10 nov 2026 — il computo LUNGO del geometra: solo le righe a zero, a pezzi
    name: 'righe_senza_prezzo',
    description: 'PRIMO PASSO per mettere i prezzi a un computo. Legge le lavorazioni ANCORA A ZERO, 20 per volta. Quelle che hanno un codice di tariffa uguale a una voce del SUO prezzario (stessa unità) le sistema DA SOLO il gestionale: tu non le vedi, ti dice solo quante sono (`trovate_per_codice`). Ti torna le ALTRE, ognuna col suo numero `n`, descrizione e unità: per quelle devi cercare tu con `cerca_prezzi`. Dice anche quante ne restano dopo questo pezzo.',
    input_schema: { type:'object', properties: { id: { type:'string', description:'l\'id vero del computo' }, salta: { type:'integer', description:'quante righe a zero saltare dall\'inizio (di solito 0)' } }, required:['id'] }
  },
  {
    // 10 nov 2026 — tante ricerche nel prezzario in un colpo solo
    name: 'cerca_prezzi',
    description: 'SECONDO PASSO. Cerca nel SUO prezzario, in un colpo solo, le righe che ti ha dato `righe_senza_prezzo`: per ognuna dai il suo `n` e in `parola` DUE o TRE parole che la distinguono dalle altre, staccate da uno spazio («scavo obbligata roccia», «intonaco civile», «potatura siepi»): devono esserci TUTTE nella voce. Se la riga ha `variante` (quello che c\'è dopo l\'ultimo «:», per esempio «doccia» o «spessore 4 cm»), una delle parole è quella («adduzione collettore doccia»). Una parola sola è troppo larga. Per ogni riga tornano fino a 5 voci candidate, ognuna con una lettera `k` (a, b, c…), descrizione, unità e prezzo. Poi scegli con `prezzi_computo`.',
    input_schema: {
      type: 'object',
      properties: {
        cerca: { type:'array', items: { type:'object', properties: { n: { type:'integer' }, parola: { type:'string' } }, required:['n','parola'] } }
      },
      required: ['cerca']
    }
  },
  {
    name: 'miei_prezzi',
    description: 'Legge la LISTA DEI PREZZI di chi chiede (quelli che ha salvato lui: voce, unità, prezzo). Usalo prima di fare un preventivo, con una parola della voce («piastrelle», «tinteggiatura»). Senza parola dà quelli che usa di più.',
    input_schema: { type:'object', properties: { parola: { type:'string' } } }
  }
];

/* ⛔ 7 nov 2026 — gli attrezzi sono uguali per tutti: il segno della
   memoria sull'ULTIMO tiene in memoria tutta la lista (e' la regola di
   Anthropic: si mette in memoria tutto quello che viene prima del segno). */
const STRUMENTI_IN_MEMORIA = STRUMENTI.map(function (t, i) {
  return i === STRUMENTI.length - 1 ? Object.assign({}, t, { cache_control: { type: 'ephemeral' } }) : t;
});

/* ---------------------------------------------------------------------
   ⛔ 7 nov 2026 — L'AGENDA: «cosa devo fare oggi» in un giro solo.
   Prima la chat doveva fare 4-5 domande al database (lavori, scadenze…),
   e i promemoria e le richieste dal sito non li vedeva proprio. Ogni pezzo
   passa da costruisciLettura, quindi porta i suoi filtri come tutti.
   Le date le conta il server (giorni_da_oggi), non il modello.
   ⚠️ Un pezzo che non risponde non ferma gli altri: si scrive il suo errore.
   --------------------------------------------------------------------- */
async function agenda(clientDati, uid, reparto, oggi, base) {
  const ieri = giornoPiu(oggi, -1);
  const pezzi = {
    lavori_in_ritardo:     ['lavori',          { escludiStato: 'fatto', al: ieri, prossime: true }],
    lavori_prossimi_14:    ['lavori',          { escludiStato: 'fatto', dal: oggi, al: giornoPiu(oggi, 14), prossime: true }],
    scadenze_scadute:      ['scadenze',        { escludiStato: 'fatta', al: ieri, prossime: true }],
    scadenze_prossime_30:  ['scadenze',        { escludiStato: 'fatta', dal: oggi, al: giornoPiu(oggi, 30), prossime: true }],
    promemoria_da_fare:    ['promemoria',      { escludiStato: 'fatto', al: giornoPiu(oggi, 7), prossime: true }],
    note_calendario_7:     ['note_calendario', { dal: oggi, al: giornoPiu(oggi, 7), prossime: true }],
    richieste_non_aperte:  ['richieste_sito',  { vuoto: 'visto_il', quanti: 10 }]
  };
  /* ⛔ 7 nov 2026 — allo studio tecnico serve sapere quali pratiche sono
     FERME AL COMUNE: integrazioni da mandare (le piu' urgenti) e quelle
     depositate o in istruttoria, dalla piu' vecchia. */
  if (base && base.ruolo === 'professionista') {
    pezzi.pratiche_integrazioni_richieste = ['lavori', { statoPratica: 'integrazioni', prossime: true }];
    pezzi.pratiche_al_comune = ['lavori', { praticheAlComune: true, prossime: true }];
  }
  const nomi = Object.keys(pezzi);
  const esiti = await Promise.all(nomi.map(function (k) {
    const p = pezzi[k];
    const q = costruisciLettura(p[0], uid, reparto, Object.assign({}, base, p[1]));
    return esegui(clientDati, q).then(function (r) {
      if (r.righe) r.righe = segnaGiorni(r.righe, (ATTREZZI[p[0]] || {}).data, oggi);
      if (r.righe && (p[1].statoPratica || p[1].praticheAlComune)) {
        /* per le pratiche conta da quanti giorni sono state DEPOSITATE */
        r.righe = r.righe.map(function (x) {
          const g = segnaGiorni([{ d: x.pratica_data_dep }], 'd', oggi)[0].giorni_da_oggi;
          return g === undefined ? x : Object.assign({}, x, { giorni_dal_deposito: -g });
        });
      }
      return r;
    }, function (e) { return { errore: (e && e.message) || 'non risponde' }; });
  }));
  const fuori = { oggi: oggi };
  nomi.forEach(function (k, i) {
    const r = esiti[i];
    fuori[k] = r.errore ? { errore: r.errore } : r.righe;
    if (r.righe && r.righe.length >= RIGHE_MAX) fuori[k + '_avviso'] = 'ce ne sono almeno ' + RIGHE_MAX + ': il conto e\' parziale';
  });
  return fuori;
}

// ---------------------------------------------------------------------
// ⛔ 30 agosto 2026 — L'ALLEGATO (il «+» della chat)
//
// Una foto della bolla o il PDF della fattura del fornitore, letti da
// Claude invece che ribattuti a mano.
//
// ⛔ QUI NON CI SI FIDA DI NIENTE DI QUELLO CHE ARRIVA DAL BROWSER.
//    Il tipo del file non si prende per buono: o e' uno dei cinque
//    dell'elenco chiuso, o l'allegato si butta. E il peso si controlla
//    qui, non solo di la': la pagina si puo' truccare in tre secondi dal
//    menu degli sviluppatori, questa function no.
// ⚠️ Non si salva da nessuna parte: vive il tempo di un messaggio. Nel
//    registro resta scritto che c'era un allegato, non l'allegato.
// ⚠️ Quanto costa: una foto a 1568 px sono circa 1.600 gettoni, mezzo
//    centesimo. Il tetto vero e' che ne va UNA per messaggio.
// ---------------------------------------------------------------------
const FOTO_BUONE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BASE64_MAX = 4400000;          // ~3 MB di file
const SOLO_BASE64 = /^[A-Za-z0-9+/=\r\n]+$/;

function ripulisciAllegato(a) {
  if (!a || typeof a !== 'object') return null;
  const tipo = String(a.media_type || '').toLowerCase().trim();
  const dati = typeof a.dati === 'string' ? a.dati.replace(/\s+/g, '') : '';
  if (!dati) return { errore: 'L\'allegato e\' arrivato vuoto.' };
  if (dati.length > BASE64_MAX) return { errore: 'L\'allegato e\' troppo pesante: il massimo e\' 3 MB.' };
  if (!SOLO_BASE64.test(dati)) return { errore: 'L\'allegato non e\' arrivato intero. Riprova.' };
  if (FOTO_BUONE.indexOf(tipo) >= 0) {
    return { blocco: { type: 'image', source: { type: 'base64', media_type: tipo, data: dati } }, che: 'una foto' };
  }
  if (tipo === 'application/pdf') {
    return { blocco: { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dati } }, che: 'un PDF' };
  }
  return { errore: 'Questo tipo di file non lo so leggere: vanno bene le foto JPG, PNG, WEBP e i PDF.' };
}

// ---------------------------------------------------------------------
// ⛔ 6 nov 2026 — IL MANUALE DEL GESTIONALE (gestionale-app.html)
// Scritto guardando i pulsanti VERI della pagina, non a memoria.
// Le sezioni per ruolo: lo studio tecnico dice «pratiche» al posto di
// «lavori» e «collaboratori» al posto di «squadra».
// ---------------------------------------------------------------------
const MANUALE_GESTIONALE = `MANUALE DEL GESTIONALE (com'e' fatto davvero: usa SOLO questi nomi)

REPARTI. Il gestionale e' diviso in reparti (per esempio «giardiniere» e «idraulica»): ognuno ha i suoi lavori, clienti, preventivi e fatture. Si entra in un reparto dalla prima schermata col pulsante «Apri». Per cambiare reparto: la freccia in alto a sinistra, accanto al nome del reparto. «Nuovo reparto» sta in fondo alla prima schermata.

IL MENU A SINISTRA (sul telefono si apre col pulsante ☰ in alto a destra). In vista: «Assistente» (la pagina di partenza, con la casella «Cosa facciamo?» e le cose da guardare oggi), «Preventivi», «Computo da prezzare» (o «Computo metrico»), «Lavori e interventi», «Fatture», «Clienti», «Calendario». Tutte le altre voci stanno sotto «Tutto il resto», divise in gruppi: Chat con AI, Giornate, Richieste dal sito, Promemoria, Scadenzario, Agenda operatore; Squadra, Mezzi, Attrezzature; Tasse e fisco, Prezzario, Stati di avanzamento, Fornitori, Carte, Report, Crediti formativi; Galleria, Mappa, Cestino. In fondo, sotto «Aiuto»: «Chiedi una funzione» e «Assistenza diretta». Sul telefono c'e' anche la barra in basso: Oggi, Lavori, il microfono grande al centro, Preventivi, Menu.

LA BARRA IN ALTO (computer): «Dati azienda» (nome, P.IVA, logo, IBAN: vanno compilati PRIMA di fare PDF e fatture), «Commercialista» (gli mandi i documenti), «Salva una copia dei dati», «Scarica per Excel» (stanno sotto «Altro»), «Aiuto» (apre questa chat). Sopra c'e' la ricerca: «Cerca un nome: cliente, lavoro, preventivo, fattura». Sul telefono questi pulsanti stanno in fondo al menu ☰.

PARLA. Il pulsante «Parla» (sul telefono il microfono grande in basso) ascolta: racconti la giornata come viene («oggi Wahid e Luis da Rossi, 8 ore, spesi 45 euro di sabbia, domani chiamare il commercialista») e lui la divide in schede (giornata, spesa, promemoria) da controllare; poi «Salva tutto». Se dici «fammi un preventivo» o «apri le fatture» apre la cosa giusta. Nelle caselle di testo lunghe c'e' anche il microfono piccolo per dettare.

PREVENTIVI. «+ Nuovo preventivo» (a mano) oppure «Genera con AI» (descrivi il lavoro e l'AI prepara le voci, 1 credito). Nel modulo: titolo, cliente, data, le voci di costo («+ Aggiungi voce», «+ Aggiungi capitolo»), aliquota IVA, note; in fondo «Controlla che sia giusto», «Fai controllare anche all'intelligenza artificiale» (1 credito) e «Crea preventivo». Le schede in alto: Tutti, Bozze, Inviati, Accettati, Rifiutati. Ogni preventivo ha il pulsante «Apri» e il menu «...» con: «Invia al cliente» (link, WhatsApp, email, QR: il cliente lo apre senza account e firma col dito), «Scarica PDF», «Lettera d'incarico», «Conferma d'ordine», «Capitolato», «Segna inviato», «Accettato, crea lavoro», «Rifiutato», «Crea la fattura da qui», «Modifica», «Elimina».

FATTURA DA UN PREVENTIVO: Preventivi → «Apri» sul preventivo (o il suo menu «...») → «Crea la fattura da qui». Si apre la fattura con le voci gia' copiate: controlli e salvi.

FATTURE. «+ Nuova fattura» e «Fatture ricevute» (le fatture dei fornitori che arrivano dallo SDI). Schede: Tutte, Bozze, Da incassare, Scadute, Pagate. Nel menu di ogni fattura: «Emetti» (da bozza diventa vera e prende il numero), «Segna pagata», «Non pagata», «Apri», «Crea il PDF», «File per lo SDI (XML)», «Allega un PDF tuo», «Elimina». Una bozza non ha ancora il numero e non conta fra i soldi da incassare.

LAVORI E INTERVENTI. «+ Nuovo lavoro» o «Compila con AI» (lo descrivi e l'AI riempie il modulo). Schede: Tutti, In ritardo, Oggi, Prossimi, Da incassare, Archivio. Ogni lavoro ha «Apri»; dentro ci sono note, foto, spese, ore, e il menu con mappa, WhatsApp, PDF, fattura, elimina. Un preventivo accettato diventa lavoro con «Accettato, crea lavoro».

COMPUTO. «+ Nuovo computo», oppure si carica il computo del geometra (Excel, CSV o PDF) e lo si prezza col proprio prezzario. Dentro il computo le righe si chiamano LAVORAZIONI: «+ Aggiungi lavorazione» (non «Aggiungi voce»), «Carica qui il computo del geometra», «+ Aggiungi capitolo», «€ Prendi i prezzi dal prezzario» (riempie solo le righe a zero, cercando il codice di tariffa), e «Aggiungi con l'AI» (ti porta in questa chat). Dal menu del computo: «Apri il computo», «Scarica il PDF», «Scarica l'analisi dei prezzi», «Crea il preventivo», «Duplica», «Crea la variante», «Elimina». Gli «Stati di avanzamento» (SAL) nascono dentro un computo.

CLIENTI. «+ Privato», «+ Azienda», «+ Condominio», oppure «Compila con AI». Ogni cliente ha la sua scheda con lavori, preventivi, fatture e cosa deve ancora pagare.

GIORNATE. Le giornate di lavoro della squadra (chi, dove, quante ore). Si segnano con «Parla» raccontando la giornata, o dall'app dell'operaio; «PDF del mese» fa il riepilogo del mese in PDF.

CALENDARIO: lavori, scadenze e note giorno per giorno. PROMEMORIA: «+ Nuovo promemoria», le tue cose da ricordare con data; la mattina arriva l'email. SCADENZARIO: «+ Nuova scadenza» per revisioni, assicurazioni, DURC, visite mediche, pratiche. SQUADRA: «+ Persona», con le sue scadenze (visite, corsi). MEZZI: «+ Nuovo mezzo», con scadenze e rifornimenti. FORNITORI: «+ Nuovo fornitore», «Fotografa una fattura» (l'AI la legge), «+ Fattura da pagare». TASSE E FISCO: «Farsi pagare» (chi ti deve soldi e i passi per farsi pagare), «Le tue tasse», «Quanto ti resta», «Chiedi all'AI». GALLERIA: «Carica foto o video» dei lavori. CESTINO: le cose eliminate si recuperano da qui.

CREDITI AI. Ogni mese ci sono crediti AI e messaggi di chat gratis; quelli comprati non scadono. Si vedono e si ricaricano dalla prima schermata (riquadro dei crediti, «Ricarica») e dalla voce «Ricarica crediti». Questa chat usa i messaggi del mese, non i crediti.

AIUTO VERO. «Assistenza diretta» (in fondo al menu): scrivi e risponde una persona, anche con una foto dello schermo. «Chiedi una funzione»: per chiedere una cosa che il gestionale ancora non fa.`;

// ---------------------------------------------------------------------
// le istruzioni della chat
// ⚠️ Le tre materie su cui si ferma le ha decise Alessio il 26 agosto:
//    se Claude sbaglia un'aliquota o una regola di sicurezza, la figura
//    la fa lui, non Claude.
// ---------------------------------------------------------------------
function istruzioniFisse() {
  return [
    'Sei la chat di aiuto dentro il gestionale di TrovaImpresa, usato da imprese edili, artigiani, studi tecnici, negozi di materiali e noleggi.',
    'Rispondi in italiano, corto e pratico, a passaggi numerati quando servono. Chi ti legge non è un tecnico di informatica.',
    // ⛔ 7 nov 2026 — LA LINGUA. Dal registro vero: un'impresa ha scritto in
    //    arabo e la chat ha risposto «non parlo arabo, scrivi in italiano».
    //    Falso, e la perdi. Molti artigiani in Italia sono stranieri.
    'LINGUA: rispondi SEMPRE nella lingua in cui ti scrive (arabo, rumeno, albanese, inglese, spagnolo…), mai «scrivi in italiano». I nomi dei pulsanti restano in italiano fra «», come li vede sullo schermo, con accanto la traduzione fra parentesi.',
    // ⛔ 7 nov 2026 — LE DATE. Dal vivo: «l'unico nei tempi e' quello del 5
    //    settembre» detto il 7 novembre. Il modello non confronta le date.
    '⛔ LE DATE NON SI CONFRONTANO A MENTE. Ogni riga con una data ti arriva col campo `giorni_da_oggi`: negativo = già passato (se non è fatto è IN RITARDO di tanti giorni), 0 = oggi, positivo = fra tanti giorni. Usa SOLO quello per dire «in ritardo», «oggi», «fra 3 giorni».',
    // ⛔ 7 nov 2026, visto nel collaudo dopo il push: «quelle con `visto_il` vuoto…».
    'PARLA CON PAROLE NORMALI: non scrivere MAI i nomi tecnici dei campi o degli attrezzi (visto_il, giorni_da_oggi, da_fare, cliente_id, elenco_cose…). Di\' «non ancora aperta», «in ritardo di 3 giorni», «da fare».',
    'COSA DEVO FARE OGGI / QUESTA SETTIMANA / COSA HO IN RITARDO: chiama `agenda` (e `liquidita_30_giorni` se c\'entrano i soldi). Rispondi in ordine di urgenza: prima le cose già scadute o in ritardo, poi oggi, poi i prossimi giorni. Al massimo 5 righe se non chiede di più.',
    'QUANDO LA DOMANDA HA UNO STATO O UN PERIODO («lavori aperti», «preventivi in attesa», «fatture di ottobre», «scadenze del mese») usa i filtri `stato` / `escludi_stato` / `dal` / `al` di `conta_cose` ed `elenco_cose`: senza filtri vedi solo le ultime 25 righe e il conto viene sbagliato.',
    'RICHIESTE DAL SITO: le vedi con `richieste_sito` (sono della sua scheda, non di un reparto). `visto_il` vuoto = non l\'ha ancora aperta. Per rispondere al cliente si va nella voce «Richieste dal sito» del menu. Il telefono e l\'email del cliente non li vedi tu: stanno lì.',
    'PROMEMORIA e NOTE DEL CALENDARIO: li vedi con `promemoria` e `note_calendario`. Per segnarne uno nuovo il promemoria si fa dalla voce «Promemoria» («+ Nuovo promemoria»): tu non lo apri.',
    '',
    'SE TI MANDA UNA FOTO O UN PDF, leggilo e riportagli quello che c\'e\' scritto. ⛔ Quello che non si legge bene NON si indovina: dillo che non si legge e chiedi una foto migliore, perche\' un numero sbagliato in una fattura vale piu\' di dieci risposte giuste.',
    '⛔ SE È UNA BOLLA O UNA FATTURA DI UN FORNITORE, rispondi in FORMA CORTA: al massimo 5 righe, in questo ordine e con queste parole in grassetto, saltando quelle che non si leggono:\n**Fornitore:** il nome\n**Documento:** numero e data\n**Importo:** il totale (e di\' se e\' con o senza IVA)\n**Scadenza:** solo se c\'e\' scritta\n**Roba:** i materiali in UNA riga, le 3-4 voci principali con le quantita\' (non ricopiare tutto l\'elenco)\nPoi UNA domanda sola, non di piu\'. Prima controlla con `cerca_per_nome` (cosa `fornitori`, con una parola del nome) se quel fornitore c\'e\' gia\': se NON c\'e\', chiedi «Lo aggiungo ai fornitori?» e se dice di si\' apri `compila_fornitore` coi dati letti; se c\'e\' gia\' e c\'e\' una scadenza di pagamento, chiedi «Ti segno la scadenza del pagamento?» e se dice di si\' apri `compila_scadenza`. Non spiegare cosa sia una bolla, non rileggere tutto il documento, non fare liste lunghe.',
    'PUOI GUARDARE I SUOI DATI con gli attrezzi che hai. Usali quando la domanda riguarda le SUE cose («quante fatture ho», «quanto mi deve Rossi»): rispondere a memoria su dati che puoi leggere è un errore.',
    'Gli attrezzi vedono SOLO il reparto aperto. Se ti chiede di un altro reparto, dillo: deve cambiare reparto e richiedere.',
    'PER GUARDARE DENTRO UN DOCUMENTO servono due passi: prima lo trovi con `elenco_cose` o `cerca_per_nome` e ti segni il suo `id`, poi chiami `dentro_al_documento` con quell\'id. Non inventare mai un id: se non l\'hai letto, cercalo.',
    '',
    // ⛔ 6 nov 2026 — IL MANUALE. Prima la chat sapeva leggere i DATI ma non
    //    sapeva com'e' fatto il gestionale: a «come faccio la fattura dal
    //    preventivo?» rispondeva a caso («di solito in alto a destra»).
    //    Chi aggiunge un pulsante o una sezione aggiorna MANUALE_GESTIONALE.
    MANUALE_GESTIONALE,
    '',
    'QUANDO TI CHIEDE COME SI FA UNA COSA, rispondi SOLO con quello che sta nel manuale qui sopra, coi nomi veri dei pulsanti fra «». Se nel manuale non c\'e\', non tirare a indovinare («di solito sta in alto» e\' vietato): di\' che non sei sicuro e metti il segnalino [assistenza].',
    'SE QUALCOSA NON FUNZIONA (un errore, una pagina bianca, un pulsante che non fa niente) la causa non la conosci: non scrivere «di solito e\' perche\'…». Puoi dire UNA cosa da controllare solo se sta nel manuale, e poi metti SEMPRE il segnalino [assistenza].',
    'QUANDO NON SAI, DILLO. Non inventare funzioni che non esistono e non inventare numeri. Se la domanda esce dal gestionale, se non sai rispondere, o se c\'e\' un problema che non riesci a risolvere (un errore, una cosa che non funziona), scrivi una riga e poi il segnalino [assistenza]: diventa il pulsante «Passa la domanda all\'assistenza», che gliela prepara gia\' scritta. Se invece chiede una cosa che il gestionale non fa ancora, digli che puo\' chiederla da «Chiedi una funzione», in fondo al menu sotto «Aiuto».',
    'SE TI RACCONTA LA GIORNATA (chi ha lavorato, dove, quante ore, cosa ha speso, cosa deve ricordarsi), non fare tu le schede: scrivi una riga sola e poi il segnalino [racconto]. Diventa il pulsante «Dividilo in schede», che prende il suo racconto e prepara giornate, spese e promemoria da controllare e salvare.',
    '',
    'FERMATI E DÌ DI CONTROLLARE su tre materie, sempre, anche se sai la risposta:',
    '· soldi e tasse (aliquote IVA, ritenute, regimi) → «questo fattelo confermare dal commercialista»;',
    '· sicurezza e leggi → «verifica, la norma cambia»;',
    '· contratti → «fallo vedere a chi di dovere».',
    'Puoi spiegare come si fa una cosa NEL GESTIONALE anche su questi argomenti: quello che non fai è dire cosa è giusto per legge.',
    '',
    'QUANDO NOMINI UNA COSA PRECISA che hai letto con un attrezzo (un lavoro, un preventivo, una fattura, un cliente), subito dopo il suo nome scrivi il segnalino [apri:TIPO:ID] con l\'id vero che hai letto. TIPO è uno fra: lav (lavoro), prev (preventivo), fatt (fattura), cli (cliente), comp (computo). Il gestionale lo trasforma in un pulsante «Aprilo» che porta l\'utente proprio li\'.',
    'Esempio: «Sostituzione grondaia [apri:lav:1f2e...] vale 8.000,00 €». Il segnalino non si spiega e non si nomina: si scrive e basta.',
    // ⛔ 10 nov 2026 — dal collaudo: «vai in Fatture → scheda Bozze → menu…» sono tre cose da trovare.
    '⛔ QUANDO GLI DICI DOVE ANDARE, PORTACELO: invece di spiegare la strada a parole scrivi il segnalino [vai:SEZIONE] oppure [vai:SEZIONE:SCHEDA], che diventa il pulsante «Vai a…». SEZIONE è una fra: fatture, preventivi, lavori, scadenzario, computi, clienti, calendario, promemoria, dalsito (richieste dal sito), giornate, agenda, squadra, mezzi, attrezzature, fisco (tasse e fisco), prezzario, sal (stati di avanzamento), fornitori, carte, report, galleria, mappa, cestino, assistenza, richieste (chiedi una funzione). SCHEDA solo per: fatture (bozze, incassare, scadute, pagate) · preventivi (bozza, inviato, accettato, rifiutato) · lavori (ritardo, oggi, prossimi, incassare, archivio) · scadenzario (scadute, prossime, fatte). Esempio: «Hai 2 fatture in bozza: aprile ed emettile. [vai:fatture:bozze]». Al massimo 2 pulsanti per risposta, in fondo alla frase a cui servono. Dopo il pulsante di\' in UNA riga cosa premere lì (il nome vero del pulsante fra «»), non tutta la strada. Se la cosa è UNA sola e ne hai l\'id, usa [apri:…] al posto di [vai:…].',
    'Metti il segnalino SOLO su cose che hai davvero letto, con l\'id esatto. Non inventarlo mai: un pulsante che apre la cosa sbagliata è peggio di nessun pulsante.',
    '',
    '⛔ LE ORE NON SI CONTANO A RIGHE. `conta_cose` su `ore` dice quante SEGNATURE ci sono, non quante ore: una segnatura da 8 ore e una da 2 sono due righe e dieci ore. Per rispondere sulle ore prendi l\'elenco con `elenco_cose` e SOMMA la colonna `ore`, poi di\' anche su quante segnature hai fatto il conto. Se le segnature sono piu\' di 25 avvisalo che il conto e\' solo delle ultime 25.',
    'I SOLDI DEL REPARTO nel loro insieme si chiedono SEMPRE a `soldi_del_reparto`, mai sommando a mano le righe che leggi: le somme le fa il gestionale, tu le riporti.',
    '⛔ LIQUIDITÀ A 30 GIORNI («quanti soldi entrano e escono», «come sto messo», «riesco a pagare i fornitori?»): chiama `liquidita_30_giorni` e rispondi con questo schema, righe corte, importi in euro con i punti (1.250,00 €):\n**ENTRANO** (fatture da incassare)\n- già scadute: N fatture, X € ← sono i soldi da rincorrere\n- entro 7 giorni: …\n- da 8 a 14 giorni: …\n- da 15 a 30 giorni: …\n**ESCONO** (fornitori da pagare)\n- già scadute / entro 7 giorni / 8-14 / 15-30, uguale\n**SALDO PREVISTO a 30 giorni**: quello che dice il campo `saldo_previsto_30_giorni` (le scadute NON ci sono dentro, dillo).\nSaltare le righe a zero. Una riga finale di consiglio vera e semplice (per esempio «ti conviene sollecitare le fatture già scadute prima di pagare X»). ⛔ Dì sempre in una riga che sono le SCADENZE scritte nel gestionale, non il conto in banca: i soldi veri in banca non li vedi. Non inventare importi e non sommare a mano. GLI IMPORTI DELLE ENTRATE SONO QUELLI CHE ARRIVANO DAVVERO, al netto di un\'eventuale ritenuta: possono essere più bassi del totale scritto sulla fattura (es. 2.345 € incassati su una fattura da 2.745 € con ritenuta di 400 €). Se parli di una fattura precisa e i due numeri sono diversi, dì in mezza riga «incasso netto, dopo la ritenuta». Se ci sono fatture già scadute, offri di scrivere i solleciti.',
    'QUANTO VALE UN DOCUMENTO PRECISO invece sta in `fatture_totali` e `preventivi_totali`. Si legge la fattura (o il preventivo) e poi il suo totale, e si incrociano per id: `fatture_totali.fattura_id` e\' l\'`id` della fattura, `preventivi_totali.preventivo_id` e\' l\'`id` del preventivo. Lo stesso vale per le ore: `ore.operatore_id` e\' l\'`id` della persona della squadra, `ore.lavoro_id` e\' l\'`id` del lavoro. Gli importi di quelle tabelle NON si sommano a mano se la domanda riguarda tutto il reparto: per quello c\'e\' `soldi_del_reparto`.',
    'Quando dici una cifra, dì SEMPRE tutte e due: il totale con l\'IVA (quello che il cliente bonifica) e, fra parentesi, l\'imponibile. Esempio: «9.760,00 € (8.000,00 € imponibile)». Scelta di Alessio, 29 agosto.',
    'Scrivi i soldi all\'italiana, col punto delle migliaia e la virgola dei centesimi: 8.000,00 €.',
    '⚠️ Una fattura in BOZZA non è un incasso: non contarla fra i soldi che deve avere, e se la nomini di\' che è ancora una bozza.',
    '⚠️ E un PREVENTIVO non è un incasso nemmeno se è accettato: è lavoro che deve ancora diventare fattura. Tienilo separato dai soldi che deve avere.',
    '',
    'PUOI APRIRGLI UN MODULO GIÀ PIENO. Se ti chiede di segnare, aggiungere o creare un LAVORO nuovo, usa `compila_lavoro`: il gestionale gli apre il modulo del Lavoro con dentro quello che hai capito, e a salvarlo è lui col pulsante Salva.',
    '⛔ Nel modulo ci metti SOLO quello che ti ha detto davvero. Quello che non sai si lascia vuoto, non si inventa: un modulo con dentro una data o un importo inventati è peggio di un modulo mezzo vuoto, perché uno lo salva senza guardare.',
    'La data va scritta AAAA-MM-GG, se no la casella la rifiuta senza dire niente. Se non sei sicuro di che giorno intende, lascia fuori la data e chiediglielo.',
    'Dopo che l\'hai aperto, scrivi UNA riga sola per dire cosa ci hai messo: il modulo ce l\'ha davanti, non serve rileggerglielo tutto.',
    'E se ti chiede di aggiungere un CLIENTE nuovo, uguale, con `compila_cliente`.',
    'E se ti chiede di segnare una SCADENZA (una revisione, un\'assicurazione, un pagamento) usa `compila_scadenza`; per un FORNITORE nuovo `compila_fornitore` — anche coi dati che hai appena letto su una bolla che ti ha mandato.',
    'SE TI CHIEDE UN PREVENTIVO: 1) cerca i SUOI prezzi con `miei_prezzi` (una parola per ogni lavoro: «piastrelle», «demolizione»…); 2) se ha già fatto un preventivo simile, guardalo (`cerca_per_nome` su preventivi, poi `dentro_al_documento`) e usa quei prezzi; 3) apri il modulo con `compila_preventivo`. ⛔ I PREZZI NON SI INVENTANO: se una voce non ha un prezzo suo, lasciala SENZA prezzo e diglielo in una riga («per X e Y non ho un tuo prezzo, mettili tu»). ⛔ Le misure non si inventano: se mancano (quanti mq?) chiedile PRIMA di aprire il modulo. Dopo averlo aperto scrivi poche righe: quante voci, quali prezzi hai preso dai SUOI e quali mancano. Non salvi niente: salva lui.',
    'SE TI CHIEDE DI METTERE LAVORAZIONI IN UN COMPUTO («nel computo di Rossi aggiungi…», «fammi un computo per…»): 1) se il computo c\'è già trovalo con `cerca_per_nome` su computi; 2) cerca i SUOI prezzi con `miei_prezzi`, una parola per lavorazione (falle tutte insieme); 3) chiama `compila_computo`. ⛔ Fallo SUBITO con quello che sai: una riga senza prezzo o senza quantità entra lo stesso e la completa lui nella schermata di controllo. NON fermarti a fare domande prima; le cose che mancano dille DOPO, in una riga («per la siepe non ho un tuo prezzo al metro: mettilo tu»). ⛔ I prezzi non si inventano e un prezzo con un\'altra unità di misura (al m² su una riga in metri) non si usa.',
    'SE TI CHIEDE DI METTERE I PREZZI A UN COMPUTO CHE HA GIÀ LE RIGHE (il computo del geometra), TRE PASSI e basta: 1) trova il computo con `cerca_per_nome` su computi; 2) `righe_senza_prezzo`: le righe col codice di tariffa uguale le sistema da solo il gestionale; per quelle in `da_cercare` fai UNA chiamata a `cerca_prezzi` con una parola per riga; 3) `prezzi_computo` con le tue scelte (n + lettera). Se `da_cercare` è vuoto salta la ricerca e chiama subito `prezzi_computo`. ⛔ UN PEZZO PER MESSAGGIO (20 righe). Dopo, DUE righe (di quanti messaggi vale NON parlare: lo scrive il gestionale): quanti prezzi proposti (quanti per codice con la spunta, quanti per descrizione SENZA spunta da guardare uno per uno), e se `restano_dopo_queste` è più di zero: «Ne restano N: conferma questi e premi di nuovo "Metti i prezzi con l\'AI"».',
    'Dopo `compila_computo` o `prezzi_computo` scrivi DUE righe al massimo: quante righe, quanti prezzi presi dai SUOI, cosa manca. Non rileggergli l\'elenco: ce l\'ha davanti.',
    'COME SCRIVI: testo semplice. Niente righe di trattini (---), niente titoli col cancelletto (#), niente tabelle. Il grassetto solo per i numeri e i nomi che contano.',
    'SE CHIEDE QUALE documento ha dentro qualcosa («quale computo ha le lavorazioni», «in quale preventivo ho messo il ponteggio») NON elencarli tutti chiedendo quale: guarda dentro con `dentro_al_documento` (anche più documenti nello stesso giro) e rispondi tu.',
    '⛔ NON RACCONTARE COSA STAI FACENDO: niente «Cerco prima i tuoi prezzi…», «Ora guardo il computo…». Usa gli attrezzi in silenzio e scrivi solo la risposta finale.',
    'Sai aprire questi moduli e basta: lavoro, cliente, scadenza, fornitore, preventivo, e la schermata di controllo del computo.',
    'SE TI CHIEDE DI CAMBIARE UN LAVORO CHE C\'È GIÀ («spostalo a giovedì», «metti l\'importo a 800», «è finito», «segna il protocollo»): trovalo con `cerca_per_nome` (o `elenco_cose`), poi `modifica_lavoro` col suo id e SOLO le caselle che cambiano. Non aprire un lavoro nuovo al posto di uno che esiste. Se ne trovi più di uno che può essere quello, chiedi quale.',
    'Quando nel modulo ci metti il nome di un cliente o di una persona della squadra, scrivilo COME STA NEL GESTIONALE, non come lo scriveresti tu: se non sei sicuro di come e\' scritto, cercalo prima con `cerca_per_nome`. Un nome «sistemato» non si attacca a nessuno.',
    '',
    '',
    // ⛔ 8 ottobre 2026 — I SOLLECITI E I PULSANTI A UN TOCCO (gradini 1 e 2)
    'SE TI CHIEDE UN SOLLECITO (un messaggio a chi non ha ancora pagato): prima leggi la fattura con gli attrezzi (deve essere EMESSA, non bozza e non già pagata) e il cliente. Poi scrivi UN messaggio gentile da mandare al cliente, in italiano semplice, dandogli del lei, e mettilo TUTTO fra virgolette basse «così». Scrivi in prima persona SINGOLARE, come parla chi lavora da solo: «le ricordo», «mi scusi», mai «ricordiamo» o «La prego». Aprilo con «Buongiorno» e il nome del cliente, non con «Gentile Cliente». Dentro il messaggio: il numero della fattura, il TOTALE da pagare (con l\'IVA, senza l\'imponibile: al cliente interessa quanto deve bonificare), la data della fattura, una riga che dice «se ha già pagato mi scusi e ignori questo messaggio», e un ringraziamento. ⛔ NON inventare date di scadenza, IBAN, penali o minacce: se non lo sai, non lo scrivi. Non firmare con nessun nome: lo aggiunge lui.',
    'Subito DOPO il messaggio scrivi il segnalino [wa:ID_CLIENTE] con l\'id del cliente, quello vero, preso da `cliente_id` della fattura o da `clienti`. Il gestionale lo trasforma nel pulsante «Manda su WhatsApp»: il messaggio lo prende da quello che hai messo fra «». Un solo messaggio fra «» per risposta, e solo per i solleciti: per le altre cose non usare le virgolette basse.',
    'PULSANTE «SEGNA COME PAGATA»: quando nomini una fattura EMESSA e non ancora pagata, o quando ti dice che una fattura è stata pagata, scrivi dopo il suo nome il segnalino [pagata:ID_FATTURA] con l\'id vero letto con gli attrezzi. Diventa un pulsante: a premerlo è lui, tu non segni niente. ⛔ Mai su una fattura in bozza, già pagata o annullata. Se ti dice «ha pagato, segnala pagata», NON dire «fatto»: di\' che sotto trovi il pulsante da premere.',
    '',
    'Nel database non scrivi e non cambi mai niente: tu leggi, spieghi, e al massimo gli apri un modulo già pieno o gli metti un pulsante da premere. A salvare è sempre lui.'
  ].join('\n');
}


/* ⛔ 7 nov 2026 — LE ISTRUZIONI DIVISE IN DUE.
   La parte FISSA (regole + manuale, ~6.000 gettoni) e' uguale per tutti e si
   tiene in memoria da Anthropic (cache): prima la si pagava piena a OGNI
   giro, fino a 6 giri per domanda — misurato 12.900 gettoni di media a
   domanda, 0,042 $. La parte DEL GIORNO (reparto, sezione, calendario,
   parole del ruolo) cambia e va dopo, fuori dalla memoria. */
const PAROLE_RUOLO = {
  professionista: 'QUESTO ISCRITTO È UNO STUDIO TECNICO (geometra, ingegnere, architetto). Nel SUO gestionale le parole sono diverse dal manuale: usa SOLO le sue, senza dire che sono al posto di altre: «Pratiche» al posto di «Lavori e interventi», «+ Nuova pratica» al posto di «+ Nuovo lavoro», «Collaboratori» al posto di «Squadra», «Strumenti» al posto di «Attrezzature», «Computo metrico» (non «da prezzare»); in più ha «Crediti formativi». NON ha «Mezzi» né «Carte»: non mandarlo lì. Dentro il modulo della pratica c\'è il riquadro «Dati della pratica»: «Tipo di pratica» (CILA, CILAS, SCIA, Permesso di costruire, paesaggistica, agibilità, sanatoria, accatastamento, voltura), «A che punto sta» (da preparare, depositata, in istruttoria, integrazioni richieste, approvata, archiviata), «Comune», «N. protocollo», «Data di deposito», «Dati catastali». Il protocollo del Comune va LÌ, non nelle note e non nello Scadenzario. Le pratiche lette con gli attrezzi hanno anche pratica_tipo, pratica_stato, pratica_comune, pratica_protocollo, pratica_data_dep. Il suo preventivo ha il riquadro della parcella (compenso, cassa, spese, IVA, ritenuta) e il PDF esce come PARCELLA. Con lo studio parla di pratiche, incarichi e onorari, non di cantieri. COMPILARE LE PRATICHE PER LUI: quando ti dice una pratica nuova («CILA bagno Rossi via Roma 3 Rieti») usa `compila_lavoro` riempiendo ANCHE pratica_tipo, pratica_stato, pratica_comune, pratica_protocollo, pratica_data_dep e i dati catastali che ti ha detto; quando ti dice una novità su una pratica che c\'è («la CILA di Rossi è stata protocollata ieri, prot. 4567», «il Comune ha chiesto le integrazioni») usa `modifica_lavoro`. Se ti manda con il «+» la foto o il PDF della ricevuta di deposito, della visura catastale o della lettera del Comune, leggila e riempi le caselle da lì: protocollo, foglio, particella e subalterno SOLO se si leggono bene, mai indovinati. Per «cosa ho fermo al Comune», «quali pratiche aspettano» usa `agenda` (pratiche_integrazioni_richieste e pratiche_al_comune, con giorni_dal_deposito) o `elenco_cose` su lavori con `stato_pratica`. Le integrazioni richieste sono la cosa più urgente: dillo per prime. Quando metti una pratica a «integrazioni», digli in una riga che al Salva il gestionale gli propone la scadenza a 30 giorni (se il Comune gli ha dato un\'altra data, la cambia dallo Scadenzario).',
  artigiano: 'QUESTO ISCRITTO È UN ARTIGIANO: nel suo menu la voce si chiama «Lavori e interventi» e il computo «Computo da prezzare».',
  impresa: 'QUESTO ISCRITTO È UN\'IMPRESA: nel suo menu la voce si chiama «Lavori» e il computo «Computo da prezzare».'
};
function istruzioniDelGiorno(sezione, nomeReparto, oggi, ruolo) {
  return [
    'Stai guardando il reparto «' + (nomeReparto || 'quello aperto') + '»' + (sezione ? ', sezione «' + sezione + '»' : '') + '.',
    // ⛔ IL CALENDARIO GIA' SCRITTO: vedi la nota sopra calendarioProssimo.
    //    Il primo della fila e' oggi. Il conto non lo fa lui: legge.
    'IL CALENDARIO, così non devi contare. Oggi è il primo della fila: ' + calendarioProssimo(oggi, 14) + '.',
    '⛔ La data del modulo PRENDILA DA QUESTA FILA, copiando il pezzo dopo l\'uguale. Non contarla a mente: sbaglieresti il giorno della settimana. Se ti chiede una data più in là della fila, conta di sette in sette partendo da una riga della fila.',
    PAROLE_RUOLO[ruolo] || PAROLE_RUOLO.impresa
  ].join('\n');
}
function istruzioni(sezione, nomeReparto, oggi, ruolo) {
  return istruzioniFisse() + '\n\n' + istruzioniDelGiorno(sezione, nomeReparto, oggi, ruolo);
}
/* i due pezzi come li vuole Anthropic: il primo con la memoria accesa */
function sistemaPerClaude(sezione, nomeReparto, oggi, ruolo) {
  return [
    { type: 'text', text: istruzioniFisse(), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: istruzioniDelGiorno(sezione, nomeReparto, oggi, ruolo) }
  ];
}

// ---------------------------------------------------------------------
// =====================================================================
// ⛔ 30 agosto 2026 — UN GIRO CON CLAUDE, ASCOLTATO MENTRE PARLA
//
// Prima si mandava la domanda e si aspettava il pacco intero: 5-10
// secondi con lo schermo fermo, e sembrava bloccata. Adesso si chiede
// `stream: true` e le parole arrivano una alla volta: ogni pezzo di
// testo viene passato a `manda`, che lo spedisce subito al browser.
//
// ⚠️ Quello che NON cambia: gli attrezzi, i filtri, i crediti e il
//    registro restano identici. Qui si cambia solo COME arriva il testo.
// ⚠️ I pezzi di un attrezzo (`input_json_delta`) arrivano spezzettati e
//    si rimettono insieme alla fine del blocco: prima di `content_block_stop`
//    quel JSON e' monco e non si puo' leggere.
// ⚠️ Il tetto di tempo vale SOLO sull'aggancio, non su tutto il flusso:
//    se no una risposta lunga verrebbe tagliata a meta' dall'orologio.
// =====================================================================
async function unGiro(corpo, manda) {
  const r = await conTempo(fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(Object.assign({ stream: true }, corpo))
  }), TEMPO_CLAUDE, 'claude');

  if (!r.ok) {
    let messaggio = 'Anthropic HTTP ' + r.status;
    try { const d = await r.json(); if (d && d.error && d.error.message) messaggio = d.error.message; } catch (e) {}
    return { errore: messaggio, blocchi: [], tin: 0, tout: 0, cw: 0, cr: 0, testo: '' };
  }

  const lettore = r.body.getReader();
  const dec = new TextDecoder();
  let resto = '', tin = 0, tout = 0, cw = 0, cr = 0, testo = '', errore = null;
  const blocchi = [], mezziAttrezzi = {};

  const evento = function (riga) {
    let o; try { o = JSON.parse(riga); } catch (e) { return; }
    if (o.type === 'message_start') {
      const u = (o.message && o.message.usage) || {};
      tin += u.input_tokens || 0;
      /* ⛔ 7 nov 2026 — con la memoria (cache) accesa una parte dell'ingresso
         arriva contata a parte: scritta in memoria (costa 1,25 volte) o
         letta dalla memoria (costa un decimo). Senza contarle il registro
         dei soldi direbbe un costo piu' basso del vero. */
      cw  += u.cache_creation_input_tokens || 0;
      cr  += u.cache_read_input_tokens || 0;
      return;
    }
    if (o.type === 'content_block_start') {
      const b = o.content_block || {};
      if (b.type === 'text') blocchi[o.index] = { type: 'text', text: '' };
      else if (b.type === 'tool_use') { blocchi[o.index] = { type: 'tool_use', id: b.id, name: b.name, input: {} }; mezziAttrezzi[o.index] = ''; }
      else blocchi[o.index] = b;
      return;
    }
    if (o.type === 'content_block_delta') {
      const d = o.delta || {};
      if (d.type === 'text_delta') {
        const b = blocchi[o.index]; if (b && typeof b.text === 'string') b.text += d.text;
        testo += d.text;
        manda({ pezzo: d.text });
      } else if (d.type === 'input_json_delta') {
        mezziAttrezzi[o.index] = (mezziAttrezzi[o.index] || '') + (d.partial_json || '');
      }
      return;
    }
    if (o.type === 'content_block_stop') {
      const b = blocchi[o.index];
      if (b && b.type === 'tool_use') {
        try { b.input = mezziAttrezzi[o.index] ? JSON.parse(mezziAttrezzi[o.index]) : {}; }
        catch (e) { b.input = {}; }
      }
      return;
    }
    if (o.type === 'message_delta') { tout += (o.usage && o.usage.output_tokens) || 0; return; }
    if (o.type === 'error') { errore = (o.error && o.error.message) || 'Anthropic ha risposto con un errore.'; return; }
  };

  while (true) {
    const p = await lettore.read();
    if (p.done) break;
    resto += dec.decode(p.value, { stream: true });
    const righe = resto.split('\n');
    resto = righe.pop();
    for (const riga of righe) {
      if (riga.indexOf('data:') !== 0) continue;
      evento(riga.slice(5).trim());
    }
  }
  return { errore: errore, blocchi: blocchi.filter(Boolean), tin: tin, tout: tout, cw: cw, cr: cr, testo: testo.trim() };
}

// ---------------------------------------------------------------------
/* ⛔ 30 agosto 2026 — QUESTO FILE E' NEL FORMATO NUOVO DI NETLIFY (.mjs).
   Il formato vecchio (`exports.handler`) NON sa mandare la risposta a
   pezzi: puo' solo consegnare tutto insieme alla fine. Per far comparire
   le parole mentre Claude le scrive serve questo, che risponde con un
   flusso.
   ⛔ IL FILE VECCHIO `chat-gestionale.js` VA CANCELLATO: due file con lo
   stesso nome sullo stesso indirizzo e Netlify ne sceglie uno a caso. */
const rispondi = (codice, corpo) => new Response(JSON.stringify(corpo), {
  status: codice,
  headers: { 'Content-Type': 'application/json' }
});

function conTempo(promessa, ms, etichetta) {
  let t;
  const scaduta = new Promise((_, rifiuta) => {
    t = setTimeout(() => rifiuta(new Error('tempo scaduto: ' + etichetta)), ms);
    if (t && typeof t.unref === 'function') t.unref();
  });
  return Promise.race([promessa, scaduta]).finally(() => clearTimeout(t));
}

export default async function (req) {
  if (req.method !== 'POST') return rispondi(405, { error: 'Method Not Allowed' });

  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY;
  // ⚠️ la chiave `anon` NON e' un segreto: sta gia' scritta dentro
  //    js/gate-gestionale.js, che il browser scarica. Il ripiego e'
  //    copiato da netlify/functions/sitemap-offerte.js, cosi' la function
  //    parte anche se su Netlify la variabile non c'e' ancora.
  const ANON_KEY = (process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.startsWith('eyJ'))
    ? process.env.SUPABASE_ANON_KEY
    : 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return rispondi(500, { error: 'Configurazione server mancante.' });
  }

  /* l'ora in cui la domanda e' arrivata: si segna adesso e si scrive
     tale e quale nel registro, cosi' la domanda risulta sempre PRIMA
     della risposta (vedi la nota al punto 6). */
  const oraDomanda = new Date().toISOString();

  let domanda, conversazione_id, mestiere_id, sezione, allegato, ruoloDetto;
  try {
    ({ domanda, conversazione_id, mestiere_id, sezione, allegato, ruolo: ruoloDetto } = JSON.parse((await req.text()) || '{}'));
  } catch { return rispondi(400, { error: 'Body JSON non valido.' }); }
  if (!domanda || !String(domanda).trim()) return rispondi(400, { error: 'La domanda è vuota.' });
  if (!conversazione_id || !mestiere_id)   return rispondi(400, { error: 'Parametri mancanti.' });
  domanda = String(domanda).slice(0, 2000);

  /* ⛔ l'allegato si controlla QUI, prima di tutto il resto: se e' sbagliato
     l'iscritto non deve pagarlo. Piu' avanti il messaggio e' gia' scalato. */
  let pezzoAllegato = null, cheAllegato = '';
  if (allegato) {
    const c = ripulisciAllegato(allegato);
    if (!c || c.errore) return rispondi(400, { error: (c && c.errore) || 'Allegato non valido.' });
    pezzoAllegato = c.blocco;
    cheAllegato = c.che;
  }

  const autorizzazione = req.headers.get('authorization') || '';
  const token = autorizzazione.startsWith('Bearer ') ? autorizzazione.slice(7).trim() : '';
  if (!token) return rispondi(401, { error: 'Devi essere collegato. Rientra e riprova.' });

  const server = createClient(SUPABASE_URL, SERVICE_KEY);

  // ---- 1. CHI STA CHIAMANDO (dal gettone, mai dal messaggio) ---------
  let uid = null;
  try {
    const { data: chi, error: err } = await conTempo(server.auth.getUser(token), TEMPO_ACCESSO, 'getUser');
    if (!err && chi && chi.user && chi.user.id) uid = chi.user.id;
  } catch (e) { console.error('[chat] accesso non verificato:', e && e.message); }
  if (!uid) return rispondi(401, { error: 'Sessione non valida. Rientra e riprova.' });

  // ---- 2. il client dei DATI: col gettone suo, RLS accesa ------------
  // ⛔ vedi la regola 3 in cima: i dati NON si leggono col service role.
  const dati = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: 'Bearer ' + token } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // ---- 3. il reparto e' suo? ----------------------------------------
  // letto col client dei dati: se non e' suo, la RLS non lo fa vedere e
  // qui non arriva niente.
  let nomeReparto = null;
  /* ⛔ 7 nov 2026 — CHI E' (impresa, artigiano, studio tecnico) e qual e' la
     sua scheda. Letto col gettone suo, mai preso dal browser per la scheda.
     Il ruolo serve solo alle PAROLE (pratiche/lavori): quello che dice il
     browser vale solo se e' uno dei tre, se no si usa il database.
     ⚠️ Se la lettura non va, la chat va avanti lo stesso: senza la scheda
        non vede le richieste dal sito, e basta. */
  let impresaId = null, ruolo = 'impresa';
  const promessaScheda = conTempo(
    dati.from('imprese').select('id,tipo').eq('user_id', uid).limit(1),
    TEMPO_ACCESSO, 'scheda').then(function (r) {
      if (r && !r.error && r.data && r.data[0]) {
        impresaId = r.data[0].id;
        if (['impresa', 'artigiano', 'professionista'].indexOf(r.data[0].tipo) >= 0) ruolo = r.data[0].tipo;
      }
    }, function () {});
  try {
    const r = await conTempo(
      dati.from('gest_mestieri').select('id,nome').eq('id', mestiere_id).eq('user_id', uid).maybeSingle(),
      TEMPO_ACCESSO, 'reparto');
    if (r && !r.error && r.data) nomeReparto = r.data.nome || null;
    else return rispondi(403, { error: 'Questo reparto non è tuo.' });
  } catch (e) { return rispondi(403, { error: 'Non riesco a verificare il reparto. Riprova.' }); }
  await promessaScheda;
  if (['impresa', 'artigiano', 'professionista'].indexOf(ruoloDetto) >= 0) ruolo = ruoloDetto;

  // ---- 4. ha il Gestionale AI? e quanti messaggi gli restano? ------------------
  let stato = null;
  {
    const r = await chiamaRpc(server, 'chat_stato', { p_user: uid });
    if (r.errore) console.error('[chat] chat_stato:', r.errore);
    else if (r.dati && r.dati.length) stato = r.dati[0];
  }
  if (!stato) return rispondi(503, { error: 'Non riesco a controllare il tuo piano. Riprova fra poco.' });
  if (!stato.ha_pro) {
    // ⛔ 30 agosto 2026 — L'ASSAGGIO FINITO NON E' «NON CE L'HAI».
    // Chi non ha il Gestionale AI ha 10 messaggi in tutto per capire se gli
    // serve. Quando finiscono la frase deve dirgli cosa ha appena usato e
    // cosa comprerebbe, non un secco «non e' nel tuo piano».
    return rispondi(403, {
      error: stato.assaggio
        ? 'Hai finito i ' + stato.compresi + ' messaggi di prova della Chat con AI. '
          + 'Con il Gestionale AI ne hai 300 al mese.'
        : 'La Chat con AI è nel Gestionale AI.',
      serve_pro: true,
      assaggio_finito: !!stato.assaggio
    });
  }

  // ---- 5. chi paga questo messaggio ---------------------------------
  // ⚠️ il numero dei compresi NON sta qui: lo dice chat_stato, e sta
  //    scritto in un posto solo (dentro la funzione su Supabase).
  // ⛔ `consume_ai_credit` si prende chi chiama da `auth.uid()`, quindi va
  //    chiamata col client dell'ISCRITTO. Col service role `auth.uid()` e'
  //    vuoto e risponde 'unauthenticated': il credito non si scalerebbe e
  //    la chat sarebbe gratis. Letto nella funzione vera su Supabase il
  //    29 agosto, non a memoria.
  /* ⛔ 14 SETTEMBRE 2026 — LA CHAT NON MANGIA PIU' I CREDITI DELL'ASSISTENZA.
     Prima qui c'era `consume_ai_credit('chat')`, che si prendeva i crediti
     MENSILI (40 del Gestionale, 100 del Gestionale AI) e poi quelli comprati.
     Ma quei crediti sono dell'ASSISTENZA — «Compila con AI» e «Genera con AI».
     Uno chiacchierava, passava i 300 senza accorgersene, e poi trovava
     l'assistenza a secco senza capire perche'. I «300 messaggi» del listino
     in realta' erano 400.
     Adesso sono due portafogli separati: `consume_chat_message` tocca SOLO
     `ai_accounts.chat_extra`, i messaggi comprati a parte.
     ⚠️ Il conto si fa su `compresi_restanti`, NON su `restanti`: `restanti`
        comprende gia' i messaggi comprati, quindi guardando quello non si
        scalerebbero mai e chi ha pagato un pacchetto chiacchiererebbe gratis. */
  let comePagato = 'compreso';
  let scontrino = null;   // il log_id, per rimborsare se Claude non risponde
  if ((stato.compresi_restanti || 0) <= 0) {
    const c = await chiamaRpc(dati, 'consume_chat_message', {});
    const esito = (c && !c.errore && c.dati) || null;
    if (!esito || esito.ok !== true) {
      return rispondi(402, {
        error: stato.assaggio
          ? 'Hai finito i ' + stato.compresi + ' messaggi di prova della Chat con AI.'
          : 'Hai finito i ' + stato.compresi + ' messaggi compresi di questo mese.'
            + ' Il primo del mese tornano. Se ti servono adesso puoi comprarne altri.',
        serve_messaggi: true,
        motivo: (esito && esito.reason) || 'no_chat_messages'
      });
    }
    comePagato = 'comprato';
    scontrino = esito.log_id || null;
  }

  // ---- 6. la chiacchierata di prima ---------------------------------
  let storia = [];
  try {
    /* ⛔ 30 agosto 2026 (sera) — IL DIFETTO PIU' GROSSO TROVATO DAL VIVO.
       Domanda e risposta si scrivevano con UN SOLO insert, quindi tutte e
       due le righe prendevano lo stesso `created_at` al millesimo. Con gli
       orari uguali Postgres restituisce le due righe nell'ordine che gli
       pare: meta' delle volte la storia arrivava con la RISPOSTA prima
       della DOMANDA. Claude vedeva due domande di fila senza risposta in
       mezzo e rispondeva anche a quella di prima — a schermo, dal secondo
       messaggio in poi, ogni risposta si portava dietro quella vecchia.
       Due rimedi, tutti e due necessari:
       1) qui: a parita' di orario si mette 'ai' prima di 'utente' (siamo
          in ordine decrescente, poi si gira), cosi' l'ordine e' sempre
          domanda → risposta anche per le chat vecchie gia' salvate;
       2) al momento di scrivere: due orari diversi (vedi punto 8). */
    const r = await server.from('gest_chat_messaggi')
      .select('ruolo,testo')
      .eq('user_id', uid).eq('conversazione_id', conversazione_id)
      .order('created_at', { ascending: false })
      .order('ruolo', { ascending: true })
      .limit(STORIA_MAX);
    if (!r.error && r.data) storia = r.data.reverse()
      .filter(function(m) { return m.testo; })
      .map(function(m) { return { role: m.ruolo === 'ai' ? 'assistant' : 'user', content: m.testo }; });
  } catch (e) { console.error('[chat] storia:', e && e.message); }

  // ---- 7. il giro con Claude ----------------------------------------
  /* ⛔ con l'allegato il messaggio non e' piu' una riga di testo ma un
     elenco di pezzi: prima la foto, poi la domanda. L'ordine conta —
     Claude legge meglio se guarda l'immagine e poi sente cosa gli chiedi. */
  const messaggi = storia.concat([{
    role: 'user',
    content: pezzoAllegato ? [pezzoAllegato, { type: 'text', text: domanda }] : domanda
  }]);
  let risposta = '', tin = 0, tout = 0, cw = 0, cr = 0, errore = null;

  /* ⛔ IL MODULO DA APRIRE (gradino 3). Resta `null` per tutti i messaggi
     che sono solo domande: solo `compila_lavoro` lo riempie, e ne passa
     UNO SOLO — due moduli aperti insieme sono due finestre sovrapposte. */
  let modulo = null;
  /* 10 nov 2026 — il computo che sta prezzando in QUESTO messaggio: le righe
     lette (n → id), le voci candidate (n → lettera → prezzo) e quelle
     trovate per codice. Vive il tempo di un messaggio. */
  let memoC = null;
  let prezziFatti = null;   /* 10 nov 2026: i prezzi sono pronti, la chiusura la scrive il server */
  const T0 = Date.now();     /* quando e' partita la risposta: Netlify la taglia a 30 s */
  let tempoScaduto = false;
  /* vero quando il modulo aperto ha un nome che non esiste: solo allora
     Claude puo' rifarlo una volta, col nome giusto */
  let daSistemare = false;

  /* ⚠️ L'OROLOGIO DEL SERVER E' A GREENWICH. Alle 00:30 di Roma li' e'
     ancora ieri: senza il fuso, «segnamelo domani» finirebbe un giorno
     prima. E 'sv-SE' e' la lingua che scrive le date proprio nella forma
     che vuole la casella del gestionale: AAAA-MM-GG. */
  let oggi = '';
  try { oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); }
  catch (e) { oggi = new Date().toISOString().slice(0, 10); }

  // ---- 7b. LA RISPOSTA ESCE MENTRE LA SCRIVE ------------------------
  // ⛔ Da qui in poi si risponde con un FLUSSO, non con un pacco. Ogni riga
  //    e' un pezzetto di JSON che finisce con un a capo:
  //      {"pezzo":"...testo..."}      → una manciata di parole appena scritte
  //      {"fine":true, ...}           → l'ultima riga: quanto resta, il modulo,
  //                                     e l'errore se non e' andata
  // ⚠️ I controlli d'accesso, il piano e i crediti sono TUTTI gia' passati
  //    qui sopra, e rispondono ancora col codice giusto (401, 402, 403).
  //    Il flusso parte solo quando e' tutto a posto: cosi' il browser vecchio
  //    che non capisce il flusso vede comunque gli errori come prima.
  const codifica = new TextEncoder();
  const flusso = new ReadableStream({
    async start(controller) {
      let chiuso = false;
      const manda = function (o) {
        if (chiuso) return;
        try { controller.enqueue(codifica.encode(JSON.stringify(o) + '\n')); }
        catch (e) { chiuso = true; }   /* se ha chiuso la pagina, si smette e basta */
      };

      /* ⛔ 6 nov 2026 — fra un giro e l'altro (prima «fammi cercare…», poi
         la risposta) a schermo le frasi uscivano attaccate: «…della
         siepe:Ecco i passaggi». Nel database c'era gia' l'a capo; qui si
         manda anche a schermo, una volta sola, prima del primo pezzo. */
      const giroManda = function (dopoTesto) {
        let primo = dopoTesto;
        return function (o) {
          if (primo && o && typeof o.pezzo === 'string') { primo = false; manda({ pezzo: '\n\n' }); }
          manda(o);
        };
      };

      try {
        for (let giro = 0; giro < GIRI_MAX; giro++) {
          const g = await unGiro({
            model: 'claude-sonnet-4-5',
            // ⛔ 30 agosto 2026 — LA RISPOSTA NON SI TAGLIA PIU' A META'.
            //    Era 1500, cioe' poco piu' di una pagina. Alzare il tetto NON
            //    costa di piu': si paga quello che scrive davvero.
            max_tokens: 4000,
            system: sistemaPerClaude(sezione, nomeReparto, oggi, ruolo),
            tools: STRUMENTI_IN_MEMORIA,
            messages: messaggi
          }, giroManda(!!risposta));

          tin  += g.tin;
          tout += g.tout;
          cw   += g.cw || 0;
          cr   += g.cr || 0;
          if (g.errore) { errore = g.errore; break; }

          const blocchi = g.blocchi;
          /* ⛔ SI TIENE TUTTO QUELLO CHE HA SCRITTO, non solo l'ultimo giro.
             Prima `risposta` veniva sovrascritta a ogni giro e le frasi dei
             giri di mezzo si buttavano. Adesso l'utente le ha gia' VISTE
             comparire: se poi non le salvassimo, riaprendo la chat domani
             troverebbe scritto meno di quello che aveva letto. */
          if (g.testo) risposta = risposta ? (risposta + '\n\n' + g.testo) : g.testo;

      const chieste = blocchi.filter(function(b) { return b.type === 'tool_use'; });
      if (!chieste.length) break;

      // ⛔ QUI SI LEGGONO I DATI. Ogni lettura passa da costruisciLettura,
      //    che ci mette i due filtri; e va sul client dei DATI, con la RLS.
      const risultati = [];
      for (const t of chieste) {
        const inp = t.input || {};
        let esito;
        const base = { ruolo: ruolo, impresaId: impresaId };
        const filtri = { stato: inp.stato, escludiStato: inp.escludi_stato, dal: inp.dal, al: inp.al, prossime: inp.prima_le_prossime === true, statoPratica: inp.stato_pratica };
        if (t.name === 'conta_cose') {
          esito = await esegui(dati, costruisciLettura(inp.cosa, uid, mestiere_id, Object.assign({ soloConta: true }, base, filtri)));
        } else if (t.name === 'elenco_cose') {
          esito = await esegui(dati, costruisciLettura(inp.cosa, uid, mestiere_id, Object.assign({ quanti: inp.quanti }, base, filtri)));
          if (esito.righe) esito.righe = segnaGiorni(esito.righe, (ATTREZZI[inp.cosa] || {}).data, oggi);
        } else if (t.name === 'cerca_per_nome') {
          esito = await esegui(dati, costruisciLettura(inp.cosa, uid, mestiere_id, Object.assign({ parola: inp.parola }, base)));
          if (esito.righe) esito.righe = segnaGiorni(esito.righe, (ATTREZZI[inp.cosa] || {}).data, oggi);
        } else if (t.name === 'modifica_lavoro') {
          /* ⛔ 7 nov 2026 — PRIMA si controlla che il lavoro sia suo e di
             questo reparto (stessi due filtri di sempre), POI si prepara il
             modulo. Un id inventato o di un altro reparto non apre niente. */
          if (modulo && !daSistemare) {
            esito = { errore: 'un modulo per volta: questo non l\'ho aperto' };
          } else if (!inp.id) {
            esito = { errore: 'mi serve l\'id vero del lavoro: cercalo prima' };
          } else {
            const ql = costruisciLettura('lavori', uid, mestiere_id, { quanti: 1 });
            ql.filtri.id = String(inp.id);
            const rl = await esegui(dati, ql);
            if (rl.errore || !rl.righe || rl.righe.length !== 1) {
              esito = { errore: 'quel lavoro non e\' in questo reparto, oppure non esiste' };
            } else {
              const m = costruisciModulo('lavoro', inp, { ruolo: ruolo, modifica: inp.id });
              if (m.errore) esito = { errore: m.errore };
              else { modulo = m; daSistemare = false; esito = { ok: true, aperto: 'gli ho aperto «' + (rl.righe[0].descrizione || 'il lavoro') + '» con le caselle cambiate: salva lui' }; }
            }
          }
        } else if (t.name === 'agenda') {
          esito = await agenda(dati, uid, mestiere_id, oggi, base);
        } else if (t.name === 'dentro_al_documento') {
          /* ⛔ PRIMA IL PADRE, COL REPARTO. Se la fattura non e' sua o e' di
             un altro reparto, qui non esce niente e i figli non si toccano. */
          const f = FIGLI[inp.cosa];
          if (!f) {
            esito = { errore: 'non lo so guardare: ' + String(inp.cosa) };
          } else if (!inp.id) {
            esito = { errore: 'mi serve l\'id del documento' };
          } else {
            const qPadre = costruisciLettura(f.padre, uid, mestiere_id, { quanti: 1 });
            let padreOk = false;
            if (!qPadre.errore) {
              qPadre.filtri.id = String(inp.id);
              const rp = await esegui(dati, qPadre);
              padreOk = !rp.errore && rp.righe && rp.righe.length === 1;
            }
            esito = padreOk
              ? await esegui(dati, costruisciLetturaFiglio(inp.cosa, uid, inp.id, { quanti: inp.quanti }))
              : { errore: 'quel documento non e\' in questo reparto, oppure non esiste' };
          }
        } else if (t.name === 'liquidita_30_giorni') {
          /* come soldi_del_reparto: i conti li fa `chat_liquidita` su Supabase,
             col client dell'ISCRITTO (dentro si prende chi chiede da auth.uid()) */
          var rl = await chiamaRpc(dati, 'chat_liquidita', { p_mestiere: mestiere_id });
          esito = rl.errore ? { errore: rl.errore } : (rl.dati || { errore: 'nessun conto' });
        } else if (t.name === 'soldi_del_reparto') {
          /* ⛔ i conti li fa `chat_soldi` su Supabase, che a sua volta legge
             la vista `gest_fatture_totali`: la formula dei soldi resta in un
             posto solo. Qui non si somma niente.
             ⚠️ Va chiamata col client dell'ISCRITTO: dentro si prende chi
             chiede da auth.uid(), e col service role sarebbe vuoto. */
          var rs = await chiamaRpc(dati, 'chat_soldi', { p_mestiere: mestiere_id });
          esito = rs.errore ? { errore: rs.errore } : (rs.dati || { errore: 'nessun conto' });
        } else if (t.name === 'miei_prezzi') {
          /* i prezzi sono dell'utente (user_id), non del reparto: la tabella
             non ha `mestiere_id`. Il filtro sull'utente c'e' sempre. */
          const qp = { tabella: 'gest_prezzi_propri', campi: 'descrizione,unita,prezzo_unitario,categoria',
                       filtri: { user_id: uid }, senzaCestino: true, ordine: 'usata_volte', limite: RIGHE_MAX, soloConta: false };
          if (inp.parola) qp.contiene = { campo: 'descrizione', valore: String(inp.parola).slice(0, 60) };
          esito = uid ? await esegui(dati, qp) : { errore: 'manca chi sta chiedendo' };
        } else if (t.name === 'righe_senza_prezzo') {
          /* ⛔ PRIMA il computo, coi due filtri di sempre (utente e reparto):
             se non e' suo o e' di un altro reparto le righe non si toccano. */
          if (!inp.id) {
            esito = { errore: 'mi serve l\'id vero del computo: cercalo prima' };
          } else {
            const qc = costruisciLettura('computi', uid, mestiere_id, { quanti: 1 });
            let suo = null;
            if (!qc.errore) { qc.filtri.id = String(inp.id); const rc = await esegui(dati, qc); if (!rc.errore && rc.righe && rc.righe.length === 1) suo = rc.righe[0]; }
            if (!suo) {
              esito = { errore: 'quel computo non e\' in questo reparto, oppure non esiste' };
            } else {
              const salta = Math.min(Math.max(parseInt(inp.salta, 10) || 0, 0), 5000);
              const base0 = { tabella: 'gest_computo_voci_calc', filtri: { user_id: uid, computo_id: String(inp.id) },
                              oppure: 'prezzo_unitario.is.null,prezzo_unitario.eq.0' };
              const [rr, rq] = await Promise.all([
                esegui(dati, Object.assign({ campi: 'id,ordine,codice,descrizione,unita,quantita', ordine: 'ordine', crescente: true, limite: RIGHE_ZERO_MAX, salta: salta, soloConta: false }, base0)),
                esegui(dati, Object.assign({ campi: 'id', soloConta: true }, base0))
              ]);
              if (rr.errore || rq.errore) esito = { errore: rr.errore || rq.errore };
              else {
                /* ⛔ IL CODICE DI TARIFFA LO GUARDA IL SERVER, NON IL MODELLO.
                   Stesso codice + stessa unita' + un prezzo solo = e' quella voce.
                   Costa una lettura invece di migliaia di gettoni, e non sbaglia. */
                const tutte = rr.righe || [];
                const codici = Array.from(new Set(tutte.map(function (v) { return String(v.codice || '').trim(); }).filter(Boolean))).slice(0, 60);
                let perCodice = {};
                if (codici.length) {
                  const rp = await esegui(dati, { tabella: 'gest_prezzi_propri', campi: 'codice,descrizione,unita,prezzo_unitario', filtri: { user_id: uid },
                    dentro: { campo: 'codice', valori: codici }, senzaCestino: true, ordine: 'usata_volte', limite: 300, soloConta: false });
                  (rp.righe || []).forEach(function (r) { const c = String(r.codice || '').trim(); (perCodice[c] = perCodice[c] || []).push(r); });
                }
                memoC = { id: String(inp.id), titolo: suo.titolo || '', righe: {}, auto: [], candidati: {} };
                const daCercare = [];
                tutte.forEach(function (v, i) {
                  const n = salta + i + 1;
                  const cand = perCodice[String(v.codice || '').trim()] || [];
                  const buone = cand.filter(function (r) { return +r.prezzo_unitario > 0 && stessaUnita(r.unita, v.unita); });
                  const prezziDiversi = Array.from(new Set(buone.map(function (r) { return +r.prezzo_unitario; })));
                  if (buone.length && prezziDiversi.length === 1) {
                    memoC.auto.push({ voce_id: v.id, prezzo_unitario: +buone[0].prezzo_unitario, sicuro: true,
                      prezzo_da: ('codice ' + String(v.codice).trim() + ' · ' + String(buone[0].descrizione || '')).slice(0, 160) });
                    return;
                  }
                  memoC.righe[n] = { id: v.id, unita: v.unita || '', desc: String(v.descrizione || '') };
                  const cv = codaVoce(v.descrizione);
                  daCercare.push({ n: n, descrizione: mostraVoce(v.descrizione, 320), unita: v.unita || undefined,
                                   variante: cv || undefined, supplemento: eSupplemento(v.descrizione) || undefined });
                });
                memoC.restano = Math.max(0, rq.quanti - salta - tutte.length);
                esito = { trovate_per_codice: memoC.auto.length, da_cercare: daCercare, a_zero_in_tutto: rq.quanti,
                          restano_dopo_queste: memoC.restano };
              }
            }
          }
        } else if (t.name === 'cerca_prezzi') {
          /* i prezzi sono dell'utente (user_id), come in `miei_prezzi`.
             Ogni ricerca passa da `esegui`, col gettone dell'iscritto. */
          const lista = (Array.isArray(inp.cerca) ? inp.cerca : []).slice(0, RIGHE_ZERO_MAX);
          if (!uid) esito = { errore: 'manca chi sta chiedendo' };
          else if (!memoC) esito = { errore: 'prima leggi le righe con righe_senza_prezzo' };
          else if (!lista.length) esito = { errore: 'manca cosa cercare' };
          else {
            const LETTERE = 'abcde';
            const fatti = await Promise.all(lista.map(async function (c) {
              const n = parseInt(c && c.n, 10);
              /* solo lettere e numeri: una virgola o un % dentro la parola
                 cambierebbero la ricerca */
              const parole = String((c && c.parola) || '').toLowerCase().replace(/[^a-z0-9àèéìòù ]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 3; }).slice(0, 3);
              if (!memoC.righe[n] || !parole.length) return { n: n, voci: [] };
              const r = await esegui(dati, { tabella: 'gest_prezzi_propri', campi: 'descrizione,unita,prezzo_unitario', filtri: { user_id: uid },
                contieneTutte: { campo: 'descrizione', valori: parole }, senzaCestino: true, ordine: 'usata_volte', limite: 40, soloConta: false });
              /* prima la STESSA variante (coda uguale), poi la stessa unita';
                 le varianti sicuramente sbagliate (supplemento al posto della
                 lavorazione, misura diversa) non si fanno nemmeno vedere */
              const rd = memoC.righe[n].desc;
              const tutte = (r.righe || []).filter(function (x) { return +x.prezzo_unitario > 0 && stessaVariante(rd, x.descrizione) !== 'no'; });
              const voto = function (x) { return (stessaVariante(rd, x.descrizione) === 'si' ? 2 : 0) + (stessaUnita(x.unita, memoC.righe[n].unita) ? 1 : 0); };
              const scelte = tutte.map(function (x, i) { return { x: x, v: voto(x), i: i }; })
                .sort(function (a, b) { return (b.v - a.v) || (a.i - b.i); }).map(function (o) { return o.x; }).slice(0, 5);
              memoC.candidati[n] = {};
              return { n: n, voci: scelte.map(function (x, i) {
                const k = LETTERE[i];
                memoC.candidati[n][k] = { prezzo: +x.prezzo_unitario, descrizione: String(x.descrizione || ''), unita: x.unita || '' };
                return { k: k, d: mostraVoce(x.descrizione, 260), u: x.unita || undefined, p: x.prezzo_unitario };
              }) };
            }));
            esito = { risultati: fatti };
          }
        } else if (t.name === 'prezzi_computo') {
          /* ⛔ QUI NON SI SCRIVE NIENTE, e il prezzo NON lo scrive il modello:
             lui dice quale candidata (n + lettera), il numero lo mette il server
             dalla voce del prezzario che ha letto lui stesso. */
          if (modulo && !daSistemare) {
            esito = { errore: 'un modulo per volta: questo non l\'ho aperto' };
          } else if (!memoC || String(inp.id || '') !== memoC.id) {
            esito = { errore: 'prima leggi le righe di QUESTO computo con righe_senza_prezzo' };
          } else {
            const prezzi = memoC.auto.slice();
            let scartate = 0;
            (Array.isArray(inp.scelte) ? inp.scelte : []).slice(0, RIGHE_ZERO_MAX).forEach(function (sc) {
              const n = parseInt(sc && sc.n, 10), k = String((sc && sc.k) || '').trim().toLowerCase();
              const riga = memoC.righe[n], cand = memoC.candidati[n] && memoC.candidati[n][k];
              if (!riga || !cand) { scartate++; return; }
              if (prezzi.some(function (p) { return p.voce_id === riga.id; })) return;
              /* ⛔ 10 nov 2026, dal collaudo dal vivo: su 19 prezzi scelti «per
                 parola» e dati per sicuri, 16 erano la VARIANTE sbagliata della
                 stessa voce (stesso inizio, profondita' o terreno diversi, prezzo
                 diverso). Quindi una scelta per parola NON ha mai la spunta: la
                 spunta ce l'ha solo il codice di tariffa. La mette lui, guardando.
                 E una voce con un'altra unita' di misura non si propone proprio. */
              if (!stessaUnita(cand.unita, riga.unita)) { scartate++; return; }
              /* ⛔ 10 nov 2026 (sera): «per ogni cm in piu'» preso al prezzo della
                 voce da 3 cm, quattro sanitari diversi tutti a 162,8. Una
                 variante che non combacia NON si propone: meglio la riga vuota
                 che un prezzo sbagliato con l'aria giusta. */
              const sv = stessaVariante(riga.desc, cand.descrizione);
              if (sv === 'no') { scartate++; return; }
              const sorelle = sv === 'si' ? 0 : Object.keys(memoC.candidati[n]).filter(function (kk) {
                const o = memoC.candidati[n][kk];
                return kk !== k && o.prezzo !== cand.prezzo && stessaUnita(o.unita, cand.unita)
                  && o.descrizione.slice(0, 40).toLowerCase() === cand.descrizione.slice(0, 40).toLowerCase();
              }).length;
              prezzi.push({ voce_id: riga.id, prezzo_unitario: cand.prezzo, prezzo_da: cand.descrizione.slice(0, 160),
                            sicuro: false, varianti: sorelle > 0 });
            });
            const mc = costruisciComputo('prezzi', { prezzi: prezzi }, memoC.id, memoC.titolo);
            if (mc.errore) esito = { errore: 'non ho trovato nessun prezzo adatto nel suo prezzario: diglielo' };
            else {
              modulo = mc; daSistemare = false;
              const sicuri = mc.campi.prezzi.filter(function (p) { return p.sicuro; }).length;
              /* ⛔ 10 nov 2026 (sera): la chiusura la scrive il SERVER, senza
                 rimandare la palla a Claude. Era un giro intero (5-10 secondi)
                 solo per scrivere due righe, ed e' quello che faceva sforare i
                 30 secondi di Netlify. */
              prezziFatti = { tot: mc.campi.prezzi.length, sicuri: sicuri, restano: memoC.restano || 0 };
              esito = { ok: true, aperto: 'gli ho aperto «Controlla i prezzi»: ' + mc.campi.prezzi.length + ' prezzi proposti (' + memoC.auto.length + ' trovati per codice di tariffa e con la spunta, ' + (mc.campi.prezzi.length - sicuri) + ' scelti per descrizione e SENZA spunta: li deve guardare lui uno per uno)' + (scartate ? '; ' + scartate + ' scelte non valide scartate' : '') + '. Conferma lui.' };
            }
          }
        } else if (t.name === 'compila_computo') {
          /* ⛔ 10 nov 2026 — QUI NON SI SCRIVE NIENTE. Se c'e' un id, PRIMA si
             controlla che il computo sia suo e di questo reparto (i due filtri
             di sempre): un id inventato o di un altro reparto non apre niente. */
          const modoC = 'aggiungi';
          if (modulo && !daSistemare) {
            esito = { errore: 'un modulo per volta: questo non l\'ho aperto' };
          } else {
            let idOk = null, titoloOk = '', fermo = null;
            if (inp.id) {
              const qc = costruisciLettura('computi', uid, mestiere_id, { quanti: 1 });
              if (qc.errore) fermo = qc.errore;
              else {
                qc.filtri.id = String(inp.id);
                const rc = await esegui(dati, qc);
                if (rc.errore || !rc.righe || rc.righe.length !== 1) fermo = 'quel computo non e\' in questo reparto, oppure non esiste';
                else { idOk = rc.righe[0].id; titoloOk = rc.righe[0].titolo || ''; }
              }
            }
            if (fermo) esito = { errore: fermo };
            else {
              const mc = costruisciComputo(modoC, inp, idOk, titoloOk);
              if (mc.errore) esito = { errore: mc.errore };
              else {
                modulo = mc; daSistemare = false;
                esito = { ok: true, aperto: modoC === 'prezzi'
                  ? 'gli ho aperto la schermata «Controlla i prezzi» con ' + mc.campi.prezzi.length + ' prezzi proposti: mette la spunta e conferma lui'
                  : 'gli ho aperto la schermata «Controlla le lavorazioni» con ' + mc.campi.voci.length + ' righe: le fa entrare lui col pulsante «Metti dentro»' };
              }
            }
          }
        } else if (t.name.indexOf('compila_') === 0 && MODULI[t.name.slice(8)]) {
          /* ⛔ QUI NON SI SCRIVE NIENTE. Si prepara solo il modulo che
             aprira' il browser, e a salvarlo sara' l'iscritto. Il
             controllo delle caselle sta tutto in `costruisciModulo`, che
             il banco prova da sola.
             ⚠️ L'unica lettura e' quella del NOME VERO del cliente e della
             persona della squadra: passa da `costruisciLettura`, quindi
             si porta dietro i due filtri come tutte le altre. Vedi la
             nota sopra `nomeVero`. */
          /* ⛔ il nome del modulo esce dal nome dell'attrezzo, e vale solo
             se sta in MODULI: cosi' aggiungerne uno domani e' una riga
             sola, e uno inventato non passa. */
          const quale = t.name.slice(8);
          const m = costruisciModulo(quale, inp, { ruolo: ruolo });
          /* ⚠️ un modulo per volta, MA se il primo aveva un nome che non
             esiste Claude puo' richiamare l'attrezzo una volta per
             sistemarlo: quello e' il giro che serve, non un doppione. */
          if (m.errore) esito = { errore: m.errore };
          else if (modulo && !daSistemare) esito = { errore: 'un modulo per volta: questo non l\'ho aperto' };
          else {
            const avvisi = [];
            if (quale === 'lavoro') {
              for (const coppia of [['cliente', 'clienti'], ['operatore', 'operatori']]) {
                const campo = coppia[0], tabella = coppia[1];
                if (!m.campi[campo]) continue;
                const nomi = await nomiDelReparto(dati, tabella, uid, mestiere_id);
                const giusto = scegliNome(m.campi[campo], nomi);
                if (giusto) { m.campi[campo] = giusto; continue; }
                avvisi.push('«' + m.campi[campo] + '» fra i suoi non c\'e\', quindi l\'ho lasciato fuori. '
                  + (nomi.length
                      ? 'Nel reparto ci sono: ' + nomi.join(' · ') + '. Se e\' uno di questi richiama l\'attrezzo col nome scritto ESATTAMENTE cosi\'; se non e\' nessuno di questi lascialo fuori e dillo, lo sceglie lui.'
                      : 'Nel reparto non ce n\'e\' nessuno: diglielo, lo aggiunge lui.'));
                delete m.campi[campo];
              }
            }
            modulo = m;
            daSistemare = avvisi.length > 0;
            esito = avvisi.length
              ? { ok: true, aperto: 'modulo del ' + quale + ' aperto', da_sistemare: avvisi }
              : { ok: true, aperto: 'gli ho aperto il modulo del ' + quale + ', gia\' compilato' };
          }
        } else {
          esito = { errore: 'attrezzo che non esiste' };
        }
        risultati.push({
          type: 'tool_result',
          tool_use_id: t.id,
          content: JSON.stringify(esito).slice(0, (t.name === 'cerca_prezzi' || t.name === 'righe_senza_prezzo') ? 30000 : 12000),
          is_error: !!esito.errore
        });
      }
      messaggi.push({ role: 'assistant', content: blocchi });
      messaggi.push({ role: 'user', content: risultati });
      if (prezziFatti) {
        const dopo = prezziFatti.tot - prezziFatti.sicuri;
        const chiusa = prezziFatti.tot + (prezziFatti.tot === 1 ? ' prezzo proposto' : ' prezzi proposti')
          + ' (' + prezziFatti.sicuri + ' per codice di tariffa, con la spunta; ' + dopo + ' per descrizione, SENZA spunta: guardali uno per uno).'
          + (prezziFatti.restano > 0 ? '\nNe restano ' + prezziFatti.restano + ': conferma questi e premi di nuovo «Metti i prezzi con l\'AI».' : '');
        risposta = risposta ? (risposta + '\n\n' + chiusa) : chiusa;
        try { manda({ pezzo: '\n\n' + chiusa }); } catch (e) {}
        break;
      }
      /* ⛔ 10 nov 2026 (sera) — oltre i 22 secondi non si parte con un altro
         giro: Netlify taglia a 30 e la risposta andrebbe persa (pagata e mai
         vista). Ci si ferma, si dice perche', e si rimborsa. */
      if (Date.now() - T0 > 22000) {
        tempoScaduto = true;
        errore = 'Ci ho messo troppo e mi sono fermato prima di perdere il lavoro. Riprova: non ti ho contato niente.';
        break;
      }
        }
      } catch (e) {
        errore = e && e.message;
      }

      if (!risposta && !errore) errore = 'Non sono riuscito a rispondere. Riprova.';

      // ⛔ SE NON HA AVUTO LA RISPOSTA, IL CREDITO TORNA INDIETRO.
      //    Stessa regola di prima: si scala prima di chiamare Claude e si
      //    rimborsa se fallisce. Far pagare un messaggio mai arrivato e' il
      //    modo piu' veloce per farsi disdire il piano.
      if (errore && (!risposta || tempoScaduto) && scontrino) {
        // ⚠️ 14 set 2026: il rimborso va su chat_extra, non sui crediti
        const rimb = await chiamaRpc(dati, 'refund_chat_message',
          { p_log_id: scontrino, p_error: String(errore).slice(0, 300) });
        if (rimb.errore) console.error('[chat] rimborso non riuscito:', rimb.errore);
      }

      // ---- 8. si scrive nel registro (solo il server puo') ------------
      // ⚠️ Sonnet 4.5: 3 $ per milione in ingresso, 15 in uscita; la memoria
      //    3,75 $ quando si scrive e 0,30 $ quando si legge.
      const costo = (tin * 3 / 1e6) + (cw * 3.75 / 1e6) + (cr * 0.30 / 1e6) + (tout * 15 / 1e6);
      /* vale 5 solo se la schermata dei prezzi si e' aperta davvero */
      const peso = (risposta && modulo && modulo.tipo === 'computo' && modulo.campi && Array.isArray(modulo.campi.prezzi)) ? PESO_PREZZI : 1;
      /* quanto vale lo dice il SERVER, non il modello (dal vivo aveva scritto
         «vale 1 messaggio» mentre ne contava 5) */
      if (peso > 1) {
        const coda = '\n\nQuesto pezzo vale ' + peso + ' messaggi.';
        risposta += coda;
        try { manda({ pezzo: coda }); } catch (e) {}
      }
      try {
        /* ⛔ 30 agosto 2026 (sera): i due orari devono essere DIVERSI, se no
           l'ordine fra domanda e risposta non e' garantito (vedi il punto 6).
           La domanda porta l'ora in cui e' arrivata, la risposta quella in cui
           e' finita: sono anche piu' veri cosi'. La riga del massimo tiene
           l'ordine anche nel caso impossibile di una risposta istantanea. */
        const oraRisposta = new Date(Math.max(Date.now(), Date.parse(oraDomanda) + 1)).toISOString();
        /* ⛔ 10 nov 2026 (sera): una risposta FALLITA non si conta. Il conto
           dei messaggi compresi (chat_stato) conta le righe «utente» del mese:
           se si scrivesse anche questa, il messaggio si pagherebbe lo stesso.
           Si scrive solo la riga dell'AI, con l'errore e la domanda dentro. */
        const fallito = !!(errore && (!risposta || tempoScaduto));
        if (fallito) {
          await server.from('gest_chat_messaggi').insert([{ created_at: oraRisposta,
            user_id: uid, mestiere_id: mestiere_id, conversazione_id: conversazione_id,
            ruolo: 'ai', testo: (risposta ? risposta + '\n\n' : '') + '(Non riuscita, non contata: «' + String(domanda).slice(0, 300) + '»)',
            sezione: sezione || null, tokens_input: tin + cw + cr, tokens_output: tout, costo_usd: costo, errore: errore }]);
        } else {
        if (peso > 1) {
          const aParte = globalThis.crypto.randomUUID();
          const inPiu = [];
          for (let i = 1; i < peso; i++) inPiu.push({
            created_at: new Date(Date.parse(oraDomanda) + i + 1).toISOString(),
            user_id: uid, mestiere_id: mestiere_id, conversazione_id: aParte, ruolo: 'utente',
            testo: '[conto: i prezzi di un computo valgono ' + peso + ' messaggi]',
            sezione: sezione || null, come_pagato: comePagato, eliminato_il: oraRisposta });
          const rp = await server.from('gest_chat_messaggi').insert(inPiu);
          if (rp && rp.error) console.error('[chat] peso dei prezzi non scritto:', rp.error.message);
          if (comePagato === 'comprato') {
            for (let i = 1; i < peso; i++) { const c2 = await chiamaRpc(dati, 'consume_chat_message', {}); if (c2.errore || !c2.dati || c2.dati.ok !== true) break; }
          }
        }
        await server.from('gest_chat_messaggi').insert([
          { created_at: oraDomanda,
            user_id: uid, mestiere_id: mestiere_id, conversazione_id: conversazione_id,
            /* ⚠️ l'allegato NON si salva: resta scritto solo che c'era, se no
               riaprendo la chat domani uno vede la domanda e non capisce a
               cosa si riferiva la risposta. */
            ruolo: 'utente', testo: domanda + (cheAllegato ? '\n[con ' + cheAllegato + ']' : ''),
            sezione: sezione || null, come_pagato: comePagato },
          { created_at: oraRisposta,
            user_id: uid, mestiere_id: mestiere_id, conversazione_id: conversazione_id,
            ruolo: 'ai', testo: risposta || null, sezione: sezione || null,
            tokens_input: tin + cw + cr, tokens_output: tout, costo_usd: costo, errore: errore }
        ]);
        }
      } catch (e) { console.error('[chat] registro:', e && e.message); }

      manda({
        fine: true,
        errore: (errore && (!risposta || tempoScaduto)) ? errore : null,
        modulo: modulo,
        come_pagato: comePagato,
        /* ⚠️ 14 set 2026: si toglie 1 in tutti e due i casi. `restanti`
           comprende sia i compresi sia i messaggi comprati, e questo
           messaggio ha consumato uno dei due. Prima si toglieva solo per i
           compresi perche' i crediti erano un contatore a parte. */
        restanti: (errore && (!risposta || tempoScaduto)) ? (stato.restanti || 0) : Math.max((stato.restanti || 0) - peso, 0)
      });
      chiuso = true;
      try { controller.close(); } catch (e) {}
    }
  });

  return new Response(flusso, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      /* ⚠️ dice a chi sta in mezzo di non mettere da parte la risposta e
         consegnarla tutta insieme alla fine: sarebbe come non averla fatta */
      'X-Accel-Buffering': 'no'
    }
  });
}

// per il banco: le parti pure si provano da sole, senza database
export { ATTREZZI, DOVE_SI_CERCA, STRUMENTI, costruisciLettura, FIGLI, costruisciLetturaFiglio, ripulisciAllegato };
export { stessaUnita, costruisciComputo, pulisciVoci, costruisciModulo, CASELLE_LAVORO, MODULI, calendarioProssimo, scegliNome, nomiDelReparto, esegui, istruzioni, chiamaRpc, unGiro };
export { casellePratica, PRATICA_TIPI_OK, PRATICA_STATI_OK, istruzioniFisse, istruzioniDelGiorno, sistemaPerClaude, segnaGiorni, giornoPiu, agenda, parolaPulita, STRUMENTI_IN_MEMORIA, PAROLE_RUOLO };
