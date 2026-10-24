// SUBAPPALTI — la gestione dell'annuncio (24 ottobre 2026)
//
// Una porta sola per tutto quello che si fa su un annuncio gia' pubblicato:
//   leggi · modifica · chiudi · riapri · rinnova · elimina · link (email)
//   -> si entra con id + token (il link segreto dell'annuncio)
//   miei
//   -> si entra col gettone di accesso di un iscritto: restituisce i SUOI
//      annunci (stesso user_id, oppure stessa email) con il link per gestirli.
//
// Sicurezza: il token non e' leggibile dal browser (niente SELECT sulla
// colonna). Email e testi delle email li legge il server dal database: da
// fuori non si puo' scegliere a chi scrivere.

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

const CAMPI_LETTI = 'id,tipo,nome_impresa,descrizione,lavoro,citta,telefono,email,regione,categoria,mestiere,created_at,attivo,scade_il';
// cosa si puo' modificare, e quanto puo' essere lungo
const MODIFICABILI = { nome_impresa: 120, descrizione: 3000, lavoro: 3000, citta: 200, telefono: 30, email: 160, regione: 60, mestiere: 80 };

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

function linkGestione(id, token) {
  return `${SITO}/subappalto-gestisci.html?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
}
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
  if (!rr.ok) { console.error('[subappalto-gestione] Resend', rr.status, await rr.text()); return false; }
  return true;
}

function emailLink(a, link) {
  const titolo = a.tipo === 'offre' ? 'La tua disponibilità è online' : 'La tua richiesta di subappalto è online';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto">
    <div style="text-align:center;padding:16px 0 20px">
      <a href="${SITO}" style="text-decoration:none"><img src="${SITO}/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a>
    </div>
    <h2 style="font-size:20px;margin:0 0 12px">${titolo}</h2>
    <p style="font-size:16px;line-height:1.6">Ciao ${esc(a.nome_impresa)},<br>il tuo annuncio${a.citta ? ' per <strong>' + esc(a.citta) + '</strong>' : ''} è pubblicato sulla bacheca subappalti di TrovaImpresa e resta online <strong>${GIORNI} giorni</strong>.</p>
    <p style="margin:18px 0"><a href="${link}" style="background:#0066ff;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px;display:inline-block">Gestisci il tuo annuncio</a></p>
    <div style="background:#f0f5ff;border-radius:12px;padding:16px 18px;margin:22px 0">
      <p style="font-size:16px;margin:0 0 10px"><strong>&#128273; Conserva questa email</strong></p>
      <p style="font-size:15px;line-height:1.6;margin:0">Da quel link puoi <strong>modificare</strong>, <strong>chiudere</strong> o <strong>eliminare</strong> l'annuncio quando vuoi. Non c'è nessuna password: chi ha il link può gestire l'annuncio, quindi tienilo per te.</p>
    </div>
    <p style="font-size:15px;line-height:1.6;color:#555">Prima che scada ti scriviamo noi: con un tocco lo rinnovi per altri ${GIORNI} giorni.</p>
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

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Method Not Allowed' });
  if (!SERVICE_KEY) return risposta(500, { error: 'Configurazione server mancante.' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return risposta(400, { error: 'Richiesta non valida.' }); }
  const azione = String(b.azione || '');

  try {
    // ---------- I MIEI ANNUNCI (iscritto) ----------
    if (azione === 'miei') {
      const u = await utenteDaGettone(event);
      if (!u) return risposta(401, { error: 'Devi essere collegato.' });
      const email = String(u.email || '').trim().toLowerCase();
      const filtro = email
        ? `or=(user_id.eq.${u.id},email.ilike.${encodeURIComponent(email)})`
        : `user_id=eq.${u.id}`;
      const righe = await sb(`subappalti?${filtro}&select=${CAMPI_LETTI},token&order=created_at.desc&limit=50`);
      return risposta(200, {
        annunci: righe.map(({ token, ...r }) => ({ ...r, gestisci: linkGestione(r.id, token) }))
      });
    }

    // ---------- tutte le altre: serve id + token ----------
    const id = b.id, token = String(b.token || '');
    if (!id || !/^[0-9a-f-]{36}$/i.test(token)) return risposta(400, { error: 'Link non valido.' });
    const trovati = await sb(`subappalti?id=eq.${encodeURIComponent(id)}&token=eq.${encodeURIComponent(token)}&select=${CAMPI_LETTI},email_link_inviata`);
    if (!trovati.length) return risposta(403, { error: 'Annuncio non trovato o link non valido.' });
    const a = trovati[0];
    const dove = `subappalti?id=eq.${encodeURIComponent(id)}&token=eq.${encodeURIComponent(token)}`;
    const pulito = ({ email_link_inviata, ...r }) => r;

    if (azione === 'leggi') return risposta(200, { annuncio: pulito(a) });

    if (azione === 'modifica') {
      const campi = b.campi || {};
      const nuovo = {};
      for (const [k, max] of Object.entries(MODIFICABILI)) {
        if (campi[k] === undefined) continue;
        const v = String(campi[k] ?? '').trim().slice(0, max);
        nuovo[k] = v || null;
      }
      if ('nome_impresa' in nuovo && !nuovo.nome_impresa) return risposta(400, { error: 'Il nome non può restare vuoto.' });
      if ('email' in nuovo && !emailValida(nuovo.email)) return risposta(400, { error: "Scrivi un'email valida: serve per gestire l'annuncio." });
      if (!Object.keys(nuovo).length) return risposta(400, { error: 'Niente da salvare.' });
      const r = await sb(dove, { method: 'PATCH', body: JSON.stringify(nuovo) });
      return risposta(200, { annuncio: pulito(r[0]) });
    }

    if (azione === 'chiudi') {
      const r = await sb(dove, { method: 'PATCH', body: JSON.stringify({ attivo: false }) });
      return risposta(200, { annuncio: pulito(r[0]) });
    }

    if (azione === 'riapri' || azione === 'rinnova') {
      const scade = new Date(Date.now() + GIORNI * 864e5).toISOString();
      const r = await sb(dove, { method: 'PATCH', body: JSON.stringify({ attivo: true, scade_il: scade, avviso_scadenza_il: null }) });
      return risposta(200, { annuncio: pulito(r[0]) });
    }

    if (azione === 'elimina') {
      await sb(dove, { method: 'DELETE' });
      return risposta(200, { eliminato: true });
    }

    if (azione === 'link') {
      if (a.email_link_inviata) return risposta(200, { gia_inviata: true });
      if (!RESEND_KEY || !emailValida(a.email)) return risposta(200, { inviata: false });
      const ok = await mandaEmail(a.email, 'Il tuo annuncio di subappalto è online', emailLink(a, linkGestione(id, token)));
      if (ok) await sb(dove, { method: 'PATCH', body: JSON.stringify({ email_link_inviata: true }) });
      return risposta(200, { inviata: ok });
    }

    return risposta(400, { error: 'Azione sconosciuta.' });
  } catch (err) {
    console.error('[subappalto-gestione]', azione, err.message);
    return risposta(500, { error: 'Qualcosa non ha funzionato, riprova tra poco.' });
  }
};
