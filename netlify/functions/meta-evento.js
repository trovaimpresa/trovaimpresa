// Manda a Meta l'evento CompleteRegistration DAL SERVER (API Conversions).
//
// Perche': il pixel nel browser parte solo dopo che il visitatore accetta i
// cookie, quindi Meta contava meno della meta' delle iscrizioni vere.
// Questa function parte sempre, dal server, subito dopo la registrazione.
//
// Il pixel nel browser e questa chiamata usano lo STESSO event_id:
// Meta li unisce e conta una sola iscrizione (deduplica).
//
// Chiamata dalle 4 pagine registrazione con:
//   { event_id, email, tipo, fbp, fbclid, url }
//
// Variabili Netlify richieste:
//   META_CAPI_TOKEN  (secret)
//   META_PIXEL_ID
//
// L'email NON viene mai scritta nei log: esce solo cifrata (SHA256).

const crypto = require('crypto');

const API_VERSION = 'v21.0';

function sha256(valore) {
  return crypto.createHash('sha256').update(valore, 'utf8').digest('hex');
}

// Meta vuole l'email normalizzata: senza spazi e tutta minuscola, poi SHA256.
function emailCifrata(email) {
  return sha256(String(email).trim().toLowerCase());
}

function emailValida(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// Il click da Facebook arriva come ?fbclid=... nell'URL.
// Meta lo vuole nel formato fbc: fb.1.<millisecondi>.<fbclid>
function costruisciFbc(fbclid, adesso) {
  if (!fbclid) return undefined;
  return 'fb.1.' + adesso + '.' + fbclid;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ errore: 'Method Not Allowed' }) };
  }

  let dati;
  try {
    dati = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ errore: 'JSON non valido' }) };
  }

  const { event_id, email, tipo, fbp, fbclid, url } = dati;

  if (!event_id) {
    return { statusCode: 400, body: JSON.stringify({ errore: 'event_id mancante' }) };
  }
  if (!emailValida(email)) {
    return { statusCode: 400, body: JSON.stringify({ errore: 'email non valida' }) };
  }

  const PIXEL_ID = process.env.META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_TOKEN;
  if (!PIXEL_ID || !TOKEN) {
    console.error('meta-evento: META_PIXEL_ID o META_CAPI_TOKEN mancanti');
    return { statusCode: 500, body: JSON.stringify({ errore: 'configurazione mancante' }) };
  }

  const headers = event.headers || {};
  const ip = headers['x-nf-client-connection-ip'] || headers['client-ip'] || undefined;
  const userAgent = headers['user-agent'] || undefined;

  const adesso = Date.now();

  const user_data = { em: [emailCifrata(email)] };
  if (fbp) user_data.fbp = fbp;
  const fbc = costruisciFbc(fbclid, adesso);
  if (fbc) user_data.fbc = fbc;
  if (ip) user_data.client_ip_address = ip;
  if (userAgent) user_data.client_user_agent = userAgent;

  const payload = {
    data: [
      {
        event_name: 'CompleteRegistration',
        event_time: Math.floor(adesso / 1000),
        event_id: String(event_id),
        action_source: 'website',
        event_source_url: url || undefined,
        user_data,
        custom_data: { content_category: tipo || 'sconosciuto' }
      }
    ]
  };

  const endpoint = 'https://graph.facebook.com/' + API_VERSION + '/' + PIXEL_ID + '/events';

  try {
    const risposta = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, payload, { access_token: TOKEN }))
    });

    const testo = await risposta.text();

    if (!risposta.ok) {
      // Mai loggare l'email: si logga solo l'event_id e la risposta di Meta.
      console.error('meta-evento: Meta ha risposto', risposta.status, testo, 'event_id', event_id);
      return { statusCode: 502, body: JSON.stringify({ errore: 'Meta ha rifiutato l\'evento' }) };
    }

    console.log('meta-evento: inviato', event_id, tipo || '');
    return { statusCode: 200, body: JSON.stringify({ ok: true, event_id: String(event_id) }) };
  } catch (e) {
    console.error('meta-evento: invio fallito', e && e.message, 'event_id', event_id);
    return { statusCode: 502, body: JSON.stringify({ errore: 'invio fallito' }) };
  }
};

// Esportati solo per il banco di prova.
exports._prova = { emailCifrata, emailValida, costruisciFbc };
