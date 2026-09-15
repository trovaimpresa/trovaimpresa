/* FAMIGLIA 2 — IL MESTIERE
   Una pagina per ogni mestiere. Chi cerca «gestionale per idraulici»
   non vuole un gestionale generico: vuole vedere che qualcuno ha capito
   com'e' fatta la sua giornata.

   ⛔ IL RISCHIO PAGINE GEMELLE: se il testo fosse uguale e cambiasse solo
      il nome del mestiere, Google le tratterebbe come copie. Per questo
      OGNI voce qui sotto porta roba sua e diversa:
        - `dolori`   i problemi veri di quel mestiere (4, tutti diversi)
        - `tabella`  cosa cambia nel gestionale per lui (4 righe sue)
        - `norma`    l'adempimento che riguarda solo lui
        - `chiusura` il paragrafo finale, scritto per lui
        - `faq`      2 domande sue + 2 comuni riscritte con le sue parole
      Il pezzo in comune e' meno di un quarto della pagina.
*/

/* Parole diverse fra artigiano e tecnico: un artigiano fa un PREVENTIVO
   al cliente, un tecnico accetta un INCARICO e chiede un ONORARIO.
   È la stessa distinzione che il sito usa gia' nelle pagine mestiere. */
const P = {
  art: { doc:'preventivo', docPl:'preventivi', ilDoc:'Il preventivo', unDoc:'un preventivo',
         chi:'cliente', chiPl:'clienti', lavoro:'lavoro', lavori:'lavori', soldi:'prezzo' },
  tec: { doc:'incarico', docPl:'incarichi', ilDoc:"L'incarico", unDoc:'un incarico',
         chi:'committente', chiPl:'committenti', lavoro:'pratica', lavori:'pratiche', soldi:'onorario' },
};

