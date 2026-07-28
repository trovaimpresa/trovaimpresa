// netlify/edge-functions/geo.js
// Restituisce la città del visitatore ricavata dall'IP.
// Netlify la fornisce gratis in context.geo: nessun servizio esterno,
// nessun popup di permesso, nessun limite di chiamate.
// Endpoint: /api/geo  ->  { "city": "Roma", "provincia": "RM", "paese": "IT" }

export default async (request, context) => {
  const geo = context.geo || {};

  const dati = {
    city: geo.city || '',
    provincia: (geo.subdivision && geo.subdivision.code) || '',
    regione: (geo.subdivision && geo.subdivision.name) || '',
    paese: (geo.country && geo.country.code) || ''
  };

  return new Response(JSON.stringify(dati), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Niente cache: l'IP cambia da visitatore a visitatore.
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex'
    }
  });
};

export const config = { path: '/api/geo' };
