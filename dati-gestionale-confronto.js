/* FAMIGLIA 3 — IL CONFRONTO
   Chi cerca «quanto costa» o «alternativa a» sta gia' valutando di
   comprare. Sono poche ricerche ma sono le piu' vicine alla firma.

   ⛔ REGOLA SUI PREZZI DEGLI ALTRI: si scrivono SOLO se verificati sul
      loro sito pubblico, con la data della verifica scritta in pagina.
      Un prezzo sbagliato su una pagina di confronto e' una figuraccia
      e un problema. Verificato il 13 settembre 2026.
*/
module.exports = [

/* ---------------------------------------------------------------- */
{
  famiglia: 'confronto',
  slug: 'quanto-costa-un-gestionale-edile',
  link: 'Quanto costa un gestionale edile',
  riga: 'le fasce di prezzo vere del mercato italiano, e cosa cambia fra una e l\'altra',
  briciola: 'Quanto costa un gestionale edile',
  title: 'Quanto costa un gestionale per imprese edili nel 2026',
  desc: "Quanto costa un gestionale per imprese edili: le fasce di prezzo vere del mercato italiano e le voci nascoste da controllare prima di firmare.",
  h1: 'Quanto costa un gestionale per imprese edili',
  minuti: 6,
  nomeApp: 'Gestionale TrovaImpresa',
  cosaCosta: 'Il gestionale',
  funzioni: ['Prezzo annuale unico senza costo per utente', 'Nessun costo di attivazione',
    'Tre mesi di prova senza carta di credito', 'Nessun rinnovo automatico',
    'Marketplace compreso nello stesso prezzo'],
  ctaTitolo: 'Il modo più economico di decidere',
  ctaTesto: 'Provane uno per tre mesi senza mettere la carta. Se dopo tre mesi non lo apri più, hai la risposta e non hai speso niente.',
  sommario: `un gestionale per l'edilizia in Italia costa in genere fra i <strong>200 e i 900 € l'anno</strong>,
    ma la cifra sul listino è solo metà del conto: le differenze vere stanno nel <strong>costo per
    utente</strong>, nell'<strong>attivazione</strong> e nei moduli venduti a parte.
    <span class="price-big">Qui: 249 € l'anno, tutto compreso</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Cercare il prezzo di un gestionale edile è più difficile di quanto dovrebbe: molti
        non lo scrivono sul sito e ti chiedono di lasciare il numero. Questo da solo è già
        un'informazione — se il prezzo non è pubblico, di solito è perché cambia da cliente a cliente.` },
      `Qui sotto ci sono le fasce vere, cosa ci trovi dentro, e le tre voci che gonfiano il conto dopo
       la firma.`
    ]},

    { h2: 'Le tre fasce di prezzo', blocchi: [
      { t:'tab', testa:['Fascia','Cosa trovi di solito'], righe:[
        ['<strong>Sotto i 250 € l\'anno</strong>', "Fatturazione e poco altro, spesso programmi generici non pensati per l'edilizia. Vanno bene se ti serve solo emettere fatture."],
        ['<strong>Fra 300 e 600 € l\'anno</strong>', 'I gestionali edili veri: cantieri, preventivi, computo, rapportini. È la fascia dove sta la maggior parte del mercato.'],
        ['<strong>Sopra i 600 € l\'anno</strong>', 'Soluzioni per imprese strutturate, spesso con costo per utente e con un canone che cresce con la squadra.'],
      ]},
      { t:'nota', x:`<strong>Un riferimento verificato il 13 settembre 2026:</strong> fra i
        gestionali edili più diffusi in Italia, un canone dichiarato apertamente sul sito è di
        <strong>49 € al mese con fatturazione annuale</strong>, cioè <strong>588 € l'anno</strong>,
        oppure 79 € al mese senza vincolo. Chi il prezzo lo scrive è già un punto a favore rispetto a
        chi ti chiede di lasciare il numero di telefono.` }
    ]},

    { h2: 'Le tre voci che cambiano il conto dopo la firma', blocchi: [
      { t:'err', righe:[
        `<strong>Il costo per utente.</strong> È la voce che pesa di più. 25 € al mese per utente sembra poco, ma con te, il socio, la segretaria e due capi squadra sono 1.500 € l'anno.`,
        `<strong>L'attivazione.</strong> Alcuni chiedono una cifra una tantum per la configurazione e il caricamento dei dati: da qualche centinaio di euro in su, pagata prima di aver capito se il programma ti piace.`,
        `<strong>I moduli venduti a parte.</strong> Il gestionale base costa poco, poi il computo metrico è un modulo, i rapportini un altro, la contabilità di cantiere un altro ancora.`,
      ]},
      `Prima di firmare, la domanda giusta non è «quanto costa». È: <strong>«quanto pago l'anno prossimo,
       con quattro persone e tutti i moduli che mi servono?»</strong>. Fatti dare quel numero per iscritto.`
    ]},

    { h2: 'Cosa costa qui', blocchi: [
      { t:'tab', testa:['Voce','Quanto'], num:true, righe:[
        ['Canone annuale', '249 €'],
        ['Oppure mensile', '29 € al mese'],
        ['Costo per utente in più', '0 € — gli accessi per collaboratori e segretaria sono compresi'],
        ['Attivazione', '0 €'],
        ['Moduli a parte', '0 € — computo, SAL, rapportini, mezzi e ore sono dentro'],
        ['Prova', '3 mesi, senza carta di credito'],
      ]},
      `Il prezzo è finale: non c'è IVA da aggiungere, e per ogni pagamento ricevi regolare fattura.`,
      { t:'espe', x:`Il motivo per cui costa meno non è che vale meno: è che il gestionale non è il
        prodotto principale. TrovaImpresa è un marketplace dove i clienti cercano imprese, e il gestionale
        è quello che ricevi restando lì. Chi vende solo il gestionale deve farci stare dentro tutto — noi no.` }
    ]},

    { h2: 'Quando conviene spendere di più', blocchi: [
      `Vale la pena dirlo, anche se non aiuta a vendere.`,
      { t:'ok', righe:[
        `<strong>Se hai bisogno della fattura elettronica trasmessa</strong>, cioè di un intermediario che la mandi allo SDI al posto tuo, qui non c'è: si prepara il file e lo mandi tu o il commercialista.`,
        `<strong>Se ti serve la contabilità generale</strong> con bilancio e prima nota, quello è il lavoro di un software di contabilità, non di un gestionale di cantiere.`,
        `<strong>Se hai un magazzino vero da gestire a carichi e scarichi complessi</strong>, o una produzione, servono strumenti fatti per quello.`,
        `<strong>Se sei un'impresa da venti persone con più sedi</strong>, valuta le soluzioni della fascia alta: pagherai di più e ti servirà.`,
      ]},
      `Per un'impresa da una a dieci persone che deve tenere in ordine preventivi, cantieri, ore e fatture,
       la fascia alta è quasi sempre soldi spesi per funzioni che non si apriranno mai.`
    ]},

    { h2: 'Il conto che conta davvero', blocchi: [
      { t:'fig', src:'/img/gestionale-lavori.webp', w:1440, h:971,
        alt:'Il filtro dei lavori finiti e non ancora fatturati nel gestionale',
        cap:'Il filtro «da incassare»: un solo lavoro recuperato paga anni di abbonamento.' },
      `Un gestionale non si valuta sul prezzo: si valuta su quanto ti fa recuperare.`,
      `Se ti fa fatturare <strong>un solo lavoro finito e dimenticato</strong> in un anno, si è già pagato
       tre o quattro volte da solo. Se ti fa scoprire che un tipo di lavoro lo stai facendo in perdita,
       vale molto di più.`,
      `Il vero costo non è il canone: è restare senza. Ma questo vale per qualsiasi gestionale scelga,
       non solo per questo.`
    ]},
  ],

  faq: [
    { d: 'Quanto costa in media un gestionale per imprese edili in Italia?',
      r: `Le soluzioni pensate per l'edilizia stanno in genere fra i 300 e i 600 euro l'anno, con punte
          più alte per le imprese strutturate. Sotto i 250 euro si trovano soprattutto programmi di
          fatturazione generici.` },
    { d: 'Ci sono costi nascosti da controllare?',
      r: `Le tre voci da chiedere sempre prima di firmare sono il costo per utente aggiuntivo,
          l'eventuale quota di attivazione una tantum e quali funzioni sono moduli venduti a parte.
          Il numero che conta è quanto pagherai il secondo anno con tutti gli utenti che ti servono.` },
    { d: 'Il prezzo di 249 euro comprende tutto?',
      r: `Sì: nessun costo per utente aggiuntivo, nessuna attivazione e nessun modulo a parte. Computo
          metrico, stati di avanzamento, rapportini, mezzi e ore sono compresi, e con lo stesso
          abbonamento c'è anche il profilo in evidenza sul marketplace.` },
    { d: "C'è l'IVA da aggiungere?",
      r: `No, 249 euro all'anno è il prezzo finale. Per ogni pagamento viene emessa regolare fattura.` },
    { d: 'Posso provarlo prima di pagare?',
      r: `Sì, tre mesi, e non serve la carta di credito. Alla fine dei tre mesi non c'è addebito
          automatico: se non fai nulla si torna al piano gratuito.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'confronto',
  slug: 'gestionale-cantieri-gratis',
  link: 'Gestionale cantieri gratis',
  riga: 'cosa regge davvero nel gratis, dove cede, e quando conviene pagare',
  briciola: 'Gestionale cantieri gratis',
  title: 'Gestionale cantieri gratis: dove regge e dove cede',
  desc: 'Gestionale per cantieri gratis: cosa si riesce a fare senza pagare, dove il gratuito cede e quando conviene passare a pagamento.',
  h1: 'Gestionale cantieri gratis: cosa regge davvero e cosa no',
  minuti: 5,
  nomeApp: 'Gestionale TrovaImpresa',
  cosaCosta: 'Il gestionale',
  funzioni: ['Tre mesi di prova senza carta di credito', 'Profilo gratuito sul marketplace',
    'Nessun rinnovo automatico', 'Esportazione dei dati sempre gratuita'],
  ctaTitolo: 'Il gratis più utile: tre mesi interi',
  ctaTesto: "Non una versione ridotta, ma il gestionale intero per tre mesi. Senza carta e senza rinnovo automatico: se non ti serve, non succede niente.",
  sommario: `il gratis esiste e per certe cose basta. <strong>Fogli di calcolo, agenda del telefono e
    gruppi WhatsApp</strong> reggono fino a due cantieri; poi cedono su tre cose precise: le
    <strong>ore</strong>, il <strong>computo</strong> e la <strong>fattura elettronica</strong>.
    <span class="price-big">Qui: 3 mesi interi, senza carta</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Chi cerca un gestionale gratis quasi sempre non è tirchio: è prudente. Ha già provato
        un programma che non ha usato, e non vuole rifare l'errore.` },
      `Quindi parliamo del gratis sul serio, senza fare finta che non funzioni.`
    ]},

    { h2: 'Cosa si riesce a fare senza pagare niente', blocchi: [
      { t:'ok', righe:[
        `<strong>Preventivi</strong> con un modello in un foglio di calcolo o in Word. Funziona.`,
        `<strong>Fatture</strong> con i programmi gratuiti di fatturazione, o passandole al commercialista.`,
        `<strong>Calendario</strong> dei cantieri, condiviso con la squadra.`,
        `<strong>Foto</strong> dei lavori in cartelle sul cloud.`,
        `<strong>Comunicazione</strong> col gruppo di messaggistica: immediata e gratis.`,
      ]},
      `Con uno o due cantieri aperti alla volta, questa combinazione regge. Chi dice il contrario vuole
       venderti qualcosa.`
    ]},

    { h2: 'I tre punti dove il gratis cede', blocchi: [
      `Non cede all'improvviso. Cede quando i cantieri diventano tre o quattro insieme.`,
      { t:'err', righe:[
        `<strong>Le ore.</strong> Nessuno strumento gratuito somma le ore per cantiere e per persona. E le ore sono il costo più grande che hai: senza quel numero non sai se un lavoro ti ha reso.`,
        `<strong>Il computo metrico.</strong> In un foglio di calcolo si fa, finché non si rompe una formula. E soprattutto il foglio non conosce il tuo prezzario e non diventa un preventivo.`,
        `<strong>Il collegamento fra le cose.</strong> Il preventivo, il lavoro e la fattura restano tre file separati. Nessuno ti dirà mai quali lavori finiti non hai ancora fatturato — ed è il buco da cui escono più soldi.`,
      ]},
      { t:'nota', x:`Il problema del gratis non è che manca una funzione. È che <strong>le informazioni non
        si parlano</strong>. Ogni pezzo funziona da solo, e la somma non esiste da nessuna parte se non
        nella tua testa.` }
    ]},

    { h2: 'Il conto onesto', blocchi: [
      `249 € all'anno fanno <strong>68 centesimi al giorno</strong>. La domanda giusta non è se te li puoi
       permettere: è se ti fanno recuperare più di quello.`,
      { t:'tab', testa:['Cosa recuperi','Quanto vale'], righe:[
        ['Un lavoro finito e dimenticato, fatturato', "Di solito qualche migliaio di euro. Una volta sola paga l'abbonamento per anni"],
        ['Le ore vere di un cantiere', 'Il numero che ti dice quali lavori lasciar perdere o rialzare di prezzo'],
        ['Un preventivo richiamato in tempo', 'Un lavoro che avresti perso solo per non aver risentito il cliente'],
        ['Le serate a rifare i computi', 'Il tempo tuo, che non è gratis nemmeno quando non lo fatturi'],
      ]},
      `Se dopo tre mesi di prova nessuna di queste cose è successa, allora il gratis ti basta davvero — e
       questa è una risposta buona, non una sconfitta.`
    ]},

    { h2: 'Come provare senza rischiare niente', blocchi: [
      { t:'fig', src:'/img/gestionale-lavori.webp', w:1440, h:971,
        alt:'Il gestionale durante i tre mesi di prova, con i lavori e i loro stati',
        cap:'Tre mesi con tutte le funzioni, non una versione ridotta.' },
      `Il modo più onesto di rispondere alla domanda «mi serve?» è provarlo con un lavoro vero, non
       guardare una demo.`,
      { t:'ok', righe:[
        `<strong>Tre mesi interi</strong>, con tutte le funzioni, non una versione ridotta.`,
        `<strong>Senza carta di credito.</strong> Non ti chiediamo il numero per farti provare.`,
        `<strong>Senza rinnovo automatico.</strong> Finiti i tre mesi non ti addebitiamo niente: se non fai nulla, torni al piano gratuito e il profilo resta online.`,
        `<strong>I dati restano tuoi</strong> e si esportano in Excel o JSON anche se non continui.`,
      ]},
      { t:'espe', x:`La regola che seguiamo è semplice: un gestionale non si può far comprare a scatola
        chiusa. Va fatto vedere e va fatto provare, come farebbe un agente immobiliare con una casa. Se
        dopo tre mesi non lo apri più, il problema è il prodotto, non il cliente.` }
    ]},
  ],

  faq: [
    { d: 'Esiste un gestionale per cantieri completamente gratis?',
      r: `Esistono strumenti gratuiti che coprono pezzi del lavoro — fogli di calcolo per i preventivi,
          programmi gratuiti di fatturazione, calendari condivisi. Quello che manca nel gratuito è il
          collegamento fra le cose: le ore sommate per cantiere, il computo che diventa preventivo e il
          preventivo che diventa fattura.` },
    { d: 'Quanto dura la prova e serve la carta?',
      r: `Tre mesi, con tutte le funzioni, e la carta di credito non serve. Alla fine non c'è nessun
          addebito automatico: se non fai nulla, torni al piano gratuito.` },
    { d: 'Se non continuo, perdo i dati?',
      r: `No. I dati si esportano in Excel o in JSON quando vuoi, anche se non continui, e il profilo sul
          marketplace resta online sul piano gratuito.` },
    { d: 'Il profilo sul marketplace è gratuito?',
      r: `Sì, il profilo e la presenza nelle pagine di ricerca ci sono anche senza pagare. Con il Premium
          il profilo esce più in alto ed è messo in evidenza.` },
    { d: 'Il foglio di calcolo può bastarmi?',
      r: `Con uno o due cantieri alla volta, spesso sì. Comincia a non bastare quando i cantieri aperti
          diventano tre o quattro e servono le ore per cantiere, il computo collegato al preventivo e
          l'elenco dei lavori finiti e non fatturati.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'confronto',
  slug: 'gestionale-piccola-impresa-edile',
  link: 'Gestionale per la piccola impresa',
  riga: 'da uno a dieci: quello che serve davvero e quello che è solo peso',
  briciola: 'Gestionale per la piccola impresa edile',
  title: 'Gestionale per piccole imprese edili e artigiani',
  desc: 'Gestionale per piccole imprese edili da 1 a 10 persone: le sei cose che servono davvero e quelle che sono solo peso. 3 mesi gratis.',
  h1: 'Gestionale per la piccola impresa edile: sei cose servono, il resto è peso',
  minuti: 5,
  nomeApp: 'Gestionale TrovaImpresa',
  cosaCosta: 'Il gestionale',
  funzioni: ['Preventivi e fatture', 'Lavori con stato e scadenze', 'Ore e spese per cantiere',
    'Clienti con il loro storico', 'Scadenzario', 'Accessi per i collaboratori compresi'],
  ctaTitolo: 'Parti da un lavoro, non dallo storico',
  ctaTesto: 'Il modo che funziona è cominciare dal prossimo preventivo e basta. In una settimana i lavori aperti sono dentro, senza una giornata persa a caricare dati.',
  sommario: `per un'impresa da <strong>una a dieci persone</strong> le funzioni che servono davvero sono
    sei, e i gestionali fatti per le imprese grandi falliscono proprio perché ne hanno ottanta.
    Qui c'è quello che serve, senza il peso.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Il motivo più comune per cui un'impresa piccola abbandona un gestionale dopo due mesi
        non è il prezzo. È che <strong>chiede troppo per far entrare un dato</strong>: sedici caselle
        obbligatorie, tre menu e un'anagrafica da compilare prima di poter salvare un lavoro da 400 euro.` },
      `Un programma fatto per un'impresa da cinquanta persone non è «più completo»: è
       <strong>più lento</strong>. E la lentezza, quando sei tu a fare tutto, è il difetto che ammazza.`
    ]},

    { h2: 'Le sei cose che servono davvero', blocchi: [
      { t:'ok', righe:[
        `<strong>Preventivi</strong> con le voci e il PDF, e lo stato per sapere a chi richiamare.`,
        `<strong>Lavori</strong> con stato e data, per sapere cosa è aperto e cosa è finito.`,
        `<strong>Fatture</strong> con l'IVA edile giusta e il file per lo SDI.`,
        `<strong>Clienti</strong> con lo storico: cosa gli hai fatto e quando.`,
        `<strong>Ore e spese</strong> per cantiere, che è l'unico modo per sapere se ci guadagni.`,
        `<strong>Scadenzario</strong>, perché le date sfuggono quando sei da solo.`,
      ]},
      `Sono sei. Se un gestionale copre bene queste, va bene. Se ne copre ottanta ma per fare un preventivo
       ci vogliono venti minuti, non va bene.`
    ]},

    { h2: 'Quello che per un\'impresa piccola è solo peso', blocchi: [
      { t:'err', righe:[
        `<strong>I livelli di approvazione.</strong> Servono dove c'è un ufficio acquisti. Se firmi tu, sono clic in più.`,
        `<strong>Il magazzino a carichi e scarichi.</strong> Se il materiale lo compri per il cantiere e lo porti direttamente lì, non hai un magazzino da gestire.`,
        `<strong>I ruoli e i permessi complessi.</strong> Con tre persone bastano due livelli: tu e chi lavora.`,
        `<strong>La contabilità generale.</strong> Quella è il lavoro del commercialista, e va lasciata a lui.`,
      ]},
      { t:'nota', x:`Nel gestionale queste cose semplicemente non ci sono, e non è una mancanza: è una
        scelta. Ogni funzione in più è una casella in più da guardare quando cerchi quella che ti serve.` }
    ]},

    { h2: 'Come partire senza perdere una giornata', blocchi: [
      { t:'fig', src:'/img/gestionale-lavori.webp', w:1440, h:971,
        alt:'I lavori aperti di una piccola impresa edile, con stato e totale',
        cap:'Si parte dai lavori aperti. Lo storico chiuso non si carica.' },
      `Questo è il punto dove quasi tutti si arenano: pensano di dover caricare tutto prima di cominciare,
       rimandano, e non cominciano mai.`,
      { t:'tab', testa:['Quando','Cosa fai'], righe:[
        ['<strong>Il primo giorno</strong>', 'I dati della tua azienda, una volta sola. Dieci minuti.'],
        ['<strong>Il prossimo preventivo</strong>', 'Lo fai qui invece che in Word. Il cliente lo crei mentre lo scrivi.'],
        ['<strong>La prima settimana</strong>', 'Man mano che lavori, entrano i lavori aperti. Non tutti: quelli aperti.'],
        ['<strong>Il primo mese</strong>', 'Le ore e le spese dei cantieri in corso. Da lì cominciano a uscire i conti veri.'],
      ]},
      `Lo storico dei lavori chiusi <strong>non si carica</strong>. Non serve a niente, e caricarlo è la
       giornata persa che fa mollare tutto.`
    ]},

    { h2: 'Quando sei solo, la squadra è un pezzo di carta', blocchi: [
      `Per chi lavora da solo la sezione squadra non serve. Ma serve una cosa che spesso si sottovaluta:
       <strong>gli accessi per i collaboratori sono compresi</strong>, senza costo per utente.`,
      `Vuol dire che il giorno che prendi il primo dipendente o lavori con un socio, non devi cambiare
       piano né rinegoziare niente. Cresci senza che il canone ti segua.`,
      { t:'espe', x:`Il consiglio meno tecnico e più utile: non aprire tutte le sezioni il primo giorno.
        Apri Preventivi, Lavori, Clienti e Fatture. Le altre le trovi quando ti serviranno. Un programma si
        impara usandolo su un lavoro vero, non esplorandolo.` }
    ]},
  ],

  faq: [
    { d: 'Va bene per un artigiano che lavora da solo?',
      r: `Sì, ed è il caso più comune. Le sezioni che non servono, come squadra, mezzi e reparti, si
          possono semplicemente non aprire: il minimo utile sono lavori, clienti, preventivi e fatture.` },
    { d: 'Gli accessi per i collaboratori costano di più?',
      r: `No, sono compresi nel prezzo. Non c'è un costo per utente aggiuntivo, quindi il canone non cresce
          quando cresce la squadra.` },
    { d: 'Devo caricare tutti i lavori vecchi per cominciare?',
      r: `No, ed è sconsigliato. Si parte dal prossimo preventivo e dai lavori aperti: lo storico chiuso
          non serve e caricarlo è la giornata persa che fa abbandonare il programma.` },
    { d: 'Quanto ci vuole per imparare a usarlo?',
      r: `Il primo preventivo si fa in dieci minuti. Il resto si impara usandolo: le parole sono quelle
          normali del mestiere e c'è l'assistente che risponde alle domande su come si fa una cosa.` },
    { d: "C'è il magazzino?",
      r: `Per le imprese edili no, ed è una scelta: se il materiale si compra per il cantiere e si porta
          direttamente lì, un magazzino a carichi e scarichi è peso inutile. Le spese si registrano sul
          lavoro, che è quello che serve per sapere quanto è costato.` },
  ]
},

];