const MESTIERI = [
/* ---------------- ARTIGIANI ---------------- */
{
  slug:'gestionale-idraulici', ruolo:'art',
  nome:'idraulici', nomeSing:'idraulico', articolo:"un idraulico",
    foto1:{ src:'/img/gestionale-telefono.webp', w:780, h:1688, tel:true,
    alt:"Il gestionale per idraulici aperto sul telefono, durante un intervento",
    cap:"Lo stesso gestionale sul telefono, fra un intervento e l'altro. Niente da installare." },
  link:'Gestionale per idraulici',
  riga:'interventi urgenti, ricambi e il preventivo fatto in macchina',
  title:'Gestionale per idraulici: preventivi, interventi e fatture',
  desc: 'Gestionale per idraulici: interventi urgenti, preventivi fatti in macchina, ricambi e manutenzioni che tornano ogni anno. 30 giorni gratis.',
  h1:'Gestionale per idraulici: dieci interventi al giorno e la sera non ti ricordi niente',
  apertura:`La giornata di un idraulico non è fatta di cantieri: è fatta di <strong>chiamate</strong>.
    Dieci fermate, tre urgenze, due preventivi promessi e un ricambio che manca. La sera, a casa, provi a
    ricordarti a chi devi fatturare cosa — e qualcosa lo perdi sempre.`,
  dolori:[
    `<strong>L'intervento non fatturato.</strong> Sei andato, hai risolto in venti minuti, non hai lasciato niente di scritto. Quei venti minuti non li vedrai mai.`,
    `<strong>Il preventivo promesso al telefono.</strong> «Le mando due righe stasera». Stasera arriva, e le due righe no.`,
    `<strong>Il ricambio comprato e mai riaddebitato.</strong> La bolla resta in furgone, e in fattura ci finisce solo la manodopera.`,
    `<strong>La manutenzione che scade.</strong> La caldaia che hai messo due anni fa va revisionata, ma nessuno se lo ricorda — e il cliente la fa fare a un altro.`,
  ],
  tabella:{ testa:['Com\'è la tua giornata','Cosa fa il gestionale'], righe:[
    ['Interventi corti e tanti', 'Il lavoro si apre dal telefono in trenta secondi, con cliente, indirizzo e due righe di descrizione'],
    ['Il preventivo va fatto subito', 'Lo chiudi in macchina appena uscito e il PDF parte da lì, prima che il cliente senta un altro'],
    ['I ricambi vanno riaddebitati', 'Le spese si attaccano al lavoro con fornitore e importo, e in fattura ci finiscono davvero'],
    ['Le manutenzioni tornano ogni anno', 'Lo scadenzario ti avvisa prima, e la chiamata la fai tu invece di aspettarla'],
  ]},
  norma:`Sugli impianti a gas la <strong>dichiarazione di conformità</strong> prevista dal DM 37/08 va
    rilasciata al cliente e conservata. Il gestionale non la compila al posto tuo, ma tiene i documenti
    attaccati al lavoro e al cliente giusto, così quando fra tre anni te la richiedono la ritrovi in dieci
    secondi invece che in due ore.`,
  chiusura:`Per un idraulico la differenza non la fa la funzione più grande: la fa la velocità. Se aprire
    un intervento costa più di trenta secondi, alla terza chiamata smetti di farlo — e sei tornato al
    punto di prima. Per questo qui la schermata dell'intervento è corta, e i pulsanti sono grandi
    abbastanza da premerli con le mani sporche.`,
  faq:[
    { d:"Posso registrare un intervento veloce senza fare un preventivo?",
      r:`Sì. Apri il lavoro con cliente, indirizzo e due righe, e lo chiudi. Il preventivo serve quando il
         cliente lo chiede: per la chiamata di venti minuti basta il lavoro, che poi diventa fattura.` },
    { d:"Tiene traccia dei ricambi che compro?",
      r:`Sì, le spese si attaccano al lavoro con fornitore e importo. Così quando fai la fattura il
         materiale c'è, invece di restare nella bolla in furgone.` },
  ],
},
{
  slug:'gestionale-elettricisti', ruolo:'art',
  nome:'elettricisti', nomeSing:'elettricista', articolo:'un elettricista',
    foto1:{ src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
    alt:"Preventivi per impianti elettrici con punti luce, prese e quadro, numerati e con lo stato",
    cap:"I preventivi numerati, con lo stato e l'importo IVA compresa." },
  link:'Gestionale per elettricisti',
  riga:'punti luce a preventivo, dichiarazioni di conformità e materiale',
  title:'Gestionale per elettricisti: preventivi, impianti e fatture',
  desc: 'Gestionale per elettricisti: preventivi a punto luce, materiale riaddebitato, documenti di conformita\' sempre ritrovabili. 30 giorni gratis.',
  h1:'Gestionale per elettricisti: il preventivo a punti luce e il materiale che non si perde',
  apertura:`Un impianto elettrico si preventiva a punti: punti luce, prese, punti comandati, quadro.
    Sembra semplice, e poi il conto vero lo fa il materiale — che cambia prezzo ogni sei mesi e che
    quasi nessuno riaddebita per intero.`,
  dolori:[
    `<strong>Il preventivo a memoria.</strong> «Un punto luce lo faccio a X». Ma X era il prezzo di due anni fa, e il cavo nel frattempo è aumentato.`,
    `<strong>Il materiale sottostimato.</strong> Il preventivo copre la manodopera e metà del materiale. L'altra metà te la paghi tu.`,
    `<strong>La variante a voce.</strong> «Già che ci sei mettimi una presa qui». Cinque prese dopo, nessuno le ha scritte da nessuna parte.`,
    `<strong>La dichiarazione di conformità introvabile.</strong> Il cliente vende casa e te la richiede tre anni dopo. Tu non sai nemmeno in che cartella è finita.`,
  ],
  tabella:{ testa:['Com\'è il tuo lavoro','Cosa fa il gestionale'], righe:[
    ['Si preventiva a punti e a quantità', 'Voci con quantità e prezzo unitario, e il tuo prezzario che si riempie dai lavori fatti'],
    ['Il materiale pesa più della manodopera', "L'analisi prezzi divide materiale, ore e attrezzatura, così vedi quanto pesa davvero ognuno"],
    ['Le varianti nascono a voce', 'Le aggiungi al lavoro il giorno stesso dal telefono, e a fine cantiere sono in fattura'],
    ['I documenti servono anni dopo', 'Restano attaccati al lavoro e al cliente, ritrovabili per nome'],
  ]},
  norma:`La <strong>dichiarazione di conformità</strong> del DM 37/08 con i suoi allegati è il documento
    che ti torna indietro anni dopo, di solito quando il cliente vende casa o chiede un bonus. Qui i
    documenti restano attaccati al lavoro e al cliente: si ritrovano cercando il nome, non frugando in
    dieci cartelle.`,
  chiusura:`Il punto debole di un elettricista non è preventivare: è tenere il passo delle varianti.
    Un impianto cambia mentre lo fai, e ogni cambiamento non scritto è denaro tuo. Se le varianti le
    aggiungi dal telefono il giorno che succedono, a fine cantiere la fattura è quella giusta — senza la
    conversazione imbarazzante con il cliente su cosa era compreso e cosa no.`,
  faq:[
    { d:'Posso preventivare a punto luce?',
      r:`Sì. Ogni voce ha descrizione, quantità, unità di misura e prezzo unitario, quindi il punto luce è
         una voce come un'altra. I prezzi che usi restano nel tuo prezzario per il preventivo dopo.` },
    { d:'Dove finiscono le dichiarazioni di conformità?',
      r:`Restano attaccate al lavoro e al cliente, insieme alle foto e agli altri documenti. Quando il
         cliente te le richiede anni dopo, le cerchi per nome invece che per cartella.` },
  ],
},
{
  slug:'gestionale-imbianchini', ruolo:'art',
  nome:'imbianchini', nomeSing:'imbianchino', articolo:'un imbianchino',
    foto1:{ src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
    alt:"Preventivi di tinteggiatura al metro quadro, con raschiatura e rasatura come voci separate",
    cap:"Le voci separate: il cliente vede cosa comprende il prezzo." },
  link:'Gestionale per imbianchini',
  riga:'preventivi al metro quadro, mani di pittura e lavori corti',
  title:'Gestionale per imbianchini: preventivi al mq e fatture',
  desc: 'Gestionale per imbianchini: preventivi al metro quadro, raschiatura e rasatura a voce separata, lavori corti e fatture. 30 giorni gratis.',
  h1:'Gestionale per imbianchini: il preventivo al metro quadro fatto sul posto',
  apertura:`Chi imbianca lavora al metro quadro, e il metro quadro è un prezzo che sembra semplice finché
    non ci metti dentro la raschiatura, il fissativo, la rasatura, le mani di pittura e i mobili da
    spostare. Poi scopri che il lavoro «da mille euro» te ne è costato milleduecento.`,
  dolori:[
    `<strong>Il prezzo tondo detto al volo.</strong> «Per questa stanza facciamo trecento euro». Detto sul posto, senza misurare, e senza sapere quante mani servono.`,
    `<strong>La preparazione regalata.</strong> Raschiare, stuccare e rasare sono ore vere che quasi mai finiscono nel preventivo scritto.`,
    `<strong>I lavori piccoli che si accumulano.</strong> Dieci lavori da un giorno e nessuno che sappia dire quale è stato pagato.`,
    `<strong>La seconda mano contestata.</strong> «Ma non erano comprese due mani?». Se non c'è scritto, la fai gratis.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['Si preventiva a metro quadro', 'Le voci hanno quantità e unità di misura: mq di idropittura, ml di battiscopa, e il totale viene da lì'],
    ['La preparazione è mezzo lavoro', 'Raschiatura, rasatura e fissativo sono voci a sé, scritte e pagate come tali'],
    ['Tanti lavori corti', "Ogni lavoro ha il suo stato, e il filtro ti dice subito quali sono finiti e non fatturati"],
    ['Le mani vanno scritte', 'La descrizione della voce dice quante mani sono comprese, e il PDF lo tiene nero su bianco'],
  ]},
  norma:`Sulle manutenzioni e sui recuperi edilizi delle abitazioni l'IVA è agevolata al
    <strong>10%</strong>, non al 22%. Per chi imbianca è la regola di ogni giorno, e il programma la fa
    scegliere riga per riga — perché nello stesso lavoro può capitare anche il 22%.`,
  chiusura:`Il preventivo scritto, con le voci separate, non serve a essere formali: serve a non
    discutere. Quando è scritto che le mani sono due e che la rasatura è una voce a parte, la conversazione
    non c'è. E se il cliente ne vuole una terza, quella è una variante — cioè un altro pezzo di lavoro,
    non un favore.`,
  faq:[
    { d:'Posso fare preventivi al metro quadro?',
      r:`Sì. Ogni voce ha quantità, unità di misura e prezzo unitario, quindi il metro quadro di idropittura
         o il metro lineare di battiscopa sono voci normali, e il totale si calcola da solo.` },
    { d:'Va bene anche per lavori di un giorno solo?',
      r:`Sì, ed è il caso più frequente. Il lavoro si apre in trenta secondi dal telefono e si chiude
         quando hai finito. Il filtro sui lavori finiti e non fatturati serve proprio a quello.` },
  ],
},
{
  slug:'gestionale-piastrellisti', ruolo:'art',
  nome:'piastrellisti', nomeSing:'piastrellista', articolo:'un piastrellista',
    foto1:{ src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
    alt:"Preventivi di posa piastrelle con una voce per formato e il prezzo al metro quadro",
    cap:"Una voce per formato: si capisce perché il bagno costa più della cucina." },
  link:'Gestionale per piastrellisti',
  riga:'metri quadri, sfrido, formati diversi e la posa che cambia prezzo',
  title:'Gestionale per piastrellisti: preventivi al mq e sfrido',
  desc: 'Gestionale per piastrellisti: preventivi al mq per formato, sfrido, demolizione e posa diagonale come voci separate. 30 giorni gratis.',
  h1:'Gestionale per piastrellisti: il formato cambia il prezzo, e il preventivo deve dirlo',
  apertura:`Posare gres 30x30 e posare un 120x120 sono due mestieri diversi, e chi non è del ramo pensa
    che sia la stessa cosa. Il prezzo al metro quadro cambia col formato, con la posa, con lo stato del
    fondo — e se il preventivo non lo spiega, il cliente sceglie il numero più basso che ha ricevuto.`,
  dolori:[
    `<strong>Il prezzo unico al mq.</strong> Un solo numero per tutta la casa, e poi il bagno col mosaico ti mangia due giorni.`,
    `<strong>Lo sfrido non calcolato.</strong> Compri il materiale sui metri netti, e con la posa diagonale ne resti corto.`,
    `<strong>La demolizione data per scontata.</strong> Togliere il vecchio pavimento e portarlo via è mezza giornata e un cassone: se non è scritto, è gratis.`,
    `<strong>Il fondo che non è a livello.</strong> Lo scopri il giorno che parti, quando il preventivo è già firmato.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['Il prezzo cambia col formato', 'Una voce per formato, con il suo prezzo al mq: il cliente vede perché il bagno costa più della cucina'],
    ['Lo sfrido va previsto', "L'analisi prezzi mette il materiale con la sua quantità reale, sfrido compreso"],
    ['Demolizione e smaltimento sono lavoro', 'Voci a sé con il loro prezzo, non righe regalate in fondo'],
    ['Le misure vanno prese bene', 'Il computo tiene le misure riga per riga: se una quota cambia, i metri si riaggiornano da soli'],
  ]},
  norma:`Sulle manutenzioni delle abitazioni l'IVA è al <strong>10%</strong>, ma attenzione ai
    <strong>beni significativi</strong>: quando il valore del materiale supera quello della manodopera, la
    parte eccedente va al 22%. È il motivo per cui l'IVA qui si sceglie riga per riga, e non una sola per
    tutta la fattura.`,
  chiusura:`Il preventivo dettagliato è la difesa migliore che un piastrellista abbia. Non perché il
    cliente sia in malafede, ma perché non può sapere che la posa a 45 gradi costa di più. Se glielo
    scrivi, il confronto non è più «tu 4.000 e l'altro 3.200»: è fra due lavori diversi. E quella è
    l'unica gara che puoi vincere.`,
  faq:[
    { d:'Posso mettere prezzi diversi per formati diversi?',
      r:`Sì, ogni formato è una voce con il suo prezzo al metro quadro. Nel PDF il cliente vede il dettaglio
         e capisce perché una stanza costa più di un'altra.` },
    { d:"Come gestisco l'IVA sui beni significativi?",
      r:`L'IVA si sceglie riga per riga: la manodopera e la parte agevolata al 10%, la parte di materiale
         che supera il limite al 22%. Nella stessa fattura possono convivere.` },
  ],
},
{
  slug:'gestionale-cartongessisti', ruolo:'art',
  nome:'cartongessisti', nomeSing:'cartongessista', articolo:'un cartongessista',
    foto1:{ src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
    alt:"Preventivi di pareti e controsoffitti in cartongesso, con struttura e lastre a voci separate",
    cap:"Le voci per strato: quotare una variante diventa una domanda da dieci secondi." },
  link:'Gestionale per cartongessisti',
  riga:'pareti e controsoffitti a mq, strutture, lastre e finitura',
  title:'Gestionale per cartongessisti: preventivi a mq e materiali',
  desc: 'Gestionale per cartongessisti: pareti e controsoffitti al mq, struttura e lastre come voci separate, varianti in corso. 30 giorni gratis.',
  h1:'Gestionale per cartongessisti: la parete non è un metro quadro, sono quattro voci',
  apertura:`Una parete in cartongesso sembra una superficie e invece è una somma: la struttura metallica,
    le lastre da una parte, le lastre dall'altra, l'isolante dentro, la stuccatura sopra. Chi la
    preventiva con un prezzo solo al metro quadro prima o poi ci rimette, perché le varianti si nascondono
    tutte lì dentro.`,
  dolori:[
    `<strong>La lastra speciale non conteggiata.</strong> Idrofuga in bagno, ignifuga nel vano tecnico: costano il doppio e nel preventivo era scritto «lastra».`,
    `<strong>L'orditura più fitta.</strong> Il cliente vuole appenderci il televisore, e la struttura raddoppia. A voce.`,
    `<strong>Il controsoffitto con le faretti.</strong> I fori li fai tu, e non sono mai nel prezzo al metro quadro.`,
    `<strong>La stuccatura infinita.</strong> Il livello di finitura non è scritto da nessuna parte, e il cliente pretende sempre quello più alto.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['La parete è fatta di strati', "Una voce per strato: struttura, lastre, isolante, finitura. Il cliente vede da cosa nasce il prezzo"],
    ['I materiali speciali costano il doppio', 'Voci diverse per lastra normale, idrofuga e ignifuga, ognuna col suo prezzo'],
    ['Le varianti arrivano in corso', 'Le aggiungi al lavoro il giorno stesso dal telefono, e a fine cantiere sono in fattura'],
    ['Il livello di finitura va scritto', 'La descrizione della voce lo dice, e il PDF lo tiene nero su bianco'],
  ]},
  norma:`Il cartongesso rientra quasi sempre nelle <strong>manutenzioni</strong>, quindi IVA al
    <strong>10%</strong>. Quando invece lavori in subappalto per un'impresa, può entrare in gioco il
    <strong>reverse charge</strong> fra imprese edili: la fattura si emette senza IVA con la dicitura
    prevista. Qui l'aliquota si sceglie riga per riga e la dicitura si scrive nel documento.`,
  chiusura:`Il vantaggio di preventivare a strati non è la precisione fine a se stessa. È che quando il
    cliente chiede una variante, tu hai già il prezzo di quello strato e rispondi in dieci secondi con un
    numero credibile. Chi ha un prezzo solo al metro quadro deve inventarselo lì per lì, e di solito
    sbaglia per difetto.`,
  faq:[
    { d:'Posso separare struttura, lastre e finitura?',
      r:`Sì, ognuna è una voce con la sua quantità e il suo prezzo. È il modo più semplice per far capire
         al cliente da cosa nasce il totale, e per quotare una variante senza rifare i conti.` },
    { d:'Gestisce il reverse charge quando lavoro in subappalto?',
      r:`L'aliquota si sceglie riga per riga e la dicitura di legge si scrive nel documento. Su come
         applicarlo nel tuo caso, la parola definitiva resta del commercialista.` },
  ],
},
{
  slug:'gestionale-serramentisti', ruolo:'art',
  nome:'serramentisti', nomeSing:'serramentista', articolo:'un serramentista',
    foto1:{ src:'/img/gestionale-fatture.webp', w:1440, h:1265,
    alt:"Fatture di serramenti con acconto, saldo e residuo da incassare",
    cap:"Le fatture, con quanto c'è ancora da incassare in cima." },
  link:'Gestionale per serramentisti',
  riga:'misure, acconti, ordini al fornitore e la posa mesi dopo',
  title:'Gestionale per serramentisti: preventivi, acconti e posa',
  desc: 'Gestionale per serramentisti: preventivo pezzo per pezzo, acconto alla firma, ordine al fornitore e posa mesi dopo. 30 giorni gratis.',
  h1:'Gestionale per serramentisti: fra la firma e la posa passano due mesi, e in mezzo va tenuto il filo',
  apertura:`Il lavoro del serramentista ha una forma che nessun altro mestiere edile ha: firmi a marzo,
    ordini ad aprile, posi a giugno. In mezzo ci sono un acconto incassato, un fornitore da pagare, una
    consegna da rincorrere e un cliente che chiama per sapere a che punto siamo.`,
  dolori:[
    `<strong>L'acconto perso di vista.</strong> Incassato alla firma, e due mesi dopo non ricordi se quel cliente aveva versato il 30% o il 50%.`,
    `<strong>L'ordine mai fatto.</strong> Il preventivo è firmato, ma l'ordine al fornitore è rimasto nella pila. Te ne accorgi quando il cliente chiama.`,
    `<strong>La misura sbagliata.</strong> Il rilievo l'hai fatto su un foglio, il foglio è in furgone, e l'infisso arriva di due centimetri più stretto.`,
    `<strong>Il saldo dimenticato.</strong> Posato tutto, cliente contento, e il saldo resta lì per mesi perché nessuno lo ha messo in nota.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['Preventivo pezzo per pezzo', 'Una voce per serramento, con misura, materiale e prezzo: PVC, alluminio e legno hanno prezzi diversi'],
    ['Acconto alla firma e saldo alla posa', 'I pagamenti si registrano sul lavoro, e il residuo da incassare si vede sempre'],
    ['Il fornitore va ordinato e pagato', 'Fornitori e loro fatture stanno dentro, collegati al lavoro giusto'],
    ['Fra firma e posa passano mesi', 'Lo scadenzario tiene le date: ordine, consegna prevista, posa'],
  ]},
  norma:`Sulla sostituzione di infissi si applica quasi sempre l'IVA al <strong>10%</strong>, ma gli
    infissi sono <strong>beni significativi</strong>: la parte di valore del bene che supera quello della
    manodopera va al 22%. È il calcolo che i programmi generici sbagliano più spesso, e il motivo per cui
    qui l'aliquota si sceglie riga per riga.`,
  chiusura:`Per un serramentista il gestionale non serve tanto a fare il preventivo — quello lo fai bene
    già adesso. Serve a tenere il filo nei due mesi in mezzo, dove il lavoro non è finito, i soldi sono
    metà dentro e metà fuori, e la memoria da sola non basta più quando i lavori aperti diventano dieci.`,
  faq:[
    { d:'Posso registrare acconto e saldo separati?',
      r:`Sì. I pagamenti si registrano sul lavoro man mano che arrivano, e il residuo da incassare si vede
         sempre, insieme al totale di tutto quello che devi ancora ricevere.` },
    { d:'Tiene traccia degli ordini ai fornitori?',
      r:`Sì. Fornitori e loro fatture stanno dentro il gestionale e si collegano al lavoro, così sai cosa
         hai ordinato per quale cliente e cosa hai già pagato.` },
  ],
},
{
  slug:'gestionale-termoidraulici', ruolo:'art',
  nome:'termoidraulici', nomeSing:'termoidraulico', articolo:'un termoidraulico',
    foto1:{ src:'/img/gestionale-lavori.webp', w:1440, h:971,
    alt:"Elenco degli interventi su impianti termici, con stato e scadenze delle manutenzioni",
    cap:"I lavori del reparto, con il totale in alto e il filtro «da incassare»." },
  link:'Gestionale per termoidraulici',
  riga:'caldaie, libretti, manutenzioni annuali e interventi in garanzia',
  title:'Gestionale per termoidraulici: impianti e manutenzioni',
  desc: 'Gestionale per termoidraulici: installazioni, manutenzioni annuali che tornano nello scadenzario e interventi in garanzia. 30 giorni gratis.',
  h1:'Gestionale per termoidraulici: la manutenzione dell\'anno prossimo vale quanto il lavoro di oggi',
  apertura:`Chi installa caldaie e condizionatori ha una cosa che gli altri mestieri edili non hanno:
    <strong>il cliente torna</strong>. Ogni impianto messo è una manutenzione l'anno prossimo e per i
    dieci anni dopo. Il problema è che quasi nessuno tiene quell'elenco, e il ritorno se lo prende chi
    chiama per primo.`,
  dolori:[
    `<strong>Il parco installato che non esiste su carta.</strong> Hai messo trecento caldaie in dieci anni e non hai un elenco di dove sono.`,
    `<strong>La revisione annuale persa.</strong> Nessuno chiama il cliente, e il cliente chiama il primo numero che trova.`,
    `<strong>L'intervento in garanzia confuso col lavoro nuovo.</strong> Ci vai, non fatturi, e non resta traccia nemmeno del fatto che ci sei andato.`,
    `<strong>Il libretto d'impianto.</strong> Va tenuto aggiornato, e quando l'ente lo chiede parte la caccia al foglio.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ["L'impianto resta lì per anni", 'Il cliente tiene lo storico dei suoi lavori: sai cosa gli hai messo e quando'],
    ['La manutenzione torna ogni anno', "Lo scadenzario ti avvisa prima, e chiami tu invece di aspettare"],
    ['Le garanzie vanno distinte', 'Il lavoro ha il suo stato e il suo importo: un intervento a zero resta registrato lo stesso'],
    ['I documenti servono anni dopo', 'Libretti e conformità restano attaccati al lavoro e al cliente'],
  ]},
  norma:`Per gli impianti termici c'è il <strong>libretto di impianto</strong> e ci sono i controlli di
    efficienza energetica con le loro periodicità. Chi tratta gas refrigeranti ha in più gli obblighi
    <strong>F-gas</strong>. Il gestionale non compila i registri al posto tuo: tiene i documenti attaccati
    all'impianto giusto, così le date e le carte si ritrovano.`,
  chiusura:`Se dovessi indicare una cosa sola che per un termoidraulico vale l'abbonamento, è lo
    scadenzario delle manutenzioni. Un parco di trecento impianti con la revisione tracciata è un
    fatturato che si ripete ogni anno senza cercare un cliente nuovo. Lo stesso parco senza elenco è
    trecento clienti che, prima o poi, chiamano un altro.`,
  faq:[
    { d:'Posso tenere lo storico degli impianti che ho installato?',
      r:`Sì. Ogni cliente tiene i suoi lavori, quindi vedi cosa gli hai installato e quando, con i documenti
         attaccati.` },
    { d:'Mi avvisa delle manutenzioni annuali?',
      r:`Sì, con lo scadenzario: metti la data della prossima revisione e il gestionale te la segnala prima
         che arrivi.` },
  ],
},
{
  slug:'gestionale-rifacimento-tetti', ruolo:'art',
  nome:'imprese di rifacimento tetti', nomeSing:'chi rifà i tetti', articolo:"un'impresa di tetti",
    foto1:{ src:'/img/gestionale-lavori.webp', w:1440, h:971,
    alt:"Elenco dei cantieri di rifacimento tetti, con stato in corso, da fare e fatto",
    cap:"I cantieri aperti, con il totale in alto e i lavori in ritardo in evidenza." },
  link:'Gestionale per il rifacimento tetti',
  riga:'ponteggi, sicurezza, meteo e lavori che valgono decine di migliaia',
  title:'Gestionale per imprese di rifacimento tetti e coperture',
  desc: 'Gestionale per chi rifa\' tetti: preventivi al mq di falda, ponteggio e sicurezza come voci vere, varianti quotate subito. 30 giorni gratis.',
  h1:'Gestionale per il rifacimento tetti: il ponteggio è mezzo preventivo',
  apertura:`Il rifacimento di un tetto è uno dei lavori più cari che un privato commissiona nella vita, e
    uno dei più difficili da preventivare: la falda si misura in pendenza, il ponteggio costa quanto il
    lavoro, la sicurezza non è una voce facoltativa, e la pioggia sposta tutto di una settimana.`,
  dolori:[
    `<strong>Il ponteggio sottostimato.</strong> Montaggio, nolo mensile e smontaggio: se il cantiere slitta di un mese, quel nolo lo paghi tu.`,
    `<strong>La misura in pianta invece che in falda.</strong> La pendenza aggiunge metri quadri veri, e chi misura sulla pianta li perde tutti.`,
    `<strong>Le sorprese sotto le tegole.</strong> Il tavolato marcio si vede quando hai già scoperto il tetto, e il preventivo era chiuso.`,
    `<strong>La pioggia.</strong> Tre giorni di maltempo e la squadra è ferma, ma il ponteggio continua a costare.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['Il ponteggio ha tre costi', 'Montaggio, nolo e smontaggio come voci separate: il cliente capisce perché il nolo cresce se il cantiere si allunga'],
    ['La falda si misura in pendenza', 'Le misure stanno riga per riga nel computo, con le tre dimensioni: la quantità esce dalle misure vere'],
    ['Le sorprese vanno quotate subito', 'La variante si apre dal telefono con la foto, il giorno che si scopre il problema'],
    ['I lavori valgono molto', 'Sui cantieri lunghi ci sono gli stati di avanzamento: incassi mentre lavori, non solo alla fine'],
  ]},
  norma:`Sui tetti la <strong>sicurezza</strong> non è una voce da togliere per fare il prezzo: linee vita,
    parapetti e il piano di montaggio del ponteggio (PiMUS) sono obblighi, e con più imprese in cantiere
    entra in gioco il coordinatore previsto dal D.Lgs 81. Metterli in preventivo come voci esplicite è
    anche il modo più onesto di spiegare al cliente perché un'offerta più bassa è più bassa.`,
  chiusura:`Su un tetto la variante non è un'eventualità: è la regola. Sotto le tegole si trova sempre
    qualcosa. La differenza fra un cantiere che rende e uno che va in perdita è tutta nel momento in cui
    la variante viene quotata: se la scrivi il giorno che la scopri, con la foto, il cliente la accetta.
    Se la tiri fuori a lavoro finito, diventa una discussione.`,
  faq:[
    { d:'Posso mettere il ponteggio come voce separata?',
      r:`Sì, e conviene dividerlo in montaggio, nolo per il periodo e smontaggio. Così se il cantiere si
         allunga, il maggior costo del nolo è spiegato prima e non contestato dopo.` },
    { d:'Come gestisco le varianti che escono scoprendo il tetto?',
      r:`Le apri sul lavoro dal telefono, il giorno stesso, con la foto di quello che hai trovato. A fine
         cantiere sono già dentro il conto e in fattura.` },
  ],
},
{
  slug:'gestionale-installatori-fotovoltaico', ruolo:'art',
  nome:'installatori di fotovoltaico', nomeSing:'chi installa fotovoltaico', articolo:"un installatore di fotovoltaico",
    foto1:{ src:'/img/gestionale-lavori.webp', w:1440, h:971,
    alt:"Elenco degli impianti fotovoltaici in lavorazione, con lo stato di ogni pratica",
    cap:"Gli impianti in corso, con lo stato di ognuno a colpo d'occhio." },
  link:'Gestionale per il fotovoltaico',
  riga:'pratiche, tempi lunghi, acconti e impianti da seguire negli anni',
  title:'Gestionale per installatori di impianti fotovoltaici',
  desc: 'Gestionale per installatori di fotovoltaico: preventivi per componenti, pratiche e tempi lunghi nello scadenzario, acconti. 30 giorni gratis.',
  h1:'Gestionale per il fotovoltaico: l\'impianto si monta in due giorni, la pratica dura tre mesi',
  apertura:`Nel fotovoltaico il montaggio è la parte corta. La parte lunga sono le pratiche: la richiesta
    di connessione, il gestore di rete, la fine lavori, l'attivazione. Mesi in cui il cliente ha pagato
    un acconto, tu hai pagato i moduli, e nessuno dei due sa esattamente a che punto è.`,
  dolori:[
    `<strong>La pratica ferma e nessuno se ne accorge.</strong> Manca un documento da tre settimane e il fascicolo è fermo lì.`,
    `<strong>Il cliente che chiama ogni sette giorni.</strong> Non perché sia impaziente: perché nessuno gli ha detto a che punto siamo.`,
    `<strong>L'acconto grosso incassato e speso.</strong> I moduli li hai già pagati, l'impianto non è ancora attivo, e la cassa sembra piena.`,
    `<strong>L'impianto dimenticato dopo l'attivazione.</strong> Nessun contatto per manutenzione o pulizia dei moduli: cinque anni dopo il cliente non ricorda nemmeno chi glielo ha messo.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['Le pratiche hanno tante tappe', 'Lo scadenzario tiene le date di ogni passaggio, con l\'avviso prima'],
    ['I tempi sono lunghi e i soldi in mezzo', 'Pagamenti e residuo da incassare sempre visibili sul lavoro'],
    ['Si preventiva a kW e a componenti', 'Voci per moduli, inverter, accumulo, struttura e posa: il cliente confronta pezzo per pezzo'],
    ['Gli impianti restano lì per vent\'anni', 'Il cliente tiene lo storico, e la manutenzione si programma nello scadenzario'],
  ]},
  norma:`Le pratiche di <strong>connessione alla rete</strong> e i passaggi con il <strong>GSE</strong>
    hanno tempi propri e documenti propri. Il gestionale non le presenta al posto tuo: tiene le
    <strong>date</strong> e i <strong>documenti</strong> attaccati al lavoro, così nessun passaggio resta
    fermo per settimane senza che qualcuno se ne accorga.`,
  chiusura:`Nel fotovoltaico la reputazione si costruisce su una cosa sola: <strong>tenere informato il
    cliente</strong> nei tre mesi in cui non succede niente di visibile. Se sai sempre a che punto è la
    pratica, quella telefonata la fai tu prima che la faccia lui — ed è la differenza fra un cliente
    nervoso e un cliente che ti manda il cugino.`,
  faq:[
    { d:'Posso seguire le pratiche con le loro scadenze?',
      r:`Sì, con lo scadenzario: ogni passaggio ha la sua data e viene segnalato prima. I documenti restano
         attaccati al lavoro.` },
    { d:'Posso preventivare per componenti?',
      r:`Sì: moduli, inverter, accumulo, struttura e posa possono essere voci separate con la loro quantità
         e il loro prezzo, così il cliente confronta le offerte pezzo per pezzo.` },
  ],
},
{
  slug:'gestionale-muratori', ruolo:'art',
  nome:'muratori', nomeSing:'muratore', articolo:'un muratore',
    foto1:{ src:'/img/gestionale-telefono.webp', w:780, h:1688, tel:true,
    alt:"Il gestionale per muratori aperto sul telefono, in cantiere",
    cap:"Lo stesso gestionale sul telefono, col guanto ancora addosso." },
  link:'Gestionale per muratori',
  riga:'giornate, lavori a misura, materiale e il conto che deve tornare',
  title:'Gestionale per muratori: preventivi, lavori e fatture',
  desc: 'Gestionale per muratori: preventivi a misura o a giornata, materiale e ore nel costo del lavoro, e il conto di quanto resta. 30 giorni gratis.',
  h1:'Gestionale per muratori: preventivato meno materiale meno ore, quello che resta è tuo',
  apertura:`Il muratore è il mestiere dove il conto è più semplice da fare e dove quasi nessuno lo fa.
    Preventivato, meno materiale, meno ore: quello che resta è il guadagno. Tre numeri. Il problema è che
    due di quei tre nessuno li scrive da nessuna parte.`,
  dolori:[
    `<strong>Il lavoro a giornata che si allunga.</strong> Cinque giorni preventivati, otto giorni fatti, e il prezzo era chiuso.`,
    `<strong>Il materiale delle bolle.</strong> Le bolle stanno in furgone, in fattura ci finisce quello che ti ricordi.`,
    `<strong>Le ore mai contate.</strong> Sai chi c'è andato, non sai per quanti giorni. E la manodopera è il costo più grosso che hai.`,
    `<strong>Il lavoro finito e mai fatturato.</strong> Chiuso a giugno, fatturato a novembre, incassato a marzo. Nove mesi di soldi tuoi in giro.`,
  ],
  tabella:{ testa:["Com'è il tuo lavoro",'Cosa fa il gestionale'], righe:[
    ['Si lavora a misura o a giornata', 'Le voci possono essere metri quadri, metri cubi o giornate: il preventivo si adatta al modo in cui vendi'],
    ['Il materiale arriva a bolle', 'Le spese si attaccano al lavoro con fornitore e importo, il giorno che le prendi'],
    ['Le ore sono il costo più grosso', 'Rapportino dal telefono, e le ore si sommano per cantiere e per persona'],
    ['I conti si fanno a fine anno, troppo tardi', 'Il confronto fra preventivato e speso si vede mentre il cantiere è ancora aperto'],
  ]},
  norma:`Sulle manutenzioni e sui recuperi edilizi delle abitazioni l'IVA è al <strong>10%</strong>. In
    subappalto per un'altra impresa edile può entrare il <strong>reverse charge</strong>, con la fattura
    senza IVA e la dicitura di legge. Qui l'aliquota si sceglie riga per riga: nella stessa fattura
    possono starci situazioni diverse.`,
  chiusura:`La cosa che cambia davvero non è il preventivo più bello. È scoprire, dopo tre o quattro
    cantieri chiusi con i numeri veri, <strong>quale tipo di lavoro non ti rende</strong>. Quasi sempre ce
    n'è uno, e quasi sempre è quello che fai da anni convinto del contrario. Non vuol dire smettere: vuol
    dire farlo al prezzo giusto.`,
  faq:[
    { d:'Posso preventivare a giornata invece che a misura?',
      r:`Sì. La voce può avere come unità di misura la giornata, il metro quadro, il metro cubo o quello che
         ti serve. Il preventivo segue il modo in cui vendi il lavoro, non il contrario.` },
    { d:'Come faccio a sapere se un lavoro mi ha reso?',
      r:`Registrando le spese e le ore sul lavoro. Il gestionale confronta quello che avevi preventivato con
         quello che hai speso, e lo fa mentre il cantiere è ancora aperto.` },
  ],
},

/* ---------------- TECNICI E PROFESSIONISTI ---------------- */
{
  slug:'gestionale-geometri', ruolo:'tec',
  nome:'geometri', nomeSing:'geometra', articolo:'un geometra',
    foto1:{ src:'/img/gestionale-lavori.webp', w:1440, h:971,
    alt:"Elenco delle pratiche di uno studio di geometra, con stato e scadenze",
    cap:"Le pratiche aperte, con quelle in ritardo che si vedono senza cercarle." },
  link:'Gestionale per geometri',
  riga:'pratiche, scadenze, onorari con la cassa e computi da prezzare',
  title:'Gestionale per geometri: pratiche, scadenze e onorari',
  desc: 'Gestionale per studi di geometra: pratiche con le loro scadenze, computi metrici, onorari con cassa e ritenuta. 30 giorni gratis.',
  h1:'Gestionale per geometri: venti pratiche aperte e ognuna con la sua scadenza',
  apertura:`Uno studio di geometra non ha cantieri: ha <strong>pratiche</strong>. Venti, trenta aperte
    insieme, ognuna con un ente diverso, una scadenza diversa e un documento che manca. E ogni pratica
    ferma è un committente che chiama per sapere a che punto è.`,
  dolori:[
    `<strong>La pratica ferma per un documento.</strong> Aspetti una visura da tre settimane e nessuno se n'è accorto.`,
    `<strong>La scadenza che arriva addosso.</strong> Il termine per l'integrazione era ieri.`,
    `<strong>L'onorario non chiesto.</strong> Pratica chiusa e depositata, parcella mai emessa. Succede più spesso di quanto sembri.`,
    `<strong>Il documento di tre anni fa.</strong> Il committente vende casa e ti chiede l'accatastamento: parte la caccia nella cartella.`,
  ],
  tabella:{ testa:['Come lavora uno studio','Cosa fa il gestionale'], righe:[
    ['Tante pratiche aperte insieme', 'Ogni pratica ha il suo stato e il suo colore: quelle in ritardo si vedono senza cercarle'],
    ['Ogni pratica ha le sue scadenze', 'Lo scadenzario le tiene tutte in ordine di data, con l\'avviso prima'],
    ["L'onorario ha cassa e ritenuta", 'La parcella calcola il contributo cassa e la ritenuta, e il file elettronico porta il codice giusto'],
    ['I documenti tornano anni dopo', 'Restano attaccati alla pratica e al committente, ritrovabili per nome'],
  ]},
  norma:`Nella parcella di un geometra ci sono il <strong>contributo cassa</strong> (Cassa Geometri) e la
    <strong>ritenuta d'acconto</strong> quando il committente è sostituto d'imposta. Nel file elettronico
    per lo SDI la cassa vuole il suo codice: è la cosa che i programmi di fatturazione generici sbagliano
    più spesso, perché sono nati per chi vende merce.`,
  chiusura:`Per uno studio tecnico c'è una funzione che vale più delle altre e non si trova quasi mai nei
    gestionali generici: il <strong>computo da prezzare</strong>. Ricevi o prepari un computo con le
    quantità e senza i prezzi, e lo lavori da lì. È esattamente il documento che gira fra studio e impresa
    tutti i giorni, e averlo dentro evita il giro di file Excel avanti e indietro.`,
  faq:[
    { d:'Gestisce la cassa previdenziale nella parcella?',
      r:`Sì. Il contributo cassa e la ritenuta d'acconto sono previsti, e nel file elettronico viene messo
         il codice giusto per la cassa.` },
    { d:"C'è il computo metrico?",
      r:`Sì, con capitoli, voci, misure riga per riga e analisi prezzi. E c'è il computo da prezzare, quello
         con le quantità già scritte e i prezzi da mettere.` },
  ],
},
{
  slug:'gestionale-architetti', ruolo:'tec',
  nome:'architetti', nomeSing:'architetto', articolo:'un architetto',
    foto1:{ src:'/img/gestionale-fatture.webp', w:1440, h:1265,
    alt:"Parcelle di uno studio di architettura con contributo cassa e ritenuta d'acconto",
    cap:"Le parcelle, con da incassare e da fatturare in cima." },
  link:'Gestionale per architetti',
  riga:'incarichi, fasi, onorari a percentuale e direzione lavori',
  title:'Gestionale per architetti: incarichi, fasi e onorari',
  desc: 'Gestionale per studi di architettura: incarichi divisi in fasi, onorari e parcelle con Inarcassa, direzione lavori. 30 giorni gratis.',
  h1:'Gestionale per architetti: l\'incarico non è un lavoro, sono quattro fasi che si pagano a pezzi',
  apertura:`Un incarico di architettura non finisce in un giorno: preliminare, definitivo, esecutivo,
    direzione lavori. Ogni fase ha il suo compenso e il suo momento di fatturazione, e tenere il filo di
    dieci incarichi tutti a fasi diverse è un lavoro a sé.`,
  dolori:[
    `<strong>La fase completata e non fatturata.</strong> Il definitivo è consegnato da due mesi, la parcella no.`,
    `<strong>L'onorario stimato a sentimento.</strong> Una percentuale detta al volo, senza fare il conto sul valore delle opere.`,
    `<strong>Le varianti in corso d'opera regalate.</strong> Il committente cambia idea tre volte e la revisione del progetto non la paga nessuno.`,
    `<strong>La direzione lavori che si allunga.</strong> Il cantiere doveva durare sei mesi, ne dura dodici, e il compenso era a corpo.`,
  ],
  tabella:{ testa:['Come lavora uno studio','Cosa fa il gestionale'], righe:[
    ["L'incarico è diviso in fasi", 'Ogni fase è un passaggio con il suo stato: si vede subito quale è consegnata e non ancora fatturata'],
    ['Il compenso si paga a tranche', 'Gli stati di avanzamento servono anche qui: fatturi la fase, non tutto alla fine'],
    ['La parcella ha Inarcassa e ritenuta', 'Il contributo integrativo e la ritenuta sono nel calcolo, e nel file elettronico c\'è il codice cassa'],
    ['La direzione lavori dura mesi', 'Le ore e i sopralluoghi si registrano, così sai quanto è costata davvero'],
  ]},
  norma:`Per il compenso c'è un riferimento ufficiale: il <strong>Decreto Parametri</strong>
    (DM 17 giugno 2016), che non è obbligatorio fra privati ma è il metro usato nelle gare pubbliche e nei
    tribunali. Il calcolo parte dal valore delle opere e dai coefficienti della prestazione. Nella parcella
    poi entrano il <strong>contributo integrativo Inarcassa</strong> e la ritenuta d'acconto.`,
  chiusura:`La cosa che uno studio scopre appena comincia a registrare le ore è quasi sempre la stessa:
    <strong>la direzione lavori costa più di quello che rende</strong>, perché i sopralluoghi non si
    contano mai. Non è un motivo per rifiutarla: è un motivo per quotarla su quante volte andrai in
    cantiere davvero, e non su quante volte si spera di andarci.`,
  faq:[
    { d:"Posso dividere l'incarico in fasi?",
      r:`Sì. Ogni fase ha il suo stato e il suo importo, e gli stati di avanzamento permettono di fatturare
         la fase consegnata senza aspettare la fine dell'incarico.` },
    { d:'Gestisce Inarcassa e la ritenuta?',
      r:`Sì, il contributo integrativo e la ritenuta d'acconto entrano nel calcolo della parcella, e nel
         file elettronico per lo SDI viene messo il codice della cassa.` },
  ],
},
{
  slug:'gestionale-ingegneri-strutturali', ruolo:'tec',
  nome:'ingegneri strutturali', nomeSing:'ingegnere strutturale', articolo:'un ingegnere strutturale',
    foto1:{ src:'/img/gestionale-lavori.webp', w:1440, h:971,
    alt:"Elenco delle pratiche strutturali con depositi, collaudi e scadenze",
    cap:"Le pratiche, con i depositi e i collaudi in scadenza in evidenza." },
  link:'Gestionale per ingegneri strutturali',
  riga:'pratiche al Genio Civile, depositi, collaudi e onorari sulle opere',
  title:'Gestionale per ingegneri strutturali: pratiche e onorari',
  desc: 'Gestionale per ingegneri strutturali: pratiche di deposito, scadenze, collaudi e onorari sulle sole opere strutturali. 30 giorni gratis.',
  h1:'Gestionale per ingegneri strutturali: l\'onorario si calcola sulle opere strutturali, non sulla casa',
  apertura:`L'errore più costoso che uno studio strutturale può fare in fase di offerta è calcolare
    l'onorario sul valore dell'intera ristrutturazione invece che sul valore delle <strong>sole opere
    strutturali</strong>. Il primo numero è enorme e spaventa il committente; il secondo è quello giusto,
    e va spiegato.`,
  dolori:[
    `<strong>L'offerta fatta sul valore sbagliato.</strong> Percentuale giusta, base sbagliata: o spaventi il committente o lavori sotto costo.`,
    `<strong>Il deposito che aspetta.</strong> La pratica al Genio Civile è ferma per un allegato, e il cantiere aspetta te.`,
    `<strong>Il collaudo dimenticato.</strong> Obbligatorio in cemento armato e acciaio, e ci si ricorda a fine lavori.`,
    `<strong>Le ore di verifica non contate.</strong> I calcoli si rifanno tre volte perché il progetto cambia, e nella parcella c'è una versione sola.`,
  ],
  tabella:{ testa:['Come lavora uno studio','Cosa fa il gestionale'], righe:[
    ["L'onorario nasce dal valore delle opere", 'Il computo delle sole opere strutturali dà la base su cui calcolare il compenso'],
    ['Le pratiche hanno depositi e scadenze', 'Lo scadenzario tiene le date di deposito, integrazione e collaudo'],
    ['I calcoli si rifanno più volte', 'Le ore si registrano per pratica: alla fine sai quanto è costata davvero la revisione'],
    ['I documenti valgono per decenni', 'Relazioni e allegati restano attaccati alla pratica e al committente'],
  ]},
  norma:`Il <strong>Decreto Parametri</strong> (DM 17 giugno 2016) dà i coefficienti anche per le
    strutture, con la categoria S corrispondente. Il compenso si calcola sul valore delle opere
    strutturali. Il <strong>collaudo statico</strong> è obbligatorio per legge sulle opere in cemento
    armato e acciaio, e va messo in conto fin dall'inizio, non ricordato alla fine.`,
  chiusura:`Registrare le ore per pratica, in uno studio strutturale, serve a una cosa precisa: capire
    quanto costano le <strong>revisioni</strong>. Il progetto architettonico cambia, e i calcoli si
    rifanno. Se dopo dieci pratiche scopri che le revisioni sono un terzo del tempo, la prossima offerta
    la scrivi con due revisioni comprese e le successive a parte — che è la clausola che salva le
    parcelle.`,
  faq:[
    { d:"L'onorario si calcola sulle sole opere strutturali?",
      r:`È il modo corretto di farlo, e il computo delle opere strutturali fornisce la base. Il Decreto
         Parametri dà i coefficienti per la categoria strutture.` },
    { d:'Posso seguire i depositi e i collaudi con le scadenze?',
      r:`Sì, con lo scadenzario: deposito, eventuale integrazione e collaudo hanno le loro date e vengono
         segnalati prima.` },
  ],
},
{
  slug:'gestionale-certificatori-energetici', ruolo:'tec',
  nome:'certificatori energetici', nomeSing:'certificatore energetico', articolo:'un certificatore energetico',
    foto1:{ src:'/img/gestionale-lavori.webp', w:1440, h:971,
    alt:"Elenco delle pratiche APE con stato consegnato e da fatturare",
    cap:"Tante pratiche insieme: quelle consegnate e non fatturate stanno in un filtro." },
  link:'Gestionale per certificatori energetici',
  riga:'APE a volume, sopralluoghi, scadenze decennali e pratiche bonus',
  title:'Gestionale per certificatori energetici: APE e pratiche',
  desc: 'Gestionale per chi redige APE: tante pratiche insieme, sopralluoghi, scadenza decennale dei certificati e rinnovi. 30 giorni gratis.',
  h1:'Gestionale per certificatori energetici: tanti APE, piccoli, e nessuno che tenga il conto',
  apertura:`Chi fa certificazione energetica ha il problema opposto a quello di un progettista: non pochi
    incarichi grandi, ma <strong>tanti incarichi piccoli</strong>. Trenta APE al mese, ognuno con un
    sopralluogo, un deposito e una parcella da poche centinaia di euro. Il rischio non è sbagliare un
    lavoro: è perderne il conto.`,
  dolori:[
    `<strong>L'APE consegnato e non pagato.</strong> Su trenta pratiche al mese ne sfugge sempre qualcuna, e sono soldi lavorati.`,
    `<strong>Il sopralluogo rifatto.</strong> Manca una misura e devi tornare: due ore che nessuno paga.`,
    `<strong>Il rinnovo mai proposto.</strong> L'APE vale dieci anni, poi va rifatto. Nessuno chiama il cliente e la pratica se la prende un altro.`,
    `<strong>Il documento chiesto anni dopo.</strong> Il committente vende casa e ti richiede l'attestato: parte la ricerca.`,
  ],
  tabella:{ testa:['Come lavora uno studio','Cosa fa il gestionale'], righe:[
    ['Tante pratiche piccole insieme', 'Ogni pratica ha il suo stato: quelle consegnate e non fatturate stanno in un filtro'],
    ['I sopralluoghi sono la parte cara', 'Le ore e i chilometri si registrano sulla pratica: alla fine sai quanto costa davvero un APE'],
    ["L'APE scade dopo dieci anni", 'Lo scadenzario tiene la data e ti fa chiamare tu il cliente prima che lo faccia un altro'],
    ['I certificati si richiedono anni dopo', 'Restano attaccati alla pratica e al committente'],
  ]},
  norma:`L'<strong>Attestato di Prestazione Energetica</strong> ha una validità di dieci anni, che decade
    prima se cambiano l'impianto o l'involucro. Serve nelle compravendite e nelle locazioni, e si deposita
    nel catasto energetico della propria Regione. Le pratiche legate ai <strong>bonus edilizi</strong>
    hanno invece i loro termini, che vanno seguiti uno per uno.`,
  chiusura:`Su un mestiere fatto di pratiche piccole, la funzione che porta più soldi non è il calcolo:
    è <strong>lo scadenzario dei rinnovi</strong>. Un archivio di mille APE con la data di scadenza
    tracciata è un flusso di lavoro che si ripete da solo ogni dieci anni. Lo stesso archivio senza date è
    mille clienti che, quando serve, cercano su Google.`,
  faq:[
    { d:'Posso tenere traccia della scadenza decennale degli APE?',
      r:`Sì, con lo scadenzario: metti la data e il gestionale te la segnala prima, così proponi tu il
         rinnovo.` },
    { d:'Come faccio a sapere quanto mi costa davvero un APE?',
      r:`Registrando ore e spese sulla pratica, sopralluogo compreso. Il gestionale confronta l'onorario con
         quello che hai speso.` },
  ],
},
{
  slug:'gestionale-direttori-lavori', ruolo:'tec',
  nome:'direttori dei lavori', nomeSing:'direttore dei lavori', articolo:'un direttore dei lavori',
    foto1:{ src:'/img/gestionale-telefono.webp', w:780, h:1688, tel:true,
    alt:"Il gestionale per la direzione lavori aperto sul telefono, durante un sopralluogo",
    cap:"Il sopralluogo si registra sul posto, con la foto e la data." },
  link:'Gestionale per la direzione lavori',
  riga:'sopralluoghi, verbali, SAL da approvare e compensi a percentuale',
  title:'Gestionale per direttori dei lavori: sopralluoghi e SAL',
  desc: 'Gestionale per la direzione lavori: sopralluoghi con foto e verbali, SAL da controllare, compensi a percentuale. 30 giorni gratis.',
  h1:'Gestionale per la direzione lavori: il compenso è a percentuale, il lavoro è a sopralluoghi',
  apertura:`La direzione lavori si paga quasi sempre a percentuale sull'importo, e si lavora a
    <strong>sopralluoghi</strong>. Due unità di misura che non c'entrano niente l'una con l'altra: se il
    cantiere si allunga di sei mesi, i sopralluoghi raddoppiano e il compenso resta quello.`,
  dolori:[
    `<strong>Il cantiere che si allunga.</strong> Sei mesi diventano dodici, i sopralluoghi raddoppiano, il compenso è a corpo.`,
    `<strong>Il verbale scritto a memoria.</strong> Compilato la sera, tre giorni dopo, senza le foto giuste.`,
    `<strong>Il SAL approvato di corsa.</strong> L'impresa manda lo stato di avanzamento e va controllato voce per voce, ma il tempo non c'è.`,
    `<strong>La responsabilità senza carta.</strong> Se non c'è il verbale con la data e la foto, la contestazione la prendi tu.`,
  ],
  tabella:{ testa:['Come lavora un DL','Cosa fa il gestionale'], righe:[
    ['Il lavoro sono i sopralluoghi', 'Ogni sopralluogo si registra dal telefono con foto e due righe, sul posto'],
    ['I SAL vanno controllati', 'Gli stati di avanzamento hanno le quantità eseguite voce per voce, con maturato e residuo'],
    ['Le foto sono la prova', 'Restano attaccate al cantiere e al giorno giusto, non sparse nella galleria'],
    ['Il compenso è a percentuale', 'Le ore registrate dicono se quella percentuale sta reggendo o no'],
  ]},
  norma:`Per il compenso della direzione lavori il riferimento è il <strong>Decreto Parametri</strong>
    (DM 17 giugno 2016), con il coefficiente della prestazione di direzione lavori. Sui cantieri con più
    imprese si affianca la figura del <strong>coordinatore per la sicurezza in esecuzione</strong>
    prevista dal D.Lgs 81: è un incarico distinto, con un compenso distinto.`,
  chiusura:`Il consiglio che vale di più, e che non riguarda il programma: registra le ore anche quando il
    compenso è a corpo. Dopo tre cantieri hai il numero vero di quanto costa un mese di direzione lavori,
    e la prossima offerta la puoi scrivere con una <strong>durata massima</strong> oltre la quale si
    rinegozia. È l'unica clausola che protegge davvero dal cantiere che si allunga.`,
  faq:[
    { d:'Posso registrare i sopralluoghi con le foto?',
      r:`Sì, dal telefono e sul posto: due righe, le foto e la data. Restano attaccati al cantiere giusto,
         e diventano la traccia scritta di quello che hai visto.` },
    { d:'Posso controllare i SAL che manda l\'impresa?',
      r:`Sì. Gli stati di avanzamento tengono le quantità eseguite voce per voce, con maturato, già
         fatturato e residuo, così il controllo si fa sui numeri e non a occhio.` },
  ],
},
{
  slug:'gestionale-interior-designer', ruolo:'tec',
  nome:'interior designer', nomeSing:'interior designer', articolo:'un interior designer',
    foto1:{ src:'/img/gestionale-preventivi.webp', w:1440, h:1077,
    alt:"Capitolato di arredi e finiture con quantità e prezzo, in un elenco unico",
    cap:"Il capitolato in un elenco solo, invece che in cinquanta messaggi." },
  link:'Gestionale per interior designer',
  riga:'progetti, fornitori, capitolato arredi e le revisioni infinite',
  title:'Gestionale per interior designer: progetti e fornitori',
  desc:'Gestionale per interior designer: progetti con le loro fasi, capitolato arredi e finiture, fornitori e ordini, revisioni contate e onorari. 30 giorni gratis.',
  h1:'Gestionale per interior designer: le revisioni sono il costo nascosto del progetto',
  apertura:`Nel progetto di interni il lavoro tecnico è la metà. L'altra metà è gestire il
    <strong>gusto</strong> del committente, che cambia idea — ed è normale che cambi idea, perché finché
    non la vede non sa cosa vuole. Il problema è che ogni cambio d'idea è tempo, e quasi nessuno lo conta.`,
  dolori:[
    `<strong>Le revisioni infinite.</strong> La quinta versione del soggiorno costa come le prime quattro, e non è in parcella.`,
    `<strong>Il capitolato che si perde.</strong> Cinquanta fra arredi e finiture scelti su WhatsApp in sei mesi, e nessun elenco unico.`,
    `<strong>Il fornitore in ritardo.</strong> Il divano arriva tre settimane dopo la consegna promessa e la colpa è tua.`,
    `<strong>Il compenso a corpo su un lavoro senza fine.</strong> Il progetto è chiuso, ma il committente ti chiama ancora per la scelta delle maniglie.`,
  ],
  tabella:{ testa:['Come lavora uno studio','Cosa fa il gestionale'], righe:[
    ['Il progetto ha fasi e revisioni', 'Ogni fase ha il suo stato, e le ore registrate dicono quanto sono costate le revisioni'],
    ['Il capitolato è lungo', 'Voci con quantità e prezzo per arredi e finiture, in un elenco solo invece che in una chat'],
    ['I fornitori sono tanti', 'Fornitori e loro fatture dentro, collegati al progetto giusto'],
    ['Le consegne hanno date', 'Lo scadenzario tiene le date promesse e ti avvisa prima'],
  ]},
  norma:`L'onorario di un progetto di interni non ha una tariffa di legge: si concorda a corpo, a
    percentuale sul valore dei lavori o a ore. Chi è iscritto a un albo ha in parcella il proprio
    <strong>contributo cassa</strong> e la <strong>ritenuta d'acconto</strong> quando il committente è
    sostituto d'imposta; chi non lo è emette una fattura normale.`,
  chiusura:`Il numero da cercare, in questo mestiere, è uno solo: <strong>quante revisioni in media</strong>
    servono per chiudere un ambiente. Registra le ore per due o tre progetti e ce l'hai. Da quel momento
    l'offerta si scrive in un altro modo — «due revisioni comprese, le successive a parte» — e la
    conversazione con il committente diventa una cosa concordata prima invece che una tensione dopo.`,
  faq:[
    { d:'Posso tenere il capitolato di arredi e finiture?',
      r:`Sì, come voci con quantità e prezzo: diventa un elenco unico che si scarica in PDF, invece di
         cinquanta messaggi sparsi.` },
    { d:'Posso contare le ore delle revisioni?',
      r:`Sì, le ore si registrano sul progetto. Dopo due o tre lavori sai quante revisioni servono in media,
         e puoi scriverlo nell'offerta.` },
  ],
},
];

/* ---------- Da qui in giu' si compone la pagina ---------- */
module.exports = MESTIERI.map(m => {
  const p = P[m.ruolo];
  const tec = m.ruolo === 'tec';

  return {
    famiglia: 'mestiere',
    slug: m.slug,
    link: m.link,
    riga: m.riga,
    briciola: m.link,
    title: m.title,
    desc: m.desc,
    h1: m.h1,
    minuti: 5,
    nomeApp: 'Gestionale TrovaImpresa per ' + m.nome,
    cosaCosta: 'Il gestionale',
    funzioni: [
      `${p.docPl.charAt(0).toUpperCase() + p.docPl.slice(1)} con voci, quantità e prezzo`,
      'Fatture elettroniche con file XML per lo SDI',
      tec ? 'Contributo cassa previdenziale e ritenuta' : 'IVA al 10 per cento riga per riga',
      `${p.lavori.charAt(0).toUpperCase() + p.lavori.slice(1)} con stato e scadenze`,
      'Scadenzario con avviso prima della scadenza',
      'Documenti e foto attaccati al lavoro',
      'Assistente AI che compila i moduli da una frase',
    ],
    ctaTitolo: `Provalo con ${p.unDoc} vero`,
    ctaTesto: `Non serve caricare lo storico. Prendi ${p.unDoc} che devi fare questa settimana e fallo qui: in dieci minuti sai se ti serve.`,
    sommario: `il gestionale di TrovaImpresa visto dalla parte di ${m.articolo}: ${p.docPl},
      ${p.lavori}, fatture e scadenze, dal telefono e dal computer. Le stesse funzioni degli altri, ma
      con le parole e i conti del tuo mestiere.
      <span class="price-big">30 giorni di prova, poi 249 € l'anno</span>`,

    sezioni: [
      { blocchi: [
        { t:'lead', x: m.apertura },
      ]},

      { h2: 'I quattro punti dove si perdono i soldi', blocchi: [
        `Non sono difetti di chi lavora male. Sono i punti dove il mestiere, fatto com'è fatto, lascia
         scoperto il fianco.`,
        { t:'err', righe: m.dolori },
      ]},

      { h2: `Cosa cambia per ${m.articolo}`, blocchi: [
        { t:'tab', testa: m.tabella.testa, righe: m.tabella.righe },
        { t:'nota', x: m.norma },
      ]},

      { h2: 'Quello che c\'è dentro, comunque', blocchi: [
        `Sotto le differenze del mestiere, il gestionale è lo stesso per tutti — ed è quello che serve
         perché il conto torni.`,
        { t:'fig', src: m.foto1.src, w: m.foto1.w, h: m.foto1.h, tel: !!m.foto1.tel, alt: m.foto1.alt, cap: m.foto1.cap },
        { t:'ok', righe: [
          `<strong>${p.docPl.charAt(0).toUpperCase() + p.docPl.slice(1)}</strong> con le voci, il PDF pronto e lo stato: bozza, inviato, accettato, rifiutato.`,
          `<strong>Fatture elettroniche</strong> con il file XML per lo SDI, ${tec ? 'il contributo cassa e la ritenuta' : "l'IVA riga per riga, la ritenuta e il bollo"}.`,
          `<strong>${p.lavori.charAt(0).toUpperCase() + p.lavori.slice(1)}</strong> con stato e colore, ${tec ? 'con le scadenze di ogni passaggio' : 'con le spese e le ore che ci finiscono dentro'}.`,
          `<strong>${p.chiPl.charAt(0).toUpperCase() + p.chiPl.slice(1)}</strong> con il loro storico: sai cosa hai fatto per chi, e quando.`,
          `<strong>Scadenzario</strong> che avvisa prima, e <strong>documenti</strong> attaccati al lavoro giusto.`,
          `<strong>Foto</strong> del prima e dopo, e <strong>report</strong> da mandare al commercialista.`,
          `<strong>Esporta tutto</strong> in Excel o JSON quando vuoi. I dati sono tuoi.`,
        ]},
        `Si apre dal browser, sul telefono e sul computer, senza installare niente.`,
      ]},

      { h2: 'L\'aiuto AI, per chi scrivere non è il suo mestiere', blocchi: [
        `L'assistente sta dentro il modulo, mentre compili. Scrivi la frase come la diresti al telefono e
         le caselle si riempiono da sole, illuminate, così vedi cosa ha scritto.`,
        `<strong>Non salva niente da solo.</strong> Riempie, ti dice quante caselle ha toccato, e aspetta
         che controlli tu.`,
        { t:'fig', src:'/img/gestionale-ai.webp', w:1440, h:785,
          alt:`L'assistente AI del gestionale per ${m.nome} riempie le caselle da una frase scritta a mano`,
          cap:'Una frase scritta a mano, le caselle riempite. Il salvataggio resta tuo.' },
      ]},

      { h2: 'Una cosa in più: i clienti', blocchi: [
        `Questa parte non ce l'ha nessun altro gestionale, e non perché siano fatti male: perché fanno un
         mestiere diverso.`,
        `Il gestionale sta dentro <strong>TrovaImpresa</strong>, che è il posto dove i clienti cercano
         ${m.nome}. Con lo stesso abbonamento hai il gestionale <em>e</em> il profilo in evidenza sul
         marketplace. Un gestionale ti fa risparmiare tempo; il profilo ti porta lavoro. Al prezzo di uno.`,
        { t:'espe', x: m.chiusura },
      ]},
    ],

    faq: [
      ...m.faq,
      { d: `Il gestionale va bene anche se lavoro da solo?`,
        r: `Sì, ed è il caso più comune. Le parti che non ti servono si possono semplicemente non aprire:
            il minimo utile sono ${p.lavori}, ${p.chiPl} e fatture.` },
      { d: 'Si deve installare qualcosa?',
        r: `No. Si apre dal browser, sul telefono e sul computer. Niente da scaricare, nessun aggiornamento
            da fare a mano, basta la connessione.` },
      { d: `Quanto costa il gestionale per ${m.nome}?`,
        r: `È compreso nel Gestionale TrovaImpresa: 249 euro all'anno oppure 29 euro al mese, prezzo finale
            senza IVA da aggiungere. Lo provi 30 giorni gratis, non serve la carta di credito e alla fine non parte nessun addebito.` },
      { d: 'I dati sono miei?',
        r: `Sì. Si esportano in Excel o in JSON quando vuoi, senza costi e senza chiedere permesso: se un
            giorno vai da un'altra parte, te li porti dietro.` },
    ],
  };
});
