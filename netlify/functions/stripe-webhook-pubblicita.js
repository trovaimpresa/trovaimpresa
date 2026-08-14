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

      // -------------------------------------------------------------
      // LA RIGA DELL'INCASSO — 14 agosto 2026
      //
      // Qui sulla riga dell'annuncio restava `stato='pagato'` e il numero
      // della sessione, ma NON il prezzo: veniva ricalcolato ogni volta
      // da un listino che puo' cambiare, quindi fra due anni non si
      // sarebbe piu' saputo quanto era stato pagato davvero. E la riga
      // dell'annuncio sparisce insieme all'impresa (cascata, verificato
      // sul database il 14 agosto): con lei se ne andava l'unica traccia.
      //
      // L'importo NON si ricalcola: si prende quello che Stripe dice di
      // aver incassato. Quello e' il numero vero.
      //
      // ⚠️ Se prendere nota fallisce, NON si risponde errore: l'annuncio
      // e' gia' pagato e attivo, e un errore farebbe rimandare l'avviso a
      // Stripe per niente.
      // -------------------------------------------------------------
      try {
        const { data: reg, error: eReg } = await supabase.rpc('registra_pagamento', {
          p_prodotto:    'pubblicita',
          p_centesimi:   session.amount_total,
          p_riferimento: session.id,
          p_email:       (session.customer_details && session.customer_details.email) || null,
          // ⚠️ String(): su TrovaImpresa `imprese.id` e' un NUMERO (67, 68...),
          // non un uuid, e la colonna e' testo. Mandarlo cosi' com'e' arriva
          // dai metadata di Stripe (che e' gia' una stringa) va bene, ma se
          // un domani arrivasse come numero PostgreSQL rifiuterebbe la riga —
          // e l'incasso non verrebbe registrato IN SILENZIO, perche' questo
          // pezzo per progetto non blocca il cliente.
          p_impresa_id:  (session.metadata && session.metadata.impresa_id != null)
                           ? String(session.metadata.impresa_id) : null,
          p_valuta:      session.currency || 'eur',
          p_tipo_evento: stripeEvent.type,
          p_quando:      stripeEvent.created
                           ? new Date(stripeEvent.created * 1000).toISOString() : null
        });
        if (eReg) console.error('[pagamenti] NON segnato:', eReg.message);
        else if (reg && reg.ok === false) console.log('[pagamenti] gia segnato:', reg.reason);
        else console.log('[pagamenti] segnato: pubblicita', session.amount_total, session.id);
      } catch (e) {
        console.error('[pagamenti] eccezione:', e.message);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
