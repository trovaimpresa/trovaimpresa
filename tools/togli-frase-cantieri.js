/* 26 set 2026 — via la frase «scritte da chi i cantieri li ha fatti» dalle
   pagine delle citta' e dei mestieri. Il sito non parla di Alessio (stessa
   scelta fatta in home con la frase dei 25 anni). Cambia SOLO queste due
   frasi, parola per parola; il resto della pagina resta uguale.
   genera-mestiere-citta.js scrive gia' la frase nuova nelle pagine future.
   Si puo' lanciare piu' volte: la seconda volta non trova piu' niente.
   Uso (Git Bash, nella cartella del sito):  node tools/togli-frase-cantieri.js */
const fs = require('fs');
const path = require('path');
const CARTELLA = path.join(__dirname, '..');
const CAMBI = [
  ['Queste sono le nostre guide prezzi, scritte da chi i cantieri li ha fatti: sono medie nazionali',
   'Queste sono le nostre guide prezzi, con i prezzi veri di cantiere: sono medie nazionali'],
  ['prese dalle nostre guide prezzi scritte da chi i cantieri li ha fatti davvero.',
   'prese dalle nostre guide, fatte con i prezzi veri di cantiere.']
];
let pagine = 0, rimaste = [];
for (const nome of fs.readdirSync(CARTELLA)) {
  if (!nome.endsWith('.html')) continue;
  const file = path.join(CARTELLA, nome);
  let s = fs.readFileSync(file, 'utf8'), prima = s;
  for (const [vecchia, nuova] of CAMBI) s = s.split(vecchia).join(nuova);
  if (s !== prima) { fs.writeFileSync(file, s, 'utf8'); pagine++; }
  if (s.includes('cantieri li ha fatti')) rimaste.push(nome);
}
console.log('Pagine cambiate: ' + pagine);
console.log('Pagine dove la frase c\'e\' ancora (scritta in altro modo): ' + rimaste.length);
rimaste.slice(0, 20).forEach(n => console.log('  ' + n));
console.log(rimaste.length ? 'Mandami i nomi qui sopra.' : 'Fatto, nessun errore.');
