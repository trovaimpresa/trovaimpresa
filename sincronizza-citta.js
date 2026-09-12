#!/usr/bin/env node
/* ============================================================
   SINCRONIZZA-CITTA.JS
   12 settembre 2026

   IL PROBLEMA CHE RISOLVE.
   L'elenco delle citta' con le pagine mestiere+citta' stava scritto
   a mano in TRE posti diversi:
     1. genera-mestiere-citta.js   (l'originale, quello vero)
     2. netlify/functions/invia-annuncio.js  (per i link nelle email)
     3. js/condividi-vetrina.js    (per il link nel pannello impresa)
   Bastava aggiornarne due su tre e le imprese ricevevano il link
   della scheda invece che quello della loro pagina, senza che
   nessun errore lo dicesse. E' successo: con 20 citta' su 106,
   53 iscritti su 102 ricevevano il link sbagliato.

   COSA FA.
   Legge l'elenco SOLO da genera-mestiere-citta.js e riscrive
   l'elenco dentro gli altri due file. Niente altro viene toccato.

   COME SI USA.
     node sincronizza-citta.js            controlla e basta
     node sincronizza-citta.js --scrivi   scrive davvero

   ⚠️ Da lanciare ogni volta che si aggiunge o toglie una citta'.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const CARTELLA = __dirname;
const SCRIVI = process.argv.includes('--scrivi');

function leggiCitta() {
  const src = fs.readFileSync(path.join(CARTELLA, 'genera-mestiere-citta.js'), 'utf8');
  const blocco = src.match(/const CITTA = \[([\s\S]*?)\n\];/);
  if (!blocco) throw new Error('Non trovo l\'elenco CITTA dentro genera-mestiere-citta.js');
  const citta = [];
  for (const m of blocco[1].matchAll(/slug:\s*'((?:[^'\\]|\\.)+)'\s*,\s*nome:\s*'((?:[^'\\]|\\.)+)'/g)) {
    citta.push({ slug: m[1].replace(/\\'/g, "'"), nome: m[2].replace(/\\'/g, "'") });
  }
  if (!citta.length) throw new Error('Elenco CITTA vuoto');
  return citta;
}

/* la citta' si riconosce dal NOME scritto nel profilo dell'impresa,
   tutto minuscolo; il valore e' lo slug della pagina. */
function coppie(citta) {
  return citta.map(c => `'${c.nome.toLowerCase().replace(/'/g, "\\'")}': '${c.slug}'`);
}

function aCapoOgni(voci, quante, rientro) {
  const righe = [];
  for (let i = 0; i < voci.length; i += quante) {
    righe.push(rientro + voci.slice(i, i + quante).join(', '));
  }
  return righe.join(',\n');
}

const citta = leggiCitta();
console.log(`Citta' in genera-mestiere-citta.js: ${citta.length}\n`);

const lavori = [
  {
    file: path.join(CARTELLA, 'netlify', 'functions', 'invia-annuncio.js'),
    regex: /const CITTA_CON_PAGINE = \{[\s\S]*?\n\};/,
    testo: 'const CITTA_CON_PAGINE = {\n' + aCapoOgni(coppie(citta), 4, '  ') + '\n};'
  },
  {
    file: path.join(CARTELLA, 'js', 'condividi-vetrina.js'),
    regex: /var CITTA = \{[\s\S]*?\n  \};/,
    testo: '  var CITTA = {\n' + aCapoOgni(coppie(citta), 4, '    ') + '\n  };'
  }
];

let cambiati = 0;
for (const l of lavori) {
  if (!fs.existsSync(l.file)) { console.log(`⚠️  manca ${l.file}`); continue; }
  const html = fs.readFileSync(l.file, 'utf8');
  if (!l.regex.test(html)) { console.log(`⚠️  non trovo l'elenco dentro ${path.basename(l.file)}`); continue; }
  const nuovo = html.replace(l.regex, l.testo);
  const prima = (html.match(l.regex)[0].match(/':\s*'/g) || []).length;
  if (nuovo === html) { console.log(`· ${path.basename(l.file)} — gia' a posto (${prima} citta')`); continue; }
  console.log(`· ${path.basename(l.file)} — da ${prima} a ${citta.length} citta'`);
  if (SCRIVI) fs.writeFileSync(l.file, nuovo, 'utf8');
  cambiati++;
}

console.log('\n' + '='.repeat(60));
if (!cambiati) console.log('Tutto gia\' allineato. Niente da fare.');
else if (SCRIVI) console.log(`Allineati ${cambiati} file all'elenco di genera-mestiere-citta.js.`);
else console.log(`PROVA A VUOTO: ${cambiati} file da allineare.\nPer scrivere davvero:  node sincronizza-citta.js --scrivi`);
console.log('='.repeat(60));
