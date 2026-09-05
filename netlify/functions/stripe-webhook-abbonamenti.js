// =====================================================================
// STRIPE — ABBONAMENTI (Premium, add-on Gestionale) e RICARICHE DI CREDITI AI
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
//
// ---------------------------------------------------------------------
// 16 agosto 2026 — LE RICARICHE DI CREDITI AI (Blocco 0)
//
// Qui sopra c'e' scritto «non si risponde mai errore». Per i crediti vale
// il contrario, ed e' voluto: se i crediti NON sono arrivati, a Stripe si
// risponde errore APPOSTA, cosi' riprova. Sono due cose diverse:
//   - la riga contabile e' un appunto nostro. Se manca, pazienza.
//   - i crediti sono la merce. Se non arrivano, uno ha pagato per niente.
//
// ⚠️ E il doppio avviso? Stripe rimanda lo stesso evento piu' volte, e
//    adesso lo fara' di sicuro, perche' gli stiamo chiedendo di riprovare.
//    A tenere il conto e' il database: `add_credits_pack` accredita una
//    volta sola per numero di transazione, e la seconda volta risponde
//    'already_processed'. Qui quella risposta vale come «tutto a posto».
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------
// prende nota dell'incasso. NON LANCIA MAI: qualunque cosa vada storta
// qui dentro, chi ha pagato deve andare avanti lo stesso.
// ---------------------------------------------------------------------
// =====================================================================
// L'ALLARME AD ALESSIO                              5 settembre 2026
// =====================================================================
// ⛔ Prima queste tre `update` non leggevano la risposta. Se una falliva,
// il cliente aveva PAGATO e il gestionale (o il Premium) non gli si
// accendeva — e non lo sapeva nessuno: ne' lui, ne' Alessio. Il log di
// Netlify lo si guarda dopo, e «dopo» qui vuol dire un cliente che ha
// pagato e aspetta.
//
// Adesso succedono due cose insieme:
//   1. si risponde ERRORE a Stripe, che riprova da solo per ~3 giorni
//      (e' il meccanismo `tuttoBene` che questo file gia' usava per i
//      crediti: una regola sola, in un posto solo)
//   2. parte questa mail, subito
// Se una delle riprove va a buon fine, le mail smettono da sole.
//
// ⚠️ Non lancia MAI un'eccezione: un allarme che rompe il webhook e'
// peggio del guasto che segnala.
// =====================================================================
// ⚠️ scritta IDENTICA a quella delle altre 21 email, a capo compresi: il
// banco `banco-logo-email.js` calcola l'impronta del tag <img> e pretende
// una sola impronta in tutte. Riscrivendola "a modo mio", tutta su una
// riga, il banco e' diventato subito rosso — ed e' il suo mestiere.
const LOGO_EMAIL = `<div style="text-align:center;padding:16px 0 20px">
  <a href="https://trovaimpresa.com" style="text-decoration:none">
    <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
         style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
  </a>
</div>`;

async function avvisaAlessio(oggetto, righe, cosaFare) {
  try {
    const chiave = (process.env.RESEND_API_KEY || '').trim();
    if (!chiave) { console.error('[ALLARME] RESEND_API_KEY manca: mail non partita —', oggetto); return; }

    const elenco = Object.keys(righe || {})
      .map(function (k) {
        return '<tr><td style="padding:6px 12px 6px 0;color:#6b7a8d;font-size:14px;white-space:nowrap">' + k
             + '</td><td style="padding:6px 0;font-size:14px;color:#12233a"><b>'
             + String(righe[k] == null ? '—' : righe[k]).replace(/&/g,'&amp;').replace(/</g,'&lt;')
             + '</b></td></tr>';
      }).join('');

    const html = '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">'
      + LOGO_EMAIL
      + '<div style="background:#fdecec;border:1px solid #f5c6c6;border-radius:12px;padding:18px 20px">'
      + '<div style="font-size:18px;font-weight:800;color:#c0392b;margin:0 0 6px">' + oggetto + '</div>'
      + '<div style="font-size:14px;color:#7a3b34">Il pagamento &egrave; arrivato. Quello che doveva succedere dopo, no.</div>'
      + '</div>'
      + '<table style="margin:18px 0;border-collapse:collapse">' + elenco + '</table>'
      + '<div style="background:#fff8ec;border:1px solid #f0d9b0;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;color:#6b5330">'
      + '<b>Cosa fare</b><br>' + cosaFare + '</div>'
      + '<p style="font-size:13px;color:#7a8798;line-height:1.6;margin-top:18px">'
      + 'Stripe riprova da solo per circa 3 giorni. Se una riprova riesce, questa mail smette di arrivare.'
      + '</p></div>';

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + chiave, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: ['info@trovaimpresa.com'],
        subject: oggetto
      , html })
    });
    if (!r.ok) console.error('[ALLARME] mail non partita, stato ' + r.status + ' —', oggetto);
  } catch (e) {
    console.error('[ALLARME] mail non partita:', e && e.message, '—', oggetto);
  }
}

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

