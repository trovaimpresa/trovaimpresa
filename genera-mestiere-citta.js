/* ============================================================
   genera-mestiere-citta.js
   TrovaImpresa — esegui con:  node genera-mestiere-citta.js

   Crea una pagina <mestiere>-<citta>.html per ogni incrocio
   fra MESTIERI e CITTA, piu' sitemap-mestieri.xml.

   COME E' FATTA LA PAGINA (deciso il 30 agosto 2026)
   Il contenuto NON e' l'elenco delle imprese: e' la risposta alla
   domanda («quanto costa un idraulico a Roma, quando chiamarlo, cosa
   chiedere nel preventivo»), presa dalle guide prezzi del sito. Le
   imprese stanno in fondo, e se in quella citta' non ce n'e' nessuna
   di quel mestiere la pagina regge lo stesso: al posto dell'elenco
   compare l'invito a lasciare la richiesta.
   Il motivo e' nei numeri: al 30 agosto le imprese con email
   confermata sono 80, e gli incroci mestiere+citta' con almeno tre
   imprese sono DUE. Aspettare che il database si riempia vorrebbe
   dire non fare mai queste pagine.

   ⚠️ I PREZZI QUI DENTRO SONO COPIATI DALLE GUIDE DEL SITO, non
   inventati. Se cambi una guida, cambia anche la riga qui sotto:
   il campo `guida` dice da quale file viene ogni cifra.

   Rilancialo quando vuoi: sovrascrive le pagine senza problemi.
   Richiede Node 18+ (fetch nativo).
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const BASE = 'https://trovaimpresa.com';
const TODAY = new Date().toISOString().slice(0, 10);

// Stessa chiave pubblica gia' usata da genera-imprese-citta.js
const SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

const MAX_IMPRESE = 12;

/* ============================================================
   I MESTIERI
   `db` = come sono scritti nel database (colonna mestiere o
   dentro l'array mestieri). Servono per pescare le imprese giuste.
   `slug` = come lo cerca la gente su Google, che NON e' come si
   chiama nel database: nel database c'e' «impianti elettrici»,
   la gente scrive «elettricista».
   ============================================================ */
const TABELLA_ARCHITETTO = `
  <h2>Quanto dice la legge: il decreto Parametri</h2>
  <p>Esiste una tariffa ufficiale dello Stato per architetti e ingegneri: il <strong>decreto Parametri</strong> (DM 17 giugno 2016). Non è obbligatoria fra privati, ma è il riferimento che usano le gare pubbliche e i tribunali. Serve a capire se una parcella è in linea o fuori scala.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Importo dei lavori</th><th>Progetto</th><th>Direzione lavori</th><th>Totale</th></tr>
      <tr><td>20.000 €</td><td>1.256 €</td><td>1.340 €</td><td><strong>2.596 €</strong> &nbsp;<span style="color:#888;font-weight:400">(13,0%)</span></td></tr>
      <tr><td>50.000 €</td><td>2.308 €</td><td>2.462 €</td><td><strong>4.769 €</strong> &nbsp;<span style="color:#888;font-weight:400">(9,5%)</span></td></tr>
      <tr><td>100.000 €</td><td>3.705 €</td><td>3.952 €</td><td><strong>7.657 €</strong> &nbsp;<span style="color:#888;font-weight:400">(7,7%)</span></td></tr>
      <tr><td>200.000 €</td><td>6.030 €</td><td>6.432 €</td><td><strong>12.462 €</strong> &nbsp;<span style="color:#888;font-weight:400">(6,2%)</span></td></tr>
  </table>
  </div>
  <p class="nota-fonte">Calcolo secondo il DM 17 giugno 2016: compenso = V × G × Q × P, con P = 0,03 + 10/V<sup>0,4</sup>. Qui G = 0,95 (edilizia residenziale corrente, categoria E.06) e Q secondo la tavola Z-2: 0,230 progetto definitivo, 0,070 esecutivo, 0,320 direzione lavori. Esclusi cassa previdenziale, IVA e spese.</p>
  <p>Nota che la percentuale <strong>scende</strong> man mano che i lavori crescono: su un cantiere piccolo il lavoro del progettista non si dimezza, e per questo incide di più.</p>
`;

const TABELLA_DIRETTORE_LAVORI = `
  <h2>Quanto dice la legge: il decreto Parametri</h2>
  <p>La direzione lavori ha una tariffa ufficiale: il <strong>decreto Parametri</strong> (DM 17 giugno 2016). Non è obbligatoria fra privati, ma è il riferimento delle gare pubbliche e dei tribunali. Serve a capire se quello che ti chiedono è in linea.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Importo dei lavori</th><th>Direzione lavori</th><th>Incidenza</th></tr>
      <tr><td>20.000 €</td><td><strong>1.340 €</strong></td><td><span style="color:#888">6,7% dei lavori</span></td></tr>
      <tr><td>50.000 €</td><td><strong>2.462 €</strong></td><td><span style="color:#888">4,9% dei lavori</span></td></tr>
      <tr><td>100.000 €</td><td><strong>3.952 €</strong></td><td><span style="color:#888">4,0% dei lavori</span></td></tr>
      <tr><td>200.000 €</td><td><strong>6.432 €</strong></td><td><span style="color:#888">3,2% dei lavori</span></td></tr>
  </table>
  </div>
  <p class="nota-fonte">Calcolo secondo il DM 17 giugno 2016: compenso = V × G × Q × P, con P = 0,03 + 10/V<sup>0,4</sup>, G = 0,95 (categoria E.06) e Q = 0,320 (tavola Z-2, direzione lavori). Esclusi cassa previdenziale, IVA e spese.</p>
  <p>Su lavori piccoli la percentuale sale, su quelli grandi scende. È il motivo per cui una direzione lavori al 2% su un bagno non esiste, e una al 5% su una villa è fuori mercato.</p>
`;

const TAB_LAZIO_PIASTRELLISTA = `
  <h2>Il listino ufficiale: la Tariffa della Regione Lazio</h2>
  <p>Le Regioni pubblicano un <strong>prezziario ufficiale</strong> delle lavorazioni edili, quello che si usa negli appalti pubblici e nelle perizie. Non è un prezzo di mercato — di solito sta più in alto, perché comprende tutto quello che un preventivo privato a volte dimentica — ma è il metro per capire se una cifra è seria.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Lavorazione</th><th>Tariffa Regione Lazio 2023</th></tr>
      <tr><td>Demolizione del vecchio pavimento</td><td>15,21 €/mq</td></tr>
      <tr><td>Gres porcellanato 30×30 / 40×40</td><td>60,68 – 62,20 €/mq</td></tr>
      <tr><td>Gres porcellanato 60×60</td><td>93,29 €/mq</td></tr>
      <tr><td>Parquet in rovere</td><td>94,30 – 148,44 €/mq</td></tr>
      <tr><td>Battiscopa in legno</td><td>16,17 €/m</td></tr>
  </table>
  </div>
  <p class="nota-fonte">Voci della Tariffa dei prezzi della Regione Lazio 2023 (DGR 101/2023), Parte A. Ogni Regione ha il suo prezziario e fra una e l'altra ci sono differenze: fuori dal Lazio prendi questi numeri come ordine di grandezza, non come listino della tua zona.</p>
  <p><a href="/quanto-costa-posare-il-pavimento" style="color:#0066ff;font-weight:700;">Il conto completo su una casa tipo, voce per voce →</a></p>
`;

const TAB_LAZIO_IMBIANCHINO = `
  <h2>Il listino ufficiale: la Tariffa della Regione Lazio</h2>
  <p>Le Regioni pubblicano un <strong>prezziario ufficiale</strong> delle lavorazioni edili, quello che si usa negli appalti pubblici e nelle perizie. Non è un prezzo di mercato — di solito sta più in alto, perché comprende tutto quello che un preventivo privato a volte dimentica — ma è il metro per capire se una cifra è seria.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Lavorazione</th><th>Tariffa Regione Lazio 2023</th></tr>
      <tr><td>Idropittura lavabile, 3 mani</td><td>12,17 €/mq</td></tr>
      <tr><td>Tempera, 2 mani</td><td>6,33 €/mq</td></tr>
      <tr><td>Raschiatura della vecchia tinta</td><td>5,42 €/mq</td></tr>
      <tr><td>Rasatura delle pareti</td><td>10,83 €/mq</td></tr>
      <tr><td>Fissativo di fondo</td><td>3,16 €/mq</td></tr>
  </table>
  </div>
  <p class="nota-fonte">Voci della Tariffa dei prezzi della Regione Lazio 2023 (DGR 101/2023), Parte A. Ogni Regione ha il suo prezziario e fra una e l'altra ci sono differenze: fuori dal Lazio prendi questi numeri come ordine di grandezza, non come listino della tua zona.</p>
  <p><a href="/quanto-costa-imbiancare-casa" style="color:#0066ff;font-weight:700;">Il conto completo su una casa tipo, voce per voce →</a></p>
`;

