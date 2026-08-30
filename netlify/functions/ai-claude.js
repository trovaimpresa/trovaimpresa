// =====================================================================
// AI CLAUDE — la function che scrive preventivi e risponde al supporto
//
// ⛔ 21 agosto 2026 — CHI CHIAMA SI RICAVA DALL'ACCESSO, NON DAL BROWSER.
//    Prima l'impresa arrivava come `impresa_id` dentro il messaggio e
//    nessuno controllava chi stesse chiamando. Gli id delle imprese sono
//    pubblici (la vetrina si legge senza account): con l'id di un altro
//    iscritto si bruciavano le sue 30 chiamate al giorno e gli si
//    scrivevano righe in `ai_richieste` — prompt e risposta scelti da chi
//    chiamava — che lui si ritrovava nel pannello.
//    Adesso l'impresa si ricava dal gettone della sessione
//    (`auth.getUser`), come fa gia' crea-checkout-crediti.js, e
//    l'`impresa_id` del messaggio e' IGNORATO.
//
// ⚠️ I quattro pannelli mandano gia' l'intestazione `Authorization:
//    Bearer <token>` tramite `_aiIntestazioni()` (12 punti, gia' online).
//    Una chiamata nuova a questa function che non passa da li' torna 401
//    — ed e' giusto cosi'.
//
// ⚠️ TEMPO MASSIMO 4 SECONDI sui due controlli d'accesso (chi sei, quale
//    impresa sei): se Supabase non risponde la function NON resta appesa,
//    risponde 401 e chiude. Meglio un "rientra e riprova" che un timeout.
//
// ⚠️ La scadenza del Premium adesso si controlla: prima chi aveva finito
//    i tre mesi continuava a usare l'AI finche' il controllo notturno non
//    passava.
// =====================================================================
const { createClient } = require('@supabase/supabase-js');

const PIANI_OK = ['premium', 'mensile', 'annuale'];
const TEMPO_ACCESSO = 4000;   // ms — tetto sui controlli d'accesso
const TETTO_GIORNO = 30;      // chiamate al giorno per impresa

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

