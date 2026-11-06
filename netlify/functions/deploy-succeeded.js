/* =====================================================================
   IL CAMPANELLO AUTOMATICO PER BING — PARTE 2: LA CHIAMATA (6 nov 2026)

   Netlify fa partire da sola una function che si chiama esattamente
   `deploy-succeeded` quando una pubblicazione e' andata online.
   ⛔ NON RINOMINARE QUESTO FILE: col nome diverso non parte piu'.

   Legge la lista scritta durante il build da tools/indexnow-lista.js
   (inclusa nella function con `included_files` in netlify.toml) e la
   manda a IndexNow, che la gira a Bing, Yandex, Naver, Seznam.
   DuckDuckGo e Copilot/ChatGPT cercano su Bing: arriva anche a loro.

   ⚠️ NON E' PER GOOGLE: Google non usa IndexNow.

   ⚠️ La chiave e' la stessa di tools/indexnow.js: il file
      c670fbe9c5c6a2205488dd36e94bd040.txt nella radice. Se si cambia
      la chiave, va cambiata in tutti e tre i posti.

   Costo: una chiamata a pubblicazione, niente rispetto ai 15 crediti
   del build. Se la lista e' vuota non chiama nemmeno IndexNow.

   Si vede cosa ha fatto nel registro della function su Netlify:
   Logs → Functions → deploy-succeeded.
   ===================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const HOST = 'trovaimpresa.com';
const CHIAVE = 'c670fbe9c5c6a2205488dd36e94bd040';
const BLOCCO = 10000; // massimo per richiesta secondo IndexNow

function leggiLista() {
  const posti = [
    path.join(__dirname, 'tools', '.indexnow-lista.json'),
    path.join(process.cwd(), 'tools', '.indexnow-lista.json'),
    path.join(__dirname, '..', '..', 'tools', '.indexnow-lista.json'),
    path.join('/var/task', 'tools', '.indexnow-lista.json')
  ];
  for (const p of posti) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { /* prova il posto dopo */ }
  }
  return null;
}

exports.handler = async (event) => {
  /* Solo la pubblicazione vera del sito, non le anteprime dei rami. */
  try {
    const dati = JSON.parse(event.body || '{}').payload || {};
    if (dati.context && dati.context !== 'production') {
      console.log('[indexnow] pubblicazione «' + dati.context + '»: non avviso Bing');
      return { statusCode: 200, body: 'saltato' };
    }
  } catch (e) { /* se non si legge, si va avanti */ }

  const lista = leggiLista();
  if (!lista) {
    console.log('[indexnow] lista non trovata nel pacchetto della function');
    return { statusCode: 200, body: 'nessuna lista' };
  }
  const urls = Array.isArray(lista.urlList) ? lista.urlList : [];
  console.log('[indexnow] ' + (lista.nota || '') + ' — ' + urls.length + ' indirizzi');
  if (!urls.length) return { statusCode: 200, body: 'niente da segnalare' };

  for (let i = 0; i < urls.length; i += BLOCCO) {
    const pezzo = urls.slice(i, i + BLOCCO);
    try {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: HOST,
          key: CHIAVE,
          keyLocation: 'https://' + HOST + '/' + CHIAVE + '.txt',
          urlList: pezzo
        }),
        signal: AbortSignal.timeout(8000)
      });
      const testo = (await r.text().catch(() => '')).slice(0, 200);
      console.log('[indexnow] blocco di ' + pezzo.length + ' → ' + r.status + (testo ? ' ' + testo : ''));
      if (pezzo.length <= 20) console.log('[indexnow] ' + pezzo.join(' '));
    } catch (e) {
      console.log('[indexnow] errore: ' + (e && e.message));
    }
  }
  return { statusCode: 200, body: 'fatto' };
};