const TAB_LAZIO_SERRAMENTISTA = `
  <h2>Il listino ufficiale: la Tariffa della Regione Lazio</h2>
  <p>Le Regioni pubblicano un <strong>prezziario ufficiale</strong> delle lavorazioni edili, quello che si usa negli appalti pubblici e nelle perizie. Non è un prezzo di mercato — di solito sta più in alto, perché comprende tutto quello che un preventivo privato a volte dimentica — ma è il metro per capire se una cifra è seria.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Lavorazione</th><th>Tariffa Regione Lazio 2023</th></tr>
      <tr><td>Infisso in PVC, 2 camere</td><td>444 – 521 €/mq</td></tr>
      <tr><td>Infisso in PVC, 5 camere</td><td>561 – 602 €/mq</td></tr>
      <tr><td>Alluminio a taglio termico</td><td>714 – 933 €/mq</td></tr>
      <tr><td>Legno lamellare</td><td>1.262 – 1.398 €/mq</td></tr>
      <tr><td>Smontaggio del vecchio infisso</td><td>17,61 – 24,82 €/mq</td></tr>
  </table>
  </div>
  <p class="nota-fonte">Voci della Tariffa dei prezzi della Regione Lazio 2023 (DGR 101/2023), Parte A. Ogni Regione ha il suo prezziario e fra una e l'altra ci sono differenze: fuori dal Lazio prendi questi numeri come ordine di grandezza, non come listino della tua zona.</p>
  <p><a href="/quanto-costa-cambiare-gli-infissi" style="color:#0066ff;font-weight:700;">Il conto completo su una casa tipo, voce per voce →</a></p>
`;

const TAB_LAZIO_IMPRESA_EDILE = `
  <h2>Il listino ufficiale: la Tariffa della Regione Lazio</h2>
  <p>Le Regioni pubblicano un <strong>prezziario ufficiale</strong> delle lavorazioni edili, quello che si usa negli appalti pubblici e nelle perizie. Non è un prezzo di mercato — di solito sta più in alto, perché comprende tutto quello che un preventivo privato a volte dimentica — ma è il metro per capire se una cifra è seria.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Lavorazione</th><th>Tariffa Regione Lazio 2023</th></tr>
      <tr><td>Cappotto in polistirene (EPS)</td><td>128,67 €/mq</td></tr>
      <tr><td>Cappotto in lana di roccia</td><td>126,68 €/mq</td></tr>
      <tr><td>Cappotto in lana di vetro</td><td>131,09 €/mq</td></tr>
      <tr><td>Tinteggiatura finale al quarzo</td><td>11,69 €/mq</td></tr>
  </table>
  </div>
  <p class="nota-fonte">Voci della Tariffa dei prezzi della Regione Lazio 2023 (DGR 101/2023), Parte A. Ogni Regione ha il suo prezziario e fra una e l'altra ci sono differenze: fuori dal Lazio prendi questi numeri come ordine di grandezza, non come listino della tua zona.</p>
  <p><a href="/quanto-costa-cappotto-termico" style="color:#0066ff;font-weight:700;">Il conto completo su una casa tipo, voce per voce →</a></p>
`;

const TAB_STRUTTURE = `
  <h2>Quanto dice la legge: il decreto Parametri</h2>
  <p>Anche per le strutture esiste una tariffa ufficiale dello Stato, il <strong>decreto Parametri</strong> (DM 17 giugno 2016). Il conto non si fa sul valore della casa ma sul valore delle <em>sole opere strutturali</em>: la trave, il rinforzo, il consolidamento. Ecco i casi più comuni in una casa.</p>
  <div class="tab-wrap">
  <table class="prezzi">
    <tr><th>Intervento</th><th>Valore delle opere</th><th>Progetto e calcoli</th><th>Direzione lavori</th><th>Totale</th></tr>
      <tr><td>Apertura di un muro portante, con trave</td><td>5.000 €</td><td>515 €</td><td>652 €</td><td><strong>1.167 €</strong></td></tr>
      <tr><td>Rinforzo o rifacimento di un solaio</td><td>15.000 €</td><td>1.041 €</td><td>1.319 €</td><td><strong>2.360 €</strong></td></tr>
      <tr><td>Ampliamento o soppalco</td><td>30.000 €</td><td>1.640 €</td><td>2.078 €</td><td><strong>3.718 €</strong></td></tr>
      <tr><td>Sopraelevazione</td><td>80.000 €</td><td>3.177 €</td><td>4.024 €</td><td><strong>7.201 €</strong></td></tr>
  </table>
  </div>
  <p class="nota-fonte">Calcolo secondo il DM 17 giugno 2016: compenso = V × G × Q × P, con P = 0,03 + 10/V<sup>0,4</sup>, G = 0,95 (categoria S.03, strutture in cemento armato con azioni sismiche) e Q della tavola Z-2 per le strutture: 0,180 progetto definitivo, 0,120 esecutivo, 0,380 direzione lavori. Esclusi cassa previdenziale, IVA, diritti di deposito e indagini sui materiali.</p>
  <p>Le cifre della tabella sono il <strong>minimo di riferimento</strong>: sul mercato un tecnico può chiedere di più, soprattutto quando la struttura è vecchia e servono saggi per capire com'è fatta davvero.</p>
`;

