#!/usr/bin/env node
/* =====================================================================
   CERCA LA CODA BUONA NELLA STORIA DI GIT        5 settembre 2026
   =====================================================================
   →6← pagine finiscono a meta' tag (`...Contatti</a></foo`), senza
   `</footer></body></html>`. Oggi funzionano lo stesso perche' il
   browser chiude i tag da solo, ma un file tagliato e' una bomba a
   orologeria: il giorno che qualcuno ci aggiunge uno <script> in fondo,
   la pagina muore come e' morta gestionale-config.html.

   Prima di rimetterci la coda bisogna sapere COSA C'ERA. Questo
   attrezzo guarda nella storia di Git e cerca, per ogni pagina,
   l'ultima versione che finiva davvero con </html>.

   ⛔ USA SOLO COMANDI GIT CHE LEGGONO (`git log`, `git show`).
   Non tocca l'indice, non scrive niente dentro .git, non puo' creare
   nessun `index.lock`. Non fa `git status`, non fa `git add`.

   Scrive il resoconto in  prove-claude/coda-trovata.txt

   Uso:   node tools/cerca-coda-buona.js
   ===================================================================== */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RADI = path.resolve(__dirname, '..');
const FUORI = path.join(RADI, 'prove-claude', 'coda-trovata.txt');

const PAGINE = [
  'registrazione-artigiano.html',
  'registrazione-impresa.html',
  'registrazione-negozio.html',
  'registrazione-professionista.html',
  'registrazione-candidato.html',
  'demo-arcade.html'
];

const righe = [];
function di(s) { console.log(s); righe.push(s); }

function git(args) {
  return execFileSync('git', args, {
    cwd: RADI, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  });
}

di('CODA BUONA — cercata nella storia di Git il ' + new Date().toLocaleString('it-IT'));
di('='.repeat(70));

for (const p of PAGINE) {
  di('');
  di('### ' + p);

  let ora = '';
  try { ora = fs.readFileSync(path.join(RADI, p), 'utf8'); }
  catch (e) { di('   il file non c\'e\' piu\' sul disco — salto'); continue; }

  const finisceBene = /<\/html\s*>\s*$/i.test(ora);
  di('   adesso: ' + ora.length + ' byte, finisce con </html>? ' + (finisceBene ? 'SI' : 'NO'));
  if (finisceBene) { di('   → questa pagina e\' gia\' a posto, non serve cercare'); continue; }

  // la coda che c'e' adesso, per capire dove e' stato dato il taglio
  const codaOra = ora.slice(-40).replace(/\n/g, '\\n');
  di('   il taglio cade qui: ...' + codaOra);

  let sha = [];
  try { sha = git(['log', '--format=%H %ad', '--date=short', '--', p]).trim().split('\n').filter(Boolean); }
  catch (e) { di('   ⛔ git log non ha risposto: ' + e.message); continue; }

  if (!sha.length) { di('   nessuna versione in Git per questo file'); continue; }
  di('   versioni in Git: ' + sha.length);

  let trovata = null;
  let guardate = 0;
  for (const riga of sha) {
    const [h, data] = riga.split(' ');
    guardate++;
    let t;
    try { t = git(['show', h + ':' + p]); } catch (e) { continue; }
    if (/<\/html\s*>\s*$/i.test(t)) { trovata = { h, data, t }; break; }
  }

  if (!trovata) {
    di('   ⛔ NESSUNA delle ' + guardate + ' versioni finisce con </html>.');
    di('      Vuol dire che il file e\' nato gia\' tagliato: non c\'e\' niente');
    di('      da recuperare, la coda va scritta a mano.');
    continue;
  }

  di('   ✅ ultima versione INTERA: ' + trovata.h.slice(0, 7) + '  del ' + trovata.data
     + '  (' + trovata.t.length + ' byte, ' + (guardate - 1) + ' versioni tagliate dopo)');

  // che cosa c'e' in piu' rispetto a oggi: il pezzo dopo il punto del taglio
  const punto = ora.length;
  const inPiu = trovata.t.length > punto && trovata.t.slice(0, punto) === ora
    ? trovata.t.slice(punto)
    : null;

  if (inPiu !== null) {
    di('   la parte tagliata e\' esattamente questa (' + inPiu.length + ' caratteri):');
    di('   ┌' + '─'.repeat(66));
    for (const r of inPiu.split('\n')) di('   │ ' + r);
    di('   └' + '─'.repeat(66));
  } else {
    di('   ⚠️ la versione vecchia NON e\' il file di oggi piu\' una coda:');
    di('      in mezzo e\' cambiato dell\'altro. Ecco solo la sua fine:');
    const c = trovata.t.slice(-600);
    di('   ┌' + '─'.repeat(66));
    for (const r of c.split('\n')) di('   │ ' + r);
    di('   └' + '─'.repeat(66));
  }
}

di('');
di('='.repeat(70));
di('Fine. Questo resoconto e\' anche in  prove-claude/coda-trovata.txt');

try {
  fs.mkdirSync(path.dirname(FUORI), { recursive: true });
  fs.writeFileSync(FUORI, righe.join('\n') + '\n', 'utf8');
} catch (e) {
  console.log('\n⚠️ non sono riuscito a scrivere il resoconto: ' + e.message);
}
