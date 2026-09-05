/**
 * rimanda-conferme.js — 29 agosto 2026
 *
 * Rimanda la mail di conferma a chi si e' iscritto e non l'ha mai cliccata.
 *
 * PERCHE' ESISTE
 * Il 29/8/2026: 25 schede su 102 non avevano mai confermato l'email. Tutte e
 * 25 avevano compilato il modulo per intero — nome, mestiere, citta', telefono.
 * Non sono schede spazzatura: sono artigiani che si sono fermati sull'ultimo
 * passo. Da quel giorno sono invisibili sul sito (email_confermata = false).
 *
 * ⚠️ CHI VIENE SALTATO, E PERCHE'
 * Chi ha la stessa partita IVA o lo stesso telefono di una scheda GIA'
 * confermata. Sono le prime iscrizioni di chi aveva sbagliato a scrivere la
 * propria email e si e' reiscritto: quella persona e' gia' dentro col secondo
 * profilo. Farle confermare anche il primo vorrebbe dire creare il doppione
 * che abbiamo appena tolto di mezzo.
 *
 * ⛔ 6 SETTEMBRE 2026 — ADESSO VUOLE LA CHIAVE DI SERVIZIO
 * Il 5 settembre la tabella `imprese` e' stata chiusa: dalla vista pubblica
 * `email` e `email_confermata` non escono piu' (apposta). Con la chiave
 * pubblica questo programma trovava 0 righe e sembrava che non ci fosse
 * nessuno da richiamare. Adesso legge con la CHIAVE DI SERVIZIO, che
 * NON sta scritta qui dentro e non deve finire su Git: si passa da fuori,
 * in una variabile d'ambiente.
 *
 * USO — prima si mette la chiave, in PowerShell, UNA volta per finestra:
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "incolla-qui-la-chiave"
 * poi:
 *   node tools/rimanda-conferme.js            → SOLO ELENCO, non manda niente
 *   node tools/rimanda-conferme.js --invia    → manda davvero
 *
 * Parte in modo innocuo apposta: si guarda la lista, poi si decide.
 * Fra una mail e l'altra aspetta 6 secondi.
 *
 * ⏳ IL TETTO DELLE MAIL ALL'ORA (aggiunto il 6 settembre 2026)
 * Supabase ha un tetto di mail di conferma per ora. Prima, superato il
 * tetto, il programma scriveva ERRORE accanto alla persona e passava
 * oltre: quella persona restava fuori e nessuno se ne accorgeva. Adesso
 * quando Supabase risponde 429 il programma NON lo conta come errore:
 * aspetta 1, poi 5, 15, 30, 60 minuti e riprova con la stessa persona.
 * Basta lasciare la finestra aperta.
 *
 * 📓 E si segna chi ha gia' ricevuto, in tools/conferme-mandate.txt: se il
 * programma si ferma a meta' e lo rilanci, riparte da dove era rimasto e
 * a nessuno arrivano due mail uguali. Il file resta sul PC (.gitignore).
 *
 * ALTRE DUE PAROLE CHE PUOI AGGIUNGERE
 *   --quante 3   ne manda solo 3, per vedere se il tetto le lascia passare
 *   --tutti      rimanda anche a chi risulta gia' servito nel quaderno
 *
 * ⚠️ La chiave si chiude quando chiudi la finestra di PowerShell. E'
 * voluto: cosi' non resta scritta da nessuna parte.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';


/* ---------- LA CHIAVE DI SERVIZIO ----------
   Sta SOLO nella variabile d'ambiente. Se non c'e', il programma si ferma
   e spiega a clic dove prenderla: non prova nemmeno a leggere. */