const MESTIERI = [
  {
    slug: 'impresa-edile', nome: 'Impresa edile', articolo: "un'",
    db: ['ristrutturazione', 'ristrutturazione completa', 'costruzione nuova'],
    guida: '/quanto-costa-ristrutturare-casa', guidaNome: 'Quanto costa ristrutturare casa',
    prezzo: 'da 400 a 1.800 €/mq',
    prezzoDettaglio: 'Una ristrutturazione leggera (tinteggiature, pavimenti, qualche impianto) sta fra 350 e 600 €/mq. Una ristrutturazione completa, con impianti e bagni rifatti da zero, sale a 600–800 €/mq. Su un appartamento di 100 mq significa circa 60.000–80.000 € chiavi in mano.',
    tabella: TAB_LAZIO_IMPRESA_EDILE,
    quando: [
      'Ristrutturazione completa di un appartamento o di una casa',
      'Lavori strutturali: abbattere muri, aprire vani, consolidare solai',
      'Nuova costruzione o ampliamento',
      'Coordinamento di più artigiani su un unico cantiere'
    ],
    chiedere: [
      'Il preventivo voce per voce, con quantità e prezzo unitario: un preventivo con scritto solo «ristrutturazione: 60.000 €» non si può confrontare con niente',
      'Cosa è escluso — spesso mancano smaltimento macerie, ponteggi e allacci',
      'Se il prezzo comprende i materiali o solo la manodopera',
      'Il DURC in regola e la copertura assicurativa del cantiere'
    ],
    faq: [
      { d: 'Quanto ci vuole per ristrutturare un appartamento?', r: 'Per un appartamento di 100 mq da ristrutturare completamente si va dai 3 ai 5 mesi. I ritardi più frequenti non sono in cantiere ma nei permessi e nei tempi di consegna dei materiali.' },
      { d: 'Meglio un\'impresa unica o i singoli artigiani?', r: 'L\'impresa unica costa un po\' di più ma coordina i mestieri e risponde di tutto il cantiere. I singoli artigiani costano meno solo se hai tempo e competenza per fare tu da coordinatore.' },
      { d: 'Serve un progetto per ristrutturare?', r: 'Per lavori interni senza modifiche strutturali spesso basta una CILA. Se tocchi muri portanti, prospetti o volumi serve un tecnico e una pratica più impegnativa.' }
    ]
  },
  {
    slug: 'idraulico', nome: 'Idraulico', articolo: 'un ',
    db: ['idraulica'],
    guida: '/quanto-costa-un-idraulico', guidaNome: 'Quanto costa un idraulico',
    prezzo: '70–150 € a intervento',
    prezzoDettaglio: 'Una chiamata singola per una riparazione sta fra 70 e 150 €, diritto di chiamata compreso. Rifare l\'impianto idraulico di un appartamento è un\'altra cosa: si va da 2.000 a 5.000 €.',
    quando: [
      'Perdite, tubi rotti, scarichi otturati',
      'Sostituzione di sanitari, rubinetteria, box doccia',
      'Rifacimento completo dell\'impianto idraulico',
      'Allacci di lavatrice, lavastoviglie, addolcitore'
    ],
    chiedere: [
      'Se il diritto di chiamata è compreso nel prezzo o si somma',
      'Quanto costa l\'ora e da che minuto parte il conteggio',
      'Il supplemento per l\'intervento urgente, di sera o festivo',
      'La garanzia sul lavoro fatto e sui pezzi sostituiti'
    ],
    faq: [
      { d: 'Quanto costa un idraulico per una perdita?', r: 'Per una perdita semplice, raggiungibile senza rompere, si sta fra 70 e 150 € compreso il diritto di chiamata. Se bisogna aprire il muro per arrivare al tubo il conto sale, perché entrano in gioco anche muratura e ripristino.' },
      { d: 'Quanto costa un idraulico di domenica?', r: 'L\'intervento festivo o notturno costa in genere dal 50 al 100% in più della tariffa normale. È una maggiorazione da farsi dire al telefono prima che l\'idraulico esca di casa, non dopo.' },
      { d: 'Come capisco se un preventivo idraulico è gonfiato?', r: 'Fatti scrivere ore di manodopera e materiali separati. Se il preventivo è una cifra unica senza dettaglio, chiedi il dettaglio: chi lavora onesto non ha problemi a darlo.' }
    ]
  },
  {
    slug: 'elettricista', nome: 'Elettricista', articolo: 'un ',
    db: ['impianti elettrici', 'antennista / allarmi'],
    guida: '/quanto-costa-rifare-impianto-elettrico', guidaNome: 'Quanto costa rifare l\'impianto elettrico',
    prezzo: '50–130 €/mq',
    prezzoDettaglio: 'Rifare l\'impianto elettrico costa fra 50 e 130 €/mq secondo il livello: impianto base, oppure impianto con più punti luce, domotica e predisposizioni. Su un appartamento di 90 mq si va indicativamente dai 4.500 ai 12.000 €.',
    quando: [
      'Impianto vecchio, senza messa a terra o senza salvavita',
      'Ristrutturazione: l\'impianto si rifà quando i muri sono già aperti',
      'Certificazione di conformità per vendita o affitto',
      'Aggiunta di punti luce, prese, videocitofono, allarme'
    ],
    chiedere: [
      'Se è compresa la dichiarazione di conformità (DM 37/08): senza quella l\'impianto non è vendibile né affittabile',
      'Quanti punti luce e quante prese sono nel prezzo — è la voce che fa saltare i preventivi',
      'Se il ripristino di tracce e muri è compreso o lo fa il muratore',
      'La marca del quadro e dei frutti: fra una marca economica e una buona ballano centinaia di euro'
    ],
    faq: [
      { d: 'Ogni quanto va rifatto l\'impianto elettrico?', r: 'Non c\'è una scadenza di legge, ma un impianto anteriore al 1990 quasi sempre non è a norma: manca la messa a terra o il salvavita. Se hai quello, il rifacimento non è un capriccio.' },
      { d: 'Posso rifare l\'impianto senza rompere i muri?', r: 'Sì, con le canaline esterne o passando dai controsoffitti. Costa meno e sporca meno, ma si vede: è una scelta pratica in un ufficio, meno in casa.' },
      { d: 'La dichiarazione di conformità è obbligatoria?', r: 'Sì, per ogni impianto nuovo o rifatto. È il documento che ti serve per vendere, affittare e per l\'assicurazione in caso di incendio. Chiedila sempre prima di pagare il saldo.' }
    ]
  },
  {
    slug: 'imbianchino', nome: 'Imbianchino', articolo: 'un ',
    db: ['pittura e tinteggiatura'],
    guida: '/quanto-costa-imbiancare-casa', guidaNome: 'Quanto costa imbiancare casa',
    prezzo: '5–15 €/mq',
    prezzoDettaglio: 'Imbiancare costa da 5 a 15 €/mq di superficie dipinta. Una stanza singola sta fra 250 e 600 €, un appartamento intero fra 1.000 e 2.500 €.',
    tabella: TAB_LAZIO_IMBIANCHINO,
    quando: [
      'Tinteggiatura di casa dopo un trasloco o una ristrutturazione',
      'Muri con muffa, macchie di umidità o crepe da stuccare',
      'Rifacimento di facciate e parti comuni',
      'Finiture particolari: veneziano, spatolato, effetto decorativo'
    ],
    chiedere: [
      'Se il prezzo comprende protezione dei pavimenti e dei mobili',
      'Quante mani di pittura sono previste: due è lo standard, una sola si vede',
      'Se stuccatura e carteggiatura sono comprese o si pagano a parte',
      'La marca della pittura e la resa dichiarata al metro quadro'
    ],
    faq: [
      { d: 'Quanto costa imbiancare una stanza?', r: 'Una stanza di dimensioni normali sta fra 250 e 600 €, secondo l\'altezza dei soffitti e da quanta preparazione servono i muri. Muri già lisci e sani stanno al minimo, muri con crepe e macchie salgono.' },
      { d: 'Meglio imbiancare prima o dopo aver montato i mobili?', r: 'Prima, sempre. Imbiancare una casa piena costa di più perché va protetto e spostato tutto, e il risultato vicino ai battiscopa e agli angoli è quasi sempre peggiore.' },
      { d: 'Quanto tempo ci vuole per imbiancare un appartamento?', r: 'Un appartamento di 80–100 mq vuoto si fa in 3–5 giorni lavorativi comprese le mani di attesa. Con la casa arredata si allunga di un paio di giorni.' }
    ]
  },
  {
    slug: 'muratore', nome: 'Muratore', articolo: 'un ',
    db: ['edilizia / muratura', 'muratura e strutture'],
    guida: '/quanto-costa-un-muratore-al-giorno', guidaNome: 'Quanto costa un muratore al giorno',
    prezzo: '210–280 € al giorno',
    prezzoDettaglio: 'Una giornata di muratore costa fra 210 e 280 €, secondo la zona e se è titolare o operaio. È il prezzo della manodopera: materiali, smaltimento e noleggi si sommano.',
    quando: [
      'Tramezzi, aperture di vani, chiusura di porte e finestre',
      'Massetti, intonaci, ripristini',
      'Piccole opere strutturali e consolidamenti',
      'Assistenza muraria agli impianti — le tracce e i ripristini'
    ],
    chiedere: [
      'Se il prezzo è a giornata o a misura: sopra i pochi giorni conviene quasi sempre a misura',
      'Chi porta via le macerie e se lo smaltimento è compreso',
      'Se il ponteggio o il trabattello è nel prezzo',
      'Quante persone sono in squadra: «210 € al giorno» per due persone è un\'altra cosa'
    ],
    faq: [
      { d: 'Conviene pagare un muratore a giornata o a lavoro finito?', r: 'A giornata va bene per lavori piccoli o imprevedibili, dove non si sa quanto ci vorrà. Per un lavoro definito conviene il prezzo a misura o a corpo: sai la cifra prima di cominciare e non paghi i tempi morti.' },
      { d: 'Quanto costa abbattere un muro?', r: 'Dipende soprattutto da una cosa: se è portante o no. Un tramezzo si abbatte con poche centinaia di euro compresa la rimozione. Un muro portante richiede il tecnico, la pratica e la trave: si passa a diverse migliaia.' },
      { d: 'Il muratore fa anche gli impianti?', r: 'No, e diffida di chi dice di sì. Impianto elettrico e idraulico vanno fatti da chi può rilasciare la dichiarazione di conformità. Il muratore fa le tracce e i ripristini attorno.' }
    ]
  },
  {
    slug: 'piastrellista', nome: 'Piastrellista', articolo: 'un ',
    db: ['pavimenti e piastrelle'],
    guida: '/quanto-costa-posare-il-pavimento', guidaNome: 'Quanto costa posare il pavimento',
    prezzo: '35–110 €/mq',
    prezzoDettaglio: 'La posa costa fra 35 e 110 €/mq, materiale escluso. Il gres in formato normale sta in basso; formati grandi, posa diagonale e spina ungherese salgono verso l\'alto.',
    tabella: TAB_LAZIO_PIASTRELLISTA,
    quando: [
      'Nuovo pavimento in gres, ceramica, cotto o marmo',
      'Rivestimento di bagno e cucina',
      'Posa sopra il pavimento esistente, senza demolire',
      'Terrazzi e balconi, dove serve anche l\'impermeabilizzazione'
    ],
    chiedere: [
      'Se demolizione del vecchio pavimento e smaltimento sono compresi',
      'Se il massetto è compreso o si paga a parte — è la voce dimenticata più spesso',
      'Come si calcola lo sfrido: il 10% è normale, sulla posa diagonale sale',
      'Chi paga se una piastrella si rompe in posa'
    ],
    faq: [
      { d: 'Si può posare il gres sopra il vecchio pavimento?', r: 'Sì, se il vecchio è ben ancorato e le altezze delle porte lo permettono. Si risparmiano demolizione e smaltimento, che sono una fetta grossa del conto. Il pavimento sale di circa 1 cm.' },
      { d: 'Perché i formati grandi costano di più da posare?', r: 'Perché una lastra da 120x120 non la muove una persona sola, richiede il piano perfettamente in bolla e attrezzi specifici. La posa può costare quanto il materiale.' },
      { d: 'Quanto sfrido devo mettere in conto?', r: 'Il 10% sulla posa dritta, il 15% su quella diagonale o a spina. Compra tutto insieme e tieni qualche scatola da parte: lo stesso lotto a distanza di mesi non si trova più uguale.' }
    ]
  },
  {
    slug: 'cartongessista', nome: 'Cartongessista', articolo: 'un ',
    db: ['cartongesso'],
    guida: '/quanto-costa-parete-cartongesso', guidaNome: 'Quanto costa una parete in cartongesso',
    prezzo: '60–85 €/mq posata',
    prezzoDettaglio: 'Una parete divisoria in cartongesso costa 60–85 €/mq posata. Con isolamento acustico o termico si sale a 95–120 €/mq. Un controsoffitto parte da circa 50 €/mq.',
    quando: [
      'Dividere una stanza senza opere murarie',
      'Controsoffitti, per abbassare o per nascondere impianti',
      'Nicchie, librerie, velette per l\'illuminazione',
      'Contropareti isolanti contro freddo o rumore'
    ],
    chiedere: [
      'Che tipo di lastra: idrorepellente in bagno, ignifuga dove serve, standard altrove',
      'Se l\'isolante dentro la parete è compreso e con che spessore',
      'Se la stuccatura è finita a livello Q3 o Q4, cioè pronta da pitturare',
      'Se i rinforzi per appendere pensili e televisori sono previsti'
    ],
    faq: [
      { d: 'Il cartongesso regge i mobili appesi?', r: 'Sì, se il rinforzo è stato messo in fase di montaggio. Va detto prima: aggiungere un rinforzo a parete chiusa significa riaprirla. Dì al cartongessista dove andranno pensili e TV.' },
      { d: 'Il cartongesso isola dai rumori?', r: 'Da solo poco. Isola bene quando dentro c\'è lana minerale e le lastre sono doppie e sfalsate. Una parete fatta così ferma davvero le voci fra due stanze.' },
      { d: 'Si può usare il cartongesso in bagno?', r: 'Sì, con lastre idrorepellenti (quelle verdi) e impermeabilizzazione sotto le piastrelle nella zona doccia. Con la lastra standard, in bagno, il problema arriva.' }
    ]
  },
  {
    slug: 'serramentista', nome: 'Serramentista', articolo: 'un ',
    db: ['serramenti / infissi', 'tende da sole / zanzariere', 'vetraio'],
    guida: '/quanto-costa-cambiare-gli-infissi', guidaNome: 'Quanto costa cambiare gli infissi',
    prezzo: '250–600 €/mq',
    prezzoDettaglio: 'Gli infissi nuovi costano da 250 a 600 €/mq secondo il materiale: PVC in basso, alluminio a taglio termico in mezzo, legno e legno-alluminio in alto. Il prezzo è posato, vecchio infisso rimosso.',
    tabella: TAB_LAZIO_SERRAMENTISTA,
    quando: [
      'Finestre vecchie che disperdono calore o non chiudono bene',
      'Sostituzione per accedere alle detrazioni fiscali',
      'Porte blindate, persiane, tapparelle, zanzariere',
      'Isolamento acustico su strade rumorose'
    ],
    chiedere: [
      'Il valore Uw dell\'infisso finito, non solo del vetro: è quello che conta per le detrazioni',
      'Se si posa in sostituzione sul telaio vecchio o si smura tutto',
      'Chi fa il ripristino di intonaco e tinteggiatura attorno',
      'Se la pratica ENEA per la detrazione la fa il serramentista'
    ],
    faq: [
      { d: 'Meglio PVC, alluminio o legno?', r: 'Il PVC isola bene e costa meno, ma nei formati grandi e sui colori scuri ha limiti. L\'alluminio a taglio termico è il più stabile e il più caro. Il legno è il più bello e quello che richiede più manutenzione.' },
      { d: 'Posso montare i nuovi infissi senza rompere?', r: 'Sì, con la posa in sostituzione sul telaio esistente, se quello vecchio è sano e in squadra. Si perde qualche centimetro di luce, ma si evitano opere murarie e ripristini.' },
      { d: 'Le detrazioni sugli infissi valgono ancora?', r: 'Le regole cambiano ogni anno con la legge di bilancio, quindi va verificato al momento dell\'ordine. Quello che serve sempre: bonifico parlante, pratica ENEA entro i termini e i requisiti di trasmittanza rispettati.' }
    ]
  },
  {
    slug: 'termoidraulico', nome: 'Termoidraulico', articolo: 'un ',
    db: ['climatizzazione / caldaie'],
    guida: '/quanto-costa-sostituire-la-caldaia', guidaNome: 'Quanto costa sostituire la caldaia',
    prezzo: '1.800–2.500 € la caldaia installata',
    prezzoDettaglio: 'Una caldaia a condensazione costa 1.800–2.500 € installata. Una pompa di calore va da 5.000 a 9.000 €, un impianto ibrido da 7.000 a 10.000 €. Installare un condizionatore sta fra 800 e 1.500 €.',
    quando: [
      'Caldaia guasta o vecchia, con consumi alti',
      'Passaggio a pompa di calore o impianto ibrido',
      'Installazione di climatizzatori e split',
      'Manutenzione annuale e controllo fumi'
    ],
    chiedere: [
      'Se smontaggio e smaltimento della vecchia caldaia sono compresi',
      'Se sono comprese la messa a norma dello scarico fumi e la pratica in Comune',
      'Cosa copre la garanzia e per quanti anni',
      'Il costo della manutenzione annuale, che è ricorrente e va nel conto'
    ],
    faq: [
      { d: 'Conviene ancora una caldaia a gas?', r: 'Costa meno all\'acquisto, ma la caldaia a solo gas non gode più delle detrazioni ed è destinata a uscire di scena. Se la casa è isolata bene, la pompa di calore costa di più oggi e meno ogni mese.' },
      { d: 'Ogni quanto va fatta la manutenzione della caldaia?', r: 'La manutenzione va fatta secondo quanto dice il costruttore, di solito ogni anno. Il controllo dei fumi ha una sua scadenza separata, in genere ogni due o quattro anni secondo il tipo di apparecchio.' },
      { d: 'Quanto ci vuole per sostituire una caldaia?', r: 'Se la nuova va nella stessa posizione e gli attacchi combaciano, mezza giornata. Se cambia posizione, tipo di scarico o si passa a condensazione da un impianto vecchio, si va su una giornata piena o due.' }
    ]
  },
  {
    slug: 'installatore-fotovoltaico', nome: 'Installatore fotovoltaico', articolo: 'un ',
    db: ['fotovoltaico / pannelli solari'],
    guida: '/quanto-costa-impianto-fotovoltaico', guidaNome: 'Quanto costa un impianto fotovoltaico',
    prezzo: '1.500–2.500 €/kWp chiavi in mano',
    prezzoDettaglio: 'Un impianto costa 1.500–2.500 € per kWp chiavi in mano: un 3 kW sta fra 5.000 e 7.000 €, un 6 kW fra 8.500 e 13.000 €. La batteria di accumulo aggiunge 800–1.300 € per ogni kWh.',
    quando: [
      'Impianto fotovoltaico su tetto di casa o capannone',
      'Aggiunta di una batteria di accumulo a un impianto esistente',
      'Colonnina di ricarica per l\'auto elettrica',
      'Manutenzione, lavaggio pannelli, sostituzione inverter'
    ],
    chiedere: [
      'La produzione annua stimata in kWh e su quali dati è calcolata',
      'Se pratiche GSE, allaccio e comunicazioni sono comprese',
      'La garanzia sui pannelli, quella sull\'inverter e quella sulla posa: sono tre cose diverse',
      'Chi interviene se in futuro il tetto perde nel punto degli ancoraggi'
    ],
    faq: [
      { d: 'In quanti anni si ripaga il fotovoltaico?', r: 'Con un buon autoconsumo si sta in genere fra i 6 e i 9 anni. La variabile che conta di più non è il prezzo dei pannelli: è quanta energia consumi mentre l\'impianto produce, cioè di giorno.' },
      { d: 'Conviene la batteria di accumulo?', r: 'Conviene se sei fuori casa di giorno e consumi la sera. Se invece hai già un consumo diurno alto, i soldi della batteria rendono di più spesi in qualche pannello in più.' },
      { d: 'Serve un permesso per il fotovoltaico?', r: 'Per gli impianti sul tetto di casa, aderenti alla falda, in genere si rientra nell\'edilizia libera. Cambiano le cose nei centri storici e sui vincoli paesaggistici: lì va verificato prima di ordinare.' }
    ]
  },
  {
    slug: 'rifacimento-tetti', nome: 'Rifacimento tetti', articolo: 'il ',
    db: ['coperture e tetti'],
    guida: '/quanto-costa-rifare-il-tetto', guidaNome: 'Quanto costa rifare il tetto',
    prezzo: '80–350 €/mq',
    prezzoDettaglio: 'Rifare il tetto costa da 80 a 350 €/mq. La differenza sta in cosa si tocca: solo il manto di copertura in basso, tutto il pacchetto con isolamento e struttura in legno in alto.',
    quando: [
      'Infiltrazioni e tegole rotte o spostate',
      'Rifacimento del manto di copertura',
      'Coibentazione del tetto per ridurre i consumi',
      'Lattoneria: grondaie, pluviali, scossaline'
    ],
    chiedere: [
      'Se il ponteggio è compreso: su un tetto è una voce pesante, non un dettaglio',
      'Se c\'è amianto e chi lo smaltisce — richiede ditta autorizzata e costi a parte',
      'Che guaina o membrana traspirante viene messa sotto il manto',
      'La garanzia sulle infiltrazioni e quanti anni dura'
    ],
    faq: [
      { d: 'Ogni quanto va rifatto un tetto?', r: 'Un tetto in tegole ben fatto dura 40–50 anni. Prima di quello si fanno manutenzioni: tegole spostate, grondaie, piccoli ripristini. Se le infiltrazioni tornano in punti diversi, però, è il segnale che il rifacimento conviene più delle toppe.' },
      { d: 'Si può isolare il tetto senza rifarlo tutto?', r: 'Sì, isolando dall\'interno, sotto falda. Costa meno ma ruba altezza al sottotetto e non risolve i ponti termici come farebbe il cappotto sopra. Se il manto è comunque da rifare, conviene fare tutto insieme.' },
      { d: 'Cosa cambia se sul tetto c\'è l\'amianto?', r: 'Cambia parecchio: la rimozione va fatta da una ditta iscritta all\'albo gestori ambientali, con piano di lavoro presentato alla ASL. Non è un lavoro da fare in economia, e il costo dello smaltimento va sempre chiesto a parte.' }
    ]
  },
  /* ============================================================
     I PROFESSIONISTI — aggiunti il 12 set 2026
     Perche': su Google la gente cerca la PRATICA, non la categoria
     («CILA Roma», «accatastamento», «quanto costa un APE»). C'e' chi
     ha costruito un sito intero solo su «geometra + Roma».
     `ruolo: 'professionista'` cambia le parole (incarico/onorario) e
     manda la ricerca su cerca-professionisti invece che cerca-imprese.
     `tipo` e' il valore del filtro sul sito; `db` e' cio' che sta
     scritto nella colonna `mestiere` del database.
     ⚠️ I prezzi marcati DA CONFERMARE aspettano i numeri di Alessio.
     ============================================================ */
  {
    slug: 'geometra', nome: 'Geometra', articolo: 'un ', ruolo: 'professionista', tipo: 'geometra',
    db: ['geometra'],
    guida: '/come-leggere-un-preventivo-edile', guidaNome: 'Come leggere un preventivo edile',
    prezzo: '300–800 € a pratica',
    prezzoDettaglio: 'Una pratica edilizia semplice sta fra 300 e 800 €, secondo il tipo di pratica e il Comune. Accatastamenti, visure e rilievi si pagano a parte, e i diritti da versare al Catasto non sono compresi nell\'onorario.',
    quando: [
      'CILA e SCIA per una ristrutturazione',
      'Accatastamenti, variazioni catastali e visure',
      'Rilievi dello stato di fatto e computi metrici',
      'Verifica della conformità prima di comprare o vendere casa'
    ],
    chiedere: [
      'Se nell\'onorario sono compresi i diritti e i bolli da versare al Comune e al Catasto',
      'Quanto tempo serve per la pratica, e da quando partono i lavori',
      'Chi paga se la pratica va integrata perché mancava un documento',
      'Se il sopralluogo è compreso o si paga a parte'
    ],
    faq: [
      { d: 'Geometra o architetto: chi mi serve?', r: 'Per pratiche, catasto e ristrutturazioni senza opere strutturali il geometra basta e costa meno. L\'architetto serve quando c\'è un progetto da disegnare, un vincolo, o si cambia la distribuzione degli spazi.' },
      { d: 'Cosa cambia fra CILA e SCIA?', r: 'La CILA copre la manutenzione straordinaria senza toccare le strutture: si presenta e si parte. La SCIA serve quando si interviene su parti strutturali o si cambia la sagoma: costa di più e richiede più documenti.' },
      { d: 'La casa non è conforme al catasto: cosa succede?', r: 'Va sanata prima di vendere o di aprire un cantiere. Il geometra verifica lo scostamento e presenta la variazione. Scoprirlo dopo il compromesso è il modo più caro di accorgersene.' }
    ]
  },
  {
    slug: 'architetto', nome: 'Architetto', articolo: 'un ', ruolo: 'professionista', tipo: 'architetto',
    db: ['architetto'],
    guida: '/quanto-costa-ristrutturare-casa', guidaNome: 'Quanto costa ristrutturare casa',
    prezzo: '6–12% del valore dei lavori',
    tabella: TABELLA_ARCHITETTO,
    prezzoDettaglio: 'La parcella si calcola in percentuale sull\'importo dei lavori: più il progetto è piccolo, più la percentuale sale. Progetto, pratiche e direzione lavori sono tre voci diverse e vanno chieste separate.',
    quando: [
      'Ristrutturazione con cambio di distribuzione degli spazi',
      'Progetto d\'interni, arredo su misura, scelta dei materiali',
      'Immobili sotto vincolo o in centro storico',
      'Pratiche in Comune quando serve un progetto disegnato'
    ],
    chiedere: [
      'Cosa comprende esattamente la parcella: progetto, pratiche, direzione lavori o tutto',
      'Se le tavole di progetto restano tue e puoi usarle con un\'altra impresa',
      'Quante revisioni del progetto sono comprese prima che si paghino a parte',
      'Se segue anche il cantiere o solo il disegno'
    ],
    faq: [
      { d: 'Serve davvero l\'architetto per ristrutturare?', r: 'Per rifare un bagno o imbiancare, no. Serve quando si spostano muri, si cambia la pianta, c\'è un vincolo, o quando il risultato estetico conta quanto quello tecnico.' },
      { d: 'Quanto incide la parcella sul costo totale?', r: 'Su una ristrutturazione media la progettazione pesa attorno al 10%. Su lavori piccoli la percentuale sale, perché il lavoro del progettista non si dimezza col dimezzarsi del cantiere.' },
      { d: 'Posso far fare il progetto a uno e i lavori a un altro?', r: 'Sì, ed è la situazione normale. Chiedi però per iscritto che le tavole siano tue: senza quella riga, cambiare impresa a metà strada diventa complicato.' }
    ]
  },
  {
    slug: 'ingegnere-strutturale', nome: 'Ingegnere strutturale', articolo: 'un ', ruolo: 'professionista', tipo: 'ingegnere_strutturale',
    db: ['ingegnere_strutturale', 'ingegnere strutturale'],
    guida: '/quanto-costa-abbattere-un-muro', guidaNome: 'Quanto costa abbattere un muro',
    prezzo: 'da 600 € a pratica',
    prezzoDettaglio: 'Una verifica semplice parte da circa 600 €. Una pratica per aprire un muro portante, con calcoli e deposito, sta di solito fra 1.000 e 2.500 €. I progetti complessi — solai da rinforzare, consolidamenti, sopraelevazioni — arrivano a 7.500 € e oltre. Il deposito in Genio Civile e i diritti non sono compresi nell\'onorario.',
    tabella: TAB_STRUTTURE,
    fonte: 'Fasce rilevate a settembre 2026 sui preventivi pubblicati dai portali di settore per la progettazione strutturale (600–7.500 €).',
    quando: [
      'Abbattimento di un muro portante e inserimento della trave',
      'Ampliamenti, soppalchi, nuove aperture nei muri portanti',
      'Verifiche sismiche e interventi di consolidamento',
      'Sopraelevazioni e cambi di destinazione con aumento dei carichi'
    ],
    chiedere: [
      'Se il deposito della pratica e i diritti sono compresi o si pagano a parte',
      'Se servono saggi o prove sui materiali, e quanto costano',
      'Chi firma il collaudo a fine lavori',
      'Quanto tempo serve per l\'autorizzazione prima che il cantiere possa partire'
    ],
    faq: [
      { d: 'Quando serve per forza l\'ingegnere strutturale?', r: 'Ogni volta che si tocca un elemento portante: muri, solai, travi, pilastri. Non è una scelta ma un obbligo, e senza la pratica depositata l\'impresa seria non comincia.' },
      { d: 'Come faccio a sapere se un muro è portante?', r: 'Non si capisce a occhio né bussando. Serve il tecnico, che guarda i disegni depositati e fa le verifiche. Buttare giù un muro portante per sbaglio è il danno più caro che si possa fare in casa.' },
      { d: 'Quanto tempo serve per la pratica sismica?', r: 'Dipende dal Comune e dalla zona sismica: da poche settimane a qualche mese. Vale la pena farla partire prima di fissare l\'inizio del cantiere.' }
    ]
  },
  {
    slug: 'certificato-energetico', nome: 'Certificato energetico (APE)', articolo: 'un ', ruolo: 'professionista', tipo: 'consulente_energetico',
    db: ['consulente_energetico', 'certificatore energetico', 'termotecnico'],
    guida: '/quanto-costa-cappotto-termico', guidaNome: 'Quanto costa il cappotto termico',
    prezzo: '130–300 €',
    prezzoDettaglio: 'Un APE per un appartamento costa fra 130 e 300 €, secondo la metratura e la città. Il sopralluogo è quasi sempre compreso: diffida di chi lo fa senza venire a vedere casa.',
    quando: [
      'Vendita o affitto di un immobile: senza APE il rogito non si fa',
      'Fine lavori dopo una ristrutturazione importante',
      'Accesso ai bonus e alle detrazioni energetiche',
      'Capire quanto rendono davvero cappotto, infissi o pompa di calore'
    ],
    chiedere: [
      'Se il sopralluogo è compreso — un APE fatto solo sulle carte è a rischio di nullità',
      'In quanti giorni viene consegnato e registrato in Regione',
      'Se la registrazione e i diritti regionali sono compresi',
      'Se il tecnico è abilitato e iscritto all\'elenco regionale dei certificatori'
    ],
    faq: [
      { d: 'Quanto dura l\'APE?', r: 'Dieci anni, ma decade prima se fai lavori che cambiano le prestazioni dell\'edificio: cappotto, infissi nuovi, caldaia sostituita.' },
      { d: 'Un APE da 50 € conviene?', r: 'Quasi sempre è fatto senza sopralluogo, e un APE senza sopralluogo può essere annullato con sanzione. Il risparmio di oggi diventa il problema del rogito.' },
      { d: 'Chi lo paga, chi vende o chi compra?', r: 'Per legge lo paga chi vende o chi affitta: è un documento che deve esserci prima di mettere l\'immobile sul mercato, non dopo.' }
    ]
  },
  {
    slug: 'direttore-lavori', nome: 'Direttore dei lavori', articolo: 'un ', ruolo: 'professionista', tipo: 'direttore_lavori',
    db: ['direttore_lavori', 'direttore dei lavori'],
    guida: '/come-leggere-un-preventivo-edile', guidaNome: 'Come leggere un preventivo edile',
    prezzo: '2–5% dell\'importo dei lavori',
    tabella: TABELLA_DIRETTORE_LAVORI,
    prezzoDettaglio: 'La direzione lavori si paga in percentuale sull\'importo del cantiere. È la voce che molti tagliano per risparmiare, ed è spesso quella che avrebbe fatto risparmiare di più.',
    quando: [
      'Ristrutturazioni importanti, dove le imprese in cantiere sono più di una',
      'Lavori con pratiche edilizie o con detrazioni fiscali da rendicontare',
      'Quando non puoi seguire il cantiere di persona',
      'Ogni volta che servono stati di avanzamento prima di pagare'
    ],
    chiedere: [
      'Quante visite in cantiere sono comprese, e ogni quanto',
      'Se firma anche gli stati di avanzamento che autorizzano i pagamenti',
      'Se è la stessa persona che ha fatto il progetto o è indipendente dall\'impresa',
      'Cosa succede se trova un lavoro fatto male: chi paga il rifacimento'
    ],
    faq: [
      { d: 'È obbligatorio il direttore dei lavori?', r: 'Lo è per legge quando c\'è una pratica edilizia con opere strutturali. Fuori da quei casi non è obbligatorio, ma è chi controlla che il lavoro pagato sia il lavoro fatto.' },
      { d: 'Può essere l\'impresa a nominarlo?', r: 'Meglio di no. Il direttore dei lavori tutela chi paga: se lo sceglie l\'impresa, controlla sé stessa. Nominalo tu, anche quando te lo propone lei.' },
      { d: 'Serve anche per lavori piccoli?', r: 'Per un bagno no. Da una ristrutturazione completa in su, la percentuale che costa si ripaga al primo errore che evita o al primo pagamento che blocca.' }
    ]
  },
  {
    slug: 'interior-designer', nome: 'Interior designer', articolo: 'un ', ruolo: 'professionista', tipo: 'interior_designer',
    db: ['interior_designer', 'interior designer', 'arredatore'],
    guida: '/quanto-costa-rifare-la-cucina', guidaNome: 'Quanto costa rifare la cucina',
    prezzo: '375–1.450 € a progetto',
    prezzoDettaglio: 'Una consulenza breve, con un paio di incontri e le indicazioni su colori e materiali, parte da circa 200 €. Un progetto completo di casa arriva a 5.000 €. È il lavoro di progettazione: mobili e posa si pagano a parte.',
    fonte: 'Fasce rilevate a settembre 2026 sui preventivi pubblicati dai portali di settore per l\'interior design (200–5.000 €).',
    quando: [
      'Casa nuova o appena comprata da arredare da zero',
      'Ristrutturazione dove conta come viene, non solo che funzioni',
      'Cucine e bagni su misura, dove ogni centimetro va deciso prima',
      'Scelta di colori, luci, materiali e arredi coordinati'
    ],
    chiedere: [
      'Cosa consegna: disegni, render, elenco dei materiali, computo degli arredi',
      'Quante revisioni sono comprese nel prezzo',
      'Se prende provvigioni dai fornitori che consiglia — chiedilo, e chiedilo per iscritto',
      'Se segue anche la posa e il coordinamento dei fornitori'
    ],
    faq: [
      { d: 'Che differenza c\'è con l\'architetto?', r: 'L\'architetto è abilitato e può firmare pratiche e progetti strutturali. L\'interior designer lavora su spazi, arredi e finiture: se servono pratiche in Comune, serve comunque un tecnico abilitato.' },
      { d: 'Conviene per una casa piccola?', r: 'Spesso proprio lì conviene di più: su pochi metri quadri un errore di distribuzione si paga tutti i giorni, e non si corregge senza rifare.' },
      { d: 'Prende provvigioni dai negozi?', r: 'Alcuni sì. Non è di per sé un male, ma va detto prima: sapere come guadagna chi ti consiglia è il modo più semplice di capire quanto è libero il consiglio.' }
    ]
  }
];

