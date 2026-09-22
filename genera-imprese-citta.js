/**
 * genera-imprese-citta.js
 * Inserisce/aggiorna in ogni pagina imprese-<citta>.html una sezione statica
 * con le imprese reali prese da Supabase (visibile a Google, niente JS client).
 *
 * Uso:   node genera-imprese-citta.js
 * Rieseguibile quando vuoi: sostituisce la sezione esistente (marker HTML).
 * Richiede Node 18+ (fetch nativo).
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

const MAX_IMPRESE = 12;          // quante imprese mostrare per città
const START = '<!-- IMPRESE-LOCALI-START -->';
const END = '<!-- IMPRESE-LOCALI-END -->';

// ---------- helpers ----------

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugFromFile(file) {
  return path.basename(file, '.html').replace(/^imprese-/, '');
}

async function fetchImprese(citta) {
  // 29 ago 2026 — PRIMA cercava le citta' che CONTENGONO il nome: "Rav-enna"
  // combaciava con "Enna", e sulla pagina di Enna finiva un'impresa di Ravenna.
  // Adesso: citta' identica, provincia che INIZIA per quel nome (cosi' "Monza"
  // prende ancora "Monza e della Brianza", ma "Enna" non prende "Ravenna").
  const filtro = `or=(citta.ilike."${citta}",provincia.ilike."${citta}*")`;
  const url = `${SUPABASE_URL}/rest/v1/imprese_pubbliche?select=id,nome,mestiere,tipo,citta,valutazione_media,piano,verificata,descrizione&${encodeURI(filtro)}&limit=40`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Premium prima, poi per valutazione
  data.sort((a, b) => {
    const p = (x) => (x.piano === 'premium' ? 1 : 0);
    if (p(b) !== p(a)) return p(b) - p(a);
    return (b.valutazione_media || 0) - (a.valutazione_media || 0);
  });
  return data.slice(0, MAX_IMPRESE);
}

function cardHTML(i) {
  const badge = i.piano === 'premium'
    ? '<span style="background:#7b2fbe;color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;"><svg style="width:1.05em;height:1.05em;vertical-align:-.15em;display:inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="m12 21 4-12-3-6"/><path d="m12 21-4-12 3-6"/></svg> Premium</span>' : '';
  const verificata = i.verificata
    ? '<span style="color:#0066ff;font-size:12px;font-weight:700;margin-left:6px;">✓ Verificata</span>' : '';
  const rating = i.valutazione_media > 0
    ? `<svg style="width:1.05em;height:1.05em;vertical-align:-.15em;display:inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> ${Number(i.valutazione_media).toFixed(1)}` : '<svg style="width:1.05em;height:1.05em;vertical-align:-.15em;display:inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> Nuova';
  const desc = i.descrizione
    ? `<p style="font-size:0.85rem;color:#666;margin:6px 0 0;line-height:1.4;">${esc(String(i.descrizione).slice(0, 120))}${i.descrizione.length > 120 ? '…' : ''}</p>` : '';
  return `    <a href="/profilo-impresa?id=${esc(i.id)}" style="display:block;background:white;border-radius:12px;padding:18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);text-decoration:none;color:#1a1a1a;">
      <div style="font-weight:700;font-size:1rem;">${esc(i.nome || 'Impresa')}${badge}${verificata}</div>
      <div style="font-size:0.85rem;color:#555;margin-top:4px;"><svg style="width:1.05em;height:1.05em;vertical-align:-.15em;display:inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/></svg> ${esc(i.mestiere || i.tipo || 'Edilizia')} · <svg style="width:1.05em;height:1.05em;vertical-align:-.15em;display:inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(i.citta || '')} · ${rating}</div>${desc}
    </a>`;
}

function sezioneHTML(citta, imprese) {
  const items = imprese.map(cardHTML).join('\n');
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Imprese edili e artigiani a ${citta}`,
    numberOfItems: imprese.length,
    itemListElement: imprese.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: i.nome || 'Impresa',
      url: `https://trovaimpresa.com/profilo-impresa?id=${i.id}`,
    })),
  };
  return `${START}
  <div class="section" id="imprese-locali">
    <h2>Imprese e artigiani attivi a ${esc(citta)}</h2>
    <p>Queste attività della zona di ${esc(citta)} sono registrate su TrovaImpresa. Visita i profili per vedere foto dei lavori, recensioni e richiedere un preventivo gratuito.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin:24px 0;">
${items}
    </div>
    <p style="text-align:center;"><a href="/cerca-imprese?citta=${encodeURIComponent(citta)}" style="color:#0066ff;font-weight:700;">Vedi tutte le imprese a ${esc(citta)} →</a></p>
  </div>
  <script type="application/ld+json">
${JSON.stringify(itemList, null, 2)}
  </script>
  ${END}`;
}

// ---------- main ----------

(async () => {
  const dir = __dirname;
  const files = fs.readdirSync(dir).filter((f) => /^imprese-.+\.html$/.test(f));
  console.log(`Trovate ${files.length} pagine città.\n`);

  let aggiornate = 0, vuote = 0, errori = 0;

  for (const file of files) {
    const fp = path.join(dir, file);
    let html = fs.readFileSync(fp, 'utf8');

    // Città dall'H1 (più affidabile dello slug per accenti/spazi)
    const m = html.match(/<h1>\s*Imprese Edili e Artigiani a\s*(.+?)\s*<\/h1>/);
    const citta = m ? m[1].trim() : slugFromFile(file).replace(/-/g, ' ');

    let imprese;
    try {
      imprese = await fetchImprese(citta);
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
      errori++;
      continue;
    }

    // Rimuovi sezione precedente se presente
    const reOld = new RegExp(`${START}[\\s\\S]*?${END}\\n?`, '');
    html = html.replace(reOld, '');

    if (!imprese.length) {
      // Nessuna impresa: pagina lasciata senza sezione (rimossa se c'era)
      fs.writeFileSync(fp, html, 'utf8');
      vuote++;
      console.log(`— ${citta}: nessuna impresa, sezione omessa`);
      continue;
    }

    // Inserisci prima della cta-box
    // 29 ago 2026 — la sezione delle guide prezzi sta subito prima della cta-box:
    // ancorandosi a quella, le imprese locali restano SOPRA le guide su tutte
    // le pagine. Se la sezione guide non c'e', si torna alla cta-box.
    const anchor = html.includes('<div class="section" id="costi-lavori">')
      ? '<div class="section" id="costi-lavori">'
      : '<div class="cta-box">';
    if (!html.includes(anchor)) {
      console.error(`✗ ${file}: cta-box non trovata, salto`);
      errori++;
      continue;
    }
    html = html.replace(anchor, `${sezioneHTML(citta, imprese)}\n\n  ${anchor}`);

    // Bonus: correggi l'URL .html nel JSON-LD LocalBusiness se presente
    html = html.replace(
      /("url":\s*"https:\/\/trovaimpresa\.com\/imprese-[^"]+?)\.html"/,
      '$1"'
    );

    fs.writeFileSync(fp, html, 'utf8');
    aggiornate++;
    console.log(`✓ ${citta}: ${imprese.length} imprese inserite`);
  }

  console.log(`\nFatto. Aggiornate: ${aggiornate} · Senza imprese: ${vuote} · Errori: ${errori}`);
})();
