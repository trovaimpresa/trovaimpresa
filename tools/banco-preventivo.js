/* 13 nov 2026 — IL BANCO DEL PREVENTIVO (quarto giro, lista «MANCA», gruppo 2)
     node tools/banco-preventivo.js
   Apre App e Noleggio col sito e il database finti del banco e prova, cliccando:
   1. Preventivo: ogni voce ha l'unità di misura e il suo totale, che cambia
      mentre scrivi; al «Salva» l'unità parte su TUTTE le righe.
   2. PDF del preventivo: «85,5 mq», la firma «Per accettazione», e l'indirizzo
      del cliente con CAP e città. (Serve jsPDF: cd /tmp/banco && npm i --no-save jspdf@2.5.1)
   3. Lavoro: le voci del preventivo dicono l'unità.
   4. Noleggio: CAP e città dell'azienda nella testata dei PDF, e le caselle
      nei Dati azienda.
   Sulla versione di PRIMA deve dare rosso (provato il 13 nov).  */
"use strict";
const fs = require("fs");
const B = require("./banco-gestionale.js");
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
const JSPDF = "/tmp/banco/node_modules/jspdf/dist/jspdf.umd.min.js";
(async () => {
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  let rossi = 0, verdi = 0;
  const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto) : "")); } };
  const haPdf = fs.existsSync(JSPDF);
  if (!haPdf) console.log("⚠ jsPDF non c'è in /tmp/banco: le prove dei PDF si saltano (cd /tmp/banco && npm i --no-save jspdf@2.5.1)");
  const apri = async (W, nome) => {
    const ctx = await browser.newContext(W < 800 ? { viewport: { width: W, height: 700 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    page.on("dialog", d => d.dismiss().catch(() => {}));
    await B.collega(page, { rete: true, scritture: [] });
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
    if (haPdf) { const lib = fs.readFileSync(JSPDF); await page.route("**/jspdf.umd.min.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: lib })); }
    const P = B.PAGINE[nome];
    await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
    await P.entra(page);
    return { ctx, page, P, scritte };
  };
  /* raccoglie i testi che il PDF scrive, senza scaricare niente */
  const TESTI_PDF = `(function(){ window.__pdfTesti=[]; var O=window.jspdf.jsPDF; if(O.__avvolto)return;
    var N=function(a){ var d=new O(a), t=d.text; d.text=function(x){ [].concat(x).forEach(function(s){window.__pdfTesti.push(String(s));}); return t.apply(d,arguments); }; d.save=function(){ return d; }; return d; };
    N.__avvolto=1; N.API=O.API; window.jspdf={jsPDF:N}; })();`;

  for (const W of [1440, 375]) {
    console.log("\nApp a " + W + " px");
    const { ctx, page, P, scritte } = await apri(W, "app");
    await P.apri(page, "preventivi"); await B.aspetta(page, 1500);

    /* ---------- 1. il modulo ---------- */
    const f = await page.evaluate(async () => {
      await prevForm(prevCache.find(p => +p.numero === 1) || prevCache[0]); await new Promise(r => setTimeout(r, 700));
      const righe = [...document.querySelectorAll("#prev-righe [data-riga]:not([data-sezione])")]; const r0 = righe[0];
      const um = r0 && r0.querySelector(".pr-um"), tot = r0 && r0.querySelector(".pr-tot");
      if (!um || !tot) return { manca: true };
      const out = { um0: um.value, tot0: tot.textContent.trim(), opzioni: um.options.length };
      const pezzi = [r0.querySelector(".pr-qta"), um, r0.querySelector(".pr-prezzo"), tot, r0.querySelector(".rdel")];
      out.fuori = pezzi.some(e => { const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 || b.left < -1; });
      out.piccolo = pezzi.map(e => parseFloat(getComputedStyle(e).fontSize)).filter(x => x < 14).length;
      out.alti = Math.min.apply(null, [r0.querySelector(".pr-qta"), um, r0.querySelector(".pr-prezzo"), r0.querySelector(".rdel")].map(e => Math.round(e.getBoundingClientRect().height)));
      out.descLarga = Math.round(r0.querySelector(".pr-desc").getBoundingClientRect().width);
      const q = r0.querySelector(".pr-qta"); q.value = "10"; q.dispatchEvent(new Event("input", { bubbles: true }));
      out.tot1 = tot.textContent.trim();
      document.querySelector('[data-action="prev-riga-add"]').click(); await new Promise(r => setTimeout(r, 200));
      const nuova = [...document.querySelectorAll("#prev-righe [data-riga]:not([data-sezione])")].pop();
      out.totNuova0 = nuova.querySelector(".pr-tot").textContent.trim();
      nuova.querySelector(".pr-desc").value = "Voce di prova"; const pz = nuova.querySelector(".pr-prezzo"); pz.value = "12,5"; pz.dispatchEvent(new Event("input", { bubbles: true }));
      out.totNuova1 = nuova.querySelector(".pr-tot").textContent.trim();
      const u2 = nuova.querySelector(".pr-um"); u2.value = "ora"; u2.dispatchEvent(new Event("change", { bubbles: true }));
      out.somma = (document.getElementById("prev-somma") || {}).textContent;
      return out;
    });
    prova(!f.manca, "Preventivo: ogni voce ha la tendina dell'unità e il suo totale");
    if (!f.manca) {
      prova(f.um0 === "m²" && f.opzioni >= 12, "Preventivo: l'unità salvata si rilegge («m²») e la tendina è quella del computo", [f.um0, f.opzioni]);
      prova(/^= 2\.770,20/.test(f.tot0), "Preventivo: totale della voce 85,5 × 32,40 = 2.770,20 €", f.tot0);
      prova(/^= 324,00/.test(f.tot1), "Preventivo: cambiando la quantità il totale della voce cambia subito (10 × 32,40 = 324,00 €)", f.tot1);
      prova(f.totNuova0 === "" && /^= 12,50/.test(f.totNuova1), "Preventivo: una voce nuova non ha totale finché non c'è il prezzo; poi «= 12,50 €»", [f.totNuova0, f.totNuova1]);
      prova(/4\.440,50/.test(f.somma || ""), "Preventivo: il totale in fondo è la somma dei totali di riga (324,00 + 4.104,00 + 12,50)", f.somma);
      prova(!f.fuori && f.piccolo === 0 && (W > 800 || f.alti >= 44) && f.descLarga >= 240, "Preventivo: tutto nello schermo, testo da 14 px in su, caselle alte almeno 44 px sul telefono, descrizione larga", f);
      scritte.length = 0;
      await page.click('[data-action="save-prev"]'); await B.aspetta(page, 1800);
      const s = scritte.find(x => x.m === "POST" && x.tab.indexOf("gest_preventivo_righe") === 0 && Array.isArray(x.corpo));
      prova(!!s && s.corpo.length === 3 && s.corpo.every(r => "unita" in r) && s.corpo[0].unita === "m²" && s.corpo[2].unita === "ora", "Preventivo: «Salva» scrive l'unità su TUTTE le righe (m², m², ora)", s && s.corpo.map(r => r.unita));
    }

    /* ---------- 2. il PDF ---------- */
    if (haPdf) {
      await page.evaluate(() => { try { closeSheet(); } catch (_) {} }); await B.aspetta(page, 400);
      const t = await page.evaluate(async (TESTI) => {
        if (!(await caricaJsPDF())) return null; eval(TESTI);
        await prevPdf((prevCache.find(p => +p.numero === 1) || prevCache[0]).id); return window.__pdfTesti;
      }, TESTI_PDF);
      const tt = (t || []).join(" | ");
      prova(/85,5 mq/.test(tt), "PDF preventivo: accanto alla quantità c'è l'unità («85,5 mq»)", tt.slice(0, 400));
      prova(/Per accettazione/.test(tt) && /Firma del cliente/.test(tt) && /\| Data( \||$)/.test(tt + " |"), "PDF preventivo: in fondo «Per accettazione», Data e Firma del cliente");
      prova(/Via Giuseppe Garibaldi 128, scala B, 02100 Rieti \(RI\)/.test(tt), "PDF preventivo: l'indirizzo del cliente ha CAP, città e provincia");
      prova(/2\.770,20/.test(tt) && /7\.561,62/.test(tt), "PDF preventivo: i conti non sono cambiati (2.770,20 e totale 7.561,62)");
      /* la scheda lavoro */
      const tl = await page.evaluate(async (TESTI) => {
        eval(TESTI);
        const { data } = await sb.from("gest_lavori").select("id,cliente_id").not("cliente_id", "is", null).limit(1);
        if (!data || !data[0] || typeof generaPdf !== "function") return null;
        await generaPdf(data[0].id); return window.__pdfTesti;
      }, TESTI_PDF);
      prova(/\d{5} Rieti \(RI\)/.test((tl || []).filter(x => !/Via del Cantiere/.test(x)).join(" | ")), "PDF scheda lavoro: l'indirizzo del cliente ha CAP, città e provincia", (tl || []).slice(0, 12));
    }

    /* ---------- 3. il lavoro ---------- */
    await page.evaluate(() => { try { closeSheet(); } catch (_) {} }); await B.aspetta(page, 400);
    await P.apri(page, "lavori"); await B.aspetta(page, 1500);
    const l = await page.evaluate(async () => {
      const { data } = await sb.from("gest_lavori").select("id").eq("descrizione", "Tinteggiatura soggiorno").maybeSingle();
      const b = document.querySelector('[data-action="edit-job"][data-id="' + data.id + '"]'); if (!b) return { noBtn: true };
      b.click(); await new Promise(r => setTimeout(r, 2500));
      const w = document.getElementById("lav-prev-wrap"); return w ? { txt: w.innerText } : { manca: true };
    });
    prova(/60 m² ×/.test(l.txt || "") && /1 a corpo ×/.test(l.txt || "") && /800,00/.test(l.txt || ""), "Lavoro: le voci del preventivo dicono l'unità («60 m² ×», «1 a corpo ×») e il totale resta 800,00 €", l.txt);
    const err = await page.evaluate(() => window.__bancoErr || []);
    prova(!err.length, "Nessun errore JavaScript", err);
    await ctx.close();
  }

  /* ---------- 4. il Noleggio ---------- */
  for (const W of [1440, 375]) {
    console.log("\nNoleggio a " + W + " px");
    const { ctx, page, P } = await apri(W, "noleggio");
    await P.apri(page, "fatture"); await B.aspetta(page, 1200);
    const n = await page.evaluate(async () => {
      const out = {};
      const r = await sb.from("nol_fatture").select("*").limit(1);
      const d = (window.__nolFatturaPerProva && r.data && r.data[0]) ? await window.__nolFatturaPerProva(r.data[0]) : null;
      const bl = d && (d.blocchi || d); const te = Array.isArray(bl) ? bl.find(b => b.t === "testata") : null;
      out.sotto = te ? te.sotto : null;
      await aziendaForm(); await new Promise(r => setTimeout(r, 600));
      const c = ["a-cap", "a-citta", "a-prov"].map(id => document.getElementById(id));
      out.caselle = c.every(Boolean); if (!out.caselle) return out;
      out.cap = c[0].value; out.citta = c[1].value;
      out.fuori = c.some(e => e.getBoundingClientRect().right > innerWidth + 1);
      out.piccolo = c.map(e => parseFloat(getComputedStyle(e).fontSize)).filter(x => x < 14).length;
      out.alti = Math.min.apply(null, c.map(e => Math.round(e.getBoundingClientRect().height)));
      return out;
    });
    prova(!!n.sotto && n.sotto.some(x => /Via del Cantiere 10, 02100 Rieti \(RI\)/.test(x)), "Noleggio: nella testata del PDF l'azienda ha via, CAP, città e provincia", n.sotto);
    prova(n.caselle && n.cap === "02100" && n.citta === "Rieti", "Noleggio: nei Dati azienda ci sono CAP, Città e Provincia, già pieni", n);
    prova(n.caselle && !n.fuori && n.piccolo === 0 && n.alti >= 44, "Noleggio: caselle nello schermo, testo da 14 px in su, alte almeno 44 px", n);
    const err = await page.evaluate(() => window.__bancoErr || []);
    prova(!err.length, "Nessun errore JavaScript", err);
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log("\n" + (rossi ? "ROSSO: " + rossi + " prove fallite" : "VERDE") + " (" + verdi + " passate)");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
