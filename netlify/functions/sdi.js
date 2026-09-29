// ============================================================
// FATTURA ALLO SDI CON UN CLIC — TrovaImpresa (29 settembre 2026)
//
// Il gestionale prepara il file XML (lo stesso di «File per lo SDI»),
// questa funzione lo manda allo SDI tramite Openapi.
//
// Body atteso:
//   { azione: "invia", access_token, fattura_id, xml }
//   { azione: "stato", access_token, fattura_id }   -> rilegge l'esito
//
// Chiavi su Netlify (Environment variables):
//   OPENAPI_SDI_TOKEN  la chiave di Openapi (segreta)
//   OPENAPI_SDI_URL    https://test.sdi.openapi.it  (prova)
//                      https://sdi.openapi.it       (quella vera)
//
// SICUREZZA — non si fida del browser:
//   - con l'access_token verifica CHI sta chiedendo;
//   - la fattura deve essere SUA, emessa, col numero;
//   - dentro il file il CEDENTE deve avere la SUA partita IVA:
//     nessuno puo' mandare fatture a nome di un altro;
//   - una fattura gia' partita non riparte (solo se lo SDI l'ha scartata).
//   Le colonne sdi_* in gest_fatture le scrive solo questa funzione
//   (un trigger del database le blocca dal browser).
// ============================================================
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const risposta = (code, obj) => ({ statusCode: code, headers: corsHeaders, body: JSON.stringify(obj) });
const MAX_XML = 5 * 1024 * 1024;

/* il segreto che Openapi ci rimanda quando avvisa (sdi-notifica.js):
   nasce dalla chiave stessa, cosi' non serve un'altra variabile */
function segretoNotifica(token) {
  return crypto.createHash('sha256').update(String(token) + '|trovaimpresa-sdi-notifica').digest('hex');
}

/* legge un tag dal file XML (il primo che trova dentro un pezzo) */
function tag(xml, nome) {
  const m = new RegExp('<(?:\\w+:)?' + nome + '>\\s*([^<]*?)\\s*</(?:\\w+:)?' + nome + '>').exec(xml);
  return m ? m[1] : '';
}
function pezzo(xml, nome) {
  const m = new RegExp('<(?:\\w+:)?' + nome + '[\\s>][\\s\\S]*?</(?:\\w+:)?' + nome + '>').exec(xml);
  return m ? m[0] : '';
}
const soloCifre = (s) => String(s || '').replace(/^IT/i, '').replace(/\s+/g, '').toUpperCase();

/* l'esito dello SDI in parole nostre */
function statoDaNotifiche(lista) {
  const ord = (Array.isArray(lista) ? lista : []).slice()
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
  let stato = null, esito = null;
  ord.forEach(n => {
    const t = String(n.type || '').toUpperCase();
    if (t === 'RC') { stato = 'consegnata'; esito = 'Lo SDI l\'ha recapitata: il cliente ce l\'ha.'; }
    else if (t === 'MC') { stato = 'non_consegnata'; esito = 'Lo SDI non e\' riuscito a consegnarla al cliente: la trova nel suo cassetto fiscale. Per te la fattura e\' emessa.'; }
    else if (t === 'NS') { stato = 'scartata'; esito = n.message || 'Lo SDI ha scartato la fattura.'; }
    else if (t === 'DT') { stato = 'consegnata'; esito = 'Termini scaduti: la fattura vale come consegnata.'; }
    else if (t === 'NE') { stato = /EC02|rifiut/i.test(n.message || '') ? 'scartata' : 'consegnata'; esito = n.message || 'Esito del cliente.'; }
    else if (t === 'AT') { stato = 'non_consegnata'; esito = n.message || 'Attestazione di trasmissione con impossibilita\' di recapito.'; }
  });
  return { stato, esito };
}

async function chiamaOpenapi(base, token, metodo, percorso, corpo, tipo) {
  const r = await fetch(base.replace(/\/+$/, '') + percorso, {
    method: metodo,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': tipo || 'application/json',
      'Accept': 'application/json'
    },
    body: corpo == null ? undefined : (typeof corpo === 'string' ? corpo : JSON.stringify(corpo))
  });
  const testo = await r.text();
  let json = null; try { json = JSON.parse(testo); } catch (_) {}
  return { ok: r.ok, status: r.status, json, testo };
}

/* la partita IVA deve essere registrata su Openapi una volta sola (per ambiente),
   con l'avviso delle risposte dello SDI che torna da noi */
