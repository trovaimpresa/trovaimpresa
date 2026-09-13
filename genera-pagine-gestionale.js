/* ============================================================
   Generatore pagine GESTIONALE per Google — TrovaImpresa
   node genera-pagine-gestionale.js            (prova a vuoto)
   node genera-pagine-gestionale.js --scrivi   (scrive i file)

   Tre famiglie di pagine:
     1. IL PROBLEMA   software computo metrico, preventivi, cantieri...
     2. IL MESTIERE   gestionale per idraulici, elettricisti, geometri...
     3. IL CONFRONTO  quanto costa, gratis, alternativa

   ⛔ La grafica NON e' riscritta a memoria: CSS, barra in alto e piede
      vengono LETTI da software-gestionale-imprese-edili.html, che resta
      il modello. Se un giorno cambia quella pagina, cambiano tutte.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const BASE = 'https://trovaimpresa.com';
const MODELLO = 'software-gestionale-imprese-edili.html';
const OGGI = new Date().toISOString().slice(0, 10);
const SCRIVI = process.argv.includes('--scrivi');

/* ---------- 1. Si prendono i pezzi dal modello ---------- */
function pezzoFraTag(testo, apre, chiude, incluso) {
  const a = testo.indexOf(apre);
  if (a === -1) return null;
  const b = testo.indexOf(chiude, a);
  if (b === -1) return null;
  return incluso ? testo.slice(a, b + chiude.length) : testo.slice(a + apre.length, b);
}

const modelloPath = path.join(OUT, MODELLO);
if (!fs.existsSync(modelloPath)) {
  console.error('⛔ Manca il modello ' + MODELLO + '. Il generatore si ferma:');
  console.error('   senza il modello la grafica sarebbe inventata, e non deve esserlo.');
  process.exit(1);
}
const modello = fs.readFileSync(modelloPath, 'utf8');

const CSS = pezzoFraTag(modello, '<style>', '</style>', false);
const NAVBAR = pezzoFraTag(modello, '<nav class="navbar">', '</nav>', true);
const FOOTER = pezzoFraTag(modello, '<footer>', '</footer>', true);

for (const [nome, val] of [['CSS', CSS], ['barra in alto', NAVBAR], ['piede', FOOTER]]) {
  if (!val) { console.error('⛔ Non trovo ' + nome + ' dentro ' + MODELLO); process.exit(1); }
}

/* ---------- 2. Utilita' ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// per i JSON-LD: niente tag, niente virgolette che rompono il JSON
const testoPulito = s => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* I blocchi: ogni voce di `sezioni` e' un pezzo di pagina.
   Si scrivono corti nei dati, qui diventano HTML. */
