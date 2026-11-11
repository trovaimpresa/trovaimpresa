/* =====================================================================
   10 nov 2026 — BOLLE CONTRO FATTURE (chiesto da Alessio)
   «Quando faccio le foto alle bolle, a fine mese nel PDF mi deve uscire
   un resoconto di tutto quello che abbiamo preso, e deve combaciare con
   le fatture che il fornitore manda al capo: tante volte il fornitore
   aggiunge materiali e nessuno se ne accorge.»

   Le righe stanno gia' in gest_acquisti (js/gest-acquisti.js):
     · riga di una BOLLA   -> fattura_id vuoto
     · riga di una FATTURA -> fattura_id pieno
   Qui, per ogni fornitore del mese, si mettono le une accanto alle altre:
     · uguale                       -> verde  «Uguale»
     · in fattura e in nessuna bolla -> ROSSO  «Non c'è in nessuna bolla»
     · in fattura piu' che in bolla  -> ROSSO  «In fattura N in più»
     · in fattura meno che in bolla  -> ambra  «Fatturato meno di quanto arrivato»
     · in bolla e non in fattura     -> ambra  (grigio se la fattura del
                                        fornitore non e' ancora arrivata)
   ⛔ Se di un fornitore non c'e' nessuna bolla, non si accusa niente:
      senza bolle non c'e' niente da confrontare (lo dice e basta).
   ⛔ I nomi letti dall'AI non sono mai identici («MALTA PREMISC. 25 KG» e
      «Malta premiscelata 25kg»): si accoppiano anche le righe che hanno
   quasi le stesse parole e lo stesso modo di contare. Il confronto e' un
      aiuto: le righe rosse si guardano sui fogli veri.
   E la lista «Tutto quello che hai comprato» non conta piu' due volte la
   stessa merce (una volta dalla bolla e una dalla fattura).
   ===================================================================== */

/* ---------- le parole di una riga ---------- */
const BF_VUOTE = { di: 1, da: 1, in: 1, con: 1, per: 1, the: 1, del: 1, della: 1, dei: 1, delle: 1, al: 1, x: 1 };
function bfParole(s) {
  const t = acqChiave(s)
    .replace(/(\d)\s*(kg|lt|l|mm|cm|m|mq|ml|pz|gr|g)\b/g, "$1$2")     /* «25 kg» e «25kg» sono uguali */
    .split(" ").filter(function (w) { return w && !BF_VUOTE[w] && (w.length > 1 || /\d/.test(w)); });
  /* le parole accorciate: «premisc» vale «premiscelata» */
  return t.map(function (w) { return /\d/.test(w) ? w : w.slice(0, 6); });
}
function bfSimili(a, b) {
  const A = bfParole(a), B = bfParole(b);
  if (!A.length || !B.length) return 0;
  const sb_ = {}; B.forEach(function (w) { sb_[w] = 1; });
  let comuni = 0; const vis = {};
  A.forEach(function (w) { if (sb_[w] && !vis[w]) { comuni++; vis[w] = 1; } });
  const tutte = {}; A.concat(B).forEach(function (w) { tutte[w] = 1; });
  return comuni / Object.keys(tutte).length;
}

/* la chiave di un prodotto: le sue parole (cosi' «25 kg» e «25kg» sono uno) */
function bfChiave(desc, unita) { return bfParole(desc).join(" ") + "|" + acqUnita(unita); }

/* le righe di un lato (bolle o fatture) di un fornitore, sommate per prodotto */
function bfGruppi(righe) {
  const m = {};
  righe.forEach(function (r) {
    const u = acqUnita(r.unita);
    const k = bfChiave(r.descrizione, r.unita);
    const g = m[k] || (m[k] = { nome: acqNomeBello(r.descrizione), unita: u, q: 0, haQ: false, senzaQ: 0, righe: [] });
    g.righe.push(r);
    if (r.quantita !== null && r.quantita !== undefined) { g.q += +r.quantita || 0; g.haQ = true; } else g.senzaQ++;
  });
  return Object.keys(m).map(function (k) { return m[k]; });
}