/* ============================================================
   LE CITTA' DEL PRIMO GIRO
   Si parte da cinque: quattro grandi piu' Rieti, che e' casa.
   Per allargare basta aggiungere righe qui e rilanciare lo script:
   le pagine nuove nascono e i link fra le citta' si allargano da soli.
   ⚠️ Ogni citta' qui dentro deve avere la sua pagina imprese-<slug>.html
   gia' in cartella, se no il link in fondo alla pagina porta nel vuoto
   e il controllo prima di pubblicare si ferma.
   ============================================================ */
const CITTA = [
  { slug: 'roma', nome: 'Roma', regione: 'Lazio' },
  { slug: 'milano', nome: 'Milano', regione: 'Lombardia' },
  { slug: 'torino', nome: 'Torino', regione: 'Piemonte' },
  { slug: 'napoli', nome: 'Napoli', regione: 'Campania' },
  { slug: 'rieti', nome: 'Rieti', regione: 'Lazio' },
  /* 12 set 2026 — secondo giro: si passa da 5 a 20 citta'.
     Ogni riga qui sotto ha la sua imprese-<slug>.html gia' in cartella:
     controllato prima di aggiungerla. */
  { slug: 'palermo', nome: 'Palermo', regione: 'Sicilia' },
  { slug: 'genova', nome: 'Genova', regione: 'Liguria' },
  { slug: 'bologna', nome: 'Bologna', regione: 'Emilia-Romagna' },
  { slug: 'firenze', nome: 'Firenze', regione: 'Toscana' },
  { slug: 'bari', nome: 'Bari', regione: 'Puglia' },
  { slug: 'catania', nome: 'Catania', regione: 'Sicilia' },
  { slug: 'verona', nome: 'Verona', regione: 'Veneto' },
  { slug: 'venezia', nome: 'Venezia', regione: 'Veneto' },
  { slug: 'messina', nome: 'Messina', regione: 'Sicilia' },
  { slug: 'padova', nome: 'Padova', regione: 'Veneto' },
  { slug: 'trieste', nome: 'Trieste', regione: 'Friuli-Venezia Giulia' },
  { slug: 'brescia', nome: 'Brescia', regione: 'Lombardia' },
  { slug: 'parma', nome: 'Parma', regione: 'Emilia-Romagna' },
  { slug: 'modena', nome: 'Modena', regione: 'Emilia-Romagna' },
  { slug: 'reggio-emilia', nome: 'Reggio Emilia', regione: 'Emilia-Romagna' }
];

