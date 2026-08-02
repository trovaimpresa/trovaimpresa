const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

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

  let u, p, action, user_id, messaggio, msg_id;
  try {
    ({ u, p, action, user_id, messaggio, msg_id } = JSON.parse(event.body || '{}'));
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
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, messaggi: msgs || [], utenti }) };
    }

    if (action === 'reply') {
      if (!user_id || !messaggio || !String(messaggio).trim()) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'user_id o messaggio mancante.' }) };
      }
      const { error } = await sb.from('supporto_messaggi')
        .insert({ user_id, da_admin: true, messaggio: String(messaggio).trim(), letto: false });
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
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
