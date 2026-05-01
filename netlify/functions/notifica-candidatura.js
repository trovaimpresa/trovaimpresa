exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let offerta_id, candidato_id;
  try {
    ({ offerta_id, candidato_id } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!offerta_id || !candidato_id) {
    return { statusCode: 400, body: 'Parametri mancanti: offerta_id e candidato_id sono obbligatori' };
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
    const [offertaRes, candidatoRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/offerte_lavoro?id=eq.${offerta_id}&select=titolo,nome_azienda,impresa_id`, { headers: sbHeaders }),
      fetch(`${SUPABASE_URL}/rest/v1/candidati_lavoro?id=eq.${candidato_id}&select=nome,cognome,email,telefono,mestiere`, { headers: sbHeaders })
    ]);

    const [offerte, candidati] = await Promise.all([offertaRes.json(), candidatoRes.json()]);

    const offerta = offerte[0];
    const candidato = candidati[0];

    if (!offerta) return { statusCode: 404, body: 'Offerta non trovata' };
    if (!candidato) return { statusCode: 404, body: 'Candidato non trovato' };

    const impresaRes = await fetch(`${SUPABASE_URL}/rest/v1/imprese?id=eq.${offerta.impresa_id}&select=nome,nome_attivita,email`, { headers: sbHeaders });
    const imprese = await impresaRes.json();
    const impresa = imprese[0];

    if (!impresa || !impresa.email) {
      return { statusCode: 404, body: 'Email impresa non trovata' };
    }

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:linear-gradient(135deg,#1a4d2e,#2a7a4b);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">📝 Nuova candidatura ricevuta</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${offerta.nome_azienda}</strong>!</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
            Hai ricevuto una nuova candidatura per l'offerta <strong>${offerta.titolo}</strong> su TrovaImpresa.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666;width:140px">Candidato</td>
              <td style="padding:10px 0;font-weight:700">${candidato.nome} ${candidato.cognome}</td>
            </tr>
            ${candidato.mestiere ? `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666">Mestiere</td>
              <td style="padding:10px 0">${candidato.mestiere}</td>
            </tr>` : ''}
            ${candidato.email ? `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666">Email</td>
              <td style="padding:10px 0"><a href="mailto:${candidato.email}" style="color:#2a7a4b">${candidato.email}</a></td>
            </tr>` : ''}
            ${candidato.telefono ? `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;color:#666">Telefono</td>
              <td style="padding:10px 0"><a href="tel:${candidato.telefono}" style="color:#2a7a4b">${candidato.telefono}</a></td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#666">Offerta</td>
              <td style="padding:10px 0">${offerta.titolo}</td>
            </tr>
          </table>
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com/offerte-lavoro.html"
               style="display:inline-block;background:#2a7a4b;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
              👀 Gestisci le tue offerte →
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
        subject: `📝 Nuova candidatura per "${offerta.titolo}"`,
        html
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { statusCode: 500, body: 'Errore Resend: ' + errBody };
    }

    const html2 = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:linear-gradient(135deg,#1a4d2e,#2a7a4b);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">Candidatura inviata</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${candidato.nome}</strong>,</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
            Hai inviato candidatura per «<strong>${offerta.titolo}</strong>» pubblicata da <strong>${impresa.nome_attivita || impresa.nome}</strong>.
          </p>
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com/pannello-candidato.html"
               style="display:inline-block;background:#2a7a4b;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
              Vedi le tue candidature
            </a>
          </div>
          <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
            Ricevi questa email perché ti sei candidato a un'offerta su TrovaImpresa.
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#bbb;margin-top:12px">
          TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#bbb">trovaimpresa.com</a>
        </p>
      </div>
    `;

    const res2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: [candidato.email],
        subject: `Candidatura inviata per "${offerta.titolo}"`,
        html: html2
      })
    });

    if (!res2.ok) {
      const errBody2 = await res2.text();
      console.error('Errore email candidato Resend: ' + errBody2);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
