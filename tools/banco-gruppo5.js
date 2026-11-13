/* 13 nov 2026 — IL BANCO DEL GRUPPO 5 (quarto giro, lista «MANCA»: lo studio tecnico)
     node tools/banco-gruppo5.js
   Apre l'App come STUDIO TECNICO (ruolo «professionista», dati finti) e prova:
   17. Dati azienda: «Albo o Ordine» e «Numero di iscrizione»; il Salva li scrive; la riga
       esce in parcella, lettera d'incarico, fattura e scheda pratica.
   18. Parcella: «Totale documento» prima della ritenuta (schermo, PDF parcella, lettera).
   19. Crediti formativi: «Cambia il traguardo» apre la finestra e il Salva scrive cfp_obiettivo.
   20. Scheda pratica PDF: tipo, stato, comune, protocollo, deposito, catasto.
   E come ARTIGIANO: niente albo e niente caselle nuove, anche se nel database ci sono.
   Serve jsPDF: cd /tmp/banco && npm i --no-save jspdf@2.5.1
   Sulla versione di PRIMA deve dare rosso. */
"use strict";
const fs = require("fs"), path = require("path");
const dfPath = require.resolve("./banco-dati-finti.js");
const df = require(dfPath);
require.cache[dfPath].exports = (u, r) => {
  const d = df(u, r);
  const p = d.gest_preventivi.find(x => x.numero === 2);
  Object.assign(p, { cassa_perc: 4, iva_perc: 22, ritenuta: true, ritenuta_perc: 20, spese_forfait: 16 });
  const l = d.gest_lavori.find(x => x.id === p.lavoro_id);
  Object.assign(l, { pratica_tipo: "CILA", pratica_stato: "depositata", pratica_comune: "Rieti", pratica_protocollo: "12345/2026", pratica_data_dep: "2026-11-03", catasto_foglio: "12", catasto_particella: "345", catasto_sub: "2" });
  const anno = new Date().getFullYear();
  d.gest_crediti = [{ id: "00000000-0000-4000-8000-000000000901", user_id: u, titolo: "Aggiornamento sicurezza", ente: "Ordine", data: anno + "-03-10", crediti: 12, tipo: "Sicurezza" }];
  return d;
};
const B = require("./banco-gestionale.js");
const JSPDF = "/tmp/banco/node_modules/jspdf/dist/jspdf.umd.min.js";
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
const UID = "00000000-0000-4000-8000-00000000b4c0";
const ALBO = "Ordine degli Ingegneri della Provincia di Rieti, n. A1234";
const imp = tipo => ({ id: 1, user_id: UID, email: "banco@trovaimpresa.test", nome_attivita: "Studio di prova", nome: "Mario Prova", mestiere: "Ingegnere", mestieri: ["Ingegnere"], telefono: "3331234567", descrizione: "Profilo di prova del banco: serve solo a far aprire il gestionale senza chiedere di completare il profilo. Non esiste davvero.", logo_url: "/img/trovaimpresa-logo.svg", email_confermata: true, premium_pagato: true, vetrina_attiva: true, tipo, ruolo: tipo, piano: "premium", premium_scadenza: "2099-12-31", chat_pro: true, chat_pro_scadenza: "2099-12-31", gest_prova_fine: "2099-12-31", gest_piano_scelto: "premium", citta: "Rieti", attivo: true, stato: "attivo" });
const AZ = { user_id: UID, nome: "Studio Tecnico Ing. Mario Prova", piva: "00000000009", cod_fiscale: "PRVMRA70A01H282X", indirizzo: "Via del Cantiere 10", cap: "02100", citta: "Rieti", prov: "RI", tel: "0746 123456", email: "studio@prova.test", giorni_pagamento: 30, regime_fiscale: "RF01", cfp_obiettivo: 30, pol_compagnia: "Compagnia di prova", pol_numero: "POL-0001", pol_massimale: 500000, pol_scadenza: "2099-12-31", albo_nome: "Ordine degli Ingegneri della Provincia di Rieti", albo_numero: "A1234" };
const TESTI_PDF = `(function(){ window.__pdf=[]; var O=(window.__jsO=window.__jsO||window.jspdf.jsPDF);
  var N=function(a){ var d=new O(a), t=d.text; var mio=[]; window.__pdf.push(mio);
    d.text=function(x){ [].concat(x).forEach(function(s){ mio.push(String(s)); }); return t.apply(d,arguments); };
    d.save=function(n){ mio.nome=n; mio.salvato=true; return d; }; return d; };
  N.API=O.API; window.jspdf={jsPDF:N}; })();`;
