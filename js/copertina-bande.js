/* LE BANDE AI LATI DELLA COPERTINA — 31 agosto 2026
   ==================================================================
   Il problema, misurato: la fascia della copertina e' larga e bassa
   (2,5:1 sul computer), ma le immagini che la gente carica sono quasi
   quadrate — quella di Alessio e' 1377x768, cioe' 1,79:1. L'immagine si
   vede tutta al centro e ai lati restano due bande vuote.

   Cosa NON funziona, provato dal vivo:
   · allargare l'immagine fino a riempire taglia il 28% dell'altezza —
     sulla copertina di Alessio sono il titolo in alto e la riga con
     l'email in basso;
   · riempire i lati con la stessa immagine sfocata va bene per una
     FOTO, ma su un logo o su una locandina diventa una macchia sporca.
     Parole di Alessio guardandola sul sito: «e' peggio di prima».

   Cosa fa questo file: legge i colori del BORDO dell'immagine (dodici
   punti sul lato sinistro e dodici sul destro) e riempie le bande con
   quegli stessi colori, sfumati dall'alto in basso. Le bande diventano
   la continuazione dell'immagine: niente vuoto, niente tagliato,
   niente macchia. Funziona sia con le foto sia con i loghi.

   ⚠️ Se l'immagine non si lascia leggere (server senza CORS, indirizzo
   rotto, file finito), NON si scrive niente: le bande restano
   trasparenti e si vede il colore di sfondo della fascia, cioe'
   esattamente com'era prima. Non deve mai peggiorare.
   ================================================================== */
(function () {
  'use strict';
  var PUNTI = 12;

  function gradienteDaColonna(ctx, x, altezza) {
    var stop = [];
    for (var i = 0; i < PUNTI; i++) {
      var y = Math.min(altezza - 1, Math.round(i * (altezza - 1) / (PUNTI - 1)));
      var d = ctx.getImageData(x, y, 1, 1).data;
      stop.push('rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ') ' + Math.round(i * 100 / (PUNTI - 1)) + '%');
    }
    return 'linear-gradient(180deg,' + stop.join(',') + ')';
  }

  /* elemento = la fascia della copertina; url = l'immagine che ci sta dentro */
  window.bandeCopertina = function (elemento, url) {
    if (!elemento || !url) return;
    try {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () {
        try {
          if (!im.naturalWidth || !im.naturalHeight) return;
          var c = document.createElement('canvas');
          c.width = im.naturalWidth; c.height = im.naturalHeight;
          var x = c.getContext('2d');
          x.drawImage(im, 0, 0);
          var sx = gradienteDaColonna(x, 1, im.naturalHeight);
          var dx = gradienteDaColonna(x, im.naturalWidth - 2, im.naturalHeight);
          elemento.style.setProperty('--banda-sx', sx);
          elemento.style.setProperty('--banda-dx', dx);
          elemento.classList.add('bande-pronte');
        } catch (e) { /* immagine non leggibile: si resta come prima */ }
      };
      im.onerror = function () { /* si resta come prima */ };
      im.src = url;
    } catch (e) { /* si resta come prima */ }
  };
})();
