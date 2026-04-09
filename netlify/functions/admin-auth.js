exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('[admin-auth] Variabili d\'ambiente ADMIN_USER o ADMIN_PASS mancanti');
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }

  let u, p;
  try {
    ({ u, p } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false }) };
  }

  const ok = u === ADMIN_USER && p === ADMIN_PASS;
  return { statusCode: 200, body: JSON.stringify({ ok }) };
};
