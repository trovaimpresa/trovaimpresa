// Webhook Stripe per lo sblocco contatti (pay-per-lead).
// Endpoint da configurare su Stripe: evento checkout.session.completed
// Env richiesta: STRIPE_WEBHOOK_SECRET_LEAD

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_LEAD
    );
  } catch (err) {
    console.error('[stripe-webhook-lead] firma non valida:', err.message);
    return { statusCode: 400, body: 'Firma non valida' };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const preventivoId = session.metadata && session.metadata.preventivo_id;

    if (preventivoId) {
      const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { error } = await admin
        .from('preventivi')
        .update({
          sbloccato: true,
          sbloccato_at: new Date().toISOString(),
          stripe_session_id: session.id,
        })
        .eq('id', preventivoId);

      if (error) {
        console.error('[stripe-webhook-lead] errore update:', error.message);
        return { statusCode: 500, body: 'Errore aggiornamento' };
      }
      console.log(`[stripe-webhook-lead] preventivo ${preventivoId} sbloccato`);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
