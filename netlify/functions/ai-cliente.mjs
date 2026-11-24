// =====================================================================
// ✨ AI DEL CLIENTE — 17 novembre 2026 (voce Clienti)
//
// «Scrivilo a parole e te lo riempio io» nel modulo del cliente. Prima
// passava da `dati_cliente` di ai-generate (Supabase), che rispondeva con
// QUATTRO chiavi sole (nome, indirizzo, referente, telefono): email, CAP,
// citta', partita IVA e codice SDI detti dall'utente si perdevano, e una
// Srl restava «Privato». Provato dal vivo il 17 nov.
//
// ⛔ Sta su Netlify e non dentro ai-generate per lo stesso motivo di
//    ai-pratica: non ridistribuire a mano una funzione che regge i
//    preventivi e il controllo dei documenti. `dati_cliente` di ai-generate
//    resta com'e' (la usa ancora la finestrella vecchia, se mai servisse).
// ⛔ Stesse regole: chi chiama lo dice il gettone, il credito si scala
//    PRIMA dell'AI e si rimborsa se l'AI non risponde, l'AI non scrive mai
//    nel database. La risposta passa da `pulisci`: una partita IVA o un
//    CAP che non hanno la forma giusta NON si buttano (li ha detti lui: si
//    vedono nel modulo e il controllo li segna), ma niente si inventa.
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const MODELLO = 'claude-haiku-4-5-20251001';
const EUR_IN = 0.92, EUR_OUT = 4.60;           // € per milione di gettoni (come ai-pratica)
export const TIPI = ['privato', 'azienda', 'condominio', 'ente'];
export const CASELLE = ['nome', 'indirizzo', 'cap', 'citta', 'prov', 'referente', 'telefono', 'email', 'piva', 'cod_fiscale', 'sdi_codice', 'pec', 'note'];

export function istruzioni() {
  return `Estrai i dati di un cliente (una persona, una ditta o un condominio) dal testo dell'utente, per la rubrica di un'impresa edile o di un artigiano italiano.

Rispondi SOLO con questo JSON, senza testo attorno:
{"nome":"","tipo":"","indirizzo":"","cap":"","citta":"","prov":"","referente":"","telefono":"","email":"","piva":"","cod_fiscale":"","sdi_codice":"","pec":"","note":""}

Regole:
- "nome": il condominio, la ragione sociale o il nome della persona.
- "tipo": "azienda" se e' una ditta o una societa' (Srl, Spa, Snc, Sas, ditta, impresa, studio, oppure ha la partita IVA); "condominio" se e' un condominio; "ente" se e' un ente pubblico (Comune, Provincia, Regione, scuola, ASL, universita'); "privato" se e' una persona. Se non si capisce, stringa vuota.
- "referente": l'amministratore o la persona di contatto, se diversa dal nome.
- "telefono": solo cifre, spazi e +.
- "indirizzo": SOLO via e numero civico (scala e piano se detti). La citta' NON va qui.
- "cap": solo se e' scritto nel testo. NON ricavarlo dalla citta'.
- "citta": il comune. "prov": la sigla di 2 lettere, solo se e' scritta nel testo oppure se la citta' e' un capoluogo di provincia (Rieti -> RI, Milano -> MI). Se hai un dubbio, stringa vuota.
- "email": l'email normale. "pec": solo se nel testo e' chiamata PEC o l'indirizzo contiene "pec".
- "piva" e "cod_fiscale": ricopiali come sono scritti, senza "IT" e senza spazi, anche se ti sembrano sbagliati. NON correggerli e NON completarli.
- "sdi_codice": il codice destinatario per la fattura elettronica (di solito 7 caratteri).
- "note": quello che resta e che serve ricordare (orari per chiamare, citofono, come paga). Una frase corta.
- Campo non deducibile = stringa vuota. NON INVENTARE MAI NIENTE: meglio una casella vuota che una sbagliata.
- MAIUSCOLE: sistema le iniziali dei nomi propri anche se l'utente scrive tutto minuscolo ("condominio le betulle" -> "Condominio Le Betulle", "via verdi 12" -> "Via Verdi 12"). Lascia invariate le sigle: SRL, SPA, SNC, SAS.`;
}

