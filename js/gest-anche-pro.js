/* =====================================================================
   TrovaImpresa — «SEI ANCHE UN PROFESSIONISTA?» (10 novembre 2026)

   Chiesto da Alessio: tante imprese e tanti artigiani sono ANCHE geometri,
   architetti o ingegneri. Nel menu c'e' un pulsante: se rispondono si',
   il gestionale si mostra con le schermate dello studio tecnico (Computo
   metrico vero, Pratiche, Parcella, Crediti formativi).

   COME FUNZIONA
   - Non si scrive niente nel database e il tipo dell'iscritto NON cambia:
     e' solo la FACCIA con cui si vede il gestionale. I dati sono gli stessi.
   - La scelta resta su questo telefono/computer (localStorage, una chiave
     per utente). js/gest-reparti.js la legge in logRuoloUtente(), subito
     dopo aver letto il tipo vero, e mette ruoloUtente='professionista'.
   - Si torna indietro dallo stesso pulsante.
   ⛔ Vale solo per chi e' impresa o artigiano. Lo studio tecnico non lo vede.
   ⛔ File non chiuso in una funzione: usa openSheetGrande, closeSheet, esc
      solo DENTRO le funzioni.
   ===================================================================== */
const AP_IC = '<svg viewBox="0 0 24 24" class="ti-ic" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01"/></svg>';
let apUid = "";
function apChiave(uid) { return "ti_faccia_" + (uid || apUid || ""); }
function apAttiva(uid) { try { return localStorage.getItem(apChiave(uid)) === "professionista"; } catch (e) { return false; } }
function apPuo() { const t = String(window._tiTipoVero || "").toLowerCase(); return t === "impresa" || t === "artigiano"; }
function apNomeVero() { return String(window._tiTipoVero || "").toLowerCase() === "artigiano" ? "Gestionale artigiano" : "Gestionale impresa"; }

/* la chiama logRuoloUtente (js/gest-reparti.js) quando sa chi sei */
function ancheProDisegna(uid) {
  if (uid) apUid = uid;
  /* 10 nov 2026 (2) — Alessio: «perché non lo mettiamo qui, in alto?».
     Sta nella barra in alto della pagina dei reparti, insieme a Dati azienda,
     Noleggio e App operaio. Dal menu di sinistra e' stato tolto. */
  const vicino = document.querySelector('.lt-btn[data-action="appoperaio"]');
  const barra = vicino && vicino.parentElement; if (!barra) return;
  let b = document.getElementById("anche-pro");
  if (!apPuo()) { if (b) b.remove(); return; }
  if (!b) {
    b = document.createElement("button"); b.type = "button"; b.id = "anche-pro"; b.className = "lt-btn anche-pro-alto"; b.dataset.ap = "apri";
    barra.insertBefore(b, barra.firstChild);
  }
  b.innerHTML = AP_IC + (apAttiva() ? "Torna al " + apNomeVero() : "Sei anche un professionista?");
}
function apApri() {
  const on = apAttiva();
  if (on) {
    openSheetGrande("Torna al " + apNomeVero(),
      '<div class="sh-cols"><div class="sh-col"><div class="sh-b"><div class="sh-tit">Vuoi tornare com\'era?</div>'
      + '<p class="ap-testo">Il gestionale torna con le schermate di prima. <b>I tuoi dati restano tutti</b>: computi, pratiche, parcelle e clienti non si toccano.</p>'
      + '</div></div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button><button class="btn-primary" data-ap="spegni">Sì, torna al ' + esc(apNomeVero()) + '</button>');
    return;
  }
  openSheetGrande("Sei anche un professionista?",
    '<div class="sh-cols"><div class="sh-col"><div class="sh-b"><div class="sh-tit">Cosa cambia</div>'
    + '<p class="ap-testo">Se fai anche il <b>geometra</b>, l\'<b>architetto</b> o l\'<b>ingegnere</b>, il gestionale ti mostra le schermate dello studio tecnico:</p>'
    + '<ul class="ap-lista"><li><b>Computo metrico</b> completo, con le misure</li><li><b>Pratiche</b>: CILA, SCIA, catasto, protocollo</li><li><b>Parcella</b> con cassa e ritenuta</li><li><b>Crediti formativi</b></li></ul>'
    + '</div></div><div class="sh-col"><div class="sh-b"><div class="sh-tit">Cosa resta uguale</div>'
    + '<p class="ap-testo"><b>I tuoi dati restano tutti</b>: clienti, lavori, preventivi e fatture.</p>'
    + '<p class="ap-testo">Torni indietro quando vuoi, dallo <b>stesso pulsante</b> nel menu.</p>'
    + '<p class="ap-testo">La scelta vale su questo telefono o computer.</p>'
    + '</div></div></div>',
    '<button class="btn b-cancel" data-action="close">No, resto così</button><button class="btn-primary" data-ap="accendi">Sì, mostrami lo studio tecnico</button>');
}
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest && e.target.closest("[data-ap]"); if (!b) return;
  const a = b.dataset.ap;
  if (a === "apri") return apApri();
  if (a === "accendi" || a === "spegni") {
    try { if (a === "accendi") localStorage.setItem(apChiave(), "professionista"); else localStorage.removeItem(apChiave()); }
    catch (er) { if (typeof toast === "function") toast("Su questo telefono non riesco a ricordare la scelta"); return; }
    b.disabled = true; b.textContent = "Un attimo…";
    location.reload();
  }
});
