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
    const impresaId = session.metadata && session.metadata.impresa_id;

    if (preventivoId && impresaId) {
      const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

      // Registra lo sblocco per QUESTA impresa (upsert: idempotente)
      const { error: errSblocco } = await admin
        .from('lead_sblocchi')
        .upsert(
          {
            preventivo_id: preventivoId,
            impresa_id: impresaId,
            stripe_session_id: session.id,
          },
          { onConflict: 'preventivo_id,impresa_id' }
        );
      if (errSblocco) {
        console.error('[stripe-webhook-lead] errore sblocco:', errSblocco.message);
        return { statusCode: 500, body: 'Errore registrazione sblocco' };
      }

      // Se è l'impresa scelta dal cliente, aggiorna anche il flag storico
      const { data: prev } = await admin
        .from('preventivi')
        .select('impresa_id')
        .eq('id', preventivoId)
        .maybeSingle();
      if (prev && String(prev.impresa_id) === String(impresaId)) {
        await admin
          .from('preventivi')
          .update({
            sbloccato: true,
            sbloccato_at: new Date().toISOString(),
            stripe_session_id: session.id,
          })
          .eq('id', preventivoId);
      }

      console.log(`[stripe-webhook-lead] preventivo ${preventivoId} sbloccato da impresa ${impresaId}`);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
