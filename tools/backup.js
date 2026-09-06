#!/usr/bin/env node
/* =====================================================================
   BACKUP DI TROVAIMPRESA — copia di sicurezza fatta a mano

   Sul piano gratis di Supabase NON c'e' nessun backup automatico. Se
   domani succede qualcosa al database, i lavori, le fatture e i clienti
   delle imprese non si recuperano. Questo comando li mette al sicuro.

   Salva DUE cose in una cartella con la data:
     · TUTTE le tabelle, una per file, in JSON
     · TUTTI i file dei bucket (foto, video, loghi, certificazioni...)

   Lo schema del database NON si salva qui: sta gia' nei file di `sql/`,
   che sono la fonte di verita'. Per rimettere in piedi tutto: prima si
   rilanciano quelli, poi si ricaricano questi JSON.

   COME SI USA
     node tools/backup.js

   LA CHIAVE
     Serve la chiave "service_role" di Supabase, che vede tutto.
     Sta in: Supabase → Project Settings → API → service_role.

     ⛔ QUELLA CHIAVE NON VA MAI IN GIT E MAI IN UNA PAGINA DEL SITO.
        Chi ce l'ha legge e cancella qualsiasi cosa, saltando ogni
        controllo. Va scritta solo qui:

           tools/backup-chiavi.txt

        due righe, cosi':
           https://xxxxxxxx.supabase.co
           eyJhbGciOi...   (la service_role)

        Il file e' nel .gitignore: non parte col push.

   ⚠️ QUESTO COMANDO NON SCRIVE NIENTE SU SUPABASE. Solo legge.
   ===================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* Dove siamo e dove scriviamo                                         */
/* ------------------------------------------------------------------ */
const RADICE   = path.resolve(__dirname, '..');
const CHIAVI   = path.join(__dirname, 'backup-chiavi.txt');
const PAGINA   = 1000;    // righe per volta: Supabase non ne da' di piu'
const TENTATIVI = 3;      // se la rete fa i capricci, si riprova

function oggi() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
         '_' + p(d.getHours()) + p(d.getMinutes());
}

/* ------------------------------------------------------------------ */
/* Le chiavi                                                           */
/* ------------------------------------------------------------------ */
function leggiChiavi() {
  /* si possono passare anche cosi', se uno preferisce:
     SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node tools/backup.js */
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
    return { url: process.env.SUPABASE_URL.replace(/\/+$/, ''),
             key: process.env.SUPABASE_SERVICE_KEY };

  if (!fs.existsSync(CHIAVI)) {
    console.error('\n⛔ Manca il file con le chiavi.\n');
    console.error('   Crealo qui:  tools/backup-chiavi.txt');
    console.error('   Due righe:');
    console.error('     https://xxxxxxxx.supabase.co');
    console.error('     eyJhbGciOi...   (la chiave service_role)\n');
    console.error('   La trovi su Supabase → Project Settings → API → service_role.\n');
    process.exit(1);
  }
  const righe = fs.readFileSync(CHIAVI, 'utf8')
    .split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('#'));
  if (righe.length < 2) {
    console.error('\n⛔ tools/backup-chiavi.txt deve avere due righe: prima l indirizzo, poi la chiave.\n');
    process.exit(1);
  }
  return { url: righe[0].replace(/\/+$/, ''), key: righe[1] };
}

