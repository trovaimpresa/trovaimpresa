/* ============================================================
   TESTO SCRITTO DALL'AI → TESTO LEGGIBILE   (22 agosto 2026)
   ============================================================
   Segnalato da Alessio: nelle risposte dell'assistente restavano a schermo
   i CANCELLETTI e gli ASTERISCHI. Sono i segni con cui l'AI scrive i titoli
   e il grassetto (si chiama «markdown»): a lei servono, a chi legge no —
   sono trattini e stelline in mezzo alle frasi.

   Prima ogni pannello se la cavava con mezza riga, uguale in tutti e
   quattro: si trasformava solo `**grassetto**` e tutto il resto restava
   com'era. ⛔ Una regola che sta in quattro posti non si sistema a meta':
   adesso sta qui, e i quattro pannelli caricano questo file.
   (Stessa strada di js/vai-dal-cliente.js, 21 agosto.)

   ⛔ PRIMA SI RENDE INNOCUO IL TESTO, POI SI DECORA.
   Quello che arriva dall'AI non e' nostro: se finisse nella pagina cosi'
   com'e', un `<script>` scritto la' dentro diventerebbe codice. Quindi si
   scappa PRIMA (`<` diventa `&lt;`), e solo dopo si aggiungono i tag nostri.

   Uso:  document.getElementById('...').innerHTML = testoAI(risposta);
   ============================================================ */
(function () {
  "use strict";

  function scappa(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function testoAI(txt) {
    var s = scappa(txt);

    /* 1. I TITOLI: «# Titolo», «## Titolo», «### Titolo».
          Solo a inizio riga: un cancelletto in mezzo a una frase e' un
          cancelletto vero e resta dov'e'. */
    s = s.replace(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm, "<strong>$1</strong>");

    /* 2. GLI ELENCHI: «- cosa», «* cosa», «+ cosa» a inizio riga diventano
          un pallino. Va fatto PRIMA del corsivo, se no quell'asterisco di
          inizio riga verrebbe scambiato per l'inizio di un corsivo. */
    s = s.replace(/^\s{0,3}[-*+]\s+/gm, "• ");

    /* 3. IL GRASSETTO, e poi il corsivo. In quest'ordine, e non per caso:
          quando l'AI scrive «***cosi'***» (grassetto E corsivo insieme, il
          modo in cui grida) al contrario resterebbero due stelline a schermo.
          Nelle frasi normali l'ordine non cambia niente, perche' il corsivo
          si rifiuta gia' di toccare le stelline doppie: e' proprio il caso
          delle tre stelline che si rompe, ed e' provato (prova 19). */
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, "$1<em>$2</em>");

    /* 4. IL CODICE FRA APICI ROVESCI: `cosi'` -> senza gli apici.
          L'AI li usa per i nomi dei pulsanti, e a schermo sono due segni
          che nessuno capisce. */
    s = s.replace(/`([^`\n]+?)`/g, "<strong>$1</strong>");

    /* 5. Quello che resta e va tolto lo stesso: una riga fatta solo di
          trattini o di stelline (l'AI ci separa i paragrafi). */
    s = s.replace(/^\s*(?:[-*_]\s*){3,}$/gm, "");

    /* 6. Gli a capo diventano a capo veri: il riquadro non e' un <pre>.
          ⚠️ Tre o piu' a capo di fila diventano due: uno spazio bianco
          lungo mezzo schermo non e' «aria», e' un buco. */
    s = s.replace(/\n{3,}/g, "\n\n").replace(/\n/g, "<br>");

    return s;
  }

  window.testoAI = testoAI;
})();
