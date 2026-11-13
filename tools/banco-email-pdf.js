/* ======================================================================
   BANCO DELL'EMAIL COL PDF — 13 novembre 2026 (lista «MANCA», n. 8)
     node tools/banco-email-pdf.js            (tutto)
     node tools/banco-email-pdf.js server     (solo la funzione)
     node tools/banco-email-pdf.js pagina     (solo la finestra, col browser)
   Parte 1 — netlify/functions/invia-preventivo-email.js con un Supabase finto
   e un Resend finto: chi chiama, destinatario dal database, tetti, PDF vero,
   quota finita, testo disinnescato, file cancellato.
   Parte 2 — la finestra «Invia al cliente» nel gestionale vero col database
   finto del banco: «Email con PDF» → conferma → al server partono SOLO
   preventivo, percorso e nome del file; il PDF e' quello vero di prevPdf
   (jsPDF dal file in /tmp/banco) e NON si scarica.
   Serve: NODE_PATH=/opt/npm-tools/node_modules e /tmp/banco con jspdf.
   ====================================================================== */
"use strict";
const path = require("path"), fs = require("fs"), Module = require("module");
const SITO = path.join(__dirname, "..");
const FUNZ = path.join(SITO, "netlify/functions/invia-preventivo-email.js");
let verdi = 0, rossi = 0;
const ok = (cond, nome, extra) => { if (cond) { verdi++; console.log("  ✔ " + nome); } else { rossi++; console.log("  ✘ " + nome + (extra ? "  → " + extra : "")); } };

/* ------------------------- il Supabase finto ------------------------- */
function mondo() {
  const UID = "aaaaaaaa-0000-4000-8000-000000000001", ALTRO = "bbbbbbbb-0000-4000-8000-000000000002";
  const W = {
    UID, ALTRO,
    utenti: { "tok-mio": { id: UID, email: "titolare@esempio.test" }, "tok-altro": { id: ALTRO, email: "altro@esempio.test" } },
    tab: {
      gest_preventivi: [
        { id: "p1", user_id: UID, numero: 7, titolo: "Bagno <b>nuovo</b>", cliente_id: "c1", eliminato_il: null },
        { id: "p2", user_id: ALTRO, numero: 3, titolo: "Di un altro", cliente_id: "c9", eliminato_il: null },
        { id: "p3", user_id: UID, numero: 8, titolo: "Senza email", cliente_id: "c2", eliminato_il: null },
        { id: "p4", user_id: UID, numero: 9, titolo: "Guarda su www.truffa.xyz subito", cliente_id: "c1", eliminato_il: null }
      ],
      gest_clienti: [
        { id: "c1", user_id: UID, email: "Cliente.Vero@Esempio.test" },
        { id: "c2", user_id: UID, email: "" },
        { id: "c9", user_id: ALTRO, email: "suo@esempio.test" }
      ],
      gest_azienda: [{ user_id: UID, nome: "Edil Prova Srl", email: "ufficio@edilprova.test", tel: "0746 000001" }],
      gest_preventivi_link: [{ preventivo_id: "p1", user_id: UID, token: "TOKEN123", dati: {} }, { preventivo_id: "p4", user_id: UID, token: "TOKEN444", dati: {} }],
      imprese: [{ user_id: UID, tipo: "impresa" }],
      gest_email_documenti: []
    },
    file: {},
    tolti: [],
    resend: [],
    resendRisposta: null
  };
  W.client = {
    auth: { getUser: async (t) => ({ data: W.utenti[t] ? { user: W.utenti[t] } : null, error: W.utenti[t] ? null : { message: "no" } }) },
    storage: {
      from: () => ({
        download: async (p) => W.file[p] ? { data: { arrayBuffer: async () => W.file[p] }, error: null } : { data: null, error: { message: "not found" } },
        remove: async (l) => { W.tolti.push(...l); return { data: l, error: null }; }
      })
    },
    from(t) {
      const filtri = []; let conta = false, head = false;
      const q = {
        select(_c, o) { if (o && o.count) { conta = true; head = !!o.head; } return q; },
        eq(k, v) { filtri.push(r => String(r[k]) === String(v)); return q; },
        gte(k, v) { filtri.push(r => String(r[k]) >= String(v)); return q; },
        limit() { return q; },
        righe() { return (W.tab[t] || []).filter(r => filtri.every(f => f(r))); },
        maybeSingle: async () => ({ data: q.righe()[0] || null, error: null }),
        then(res, rej) { const l = q.righe(); return Promise.resolve(conta ? { count: l.length, data: head ? null : l, error: null } : { data: l, error: null }).then(res, rej); },
        insert: async (row) => { (W.tab[t] = W.tab[t] || []).push(Object.assign({ creato_il: new Date().toISOString() }, row)); return { error: null }; }
      };
      return q;
    }
  };
  return W;
}

