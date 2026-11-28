/* 28 nov 2026 — IL GIRO DELLE RICHIESTE (cliente -> impresa -> cliente)
   Pezzi comuni a: notifica-preventivo (email «arrivata» al cliente),
   notifica-risposta-preventivo / -incarico (email «ti ha risposto»),
   richiesta-pagina (la pagina del cliente), richieste-2-giorni (altre imprese),
   chat-avviso (il link giusto quando la chat e' quella di una richiesta).

   Una richiesta sta in DUE tabelle diverse:
     preventivi           -> imprese e artigiani (impresa_id, descrizione, citta, tipo_lavoro)
     incarichi_richieste  -> professionisti      (professionista_id, note, comune, prestazione)
   `campi()` le rende uguali, cosi' il resto del codice non deve sapere quale.

   ⛔ La conversazione (risposta dell'impresa + messaggi del cliente) sta in
   chat_messaggi, con la stessa forma della chat della scheda: cosi' l'impresa la
   ritrova nella sua sezione Messaggi e le email in tutti e due i versi le manda
   gia' chat-avviso.js. Il codice conversazione e' in `chat_conv` della richiesta. */
const crypto = require('crypto');
const SITO = 'https://trovaimpresa.com';
const PANNELLI = {
  impresa: 'pannello-impresa.html', artigiano: 'pannello-artigiano.html',
  professionista: 'pannello-professionisti.html', negozio: 'pannello-negozio.html'
};
const TABELLE = ['preventivi', 'incarichi_richieste'];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function campi(tab, r) {
  if (!r) return null;
  const inc = tab === 'incarichi_richieste';
  return {
    tab, id: r.id,
    impresaId: inc ? r.professionista_id : r.impresa_id,
    nome: r.nome || '', email: (r.email || '').trim().toLowerCase(), telefono: r.telefono || '',
    lavoro: (inc ? r.prestazione : (r.tipo_lavoro || r.categoria_lavoro)) || '',
    dove: (inc ? r.comune : r.citta) || '',
    testo: (inc ? r.note : r.descrizione) || '',
    created_at: r.created_at, risposta: r.risposta || '', risposta_at: r.risposta_at,
    token: r.token_cliente, conv: r.chat_conv || null,
    arrivata: r.arrivata_inviata_at, alternative: r.alternative_inviate_at
  };
}

function nomeImpresa(imp) { return (imp && (imp.nome_attivita || imp.nome)) || 'l’impresa'; }
function primoNome(n) { return String(n || '').trim().split(/\s+/)[0] || 'il cliente'; }
function linkRichiesta(token) { return SITO + '/richiesta?t=' + encodeURIComponent(token); }
function linkPannello(imp, c) {
  return SITO + '/' + (PANNELLI[imp && imp.tipo] || 'pannello-artigiano.html')
    + '?richiesta=' + encodeURIComponent(c.id) + '#preventivi';
}

/* Stessa forma delle email della chat (chat-avviso.js): testata blu, pulsante arancione. */
function emailPagina(titolo, corpo, bottone, link, nota, per) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2f47">'
    + '<div style="text-align:center;padding:16px 0 20px"><a href="' + SITO + '" style="text-decoration:none">'
    + '<img src="' + SITO + '/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a></div>'
    + '<div style="background:#0066ff;padding:22px 24px;text-align:center;border-radius:12px 12px 0 0">'
    + '<h1 style="color:#fff;margin:0;font-size:22px">' + titolo + '</h1></div>'
    + '<div style="padding:26px 24px;background:#fff;border:1px solid #e6ebf1;border-top:none;border-radius:0 0 12px 12px;font-size:16px;line-height:1.6">'
    + corpo
    + (bottone ? '<p style="text-align:center;margin:26px 0 6px"><a href="' + link + '" style="display:inline-block;background:#ff8800;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:17px">' + bottone + '</a></p>' : '')
    + (nota ? '<p style="color:#5b6574;font-size:15px;margin:18px 0">' + nota + '</p>' : '')
    + require('./avviso-sicurezza')(per || 'cliente')
    + '</div><p style="text-align:center;font-size:13px;color:#8a97a6;margin-top:12px">TrovaImpresa — <a href="' + SITO + '" style="color:#8a97a6">trovaimpresa.com</a></p></div>';
}
function riquadro(t) {
  const s = String(t || '');
  return '<div style="background:#f3f6fa;border-left:4px solid #0066ff;border-radius:8px;padding:14px 16px;margin:14px 0;white-space:pre-wrap">'
    + esc(s.slice(0, 600)) + (s.length > 600 ? '…' : '') + '</div>';
}
function tabella(righe) {
  return '<table style="width:100%;border-collapse:collapse;font-size:15px;margin:10px 0">'
    + righe.filter(r => r[1]).map(([k, v]) => '<tr style="border-bottom:1px solid #eef2f7"><td style="padding:9px 0;color:#5b6574;width:130px;vertical-align:top">' + k
      + '</td><td style="padding:9px 0;font-weight:700;white-space:pre-wrap">' + esc(v) + '</td></tr>').join('') + '</table>';
}

