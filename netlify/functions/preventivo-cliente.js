// =====================================================================
// INVIA AL CLIENTE — la porta del cliente per il preventivo (1 nov 2026)
//
// Il cliente dell'impresa apre trovaimpresa.com/preventivo-cliente?t=<link>
// dal telefono, SENZA account. Questa funzione e' l'unica cosa che parla
// col database per lui. Stampo: netlify/functions/scelte-cliente.js.
//
//   GET  ?t=...                       -> la fotografia del preventivo
//   POST {t, nome, firma, accetto}    -> la firma del cliente
//
// ⛔ CHI SEI LO DICE SOLO IL LINK. Il browser non manda mai l'id del
//    preventivo ne' dell'impresa: si ricavano dal token.
// ⛔ NIENTE CONTI QUI DENTRO. «dati» e' la fotografia scattata dal
//    gestionale con le stesse funzioni del PDF: qui si legge e basta.
// ⛔ LE FOTO DEI CAPITOLATI si firmano SOLO se stanno nella cartella
//    dell'impresa del link (path che comincia con il suo user_id). Senza
//    questo controllo, un'impresa potrebbe scrivere nella fotografia il
//    percorso del file di un'altra e farselo aprire col service role.
// ⛔ DOPO LA FIRMA E' FERMO. Una seconda firma risponde 409: se va
//    cambiato qualcosa, l'impresa manda una versione nuova dal gestionale
//    (e la firma vecchia si toglie).
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

const TOKEN_OK = /^[A-Za-z0-9_-]{20,64}$/;
const FIRMA_OK = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const FIRMA_MAX = 250000;   // caratteri della firma disegnata (il database ne accetta 300.000)

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex'
  },
  body: JSON.stringify(corpo)
});

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function mandaEmail(a, oggetto, html) {
  if (!process.env.RESEND_API_KEY || !a) return Promise.resolve(false);
  const data = JSON.stringify({ from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a], subject: oggetto, html });
  return new Promise((ok) => {
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => { res.resume(); res.on('end', () => ok(res.statusCode < 300)); });
    req.on('error', () => ok(false));
    req.setTimeout(6000, () => { req.destroy(); ok(false); });
    req.write(data); req.end();
  });
}

async function leggi(sb, token) {
  const { data: link } = await sb.from('gest_preventivi_link')
    .select('preventivo_id, user_id, dati, aperto_il, aperture, firmato_il, firma_nome, firma_img')
    .eq('token', token).maybeSingle();
  if (!link) return null;
  const { data: p } = await sb.from('gest_preventivi')
    .select('id, eliminato_il').eq('id', link.preventivo_id).eq('user_id', link.user_id).maybeSingle();
  if (!p || p.eliminato_il) return null;   // buttato nel cestino: il link si spegne
  return link;
}

/* le foto dei capitolati: link firmati che durano due ore */
async function firmaFoto(sb, dati, userId) {
  const caps = Array.isArray(dati.capitolati) ? dati.capitolati : [];
  const paths = [];
  caps.forEach(c => (Array.isArray(c.allegati) ? c.allegati : []).forEach(a => {
    const p = a && String(a.path || '');
    if (p && p.indexOf(userId + '/') === 0 && p.indexOf('..') < 0) paths.push(p);
  }));
  const firmati = {};
  if (paths.length) {
    const { data } = await sb.storage.from('gestionale-foto').createSignedUrls(paths, 7200);
    (data || []).forEach(d => { if (d && d.path && d.signedUrl) firmati[d.path] = d.signedUrl; });
  }
  return caps.map(c => Object.assign({}, c, {
    allegati: (Array.isArray(c.allegati) ? c.allegati : [])
      .map(a => ({ nome: String((a && a.nome) || ''), url: (a && firmati[String(a.path || '')]) || null }))
      .filter(a => a.url)
  }));
}

