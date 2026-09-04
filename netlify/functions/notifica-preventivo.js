// Ogni tipo di iscritto ha il suo pannello: il pulsante dell'email deve
// portarlo dove sta davvero la richiesta.
const PANNELLI = {
  impresa: 'pannello-impresa.html',
  artigiano: 'pannello-artigiano.html',
  professionista: 'pannello-professionisti.html',
  negozio: 'pannello-negozio.html'
};

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let impresa_id, nome, email_cliente, telefono, descrizione, citta, categoria_lavoro, data_preferita, urgenza, budget, foto, allegati;
  try {
    ({ impresa_id, nome, email_cliente, telefono, descrizione, citta, categoria_lavoro, data_preferita, urgenza, budget, foto, allegati } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  // 6 agosto 2026: prima l'email del cliente era obbligatoria, e le richieste di
  // incarico ai professionisti (dove l'email e' facoltativa) non facevano partire
  // nessun avviso. Ora basta uno dei due recapiti: email OPPURE telefono.
  if (!impresa_id || !nome || (!email_cliente && !telefono)) {
    return { statusCode: 400, body: 'Parametri mancanti: servono impresa_id, nome e almeno un recapito (email o telefono)' };
  }

  // I contatti del cliente sono disponibili direttamente nel pannello
  // dell'impresa (nessun pay-per-lead).

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_KEY) {
    return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  }

  // 4 settembre 2026 — quanti file ha allegato il cliente.
  // Arriva come numero dal modulo; i file stanno nel bucket privato
  // "preventivi-allegati" e si aprono dal pannello, non dall'email.
  const nAllegati = Number.isFinite(Number(allegati)) ? Math.max(0, Math.trunc(Number(allegati))) : 0;

  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };

  try {
    // "tipo" serve a mandare ognuno al SUO pannello: prima il pulsante dell'email
    // portava tutti su pannello-artigiano, anche negozi e professionisti.
    const impresaRes = await fetch(`${SUPABASE_URL}/rest/v1/imprese?id=eq.${impresa_id}&select=nome,nome_attivita,email,tipo`, { headers: sbHeaders });
    const imprese = await impresaRes.json();
    const impresa = imprese[0];

    if (!impresa || !impresa.email) {
      return { statusCode: 404, body: 'Email impresa non trovata' };
    }

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:linear-gradient(135deg,#0052cc,#0066ff);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">📋 Nuova richiesta di preventivo</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${impresa.nome_attivita || impresa.nome}</strong>!</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:20px">
            Hai ricevuto una nuova richiesta di preventivo su TrovaImpresa.
          </p>
          <div style="background:#f5f5f5;border-radius:8px;padding:8px 20px;margin-bottom:24px">
            <h3 style="font-size:13px;font-weight:700;color:#0066ff;text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Richiesta del cliente</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr style="border-bottom:1px solid #e5e5e5">
                <td style="padding:10px 0;color:#666;width:140px">Nome</td>
                <td style="padding:10px 0;font-weight:700">${nome}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e5e5">
                <td style="padding:10px 0;color:#666">Categoria</td>
                <td style="padding:10px 0">${categoria_lavoro || '—'}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e5e5">
                <td style="padding:10px 0;color:#666">Città</td>
                <td style="padding:10px 0">${citta || '—'}</td>
              </tr>
              ${descrizione ? `
              <tr style="border-bottom:1px solid #e5e5e5">
                <td style="padding:10px 0;color:#666;vertical-align:top">Descrizione</td>
                <td style="padding:10px 0;white-space:pre-wrap">${descrizione}</td>
              </tr>` : ''}
              ${data_preferita ? `
              <tr style="border-bottom:1px solid #e5e5e5">
                <td style="padding:10px 0;color:#666">Data preferita</td>
                <td style="padding:10px 0">${data_preferita}</td>
              </tr>` : ''}
              ${urgenza ? `
              <tr style="border-bottom:1px solid #e5e5e5">
                <td style="padding:10px 0;color:#666">Urgenza</td>
                <td style="padding:10px 0;font-weight:700">${urgenza}</td>
              </tr>` : ''}
              ${budget ? `
              <tr>
                <td style="padding:10px 0;color:#666">Budget indicativo</td>
                <td style="padding:10px 0">${budget}</td>
              </tr>` : ''}
            </table>
          </div>
          ${foto ? `
          <div style="text-align:center;margin-bottom:24px">
            <a href="${foto}" target="_blank" style="text-decoration:none">
              <img src="${foto}" alt="Foto del lavoro" style="max-width:100%;border-radius:8px;border:1px solid #e5e5e5">
              <div style="font-size:13px;color:#0066ff;font-weight:700;margin-top:8px">📷 Apri la foto allegata</div>
            </a>
          </div>` : ''}
          ${nAllegati ? `
          <div style="background:#fff8ec;border:1px solid #f0d9b0;border-radius:8px;padding:16px 20px;margin-bottom:14px;text-align:center">
            <p style="font-size:15px;margin:0 0 4px;font-weight:700">\uD83D\uDCCE ${nAllegati === 1 ? 'Il cliente ha allegato 1 file' : `Il cliente ha allegato ${nAllegati} file`}</p>
            <p style="font-size:14px;color:#666;margin:0">Foto, PDF o disegni: li apri dalla richiesta, dentro il tuo pannello.</p>
          </div>` : ''}
          <div style="background:#f0f7ff;border:1px solid #cfe0f5;border-radius:8px;padding:16px 20px;margin-bottom:14px;text-align:center">
            <p style="font-size:14px;margin:0 0 4px;font-weight:700">📇 Contatti del cliente disponibili nel tuo pannello</p>
            <p style="font-size:13px;color:#666;margin:0">Apri la richiesta dal pannello per vedere telefono ed email e rispondere subito.</p>
          </div>
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com/${PANNELLI[impresa.tipo] || 'pannello-artigiano.html'}"
               style="display:inline-block;background:#0066ff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700">
              📂 Apri il pannello e rispondi →
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

    console.log('[DEBUG] RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'presente' : 'MANCANTE');
    const fromAddr = 'TrovaImpresa <info@trovaimpresa.com>';
    const toAddr = impresa.email;
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
        subject: `🔔 Richiesta sopralluogo da ${nome} – ${categoria_lavoro || ''}`,
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
    console.error('[DEBUG] Errore notifica-preventivo:', err.message);
    console.error('[DEBUG] Stack:', err.stack);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
