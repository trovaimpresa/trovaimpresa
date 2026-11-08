// =====================================================================
// FIRMA CON CODICE SMS — Openapi ci avvisa (8 novembre 2026)
//
// Quando la richiesta cambia stato (il cliente ha firmato, errore...)
// Openapi chiama questo indirizzo, che abbiamo scritto noi nella
// richiesta: ...?f=<id della nostra riga>&k=<chiave>.
//
// ⛔ NON CI SI FIDA DEL MESSAGGIO. Si controlla la chiave (nasce dall'id),
//    poi si chiede NOI a Openapi a che punto e' (lib/firma-sms-comune.js →
//    aggiorna). Se e' firmato, si prende il PDF firmato e si mette nel
//    deposito privato «firme-sms».
// Se qualcosa va storto si risponde 500: Openapi riprova da solo.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const C = require('./lib/firma-sms-comune');

const rispondi = (codice, corpo) => ({ statusCode: codice, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') return rispondi(405, { error: 'no' });
    const q = event.queryStringParameters || {};
    const id = String(q.f || '');
    if (!/^[0-9a-f-]{36}$/i.test(id) || !C.chiaveGiusta(id, q.k)) return rispondi(403, { error: 'no' });
    const amb = C.ambiente();
    if (!amb.token || !amb.base || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return rispondi(500, { error: 'config' });

    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: riga } = await db.from('gest_firme_sms').select('*').eq('id', id).maybeSingle();
    if (!riga) return rispondi(200, { ok: true, ignorata: true });   // riga sparita: non serve riprovare
    const ora = await C.aggiorna(db, riga);
    // firmato ma il PDF non e' ancora arrivato: 500, cosi' Openapi riprova
    if (ora.stato === 'DONE' && !ora.pdf_path) return rispondi(500, { error: 'pdf non ancora arrivato' });
    return rispondi(200, { ok: true, stato: ora.stato });
  } catch (e) {
    console.error('[firma-sms-notifica]', e);
    return rispondi(500, { error: 'errore' });
  }
};
