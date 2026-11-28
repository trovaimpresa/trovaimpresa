// «Facebook» — la sezione del pannello admin (28 novembre 2026).
// Alex: «un nuovo contatore chiamato Facebook, da lì controlliamo tutto
// l'andamento della mia pagina»; «così come mi consigli tu contiamo i clic».
// Post pubblicati da Make (fb_pubblicati) + persone arrivate sul sito da
// Facebook/Instagram (visite_sito.da_meta), divise per la pagina dove
// arrivano. Il conto lo fa la funzione SQL admin_facebook(p_giorni), che
// solo la chiave di servizio puo' chiamare.
// Stessa protezione di admin-chi-entra.js: utente e password admin + freno.
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const NOMI_URL = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
const NOMI_KEY = ['SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_KEY'];
const trova = nomi => { for (const n of nomi) { const v = (process.env[n] || '').trim(); if (v) return v; } return ''; };
const esci = (code, body) => ({ statusCode: code, headers: corsHeaders, body: JSON.stringify(body) });

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return esci(405, { error: 'Method Not Allowed' });

  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = process.env.ADMIN_PASS || '';
  let u, p, giorni;
  try { ({ u, p, giorni } = JSON.parse(event.body || '{}')); }
  catch { return esci(400, { error: 'Body JSON non valido.' }); }
  if (!ADMIN_USER || !ADMIN_PASS) return esci(500, { error: 'ADMIN_USER / ADMIN_PASS non configurati su Netlify.' });
  if (await require('./lib/admin-freno')(event, u === ADMIN_USER && p === ADMIN_PASS)) {
    return esci(429, { error: 'Troppi tentativi: riprova fra 15 minuti.' });
  }
  if (u !== ADMIN_USER || p !== ADMIN_PASS) return esci(401, { error: 'Credenziali admin non valide.' });

  const url = trova(NOMI_URL), key = trova(NOMI_KEY);
  if (!url || !key) return esci(500, { error: 'Variabili Supabase mancanti su Netlify.' });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const g = [7, 30].includes(Number(giorni)) ? Number(giorni) : 7;
  try {
    const { data, error } = await sb.rpc('admin_facebook', { p_giorni: g });
    if (error) throw error;
    return esci(200, { success: true, data });
  } catch (err) {
    console.error('[admin-facebook]', err.message);
    return esci(500, { error: err.message });
  }
};
