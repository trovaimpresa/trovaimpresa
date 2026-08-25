#!/usr/bin/env node
/* =====================================================================
   IL CONTROLLO PRIMA DI PUBBLICARE — 16 agosto 2026

   Gira su Netlify a ogni push, PRIMA che il sito vada online. Se trova
   qualcosa di rotto, la pubblicazione si ferma e il sito resta com'era.

   Nasce da un fatto: in due giorni tre pulsanti hanno portato su pagine
   che non esistevano — «Ricarica crediti», «Vedi i piani», e prima
   ancora un link nel gestionale. Nessuno prova l'ultimo clic, e finora
   non c'era niente che lo provasse al posto nostro.

   ⚠️ LA REGOLA DI QUESTO FILE: se non e' SICURO che sia un errore, non
   ferma niente. Un controllo che grida al lupo per sbaglio viene spento
   dopo tre volte, e allora non protegge piu' da niente. Quello che e'
   solo sospetto finisce fra gli avvisi, che si leggono e non bloccano.

   COME SI LANCIA A MANO (dalla cartella del progetto)
       node tools/controllo-push.js

   Esce con 1 se c'e' qualcosa di rotto, con 0 se e' tutto a posto.
   ===================================================================== */
'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const RADI = process.env.CONTROLLO_RADI || path.resolve(__dirname, '..');

/* ------------------------------------------------------------------ */
/* Quello che si guarda con l'occhio severo: qui la regola dei 13 px   */
/* e' scritta nel progetto, e vale.                                     */
/* ------------------------------------------------------------------ */
const FILE_GESTIONALE = [
  'gestionale-app.html',
  'gestionale-operatore.html',
  /* ⛔ 25 agosto 2026 — il noleggio entra nella lista OGGI, che e' il giorno
     giusto: le sue diciotto misure sotto i 13 px sono state sistemate tutte,
     quindi entra a ZERO e il tetto qui sotto non si muove. Da domani, se
     qualcuno ci riscrive dentro un font piccolo, la pubblicazione si ferma
     invece di lasciarlo passare.
     ⚠️ gestionale-negozio.html NON e' entrato: ne ha ancora una quarantina,
     e metterlo dentro adesso vorrebbe dire alzare il tetto — cioe' il
     contrario di quello che serve. Entrera' quando saranno sistemate. */
  'gestionale-noleggio.html',
  /* ⛔ 26 agosto 2026 — e adesso entra anche il NEGOZIO, alla stessa
     condizione del noleggio: le sue 43 misure sotto i 13 px sono state
     portate tutte a 13, quindi entra a ZERO e il tetto qui sotto resta
     dov'e'. Provate in tre modi (il foglio, gli elementi finti per sapere
     chi vince fra i fogli, e quello che si vede davvero a schermo) piu'
     una quarta prova che nessuna scritta finisca tagliata dal suo
     riquadro: ingrandire un testo puo' farlo uscire, ed e' successo con
     «CATEGORIA FERRAMENTA» nella barra a sinistra. */
  'gestionale-negozio.html',
  'ricarica-crediti.html',
  'css/gestionale.css',
  'js/ai-integrazione.js',
  'js/aiuti.js'
];

/* Indirizzi che esistono anche se non sono file: li fa Netlify. */
const FINTI_MA_VERI = new Set([
  '/', '/.netlify/functions', '/sitemap-offerte.xml'
]);

const errori = [];
const avvisi = [];
function errore(file, cosa){ errori.push({ file, cosa }); }
function avviso(file, cosa){ avvisi.push({ file, cosa }); }

function leggi(p){ return fs.readFileSync(path.join(RADI, p), 'utf8'); }
function esiste(p){ try { return fs.existsSync(path.join(RADI, p)); } catch(e){ return false; } }

/* Tutti gli .html della radice piu' quelli nelle sottocartelle vere. */
function tuttiIFile(ext){
  const fuori = [];
  const salta = new Set(['node_modules', '.git', 'backup', '_to_delete', 'prove-claude',
                         'www', 'android', 'docs', '__pycache__', 'Nuova cartella']);
  (function gira(dir, rel){
    let voci = [];
    try { voci = fs.readdirSync(dir, { withFileTypes: true }); } catch(e){ return; }
    for (const v of voci){
      if (v.name.startsWith('.')) continue;
      const r = rel ? rel + '/' + v.name : v.name;
      if (v.isDirectory()){ if (!salta.has(v.name)) gira(path.join(dir, v.name), r); }
      else if (ext.some(e => v.name.endsWith(e))) fuori.push(r);
    }
  })(RADI, '');
  return fuori;
}

