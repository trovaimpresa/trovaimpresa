// AVVISI CLIENTI — conferma e cancellazione (27 ottobre 2026)
// La chiama avvisi.html coi link delle email:
//   a=conferma  → l'avviso si accende
//   a=cancella  → si spengono TUTTI gli avvisi di quella email («ti cancelli con un clic»)

const { createClient } = require('@supabase/supabase-js');
const { cosaCerca } = require('./_avvisi-email');

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const risposta = (code, obj) => ({ statusCode: code, headers: H, body: JSON.stringify(obj) });

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Method Not Allowed' });
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return risposta(500, { error: 'Configurazione server mancante.' });

  let t = '', a = '';
  try { const b = JSON.parse(event.body || '{}'); t = String(b.t || '').trim(); a = String(b.a || '').trim(); } catch (e) {}
  if (!/^[a-f0-9-]{36}$/i.test(t) || !['conferma', 'cancella'].includes(a)) return risposta(400, { error: 'Link non valido.' });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  try {
    const { data: r } = await sb.from('avvisi_clienti').select('id, email, citta, tipo, mestiere, confermato_il, attivo')
      .eq('token', t).maybeSingle();
    if (!r) return risposta(404, { error: 'Questo link non è valido.' });

    if (a === 'conferma') {
      if (!r.confermato_il || !r.attivo) {
        const { data, error } = await sb.from('avvisi_clienti')
          .update({ confermato_il: r.confermato_il || new Date().toISOString(), attivo: true })
          .eq('id', r.id).select('id');
        if (error) throw error;
        if (!data || !data.length) throw new Error('nessuna riga aggiornata');
      }
      return risposta(200, { ok: true, cosa: cosaCerca(r), tipo: r.tipo, citta: r.citta });
    }

    const { data, error } = await sb.from('avvisi_clienti').update({ attivo: false })
      .eq('email', String(r.email).toLowerCase()).select('id');
    if (error) throw error;
    return risposta(200, { ok: true, spenti: (data || []).length });
  } catch (e) {
    console.error('[avvisi-gestione]', e);
    return risposta(500, { error: 'Errore. Riprova fra poco.' });
  }
};