async function parteServer() {
  console.log("\n— la funzione invia-preventivo-email —");
  if (!fs.existsSync(FUNZ)) { ok(false, "la funzione esiste", FUNZ); return; }
  let W;
  const load0 = Module._load;
  Module._load = function (req, ...r) { if (req === "@supabase/supabase-js") return { createClient: () => W.client }; return load0.call(this, req, ...r); };
  delete require.cache[FUNZ];
  const F = require(FUNZ);
  Module._load = load0;
  process.env.SUPABASE_URL = "https://finto.supabase.co"; process.env.SUPABASE_SERVICE_KEY = "chiave"; process.env.RESEND_API_KEY = "re_finta";
  global.fetch = async (u, o) => {
    W.resend.push(JSON.parse(o.body));
    const r = W.resendRisposta || { status: 200, body: { id: "re_1" } };
    return { ok: r.status < 300, status: r.status, json: async () => r.body };
  };
  const PDF = Buffer.from("%PDF-1.4\n% prova\n");
  const chiama = (tok, body) => F.handler({ httpMethod: "POST", headers: tok ? { authorization: "Bearer " + tok } : {}, body: JSON.stringify(body) })
    .then(r => ({ code: r.statusCode, j: JSON.parse(r.body) }));
  const nuovo = () => { W = mondo(); return W; };
  const per = (W, nome) => W.UID + "/email-documenti/" + nome;

  // 1. senza gettone
  nuovo(); let x = await chiama(null, { preventivo_id: "p1", percorso: "x" });
  ok(x.code === 401, "senza gettone: 401");
  // 2. file fuori dalla sua cartella
  nuovo(); x = await chiama("tok-mio", { preventivo_id: "p1", percorso: W.ALTRO + "/email-documenti/a.pdf" });
  ok(x.code === 400 && W.resend.length === 0, "file nella cartella di un altro: rifiutato, niente email");
  nuovo(); x = await chiama("tok-mio", { preventivo_id: "p1", percorso: W.UID + "/email-documenti/../../" + W.ALTRO + "/a.pdf" });
  ok(x.code === 400, "percorso con «..»: rifiutato");
  // 3. preventivo di un altro
  nuovo(); W.file[per(W, "a.pdf")] = PDF; x = await chiama("tok-mio", { preventivo_id: "p2", percorso: per(W, "a.pdf") });
  ok(x.code === 404 && W.resend.length === 0, "preventivo di un altro: 404, niente email");
  // 4. destinatario dal database, non dal browser
  nuovo(); W.file[per(W, "a.pdf")] = PDF;
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "a.pdf"), a: "vittima@spam.test", to: "vittima@spam.test", testo: "<a href=http://truffa.xyz>clic</a>" });
  const m = W.resend[0] || {};
  ok(x.code === 200 && x.j.ok, "invio buono: 200", JSON.stringify(x.j));
  ok(JSON.stringify(m.to) === JSON.stringify(["cliente.vero@esempio.test"]), "il destinatario è quello della scheda cliente (non quello mandato dal browser)", JSON.stringify(m.to));
  ok(!/vittima|truffa/.test(JSON.stringify(m)), "niente di quello che manda il browser finisce nell'email");
  ok(m.reply_to === "ufficio@edilprova.test", "la risposta va all'email dei Dati azienda", m.reply_to);
  ok(/^"Edil Prova Srl" <info@trovaimpresa\.com>$/.test(m.from || ""), "mittente: nome dell'impresa", m.from);
  ok(m.attachments && m.attachments[0] && Buffer.from(m.attachments[0].content, "base64").slice(0, 5).toString() === "%PDF-" && m.attachments[0].filename === "preventivo-7.pdf", "PDF allegato");
  ok(/preventivo-cliente\?t=TOKEN123/.test(m.html || ""), "nel testo c'è il link per firmare");
  ok(!/<b>nuovo<\/b>/.test(m.html || "") && /&lt;b&gt;nuovo/.test(m.html || ""), "titolo scritto dall'impresa: niente HTML vero");
  ok(!/con TrovaImpresa/i.test(m.html || ""), "niente riga «con TrovaImpresa»");
  ok(W.tab.gest_email_documenti.length === 1 && W.tab.gest_email_documenti[0].a === "cliente.vero@esempio.test", "scritto nel registro");
  ok(W.tolti.includes(per(W, "a.pdf")), "il PDF si cancella dal deposito dopo l'invio");
  ok(x.j.restano === 4, "restano 4 per oggi", x.j.restano);
  // 5. titolo con un link estraneo
  nuovo(); W.file[per(W, "b.pdf")] = PDF; x = await chiama("tok-mio", { preventivo_id: "p4", percorso: per(W, "b.pdf") });
  ok(x.code === 200 && !/truffa/.test(JSON.stringify(W.resend[0] || {})), "titolo con un link estraneo: il titolo non entra nell'email");
  // 6. cliente senza email
  nuovo(); W.file[per(W, "c.pdf")] = PDF; x = await chiama("tok-mio", { preventivo_id: "p3", percorso: per(W, "c.pdf") });
  ok(x.code === 422 && x.j.codice === "senza_email" && W.resend.length === 0, "cliente senza email: «senza_email», niente invio");
  ok(W.tolti.includes(per(W, "c.pdf")), "anche quando non parte, il PDF si cancella");
  // 7. tetto impresa
  nuovo(); W.file[per(W, "d.pdf")] = PDF;
  for (let i = 0; i < 5; i++) W.tab.gest_email_documenti.push({ user_id: W.UID, a: "x@y.it", creato_il: new Date().toISOString() });
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "d.pdf") });
  ok(x.code === 429 && x.j.codice === "impresa" && W.resend.length === 0, "6ª email dell'impresa oggi: ferma («impresa»)");
  // ieri non conta
  nuovo(); W.file[per(W, "d2.pdf")] = PDF;
  for (let i = 0; i < 5; i++) W.tab.gest_email_documenti.push({ user_id: W.UID, a: "x@y.it", creato_il: "2020-01-01T10:00:00Z" });
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "d2.pdf") });
  ok(x.code === 200, "le email dei giorni prima non contano");
  // 8. tetto sito
  nuovo(); W.file[per(W, "e.pdf")] = PDF;
  for (let i = 0; i < 20; i++) W.tab.gest_email_documenti.push({ user_id: "u" + i, a: "x@y.it", creato_il: new Date().toISOString() });
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "e.pdf") });
  ok(x.code === 429 && x.j.codice === "sito" && W.resend.length === 0, "21ª email del sito oggi: ferma («sito»)");
  // 9. non e' un PDF
  nuovo(); W.file[per(W, "f.pdf")] = Buffer.from("<html>finto</html>");
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "f.pdf") });
  ok(x.code === 400 && W.resend.length === 0, "file che non è un PDF: rifiutato");
  // 10. troppo grande
  nuovo(); W.file[per(W, "g.pdf")] = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)]);
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "g.pdf") });
  ok(x.code === 413 && W.resend.length === 0, "PDF oltre 5 MB: rifiutato");
  // 11. quota di Resend finita
  nuovo(); W.file[per(W, "h.pdf")] = PDF; W.resendRisposta = { status: 429, body: { name: "daily_quota_exceeded", message: "You have reached your daily email sending quota." } };
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "h.pdf") });
  ok(x.code === 429 && x.j.codice === "quota", "quota di Resend finita: «quota»");
  ok(W.tab.gest_email_documenti.length === 0, "quota finita: non si scrive nel registro (non è partita)");
  // 12. Resend rifiuta per altro
  nuovo(); W.file[per(W, "i.pdf")] = PDF; W.resendRisposta = { status: 422, body: { message: "bad" } };
  x = await chiama("tok-mio", { preventivo_id: "p1", percorso: per(W, "i.pdf") });
  ok(x.code === 502 && !x.j.ok && W.tab.gest_email_documenti.length === 0, "Resend rifiuta: errore, niente registro");
}

