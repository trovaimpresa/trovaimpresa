const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Nome leggibile della fascia, per le email. Gli id sono quelli del listino.
const NOMI_SPAZIO = {
  'hero-sx': 'Banner in alto (sinistra)', 'hero-dx': 'Banner in alto (destra)',
  'imprese-sx': "Trova un'impresa (sinistra)", 'imprese-dx': "Trova un'impresa (destra)",
  'piano-sx': 'Piani (sinistra)', 'piano-dx': 'Piani (destra)',
  'inserzioni-sx': 'Inserzioni lavoro (sinistra)', 'inserzioni-dx': 'Inserzioni lavoro (destra)',
  'subappalto-sx-1': 'Subappalti (sinistra 1)', 'subappalto-sx-2': 'Subappalti (sinistra 2)',
  'subappalto-dx-1': 'Subappalti (destra 1)', 'subappalto-dx-2': 'Subappalti (destra 2)',
  'profilo-sx-1': 'Profilo impresa (sinistra 1)', 'profilo-sx-2': 'Profilo impresa (sinistra 2)',
  'profilo-dx-1': 'Profilo impresa (destra 1)', 'profilo-dx-2': 'Profilo impresa (destra 2)'
};

const LOGO = '<div style="text-align:center;padding:16px 0 20px">'
  + '<a href="https://trovaimpresa.com" style="text-decoration:none">'
  + '<img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"'
  + ' style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a></div>';

async function mandaEmail(a, oggetto, html) {
  if (!process.env.RESEND_API_KEY) { console.error('[email] RESEND_API_KEY mancante'); return; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: Array.isArray(a) ? a : [a],
        subject: oggetto,
        html: html
      })
    });
    if (!r.ok) console.error('[email] Resend ha risposto', r.status, await r.text());
  } catch (e) {
    console.error('[email] non partita:', e.message);
  }
}

function euro(cent) {
  return ((cent || 0) / 100).toFixed(2).replace('.', ',') + ' €';
}

// ===========================================================================
// 10 SETTEMBRE 2026 — LA PUBBLICITA' E' DIVENTATA UN ABBONAMENTO
//
// Prima il cliente comprava un pezzo di tempo e alla scadenza si spegneva:
// se si dimenticava di rinnovare, spariva (e' successo davvero, con
// l'annuncio di Roma scaduto il 23 agosto). Adesso Stripe riaddebita da
// solo finche' il cliente non disdice, e questo campanello deve saper
// ascoltare tre cose in piu': il rinnovo pagato, il rinnovo fallito e la
// disdetta.
// ===========================================================================

// La data fino a cui il cliente ha pagato, in formato aaaa-mm-gg.
function fineDelPeriodo(sub) {
  if (!sub || !sub.current_period_end) return null;
  return new Date(sub.current_period_end * 1000).toISOString().slice(0, 10);
}

// L'id dell'annuncio viaggia in due posti: sulla sessione e sull'abbonamento.
// Ai rinnovi e alla disdetta Stripe manda solo l'abbonamento.
function annuncioDa(oggetto) {
  return (oggetto && oggetto.metadata && oggetto.metadata.annuncio_id) || null;
}

// Chiude l'abbonamento senza far saltare tutto se Stripe risponde male.
async function chiudiAbbonamento(subId) {
  if (!subId) return 'nessun abbonamento';
  try {
    if (typeof stripe.subscriptions.cancel === 'function') await stripe.subscriptions.cancel(subId);
    else await stripe.subscriptions.del(subId);
    return 'chiuso';
  } catch (e) {
    return 'NON chiuso: ' + e.message;
  }
}

