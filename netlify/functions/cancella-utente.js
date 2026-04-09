exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  // Log env var presence (never log the actual key value)
  console.log('[cancella-utente] SUPABASE_URL presente:', !!SUPABASE_URL);
  console.log('[cancella-utente] SUPABASE_SERVICE_KEY presente:', !!SERVICE_KEY);

  if (!SUPABASE_URL) {
    console.error('[cancella-utente] ERRORE: env var SUPABASE_URL mancante');
    return { statusCode: 500, body: JSON.stringify({ error: 'Variabile SUPABASE_URL non configurata su Netlify.' }) };
  }
  if (!SERVICE_KEY) {
    console.error('[cancella-utente] ERRORE: env var SUPABASE_SERVICE_KEY mancante');
    return { statusCode: 500, body: JSON.stringify({ error: 'Variabile SUPABASE_SERVICE_KEY non configurata su Netlify.' }) };
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
    if (!userRes.ok) {
      const body = await userRes.text();
      console.error('[cancella-utente] Verifica token fallita:', userRes.status, body);
      throw new Error('Token non valido o scaduto. Riprova.');
    }
    const user = await userRes.json();
    const userId = user.id;
    if (!userId) throw new Error('Impossibile identificare l\'utente.');
    console.log('[cancella-utente] Utente identificato, user_id:', userId);

    // 2. Delete row from imprese table (all categories use this table)
    const delImprese = await fetch(`${SUPABASE_URL}/rest/v1/imprese?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    console.log('[cancella-utente] DELETE imprese status:', delImprese.status);

    // 3. Delete files from storage bucket foto-lavori/{userId}/
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/foto-lavori`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: `${userId}/`, limit: 1000 })
    });
    if (listRes.ok) {
      const files = await listRes.json();
      const paths = (files || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => `${userId}/${f.name}`);
      if (paths.length > 0) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/foto-lavori`, {
          method: 'DELETE',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prefixes: paths })
        });
        console.log('[cancella-utente] File storage eliminati:', paths.length);
      }
    } else {
      console.warn('[cancella-utente] Impossibile listare storage (non bloccante):', listRes.status);
    }

    // 4. Delete user from Supabase Auth
    const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    if (!deleteRes.ok) {
      const errBody = await deleteRes.text();
      console.error('[cancella-utente] DELETE auth user fallito:', deleteRes.status, errBody);
      throw new Error('Errore eliminazione account Auth: ' + errBody);
    }
    console.log('[cancella-utente] Utente eliminato con successo');

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[cancella-utente] Eccezione:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
