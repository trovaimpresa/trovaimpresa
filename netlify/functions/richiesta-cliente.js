const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[richiesta-cliente] env Supabase mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  const taglia = v => (v == null ? '' : String(v)).trim().slice(0, 200);
  const nome = taglia(body.nome);
  const telefono = taglia(body.telefono);
  const categoria = taglia(body.categoria);
  const zona = taglia(body.zona);
  const ricerca = taglia(body.ricerca);

  if (!nome || !telefono) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nome e telefono sono obbligatori.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { error } = await supabaseAdmin
      .from('richieste_clienti')
      .insert({ nome, telefono, categoria, zona, ricerca });
    if (error) throw error;
  } catch (err) {
    console.error('[richiesta-cliente] errore insert:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }

  // Email di avviso: se fallisce, la richiesta resta comunque salvata.
  const esc = s => (s == null ? '' : String(s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dataFmt = new Date()
    .toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <div style="background:linear-gradient(135deg,#2a7a4b,#1a3a2a);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">📞 Nuova richiesta cliente</h1>
      </div>
      <div style="padding:32px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:14px;line-height:1.6;margin-bottom:20px">
          Un cliente ha lasciato una richiesta su <strong>TrovaImpresa</strong>.
        </p>
        <div style="background:#f5f5f5;border-radius:8px;padding:8px 20px;margin-bottom:24px">
          <h3 style="font-size:13px;font-weight:700;color:#2a7a4b;text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Dettagli</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666;width:140px">Nome</td>
              <td style="padding:10px 0;font-weight:700">${esc(nome)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666">Telefono</td>
              <td style="padding:10px 0">${esc(telefono)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666">Categoria</td>
              <td style="padding:10px 0">${esc(categoria) || '—'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666">Zona</td>
              <td style="padding:10px 0">${esc(zona) || '—'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e5e5">
              <td style="padding:10px 0;color:#666;vertical-align:top">Ricerca</td>
              <td style="padding:10px 0;white-space:pre-wrap">${esc(ricerca) || '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#666">Data</td>
              <td style="padding:10px 0">${dataFmt}</td>
            </tr>
          </table>
        </div>
        <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;margin:0">
          Email automatica dal sistema richieste clienti di TrovaImpresa.
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
        subject: 'Nuova richiesta cliente da TrovaImpresa',
        html
      })
    });
    if (!res.ok) {
      console.error('[richiesta-cliente] errore Resend:', await res.text());
    }
  } catch (err) {
    console.error('[richiesta-cliente] errore email:', err.message);
  }

  return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
};
