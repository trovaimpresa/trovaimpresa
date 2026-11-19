/* 19 nov 2026 — UN MARCHIO DENTRO LA GUIDA, quando c'entra col lavoro.
   Idea di Alex: Plenitude (Eni) fa fotovoltaico, climatizzatori e caldaie,
   Gagliardi vende materiale elettrico e idraulico. Chi legge «quanto costa
   il fotovoltaico» sta gia' pensando a quel lavoro: la carta del marchio
   giusto, in mezzo all'articolo, gli serve davvero.

   Regole:
   - Va SUBITO DOPO la riga «Ti serve un ... nella tua citta'?» (.ti-riga):
     prima TrovaImpresa e le imprese della zona, poi il marchio.
   - Una sola carta per guida. Stessa grafica delle carte dei marchi
     (bordo arancio, «Negozio consigliato», logo su fondo blu a quadretti).
   - Solo le guide scritte qui sotto. Le altre non cambiano.
   - Se qualcosa va storto la pagina resta com'era.

   19 nov 2026 (sera, Alex): «su ogni pagina, anche forum, lavoro,
   subappalto, blog, guide». Ora la carica js/promo-pagine.js su tutte le
   pagine pubbliche. Nelle 5 guide qui sotto resta il marchio scelto apposta;
   nelle altre pagine il marchio si sceglie dalle parole della pagina
   (fotovoltaico, caldaia… → Plenitude; elettrico, idraulico → Gagliardi),
   altrimenti uno dei marchi, sempre lo stesso per la stessa pagina.
   Dove va: dopo «Ti serve un…» (.ti-riga) se c'e'; se no a meta' del
   testo (prima del titolo h2 di mezzo); se no prima del video in fondo. */
