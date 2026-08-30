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
const { createClient } = require('@supabase/supabase-js');

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
const GIRI_MAX       = 4;       // quante volte Claude puo' chiedere dati
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
  lavori:       { tabella:'gest_lavori',            campi:'id,descrizione,dove,stato,data_prevista,data_fatto,importo,fatt_stato', ordine:'data_prevista', nome:'i lavori' },
  preventivi:   { tabella:'gest_preventivi',        campi:'id,numero,titolo,stato,data',                        ordine:'data',          nome:'i preventivi' },
  fatture:      { tabella:'gest_fatture',           campi:'id,numero,anno,data,stato,cli_nome',                 ordine:'data',          nome:'le fatture' },
  clienti:      { tabella:'gest_clienti',           campi:'id,nome,tipo,citta',                                 ordine:'nome',          nome:'i clienti' },
  fornitori:    { tabella:'gest_fornitori',         campi:'id,nome,categoria,telefono',                         ordine:'nome',          nome:'i fornitori' },
  scadenze:     { tabella:'gest_scadenze',          campi:'id,titolo,data_scadenza,stato',                      ordine:'data_scadenza', nome:'le scadenze' },
  computi:      { tabella:'gest_computi',           campi:'id,numero,titolo,stato,data',                        ordine:'data',          nome:'i computi' },
  sal:          { tabella:'gest_sal',               campi:'id,numero,stato,data',                               ordine:'data',          nome:'gli stati di avanzamento' },
  mezzi:        { tabella:'gest_mezzi',             campi:'id,nome,targa,stato',                                ordine:'nome',          nome:'i mezzi' },
  operatori:    { tabella:'gest_operatori',         campi:'id,nome,mansione',                                   ordine:'nome',          nome:'le persone della squadra' },
  fatture_fornitori: { tabella:'gest_fatture_fornitori', campi:'id,numero,importo,scadenza,stato',              ordine:'scadenza',      nome:'le fatture dei fornitori' }
};
// il campo su cui cerca «cerca_per_nome», per ogni cosa
const DOVE_SI_CERCA = {
  lavori:'descrizione', preventivi:'titolo', fatture:'numero', clienti:'nome',
  fornitori:'nome', scadenze:'titolo', computi:'titolo', sal:'numero',
  mezzi:'nome', operatori:'nome', fatture_fornitori:'numero'
};

// ---------------------------------------------------------------------
// ⛔ IL CUORE: qui nasce OGNI lettura, e qui ci sono i due filtri.
//    E' una funzione pura apposta — il banco la puo' chiamare da sola,
//    senza database, e controllare che i filtri ci siano sempre.
//    Se un domani si aggiunge un attrezzo, passa comunque da qui.
// ---------------------------------------------------------------------
function costruisciLettura(cosa, uid, reparto, opzioni) {
  const o = opzioni || {};
  const a = ATTREZZI[cosa];
  // il nome della tabella NON arriva mai da Claude: o e' nell'elenco o niente
  if (!a) return { errore: 'non lo so guardare: ' + String(cosa) };
  if (!uid) return { errore: 'manca chi sta chiedendo' };
  if (!reparto) return { errore: 'manca il reparto' };
  const q = {
    tabella: a.tabella,
    campi: a.campi,
    // ⛔ TUTTI E DUE, SEMPRE. Non e' negoziabile.
    filtri: { user_id: uid, mestiere_id: reparto },
    // ⛔ E IL CESTINO FUORI, SEMPRE.
    //    Tutte e undici queste tabelle hanno `eliminato_il`: quello che
    //    l'iscritto butta nel cestino resta nel database. Senza questo,
    //    alla domanda «quante fatture ho» la chat conterebbe anche quelle
    //    buttate e direbbe un numero che sullo schermo non c'e'. Due
    //    schermate, due numeri: il difetto delle fatture del 13 agosto.
    senzaCestino: true,
    ordine: a.ordine,
    limite: Math.min(Math.max(parseInt(o.quanti, 10) || RIGHE_MAX, 1), RIGHE_MAX),
    soloConta: !!o.soloConta
  };
  if (o.parola) {
    const campo = DOVE_SI_CERCA[cosa];
    if (campo) q.contiene = { campo: campo, valore: String(o.parola).slice(0, 80) };
  }
  return q;
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
             serve: 'nome',        manca: 'manca il nome del cliente' }
};
const CASELLE_LAVORO = MODULI.lavoro.caselle;    // per chi lo chiedeva prima
const LUNGHEZZA_MAX  = 300;
const FORMA_DATA     = /^\d{4}-\d{2}-\d{2}$/;

