// =====================================================================
// LA FATTURA PER EMAIL COL PDF ALLEGATO — 25 novembre 2026
//
// Dal gestionale: Fatture → «Manda al cliente» → «Manda l'email col PDF» →
// «Sì, manda». Il browser fa lo STESSO PDF di «Crea il PDF» (fatturaPdf con
// {blob:true}), lo mette nel deposito privato (gestionale-foto, cartella
// <id utente>/email-documenti/) e chiama qui con:
//   Authorization: Bearer <gettone dell'impresa>
//   { fattura_id, percorso }
//
// ⛔ NON SI FIDA DEL BROWSER (regola del 27 set 2026):
//    - chi chiama lo dice il gettone; la fattura deve essere sua;
//    - il DESTINATARIO e' l'email del cliente della fattura, letta dal database;
//    - il TESTO e' fisso, scritto qui (numero, data, scadenza, IBAN: dal database);
//    - il file deve stare nella SUA cartella, essere un PDF vero (%PDF-) e pesare
//      meno di 5 MB. Dopo l'invio si cancella dal deposito.
// TETTI: gli stessi dei preventivi (tabella gest_email_documenti, ora con
//    la colonna fattura_id): 5 al giorno per impresa, 20 per tutto il sito.
// Risposte: { ok:true, a, restano } · { codice:'impresa'|'sito'|'quota'|'senza_email', error }
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const haLink = require('./lib/niente-link');

const MITTENTE_EMAIL = 'info@trovaimpresa.com';
const BUCKET = 'gestionale-foto';
const MAX_PDF = 5 * 1024 * 1024;
const TETTO_IMPRESA = 5;
const TETTO_SITO = 20;

const H = { 'Content-Type': 'application/json' };
const r = (code, body) => ({ statusCode: code, headers: H, body: JSON.stringify(body) });
function T(v) { return String(v == null ? '' : v).trim(); }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function pulito(s, max) {
  const t = T(s).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').slice(0, max || 120);
  return haLink(t) ? '' : t;
}
// ⛔ STESSA REGOLA di invia-preventivo-email.js e js/gest-documenti-pdf.js
function nomeFileCliente(nome) {
  const s = String(nome == null ? '' : nome).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80).replace(/^-+|-+$/g, '');
  return s || 'cliente';
}
function inizioGiornoRoma() {
  const ora = new Date();
  const roma = new Date(ora.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  const diff = roma.getTime() - ora.getTime();
  const mezzanotte = new Date(roma); mezzanotte.setHours(0, 0, 0, 0);
  return new Date(mezzanotte.getTime() - diff).toISOString();
}
function dataIt(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(T(s)); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
function giorniDopo(s, gg) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(T(s)); if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + (+gg || 0)));
  return d.toISOString().slice(0, 10);
}

