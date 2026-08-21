// =====================================================================
// IL PREVENTIVO AI, IN BACKGROUND — 21 agosto 2026 (notte)
//
// PERCHE' ESISTE
// Il preventivo AI andava in **504** sui lavori grossi. Netlify taglia
// una function normale a 26 secondi; il modello, su una «ristrutturazione
// chiavi in mano», scrive ~2.300 parole-macchina, cioe' il doppio del
// tempo. Non era rotto da una sera: era fragile da sempre, e cadeva
// proprio sui lavori che contano.
//
// ⚠️ IL NOME DEL FILE FA IL LAVORO: finisce per `-background.js`, e per
//    Netlify questo vuol dire «rispondi subito 202 al browser e lascia
//    girare la function fino a 15 minuti». Se qualcuno lo rinomina, il
//    tetto torna a 26 secondi e il difetto ricompare.
//
// COME FUNZIONA
// 1. Il pannello sceglie un numero di pratica (id), lo manda qui col
//    gettone della sessione, e riceve subito 202 («preso in carico»).
// 2. Qui si controlla chi chiama — come in ai-claude.js: l'impresa si
//    ricava dall'ACCESSO, l'id mandato dal browser non conta niente.
// 3. Si deposita subito una riga «in_corso» in `ai_lavori`.
// 4. Si chiama il modello con calma (tetto nostro: 4 minuti).
// 5. Si scrive il risultato nella riga, e il pannello — che nel frattempo
//    ripassa ogni due secondi — lo trova e lo mostra.
//
// ⚠️ QUELLO CHE VA STORTO SI VEDE. Prima, se la function cadeva, in
//    `ai_richieste` non restava traccia (la riga si scrive DOPO la
//    risposta): il difetto era invisibile nei conti. Adesso ogni finale
//    lascia una riga: finito, o errore con scritto perche'.
//
// ⚠️ NIENTE DOPPIONI: la riga si crea con l'id mandato dal browser. Se
//    quell'id esiste gia', l'insert fallisce e la function si ferma —
//    cosi' nessuno puo' sovrascrivere il lavoro di un altro.
//
// Tabella: sql/ai-lavori.sql (da eseguire una volta nell'SQL Editor).
// =====================================================================
const { createClient } = require('@supabase/supabase-js');