exports.handler = async (event) => {
  try {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // ------------------------------------------------------------ GET
    if (event.httpMethod === 'GET') {
      const t = (event.queryStringParameters || {}).t || '';
      if (!TOKEN_OK.test(t)) return rispondi(404, { error: 'Link non valido.' });
      const link = await leggi(sb, t);
      if (!link) return rispondi(404, { error: 'Questo link non è più attivo. Chiedi all\'impresa di mandartene uno nuovo.' });

      const dati = link.dati || {};
      const capitolati = await firmaFoto(sb, dati, link.user_id);

      // le aperture: le conta il server, l'impresa le vede nel gestionale
      const adesso = new Date().toISOString();
      await sb.from('gest_preventivi_link').update({
        aperto_il: link.aperto_il || adesso,
        ultimo_aperto: adesso,
        aperture: (link.aperture || 0) + 1
      }).eq('token', t);

      return rispondi(200, Object.assign({}, dati, {
        capitolati,
        firmato_il: link.firmato_il,
        firma_nome: link.firma_nome || null,
        firma_img: link.firmato_il ? (link.firma_img || null) : null
      }));
    }

    // ----------------------------------------------------------- POST
    if (event.httpMethod !== 'POST') return rispondi(405, { error: 'Metodo non consentito' });
    let corpo;
    try { corpo = JSON.parse(event.body || '{}'); } catch (e) { return rispondi(400, { error: 'Richiesta non valida.' }); }
    const t = String(corpo.t || '');
    if (!TOKEN_OK.test(t)) return rispondi(404, { error: 'Link non valido.' });
    const link = await leggi(sb, t);
    if (!link) return rispondi(404, { error: 'Questo link non è più attivo.' });
    if (link.firmato_il) return rispondi(409, { error: 'Questo preventivo è già stato firmato.' });

    const nome = String(corpo.nome || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const firma = String(corpo.firma || '');
    if (nome.length < 3) return rispondi(400, { error: 'Scrivi il tuo nome e cognome.' });
    if (!corpo.accetto) return rispondi(400, { error: 'Spunta la casella per dire che accetti.' });
    if (!FIRMA_OK.test(firma) || firma.length < 200) return rispondi(400, { error: 'Manca la firma: firma col dito nel riquadro.' });
    if (firma.length > FIRMA_MAX) return rispondi(400, { error: 'La firma è troppo grande. Cancellala e rifalla.' });

    const h = event.headers || {};
    const ip = String(h['x-nf-client-connection-ip'] || h['client-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || '').trim().slice(0, 64) || null;
    // l'impronta di quello che il cliente aveva davanti quando ha firmato
    const impronta = crypto.createHash('sha256').update(JSON.stringify(link.dati || {})).digest('hex');
    const adesso = new Date().toISOString();

    const { data: fatto, error } = await sb.from('gest_preventivi_link').update({
      firmato_il: adesso, firma_nome: nome, firma_img: firma, firma_ip: ip, firma_hash: impronta
    }).eq('token', t).is('firmato_il', null).select('preventivo_id');
    if (error) { console.error('preventivo-cliente firma:', error); return rispondi(500, { error: 'Non sono riuscito a salvare la firma. Riprova.' }); }
    if (!fatto || !fatto.length) return rispondi(409, { error: 'Questo preventivo è già stato firmato.' });

    // l'avviso all'impresa: all'indirizzo con cui entra nel gestionale
    try {
      const d = link.dati || {};
      const { data: u } = await sb.auth.admin.getUserById(link.user_id);
      const a = u && u.user && u.user.email;
      const cosa = (d.includi_prev === false ? 'il capitolato' : (d.tipo === 'parcella' ? 'la parcella' : 'il preventivo'))
        + (d.numero ? ' n. ' + d.numero : '');
      await mandaEmail(a, 'Il cliente ha firmato ' + cosa,
        '<div style="font-family:Arial,sans-serif;font-size:16px;color:#0f172a;max-width:560px">'
        + '<p><b>' + esc(nome) + '</b> ha accettato e firmato ' + esc(cosa)
        + (d.titolo ? ' — <b>' + esc(d.titolo) + '</b>' : '') + '.</p>'
        + '<p style="color:#475569">Firmato il ' + esc(new Date(adesso).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })) + '.</p>'
        + '<p>Lo trovi nel gestionale: apri il preventivo e premi «Invia al cliente».</p>'
        + '<p><a href="https://trovaimpresa.com/login-impresa?redirect=gestionale" style="background:#0066ff;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Apri il gestionale</a></p>'
        + '</div>');
    } catch (e) { /* l'email e' un di piu': la firma e' gia' salvata */ }

    return rispondi(200, { ok: true, firmato_il: adesso, firma_nome: nome });
  } catch (e) {
    console.error('preventivo-cliente:', e);
    return rispondi(500, { error: 'Qualcosa non ha funzionato. Riprova fra un attimo.' });
  }
};
