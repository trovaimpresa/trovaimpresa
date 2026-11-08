// =====================================================================
// FIRMA CON CODICE SMS — la porta dell'impresa (8 novembre 2026)
//
// Dal gestionale: «Invia al cliente» → «Firma con codice SMS».
//   POST {azione:'crea', preventivo_id, nome, cognome, cellulare, email}
//   POST {azione:'stato', id}       chiede a Openapi a che punto e'
//   POST {azione:'annulla', id}     la mette da parte (per rifarla)
// Sempre con «Authorization: Bearer <gettone dell'impresa>».
//
// ⛔ IL PDF LO FA IL SERVER dalla fotografia gia' salvata in
//    gest_preventivi_link.dati (quella che vede il cliente sul link).
//    Il browser non manda nessun documento: manda solo il numero del
//    preventivo e i dati di chi firma.
// ⛔ 5 CREDITI AI, scalati PRIMA di chiamare Openapi (col gettone
//    dell'impresa: dentro c'e' auth.uid()). Se Openapi non la prende,
//    i crediti tornano indietro.
// ⛔ Le righe di gest_firme_sms le scrive solo questa funzione e
//    firma-sms-notifica.js (il browser puo' solo leggerle).
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const C = require('./lib/firma-sms-comune');
const { costruisci } = require('./lib/firma-pdf');

