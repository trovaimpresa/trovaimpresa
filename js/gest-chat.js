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
  /* ⛔ 30 agosto 2026 — IL «FERMA».
     Mentre risponde, il pulsante «Manda» diventa «Ferma» e taglia
     l'attesa. Non serve un pulsante in piu': il posto e' quello.
     ⚠️ Fermare NON ti ridà il messaggio: la domanda e' gia' partita e
     il conto l'ha gia' fatto il server. Si smette di aspettare, e basta
     — e la riga che compare lo dice, se no uno ci conta sopra. */
  var annulla = null;

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

  /* ============================================================
     ⛔ 29 agosto 2026 — IL MODULO GIA' PIENO (gradino 3)
     ============================================================
     Quando la chat capisce che gli stai dicendo di SEGNARE un lavoro,
     la function risponde, oltre al testo, anche con un `modulo`. Qui si
     apre.
     ⛔ Ad aprirlo e a riempirlo NON e' questa pagina: e'
     `AI.compilaLavoroDaChat` dentro js/ai-integrazione.js, che e' la
     STESSA macchina del pulsante «Compila con AI». Qui si preme un
     campanello, come per «Aprilo»: se ricopiassi qui i nomi delle
     caselle, il modulo del lavoro starebbe scritto in due posti, e un
     campo aggiunto domani finirebbe in uno solo dei due.
     ⛔ E non si salva niente: il modulo si apre pieno, a salvare e' lui.
     ⚠️ I moduli sono DUE, il lavoro e il cliente: sono gli stessi che
     conosce la function. Se un domani se ne aggiunge uno di la', va
     aggiunto anche in questa riga qui sotto — se no arriva un modulo e
     non lo apre nessuno. Un tipo che non conosco non apre niente e lo
     dice, invece di aprire il modulo sbagliato.
     ============================================================ */
  var MODULI_APRIBILI = { lavoro: 'compilaLavoroDaChat', cliente: 'compilaClienteDaChat' };

  function apriModulo(m) {
    if (!m || !m.campi) return false;
    var quale = MODULI_APRIBILI[m.tipo];
    if (!quale) { scrivi('ai', 'Questo modulo non lo so ancora aprire da qui.'); return false; }
    if (!window.AI || typeof window.AI[quale] !== 'function') {
      scrivi('ai', 'Il modulo non riesco ad aprirtelo: ricarica la pagina e riprova.');
      return false;
    }
    return !!window.AI[quale](m.campi);
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
    +   '<div class="chat-col">'
    +     '<div class="asst-msgs" id="chat-righe"></div>'
    +     '<div class="asst-scrivi">'
    +       '<textarea id="chat-domanda" rows="3" placeholder="Scrivi qui la tua domanda&hellip;"></textarea>'
    +       '<button class="btn btn-primary" type="button" id="chat-manda">Manda</button>'
    +     '</div>'
    +     '<div class="asst-nota" id="chat-sotto"></div>'
    +   '</div>'
    /* ✨ 29 agosto 2026 — le chat di prima, chieste da Alessio */
    +   '<aside class="chat-archivio">'
    +     '<button class="btn" type="button" id="chat-nuova">+ Nuova chat</button>'
    +     '<div class="chat-elenco" id="chat-elenco"></div>'
    +   '</aside>'
    + '</div>';

    document.getElementById('chat-manda').addEventListener('click', function () {
      if (inCorso) { if (annulla) annulla.abort(); return; }
      manda();
    });
    /* un ascoltatore solo per tutti i pulsanti «Aprilo», anche quelli che
       arriveranno dopo: sta sulla scatola dei messaggi, non sui pulsanti */
    document.getElementById('chat-righe').addEventListener('click', function (e) {
      var c = e.target.closest('[data-copia]');
      if (c) return copiaRisposta(c);
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
    document.getElementById('chat-nuova').addEventListener('click', nuovaChat);
    document.getElementById('chat-elenco').addEventListener('click', function (e) {
      var butta = e.target.closest('[data-butta]');
      if (butta) { e.stopPropagation(); return svuotaUna(butta.getAttribute('data-butta')); }
      var riga = e.target.closest('[data-conv]');
      if (riga) return apriChiacchierata(riga.getAttribute('data-conv'));
    });
    caricaArchivio();
    apriChiacchierata(chiacchierata(), true);
  }

  function righe() { return document.getElementById('chat-righe'); }

  /* ⛔ 30 agosto 2026 — IL «COPIA» SOTTO LE RISPOSTE.
     Serviva a chi si fa scrivere due righe da mandare al cliente: prima
     doveva selezionarle a mano col mouse, e sul telefono era peggio.
     ⚠️ Si mette SOLO sotto le risposte vere (`conCopia`), non sotto gli
     avvisi tipo «non sono riuscito a risponderti»: copiare un errore non
     serve a niente.
     ⚠️ Nessuno stile scritto qui: `chip` e' la stessa classe del pulsante
     «Aprilo», che sta gia' in css/gestionale.css. */
  function scrivi(chi, html, id, conCopia) {
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
    if (conCopia) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('data-copia', '1');
      b.textContent = 'Copia';
      d.appendChild(document.createElement('br'));
      d.appendChild(b);
    }
    r.appendChild(d);
    r.scrollTop = r.scrollHeight;
    return d;
  }

  /* copia il testo della risposta, senza i pulsanti che ci stanno dentro.
     ⚠️ Si lavora su una COPIA della bolla: togliere i pulsanti da quella
     vera vorrebbe dire che dopo aver copiato sparisce «Aprilo». */
  function copiaRisposta(bottone) {
    var bolla = bottone.closest('.asst-msg');
    if (!bolla) return;
    var copia = bolla.cloneNode(true);
    Array.prototype.slice.call(copia.querySelectorAll('button')).forEach(function (x) { x.remove(); });
    var testo = (copia.innerText || copia.textContent || '').trim();
    var fatto = function () {
      bottone.textContent = 'Copiato';
      setTimeout(function () { bottone.textContent = 'Copia'; }, 1500);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(testo).then(fatto, function () { bottone.textContent = 'Non ci riesco'; });
        return;
      }
    } catch (e) {}
    /* ⚠️ la scorciatoia vecchia, per i browser che non hanno il blocco note
       moderno: una casella nascosta, si seleziona e si copia. */
    try {
      var t = document.createElement('textarea');
      t.value = testo; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
      fatto();
    } catch (e) { bottone.textContent = 'Non ci riesco'; }
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
  /* ⛔ 29 agosto: la barra in alto del gestionale e questa riga devono
     dire la STESSA parola. Prima qui c'era scritto «Piano Pro» mentre la
     barra diceva PREMIUM: due nomi per lo stesso account. Adesso qui il
     nome del piano non si scrive proprio: si dicono solo i messaggi. */
  var modoAssaggio = false;
  function scriviRestanti(n) {
    var sotto = document.getElementById('chat-sotto');
    if (!sotto || typeof n !== 'number') return;
    sotto.innerHTML = modoAssaggio
      ? 'Prova: ti ' + (n === 1 ? 'resta <b>1</b> messaggio' : 'restano <b>' + n + '</b> messaggi')
        + ' &middot; con il <b>Premium AI</b> ne hai 300 al mese'
      : 'Ti restano <b>' + n + '</b> messaggi compresi questo mese';
  }

  async function aggiornaSotto() {
    if (!window._gc || !window._gc.rpc) return;
    try {
      var r = await window._gc.rpc('chat_stato', {});
      if (r && !r.error && r.data) {
        var s = Array.isArray(r.data) ? r.data[0] : r.data;
        if (s) { modoAssaggio = !!s.assaggio; scriviRestanti(s.restanti); }
      }
    } catch (e) { /* niente: e' un di piu' */ }
  }

  /* ============================================================
     ✨ L'ARCHIVIO — le chat di prima
     ⛔ L'elenco e i titoli li fa `chat_elenco` su Supabase: il titolo e'
     la PRIMA DOMANDA che hai scritto tu, tagliata. Non si chiede all'AI
     di dare un nome alle chiacchierate: sarebbe un messaggio pagato per
     ogni chat solo per intitolarla.
     ⛔ E a buttare e' `chat_svuota`, che segna `eliminato_il` e basta: la
     riga resta per il conto dei messaggi del mese, quindi svuotare la
     chat non regala messaggi a nessuno.
     ============================================================ */
  function quandoInParole(iso) {
    try {
      var d = new Date(iso), o = new Date();
      var g = Math.floor((new Date(o.getFullYear(), o.getMonth(), o.getDate())
                        - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
      if (g <= 0) return 'Oggi ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      if (g === 1) return 'Ieri';
      if (g < 7)   return g + ' giorni fa';
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return ''; }
  }

  async function caricaArchivio() {
    var box = document.getElementById('chat-elenco');
    if (!box || !window._gc || !window._gc.rpc) return;
    try {
      var r = await window._gc.rpc('chat_elenco', { p_quante: 40 });
      if (r && r.error) throw r.error;
      var righe = r.data || [];
      if (!righe.length) { box.innerHTML = '<div class="chat-vuoto">Qui compaiono le chat di prima.</div>'; return; }
      var qui = chiacchierata();
      box.innerHTML = righe.map(function (c) {
        return '<div class="chat-riga' + (c.conversazione_id === qui ? ' aperta' : '') + '" data-conv="' + esc(c.conversazione_id) + '">'
          + '<span class="ct"><span class="cn">' + esc(c.titolo) + '</span>'
          + '<span class="cq">' + esc(quandoInParole(c.quando)) + ' &middot; ' + (c.messaggi || 0) + ' messaggi</span></span>'
          + '<button class="chat-butta" type="button" title="Butta questa chat" data-butta="' + esc(c.conversazione_id) + '">&times;</button>'
          + '</div>';
      }).join('');
    } catch (e) {
      box.innerHTML = '<div class="chat-vuoto">Non riesco a leggere le chat di prima.</div>';
    }
  }

  /* riapre una chiacchierata: i messaggi si rileggono dal database */
  async function apriChiacchierata(conv, zitto) {
    if (!conv) return;
    conversazione = conv;
    try { sessionStorage.setItem('ti_chat_conv', conv); } catch (e) {}
    var r = righe(); if (r) r.innerHTML = '';
    if (!window._gc) return;
    try {
      var res = await window._gc.from('gest_chat_messaggi')
        .select('ruolo,testo,created_at')
        .eq('conversazione_id', conv).is('eliminato_il', null)
        .order('created_at', { ascending: true }).limit(200);
      if (res && !res.error && res.data) {
        res.data.forEach(function (m) {
          if (!m.testo) return;
          scrivi(m.ruolo === 'ai' ? 'ai' : 'utente',
                 m.ruolo === 'ai' ? testoRisposta(m.testo) : esc(m.testo),
                 null, m.ruolo === 'ai');
        });
      }
    } catch (e) { if (!zitto) scrivi('ai', 'Non riesco a rileggere questa chat.'); }
    caricaArchivio();
  }

  function nuovaChat() {
    conversazione = null;
    try { sessionStorage.removeItem('ti_chat_conv'); } catch (e) {}
    chiacchierata();
    var r = righe(); if (r) r.innerHTML = '';
    caricaArchivio();
    var c = document.getElementById('chat-domanda'); if (c) c.focus();
  }

  async function svuotaUna(conv) {
    if (!conv || !window._gc) return;
    try {
      var r = await window._gc.rpc('chat_svuota', { p_conversazione: conv });
      if (r && r.error) throw r.error;
      if (conv === chiacchierata()) nuovaChat(); else caricaArchivio();
    } catch (e) { scrivi('ai', 'Non sono riuscito a buttarla: riprova.'); }
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
    var apertoUnModulo = false;
    var fermato = false;
    casella.value = '';
    annulla = (typeof AbortController === 'function') ? new AbortController() : null;
    var bottoneManda = document.getElementById('chat-manda');
    /* ⛔ NON si spegne piu': mentre risponde deve restare cliccabile,
       se no non c'e' niente da premere per fermarla. */
    bottoneManda.textContent = 'Ferma';
    scrivi('utente', esc(domanda));
    var attesa = scrivi('attesa', 'Sto guardando&hellip;');

    try {
      var r = await fetch(FUNZIONE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        signal: annulla ? annulla.signal : undefined,
        body: JSON.stringify({
          domanda: domanda,
          conversazione_id: chiacchierata(),
          mestiere_id: mid,
          sezione: sezioneAperta()
        })
      });
      /* ============================================================
         ⛔ 30 agosto 2026 — LA RISPOSTA ARRIVA A PEZZI.
         ============================================================
         La function risponde con un flusso: una riga di JSON per volta,
         separate da un a capo.
             {"pezzo":"...")   una manciata di parole appena scritte
             {"fine":true,...} l'ultima riga: quanti ne restano, il modulo,
                               e l'errore se non e' andata
         ⚠️ Il vecchio modo (la risposta tutta insieme) resta qui sotto e
            funziona ancora: lo usano gli errori del piano e dei crediti,
            che rispondono col loro codice PRIMA che il flusso parta. Cosi'
            se un domani la function tornasse indietro, la chat non si
            accorge di niente.
         ⚠️ Fermare a meta' lascia scritto quello che era gia' arrivato: il
            resto lo trovi riaprendo la chat, perche' il server la finisce
            comunque e la salva intera.
         ============================================================ */
      var tipo = '';
      try { tipo = r.headers.get('content-type') || ''; } catch (e) {}
      var aPezzi = r.ok && tipo.indexOf('ndjson') >= 0 && r.body && typeof r.body.getReader === 'function';

      if (aPezzi) {
        if (attesa) attesa.remove();
        var bolla = scrivi('ai', '');
        var scatola = righe();
        var lettore = r.body.getReader();
        var dec = new TextDecoder();
        var resto = '', testo = '', fine = null;
        while (true) {
          var p = await lettore.read();
          if (p.done) break;
          resto += dec.decode(p.value, { stream: true });
          var lin = resto.split('\n');
          resto = lin.pop();
          for (var i = 0; i < lin.length; i++) {
            if (!lin[i]) continue;
            var o; try { o = JSON.parse(lin[i]); } catch (e) { continue; }
            if (typeof o.pezzo === 'string') {
              testo += o.pezzo;
              /* si ridisegna tutta la bolla ogni volta: e' poco testo, e cosi'
                 il grassetto e i pulsanti «Aprilo» si formano da soli appena
                 la riga e' completa */
              bolla.innerHTML = testoRisposta(testo);
              if (scatola) scatola.scrollTop = scatola.scrollHeight;
            }
            if (o.fine) fine = o;
          }
        }
        if (!testo) {
          bolla.innerHTML = 'Non sono riuscito a risponderti: '
            + esc((fine && fine.errore) || 'riprova fra poco') + '.<br>'
            + '<span class="asst-nota">Se ricapita, usa «Assistenza diretta» qui a sinistra.</span>';
        } else {
          var cop = document.createElement('button');
          cop.type = 'button'; cop.className = 'chip';
          cop.setAttribute('data-copia', '1'); cop.textContent = 'Copia';
          bolla.appendChild(document.createElement('br'));
          bolla.appendChild(cop);
        }
        if (fine) {
          scriviRestanti(fine.restanti);
          caricaArchivio();
          /* ⛔ il modulo si apre DOPO aver scritto la risposta: se si aprisse
             prima, la finestra coprirebbe la riga che dice cosa ci ha messo. */
          if (fine.modulo) apertoUnModulo = apriModulo(fine.modulo);
        }
        inCorso = false;
        annulla = null;
        bottoneManda.textContent = 'Manda';
        bottoneManda.disabled = false;
        if (!apertoUnModulo) casella.focus();
        return;
      }

      var d = await r.json().catch(function () { return {}; });
      if (attesa) attesa.remove();

      if (r.ok && d.risposta) {
        scrivi('ai', testoRisposta(d.risposta), null, true);
        scriviRestanti(d.restanti);
        caricaArchivio();   /* la chiacchierata nuova compare subito a destra */
        /* ⛔ il modulo si apre DOPO aver scritto la risposta: se si aprisse
           prima, la finestra coprirebbe la riga che dice cosa ci ha messo. */
        if (d.modulo) apertoUnModulo = apriModulo(d.modulo);
      } else if (d.serve_pro) {
        /* la frase la scrive il server: sa se e' un assaggio finito o
           un piano che non c'e'. Qui si aggiunge solo la strada per
           comprare, che e' il pannello: le porte stanno li'. */
        scrivi('ai', esc(d.error || 'La Chat con AI fa parte del Premium AI.')
          + (d.assaggio_finito ? '<br><a href="/pannello-impresa.html#dashboard">Attiva il Premium AI dal pannello</a>' : ''));
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
      if (e && e.name === 'AbortError') {
        fermato = true;
        scrivi('ai', 'Va bene, ho lasciato perdere.<br>'
          + '<span class="asst-nota">Il messaggio era gi&agrave; partito, quindi resta contato.</span>');
      } else {
        scrivi('ai', 'Non sono riuscito a risponderti: la rete non ha risposto. Riprova.');
      }
    }

    inCorso = false;
    annulla = null;
    bottoneManda.textContent = 'Manda';
    bottoneManda.disabled = false;
    /* ⛔ 29 agosto 2026 — IL CURSORE NON SI RIPRENDE IL MODULO.
       Se la risposta ha aperto un modulo, il cursore adesso sta nella
       prima casella da controllare: riportarlo qui vorrebbe dire
       trovarsi il modulo aperto davanti e scrivere nella chat dietro.
       Trovato dal banco del ponte, non a occhio: la riga stava in fondo
       a `manda`, cioe' DOPO che il modulo si era gia' aperto. */
    if (!apertoUnModulo) casella.focus();
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
    /* ⛔ 30 agosto: si accende anche per l'assaggio (10 messaggi in
       tutto), se no chi non ha il piano non sa nemmeno che esiste. */
    if (window._chatPro === true || window._chatAssaggio === true) { accendi(); return; }
    /* deciso: se non ha il Pro la voce resta spenta e non si dice niente.
       Il posto dove si offre il Pro e' la pagina dei prezzi, non il menu
       di chi sta lavorando. */
    if (window._chatPro === false && window._chatAssaggio === false) return;
    if (++tentativi > 60) return;           /* ~30 secondi e poi basta */
    setTimeout(aspettaIlPiano, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aspettaIlPiano);
  } else {
    aspettaIlPiano();
  }
})();
