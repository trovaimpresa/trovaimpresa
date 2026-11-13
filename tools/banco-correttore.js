/* 13 nov 2026 — BANCO DEL CORRETTORE (js/correggi-giornata.js, la guardia
   «fedele»). Gira senza browser e senza rete: node tools/banco-correttore.js
   Prova che una correzione buona passa e che una che tocca un nome, una
   maiuscola o toglie una parola viene buttata. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "..", "js", "correggi-giornata.js"), "utf8");
const finto = { addEventListener() {}, head: { appendChild() {} }, body: {}, createElement: () => ({}) };
const win = {};
vm.runInNewContext(src, { window: win, document: finto, MutationObserver: function () { this.observe = () => {}; }, setTimeout, Promise, console });
const f = win._cgFedele;
const casi = [
  // [prima, dopo, deve passare?]
  ["o finito il masetto in cucina", "Ho finito il massetto in cucina.", true],
  ["messo tre sacchi di pre miscelato e venti metri di tubo", "Messo 3 sacchi di premiscelato e 20 m di tubo.", true],
  ["montato il carton gesso con Wahid a Campoloniano", "Montato il cartongesso con Wahid a Campoloniano.", true],
  ["fatto otto ore, spesi 45 euro di sabbia", "Fatto 8 ore, spesi 45 € di sabbia.", true],
  ["PROVA CONTROLLORE Preventivo", "Preventivo controllore prova.", false],
  ["PROVA CONTROLLORE lavoro finito e pulito tutto il cantiere", "Lavoro finito e pulito il cantiere.", false],
  ["rifatto il bagno col Mapei Keraflex", "Rifatto il bagno col mapei keraflex.", false],
  ["posato gres xyzzyk in sala", "Posato gres in sala.", false],
  ["cambiato 12 tegole", "Cambiato 21 tegole.", false],
  ["sentito Luis per il ponteggio", "Sentito Luigi per il ponteggio.", false],
  ["Oggi demolito il tramezzo. Domani si porta via.", "Oggi demolito il tramezzo. Domani si porta via.", true],
];
let rossi = 0;
casi.forEach(([a, b, atteso]) => {
  const r = f(a, b), ok = r === atteso;
  if (!ok) rossi++;
  console.log((ok ? "  ✓ " : "  ✗ ") + (atteso ? "passa:  " : "buttata: ") + "«" + a + "» → «" + b + "»");
});
/* il titolo del lavoro non deve essere fra le caselle corrette */
const titoloFuori = !/['"]j-desc['"]\s*[,\]]/.test(src.replace(/\/\*[\s\S]*?\*\//g, ""));
console.log((titoloFuori ? "  ✓ " : "  ✗ ") + "il titolo del lavoro (j-desc) non passa dal correttore");
if (!titoloFuori) rossi++;
console.log(rossi ? "\n" + rossi + " ROSSI." : "\nZERO difetti.");
process.exit(rossi ? 1 : 0);
