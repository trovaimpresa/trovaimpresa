#!/usr/bin/env node
/* ======================================================================
   IL BANCO DEL GESTIONALE — 12 novembre 2026
   ======================================================================
   Nasce dal terzo giro del controllore. In una settimana tre giri a mano
   hanno trovato ogni volta difetti nuovi, e i piu' gravi erano sempre
   della stessa famiglia:
     · senza rete una sezione diceva «vuoto» o un numero andava a zero;
     · sul telefono qualcosa usciva dallo schermo o copriva «Salva»;
     · un campo che manca non diventava rosso;
     · una scritta sotto i 14 px.
   Questo banco rifa' QUEI controlli da solo, in un browser vero, senza
   toccare l'account di nessuno: il database e' finto (risponde vuoto,
   oppure non risponde affatto), l'utente e' finto.

   COME SI LANCIA
     node tools/banco-gestionale.js            tutto
     node tools/banco-gestionale.js app        solo gestionale-app
     node tools/banco-gestionale.js noleggio   solo gestionale-noleggio
   Esce con 0 se e' tutto a posto, con 1 se trova difetti (li elenca).

   COSA SERVE: i pacchetti «playwright» e «@supabase/supabase-js» (il
   banco li cerca anche in /tmp/banco e in /opt/npm-tools).

   ⚠️ COSA NON GUARDA (serve ancora l'occhio): i conti, le sezioni piene
   di dati veri (il database finto è VUOTO: un numero che va a zero senza
   rete, o una riga lunga che esce dallo schermo, qui non si vedono), le
   domande di «elimina», i PDF, la Chat con AI, «Parla», l'app dell'operaio.
   ====================================================================== */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");

function cerca(nome) {
  const dove = [process.cwd(), "/tmp/banco", "/opt/npm-tools"];
  for (const d of dove) { try { return require(require.resolve(nome, { paths: [d] })); } catch (e) {} }
  console.error("Manca il pacchetto «" + nome + "». Lancia: npm i --no-save " + nome); process.exit(2);
}
function cercaFile(rel) {
  for (const d of [process.cwd(), "/tmp/banco", "/opt/npm-tools"]) { const p = path.join(d, "node_modules", rel); if (fs.existsSync(p)) return p; }
  console.error("Manca il file " + rel + ". Lancia: npm i --no-save @supabase/supabase-js"); process.exit(2);
}
const { chromium } = cerca("playwright");
const SUPA_UMD = cercaFile("@supabase/supabase-js/dist/umd/supabase.js");
const RADICE = path.resolve(__dirname, "..");
const SUPA_HOST = "nacvrsgkyfavykxjxszu.supabase.co";
const UID = "00000000-0000-4000-8000-00000000b4c0";
const REPARTO = "idbanco0000001";

/* ---------- il sito, servito dalla cartella ---------- */
const TIPI = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2" };
function servi() {
  return new Promise(ok => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split("?")[0].split("#")[0]);
      if (p === "/") p = "/index.html";
      let f = path.join(RADICE, p);
      if (!f.startsWith(RADICE)) { r.writeHead(403); r.end(); return; }
      if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
      fs.readFile(f, (e, b) => {
        if (e) { r.writeHead(404); r.end("non c'e'"); return; }
        r.writeHead(200, { "content-type": TIPI[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" }); r.end(b);
      });
    }).listen(0, "127.0.0.1", () => ok(s));
  });
}