// L'email dell'impresa a cui appartiene l'annuncio.
async function emailDellAnnuncio(annuncioId) {
  try {
    const { data: a } = await supabase
      .from('annunci_pubblicitari')
      .select('impresa_id, spazio_id, citta')
      .eq('id', annuncioId).single();
    if (!a || !a.impresa_id) return { email: null, ann: a || null };
    const { data: i } = await supabase
      .from('imprese').select('email').eq('id', a.impresa_id).single();
    return { email: (i && i.email) || null, ann: a };
  } catch (e) {
    return { email: null, ann: null };
  }
}

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
      // -------------------------------------------------------------
      // 9 SETTEMBRE 2026 — DUE IMPRESE, UNO SPAZIO SOLO
      //
      // Prima qui c'era un update secco a 'pagato'. Se nel frattempo lo
      // spazio era stato venduto a un altro, il database rifiutava la
      // riga (vincolo di sovrapposizione) e questa funzione rispondeva
      // 500: Stripe riprovava all'infinito, e il cliente restava con i
      // soldi presi e NESSUNA pubblicita', senza che nessuno lo sapesse.
      //
      // Adesso decide il database, in una volta sola:
      //   pagato   -> lo spazio e' suo
      //   occupato -> l'ha vinto un altro: si rimborsa subito e si avvisa
      // In tutti e due i casi si risponde 200: l'avviso e' stato gestito.
      // -------------------------------------------------------------
      const { data: esito, error: eRpc } = await supabase.rpc('conferma_annuncio_pagato', {
        p_annuncio: annuncioId,
        p_session: session.id
      });

      if (eRpc) {
        console.error('[pubblicita] conferma fallita:', eRpc.message);
        return { statusCode: 500, body: 'Supabase Error: ' + eRpc.message };
      }

      const stato = esito && esito.esito;
      console.log('[pubblicita] annuncio', annuncioId, '->', stato);

      // ============ CASO BRUTTO: ha pagato ma lo spazio era gia' venduto ============
      if (stato === 'occupato') {
        if (esito.gia_segnato) {
          // Stripe ha rimandato lo stesso avviso: rimborso ed email sono gia' partiti.
          return { statusCode: 200, body: JSON.stringify({ received: true, gia_gestito: true }) };
        }

        // 1) I SOLDI TORNANO INDIETRO SUBITO
        let rimborso = 'non riuscito';
        // 10 set 2026: in abbonamento la sessione non porta piu' il pagamento
        // in chiaro, sta dentro la prima fattura. E soprattutto va CHIUSO
        // l'abbonamento: se no il cliente continuerebbe a pagare ogni mese
        // per uno spazio che non e' suo.
        if (!session.payment_intent && session.invoice) {
          try {
            const inv = await stripe.invoices.retrieve(session.invoice);
            if (inv && inv.payment_intent) session.payment_intent = inv.payment_intent;
          } catch (e) {
            console.error('[pubblicita] fattura non letta:', e.message);
          }
        }
        const esitoChiusura = await chiudiAbbonamento(session.subscription);
        console.log('[pubblicita] abbonamento del perdente:', esitoChiusura);
        try {
          if (session.payment_intent) {
            const r = await stripe.refunds.create({
              payment_intent: session.payment_intent,
              reason: 'requested_by_customer'
            });
            rimborso = 'fatto (' + r.id + ')';
            console.log('[pubblicita] rimborsato', session.amount_total, r.id);
          } else {
            rimborso = 'nessun pagamento da rimborsare';
          }
        } catch (e) {
          rimborso = 'NON RIUSCITO: ' + e.message;
          console.error('[pubblicita] RIMBORSO FALLITO — da fare a mano:', e.message);
        }

        // 2) Chi e' il cliente
        let imp = null;
        if (esito.impresa_id) {
          const { data } = await supabase.from('imprese')
            .select('id, email, nome_attivita, nome, telefono')
            .eq('id', esito.impresa_id).single();
          imp = data || null;
        }
        const emailCliente = (imp && imp.email)
          || (session.customer_details && session.customer_details.email) || null;
        const nomeAzienda = (imp && (imp.nome_attivita || imp.nome)) || 'la tua impresa';
        const nomeSpazio = NOMI_SPAZIO[esito.spazio_id] || esito.spazio_id;

        // 3) Lista d'attesa: e' il primo che verra' avvisato quando si libera
        try {
          if (esito.impresa_id) {
            const { data: gia } = await supabase.from('lista_attesa_pubblicita')
              .select('id').eq('impresa_id', esito.impresa_id)
              .ilike('citta', esito.citta).eq('stato', 'attesa').limit(1);
            if (!gia || !gia.length) {
              await supabase.from('lista_attesa_pubblicita').insert({
                impresa_id: esito.impresa_id,
                email: emailCliente || '',
                nome_azienda: nomeAzienda,
                telefono: (imp && imp.telefono) || '',
                citta: esito.citta,
                periodo_desiderato: '',
                note: 'Messo in lista in automatico: aveva pagato ' + esito.spazio_id
                      + ' ma era appena stato venduto. Rimborsato.',
                stato: 'attesa'
              });
            }
          }
        } catch (e) {
          console.error('[pubblicita] lista attesa non scritta:', e.message);
        }

        // 4) L'email al cliente
        if (emailCliente) {
          await mandaEmail(emailCliente, 'Ti abbiamo restituito i soldi — TrovaImpresa', LOGO
            + '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333;font-size:15px;line-height:1.7">'
            + '<p style="font-weight:700;font-size:18px;color:#1a1a1a">Ti abbiamo restituito i soldi</p>'
            + '<p>Hai comprato lo spazio <strong>' + nomeSpazio + '</strong> a <strong>' + esito.citta
            + '</strong>, ma nello stesso momento un\'altra impresa ha completato il pagamento pochi secondi prima di te.</p>'
            + '<p><strong>Ti abbiamo rimborsato subito ' + euro(session.amount_total) + '</strong>: '
            + 'li ritrovi sulla tua carta entro 5-10 giorni lavorativi, li rimette la tua banca.</p>'
            + '<p>Ti abbiamo messo in <strong>lista d\'attesa</strong> su ' + esito.citta
            + ': appena quello spazio si libera sei il primo a saperlo. '
            + 'Se preferisci non aspettare, puoi scegliere subito un\'altra posizione o un\'altra citta\' '
            + 'da <a href="https://trovaimpresa.com/pubblicita" style="color:#0066ff;font-weight:700">questa pagina</a>.</p>'
            + '<p style="color:#555">Ci dispiace per il disguido.<br>TrovaImpresa</p></div>');
        }

        // 5) L'email a te
        await mandaEmail('info@trovaimpresa.com', '⚠️ Spazio doppio: rimborsato ' + euro(session.amount_total), LOGO
          + '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333;font-size:15px;line-height:1.7">'
          + '<p style="font-weight:700;font-size:18px;color:#1a1a1a">Due imprese sullo stesso spazio</p>'
          + '<p><strong>' + nomeAzienda + '</strong> ha pagato <strong>' + nomeSpazio + '</strong> a <strong>'
          + esito.citta + '</strong>, ma lo spazio era gia\' stato venduto.</p>'
          + '<p>Rimborso: <strong>' + rimborso + '</strong><br>'
          + 'Cifra: <strong>' + euro(session.amount_total) + '</strong><br>'
          + 'Email cliente: ' + (emailCliente || '(sconosciuta)') + '<br>'
          + 'Sessione Stripe: ' + session.id + '</p>'
          + '<p>L\'annuncio e\' segnato <strong>rimborsato</strong> e l\'impresa e\' in lista d\'attesa per ' + esito.citta + '.</p>'
          + (rimborso.indexOf('NON RIUSCITO') === 0
              ? '<p style="color:#c0392b;font-weight:700">⚠️ Il rimborso automatico non e\' riuscito: entra su Stripe e rimborsa a mano.</p>'
              : '')
          + '</div>');

        return { statusCode: 200, body: JSON.stringify({ received: true, rimborsato: true }) };
      }

      // ============ CASO NORMALE: lo spazio e' suo ============
      if (stato !== 'pagato') {
        // gia_pagato (avviso ripetuto da Stripe) o annullato: niente da fare.
        return { statusCode: 200, body: JSON.stringify({ received: true, stato: stato }) };
      }

      // ---- 10 set 2026: da qui in poi lo spazio e' suo E si rinnova ----

      // Il cliente Stripe si scrive sul profilo dell'impresa, se non c'e'
      // gia': e' quello che permette al portale (dove si disdice e si cambia
      // la carta) di aprirsi sulla persona giusta.
      if (session.customer) {
        try {
          const { data: a } = await supabase
            .from('annunci_pubblicitari').select('impresa_id').eq('id', annuncioId).single();
          if (a && a.impresa_id) {
            const { data: i } = await supabase
              .from('imprese').select('stripe_customer_id').eq('id', a.impresa_id).single();
            if (i && !i.stripe_customer_id) {
              await supabase.from('imprese')
                .update({ stripe_customer_id: session.customer }).eq('id', a.impresa_id);
            }
          }
        } catch (e) {
          console.error('[pubblicita] cliente Stripe non scritto:', e.message);
        }
      }
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const { data: att, error: eAtt } = await supabase.rpc('attiva_abbonamento_annuncio', {
            p_annuncio: annuncioId,
            p_subscription: session.subscription,
            p_fine_periodo: fineDelPeriodo(sub)
          });
          if (eAtt) console.error('[pubblicita] abbonamento non segnato:', eAtt.message);
          else console.log('[pubblicita] abbonamento acceso:', session.subscription, att && att.ok);
        } catch (e) {
          console.error('[pubblicita] abbonamento non letto:', e.message);
        }
      }

      // -------------------------------------------------------------
      // LA RIGA DELL'INCASSO — 14 agosto 2026
      //
      // L'importo NON si ricalcola: si prende quello che Stripe dice di
      // aver incassato. Quello e' il numero vero.
      //
      // ⚠️ Se prendere nota fallisce, NON si risponde errore: l'annuncio
      // e' gia' pagato e attivo, e un errore farebbe rimandare l'avviso a
      // Stripe per niente.
      //
      // 9 set 2026: adesso sta DOPO la conferma. Un ordine rimborsato non
      // deve finire negli incassi: se no i conti direbbero soldi che non ci sono.
      // -------------------------------------------------------------
      try {
        const { data: reg, error: eReg } = await supabase.rpc('registra_pagamento', {
          p_prodotto:    'pubblicita',
          p_centesimi:   session.amount_total,
          p_riferimento: session.id,
          p_email:       (session.customer_details && session.customer_details.email) || null,
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

  // =========================================================================
  // IL RINNOVO E' STATO PAGATO
  // Stripe dice fin quando ha incassato: quella data la scriviamo sull'annuncio,
  // cosi' il cartello resta acceso senza che nessuno faccia niente.
  // =========================================================================
  if (stripeEvent.type === 'invoice.paid') {
    const inv = stripeEvent.data.object;

    // Il primo pagamento e' gia' gestito dalla sessione qui sopra: qui
    // interessano solo i giri successivi.
    if (inv.billing_reason !== 'subscription_cycle' || !inv.subscription) {
      return { statusCode: 200, body: JSON.stringify({ received: true, saltato: inv.billing_reason }) };
    }

    let fine = null, annuncioId = null;
    try {
      const sub = await stripe.subscriptions.retrieve(inv.subscription);
      fine = fineDelPeriodo(sub);
      annuncioId = annuncioDa(sub);
    } catch (e) {
      console.error('[pubblicita] rinnovo, abbonamento non letto:', e.message);
    }

    const { data: esito, error: eRin } = await supabase.rpc('rinnova_annuncio_abbonamento', {
      p_subscription: inv.subscription,
      p_fine_periodo: fine
    });
    if (eRin) {
      console.error('[pubblicita] rinnovo non scritto:', eRin.message);
      return { statusCode: 500, body: 'Supabase Error: ' + eRin.message };
    }
    console.log('[pubblicita] rinnovo', inv.subscription, '->', esito && esito.motivo ? esito.motivo : 'ok', fine);

    // Caso raro ma possibile: lo spazio si sovrappone a un altro annuncio
    // gia' venduto per quel periodo. Non si tiene il posto a due persone:
    // si chiude l'abbonamento, si restituiscono i soldi e si avvisa Alex.
    if (esito && esito.ok === false) {
      const chiuso = await chiudiAbbonamento(inv.subscription);
      let reso = 'non riuscito';
      try {
        if (inv.payment_intent) {
          const r = await stripe.refunds.create({ payment_intent: inv.payment_intent, reason: 'requested_by_customer' });
          reso = 'fatto (' + r.id + ')';
        }
      } catch (e) { reso = 'NON RIUSCITO: ' + e.message; }
      await mandaEmail('info@trovaimpresa.com',
        'Rinnovo pubblicita bloccato: ' + (esito.motivo || 'errore'),
        LOGO + '<p>Un rinnovo non e\' andato a buon fine.</p>'
        + '<p>Abbonamento: <strong>' + inv.subscription + '</strong><br>'
        + 'Motivo: <strong>' + (esito.motivo || '-') + '</strong><br>'
        + 'Abbonamento chiuso: <strong>' + chiuso + '</strong><br>'
        + 'Rimborso: <strong>' + reso + '</strong></p>');
      return { statusCode: 200, body: JSON.stringify({ received: true, rinnovo: 'bloccato' }) };
    }

    // L'incasso del rinnovo entra nei conti come quello del primo mese.
    try {
      await supabase.rpc('registra_pagamento', {
        p_prodotto:    'pubblicita',
        p_centesimi:   inv.amount_paid,
        p_riferimento: inv.id,
        p_email:       inv.customer_email || null,
        p_impresa_id:  null,
        p_valuta:      inv.currency || 'eur',
        p_tipo_evento: stripeEvent.type,
        p_quando:      stripeEvent.created ? new Date(stripeEvent.created * 1000).toISOString() : null
      });
    } catch (e) {
      console.error('[pagamenti] rinnovo non segnato:', e.message);
    }

    // Una riga al cliente, cosi' sa che e' tutto a posto e non si spaventa
    // vedendo l'addebito sull'estratto conto.
    if (annuncioId) {
      const { email, ann } = await emailDellAnnuncio(annuncioId);
      if (email) {
        await mandaEmail(email, 'Il tuo spazio pubblicitario e\' stato rinnovato',
          LOGO + '<p>Ciao,</p><p>il tuo spazio pubblicitario'
          + (ann ? ' <strong>' + (NOMI_SPAZIO[ann.spazio_id] || ann.spazio_id) + '</strong> a <strong>' + ann.citta + '</strong>' : '')
          + ' e\' stato rinnovato: resta online senza che tu debba fare niente.</p>'
          + '<p>Importo: <strong>' + euro(inv.amount_paid) + '</strong><br>'
          + 'Prossimo rinnovo: <strong>' + (fine || '-') + '</strong></p>'
          + '<p>Se un giorno non ti servisse piu\', puoi disdire quando vuoi dalla tua area'
          + ' <a href="https://trovaimpresa.com/le-mie-inserzioni.html">Le mie inserzioni</a>.</p>');
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, rinnovato: true }) };
  }

  // =========================================================================
  // IL RINNOVO NON E' RIUSCITO (carta scaduta, fondi, banca)
  // Non si spegne niente: Stripe riprova da solo per giorni. Qui si avvisa
  // e basta, cosi' nessuno lo scopre a cartello gia' spento.
  // =========================================================================
  if (stripeEvent.type === 'invoice.payment_failed') {
    const inv = stripeEvent.data.object;
    let annuncioId = null;
    try {
      if (inv.subscription) {
        const sub = await stripe.subscriptions.retrieve(inv.subscription);
        annuncioId = annuncioDa(sub);
      }
    } catch (e) { console.error('[pubblicita] fallito, abbonamento non letto:', e.message); }

    console.log('[pubblicita] rinnovo NON pagato:', inv.subscription, inv.id);

    await mandaEmail('info@trovaimpresa.com', 'Rinnovo pubblicita non pagato',
      LOGO + '<p>Un rinnovo non e\' stato pagato. Stripe riprovera\' da solo nei prossimi giorni.</p>'
      + '<p>Abbonamento: <strong>' + (inv.subscription || '-') + '</strong><br>'
      + 'Importo: <strong>' + euro(inv.amount_due) + '</strong><br>'
      + 'Cliente: <strong>' + (inv.customer_email || '-') + '</strong></p>');

    if (annuncioId) {
      const { email, ann } = await emailDellAnnuncio(annuncioId);
      if (email) {
        await mandaEmail(email, 'Non siamo riusciti a rinnovare il tuo spazio',
          LOGO + '<p>Ciao,</p><p>il pagamento per rinnovare il tuo spazio'
          + (ann ? ' a <strong>' + ann.citta + '</strong>' : '') + ' non e\' andato a buon fine.</p>'
          + '<p>Non devi rifare l\'ordine: ci riproviamo da soli nei prossimi giorni.'
          + ' Se la carta e\' scaduta o cambiata, puoi aggiornarla dalla tua area'
          + ' <a href="https://trovaimpresa.com/le-mie-inserzioni.html">Le mie inserzioni</a>.</p>'
          + '<p>Il tuo annuncio resta online nel frattempo.</p>');
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, fallito: true }) };
  }

  // =========================================================================
  // IL CLIENTE HA DISDETTO
  // L'annuncio NON si spegne subito: resta fino alla fine del periodo che ha
  // gia' pagato, poi scade da solo come uno normale. Regola del 7 settembre:
  // chi ha pagato deve apparire.
  // =========================================================================
  if (stripeEvent.type === 'customer.subscription.deleted') {
    const sub = stripeEvent.data.object;
    const { data: esito, error: eDis } = await supabase.rpc('disdici_annuncio_abbonamento', {
      p_subscription: sub.id
    });
    if (eDis) {
      console.error('[pubblicita] disdetta non scritta:', eDis.message);
      return { statusCode: 500, body: 'Supabase Error: ' + eDis.message };
    }
    console.log('[pubblicita] disdetta', sub.id, '->', esito && esito.ok);

    const annuncioId = annuncioDa(sub);
    const fine = fineDelPeriodo(sub);
    if (annuncioId) {
      const { email, ann } = await emailDellAnnuncio(annuncioId);
      await mandaEmail('info@trovaimpresa.com', 'Disdetta spazio pubblicitario',
        LOGO + '<p>Un cliente ha disdetto il suo spazio.</p>'
        + '<p>Spazio: <strong>' + (ann ? (NOMI_SPAZIO[ann.spazio_id] || ann.spazio_id) + ' - ' + ann.citta : '-') + '</strong><br>'
        + 'Resta online fino al: <strong>' + (fine || '-') + '</strong></p>');
      if (email) {
        await mandaEmail(email, 'Disdetta ricevuta',
          LOGO + '<p>Ciao,</p><p>abbiamo ricevuto la tua disdetta: non ti addebiteremo piu\' niente.</p>'
          + '<p>Il tuo annuncio resta online fino alla fine del periodo che hai gia\' pagato,'
          + ' poi si spegne da solo. Se cambi idea puoi ricomprare lo spazio quando vuoi.</p>');
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, disdetto: true }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
