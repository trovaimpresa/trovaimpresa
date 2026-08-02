// ============================================================
// CONTROLLO SALUTE DEL SITO — TrovaImpresa (agosto 2026)
//
// Perche' esiste: quando la chiave di Supabase smette di essere valida,
// niente si lamenta. Le email non partono, i pagamenti non attivano il
// Premium, il pannello admin non scrive — e sembra tutto normale.
// Questa funzione prova davvero le cose importanti e dice cosa non va.
//
// La chiama il pannello admin a ogni accesso e mostra un semaforo.
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function trova(nomi) {
  for (const n of nomi) {
    const v = (process.env[n] || '').trim();
    if (v) return { nome: n, valore: v };
  }
  return { nome: null, valore: '' };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = process.env.ADMIN_PASS || '';

  let u, p;
  try { ({ u, p } = JSON.parse(event.body || '{}')); }
  catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) }; }

  if (!ADMIN_USER || !ADMIN_PASS || u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  const controlli = [];
  const aggiungi = (nome, ok, dettaglio, cosaFare) =>
    controlli.push({ nome, ok, dettaglio: dettaglio || '', cosa_fare: cosaFare || '' });

  // ---- 1) La chiave di Supabase scrive e legge davvero? ----
  const url = trova(['SUPABASE_URL']);
  const key = trova(['SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE']);

  if (!url.valore || !key.valore) {
    aggiungi('Database', false,
      'Manca ' + (!url.valore ? 'SUPABASE_URL' : 'la chiave segreta') + ' fra le variabili di Netlify.',
      'Netlify → Site configuration → Environment variables.');
  } else {
    try {
      const sb = createClient(url.valore, key.valore, { auth: { persistSession: false, autoRefreshToken: false } });

      // Lettura semplice: se la chiave non e' valida, qui fallisce.
      const { error: e1 } = await sb.from('imprese').select('id').limit(1);
      if (e1) throw new Error(e1.message);

      // Prova del fuoco: questa vista e' negata a tutti tranne al service_role.
      // Se la leggiamo, la chiave e' davvero quella dei permessi pieni.
      let piena = true, notaPiena = '';
      const { error: e2 } = await sb.from('gest_accessi_riepilogo').select('user_id').limit(1);
      if (e2) {
        piena = false;
        notaPiena = e2.message;
      }

      if (piena) {
        aggiungi('Database e permessi', true, 'La chiave funziona e ha i permessi pieni.');
      } else {
        aggiungi('Database e permessi', false,
          'Il database risponde, ma la chiave non ha i permessi pieni: ' + notaPiena,
          'Su Netlify SUPABASE_SERVICE_KEY deve contenere la chiave "secret" di Supabase, non quella pubblica.');
      }
    } catch (err) {
      aggiungi('Database', false,
        'Supabase rifiuta la chiave: ' + err.message,
        'Copia la chiave secret da Supabase (Settings → API Keys → Secret keys) e rimettila su Netlify in SUPABASE_SERVICE_KEY e SUPABASE_SERVICE_ROLE. Poi Deploys → Trigger deploy → Clear cache and deploy site.');
    }
  }

  // ---- 2) Le email partono? ----
  const resend = (process.env.RESEND_API_KEY || '').trim();
  if (!resend) {
    aggiungi('Email', false,
      'Manca RESEND_API_KEY: nessuna email in partenza (benvenuto, notifiche preventivi, avvisi scadenze).',
      'Aggiungi la chiave su Netlify → Environment variables.');
  } else {
    try {
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: 'Bearer ' + resend } });
      if (r.status === 401 || r.status === 403) {
        aggiungi('Email', false, 'La chiave delle email non e\' piu\' valida (errore ' + r.status + ').',
          'Rigenera la chiave su Resend e aggiornala su Netlify.');
      } else {
        aggiungi('Email', true, 'Il servizio email risponde.');
      }
    } catch (err) {
      aggiungi('Email', false, 'Non riesco a contattare il servizio email: ' + err.message, 'Riprova fra poco.');
    }
  }

  // ---- 3) I pagamenti? ----
  const stripe = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!stripe) {
    aggiungi('Pagamenti', false, 'Manca STRIPE_SECRET_KEY: nessun pagamento puo\' essere incassato.',
      'Aggiungi la chiave su Netlify → Environment variables.');
  } else {
    try {
      const r = await fetch('https://api.stripe.com/v1/balance', { headers: { Authorization: 'Bearer ' + stripe } });
      if (r.status === 401) {
        aggiungi('Pagamenti', false, 'Stripe non riconosce piu\' la chiave.',
          'Copia la chiave segreta da Stripe e aggiornala su Netlify.');
      } else {
        aggiungi('Pagamenti', true, 'Stripe risponde.');
      }
    } catch (err) {
      aggiungi('Pagamenti', false, 'Non riesco a contattare Stripe: ' + err.message, 'Riprova fra poco.');
    }
  }

  // ---- 4) Gli avvisi automatici sanno a chi scrivere? ----
  if (!(process.env.ADMIN_EMAIL || '').trim()) {
    aggiungi('Avvisi a te', false,
      'Manca ADMIN_EMAIL: i riepiloghi automatici finiscono su info@trovaimpresa.com.',
      'Se va bene cosi\', ignora pure.');
  } else {
    aggiungi('Avvisi a te', true, 'Gli avvisi automatici arrivano a ' + process.env.ADMIN_EMAIL.trim() + '.');
  }

  const problemi = controlli.filter(c => !c.ok);
  return {
    statusCode: 200, headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      tutto_ok: problemi.length === 0,
      quanti_problemi: problemi.length,
      controlli
    })
  };
};
