// 10 novembre 2026 — «SEGNALA QUESTA CONVERSAZIONE»: L'EMAIL AD ALESSIO.
// Quando un cliente o un'impresa segnala una chat sospetta (rpc segnala_chat,
// sql/segnala-chat.sql), il browser chiama questa funzione col numero della
// segnalazione. Ad Alessio arriva un'email col motivo e gli ultimi messaggi.
//
// ⛔ Dal browser arriva SOLO il numero. Il testo lo rilegge il server dal
// database, e l'email parte solo se la segnalazione e' una chat, e' di meno di
// 10 minuti fa e non e' gia' stata avvisata (avvisata_il si segna PRIMA di
// mandare: due chiamate insieme non fanno partire due email).

const { createClient } = require('@supabase/supabase-js');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const ADMIN = process.env.ADMIN_EMAIL || 'info@trovaimpresa.com';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ok = b => ({ statusCode: 200, headers: cors, body: JSON.stringify(b) });
const no = (c, e) => ({ statusCode: c, headers: cors, body: JSON.stringify({ error: e }) });

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return no(405, 'Method Not Allowed');
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY || !process.env.RESEND_API_KEY) return no(500, 'Configurazione server mancante.');

  let id = null;
  try { id = JSON.parse(event.body || '{}').id; } catch (e) {}
  if (!/^\d+$/.test(String(id == null ? '' : id))) return no(400, 'Dati mancanti.');

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  try {
    const dieciMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    // si prende la segnalazione E si segna avvisata in un colpo solo
    const { data: righe, error } = await sb.from('segnalazioni')
      .update({ avvisata_il: new Date().toISOString() })
      .eq('id', Number(id)).eq('tipo', 'chat').is('avvisata_il', null).gte('created_at', dieciMin)
      .select('id, descrizione, da, nome_impresa, email');
    if (error) { console.error('[segnala-avviso]', error.message); return no(500, 'Errore.'); }
    if (!righe || !righe.length) return ok({ saltato: true });
    const s = righe[0];

    const chi = s.da === 'impresa' ? 'un\'impresa' : 'un cliente';
    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;font-size:17px;line-height:1.7;color:#12233a;max-width:620px">
        <p style="font-size:19px;font-weight:700;color:#c0392b;margin:0 0 10px">⚑ Una chat è stata segnalata da ${chi}</p>
        <div style="background:#fff6f5;border-left:4px solid #c0392b;border-radius:8px;padding:14px 16px;margin:14px 0;white-space:pre-wrap;font-size:16px">${esc(String(s.descrizione || '').slice(0, 2500))}</div>
        ${s.email ? '<p style="font-size:15px;color:#5b6b80">Email di chi ha segnalato: ' + esc(s.email) + '</p>' : ''}
        <p><a href="https://trovaimpresa.com/admin.html" style="display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Apri le Segnalazioni nell'admin</a></p>
      </div>`;
    const r = await require('./lib/resend-riserva')('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [ADMIN], subject: 'Chat segnalata — ' + (s.nome_impresa || 'impresa'), html })
    });
    if (!r.ok) { console.error('[segnala-avviso] resend', r.status, await r.text().catch(() => '')); return no(502, 'Email non partita.'); }
    return ok({ ok: true });
  } catch (e) {
    console.error('[segnala-avviso]', e);
    return no(500, 'Errore.');
  }
};
