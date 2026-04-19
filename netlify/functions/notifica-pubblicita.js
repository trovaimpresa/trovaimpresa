exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let impresa, email, telefono, formato, durata, citta, totale, annuncio_id;
  try {
    ({ impresa, email, telefono, formato, durata, citta, totale, annuncio_id } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!impresa || !email) {
    return { statusCode: 400, body: 'Parametri mancanti: impresa ed email sono obbligatori' };
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#1a4d2e,#2a7a4b);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">📢 Nuova richiesta pubblicità</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666;width:140px">Impresa</td>
            <td style="padding:10px 0;font-weight:700">${impresa}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666">Email</td>
            <td style="padding:10px 0"><a href="mailto:${email}" style="color:#2a7a4b">${email}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666">Telefono</td>
            <td style="padding:10px 0">${telefono || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666">Formato</td>
            <td style="padding:10px 0">${formato || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666">Durata</td>
            <td style="padding:10px 0">${durata || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666">Città</td>
            <td style="padding:10px 0">${citta || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#666">Totale</td>
            <td style="padding:10px 0;font-weight:700;color:#2a7a4b">€${totale || 0}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#666">ID annuncio</td>
            <td style="padding:10px 0;font-family:monospace;font-size:12px">${annuncio_id || '—'}</td>
          </tr>
        </table>
        <div style="text-align:center;margin-top:28px">
          <a href="https://trovaimpresa.com/admin.html"
             style="display:inline-block;background:#2a7a4b;color:white;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">
            🔧 Gestisci annuncio →
          </a>
        </div>
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
        subject: 'Nuova richiesta pubblicità - ' + impresa,
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
