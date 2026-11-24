// FACEBOOK — le Vetrine gia' uscite sulla pagina «Trova impresa» (24 nov 2026,
// passo 4 deciso con Alex). La usa js/visti-facebook.js:
//   ?citta=Milano  → le ultime 3 imprese di quella citta' uscite su Facebook
//   ?impresa=49    → quando e' uscita quell'impresa (per il riquadro nel pannello)
// Conta solo le Vetrine consegnate davvero a Make (fb_pubblicati), non quelle
// solo scelte per un turno che deve ancora arrivare.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const H = () => ({ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` });
const get = async (p) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${p}`, { headers: H(), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('Supabase ' + r.status);
  return r.json();
};
const out = (code, body, cache) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache ? 'public, max-age=600' : 'no-store' },
  body: JSON.stringify(body)
});

async function uscite(filtroImpresa) {
  // ultime 60 vetrine, poi tengo solo quelle consegnate davvero
  const v = await get(`fb_vetrine?select=giorno,turno,impresa_id${filtroImpresa}&order=giorno.desc,turno.desc&limit=60`);
  if (!v.length) return [];
  const chiavi = v.map(x => `"vet:${x.giorno}:${x.turno}"`).join(',');
  const fatti = new Set((await get(`fb_pubblicati?chiave=in.(${chiavi})&select=chiave`)).map(x => x.chiave));
  return v.filter(x => fatti.has(`vet:${x.giorno}:${x.turno}`));
}

exports.handler = async (event) => {
  if (!SERVICE_KEY) return out(500, { errore: 'Chiave del server mancante' });
  const q = event.queryStringParameters || {};
  try {
    if (q.impresa) {
      const id = parseInt(q.impresa, 10);
      if (!(id > 0)) return out(400, { errore: 'Impresa non valida' });
      const u = await uscite(`&impresa_id=eq.${id}`);
      return out(200, { uscita: u[0] ? u[0].giorno : null }, false);
    }
    const citta = String(q.citta || '').trim().slice(0, 60);
    if (!citta) return out(400, { errore: 'Citta mancante' });
    const u = await uscite('');
    const visti = new Map();
    u.forEach(x => { if (!visti.has(x.impresa_id)) visti.set(x.impresa_id, x.giorno); });
    if (!visti.size) return out(200, { imprese: [] }, true);
    const ids = [...visti.keys()].join(',');
    const imp = await get(`imprese_pubbliche?id=in.(${ids})&citta=ilike.${encodeURIComponent(citta.replace(/[,()*%]/g, ''))}&select=id,user_id,nome_attivita,nome,mestiere`);
    const scelte = imp.sort((a, b) => visti.get(b.id).localeCompare(visti.get(a.id))).slice(0, 3);
    const lista = [];
    for (const i of scelte) {
      const f = await get(`lavori_foto?owner_id=eq.${i.user_id}&pubblico=eq.true&foto=like.https*&select=foto&order=ordine.desc,created_at.desc&limit=1`);
      lista.push({ id: i.id, nome: i.nome_attivita || i.nome || '', mestiere: i.mestiere || '', foto: f[0] ? f[0].foto : null, giorno: visti.get(i.id) });
    }
    return out(200, { imprese: lista }, true);
  } catch (e) {
    console.error('[fb-vetrine]', e.message);
    return out(502, { errore: 'Riprova fra poco' });
  }
};
