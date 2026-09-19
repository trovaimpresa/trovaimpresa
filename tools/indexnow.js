#!/usr/bin/env node
/* =====================================================================
   IL CAMPANELLO PER BING — 19 settembre 2026

   Alex: «dobbiamo inserire 100 link su bing», e poi «che cosa e' indexnow?».

   Prima: si pubblicava una pagina e si aspettava che Bing passasse a
   guardare, che puo' voler dire giorni. Oppure si andava a mano su Bing
   Webmaster Tools a incollare gli indirizzi, 100 per volta.

   Adesso: si lancia questo, e il sito dice a Bing «guarda qui, c'e' roba
   nuova». Fino a 10.000 indirizzi al giorno.

   ⚠️ NON E' PER GOOGLE. Google va per conto suo e non usa IndexNow:
      per lui resta la Search Console. Questo vale per Bing, Yandex,
      Naver, DuckDuckGo (che si appoggia a Bing) e Seznam.

   ⚠️ LA CHIAVE DEVE ESSERE GIA' ONLINE. Il file c670...040.txt sta nella
      radice del progetto e contiene la chiave e basta. Bing lo va a
      leggere per controllare che il sito sia davvero tuo: se non lo
      trova, rifiuta tutto con un 403. Quindi: PRIMA il push, POI questo.
      Il controllo qui sotto lo verifica da solo e si ferma se manca.

   ⚠️ IL FILE DELLA CHIAVE DEVE STARE IN `PUBBLICI_APPOSTA` dentro
      tools/controllo-push.js. Senza, il guardiano lo vede come un .txt
      nella radice, pensa sia roba privata rimasta scoperta, e BLOCCA IL
      PUSH. E' gia' stato aggiunto il 19 set 2026 insieme a questo file.

   COME SI USA, dalla cartella del progetto:

       node tools/indexnow.js                → manda le pagine del gestionale (28)
       node tools/indexnow.js --tutte        → manda tutte le sitemap (~2000)
       node tools/indexnow.js --prova        → dice cosa manderebbe, non manda
       node tools/indexnow.js /gestionale /prezzi   → manda solo questi

   Quando serve davvero:
     - hai pubblicato pagine nuove
     - hai CAMBIATO pagine che esistono gia' (come i prezzi del gestionale
       il 18 set): Bing continua a far vedere la versione vecchia finche'
       non ripassa, e questo glielo dice subito
   ===================================================================== */
'use strict';

const https = require('https');

const SITO   = 'trovaimpresa.com';
const CHIAVE = 'c670fbe9c5c6a2205488dd36e94bd040';
const POSTO_CHIAVE = 'https://' + SITO + '/' + CHIAVE + '.txt';

/* Le sitemap, divise per quando servono.
   ⚠️ I nomi sono quelli veri scritti in robots.txt: se un domani se ne
      aggiunge una, va aggiunta anche qui, se no non viene mai mandata. */
const MAPPE_GESTIONALE = ['sitemap-gestionale.xml'];
const MAPPE_TUTTE = [
  'sitemap.xml', 'sitemap-seo.xml', 'sitemap-gestionale.xml',
  'sitemap-mestieri.xml', 'sitemap-offerte.xml', 'sitemap-imprese.xml',
  'sitemap-recensioni.xml', 'sitemap-subappalti.xml'
];

const argomenti = process.argv.slice(2);
const PROVA  = argomenti.includes('--prova');
const TUTTE  = argomenti.includes('--tutte');
const A_MANO = argomenti.filter(a => a.startsWith('/'));

function prendi(url) {
  return new Promise((ok, no) => {
    https.get(url, r => {
      if (r.statusCode !== 200) { r.resume(); return no(new Error(url + ' risponde ' + r.statusCode)); }
      let t = '';
      r.setEncoding('utf8');
      r.on('data', d => t += d);
      r.on('end', () => ok(t));
    }).on('error', no);
  });
}

async function indirizziDallaMappa(nome) {
  const xml = await prendi('https://' + SITO + '/' + nome);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

function manda(lista) {
  /* ⚠️ Si manda UNA richiesta con dentro tutti gli indirizzi, non una per
     indirizzo: IndexNow vuole cosi', e mille richieste separate
     verrebbero prese per un attacco. */
  const corpo = JSON.stringify({
    host: SITO,
    key: CHIAVE,
    keyLocation: POSTO_CHIAVE,
    urlList: lista
  });
  return new Promise((ok, no) => {
    const r = https.request({
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8',
                 'Content-Length': Buffer.byteLength(corpo) }
    }, res => {
      let t = '';
      res.setEncoding('utf8');
      res.on('data', d => t += d);
      res.on('end', () => ok({ codice: res.statusCode, testo: t }));
    });
    r.on('error', no);
    r.write(corpo);
    r.end();
  });
}

