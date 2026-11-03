// =====================================================================
// 3 novembre 2026 — «MANDALE A ME PER PROVA» (sezione Giornate)
// Manda a CHI CHIAMA (la sua email di accesso, non una scritta nel
// messaggio) le giornate di un mese, cosi' vede cosa ricevera' il
// consulente. Una prova ogni 10 minuti (gest_azienda.cdl_prova).
// ⛔ Regola delle email del 27 set 2026: destinatario e contenuto li
//    decide il database, non il browser.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const { leggi, manda } = require('./lib/giornate-mese');

const cors = { 'Access-Control-Allow-Origin': 'https://trovaimpresa.com', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' };
const ok = b => ({ statusCode: 200, headers: cors, body: JSON.stringify(b) });
const no = (c, e) => ({ statusCode: c, headers: cors, body: JSON.stringify({ error: e }) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return no(405, 'Metodo non ammesso.');
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY || !process.env.RESEND_API_KEY) return no(500, 'Configurazione server mancante.');
  const gettone = String(event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!gettone) return no(401, 'Accedi di nuovo.');
  const sb = createClient(URL, KEY);
  try {
    const { data: u, error: eu } = await sb.auth.getUser(gettone);
    if (eu || !u || !u.user || !u.user.email) return no(401, 'Accedi di nuovo.');
    const uid = u.user.id;
    let body = {}; try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    const oggi = new Date().toISOString().slice(0, 7);
    const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(body.mese || '') && body.mese <= oggi ? body.mese : oggi;

    const az = await sb.from('gest_azienda').select('cdl_prova').eq('user_id', uid).maybeSingle();
    const ult = az.data && az.data.cdl_prova ? new Date(az.data.cdl_prova).getTime() : 0;
    if (Date.now() - ult < 10 * 60 * 1000) return no(429, 'Hai già mandato una prova da poco. Riprova fra 10 minuti.');

    const d = await leggi(sb, uid, ym);
    if (d.vuoto) return no(400, 'In questo mese non ci sono giornate: scegline uno con le frecce in alto.');
    await sb.from('gest_azienda').upsert({ user_id: uid, cdl_prova: new Date().toISOString() }, { onConflict: 'user_id' });
    await manda(d, u.user.email, true, null);
    return ok({ ok: true, a: u.user.email });
  } catch (e) {
    console.error('giornate-consulente:', e);
    return no(500, 'Non è partita. Riprova fra qualche minuto.');
  }
};
