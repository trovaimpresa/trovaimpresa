/* =====================================================================
   TrovaImpresa — «LA TUA CITTA'» DENTRO LE GUIDE — 30 ottobre 2026

   Il guasto misurato: le guide portano →295← visitatori in 30 giorni, e solo
   →2← poi cercano un'impresa. Il riquadro «Cerchi un cartongessista?» in cima
   a ogni guida portava a /cerca-artigiani.html NUDO: niente citta', niente
   mestiere. Il cliente atterrava su una pagina che gli chiedeva tutto da capo.

   Qui:
   - nel riquadro azzurro (.ti-promo-cli) compare la casella «La tua città»
     (gia' scritta se l'ha scelta prima: localStorage ti_citta_scelta, la
     stessa chiave di js/citta-obbligatoria.js);
   - il pulsante porta alla ricerca con citta' E mestiere gia' messi;
   - anche gli altri link della guida verso cerca-artigiani / cerca-imprese
     prendono il mestiere (e la citta', se c'e').
   Il mestiere si sceglie dal nome della pagina (MESTIERE qui sotto). I valori
   devono essere UGUALI alle voci della tendina di cerca-artigiani.html: il
   30 ott «Falegname» al posto di «Falegnameria» dava zero risultati.
   ===================================================================== */
(function () {
  var MESTIERE = {
    'quanto-costa-cambiare-gli-infissi': 'Serramenti / Infissi',
    'quanto-costa-imbiancare-casa': 'Pittura e tinteggiatura',
    'quanto-costa-impianto-fotovoltaico': 'Fotovoltaico / Pannelli solari',
    'quanto-costa-installare-un-condizionatore': 'Climatizzazione / Caldaie',
    'quanto-costa-sostituire-la-caldaia': 'Climatizzazione / Caldaie',
    'quanto-costa-parete-cartongesso': 'Cartongesso',
    'quanto-costa-posare-il-pavimento': 'Pavimenti e piastrelle',
    'quanto-costa-rifare-impianto-elettrico': 'Impianti elettrici',
    'quanto-costa-rifare-impianto-idraulico': 'Idraulica',
    'quanto-costa-un-idraulico': 'Idraulica',
    'quanto-costa-trasformare-vasca-in-doccia': 'Idraulica'
  };
  var CHIAVE = 'ti_citta_scelta';
  var pagina = location.pathname.replace(/^\//, '').replace(/\.html$/, '');
  var mestiere = MESTIERE[pagina] || '';

  function leggiCitta() { try { return (localStorage.getItem(CHIAVE) || '').trim(); } catch (e) { return ''; } }
  function salvaCitta(c) { try { localStorage.setItem(CHIAVE, c); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function indirizzo(base, citta) {
    var p = new URLSearchParams();
    if (citta) p.set('citta', citta);
    if (mestiere && /cerca-artigiani/.test(base)) p.set('mestiere', mestiere);
    var q = p.toString();
    return base.split('?')[0] + (q ? '?' + q : '');
  }

  function sistemaLink(citta) {
    document.querySelectorAll('a[href*="cerca-artigiani"], a[href*="cerca-imprese"]').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (h.indexOf('?') !== -1) return; /* chi ha gia' i suoi filtri resta com'e' */
      a.setAttribute('href', indirizzo(h.charAt(0) === '/' ? h : '/' + h, citta));
    });
  }

  var css = ''
    + '.gc-riga{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 10px}'
    + '.gc-riga input{flex:1 1 200px;min-width:0;font:inherit;font-size:17px;padding:13px 14px;border:2px solid #b8c9e6;'
    +   'border-radius:10px;background:#fff;color:#0f172a;box-sizing:border-box}'
    + '.gc-riga input:focus{outline:none;border-color:#0066ff}'
    + '.gc-riga input.gc-errore{border-color:#d32f2f}'
    + '.gc-riga button{flex:1 1 100%;margin:0;border:0;font-family:inherit;cursor:pointer;width:100%}'
    + '.gc-msg{font-size:15px;color:#d32f2f;margin:-4px 0 8px;display:none}';

  function avvia() {
    var citta = leggiCitta();
    sistemaLink(citta);
    var bott = document.querySelector('.ti-promo-cli .ti-promo-b1');
    if (!bott) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var base = (bott.getAttribute('href') || '/cerca-imprese.html').split('?')[0];
    var riga = document.createElement('form');
    riga.className = 'gc-riga';
    riga.setAttribute('novalidate', '');
    riga.innerHTML = '<input type="text" name="citta" autocomplete="address-level2" placeholder="La tua città" aria-label="La tua città" value="' + esc(citta) + '">'
      + '<button type="submit" class="' + bott.className + '">' + bott.innerHTML + '</button>';
    var msg = document.createElement('p'); msg.className = 'gc-msg'; msg.textContent = 'Scrivi la tua città.';
    bott.parentNode.insertBefore(riga, bott);
    bott.parentNode.insertBefore(msg, bott);
    bott.parentNode.removeChild(bott);

    var inp = riga.querySelector('input');
    inp.addEventListener('input', function () { inp.classList.remove('gc-errore'); msg.style.display = 'none'; });
    riga.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = inp.value.trim();
      if (!c) { inp.classList.add('gc-errore'); msg.style.display = 'block'; inp.focus(); return; }
      salvaCitta(c);
      location.href = indirizzo(base, c);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
