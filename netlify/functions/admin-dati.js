const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Tabelle che questa funzione e' autorizzata a gestire.
const TABELLE_CONSENTITE = ['feedback_clienti', 'segnalazioni', 'subappalti'];
const AZIONI_CONSENTITE = ['list', 'update', 'delete'];

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[admin-dati] env Supabase mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }
  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('[admin-dati] env ADMIN_USER/ADMIN_PASS mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let u, p, action, table, id, patch;
  try {
    ({ u, p, action, table, id, patch } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  // 1) Password admin verificata SEMPRE lato server (mai fidarsi del client).
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  // 2) Whitelist tabella e azione.
  if (!TABELLE_CONSENTITE.includes(table)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Tabella non consentita.' }) };
  }
  if (!AZIONI_CONSENTITE.includes(action)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Azione non consentita.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 3) Solo con password valida si tocca il database, con service_role.
    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data }) };
    }

    if (action === 'update') {
      if (id === undefined || id === null) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id mancante.' }) };
      }
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'patch mancante o non valido.' }) };
      }
      const { error } = await supabaseAdmin.from(table).update(patch).eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    if (action === 'delete') {
      if (id === undefined || id === null) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id mancante.' }) };
      }
      const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    // Non dovrebbe accadere (azione gia' validata sopra).
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Richiesta non valida.' }) };

  } catch (err) {
    console.error('[admin-dati] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
