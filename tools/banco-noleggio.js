/* 13 nov 2026 — IL BANCO DEL NOLEGGIO (quarto giro, lista «MANCA», gruppo 3)
     node tools/banco-noleggio.js
   Apre il Noleggio col sito e il database finti del banco e prova:
   11. Cliente: CAP, città, provincia, codice fiscale, codice destinatario e PEC
       nel modulo e al «Salva»; un codice fiscale scritto nella vecchia casella
       «P.IVA» si vede (e si salva) nella sua; un codice destinatario corto si
       segna sulla casella e non salva.
   13. Fattura: il PDF elenca i DDT (consegna e rientro) dei noleggi; il file per
       lo SdI ha <DatiDDT> con le righe.
   14. Contratto e scheda del noleggio: «IVA esclusa»; il modulo lo dice.
   15. Cestino: la riga del noleggio dice mezzo, cliente e giorno di uscita.
   Sulla versione di PRIMA deve dare rosso.
   (Serve jsPDF: cd /tmp/banco && npm i --no-save jspdf@2.5.1)  */
"use strict";
const fs = require("fs");
const B = require("./banco-gestionale.js");
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
const JSPDF = "/tmp/banco/node_modules/jspdf/dist/jspdf.umd.min.js";
const CLI = "00000000-0000-4000-8000-000000000101";
(async () => {
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  let rossi = 0, verdi = 0;
  const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto).slice(0, 300) : "")); } };
  const haPdf = fs.existsSync(JSPDF);
  if (!haPdf) console.log("⚠ jsPDF non c'è in /tmp/banco: le prove dei PDF si saltano");
  const TESTI_PDF = `(function(){ window.__pdfTesti=[]; var O=window.jspdf.jsPDF; if(O.__avvolto)return;
    var N=function(a){ var d=new O(a), t=d.text; d.text=function(x){ [].concat(x).forEach(function(s){window.__pdfTesti.push(String(s));}); return t.apply(d,arguments); }; d.save=function(){ return d; }; return d; };
    N.__avvolto=1; N.API=O.API; window.jspdf={jsPDF:N}; })();`;

  for (const W of [1440, 375]) {
    console.log("\nNoleggio a " + W + " px");
    const ctx = await browser.newContext(W < 800 ? { viewport: { width: W, height: 700 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    page.on("dialog", d => d.dismiss().catch(() => {}));
    const errori = []; page.on("pageerror", e => errori.push(e.message));
    await B.collega(page, { rete: true, scritture: [] });
    const scritte = [];
    await page.route("**/rest/v1/**", async (route) => {
      const r = route.request(), m = r.method(), tab = new URL(r.url()).pathname.replace("/rest/v1/", "");
      if (m === "GET" || m === "HEAD" || m === "OPTIONS" || /^rpc\//.test(tab)) return route.fallback();
      let corpo = null; try { corpo = JSON.parse(r.postData() || "null"); } catch (_) {}
      scritte.push({ m, tab, corpo });
      const riga = Object.assign({ id: "00000000-0000-4000-8000-00000000f001" }, Array.isArray(corpo) ? corpo[0] : corpo);
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify([riga]) });
    });
    if (haPdf) { const lib = fs.readFileSync(JSPDF); await page.route("**/jspdf.umd.min.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: lib })); }
    const P = B.PAGINE.noleggio;
    await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
    await P.entra(page);
    await P.apri(page, "clienti-nol"); await B.aspetta(page, 1200);

    /* ---------- 11. il cliente ---------- */
    const m = await page.evaluate(async (CLI) => {
      const r = await sb.from("gest_clienti").select("*").eq("id", CLI).maybeSingle();
      schedaClienteNol(r.data); await new Promise(x => setTimeout(x, 600));
      const v = id => { const e = document.getElementById(id); return e ? e.value : null; };
      return { cap: v("ncl-cap"), citta: v("ncl-citta"), prov: v("ncl-prov"), cf: v("ncl-cf"), sdi: v("ncl-sdi"), pec: v("ncl-pec"), colonne: !!document.querySelector("#sheet .sh-cols") };
    }, CLI);
    prova(m.cap === "02100" && m.citta === "Rieti" && m.prov === "RI", "cliente: CAP, città e provincia nel modulo", m);
    prova(m.sdi === "0000000" && m.pec !== null && m.cf === "00000000001", "cliente: codice destinatario, PEC e codice fiscale nel modulo", m);
    prova(m.colonne, "cliente: finestra a due colonne");
    scritte.length = 0;
    await page.evaluate(() => { const s = (id, x) => { const e = document.getElementById(id); if (!e) return; e.value = x; e.dispatchEvent(new Event("input", { bubbles: true })); }; s("ncl-sdi", "abc1234"); s("ncl-pec", "rossi@pec.it"); s("ncl-cap", "00100"); s("ncl-citta", "Roma"); s("ncl-prov", "rm"); });
    await page.evaluate(() => document.querySelector('#sheet [data-action="save-clinol"]').click());
    await B.aspetta(page, 900);
    const up = scritte.find(s => s.tab === "gest_clienti" && s.m === "PATCH");
    const c = up && up.corpo || {};
    prova(c.sdi_codice === "ABC1234" && c.sdi_pec === "rossi@pec.it", "cliente: «Salva» scrive codice destinatario (maiuscolo) e PEC", c);
    prova(c.cap === "00100" && c.citta === "Roma" && c.prov === "RM" && "cod_fiscale" in c, "cliente: «Salva» scrive CAP, città, provincia, codice fiscale", c);
    /* codice destinatario corto: non salva, segna la casella */
    scritte.length = 0;
    const corto = await page.evaluate(async () => {
      schedaClienteNol(null); await new Promise(x => setTimeout(x, 500));
      document.getElementById("ncl-nome").value = "PROVA BANCO"; const e0 = document.getElementById("ncl-sdi"); if (!e0) return { manca: true }; e0.value = "AB12";
      document.querySelector('#sheet [data-action="save-clinol"]').click(); await new Promise(x => setTimeout(x, 500));
      const e = document.getElementById("ncl-sdi"); const msg = e.parentElement.querySelector(".nol-manca");
      return { rosso: e.classList.contains("ctr-rosso"), msg: msg ? msg.textContent : "" };
    });
    prova(corto.rosso && /7 caratteri/.test(corto.msg) && !scritte.some(s => s.tab === "gest_clienti"), "cliente: codice destinatario di 4 caratteri → casella rossa, niente salvato", corto);
    /* un codice fiscale scritto nella vecchia casella «P.IVA / Codice Fiscale» */
    const vecchio = await page.evaluate(async () => {
      try { closeSheet(); } catch (_) {}
      schedaClienteNol({ id: "x", nome: "Privato vecchio", piva: "RSSMRA80A01H501U" }); await new Promise(x => setTimeout(x, 500));
      const cf = document.getElementById("ncl-cf"); return { piva: document.getElementById("ncl-piva").value, cf: cf ? cf.value : null };
    });
    prova(vecchio.cf === "RSSMRA80A01H501U" && vecchio.piva === "", "cliente: un codice fiscale nella vecchia «P.IVA» va nella casella giusta", vecchio);
    await page.evaluate(() => { try { closeSheet(); } catch (_) {} });

    /* ---------- numeri: una serie sola con l'App ---------- */
    if (W === 1440) {
      scritte.length = 0;
      const nu = await page.evaluate(async (CLI) => {
        await schedaFatturaNol(null); await new Promise(x => setTimeout(x, 700));
        const sel = document.getElementById("nf-cliente"); sel.value = CLI;
        fattnolRighe = [{ voce: "Noleggio di prova", dettaglio: "", importo: 100 }];
        const b = document.querySelector('#nf-stato button[data-v="emessa"]'); if (b) b.click();
        document.querySelector('#sheet [data-action="save-fattnol"]').click();
        for (let i = 0; i < 30; i++) { await new Promise(x => setTimeout(x, 100)); const si = document.querySelector(".tif-si"); if (si) { const t = (si.closest("[role=dialog]") || si.parentElement.parentElement).textContent; si.click(); return t; } }
        return "";
      }, CLI);
      await B.aspetta(page, 900);
      const ins = scritte.find(s => s.tab === "nol_fatture" && s.m === "POST");
      const az = scritte.find(s => s.tab === "gest_azienda");
      prova(/numero 3/.test(nu), "fattura del Noleggio: la domanda dice il numero 3 (dopo la 2 dell'App)", nu.slice(0, 160));
      prova(ins && ins.corpo && String(ins.corpo.numero) === "3", "fattura del Noleggio: salvata col numero 3", ins && ins.corpo && ins.corpo.numero);
      prova(!az, "fattura del Noleggio: il vecchio contatore dell'azienda non si tocca più", az);
      await page.evaluate(() => { try { closeSheet(); } catch (_) {} });
    }

    /* ---------- 14. il modulo del noleggio ---------- */
    const lab = await page.evaluate(async () => { schedaNoleggio(null); await new Promise(x => setTimeout(x, 800)); const e = document.getElementById("nn-importo"); const l = e && e.closest("div").querySelector("label"); const t = l ? l.textContent : ""; closeSheet(); return t; });
    prova(/IVA esclusa/.test(lab), "noleggio: la casella dell'importo dice «IVA esclusa»", lab);

    /* ---------- 15. il Cestino ---------- */
    const cz = await page.evaluate(() => {
      const c = CEST_COSE.find(c => c.t === "nol_noleggi");
      const r = { mezzo: "Escavatore", cliente: "Rossi Srl", data_uscita: "2026-03-05" };
      return c && c.nome ? c.nome(r) : cestNome(r);
    });
    prova(/Rossi Srl/.test(cz) && /05\/03\/2026/.test(cz), "cestino: la riga del noleggio dice cliente e giorno", cz);

    if (haPdf && W === 1440) {
      /* ---------- 13. la fattura in PDF e il file per lo SdI ---------- */
      await page.evaluate(TESTI_PDF);
      const ft = await page.evaluate(async (CLI) => {
        const r = await sb.from("nol_fatture").select("*").limit(1); const f = Object.assign({}, r.data[0], { cliente_id: CLI });
        window.__pdfTesti = []; nolDocPdf(await window.__nolFatturaPerProva(f)); await new Promise(x => setTimeout(x, 400));
        return window.__pdfTesti.join(" | ");
      }, CLI);
      prova(/DOCUMENTI DI TRASPORTO/.test(ft) && /\| 4 \|/.test(ft) && /\| 5 \|/.test(ft) && /Rientro/.test(ft), "fattura PDF: elenca il DDT 4 (consegna) e il DDT 5 (rientro)", ft.slice(0, 400));
      prova(/Codice destinatario/.test(ft) && /02100 Rieti/.test(ft), "fattura PDF: cliente con codice destinatario e CAP", ft.slice(0, 300));
      const xml = await page.evaluate(async (CLI) => {
        if (typeof window.__nolSdiXmlPerProva !== "function") return "";
        const r = await sb.from("nol_fatture").select("*").limit(1); const f = r.data[0];
        const cli = (await sb.from("gest_clienti").select("*").eq("id", CLI).maybeSingle()).data;
        const az = (await sb.from("gest_azienda").select("*").maybeSingle()).data;
        const ddt = typeof window.nolDdtDiFattura === "function" ? await window.nolDdtDiFattura(f.righe) : [];
        return window.__nolSdiXmlPerProva({ f, az, cli, ddt });
      }, CLI);
      prova(/<DatiDDT>\s*<NumeroDDT>4<\/NumeroDDT>\s*<DataDDT>\d{4}-\d\d-\d\d<\/DataDDT>\s*<RiferimentoNumeroLinea>1<\/RiferimentoNumeroLinea>/.test(xml) && /<NumeroDDT>5<\/NumeroDDT>/.test(xml), "file SdI: <DatiDDT> col DDT 4 e 5, riga 1", xml.slice(0, 200));
      prova(xml.indexOf("<DatiDDT>") > xml.indexOf("</DatiGeneraliDocumento>") && xml.indexOf("<DatiDDT>") < xml.indexOf("</DatiGenerali>"), "file SdI: <DatiDDT> sta dentro <DatiGenerali>, dopo il documento");
      /* ---------- 14. il contratto e la scheda in PDF ---------- */
      const ct = await page.evaluate(async (CLI) => {
        const r = await sb.from("nol_noleggi").select("*"); const n = Object.assign({}, r.data[1], { cliente_id: CLI, contratto_num: "7" });
        window.__pdfTesti = []; nolDocPdf(await nolContrattoDati(n)); await new Promise(x => setTimeout(x, 400));
        const a = window.__pdfTesti.join(" | ");
        window.__pdfTesti = []; nolPdf("noleggio", r.data[1]); await new Promise(x => setTimeout(x, 400));
        return { contratto: a, scheda: window.__pdfTesti.join(" | ") };
      }, CLI);
      prova(/TOTALE \(IVA esclusa\)/.test(ct.contratto) && /non compresa/.test(ct.contratto), "contratto PDF: «TOTALE (IVA esclusa)» e «IVA non compresa»", ct.contratto.slice(0, 300));
      prova(/02100 Rieti/.test(ct.contratto) && /Codice fiscale/.test(ct.contratto), "contratto PDF: cliente con CAP e codice fiscale");
      prova(/IVA esclusa/.test(ct.scheda), "scheda noleggio PDF: l'importo dice «IVA esclusa»", ct.scheda.slice(0, 300));
      const sc = await page.evaluate(async (CLI) => {
        const r = await sb.from("gest_clienti").select("*").eq("id", CLI).maybeSingle();
        window.__pdfTesti = []; nolPdf("cliente", r.data); await new Promise(x => setTimeout(x, 400));
        return window.__pdfTesti.join(" | ");
      }, CLI);
      prova(/Codice destinatario/.test(sc) && /02100 Rieti/.test(sc), "scheda cliente PDF: codice destinatario e CAP", sc.slice(0, 300));
    }
    prova(!errori.length, "nessun errore di JavaScript", errori.slice(0, 3));
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log("\n" + (rossi ? "✘ " + rossi + " ROSSI" : "✔ VERDE") + " (" + verdi + " verdi)");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
