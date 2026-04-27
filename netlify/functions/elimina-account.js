const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[elimina-account] env vars mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let access_token;
  try {
    ({ access_token } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!access_token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token mancante.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(access_token);
    if (userErr || !user) {
      console.error('[elimina-account] token non valido:', userErr?.message);
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token non valido o scaduto.' }) };
    }

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error('[elimina-account] deleteUser fallito:', delErr.message);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore eliminazione account: ' + delErr.message }) };
    }

    console.log('[elimina-account] utente eliminato:', user.id);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[elimina-account] eccezione:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
