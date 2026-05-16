exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email, nome_attivita, descrizione, created_at;
  try {
    ({ email, nome_attivita, descrizione, created_at } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!descrizione) {
    return { statusCode: 400, body: 'Parametro mancante: descrizione obbligatoria' };
  }

  const esc = s => (s == null ? '' : String(s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const nomeMostra = nome_attivita || 'Mittente sconosciuto';
  const dataFmt = (created_at ? new Date(created_at) : new Date())
    .toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">🆘 Nuova segnalazione</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:14px;line-height:1.6;margin-bottom:20px">
          Hai ricevuto una nuova segnalazione su <strong>TrovaImpresa</strong>.
        </p>
        <div style="background:#f5f5f5;border-radius:8px;padding:8px 20px;margin-bottom:24px">
          <h3 style="font-size:13px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Dettagli</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666;width:140px">Impresa</td>
              <td style="padding:10px 0;font-weight:700">${esc(nomeMostra)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666">Email</td>
              <td style="padding:10px 0">${esc(email) || '—'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666">Data</td>
              <td style="padding:10px 0">${dataFmt}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#666;vertical-align:top">Descrizione</td>
              <td style="padding:10px 0;white-space:pre-wrap">${esc(descrizione)}</td>
            </tr>
          </table>
        </div>
        <div style="text-align:center;margin-bottom:28px">
          <a href="https://trovaimpresa.com/admin.html"
             style="display:inline-block;background:#d97706;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700">
            Apri il pannello admin →
          </a>
        </div>
        <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
          Email automatica dal sistema di segnalazioni di TrovaImpresa.
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
        to: ['info@trovaimpresa.com'],
        reply_to: email,
        subject: `Nuova segnalazione da ${nomeMostra}`,
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
