// OFFERTE DI LAVORO — le offerte che scadono (24 ottobre 2026)
//
// Gemella di subappalti-scadenze.js. Ogni mattina:
//   1. a chi ha l'offerta in scadenza fra 3 giorni scrive «e' ancora valida?»
//      con il bottone per rinnovarla (altri 30 giorni)
//   2. chiude le offerte scadute (attiva = false): spariscono dalla bacheca,
//      ma il proprietario le riapre quando vuole dal suo link.
//
// ⛔ Le due righe vanno insieme: l'import di `schedule` qui sotto e
//    `exports.handler = schedule(...)` in fondo. Se ne resta una sola Netlify
//    rifiuta di pubblicare il sito.
const { schedule } = require('@netlify/functions');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const SITO = 'https://trovaimpresa.com';
const MAX_EMAIL = 30; // Resend gratuito: 100 al giorno per tutto il sito (i subappalti ne usano fino a 40)

async function sb(path, opzioni = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opzioni,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(opzioni.headers || {}) },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const dataIt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });
const giorno = (n = 0) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

function html(o, token) {
  const base = `${SITO}/offerta-gestisci.html?id=${encodeURIComponent(o.id)}&token=${encodeURIComponent(token)}`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto">
    <div style="text-align:center;padding:16px 0 20px">
      <a href="${SITO}" style="text-decoration:none"><img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a>
    </div>
    <h2 style="font-size:20px;margin:0 0 12px">La tua offerta di lavoro è ancora valida?</h2>
    <p style="font-size:16px;line-height:1.6">Ciao ${esc(o.nome_azienda)},<br>la tua offerta <strong>&laquo;${esc(o.titolo)}&raquo;</strong>${o.citta ? ' a <strong>' + esc(o.citta) + '</strong>' : ''} scade il <strong>${dataIt(o.data_scadenza_annuncio)}</strong>.</p>
    <p style="font-size:16px;line-height:1.6">Se cerchi ancora qualcuno, rinnovala con un tocco: resta online altri 30 giorni.</p>
    <p style="margin:18px 0"><a href="${base}&azione=rinnova" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Sì, rinnovala</a></p>
    <p style="font-size:15px;line-height:1.6;color:#555">Se hai già trovato la persona non devi fare niente: alla scadenza si chiude da sola. Puoi sempre riaprirla o modificarla da <a href="${base}" style="color:#0066ff">questo link</a>.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:13px;color:#777">TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI) &ndash; <a href="mailto:info@trovaimpresa.com" style="color:#0066ff">info@trovaimpresa.com</a></p>
  </div>`;
}

const handler = async () => {
  if (!SERVICE_KEY) { console.error('[offerte-scadenze] chiave mancante'); return { statusCode: 500 }; }
  let avvisati = 0, chiusi = 0;

  // 1. l'avviso, prima di chiudere: chi scade oggi lo riceve comunque
  try {
    const da = await sb(`offerte_lavoro?attiva=eq.true&avviso_scadenza_il=is.null&email=not.is.null&data_scadenza_annuncio=lte.${giorno(3)}&select=id,titolo,nome_azienda,citta,email,data_scadenza_annuncio,offerte_token(token)&order=data_scadenza_annuncio.asc&limit=${MAX_EMAIL}`);
    for (const o of da) {
      const t = Array.isArray(o.offerte_token) ? o.offerte_token[0] : o.offerte_token;
      if (!RESEND_KEY || !t || !t.token || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(o.email || '')) continue;
      const rr = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [o.email], reply_to: 'info@trovaimpresa.com', subject: 'La tua offerta di lavoro sta per scadere', html: html(o, t.token) }),
        signal: AbortSignal.timeout(8000)
      });
      if (!rr.ok) { console.error('[offerte-scadenze] Resend', rr.status, await rr.text()); break; }
      // se scadeva prima di domani le lasciamo un giorno per rispondere
      const nuovo = o.data_scadenza_annuncio < giorno(1) ? giorno(1) : o.data_scadenza_annuncio;
      await sb(`offerte_lavoro?id=eq.${o.id}`, { method: 'PATCH', body: JSON.stringify({ avviso_scadenza_il: new Date().toISOString(), data_scadenza_annuncio: nuovo }) });
      avvisati++;
    }
  } catch (e) { console.error('[offerte-scadenze] avvisi', e.message); }

  // 2. chiudere le scadute
  try {
    const r = await sb(`offerte_lavoro?attiva=eq.true&data_scadenza_annuncio=lt.${giorno(0)}&select=id`, { method: 'PATCH', body: JSON.stringify({ attiva: false }) });
    chiusi = r.length;
  } catch (e) { console.error('[offerte-scadenze] chiusura', e.message); }

  console.log(`[offerte-scadenze] avvisati ${avvisati}, chiusi ${chiusi}`);
  return { statusCode: 200, body: JSON.stringify({ avvisati, chiusi }) };
};

// ⛔ Va insieme all'import di `schedule` in cima. Ogni giorno alle 8:25 italiane.
exports.handler = schedule('25 6 * * *', handler);
