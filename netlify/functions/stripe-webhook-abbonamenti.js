const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  let ev;
  try {
    ev = stripe.webhooks.constructEvent(event.body, event.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET_ABBONAMENTI);
  } catch (e) {
    return { statusCode: 400, body: 'Webhook error' };
  }
  if (ev.type === 'checkout.session.completed') {
    const s = ev.data.object;
    const email = s.metadata && s.metadata.email;
    if (email) {
      await supabase.from('imprese').update({ piano: 'premium' }).eq('email', email);
    }
  }
  return { statusCode: 200, body: 'ok' };
};
