#!/usr/bin/env node
/* ============================================================
   AGGIORNA-CATEGORIE-CITTA.JS
   12 settembre 2026

   A COSA SERVE.
   Nelle pagine «imprese-<citta>.html» c'e' il riquadro
   «Categorie disponibili a ...». Nelle vecchie pagine quelle
   caselle portavano tutte alla ricerca (/cerca-artigiani.html?…):
   pagine che Google non indicizza, perche' sono ricerche.
   Cosi' le pagine mestiere+citta' (muratore-sassari, geometra-varese…)
   non avevano NESSUN link che ci arrivasse: erano orfane, e una
   pagina orfana Google la ignora anche se sta nella sitemap.

   COSA FA.
   Riscrive quel riquadro in due griglie — «Artigiani e imprese»
   (12 caselle) e «Tecnici e professionisti» (6) — che puntano alle
   pagine vere. Cosi' ogni pagina citta' regala 17 link interni alle
   sue pagine mestiere.

   COME SI USA.
     node aggiorna-categorie-citta.js            controlla e basta
     node aggiorna-categorie-citta.js --scrivi   scrive davvero

   ⚠️ Legge le citta' da genera-mestiere-citta.js: unico elenco.
   ⚠️ Non tocca nient'altro della pagina: ne' testi, ne' paragrafo
      locale, ne' citta' vicine.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const CARTELLA = __dirname;
const SCRIVI = process.argv.includes('--scrivi');

/* ---- le citta', lette da dove stanno davvero ---- */
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

/* ---- le caselle, nello stesso ordine delle pagine gia' fatte ---- */
const ARTIGIANI = [
  ['impresa-edile', '🏗️', 'Imprese Edili'],
  ['muratore', '🧱', 'Muratori'],
  ['idraulico', '🔧', 'Idraulici'],
  ['elettricista', '⚡', 'Elettricisti'],
  ['imbianchino', '🎨', 'Imbianchini'],
  ['piastrellista', '🟫', 'Piastrellisti'],
  ['cartongessista', '🧰', 'Cartongessisti'],
  ['serramentista', '🪟', 'Serramentisti'],
  ['termoidraulico', '🔥', 'Termoidraulici'],
  ['rifacimento-tetti', '🏠', 'Tetti'],
  ['installatore-fotovoltaico', '☀️', 'Fotovoltaico']
];
const TECNICI = [
  ['geometra', '📐', 'Geometri'],
  ['architetto', '🏛️', 'Architetti'],
  ['ingegnere-strutturale', '📏', 'Ingegneri strutturali'],
  ['certificato-energetico', '📗', 'Certificato energetico'],
  ['direttore-lavori', '📋', 'Direttore dei lavori'],
  ['interior-designer', '🛋️', 'Interior designer']
];

const CSS_GRP = `  .grp { font-family:'Playfair Display',serif; font-size:1.15rem; color:#0a2a4d; margin:26px 0 -14px; }\n`;

function casella(href, icona, nome) {
  return `    <a href="${href}" class="cat-card"><div class="cat-icon">${icona}</div><div class="cat-name">${nome}</div></a>`;
}

function griglie(c) {
  const a = ARTIGIANI.map(([s, i, n]) => casella(`/${s}-${c.slug}`, i, n));
  // i falegnami non hanno (ancora) una pagina loro: resta la ricerca
  a.push(casella(`/cerca-artigiani.html?citta=${encodeURIComponent(c.nome)}&mestiere=Falegname`, '🚪', 'Falegnami'));
  const t = TECNICI.map(([s, i, n]) => casella(`/${s}-${c.slug}`, i, n));
  return `  <h3 class="grp">Artigiani e imprese</h3>\n`
       + `  <div class="categorie">\n${a.join('\n')}\n  </div>\n`
       + `  <h3 class="grp">Tecnici e professionisti</h3>\n`
       + `  <div class="categorie">\n${t.join('\n')}\n  </div>`;
}

/* ---- il giro ---- */
const citta = leggiCitta();
console.log(`Citta' in elenco: ${citta.length}\n`);

let toccate = 0, saltate = [], gia = 0;

for (const c of citta) {
  const p = path.join(CARTELLA, `imprese-${c.slug}.html`);
  if (!fs.existsSync(p)) { saltate.push(c.slug + ' (file mancante)'); continue; }
  let html = fs.readFileSync(p, 'utf8');
  const prima = html;

  /* 1. il pezzo di CSS per i titoletti, se manca */
  if (!html.includes('.grp {')) {
    const dopo = html.indexOf('\n', html.indexOf('.cat-card {'));
    if (dopo === -1) { saltate.push(c.slug + ' (non trovo .cat-card nel CSS)'); continue; }
    html = html.slice(0, dopo + 1) + CSS_GRP + html.slice(dopo + 1);
  }

  /* 2. le due griglie al posto del vecchio riquadro */
  const inizio = html.search(/<h2>Categorie disponibili a [^<]*<\/h2>/);
  if (inizio === -1) { saltate.push(c.slug + ' (non trovo il titolo Categorie)'); continue; }
  const dopoTitolo = html.indexOf('</h2>', inizio) + 5;
  const fine = html.indexOf('<h2>Perch', dopoTitolo);
  if (fine === -1) { saltate.push(c.slug + ' (non trovo la fine del riquadro)'); continue; }

  html = html.slice(0, dopoTitolo) + '\n' + griglie(c) + '\n\n  ' + html.slice(fine);

  if (html === prima) { gia++; continue; }
  const quanti = (griglie(c).match(/cat-card/g) || []).length;
  console.log(`· imprese-${c.slug}.html — ${quanti} caselle`);
  if (SCRIVI) fs.writeFileSync(p, html, 'utf8');
  toccate++;
}

console.log('\n' + '='.repeat(60));
if (saltate.length) console.log('⚠️  Saltate: ' + saltate.join(' · '));
console.log(`Gia' a posto: ${gia}`);
if (SCRIVI) console.log(`Scritte ${toccate} pagine citta'.`);
else console.log(`PROVA A VUOTO: ${toccate} pagine da aggiornare.\nPer scrivere davvero:  node aggiorna-categorie-citta.js --scrivi`);
console.log('='.repeat(60));