function chiaveDiServizio(ambiente) {
  const env = ambiente || process.env;
  return (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

/* e' davvero quella di servizio, o hai incollato per sbaglio quella pubblica? */
function ruoloDellaChiave(chiave) {
  if (!chiave) return 'niente';
  if (chiave.indexOf('sb_secret_') === 0) return 'service_role';
  if (chiave.indexOf('sb_publishable_') === 0) return 'anon';
  const pezzi = chiave.split('.');
  if (pezzi.length !== 3) return 'sconosciuta';
  try {
    const corpo = JSON.parse(Buffer.from(pezzi[1], 'base64').toString('utf8'));
    return corpo.role || 'sconosciuta';
  } catch (e) { return 'sconosciuta'; }
}

/* le intestazioni con cui si legge la tabella: la chiave arriva da fuori */
function intestazioniLettura(chiave) {
  return { apikey: chiave, Authorization: 'Bearer ' + chiave };
}

const SPIEGAZIONE = [
  '',
  '\u26d4 Manca la chiave di servizio. Non ho letto niente e non ho mandato niente.',
  '',
  'A CLIC, una volta sola per ogni finestra di PowerShell:',
  '',
  '  1. Apri https://supabase.com/dashboard nel browser (account pintoalessio@icloud.com)',
  '  2. Clicca il progetto  nacvrsgkyfavykxjxszu',
  '  3. In basso a sinistra: l\'ingranaggio  Project Settings',
  '  4. Nella colonna di sinistra: API keys',
  '  5. Riga  service_role  (c\'e\' scritto \u00absecret\u00bb): clicca Reveal, poi Copy',
  '  6. Torna su PowerShell, nella cartella del sito, e incolla questa riga',
  '     mettendo la chiave fra le virgolette:',
  '',
  '       $env:SUPABASE_SERVICE_ROLE_KEY = "qui-la-chiave"',
  '',
  '  7. Poi rilancia:  node tools/rimanda-conferme.js',
  '',
  '  Devi vedere: l\'elenco di chi non ha confermato. Niente mail: per mandarle',
  '  davvero serve  --invia,  e prima si guarda l\'elenco.',
  '',
  '\u26a0\ufe0f La chiave NON va scritta dentro nessun file: finirebbe su Git.',
  '   Chiudendo PowerShell sparisce da sola, ed e\' giusto cosi\'.',
  ''
].join('\n');

const INVIA = process.argv.includes('--invia');
const PAUSA_MS = 6000;

/* --tutti  = rimanda anche a chi ha gia' ricevuto in un giro precedente
   --quante N = ne fa solo le prime N (per provare il tetto senza rischiare) */
const DIMENTICA = process.argv.includes('--tutti');
function quanteChieste(argv) {
  const i = (argv || []).indexOf('--quante');
  if (i < 0) return 0;
  const n = parseInt(argv[i + 1], 10);
  return (isFinite(n) && n > 0) ? n : 0;
}
const QUANTE = quanteChieste(process.argv);

function cifre(s) { return String(s || '').replace(/\D/g, ''); }
function coda9(s) { const c = cifre(s); return c.length >= 9 ? c.slice(-9) : ''; }
function piva(s) { const c = cifre(s); return c.length === 11 ? c : ''; }

// Esposte per il banco di prova: stessa persona di una gia' confermata?
function gemellaConfermata(scheda, confermate) {
  const p = piva(scheda.partita_iva);
  const t = coda9(scheda.telefono);
  for (const c of confermate) {
    if (p && p === piva(c.partita_iva)) return { id: c.id, nome: c.nome, motivo: 'stessa partita IVA' };
    if (t && t === coda9(c.telefono)) return { id: c.id, nome: c.nome, motivo: 'stesso telefono' };
  }
  return null;
}

async function leggiImprese(chiave) {
  const url = `${SUPABASE_URL}/rest/v1/imprese?select=id,nome,email,telefono,partita_iva,citta,created_at,email_confermata&is_test=eq.false&order=id.asc`;
  const r = await fetch(url, { headers: intestazioniLettura(chiave) });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

async function rimanda(email) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'signup', email })
  });
  if (r.ok) return { ok: true, stato: r.status, testo: '' };
  return { ok: false, stato: r.status, testo: (await r.text()).slice(0, 160) };
}

