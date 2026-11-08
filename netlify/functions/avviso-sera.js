// =====================================================================
// 3 novembre 2026 — LA DOMANDA DELLA SERA: accendere, spegnere, provare
// GET            -> { chiave } la chiave pubblica per iscrivere il telefono
// POST (gettone) -> { azione: 'iscrivi', sub, ora } | { azione: 'ora', ora }
//                   { azione: 'spegni', endpoint } | { azione: 'prova', endpoint }
//                   { azione: 'stato', endpoint }
// ⛔ Chi e' lo dice il gettone, non il messaggio. La prova suona solo sui
//    telefoni di chi chiama, una volta al minuto.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const { chiavi, manda } = require('./lib/push-chiavi');

const cors = { 'Access-Control-Allow-Origin': 'https://trovaimpresa.com', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' };
const ok = b => ({ statusCode: 200, headers: cors, body: JSON.stringify(b) });
const no = (c, e) => ({ statusCode: c, headers: cors, body: JSON.stringify({ error: e }) });
const ORA = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const ultimaProva = {};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return no(500, 'Configurazione server mancante.');
  const sb = createClient(URL, KEY);
  try {
    if (event.httpMethod === 'GET') { const k = await chiavi(sb); return ok({ chiave: k.pubblica }); }
    if (event.httpMethod !== 'POST') return no(405, 'Metodo non ammesso.');
    const gettone = String(event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
    const { data: u, error: eu } = gettone ? await sb.auth.getUser(gettone) : { error: 1 };
    if (eu || !u || !u.user) return no(401, 'Accedi di nuovo.');
    const uid = u.user.id;
    let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}

    if (b.azione === 'iscrivi') {
      const s = b.sub || {}, k = s.keys || {};
      if (!/^https:\/\//.test(s.endpoint || '') || !k.p256dh || !k.auth) return no(400, 'Iscrizione non valida.');
      const ora = ORA.test(b.ora || '') ? b.ora : '18:30';
      // lo stesso telefono passa a chi lo usa adesso
      /* 8 nov 2026: chi si iscrive puo' dire subito cosa vuole (sera, mattina,
         richieste). Se non lo dice, resta come prima: solo la sera. */
      const riga = { user_id: uid, endpoint: s.endpoint, p256dh: k.p256dh, auth: k.auth, ora, attivo: true };
      for (const c of ['sera', 'mattina', 'richieste']) if (typeof b[c] === 'boolean') riga[c] = b[c];
      const r = await sb.from('gest_avvisi_sera').upsert(riga, { onConflict: 'endpoint' }).select('id');
      if (r.error) return no(500, 'Non salvato: ' + r.error.message);
      return ok({ ok: true, ora });
    }
    if (b.azione === 'ora') {
      if (!ORA.test(b.ora || '')) return no(400, 'Ora non valida.');
      await sb.from('gest_avvisi_sera').update({ ora: b.ora }).eq('user_id', uid);
      return ok({ ok: true });
    }
    if (b.azione === 'spegni') {
      /* 8 nov 2026: dalle Giornate si spegne SOLO la sera; se il telefono
         riceve anche gli altri avvisi, la riga resta. */
      if (b.solo === 'sera') {
        const r0 = await sb.from('gest_avvisi_sera').select('id,mattina,richieste').eq('user_id', uid).eq('endpoint', String(b.endpoint || '')).maybeSingle();
        if (!r0.error && r0.data && (r0.data.mattina || r0.data.richieste)) {
          await sb.from('gest_avvisi_sera').update({ sera: false }).eq('id', r0.data.id);
          return ok({ ok: true, resta: true });
        }
      }
      await sb.from('gest_avvisi_sera').delete().eq('user_id', uid).eq('endpoint', String(b.endpoint || ''));
      return ok({ ok: true });
    }
    if (b.azione === 'stato') {
      let r = await sb.from('gest_avvisi_sera').select('ora,sera,mattina,richieste').eq('user_id', uid).eq('endpoint', String(b.endpoint || '')).maybeSingle();
      if (r.error) r = await sb.from('gest_avvisi_sera').select('ora').eq('user_id', uid).eq('endpoint', String(b.endpoint || '')).maybeSingle();
      const d = r.data || null;
      return ok({ acceso: !!d, ora: d ? d.ora : null,
        sera: d ? d.sera !== false : false, mattina: !!(d && d.mattina), richieste: !!(d && d.richieste) });
    }
    /* 8 nov 2026 — cosa vuole ricevere QUESTO telefono */
    if (b.azione === 'scegli') {
      const v = {};
      for (const c of ['sera', 'mattina', 'richieste']) if (typeof b[c] === 'boolean') v[c] = b[c];
      if (!Object.keys(v).length) return no(400, 'Niente da cambiare.');
      const r = await sb.from('gest_avvisi_sera').update(v).eq('user_id', uid).eq('endpoint', String(b.endpoint || '')).select('id');
      if (r.error) return no(500, 'Non salvato: ' + r.error.message);
      if (!r.data || !r.data.length) return no(404, 'Su questo telefono le notifiche non sono accese.');
      return ok({ ok: true });
    }
    if (b.azione === 'prova') {
      if (Date.now() - (ultimaProva[uid] || 0) < 60000) return no(429, 'Aspetta un minuto e riprova.');
      ultimaProva[uid] = Date.now();
      const r = await sb.from('gest_avvisi_sera').select('id,endpoint,p256dh,auth').eq('user_id', uid).eq('endpoint', String(b.endpoint || '')).maybeSingle();
      if (!r.data) return no(404, 'Su questo telefono le notifiche non sono accese.');
      const msgProva = b.tipo === 'avvisi'
        ? { titolo: 'TrovaImpresa', testo: 'Prova riuscita: gli avvisi arriveranno così.', url: '/gestionale-app.html' }
        : { titolo: "Com'è andata oggi?", testo: 'Tocca e raccontalo a voce: ci penso io a segnarlo.', url: '/gestionale-app.html?sera=1#giornate' };
      try { await manda(sb, r.data, msgProva); }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { await sb.from('gest_avvisi_sera').delete().eq('id', r.data.id); return no(410, 'Il telefono non accetta più le notifiche: riaccendile.'); }
        throw e;
      }
      return ok({ ok: true });
    }
    return no(400, 'Azione sconosciuta.');
  } catch (e) {
    console.error('avviso-sera:', e);
    return no(500, 'Qualcosa non è andato. Riprova fra poco.');
  }
};