function blocco(b) {
  if (typeof b === 'string') return `    <p>${b}</p>`;
  switch (b.t) {
    case 'p':      return `    <p>${b.x}</p>`;
    case 'lead':   return `    <p class="lead">${b.x}</p>`;
    case 'h3':     return `    <h3>${b.x}</h3>`;
    case 'nota':   return `    <div class="note">${b.x}</div>`;
    case 'espe':   return `    <div class="esperienza">${b.x}</div>`;
    case 'corr':   return `    <div class="related">${b.x}</div>`;
    case 'ok':
      return `    <ul class="checklist ok-list">\n${b.righe.map(r => `      <li>${r}</li>`).join('\n')}\n    </ul>`;
    case 'err':
      return `    <ul class="checklist err-list">\n${b.righe.map(r => `      <li>${r}</li>`).join('\n')}\n    </ul>`;
    case 'tab':
      return `    <table>\n      <thead>\n        <tr>${b.testa.map(c => `<th>${c}</th>`).join('')}</tr>\n      </thead>\n      <tbody>\n` +
        b.righe.map(r => `        <tr>${r.map((c, i) => `<td${i > 0 && b.num ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('\n') +
        `\n      </tbody>\n    </table>`;
    case 'fig':
      return `    <figure${b.tel ? ' class="tel"' : ''}>\n` +
        `      <img src="${b.src}" width="${b.w}" height="${b.h}" loading="lazy" alt="${esc(b.alt)}">\n` +
        `      <figcaption>${b.cap}</figcaption>\n    </figure>`;
    default:
      throw new Error('Blocco sconosciuto: ' + JSON.stringify(b).slice(0, 80));
  }
}

/* Il riquadro del prezzo: uno solo, uguale su tutte le pagine.
   ⛔ I prezzi stanno SOLO qui dentro. Se cambiano, si cambia questa
      funzione, non 28 pagine. */
const PREZZO_ANNO = '249 €';
const PREZZO_MESE = '29 €';
function riquadroPrezzo(cosa) {
  return `    <div class="prezzo-box">
      <div class="sotto">${cosa} è dentro il Premium di TrovaImpresa</div>
      <div class="cifra">${PREZZO_ANNO} all'anno</div>
      <div class="sotto">oppure ${PREZZO_MESE} al mese &middot; prezzo finale, nessuna IVA da aggiungere</div>
      <ul class="checklist ok-list">
        <li><strong>Lo provi 30 giorni gratis</strong>, e non serve la carta di credito.</li>
        <li><strong>Alla fine della prova non parte nessun addebito.</strong> Se non fai nulla resti sul piano gratuito, e il profilo resta online.</li>
        <li>Dentro c'è anche il profilo in evidenza sul marketplace, dove i clienti ti cercano.</li>
        <li>Ricevi regolare fattura per ogni pagamento.</li>
      </ul>
      <p style="margin-top:22px"><a href="/#registrati" class="cta-dark">Provalo 30 giorni gratis</a>
        <span class="cta-sotto">Ti registri con la mail e basta. <a href="/prezzi.html">Vedi tutti i prezzi</a></span></p>
    </div>`;
}

/* Le pagine sorelle in fondo: cosi' nessuna nasce orfana.
   Ogni pagina rimanda al suo gruppo e sempre alla pagina madre. */
function riquadroSorelle(pag, tutte) {
  const sorelle = tutte
    .filter(p => p.slug !== pag.slug && p.famiglia === pag.famiglia)
    .slice(0, 4);
  const righe = sorelle.map(p => `<a href="/${p.slug}.html">${p.link}</a>`);
  righe.push(`<a href="/${MODELLO}">Il gestionale per imprese edili</a>`);
  return `    <div class="related">
      <strong>Vedi anche:</strong> ${righe.join(' &middot; ')}
    </div>`;
}

/* ---------- 3. La pagina ---------- */
function costruisci(pag, tutte) {
  const url = `${BASE}/${pag.slug}`;
  const corpo = pag.sezioni.map(s => {
    if (s.h2) return `    <h2>${s.h2}</h2>\n\n` + s.blocchi.map(blocco).join('\n\n');
    return s.blocchi.map(blocco).join('\n\n');
  }).join('\n\n');

  const faqHtml = pag.faq.map(f =>
    `      <details>\n        <summary>${f.d}</summary>\n        <p>${f.r}</p>\n      </details>`
  ).join('\n');

  const faqJson = pag.faq.map(f => JSON.stringify({
    '@type': 'Question', name: testoPulito(f.d),
    acceptedAnswer: { '@type': 'Answer', text: testoPulito(f.r) }
  })).join(',\n    ');

  const briciole = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Gestionale', item: BASE + '/' + MODELLO.replace('.html', '') },
      { '@type': 'ListItem', position: 3, name: pag.briciola }
    ]
  }, null, 2);

  const app = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: pag.nomeApp, applicationCategory: 'BusinessApplication',
    applicationSubCategory: pag.briciola,
    operatingSystem: 'Web browser, Android, iOS',
    url, inLanguage: 'it-IT',
    description: testoPulito(pag.desc),
    featureList: pag.funzioni,
    offers: {
      '@type': 'Offer', price: '249', priceCurrency: 'EUR',
      url: BASE + '/prezzi.html', availability: 'https://schema.org/InStock',
      description: "Compreso nel piano Premium di TrovaImpresa: 249 euro all'anno oppure 29 euro al mese, con 30 giorni di prova gratuita, senza carta di credito."
    },
    publisher: { '@type': 'Organization', name: 'TrovaImpresa', url: BASE }
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pag.title)}</title>
<meta name="description" content="${esc(pag.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(pag.title)}">
<meta property="og:description" content="${esc(pag.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}/img/gestionale-lavori.webp">
  <meta property="og:image:width" content="1440">
  <meta property="og:image:height" content="971">
