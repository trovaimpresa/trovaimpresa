// =====================================================================
// L'EMAIL VERA COL PDF DEL PREVENTIVO — 13 novembre 2026 (lista «MANCA», n. 8)
//
// Dal gestionale, «Invia al cliente» → «Email con PDF» → «Sì, manda».
// Il browser fa lo STESSO PDF di «Scarica PDF», lo mette nel deposito privato
// (gestionale-foto, cartella <id utente>/email-documenti/) e chiama qui con:
//   Authorization: Bearer <gettone dell'impresa>
//   { preventivo_id, percorso, nome_file }
//
// ⛔ NON SI FIDA DEL BROWSER (regola del 27 set 2026, «CHIUSE LE PORTE DELLE EMAIL»):
//    - chi chiama lo dice il gettone;
//    - il preventivo deve essere suo;
//    - il DESTINATARIO e' l'email del cliente del preventivo, letta dal database;
//    - il TESTO e' fisso, scritto qui; titolo e nome dell'impresa sono disinnescati
//      (niente HTML, niente link estranei);
//    - il file deve stare nella SUA cartella, essere un PDF vero (%PDF-) e pesare
//      meno di 5 MB. Dopo l'invio si cancella dal deposito.
// TETTI: 5 al giorno per impresa, 20 al giorno per tutto il sito (tabella
//    gest_email_documenti, sql/email-documenti.sql). Resend gratis = 100 email al
//    giorno in TUTTO il sito: conferme d'iscrizione, avvisi, campagne, chat.
//    Se Resend dice che la quota e' finita, l'email NON si mette da parte per
//    domani (un preventivo che arriva 12 ore dopo senza dirlo e' peggio): si
//    risponde «quota» e il gestionale offre WhatsApp o il programma di posta.
// Risposte: { ok:true, a, restano } · { codice:'impresa'|'sito'|'quota'|'senza_email', error }
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const haLink = require('./lib/niente-link');

const MITTENTE_EMAIL = 'info@trovaimpresa.com';
const BUCKET = 'gestionale-foto';
const MAX_PDF = 5 * 1024 * 1024;
const TETTO_IMPRESA = 5;
const TETTO_SITO = 20;
const SITO = 'https://trovaimpresa.com';

const H = { 'Content-Type': 'application/json' };
const r = (code, body) => ({ statusCode: code, headers: H, body: JSON.stringify(body) });

