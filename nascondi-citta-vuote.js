/**
 * nascondi-citta-vuote.js — 4 nov 2026
 *
 * Stessa regola del 27 set 2026 per le pagine mestiere+citta', allargata alle
 * 106 pagine citta' (imprese-<citta>.html):
 *   - citta' SENZA imprese  -> <meta name="robots" content="noindex, follow">
 *                              e fuori da sitemap.xml
 *   - citta' CON imprese    -> il noindex si toglie e la pagina torna in sitemap.xml
 *
 * Motivo: AdSense ha rifiutato il sito («violazioni delle norme») e Google vede
 * le pagine citta' vuote come contenuto di scarso valore.
 *
 * Lo usa genera-imprese-citta.js a ogni giro (cosi' quando un'impresa si iscrive
 * in una citta', la pagina torna su Google da sola).
 * Si puo' anche lanciare a mano:  node nascondi-citta-vuote.js
 *   -> guarda se ogni pagina ha la sezione IMPRESE-LOCALI e decide da li'.
 */

const fs = require('fs');
const path = require('path');

const META = '<meta name="robots" content="noindex, follow">';
const RE_META = /\n?<meta name="robots" content="noindex, follow">(<!-- citta-vuota -->)?/g;
const SITEMAP = path.join(__dirname, 'sitemap.xml');

// Mette o toglie il noindex nell'HTML di una pagina citta'.
function segnaPagina(html, vuota) {
  html = html.replace(RE_META, '');
  if (vuota) {
    html = html.replace(
      /(<meta name="viewport"[^>]*>)/,
      `$1\n${META}<!-- citta-vuota -->`
    );
  }
  return html;
}

// Toglie o rimette la pagina in sitemap.xml. slug = "imprese-enna"
function aggiornaSitemap(slug, vuota) {
  if (!fs.existsSync(SITEMAP)) return;
  let xml = fs.readFileSync(SITEMAP, 'utf8');
  const loc = `https://trovaimpresa.com/${slug}`;
  const reUrl = new RegExp(
    `\\s*<url>\\s*<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?</url>`
  );
  const presente = reUrl.test(xml);
  if (vuota && presente) {
    xml = xml.replace(reUrl, '');
  } else if (!vuota && !presente) {
    const oggi = new Date().toISOString().slice(0, 10);
    xml = xml.replace(
      '</urlset>',
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${oggi}</lastmod>\n    <priority>0.8</priority>\n  </url>\n</urlset>`
    );
  } else {
    return;
  }
  fs.writeFileSync(SITEMAP, xml, 'utf8');
}

module.exports = { segnaPagina, aggiornaSitemap };

// Lancio a mano: decide guardando la sezione delle imprese nella pagina.
if (require.main === module) {
  const dir = __dirname;
  const files = fs.readdirSync(dir).filter((f) => /^imprese-.+\.html$/.test(f));
  let nascoste = 0, visibili = 0;
  for (const file of files) {
    const fp = path.join(dir, file);
    const html = fs.readFileSync(fp, 'utf8');
    const vuota = !html.includes('<!-- IMPRESE-LOCALI-START -->');
    fs.writeFileSync(fp, segnaPagina(html, vuota), 'utf8');
    aggiornaSitemap(path.basename(file, '.html'), vuota);
    vuota ? nascoste++ : visibili++;
  }
  console.log(`Pagine citta': ${visibili} visibili su Google, ${nascoste} nascoste (senza imprese).`);
}
