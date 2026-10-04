// Sitemap del Forum Edilizia: solo le richieste che hanno ricevuto almeno una risposta di un'impresa.
// Una richiesta senza risposte e' contenuto povero: non va a Google (e la pagina stessa e' noindex).
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
const SITO = 'https://trovaimpresa.com';
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function xml(righe) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n    <loc>' + SITO + '/forum</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n' +
    righe.map(q => '  <url>\n    <loc>' + esc(SITO + '/forum-richiesta?s=' + encodeURIComponent(q.slug)) + '</loc>\n' +
      (q.confermato_il ? '    <lastmod>' + new Date(q.confermato_il).toISOString().slice(0, 10) + '</lastmod>\n' : '') +
      '    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>').join('\n') + (righe.length ? '\n' : '') + '</urlset>\n';
}

exports.handler = async function () {
  try {
    const q = new URLSearchParams({ select: 'slug,confermato_il', indicizzabile: 'eq.true', stato: 'in.(pubblicata,chiusa)', order: 'confermato_il.desc', limit: '5000' });
    const r = await fetch(SUPABASE_URL + '/rest/v1/bacheca_richieste?' + q, { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } });
    if (!r.ok) throw new Error('Supabase ' + r.status);
    const righe = await r.json();
    return { statusCode: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }, body: xml(Array.isArray(righe) ? righe : []) };
  } catch (e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' }, body: xml([]) };
  }
};
