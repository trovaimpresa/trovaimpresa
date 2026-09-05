/* citta-calcolatore.js — 5 settembre 2026
   Le 19 guide «quanto costa» hanno gia' sotto il calcolatore un pulsante tipo
   «Trova un idraulico vicino a te», ma manda a /cerca-artigiani.html SENZA la
   citta': quelle pagine, senza citta', mostrano «Inserisci una citta' o
   regione» e il lettore trova una pagina vuota proprio nel momento in cui era
   piu' caldo. Qui si aggiunge una casella «In quale citta' cerchi?» e si
   riscrive l'indirizzo del pulsante con ?citta=...
   Le pagine di ricerca leggono gia' ?citta= e fanno partire la ricerca da sole
   (cerca-artigiani.html riga ~760, cerca-imprese.html riga ~507).
   NB: il mestiere NON si aggiunge apposta — con poche imprese per citta' un
   filtro di mestiere darebbe spesso «nessun risultato», che e' peggio di un
   elenco completo della citta'. */
(function () {
  function pronto(f) {
    if (document.readyState !== 'loading') f();
    else document.addEventListener('DOMContentLoaded', f);
  }

  pronto(function () {
    var gruppo = document.querySelector('.calc .cta-group');
    if (!gruppo) return;

    var link = [];
    Array.prototype.forEach.call(gruppo.querySelectorAll('a.cta'), function (a) {
      var h = a.getAttribute('href') || '';
      if (h.indexOf('/cerca-imprese') === 0 || h.indexOf('/cerca-artigiani') === 0 || h.indexOf('/cerca-professionisti') === 0) link.push(a);
    });
    if (!link.length) return;

    var base = link.map(function (a) { return a.getAttribute('href'); });

    var campo = document.createElement('div');
    campo.className = 'field campo-citta-cta';
    campo.innerHTML = '<label for="cta-citta">In quale citt&agrave; cerchi?</label>' +
      '<input type="text" id="cta-citta" autocomplete="address-level2" placeholder="Scrivi la tua citt&agrave;... es. Rieti">';
    gruppo.parentNode.insertBefore(campo, gruppo);

    var casella = campo.querySelector('#cta-citta');

    /* se il lettore l'ha gia' scritta in un'altra guida non la riscrive */
    try { var ric = localStorage.getItem('ti_citta'); if (ric) casella.value = ric; } catch (e) {}

    function aggiorna() {
      var citta = (casella.value || '').trim();
      try {
        if (citta) localStorage.setItem('ti_citta', citta);
        else localStorage.removeItem('ti_citta');
      } catch (e) {}
      link.forEach(function (a, i) {
        var h = base[i];
        a.setAttribute('href', citta ? h + (h.indexOf('?') > -1 ? '&' : '?') + 'citta=' + encodeURIComponent(citta) : h);
      });
    }

    casella.addEventListener('input', aggiorna);
    casella.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { aggiorna(); link[0].click(); }
    });

    aggiorna();
  });
})();
