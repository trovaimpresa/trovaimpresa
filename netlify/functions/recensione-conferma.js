// Il cliente ha cliccato il link nell'email: pubblica la recensione
// e decide se merita il bollino "verificata".

const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let token = '';
  try { token = String(JSON.parse(event.body || '{}').t || '').trim(); } catch (e) {}
  if (!/^[a-f0-9]{32,64}$/i.test(token)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Link non valido.' }) };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const { data: rec } = await sb.from('feedback_clienti')
      .select('id, impresa_id, email_cliente, confermata, token_scade')
      .eq('token', token).maybeSingle();

    if (!rec) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'scaduto', messaggio: 'Questo link non e piu valido. Puo darsi che tu abbia gia confermato la recensione.' }) };
    }
    if (rec.token_scade && new Date(rec.token_scade) < new Date()) {
      return { statusCode: 410, headers: corsHeaders, body: JSON.stringify({ error: 'scaduto', messaggio: 'Il link e scaduto. Puoi riscrivere la recensione dal profilo dell impresa.' }) };
    }

    // il bollino: questa email ha davvero contattato questa impresa su TrovaImpresa?
    let verificata = false;
    try {
      const { data: traccia } = await sb.rpc('recensione_ha_traccia', {
        p_impresa_id: rec.impresa_id, p_email: rec.email_cliente
      });
      verificata = traccia === true;
    } catch (e) { console.error('[recensione-conferma] traccia', e); }

    const { error } = await sb.from('feedback_clienti')
      .update({ confermata: true, verificata, confermata_il: new Date().toISOString(), token: null, token_scade: null })
      .eq('id', rec.id);
    if (error) throw error;

    const { data: imp } = await sb.from('imprese').select('nome').eq('id', rec.impresa_id).maybeSingle();

    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({ ok: true, verificata, impresa_id: rec.impresa_id, impresa: (imp && imp.nome) || '' })
    };
  } catch (e) {
    console.error('[recensione-conferma]', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore. Riprova fra poco.' }) };
  }
};
