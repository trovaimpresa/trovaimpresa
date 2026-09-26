// =====================================================================
// TrovaImpresa — Edge Function «ai-cantiere» (26 settembre 2026)
//
// Le quattro idee prese dai gestionali stranieri (Plancraft, Jobber,
// Buildertrend) che hanno bisogno dell'AI:
//   1. dati_fattura_fornitore  — la FOTO (o il PDF) della fattura del
//                                fornitore diventa le caselle del modulo
//   3. resoconto_cliente       — il messaggio della settimana al cliente
//   4. scrivi_meglio           — un messaggio scritto di corsa diventa
//                                gentile e professionale
//
// ⛔ PERCHE' UNA FUNZIONE NUOVA E NON DENTRO «ai-generate».
// ai-generate regge preventivi, lavori, clienti, rapportini e l'assistente:
// riscriverla per aggiungere le foto voleva dire rimettere in gioco tutto
// quello che funziona. Qui c'e' SOLO il nuovo. I crediti sono gli stessi
// (stesse funzioni SQL: consume_ai_credit, settle_ai_usage,
// refund_ai_credit), quindi per chi la usa non cambia niente.
//
// ⛔ L'AI NON SCRIVE MAI NEL DATABASE. Risponde, e il gestionale riempie il
// modulo: chi lavora controlla e salva lui. Come in ai-generate.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";
const PREZZO_INPUT_EUR_PER_MTOK  = 0.92;
const PREZZO_OUTPUT_EUR_PER_MTOK = 4.60;

// ⚠️ ~5 MB di file. Il telefono la foto la rimpicciolisce prima di mandarla
// (1600 px sul lato lungo, ~300 KB): questo tetto lo tocca solo un PDF grosso.
const MAX_BASE64 = 7_000_000;
const TIPI_FILE: Record<string, "image" | "document"> = {
  "image/jpeg": "image", "image/png": "image", "image/webp": "image",
  "application/pdf": "document",
};

