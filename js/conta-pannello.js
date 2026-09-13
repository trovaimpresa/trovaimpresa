/* ============================================================
   conta-pannello.js — chi entra nel suo pannello, e per quanto.
   6 settembre 2026 — prima versione.
   13 settembre 2026 — RIFATTO. Vedi "PERCHE' E' STATO RIFATTO".

   PERCHE' ESISTE
   Del gestionale sapevamo gia' chi lo apre (tabella gest_accessi).
   Dei quattro PANNELLI non sapevamo niente: ne' quante volte
   un'impresa ci entra, ne' quanto ci resta. Sapevamo solo l'ultimo
   ingresso, perche' lo segna Supabase da solo.

   COSA SCRIVE (tabella public.accessi_pannello)
   Una riga per ogni apertura del pannello: id, chi, quale pannello,
   quando, quanti secondi. L'id lo genera il browser e la stessa riga
   viene riscritta mentre la persona sta dentro, cosi' i secondi
   crescono anche se poi chiude la scheda di colpo.

   ⚠️ I SECONDI CONTANO SOLO IL TEMPO DAVANTI AGLI OCCHI.
   Se la scheda va in secondo piano (cambia finestra, blocca il
   telefono) il contatore si ferma. Senza questo, uno che lascia il
   pannello aperto e va a lavorare risulterebbe "dentro 8 ore", e il
   numero racconterebbe una bugia.

   ============================================================
   PERCHE' E' STATO RIFATTO (13 settembre 2026)

   Dal 6 settembre al 13 la tabella accessi_pannello e' rimasta a
   ZERO righe, mentre nello stesso periodo c'erano stati 16 accessi
   veri. Il pannello admin mostrava un numero morto e nessuno se ne
   era accorto per una settimana.

   Controllato uno per uno: il file era online (200), la chiave era
   la stessa degli altri file, il nome della pagina veniva
   riconosciuto anche nella forma senza .html, e il permesso del
   database funzionava (provato scrivendo una riga fingendosi un
   iscritto normale: passa).

   Restava una cosa sola: questa pagina si leggeva il gettone
   dell'iscritto A MANO, frugando dentro localStorage. E' l'unico
   punto di tutto il sito che lo faceva; dappertutto altrove si usa
   il collegamento `sb` gia' aperto nella pagina — quello che in
   gest_accessi ha scritto 220 righe senza mai sbagliare un colpo.

   Quindi adesso questo file NON si costruisce piu' niente da solo:
   usa lo stesso collegamento degli altri.

   ⛔ E SOPRATTUTTO: PRIMA GLI ERRORI SPARIVANO.
   La vecchia versione finiva con .catch(function(){}) — cioe' "se
   va storto, non dire niente". E' per quello che il guasto e'
   rimasto invisibile una settimana. Adesso ogni errore finisce
   nella console con la scritta [conta-pannello]. La regola di casa
   vale anche qui: una cosa non puo' fallire zitta.

   NON DEVE COMUNQUE MAI ROMPERE LA PAGINA: tutto dentro try/catch.
   Se Supabase non risponde, il pannello continua a funzionare.
   ============================================================ */
(function () {
  'use strict';

  var TAVOLA  = 'accessi_pannello';
  var OGNI    = 15;   // ogni quanti secondi si riscrive la riga
  var ATTESE  = 40;   // quanti mezzi secondi si aspetta il collegamento (40 = 20 s)

  function nota(msg, extra) {
    try { console.warn('[conta-pannello] ' + msg, extra === undefined ? '' : extra); } catch (e) {}
  }

  try {
    var ua = (navigator && navigator.userAgent) || '';
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(ua)) return;
    if (navigator.webdriver) return;
    if (document.visibilityState === 'prerender') return;

    /* Quale pannello, dal nome del file. Vale sia "pannello-artigiano"
       sia "pannello-artigiano.html": online gli indirizzi sono senza
       .html, nella cartella si aprono col .html. Se non e' un
       pannello, esce senza dire niente: e' normale. */
    var file = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var NOMI = {
      'pannello-impresa': 'impresa',
      'pannello-artigiano': 'artigiano',
      'pannello-professionisti': 'professionista',
      'pannello-negozio': 'negozio'
    };
    var pannello = NOMI[file];
    if (!pannello) return;

    /* L'id della riga: lo genera il browser una volta sola. La stessa
       riga viene poi riscritta, cosi' una visita = una riga. */
    var id;
    try {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : null;
    } catch (e) { id = null; }
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    /* IL COLLEGAMENTO: quello gia' aperto dalla pagina.
       Nei pannelli e' scritto `const sb = ...`, che NON diventa
       window.sb — si vede solo chiamandolo per nome. Per questo si
       prova in tutti e due i modi. */
    function collegamento() {
      try { if (window.sb && window.sb.from) return window.sb; } catch (e) {}
      try { if (typeof sb !== 'undefined' && sb && sb.from) return sb; } catch (e) {}
      return null;
    }

    var secondi = 0, scritti = -1, chi = null, sbp = null, acceso = false;

    function scrivi() {
      if (!acceso || secondi === scritti) return;
      var quanti = secondi;
      sbp.from(TAVOLA)
        .upsert({ id: id, user_id: chi, pannello: pannello, secondi: quanti, aggiornato_il: new Date().toISOString() })
        .then(function (r) {
          if (r && r.error) {
            nota('non sono riuscito a scrivere la visita: ' + (r.error.code || '') + ' ' + (r.error.message || ''));
            return;
          }
          scritti = quanti;
        })
        .catch(function (e) { nota('errore di rete mentre scrivevo la visita', e && e.message); });
    }

    /* Si aspetta che il pannello abbia finito di collegarsi e che
       l'iscritto risulti dentro. Se dopo 20 secondi non c'e' ancora
       nessuno, vuol dire che questa pagina non e' stata aperta da un
       iscritto: si smette, senza rumore. */
    var tentativi = 0;
    var attesa = setInterval(function () {
      tentativi++;
      var c = collegamento();
      if (!c) {
        if (tentativi >= ATTESE) { clearInterval(attesa); nota('il collegamento Supabase della pagina non e\' mai arrivato'); }
        return;
      }
      clearInterval(attesa);
      c.auth.getUser().then(function (r) {
        var u = r && r.data && r.data.user;
        if (!u || !u.id) return;            // non e' entrato nessuno: normale, niente da contare
        sbp = c; chi = u.id; acceso = true;
        scrivi();                            // la riga nasce subito: l'apertura si conta anche se resta un attimo
      }).catch(function (e) { nota('non sono riuscito a capire chi e\' entrato', e && e.message); });
    }, 500);

    setInterval(function () {
      if (document.visibilityState === 'visible') {
        secondi++;
        if (secondi % OGNI === 0) scrivi();
      }
    }, 1000);

    window.addEventListener('pagehide', function () { scrivi(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') scrivi();
    });
  } catch (e) { nota('mi sono fermato subito', e && e.message); }
})();
