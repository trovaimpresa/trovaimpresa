const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_PUBBLICITA
    );
  } catch (err) {
    return { statusCode: 400, body: 'Webhook Error: ' + err.message };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const annuncioId = session.metadata && session.metadata.annuncio_id;

    if (annuncioId) {
      // Le date sono gia state scritte all'INSERT dal form: aggiorno solo lo stato.
      const { error } = await supabase
        .from('annunci_pubblicitari')
        .update({
          stato: 'pagato',
          stripe_session_id: session.id
        })
        .eq('id', annuncioId);
      if (error) return { statusCode: 500, body: 'Supabase Error: ' + error.message };
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
