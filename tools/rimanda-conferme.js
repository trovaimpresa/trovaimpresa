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
 * USO
 *   node tools/rimanda-conferme.js            → SOLO ELENCO, non manda niente
 *   node tools/rimanda-conferme.js --invia    → manda davvero
 *
 * Parte in modo innocuo apposta: si guarda la lista, poi si decide.
 * Fra una mail e l'altra aspetta 6 secondi, se no Supabase blocca per
 * troppe richieste.
 */

const SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

const INVIA = process.argv.includes('--invia');
const PAUSA_MS = 6000;

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

async function leggiImprese() {
  const url = `${SUPABASE_URL}/rest/v1/imprese?select=id,nome,email,telefono,partita_iva,citta,created_at,email_confermata&is_test=eq.false&order=id.asc`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

async function rimanda(email) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'signup', email })
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
  return true;
}

function giorni(iso) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}

// Parte solo se lo lanci tu con `node tools/rimanda-conferme.js`.
// Se questo file viene solo importato (per collaudare le funzioni qui sopra)
// non deve partire da solo, ne' provare a chiamare Supabase.
async function main() {
  const tutte = await leggiImprese();
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

  console.log(INVIA ? 'INVIO IN CORSO:' : 'ELENCO (non sto mandando niente — aggiungi --invia per mandare davvero):');
  let ok = 0, ko = 0;
  for (const s of daFare) {
    const riga = `  ${s.nome} · ${s.citta} · ${s.email} · iscritto ${giorni(s.created_at)} giorni fa`;
    if (!INVIA) { console.log(riga); continue; }
    try {
      await rimanda(s.email);
      ok++;
      console.log(`  OK    ${riga.trim()}`);
    } catch (e) {
      ko++;
      console.log(`  ERRORE ${s.email} → ${e.message}`);
    }
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  if (INVIA) {
    console.log(`\nFatto. Mandate: ${ok} · Errori: ${ko}`);
    console.log('Chi clicca il link torna visibile sul sito da solo, senza rilanciare niente.');
    console.log('Ricordati poi: node genera-imprese-citta.js per rimetterli nelle pagine citta.');
  } else {
    console.log(`\nSarebbero ${daFare.length} mail. Per mandarle davvero:`);
    console.log('  node tools/rimanda-conferme.js --invia');
  }
}

if (require.main === module) {
  main().catch(e => { console.error('\nSi e\' fermato:', e.message); process.exit(1); });
}

module.exports = { gemellaConfermata, coda9, piva };
