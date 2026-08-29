/* ============================================================
   ✨ CHAT CON AI — la sezione dentro il gestionale
   29 agosto 2026

   Decisa da Alessio il 29 agosto, guardando le tre figure:
   una VOCE NELLA COLONNA DI SINISTRA, sotto Riepilogo, e la chat e' una
   sezione come tutte le altre. Scartati il bottone nella barra in alto
   (la finestra grande copre tutto il gestionale, e mentre chatti non
   vedi piu' la fattura di cui stai parlando) e il bottone accanto a
   «Compila con AI» (bello, ma quel posto esiste solo in 2 sezioni su 20).

   ⛔ LE TRE COSE DA SAPERE PRIMA DI TOCCARE QUESTO FILE

   1) LA VOCE SI ACCENDE SOLO COL PIANO PRO.
      La lampadina la accende `js/gate-gestionale.js`
      (`window._chatPro`), che e' l'unico posto dove si decide chi ha la
      chat. Qui NON si ricontrolla il piano: una regola che sta in due
      posti non si sistema a meta'.
      ⚠️ E se qualcuno accendesse la voce a mano dal browser non
      guadagnerebbe niente: chi decide davvero e' la function, che il
      piano se lo rilegge dal database a ogni messaggio.

   2) I DATI NON LI LEGGE QUESTA PAGINA.
      Qui si manda solo la domanda. A leggere i lavori e le fatture e'
      `netlify/functions/chat-gestionale.js`, che lo fa col gettone
      dell'iscritto e col filtro del reparto. Se questa pagina leggesse
      i dati da sola, il filtro del reparto sarebbe una cosa che si
      cambia dal browser.

   3) IL REPARTO ARRIVA DA `window.curMestiere()`.
      Il gestionale tiene tutto dentro una closure: `sb` e `curMestiere`
      da fuori non si vedono (e' scritto in cima a js/ai-integrazione.js,
      che infatti si arrangia leggendo il titolo della pagina). Per la
      chat il NOME del reparto non basta: serve il suo id. Percio' in
      `gestionale-app.html` c'e' una riga sola che lo espone.
   ============================================================ */
