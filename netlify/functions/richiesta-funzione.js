// Manda le due email di una richiesta "Cosa ti manca":
// la conferma all'impresa e la segnalazione ad Alessio.
// Dal browser arriva SOLO il numero della richiesta: il testo lo rilegge
// il server dal database, cosi' nessuno puo' far mandare email finte.

const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const ADMIN = 'info@trovaimpresa.com';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function inviaEmail(to, subject, html, replyTo) {
  const payload = { from: 'TrovaImpresa <info@trovaimpresa.com>', to: [to], subject, html };
  if (replyTo) payload.reply_to = [replyTo];
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !process.env.RESEND_API_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let id = null;
  try { id = String(JSON.parse(event.body || '{}').id || '').trim(); } catch (e) {}
  if (!/^\d+$/.test(id)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Richiesta non valida.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const { data: r } = await sb.from('gest_richieste')
      .select('id, user_id, email, testo, created_at').eq('id', id).maybeSingle();
    if (!r) return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Richiesta non trovata.' }) };

    // solo per dare un nome nella email ad Alessio
    let chi = r.email || '';
    try {
      const { data: imp } = await sb.from('imprese')
        .select('nome_attivita, nome, citta').eq('user_id', r.user_id).limit(1).maybeSingle();
      if (imp) chi = (imp.nome_attivita || imp.nome || chi) + (imp.citta ? ' — ' + imp.citta : '');
    } catch (e) {}

    // 1) conferma all'impresa
    if (r.email) {
      await inviaEmail(r.email, 'Abbiamo ricevuto la tua richiesta', `
        <div style="font-family:system-ui,Arial,sans-serif;font-size:17px;line-height:1.7;color:#12233a;max-width:560px">
          <div style="text-align:center;padding:16px 0 20px">
            <a href="https://trovaimpresa.com" style="text-decoration:none">
              <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
                   style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
            </a>
          </div>
          <p>Ciao,</p>
          <p>abbiamo ricevuto quello che ci hai scritto dal gestionale:</p>
          <blockquote style="border-left:4px solid #0066ff;margin:18px 0;padding:8px 0 8px 16px;color:#334">${esc(r.testo)}</blockquote>
          <p>La leggo di persona. Se decidiamo di farla te lo scrivo, e intanto nel gestionale
             — sezione <b>Cosa ti manca?</b> — vedi sempre a che punto siamo.</p>
          <p style="color:#5b6b80;font-size:15px">Se vuoi aggiungere qualcosa, rispondi pure a questa email.</p>
          <p>Alessio<br>TrovaImpresa</p>
        </div>
      `, ADMIN);
    }

    // 2) segnalazione ad Alessio
    await inviaEmail(ADMIN, '💡 Richiesta dal gestionale — ' + (chi || 'impresa'), `
      <div style="font-family:system-ui,Arial,sans-serif;font-size:17px;line-height:1.7;color:#12233a;max-width:620px">
        <div style="text-align:center;padding:16px 0 20px">
          <a href="https://trovaimpresa.com" style="text-decoration:none">
            <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
                 style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
          </a>
        </div>
        <p><b>${esc(chi)}</b>${r.email ? ' &lt;' + esc(r.email) + '&gt;' : ''} ha scritto:</p>
        <blockquote style="border-left:4px solid #0066ff;margin:18px 0;padding:8px 0 8px 16px;font-size:18px">${esc(r.testo)}</blockquote>
        <p style="color:#5b6b80;font-size:15px">Richiesta n. ${esc(r.id)} · la trovi nel pannello admin, sezione "Cosa chiedono".</p>
      </div>
    `, r.email || undefined);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('[richiesta-funzione]', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore invio email.' }) };
  }
};
