/* 13 nov 2026 — IL BANCO DEL GRUPPO 4 (quarto giro, lista «MANCA»: i PDF e il lavoro)
     node tools/banco-gruppo4.js
   Apre App e Noleggio col sito e il database finti del banco e prova, cliccando:
   1. Ore sul lavoro: «Chi le ha fatte» si vede sempre, con «io» e «un'altra persona»;
      senza scegliere non si aggiunge niente.                                  (voce 7)
   2. Rapportino: «＋ Rapportino da far firmare» e «Fai firmare al cliente»; la firma
      col dito parte col «Salva»; il PDF ha ore, cliente e la firma.             (voce 6)
   3. SAL in PDF: le tre firme.                                                  (voce 12)
   4. Capitolato e verbale del Noleggio: le firme non restano da sole su una pagina. (voce 16)
   5. Dati azienda nel PDF delle Giornate e nelle schede del Noleggio.           (voce 9)
   6. Scheda lavoro: le voci del preventivo SENZA prezzi.
   Serve jsPDF: cd /tmp/banco && npm i --no-save jspdf@2.5.1
   Sulla versione di PRIMA deve dare rosso (provato il 13 nov). */
"use strict";
const fs = require("fs");
const B = require("./banco-gestionale.js");
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
const JSPDF = "/tmp/banco/node_modules/jspdf/dist/jspdf.umd.min.js";
const ID = n => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
(async () => {
  if (!fs.existsSync(JSPDF)) { console.log("Manca jsPDF: cd /tmp/banco && npm i --no-save jspdf@2.5.1"); process.exit(2); }
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  let rossi = 0, verdi = 0;
  const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto).slice(0, 300) : "")); } };
  const apri = async (W, nome) => {
    const ctx = await browser.newContext(W < 800 ? { viewport: { width: W, height: 800 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    page.on("dialog", d => d.dismiss().catch(() => {}));
    await B.collega(page, { rete: true, scritture: [] });
    const scritte = [];
    await page.route("**/rest/v1/**", async (route) => {
      const r = route.request(), m = r.method(), tab = new URL(r.url()).pathname.replace("/rest/v1/", "");
      if (m === "GET" || m === "HEAD" || m === "OPTIONS" || /^rpc\//.test(tab)) return route.fallback();
      let corpo = null; try { corpo = JSON.parse(r.postData() || "null"); } catch (_) {}
      scritte.push({ m, tab, corpo });
      const riga = Object.assign({ id: ID(381) }, Array.isArray(corpo) ? corpo[0] : corpo);
      const uno = /vnd\.pgrst\.object/.test(r.headers()["accept"] || "");
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(uno ? riga : [riga]) });
    });
    const lib = fs.readFileSync(JSPDF);
    await page.route("**/jspdf.umd.min.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: lib }));
    const P = B.PAGINE[nome];
    await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
    await P.entra(page);
    return { ctx, page, P, scritte };
  };
  /* i testi del PDF, con la pagina dove stanno; niente file scaricati */
  const TESTI_PDF = `(function(){ window.__pdf=[]; window.__pdfFatti=0; var O=(window.__jsO=window.__jsO||window.jspdf.jsPDF);
    var N=function(a){ var d=new O(a), t=d.text, ap=d.addPage, sp=d.setPage; d.__p=1; var mio=[]; window.__pdf.push(mio);
      d.addPage=function(){ var r=ap.apply(d,arguments); d.__p=d.getNumberOfPages(); return r; };
      d.setPage=function(n){ d.__p=n; return sp.apply(d,arguments); };
      d.text=function(x){ [].concat(x).forEach(function(s){ mio.push({p:d.__p,s:String(s)}); }); return t.apply(d,arguments); };
      d.save=function(){ window.__pdfFatti++; mio.pagine=d.getNumberOfPages(); mio.salvato=true; return d; }; return d; };
    N.API=O.API; window.jspdf={jsPDF:N}; })();`;
  const ultimoPdf = (page) => page.evaluate(() => { const s = (window.__pdf || []).filter(x => x.salvato); const u = s[s.length - 1]; return u ? { righe: u.slice(), pagine: u.pagine } : null; });
  const aspettaPdf = async (page, n) => { for (let i = 0; i < 40; i++) { const f = await page.evaluate(() => window.__pdfFatti || 0); if (f >= n) return true; await B.aspetta(page, 250); } return false; };
  const caricaPdf = (page) => page.evaluate(async (js) => { await caricaJsPDF(); eval(js); }, TESTI_PDF);

  for (const W of [1440, 375]) {
    console.log("\nApp a " + W + " px");
    const { ctx, page, P, scritte } = await apri(W, "app");
    await P.apri(page, "lavori"); await B.aspetta(page, 1200);
    await caricaPdf(page);

    /* ---------- 1. le ore: chi le ha fatte ---------- */
    const o = await page.evaluate(async (lid) => {
      const b = document.createElement("button"); b.dataset.action = "edit-job"; b.dataset.id = lid; document.body.appendChild(b); b.click(); b.remove();
      for (let i = 0; i < 30 && !(document.getElementById("or-chi") && document.getElementById("or-chi").options.length > 1); i++) await new Promise(r => setTimeout(r, 200));
      const sel = document.getElementById("or-chi"); if (!sel) return { manca: true };
      const vede = e => !!e && e.offsetParent !== null && getComputedStyle(e).display !== "none";
      const out = { vede: vede(sel), opzioni: [...sel.options].map(x => x.value + "|" + x.textContent), etichetta: (sel.closest("label") || {}).textContent || "",
        alto: Math.round(sel.getBoundingClientRect().height), dataOggi: (document.getElementById("or-data") || {}).value || "" };
      const box = document.getElementById("or-chi-nuovo-box");
      out.nuovoPrima = vede(box);
      sel.value = "__nuovo__"; sel.dispatchEvent(new Event("change", { bubbles: true }));
      out.nuovoDopo = vede(box);
      sel.value = ""; sel.dispatchEvent(new Event("change", { bubbles: true }));
      document.getElementById("or-ore").value = "2,5";
      document.querySelector('[data-action="ore-add"]').click();
      await new Promise(r => setTimeout(r, 600));
      out.segnata = !!sel.closest(".field,label") && (/manca chi/i.test(document.body.innerText));
      const r = sel.getBoundingClientRect(); out.fuori = r.right > innerWidth + 1;
      return out;
    }, ID(303));
    prova(!o.manca && o.vede, "Ore: «Chi le ha fatte» si vede", o);
    if (!o.manca) {
      prova(/Chi le ha fatte/.test(o.etichetta), "Ore: la casella ha il suo nome sopra («Chi le ha fatte»)", o.etichetta);
      prova(o.opzioni.some(x => /^__nuovo__\|/.test(x)), "Ore: c'è «Un'altra persona»", o.opzioni);
      prova(o.opzioni.some(x => /\(io\)|^__io__/.test(x)), "Ore: c'è «io»", o.opzioni);
      prova(o.opzioni.some(x => x.startsWith(ID(201) + "|")), "Ore: c'è la squadra (Giovanni Prova)", o.opzioni);
      prova(!o.nuovoPrima && o.nuovoDopo, "Ore: «Un'altra persona» apre la casella del nome", [o.nuovoPrima, o.nuovoDopo]);
      prova(/^\d{4}-\d{2}-\d{2}$/.test(o.dataOggi), "Ore: il giorno nasce già scritto (oggi)", o.dataOggi);
      prova(o.segnata && !scritte.some(s => s.tab === "gest_ore" && s.m === "POST"), "Ore: senza scegliere chi, non si aggiunge e lo dice", scritte.map(s => s.m + " " + s.tab));
      prova(!o.fuori && (W > 800 || o.alto >= 44), "Ore: la tendina sta nello schermo" + (W < 800 ? " ed è alta almeno 44 px" : ""), o);
    }
    /* con una persona scelta si aggiunge, col suo id */
    const o2 = await page.evaluate(async (op) => {
      const sel = document.getElementById("or-chi"); sel.value = op; sel.dispatchEvent(new Event("change", { bubbles: true }));
      document.getElementById("or-ore").value = "2,5"; document.querySelector('[data-action="ore-add"]').click();
      await new Promise(r => setTimeout(r, 900)); return true;
    }, ID(201));
    const post = scritte.find(s => s.tab === "gest_ore" && s.m === "POST");
    prova(o2 && post && post.corpo && post.corpo.operatore_id === ID(201) && +post.corpo.ore === 2.5, "Ore: scelta la persona, la riga parte col suo nome (operatore_id) e 2,5 ore", post && post.corpo);

    /* ---------- 2. il rapportino da far firmare ---------- */
    const r = await page.evaluate(async () => {
      const out = { nuovo: !!document.querySelector('#rap-wrap [data-action="rapf-nuovo"]') };
      const a = document.querySelector('#rap-list [data-action="rapf-apri"]'); out.riga = a ? a.textContent.trim() : "";
      if (!a) return out;
      a.click();
      for (let i = 0; i < 30 && !document.getElementById("rapf-pad"); i++) await new Promise(r => setTimeout(r, 200));
      const t = document.getElementById("rapf-pad"); out.pad = !!t;
      out.titolo = (document.querySelector("#sheet .sh-head h3") || {}).textContent || "";
      out.due = document.querySelectorAll("#sheet .sh-cols > .sh-col").length;
      out.ore = (document.getElementById("rapf-ore") || {}).innerText || "";
      out.cosa = (document.getElementById("rapf-cosa") || {}).value || "";
      out.nome = (document.getElementById("rapf-nome") || {}).value || "";
      out.stato = (document.getElementById("rapf-st") || {}).textContent || "";
      if (!t) return out;
      const R = t.getBoundingClientRect(); out.padFuori = R.right > innerWidth + 1 || R.width < 200;
      const ev = (ty, x, y) => t.dispatchEvent(new PointerEvent(ty, { clientX: R.left + x * R.width, clientY: R.top + y * R.height, bubbles: true, pointerId: 1 }));
      ev("pointerdown", .2, .6); [[.3, .3], [.4, .7], [.55, .4], [.7, .6]].forEach(p => ev("pointermove", p[0], p[1])); ev("pointerup", .7, .6);
      out.statoDopo = (document.getElementById("rapf-st") || {}).textContent || "";
      document.querySelector('[data-action="rapf-pdf"]').click();
      return out;
    });
    prova(r.nuovo, "Rapportino: dentro il lavoro c'è «＋ Rapportino da far firmare»");
    prova(/Fai firmare al cliente/.test(r.riga), "Rapportino: il rapportino della squadra ha «Fai firmare al cliente»", r.riga);
    prova(r.pad && /Rapportino da far firmare/.test(r.titolo) && r.due === 2, "Rapportino: finestra grande a due colonne con la tela della firma", r);
    prova(/Giovanni Prova/.test(r.ore) && /3 h/.test(r.ore), "Rapportino: le ore del registro di quel giorno (Giovanni Prova 3 h)", r.ore);
    prova(/flessibile/.test(r.cosa) && r.nome === "Rossi Mario", "Rapportino: cosa è stato fatto e il nome del cliente arrivano già scritti", [r.cosa, r.nome]);
    prova(/Non ancora firmato/.test(r.stato) && /premi «Salva»/.test(r.statoDopo), "Rapportino: la riga sotto la firma dice com'è messa", [r.stato, r.statoDopo]);
    prova(r.pad && !r.padFuori, "Rapportino: la tela della firma sta nello schermo", r);
    const okPdf = await aspettaPdf(page, 1);
    const rp = await ultimoPdf(page);
    const patch = scritte.filter(s => s.tab.startsWith("gest_rapportini")).pop();
    prova(patch && patch.corpo && patch.corpo.firma_cliente && /^data:image\/png/.test(patch.corpo.firma_cliente.img || "") && patch.corpo.firma_cliente.nome === "Rossi Mario" && patch.corpo.firma_cliente.hash,
      "Rapportino: il «PDF» salva la firma (disegno, nome, impronta) nella riga del rapportino", patch && { m: patch.m, tab: patch.tab, f: patch.corpo && patch.corpo.firma_cliente && Object.keys(patch.corpo.firma_cliente) });
    const tx = rp ? rp.righe.map(x => x.s).join("\n") : "";
    prova(okPdf && /RAPPORTINO DI LAVORO/.test(tx) && /Rossi Mario/.test(tx) && /Giovanni Prova/.test(tx) && /3 ore/.test(tx), "Rapportino PDF: titolo, cliente, chi c'era e le ore", tx.slice(0, 300));
    prova(/Il cliente/.test(tx) && /Firmato il/.test(tx) && /L'impresa/.test(tx), "Rapportino PDF: le due firme, e «Firmato il» sotto quella del cliente", tx.slice(-300));
    prova(/Impresa di prova/.test(tx) && /P\.IVA/.test(tx), "Rapportino PDF: i dati dell'azienda in testa");

    /* ---------- 3. SAL in PDF: le firme ---------- */
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} });
    const nPrima = await page.evaluate(() => window.__pdfFatti || 0);
    await page.evaluate((id) => salPdf(id), ID(961));
    await aspettaPdf(page, nPrima + 1);
    const sp = await ultimoPdf(page); const st = sp ? sp.righe.map(x => x.s).join("\n") : "";
    prova(/Il Direttore dei lavori/.test(st) && /L'Impresa/.test(st) && /Il Committente/.test(st), "SAL PDF: le tre firme (Impresa, Direttore dei lavori, Committente)", st.slice(-300));
    if (sp) { const ult = sp.righe.filter(x => x.p === sp.pagine && !/^Pag\. /.test(x.s) && !/quantit/i.test(x.s)); prova(ult.some(x => /NETTO DA PAGARE|Importo/.test(x.s)) || sp.pagine === 1, "SAL PDF: le firme stanno insieme al riquadro dei conti"); }

    /* ---------- 6. scheda lavoro: le voci senza prezzi ---------- */
    const n2 = await page.evaluate(() => window.__pdfFatti || 0);
    await page.evaluate((id) => generaPdf(id), ID(302));
    await aspettaPdf(page, n2 + 1);
    const sl = await ultimoPdf(page); const slt = sl ? sl.righe.map(x => x.s).join("\n") : "";
    prova(/Cosa comprende il lavoro/.test(slt) && /Tinteggiatura pareti/.test(slt) && /60 mq/.test(slt) && /1 a corpo/.test(slt), "Scheda lavoro PDF: le voci del preventivo con quantità e unità", slt.slice(0, 400));
    prova(!/9,50|120,00|EUR 9|5,00 EUR/.test(slt.replace(/800,00 EUR/g, "")), "Scheda lavoro PDF: nessun prezzo delle voci", slt);

    /* ---------- 5. Giornate in PDF: i dati dell'azienda ---------- */
    await P.apri(page, "giornate"); await B.aspetta(page, 1500);
    const n3 = await page.evaluate(() => window.__pdfFatti || 0);
    await page.evaluate(() => giorPdf());
    await aspettaPdf(page, n3 + 1);
    const gp = await ultimoPdf(page); const gt = gp ? gp.righe.map(x => x.s).join("\n") : "";
    prova(/Impresa di prova/.test(gt) && /P\.IVA 00000000009/.test(gt) && /Rieti/.test(gt), "Giornate PDF: nome, P.IVA e indirizzo dell'azienda", gt.slice(0, 200));

    /* ---------- 4. capitolato: le firme non da sole ---------- */
    if (W === 1440) {
      await P.apri(page, "preventivi"); await B.aspetta(page, 1200);
      const n4 = await page.evaluate(() => window.__pdfFatti || 0);
      await page.evaluate(async (pid) => {
        await gestCapitolato.apri(pid); await new Promise(r => setTimeout(r, 1500));
        document.querySelector('[data-action="cap-voce-add"]').click(); await new Promise(r => setTimeout(r, 100));
        document.querySelectorAll("#cp-voci .cap-voce").forEach((v, i) => { v.querySelector(".cp-v-tit").value = "Lavorazione numero " + (i + 1);
          v.querySelector(".cp-v-cosa").value = "Descrizione della lavorazione con i materiali di prima scelta, posati a regola d'arte secondo le indicazioni della direzione lavori e del committente.";
          const m = v.querySelector(".cp-v-mat"); if (m) m.value = "Materiali certificati, compresi sfridi e trasporti."; });
        document.querySelector('[data-action="cap-pdf"]').click();
      }, ID(402));
      await aspettaPdf(page, n4 + 1);
      const cp = await ultimoPdf(page);
      if (cp) {
        const sullUltima = cp.righe.filter(x => x.p === cp.pagine && !/^Pagina \d/.test(x.s) && x.s !== "Impresa di prova").map(x => x.s);
        prova(sullUltima.some(s => /^\d+\. /.test(s)), "Capitolato PDF: sull'ultima pagina, con le firme, c'è anche l'ultimo articolo", sullUltima.slice(0, 6));
        prova(sullUltima.some(s => /Il Committente/.test(s)), "Capitolato PDF: le firme ci sono");
      } else prova(false, "Capitolato PDF: il PDF esce");
    }
    await ctx.close();
  }

  /* ---------- Noleggio ---------- */
  console.log("\nNoleggio a 1440 px");
  {
    const { ctx, page } = await apri(1440, "noleggio");
    await page.evaluate(async (js) => { await new Promise(r => setTimeout(r, 300)); eval(js); }, TESTI_PDF);
    const n0 = await page.evaluate(() => window.__pdfFatti || 0);
    await page.evaluate(async (id) => { const d = await nolLeggi("cliente", id); await nolPdf("cliente", d); }, ID(101));
    await aspettaPdf(page, n0 + 1);
    const c = await ultimoPdf(page); const ct = c ? c.righe.map(x => x.s).join("\n") : "";
    prova(/Impresa di prova/.test(ct) && /P\.IVA 00000000009/.test(ct) && /02100 Rieti/.test(ct), "Noleggio, scheda cliente PDF: i dati dell'azienda in testa", ct.slice(0, 200));
    const n1 = await page.evaluate(() => window.__pdfFatti || 0);
    await page.evaluate(async (id) => { const d = await nolLeggi("noleggio", id); await nolPdf("noleggio", d); }, ID(852));
    await aspettaPdf(page, n1 + 1);
    const nn = await ultimoPdf(page); const nt = nn ? nn.righe.map(x => x.s).join("\n") : "";
    prova(/Impresa di prova/.test(nt) && /P\.IVA 00000000009/.test(nt), "Noleggio, scheda noleggio PDF: i dati dell'azienda in testa", nt.slice(0, 200));
    const n2 = await page.evaluate(() => window.__pdfFatti || 0);
    await page.evaluate(async (id) => { const n = await nolLeggi("noleggio", id); const d = await nolVerbaleDati(n, "rientro"); nolDocPdf(d); }, ID(852));
    await aspettaPdf(page, n2 + 1);
    const vb = await ultimoPdf(page);
    if (vb) {
      const ult = vb.righe.filter(x => x.p === vb.pagine).map(x => x.s);
      prova(ult.some(s => /DICHIARAZIONI|STATO DELL/.test(s)) || vb.pagine === 1, "Verbale di riconsegna PDF: sull'ultima pagina, con le firme, c'è anche un pezzo del verbale", ult.slice(0, 5));
      prova(ult.some(s => /Il Conduttore/.test(s)), "Verbale di riconsegna PDF: le firme ci sono");
    } else prova(false, "Verbale PDF: il PDF esce");
    const err = await page.evaluate(() => window.__bancoErr || []);
    prova(!err.length, "Noleggio: nessun errore JavaScript", err);
    await ctx.close();
  }

  await browser.close(); srv.close();
  console.log("\n" + (rossi ? "ROSSO: " + rossi + " prove non passano" : "VERDE") + " (" + verdi + " passano)");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
