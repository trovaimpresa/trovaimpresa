// «Ricerche e visite» — che cosa fa il CLIENTE sul sito pubblico.
//
// PERCHE' ESISTE. «Chi entra nel sito» (admin-chi-entra.js) guarda gli
// ISCRITTI e il loro pannello. Questa guarda le persone che non sono
// iscritte a niente: quante aprono la scheda di un'impresa, quante
// ricerche fanno, che cosa cercano, dove, e quante volte non trovano
// nessuno. I dati li scrive js/conta-cliente.js in `visite_clienti`.
//
// Stessa protezione delle altre admin-*: utente e password verificati
// lato server, lettura con service_role (la funzione SQL non e' esposta
// ne' ad anon ne' agli utenti loggati).
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const NOMI_URL = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
const NOMI_KEY = [
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_KEY'
];

function trova(nomi) {
  for (const n of nomi) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = process.env.ADMIN_PASS || '';

  let u, p, giorni;
  try {
    ({ u, p, giorni } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!ADMIN_USER || !ADMIN_PASS) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'ADMIN_USER / ADMIN_PASS non configurati su Netlify.' }) };
  }
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  const url = trova(NOMI_URL);
  const key = trova(NOMI_KEY);
  if (!url || !key) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Variabili Supabase mancanti su Netlify.' }) };
  }

  // 0 o valori strani = «sempre»: 3650 giorni sono dieci anni, piu' di
  // quanti ne abbia il sito.
  let g = parseInt(giorni, 10);
  if (!Number.isFinite(g) || g <= 0) g = 3650;

  const supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data, error } = await supabaseAdmin.rpc('admin_ricerche_visite', { p_giorni: g });
    if (error) throw error;
    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({ success: true, data: data || {} })
    };
  } catch (err) {
    console.error('[admin-ricerche] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
