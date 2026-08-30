/* ============================================================
   numero-italiano.js — TrovaImpresa, 30 agosto 2026

   COME SI LEGGE UN NUMERO SCRITTO A MANO DA UN ITALIANO.

   PERCHE' ESISTE. Nei pannelli i soldi si leggevano cosi':
       parseInt("1.500")     ->  1      (prezzo del preventivo al cliente)
       Number("2.480,50")    ->  NaN    (importi del cantiere)
   Provato dal vivo il 30 agosto 2026: un preventivo e' partito al cliente
   con prezzo minimo 1,00 € e massimo 2,00 € invece di 1.500 € e 2.800 €.
   E scrivendo «1500,50» in una casella type="number" il numero spariva
   del tutto, senza nemmeno un avviso.

   LA REGOLA, in una riga: l'ULTIMO fra virgola e punto e' quello dei
   decimali, tutti gli altri sono separatori delle migliaia.

     1.250,00  -> l'ultimo e' la virgola -> 1250
     1,250.00  -> l'ultimo e' il punto   -> 1250   (scritto all'inglese)
     3,20      -> una virgola sola       -> 3,20
     3.20      -> un punto solo, 2 cifre -> 3,20
     1.250     -> un punto solo, 3 cifre -> 1250   (migliaia)
     0.500     -> comincia per zero      -> 0,50   (mai migliaia dopo lo 0)

   Torna null quando non e' un numero (casella vuota, lettere). Chi la usa
   decide se e' un errore o un campo lasciato vuoto apposta: qui non si
   inventa uno zero, perche' uno zero silenzioso e' esattamente il difetto
   che stiamo chiudendo.

   ⛔ QUESTA REGOLA STA IN DUE POSTI, E VANNO TENUTI UGUALI.
   L'originale e' `_numeroIt` dentro js/gest-computo.js (gestionale, 11
   agosto 2026). Qui e' COPIATA parola per parola, non riscritta: il
   gestionale non carica questo file e i pannelli non caricano quello.
   Se un giorno la regola cambia, si cambia in tutti e due i posti.
   Il banco prove-claude/banco-numero-italiano.js fa girare le due copie
   fianco a fianco sugli stessi casi e diventa rosso se si allontanano.

   COME SI USA, nella pagina, PRIMA di chi la chiama:
       <script src="/js/numero-italiano.js"></script>
   ============================================================ */
(function () {
  'use strict';

  function numeroItaliano(testo) {
    /* via euro, spazi normali, spazi insecabili e apostrofi delle migliaia */
    var t = String(testo == null ? "" : testo).replace(/[€\s '’]/g, "").trim();
    if (t === "") return null;
    var vir = t.lastIndexOf(","), pun = t.lastIndexOf(".");
    if (vir >= 0 && pun >= 0) {
      if (vir > pun) t = t.replace(/\./g, "").replace(/,/g, ".");   /* italiano */
      else           t = t.replace(/,/g, "");                       /* inglese  */
    } else if (vir >= 0) {
      /* piu' virgole e nessun punto = migliaia all'inglese (1,250,000) */
      t = ((t.split(",").length - 1) > 1) ? t.replace(/,/g, "") : t.replace(",", ".");
    } else if (pun >= 0) {
      var punti = t.split(".").length - 1;
      var dopo = t.length - pun - 1;
      /* prima dell'ultimo punto: se comincia per zero non sono migliaia
         (0.500 e' mezzo metro, non cinquecento) */
      var prima = t.slice(0, pun).replace(/\./g, "");
      var zeroDavanti = prima === "0" || prima === "-0" || /^-?0/.test(prima);
      if (punti > 1 || (dopo === 3 && !zeroDavanti)) t = t.replace(/\./g, "");
    }
    var n = parseFloat(t);
    return isFinite(n) ? n : null;
  }

  /* nella pagina; e anche in Node, dove `window` non esiste e senza questo
     controllo il file esplodeva alla prima riga (trovato provandolo). */
  if (typeof window !== 'undefined') window.numeroItaliano = numeroItaliano;
  if (typeof module !== 'undefined' && module.exports) module.exports = numeroItaliano;
})();
