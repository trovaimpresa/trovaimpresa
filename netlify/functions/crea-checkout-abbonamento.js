// =====================================================================
// STRIPE — LA CASSA DEGLI ABBONAMENTI (Premium e Premium AI)
//
// 29 agosto 2026 (notte) — i prezzi nuovi e il secondo piano.
//
// Prima qui dentro c'erano due soli codici, quelli da 5 e 49 euro, e le
// pagine del sito dicevano gia' 29 e 249: chi si abbonava vedeva scritto
// un prezzo e ne pagava un altro. Adesso i codici sono quattro, quelli
// veri creati su Stripe il 29 agosto.
//
// ⛔ E QUI SI SCEGLIE IL PIANO, PRIMA DI PAGARE.
// La decisione di Alessio: la scelta fra Premium e Premium AI si fa sulla
// soglia, non dentro il gestionale gia' pagato. Percio' questa funzione
// accetta un `prodotto`, e chi non lo manda compra il Premium: i pannelli
// vecchi continuano a funzionare senza toccarli.
//
// ⚠️ `metadata.prodotto` VA SCRITTO IN DUE POSTI.
// Sulla sessione serve al momento del primo pagamento; sull'abbonamento
// (`subscription_data.metadata`) serve DOPO — ai rinnovi e soprattutto
// alla disdetta, dove Stripe manda solo l'abbonamento e della sessione
// non c'e' piu' traccia. Senza la seconda copia, chi disdice resta
// Premium a vita: era esattamente il buco di prima.
// =====================================================================
const Stripe = require('stripe');

// i 4 prezzi veri su Stripe (live), creati il 29 agosto 2026
const PREZZI = {
  'premium': {
    mensile: 'price_1U9sjuBVLZQWjpNjMWMF961J',   //  29,00 EUR / mese
    annuale: 'price_1U9skXBVLZQWjpNjh8MJgtrY'    // 249,00 EUR / anno
  },
  'premium-ai': {
    mensile: 'price_1U9sqMBVLZQWjpNjSpF3Q5rU',   //  39,00 EUR / mese
    annuale: 'price_1U9ss7BVLZQWjpNjWioGW3XH'    // 349,00 EUR / anno
  }
};

exports.handler = async (event) => {
  try {
    const body     = JSON.parse(event.body || '{}');
    const piano    = body.piano;                        // 'mensile' | 'annuale'
    const prodotto = body.prodotto || 'premium';        // 'premium' | 'premium-ai'
    const email    = body.email;
    const base     = body.returnUrl || 'https://trovaimpresa.com/pannello-artigiano.html';

    // ⛔ meglio un errore chiaro adesso che un addebito sbagliato dopo.
    const listino = PREZZI[prodotto];
    if (!listino) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Piano non riconosciuto: ' + prodotto }) };
    }
    const price = listino[piano];
    if (!price) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Serve mensile o annuale, arrivato: ' + piano }) };
    }
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Manca l\'email' }) };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      metadata: { email, prodotto },
      subscription_data: { metadata: { email, prodotto } },
      success_url: base + '?abb=ok',
      cancel_url:  base + '?abb=cancel'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
