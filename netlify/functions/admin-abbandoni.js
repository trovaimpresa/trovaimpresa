// =====================================================================
// CHI SE N'È ANDATO — la lista per il pannello admin
//
// 14 agosto 2026
//
// Stessa protezione di admin-utilizzo.js e admin-dati.js: utente e
// password verificati QUI, sul server, e solo dopo si legge con la
// service key. La tabella `iscrizioni_annullate` dal browser non si
// legge in nessun modo (RLS accesa, nessuna policy, nessun grant): e'
// voluto, dentro ci sono le email di persone che hanno chiesto di essere
// cancellate.
//
// Torna due cose:
//   - `righe`: l'elenco, dal piu' recente
//   - `conti`: i numeri che si guardano per primi (quanti in tutto,
//     quanti nell'ultimo mese, quanti erano paganti, quanto duravano)
// =====================================================================
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
  if (!url.valore || !key.valore) {
    return { statusCode: 500, headers: corsHeaders,
             body: JSON.stringify({ error: 'Variabili Supabase mancanti su Netlify.' }) };
  }

  const supabaseAdmin = createClient(url.valore, key.valore, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data, error } = await supabaseAdmin
      .from('iscrizioni_annullate')
      .select('*')
      .order('annullato_il', { ascending: false })
      .limit(500);

    if (error) {
      // ⚠️ la tabella non c'e' ancora: NON e' un errore da schermata rossa.
      // Vuol dire che sql/iscrizioni-annullate.sql non e' stato lanciato,
      // ed e' una cosa che si dice in una riga, non un guasto.
      const m = (error.message || '').toLowerCase();
      if (m.includes('does not exist') || m.includes('schema cache') || m.includes('relation')) {
        return { statusCode: 200, headers: corsHeaders,
                 body: JSON.stringify({ success: true, manca_tabella: true, righe: [], conti: null }) };
      }
      throw error;
    }

    const righe = data || [];
    const oggi = new Date();
    const trentaGiorniFa = new Date(oggi.getTime() - 30 * 24 * 3600 * 1000);

    const durate = righe.map(r => r.giorni_iscritto).filter(x => x != null);
    const conti = {
      totale:        righe.length,
      ultimi_30:     righe.filter(r => new Date(r.annullato_il) >= trentaGiorniFa).length,
      erano_premium: righe.filter(r => String(r.piano || '').toLowerCase() === 'premium').length,
      // la mediana, non la media: un solo account durato tre anni
      // sposterebbe la media e farebbe sembrare che durano tutti tanto
      giorni_mediana: durate.length
        ? durate.slice().sort((a, b) => a - b)[Math.floor(durate.length / 2)]
        : null,
      // quanti se ne sono andati entro la prima settimana: sono quelli
      // che non hanno capito cos'era, ed e' il numero su cui si puo'
      // fare davvero qualcosa
      entro_7_giorni: durate.filter(g => g <= 7).length,
      con_motivo:     righe.filter(r => r.motivo || r.motivo_libero).length
    };

    return { statusCode: 200, headers: corsHeaders,
             body: JSON.stringify({ success: true, righe, conti }) };

  } catch (err) {
    console.error('[admin-abbandoni] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
