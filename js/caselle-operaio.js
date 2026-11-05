/* =====================================================================
   CASELLE ROSSE E VERDI — per l'APP OPERAIO (5 nov 2026)

   Gemello di js/caselle-controllo.js (noleggio) e del controllore del
   gestionale imprese (js/gest-ai-moduli.js), chiesto da Alex il 5 nov:
   «portalo anche li'».
   - casella scritta bene  -> VERDE con la ✓
   - casella sbagliata     -> ROSSA (o arancio) con la spiegazione sotto
   - casella vuota e non obbligatoria -> resta com'e'
   ⛔ AVVISA E NON BLOCCA: si salva lo stesso, come negli altri gestionali.

   Perche' un file a parte: l'app operaio non carica css/gestionale.css,
   quindi gli stili stanno qui dentro (stessi colori e stesse parole
   «DA CORREGGERE» / «DA GUARDARE» degli altri gestionali).
   Ascolta le caselle dall'esterno, per id: non tocca niente dell'app.
   ===================================================================== */
(function () {
  "use strict";
  function num(v) {
    var t = String(v || "").replace(/€/g, "").trim();
    if (!t) return null;
    if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", ".");
    var n = Number(t);
    return isNaN(n) ? NaN : n;
  }
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function obbligatorio(frase) { return function (v) { return v ? null : ["rosso", frase]; }; }
  function euro(obblig) {
    return function (v) {
      var n = num(v);
      if (n === null) return obblig ? ["rosso", obblig] : null;
      if (isNaN(n)) return ["rosso", "Scrivi solo il numero (es. 24 o 24,50)."];
      if (n < 0) return ["rosso", "Un importo non può essere negativo."];
      if (n === 0) return ["arancio", "L'importo è zero: è giusto?"];
      if (n > 5000) return ["arancio", "È più di 5.000 €: controlla di non aver scritto uno zero in più."];
      return null;
    };
  }

  var REGOLE = {
    /* Spesa del lavoro */
    "sp-des": obbligatorio("Scrivi per cosa hai speso: il capo deve capire che spesa è."),
    "sp-imp": euro("Manca l'importo della spesa."),
    /* Spesa dettata con «Parla» */
    "rv-v-des": obbligatorio("Scrivi per cosa hai speso."),
    "rv-v-imp": euro("Manca l'importo."),
    /* Preventivo dal cantiere */
    "op-p-tit": obbligatorio("Dai un nome al preventivo (es. Rossi - bagno): se no non lo ritrovi."),
    "op-p-imp": function (v) {
      var n = num(v);
      if (n === null) return null;
      if (isNaN(n)) return ["rosso", "Scrivi solo il numero (es. 4500)."];
      if (n <= 0) return ["rosso", "L'importo deve essere più di zero."];
      return null;
    },
    /* Racconta la giornata */
    "mg-cosa": obbligatorio("Racconta cosa hai fatto: senza, la giornata resta vuota."),
    "mg-dove": obbligatorio("Scrivi dove hai lavorato."),
    "mg-data": function (v) {
      if (!v) return ["rosso", "Manca il giorno."];
      return v > oggi() ? ["rosso", "Questo giorno non è ancora arrivato."] : null;
    }
  };
  var PAROLA = { rosso: "DA CORREGGERE", arancio: "DA GUARDARE" };

  function stile() {
    if (document.getElementById("caselle-operaio-stile")) return;
    var s = document.createElement("style");
    s.id = "caselle-operaio-stile";
    s.textContent =
      ".ctr-rosso{border-color:#b42318 !important;box-shadow:0 0 0 3px #fdecec !important}" +
      ".ctr-arancio{border-color:#D97706 !important;box-shadow:0 0 0 3px #FFF7ED !important}" +
      ".ctr-verde{border-color:#1e8e3e !important;box-shadow:0 0 0 3px #e3f4e8 !important;" +
        "background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e8e3e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\") !important;" +
        "background-repeat:no-repeat !important;background-position:right 10px center !important;background-size:20px !important;padding-right:38px !important}" +
      "textarea.ctr-verde{background-position:right 10px top 12px !important}" +
      ".ctr-msg{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;margin:8px 0 4px;font-size:15px;line-height:1.5;font-weight:600}" +
      ".ctr-msg--rosso{color:#b42318}.ctr-msg--arancio{color:#B45309}" +
      ".ctr-mk{flex:0 0 auto;font-size:13px;font-weight:800;letter-spacing:.5px;padding:3px 8px;border-radius:6px;white-space:nowrap}" +
      ".ctr-msg--rosso .ctr-mk{background:#fdecec;color:#b42318}.ctr-msg--arancio .ctr-mk{background:#FFF7ED;color:#B45309}" +
      ".ctr-msg-t{flex:1 1 200px;min-width:0}";
    document.head.appendChild(s);
  }

  function esito(el) {
    var f = REGOLE[el.id];
    if (!f) return null;
    try { return f(String(el.value || "").trim()); } catch (e) { return null; }
  }
  function togli(el) {
    el.classList.remove("ctr-rosso", "ctr-arancio", "ctr-verde");
    var d = el.nextElementSibling;
    if (d && d.classList && d.classList.contains("ctr-msg")) d.remove();
  }
  function guarda(el) {
    if (!el || !el.id || !REGOLE[el.id]) return;
    stile();
    togli(el);
    var e = esito(el);
    if (e) {
      el.classList.add("ctr-" + e[0]);
      var m = document.createElement("div");
      m.className = "ctr-msg ctr-msg--" + e[0];
      var mk = document.createElement("span"); mk.className = "ctr-mk"; mk.textContent = PAROLA[e[0]];
      var tx = document.createElement("span"); tx.className = "ctr-msg-t"; tx.textContent = e[1];
      m.appendChild(mk); m.appendChild(tx);
      el.parentNode.insertBefore(m, el.nextSibling);
    } else if (el.type !== "date" && String(el.value || "").trim()) {
      el.classList.add("ctr-verde");
    }
  }

  /* si ascolta tutta la pagina: i moduli nascono e muoiono */
  document.addEventListener("focusout", function (ev) { var el = ev.target; if (el && el.id && REGOLE[el.id]) guarda(el); }, true);
  /* una casella gia' colorata si ricolora MENTRE la correggi */
  document.addEventListener("input", function (ev) {
    var el = ev.target;
    if (!el || !el.id || !REGOLE[el.id] || !el.classList) return;
    if (el.classList.contains("ctr-rosso") || el.classList.contains("ctr-arancio") || el.classList.contains("ctr-verde")) guarda(el);
  }, true);
  document.addEventListener("change", function (ev) { var el = ev.target; if (el && el.id === "mg-data") guarda(el); }, true);

  window._caselleOperaio = { regole: REGOLE };
})();
