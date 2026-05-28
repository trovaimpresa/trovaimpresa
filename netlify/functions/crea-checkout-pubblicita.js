const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Listino server-side = unica fonte di verità per il prezzo (NON ci si fida del client)
const PREZZI_MENSILI = {
  'hero-sx': 20, 'hero-dx': 20,
  'imprese-sx': 12, 'imprese-dx': 12,
  'pannello-sx': 10, 'pannello-dx': 10,
  'piano-sx': 9, 'piano-dx': 9,
  'inserzioni-sx': 8, 'inserzioni-dx': 8,
  'subappalto-sx-1': 6, 'subappalto-sx-2': 6, 'subappalto-dx-1': 6, 'subappalto-dx-2': 6,
  'profilo-sx-1': 5, 'profilo-sx-2': 5, 'profilo-dx-1': 5, 'profilo-dx-2': 5
};
const SCONTI = { 1: 0, 3: 0.10, 12: 0.25 };

function mesiTraDate(inizio, fine) {
  const a = new Date(inizio), b = new Date(fine);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { annuncio_id } = JSON.parse(event.body);
    if (!annuncio_id) return { statusCode: 400, body: JSON.stringify({ error: 'Nessun annuncio' }) };

    // Leggo la riga dal DB (fonte di verità per spazio e periodo)
    const { data: ann, error } = await supabase
      .from('annunci_pubblicitari')
      .select('id, spazio_id, citta, data_inizio, data_fine, stato, impresa_id')
      .eq('id', annuncio_id)
      .eq('stato', 'pending')
      .single();
    if (error || !ann) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Annuncio non trovato o gia pagato' }) };
    }

    // Ricalcolo prezzo server-side
    const mensile = PREZZI_MENSILI[ann.spazio_id];
    if (mensile == null) return { statusCode: 400, body: JSON.stringify({ error: 'Spazio non valido' }) };
    const mesi = mesiTraDate(ann.data_inizio, ann.data_fine);
    const sconto = SCONTI[mesi] || 0;
    const prezzo = Math.round(mensile * mesi * (1 - sconto) * 100) / 100;
    if (prezzo <= 0) return { statusCode: 400, body: JSON.stringify({ error: 'Prezzo non valido' }) };

    const periodoLabel = mesi === 12 ? '1 anno' : (mesi + (mesi === 1 ? ' mese' : ' mesi'));

    // Email impresa (opzionale, per pre-compilare il checkout)
    let email;
    if (ann.impresa_id) {
      const { data: imp } = await supabase
        .from('imprese').select('email').eq('id', ann.impresa_id).single();
      if (imp && imp.email) email = imp.email;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Pubblicita TrovaImpresa',
            description: ann.spazio_id + ' - ' + ann.citta + ' - ' + periodoLabel,
          },
          unit_amount: Math.round(prezzo * 100),
        },
        quantity: 1,
      }],
      metadata: { annuncio_id: String(ann.id) },
      success_url: 'https://trovaimpresa.com/pubblicita?pagamento=ok',
      cancel_url: 'https://trovaimpresa.com/pubblicita?pagamento=annullato',
    });

    // Salvo il session_id sulla riga (riferimento)
    await supabase
      .from('annunci_pubblicitari')
      .update({ stripe_session_id: session.id })
      .eq('id', ann.id);

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
