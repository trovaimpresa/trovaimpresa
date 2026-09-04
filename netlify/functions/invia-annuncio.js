// ============================================================
// SCRIVI A TUTTI — TrovaImpresa (agosto 2026)
//
// Manda la stessa email a un gruppo di iscritti, ma personalizzata:
// ognuno riceve il proprio nome e la propria data di scadenza.
//
// Segnaposto utilizzabili nel testo e nell'oggetto:
//   [NOME]      nome dell'attivita' (o "utente" se manca)
//   [SCADENZA]  data di scadenza del Premium, scritta all'italiana
//   [CITTA]     citta' dell'impresa
//
// Gruppi: 'completi' | 'incompleti' | 'tutti' | 'prova'
// 'prova' manda solo ad Alessio, per vedere com'e' venuta prima di
// spedirla a tutti. Usare SEMPRE quello prima dell'invio vero.
//
// L'invio passa dall'endpoint "batch" di Resend: una sola chiamata per
// un massimo di 100 email, cosi' non si sbatte contro i limiti di
// velocita' e la funzione non va in timeout.
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const MITTENTE = 'TrovaImpresa <info@trovaimpresa.com>';
const EMAIL_PROVA = 'pintoalessio@icloud.com';
const MAX_DESTINATARI = 100;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dataIta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Il testo arriva scritto a mano, con le righe vuote fra i paragrafi.
// Qui diventa HTML leggibile, senza che Alessio debba scrivere tag.
function testoInHtml(testo) {
  const paragrafi = String(testo || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const corpo = paragrafi
    .map(p => '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#12233a">' + esc(p).replace(/\n/g, '<br>') + '</p>')
    .join('');
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f7fb">'
    + '<div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
    + '<div style="background:#fff;border-radius:14px;padding:30px 28px">'
    + '<div style="font-size:22px;font-weight:800;color:#0a2a4d;margin-bottom:22px">'
    + '<span style="color:#0066ff">Trova</span><span style="color:#0a2a4d">Impresa</span></div>'
    + corpo
    + '</div>'
    + '<div style="text-align:center;font-size:13px;color:#5b6b80;padding:18px 10px;line-height:1.6">'
    + 'TrovaImpresa.com &middot; Alessio Pinto &middot; Rieti (RI)<br>'
    + 'Ricevi questa email perche&#39; sei iscritto a TrovaImpresa.com'
    + '</div></div></body></html>';
}

function riempi(testo, imp) {
  const nome = (imp.nome_attivita || imp.nome || '').trim() || 'utente';
  return String(testo || '')
    .replace(/\[NOME\]/g, nome)
    .replace(/\[SCADENZA\]/g, dataIta(imp.premium_scadenza))
    .replace(/\[CITTA\]/g, (imp.citta || '').trim());
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = process.env.ADMIN_PASS || '';
  const RESEND = (process.env.RESEND_API_KEY || '').trim();

  let u, p, gruppo, oggetto, testo, solo_conteggio, azione;
  try { ({ u, p, gruppo, oggetto, testo, solo_conteggio, azione } = JSON.parse(event.body || '{}')); }
  catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) }; }

  if (!ADMIN_USER || !ADMIN_PASS || u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione database mancante.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // ---- storico: le email gia' mandate (pannello "Email inviate") ----
  if (azione === 'storico') {
    const { data, error: e } = await sb.from('admin_email_inviate')
      .select('id, created_at, modo, gruppo, oggetto, testo, quanti, destinatari')
      .order('created_at', { ascending: false })
      .limit(100);
    if (e) return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Lettura storico: ' + e.message }) };
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, email: data || [] }) };
  }

  // ---- chi riceve ----
  const { data: tutte, error } = await sb.from('imprese')
    .select('id, nome, nome_attivita, email, citta, tipo, piano, premium_scadenza, is_test')
    .eq('is_test', false)
    .eq('email_confermata', true);
  if (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Lettura imprese: ' + error.message }) };
  }

  const conEmail = (tutte || []).filter(i => i.email && i.email.includes('@'));
  const completo = i => !!(i.nome_attivita && String(i.nome_attivita).trim());

  let destinatari;
  if (gruppo === 'prova') {
    const io = conEmail.find(i => (i.email || '').toLowerCase() === EMAIL_PROVA)
      || { nome_attivita: 'Impresa di prova', email: EMAIL_PROVA, citta: 'Rieti', premium_scadenza: new Date().toISOString() };
    destinatari = [io];
  } else if (gruppo === 'completi') {
    destinatari = conEmail.filter(completo);
  } else if (gruppo === 'incompleti') {
    destinatari = conEmail.filter(i => !completo(i));
  } else {
    destinatari = conEmail;
  }

  // Il pannello chiede prima quanti sono, per farli vedere ad Alessio
  // insieme all'anteprima, prima di spedire davvero.
  if (solo_conteggio) {
    const primo = destinatari[0];
    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        quanti: destinatari.length,
        anteprima: primo ? {
          a: primo.email,
          oggetto: riempi(oggetto, primo),
          testo: riempi(testo, primo)
        } : null
      })
    };
  }

  if (!oggetto || !String(oggetto).trim() || !testo || !String(testo).trim()) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Oggetto o testo mancante.' }) };
  }
  if (!RESEND) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Manca RESEND_API_KEY: le email non possono partire.' }) };
  }
  if (!destinatari.length) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nessun destinatario in questo gruppo.' }) };
  }
  if (destinatari.length > MAX_DESTINATARI) {
    return {
      statusCode: 400, headers: corsHeaders,
      body: JSON.stringify({ error: 'Troppi destinatari in una volta (' + destinatari.length + '). Il massimo e\' ' + MAX_DESTINATARI + '.' })
    };
  }

  // ---- invio in un colpo solo ----
  const lotto = destinatari.map(i => ({
    from: MITTENTE,
    to: [i.email],
    subject: riempi(oggetto, i),
    html: testoInHtml(riempi(testo, i))
  }));

  try {
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
      body: JSON.stringify(lotto)
    });
    const risposta = await r.json().catch(() => ({}));
    if (!r.ok) {
      return {
        statusCode: 502, headers: corsHeaders,
        body: JSON.stringify({ error: 'Resend ha rifiutato l\'invio: ' + ((risposta && risposta.message) || r.status) })
      };
    }
    const inviate = Array.isArray(risposta.data) ? risposta.data.length : destinatari.length;

    // Archivio: ogni invio resta scritto, prova compresa, cosi' Alessio
    // ritrova cosa ha mandato, a chi e quando. Un errore qui non deve
    // far sembrare fallito un invio che invece e' partito.
    try {
      await sb.from('admin_email_inviate').insert({
        modo: gruppo === 'prova' ? 'prova' : 'vero',
        gruppo,
        oggetto: String(oggetto),
        testo: String(testo),
        quanti: inviate,
        destinatari: destinatari.map(i => i.email)
      });
    } catch (e) { console.error('[invia-annuncio] storico non salvato:', e.message); }

    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        inviate,
        destinatari: destinatari.map(i => i.email)
      })
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore di rete verso Resend: ' + err.message }) };
  }
};
