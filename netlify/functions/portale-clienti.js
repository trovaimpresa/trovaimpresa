// =====================================================================
// STRIPE — IL PORTALE CLIENTI
//
// 29 agosto 2026.
// E' la pagina di Stripe dove chi paga fa da solo tre cose che prima
// non poteva fare: cambiare piano (da Premium a Premium AI e viceversa,
// col conguaglio calcolato da Stripe), cambiare la carta, e disdire.
//
// ⛔ PERCHE' NON SI FA COL CHECKOUT.
// Far ripartire il checkout a chi e' gia' abbonato crea un SECONDO
// abbonamento: pagherebbe 29 + 39 euro al mese. Il cambio di piano si fa
// dentro l'abbonamento che ha gia', e solo il portale (o il codice che
// scrive dentro la subscription) lo sa fare bene.
//
// ⚠️ CHI CHIAMA SI LEGGE DAL TOKEN, MAI DALL'EMAIL MANDATA DAL BROWSER.
// Stessa regola di crea-checkout-crediti.js: se l'email arrivasse dal
// browser, chiunque potrebbe aprire il portale di un altro e disdirgli
// l'abbonamento o vedergli le fatture.
//
// ⚠️ DA FARE UNA VOLTA SU STRIPE (Impostazioni > Fatturazione > Portale
//    clienti): accendere il portale, permettere il cambio piano fra i
//    prodotti «Premium» e «Premium AI» con i 4 prezzi, e la disdetta.
//    Finche' non e' acceso, Stripe risponde un errore chiaro e qui sotto
//    si trasforma in una frase leggibile.
// =====================================================================
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return rispondi(405, { error: 'Metodo non consentito' });
    }

    // ---- 1. chi sta chiamando (dal token, mai dal messaggio) --------
    const intestazione = event.headers.authorization || event.headers.Authorization || '';
    const token = intestazione.startsWith('Bearer ') ? intestazione.slice(7).trim() : '';
    if (!token) {
      return rispondi(401, { error: 'Devi essere collegato.' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: chi, error: erroreChi } = await supabase.auth.getUser(token);
    const utente = chi && chi.user;
    if (erroreChi || !utente || !utente.id) {
      return rispondi(401, { error: 'La sessione è scaduta. Rientra e riprova.' });
    }

    // ---- 2. il suo cliente su Stripe -------------------------------
    const { data: impresa } = await supabase
      .from('imprese')
      .select('id, email, stripe_customer_id')
      .eq('user_id', utente.id)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let cliente = impresa && impresa.stripe_customer_id;

    // ⚠️ RIPESCAGGIO. Gli abbonamenti nati prima del 29 agosto 2026 non
    // hanno il cliente scritto sul profilo: si cerca per email e, se si
    // trova, si prende nota per le volte dopo. Se ce ne fosse piu' di
    // uno non si indovina: si risponde che non c'e' abbonamento.
    if (!cliente) {
      const email = utente.email || (impresa && impresa.email);
      if (email) {
        const trovati = await stripe.customers.list({ email, limit: 2 });
        if (trovati && trovati.data && trovati.data.length === 1) {
          cliente = trovati.data[0].id;
          if (impresa && impresa.id != null) {
            await supabase.from('imprese').update({ stripe_customer_id: cliente }).eq('id', impresa.id);
          }
        }
      }
    }

    if (!cliente) {
      return rispondi(404, {
        error: 'senza_abbonamento',
        messaggio: 'Non risulta nessun abbonamento a tuo nome. Se pensi sia un errore, scrivimi dall\'assistenza.'
      });
    }

    // ---- 3. il portale ---------------------------------------------
    let corpo = {};
    try { corpo = JSON.parse(event.body || '{}'); } catch (e) { corpo = {}; }
    const ritorno = typeof corpo.returnUrl === 'string' && corpo.returnUrl.startsWith('https://trovaimpresa.com')
      ? corpo.returnUrl
      : 'https://trovaimpresa.com/pannello-impresa.html';

    const sessione = await stripe.billingPortal.sessions.create({
      customer: cliente,
      return_url: ritorno
    });

    return rispondi(200, { url: sessione.url });

  } catch (err) {
    // il caso piu' probabile: il portale non e' ancora stato acceso su
    // Stripe. Meglio una frase leggibile che un errore tecnico a schermo.
    const testo = String(err && err.message || err);
    console.error('[portale] ', testo);
    if (testo.toLowerCase().includes('configuration')) {
      return rispondi(500, {
        error: 'portale_non_acceso',
        messaggio: 'La gestione dell\'abbonamento non è ancora attiva. Riprova più tardi.'
      });
    }
    return rispondi(500, { error: testo });
  }
};
