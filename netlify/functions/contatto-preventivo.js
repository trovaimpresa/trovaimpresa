// Restituisce email/telefono del cliente SOLO se il contatto è stato
// sbloccato (pagato). È l'unica via per ottenere i contatti: la lettura
// diretta delle colonne email/telefono è revocata a livello di database.
//
// Chiamata dal pannello con: { preventivo_id }
// Header richiesto: Authorization: Bearer <access_token Supabase dell'impresa>

const { createClient } = require('@supabase/supabase-js');

// 🔧 MODELLO IBRIDO: i Premium hanno i contatti delle PROPRIE richieste
// inclusi nell'abbonamento (le richieste di zona restano a pagamento per tutti).
const PREMIUM_INCLUSO = true;

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

    const { data: prev } = await admin
      .from('preventivi')
      .select('id, impresa_id, sbloccato, email, telefono, nome')
      .eq('id', preventivo_id)
      .maybeSingle();
    if (!prev) return { statusCode: 404, body: 'Preventivo non trovato' };

    const isDiretta = String(prev.impresa_id) === String(impresa.id);

    // Sblocco registrato per questa impresa? (vale sia per dirette che di zona)
    const { data: mioSblocco } = await admin
      .from('lead_sblocchi')
      .select('id')
      .eq('preventivo_id', prev.id)
      .eq('impresa_id', impresa.id)
      .maybeSingle();

    const isPremium = ['premium','mensile','annuale'].includes((impresa.piano || '').toLowerCase());
    const autorizzato =
      !!mioSblocco ||
      (isDiretta && prev.sbloccato) ||
      (isDiretta && PREMIUM_INCLUSO && isPremium);

    if (!autorizzato) {
      return { statusCode: 402, body: JSON.stringify({ sbloccato: false }) };
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
