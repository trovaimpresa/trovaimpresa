// js/ricerca-problema.js
// Traduce quello che scrive il cliente ("mi piove dal tetto") nella categoria
// esatta usata dal database, e costruisce il link alla pagina di ricerca giusta.
//
// I valori di "v" DEVONO combaciare carattere per carattere con le option dei
// moduli di registrazione: cerca-artigiani/imprese filtrano con contains() su
// array Postgres, quindi un valore diverso restituisce zero risultati.

(function (w) {
  'use strict';

  var A = 'cerca-artigiani.html',
      I = 'cerca-imprese.html',
      N = 'cerca-negozi.html',
      P = 'cerca-professionisti.html';

  // p = pagina, q = nome parametro, v = valore, k = parole del cliente
  var VOCI = [
    // ---- ARTIGIANI (parametro: mestiere) ----
    { p:A, q:'mestiere', v:'Coperture / Tetti', k:['tetto','tetti','copertura','coperture','tegole','piove dal tetto','infiltrazione dal tetto','grondaia','grondaie','lattoneria'] },
    { p:A, q:'mestiere', v:'Impermeabilizzazione', k:['impermeabilizzazione','impermeabilizzare','guaina','terrazzo che perde','infiltrazione','infiltrazioni','umidita','muffa'] },
    { p:A, q:'mestiere', v:'Idraulica', k:['idraulico','idraulica','tubo','tubi','perdita acqua','perdita d acqua','scarico','scarichi','rubinetto','water','sanitari','wc','lavandino','doccia','boiler','scaldabagno'] },
    { p:A, q:'mestiere', v:'Climatizzazione / Caldaie', k:['caldaia','caldaie','condizionatore','condizionatori','climatizzatore','aria condizionata','pompa di calore','termosifoni','radiatori','riscaldamento','clima'] },
    { p:A, q:'mestiere', v:'Impianti elettrici', k:['elettricista','impianto elettrico','elettrico','presa','prese','interruttore','quadro elettrico','corto circuito','luci','illuminazione','cablaggio','manca la corrente','senza corrente','salta la corrente','salta il salvavita','niente luce','black out'] },
    { p:A, q:'mestiere', v:'Pittura e tinteggiatura', k:['imbianchino','imbiancare','pittura','pitturare','tinteggiatura','tinteggiare','verniciare','dipingere','pareti da pitturare'] },
    { p:A, q:'mestiere', v:'Pavimenti e piastrelle', k:['pavimento','pavimenti','piastrelle','piastrellista','mattonelle','parquet','posa pavimento','gres','battiscopa'] },
    { p:A, q:'mestiere', v:'Serramenti / Infissi', k:['infissi','serramenti','finestra','finestre','porta','porte','portoncino','persiane','tapparelle','avvolgibili','scuri','veneziane'] },
    { p:A, q:'mestiere', v:'Cartongesso', k:['cartongesso','controsoffitto','controsoffitti','parete divisoria','velette'] },
    { p:A, q:'mestiere', v:'Falegnameria', k:['falegname','falegnameria','mobile su misura','mobili su misura','armadio su misura','cucina su misura','legno su misura','scala in legno'] },
    { p:A, q:'mestiere', v:'Fabbro / Cancelli / Recinzioni', k:['fabbro','cancello','cancelli','ringhiera','ringhiere','inferriate','grate','recinzione','recinzioni','ferro battuto','saracinesca'] },
    { p:A, q:'mestiere', v:'Giardinaggio / Esterni', k:['giardino','giardiniere','giardinaggio','potatura','potare','siepe','siepi','prato','erba','alberi','irrigazione'] },
    { p:A, q:'mestiere', v:'Sgomberi / Traslochi', k:['trasloco','traslochi','traslocare','sgombero','sgomberi','sgomberare','svuotare casa','trasporto mobili','portare via mobili'] },
    { p:A, q:'mestiere', v:'Pulizie / Disinfestazioni', k:['pulizie','pulizia','disinfestazione','disinfestazioni','sanificazione','blatte','topi','insetti'] },
    { p:A, q:'mestiere', v:'Spurghi / Spazzacamino', k:['spurgo','spurghi','fossa biologica','pozzo nero','canna fumaria','spazzacamino','autospurgo','fognatura'] },
    { p:A, q:'mestiere', v:'Tende da sole / Zanzariere', k:['tenda da sole','tende da sole','zanzariere','zanzariera','pergola','pergolato','gazebo'] },
    { p:A, q:'mestiere', v:'Vetraio', k:['vetraio','vetro','vetri','vetrata','specchio','doccia in vetro'] },
    { p:A, q:'mestiere', v:'Marmi e pietre', k:['marmo','marmi','granito','pietra','davanzale','davanzali','soglia','top cucina'] },
    { p:A, q:'mestiere', v:'Fotovoltaico / Pannelli solari', k:['fotovoltaico','pannelli solari','pannello solare','solare','batteria accumulo'] },
    { p:A, q:'mestiere', v:'Antennista / Allarmi', k:['antenna','antennista','allarme','antifurto','videosorveglianza','telecamere','citofono','videocitofono'] },
    { p:A, q:'mestiere', v:'Cappotti termici / Isolamento', k:['cappotto','cappotto termico','isolamento','isolare','coibentazione'] },
    { p:A, q:'mestiere', v:'Intonacatore', k:['intonaco','intonacare','intonacatore','rasatura','stucco pareti'] },
    { p:A, q:'mestiere', v:'Stufe e camini', k:['stufa','stufe','camino','camini','pellet','termocamino','caminetto'] },
    { p:A, q:'mestiere', v:'Ponteggi', k:['ponteggio','ponteggi','impalcatura','impalcature'] },
    { p:A, q:'mestiere', v:'Demolizione', k:['demolizione','demolire','abbattere muro','buttare giu'] },
    { p:A, q:'mestiere', v:'Movimento terra', k:['movimento terra','scavo','scavi','escavatore','livellamento','sbancamento'] },
    { p:A, q:'mestiere', v:'Asfalti', k:['asfalto','asfaltatura','asfaltare','bitume'] },
    { p:A, q:'mestiere', v:'Carpentiere', k:['carpentiere','carpenteria','struttura in legno','travi'] },
    { p:A, q:'mestiere', v:'Frigorista / Celle frigorifere', k:['frigorista','cella frigorifera','celle frigorifere','banco frigo'] },
    { p:A, q:'mestiere', v:'Edilizia / Muratura', k:['muratore','muratura','muro','muri','mattoni','tramezzo','opere murarie'] },
    { p:A, q:'mestiere', v:'Ristrutturazione completa', k:['ristrutturazione','ristrutturare','rifare casa','rifare il bagno','rifare bagno','rifare la cucina','rinnovare casa','ristrutturare appartamento'] },

    // ---- IMPRESE EDILI (parametro: mestiere) ----
    { p:I, q:'mestiere', v:'Costruzione nuova', k:['costruire casa','costruire una casa','nuova costruzione','casa nuova','costruzione da zero','villetta nuova'] },
    { p:I, q:'mestiere', v:'Facciate e cappotto termico', k:['facciata','facciate','rifacimento facciata','condominio facciata'] },
    { p:I, q:'mestiere', v:'Fondazioni', k:['fondazioni','fondazione','platea','pali di fondazione'] },
    { p:I, q:'mestiere', v:'Manutenzione edifici', k:['manutenzione edificio','manutenzione condominio','manutenzione stabile'] },
    { p:I, q:'mestiere', v:'Muratura e strutture', k:['struttura','strutture','cemento armato','pilastri','solaio','solai'] },
    { p:I, q:'mestiere', v:'Prefabbricati in calcestruzzo', k:['prefabbricato','prefabbricati','capannone'] },
    { p:I, q:'mestiere', v:'Costruzione industriale', k:['costruzione industriale','edificio industriale'] },
    { p:I, q:'mestiere', v:'Edilizia commerciale', k:['negozio da ristrutturare','locale commerciale','ufficio da ristrutturare'] },
    { p:I, q:'mestiere', v:'Cottimisti', k:['cottimista','cottimisti','cottimo'] },

    // ---- PROFESSIONISTI (parametro: tipo) ----
    { p:P, q:'tipo', v:'Architetto', k:['architetto','progetto casa','progettazione','interior design','arredamento progetto'] },
    { p:P, q:'tipo', v:'Geometra', k:['geometra','pratica catastale','catasto','accatastamento','visura','pratiche comune','sanatoria','condono'] },
    { p:P, q:'tipo', v:'Ingegnere civile', k:['ingegnere','ingegnere civile','calcolo strutturale'] },
    { p:P, q:'tipo', v:'Ingegnere strutturale', k:['ingegnere strutturale','struttura antisismica','sismabonus','vulnerabilita sismica'] },
    { p:P, q:'tipo', v:'Ingegnere impiantistico', k:['ingegnere impiantistico','progetto impianti'] },
    { p:P, q:'tipo', v:'Consulente energetico', k:['ape','certificazione energetica','attestato prestazione energetica','classe energetica','diagnosi energetica'] },
    { p:P, q:'tipo', v:'Consulente sicurezza', k:['sicurezza cantiere','coordinatore sicurezza','psc','pos','626','81 08'] },
    { p:P, q:'tipo', v:'Direttore lavori', k:['direttore lavori','direzione lavori'] },
    { p:P, q:'tipo', v:'Collaudatore strutture', k:['collaudo','collaudatore'] },
    { p:P, q:'tipo', v:'Amministratore di condominio', k:['amministratore di condominio','amministratore condominio'] },
    { p:P, q:'tipo', v:'Perito industriale', k:['perito','perito industriale'] },
    { p:P, q:'tipo', v:'Topografo', k:['topografo','rilievo topografico','frazionamento'] },
    { p:P, q:'tipo', v:'Project manager', k:['project manager','gestione cantiere'] },

    // ---- NEGOZI (parametro: tipo) ----
    { p:N, q:'tipo', v:'ferramenta', k:['ferramenta','viteria','utensili'] },
    { p:N, q:'tipo', v:'materiali_edili', k:['materiali edili','cemento','sabbia','mattoni da comprare','calce','mattoni','malta','ghiaia'] },
    { p:N, q:'tipo', v:'noleggio_attrezzature', k:['noleggio','noleggiare','affitto attrezzature','noleggio ponteggio'] },
    { p:N, q:'tipo', v:'colorificio', k:['colorificio','vernici','colori','pittura da comprare','vernice','pittura','smalto'] },
    { p:N, q:'tipo', v:'ceramiche', k:['ceramiche','piastrelle da comprare','showroom piastrelle','piastrelle','mattonelle','gres'] },
    { p:N, q:'tipo', v:'arredo_bagno', k:['arredo bagno','mobile bagno','sanitari da comprare','vasca','sanitari','doccia','box doccia'] },
    { p:N, q:'tipo', v:'legname', k:['legname','tavole di legno','magazzino legno'] },
    { p:N, q:'tipo', v:'termoidraulica', k:['termoidraulica','materiale idraulico'] },
    { p:N, q:'tipo', v:'attrezzature_edili', k:['attrezzature edili','betoniera','ponteggio da comprare'] },
    { p:N, q:'tipo', v:'isolanti_impermeabilizzanti', k:['isolanti','materiale isolante','guaina da comprare','guaina','polistirolo','lana di roccia'] },
    { p:N, q:'tipo', v:'infissi_serramenti', k:['finestre','infissi','serramenti','porte','tapparelle'] },
    { p:N, q:'tipo', v:'pavimenti', k:['pavimenti','parquet','laminato'] },
    { p:N, q:'tipo', v:'climatizzazione_caldaie', k:['caldaia','condizionatore','climatizzatore','pompa di calore'] },
    { p:N, q:'tipo', v:'elettrico', k:['materiale elettrico','cavi','faretti'] },
    { p:N, q:'tipo', v:'stufe_camini', k:['stufa','stufe','camino','pellet'] },
    { p:N, q:'tipo', v:'agenzia_immobiliare', k:['agenzia immobiliare','comprare casa','vendere casa','affitto casa'] }
  ];

  // Parole che spostano una richiesta ambigua verso il negozio invece dell'artigiano.
  var ACQUISTO = ['comprare','compro','acquistare','acquisto','vendita','vendono','negozio','rivenditore','dove trovo','prezzo al mq'];

  function normalizza(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')  // via gli accenti
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Restituisce { p, q, v } oppure null se non riconosce nulla.
  function riconosci(testo) {
    var t = normalizza(testo);
    if (!t) return null;

    var vuoleComprare = ACQUISTO.some(function (a) { return t.indexOf(normalizza(a)) !== -1; });
    var migliore = null, punteggio = 0;

    VOCI.forEach(function (voce) {
      voce.k.forEach(function (parola) {
        var chiave = normalizza(parola);
        if (t.indexOf(chiave) === -1) return;
        // la parola piu lunga vince: "rifare il bagno" batte "bagno"
        var punti = chiave.length;
        if (vuoleComprare && voce.p === N) punti += 100;
        if (punti > punteggio) { punteggio = punti; migliore = voce; }
      });
    });

    return migliore;
  }

  // Costruisce l'URL finale. Se non riconosce il lavoro manda comunque
  // all'elenco artigiani della citta, senza filtro: meglio troppi che zero.
  function costruisciUrl(testo, citta) {
    var voce = riconosci(testo);
    var pagina = voce ? voce.p : A;
    var params = [];
    if (voce) params.push(voce.q + '=' + encodeURIComponent(voce.v));
    if (citta) params.push('citta=' + encodeURIComponent(citta));
    return pagina + (params.length ? '?' + params.join('&') : '');
  }

  w.RicercaProblema = {
    riconosci: riconosci,
    costruisciUrl: costruisciUrl,
    voci: VOCI
  };
})(window);
