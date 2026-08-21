/* ============================================================
   AIUTI DEL GESTIONALE — TrovaImpresa (9 agosto 2026)

   Richiesta di Alessio: "non c'e' tooltip nel gestionale professionisti,
   mettiamolo". Servono su: parole tecniche dei form, menu laterale, numeri
   del riepilogo, pulsanti delle card. E devono funzionare AL TOCCO, perche'
   un geometra in cantiere sta sul telefono e il title="" del browser sul
   telefono non esiste.

   COME FUNZIONA
   Non si e' toccata una sola etichetta nel gestionale. Questo file guarda la
   pagina, riconosce le parole che sa spiegare e ci attacca da solo un (i).
   Stesso principio del traduttore "lavoro -> pratica": cosi' le schermate
   nuove che scriveremo domani avranno gli aiuti senza doversene ricordare.

   IL (i) E' UN PULSANTE VERO
   Click sul computer, tocco sul telefono. Sui pulsanti delle card il (i) NON
   va dentro il pulsante: sarebbe un pulsante dentro un pulsante e toccarlo
   farebbe partire l'azione. Se ne mette uno solo in fondo alla fila, che
   spiega tutti i pulsanti di quella card insieme.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. COSA SPIEGARE ----------
     Chiave = il testo esatto che si legge a schermo, in minuscolo.
     Dove la parola cambia col ruolo (lavoro/pratica) ci sono tutte e due. */
  var AIUTI = {
    /* --- soldi e fisco: qui si sbaglia, e si sbaglia col cliente davanti --- */
    "cassa previdenziale":
      "Il contributo per la tua cassa (Inarcassa, Geometri, EPPI, INPS). Si calcola SOLO sul compenso, non sulle spese, e si aggiunge in fattura: lo paga il cliente. La percentuale te la conferma il tuo commercialista.",
    "ritenuta d'acconto":
      "Una parte del tuo compenso che il cliente NON ti paga: la versa lui allo Stato per conto tuo, come anticipo delle tue tasse. Di solito il 20%, e solo sul compenso. Non e' un costo: te la ritrovi nella dichiarazione dei redditi.",
    "aliquota iva":
      "La percentuale di IVA su questa voce. Le prestazioni professionali vanno al 22%. Il 10% e il 4% sono per chi esegue i lavori (ristrutturazione, prima casa), non per la parcella.",
    "imponibile":
      "La somma su cui si calcola l'IVA: compenso + cassa + spese. Non e' quello che incassi.",
    "imponibile iva":
      "La somma su cui si calcola l'IVA: compenso + cassa + spese. Non e' quello che incassi.",
    "spese (bolli, diritti, visure)":
      "Quello che hai anticipato per conto del cliente: marche da bollo, diritti di segreteria, visure catastali. Glielo riaddebiti tal quale, non e' un tuo guadagno.",
    "bollo (€)":
      "La marca da bollo da 2 euro. Va messa sulle fatture senza IVA sopra i 77,47 euro (per esempio in regime forfettario). Se hai l'IVA in fattura, di solito non serve.",
    "sconto (€)":
      "Uno sconto in euro sul totale. Si toglie dopo l'IVA.",
    "codice destinatario":
      "Il codice di 7 caratteri che dice allo SDI dove consegnare la fattura elettronica. Te lo da' il cliente. Se non ce l'ha, si mette 0000000 e la fattura gli arriva nel cassetto fiscale.",
    "regime fiscale":
      "Il tuo regime: ordinario (con IVA) o forfettario (senza IVA, con la dicitura di legge). Cambia tutta la fattura, quindi controllalo con il commercialista.",
    "giorni per il pagamento":
      "Dopo quanti giorni dalla data della fattura scade il pagamento. Serve al gestionale per dirti quali fatture sono in ritardo.",
    "iban":
      "Il conto su cui vuoi essere pagato. Finisce stampato sulla fattura e dentro il file per lo SDI.",

    /* --- la pratica --- */
    "protocollo":
      "Il numero che ti da' il Comune quando depositi la pratica. Scrivilo qui: lo ritrovi sulla card senza dover riaprire la mail.",
    "a che punto sta":
      "Lo stato della pratica in Comune: da presentare, depositata, in istruttoria, con richiesta integrazioni, conclusa. E' diverso da “da fare / in corso / fatto”, che dice invece a che punto sei TU col lavoro.",
    "tipo di pratica":
      "CILA, SCIA, permesso di costruire, agibilita', catasto… Serve al gestionale per raggrupparle e per il promemoria delle scadenze.",
    "data prevista":
      "Quando pensi di chiuderla. Se metti anche una scadenza collegata, ti arriva l'email 30 giorni prima, 7 giorni prima e il giorno prima.",
    "importo (€)":
      "Quanto vale, IVA esclusa. E' il numero che poi finisce come riga della fattura: cassa, spese e IVA si aggiungono dopo, non metterle qui.",
    "cliente / cantiere":
      "Dove si lavora. Serve anche per la mappa e per ritrovare le foto.",
    "che tipo di cliente è":
      "Privato (persona con codice fiscale), Azienda (con partita IVA) o Condominio (con l'amministratore). Cambia cosa ti serve per fatturare.",

    /* --- formazione --- */
    "crediti formativi":
      "I CFP che devi accumulare per il tuo Ordine o Collegio. Qui registri i corsi fatti e vedi quanti te ne mancano.",
    "obiettivo crediti":
      "Quanti CFP ti servono nel periodo. Per la maggior parte degli Ordini sono 30 all'anno, ma controlla il tuo regolamento.",

    /* --- menu laterale --- */
    "riepilogo":  "La prima cosa da guardare la mattina: cosa scade, cosa e' in ritardo, cosa c'e' da incassare.",
    "pratiche":   "Tutte le tue pratiche: stato in Comune, protocollo, scadenze, foto, spese e ore.",
    "lavori":     "Tutti i tuoi lavori: stato, cliente, importo, foto, spese e ore.",
    "preventivi": "Le parcelle da mandare al cliente. Quando accetta, con un clic diventano pratica e poi fattura, senza riscrivere niente.",
    "fatture":    "Le fatture emesse e da emettere, con il PDF per il cliente e il file XML per lo SDI.",
    "calendario": "Il mese a colpo d'occhio, con le note del giorno.",
    "scadenzario":"Tutte le scadenze in un posto solo: pratiche, mezzi, documenti. Con l'email di promemoria.",
    "strumenti":  "Gli strumenti di misura e i loro certificati di taratura, con la scadenza.",
    "collaboratori":"Chi lavora con te e su cosa. Ognuno vede solo le sue cose.",
    "clienti":    "La rubrica: dati per fatturare, indirizzo, referente. Da qui si vede anche tutto quello che hai fatto per ognuno.",
    "fornitori":  "Chi fornisce te, e le loro fatture da pagare.",
    "report":     "I numeri del periodo: quanto hai fatturato, quanto hai incassato, dove ci guadagni e dove no.",
    "galleria":   "Tutte le foto e i documenti, cercabili per pratica.",
    "mappa":      "Dove sono i tuoi cantieri, su una cartina.",
    "cestino":    "Quello che elimini finisce qui e si rimette a posto con un clic. Non si svuota da solo.",
    "agenda operatore":"Quello che vede in giornata chi lavora con te, dal suo telefono.",

    /* --- i numeri --- */
    "da incassare":  "Fatture gia' emesse che il cliente non ha ancora pagato. In rosso quelle scadute.",
    "da fatturare":  "Lavoro finito e mai fatturato. Sono soldi tuoi fermi: clicca per emettere la fattura.",
    "incassato":     "Quello che e' davvero entrato in cassa quest'anno, al netto della ritenuta.",
    "il credito più vecchio":"Da quanti giorni aspetti il pagamento piu' arretrato. Se supera i 60, e' ora di telefonare.",
    "fatture emesse":"Quante fatture hai numerato quest'anno. La numerazione riparte da 1 ogni gennaio.",

    /* --- pulsanti --- */
    "emetti":            "Da' il numero definitivo alla fattura e la rende ufficiale. Dopo non si dovrebbe piu' cambiare.",
    "segna inviato":     "Segna che l'hai mandata al cliente. Serve solo a te per ricordartene.",
    "accettato → crea pratica":"Il cliente ha detto di si': il preventivo diventa una pratica. Se ne hai gia' una aperta per quel cliente, ti chiede se collegarla invece di crearne una doppia.",
    "accettato → crea lavoro":"Il cliente ha detto di si': il preventivo diventa un lavoro. Se ne hai gia' uno aperto per quel cliente, ti chiede se collegarlo invece di crearne uno doppio.",
    "rifiutato":         "Il cliente ha detto di no. Il preventivo resta negli archivi, non sparisce.",
    "lettera d'incarico":"Il contratto da far firmare prima di iniziare: oggetto, compenso, tempi, recesso, foro, e la doppia firma sulle clausole. Fattelo leggere una volta dal tuo legale.",
    "crea il pdf":       "Genera il PDF della fattura da mandare al cliente.",
    "allega un pdf tuo": "Se la fattura la fa il commercialista, carica qui la sua: il gestionale usa quella invece del PDF suo.",
    "rimetti a posto":   "Riporta la scheda dov'era, con tutti i suoi dati.",
    "elimina per sempre":"Cancella davvero, senza ritorno. Se c'e' ancora attaccato qualcosa che non e' nel cestino, si rifiuta e ti dice cosa.",
    "segna fatto":       "Chiude il lavoro e lo manda in “da fatturare”.",
    "avvia":             "Mette il lavoro in corso."
  };

  /* le voci che valgono solo per chi ha la cassa e la ritenuta */
  var PREFISSI = ["incassato", "fatture emesse"]; /* hanno l'anno attaccato */

  var STILE_MESSO = false, bolla = null, apertoSu = null, stoScrivendo = false, obs = null;
  /* "bloccato" = aperta con un clic, quindi ci resta finche' non la chiudi tu.
     Senza questa distinzione sul computer succedeva cosi': passi il mouse sopra
     (si apre), clicchi (il clic la trovava gia' aperta e la richiudeva). */
  var bloccato = false;
  var puoiPassarciSopra = !window.matchMedia || window.matchMedia("(hover: hover)").matches;

  function pulisci(t) {
    return String(t || "")
      .replace(/ⓘ|ℹ/g, "")          /* il nostro (i), se ricapita */
      .replace(/\(facoltativo\)/gi, "")
      .replace(/[*:]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function testoAiuto(t) {
    var k = pulisci(t);
    if (AIUTI[k]) return AIUTI[k];
    for (var i = 0; i < PREFISSI.length; i++) {
      if (k.indexOf(PREFISSI[i]) === 0) return AIUTI[PREFISSI[i]];
    }
    return null;
  }

  /* ---------- 2. LA BOLLA ---------- */
  function chiudi() {
    if (bolla) bolla.classList.remove("aperta");
    if (apertoSu) apertoSu.setAttribute("aria-expanded", "false");
    apertoSu = null;
    bloccato = false;
  }

  function apri(btn, testo) {
    if (!bolla) {
      bolla = document.createElement("div");
      bolla.className = "aiu-bolla";
      bolla.setAttribute("role", "tooltip");
      document.body.appendChild(bolla);
      /* il clic dentro la bolla non la chiude: uno puo' voler selezionare il testo */
      bolla.addEventListener("click", function (e) { e.stopPropagation(); });
    }
    bolla.textContent = testo;
    bolla.classList.add("aperta");
    btn.setAttribute("aria-expanded", "true");
    apertoSu = btn;

    /* posizione: sotto il (i), ma se non ci sta sopra; e sempre dentro lo schermo */
    bolla.style.left = "0px"; bolla.style.top = "0px";
    var r = btn.getBoundingClientRect(), b = bolla.getBoundingClientRect();
    var larg = Math.min(b.width, window.innerWidth - 24);
    bolla.style.maxWidth = larg + "px";
    b = bolla.getBoundingClientRect();
    var x = r.left + r.width / 2 - b.width / 2;
    x = Math.max(12, Math.min(x, window.innerWidth - b.width - 12));
    var y = r.bottom + 8;
    if (y + b.height > window.innerHeight - 12) y = Math.max(12, r.top - b.height - 8);
    bolla.style.left = Math.round(x) + "px";
    bolla.style.top = Math.round(y) + "px";
  }

  function creaBottone(testo) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "aiu";
    b.setAttribute("aria-label", "Cosa vuol dire");
    b.setAttribute("aria-expanded", "false");
    b.textContent = "i";
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();            /* non deve far partire l'azione della card */
      if (bloccato && apertoSu === b) { chiudi(); return; }   /* secondo tocco: chiude */
      apri(b, testo);
      bloccato = true;
    });
    /* Il passaggio del mouse si attiva solo dove il mouse c'e' davvero: sui
       telefoni "(hover: hover)" e' falso, e senza questo controllo il browser
       simulava un passaggio al tocco e la bolla lampeggiava. */
    if (puoiPassarciSopra) {
      b.addEventListener("mouseenter", function () { if (!bloccato) apri(b, testo); });
      b.addEventListener("mouseleave", function () { if (!bloccato && apertoSu === b) chiudi(); });
    }
    return b;
  }

  function attacca(el, testo) {
    if (!el || el.dataset.aiu) return;
    el.dataset.aiu = "1";
    el.appendChild(document.createTextNode(" "));
    el.appendChild(creaBottone(testo));
  }

  /* ---------- 3. TROVARE I POSTI ---------- */
  function passata() {
    if (stoScrivendo) return;
    stoScrivendo = true;
    try {
      /* etichette dei form */
      document.querySelectorAll("label:not([data-aiu])").forEach(function (l) {
        var t = testoAiuto(l.textContent); if (t) attacca(l, t);
      });
      /* menu laterale: il primo <span>, non il contatore */
      document.querySelectorAll("aside.side button[data-tab]").forEach(function (b) {
        var s = b.querySelector("span:not(.tab-cnt)");
        if (!s || s.dataset.aiu) return;
        var t = testoAiuto(s.textContent); if (t) attacca(s, t);
      });
      /* i numeroni in alto */
      document.querySelectorAll(".fatt-tot > .l:not([data-aiu])").forEach(function (l) {
        var t = testoAiuto(l.textContent); if (t) attacca(l, t);
      });
      /* pulsanti delle card: UN SOLO (i) in fondo alla fila, mai dentro i pulsanti */
      document.querySelectorAll(".job-actions:not([data-aiu])").forEach(function (riga) {
        var voci = [];
        riga.querySelectorAll("button, .btn").forEach(function (b) {
          if (b.classList.contains("aiu")) return;
          var t = testoAiuto(b.textContent);
          if (t) voci.push("• " + b.textContent.trim().replace(/^[^\wÀ-ſ]+/, "") + ": " + t);
        });
        riga.dataset.aiu = "1";
        if (!voci.length) return;
        riga.appendChild(creaBottone(voci.join("\n\n")));
      });
    } finally {
      stoScrivendo = false;
    }
  }

  function stile() {
    if (STILE_MESSO) return; STILE_MESSO = true;
    var s = document.createElement("style");
    s.textContent =
      ".aiu{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;" +
      "min-width:17px;padding:0;margin:0 0 0 5px;border:1.5px solid currentColor;border-radius:50%;" +
      "background:transparent;color:var(--testo-3,#8a94a6);font:700 11px/1 Georgia,serif;" +
      "cursor:help;vertical-align:middle;opacity:.7;flex:none}" +
      ".aiu:hover,.aiu[aria-expanded=true]{opacity:1;color:var(--blu,#0b4bc4)}" +
      ".aiu:focus-visible{outline:2px solid var(--blu,#0b4bc4);outline-offset:2px}" +
      ".job-actions>.aiu{margin-left:auto;align-self:center}" +
      ".aiu-bolla{position:fixed;z-index:99999;display:none;max-width:320px;padding:11px 13px;" +
      "border-radius:10px;background:#0f2740;color:#fff;font:400 13.5px/1.5 inherit;" +
      "white-space:pre-line;box-shadow:0 10px 30px rgba(0,0,0,.28);pointer-events:auto}" +
      ".aiu-bolla.aperta{display:block}" +
      "@media (max-width:560px){.aiu{width:20px;height:20px;min-width:20px;font-size:12px;opacity:1}" +
      ".aiu-bolla{max-width:calc(100vw - 24px);font-size:14.5px}}";
    document.head.appendChild(s);
  }

  function avvia() {
    stile();
    passata();
    if (!obs) {
      obs = new MutationObserver(function () { passata(); });
      obs.observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener("click", function () { chiudi(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") chiudi(); });
    window.addEventListener("resize", chiudi);
    /* se la pagina scorre la bolla resterebbe appesa nel vuoto */
    window.addEventListener("scroll", chiudi, true);
  }

  window.aiutiGestionale = { avvia: avvia, passata: passata, dizionario: AIUTI };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
