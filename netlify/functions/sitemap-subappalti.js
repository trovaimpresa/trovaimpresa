// Sitemap degli annunci di subappalto, generata al volo da Supabase.
//
// ⛔ 6 SETTEMBRE 2026 — PERCHE' ESISTE.
// Contato prima di scriverla: la tabella `subappalti` aveva 5 annunci veri,
// nati da soli fra il 1 agosto e il 2 settembre, mentre `offerte_lavoro` ne
// aveva 0. Eppure la sitemap esisteva per le offerte di lavoro (vuota) e NON
// per i subappalti: la sezione che funziona era l'unica invisibile a Google.
//
// Fatta uguale a `sitemap-imprese.js`: stessa forma, stessa chiave, stessa
// cache, stesso modo di non far mai un errore 500.
// Raggiungibile su https://trovaimpresa.com/sitemap-subappalti.xml (vedi netlify.toml)
//
// ⚠️ La tabella `subappalti` si legge senza fare l'accesso: la regola
//    `subappalti_select_public` vale anche per il ruolo `anon`. Per questo qui
//    si legge la tabella e non una vista — al contrario di `sitemap-imprese.js`,
//    dove la tabella `imprese` e' chiusa e si deve passare da `imprese_pubbliche`.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

const SITO = 'https://trovaimpresa.com';
const MAX_URL = 5000;

function escXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

/* ⛔ QUALI ANNUNCI CI VANNO, E PERCHE' NON TUTTI.
   La pagina dell'annuncio prende il titolo dalla PRIMA RIGA del testo scritto
   da chi pubblica. Se quel testo non c'e', la pagina esce senza titolo: per
   Google e' «contenuto povero», e il giudizio ricade su tutto il sito.
   Serve anche un luogo: un subappalto senza citta' ne' regione non risponde
   alla domanda che la gente fa su Google, che e' sempre «... a <posto>». */
function vaInSitemap(a) {
  const testo = String((a.tipo === 'cerca' ? a.descrizione : a.lavoro) || '').trim();
  if (!testo) return false;
  const luogo = String(a.citta || a.regione || '').trim();
  return luogo !== '';
}

function costruisciXml(annunci) {
  const righe = annunci.map(a => {
    const url = `${SITO}/subappalto-annuncio?id=${encodeURIComponent(a.id)}`;
    /* ⚠️ lo stesso indirizzo che la pagina dichiara come canonical: se i due
       non combaciano Google li tratta come due pagine e non sa quale tenere */
    const lastmod = a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : null;
    return [
      '  <url>',
      `    <loc>${escXml(url)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      '    <changefreq>weekly</changefreq>',
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
      select: 'id,tipo,descrizione,lavoro,citta,regione,created_at',
      order: 'created_at.desc',
      limit: String(MAX_URL)
    });

    const risposta = await fetch(`${SUPABASE_URL}/rest/v1/subappalti?${q}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });

    if (!risposta.ok) throw new Error(`Supabase ha risposto ${risposta.status}`);

    const tutti = await risposta.json();
    const buoni = (Array.isArray(tutti) ? tutti : []).filter(vaInSitemap);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // un'ora di cache: Google non la scarica di continuo e Supabase non viene martellato
        'Cache-Control': 'public, max-age=3600'
      },
      body: costruisciXml(buoni)
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