function corpo({ nomeImpresa, cosa, bozza, scadenza, iban, causale, contatti }) {
  const p = (t) => '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#12233a">' + t + '</p>';
  return '<!DOCTYPE html><html lang="it"><body style="margin:0;padding:0;background:#f4f7fb">'
    + '<div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
    + '<div style="background:#fff;border-radius:14px;padding:30px 28px">'
    + (nomeImpresa ? '<div style="font-size:22px;font-weight:800;color:#0a2a4d;margin-bottom:22px">' + esc(nomeImpresa) + '</div>' : '')
    + p('Buongiorno,')
    + p('le mando ' + esc(cosa) + '. La trova in allegato in PDF.'
        + (bozza ? ' È ancora una bozza: la fattura vera, col numero, arriverà dopo.' : ''))
    + (scadenza ? p('Da pagare entro il <b>' + esc(scadenza) + '</b>.') : '')
    + (iban ? p('Bonifico su IBAN: <b>' + esc(iban) + '</b>' + (causale ? '<br>Causale: ' + esc(causale) : '')) : '')
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
  const fattId = T(b.fattura_id), percorso = T(b.percorso);
  if (!fattId || !percorso) return r(400, { error: 'Mancano dati.' });

  const db = createClient(URL_SB, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const togliFile = () => db.storage.from(BUCKET).remove([percorso]).catch(() => {});

  const { data: chi } = await db.auth.getUser(token).catch(() => ({ data: null }));
  const user = chi && chi.user;
  if (!user) return r(401, { error: 'Sessione scaduta: rientra nel gestionale.' });
  if (!percorso.startsWith(user.id + '/email-documenti/') || percorso.includes('..') || !/\.pdf$/i.test(percorso)) {
    return r(400, { error: 'File non valido.' });
  }

  try {
    // ---- la fattura e' sua? ----
    const { data: f, error: fe } = await db.from('gest_fatture')
      .select('id,user_id,numero,anno,tipo,data,stato,cliente_id,cli_nome,scadenza,modo_pagamento,iban,eliminato_il')
      .eq('id', fattId).eq('user_id', user.id).maybeSingle();
    if (fe) return r(500, { error: 'Lettura della fattura non riuscita.' });
    if (!f || f.eliminato_il) return r(404, { error: 'Fattura non trovata.' });

    // ---- il destinatario lo dice il database ----
    let a = '';
    if (f.cliente_id) {
      const { data: c } = await db.from('gest_clienti').select('email').eq('id', f.cliente_id).eq('user_id', user.id).maybeSingle();
      a = T(c && c.email).toLowerCase();
    }
    if (!/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[a-z]{2,}$/i.test(a)) return r(422, { codice: 'senza_email', error: 'Il cliente non ha un\'email valida.' });

    // ---- i tetti (gli stessi dei preventivi) ----
    const da = inizioGiornoRoma();
    const [mie, tutte] = await Promise.all([
      db.from('gest_email_documenti').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('creato_il', da),
      db.from('gest_email_documenti').select('id', { count: 'exact', head: true }).gte('creato_il', da)
    ]);
    if (mie.error || tutte.error) return r(500, { error: 'Non riesco a contare le email di oggi.' });
    if ((mie.count || 0) >= TETTO_IMPRESA) return r(429, { codice: 'impresa', error: 'Oggi hai già mandato ' + TETTO_IMPRESA + ' email.' });
    if ((tutte.count || 0) >= TETTO_SITO) return r(429, { codice: 'sito', error: 'Oggi le email del sito sono finite.' });

    // ---- il file ----
    const { data: blob, error: se } = await db.storage.from(BUCKET).download(percorso);
    if (se || !blob) return r(400, { error: 'Il PDF non si trova: riprova.' });
    const buf = Buffer.from(await blob.arrayBuffer());
    if (buf.length > MAX_PDF) return r(413, { error: 'Il PDF pesa troppo per una email (massimo 5 MB).' });
    if (buf.slice(0, 5).toString('latin1') !== '%PDF-') return r(400, { error: 'Il file non è un PDF.' });

    // ---- il testo, dal database ----
    const { data: az } = await db.from('gest_azienda').select('nome,email,tel,iban,giorni_pagamento').eq('user_id', user.id).maybeSingle();
    const nomeImpresa = pulito(az && az.nome, 80);
    const anno = +f.anno || +(T(f.data).slice(0, 4)) || '';
    const nc = f.tipo === 'nota_credito';
    const bozza = !f.numero;
    const numTxt = f.numero ? ' n. ' + (+f.numero) + '/' + anno : '';
    const cosa = (nc ? 'la nota di credito' : 'la fattura') + numTxt + (f.data ? ' del ' + dataIt(f.data) : '');
    let scadenza = '', iban = '', causale = '';
    if (!nc && f.stato !== 'pagata') {
      scadenza = dataIt(f.scadenza || giorniDopo(f.data, (+(az && az.giorni_pagamento)) || 30));
      const ib = T(f.iban || (az && az.iban)).replace(/[^A-Z0-9 ]/gi, '').toUpperCase().slice(0, 40);
      const modo = f.modo_pagamento || (ib ? 'bonifico' : '');
      if ((modo === 'bonifico' || modo === 'riba') && ib) {
        iban = ib; causale = f.numero ? 'fattura n. ' + (+f.numero) + '/' + anno : '';
      }
    }
    const risposte = T(az && az.email) || T(user.email);
    const tel = T(az && az.tel).replace(/[^\d+ ]/g, '').slice(0, 20);
    const contatti = [tel ? 'Tel. ' + esc(tel) : '', /^[^\s@<>]+@[^\s@<>]+$/.test(risposte) ? esc(risposte) : ''].filter(Boolean).join(' · ');
    // lo stesso nome del file di «Crea il PDF» (js/gest-fatture.js)
    const nomeFile = 'fattura-' + (f.numero ? (+f.numero) + '-' + anno : 'bozza') + '-' + nomeFileCliente(f.cli_nome) + '.pdf';
    const daNome = (nomeImpresa || 'La tua impresa').replace(/["<>\\]/g, '').slice(0, 60);
    const oggetto = (nc ? 'Nota di credito' : 'Fattura') + (f.numero ? ' n. ' + (+f.numero) + '/' + anno : ' (bozza)') + (nomeImpresa ? ' — ' + nomeImpresa : '');

    const rr = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: '"' + daNome + '" <' + MITTENTE_EMAIL + '>',
        to: [a],
        reply_to: /^[^\s@<>]+@[^\s@<>]+$/.test(risposte) ? risposte : undefined,
        subject: oggetto,
        html: corpo({ nomeImpresa, cosa, bozza, scadenza, iban, causale, contatti }),
        attachments: [{ filename: nomeFile, content: buf.toString('base64'), content_type: 'application/pdf' }]
      })
    });
    const risp = await rr.json().catch(() => ({}));
    if (!rr.ok) {
      if (rr.status === 429 && /quota/i.test(JSON.stringify(risp))) return r(429, { codice: 'quota', error: 'Oggi le email del sito sono finite.' });
      console.error('[invia-fattura-email] Resend', rr.status, risp && risp.message);
      return r(502, { error: 'Il servizio email non l\'ha presa: riprova fra poco.' });
    }
    const { error: ie } = await db.from('gest_email_documenti').insert({
      user_id: user.id, fattura_id: fattId, a, resend_id: T(risp && risp.id) || null
    });
    if (ie) console.error('[invia-fattura-email] registro', ie.message);
    return r(200, { ok: true, a, restano: Math.max(0, TETTO_IMPRESA - (mie.count || 0) - 1) });
  } finally {
    await togliFile();
  }
};
exports._corpo = corpo;
