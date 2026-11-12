/* 8 nov 2026 — I MARCHI (Comet, Rowenta, Moulinex, Lampade.it; 12 nov + Vevor) AI LATI.
   Prima stavano tutti insieme in una fascia in mezzo alla pagina.
   Scelta di Alex: separati, uno per volta, nei posti vuoti ai lati della
   pagina, SOTTO i cartelli destinati alle imprese, sparsi a riempire.
   Vale per la home (index.html, fascia #ti-marchi) e per tutte le pagine
   dove js/marchi-citta.js disegna la fascia (#ti-marchi-citta): città,
   mestiere+città, guide, blog, gestionale… marchi-citta.js carica questo file.

   Regole:
   - Solo al computer (sopra i 1100 px). Sul telefono ai lati non c'e' posto:
     li' resta la fascia di sempre, cosi' i marchi non spariscono.
   - Non coprono mai un cartello: ognuno va nel primo vuoto libero sotto
     quello che gli e' stato assegnato. Se il vuoto non basta, scende.
   - Un lato dove ci sono i loghi delle imprese che restano fermi mentre si
     scorre (js/loghi-ospiti.js, .ti-osp) non si usa: si coprirebbero.
   - TUTTI O NESSUNO (9 nov 2026): se ai lati non ci stanno tutti, restano
     tutti nella fascia. La fascia sparisce solo quando sono tutti ai lati.
   - Un marchio che la pagina mostra gia' altrove (es. Lampade.it accanto alle
     guide, js/vetrina-guide.js) non si ripete.
   Per aggiungere un marchio: una riga in MARCHI (id Awin = awinmid), logo
   in /img/marchi/, e la stessa riga in js/marchi-citta.js e in index.html. */
