/* 13 nov 2026 — LE FOTO DEL GESTIONALE, col sito e il database finti del banco.
   Serve per far vedere ad Alex «come viene» PRIMA di toccare i file veri.
     node tools/foto-gestionale.js <app|noleggio> <sezione> <larghezza> <file.png> [css-di-prova] [js-di-prova]
   css-di-prova: un file .css messo sopra la pagina solo per la foto (la proposta).
   js-di-prova:  un file .js eseguito nella pagina prima della foto.            */
"use strict";
const fs = require("fs");
const B = require("./banco-gestionale.js");
(async () => {
  const [, , nome, sezione, larg, file, css, js] = process.argv;
  const W = +larg || 375, telefono = W < 800, P = B.PAGINE[nome];
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  const ctx = await browser.newContext(telefono ? { viewport: { width: W, height: +process.env.ALTO || 700 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: W, height: 900 } });
  const page = await ctx.newPage();
  page.on("dialog", d => d.dismiss().catch(() => {}));
  await B.collega(page, { rete: true, scritture: [] });
  await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
  await P.entra(page);
  await P.apri(page, sezione); await B.aspetta(page, 1500);
  if (css && css !== "-") await page.addStyleTag({ content: fs.readFileSync(css, "utf8") });
  if (js) await page.evaluate(fs.readFileSync(js, "utf8"));
  await B.aspetta(page, 700);
  const m = await page.evaluate(() => {
    const H = innerHeight, r = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { su: Math.round(b.top), giu: Math.round(b.bottom) }; };
    const barra = document.getElementById("barra-basso"), bb = barra && getComputedStyle(barra).display !== "none" ? Math.round(barra.getBoundingClientRect().top) : null;
    return { altoSchermo: H, barraInBasso: bb, manda: r("chat-manda"), casella: r("chat-domanda"), scorre: document.documentElement.scrollHeight - H };
  });
  console.log(JSON.stringify(m), await page.title());
  await page.screenshot({ path: file });
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(2); });
