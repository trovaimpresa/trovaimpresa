const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Listino server-side = unica fonte di verità per il prezzo (NON ci si fida del client)
// 9 set 2026 — scala nuova, un prezzo per ogni altezza della pagina:
// 20 - 17 - 15 - 13 - 10 - 7 - 5. Piu' in alto sta il cartello, piu' e' grande
// e piu' costa. Deve restare uguale a js/spazi-elenco.js (il listino che vede
// il cliente): se qui e li' non combaciano, comanda questo file.
const PREZZI_MENSILI = {
  'hero-sx': 20, 'hero-dx': 20,
  'imprese-sx': 17, 'imprese-dx': 17,
  /* 'pannello-sx' e 'pannello-dx' rimossi (luglio 2026): gli spazi nei pannelli non esistono più */
  'piano-sx': 9, 'piano-dx': 9,
  'inserzioni-sx': 15, 'inserzioni-dx': 15,
  'guide-sx': 13, 'guide-dx': 13,
  'perche-sx': 10, 'perche-dx': 10,
  'subappalto-sx-1': 6, 'subappalto-sx-2': 6, 'subappalto-dx-1': 6, 'subappalto-dx-2': 6,
  'profilo-sx-1': 7, 'profilo-dx-1': 7,
  'profilo-sx-2': 5, 'profilo-dx-2': 5
};
const SCONTI = { 1: 0, 3: 0.10, 6: 0.13, 12: 0.15 };

// 9 set 2026 — PREZZO BLOCCATO (deciso da Alex).
// Chi aveva comprato col listino vecchio tiene il suo prezzo anche quando
// rinnova, finche' non disdice. Si toglie la riga solo quando quel cliente
// smette davvero.
const PREZZI_BLOCCATI = [
  { impresa_id: 109, spazio_id: 'imprese-dx', citta: 'Torino', mensile: 12 }  // Service House, dal 7 set 2026
];
function prezzoBloccato(ann) {
  const b = PREZZI_BLOCCATI.find(function (x) {
    return x.impresa_id === ann.impresa_id && x.spazio_id === ann.spazio_id && x.citta === ann.citta;
  });
  return b ? b.mensile : null;
}

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
      .select('id, spazio_id, citta, data_inizio, data_fine, mesi, stato, impresa_id')
      .eq('id', annuncio_id)
      .eq('stato', 'pending')
      .single();
    if (error || !ann) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Annuncio non trovato o gia pagato' }) };
    }

    // Ricalcolo prezzo server-side
    const mensile = prezzoBloccato(ann) != null ? prezzoBloccato(ann) : PREZZI_MENSILI[ann.spazio_id];
    if (mensile == null) return { statusCode: 400, body: JSON.stringify({ error: 'Spazio non valido' }) };
    // Durata: la colonna "mesi" è la fonte di verità. Le righe vecchie (create
    // prima che la colonna esistesse) ricadono sul calcolo dalle date.
    const mesi = Number(ann.mesi) > 0 ? Number(ann.mesi) : mesiTraDate(ann.data_inizio, ann.data_fine);
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
