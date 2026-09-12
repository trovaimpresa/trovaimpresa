// Manda all'azienda l'email col link per gestire il proprio annuncio di lavoro.
//
// Perche' esiste: nei subappalti il link di gestione appare SOLO in pagina. Chi
// chiude la finestra lo perde per sempre e non puo' piu' chiudere il suo annuncio:
// la bacheca si riempie di annunci morti che nessuno puo' togliere.
//
// Sicurezza: dal browser arrivano SOLO id e token. Email, nome e titolo li legge
// il server dal database. Cosi' questa funzione non si puo' usare per mandare
// email a indirizzi scelti da chi chiama.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const SITO = 'https://trovaimpresa.com';

const headersJson = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sb(path, opzioni = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opzioni,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opzioni.headers || {})
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headersJson, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headersJson, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  if (!SERVICE_KEY || !RESEND_KEY) {
    console.error('[offerta-link-gestione] env vars mancanti');
    return { statusCode: 500, headers: headersJson, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let id, token;
  try {
    ({ id, token } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: headersJson, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }
  if (!id || !token) {
    return { statusCode: 400, headers: headersJson, body: JSON.stringify({ error: 'id e token sono obbligatori.' }) };
  }

  try {
    // 1. il token e' davvero di questo annuncio?
    const righe = await sb(`offerte_token?offerta_id=eq.${encodeURIComponent(id)}&token=eq.${encodeURIComponent(token)}&select=offerta_id,email_avvisata`);
    if (!righe.length) {
      return { statusCode: 403, headers: headersJson, body: JSON.stringify({ error: 'Link non valido.' }) };
    }
    // mai due volte la stessa email: il tetto Resend e' 100 al giorno
    if (righe[0].email_avvisata) {
      return { statusCode: 200, headers: headersJson, body: JSON.stringify({ success: true, gia_inviata: true }) };
    }

    // 2. i dati veri dell'annuncio, letti dal server
    const off = await sb(`offerte_lavoro?id=eq.${encodeURIComponent(id)}&select=titolo,nome_azienda,email,citta`);
    if (!off.length || !off[0].email) {
      return { statusCode: 404, headers: headersJson, body: JSON.stringify({ error: 'Annuncio non trovato.' }) };
    }
    const o = off[0];
    const link = `${SITO}/offerta-gestisci.html?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
    const linkAnnuncio = `${SITO}/offerta-lavoro.html?id=${encodeURIComponent(id)}`;

    // 3. l'email
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto">
        <div style="text-align:center;padding:16px 0 20px">
          <a href="${SITO}" style="text-decoration:none">
            <img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa"
                 style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
          </a>
        </div>
        <h2 style="font-size:20px;margin:0 0 12px">Il tuo annuncio &egrave; online</h2>
        <p style="font-size:16px;line-height:1.6">Ciao ${esc(o.nome_azienda)},<br>
        il tuo annuncio <strong>&laquo;${esc(o.titolo)}&raquo;</strong>${o.citta ? ' a ' + esc(o.citta) : ''} &egrave; pubblicato sulla bacheca di TrovaImpresa.</p>
        <p style="margin:18px 0">
          <a href="${linkAnnuncio}" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Vedi il tuo annuncio</a>
        </p>
        <div style="background:#f0f5ff;border-radius:12px;padding:16px 18px;margin:22px 0">
          <p style="font-size:16px;margin:0 0 10px"><strong>&#128273; Conserva questo link</strong></p>
          <p style="font-size:15px;line-height:1.6;margin:0 0 10px">Ti serve per chiudere l'annuncio quando hai trovato la persona. Non c'&egrave; nessuna password: <strong>chi ha il link pu&ograve; chiudere l'annuncio</strong>, quindi tienilo per te.</p>
          <p style="font-size:14px;word-break:break-all;margin:0"><a href="${link}" style="color:#0047b3">${esc(link)}</a></p>
        </div>
        <p style="font-size:15px;line-height:1.6;color:#555">Le persone interessate ti contatteranno ai recapiti che hai scritto nell'annuncio.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:13px;color:#777">TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI) &ndash;
          <a href="mailto:info@trovaimpresa.com" style="color:#0066ff">info@trovaimpresa.com</a></p>
      </div>`;

    const rr = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: [o.email],
        reply_to: 'info@trovaimpresa.com',
        subject: `Il tuo annuncio è online — ${o.titolo}`,
        html
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!rr.ok) {
      const testo = await rr.text();
      console.error('[offerta-link-gestione] Resend', rr.status, testo);
      // L'annuncio E' pubblicato: l'email che non parte non deve sembrare un fallimento.
      // Il link resta comunque scritto in pagina.
      return { statusCode: 200, headers: headersJson, body: JSON.stringify({ success: false, email_non_partita: true }) };
    }

    await fetch(`${SUPABASE_URL}/rest/v1/offerte_token?offerta_id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_avvisata: true }),
      signal: AbortSignal.timeout(8000)
    });

    console.log('[offerta-link-gestione] email inviata per offerta', id);
    return { statusCode: 200, headers: headersJson, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[offerta-link-gestione] eccezione:', err.message);
    return { statusCode: 200, headers: headersJson, body: JSON.stringify({ success: false, email_non_partita: true }) };
  }
};
