// Legge da dove arriva la gente sul sito (vista public.arrivi_per_canale).
//
// PERCHE' ESISTE. Dal 19 agosto js/conta-visita.js scrive ogni arrivo in
// `visite_sito` — senza cookie e senza pixel, quindi conta anche chi rifiuta
// il banner (Meta invece vede meno della meta' delle iscrizioni). Quelle righe
// pero' non le leggeva nessuno: la tabella ha solo la regola di scrittura.
// Qui si leggono con service_role, come fa admin-utilizzo.js.
// Stessa protezione di admin-dati.js: utente + password verificati lato server,
// lettura con service_role (la vista non e' leggibile con la chiave anon).
//
// Nota: cerca la chiave service_role sotto piu' nomi possibili, perche' i
// progetti Netlify la chiamano in modi diversi. Fa anche trim(): un a capo
// incollato per sbaglio nel valore fa fallire l'autenticazione su Supabase
// con "Unregistered API key".
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

  // Informazioni utili a capire cosa non va, senza mai esporre i segreti.
  const info = {
    variabile_url: url.nome || 'NESSUNA TROVATA',
    progetto_url: url.valore ? url.valore.replace('https://', '').split('.')[0] : '—',
    variabile_chiave: key.nome || 'NESSUNA TROVATA',
    lunghezza_chiave: key.valore.length,
    tipo_chiave: key.valore.startsWith('sb_secret_') ? 'nuova (sb_secret_)'
      : (key.valore.startsWith('eyJ') ? 'classica (JWT)' : 'formato non riconosciuto')
  };

  // Se la chiave e' un JWT, il progetto a cui appartiene si legge dal payload:
  // se non coincide con quello dell'URL, ecco spiegato "Unregistered API key".
  if (key.valore.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(key.valore.split('.')[1], 'base64').toString('utf8'));
      info.progetto_chiave = payload.ref || '—';
      info.ruolo_chiave = payload.role || '—';
      info.stesso_progetto = (payload.ref === info.progetto_url);
    } catch (_) {
      info.progetto_chiave = 'illeggibile';
    }
  }

  if (!url.valore || !key.valore) {
    return {
      statusCode: 500, headers: corsHeaders,
      body: JSON.stringify({ error: 'Variabili Supabase mancanti su Netlify.', info })
    };
  }

  const supabaseAdmin = createClient(url.valore, key.valore, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data, error } = await supabaseAdmin
      .from('arrivi_per_canale')
      .select('*')
      .order('persone_30gg', { ascending: false });
    if (error) throw error;

    /* Le risposte alla domanda «come ci hai conosciuto?» (schermata dopo la
       registrazione). E' l'unica misura che sa dire «me l'ha detto un amico».
       Se questa fallisce NON deve far fallire tutta la card: i canali sono
       l'informazione principale. */
    let dichiarate = [];
    try {
      const r2 = await supabaseAdmin
        .from('risposte_come_ci_hai_trovato')
        .select('*')
        .order('quante_30gg', { ascending: false });
      if (!r2.error) dichiarate = r2.data || [];
    } catch (_) { /* la card si disegna lo stesso */ }

    /* ⛔ 5 SETTEMBRE 2026 — LE ISCRIZIONI, non solo le visite.
       Fino a oggi questa card diceva quante PERSONE arrivavano da ogni
       canale, ma non quante si ISCRIVEVANO: la domanda vera («Facebook mi
       porta iscritti o solo curiosi?») non aveva risposta.
       La vista `iscrizioni_per_canale` usa la STESSA regola dei canali
       (`canale_da_provenienza`), quindi i due elenchi non si possono
       scollare. Se questa fallisce, la card si disegna lo stesso. */
    let iscrizioni = [];
    try {
      const r3 = await supabaseAdmin
        .from('iscrizioni_per_canale')
        .select('*')
        .order('iscrizioni_30gg', { ascending: false });
      if (!r3.error) iscrizioni = r3.data || [];
    } catch (_) { /* la card si disegna lo stesso */ }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data: data || [], dichiarate, iscrizioni }) };
  } catch (err) {
    console.error('[admin-arrivi] errore:', err.message, info);
    return {
      statusCode: 500, headers: corsHeaders,
      body: JSON.stringify({ error: err.message, info })
    };
  }
};
