/* 13 nov 2026 — IL BANCO DEI SOLDI (quarto giro, lista «MANCA», gruppo 1)
     node tools/banco-soldi.js
   Apre l'App col sito e il database finti del banco e prova, cliccando:
   1. Fattura: il riquadro «Pagamento» (scadenza, modo, IBAN) c'è, la scadenza
      segue la data, l'IBAN sparisce coi contanti, e al «Salva» partono
      scadenza, modo_pagamento e iban.
   2. Ricevuta di pagamento: scelto il cliente escono le sue fatture da
      saldare; col saldo parte fattura_id e la fattura diventa pagata; con un
      acconto la fattura NON viene toccata.
   3. Lavoro nato da un preventivo: dentro ci sono le voci e il totale.
   Sulla versione di PRIMA deve dare rosso (provato il 13 nov: 22 rossi su 24).  */
"use strict";
const B = require("./banco-gestionale.js");
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
(async () => {
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  let rossi = 0, verdi = 0;
  const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto) : "")); } };
  for (const W of [1440, 375]) {
    console.log("\nApp a " + W + " px");
    const ctx = await browser.newContext(W < 800 ? { viewport: { width: W, height: 700 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    page.on("dialog", d => d.dismiss().catch(() => {}));
    await B.collega(page, { rete: true, scritture: [] });
    /* le scritture che il banco di base lascia cadere: qui servono le risposte */
    const scritte = [];
    await page.route("**/rest/v1/**", async (route) => {
      const r = route.request(), m = r.method(), tab = new URL(r.url()).pathname.replace("/rest/v1/", "");
      if (m === "GET" || m === "HEAD" || m === "OPTIONS" || /^rpc\//.test(tab)) return route.fallback();
      let corpo = null; try { corpo = JSON.parse(r.postData() || "null"); } catch (_) {}
      scritte.push({ m, tab, corpo });
      const riga = Object.assign({ id: "00000000-0000-4000-8000-00000000f001" }, Array.isArray(corpo) ? corpo[0] : corpo);
      const uno = /vnd\.pgrst\.object/.test(r.headers()["accept"] || "");
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(uno ? riga : [riga]) });
    });
    const P = B.PAGINE.app;
    await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
    await P.entra(page);

    /* ---------- 1. la fattura ---------- */
    await P.apri(page, "fatture"); await B.aspetta(page, 1500);
    const f1 = await page.evaluate(async () => {
      const f = fattCache.find(x => x.stato === "bozza"); await fattForm(f); await new Promise(r => setTimeout(r, 600));
      const q = id => document.getElementById(id); const sc = q("fa-scad"), mo = q("fa-modo"), ib = q("fa-iban"), da = q("fa-data");
      if (!sc || !mo || !ib) return { manca: true };
      const out = { scad0: sc.value, data0: da.value, iban0: ib.value, modo0: mo.value };
      const alti = [sc, mo, ib].map(e => Math.round(e.getBoundingClientRect().height));
      out.alti = Math.min.apply(null, alti);
      out.fuori = [sc, mo, ib].some(e => e.getBoundingClientRect().right > innerWidth + 1);
      out.piccolo = [...q("fa-scad").closest(".sh-b").querySelectorAll("label,input,select,.sh-tit")].map(e => parseFloat(getComputedStyle(e).fontSize)).filter(x => x < 14).length;
      da.value = "2026-03-01"; da.dispatchEvent(new Event("change", { bubbles: true })); out.scad1 = sc.value;
      mo.value = "contanti"; mo.dispatchEvent(new Event("change", { bubbles: true }));
      out.ibanNascosto = getComputedStyle(q("fa-iban-wrap")).display === "none";
      return out;
    });
    prova(!f1.manca, "Fattura: c'è il riquadro «Pagamento»");
    if (!f1.manca) {
      prova(/^\d{4}-\d\d-\d\d$/.test(f1.scad0) && f1.scad0 > f1.data0, "Fattura: «Da pagare entro» nasce già piena (data + giorni)", f1);
      prova(f1.iban0.indexOf("IT60") === 0, "Fattura: l'IBAN arriva dai Dati azienda", f1.iban0);
      prova(f1.scad1 === "2026-03-31", "Fattura: cambiando la data, la scadenza la segue (1 mar → 31 mar)", f1.scad1);
      prova(f1.ibanNascosto, "Fattura: coi contanti la casella dell'IBAN sparisce");
      prova(!f1.fuori && f1.piccolo === 0 && (W > 800 || f1.alti >= 44), "Fattura: caselle nello schermo, testo da 14 px in su, alte almeno 44 px sul telefono", f1);
      scritte.length = 0;
      await page.click('[data-action="save-fatt"]'); await B.aspetta(page, 1500);
      const s = scritte.find(x => x.tab.indexOf("gest_fatture") === 0 && x.corpo && "scadenza" in x.corpo);
      prova(!!s && s.corpo.scadenza === "2026-03-31" && s.corpo.modo_pagamento === "contanti" && s.corpo.iban === null, "Fattura: «Salva» scrive scadenza, modo e (coi contanti) nessun IBAN", s && [s.corpo.scadenza, s.corpo.modo_pagamento, s.corpo.iban]);
    }

    /* ---------- 2. la ricevuta ---------- */
    const ric = async (importo) => {
      await page.evaluate(() => { try { closeSheet(); } catch (_) {} }); await B.aspetta(page, 400);
      await P.apri(page, "fatture"); await B.aspetta(page, 1200);
      const r = await page.evaluate(async (importo) => {
        if (!window.gestRicevutePagamento) return { manca: true };
        await window.gestRicevutePagamento.nuova(); await new Promise(r => setTimeout(r, 500));
        const s = document.getElementById("rp-cli"), f = document.getElementById("rp-fatt");
        if (!f) return { manca: true };
        const o = [...s.options].find(o => /Rossi/.test(o.text)); s.value = o.value; s.dispatchEvent(new Event("change"));
        await new Promise(r => setTimeout(r, 1000));
        const out = { opz: [...f.options].map(o => o.text), vede: getComputedStyle(document.getElementById("rp-fatt-wrap")).display !== "none" };
        if (f.options.length < 2) return out;
        f.selectedIndex = 1; f.dispatchEvent(new Event("change"));
        const i = document.getElementById("rp-imp"); out.imp = i.value; out.caus = document.getElementById("rp-caus").value;
        if (importo) { i.value = importo; i.dispatchEvent(new Event("input", { bubbles: true })); }
        out.dice = document.getElementById("rp-fatt-dice").textContent;
        out.fuori = f.getBoundingClientRect().right > innerWidth + 1;
        return out;
      }, importo);
      if (r.manca || !r.imp) return { r, s: [] };
      scritte.length = 0;
      /* il PDF non serve al banco: senza jsPDF la pagina lo dice e va avanti */
      await page.click("[data-rp-salva]"); await B.aspetta(page, 2500);
      return { r, s: scritte.slice() };
    };
    let x = await ric(null);
    prova(!x.r.manca && x.r.vede && x.r.opz.length === 2 && /1\/\d{4}/.test(x.r.opz[1]) && /305,00/.test(x.r.opz[1]), "Ricevuta: scelto il cliente esce la sua fattura da saldare (n. 1, 305,00 €)", x.r.opz);
    prova(x.r.imp === "305,00" && /^Saldo fattura n\. 1\//.test(x.r.caus || ""), "Ricevuta: scelta la fattura, importo e «Per» si riempiono da soli", [x.r.imp, x.r.caus]);
    prova(/risulta pagata/.test(x.r.dice || "") && !x.r.fuori, "Ricevuta: dice che la fattura risulta pagata, e sta nello schermo", x.r.dice);
    let ins = x.s.find(s => s.m === "POST" && s.tab === "gest_ricevute_pagamento"), pag = x.s.find(s => s.m === "PATCH" && s.tab === "gest_fatture" && s.corpo && s.corpo.stato === "pagata");
    prova(!!ins && !!ins.corpo.fattura_id && /^n\. 1\//.test(ins.corpo.fattura_nome || ""), "Ricevuta: «Salva» lega la ricevuta alla fattura", ins && ins.corpo);
    prova(!!pag && !!pag.corpo.data_pagata, "Ricevuta: col saldo la fattura diventa pagata", x.s.map(s => s.m + " " + s.tab));
    x = await ric("100,00");
    ins = x.s.find(s => s.m === "POST" && s.tab === "gest_ricevute_pagamento"); pag = x.s.find(s => s.m === "PATCH" && s.tab === "gest_fatture");
    prova(/acconto/i.test(x.r.dice || "") && /205,00/.test(x.r.dice || ""), "Ricevuta: con 100 € dice «acconto, restano 205,00 €»", x.r.dice);
    prova(!!ins && !!ins.corpo.fattura_id && !pag, "Ricevuta: l'acconto si lega alla fattura ma NON la segna pagata", x.s.map(s => s.m + " " + s.tab));

    /* ---------- 3. il lavoro dal preventivo ---------- */
    await page.evaluate(() => { try { closeSheet(); } catch (_) {} }); await B.aspetta(page, 400);
    await P.apri(page, "lavori"); await B.aspetta(page, 1500);
    const l = await page.evaluate(async () => {
      const { data } = await sb.from("gest_lavori").select("id").eq("descrizione", "Tinteggiatura soggiorno").maybeSingle();
      const b = document.querySelector('[data-action="edit-job"][data-id="' + data.id + '"]'); if (!b) return { noBtn: true };
      b.click(); await new Promise(r => setTimeout(r, 2500));
      const w = document.getElementById("lav-prev-wrap"); if (!w) return { manca: true };
      const bt = w.querySelector("button");
      return { vede: getComputedStyle(w).display !== "none", txt: w.innerText, righe: w.querySelectorAll(".lpv-riga").length,
        piccolo: [...w.querySelectorAll("*")].map(e => parseFloat(getComputedStyle(e).fontSize)).filter(x => x < 14).length,
        fuori: [...w.querySelectorAll("*")].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length, btn: bt ? Math.round(bt.getBoundingClientRect().height) : 0 };
    });
    prova(!l.manca && !l.noBtn && l.vede && /preventivo N\. 2/.test(l.txt || ""), "Lavoro: dentro ci sono «Le voci del preventivo N. 2»", l.txt);
    prova(l.righe === 4 && /Tinteggiatura pareti/.test(l.txt || "") && /570,00/.test(l.txt || "") && /800,00/.test(l.txt || ""), "Lavoro: 3 voci coi loro importi e il totale 800,00 €", l.righe);
    prova(l.piccolo === 0 && l.fuori === 0 && l.btn >= 44, "Lavoro: testo da 14 px in su, niente fuori schermo, pulsante alto almeno 44 px", l);
    const err = await page.evaluate(() => window.__bancoErr || []);
    prova(!err.length, "Nessun errore JavaScript", err);
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log("\n" + (rossi ? "ROSSO: " + rossi + " prove fallite" : "VERDE") + " (" + verdi + " passate)");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
