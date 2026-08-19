/* ============================================================
   conta-visita.js — conta chi arriva davvero sul sito.

   PERCHE' ESISTE
   Il pixel di Meta parte solo dopo che uno clicca "Accetta tutti"
   sul banner dei cookie. Chi non lo clicca, per Meta non e' mai
   arrivato: ecco perche' su 854 clic pagati ne risultavano 326.
   Questo file conta TUTTI, senza cookie e senza pixel.

   COSA SCRIVE (tabella public.visite_sito su Supabase)
   - "arrivo": appena il browser esegue questo file
   - "visto" : la pagina si e' disegnata E la persona e' ancora
               qui dopo 2 secondi
   La differenza fra i due numeri dice quanti se ne vanno prima
   ancora di vedere il sito: e' li' che si misura la lentezza.

   COSA NON FA
   - Nessun cookie.
   - Nessun indirizzo IP, nessun nome, nessuna email.
   - L'id di sessione e' un numero a caso che muore quando si
     chiude la scheda (sessionStorage): serve solo a capire che
     "arrivo" e "visto" sono la stessa apertura di pagina.
   Statistica di prima parte, non profilazione: non serve il
   consenso, e infatti gira anche prima del banner.

   NON DEVE MAI ROMPERE LA PAGINA: tutto dentro try/catch, e se
   Supabase non risponde non succede niente.
   ============================================================ */
(function () {
  'use strict';

  var URL_DB = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  // Chiave pubblica "anon", la stessa che sta gia' in chiaro nelle pagine.
  // Su questa tabella puo' SOLO scrivere: non puo' rileggere niente.
  var CHIAVE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  try {
    var ua = (navigator && navigator.userAgent) || '';

    // I robot non sono visite.
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i.test(ua)) return;
    if (navigator.webdriver) return;

    // Pagina caricata in anticipo dal browser, che nessuno sta guardando.
    if (document.visibilityState === 'prerender') return;

    function taglia(s, n) {
      if (s === null || s === undefined || s === '') return null;
      return String(s).slice(0, n);
    }

    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
    function par(nome) { return params ? params.get(nome) : null; }

    var fbclid = par('fbclid');
    var rif = '';
    try { rif = document.referrer || ''; } catch (e) {}

    var sessione = null;
    try {
      sessione = sessionStorage.getItem('ti_visita');
      if (!sessione) {
        sessione = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('ti_visita', sessione);
      }
    } catch (e) { /* navigazione privata: si conta lo stesso, senza id */ }

    var daDove = null;
    try { daDove = rif ? new URL(rif).hostname : null; } catch (e) {}

    var largh = null;
    try { largh = window.innerWidth || null; } catch (e) {}

    var base = {
      pagina:       taglia(location.pathname, 200),
      fbclid:       taglia(fbclid, 300),
      da_meta:      !!fbclid || /facebook|instagram|fb\.me|\.fb\./i.test(rif),
      utm_source:   taglia(par('utm_source'), 100),
      utm_campaign: taglia(par('utm_campaign'), 100),
      provenienza:  taglia(daDove, 120),
      larghezza:    largh,
      telefono:     largh !== null ? largh < 768 : null,
      sessione:     taglia(sessione, 60),
      agente:       taglia(ua, 200)
    };

    function manda(fase, ms) {
      try {
        var riga = {};
        for (var k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) riga[k] = base[k]; }
        riga.fase = fase;
        if (ms !== undefined && ms !== null) riga.ms_attesa = ms;

        fetch(URL_DB + '/rest/v1/visite_sito', {
          method: 'POST',
          keepalive: true,
          headers: {
            'apikey': CHIAVE,
            'Authorization': 'Bearer ' + CHIAVE,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(riga)
        })['catch'](function () {});
      } catch (e) {}
    }

    // 1) ARRIVO — subito, prima di qualsiasi altra cosa.
    manda('arrivo');

    // 2) VISTO — la pagina si e' disegnata e la persona e' ancora qui.
    var fatto = false;
    function segnaVisto() {
      if (fatto) return;
      fatto = true;
      var ms = null;
      try { ms = Math.round(performance.now()); } catch (e) {}
      manda('visto', ms);
    }

    function quandoDisegnata() {
      try {
        requestAnimationFrame(function () {
          setTimeout(function () {
            if (document.visibilityState !== 'hidden') segnaVisto();
          }, 2000);
        });
      } catch (e) {
        setTimeout(segnaVisto, 2000);
      }
    }

    if (document.readyState === 'complete') quandoDisegnata();
    else window.addEventListener('load', quandoDisegnata);

  } catch (e) { /* il conteggio non deve mai rompere la pagina */ }
})();
