/* ======================================================================
   BANCO DEL PROFILO MINIMO DEL GESTIONALE — 14 novembre 2026
     node tools/banco-profilo-gestionale.js
   Chi ha la scheda pubblica SPENTA (vetrina_attiva === false, porta del
   gestionale) entra con nome + email confermata. Tutti gli altri: 7 voci.
   Prova la funzione VERA (window._profiloMinimo di js/gate-gestionale.js)
   dentro la pagina vera del gestionale, col database finto del banco.
   Serve: NODE_PATH=/opt/npm-tools/node_modules
   ====================================================================== */
"use strict";
const B = require("./banco-gestionale.js");
let verdi = 0, rossi = 0;
const ok = (c, n, x) => { if (c) { verdi++; console.log("  ✔ " + n); } else { rossi++; console.log("  ✘ " + n + (x ? "  → " + x : "")); } };

(async () => {
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  const page = await (await browser.newContext()).newPage();
  await B.collega(page, { rete: true, scritture: [] });
  await page.goto(base + B.PAGINE.app.url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window._profiloMinimo === "function", null, { timeout: 15000 }).catch(() => {});
  const pm = (r) => page.evaluate((r) => window._profiloMinimo(r), r);
  ok(await page.evaluate(() => typeof window._profiloMinimo === "function"), "la funzione del profilo c'è");

  const soloNome = { nome_attivita: "Studio Prova", email_confermata: true };
  const pieno = { nome_attivita: "Edil Prova", mestiere: "Muratore", citta: "Rieti", telefono: "3331234567",
    descrizione: "x".repeat(120), logo_url: "https://esempio.test/logo.png", email_confermata: true };

  let e = await pm(Object.assign({ vetrina_attiva: false }, soloNome));
  ok(e.completo === true && e.totale === 2, "scheda spenta + nome + email confermata: entra (2 voci)", JSON.stringify(e));
  e = await pm({ vetrina_attiva: false, email_confermata: true });
  ok(e.completo === false && e.mancanti.join() === "nome", "scheda spenta senza nome: manca solo il nome", JSON.stringify(e));
  e = await pm({ vetrina_attiva: false, nome_attivita: "X", email_confermata: false });
  ok(e.completo === false && e.mancanti.join() === "email", "scheda spenta, email non confermata: ferma", JSON.stringify(e));
  e = await pm(Object.assign({ vetrina_attiva: true }, soloNome));
  ok(e.completo === false && e.totale === 7, "scheda ACCESA con solo il nome: servono tutte e 7", JSON.stringify(e));
  e = await pm(Object.assign({}, soloNome));
  ok(e.completo === false && e.totale === 7, "colonna mancante: tutte e 7, come prima", JSON.stringify(e));
  e = await pm(Object.assign({ vetrina_attiva: null }, soloNome));
  ok(e.totale === 7, "vetrina vuota (null): tutte e 7", JSON.stringify(e));
  e = await pm(Object.assign({ vetrina_attiva: "false" }, soloNome));
  ok(e.totale === 7, "«false» scritto come testo: non vale, tutte e 7", JSON.stringify(e));
  e = await pm(Object.assign({ vetrina_attiva: true }, pieno));
  ok(e.completo === true && e.totale === 7, "scheda accesa e profilo pieno: entra (7 voci)", JSON.stringify(e));

  await browser.close(); srv.close();
  console.log("\n" + verdi + " verdi, " + rossi + " rossi");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
