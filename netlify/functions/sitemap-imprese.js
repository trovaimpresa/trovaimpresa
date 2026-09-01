// Sitemap delle schede impresa, generata al volo da Supabase.
//
// ⛔ 1 SETTEMBRE 2026 — PERCHE' ESISTE.
// Contato prima di scriverla: `profilo-impresa` compariva 0 volte in tutte le
// sitemap del sito. Le 82 schede pubbliche non erano in nessun elenco che
// Google legge, quindi per Google praticamente non esistevano — e mettere i
// meta senza mettere le schede in sitemap non avrebbe cambiato niente.
//
// Fatta uguale a `sitemap-offerte.js`, che funziona dal 21 agosto: stessa
// forma, stessa chiave, stessa cache, stesso modo di non far mai un errore 500.
// Raggiungibile su https://trovaimpresa.com/sitemap-imprese.xml (vedi netlify.toml)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

const SITO = 'https://trovaimpresa.com';
const MAX_URL = 5000;

function escXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

/* ⛔ QUALI SCHEDE CI VANNO, E PERCHE' NON TUTTE.
   Una scheda senza citta' non dice niente a nessuno: il cliente cerca per
   citta' e mestiere, e una pagina vuota in sitemap Google la segna come
   «contenuto povero» — e il giudizio poi ricade su tutto il sito.
   Misurato l'1 settembre sulle 82 imprese pubbliche: 80 hanno la citta' e
   almeno un mestiere o una descrizione, 2 no. Quelle 2 restano fuori.
   ⚠️ Le schede senza id valido hanno gia' `noindex` scritto nella pagina:
   qui non ci arrivano proprio. */
function vaInSitemap(i) {
  const citta = String(i.citta || '').trim();
  if (!citta) return false;
  const haMestiere = (Array.isArray(i.mestieri) && i.mestieri.length > 0) || String(i.mestiere || '').trim() !== '';
  const haDescrizione = String(i.descrizione || '').trim() !== '';
  return haMestiere || haDescrizione;
}

function costruisciXml(imprese) {
  const righe = imprese.map(i => {
    const url = `${SITO}/profilo-impresa?id=${encodeURIComponent(i.id)}`;
    /* ⚠️ lo stesso indirizzo che la pagina dichiara come canonical: se i due
       non combaciano Google li tratta come due pagine e non sa quale tenere */
    return [
      '  <url>',
      `    <loc>${escXml(url)}</loc>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.6</priority>',
      '  </url>'
    ].join('\n');
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + (righe.length ? righe.join('\n') + '\n' : '')
    + '</urlset>\n';
}

exports.handler = async function () {
  try {
    const q = new URLSearchParams({
      select: 'id,citta,mestiere,mestieri,descrizione',
      is_test: 'eq.false',
      email_confermata: 'eq.true',
      order: 'id.asc',
      limit: String(MAX_URL)
    });

    const risposta = await fetch(`${SUPABASE_URL}/rest/v1/imprese?${q}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });

    if (!risposta.ok) throw new Error(`Supabase ha risposto ${risposta.status}`);

    const tutte = await risposta.json();
    const buone = (Array.isArray(tutte) ? tutte : []).filter(vaInSitemap);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // un'ora di cache: Google non la scarica di continuo e Supabase non viene martellato
        'Cache-Control': 'public, max-age=3600'
      },
      body: costruisciXml(buone)
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
exports._vaInSitemap = vaInSitemap;
