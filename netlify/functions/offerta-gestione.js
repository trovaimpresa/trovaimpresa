// OFFERTE DI LAVORO — la gestione dell'annuncio (24 ottobre 2026)
//
// Gemella di subappalto-gestione.js. Una porta sola per tutto quello che si
// fa su un'offerta gia' pubblicata:
//   leggi · modifica · chiudi · riapri · rinnova · elimina · link (email)
//   -> si entra con id + token (il link segreto, sta in offerte_token)
//      oppure col gettone di un iscritto proprietario dell'offerta
//   miei
//   -> col gettone di un iscritto: le SUE offerte con il link per gestirle.
//
// Sicurezza: il token non e' leggibile dal browser. Email e testi delle email
// li legge il server dal database: da fuori non si sceglie a chi scrivere.
// (Sostituisce offerta-link-gestione.js, che sapeva solo mandare il link.)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const SITO = 'https://trovaimpresa.com';
const GIORNI = 30;

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};
const risposta = (code, obj) => ({ statusCode: code, headers: H, body: JSON.stringify(obj) });

const CAMPI_LETTI = 'id,impresa_id,titolo,nome_azienda,email,telefono,tipo_offerta,tipo_contratto,descrizione,citta,provincia,regione,stipendio,orario,posti_disponibili,data_pubblicazione,data_scadenza_annuncio,attiva';
// cosa si puo' modificare, e quanto puo' essere lungo
const MODIFICABILI = { titolo: 160, nome_azienda: 120, email: 160, telefono: 40, descrizione: 6000, citta: 80, stipendio: 80, orario: 40, tipo_contratto: 60 };

const oggiPiu = giorni => new Date(Date.now() + giorni * 864e5).toISOString().slice(0, 10);

async function sb(path, opzioni = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opzioni,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opzioni.headers || {})
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

const linkGestione = (id, token) => `${SITO}/offerta-gestisci.html?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const emailValida = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

async function mandaEmail(to, subject, html) {
  const rr = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [to], reply_to: 'info@trovaimpresa.com', subject, html }),
    signal: AbortSignal.timeout(8000)
  });
  if (!rr.ok) { console.error('[offerta-gestione] Resend', rr.status, await rr.text()); return false; }
  return true;
}

function emailLink(o, link) {
  const linkAnnuncio = `${SITO}/offerta-lavoro.html?id=${encodeURIComponent(o.id)}`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto">
    <div style="text-align:center;padding:16px 0 20px">
      <a href="${SITO}" style="text-decoration:none"><img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a>
    </div>
    <h2 style="font-size:20px;margin:0 0 12px">La tua offerta di lavoro è online</h2>
    <p style="font-size:16px;line-height:1.6">Ciao ${esc(o.nome_azienda)},<br>la tua offerta <strong>&laquo;${esc(o.titolo)}&raquo;</strong>${o.citta ? ' a <strong>' + esc(o.citta) + '</strong>' : ''} è pubblicata sulla bacheca di TrovaImpresa e resta online <strong>${GIORNI} giorni</strong>.</p>
    <p style="margin:18px 0"><a href="${link}" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Gestisci la tua offerta</a></p>
    <p style="font-size:15px;margin:0 0 18px"><a href="${linkAnnuncio}" style="color:#0066ff">Vedi come la vedono i lavoratori</a></p>
    <div style="background:#f0f5ff;border-radius:12px;padding:16px 18px;margin:22px 0">
      <p style="font-size:16px;margin:0 0 10px"><strong>&#128273; Conserva questa email</strong></p>
      <p style="font-size:15px;line-height:1.6;margin:0">Da quel link puoi <strong>modificare</strong>, <strong>chiudere</strong> (quando hai trovato la persona) o <strong>eliminare</strong> l'offerta. Non c'è nessuna password: chi ha il link può gestire l'offerta, quindi tienilo per te.</p>
    </div>
    <p style="font-size:15px;line-height:1.6;color:#555">Prima che scada ti scriviamo noi: con un tocco la rinnovi per altri ${GIORNI} giorni.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:13px;color:#777">TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI) &ndash; <a href="mailto:info@trovaimpresa.com" style="color:#0066ff">info@trovaimpresa.com</a></p>
  </div>`;
}

