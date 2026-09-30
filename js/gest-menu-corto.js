/* ═══ 28 settembre 2026 — IL MENU CORTO ════════════════════════════════════
   Il menu a sinistra aveva piu' di 20 voci: chi entra la prima volta non sa
   da dove partire. Ora in vista restano le voci di ogni giorno (PRINCIPALI)
   e tutte le altre stanno sotto «Altre N voci», che si apre con un clic.

   REGOLE (decise con Alessio il 28/09):
   - «Assistenza diretta» e «Chiedi una funzione» NON si toccano: restano
     al loro posto, in cima. Questo file non le sposta mai.
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
  var PRINCIPALI = ["riepilogo", "chat", "clienti", "preventivi", "lavori", "fatture", "calendario", "fisco"];   /* in ordine di partenza, come i Primi passi */
  var FISSE = ["richieste", "assistenza"];      /* non si toccano mai */
  var CHIAVE = "ti-menu-altro-aperto";

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

    /* 3. tutto il resto dentro il contenitore (tranne le due fisse) */
    Array.prototype.slice.call(nav.querySelectorAll("button[data-tab]")).forEach(function (b) {
      var t = b.dataset.tab;
      if (PRINCIPALI.indexOf(t) >= 0 || FISSE.indexOf(t) >= 0) return;
      box.appendChild(b);
    });
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

    /* i contatori e le voci accese/spente cambiano mentre si lavora */
    var inAttesa = false;
    new MutationObserver(function () {
      if (inAttesa) return; inAttesa = true;
      setTimeout(function () { inAttesa = false; aggiorna(); }, 150);
    }).observe(nav, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", monta); else monta();
})();
