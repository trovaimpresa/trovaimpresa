/* Le pagine del gestionale, tutte insieme.
   Tre file separati perche' cosi' si puo' correggere il testo di un
   mestiere senza scorrere tremila righe.

     dati-gestionale-problema.js   le pagine di chi cerca il problema
     dati-gestionale-mestiere.js   una pagina per mestiere
     dati-gestionale-confronto.js  quanto costa, gratis, alternativa

   L'ordine conta solo per i «Vedi anche» in fondo alle pagine.
*/
module.exports = [
  ...require('./dati-gestionale-problema.js'),
  ...require('./dati-gestionale-mestiere.js'),
  ...require('./dati-gestionale-confronto.js'),
];
