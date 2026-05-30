const Stripe = require('stripe');

exports.handler = async (event) => {
  try {
    const { piano, email, returnUrl } = JSON.parse(event.body);
    const base = returnUrl || 'https://trovaimpresa.com/pannello-artigiano.html';
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const prezzi = {
      mensile: 'price_1TcemeBVLZQWjpNjiQpqk5ms',
      annuale: 'price_1TcepfBVLZQWjpNj89MMDwxA'
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: prezzi[piano],
        quantity: 1
      }],
      customer_email: email,
      metadata: { email },
      success_url: base + '?abb=ok',
      cancel_url: base + '?abb=cancel'
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
