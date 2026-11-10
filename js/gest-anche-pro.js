/* =====================================================================
   TrovaImpresa — «SEI ANCHE UN PROFESSIONISTA?» (10 novembre 2026)

   Chiesto da Alessio: tante imprese e tanti artigiani sono ANCHE geometri,
   architetti o ingegneri. Nel menu c'e' un pulsante: se rispondono si',
   il gestionale si mostra con le schermate dello studio tecnico (Computo
   metrico vero, Pratiche, Parcella, Crediti formativi).

   COME FUNZIONA
   - Non si scrive niente nel database e il tipo dell'iscritto NON cambia:
     e' solo la FACCIA con cui si vede il gestionale. I dati sono gli stessi.
   - 10 nov 2026 (sera): la scelta sta nel database, imprese.faccia_gestionale
     ('professionista' o vuoto), e segue l'utente su tutti i dispositivi.
     localStorage ne tiene una copia. js/gest-reparti.js la legge in
     logRuoloUtente(), subito dopo il tipo vero, e mette ruoloUtente='professionista'.
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
  apLato();
}
/* 10 nov 2026 (3) — Alessio: «o entrambe». Lo stesso pulsante resta anche in
   fondo al menu di sinistra, dentro il reparto. La scatola cresce col testo
   (prima il testo usciva dal bordo). */
function apLato() {
  const side = document.querySelector("#appview aside.side"); if (!side) return;
  let l = document.getElementById("anche-pro-lato");
  if (!apPuo()) { if (l) l.remove(); return; }
  if (!l) {
    l = document.createElement("button"); l.type = "button"; l.id = "anche-pro-lato"; l.className = "anche-pro"; l.dataset.ap = "apri";
    const nav = side.querySelector("nav.tabs");
    if (nav && nav.nextSibling) side.insertBefore(l, nav.nextSibling); else side.appendChild(l);
  }
  const on = apAttiva();
  l.innerHTML = AP_IC + '<span><b>' + (on ? "Torna al " + apNomeVero() : "Sei anche un professionista?") + '</b>'
    + '<small>' + (on ? "Adesso vedi lo studio tecnico" : "Geometra, architetto, ingegnere") + '</small></span>';
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
    + '<p class="ap-testo">La scelta vale su tutti i tuoi telefoni e computer.</p>'
    + '</div></div></div>',
    '<button class="btn b-cancel" data-action="close">No, resto così</button><button class="btn-primary" data-ap="accendi">Sì, mostrami lo studio tecnico</button>');
}
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest && e.target.closest("[data-ap]"); if (!b) return;
  const a = b.dataset.ap;
  if (a === "apri") return apApri();
  if (a === "accendi" || a === "spegni") {
    b.disabled = true; b.textContent = "Un attimo…";
    (async function () {
      /* prima il database (vale su tutti i dispositivi), poi la copia qui */
      try {
        if (typeof sb !== "undefined" && sb && apUid) {
          const r = await sb.from("imprese").update({ faccia_gestionale: a === "accendi" ? "professionista" : null }).eq("user_id", apUid).select("id");
          if (r.error || !r.data || !r.data.length) {
            if (typeof toast === "function") toast("Non riesco a salvare la scelta: " + ((r.error && r.error.message) || "riprova"));
            b.disabled = false; b.textContent = "Riprova"; return;
          }
        }
        if (a === "accendi") localStorage.setItem(apChiave(), "professionista"); else localStorage.removeItem(apChiave());
      } catch (er) {}
      location.reload();
    })();
  }
});
