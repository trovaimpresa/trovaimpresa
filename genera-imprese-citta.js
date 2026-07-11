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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

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
  const filtro = `or=(citta.ilike.*${encodeURIComponent(citta)}*,provincia.ilike.*${encodeURIComponent(citta)}*)`;
  const url = `${SUPABASE_URL}/rest/v1/imprese?select=id,nome,mestiere,tipo,citta,valutazione_media,piano,verificata,descrizione&${filtro}&is_test=eq.false&limit=40`;
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
    ? '<span style="background:#7b2fbe;color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;">💎 Premium</span>' : '';
  const verificata = i.verificata
    ? '<span style="color:#2a7a4b;font-size:12px;font-weight:700;margin-left:6px;">✓ Verificata</span>' : '';
  const rating = i.valutazione_media > 0
    ? `⭐ ${Number(i.valutazione_media).toFixed(1)}` : '⭐ Nuova';
  const desc = i.descrizione
    ? `<p style="font-size:0.85rem;color:#666;margin:6px 0 0;line-height:1.4;">${esc(String(i.descrizione).slice(0, 120))}${i.descrizione.length > 120 ? '…' : ''}</p>` : '';
  return `    <a href="/profilo-impresa?id=${esc(i.id)}" style="display:block;background:white;border-radius:12px;padding:18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);text-decoration:none;color:#1a1a1a;">
      <div style="font-weight:700;font-size:1rem;">${esc(i.nome || 'Impresa')}${badge}${verificata}</div>
      <div style="font-size:0.85rem;color:#555;margin-top:4px;">🏗️ ${esc(i.mestiere || i.tipo || 'Edilizia')} · 📍 ${esc(i.citta || '')} · ${rating}</div>${desc}
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
    <p style="text-align:center;"><a href="/cerca-imprese?citta=${encodeURIComponent(citta)}" style="color:#2a7a4b;font-weight:700;">Vedi tutte le imprese a ${esc(citta)} →</a></p>
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
    const anchor = '<div class="cta-box">';
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
