/* tools/genera-comuni-capoluogo.js — 4 nov 2026
 * Scrive netlify/functions/lib/comuni-capoluogo.json: per ogni comune d'Italia
 * (js/geo-italia.js) il capoluogo che ha la pagina citta' (le 106 di
 * genera-mestiere-citta.js). Lo usa netlify/functions/dove-sei.js per dire
 * «Sei a Rieti?» a chi entra la prima volta.
 * Rilanciarlo solo se cambia l'elenco delle citta' o dei comuni:
 *   node tools/genera-comuni-capoluogo.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(R, 'genera-mestiere-citta.js'), 'utf8');
const blocco = src.slice(src.indexOf('const CITTA = ['), src.indexOf('];', src.indexOf('const CITTA = [')) + 2);
const CITTA = vm.runInNewContext(blocco.replace('const CITTA =', '(') .replace(/\];$/, '])'));
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(R, 'js', 'geo-italia.js'), 'utf8'), ctx);
const G = ctx.window.GEO_ITALIA || {};
const ALIAS = { 'Reggio Emilia': "Reggio nell'Emilia", 'Verbania': 'Verbano-Cusio-Ossola' };
const chiave = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const mappa = {};
let senza = [];
for (const c of CITTA) {
  const reg = G[c.regione] || {};
  let prov = ALIAS[c.nome] && reg[ALIAS[c.nome]] ? ALIAS[c.nome] : (reg[c.nome] ? c.nome :
    Object.keys(reg).find(p => p.toLowerCase().startsWith(c.nome.toLowerCase())));
  mappa[chiave(c.nome)] = c.nome;
  if (!prov) { senza.push(c.nome); continue; }
  for (const com of reg[prov]) { const k = chiave(com); if (!mappa[k]) mappa[k] = c.nome; }
}
// i nomi che i servizi di posizione scrivono in inglese
const INGLESE = { rome: 'Roma', milan: 'Milano', naples: 'Napoli', turin: 'Torino', florence: 'Firenze',
  venice: 'Venezia', genoa: 'Genova', padua: 'Padova', mantua: 'Mantova', syracuse: 'Siracusa',
  leghorn: 'Livorno', bolzanobozen: 'Bolzano', bozen: 'Bolzano' };
for (const k in INGLESE) if (!mappa[k]) mappa[k] = INGLESE[k];
fs.writeFileSync(path.join(R, 'netlify', 'functions', 'lib', 'comuni-capoluogo.json'), JSON.stringify(mappa));
console.log('Comuni:', Object.keys(mappa).length, '· citta:', CITTA.length, '· senza provincia trovata:', senza.join(', ') || 'nessuna');
