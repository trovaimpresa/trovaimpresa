// Crea la sessione Stripe per lo sblocco di un contatto (pay-per-lead).
// Chiamata dal pannello impresa con: { preventivo_id, ritorno }
// Header richiesto: Authorization: Bearer <access_token Supabase dell'impresa>

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const PREZZO_LEAD_EUR = 5;      // 💰 prezzo sblocco contatto
const MAX_SBLOCCHI = 5;         // massimo di imprese che possono sbloccare lo stesso lead
const ORE_ESCLUSIVA = 48;       // ore di esclusiva per l'impresa scelta dal cliente
const PANNELLI_VALIDI = [
  'pannello-artigiano.html',
  'pannello-impresa.html',
  'pannello-negozio.html',
  'pannello-professionisti.html',
];

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let preventivo_id, ritorno;
  try {
    ({ preventivo_id, ritorno } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }
  if (!preventivo_id) return { statusCode: 400, body: 'preventivo_id mancante' };

  const paginaRitorno = PANNELLI_VALIDI.includes(ritorno) ? ritorno : 'pannello-impresa.html';

  const token = (event.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, body: 'Non autenticato' };

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 1. Chi sta chiamando?
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return { statusCode: 401, body: 'Sessione non valida' };

    // 2. L'impresa dell'utente
    const { data: impresa } = await admin
      .from('imprese')
      .select('id, email, nome_attivita, nome, piano')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (!impresa) return { statusCode: 403, body: 'Impresa non trovata' };

    // 3. Il preventivo esiste? L'impresa può sbloccarlo?
    const { data: prev } = await admin
      .from('preventivi')
      .select('id, impresa_id, sbloccato, categoria_lavoro, citta, condivisibile, created_at')
      .eq('id', preventivo_id)
      .maybeSingle();
    if (!prev) return { statusCode: 404, body: 'Preventivo non trovato' };

    const isDiretta = String(prev.impresa_id) === String(impresa.id);

    // Modello ibrido: per i Premium le PROPRIE richieste sono incluse, niente da pagare
    if (isDiretta && ['premium','mensile','annuale'].includes((impresa.piano || '').toLowerCase())) {
      return { statusCode: 400, body: 'Contatto incluso nel tuo piano Premium: nessun pagamento necessario' };
    }

    // Ha già sbloccato questo lead?
    const { data: mioSblocco } = await admin
      .from('lead_sblocchi')
      .select('id')
      .eq('preventivo_id', prev.id)
      .eq('impresa_id', impresa.id)
      .maybeSingle();
    if (mioSblocco || (isDiretta && prev.sbloccato)) {
      return { statusCode: 400, body: 'Contatto già sbloccato' };
    }

    if (!isDiretta) {
      // Impresa di zona: il lead deve essere condivisibile,
      // l'esclusiva di 48h scaduta e il tetto di 5 sblocchi non raggiunto
      if (!prev.condivisibile) {
        return { statusCode: 403, body: 'Il cliente non ha autorizzato la condivisione di questa richiesta' };
      }
      const scadenzaEsclusiva = new Date(new Date(prev.created_at).getTime() + ORE_ESCLUSIVA * 3600 * 1000);
      if (new Date() < scadenzaEsclusiva) {
        return { statusCode: 403, body: `Richiesta in esclusiva fino al ${scadenzaEsclusiva.toLocaleString('it-IT')}` };
      }
      const { count } = await admin
        .from('lead_sblocchi')
        .select('id', { count: 'exact', head: true })
        .eq('preventivo_id', prev.id);
      if ((count || 0) >= MAX_SBLOCCHI) {
        return { statusCode: 410, body: 'Richiesta esaurita: già sbloccata dal numero massimo di imprese' };
      }
    }

    // 4. Sessione di pagamento
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: impresa.email || undefined,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Sblocco contatto cliente — richiesta #${prev.id}`,
            description: `${prev.categoria_lavoro || 'Lavoro'} a ${prev.citta || 'zona non indicata'} — TrovaImpresa`,
          },
          unit_amount: PREZZO_LEAD_EUR * 100,
        },
        quantity: 1,
      }],
      metadata: { preventivo_id: String(prev.id), impresa_id: String(impresa.id) },
      success_url: `https://trovaimpresa.com/${paginaRitorno}?sblocco=ok&preventivo=${prev.id}`,
      cancel_url: `https://trovaimpresa.com/${paginaRitorno}?sblocco=annullato`,
    });

    await admin.from('preventivi')
      .update({ stripe_session_id: session.id })
      .eq('id', prev.id);

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('[crea-checkout-lead]', err.message);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
