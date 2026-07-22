const Stripe = require('stripe');

// Checkout per l'ADD-ON GESTIONALE (indipendente dal piano Premium).
// Riusa lo stesso webhook degli abbonamenti: distinguiamo con metadata.prodotto = 'gestionale'.
// I price ID si impostano come variabili d'ambiente su Netlify:
//   STRIPE_PRICE_GESTIONALE_MENSILE  (12€/mese)
//   STRIPE_PRICE_GESTIONALE_ANNUALE  (119€/anno)
exports.handler = async (event) => {
  try {
    const { piano, email, returnUrl } = JSON.parse(event.body);
    const base = returnUrl || 'https://trovaimpresa.com/gestionale-app.html';
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const prezzi = {
      mensile: process.env.STRIPE_PRICE_GESTIONALE_MENSILE,
      annuale: process.env.STRIPE_PRICE_GESTIONALE_ANNUALE
    };

    if (!prezzi[piano]) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Piano non valido' }) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: prezzi[piano], quantity: 1 }],
      customer_email: email,
      metadata: { email, prodotto: 'gestionale' },
      subscription_data: { metadata: { email, prodotto: 'gestionale' } },
      success_url: base + '?gest=ok',
      cancel_url: base + '?gest=cancel'
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