(function () {
  'use strict';
  var AWIN_ME = '3137864';
  var MARCHI = {
    plenitude: { id: 9529,   nome: 'Plenitude',  logo: 'eni-plenitude.webp', w: 168, h: 54, c: '#009e62', cosa: 'Luce, gas e fotovoltaico' },
    gagliardi: { id: 54303,  nome: 'Gagliardi',  logo: 'gagliardi.webp',     w: 168, h: 44, c: '#1f2bb8', cosa: 'Materiale elettrico e idraulico' },
    vevor:     { id: 118433, nome: 'Vevor',      logo: 'vevor.webp',         w: 168, h: 60, c: '#ff5023', cosa: 'Attrezzi e macchinari da cantiere' },
    trotec:    { id: 115365, nome: 'Trotec',     logo: 'trotec.webp',        w: 168, h: 22, c: '#ffe200', cosa: 'Deumidificatori, misuratori e utensili' },
    vonroc:    { id: 126387, nome: 'Vonroc',     logo: 'vonroc.webp',        w: 168, h: 84, c: '#35beae', cosa: 'Elettroutensili per casa e giardino' },
    lampade:   { id: 10404,  nome: 'Lampade.it', logo: 'lampade-it.webp',    w: 168, h: 59, c: '#e5233b', cosa: 'Lampade e luci' },
    comet:     { id: 23030,  nome: 'Comet',      logo: 'comet.webp',         w: 120, h: 60, c: '#e30613', cosa: 'Elettrodomestici e illuminazione' },
    kasanova:  { id: 17198,  nome: 'Kasanova',   logo: 'kasanova.webp',      w: 168, h: 25, c: '#ff00a4', cosa: 'Casalinghi e arredo' }
  };
  // le pagine che non hanno un marchio scelto apposta pescano da qui
  // (Rowenta e Moulinex no: piccoli elettrodomestici, c'entrano poco coi lavori)
  var GIRO = ['vevor', 'gagliardi', 'plenitude', 'trotec', 'vonroc', 'lampade', 'comet', 'kasanova'];
  var CANTIERE = ['vevor', 'trotec', 'vonroc', 'gagliardi'];
  var FRASE = {
    plenitude: 'Plenitude (gruppo Eni): luce e gas per la casa, fotovoltaico, climatizzatori e caldaie con installazione.',
    gagliardi: 'Materiale elettrico, idraulico e videosorveglianza di marca, con spedizione rapida.',
    vevor:     'Betoniere, ponteggi, attrezzi e macchinari da cantiere a buon prezzo.',
    trotec:    'Deumidificatori, misuratori di umidit\u00e0 e utensili per chi lavora in casa e in cantiere.',
    vonroc:    'Trapani, smerigliatrici e utensili elettrici per casa e giardino.',
    lampade:   'Lampade, faretti e illuminazione per ogni stanza, anche a LED.',
    comet:     'Elettrodomestici, climatizzatori e illuminazione per la casa nuova.',
    kasanova:  'Casalinghi, cucina e arredo per completare la casa dopo i lavori.'
  };

  var GUIDE = {
    'quanto-costa-impianto-fotovoltaico': { m: 'plenitude',
      t: 'Fotovoltaico chiavi in mano',
      s: 'Plenitude (gruppo Eni) installa pannelli e batterie di accumulo. Chiedi anche il loro preventivo e confrontalo con quello di un installatore della tua zona.' },
    'quanto-costa-installare-un-condizionatore': { m: 'plenitude',
      t: 'Climatizzatore con installazione',
      s: 'Plenitude (gruppo Eni) vende climatizzatori con l’installazione compresa. Confronta il prezzo con quello di un tecnico della tua zona.' },
    'quanto-costa-sostituire-la-caldaia': { m: 'plenitude',
      t: 'Caldaie e pompe di calore',
      s: 'Plenitude (gruppo Eni) propone caldaie a condensazione e pompe di calore con installazione. Confronta il prezzo con quello di un idraulico della tua zona.' },
    'quanto-costa-rifare-impianto-elettrico': { m: 'gagliardi',
      t: 'Il materiale elettrico',
      s: 'Cavi, frutti, placche, quadri: Gagliardi vende materiale elettrico di marca con spedizione rapida. Utile se lo compri tu e l’elettricista fa la posa.' },
    'quanto-costa-rifare-impianto-idraulico': { m: 'gagliardi',
      t: 'Il materiale idraulico',
      s: 'Tubi, raccordi, rubinetti, valvole: Gagliardi vende materiale idraulico di marca con spedizione rapida. Utile se lo compri tu e l’idraulico fa la posa.' }
  };

  function scegli(nome) {
    if (GUIDE[nome]) return GUIDE[nome];
    var testo = (nome + ' ' + (document.title || '')).toLowerCase();
    var m;
    if (/fotovolta|caldai|condizionat|climatizz|pompa-di-calore|pompe di calore|energ|bollett/.test(testo)) m = 'plenitude';
    else if (/elettric|idraul|impiant|videosorv/.test(testo)) m = 'gagliardi';
    else {
      var h = 0;
      for (var i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
      // chi lavora (forum, subappalti, offerte di lavoro, mestieri): attrezzi
      var giro = /subappalt|lavoro|offert|candidat|forum|muratore|cartongess|carpent|piastrell|imbianc|pavimen|edil/.test(nome) ? CANTIERE : GIRO;
      m = giro[h % giro.length];
    }
    return { m: m, t: MARCHI[m].cosa, s: FRASE[m] };
  }

  // il titolo h2 a meta' del testo vero (non quelli dei riquadri nostri)
  function titoloDiMezzo() {
    // si cerca prima dentro il testo vero (main, article); le fasce in fondo
    // alle pagine (.pb: forum, gestionale, lavoro) non sono testo
    var dove = document.querySelector('article') || document.querySelector('main') || document;
    var l = dove.querySelectorAll('h2'), ok = [];
    for (var i = 0; i < l.length; i++) {
      var h = l[i];
      if (h.closest('header,footer,nav,aside,.pb,#ti-video-promo,#ti-marchi-citta,#ti-marchi,.ti-promo,.ti-riga,.tml-card,.ti-mig')) continue;
      var r = h.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      ok.push(h);
    }
    if (!ok.length) return null;
    // si risale fino al riquadro che contiene SOLO quel titolo (la scheda di
    // un post del forum, un annuncio): la carta va fra un riquadro e l'altro,
    // mai dentro, sopra il titolo
    var el = ok[Math.floor(ok.length / 2)];
    while (el.parentNode && el.parentNode !== document.body &&
           el.parentNode.querySelectorAll('h2').length === 1) el = el.parentNode;
    return el;
  }

  function avvia(giro) {
    giro = giro || 0;
    try {
      var nome = location.pathname.replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '') || 'home';
      if (nome === 'home' || nome === 'index') return;        // la home ha gia' i suoi
      if (document.querySelector('.ti-mig')) return;
      var g = scegli(nome);
      var m = MARCHI[g.m];
      var riga = document.querySelector('.ti-riga');
      var mezzo = riga ? null : titoloDiMezzo();
      var fondo = document.getElementById('ti-video-promo') || document.querySelector('footer');
      // forum, lavoro, articoli: i titoli arrivano dal database dopo un po'.
      // Si riprova due volte prima di mettere la carta in fondo
      if (!riga && !mezzo && giro < 2) { setTimeout(function () { avvia(giro + 1); }, 3000); return; }
      if (!riga && !mezzo && !fondo) return;

      var st = document.createElement('style');
      st.textContent =
        '.ti-mig{display:flex;align-items:stretch;max-width:900px;margin:32px auto;border:2px solid #ff8800;border-radius:20px;overflow:hidden;' +
          'background:#fff;text-decoration:none !important;color:#0a2a4d;box-shadow:0 10px 28px rgba(0,0,0,.14);' +
          'transition:transform .2s,box-shadow .2s;font-family:inherit;position:relative}' +
        '.ti-mig:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(255,136,0,.3)}' +
        '.ti-mig *{box-sizing:border-box;text-decoration:none !important}' +
        '.ti-mig-sx{flex:0 0 260px;display:flex;align-items:center;justify-content:center;padding:22px;' +
          'background-color:#0a2a4d;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),' +
          'linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:28px 28px;border-right:6px solid var(--c,#ff8800)}' +
        '.ti-mig-logo{display:flex;align-items:center;justify-content:center;width:100%;height:110px;background:#fff;border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.3)}' +
        '.ti-mig-logo img{width:82%;height:auto;max-height:84px;object-fit:contain;margin:0;border:0}' +
        '.ti-mig-dx{flex:1;min-width:0;padding:18px 24px 20px}' +
        '.ti-mig-sopra{display:inline-block;background:#ff8800;color:#fff;font-weight:800;font-size:13px;letter-spacing:.06em;' +
          'text-transform:uppercase;padding:5px 10px;border-radius:8px}' +
        '.ti-mig-t{display:block;font-weight:900;font-size:24px;line-height:1.2;margin:10px 0 6px;color:#0a2a4d}' +
        '.ti-mig-s{display:block;font-size:17px;line-height:1.45;color:#3d4b5f;margin:0 0 14px}' +
        '.ti-mig-btn{display:inline-block;background:#ff8800;color:#fff;font-weight:900;font-size:18px;padding:11px 20px;border-radius:12px}' +
        '.ti-mig:hover .ti-mig-btn{background:#e06a00}' +
        '@media (max-width:640px){.ti-mig{flex-direction:column}.ti-mig-sx{flex:none;border-right:0;border-bottom:6px solid var(--c,#ff8800)}' +
          '.ti-mig-t{font-size:21px}.ti-mig-s{font-size:16px}.ti-mig-btn{display:block;text-align:center}}';
      document.head.appendChild(st);

      var a = document.createElement('a');
      a.className = 'ti-mig';
      a.href = 'https://www.awin1.com/cread.php?awinmid=' + m.id + '&awinaffid=' + AWIN_ME;
      a.target = '_blank';
      a.rel = 'sponsored nofollow noopener';
      a.style.setProperty('--c', m.c);
      a.innerHTML =
        '<span class="ti-mig-sx"><span class="ti-mig-logo"><img src="/img/marchi/' + m.logo + '" alt="' + m.nome +
          '" width="' + m.w + '" height="' + m.h + '" loading="lazy"></span></span>' +
        '<span class="ti-mig-dx"><span class="ti-mig-sopra">Negozio consigliato</span>' +
          '<span class="ti-mig-t">' + g.t + '</span><span class="ti-mig-s">' + g.s + '</span>' +
          '<span class="ti-mig-btn">Vai da ' + m.nome + ' →</span></span>';
      if (riga) riga.parentNode.insertBefore(a, riga.nextSibling);
      else if (mezzo) mezzo.parentNode.insertBefore(a, mezzo);
      else fondo.parentNode.insertBefore(a, fondo);
    } catch (e) { /* la guida non si rompe mai per questa carta */ }
  }
  // le pagine che si riempiono dal database (forum, articoli) hanno i titoli
  // solo dopo un attimo: si aspetta un po' prima di scegliere il posto
  function parti() { setTimeout(avvia, 1500); }
  if (document.readyState === 'complete') parti(); else window.addEventListener('load', parti);
})();
