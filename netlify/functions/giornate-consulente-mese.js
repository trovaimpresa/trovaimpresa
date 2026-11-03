// =====================================================================
// 3 novembre 2026 — LE GIORNATE AL CONSULENTE, IL PRIMO DEL MESE
// Gira alle 7:10 (ora UTC) nei giorni dall'1 al 7. Manda a chi ha acceso
// «Mandagliele ogni mese» (gest_azienda.cdl_invio) le giornate del mese
// finito, e segna cdl_ultimo: lo stesso mese non parte mai due volte.
//
// ⚠️ PERCHE' SETTE GIORNI E NON UNO: Resend gratis manda →100← email al
//    giorno IN TUTTO il sito (conferme comprese). Qui ne partono al massimo
//    →40← per giro: le altre vanno il giorno dopo. Con Resend a pagamento
//    si puo' alzare PER_GIRO.
// ⚠️ Un mese senza giornate non manda niente (ma si segna lo stesso).
// =====================================================================
const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const { leggi, manda, mesePrima } = require('./lib/giornate-mese');

const PER_GIRO = 40;

const handler = async () => {
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY || !process.env.RESEND_API_KEY) return { statusCode: 500, body: 'config' };
  const sb = createClient(URL, KEY);
  const ym = mesePrima(new Date().toISOString().slice(0, 7));
  const r = await sb.from('gest_azienda').select('user_id,cdl_email,cdl_ultimo,email')
    .eq('cdl_invio', true).not('cdl_email', 'is', null)
    .or('cdl_ultimo.is.null,cdl_ultimo.lt.' + ym).limit(PER_GIRO);
  if (r.error) { console.error('giornate-consulente-mese:', r.error.message); return { statusCode: 500, body: 'db' }; }
  let mandate = 0, vuote = 0, errori = 0;
  for (const a of r.data || []) {
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.cdl_email || '')) continue;
      const d = await leggi(sb, a.user_id, ym);
      if (!d.vuoto) { await manda(d, a.cdl_email, false, a.email || null); mandate++; } else vuote++;
      await sb.from('gest_azienda').update({ cdl_ultimo: ym }).eq('user_id', a.user_id);
      await new Promise(x => setTimeout(x, 600));
    } catch (e) { errori++; console.error('giornate-consulente-mese', a.user_id, e.message); }
  }
  console.log('giornate-consulente-mese', ym, { mandate, vuote, errori });
  return { statusCode: 200, body: JSON.stringify({ ym, mandate, vuote, errori }) };
};

exports.handler = schedule('10 7 1-7 * *', handler);
