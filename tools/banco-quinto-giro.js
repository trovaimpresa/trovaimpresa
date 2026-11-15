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

/* ---------- 15 nov 2026 — SESTO GIRO: i casi che il banco non vedeva ---------- */
// (S6 f, S6 6) Alessandro: nome oltre 16 lettere, senza costo orario, UNA sola ora su un lavoro suo
D.gest_operatori.push(Object.assign({}, D.gest_operatori[0], { id: id(203), nome: "Alessandro Mastrogiovanni", costo_orario: null, telefono: "", mansione: "" }));
D.gest_ore.push(Object.assign(base(354), { mestiere_id: REP, lavoro_id: id(305), operatore_id: id(203), data: "2025-01-10", ore: 1, nota: "", rapportino_id: null }));
// (S6 a) nel Cestino anche ore, una spesa, una foto e un documento (di un lavoro VIVO)
const NEL_CESTINO = g(0) + "T08:30:00+00:00";
D.gest_ore.push(Object.assign(base(355), { mestiere_id: REP, lavoro_id: id(302), operatore_id: id(201), data: "2025-01-11", ore: 3, nota: "ORE NEL CESTINO", rapportino_id: null, eliminato_il: NEL_CESTINO }));
D.gest_spese.push(Object.assign(base(365, 3), { lavoro_id: id(302), descrizione: "SPESA NEL CESTINO", importo: 7, data: g(-3), fornitore_id: null, inserito_da: "Capo", creato_da: UID, eliminato_il: NEL_CESTINO }));
D.gest_foto = (D.gest_foto || []).concat([
  Object.assign(base(371, 3), { mestiere_id: REP, lavoro_id: id(302), nome_file: "IMG_2041.jpg", tipo: "dopo", storage_path: UID + "/prova/IMG_2041.jpg", eliminato_il: NEL_CESTINO }),
  Object.assign(base(372, 3), { mestiere_id: REP, lavoro_id: id(302), nome_file: "Contratto firmato.pdf", tipo: "documento", storage_path: UID + "/prova/contratto.pdf", eliminato_il: NEL_CESTINO })
]);

let rossi = 0, verdi = 0;
const prova = (ok, cosa, visto) => { if (ok) { verdi++; console.log("  ✔ " + cosa); } else { rossi++; console.log("  ✘ " + cosa + (visto !== undefined ? " — visto: " + JSON.stringify(visto).slice(0, 300) : "")); } };
const clic = (page, azione, dati) => page.evaluate(([a, d]) => { const b = document.createElement("button"); b.dataset.action = a; Object.keys(d || {}).forEach(k => b.dataset[k] = d[k]); document.body.appendChild(b); b.click(); b.remove(); }, [azione, dati || {}]);
/* FOTO=/una/cartella → il banco lascia anche le foto dei punti che si vedono */
const FOTO = process.env.FOTO || "";
const foto = async (page, nome, sel) => { if (!FOTO) return; try { if (sel) { await page.evaluate(ss => { for (const s of ss) { const e = [...document.querySelectorAll(s)].pop(); if (e) { e.scrollIntoView({ block: "center" }); break; } } }, [].concat(sel)); await B.aspetta(page, 300); } await page.screenshot({ path: path.join(FOTO, nome + "-" + page.viewportSize().width + ".png") }); } catch (e) {} };
/* la finestra delle domande (js/ti-finestra.js): cosa dice, e premere Sì o No */
const domanda = (page) => page.evaluate(() => { const o = document.getElementById("tif-ov"); if (!o) return ""; const cs = getComputedStyle(o), r = o.getBoundingClientRect(); return (cs.display !== "none" && cs.visibility !== "hidden" && r.height > 0) ? o.innerText.replace(/\s+/g, " ") : ""; });
const rispondi = (page, si) => page.evaluate((si) => { const o = document.getElementById("tif-ov"); const b = o && [...o.querySelectorAll("button")].find(x => (si ? /^S[ìi]/i : /^No/i).test(x.innerText.trim())); if (b) b.click(); return !!b; }, si);
const testo = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : null; }, sel);

