// ============================================================
// FATTURE RICEVUTE DALLO SDI — TrovaImpresa (16 ottobre 2026)
//
// Il codice per RICEVERE le fatture dei fornitori tramite Openapi.
// Lo usano due funzioni:
//   sdi.js          le azioni che parte dal gestionale (attiva, scarica, sblocca...)
//   sdi-ricevuta.js l'avviso che Openapi manda a noi quando arriva una fattura
//
// COME FUNZIONA
//   1. L'impresa registra il codice destinatario di Openapi (JKKZDGR) sul sito
//      dell'Agenzia delle Entrate.
//   2. Preme «Attiva la ricezione»: noi diciamo a Openapi «per questa partita
//      IVA, quando arriva una fattura, avvisa questo indirizzo».
//   3. Arriva una fattura: Openapi chiama sdi-ricevuta.js. Li' NON ci si fida
//      del messaggio: si chiede il file XML a Openapi, si legge, si salva.
//
// REGOLE
//   - La fattura si salva SEMPRE (e' un documento fiscale: non si perde).
//   - Costa 1 invio, come quelle che si mandano (stesso prezzo per Openapi).
//     Gestionale a pagamento: compreso. Gestionale gratis: se ha invii, uno
//     viene scalato; se non ne ha, la fattura resta «da sbloccare» e il file
//     non si scarica finche' non compra un pacchetto o la sblocca.
//   - In PROVA (sandbox) non si scala niente.
//   - Il browser legge solo i dati (fornitore, numero, data, importo). Il file
//     XML sta in una tabella a parte che il browser non puo' leggere.
// ============================================================
const crypto = require('crypto');

const CODICE_DESTINATARIO = 'JKKZDGR';
const URL_AVVISO = 'https://trovaimpresa.com/.netlify/functions/sdi-ricevuta';
const MAX_XML = 5 * 1024 * 1024;

/* il segreto che Openapi ci rimanda quando avvisa: nasce dalla chiave */
function segretoRicevuta(token) {
  return crypto.createHash('sha256').update(String(token) + '|trovaimpresa-sdi-ricevuta').digest('hex');
}

/* ---------- leggere il file XML ---------- */
function tag(xml, nome) {
  const m = new RegExp('<(?:\\w+:)?' + nome + '>\\s*([^<]*?)\\s*</(?:\\w+:)?' + nome + '>').exec(xml);
  return m ? m[1] : '';
}
function pezzo(xml, nome) {
  const m = new RegExp('<(?:\\w+:)?' + nome + '[\\s>][\\s\\S]*?</(?:\\w+:)?' + nome + '>').exec(xml);
  return m ? m[0] : '';
}
const soloPiva = (s) => String(s || '').replace(/^IT/i, '').replace(/\s+/g, '').toUpperCase();
function disescapa(s) {
  return String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function numero2(s) {
  const n = parseFloat(String(s || '').replace(',', '.'));
  return isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/* cosa c'e' scritto in una fattura che ci arriva */
function leggiFattura(xml) {
  xml = String(xml || '');
  const ced = pezzo(xml, 'CedentePrestatore');
  const com = pezzo(xml, 'CessionarioCommittente');
  const anagr = pezzo(ced, 'Anagrafica');
  let nome = disescapa(tag(anagr, 'Denominazione'));
  if (!nome) nome = (disescapa(tag(anagr, 'Nome')) + ' ' + disescapa(tag(anagr, 'Cognome'))).trim();
  const fornPiva = soloPiva(tag(pezzo(ced, 'IdFiscaleIVA'), 'IdCodice')) || soloPiva(tag(ced, 'CodiceFiscale'));
  const comPiva = soloPiva(tag(pezzo(com, 'IdFiscaleIVA'), 'IdCodice'));
  const comCf = soloPiva(tag(com, 'CodiceFiscale'));
  const dg = pezzo(xml, 'DatiGeneraliDocumento');
  let importo = numero2(tag(dg, 'ImportoTotaleDocumento'));
  if (importo == null) {
    /* niente totale scritto: imponibile + imposta di ogni riepilogo */
    let somma = 0, trovato = false;
    const re = /<(?:\w+:)?DatiRiepilogo>[\s\S]*?<\/(?:\w+:)?DatiRiepilogo>/g;
    let m;
    while ((m = re.exec(xml))) {
      const a = numero2(tag(m[0], 'ImponibileImporto')), b = numero2(tag(m[0], 'Imposta'));
      if (a != null) { somma += a; trovato = true; }
      if (b != null) { somma += b; trovato = true; }
    }
    if (trovato) importo = Math.round(somma * 100) / 100;
  }
  let data = tag(dg, 'Data');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) data = null;
  return {
    fornitore_nome: nome || null,
    fornitore_piva: fornPiva || null,
    committente_piva: comPiva || null,
    committente_cf: comCf || null,
    numero: tag(dg, 'Numero') || null,
    data,
    importo,
    tipo_documento: tag(dg, 'TipoDocumento') || null
  };
}

/* ---------- parlare con Openapi ---------- */
async function chiama(base, token, metodo, percorso, corpo, tipo, accetta) {
  const r = await fetch(base.replace(/\/+$/, '') + percorso, {
    method: metodo,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': tipo || 'application/json',
      'Accept': accetta || 'application/json'
    },
    body: corpo == null ? undefined : (typeof corpo === 'string' ? corpo : JSON.stringify(corpo))
  });
  const testo = await r.text();
  let json = null; try { json = JSON.parse(testo); } catch (_) {}
  return { ok: r.ok, status: r.status, json, testo };
}

