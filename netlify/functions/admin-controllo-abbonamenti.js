// =====================================================================
// LA RETE — 21 settembre 2026
//
// Confronta CHI PAGA SU STRIPE con CHI RISULTA ABBONATO NEL DATABASE, e
// dice dove i due si sono scollati.
//
// PERCHE' SERVE. Il permesso di entrare nel gestionale non sta su Stripe:
// sta scritto sulla riga del marketplace (`imprese.piano`,
// `premium_pagato`). Le due cose le tiene allineate il webhook, e il
// webhook e' un messaggio che viaggia in rete: puo' arrivare in ritardo,
// puo' fallire, puo' non trovare la riga giusta perche' cerca per EMAIL.
// Finche' non c'e' nessuno che li confronta, uno scollamento non fa
// rumore — e sono i difetti muti quelli che costano.
//
// I DUE GUAI CHE CERCA, e sono diversi:
//   1. PAGA E NON HA NIENTE — su Stripe l'abbonamento e' vivo, nel
//      database non risulta. E' il peggiore: il cliente paga e trova il
//      muro. Va sistemato subito a mano.
//   2. HA E NON PAGA — nel database risulta pagato, su Stripe non c'e'
//      nessun abbonamento vivo. Costa a te, non a lui: un premium
//      regalato per sbaglio. (I regali veri NON contano: si guarda
//      `premium_pagato`, che sui regali e' false.)
//
// ⚠️ IL CONFRONTO SI FA SULL'EMAIL, in minuscolo e senza spazi, perche'
// e' l'unica cosa che le due parti hanno in comune: il webhook scrive
// `.eq('email', email)` e su Stripe l'email sta nei metadata della
// sessione oppure sul cliente. Se un giorno si potesse cambiare l'email
// del profilo, questo controllo comincerebbe a dare falsi allarmi — e
// sarebbe giusto cosi': vorrebbe dire che il webhook non trova piu'
// nessuno.
//
// ⚠️ NON TOCCA NIENTE. Legge e basta, da tutte e due le parti. Le cose da
// sistemare le fa Alessio a mano, guardando il rapporto: un programma che
// accende e spegne piani da solo, sopra due sorgenti che possono
// sbagliare, farebbe piu' danni di quelli che ripara.
//
// PROTEZIONE: utente e password admin, come admin-pagamenti.js. Dentro ci
// sono email e importi di persone vere.
//
// ---------------------------------------------------------------------
// 21 settembre 2026 (sera) — SPACCATO IN DUE, e il motivo conta.
//
// Il confronto vero adesso sta dentro `confronta()`, ed e' esportato in
// fondo al file. Lo chiamano in DUE:
//   - questo handler, quando Alessio schiaccia il bottone nel pannello;
//   - netlify/functions/controllo-abbonamenti-settimanale.js, ogni
//     lunedi' mattina, da solo.
//
// ⛔ UNA COPIA SOLA. Se il confronto fosse scritto due volte, il giorno
//    che si corregge una regola (uno stato di Stripe in piu', una colonna
//    nuova) si correggerebbe in un posto solo, e per mesi il bottone e
//    l'email dell'orologio direbbero cose diverse. Un controllo di cui
//    non ti fidi e' peggio di nessun controllo.
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const NOMI_URL = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
const NOMI_KEY = [
  'SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_KEY'
];

function trova(nomi) {
  for (const n of nomi) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
}

const pulisci = (e) => String(e || '').trim().toLowerCase();

/* gli stati che vogliono dire «questo sta pagando o sta per pagare».
   `canceled` e `incomplete_expired` no: quelli sono finiti. */
const VIVI = ['active', 'trialing', 'past_due', 'unpaid'];

