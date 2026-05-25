const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PREZZI = { 1:20, 2:18, 3:16, 4:14, 5:12, 6:10, 7:8, 8:6 };
const MOLT = { mensile:1, trimestrale:2.7, annuale:10 };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { ids, piano } = JSON.parse(event.body);
    if (!ids || !ids.length) return { statusCode: 400, body: JSON.stringify({ error: 'Nessun annuncio' }) };

    const { data: righe, error } = await supabase
      .from('annunci_pubblicitari')
      .select('id, riga, email')
      .in('id', ids)
      .eq('stato', 'pending');

    if (error || !righe || !righe.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Annunci non trovati' }) };
    }

    const mult = MOLT[piano] || 1;
    let totale = 0;
    righe.forEach(function (r) { totale += (PREZZI[r.riga] || 0) * mult; });
    totale = Math.round(totale);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: righe[0].email || undefined,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Pubblicità TrovaImpresa',
            description: righe.length + ' città · piano ' + (piano || 'mensile'),
          },
          unit_amount: totale * 100,
        },
        quantity: 1,
      }],
      metadata: { ids: ids.join(','), piano: piano || 'mensile' },
      success_url: 'https://trovaimpresa.com/pubblicita?pagamento=ok',
      cancel_url: 'https://trovaimpresa.com/pubblicita?pagamento=annullato',
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
