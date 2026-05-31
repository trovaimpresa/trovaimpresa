const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const handler = async function() {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) {
    return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const oggi = new Date().toISOString().slice(0, 10);

  try {
    // 1. Leggi i promemoria scaduti e non ancora inviati
    const { data: righe, error } = await sb
      .from('promemoria')
      .select('id, user_id, testo, data')
      .lte('data', oggi)
      .eq('inviato', false);
    if (error) throw error;

    if (!righe || righe.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, emailInviate: 0, righe: 0 }) };
    }

    // 2. Raggruppa per user_id (una sola email per utente)
    const perUtente = {};
    for (const r of righe) {
      if (!perUtente[r.user_id]) perUtente[r.user_id] = [];
      perUtente[r.user_id].push(r);
    }

    let emailInviate = 0;
    const idsInviati = [];

    for (const [userId, lista] of Object.entries(perUtente)) {
      // 3. Recupera l'email con il service role (auth admin)
      const { data: userData, error: userErr } = await sb.auth.admin.getUserById(userId);
      const email = userData && userData.user ? userData.user.email : null;
      if (userErr || !email) {
        console.error('Email non trovata per user', userId, userErr && userErr.message);
        continue;
      }

      // 4. Una sola email con la lista dei testi
      const itemsHtml = lista.map(r => `
        <li style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;line-height:1.5">
          ${escapeHtml(r.testo)}
        </li>`).join('');

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
          <div style="background:linear-gradient(135deg,#c2410c,#f97316);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:22px">🔔 I tuoi promemoria</h1>
          </div>
          <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:14px;line-height:1.6;margin-bottom:20px">
              Hai ${lista.length === 1 ? 'un promemoria in scadenza' : `${lista.length} promemoria in scadenza`} oggi:
            </p>
            <ul style="list-style:none;padding:0;margin:0 0 28px 0">
              ${itemsHtml}
            </ul>
            <div style="text-align:center;margin-bottom:28px">
              <a href="https://trovaimpresa.com/pannello-artigiano.html"
                 style="display:inline-block;background:#f97316;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
                Vai al pannello →
              </a>
            </div>
            <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
              Ricevi questa email perché hai creato dei promemoria su TrovaImpresa.
            </p>
          </div>
          <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
            TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
          </p>
        </div>
      `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: [email],
          subject: '🔔 I tuoi promemoria',
          html
        })
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Errore Resend per', email, errBody);
        continue;
      }

      emailInviate++;
      idsInviati.push(...lista.map(r => r.id));
    }

    // 5. Marca come inviati i promemoria spediti
    if (idsInviati.length > 0) {
      const { error: updErr } = await sb
        .from('promemoria')
        .update({ inviato: true })
        .in('id', idsInviati);
      if (updErr) throw updErr;
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, emailInviate, righe: idsInviati.length }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};

exports.handler = schedule('0 6 * * *', handler);
