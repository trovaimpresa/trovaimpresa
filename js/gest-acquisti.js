/* =====================================================================
   TrovaImpresa — GLI ACQUISTI DEL MESE (10 novembre 2026)

   Chiesto da Alessio: «quando si fanno le foto alle fatture o alle bolle
   mi serve una lista di tutto quello che si compra: a fine mese dice
   guanti 10 paia, malta venti sacchi, martello 1, e si invia in PDF».

   COME FUNZIONA
   1. Nel modulo «Fattura da pagare» c'e' il riquadro «Cosa hai comprato».
      Con la foto le righe le scrive l'AI (ai-cantiere, la stessa lettura
      di prima, stesso credito). Si possono correggere, togliere, aggiungere.
   2. Quando si salva la fattura le righe vanno in gest_acquisti
      (sql/gest-acquisti.sql), legate alla fattura.
   3. Una BOLLA senza importo non e' una fattura da pagare: si salvano solo
      le righe (fattura_id vuoto).
   4. «Acquisti del mese» (Fornitori e Giornate): somma le righe uguali e
      fa il PDF.

   ⛔ L'AI NON SCRIVE NEL DATABASE: riempie il riquadro, salva chi lavora.
   ⛔ Le righe di una fattura finita nel CESTINO non si contano.
   ⛔ Questo file NON e' chiuso in una funzione: usa sb, sbUid, esc, eur,
      toast, curMestiere, todayStr, openSheetGrande, fornCache, caricaJsPDF
      solo DENTRO le funzioni.
   ===================================================================== */

