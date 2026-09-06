// «Chi entra nel sito» — chi usa il proprio pannello, quante volte e per quanto.
//
// PERCHE' ESISTE. Del gestionale si sapeva gia' tutto (admin-utilizzo.js).
// Dei quattro pannelli non si sapeva niente: quante volte un'impresa ci
// entra e quanto ci resta non li contava nessuno. Da oggi li conta
// js/conta-pannello.js dentro `accessi_pannello`; qui si rileggono.
//
// L'ultimo ingresso NON viene da li': lo segna Supabase da solo in
// auth.users.last_sign_in_at, ed e' l'unica colonna piena fin dal primo
// giorno. Per questo lo stato (usa / fermo / mai entrato) si decide da
// quello e non dal contatore nuovo, che parte da zero.
//
// Stessa protezione di admin-visite.js: utente e password verificati lato
// server, lettura con service_role (la funzione SQL non e' esposta a nessun
// altro ruolo).
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

  let u, p;
  try {
    ({ u, p } = JSON.parse(event.body || '{}'));
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

  const supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data, error } = await supabaseAdmin.rpc('admin_chi_entra');
    if (error) throw error;

    // Da quando il contatore e' acceso: prima di questa data i secondi e le
    // "volte" sono a zero perche' non li registrava nessuno, non perche'
    // nessuno sia entrato. Serve a non far leggere un buco come un fatto.
    const { data: primo } = await supabaseAdmin
      .from('accessi_pannello')
      .select('aperto_il')
      .order('aperto_il', { ascending: true })
      .limit(1);

    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: data || [],
        conta_da: (primo && primo[0] && primo[0].aperto_il) || null
      })
    };
  } catch (err) {
    console.error('[admin-chi-entra] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
