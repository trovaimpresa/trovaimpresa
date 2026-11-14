/* 14 nov 2026 — IL BANCO DEL QUINTO GIRO (i 13 «NON FUNZIONA» del controllore)
     node tools/banco-quinto-giro.js
   Apre l'App col sito e il database finti del banco e rifà, cliccando, i
   difetti del capitolo «14 nov 2026 — quinto giro» di docs/COLLAUDO-SEMPLICITA.md.
   Fra parentesi il numero nella lista «1. NON FUNZIONA» del diario.
   Sulla versione di PRIMA deve dare rosso:
     BANCO_RADICE=/cartella/con/il/sito/di/prima node tools/banco-quinto-giro.js   */
"use strict";
const fs = require("fs"), path = require("path");
const B = require("./banco-gestionale.js");
const RADICE = process.env.BANCO_RADICE ? path.resolve(process.env.BANCO_RADICE) : path.resolve(__dirname, "..");
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
const D = B.DATI, UID = B.UID, REP = B.REPARTO;
const g = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const id = (n) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const base = (n, gg) => ({ id: id(n), user_id: UID, created_at: g(-(gg || 1)) + "T08:00:00+00:00", eliminato_il: null });
const anno = +g(0).slice(0, 4);
/* un giorno di QUESTO mese e di QUEST'anno (il primo del mese: mai nel futuro) */
const giornoMese = g(0).slice(0, 8) + "01";

/* ---------- i casi scomodi, aggiunti ai dati finti ---------- */
// n. 1 — App n. 1, 2, 4 · Noleggio n. 3
D.gest_fatture.push(Object.assign({}, D.gest_fatture[0], { id: id(504), numero: 4, stato: "emessa", data: g(-2) }));
D.gest_fatture_totali.push(Object.assign({}, D.gest_fatture_totali[0], { fattura_id: id(504) }));
const NOL3 = Object.assign({}, D.nol_fatture[0], { id: id(872), numero: "3", data: g(-1) });
D.nol_fatture.push(NOL3);
// n. 2 e n. 5 — Luca nasce da «＋ Un'altra persona…»: senza costo orario e senza invito
D.gest_operatori.push(Object.assign({}, D.gest_operatori[0], { id: id(202), nome: "Luca Senzacosto", costo_orario: null, telefono: "", mansione: "" }));
D.gest_membri = [{ operatore_id: id(201), impresa_id: UID, codice: "INVITO201", stato: "invitato", ruolo: "operaio", permessi: {} }];
D.gest_ore.push(Object.assign(base(352), { mestiere_id: REP, lavoro_id: id(302), operatore_id: id(202), data: giornoMese, ore: 7.5, nota: "", rapportino_id: null }));
// n. 8 — due spese sullo stesso lavoro: la più nuova deve stare in cima
D.gest_spese.push(Object.assign(base(362, 9), { lavoro_id: id(302), descrizione: "Spesa VECCHIA", importo: 10, data: g(-9), fornitore_id: null, inserito_da: "Capo", creato_da: UID }));
D.gest_spese.push(Object.assign(base(363, 1), { lavoro_id: id(302), descrizione: "Spesa NUOVA", importo: 20, data: g(-1), fornitore_id: null, inserito_da: "Capo", creato_da: UID }));
// n. 3 — il lavoro buttato ha anche una spesa e un rapportino ancora vivi
D.gest_spese.push(Object.assign(base(364, 2), { lavoro_id: id(304), descrizione: "Spesa del lavoro buttato", importo: 5, data: g(-2), fornitore_id: null, inserito_da: "Capo", creato_da: UID }));
D.gest_rapportini.push(Object.assign(base(382, 2), { mestiere_id: REP, lavoro_id: id(304), data: g(-2), note: "Rapportino del lavoro buttato", materiali: "", creato_da: id(201), firma_cliente: null }));
// n. 4 — un lavoro nel Cestino, con le ore di Giovanni di questo mese
D.gest_lavori.push(Object.assign({}, D.gest_lavori[1], { id: id(304), descrizione: "Lavoro BUTTATO", eliminato_il: g(0) + "T09:00:00+00:00" }));
D.gest_ore.push(Object.assign(base(353), { mestiere_id: REP, lavoro_id: id(304), operatore_id: id(201), data: giornoMese, ore: 8, nota: "", rapportino_id: null }));
// n. 11 — un lavoro FATTO e non ancora fatturato
D.gest_lavori.push(Object.assign({}, D.gest_lavori[1], { id: id(305), descrizione: "Lavoro FATTO da fatturare", stato: "fatto", data_fatto: g(-1), fatt_stato: "none" }));
// n. 12 — una fattura in bozza nel Cestino
D.gest_fatture.push(Object.assign({}, D.gest_fatture[2], { id: id(505), eliminato_il: g(0) + "T09:30:00+00:00" }));

