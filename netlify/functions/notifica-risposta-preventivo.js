/* 28 nov 2026 — IL GIRO DELLE RICHIESTE.
   L'impresa ha risposto dal pannello: la risposta entra nella conversazione
   della richiesta e al cliente parte «X ti ha risposto» con il link alla sua
   pagina (richiesta.html), dove legge e risponde. Tutto in lib/giro-richieste.js.
   ⛔ (27 set 2026) Dal messaggio si prende SOLO l'id: testo, email e nomi si
   leggono dal database, e parte solo se la risposta e' stata salvata nell'ultima ora. */
const { createClient } = require('@supabase/supabase-js');
const giro = require('./lib/giro-richieste');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let id;
  try { id = JSON.parse(event.body || '{}').preventivo_id; } catch { return { statusCode: 400, body: 'JSON non valido' }; }
  if (!/^[0-9]{1,15}$/.test(String(id || ''))) return { statusCode: 400, body: 'Parametro mancante: preventivo_id' };
  if (!process.env.SUPABASE_SERVICE_KEY) return { statusCode: 500, body: 'SUPABASE_SERVICE_KEY non configurata' };
  try {
    const sb = createClient(process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co', process.env.SUPABASE_SERVICE_KEY);
    const r = await giro.avvisaRisposta(sb, 'preventivi', id);
    return { statusCode: r.code, body: r.body };
  } catch (e) {
    console.error('[notifica-risposta-preventivo.js]', e.message);
    return { statusCode: 500, body: 'Errore: ' + e.message };
  }
};