/* ============================================================
   AIUTI
   ============================================================ */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function nomeFile(m, c) { return `${m.slug}-${c.slug}.html`; }
function urlPagina(m, c) { return `${BASE}/${m.slug}-${c.slug}`; }

/* ============================================================
   IL PEZZO SCRITTO SU MISURA PER OGNI CITTA'
   12 set 2026. Le pagine mestiere avevano lo stesso identico testo
   in ogni citta': cambiava solo il nome. Con 5 citta' passa, con 20
   o con 106 diventa un muro di pagine gemelle e Google le scarta.
   La cura era gia' in casa: dentro ogni imprese-<slug>.html c'e' il
   riquadro id="settore-locale", un paragrafo diverso per ognuna delle
   106 citta'. Da qui lo leggiamo e lo portiamo dentro la pagina mestiere.
   Se il riquadro non c'e' (citta' nuova, file ancora da generare) la
   funzione torna stringa vuota e la pagina esce come prima: niente si
   rompe, si perde solo quel pezzo.
   ============================================================ */
const cacheLocale = {};
function paragrafoLocale(c) {
  if (cacheLocale[c.slug] !== undefined) return cacheLocale[c.slug];
  let testo = '';
  try {
    const f = path.join(OUT, `imprese-${c.slug}.html`);
    if (fs.existsSync(f)) {
      const html = fs.readFileSync(f, 'utf8');
      const blocco = html.match(/id="settore-locale"[\s\S]*?<\/div>/);
      if (blocco) {
        const paragrafi = blocco[0].match(/<p>[\s\S]*?<\/p>/g) || [];
        testo = paragrafi.join('\n  ');
      }
    }
  } catch (e) { testo = ''; }
  cacheLocale[c.slug] = testo;
  return testo;
}