let rossi = 0, verdi = 0;
const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto).slice(0, 300) : "")); } };
const clic = (page, azione, dati) => page.evaluate(([a, d]) => { const b = document.createElement("button"); b.dataset.action = a; Object.keys(d || {}).forEach(k => b.dataset[k] = d[k]); document.body.appendChild(b); b.click(); b.remove(); }, [azione, dati || {}]);
/* FOTO=/una/cartella → il banco lascia anche le foto dei punti che si vedono */
const FOTO = process.env.FOTO || "";
const foto = async (page, nome, sel) => { if (!FOTO) return; try { if (sel) { await page.evaluate(ss => { for (const s of ss) { const e = [...document.querySelectorAll(s)].pop(); if (e) { e.scrollIntoView({ block: "center" }); break; } } }, [].concat(sel)); await B.aspetta(page, 300); } await page.screenshot({ path: path.join(FOTO, nome + "-" + page.viewportSize().width + ".png") }); } catch (e) {} };
const testo = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : null; }, sel);

async function apriApp(browser, base0, W, stato) {
  const ctx = await browser.newContext(W < 800 ? { viewport: { width: W, height: 800 }, isMobile: true, hasTouch: true } : { viewport: { width: W, height: 900 } });
  const page = await ctx.newPage();
  page.on("dialog", d => d.dismiss().catch(() => {}));
  await B.collega(page, { rete: true, scritture: [] });
  /* le scritture: qui servono davvero (le ore aggiunte si devono rileggere) */
  await page.route("**/rest/v1/**", async (route) => {
    const r = route.request(), m = r.method(), u = new URL(r.url()), tab = u.pathname.replace("/rest/v1/", "");
    let corpo = null; try { corpo = JSON.parse(r.postData() || "null"); } catch (_) {}
    if (tab === "rpc/gest_cestino_elimina") {
      stato.rpc.push(corpo);
      /* il database: «dentro c'è ancora un rapportino vivo, con le sue ore» finché non li butti */
      const vivi = stato.buttati.has("gest_rapportini") ? [] : [{ tabella: "gest_rapportini", n: 1 }, { tabella: "gest_ore", n: 2 }];
      const risposta = vivi.length ? { ok: false, vivi: vivi } : (corpo && corpo.p_conferma ? { ok: true, file: [] } : { ok: true, anteprima: [{ tabella: "gest_rapportini", n: 1 }, { tabella: "gest_ore", n: 2 }], scollegate: [] });
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(risposta) });
    }
    if (m === "GET" || m === "HEAD" || m === "OPTIONS" || /^rpc\//.test(tab)) return route.fallback();
    stato.scritte.push({ m, tab, corpo, q: u.search });
    if (m === "POST" && tab === "gest_ore" && corpo) { const riga = Object.assign(base(900 + stato.scritte.length), Array.isArray(corpo) ? corpo[0] : corpo); D.gest_ore.push(riga); stato.aggiunte.push(riga); }
    if (m === "PATCH" || m === "DELETE") {
      stato.buttati.add(tab);
      /* buttare nel cestino (PATCH eliminato_il) lo fa davvero: così il Cestino, ridisegnandosi,
         cambia l'ordine dell'elenco come sul sito vero */
      const lid = (u.searchParams.get("lavoro_id") || "").replace(/^eq\./, "");
      if (m === "PATCH" && corpo && corpo.eliminato_il && lid && D[tab]) D[tab].forEach(r => { if (String(r.lavoro_id) === lid && !r.eliminato_il) r.eliminato_il = new Date(Date.now() + 60000).toISOString(); });
      /* …e l'elenco del Cestino CAMBIA sotto i piedi, come sul sito vero dove si ridisegna:
         in cima finisce un'altra cosa (un'esca). Chi al secondo giro va «per numero» elimina l'esca. */
      if (m === "PATCH" && lid && !stato.esca) { stato.esca = true; await page.evaluate(() => { try { cestCache.unshift({ tab: "gest_ore", id: "00000000-0000-4000-8000-00000000e5ca", nome: "ESCA", tipo: "Ore lavorate", ic: "", foglia: true }); } catch (e) {} }).catch(() => {}); }
    }
    const riga = Object.assign({ id: id(990) }, Array.isArray(corpo) ? corpo[0] : corpo);
    const uno = /vnd\.pgrst\.object/.test(r.headers()["accept"] || "");
    return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(uno ? riga : [riga]) });
  });
  const P = B.PAGINE.app;
  await page.goto(base0 + P.url, { waitUntil: "domcontentloaded" });
  await P.entra(page);
  return { ctx, page, P };
}