// ---------------------------------------------------------------------
// LA RICARICA DEI CREDITI AI
//
// Restituisce true  = a Stripe si puo' rispondere «ok».
//              false = i crediti NON sono arrivati: Stripe deve riprovare.
//
// ⚠️ Il numero di crediti si legge dai metadata scritti dal SERVER in
//    crea-checkout-crediti.js. Dal browser non arriva niente.
// ⚠️ Il riferimento del pagamento e' l'id della sessione: e' lo stesso
//    anche quando Stripe rimanda l'avviso, ed e' quello che impedisce il
//    doppio accredito.
// ---------------------------------------------------------------------
async function accreditaCrediti(supabase, s, ev) {
  const meta    = s.metadata || {};
  const email   = meta.email || s.customer_email || null;
  const userId  = meta.user_id || s.client_reference_id || null;
  const crediti = parseInt(meta.crediti, 10);

  // ⚠️ IL CASO CHE NON DEVE ACCREDITARE NIENTE.
  // Con la carta `payment_status` e' 'paid' subito. Con i pagamenti che
  // ci mettono giorni (bonifico, addebito) l'avviso arriva prima con
  // 'unpaid': se accreditassimo qui, uno avrebbe i crediti senza aver
  // pagato. Quando poi paga davvero arriva
  // `checkout.session.async_payment_succeeded`, e li' si accredita.
  if (s.payment_status !== 'paid') {
    console.log('[crediti] avviso ricevuto ma non pagato (' + s.payment_status + '):', s.id);
    return true;   // non e' un errore: non c'e' niente da fare
  }

  // l'incasso si segna comunque, anche se poi l'accredito va storto
  await segnaIncasso(supabase, {
    prodotto: 'crediti-ai', centesimi: s.amount_total, riferimento: s.id,
    email, valuta: s.currency, tipo_evento: ev.type,
    quando: ev.created ? new Date(ev.created * 1000).toISOString() : null
  });

  if (!userId || !(crediti > 0)) {
    // dato mancante: riprovare non servirebbe a niente, il dato non
    // arrivera' mai. Si risponde ok e si urla nel log.
    console.error('[crediti] AVVISO SENZA DESTINATARIO — sessione ' + s.id +
                  ' user_id=' + userId + ' crediti=' + meta.crediti +
                  ' — questa persona ha pagato e NON ha ricevuto i crediti.');
    return true;
  }

  const { data, error } = await supabase.rpc('add_credits_pack', {
    p_user_id:           userId,
    p_credits:           crediti,
    p_amount_eur:        (s.amount_total || 0) / 100,
    p_payment_provider:  'stripe',
    p_payment_reference: s.id
  });

  if (error) {
    console.error('[crediti] accredito fallito, faccio riprovare Stripe:', error.message);
    return false;
  }
  if (data && data.ok === false) {
    if (data.reason === 'already_processed') {
      // e' il caso normale del doppio avviso: i crediti ci sono gia'.
      console.log('[crediti] gia accreditati:', s.id);
      return true;
    }
    console.error('[crediti] accredito rifiutato (' + data.reason + '), faccio riprovare Stripe:', s.id);
    return false;
  }

  console.log('[crediti] accreditati ' + crediti + ' crediti a ' + userId + ' (' + s.id + ')');
  return true;
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

  // se resta false, a Stripe si risponde errore e lui riprova
  let tuttoBene = true;
  let motivoErrore = 'crediti non accreditati';

  if (ev.type === 'checkout.session.completed' ||
      ev.type === 'checkout.session.async_payment_succeeded') {
    const s = ev.data.object;
    const email = s.metadata && s.metadata.email;
    const prodotto = s.metadata && s.metadata.prodotto;

    // ⚠️ QUESTO CONTROLLO VA PER PRIMO.
    // Una ricarica di crediti porta con se' l'email, e senza questa riga
    // finirebbe nel ramo qui sotto: 19 euro di crediti diventerebbero un
    // Premium regalato.
    if (prodotto === 'crediti-ai') {
      tuttoBene = await accreditaCrediti(supabase, s, ev);

    } else if (email && prodotto === 'gestionale') {
      // Add-on Gestionale attivato: NON tocca il piano Premium.
      const campiGest = { gestionale_attivo: true, gestionale_scadenza: null };
      if (typeof s.customer === 'string' && s.customer) campiGest.stripe_customer_id = s.customer;
      const upGest = await supabase.from('imprese').update(campiGest).eq('email', email);
      if (upGest.error) {
        tuttoBene = false;
        motivoErrore = 'gestionale non acceso';
        console.error('[PAGATO MA NON ACCESO] gestionale, ' + email + ':', upGest.error.message);
        await avvisaAlessio('Pagamento ricevuto, gestionale NON acceso', {
          'Chi': email, 'Cosa aveva comprato': 'Add-on Gestionale',
          'Quanto': (s.amount_total / 100).toFixed(2) + ' ' + String(s.currency || 'eur').toUpperCase(),
          'Riferimento Stripe': s.id, 'Errore del database': upGest.error.message
        }, 'Apri Supabase &rarr; tabella <b>imprese</b>, cerca questa email e metti a mano '
         + '<b>gestionale_attivo = true</b> e <b>gestionale_scadenza = vuoto</b>. '
         + 'Poi avvisa il cliente che &egrave; tutto a posto.');
      }
      await segnaIncasso(supabase, {
        prodotto: 'gestionale', centesimi: s.amount_total, riferimento: s.id,
        email, valuta: s.currency, tipo_evento: ev.type,
        quando: ev.created ? new Date(ev.created * 1000).toISOString() : null
      });
    } else if (email) {
      // Pagamento ricevuto: Premium pagato, senza scadenza (azzero l'eventuale scadenza del regalo)
      //
      // 29 agosto 2026 — I DUE PIANI.
      // `prodotto` arriva dal checkout. 'premium-ai' e' il piano da 39/349:
      // l'unica cosa in piu' e' la chat con l'AI, che si accende con
      // `chat_pro` — la stessa colonna che guardano il cancello del
      // gestionale e la funzione `chat_stato` su Supabase.
      // ⚠️ Chi compra il Premium liscio NON viene toccato su chat_pro: se
      //    ce l'aveva acceso, non glielo spegniamo dentro un pagamento.
      const conAI = (prodotto === 'premium-ai');
      const campi = { piano: 'premium', premium_scadenza: null, premium_pagato: true };
      if (conAI) { campi.chat_pro = true; campi.chat_pro_scadenza = null; }
      // ⚠️ il «cliente» di Stripe si prende NOTA QUI, che e' l'unico
      // momento in cui ce l'abbiamo in mano. Serve al portale clienti
      // (cambio piano e disdetta): senza, lo si dovrebbe cercare per
      // email ogni volta, e due account con la stessa email sono un
      // guaio che si paga in soldi.
      if (typeof s.customer === 'string' && s.customer) campi.stripe_customer_id = s.customer;
      const upPrem = await supabase.from('imprese').update(campi).eq('email', email);
      if (upPrem.error) {
        tuttoBene = false;
        motivoErrore = 'premium non acceso';
        console.error('[PAGATO MA NON ACCESO] ' + (conAI ? 'premium-ai' : 'premium') + ', ' + email + ':', upPrem.error.message);
        await avvisaAlessio('Pagamento ricevuto, Premium NON acceso', {
          'Chi': email, 'Cosa aveva comprato': conAI ? 'Premium AI' : 'Premium',
          'Quanto': (s.amount_total / 100).toFixed(2) + ' ' + String(s.currency || 'eur').toUpperCase(),
          'Riferimento Stripe': s.id, 'Errore del database': upPrem.error.message
        }, 'Apri Supabase &rarr; tabella <b>imprese</b>, cerca questa email e metti a mano '
         + '<b>piano = premium</b>, <b>premium_pagato = true</b>, <b>premium_scadenza = vuoto</b>'
         + (conAI ? ' e <b>chat_pro = true</b>' : '') + '. Poi avvisa il cliente.');
      }
      await segnaIncasso(supabase, {
        prodotto: conAI ? 'premium-ai' : 'premium', centesimi: s.amount_total, riferimento: s.id,
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

  // Pagamento lento che poi non e' andato a buon fine: non si accredita
  // niente. Sta qui solo per lasciarne traccia nel log.
  if (ev.type === 'checkout.session.async_payment_failed') {
    const s = ev.data.object;
    if (s.metadata && s.metadata.prodotto === 'crediti-ai') {
      console.log('[crediti] pagamento non riuscito, nessun accredito:', s.id);
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
  //
  // ⚠️ Le ricariche di crediti non passano di qui: sono pagamenti singoli,
  // non abbonamenti, e non generano nessuna fattura ricorrente.
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
        prodotto: (prodotto === 'gestionale' || prodotto === 'premium-ai') ? prodotto : 'premium',
        centesimi: inv.amount_paid, riferimento: inv.id,
        email, valuta: inv.currency, tipo_evento: ev.type,
        quando: ev.created ? new Date(ev.created * 1000).toISOString() : null
      });
    }
  }

  // -------------------------------------------------------------------
  // LA DISDETTA
  //
  // ⛔ 29 agosto 2026 — IL BUCO CHE C'ERA QUI.
  // Prima questo pezzo spegneva SOLO l'add-on gestionale. Chi disdiceva il
  // Premium restava Premium per sempre: Stripe smetteva di incassare e il
  // sito continuava a dargli tutto. Adesso torna free davvero.
  //
  // ⚠️ Stripe manda questo avviso alla FINE del periodo gia' pagato, non
  //    nel momento in cui la persona clicca «disdici»: fino a quel giorno
  //    ha pagato, e fino a quel giorno tiene quello che ha pagato.
  // ⚠️ Gli abbonamenti nati prima del 29 agosto non hanno `prodotto` nei
  //    metadata: se manca, si considera un Premium.
  // -------------------------------------------------------------------
  if (ev.type === 'customer.subscription.deleted') {
    const sub = ev.data.object;
    const email = sub.metadata && sub.metadata.email;
    const prodotto = (sub.metadata && sub.metadata.prodotto) || 'premium';

    if (!email) {
      console.error('[disdetta] abbonamento disdetto SENZA email nei metadata:', sub.id);
    } else if (prodotto === 'gestionale') {
      // ⚠️ qui il verso e' l'opposto: se fallisce, uno che ha disdetto
      // continua ad avere il gestionale gratis. Non lo vede nessuno
      // guardando lo schermo, si vede solo sul conto a fine anno.
      const upDis = await supabase.from('imprese').update({ gestionale_attivo: false }).eq('email', email);
      if (upDis.error) {
        tuttoBene = false;
        motivoErrore = 'gestionale non spento';
        console.error('[disdetta] gestionale NON spento per ' + email + ':', upDis.error.message);
      } else {
        console.log('[disdetta] gestionale spento:', email);
      }
    } else {
      // Premium e Premium AI: si torna al piano free e si spegne la chat AI.
      const { error } = await supabase.from('imprese').update({
        piano:             'free',
        premium_pagato:    false,
        chat_pro:          false,
        chat_pro_scadenza: null,
        disdetto_piano_il: new Date().toISOString()
      }).eq('email', email);
      if (error) console.error('[disdetta] NON riuscita per ' + email + ':', error.message);
      else console.log('[disdetta] ' + prodotto + ' chiuso, tornato free:', email);
    }
  }

  if (!tuttoBene) {
    // ⚠️ APPOSTA. Stripe riprova per circa tre giorni, e ogni volta
    // `add_credits_pack` fa un tentativo pulito. Se non ce la fa nemmeno
    // dopo, Stripe ti manda un'email: e' il modo giusto di accorgersene.
    return { statusCode: 500, body: motivoErrore };
  }
  return { statusCode: 200, body: 'ok' };
};
