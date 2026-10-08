// =====================================================================
// STRIPE — PACCHETTI DI INVII ALLO SDI (pagamento singolo)
//
// 8 ottobre 2026. Copiato da crea-checkout-crediti.js, stesse regole:
//  1. QUANTI INVII lo decide il SERVER (qui dentro), mai il browser.
//  2. CHI COMPRA si legge dal token di accesso, non dall'email.
//  3. Chi ha gia' il gestionale a pagamento ha gli invii compresi: non si
//     vende il pacchetto (si venderebbe due volte la stessa cosa).
//
// VARIABILI DA CREARE SU NETLIFY (i prezzi si creano su Stripe, "Una tantum"):
//   STRIPE_PRICE_SDI_50     50 invii allo SDI
//   STRIPE_PRICE_SDI_200   200 invii allo SDI
// Finche' la variabile non c'e', quel pacchetto risponde 503 e non parte
// nessun pagamento a vuoto.
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const PACCHETTI = {
  '50':  { invii: 50,  price: 'STRIPE_PRICE_SDI_50'  },
  '200': { invii: 200, price: 'STRIPE_PRICE_SDI_200' }
};

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return rispondi(405, { error: 'Metodo non consentito' });

    const intestazione = event.headers.authorization || event.headers.Authorization || '';
    const token = intestazione.startsWith('Bearer ') ? intestazione.slice(7).trim() : '';
    if (!token) return rispondi(401, { error: 'Devi essere collegato per comprare gli invii.' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: chi, error: erroreChi } = await supabase.auth.getUser(token);
    const utente = chi && chi.user;
    if (erroreChi || !utente || !utente.id) {
      return rispondi(401, { error: 'La sessione è scaduta. Rientra e riprova.' });
    }

    let corpo = {};
    try { corpo = JSON.parse(event.body || '{}'); } catch (e) { corpo = {}; }
    const scelto = PACCHETTI[String(corpo.pacchetto || '').trim()];
    if (!scelto) return rispondi(400, { error: 'Pacchetto non valido.' });

    const priceId = process.env[scelto.price];
    if (!priceId) {
      console.error('[sdi] manca la variabile Netlify ' + scelto.price);
      return rispondi(503, { error: 'I pacchetti di invii non sono ancora in vendita. Riprova fra poco.' });
    }

    // chi ha il gestionale a pagamento ha gli invii compresi
    const { data: impresa } = await supabase
      .from('imprese')
      .select('email, chat_pro, chat_pro_scadenza')
      .eq('user_id', utente.id)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();
    const scad = impresa && impresa.chat_pro_scadenza ? new Date(impresa.chat_pro_scadenza) : null;
    const incluso = !!impresa && impresa.chat_pro === true
      && (!scad || isNaN(scad.getTime()) || scad.getTime() > Date.now());
    if (incluso) {
      return rispondi(403, {
        error: 'gia_incluso',
        messaggio: 'Con il tuo gestionale gli invii allo SDI sono già compresi: non serve comprare un pacchetto.'
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const email = utente.email || (impresa && impresa.email) || undefined;
    // si torna nella pagina da cui si e' partiti (elenco chiuso, mai un indirizzo dal browser)
    const base = 'https://trovaimpresa.com/' + (String(corpo.pagina || '') === 'noleggio' ? 'gestionale-noleggio.html' : 'gestionale-artigiano.html');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: utente.id,
      metadata: {
        prodotto: 'invii-sdi',
        user_id:  utente.id,
        crediti:  String(scelto.invii),   // scritto dal server, non dal browser
        taglio:   String(corpo.pacchetto),
        email:    email || ''
      },
      payment_intent_data: {
        metadata: { prodotto: 'invii-sdi', user_id: utente.id, crediti: String(scelto.invii) }
      },
      success_url: base + '?sdi=ok',
      cancel_url:  base + '?sdi=annullato'
    });

    return rispondi(200, { url: session.url });
  } catch (err) {
    console.error('[sdi] checkout fallito:', err && err.message);
    return rispondi(500, { error: 'Non sono riuscito ad aprire il pagamento. Riprova.' });
  }
};
