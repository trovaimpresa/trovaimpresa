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
    const prodotto = s.metadata && s.metadata.prodotto;
    if (email && prodotto === 'gestionale') {
      // Add-on Gestionale attivato: NON tocca il piano Premium.
      await supabase.from('imprese').update({ gestionale_attivo: true, gestionale_scadenza: null }).eq('email', email);
    } else if (email) {
      // Pagamento ricevuto: Premium pagato, senza scadenza (azzero l'eventuale scadenza del regalo)
      await supabase.from('imprese').update({ piano: 'premium', premium_scadenza: null, premium_pagato: true }).eq('email', email);

      // Email di conferma passaggio a Premium (best-effort, non blocca il webhook)
      try {
        const { data: row } = await supabase.from('imprese').select('nome, tipo').eq('email', email).single();
        await fetch('https://trovaimpresa.com/.netlify/functions/invia-email-benvenuto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: row && row.nome, email, tipo: row && row.tipo, premium: true })
        });
      } catch (e) {
        console.warn('Email premium fallita:', e);
      }
    }
  }

  // Disdetta abbonamento: se era il gestionale, revoca l'accesso.
  if (ev.type === 'customer.subscription.deleted') {
    const sub = ev.data.object;
    const email = sub.metadata && sub.metadata.email;
    const prodotto = sub.metadata && sub.metadata.prodotto;
    if (email && prodotto === 'gestionale') {
      await supabase.from('imprese').update({ gestionale_attivo: false }).eq('email', email);
    }
  }

  return { statusCode: 200, body: 'ok' };
};
