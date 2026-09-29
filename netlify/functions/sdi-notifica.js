// ============================================================
// LA RISPOSTA DELLO SDI — TrovaImpresa (29 settembre 2026)
//
// Quando lo SDI risponde su una fattura partita col gestionale
// (consegnata, scartata, non consegnata...), Openapi chiama questo
// indirizzo. Qui:
//   1. si controlla che a chiamare sia davvero Openapi (il segreto
//      nell'intestazione, che nasce dalla chiave: vedi sdi.js);
//   2. si prende il codice della fattura dal messaggio;
//   3. NON ci si fida del messaggio: si richiede l'esito a Openapi
//      e si scrive quello nella fattura.
// ============================================================
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function segretoNotifica(token) {
  return crypto.createHash('sha256').update(String(token) + '|trovaimpresa-sdi-notifica').digest('hex');
}
function uguali(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
/* cerca il codice della fattura dovunque stia nel messaggio */
function trovaUuid(o, d) {
  if (!o || typeof o !== 'object' || (d || 0) > 5) return null;
  if (typeof o.invoice_uuid === 'string') return o.invoice_uuid;
  if (o.invoice && typeof o.invoice.uuid === 'string') return o.invoice.uuid;
  for (const k of Object.keys(o)) {
    const r = trovaUuid(o[k], (d || 0) + 1);
    if (r) return r;
  }
  return null;
}
function statoDaNotifiche(lista) {
  const ord = (Array.isArray(lista) ? lista : []).slice()
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
  let stato = null, esito = null;
  ord.forEach(n => {
    const t = String(n.type || '').toUpperCase();
    if (t === 'RC') { stato = 'consegnata'; esito = 'Lo SDI l\'ha recapitata: il cliente ce l\'ha.'; }
    else if (t === 'MC') { stato = 'non_consegnata'; esito = 'Lo SDI non e\' riuscito a consegnarla al cliente: la trova nel suo cassetto fiscale. Per te la fattura e\' emessa.'; }
    else if (t === 'NS') { stato = 'scartata'; esito = n.message || 'Lo SDI ha scartato la fattura.'; }
    else if (t === 'DT') { stato = 'consegnata'; esito = 'Termini scaduti: la fattura vale come consegnata.'; }
    else if (t === 'NE') { stato = /EC02|rifiut/i.test(n.message || '') ? 'scartata' : 'consegnata'; esito = n.message || 'Esito del cliente.'; }
    else if (t === 'AT') { stato = 'non_consegnata'; esito = n.message || 'Attestazione di trasmissione con impossibilita\' di recapito.'; }
  });
  return { stato, esito };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const TOKEN        = (process.env.OPENAPI_SDI_TOKEN || '').trim();
  const BASE         = (process.env.OPENAPI_SDI_URL || '').trim().replace(/\/+$/, '');
  if (!SUPABASE_URL || !SERVICE_KEY || !TOKEN || !BASE) return { statusCode: 500, body: 'config' };

  const h = event.headers || {};
  const auth = String(h.authorization || h.Authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!auth || !uguali(auth, segretoNotifica(TOKEN))) return { statusCode: 401, body: 'no' };

  let corpo = {};
  try { corpo = JSON.parse(event.body || '{}'); } catch (_) { return { statusCode: 400, body: 'json' }; }
  const uuid = trovaUuid(corpo);
  if (!uuid) return { statusCode: 200, body: 'ok' };   /* niente da fare, ma non far ripetere */

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  let TAB = 'gest_fatture';
  let { data: f } = await db.from(TAB).select('id').eq('sdi_uuid', uuid).maybeSingle();
  if (!f) { TAB = 'nol_fatture'; ({ data: f } = await db.from(TAB).select('id').eq('sdi_uuid', uuid).maybeSingle()); }
  if (!f) return { statusCode: 200, body: 'ok' };

  const r = await fetch(BASE + '/invoices_notifications/' + encodeURIComponent(uuid), {
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/json' }
  });
  let j = null; try { j = await r.json(); } catch (_) {}
  const lista = j && Array.isArray(j.data) ? j.data : (Array.isArray(j) ? j : []);
  const s = statoDaNotifiche(lista);
  if (s.stato) {
    await db.from(TAB).update({
      sdi_stato: s.stato, sdi_esito: s.esito, sdi_aggiornata_il: new Date().toISOString()
    }).eq('id', f.id);
  }
  return { statusCode: 200, body: 'ok' };
};