async function mandaEmail(a, oggetto, html) {
  if (!process.env.RESEND_API_KEY || !a) return false;
  const r = await require('./resend-riserva')('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html })
  });
  if (!r.ok) console.error('[giro-richieste] resend:', r.status, await r.text().catch(() => ''));
  return r.ok;
}

/* Trova la richiesta dal codice del link. ⚠️ Il codice e' un uuid: se non lo e',
   non si chiede niente al database (niente errori di tipo nei log). */
async function daToken(sb, token) {
  if (!/^[0-9a-f-]{36}$/i.test(String(token || ''))) return null;
  for (const tab of TABELLE) {
    const { data } = await sb.from(tab).select('*').eq('token_cliente', token).maybeSingle();
    if (data) return campi(tab, data);
  }
  return null;
}

async function impresaDi(sb, id) {
  const { data } = await sb.from('imprese').select('id,user_id,nome,nome_attivita,email,tipo,citta,provincia,regione,mestiere,is_test').eq('id', id).maybeSingle();
  return data || null;
}

/* La conversazione della richiesta. Se non c'e' ancora la crea, con dentro come
   primo messaggio quello che il cliente ha scritto nel modulo: cosi' l'impresa
   in «Messaggi» vede tutta la storia. Serve l'email del cliente (e' lei che
   riceve le risposte): senza, niente conversazione. */
async function assicuraConv(sb, c) {
  if (c.conv) return c.conv;
  if (!c.email) return null;
  const conv = c.impresaId + '_' + c.email + '_' + crypto.randomUUID();
  const primo = [c.lavoro && ('Richiesta: ' + c.lavoro), c.dove && ('Dove: ' + c.dove), c.testo].filter(Boolean).join('\n') || 'Richiesta dalla tua scheda su TrovaImpresa';
  const { error: e1 } = await sb.from('chat_messaggi').insert({
    conversation_id: conv, impresa_id: c.impresaId, cliente_nome: String(c.nome).slice(0, 120),
    cliente_email: c.email, testo: primo.slice(0, 4000), mittente: 'cliente', letto: true, created_at: c.created_at || new Date().toISOString()
  });
  if (e1) { console.error('[giro-richieste] primo messaggio:', e1.message); return null; }
  /* ⚠️ solo se e' ancora vuota: due chiamate insieme non devono fare due conversazioni */
  const { data: ok } = await sb.from(c.tab).update({ chat_conv: conv }).eq('id', c.id).is('chat_conv', null).select('chat_conv');
  if (!ok || !ok.length) {
    await sb.from('chat_messaggi').delete().eq('conversation_id', conv);
    const { data: r } = await sb.from(c.tab).select('chat_conv').eq('id', c.id).maybeSingle();
    return (r && r.chat_conv) || null;
  }
  c.conv = conv;
  return conv;
}

/* La richiesta legata a una conversazione (per chat-avviso: link alla pagina della richiesta). */
async function daConv(sb, conv) {
  for (const tab of TABELLE) {
    const { data } = await sb.from(tab).select('*').eq('chat_conv', conv).maybeSingle();
    if (data) return campi(tab, data);
  }
  return null;
}

/* L'impresa ha risposto dal pannello (preventivi.risposta / incarichi_richieste.risposta).
   La risposta entra nella conversazione della richiesta e al cliente parte
   l'email «X ti ha risposto» con il link alla SUA pagina della richiesta.
   Parte solo se la risposta e' stata salvata nell'ultima ora (la scrive solo
   l'impresa giusta: lo decide il database). Restituisce {code, body}. */
