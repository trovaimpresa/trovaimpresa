// =====================================================================
// TrovaImpresa — Edge Function «ai-capitolato» (16 ottobre 2026)
//
// Il capitolato scritto a parole: l'impresa racconta il lavoro e
// l'AI prepara le voci (cosa si fa, materiali, compreso, escluso).
//
// ⛔ PERCHE' UNA FUNZIONE NUOVA E NON DENTRO «ai-generate» o «ai-cantiere».
// Stessa ragione di ai-cantiere: quelle due reggono preventivi, lavori,
// fisco e assistente. Aggiungere una riga li' voleva dire rimettere in
// gioco tutto quello che funziona. Qui c'e' SOLO il capitolato. I crediti
// sono gli stessi (consume_ai_credit, settle_ai_usage, refund_ai_credit):
// per chi la usa non cambia niente, costa 1 credito come il preventivo.
//
// ⛔ L'AI NON SCRIVE MAI NEL DATABASE. Risponde, e il gestionale riempie il
// modulo: chi lavora controlla e salva lui.
// ⛔ L'AI NON INVENTA: ne' marche, ne' prezzi, ne' percentuali di
// pagamento, ne' durate. Quello che non e' stato detto resta vuoto.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";
const PREZZO_INPUT_EUR_PER_MTOK  = 0.92;
const PREZZO_OUTPUT_EUR_PER_MTOK = 4.60;

const COSTO = 1;
const MAX_TOKENS = 3000;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Sei un capocantiere italiano con trent'anni di mestiere. Scrivi il CAPITOLATO di un lavoro edile: il documento che dice al cliente cosa si fa, con quali materiali, cosa e' compreso e cosa NO.

Ti arriva il lavoro raccontato a parole e, a volte, l'elenco delle voci del preventivo.

Rispondi SOLO con questo JSON, senza testo attorno:
{"voci":[{"titolo":"","cosa":"","materiali":"","compreso":"","escluso":""}],"durata_giorni":null,"pagamenti":"","garanzie":"","note":""}