/* il file della fattura (xml / pdf) com'e' su Openapi */
async function scaricaDaOpenapi(base, token, uuid, accetta) {
  const r = await fetch(base.replace(/\/+$/, '') + '/invoices_download/' + encodeURIComponent(uuid), {
    headers: { 'Authorization': 'Bearer ' + token, 'Accept': accetta }
  });
  const buf = Buffer.from(await r.arrayBuffer());
  return { ok: r.ok, status: r.status, buf };
}

/* ---------- l'impresa e il suo piano ---------- */
async function incluso(db, uid) {
  const { data: imp } = await db.from('imprese').select('chat_pro,chat_pro_scadenza').eq('user_id', uid).maybeSingle();
  const scad = imp && imp.chat_pro_scadenza ? new Date(imp.chat_pro_scadenza).getTime() : null;
  return !!(imp && imp.chat_pro && (scad === null || scad >= Date.now()));
}

/* l'invio da scalare: true = sbloccata */
async function sbloccaConCredito(db, uid, ambiente) {
  if (ambiente !== 'prod') return true;
  if (await incluso(db, uid)) return true;
  const { data: ok } = await db.rpc('sdi_usa_credito', { p_user: uid });
  return !!ok;
}

/* ============================================================
   AZIONI DAL GESTIONALE (le chiama sdi.js, con l'utente gia' riconosciuto)
   ============================================================ */

/* a che punto siamo */
async function stato(db, uid, ambiente) {
  const { data: r } = await db.from('gest_sdi_ricezione').select('fiscal_id,ambiente,attivata_il')
    .eq('user_id', uid).eq('ambiente', ambiente).maybeSingle();
  const { data: cr } = await db.from('sdi_crediti').select('residuo').eq('user_id', uid).maybeSingle();
  const inc = await incluso(db, uid);
  const { count } = await db.from('gest_fatture_ricevute').select('id', { count: 'exact', head: true })
    .eq('user_id', uid).eq('ambiente', ambiente).eq('vista', false);
  return { ok: true, ambiente, attiva: !!r, codice: CODICE_DESTINATARIO, incluso: inc, residuo: cr ? cr.residuo : 0, nuove: count || 0 };
}