/* il confronto: un elenco per fornitore */
function bfConfronta(righe, nomi) {
  const perF = {};
  (righe || []).forEach(function (r) {
    const k = r.fornitore_id ? String(r.fornitore_id) : "";
    (perF[k] || (perF[k] = { bolle: [], fatt: [] }))[r.fattura_id ? "fatt" : "bolle"].push(r);
  });
  const out = [];
  Object.keys(perF).forEach(function (fk) {
    const x = perF[fk];
    const B = bfGruppi(x.bolle), F = bfGruppi(x.fatt);
    const f = { fornitore_id: fk || null, nome: (nomi && nomi[fk]) || (fk ? "Fornitore" : "Senza fornitore"),
                nBolle: new Set(x.bolle.map(function (r) { return r.data; })).size, nFatture: new Set(x.fatt.map(function (r) { return String(r.fattura_id); })).size,
                voci: [], problemi: 0 };
    const presa = {};
    /* 1. stesso nome e stessa unita' */
    const coppie = [];
    F.forEach(function (gf, i) {
      const j = B.findIndex(function (gb, jj) { return !presa[jj] && bfChiave(gb.nome, gb.unita) === bfChiave(gf.nome, gf.unita); });
      if (j >= 0) { presa[j] = 1; coppie[i] = j; }
    });
    /* 2. quasi le stesse parole e stessa unita' (la piu' simile vince) */
    F.forEach(function (gf, i) {
      if (coppie[i] !== undefined) return;
      let meglio = -1, voto = 0;
      B.forEach(function (gb, j) {
        if (presa[j] || (gb.unita && gf.unita && gb.unita !== gf.unita)) return;
        const v = bfSimili(gf.nome, gb.nome);
        if (v > voto) { voto = v; meglio = j; }
      });
      if (meglio >= 0 && voto >= 0.5) { presa[meglio] = 1; coppie[i] = meglio; }
    });
    const senzaBolle = !B.length;
    F.forEach(function (gf, i) {
      const gb = coppie[i] !== undefined ? B[coppie[i]] : null;
      const v = { nome: gf.nome, unita: gf.unita, bolla: gb ? (gb.haQ ? gb.q : null) : null, fattura: gf.haQ ? gf.q : null,
                  inBolla: !!gb, inFattura: true, nomeBolla: gb ? gb.nome : "" };
      if (senzaBolle) v.stato = "nessuna_bolla";
      else if (!gb) v.stato = "solo_fattura";
      else if (v.bolla === null || v.fattura === null) v.stato = "guarda";
      else if (Math.abs(v.fattura - v.bolla) < 0.001) v.stato = "ok";
      else v.stato = v.fattura > v.bolla ? "piu" : "meno";
      f.voci.push(v);
    });
    B.forEach(function (gb, j) {
      if (presa[j]) return;
      f.voci.push({ nome: gb.nome, unita: gb.unita, bolla: gb.haQ ? gb.q : null, fattura: null, inBolla: true, inFattura: false,
                    stato: F.length ? "solo_bolla" : "fattura_attesa" });
    });
    const peso = { solo_fattura: 0, piu: 1, meno: 2, guarda: 3, solo_bolla: 4, fattura_attesa: 5, ok: 6, nessuna_bolla: 7 };
    f.voci.sort(function (a, b) { return (peso[a.stato] - peso[b.stato]) || a.nome.localeCompare(b.nome, "it"); });
    f.problemi = f.voci.filter(function (v) { return v.stato === "solo_fattura" || v.stato === "piu"; }).length;
    f.attenzioni = f.voci.filter(function (v) { return v.stato === "meno" || v.stato === "guarda" || v.stato === "solo_bolla"; }).length;
    out.push(f);
  });
  out.sort(function (a, b) { return (b.problemi - a.problemi) || (b.attenzioni - a.attenzioni) || a.nome.localeCompare(b.nome, "it"); });
  return out;
}

/* le righe da contare una volta sola: dove c'e' la fattura conta la
   fattura; le righe delle bolle contano solo se non sono ancora in fattura */
function bfSenzaDoppioni(righe) {
  const perF = {};
  righe.forEach(function (r) { const k = r.fornitore_id ? String(r.fornitore_id) : ""; (perF[k] || (perF[k] = [])).push(r); });
  let out = [];
  Object.keys(perF).forEach(function (fk) {
    const tutte = perF[fk];
    const fatt = tutte.filter(function (r) { return r.fattura_id; });
    if (!fatt.length) { out = out.concat(tutte); return; }
    const f = bfConfronta(tutte, {})[0];
    const fuori = {};   /* i prodotti delle bolle non ancora in fattura */
    f.voci.forEach(function (v) { if (v.stato === "solo_bolla") fuori[bfChiave(v.nome, v.unita)] = 1; });
    out = out.concat(fatt, tutte.filter(function (r) { return !r.fattura_id && fuori[bfChiave(r.descrizione, r.unita)]; }));
  });
  return out;
}

