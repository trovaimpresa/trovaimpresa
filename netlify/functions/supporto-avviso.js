// 27 settembre 2026 — ASSISTENZA DIRETTA: L'EMAIL AD ALESSIO.
// Prima un'impresa scriveva «ti rispondo io, di persona» e nessuno lo sapeva
// finche' non si apriva il pannello admin. Adesso, quando un'impresa scrive
// dal gestionale, ad Alessio arriva un'email col testo.
//
// ⛔ Dal browser arrivano SOLO il numero del messaggio e il gettone della
// sessione. Il server controlla che il messaggio sia davvero di chi chiama,
// che sia appena stato scritto (10 minuti) e lo rilegge dal database:
// nessuno puo' far partire email con testi inventati.
// ⚠️ Una email ogni 15 minuti per impresa: se scrive tre messaggi di fila
// ne arriva una sola (Resend gratuito = 100 email al giorno in tutto).

const { createClient } = require('@supabase/supabase-js');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const gettone = String((event.headers.authorization || event.headers.Authorization || '')).replace(/^Bearer\s+/i, '');
  let msgId = null;
  try { msgId = JSON.parse(event.body || '{}').msg_id; } catch (e) {}
  if (!gettone || msgId == null) return no(400, 'Dati mancanti.');

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  try {
    const { data: u, error: eu } = await sb.auth.getUser(gettone);
    if (eu || !u || !u.user) return no(401, 'Sessione non valida.');
    const uid = u.user.id;

    const { data: m } = await sb.from('supporto_messaggi')
      .select('id, user_id, da_admin, messaggio, created_at, allegato_nome')
      .eq('id', msgId).maybeSingle();
    if (!m || m.user_id !== uid || m.da_admin) return no(404, 'Messaggio non trovato.');
    if (Date.now() - new Date(m.created_at).getTime() > 10 * 60 * 1000) return ok({ saltato: 'vecchio' });

    // uno ogni 15 minuti: se c'e' un altro suo messaggio nei 15 minuti prima, l'email e' gia' partita
    const da = new Date(new Date(m.created_at).getTime() - 15 * 60 * 1000).toISOString();
    const { data: prima } = await sb.from('supporto_messaggi').select('id')
      .eq('user_id', uid).eq('da_admin', false).gte('created_at', da).lt('created_at', m.created_at).limit(1);
    if (prima && prima.length) return ok({ saltato: 'gia_avvisato' });

    let chi = u.user.email || 'Un\'impresa', email = u.user.email || '';
    try {
      const { data: imp } = await sb.from('imprese').select('nome_attivita, nome, citta, tipo').eq('user_id', uid).limit(1).maybeSingle();
      if (imp) chi = (imp.nome_attivita || imp.nome || chi) + (imp.citta ? ' — ' + imp.citta : '') + (imp.tipo ? ' (' + imp.tipo + ')' : '');
    } catch (e) {}

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;font-size:17px;line-height:1.7;color:#12233a;max-width:620px">
        <p><b>${esc(chi)}</b>${email ? ' &lt;' + esc(email) + '&gt;' : ''} ti ha scritto in <b>Assistenza diretta</b>:</p>
        <blockquote style="border-left:4px solid #0066ff;margin:18px 0;padding:8px 0 8px 16px;font-size:18px">${esc(m.messaggio)}</blockquote>
        ${m.allegato_nome ? '<p style="color:#5b6b80;font-size:15px">Con un allegato: ' + esc(m.allegato_nome) + '</p>' : ''}
        <p><a href="https://trovaimpresa.com/admin.html" style="display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Rispondi dal pannello admin</a></p>
        <p style="color:#5b6b80;font-size:14px">Se scrive altri messaggi nei prossimi 15 minuti non ti arriva un'altra email: li trovi tutti nella conversazione.</p>
      </div>`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [ADMIN], subject: 'Assistenza — ' + chi, html, reply_to: email ? [email] : undefined })
    });
    if (!r.ok) { console.error('[supporto-avviso] resend', r.status, await r.text()); return no(502, 'Email non partita.'); }
    return ok({ ok: true });
  } catch (e) {
    console.error('[supporto-avviso]', e);
    return no(500, 'Errore.');
  }
};