async function avvisaRisposta(sb, tab, id) {
  const { data: r } = await sb.from(tab).select('*').eq('id', id).maybeSingle();
  if (!r) return { code: 404, body: 'Richiesta non trovata' };
  const quando = r.risposta_at ? new Date(r.risposta_at).getTime() : 0;
  if (!r.risposta || !quando || Date.now() - quando > 60 * 60 * 1000) return { code: 403, body: 'Nessuna risposta appena salvata' };
  const c = campi(tab, r);
  if (!c.email) return { code: 400, body: 'Il cliente non ha lasciato un\'email' };
  const imp = await impresaDi(sb, c.impresaId);
  const nImp = nomeImpresa(imp);
  /* all'italiana a mano: toLocaleString('it-IT') scrive «1500» senza punto */
  const eur = v => { const n = Math.round(Number(v) * 100) / 100, [i, d] = Math.abs(n).toFixed(2).split('.');
    return (n < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d !== '00' ? ',' + d : ''); };
  let testo = String(r.risposta).trim();
  if (tab === 'preventivi' && (r.prezzo_min || r.prezzo_max)) {
    testo += '\n\nPrezzo indicativo: ' + (r.prezzo_min && r.prezzo_max ? 'da ' + eur(r.prezzo_min) + ' € a ' + eur(r.prezzo_max) + ' €'
      : r.prezzo_min ? 'da ' + eur(r.prezzo_min) + ' €' : 'fino a ' + eur(r.prezzo_max) + ' €');
  }
  if (tab === 'incarichi_richieste' && r.onorario) testo += '\n\nOnorario indicativo: ' + r.onorario;

  const conv = await assicuraConv(sb, c);
  if (conv) {
    const { data: gia } = await sb.from('chat_messaggi').select('id').eq('conversation_id', conv)
      .eq('mittente', 'impresa').eq('testo', testo.slice(0, 4000)).limit(1);
    if (!gia || !gia.length) {
      const { error } = await sb.from('chat_messaggi').insert({ conversation_id: conv, impresa_id: c.impresaId,
        cliente_nome: String(c.nome).slice(0, 120), cliente_email: c.email, testo: testo.slice(0, 4000), mittente: 'impresa', letto: true });
      if (error) console.error('[giro-richieste] risposta in chat:', error.message);
    }
  }
  const html = emailPagina(esc(nImp) + ' ti ha risposto',
    '<p>Ciao <b>' + esc(primoNome(c.nome)) + '</b>,</p><p><b>' + esc(nImp) + '</b> ha risposto alla tua richiesta'
    + (c.lavoro ? ' «' + esc(c.lavoro) + '»' : '') + ':</p>' + riquadro(testo) + '<p>Tocca il pulsante per leggere tutto e rispondere.</p>',
    'Leggi e rispondi', linkRichiesta(c.token), 'Il link è solo tuo: non girarlo ad altri.', 'cliente');
  const ok = await mandaEmail(c.email, '💬 ' + String(nImp).replace(/[<>]/g, '') + ' ti ha risposto', html);
  /* la chat non rimanda la stessa email nei 30 minuti dopo */
  if (ok && conv) await sb.from('chat_avvisi').upsert({ conversation_id: conv, verso: 'cliente', inviato_il: new Date().toISOString() });
  return ok ? { code: 200, body: JSON.stringify({ ok: true }) } : { code: 500, body: 'Email non partita' };
}

/* Fino a 3 altre imprese vicine al cliente, per «ti proponiamo altre imprese».
   Prima la stessa citta' scritta dal cliente, poi la provincia dell'impresa che
   aveva scelto (il cliente l'ha scelta vicino a se'). Stesso tipo; per imprese e
   artigiani vanno bene tutti e due. Solo schede pubbliche (imprese_pubbliche:
   niente prove, email confermata, vetrina accesa). ⛔ Al cliente si mostrano le
   schede: i suoi dati NON vanno a nessuna di loro. */
async function alternative(sb, c, imp, quante) {
  quante = quante || 3;
  const tipi = (imp && imp.tipo === 'professionista') ? ['professionista'] : ['impresa', 'artigiano'];
  const sel = 'id,nome_attivita,nome,tipo,citta,provincia,mestiere';
  const prese = [], visti = new Set([Number(c.impresaId)]);
  const aggiungi = rows => (rows || []).forEach(x => { if (prese.length < quante && !visti.has(Number(x.id))) { visti.add(Number(x.id)); prese.push(x); } });
  const dove = String(c.dove || '').replace(/[,()%*]/g, ' ').trim();
  if (dove) {
    const { data } = await sb.from('imprese_pubbliche').select(sel).in('tipo', tipi).ilike('citta', dove).limit(10);
    aggiungi(data);
  }
  if (prese.length < quante && imp && imp.provincia) {
    const { data } = await sb.from('imprese_pubbliche').select(sel).in('tipo', tipi).ilike('provincia', String(imp.provincia).replace(/[,()%*]/g, ' ').trim()).limit(20);
    aggiungi(data);
  }
  return prese.map(x => ({ id: x.id, nome: x.nome_attivita || x.nome || 'Impresa', citta: x.citta || '', provincia: x.provincia || '',
    mestiere: x.mestiere || (x.tipo === 'artigiano' ? 'Artigiano' : x.tipo === 'professionista' ? 'Professionista' : 'Impresa'),
    link: SITO + '/profilo-impresa?id=' + x.id }));
}

module.exports = { avvisaRisposta, alternative, SITO, PANNELLI, esc, campi, nomeImpresa, primoNome, linkRichiesta, linkPannello,
  emailPagina, riquadro, tabella, mandaEmail, daToken, daConv, impresaDi, assicuraConv };