/* ------------------------------------------------------------------ */
/* Una chiamata, con qualche tentativo se la rete cade                 */
/* ------------------------------------------------------------------ */
async function chiama(url, opzioni, tentativo) {
  tentativo = tentativo || 1;
  try {
    const r = await fetch(url, opzioni);
    /* 5xx: puo' essere un inciampo del server, si riprova.
       4xx: e' colpa nostra (chiave sbagliata, tabella che non c'e'):
       riprovare non serve a niente. */
    if (r.status >= 500 && tentativo < TENTATIVI) {
      await new Promise(s => setTimeout(s, 800 * tentativo));
      return chiama(url, opzioni, tentativo + 1);
    }
    return r;
  } catch (e) {
    if (tentativo < TENTATIVI) {
      await new Promise(s => setTimeout(s, 800 * tentativo));
      return chiama(url, opzioni, tentativo + 1);
    }
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* PARTE 1 — le tabelle                                                */
/* ------------------------------------------------------------------ */

/* L'elenco delle tabelle non si scrive a mano: Supabase lo pubblica da
   solo. Cosi' una tabella nuova finisce nel backup senza che nessuno si
   ricordi di aggiungerla qui. */
async function elencoTabelle(url, key) {
  const r = await chiama(url + '/rest/v1/', {
    headers: { apikey: key, Authorization: 'Bearer ' + key, Accept: 'application/openapi+json' }
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error('non riesco a leggere l elenco delle tabelle (' + r.status + '). ' + t.slice(0, 200));
  }
  const spec = await r.json();
  const def = spec.definitions || (spec.components && spec.components.schemas) || {};
  return Object.keys(def).filter(n => !n.startsWith('(')).sort();
}

async function salvaTabella(url, key, tab, dove) {
  let righe = [], da = 0;
  for (;;) {
    const r = await chiama(
      url + '/rest/v1/' + encodeURIComponent(tab) + '?select=*',
      { headers: {
          apikey: key, Authorization: 'Bearer ' + key,
          Range: da + '-' + (da + PAGINA - 1),
          'Range-Unit': 'items'
      } }
    );
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 160));
    }
    const pezzo = await r.json();
    if (!Array.isArray(pezzo)) throw new Error('risposta strana, non e un elenco');
    righe = righe.concat(pezzo);
    if (pezzo.length < PAGINA) break;      // finita
    da += PAGINA;
  }
  fs.writeFileSync(path.join(dove, tab + '.json'), JSON.stringify(righe, null, 1));
  return righe.length;
}

/* ------------------------------------------------------------------ */
/* PARTE 2 — i file dei bucket                                         */
/* ------------------------------------------------------------------ */
async function elencoBucket(url, key) {
  const r = await chiama(url + '/storage/v1/bucket',
    { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error('non riesco a leggere i bucket (' + r.status + ')');
  return (await r.json()).map(b => b.name).sort();
}

/* La lista dei file non e' ricorsiva: le cartelle tornano con id null.
   Quindi si scende a mano, cartella per cartella. */
async function elencoFile(url, key, bucket, prefisso) {
  const dentro = [];
  let da = 0;
  for (;;) {
    const r = await chiama(url + '/storage/v1/object/list/' + encodeURIComponent(bucket), {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: prefisso, limit: PAGINA, offset: da,
                             sortBy: { column: 'name', order: 'asc' } })
    });
    if (!r.ok) throw new Error('non riesco a leggere dentro «' + bucket + '» (' + r.status + ')');
    const pezzo = await r.json();
    if (!Array.isArray(pezzo)) throw new Error('risposta strana da «' + bucket + '»');
    for (const o of pezzo) {
      const intero = prefisso ? prefisso + '/' + o.name : o.name;
      if (o.id === null || o.id === undefined) {
        /* e' una cartella: si scende dentro */
        const sotto = await elencoFile(url, key, bucket, intero);
        dentro.push(...sotto);
      } else {
        dentro.push({ percorso: intero, byte: (o.metadata && o.metadata.size) || 0 });
      }
    }
    if (pezzo.length < PAGINA) break;
    da += PAGINA;
  }
  return dentro;
}

async function scaricaFile(url, key, bucket, percorso, dove) {
  const r = await chiama(
    url + '/storage/v1/object/' + encodeURIComponent(bucket) + '/' +
      percorso.split('/').map(encodeURIComponent).join('/'),
    { headers: { apikey: key, Authorization: 'Bearer ' + key } }
  );
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const dati = Buffer.from(await r.arrayBuffer());
  const destinazione = path.join(dove, bucket, percorso);
  fs.mkdirSync(path.dirname(destinazione), { recursive: true });
  fs.writeFileSync(destinazione, dati);
  return dati.length;
}

/* ------------------------------------------------------------------ */
/* Il lavoro                                                           */
/* ------------------------------------------------------------------ */
function mb(byte) { return (byte / 1048576).toFixed(1); }