function sezioneLocale(m, c) {
  const testo = paragrafoLocale(c);
  if (!testo) return '';
  return `
  <h2>Il settore edile a ${esc(c.nome)}</h2>
  <p>Perché ${esc(c.nome)} fa storia a sé, e cosa vuol dire per chi cerca ${esc(m.articolo)}${esc(m.nome.toLowerCase())} in zona.</p>
  ${testo}
`;
}

/* Le imprese di quella citta', filtrate poi per mestiere qui in JS:
   il mestiere sta sia nella colonna `mestiere` sia dentro l'array
   `mestieri`, e filtrarlo su due campi dal lato server e' piu'
   fragile che filtrarlo qui. Stesso filtro citta'/provincia di
   genera-imprese-citta.js (29 ago: "Enna" non deve prendere "Ravenna"). */
/* ⚠️ 30 ago 2026 — LA RETE DI SCORTA.
   Dal PC di Alessio la shell non arriva su internet, quindi la
   chiamata a Supabase fallisce con «fetch failed». Per non restare
   bloccati, se la rete non c'e' lo script legge dati-imprese.json,
   una fotografia delle imprese salvata in cartella.
   Quando la rete c'e' (dal browser, da Netlify, da un'altra macchina)
   vince sempre il dato fresco: il file e' solo la scorta.
   Per rifare la fotografia: rilancia lo script da dove la rete c'e',
   oppure fatti riscrivere il file. La data dentro dice quanto e' vecchio. */
const FILE_SCORTA = path.join(OUT, 'dati-imprese.json');
let scorta = null;
let usataScorta = false;

function caricaScorta() {
  if (scorta) return scorta;
  if (!fs.existsSync(FILE_SCORTA)) return null;
  try {
    scorta = JSON.parse(fs.readFileSync(FILE_SCORTA, 'utf8'));
    return scorta;
  } catch (e) {
    console.error(`✗ dati-imprese.json illeggibile: ${e.message}`);
    return null;
  }
}

async function impreseCitta(citta) {
  const filtro = `or=(citta.ilike."${citta}",provincia.ilike."${citta}*")`;
  const url = `${SUPABASE_URL}/rest/v1/imprese_pubbliche?select=id,nome,mestiere,mestieri,tipo,citta,valutazione_media,piano,verificata,descrizione&${encodeURI(filtro)}&limit=200`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return await res.json();
  } catch (e) {
    const s = caricaScorta();
    if (!s || !s.citta || !(citta in s.citta)) throw e;
    usataScorta = true;
    return s.citta[citta];
  }
}


/* ============================================================
   LE PAROLE GIUSTE PER CHI LEGGE
   12 set 2026. Un artigiano fa un PREVENTIVO, un tecnico accetta
   un INCARICO e chiede un ONORARIO. Sul sito i professionisti
   hanno gia' la loro terminologia: qui la rispettiamo, se no la
   pagina suona sbagliata a chi quel mondo lo conosce.
   Una voce senza `ruolo` resta un artigiano, come prima.
   ============================================================ */
