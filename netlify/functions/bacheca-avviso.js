// Un'impresa ha risposto: si avvisa il cliente (una volta sola per risposta).
// Chiamata da forum.js subito dopo l'inserimento: POST {risposta_id}.
const { createClient } = require('@supabase/supabase-js');
const { SITO, esc, cornice, bottone, inviaUna } = require('./_forum-email');

const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
const ok = (o) => ({ statusCode: 200, headers: H, body: JSON.stringify(o) });

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: H, body: '{}' };
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) return ok({ ok: false });

  let id = '';
  try { id = String(JSON.parse(event.body || '{}').risposta_id || ''); } catch (e) {}
  if (!/^[a-f0-9-]{36}$/i.test(id)) return ok({ ok: false });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  try {
    const { data: r } = await sb.from('bacheca_risposte')
      .select('id, richiesta_id, impresa_nome, testo, autore, avvisata, stato, creato_il').eq('id', id).maybeSingle();
    // solo risposte di imprese, mai avvisate, create negli ultimi 10 minuti
    if (!r || r.autore || r.avvisata || r.stato !== 'visibile') return ok({ ok: true, saltata: true });
    if (Date.now() - new Date(r.creato_il).getTime() > 10 * 60e3) return ok({ ok: true, saltata: true });

    // "prenotazione" atomica: se due chiamate arrivano insieme, parte una sola email
    const { data: preso } = await sb.from('bacheca_risposte').update({ avvisata: true }).eq('id', id).eq('avvisata', false).select('id');
    if (!preso || !preso.length) return ok({ ok: true, saltata: true });

    const { data: q } = await sb.from('bacheca_richieste')
      .select('slug, titolo, email, token_gestione, nome_pubblico, stato').eq('id', r.richiesta_id).maybeSingle();
    if (!q || !q.email || q.stato === 'nascosta') return ok({ ok: true });

    const url = SITO + '/forum-richiesta?s=' + encodeURIComponent(q.slug) + '&g=' + q.token_gestione;
    const anteprima = String(r.testo).slice(0, 240) + (r.testo.length > 240 ? '…' : '');
    await inviaUna(RESEND_API_KEY, q.email, 'Hai una risposta alla tua richiesta',
      cornice('Hai una nuova risposta',
        '<p><b>' + esc(r.impresa_nome || 'Un\'impresa') + '</b> ha risposto alla tua richiesta «' + esc(q.titolo) + '»:</p>' +
        '<p style="background:#f4f8ff;border-left:4px solid #0066ff;padding:10px 14px;border-radius:6px">' + esc(anteprima) + '</p>' +
        bottone(url, 'Leggi e rispondi')));
    return ok({ ok: true });
  } catch (e) {
    console.error('[bacheca-avviso]', e);
    return ok({ ok: false });
  }
};
