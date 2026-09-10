/* Richiesta del «Posto» — 10 settembre 2026.
   La pagina il-posto.html manda qui i dati di chi vuole il posto della sua
   categoria nella sua citta'. Qui non si vende e non si incassa niente:
   arriva solo una mail a info@trovaimpresa.com e poi si risponde a mano.
   Stessa forma di notifica-pubblicita.js: Resend, chiave in RESEND_API_KEY. */
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let attivita, categoria, citta, telefono, email, note;
  try {
    const d = JSON.parse(event.body);
    attivita  = String(d.attivita  || '').trim().slice(0, 120);
    categoria = String(d.categoria || '').trim().slice(0, 80);
    citta     = String(d.citta     || '').trim().slice(0, 80);
    telefono  = String(d.telefono  || '').trim().slice(0, 40);
    email     = String(d.email     || '').trim().slice(0, 120);
    note      = String(d.note      || '').trim().slice(0, 1000);
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!attivita || !email || !citta || !categoria) {
    return { statusCode: 400, body: 'Parametri mancanti: attivita, categoria, citta ed email sono obbligatori' };
  }

  var scappa = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const riga = function (etichetta, valore) {
    if (!valore) return '';
    return '<tr><td style="padding:8px 0;color:#888;font-size:14px;width:130px">' + etichetta +
           '</td><td style="padding:8px 0;color:#333;font-size:15px;font-weight:600">' + scappa(valore) + '</td></tr>';
  };

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="text-align:center;padding:16px 0 20px">
        <a href="https://trovaimpresa.com" style="text-decoration:none">
          <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
               style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
        </a>
      </div>
      <div style="background:linear-gradient(135deg,#c45e28,#e8733a);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">🏪 Qualcuno vuole Il Posto</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          ${riga('Attività', attivita)}
          ${riga('Categoria', categoria)}
          ${riga('Città', citta)}
          ${riga('Telefono', telefono)}
          ${riga('Email', email)}
          ${riga('Note', note)}
        </table>
        <div style="text-align:center;margin-top:28px">
          <a href="https://trovaimpresa.com/convenzioni.html?citta=${encodeURIComponent(citta)}"
             style="display:inline-block;background:#e8733a;color:white;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">
            Vedi le convenzioni di ${scappa(citta)} →
          </a>
        </div>
      </div>
      <p style="text-align:center;font-size:13px;color:#bbb;margin-top:12px">
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
        to: ['info@trovaimpresa.com'],
        reply_to: email,
        subject: 'Il Posto — ' + categoria + ' a ' + citta + ' — ' + attivita,
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