function parole(m) {
  if (m.ruolo === 'professionista') {
    return {
      preventivo: 'incarico',
      ilPreventivo: "L'incarico",
      unPreventivo: 'un incarico',
      preventivi: 'incarichi',
      chiediUn: 'Chiedi un preventivo di onorario',
      cercaUrl: (c) => `/cerca-professionisti.html?citta=${encodeURIComponent(c.nome)}${m.tipo ? '&tipo=' + m.tipo : ''}`,
      cercaTutti: (c) => `Vedi tutti i professionisti a ${esc(c.nome)}`,
      sonoQui: 'Questi professionisti della zona di',
      siOccupano: 'si occupano di questo tipo di incarichi. Visita i profili per vedere le referenze e chiedere un preventivo di onorario.',
      gratuiti: 'Primo contatto gratuito.'
    };
  }
  return {
    preventivo: 'preventivo',
    ilPreventivo: 'Il preventivo',
    unPreventivo: 'un preventivo',
    preventivi: 'preventivi',
    chiediUn: 'Chiedi un preventivo',
    cercaUrl: (c) => `/cerca-imprese?citta=${encodeURIComponent(c.nome)}`,
    cercaTutti: (c) => `Vedi tutte le imprese a ${esc(c.nome)}`,
    sonoQui: 'Queste attività della zona di',
    siOccupano: 'si occupano di questo tipo di lavori. Visita i profili per vedere foto dei lavori, recensioni e chiedere un preventivo gratuito.',
    gratuiti: 'Preventivi gratuiti.'
  };
}

function combacia(impresa, mestiere) {
  const voci = []
    .concat(Array.isArray(impresa.mestieri) ? impresa.mestieri : [])
    .concat(impresa.mestiere ? [impresa.mestiere] : [])
    .map(v => String(v).toLowerCase().trim());
  return mestiere.db.some(d => voci.includes(d));
}

/* Cartellino impresa: copiato da genera-imprese-citta.js, cosi' le
   schede sono identiche a quelle delle pagine citta'. */
function cartellino(i) {
  const badge = i.piano === 'premium'
    ? '<span style="background:#7b2fbe;color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;">💎 Premium</span>' : '';
  const verificata = i.verificata
    ? '<span style="color:#0066ff;font-size:12px;font-weight:700;margin-left:6px;">✓ Verificata</span>' : '';
  const rating = i.valutazione_media > 0 ? `⭐ ${Number(i.valutazione_media).toFixed(1)}` : '⭐ Nuova';
  const desc = i.descrizione
    ? `<p style="font-size:0.85rem;color:#666;margin:6px 0 0;line-height:1.4;">${esc(String(i.descrizione).slice(0, 120))}${i.descrizione.length > 120 ? '…' : ''}</p>` : '';
  return `    <a href="/profilo-impresa?id=${esc(i.id)}" style="display:block;background:white;border-radius:12px;padding:18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);text-decoration:none;color:#1a1a1a;">
      <div style="font-weight:700;font-size:1rem;">${esc(i.nome || 'Impresa')}${badge}${verificata}</div>
      <div style="font-size:0.85rem;color:#555;margin-top:4px;">🏗️ ${esc(i.mestiere || i.tipo || 'Edilizia')} · 📍 ${esc(i.citta || '')} · ${rating}</div>${desc}
    </a>`;
}

/* Il blocco delle imprese. Se non ce n'e' nessuna la pagina NON
   resta con un buco: al posto dell'elenco va l'invito a lasciare
   la richiesta. E' il motivo per cui queste pagine possono nascere
   prima che il database sia pieno. */
