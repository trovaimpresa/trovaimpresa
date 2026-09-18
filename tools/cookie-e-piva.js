/* =====================================================================
   COOKIE, PRIVACY, MAIL E PARTITA IVA SU TUTTE LE PAGINE — 18 set 2026

   Alex: «dobbiamo sempre mettere privacy cookie», «partita iva», «mail».

   ⚠️ IL PRIMO GIRO DELLO SCRIPT HA SCOPERTO LA COSA GROSSA.
   Su →2090← pagine:
     - il banner dei cookie manca su →96←  (non su meta' del sito: il
       campione da →12← pagine che avevo guardato a occhio era sbagliato)
     - la P.IVA si puo' attaccare alla mail su →130← pagine
     - ma →1937← pagine **non hanno la mail nel pie' di pagina**, perche' hanno
       un pie' di pagina RIDOTTO, di una riga sola:
           © 2026 TrovaImpresa — Home | Cerca imprese | Registra la tua impresa
       Niente privacy, niente cookie, niente mail, niente P.IVA.
       Sono le pagine mestiere+citta': cioe' quelle dove Google manda la gente.

   Quindi lo script fa tre lavori, non due.

   COSA FA, e solo questo:
     1. dove manca, aggiunge <script src="/cookie-banner.js"></script>
     2. dove c'e' gia' la mail nel pie' di pagina, aggiunge accanto la P.IVA
     3. dove il pie' di pagina e' quello ridotto, aggiunge una riga con
        privacy, cookie, termini, mail e P.IVA

   Non tocca nient'altro. Se una pagina ce l'ha gia', la salta.

   ⚠️ SI PUO' RILANCIARE SENZA DANNI: controlla sempre prima se c'e' gia'.

   COME SI USA
     node tools/cookie-e-piva.js          → dice solo cosa farebbe, non tocca
     node tools/cookie-e-piva.js --scrivi → fa le modifiche
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..');
const SCRIVI = process.argv.includes('--scrivi');

const PIVA = '01285950570';
const RIGA_BANNER = '<script src="/cookie-banner.js"></script>';

/* La riga legale per le pagine col pie' di pagina ridotto.
   ⚠️ I colori NON sono fissati: si eredita quello del pie' di pagina, cosi'
   la riga si vede sia dove lo sfondo e' chiaro sia dove e' scuro. */
const RIGA_LEGALE =
  '\n  <p style="font-size:13px;opacity:.85;line-height:1.7;margin:8px 0 0">\n' +
  '    <a href="/privacy-policy.html">Privacy</a> &middot;\n' +
  '    <a href="/cookie-policy.html">Cookie</a> &middot;\n' +
  '    <a href="/termini-condizioni.html">Termini</a><br>\n' +
  '    Alessio Pinto &mdash; Rieti (RI) &mdash;\n' +
  '    <a href="mailto:info@trovaimpresa.com">info@trovaimpresa.com</a> &mdash;\n' +
  '    P.IVA ' + PIVA + '\n' +
  '  </p>\n';


/* ⛔ 18 set 2026 — LE PAGINE SENZA NESSUN PIE' DI PAGINA.
   Sono ~20 e finiscono direttamente con gli <script>: bandi, il-posto,
   attiva-profilo, convenzioni, galleria-video...
   A queste non basta aggiungere una riga: il pie' di pagina non c'e' proprio,
   va costruito. Lo stile e' scritto dentro il tag apposta: cosi' non litiga
   col foglio di stile della pagina, che su ognuna e' diverso. */
const PIEDE_INTERO =
  '\n<footer style="margin-top:40px;padding:26px 20px;border-top:1px solid #e3e8ef;' +
  'background:#f7f9fa;color:#5f6c7b;font-size:14px;line-height:1.7;text-align:center;' +
  'font-family:\'Trebuchet MS\',system-ui,sans-serif">\n' +
  '  <p style="margin:0 0 6px">&copy; 2026 TrovaImpresa &mdash; ' +
  '<a href="/" style="color:#0066ff;text-decoration:none">Home</a> &middot; ' +
  '<a href="/cerca-imprese" style="color:#0066ff;text-decoration:none">Cerca imprese</a> &middot; ' +
  '<a href="/gestionale" style="color:#0066ff;text-decoration:none">Gestionale</a></p>\n' +
  '  <p style="margin:0">\n' +
  '    <a href="/privacy-policy.html" style="color:#0066ff;text-decoration:none">Privacy</a> &middot;\n' +
  '    <a href="/cookie-policy.html" style="color:#0066ff;text-decoration:none">Cookie</a> &middot;\n' +
  '    <a href="/termini-condizioni.html" style="color:#0066ff;text-decoration:none">Termini</a><br>\n' +
  '    Alessio Pinto &mdash; Rieti (RI) &mdash;\n' +
  '    <a href="mailto:info@trovaimpresa.com" style="color:#0066ff;text-decoration:none">info@trovaimpresa.com</a>' +
  ' &mdash; P.IVA ' + PIVA + '\n' +
  '  </p>\n</footer>\n';

