/* 13 nov 2026 — BANCO DELLA COPIA DEL COMPUTO («Duplica» e «Crea la variante»,
   compDuplica in js/gest-cestino.js). Senza browser e senza rete, con un
   database finto in memoria:  node tools/banco-copia-computo.js
   Prova che la copia porta le righe dell'analisi dei prezzi, attaccate alla
   lavorazione GIUSTA, e che il prezzo calcolato resta uguale. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "..", "js", "gest-cestino.js"), "utf8");
const da = src.indexOf("async function compDuplica("), a = src.indexOf("async function delComputo(");
if (da < 0 || a < 0) { console.error("Non trovo compDuplica"); process.exit(2); }
const codice = src.slice(da, a);

function nuovoDb() {
  let n = 0; const id = () => "nuovo-" + (++n);
  const t = {
    gest_computi: [{ id: "C1", user_id: "U", titolo: "Bagno", tipo: "privato" }],
    gest_computo_capitoli: [{ id: "K1", user_id: "U", computo_id: "C1", ordine: 1, numero: "1", titolo: "Demolizioni" }],
    gest_computo_voci: [
      { id: "V1", user_id: "U", computo_id: "C1", capitolo_id: "K1", ordine: 1, descrizione: "Massetto", unita: "mq", prezzo_unitario: 0, quantita: 10, quantita_manuale: true, an_spese_perc: 15, an_utile_perc: 10 },
      { id: "V2", user_id: "U", computo_id: "C1", capitolo_id: "K1", ordine: 2, descrizione: "Pittura", unita: "mq", prezzo_unitario: 8.5, quantita: 40, quantita_manuale: true, an_spese_perc: null, an_utile_perc: null }
    ],
    gest_computo_misure: [],
    gest_analisi_righe: [
      { id: "A1", user_id: "U", voce_id: "V1", ordine: 1, tipo: "materiale", descrizione: "Sabbia e cemento", unita: "mq", quantita: 1, prezzo_unitario: 9.5, note: null },
      { id: "A2", user_id: "U", voce_id: "V1", ordine: 2, tipo: "manodopera", descrizione: "Operaio", unita: "ora", quantita: 0.5, prezzo_unitario: 28, note: null }
    ]
  };
  function from(nome) {
    let filtri = [], modo = "select", righeIns = null;
    const q = {
      select() { return q; }, order() { return q; },
      eq(c, v) { filtri.push(r => String(r[c]) === String(v)); return q; },
      in(c, vv) { filtri.push(r => vv.map(String).indexOf(String(r[c])) >= 0); return q; },
      insert(x) { modo = "insert"; righeIns = (Array.isArray(x) ? x : [x]).map(r => Object.assign({ id: id() }, r)); t[nome].push(...righeIns); return q; },
      delete() { modo = "delete"; return q; },
      single() { return Promise.resolve({ data: righeIns ? righeIns[0] : null, error: null }); },
      then(ok) {
        if (modo === "insert") return ok({ data: righeIns, error: null });
        if (modo === "delete") { t[nome] = t[nome].filter(r => !filtri.every(f => f(r))); return ok({ data: [], error: null }); }
        return ok({ data: t[nome].filter(r => filtri.every(f => f(r))), error: null });
      }
    };
    return q;
  }
  return { t, sb: { from, raw: from } };
}
/* il prezzo come lo fa la vista gest_analisi_totali */
function prezzo(t, voce) {
  const rr = t.gest_analisi_righe.filter(r => r.voce_id === voce.id);
  if (!rr.length) return +voce.prezzo_unitario || 0;
  const costi = rr.reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0);
  const sp = costi * (voce.an_spese_perc == null ? 15 : voce.an_spese_perc) / 100;
  const ut = (costi + sp) * (voce.an_utile_perc == null ? 10 : voce.an_utile_perc) / 100;
  return Math.round((costi + sp + ut) * 100) / 100;
}
async function prova(variante) {
  const { t, sb } = nuovoDb();
  const ctx = { sb, sbUid: "U", compCache: t.gest_computi.slice(), toast() {}, gconfirm: async () => true,
    curMestiere: () => "M", todayStr: () => "2026-11-13", renderComputi: async () => {}, rinfresca() {}, computoForm() {},
    _compManca: () => false, COMP_SQL_TESTO: "", console, Promise };
  vm.runInNewContext(codice + "\nthis.compDuplica=compDuplica;", ctx);
  await ctx.compDuplica("C1", variante);
  const nuovo = t.gest_computi.find(c => c.id !== "C1");
  const vociN = nuovo ? t.gest_computo_voci.filter(v => v.computo_id === nuovo.id) : [];
  const m = vociN.find(v => v.descrizione === "Massetto"), p = vociN.find(v => v.descrizione === "Pittura");
  const v1 = t.gest_computo_voci.find(v => v.id === "V1");
  const esiti = [
    ["la copia è nata", !!nuovo],
    ["2 lavorazioni copiate", vociN.length === 2],
    ["2 righe dell'analisi copiate sul Massetto", !!m && t.gest_analisi_righe.filter(r => r.voce_id === m.id).length === 2],
    ["nessuna riga dell'analisi sulla Pittura", !!p && t.gest_analisi_righe.filter(r => r.voce_id === p.id).length === 0],
    ["prezzo del Massetto uguale (" + prezzo(t, v1).toFixed(2) + " €), non 0,00", !!m && prezzo(t, m) === prezzo(t, v1) && prezzo(t, m) > 0],
    ["l'originale ha ancora le sue 2 righe", t.gest_analisi_righe.filter(r => r.voce_id === "V1").length === 2],
    [variante ? "la variante ricorda da dove viene" : "la copia non è una variante", variante ? (!!m && m.origine_id === "V1" && nuovo.variante_di === "C1") : (!!m && !("origine_id" in m))]
  ];
  let rossi = 0;
  console.log(variante ? "«Crea la variante»" : "«Duplica»");
  esiti.forEach(([n, ok]) => { if (!ok) rossi++; console.log((ok ? "  ✓ " : "  ✗ ") + n); });
  return rossi;
}
(async () => {
  const r = (await prova(false)) + (await prova(true));
  console.log(r ? "\n" + r + " ROSSI." : "\nZERO difetti.");
  process.exit(r ? 1 : 0);
})();