/* accende la ricezione: dice a Openapi dove avvisarci per questa partita IVA */
async function attiva(db, ctx) {
  const { BASE, TOKEN, AMBIENTE, uid, piva, az, assicura } = ctx;
  if (!piva) return { status: 400, body: { error: 'Manca la tua partita IVA in Dati azienda.' } };

  /* la partita IVA deve esistere su Openapi (la crea l'invio; qui la prepariamo se manca) */
  const err = await assicura(db, BASE, TOKEN, AMBIENTE, uid, az || {}, piva);
  if (err) return { status: 502, body: { error: err } };

  const nostro = {
    event: 'supplier-invoice', url: URL_AVVISO,
    auth_header: 'Bearer ' + segretoRicevuta(TOKEN), field: 'data'
  };

  /* c'e' gia' una configurazione per questa partita IVA (quella dell'esito
     delle fatture inviate)? Si tiene, e ci si aggiunge il nostro avviso. */
  let vecchia = null;
  const g = await chiama(BASE, TOKEN, 'GET', '/api_configurations?fiscal_id=' + encodeURIComponent(piva));
  if (g.ok && g.json) {
    const lista = Array.isArray(g.json.data) ? g.json.data : (Array.isArray(g.json) ? g.json : []);
    vecchia = lista.find(x => x && (String(x.id) === piva || String(x.fiscal_id) === piva)) || null;
  }
  const callbacks = ((vecchia && Array.isArray(vecchia.callbacks)) ? vecchia.callbacks : [])
    .filter(c => c && c.event !== 'supplier-invoice').concat([nostro]);

  if (vecchia) {
    const d = await chiama(BASE, TOKEN, 'DELETE', '/api_configurations/' + encodeURIComponent(vecchia.id || piva));
    if (!d.ok && d.status !== 404) {
      return { status: 502, body: { error: 'Openapi non ha aggiornato la configurazione: ' + ((d.json && (d.json.message || d.json.error)) || ('errore ' + d.status)) } };
    }
  }
  const c = await chiama(BASE, TOKEN, 'POST', '/api_configurations', { fiscal_id: piva, callbacks });
  if (!c.ok) {
    /* si rimette com'era, per non lasciare l'invio senza avvisi */
    if (vecchia && Array.isArray(vecchia.callbacks) && vecchia.callbacks.length) {
      await chiama(BASE, TOKEN, 'POST', '/api_configurations', { fiscal_id: piva, callbacks: vecchia.callbacks });
    }
    return { status: 502, body: { error: 'Openapi non ha acceso la ricezione: ' + ((c.json && (c.json.message || c.json.error)) || c.testo.slice(0, 300) || ('errore ' + c.status)) } };
  }

  const { error: eu } = await db.from('gest_sdi_ricezione').upsert(
    { user_id: uid, fiscal_id: piva, ambiente: AMBIENTE, attivata_il: new Date().toISOString() },
    { onConflict: 'user_id' });
  if (eu) {
    if (/duplicate|unique/i.test(eu.message || '')) {
      return { status: 409, body: { error: 'Questa partita IVA e\' gia\' collegata a un altro account.' } };
    }
    return { status: 500, body: { error: 'Non riesco a salvare l\'attivazione. Riprova fra poco.' } };
  }
  return { status: 200, body: await stato(db, uid, AMBIENTE) };
}

