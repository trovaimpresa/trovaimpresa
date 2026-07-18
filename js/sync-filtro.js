// js/sync-filtro.js
// Quando si arriva da un link tipo ?mestiere=Idraulica, i risultati vengono
// gia' filtrati correttamente, ma la tendina dei filtri restava su "Tutti i
// mestieri": il cliente vedeva pochi risultati senza capire il perche'.
// Questo file allinea il controllo visibile al filtro realmente applicato.

(function () {
  'use strict';

  function sincronizza() {
    var p = new URLSearchParams(window.location.search);
    var valore = p.get('mestiere') || p.get('tipo');
    if (!valore) return;

    var select = document.querySelector(
      'select[onchange*="selectMestiere"], select[onchange*="selectTipo"]'
    );
    if (!select) return;

    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === valore) {
        select.selectedIndex = i;
        return;
      }
    }
    // Valore non presente tra le opzioni: lo aggiungo, cosi' resta visibile
    // invece di mostrare "Tutti" mentre i risultati sono filtrati.
    var o = document.createElement('option');
    o.value = valore;
    o.textContent = valore;
    o.selected = true;
    select.appendChild(o);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sincronizza);
  } else {
    sincronizza();
  }
})();
