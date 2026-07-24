exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email_cliente, nome_cliente, professionista_nome, risposta, onorario, incarico_id;
  try {
    ({ email_cliente, nome_cliente, professionista_nome, risposta, onorario, incarico_id } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  // Se non arriva l'email del cliente, la recuperiamo dalla riga con la service key.
  if (!email_cliente && incarico_id) {
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SUPABASE_KEY) return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/incarichi_richieste?id=eq.${encodeURIComponent(incarico_id)}&select=email,nome`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const rows = await r.json();
    const row = rows && rows[0];
    if (!row) return { statusCode: 404, body: 'Incarico non trovato' };
    email_cliente = row.email;
    nome_cliente = nome_cliente || row.nome || 'cliente';
  }

  if (!email_cliente || !professionista_nome || !risposta) {
    return { statusCode: 400, body: 'Parametri mancanti: email_cliente, professionista_nome e risposta sono obbligatori' };
  }

  const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    const rispostaSafe = esc(risposta);
    const nomeSafe = esc(nome_cliente || 'cliente');
    const profSafe = esc(professionista_nome);

    const onorarioBlock = onorario ? `
            <div style="background:#fff8e1;border-left:4px solid #f5a623;padding:14px 18px;border-radius:6px;margin-bottom:24px;font-size:14px">
              <strong style="color:#0a2a4d">&#128181; Onorario indicativo:</strong>
              <span style="font-weight:700;color:#c0392b;margin-left:8px">${esc(onorario)}</span>
            </div>` : '';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:linear-gradient(135deg,#0052cc,#0066ff);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">&#128203; Risposta alla tua richiesta di incarico</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Gentile <strong>${nomeSafe}</strong>,</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
            <strong>${profSafe}</strong> ha risposto alla tua richiesta di incarico su TrovaImpresa.
          </p>
          <div style="background:#e8f5ee;border-left:4px solid #0066ff;padding:18px 20px;border-radius:6px;margin-bottom:24px;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#0a2a4d">${rispostaSafe}</div>
          ${onorarioBlock}
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com"
               style="display:inline-block;background:#0066ff;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
              &#127760; Vai a TrovaImpresa &rarr;
            </a>
          </div>
          <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
            Ricevi questa email perch&eacute; hai inviato una richiesta di incarico su TrovaImpresa.
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
          TrovaImpresa &mdash; <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
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
        to: [email_cliente],
        subject: `Risposta da ${professionista_nome} alla tua richiesta di incarico - TrovaImpresa`,
        html
      })
    });

    const respText = await res.text();
    if (!res.ok) {
      return { statusCode: 500, body: 'Errore Resend: ' + respText };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