<meta property="og:site_name" content="TrovaImpresa">
<style>${CSS}</style>
</head>
<body>

${NAVBAR}

<main class="wrap">
  <nav class="breadcrumb"><a href="/index.html">Home</a> &rsaquo; <a href="/${MODELLO}">Gestionale</a> &rsaquo; ${pag.briciola}</nav>

  <article>
    <h1>${pag.h1}</h1>
    <p class="meta">Aggiornato settembre 2026 &middot; Lettura ${pag.minuti} min</p>

    <div class="answer">
      <strong>In due righe:</strong> ${pag.sommario}
    </div>

${corpo}

    <h2>Quanto costa</h2>

${riquadroPrezzo(pag.cosaCosta)}

    <h2>Domande frequenti</h2>

    <div class="faq">
${faqHtml}
    </div>

${riquadroSorelle(pag, tutte)}

    <div class="cta-band">
      <h3>${pag.ctaTitolo}</h3>
      <p>${pag.ctaTesto}</p>
      <a href="/#registrati" class="cta-dark">Provalo 30 giorni gratis</a>
      <span class="cta-sotto">Nessuna carta di credito &middot; Nessun rinnovo automatico</span>
    </div>

  </article>
</main>

${FOOTER}

<script type="application/ld+json">
${app}
</script>

<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"FAQPage",
  "mainEntity":[
    ${faqJson}
  ]
}
</script>

<script type="application/ld+json">
${briciole}
</script>

  <script src="/js/torna-indietro.js" defer></script>
</body>
</html>
`;
}

/* ---------- 4. Il blocco da innestare nella pagina madre ---------- */
const SEGNO_A = '<!-- INIZIO famiglia gestionale — generato, non scrivere a mano -->';
const SEGNO_B = '<!-- FINE famiglia gestionale -->';

function bloccoMadre(tutte) {
  const gruppo = f => tutte.filter(p => p.famiglia === f);
  const elenco = arr => arr.map(p => `      <li><a href="/${p.slug}.html">${p.link}</a> &mdash; ${p.riga}</li>`).join('\n');
  return `${SEGNO_A}
    <h2>Cerchi una cosa precisa?</h2>

    <p>Questa pagina racconta il gestionale tutto intero. Se invece sei arrivato qui
      cercando una cosa sola, sotto c'è la pagina che parla di quella.</p>

    <h3>Il lavoro che devi fare</h3>
    <ul class="checklist ok-list">
${elenco(gruppo('problema'))}
    </ul>

    <h3>Il tuo mestiere</h3>
    <ul class="checklist ok-list">
${elenco(gruppo('mestiere'))}
    </ul>

    <h3>Prima di decidere</h3>
    <ul class="checklist ok-list">
${elenco(gruppo('confronto'))}
    </ul>
${SEGNO_B}`;
}

/* Si innesta PRIMA di «<h2>Quanto costa</h2>» della pagina madre.
   Se il blocco c'e' gia', si sostituisce: rilanciare non duplica. */
function innestaNellaMadre(html, tutte) {
  const nuovo = bloccoMadre(tutte);
  const a = html.indexOf(SEGNO_A);
  if (a !== -1) {
    const b = html.indexOf(SEGNO_B, a);
    if (b === -1) throw new Error('Trovato il segno di inizio ma non quello di fine nella pagina madre');
    return html.slice(0, a) + nuovo + html.slice(b + SEGNO_B.length);
  }
  const ancora = '    <h2>Quanto costa</h2>';
  const i = html.indexOf(ancora);
  if (i === -1) throw new Error('Nella pagina madre non trovo «<h2>Quanto costa</h2>»: non innesto a caso');
  return html.slice(0, i) + nuovo + '\n\n' + html.slice(i);
}

/* ---------- 5. Sitemap ---------- */
function sitemap(tutte) {
  const righe = tutte.map(p =>
    `  <url>\n    <loc>${BASE}/${p.slug}</loc>\n    <lastmod>${OGGI}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap s.org/schemas/sitemap/0.9">\n${righe}\n</urlset>\n`
    .replace('sitemap s.org', 'sitemaps.org');
}