/* pura: tiene solo le chiavi che conosciamo, come testo corto — il banco la prova da sola */
export function pulisci(d) {
  const x = (d && typeof d === 'object') ? d : {};
  const t = v => (v == null ? '' : String(v).trim());
  const fuori = {};
  CASELLE.forEach(k => {
    const v = t(x[k]).slice(0, k === 'note' ? 500 : 200);
    if (v) fuori[k] = v;
  });
  const tipo = t(x.tipo).toLowerCase();
  if (TIPI.indexOf(tipo) >= 0) fuori.tipo = tipo;
  if (fuori.prov) { const p = fuori.prov.toUpperCase(); if (/^[A-Z]{2}$/.test(p)) fuori.prov = p; else delete fuori.prov; }
  if (fuori.piva) fuori.piva = fuori.piva.replace(/^IT/i, '').replace(/\s+/g, '');
  if (fuori.cod_fiscale) fuori.cod_fiscale = fuori.cod_fiscale.replace(/\s+/g, '').toUpperCase();
  if (fuori.sdi_codice) fuori.sdi_codice = fuori.sdi_codice.replace(/\s+/g, '').toUpperCase();
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
  // ⛔ un testo vuoto non si paga
  if (testo.length < 3) return rispondi(400, { error: 'Scrivi due righe sul cliente, e riprovo.' });

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
    const r = await utente.rpc('consume_ai_credit', { p_feature: 'dati_cliente', p_cost: 1 });
    if (r.error) throw r.error;
    consumo = r.data;
  } catch (e) { console.error('[ai-cliente] crediti:', e && e.message); return rispondi(500, { error: 'Non riesco a controllare i crediti. Riprova.' }); }
  if (!consumo || !consumo.ok) {
    const mess = { plan_without_ai: 'Le funzioni AI non sono incluse nel tuo piano.', no_credits: 'Hai esaurito i crediti AI di questo mese.', subscription_expired: 'Il tuo abbonamento è scaduto.', no_account: 'Account non trovato.' };
    return rispondi(402, { error: mess[consumo && consumo.reason] || 'Funzione non disponibile', reason: consumo && consumo.reason, remaining: (consumo && consumo.remaining) || 0 });
  }
  const logId = consumo.log_id || null;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODELLO, max_tokens: 600, system: istruzioni(), messages: [{ role: 'user', content: testo }] }),
      signal: AbortSignal.timeout(25000)
    });
    if (!r.ok) throw new Error('AI ' + r.status + ': ' + (await r.text()).slice(0, 200));
    const d = await r.json();
    let t = (d.content && d.content[0] && d.content[0].text) || '';
    t = t.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!t.startsWith('{')) { const i = t.indexOf('{'), j = t.lastIndexOf('}'); if (i >= 0 && j > i) t = t.slice(i, j + 1); }
    const pulito = pulisci(JSON.parse(t));
    const tin = (d.usage && d.usage.input_tokens) || 0, tout = (d.usage && d.usage.output_tokens) || 0;
    if (logId) {
      await servizio.rpc('settle_ai_usage', { p_log_id: logId, p_input_tokens: tin, p_output_tokens: tout,
        p_cost_eur: Number(((tin / 1e6) * EUR_IN + (tout / 1e6) * EUR_OUT).toFixed(5)) }).then(() => {}, () => {});
    }
    return rispondi(200, { ok: true, dati: pulito, remaining: consumo.remaining });
  } catch (e) {
    console.error('[ai-cliente] AI:', e && e.message);
    if (logId) await servizio.rpc('refund_ai_credit', { p_log_id: logId, p_error: String(e && e.message).slice(0, 300) }).then(() => {}, () => {});
    return rispondi(502, { error: 'L\'assistente non ha risposto. Il credito è stato rimborsato, riprova.' });
  }
}