/* Cosa vuol dire il numero che risponde, in italiano. */
const SIGNIFICATO = {
  200: 'ricevuti, tutto a posto',
  202: 'ricevuti — la chiave la controllano dopo, va bene lo stesso',
  400: 'richiesta scritta male',
  403: 'chiave rifiutata: il file della chiave non e\' online o non combacia',
  422: 'indirizzi che non appartengono a questo sito, oppure chiave sbagliata',
  429: 'troppe richieste: aspetta e riprova piu\' tardi'
};

(async () => {
  try {
    /* --- 1. la chiave e' online? Se no, e' inutile andare avanti. --- */
    if (!PROVA) {
      process.stdout.write('Controllo la chiave su ' + POSTO_CHIAVE + ' … ');
      let dentro;
      try { dentro = (await prendi(POSTO_CHIAVE)).trim(); }
      catch (e) {
        console.log('NON LA TROVO.');
        console.log('\n⛔ Il file della chiave non e\' online.');
        console.log('   Fai prima il push di ' + CHIAVE + '.txt, poi rilancia questo.\n');
        process.exit(1);
      }
      if (dentro !== CHIAVE) {
        console.log('C\'E\' MA E\' DIVERSA.');
        console.log('\n⛔ Dentro il file c\'e\' «' + dentro.slice(0, 60) + '», ma qui la chiave e\' «' + CHIAVE + '».');
        console.log('   Devono essere identiche. Bing rifiuta tutto se non lo sono.\n');
        process.exit(1);
      }
      console.log('c\'e\' ed e\' giusta.');
    }

    /* --- 2. quali indirizzi --- */
    let lista;
    if (A_MANO.length) {
      lista = A_MANO.map(p => 'https://' + SITO + p);
      console.log('Mando solo quelli che mi hai scritto: ' + lista.length);
    } else {
      const mappe = TUTTE ? MAPPE_TUTTE : MAPPE_GESTIONALE;
      console.log('Leggo ' + mappe.length + (mappe.length === 1 ? ' sitemap' : ' sitemap') + ':');
      lista = [];
      for (const m of mappe) {
        try {
          const u = await indirizziDallaMappa(m);
          lista = lista.concat(u);
          console.log('   ' + m.padEnd(26) + u.length);
        } catch (e) {
          console.log('   ' + m.padEnd(26) + 'NON LETTA (' + e.message + ')');
        }
      }
      /* ⚠️ i doppioni si tolgono: la stessa pagina puo' stare in due mappe */
      lista = [...new Set(lista)];
    }

    if (!lista.length) { console.log('\nNessun indirizzo da mandare.\n'); process.exit(0); }

    console.log('\nIndirizzi da mandare: ' + lista.length);
    console.log('   primo:  ' + lista[0]);
    console.log('   ultimo: ' + lista[lista.length - 1]);

    if (PROVA) {
      console.log('\n(--prova: non ho mandato niente. Togli --prova per farlo davvero.)\n');
      process.exit(0);
    }

    /* --- 3. a blocchi da 1000: e' il massimo per richiesta --- */
    const BLOCCO = 1000;
    let mandati = 0;
    for (let i = 0; i < lista.length; i += BLOCCO) {
      const pezzo = lista.slice(i, i + BLOCCO);
      const r = await manda(pezzo);
      const che = SIGNIFICATO[r.codice] || 'risposta non prevista';
      console.log('\nBlocco di ' + pezzo.length + ' → ' + r.codice + ' (' + che + ')');
      if (r.testo && r.testo.trim()) console.log('   ' + r.testo.trim().slice(0, 200));
      if (r.codice !== 200 && r.codice !== 202) {
        console.log('\n⛔ Mi fermo qui: i blocchi dopo non li mando.\n');
        process.exit(1);
      }
      mandati += pezzo.length;
      /* una pausa fra un blocco e l'altro, per non sembrare un attacco */
      if (i + BLOCCO < lista.length) await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n✅ Fatto: ' + mandati + ' indirizzi mandati a Bing.');
    console.log('   Non e\' una promessa di essere indicizzati: e\' un invito a venire a guardare.');
    console.log('   Fra qualche ora li vedi su Bing Webmaster Tools, sotto «IndexNow».\n');
  } catch (e) {
    console.error('\n⛔ Errore:', e && e.message, '\n');
    process.exit(1);
  }
})();
