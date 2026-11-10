// =====================================================================
// TrovaImpresa — Edge Function «ai-fattura» (10 novembre 2026)
//
// La FOTO (o il PDF) della fattura o della bolla di un fornitore diventa
// le caselle del modulo E LE RIGHE DELLA MERCE comprata: servono alla
// lista «Acquisti del mese» (js/gest-acquisti.js).
//
// ⛔ PERCHE' UNA FUNZIONE NUOVA E NON DENTRO «ai-cantiere».
// ai-cantiere legge gia' la fattura (senza le righe) e regge altre cinque
// cose, comprese le regole del Fisco. Qui c'e' SOLO il nuovo: quella non
// si tocca. I crediti sono gli stessi (consume_ai_credit, settle_ai_usage,
// refund_ai_credit) e il nome della funzione nei conti resta
// «dati_fattura_fornitore»: per chi la usa non cambia niente.
//
// ⛔ L'AI NON SCRIVE MAI NEL DATABASE: risponde, e il gestionale riempie il
// modulo. Chi lavora controlla e salva lui.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";
const PREZZO_INPUT_EUR_PER_MTOK  = 0.92;
const PREZZO_OUTPUT_EUR_PER_MTOK = 4.60;
const FEATURE = "dati_fattura_fornitore";
const COSTO = 1;
const MAX_TOKENS = 3000;

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

const SYSTEM = `Leggi la fattura (o la bolla, o lo scontrino) di un FORNITORE di un'impresa edile italiana.
Oggi e' {{OGGI}} (formato AAAA-MM-GG).

Rispondi SOLO con questo JSON, senza testo attorno:
{"leggibile":true,"fornitore":"","partita_iva":"","numero":"","data":"","totale":null,"imponibile":null,"scadenza":"","cosa":"","righe":[{"nome":"","quantita":null,"unita":"","prezzo_unitario":null,"importo":null}]}

Regole:
- "fornitore": chi ha EMESSO il documento (il venditore, in alto con il logo), NON il cliente destinatario. Ragione sociale come e' scritta, con le maiuscole giuste.
- "partita_iva": la partita IVA del fornitore, solo le 11 cifre. Se non c'e', stringa vuota.
- "numero": il numero del documento come e' scritto (es. "124/2026", "FT 00312", "DDT 88").
- "data": la data del documento, formato AAAA-MM-GG.
- "totale": il TOTALE DA PAGARE, IVA compresa (la riga "Totale documento", "Totale fattura", "Netto a pagare"). Numero con il punto per i decimali, senza simboli: 1234.5. Se ci sono ritenute o acconti gia' pagati, usa il netto da pagare. Una BOLLA di consegna senza prezzi non ha totale: null.
- "imponibile": il totale senza IVA, se si legge. Altrimenti null.
- "scadenza": la data entro cui pagare (formato AAAA-MM-GG) SOLO se e' scritta (scadenza, "pagamento a 30 gg" con data, RiBa con data). Se c'e' scritto solo "30 gg d.f." senza data, calcolala dalla data della fattura (fine mese se c'e' scritto "f.m."). Se non c'e' niente, stringa vuota.
- "cosa": in una riga corta cosa si e' comprato (es. "Cemento, sabbia e 20 sacchi di premiscelato"). Massimo 12 parole.
- "righe": la MERCE comprata, una riga per ogni prodotto scritto nel documento, nell'ordine in cui e' scritto. Al massimo 40 righe.
  - "nome": il nome SEMPLICE del prodotto, da 1 a 4 parole, come lo direbbe un muratore, con la maiuscola iniziale: "Guanti da lavoro", "Malta", "Martello", "Cemento", "Tubo PVC 100". Togli codici articolo, marche e sigle che non servono a capire cos'e'. Tieni la misura solo se cambia il prodotto (un tubo da 100 non e' un tubo da 40). Lo stesso prodotto va chiamato sempre nello stesso modo.
  - "quantita": il numero scritto nella colonna quantita' (punto per i decimali). Se non c'e' scritto, null.
  - "unita": come si conta, in una parola corta: "paia", "sacchi", "pz", "kg", "m", "m2", "m3", "l", "conf", "rotoli", "bancali". Se nel documento c'e' "NR", "N", "PZ" o "CAD" scrivi "pz"; "SAC" = "sacchi"; "PA" = "paia". Se non si capisce, "pz".
  - "prezzo_unitario" e "importo": i numeri della riga cosi' come sono scritti (di solito senza IVA). Se non si leggono, null.
  - NON mettere fra le righe: trasporto, imballo, sconti, bolli, acconti, IVA, totali, e le righe di solo testo ("Rif. DDT n. ...", "Cantiere di ...").
  - Se la merce non si legge, "righe": [].
- Se l'immagine non e' una fattura, una bolla o uno scontrino, o e' troppo sfocata per leggerla, rispondi {"leggibile":false} e basta.
- NON INVENTARE MAI un numero o un prodotto: un campo che non leggi con sicurezza resta vuoto (o null).`;

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
    const input = corpo.input;
    const file = corpo.file;
    if (typeof input !== "string" || input.trim().length < 3) return json({ error: "Scrivi qualcosa in più, e riprovo." }, 400);
    if (input.length > 8000) return json({ error: "Il testo è troppo lungo (massimo 8000 caratteri)." }, 400);
    if (!file || typeof file.dati !== "string" || !TIPI_FILE[file.tipo]) {
      return json({ error: "Manca la foto, oppure il file non è una foto o un PDF." }, 400);
    }
    if (file.dati.length > MAX_BASE64) return json({ error: "Il file è troppo grande: massimo 5 MB." }, 400);
    const blocco = { type: TIPI_FILE[file.tipo], source: { type: "base64", media_type: file.tipo, data: file.dati } };

    // ---- 3. il credito, PRIMA dell'AI --------------------------------
    const { data: consumo, error: consumoError } =
      await userClient.rpc("consume_ai_credit", { p_feature: FEATURE, p_cost: COSTO });
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
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM.replace("{{OGGI}}", oggiARoma()),
          messages: [{ role: "user", content: [blocco, { type: "text", text: input }] }],
        }),
      });
      if (!aiRes.ok) throw new Error(`AI ${aiRes.status}: ${(await aiRes.text()).slice(0, 300)}`);
      const aiData = await aiRes.json();
      let testo = aiData.content?.[0]?.text ?? "";
      if (!testo) throw new Error("Risposta AI vuota");
      testo = testo.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      JSON.parse(testo); // se non e' JSON (o e' tagliato a meta'), meglio rimborsare che far pagare una risposta rotta

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
