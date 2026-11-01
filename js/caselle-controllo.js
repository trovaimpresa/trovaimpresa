/* =====================================================================
   CASELLE ROSSE E VERDI — per il GESTIONALE NOLEGGIO (1 nov 2026)

   Stessa idea del controllore del gestionale imprese (js/gest-ai-moduli.js):
   - casella scritta bene  -> VERDE con la ✓
   - casella sbagliata     -> ROSSA (o arancio) con la spiegazione sotto
   - casella vuota e non obbligatoria -> resta grigia
   - in fondo, sopra i pulsanti: «Via libera» oppure «N da correggere»
   ⛔ AVVISA E NON BLOCCA: si salva lo stesso.
   ⚠️ Verde vuol dire «scritto bene», non «giusto»: una regola vede la
      forma, non i conti.

   Perche' un file a parte: il noleggio ha tutto il codice chiuso dentro
   una funzione e non carica il controllore delle imprese. Questo file
   non tocca niente del noleggio: ascolta le caselle dall'esterno (per
   nome) e le colora. Gli stili (.ctr-verde, .ctr-rosso, .via-libera...)
   stanno in css/gestionale.css, gia' caricato dalla pagina.
   Le regole sono codice normale, non AI: gratis e immediate.
   ===================================================================== */
(function () {
  "use strict";
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function cifre(v) { return String(v || "").replace(/\D/g, ""); }
  function num(v) {
    var t = String(v || "").replace(/€/g, "").trim();
    if (!t) return null;
    if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", ".");
    var n = Number(t);
    return isNaN(n) ? NaN : n;
  }
  function pivaOk(n) {
    if (!/^\d{11}$/.test(n)) return false;
    var t = 0;
    for (var i = 0; i < 10; i++) { var c = +n[i]; if (i % 2 === 1) { c *= 2; if (c > 9) c -= 9; } t += c; }
    return ((10 - t % 10) % 10) === +n[10];
  }
  function ibanOk(v) {
    var s = String(v || "").replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    if (s.slice(0, 2) === "IT" && s.length !== 27) return false;
    var r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, function (c) { return String(c.charCodeAt(0) - 55); });
    var m = 0;
    for (var i = 0; i < r.length; i++) m = (m * 10 + (+r[i])) % 97;
    return m === 1;
  }
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function val(id) { var e = document.getElementById(id); return e ? String(e.value || "").trim() : ""; }

  /* --- le regole: ogni funzione riceve il valore e torna null (va bene)
         oppure [gravita', frase]. --- */
  function obbligatorio(frase) { return function (v) { return v ? null : ["rosso", frase]; }; }
  function email(v) { return !v || EMAIL.test(v) ? null : ["rosso", "Questa email non è scritta bene: le manca la chiocciola o il punto finale (es. nome@gmail.com)."]; }
  function piva(v) {
    if (!v) return null;
    var c = cifre(v);
    if (/^[A-Za-z0-9]{16}$/.test(v.replace(/\s/g, ""))) return null;   /* e' un codice fiscale */
    if (c.length !== 11) return ["rosso", "La partita IVA ha 11 cifre, questa ne ha " + c.length + "."];
    if (!pivaOk(c)) return ["rosso", "Questa partita IVA ha 11 cifre ma una è sbagliata: l'ultima non torna con le altre."];
    return null;
  }
  function telefono(v) {
    if (!v) return null;
    var c = cifre(v);
    return (c.length >= 6 && c.length <= 13) ? null : ["arancio", "Questo numero ha " + c.length + " cifre: un telefono ne ha di solito 9 o 10."];
  }
  function euro(v) {
    var n = num(v);
    if (n === null) return null;
    if (isNaN(n)) return ["rosso", "Scrivi solo il numero (es. 120 o 120,50)."];
    if (n < 0) return ["rosso", "Un importo non può essere negativo."];
    return null;
  }
  function quantita(v) {
    var n = num(v);
    if (n === null) return null;
    if (isNaN(n)) return ["rosso", "Scrivi solo il numero."];
    if (n < 0) return ["rosso", "Non può essere negativo."];
    return null;
  }
  function percento(v) {
    var n = num(String(v).replace("%", ""));
    if (n === null) return null;
    if (isNaN(n) || n < 0 || n > 100) return ["rosso", "È una percentuale: va da 0 a 100."];
    return null;
  }
  function dopoDi(altro, frase) {
    return function (v) { var a = val(altro); return (v && a && v < a) ? ["rosso", frase] : null; };
  }
  function nonMenoDi(altro, frase) {
    return function (v) { var a = num(val(altro)), b = num(v); return (a != null && b != null && !isNaN(a) && !isNaN(b) && b < a) ? ["rosso", frase] : null; };
  }

  var REGOLE = {
    /* Dati azienda */
    "a-nome": obbligatorio("Manca il nome dell'azienda: sui contratti e sulle fatture uscirebbe vuoto."),
    "a-piva": piva, "a-email": email, "a-tel": telefono,
    "a-iban": function (v) { return !v || ibanOk(v) ? null : ["rosso", "Questo IBAN non torna: c'è una cifra sbagliata o ne manca una (in Italia sono 27 caratteri). Il cliente pagherebbe sul conto sbagliato."]; },
    /* Cliente */
    "ncl-nome": obbligatorio("Manca il nome del cliente: senza, questa scheda non la ritrovi più."),
    "ncl-piva": piva, "ncl-email": email, "ncl-telefono": telefono,
    /* Mezzo */
    "nz-nome": obbligatorio("Manca il nome del mezzo: nei noleggi uscirebbe una riga vuota."),
    "nz-tora": euro, "nz-tgiorno": euro, "nz-tsett": euro, "nz-tmese": euro, "nz-toraextra": euro,
    "nz-tkm": euro, "nz-usurafissa": euro, "nz-cauzione": euro, "nz-usuraperc": percento,
    "nz-oreincl": quantita, "nz-kmincl": quantita, "nz-contakm": quantita, "nz-contaore": quantita, "nz-vmesi": quantita,
    /* Prodotto e magazzino */
    "np-nome": obbligatorio("Manca il nome del prodotto."),
    "np-prezzo": function (v) {
      var e = euro(v); if (e) return e;
      var p = num(v), a = num(val("np-acquisto"));
      return (p != null && a != null && !isNaN(p) && !isNaN(a) && p < a) ? ["arancio", "Lo vendi a meno di quanto lo paghi: ci perdi su ogni pezzo."] : null;
    },
    "np-acquisto": euro, "np-iva": percento, "np-quantita": quantita, "np-soglia": quantita,
    "ng-quantita": quantita, "ng-soglia": quantita,
    "nm-quantita": quantita, "nm-importo": euro,
    /* Noleggio */
    "nn-importo": euro, "nn-cauzione": euro,
    "nn-prevista": dopoDi("nn-uscita", "Il rientro previsto è prima dell'uscita: controlla le due date."),
    "nn-effettivo": dopoDi("nn-uscita", "Il rientro è prima dell'uscita: controlla le due date."),
    "nn-km-rie": nonMenoDi("nn-km-usc", "I km al rientro sono meno di quelli all'uscita: il contachilometri non torna indietro."),
    "nn-contaore-rie": nonMenoDi("nn-contaore-usc", "Le ore al rientro sono meno di quelle all'uscita: il contaore non torna indietro."),
    /* Fattura */
    "nf-piva": piva, "nf-email": email, "nf-telefono": telefono,
    "nf-al": dopoDi("nf-dal", "Il periodo finisce prima di cominciare: controlla le due date."),
    /* Promemoria */
    "p-testo": obbligatorio("Scrivi cosa ti devo ricordare: senza, l'email del mattino arriva vuota."),
    "p-data": function (v) {
      if (!v) return ["rosso", "Manca il giorno: senza data il promemoria non parte mai."];
      return v < oggi() ? ["arancio", "Questo giorno è già passato: l'avviso non arriverà più."] : null;
    }
  };
  /* quando cambia una casella, si riguarda anche quella collegata */
  var COLLEGATE = { "nn-uscita": ["nn-prevista", "nn-effettivo"], "nn-km-usc": ["nn-km-rie"],
    "nn-contaore-usc": ["nn-contaore-rie"], "nf-dal": ["nf-al"], "np-acquisto": ["np-prezzo"] };
  var PAROLA = { rosso: "DA CORREGGERE", arancio: "DA GUARDARE" };

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
    } else {
      var t = el.tagName, ty = (el.type || "").toLowerCase();
      var testo = t === "TEXTAREA" || (t === "INPUT" && ty !== "checkbox" && ty !== "radio" && ty !== "file" && ty !== "hidden");
      if (testo && String(el.value || "").trim()) el.classList.add("ctr-verde");
    }
    barra(el);
  }
  function barra(el) {
    var foglio = el.closest && el.closest(".sheet");
    if (!foglio) return;
    var rossi = 0, altri = 0, primo = null;
    Array.prototype.forEach.call(foglio.querySelectorAll("input,textarea,select"), function (c) {
      if (!c.id || !REGOLE[c.id]) return;
      if (c.offsetParent === null && c.type !== "hidden") return;   /* caselle nascoste: non contano */
      var e = esito(c);
      if (!e) return;
      if (e[0] === "rosso") rossi++; else altri++;
      if (!primo) primo = c;
    });
    var b = foglio.querySelector(".via-libera");
    if (!b) {
      b = document.createElement("button"); b.type = "button"; b.className = "via-libera";
      b.addEventListener("click", function () {
        if (b.classList.contains("si")) return;
        Array.prototype.forEach.call(foglio.querySelectorAll("input,textarea,select"), function (c) { if (REGOLE[c.id]) guarda(c); });
        var m = foglio.querySelector(".ctr-msg");
        if (m && m.scrollIntoView) m.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      var piede = foglio.querySelector(".sh-foot");
      if (piede && piede.parentNode) piede.parentNode.insertBefore(b, piede); else foglio.appendChild(b);
    }
    b.classList.remove("si", "no", "forse");
    if (!rossi && !altri) { b.classList.add("si"); b.textContent = "✓ Via libera: tutto scritto bene"; return; }
    var pezzi = [];
    if (rossi) pezzi.push(rossi === 1 ? "1 da correggere" : rossi + " da correggere");
    if (altri) pezzi.push(altri === 1 ? "1 da guardare" : altri + " da guardare");
    b.classList.add(rossi ? "no" : "forse");
    b.textContent = "✗ " + pezzi.join(", ") + " — tocca qui per vederle. Puoi salvare lo stesso";
  }

  /* si ascolta tutta la pagina: le finestre nascono e muoiono */
  document.addEventListener("focusout", function (ev) {
    var el = ev.target;
    if (!el || !el.id) return;
    if (REGOLE[el.id]) guarda(el);
    (COLLEGATE[el.id] || []).forEach(function (id) {
      var c = document.getElementById(id);
      if (c && (String(c.value || "").trim() || c.classList.contains("ctr-rosso"))) guarda(c);
    });
  }, true);
  /* una casella gia' colorata si ricolora MENTRE la correggi */
  document.addEventListener("input", function (ev) {
    var el = ev.target;
    if (!el || !el.id || !REGOLE[el.id] || !el.classList) return;
    if (el.classList.contains("ctr-rosso") || el.classList.contains("ctr-arancio") || el.classList.contains("ctr-verde")) guarda(el);
  }, true);
  document.addEventListener("change", function (ev) {
    var el = ev.target;
    if (el && el.id && REGOLE[el.id] && (el.type === "date" || el.tagName === "SELECT")) guarda(el);
  }, true);

  window._caselleControllo = { regole: REGOLE, pivaOk: pivaOk, ibanOk: ibanOk };
})();
