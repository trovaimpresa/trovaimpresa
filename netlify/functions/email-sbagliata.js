/* =====================================================================
   EMAIL SBAGLIATA — 13 novembre 2026

   Nasce da Ghabi anoir (Uboldo, 13 nov): si iscrive con
   "mghabi134@gmail.com". Il dominio e' giusto (gmail.com), quindi il
   controllo dei refusi (js/controllo-doppioni.js) non dice niente.
   Ma quella casella NON ESISTE: Gmail rimanda indietro la mail di
   conferma (Resend: «bounced») e l'iscritto resta fuori per sempre,
   senza saperlo.

   Questa funzione fa due cose, chiamata dalla schermata «Ci siamo quasi!»:
   · azione 'controlla' → chiede a Resend com'e' andata l'ultima mail
     mandata a quell'indirizzo (bounced / delivered / ...)
   · azione 'correggi'  → SOLO se la mail e' davvero tornata indietro,
     cambia l'indirizzo dell'account con quello nuovo e rimanda subito
     la mail di conferma.

   ⚠️ SICUREZZA: si cambia l'email solo se TUTTE queste cose sono vere:
     - l'account (user_id) esiste e ha proprio quella email
     - l'account NON e' ancora confermato
     - l'ultima mail a quell'indirizzo risulta tornata indietro su Resend
   Cosi' nessuno puo' usarla per prendersi l'account di un altro.
   ===================================================================== */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const risposta = (code, obj) => ({ statusCode: code, headers: CORS, body: JSON.stringify(obj) });
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TORNATA = ['bounced', 'suppressed', 'failed'];

async function statoSuResend(RESEND, email) {
  const r = await fetch('https://api.resend.com/emails?limit=100', {
    headers: { Authorization: 'Bearer ' + RESEND }
  });
  if (!r.ok) throw new Error('Resend ' + r.status);
  const j = await r.json();
  const lista = (j && j.data) || [];
  const e = email.toLowerCase();
  // la lista arriva dalla piu' recente: prendo la prima mail a quell'indirizzo
  const m = lista.find(x => (x.to || []).some(t => String(t).toLowerCase() === e));
  return m ? (m.last_event || 'sent') : 'nessuna';
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return risposta(405, { errore: 'Metodo non permesso' });

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const RESEND = (process.env.RESEND_API_KEY || '').trim();
  if (!SUPABASE_URL || !KEY || !RESEND) return risposta(500, { errore: 'Configurazione mancante' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return risposta(400, { errore: 'Dati non validi' }); }
  const azione = b.azione;
  const email = String(b.email || '').trim().toLowerCase();
  const userId = String(b.user_id || '').trim();
  if (!EMAIL_OK.test(email) || !/^[0-9a-f-]{36}$/i.test(userId)) return risposta(400, { errore: 'Dati non validi' });

  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  try {
    // 1. l'account deve esistere, avere quella email e NON essere confermato
    const ru = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + userId, { headers: H });
    if (!ru.ok) return risposta(404, { errore: 'Account non trovato' });
    const u = await ru.json();
    if (String(u.email || '').toLowerCase() !== email) return risposta(403, { errore: 'Non corrisponde' });
    if (u.email_confirmed_at) return risposta(200, { stato: 'confermata' });

    // 2. com'e' andata la mail su Resend
    const stato = await statoSuResend(RESEND, email);
    if (azione === 'controlla') return risposta(200, { stato, tornata: TORNATA.includes(stato) });

    if (azione !== 'correggi') return risposta(400, { errore: 'Azione sconosciuta' });
    if (!TORNATA.includes(stato)) return risposta(403, { errore: 'La mail non risulta tornata indietro' });

    const nuova = String(b.nuova || '').trim().toLowerCase();
    if (!EMAIL_OK.test(nuova)) return risposta(400, { errore: 'Scrivi un\'email valida.' });
    if (nuova === email) return risposta(400, { errore: 'È la stessa email di prima: controlla bene le lettere.' });

    // 3. cambio l'email dell'account (resta da confermare)
    const rc = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + userId, {
      method: 'PUT', headers: H, body: JSON.stringify({ email: nuova })
    });
    if (!rc.ok) {
      const t = await rc.text();
      if (/already|exists|registered/i.test(t)) return risposta(409, { errore: 'Questa email è già iscritta a TrovaImpresa. Prova ad accedere.' });
      return risposta(500, { errore: 'Non sono riuscito a cambiare l\'email.' });
    }

    // 4. cambio l'email anche nella scheda (imprese) — se non c'e' ancora, pazienza
    await fetch(SUPABASE_URL + '/rest/v1/imprese?user_id=eq.' + userId, {
      method: 'PATCH', headers: Object.assign({ Prefer: 'return=minimal' }, H), body: JSON.stringify({ email: nuova })
    }).catch(() => {});

    // 5. rimando la mail di conferma al nuovo indirizzo
    const rr = await fetch(SUPABASE_URL + '/auth/v1/resend', {
      method: 'POST', headers: H, body: JSON.stringify({ type: 'signup', email: nuova })
    });
    return risposta(200, { ok: true, rimandata: rr.ok, email: nuova });
  } catch (e) {
    return risposta(500, { errore: 'Errore: ' + (e.message || e) });
  }
};