(async () => {
  const { url, key } = leggiChiavi();
  const nome   = 'backup-' + oggi();
  const cartella = path.join(RADICE, 'backup', nome);
  const dirTab = path.join(cartella, 'tabelle');
  const dirFil = path.join(cartella, 'file');
  fs.mkdirSync(dirTab, { recursive: true });
  fs.mkdirSync(dirFil, { recursive: true });

  console.log('\n══════════════════════════════════════════════════');
  console.log('  BACKUP DI TROVAIMPRESA');
  console.log('  ' + url);
  console.log('  → backup/' + nome);
  console.log('══════════════════════════════════════════════════\n');

  const guasti = [];
  let righeTot = 0, byteTot = 0, fileTot = 0;

  /* ---- le tabelle ---- */
  let tabelle = [];
  try {
    tabelle = await elencoTabelle(url, key);
  } catch (e) {
    console.error('⛔ ' + e.message);
    console.error('\n   Se dice 401 o 403: la chiave e sbagliata, oppure non e la service_role.\n');
    process.exit(1);
  }
  console.log('LE TABELLE — ne ho trovate ' + tabelle.length + '\n');

  for (const t of tabelle) {
    try {
      const n = await salvaTabella(url, key, t, dirTab);
      righeTot += n;
      console.log('  ok      ' + t.padEnd(28) + String(n).padStart(7) + ' righe');
    } catch (e) {
      guasti.push('tabella ' + t + ': ' + e.message);
      console.log('  GUASTO  ' + t.padEnd(28) + e.message);
    }
  }

  /* ---- i file ---- */
  console.log('\nI FILE\n');
  let bucket = [];
  try {
    bucket = await elencoBucket(url, key);
  } catch (e) {
    guasti.push(e.message);
    console.log('  GUASTO  non riesco a leggere l elenco dei bucket: ' + e.message);
  }

  for (const b of bucket) {
    let lista = [];
    try {
      lista = await elencoFile(url, key, b, '');
    } catch (e) {
      guasti.push('bucket ' + b + ': ' + e.message);
      console.log('  GUASTO  ' + b.padEnd(28) + e.message);
      continue;
    }
    let presi = 0, byte = 0;
    for (const f of lista) {
      try {
        byte += await scaricaFile(url, key, b, f.percorso, dirFil);
        presi++;
      } catch (e) {
        guasti.push('file ' + b + '/' + f.percorso + ': ' + e.message);
      }
    }
    fileTot += presi; byteTot += byte;
    const nota = presi === lista.length ? '' : '   ⛔ ne mancano ' + (lista.length - presi);
    console.log('  ' + (presi === lista.length ? 'ok    ' : 'GUASTO') + '  ' +
                b.padEnd(28) + String(presi).padStart(5) + ' file · ' +
                mb(byte).padStart(7) + ' MB' + nota);
  }

  /* ---- il foglietto dentro la cartella ---- */
  const riepilogo =
    'BACKUP DI TROVAIMPRESA\n' +
    'fatto il ' + new Date().toLocaleString('it-IT') + '\n' +
    'da ' + url + '\n\n' +
    'tabelle salvate : ' + tabelle.length + '\n' +
    'righe in tutto  : ' + righeTot + '\n' +
    'file salvati    : ' + fileTot + '\n' +
    'peso dei file   : ' + mb(byteTot) + ' MB\n' +
    'guasti          : ' + guasti.length + '\n' +
    (guasti.length ? '\n' + guasti.map(g => '  ⛔ ' + g).join('\n') + '\n' : '') +
    '\nPER RIMETTERE IN PIEDI TUTTO:\n' +
    '  1. si ricrea lo schema con i file di sql/ (sono la fonte di verita)\n' +
    '  2. si ricaricano i JSON di tabelle/\n' +
    '  3. si ricaricano i file di file/ nei bucket con lo stesso nome\n';
  fs.writeFileSync(path.join(cartella, 'RIEPILOGO.txt'), riepilogo);

  /* ---- come e andata ---- */
  console.log('\n══════════════════════════════════════════════════');
  console.log('  ' + tabelle.length + ' tabelle · ' + righeTot + ' righe · ' +
              fileTot + ' file · ' + mb(byteTot) + ' MB');
  if (guasti.length) {
    console.log('\n  ⛔ IL BACKUP NON E COMPLETO: ' + guasti.length + ' guasti.');
    console.log('     Sono scritti dentro backup/' + nome + '/RIEPILOGO.txt');
    console.log('     Rilancialo, e se ricapita dimmelo.');
    console.log('══════════════════════════════════════════════════\n');
    process.exit(1);
  }
  console.log('\n  ✅ Tutto salvato in  backup/' + nome);
  console.log('\n  ⚠️ Adesso copiala su un disco esterno o su Drive.');
  console.log('     Un backup che sta solo su questo computer non e un backup.');
  console.log('══════════════════════════════════════════════════\n');
})().catch(e => {
  console.error('\n⛔ Il backup si e fermato: ' + e.message + '\n');
  process.exit(1);
});