/* ---------- le parole ---------- */
function bfQ(n, u) { return n === null || n === undefined ? "—" : acqQta(n) + (u ? " " + u : ""); }
function bfStato(v) {
  switch (v.stato) {
    case "ok": return { k: "ok", t: "Uguale" };
    case "solo_fattura": return { k: "err", t: "Non c'è in nessuna bolla" };
    case "piu": return { k: "err", t: "In fattura " + acqQta(v.fattura - v.bolla) + (v.unita ? " " + v.unita : "") + " in più" };
    case "meno": return { k: "att", t: "In fattura " + acqQta(v.bolla - v.fattura) + (v.unita ? " " + v.unita : "") + " in meno" };
    case "guarda": return { k: "att", t: "Manca la quantità: guardalo sul foglio" };
    case "solo_bolla": return { k: "att", t: "Arrivato, ma non è in fattura" };
    case "fattura_attesa": return { k: "zero", t: "Fattura non ancora arrivata" };
    default: return { k: "zero", t: "Nessuna bolla da confrontare" };
  }
}

function bfHTML(righe, nomi) {
  if (!righe.some(function (r) { return !r.fattura_id; }) && !righe.some(function (r) { return r.fattura_id; })) return "";
  const lista = bfConfronta(righe, nomi);
  const prob = lista.reduce(function (s, f) { return s + f.problemi; }, 0);
  const att = lista.reduce(function (s, f) { return s + f.attenzioni; }, 0);
  const senzaBolle = lista.every(function (f) { return !f.nBolle; });
  let h = '<div class="sh-b bf"><div class="sh-tit">Bolle e fatture</div>';
  if (senzaBolle) {
    h += '<p class="bf-sub">Questo mese non ci sono bolle fotografate: non posso confrontarle con le fatture. Fotografa le bolle quando arriva la merce.</p></div>';
    return h;
  }
  h += prob ? '<div class="bf-riass err"><b>' + prob + (prob === 1 ? ' cosa' : ' cose') + ' in fattura che non tornano con le bolle</b>Guardale sui fogli e chiedi al fornitore.</div>'
     : att ? '<div class="bf-riass att"><b>' + att + (att === 1 ? ' cosa da guardare' : ' cose da guardare') + '</b>Niente in più in fattura, ma qualcosa non è uguale.</div>'
     : '<div class="bf-riass ok"><b>Le fatture tornano con le bolle</b></div>';
  lista.forEach(function (f) {
    h += '<div class="bf-forn"><div class="bf-fnome">' + esc(f.nome) + '<small>' + f.nBolle + (f.nBolle === 1 ? ' bolla' : ' bolle') + ' · ' + f.nFatture + (f.nFatture === 1 ? ' fattura' : ' fatture') + '</small></div>'
      + '<div class="bf-testa"><span>Merce</span><span>Bolle</span><span>Fattura</span><span>Come torna</span></div>'
      + f.voci.map(function (v) {
        const s = bfStato(v);
        return '<div class="bf-r ' + s.k + '"><span class="bf-n">' + esc(v.nome) + (v.nomeBolla && acqChiave(v.nomeBolla) !== acqChiave(v.nome) ? '<small>in bolla: ' + esc(v.nomeBolla) + '</small>' : '') + '</span>'
          + '<span class="bf-q">' + esc(v.inBolla ? bfQ(v.bolla, v.unita) : "—") + '</span>'
          + '<span class="bf-q">' + esc(v.inFattura ? bfQ(v.fattura, v.unita) : "—") + '</span>'
          + '<span class="bf-s"><em>' + esc(s.t) + '</em></span></div>';
      }).join("") + '</div>';
  });
  return h + '</div>';
}

