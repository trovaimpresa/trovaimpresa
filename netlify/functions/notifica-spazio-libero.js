exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let record, old_record;
  try {
    ({ record, old_record } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!record) {
    return { statusCode: 400, body: 'Payload senza record' };
  }

  const statoOld = old_record ? old_record.stato : null;

  // Notifica solo alla transizione verso 'offerto'
  if (record.stato !== 'offerto' || statoOld === 'offerto') {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  if (!record.email) {
    return { statusCode: 400, body: 'record.email mancante' };
  }

  // Data scadenza in formato gg/mm/aaaa (it-IT)
  let scadenza = '';
  if (record.offerta_scadenza) {
    const [g, m, a] = String(record.offerta_scadenza).split('/');
    const d = new Date(`${a}-${m}-${g}`);
    scadenza = isNaN(d) ? String(record.offerta_scadenza) : d.toLocaleDateString('it-IT');
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#1a4d2e,#2a7a4b);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">📢 Si è liberato uno spazio pubblicitario!</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${record.nome_azienda || ''}</strong>!</p>
        <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
          Buone notizie: si è liberato uno spazio pubblicitario a <strong>${record.citta}</strong>,
          la città per cui eri in lista d'attesa.
        </p>
        <div style="background:#e8f5ee;border:1.5px solid #a7d9b8;border-radius:12px;padding:18px 20px;margin-bottom:24px;font-size:14px;line-height:1.6;color:#1f5e38">
          🔒 Lo spazio è <strong>riservato a te</strong>${scadenza ? ` fino al <strong>${scadenza}</strong>` : ''}.
          Prenotalo prima della scadenza, poi tornerà disponibile per le altre imprese in lista.
        </div>
        <div style="text-align:center;margin-bottom:28px">
          <a href="https://trovaimpresa.com/pannello-artigiano.html"
             style="display:inline-block;background:#2a7a4b;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
            🛒 Prenota ora il tuo spazio →
          </a>
        </div>
        <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
          Ricevi questa email perché eri in lista d'attesa per uno spazio pubblicitario su TrovaImpresa.
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
        to: [record.email],
        subject: `Si è liberato uno spazio pubblicitario a ${record.citta}`,
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
