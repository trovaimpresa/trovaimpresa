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

  let azione, impresa_id, prompt;
  try {
    ({ azione, impresa_id, prompt } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body JSON non valido.' }) };
  }

  if (!azione || !impresa_id || !prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parametri mancanti: azione, impresa_id, prompt sono obbligatori.' })
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    const { data: impresa, error: impErr } = await supabase
      .from('imprese')
      .select('piano')
      .eq('id', impresa_id)
      .single();

    if (impErr || !impresa) {
      await logRichiesta({ errore: 'Impresa non trovata' });
      return { statusCode: 404, body: JSON.stringify({ error: 'Impresa non trovata.' }) };
    }

    if ((impresa.piano || '').toLowerCase() !== 'premium') {
      await logRichiesta({ errore: 'Piano Free' });
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
