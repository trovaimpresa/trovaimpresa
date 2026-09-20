// =====================================================================
// ELIMINA ACCOUNT — «Annulla iscrizione»
//
// 14 agosto 2026 — aggiunta la RIGA DI CONGEDO, e basta.
//
// Prima faceva una cosa sola: auth.admin.deleteUser(). E funziona: tutte
// le 49 tabelle agganciate all'account hanno la cascata (verificato sul
// database vero, confdeltype = 'c' su tutte, nessuna che blocca), quindi
// chi chiede di essere cancellato viene cancellato davvero, e la
// cancellazione non puo' fallire per colpa di un vincolo.
//
// Il problema era un altro: NON RESTAVA NIENTE. Nessun posto dove fosse
// scritto che quella persona c'era. Alla domanda «se n'e' andato
// qualcuno?» il pannello non poteva rispondere — non perche' non la
// mostrava, ma perche' il dato non esisteva. E contare gli iscritti non
// basta: un numero fermo puo' voler dire nessuno entrato e nessuno
// uscito, oppure tre entrati e tre usciti, che sono due mondi diversi.
//
// Adesso, PRIMA di cancellare, si scrive una riga in
// `public.iscrizioni_annullate`: chi era, che attivita', quanto e'
// durato, e — se ha voluto dirlo — perche'.
//
// ⚠️ LA REGOLA CHE NON SI TOCCA
// Se la scrittura della riga fallisce, LA CANCELLAZIONE SI FA LO STESSO.
// Il diritto di una persona a sparire viene prima di qualsiasi
// statistica. Non si fa mai fallire una cancellazione per non aver
// potuto prendere nota: sarebbe come non lasciar disdire un abbonamento
// perche' il registro e' pieno.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[elimina-account] env vars mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let access_token, motivo, motivo_libero, solo_controllo;
  try {
    ({ access_token, motivo, motivo_libero, solo_controllo } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!access_token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token mancante.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(access_token);
    if (userErr || !user) {
      console.error('[elimina-account] token non valido:', userErr?.message);
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token non valido o scaduto.' }) };
    }

    // ---------------------------------------------------------------
    // ⛔ 20 settembre 2026 — PRIMA SI DISDICE, POI SI CHIUDE.
    //
    // IL BUCO CHE C'ERA QUI: non c'era niente. Questa funzione cancellava
    // l'utente e basta, e su Stripe non toccava nulla. Chi aveva pagato il
    // Gestionale e chiudeva il profilo spariva dal sito, ma LA CARTA
    // CONTINUAVA A PAGARE 29 euro al mese — e senza piu' la sua riga non
    // c'era nemmeno il modo di capire chi fosse. A lui restava solo il
    // reclamo alla banca: un chargeback, cioe' soldi indietro, penale, e
    // il conto Stripe segnato. Non era ancora successo solo perche'
    // nessuno aveva mai pagato davvero: dal 20 settembre 2026 non e' piu'
    // vero.
    //
    // LA REGOLA, scelta da Alessio: il sito e' gratis, il gestionale si
    // paga, e sono due cose separate. Chi ha il gestionale ATTIVO non puo'
    // chiudere il profilo: prima disdice, poi chiude. Due passi, non un
    // rifiuto — e la pagina gli mette il tasto della disdetta li' sotto.
    //
    // ⚠️ BASTA AVER DISDETTO, non serve aspettare fine mese. Se
    // `cancel_at_period_end` e' true l'abbonamento non si rinnovera' piu':
    // non c'e' nessun addebito in arrivo, quindi si puo' chiudere subito.
    // Tenerlo fermo un mese sarebbe solo fastidio a uno che ha gia' detto
    // che se ne va (scelta di Alessio, 20 set).
    //
    // ⚠️ SE NON RIESCO A CHIEDERLO A STRIPE, NON CANCELLO. Non e' come la
    // riga di congedo qui sotto, dove si tira dritto: li' si perde una
    // statistica, qui si rischia di lasciare una carta che paga a vuoto.
    // Si dice di riprovare fra poco, ed e' un fermo temporaneo.
    //
    // ⚠️ Chi non ha nessun cliente su Stripe (i Free, i Premium regalati)
    // non passa nemmeno di qui: niente cliente, niente da controllare.
    // ---------------------------------------------------------------
    try {
      const { data: impStripe } = await supabaseAdmin
        .from('imprese')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      const cliente = impStripe && impStripe.stripe_customer_id;
      if (cliente && process.env.STRIPE_SECRET_KEY) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const abbonamenti = await stripe.subscriptions.list({
          customer: cliente, status: 'all', limit: 20
        });
        const vivi = (abbonamenti && abbonamenti.data || []).filter(function (a) {
          const stato = String(a.status || '');
          const conta = (stato === 'active' || stato === 'trialing' || stato === 'past_due' || stato === 'unpaid');
          return conta && a.cancel_at_period_end !== true;
        });
        if (vivi.length > 0) {
          console.log('[elimina-account] fermato: gestionale ancora attivo,', user.id);
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'gestionale_attivo',
              messaggio: 'Hai il Gestionale attivo. Prima disdici il Gestionale, poi puoi chiudere il profilo: '
                       + 'il sito e\u2019 gratuito, il Gestionale si paga, e non vogliamo lasciarti una carta che paga a vuoto.'
            })
          };
        }
      }
    } catch (exStripe) {
      console.error('[elimina-account] non riesco a controllare Stripe:', exStripe && exStripe.message);
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'controllo_non_riuscito',
          messaggio: 'Non riesco a controllare il tuo abbonamento in questo momento. '
                   + 'Riprova fra qualche minuto: non chiudo il profilo finche\u2019 non sono sicuro che non ci siano addebiti in arrivo.'
        })
      };
    }

    /* ⚠️ `solo_controllo`: la pagina chiede PRIMA se si puo' chiudere, e
       solo dopo mostra il modulo del «perche' te ne vai». Se no uno
       compila tutto, spunta le caselle, scrive il motivo — e alla fine si
       sente dire che non puo'. Qui si e' gia' passati dal controllo di
       Stripe qui sopra: se siamo arrivati fin qui, la strada e' libera.
       ⛔ Da qui in giu' si CANCELLA: non spostare questo return piu' sotto. */
    if (solo_controllo === true) {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, controllo: true }) };
    }

    // ---------------------------------------------------------------
    // LA RIGA DI CONGEDO — si scrive PRIMA, se no non c'e' piu' nessuno
    // di cui scriverla. Tutto dentro un try suo: qualunque cosa vada
    // storta qui, sotto si cancella comunque.
    // ---------------------------------------------------------------
    try {
      const { data: imp } = await supabaseAdmin
        .from('imprese')
        .select('email,nome_attivita,tipo,citta,provincia,piano,created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const riga = {
        user_id:       user.id,
        // l'email dell'account e' quella vera: quella del profilo puo'
        // essere stata cambiata, o non esserci proprio
        email:         user.email || (imp && imp.email) || null,
        nome_attivita: (imp && imp.nome_attivita) || null,
        tipo:          (imp && imp.tipo) || null,
        citta:         (imp && imp.citta) || null,
        provincia:     (imp && imp.provincia) || null,
        piano:         (imp && imp.piano) || null,
        // quando si era iscritto: il profilo se c'e', se no la nascita
        // dell'account. Chi non ha mai completato il profilo e'
        // esattamente il caso che interessa di piu'.
        iscritto_il:   (imp && imp.created_at) || user.created_at || null,
        // il motivo e' facoltativo e arriva dalla pagina. Si accorcia:
        // una casella di testo libera puo' contenere qualsiasi cosa.
        /* 11 set 2026: da 60 a 200 caratteri. Ora si possono spuntare piu'
           caselle e arrivano tutte insieme separate da virgola: sei codici
           non stavano in 60 caratteri e l'ultimo veniva tagliato a meta'. */
        motivo:        motivo ? String(motivo).slice(0, 200) : null,
        motivo_libero: motivo_libero ? String(motivo_libero).slice(0, 1000) : null
      };

      const { error: segnaErr } = await supabaseAdmin
        .from('iscrizioni_annullate')
        .insert(riga);

      if (segnaErr) {
        // si scrive nel log e si tira dritto: vedi la regola in cima
        console.error('[elimina-account] riga di congedo NON scritta:', segnaErr.message);
      } else {
        console.log('[elimina-account] congedo segnato:', user.id);
      }
    } catch (segnaEx) {
      console.error('[elimina-account] eccezione scrivendo il congedo:', segnaEx.message);
    }

    // ---------------------------------------------------------------
    // LA CANCELLAZIONE — questa deve riuscire, ed e' quella che conta
    // ---------------------------------------------------------------
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error('[elimina-account] deleteUser fallito:', delErr.message);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore eliminazione account: ' + delErr.message }) };
    }

    console.log('[elimina-account] utente eliminato:', user.id);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[elimina-account] eccezione:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
