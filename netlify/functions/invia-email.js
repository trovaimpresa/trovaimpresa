const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { nome, email, messaggio } = JSON.parse(event.body);

  const data = JSON.stringify({
    from: 'TrovaImpresa <info@trovaimpresa.com>',
    to: ['info@trovaimpresa.com'],
    subject: '📩 Nuovo messaggio da ' + nome,
    html: `
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
