/**
 * modello-email.js — 6 settembre 2026
 *
 * LEGGE e RISCRIVE il testo dell'email di conferma iscrizione che vive
 * dentro Supabase (Authentication → Emails → Confirm sign up), senza
 * aprire il pannello e senza copiare e incollare a mano.
 *
 * PERCHE' ESISTE
 * Quel testo viveva SOLO dentro un pannello. Il 6 settembre 2026 ci e'
 * finito dentro per sbaglio il codice di un banco di prova: l'email
 * spedita sarebbe stata pagine di codice SENZA il link di conferma,
 * cioe' nessuno sarebbe piu' riuscito a iscriversi. Nessun controllo
 * poteva accorgersene, perche' nessun file del progetto lo conteneva.
 * Da oggi il testo vero sta in  docs/email-conferma-iscrizione.html
 * (sotto Git, con la sua storia) e il pannello e' solo una copia che si
 * riallinea con un comando.
 *
 * USO — prima si mette la chiave, in PowerShell, UNA volta per finestra:
 *   $env:SUPABASE_ACCESS_TOKEN = "incolla-qui-la-chiave"
 * poi:
 *   node tools/modello-email.js            → CONFRONTA e basta, non tocca niente
 *   node tools/modello-email.js --scrivi   → manda su il testo del file
 *
 * Parte in modo innocuo apposta: prima si guarda, poi si decide.
 * Prima di scrivere fa sempre una copia di quello che c'e' adesso in
 * docs/, cosi' non si perde niente.
 *
 * ⚠️ La chiave e' quella dell'ACCOUNT (comincia con sbp_): apre tutti i
 * progetti. Non va scritta in nessun file e non deve finire su Git.
 * Chiudendo PowerShell sparisce da sola, ed e' giusto cosi'.
 */

const fs = require('fs');
const path = require('path');

const PROGETTO = 'nacvrsgkyfavykxjxszu';
const API = 'https://api.supabase.com/v1/projects/' + PROGETTO + '/config/auth';
const RADICE = path.join(__dirname, '..');
const FILE_MODELLO = path.join(RADICE, 'docs', 'email-conferma-iscrizione.html');

const SCRIVI = process.argv.includes('--scrivi');

const SPIEGAZIONE = [
  '',
  '⛔ Manca la chiave di accesso. Non ho letto niente e non ho scritto niente.',
  '',
  'A CLIC, una volta sola per ogni finestra di PowerShell:',
  '',
  '  1. Apri  https://supabase.com/dashboard/account/tokens  (account pintoalessio@icloud.com)',
  '  2. Clicca il pulsante  Generate new token',
  '  3. Come nome scrivi  trovaimpresa-da-terminale  e conferma',
  '  4. Clicca Copy: la chiave si vede UNA VOLTA SOLA, comincia con  sbp_',
  '  5. Torna su PowerShell, nella cartella del sito, e incolla questa riga',
  '     mettendo la chiave fra le virgolette:',
  '',
  '       $env:SUPABASE_ACCESS_TOKEN = "qui-la-chiave"',
  '',
  '  6. Poi rilancia:  node tools/modello-email.js',
  '',
  '  Devi vedere: il confronto fra il file del progetto e quello che sta',
  '  adesso dentro Supabase. Niente viene cambiato: per cambiarlo serve  --scrivi.',
  ''
].join('\n');

/* ---------- la chiave ---------- */
function chiaveDiAccesso(ambiente) {
  return ((ambiente || process.env).SUPABASE_ACCESS_TOKEN || '').trim();
}
function sembraChiaveGiusta(chiave) {
  return /^sbp_[A-Za-z0-9_-]{20,}$/.test(String(chiave || ''));
}

/* ---------- il corpo dell'email, preso dal file del progetto ----------
   Il file ha l'involucro <html> e le note in cima: dentro Supabase ci va
   solo la tabella, dal primo <table all'ultimo </table>. */
function corpoDalFile(testo) {
  const senzaNote = String(testo || '').replace(/<!--[\s\S]*?-->/g, '');
  const i = senzaNote.indexOf('<table');
  const j = senzaNote.lastIndexOf('</table>');
  if (i < 0 || j < 0) return '';
  return senzaNote.slice(i, j + '</table>'.length).trim();
}

/* ---------- il controllo che salva la vita ----------
   Non si manda su niente che non sia un'email vera col suo link. */
function problemiDelCorpo(corpo) {
  const t = String(corpo || '');
  const guai = [];
  const quanti = (t.match(/\{\{\s*\.ConfirmationURL\s*\}\}/g) || []).length;
  if (quanti !== 2) guai.push('il link di conferma compare ' + quanti + ' volte invece di 2');
  if (t.trim().indexOf('#!') === 0) guai.push('comincia con #! : e\' un programma, non un\'email');
  if (t.indexOf('<table') !== 0) guai.push('non comincia con <table');
  if (t.length < 800) guai.push('e\' troppo corto: ' + t.length + ' caratteri');
  return guai;
}