async function utenteDaGettone(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const jwt = auth.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${jwt}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

// le imprese (id) di questo iscritto
async function impreseDi(u) {
  const righe = await sb(`imprese?user_id=eq.${encodeURIComponent(u.id)}&select=id`);
  return righe.map(r => r.id);
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Method Not Allowed' });
  if (!SERVICE_KEY) return risposta(500, { error: 'Configurazione server mancante.' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return risposta(400, { error: 'Richiesta non valida.' }); }
  const azione = String(b.azione || '');

  try {
    // ---------- LE MIE OFFERTE (iscritto) ----------
    if (azione === 'miei') {
      const u = await utenteDaGettone(event);
      if (!u) return risposta(401, { error: 'Devi essere collegato.' });
      const ids = await impreseDi(u);
      const email = String(u.email || '').trim().toLowerCase();
      const pezzi = [];
      if (ids.length) pezzi.push(`impresa_id.in.(${ids.join(',')})`);
      if (email) pezzi.push(`email.ilike.${encodeURIComponent(email)}`);
      if (!pezzi.length) return risposta(200, { offerte: [] });
      const righe = await sb(`offerte_lavoro?or=(${pezzi.join(',')})&select=${CAMPI_LETTI},offerte_token(token)&order=data_pubblicazione.desc&limit=50`);
      return risposta(200, {
        offerte: righe.map(({ offerte_token, ...r }) => {
          const t = Array.isArray(offerte_token) ? offerte_token[0] : offerte_token;
          return { ...r, gestisci: t && t.token ? linkGestione(r.id, t.token) : null };
        })
      });
    }

    // ---------- tutte le altre: id + token, oppure il proprietario collegato ----------
    const id = String(b.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return risposta(400, { error: 'Link non valido.' });
    const token = String(b.token || '');
    let tok = null;
    if (token) {
      if (!/^[0-9a-f-]{36}$/i.test(token)) return risposta(400, { error: 'Link non valido.' });
      const t = await sb(`offerte_token?offerta_id=eq.${id}&token=eq.${encodeURIComponent(token)}&select=token,email_avvisata`);
      if (!t.length) return risposta(403, { error: 'Offerta non trovata o link non valido.' });
      tok = t[0];
    }
    const trovate = await sb(`offerte_lavoro?id=eq.${id}&select=${CAMPI_LETTI}`);
    if (!trovate.length) return risposta(404, { error: 'Offerta non trovata: forse è stata eliminata.' });
    const o = trovate[0];
    if (!tok) {
      const u = await utenteDaGettone(event);
      if (!u) return risposta(403, { error: 'Link non valido.' });
      const ids = await impreseDi(u);
      const mia = (o.impresa_id != null && ids.map(String).includes(String(o.impresa_id))) ||
                  (o.email && String(o.email).toLowerCase() === String(u.email || '').toLowerCase());
      if (!mia) return risposta(403, { error: 'Questa offerta non è tua.' });
      const t = await sb(`offerte_token?offerta_id=eq.${id}&select=token,email_avvisata`);
      tok = t[0] || null;
    }
    const dove = `offerte_lavoro?id=eq.${id}`;

    if (azione === 'leggi') return risposta(200, { offerta: o });

    if (azione === 'modifica') {
      const campi = b.campi || {};
      const nuovo = {};
      for (const [k, max] of Object.entries(MODIFICABILI)) {
        if (campi[k] === undefined) continue;
        const v = String(campi[k] ?? '').trim().slice(0, max);
        nuovo[k] = v || null;
      }
      if ('titolo' in nuovo && !nuovo.titolo) return risposta(400, { error: 'Il titolo non può restare vuoto.' });
      if ('nome_azienda' in nuovo && !nuovo.nome_azienda) return risposta(400, { error: 'Il nome non può restare vuoto.' });
      if ('citta' in nuovo && !nuovo.citta) return risposta(400, { error: 'La città non può restare vuota.' });
      if ('email' in nuovo && !emailValida(nuovo.email)) return risposta(400, { error: "Scrivi un'email valida: serve per gestire l'offerta." });
      if (!Object.keys(nuovo).length) return risposta(400, { error: 'Niente da salvare.' });
      nuovo.updated_at = new Date().toISOString();
      const r = await sb(dove, { method: 'PATCH', body: JSON.stringify(nuovo) });
      return risposta(200, { offerta: r[0] });
    }

    if (azione === 'chiudi') {
      const r = await sb(dove, { method: 'PATCH', body: JSON.stringify({ attiva: false }) });
      return risposta(200, { offerta: r[0] });
    }

    if (azione === 'riapri' || azione === 'rinnova') {
      const r = await sb(dove, { method: 'PATCH', body: JSON.stringify({ attiva: true, data_scadenza_annuncio: oggiPiu(GIORNI), avviso_scadenza_il: null }) });
      return risposta(200, { offerta: r[0] });
    }

    if (azione === 'elimina') {
      await sb(dove, { method: 'DELETE' });
      return risposta(200, { eliminata: true });
    }

    if (azione === 'link') {
      if (!tok) return risposta(200, { inviata: false });
      if (tok.email_avvisata) return risposta(200, { gia_inviata: true });
      if (!RESEND_KEY || !emailValida(o.email)) return risposta(200, { inviata: false });
      const ok = await mandaEmail(o.email, `La tua offerta è online — ${o.titolo}`, emailLink(o, linkGestione(id, tok.token)));
      if (ok) await sb(`offerte_token?offerta_id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ email_avvisata: true }) });
      return risposta(200, { inviata: ok });
    }

    return risposta(400, { error: 'Azione sconosciuta.' });
  } catch (err) {
    console.error('[offerta-gestione]', azione, err.message);
    return risposta(500, { error: 'Qualcosa non ha funzionato, riprova tra poco.' });
  }
};
