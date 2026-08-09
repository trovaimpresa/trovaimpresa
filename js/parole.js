/* ============================================================
   parole.js — Le parole tecniche spiegate (agosto 2026)

   Nelle guide ci sono parole che per un muratore sono ovvie e per chi
   legge no: trasmittanza, CILA, massetto, bonifico parlante. Chi non le
   capisce non va a cercarle: salta la riga e capisce a metà.

   Questo script le trova da solo nel testo, le sottolinea leggermente e,
   toccandole o passandoci sopra, mostra due righe di spiegazione.

   COME SI USA
   Una riga sola in fondo alla guida:
       <script src="/js/parole.js"></script>

   COME SE NE AGGIUNGE UNA
   Si scrive nella lista PAROLE qui sotto. Vale subito su TUTTE le guide
   che caricano il file: non serve toccarle una per una.

   FUNZIONA ANCHE AL TOCCO
   Le guide si leggono quasi tutte dal telefono, dove il passaggio del
   mouse non esiste. Qui si tocca la parola e si apre, si tocca fuori e
   si chiude. Sul computer si apre anche passandoci sopra.

   NON TOCCA IL POSIZIONAMENTO
   La parola resta testo normale dentro la pagina: Google legge quello che
   leggeva prima. Cambia solo come si vede.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- le parole ---------- */
  /* chiave = come si scrive nel testo (senza accorgersi di maiuscole)   */
  var PAROLE = {
    'trasmittanza':
      'Il numero che dice quanto isola un infisso o un muro (si scrive Uw o U). Più è basso, meglio tiene il caldo dentro e il freddo fuori. Su una finestra, sotto 1,3 è un buon valore.',

    'CILA':
      'Comunicazione di Inizio Lavori Asseverata: la pratica leggera per i lavori interni. La presenta un tecnico e si può cominciare subito, senza aspettare permessi.',

    'SCIA':
      'Segnalazione Certificata di Inizio Attività: serve per i lavori più impegnativi, quando si toccano le strutture o si cambia l’aspetto esterno dell’edificio.',

    'bonifico parlante':
      'Il bonifico fatto con la causale giusta: la legge di riferimento, il tuo codice fiscale e la partita IVA di chi ha fatto il lavoro. Senza quello la detrazione la perdi, anche se hai pagato tutto regolarmente.',

    'massetto':
      'Lo strato di cemento sotto le piastrelle, quello che fa da base. Se è sfarinato o crepato va rifatto — ed è lì che i costi si impennano.',

    'controtelaio':
      'Il telaio nascosto dentro il muro, quello a cui poi si aggancia la finestra o la porta. Non si vede, ma è quello che tiene tutto in squadra.',

    'sottotraccia':
      'Dentro il muro. I tubi e i fili sottotraccia non si vedono, ma per metterli bisogna aprire le pareti e poi richiuderle: è il lavoro che costa di più.',

    'cappotto termico':
      'Lo strato isolante che si mette sui muri esterni, come un giubbotto intorno alla casa. Taglia le bollette e toglie l’umidità dai muri freddi.',

    'capitolato':
      'L’elenco scritto di tutto quello che comprende il lavoro, materiali compresi. È il foglio che evita le discussioni a fine cantiere: se una cosa non c’è scritta, non è compresa.',

    'ponteggio':
      'L’impalcatura montata sulla facciata per lavorare in altezza. Si paga al metro quadro, e il montaggio e lo smontaggio sono una voce a parte.',

    'gres porcellanato':
      'La piastrella più usata oggi: dura, non assorbe acqua e si pulisce facilmente. Va bene dentro e fuori.',

    'pendenza':
      'L’inclinazione che si dà agli scarichi perché l’acqua se ne vada da sola. Se è sbagliata il bagno gorgoglia, puzza o non scarica.',

    'cassetto fiscale':
      'L’archivio online dell’Agenzia delle Entrate dove finiscono tutte le fatture elettroniche, quelle che mandi e quelle che ricevi.',

    'coibentazione':
      'L’isolamento: il materiale che impedisce al caldo di scappare e al freddo di entrare. Si fa sui muri, sul tetto o sotto il pavimento.'
  };

  /* ---------- dove NON si tocca ---------- */
  var VIETATI = ['A', 'SCRIPT', 'STYLE', 'BUTTON', 'INPUT', 'TEXTAREA',
                 'SELECT', 'OPTION', 'CODE', 'PRE', 'H1', 'TITLE', 'NOSCRIPT'];

  var CSS =
    '.ti-parola{border-bottom:1.5px dotted #0066ff;cursor:help;color:inherit}' +
    '.ti-parola:hover,.ti-parola.aperta{background:#eaf2ff;border-bottom-style:solid}' +
    '#ti-spiega{position:absolute;z-index:99999;max-width:320px;background:#0a2a4d;color:#fff;' +
      'font-family:inherit;font-size:15px;line-height:1.6;padding:14px 16px;border-radius:12px;' +
      'box-shadow:0 8px 28px rgba(10,42,77,.3);opacity:0;visibility:hidden;transition:opacity .15s}' +
    '#ti-spiega.on{opacity:1;visibility:visible}' +
    '#ti-spiega b{display:block;font-size:13px;text-transform:uppercase;letter-spacing:.5px;' +
      'color:#8fc0ff;margin-bottom:6px}' +
    '@media (prefers-reduced-motion: reduce){#ti-spiega{transition:none}}';

  var box = null, apertaSu = null, timer = null;

  function creaBox() {
    if (box) return;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    box = document.createElement('div');
    box.id = 'ti-spiega';
    box.setAttribute('role', 'tooltip');
    document.body.appendChild(box);
    /* toccando dentro il riquadro non si chiude */
    box.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function mostra(el) {
    creaBox();
    var t = el.dataset.spiega || '';
    if (!t) return;
    box.innerHTML = '<b>' + el.textContent + '</b>' + t.replace(/</g, '&lt;');
    box.classList.add('on');
    if (apertaSu && apertaSu !== el) apertaSu.classList.remove('aperta');
    el.classList.add('aperta');
    apertaSu = el;

    /* posizione in coordinate di pagina: scorre insieme al testo */
    var r = el.getBoundingClientRect();
    var sx = window.pageXOffset, sy = window.pageYOffset;
    var b = box.getBoundingClientRect();
    var m = 8;
    var x = r.left + sx;
    if (x + b.width > document.documentElement.clientWidth + sx - m) {
      x = Math.max(m + sx, document.documentElement.clientWidth + sx - b.width - m);
    }
    /* sopra se c'e' posto, altrimenti sotto */
    var y = (r.top > b.height + m) ? (r.top + sy - b.height - m) : (r.bottom + sy + m);
    box.style.left = Math.round(x) + 'px';
    box.style.top = Math.round(y) + 'px';
  }

  function chiudi() {
    clearTimeout(timer);
    if (box) box.classList.remove('on');
    if (apertaSu) { apertaSu.classList.remove('aperta'); apertaSu = null; }
  }

  /* ---------- trovare le parole nel testo ---------- */
  function segna(radice) {
    var chiavi = Object.keys(PAROLE).sort(function (a, b) { return b.length - a.length; });
    var fatte = {};   /* ogni parola si spiega SOLO la prima volta: se no il testo
                         diventa un tappeto di sottolineature e stanca */

    chiavi.forEach(function (chiave) {
      if (fatte[chiave]) return;
      var re = new RegExp('(^|[^\\wàèéìòóù])(' +
               chiave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
               ')(?![\\wàèéìòóù])', 'i');

      var camm = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || n.nodeValue.length < chiave.length) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode;
          while (p && p !== radice) {
            if (VIETATI.indexOf(p.nodeName) >= 0) return NodeFilter.FILTER_REJECT;
            if (p.classList && p.classList.contains('ti-parola')) return NodeFilter.FILTER_REJECT;
            p = p.parentNode;
          }
          return re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });

      var nodo = camm.nextNode();
      if (!nodo) return;

      var m = nodo.nodeValue.match(re);
      if (!m) return;
      var inizio = m.index + m[1].length;
      var testo = m[2];

      var dopo = nodo.splitText(inizio);
      dopo.splitText(testo.length);

      var span = document.createElement('span');
      span.className = 'ti-parola';
      span.dataset.spiega = PAROLE[chiave];
      span.setAttribute('tabindex', '0');
      span.setAttribute('role', 'button');
      span.setAttribute('aria-label', 'Cosa vuol dire ' + testo);
      span.textContent = testo;
      dopo.parentNode.replaceChild(span, dopo);

      fatte[chiave] = true;
    });
  }

  function avvia() {
    /* solo nel corpo dell'articolo: fuori non serve e non deve toccare niente */
    var radice = document.querySelector('article') || document.querySelector('main') || document.body;
    try { segna(radice); } catch (e) { return; }   /* mai rompere la pagina per un aiuto */

    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('.ti-parola') : null;
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        if (apertaSu === el) chiudi(); else mostra(el);
        return;
      }
      chiudi();
    });

    /* sul computer si apre anche passandoci sopra */
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.addEventListener('mouseover', function (e) {
        var el = e.target.closest ? e.target.closest('.ti-parola') : null;
        if (!el || el === apertaSu) return;
        clearTimeout(timer);
        timer = setTimeout(function () { mostra(el); }, 250);
      });
      document.addEventListener('mouseout', function (e) {
        var el = e.target.closest ? e.target.closest('.ti-parola') : null;
        if (!el) return;
        clearTimeout(timer);
        timer = setTimeout(chiudi, 200);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { chiudi(); return; }
      if ((e.key === 'Enter' || e.key === ' ') &&
          document.activeElement &&
          document.activeElement.classList &&
          document.activeElement.classList.contains('ti-parola')) {
        e.preventDefault();
        if (apertaSu === document.activeElement) chiudi(); else mostra(document.activeElement);
      }
    });

    window.addEventListener('resize', chiudi);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
