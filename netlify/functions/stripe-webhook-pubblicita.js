const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  let ev;
  try {
    ev = stripe.webhooks.constructEvent(event.body, event.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return { statusCode: 400, body: 'Webhook error' };
  }
  if (ev.type === 'checkout.session.completed') {
    const s = ev.data.object;
    const { impresa_id, citta, posizione } = s.metadata;
    const ora = new Date();
    const fine = new Date();
    fine.setMonth(fine.getMonth() + 1);
    await supabase.from('annunci_pubblicitari').insert({ impresa_id, citta: JSON.parse(citta), posizione, data_inizio: ora.toISOString(), data_fine: fine.toISOString(), attivo: true, stripe_session_id: s.id });
  }
  return { statusCode: 200, body: 'ok' };
};
