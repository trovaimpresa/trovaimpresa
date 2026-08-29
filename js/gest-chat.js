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
  /* la risposta arriva in testo semplice: si tengono a capo e grassetti */
  function testoRisposta(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }

  /* ------------------------------------------------------------------
     LA SEZIONE
     ⛔ Colori e misure vengono dalle variabili di css/gestionale.css:
        --blu, --sfondo, --bordo, --card, --testo, --testo-2. Niente
        inventato, e niente sotto i 13 px (qui il piu' piccolo e' 14).
     ------------------------------------------------------------------ */
  var ESEMPI = [
    'Come faccio una fattura?',
    'Perché il magazzino non scende?',
    'Quanti lavori ho ancora da fatturare?'
  ];

  function disegna() {
    var sez = document.getElementById('chat');
    if (!sez || disegnata) return;
    disegnata = true;
    sez.innerHTML =
      '<div class="sec-head"><h2>Chat con AI</h2></div>'
    + '<div class="gal-intro">Chiedi quello che vuoi sul gestionale: come si fa una fattura, '
    + 'perch&eacute; il magazzino non scende, dov&rsquo;&egrave; finito un preventivo. '
    + 'Guarda i <b>tuoi</b> dati del reparto in cui sei e ti risponde sul concreto. '
    + 'Se non sa, te lo dice e ti manda all&rsquo;assistenza.</div>'
    + '<div class="sh-b">'
    +   '<div id="chat-righe" style="display:flex;flex-direction:column;gap:14px;padding:6px 0 4px;min-height:300px;"></div>'
    + '</div>'
    + '<div class="sh-b">'
    +   '<div style="display:flex;gap:10px;align-items:flex-end;">'
    +     '<input type="text" id="chat-domanda" autocomplete="off" placeholder="Scrivi la tua domanda&hellip;" '
    +            'style="flex:1;font-size:16px;padding:13px 14px;border-radius:10px;'
    +            'border:1px solid var(--bordo,#e2e6e1);background:var(--card,#fff);color:var(--testo,#16281c);">'
    +     '<button class="btn" type="button" id="chat-manda" style="white-space:nowrap;">Manda</button>'
    +   '</div>'
    +   '<div id="chat-sotto" style="margin-top:9px;font-size:14px;color:var(--testo-2,#5a6b5f);"></div>'
    + '</div>';

    document.getElementById('chat-manda').addEventListener('click', manda);
    document.getElementById('chat-domanda').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); manda(); }
    });
    benvenuto();
    aggiornaSotto();
  }

  function righe() { return document.getElementById('chat-righe'); }

  function scrivi(chi, html, id) {
    var r = righe(); if (!r) return null;
    var d = document.createElement('div');
    if (id) d.id = id;
    if (chi === 'utente') {
      d.style.cssText = 'align-self:flex-end;max-width:74%;background:var(--blu,#0066ff);color:#fff;'
        + 'padding:12px 16px;border-radius:14px 14px 4px 14px;font-size:16px;line-height:1.55;';
    } else if (chi === 'attesa') {
      d.style.cssText = 'align-self:flex-start;font-size:15px;color:var(--testo-2,#5a6b5f);padding:4px 2px;';
    } else {
      d.style.cssText = 'align-self:flex-start;max-width:82%;background:var(--sfondo,#f3f5f2);'
        + 'border:1px solid var(--bordo,#e2e6e1);color:var(--testo,#16281c);'
        + 'padding:14px 16px;border-radius:14px 14px 14px 4px;font-size:16px;line-height:1.6;';
    }
    d.innerHTML = html;
    r.appendChild(d);
    d.scrollIntoView({ block: 'nearest' });
    return d;
  }

  function benvenuto() {
    var r = righe(); if (!r || r.children.length) return;
    scrivi('ai', 'Ciao. Chiedimi quello che vuoi su questo reparto del gestionale.<br>'
      + '<span style="font-size:14px;color:var(--testo-2,#5a6b5f)">Su tasse, sicurezza e contratti mi fermo '
      + 'e ti dico di far controllare: la figura la faresti tu, non io.</span>');
    var d = document.createElement('div');
    d.style.cssText = 'align-self:flex-start;display:flex;gap:10px;flex-wrap:wrap;';
    d.innerHTML = ESEMPI.map(function (e) {
      return '<button class="btn b-cancel" type="button" data-chiedi="' + esc(e) + '">' + esc(e) + '</button>';
    }).join('');
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-chiedi]'); if (!b) return;
      document.getElementById('chat-domanda').value = b.getAttribute('data-chiedi');
      manda();
    });
    r.appendChild(d);
  }

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
          + '<span style="font-size:14px;color:var(--testo-2,#5a6b5f)">Se ricapita, usa «Assistenza diretta» qui a sinistra.</span>');
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
