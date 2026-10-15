// «Clienti che cercano» — quante PERSONE entrano nel sito, cercano
// un'impresa, prendono un contatto e lasciano una richiesta o un preventivo.
// 15 ottobre 2026. Gemella di admin-ricerche.js: stessa protezione (utente e
// password verificati lato server, freno sui tentativi, lettura con
// service_role). Il conteggio sta nella funzione SQL admin_clienti_cercano
// (sql/2026-10-15-clienti-cercano.sql).
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
  /* 27 set 2026: freno sui tentativi (netlify/functions/lib/admin-freno.js) */
  if (await require('./lib/admin-freno')(event, u === ADMIN_USER && p === ADMIN_PASS)) {
    return { statusCode: 429, headers: corsHeaders, body: JSON.stringify({ error: 'Troppi tentativi: riprova fra 15 minuti.' }) };
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
    const { data, error } = await supabaseAdmin.rpc('admin_clienti_cercano', { p_giorni: g });
    if (error) throw error;
    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({ success: true, data: data || {} })
    };
  } catch (err) {
    console.error('[admin-clienti-cercano] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