/* ------------------------- la finestra ------------------------- */
async function partePagina() {
  console.log("\n— la finestra «Invia al cliente» —");
  let B;
  try { B = require("./banco-gestionale.js"); } catch (e) { ok(false, "carico il banco del gestionale", e.message); return; }
  const JSPDF = "/tmp/banco/node_modules/jspdf/dist/jspdf.umd.min.js";
  if (!fs.existsSync(JSPDF)) { ok(false, "jsPDF in /tmp/banco", "mkdir -p /tmp/banco && cd /tmp/banco && npm i --no-save jspdf@2.5.1"); return; }
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  for (const W of [1440, 375]) {
    const tel = W < 800;
    const ctx = await browser.newContext(tel ? { viewport: { width: W, height: 800 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    const errori = []; page.on("pageerror", e => errori.push(e.message));
    let scaricati = 0; page.on("download", () => scaricati++);
    await B.collega(page, { rete: true, scritture: [] });
    await page.route("**/jspdf.umd.min.js", r => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(JSPDF) }));
    const chiamate = [], caricati = [];
    await page.route("**/.netlify/functions/invia-preventivo-email", async r => {
      chiamate.push({ body: JSON.parse(r.request().postData() || "{}"), aut: r.request().headers()["authorization"] || "" });
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, a: "mario@esempio.test", restano: 4 }) });
    });
    await page.route("**/storage/v1/object/**", async r => {
      const buf = r.request().postDataBuffer() || Buffer.alloc(0);
      caricati.push({ url: r.request().url(), pdf: buf.indexOf("%PDF-") >= 0 && buf.length > 1000 });
      r.fulfill({ status: 200, contentType: "application/json", body: '{"Key":"x"}' });
    });
    await page.goto(base + B.PAGINE.app.url, { waitUntil: "domcontentloaded" });
    await B.PAGINE.app.entra(page);
    await page.evaluate(() => {   /* il finto non restituisce le righe scritte: il link lo finge qui */
      const f0 = window.fetch;
      window.fetch = function (u, o) {
        const s = String(u && u.url || u), m = (o && o.method) || "GET";
        if (/rest\/v1\/gest_preventivi_link/.test(s) && m === "POST") { let b = JSON.parse(o.body); b = Array.isArray(b) ? b[0] : b; b.id = "l1"; return Promise.resolve(new Response(JSON.stringify([b]), { status: 201, headers: { "content-type": "application/json" } })); }
        return f0.apply(this, arguments);
      };
    });
    await page.evaluate(() => { const b = document.querySelector('nav.tabs button[data-tab="preventivi"]'); if (b) b.click(); });
    await B.aspetta(page, 1200);
    await page.evaluate(() => window.gestInviaCliente("00000000-0000-4000-8000-000000000402"));
    await B.aspetta(page, 1500);
    const chi = " (" + W + " px)";
    const btn = page.locator('[data-action="inv-mail-apri"]');
    ok(await btn.count() === 1, "c'è «Email con PDF»" + chi);
    if (await btn.count() !== 1) { await ctx.close(); continue; }
    const alto = await btn.evaluate(e => e.getBoundingClientRect().height);
    ok(alto >= 44, "«Email con PDF» alto almeno 44 px" + chi, alto);
    await btn.click(); await B.aspetta(page, 400);
    const conf = await page.locator("#inv-mail").innerText().catch(() => "");
    ok(/mario@esempio\.test/.test(conf) && /Allegato/.test(conf), "la conferma dice a chi va e cosa allega" + chi, conf.slice(0, 120));
    ok(chiamate.length === 0, "prima del «Sì, manda» non parte niente" + chi);
    const piccoli = await page.evaluate(() => [...document.querySelectorAll("#inv-mail *")].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).length);
    ok(piccoli === 0, "nessun testo sotto i 14 px nel riquadro" + chi, piccoli);
    await page.click('[data-action="inv-mail-manda"]');
    await page.waitForFunction(() => /Mandata a/.test((document.getElementById("inv-mail") || {}).innerText || ""), null, { timeout: 15000 }).catch(() => {});
    const dopo = await page.locator("#inv-mail").innerText().catch(() => "");
    ok(/Mandata a mario@esempio\.test/.test(dopo), "dopo l'invio: «Mandata a …»" + chi, dopo.slice(0, 100));
    ok(caricati.length === 1 && caricati[0].pdf && /email-documenti\//.test(caricati[0].url), "il PDF vero di prevPdf va nel deposito, cartella email-documenti" + chi, JSON.stringify(caricati));
    const c = chiamate[0] || { body: {} };
    ok(chiamate.length === 1 && Object.keys(c.body).sort().join(",") === "nome_file,percorso,preventivo_id", "al server partono SOLO preventivo, percorso e nome del file" + chi, JSON.stringify(c.body));
    ok(/^Bearer \S+/.test(c.aut), "con il gettone della sessione" + chi);
    ok(scaricati === 0, "il PDF non si scarica" + chi, scaricati);
    ok(errori.length === 0, "nessun errore JavaScript" + chi, errori.join(" | "));
    await ctx.close();
  }
  await browser.close(); srv.close();
}

(async () => {
  const solo = process.argv[2];
  if (!solo || solo === "server") await parteServer();
  if (!solo || solo === "pagina") await partePagina();
  console.log("\n" + verdi + " verdi, " + rossi + " rossi");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