// =====================================================================
// IL CONFRONTO — la parte che conta, quella che non va duplicata.
// Non legge process.env per l'autorizzazione e non risponde a nessuno:
// prende le chiavi, guarda, e restituisce il rapporto. Chi la chiama
// decide cosa farne (mostrarlo, mandarlo per email, ignorarlo).
// =====================================================================
async function confronta({ chiaveStripe, url, key }) {
  const stripe = new Stripe(chiaveStripe);
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // ---- 1. chi paga, secondo Stripe ----------------------------------
  /* ⚠️ Si scorrono TUTTE le pagine. Con `limit: 100` e basta, il giorno
     che gli abbonati passano il centinaio il controllo comincerebbe a
     guardarne solo cento e a dire che va tutto bene. */
  const suStripe = new Map();   // email -> { stato, id, prodotto, disdetto_a_fine }
  let pagina = await stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] });
  let giri = 0;
  while (true) {
    for (const a of pagina.data) {
      if (!VIVI.includes(String(a.status || ''))) continue;
      const email = pulisci(
        (a.metadata && a.metadata.email) ||
        (a.customer && a.customer.email) || ''
      );
      if (!email) continue;
      suStripe.set(email, {
        stato: a.status,
        abbonamento: a.id,
        prodotto: (a.metadata && a.metadata.prodotto) || null,
        disdetto_a_fine_periodo: a.cancel_at_period_end === true
      });
    }
    if (!pagina.has_more || giri++ > 50) break;
    pagina = await stripe.subscriptions.list({
      status: 'all', limit: 100, expand: ['data.customer'],
      starting_after: pagina.data[pagina.data.length - 1].id
    });
  }

  // ---- 2. chi risulta abbonato, secondo il database -----------------
  const { data: righe, error } = await sb
    .from('imprese')
    .select('id, email, nome_attivita, piano, premium_pagato, premium_scadenza, chat_pro, gestionale_attivo, stripe_customer_id');
  if (error) throw new Error('Non riesco a leggere le imprese: ' + error.message);

  const nelSito = new Map();
  for (const r of (righe || [])) {
    const email = pulisci(r.email);
    if (!email) continue;
    /* «paga» vuol dire premium_pagato, non piano: i premium regalati
       hanno piano = premium ma non hanno mai pagato niente. */
    const paga = r.premium_pagato === true || r.gestionale_attivo === true;
    const scaduto = r.premium_scadenza ? (new Date(r.premium_scadenza) < new Date()) : false;
    nelSito.set(email, {
      id: r.id,
      nome: r.nome_attivita || null,
      paga, scaduto,
      piano: r.piano,
      cliente_stripe: r.stripe_customer_id || null
    });
  }

  // ---- 3. il confronto ----------------------------------------------
  const paga_e_non_ha = [];   // il guaio grosso
  const ha_e_non_paga = [];   // ci rimetti tu

  for (const [email, s] of suStripe) {
    const r = nelSito.get(email);
    if (!r) {
      paga_e_non_ha.push({ email, perche: 'su Stripe paga, ma nel sito non esiste nessuna riga con questa email', stripe: s });
    } else if (!r.paga || r.scaduto) {
      paga_e_non_ha.push({
        email,
        perche: r.scaduto ? 'su Stripe paga, ma nel sito il piano risulta scaduto'
                          : 'su Stripe paga, ma nel sito non risulta pagato',
        impresa: r, stripe: s
      });
    }
  }

  for (const [email, r] of nelSito) {
    if (!r.paga) continue;
    if (!suStripe.has(email)) {
      ha_e_non_paga.push({ email, perche: "nel sito risulta pagato, ma su Stripe non c'è nessun abbonamento vivo", impresa: r });
    }
  }

  return {
    quando: new Date().toISOString(),
    tutto_a_posto: paga_e_non_ha.length === 0 && ha_e_non_paga.length === 0,
    quanti: {
      abbonamenti_vivi_su_stripe: suStripe.size,
      risultano_paganti_nel_sito: [...nelSito.values()].filter(x => x.paga).length,
      paga_e_non_ha: paga_e_non_ha.length,
      ha_e_non_paga: ha_e_non_paga.length
    },
    paga_e_non_ha,
    ha_e_non_paga
  };
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
  try { ({ u, p } = JSON.parse(event.body || '{}')); }
  catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) }; }

  if (!ADMIN_USER || !ADMIN_PASS) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'ADMIN_USER / ADMIN_PASS non configurati su Netlify.' }) };
  }
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  const url = trova(NOMI_URL), key = trova(NOMI_KEY);
  const chiaveStripe = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!url || !key) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Variabili Supabase mancanti su Netlify.' }) };
  }
  if (!chiaveStripe) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY mancante su Netlify.' }) };
  }

  try {
    const rapporto = await confronta({ chiaveStripe, url, key });
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(rapporto, null, 2) };
  } catch (err) {
    console.error('[controllo-abbonamenti]', err && err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: String(err && err.message || err) }) };
  }
};

/* ⛔ NON TOGLIERE: lo chiama controllo-abbonamenti-settimanale.js.
   Se sparisce questa riga, l'orologio del lunedi' si rompe in silenzio
   — e un controllo rotto in silenzio e' esattamente il guaio che questo
   file esiste per evitare. */
module.exports.confronta = confronta;

/* per il banco: la lista degli stati «vivi» si prova da sola */
module.exports.VIVI = VIVI;