// Promise con tempo massimo: se scade, si va avanti con un errore chiaro
// invece di restare appesi. Il timer viene sempre spento.
function conTempo(promessa, ms, etichetta) {
  let t;
  const scaduta = new Promise((_, rifiuta) => {
    t = setTimeout(() => rifiuta(new Error('tempo scaduto: ' + etichetta)), ms);
    if (t && typeof t.unref === 'function') t.unref();
  });
  return Promise.race([promessa, scaduta]).finally(() => clearTimeout(t));
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return rispondi(405, { error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return rispondi(500, { error: 'Configurazione server mancante.' });
  }

  const intestazioni = event.headers || {};
  const ip = intestazioni['x-forwarded-for']?.split(',')[0]?.trim()
    || intestazioni['client-ip']
    || null;

  let azione, prompt;
  try {
    ({ azione, prompt } = JSON.parse(event.body || '{}'));
  } catch {
    return rispondi(400, { error: 'Body JSON non valido.' });
  }
  // ⚠️ `impresa_id` puo' arrivare nel messaggio (i pannelli lo mandano
  //    ancora) ma NON viene letto: l'impresa si ricava dall'accesso.

  if (!azione || !prompt) {
    return rispondi(400, { error: 'Parametri mancanti: azione e prompt sono obbligatori.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ---- 1. chi sta chiamando -----------------------------------------
  const autorizzazione = intestazioni.authorization || intestazioni.Authorization || '';
  const token = autorizzazione.startsWith('Bearer ') ? autorizzazione.slice(7).trim() : '';
  if (!token) {
    return rispondi(401, { error: 'Devi essere collegato per usare l’AI. Rientra e riprova.' });
  }

  let utente = null;
  try {
    const { data: chi, error: erroreChi } = await conTempo(
      supabase.auth.getUser(token), TEMPO_ACCESSO, 'getUser'
    );
    utente = chi && chi.user;
    if (erroreChi || !utente || !utente.id) utente = null;
  } catch (e) {
    console.error('[ai-claude] accesso non verificato:', e && e.message);
    utente = null;
  }
  if (!utente) {
    return rispondi(401, { error: 'La sessione è scaduta. Rientra e riprova.' });
  }

  // ---- 2. quale impresa e' -------------------------------------------
  // Prima per user_id. Se la riga non e' ancora allineata (succede a chi
  // si e' iscritto prima dell'account), si ripiega sull'email DELL'ACCESSO
  // — non su quella che manda il browser, che si potrebbe scrivere a mano.
  let impresa = null;
  try {
    const perId = await conTempo(
      supabase.from('imprese')
        .select('id, piano, premium_scadenza')
        .eq('user_id', utente.id)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle(),
      TEMPO_ACCESSO, 'imprese/user_id'
    );
    impresa = (perId && perId.data) || null;

    if (!impresa && utente.email) {
      const perEmail = await conTempo(
        supabase.from('imprese')
          .select('id, piano, premium_scadenza')
          .eq('email', utente.email)
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle(),
        TEMPO_ACCESSO, 'imprese/email'
      );
      impresa = (perEmail && perEmail.data) || null;
    }
  } catch (e) {
    console.error('[ai-claude] impresa non letta:', e && e.message);
    return rispondi(401, { error: 'Non riesco a verificare il tuo account adesso. Riprova fra poco.' });
  }

  if (!impresa || !impresa.id) {
    return rispondi(404, { error: 'Impresa non trovata.' });
  }

  const impresaId = impresa.id;   // ⚠️ l'unico id usato da qui in giu'

  const logRichiesta = async (extra) => {
    try {
      await supabase.from('ai_richieste').insert({
        impresa_id: impresaId,
        azione,
        prompt_input: prompt,
        risposta: extra.risposta ?? null,
        tokens_input: extra.tokens_input ?? 0,
        tokens_output: extra.tokens_output ?? 0,
        costo_usd: extra.costo_usd ?? 0,
        errore: extra.errore ?? null,
        ip_address: ip
      });
    } catch (e) {
      console.error('[ai-claude] log fallito:', e.message);
    }
  };

  try {
    // ---- 3. il Premium, scadenza compresa -----------------------------
    const piano = String(impresa.piano || '').trim().toLowerCase();
    if (!PIANI_OK.includes(piano)) {
      await logRichiesta({ errore: 'Piano Free' });
      return rispondi(403, { error: 'AI solo Premium' });
    }

    const scad = impresa.premium_scadenza ? new Date(impresa.premium_scadenza) : null;
    if (scad && !isNaN(scad.getTime()) && scad.getTime() <= Date.now()) {
      await logRichiesta({ errore: 'Premium scaduto' });
      return rispondi(403, { error: 'Il tuo Premium è scaduto. Rinnovalo per usare l’AI.' });
    }

    // ---- 4. il tetto giornaliero, sull'impresa VERA -------------------
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: cntErr } = await supabase
      .from('ai_richieste')
      .select('*', { count: 'exact', head: true })
      .eq('impresa_id', impresaId)
      .gte('creato_il', since);

    if (cntErr) {
      await logRichiesta({ errore: 'Errore conteggio: ' + cntErr.message });
      return rispondi(500, { error: cntErr.message });
    }

    if ((count ?? 0) >= TETTO_GIORNO) {
      await logRichiesta({ errore: 'Limite giornaliero raggiunto' });
      return rispondi(429, { error: 'Limite giornaliero raggiunto' });
    }

    // ---- 5. il modello ------------------------------------------------
    const apiBody = {
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    };
    if (azione === 'supporto') {
      apiBody.model = 'claude-haiku-4-5-20251001';
      apiBody.system = `Sei l'assistente di supporto di TrovaImpresa.com, marketplace per imprese edili e artigiani. Aiuti gli iscritti a usare il pannello: profilo, foto dei lavori, certificazioni, recensioni, richieste di preventivo (anche con l'AI), pubblicità, ricerca e visibilità, e i piani: Free a 0 €, Premium a 29 € al mese o 249 € all'anno, Premium AI a 39 € al mese o 349 € all'anno. I piani si attivano dalle due porte del riquadro Gestionale, in fondo al pannello. Rispondi in italiano, breve e pratico, a passaggi. ⛔ Usa SOLO i nomi di card e pulsanti che compaiono nelle FAQ qui sotto: non inventarne altri e non inventare funzioni. Per problemi di pagamenti, account o guasti veri, invita a usare il pulsante «Ti serve una persona? Scrivi all'assistenza».`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(apiBody)
    });
    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || ('Anthropic HTTP ' + response.status);
      await logRichiesta({ errore: msg });
      return rispondi(502, { error: msg });
    }

    const risposta = data.content?.[0]?.text ?? '';
    const tin = data.usage?.input_tokens || 0;
    const tout = data.usage?.output_tokens || 0;
    const costo_usd = (tin * 3 / 1e6) + (tout * 15 / 1e6);

    await logRichiesta({ risposta, tokens_input: tin, tokens_output: tout, costo_usd });

    return rispondi(200, { risposta });
  } catch (err) {
    await logRichiesta({ errore: err.message });
    return rispondi(500, { error: err.message });
  }
};