/* ---------- dove sono diversi ---------- */
function primaRigaDiversa(a, b) {
  const ra = String(a || '').split('\n'), rb = String(b || '').split('\n');
  const n = Math.max(ra.length, rb.length);
  for (let i = 0; i < n; i++) {
    if ((ra[i] || '') !== (rb[i] || '')) {
      return { riga: i + 1, file: (ra[i] || '(niente)').trim().slice(0, 90),
               supabase: (rb[i] || '(niente)').trim().slice(0, 90) };
    }
  }
  return null;
}

function intestazioni(chiave) {
  return { Authorization: 'Bearer ' + chiave, 'Content-Type': 'application/json' };
}

async function leggiDaSupabase(chiave) {
  const r = await fetch(API, { headers: intestazioni(chiave) });
  if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}

async function scriviSuSupabase(chiave, corpo) {
  const r = await fetch(API, {
    method: 'PATCH',
    headers: intestazioni(chiave),
    body: JSON.stringify({ mailer_templates_confirmation_content: corpo })
  });
  if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}

function quando() {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes());
}

async function main() {
  const chiave = chiaveDiAccesso();
  if (!chiave) { console.log(SPIEGAZIONE); process.exit(1); }
  if (!sembraChiaveGiusta(chiave)) {
    console.log('\n⛔ Questa non sembra la chiave dell\'account: deve cominciare con  sbp_');
    console.log('   (quella del database, service_role, qui non funziona: e\' un\'altra porta.)');
    console.log('   Rifai i passi 1-4 su https://supabase.com/dashboard/account/tokens\n');
    process.exit(1);
  }

  const delFile = corpoDalFile(fs.readFileSync(FILE_MODELLO, 'utf8'));
  const config = await leggiDaSupabase(chiave);
  const suSupabase = String(config.mailer_templates_confirmation_content || '');
  const oggetto = String(config.mailer_subjects_confirmation || '');

  console.log('\n===== IL MODELLO DELL\'EMAIL DI CONFERMA =====');
  console.log('Oggetto dentro Supabase: ' + (oggetto || '(vuoto)'));
  console.log('Nel file del progetto: ' + delFile.length + ' caratteri');
  console.log('Dentro Supabase:       ' + suSupabase.length + ' caratteri');

  const guaiLassu = problemiDelCorpo(suSupabase);
  if (guaiLassu.length) {
    console.log('\n⛔ QUELLO CHE STA DENTRO SUPABASE ADESSO NON VA:');
    for (const g of guaiLassu) console.log('   · ' + g);
    console.log('   Chi si iscrive riceve questo. Sistemalo con:  node tools/modello-email.js --scrivi');
  } else {
    console.log('\n✅ Quello dentro Supabase e\' un\'email vera, col suo link di conferma.');
  }

  const uguali = delFile === suSupabase;
  console.log(uguali
    ? '✅ File e Supabase sono UGUALI: non c\'e\' niente da fare.'
    : '⚠️  File e Supabase sono DIVERSI.');
  if (!uguali) {
    const d = primaRigaDiversa(delFile, suSupabase);
    if (d) {
      console.log('   prima differenza, riga ' + d.riga + ':');
      console.log('     file:     ' + d.file);
      console.log('     supabase: ' + d.supabase);
    }
  }

  if (!SCRIVI) {
    console.log('\nNon ho cambiato niente. Per mandare su il testo del file:');
    console.log('  node tools/modello-email.js --scrivi\n');
    return;
  }

  const guaiFile = problemiDelCorpo(delFile);
  if (guaiFile.length) {
    console.log('\n⛔ NON MANDO SU NIENTE: il file del progetto non va bene.');
    for (const g of guaiFile) console.log('   · ' + g);
    console.log('   file: ' + FILE_MODELLO + '\n');
    process.exit(1);
  }
  if (uguali) { console.log('\nGia\' uguali: non tocco niente.\n'); return; }

  const copia = path.join(RADICE, 'docs', 'modello-email-PRIMA-' + quando() + '.html');
  fs.writeFileSync(copia, suSupabase, 'utf8');
  console.log('\nCopia di quello che c\'era adesso: ' + path.basename(copia));

  await scriviSuSupabase(chiave, delFile);

  const dopo = String((await leggiDaSupabase(chiave)).mailer_templates_confirmation_content || '');
  if (dopo === delFile) {
    console.log('✅ Scritto e ricontrollato: dentro Supabase adesso c\'e\' il testo del file.');
    console.log('   Il link di conferma c\'e\' ' +
      (dopo.match(/\{\{\s*\.ConfirmationURL\s*\}\}/g) || []).length + ' volte.\n');
  } else {
    console.log('⛔ Ho scritto ma il ricontrollo non torna: guarda il pannello a mano.\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(e => { console.error('\nSi e\' fermato:', e.message); process.exit(1); });
}

module.exports = { chiaveDiAccesso, sembraChiaveGiusta, corpoDalFile, problemiDelCorpo,
                   primaRigaDiversa, intestazioni };