(async () => {
  const srv = await B.servi(), base0 = "http://127.0.0.1:" + srv.address().port;
  const browser = await B.chromium.launch();
  for (const W of [1440, 375]) {
    console.log("\nApp a " + W + " px");
    const stato = { rpc: [], scritte: [], aggiunte: [], buttati: new Set() };
    const { ctx, page, P } = await apriApp(browser, base0, W, stato);
    const ridisegna = async (t) => { await P.ridisegna(page, t); await B.aspetta(page, 1200); };

    /* ---------- n. 1 — FATTURE: l'allarme falso ---------- */
    await P.apri(page, "fatture"); await B.aspetta(page, 1800);
    let t = await testo(page, "#fatture") || "";
    await foto(page, "1-fatture", ["#fatture .fatt-avviso", "#fatture .fatt-tot"]);
    prova(!/manca(no)? l[ae] n\./.test(t), "(1) Fatture: App n. 1, 2, 4 e Noleggio n. 3 → nessun «manca la n. 3»", (t.match(/manca[^·]{0,120}/) || [""])[0]);
    NOL3.eliminato_il = g(0) + "T10:00:00+00:00"; await ridisegna("fatture");
    t = await testo(page, "#fatture") || "";
    prova(/manca la n\.3/.test(t) && /Cestino del Noleggio/.test(t), "(1) la n. 3 del Noleggio nel suo Cestino → «manca la n.3 — è nel Cestino del Noleggio»", (t.match(/manca[^·]{0,120}/) || [""])[0]);
    D.nol_fatture.splice(D.nol_fatture.indexOf(NOL3), 1); await ridisegna("fatture");
    t = await testo(page, "#fatture") || "";
    prova(/manca la n\.3/.test(t) && /eliminata per sempre/.test(t), "(1) un buco VERO si dice ancora: «manca la n.3 — è stata eliminata per sempre»", (t.match(/manca[^·]{0,120}/) || [""])[0]);
    NOL3.eliminato_il = null; D.nol_fatture.push(NOL3);

    /* ---------- n. 2, 8, 11 — dentro il LAVORO ---------- */
    await P.apri(page, "lavori"); await B.aspetta(page, 1200);
    await clic(page, "edit-job", { id: id(302) }); await B.aspetta(page, 2500);
    let m = await testo(page, "#margine-box") || "";
    await foto(page, "2-margine", "#margine-box");
    prova(!/senza il nome/.test(m), "(2) Lavoro: le ore di Luca (che il nome ce l'ha) non sono «senza il nome di chi le ha fatte»", m);
    prova(/7,5 ore di Luca Senzacosto/.test(m) && /non ha il costo orario/.test(m), "(2) la frase dice CHI è senza costo orario", m);
    const bt = await page.evaluate(() => { const b = document.querySelector('#margine-box [data-action="sq-edit"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { id: b.dataset.id, alto: Math.round(r.height), px: parseFloat(getComputedStyle(b).fontSize), fuori: r.right > innerWidth + 1, t: b.innerText }; });
    prova(!!bt && bt.id === id(202), "(2) c'è il pulsante che porta alla scheda di Luca", bt);
    if (bt) prova(bt.px >= 14 && !bt.fuori && (W > 800 || bt.alto >= 44), "(2) il pulsante si legge e si tocca (≥14 px, ≥44 sul telefono, dentro lo schermo)", bt);
    prova(/Manodopera/.test(m) && /168,75/.test(m), "(2) il conto NON è cambiato: 7,5 ore alla media di 22,50 € = 168,75 € di manodopera", m);
    /* aggiungo 2 ore di Luca: la riga deve dire 9,5 */
    const agg = await page.evaluate(async (luca) => { const q = s => document.querySelector(s); if (!q("#or-ore") || !q("#or-chi")) return "manca il modulo delle ore"; q("#or-chi").value = luca; q("#or-ore").value = "2"; await oreAdd(); await new Promise(r => setTimeout(r, 1500)); return "ok"; }, id(202));
    m = await testo(page, "#margine-box") || "";
    prova(agg === "ok" && stato.aggiunte.length === 1 && /9,5 ore di Luca/.test(m), "(2) aggiunte 2 ore: la riga si aggiorna da sola (9,5 ore)", { agg, m });
    await foto(page, "2-margine-dopo-2-ore", "#margine-box");
    await foto(page, "8-spese", "#spese-list");
    const sp = await page.evaluate(() => [...document.querySelectorAll("#spese-list .spesa-row > span")].map(e => e.firstChild ? e.firstChild.textContent.trim() : ""));
    prova(sp[0] === "Spesa NUOVA" && sp[1] === "Spesa VECCHIA", "(8) Lavoro: le spese nuove stanno in cima", sp);
    const fr = await page.evaluate(() => { const e = [...document.querySelectorAll("#sheet .campo-aiuto")].find(x => /Crea fattura/.test(x.textContent)); return e ? e.innerText.replace(/\s+/g, " ") : null; });
    await foto(page, "11-frase", "#sheet .campo-aiuto b");
    await page.evaluate(() => { const e = [...document.querySelectorAll("#sheet .campo-aiuto")].find(x => /Crea fattura/.test(x.textContent)); if (e) e.scrollIntoView({ block: "center" }); }); await foto(page, "11-frase");
    prova(!!fr && !/della riga/.test(fr) && /in alto/.test(fr), "(11) Lavoro: la frase su «Crea fattura» non parla più del menu della riga", fr);
    await clic(page, "edit-job", { id: id(305) }); await B.aspetta(page, 2000);
    const alto = await page.evaluate(() => { const h = document.querySelector("#sheet .sh-head"); return h ? h.innerText.replace(/\s+/g, " ") : ""; });
    prova(/Crea fattura/.test(alto), "(11) e «Crea fattura» sta davvero in alto nel lavoro fatto", alto);
    /* il pulsante di Luca apre la sua scheda */
    await clic(page, "edit-job", { id: id(302) }); await B.aspetta(page, 2200);
    await page.evaluate(() => { const b = document.querySelector('#margine-box [data-action="sq-edit"]'); if (b) b.click(); }); await B.aspetta(page, 1500);
    const scheda = await page.evaluate(() => { const s = document.querySelector("#sheet"); const c = document.querySelector("#d-costo"); return { t: s ? s.innerText.slice(0, 200).replace(/\s+/g, " ") : "", nome: (document.querySelector("#d-nome") || {}).value || "", costo: !!c }; });
    prova(/Luca Senzacosto/.test(scheda.nome + scheda.t), "(2) il pulsante apre la scheda di Luca", scheda);
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} }); await B.aspetta(page, 400);

    /* ---------- n. 4 e n. 5 — SQUADRA ---------- */
    await P.apri(page, "squadra"); await B.aspetta(page, 2000);
    const sq = await page.evaluate(() => [...document.querySelectorAll(".sqg-card")].map(c => ({ nome: (c.querySelector("h3") || {}).innerText, mese: (c.querySelector(".sqg-mese") || {}).innerText.replace(/\s+/g, " "), stato: (c.querySelector(".stato") || {}).innerText })));
    await foto(page, "4-5-squadra", page.viewportSize().width < 800 ? [".sqg-card .sqg-top"] : ["#squadra h2"]);
    const gio = sq.find(x => /Giovanni/.test(x.nome || "")) || {}, luca = sq.find(x => /Luca/.test(x.nome || "")) || {};
    prova(/^0 giorni/.test(gio.mese || "") && !/cantier/.test(gio.mese || ""), "(4) Squadra: le giornate di un lavoro nel Cestino non si contano (Giovanni: 0 giorni)", gio);
    prova(/^1 giorno/.test(luca.mese || ""), "(4) …e quelle di un lavoro vivo sì (Luca: 1 giorno)", luca);
    prova(luca.stato === "Senza invito", "(5) Squadra: chi non è mai stato invitato non è «Invitato»", luca);
    prova(gio.stato === "Invitato", "(5) …chi ha l'invito resta «Invitato»", gio);

    /* ---------- n. 9 — CLIENTE: il CAP ---------- */
    await P.apri(page, "clienti"); await B.aspetta(page, 1000);
    await clic(page, "new-cli"); await B.aspetta(page, 1200);
    const prima = stato.scritte.length;
    const cap = await page.evaluate(async () => { const q = s => document.querySelector(s); if (!q("#c-nome") || !q("#c-cap")) return { manca: true }; q("#c-nome").value = "PROVA CAP"; q("#c-cap").value = "0210"; await saveCli(null); await new Promise(r => setTimeout(r, 900)); const c = q("#c-cap"); const f = c && (c.closest(".field") || c.parentNode); return { aperta: !!c, dice: f ? f.innerText.replace(/\s+/g, " ") : "" }; });
    await foto(page, "9-cap", "#c-cap");
    const scritto = stato.scritte.slice(prima).filter(x => x.tab === "gest_clienti");
    prova(!cap.manca && scritto.length === 0, "(9) Cliente: un CAP di 4 cifre NON si salva", scritto.map(x => x.corpo && x.corpo.cap));
    prova(/5 cifre/.test(cap.dice || ""), "(9) …e lo dice sulla casella («Il CAP è di 5 cifre»)", cap.dice);
    const cap5 = await page.evaluate(async () => { document.querySelector("#c-cap").value = "02100"; await saveCli(null); await new Promise(r => setTimeout(r, 900)); return 1; });
    prova(stato.scritte.slice(prima).some(x => x.tab === "gest_clienti" && x.corpo && x.corpo.cap === "02100"), "(9) …con 5 cifre si salva", stato.scritte.slice(prima).map(x => x.tab));
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} }); await B.aspetta(page, 400);

    /* ---------- n. 3 e n. 12 — CESTINO ---------- */
    await P.apri(page, "cestino"); await B.aspetta(page, 2500);
    const ce = await page.evaluate(() => ({ riass: (document.querySelector("#cest-riass") || {}).innerText || "", lista: (document.querySelector("#cest-list") || {}).innerText || "", i: (typeof cestCache !== "undefined" ? cestCache : []).findIndex(x => x.tab === "gest_lavori" && /BUTTATO/.test(x.nome)) }));
    await foto(page, "12-cestino");
    if (W < 800) prova(/eliminata/.test(ce.lista) && !/in bozza[^\n]*\n[^\n]*eliminato /.test(ce.lista), "(12) Cestino: la fattura è «eliminata», non «eliminato»", (ce.lista.match(/Fattura[\s\S]{0,80}/) || [""])[0]);
    prova(ce.i >= 0, "il lavoro buttato è nel Cestino", ce.riass);
    if (ce.i >= 0) {
      await clic(page, "cest-definitivo", { id: String(ce.i) }); await B.aspetta(page, 1500);
      const dom = await page.evaluate(() => { const o = document.getElementById("tif-ov"); return o ? o.innerText.replace(/\s+/g, " ") : ""; });
      await foto(page, "3-cestino-rapportino");
      prova(/Eliminare «Lavoro BUTTATO» per sempre\?/.test(dom) && /1 rapportino di cantiere/.test(dom) && !/Non posso/.test(dom), "(3) Cestino: un lavoro con un rapportino CHIEDE (una domanda che dice cosa se ne va)", dom);
      await page.evaluate(() => { const o = document.getElementById("tif-ov"); const b = o && [...o.querySelectorAll("button")].find(x => /^S[ìi]/i.test(x.innerText.trim())); if (b) b.click(); }); await B.aspetta(page, 2500);
      const dom2 = await page.evaluate(() => { const o = document.getElementById("tif-ov"); return o && o.offsetParent !== null ? o.innerText.replace(/\s+/g, " ") : ""; });
      const conferme = stato.rpc.filter(x => x && x.p_conferma === true).length;
      const sbagliate = stato.rpc.filter(x => x && (x.p_tabella !== "gest_lavori" || x.p_id !== id(304)));
      prova(sbagliate.length === 0, "(3) …e per sempre se ne va IL LAVORO, non la cosa finita al suo posto nell'elenco", sbagliate);
      prova(stato.buttati.has("gest_rapportini") && conferme === 1 && !/per sempre\?/.test(dom2), "(3) …detto Sì se ne va tutto, senza una seconda domanda", { buttati: [...stato.buttati], conferme, dom2 });
    }
    /* le ore aggiunte in questo giro escono: il giro dopo riparte pulito */
    stato.aggiunte.forEach(r => { const i = D.gest_ore.indexOf(r); if (i >= 0) D.gest_ore.splice(i, 1); });
    await ctx.close();
  }

  /* ---------- n. 12 — il Cestino VUOTO in questo reparto, con 1 cosa in un altro ---------- */
  console.log("\nCestino: niente in questo reparto, 1 cosa in un altro");
  {
    ["gest_lavori", "gest_fatture", "gest_ore", "gest_spese", "gest_rapportini"].forEach(tb => D[tb].forEach(r => { r.eliminato_il = null; }));
    D.gest_clienti.push(Object.assign({}, D.gest_clienti[1], { id: id(103), nome: "Cliente di un altro reparto", mestiere_id: "altroreparto01", eliminato_il: g(0) + "T09:00:00+00:00" }));
    const stato = { rpc: [], scritte: [], aggiunte: [], buttati: new Set() };
    const { ctx, page, P } = await apriApp(browser, base0, 1440, stato);
    await P.apri(page, "cestino"); await B.aspetta(page, 2500);
    const tt = await page.evaluate(() => ((document.querySelector("#cest-riass") || {}).innerText || "") + " ¦ " + ((document.querySelector("#cest-list") || {}).innerText || ""));
    const t1 = tt.replace(/\s+/g, " ");
    await foto(page, "12-cestino-zero");
    prova(!/\b0 cose eliminate/.test(t1) && !/Si possono rimettere a posto/.test(t1), "(12) con zero non dice «0 cose eliminate… Si possono rimettere a posto»", t1.slice(0, 260));
    prova(!/Altre 1 stanno|1 cose/.test(t1) && /un altro reparto/.test(t1), "(12) «Altre 1 stanno in altri reparti» → al singolare", t1.slice(0, 260));
    await ctx.close();
  }

  /* ---------- n. 10 — L'APP DELL'OPERAIO, sul telefono ---------- */
  console.log("\nApp dell'operaio a 375 px");
  {
    D.gest_membri = [{ membro_id: UID, impresa_id: UID, operatore_id: id(201), ruolo: "operaio", stato: "attivo", permessi: { calendario: true, lavori: true, foto: true, note: true, clienti: true, fatture: false, pagamenti: true } }];
    D.gest_lavori.forEach(l => { l.operatore_id = id(201); });
    const ctx = await browser.newContext({ viewport: { width: 375, height: 700 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" });
    const page = await ctx.newPage(); await B.collega(page, { rete: true, scritture: [] });
    await page.goto(base0 + "/gestionale-operatore.html", { waitUntil: "domcontentloaded" }); await B.aspetta(page, 4000);
    await foto(page, "10-operaio-parla");
    const a = await page.evaluate(() => {
      const b = document.getElementById("gv-btn"), c = document.querySelector(".opi"); if (!b || !c) return { manca: !b ? "Parla" : "la scheda «Metti l'app sul telefono»" };
      const rb = b.getBoundingClientRect(), st = getComputedStyle(document.body, "::after");
      const striscia = st.position === "fixed" && st.content !== "none" ? innerHeight - parseFloat(st.height) : null;
      /* le scritte della scheda che finiscono sotto «Parla» e NON sotto la striscia */
      const coperte = [...c.querySelectorAll(".opi-t,.opi-s,.opi-btn,.opi-dopo,li")].filter(e => { const r = e.getBoundingClientRect(); const giu = striscia == null ? r.bottom : Math.min(r.bottom, striscia);   /* sotto la striscia non si vede */
        return giu > rb.top && r.top < rb.bottom && r.right > rb.left && r.left < rb.right; }).map(e => e.innerText.replace(/\s+/g, " ").slice(0, 40));
      return { coperte, striscia, parlaSu: Math.round(rb.top) };
    });
    prova(!a.manca, "c'è «Parla» e c'è «Metti l'app sul telefono»", a.manca);
    if (!a.manca) prova(a.striscia != null && a.striscia <= a.parlaSu && !a.coperte.length, "(10) «Parla» ha la sua striscia in fondo: non sta più sopra le scritte", a);
    const idl = await page.evaluate(() => { const l = (typeof LAVORI !== "undefined" ? LAVORI : []).find(x => x.dove); return l ? l.id : null; });
    if (idl) { await page.evaluate(i => openLavoro(i), idl); await B.aspetta(page, 2500); }
    const mp = await page.evaluate(() => { const e = document.querySelector(".mp-ap"); if (!e) return null; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { alto: Math.round(r.height), px: parseFloat(getComputedStyle(e).fontSize) }; });
    await B.aspetta(page, 300); await foto(page, "10-operaio-mappa");
    prova(!!mp && mp.alto >= 44 && mp.px >= 16, "(10) «Apri in Google Maps» è alto almeno 44 px", mp);
    await ctx.close();
  }

  /* ---------- le scritte: si leggono nei file ---------- */
  console.log("\nLe scritte");
  const leggi = f => fs.readFileSync(path.join(RADICE, f), "utf8");
  prova(!/tiChiedi\("Lo riprendi dal Cestino quando vuoi\."\,\{titolo:"Mettere nel cestino la bozza"/.test(leggi("js/gest-fatture.js")), "(12) «la bozza… Lo riprendi» → «La riprendi»");
  const np = leggi("js/noleggio-prezzo.js"), acc = (np.match(/[a-z]\\'(?=[ .:,])/g) || []).length;
  prova(acc === 0, "(6) Noleggio, il conto: nessun accento scritto con l'apostrofo negli avvisi", acc + " rimasti");
  const SCRITTE = [["js/gest-documenti-pdf.js", /attivita'|disponibilita'|difformita'/], ["js/gest-ricevute-pagamento.js", /attivita'/], ["js/gest-squadra.js", /non puo' essere|persona e' salvata/], ["js/gest-reparti.js", /non si e' potuto/], ["js/foto-upload.js", /piu' piccola/], ["js/gest-richieste-chat.js", /\["Citta'"/], ["js/gest-cestino.js", /r\["Tipo pratica"\]=l\.pratica_tipo\|\|""/]];
  SCRITTE.forEach(([f, re]) => { const v = leggi(f).match(re); prova(!v, "(7) " + f + ": accenti a posto", v && v[0]); });
  prova(/"Agibilita'"/.test(leggi("js/gest-scadenze-pratiche.js")), "(7) nel database «Agibilita'» resta com'è (PRATICA_TIPI non toccato)");

  await browser.close(); srv.close();
  console.log("\n" + verdi + " verdi, " + rossi + " rossi\n");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error("Il banco si è rotto:", e); process.exit(2); });
