const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Tabelle che questa funzione e' autorizzata a gestire.
//
// "imprese" e' stata aggiunta a luglio 2026: il pannello admin scriveva con la
// chiave anon, ma su "imprese" c'e' RLS con scrittura riservata al proprietario
// (user_id = auth.uid()). PostgREST non restituisce errore quando RLS blocca
// una UPDATE: aggiorna zero righe e basta. Risultato: i pulsanti Verifica /
// Premium / Gestionale sembravano funzionare e non scrivevano nulla.
// Con service_role qui la scrittura avviene davvero.
//
// Agosto 2026 — bacheca lavoro: aggiunte offerte_lavoro, candidati_lavoro e
// candidature, cosi' il pannello admin puo' vedere e moderare tutta la
// bacheca (offerte pubblicate, persone iscritte, chi si e' candidato a cosa).
const TABELLE_CONSENTITE = [
  'feedback_clienti', 'segnalazioni', 'subappalti',
  'imprese', 'preventivi', 'lead_imprese', 'gest_richieste',
  'offerte_lavoro', 'candidati_lavoro', 'candidature'
];
const AZIONI_CONSENTITE = ['list', 'update', 'delete', 'insert'];

// Colonna usata per ordinare la lista (dalla piu' recente alla piu' vecchia).
// Non tutte le tabelle hanno "created_at": "candidature" usa data_candidatura.
// Se la colonna non esiste PostgREST da' errore, quindi va indicata qui.
const COLONNA_ORDINE = {
  candidature: 'data_candidatura'
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
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[admin-dati] env Supabase mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }
  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('[admin-dati] env ADMIN_USER/ADMIN_PASS mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let u, p, action, table, id, patch;
  try {
    ({ u, p, action, table, id, patch } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  // 1) Password admin verificata SEMPRE lato server (mai fidarsi del client).
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Credenziali admin non valide.' }) };
  }

  // 2) Whitelist tabella e azione.
  if (!TABELLE_CONSENTITE.includes(table)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Tabella non consentita.' }) };
  }
  if (!AZIONI_CONSENTITE.includes(action)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Azione non consentita.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 3) Solo con password valida si tocca il database, con service_role.
    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .order(COLONNA_ORDINE[table] || 'created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data }) };
    }

    if (action === 'update') {
      if (id === undefined || id === null) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id mancante.' }) };
      }
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'patch mancante o non valido.' }) };
      }
      // .select('id') fa tornare le righe toccate: cosi' il pannello sa
      // distinguere "aggiornato" da "nessuna riga con quell'id".
      const { data, error } = await supabaseAdmin
        .from(table).update(patch).eq('id', id).select('id');
      if (error) throw error;
      return {
        statusCode: 200, headers: corsHeaders,
        body: JSON.stringify({ success: true, count: (data || []).length })
      };
    }

    if (action === 'delete') {
      if (id === undefined || id === null) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id mancante.' }) };
      }
      const { data, error } = await supabaseAdmin
        .from(table).delete().eq('id', id).select('id');
      if (error) throw error;
      return {
        statusCode: 200, headers: corsHeaders,
        body: JSON.stringify({ success: true, count: (data || []).length })
      };
    }

    if (action === 'insert') {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'patch mancante o non valido.' }) };
      }
      const { data, error } = await supabaseAdmin.from(table).insert(patch).select('id');
      if (error) throw error;
      return {
        statusCode: 200, headers: corsHeaders,
        body: JSON.stringify({ success: true, count: (data || []).length })
      };
    }

    // Non dovrebbe accadere (azione gia' validata sopra).
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Richiesta non valida.' }) };

  } catch (err) {
    console.error('[admin-dati] errore:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
