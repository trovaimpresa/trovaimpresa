/* 28 nov 2026 — «TI PROPONIAMO ALTRE IMPRESE» (decisione di Alessio, punto 4)
   Ogni ora: le richieste (preventivi + incarichi) di piu' di 2 giorni a cui
   l'impresa non ha risposto ricevono UNA email con fino a 3 altre imprese della
   zona (citta', poi provincia). E' il cliente a scegliere a chi scrivere:
   ⛔ i suoi dati NON si girano in automatico a nessuno.
   - una volta sola per richiesta (alternative_inviate_at, preso prima di mandare)
   - solo richieste che hanno gia' avuto l'email «arrivata» (arrivata_inviata_at,
     nata il 28 nov 2026): quelle vecchie non ricevono un'email a settimane di distanza
   - solo fino a 7 giorni: dopo non ha piu' senso
   - massimo 20 email per giro (tetto di Resend gratuito: 100 al giorno in tutto)
   ⛔ Le due righe vanno insieme: l'import di `schedule` e `exports.handler = schedule(...)`. */
const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const giro = require('./lib/giro-richieste');

const PER_GIRO = 20;

async function handler() {
  const sb = createClient(process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co', process.env.SUPABASE_SERVICE_KEY);
  const prima = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const dopo = new Date(Date.now() - 7 * 864e5).toISOString();
  let mandate = 0;
  for (const tab of ['preventivi', 'incarichi_richieste']) {
    const { data: righe, error } = await sb.from(tab).select('*')
      .lt('created_at', prima).gte('created_at', dopo)
      .is('alternative_inviate_at', null).is('risposta_at', null).not('email', 'is', null).not('arrivata_inviata_at', 'is', null)
      .order('created_at', { ascending: true }).limit(PER_GIRO);
    if (error) { console.error('[richieste-2-giorni]', tab, error.message); continue; }
    for (const r of righe || []) {
      if (mandate >= PER_GIRO) break;
      const c = giro.campi(tab, r);
      if (!c.email) continue;
      /* ha risposto in chat (dalla sezione Messaggi)? allora niente */
      if (c.conv) {
        const { data: m } = await sb.from('chat_messaggi').select('id').eq('conversation_id', c.conv).eq('mittente', 'impresa').limit(1);
        if (m && m.length) { await sb.from(tab).update({ alternative_inviate_at: new Date().toISOString() }).eq('id', c.id); continue; }
      }
      const imp = await giro.impresaDi(sb, c.impresaId);
      if (imp && imp.is_test && !/^info@trovaimpresa\.com$/i.test(c.email)) continue;
      const { data: preso } = await sb.from(tab).update({ alternative_inviate_at: new Date().toISOString() })
        .eq('id', c.id).is('alternative_inviate_at', null).select('id');
      if (!preso || !preso.length) continue;
      const altre = await giro.alternative(sb, c, imp, 3);
      const nImp = giro.nomeImpresa(imp);
      const schede = altre.map(a => '<div style="border:1px solid #e6ebf1;border-radius:10px;padding:14px 16px;margin:10px 0">'
        + '<div style="font-weight:700;font-size:16px">' + giro.esc(a.nome) + '</div>'
        + '<div style="font-size:15px;color:#5b6574;margin:2px 0 10px">' + giro.esc(a.mestiere) + (a.citta ? ' · ' + giro.esc(a.citta) : '') + '</div>'
        + '<a href="' + a.link + '" style="display:inline-block;background:#0066ff;color:#fff;padding:10px 16px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none">Guarda e scrivi</a></div>').join('');
      const corpo = '<p>Ciao <b>' + giro.esc(giro.primoNome(c.nome)) + '</b>,</p><p>sono passati 2 giorni e <b>' + giro.esc(nImp)
        + '</b> non ti ha ancora risposto. La tua richiesta resta aperta: se ti risponde, ti avvisiamo.</p>'
        + (altre.length
          ? '<p>Intanto queste imprese lavorano vicino a te. <b>Scegli tu</b> a chi scrivere:</p>' + schede
            + '<p style="font-size:15px;color:#5b6574">Non abbiamo dato i tuoi dati a nessuna di loro.</p>'
          : '<p>Nella tua zona per ora non ci sono altre imprese iscritte. Puoi chiedere nel <b>Forum Edilizia</b>: rispondono le imprese di tutta Italia.</p>');
      const html = giro.emailPagina('Ti proponiamo altre imprese', corpo,
        altre.length ? 'Vedi la tua richiesta' : 'Chiedi nel Forum Edilizia',
        altre.length ? giro.linkRichiesta(c.token) : giro.SITO + '/forum', null, 'cliente');
      const ok = await giro.mandaEmail(c.email, String(nImp).replace(/[<>]/g, '') + ' non ti ha ancora risposto: ecco altre imprese vicino a te', html);
      if (ok) mandate++;
      else await sb.from(tab).update({ alternative_inviate_at: null }).eq('id', c.id);
    }
  }
  console.log('[richieste-2-giorni] email mandate:', mandate);
  return { statusCode: 200, body: JSON.stringify({ ok: true, mandate }) };
}

exports.handler = schedule('41 * * * *', handler);
exports._giro = handler; /* per le prove */
