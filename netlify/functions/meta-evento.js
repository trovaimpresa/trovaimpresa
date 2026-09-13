// Manda a Meta gli eventi DAL SERVER (API Conversions):
//   CompleteRegistration (iscritto) e ViewContent (ha aperto il modulo).
//
// Perche': il pixel nel browser parte solo dopo che il visitatore accetta i
// cookie, quindi Meta contava meno della meta' delle iscrizioni vere.
// Questa function parte sempre, dal server, subito dopo la registrazione.
//
// Il pixel nel browser e questa chiamata usano lo STESSO event_id:
// Meta li unisce e conta una sola iscrizione (deduplica).
//
// Chiamata dalle 4 pagine registrazione con:
//   { evento?, event_id, email?, tipo, fbp, fbclid, fbclid_t, url }
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
//
// ⚠️ 13 set 2026 — quei millisecondi sono l'ora del CLIC, non quella
// dell'iscrizione. Prima ci mettevamo sempre "adesso": per Meta il clic
// risultava avvenuto nel momento stesso della registrazione, e
// l'abbinamento con l'inserzione vera veniva peggio. Ora la pagina manda
// anche `fbclid_t`, l'ora in cui il codice e' arrivato davvero (messa da
// parte da js/conta-visita.js). Se non c'e', si ripiega su adesso.
function costruisciFbc(fbclid, adesso, quandoClic) {
  if (!fbclid) return undefined;
  var t = Number(quandoClic);
  var valido = isFinite(t) && t > 1000000000000 && t <= adesso;
  return 'fb.1.' + (valido ? Math.floor(t) : adesso) + '.' + fbclid;
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

  const { event_id, email, tipo, fbp, fbclid, fbclid_t, url, evento } = dati;

  if (!event_id) {
    return { statusCode: 400, body: JSON.stringify({ errore: 'event_id mancante' }) };
  }

  // 13 set 2026 — due eventi, non uno solo:
  //   CompleteRegistration = si e' iscritto davvero (vuole l'email)
  //   ViewContent          = ha APERTO il modulo di iscrizione (l'email non
  //                          ce l'abbiamo ancora: si riconosce con fbp/fbc/IP)
  // La lista e' CHIUSA apposta: il nome arriva dal browser, e senza lista
  // chiunque potrebbe far scrivere a Meta eventi inventati col nostro pixel.
  const AMMESSI = ['CompleteRegistration', 'ViewContent'];
  const nomeEvento = AMMESSI.indexOf(evento) >= 0 ? evento : 'CompleteRegistration';

  const vuoleEmail = nomeEvento === 'CompleteRegistration';
  if (vuoleEmail && !emailValida(email)) {
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

  const user_data = {};
  if (vuoleEmail) user_data.em = [emailCifrata(email)];
  if (fbp) user_data.fbp = fbp;
  const fbc = costruisciFbc(fbclid, adesso, fbclid_t);
  if (fbc) user_data.fbc = fbc;
  if (ip) user_data.client_ip_address = ip;
  if (userAgent) user_data.client_user_agent = userAgent;

  const payload = {
    data: [
      {
        event_name: nomeEvento,
        event_time: Math.floor(adesso / 1000),
        event_id: String(event_id),
        action_source: 'website',
        event_source_url: url || undefined,
        user_data,
        custom_data: { content_category: tipo || 'sconosciuto' }
      }
    ]
  };

  // Meta rifiuta un evento che non ha NESSUN modo di riconoscere la persona.
  // Sul ViewContent l'email non c'e': se mancano anche fbp, fbc, IP e browser
  // non si manda niente, invece di farsi rispondere un errore.
  if (!Object.keys(user_data).length) {
    console.error('meta-evento: nessun dato utente, evento non inviato', nomeEvento, event_id);
    return { statusCode: 200, body: JSON.stringify({ ok: false, motivo: 'nessun dato utente' }) };
  }

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

    console.log('meta-evento: inviato', nomeEvento, event_id, tipo || '');
    return { statusCode: 200, body: JSON.stringify({ ok: true, event_id: String(event_id) }) };
  } catch (e) {
    console.error('meta-evento: invio fallito', e && e.message, 'event_id', event_id);
    return { statusCode: 502, body: JSON.stringify({ errore: 'invio fallito' }) };
  }
};

// Esportati solo per il banco di prova.
exports._prova = { emailCifrata, emailValida, costruisciFbc };
