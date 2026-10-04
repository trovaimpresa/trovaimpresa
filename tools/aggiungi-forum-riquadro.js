/* 4 ott 2026 — il riquadro «Chiedi alle imprese nel forum» nelle pagine
   mestiere + citta' (muratore-roma, geometra-sassari…).
   Mette il riquadro subito prima di «Altri mestieri a <citta'>», dentro le
   pagine che esistono gia', senza rigenerarle (non serve il database).
   genera-mestiere-citta.js scrive gia' lo stesso riquadro nelle pagine future.
   Si puo' lanciare piu' volte: dove il riquadro c'e' gia' non lo rimette.
   Uso (Git Bash, nella cartella del sito):  node tools/aggiungi-forum-riquadro.js */
const fs = require('fs');
const path = require('path');
const CARTELLA = path.join(__dirname, '..');

const MARCA = '<!-- forum-riquadro -->';
const PUNTO = '<div class="section" id="altri-mestieri"';

function riquadro(citta) {
  return MARCA + '\n' +
'  <div id="forum-riquadro" style="margin:0 0 32px;padding:22px 22px 24px;border-radius:16px;background:#fff4ec;border:2px solid #e8733a;">\n' +
'    <div style="font-size:.8rem;font-weight:800;letter-spacing:.06em;color:#b8470f;text-transform:uppercase;margin-bottom:6px;">Forum Edilizia</div>\n' +
'    <h2 style="margin:0 0 8px;font-size:1.5rem;color:#12233a;font-family:inherit;">Hai un lavoro da fare a ' + citta + '? Chiedi alle imprese</h2>\n' +
'    <p style="margin:0 0 16px;line-height:1.55;color:#33465c;">Scrivi cosa ti serve e, se vuoi, aggiungi una foto. Le imprese iscritte ti rispondono nei commenti. È gratis e non devi registrarti: ti basta confermare l\'email.</p>\n' +
'    <a href="/forum#scrivi" style="display:inline-block;background:#e8733a;color:#fff;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:30px;">Scrivi nel Forum Edilizia →</a>\n' +
'  </div>\n\n  ';
}

let cambiate = 0, giaPresenti = 0, senzaPunto = [];
for (const nome of fs.readdirSync(CARTELLA)) {
  if (!nome.endsWith('.html')) continue;
  const file = path.join(CARTELLA, nome);
  const s = fs.readFileSync(file, 'utf8');
  /* solo le pagine mestiere+citta': hanno tutte questi due blocchi */
  if (!s.includes('id="altri-mestieri"') || !s.includes('id="stesso-mestiere-altrove"')) continue;
  if (s.includes(MARCA)) { giaPresenti++; continue; }
  const i = s.indexOf(PUNTO);
  const m = s.match(/<h2>Altri (?:mestieri|professionisti) a ([^<]+)<\/h2>/);
  if (i < 0 || !m) { senzaPunto.push(nome); continue; }
  fs.writeFileSync(file, s.slice(0, i) + riquadro(m[1]) + s.slice(i), 'utf8');
  cambiate++;
}
console.log('Pagine con il riquadro nuovo: ' + cambiate);
console.log('Pagine che lo avevano gia\': ' + giaPresenti);
console.log('Pagine dove non ho trovato il punto giusto: ' + senzaPunto.length);
senzaPunto.slice(0, 20).forEach(n => console.log('  ' + n));
console.log(senzaPunto.length ? 'Mandami i nomi qui sopra.' : 'Fatto, nessun errore.');
