exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  try {
    const { accessToken } = JSON.parse(event.body || '{}');
    if (!accessToken) throw new Error('Token mancante.');

    // 1. Verify the access token and get user info
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!userRes.ok) throw new Error('Token non valido o scaduto. Riprova.');
    const user = await userRes.json();
    const userId = user.id;
    if (!userId) throw new Error('Impossibile identificare l\'utente.');

    // 2. Delete row from imprese table (all categories use this table)
    await fetch(`${SUPABASE_URL}/rest/v1/imprese?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });

    // 3. Delete user from Supabase Auth
    const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    if (!deleteRes.ok) {
      const errBody = await deleteRes.text();
      throw new Error('Errore eliminazione account: ' + errBody);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
