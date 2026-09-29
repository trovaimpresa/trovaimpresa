/* ═══ 29 settembre 2026 — IL MENU CORTO anche nel NOLEGGIO ═════════════════
   Stessa idea del gestionale imprese (gest-menu-corto.js), ma qui le voci
   stanno in orizzontale nella fascia blu in alto, non a sinistra.

   - In vista restano le voci di ogni giorno, IN ORDINE DI PARTENZA:
     Riepilogo, Clienti, Mezzi, Noleggi, Fatture, Calendario.
   - Subito dopo c'e' «Tasse e fisco»: le tasse sono della persona, non
     del noleggio, quindi porta alla sezione del gestionale principale
     (che dal 29/09 conta anche le fatture del noleggio).
   - Tutte le altre voci stanno dietro «Altre N voci», che si apre con un
     clic. Il numerino rosso dice quante voci nascoste hanno qualcosa da
     guardare (il loro contatore non e' vuoto).
   - Se la sezione aperta e' una di quelle nascoste, il gruppo si apre da
     solo. Aperto/chiuso si ricorda nel browser.
   - «Chiedi una funzione» e «Assistenza diretta» NON si toccano (qui sono
     i due riquadri in cima al Riepilogo; le linguette restano nascoste).

   ⚠️ Riepilogo resta il PRIMO pulsante: il codice della pagina accende
      «il pulsante numero 0» quando si esce da una scheda.
   ⚠️ I pulsanti aggiunti qui NON hanno data-tab: la pagina non li tratta
      come sezioni.
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  var PRINCIPALI = ["riepilogo", "clienti-nol", "mezzi", "noleggi", "fatture", "calendario"];
  var FISSE = ["richieste", "assistenza", "galleria"];   /* non si toccano mai */
  var CHIAVE = "ti-menu-altro-nol-aperto";

  function visibile(b) { return b.style.display !== "none"; }

  function monta() {
    var nav = document.querySelector("nav.tabs");
    if (!nav || nav.querySelector(".nol-altro")) return;

    /* 1. le voci principali, in ordine, in testa */
    var prima = null;
    PRINCIPALI.forEach(function (t) {
      var b = nav.querySelector('button[data-tab="' + t + '"]');
      if (!b) return;
      if (!prima) nav.insertBefore(b, nav.firstChild); else prima.after(b);
      prima = b;
    });
    if (!prima) return;

    /* 2. «Tasse e fisco» e «Altre voci» */
    var fisco = document.createElement("button");
    fisco.type = "button";
    fisco.className = "nol-fisco";
    fisco.textContent = "Tasse e fisco";
    fisco.addEventListener("click", function () { location.href = "/gestionale-app#fisco"; });
    prima.after(fisco);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nol-altro";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="ma-t"></span><span class="ma-n" hidden></span>'
      + '<svg class="ma-f" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    fisco.after(btn);

    /* 3. le altre, dopo il pulsante, segnate come «nascoste» */
    var altre = Array.prototype.slice.call(nav.querySelectorAll("button[data-tab]")).filter(function (b) {
      var t = b.dataset.tab;
      return PRINCIPALI.indexOf(t) < 0 && FISSE.indexOf(t) < 0;
    });
    var dopo = btn;
    altre.forEach(function (b) { b.classList.add("nol-altra"); dopo.after(b); dopo = b; });

    function apri(si) {
      nav.classList.toggle("nol-altre-aperte", si);
      btn.setAttribute("aria-expanded", si ? "true" : "false");
      btn.classList.toggle("aperto", si);
      try { localStorage.setItem(CHIAVE, si ? "1" : "0"); } catch (_) {}
    }
    function aggiorna() {
      var voci = altre.filter(visibile);
      var avvisi = voci.filter(function (b) { var c = b.querySelector(".tab-cnt"); return c && c.textContent.trim() && c.textContent.trim() !== "0"; }).length;
      btn.querySelector(".ma-t").textContent = nav.classList.contains("nol-altre-aperte") ? "Meno voci" : "Altre " + voci.length + " voci";
      var n = btn.querySelector(".ma-n");
      n.textContent = avvisi; n.hidden = !avvisi || nav.classList.contains("nol-altre-aperte");
      btn.hidden = !voci.length;
      if (!nav.classList.contains("nol-altre-aperte") && altre.some(function (b) { return b.classList.contains("active"); })) { apri(true); aggiorna(); }
    }
    btn.addEventListener("click", function () { apri(!nav.classList.contains("nol-altre-aperte")); aggiorna(); });

    var ricordato = null;
    try { ricordato = localStorage.getItem(CHIAVE); } catch (_) {}
    apri(ricordato === "1");
    aggiorna();

    var inAttesa = false;
    new MutationObserver(function () {
      if (inAttesa) return; inAttesa = true;
      setTimeout(function () { inAttesa = false; aggiorna(); }, 150);
    }).observe(nav, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", monta); else monta();
})();