/* ⛔ Queste NON si toccano: pagine dietro il login o roba di servizio. */
const NON_TOCCARE = [
  'gestionale-app.html', 'gestionale-operatore.html', 'gestionale-noleggio.html',
  'gestionale-negozio.html', 'gestionale-config.html', 'pannello-impresa.html',
  'pannello-artigiano.html', 'pannello-professionisti.html', 'pannello-candidato.html',
  'admin.html', 'admin-utilizzo.html', '404.html', 'problems-report.html'
];

function tuttiIFile(dir, trovati = []) {
  for (const nome of fs.readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '.git' || nome === 'backup' ||
        nome === 'prove-claude' || nome === 'Claude outputs' || nome === 'netlify') continue;
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) tuttiIFile(p, trovati);
    else if (nome.endsWith('.html') && !nome.startsWith('.bak')) trovati.push(p);
  }
  return trovati;
}

const file = tuttiIFile(RADICE);
let banner = 0, piva = 0, legale = 0, piedeNuovo = 0, saltati = 0;
const nonSoDove = [], quali = [];

for (const f of file) {
  const nome = path.basename(f);
  if (NON_TOCCARE.includes(nome)) { saltati++; continue; }

  let t = fs.readFileSync(f, 'utf8');
  const prima = t;

  /* --- 1. il banner dei cookie --- */
  if (!t.includes('cookie-banner.js') && /<\/body>/i.test(t)) {
    t = t.replace(/<\/body>/i, RIGA_BANNER + '\n</body>');
    banner++;
  }

  /* --- 2 e 3. la riga legale --- */
  if (!t.includes(PIVA)) {
    const mail = /<a[^>]*href="mailto:info@trovaimpresa\.com"[^>]*>[^<]*<\/a>/gi;
    const tutte = [...t.matchAll(mail)];

    if (tutte.length) {
      /* ha gia' la mail: basta attaccarci la P.IVA. Si prende l'ULTIMA,
         quella del pie' di pagina, non una eventuale nel mezzo del testo. */
      const ultima = tutte[tutte.length - 1];
      const dove = ultima.index + ultima[0].length;
      t = t.slice(0, dove) + '<br>P.IVA ' + PIVA + t.slice(dove);
      piva++;
    } else if (/<\/footer>/i.test(t)) {
      /* pie' di pagina ridotto: ci va la riga intera, prima di </footer> */
      t = t.replace(/<\/footer>/i, RIGA_LEGALE + '</footer>');
      legale++;
    } else if (/<\/body>/i.test(t)) {
      /* non ha nessun pie' di pagina: glielo si costruisce */
      t = t.replace(/<\/body>/i, PIEDE_INTERO + '</body>');
      piedeNuovo++;
      quali.push(nome);
    } else {
      /* niente <body>: sono i file di verifica di Google, si lasciano stare */
      nonSoDove.push(nome);
    }
  }

  if (t !== prima && SCRIVI) fs.writeFileSync(f, t, 'utf8');
}

console.log('');
console.log('Pagine guardate:            ' + file.length);
console.log('Saltate (dietro login):     ' + saltati);
console.log('');
console.log('1) Banner cookie da mettere:            ' + banner);
console.log('2) P.IVA da attaccare alla mail:        ' + piva);
console.log('3) Riga intera nel pie\' di pagina:      ' + legale);
console.log('   (privacy, cookie, termini, mail, P.IVA)');
console.log('4) Pie\' di pagina COSTRUITO da zero:    ' + piedeNuovo);
if (quali.length) console.log('   ' + quali.join(', '));
if (nonSoDove.length) {
  console.log('');
  console.log('⚠️ Senza pie\' di pagina, non so dove metterla (' + nonSoDove.length + '):');
  console.log('   ' + nonSoDove.slice(0, 12).join(', ') + (nonSoDove.length > 12 ? ' …' : ''));
}
console.log('');
console.log(SCRIVI ? '✅ SCRITTO. Apri una pagina nel browser, guarda in fondo, poi fai il push.'
                   : 'Non ho toccato niente. Per farlo davvero: node tools/cookie-e-piva.js --scrivi');
console.log('');
