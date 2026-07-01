// Email di benvenuto inviata alla registrazione (free) e al passaggio a Premium.
// Body atteso: { nome, email, tipo, premium }
//  - tipo: impresa | professionista | artigiano | negozio | candidato
//  - premium: true  -> email "grazie per essere passato a Premium"
//             false/assente -> email di benvenuto registrazione

const PANNELLI = {
  impresa: 'pannello-impresa.html',
  professionista: 'pannello-professionisti.html',
  artigiano: 'pannello-artigiano.html',
  negozio: 'pannello-negozio.html',
  candidato: 'pannello-candidato.html'
};

const ETICHETTE = {
  impresa: 'la tua impresa',
  professionista: 'il tuo profilo professionale',
  artigiano: 'la tua attività artigiana',
  negozio: 'il tuo negozio',
  candidato: 'il tuo profilo'
};

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let nome, email, tipo, premium;
  try {
    ({ nome, email, tipo, premium } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!email) {
    return { statusCode: 400, body: 'Parametro mancante: email obbligatoria' };
  }

  const saluto = nome ? 'Ciao <strong>' + nome + '</strong>!' : 'Ciao!';
  const pannello = PANNELLI[tipo] || 'index.html';
  const linkPannello = 'https://trovaimpresa.com/' + pannello;
  const etichetta = ETICHETTE[tipo] || 'il tuo profilo';

  let subject, corpo, ctaTesto;

  if (premium) {
    subject = '⭐ Benvenuto in TrovaImpresa Premium!';
    ctaTesto = 'Vai al tuo pannello →';
    corpo = `
      <p style="font-size:16px;margin-bottom:16px">${saluto}</p>
      <p style="font-size:14px;line-height:1.6;margin-bottom:16px">
        Grazie per essere passato a <strong>TrovaImpresa Premium</strong>! 🎉
      </p>
      <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
        Da ora ${etichetta} ha accesso a tutte le funzionalità Premium: maggiore visibilità,
        priorità nei risultati di ricerca e strumenti avanzati per ricevere più richieste dai clienti.
      </p>`;
  } else {
    subject = '🎉 Benvenuto su TrovaImpresa!';
    ctaTesto = 'Vai al tuo pannello →';
    corpo = `
      <p style="font-size:16px;margin-bottom:16px">${saluto}</p>
      <p style="font-size:14px;line-height:1.6;margin-bottom:16px">
        La registrazione su <strong>TrovaImpresa</strong> è andata a buon fine: ${etichetta} è ora online!
      </p>
      <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
        Accedi al tuo pannello per completare il profilo, aggiungere foto e iniziare a ricevere
        richieste e preventivi dai clienti della tua zona.
      </p>`;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#FF6B35,#b84a0a);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">🏗️ TrovaImpresa</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        ${corpo}
        <div style="text-align:center;margin-bottom:28px">
          <a href="${linkPannello}"
             style="display:inline-block;background:#FF6B35;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
            ${ctaTesto}
          </a>
        </div>
        <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
          Se il bottone non funziona, copia questo link nel browser:<br>
          <a href="${linkPannello}" style="color:#FF6B35;word-break:break-all">${linkPannello}</a>
        </p>
      </div>
      <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
        TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
      </p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: [email],
        subject,
        html
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { statusCode: 500, body: 'Errore Resend: ' + errBody };
    }

    // Notifica admin: avvisa info@trovaimpresa.com di ogni nuova iscrizione/upgrade.
    // Isolata: se fallisce non blocca la risposta OK né la mail all'utente.
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: ['info@trovaimpresa.com'],
          subject: (premium ? '⭐ Passaggio a Premium: ' : '🔔 Nuova iscrizione: ')
                   + (nome || 'senza nome') + ' (' + (tipo || 'n/d') + ')',
          html: '<h2>' + (premium ? 'Passaggio a Premium' : 'Nuova iscrizione') + ' su TrovaImpresa</h2>'
                + '<p><strong>Nome:</strong> ' + (nome || '—') + '</p>'
                + '<p><strong>Email:</strong> ' + email + '</p>'
                + '<p><strong>Tipo:</strong> ' + (tipo || '—') + '</p>'
                + (premium ? '<p><strong>Premium:</strong> sì</p>' : '')
        })
      });
    } catch (e) {
      // notifica admin fallita: ignorata di proposito
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
