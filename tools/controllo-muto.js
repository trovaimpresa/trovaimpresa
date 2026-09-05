#!/usr/bin/env node
/* =====================================================================
   IL CONTROLLO MUTO                             5 settembre 2026
   =====================================================================
   Cerca le chiamate al database e al magazzino che NON LEGGONO LA
   RISPOSTA. Non aggiusta niente: fa l'elenco.

   Perche' esiste. In due giorni lo stesso difetto e' saltato fuori →3←
   volte:
     · 4 set — gli allegati del preventivo non arrivavano: l'upload
       falliva e la schermata restava uguale
     · 5 set — nei Cantieri non e' MAI arrivato niente: →3← magazzini
       senza permessi, e il codice non leggeva la risposta
     · 5 set — il `remove()` dei cantieri cancellava a vuoto
   Sempre la stessa forma: **fallisce e non lo dice a nessuno.**

   ⛔ LA COSA CHE INGANNA: la libreria di Supabase **non lancia
   eccezioni** sugli errori di permesso. Restituisce `{ data, error }`.
   Quindi un `try { ... } catch (e) { }` intorno **non prende niente**:
   sembra prudenza, e' un cerotto su una ferita che non c'e'. L'errore
   vero passa di sotto, zitto. Questo controllo lo segnala a parte.

   Uso:
     node tools/controllo-muto.js            elenco completo
     node tools/controllo-muto.js --corti    solo il conto per file
     node tools/controllo-muto.js --solo pannello-artigiano.html
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const RADI = path.resolve(__dirname, '..');

/* Le chiamate che possono fallire in silenzio. */
const AZIONI = ['upload', 'remove', 'insert', 'update', 'upsert', 'delete',
                'createSignedUrl', 'createSignedUrls', 'move', 'copy'];

/* Perche' si capisca che e' una chiamata a Supabase e non un `.remove()`
   di un pezzo di pagina, un `.delete()` di una mappa o un
   `window.storage.delete()` del magazzino del browser.

   ⛔ 5 set: bastava che la catena contenesse `.storage` e
   `window.storage.delete("gfoto_"+id)` finiva nell'elenco. Non e'
   Supabase: e' il magazzino dentro al browser. Adesso il nome davanti
   deve essere uno dei client VERI, oppure ci vuole `.storage.from(`.

   ⚠️ I nomi qui sotto sono quelli usati davvero nel sito (contati:
   `sb` 3923, `supabaseClient` 61, `sc` 26, `supabase` 15,
   `supabaseAdmin` 2). Chi ne aggiunge uno nuovo lo aggiunge anche qui,
   se no le sue chiamate non le guarda nessuno. */