/* ---------- dentro «Acquisti del mese» ---------- */
(function () {
  if (typeof acqCorpoHTML !== "function" || typeof acqSomma !== "function") return;
  const _corpo = acqCorpoHTML, _somma = acqSomma;
  /* la lista «Tutto quello che hai comprato» senza doppioni */
  window.acqSomma = function (righe) { return _somma(righe === acqRighe ? bfSenzaDoppioni(righe) : righe); };
  try { acqSomma = window.acqSomma; } catch (e) {}
  window.acqCorpoHTML = function (errore) {
    let h = _corpo(errore);
    if (errore || !acqRighe.length) return h;
    const box = bfHTML(acqRighe, acqFornNomi);
    if (!box) return h;
    const dove = h.indexOf('<div class="sh-cols">');
    return dove >= 0 ? h.slice(0, dove) + box + h.slice(dove) : h + box;
  };
  try { acqCorpoHTML = window.acqCorpoHTML; } catch (e) {}

  /* nel PDF: la parte «3. Bolle e fatture» */
  const _pdf = acqPdfDoc;
  window.acqPdfDoc = async function () {
    const doc = await _pdf.apply(this, arguments);
    if (!doc) return doc;
    try { bfPdf(doc); } catch (e) {}
    return doc;
  };
  try { acqPdfDoc = window.acqPdfDoc; } catch (e) {}

  const st = document.createElement("style");
  st.textContent =
    ".bf{margin-bottom:16px;max-width:1150px}" +
    ".bf-sub{font-size:16px;color:var(--testo,#0f172a);margin:0}" +
    ".bf-riass{border-radius:12px;padding:12px 14px;font-size:16px;margin-bottom:12px;display:flex;flex-direction:column;gap:2px}" +
    ".bf-riass b{font-size:18px}" +
    ".bf-riass.err{background:#fdeaea;color:#8e1c1c;border:1.5px solid #f3b4b4}" +
    ".bf-riass.att{background:#fff6e5;color:#7a4500;border:1.5px solid #ffd79a}" +
    ".bf-riass.ok{background:#e9f7ee;color:#14532d;border:1.5px solid #a7dcb8}" +
    ".bf-forn{border-top:1px solid var(--bordo,#e2e8f0);padding-top:12px;margin-top:12px}" +
    ".bf-fnome{font-size:18px;font-weight:800;color:var(--testo,#0f172a);margin-bottom:6px}" +
    ".bf-fnome small{display:block;font-size:15px;font-weight:600;color:#334155}" +
    ".bf-testa,.bf-r{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,2fr);gap:10px;align-items:center}" +
    ".bf-testa{font-size:14px;font-weight:800;color:#334155;padding:6px 0;border-bottom:1px solid var(--bordo,#e2e8f0)}" +
    ".bf-r{font-size:16px;color:var(--testo,#0f172a);padding:9px 0;border-bottom:1px solid var(--bordo,#e2e8f0)}" +
    ".bf-n{overflow-wrap:anywhere}.bf-n small{display:block;font-size:14px;color:#475569}" +
    ".bf-q{font-weight:700;white-space:nowrap}" +
    ".bf-s em{font-style:normal;font-size:14px;font-weight:800;border-radius:8px;padding:3px 9px;display:inline-block}" +
    ".bf-r.ok .bf-s em{background:#e9f7ee;color:#14532d}" +
    ".bf-r.err .bf-s em{background:#fdeaea;color:#8e1c1c}" +
    ".bf-r.att .bf-s em{background:#fff6e5;color:#7a4500}" +
    ".bf-r.zero .bf-s em{background:#f1f5f9;color:#334155}" +
    "@media (max-width:640px){.bf-testa,.bf-r{grid-template-columns:minmax(0,1fr) auto auto}.bf-testa span:nth-child(4){display:none}.bf-s{grid-column:1/-1}}";
  document.head.appendChild(st);
})();