const ACQ_IC = {
  x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  invia: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>',
  carrello: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6"/></svg>'
};
const ACQ_MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/* ---------- i numeri ---------- */
function acqNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v).trim().replace(/[^\d.,-]/g, "");
  if (!s) return null;
  /* «1.250,5» all'italiana; «12.5» col punto resta 12,5 */
  if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function acqQta(n) {
  if (n === null || n === undefined) return "";
  const v = Math.round(n * 1000) / 1000;
  return v.toLocaleString("it-IT", { maximumFractionDigits: 3 });
}
function acqEuro(n) {
  return (Math.round((+n || 0) * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function acqChiave(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function acqMeseNome(m) {
  const p = String(m || "").split("-");
  const n = ACQ_MESI[(+p[1] || 1) - 1] || "";
  return n.charAt(0).toUpperCase() + n.slice(1) + " " + p[0];
}
function acqMeseSposta(m, di) {
  const p = String(m).split("-"); const d = new Date(+p[0], (+p[1] - 1) + di, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function acqData(d) {
  const p = String(d || "").slice(0, 10).split("-");
  return p.length === 3 ? p[2] + "/" + p[1] : "";
}

/* «PA», «paio», «PAIA» sono la stessa cosa: se no la somma del mese
   tiene separati «10 pa» e «5 paia» */
const ACQ_UNITA = { nr: "pz", n: "pz", "n.": "pz", cad: "pz", "cad.": "pz", pezzi: "pz", pezzo: "pz", pz: "pz", "pz.": "pz", num: "pz",
  pa: "paia", paio: "paia", paia: "paia", sac: "sacchi", sacco: "sacchi", sacchi: "sacchi", sc: "sacchi",
  mt: "m", ml: "m", metri: "m", metro: "m", m: "m", mq: "m2", "m²": "m2", m2: "m2", mc: "m3", "m³": "m3", m3: "m3",
  lt: "l", litri: "l", litro: "l", l: "l", kg: "kg", "kg.": "kg", chili: "kg", q: "q", "q.li": "q", t: "t", ton: "t",
  conf: "conf", "conf.": "conf", confezione: "conf", confezioni: "conf", cf: "conf", rotolo: "rotoli", rotoli: "rotoli", rt: "rotoli",
  bancale: "bancali", bancali: "bancali", scatola: "scatole", scatole: "scatole", sct: "scatole" };
function acqUnita(u) {
  const k = String(u || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 14);
  return ACQ_UNITA[k] || k;
}
function acqNomeBello(s) { s = String(s || "").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* le righe che arrivano dall'AI: pulite, mai piu' di 40 */
function acqPulisci(lista) {
  if (!Array.isArray(lista)) return [];
  const out = [];
  lista.forEach(function (r) {
    if (!r || out.length >= 40) return;
    const nome = String(r.nome || r.descrizione || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (nome.length < 2) return;
    let q = acqNum(r.quantita); if (q !== null && !(q > 0)) q = null;
    const u = acqUnita(r.unita);
    let pu = acqNum(r.prezzo_unitario); if (pu !== null && pu < 0) pu = null;
    let im = acqNum(r.importo); if (im !== null && im < 0) im = null;
    out.push({ nome: acqNomeBello(nome), quantita: q, unita: u, prezzo_unitario: pu, importo: im });
  });
  return out;
}

/* =====================================================================
   1. IL RIQUADRO NEL MODULO DELLA FATTURA
   ===================================================================== */
function acqRigaHTML(r) {
  r = r || {};
  return '<div class="acq-r" data-pu="' + (r.prezzo_unitario == null ? "" : r.prezzo_unitario) + '" data-im="' + (r.importo == null ? "" : r.importo) + '">'
    + '<input class="acq-n" type="text" maxlength="80" aria-label="Cosa hai comprato" placeholder="Cosa (es. Malta)" value="' + esc(r.nome || "") + '">'
    + '<input class="acq-q" type="text" inputmode="decimal" aria-label="Quanti" placeholder="Quanti" value="' + esc(acqQta(r.quantita)) + '">'
    + '<input class="acq-u" type="text" maxlength="14" aria-label="Come si conta, per esempio sacchi" placeholder="sacchi" value="' + esc(r.unita || "") + '">'
    + '<button type="button" class="acq-x" data-acq="togli-riga" aria-label="Togli questa riga">' + ACQ_IC.x + '</button>'
    + '</div>';
}
function acqBoxHTML() {
  return '<div class="sh-b" id="acq-box">'
    + '<div class="sh-tit">Cosa hai comprato</div>'
    + '<p class="sh-nota" style="margin-top:0" id="acq-nota">Con la foto le righe le scrivo io. Finiscono negli <b>Acquisti del mese</b>: a fine mese hai la lista di tutto, in PDF.</p>'
    + '<div class="acq-testa" aria-hidden="true"><span>Cosa</span><span>Quanti</span><span>Come si conta</span><span></span></div>'
    + '<div id="acq-righe"></div>'
    + '<button type="button" class="aic-btn" data-acq="piu-riga">+ Aggiungi una riga</button>'
    + '</div>';
}
function acqBoxMetti(righe, daAI) {
  const box = document.getElementById("acq-righe"); if (!box) return 0;
  box.innerHTML = (righe || []).map(acqRigaHTML).join("");
  acqTesta();
  if (daAI) box.querySelectorAll("input").forEach(function (el) { el.classList.add("ai-pieno"); setTimeout(function () { el.classList.remove("ai-pieno"); }, 2600); });
  return (righe || []).length;
}
function acqTesta() {
  const box = document.getElementById("acq-righe"), t = document.querySelector("#acq-box .acq-testa");
  if (t && box) t.style.display = box.children.length ? "" : "none";
}
/* le righe scritte nel riquadro (quelle senza nome non contano) */
function acqLeggi() {
  const out = [];
  document.querySelectorAll("#acq-righe .acq-r").forEach(function (r) {
    const nome = (r.querySelector(".acq-n").value || "").replace(/\s+/g, " ").trim();
    if (nome.length < 2) return;
    let q = acqNum(r.querySelector(".acq-q").value); if (q !== null && !(q > 0)) q = null;
    const u = acqUnita(r.querySelector(".acq-u").value) || null;
    /* prezzo e importo letti dalla foto valgono solo se la quantita' non e'
       stata cambiata a mano: se no l'importo sarebbe di un'altra quantita' */
    let pu = acqNum(r.dataset.pu), im = acqNum(r.dataset.im);
    if (r.dataset.toccata === "1") { im = (pu !== null && q !== null) ? Math.round(pu * q * 100) / 100 : null; }
    out.push({ descrizione: acqNomeBello(nome.slice(0, 80)), quantita: q, unita: u, prezzo_unitario: pu, importo: im });
  });
  return out;
}
/* modifica di una fattura gia' salvata: le sue righe tornano nel riquadro */
async function acqBoxCarica(fatturaId) {
  if (!fatturaId || !sb || !sbUid) return;
  const { data, error } = await sb.from("gest_acquisti").select("descrizione,quantita,unita,prezzo_unitario,importo,created_at,id")
    .eq("user_id", sbUid).eq("fattura_id", fatturaId).order("created_at").order("id");
  if (error || !data) return;
  acqBoxMetti(data.map(function (r) { return { nome: r.descrizione, quantita: r.quantita, unita: r.unita, prezzo_unitario: r.prezzo_unitario, importo: r.importo }; }), false);
}
/* salva le righe. fatturaId vuoto = bolla senza importo.
   Torna il numero di righe salvate, oppure -1 se e' andata male. */
async function acqSalva(fatturaId, doc, eraGiaSalvata) {
  if (!sb || !sbUid) return -1;
  const righe = acqLeggi();
  if (eraGiaSalvata && fatturaId) {
    const { error: e0 } = await sb.from("gest_acquisti").delete().eq("user_id", sbUid).eq("fattura_id", fatturaId);
    if (e0) { toast("La fattura è salvata, ma la merce no: " + e0.message); return -1; }
  }
  if (!righe.length) return 0;
  const base = { user_id: sbUid, mestiere_id: curMestiere(), fattura_id: fatturaId || null,
    fornitore_id: doc.fornitore_id || null, lavoro_id: doc.lavoro_id || null, data: doc.data || todayStr() };
  const { data, error } = await sb.from("gest_acquisti").insert(righe.map(function (r) { return Object.assign({}, base, r); })).select("id");
  if (error || !data) { toast((fatturaId ? "La fattura è salvata, ma la merce no: " : "Non salvato: ") + ((error && error.message) || "riprova")); return -1; }
  return data.length;
}

/* =====================================================================
   2. «ACQUISTI DEL MESE»
   ===================================================================== */
let acqMese = "", acqRighe = [], acqFornNomi = {};

async function acqCaricaMese(m) {
  acqRighe = [];
  if (!sb || !sbUid) return "Accedi per vedere gli acquisti.";
  const p = m.split("-"), ultimo = new Date(+p[0], +p[1], 0).getDate();
  const r = await sb.from("gest_acquisti").select("*").eq("user_id", sbUid).eq("mestiere_id", curMestiere())
    .gte("data", m + "-01").lte("data", m + "-" + String(ultimo).padStart(2, "0")).order("data").order("created_at");
  if (r.error) return "Non riesco a leggere gli acquisti: controlla la connessione e riprova.";
  let righe = r.data || [];
  /* le fatture nel cestino: la lettura normale non le vede, quindi le righe
     che puntano a una fattura che «non c'e'» si saltano */
  const idf = [...new Set(righe.map(function (x) { return x.fattura_id; }).filter(Boolean))];
  if (idf.length) {
    const rf = await sb.from("gest_fatture_fornitori").select("id").eq("user_id", sbUid).in("id", idf);
    if (!rf.error) { const vive = new Set((rf.data || []).map(function (x) { return String(x.id); })); righe = righe.filter(function (x) { return !x.fattura_id || vive.has(String(x.fattura_id)); }); }
  }
  acqFornNomi = {};
  const idn = [...new Set(righe.map(function (x) { return x.fornitore_id; }).filter(Boolean))];
  if (idn.length) {
    const rn = await sb.from("gest_fornitori").select("id,nome").eq("user_id", sbUid).in("id", idn);
    (rn.data || []).forEach(function (f) { acqFornNomi[String(f.id)] = f.nome; });
  }
  acqRighe = righe;
  return "";
}
/* le righe uguali (stesso nome, stesso modo di contare) diventano una */
function acqSomma(righe) {
  const m = {};
  righe.forEach(function (r) {
    const k = acqChiave(r.descrizione) + "|" + acqChiave(acqUnita(r.unita));
    const g = m[k] || (m[k] = { nome: acqNomeBello(r.descrizione), unita: acqUnita(r.unita), q: 0, haQ: false, senzaQ: 0, imp: 0, haImp: false, n: 0 });
    g.n++;
    if (r.quantita !== null && r.quantita !== undefined) { g.q += +r.quantita || 0; g.haQ = true; } else g.senzaQ++;
    if (r.importo !== null && r.importo !== undefined) { g.imp += +r.importo || 0; g.haImp = true; }
  });
  return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, "it"); });
}
function acqQuantoTxt(g) {
  if (!g.haQ) return g.n > 1 ? g.n + " volte" : "—";
  return acqQta(g.q) + (g.unita ? " " + g.unita : "");
}
function acqCorpoHTML(errore) {
  const testa = '<div class="acq-mese"><button type="button" data-acq="mese-prima" aria-label="Mese prima">‹</button>'
    + '<b>' + esc(acqMeseNome(acqMese)) + '</b>'
    + '<button type="button" data-acq="mese-dopo" aria-label="Mese dopo">›</button></div>';
  if (errore) return testa + '<div class="rie-errore"><b>' + esc(errore) + '</b></div>';
  if (!acqRighe.length) return testa + '<div class="acq-vuoto"><b>In questo mese non c\'è niente.</b>'
    + 'Fotografa una fattura o una bolla: la merce la leggo io e la trovi qui.'
    + '<button type="button" class="btn-primary" data-acq="nuova">Fotografa una fattura o una bolla</button></div>';
  const somma = acqSomma(acqRighe);
  const tot = acqRighe.reduce(function (s, r) { return s + (+r.importo || 0); }, 0);
  const docs = new Set(acqRighe.map(function (r) { return r.fattura_id || (r.fornitore_id + "|" + r.data); })).size;
  let h = testa + '<div class="acq-tot"><div><b>' + somma.length + '</b><span>' + (somma.length === 1 ? "Prodotto" : "Prodotti") + '</span></div>'
    + '<div><b>' + docs + '</b><span>' + (docs === 1 ? "Documento" : "Documenti") + '</span></div>'
    + (tot > 0 ? '<div><b>' + acqEuro(tot) + '</b><span>Senza IVA</span></div>' : '') + '</div>';
  h += '<div class="sh-cols"><div class="sh-col"><div class="sh-b"><div class="sh-tit">Tutto quello che hai comprato</div><div class="gx-lista">'
    + somma.map(function (g) {
      return '<div class="gx-riga"><span class="t">' + esc(g.nome) + '</span><b>' + esc(acqQuantoTxt(g)) + '</b></div>';
    }).join("") + '</div></div></div>';
  h += '<div class="sh-col"><div class="sh-b"><div class="sh-tit">Riga per riga</div>'
    + '<p class="sh-nota" style="margin-top:0">Se una riga è sbagliata, toglila qui.</p><div class="gx-lista">'
    /* a schermo le ULTIME salvate stanno in cima (nel PDF resta l'ordine dei giorni) */
    + acqRighe.slice().reverse().map(function (r) {
      const q = (r.quantita !== null && r.quantita !== undefined) ? acqQta(+r.quantita) + (r.unita ? " " + acqUnita(r.unita) : "") : "";
      return '<div class="gx-riga"><span class="t">' + esc(r.descrizione) + '<small>' + esc(acqData(r.data) + (acqFornNomi[String(r.fornitore_id)] ? " · " + acqFornNomi[String(r.fornitore_id)] : "") + (r.fattura_id ? " · fattura" : " · bolla")) + '</small></span>'
        + '<b>' + esc(q) + '</b>'
        + '<button type="button" class="acq-x" data-acq="togli" data-id="' + esc(String(r.id)) + '" aria-label="Togli ' + esc(r.descrizione) + '">' + ACQ_IC.x + '</button></div>';
    }).join("") + '</div></div></div></div>';
  return h;
}
function acqPiedeHTML() {
  const puoInviare = !!(navigator.canShare && window.File);
  return '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + (puoInviare ? '<button class="btn" data-acq="invia" id="acq-b-invia">' + ACQ_IC.invia + ' Invia il PDF</button>' : '')
    + '<button class="btn-primary" data-acq="pdf" id="acq-b-pdf">' + ACQ_IC.pdf + ' Scarica il PDF</button>';
}
function acqAggiornaPiede() {
  ["acq-b-pdf", "acq-b-invia"].forEach(function (id) { const b = document.getElementById(id); if (b) b.style.display = acqRighe.length ? "" : "none"; });
}
async function acqApri(mese) {
  acqMese = /^\d{4}-\d{2}$/.test(mese || "") ? mese : todayStr().slice(0, 7);
  openSheetGrande("Acquisti del mese", '<div id="acq-corpo"><div class="acq-vuoto">Un attimo…</div></div>', acqPiedeHTML());
  acqAggiornaPiede();
  await acqRidisegna();
}
async function acqRidisegna() {
  const err = await acqCaricaMese(acqMese);
  const c = document.getElementById("acq-corpo"); if (!c) return;
  c.innerHTML = acqCorpoHTML(err);
  acqAggiornaPiede();
}

/* ---------- il PDF ---------- */
async function acqPdfDoc() {
  if (!(await caricaJsPDF())) { toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return null; }
  const J = window.jspdf && window.jspdf.jsPDF; if (!J) return null;
  const doc = new J({ unit: "mm", format: "a4" }); const W = 210, M = 15; let y = 18;
  if (typeof window.gestLogoPdf === "function") { try { y = await window.gestLogoPdf(doc, M, y) || y; } catch (e) {} }
  const T = function (s) { return String(s == null ? "" : s).replace(/[^\x00-\xFF€]/g, ""); };
  const pagina = function (hh) { if (y + hh > 282) { doc.addPage(); y = 20; } };
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(T("Acquisti di " + acqMeseNome(acqMese)), M, y); y += 6;
  doc.setDrawColor(255, 136, 0); doc.setLineWidth(.8); doc.line(M, y, W - M, y); y += 10;
  function tabella(titolo, cols, righe, larg, destra) {
    pagina(20); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(T(titolo), M, y); y += 7;
    doc.setFontSize(10); doc.setFillColor(236, 240, 245); doc.rect(M, y - 5, W - 2 * M, 7, "F");
    let x = M; cols.forEach(function (c, i) { if (destra && destra[i]) doc.text(T(c), x + larg[i] - 2, y, { align: "right" }); else doc.text(T(c), x + 2, y); x += larg[i]; }); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    righe.forEach(function (r) {
      const linee = r.map(function (c, i) { return doc.splitTextToSize(T(c), larg[i] - 4); });
      const hh = Math.max.apply(null, linee.map(function (l) { return l.length; })) * 5 + 2;
      pagina(hh); x = M;
      linee.forEach(function (l, i) { if (destra && destra[i]) doc.text(l, x + larg[i] - 2, y, { align: "right" }); else doc.text(l, x + 2, y); x += larg[i]; });
      y += hh; doc.setDrawColor(226, 232, 240); doc.setLineWidth(.2); doc.line(M, y - 3.8, W - M, y - 3.8);
    });
    y += 8;
  }
  const somma = acqSomma(acqRighe);
  const haSoldi = somma.some(function (g) { return g.haImp; });
  if (haSoldi) {
    tabella("1. Tutto quello che è stato comprato", ["Prodotto", "Quantità", "Spesa senza IVA"],
      somma.map(function (g) { return [g.nome, acqQuantoTxt(g), g.haImp ? acqEuro(g.imp) : ""]; }), [100, 40, 40], [false, true, true]);
    const tot = acqRighe.reduce(function (s, r) { return s + (+r.importo || 0); }, 0);
    pagina(10); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(T("Totale senza IVA: " + acqEuro(tot)), W - M - 2, y - 3, { align: "right" }); y += 8;
  } else {
    tabella("1. Tutto quello che è stato comprato", ["Prodotto", "Quantità"],
      somma.map(function (g) { return [g.nome, acqQuantoTxt(g)]; }), [130, 50], [false, true]);
  }
  /* 10 nov 2026: si vede se la riga viene da una bolla o da una fattura */
  tabella("2. Riga per riga", ["Giorno", "Fornitore", "Foglio", "Prodotto", "Quantità"],
    acqRighe.map(function (r) {
      return [acqData(r.data), acqFornNomi[String(r.fornitore_id)] || "", r.fattura_id ? "Fattura" : "Bolla", r.descrizione,
        (r.quantita !== null && r.quantita !== undefined) ? acqQta(+r.quantita) + (r.unita ? " " + acqUnita(r.unita) : "") : ""];
    }), [20, 45, 20, 65, 30], [false, false, false, false, true]);
  return doc;
}
function acqPdfNome() { return "Acquisti " + acqMeseNome(acqMese) + ".pdf"; }
async function acqPdf() {
  if (!acqRighe.length) { toast("In questo mese non c'è niente da stampare"); return; }
  const doc = await acqPdfDoc(); if (doc) doc.save(acqPdfNome());
}
async function acqInvia() {
  if (!acqRighe.length) return;
  const doc = await acqPdfDoc(); if (!doc) return;
  try {
    const f = new File([doc.output("blob")], acqPdfNome(), { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "Acquisti di " + acqMeseNome(acqMese) }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  /* il telefono non sa inviare un file da qui: lo scarico, e si allega a mano */
  doc.save(acqPdfNome()); toast("Te l'ho scaricato: allegalo tu al messaggio");
}

/* ---------- i clic ---------- */
document.addEventListener("input", function (e) {
  const r = e.target && e.target.closest && e.target.closest("#acq-righe .acq-r");
  if (r && e.target.classList.contains("acq-q") && e.isTrusted) r.dataset.toccata = "1";
});
document.addEventListener("click", async function (e) {
  const b = e.target && e.target.closest && e.target.closest("[data-acq]"); if (!b) return;
  const a = b.dataset.acq;
  if (a === "mese") return acqApri(b.dataset.mese || (typeof giorMese !== "undefined" && document.getElementById("giornate") && document.getElementById("giornate").classList.contains("active") ? giorMese : ""));
  if (a === "piu-riga") {
    const box = document.getElementById("acq-righe"); if (!box) return;
    box.insertAdjacentHTML("beforeend", acqRigaHTML({})); acqTesta();
    const n = box.lastElementChild.querySelector(".acq-n"); if (n) n.focus();
    return;
  }
  if (a === "togli-riga") { const r = b.closest(".acq-r"); if (r) r.remove(); acqTesta(); return; }
  if (a === "mese-prima" || a === "mese-dopo") { acqMese = acqMeseSposta(acqMese, a === "mese-prima" ? -1 : 1); const c = document.getElementById("acq-corpo"); if (c) c.innerHTML = '<div class="acq-vuoto">Un attimo…</div>'; return acqRidisegna(); }
  if (a === "pdf") return acqPdf();
  if (a === "invia") return acqInvia();
  if (a === "nuova") {
    if (typeof fattfForm !== "function") return;
    if (typeof fornCache !== "undefined" && !fornCache.length && typeof renderFornitori === "function") { try { await renderFornitori(); } catch (er) {} }
    return fattfForm(null);
  }
  if (a === "togli") {
    /* due tocchi: il primo chiede, il secondo toglie */
    if (b.dataset.sicuro !== "1") {
      b.dataset.sicuro = "1"; b.classList.add("acq-x--sicuro"); b.innerHTML = "Togli?";
      setTimeout(function () { if (b.isConnected) { b.dataset.sicuro = ""; b.classList.remove("acq-x--sicuro"); b.innerHTML = ACQ_IC.x; } }, 3500);
      return;
    }
    b.disabled = true;
    const { data, error } = await sb.from("gest_acquisti").delete().eq("id", b.dataset.id).eq("user_id", sbUid).select("id");
    if (error || !data || !data.length) { b.disabled = false; toast("Non tolta: " + ((error && error.message) || "riprova")); return; }
    toast("Riga tolta"); return acqRidisegna();
  }
});