const CLIENT = /\b(?:sb|sc|supabase|supabaseClient|supabaseAdmin|_sb)\s*\./;
const SEGNI_STORAGE = /\.storage\s*\.\s*from\s*\(/;
function eSupabase(catena) { return CLIENT.test(catena) || SEGNI_STORAGE.test(catena); }

/* ------------------------------------------------------------------ */
/* Togliere i commenti, se no si contano righe spiegate e non scritte. */
/* ------------------------------------------------------------------ */
function senzaCommenti(t) {
  let f = t.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  f = f.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  f = f.split('\n').map(r => {
    const i = r.indexOf('//');
    if (i === -1) return r;
    // non tagliare dentro un indirizzo (https://) o dentro una stringa
    const prima = r.slice(0, i);
    if (/[:'"`]$/.test(prima.trim().slice(-1)) || /https?:$/.test(prima)) return r;
    const virg = (prima.match(/'/g) || []).length + (prima.match(/"/g) || []).length;
    if (virg % 2 === 1) return r;
    return prima + ' '.repeat(r.length - prima.length);
  }).join('\n');
  return f;
}

/* ------------------------------------------------------------------ */
/* DOVE COMINCIA LA CATENA.                                             */
/* Prima cercavo l'inizio dell'istruzione andando indietro fino a `;`,  */
/* `{` o `}`. Sbagliato: in `const {error:e}=await sb...` la graffa     */
/* chiusa della destrutturazione veniva presa per un fine-istruzione,   */
/* e la lettura dell'errore spariva dalla vista. →6← falsi allarmi in   */
/* una pagina sola. Adesso torno indietro seguendo la CATENA vera —     */
/* nomi, punti, parentesi e virgolette in coppia — e mi fermo dove la   */
/* catena finisce davvero.                                              */
/* ------------------------------------------------------------------ */
function inizioCatena(t, pos) {
  let k = pos - 1;
  while (k >= 0) {
    const c = t[k];
    if (/[A-Za-z0-9_$.]/.test(c)) { k--; continue; }
    if (/\s/.test(c)) {
      // uno spazio fa parte della catena solo se sta INTORNO A UN PUNTO
      // (`sb .from(...)`). Fra due parole no: `return await sb.from(...)`
      // finiva per farmi inghiottire anche `return` e `await`, e la riga
      // sembrava buttata via mentre invece la risposta la guarda chi chiama.
      let j = k; while (j >= 0 && /\s/.test(t[j])) j--;
      const dietro = j >= 0 ? t[j] : '';
      const davanti = t[k + 1] || '';
      if (dietro === '.' || davanti === '.') { k = j; continue; }
      break;
    }
    if (c === ')' || c === ']') {                 // salto il pezzo in coppia
      const apre = c === ')' ? '(' : '[';
      let liv = 0;
      while (k >= 0) {
        if (t[k] === c) liv++;
        else if (t[k] === apre) { liv--; if (liv === 0) { k--; break; } }
        else if (t[k] === "'" || t[k] === '"' || t[k] === '`') {
          const q = t[k--]; while (k >= 0 && t[k] !== q) k--;
        }
        k--;
      }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; k--; while (k >= 0 && t[k] !== q) k--; k--; continue;
    }
    break;
  }
  return k + 1;
}

/* Quello che sta scritto SUBITO PRIMA della catena, ripulito. */
function primaDellaCatena(t, inizio) {
  let s = t.slice(Math.max(0, inizio - 400), inizio);
  s = s.replace(/\s+$/, '').replace(/\bawait$/, '').replace(/\s+$/, '');
  return s;
}

/* ------------------------------------------------------------------ */
/* IL GIUDIZIO su una chiamata sola.                                    */
/* ------------------------------------------------------------------ */
function giudica(t, pos, fineChiamata) {
  const inizio = inizioCatena(t, pos);
  const prima = primaDellaCatena(t, inizio);
  const dopo = t.slice(fineChiamata, fineChiamata + 900);

  // A) e' il valore di ritorno: la risposta la guarda chi chiama
  if (/\breturn$/.test(prima)) return { esito: 'ritorna', nota: '' };

  // B) assegnata a qualcosa?
  if (/=$/.test(prima) && !/[=!<>]=$/.test(prima)) {
    const sinistra = prima.slice(0, -1).replace(/\s+$/, '');

    // B1) destrutturata: `const { data, error } =`  oppure `{ error: upErr } =`
    if (/\}$/.test(sinistra)) {
      let liv = 0, k = sinistra.length - 1;
      for (; k >= 0; k--) {
        if (sinistra[k] === '}') liv++;
        else if (sinistra[k] === '{') { liv--; if (liv === 0) break; }
      }
      const dentro = sinistra.slice(k, sinistra.length);
      if (/\berror\b/.test(dentro)) return { esito: 'legge', nota: '' };
      return { esito: 'mezzo', nota: 'prende i dati ma non `error`: se fallisce i dati sono vuoti e nessuno lo sa' };
    }

    // B2) finita in una variabile: poi qualcuno guarda il suo `.error`?
    const mv = sinistra.match(/([\w$]+)$/);
    if (mv) {
      const v = mv[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp('\\b' + v + '\\s*(?:\\?)?\\s*\\.\\s*error\\b').test(dopo)
       || new RegExp('\\b' + v + '\\s*&&\\s*' + v + '\\b').test(dopo)) {
        return { esito: 'legge', nota: '' };
      }
      return { esito: 'mezzo', nota: 'la risposta finisce in `' + mv[1] + '` e nessuno guarda `' + mv[1] + '.error`' };
    }
  }

  // C) `.then(...)`: c'e' il pezzo che raccoglie l'errore?
  if (/^\s*\.then\s*\(/.test(dopo)) {
    if (/^\s*\.then\s*\([\s\S]{0,300}?,\s*(?:function|\(|[\w$]+\s*=>)/.test(dopo)
     || /\.catch\s*\(/.test(dopo.slice(0, 500))) return { esito: 'legge', nota: '' };
    return { esito: 'mezzo', nota: '`.then()` senza il pezzo che raccoglie l\'errore' };
  }

  // D) passata dentro a qualcos'altro (Promise.all, un argomento…)
  if (/[([,:?]$/.test(prima)) return { esito: 'dentro', nota: 'passata dentro a un\'altra chiamata: guardare a mano' };

  return { esito: 'muto', nota: 'la risposta si butta via: se fallisce non se ne accorge nessuno' };
}

/* Il `try` che non serve: la libreria non lancia, quindi non prende niente. */
function dentroUnTry(t, pos) {
  const finestra = t.slice(Math.max(0, pos - 400), pos);
  return /\btry\s*\{/.test(finestra) && !/\}\s*catch/.test(finestra.slice(finestra.lastIndexOf('try')));
}

/* ------------------------------------------------------------------ */
function guarda(testo, nomeFile) {
  const t = senzaCommenti(testo);
  const fuori = [];

  for (const azione of AZIONI) {
    const re = new RegExp('\\.' + azione + '\\s*\\(', 'g');
    let m;
    while ((m = re.exec(t)) !== null) {
      const pos = m.index;
      const catena = t.slice(Math.max(0, inizioCatena(t, pos) - 60), pos);
      if (!eSupabase(catena)) continue;               // non e' Supabase

      // fine della chiamata: chiudo le parentesi
      let liv = 0, fine = pos + m[0].length - 1;
      for (let k = fine; k < t.length && k < fine + 4000; k++) {
        if (t[k] === '(') liv++;
        else if (t[k] === ')') { liv--; if (liv === 0) { fine = k + 1; break; } }
      }

      const g = giudica(t, pos, fine);
      if (g.esito === 'legge') continue;

      fuori.push({
        file: nomeFile,
        riga: t.slice(0, pos).split('\n').length,
        azione,
        esito: g.esito,
        nota: g.nota,
        tryInutile: (g.esito === 'muto' || g.esito === 'mezzo') && dentroUnTry(t, pos),
        codice: testo.split('\n')[t.slice(0, pos).split('\n').length - 1].trim().slice(0, 110)
      });
    }
  }
  return fuori;
}

/* ------------------------------------------------------------------ */
function tuttiIFile() {
  const salta = new Set(['node_modules', '.git', 'backup', '_to_delete', 'prove-claude',
                         'www', 'android', 'docs', '__pycache__', 'Nuova cartella', 'dist']);
  const fuori = [];
  (function gira(dir, rel) {
    let voci = [];
    try { voci = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const v of voci) {
      if (v.name.startsWith('.')) continue;
      const r = rel ? rel + '/' + v.name : v.name;
      if (v.isDirectory()) { if (!salta.has(v.name)) gira(path.join(dir, v.name), r); }
      else if (/\.(html|js)$/.test(v.name)) fuori.push(r);
    }
  })(RADI, '');
  return fuori;
}

/* ------------------------------------------------------------------ */
if (require.main === module) {
  const corti = process.argv.includes('--corti');
  const iSolo = process.argv.indexOf('--solo');
  const solo = iSolo > -1 ? process.argv[iSolo + 1] : null;

  let tutti = [];
  for (const f of tuttiIFile()) {
    if (solo && f !== solo) continue;
    let testo; try { testo = fs.readFileSync(path.join(RADI, f), 'utf8'); } catch (e) { continue; }
    tutti = tutti.concat(guarda(testo, f));
  }

  const muti = tutti.filter(x => x.esito === 'muto');
  const mezzi = tutti.filter(x => x.esito === 'mezzo');
  const daGuardare = tutti.filter(x => x.esito === 'dentro');
  const tryInutili = tutti.filter(x => x.tryInutile);

  console.log('\n' + '='.repeat(70));
  console.log('IL CONTROLLO MUTO — chi non legge la risposta');
  console.log('='.repeat(70));

  if (corti) {
    const perFile = {};
    for (const x of muti.concat(mezzi)) perFile[x.file] = (perFile[x.file] || 0) + 1;
    const righe = Object.entries(perFile).sort((a, b) => b[1] - a[1]);
    for (const [f, n] of righe) console.log('  ' + String(n).padStart(3) + '  ' + f);
  } else {
    const stampa = (titolo, lista, spiega) => {
      if (!lista.length) return;
      console.log('\n' + titolo + '  (' + lista.length + ')');
      console.log(spiega);
      let ultimo = '';
      for (const x of lista) {
        if (x.file !== ultimo) { console.log('\n  ' + x.file); ultimo = x.file; }
        console.log('    riga ' + String(x.riga).padEnd(6) + '.' + x.azione + '()'
                    + (x.tryInutile ? '   [il try qui non serve]' : ''));
        if (x.nota) console.log('           ' + x.nota);
        console.log('           ' + x.codice);
      }
    };
    stampa('⛔ MUTE — la risposta si butta via', muti,
      '   Se falliscono, sullo schermo non cambia niente e nessuno lo sa.');
    stampa('⚠️ MEZZE MUTE — la risposta c\'e\' ma nessuno guarda l\'errore', mezzi,
      '   Prendono i dati; se la chiamata fallisce i dati sono vuoti e passa liscia.');
    stampa('👀 DA GUARDARE A MANO — passate dentro a qualcos\'altro', daGuardare,
      '   Non so dire se qualcuno legge l\'errore: vanno lette.');
  }

  console.log('\n' + '='.repeat(70));
  console.log('  mute: ' + muti.length + '   mezze mute: ' + mezzi.length
              + '   da guardare: ' + daGuardare.length);
  if (tryInutili.length) {
    console.log('  ⚠️ ' + tryInutili.length + ' stanno dentro un try/catch che NON le protegge:');
    console.log('     la libreria di Supabase non lancia eccezioni sugli errori di');
    console.log('     permesso, restituisce { data, error }. Il try non prende niente.');
  }
  console.log('='.repeat(70) + '\n');
  console.log('Questo controllo NON ferma la pubblicazione: fa l\'elenco e basta.');
  console.log('Si aggiusta una alla volta, cominciando da quelle che vede il cliente.\n');
}

module.exports = { guarda, senzaCommenti };