const PIANI_OK = ['premium', 'mensile', 'annuale'];
const TEMPO_ACCESSO = 4000;        // ms — tetto sui controlli d'accesso
const TEMPO_MODELLO = 240000;      // ms — 4 minuti: il modello non resta appeso in eterno
const TETTO_GIORNO = 30;           // chiamate al giorno per impresa
const GIORNI_STORIA = 7;           // dopo quanti giorni le righe vecchie si cancellano

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rispondi = (codice, corpo) => ({
  statusCode: codice,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

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
    console.error('[preventivo-bg] configurazione server mancante');
    return rispondi(500, { error: 'Configurazione server mancante.' });
  }

  const intestazioni = event.headers || {};
  const ip = intestazioni['x-forwarded-for']?.split(',')[0]?.trim()
    || intestazioni['client-ip']
    || null;

  let id, prompt;
  try {
    ({ id, prompt } = JSON.parse(event.body || '{}'));
  } catch {
    return rispondi(400, { error: 'Body JSON non valido.' });
  }

  if (!id || !UUID.test(String(id))) {
    console.error('[preventivo-bg] numero di pratica non valido');
    return rispondi(400, { error: 'Numero di pratica non valido.' });
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return rispondi(400, { error: 'Manca la descrizione del lavoro.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ---- 1. chi sta chiamando ------------------------------------------
  const autorizzazione = intestazioni.authorization || intestazioni.Authorization || '';
  const token = autorizzazione.startsWith('Bearer ') ? autorizzazione.slice(7).trim() : '';
  if (!token) {
    console.error('[preventivo-bg] senza gettone');
    return rispondi(401, { error: 'Devi essere collegato.' });
  }

  let utente = null;
  try {
    const { data: chi, error: erroreChi } = await conTempo(
      supabase.auth.getUser(token), TEMPO_ACCESSO, 'getUser'
    );
    utente = chi && chi.user;
    if (erroreChi || !utente || !utente.id) utente = null;
  } catch (e) {
    console.error('[preventivo-bg] accesso non verificato:', e && e.message);
    utente = null;
  }
  if (!utente) {
    return rispondi(401, { error: 'La sessione è scaduta.' });
  }

  // ---- 2. quale impresa e' -------------------------------------------
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
    console.error('[preventivo-bg] impresa non letta:', e && e.message);
    return rispondi(401, { error: 'Non riesco a verificare il tuo account.' });
  }

  if (!impresa || !impresa.id) {
    return rispondi(404, { error: 'Impresa non trovata.' });
  }

  const impresaId = impresa.id;

  const logRichiesta = async (extra) => {
    try {
      await supabase.from('ai_richieste').insert({
        impresa_id: impresaId,
        azione: 'preventivo',
        prompt_input: prompt,
        risposta: extra.risposta ?? null,
        tokens_input: extra.tokens_input ?? 0,
        tokens_output: extra.tokens_output ?? 0,
        costo_usd: extra.costo_usd ?? 0,
        errore: extra.errore ?? null,
        ip_address: ip
      });
    } catch (e) {
      console.error('[preventivo-bg] log fallito:', e.message);
    }
  };

  // Deposita il finale nella riga del lavoro, cosi' il pannello lo trova.
  const chiudiLavoro = async (stato, campi) => {
    try {
      await supabase.from('ai_lavori')
        .update(Object.assign({ stato, finito_il: new Date().toISOString() }, campi))
        .eq('id', id);
    } catch (e) {
      console.error('[preventivo-bg] non sono riuscito a chiudere il lavoro:', e.message);
    }
  };

  // ---- 3. il Premium, scadenza compresa -------------------------------
  const piano = String(impresa.piano || '').trim().toLowerCase();
  const scad = impresa.premium_scadenza ? new Date(impresa.premium_scadenza) : null;
  const scaduto = scad && !isNaN(scad.getTime()) && scad.getTime() <= Date.now();

  let fermati = null;
  if (!PIANI_OK.includes(piano)) fermati = 'Il preventivo AI è compreso nel Premium.';
  else if (scaduto) fermati = 'Il tuo Premium è scaduto: rinnovalo per usare l’AI.';

  // ---- 4. il tetto giornaliero ----------------------------------------
  if (!fermati) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: cntErr } = await supabase
      .from('ai_richieste')
      .select('*', { count: 'exact', head: true })
      .eq('impresa_id', impresaId)
      .gte('creato_il', since);

    if (cntErr) {
      console.error('[preventivo-bg] conteggio fallito:', cntErr.message);
      fermati = 'Non riesco a controllare quante ne hai fatte oggi. Riprova fra poco.';
    } else if ((count ?? 0) >= TETTO_GIORNO) {
      fermati = 'Hai raggiunto le ' + TETTO_GIORNO + ' generazioni di oggi. Riprova domani.';
    }
  }

  // ---- 5. la riga del lavoro ------------------------------------------
  // Si crea SEMPRE, anche quando ci si ferma qui: e' l'unico modo che ha
  // il pannello di sapere perche' non arriva niente.
  const { error: errNasce } = await supabase.from('ai_lavori').insert({
    id,
    impresa_id: impresaId,
    azione: 'preventivo',
    stato: 'in_corso'
  });

  if (errNasce) {
    // id gia' usato (doppio clic, o qualcuno che ci prova): non si tocca
    // niente e non si chiama il modello.
    console.error('[preventivo-bg] numero di pratica gia usato:', errNasce.message);
    return rispondi(409, { error: 'Questo preventivo è già in lavorazione.' });
  }

  if (fermati) {
    await chiudiLavoro('errore', { errore: fermati });
    await logRichiesta({ errore: fermati });
    return rispondi(403, { error: fermati });
  }

  // ---- 6. il modello, con calma ---------------------------------------
  const partito = Date.now();
  try {
    const taglia = new AbortController();
    const timer = setTimeout(() => taglia.abort(), TEMPO_MODELLO);

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: taglia.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json();
    const secondi = Math.round((Date.now() - partito) / 1000);

    if (!response.ok) {
      const msg = data.error?.message || ('Anthropic HTTP ' + response.status);
      console.error('[preventivo-bg] il modello ha risposto male dopo ' + secondi + 's:', msg);
      await chiudiLavoro('errore', { errore: 'L’AI non è riuscita a rispondere. Riprova fra un minuto.' });
      await logRichiesta({ errore: msg });
      return rispondi(502, { error: msg });
    }

    const risposta = data.content?.[0]?.text ?? '';
    const tin = data.usage?.input_tokens || 0;
    const tout = data.usage?.output_tokens || 0;
    const costo_usd = (tin * 3 / 1e6) + (tout * 15 / 1e6);

    // ⚠️ Nel registro di Netlify resta scritto quanto ci ha messo: e' il
    //    numero che stasera non aveva nessuno.
    console.log('[preventivo-bg] finito in ' + secondi + 's · scritte ' + tout + ' parole-macchina');

    if (!risposta) {
      await chiudiLavoro('errore', { errore: 'L’AI ha risposto vuoto. Riprova.' });
      await logRichiesta({ errore: 'risposta vuota', tokens_input: tin, tokens_output: tout, costo_usd });
      return rispondi(502, { error: 'Risposta vuota.' });
    }

    await chiudiLavoro('finito', { risposta, errore: null });
    await logRichiesta({ risposta, tokens_input: tin, tokens_output: tout, costo_usd });

    // pulizia delle righe vecchie: non serve un mestiere a parte
    try {
      const limite = new Date(Date.now() - GIORNI_STORIA * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('ai_lavori').delete().lt('creato_il', limite);
    } catch (e) {
      console.error('[preventivo-bg] pulizia saltata:', e.message);
    }

    return rispondi(200, { ok: true, secondi });
  } catch (err) {
    const secondi = Math.round((Date.now() - partito) / 1000);
    const fuoriTempo = err && (err.name === 'AbortError' || /abort/i.test(err.message || ''));
    const perAlex = fuoriTempo
      ? 'Il lavoro era troppo grande anche per l’AI (oltre 4 minuti). Prova a dividerlo in due preventivi.'
      : 'Errore nella generazione. Riprova.';
    console.error('[preventivo-bg] caduta dopo ' + secondi + 's:', err && err.message);
    await chiudiLavoro('errore', { errore: perAlex });
    await logRichiesta({ errore: (err && err.message) || 'errore sconosciuto' });
    return rispondi(500, { error: perAlex });
  }
};
