/* ============================================================
   24 set 2026 — LA LISTA VUOTA NON RESTA VUOTA
   Quando cerca-artigiani / cerca-imprese / cerca-professionisti non
   trovano nessuno, sotto «Nessun ... trovato» compare il riquadro della
   pagina «mestiere + citta'» (es. /idraulico-rieti): prezzi, consigli,
   come scegliere. Sono 17 voci x 106 citta' = 1.802 pagine gia' online.
   - Il mestiere si legge dal filtro della pagina e si traduce nella voce
     delle pagine con la tabella VOCI qui sotto.
   - La citta' puo' essere un paese (Amatrice): si cerca la sua provincia
     in js/geo-italia.js (caricato SOLO in quel caso) e si usa il capoluogo.
   - Se il mestiere non ha una pagina sua, si manda alla pagina della
     citta' (/imprese-rieti), che c'e' per tutte e 106.
   ⚠️ L'elenco CITTA e' copiato da genera-mestiere-citta.js: se li' si
      aggiunge una citta', va aggiunta anche qui.
   ============================================================ */
(function (w) {
  'use strict';

  var CITTA = [
    ["roma","Roma"],
    ["milano","Milano"],
    ["torino","Torino"],
    ["napoli","Napoli"],
    ["rieti","Rieti"],
    ["palermo","Palermo"],
    ["genova","Genova"],
    ["bologna","Bologna"],
    ["firenze","Firenze"],
    ["bari","Bari"],
    ["catania","Catania"],
    ["verona","Verona"],
    ["venezia","Venezia"],
    ["messina","Messina"],
    ["padova","Padova"],
    ["trieste","Trieste"],
    ["brescia","Brescia"],
    ["parma","Parma"],
    ["modena","Modena"],
    ["reggio-emilia","Reggio Emilia"],
    ["agrigento","Agrigento"],
    ["alessandria","Alessandria"],
    ["ancona","Ancona"],
    ["aosta","Aosta"],
    ["arezzo","Arezzo"],
    ["ascoli-piceno","Ascoli Piceno"],
    ["asti","Asti"],
    ["avellino","Avellino"],
    ["barletta","Barletta"],
    ["belluno","Belluno"],
    ["benevento","Benevento"],
    ["bergamo","Bergamo"],
    ["biella","Biella"],
    ["bolzano","Bolzano"],
    ["brindisi","Brindisi"],
    ["cagliari","Cagliari"],
    ["caltanissetta","Caltanissetta"],
    ["campobasso","Campobasso"],
    ["caserta","Caserta"],
    ["catanzaro","Catanzaro"],
    ["chieti","Chieti"],
    ["como","Como"],
    ["cosenza","Cosenza"],
    ["cremona","Cremona"],
    ["crotone","Crotone"],
    ["cuneo","Cuneo"],
    ["enna","Enna"],
    ["fermo","Fermo"],
    ["ferrara","Ferrara"],
    ["foggia","Foggia"],
    ["forlì","Forlì"],
    ["frosinone","Frosinone"],
    ["gorizia","Gorizia"],
    ["grosseto","Grosseto"],
    ["imperia","Imperia"],
    ["isernia","Isernia"],
    ["l-aquila","L\\"],
    ["la-spezia","La Spezia"],
    ["latina","Latina"],
    ["lecce","Lecce"],
    ["lecco","Lecco"],
    ["livorno","Livorno"],
    ["lodi","Lodi"],
    ["lucca","Lucca"],
    ["macerata","Macerata"],
    ["mantova","Mantova"],
    ["massa","Massa"],
    ["matera","Matera"],
    ["monza","Monza"],
    ["novara","Novara"],
    ["nuoro","Nuoro"],
    ["oristano","Oristano"],
    ["pavia","Pavia"],
    ["perugia","Perugia"],
    ["pesaro","Pesaro"],
    ["pescara","Pescara"],
    ["piacenza","Piacenza"],
    ["pisa","Pisa"],
    ["pistoia","Pistoia"],
    ["pordenone","Pordenone"],
    ["potenza","Potenza"],
    ["prato","Prato"],
    ["ragusa","Ragusa"],
    ["ravenna","Ravenna"],
    ["reggio-calabria","Reggio Calabria"],
    ["rimini","Rimini"],
    ["rovigo","Rovigo"],
    ["salerno","Salerno"],
    ["sassari","Sassari"],
    ["savona","Savona"],
    ["siena","Siena"],
    ["siracusa","Siracusa"],
    ["sondrio","Sondrio"],
    ["taranto","Taranto"],
    ["teramo","Teramo"],
    ["terni","Terni"],
    ["trapani","Trapani"],
    ["trento","Trento"],
    ["treviso","Treviso"],
    ["udine","Udine"],
    ["varese","Varese"],
    ["verbania","Verbania"],
    ["vercelli","Vercelli"],
    ["vibo-valentia","Vibo Valentia"],
    ["vicenza","Vicenza"],
    ["viterbo","Viterbo"]
  ];

  /* valore del filtro (minuscolo) -> [slug della pagina, nome da mostrare] */
  var VOCI = {
    /* artigiani */
    'idraulica': ['idraulico', 'Idraulico'],
    'impianti elettrici': ['elettricista', 'Elettricista'],
    'climatizzazione / caldaie': ['termoidraulico', 'Termoidraulico'],
    'fotovoltaico / pannelli solari': ['installatore-fotovoltaico', 'Installatore fotovoltaico'],
    'ristrutturazione completa': ['impresa-edile', 'Impresa edile'],
    'edilizia / muratura': ['muratore', 'Muratore'],
    'intonacatore': ['muratore', 'Muratore'],
    'demolizione': ['impresa-edile', 'Impresa edile'],
    'pittura e tinteggiatura': ['imbianchino', 'Imbianchino'],
    'pavimenti e piastrelle': ['piastrellista', 'Piastrellista'],
    'cartongesso': ['cartongessista', 'Cartongessista'],
    'coperture / tetti': ['rifacimento-tetti', 'Rifacimento tetti'],
    'impermeabilizzazione': ['rifacimento-tetti', 'Rifacimento tetti'],
    'cappotti termici / isolamento': ['impresa-edile', 'Impresa edile'],
    'serramenti / infissi': ['serramentista', 'Serramentista'],
    /* imprese */
    'costruzione nuova': ['impresa-edile', 'Impresa edile'],
    'facciate e cappotto termico': ['impresa-edile', 'Impresa edile'],
    'manutenzione edifici': ['impresa-edile', 'Impresa edile'],
    'muratura e strutture': ['impresa-edile', 'Impresa edile'],
    'fondazioni': ['impresa-edile', 'Impresa edile'],
    'edilizia commerciale': ['impresa-edile', 'Impresa edile'],
    /* professionisti (il filtro arriva sia «Geometra» sia «geometra») */
    'geometra': ['geometra', 'Geometra'],
    'architetto': ['architetto', 'Architetto'],
    'ingegnere strutturale': ['ingegnere-strutturale', 'Ingegnere strutturale'],
    'ingegnere_strutturale': ['ingegnere-strutturale', 'Ingegnere strutturale'],
    'ingegnere civile': ['ingegnere-strutturale', 'Ingegnere strutturale'],
    'consulente energetico': ['certificato-energetico', 'Certificato energetico (APE)'],
    'consulente_energetico': ['certificato-energetico', 'Certificato energetico (APE)'],
    'direttore lavori': ['direttore-lavori', 'Direttore dei lavori'],
    'direttore_lavori': ['direttore-lavori', 'Direttore dei lavori'],
    'interior designer': ['interior-designer', 'Interior designer'],
    'interior_designer': ['interior-designer', 'Interior designer']
  };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2019`]/g, "'").replace(/\s+/g, ' ').trim();
  }
  function trovaCapoluogo(nome) {
    var n = norm(nome);
    for (var i = 0; i < CITTA.length; i++) if (norm(CITTA[i][1]) === n) return CITTA[i];
    return null;
  }
  /* «Monza e della Brianza» -> Monza, «Forli'-Cesena» -> Forli' */
  function dallaProvincia(prov) {
    var p = norm(prov), c = trovaCapoluogo(prov);
    if (c) return c;
    for (var i = 0; i < CITTA.length; i++) if (p.indexOf(norm(CITTA[i][1])) === 0) return CITTA[i];
    return null;
  }
  var _geo = null;
  function caricaGeo() {
    if (_geo) return _geo;
    _geo = new Promise(function (ok) {
      if (w.GEO_ITALIA) return ok(w.GEO_ITALIA);
      var s = document.createElement('script');
      s.src = '/js/geo-italia.js';
      s.onload = function () { ok(w.GEO_ITALIA || null); };
      s.onerror = function () { ok(null); };
      document.head.appendChild(s);
    });
    return _geo;
  }
  function daComune(nome) {
    var n = norm(nome);
    return caricaGeo().then(function (g) {
      if (!g) return null;
      for (var reg in g) for (var prov in g[reg]) {
        var lista = g[reg][prov];
        if (norm(prov) === n) return dallaProvincia(prov);
        for (var k = 0; k < lista.length; k++) if (norm(lista[k]) === n) return dallaProvincia(prov);
      }
      return null;
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  var CSS = '.rm-box{display:block;max-width:520px;margin:18px auto 20px;text-align:left;text-decoration:none;'
    + 'background:#eef5ff;border:1px solid #d6e4ff;border-radius:14px;padding:16px 18px;color:#0a2a4d}'
    + '.rm-box:hover{border-color:#8fb5ff;background:#e6f0ff}'
    + '.rm-k{display:block;font-size:12.5px;font-weight:800;letter-spacing:.4px;color:#1d4ed8;margin-bottom:4px}'
    + '.rm-t{display:block;font-size:18px;font-weight:800;line-height:1.3}'
    + '.rm-s{display:block;font-size:14.5px;color:#3c4a5c;margin-top:4px;line-height:1.45}'
    + '.rm-v{display:inline-block;margin-top:10px;font-size:15px;font-weight:800;color:#0066ff}';
  function stile() {
    if (document.getElementById('rm-stile')) return;
    var st = document.createElement('style'); st.id = 'rm-stile'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* dove: id del segnaposto · valore: il filtro mestiere/tipo · citta: il testo cercato */
  function monta(dove, valore, citta) {
    var box = document.getElementById(dove);
    if (!box || !citta || !String(citta).trim()) return;
    var voce = VOCI[norm(valore)] || null;
    var cap = trovaCapoluogo(citta);
    var passo = cap ? Promise.resolve(cap) : daComune(citta);
    passo.then(function (c) {
      if (!c || !document.body.contains(box)) return;
      stile();
      var cittaVera = String(citta).trim();
      var nomeC = c[1];
      var vicino = norm(nomeC) !== norm(cittaVera);   /* paese -> capoluogo */
      var href, titolo, sotto;
      if (voce) {
        href = '/' + encodeURI(voce[0] + '-' + c[0]);
        titolo = voce[1] + ' a ' + nomeC + ': prezzi e consigli';
        sotto = 'Quanto costa, come scegliere e cosa chiedere prima di cominciare'
          + (vicino ? '. La zona di ' + nomeC + ' comprende anche ' + cittaVera + '.' : '.');
      } else {
        href = '/' + encodeURI('imprese-' + c[0]);
        titolo = 'Imprese e artigiani a ' + nomeC;
        sotto = 'Tutte le categorie della zona, con i prezzi di ogni lavoro'
          + (vicino ? ' (anche per ' + cittaVera + ').' : '.');
      }
      box.innerHTML = '<a class="rm-box" href="' + href + '">'
        + '<span class="rm-intro rm-k">INTANTO PUOI GUARDARE</span>'
        + '<span class="rm-t">' + esc(titolo) + '</span>'
        + '<span class="rm-s">' + esc(sotto) + '</span>'
        + '<span class="rm-v">Apri la pagina &rarr;</span></a>';
    });
  }

  w.RimandoMestiere = { monta: monta, voci: VOCI, citta: CITTA };
})(window);