async function assicuraAnagrafica(db, base, token, ambiente, userId, az, piva) {
  const { data: gia } = await db.from('gest_sdi_anagrafiche').select('fiscal_id')
    .eq('fiscal_id', piva).eq('ambiente', ambiente).maybeSingle();
  if (gia) return null;

  const g = await chiamaOpenapi(base, token, 'GET', '/business_registry_configurations/' + encodeURIComponent(piva));
  if (!g.ok) {
    const c = await chiamaOpenapi(base, token, 'POST', '/business_registry_configurations', {
      fiscal_id: piva,
      name: String(az.nome || '').slice(0, 200) || piva,
      email: String(az.email || '').trim() || ('sdi-' + piva + '@trovaimpresa.com'),
      apply_signature: false,
      apply_legal_storage: false
    });
    if (!c.ok) {
      const msg = (c.json && (c.json.message || c.json.error)) || c.testo.slice(0, 300);
      return 'Openapi non ha registrato la tua partita IVA: ' + msg;
    }
  }
  /* l'avviso: quando lo SDI risponde (consegnata / scartata) Openapi chiama noi */
  await chiamaOpenapi(base, token, 'POST', '/api_configurations', {
    fiscal_id: piva,
    callbacks: [{
      event: 'customer-notification',
      url: 'https://trovaimpresa.com/.netlify/functions/sdi-notifica',
      auth_header: 'Bearer ' + segretoNotifica(token),
      field: 'data'
    }]
  });
  await db.from('gest_sdi_anagrafiche').upsert({ fiscal_id: piva, ambiente, user_id: userId });
  return null;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Method Not Allowed' });

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  const TOKEN        = (process.env.OPENAPI_SDI_TOKEN || '').trim();
  const BASE         = (process.env.OPENAPI_SDI_URL || '').trim();
  if (!SUPABASE_URL || !SERVICE_KEY) return risposta(500, { error: 'Configurazione database mancante.' });
  if (!TOKEN || !BASE) return risposta(500, { error: 'L\'invio allo SDI non e\' ancora acceso (manca la chiave di Openapi su Netlify).' });
  const AMBIENTE = /\/\/test\./i.test(BASE) ? 'test' : 'prod';

  let q;
  try { q = JSON.parse(event.body || '{}'); } catch { return risposta(400, { error: 'Body JSON non valido.' }); }
  const { azione, access_token, fattura_id } = q || {};
  /* 29/09/2026 — le fatture del Noleggio stanno in un'altra tabella. Il browser
     dice quale, ma solo fra queste due: il nome non entra mai nella query. */
  const TAB = q && q.tabella === 'nol_fatture' ? 'nol_fatture' : 'gest_fatture';
  if (!access_token || (!fattura_id && azione !== 'ambiente')) return risposta(400, { error: 'Mancano dei dati.' });

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: u, error: eu } = await db.auth.getUser(access_token);
  if (eu || !u || !u.user) return risposta(401, { error: 'Accesso scaduto: ricarica la pagina.' });
  const uid = u.user.id;

  /* prima di aprire la finestra: siamo in prova o sul serio? */
  if (azione === 'ambiente') return risposta(200, { ok: true, ambiente: AMBIENTE });

  const { data: f } = await db.from(TAB).select('*').eq('id', fattura_id).eq('user_id', uid).maybeSingle();
  if (!f || f.eliminato_il) return risposta(404, { error: 'Fattura non trovata.' });

  /* ---------- RILEGGI L'ESITO ---------- */
  if (azione === 'stato') {
    if (!f.sdi_uuid) return risposta(200, { ok: true, ambiente: AMBIENTE, fattura: f });
    const n = await chiamaOpenapi(BASE, TOKEN, 'GET', '/invoices_notifications/' + encodeURIComponent(f.sdi_uuid));
    const lista = n.json && Array.isArray(n.json.data) ? n.json.data : (Array.isArray(n.json) ? n.json : []);
    const s = statoDaNotifiche(lista);
    /* 29/09/2026 — il CONTROLLO: cosa dice Openapi della fattura, per capire
       dove si e' fermata se la risposta dello SDI non arriva. Solo numeri e
       codici, niente dati del cliente. */
    const i = await chiamaOpenapi(BASE, TOKEN, 'GET', '/invoices/' + encodeURIComponent(f.sdi_uuid));
    const d = (i.json && (i.json.data || i.json)) || {};
    /* le risposte dello SDI stanno anche DENTRO la fattura (campo notifications) */
    const dentro = Array.isArray(d.notifications) ? d.notifications : [];
    const tutte = lista.concat(dentro.filter(x => x && typeof x === 'object'));
    const s2 = statoDaNotifiche(tutte);
    if (s2.stato) { s.stato = s2.stato; s.esito = s2.esito; }
    /* «marking» e' lo stato secondo Openapi (es. in attesa, inviata, scartata) */
    const mk = String(d.marking == null ? '' : (typeof d.marking === 'object' ? JSON.stringify(d.marking) : d.marking));
    if (!s.stato && /reject|scart|discard|error/i.test(mk)) { s.stato = 'scartata'; s.esito = String(d.notice || 'Scartata: ' + mk).slice(0, 500); }
    const breve = (v) => v == null ? null : (typeof v === 'object' ? JSON.stringify(v).slice(0, 300) : String(v).slice(0, 300));
    const controllo = {
      notifiche_http: n.status, notifiche: tutte.map(x => ({ tipo: x.type, il: x.created_at })),
      fattura_http: i.status,
      marking: breve(d.marking), notice: breve(d.notice), retry: breve(d.retry_information),
      nome_file_sdi: d.sdi_file_name || null, id_file_sdi: d.sdi_file_id || null,
      errore_openapi: (i.json && (i.json.error || i.json.message)) || null
    };
    if (s.stato) {
      const { data: agg } = await db.from(TAB).update({
        sdi_stato: s.stato, sdi_esito: s.esito, sdi_aggiornata_il: new Date().toISOString()
      }).eq('id', f.id).select('*').maybeSingle();
      return risposta(200, { ok: true, ambiente: AMBIENTE, fattura: agg || f, controllo });
    }
    /* 29/09/2026 — l'esito non c'e' ancora, ma se Openapi l'ha girata allo SDI
       e lo SDI le ha dato un numero, lo si dice: e' andata avanti. */
    if (mk === 'sent' && d.sdi_file_id && f.sdi_stato === 'inviata') {
      const esito = 'Lo SDI l\'ha presa in carico (file n. ' + String(d.sdi_file_id).slice(0, 20) + '). Aspettiamo l\'esito: consegnata o scartata.';
      const { data: agg } = await db.from(TAB).update({ sdi_esito: esito, sdi_aggiornata_il: new Date().toISOString() })
        .eq('id', f.id).select('*').maybeSingle();
      return risposta(200, { ok: true, ambiente: AMBIENTE, fattura: agg || f, controllo });
    }
    return risposta(200, { ok: true, ambiente: AMBIENTE, fattura: f, controllo });
  }

  if (azione !== 'invia') return risposta(400, { error: 'Azione sconosciuta.' });

  /* ---------- INVIA ---------- */
  if (f.sdi_uuid && f.sdi_stato !== 'scartata') {
    return risposta(409, { error: 'Questa fattura e\' gia\' partita per lo SDI. Non si manda due volte.', fattura: f });
  }
  if (!f.numero || !['emessa', 'pagata'].includes(f.stato)) {
    return risposta(400, { error: 'Si manda solo una fattura emessa, col suo numero.' });
  }
  const xml = String(q.xml || '');
  if (!xml || xml.length > MAX_XML || !/FatturaElettronica/.test(xml)) return risposta(400, { error: 'Il file della fattura non e\' valido.' });

  const { data: az } = await db.from('gest_azienda').select('nome,piva,email').eq('user_id', uid).maybeSingle();
  const piva = soloCifre(az && az.piva);
  if (!piva) return risposta(400, { error: 'Manca la tua partita IVA in Dati azienda.' });

  /* il cedente nel file deve essere LUI */
  const ced = pezzo(xml, 'CedentePrestatore');
  const pivaFile = soloCifre(tag(pezzo(ced, 'IdFiscaleIVA'), 'IdCodice'));
  if (!ced || pivaFile !== piva) {
    return risposta(403, { error: 'Nel file la partita IVA di chi emette non e\' la tua: non la mando.' });
  }
  /* e il numero deve essere quello della fattura */
  const numFile = tag(pezzo(xml, 'DatiGeneraliDocumento'), 'Numero');
  if (numFile && String(f.numero) && numFile.indexOf(String(f.numero)) < 0) {
    return risposta(400, { error: 'Il numero nel file non corrisponde alla fattura. Ricarica la pagina e riprova.' });
  }

  const err = await assicuraAnagrafica(db, BASE, TOKEN, AMBIENTE, uid, az || {}, piva);
  if (err) return risposta(502, { error: err });

  const inv = await chiamaOpenapi(BASE, TOKEN, 'POST', '/invoices', xml, 'application/xml');
  const uuid = inv.json && inv.json.data && inv.json.data.uuid;
  if (!inv.ok || !uuid) {
    const msg = (inv.json && (inv.json.message || inv.json.error)) || inv.testo.slice(0, 400) || ('errore ' + inv.status);
    await db.from(TAB).update({
      sdi_stato: f.sdi_uuid ? f.sdi_stato : 'errore', sdi_esito: 'Non partita: ' + msg, sdi_aggiornata_il: new Date().toISOString()
    }).eq('id', f.id);
    return risposta(502, { error: 'Openapi non l\'ha presa: ' + msg });
  }

  const ora = new Date().toISOString();
  const { data: agg } = await db.from(TAB).update({
    sdi_uuid: uuid, sdi_stato: 'inviata', sdi_esito: 'Partita. Aspettiamo la risposta dello SDI (di solito arriva in pochi minuti, a volte in qualche ora).',
    sdi_inviata_il: ora, sdi_aggiornata_il: ora, sdi_ambiente: AMBIENTE
  }).eq('id', f.id).select('*').maybeSingle();

  return risposta(200, { ok: true, ambiente: AMBIENTE, fattura: agg || f });
};

exports.segretoNotifica = segretoNotifica;
exports.statoDaNotifiche = statoDaNotifiche;
