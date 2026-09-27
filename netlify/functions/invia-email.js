const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  let nome, email, messaggio;
  try { ({ nome, email, messaggio } = JSON.parse(event.body || '{}')); }
  catch { return { statusCode: 400, body: 'JSON non valido' }; }
  /* 27 set 2026: il modulo contatti arriva nella TUA casella. Prima il testo
     finiva nell'email cosi' com'era: qualcuno poteva metterci link e pezzi
     di pagina finti. Adesso si disinnesca tutto. */
  const esc = v => String(v == null ? '' : v).slice(0, 5000)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  if (!email || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(String(email))) {
    return { statusCode: 400, body: 'Email non valida' };
  }
  const nomeTesto = String(nome || '').replace(/[\r\n<>]/g, ' ').slice(0, 80);
  nome = esc(nome); email = esc(email); messaggio = esc(messaggio).replace(/\n/g, '<br>');

  const data = JSON.stringify({
    from: 'TrovaImpresa <info@trovaimpresa.com>',
    to: ['info@trovaimpresa.com'],
    subject: '📩 Nuovo messaggio da ' + nomeTesto,
    html: `
      <div style="text-align:center;padding:16px 0 20px">
        <a href="https://trovaimpresa.com" style="text-decoration:none">
          <img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa"
               style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto">
        </a>
      </div>
      <h2>Nuovo messaggio dal sito</h2>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Messaggio:</strong><br>${messaggio}</p>
      <hr>
      <p>Rispondi direttamente a: <a href="mailto:${email}">${email}</a></p>
    `
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: 200, body: 'OK' });
        } else {
          resolve({ statusCode: 500, body: 'Errore Resend: ' + body });
        }
      });
    });
    req.on('error', (err) => resolve({ statusCode: 500, body: 'Errore: ' + err.message }));
    req.write(data);
    req.end();
  });
};