function bloccoImprese(m, c, imprese) {
  const P = parole(m);
  if (!imprese.length) {
    return `  <div class="section" id="imprese-locali">
    <h2>${esc(m.nome)} a ${esc(c.nome)}: lascia la tua richiesta</h2>
    <p>Su TrovaImpresa non c'è ancora ${esc(m.articolo)}${esc(m.nome.toLowerCase())} iscritto a ${esc(c.nome)}. Lascia lo stesso la richiesta: la giriamo ${m.ruolo === 'professionista' ? 'ai professionisti della zona che si occupano di pratiche simili' : 'alle imprese della zona che si occupano di lavori simili'} e a chi si iscrive nei giorni successivi.</p>
    <p style="text-align:center;margin-top:20px;"><a href="${P.cercaUrl(c)}" class="hero-btn" style="display:inline-block;">${P.cercaTutti(c)} →</a></p>
  </div>`;
  }

  const items = imprese.map(cartellino).join('\n');
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${m.nome} a ${c.nome}`,
    numberOfItems: imprese.length,
    itemListElement: imprese.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: i.nome || 'Impresa',
      url: `${BASE}/profilo-impresa?id=${i.id}`
    }))
  };
  return `  <div class="section" id="imprese-locali">
    <h2>${esc(m.nome)} a ${esc(c.nome)}: chi trovi su TrovaImpresa</h2>
    <p>${P.sonoQui} ${esc(c.nome)} ${P.siOccupano}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin:24px 0;">
${items}
    </div>
    <p style="text-align:center;"><a href="${P.cercaUrl(c)}" style="color:#0066ff;font-weight:700;">${P.cercaTutti(c)} →</a></p>
  </div>
  <script type="application/ld+json">
${JSON.stringify(itemList, null, 2)}
  </script>`;
}

/* Lo stile: copiato pari pari dalle pagine citta' (imprese-*.html),
   cosi' queste pagine sono indistinguibili da quelle. Nessun colore
   e nessuna misura inventati. */
const STILE = `<style>
  :root { --verde:#0066ff; --arancio:#e8733a; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; background:#f4f6f9; color:#1a1a1a; }
  nav { background:white; padding:14px 24px; box-shadow:0 2px 12px rgba(0,0,0,0.06); display:flex; align-items:center; }
  .nav-logo { font-family:'Playfair Display',serif; font-size:1.4rem; text-decoration:none; }
  .nav-logo .trova { color:var(--verde); }
  .nav-logo .impresa { color:var(--arancio); }
  .nav-btns { margin-left:auto; display:flex; gap:10px; }
  .btn-outline { border:2px solid var(--verde); color:var(--verde); padding:8px 20px; border-radius:25px; font-weight:600; text-decoration:none; font-size:0.9rem; }
  .btn-fill { background:var(--arancio); color:white; padding:8px 20px; border-radius:25px; font-weight:600; text-decoration:none; font-size:0.9rem; }
  .hero { background:linear-gradient(135deg, #0a2a4d, #0066ff); color:white; padding:60px 24px; text-align:center; }
  .hero h1 { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,3rem); margin-bottom:16px; }
  .hero p { font-size:1.1rem; opacity:0.9; max-width:600px; margin:0 auto 32px; }
  .hero-btn { background:var(--arancio); color:white; padding:14px 32px; border-radius:30px; font-weight:700; text-decoration:none; font-size:1.1rem; }
  .section { max-width:900px; margin:0 auto; padding:48px 24px; }
  .section h2 { font-family:'Playfair Display',serif; font-size:1.8rem; color:var(--verde); margin-bottom:16px; }
  .section h3 { font-size:1.05rem; color:#0a2a4d; margin:22px 0 8px; }
  .section p { color:#555; line-height:1.7; margin-bottom:16px; font-size:1rem; }
  .section ul { margin:0 0 18px; padding-left:22px; }
  .section li { color:#555; line-height:1.7; font-size:1rem; margin-bottom:8px; }
  .prezzo-box { background:white; border-radius:16px; border-top:4px solid var(--arancio); box-shadow:0 4px 16px rgba(0,0,0,0.08); padding:24px; margin:8px 0 28px; }
  .prezzo-cifra { font-family:'Playfair Display',serif; font-size:2rem; color:#0a2a4d; margin-bottom:8px; }
  .prezzo-box p:last-child { margin-bottom:0; }
  /* 12 set 2026 — la tabella del decreto Parametri.
     Su telefono scorre di lato dentro .tab-wrap invece di rompere la pagina. */
  .tab-wrap { overflow-x:auto; margin:8px 0 14px; }
  table.prezzi { width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.07); font-size:0.95rem; }
  table.prezzi th { background:#0a2a4d; color:white; text-align:left; padding:12px 14px; font-size:0.88rem; white-space:nowrap; }
  table.prezzi td { padding:12px 14px; border-top:1px solid #eef1f5; color:#444; white-space:nowrap; }
  .nota-fonte { font-size:0.82rem; color:#888; line-height:1.55; }
  .prezzo-box .nota-fonte { margin-top:10px; }
  .categorie { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; margin:32px 0; }
  .cat-card { background:white; border-radius:12px; padding:20px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.07); text-decoration:none; color:#1a1a1a; }
  .cat-icon { font-size:2rem; margin-bottom:8px; }
  .cat-name { font-weight:600; font-size:0.95rem; }
  .cta-box { background:linear-gradient(135deg,#0a2a4d,#0066ff); color:white; border-radius:20px; padding:48px 32px; text-align:center; margin:40px 0; }
  /* ⚠️ 30 ago 2026 — il "color:white" qui sotto NON e' un colore nuovo:
     e' quello che .cta-box dichiara gia' due righe sopra. Va ripetuto
     perche' il riquadro sta dentro un <div class="section">, e
     ".section h2 {color:var(--verde)}" e ".section p {color:#555}"
     hanno la stessa forza di ".cta-box h2/p": vincevano loro, e il
     titolo usciva blu su blu col testo grigio su blu, illeggibile.
     Visto guardando la figura della pagina, non il codice. */
  .cta-box h2 { font-family:'Playfair Display',serif; font-size:1.8rem; margin-bottom:12px; color:white; }
  .cta-box p { opacity:0.9; margin-bottom:24px; color:white; }
  footer { background:#1a1a1a; color:#999; text-align:center; padding:24px; font-size:0.85rem; }
  footer a { color:#999; text-decoration:none; }
</style>`;

function costruisciPagina(m, c, imprese) {
  const P = parole(m);
  const url = urlPagina(m, c);
  const titolo = `${m.nome} a ${c.nome}: prezzi ${TODAY.slice(0, 4)} ${m.ruolo === 'professionista' ? 'e studi' : 'e imprese'} | TrovaImpresa`;
  const descr = `${m.nome} a ${c.nome}: ${m.prezzo}, quando serve e cosa chiedere. Confronta i profili della zona e chiedi ${P.unPreventivo}.`;

  const schemaLocal = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${m.nome} a ${c.nome} — TrovaImpresa`,
    url: url,
    description: descr,
    areaServed: { '@type': 'City', name: c.nome },
    parentOrganization: { '@type': 'Organization', name: 'TrovaImpresa', url: BASE }
  };
  const schemaFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: m.faq.map(f => ({
      '@type': 'Question',
      name: f.d,
      acceptedAnswer: { '@type': 'Answer', text: f.r }
    }))
  };
  const schemaBc = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: `Imprese a ${c.nome}`, item: `${BASE}/imprese-${c.slug}` },
      { '@type': 'ListItem', position: 3, name: `${m.nome} a ${c.nome}`, item: url }
    ]
  };

  const quando = m.quando.map(v => `      <li>${v}</li>`).join('\n');
  const chiedere = m.chiedere.map(v => `      <li>${v}</li>`).join('\n');
  const faqHtml = m.faq.map(f => `    <h3>${f.d}</h3>\n    <p>${f.r}</p>`).join('\n');
  /* ⚠️ 30 ago 2026 — questi link puntano SOLO alle città che questo
     script genera davvero. La prima versione usava l'elenco `vicine`
     delle pagine città, e mandava su pagine come /idraulico-frosinone
     che non esistono: il controllo prima di pubblicare le avrebbe
     fermate tutte. Quando aggiungi una città a CITTA, i link si
     allargano da soli. */
  const vicine = CITTA.filter(x => x.slug !== c.slug)
    .map(x => `<a href="/${m.slug}-${x.slug}">${esc(x.nome)}</a>`)
    .join(' · ');
  const altriMestieri = MESTIERI.filter(x => x.slug !== m.slug && (x.ruolo || '') === (m.ruolo || ''))
    .map(x => `<a href="/${x.slug}-${c.slug}">${x.nome}</a>`)
    .join(' · ');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="${url}">
<title>${esc(titolo)}</title>
<meta name="description" content="${esc(descr)}">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
${STILE}
<link rel="stylesheet" href="/css/mobile.css?v=3">
<script type="application/ld+json">
${JSON.stringify(schemaLocal, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(schemaFaq, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(schemaBc, null, 2)}
</script>
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(titolo)}">
<meta property="og:description" content="${esc(descr)}">
<meta property="og:image" content="${BASE}/logo.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
</head>
<body>
<nav>
  <a href="/" class="nav-logo"><span class="trova">Trova</span><span class="impresa">Impresa</span></a>
  <div class="nav-btns">
    <a href="/login-impresa.html" class="btn-outline">Entra (Imprese)</a>
    <a href="/#registrati" class="btn-fill">Registrati (Imprese)</a>
  </div>
</nav>

<div class="hero">
  <h1>${esc(m.nome)} a ${esc(c.nome)}</h1>
  <p>${esc(m.prezzo)}, cosa chiedere prima di firmare e chi trovi nella zona di ${esc(c.nome)}. ${P.gratuiti}</p>
  <a href="${P.cercaUrl(c)}" class="hero-btn">🔍 ${P.chiediUn} a ${esc(c.nome)}</a>
</div>

<div class="section">
  <h2>Quanto costa ${esc(m.articolo)}${esc(m.nome.toLowerCase())} a ${esc(c.nome)}</h2>
  <div class="prezzo-box">
    <div class="prezzo-cifra">${esc(m.prezzo)}</div>
    <p>${m.prezzoDettaglio}</p>
    <p style="margin-bottom:0;"><a href="${m.guida}" style="color:#0066ff;font-weight:700;">${esc(m.guidaNome)}: la guida completa →</a></p>
    ${m.fonte ? `<p style="margin:10px 0 0;font-size:0.82rem;color:#888;">${esc(m.fonte)}</p>` : ''}
  </div>
  <p>${m.ruolo === 'professionista'
      ? `Queste cifre sono medie di mercato. A ${esc(c.nome)} l'onorario può stare un po' sopra o un po' sotto secondo la complessità della pratica, i tempi del Comune e il periodo dell'anno. Ti servono per capire se quello che ti propongono è in linea: un onorario molto sotto il minimo di solito vuol dire che qualcosa non è compreso.`
      : `Queste cifre sono medie nazionali, prese dalle nostre guide prezzi scritte da chi i cantieri li ha fatti davvero. A ${esc(c.nome)} il prezzo può stare un po' sopra o un po' sotto secondo la zona, la difficoltà di accesso al cantiere e il periodo dell'anno. Ti servono per capire se quello che ti propongono è in linea o fuori mercato: se un preventivo sta molto sotto il minimo, di solito manca qualcosa dentro.`}</p>
${sezioneLocale(m, c)}
${m.tabella || ''}

  <h2>Quando serve ${esc(m.articolo)}${esc(m.nome.toLowerCase())}</h2>
  <ul>
${quando}
  </ul>

  <h2>Cosa chiedere prima di firmare</h2>
  <p>${P.ilPreventivo} più basso non è quasi mai il più conveniente: è quasi sempre quello a cui manca qualcosa. Queste sono le domande da fare prima di firmare.</p>
  <ul>
${chiedere}
  </ul>

  <h2>Domande frequenti</h2>
${faqHtml}
</div>

<div class="section" style="padding-top:0;">
${bloccoImprese(m, c, imprese)}
</div>

<div class="section" style="padding-top:0;">
  <div class="section" id="altri-mestieri" style="padding:0;">
    <h2>${m.ruolo === 'professionista' ? 'Altri professionisti' : 'Altri mestieri'} a ${esc(c.nome)}</h2>
    <p style="line-height:2.1;">${altriMestieri}</p>
    <p><a href="/imprese-${c.slug}">Tutte le imprese e gli artigiani a ${esc(c.nome)} →</a></p>
  </div>

  <div class="section" id="stesso-mestiere-altrove" style="padding:32px 0 0;">
    <h2>${esc(m.nome)} in altre città</h2>
    <p style="line-height:2.1;">${vicine}</p>
  </div>

  <div class="cta-box">
    <h2>Sei ${esc(m.articolo)}${esc(m.nome.toLowerCase())} a ${esc(c.nome)}?</h2>
    <p>Registrati gratis su TrovaImpresa e inizia a ricevere richieste di lavoro dalla tua zona.</p>
    <a href="/#registrati" style="background:#e8733a;color:white;padding:14px 32px;border-radius:30px;font-weight:700;text-decoration:none;font-size:1rem;">Registrati gratis →</a>
  </div>
</div>

<footer>
  <p>© ${TODAY.slice(0, 4)} TrovaImpresa — <a href="/">Home</a> | <a href="/cerca-imprese.html">Cerca imprese</a> | <a href="/#registrati">Registra la tua impresa</a></p>
</footer>
<script src="/cookie-banner.js"></script>
<script src="/js/modal-fullscreen.js" defer></script>
<script src="/js/spazi-laterali.js" data-spazi="imprese-sx,imprese-dx" data-citta="${esc(c.nome)}"></script>
</body>
</html>`;
}

/* ============================================================
   VIA
   ============================================================ */
(async () => {
  const generate = [];
  let conImprese = 0, senzaImprese = 0;

  for (const c of CITTA) {
    let tutte;
    try {
      tutte = await impreseCitta(c.nome);
    } catch (e) {
      console.error(`✗ ${c.nome}: ${e.message}`);
      continue;
    }

    for (const m of MESTIERI) {
      const imprese = tutte.filter(i => combacia(i, m)).sort((a, b) => {
        const p = x => (x.piano === 'premium' ? 1 : 0);
        if (p(b) !== p(a)) return p(b) - p(a);
        return (b.valutazione_media || 0) - (a.valutazione_media || 0);
      }).slice(0, MAX_IMPRESE);

      const file = nomeFile(m, c);
      fs.writeFileSync(path.join(OUT, file), costruisciPagina(m, c, imprese), 'utf8');
      generate.push(file);

      if (imprese.length) { conImprese++; console.log(`✓ ${file}: ${imprese.length} imprese`); }
      else { senzaImprese++; console.log(`· ${file}: nessuna impresa, pagina con invito`); }
    }
  }

  // Sitemap separata: non tocca sitemap.xml ne' sitemap-seo.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${generate.map(u => `  <url><loc>${BASE}/${u.replace(/\.html$/, '')}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(OUT, 'sitemap-mestieri.xml'), sitemap, 'utf8');

  console.log('');
  console.log('='.repeat(60));
  if (usataScorta) {
    const q = caricaScorta();
    console.log(`⚠️  Internet non raggiungibile: usato dati-imprese.json del ${q && q.fotografia_del ? q.fotografia_del : '?'}`);
  }
  console.log(`Generate ${generate.length} pagine (${MESTIERI.length} mestieri × ${CITTA.length} città)`);
  console.log(`Con imprese: ${conImprese} · Con invito a lasciare la richiesta: ${senzaImprese}`);
  console.log('Scritta anche sitemap-mestieri.xml');
  console.log('='.repeat(60));
})();
