const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};


// ---- 27 settembre 2026 — LE EMAIL ALL'IMPRESA ----
// Quando Alessio risponde in Assistenza o chiude una richiesta, l'impresa
// lo viene a sapere anche se non riapre il gestionale per giorni.
// Se l'email non parte, la risposta resta comunque salvata: non si ferma niente.
const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function emailDi(sb, uid) {
  try {
    const { data: imp } = await sb.from('imprese').select('email, nome_attivita, nome').eq('user_id', uid).limit(1).maybeSingle();
    if (imp && imp.email) return { email: imp.email, nome: imp.nome || '' };
  } catch (e) {}
  try {
    const { data } = await sb.auth.admin.getUserById(uid);
    if (data && data.user && data.user.email) return { email: data.user.email, nome: '' };
  } catch (e) {}
  return null;
}
async function mandaEmail(to, subject, corpo) {
  if (!process.env.RESEND_API_KEY || !to) return false;
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;font-size:17px;line-height:1.7;color:#12233a;max-width:560px">
      <div style="text-align:center;padding:16px 0 20px">
        <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
      </div>
      ${corpo}
      <p>Un cordiale saluto,<br>Il Team di TrovaImpresa.com</p>
    </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [to], subject, html, reply_to: ['info@trovaimpresa.com'] })
    });
    if (!r.ok) console.error('[admin-supporto] resend', r.status, await r.text());
    return r.ok;
  } catch (e) { console.error('[admin-supporto] email', e.message); return false; }
}

// Gestione chat di supporto lato ADMIN (service_role).
// Azioni: list | reply | delete_conv | delete_msg | mark_read
exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_USER || !ADMIN_PASS) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let u, p, action, user_id, messaggio, msg_id, richiesta_id, origine;
  try {
    ({ u, p, action, user_id, messaggio, msg_id, richiesta_id, origine } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    if (action === 'list') {
      const { data: msgs, error } = await sb.from('supporto_messaggi')
        .select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const ids = [...new Set((msgs || []).map(m => m.user_id).filter(Boolean))];
      let utenti = {};
      if (ids.length) {
        const { data: imp } = await sb.from('imprese')
          .select('user_id, nome, nome_attivita, email, tipo').in('user_id', ids);
        (imp || []).forEach(r => {
          utenti[r.user_id] = { nome: r.nome_attivita || r.nome || r.email || 'Utente', email: r.email || '', tipo: r.tipo || '' };
        });
      }
      // 3 settembre 2026 — allegati: il bucket e' privato, il pannello riceve
      // un link firmato (vale un'ora). Se la firma fallisce il messaggio
      // arriva lo stesso, senza foto.
      const conAllegato = (msgs || []).filter(m => m.allegato);
      if (conAllegato.length) {
        try {
          const paths = [...new Set(conAllegato.map(m => m.allegato))];
          const { data: firmati } = await sb.storage.from('supporto-allegati').createSignedUrls(paths, 3600);
          const mappa = {};
          (firmati || []).forEach((r, i) => { if (r && r.signedUrl) mappa[r.path || paths[i]] = r.signedUrl; });
          conAllegato.forEach(m => { m.allegato_url = mappa[m.allegato] || null; });
        } catch (e) { console.error('[admin-supporto] firma allegati:', e.message); }
      }
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, messaggi: msgs || [], utenti }) };
    }

    if (action === 'reply') {
      if (!user_id || !messaggio || !String(messaggio).trim()) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'user_id o messaggio mancante.' }) };
      }
      // una email ogni 15 minuti per conversazione: se ho gia' risposto da
      // poco, la risposta nuova la trova insieme all'altra
      const da = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recenti } = await sb.from('supporto_messaggi').select('id')
        .eq('user_id', user_id).eq('da_admin', true).gte('created_at', da).limit(1);
      const { error } = await sb.from('supporto_messaggi')
        .insert({ user_id, da_admin: true, messaggio: String(messaggio).trim(), letto: false });
      if (error) throw error;
      let email = false;
      if (!recenti || !recenti.length) {
        const dest = await emailDi(sb, user_id);
        // dal gestionale si torna nella chat del gestionale; dal sito, al pannello
        const link = origine === 'sito' ? 'https://trovaimpresa.com/login-impresa.html' : 'https://trovaimpresa.com/gestionale-app.html#assistenza';
        if (dest) email = await mandaEmail(dest.email, 'Ti abbiamo risposto — Assistenza TrovaImpresa', `
          <p>Ciao${dest.nome ? ' ' + escH(dest.nome) : ''},</p>
          <p>c'è una risposta al messaggio che ci hai scritto:</p>
          <blockquote style="border-left:4px solid #0066ff;margin:18px 0;padding:8px 0 8px 16px;color:#334">${escH(String(messaggio).trim())}</blockquote>
          <p><a href="${link}" style="display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Apri la conversazione</a></p>`);
      }
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, email }) };
    }

    // 27 settembre 2026 — la richiesta di «Chiedi una funzione» e' cambiata:
    // si avvisa chi l'ha mandata. Il testo lo rilegge il server.
    if (action === 'avvisa_richiesta') {
      if (!/^\d+$/.test(String(richiesta_id || ''))) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'richiesta_id mancante.' }) };
      const { data: r } = await sb.from('gest_richieste').select('id, user_id, email, testo, stato, risposta').eq('id', richiesta_id).maybeSingle();
      if (!r) return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Richiesta non trovata.' }) };
      const STATI = { ricevuta: 'Ricevuta', in_lavorazione: 'Ci stiamo lavorando', fatta: 'Fatta', non_faremo: 'Per ora non la facciamo' };
      const dest = r.email ? { email: r.email, nome: '' } : await emailDi(sb, r.user_id);
      if (!dest) return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, email: false }) };
      const email = await mandaEmail(dest.email, r.stato === 'fatta' ? 'Fatto: quello che ci hai chiesto è nel gestionale' : 'Novità sulla tua richiesta — TrovaImpresa', `
        <p>Ciao,</p>
        <p>ci avevi scritto dal gestionale:</p>
        <blockquote style="border-left:4px solid #0066ff;margin:18px 0;padding:8px 0 8px 16px;color:#334">${escH(r.testo)}</blockquote>
        <p>A che punto è: <b>${escH(STATI[r.stato] || 'Ricevuta')}</b></p>
        ${r.risposta ? '<p style="background:#f4f8ff;border-left:4px solid #0066ff;border-radius:8px;padding:10px 14px">' + escH(r.risposta) + '</p>' : ''}
        <p><a href="https://trovaimpresa.com/gestionale-app.html#richieste" style="display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Apri il gestionale</a></p>`);
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, email }) };
    }

    if (action === 'mark_read') {
      if (!user_id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'user_id mancante.' }) };
      const { error } = await sb.from('supporto_messaggi')
        .update({ letto: true }).eq('user_id', user_id).eq('da_admin', false);
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    // Cancella UN solo messaggio, e solo se e' una risposta dell'admin:
    // i messaggi degli utenti non si toccano.
    if (action === 'delete_msg') {
      if (!msg_id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'msg_id mancante.' }) };
      const { data, error } = await sb.from('supporto_messaggi')
        .delete().eq('id', msg_id).eq('da_admin', true).select('id');
      if (error) throw error;
      if (!data || !data.length) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Messaggio non trovato, oppure non e\' una tua risposta.' }) };
      }
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    if (action === 'delete_conv') {
      if (!user_id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'user_id mancante.' }) };
      const { error } = await sb.from('supporto_messaggi').delete().eq('user_id', user_id);
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Azione non consentita.' }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
