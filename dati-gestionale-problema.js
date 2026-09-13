/* FAMIGLIA 1 — IL PROBLEMA
   Una pagina per ogni cosa che un'impresa cerca su Google quando
   il problema ce l'ha gia'. Chi digita queste parole non sta
   curiosando: sta cercando di risolvere qualcosa oggi.
   ⛔ Ogni riga qui dentro descrive una cosa che nel gestionale ESISTE.
      Verificate sul database il 13 set 2026: gest_computi, gest_computo_voci,
      gest_computo_misure, gest_analisi_righe, gest_sal, gest_rapportini,
      gest_ore, gest_timbrature, gest_mezzi, gest_mezzi_scadenze,
      gest_rifornimenti, gest_carte, gest_prezzi_propri.
*/
module.exports = [

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'software-computo-metrico',
  link: 'Software computo metrico',
  riga: 'capitoli, misure, analisi prezzi e il computo da prezzare che ti manda il geometra',
  briciola: 'Software computo metrico',
  title: 'Software computo metrico per imprese edili e artigiani',
  desc: 'Software per il computo metrico: capitoli, voci con le misure, analisi prezzi e prezzario tuo. Il computo diventa preventivo. 3 mesi gratis.',
  h1: 'Software computo metrico: le misure, i prezzi e il preventivo che ne esce',
  minuti: 6,
  nomeApp: 'Computo metrico TrovaImpresa',
  cosaCosta: 'Il computo metrico',
  funzioni: ['Computo metrico con capitoli e voci', 'Misure riga per riga con lunghezza, larghezza e altezza',
    'Analisi prezzi con materiale, manodopera e noli', 'Prezzario personale che si riempie dai lavori fatti',
    'Computo da prezzare ricevuto dal committente', 'Computo che diventa preventivo con un click',
    'Esportazione del computo in PDF'],
  ctaTitolo: 'Prova col prossimo computo che ti arriva',
  ctaTesto: "Prendi l'ultimo computo che hai ricevuto e mettilo dentro. In dieci minuti capisci se ti fa risparmiare tempo o no.",
  sommario: `un programma per fare il <strong>computo metrico</strong> senza Excel: i capitoli, le voci
    con le misure una sotto l'altra, l'analisi prezzi e il tuo prezzario. Quando hai finito,
    <strong>il computo diventa un preventivo</strong> senza riscrivere niente.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Il computo metrico è la parte del lavoro che nessuno vede e che si porta via le serate.
        Misuri, moltiplichi, sommi. Poi cambia una quota e ricominci. Poi il committente chiede uno sconto
        del 5% e ricominci un'altra volta.` },
      `Quasi tutti lo fanno in Excel. Excel è bravo a fare i conti, ma non sa cos'è un computo: non sa che
       una voce ha delle misure sotto, non conosce il tuo prezzario, non collega il computo al preventivo,
       e soprattutto <strong>non ti dice mai se ci stai guadagnando</strong>.`
    ]},

    { h2: 'Le voci con le misure sotto, come si scrive a mano', blocchi: [
      `Un computo fatto bene non è un elenco di prezzi: è un elenco di <strong>misure</strong>. La voce
       «intonaco civile» non vale 12 €/mq e basta — vale 12 € per le misure che hai preso in cantiere.`,
      `Qui ogni voce ha le sue righe di misura sotto: descrizione, quante volte, lunghezza, larghezza,
       altezza. Il programma moltiplica e somma da solo, e la quantità della voce viene da lì.
       <strong>Se sbagli una quota, cambi quella riga e tutto il computo si aggiorna</strong> — non
       ricalcoli niente a mano.`,
      { t:'ok', righe: [
        `<strong>Capitoli</strong> per tenere separati scavi, strutture, murature, impianti, finiture.`,
        `<strong>Voci</strong> con codice, descrizione, unità di misura e prezzo unitario.`,
        `<strong>Misure</strong> riga per riga, con le tre dimensioni e il numero di volte.`,
        `<strong>Totale per capitolo</strong> e totale generale, sempre in fondo mentre scrivi.`,
      ]},
      { t:'nota', x:`<strong>Perché conta:</strong> quando il committente contesta una quantità, non devi
        rifare la misura. Apri la voce e gli fai vedere le righe da cui esce. Quella è la differenza fra
        discutere e avere ragione.` }
    ]},

    { h2: 'L\'analisi prezzi: il numero che ti dice se ci guadagni', blocchi: [
      `Questa è la parte che i programmi economici non hanno e che cambia il mestiere.
       L'analisi prezzi smonta una voce nei suoi pezzi: <strong>quanto materiale</strong>,
       <strong>quante ore di manodopera</strong>, <strong>quanto nolo</strong> di macchina.`,
      `Da lì esce il costo vero di quella voce. Ci aggiungi le spese generali e l'utile, e il prezzo che
       metti nel computo non è più una sensazione: è un conto.`,
      { t:'tab', num:true, testa:['Cosa scrivi','Cosa ti torna indietro'], righe:[
        ['Materiale, con quantità e prezzo', 'Quanto pesa il materiale su quella voce'],
        ['Ore di manodopera e costo orario', 'Quante ore devi metterci per non perderci'],
        ['Noli e attrezzatura', 'Il costo della macchina spalmato sulla lavorazione'],
        ['Spese generali e utile in percentuale', 'Il prezzo finale da mettere a computo'],
      ]},
      `E il conto lo puoi fare al contrario: parti dal prezzo che il committente è disposto a pagare e
       vedi <strong>quante ore ti restano</strong> per stare dentro. Quello è il momento in cui si decide
       se un lavoro si prende o si lascia.`
    ]},

    { h2: 'Il prezzario che diventa tuo', blocchi: [
      `Il prezzario regionale è un punto di partenza, non la verità. La verità è quanto ti costa a te,
       con la tua squadra, nella tua zona.`,
      `Ogni volta che chiudi un computo, i prezzi che hai usato restano nel tuo prezzario personale.
       Dal computo dopo li ritrovi già lì, e non riscrivi «intonaco civile» per la centesima volta.
       <strong>Dopo un anno hai un prezzario che vale più di quello della Regione</strong>, perché è
       fatto sui tuoi lavori veri.`,
      { t:'espe', x:`Questa non è un'idea presa da un manuale. Nasce da venticinque anni di cantiere:
        i prezzi giusti sono quelli che hai già praticato e che ti hanno lasciato qualcosa in tasca.
        Tutto il resto è teoria.` }
    ]},

    { h2: 'Il computo che ti manda il geometra, già senza prezzi', blocchi: [
      `Succede spesso: il geometra o lo studio ti manda un computo con le voci e le quantità già scritte,
       <strong>ma senza i prezzi</strong>, e ti chiede di fare l'offerta.`,
      `Nel gestionale c'è una sezione apposta, <strong>«Computo da prezzare»</strong>. Le voci le tieni
       come stanno, tu ci metti solo i tuoi prezzi, e alla fine esce il preventivo. C'è anche il
       <strong>ribasso</strong>, quello che nelle gare si applica in percentuale su tutto.`,
      { t:'nota', x:`Questa sezione c'è per le imprese edili, per gli artigiani e per gli studi tecnici.
        Anche a un artigiano il geometra manda il computo e gli chiede il prezzo: non è roba solo da
        imprese grandi.` }
    ]},

    { h2: 'Da computo a preventivo, senza riscrivere', blocchi: [
      { t:'fig', src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
        alt:'Il computo metrico diventato preventivo, con le voci e gli importi',
        cap:'Il computo diventato preventivo: le voci passano con le loro quantità.' },
      `È la parte che fa risparmiare più tempo di tutte, e nessuno la racconta perché sembra un dettaglio.`,
      `Quando il computo è finito, <strong>diventa un preventivo con un click</strong>: le voci passano
       di là con le loro quantità e i loro prezzi, ci metti l'IVA giusta e lo sconto se lo fai, e scarichi
       il PDF da mandare. Se il cliente lo accetta, <strong>il preventivo diventa un lavoro</strong>.
       Una catena sola, dalla misura in cantiere alla fattura.`,
      { t:'ok', righe:[
        `Il computo si scarica anche da solo, in PDF, se il committente lo vuole vedere.`,
        `Le quantità restano collegate: se correggi una misura, il preventivo lo sa.`,
        `L'IVA la scegli riga per riga, perché in edilizia nella stessa fattura ci stanno 10% e 22%.`,
      ]}
    ]},

    { h2: 'Perché non basta Excel', blocchi: [
      { t:'err', righe:[
        `<strong>La formula rotta.</strong> Trascini una cella, e da lì in giù il totale è sbagliato. Te ne accorgi dopo aver mandato l'offerta.`,
        `<strong>Il file che si moltiplica.</strong> computo_def.xlsx, computo_def2.xlsx, computo_DEFINITIVO_ok.xlsx. Poi non sai quale hai mandato.`,
        `<strong>Nessun prezzario.</strong> Ogni computo riparte da zero, e i prezzi te li ricordi a memoria.`,
        `<strong>Niente analisi prezzi.</strong> Excel ti dice quanto fa, non se ci guadagni.`,
        `<strong>Il computo resta lì.</strong> Il preventivo lo riscrivi, la fattura anche.`,
      ]},
      `Excel va benissimo per un computo ogni tanto. Quando i computi diventano una cosa che fai tutte le
       settimane, il tempo che perdi a rifarli vale molto più di 249 € l'anno.`
    ]},
  ],

  faq: [
    { d:'Il software fa il computo metrico estimativo?',
      r:`Sì. Ogni voce ha codice, descrizione, unità di misura, prezzo unitario e le righe di misura sotto,
         e il totale si costruisce da lì. I capitoli tengono separate le lavorazioni e ognuno ha il suo
         totale.` },
    { d:'Posso importare il prezzario della Regione?',
      r:`I prezzi li scrivi tu, e restano nel tuo prezzario personale per i computi dopo. Non c'è
         l'importazione automatica di un prezzario regionale in formato ufficiale: si parte dai tuoi
         prezzi veri, che nella pratica sono quelli che usi davvero.` },
    { d:'Serve per rispondere a una gara con il ribasso?',
      r:`C'è il computo da prezzare, cioè quello che ricevi già compilato nelle quantità, e c'è il ribasso
         in percentuale da applicare sul totale. Sono le due cose che servono per fare un'offerta su un
         computo di qualcun altro.` },
    { d:'Il computo metrico si scarica in PDF?',
      r:`Sì, il computo si scarica in PDF con i capitoli, le voci e i totali. E può diventare un preventivo
         con un click, senza riscrivere le voci.` },
    { d:"Che differenza c'è fra computo metrico e preventivo?",
      r:`Il computo misura il lavoro voce per voce con le quantità; il preventivo è il documento che mandi
         al cliente con l'IVA, l'eventuale sconto e le condizioni. Qui il primo diventa il secondo senza
         ricopiare niente.` },
    { d:'Si può usare dal telefono in cantiere?',
      r:`Sì, si apre dal browser sul telefono e sul computer, senza installare niente. Le misure prese in
         cantiere le scrivi sul posto, e la sera dal computer trovi tutto già dentro.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'programma-preventivi-edili',
  link: 'Programma per preventivi edili',
  riga: 'voci, IVA riga per riga, PDF pronto e il preventivo che diventa lavoro',
  briciola: 'Programma per preventivi edili',
  title: 'Programma per fare preventivi edili in PDF',
  desc: 'Programma per preventivi edili: voci con quantita\' e prezzo, IVA al 10% riga per riga, PDF pronto da mandare. Se il cliente accetta diventa lavoro.',
  h1: 'Programma per preventivi edili: dalla voce al PDF, e dal PDF al lavoro',
  minuti: 5,
  nomeApp: 'Preventivi edili TrovaImpresa',
  cosaCosta: 'Il programma dei preventivi',
  funzioni: ['Preventivi con voci, quantità e prezzo unitario', 'IVA al 10 per cento scelta riga per riga',
    'Sconto in percentuale sul preventivo', 'PDF del preventivo pronto da mandare',
    'Stato bozza, inviato, accettato, rifiutato', 'Preventivo accettato che diventa lavoro con un click',
    'Preventivo generato dall\'AI a partire da una descrizione'],
  ctaTitolo: 'Prova col prossimo preventivo che devi fare',
  ctaTesto: 'Non serve caricare lo storico. Prendi il preventivo che devi fare domani e fallo qui: ci metti dieci minuti e capisci subito.',
  sommario: `un programma per fare <strong>preventivi edili</strong> con le voci, l'IVA giusta riga per riga
    e il PDF pronto. Ogni preventivo ha uno stato, e <strong>quando il cliente accetta diventa un
    lavoro</strong> senza riscriverlo.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Il preventivo è il documento che ti fa prendere o perdere il lavoro, ed è quello che
        quasi sempre si fa di corsa, la sera, su un foglio Word copiato dall'ultimo.` },
      `Il problema non è scriverlo. Il problema è tutto quello che viene dopo: ritrovarlo fra due mesi,
       sapere se il cliente ha risposto, e non doverlo ricopiare quando il lavoro parte davvero.`
    ]},

    { h2: 'Le voci, con la quantità e il prezzo', blocchi: [
      `Scrivi le voci una per una: descrizione, quantità, unità di misura, prezzo unitario. Il totale si
       fa da solo mentre scrivi. Puoi mettere una <strong>riga libera</strong> quando serve dire una cosa
       senza prezzo, e uno <strong>sconto</strong> in percentuale in fondo.`,
      { t:'fig', src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
        alt:'Preventivi edili numerati con stato inviato, accettato e rifiutato, e importo con IVA',
        cap:'I preventivi numerati, con lo stato e l\'importo IVA compresa.' },
      `I prezzi che usi restano nel tuo prezzario, quindi dal preventivo dopo li ritrovi già lì.`
    ]},

    { h2: "L'IVA al 10%, riga per riga", blocchi: [
      `Questa è la cosa che i programmi di fatturazione generici sbagliano, ed è il motivo per cui un
       gestionale edile non è un capriccio.`,
      `Sulle manutenzioni e sui recuperi edilizi l'IVA è agevolata al <strong>10%</strong>, non al 22%.
       E nello stesso preventivo ci possono stare tutte e due: la manodopera al 10%, il bene significativo
       al 22% per la parte che supera il limite.`,
      { t:'ok', righe:[
        `L'IVA si sceglie <strong>riga per riga</strong>, non una sola per tutto il documento.`,
        `La <strong>ritenuta d'acconto</strong> quando il committente è un condominio.`,
        `Il <strong>bollo da 2 €</strong> sopra i 77,47 € per chi è in regime forfettario.`,
        `La <strong>cassa previdenziale</strong> per geometri, architetti e ingegneri.`,
      ]},
      { t:'nota', x:`Un programma che ti fa scegliere una sola IVA per tutto il documento non è fatto per
        l'edilizia. Prima o poi ti costa una nota di credito, o una discussione col commercialista.` }
    ]},

    { h2: 'Lo stato: la domanda «ha risposto?» sparisce', blocchi: [
      `Ogni preventivo ha uno stato: <strong>bozza</strong>, <strong>inviato</strong>,
       <strong>accettato</strong>, <strong>rifiutato</strong>. Sembra poco, ed è la cosa che cambia di più
       la settimana.`,
      `Perché la domanda vera non è «quanto ho preventivato». È <strong>«a chi devo richiamare»</strong>.
       Con gli stati, i preventivi inviati e mai chiusi stanno tutti in un filtro, e li vedi in due secondi.`,
      { t:'err', righe:[
        `<strong>Il preventivo perso.</strong> Il cliente richiama dopo due mesi e chiede se quel prezzo vale ancora. Tu non sai più quale prezzo gli avevi fatto.`,
        `<strong>Il preventivo mai richiamato.</strong> Il lavoro l'ha preso un altro solo perché tu non hai risentito il cliente.`,
        `<strong>Il preventivo riscritto due volte.</strong> Accettato a voce, e poi ricopiato a mano dentro il lavoro.`,
      ]}
    ]},

    { h2: 'Accettato, e diventa lavoro', blocchi: [
      `Quando il cliente dice di sì, <strong>con un click il preventivo diventa un lavoro</strong>: il
       cliente, l'importo e le voci passano di là. Non riscrivi niente, e soprattutto non sbagli a
       ricopiare l'importo.`,
      `Da quel momento il lavoro ha il suo stato, la sua data, le sue foto e le sue spese. E quando è
       finito, <strong>il gestionale ti dice che è finito e non l'hai ancora fatturato</strong> — che è
       il buco da cui, in edilizia, escono i soldi.`
    ]},

    { h2: 'Il preventivo scritto dall\'AI', blocchi: [
      `Se scrivere non è il tuo mestiere, questa parte cambia la serata. Descrivi il lavoro come lo diresti
       al telefono e l'assistente prepara le voci del preventivo. Poi <strong>controlli tu e salvi tu</strong>:
       l'AI non salva mai niente da sola.`,
      { t:'fig', src:'/img/gestionale-ai.webp', w:1440, h:785,
        alt:"L'assistente AI riempie le caselle del preventivo partendo da una frase scritta a mano",
        cap:'Una frase scritta a mano, le caselle riempite. Il salvataggio resta tuo.' },
    ]},
  ],

  faq: [
    { d:'Il programma fa il PDF del preventivo?',
      r:`Sì. Scarichi il PDF con le tue voci, i totali, l'IVA e i dati della tua azienda, pronto da mandare
         al cliente per email o su WhatsApp.` },
    { d:"Posso mettere l'IVA al 10% solo su alcune righe?",
      r:`Sì, l'IVA si sceglie riga per riga. Nello stesso preventivo possono convivere il 10% delle
         manutenzioni e il 22% dove serve, come richiede l'edilizia.` },
    { d:'Il preventivo accettato diventa lavoro?',
      r:`Sì, con un click: cliente, importo e voci passano nel lavoro senza riscrivere niente. Da lì il
         lavoro segue il suo stato fino alla fattura.` },
    { d:'Si può fare un preventivo dal telefono?',
      r:`Sì. Si apre dal browser sul telefono e sul computer, senza installare niente. Capita spesso di
         chiudere il preventivo in macchina, appena usciti dal sopralluogo.` },
    { d:'Posso mettere uno sconto?',
      r:`Sì, uno sconto in percentuale che il conto applica prima dell'IVA, come si deve. E la ritenuta
         d'acconto, quando c'è, si calcola sull'imponibile già scontato.` },
    { d:'I preventivi vecchi restano?',
      r:`Restano tutti, numerati e con il loro stato. Quando un cliente richiama dopo mesi, ritrovi il
         preventivo che gli avevi fatto e sai esattamente cosa gli avevi detto.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'software-gestione-cantieri',
  link: 'Software gestione cantieri',
  riga: 'i cantieri aperti, chi ci va, a che punto sono e quanto hanno mangiato',
  briciola: 'Software gestione cantieri',
  title: 'Software gestione cantieri per imprese edili',
  desc: 'Software per la gestione dei cantieri: lavori con stato e colore, squadra e agenda, mappa dei cantieri aperti, spese e foto. Dal telefono in cantiere. 3 mesi gratis.',
  h1: 'Software gestione cantieri: tre cantieri aperti e la testa che regge',
  minuti: 6,
  nomeApp: 'Gestione cantieri TrovaImpresa',
  cosaCosta: 'La gestione dei cantieri',
  funzioni: ['Lavori con stato da fare, in corso, fatto', 'Calendario e agenda per ogni operaio',
    'Mappa dei cantieri aperti', 'Foto prima e dopo per ogni cantiere',
    'Spese del cantiere con fornitore e importo', 'Rapportini giornalieri dal telefono',
    'Ore lavorate per cantiere e per persona'],
  ctaTitolo: 'Mettici dentro i cantieri che hai aperti adesso',
  ctaTesto: 'Bastano quelli aperti oggi. In un quarto d\'ora vedi la settimana della squadra in una schermata sola.',
  sommario: `un programma per tenere in ordine i <strong>cantieri aperti</strong>: a che punto sono,
    chi ci va, quanto hanno speso e cosa manca. Con la mappa, l'agenda della squadra e le foto,
    dal telefono mentre sei sul posto.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Con un cantiere solo non serve niente: ce l'hai in testa. Il problema comincia al terzo,
        quando la testa non basta più e cominci a rispondere «adesso controllo e ti richiamo».` },
      `E non è che non sai come va il cantiere. È che <strong>l'informazione sta in cinque posti</strong>:
       le date sul calendario del telefono, le spese nelle bolle in macchina, le foto nella galleria, chi
       ci va in un messaggio WhatsApp, e quanto hai già speso da nessuna parte.`
    ]},

    { h2: 'Lo stato a colpo d\'occhio, senza leggere', blocchi: [
      `Ogni lavoro ha uno stato e un colore: <strong>da fare</strong>, <strong>in corso</strong>,
       <strong>fatto</strong>. Il colore non è decorazione: dice lo stato, e si legge senza fermarsi.`,
      { t:'fig', src:'/img/gestionale-lavori.webp', w:1440, h:971,
        alt:'Elenco dei lavori nel gestionale, con stato in corso, da fare e fatto',
        cap:'I lavori del reparto, con il totale in alto e il filtro «da incassare».' },
      `Sopra c'è quanto valgono in tutto, e i filtri ti danno subito le tre risposte che servono davvero:
       <strong>quali sono in ritardo</strong>, <strong>quali sono di oggi</strong>, e
       <strong>quali sono finiti e non ancora fatturati</strong>.`
    ]},

    { h2: 'Chi va dove, senza la telefonata delle sette', blocchi: [
      `La chiamata dell'operaio alle sette di mattina per sapere in che cantiere andare non è colpa sua:
       è che non c'è nessun posto dove guardare.`,
      `Nel gestionale ogni persona della squadra ha <strong>la sua agenda</strong>. L'operaio entra con il
       suo accesso, vede <strong>solo i suoi lavori</strong>, e non gira per il resto del programma.
       Tu la settimana la vedi tutta insieme sul calendario.`,
      { t:'ok', righe:[
        `<strong>Accesso separato</strong> per collaboratori e segretaria, con quello che possono vedere e quello che no.`,
        `<strong>Calendario</strong> della squadra, per capire dove hai buchi e dove hai troppa gente.`,
        `<strong>Mappa dei cantieri aperti</strong>, per non fare quaranta chilometri a vuoto.`,
        `<strong>Rapportino giornaliero</strong> compilato dal telefono, sul posto, in mezzo minuto.`,
      ]}
    ]},

    { h2: 'Quanto ha mangiato il cantiere', blocchi: [
      `Questa è la domanda che divide le imprese che campano da quelle che chiudono, e quasi nessuno se la
       fa mentre il cantiere è aperto. Se la fa dopo, quando è tardi.`,
      `Ogni lavoro tiene le sue <strong>spese</strong> — materiale, fornitori, noli — e le sue
       <strong>ore</strong>. Il conto lo fa il programma: quanto hai preventivato, quanto stai spendendo,
       quanto resta.`,
      { t:'tab', testa:['La domanda','Dove sta la risposta'], righe:[
        ['Quanto ho speso su questo cantiere', 'Le spese del lavoro, con fornitore e importo'],
        ['Quante ore ci ho messo', 'Le ore registrate per lavoro e per persona'],
        ['Quanto ho ancora da incassare', 'Il filtro «da incassare» sulle fatture'],
        ['Quali cantieri ho finito e non ho fatturato', 'Il filtro sui lavori finiti senza fattura'],
      ]},
      { t:'espe', x:`In edilizia il lavoro finisce a giugno e la fattura parte a settembre. Non è
        disorganizzazione, è come funziona il mestiere. Ma se nessuno tiene il conto di quali cantieri
        finiti non sono stati fatturati, quei soldi restano fuori — e sono soldi già lavorati.` }
    ]},

    { h2: 'Le foto, che servono due volte', blocchi: [
      `Le foto del prima e dopo servono a due cose, e la seconda vale più della prima.`,
      `La prima: quando il cliente contesta, hai la prova di com'era. La seconda, più importante:
       <strong>le foto sono il modo più veloce per farsi dire di sì dal prossimo cliente</strong>. Un
       lavoro fatto bene, fotografato bene, vende meglio di qualsiasi discorso.`,
      `Le foto stanno attaccate al cantiere, non sparse nella galleria del telefono fra i meme e le foto
       di famiglia.`
    ]},

    { h2: 'Reparti separati, se fai più mestieri', blocchi: [
      `Molte imprese non fanno una cosa sola: edilizia e giardinaggio, oppure edilizia e una ferramenta.
       Se i lavori si mischiano, i conti non tornano più e non capisci quale attività ti rende.`,
      `Qui i <strong>reparti sono separati</strong>: ognuno ha i suoi lavori, i suoi clienti, i suoi
       preventivi e i suoi conti. Cambi reparto e cambia tutto quello che vedi.`
    ]},
  ],

  faq: [
    { d:'Il software di gestione cantieri funziona dal telefono?',
      r:`Sì, ed è pensato per quello. Si apre dal browser sul telefono senza installare niente, con i
         pulsanti grandi abbastanza da premerli con il guanto. La sera dal computer trovi tutto già dentro.` },
    { d:'Gli operai possono avere un accesso loro?',
      r:`Sì. C'è un accesso separato per collaboratori e segretaria: l'operaio entra nella propria agenda,
         vede soltanto i lavori assegnati a lui e compila il rapportino, senza girare per il resto del
         programma.` },
    { d:'Si vede quanto sta costando un cantiere?',
      r:`Sì. Ogni lavoro tiene le sue spese e le sue ore, e il programma confronta quello che hai
         preventivato con quello che stai spendendo mentre il cantiere è ancora aperto.` },
    { d:"C'è la mappa dei cantieri?",
      r:`Sì, i cantieri aperti si vedono su una mappa. Serve soprattutto a organizzare i giri della
         giornata senza fare chilometri a vuoto.` },
    { d:'Posso tenere separate due attività diverse?',
      r:`Sì, con i reparti. Se fai edilizia e giardinaggio, ogni reparto ha i suoi lavori, i suoi clienti e
         i suoi conti, e non si mischiano.` },
    { d:'I dati dei cantieri si possono esportare?',
      r:`Sì, in Excel o in JSON, quando vuoi e senza costi. I dati sono tuoi: se un giorno cambi programma,
         te li porti dietro.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'app-rapportini-cantiere',
  link: 'App rapportini di cantiere',
  riga: 'il rapportino compilato sul posto in mezzo minuto, ore comprese',
  briciola: 'App rapportini di cantiere',
  title: 'App rapportini di cantiere: il giornaliero dal telefono',
  desc: 'App per il rapportino giornaliero di cantiere: chi c\'era, cosa si e\' fatto, ore e foto, compilato sul posto dal telefono. 3 mesi gratis.',
  h1: 'App rapportini di cantiere: mezzo minuto sul posto, non mezz\'ora la sera',
  minuti: 5,
  nomeApp: 'Rapportini di cantiere TrovaImpresa',
  cosaCosta: 'Il rapportino di cantiere',
  funzioni: ['Rapportino giornaliero compilato dal telefono', 'Chi era in cantiere e quante ore',
    'Descrizione della giornata e foto', 'Ore per persona e per cantiere',
    'Timbratura di entrata e uscita', 'Le ore che entrano nel costo del lavoro'],
  ctaTitolo: 'Provalo domani mattina in cantiere',
  ctaTesto: 'Apri il telefono a fine giornata e compila il rapportino sul posto. Se ci metti più di un minuto, non ti serve.',
  sommario: `il <strong>rapportino giornaliero</strong> compilato dal telefono, in cantiere, mentre te
    lo ricordi: chi c'era, cosa si è fatto, quante ore e le foto. Le ore poi
    <strong>entrano da sole nel costo del lavoro</strong>.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Il rapportino è la cosa più utile e più odiata del cantiere. Utile perché è l'unica
        prova di cosa si è fatto e con chi. Odiata perché si compila la sera, a casa, quando non ti
        ricordi più niente.` },
      `Il rapportino scritto tre giorni dopo è un rapportino inventato. Non serve a difenderti in una
       contestazione e non serve a capire quante ore è costato il cantiere. Serve solo a far finta.`
    ]},

    { h2: 'Compilato sul posto, non a casa', blocchi: [
      { t:'fig', tel:true, src:'/img/gestionale-telefono.webp', w:780, h:1688,
        alt:'Il rapportino di cantiere compilato dal telefono, sul posto',
        cap:'Il rapportino si compila dal telefono, in cantiere. Niente da installare.' },
      `L'unico rapportino che vale è quello scritto mentre sei ancora lì, con la polvere addosso. Per
       questo la schermata è corta: <strong>chi c'era, quante ore, cosa si è fatto, la foto</strong>.
       Niente sedici caselle obbligatorie.`,
      { t:'ok', righe:[
        `<strong>Chi c'era</strong>, scelto dalla squadra, con le ore di ognuno.`,
        `<strong>Cosa si è fatto</strong>, due righe scritte come le diresti a voce.`,
        `<strong>Le foto</strong> della giornata, attaccate al cantiere giusto.`,
        `<strong>Mezzi e attrezzature</strong> usate quel giorno, se ti servono per i noli.`,
      ]},
      { t:'nota', x:`Se scrivere ti pesa, l'assistente AI trasforma una frase parlata in un rapportino
        compilato. Tu controlli e salvi: il salvataggio resta sempre tuo.` }
    ]},

    { h2: 'Le ore che diventano un numero, non un ricordo', blocchi: [
      `Questa è la parte che cambia i conti. Le ore scritte sul rapportino non restano su un foglio:
       finiscono nelle <strong>ore del cantiere</strong> e nelle <strong>ore della persona</strong>.`,
      { t:'tab', testa:['Quello che ottieni','A cosa serve davvero'], righe:[
        ['Ore per cantiere', "Sapere se quel lavoro ti è costato più di quanto l'hai preventivato"],
        ['Ore per persona', 'Le buste paga e i conti di fine mese, senza rincorrere nessuno'],
        ['Giornate lavorate', 'Rispondere al committente quando contesta i tempi'],
        ['Timbratura entrata e uscita', "Registrare l'orario vero quando serve, senza discussioni"],
      ]},
      `Il conto che ne esce è quello vero: <strong>preventivato meno materiale meno ore</strong>. Se il
       numero è piccolo, quel tipo di lavoro non conviene più — ed è meglio scoprirlo adesso che fra un
       anno.`
    ]},

    { h2: 'Quando il rapportino ti salva', blocchi: [
      `Non capita spesso, ma quando capita vale l'abbonamento di dieci anni.`,
      { t:'err', righe:[
        `<strong>«Avete perso una settimana».</strong> Tu apri i rapportini e fai vedere le giornate, chi c'era e cosa si è fatto.`,
        `<strong>«Questo lavoro non era nel preventivo».</strong> C'è scritto il giorno che l'avete fatto, con la foto.`,
        `<strong>«L'operaio non è venuto».</strong> C'è la giornata registrata, con le ore.`,
        `<strong>Il commercialista che chiede le ore.</strong> Sono già sommate, per persona e per mese.`,
      ]}
    ]},

    { h2: 'Perché non basta il gruppo WhatsApp', blocchi: [
      `Molte imprese il rapportino lo fanno su WhatsApp: una foto e due righe nel gruppo. Funziona per
       comunicare, non funziona per tenere il conto.`,
      `Su WhatsApp le informazioni <strong>scorrono via</strong>: dopo un mese trovare la giornata giusta
       vuol dire scorrere mille messaggi. E soprattutto <strong>i messaggi non si sommano</strong>: nessuno
       ti dirà mai quante ore avete messo su quel cantiere.`
    ]},
  ],

  faq: [
    { d:"Cos'è il rapportino giornaliero di cantiere?",
      r:`È il documento che registra la giornata di lavoro: chi era presente, quante ore, cosa è stato
         fatto e con quali mezzi. Serve a tenere il conto delle ore e a dimostrare l'avanzamento del
         lavoro in caso di contestazione.` },
    { d:'Gli operai possono compilarlo da soli?',
      r:`Sì. Ogni collaboratore ha il suo accesso, entra nella propria agenda e compila il rapportino della
         giornata dal telefono, senza vedere il resto del gestionale.` },
    { d:"Serve installare un'app?",
      r:`No. Si apre dal browser del telefono e funziona come un'app, senza scaricare niente dagli store e
         senza aggiornamenti da fare a mano.` },
    { d:'Le ore del rapportino si sommano da sole?',
      r:`Sì. Le ore scritte nel rapportino finiscono nelle ore del cantiere e in quelle della persona, e
         si vedono già sommate per lavoro e per mese.` },
    { d:"C'è la timbratura di entrata e uscita?",
      r:`Sì, oltre al rapportino c'è la registrazione di entrata e uscita, per quando serve l'orario preciso
         invece del totale della giornata.` },
    { d:'Posso allegare le foto al rapportino?',
      r:`Sì, le foto restano attaccate al cantiere giusto e al giorno giusto, invece di finire sparse nella
         galleria del telefono.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'software-fatturazione-elettronica-edilizia',
  link: 'Fatturazione elettronica in edilizia',
  riga: 'XML per lo SDI, IVA 10% riga per riga, ritenuta, bollo e cassa',
  briciola: 'Fatturazione elettronica in edilizia',
  title: 'Fatturazione elettronica per imprese edili: XML, IVA 10%',
  desc: 'Software di fatturazione elettronica per l\'edilizia: file XML per lo SDI, IVA al 10% riga per riga, ritenuta d\'acconto, bollo e cassa previdenziale. 3 mesi gratis.',
  h1: 'Fatturazione elettronica in edilizia: le quattro cose che i programmi generici sbagliano',
  minuti: 6,
  nomeApp: 'Fatturazione elettronica edile TrovaImpresa',
  cosaCosta: 'La fatturazione',
  funzioni: ['File XML per lo SDI', 'IVA al 10 per cento riga per riga',
    "Ritenuta d'acconto calcolata sull'imponibile scontato", 'Bollo da 2 euro per il regime forfettario',
    'Cassa previdenziale per i tecnici', 'Buchi nella numerazione segnalati',
    'Da incassare, da fatturare ed entrato in cassa'],
  ctaTitolo: 'Prova con la prossima fattura',
  ctaTesto: 'Fai la prossima fattura qui e guarda il file XML che esce. Se il commercialista lo accetta senza dire niente, hai finito di cercare.',
  sommario: `fatturazione elettronica pensata per l'edilizia: prepara il <strong>file XML per lo SDI</strong>
    con l'<strong>IVA al 10% riga per riga</strong>, la ritenuta, il bollo e la cassa previdenziale.
    Il file lo mandi tu o il commercialista.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`I programmi di fatturazione sono tanti e costano poco. Il problema è che quasi tutti
        sono fatti per chi vende scarpe o consulenza, e in edilizia il fisco funziona in un altro modo.` },
      `Le differenze non sono dettagli da commercialista: sono <strong>errori che ti tornano indietro</strong>,
       sotto forma di nota di credito, di fattura scartata dallo SDI o di telefonata a fine anno.`
    ]},

    { h2: 'Le quattro cose che cambiano', blocchi: [
      { t:'tab', testa:['La cosa','Perché in edilizia cambia'], righe:[
        ['<strong>IVA al 10%</strong>', "Sulle manutenzioni e sui recuperi edilizi l'IVA è agevolata al 10%, non al 22%. E nella stessa fattura possono starci tutte e due, quindi va scelta riga per riga."],
        ["<strong>Ritenuta d'acconto</strong>", "Il condominio trattiene la ritenuta, il committente privato no. E la base è l'imponibile già scontato, non quello pieno: è l'errore più comune."],
        ['<strong>Forfettario e bollo</strong>', "In regime forfettario l'IVA non c'è, ma sopra i 77,47 € ci vuole il bollo da 2 €. Il programma te lo dice al momento giusto."],
        ['<strong>Cassa previdenziale</strong>', "Per geometri, architetti e ingegneri la parcella ha il contributo cassa, e nel file elettronico ci vuole il codice giusto per quella cassa."],
      ]},
      { t:'nota', x:`Un programma che ti fa scegliere una sola aliquota per tutto il documento non è
        adatto all'edilizia. Non è un difetto grave del programma: è che non è stato fatto per te.` }
    ]},

    { h2: 'Il file XML, e chi lo manda', blocchi: [
      `Il gestionale prepara il <strong>file XML nel formato che vuole lo SDI</strong> e il PDF di cortesia
       per il cliente.`,
      { t:'nota', x:`<strong>Una cosa che non fa, detta prima e non dopo:</strong> non manda la fattura allo
        SDI al posto tuo e non fa da intermediario fiscale. Prepara il file corretto, tu lo carichi dove lo
        carichi adesso, oppure lo giri al commercialista.` },
      `È una scelta, non una mancanza: fare da intermediario fiscale vuol dire prendersi responsabilità che
       poi si pagano nel prezzo. Preferiamo che il file sia giusto e che il canale resti il tuo.`
    ]},

    { h2: 'I quattro numeri che di solito nessuno ti dice', blocchi: [
      `In cima alle fatture ci sono quattro numeri. Non sono statistiche: sono le domande che ti fai in
       macchina.`,
      { t:'fig', src:'/img/gestionale-fatture.webp', w:1440, h:1265,
        alt:'Fatture elettroniche nel gestionale edile: da incassare, da fatturare, entrato in cassa',
        cap:'Le fatture, con i buchi nella numerazione segnalati da soli.' },
      { t:'ok', righe:[
        `<strong>Da incassare</strong>: quanto hai fatturato e non ti è ancora arrivato.`,
        `<strong>Da fatturare</strong>: i lavori finiti che non hai ancora fatturato. Questo è il buco vero.`,
        `<strong>Entrato in cassa</strong>: quanto è davvero arrivato quest'anno.`,
        `<strong>Il credito più vecchio</strong>: da quanti giorni aspetti quello messo peggio.`,
      ]},
      `Gli importi sono scritti <strong>coi centesimi</strong>, non arrotondati all'euro. Su una fattura
       gli arrotondamenti non sono un dettaglio grafico.`
    ]},

    { h2: 'I buchi nella numerazione, prima di dicembre', blocchi: [
      `Il buco nella numerazione si scopre sempre a fine anno, quando il commercialista chiede dov'è finita
       la numero 7. A quel punto sistemarlo è una rogna.`,
      `Qui il buco <strong>si segnala da solo</strong>, il giorno stesso. Costa dieci secondi allora e
       mezza giornata a dicembre.`
    ]},

    { h2: 'Il lavoro e la fattura sono due cose', blocchi: [
      `In edilizia il lavoro finisce a giugno e la fattura parte a settembre. È come funziona il mestiere,
       e i programmi generici non lo capiscono: per loro la fattura nasce dal nulla.`,
      `Qui lavoro e fattura sono <strong>collegati ma separati</strong>. Il lavoro ha il suo stato, la
       fattura il suo. E il programma ti dice quali lavori finiti non hai ancora fatturato — che è la
       prima causa di soldi lasciati in giro.`,
      { t:'espe', x:`La fattura si porta dietro i dati del cliente congelati al momento dell'emissione.
        Se il cliente cambia indirizzo l'anno dopo, la fattura vecchia resta com'era — perché quella
        l'ha già in mano lui.` }
    ]},
  ],

  faq: [
    { d:'Il programma manda la fattura allo SDI?',
      r:`No. Prepara il file XML nel formato richiesto dallo SDI, con l'IVA riga per riga, la ritenuta, il
         bollo e la cassa previdenziale. La trasmissione resta a te o al tuo commercialista: il programma
         non fa da intermediario fiscale.` },
    { d:"Gestisce l'IVA agevolata al 10% dell'edilizia?",
      r:`Sì, e la sceglie riga per riga. Nella stessa fattura possono convivere il 10% sulle manutenzioni e
         il 22% dove serve, come richiede il lavoro edile.` },
    { d:"Calcola la ritenuta d'acconto per i condomini?",
      r:`Sì. La percentuale la scrivi tu e il calcolo toglie la ritenuta dal totale come si deve, con base
         l'imponibile già scontato e non quello pieno.` },
    { d:'Va bene per il regime forfettario?',
      r:`Sì. In forfettario l'IVA non si applica e sopra i 77,47 € serve il bollo da 2 €: il programma lo
         segnala al momento giusto, invece di lasciartelo scoprire dopo.` },
    { d:'Serve per geometri e architetti con la cassa?',
      r:`Sì, il contributo cassa previdenziale è previsto e nel file elettronico viene messo il codice
         giusto per quella cassa.` },
    { d:'Mi dice quali lavori non ho ancora fatturato?',
      r:`Sì, è uno dei quattro numeri in cima alle fatture: i lavori finiti e mai fatturati. In edilizia è
         il buco da cui escono più soldi di qualsiasi altro.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'software-sal-stati-avanzamento-lavori',
  link: 'Software SAL',
  riga: 'gli stati di avanzamento, quanto è maturato e la fattura che ne esce',
  briciola: 'Software SAL',
  title: 'Software SAL: stati di avanzamento lavori per imprese edili',
  desc: 'Software per i SAL: quanto e\' stato eseguito, quanto e\' maturato, quanto resta e la fattura che ne esce. Per i lavori lunghi. 3 mesi gratis.',
  h1: 'Software SAL: fatturare mentre il lavoro va avanti, non alla fine',
  minuti: 5,
  nomeApp: 'SAL e stati di avanzamento TrovaImpresa',
  cosaCosta: 'La gestione dei SAL',
  funzioni: ['Stati di avanzamento lavori (SAL)', 'Quantità eseguite per ogni voce',
    'Importo maturato e importo residuo', 'SAL collegato al computo e al preventivo',
    'Fattura emessa dallo stato di avanzamento'],
  ctaTitolo: 'Prova sul lavoro lungo che hai adesso',
  ctaTesto: 'Se hai un cantiere che dura mesi, mettici dentro il primo stato di avanzamento e guarda che numeri ti restituisce.',
  sommario: `un programma per gestire gli <strong>stati di avanzamento lavori</strong>: quante quantità
    hai eseguito, quanto è <strong>maturato</strong>, quanto <strong>resta</strong>, e la fattura che
    esce da lì. Per i lavori che durano mesi.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Sui lavori lunghi la regola è semplice: chi fattura solo alla fine, la fine la vede
        con la banca alle costole.` },
      `Il SAL — stato di avanzamento lavori — serve esattamente a questo: certificare quanto è stato fatto
       finora, e farsi pagare quella parte mentre il cantiere è ancora aperto.`,
      `Il problema è che farlo a mano è un lavoro da ragioniere: riprendere il computo, segnare le quantità
       eseguite voce per voce, moltiplicare, sommare, sottrarre quello già fatturato. Su un computo di
       duecento voci si perde una giornata.`
    ]},

    { h2: 'Le quantità eseguite, non i prezzi', blocchi: [
      `Un SAL non si scrive: si <strong>spunta</strong>. Le voci ci sono già, i prezzi anche — vengono dal
       computo o dal preventivo. Quello che cambia ogni volta è una cosa sola:
       <strong>quanto di quella voce hai eseguito finora</strong>.`,
      { t:'ok', righe:[
        `Le voci arrivano dal computo, non le riscrivi.`,
        `Per ogni voce metti la <strong>quantità eseguita</strong> a oggi.`,
        `Il programma calcola l'<strong>importo maturato</strong> e quello <strong>residuo</strong>.`,
        `Il SAL nuovo tiene conto di quelli di prima: fatturi la differenza, non tutto da capo.`,
      ]},
      { t:'nota', x:`È qui che si fanno gli errori più cari: fatturare due volte la stessa quantità, o
        dimenticarne una. Con i SAL in fila il conto lo tiene il programma.` }
    ]},

    { h2: 'I tre numeri di un cantiere lungo', blocchi: [
      { t:'tab', testa:['Numero','Cosa ti dice'], righe:[
        ['<strong>Maturato</strong>', 'Quanto lavoro hai già fatto, in euro. È quello che puoi chiedere.'],
        ['<strong>Fatturato</strong>', 'Quanto di quel maturato hai già messo in fattura.'],
        ['<strong>Residuo</strong>', 'Quanto manca alla fine del contratto.'],
      ]},
      `La differenza fra <strong>maturato</strong> e <strong>fatturato</strong> è la cosa più importante
       che un'impresa possa guardare su un lavoro lungo: sono soldi già lavorati e non ancora chiesti.`
    ]},

    { h2: 'Dal SAL alla fattura', blocchi: [
      { t:'fig', src:'/img/gestionale-fatture.webp', w:1440, h:1265,
        alt:'La fattura emessa da uno stato di avanzamento lavori, con il maturato',
        cap:'La fattura nasce dal SAL: importo e riferimento non si ricopiano a mano.' },
      `Chiuso lo stato di avanzamento, la fattura esce da lì: importo, riferimento al SAL, IVA riga per
       riga, ritenuta se il committente è un condominio. Non ricopi importi a mano, che è il posto dove
       si sbaglia una cifra e ci si accorge dopo.`,
      `E il file elettronico per lo SDI si prepara come per qualsiasi altra fattura.`
    ]},

    { h2: 'A chi serve davvero', blocchi: [
      `Non a tutti, e vale la pena dirlo.`,
      { t:'ok', righe:[
        `<strong>Serve</strong> se lavori su cantieri che durano più di due o tre mesi.`,
        `<strong>Serve</strong> se lavori con imprese generali, condomini o committenti pubblici, dove il SAL è previsto dal contratto.`,
        `<strong>Serve</strong> se ti è già capitato di finire un lavoro lungo con la cassa a secco.`,
      ]},
      { t:'err', righe:[
        `<strong>Non serve</strong> se fai interventi da uno o due giorni: lì fatturi a lavoro finito e basta.`,
      ]},
      `Se sei nel secondo gruppo, il resto del gestionale ti serve lo stesso — questa sezione semplicemente
       non la aprirai.`
    ]},
  ],

  faq: [
    { d:'Cosa sono i SAL, gli stati di avanzamento lavori?',
      r:`Sono i documenti che certificano quanta parte del lavoro è stata eseguita a una certa data. Servono
         a farsi pagare a tranche mentre il cantiere è ancora aperto, invece di aspettare la fine.` },
    { d:'Il SAL prende le voci dal computo?',
      r:`Sì. Le voci e i prezzi arrivano dal computo o dal preventivo: nel SAL scrivi soltanto le quantità
         eseguite a oggi, e gli importi si calcolano da soli.` },
    { d:'Il programma tiene conto dei SAL precedenti?',
      r:`Sì. Ogni nuovo stato di avanzamento considera quelli già emessi, così fatturi la differenza e non
         due volte la stessa quantità.` },
    { d:'Dal SAL si può emettere la fattura?',
      r:`Sì, la fattura nasce dallo stato di avanzamento con il suo importo e il riferimento al SAL, e
         segue le stesse regole delle altre fatture: IVA riga per riga, ritenuta e file XML per lo SDI.` },
    { d:'Serve anche a un artigiano che lavora da solo?',
      r:`Solo se fa lavori lunghi, per esempio in subappalto da un'impresa generale. Su interventi di uno o
         due giorni questa sezione non serve e si può semplicemente non aprirla.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'software-gestione-mezzi-attrezzature',
  link: 'Gestione mezzi e attrezzature',
  riga: 'revisione, bollo, assicurazione, carburante e le carte che si scaricano',
  briciola: 'Gestione mezzi e attrezzature',
  title: 'Software gestione mezzi e attrezzature di cantiere',
  desc: 'Software per i mezzi di cantiere: revisione, bollo, assicurazione e tagliando con l\'avviso prima, rifornimenti e carte carburante. 3 mesi gratis.',
  h1: 'Gestione mezzi e attrezzature: la revisione che non ti scade addosso',
  minuti: 5,
  nomeApp: 'Gestione mezzi TrovaImpresa',
  cosaCosta: 'La gestione dei mezzi',
  funzioni: ['Mezzi e attrezzature con la loro scheda', 'Revisione, bollo, assicurazione e tagliando con le scadenze',
    'Avviso prima che una scadenza arrivi', 'Rifornimenti di carburante con litri e importo',
    'Saldo delle carte carburante', 'Mezzi collegati al cantiere dove stanno lavorando'],
  ctaTitolo: 'Metti dentro i mezzi che hai',
  ctaTesto: "Furgone, betoniera, ponteggio. Scrivi le quattro date delle scadenze una volta sola, e non ci pensi più.",
  sommario: `un posto solo per <strong>mezzi e attrezzature</strong>: revisione, bollo, assicurazione e
    tagliando con l'<strong>avviso prima che scadano</strong>, i rifornimenti di carburante e il saldo
    delle carte.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`La revisione scaduta la scopri sempre nello stesso modo: fermato al controllo, oppure
        il giorno che devi caricare e il furgone non si può muovere.` },
      `Non è distrazione. È che le scadenze dei mezzi stanno su quattro fogli diversi, in quattro cassetti
       diversi, e nessuno ha il compito di guardarle.`
    ]},

    { h2: 'Le quattro date, in un posto solo', blocchi: [
      `Ogni mezzo ha la sua scheda con le date che contano: <strong>revisione</strong>, <strong>bollo</strong>,
       <strong>assicurazione</strong>, <strong>tagliando</strong>. Le scrivi una volta.`,
      `Da lì in poi il programma ti <strong>avvisa prima</strong>, non il giorno dopo. E le scadenze vicine
       si vedono in ambra, quelle passate in rosso: il colore dice lo stato, non serve leggere.`,
      { t:'ok', righe:[
        `Furgoni, autocarri e macchine operatrici.`,
        `Attrezzature: betoniere, ponteggi, martelli, gruppi elettrogeni.`,
        `Il mezzo collegato al cantiere dove sta lavorando in questo momento.`,
        `Le scadenze tutte insieme, in ordine di data, con quelle vicine in evidenza.`,
      ]}
    ]},

    { h2: 'Il carburante, che è il secondo costo dopo la manodopera', blocchi: [
      `Sul carburante quasi nessuno tiene il conto, e intanto è la seconda voce di costo di un'impresa
       edile dopo le persone.`,
      { t:'tab', testa:['Cosa registri','Cosa vieni a sapere'], righe:[
        ['Rifornimento con litri e importo', 'Quanto consuma davvero ogni mezzo'],
        ['Chilometri o ore di lavoro', 'Il costo per chilometro o per ora del mezzo'],
        ['Carta carburante usata', 'Il saldo che ti resta sulla carta'],
        ['Il cantiere del giorno', 'Quanto carburante si è mangiato quel lavoro'],
      ]},
      `Il numero che salta fuori spesso sorprende: c'è quasi sempre un mezzo che consuma molto più degli
       altri, e finché non lo scrivi da nessuna parte non lo sai.`
    ]},

    { h2: 'Le carte carburante, con il saldo che resta', blocchi: [
      `Le carte prepagate sono comode e sono anche il posto dove i soldi spariscono senza traccia.
       Qui ogni carta ha il suo <strong>saldo</strong>: quanto c'era, quanto è stato usato, quanto resta.`,
      { t:'nota', x:`Quando il saldo di una carta scende più in fretta del solito, lo vedi mentre succede.
        È una di quelle cose che non cerchi, ma che è meglio sapere.` }
    ]},

    { h2: 'Il nolo, quando il mezzo lavora per il cantiere', blocchi: [
      { t:'fig', src:'/img/gestionale-lavori.webp', w:1440, h:971,
        alt:'I lavori con i mezzi collegati al cantiere e il costo che ci finisce dentro',
        cap:'Il mezzo collegato al cantiere: il suo costo entra nel conto del lavoro.' },
      `Se collega il mezzo al cantiere, il costo di quel mezzo entra nel conto del lavoro. È l'unico modo
       per sapere quanto è costato davvero un cantiere: <strong>materiale, ore, e i mezzi</strong>.`,
      `Molte imprese il costo dei mezzi non lo mettono mai dentro. Poi il lavoro sembra andato bene, e a
       fine anno i conti non tornano.`
    ]},
  ],

  faq: [
    { d:'Mi avvisa prima che scada la revisione?',
      r:`Sì. Ogni mezzo ha le date di revisione, bollo, assicurazione e tagliando, e le scadenze vicine
         vengono segnalate prima, non dopo. Quelle in avvicinamento si vedono in ambra e quelle passate in
         rosso.` },
    { d:'Posso registrare anche le attrezzature, non solo i furgoni?',
      r:`Sì. Betoniere, ponteggi, martelli, gruppi elettrogeni: tutto quello che ha una scheda, una
         manutenzione o un costo può stare lì dentro.` },
    { d:'Tiene il conto del carburante?',
      r:`Sì, ogni rifornimento con litri e importo, e il consumo per mezzo. Da lì si capisce quale mezzo
         costa più degli altri.` },
    { d:'Gestisce le carte carburante prepagate?',
      r:`Sì. Ogni carta ha i suoi movimenti e il suo saldo, così sai in ogni momento quanto resta e quanto
         è stato speso.` },
    { d:'Il costo del mezzo entra nel conto del cantiere?',
      r:`Sì, se colleghi il mezzo al lavoro. È l'unico modo per sapere quanto è costato davvero un cantiere,
         mettendo insieme materiale, ore e mezzi.` },
  ]
},

