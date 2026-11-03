// =====================================================================
// 3 novembre 2026 — LA DOMANDA DELLA SERA: il giro
// Gira ogni 15 minuti fra le 15 e le 21 (ora UTC), dal lunedi' al sabato.
// Per ogni telefono acceso: se in Italia e' gia' passata la sua ora, se
// stasera non ha ancora suonato e se la giornata di oggi NON e' ancora
// segnata (nessuna riga in gest_ore di oggi), suona.
// Un telefono che non esiste piu' (404/410) si cancella da solo.
// =====================================================================
const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const { manda } = require('./lib/push-chiavi');

function adessoRoma() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => (p.find(x => x.type === t) || {}).value;
  return { giorno: g('year') + '-' + g('month') + '-' + g('day'), ora: (g('hour') === '24' ? '00' : g('hour')) + ':' + g('minute') };
}

const handler = async () => {
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return { statusCode: 500, body: 'config' };
  const sb = createClient(URL, KEY);
  const now = adessoRoma();
  const r = await sb.from('gest_avvisi_sera').select('id,user_id,endpoint,p256dh,auth,ora,ultimo_giorno')
    .eq('attivo', true).lte('ora', now.ora).or('ultimo_giorno.is.null,ultimo_giorno.lt.' + now.giorno).limit(500);
  if (r.error) { console.error('avviso-sera-giro:', r.error.message); return { statusCode: 500, body: 'db' }; }
  const righe = r.data || [];
  const utenti = [...new Set(righe.map(x => x.user_id))];
  const fatti = new Set();
  if (utenti.length) {
    const o = await sb.from('gest_ore').select('user_id').in('user_id', utenti).eq('data', now.giorno).is('eliminato_il', null);
    (o.data || []).forEach(x => fatti.add(x.user_id));
  }
  let suonati = 0, saltati = 0, morti = 0;
  for (const s of righe) {
    await sb.from('gest_avvisi_sera').update({ ultimo_giorno: now.giorno }).eq('id', s.id);
    if (fatti.has(s.user_id)) { saltati++; continue; }
    try {
      await manda(sb, s, { titolo: "Com'è andata oggi?", testo: 'Tocca e raccontalo a voce: ci penso io a segnarlo.', url: '/gestionale-app.html?sera=1#giornate' });
      suonati++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await sb.from('gest_avvisi_sera').delete().eq('id', s.id); morti++; }
      else console.error('avviso-sera-giro', s.id, e.statusCode || e.message);
    }
  }
  console.log('avviso-sera-giro', now, { suonati, saltati, morti });
  return { statusCode: 200, body: JSON.stringify({ suonati, saltati, morti }) };
};

exports.handler = schedule('*/15 15-20 * * 1-6', handler);
