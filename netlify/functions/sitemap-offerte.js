// Sitemap delle offerte di lavoro, generata al volo da Supabase.
// Serve perché gli annunci stanno nel database e non sono file: senza questa,
// Google non sa che esistono e non li può indicizzare.
// Raggiungibile su https://trovaimpresa.com/sitemap-offerte.xml (vedi netlify.toml)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

const SITO = 'https://trovaimpresa.com';
const MAX_URL = 5000;

function escXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

// Un annuncio scaduto non deve stare in sitemap: Google lo segnala come pagina morta
function ancoraValida(o, oggi) {
  if (!o.data_scadenza_annuncio) return true;
  const d = new Date(o.data_scadenza_annuncio);
  return isNaN(d) ? true : d >= oggi;
}

function costruisciXml(offerte) {
  const righe = offerte.map(o => {
    const url = `${SITO}/offerta-lavoro.html?id=${encodeURIComponent(o.id)}`;
    const lastmod = o.data_pubblicazione ? new Date(o.data_pubblicazione).toISOString().slice(0, 10) : null;
    return [
      '  <url>',
      `    <loc>${escXml(url)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      '    <changefreq>daily</changefreq>',
      '    <priority>0.7</priority>',
      '  </url>'
    ].filter(Boolean).join('\n');
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + (righe.length ? righe.join('\n') + '\n' : '')
    + '</urlset>\n';
}

exports.handler = async function () {
  try {
    const q = new URLSearchParams({
      select: 'id,data_pubblicazione,data_scadenza_annuncio',
      attiva: 'eq.true',
      order: 'data_pubblicazione.desc',
      limit: String(MAX_URL)
    });

    const risposta = await fetch(`${SUPABASE_URL}/rest/v1/offerte_lavoro?${q}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });

    if (!risposta.ok) throw new Error(`Supabase ha risposto ${risposta.status}`);

    const tutte = await risposta.json();
    const oggi = new Date(new Date().toDateString());
    const valide = (Array.isArray(tutte) ? tutte : []).filter(o => ancoraValida(o, oggi));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // un'ora di cache: Google non la scarica di continuo e Supabase non viene martellato
        'Cache-Control': 'public, max-age=3600'
      },
      body: costruisciXml(valide)
    };
  } catch (e) {
    // Meglio una sitemap vuota ma valida che un errore 500: un 500 ripetuto
    // fa perdere fiducia a Google su tutto il file.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      body: costruisciXml([])
    };
  }
};

// esportati solo per i test
exports._costruisciXml = costruisciXml;
exports._ancoraValida = ancoraValida;
