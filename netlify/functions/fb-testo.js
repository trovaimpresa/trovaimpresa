// FACEBOOK — il testo pronto di UN post, per la pagina facebook-post.html
// (20 novembre 2026). Si chiama con ?t=sub|off|imp&id=N.
//
// Legge solo cose GIA' pubbliche: subappalti attivi, offerte attive, imprese
// della vista imprese_pubbliche (che esclude prove, email non confermate e
// vetrine spente). Non scrive niente.
const { testoVetrina, testoSubappalto, testoOfferta, testoIscritto, testoMarchio, testoGestionale } = require('./lib/fb-testi');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function una(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  const j = await r.json();
  return Array.isArray(j) ? j[0] : null;
}

const risposta = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const t = String(q.t || '');
  const id = String(q.id || '');
  if (t === 'mar') {
    const post = testoMarchio(id);
    return post ? risposta(200, post) : risposta(404, { errore: 'Marchio non trovato.' });
  }
  if (t === 'ges') {
    const post = testoGestionale(id);
    return post ? risposta(200, post) : risposta(404, { errore: 'Post del gestionale non trovato.' });
  }
  if (!SERVICE_KEY) return risposta(500, { errore: 'Chiave del server mancante' });
  if (t === 'off' ? !/^[0-9a-f-]{36}$/i.test(id) : !/^\d{1,12}$/.test(id)) return risposta(400, { errore: 'Annuncio non valido' });
  try {
    let riga, post;
    if (t === 'sub') {
      riga = await una(`subappalti?id=eq.${id}&attivo=eq.true&select=id,tipo,nome_impresa,lavoro,citta`);
      if (riga) post = testoSubappalto(riga);
    } else if (t === 'off') {
      riga = await una(`offerte_lavoro?id=eq.${id}&attiva=eq.true&select=id,titolo,nome_azienda,citta,provincia,tipo_contratto,stipendio`);
      if (riga) post = testoOfferta(riga);
    } else if (t === 'vet') {
      riga = await una(`imprese_pubbliche?id=eq.${id}&select=id,user_id,tipo,nome_attivita,nome,mestiere,citta,provincia`);
      if (riga) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/lavori_foto?owner_id=eq.${riga.user_id}&pubblico=eq.true&select=foto&order=ordine.desc,created_at.desc&limit=4`, {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, signal: AbortSignal.timeout(8000)
        });
        const foto = r.ok ? (await r.json()).map(f => f.foto).filter(u => /^https:\/\//.test(u || '')) : [];
        post = testoVetrina(riga, foto);
      }
    } else if (t === 'imp') {
      riga = await una(`imprese_pubbliche?id=eq.${id}&select=id,tipo,nome_attivita,nome,mestiere,citta,provincia`);
      if (riga) post = testoIscritto(riga);
    } else {
      return risposta(400, { errore: 'Tipo non valido' });
    }
    if (!post) return risposta(404, { errore: 'Non lo trovo: forse è stato chiuso o la scheda non è pubblica.' });
    return risposta(200, post);
  } catch (e) {
    console.error('[fb-testo]', e.message);
    return risposta(502, { errore: 'Non riesco a leggere il database, riprova fra poco.' });
  }
};