/* ---------- 6. Controlli prima di scrivere ---------- */
function controlla(tutte) {
  const problemi = [];
  const visti = new Set(), titoli = new Set(), h1 = new Set();

  for (const p of tutte) {
    if (visti.has(p.slug)) problemi.push(`slug doppio: ${p.slug}`);
    visti.add(p.slug);
    if (titoli.has(p.title)) problemi.push(`title doppio: ${p.title}`);
    titoli.add(p.title);
    if (h1.has(p.h1)) problemi.push(`H1 doppio: ${p.h1}`);
    h1.add(p.h1);

    if (p.title.length > 65) problemi.push(`title troppo lungo (${p.title.length}): ${p.slug}`);
    if (p.desc.length > 165) problemi.push(`descrizione troppo lunga (${p.desc.length}): ${p.slug}`);
    if (p.desc.length < 90) problemi.push(`descrizione troppo corta (${p.desc.length}): ${p.slug}`);
    if (!p.faq || p.faq.length < 3) problemi.push(`meno di 3 domande frequenti: ${p.slug}`);
    if (!p.sezioni || p.sezioni.length < 3) problemi.push(`meno di 3 sezioni: ${p.slug}`);
    if (fs.existsSync(path.join(OUT, p.slug + '.html')) && p.slug !== MODELLO.replace('.html',''))
      { /* sovrascrivere va bene, e' un rilancio */ }
  }
  return problemi;
}

/* ---------- 7. Via ---------- */
const PAGINE = require('./dati-pagine-gestionale.js');

const problemi = controlla(PAGINE);
if (problemi.length) {
  console.error('⛔ Controlli non passati, non scrivo niente:');
  problemi.forEach(p => console.error('   - ' + p));
  process.exit(1);
}

let scritte = 0, caratteri = [];
for (const p of PAGINE) {
  const html = costruisci(p, PAGINE);
  const dove = path.join(OUT, p.slug + '.html');
  caratteri.push({ slug: p.slug, n: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length });
  if (SCRIVI) { fs.writeFileSync(dove, html, 'utf8'); scritte++; }
}

// pagina madre
let madre = fs.readFileSync(modelloPath, 'utf8');
const madreNuova = innestaNellaMadre(madre, PAGINE);
if (SCRIVI && madreNuova !== madre) fs.writeFileSync(modelloPath, madreNuova, 'utf8');

// sitemap
const sm = sitemap(PAGINE);
if (SCRIVI) fs.writeFileSync(path.join(OUT, 'sitemap-gestionale.xml'), sm, 'utf8');

const min = caratteri.reduce((a, b) => a.n < b.n ? a : b);
const max = caratteri.reduce((a, b) => a.n > b.n ? a : b);
const media = Math.round(caratteri.reduce((s, c) => s + c.n, 0) / caratteri.length);

console.log('');
console.log('Pagine:            ' + PAGINE.length);
console.log('  il problema:     ' + PAGINE.filter(p => p.famiglia === 'problema').length);
console.log('  il mestiere:     ' + PAGINE.filter(p => p.famiglia === 'mestiere').length);
console.log('  il confronto:    ' + PAGINE.filter(p => p.famiglia === 'confronto').length);
console.log('Testo per pagina:  media ' + media + ' caratteri (min ' + min.n + ' ' + min.slug + ', max ' + max.n + ' ' + max.slug + ')');
console.log('Pagina madre:      ' + (madreNuova !== madre ? 'blocco innestato' : 'gia\' a posto'));
console.log('Sitemap:           sitemap-gestionale.xml, ' + PAGINE.length + ' indirizzi');
console.log(SCRIVI ? '\n✅ Scritte ' + scritte + ' pagine.' : '\n(prova a vuoto — non ho scritto niente. Rilancia con --scrivi)');
console.log('');
