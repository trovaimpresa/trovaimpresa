// 10 novembre 2026 — IL BOLLINO «VERIFICATA» AUTOMATICO.
// Gira da sola ogni ora (minuto 23). Prende le imprese che hanno scritto la
// P.IVA e non sono ancora state controllate (piva_stato vuoto), e per ognuna:
//   1. CIFRA DI CONTROLLO (gratis): una P.IVA inventata a caso cade qui ->
//      piva_stato = 'non_valida'. Niente bollino.
//   2. REGISTRO IMPRESE con Openapi «Company IT-start» (a pagamento, si
//      accende solo se su Netlify c'e' OPENAPI_COMPANY_TOKEN):
//      trovata e attiva -> 'valida' + verificata = true + nome che risulta;
//      cessata -> 'non_valida'; non trovata -> 'non_trovata' (per esempio un
//      libero professionista senza Camera di Commercio: non e' una truffa,
//      semplicemente niente bollino automatico).
//      Senza il token l'impresa resta «da controllare» e non si tocca.
//
// ⛔ NON si usa l'archivio europeo VIES: conosce solo le P.IVA abilitate al
// commercio con l'estero. Provato il 10/11/2026: la P.IVA di Alessio e quella
// di REDIR SRL, vere tutte e due, risultano «INVALID». Avrebbe spento il
// bollino a quasi tutte le imprese vere.
// ⚠️ Il bollino messo A MANO dall'admin non si spegne mai da qui.
// Le colonne le puo' scrivere solo il server: sql/piva-verificata.sql.

const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

const PER_GIRO = 15;
const PAUSA_MS = 800;
const SCADENZA_MS = 10000;

function cifre(p) { return String(p || '').replace(/\D/g, ''); }

// la cifra di controllo della partita IVA italiana
function controlloFormale(p) {
  if (!/^\d{11}$/.test(p) || p === '00000000000') return false;
  let s = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(p[i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    s += n;
  }
  return (10 - (s % 10)) % 10 === Number(p[10]);
}

// Openapi Company IT-start. Risposta: { success, data:[{ companyName, activityStatus, ... }] }
async function chiediRegistro(p, token, base) {
  const r = await fetch(base + '/IT-start/' + p, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    signal: AbortSignal.timeout(SCADENZA_MS)
  });
  if (r.status === 404) return { stato: 'non_trovata' };
  if (!r.ok) return { errore: 'http ' + r.status };
  const d = await r.json().catch(() => null);
  const x = d && Array.isArray(d.data) ? d.data[0] : (d && d.data) || null;
  if (!x) return { stato: 'non_trovata' };
  const attivita = String(x.activityStatus || x.stato_attivita || '').toUpperCase();
  if (attivita && !/ATTIV/.test(attivita)) return { stato: 'non_valida' };   // CESSATA, SOSPESA...
  return { stato: 'valida', nome: x.companyName || x.denominazione || null };
}

const handler = async function () {
  const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) { console.error('[verifica-piva] configurazione mancante'); return { statusCode: 500 }; }
  const TOKEN = (process.env.OPENAPI_COMPANY_TOKEN || '').trim();
  const BASE = (process.env.OPENAPI_COMPANY_URL || 'https://company.openapi.com').trim().replace(/\/$/, '');
  const sb = createClient(URL, KEY, { auth: { persistSession: false } });

  let q = sb.from('imprese').select('id, partita_iva')
    .is('piva_stato', null)
    .not('partita_iva', 'is', null).neq('partita_iva', '')
    .order('piva_controllata_il', { ascending: true, nullsFirst: true })
    .order('id', { ascending: true })
    .limit(500);   // la cifra di controllo e' gratis: si guardano tutte, Openapi solo PER_GIRO
  const { data: righe, error } = await q;
  if (error) { console.error('[verifica-piva]', error.message); return { statusCode: 500 }; }

  const conti = { valide: 0, non_valide: 0, non_trovate: 0, in_attesa: 0, riprovare: 0 };
  let chiamate = 0;
  for (const imp of righe || []) {
    const p = cifre(imp.partita_iva);
    let esito;
    if (!controlloFormale(p)) esito = { stato: 'non_valida' };
    else if (!TOKEN || chiamate >= PER_GIRO) { conti.in_attesa++; continue; }   // senza Openapi non si decide
    else {
      chiamate++;
      try { esito = await chiediRegistro(p, TOKEN, BASE); } catch (e) { esito = { errore: e.message }; }
      await new Promise(r => setTimeout(r, PAUSA_MS));
    }
    if (esito.errore) { conti.riprovare++; console.log('[verifica-piva] riprovo dopo', imp.id, esito.errore); continue; }

    const patch = { piva_stato: esito.stato, piva_controllata_il: new Date().toISOString(), piva_nome: esito.nome || null };
    if (esito.stato === 'valida') patch.verificata = true;
    // ⛔ si scrive solo se la P.IVA e' ancora quella letta
    const { data: fatto, error: e2 } = await sb.from('imprese').update(patch)
      .eq('id', imp.id).eq('partita_iva', imp.partita_iva).is('piva_stato', null).select('id');
    if (e2) { console.error('[verifica-piva] scrittura', imp.id, e2.message); continue; }
    if (fatto && fatto.length) conti[esito.stato === 'valida' ? 'valide' : esito.stato === 'non_trovata' ? 'non_trovate' : 'non_valide']++;
  }
  console.log('[verifica-piva] giro:', (righe || []).length, 'imprese', JSON.stringify(conti), TOKEN ? '' : '(Openapi spento: solo cifra di controllo)');
  return { statusCode: 200, body: JSON.stringify(conti) };
};

exports.handler = schedule('23 * * * *', handler);
exports._prova = { controlloFormale, cifre, chiediRegistro, handler };