/* ---------- l'utente finto e il database finto ---------- */
function b64(o) { return Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_"); }
function sessioneFinta() {
  const ora = Math.floor(Date.now() / 1000), fine = ora + 86400 * 30;
  const utente = { id: UID, aud: "authenticated", role: "authenticated", email: "banco@trovaimpresa.test", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  const jwt = b64({ alg: "HS256", typ: "JWT" }) + "." + b64({ sub: UID, aud: "authenticated", role: "authenticated", email: utente.email, exp: fine, iat: ora }) + ".firma-finta";
  return { access_token: jwt, token_type: "bearer", expires_in: 86400 * 30, expires_at: fine, refresh_token: "finto", user: utente };
}
/* le poche righe che servono per ENTRARE: il profilo dell'impresa e un reparto */
function rigaFinta(tabella) {
  if (tabella === "imprese") return [{ id: 1, user_id: UID, email: "banco@trovaimpresa.test", nome_attivita: "Impresa di prova", nome: "Mario Prova", mestiere: "Muratore", mestieri: ["Muratore"], telefono: "3331234567", descrizione: "Impresa di prova del banco: serve solo a far aprire il gestionale senza chiedere di completare il profilo. Non esiste davvero.", logo_url: "/img/trovaimpresa-logo.svg", email_confermata: true, premium_pagato: true, vetrina_attiva: true, tipo: "artigiano", ruolo: "artigiano", piano: "premium", premium_scadenza: "2099-12-31", chat_pro: true, chat_pro_scadenza: "2099-12-31", gest_prova_fine: "2099-12-31", gest_piano_scelto: "premium", citta: "Rieti", attivo: true, stato: "attivo" }];
  if (tabella === "gest_mestieri") return [{ id: REPARTO, user_id: UID, nome: "reparto di prova", icona: "wrench", ordine: 1, created_at: "2026-01-01T00:00:00Z" }];
  if (tabella === "gest_azienda") return [{ user_id: UID, ragione_sociale: "Impresa di prova", giorni_pagamento: 30 }];
  return [];
}
async function collega(page, stato) {
  /* stato.rete === false  →  il database non risponde (come senza internet) */
  await page.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === "127.0.0.1") return route.continue();
    if (u.hostname === "cdn.jsdelivr.net" && /supabase-js/.test(u.pathname)) return route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(SUPA_UMD) });
    if (u.hostname === SUPA_HOST) {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "content-range" };
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      if (u.pathname.startsWith("/auth/v1/")) {
        if (/\/user$/.test(u.pathname)) return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(sessioneFinta().user) });
        return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(sessioneFinta()) });
      }
      if (u.pathname.startsWith("/rest/v1/")) {
        if (!stato.rete) return route.abort("internetdisconnected");
        const m = route.request().method();
        if (m !== "GET" && m !== "HEAD") { stato.scritture.push(m + " " + u.pathname); }
        const tab = u.pathname.replace("/rest/v1/", "").replace(/^rpc\//, "rpc:");
        const righe = m === "GET" ? rigaFinta(tab) : [];
        const uno = /vnd\.pgrst\.object/.test(route.request().headers()["accept"] || "");
        if (tab.startsWith("rpc:")) return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: "null" });
        if (uno) return righe.length ? route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(righe[0]) })
          : route.fulfill({ status: 406, headers: cors, contentType: "application/json", body: JSON.stringify({ code: "PGRST116", message: "0 rows", details: "The result contains 0 rows" }) });
        return route.fulfill({ status: 200, headers: Object.assign({ "content-range": righe.length ? "0-" + (righe.length - 1) + "/" + righe.length : "*/0" }, cors), contentType: "application/json", body: JSON.stringify(righe) });
      }
      if (!stato.rete) return route.abort("internetdisconnected");
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: "[]" });
    }
    /* tutto il resto di fuori (caratteri, mappe, pubblicita', funzioni): non serve al banco */
    if (/\.css(\?|$)/.test(u.pathname)) return route.fulfill({ contentType: "text/css", body: "" });
    if (/\.js(\?|$)/.test(u.pathname)) return route.fulfill({ contentType: "text/javascript", body: "" });
    return route.abort();
  });
  await page.addInitScript((s) => {
    try {
      localStorage.setItem("sb-nacvrsgkyfavykxjxszu-auth-token", JSON.stringify(s));
      localStorage.setItem("ti_tutorial_visto", "1");
    } catch (e) {}
    window.__bancoErr = [];
    window.addEventListener("error", e => window.__bancoErr.push("JS: " + e.message));
    window.addEventListener("unhandledrejection", e => window.__bancoErr.push("PROMESSA: " + ((e.reason && e.reason.message) || e.reason)));
  }, sessioneFinta());
}