function oggiARoma(): string {
  try { return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }); }
  catch (_) { return new Date().toISOString().slice(0, 10); }
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FEATURES: Record<string, {
  costo: number; maxTokens: number; conFile: boolean; json: boolean; system: string;
}> = {

  // ------------------------------------------------------------------
  // 1. LA FOTO DELLA FATTURA DEL FORNITORE
  // ⛔ L'importo e' quello DA PAGARE (totale documento, IVA compresa):
  //    e' quello che finisce nello scadenziario dei pagamenti. Se la
  //    fattura non si legge, si dice — non si tira a indovinare un numero.
  // ------------------------------------------------------------------
  dati_fattura_fornitore: {
    costo: 1, maxTokens: 700, conFile: true, json: true,
    system: `Leggi la fattura (o la bolla, o lo scontrino) di un FORNITORE di un'impresa edile italiana.
Oggi e' {{OGGI}} (formato AAAA-MM-GG).

Rispondi SOLO con questo JSON, senza testo attorno:
{"leggibile":true,"fornitore":"","partita_iva":"","numero":"","data":"","totale":null,"imponibile":null,"scadenza":"","cosa":""}

Regole:
- "fornitore": chi ha EMESSO il documento (il venditore, in alto con il logo), NON il cliente destinatario. Ragione sociale come e' scritta, con le maiuscole giuste.
- "partita_iva": la partita IVA del fornitore, solo le 11 cifre. Se non c'e', stringa vuota.
- "numero": il numero della fattura come e' scritto (es. "124/2026", "FT 00312").
- "data": la data del documento, formato AAAA-MM-GG.
- "totale": il TOTALE DA PAGARE, IVA compresa (la riga "Totale documento", "Totale fattura", "Netto a pagare"). Numero con il punto per i decimali, senza simboli: 1234.5. Se ci sono ritenute o acconti gia' pagati, usa il netto da pagare.
- "imponibile": il totale senza IVA, se si legge. Altrimenti null.
- "scadenza": la data entro cui pagare (formato AAAA-MM-GG) SOLO se e' scritta (scadenza, "pagamento a 30 gg" con data, RiBa con data). Se c'e' scritto solo "30 gg d.f." senza data, calcolala dalla data della fattura (fine mese se c'e' scritto "f.m."). Se non c'e' niente, stringa vuota.
- "cosa": in una riga corta cosa si e' comprato (es. "Cemento, sabbia e 20 sacchi di premiscelato"). Massimo 12 parole.
- Se l'immagine non e' una fattura, o e' troppo sfocata per leggere il totale, rispondi {"leggibile":false} e basta.
- NON INVENTARE MAI un numero: un campo che non leggi con sicurezza resta vuoto (o null).`,
  },

  // ------------------------------------------------------------------
  // 3. IL RESOCONTO DELLA SETTIMANA AL CLIENTE
  // ⛔ Qui NON arriva il nome del cliente ne' il suo indirizzo: il
  //    saluto col nome lo mette il gestionale dopo. Ne' soldi: un
  //    resoconto che parla di soldi non e' un resoconto, e' un sollecito.
  // ------------------------------------------------------------------
  resoconto_cliente: {
    costo: 1, maxTokens: 700, conFile: false, json: false,
    system: `Scrivi il messaggio WhatsApp con cui un'impresa edile o un artigiano aggiorna il suo cliente su come va il lavoro.
Ti arrivano: il lavoro, lo stato, e quello che la squadra ha scritto nei rapportini del periodo, piu' due righe aggiunte dal titolare.

COME SCRIVERLO:
- Inizia con "Buongiorno," da solo sulla prima riga (il nome lo aggiunge il gestionale).
- Poi cosa e' stato fatto, in 2-5 punti con il trattino, parole semplici che capisce chi non e' del mestiere.
- Poi cosa succede adesso o la prossima settimana, SOLO se lo sai dai dati.
- Se nel periodo sono state fatte foto, chiudi con "Le mando le foto a parte."
- Tono cortese, concreto, da artigiano serio. Lei, non tu. Niente emoji, niente punti esclamativi a raffica.
- Massimo 110 parole. Niente firma: la mette il gestionale.
- NON parlare MAI di soldi, prezzi, fatture, acconti o ore lavorate.
- NON inventare lavorazioni, date o problemi che non sono nei dati. Se i dati sono pochi, il messaggio e' corto: va bene cosi'.
- Scrivi SOLO il messaggio, senza titoli e senza virgolette attorno.`,
  },

  // ------------------------------------------------------------------
  // 4. «SCRIVILO MEGLIO»
  // ⛔ Cambia la forma, MAI la sostanza: stesse date, stessi numeri,
  //    stesse promesse. Un prezzo riscritto dall'AI e' un prezzo che
  //    l'impresa non ha mai detto.
  // ------------------------------------------------------------------
  scrivi_meglio: {
    costo: 1, maxTokens: 900, conFile: false, json: false,
    system: `Riscrivi il messaggio di un'impresa edile o di un artigiano al suo cliente, in modo che suoni gentile, chiaro e professionale.

REGOLE:
- Tieni ESATTAMENTE lo stesso contenuto: stesse date, stessi orari, stessi numeri, stessi prezzi, stesse cose promesse. Non aggiungere informazioni e non toglierne.
- Correggi errori di ortografia, punteggiatura e maiuscole.
- Usa il Lei, a meno che il messaggio non dia gia' del tu in modo chiaro: in quel caso tieni il tu.
- Italiano semplice, frasi corte. Niente parole difficili, niente formule da ufficio ("in riferimento alla Sua", "con la presente").
- Niente emoji. Lunghezza simile all'originale, al massimo un po' piu' lungo.
- Se c'e' una firma o dei saluti, tienili.
- Scrivi SOLO il messaggio riscritto, senza spiegazioni e senza virgolette attorno.`,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    // ---- 1. chi sei ------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autenticato" }, 401);
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Sessione non valida" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ---- 2. cosa chiedi ---------------------------------------------
    const corpo = await req.json().catch(() => ({}));
    const feature = corpo.feature;
    const input = corpo.input;
    const file = corpo.file;
    const conf = FEATURES[feature];
    if (!conf) return json({ error: "Funzione AI non riconosciuta" }, 400);
    if (typeof input !== "string" || input.trim().length < 3) return json({ error: "Scrivi qualcosa in più, e riprovo." }, 400);
    if (input.length > 8000) return json({ error: "Il testo è troppo lungo (massimo 8000 caratteri)." }, 400);

    let blocco: Record<string, unknown> | null = null;
    if (conf.conFile) {
      if (!file || typeof file.dati !== "string" || !TIPI_FILE[file.tipo]) {
        return json({ error: "Manca la foto, oppure il file non è una foto o un PDF." }, 400);
      }
      if (file.dati.length > MAX_BASE64) return json({ error: "Il file è troppo grande: massimo 5 MB." }, 400);
      const genere = TIPI_FILE[file.tipo];
      blocco = { type: genere, source: { type: "base64", media_type: file.tipo, data: file.dati } };
    }

    // ---- 3. il credito, PRIMA dell'AI --------------------------------
    const { data: consumo, error: consumoError } =
      await userClient.rpc("consume_ai_credit", { p_feature: feature, p_cost: conf.costo });
    if (consumoError) { console.error("consumo:", consumoError); return json({ error: "Errore nel controllo crediti" }, 500); }
    if (!consumo.ok) {
      const messaggi: Record<string, string> = {
        plan_without_ai:      "Le funzioni AI non sono incluse nel tuo piano.",
        no_credits:           "Hai esaurito i crediti AI di questo mese.",
        subscription_expired: "Il tuo abbonamento è scaduto.",
        no_account:           "Account non trovato.",
      };
      return json({ error: messaggi[consumo.reason] ?? "Funzione non disponibile", reason: consumo.reason, remaining: consumo.remaining ?? 0 }, 402);
    }
    const logId = consumo.log_id ?? null;

    // ---- 4. l'AI ----------------------------------------------------
    try {
      const contenuto = blocco ? [blocco, { type: "text", text: input }] : input;
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: conf.maxTokens,
          system: conf.system.replace("{{OGGI}}", oggiARoma()),
          messages: [{ role: "user", content: contenuto }],
        }),
      });
      if (!aiRes.ok) throw new Error(`AI ${aiRes.status}: ${(await aiRes.text()).slice(0, 300)}`);
      const aiData = await aiRes.json();
      let testo = aiData.content?.[0]?.text ?? "";
      if (!testo) throw new Error("Risposta AI vuota");
      testo = testo.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      if (conf.json) JSON.parse(testo); // se non e' JSON, meglio rimborsare subito che far pagare una risposta rotta

      const inTok = aiData.usage?.input_tokens ?? 0, outTok = aiData.usage?.output_tokens ?? 0;
      const costo = (inTok / 1_000_000) * PREZZO_INPUT_EUR_PER_MTOK + (outTok / 1_000_000) * PREZZO_OUTPUT_EUR_PER_MTOK;
      if (logId) {
        await admin.rpc("settle_ai_usage", { p_log_id: logId, p_input_tokens: inTok, p_output_tokens: outTok, p_cost_eur: Number(costo.toFixed(5)) });
      }
      return json({ ok: true, result: testo, remaining: consumo.remaining });
    } catch (aiError) {
      console.error("Errore AI:", aiError);
      if (logId) await admin.rpc("refund_ai_credit", { p_log_id: logId, p_error: String(aiError).slice(0, 500) });
      return json({ error: "Il servizio AI non ha risposto. Il credito è stato rimborsato, riprova." }, 502);
    }
  } catch (e) {
    console.error("Errore generale:", e);
    return json({ error: "Errore interno" }, 500);
  }
});
