// ============================================================
// INVIA UN DOCUMENTO AL CLIENTE — TrovaImpresa (agosto 2026)
//
// Prende un documento gia' caricato nella scheda cliente e lo manda
// per email al cliente, in allegato, con copia al mittente.
//
// Body atteso:
//   { access_token, doc_id, a, oggetto, messaggio, copia_a_me }
//
// SICUREZZA: non si fida del browser. Con l'access_token verifica chi
// sta chiedendo, e poi carica il documento SOLO se quella riga appartiene
// a quell'utente. Senza questo controllo chiunque potrebbe farsi mandare
// i documenti di un altro cambiando un numero.
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const MITTENTE = 'TrovaImpresa <info@trovaimpresa.com>';
const BUCKET   = 'gestionale-foto';
// Resend accetta allegati piu' grandi, ma la base64 gonfia il peso di un terzo
// e molte caselle rifiutano oltre i 10 MB: meglio dirlo prima che dopo.
const MAX_ALLEGATO = 10 * 1024 * 1024;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function corpoHtml(messaggio, nomeFile, mittenteNome) {
  const paragrafi = String(messaggio || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const testo = paragrafi
    .map(p => '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#12233a">' + esc(p).replace(/\n/g, '<br>') + '</p>')
    .join('');
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f7fb">'
    + '<div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
    +   '<div style="text-align:center;padding:0 0 18px"><a href="https://trovaimpresa.com" style="text-decoration:none"><img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a></div>'
    +   '<div style="background:#fff;border-radius:14px;padding:30px 28px">'
    +     '<div style="font-size:22px;font-weight:800;color:#0a2a4d;margin-bottom:22px">'
    +       '<span style="color:#0066ff">Trova</span><span style="color:#0a2a4d">Impresa</span></div>'
    +     testo
    +     '<div style="margin-top:22px;padding:14px 16px;background:#f4f7fb;border-radius:10px;font-size:15px;color:#41546b">'
    +       'In allegato: <b>' + esc(nomeFile) + '</b>'
    +     '</div>'
    +   '</div>'
    +   '<div style="text-align:center;font-size:13px;color:#5b6b80;padding:18px 10px;line-height:1.6">'
    +     esc(mittenteNome || 'TrovaImpresa') + ' &middot; inviato tramite TrovaImpresa.com'
    +   '</div>'
    + '</div></body></html>';
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const RESEND       = (process.env.RESEND_API_KEY || '').trim();

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione database mancante.' }) };
  }
  if (!RESEND) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Manca RESEND_API_KEY: l\'email non puo\' partire.' }) };
  }

  let access_token, doc_id, a, oggetto, messaggio, copia_a_me;
  try {
    ({ access_token, doc_id, a, oggetto, messaggio, copia_a_me } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!access_token) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Sessione mancante: rientra nel gestionale.' }) };
  if (!doc_id)       return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Documento non indicato.' }) };
  if (!a || String(a).indexOf('@') < 0) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Indirizzo email del destinatario non valido.' }) };
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // ---- chi sta chiedendo ----
  const { data: ures, error: uerr } = await sb.auth.getUser(access_token);
  const user = ures && ures.user;
  if (uerr || !user) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Sessione scaduta: rientra nel gestionale.' }) };
  }

  // ---- il documento e' suo? ----
  const { data: doc, error: derr } = await sb.from('gest_foto')
    .select('id, storage_path, nome_file, cliente_id')
    .eq('id', doc_id).eq('user_id', user.id).maybeSingle();
  if (derr) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Lettura documento: ' + derr.message }) };
  }
  if (!doc || !doc.storage_path) {
    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Documento non trovato.' }) };
  }

  // ---- scarico il file ----
  const { data: blob, error: serr } = await sb.storage.from(BUCKET).download(doc.storage_path);
  if (serr || !blob) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Non riesco a leggere il file: ' + ((serr && serr.message) || 'sconosciuto') }) };
  }
  const buf = Buffer.from(await blob.arrayBuffer());
  if (buf.length > MAX_ALLEGATO) {
    return {
      statusCode: 413, headers: corsHeaders,
      body: JSON.stringify({ error: 'Il file pesa ' + (buf.length / 1048576).toFixed(1) + ' MB: troppo per una email. Il limite e\' 10 MB.' })
    };
  }

  const nomeFile = doc.nome_file || String(doc.storage_path).split('/').pop() || 'documento';

  // ---- nome dell'impresa, per la firma ----
  let mittenteNome = '';
  try {
    const { data: az } = await sb.from('gest_azienda').select('nome').eq('user_id', user.id).maybeSingle();
    if (az && az.nome) mittenteNome = az.nome;
  } catch (e) { /* la firma e' un di piu': se non c'e', pazienza */ }

  const destinatari = [String(a).trim()];
  if (copia_a_me !== false && user.email && destinatari.indexOf(user.email) < 0) destinatari.push(user.email);

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MITTENTE,
        to: destinatari,
        reply_to: user.email || undefined,
        subject: (oggetto && String(oggetto).trim()) || ('Documento: ' + nomeFile),
        html: corpoHtml(messaggio, nomeFile, mittenteNome),
        attachments: [{ filename: nomeFile, content: buf.toString('base64') }]
      })
    });
    const risposta = await r.json().catch(() => ({}));
    if (!r.ok) {
      return {
        statusCode: 502, headers: corsHeaders,
        body: JSON.stringify({ error: 'Resend ha rifiutato l\'invio: ' + ((risposta && risposta.message) || r.status) })
      };
    }
    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({ success: true, destinatari: destinatari, file: nomeFile })
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore di rete verso Resend: ' + err.message }) };
  }
};