(function () {
  'use strict';

  var FUNZIONE = '/.netlify/functions/chat-gestionale';
  var conversazione = null;
  var inCorso = false;
  var disegnata = false;

  /* il gettone di sessione: stesso modo di js/ai-integrazione.js —
     il gestionale il suo client Supabase non lo presta a nessuno */
  function gettone() {
    try {
      var k = Object.keys(localStorage).find(function (x) {
        return x.indexOf('sb-') === 0 && x.indexOf('auth-token') >= 0;
      });
      if (!k) return null;
      var v = JSON.parse(localStorage.getItem(k));
      return v && v.access_token ? v.access_token : null;
    } catch (e) { return null; }
  }

  function reparto() {
    try { return (typeof window.curMestiere === 'function') ? window.curMestiere() : null; }
    catch (e) { return null; }
  }

  function sezioneAperta() {
    var b = document.querySelector('nav.tabs [data-tab].active');
    return b ? b.getAttribute('data-tab') : null;
  }

  /* una chiacchierata per volta: se ricarichi la pagina resta la stessa,
     cosi' la chat si ricorda di cosa stavate parlando */
  function chiacchierata() {
    if (conversazione) return conversazione;
    try {
      conversazione = sessionStorage.getItem('ti_chat_conv');
      if (!conversazione) {
        conversazione = (crypto && crypto.randomUUID) ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
              var r = Math.random() * 16 | 0;
              return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        sessionStorage.setItem('ti_chat_conv', conversazione);
      }
    } catch (e) { conversazione = String(Date.now()); }
    return conversazione;
  }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* ⚠️ NIENTE <br>: `.asst-msg` nel foglio comune ha gia'
     `white-space:pre-wrap`, quindi gli a capo li tiene da solo. Mettendoci
     anche i <br> le righe venivano doppie. Si converte solo il grassetto. */
  function testoRisposta(t) {
    return esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(SEGNALINO, pulsanteApri);
  }

  /* ============================================================
     ⛔ 29 agosto 2026 — IL PULSANTE «APRILO» (gradino 2)
     ============================================================
     Quando la chat nomina una cosa che ha letto, ci mette dietro un
     segnalino [apri:TIPO:ID]. Qui diventa un pulsante che apre davvero
     quella cosa nel gestionale.
     ⛔ Ad aprirla NON e' questa pagina: e' `window.apriCosa()` dentro
     gestionale-app.html, che usa gli stessi `data-action` dei pulsanti
     che ci sono gia'. Qui si preme un campanello, non si apre la porta.
     ⚠️ L'ID deve essere un id vero (36 caratteri, la forma di sempre): se
     Claude se lo inventasse, il segnalino resta scritto com'e' e non
     diventa un pulsante che porta chissa' dove.
     ⚠️ I tipi sono quattro e non di piu': sono quelli che il gestionale
     sa gia' aprire da soli. */
  var TIPI_APRIBILI = { lav:'Aprilo', prev:'Apri il preventivo', fatt:'Apri la fattura', cli:'Apri il cliente' };
  var SEGNALINO = /\[apri:(lav|prev|fatt|cli):([0-9a-fA-F-]{36})\]/g;
  function pulsanteApri(tutto, tipo, id) {
    var lab = TIPI_APRIBILI[tipo];
    if (!lab) return tutto;
    return ' <button class="chip" type="button" data-apri="' + tipo + '" data-apri-id="' + id + '">' + lab + '</button>';
  }

  /* ------------------------------------------------------------------
     LA SEZIONE
     ⛔ Colori e misure vengono dalle variabili di css/gestionale.css:
        --blu, --sfondo, --bordo, --card, --testo, --testo-2. Niente
        inventato, e niente sotto i 13 px (qui il piu' piccolo e' 14).
     ------------------------------------------------------------------ */
  /* ⛔ IL MODELLO E' LA SEZIONE «ASSISTENZA DIRETTA», copiata riga per riga.
     Prima qui c'erano stili scritti a mano dentro il js: bolle inventate,
     una casella di scrittura di una riga sola, e `.sh-b` che non e' una
     scatola (nel foglio comune e' solo `margin-bottom:14px`, per le
     finestre). Risultato: una sezione che non somigliava a niente del
     gestionale, con un buco bianco in mezzo e la casella staccata in fondo.
     Le classi della chat ESISTONO GIA' in css/gestionale.css — `.asst-wrap`,
     `.asst-msgs`, `.asst-msg mio/suo`, `.asst-scrivi`, `.asst-nota`,
     `.asst-vuoto` — e sono quelle dell'Assistenza diretta.
     ⚠️ La casella di scrittura e' una `<textarea rows="3">`: alta 78 px e la
     si puo' allargare tirandola giu'. */
  function disegna() {
    var sez = document.getElementById('chat');
    if (!sez || disegnata) return;
    disegnata = true;
    sez.innerHTML =
      /* ⚠️ 29 agosto 2026 — NIENTE `.gal-intro` QUI.
         Tutte le altre sezioni hanno la riga di spiegazione sotto il
         titolo, ma qui Alessio l'ha fatta togliere: «questo non serve».
         E ha ragione — la chat si spiega da sola, e quelle quattro righe
         si mangiavano 84 px di altezza proprio dove serve lo spazio.
         Quello che c'era da dire (cosa guarda, quando si ferma) sta nella
         schermata vuota, dentro la chat, dove uno lo legge davvero. */
      '<div class="sec-head"><h2>Chat con AI</h2></div>'
    + '<div class="asst-wrap">'
    +   '<div class="asst-msgs" id="chat-righe"></div>'
    +   '<div class="asst-scrivi">'
    +     '<textarea id="chat-domanda" rows="3" placeholder="Scrivi qui la tua domanda&hellip;"></textarea>'
    +     '<button class="btn btn-primary" type="button" id="chat-manda">Manda</button>'
    +   '</div>'
    +   '<div class="asst-nota" id="chat-sotto"></div>'
    + '</div>';

    document.getElementById('chat-manda').addEventListener('click', manda);
    /* un ascoltatore solo per tutti i pulsanti «Aprilo», anche quelli che
       arriveranno dopo: sta sulla scatola dei messaggi, non sui pulsanti */
    document.getElementById('chat-righe').addEventListener('click', function (e) {
      var b = e.target.closest('[data-apri]'); if (!b) return;
      var ok = (typeof window.apriCosa === 'function')
        && window.apriCosa(b.getAttribute('data-apri'), b.getAttribute('data-apri-id'));
      if (!ok) scrivi('ai', 'Non riesco ad aprirtelo da qui: cercalo con la ricerca in alto.');
    });
    document.getElementById('chat-domanda').addEventListener('keydown', function (e) {
      /* Invio manda, Maiuscolo+Invio va a capo: e' come funzionano tutte
         le chat, quindi non si scrive da nessuna parte — si sa. */
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); manda(); }
    });
    aggiornaSotto();
  }

  function righe() { return document.getElementById('chat-righe'); }

  function scrivi(chi, html, id) {
    var r = righe(); if (!r) return null;
    var vuoto = r.querySelector('.asst-vuoto');
    if (vuoto) vuoto.remove();
    var d = document.createElement('div');
    if (id) d.id = id;
    /* ⛔ nessuno stile scritto qui: le classi stanno in css/gestionale.css */
    if (chi === 'utente')      d.className = 'asst-msg mio';
    else if (chi === 'attesa') d.className = 'asst-giorno';
    else                       d.className = 'asst-msg suo';
    d.innerHTML = html;
    r.appendChild(d);
    r.scrollTop = r.scrollHeight;
    return d;
  }

  /* ⛔ 29 agosto 2026 — LA CHAT VUOTA E' VUOTA.
     Qui c'erano un saluto, la spiegazione di cosa guarda e tre domande di
     esempio da cliccare. Alessio le ha fatte togliere tutte:
     «non servono le spiegazioni, tutti sanno usare una chat».
     Ha ragione: la casella dice gia' cosa fare, e il posto per spiegare
     una cosa non e' la schermata di chi la sta gia' usando. */

  /* ------------------------------------------------------------------
     quanti messaggi gli restano.
     ⛔ Il numero NON sta qui dentro: lo dice `chat_stato` su Supabase,
     che e' lo stesso posto da cui lo legge la function. Se lo scrivessi
     anche qui, un giorno la pagina direbbe «te ne restano 50» mentre il
     server ti scala un credito — due numeri per la stessa cosa.
     ⚠️ Si usa `window._gc`, il collegamento che ha gia' aperto il
     cancello (js/gate-gestionale.js): ha dentro la sessione, e cosi' non
     serve ricopiare qui nessuna chiave.
     ⚠️ Se non arriva, la chat funziona lo stesso: e' una scritta, non
     una serratura. Chi decide davvero e' sempre la function.
     ------------------------------------------------------------------ */
  function scriviRestanti(n) {
    var sotto = document.getElementById('chat-sotto');
    if (!sotto || typeof n !== 'number') return;
    sotto.innerHTML = 'Piano <b>Pro</b> &middot; ti restano <b>' + n + '</b> messaggi compresi questo mese';
  }

  async function aggiornaSotto() {
    if (!window._gc || !window._gc.rpc) return;
    try {
      var r = await window._gc.rpc('chat_stato', {});
      if (r && !r.error && r.data) {
        var s = Array.isArray(r.data) ? r.data[0] : r.data;
        if (s) scriviRestanti(s.restanti);
      }
    } catch (e) { /* niente: e' un di piu' */ }
  }

  async function manda() {
    if (inCorso) return;
    var casella = document.getElementById('chat-domanda');
    var domanda = (casella.value || '').trim();
    if (!domanda) return;

    var mid = reparto();
    if (!mid) { scrivi('ai', 'Prima entra in un reparto: la chat guarda i dati del reparto in cui sei.'); return; }
    var t = gettone();
    if (!t) { scrivi('ai', 'La sessione è scaduta. Rientra e riprova.'); return; }

    inCorso = true;
    casella.value = '';
    document.getElementById('chat-manda').disabled = true;
    scrivi('utente', esc(domanda));
    var attesa = scrivi('attesa', 'Sto guardando&hellip;');

    try {
      var r = await fetch(FUNZIONE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({
          domanda: domanda,
          conversazione_id: chiacchierata(),
          mestiere_id: mid,
          sezione: sezioneAperta()
        })
      });
      var d = await r.json().catch(function () { return {}; });
      if (attesa) attesa.remove();

      if (r.ok && d.risposta) {
        scrivi('ai', testoRisposta(d.risposta));
        scriviRestanti(d.restanti);
      } else if (d.serve_pro) {
        scrivi('ai', 'La <b>Chat con AI</b> fa parte del piano <b>Pro</b>.');
      } else if (d.serve_crediti) {
        scrivi('ai', esc(d.error) + '<br><a href="/ricarica-crediti.html">Vai alla ricarica dei crediti</a>');
      } else {
        /* ⚠️ se non ha risposto, il credito e' gia' tornato indietro:
           lo fa la function con refund_ai_credit. Qui si dice solo che
           non e' andata, e si manda dove c'e' una persona vera. */
        scrivi('ai', 'Non sono riuscito a risponderti: ' + esc(d.error || 'riprova fra poco') + '.<br>'
          + '<span class="asst-nota">Se ricapita, usa «Assistenza diretta» qui a sinistra.</span>');
      }
    } catch (e) {
      if (attesa) attesa.remove();
      scrivi('ai', 'Non sono riuscito a risponderti: la rete non ha risposto. Riprova.');
    }

    inCorso = false;
    document.getElementById('chat-manda').disabled = false;
    casella.focus();
  }

  /* ------------------------------------------------------------------
     ACCENDI LA VOCE — solo se il cancello ha detto che ha il Pro.
     `window._chatPro` arriva dopo, quando il cancello ha finito di
     leggere la riga dell'impresa: si aspetta, senza fretta e senza
     restare ad aspettare per sempre.
     ------------------------------------------------------------------ */
  function accendi() {
    var b = document.getElementById('tab-chat');
    if (b) b.style.display = '';
    disegna();
  }

  var tentativi = 0;
  function aspettaIlPiano() {
    if (window._chatPro === true) { accendi(); return; }
    /* deciso: se non ha il Pro la voce resta spenta e non si dice niente.
       Il posto dove si offre il Pro e' la pagina dei prezzi, non il menu
       di chi sta lavorando. */
    if (window._chatPro === false) return;
    if (++tentativi > 60) return;           /* ~30 secondi e poi basta */
    setTimeout(aspettaIlPiano, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aspettaIlPiano);
  } else {
    aspettaIlPiano();
  }
})();
