const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Elimina un annuncio pubblicitario lato ADMIN (service_role, protetto da password admin).
// Body: { u, p, id }
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

  let u, p, id;
  try {
    ({ u, p, id } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }
  if (!id) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id mancante.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  try {
    const { error } = await sb.from('annunci_pubblicitari').delete().eq('id', id);
    if (error) throw error;
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