function T(v) { return String(v == null ? '' : v).trim(); }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* testo scritto dall'impresa: corto, senza link estranei, senza a capo */
function pulito(s, max) {
  const t = T(s).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').slice(0, max || 120);
  return haLink(t) ? '' : t;
}
/* mezzanotte di oggi a Roma, in UTC */
function inizioGiornoRoma() {
  const ora = new Date();
  const roma = new Date(ora.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  const diff = roma.getTime() - ora.getTime();
  const mezzanotte = new Date(roma); mezzanotte.setHours(0, 0, 0, 0);
  return new Date(mezzanotte.getTime() - diff).toISOString();
}

function corpo({ nomeImpresa, cosa, titolo, conCap, link, contatti }) {
  const p = (t) => '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#12233a">' + t + '</p>';
  return '<!DOCTYPE html><html lang="it"><body style="margin:0;padding:0;background:#f4f7fb">'
    + '<div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
    + '<div style="background:#fff;border-radius:14px;padding:30px 28px">'
    + (nomeImpresa ? '<div style="font-size:22px;font-weight:800;color:#0a2a4d;margin-bottom:22px">' + esc(nomeImpresa) + '</div>' : '')
    + p('Buongiorno,')
    + p('le mando ' + esc(cosa) + (titolo ? ' «' + esc(titolo) + '»' : '') + (conCap ? ' con il capitolato' : '') + '. Lo trova in allegato in PDF.')
    + p('Può vederlo anche dal telefono e, se va bene, accettarlo e firmarlo lì:')
    + '<div style="text-align:center;margin:8px 0 22px"><a href="' + esc(link) + '" style="display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-weight:700;font-size:17px;padding:14px 26px;border-radius:10px">Apri ' + esc(cosa.replace(/ n\. .*/, '')) + '</a></div>'
    + p('Per qualsiasi domanda può rispondere a questa email.')
    + p('Cordiali saluti' + (nomeImpresa ? ',<br><b>' + esc(nomeImpresa) + '</b>' : ''))
    + (contatti ? '<div style="font-size:15px;color:#41546b;line-height:1.6">' + contatti + '</div>' : '')
    + '</div></div></body></html>';
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return r(405, { error: 'Metodo non permesso' });
  const URL_SB = T(process.env.SUPABASE_URL);
  const KEY = T(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE);
  const RESEND = T(process.env.RESEND_API_KEY);
  if (!URL_SB || !KEY || !RESEND) return r(500, { error: 'Configurazione mancante.' });

  const h = event.headers || {};
  const token = T((h.authorization || h.Authorization || '').replace(/^Bearer\s+/i, ''));
  if (!token) return r(401, { error: 'Sessione mancante: rientra nel gestionale.' });

  let b = {};
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return r(400, { error: 'Richiesta non valida.' }); }
  const prevId = T(b.preventivo_id), percorso = T(b.percorso);
  if (!prevId || !percorso) return r(400, { error: 'Mancano dati.' });

  const db = createClient(URL_SB, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const togliFile = () => db.storage.from(BUCKET).remove([percorso]).catch(() => {});

  // ---- chi chiama ----
  const { data: chi } = await db.auth.getUser(token).catch(() => ({ data: null }));
  const user = chi && chi.user;
  if (!user) return r(401, { error: 'Sessione scaduta: rientra nel gestionale.' });
  if (!percorso.startsWith(user.id + '/email-documenti/') || percorso.includes('..') || !/\.pdf$/i.test(percorso)) {
    return r(400, { error: 'File non valido.' });
  }

  try {
    // ---- il preventivo e' suo? ----
    const { data: p, error: pe } = await db.from('gest_preventivi')
      .select('id,user_id,numero,titolo,cliente_id,eliminato_il').eq('id', prevId).eq('user_id', user.id).maybeSingle();
    if (pe) return r(500, { error: 'Lettura del preventivo non riuscita.' });
    if (!p || p.eliminato_il) return r(404, { error: 'Preventivo non trovato.' });

    // ---- il destinatario lo dice il database ----
    let a = '';
    if (p.cliente_id) {
      const { data: c } = await db.from('gest_clienti').select('email').eq('id', p.cliente_id).eq('user_id', user.id).maybeSingle();
      a = T(c && c.email).toLowerCase();
    }
    if (!/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[a-z]{2,}$/i.test(a)) return r(422, { codice: 'senza_email', error: 'Il cliente non ha un\'email valida.' });

    // ---- i tetti ----
    const da = inizioGiornoRoma();
    const [mie, tutte] = await Promise.all([
      db.from('gest_email_documenti').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('creato_il', da),
      db.from('gest_email_documenti').select('id', { count: 'exact', head: true }).gte('creato_il', da)
    ]);
    if (mie.error || tutte.error) return r(500, { error: 'Non riesco a contare le email di oggi.' });
    if ((mie.count || 0) >= TETTO_IMPRESA) return r(429, { codice: 'impresa', error: 'Oggi hai già mandato ' + TETTO_IMPRESA + ' email.' });
    if ((tutte.count || 0) >= TETTO_SITO) return r(429, { codice: 'sito', error: 'Oggi le email del sito sono finite.' });

    // ---- il file: suo, PDF vero, non troppo grande ----
    const { data: blob, error: se } = await db.storage.from(BUCKET).download(percorso);
    if (se || !blob) return r(400, { error: 'Il PDF non si trova: riprova.' });
    const buf = Buffer.from(await blob.arrayBuffer());
    if (buf.length > MAX_PDF) return r(413, { error: 'Il PDF pesa troppo per una email (massimo 5 MB).' });
    if (buf.slice(0, 5).toString('latin1') !== '%PDF-') return r(400, { error: 'Il file non è un PDF.' });

    // ---- il resto dal database ----
    const [{ data: az }, { data: link }, { data: imp }] = await Promise.all([
      db.from('gest_azienda').select('nome,email,tel').eq('user_id', user.id).maybeSingle(),
      db.from('gest_preventivi_link').select('token,dati').eq('preventivo_id', prevId).eq('user_id', user.id).maybeSingle(),
      db.from('imprese').select('tipo').eq('user_id', user.id).limit(1).maybeSingle()
    ]);
    if (!link || !link.token) return r(409, { error: 'Il link del preventivo non c\'è: riapri «Invia al cliente».' });
    const studio = imp && imp.tipo === 'professionista';
    const nomeImpresa = pulito(az && az.nome, 80);
    const titolo = pulito(p.titolo, 120);
    const cosa = (studio ? 'la parcella' : 'il preventivo') + ' n. ' + (+p.numero || '');
    const conCap = !!(link.dati && Array.isArray(link.dati.capitolati) && link.dati.capitolati.length && link.dati.includi_prev !== false);
    const risposte = T(az && az.email) || T(user.email);
    const tel = T(az && az.tel).replace(/[^\d+ ]/g, '').slice(0, 20);
    const contatti = [tel ? 'Tel. ' + esc(tel) : '', /^[^\s@<>]+@[^\s@<>]+$/.test(risposte) ? esc(risposte) : ''].filter(Boolean).join(' · ');
    const nomeFile = (studio ? 'parcella-' : 'preventivo-') + (+p.numero || '') + '.pdf';
    const daNome = (nomeImpresa || 'La tua impresa').replace(/["<>\\]/g, '').slice(0, 60);

    // ---- si manda ----
    const rr = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: '"' + daNome + '" <' + MITTENTE_EMAIL + '>',
        to: [a],
        reply_to: /^[^\s@<>]+@[^\s@<>]+$/.test(risposte) ? risposte : undefined,
        subject: (studio ? 'Parcella' : 'Preventivo') + ' n. ' + (+p.numero || '') + (titolo ? ' — ' + titolo : ''),
        html: corpo({ nomeImpresa, cosa, titolo, conCap, link: SITO + '/preventivo-cliente?t=' + encodeURIComponent(link.token), contatti }),
        attachments: [{ filename: nomeFile, content: buf.toString('base64') }]
      })
    });
    const risp = await rr.json().catch(() => ({}));
    if (!rr.ok) {
      if (rr.status === 429 && /quota/i.test(JSON.stringify(risp))) return r(429, { codice: 'quota', error: 'Oggi le email del sito sono finite.' });
      console.error('[invia-preventivo-email] Resend', rr.status, risp && risp.message);
      return r(502, { error: 'Il servizio email non l\'ha presa: riprova fra poco.' });
    }

    const { error: ie } = await db.from('gest_email_documenti').insert({
      user_id: user.id, preventivo_id: prevId, a, resend_id: T(risp && risp.id) || null
    });
    if (ie) console.error('[invia-preventivo-email] registro', ie.message);   // l'email e' partita: non si dice «non e' partita»
    return r(200, { ok: true, a, restano: Math.max(0, TETTO_IMPRESA - (mie.count || 0) - 1) });
  } finally {
    await togliFile();
  }
};
exports._corpo = corpo;   // per il banco e le foto
