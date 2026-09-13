/* ============================================================
   meta-modulo-aperto.js — 13 set 2026

   A COSA SERVE
   Facebook impara solo se vede TANTE volte la cosa su cui deve
   ottimizzare. Le iscrizioni vere sono poche (→3← in nove giorni):
   Meta chiede ~→50← risultati a settimana per uscire dalla fase di
   apprendimento, quindi con l'iscrizione non ci arriviamo mai e la
   campagna resta per sempre «Risultati insufficienti».

   Allora gli facciamo contare un passo PRIMA, che succede molte piu'
   volte: «questa persona ha APERTO il modulo per iscriversi».
   E' gente che stava gia' andando verso l'iscrizione, non uno che
   clicca a caso: Meta impara sui numeri giusti senza cambiare
   pubblico.

   L'evento si chiama ViewContent (nel pannello italiano
   «Visualizzazione del contenuto»). Non tocca in nessun modo
   CompleteRegistration, che continua a partire quando uno si
   iscrive davvero.

   COME
   - dal BROWSER col pixel, ma solo se la persona ha accettato i
     cookie (il pixel parte solo allora)
   - dal SERVER con l'API Conversions, sempre: e' l'unico modo per
     contare anche chi ha il blocca-pubblicita' o iPhone
   - stesso event_id dalle due parti, cosi' Meta ne conta UNO
   - una volta sola per apertura di pagina (sessionStorage), se no
     un ricarica-ricarica gonfia i numeri e Meta impara su una bugia

   NON DEVE MAI ROMPERE LA PAGINA: tutto dentro try/catch.
   ============================================================ */
(function () {
  'use strict';

  try {
    var ua = (navigator && navigator.userAgent) || '';
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i.test(ua)) return;
    if (navigator.webdriver) return;
    if (document.visibilityState === 'prerender') return;

    /* Il tipo si legge dall'indirizzo: /registrazione-artigiano → artigiano */
    var tipo = 'sconosciuto';
    try {
      var m = location.pathname.match(/registrazione-([a-z]+)/i);
      if (m && m[1]) tipo = m[1].toLowerCase();
    } catch (e) {}

    /* Una volta sola finche' la scheda resta aperta. */
    var chiave = 'ti_modulo_visto_' + tipo;
    try {
      if (sessionStorage.getItem(chiave)) return;
      sessionStorage.setItem(chiave, '1');
    } catch (e) { /* navigazione privata: si manda lo stesso */ }

    var eid = 'mod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);

    /* 1) dal browser (solo con i cookie accettati: il pixel non c'e' prima) */
    try {
      if (typeof fbq !== 'undefined') {
        fbq('track', 'ViewContent', { content_category: tipo }, { eventID: eid });
      }
    } catch (e) {}

    /* 2) dal server, sempre */
    var fbp = '';
    try { fbp = (document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/) || [])[1] || ''; } catch (e) {}

    var fbclid = '';
    var fbclid_t = 0;
    try {
      fbclid = new URLSearchParams(window.location.search).get('fbclid') || '';
      fbclid_t = fbclid ? Date.now() : 0;
      if (!fbclid) {
        var mem = localStorage.getItem('ti_fbclid') || '';
        var quando = parseInt(localStorage.getItem('ti_fbclid_t') || '0', 10);
        if (mem && quando && (Date.now() - quando) < 30 * 24 * 60 * 60 * 1000) {
          fbclid = mem;
          fbclid_t = quando;
        }
      }
    } catch (e) {}

    fetch('/.netlify/functions/meta-evento', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'ViewContent',
        event_id: eid,
        tipo: tipo,
        fbp: fbp,
        fbclid: fbclid,
        fbclid_t: fbclid_t,
        url: window.location.href
      })
    })['catch'](function () {});

  } catch (e) { /* il conteggio non deve mai rompere la pagina */ }
})();