function giorni(iso) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}

/* ---------- IL TETTO DELLE MAIL ALL'ORA (6 set 2026) ----------
   Supabase non manda mail all'infinito: c'e' un tetto per ora, e quando lo
   superi risponde 429. NON e' un errore nostro e NON e' una mail persa:
   vuol dire «riprova piu' tardi». Quindi si aspetta e si riprova, invece
   di scrivere ERRORE e passare oltre lasciando fuori la persona. */
const ATTESE_MIN = [1, 5, 15, 30, 60];

function eTetto(stato, testo) {
  if (Number(stato) === 429) return true;
  return /rate limit|too many|over_email_send/i.test(String(testo || ''));
}

function quantoAspettareMin(tentativo) {
  const n = Math.max(1, Math.min(Number(tentativo) || 1, ATTESE_MIN.length));
  return ATTESE_MIN[n - 1];
}

/* ---------- IL QUADERNO DI CHI HA GIA' RICEVUTO ----------
   Il programma puo' fermarsi a meta' (tetto, corrente, finestra chiusa).
   Al giro dopo, chi ha gia' ricevuto viene saltato: a nessuno arrivano due
   mail uguali. Il file resta sul PC — dentro ci sono le email degli
   iscritti e non deve finire su Git (sta in .gitignore). */
const FILE_MANDATE = path.join(__dirname, 'conferme-mandate.txt');

function leggiMandate(testo) {
  const fatte = new Map();
  for (const riga of String(testo || '').split('\n')) {
    const p = riga.trim().split(/\s+/);
    if (p.length >= 2 && p[1].indexOf('@') > 0) fatte.set(p[1].toLowerCase(), p[0]);
  }
  return fatte;
}

function rigaMandata(email, quando) {
  return (quando || new Date().toISOString()) + ' ' + String(email).toLowerCase();
}

function mandateDalFile() {
  try { return leggiMandate(fs.readFileSync(FILE_MANDATE, 'utf8')); }
  catch (e) { return new Map(); }
}

function segnaMandata(email) {
  try { fs.appendFileSync(FILE_MANDATE, rigaMandata(email) + '\n', 'utf8'); }
  catch (e) { console.log('  (non sono riuscito a scrivere il quaderno: ' + e.message + ')'); }
}

