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

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
