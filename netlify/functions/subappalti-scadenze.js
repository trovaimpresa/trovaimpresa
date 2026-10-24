// SUBAPPALTI — gli annunci che scadono (24 ottobre 2026)
//
// Ogni mattina:
//   1. a chi ha l'annuncio in scadenza fra 3 giorni scrive «e' ancora valido?»
//      con il bottone per rinnovarlo (altri 30 giorni)
//   2. chiude gli annunci scaduti (attivo = false): spariscono dalla bacheca,
//      ma il proprietario li riapre quando vuole dal suo link.
// Cosi' la bacheca resta fresca senza che nessuno debba fare pulizie a mano.
//
// ⛔ Le due righe vanno insieme: l'import di `schedule` qui sotto e
//    `exports.handler = schedule(...)` in fondo. Se ne resta una sola Netlify
//    rifiuta di pubblicare il sito.
const { schedule } = require('@netlify/functions');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const SITO = 'https://trovaimpresa.com';
const MAX_EMAIL = 40; // Resend gratuito: 100 al giorno per tutto il sito

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
const dataIt = d => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });

function html(a) {
  const base = `${SITO}/subappalto-gestisci.html?id=${encodeURIComponent(a.id)}&token=${encodeURIComponent(a.token)}`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto">
    <div style="text-align:center;padding:16px 0 20px">
      <a href="${SITO}" style="text-decoration:none"><img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a>
    </div>
    <h2 style="font-size:20px;margin:0 0 12px">Il tuo annuncio è ancora valido?</h2>
    <p style="font-size:16px;line-height:1.6">Ciao ${esc(a.nome_impresa)},<br>il tuo annuncio di subappalto${a.citta ? ' per <strong>' + esc(a.citta) + '</strong>' : ''} scade il <strong>${dataIt(a.scade_il)}</strong>.</p>
    <p style="font-size:16px;line-height:1.6">Se ti serve ancora, rinnovalo con un tocco: resta online altri 30 giorni.</p>
    <p style="margin:18px 0"><a href="${base}&azione=rinnova" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Sì, rinnovalo</a></p>
    <p style="font-size:15px;line-height:1.6;color:#555">Se non ti serve più non devi fare niente: alla scadenza si chiude da solo. Puoi sempre riaprirlo o modificarlo da <a href="${base}" style="color:#0066ff">questo link</a>.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:13px;color:#777">TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI) &ndash; <a href="mailto:info@trovaimpresa.com" style="color:#0066ff">info@trovaimpresa.com</a></p>
  </div>`;
}

const handler = async () => {
  if (!SERVICE_KEY) { console.error('[subappalti-scadenze] chiave mancante'); return { statusCode: 500 }; }
  const ora = new Date().toISOString();
  const fra3 = new Date(Date.now() + 3 * 864e5).toISOString();
  let avvisati = 0, chiusi = 0;

  // 1. l'avviso, prima di chiudere: chi scade oggi lo riceve comunque
  try {
    const da = await sb(`subappalti?attivo=eq.true&avviso_scadenza_il=is.null&email=not.is.null&scade_il=lte.${encodeURIComponent(fra3)}&select=id,token,nome_impresa,citta,email,scade_il&order=scade_il.asc&limit=${MAX_EMAIL}`);
    for (const a of da) {
      if (!RESEND_KEY || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email || '')) continue;
      const rr = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a.email], reply_to: 'info@trovaimpresa.com', subject: 'Il tuo annuncio di subappalto sta per scadere', html: html(a) }),
        signal: AbortSignal.timeout(8000)
      });
      if (!rr.ok) { console.error('[subappalti-scadenze] Resend', rr.status, await rr.text()); break; }
      // se scadeva prima di domani gli lasciamo un giorno per rispondere
      const nuovoTermine = new Date(Math.max(new Date(a.scade_il).getTime(), Date.now() + 864e5)).toISOString();
      await sb(`subappalti?id=eq.${a.id}`, { method: 'PATCH', body: JSON.stringify({ avviso_scadenza_il: ora, scade_il: nuovoTermine }) });
      avvisati++;
    }
  } catch (e) { console.error('[subappalti-scadenze] avvisi', e.message); }

  // 2. chiudere gli scaduti
  try {
    const r = await sb(`subappalti?attivo=eq.true&scade_il=lt.${encodeURIComponent(ora)}&select=id`, { method: 'PATCH', body: JSON.stringify({ attivo: false }) });
    chiusi = r.length;
  } catch (e) { console.error('[subappalti-scadenze] chiusura', e.message); }

  console.log(`[subappalti-scadenze] avvisati ${avvisati}, chiusi ${chiusi}`);
  return { statusCode: 200, body: JSON.stringify({ avvisati, chiusi }) };
};

// ⛔ Va insieme all'import di `schedule` in cima. Ogni giorno alle 8 italiane (6 UTC d'estate).
exports.handler = schedule('15 6 * * *', handler);