// Parte solo se lo lanci tu con `node tools/rimanda-conferme.js`.
// Se questo file viene solo importato (per collaudare le funzioni qui sopra)
// non deve partire da solo, ne' provare a chiamare Supabase.
async function main() {
  const chiave = chiaveDiServizio();
  const ruolo = ruoloDellaChiave(chiave);
  if (!chiave) { console.log(SPIEGAZIONE); process.exit(1); }
  if (ruolo !== 'service_role') {
    console.log('\n\u26d4 Questa non e\' la chiave di servizio: e\' una chiave \u00ab' + ruolo + '\u00bb.');
    console.log('   Con questa la tabella `imprese` risponde 0 righe ed e\' proprio il difetto');
    console.log('   che stiamo chiudendo. Rifai il passo 5 e copia la riga  service_role.');
    process.exit(1);
  }

  const tutte = await leggiImprese(chiave);
  const confermate = tutte.filter(x => x.email_confermata);
  const nonConfermate = tutte.filter(x => !x.email_confermata);

  const daFare = [];
  const saltate = [];
  for (const s of nonConfermate) {
    const g = gemellaConfermata(s, confermate);
    if (g) saltate.push({ s, g }); else daFare.push(s);
  }

  console.log(`\nSchede vere: ${tutte.length} · confermate: ${confermate.length} · non confermate: ${nonConfermate.length}`);
  console.log(`Da ricontattare: ${daFare.length} · saltate perche' gia' dentro con un altro profilo: ${saltate.length}\n`);

  if (saltate.length) {
    console.log('SALTATE:');
    for (const { s, g } of saltate) {
      console.log(`  - ${s.nome} (${s.citta}) — ${g.motivo} della scheda #${g.id} "${g.nome}", gia' confermata`);
    }
    console.log('');
  }

  /* chi ha gia' ricevuto in un giro precedente non lo richiamo */
  const mandate = DIMENTICA ? new Map() : mandateDalFile();
  const gia = daFare.filter(x => mandate.has(String(x.email).toLowerCase()));
  let restano = daFare.filter(x => !mandate.has(String(x.email).toLowerCase()));

  if (gia.length) {
    console.log('GIA\' RICEVUTA in un giro precedente (le salto):');
    for (const x of gia) {
      const quando = String(mandate.get(String(x.email).toLowerCase())).slice(0, 10);
      console.log(`  - ${x.nome} · ${x.email} · mandata il ${quando}`);
    }
    console.log('');
  }

  if (QUANTE && QUANTE < restano.length) {
    console.log(`⚠️  --quante ${QUANTE}: di ${restano.length} ne faccio solo le prime ${QUANTE}.\n`);
    restano = restano.slice(0, QUANTE);
  }

  console.log(INVIA ? 'INVIO IN CORSO:' : 'ELENCO (non sto mandando niente — aggiungi --invia per mandare davvero):');
  let ok = 0, ko = 0, minutiAspettati = 0;
  for (const s of restano) {
    const riga = `  ${s.nome} · ${s.citta} · ${s.email} · iscritto ${giorni(s.created_at)} giorni fa`;
    if (!INVIA) { console.log(riga); continue; }

    for (let tentativo = 1; tentativo <= ATTESE_MIN.length + 1; tentativo++) {
      const esito = await rimanda(s.email);
      if (esito.ok) {
        ok++;
        segnaMandata(s.email);
        console.log(`  OK    ${riga.trim()}`);
        break;
      }
      if (eTetto(esito.stato, esito.testo) && tentativo <= ATTESE_MIN.length) {
        const min = quantoAspettareMin(tentativo);
        minutiAspettati += min;
        console.log(`  ⏳ Supabase dice: troppe mail in poco tempo (${esito.stato}). Non e' un errore e non e' una mail persa.`);
        console.log(`     Aspetto ${min} minuti e riprovo con ${s.email} (tentativo ${tentativo} di ${ATTESE_MIN.length}). Lascia la finestra aperta.`);
        await new Promise(r => setTimeout(r, min * 60000));
        continue;
      }
      ko++;
      console.log(`  ERRORE ${s.email} → ${esito.stato} ${esito.testo}`);
      break;
    }
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  if (INVIA) {
    console.log(`\nFatto. Mandate: ${ok} · Errori: ${ko}`
      + (minutiAspettati ? ` · minuti passati ad aspettare il tetto: ${minutiAspettati}` : ''));
    const ancora = restano.length - ok;
    if (ancora > 0) {
      console.log(`⚠️  Ne restano ${ancora} senza mail: rilancia lo stesso comando quando vuoi.`);
      console.log('   Chi ha gia\' ricevuto viene saltato da solo (quaderno: tools/conferme-mandate.txt).');
    }
    console.log('Chi clicca il link torna visibile sul sito da solo, senza rilanciare niente.');
    console.log('Ricordati poi: node genera-imprese-citta.js per rimetterli nelle pagine citta.');
  } else {
    console.log(`\nSarebbero ${restano.length} mail. Per mandarle davvero:`);
    console.log('  node tools/rimanda-conferme.js --invia');
    console.log('Per provarne prima solo 3, e vedere se il tetto di Supabase le lascia passare:');
    console.log('  node tools/rimanda-conferme.js --invia --quante 3');
  }
}

if (require.main === module) {
  main().catch(e => { console.error('\nSi e\' fermato:', e.message); process.exit(1); });
}

module.exports = { gemellaConfermata, coda9, piva, chiaveDiServizio, ruoloDellaChiave, intestazioniLettura,
                   eTetto, quantoAspettareMin, leggiMandate, rigaMandata, quanteChieste, ATTESE_MIN,
                   rimanda };
