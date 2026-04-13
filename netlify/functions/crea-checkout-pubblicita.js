const Stripe = require('stripe');

exports.handler = async (event) => {
  const { impresa_id, citta, posizione } = JSON.parse(event.body);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const prezzi = {
    '1citta': 990,
    '3citta': 2990
  };

  const tipo = citta.length >= 3 ? '3citta' : '1citta';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: prezzi[tipo],
        product_data: { name: `Pubblicità TrovaImpresa - ${tipo === '1citta' ? '1 città' : '3 città'}` }
      },
      quantity: 1
    }],
    metadata: { impresa_id, citta: JSON.stringify(citta), posizione },
    success_url: 'https://trovaimpresa.com/pannello-impresa.html?pub=ok',
    cancel_url: 'https://trovaimpresa.com/pannello-impresa.html?pub=cancel'
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  };
};
