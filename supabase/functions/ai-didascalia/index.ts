// =====================================================================
// TrovaImpresa — Edge Function «ai-didascalia» (20 novembre 2026)
//
// Giornate: il LAVORO SVOLTO in una giornata, scritto per il CLIENTE,
// guardando le foto «prima» e «dopo» e le note della giornata. Finisce nel
// PDF «Resoconto del lavoro» che l'impresa manda al cliente.
//
// ⛔ Niente nomi di operai, ore, soldi, indirizzi: il resoconto va al
//    cliente, e in un giorno ci possono essere piu' clienti.
// ⛔ L'AI NON SCRIVE MAI NEL DATABASE: risponde, e il gestionale mette il
//    testo nella casella. Chi lavora lo controlla e salva lui.
// Crediti: gli stessi (consume_ai_credit / settle / refund), 1 a giro.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";
const PREZZO_INPUT_EUR_PER_MTOK  = 0.92;
const PREZZO_OUTPUT_EUR_PER_MTOK = 4.60;
const FEATURE = "didascalia_giornata";
const COSTO = 1;
const MAX_TOKENS = 500;
const MAX_FOTO = 6;
const MAX_BASE64 = 2_500_000;          // una foto, gia' rimpicciolita dal gestionale
const MAX_BASE64_TOT = 9_000_000;
const TIPI: Record<string, boolean> = { "image/jpeg": true, "image/png": true, "image/webp": true };

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Scrivi il LAVORO SVOLTO in una giornata di cantiere, per il CLIENTE di un'impresa edile o di un artigiano italiano.
Ti arrivano le foto PRIMA del lavoro e DOPO il lavoro (ognuna ha scritto sopra se e' prima o dopo) e gli appunti della giornata.

COME SCRIVERLO:
- Da 1 a 3 frasi, al massimo 60 parole. Italiano semplice, parole che capisce chi non e' del mestiere.
- Forma impersonale o "abbiamo": "Rimossa la vecchia piastrella e posata la nuova in gres." oppure "Abbiamo rasato e tinteggiato la parete del soggiorno."
- Descrivi SOLO quello che si vede nelle foto o che c'e' negli appunti. Se le foto non si capiscono, usa gli appunti. Non inventare lavorazioni, materiali o misure.
- MAI nomi di persone, MAI ore, MAI prezzi o soldi, MAI indirizzi o nomi di vie o citta', MAI problemi interni o note per la squadra.
- Niente saluti, niente firma, niente titoli, niente virgolette attorno, niente emoji. Scrivi SOLO il testo.`;

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
    const input = typeof corpo.input === "string" ? corpo.input.slice(0, 4000) : "";
    const foto = Array.isArray(corpo.foto) ? corpo.foto.slice(0, MAX_FOTO) : [];
    let tot = 0;
    const blocchi: unknown[] = [];
    for (const f of foto) {
      if (!f || typeof f.dati !== "string" || !TIPI[f.tipo]) return json({ error: "Una delle foto non si legge: riprova." }, 400);
      if (f.dati.length > MAX_BASE64) return json({ error: "Una foto è troppo grande." }, 400);
      tot += f.dati.length;
      blocchi.push({ type: "text", text: f.quando === "prima" ? "Foto PRIMA del lavoro:" : "Foto DOPO il lavoro:" });
      blocchi.push({ type: "image", source: { type: "base64", media_type: f.tipo, data: f.dati } });
    }
    if (tot > MAX_BASE64_TOT) return json({ error: "Le foto sono troppo grandi tutte insieme." }, 400);
    if (!blocchi.length && input.trim().length < 3) return json({ error: "Aggiungi una foto o scrivi due parole su cosa avete fatto." }, 400);
    blocchi.push({ type: "text", text: "Appunti della giornata: " + (input.trim() || "(nessuno)") });

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
          system: SYSTEM,
          messages: [{ role: "user", content: blocchi }],
        }),
      });
      if (!aiRes.ok) throw new Error(`AI ${aiRes.status}: ${(await aiRes.text()).slice(0, 300)}`);
      const aiData = await aiRes.json();
      let testo = aiData.content?.[0]?.text ?? "";
      if (!testo) throw new Error("Risposta AI vuota");
      testo = testo.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      testo = testo.replace(/^["«]+|["»]+$/g, "").trim();
      if (testo.length < 5) throw new Error("Risposta AI troppo corta");

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
