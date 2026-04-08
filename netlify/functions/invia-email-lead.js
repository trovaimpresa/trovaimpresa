exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let nome, email, citta;
  try {
    ({ nome, email, citta } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!nome || !email) {
    return { statusCode: 400, body: 'Parametri mancanti: nome ed email sono obbligatori' };
  }

  const linkAttivazione = 'https://trovaimpresa.com/attiva-profilo.html?email=' + encodeURIComponent(email);

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#FF6B35,#b84a0a);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">🚀 TrovaImpresa</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;margin-bottom:16px">Ciao <strong>${nome}</strong>!</p>
        <p style="font-size:14px;line-height:1.6;margin-bottom:16px">
          Abbiamo pre-inserito gratuitamente il tuo profilo su <strong>TrovaImpresa</strong>,
          il portale dedicato alle imprese edili, artigiani e professionisti italiani.
        </p>
        <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
          Il tuo profilo è già visibile dai clienti${citta ? ' nella zona di <strong>' + citta + '</strong>' : ''}.
          Per gestirlo, aggiungere foto, ricevere preventivi e molto altro,
          completa la registrazione cliccando il bottone qui sotto — è gratis!
        </p>
        <div style="text-align:center;margin-bottom:28px">
          <a href="${linkAttivazione}"
             style="display:inline-block;background:#FF6B35;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
            ✅ Attiva il tuo profilo gratuito →
          </a>
        </div>
        <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
          Se il bottone non funziona, copia questo link nel browser:<br>
          <a href="${linkAttivazione}" style="color:#FF6B35;word-break:break-all">${linkAttivazione}</a>
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
        subject: '🏗️ Ti abbiamo trovato un posto su TrovaImpresa!',
        html
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { statusCode: 500, body: 'Errore Resend: ' + errBody };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