/* ---------- le misure, dentro la pagina ---------- */
function misura() {
  const W = innerWidth, telefono = W < 800, o = { piccole: [], fuori: [], basse: [], scorre: document.documentElement.scrollWidth - W };
  const vede = e => { if (!e.offsetParent && getComputedStyle(e).position !== "fixed") return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(e); return s.visibility !== "hidden" && s.opacity !== "0"; };
  const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const visti = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const t = n.nodeValue.trim(); if (!t) continue; const p = n.parentElement; if (!p || !vede(p)) continue;
    if (p.closest(".leaflet-container,script,style,option,#ti-riapri,#ti-barra-fondatore")) continue;
    const px = parseFloat(getComputedStyle(p).fontSize) * zoom;
    if (px < 13.95) { const k = px.toFixed(1) + " px «" + t.slice(0, 40) + "»"; if (!visti.has(k)) { visti.add(k); o.piccole.push(k); } }
  }
  document.querySelectorAll("body *").forEach(e => {
    if (!vede(e) || e.closest(".leaflet-container,#ti-riapri")) return; const r = e.getBoundingClientRect();
    if (r.right > W + 2 && r.left < W && r.width < W * 1.5 && o.fuori.length < 8) {
      let a = e.parentElement, dentro = false; while (a && a !== document.body) { const s = getComputedStyle(a); if (/(auto|scroll)/.test(s.overflowX) && a.scrollWidth > a.clientWidth && a.clientWidth < W - 4) { dentro = true; break; } a = a.parentElement; }
      if (!dentro) o.fuori.push((e.className || e.tagName).toString().slice(0, 30) + " arriva a " + Math.round(r.right) + " «" + (e.innerText || "").trim().slice(0, 25).replace(/\n/g, " ") + "»");
    }
    if (telefono && e.matches("button,select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]),a[href],[role=button]") && r.height < 43.5) {
      /* un'area da toccare allargata con ::after (la «i» di aiuto) vale */
      const dopo = getComputedStyle(e, "::after"); if (parseFloat(dopo.height) >= 43.5 && dopo.content !== "none") return;
      const k = (e.className || e.tagName).toString().slice(0, 25) + " alto " + Math.round(r.height) + " «" + (e.innerText || e.value || e.placeholder || e.getAttribute("aria-label") || "").trim().slice(0, 22).replace(/\n/g, " ") + "»";
      if (!visti.has(k) && o.basse.length < 12) { visti.add(k); o.basse.push(k); }
    }
  });
  return o;
}