/* ---------------------------------------------------------------- */
{
  famiglia: 'problema',
  slug: 'software-gestione-ore-operai',
  link: 'Gestione ore degli operai',
  riga: 'ore per persona e per cantiere, timbrature e il costo vero del lavoro',
  briciola: 'Gestione ore degli operai',
  title: 'Software gestione ore operai per imprese edili',
  desc: 'Software per contare le ore degli operai: ore per persona e per cantiere, timbrature e il costo vero del lavoro. 3 mesi gratis.',
  h1: 'Gestione ore degli operai: sapere quanto è costato il lavoro, non quanto sembrava',
  minuti: 5,
  nomeApp: 'Gestione ore TrovaImpresa',
  cosaCosta: 'La gestione delle ore',
  funzioni: ['Ore lavorate per persona e per cantiere', 'Timbratura di entrata e uscita',
    'Rapportino giornaliero con le ore', 'Riepilogo mensile per le buste paga',
    'Ore che entrano nel costo del lavoro', 'Confronto fra ore preventivate e ore fatte'],
  ctaTitolo: 'Prova per un mese e guarda il conto',
  ctaTesto: 'Registra le ore di un mese e poi guarda un cantiere chiuso: preventivato, meno materiale, meno ore. Quel numero è il tuo guadagno vero.',
  sommario: `un programma per contare le <strong>ore degli operai</strong>: per persona e per cantiere,
    con le timbrature e il rapportino dal telefono. Le ore poi entrano nel
    <strong>costo vero del lavoro</strong>.
    <span class="price-big">3 mesi in regalo, poi 249 € l'anno</span>`,

  sezioni: [
    { blocchi: [
      { t:'lead', x:`Quasi tutte le imprese sanno quanto hanno incassato da un lavoro. Molte meno sanno
        quanto gli è costato. E la differenza fra le due cose è il mestiere.` },
      `Il materiale si conta facile: c'è la bolla. Le ore no: le ore sono la voce di costo più grande e
       l'unica che nessuno scrive da nessuna parte.`
    ]},

    { h2: 'Tre modi di registrare, secondo come lavori', blocchi: [
      { t:'tab', testa:['Come','Quando conviene'], righe:[
        ['<strong>Rapportino giornaliero</strong>', "Il capo squadra scrive chi c'era e quante ore, dal telefono, a fine giornata. È il modo più veloce."],
        ['<strong>Timbratura</strong>', "Entrata e uscita registrate all'orario vero. Serve quando l'orario preciso conta."],
        ['<strong>Ore scritte a mano</strong>', 'Tu inserisci le ore per lavoro e per persona, magari una volta a settimana.'],
      ]},
      `Non c'è un modo giusto: c'è quello che la tua squadra fa davvero. Un sistema perfetto che nessuno
       compila vale zero.`
    ]},

    { h2: 'Le due somme che servono', blocchi: [
      { t:'ok', righe:[
        `<strong>Ore per persona</strong>, sommate per mese. Servono per la busta paga e per il commercialista, e finiscono le discussioni di fine mese.`,
        `<strong>Ore per cantiere</strong>, sommate per lavoro. Servono per sapere se quel lavoro ti ha reso.`,
      ]},
      `Sono due domande diverse e servono a due persone diverse: la prima al commercialista, la seconda a
       te. Ma escono dallo stesso dato scritto una volta sola.`
    ]},

    { h2: 'Il conto che quasi nessuno fa', blocchi: [
      { t:'fig', tel:true, src:'/img/gestionale-telefono.webp', w:780, h:1688,
        alt:'Le ore della giornata registrate dal telefono a fine lavoro',
        cap:'Le ore si registrano dal telefono, non si ricostruiscono la sera.' },
      { t:'espe', x:`Preventivato, meno materiale, meno ore. Quello che resta è il guadagno vero di quel
        cantiere. È un conto di tre righe, e la maggior parte delle imprese non lo fa mai su nessun lavoro.` },
      `Quando cominci a farlo, dopo tre o quattro cantieri esce sempre la stessa cosa: <strong>c'è un tipo
       di lavoro che non ti rende</strong>, e lo stavi facendo da anni convinto del contrario. Di solito è
       quello dove le ore sfuggono — i lavori piccoli, le chiamate, i ritocchi.`,
      `Non vuol dire smettere di farli. Vuol dire farli al prezzo giusto.`
    ]},

    { h2: 'Ore preventivate e ore fatte', blocchi: [
      `Se hai fatto l'analisi prezzi, in preventivo hai già scritto quante ore ci vogliono. Quando il
       cantiere è finito, confronti quelle con le ore vere.`,
      `Da quel confronto viene fuori il numero più utile che un'impresa possa avere:
       <strong>di quanto sbagli quando fai un preventivo</strong>. Se sbagli sempre del 20% in meno,
       il prossimo preventivo lo fai con quel 20% dentro, e smetti di lavorare in perdita per abitudine.`
    ]},
  ],

  faq: [
    { d:'Come si registrano le ore degli operai?',
      r:`In tre modi, secondo come lavori: col rapportino giornaliero compilato dal telefono, con la
         timbratura di entrata e uscita, oppure scrivendo le ore a mano per lavoro e per persona.` },
    { d:"C'è la timbratura di entrata e uscita?",
      r:`Sì, quando serve l'orario preciso invece del totale della giornata. Resta registrato con il suo
         orario.` },
    { d:'Le ore si vedono sommate per mese?',
      r:`Sì, per persona e per mese, che è quello che serve per le buste paga, e per cantiere, che è quello
         che serve per capire se il lavoro è andato bene.` },
    { d:'Gli operai possono registrare le ore da soli?',
      r:`Sì. Ogni collaboratore ha il suo accesso e vede solo i propri lavori e la propria agenda, senza
         girare per il resto del gestionale.` },
    { d:'Le ore entrano nel costo del lavoro?',
      r:`Sì. Insieme al materiale e ai mezzi formano il costo vero del cantiere, che il programma confronta
         con quello che avevi preventivato.` },
  ]
},

];
