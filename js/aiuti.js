/* ============================================================
   aiuti.js — I riquadri di aiuto del gestionale (agosto 2026)

   Passi il mouse su una voce del menu o su un pulsante della barra,
   e dopo un attimo compare un riquadro che spiega a cosa serve.

   COME SI USA
   Una riga sola in fondo a gestionale-app.html:
       <script src="/js/aiuti.js"></script>

   COME SI AGGIUNGONO ALTRI AIUTI
   Due modi, tutti e due semplici.
   1) Scrivendo la frase qui sotto nella lista AIUTI, con la chiave giusta
      (il data-tab o il data-action del pulsante).
   2) Mettendo direttamente data-aiuto="la tua frase" sul pulsante in HTML.
      Ha la precedenza su tutto: serve quando un pulsante e' un caso a se'.

   PERCHE' SOLO COL MOUSE
   Sul telefono il "passaggio sopra" non esiste, e questi sono pulsanti che
   fanno qualcosa quando li tocchi: un aiuto al tocco darebbe fastidio invece
   di aiutare. Quindi su telefono e tablet non compare niente.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- le frasi ---------- */
  /* menu di sinistra: la chiave e' il data-tab del pulsante */
  var AIUTI_TAB = {
    riepilogo:    'Il colpo d’occhio: cosa c’è da fare oggi, cosa è in ritardo e come vanno gli incassi.',
    lavori:       'Tutti i cantieri: da fare, in corso e finiti. Da un lavoro nasce il preventivo e poi la fattura.',
    preventivi:   'I preventivi mandati e quelli ancora da mandare. Quando il cliente accetta, diventa un lavoro.',
    fatture:      'Le fatture emesse, quelle da incassare e quelle pagate. Da qui esce il PDF e il file per lo SdI.',
    calendario:   'Il mese a colpo d’occhio: quando è previsto ogni lavoro.',
    agenda:       'Cosa deve fare la squadra giorno per giorno. È quello che gli operai vedono sul telefono.',
    mezzi:        'Furgoni e macchine, con le scadenze di bollo, assicurazione e revisione.',
    attrezzature: 'Betoniere, ponteggi, utensili: cosa hai e a chi è in mano.',
    squadra:      'Le persone che lavorano con te: contatti, ruolo e documenti.',
    carte:        'Le carte aziendali e le spese fatte con ognuna.',
    clienti:      'Privati, aziende e condomini. Una volta inserito un cliente lo scegli dal menu, senza riscrivere ogni volta indirizzo e dati.',
    scadenzario:  'Le scadenze da non dimenticare, con l’avviso prima che arrivino.',
    report:       'I numeri: quanto hai lavorato, quanto hai incassato, dove vanno i soldi.',
    galleria:     'Le foto e i video dei cantieri, tutti in un posto solo.',
    mappa:        'Dove sono i tuoi cantieri e quanto distano da te.',
    richieste:    'Le richieste di preventivo che arrivano dai clienti di TrovaImpresa.'
  };

  /* barra in alto e pagina iniziale: la chiave e' il data-action */
  var AIUTI_AZIONE = {
    azienda:        'I tuoi dati: nome, partita IVA, sede, IBAN. Sono quelli che finiscono su preventivi e fatture.',
    commercialista: 'I contatti del tuo commercialista e i documenti da mandargli, come scontrini e ricevute.',
    'export-json':  'Scarica una copia di tutti i tuoi dati da tenere da parte, per sicurezza.',
    'export-excel': 'Porta fuori i dati in un foglio di calcolo, per farci i conti per conto tuo.',

    /* --- creare cose nuove --- */
    'new-job':          'Un cantiere nuovo: cosa c’è da fare, per chi e quando. Da qui poi nascono preventivo e fattura.',
    'new-prev':         'Un preventivo nuovo. Quando il cliente lo accetta lo trasformi in lavoro senza riscrivere niente.',
    'new-fattura':      'Una fattura nuova. Puoi partire da zero, da un preventivo accettato o da più lavori dello stesso cliente.',
    'new-mezzo':        'Un furgone o una macchina, con le scadenze di bollo, assicurazione e revisione.',
    'new-attrezzatura': 'Un’attrezzatura: betoniera, ponteggio, martello demolitore. Serve a sapere dove sta e chi ce l’ha.',
    'new-dip':          'Una persona della squadra: contatti, ruolo e documenti.',
    'new-carta':        'Una carta aziendale, per tenere il conto di cosa ci paghi.',
    'new-scad':         'Una scadenza da non dimenticare, con l’avviso prima che arrivi.',
    'new-panel':        'Un reparto nuovo, per esempio muratore o giardiniere. Ogni reparto ha i suoi lavori, i suoi clienti e i suoi numeri, separati dagli altri.',
    'new-job-date':     'Crea un lavoro già fissato in questo giorno.',
    'quick-cli':        'Aggiungi al volo un cliente che non hai ancora in anagrafica, senza uscire da qui.',

    /* --- lavoro di tutti i giorni --- */
    'carta-dettaglio':   'Tutti i movimenti fatti con questa carta, uno per uno.',
    'save-rifornimento': 'Registra un pieno: litri, importo e chilometri. Serve per sapere quanto ti costa davvero il mezzo.',
    'save-movimento':    'Aggiungi una spesa fatta con questa carta.',
    'sq-wa':             'Manda un messaggio WhatsApp a questa persona, senza cercare il numero in rubrica.',
    'mp-ricalcola':      'Ricalcola quanto distano i cantieri. Serve dopo che hai cambiato indirizzi o aggiunto lavori.',
    'gal-carica':        'Carica foto e video del cantiere: restano attaccati al lavoro e li ritrovi anche fra due anni.',
    'report-csv':        'Scarica i numeri di questa schermata in un foglio di calcolo.',

    /* --- documenti e invii --- */
    'doc-cli':           'I documenti attaccati a questo cliente: verbali, preventivi firmati, capitolati, permessi.',
    'doc-cli-scegli':    'Scegli uno o più file dal computer. Le foto vengono alleggerite da sole, i PDF restano intatti.',
    'doc-cli-apri':      'Apre il documento in una scheda nuova.',
    'doc-cli-mail':      'Manda questo documento per email, con copia a te. L’indirizzo lo prende dalla scheda del cliente.',

    /* --- fatture --- */
    'fatt-riga-add':     'Aggiungi una voce alla fattura: descrizione, quantità, prezzo e IVA.',
    'prev-riga-add':     'Aggiungi una voce al preventivo: descrizione, quantità e prezzo.',
    'upload-fattura':    'Attacca alla fattura il suo PDF, così lo ritrovi qui invece che nelle cartelle del computer.',
    'fatt':              'Crea la fattura di questo lavoro, con dentro già la voce giusta.'
  };

  /* ---------- il riquadro ---------- */
  var RITARDO = 350;      /* ms prima di comparire: cosi' non lampeggia mentre muovi il mouse */
  var box = null, timer = null, ancora = null;

  function creaBox() {
    if (box) return box;
    var s = document.createElement('style');
    s.textContent =
      '#ti-aiuto{position:fixed;z-index:99999;max-width:300px;background:#0a2a4d;color:#fff;' +
      'font-family:inherit;font-size:14.5px;line-height:1.55;padding:12px 14px;border-radius:10px;' +
      'box-shadow:0 6px 24px rgba(10,42,77,.28);pointer-events:none;opacity:0;transition:opacity .14s;' +
      'transform:translateY(4px)}' +
      '#ti-aiuto.on{opacity:1;transform:translateY(0)}' +
      '@media (prefers-reduced-motion: reduce){#ti-aiuto{transition:none}}';
    document.head.appendChild(s);
    box = document.createElement('div');
    box.id = 'ti-aiuto';
    box.setAttribute('role', 'tooltip');
    document.body.appendChild(box);
    return box;
  }

  function posiziona(el) {
    var r = el.getBoundingClientRect();
    var b = box.getBoundingClientRect();
    var m = 10;
    /* di lato se c'e' posto (il menu sta a sinistra), altrimenti sotto */
    var x = r.right + m, y = r.top;
    if (x + b.width > window.innerWidth - m) {
      x = Math.max(m, r.left);
      y = r.bottom + m;
    }
    if (y + b.height > window.innerHeight - m) y = Math.max(m, window.innerHeight - b.height - m);
    box.style.left = Math.round(x) + 'px';
    box.style.top = Math.round(y) + 'px';
  }

  function mostra(el, testo) {
    creaBox();
    box.textContent = testo;
    box.style.left = '-9999px';   /* misuro prima di piazzarlo */
    box.classList.add('on');
    posiziona(el);
    ancora = el;
  }

  function nascondi() {
    clearTimeout(timer);
    if (box) box.classList.remove('on');
    ancora = null;
  }

  function testoDi(el) {
    if (el.dataset.aiuto) return el.dataset.aiuto;              /* scritto a mano: vince su tutto */
    if (el.dataset.tab && AIUTI_TAB[el.dataset.tab]) return AIUTI_TAB[el.dataset.tab];
    if (el.dataset.action && AIUTI_AZIONE[el.dataset.action]) return AIUTI_AZIONE[el.dataset.action];
    return '';
  }

  function avvia() {
    /* solo dove esiste un vero passaggio del mouse */
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest('[data-tab],[data-action],[data-aiuto]');
      if (!el || el === ancora) return;
      var t = testoDi(el);
      if (!t) return;
      /* il title del browser darebbe due riquadri sovrapposti: lo metto da parte */
      if (el.title) { el.dataset.titleOff = el.title; el.removeAttribute('title'); }
      clearTimeout(timer);
      timer = setTimeout(function () { mostra(el, t); }, RITARDO);
    });

    document.addEventListener('mouseout', function (e) {
      var el = e.target.closest('[data-tab],[data-action],[data-aiuto]');
      if (!el) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      nascondi();
    });

    /* il riquadro non deve restare appeso quando succede altro */
    document.addEventListener('click', nascondi, true);
    window.addEventListener('scroll', nascondi, true);
    window.addEventListener('blur', nascondi);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') nascondi(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