/* ---------- la parte del PDF ---------- */
function bfPdf(doc) {
  const lista = bfConfronta(acqRighe, acqFornNomi);
  if (!lista.length) return;
  const W = 210, M = 15;
  const T = function (s) { return String(s == null ? "" : s).replace(/[^\x00-\xFF€]/g, ""); };
  doc.addPage(); let y = 20;
  const pagina = function (hh) { if (y + hh > 282) { doc.addPage(); y = 20; } };
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(T("3. Bolle e fatture"), M, y); y += 6;
  doc.setDrawColor(255, 136, 0); doc.setLineWidth(.8); doc.line(M, y, W - M, y); y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  const prob = lista.reduce(function (s, f) { return s + f.problemi; }, 0);
  if (lista.every(function (f) { return !f.nBolle; })) { doc.text(T("Nessuna bolla fotografata in questo mese: non c'e' niente da confrontare."), M, y); return; }
  doc.setFont("helvetica", "bold");
  if (prob) doc.setTextColor(170, 30, 30);
  doc.text(T(prob ? prob + (prob === 1 ? " cosa in fattura non torna con le bolle." : " cose in fattura non tornano con le bolle.") : "Le fatture tornano con le bolle."), M, y);
  doc.setTextColor(0, 0, 0); y += 9;
  const larg = [70, 25, 25, 60];
  lista.forEach(function (f) {
    pagina(24);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(T(f.nome + "  (" + f.nBolle + (f.nBolle === 1 ? " bolla, " : " bolle, ") + f.nFatture + (f.nFatture === 1 ? " fattura)" : " fatture)")), M, y); y += 6;
    doc.setFontSize(10); doc.setFillColor(236, 240, 245); doc.rect(M, y - 5, W - 2 * M, 7, "F");
    let x = M; ["Merce", "Bolle", "Fattura", "Come torna"].forEach(function (c, i) { doc.text(T(c), x + 2, y); x += larg[i]; }); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    f.voci.forEach(function (v) {
      const s = bfStato(v);
      const celle = [v.nome, v.inBolla ? bfQ(v.bolla, v.unita) : "-", v.inFattura ? bfQ(v.fattura, v.unita) : "-", s.t];
      const linee = celle.map(function (c, i) { return doc.splitTextToSize(T(c), larg[i] - 4); });
      const hh = Math.max.apply(null, linee.map(function (l) { return l.length; })) * 4.8 + 2;
      pagina(hh); x = M;
      linee.forEach(function (l, i) {
        if (i === 3) {
          if (s.k === "err") { doc.setTextColor(170, 30, 30); doc.setFont("helvetica", "bold"); }
          else if (s.k === "att") { doc.setTextColor(150, 80, 0); doc.setFont("helvetica", "bold"); }
          else if (s.k === "ok") doc.setTextColor(20, 100, 50);
        }
        doc.text(l, x + 2, y); x += larg[i];
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
      });
      y += hh; doc.setDrawColor(226, 232, 240); doc.setLineWidth(.2); doc.line(M, y - 3.8, W - M, y - 3.8);
    });
    y += 6;
  });
  pagina(12); doc.setFontSize(9.5); doc.setTextColor(80, 80, 80);
  doc.text(doc.splitTextToSize(T("Il confronto e' fatto sulle righe lette dalle foto: i nomi possono essere scritti in modo diverso. Le righe in rosso vanno guardate sui fogli veri prima di pagare."), W - 2 * M), M, y);
  doc.setTextColor(0, 0, 0);
}

/* 11 nov 2026 — IL CONTROLLO SUBITO, quando registri la fattura di un
   fornitore (js/gest-carte-documenti.js). Torna true se ha mostrato
   qualcosa (spunta verde o X rossa), false se non c'era niente da dire. */
async function bfControllaFattura(fornitoreId, data) {
  try {
    if (typeof window.tiSpunta !== "function" || typeof acqCaricaMese !== "function") return false;
    const mese = String(data || "").slice(0, 7); if (!/^\d{4}-\d{2}$/.test(mese)) return false;
    const err = await acqCaricaMese(mese); if (err) return false;
    const mie = acqRighe.filter(function (r) { return String(r.fornitore_id || "") === String(fornitoreId); });
    const f = bfConfronta(mie, acqFornNomi)[0];
    if (!f || !f.nBolle || !f.nFatture) return false;
    const nome = f.nome && f.nome !== "Fornitore" ? f.nome : "";
    if (f.problemi) {
      window.tiSpunta(f.problemi + (f.problemi === 1 ? " cosa in fattura non torna" : " cose in fattura non tornano"), {
        rosso: true, bott: "Guarda il confronto",
        sotto: (nome ? "Fattura di " + nome + ": " : "") + "c'è merce in più o che non è in nessuna bolla.",
        vai: function () { if (typeof acqApri === "function") acqApri(mese); }
      });
      return true;
    }
    if (f.attenzioni) return false;
    window.tiSpunta("La fattura torna con le bolle", { sotto: (nome ? nome + " · " : "") + f.voci.length + (f.voci.length === 1 ? " riga uguale" : " righe, tutte uguali") });
    return true;
  } catch (e) { return false; }
}
