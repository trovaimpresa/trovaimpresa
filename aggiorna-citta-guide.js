#!/usr/bin/env node
/* ============================================================
   AGGIORNA-CITTA-GUIDE.JS
   12 settembre 2026

   A COSA SERVE.
   In fondo alle guide «quanto costa» c'e' un riquadro con i
   pulsanti delle citta' («Trova un muratore nella tua citta'»).
   Quei pulsanti erano scritti a mano, uno per uno, in 22 file.
   Ogni volta che si aggiunge una citta' a genera-mestiere-citta.js
   bisognava riscriverli tutti: prima o poi qualcuno se ne dimentica
   e resta un riquadro con le citta' vecchie.

   COSA FA.
   Legge l'elenco delle citta' direttamente da
   genera-mestiere-citta.js — quello e' l'unico posto dove le citta'
   vanno scritte — e riscrive i pulsanti dentro ogni riquadro,
   tenendo il mestiere o il tecnico che quel riquadro gia' aveva.

   COME SI USA.
     node aggiorna-citta-guide.js            controlla e basta
     node aggiorna-citta-guide.js --scrivi   scrive davvero

   ⚠️ Non tocca titoli, testi, prezzi: solo la riga dei pulsanti.
   ⚠️ Da lanciare DOPO genera-mestiere-citta.js, non prima.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const CARTELLA = __dirname;
const SCRIVI = process.argv.includes('--scrivi');

/* ---- 1. le citta', lette da dove stanno davvero ---- */
function leggiCitta() {
  const src = fs.readFileSync(path.join(CARTELLA, 'genera-mestiere-citta.js'), 'utf8');
  const blocco = src.match(/const CITTA = \[([\s\S]*?)\];/);
  if (!blocco) throw new Error('Non trovo l\'elenco CITTA dentro genera-mestiere-citta.js');
  const citta = [];
  for (const m of blocco[1].matchAll(/slug:\s*'([^']+)'\s*,\s*nome:\s*'([^']+)'/g)) {
    citta.push({ slug: m[1], nome: m[2] });
  }
  if (!citta.length) throw new Error('Elenco CITTA vuoto');
  return citta;
}

/* ---- 2. i riquadri dentro una guida ---- */
const RIQUADRO = /<div class="cities-grid">([\s\S]*?)<\/div>/g;

/* ⚠️ 12 set 2026 — IL GUAIO DEI NOMI DOPPI.
   Il mestiere si deduce dai link che il riquadro ha gia'. Ma
   «/impresa-edile-roma» ha DUE trattini, e una regex ingenua
   ne tirava fuori «impresa»: lo script avrebbe riscritto
   «/impresa-roma», che non esiste, rompendo i link di 22 guide.
   La cura: si toglie dalla fine lo slug della citta' — quello lo
   conosciamo — e quello che resta e' il mestiere, per intero. */
function mestiereDal(href, citta) {
  const dentro = href.replace(/^\//, '');
  for (const c of citta) {
    if (dentro.endsWith('-' + c.slug)) {
      return dentro.slice(0, -(c.slug.length + 1));
    }
  }
  return null;
}

function aggiorna(html, citta) {
  let cambiati = 0, mestieri = [];
  const nuovo = html.replace(RIQUADRO, (tutto, dentro) => {
    const primo = dentro.match(/href="(\/[a-z0-9-]+)"/);
    if (!primo) return tutto;                       // riquadro strano: lo lascio stare
    const mestiere = mestiereDal(primo[1], citta);
    if (!mestiere) return tutto;                    // non riconosco la citta': non tocco niente
    const righe = citta
      .map(c => `        <a href="/${mestiere}-${c.slug}">${c.nome}</a>`)
      .join('\n');
    cambiati++; mestieri.push(mestiere);
    return `<div class="cities-grid">\n${righe}\n      </div>`;
  });
  return { nuovo, cambiati, mestieri };
}

/* ---- 3. giro su tutte le guide ---- */
const citta = leggiCitta();
console.log(`Citta' trovate in genera-mestiere-citta.js: ${citta.length}`);
console.log(citta.map(c => c.nome).join(' · '));
console.log('');

const files = fs.readdirSync(CARTELLA).filter(f => f.endsWith('.html'));
let toccati = 0, riquadri = 0;

for (const f of files) {
  const p = path.join(CARTELLA, f);
  const html = fs.readFileSync(p, 'utf8');
  if (!html.includes('cities-grid')) continue;

  const { nuovo, cambiati, mestieri } = aggiorna(html, citta);
  if (nuovo === html) continue;

  console.log(`· ${f} — ${cambiati} riquadro/i (${mestieri.join(', ')})`);
  if (SCRIVI) fs.writeFileSync(p, nuovo, 'utf8');
  toccati++; riquadri += cambiati;
}

console.log('');
console.log('='.repeat(60));
if (!toccati) {
  console.log('Tutti i riquadri sono gia\' aggiornati. Niente da fare.');
} else if (SCRIVI) {
  console.log(`Scritte ${toccati} guide, ${riquadri} riquadri, ${citta.length} citta' ciascuno.`);
} else {
  console.log(`PROVA A VUOTO: ${toccati} guide da aggiornare, ${riquadri} riquadri.`);
  console.log('Per scrivere davvero:  node aggiorna-citta-guide.js --scrivi');
}
console.log('='.repeat(60));