function costruisciModulo(tipo, dati) {
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
  if (!campi[m.serve]) return { errore: m.manca };
  return { tipo: tipo, campi: campi };
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
  if (!q.soloConta) {
    if (q.ordine) sel = sel.order(q.ordine, { ascending: false, nullsFirst: false });
    sel = sel.limit(q.limite);
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
const STRUMENTI = [
  {
    name: 'conta_cose',
    description: 'Conta quante cose di un tipo ci sono nel reparto aperto. Usalo per domande come «quanti lavori ho aperti».',
    input_schema: { type:'object', properties: { cosa: { type:'string', enum: ELENCO_COSE } }, required:['cosa'] }
  },
  {
    name: 'elenco_cose',
    description: 'Dà l\'elenco delle cose di un tipo nel reparto aperto, dalle più recenti. Usalo quando serve vedere quali sono, non solo quante.',
    input_schema: { type:'object', properties: { cosa: { type:'string', enum: ELENCO_COSE }, quanti: { type:'integer' } }, required:['cosa'] }
  },
  {
    name: 'soldi_del_reparto',
    description: 'Dà i conti in soldi del reparto aperto: fatture da incassare, fatture già incassate quest\'anno, fatture in bozza, PREVENTIVI IN ATTESA di risposta e preventivi accettati, lavori finiti e non ancora fatturati, e quanto c\'è da pagare ai fornitori. Ogni voce ha imponibile, IVA e totale. USALO SEMPRE per qualsiasi domanda che riguarda soldi, incassi, fatturato, preventivi o quanto si deve: i numeri non si sommano a mano.',
    input_schema: { type:'object', properties: {} }
  },
  {
    name: 'cerca_per_nome',
    description: 'Cerca una parola nel nome o nel titolo delle cose di un tipo, dentro il reparto aperto. Usalo quando l\'utente nomina un cliente, un lavoro o un documento.',
    input_schema: { type:'object', properties: { cosa: { type:'string', enum: ELENCO_COSE }, parola: { type:'string' } }, required:['cosa','parola'] }
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
        operatore:   { type:'string', description:'il nome di chi ci va' }
      },
      required: ['descrizione']
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
  }
];

// ---------------------------------------------------------------------
// le istruzioni della chat
// ⚠️ Le tre materie su cui si ferma le ha decise Alessio il 26 agosto:
//    se Claude sbaglia un'aliquota o una regola di sicurezza, la figura
//    la fa lui, non Claude.
// ---------------------------------------------------------------------
function istruzioni(sezione, nomeReparto, oggi) {
  return [
    'Sei la chat di aiuto dentro il gestionale di TrovaImpresa, usato da imprese edili, artigiani, studi tecnici, negozi di materiali e noleggi.',
    'Rispondi in italiano, corto e pratico, a passaggi numerati quando servono. Chi ti legge non è un tecnico di informatica.',
    'Stai guardando il reparto «' + (nomeReparto || 'quello aperto') + '»' + (sezione ? ', sezione «' + sezione + '»' : '') + '.',
    // ⛔ IL CALENDARIO GIA' SCRITTO: vedi la nota sopra calendarioProssimo.
    //    Il primo della fila e' oggi. Il conto non lo fa lui: legge.
    'IL CALENDARIO, così non devi contare. Oggi è il primo della fila: ' + calendarioProssimo(oggi, 14) + '.',
    '⛔ La data del modulo PRENDILA DA QUESTA FILA, copiando il pezzo dopo l\'uguale. Non contarla a mente: sbaglieresti il giorno della settimana. Se ti chiede una data più in là della fila, conta di sette in sette partendo da una riga della fila.',
    '',
    'PUOI GUARDARE I SUOI DATI con gli attrezzi che hai. Usali quando la domanda riguarda le SUE cose («quante fatture ho», «quanto mi deve Rossi»): rispondere a memoria su dati che puoi leggere è un errore.',
    'Gli attrezzi vedono SOLO il reparto aperto. Se ti chiede di un altro reparto, dillo: deve cambiare reparto e richiedere.',
    '',
    'QUANDO NON SAI, DILLO. Non inventare funzioni che non esistono e non inventare numeri. Se la domanda esce dal gestionale, o se ti serve un dato che non puoi leggere, dì che non lo sai e manda ai due riquadri in alto a sinistra: «Chiedi una funzione» e «Assistenza diretta».',
    '',
    'FERMATI E DÌ DI CONTROLLARE su tre materie, sempre, anche se sai la risposta:',
    '· soldi e tasse (aliquote IVA, ritenute, regimi) → «questo fattelo confermare dal commercialista»;',
    '· sicurezza e leggi → «verifica, la norma cambia»;',
    '· contratti → «fallo vedere a chi di dovere».',
    'Puoi spiegare come si fa una cosa NEL GESTIONALE anche su questi argomenti: quello che non fai è dire cosa è giusto per legge.',
    '',
    'QUANDO NOMINI UNA COSA PRECISA che hai letto con un attrezzo (un lavoro, un preventivo, una fattura, un cliente), subito dopo il suo nome scrivi il segnalino [apri:TIPO:ID] con l\'id vero che hai letto. TIPO è uno fra: lav (lavoro), prev (preventivo), fatt (fattura), cli (cliente). Il gestionale lo trasforma in un pulsante «Aprilo» che porta l\'utente proprio li\'.',
    'Esempio: «Sostituzione grondaia [apri:lav:1f2e...] vale 8.000,00 €». Il segnalino non si spiega e non si nomina: si scrive e basta.',
    'Metti il segnalino SOLO su cose che hai davvero letto, con l\'id esatto. Non inventarlo mai: un pulsante che apre la cosa sbagliata è peggio di nessun pulsante.',
    '',
    'I SOLDI si chiedono SEMPRE a `soldi_del_reparto`, mai sommando a mano le righe che leggi: le somme le fa il gestionale, tu le riporti.',
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
    'Sai aprire questi due moduli e basta. Se ti chiede un preventivo, mandalo al pulsante «Genera con AI» che sta in cima ai Preventivi.',
    'Quando nel modulo ci metti il nome di un cliente o di una persona della squadra, scrivilo COME STA NEL GESTIONALE, non come lo scriveresti tu: se non sei sicuro di come e\' scritto, cercalo prima con `cerca_per_nome`. Un nome «sistemato» non si attacca a nessuno.',
    '',
    'Nel database non scrivi e non cambi mai niente: tu leggi, spieghi, e al massimo gli apri un modulo già pieno. A salvare è sempre lui.'
  ].join('\n');
}

// ---------------------------------------------------------------------
const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

function conTempo(promessa, ms, etichetta) {
  let t;
  const scaduta = new Promise((_, rifiuta) => {
    t = setTimeout(() => rifiuta(new Error('tempo scaduto: ' + etichetta)), ms);
    if (t && typeof t.unref === 'function') t.unref();
  });
  return Promise.race([promessa, scaduta]).finally(() => clearTimeout(t));
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return rispondi(405, { error: 'Method Not Allowed' });

  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY;
  // ⚠️ la chiave `anon` NON e' un segreto: sta gia' scritta dentro
  //    js/gate-gestionale.js, che il browser scarica. Il ripiego e'
  //    copiato da netlify/functions/sitemap-offerte.js, cosi' la function
  //    parte anche se su Netlify la variabile non c'e' ancora.
  const ANON_KEY = process.env.SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return rispondi(500, { error: 'Configurazione server mancante.' });
  }

  let domanda, conversazione_id, mestiere_id, sezione;
  try {
    ({ domanda, conversazione_id, mestiere_id, sezione } = JSON.parse(event.body || '{}'));
  } catch { return rispondi(400, { error: 'Body JSON non valido.' }); }
  if (!domanda || !String(domanda).trim()) return rispondi(400, { error: 'La domanda è vuota.' });
  if (!conversazione_id || !mestiere_id)   return rispondi(400, { error: 'Parametri mancanti.' });
  domanda = String(domanda).slice(0, 2000);

  const intestazioni = event.headers || {};
  const autorizzazione = intestazioni.authorization || intestazioni.Authorization || '';
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
  try {
    const r = await conTempo(
      dati.from('gest_mestieri').select('id,nome').eq('id', mestiere_id).eq('user_id', uid).maybeSingle(),
      TEMPO_ACCESSO, 'reparto');
    if (r && !r.error && r.data) nomeReparto = r.data.nome || null;
    else return rispondi(403, { error: 'Questo reparto non è tuo.' });
  } catch (e) { return rispondi(403, { error: 'Non riesco a verificare il reparto. Riprova.' }); }

  // ---- 4. ha il Pro? e quanti messaggi gli restano? ------------------
  let stato = null;
  {
    const r = await chiamaRpc(server, 'chat_stato', { p_user: uid });
    if (r.errore) console.error('[chat] chat_stato:', r.errore);
    else if (r.dati && r.dati.length) stato = r.dati[0];
  }
  if (!stato) return rispondi(503, { error: 'Non riesco a controllare il tuo piano. Riprova fra poco.' });
  if (!stato.ha_pro) {
    // ⛔ 30 agosto 2026 — L'ASSAGGIO FINITO NON E' «NON CE L'HAI».
    // Chi non ha il Premium AI ha 10 messaggi in tutto per capire se gli
    // serve. Quando finiscono la frase deve dirgli cosa ha appena usato e
    // cosa comprerebbe, non un secco «non e' nel tuo piano».
    return rispondi(403, {
      error: stato.assaggio
        ? 'Hai finito i ' + stato.compresi + ' messaggi di prova della Chat con AI. '
          + 'Con il Premium AI ne hai 300 al mese.'
        : 'La Chat con AI è nel piano Premium AI.',
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
  let comePagato = 'compreso';
  let scontrino = null;   // il log_id, per rimborsare se Claude non risponde
  if (stato.restanti <= 0) {
    const c = await chiamaRpc(dati, 'consume_ai_credit', { p_feature: 'chat', p_cost: 1 });
    const esito = (c && !c.errore && c.dati) || null;
    if (!esito || esito.ok !== true) {
      const perche = (esito && esito.reason) || 'no_credits';
      return rispondi(402, {
        error: 'Hai finito i ' + stato.compresi + ' messaggi compresi di questo mese'
             + (perche === 'no_credits' ? ' e non ti restano crediti.' : '.')
             + ' Puoi ricaricare dalla pagina dei crediti.',
        serve_crediti: true, motivo: perche
      });
    }
    comePagato = 'credito';
    scontrino = esito.log_id || null;
  }

  // ---- 6. la chiacchierata di prima ---------------------------------
  let storia = [];
  try {
    const r = await server.from('gest_chat_messaggi')
      .select('ruolo,testo')
      .eq('user_id', uid).eq('conversazione_id', conversazione_id)
      .order('created_at', { ascending: false }).limit(STORIA_MAX);
    if (!r.error && r.data) storia = r.data.reverse()
      .filter(function(m) { return m.testo; })
      .map(function(m) { return { role: m.ruolo === 'ai' ? 'assistant' : 'user', content: m.testo }; });
  } catch (e) { console.error('[chat] storia:', e && e.message); }

  // ---- 7. il giro con Claude ----------------------------------------
  const messaggi = storia.concat([{ role: 'user', content: domanda }]);
  let risposta = '', tin = 0, tout = 0, errore = null;

  /* ⛔ IL MODULO DA APRIRE (gradino 3). Resta `null` per tutti i messaggi
     che sono solo domande: solo `compila_lavoro` lo riempie, e ne passa
     UNO SOLO — due moduli aperti insieme sono due finestre sovrapposte. */
  let modulo = null;
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

  try {
    for (let giro = 0; giro < GIRI_MAX; giro++) {
      const r = await conTempo(fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          system: istruzioni(sezione, nomeReparto, oggi),
          tools: STRUMENTI,
          messages: messaggi
        })
      }), TEMPO_CLAUDE, 'claude');

      const d = await r.json();
      if (!r.ok) { errore = (d.error && d.error.message) || ('Anthropic HTTP ' + r.status); break; }
      tin  += (d.usage && d.usage.input_tokens)  || 0;
      tout += (d.usage && d.usage.output_tokens) || 0;

      const blocchi = d.content || [];
      risposta = blocchi.filter(function(b) { return b.type === 'text'; })
                        .map(function(b) { return b.text; }).join('\n').trim();

      const chieste = blocchi.filter(function(b) { return b.type === 'tool_use'; });
      if (!chieste.length) break;

      // ⛔ QUI SI LEGGONO I DATI. Ogni lettura passa da costruisciLettura,
      //    che ci mette i due filtri; e va sul client dei DATI, con la RLS.
      const risultati = [];
      for (const t of chieste) {
        const inp = t.input || {};
        let esito;
        if (t.name === 'conta_cose') {
          esito = await esegui(dati, costruisciLettura(inp.cosa, uid, mestiere_id, { soloConta: true }));
        } else if (t.name === 'elenco_cose') {
          esito = await esegui(dati, costruisciLettura(inp.cosa, uid, mestiere_id, { quanti: inp.quanti }));
        } else if (t.name === 'cerca_per_nome') {
          esito = await esegui(dati, costruisciLettura(inp.cosa, uid, mestiere_id, { parola: inp.parola }));
        } else if (t.name === 'soldi_del_reparto') {
          /* ⛔ i conti li fa `chat_soldi` su Supabase, che a sua volta legge
             la vista `gest_fatture_totali`: la formula dei soldi resta in un
             posto solo. Qui non si somma niente.
             ⚠️ Va chiamata col client dell'ISCRITTO: dentro si prende chi
             chiede da auth.uid(), e col service role sarebbe vuoto. */
          var rs = await chiamaRpc(dati, 'chat_soldi', { p_mestiere: mestiere_id });
          esito = rs.errore ? { errore: rs.errore } : (rs.dati || { errore: 'nessun conto' });
        } else if (t.name === 'compila_lavoro' || t.name === 'compila_cliente') {
          /* ⛔ QUI NON SI SCRIVE NIENTE. Si prepara solo il modulo che
             aprira' il browser, e a salvarlo sara' l'iscritto. Il
             controllo delle caselle sta tutto in `costruisciModulo`, che
             il banco prova da sola.
             ⚠️ L'unica lettura e' quella del NOME VERO del cliente e della
             persona della squadra: passa da `costruisciLettura`, quindi
             si porta dietro i due filtri come tutte le altre. Vedi la
             nota sopra `nomeVero`. */
          const quale = (t.name === 'compila_cliente') ? 'cliente' : 'lavoro';
          const m = costruisciModulo(quale, inp);
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
          content: JSON.stringify(esito).slice(0, 12000),
          is_error: !!esito.errore
        });
      }
      messaggi.push({ role: 'assistant', content: blocchi });
      messaggi.push({ role: 'user', content: risultati });
    }
  } catch (e) {
    errore = e && e.message;
  }

  if (!risposta && !errore) errore = 'Non sono riuscito a rispondere. Riprova.';

  // ⛔ SE NON HA AVUTO LA RISPOSTA, IL CREDITO TORNA INDIETRO.
  //    E' la stessa regola gia' scritta per le altre funzioni AI: si scala
  //    prima di chiamare Claude e si rimborsa se fallisce. Far pagare un
  //    messaggio che non e' mai arrivato e' il modo piu' veloce per farsi
  //    disdire il piano.
  if (errore && !risposta && scontrino) {
    const rimb = await chiamaRpc(dati, 'refund_ai_credit',
      { p_log_id: scontrino, p_error: String(errore).slice(0, 300) });
    if (rimb.errore) console.error('[chat] rimborso non riuscito:', rimb.errore);
  }

  // ---- 8. si scrive nel registro (solo il server puo') --------------
  // ⚠️ Sonnet 4.5: 3 $ per milione in ingresso, 15 in uscita.
  const costo = (tin * 3 / 1e6) + (tout * 15 / 1e6);
  try {
    await server.from('gest_chat_messaggi').insert([
      { user_id: uid, mestiere_id: mestiere_id, conversazione_id: conversazione_id,
        ruolo: 'utente', testo: domanda, sezione: sezione || null, come_pagato: comePagato },
      { user_id: uid, mestiere_id: mestiere_id, conversazione_id: conversazione_id,
        ruolo: 'ai', testo: risposta || null, sezione: sezione || null,
        tokens_input: tin, tokens_output: tout, costo_usd: costo, errore: errore }
    ]);
  } catch (e) { console.error('[chat] registro:', e && e.message); }

  if (errore && !risposta) return rispondi(502, { error: errore });
  return rispondi(200, { risposta: risposta, modulo: modulo, come_pagato: comePagato, restanti: Math.max((stato.restanti || 0) - (comePagato === 'compreso' ? 1 : 0), 0) });
};

// per il banco: le parti pure si provano da sole, senza database
exports.ATTREZZI = ATTREZZI;
exports.DOVE_SI_CERCA = DOVE_SI_CERCA;
exports.STRUMENTI = STRUMENTI;
exports.costruisciLettura = costruisciLettura;
exports.costruisciModulo = costruisciModulo;
exports.CASELLE_LAVORO = CASELLE_LAVORO;
exports.MODULI = MODULI;
exports.calendarioProssimo = calendarioProssimo;
exports.scegliNome = scegliNome;
exports.nomiDelReparto = nomiDelReparto;
exports.esegui = esegui;
exports.istruzioni = istruzioni;

exports.chiamaRpc = chiamaRpc;
