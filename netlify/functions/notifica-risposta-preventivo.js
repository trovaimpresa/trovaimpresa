exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  /* ⛔ 27 settembre 2026 — PORTA CHIUSA AGLI ESTRANEI.
     Prima questa funzione prendeva dal messaggio l'indirizzo del cliente, il
     nome dell'impresa e il testo, e spediva senza chiedere niente: chiunque
     poteva mandare a chiunque un'email firmata TrovaImpresa, con dentro
     quello che voleva (anche codice HTML). E' il modo piu' veloce per far
     finire trovaimpresa.com nella lista nera dello spam.
     Adesso dal messaggio si prende SOLO preventivo_id. Tutto il resto si legge
     dal database: parte solo se l'impresa ha davvero salvato una risposta
     nell'ultima ora (il pannello la salva un attimo prima di chiamare
     qui, e il database lascia scrivere la risposta solo all'impresa giusta). */
  let preventivo_id, email_cliente, nome_cliente, impresa_nome, risposta, prezzo_min, prezzo_max;
  try {
    ({ preventivo_id } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }
  if (!/^[0-9]{1,15}$/.test(String(preventivo_id || ''))) {
    return { statusCode: 400, body: 'Parametro mancante: preventivo_id' };
  }

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  {
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SUPABASE_KEY) return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
    const h = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/preventivi?id=eq.${preventivo_id}&select=email,nome,impresa_id,risposta,risposta_at,prezzo_min,prezzo_max`, { headers: h });
    const rows = await r.json();
    const prev = Array.isArray(rows) && rows[0];
    if (!prev) return { statusCode: 404, body: 'Preventivo non trovato' };
    const quando = prev.risposta_at ? new Date(prev.risposta_at).getTime() : 0;
    if (!prev.risposta || !quando || Date.now() - quando > 60 * 60 * 1000) {
      return { statusCode: 403, body: 'Nessuna risposta appena salvata per questo preventivo' };
    }
    const ri = await fetch(`${SUPABASE_URL}/rest/v1/imprese?id=eq.${Number(prev.impresa_id)}&select=nome,nome_attivita`, { headers: h });
    const imp = (await ri.json())[0] || {};
    email_cliente = prev.email;
    nome_cliente  = esc(prev.nome || 'cliente');
    impresa_nome  = esc(imp.nome_attivita || imp.nome || 'L\'impresa');
    risposta      = esc(prev.risposta);
    prezzo_min    = prev.prezzo_min;
    prezzo_max    = prev.prezzo_max;
  }

  if (!email_cliente) {
    return { statusCode: 400, body: 'Il cliente non ha lasciato un\'email' };
  }

  try {
    const prezzoBlock = (prezzo_min || prezzo_max) ? `
            <div style="background:#fff8e1;border-left:4px solid #f5a623;padding:14px 18px;border-radius:6px;margin-bottom:24px;font-size:14px">
              <strong style="color:#0a2a4d">💶 Range prezzi indicativo:</strong>
              <span style="font-weight:700;color:#c0392b;margin-left:8px">${prezzo_min ? '€' + Number(prezzo_min).toLocaleString('it-IT') : ''}${prezzo_min && prezzo_max ? ' – ' : ''}${prezzo_max ? '€' + Number(prezzo_max).toLocaleString('it-IT') : ''}</span>
            </div>` : '';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="text-align:center;padding:16px 0 20px">
          <a href="https://trovaimpresa.com" style="text-decoration:none">
            <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
                 style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
          </a>
        </div>
        <div style="background:linear-gradient(135deg,#0052cc,#0066ff);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">📋 Hai ricevuto un preventivo</h1>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px;margin-bottom:20px">Ciao <strong>${nome_cliente}</strong>!</p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:24px">
            <strong>${impresa_nome}</strong> ha risposto alla tua richiesta di preventivo su TrovaImpresa.
          </p>
          <div style="background:#e8f5ee;border-left:4px solid #0066ff;padding:18px 20px;border-radius:6px;margin-bottom:24px;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#0a2a4d">${risposta}</div>
          ${prezzoBlock}
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://trovaimpresa.com"
               style="display:inline-block;background:#0066ff;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">
              🌐 Vai a TrovaImpresa →
            </a>
          </div>
          <p style="font-size:13px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
            Ricevi questa email perché hai inviato una richiesta di preventivo su TrovaImpresa.
          </p>
        </div>
        <p style="text-align:center;font-size:13px;color:#bbb;margin-top:12px">
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
        subject: `Hai ricevuto un preventivo da ${impresa_nome.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;|&gt;/g,'')} — TrovaImpresa`,
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
