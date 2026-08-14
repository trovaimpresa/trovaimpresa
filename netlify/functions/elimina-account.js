// =====================================================================
// ELIMINA ACCOUNT — «Annulla iscrizione»
//
// 14 agosto 2026 — aggiunta la RIGA DI CONGEDO, e basta.
//
// Prima faceva una cosa sola: auth.admin.deleteUser(). E funziona: tutte
// le 49 tabelle agganciate all'account hanno la cascata (verificato sul
// database vero, confdeltype = 'c' su tutte, nessuna che blocca), quindi
// chi chiede di essere cancellato viene cancellato davvero, e la
// cancellazione non puo' fallire per colpa di un vincolo.
//
// Il problema era un altro: NON RESTAVA NIENTE. Nessun posto dove fosse
// scritto che quella persona c'era. Alla domanda «se n'e' andato
// qualcuno?» il pannello non poteva rispondere — non perche' non la
// mostrava, ma perche' il dato non esisteva. E contare gli iscritti non
// basta: un numero fermo puo' voler dire nessuno entrato e nessuno
// uscito, oppure tre entrati e tre usciti, che sono due mondi diversi.
//
// Adesso, PRIMA di cancellare, si scrive una riga in
// `public.iscrizioni_annullate`: chi era, che attivita', quanto e'
// durato, e — se ha voluto dirlo — perche'.
//
// ⚠️ LA REGOLA CHE NON SI TOCCA
// Se la scrittura della riga fallisce, LA CANCELLAZIONE SI FA LO STESSO.
// Il diritto di una persona a sparire viene prima di qualsiasi
// statistica. Non si fa mai fallire una cancellazione per non aver
// potuto prendere nota: sarebbe come non lasciar disdire un abbonamento
// perche' il registro e' pieno.
// =====================================================================
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
    console.error('[elimina-account] env vars mancanti');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  let access_token, motivo, motivo_libero;
  try {
    ({ access_token, motivo, motivo_libero } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!access_token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token mancante.' }) };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(access_token);
    if (userErr || !user) {
      console.error('[elimina-account] token non valido:', userErr?.message);
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token non valido o scaduto.' }) };
    }

    // ---------------------------------------------------------------
    // LA RIGA DI CONGEDO — si scrive PRIMA, se no non c'e' piu' nessuno
    // di cui scriverla. Tutto dentro un try suo: qualunque cosa vada
    // storta qui, sotto si cancella comunque.
    // ---------------------------------------------------------------
    try {
      const { data: imp } = await supabaseAdmin
        .from('imprese')
        .select('email,nome_attivita,tipo,citta,provincia,piano,created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const riga = {
        user_id:       user.id,
        // l'email dell'account e' quella vera: quella del profilo puo'
        // essere stata cambiata, o non esserci proprio
        email:         user.email || (imp && imp.email) || null,
        nome_attivita: (imp && imp.nome_attivita) || null,
        tipo:          (imp && imp.tipo) || null,
        citta:         (imp && imp.citta) || null,
        provincia:     (imp && imp.provincia) || null,
        piano:         (imp && imp.piano) || null,
        // quando si era iscritto: il profilo se c'e', se no la nascita
        // dell'account. Chi non ha mai completato il profilo e'
        // esattamente il caso che interessa di piu'.
        iscritto_il:   (imp && imp.created_at) || user.created_at || null,
        // il motivo e' facoltativo e arriva dalla pagina. Si accorcia:
        // una casella di testo libera puo' contenere qualsiasi cosa.
        motivo:        motivo ? String(motivo).slice(0, 60) : null,
        motivo_libero: motivo_libero ? String(motivo_libero).slice(0, 1000) : null
      };

      const { error: segnaErr } = await supabaseAdmin
        .from('iscrizioni_annullate')
        .insert(riga);

      if (segnaErr) {
        // si scrive nel log e si tira dritto: vedi la regola in cima
        console.error('[elimina-account] riga di congedo NON scritta:', segnaErr.message);
      } else {
        console.log('[elimina-account] congedo segnato:', user.id);
      }
    } catch (segnaEx) {
      console.error('[elimina-account] eccezione scrivendo il congedo:', segnaEx.message);
    }

    // ---------------------------------------------------------------
    // LA CANCELLAZIONE — questa deve riuscire, ed e' quella che conta
    // ---------------------------------------------------------------
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error('[elimina-account] deleteUser fallito:', delErr.message);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore eliminazione account: ' + delErr.message }) };
    }

    console.log('[elimina-account] utente eliminato:', user.id);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('[elimina-account] eccezione:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