/* solo in PROVA: Openapi ci manda una fattura finta, per vedere che arriva */
async function prova(db, ctx) {
  const { BASE, TOKEN, AMBIENTE, uid, piva } = ctx;
  if (AMBIENTE !== 'test') return { status: 400, body: { error: 'La fattura di prova esiste solo in prova.' } };
  const { data: r } = await db.from('gest_sdi_ricezione').select('user_id').eq('user_id', uid).eq('ambiente', AMBIENTE).maybeSingle();
  if (!r) return { status: 400, body: { error: 'Prima attiva la ricezione.' } };
  const n = String(Math.floor(Date.now() / 1000) % 100000);
  const oggi = new Date().toISOString().slice(0, 10);
  const corpo = {
    fattura_elettronica_header: {
      dati_trasmissione: { codice_destinatario: CODICE_DESTINATARIO },
      cedente_prestatore: {
        dati_anagrafici: {
          id_fiscale_iva: { id_paese: 'IT', id_codice: '12345678901' },
          anagrafica: { denominazione: 'Fornitore di Prova Srl' },
          regime_fiscale: 'RF01'
        },
        sede: { indirizzo: 'Via Roma 1', cap: '00100', comune: 'Roma', provincia: 'RM', nazione: 'IT' }
      },
      cessionario_committente: {
        dati_anagrafici: { id_fiscale_iva: { id_paese: 'IT', id_codice: piva }, anagrafica: { denominazione: 'Impresa di prova' } },
        sede: { indirizzo: 'Via Milano 2', cap: '00100', comune: 'Roma', provincia: 'RM', nazione: 'IT' }
      }
    },
    fattura_elettronica_body: [{
      dati_generali: { dati_generali_documento: { tipo_documento: 'TD01', divisa: 'EUR', data: oggi, numero: 'PROVA-' + n } },
      dati_beni_servizi: {
        dettaglio_linee: [{ numero_linea: 1, descrizione: 'Materiale edile (fattura di prova)', prezzo_unitario: '100.00', prezzo_totale: '100.00', aliquota_iva: '22.00' }],
        dati_riepilogo: [{ aliquota_iva: '22.00', imponibile_importo: '100.00', imposta: '22.00' }]
      }
    }]
  };
  const s = await chiama(BASE, TOKEN, 'POST', '/simulate-supplier-invoice', corpo);
  if (!s.ok) return { status: 502, body: { error: 'Openapi non ha mandato la fattura di prova: ' + ((s.json && (s.json.message || s.json.error)) || ('errore ' + s.status)) } };
  return { status: 200, body: { ok: true } };
}

async function laMia(db, uid, id) {
  const { data: r } = await db.from('gest_fatture_ricevute').select('*').eq('id', id).eq('user_id', uid).maybeSingle();
  return r || null;
}

/* sblocca una fattura: scala 1 invio (se serve) */
async function sblocca(db, uid, id) {
  const r = await laMia(db, uid, id);
  if (!r) return { status: 404, body: { error: 'Fattura non trovata.' } };
  if (r.sbloccata) return { status: 200, body: { ok: true, ricevuta: r } };
  const ok = await sbloccaConCredito(db, uid, r.ambiente);
  if (!ok) return { status: 402, body: { error: 'Non hai invii a disposizione. Con il gestionale a pagamento sono compresi; nel gestionale gratuito si comprano a pacchetto.', codice: 'serve_pacchetto' } };
  const { data: agg } = await db.from('gest_fatture_ricevute').update({ sbloccata: true }).eq('id', id).eq('user_id', uid).select('*').maybeSingle();
  return { status: 200, body: { ok: true, ricevuta: agg || r } };
}

async function segnaVista(db, uid, id, vista) {
  const r = await laMia(db, uid, id);
  if (!r) return { status: 404, body: { error: 'Fattura non trovata.' } };
  await db.from('gest_fatture_ricevute').update({ vista: !!vista }).eq('id', id).eq('user_id', uid);
  return { status: 200, body: { ok: true } };
}

/* il file: xml (quello che abbiamo salvato) o pdf (lo fa Openapi) */
async function file(db, ctx, id, formato) {
  const { BASE, TOKEN, uid } = ctx;
  const r = await laMia(db, uid, id);
  if (!r) return { status: 404, body: { error: 'Fattura non trovata.' } };
  if (!r.sbloccata) return { status: 402, body: { error: 'Questa fattura e\' da sbloccare: usa 1 invio.', codice: 'da_sbloccare' } };
  const nomeBase = ('fattura-ricevuta-' + (r.fornitore_nome || 'fornitore') + '-' + (r.numero || '')).replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 80);
  if (formato === 'xml') {
    const { data: f } = await db.from('gest_fatture_ricevute_file').select('xml').eq('ricevuta_id', id).maybeSingle();
    if (!f) return { status: 404, body: { error: 'Il file non c\'e\'.' } };
    return { status: 200, body: { ok: true, nome: nomeBase + '.xml', tipo: 'application/xml', base64: Buffer.from(f.xml, 'utf8').toString('base64') } };
  }
  const p = await scaricaDaOpenapi(BASE, TOKEN, r.sdi_uuid, 'application/pdf');
  if (!p.ok || p.buf.length < 100 || p.buf.slice(0, 4).toString() !== '%PDF') {
    return { status: 502, body: { error: 'Openapi non ha preparato il PDF. Scarica il file XML.' } };
  }
  return { status: 200, body: { ok: true, nome: nomeBase + '.pdf', tipo: 'application/pdf', base64: p.buf.toString('base64') } };
}

