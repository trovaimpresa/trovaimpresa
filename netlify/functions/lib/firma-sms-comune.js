// =====================================================================
// FIRMA CON CODICE SMS — i pezzi in comune (8 novembre 2026)
//
// Li usano netlify/functions/firma-sms.js (l'impresa dal gestionale) e
// netlify/functions/firma-sms-notifica.js (Openapi che ci avvisa).
//
// Openapi: API «eSignature», firma EU-SES (firma elettronica con OTP).
//   POST /EU-SES                         crea la richiesta
//   GET  /signatures/{id}/detail         a che punto e'
//   GET  /signatures/{id}/signedDocument il PDF firmato (binario)
//   Prova:  https://test.esignature.openapi.com
//   Vera:   https://esignature.openapi.com
// Variabili Netlify: OPENAPI_FIRMA_TOKEN (segreta), OPENAPI_FIRMA_URL.
//
// ⛔ Openapi tiene il PDF firmato solo 90 giorni: appena la firma e'
//    fatta lo scarichiamo nel deposito privato «firme-sms».
// =====================================================================
const crypto = require('crypto');
const https = require('https');

function ambiente() {
  const token = (process.env.OPENAPI_FIRMA_TOKEN || '').trim();
  const base = (process.env.OPENAPI_FIRMA_URL || '').trim().replace(/\/+$/, '');
  return { token, base, prova: /test\./i.test(base) };
}

async function chiama(metodo, percorso, corpo, comeFile) {
  const { token, base } = ambiente();
  const r = await fetch(base + percorso, {
    method: metodo,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': comeFile ? 'application/pdf, application/octet-stream, application/json' : 'application/json'
    },
    body: corpo == null ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(20000)
  });
  if (comeFile) {
    const tipo = String(r.headers.get('content-type') || '');
    const buf = Buffer.from(await r.arrayBuffer());
    return { ok: r.ok, status: r.status, tipo, buf };
  }
  const testo = await r.text();
  let json = null; try { json = JSON.parse(testo); } catch (_) {}
  return { ok: r.ok, status: r.status, json, testo };
}

/* Openapi a volte mette tutto dentro «data», a volte no */
function dentro(j) { return (j && j.data && typeof j.data === 'object' && !Array.isArray(j.data)) ? j.data : (j || {}); }

