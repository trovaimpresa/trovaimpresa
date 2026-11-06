#!/usr/bin/env node
/* =====================================================================
   IL CAMPANELLO AUTOMATICO PER BING — PARTE 1: LA LISTA (6 nov 2026)

   Alex: «fai IndexNow». Il campanello c'era gia' (tools/indexnow.js,
   19 set 2026) ma andava suonato a mano dal suo computer, e quindi non
   lo suonava nessuno. Adesso si suona da solo a ogni pubblicazione.

   Due pezzi:
     1. QUESTO FILE gira durante il build di Netlify (netlify.toml,
        riga `command`). Guarda cosa e' cambiato fra la pubblicazione
        di prima e questa, e scrive la lista degli indirizzi da segnalare
        in  tools/.indexnow-lista.json
     2. netlify/functions/deploy-succeeded.js parte da sola quando la
        pubblicazione e' ONLINE, legge la lista e la manda a Bing.
        Si aspetta che sia online apposta: se Bing arrivasse prima,
        troverebbe la pagina vecchia (o nessuna pagina).

   Cosa finisce nella lista:
     - le pagine .html della radice che sono cambiate, nate o sparite,
       MA SOLO SE stanno in una sitemap (cosi' restano fuori admin,
       pannelli, gestionali, pagine noindex e quelle con un rinvio 301)
     - gli indirizzi che sono COMPARSI o SPARITI dentro una sitemap
       (per esempio una scheda impresa nuova in sitemap-imprese.xml)

   ⛔ QUESTO FILE NON PUO' MAI FERMARE UNA PUBBLICAZIONE. Qualunque cosa
      vada storta, scrive una lista vuota ed esce con 0. In netlify.toml
      ha anche un `|| true` dietro, come seconda cintura.

   Per provarlo sul computer, dalla cartella del progetto:
       CACHED_COMMIT_REF=HEAD~3 COMMIT_REF=HEAD node tools/indexnow-lista.js
   ===================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITO = 'https://trovaimpresa.com';
const RADICE = path.join(__dirname, '..');
const USCITA = path.join(__dirname, '.indexnow-lista.json');
/* IndexNow accetta fino a 10.000 indirizzi al giorno per sito. */
const TETTO = 10000;

function scrivi(lista, nota) {
  try {
    fs.writeFileSync(USCITA, JSON.stringify({ creata: new Date().toISOString(), nota, urlList: lista }, null, 1));
  } catch (e) { /* niente: non deve mai fermare il build */ }
  console.log('[indexnow] ' + nota + ' — indirizzi in lista: ' + lista.length);
}

function git(cmd) {
  return execSync('git ' + cmd, { cwd: RADICE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
}

function locs(xml) {
  return [...String(xml || '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
}

/* pagina.html → indirizzo pulito, come sta nelle sitemap */
function indirizzo(file) {
  const nome = file.replace(/\.html$/, '');
  return nome === 'index' ? SITO + '/' : SITO + '/' + nome;
}

try {
  const prima = process.env.CACHED_COMMIT_REF;
  const ora = process.env.COMMIT_REF || 'HEAD';

  if (!prima || prima === ora) {
    scrivi([], 'nessuna pubblicazione precedente da confrontare');
    process.exit(0);
  }

  /* 1. tutti gli indirizzi che oggi stanno in una sitemap della cartella */
  const mappe = fs.readdirSync(RADICE).filter(f => /^sitemap.*\.xml$/.test(f));
  const inSitemap = new Set();
  for (const m of mappe) locs(fs.readFileSync(path.join(RADICE, m), 'utf8')).forEach(u => inSitemap.add(u));

  /* 2. cosa e' cambiato fra prima e ora (nomi con l'accento compresi: -z) */
  const righe = git('diff --name-status -z ' + prima + ' ' + ora).split('\0').filter(Boolean);
  const cambiati = [];
  for (let i = 0; i < righe.length; i++) {
    const stato = righe[i];
    if (stato.startsWith('R') || stato.startsWith('C')) {        // rinomina: vecchio e nuovo
      cambiati.push({ stato: 'D', file: righe[i + 1] });
      cambiati.push({ stato: 'A', file: righe[i + 2] });
      i += 2;
    } else {
      cambiati.push({ stato: stato[0], file: righe[i + 1] });
      i += 1;
    }
  }

  /* gli indirizzi che stavano nelle sitemap della pubblicazione di prima
     (si leggono solo se serve, cioe' se e' sparita qualche pagina) */
  let _prima = null;
  function eraInSitemap() {
    if (_prima) return _prima;
    _prima = new Set();
    let nomi = [];
    try { nomi = git('ls-tree --name-only ' + prima).split('\n').filter(f => /^sitemap.*\.xml$/.test(f)); } catch (e) {}
    for (const m of nomi) { try { locs(git('show ' + prima + ':' + m)).forEach(u => _prima.add(u)); } catch (e) {} }
    return _prima;
  }

  const lista = new Set();

  for (const { stato, file } of cambiati) {
    if (!file) continue;

    /* pagine della radice (non quelle dentro docs/, backup/, _to_delete/...) */
    if (/^[^/]+\.html$/.test(file)) {
      const u = indirizzo(file);
      if (stato === 'D') {
        /* sparita: si segnala solo se prima stava in una sitemap, cosi' Bing la toglie */
        if (eraInSitemap().has(u)) lista.add(u);
      } else if (inSitemap.has(u)) {
        lista.add(u);
      }
      continue;
    }

    /* sitemap cambiate: indirizzi comparsi e spariti */
    if (/^sitemap.*\.xml$/.test(file)) {
      let vecchi = [];
      try { vecchi = locs(git('show ' + prima + ':' + file)); } catch (e) { /* sitemap nuova */ }
      let nuovi = [];
      try { nuovi = locs(fs.readFileSync(path.join(RADICE, file), 'utf8')); } catch (e) { /* sitemap tolta */ }
      const setV = new Set(vecchi), setN = new Set(nuovi);
      nuovi.forEach(u => { if (!setV.has(u)) lista.add(u); });
      vecchi.forEach(u => { if (!setN.has(u)) lista.add(u); });
    }
  }

  const finale = [...lista].filter(u => u.startsWith(SITO + '/')).slice(0, TETTO);
  scrivi(finale, 'confronto ' + String(prima).slice(0, 7) + ' → ' + String(ora).slice(0, 7));
} catch (e) {
  scrivi([], 'non sono riuscito a fare la lista (' + (e && e.message ? e.message.split('\n')[0] : e) + ')');
}
process.exit(0);
