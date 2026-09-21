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
  ['impresa-edile', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x=\"2\" y=\"3\" width=\"20\" height=\"18\" rx=\"2\"/><path d=\"M9 22V12h6v10\"/><path d=\"M2 9h20\"/></svg>', 'Imprese Edili'],
  ['muratore', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"1.5\"/><path d=\"M3 9.5h18\"/><path d=\"M3 15h18\"/><path d=\"M9 4v5.5\"/><path d=\"M15 4v5.5\"/><path d=\"M12 9.5V15\"/><path d=\"M7 15v5\"/><path d=\"M17 15v5\"/></svg>', 'Muratori'],
  ['idraulico', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/></svg>', 'Idraulici'],
  ['elettricista', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\"/></svg>', 'Elettricisti'],
  ['imbianchino', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x=\"3\" y=\"2\" width=\"16\" height=\"6\" rx=\"2\"/><path d=\"M11 15v-2a2 2 0 0 1 2-2h6a2 2 0 0 0 2-2V6\"/><rect x=\"9\" y=\"15\" width=\"4\" height=\"7\" rx=\"1\"/></svg>', 'Imbianchini'],
  ['piastrellista', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 9h18\"/><path d=\"M3 15h18\"/><path d=\"M9 3v18\"/><path d=\"M15 3v18\"/></svg>', 'Piastrellisti'],
  ['cartongessista', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"m12.8 2.2a2 2 0 0 0-1.7 0L2.6 6.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.7 0l8.6-3.9a1 1 0 0 0 0-1.8z\"/><path d=\"m22 12.6-9.2 4.2a2 2 0 0 1-1.7 0L2 12.6\"/><path d=\"m22 17.6-9.2 4.2a2 2 0 0 1-1.7 0L2 17.6\"/></svg>', 'Cartongessisti'],
  ['serramentista', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 12h18\"/><path d=\"M12 3v18\"/></svg>', 'Serramentisti'],
  ['termoidraulico', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/></svg>', 'Termoidraulici'],
  ['rifacimento-tetti', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><path d=\"M9 22V12h6v10\"/></svg>', 'Tetti'],
  ['installatore-fotovoltaico', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.9 4.9 1.4 1.4\"/><path d=\"m17.7 17.7 1.4 1.4\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.3 17.7-1.4 1.4\"/><path d=\"m19.1 4.9-1.4 1.4\"/></svg>', 'Fotovoltaico']
];
const TECNICI = [
  ['geometra', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z\"/><path d=\"m7.5 10.5 2 2\"/><path d=\"m10.5 7.5 2 2\"/><path d=\"m13.5 4.5 2 2\"/><path d=\"m4.5 13.5 2 2\"/></svg>', 'Geometri'],
  ['architetto', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M3 22h18\"/><path d=\"m3 10 9-7 9 7\"/><path d=\"M6 10v12\"/><path d=\"M10 10v12\"/><path d=\"M14 10v12\"/><path d=\"M18 10v12\"/></svg>', 'Architetti'],
  ['ingegnere-strutturale', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M3 4h18\"/><path d=\"M3 20h18\"/><path d=\"M6 4v16\"/><path d=\"M18 4v16\"/><path d=\"m6 4 12 16\"/><path d=\"m18 4-12 16\"/></svg>', 'Ingegneri strutturali'],
  ['certificato-energetico', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"m12 11-2 4h4l-2 4\"/></svg>', 'Certificato energetico'],
  ['direttore-lavori', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\"/><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><path d=\"m9 14 2 2 4-4\"/></svg>', 'Direttore dei lavori'],
  ['interior-designer', '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3\"/><path d=\"M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z\"/><path d=\"M4 18v2\"/><path d=\"M20 18v2\"/></svg>', 'Interior designer']
];

/* 21 set 2026 — le icone disegnate al posto delle faccine. Stesso tratto
   di quelle della home. Va aggiunto anche alle pagine che hanno gia' .grp. */
const CSS_ICONE = `  .cat-ic { width:34px; height:34px; display:block; margin:0 auto 10px; color:#0066ff; }\n`;

const CSS_GRP = `  .grp { font-family:'Playfair Display',serif; font-size:1.15rem; color:#0a2a4d; margin:26px 0 -14px; }
\n`;

function casella(href, icona, nome) {
  return `    <a href="${href}" class="cat-card"><div class="cat-icon">${icona}</div><div class="cat-name">${nome}</div></a>`;
}

function griglie(c) {
  const a = ARTIGIANI.map(([s, i, n]) => casella(`/${s}-${c.slug}`, i, n));
  // i falegnami non hanno (ancora) una pagina loro: resta la ricerca
  a.push(casella(`/cerca-artigiani.html?citta=${encodeURIComponent(c.nome)}&mestiere=Falegname`, '<svg class="cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d=\"M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14\"/><path d=\"M2 20h20\"/><path d=\"M14 12v.01\"/></svg>', 'Falegnami'));
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

  /* 1. il pezzo di CSS per i titoletti e per le icone, se mancano */
  if (!html.includes('.grp {') || !html.includes('.cat-ic {')) {
    const dopo = html.indexOf('\n', html.indexOf('.cat-card {'));
    if (dopo === -1) { saltate.push(c.slug + ' (non trovo .cat-card nel CSS)'); continue; }
    let css = '';
    if (!html.includes('.grp {')) css += CSS_GRP;
    if (!html.includes('.cat-ic {')) css += CSS_ICONE;
    html = html.slice(0, dopo + 1) + css + html.slice(dopo + 1);
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
