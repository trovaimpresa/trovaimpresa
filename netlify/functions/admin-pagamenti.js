// =====================================================================
// GLI INCASSI — la tabella dei pagamenti per il pannello admin
//
// 14 agosto 2026 (notte)
//
// Stessa protezione di admin-utilizzo.js e admin-abbandoni.js: utente e
// password verificati QUI, sul server, e solo dopo si legge con la
// service key. La tabella `pagamenti` dal browser non si legge in nessun
// modo (RLS accesa, nessuna policy, nessun grant): dentro ci sono email e
// importi.
//
// ⚠️ I CONTI SI FANNO IN CENTESIMI, INTERI.
// La tabella tiene i centesimi apposta. Se qui si sommassero gli euro con
// la virgola, tre incassi da 19,99 potrebbero dare 59,970000000000006 —
// e' come funzionano i numeri con la virgola nei computer. Si somma
// l'intero e si divide alla fine, una volta sola.
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
      .from('pagamenti')
      .select('*')
      .order('quando', { ascending: false })
      .limit(1000);

    if (error) {
      // ⚠️ la tabella non c'e' ancora: NON e' un guasto, vuol dire che
      // sql/pagamenti.sql non e' stato lanciato. E soprattutto NON si puo'
      // mostrare «nessun incasso»: si leggerebbe come «non hai incassato
      // niente», che e' una cosa diversa e molto peggiore da credere.
      const m = (error.message || '').toLowerCase();
      if (m.includes('does not exist') || m.includes('schema cache') || m.includes('relation')) {
        return { statusCode: 200, headers: corsHeaders,
                 body: JSON.stringify({ success: true, manca_tabella: true, righe: [], conti: null }) };
      }
      throw error;
    }

    const righe = data || [];
    const cent = r => (r.centesimi != null
      ? Number(r.centesimi)
      : Math.round(Number(r.importo_eur || 0) * 100));

    const oggi = new Date();
    const inizioMese = Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth(), 1);
    const dodiciMesiFa = Date.UTC(oggi.getUTCFullYear() - 1, oggi.getUTCMonth(), oggi.getUTCDate());

    const somma = (f) => righe.filter(f).reduce((s, r) => s + cent(r), 0);

    // per prodotto, e per mese: sempre sommando interi
    const perProdotto = {};
    const perMese = {};
    for (const r of righe) {
      const pr = r.prodotto || 'altro';
      perProdotto[pr] = (perProdotto[pr] || 0) + cent(r);
      const d = new Date(r.quando);
      const mese = isNaN(d) ? 'senza data'
        : d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
      perMese[mese] = (perMese[mese] || 0) + cent(r);
    }

    const conti = {
      // tutto in centesimi: la pagina li divide una volta sola
      totale_cent:      somma(() => true),
      questo_mese_cent: somma(r => new Date(r.quando).getTime() >= inizioMese),
      ultimi_12_cent:   somma(r => new Date(r.quando).getTime() >= dodiciMesiFa),
      quanti:           righe.length,
      per_prodotto:     perProdotto,
      per_mese:         Object.keys(perMese).sort().reverse()
                          .slice(0, 12).map(m => ({ mese: m, cent: perMese[m] }))
    };

    return { statusCode: 200, headers: corsHeaders,
             body: JSON.stringify({ success: true, righe, conti }) };

  } catch (err) {
    console.error('[admin-pagamenti] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