REGOLE:
- "voci": una per ogni lavorazione, nell'ordine in cui si eseguono in cantiere (demolizioni, impianti, massetti, pavimenti e rivestimenti, finiture...). Da 3 a 10 voci. Se ti arrivano le voci del preventivo, usa QUELLE: stesse lavorazioni, stesso ordine, non aggiungerne e non toglierne.
- "titolo": breve, 2-6 parole ("Impianto idraulico").
- "cosa": cosa si fa, in 1-3 frasi semplici, scritte per un cliente che non e' del mestiere. Niente gergo.
- "materiali": SOLO quelli che l'utente ha nominato (tipo, formato, misura). MAI inventare marche o modelli. Se non e' stato detto nulla: "Da concordare con il cliente".
- "compreso": cosa e' incluso nel prezzo di quella voce (posa, trasporto, smaltimento macerie, collaudo...), solo cose normali per quella lavorazione.
- "escluso": cosa NON e' compreso e puo' creare discussioni dopo (opere in amianto se ci sono, spostamento di colonne condominiali, ripristino di muri nascosti, pratiche edilizie, forniture scelte dal cliente oltre il prezzo indicato). Una voce senza esclusioni sensate: stringa vuota.
- "durata_giorni": numero intero SOLO se l'utente ha detto i tempi ("tre settimane" = 15 giorni lavorativi). Altrimenti null.
- "pagamenti": SOLO se l'utente ha detto come si paga. Altrimenti stringa vuota. MAI inventare percentuali.
- "garanzie": SOLO se l'utente le ha nominate. Altrimenti stringa vuota. Le garanzie di legge le scrive gia' il gestionale.
- "note": SOLO quello che l'utente ha detto e non sta in nessun'altra casella (per esempio chi fornisce i materiali, SE l'ha detto). NON aggiungere assunzioni, condizioni o frasi tue: niente su chi paga i materiali, niente sulle misure, niente di quello che non e' stato detto. Se non c'e' altro da scrivere: stringa vuota.
- NON scrivere prezzi, importi o totali: il capitolato non li contiene.
- Italiano corretto, frasi corte, nessuna emoji.`;

// IL CONTROLLO (modo «controllo», aggiunto il 16 ottobre sera): l'AI legge un capitolato
// gia' scritto e dice cosa MANCA o puo' far discutere. Non lo riscrive e non cambia niente:
// segnala soltanto. Stesso credito (1), stessa funzione.
const SYSTEM_CONTROLLO = `Sei un capocantiere italiano con trent'anni di mestiere e hai visto mille litigi con i clienti. Ti arriva un CAPITOLATO di un lavoro edile (voci, tempi, pagamenti, note) e, a volte, l'elenco delle voci del preventivo.

Il tuo compito: dire cosa MANCA o puo' far discutere dopo. NON riscrivere il capitolato.

Rispondi SOLO con questo JSON, senza testo attorno:
{"giudizio":"","segnalazioni":[{"dove":"","problema":"","suggerimento":""}]}

COSA CERCARE (solo se e' davvero un problema):
- esclusioni mancanti per quella lavorazione (amianto, ponteggi, colonne condominiali, pratiche edilizie, allacci, smaltimento, ripristini nascosti)
- materiali lasciati "da concordare" senza che si capisca chi decide e quando
- lavorazioni del preventivo che nel capitolato non ci sono, o il contrario
- tempi o pagamenti mancanti o incompleti
- frasi vaghe che il cliente puo' interpretare come vuole
- cose in contraddizione fra due voci

REGOLE:
- Massimo 8 segnalazioni, le piu' importanti per prime.
- "dove": il titolo della voce a cui ti riferisci, oppure "Generale".
- "problema": una frase semplice, per chi non e' del mestiere.
- "suggerimento": una frase breve gia' PRONTA da scrivere nel capitolato (per esempio nelle note), scritta come la leggerebbe il cliente, senza parentesi quadre, senza segnaposto tipo [data] o [X] e senza decidere cose che non sai (chi paga, quando, quanto). Se per scriverla servirebbero dati che non hai, lascia stringa vuota e spiega il problema soltanto.
- NON inventare prezzi, importi, percentuali, marche, durate.
- NON fare commenti di stile o di grammatica.
- "giudizio": una frase sola e breve. Se il capitolato e' a posto, dillo e lascia "segnalazioni" vuoto.
- Italiano corretto, frasi corte, nessuna emoji.`;

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
    const controllo = corpo.modo === "controllo";
    if (typeof input !== "string" || input.trim().length < 3) return json({ error: "Scrivi qualcosa in più, e riprovo." }, 400);
    if (input.length > 8000) return json({ error: "Il testo è troppo lungo (massimo 8000 caratteri)." }, 400);

    // ---- 3. il credito, PRIMA dell'AI --------------------------------
    const { data: consumo, error: consumoError } =
      await userClient.rpc("consume_ai_credit", { p_feature: "capitolato", p_cost: COSTO });
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
          system: controllo ? SYSTEM_CONTROLLO : SYSTEM,
          messages: [{ role: "user", content: input }],
        }),
      });
      if (!aiRes.ok) throw new Error(`AI ${aiRes.status}: ${(await aiRes.text()).slice(0, 300)}`);
      const aiData = await aiRes.json();
      let testo = aiData.content?.[0]?.text ?? "";
      if (!testo) throw new Error("Risposta AI vuota");
      testo = testo.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      // se non e' JSON, meglio rimborsare subito che far pagare una risposta rotta
      const prova = JSON.parse(testo);
      if (controllo) {
        if (!prova || !Array.isArray(prova.segnalazioni)) throw new Error("Controllo senza elenco");
      } else if (!prova || !Array.isArray(prova.voci) || prova.voci.length === 0) throw new Error("Capitolato senza voci");

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
