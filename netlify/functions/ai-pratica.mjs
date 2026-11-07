// =====================================================================
// ✨ AI DELLA PRATICA — 7 novembre 2026 (studio tecnico)
//
// Il geometra scrive la pratica a parole («CILA bagno Rossi via Roma 3
// Rieti, depositata ieri prot. 4567») oppure FOTOGRAFA un documento
// (ricevuta di deposito del SUE, visura catastale, lettera del Comune) e
// qui escono le caselle del modulo della pratica. 1 credito AI.
//
// ⛔ Stesse regole di ai-cantiere (Supabase): chi chiama lo dice il
//    gettone, il credito si scala PRIMA dell'AI e si rimborsa se l'AI non
//    risponde, l'AI non scrive mai nel database. Sta su Netlify e non dentro
//    ai-cantiere solo per non ridistribuire a mano una funzione che regge
//    fatture dei fornitori, fisco e voce.
// ⛔ Tipo e stato sono elenchi CHIUSI (uguali a PRATICA_TIPI / PRATICA_STATI
//    di js/gest-scadenze-pratiche.js): la risposta passa da `pulisci`, e
//    una parola fuori elenco si butta. Protocollo e catasto SOLO se scritti.
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const MODELLO = 'claude-haiku-4-5-20251001';
const EUR_IN = 0.92, EUR_OUT = 4.60;           // € per milione di gettoni (come ai-cantiere)
const BASE64_MAX = 7000000;                     // ~5 MB
const TIPI_FILE = { 'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'application/pdf': 'document' };
const SOLO_BASE64 = /^[A-Za-z0-9+/=\r\n]+$/;

export const PRATICA_TIPI = ['CILA', 'CILAS', 'SCIA', 'SCIA alternativa al PdC', 'Permesso di Costruire', 'Autorizzazione paesaggistica', "Agibilita'", 'Sanatoria', 'Accatastamento', 'Voltura', 'Altro'];
export const PRATICA_STATI = ['da_preparare', 'depositata', 'istruttoria', 'integrazioni', 'approvata', 'archiviata'];
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export function istruzioni(oggi) {
  return `Estrai i dati di una PRATICA EDILIZIA di uno studio tecnico italiano (geometra, ingegnere, architetto) da quello che scrive l'utente e, se c'e', dal documento allegato (ricevuta di deposito del SUE/SUAP, visura o planimetria catastale, comunicazione del Comune, richiesta di integrazioni).
Oggi e' ${oggi} (formato AAAA-MM-GG).

Rispondi SOLO con questo JSON, senza testo attorno:
{"leggibile":true,"descrizione":"","dove":"","data":"","importo":null,"cliente":"","pratica_tipo":"","pratica_stato":"","pratica_comune":"","pratica_protocollo":"","pratica_data_dep":"","catasto_foglio":"","catasto_particella":"","catasto_sub":"","nota":""}

Regole:
- "descrizione": la pratica in una riga, con la maiuscola (es. "CILA per rifacimento bagno").
- "dove": indirizzo dell'immobile, se c'e'.
- "data": la data prevista per il lavoro dello studio, AAAA-MM-GG, SOLO se detta. Altrimenti vuota.
- "importo": l'onorario, numero senza simboli, SOLO se detto. Altrimenti null.
- "cliente": il committente/proprietario, se nominato, con le iniziali maiuscole.
- "pratica_tipo": UNA di queste parole esatte, altrimenti vuota: ${PRATICA_TIPI.map(t => '"' + t + '"').join(', ')}. PdC = "Permesso di Costruire"; SCA o agibilita' = "Agibilita'"; DOCFA = "Accatastamento".
- "pratica_stato": UNA di queste, altrimenti vuota: ${PRATICA_STATI.map(t => '"' + t + '"').join(', ')}. Ricevuta di deposito o "depositata/protocollata" = "depositata"; richiesta di integrazioni del Comune = "integrazioni"; titolo rilasciato o approvato = "approvata".
- "pratica_comune": il Comune della pratica (es. "Rieti"), senza "Comune di".
- "pratica_protocollo": il numero di protocollo COME E' SCRITTO. SOLO se scritto davvero.
- "pratica_data_dep": la data di deposito o di protocollo AAAA-MM-GG, se scritta o detta ("ieri" si converte partendo da oggi).
- "catasto_foglio", "catasto_particella" (o mappale), "catasto_sub" (subalterno): solo come sono scritti.
- "nota": UNA frase corta con la cosa importante che non sta nelle caselle (es. "Il Comune chiede le integrazioni entro 30 giorni dal 03/11/2026"). Vuota se non serve.
- Se c'e' un documento allegato che non si legge o non e' una pratica edilizia: {"leggibile":false}.
- NON INVENTARE MAI: un campo non letto o non detto resta vuoto (o null). Un protocollo o un foglio catastale inventati sono peggio di una casella vuota.`;
}

/* pura: tiene solo quello che sta nelle forme giuste — il banco la prova da sola */
export function pulisci(d) {
  const x = (d && typeof d === 'object') ? d : {};
  if (x.leggibile === false) return { leggibile: false };
  const t = v => (v == null ? '' : String(v).trim());
  const fuori = { leggibile: true };
  ['descrizione', 'dove', 'cliente', 'pratica_comune', 'pratica_protocollo', 'nota'].forEach(k => { const v = t(x[k]).slice(0, 300); if (v) fuori[k] = v; });
  ['catasto_foglio', 'catasto_particella', 'catasto_sub'].forEach(k => { const v = t(x[k]).slice(0, 20); if (v) fuori[k] = v; });
  ['data', 'pratica_data_dep'].forEach(k => { const v = t(x[k]); if (DATA.test(v)) fuori[k] = v; });
  const norm = v => v.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  const tipo = PRATICA_TIPI.find(p => norm(p) === norm(t(x.pratica_tipo)));
  if (tipo && t(x.pratica_tipo)) fuori.pratica_tipo = tipo;
  const st = t(x.pratica_stato).toLowerCase();
  if (PRATICA_STATI.indexOf(st) >= 0) fuori.pratica_stato = st;
  const imp = Number(x.importo);
  if (x.importo !== null && x.importo !== '' && isFinite(imp) && imp > 0 && imp < 10000000) fuori.importo = imp;
  return fuori;
}

const rispondi = (codice, corpo) => new Response(JSON.stringify(corpo), { status: codice, headers: { 'Content-Type': 'application/json' } });

export default async function (req) {
  if (req.method !== 'POST') return rispondi(405, { error: 'Method Not Allowed' });
  const URL_SB = process.env.SUPABASE_URL, SERVIZIO = process.env.SUPABASE_SERVICE_KEY;
  const ANON = (process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.startsWith('eyJ'))
    ? process.env.SUPABASE_ANON_KEY : 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  if (!URL_SB || !SERVIZIO || !process.env.ANTHROPIC_API_KEY) return rispondi(500, { error: 'Configurazione server mancante.' });

  let corpo;
  try { corpo = JSON.parse((await req.text()) || '{}'); } catch { return rispondi(400, { error: 'Richiesta non valida.' }); }
  const testo = String(corpo.testo || '').trim().slice(0, 3000);
  const file = corpo.file || null;
  if (!testo && !file) return rispondi(400, { error: 'Scrivi due righe o fotografa un documento, e riprovo.' });

  // ⛔ il file si controlla PRIMA di scalare il credito: un file sbagliato non si paga
  let blocco = null;
  if (file) {
    const tipo = String(file.tipo || '').toLowerCase();
    const dati = typeof file.dati === 'string' ? file.dati.replace(/\s+/g, '') : '';
    if (!TIPI_FILE[tipo]) return rispondi(400, { error: 'Vanno bene le foto (JPG, PNG, WEBP) e i PDF.' });
    if (!dati || !SOLO_BASE64.test(dati)) return rispondi(400, { error: 'Il file non è arrivato intero. Riprova.' });
    if (dati.length > BASE64_MAX) return rispondi(400, { error: 'Il file è troppo grande: massimo 5 MB.' });
    blocco = { type: TIPI_FILE[tipo], source: { type: 'base64', media_type: tipo, data: dati } };
  }

  const aut = req.headers.get('authorization') || '';
  const token = aut.startsWith('Bearer ') ? aut.slice(7).trim() : '';
  if (!token) return rispondi(401, { error: 'Sessione scaduta: rientra e riprova.' });
  const servizio = createClient(URL_SB, SERVIZIO);
  const { data: chi } = await servizio.auth.getUser(token).catch(() => ({ data: null }));
  if (!chi || !chi.user) return rispondi(401, { error: 'Sessione scaduta: rientra e riprova.' });
  const utente = createClient(URL_SB, ANON, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false } });

  // ---- il credito, PRIMA dell'AI (col gettone suo: dentro c'e' auth.uid())
  let consumo;
  try {
    const r = await utente.rpc('consume_ai_credit', { p_feature: 'dati_pratica', p_cost: 1 });
    if (r.error) throw r.error;
    consumo = r.data;
  } catch (e) { console.error('[ai-pratica] crediti:', e && e.message); return rispondi(500, { error: 'Non riesco a controllare i crediti. Riprova.' }); }
  if (!consumo || !consumo.ok) {
    const mess = { plan_without_ai: 'Le funzioni AI non sono incluse nel tuo piano.', no_credits: 'Hai esaurito i crediti AI di questo mese.', subscription_expired: 'Il tuo abbonamento è scaduto.', no_account: 'Account non trovato.' };
    return rispondi(402, { error: mess[consumo && consumo.reason] || 'Funzione non disponibile', reason: consumo && consumo.reason, remaining: (consumo && consumo.remaining) || 0 });
  }
  const logId = consumo.log_id || null;

  let oggi;
  try { oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); } catch { oggi = new Date().toISOString().slice(0, 10); }

  try {
    const domanda = testo || 'Leggi il documento e riempi le caselle della pratica.';
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODELLO, max_tokens: 700, system: istruzioni(oggi),
        messages: [{ role: 'user', content: blocco ? [blocco, { type: 'text', text: domanda }] : domanda }]
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!r.ok) throw new Error('AI ' + r.status + ': ' + (await r.text()).slice(0, 200));
    const d = await r.json();
    let t = (d.content && d.content[0] && d.content[0].text) || '';
    t = t.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const pulito = pulisci(JSON.parse(t));
    const tin = (d.usage && d.usage.input_tokens) || 0, tout = (d.usage && d.usage.output_tokens) || 0;
    if (logId) {
      await servizio.rpc('settle_ai_usage', { p_log_id: logId, p_input_tokens: tin, p_output_tokens: tout,
        p_cost_eur: Number(((tin / 1e6) * EUR_IN + (tout / 1e6) * EUR_OUT).toFixed(5)) }).then(() => {}, () => {});
    }
    return rispondi(200, { ok: true, dati: pulito, remaining: consumo.remaining });
  } catch (e) {
    console.error('[ai-pratica] AI:', e && e.message);
    if (logId) await servizio.rpc('refund_ai_credit', { p_log_id: logId, p_error: String(e && e.message).slice(0, 300) }).then(() => {}, () => {});
    return rispondi(502, { error: 'L\'assistente non ha risposto. Il credito è stato rimborsato, riprova.' });
  }
}
