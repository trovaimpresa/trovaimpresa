/* ═══ 8 novembre 2026 — I VIDEO TUTORIAL E LA GUIDA «GUIDAMI» ══════════════
   Idea di Alex: su ogni voce del menu un puntino ▶ che fa partire il video
   di quella voce (con i sottotitoli), e una guida separata che ti porta per
   mano voce per voce.

   COME FUNZIONA
   - I video stanno in /video/tutorial/<data-tab>.mp4 (computer) e
     <data-tab>-tel.mp4 (telefono, registrato in verticale), coi sottotitoli gia'
     stampati dentro (fascia blu in basso: si leggono ovunque, anche se il
     video viene girato su WhatsApp). Li fa tools/tutorial/registra.py. L'elenco di quelli che esistono sta in
     /video/tutorial/elenco.json: il puntino compare SOLO sulle voci che
     hanno il video. Niente puntini che portano a un video che non c'e'.
   - La guida «Guidami» NON ha un elenco di passi scritto a mano: legge il
     menu cosi' com'e' in quel momento (voci visibili, nell'ordine in cui
     stanno). Se una voce si sposta, sparisce o nasce, la guida segue da
     sola. Le parole per ogni voce stanno in PAROLE; una voce nuova senza
     parole sue riceve la frase generica, non viene saltata.
   - Non cambia nessun data-tab e nessun pulsante: aggiunge soltanto.
   - Vale per impresa, artigiano e professionista (stesso file).
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  /* Il noleggio ha i suoi video (cartella sua): la pagina lo dice con
     <script src="/js/gest-tutorial.js" data-cartella="/video/tutorial/noleggio/">.
     Finche' la cartella non ha l'elenco, li' c'e' solo la guida «Guidami». */
  var CARTELLA = (document.currentScript && document.currentScript.getAttribute("data-cartella")) || "/video/tutorial/";
  function menu() { return document.querySelector(".side nav.tabs") || document.querySelector("nav.tabs"); }

  /* Le parole della guida, una riga per voce. Corte e semplici. */
  var PAROLE = {
    riepilogo:   "Questa è la pagina di partenza. Scrivi o parla come ti viene: ti aiuta lui.",
    preventivi:  "Qui fai i preventivi e li mandi al cliente. Quando accetta, diventano un lavoro.",
    computi:     "Qui fai il computo metrico, voce per voce, anche coi prezzari regionali.",
    lavori:      "Qui ci sono tutti i tuoi lavori: quelli da fare, in corso e finiti.",
    fatture:     "Qui fai le fatture e vedi chi ti deve ancora pagare.",
    clienti:     "Qui c'è la rubrica dei tuoi clienti, con telefono, indirizzo e lavori fatti.",
    calendario:  "Qui vedi i lavori e le scadenze giorno per giorno.",
    chat:        "Qui scrivi una domanda e l'AI ti risponde guardando i tuoi dati.",
    giornate:    "Qui segni le giornate della squadra. A fine mese esce il PDF.",
    dalsito:     "Qui arrivano le richieste di preventivo dei clienti dal sito.",
    promemoria:  "Qui scrivi le cose da ricordare. Ti arriva l'avviso al momento giusto.",
    scadenzario: "Qui ci sono le scadenze: revisioni, DURC, visite mediche, assicurazioni.",
    agenda:      "Qui vedi i lavori di ogni operaio.",
    squadra:     "Qui metti i tuoi operai e decidi cosa possono vedere dal telefono.",
    mezzi:       "Qui ci sono i tuoi mezzi, con revisioni e assicurazioni.",
    attrezzature:"Qui ci sono le attrezzature e dove si trovano.",
    fisco:       "Qui vedi le tasse da mettere da parte e le date da non dimenticare.",
    prezzario:   "Qui tieni i tuoi prezzi, così i preventivi si fanno prima.",
    sal:         "Qui ci sono gli stati di avanzamento dei lavori.",
    fornitori:   "Qui ci sono i fornitori e le loro fatture.",
    carte:       "Qui segni le spese fatte con la carta.",
    report:      "Qui vedi quanto hai guadagnato, lavoro per lavoro.",
    crediti:     "Qui tieni i crediti formativi.",
    galleria:    "Qui ci sono le foto dei cantieri.",
    mappa:       "Qui vedi i cantieri sulla mappa.",
    cestino:     "Qui finisce quello che butti. Si può recuperare.",
    richieste:   "Ti manca qualcosa? Scrivilo qui e lo costruiamo.",
    /* noleggio */
    "clienti-nol": "Qui c'è la rubrica dei clienti del noleggio.",
    noleggi:     "Qui registri i noleggi: chi ha preso il mezzo, quando lo riporta, quanto paga.",
    prodotti:    "Qui ci sono i prodotti che vendi o noleggi.",
    magazzino:   "Qui vedi quanta merce hai e quella sotto scorta.",
    movimenti:   "Qui vedi la merce entrata e uscita.",
    cauzioni:    "Qui vedi le cauzioni da restituire.",
    rendimento:  "Qui vedi quanto rende ogni mezzo.",
    documenti:   "Qui ci sono i contratti e i documenti.",
    media:       "Qui ci sono le foto e i video dei mezzi.",
    assistenza:  "Hai un problema? Scrivi qui e ti rispondiamo di persona."
  };
  var GENERICA = "Qui trovi «%s». Clicca per aprirla.";

  var videoCi = {};          /* data-tab -> true, letto da elenco.json */
  /* 8 nov 2026, scelta di Alex: il ▶ dell'«Assistente» (la prima voce) non apre
     un video ma la guida «Guidami». La voce «Guidami» in fondo al menu non c'e' piu'. */
  var VOCE_GUIDA = "riepilogo";

  /* ---------- stile ---------- */
  (function () {
    if (document.getElementById("tut-stile")) return;
    var st = document.createElement("style"); st.id = "tut-stile";
    st.textContent = ""
      /* il puntino ▶ sulla voce del menu */
      + "nav.tabs button[data-tab]{position:relative}"
      + ".tut-dot{margin-left:auto;flex:0 0 auto;width:30px;height:30px;border-radius:50%;"
      +   "display:inline-flex;align-items:center;justify-content:center;"
      +   "border:2px solid rgba(255,255,255,.75);background:transparent;cursor:pointer}"
      + ".tut-dot{color:#fff;order:99}"
      + ".tut-tri{display:block;width:0;height:0;margin-left:3px;border-left:11px solid currentColor;border-top:7px solid transparent;border-bottom:7px solid transparent}"
      + ".tut-dot:hover{background:#fff;color:#0a2a4d}"
      + ".side nav.tabs button.active .tut-dot{border-color:#0a2a4d;color:#0a2a4d}"
      + "nav.tabs button .tab-cnt{order:98}"
      + "nav.tabs button .tab-cnt:not(:empty)~.tut-dot{margin-left:10px}"
      /* nel menu a sinistra il ▶ sta sempre nello stesso punto, in colonna,
         anche quando la voce ha il numerino o il nome va a capo */
      + ".side nav.tabs button[data-tab]:has(.tut-dot){padding-right:54px!important}"
      + ".side nav.tabs button .tut-dot{position:absolute;right:12px;top:50%;transform:translateY(-50%);margin:0!important}"
      /* e il numerino arancione sta anche lui in colonna, subito a sinistra del ▶ */
      + ".side nav.tabs button[data-tab]:has(.tut-dot) .tab-cnt{position:absolute;right:50px;top:50%;transform:translateY(-50%);margin:0!important}"
      + ".side nav.tabs button[data-tab]:has(.tut-dot):has(.tab-cnt:not(:empty)){padding-right:86px!important}"

      /* il riquadro del video, a tutta pagina */
      + "#tut-player{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;position:fixed;inset:0;z-index:9000;background:rgba(6,20,40,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}"
      + "#tut-player .tp-testa{width:100%;max-width:1200px;display:flex;align-items:center;gap:16px;margin-bottom:16px}"
      + "#tut-player h2{flex:1;margin:0;color:#fff;font-size:28px;font-weight:800}"
      + "#tut-player .tp-x{min-height:52px;padding:0 22px;border-radius:12px;border:2px solid #fff;background:transparent;color:#fff;font:inherit;font-size:20px;font-weight:700;cursor:pointer}"
      + "#tut-player video{width:100%;max-width:1200px;max-height:78vh;border-radius:14px;background:#000}"
      + "@media(max-width:880px){#tut-player video{width:auto;max-width:100%;max-height:calc(100vh - 110px)}}"
      + "@media(max-width:880px){#tut-player{padding:12px}#tut-player h2{font-size:21px}#tut-player .tp-x{min-height:46px;font-size:18px;padding:0 16px}"
      + "}"

      /* la guida «Guidami» */
      + "#tut-velo{position:fixed;inset:0;z-index:8999;background:transparent}"
      + "#tut-buco{position:fixed;z-index:9001;border-radius:12px;box-shadow:0 0 0 4px #ff8800,0 0 0 9999px rgba(6,20,40,.72);pointer-events:none;transition:all .25s ease}"
      + "#tut-fumetto{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;position:fixed;z-index:9002;width:420px;max-width:calc(100vw - 24px);background:#fff;color:#0a2a4d;border-radius:16px;padding:22px 24px;box-shadow:0 12px 40px rgba(0,0,0,.35);transition:top .25s ease,left .25s ease}"
      + "#tut-fumetto .tf-n{font-size:16px;font-weight:700;color:#475569;margin-bottom:6px}"
      + "#tut-fumetto .tf-t{font-size:26px;font-weight:800;margin:0 0 8px}"
      + "#tut-fumetto .tf-p{font-size:20px;line-height:1.45;margin:0 0 18px;color:#0a2a4d}"
      + "#tut-fumetto .tf-bt{display:flex;gap:10px;flex-wrap:wrap}"
      + "#tut-fumetto button{min-height:52px;padding:0 20px;border-radius:12px;font:inherit;font-size:19px;font-weight:700;cursor:pointer;white-space:nowrap}"
      + "#tut-fumetto .tf-av{background:#0a2a4d;color:#fff;border:2px solid #0a2a4d;flex:1}"
      + "#tut-fumetto .tf-in{background:#fff;color:#0a2a4d;border:2px solid #0a2a4d}"
      + "#tut-fumetto .tf-esci{background:none;border:none;color:#475569;text-decoration:underline;padding:0 8px}"
      + "#tut-fumetto .tf-vid{display:flex;align-items:center;gap:10px;width:100%;margin-top:12px;background:#fff;color:#0a2a4d;border:2px solid #0a2a4d}"
      + "@media(max-width:880px){#tut-fumetto{left:12px!important;right:12px;width:auto;padding:18px}"
      +   "#tut-fumetto .tf-t{font-size:22px}#tut-fumetto .tf-p{font-size:18px}}"

      /* la voce «Guidami» in fondo al menu, sotto Aiuto */
      + ".side nav.tabs .tut-guida svg{width:22px;height:22px}"
      /* nel noleggio il menu e' una fila di schede in alto: «Guidami» e' una scheda come le altre */
      + "header nav.tabs .tut-guida svg{display:none}header nav.tabs .tut-guida small{display:none}header nav.tabs .tut-guida b{font-weight:inherit}";
    document.head.appendChild(st);
  })();

  var PLAY = '<i class="tut-tri" aria-hidden="true"></i>';

  function nomeVoce(b) {
    var s = b.querySelector("span:not(.tab-cnt):not(.tut-dot)") || b;
    var forte = s.querySelector && s.querySelector("b");
    return ((forte || s).textContent || "").trim();
  }
  function visibile(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return getComputedStyle(el).display !== "none" && !el.closest("[hidden]") && (r.width > 0 || r.height > 0 || el.closest(".side"));
  }

  /* ---------- i puntini ---------- */
  function mettiPuntini() {
    var m = menu(); if (!m) return;
    var bt = m.querySelectorAll("button[data-tab]");
    Array.prototype.forEach.call(bt, function (b) {
      var t = b.dataset.tab, c = b.querySelector(".tut-dot");
      var guida = t === VOCE_GUIDA;
      if (!videoCi[t] && !guida) { if (c) c.remove(); return; }
      if (c) return;
      c = document.createElement("span");
      c.className = "tut-dot"; c.setAttribute("role", "button");
      if (guida) { c.classList.add("tut-dot-guida"); c.setAttribute("title", "Guidami: ti mostro dove cliccare"); c.setAttribute("aria-label", "Guidami: ti mostro dove cliccare"); }
      else { c.setAttribute("title", "Guarda come si fa"); c.setAttribute("aria-label", "Guarda il video: " + nomeVoce(b)); }
      c.innerHTML = PLAY;
      b.appendChild(c);
    });
  }
  /* il clic sul puntino NON apre la sezione: apre il video */
  document.addEventListener("click", function (e) {
    var d = e.target.closest && e.target.closest(".tut-dot");
    if (!d) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var b = d.closest("button[data-tab]");
    if (d.classList.contains("tut-dot-guida")) avviaGuida();
    else apriVideo(b.dataset.tab, nomeVoce(b));
  }, true);

  /* ---------- il video ---------- */
  function apriVideo(tab, titolo) {
    chiudiVideo();
    var w = document.createElement("div"); w.id = "tut-player";
    w.innerHTML = '<div class="tp-testa"><h2>Come si usa: ' + esc(titolo) + '</h2>'
      + '<button class="tp-x" type="button">Chiudi ✕</button></div>'
      + '<video controls autoplay playsinline preload="auto" src="' + CARTELLA + tab + (telefono() ? '-tel' : '') + '.mp4"></video>';
    document.documentElement.appendChild(w);   /* fuori dal body: il noleggio ha body{zoom:1.2} e sposterebbe tutto */
    w.querySelector(".tp-x").onclick = chiudiVideo;
    w.addEventListener("click", function (e) { if (e.target === w) chiudiVideo(); });
    document.addEventListener("keydown", escVideo);
  }
  function escVideo(e) { if (e.key === "Escape") chiudiVideo(); }
  function chiudiVideo() {
    var w = document.getElementById("tut-player");
    if (w) { var v = w.querySelector("video"); if (v) v.pause(); w.remove(); }
    document.removeEventListener("keydown", escVideo);
  }
  window.tutorialApriVideo = apriVideo;

  /* ---------- la guida «Guidami» ---------- */
  var passi = [], qui = 0;
  function telefono() { return window.matchMedia("(max-width:880px)").matches; }

  function costruisciPassi() {
    var nav = menu(); if (!nav) return [];
    var out = [];
    Array.prototype.forEach.call(nav.querySelectorAll("button"), function (b) {
      if (b.classList.contains("tut-guida")) return;
      if (b.closest("[hidden]") || b.style.display === "none" || getComputedStyle(b).display === "none") return;
      var t = b.dataset.tab, nome = nomeVoce(b);
      if (!nome) return;
      var altro = /altro/.test(b.className);
      if (!t && !altro && !b.dataset.vai) return;
      var testo = t ? (PAROLE[t] || GENERICA.replace("%s", nome))
        : (b.dataset.vai ? GENERICA.replace("%s", nome) : "Qui dentro ci sono tutte le altre voci, divise per gruppi. Clicca per aprirle.");
      out.push({ el: b, tab: t, titolo: nome, testo: testo });
    });
    return out;
  }

  function avviaGuida() {
    chiudiVideo();
    if (telefono()) { var s = document.querySelector(".side"); if (s) s.classList.add("open"); }
    passi = costruisciPassi(); qui = 0;
    if (!passi.length) return;
    var v = document.createElement("div"); v.id = "tut-velo";
    var h = document.createElement("div"); h.id = "tut-buco";
    var f = document.createElement("div"); f.id = "tut-fumetto";
    var R = document.documentElement; R.appendChild(v); R.appendChild(h); R.appendChild(f);
    v.addEventListener("click", fermaGuida);
    document.addEventListener("keydown", tastiGuida);
    window.addEventListener("resize", disegna);
    disegna();
  }
  function tastiGuida(e) {
    if (e.key === "Escape") fermaGuida();
    else if (e.key === "ArrowRight") vai(1);
    else if (e.key === "ArrowLeft") vai(-1);
  }
  function vai(d) {
    qui += d;
    if (qui >= passi.length) return fermaGuida();
    if (qui < 0) qui = 0;
    disegna();
  }
  function disegna() {
    var p = passi[qui]; if (!p) return;
    var h = document.getElementById("tut-buco"), f = document.getElementById("tut-fumetto");
    if (!h || !f) return;
    try { p.el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }); } catch (_) { p.el.scrollIntoView(false); }
    /* la posizione si misura DOPO lo scorrimento, al giro dopo */
    clearTimeout(disegna._t);
    disegna._t = setTimeout(function () { posiziona(p); }, 40);
    var r = p.el.getBoundingClientRect(), m = 6;
    h.style.top = (r.top - m) + "px"; h.style.left = (r.left - m) + "px";
    h.style.width = (r.width + 2 * m) + "px"; h.style.height = (r.height + 2 * m) + "px";
    var ultimo = qui === passi.length - 1;
    f.innerHTML = '<div class="tf-n">' + (qui + 1) + ' di ' + passi.length + '</div>'
      + '<p class="tf-t">' + esc(p.titolo) + '</p>'
      + '<p class="tf-p">' + esc(p.testo) + '</p>'
      + '<div class="tf-bt">'
      + (qui > 0 ? '<button class="tf-in" type="button">← Indietro</button>' : '')
      + '<button class="tf-av" type="button">' + (ultimo ? 'Finito ✓' : 'Avanti →') + '</button>'
      + '<button class="tf-esci" type="button">Esci</button></div>'
      + (p.tab && videoCi[p.tab] ? '<button class="tf-vid" type="button">' + PLAY + ' Guarda il video</button>' : '');
    f.querySelector(".tf-av").onclick = function () { vai(1); };
    var ind = f.querySelector(".tf-in"); if (ind) ind.onclick = function () { vai(-1); };
    f.querySelector(".tf-esci").onclick = fermaGuida;
    var vid = f.querySelector(".tf-vid"); if (vid) vid.onclick = function () { var t = p.tab, n = p.titolo; fermaGuida(); apriVideo(t, n); };
    /* il fumetto: a destra della voce sul computer, sotto (o sopra) sul telefono */
    var fw = f.offsetWidth, fh = f.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var top, left;
    if (!telefono() && r.right + 24 + fw < vw) { left = r.right + 24; top = Math.max(12, Math.min(r.top - 10, vh - fh - 12)); }
    else { left = 12; top = (r.bottom + 16 + fh < vh) ? r.bottom + 16 : Math.max(12, r.top - fh - 16); }
    f.style.left = left + "px"; f.style.top = top + "px";
  }
  function posiziona(p) {
    var h = document.getElementById("tut-buco"), f = document.getElementById("tut-fumetto");
    if (!h || !f || passi[qui] !== p) return;
    var r = p.el.getBoundingClientRect(), m = 6;
    h.style.top = (r.top - m) + "px"; h.style.left = (r.left - m) + "px";
    h.style.width = (r.width + 2 * m) + "px"; h.style.height = (r.height + 2 * m) + "px";
    var fw = f.offsetWidth, fh = f.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, top, left;
    if (!telefono() && r.right + 24 + fw < vw) { left = r.right + 24; top = Math.max(12, Math.min(r.top - 10, vh - fh - 12)); }
    else { left = Math.max(12, Math.min(r.left, vw - fw - 12)); top = (r.bottom + 16 + fh < vh) ? r.bottom + 16 : Math.max(12, r.top - fh - 16); }
    f.style.left = left + "px"; f.style.top = top + "px";
  }
  function fermaGuida() {
    ["tut-velo", "tut-buco", "tut-fumetto"].forEach(function (id) { var x = document.getElementById(id); if (x) x.remove(); });
    document.removeEventListener("keydown", tastiGuida);
    window.removeEventListener("resize", disegna);
  }
  window.tutorialGuidami = avviaGuida;

  /* la voce «Guidami» in fondo al menu, dopo «Assistenza diretta» */
  function mettiGuidami() {
    var nav = menu();
    if (!nav || nav.querySelector(".tut-guida")) return;
    var ass = nav.querySelector('button[data-tab="assistenza"]');
    var b = document.createElement("button");
    b.type = "button"; b.className = "tab-cta tut-guida";
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg>'
      + '<span class="cta-txt"><b>Guidami</b><small>Ti mostro dove cliccare</small></span>';
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); avviaGuida(); });
    if (ass && ass.parentNode && ass.closest(".side")) ass.parentNode.insertBefore(b, ass.nextSibling); else nav.appendChild(b);
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function parti() {
    fetch(CARTELLA + "elenco.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (l) {
        (Array.isArray(l) ? l : []).forEach(function (t) { videoCi[t] = true; });
        mettiPuntini();
        /* il menu viene rimontato da altri file (menu corto, ruolo): si ripassa */
        var nav = menu();
        if (nav) new MutationObserver(function () { mettiPuntini(); }).observe(nav, { childList: true, subtree: true });
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(parti, 0); });
  else setTimeout(parti, 0);
})();
