// =====================================================================
// LA CHAT CLIENTE-IMPRESA — L'EMAIL DI AVVISO (26 settembre 2026)
//
// Prima nessuno sapeva di avere un messaggio: l'impresa lo scopriva solo
// aprendo il pannello, il cliente solo tornando sulla scheda dallo stesso
// telefono. In tutto il sito c'era UN messaggio.
//
//   POST {conv}                         -> dalla scheda pubblica, dopo che il
//                                          CLIENTE ha scritto: avvisa l'impresa
//   POST {conv} + Authorization Bearer  -> dal pannello, dopo che l'IMPRESA
//                                          ha risposto: avvisa il cliente, con
//                                          il link per tornare nella chat
//
// ⛔ CHI SCRIVE A CHI LO DICE IL DATABASE, NON IL BROWSER. Dal browser arriva
//    solo il codice della conversazione. L'impresa, la sua email, l'email del
//    cliente e il verso si leggono dai messaggi veri. Si avvisa solo se
//    l'ULTIMO messaggio e' davvero appena arrivato (3 minuti) e viene dalla
//    parte giusta.
// ⛔ L'email del cliente si prende SOLO dai messaggi scritti dal cliente
//    (passano da `chat_invia`): cosi' un'impresa non puo' usare la chat per
//    mandare email a chi vuole lei.
// ⛔ UNA EMAIL OGNI 30 MINUTI per conversazione e per verso (tabella
//    `chat_avvisi`), e al massimo 20 avvisi al giorno a una stessa impresa:
//    dieci messaggi di fila fanno un avviso solo.
// ⚠️ Resend sul piano gratuito manda 100 email al giorno in tutto il sito.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');

const PANNELLI = {
  impresa: 'pannello-impresa.html',
  artigiano: 'pannello-artigiano.html',
  professionista: 'pannello-professionisti.html',
  negozio: 'pannello-negozio.html'
};
const CONV_OK = /^(\d{1,12})_[^\s]{10,300}$/;
const FRESCO_MS = 3 * 60 * 1000;
const PAUSA_MS = 30 * 60 * 1000;
const TETTO_IMPRESA_GIORNO = 20;

const risposta = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(corpo)
});

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pagina(titolo, corpo, bottone, link) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2f47">'
    + '<div style="text-align:center;padding:16px 0 20px"><a href="https://trovaimpresa.com" style="text-decoration:none">'
    + '<img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a></div>'
    + '<div style="background:#0066ff;padding:22px 24px;text-align:center;border-radius:12px 12px 0 0">'
    + '<h1 style="color:#fff;margin:0;font-size:22px">' + titolo + '</h1></div>'
    + '<div style="padding:26px 24px;background:#fff;border:1px solid #e6ebf1;border-top:none;border-radius:0 0 12px 12px;font-size:16px;line-height:1.6">'
    + corpo
    + '<p style="text-align:center;margin:26px 0 6px"><a href="' + link + '" style="display:inline-block;background:#ff8800;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:17px">' + bottone + '</a></p>'
    + '</div><p style="text-align:center;font-size:13px;color:#8a97a6;margin-top:12px">TrovaImpresa — <a href="https://trovaimpresa.com" style="color:#8a97a6">trovaimpresa.com</a></p></div>';
}

function riquadro(testo) {
  return '<div style="background:#f3f6fa;border-left:4px solid #0066ff;border-radius:8px;padding:14px 16px;margin:14px 0;white-space:pre-wrap">'
    + esc(String(testo || '').slice(0, 600)) + (String(testo || '').length > 600 ? '…' : '') + '</div>';
}

