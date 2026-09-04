// Sitemap delle pagine RECENSIONI, generata al volo da Supabase.
//
// ⛔ 5 SETTEMBRE 2026 — PERCHE' ESISTE.
// `recensioni-impresa.html` non compariva in NESSUNA sitemap: per Google non
// esisteva. E' una pagina per impresa (`?id=N`), quindi non basta scriverne
// una riga a mano in `sitemap.xml` — quella pagina senza `?id` si dichiara da
// sola `noindex`.
//
// Fatta uguale a `sitemap-imprese.js` (stessa forma, stessa cache, stesso modo
// di non fare mai un 500) — regola `stessa-forma`.
// Raggiungibile su https://trovaimpresa.com/sitemap-recensioni.xml (netlify.toml)
//
// ⚠️ CI VANNO SOLO LE IMPRESE CHE HANNO ALMENO UNA RECENSIONE CONFERMATA.
// Una pagina recensioni vuota e' "contenuto povero": Google la conta contro
// tutto il sito. La lista arriva dalla funzione `imprese_con_recensioni()`,
// che esclude anche le imprese di prova e quelle senza email confermata
// (la tabella `feedback_clienti` e' chiusa da RLS: da `anon` si leggono 0
// righe, quindi si passa di li' come fa il resto delle recensioni).

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

const SITO = 'https://trovaimpresa.com';
const MAX_URL = 5000;

function escXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

/* Solo un id numerico vero: una riga sporca non deve finire in sitemap. */
function vaInSitemap(r) {
  const id = Number(r && r.impresa_id);
  if (!Number.isInteger(id) || id <= 0) return false;
  return Number(r.quante) > 0;
}

/* La data in formato AAAA-MM-GG. Se manca o non si legge, si lascia fuori:
   una `lastmod` sbagliata e' peggio di nessuna lastmod. */
function soloGiorno(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}

function costruisciXml(righe) {
  const url = righe.map(r => {
    /* ⚠️ lo stesso indirizzo che la pagina dichiara come canonical
       (`/recensioni-impresa?id=N`): se i due non combaciano Google li tratta
       come due pagine e non sa quale tenere. */
    const loc = `${SITO}/recensioni-impresa?id=${encodeURIComponent(r.impresa_id)}`;
    const mod = soloGiorno(r.ultima);
    return [
      '  <url>',
      `    <loc>${escXml(loc)}</loc>`,
      ...(mod ? [`    <lastmod>${mod}</lastmod>`] : []),
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.5</priority>',
      '  </url>'
    ].join('\n');
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + (url.length ? url.join('\n') + '\n' : '')
    + '</urlset>\n';
}

exports.handler = async function () {
  try {
    const risposta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/imprese_con_recensioni`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });

    if (!risposta.ok) throw new Error(`Supabase ha risposto ${risposta.status}`);

    const tutte = await risposta.json();
    const buone = (Array.isArray(tutte) ? tutte : []).filter(vaInSitemap).slice(0, MAX_URL);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      },
      body: costruisciXml(buone)
    };
  } catch (e) {
    // Meglio una sitemap vuota ma valida che un 500: un 500 ripetuto fa
    // perdere fiducia a Google su tutto il file.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      body: costruisciXml([])
    };
  }
};

// esportati solo per i banchi
exports._costruisciXml = costruisciXml;
exports._vaInSitemap = vaInSitemap;
exports._soloGiorno = soloGiorno;