/* ---------- il giro ---------- */
const difetti = [], fatto = [];
function segna(dove, cosa) { difetti.push(dove + " — " + cosa); }
const aspetta = (page, ms) => page.waitForTimeout(ms);
const VIETATE = /TypeError|Failed to fetch|esegui .{0,40}sql|SQL Editor|undefined|NaN\b|\[object /;
const VUOTO = /Il cestino è vuoto|Ancora nessun|Non hai ancora|Nessun[oa]? (lavoro|prevent|client|mezz|prodott|fornitor|moviment|promemoria|noleggi|fattur|scadenz|richiest|giornat|foto|document|corso|person)|Niente di urgente|Tutto sotto controllo|Niente in programma|€ 0\b/i;

const PAGINE = {
  app: {
    url: "/gestionale-app.html",
    entra: async (page) => { await page.waitForSelector('[data-action="enter"]', { timeout: 20000 }); await page.click('[data-action="enter"]'); await page.waitForSelector("section.active", { timeout: 15000 }); await aspetta(page, 1500); },
    sezioni: (page) => page.evaluate(() => Object.keys(RENDER_TAB).filter(t => { const b = document.querySelector('nav.tabs button[data-tab="' + t + '"]'); return b && getComputedStyle(b).display !== "none"; })),
    apri: (page, t) => page.evaluate(t => { const b = document.querySelector('nav.tabs button[data-tab="' + t + '"]'); if (b) b.click(); }, t),
    ridisegna: (page, t) => page.evaluate(t => { try { Promise.resolve(RENDER_TAB[t]()).catch(() => {}); } catch (e) {} }, t),
    nuovi: [["lavori", "Nuovo lavoro|Crea il primo lavoro"], ["preventivi", "Nuovo preventivo|primo preventivo"], ["clienti", "Nuovo cliente|Aggiungi il primo cliente"], ["scadenzario", "Nuova scadenza|prima scadenza"], ["mezzi", "Nuovo mezzo|Aggiungi il primo mezzo"], ["fornitori", "Nuovo fornitore|Aggiungi il primo fornitore"], ["carte", "Nuova carta|Aggiungi la prima carta"], ["squadra", "Nuova persona|Aggiungi la prima persona"]]
  },
  noleggio: {
    url: "/gestionale-noleggio.html",
    entra: async (page) => { await page.waitForFunction(() => typeof loadMezzi === "function" && typeof sbUid !== "undefined" && !!sbUid, null, { timeout: 20000 }); await aspetta(page, 2000); },
    sezioni: async () => ["riepilogo", "clienti-nol", "mezzi", "noleggi", "fatture", "calendario", "prodotti", "magazzino", "fornitori", "movimenti", "promemoria", "cauzioni", "rendimento", "documenti", "media", "cestino", "richieste", "assistenza"],
    apri: (page, t) => page.evaluate(t => { const b = document.querySelector('button[data-tab="' + t + '"]'); if (b) b.click(); }, t),
    ridisegna: (page, t) => page.evaluate(t => {
      const F = { riepilogo: "renderRiepilogoNegozio", "clienti-nol": "loadClientiNol", mezzi: "loadMezzi", noleggi: "loadNoleggi", fatture: "loadFattureNol", calendario: "renderCal", prodotti: "loadProdotti", magazzino: "loadMagazzino", fornitori: "loadFornitori", movimenti: "loadMovimenti", promemoria: "renderPromemoria", cauzioni: "loadCauzioni", rendimento: "loadRendimento", documenti: "loadDocumenti", media: "loadMedia", cestino: "renderCestinoNol" };
      const f = F[t] && window[F[t]]; if (f) { try { Promise.resolve(f()).catch(() => {}); } catch (e) {} } else { const b = document.querySelector('button[data-tab="' + t + '"]'); if (b) b.click(); }
    }, t),
    nuovi: [["mezzi", "Nuovo mezzo"], ["clienti-nol", "Nuovo cliente"], ["noleggi", "Nuovo noleggio"], ["fatture", "Nuova fattura"], ["prodotti", "Nuovo prodotto"], ["fornitori", "Nuovo fornitore"], ["movimenti", "Nuovo movimento"], ["promemoria", "Nuovo promemoria"]]
  }
};

async function giro(browser, base, nome, larghezza) {
  const P = PAGINE[nome], telefono = larghezza < 800, chi = nome + " a " + larghezza + " px";
  const ctx = await browser.newContext(telefono ? { viewport: { width: larghezza, height: 800 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" } : { viewport: { width: larghezza, height: 900 } });
  const page = await ctx.newPage(), stato = { rete: true, scritture: [] };
  page.on("dialog", d => d.dismiss().catch(() => {}));
  await collega(page, stato);
  await page.goto(base + P.url, { waitUntil: "domcontentloaded" });
  try { await P.entra(page); } catch (e) { segna(chi, "NON SI ENTRA nel gestionale col database finto (" + String(e.message).split("\n")[0] + ")"); await ctx.close(); return; }
  const sezioni = await P.sezioni(page);

  /* 1 — ogni sezione, a database vuoto: misure */
  for (const t of sezioni) {
    await P.apri(page, t); await aspetta(page, 900);
    const m = await page.evaluate(misura);
    const txt = await page.evaluate(() => { const s = document.querySelector("section.active"); return s ? s.innerText : ""; });
    if (m.piccole.length) segna(chi + " · " + t, "scritte sotto i 14 px: " + m.piccole.slice(0, 4).join("; "));
    if (telefono && (m.scorre > 2 || m.fuori.length)) segna(chi + " · " + t, "esce dallo schermo" + (m.scorre > 2 ? " (di " + m.scorre + " px)" : "") + (m.fuori.length ? ": " + m.fuori.slice(0, 3).join("; ") : ""));
    if (telefono && m.basse.length) segna(chi + " · " + t, "da toccare sotto i 44 px: " + m.basse.slice(0, 4).join("; "));
    const v = txt.match(VIETATE); if (v) segna(chi + " · " + t, "parola tecnica a schermo: «" + v[0] + "»");
  }
  fatto.push(chi + ": " + sezioni.length + " sezioni misurate");

  /* 2 — le finestre «nuovo»: Salva si tocca, niente fuori schermo, campo che manca rosso */
  let finestre = 0;
  for (const [t, re] of P.nuovi) {
    if (!sezioni.includes(t)) continue;
    await page.evaluate(() => { const c = document.querySelector("#sheet [data-action=close]"); if (c && c.offsetParent) c.click(); }); await aspetta(page, 500);
    await P.apri(page, t); await aspetta(page, 800);
    const aperta = await page.evaluate(re => { const b = [...document.querySelectorAll("section.active button")].find(x => x.offsetParent && new RegExp(re).test(x.innerText)); if (!b) return false; b.click(); return true; }, re);
    if (!aperta) { segna(chi + " · " + t, "non trovo il pulsante «" + re.split("|")[0] + "»"); continue; }
    await aspetta(page, 1500);
    const f = await page.evaluate(() => {
      const sh = document.getElementById("sheet"); if (!sh || !sh.offsetParent) return { niente: true };
      const corpo = sh.querySelector(".sh-body") || sh; corpo.scrollTop = 99999; if (sh.parentElement) sh.parentElement.scrollTop = 99999;
      const sv = [...sh.querySelectorAll("button")].filter(x => x.offsetParent && /^(Salva|Crea|Aggiungi)/.test(x.innerText.trim())).pop(); if (!sv) return { senzaSalva: true };
      const r = sv.getBoundingClientRect(), su = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { coperto: !(su && (su === sv || sv.contains(su))) ? ((su && (su.innerText || su.className || su.tagName).toString().trim().slice(0, 25)) || "fuori dallo schermo") : "", largo: corpo.scrollWidth - corpo.clientWidth, testo: sv.innerText.trim() };
    });
    if (f.niente) { segna(chi + " · " + t, "la finestra «nuovo» non si apre"); continue; }
    finestre++;
    if (f.senzaSalva) { segna(chi + " · " + t, "nella finestra non trovo «Salva»"); continue; }
    if (f.coperto) segna(chi + " · " + t, "«" + f.testo + "» non si può toccare: sopra c'è «" + f.coperto + "»");
    if (telefono && f.largo > 2) segna(chi + " · " + t, "la finestra scorre di lato (" + f.largo + " px)");
    const m = await page.evaluate(misura);
    if (m.piccole.length) segna(chi + " · finestra " + t, "scritte sotto i 14 px: " + m.piccole.slice(0, 3).join("; "));
    /* campo che manca: si preme Salva a modulo vuoto */
    const prima = stato.scritture.length;
    await page.evaluate(() => { const sh = document.getElementById("sheet"); const sv = [...sh.querySelectorAll("button")].filter(x => x.offsetParent && /^(Salva|Crea|Aggiungi)/.test(x.innerText.trim())).pop(); if (sv) sv.click(); }); await aspetta(page, 1200);
    const rosso = await page.evaluate(() => { const sh = document.getElementById("sheet"); if (!sh || !sh.offsetParent) return "chiusa"; return [...sh.querySelectorAll("input,select,textarea")].some(e => { if (!e.offsetParent) return false; const c = (getComputedStyle(e).borderTopColor.match(/\d+/g) || []).map(Number); return c[0] > 170 && c[1] < 90 && c[2] < 90; }) ? "si" : "no"; });
    if (rosso === "no" && stato.scritture.length === prima) segna(chi + " · " + t, "a modulo vuoto nessuna casella diventa rossa");
    if (rosso === "chiusa" || stato.scritture.length > prima) segna(chi + " · " + t, "a modulo vuoto ha salvato lo stesso");
  }
  await page.evaluate(() => { const c = document.querySelector("#sheet [data-action=close]"); if (c && c.offsetParent) c.click(); }); await aspetta(page, 500);
  fatto.push(chi + ": " + finestre + " finestre «nuovo» provate");

  /* 3 — senza rete (solo una volta per pagina, sul computer): riquadro rosso, mai «vuoto» */
  if (!telefono) {
    stato.rete = false;
    for (const t of sezioni) { await P.apri(page, t); await aspetta(page, 150); await P.ridisegna(page, t); }
    await aspetta(page, 30000);   /* il gestionale riprova da solo 7 secondi a domanda */
    for (const t of sezioni) {
      const r = await page.evaluate(t => { const s = document.getElementById(t); if (!s) return null; return { rosso: !!s.querySelector(".rie-errore"), riprova: /Riprova/.test(s.textContent), txt: s.textContent.replace(/\s+/g, " ") }; }, t);
      if (!r) continue;
      if (!r.rosso) segna(chi + " · " + t + " senza rete", "manca il riquadro rosso «Non riesco a leggere»");
      else if (!r.riprova) segna(chi + " · " + t + " senza rete", "nel riquadro rosso manca «Riprova»");
      const v = r.txt.match(VIETATE); if (v) segna(chi + " · " + t + " senza rete", "parola tecnica: «" + v[0] + "»");
      /* «vuoto» si accusa solo se il riquadro rosso NON c'è: col database finto le sezioni
         erano già vuote prima di staccare la rete, e la frase di prima può restare sotto il riquadro */
      const z = !r.rosso && r.txt.match(VUOTO); if (z) segna(chi + " · " + t + " senza rete", "dice «" + z[0] + "» invece di «non riesco a leggere»");
    }
    stato.rete = true;
    fatto.push(chi + ": " + sezioni.length + " sezioni provate senza rete");
  }
  const err = await page.evaluate(() => window.__bancoErr || []);
  [...new Set(err)].filter(e => !/internetdisconnected|Failed to fetch|NetworkError|Load failed/i.test(e)).slice(0, 5).forEach(e => segna(chi, "errore nella pagina: " + e.slice(0, 160)));
  await ctx.close();
}

(async () => {
  const quali = process.argv[2] && PAGINE[process.argv[2]] ? [process.argv[2]] : Object.keys(PAGINE);
  const srv = await servi(), base = "http://127.0.0.1:" + srv.address().port;
  const browser = await chromium.launch();
  try { for (const n of quali) for (const w of [1440, 375, 360]) await giro(browser, base, n, w); }
  finally { await browser.close(); srv.close(); }
  console.log("\nBANCO DEL GESTIONALE\n" + fatto.map(x => "  ✓ " + x).join("\n"));
  if (!difetti.length) { console.log("\nZERO difetti.\n"); process.exit(0); }
  console.log("\n" + difetti.length + " DIFETTI:\n" + difetti.map(x => "  ✗ " + x).join("\n") + "\n"); process.exit(1);
})().catch(e => { console.error("Il banco si è rotto:", e); process.exit(2); });