async function mandaEmail(a, oggetto, html) {
  if (!process.env.RESEND_API_KEY || !a) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html })
  });
  if (!r.ok) console.error('chat-avviso resend:', r.status, await r.text().catch(() => ''));
  return r.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Metodo non consentito' });
  let corpo;
  try { corpo = JSON.parse(event.body || '{}'); } catch (e) { return risposta(400, { error: 'Richiesta non valida' }); }
  const conv = String(corpo.conv || '');
  const m = conv.match(CONV_OK);
  if (!m) return risposta(400, { error: 'Conversazione non valida' });

  try {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: msgs, error } = await sb.from('chat_messaggi')
      .select('impresa_id, cliente_nome, cliente_email, testo, mittente, created_at')
      .eq('conversation_id', conv).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    if (!msgs || !msgs.length) return risposta(404, { error: 'Conversazione vuota' });
    const ultimo = msgs[0];
    if (String(ultimo.impresa_id) !== m[1]) return risposta(400, { error: 'Conversazione non valida' });
    if (Date.now() - new Date(ultimo.created_at).getTime() > FRESCO_MS) return risposta(200, { ok: true, avviso: 'vecchio' });

    // chi sta chiamando? con il gettone e' l'impresa, senza e' il cliente
    const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
    const gettone = auth.replace(/^Bearer\s+/i, '').trim();
    const verso = gettone ? 'cliente' : 'impresa';
    if (verso === 'impresa' && ultimo.mittente !== 'cliente') return risposta(200, { ok: true, avviso: 'niente' });
    if (verso === 'cliente' && ultimo.mittente !== 'impresa') return risposta(200, { ok: true, avviso: 'niente' });

    const { data: imp } = await sb.from('imprese')
      .select('id, user_id, nome, nome_attivita, email, tipo').eq('id', ultimo.impresa_id).maybeSingle();
    if (!imp) return risposta(404, { error: 'Impresa non trovata' });
    const nomeImpresa = imp.nome_attivita || imp.nome || 'l’impresa';

    if (verso === 'cliente') {
      const { data: u, error: eu } = await sb.auth.getUser(gettone);
      if (eu || !u || !u.user || u.user.id !== imp.user_id) return risposta(403, { error: 'Non autorizzato' });
    }

    // una email ogni 30 minuti per conversazione e per verso
    const { data: prima } = await sb.from('chat_avvisi').select('inviato_il')
      .eq('conversation_id', conv).eq('verso', verso).maybeSingle();
    if (prima && Date.now() - new Date(prima.inviato_il).getTime() < PAUSA_MS) return risposta(200, { ok: true, avviso: 'pausa' });

    if (verso === 'impresa') {
      const ieri = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await sb.from('chat_avvisi').select('conversation_id', { count: 'exact', head: true })
        .eq('verso', 'impresa').like('conversation_id', m[1] + '\\_%').gte('inviato_il', ieri);
      if ((count || 0) >= TETTO_IMPRESA_GIORNO) return risposta(200, { ok: true, avviso: 'tetto' });
    }

    let a, oggetto, html;
    if (verso === 'impresa') {
      a = imp.email;
      const chi = ultimo.cliente_nome || 'Un cliente';
      oggetto = '💬 ' + chi + ' ti ha scritto su TrovaImpresa';
      html = pagina('Hai un messaggio nuovo',
        '<p>Ciao <b>' + esc(nomeImpresa) + '</b>,</p><p><b>' + esc(chi) + '</b> ti ha scritto dalla tua scheda su TrovaImpresa:</p>'
        + riquadro(ultimo.testo)
        + '<p style="color:#5b6574;font-size:15px">Chi risponde presto di solito prende il lavoro. Rispondi dal tuo pannello, nella sezione Messaggi.</p>',
        'Apri il pannello e rispondi', 'https://trovaimpresa.com/' + (PANNELLI[imp.tipo] || 'pannello-impresa.html') + '#messaggi');
    } else {
      const dalCliente = msgs.find(x => x.mittente === 'cliente' && x.cliente_email);
      a = dalCliente && dalCliente.cliente_email;
      if (!a) return risposta(200, { ok: true, avviso: 'senza-email' });
      const link = 'https://trovaimpresa.com/profilo-impresa.html?id=' + encodeURIComponent(imp.id) + '&chat=' + encodeURIComponent(conv);
      oggetto = '💬 ' + nomeImpresa + ' ti ha risposto';
      html = pagina(esc(nomeImpresa) + ' ti ha risposto',
        '<p>Ciao' + (dalCliente.cliente_nome ? ' <b>' + esc(dalCliente.cliente_nome) + '</b>' : '') + ',</p>'
        + '<p><b>' + esc(nomeImpresa) + '</b> ha risposto al tuo messaggio su TrovaImpresa:</p>'
        + riquadro(ultimo.testo)
        + '<p style="color:#5b6574;font-size:15px">Tocca il pulsante per leggere tutta la conversazione e rispondere. Il link è solo tuo: non girarlo ad altri.</p>',
        'Leggi e rispondi', link);
    }

    const ok = await mandaEmail(a, oggetto, html);
    if (ok) {
      await sb.from('chat_avvisi').upsert({ conversation_id: conv, verso, inviato_il: new Date().toISOString() });
    }
    return risposta(200, { ok: true, avviso: ok ? 'mandato' : 'non-partito' });
  } catch (e) {
    console.error('chat-avviso:', e);
    return risposta(500, { error: 'Qualcosa non ha funzionato' });
  }
};
