const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const MESI = { mensile:1, trimestrale:3, annuale:12 };

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: 'Webhook Error: ' + err.message };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const idsStr = session.metadata && session.metadata.ids;
    const piano = (session.metadata && session.metadata.piano) || 'mensile';

    if (idsStr) {
      const ids = idsStr.split(',').map(function (x) { return parseInt(x, 10); });
      const inizio = new Date();
      const fine = new Date();
      fine.setMonth(fine.getMonth() + (MESI[piano] || 1));

      const { error } = await supabase
        .from('annunci_pubblicitari')
        .update({
          stato: 'pagato',
          data_inizio: inizio.toISOString(),
          data_fine: fine.toISOString(),
          stripe_session_id: session.id
        })
        .in('id', ids);

      if (error) return { statusCode: 500, body: 'Supabase Error: ' + error.message };
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
