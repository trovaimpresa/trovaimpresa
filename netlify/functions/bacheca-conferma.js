// Il cliente ha cliccato il link nell'email: la richiesta va online.
// Restituisce lo slug (per aprire la pagina) e il codice per chiuderla in seguito.

const { createClient } = require('@supabase/supabase-js');
const { SITO, esc, cornice, bottone, inviaUna } = require('./_forum-email');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };

  let token = '';
  try { token = String(JSON.parse(event.body || '{}').t || '').trim(); } catch (e) {}
  if (!/^[a-f0-9-]{36}$/i.test(token)) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Link non valido.' }) };

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  try {
    const { data: r } = await sb.from('bacheca_richieste')
      .select('id, slug, stato, creato_il, token_gestione, email, titolo, nome_pubblico').eq('token_conferma', token).maybeSingle();
    if (!r) return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'scaduto', messaggio: 'Questo link non e valido.' }) };
    if (r.stato !== 'in_attesa') {
      // gia confermata: si rimanda alla pagina, senza errore
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, gia: true, slug: r.slug }) };
    }
    if (Date.now() - new Date(r.creato_il).getTime() > 14 * 864e5) {
      return { statusCode: 410, headers: corsHeaders, body: JSON.stringify({ error: 'scaduto', messaggio: 'Il link e scaduto. Puoi pubblicare di nuovo la richiesta.' }) };
    }
    const { error } = await sb.from('bacheca_richieste')
      .update({ stato: 'pubblicata', confermato_il: new Date().toISOString() }).eq('id', r.id);
    if (error) throw error;
    // email al cliente: il link per tornare, leggere le risposte e chiudere la richiesta
    try {
      if (process.env.RESEND_API_KEY && r.email) {
        const url = SITO + '/forum-richiesta?s=' + encodeURIComponent(r.slug) + '&g=' + r.token_gestione;
        await inviaUna(process.env.RESEND_API_KEY, r.email, 'La tua richiesta è online',
          cornice('La tua richiesta è online',
            '<p>Ciao' + (r.nome_pubblico ? ' ' + esc(r.nome_pubblico) : '') + ', la tua richiesta «' + esc(r.titolo) + '» è sul Forum Edilizia. Le imprese della tua zona potranno risponderti.</p>' +
            '<p>Conserva questo link: è il tuo, ti serve per leggere le risposte, scrivere e chiudere la richiesta quando hai risolto. Non condividerlo.</p>' +
            bottone(url, 'Apri la mia richiesta')));
      }
    } catch (e) { console.error('[bacheca-conferma] email', e); }
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, slug: r.slug, gestione: r.token_gestione }) };
  } catch (e) {
    console.error('[bacheca-conferma]', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Errore. Riprova fra poco.' }) };
  }
};