/* il segreto dell'avviso: nasce dalla chiave di servizio, niente variabile in piu' */
function chiaveAvviso(id) {
  return crypto.createHmac('sha256', String(process.env.SUPABASE_SERVICE_KEY || '') + '|firma-sms')
    .update(String(id)).digest('hex').slice(0, 40);
}
function chiaveGiusta(id, k) {
  const a = Buffer.from(chiaveAvviso(id)), b = Buffer.from(String(k || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function impronta(dati) { return crypto.createHash('sha256').update(JSON.stringify(dati || {})).digest('hex'); }

/* il cellulare in forma internazionale: +39... */
function cellulare(s) {
  let t = String(s || '').replace(/[\s.\-()/]/g, '');
  if (t.startsWith('00')) t = '+' + t.slice(2);
  if (/^3\d{8,9}$/.test(t)) t = '+39' + t;
  if (/^39\d{9,10}$/.test(t)) t = '+' + t;
  return /^\+\d{8,15}$/.test(t) ? t : '';
}

const STATI = {
  nuova: 'Pronta', WAIT_VALIDATION: 'In preparazione', WAIT_SIGN: 'Aspetta la firma del cliente',
  WAIT_SIGNERS: 'Aspetta la firma del cliente', WAIT_OTP: 'Il cliente sta mettendo il codice',
  DONE: 'Firmato', ERROR: 'Errore', CANCELLED: 'Annullata', ANNULLATA: 'Annullata'
};

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

/* Chiede a Openapi a che punto e' la firma e, se e' fatta, si prende il PDF.
   Lo usano tutti e due: l'avviso di Openapi e il pulsante «Controlla adesso».
   Restituisce la riga aggiornata. */
async function aggiorna(db, riga) {
  if (!riga || !riga.openapi_id) return riga;
  if (riga.stato === 'DONE' && riga.pdf_path) return riga;
  if (riga.stato === 'ANNULLATA') return riga;

  const d = await chiama('GET', '/signatures/' + encodeURIComponent(riga.openapi_id) + '/detail');
  if (!d.ok) { console.error('[firma-sms] detail', d.status, String(d.testo || '').slice(0, 300)); return riga; }
  const det = dentro(d.json);
  const stato = String(det.state || riga.stato || '').toUpperCase() || riga.stato;

  if (stato !== 'DONE') {
    const cambio = { stato, aggiornato_il: new Date().toISOString() };
    if (stato === 'ERROR') cambio.errore = String(det.errorMessage || det.errorNumber || 'Errore di Openapi').slice(0, 300);
    const { data } = await db.from('gest_firme_sms').update(cambio).eq('id', riga.id).neq('stato', 'DONE').select('*');
    return (data && data[0]) || riga;
  }

  // ---- firmato: il PDF firmato si prende SUBITO (Openapi lo tiene 90 giorni)
  const f = await chiama('GET', '/signatures/' + encodeURIComponent(riga.openapi_id) + '/signedDocument', null, true);
  let pdf = null;
  if (f.ok) {
    if (f.buf.slice(0, 5).toString() === '%PDF-') pdf = f.buf;
    else if (/json/i.test(f.tipo)) {
      // se un giorno risponde in JSON col file dentro
      try {
        const j = dentro(JSON.parse(f.buf.toString('utf8')));
        const b64 = j.content || j.file || j.payload || j.document || '';
        const b = Buffer.from(String(b64), 'base64');
        if (b.slice(0, 5).toString() === '%PDF-') pdf = b;
      } catch (_) {}
    }
  }
  if (!pdf) {
    console.error('[firma-sms] PDF firmato non arrivato', f.status, f.tipo);
    const { data } = await db.from('gest_firme_sms').update({ stato: 'DONE', aggiornato_il: new Date().toISOString(),
      errore: 'Firmato, ma il PDF firmato non e\' ancora arrivato: riprovo.' }).eq('id', riga.id).select('*');
    return (data && data[0]) || riga;
  }
  const percorso = riga.user_id + '/' + riga.id + '.pdf';
  const up = await db.storage.from('firme-sms').upload(percorso, pdf, { contentType: 'application/pdf', upsert: true });
  if (up.error) { console.error('[firma-sms] deposito', up.error.message); return riga; }

  const adesso = new Date().toISOString();
  const quando = (det.updatedAt && !isNaN(new Date(det.updatedAt))) ? new Date(det.updatedAt).toISOString() : adesso;
  const { data: fatte } = await db.from('gest_firme_sms').update({
    stato: 'DONE', firmato_il: quando, pdf_path: percorso,
    pdf_sha256: crypto.createHash('sha256').update(pdf).digest('hex'), errore: null, aggiornato_il: adesso
  }).eq('id', riga.id).is('pdf_path', null).select('*');
  const nuova = (fatte && fatte[0]) || null;
  if (!nuova) {   // l'ha gia' chiusa l'altra strada nello stesso momento
    const { data: r2 } = await db.from('gest_firme_sms').select('*').eq('id', riga.id).maybeSingle();
    return r2 || riga;
  }

  // ---- il link «Invia al cliente»: si segna firmato SOLO se e' ancora la stessa fotografia
  const fir = nuova.firmatario || {};
  const nome = [fir.nome, fir.cognome].filter(Boolean).join(' ').slice(0, 100);
  if (nuova.preventivo_id) {
    const { data: link } = await db.from('gest_preventivi_link').select('preventivo_id,dati,firmato_il')
      .eq('preventivo_id', nuova.preventivo_id).eq('user_id', nuova.user_id).maybeSingle();
    if (link && !link.firmato_il && impronta(link.dati) === nuova.dati_hash) {
      await db.from('gest_preventivi_link').update({
        firmato_il: quando, firma_nome: (nome + ' (codice SMS)').slice(0, 120), firma_img: null, firma_ip: null, firma_hash: nuova.dati_hash
      }).eq('preventivo_id', nuova.preventivo_id).is('firmato_il', null);
    }
  }

  // ---- l'avviso all'impresa
  try {
    const { data: u } = await db.auth.admin.getUserById(nuova.user_id);
    const a = u && u.user && u.user.email;
    await mandaEmail(a, 'Il cliente ha firmato con il codice SMS',
      '<div style="font-family:Arial,sans-serif;font-size:16px;color:#0f172a;max-width:560px">'
      + '<p><b>' + esc(nome || 'Il cliente') + '</b> ha firmato con il codice SMS'
      + (nuova.titolo ? ' — <b>' + esc(nuova.titolo) + '</b>' : '') + '.</p>'
      + '<p>Il PDF firmato lo trovi nel gestionale: apri il preventivo e premi «Invia al cliente».</p>'
      + '<p><a href="https://trovaimpresa.com/login-impresa?redirect=gestionale" style="background:#0066ff;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Apri il gestionale</a></p>'
      + '</div>');
  } catch (_) { /* l'email e' un di piu' */ }
  return nuova;
}

module.exports = { ambiente, chiama, dentro, chiaveAvviso, chiaveGiusta, impronta, cellulare, aggiorna, STATI, esc };