(function () {
  'use strict';
  if (window.__tiMarchiLati) return;
  window.__tiMarchiLati = true;

  var MARCHI = [
    { id: 23030, nome: 'Comet',      logo: 'comet.webp',      w: 120, h: 60, cosa: 'Elettrodomestici e illuminazione', c: '#e30613', lato: 'sx', dopo: 0 },
    { id: 23309, nome: 'Rowenta',    logo: 'rowenta.webp',    w: 168, h: 65, cosa: 'Piccoli elettrodomestici',         c: '#8a9bb0', lato: 'dx', dopo: 1 },
    { id: 9450,  nome: 'Moulinex',   logo: 'moulinex.webp',   w: 168, h: 93, cosa: 'Cucina e casa',                    c: '#d0021b', lato: 'sx', dopo: 3 },
    { id: 10404, nome: 'Lampade.it', logo: 'lampade-it.webp', w: 168, h: 59, cosa: 'Lampade e luci',                   c: '#e5233b', lato: 'dx', dopo: 4 },
    { id: 118433, nome: 'Vevor',     logo: 'vevor.webp',      w: 168, h: 60, cosa: 'Attrezzi e macchinari da cantiere', c: '#ff5023', lato: 'sx', dopo: 6 }
  ];
  // «dopo»: sotto quale cartello del suo lato va (0 = il primo dall'alto).
  // Cosi' si alternano e si spargono lungo la pagina invece di ammucchiarsi.
  var AWIN_ME = '3137864';
  var TELEFONO = '(max-width:1100px)';
  var STACCO = 64;      // spazio fra un marchio e i cartelli sopra e sotto (8 nov: 34 era troppo attaccato)
  var BORDO = 20;       // distanza dal bordo dello schermo, se il lato e' vuoto
  var MAX_L = 380;      // larghezza massima della carta
  var MIN_L = 220;      // sotto questa non si mostra
  var SFALSA = 500;     // ogni marchio almeno cosi' piu' in basso del precedente
  var CARTELLI = '.ti-loc-col, .ti-spazio-citta, a.pub-link.hero-pub, .ti-vetrina-guide, .ti-spazio';

  var HOME = !!document.getElementById('ti-marchi') ||
    /^\/(index(\.html)?)?$/.test(location.pathname);
  // Sulla home, a schermo grande, la fascia si nasconde SUBITO, prima che gli
  // altri file misurino la pagina (li' i quattro posti ci sono). Se poi un
  // marchio non trova posto, la fascia torna con quelli rimasti.
  if (HOME && window.innerWidth >= 1700) document.documentElement.classList.add('ti-marchi-lati');

  var CSS =
    '@media (min-width:1101px){html.ti-marchi-lati #ti-marchi,html.ti-marchi-lati #ti-marchi-citta{display:none !important}' +
      '.tml-messo{display:none !important}}' +
    '.tml-card{position:absolute;z-index:5;display:none;flex-direction:column;align-items:center;text-align:center;' +
      'text-decoration:none;color:#0a2a4d;background:#fff;border:2px solid #ff8800;border-radius:20px;overflow:hidden;' +
      'box-shadow:0 14px 34px rgba(0,0,0,.28);transition:transform .2s,box-shadow .2s;box-sizing:border-box;font-family:inherit;line-height:normal}' +
    '.tml-card *{box-sizing:border-box}' +
    '.tml-card:hover{transform:scale(1.03);box-shadow:0 18px 40px rgba(255,136,0,.35)}' +
    '.tml-sopra{display:block;width:100%;background:#ff8800;color:#fff;font-weight:800;font-size:13px;letter-spacing:.06em;' +
      'text-transform:uppercase;padding:6px 8px}' +
    '.tml-top{display:flex;align-items:center;justify-content:center;width:100%;padding:24px 20px;' +
      'background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);' +
      'background-size:28px 28px;border-bottom:6px solid var(--c,#ff8800)}' +
    '.tml-logo{display:flex;align-items:center;justify-content:center;width:100%;height:110px;background:#fff;border-radius:16px;box-shadow:0 8px 22px rgba(0,0,0,.3)}' +
    '.tml-logo img{width:78%;max-height:90px;height:auto;object-fit:contain;margin:0;border:0}' +
    '.tml-nome{display:block;font-weight:900;font-size:24px;margin:16px 12px 4px;line-height:1.15;color:#0a2a4d}' +
    '.tml-cosa{display:block;font-size:17px;color:#3d4b5f;margin:0 12px 16px;line-height:1.3}' +
    '.tml-btn{display:block;margin:0 16px 18px;align-self:stretch;background:#ff8800;color:#fff;font-weight:900;font-size:18px;padding:13px 8px;border-radius:12px}' +
    '.tml-card:hover .tml-btn{background:#e06a00}';

  var stile = document.createElement('style');
  stile.textContent = CSS;
  (document.head || document.documentElement).appendChild(stile);

  var carte = [];
  var scosse = 0;   // quante volte abbiamo fatto rimisurare la pagina (mai all'infinito)

  function laFascia() { return document.getElementById('ti-marchi') || document.getElementById('ti-marchi-citta'); }

  // il marchio e' gia' in pagina fuori dalla fascia e dalle nostre carte?
  function giaInPagina(m) {
    var l = document.querySelectorAll('a[href*="awin1.com"]');
    var f = laFascia();
    for (var i = 0; i < l.length; i++) {
      var a = l[i];
      if (a.classList.contains('tml-card') || (f && f.contains(a))) continue;
      var h = a.getAttribute('href') || '';
      if (h.indexOf('awinmid=' + m.id + '&') >= 0 || h.indexOf('v=' + m.id + '&') >= 0) return true;
    }
    return false;
  }

  function crea() {
    MARCHI.forEach(function (m) {
      var a = document.createElement('a');
      a.className = 'tml-card';
      a.href = 'https://www.awin1.com/cread.php?awinmid=' + m.id + '&awinaffid=' + AWIN_ME;
      a.target = '_blank';
      a.rel = 'sponsored nofollow noopener';
      a.style.setProperty('--c', m.c);
      a.innerHTML = '<span class="tml-sopra">Negozio consigliato</span>' +
        '<span class="tml-top"><span class="tml-logo"><img src="/img/marchi/' + m.logo + '" alt="' + m.nome +
        '" width="' + m.w + '" height="' + m.h + '"></span></span>' +
        '<span class="tml-nome">' + m.nome + '</span><span class="tml-cosa">' + m.cosa + '</span>' +
        '<span class="tml-btn">Vai al negozio →</span>';
      document.body.appendChild(a);
      carte.push({ el: a, m: m, messo: false, saltato: false });
    });
  }

  // I cartelli che ci sono gia' ai lati, di tutti i file che li mettono.
  function cartelliDelLato(lato) {
    var out = [];
    var l = document.querySelectorAll(CARTELLI);
    var cw = document.documentElement.clientWidth;
    for (var i = 0; i < l.length; i++) {
      var el = l[i];
      if (el.getAttribute('data-in-pagina') === '1') continue;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.width > cw * 0.45) continue;                 // non e' un cartello di lato
      var suo = (r.left + r.width / 2) < cw / 2 ? 'sx' : 'dx';
      if (suo !== lato) continue;
      out.push({ top: r.top + window.scrollY, bot: r.bottom + window.scrollY,
                 left: r.left, right: cw - r.right, w: r.width });
    }
    out.sort(function (a, b) { return a.top - b.top; });
    return out;
  }

  // un lato coi loghi fermi (position:fixed) delle imprese non si usa
  function latoFermo(lato) {
    var l = document.querySelectorAll('.ti-osp');
    for (var i = 0; i < l.length; i++) {
      if (l[i].getAttribute('data-lato') === lato && getComputedStyle(l[i]).display !== 'none') return true;
    }
    return false;
  }

  function inizioPagina() {
    var h = document.querySelector('.hero') || document.querySelector('header') || document.querySelector('nav');
    var y = h ? h.getBoundingClientRect().bottom + window.scrollY : 300;
    return Math.max(200, y) + STACCO;
  }

  // Tutto quello che c'e' gia' ai lati della pagina (testi, riquadri, foto):
  // un marchio non ci va mai sopra. Le fasce larghe tutta la pagina sono solo
  // sfondo e non contano; quello che resta fermo sullo schermo nemmeno.
  function ostacoli() {
    var cw = document.documentElement.clientWidth, out = [];
    var f = laFascia();
    var figli = document.body.children;
    for (var i = 0; i < figli.length; i++) {
      var b = figli[i];
      if (/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(b.tagName) || b.classList.contains('tml-card')) continue;
      var cs = getComputedStyle(b);
      if (cs.position === 'fixed' || cs.display === 'none') continue;
      var l = [b].concat(Array.prototype.slice.call(b.querySelectorAll('*')));
      for (var k = 0; k < l.length; k++) {
        var el = l[k];
        if (f && (el === f || f.contains(el))) continue;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.width >= cw * 0.9 || r.right <= 0 || r.left >= cw) continue;
        if (r.left > cw * 0.34 && r.right < cw * 0.66) continue;   // sta in mezzo
        out.push({ top: r.top + window.scrollY, bot: r.bottom + window.scrollY, l: r.left, r: r.right });
      }
    }
    return out;
  }

  function fondoPagina() {
    var f = document.querySelector('footer');
    return f ? f.getBoundingClientRect().top + window.scrollY : document.body.scrollHeight;
  }

  // Le carte della fascia: si spengono al computer quelle che stanno ai lati.
  // Se ci stanno tutte, sparisce la fascia intera. Torna vero se e' cambiato
  // qualcosa (allora gli altri file devono rimisurare la pagina).
  function aggiornaFascia() {
    var f = laFascia();
    if (!f) return false;
    var radice = document.documentElement.classList;
    var prima = f.querySelectorAll('.tml-messo').length + '|' + radice.contains('ti-marchi-lati');
    var tutti = true;
    carte.forEach(function (c) {
      var nella = f.querySelector('a[href*="awinmid=' + c.m.id + '&"]');
      if (nella) nella.classList.toggle('tml-messo', c.messo || c.saltato);
      if (!c.messo && !c.saltato) tutti = false;
    });
    radice.toggle('ti-marchi-lati', tutti);
    var dopo = f.querySelectorAll('.tml-messo').length + '|' + radice.contains('ti-marchi-lati');
    return prima !== dopo;
  }

  // Tutti i marchi hanno la STESSA misura (regola di Alex: «tutto uguale»).
  // Si prova la carta piu' grande; se cosi' ne entrano di meno, si scende.
  var MISURE = [MAX_L, 340, 300, 260, MIN_L];

  function piazza(W, tel, ost) {
    var fondo = fondoPagina();
    var cw = document.documentElement.clientWidth;
    var presi = { sx: [], dx: [] };
    var ultimo = -1e9, quanti = 0;
    var inizio = inizioPagina();
    var passo = Math.max(SFALSA, (fondo - inizio) / (MARCHI.length + 0.5));

    carte.forEach(function (c) {
      c.messo = false;
      c.saltato = giaInPagina(c.m);
      c.el.style.display = 'none';
      if (tel || c.saltato) return;

      // il suo lato, o l'altro se il suo non si puo' usare
      var lati = [c.m.lato, c.m.lato === 'sx' ? 'dx' : 'sx'];
      for (var n = 0; n < 2 && !c.messo; n++) {
        var lato = lati[n];
        if (latoFermo(lato)) continue;
        var col = cartelliDelLato(lato);
        var x, y0, L = W;
        if (col.length) {
          var rif = col[Math.min(c.m.dopo, col.length - 1)];
          x = lato === 'sx' ? rif.left : rif.right;      // stessa colonna dei cartelli
          y0 = Math.max(rif.bot + STACCO, ultimo + SFALSA);
        } else {
          // lato vuoto: colonna a 20 px dal bordo, sparsi lungo la pagina
          x = BORDO;
          y0 = Math.max(inizio, ultimo + passo);
        }
        var x0 = lato === 'sx' ? x : cw - x - L, x1 = x0 + L;
        if (x0 < 0 || x1 > cw) continue;

        c.el.style.display = 'flex';
        c.el.style.width = L + 'px';
        var H = c.el.offsetHeight;
        var occ = presi[lato].concat(ost.filter(function (o) { return o.r > x0 && o.l < x1; }));
        var y = y0, ok = false;
        for (var giri = 0; giri < 400 && !ok; giri++) {
          ok = true;
          for (var k = 0; k < occ.length; k++) {
            var o = occ[k];
            if (y < o.bot + STACCO && y + H + STACCO > o.top) { y = Math.max(y + 1, o.bot + STACCO); ok = false; break; }
          }
        }
        if (!ok || y + H > fondo - STACCO) { c.el.style.display = 'none'; continue; }

        c.el.style.top = Math.round(y) + 'px';
        if (lato === 'sx') { c.el.style.left = Math.round(x) + 'px'; c.el.style.right = 'auto'; }
        else { c.el.style.right = Math.round(x) + 'px'; c.el.style.left = 'auto'; }
        presi[lato].push({ top: y, bot: y + H });
        ultimo = y;
        c.messo = true;
        quanti++;
      }
    });
    return quanti;
  }

  function sistema() {
    var tel = window.matchMedia(TELEFONO).matches;
    carte.forEach(function (c) { c.el.style.display = 'none'; });
    var ost = tel ? [] : ostacoli();
    var meglio = MISURE[0], max = -1;
    if (!tel) {
      for (var i = 0; i < MISURE.length; i++) {
        var q = piazza(MISURE[i], tel, ost);
        if (q > max) { max = q; meglio = MISURE[i]; }
        if (q === carte.length) break;
      }
    }
    var messi = piazza(meglio, tel, ost);

    // 9 nov 2026 (Alex): TUTTI O NESSUNO. Se ai lati non ci stanno tutti i
    // marchi da mettere, non se ne mette nessuno: restano tutti insieme nella
    // fascia, larghi su tutta la riga. Prima ne finiva uno solo ai lati (spesso
    // in fondo alla pagina) e nella fascia restava un buco (Forum, Lavoro Edilizia).
    var daMettere = carte.filter(function (c) { return !c.saltato; }).length;
    if (!tel && messi < daMettere) {
      carte.forEach(function (c) { c.messo = false; c.el.style.display = 'none'; });
    }

    // la fascia cambia altezza: gli altri file rimisurano, poi rimisuriamo noi
    if (aggiornaFascia() && ++scosse <= 4) {
      setTimeout(function () {
        try { window.dispatchEvent(new Event('resize')); } catch (e) {}
      }, 30);
    }
  }

  function avvio() {
    try {
      crea();
      // gli altri file piazzano i loro cartelli dopo un attimo (e dopo aver
      // chiesto al database chi ha pagato): si rimisura un po' di volte
      [150, 600, 1500, 3000, 6000, 9500].forEach(function (t) { setTimeout(sistema, t); });
      var tm;
      window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(sistema, 250); }, { passive: true });
      window.addEventListener('load', function () { setTimeout(sistema, 100); });
    } catch (e) {
      // qualcosa e' andato storto: si rimette la fascia di prima
      document.documentElement.classList.remove('ti-marchi-lati');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
