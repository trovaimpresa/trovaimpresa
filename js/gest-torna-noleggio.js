/* ============================================================
   «← TORNA AL NOLEGGIO» — 12 nov 2026 (terzo giro del controllore)
   Dal Noleggio le voci «Tasse e fisco», «Giornate» e «Acquisti» portano
   qui, nel gestionale principale. Prima non c'era modo di tornare: ci si
   ritrovava in un reparto senza sapere perché. Adesso, se arrivi dal
   Noleggio, in cima alla pagina c'è il pulsante per tornarci.
   Il ricordo sta in sessionStorage (lo scrive js/nol-menu-corto.js) e si
   cancella quando torni o quando vai ai Reparti.
   ============================================================ */
(function () {
  function dalNoleggio() { try { return sessionStorage.getItem("ti_dal_noleggio") === "1"; } catch (e) { return false; } }
  function dimentica() { try { sessionStorage.removeItem("ti_dal_noleggio"); } catch (e) {} }
  function metti() {
    if (!dalNoleggio() || document.getElementById("torna-noleggio")) return;
    var s = document.querySelector("section");
    if (!s || !s.parentElement) return;
    var riga = document.createElement("div");
    riga.id = "torna-noleggio";
    riga.style.cssText = "margin:0 0 14px";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.textContent = "\u2190 Torna al Noleggio";
    b.style.cssText = "min-height:48px;font-size:17px;font-weight:700;padding:0 18px";
    b.addEventListener("click", function () { dimentica(); location.href = "/gestionale-noleggio"; });
    riga.appendChild(b);
    s.parentElement.insertBefore(riga, s.parentElement.firstChild);
  }
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-action="home"]') : null;
    if (t) { dimentica(); var r = document.getElementById("torna-noleggio"); if (r) r.remove(); }
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", metti); else metti();
  setTimeout(metti, 1500);
})();