/* ------------------------------------------------------------------ */
/* 1. I LINK CHE PORTANO NEL VUOTO                                     */
/*    E' il controllo per cui questo file esiste.                       */
/* ------------------------------------------------------------------ */
function redirectDiNetlify(){
  const via = new Set();
  if (!esiste('netlify.toml')) return via;
  const t = leggi('netlify.toml');
  const re = /from\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(t)) !== null) via.add(m[1]);
  return via;
}

/* ⚠️ Un rinvio che porta su una pagina che non esiste e' lo stesso difetto
   dei pulsanti: la persona clicca e finisce nel vuoto, solo con un passaggio
   in mezzo. Aggiunto il 16 agosto insieme ai due rinvii per /registrazione
   e /disdetta.html. */
function controllaDoveVannoIRinvii(){
  if (!esiste('netlify.toml')) return;
  const t = leggi('netlify.toml');
  const blocchi = t.split('[[redirects]]').slice(1);
  for (const b of blocchi){
    const da = (b.match(/from\s*=\s*"([^"]+)"/) || [])[1];
    const a  = (b.match(/to\s*=\s*"([^"]+)"/) || [])[1];
    if (!da || !a) continue;
    if (/^(https?:|#)/i.test(a)) continue;          // fuori dal sito, o un'ancora
    const meta = a.split('#')[0].split('?')[0].replace(/^\//, '');
    if (!meta) continue;                            // "/" e "/#registrati"
    if (a.indexOf('/.netlify/') === 0) continue;    // lo serve Netlify
    if (esiste(meta) || esiste(meta + '.html')) continue;
    errore('netlify.toml', 'il rinvio da ' + da + ' porta a ' + a + ', che non esiste');
  }
}

function controllaLink(){
  const redirect = redirectDiNetlify();
  const html = tuttiIFile(['.html']);

  for (const f of html){
    let t;
    try { t = leggi(f); } catch(e){ continue; }

    const re = /(?:href|src)\s*=\s*"([^"]*)"/g;
    let m;
    const visti = new Set();
    while ((m = re.exec(t)) !== null){
      let via = m[1].trim();

      // roba costruita dal codice: non si puo' sapere, e non si indovina
      /* ⚠️ Gli indirizzi costruiti dal codice ('<a href="' + x + '">') qui
         arrivano a pezzi: non si possono controllare, e indovinare vuol dire
         gridare al lupo. Se dentro c'e' un apice o un piu', si lascia stare. */
      if (!via) continue;
      if (/\$\{|['"`]|\+/.test(via)) continue;
      if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(via)) continue;
      if (via.indexOf('{{') >= 0) continue;

      via = via.split('#')[0].split('?')[0];
      if (!via) continue;
      if (redirect.has(via) || FINTI_MA_VERI.has(via)) continue;
      if (via.indexOf('/.netlify/') === 0) continue;

      const chiave = via;
      if (visti.has(chiave)) continue;
      visti.add(chiave);

      // relativo alla cartella del file che lo nomina
      const dentro = via.indexOf('/') === 0
        ? via.slice(1)
        : path.posix.join(path.posix.dirname(f), via);

      if (esiste(dentro)) continue;
      if (esiste(dentro + '.html')) continue;          // indirizzi puliti, senza .html
      if (redirect.has('/' + dentro)) continue;

      errore(f, 'porta a una pagina che non esiste: ' + m[1]);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 1b. LA ROBA CHE NON DEVE STARE ONLINE                               */
/*                                                                      */
/* ⚠️ `publish = "."` pubblica TUTTA la cartella, non solo le pagine.   */
/*    Il 18 agosto 2026 si e' scoperto che chiunque poteva scaricare     */
/*    CLAUDE.md, lo schema del database, il codice delle funzioni e un   */
/*    csv con nomi, telefoni ed email di imprese vere. Le chiavi no      */
/*    (stanno nelle variabili di Netlify), ma tutto il resto si'.        */
/*                                                                      */
/*    Si chiude con delle regole in netlify.toml che rispondono 404.     */
/*    Questo controllo guarda che quell'elenco resti COMPLETO: se        */
/*    domani nasce una cartella o un file da tenere fuori e nessuno lo   */
/*    aggiunge, la pubblicazione si ferma invece di metterlo a vista.    */
/*                                                                      */
/*    ⚠️ La regola deve avere tutte e tre le cose: status 404, force     */
/*    true e una pagina esistente. Senza `force` Netlify serve il file   */
/*    vero e la regola non fa NIENTE — sembra chiusa e non lo e'.        */
/* ------------------------------------------------------------------ */
const CARTELLE_PRIVATE = ['sql', 'tools', 'netlify', 'supabase', 'docs', 'backup'];
const CODE_PRIVATE     = ['.md', '.sql', '.csv', '.py', '.txt', '.json'];
/* Questi hanno un'estensione da tenere fuori ma sono fatti apposta per
   stare online: sono i file che leggono Google e i motori. */
/* ⚠️ 23 agosto 2026 — manifest.json e' entrato in questo elenco.
   E' un .json, e i .json qui sono roba da tenere fuori; ma questo e'
   proprio il file che il telefono legge per trasformare il gestionale in
   un'icona sulla schermata Home. Se lo chiudiamo con un 404, l'icona non
   si puo' piu' aggiungere. Dentro non c'e' niente di riservato: nome,
   colori e i disegni delle icone. */
const PUBBLICI_APPOSTA = new Set(['robots.txt', 'llms.txt', 'manifest.json']);
/* Attrezzi da riga di comando: non li carica nessuna pagina, ma hanno
   l'estensione .js come i file veri del sito, quindi vanno detti a mano. */
const ATTREZZI_PRIVATI = ['genera-imprese-citta.js', 'genera-seo-pagine.js'];

function rinviiChiusi(){
  /* Restituisce gli indirizzi che netlify.toml chiude DAVVERO:
     status 404 + force true + una pagina che esiste. */
  const chiusi = new Set();
  if (!esiste('netlify.toml')) return chiusi;
  const blocchi = leggi('netlify.toml').split('[[redirects]]').slice(1);
  for (const b of blocchi){
    const da = (b.match(/from\s*=\s*"([^"]+)"/) || [])[1];
    const a  = (b.match(/to\s*=\s*"([^"]+)"/) || [])[1];
    const st = (b.match(/status\s*=\s*(\d+)/) || [])[1];
    const fz = /force\s*=\s*true/.test(b);
    if (!da || !a || st !== '404' || !fz) continue;
    const meta = a.replace(/^\//, '');
    if (!esiste(meta)) continue;
    chiusi.add(da);
  }
  return chiusi;
}

function controllaRobaPrivata(){
  if (!esiste('netlify.toml')) return;
  const chiusi = rinviiChiusi();
  const scoperti = [];

  for (const c of CARTELLE_PRIVATE){
    if (!esiste(c)) continue;                       // la cartella non c'e': niente da chiudere
    if (!chiusi.has('/' + c + '/*')) scoperti.push('/' + c + '/*');
  }

  let voci = [];
  try { voci = fs.readdirSync(RADI, { withFileTypes: true }); } catch(e){ voci = []; }
  for (const v of voci){
    if (!v.isFile()) continue;
    if (v.name.startsWith('.')) continue;           // .gitignore e compagnia: Netlify non li serve
    if (PUBBLICI_APPOSTA.has(v.name)) continue;
    const daChiudere = CODE_PRIVATE.some(e => v.name.toLowerCase().endsWith(e))
                       || ATTREZZI_PRIVATI.indexOf(v.name) >= 0;
    if (!daChiudere) continue;
    if (!chiusi.has('/' + v.name)) scoperti.push('/' + v.name);
  }

  if (scoperti.length)
    errore('netlify.toml',
      'questa roba finirebbe online e chiunque potrebbe scaricarla: ' + scoperti.join(' · ')
      + '. Va aggiunta come rinvio con status = 404 e force = true (vedi il blocco '
      + '"LA ROBA CHE NON DEVE STARE ONLINE" in netlify.toml)');
}

/* ------------------------------------------------------------------ */
/* 2. I BLOCCHI <script> CHE NON SI LEGGONO                            */
/*    Un errore di sintassi qui vuol dire pagina bianca.                */
/* ------------------------------------------------------------------ */
function controllaScript(){
  for (const f of tuttiIFile(['.html'])){
    let t;
    try { t = leggi(f); } catch(e){ continue; }
    const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    let m, n = 0;
    while ((m = re.exec(t)) !== null){
      const attr = m[1] || '', corpo = m[2] || '';
      n++;
      if (/\bsrc\s*=/.test(attr)) continue;
      if (/type\s*=\s*"[^"]*json/i.test(attr)) continue;     // lo schema si controlla dopo
      if (/type\s*=\s*"module"/i.test(attr)) continue;       // import/export: vm non li legge
      if (!corpo.trim()) continue;
      try { new vm.Script(corpo, { filename: f + ' (script ' + n + ')' }); }
      catch(e){ errore(f, 'il blocco <script> n.' + n + ' ha un errore di sintassi: ' + e.message); }
    }
  }
  for (const f of tuttiIFile(['.js'])){
    if (f.indexOf('node_modules') >= 0) continue;
    let t;
    try { t = leggi(f); } catch(e){ continue; }
    if (/^\s*(import|export)\s/m.test(t)) continue;
    try { new vm.Script(t, { filename: f }); }
    catch(e){ errore(f, 'errore di sintassi: ' + e.message); }
  }
}

/* ------------------------------------------------------------------ */
/* 3. LO SCHEMA PER GOOGLE                                             */
/*    Un JSON rotto e Google butta via il riquadro senza dire niente.   */
/* ------------------------------------------------------------------ */
function controllaSchema(){
  for (const f of tuttiIFile(['.html'])){
    let t;
    try { t = leggi(f); } catch(e){ continue; }
    const re = /<script[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let m, n = 0;
    while ((m = re.exec(t)) !== null){
      n++;
      // ⚠️ articolo.html ha il riquadro VUOTO e lo riempie il codice quando
      //    la pagina si apre: un blocco vuoto non e' uno schema rotto.
      if (!m[1].trim()) continue;
      try { JSON.parse(m[1]); }
      catch(e){ errore(f, 'lo schema per Google n.' + n + ' non e\' JSON valido: ' + e.message); }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. IL TESTO SOTTO I 13 PX, NEL GESTIONALE                           */
/*    Regola del progetto, scritta per la dislessia di chi lo usa.      */
/* ------------------------------------------------------------------ */
/* ⚠️ Oggi nel gestionale ci sono ancora 28 misure sotto i 13 px (il
   calendario, e qualche riga vecchia). Fermare la pubblicazione per quelle
   vorrebbe dire bloccare il sito fin da subito, e questo controllo verrebbe
   spento il giorno stesso. Quindi si fa un SOFFITTO: quelle di oggi si
   elencano fra gli avvisi, ma se il numero SALE la pubblicazione si ferma.
   Il difetto non si allarga mentre nessuno guarda, e il numero si abbassa
   a mano ogni volta che se ne sistema una. */
/* ⛔ 25 agosto 2026 — DA 28 A ZERO.
   Le ventotto erano venticinque in css/gestionale.css e tre in
   gestionale-app.html: la pastiglia di stato a 11 px, il cartellino sopra le
   foto a 9, il nome dell'operatore a 10, le intestazioni delle tabelle e la
   legenda dei reparti a 12, le etichette dentro il grafico a 11.
   Sono state sistemate tutte, quindi il soffitto adesso e' ZERO: da oggi la
   prima misura sotto i 13 px che entra nel gestionale FERMA la pubblicazione,
   invece di nascondersi in mezzo a ventisette gia' note. */
const TETTO_PICCOLI = 0;

function controllaMisure(){
  const trovati = [];
  for (const f of FILE_GESTIONALE){
    if (!esiste(f)) continue;
    leggi(f).split('\n').forEach((r, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(r)) return;            // commenti: non si vedono
      let m;
      const re = /font-size\s*:\s*([0-9]+(?:\.[0-9]+)?)(px|rem)/g;
      while ((m = re.exec(r)) !== null){
        const px = m[2] === 'rem' ? parseFloat(m[1]) * 16 : parseFloat(m[1]);
        if (px < 13) trovati.push(f + ' riga ' + (i+1) + ': ' + px + ' px');
      }
      const re2 = /font\s*:\s*[^;{}"']*?\b([0-9]+(?:\.[0-9]+)?)px/g;
      while ((m = re2.exec(r)) !== null){
        if (parseFloat(m[1]) < 13) trovati.push(f + ' riga ' + (i+1) + ': ' + m[1] + ' px');
      }
    });
  }
  if (trovati.length > TETTO_PICCOLI){
    errore('il gestionale',
      'i testi sotto i 13 px sono passati da ' + TETTO_PICCOLI + ' a ' + trovati.length +
      '. Quelli nuovi: ' + trovati.slice(TETTO_PICCOLI).join(' · '));
  } else if (trovati.length){
    avviso('il gestionale', trovati.length + ' testi sotto i 13 px, gia\' noti '
      + '(il tetto e\' ' + TETTO_PICCOLI + ': se ne sistemi qualcuno, abbassalo in tools/controllo-push.js)');
  }
}

/* ------------------------------------------------------------------ */
/* 5. LE FINESTRELLE PICCOLE SUI MODULI                                */
/*    Regola fissa di Alessio: i moduli vanno in openSheetGrande.       */
/* ------------------------------------------------------------------ */
function controllaFinestre(){
  const f = 'gestionale-app.html';
  if (!esiste(f)) return;
  const t = leggi(f);
  // solo le chiamate con il testo diretto: `openSheet(\`...`
  const quante = (t.match(/openSheet\(`/g) || []).length;
  if (quante > 1)
    errore(f, 'ci sono ' + quante + ' finestrelle piccole (openSheet) sui moduli: '
             + 'ne e\' ammessa una sola, la vista del giorno del calendario');
}

/* ------------------------------------------------------------------ */
/* AVVISI — si leggono, non fermano niente                             */
/* ------------------------------------------------------------------ */
function guardaGliAccenti(){
  const parole = ['e','puo','piu','perche','gia','cosi','sara','cioe','pero','citta',
                  'qualita','verita','novita','liberta','potra','dara','fara','avra'];
  const re = new RegExp('>\\s*[^<>]*?(?:^|[\\s(«"])(' + parole.join('|') + ")'(?=[\\s.,;:!?])", 'i');
  for (const f of tuttiIFile(['.html'])){
    let t;
    try { t = leggi(f); } catch(e){ continue; }
    let n = 0;
    t.split('\n').forEach(r => { if (re.test(r)) n++; });
    if (n) avviso(f, n + ' righe con un accento scritto con l\'apostrofo (guardale)');
  }
}

/* ------------------------------------------------------------------ */
function main(){
  const t0 = Date.now();
  controllaLink();
  controllaDoveVannoIRinvii();
  controllaRobaPrivata();
  controllaScript();
  controllaSchema();
  controllaMisure();
  controllaFinestre();
  guardaGliAccenti();

  const secondi = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('');
  console.log('='.repeat(70));
  console.log('CONTROLLO PRIMA DI PUBBLICARE — ' + secondi + ' secondi');
  console.log('='.repeat(70));

  if (avvisi.length){
    console.log('');
    console.log('DA GUARDARE (non ferma la pubblicazione): ' + avvisi.length);
    avvisi.slice(0, 40).forEach(a => console.log('  · ' + a.file + ' — ' + a.cosa));
    if (avvisi.length > 40) console.log('  · ...e altri ' + (avvisi.length - 40));
  }

  if (!errori.length){
    console.log('');
    console.log('Tutto a posto: il sito puo\' andare online.');
    console.log('='.repeat(70));
    return 0;
  }

  console.log('');
  console.log('⛔ LA PUBBLICAZIONE SI FERMA — ' + errori.length + ' cose rotte:');
  console.log('');
  const perFile = {};
  errori.forEach(e => { (perFile[e.file] = perFile[e.file] || []).push(e.cosa); });
  Object.keys(perFile).sort().forEach(f => {
    console.log('  ' + f);
    perFile[f].forEach(c => console.log('      ' + c));
  });
  console.log('');
  console.log('Il sito online NON e\' cambiato: e\' rimasto quello di prima.');
  console.log('='.repeat(70));
  return 1;
}

process.exit(main());
