// FACEBOOK — l'email del mattino ad Alessio (20 novembre 2026).
// 24 nov 2026 (Alex, «solo per il gruppo»): dalla pagina pubblica Make da solo
// (fb-coda.js), quindi l'email NON dice piu' «da pubblicare» (farebbe doppioni):
// elenca le Vetrine uscite IERI sulla pagina, da condividere a mano nel gruppo,
// perche' Facebook nei gruppi non lascia pubblicare in automatico.
// Se ieri non e' uscita nessuna Vetrina, l'email non parte.
// (Sotto restano le note vecchie del 20 nov, per la storia.)
//
// Dentro: i subappalti, le offerte di lavoro e i nuovi iscritti con la
// scheda pubblica arrivati nelle ultime 24 ore. Ogni riga ha il pulsante che
// apre facebook-post.html col testo pronto. Ogni giorno c'e' anche un marchio della pubblicita' della home, a giro: l'email parte sempre.
//
// ⛔ Le due righe vanno insieme: l'import di `schedule` e
//    `exports.handler = schedule(...)` in fondo.
const { schedule } = require('@netlify/functions');
const { SITO } = require('./lib/fb-testi');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const A_CHI = process.env.ADMIN_EMAIL || 'info@trovaimpresa.com';

async function sb(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function riga(icona, nome, dove, t, id) {
  const url = `${SITO}/facebook-post?t=${t}&id=${encodeURIComponent(id)}`;
  return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
    <div style="font-size:17px;font-weight:800;color:#0a2a4d">${icona} ${esc(nome)}</div>
    ${dove ? `<div style="font-size:15px;color:#475569;margin:2px 0 8px">📍 ${esc(dove)}</div>` : ''}
    <a href="${url}" style="display:inline-block;background:#1877f2;color:#fff;font-weight:800;font-size:16px;text-decoration:none;padding:11px 20px;border-radius:9px">Apri e condividi nel gruppo</a>
  </td></tr>`;
}

const handler = async () => {
  // gira alle 4 e alle 5 UTC: parte solo quando a Roma sono le 6 (inverno e estate)
  const oraRoma = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Rome' }).format(new Date()));
  if (oraRoma !== 6) return { statusCode: 200 };
  if (!SERVICE_KEY || !RESEND_KEY) { console.error('[fb-riepilogo] chiavi mancanti'); return { statusCode: 500 }; }
  const ieri = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(Date.now() - 864e5));
  const righe = [];
  try {
    const v = await sb(`fb_vetrine?giorno=eq.${ieri}&select=turno,impresa_id&order=turno.asc`);
    if (v.length) {
      const chiavi = v.map(x => `"vet:${ieri}:${x.turno}"`).join(',');
      const fatti = new Set((await sb(`fb_pubblicati?chiave=in.(${chiavi})&select=chiave`)).map(x => x.chiave));
      for (const x of v) {
        if (!fatti.has(`vet:${ieri}:${x.turno}`)) continue;
        const i = await sb(`imprese_pubbliche?id=eq.${x.impresa_id}&select=id,nome_attivita,nome,citta`);
        if (i[0]) righe.push(riga('📣 Vetrina —', i[0].nome_attivita || i[0].nome || 'senza nome', i[0].citta, 'vet', i[0].id));
      }
    }
  } catch (e) { console.error('[fb-riepilogo] vetrine', e.message); }
  if (!righe.length) return { statusCode: 200, body: JSON.stringify({ righe: 0 }) };

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="font-size:22px;color:#0a2a4d;margin:0 0 6px">Uscite ieri sulla pagina Facebook</h2>
    <p style="font-size:16px;color:#475569;margin:0 0 8px">Sulla pagina le ha già pubblicate Make. Se vuoi, condividile nel <b>gruppo</b>: tocca il pulsante, copia il testo e apri il gruppo.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${righe.join('')}</table>
    <p style="font-size:14px;color:#64748b;margin:14px 0 0">Non pubblicarle di nuovo sulla pagina: ci sono già.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [A_CHI], subject: `Per il gruppo Facebook: ${righe.length} Vetrin${righe.length === 1 ? 'a' : 'e'} di ieri`, html }),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) console.error('[fb-riepilogo] Resend', r.status, await r.text());
  return { statusCode: 200, body: JSON.stringify({ righe: righe.length }) };
};

// ogni mattina alle 6 ora italiana (deciso da Alex il 20 nov 2026)
exports.handler = schedule('0 4,5 * * *', handler);
