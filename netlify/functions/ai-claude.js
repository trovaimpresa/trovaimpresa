// =====================================================================
// TrovaImpresa — L'AI DEI PANNELLI (preventivo con l'AI · assistente supporto)
//
// ⛔ 21 agosto 2026 — PRIMA SI FIDAVA DI QUELLO CHE LE SCRIVEVA IL BROWSER.
// L'impresa arrivava come "impresa_id" dentro il messaggio, e nessuno
// controllava chi stesse chiamando davvero. Gli id delle imprese sono
// pubblici (la vetrina si legge senza account), quindi con l'id di un
// altro iscritto si potevano fare due cose, tutte e due brutte:
//   1. bruciargli le 30 chiamate al giorno che gli spettano;
//   2. scrivere righe dentro ai_richieste a nome suo — prompt e risposta
//      scelti da chi chiamava — che poi lui si ritrova nel suo pannello.
//
// ⚠️ Adesso l'impresa si ricava dall'ACCESSO di chi chiama, come fa gia'
// netlify/functions/crea-checkout-crediti.js (che spiega il perche' nella
// sua intestazione: "chi sta comprando si legge dal suo accesso, non
// dall'email"). L'impresa_id che arriva nel messaggio viene IGNORATO.
//
// ⚠️ Chi chiama deve mandare l'intestazione Authorization: Bearer <token>.
// Lo fanno i quattro pannelli (pannello-impresa · artigiano ·
// professionisti · negozio), tre punti per pannello, con _aiIntestazioni().
// =====================================================================
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configurazione server mancante.' }) };
  }

  const ip = event.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers?.['client-ip']
    || null;

  let azione, prompt;
  try {
    ({ azione, prompt } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!azione || !prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parametri mancanti: azione e prompt sono obbligatori.' })
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ---- CHI STA CHIAMANDO ------------------------------------------
  const intestazione = event.headers.authorization || event.headers.Authorization || '';
  const token = intestazione.startsWith('Bearer ') ? intestazione.slice(7).trim() : '';
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Devi essere collegato per usare l\'AI.' }) };
  }
  const { data: chi, error: erroreChi } = await supabase.auth.getUser(token);
  const utente = chi && chi.user;
  if (erroreChi || !utente || !utente.id) {
    return { statusCode: 401, body: JSON.stringify({ error: 'La sessione è scaduta. Rientra e riprova.' }) };
  }

  // ⛔ l'impresa e' QUESTA, non quella scritta nel messaggio
  const { data: impresa, error: impErr } = await supabase
    .from('imprese')
    .select('id, piano, premium_scadenza')
    .eq('user_id', utente.id)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (impErr || !impresa) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Profilo non trovato.' }) };
  }
  const impresa_id = impresa.id;

  const logRichiesta = async (extra) => {
    try {
      await supabase.from('ai_richieste').insert({
        impresa_id,
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
    /* ⚠️ stessa regola di haPremium() nel gestionale e di crea-checkout-crediti:
       piano 'premium' e, se c'e' una scadenza, non ancora passata. Prima qui la
       scadenza non si guardava: chi aveva finito i tre mesi di regalo continuava
       a usare l'AI finche' il controllo notturno non passava a declassarlo. */
    const scad = impresa.premium_scadenza ? new Date(impresa.premium_scadenza) : null;
    const piano = String(impresa.piano || '').trim().toLowerCase();
    const attivo = ['premium','mensile','annuale'].includes(piano)
      && (!scad || isNaN(scad.getTime()) || scad.getTime() > Date.now());

    if (!attivo) {
      await logRichiesta({ errore: 'Piano non attivo' });
      return { statusCode: 403, body: JSON.stringify({ error: 'AI solo Premium' }) };
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: cntErr } = await supabase
      .from('ai_richieste')
      .select('*', { count: 'exact', head: true })
      .eq('impresa_id', impresa_id)
      .gte('creato_il', since);

    if (cntErr) {
      await logRichiesta({ errore: 'Errore conteggio: ' + cntErr.message });
      return { statusCode: 500, body: JSON.stringify({ error: cntErr.message }) };
    }

    if ((count ?? 0) >= 30) {
      await logRichiesta({ errore: 'Limite giornaliero raggiunto' });
      return { statusCode: 429, body: JSON.stringify({ error: 'Limite giornaliero raggiunto' }) };
    }

    const apiBody = {
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    };
    if (azione === 'supporto') {
      apiBody.model = 'claude-haiku-4-5-20251001';
      apiBody.system = `Sei l'assistente di supporto di TrovaImpresa.com, marketplace per imprese edili e artigiani. Aiuti gli iscritti a usare il pannello: profilo, certificazioni, preventivi (anche AI), cantieri, recensioni, abbonamento Free/Premium (€5/mese o €49/anno), pubblicità, ricerca e visibilità. Rispondi in italiano, breve e pratico, a passaggi. Per problemi di pagamenti, account o bug veri, invita a usare il pulsante "Segnala problema". Non inventare funzioni inesistenti.`;
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
      return { statusCode: 502, body: JSON.stringify({ error: msg }) };
    }

    const risposta = data.content?.[0]?.text ?? '';
    const tin = data.usage?.input_tokens || 0;
    const tout = data.usage?.output_tokens || 0;
    const costo_usd = (tin * 3 / 1e6) + (tout * 15 / 1e6);

    await logRichiesta({ risposta, tokens_input: tin, tokens_output: tout, costo_usd });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risposta })
    };
  } catch (err) {
    await logRichiesta({ errore: err.message });
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
