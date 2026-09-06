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
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

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
    /* ⛔ 6 SETTEMBRE 2026 — PERCHE' SI LEGGE LA VISTA E NON LA TABELLA.
       Questa sitemap usciva VUOTA: rispondeva 200 con zero indirizzi dentro.
       La tabella `imprese` ha una sola regola di lettura, per chi ha fatto
       l'accesso e solo sulla propria riga. Questa funzione legge da fuori,
       senza nessun accesso: la risposta era sempre [] e le 95 schede
       pubbliche non finivano in nessun elenco che Google legge.
       La vista `imprese_pubbliche` e' la stessa porta che usano gia' le
       pagine pubbliche del sito (cerca-artigiani legge da li'), e' leggibile
       da chiunque e mostra solo le colonne pubbliche.
       ⚠️ I due filtri `is_test` e `email_confermata` NON si ripetono qui: quelle
          due colonne nella vista non esistono e la richiesta darebbe errore 400.
          Il filtro lo fa gia' la vista — misurato lo stesso giorno: 95 righe,
          esattamente le imprese con is_test=false e email_confermata=true. */
    const q = new URLSearchParams({
      select: 'id,citta,mestiere,mestieri,descrizione',
      order: 'id.asc',
      limit: String(MAX_URL)
    });

    const risposta = await fetch(`${SUPABASE_URL}/rest/v1/imprese_pubbliche?${q}`, {
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
