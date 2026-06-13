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
    console.error('[subappalto-elimina] env vars mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let id, token;
  try {
    ({ id, token } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (id === undefined || id === null || id === '' || !token) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id e token sono obbligatori.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabaseAdmin
      .from('subappalti')
      .delete()
      .eq('id', id)
      .eq('token', token)
      .select();
    if (error) throw error;

    if (!data || data.length === 0) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Annuncio non trovato o token non valido.' }) };
    }

    console.log('[subappalto-elimina] annuncio eliminato:', id);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[subappalto-elimina] eccezione:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
