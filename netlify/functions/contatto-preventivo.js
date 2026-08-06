// Restituisce email/telefono del cliente all'impresa a cui la richiesta
// è indirizzata (gratis, nessun pay-per-lead). La lettura diretta delle
// colonne email/telefono resta revocata a livello di database, quindi
// i contatti passano sempre da qui.
//
// Chiamata dal pannello con: { preventivo_id }
// Header richiesto: Authorization: Bearer <access_token Supabase dell'impresa>

const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let preventivo_id;
  try {
    ({ preventivo_id } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }
  if (!preventivo_id) return { statusCode: 400, body: 'preventivo_id mancante' };

  const token = (event.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, body: 'Non autenticato' };

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return { statusCode: 401, body: 'Sessione non valida' };

    const { data: impresa } = await admin
      .from('imprese')
      .select('id, piano')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (!impresa) return { statusCode: 403, body: 'Impresa non trovata' };

    // NOTA (6 agosto 2026): qui c'era anche la colonna "sbloccato", residuo del
    // vecchio pay-per-lead. E' stata tolta dal database, quindi la query falliva
    // e il pannello mostrava "Errore nel caricamento" al posto dei contatti.
    const { data: prev, error: prevErr } = await admin
      .from('preventivi')
      .select('id, impresa_id, email, telefono, nome')
      .eq('id', preventivo_id)
      .maybeSingle();
    if (prevErr) {
      console.error('[contatto-preventivo] lettura fallita:', prevErr.message);
      return { statusCode: 500, body: 'Errore lettura richiesta: ' + prevErr.message };
    }
    if (!prev) return { statusCode: 404, body: 'Preventivo non trovato' };

    const isDiretta = String(prev.impresa_id) === String(impresa.id);

    // Nessun pay-per-lead: l'impresa vede gratuitamente i contatti
    // delle richieste indirizzate a lei.
    if (!isDiretta) {
      return { statusCode: 403, body: 'Questa richiesta non è indirizzata alla tua impresa' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        sbloccato: true,
        nome: prev.nome || '',
        email: prev.email || '',
        telefono: prev.telefono || '',
      }),
    };
  } catch (err) {
    console.error('[contatto-preventivo]', err.message);
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
