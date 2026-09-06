// Quante PERSONE hanno aperto il sito oggi e ieri (vista public.visite_giorno).
//
// PERCHE' ESISTE. Le caselle in cima alla dashboard dicevano cosa HAI
// (imprese, premium, citta'), non se il sito sta CRESCENDO. Questa dice
// quanta gente ci entra davvero, giorno per giorno.
// I dati arrivano da `visite_sito`, scritta da js/conta-visita.js dal 19
// agosto 2026 — senza cookie e senza pixel, quindi conta anche chi rifiuta
// il banner. La vista `visite_giorno` raggruppa per giorno all'ora italiana
// e conta le sessioni diverse (non le pagine viste).
// Stessa protezione di admin-arrivi.js: utente + password verificati lato
// server, lettura con service_role (la vista non e' leggibile con la anon).
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
    if (v) return { nome: n, valore: v };
  }
  return { nome: null, valore: '' };
}

// La data di OGGI in Italia, scritta 2026-09-06. Il server Netlify sta a UTC:
// senza questo, dopo mezzanotte italiana "oggi" sarebbe ancora ieri.
function giornoItalia(spostaGiorni) {
  const d = new Date(Date.now() + (spostaGiorni || 0) * 86400000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(d);
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
  if (!url.valore || !key.valore) {
    return {
      statusCode: 500, headers: corsHeaders,
      body: JSON.stringify({ error: 'Variabili Supabase mancanti su Netlify.' })
    };
  }

  const supabaseAdmin = createClient(url.valore, key.valore, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data, error } = await supabaseAdmin
      .from('visite_giorno')
      .select('*')
      .order('giorno', { ascending: false })
      .limit(40);
    if (error) throw error;

    const righe = data || [];
    const perGiorno = {};
    righe.forEach(function (r) { perGiorno[r.giorno] = r; });

    const dOggi = giornoItalia(0);
    const dIeri = giornoItalia(-1);
    const oggi = (perGiorno[dOggi] || {}).persone || 0;
    const ieri = (perGiorno[dIeri] || {}).persone || 0;

    // La media dei 7 giorni PRIMA di ieri: ieri va confrontato con giorni
    // finiti, non con se stesso e non con oggi (che e' ancora a meta').
    const precedenti = [];
    for (let i = 2; i <= 8; i++) {
      const g = perGiorno[giornoItalia(-i)];
      if (g) precedenti.push(g.persone);
    }
    const media7 = precedenti.length
      ? Math.round(precedenti.reduce(function (t, n) { return t + n; }, 0) / precedenti.length)
      : null;

    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({ success: true, oggi, ieri, media7, giorni: righe.slice(0, 14) })
    };
  } catch (err) {
    console.error('[admin-visite] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
