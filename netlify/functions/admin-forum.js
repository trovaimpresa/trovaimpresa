// Moderazione del Forum Edilizia (solo admin, stessa password di tutte le altre funzioni admin).
// Body: { u, p, action: 'list' | 'nascondi' | 'mostra' | 'elimina', tipo: 'r'|'c', id }
const { createClient } = require('@supabase/supabase-js');

const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
const out = (code, o) => ({ statusCode: code, headers: H, body: JSON.stringify(o) });

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return out(405, { error: 'Method Not Allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_USER, ADMIN_PASS } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_USER || !ADMIN_PASS) return out(500, { error: 'Configurazione server mancante.' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return out(400, { error: 'Body JSON non valido.' }); }

  if (await require('./lib/admin-freno')(event, b.u === ADMIN_USER && b.p === ADMIN_PASS)) return out(429, { error: 'Troppi tentativi: riprova fra 15 minuti.' });
  if (b.u !== ADMIN_USER || b.p !== ADMIN_PASS) return out(401, { error: 'Credenziali admin non valide.' });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  try {
    if (b.action === 'list') {
      const { data: rich, error: e1 } = await sb.from('bacheca_richieste')
        .select('id, slug, titolo, testo, mestiere, citta, nome_pubblico, email, stato, n_risposte, n_segnalazioni, creato_il').order('creato_il', { ascending: false }).limit(300);
      if (e1) throw e1;
      const { data: ris, error: e2 } = await sb.from('bacheca_risposte')
        .select('id, richiesta_id, impresa_id, impresa_nome, testo, stato, autore, ospite, n_segnalazioni, creato_il').order('creato_il', { ascending: false }).limit(500);
      if (e2) throw e2;
      const titoli = {}; (rich || []).forEach(r => { titoli[r.id] = r.titolo; });
      (ris || []).forEach(r => { r.richiesta_titolo = titoli[r.richiesta_id] || ''; });
      return out(200, { success: true, richieste: rich || [], risposte: ris || [] });
    }

    // Domanda della redazione: esce subito, senza conferma email (solo admin)
    if (b.action === 'crea') {
      const titolo = String(b.titolo || '').trim(), testo = String(b.testo || '').trim();
      const mestiere = String(b.mestiere || '').trim().slice(0, 40), citta = String(b.citta || '').trim().slice(0, 60);
      if (titolo.length < 8 || titolo.length > 120) return out(400, { error: 'Il titolo deve avere da 8 a 120 caratteri.' });
      if (testo.length < 20 || testo.length > 3000) return out(400, { error: 'Il testo deve avere da 20 a 3000 caratteri.' });
      const base = (titolo + ' ' + citta).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
      const slug = base + '-' + Math.random().toString(16).slice(2, 6);
      const { error } = await sb.from('bacheca_richieste').insert({
        slug, titolo, testo, mestiere: mestiere || null, citta: citta || null,
        nome_pubblico: 'Redazione TrovaImpresa', email: 'redazione@trovaimpresa.com',
        stato: 'pubblicata', confermato_il: new Date().toISOString()
      });
      if (error) throw error;
      return out(200, { success: true, slug });
    }

    const id = String(b.id || '');
    if (!/^[a-f0-9-]{36}$/i.test(id) || (b.tipo !== 'r' && b.tipo !== 'c')) return out(400, { error: 'Richiesta non valida.' });
    if (['nascondi', 'mostra', 'elimina'].indexOf(b.action) === -1) return out(400, { error: 'Azione sconosciuta.' });

    if (b.tipo === 'r') {
      if (b.action === 'elimina') {
        await sb.from('bacheca_risposte').delete().eq('richiesta_id', id);
        await sb.from('bacheca_voti').delete().eq('tipo', 'r').eq('target', id);
        await sb.from('bacheca_segnalazioni').delete().eq('tipo', 'r').eq('target', id);
        const { error } = await sb.from('bacheca_richieste').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('bacheca_richieste').update({ stato: b.action === 'nascondi' ? 'nascosta' : 'pubblicata' }).eq('id', id);
        if (error) throw error;
      }
    } else {
      const { data: r } = await sb.from('bacheca_risposte').select('richiesta_id').eq('id', id).maybeSingle();
      if (b.action === 'elimina') {
        await sb.from('bacheca_voti').delete().eq('tipo', 'c').eq('target', id);
        await sb.from('bacheca_segnalazioni').delete().eq('tipo', 'c').eq('target', id);
        const { error } = await sb.from('bacheca_risposte').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('bacheca_risposte').update({ stato: b.action === 'nascondi' ? 'nascosta' : 'visibile' }).eq('id', id);
        if (error) throw error;
      }
      // ricalcolo: quante risposte di imprese restano visibili. Senza, la richiesta non va piu' su Google.
      if (r && r.richiesta_id) {
        const { data: vis } = await sb.from('bacheca_risposte').select('id, autore, ospite').eq('richiesta_id', r.richiesta_id).eq('stato', 'visibile');
        const imprese = (vis || []).filter(x => !x.autore && !x.ospite).length;
        await sb.from('bacheca_richieste').update({ n_risposte: (vis || []).length, indicizzabile: imprese > 0 }).eq('id', r.richiesta_id);
      }
    }
    return out(200, { success: true });
  } catch (err) {
    console.error('[admin-forum]', err);
    return out(500, { error: err.message || 'Errore' });
  }
};
