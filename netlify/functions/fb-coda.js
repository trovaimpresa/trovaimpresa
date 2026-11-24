// FACEBOOK — la coda dei post che Make.com pubblica DA SOLO sulla pagina
// «Trova impresa» (23 novembre 2026, passo 2 deciso con Alex).
//
// Make (piano gratis: un solo orario al giorno per scenario) chiama questo
// indirizzo OGNI ORA: /.netlify/functions/fb-coda?chiave=...
// Sono le ore a decidere il turno, e ogni post esce una volta sola:
//   dalle 8 alle 12  → Vetrina 1 + nuovi iscritti, subappalti, offerte
//   dalle 13 alle 18 → Vetrina 2 + il marchio del giorno
//   dalle 19 alle 21 → Vetrina 3 + il post del gestionale del giorno
//   di notte (22-7)  → niente
//
// Ogni post consegnato si scrive in fb_pubblicati: se Make richiama, quel
// post non torna (niente doppioni sulla pagina).
// ⛔ Il gruppo NO: Facebook non lascia pubblicare nei gruppi in automatico.
const { SITO, marchioDelGiorno, gestionaleDelGiorno, testoVetrina, testoSubappalto, testoOfferta, testoIscritto, testoMarchio, testoGestionale } = require('./lib/fb-testi');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CHIAVE = process.env.FB_CODA_CHIAVE;
const H = () => ({ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' });

async function get(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H(), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}
const risposta = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  body: JSON.stringify(body)
});

async function vetrina(giorno, turno) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fb_vetrina_del_giorno`, {
    method: 'POST', headers: H(), body: JSON.stringify({ p_giorno: giorno, p_turno: turno }), signal: AbortSignal.timeout(8000)
  });
  const id = r.ok ? await r.json() : null;
  if (!id) return null;
  const [i] = await get(`imprese_pubbliche?id=eq.${id}&select=id,user_id,tipo,nome_attivita,nome,mestiere,citta,provincia`);
  if (!i) return null;
  const foto = (await get(`lavori_foto?owner_id=eq.${i.user_id}&pubblico=eq.true&select=foto&order=ordine.desc,created_at.desc&limit=4`))
    .map(f => f.foto).filter(u => /^https:\/\//.test(u || ''));
  return { chiave: `vet:${giorno}:${turno}`, ...testoVetrina(i, foto) };
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  if (!CHIAVE || q.chiave !== CHIAVE) return risposta(401, { errore: 'Chiave sbagliata' });
  if (!SERVICE_KEY) return risposta(500, { errore: 'Chiave del server mancante' });
  const prova = q.prova === '1'; // con prova=1 mostra i post ma non li segna come usciti
  const ora = new Date();
  const giorno = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(ora);
  const h = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Rome' }).format(ora));
  if (h < 8 || h >= 22) return risposta(200, { giorno, turno: 0, prova, post: [] });
  const turno = h < 13 ? 1 : h < 19 ? 2 : 3;
  const post = [];
  try {
    const v = await vetrina(giorno, turno);
    if (v) post.push(v);
    if (turno === 1) {
      // 48 ore: se un giro salta, il mattino dopo i post ci sono ancora; i doppioni li ferma fb_pubblicati.
      const da = encodeURIComponent(new Date(Date.now() - 2 * 864e5).toISOString());
      (await get(`imprese_pubbliche?created_at=gte.${da}&select=id,tipo,nome_attivita,nome,mestiere,citta,provincia&order=created_at.asc&limit=10`))
        .forEach(i => post.push({ chiave: `imp:${i.id}`, ...testoIscritto(i) }));
      (await get(`subappalti?attivo=eq.true&created_at=gte.${da}&select=id,tipo,nome_impresa,lavoro,citta&order=created_at.asc&limit=10`))
        .forEach(a => post.push({ chiave: `sub:${a.id}`, ...testoSubappalto(a) }));
      (await get(`offerte_lavoro?attiva=eq.true&data_pubblicazione=gte.${da}&select=id,titolo,nome_azienda,citta,provincia,tipo_contratto,stipendio&order=data_pubblicazione.asc&limit=10`))
        .forEach(o => post.push({ chiave: `off:${o.id}`, ...testoOfferta(o) }));
    } else if (turno === 2) {
      const m = testoMarchio(marchioDelGiorno());
      if (m) post.push({ chiave: `mar:${giorno}`, ...m });
    } else {
      const g = testoGestionale(gestionaleDelGiorno());
      if (g) post.push({ chiave: `ges:${giorno}`, ...g });
    }
    // togli quelli gia' consegnati
    const chiavi = post.map(p => p.chiave);
    const gia = chiavi.length ? await get(`fb_pubblicati?chiave=in.(${chiavi.map(c => '"' + c + '"').join(',')})&select=chiave`) : [];
    const fatti = new Set(gia.map(x => x.chiave));
    const nuovi = post.filter(p => !fatti.has(p.chiave)).map(p => ({
      chiave: p.chiave, titolo: p.titolo, testo: p.testo, link: p.link,
      con_foto: !!(p.foto && p.foto.length), foto: (p.foto || []).map(url => ({ type: 'url', url })) // 23 nov: Make vuole anche «type» per ogni foto
    }));
    if (!prova && nuovi.length) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/fb_pubblicati`, {
        method: 'POST', headers: { ...H(), Prefer: 'resolution=ignore-duplicates' },
        body: JSON.stringify(nuovi.map(p => ({ chiave: p.chiave }))), signal: AbortSignal.timeout(8000)
      });
      if (!r.ok) throw new Error('segno consegnati ' + r.status);
    }
    return risposta(200, { giorno, turno, prova, post: nuovi });
  } catch (e) {
    console.error('[fb-coda]', e.message);
    return risposta(502, { errore: 'Non riesco a preparare i post, riprova fra poco.' });
  }
};