const COSTO = 5;
const PREZZO_EUR = 0.49;

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(corpo)
});
const T = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return rispondi(405, { error: 'Metodo non consentito' });
    const URL_SB = process.env.SUPABASE_URL, SERVIZIO = process.env.SUPABASE_SERVICE_KEY;
    const ANON = (process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.startsWith('eyJ'))
      ? process.env.SUPABASE_ANON_KEY : 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
    if (!URL_SB || !SERVIZIO) return rispondi(500, { error: 'Configurazione server mancante.' });

    const amb = C.ambiente();
    if (!amb.token || !amb.base) {
      return rispondi(503, { error: 'La firma con codice SMS non è ancora accesa. Per ora usa la firma col dito dal link.', codice: 'spenta' });
    }

    const h = event.headers || {};
    const aut = h.authorization || h.Authorization || '';
    const token = aut.startsWith('Bearer ') ? aut.slice(7).trim() : '';
    if (!token) return rispondi(401, { error: 'Sessione scaduta: rientra e riprova.' });
    const db = createClient(URL_SB, SERVIZIO);
    const { data: chi } = await db.auth.getUser(token).catch(() => ({ data: null }));
    const uid = chi && chi.user && chi.user.id;
    if (!uid) return rispondi(401, { error: 'Sessione scaduta: rientra e riprova.' });

    let corpo;
    try { corpo = JSON.parse(event.body || '{}'); } catch (e) { return rispondi(400, { error: 'Richiesta non valida.' }); }
    const azione = String(corpo.azione || '');

    // ---------------------------------------------------- stato / annulla
    if (azione === 'stato' || azione === 'annulla') {
      const id = String(corpo.id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return rispondi(400, { error: 'Firma non trovata.' });
      const { data: riga } = await db.from('gest_firme_sms').select('*').eq('id', id).eq('user_id', uid).maybeSingle();
      if (!riga) return rispondi(404, { error: 'Firma non trovata.' });
      if (azione === 'annulla') {
        if (riga.stato === 'DONE') return rispondi(409, { error: 'Il cliente ha già firmato: non si annulla.' });
        // prima si guarda se nel frattempo ha firmato
        const ora = await C.aggiorna(db, riga);
        if (ora.stato === 'DONE') return rispondi(409, { error: 'Il cliente ha appena firmato: non si annulla.', firma: ora });
        const { data } = await db.from('gest_firme_sms').update({ stato: 'ANNULLATA', aggiornato_il: new Date().toISOString() })
          .eq('id', id).eq('user_id', uid).neq('stato', 'DONE').select('*');
        return rispondi(200, { ok: true, firma: (data && data[0]) || ora });
      }
      const ora = await C.aggiorna(db, riga);
      return rispondi(200, { ok: true, firma: ora });
    }

    if (azione !== 'crea') return rispondi(400, { error: 'Azione sconosciuta.' });

    // ---------------------------------------------------- crea
    const prevId = String(corpo.preventivo_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(prevId)) return rispondi(400, { error: 'Preventivo non trovato.' });
    const nome = T(corpo.nome).slice(0, 60), cognome = T(corpo.cognome).slice(0, 60);
    const cell = C.cellulare(corpo.cellulare);
    const email = T(corpo.email).slice(0, 120);
    if (nome.length < 2) return rispondi(400, { error: 'Scrivi il nome di chi firma.', campo: 'nome' });
    if (cognome.length < 2) return rispondi(400, { error: 'Scrivi il cognome di chi firma.', campo: 'cognome' });
    if (!cell) return rispondi(400, { error: 'Il cellulare non va bene: scrivilo così, 333 1234567. Il codice arriva lì.', campo: 'cellulare' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return rispondi(400, { error: 'L\'email non va bene. Puoi anche lasciarla vuota.', campo: 'email' });

    const { data: link } = await db.from('gest_preventivi_link').select('preventivo_id,user_id,dati,firmato_il')
      .eq('preventivo_id', prevId).eq('user_id', uid).maybeSingle();
    if (!link || !link.dati || !link.dati.v) return rispondi(404, { error: 'Apri prima «Invia al cliente» su questo preventivo.' });
    if (link.firmato_il) return rispondi(409, { error: 'Il cliente ha già firmato questo preventivo. Se l\'hai cambiato, manda prima la versione nuova.' });
    const hash = C.impronta(link.dati);

    // una sola firma aperta per preventivo: se c'e' gia' per questa versione si riusa
    const { data: aperte } = await db.from('gest_firme_sms').select('*').eq('preventivo_id', prevId).eq('user_id', uid)
      .not('stato', 'in', '("DONE","ANNULLATA","ERROR","CANCELLED")').order('creato_il', { ascending: false });
    for (const a of (aperte || [])) {
      const ora = await C.aggiorna(db, a);
      if (ora.stato === 'DONE') return rispondi(409, { error: 'Il cliente ha appena firmato.', firma: ora });
      if (['DONE', 'ANNULLATA', 'ERROR', 'CANCELLED'].indexOf(ora.stato) >= 0) continue;
      if (ora.dati_hash === hash && ora.url_firma) return rispondi(200, { ok: true, firma: ora, gia: true });
      // versione vecchia: si mette da parte
      await db.from('gest_firme_sms').update({ stato: 'ANNULLATA', aggiornato_il: new Date().toISOString() }).eq('id', ora.id).neq('stato', 'DONE');
    }

    // il PDF, prima dei crediti: se non si fa, non si paga
    const firmatario = { nome, cognome, cellulare: cell, email: email || null };
    let pdf;
    try { pdf = await costruisci(link.dati, firmatario); }
    catch (e) { console.error('[firma-sms] pdf', e && e.message); return rispondi(500, { error: 'Non riesco a preparare il PDF. Riprova.' }); }

    // ---- i crediti, col gettone dell'impresa
    const utente = createClient(URL_SB, ANON, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false } });
    let consumo;
    try {
      const r = await utente.rpc('consume_ai_credit', { p_feature: 'firma_sms', p_cost: COSTO });
      if (r.error) throw r.error;
      consumo = r.data;
    } catch (e) { console.error('[firma-sms] crediti:', e && e.message); return rispondi(500, { error: 'Non riesco a controllare i crediti. Riprova.' }); }
    if (!consumo || !consumo.ok) {
      const mess = { no_credits: 'Servono ' + COSTO + ' crediti e non ne hai abbastanza. Li ricarichi da «Ricarica crediti».', plan_without_ai: 'I crediti non sono attivi sul tuo account.', subscription_expired: 'Il tuo abbonamento è scaduto.', no_account: 'Account non trovato.' };
      return rispondi(402, { error: mess[consumo && consumo.reason] || 'Crediti non disponibili.', reason: consumo && consumo.reason, remaining: (consumo && consumo.remaining) || 0 });
    }
    const logId = consumo.log_id || null;
    const rimborsa = async (perche) => {
      if (logId) await db.rpc('refund_ai_credit', { p_log_id: logId, p_error: String(perche || '').slice(0, 300) }).then(() => {}, () => {});
    };

    // ---- la riga, poi Openapi
    const d = link.dati;
    const titolo = ((d.includi_prev === false ? 'Capitolato' : (d.tipo === 'parcella' ? 'Parcella' : 'Preventivo') + (d.numero ? ' n. ' + d.numero : ''))
      + (d.titolo ? ' — ' + T(d.titolo) : '')).slice(0, 200);
    const { data: nuova, error: eIns } = await db.from('gest_firme_sms').insert({
      user_id: uid, preventivo_id: prevId, ambiente: amb.prova ? 'prova' : 'vera', stato: 'nuova',
      firmatario, dati_hash: hash, titolo, ai_log_id: logId
    }).select('*').single();
    if (eIns || !nuova) {
      await rimborsa('insert ' + (eIns && eIns.message));
      const em = (eIns && eIns.message) || '';
      return rispondi(500, { error: /gest_firme_sms|does not exist|schema cache/i.test(em)
        ? 'Manca un aggiornamento del database: esegui sql/firma-sms.sql su Supabase.' : 'Non riesco a salvare la richiesta. Riprova.' });
    }

    const sito = String(process.env.URL || 'https://trovaimpresa.com').replace(/\/+$/, '');
    const callbackUrl = sito + '/.netlify/functions/firma-sms-notifica?f=' + nuova.id + '&k=' + C.chiaveAvviso(nuova.id);
    const richiesta = {
      title: titolo,
      description: 'Documento da ' + (T(d.impresa && d.impresa.nome) || 'impresa'),
      signers: [{
        name: nome, surname: cognome, mobile: cell, ...(email ? { email } : {}),
        authentication: ['sms'], language: 'it',
        message: 'Il tuo codice per firmare è {OTP}',
        signatures: [{ page: pdf.firma.page, x: pdf.firma.x, y: pdf.firma.y }]
      }],
      inputDocuments: [{ sourceType: 'base64', payload: pdf.bytes.toString('base64') }],
      options: {
        signatureMode: ['drawn', 'typed'],
        userEditableData: { name: false, mobile: false, email: false },
        ui: { completeUrl: sito + '/firma-fatta.html', cancelUrl: sito + '/firma-fatta.html?annullata=1' }
      },
      callback: { url: callbackUrl, method: 'JSON', retry: 3, custom: { firma: nuova.id } }
    };
    const r = await C.chiama('POST', '/EU-SES', richiesta);
    const det = C.dentro(r.json);
    const signer = Array.isArray(det.signers) ? det.signers[0] : null;
    if (!r.ok || !det.id || !signer || !signer.url) {
      const msg = String((r.json && (r.json.message || r.json.error || (r.json.data && r.json.data.errorMessage))) || r.testo || '').slice(0, 300);
      console.error('[firma-sms] EU-SES', r.status, msg);
      await rimborsa('openapi ' + r.status + ' ' + msg);
      await db.from('gest_firme_sms').update({ stato: 'ERROR', errore: ('Openapi: ' + (msg || r.status)).slice(0, 300), aggiornato_il: new Date().toISOString() }).eq('id', nuova.id);
      return rispondi(502, { error: 'Openapi non ha preso la richiesta' + (msg ? ': ' + msg : '') + '. I crediti sono tornati indietro.' });
    }
    if (logId) {
      await db.rpc('settle_ai_usage', { p_log_id: logId, p_input_tokens: 0, p_output_tokens: 0, p_cost_eur: PREZZO_EUR }).then(() => {}, () => {});
    }
    const { data: pronta } = await db.from('gest_firme_sms').update({
      openapi_id: String(det.id), stato: String(det.state || 'WAIT_VALIDATION').toUpperCase(),
      url_firma: String(signer.url), aggiornato_il: new Date().toISOString()
    }).eq('id', nuova.id).select('*').single();
    return rispondi(200, { ok: true, firma: pronta || nuova, remaining: consumo.remaining, prova: amb.prova });
  } catch (e) {
    console.error('[firma-sms]', e);
    return rispondi(500, { error: 'Qualcosa non ha funzionato. Riprova fra un attimo.' });
  }
};
