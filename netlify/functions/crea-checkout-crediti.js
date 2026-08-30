// =====================================================================
// STRIPE — RICARICA CREDITI AI (pagamento singolo, non abbonamento)
//
// 16 agosto 2026 — Blocco 0.
// Copiato da crea-checkout-gestionale.js, con tre differenze che contano.
//
// ⚠️ 1. QUANTI CREDITI LO DECIDE IL SERVER, NON IL BROWSER.
//    Dal browser arriva solo il nome del taglio ('150', '400', '1000').
//    Il numero di crediti e il prezzo stanno qui dentro. Se arrivassero
//    dal browser, bastava aprire la console e chiedere 100.000 crediti
//    a 19 euro.
//
// ⚠️ 2. CHI STA COMPRANDO SI LEGGE DAL SUO ACCESSO, NON DALL'EMAIL.
//    crea-checkout-gestionale.js prende l'email da quello che gli manda
//    il browser. Per un abbonamento passa; per i crediti no: i crediti
//    si accreditano a un utente preciso, e se uno scrive l'email di un
//    altro (o la sbaglia) i soldi partono e i crediti non arrivano a
//    nessuno. Qui l'utente si ricava dal token di sessione: non si puo'
//    sbagliare e non si puo' fingere.
//
// ⚠️ 3. NON SI VENDE A CHI NON PUO' USARLI.
//    consume_ai_credit si ferma sul piano 'base' PRIMA di guardare i
//    crediti comprati: uno senza Premium se li ritroverebbe nel conto
//    senza poterli spendere. Quindi il Premium si controlla qui, prima
//    di far partire il pagamento.
//
// VARIABILI DA CREARE SU NETLIFY (i prezzi si creano su Stripe):
//   STRIPE_PRICE_CREDITI_150     150 crediti — 19 €
//   STRIPE_PRICE_CREDITI_400     400 crediti — 45 €
//   STRIPE_PRICE_CREDITI_1000   1000 crediti — 99 €
// (STRIPE_SECRET_KEY, SUPABASE_URL e SUPABASE_SERVICE_KEY ci sono gia'.)
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Il listino sta QUI. Una riga sola per taglio: crediti, prezzo e nome
// della variabile Netlify che tiene il price id di Stripe.
const TAGLI = {
  '150':  { crediti: 150,  euro: 19, price: 'STRIPE_PRICE_CREDITI_150'  },
  '400':  { crediti: 400,  euro: 45, price: 'STRIPE_PRICE_CREDITI_400'  },
  '1000': { crediti: 1000, euro: 99, price: 'STRIPE_PRICE_CREDITI_1000' }
};

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return rispondi(405, { error: 'Metodo non consentito' });
    }

    // ---- 1. chi sta comprando -------------------------------------
    const intestazione = event.headers.authorization || event.headers.Authorization || '';
    const token = intestazione.startsWith('Bearer ') ? intestazione.slice(7).trim() : '';
    if (!token) {
      return rispondi(401, { error: 'Devi essere collegato per ricaricare i crediti.' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: chi, error: erroreChi } = await supabase.auth.getUser(token);
    const utente = chi && chi.user;
    if (erroreChi || !utente || !utente.id) {
      return rispondi(401, { error: 'La sessione è scaduta. Rientra e riprova.' });
    }

    // ---- 2. il taglio -----------------------------------------------
    let corpo = {};
    try { corpo = JSON.parse(event.body || '{}'); } catch (e) { corpo = {}; }
    const taglio = String(corpo.taglio || '').trim();
    const scelto = TAGLI[taglio];
    if (!scelto) {
      return rispondi(400, { error: 'Taglio non valido.' });
    }

    const priceId = process.env[scelto.price];
    if (!priceId) {
      // meglio dirlo chiaro adesso che scoprirlo da un pagamento a vuoto
      console.error('[crediti] manca la variabile Netlify ' + scelto.price);
      return rispondi(500, { error: 'Ricarica non ancora disponibile. Riprova più tardi.' });
    }

    // ---- 3. il Premium ---------------------------------------------
    // stessa regola di haPremium() nel gestionale e di ai_allinea_piano
    // nel database: piano 'premium' e, se c'e' una scadenza, non passata.
    const { data: impresa } = await supabase
      .from('imprese')
      .select('piano, premium_scadenza, email, chat_pro, chat_pro_scadenza')
      .eq('user_id', utente.id)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    const scad = impresa && impresa.premium_scadenza ? new Date(impresa.premium_scadenza) : null;
    const haPremium = !!impresa
      && String(impresa.piano || '').trim().toLowerCase() === 'premium'
      && (!scad || isNaN(scad.getTime()) || scad.getTime() > Date.now());

    if (!haPremium) {
      return rispondi(403, {
        error: 'senza_premium',
        messaggio: 'I crediti si usano con il Premium attivo. Attiva il Premium e poi ricarica quando vuoi.'
      });
    }

    // ⛔ 30 agosto 2026 — E NON BASTA IL PREMIUM: SERVE IL PREMIUM AI.
    // I crediti li spende SOLO la chat, e la chat e' del Premium AI:
    // «quello da 29 non ha la chat, ha solamente un assistente AI».
    // Chi ha solo il Premium ha il piano AI 'base', e `consume_ai_credit`
    // si ferma li' prima ancora di guardare i gettoni: pagherebbe 19 euro
    // per una cosa che non puo' usare.
    // ⚠️ L'assistente AI (il pulsante «Aiuto», 30 al mese) non c'entra:
    //    ha un contatore suo e non tocca questi crediti.
    const scadAI = impresa && impresa.chat_pro_scadenza ? new Date(impresa.chat_pro_scadenza) : null;
    const haPremiumAI = !!impresa && impresa.chat_pro === true
      && (!scadAI || isNaN(scadAI.getTime()) || scadAI.getTime() > Date.now());

    if (!haPremiumAI) {
      return rispondi(403, {
        error: 'senza_premium_ai',
        messaggio: 'Le ricariche servono alla Chat con AI, che fa parte del Premium AI. Attiva il Premium AI dal tuo pannello e poi ricarica quando vuoi.'
      });
    }

    // ---- 4. il pagamento --------------------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const base = 'https://trovaimpresa.com/ricarica-crediti.html';
    const email = utente.email || (impresa && impresa.email) || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',                       // pagamento singolo, non abbonamento
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: utente.id,
      metadata: {
        prodotto: 'crediti-ai',
        user_id:  utente.id,                 // ⚠️ e' questo che legge il webhook
        crediti:  String(scelto.crediti),    // ⚠️ scritto dal server, non dal browser
        taglio:   taglio,
        email:    email || ''
      },
      payment_intent_data: {
        metadata: { prodotto: 'crediti-ai', user_id: utente.id, crediti: String(scelto.crediti) }
      },
      success_url: base + '?crediti=ok',
      cancel_url:  base + '?crediti=annullato'
    });

    return rispondi(200, { url: session.url });

  } catch (err) {
    console.error('[crediti] checkout fallito:', err && err.message);
    return rispondi(500, { error: 'Non sono riuscito ad aprire il pagamento. Riprova.' });
  }
};