async function apriApp(browser, base0, W, stato, senzaIban) {
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
    /* (S6 b) il Noleggio non si legge: il database risponde «errore» */
    if (stato.nolRotto && m === "GET" && tab === "nol_fatture") return route.fulfill({ status: 500, headers: cors, contentType: "application/json", body: JSON.stringify({ message: "il banco ha rotto apposta la lettura di nol_fatture", code: "XX000" }) });
    /* un'impresa che NON ha scritto l'IBAN nei Dati azienda */
    if (senzaIban && m === "GET" && tab === "gest_azienda") { const az = { user_id: UID, ragione_sociale: "Impresa di prova", nome: "Impresa di prova", piva: "00000000009", indirizzo: "Via del Cantiere 10", cap: "02100", citta: "Rieti", prov: "RI", iban: null, giorni_pagamento: 30 }; const uno1 = /vnd\.pgrst\.object/.test(r.headers()["accept"] || ""); return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(uno1 ? az : [az]) }); }
    if (m === "GET" || m === "HEAD" || m === "OPTIONS" || /^rpc\//.test(tab)) return route.fallback();
    stato.scritte.push({ m, tab, corpo, q: u.search });
    if (m === "POST" && tab === "gest_ore" && corpo) { const riga = Object.assign(base(900 + stato.scritte.length), Array.isArray(corpo) ? corpo[0] : corpo); D.gest_ore.push(riga); stato.aggiunte.push(riga); }
    if (m === "POST" && tab === "gest_operatori" && corpo) { const riga = Object.assign(base(950 + stato.scritte.length), { telefono: "", mansione: "", costo_orario: null }, Array.isArray(corpo) ? corpo[0] : corpo); D.gest_operatori.push(riga); stato.persone.push(riga); const uno2 = /vnd\.pgrst\.object/.test(r.headers()["accept"] || ""); return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(uno2 ? riga : [riga]) }); }
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
    const stato = { rpc: [], scritte: [], aggiunte: [], persone: [], buttati: new Set() };
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
    /* (S6 D3) L'AVVISO MISTO: la n. 3 è nel Cestino del Noleggio E la n. 5 è sparita davvero (c'è la n. 6) */
    const F6 = Object.assign({}, D.gest_fatture[0], { id: id(506), numero: 6, stato: "emessa", data: g(-1) });
    const T6 = Object.assign({}, D.gest_fatture_totali[0], { fattura_id: id(506) });
    D.gest_fatture.push(F6); D.gest_fatture_totali.push(T6); await ridisegna("fatture");
    const mi = await page.evaluate(() => { const e = [...document.querySelectorAll("#fatture .fatt-avviso")].find(x => /manca/.test(x.innerText)); if (!e) return { manca: true }; e.scrollIntoView({ block: "center" }); const rr = [...e.querySelectorAll(".fatt-avviso-riga")]; return { t: e.innerText.replace(/\s+/g, " "), righe: rr.map(x => x.innerText.replace(/\s+/g, " ")), px: Math.min.apply(null, rr.map(x => parseFloat(getComputedStyle(x).fontSize)).concat([99])), fuori: e.getBoundingClientRect().right > innerWidth + 1 }; });
    await foto(page, "D3-avviso-misto", "#fatture .fatt-avviso-riga");
    prova(!mi.manca && /mancano le n\.3, n\.5/.test(mi.t || ""), "(S6 D3) avviso misto: dice quali mancano (n.3 e n.5)", mi);
    prova((mi.righe || []).some(x => /la n\.3 è nel Cestino del Noleggio/.test(x)), "(S6 D3) …una riga dice che la n.3 è nel Cestino del Noleggio", mi.righe);
    prova((mi.righe || []).some(x => /la n\.5 è stata eliminata per sempre/.test(x) && /dillo al commercialista/.test(x)), "(S6 D3) …e un'altra che la n.5 è eliminata per sempre: «dillo al commercialista» non sparisce più", mi.righe);
    if (!mi.manca) prova(mi.px >= 14 && !mi.fuori, "(S6 D3) le righe si leggono (≥14 px) e stanno nello schermo", mi);
    D.gest_fatture.splice(D.gest_fatture.indexOf(F6), 1); D.gest_fatture_totali.splice(D.gest_fatture_totali.indexOf(T6), 1);
    D.nol_fatture.splice(D.nol_fatture.indexOf(NOL3), 1); await ridisegna("fatture");
    t = await testo(page, "#fatture") || "";
    prova(/manca la n\.3/.test(t) && /eliminata per sempre/.test(t), "(1) un buco VERO si dice ancora: «manca la n.3 — è stata eliminata per sempre»", (t.match(/manca[^·]{0,120}/) || [""])[0]);
    prova(!(await page.evaluate(() => !!document.querySelector("#fatture .fatt-avviso-riga"))), "(S6 D3) con un buco solo la frase resta quella di prima, senza righe in più");
    NOL3.eliminato_il = null; D.nol_fatture.push(NOL3);
    /* (S6 b) la lettura del Noleggio CADE: la n. 3 è del Noleggio e l'App non lo può sapere.
       Non deve dire «eliminata per sempre: dillo al commercialista» (un allarme falso). */
    stato.nolRotto = true; await ridisegna("fatture");
    t = await testo(page, "#fatture") || "";
    prova(!/manca(no)? l[ae] n\./.test(t) && !/eliminat[ae] per sempre/.test(t), "(S6 b) Fatture: se il Noleggio non si legge, NON dice «manca la n. 3 — eliminata per sempre»", (t.match(/manca[^·]{0,140}/) || [""])[0]);
    prova(/Da incassare/.test(t) && /305,00/.test(t), "(S6 b) …e le fatture si vedono lo stesso (da incassare 305,00 €)", t.slice(0, 200));
    /* (S6 D2) …e NON sta zitto: dice che non riesce a controllare, col pulsante «Riprova» */
    const nr = await page.evaluate(() => { const e = document.querySelector("#fatture .fatt-avviso--riprova"), b = e && e.querySelector('[data-action="fatt-riprova"]'); if (!e || !b) return { manca: true }; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(), rb = b.getBoundingClientRect(); return { dice: e.innerText.replace(/\s+/g, " "), px: parseFloat(getComputedStyle(e).fontSize), pxB: parseFloat(getComputedStyle(b).fontSize), alto: Math.round(rb.height), fuori: r.right > innerWidth + 1 || rb.right > innerWidth + 1 }; });
    await foto(page, "D2-numeri-non-letti", "#fatture .fatt-avviso--riprova");
    prova(!nr.manca && /Non riesco a controllare i numeri delle fatture/.test(nr.dice || ""), "(S6 D2) Fatture: se il Noleggio non si legge lo DICE («Non riesco a controllare i numeri delle fatture») con «Riprova»", nr);
    if (!nr.manca) prova(nr.px >= 14 && nr.pxB >= 14 && !nr.fuori && (W > 800 || nr.alto >= 44), "(S6 D2) la riga e il pulsante si leggono e si toccano", nr);
    /* torna la lettura e premo «Riprova»: la riga se ne va, e non resta nessun «manca» */
    stato.nolRotto = false;
    await page.evaluate(() => { const b = document.querySelector('#fatture [data-action="fatt-riprova"]'); if (b) b.click(); }); await B.aspetta(page, 1800);
    t = await testo(page, "#fatture") || "";
    prova(!/Non riesco a controllare/.test(t) && !/manca(no)? l[ae] n\./.test(t), "(S6 D2) tornata la lettura, «Riprova» toglie la riga (e nessun «manca»)", (t.match(/(Non riesco|manca)[^·]{0,120}/) || [""])[0]);
    /* con tutto a posto la riga non c'è mai */
    await ridisegna("fatture");
    prova(!(await page.evaluate(() => !!document.querySelector("#fatture .fatt-avviso--riprova"))), "(S6 D2) quando le letture riescono la riga non esce");

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
    const ora = await testo(page, "#ora-box") || "";
    await foto(page, "D1-incassi-ora", "#ora-box");
    prova(/Incassi/.test(ora) && /per ogni ora/.test(ora) && !/Rende/.test(ora), "(DIFFICILE 1) Lavoro: non dice più «Rende … l'ora» ma «Incassi … per ogni ora»", ora);
    const sp = await page.evaluate(() => [...document.querySelectorAll("#spese-list .spesa-row > span")].map(e => e.firstChild ? e.firstChild.textContent.trim() : ""));
    prova(sp[0] === "Spesa NUOVA" && sp[1] === "Spesa VECCHIA", "(8) Lavoro: le spese nuove stanno in cima", sp);
    /* lista «MANCA» n. 3 — il costo orario chiesto subito a chi nasce da «＋ Un'altra persona…» */
    const co = await page.evaluate(async () => {
      const q = s => document.querySelector(s), W = ms => new Promise(r => setTimeout(r, ms)), sel = q("#or-chi"); if (!sel) return { manca: "il modulo delle ore" };
      const vede = e => !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0;
      const o = { primaNascosta: !vede(q("#or-chi-costo-box")) };
      sel.value = "__nuovo__"; sel.dispatchEvent(new Event("change", { bubbles: true })); await W(200);
      const c = q("#or-chi-costo"); o.siVede = vede(q("#or-chi-costo-box")) && vede(q("#or-chi-nuovo-box")); if (!c) return o;
      const r = c.getBoundingClientRect(); o.alto = Math.round(r.height); o.fuori = r.right > innerWidth + 1; o.px = parseFloat(getComputedStyle(q("#or-chi-costo-box span")).fontSize);
      q("#or-chi-nuovo").value = "Marta Nuova"; q("#or-ore").value = "2"; c.value = "abc"; await oreAdd(); await W(700);
      o.storto = (q("#or-chi-costo-box") || {}).innerText.replace(/\s+/g, " ");
      return o;
    });
    await foto(page, "M3-costo-orario", "#or-chi-costo");
    prova(!co.manca && co.primaNascosta && co.siVede, "(MANCA 3) con «＋ Un'altra persona…» esce anche «Quanto ti costa all'ora»", co);
    if (co.siVede) prova(co.px >= 14 && !co.fuori && (W > 800 || co.alto >= 44), "(MANCA 3) la casella si legge e si tocca", co);
    prova(stato.persone.length === 0 && /Non ho capito il costo orario/.test(co.storto || ""), "(MANCA 3) un costo scritto male («abc») ferma tutto e lo dice sulla casella", { persone: stato.persone.length, dice: co.storto });
    /* (S6 d) il costo orario NEGATIVO: si ferma come «abc», e lo dice sulla casella */
    const neg = await page.evaluate(async () => { const q = s => document.querySelector(s), W = ms => new Promise(r => setTimeout(r, ms)); const c = q("#or-chi-costo"); if (!c) return { manca: true }; q("#or-chi-nuovo").value = "Marta Nuova"; q("#or-ore").value = "2"; c.value = "-5"; await oreAdd(); await W(700); return { dice: (q("#or-chi-costo-box") || {}).innerText.replace(/\s+/g, " ") }; });
    prova(!neg.manca && stato.persone.length === 0 && stato.aggiunte.length === 1 && /non può essere negativo/.test(neg.dice || ""), "(S6 d) un costo orario negativo («-5») ferma tutto: niente persona, niente ore, e lo dice sulla casella", { persone: stato.persone.length, ore: stato.aggiunte.length, dice: neg.dice });
    /* S6 D7 (15 nov 2026) — costo orario troppo alto nelle ore: «1.000» prima CHIEDE; detto No non nasce nessuno */
    const nPd7 = stato.persone.length, nOd7 = stato.aggiunte.length;
    await page.evaluate(() => { const q = s => document.querySelector(s); q("#or-chi-nuovo").value = "Marta Nuova"; q("#or-ore").value = "2"; q("#or-chi-costo").value = "1.000"; window.__d7o = oreAdd(); }); await B.aspetta(page, 900);
    const d7o = await domanda(page);
    await foto(page, "D7-domanda-ore");
    await rispondi(page, false); await B.aspetta(page, 800);
    prova(/1\.000,00/.test(d7o) && /l'ora/.test(d7o) && /È giusto\?/.test(d7o), "(S6 D7) ore: un costo orario di «1.000» prima chiede («Hai scritto 1.000,00 € l'ora… È giusto?»)", d7o);
    prova(stato.persone.length === nPd7 && stato.aggiunte.length === nOd7, "(S6 D7) …detto No: niente persona e niente ore", { persone: stato.persone.length - nPd7, ore: stato.aggiunte.length - nOd7 });
    const co2 = await page.evaluate(async () => { const q = s => document.querySelector(s), W = ms => new Promise(r => setTimeout(r, ms)); const c = q("#or-chi-costo"); if (!c) return {}; c.value = "18,50"; c.dispatchEvent(new Event("input", { bubbles: true })); q("#or-ore").value = "2"; await oreAdd(); await W(1800); return { m: q("#margine-box").innerText.replace(/\s+/g, " "), vuota: q("#or-chi-costo") ? q("#or-chi-costo").value : null }; });
    const marta = stato.persone[0] || {};
    prova(stato.persone.length === 1 && marta.nome === "Marta Nuova" && marta.costo_orario === 18.5, "(MANCA 3) la persona nasce col suo costo orario (18,50)", marta);
    prova(!/Marta/.test(co2.m || "x Marta") && /Manodopera/.test(co2.m || ""), "(MANCA 3) …e le sue ore entrano nel margine senza avvisi", co2.m);
    /* (S6 g) una persona che C'È GIÀ con quel nome («luca senzacosto», costo 25): non nasce un doppione,
       la scheda di Luca non viene toccata, le ore vanno a lui */
    const nPers = stato.persone.length, nOre = stato.aggiunte.length, nScr = stato.scritte.length;
    const gia = await page.evaluate(async () => { const q = s => document.querySelector(s), W = ms => new Promise(r => setTimeout(r, ms)), sel = q("#or-chi"); if (!sel) return { manca: true }; sel.value = "__nuovo__"; sel.dispatchEvent(new Event("change", { bubbles: true })); await W(200); q("#or-chi-nuovo").value = "luca senzacosto"; q("#or-chi-costo").value = "25"; q("#or-ore").value = "1"; await oreAdd(); await W(1500);
      const a = q("#or-chi-gia"), vede = e => !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0;
      if (a) a.scrollIntoView({ block: "center" });
      const o = { dice: a ? a.innerText.replace(/\s+/g, " ") : "", siVede: vede(a), px: a ? parseFloat(getComputedStyle(a).fontSize) : 0, fuori: a ? a.getBoundingClientRect().right > innerWidth + 1 : false, nome: (q("#or-chi-nuovo") || {}).value, costo: (q("#or-chi-costo") || {}).value, nascoste: !vede(q("#or-chi-nuovo-box")) && !vede(q("#or-chi-costo-box")), scelto: (q("#or-chi") || {}).value };
      return o; });
    await foto(page, "D1-persona-che-ce-gia", "#or-chi-gia");
    const oraGia = stato.aggiunte[stato.aggiunte.length - 1] || {};
    const toccati = stato.scritte.slice(nScr).filter(x => x.tab === "gest_operatori");
    prova(!gia.manca && stato.persone.length === nPers && toccati.length === 0, "(S6 g) persona che c'è già («luca senzacosto»): non nasce un doppione e la sua scheda non si tocca", { nuove: stato.persone.length - nPers, toccati: toccati.map(x => x.m) });
    prova(stato.aggiunte.length === nOre + 1 && oraGia.operatore_id === id(202), "(S6 g) …e le ore vanno al Luca che c'è", oraGia);
    /* (DIFFICILE 1, sesto giro) lo dice, e le due caselle si svuotano */
    prova(gia.siVede && /Luca Senzacosto c'è già/.test(gia.dice || "") && /si scrive nella sua scheda/.test(gia.dice || ""), "(S6 D1) persona che c'è già con un costo scritto: lo dice («Luca … c'è già … il costo orario si scrive nella sua scheda»)", gia);
    prova(gia.px >= 14 && !gia.fuori, "(S6 D1) l'avviso si legge (≥14 px) e sta nello schermo", gia);
    prova(gia.nome === "" && gia.costo === "" && gia.nascoste && gia.scelto === id(202), "(S6 D1) nome e costo NON restano nelle caselle nascoste, e la tendina resta su Luca", gia);
    const gia2 = await page.evaluate(async () => { const q = s => document.querySelector(s), W = ms => new Promise(r => setTimeout(r, ms)), sel = q("#or-chi"); sel.value = "__nuovo__"; sel.dispatchEvent(new Event("change", { bubbles: true })); await W(200); const tolto = !q("#or-chi-gia"); q("#or-chi-nuovo").value = "LUCA SENZACOSTO"; q("#or-ore").value = "1"; await oreAdd(); await W(1500); return { tolto, dopo: !!q("#or-chi-gia"), nome: (q("#or-chi-nuovo") || {}).value }; });
    prova(gia2.tolto && !gia2.dopo && gia2.nome === "", "(S6 D1) cambiando persona l'avviso sparisce; senza costo scritto non esce (le ore vanno a Luca e basta)", gia2);
    const fr = await page.evaluate(() => { const e = [...document.querySelectorAll("#sheet .campo-aiuto")].find(x => /Crea fattura/.test(x.textContent)); return e ? e.innerText.replace(/\s+/g, " ") : null; });
    await foto(page, "11-frase", "#sheet .campo-aiuto b");
    await page.evaluate(() => { const e = [...document.querySelectorAll("#sheet .campo-aiuto")].find(x => /Crea fattura/.test(x.textContent)); if (e) e.scrollIntoView({ block: "center" }); }); await foto(page, "11-frase");
    prova(!!fr && !/della riga/.test(fr) && /in alto/.test(fr), "(11) Lavoro: la frase su «Crea fattura» non parla più del menu della riga", fr);
    await clic(page, "edit-job", { id: id(305) }); await B.aspetta(page, 2000);
    const alto = await page.evaluate(() => { const h = document.querySelector("#sheet .sh-head"); return h ? h.innerText.replace(/\s+/g, " ") : ""; });
    prova(/Crea fattura/.test(alto), "(11) e «Crea fattura» sta davvero in alto nel lavoro fatto", alto);
    /* (S6 f, S6 6) nel lavoro 305 c'è Alessandro Mastrogiovanni: nome lungo, UNA sola ora */
    const lungo = await page.evaluate(() => { const b = document.querySelector('#margine-box [data-action="sq-edit"]'); if (!b) return null; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(), c = b.closest(".marg-senza-costo").getBoundingClientRect(); return { t: b.innerText, alto: Math.round(r.height), scritta: b.scrollWidth, pulsante: b.clientWidth, sx: Math.round(r.left), dx: Math.round(r.right), contSx: Math.round(c.left), contDx: Math.round(c.right), schermo: innerWidth, px: parseFloat(getComputedStyle(b).fontSize), riga: b.closest(".marg-senza-costo").innerText.replace(/\s+/g, " ") }; });
    await foto(page, "S6-nome-lungo", '#margine-box [data-action="sq-edit"]');
    prova(!!lungo && /Alessandro Mastrogiovanni/.test(lungo.t), "(S6 f) c'è il pulsante «Scrivi il costo orario di Alessandro Mastrogiovanni»", lungo);
    /* S6 D6 (15 nov 2026) — persona aggiunta da un ALTRO telefono: in memoria non c'è (la tolgo da dipCache),
       nel database sì. Il margine deve rileggere la squadra e scrivere il suo nome, non «non è più in squadra». */
    const altroTel = await page.evaluate(async (lav) => { const W = ms => new Promise(r => setTimeout(r, ms)); const prima = dipCache.length; dipCache = dipCache.filter(d => !/Mastrogiovanni/.test(d.nome || "")); const tolta = dipCache.length === prima - 1; await renderSpeseBlock(lav, 0); await W(600); const m = document.querySelector("#margine-box"); const o = { tolta, dice: m ? m.innerText.replace(/\s+/g, " ") : "", pulsante: !!document.querySelector('#margine-box [data-action="sq-edit"]'), tornata: dipCache.some(d => /Mastrogiovanni/.test(d.nome || "")) }; try { await renderDip(); } catch (e) {} return o; }, id(305));
    prova(altroTel.tolta && /Alessandro Mastrogiovanni/.test(altroTel.dice) && !/non è più in squadra/.test(altroTel.dice), "(S6 D6) persona aggiunta da un altro telefono: il margine la chiama per nome, non «non è più in squadra»", altroTel.dice);
    prova(altroTel.pulsante && altroTel.tornata, "(S6 D6) …c'è il pulsante «Scrivi il costo orario di …» e la persona è tornata nella squadra in memoria", altroTel);
    const manodD6 = await page.evaluate(() => (document.querySelector("#margine-box").innerText.match(/Manodopera: [^M]*/) || [""])[0].replace(/\s+/g, " ").trim());
    prova(manodD6 === ((altroTel.dice.match(/Manodopera: [^M]*/) || [""])[0].replace(/\s+/g, " ").trim()), "(S6 D6) …e la manodopera è la stessa di prima (il conto non cambia)", manodD6);
    if (lungo) prova(lungo.scritta <= lungo.pulsante + 1 && lungo.sx >= lungo.contSx - 1 && lungo.dx <= lungo.contDx + 1 && lungo.dx <= lungo.schermo && lungo.px >= 14 && (W > 800 || lungo.alto >= 44), "(S6 f) nome lungo: la scritta sta DENTRO il pulsante (va a capo) e il pulsante dentro il riquadro", lungo);
    if (lungo) prova(/1 ora di Alessandro Mastrogiovanni/.test(lungo.riga) && /la conto al costo medio/.test(lungo.riga) && !/le conto/.test(lungo.riga), "(S6 6) con una sola ora dice «la conto», non «le conto»", lungo.riga);
    /* (S6 1) il pulsante di Luca: prima CHIEDE, poi apre la scheda, e chiusa la scheda si torna nel lavoro */
    await clic(page, "edit-job", { id: id(302) }); await B.aspetta(page, 2200);
    const scriviImporto = () => page.evaluate(() => { const c = document.querySelector("#j-imp"); if (!c) return null; c.value = "7777"; c.dispatchEvent(new Event("input", { bubbles: true })); return c.value; });
    const premi = () => page.evaluate(() => { const b = document.querySelector('#margine-box [data-action="sq-edit"]'); if (b) b.click(); return !!b; });
    const dove = () => page.evaluate(() => ({ aperta: document.querySelector("#overlay").classList.contains("open"), persona: (document.querySelector("#sheet #d-nome") || {}).value || "", lavoro: !!document.querySelector("#sheet #j-imp"), importo: (document.querySelector("#sheet #j-imp") || {}).value || "", margine: !!document.querySelector("#sheet #margine-box") }));
    await scriviImporto(); await premi(); await B.aspetta(page, 900);
    let dq = await domanda(page), qui = await dove();
    await foto(page, "S6-domanda");
    prova(/Luca Senzacosto/.test(dq) && /senza salvare, va perso/.test(dq) && /Continuare\?/.test(dq), "(S6 1) «Scrivi il costo orario di …» CHIEDE prima di chiudere il lavoro", dq);
    prova(qui.lavoro && !qui.persona, "(S6 1) …e finché non rispondi il lavoro resta aperto", qui);
    await rispondi(page, false); await B.aspetta(page, 700);
    qui = await dove();
    prova(qui.aperta && qui.lavoro && /7\.?777/.test(qui.importo) && !qui.persona, "(S6 1) detto No: resti nel lavoro e quello che avevi scritto (7.777) c'è ancora", qui);
    await premi(); await B.aspetta(page, 900); await rispondi(page, true); await B.aspetta(page, 1800);
    qui = await dove();
    await foto(page, "S6-scheda-persona");
    prova(/Luca Senzacosto/.test(qui.persona) && !qui.lavoro, "(S6 1) detto Sì: si apre la scheda di Luca", qui);
    await page.evaluate(() => { const b = document.querySelector('#sheet [data-action="close"]'); if (b) b.click(); }); await B.aspetta(page, 2800);
    qui = await dove();
    await foto(page, "S6-tornato-al-lavoro");
    prova(qui.aperta && qui.lavoro && qui.margine && !qui.persona, "(S6 1) chiusa la scheda (Annulla) torni NEL LAVORO, non all'elenco", qui);
    /* e dalla Squadra la scheda si apre senza domande e, chiusa, non riapre nessun lavoro */
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} }); await B.aspetta(page, 400);
    await clic(page, "sq-edit", { id: id(202) }); await B.aspetta(page, 1500);
    dq = await domanda(page); qui = await dove();
    prova(!dq && /Luca Senzacosto/.test(qui.persona), "(S6 1) fuori dal lavoro la scheda si apre subito, senza domanda", { dq, qui });
    /* S6 D7 — nella scheda della persona: «1.000» chiede; No = niente salvato; «18,555» si salva 18,56 senza domande */
    const nScrD7 = stato.scritte.length, opD7 = () => stato.scritte.slice(nScrD7).filter(x => x.tab === "gest_operatori");
    await page.evaluate((i) => { document.querySelector("#d-costo").value = "1.000"; window.__d7 = squadraSave(i); }, id(202)); await B.aspetta(page, 900);
    const d7q = await domanda(page);
    await foto(page, "D7-domanda-scheda");
    prova(/1\.000,00/.test(d7q) && /È giusto\?/.test(d7q), "(S6 D7) scheda: un costo orario di «1.000» prima chiede", d7q);
    await rispondi(page, false); await B.aspetta(page, 800);
    const d7no = await page.evaluate(() => ({ aperta: !!document.querySelector("#sheet #d-costo"), v: (document.querySelector("#d-costo") || {}).value }));
    prova(d7no.aperta && opD7().length === 0, "(S6 D7) …detto No: la scheda resta aperta e non si salva niente", { d7no, scritte: opD7().length });
    await page.evaluate((i) => { document.querySelector("#d-costo").value = "200"; window.__d7 = squadraSave(i); }, id(202)); await B.aspetta(page, 1500);
    const d7q200 = await domanda(page);
    prova(!d7q200 && opD7().length === 1 && opD7()[0].corpo.costo_orario === 200, "(S6 D7) 200 € l'ora giusti non fanno domande e si salvano", { d7q200, corpo: opD7()[0] && opD7()[0].corpo.costo_orario });
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} }); await B.aspetta(page, 400);
    await clic(page, "sq-edit", { id: id(202) }); await B.aspetta(page, 1500);
    await page.evaluate(async (i) => { document.querySelector("#d-costo").value = "18,555"; await squadraSave(i); }, id(202)); await B.aspetta(page, 1500);
    const d7t = opD7().pop() || {};
    prova(!(await domanda(page)) && d7t.corpo && d7t.corpo.costo_orario === 18.56, "(S6 D7) «18,555» si salva 18,56 (due decimali), senza domande", d7t.corpo && d7t.corpo.costo_orario);
    /* Luca torna senza costo: le prove dopo contano su questo */
    await page.evaluate(async (i) => { try { closeSheet(); } catch (e) {} await sb.from("gest_operatori").update({ costo_orario: null }).eq("id", i); try { await renderDip(); } catch (e) {} }, id(202)); await B.aspetta(page, 800);
    await clic(page, "sq-edit", { id: id(202) }); await B.aspetta(page, 1500);
    await page.evaluate(() => { const b = document.querySelector('#sheet [data-action="close"]'); if (b) b.click(); }); await B.aspetta(page, 1500);
    qui = await dove();
    prova(!qui.aperta, "(S6 1) …e chiusa lì non riapre nessun lavoro", qui);
    /* (S6 d) anche nella scheda della persona un costo negativo non si salva */
    await clic(page, "sq-edit", { id: id(202) }); await B.aspetta(page, 1500);
    const nScr2 = stato.scritte.length;
    const negS = await page.evaluate(async (i) => { const c = document.querySelector("#d-costo"); if (!c) return { manca: true }; c.value = "-5"; await squadraSave(i); await new Promise(r => setTimeout(r, 900)); return { aperta: !!document.querySelector("#sheet #d-nome") && document.querySelector("#overlay").classList.contains("open"), toast: (document.querySelector("#toast") || {}).innerText || "" }; }, id(202));
    prova(!negS.manca && stato.scritte.slice(nScr2).filter(x => x.tab === "gest_operatori").length === 0 && negS.aperta, "(S6 d) scheda della persona: un costo orario negativo non si salva", { negS, scritte: stato.scritte.slice(nScr2).map(x => x.m + " " + x.tab) });
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} }); await B.aspetta(page, 400);

    /* ---------- n. 4 e n. 5 — SQUADRA ---------- */
    await P.apri(page, "squadra"); await B.aspetta(page, 2000);
    const sq = await page.evaluate(() => [...document.querySelectorAll(".sqg-card")].map(c => ({ nome: (c.querySelector("h3") || {}).innerText, mese: (c.querySelector(".sqg-mese") || {}).innerText.replace(/\s+/g, " "), stato: (c.querySelector(".stato") || {}).innerText })));
    await foto(page, "4-5-squadra", page.viewportSize().width < 800 ? [".sqg-card .sqg-top"] : ["#squadra h2"]);
    const gio = sq.find(x => /Giovanni/.test(x.nome || "")) || {}, luca = sq.find(x => /Luca/.test(x.nome || "")) || {};
    prova(/^0 giorni/.test(gio.mese || "") && !/cantier/.test(gio.mese || ""), "(4) Squadra: le giornate di un lavoro nel Cestino non si contano (Giovanni: 0 giorni)", gio);
    /* 15 nov 2026 — era «1 giorno» fisso: passava solo perché la Squadra a schermo era VECCHIA (le ore date a Luca
       più su, oggi, non c'erano ancora). Da quando il margine rilegge la squadra (S6 D6) qui si vede il numero vero. */
    prova(/^[1-9]\d* giorn/.test(luca.mese || ""), "(4) …e quelle di un lavoro vivo sì (Luca: almeno 1 giorno)", luca);
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
    /* S6 D4 (15 nov 2026) — CAP di un cliente estero: la frase dice cosa fare, nell'App e nel Noleggio */
    prova(/Cliente estero\? Lascialo vuoto\./.test(cap.dice || ""), "(S6 D4) Cliente: la frase del CAP dice «Cliente estero? Lascialo vuoto.»", cap.dice);
    const capEst = await page.evaluate(async () => { const q = s => document.querySelector(s); q("#c-cap").value = "CH-6900"; await saveCli(null); await new Promise(r => setTimeout(r, 900)); const c = q("#c-cap"); const f = c && (c.closest(".field") || c.parentNode); return { dice: f ? f.innerText.replace(/\s+/g, " ") : "" }; });
    prova(stato.scritte.slice(prima).filter(x => x.tab === "gest_clienti").length === 0 && /Lascialo vuoto/.test(capEst.dice || ""), "(S6 D4) …un CAP estero («CH-6900») non si salva e la frase resta", capEst.dice);
    { const fsN = require("fs"), pN = require("path"); const radN = process.env.BANCO_RADICE || pN.join(__dirname, ".."); let nolS = ""; try { nolS = fsN.readFileSync(pN.join(radN, "js", "nol-schede.js"), "utf8"); } catch (e) {} const appS = fsN.readFileSync(pN.join(radN, "js", "gest-commercialista.js"), "utf8"); const FR = "Il CAP è di 5 cifre. Cliente estero? Lascialo vuoto.";
      prova(nolS.includes(FR) && appS.includes(FR), "(S6 D4) …la stessa frase, uguale, nell'App e nel Noleggio", [nolS.includes(FR), appS.includes(FR)]); }
    const cap5 = await page.evaluate(async () => { document.querySelector("#c-cap").value = "02100"; await saveCli(null); await new Promise(r => setTimeout(r, 900)); return 1; });
    prova(stato.scritte.slice(prima).some(x => x.tab === "gest_clienti" && x.corpo && x.corpo.cap === "02100"), "(9) …con 5 cifre si salva", stato.scritte.slice(prima).map(x => x.tab));
    await page.evaluate(() => { try { closeSheet(); } catch (e) {} }); await B.aspetta(page, 400);

    /* ---------- n. 3 e n. 12 — CESTINO ---------- */
    await P.apri(page, "cestino"); await B.aspetta(page, 2500);
    const ce = await page.evaluate(() => ({ riass: (document.querySelector("#cest-riass") || {}).innerText || "", lista: (document.querySelector("#cest-list") || {}).innerText || "", i: (typeof cestCache !== "undefined" ? cestCache : []).findIndex(x => x.tab === "gest_lavori" && /BUTTATO/.test(x.nome)) }));
    await foto(page, "12-cestino");
    /* (S6 a, S6 6) ogni cosa ha la SUA parola, sul computer e sul telefono */
    const parola = (nome) => { const mm = ce.lista.split(nome)[1] || ""; return (mm.match(/eliminat[oae]\b/) || [""])[0]; };
    [["Fattura in bozza", "eliminata", "(S6 a) Cestino: la fattura è «eliminata»"], ["Lavoro BUTTATO", "eliminato", "(S6 a) Cestino: il lavoro è «eliminato»"], ["SPESA NEL CESTINO", "eliminata", "(S6 a) Cestino: la spesa è «eliminata»"], ["ORE NEL CESTINO", "eliminate", "(S6 a) Cestino: le ore sono «eliminate»"], ["IMG_2041.jpg", "eliminata", "(S6 6) Cestino: una foto è «eliminata»"], ["Contratto firmato.pdf", "eliminato", "(S6 6) Cestino: un documento resta «eliminato»"]]
      .forEach(([nome, vuole, dice]) => prova(parola(nome) === vuole, dice, parola(nome) || "(non c'è nel Cestino)"));
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
    stato.persone.forEach(r => { const i = D.gest_operatori.indexOf(r); if (i >= 0) D.gest_operatori.splice(i, 1); });
    await ctx.close();
  }

  /* ---------- lista «DIFFICILE» n. 8 — fattura con Bonifico e senza IBAN ---------- */
  for (const W of [1440, 375]) {
    console.log("\nFattura senza IBAN a " + W + " px");
    const stato = { rpc: [], scritte: [], aggiunte: [], persone: [], buttati: new Set() };
    const { ctx, page, P } = await apriApp(browser, base0, W, stato, true);
    await P.apri(page, "fatture"); await B.aspetta(page, 1800);
    const r = await page.evaluate(async () => {
      const f = fattCache.find(x => x.stato === "bozza"); await fattForm(f); await new Promise(r => setTimeout(r, 700));
      const q = s => document.querySelector(s), a = q("#fa-iban-manca"), mo = q("#fa-modo"), ib = q("#fa-iban"); if (!mo || !ib) return { manca: "il riquadro Pagamento" };
      const vede = () => !!a && getComputedStyle(a).display !== "none" && a.getBoundingClientRect().height > 0;
      const o = { modo: mo.value, iban: ib.value };
      mo.value = "bonifico"; mo.dispatchEvent(new Event("change", { bubbles: true })); o.vuoto = vede(); o.dice = a ? a.innerText : ""; o.px = a ? parseFloat(getComputedStyle(a).fontSize) : 0; o.fuori = a ? a.getBoundingClientRect().right > innerWidth + 1 : false;
      return o;
    });
    await foto(page, "D8-iban", "#fa-iban-manca");
    prova(!r.manca && r.vuoto && /Manca l'IBAN/.test(r.dice || ""), "(DIFFICILE 8) Bonifico senza IBAN: sotto la casella c'è «Manca l'IBAN…»", r);
    if (!r.manca) prova(r.px >= 14 && !r.fuori, "(DIFFICILE 8) l'avviso si legge (≥14 px) e sta nello schermo", r);
    const r2 = await page.evaluate(async () => {
      const q = s => document.querySelector(s), a = q("#fa-iban-manca"), mo = q("#fa-modo"), ib = q("#fa-iban");
      const vede = () => !!a && getComputedStyle(a).display !== "none" && a.getBoundingClientRect().height > 0;
      const o = {};
      const b = document.querySelector('#sheet [data-action="ctr-guarda"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 900));
      o.controllo = /Manca l'IBAN: nel PDF/.test(document.querySelector("#sheet").innerText);
      ib.value = "IT60 X054 2811 1010 0000 0123 456"; ib.dispatchEvent(new Event("input", { bubbles: true })); o.conIban = vede();
      ib.value = ""; ib.dispatchEvent(new Event("input", { bubbles: true })); mo.value = "contanti"; mo.dispatchEvent(new Event("change", { bubbles: true })); o.contanti = vede();
      return o;
    });
    prova(r2.controllo, "(DIFFICILE 8) «Controlla che sia giusto» lo dice anche lui", r2);
    prova(r2.conIban === false && r2.contanti === false, "(DIFFICILE 8) scritto l'IBAN, o coi contanti, l'avviso sparisce", r2);
    /* (S6 e) coi contanti e senza IBAN anche «Controlla che sia giusto» NON deve parlare di IBAN */
    const r3 = await page.evaluate(async () => {
      const q = s => document.querySelector(s), mo = q("#fa-modo"), ib = q("#fa-iban"); if (!mo || !ib) return { manca: true };
      ib.value = ""; mo.value = "contanti"; mo.dispatchEvent(new Event("change", { bubbles: true }));
      const regole = (typeof ctrRegoleFattura === "function") ? ctrRegoleFattura().map(x => x.dice) : null;
      const b = document.querySelector('#sheet [data-action="ctr-guarda"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 900));
      const o = { modo: mo.value, regole, schermo: /Manca l'IBAN: nel PDF/.test(document.querySelector("#sheet").innerText) };
      mo.value = "bonifico"; mo.dispatchEvent(new Event("change", { bubbles: true }));
      o.bonifico = (typeof ctrRegoleFattura === "function") ? ctrRegoleFattura().some(x => /Manca l'IBAN/.test(x.dice)) : null;
      return o;
    });
    prova(!r3.manca && r3.modo === "contanti" && r3.schermo === false && !(r3.regole || []).some(x => /IBAN/.test(x)), "(S6 e) coi contanti «Controlla che sia giusto» NON dice «Manca l'IBAN»", r3);
    prova(r3.bonifico === true, "(S6 e) …e col bonifico torna a dirlo", r3);
    await ctx.close();
  }

  /* ---------- n. 12 — il Cestino VUOTO in questo reparto, con 1 cosa in un altro ---------- */
  console.log("\nCestino: niente in questo reparto, 1 cosa in un altro");
  {
    ["gest_lavori", "gest_fatture", "gest_ore", "gest_spese", "gest_rapportini", "gest_foto"].forEach(tb => D[tb].forEach(r => { r.eliminato_il = null; }));
    D.gest_clienti.push(Object.assign({}, D.gest_clienti[1], { id: id(103), nome: "Cliente di un altro reparto", mestiere_id: "altroreparto01", eliminato_il: g(0) + "T09:00:00+00:00" }));
    const stato = { rpc: [], scritte: [], aggiunte: [], persone: [], buttati: new Set() };
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
    /* (S6 c) un messaggio (toast) deve stare SOPRA la striscia di «Parla», non dietro */
    const ts = await page.evaluate(async () => {
      const e = document.getElementById("toast"), b = document.getElementById("gv-btn"); if (!e || !b || typeof toast !== "function") return { manca: true };
      toast("Messaggio di prova del banco"); await new Promise(r => setTimeout(r, 500));
      const r = e.getBoundingClientRect(), st = getComputedStyle(document.body, "::after"), cs = getComputedStyle(e);
      const striscia = st.position === "fixed" && st.content !== "none" ? innerHeight - parseFloat(st.height) : null;
      return { giu: Math.round(r.bottom), striscia, z: +cs.zIndex, zStriscia: +st.zIndex, parlaSu: Math.round(b.getBoundingClientRect().top), vede: +cs.opacity > 0.5, testo: e.innerText };
    });
    await foto(page, "S6-operaio-toast");
    prova(!ts.manca && ts.vede && ts.striscia != null && ts.giu <= ts.striscia && ts.giu <= ts.parlaSu && ts.z > ts.zStriscia, "(S6 c) app dell'operaio: il messaggio sta sopra la striscia di «Parla» (non dietro, non sotto)", ts);
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
  /* 15 nov 2026 — sesto giro, n. 5: gli accenti rimasti */
  [["js/chat-squadra.js", /messaggio e\\?' salvato/], ["js/op-chat.js", /non e\\?' disponibile/], ["js/gest-documenti-pdf.js", /NON e\\?' compreso|criticita\\?' riscontrate/]]
    .forEach(([f, re]) => { const v = leggi(f).match(re); prova(!v, "(S6 5) " + f + ": accenti a posto", v && v[0]); });
  const sp = leggi("js/gest-scadenze-pratiche.js");
  const tit = (sp.match(/const tipo=[^\n]*\n(?:[^\n]*\n){0,2}?[^\n]*const titolo=/g) || []);
  prova(tit.length === 2 && tit.every(x => /praticaTipoScritto\(/.test(x)), "(S6 5) i due titoli di scadenza (data prevista e integrazioni) passano da praticaTipoScritto", tit.length);
  const fn = sp.match(/function praticaTipoScritto\(t\)\{[\s\S]*?\n  \}/);
  const scritto = fn ? new Function("return (" + fn[0] + ")")() : () => "";
  prova(scritto("Agibilita'") === "Agibilità" && scritto("SCIA") === "SCIA" && scritto("") === "", "(S6 5) nel titolo «Agibilita'» si scrive «Agibilità» (il resto non cambia)", scritto("Agibilita'"));

  await browser.close(); srv.close();
  console.log("\n" + verdi + " verdi, " + rossi + " rossi\n");
  process.exit(rossi ? 1 : 0);
})().catch(e => { console.error("Il banco si è rotto:", e); process.exit(2); });