/* ============================================================
   L'AVVISO DI OPENAPI (lo chiama sdi-ricevuta.js)
   ============================================================ */
function trovaUuid(o, d) {
  if (!o || typeof o !== 'object' || (d || 0) > 5) return null;
  if (o.invoice && typeof o.invoice.uuid === 'string') return o.invoice.uuid;
  if (typeof o.invoice_uuid === 'string') return o.invoice_uuid;
  for (const k of Object.keys(o)) {
    const r = trovaUuid(o[k], (d || 0) + 1);
    if (r) return r;
  }
  return null;
}

/* ritorna {status, body}. 5xx = Openapi riprova piu' tardi; 200 = fatto o non nostra. */
async function ricevi(db, ctx, corpo) {
  const { BASE, TOKEN, AMBIENTE } = ctx;
  const uuid = trovaUuid(corpo);
  if (!uuid) return { status: 200, body: 'ok' };

  const dl = await scaricaDaOpenapi(BASE, TOKEN, uuid, 'application/xml');
  if (!dl.ok || !dl.buf.length) return { status: 502, body: 'xml' };   /* riprova piu' tardi */
  if (dl.buf.length > MAX_XML) return { status: 200, body: 'troppo grande' };
  const xml = dl.buf.toString('utf8');
  if (!/FatturaElettronica/.test(xml)) return { status: 200, body: 'non e\' una fattura' };

  const f = leggiFattura(xml);
  const piva = f.committente_piva || f.committente_cf;
  if (!piva) return { status: 200, body: 'senza destinatario' };

  const { data: ric } = await db.from('gest_sdi_ricezione').select('user_id')
    .eq('fiscal_id', piva).eq('ambiente', AMBIENTE).maybeSingle();
  if (!ric) return { status: 200, body: 'non e\' di nessuno di noi' };
  const uid = ric.user_id;

  /* gia' arrivata? (Openapi puo' avvisare due volte) */
  const { data: gia } = await db.from('gest_fatture_ricevute').select('id').eq('user_id', uid).eq('sdi_uuid', uuid).maybeSingle();
  if (gia) return { status: 200, body: 'gia\' fatta' };

  const sbloccata = await sbloccaConCredito(db, uid, AMBIENTE);
  const { data: riga, error } = await db.from('gest_fatture_ricevute').insert({
    user_id: uid, sdi_uuid: uuid, ambiente: AMBIENTE,
    fornitore_nome: f.fornitore_nome, fornitore_piva: f.fornitore_piva,
    numero: f.numero, data: f.data, importo: f.importo, tipo_documento: f.tipo_documento,
    sbloccata
  }).select('id').maybeSingle();
  if (error || !riga) {
    /* il credito scalato si rimette, e Openapi riprova */
    if (sbloccata && AMBIENTE === 'prod' && !(await incluso(db, uid))) await db.rpc('sdi_rimborsa_credito', { p_user: uid });
    if (error && /duplicate|unique/i.test(error.message || '')) return { status: 200, body: 'gia\' fatta' };
    return { status: 500, body: 'salvataggio' };
  }
  const { error: ef } = await db.from('gest_fatture_ricevute_file').insert({ ricevuta_id: riga.id, user_id: uid, xml });
  if (ef) {
    await db.from('gest_fatture_ricevute').delete().eq('id', riga.id);
    if (sbloccata && AMBIENTE === 'prod' && !(await incluso(db, uid))) await db.rpc('sdi_rimborsa_credito', { p_user: uid });
    return { status: 500, body: 'file' };
  }
  return { status: 200, body: 'ok' };
}

module.exports = {
  CODICE_DESTINATARIO, segretoRicevuta, leggiFattura, trovaUuid,
  stato, attiva, prova, sblocca, segnaVista, file, ricevi
};
