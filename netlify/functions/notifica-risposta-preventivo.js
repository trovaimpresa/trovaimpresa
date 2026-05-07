exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email_cliente, nome_cliente, impresa_nome, risposta, prezzo_min, prezzo_max;
  try {
    ({ email_cliente, nome_cliente, impresa_nome, risposta, prezzo_min, prezzo_max } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!email_cliente || !nome_cliente || !impresa_nome || !risposta) {
    return { statusCode: 400, body: 'Parametri mancanti: email_cliente, nome_cliente, impresa_nome e risposta sono obbligatori' };
  }

  try {
    const prezzoBlock = (prezzo_min || prezzo_max) ? `
            <div style="background:#fff8e1;border-left:4px solid #f5a623;padding:14px 18px;border-radius:6px;margin-bottom:24px;font-size:14px">
              <strong style="color:#1a3a2a">💶 Range prezzi indicativo:</strong>
              <span style="font-weight:700;color:#c0392b;margin-left:8px">${prezzo_min ? '€' + Number(prezzo_min).toLocaleString('it-IT') : ''}${prezzo_min && prezzo_max ? ' – ' : ''}${prezzo_max ? '€' + Number(prezzo_max).toLocaleString('it-IT') : ''}</span>
            </div>` : '';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:linear-gradient(135deg,#1a4d2e,#2a7a4b);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">📋 Hai ricevuto un preventivo</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${nome_cliente}</strong>!</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
            <strong>${impresa_nome}</strong> ha risposto alla tua richiesta di preventivo su TrovaImpresa.
          </p>
          <div style="background:#e8f5ee;border-left:4px solid #2a7a4b;padding:18px 20px;border-radius:6px;margin-bottom:24px;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#1a3a2a">${risposta}</div>
          ${prezzoBlock}
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com"
               style="display:inline-block;background:#2a7a4b;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
              🌐 Vai a TrovaImpresa →
            </a>
          </div>
          <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
            Ricevi questa email perché hai inviato una richiesta di preventivo su TrovaImpresa.
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
          TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
        </p>
      </div>
    `;

    console.log('[DEBUG] RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'presente' : 'MANCANTE');
    const fromAddr = 'TrovaImpresa <info@trovaimpresa.com>';
    const toAddr = email_cliente;
    console.log('[DEBUG] Resend pre-fetch — from:', fromAddr, '| to:', toAddr);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [toAddr],
        subject: `Hai ricevuto un preventivo da ${impresa_nome} — TrovaImpresa`,
        html
      })
    });

    const respText = await res.text();
    console.log('[DEBUG] Resend post-fetch — status:', res.status, '| body:', respText);

    if (!res.ok) {
      return { statusCode: 500, body: 'Errore Resend: ' + respText };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('[DEBUG] Errore notifica-risposta-preventivo:', err.message);
    console.error('[DEBUG] Stack:', err.stack);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
