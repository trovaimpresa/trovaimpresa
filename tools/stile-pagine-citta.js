/* 26 set 2026 — mette la grafica nuova nelle pagine delle citta'.
   Aggiunge a ogni pagina, UNA volta sola:
     <link rel="stylesheet" href="/css/pagine-citta.css?v=1">   (prima di </head>)
     <script src="/js/pagine-citta.js?v=1" defer></script>     (prima di </body>)
   Pagine toccate:
     - imprese-<citta>.html                    (le →106← «Imprese a Roma»)
     - le pagine mestiere + citta'             (le →1.802← «Muratore a Roma»),
       riconosciute da due segni che hanno solo loro: il riquadro
       «hero-iscriviti» e /js/conta-clic-guide.js
   Non tocca nient'altro: testi, link, titoli e dati per Google restano uguali.
   Si puo' lanciare quante volte si vuole: una pagina che ha gia' le righe
   viene saltata.
   Uso (da Git Bash, nella cartella del sito):  node tools/stile-pagine-citta.js */
const fs = require('fs');
const path = require('path');

const CARTELLA = path.join(__dirname, '..');
const LINK = '<link rel="stylesheet" href="/css/pagine-citta.css?v=1">';
const SCRIPT = '<script src="/js/pagine-citta.js?v=1" defer></script>';

let citta = 0, mestieri = 0, gia = 0, saltate = 0;
for (const nome of fs.readdirSync(CARTELLA)) {
  if (!nome.endsWith('.html')) continue;
  const file = path.join(CARTELLA, nome);
  let s = fs.readFileSync(file, 'utf8');
  const eCitta = /^imprese-[\p{Ll}\p{M}0-9-]+\.html$/u.test(nome);   // anche le lettere accentate: imprese-forlì.html
  const eMestiere = !eCitta && s.includes('class="hero-iscriviti"') && s.includes('/js/conta-clic-guide.js');
  if (!eCitta && !eMestiere) continue;
  if (s.includes('/css/pagine-citta.css')) { gia++; continue; }
  if (s.split('</head>').length !== 2 || s.split('</body>').length !== 2) { saltate++; console.log('  saltata (forma strana): ' + nome); continue; }
  s = s.replace('</head>', LINK + '\n</head>').replace('</body>', SCRIPT + '\n</body>');
  fs.writeFileSync(file, s, 'utf8');
  if (eCitta) citta++; else mestieri++;
}
console.log('Pagine citta\' aggiornate:          ' + citta);
console.log('Pagine mestiere+citta\' aggiornate: ' + mestieri);
console.log('Gia\' a posto:                      ' + gia);
console.log('Saltate:                           ' + saltate);
console.log(saltate ? 'Controlla le pagine saltate qui sopra.' : 'Fatto, nessun errore.');
