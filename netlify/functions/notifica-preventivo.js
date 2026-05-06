exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let impresa_id, nome, cognome, email_cliente, telefono, tipo_lavoro, descrizione;
  try {
    ({ impresa_id, nome, cognome, email_cliente, telefono, tipo_lavoro, descrizione } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!impresa_id || !nome || !email_cliente) {
    return { statusCode: 400, body: 'Parametri mancanti: impresa_id, nome e email_cliente sono obbligatori' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) {
    return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  }

  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };

  try {
    const impresaRes = await fetch(`${SUPABASE_URL}/rest/v1/imprese?id=eq.${impresa_id}&select=nome,nome_attivita,email`, { headers: sbHeaders });
    const imprese = await impresaRes.json();
    const impresa = imprese[0];

    if (!impresa || !impresa.email) {
      return { statusCode: 404, body: 'Email impresa non trovata' };
    }

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:linear-gradient(135deg,#1a4d2e,#2a7a4b);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">📋 Nuova richiesta di preventivo</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${impresa.nome_attivita || impresa.nome}</strong>!</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
            Hai ricevuto una nuova richiesta di preventivo su TrovaImpresa.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666;width:140px">Cliente</td>
              <td style="padding:10px 0;font-weight:700">${nome}${cognome ? ' ' + cognome : ''}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666">Email</td>
              <td style="padding:10px 0"><a href="mailto:${email_cliente}" style="color:#2a7a4b">${email_cliente}</a></td>
            </tr>
            ${telefono ? `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666">Telefono</td>
              <td style="padding:10px 0"><a href="tel:${telefono}" style="color:#2a7a4b">${telefono}</a></td>
            </tr>` : ''}
            ${tipo_lavoro ? `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666">Tipo lavoro</td>
              <td style="padding:10px 0">${tipo_lavoro}</td>
            </tr>` : ''}
            ${descrizione ? `
            <tr>
              <td style="padding:10px 0;color:#666;vertical-align:top">Descrizione</td>
              <td style="padding:10px 0;white-space:pre-wrap">${descrizione}</td>
            </tr>` : ''}
          </table>
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com/pannello-artigiano.html"
               style="display:inline-block;background:#2a7a4b;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
              📋 Apri pannello artigiano →
            </a>
          </div>
          <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
            Ricevi questa email perché sei registrato come impresa su TrovaImpresa.
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
          TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: [impresa.email],
        subject: 'Nuova richiesta di preventivo — TrovaImpresa',
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
