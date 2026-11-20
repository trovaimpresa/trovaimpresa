// FACEBOOK — l'email del mattino ad Alessio «Da pubblicare su Facebook»
// (20 novembre 2026). Una sola email al giorno (quota di Resend).
//
// Dentro: i subappalti, le offerte di lavoro e i nuovi iscritti con la
// scheda pubblica arrivati nelle ultime 24 ore. Ogni riga ha il pulsante che
// apre facebook-post.html col testo pronto. Se non c'e' niente, non parte.
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
    <a href="${url}" style="display:inline-block;background:#1877f2;color:#fff;font-weight:800;font-size:16px;text-decoration:none;padding:11px 20px;border-radius:9px">Prepara il post</a>
  </td></tr>`;
}

const handler = async () => {
  // gira alle 4 e alle 5 UTC: parte solo quando a Roma sono le 6 (inverno e estate)
  const oraRoma = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Rome' }).format(new Date()));
  if (oraRoma !== 6) return { statusCode: 200 };
  if (!SERVICE_KEY || !RESEND_KEY) { console.error('[fb-riepilogo] chiavi mancanti'); return { statusCode: 500 }; }
  const da = encodeURIComponent(new Date(Date.now() - 864e5).toISOString());
  const righe = [];
  try {
    const sub = await sb(`subappalti?attivo=eq.true&created_at=gte.${da}&select=id,nome_impresa,citta&order=created_at.desc&limit=30`);
    sub.forEach(a => righe.push(riga('🏗️ Subappalto —', a.nome_impresa || 'senza nome', a.citta, 'sub', a.id)));
  } catch (e) { console.error('[fb-riepilogo] subappalti', e.message); }
  try {
    const off = await sb(`offerte_lavoro?attiva=eq.true&data_pubblicazione=gte.${da}&select=id,titolo,citta&order=data_pubblicazione.desc&limit=30`);
    off.forEach(o => righe.push(riga('💼 Offerta —', o.titolo || 'senza titolo', o.citta, 'off', o.id)));
  } catch (e) { console.error('[fb-riepilogo] offerte', e.message); }
  try {
    const imp = await sb(`imprese_pubbliche?created_at=gte.${da}&select=id,nome_attivita,nome,citta&order=created_at.desc&limit=30`);
    imp.forEach(i => righe.push(riga('👷 Nuovo iscritto —', i.nome_attivita || i.nome || 'senza nome', i.citta, 'imp', i.id)));
  } catch (e) { console.error('[fb-riepilogo] iscritti', e.message); }

  if (!righe.length) { console.log('[fb-riepilogo] niente di nuovo'); return { statusCode: 200 }; }

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="font-size:22px;color:#0a2a4d;margin:0 0 6px">Da pubblicare su Facebook</h2>
    <p style="font-size:16px;color:#475569;margin:0 0 8px">Arrivati nelle ultime 24 ore. Tocca «Prepara il post»: il testo è già scritto.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${righe.join('')}</table>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [A_CHI], subject: `Da pubblicare su Facebook: ${righe.length}`, html }),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) console.error('[fb-riepilogo] Resend', r.status, await r.text());
  return { statusCode: 200, body: JSON.stringify({ righe: righe.length }) };
};

// ogni mattina alle 6 ora italiana (deciso da Alex il 20 nov 2026)
exports.handler = schedule('0 4,5 * * *', handler);
