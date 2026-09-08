// netlify/functions/admin-statistiche-pubblicita.js
//
// Quante volte ogni cartello pubblicitario e' stato visto e cliccato.
//
// PERCHE' PASSA DA QUI E NON DAL BROWSER.
// L'admin si collega a Supabase con la chiave pubblica, quella scritta nel
// sorgente del sito che chiunque puo' leggere. La tabella annunci_statistiche
// e' chiusa apposta: ogni cliente vede solo i suoi numeri. Per farli vedere
// ad Alex senza aprirla a tutti, la lettura si fa qui: utente e password
// verificati lato server, poi si legge con la chiave di servizio.
// Stessa protezione di admin-visite.js e admin-arrivi.js.

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

// La data di oggi in Italia: il server Netlify sta a UTC e dopo mezzanotte
// italiana sbaglierebbe giorno.
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
      .from('annunci_statistiche')
      .select('annuncio_id,giorno,viste,clic');
    if (error) throw error;

    const da30 = giornoItalia(-29);
    const da7  = giornoItalia(-6);
    const per = {};

    (data || []).forEach(function (r) {
      const id = r.annuncio_id;
      if (!per[id]) per[id] = { viste: 0, clic: 0, viste30: 0, clic30: 0, viste7: 0, clic7: 0 };
      const v = Number(r.viste) || 0;
      const c = Number(r.clic) || 0;
      per[id].viste += v;
      per[id].clic  += c;
      if (r.giorno >= da30) { per[id].viste30 += v; per[id].clic30 += c; }
      if (r.giorno >= da7)  { per[id].viste7  += v; per[id].clic7  += c; }
    });

    return {
      statusCode: 200, headers: corsHeaders,
      body: JSON.stringify({ success: true, statistiche: per })
    };
  } catch (err) {
    return {
      statusCode: 500, headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Errore lettura statistiche.' })
    };
  }
};
