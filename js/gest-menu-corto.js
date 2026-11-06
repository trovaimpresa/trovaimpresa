/* ═══ 28 settembre 2026 — IL MENU CORTO ════════════════════════════════════
   Il menu a sinistra aveva piu' di 20 voci: chi entra la prima volta non sa
   da dove partire. Ora in vista restano le voci di ogni giorno (PRINCIPALI)
   e tutte le altre stanno sotto «Altre N voci», che si apre con un clic.

   REGOLE (decise con Alessio il 28/09, aggiornate il 6/11):
   - 6 nov 2026 (ok di Alex, «facciamo tutti i 9 punti»): «Assistenza
     diretta» e «Chiedi una funzione» scendono IN FONDO al menu, sotto il
     titoletto «Aiuto». Prima stavano in cima, prima ancora del lavoro.
   - 6 nov 2026: dentro «Altre N voci» le voci stanno in GRUPPI col loro
     titoletto (GRUPPI qui sotto), non piu' tutte mischiate.
   - 6 nov 2026: sul TELEFONO i cinque pulsanti della barra in alto (Dati
     azienda, Commercialista, Backup, Esporta, Aiuto) stanno dentro il menu
     ☰, in fondo: la barra in alto sul telefono non c'e' piu' (css).
   - Il numerino rosso su «Altre N voci» dice quante voci nascoste hanno
     qualcosa da guardare (il loro contatore non e' vuoto).
   - Se la sezione aperta e' una di quelle nascoste (per esempio arrivi da
     un link dell'email ai Promemoria), il gruppo si apre da solo.
   - NON si ricorda: ad ogni apertura del gestionale parte corto (29/09).
   - Non cambia nessun data-tab e nessun pulsante: sposta solo i pulsanti
     che ci sono gia' dentro un contenitore. Il resto del gestionale li
     trova come prima (cerca per [data-tab], non per posizione).

   Vale per impresa, artigiano e professionista (stesso file
   gestionale-app.html). Le voci che il ruolo nasconde restano nascoste.
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  var PRINCIPALI = ["riepilogo", "chat", "clienti", "preventivi", "lavori", "giornate", "fatture", "calendario", "fisco"];   /* in ordine di partenza, come i Primi passi */
  var FISSE = ["richieste", "assistenza"];      /* vanno in fondo, sotto «Aiuto» */
  /* 6 nov 2026 — i gruppi dentro «Altre N voci». Una voce che non sta in
     nessun gruppo finisce in fondo, sotto «Altro»: non sparisce mai. */
  var GRUPPI = [
    { t: "Ogni giorno",        tabs: ["dalsito", "giornate", "promemoria", "scadenzario", "agenda"] },
    { t: "Squadra e mezzi",    tabs: ["squadra", "mezzi", "attrezzature"] },
    { t: "Conti e documenti",  tabs: ["computi", "prezzario", "sal", "fornitori", "carte", "report", "crediti"] },
    { t: "Archivio",           tabs: ["galleria", "mappa", "cestino"] }
  ];
  var CHIAVE = "ti-menu-altro-aperto";

  /* 6 nov 2026 — lo stile dei pezzi nuovi sta qui, non in css/gestionale.css:
     quel foglio lo usano anche il noleggio e l'app operaio, e la barra in alto
     da nascondere sul telefono c'e' solo in gestionale-app.html. */
  (function () {
    if (document.getElementById("ma-stile")) return;
    var st = document.createElement("style"); st.id = "ma-stile";
    st.textContent = ""
      + ".side nav.tabs .ma-gruppo,.side nav.tabs .ma-aiuto{font-size:14px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#b7cae6;margin:16px 4px 6px}"
      + ".side nav.tabs .ma-gruppo[hidden]{display:none}"
      + ".side nav.tabs .ma-aiuto{margin-top:22px}"
      + ".side .menu-strumenti{display:none}"
      + "@media(max-width:880px){"
      +   "#appview .topbar{display:none!important}"
      +   ".side.open .menu-strumenti{display:block;margin-top:-80px;padding:12px 0 120px;border-top:2px solid rgba(255,255,255,.35)}"
      +   ".side .menu-strumenti .ms-tit{font-size:14px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#b7cae6;margin:4px 4px 8px}"
      +   ".side .menu-strumenti .ms-btn{display:flex;align-items:center;gap:13px;width:100%;min-height:52px;padding:10px 12px;margin:0 0 6px;"
      +     "background:transparent;border:2px solid rgba(255,255,255,.45);border-radius:10px;color:#fff;font:inherit;font-size:17px;font-weight:600;text-align:left;cursor:pointer}"
      +   ".side .menu-strumenti .ms-btn svg{width:24px;height:24px;flex:0 0 auto;stroke:#fff}"
      + "}"
      /* 6 nov 2026 — LA SCHERMATA DEI REPARTI SUL TELEFONO: i 6 tasti in alto
         stanno dietro «Menu», e il logo e il titolo sono piu' bassi, cosi' i
         reparti si vedono senza scorrere. Sul computer non cambia niente. */
      + "#landing .lt-menu-btn{display:none}"
      + "@media(max-width:880px){"
      +   "#landing .landing-top{padding-top:64px!important}"
      +   "#landing .lt-menu-btn{display:flex;align-items:center;gap:8px;position:absolute;top:12px;right:12px;z-index:5;min-height:46px;padding:8px 16px;"
      +     "background:transparent;color:#fff;border:2px solid rgba(255,255,255,.75);border-radius:10px;font:inherit;font-size:18px;font-weight:700;cursor:pointer}"
      +   "#landing .lt-menu-btn svg{width:22px;height:22px;stroke:#fff}"
      +   "#landing .landing-top .lt-actions{display:none!important}"
      +   "#landing .landing-top.lt-aperto .lt-actions{display:flex!important;position:static!important;flex-direction:column;align-items:stretch;gap:8px;margin:0 0 14px}"
      +   "#landing .landing-top.lt-aperto .lt-actions .lt-btn{width:100%;min-height:50px;font-size:17px;justify-content:flex-start}"
      +   "#landing .landing-top.lt-aperto .lt-actions[hidden],#landing .landing-top.lt-aperto .lt-actions .lt-btn[hidden]{display:none!important}"
      +   "#landing .landing-top .gc-brand{height:104px!important;width:auto!important;margin:0 auto 6px!important;padding:0!important}"
      +   "#landing .landing-top h1{font-size:28px!important}"
      +   "#landing .landing-top small{font-size:16px!important}"
      + "}"
      /* 6 nov 2026 — IL CALENDARIO SUL TELEFONO: l'elenco giorno per giorno
         (c'era gia' dal 26 settembre) sale SOPRA la griglia dei numeri. Prima
         per arrivarci bisognava scorrere tutto il mese. */
      + "@media(max-width:760px){"
      +   "#calendario.active{display:flex!important;flex-direction:column}"
      +   "#calendario > .cal-head{order:0}#calendario > .ti-sez{order:1}"
      +   "#calendario > .cal-lista{order:2;margin-bottom:18px}"
      +   "#calendario > .cal-grid{order:3}#calendario > .cal-legend{order:4}"
      + "}";
    document.head.appendChild(st);
  })();

  function visibile(b) { return b.style.display !== "none" && getComputedStyle(b).display !== "none"; }

  function monta() {
    var nav = document.querySelector(".side nav.tabs");
    if (!nav || nav.querySelector(".menu-altro")) return;
    var lavoro = nav.querySelector(".side-group");
    if (!lavoro) return;

    /* 1. le voci principali, in ordine, subito sotto il titoletto «Lavoro» */
    var dopo = lavoro;
    PRINCIPALI.forEach(function (t) {
      var b = nav.querySelector('button[data-tab="' + t + '"]');
      if (b) { dopo.after(b); dopo = b; }
    });

    /* 1-bis. 1 nov 2026: «Ricarica crediti» (non ha data-tab: porta a
       un'altra pagina) sta sempre in vista, subito sotto la Chat con AI */
    var ric = nav.querySelector("#tab-ricarica");
    if (ric) {
      var ch = nav.querySelector('button[data-tab="chat"]');
      if (ch) ch.after(ric); else { dopo.after(ric); }
      if (dopo === ch) dopo = ric;
    }

    /* 2. il pulsante «Altre voci» e il contenitore */
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-altro";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg class="ma-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>'
      + '<span class="ma-t"></span><span class="ma-n" hidden></span>'
      + '<svg class="ma-f" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    var box = document.createElement("div");
    box.className = "menu-altro-box";
    box.hidden = true;
    dopo.after(btn);
    btn.after(box);

    /* 3. tutto il resto dentro il contenitore (tranne le due fisse),
       diviso nei GRUPPI col loro titoletto (6 nov 2026) */
    var resto = Array.prototype.slice.call(nav.querySelectorAll("button[data-tab]")).filter(function (b) {
      var t = b.dataset.tab;
      return PRINCIPALI.indexOf(t) < 0 && FISSE.indexOf(t) < 0;
    });
    function titoletto(testo) {
      var g = document.createElement("div");
      g.className = "ma-gruppo"; g.textContent = testo;
      box.appendChild(g); return g;
    }
    GRUPPI.forEach(function (gr) {
      gr.el = titoletto(gr.t);
      gr.tabs.forEach(function (t) {
        var b = resto.filter(function (x) { return x.dataset.tab === t; })[0];
        if (b) { box.appendChild(b); resto.splice(resto.indexOf(b), 1); }
      });
    });
    if (resto.length) { titoletto("Altro"); resto.forEach(function (b) { box.appendChild(b); }); }

    /* 3-bis. 6 nov 2026 — «Chiedi una funzione» e «Assistenza diretta» in
       fondo, sotto il titoletto «Aiuto». Restano dentro nav.tabs: il resto
       del gestionale le trova come prima (per data-tab). */
    var aiuto = document.createElement("div");
    aiuto.className = "ma-aiuto"; aiuto.textContent = "Aiuto";
    box.after(aiuto);
    var dopoAiuto = aiuto;
    FISSE.forEach(function (t) {
      var b = nav.querySelector('button[data-tab="' + t + '"]');
      if (b) { dopoAiuto.after(b); dopoAiuto = b; }
    });

    /* 3-ter. 6 nov 2026 — SUL TELEFONO i cinque pulsanti della barra in alto
       entrano nel menu ☰, in fondo. Sono COPIE: gli originali restano nella
       barra (che sul computer si vede come prima). Le copie stanno FUORI da
       nav.tabs apposta: li' ogni pulsante viene preso per una sezione. Il
       clic lo gestisce lo stesso ascoltatore di sempre (data-action). */
    var side = nav.closest(".side");
    var tb = document.querySelectorAll(".topbar .tb-actions .tb-btn");
    if (side && tb.length && !side.querySelector(".menu-strumenti")) {
      var ms = document.createElement("div");
      ms.className = "menu-strumenti";
      ms.innerHTML = '<div class="ms-tit">La tua azienda</div>';
      Array.prototype.forEach.call(tb, function (o) {
        var c = o.cloneNode(true);
        c.className = "ms-btn";
        c.removeAttribute("data-aiuto");
        /* la (i) che aiuti.js mette accanto ad «Aiuto» non si copia */
        Array.prototype.forEach.call(c.querySelectorAll(".ti-i"), function (x) { x.remove(); });
        ms.appendChild(c);
      });
      /* dopo il clic il menu si chiude, come per le altre voci */
      ms.addEventListener("click", function (e) {
        if (e.target.closest(".ms-btn")) side.classList.remove("open");
      });
      side.appendChild(ms);
    }
    /* il titoletto «Azienda/Studio» non serve piu': le voci sono tutte in «Altre» */
    Array.prototype.slice.call(nav.querySelectorAll(".side-group")).forEach(function (g) {
      if (g !== lavoro) g.style.display = "none";
    });

    function apri(si) {
      box.hidden = !si;
      btn.setAttribute("aria-expanded", si ? "true" : "false");
      btn.classList.toggle("aperto", si);
    }
    function aggiorna() {
      var voci = Array.prototype.slice.call(box.querySelectorAll("button[data-tab]")).filter(visibile);
      var avvisi = voci.filter(function (b) { var c = b.querySelector(".tab-cnt"); return c && c.textContent.trim() && c.textContent.trim() !== "0"; }).length;
      btn.querySelector(".ma-t").textContent = "Altre " + voci.length + " voci";
      /* un titoletto senza voci accese sotto non si vede */
      Array.prototype.forEach.call(box.querySelectorAll(".ma-gruppo"), function (g) {
        var c = false, x = g.nextElementSibling;
        while (x && !x.classList.contains("ma-gruppo")) { if (x.matches("button[data-tab]") && visibile(x)) { c = true; break; } x = x.nextElementSibling; }
        g.hidden = !c;
        /* allo studio tecnico «Squadra» si chiama «Collaboratori» */
        if (g.textContent === "Squadra e mezzi" || g.textContent === "Collaboratori e strumenti") {
          var sq = box.querySelector('button[data-tab="squadra"] span');
          g.textContent = (sq && /Collaboratori/.test(sq.textContent)) ? "Collaboratori e strumenti" : "Squadra e mezzi";
        }
      });
      var n = btn.querySelector(".ma-n");
      n.textContent = avvisi; n.hidden = !avvisi;
      btn.hidden = !voci.length;
      /* la sezione aperta sta qui dentro? allora si apre */
      if (box.querySelector("button[data-tab].active") && box.hidden) apri(true);
    }
    btn.addEventListener("click", function () { apri(box.hidden); });

    /* 29/09/2026: parte SEMPRE corto. Prima si ricordava «aperto» per sempre: bastava
       aprirlo una volta (o arrivare da un link) e restava aperto ogni volta. */
    try { localStorage.removeItem(CHIAVE); } catch (_) {}
    apri(false);
    aggiorna();

    /* 30/09/2026 — UNA VOCE PUO' SALIRE IN VISTA PER UN MESTIERE.
       Per gli studi tecnici il Computo metrico e' il lavoro principale, ma
       stava dentro «Altre voci». gest-core.js (adattaMenuProfessionista) lo
       chiede con menuCortoPromuovi('computi','clienti'). Se il menu corto non
       e' ancora montato, la richiesta aspetta in window._tiPromuovi. */
    window.menuCortoPromuovi = function (tab, dopoTab) {
      var b = nav.querySelector('button[data-tab="' + tab + '"]');
      var d = nav.querySelector('button[data-tab="' + dopoTab + '"]');
      if (b && d && d.nextElementSibling !== b) { d.after(b); aggiorna(); }
    };
    (window._tiPromuovi || []).forEach(function (p) { window.menuCortoPromuovi(p[0], p[1]); });

    /* 6 nov 2026 — IL VERSO OPPOSTO: una voce principale che per un mestiere
       non e' di tutti i giorni scende dentro «Altre voci», nel suo gruppo.
       Lo studio tecnico non ha giornate di cantiere: gest-reparti.js
       (adattaMenuProfessionista) chiede menuCortoInAltre('giornate'). */
    window.menuCortoInAltre = function (tab) {
      var b = nav.querySelector('button[data-tab="' + tab + '"]');
      if (!b || box.contains(b)) return;
      var gr = GRUPPI.filter(function (g) { return g.tabs.indexOf(tab) >= 0; })[0];
      if (gr && gr.el) {
        /* subito dopo il titoletto, rispettando l'ordine del gruppo */
        var dopo = gr.el, x = gr.el.nextElementSibling;
        var mio = gr.tabs.indexOf(tab);
        while (x && !x.classList.contains("ma-gruppo")) {
          if (x.dataset && gr.tabs.indexOf(x.dataset.tab) >= 0 && gr.tabs.indexOf(x.dataset.tab) < mio) dopo = x;
          x = x.nextElementSibling;
        }
        dopo.after(b);
      } else box.appendChild(b);
      aggiorna();
    };
    (window._tiInAltre || []).forEach(function (t) { window.menuCortoInAltre(t); });

    /* i contatori e le voci accese/spente cambiano mentre si lavora */
    var inAttesa = false;
    new MutationObserver(function () {
      if (inAttesa) return; inAttesa = true;
      setTimeout(function () { inAttesa = false; aggiorna(); }, 150);
    }).observe(nav, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style"] });
  }

  /* 6 nov 2026 — il tasto «Menu» della schermata dei reparti (si vede solo
     sul telefono, vedi lo stile qui sopra). Apre e chiude i tasti che c'erano
     gia': non li copia e non li sposta. */
  function montaLanding() {
    var top = document.querySelector("#landing .landing-top");
    if (!top || top.querySelector(".lt-menu-btn")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "lt-menu-btn";
    b.setAttribute("aria-expanded", "false");
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg><span>Menu</span>';
    b.addEventListener("click", function () {
      var si = !top.classList.contains("lt-aperto");
      top.classList.toggle("lt-aperto", si);
      b.setAttribute("aria-expanded", si ? "true" : "false");
      b.querySelector("span").textContent = si ? "Chiudi" : "Menu";
    });
    top.insertBefore(b, top.firstChild);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { monta(); montaLanding(); });
  else { monta(); montaLanding(); }
})();
