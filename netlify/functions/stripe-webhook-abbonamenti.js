// =====================================================================
// STRIPE — ABBONAMENTI (Premium e add-on Gestionale)
//
// 14 agosto 2026 (notte) — aggiunta la RIGA DELL'INCASSO, e basta.
//
// Prima questo file faceva una cosa sola: metteva una spunta sul profilo
// (`premium_pagato = true`, oppure `gestionale_attivo = true`). Funziona,
// ma di quel pagamento non restava scritto NIENTE: non l'importo, non la
// data, non il numero della transazione. Non era un dato che spariva
// quando la persona si cancellava — non veniva proprio mai scritto.
//
// Adesso ogni incasso lascia una riga in `public.pagamenti`, con la
// funzione `registra_pagamento` (sta in sql/pagamenti.sql: la regola sta
// in un posto solo, e vale anche per la pubblicita').
//
// ⚠️ LA REGOLA CHE NON SI TOCCA
// Se la riga non si riesce a scrivere, L'ATTIVAZIONE SI FA LO STESSO.
// Uno ha pagato: deve avere quello che ha pagato, punto. Non gli si nega
// il Premium perche' noi non siamo riusciti a prendere nota. E' la stessa
// regola di elimina-account.js, vista dall'altra parte: la persona viene
// prima della statistica.
//
// ⚠️ E NON SI RISPONDE MAI «ERRORE» PER COLPA DELLA RIGA.
// Se a Stripe si risponde con un errore, Stripe RIMANDA lo stesso avviso.
// Rimandarlo perche' non siamo riusciti a scrivere una riga di appunti
// vuol dire rifare l'attivazione a ripetizione per niente.
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------
// prende nota dell'incasso. NON LANCIA MAI: qualunque cosa vada storta
// qui dentro, chi ha pagato deve andare avanti lo stesso.
// ---------------------------------------------------------------------
async function segnaIncasso(supabase, dati) {
  try {
    if (!dati || dati.centesimi == null || !dati.riferimento) {
      console.warn('[pagamenti] niente da segnare:', JSON.stringify(dati || {}));
      return;
    }
    const { data, error } = await supabase.rpc('registra_pagamento', {
      p_prodotto:    dati.prodotto,
      p_centesimi:   dati.centesimi,
      p_riferimento: dati.riferimento,
      p_email:       dati.email || null,
      p_impresa_id:  dati.impresa_id || null,
      p_valuta:      dati.valuta || 'eur',
      p_tipo_evento: dati.tipo_evento || null,
      p_quando:      dati.quando || null
    });
    if (error) {
      // il caso piu' probabile: sql/pagamenti.sql non e' ancora stato
      // lanciato. Si scrive nel log e si tira dritto.
      console.error('[pagamenti] NON segnato:', error.message);
    } else if (data && data.ok === false) {
      console.log('[pagamenti] gia segnato (' + data.reason + '):', dati.riferimento);
    } else {
      console.log('[pagamenti] segnato:', dati.prodotto, dati.centesimi, dati.riferimento);
    }
  } catch (e) {
    console.error('[pagamenti] eccezione:', e.message);
  }
}

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
      await segnaIncasso(supabase, {
        prodotto: 'gestionale', centesimi: s.amount_total, riferimento: s.id,
        email, valuta: s.currency, tipo_evento: ev.type,
        quando: ev.created ? new Date(ev.created * 1000).toISOString() : null
      });
    } else if (email) {
      // Pagamento ricevuto: Premium pagato, senza scadenza (azzero l'eventuale scadenza del regalo)
      await supabase.from('imprese').update({ piano: 'premium', premium_scadenza: null, premium_pagato: true }).eq('email', email);
      await segnaIncasso(supabase, {
        prodotto: 'premium', centesimi: s.amount_total, riferimento: s.id,
        email, valuta: s.currency, tipo_evento: ev.type,
        quando: ev.created ? new Date(ev.created * 1000).toISOString() : null
      });

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

  // -------------------------------------------------------------------
  // I RINNOVI
  //
  // ⚠️ Un abbonamento che si rinnova NON rifa' `checkout.session.completed`:
  // quello succede solo la prima volta. L'anno dopo Stripe manda
  // `invoice.paid`, e basta. Senza questo pezzo si registrerebbe il primo
  // pagamento e nessuno di quelli dopo — che e' il modo piu' facile di
  // avere una contabilita' che sembra a posto e non lo e'.
  //
  // ⚠️ PERCHE' FUNZIONI, l'avviso «invoice.paid» va acceso anche dalla
  // parte di Stripe (Dashboard > Developers > Webhooks > l'endpoint degli
  // abbonamenti > Select events). Se non lo si accende, questo codice non
  // fa danni: semplicemente non arriva mai niente.
  // -------------------------------------------------------------------
  if (ev.type === 'invoice.paid' || ev.type === 'invoice.payment_succeeded') {
    const inv = ev.data.object;
    const meta = (inv.subscription_details && inv.subscription_details.metadata) || {};
    // ⚠️ la PRIMA fattura di un abbonamento arriva insieme al checkout: si
    // salta, se no lo stesso incasso finisce dentro due volte con due
    // numeri diversi (la sessione e la fattura) e l'«unique» non se ne
    // accorge, perche' per lui sono due pagamenti diversi.
    const primaFattura = inv.billing_reason === 'subscription_create';
    const email = (inv.metadata && inv.metadata.email) || meta.email || inv.customer_email || null;
    const prodotto = (inv.metadata && inv.metadata.prodotto) || meta.prodotto || null;
    if (!primaFattura && inv.amount_paid != null && inv.amount_paid > 0) {
      await segnaIncasso(supabase, {
        prodotto: prodotto === 'gestionale' ? 'gestionale' : 'premium',
        centesimi: inv.amount_paid, riferimento: inv.id,
        email, valuta: inv.currency, tipo_evento: ev.type,
        quando: ev.created ? new Date(ev.created * 1000).toISOString() : null
      });
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
