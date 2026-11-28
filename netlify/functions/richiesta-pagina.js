/* 28 nov 2026 — LA PAGINA DELLA RICHIESTA DEL CLIENTE (richiesta.html?t=...)
   GET  ?t=<codice>         -> la richiesta, i messaggi, e (dopo 2 giorni senza
                               risposta) altre imprese della zona
   POST {t, testo}          -> il cliente scrive all'impresa; all'impresa parte
                               l'avviso della chat (chat-avviso.js), con le sue pause.
   ⛔ Il codice del link e' l'unica chiave: chi ce l'ha e' il cliente. Non si
   restituiscono MAI telefono ed email del cliente (li ha gia' lui) ne' quelli
   dell'impresa: si parla solo da qui. */
const { createClient } = require('@supabase/supabase-js');
const giro = require('./lib/giro-richieste');
const haLink = require('./lib/niente-link');

const H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
const out = (code, obj) => ({ statusCode: code, headers: H, body: JSON.stringify(obj) });
const DUE_GIORNI = 48 * 3600 * 1000;

exports.handler = async (event) => {
  if (!process.env.SUPABASE_SERVICE_KEY) return out(500, { error: 'Configurazione mancante' });
  const sb = createClient(process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co', process.env.SUPABASE_SERVICE_KEY);
  try {
    if (event.httpMethod === 'GET') {
      const c = await giro.daToken(sb, (event.queryStringParameters || {}).t);
      if (!c) return out(404, { error: 'Link non valido' });
      const imp = await giro.impresaDi(sb, c.impresaId);
      let messaggi = [];
      if (c.conv) {
        const { data } = await sb.from('chat_messaggi').select('mittente,testo,created_at')
          .eq('conversation_id', c.conv).order('created_at', { ascending: true }).limit(200);
        messaggi = (data || []);
        /* il primo messaggio e' la richiesta stessa (scritta da assicuraConv): non si ripete */
        if (messaggi.length && messaggi[0].mittente === 'cliente') messaggi = messaggi.slice(1);
      } else if (c.risposta) {
        messaggi = [{ mittente: 'impresa', testo: c.risposta, created_at: c.risposta_at }];
      }
      const risposto = !!c.risposta || messaggi.some(m => m.mittente === 'impresa');
      let altre = [];
      if (!risposto && (c.alternative || Date.now() - new Date(c.created_at).getTime() > DUE_GIORNI)) {
        altre = await giro.alternative(sb, c, imp, 3);
      }
      /* il cliente ha aperto la sua pagina: le risposte dell'impresa sono lette */
      if (c.conv) await sb.from('chat_messaggi').update({ letto: true }).eq('conversation_id', c.conv).eq('mittente', 'impresa').eq('letto', false);
      return out(200, {
        impresa: { id: c.impresaId, nome: giro.nomeImpresa(imp), tipo: imp && imp.tipo },
        richiesta: { lavoro: c.lavoro, dove: c.dove, testo: c.testo, quando: c.created_at, nome: giro.primoNome(c.nome) },
        puoScrivere: !!c.email,
        risposto, messaggi, altre
      });
    }

    if (event.httpMethod === 'POST') {
      let b; try { b = JSON.parse(event.body || '{}'); } catch { return out(400, { error: 'Dati non validi' }); }
      const testo = String(b.testo || '').trim();
      if (!testo) return out(400, { error: 'Scrivi il messaggio.' });
      if (testo.length > 3000) return out(400, { error: 'Il messaggio è troppo lungo.' });
      if (haLink(testo)) return out(400, { error: 'Niente link nei messaggi: scrivi a parole, senza indirizzi di siti internet.' });
      const c = await giro.daToken(sb, b.t);
      if (!c) return out(404, { error: 'Link non valido' });
      if (!c.email) return out(400, { error: 'Per scrivere da qui serve l’email nella richiesta.' });
      const { data: blocco } = await sb.from('chat_bloccati').select('impresa_id').eq('impresa_id', c.impresaId).ilike('cliente_email', c.email).limit(1);
      if (blocco && blocco.length) return out(403, { error: 'Questa impresa non riceve più messaggi da te.' });
      const conv = await giro.assicuraConv(sb, c);
      if (!conv) return out(500, { error: 'Non riesco ad aprire la conversazione. Riprova.' });
      /* freno: massimo 30 messaggi al giorno per richiesta */
      const ieri = new Date(Date.now() - 864e5).toISOString();
      const { count } = await sb.from('chat_messaggi').select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv).eq('mittente', 'cliente').gte('created_at', ieri);
      if ((count || 0) >= 30) return out(429, { error: 'Hai scritto molti messaggi oggi. Riprova domani.' });
      const { error } = await sb.from('chat_messaggi').insert({ conversation_id: conv, impresa_id: c.impresaId,
        cliente_nome: String(c.nome).slice(0, 120), cliente_email: c.email, testo, mittente: 'cliente' });
      if (error) {
        if (error.code === 'TI001') return out(400, { error: 'Niente link nei messaggi: scrivi a parole.' });
        throw error;
      }
      /* l'avviso all'impresa lo manda la chat, con le sue regole (pausa 30 min, tetto al giorno) */
      let avviso = 'no';
      try {
        const r = await require('./chat-avviso').handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ conv }) });
        avviso = (JSON.parse(r.body || '{}').avviso) || String(r.statusCode);
      } catch (e) { console.error('[richiesta-pagina] avviso:', e.message); }
      return out(200, { ok: true, avviso });
    }
    return out(405, { error: 'Metodo non consentito' });
  } catch (e) {
    console.error('[richiesta-pagina]', e);
    return out(500, { error: 'Qualcosa non ha funzionato. Riprova.' });
  }
};