(async () => {
  if (!fs.existsSync(JSPDF)) { console.log("Manca jsPDF: cd /tmp/banco && npm i --no-save jspdf@2.5.1"); process.exit(2); }
  const srv = await B.servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  let rossi = 0, verdi = 0;
  const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto).slice(0, 300) : "")); } };
  const apri = async (W, tipo) => {
    const ctx = await browser.newContext(W < 800 ? { viewport: { width: W, height: 800 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    const errori = []; page.on("pageerror", e => errori.push(e.message));
    page.on("dialog", d => d.dismiss().catch(() => {}));
    await B.collega(page, { rete: true, scritture: [] });
    const scritte = [];
    const uno = (route, o) => { const one = /vnd\.pgrst\.object/.test(route.request().headers()["accept"] || ""); return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(one ? o : [o]) }); };
    await page.route("**/rest/v1/**", async (route) => {
      const r = route.request(), m = r.method(), tab = new URL(r.url()).pathname.replace("/rest/v1/", "");
      if (m === "GET" && tab === "imprese") return uno(route, imp(tipo));
      if (m === "GET" && tab === "gest_azienda") return uno(route, AZ);
      if (m === "GET" || m === "HEAD" || m === "OPTIONS" || /^rpc\//.test(tab)) return route.fallback();
      let corpo = null; try { corpo = JSON.parse(r.postData() || "null"); } catch (_) {}
      scritte.push({ m, tab, corpo });
      const riga = Object.assign({ id: "00000000-0000-4000-8000-000000000999", user_id: UID }, Array.isArray(corpo) ? corpo[0] : corpo);
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify([riga]) });
    });
    const lib = fs.readFileSync(JSPDF);
    await page.route("**/jspdf.umd.min.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: lib }));
    const P = B.PAGINE.app;
    await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
    await P.entra(page);
    await page.evaluate(async js => { await caricaJsPDF(); eval(js); }, TESTI_PDF);
    return { ctx, page, P, scritte, errori };
  };
  const ultimo = page => page.evaluate(() => { const s = (window.__pdf || []).filter(x => x.salvato); const u = s[s.length - 1]; return u ? u.slice() : []; });
  const ha = (righe, t) => righe.some(r => r.indexOf(t) >= 0);

  for (const W of [1440, 375]) {
    console.log("\nSTUDIO TECNICO a " + W + " px");
    const { ctx, page, P, scritte, errori } = await apri(W, "professionista");
    prova(await page.evaluate(() => ruoloUtente) === "professionista", "il banco gira come studio tecnico");
    /* 17 — Dati azienda */
    await page.evaluate(() => aziendaForm()); await B.aspetta(page, 1000);
    const caselle = await page.evaluate(() => ({ a: (document.getElementById("a-albo") || {}).value, n: (document.getElementById("a-albo-n") || {}).value }));
    prova(caselle.a === AZ.albo_nome && caselle.n === "A1234", "17 · Dati azienda: Albo o Ordine e Numero di iscrizione, già pieni", caselle);
    await page.fill("#a-albo", "Collegio dei Geometri di Rieti"); await page.fill("#a-albo-n", "999");
    await page.click('[data-action="save-azienda"]'); await B.aspetta(page, 1200);
    const sa = scritte.find(s => s.tab.startsWith("gest_azienda"));
    const c0 = sa && (Array.isArray(sa.corpo) ? sa.corpo[0] : sa.corpo);
    prova(c0 && c0.albo_nome === "Collegio dei Geometri di Rieti" && c0.albo_numero === "999", "17 · il Salva scrive albo_nome e albo_numero", c0);
    /* 18 — parcella a schermo */
    await P.apri(page, "preventivi"); await B.aspetta(page, 1200);
    const pid = await page.evaluate(() => { const p = prevCache.find(x => x.numero == 2); return p && p.id; });
    await page.evaluate(id => prevForm(prevCache.find(p => p.id === id)), pid); await B.aspetta(page, 1000);
    const rie = await page.evaluate(() => (document.getElementById("pv-riepilogo") || {}).innerText || "");
    prova(/Totale documento\s*1\.031,04/.test(rie) && rie.indexOf("Totale documento") < rie.indexOf("Ritenuta"), "18 · schermo: «Totale documento 1.031,04 €» prima della ritenuta", rie);
    prova(/871,04/.test(rie), "18 · schermo: da incassare resta 871,04 €", rie);
    await page.evaluate(() => closeSheet());
    /* 19 — crediti */
    await P.apri(page, "crediti"); await B.aspetta(page, 1200);
    const bt = await page.$('[data-action="cred-traguardo"]');
    prova(!!bt, "19 · «Cambia il traguardo» nella sezione Crediti formativi");
    if (bt) {
      const h = await bt.evaluate(e => e.getBoundingClientRect().height);
      if (W < 800) prova(h >= 43.5, "19 · sul telefono il pulsante è alto almeno 44 px", h);
      await bt.click(); await B.aspetta(page, 800);
      prova(await page.evaluate(() => !!document.querySelector(".sheet--grande #cr-trag")), "19 · si apre la finestra grande col traguardo");
      await page.fill("#cr-trag", "20"); await B.aspetta(page, 300);
      const conto = await page.evaluate(() => (document.getElementById("cr-trag-conto") || {}).innerText || "");
      prova(/Ti mancano\s*8 CFP/.test(conto), "19 · la finestra fa il conto mentre scrivi (12 fatti, traguardo 20 → mancano 8)", conto);
      const prima = scritte.length;
      await page.click('[data-action="save-cred-traguardo"]'); await B.aspetta(page, 1200);
      const sc = scritte.slice(prima).find(s => s.tab.startsWith("gest_azienda"));
      const c1 = sc && (Array.isArray(sc.corpo) ? sc.corpo[0] : sc.corpo);
      prova(c1 && +c1.cfp_obiettivo === 20, "19 · il Salva scrive cfp_obiettivo = 20", c1);
    }
    if (W === 1440) {
      /* PDF */
      await page.evaluate(id => prevPdf(id), pid); await B.aspetta(page, 1500);
      let t = await ultimo(page);
      prova(ha(t, "PARCELLA") && ha(t, ALBO), "17 · PDF parcella: albo e numero sotto il nome", t.slice(0, 8));
      const iD = t.indexOf("Totale documento"), iR = t.findIndex(x => x.indexOf("Ritenuta") === 0);
      prova(iD > 0 && iR > iD && t[iD + 1] === "1.031,04 EUR", "18 · PDF parcella: «Totale documento 1.031,04» prima della ritenuta", t.slice(iD - 2, iD + 4));
      prova(ha(t, "871,04 EUR"), "18 · PDF parcella: netto a pagare 871,04");
      await page.evaluate(id => incaricoForm(id), pid); await B.aspetta(page, 1000);
      prova(/Totale documento/.test(await page.evaluate(() => document.querySelector(".sheet--grande").innerText)), "18 · modulo della lettera d'incarico: «Totale documento»");
      await page.evaluate(id => incaricoPdf(id), pid); await B.aspetta(page, 1500);
      t = await ultimo(page);
      prova(t.filter(x => x.indexOf(ALBO) >= 0).length >= 2, "17 · lettera d'incarico: albo in testa e fra i dati del professionista", t.slice(0, 12));
      prova(ha(t, "Totale documento") && ha(t, "1.031,04 EUR"), "18 · lettera d'incarico: «Totale documento 1.031,04»");
      await page.evaluate(() => { try { closeSheet(); } catch (e) {} });
      const lid = await page.evaluate(id => prevCache.find(p => p.id === id).lavoro_id, pid);
      await page.evaluate(id => generaPdf(id), lid); await B.aspetta(page, 1500);
      t = await ultimo(page);
      prova(ha(t, ALBO), "17 · scheda pratica: albo sotto il nome");
      const dp = ["Dati della pratica", "CILA", "Depositata", "Rieti", "12345/2026", "03/11/2026", "Foglio 12  ·  Particella 345  ·  Sub 2"];
      prova(dp.every(x => ha(t, x)), "20 · scheda pratica: tipo, stato, comune, protocollo, deposito, catasto", dp.filter(x => !ha(t, x)));
      const fid = await page.evaluate(() => { try { return (fattCache || []).find(f => f.numero)?.id; } catch (e) { return null; } });
      if (fid) { await page.evaluate(id => fatturaPdf(id), fid); await B.aspetta(page, 1500); t = await ultimo(page); prova(ha(t, ALBO), "17 · fattura dello studio: albo sotto il nome"); }
      else console.log("  · fattura: nessuna fattura in memoria, saltata");
    }
    prova(!errori.length, "nessun errore nella pagina", errori);
    await ctx.close();
  }
  console.log("\nARTIGIANO a 1440 px (non deve cambiare niente)");
  {
    const { ctx, page, P, errori } = await apri(1440, "artigiano");
    await page.evaluate(() => aziendaForm()); await B.aspetta(page, 1000);
    prova(await page.evaluate(() => !document.getElementById("a-albo")), "artigiano: niente casella dell'albo");
    prova(await page.evaluate(() => azAlbo({ albo_nome: "X", albo_numero: "1" })) === "", "artigiano: azAlbo vuota anche con i dati nel database");
    await page.evaluate(() => closeSheet());
    await P.apri(page, "preventivi"); await B.aspetta(page, 1200);
    const pid = await page.evaluate(() => prevCache[0] && prevCache[0].id);
    await page.evaluate(id => prevPdf(id), pid); await B.aspetta(page, 1500);
    const t = await ultimo(page);
    prova(ha(t, "PREVENTIVO") && !ha(t, "Ordine degli") && !ha(t, "Totale documento"), "artigiano: PDF preventivo senza albo e senza «Totale documento»", t.slice(0, 8));
    prova(!errori.length, "nessun errore nella pagina", errori);
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log("\n" + (rossi ? "ROSSO: " + rossi + " su " + (rossi + verdi) : "VERDE: " + verdi + " prove"));
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
