// ============================================================
// UNA FATTURA E' ARRIVATA — TrovaImpresa (16 ottobre 2026)
//
// Quando un fornitore manda una fattura a una delle imprese che hanno acceso
// la ricezione, lo SDI la gira a Openapi e Openapi chiama QUESTO indirizzo.
// Qui:
//   1. si controlla che a chiamare sia davvero Openapi (il segreto
//      nell'intestazione: nasce dalla chiave, vedi lib/sdi-ricezione.js);
//   2. NON ci si fida del messaggio: si chiede il file a Openapi, si legge,
//      si salva (fornitore, numero, data, importo + il file XML).
// Se qualcosa va storto a meta' rispondiamo 5xx: Openapi riprova da solo.
// Tutta la logica sta in lib/sdi-ricezione.js (la stessa delle azioni di sdi.js).
// ============================================================
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const R = require('./lib/sdi-ricezione');

function uguali(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const TOKEN        = (process.env.OPENAPI_SDI_TOKEN || '').trim();
  const BASE         = (process.env.OPENAPI_SDI_URL || '').trim().replace(/\/+$/, '');
  if (!SUPABASE_URL || !SERVICE_KEY || !TOKEN || !BASE) return { statusCode: 500, body: 'config' };
  const AMBIENTE = /\/\/test\./i.test(BASE) ? 'test' : 'prod';

  const h = event.headers || {};
  const auth = String(h.authorization || h.Authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!auth || !uguali(auth, R.segretoRicevuta(TOKEN))) return { statusCode: 401, body: 'no' };

  let corpo = {};
  try { corpo = JSON.parse(event.body || '{}'); } catch (_) { return { statusCode: 400, body: 'json' }; }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  try {
    const r = await R.ricevi(db, { BASE, TOKEN, AMBIENTE }, corpo);
    return { statusCode: r.status, body: r.body };
  } catch (e) {
    console.error('[sdi-ricevuta]', e && e.message);
    return { statusCode: 500, body: 'errore' };
  }
};
