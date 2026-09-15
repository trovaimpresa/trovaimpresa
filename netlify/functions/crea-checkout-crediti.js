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
// ⚠️ 4. 14 SETTEMBRE 2026 — QUI SI VENDONO DUE COSE DIVERSE.
//    `cosa: 'crediti'`  -> i crediti dell'ASSISTENZA (Compila/Genera con AI)
//    `cosa: 'messaggi'` -> i messaggi della CHAT con AI
//    Prima erano lo stesso portafoglio e la chat si mangiava i crediti
//    dell'assistenza senza dirlo. Adesso sono due casse separate, e questa
//    function apre il pagamento giusto per ognuna.
//
// VARIABILI DA CREARE SU NETLIFY (i prezzi si creano su Stripe):
//   STRIPE_PRICE_CREDITI_150      150 crediti  — 19 €
//   STRIPE_PRICE_CREDITI_400      400 crediti  — 45 €
//   STRIPE_PRICE_CREDITI_1000    1000 crediti  — 99 €
//   STRIPE_PRICE_MESSAGGI_300     300 messaggi —  9 €
//   STRIPE_PRICE_MESSAGGI_1000   1000 messaggi — 25 €
//   STRIPE_PRICE_MESSAGGI_3000   3000 messaggi — 69 €
// (STRIPE_SECRET_KEY, SUPABASE_URL e SUPABASE_SERVICE_KEY ci sono gia'.)
//
// ⚠️ Finche' una di queste variabili non c'e', quel pacchetto risponde 503 e
//    la pagina lo dice chiaro. NON parte nessun pagamento a vuoto.
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Il listino sta QUI. Una riga sola per taglio: quanti, prezzo e nome
// della variabile Netlify che tiene il price id di Stripe.
const TAGLI = {
  '150':  { crediti: 150,  euro: 19, price: 'STRIPE_PRICE_CREDITI_150'  },
  '400':  { crediti: 400,  euro: 45, price: 'STRIPE_PRICE_CREDITI_400'  },
  '1000': { crediti: 1000, euro: 99, price: 'STRIPE_PRICE_CREDITI_1000' }
};

const MESSAGGI = {
  '300':  { messaggi: 300,  euro:  9, price: 'STRIPE_PRICE_MESSAGGI_300'  },
  '1000': { messaggi: 1000, euro: 25, price: 'STRIPE_PRICE_MESSAGGI_1000' },
  '3000': { messaggi: 3000, euro: 69, price: 'STRIPE_PRICE_MESSAGGI_3000' }
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
    const cosa   = String(corpo.cosa || 'crediti').trim() === 'messaggi' ? 'messaggi' : 'crediti';
    const scelto = (cosa === 'messaggi') ? MESSAGGI[taglio] : TAGLI[taglio];
    if (!scelto) {
      return rispondi(400, { error: 'Taglio non valido.' });
    }

    const priceId = process.env[scelto.price];
    if (!priceId) {
      // meglio dirlo chiaro adesso che scoprirlo da un pagamento a vuoto
      console.error('[' + cosa + '] manca la variabile Netlify ' + scelto.price);
      return rispondi(503, {
        error: cosa === 'messaggi'
          ? 'I pacchetti di messaggi non sono ancora in vendita. Riprova fra poco.'
          : 'Ricarica non ancora disponibile. Riprova più tardi.'
      });
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
        messaggio: 'I crediti e i messaggi si usano con il gestionale attivo. Attivalo e poi ricarica quando vuoi.'
      });
    }

    /* ⛔ 14 SETTEMBRE 2026 — QUESTO CONTROLLO VALE SOLO PER I MESSAGGI.
       Fino a oggi era su TUTTO, e bloccava i crediti a chi ha il gestionale
       normale. Era giusto il 30 agosto, quando i crediti li spendeva solo
       la chat; non lo e' piu' dal 13 settembre, da quando il Gestionale
       normale ha i suoi 40 crediti al mese per l'assistenza. Cosi' com'era,
       uno che paga 29 € e i crediti li usa davvero non poteva ricaricarli.

       I MESSAGGI invece restano del Gestionale AI, e c'e' una ragione di
       prezzo: 300 messaggi a 9 € una tantum, venduti a chi non ha il piano,
       sarebbero piu' convenienti dei 10 € in piu' al mese del Gestionale AI
       (che di messaggi ne da' 300 OGNI mese). Si venderebbe il piano a se'
       stessi al ribasso. Chi sta facendo l'assaggio compra il piano, non il
       pacchetto. */
    const scadAI = impresa && impresa.chat_pro_scadenza ? new Date(impresa.chat_pro_scadenza) : null;
    const haGestionaleAI = !!impresa && impresa.chat_pro === true
      && (!scadAI || isNaN(scadAI.getTime()) || scadAI.getTime() > Date.now());

    if (cosa === 'messaggi' && !haGestionaleAI) {
      return rispondi(403, {
        error: 'senza_gestionale_ai',
        messaggio: 'I pacchetti di messaggi servono alla Chat con AI, che fa parte del Gestionale AI. Attivalo dal tuo pannello e poi torna qui.'
      });
    }

    // ---- 4. il pagamento --------------------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const prodotto = (cosa === 'messaggi') ? 'messaggi-chat' : 'crediti-ai';
    const quanti   = (cosa === 'messaggi') ? scelto.messaggi : scelto.crediti;
    const base = 'https://trovaimpresa.com/ricarica-crediti.html';
    const email = utente.email || (impresa && impresa.email) || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',                       // pagamento singolo, non abbonamento
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: utente.id,
      /* ⚠️ `prodotto` e' quello che fa scegliere al webhook il portafoglio:
         'crediti-ai' -> add_credits_pack (credits_extra, l'assistenza)
         'messaggi-chat' -> add_chat_pack (chat_extra, la chat)
         Il numero e' scritto DAL SERVER, mai dal browser. */
      metadata: {
        prodotto: prodotto,
        user_id:  utente.id,                 // ⚠️ e' questo che legge il webhook
        crediti:  String(quanti),            // ⚠️ scritto dal server, non dal browser
        taglio:   taglio,
        email:    email || ''
      },
      payment_intent_data: {
        metadata: { prodotto: prodotto, user_id: utente.id, crediti: String(quanti) }
      },
      success_url: base + '?crediti=ok' + (cosa === 'messaggi' ? '#messaggi' : ''),
      cancel_url:  base + '?crediti=annullato' + (cosa === 'messaggi' ? '#messaggi' : '')
    });

    return rispondi(200, { url: session.url });

  } catch (err) {
    console.error('[crediti] checkout fallito:', err && err.message);
    return rispondi(500, { error: 'Non sono riuscito ad aprire il pagamento. Riprova.' });
  }
};
