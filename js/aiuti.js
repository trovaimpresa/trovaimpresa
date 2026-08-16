/* ============================================================
   aiuti.js — I riquadri di aiuto del gestionale (agosto 2026)

   Passi il mouse su una voce del menu o su un pulsante della barra,
   e dopo un attimo compare un riquadro che spiega a cosa serve.

   COME SI USA
   Una riga sola in fondo a gestionale-app.html:
       <script src="/js/aiuti.js"></script>

   COME SI AGGIUNGONO ALTRI AIUTI
   Due modi, tutti e due semplici.
   1) Scrivendo la frase qui sotto nella lista AIUTI, con la chiave giusta
      (il data-tab o il data-action del pulsante).
   2) Mettendo direttamente data-aiuto="la tua frase" sul pulsante in HTML.
      Ha la precedenza su tutto: serve quando un pulsante è un caso a se'.

   PERCHE' SOLO COL MOUSE
   Sul telefono il "passaggio sopra" non esiste, e questi sono pulsanti che
   fanno qualcosa quando li tocchi: un aiuto al tocco darebbe fastidio invece
   di aiutare. Quindi su telefono e tablet non compare niente.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- le frasi ---------- */
  /* menu di sinistra: la chiave è il data-tab del pulsante */
  var AIUTI_TAB = {
    riepilogo:    'Il colpo d’occhio: cosa c’è da fare oggi, cosa è in ritardo e come vanno gli incassi.',
    lavori:       'Tutti i cantieri: da fare, in corso e finiti. Da un lavoro nasce il preventivo e poi la fattura.',
    preventivi:   'I preventivi mandati e quelli ancora da mandare. Quando il cliente accetta, diventa un lavoro.',
    fatture:      'Le fatture emesse, quelle da incassare e quelle pagate. Da qui esce il PDF e il file per lo SdI.',
    calendario:   'Il mese a colpo d’occhio: quando è previsto ogni lavoro.',
    agenda:       'Cosa deve fare la squadra giorno per giorno. È quello che gli operai vedono sul telefono.',
    mezzi:        'Furgoni e macchine, con le scadenze di bollo, assicurazione e revisione.',
    attrezzature: 'Betoniere, ponteggi, utensili: cosa hai e a chi è in mano.',
    squadra:      'Le persone che lavorano con te: contatti, ruolo e documenti.',
    carte:        'Le carte aziendali e le spese fatte con ognuna.',
    clienti:      'Privati, aziende e condomini. Una volta inserito un cliente lo scegli dal menu, senza riscrivere ogni volta indirizzo e dati.',
    scadenzario:  'Le scadenze da non dimenticare, con l’avviso prima che arrivino.',
    report:       'I numeri: quanto hai lavorato, quanto hai incassato, dove vanno i soldi.',
    galleria:     'Le foto e i video dei cantieri, tutti in un posto solo.',
    mappa:        'Dove sono i tuoi cantieri e quanto distano da te.',
    fornitori:    'Le rivendite e i negozi dove compri il materiale, con le fatture da pagare e le loro scadenze.',
    computi:      'Il computo metrico: le lavorazioni con le loro misure — parti uguali, lunghezza, larghezza, altezza — e i vuoti da detrarre. La quantità la calcola il gestionale, tu misuri.',
    prezzario:    'Le voci di prezzo che usi sempre, scritte una volta sola. Nel computo le ritrovi cercando una parola ed entrano già fatte, col loro prezzo.',
    crediti:      'I CFP che devi fare ogni anno per restare iscritto all’albo. Segni i corsi mano a mano che li fai e vedi quanti te ne mancano.',
    cestino:      'Tutto quello che elimini passa di qui e resta a disposizione: finché è nel cestino non è perso. Clicca una riga per rimetterla a posto.',

    /* ⚠️ 11 agosto 2026 — QUESTA VOCE NON SONO LE RICHIESTE DEI CLIENTI.
       Diceva «Le richieste di preventivo che arrivano dai clienti di
       TrovaImpresa»: sbagliato, e sbagliato nel modo peggiore — prometteva una
       cosa che quel pulsante non fa. La sezione si chiama «Cosa ti manca?» ed
       e' la cassetta dei suggerimenti verso di NOI: l'utente scrive cosa gli
       serve e noi glielo costruiamo. Il data-tab e' rimasto "richieste" da
       quando la sezione faceva un'altra cosa, e la frase non e' mai stata
       aggiornata. Se un giorno il tab viene rinominato, questa chiave va con lui. */
    richieste:    'Manca qualcosa nel gestionale? Scrivilo qui: la richiesta arriva a noi, la leggiamo e la costruiamo.'
  };

  /* ===== 11 agosto 2026 — LE STESSE VOCI, DETTE A UNO STUDIO TECNICO =====
     Col ruolo «professionista» il menu cambia nome alle voci: Attrezzature
     diventa Strumenti, Squadra diventa Collaboratori, i lavori diventano
     pratiche. Le frasi di aiuto invece erano rimaste quelle dell'impresa
     edile, e un geometra sotto «Strumenti» leggeva «betoniere, ponteggi,
     utensili». Qui ci sono SOLO le voci che cambiano davvero: per tutte le
     altre continua a valere la frase di sopra.
     Il ruolo da qui non e' leggibile (ruoloUtente e' chiuso dentro la pagina),
     quindi lo si riconosce da come si chiama la voce a schermo: se
     «attrezzature» si legge «Strumenti», siamo in uno studio. */
  var AIUTI_TAB_STUDIO = {
    lavori:       'Tutte le pratiche: da fare, in corso e finite. Da una pratica nasce il preventivo e poi la fattura.',
    attrezzature: 'Stazione totale, distanziometro laser, termocamera, livello: gli strumenti dello studio, con le date delle tarature e delle verifiche.',
    squadra:      'I collaboratori dello studio: contatti, ruolo e documenti.',
    agenda:       'Cosa deve fare chi collabora con te, giorno per giorno. È quello che vedono sul telefono.',
    calendario:   'Il mese a colpo d’occhio: quando è prevista ogni pratica.',
    galleria:     'Le foto e i video dei sopralluoghi e dei cantieri che segui, tutti in un posto solo.',
    mappa:        'Dove sono le pratiche che segui e quanto distano da te.'
  };

  function menuDaStudio() {
    var s = document.querySelector('[data-tab="attrezzature"] span');
    return !!(s && s.textContent.trim() === 'Strumenti');
  }

  /* barra in alto e pagina iniziale: la chiave è il data-action */
  var AIUTI_AZIONE = {
    azienda:        'I tuoi dati: nome, partita IVA, sede, IBAN. Sono quelli che finiscono su preventivi e fatture.',
    commercialista: 'I contatti del tuo commercialista e i documenti da mandargli, come scontrini e ricevute.',
    'export-json':  'Scarica una copia di tutti i tuoi dati da tenere da parte, per sicurezza.',
    'export-excel': 'Porta fuori i dati in un foglio di calcolo, per farci i conti per conto tuo.',

    /* --- creare cose nuove --- */
    'new-job':          'Un cantiere nuovo: cosa c’è da fare, per chi e quando. Da qui poi nascono preventivo e fattura.',
    'new-prev':         'Un preventivo nuovo. Quando il cliente lo accetta lo trasformi in lavoro senza riscrivere niente.',
    'new-fattura':      'Una fattura nuova. Puoi partire da zero, da un preventivo accettato o da più lavori dello stesso cliente.',
    'new-mezzo':        'Un furgone o una macchina, con le scadenze di bollo, assicurazione e revisione.',
    'new-attrezzatura': 'Un’attrezzatura: betoniera, ponteggio, martello demolitore. Serve a sapere dove sta e chi ce l’ha.',
    'new-dip':          'Una persona della squadra: contatti, ruolo e documenti.',
    'new-carta':        'Una carta aziendale, per tenere il conto di cosa ci paghi.',
    'new-scad':         'Una scadenza da non dimenticare, con l’avviso prima che arrivi.',
    'new-panel':        'Un reparto nuovo, per esempio muratore o giardiniere. Ogni reparto ha i suoi lavori, i suoi clienti e i suoi numeri, separati dagli altri.',
    'new-job-date':     'Crea un lavoro già fissato in questo giorno.',
    'quick-cli':        'Aggiungi al volo un cliente che non hai ancora in anagrafica, senza uscire da qui.',
    /* 11 agosto 2026 — questi pulsanti c'erano da mesi e non spiegavano niente:
       ci passavi sopra e non compariva nulla. Aggiunti tutti in una volta.
       NON e' stato aggiunto 'new-cli': quei pulsanti hanno gia' un title loro,
       diverso per Privato / Azienda / Condominio, e questo file il title lo
       toglie quando trova una frase propria — avremmo perso la distinzione. */
    'new-forn':         'Una rivendita o un negozio dove compri il materiale: contatti, referente e condizioni di pagamento.',
    'new-fattf':        'Una fattura che devi pagare tu a un fornitore, con la sua scadenza. Serve a sapere sempre quanto devi e a chi.',
    'new-fattf-forn':   'Una fattura da pagare già intestata a questo fornitore: non devi riselezionarlo.',
    'new-computo':      'Un computo metrico nuovo: le lavorazioni, le misure e i totali, e da qui esce il PDF.',
    'new-prezzo':       'Una voce di prezzo tua, da riusare nei computi senza riscriverla ogni volta.',
    'new-cred':         'Un corso fatto, con i crediti formativi che ti ha dato e la data.',
    'gal-nuovo':        'Carica foto o video e attaccali a un cantiere: li ritrovi qui anche fra due anni.',
    'save-richiesta':   'Manda la richiesta a noi. La leggiamo di persona: non serve che sia scritta bene, bastano due righe.',
    'cerca-azzera':     'Toglie la ricerca e rimette in vista tutto.',
    /* le tre frecce del calendario: non c'e' scritto niente sopra, sono
       «‹», «›» e «•». Senza aiuto uno le prova e basta. */
    'cal-prev':         'Il mese prima.',
    'cal-next':         'Il mese dopo.',
    'cal-today':        'Torna al mese di oggi.',
    'pz-importa':       'Porta dentro un prezzario che hai in Excel o CSV: lo leggo io e ti faccio scegliere quali colonne sono descrizione, unità e prezzo.',
    'edit-computo':     'Apre il computo: capitoli, lavorazioni e misure, con i totali che si aggiornano da soli.',
    'comp-dup':         'Fa una copia di questo computo. Ti chiede se copiare anche le misure: senza, ti restano le lavorazioni pronte da rimisurare.',
    'comp-pdf':         'Il computo in PDF: capitoli, misure una per una, importi e il riquadro dei totali.',
    'del-computo':      'Manda il computo nel Cestino. Non è perso: da lì lo rimetti a posto quando vuoi.',
    'prev-pdf':         'Il preventivo in PDF, pronto da mandare al cliente.',
    'edit-prev':        'Riapre il preventivo per cambiare voci, prezzi o condizioni.',
    'del-prev':         'Manda il preventivo nel Cestino. Da lì lo rimetti a posto quando vuoi.',
    'apri-cli':         'La scheda completa del cliente: lavori, preventivi, fatture e documenti, tutto insieme.',
    'del-cli':          'Manda il cliente nel Cestino. I suoi lavori e le sue fatture restano dove sono.',
    'map':              'Fa vedere dov’è questo indirizzo sulla mappa.',
    'pz-vai':           'Porta dentro il tuo prezzario le voci trovate nel file. Quelle che hai già non vengono raddoppiate.',

    /* --- lavoro di tutti i giorni --- */
    'carta-dettaglio':   'Tutti i movimenti fatti con questa carta, uno per uno.',
    'save-rifornimento': 'Registra un pieno: litri, importo e chilometri. Serve per sapere quanto ti costa davvero il mezzo.',
    'save-movimento':    'Aggiungi una spesa fatta con questa carta.',
    'sq-wa':             'Manda un messaggio WhatsApp a questa persona, senza cercare il numero in rubrica.',
    'mp-ricalcola':      'Ricalcola quanto distano i cantieri. Serve dopo che hai cambiato indirizzi o aggiunto lavori.',
    'gal-carica':        'Carica foto e video del cantiere: restano attaccati al lavoro e li ritrovi anche fra due anni.',
    'report-csv':        'Scarica i numeri di questa schermata in un foglio di calcolo.',

    /* --- documenti e invii --- */
    'doc-cli':           'I documenti attaccati a questo cliente: verbali, preventivi firmati, capitolati, permessi.',
    'doc-cli-scegli':    'Scegli uno o più file dal computer. Le foto vengono alleggerite da sole, i PDF restano intatti.',
    'doc-cli-apri':      'Apre il documento in una scheda nuova.',
    'doc-cli-mail':      'Manda questo documento per email, con copia a te. L’indirizzo lo prende dalla scheda del cliente.',

    /* --- fatture --- */
    'fatt-riga-add':     'Aggiungi una voce alla fattura: descrizione, quantità, prezzo e IVA.',
    'prev-riga-add':     'Aggiungi una voce al preventivo: descrizione, quantità e prezzo.',
    'upload-fattura':    'Attacca alla fattura il suo PDF, così lo ritrovi qui invece che nelle cartelle del computer.',
    'fatt':              'Crea la fattura di questo lavoro, con dentro già la voce giusta.',

    /* --- i PDF che si scaricano --- */
    'incarico-pdf':      'La lettera d’incarico da far firmare al cliente prima di iniziare: oggetto, compenso, tempi e gli estremi della tua polizza.',
    'verbale-pdf':       'Il verbale di sopralluogo in PDF, con data, luogo e quello che hai rilevato.',
    'ordine-pdf':        'La conferma d’ordine in PDF da mandare al fornitore.'
  };

  /* le stesse azioni, dette a uno studio tecnico (vedi AIUTI_TAB_STUDIO) */
  var AIUTI_AZIONE_STUDIO = {
    'new-job':          'Una pratica nuova: cosa c’è da fare, per chi e quando. Da qui poi nascono preventivo e fattura.',
    'new-prev':         'Un preventivo nuovo. Quando il cliente lo accetta lo trasformi in pratica senza riscrivere niente.',
    'new-attrezzatura': 'Uno strumento dello studio: stazione totale, distanziometro, termocamera. Con la data dell’ultima taratura.',
    'new-dip':          'Un collaboratore dello studio: contatti, ruolo e documenti.',
    'gal-carica':       'Carica foto e video del sopralluogo: restano attaccati alla pratica e li ritrovi anche fra due anni.',
    'mp-ricalcola':     'Ricalcola quanto distano le pratiche. Serve dopo che hai cambiato indirizzi o ne hai aggiunte.'
  };

  /* 9 agosto 2026 — le parole tecniche dei form, i numeri in alto e i pulsanti
     delle card non hanno un data-tab ne' un data-action a cui agganciarsi:
     qui la chiave e' il testo che si legge a schermo, in minuscolo. */
  var AIUTI_TESTO = {
    /* ============================================================
       16 agosto 2026 — LE PAROLE DIFFICILI DENTRO I MODULI
       Il meccanismo c'era gia': la (i) compare da sola accanto a ogni
       etichetta che trova qui dentro. Erano scritte 33 frasi su 179
       etichette, per questo l'aiuto usciva solo in alcune zone.
       Qui se ne aggiungono una sessantina: SOLO dove la parola e'
       tecnica o si presta a due letture. Su «Citta'», «CAP» o «Anno»
       non si mette niente: una (i) che non spiega e' un pallino in
       piu' da scansare, e in questo gestionale e' il difetto peggiore.
       ============================================================ */

    /* ---- soldi e fisco ---- */
    'contributo cassa (%)': 'La percentuale della tua cassa (4% Inarcassa, 5% Geometri e Periti). Si calcola SOLO sul compenso, mai sulle spese. Se la sbagli, sbaglia anche la fattura che nasce da questo preventivo.',
    'applica la ritenuta d\'acconto del 20%': 'Spuntala solo se il cliente e’ azienda, professionista o condominio: sono loro che versano allo Stato il 20% del tuo compenso. Con un privato NO: la spunta di troppo ti fa incassare il 20% in meno.',
    'ritenuta d\'acconto (%)': 'Quanto il cliente trattiene e versa per conto tuo. Di norma 20% sul compenso. Non e’ una tassa in piu’: e’ un anticipo, lo ritrovi nella dichiarazione.',
    'spese (bolli, diritti, copie)': 'Quello che hai anticipato TU per il cliente. Ci va l’IVA sopra ma non la ritenuta, e non e’ guadagno: sono soldi che ti torni indietro.',
    'spese anticipate (bolli, diritti, visure)': 'Quello che hai anticipato TU per il cliente. Ci va l’IVA sopra ma non la ritenuta, e non e’ guadagno: sono soldi che ti torni indietro.',
    'spese documentate': 'Spese con la ricevuta in mano, riaddebitate al cliente tali e quali. Tienile separate dal compenso: sul conto si comportano in modo diverso.',
    'rimborso spese (trasferte, materiali)': 'Benzina, pedaggi, materiali comprati per andare avanti. Se lo scrivi qui finisce sul documento come voce a parte, non mescolato al compenso.',
    'iva': 'La percentuale che aggiungi al prezzo e che poi versi allo Stato. In edilizia 10% su manutenzione e ristrutturazione, 4% sulla prima casa, 22% tutto il resto. Nel dubbio chiedi al commercialista: sbagliarla si paga.',
    'numero fattura': 'La numerazione deve essere continua, senza buchi e senza doppioni: e’ la prima cosa che guarda il commercialista. Riparte da 1 ogni gennaio.',
    'data fattura': 'La data di emissione. Da qui parte il conto dei giorni per il pagamento e il trimestre in cui l’IVA va versata: non metterla a caso.',
    'modalità di pagamento': 'Bonifico, contanti, assegno... Finisce stampato sulla fattura e dentro il file per lo SdI.',
    'come si paga': 'Bonifico, contanti, assegno... Finisce stampato sulla fattura e dentro il file per lo SdI.',
    'da pagare entro': 'La data entro cui il cliente deve pagare. Dopo quella, il gestionale te la segna in ritardo e te la fa vedere in rosso.',
    'entro quanti giorni ti devono pagare': 'I giorni dalla data della fattura. 30 e’ lo standard, 60 con le aziende grandi. Serve al gestionale per dirti chi e’ in ritardo senza che tu conti i giorni.',
    'pec': 'La casella di posta certificata del cliente. Serve a consegnargli la fattura elettronica quando non ha il codice destinatario.',
    'partita iva': 'Le 11 cifre di un’azienda o di un professionista. Un privato non ce l’ha: a lui serve il codice fiscale.',
    'codice fiscale': 'I 16 caratteri di una persona. Per un privato e’ obbligatorio in fattura: senza, lo SdI la rifiuta.',
    'prezzo unitario (€)': 'Il prezzo di UNA unita’, IVA esclusa. Il totale della riga lo fa il gestionale: prezzo per quantita’.',
    'quantità': 'Quante unita’: metri quadri, ore, pezzi. Moltiplicata per il prezzo unitario fa il totale della riga.',
    'unità di misura': 'In cosa la misuri: m², m, kg, ore, corpo (a corpo). Finisce stampata sul documento accanto alla quantita’.',

    /* ---- computo metrico ---- */
    'parti uguali': 'Quante volte si ripete la stessa misura. Tre finestre identiche: scrivi 3 e la misuri una volta sola.',
    'lunghezza': 'Il primo lato, in metri. Il gestionale moltiplica parti × lunghezza × larghezza × altezza: la quantita’ non la scrivi mai a mano.',
    'larghezza': 'Il secondo lato, in metri. Lasciala vuota se stai misurando solo una lunghezza.',
    'altezza o spessore': 'Il terzo lato, in metri. Per un muro e’ l’altezza, per un massetto lo spessore. Vuota se non serve.',
    'questa misura': 'Il pezzo di opera che stai contando: «parete cucina», «vano finestra». Serve a te fra sei mesi, e al cliente che vuole capire da dove esce il numero.',
    'che cosa stai misurando': 'Il pezzo di opera che stai contando. Se metti un numero NEGATIVO togli quella quantita’: e’ cosi’ che si detraggono i vuoti delle porte e delle finestre.',
    'ribasso o sconto (%)': 'La percentuale che togli a tutti i prezzi del prezzario. Nelle gare pubbliche e’ il ribasso d’asta. Attenzione: si applica a TUTTO il computo, non a una voce sola.',
    'oneri della sicurezza (€)': 'La parte di prezzo che serve alla sicurezza del cantiere. Nei lavori pubblici va dichiarata a parte e NON e’ soggetta a ribasso: e’ la prima cosa che controllano.',
    'quanta parte del prezzo è costo del personale (%)': 'Quanto di quel prezzo e’ manodopera. Nelle gare pubbliche va dichiarato per legge. Sui lavori privati puoi lasciarlo stare.',
    'prezzario': 'Il listino ufficiale da cui prendi i prezzi (Tariffa Regione Lazio, DEI, il tuo). Sul documento deve esserci scritto: e’ la prima cosa che ti chiede chi lo legge.',
    'codice del prezzario': 'Il codice della voce sul listino (per esempio A.01.002). Serve a chi controlla per ritrovare la stessa voce sul prezzario ufficiale.',
    'da dove viene questo prezzo': 'Dal prezzario ufficiale o deciso da te. Un computo che non dice da dove vengono i prezzi non regge a un controllo.',
    'capitolo': 'Il raggruppamento delle lavorazioni: Demolizioni, Murature, Impianti. Serve a leggere il computo per fasi invece che come una lista lunghissima.',
    'titolo del capitolo': 'Come si chiama questo gruppo di lavorazioni: Demolizioni, Murature, Impianti.',
    'come si chiama questa tariffa?': 'Il nome del listino come lo scriveresti sul documento: «Tariffa Regione Lazio 2023», «Prezzario DEI», «Prezzi miei».',
    'questa aggiorna una tariffa che hai già?': 'Se dici di si’, i prezzi nuovi prendono il posto di quelli vecchi. I computi gia’ fatti NON cambiano: si portano dietro i prezzi del giorno in cui li hai scritti.',

    /* ---- pratiche e documenti ---- */
    'tipo di pratica': 'CILA, SCIA, permesso di costruire, agibilita’... Cambia i tempi, i documenti e quello che il Comune ti chiede.',
    'data di deposito': 'Il giorno in cui hai consegnato la pratica al Comune. Da li’ partono i termini: per la CILA si puo’ iniziare subito, per la SCIA no.',
    'dati catastali': 'Foglio, particella, subalterno. Sono l’indirizzo dell’immobile per il catasto: senza, la pratica non si presenta.',
    'oggetto dei lavori': 'Che lavoro e’, in una riga. Finisce in cima al documento: e’ la prima cosa che legge il cliente.',
    'oggetto dell\'incarico': 'Cosa ti sei impegnato a fare, scritto chiaro. E’ la parte della lettera d’incarico che conta se un domani si discute.',
    'opere comprese': 'Cosa e’ dentro il prezzo. Scriverlo evita la discussione peggiore: quella su cosa NON era compreso.',
    'prestazioni comprese': 'Cosa e’ dentro il compenso: rilievo, progetto, pratica, direzione lavori. Quello che non scrivi, il cliente dara’ per scontato che sia incluso.',
    'tempi di esecuzione': 'In quanto tempo lo fai, dall’inizio dei lavori. Mettilo in giorni lavorativi e di’ da quando partono.',
    'foro competente': 'Il tribunale in cui si discute se finite in causa. Di solito quello della tua citta’.',
    'luogo della firma': 'La citta’ dove il documento viene firmato. Va stampata accanto alla data.',
    'conclusioni': 'Come e’ andato il sopralluogo e cosa proponi. E’ la parte che il cliente legge davvero: le altre le salta.',

    /* ---- lavoro, squadra, mezzi ---- */
    'cosa è stato fatto (consuntivo)': 'Cosa hai fatto DAVVERO, a lavoro finito. E’ diverso da «cosa c’e’ da fare»: serve quando il cliente contesta, e per fatturare quello che hai fatto e non quello che avevi previsto.',
    'ore lavorate': 'Le ore che ci hai messo. Con il costo orario della persona, il gestionale ti dice quanto ti e’ costata la manodopera e quanto ci guadagni davvero.',
    'costo orario (€)': 'Quanto ti costa un’ora di questa persona: paga, contributi e tutto il resto. Non e’ quello che le dai in busta: e’ quello che esce dalla cassa. Entra nel margine di ogni lavoro.',
    'mansione in cantiere': 'Cosa fa in cantiere: muratore, aiuto, gruista. E’ diverso dal «ruolo nell’app», che dice cosa vede sul telefono.',
    'permessi': 'Cosa vede e cosa puo’ fare dal telefono. Senza nessuna spunta apre l’app e trova il lucchetto: le spunte servono, non sono decorazione.',
    'ruolo nell\'app': 'Riempie i permessi con la scelta piu’ comune per quel ruolo. Puoi sempre cambiarli uno per uno qui sotto.',
    'tipo di contratto': 'Indeterminato, determinato, apprendistato, a chiamata. Serve a te per sapere chi hai in squadra e fino a quando.',
    'massimale (€)': 'Il tetto massimo che l’assicurazione paga. Sotto quella cifra copre, sopra paghi tu.',
    'numero di polizza': 'Il numero che identifica la tua assicurazione. Alcuni committenti lo chiedono prima di farti entrare in cantiere.',
    'si ripete': 'Ogni quanto torna: revisione, bollo, visita medica. Il gestionale te la rimette da sola alla scadenza dopo, senza che te la ricordi tu.',
    'rapportini di giornata': 'Li scrive chi sta in cantiere, dal telefono: ore, materiali, cosa e’ stato fatto. Tu li leggi qui la sera, senza telefonate.',
    'note (compaiono sul pdf)': 'ATTENZIONE: queste le LEGGE IL CLIENTE, sono stampate sul documento. Le note che vuoi tenere per te vanno nel campo «Note» del lavoro, non qui.',
    'titolare (chi ce l\'ha in tasca)': 'La persona che ha in mano la carta. Le spese che registra finiscono su di lui, e sul suo telefono vede solo la sua carta.',
    'crediti (cfp)': 'I crediti formativi che ti da’ questo corso. Li conta il tuo Ordine: se non arrivi al minimo dell’anno rischi la sospensione.',
    'crediti formativi da fare ogni anno (cfp)': 'Quanti CFP ti chiede il tuo Ordine ogni anno. Per molti sono 30, ma controlla il regolamento tuo: cambia da Ordine a Ordine.',

    'cassa previdenziale': 'Il contributo per la tua cassa (Inarcassa, Geometri, EPPI, INPS). Si calcola SOLO sul compenso, non sulle spese, e si aggiunge in fattura: lo paga il cliente. La percentuale confermala al commercialista.',
    'ritenuta d\'acconto': 'Una parte del tuo compenso che il cliente NON ti paga: la versa lui allo Stato per conto tuo, come anticipo delle tue tasse. Di solito il 20%, e solo sul compenso. Non e\u2019 un costo: la ritrovi nella dichiarazione dei redditi.',
    'aliquota iva': 'La percentuale di IVA su questa voce. Le prestazioni professionali vanno al 22%. Il 10% e il 4% sono per chi esegue i lavori (ristrutturazione, prima casa), non per la parcella.',
    'imponibile': 'La somma su cui si calcola l\u2019IVA: compenso + cassa + spese. Non e\u2019 quello che incassi.',
    'imponibile iva': 'La somma su cui si calcola l\u2019IVA: compenso + cassa + spese. Non e\u2019 quello che incassi.',
    'spese (bolli, diritti, visure)': 'Quello che hai anticipato per conto del cliente: marche da bollo, diritti di segreteria, visure. Glielo riaddebiti tal quale, non e\u2019 un tuo guadagno.',
    'bollo (\u20ac)': 'La marca da bollo da 2 euro. Va sulle fatture senza IVA sopra i 77,47 euro (per esempio in forfettario). Se in fattura c\u2019e\u2019 l\u2019IVA, di solito non serve.',
    'sconto (\u20ac)': 'Uno sconto in euro sul totale. Si toglie dopo l\u2019IVA.',
    'codice destinatario': 'Il codice di 7 caratteri che dice allo SdI dove consegnare la fattura elettronica. Te lo da\u2019 il cliente. Se non ce l\u2019ha si mette 0000000 e gli arriva nel cassetto fiscale.',
    'regime fiscale': 'Ordinario (con IVA) o forfettario (senza IVA, con la dicitura di legge). Cambia tutta la fattura: controllalo col commercialista.',
    'giorni per il pagamento': 'Dopo quanti giorni dalla data scade il pagamento. Serve al gestionale per dirti quali fatture sono in ritardo.',
    'iban': 'Il conto su cui vuoi essere pagato. Finisce stampato sulla fattura e dentro il file per lo SdI.',
    'protocollo': 'Il numero che ti da\u2019 il Comune quando depositi la pratica. Scrivilo qui: lo ritrovi sulla card senza riaprire la mail.',
    'a che punto sta': 'Lo stato della pratica in Comune: da presentare, depositata, in istruttoria, integrazioni, conclusa. E\u2019 diverso da \u201cda fare / in corso / fatto\u201d, che dice a che punto sei TU.',
    'data prevista': 'Quando pensi di chiuderla. Con una scadenza collegata ti arriva l\u2019email 30 giorni prima, 7 giorni prima e il giorno prima.',
    'importo (\u20ac)': 'Quanto vale, IVA esclusa. E\u2019 il numero che diventa la riga della fattura: cassa, spese e IVA si aggiungono dopo, non metterle qui.',
    'che tipo di cliente \u00e8': 'Privato (codice fiscale), Azienda (partita IVA) o Condominio (con l\u2019amministratore). Cambia cosa ti serve per fatturare.',
    'obiettivo crediti': 'Quanti CFP ti servono nel periodo. Per molti Ordini sono 30 all\u2019anno, ma controlla il tuo regolamento.',
    'da incassare': 'Fatture gia\u2019 emesse che il cliente non ha ancora pagato. In rosso quelle scadute.',
    'da fatturare': 'Lavoro finito e mai fatturato. Sono soldi tuoi fermi: clicca per emettere la fattura.',
    'incassato': 'Quello che e\u2019 davvero entrato in cassa quest\u2019anno, al netto della ritenuta.',
    'il credito pi\u00f9 vecchio': 'Da quanti giorni aspetti il pagamento piu\u2019 arretrato. Se supera i 60, e\u2019 ora di telefonare.',
    'fatture emesse': 'Quante fatture hai numerato quest\u2019anno. La numerazione riparte da 1 ogni gennaio.',
    'emetti': 'Da\u2019 il numero definitivo alla fattura e la rende ufficiale. Dopo non si dovrebbe piu\u2019 cambiare.',
    'segna inviato': 'Segna che l\u2019hai mandata al cliente. Serve a te per ricordartene.',
    'accettato \u2192 crea pratica': 'Il cliente ha detto di si\u2019: il preventivo diventa una pratica. Se ne hai gia\u2019 una aperta per quel cliente ti chiede se collegarla, invece di crearne una doppia.',
    'accettato \u2192 crea lavoro': 'Il cliente ha detto di si\u2019: il preventivo diventa un lavoro. Se ne hai gia\u2019 uno aperto per quel cliente ti chiede se collegarlo, invece di crearne uno doppio.',
    'rifiutato': 'Il cliente ha detto di no. Il preventivo resta negli archivi, non sparisce.',
    'lettera d\'incarico': 'Il contratto da far firmare prima di iniziare: oggetto, compenso, tempi, recesso, foro e la doppia firma sulle clausole. Fattelo leggere una volta dal tuo legale.',
    'crea il pdf': 'Genera il PDF della fattura da mandare al cliente.',
    'allega un pdf tuo': 'Se la fattura la fa il commercialista, carica qui la sua: il gestionale usa quella.',
    'rimetti a posto': 'Riporta la scheda dov\u2019era, con tutti i suoi dati.',
    'elimina per sempre': 'Cancella davvero, senza ritorno. Se c\u2019e\u2019 ancora attaccato qualcosa che non e\u2019 nel cestino, si rifiuta e ti dice cosa.',
    'segna fatto': 'Chiude il lavoro e lo manda in \u201cda fatturare\u201d.',
    'avvia': 'Mette il lavoro in corso.'
  };
  /* queste finiscono con l'anno attaccato: "Incassato 2026" */
  var PREFISSI = ['incassato', 'fatture emesse'];

  /* ---------- il riquadro ---------- */
  var RITARDO = 350;      /* ms prima di comparire: così non lampeggia mentre muovi il mouse */
  var box = null, timer = null, ancora = null;

  function creaBox() {
    if (box) return box;
    var s = document.createElement('style');
    s.textContent =
      '#ti-aiuto{position:fixed;z-index:99999;max-width:300px;background:#0a2a4d;color:#fff;' +
      'font-family:inherit;font-size:14.5px;line-height:1.55;padding:12px 14px;border-radius:10px;' +
      'box-shadow:0 6px 24px rgba(10,42,77,.28);pointer-events:none;opacity:0;transition:opacity .14s;' +
      'transform:translateY(4px)}' +
      '#ti-aiuto.on{opacity:1;transform:translateY(0)}' +
      '@media (prefers-reduced-motion: reduce){#ti-aiuto{transition:none}}' +
      '@media (max-width:560px){#ti-aiuto{max-width:calc(100vw - 20px)}}';
    document.head.appendChild(s);
    box = document.createElement('div');
    box.id = 'ti-aiuto';
    box.setAttribute('role', 'tooltip');
    document.body.appendChild(box);
    return box;
  }

  function posiziona(el) {
    var r = el.getBoundingClientRect();
    var b = box.getBoundingClientRect();
    var m = 10;
    /* di lato se c'e' posto (il menu sta a sinistra), altrimenti sotto */
    var x = r.right + m, y = r.top;
    if (x + b.width > window.innerWidth - m) {
      x = Math.max(m, r.left);
      y = r.bottom + m;
    }
    if (y + b.height > window.innerHeight - m) y = Math.max(m, window.innerHeight - b.height - m);
    /* 9 agosto 2026 — su telefono il riquadro usciva a destra: qui lo si
       riporta dentro, sempre, qualunque strada abbia preso sopra. */
    x = Math.min(x, window.innerWidth - b.width - m);
    x = Math.max(m, x);
    box.style.left = Math.round(x) + 'px';
    box.style.top = Math.round(y) + 'px';
  }

  function mostra(el, testo) {
    creaBox();
    box.textContent = testo;
    box.style.left = '-9999px';   /* misuro prima di piazzarlo */
    box.classList.add('on');
    posiziona(el);
    ancora = el;
  }

  function nascondi() {
    clearTimeout(timer);
    if (box) box.classList.remove('on');
    if (ancora && ancora.classList && ancora.classList.contains('ti-i')) ancora.setAttribute('aria-expanded', 'false');
    ancora = null;
    fissato = false;
  }

  function testoDi(el) {
    if (el.dataset.aiuto) return el.dataset.aiuto;              /* scritto a mano: vince su tutto */
    var studio = menuDaStudio();
    if (el.dataset.tab) {
      if (studio && AIUTI_TAB_STUDIO[el.dataset.tab]) return AIUTI_TAB_STUDIO[el.dataset.tab];
      if (AIUTI_TAB[el.dataset.tab]) return AIUTI_TAB[el.dataset.tab];
    }
    if (el.dataset.action) {
      if (studio && AIUTI_AZIONE_STUDIO[el.dataset.action]) return AIUTI_AZIONE_STUDIO[el.dataset.action];
      if (AIUTI_AZIONE[el.dataset.action]) return AIUTI_AZIONE[el.dataset.action];
    }
    /* ⚠️ 11 agosto 2026 — L'ULTIMA SPIAGGIA: la scritta sul pulsante.
       In AIUTI_TESTO c'erano gia' scritte da mesi le spiegazioni di «Emetti»,
       «Lettera d'incarico», «Accettato → crea lavoro», «Elimina per sempre»,
       «Rimetti a posto»... ma quella lista veniva consultata SOLO per le
       etichette dei form e per la fila di pulsanti delle card. Passando il
       mouse sul pulsante vero non compariva niente: il testo esisteva e non
       lo leggeva nessuno. Bastava questa riga. */
    return testoPerParola(el.textContent);
  }

  /* ===== 9 agosto 2026 — IL (i) TOCCABILE =====
     Prima questo file si spegneva del tutto sui telefoni ("if (!hover) return"),
     e un geometra in cantiere sta sul telefono. Adesso, dove serve, si aggiunge
     un (i) che e' un pulsante vero: si tocca e la spiegazione compare.
     Sui pulsanti delle card il (i) NON va dentro il pulsante (sarebbe un
     pulsante dentro un pulsante e toccarlo farebbe partire l'azione): se ne
     mette uno solo in fondo alla fila, che li spiega tutti insieme. */
  var conMouse = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var fissato = false, obs = null, stoScrivendo = false;

  function pulisci(t) {
    return String(t || '').replace(/\u24d8|\u2139/g, '').replace(/\(facoltativo\)/gi, '')
      .replace(/[*:]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
      /* 11 agosto 2026 \u2014 via i simboletti DAVANTI alla scritta: \u00ab\u2715 Rifiutato\u00bb,
         \u00ab\u29c9 Duplica\u00bb, \u00ab\ud83d\udc41 Apri scheda\u00bb, \u00ab\u2039 Indietro\u00bb, \u00ab+ Privato\u00bb. Solo davanti:
         dentro no, se no si rompe la chiave \u00abaccettato \u2192 crea lavoro\u00bb. */
      .replace(/^[^a-z0-9\u00e0-\u00ff]+/, '');
  }
  function testoPerParola(t) {
    var k = pulisci(t);
    if (AIUTI_TESTO[k]) return AIUTI_TESTO[k];
    for (var i = 0; i < PREFISSI.length; i++) if (k.indexOf(PREFISSI[i]) === 0) return AIUTI_TESTO[PREFISSI[i]];
    return '';
  }
  function stileI() {
    if (document.getElementById('ti-aiuto-css')) return;
    var s2 = document.createElement('style');
    s2.id = 'ti-aiuto-css';
    s2.textContent =
      '.ti-i{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;' +
      'min-width:19px;padding:0;margin:0 0 0 5px;border:1.5px solid currentColor;border-radius:50%;' +
      /* ⚠️ 13 px e' il minimo in tutto il gestionale (regola dislessia), e
         questa «i» stava a 11. Piccola com'era non si distingueva nemmeno
         da un puntino sporco sullo schermo. 14 agosto 2026. */
      'background:transparent;color:#8a94a6;font:700 13px/1 Georgia,serif;cursor:help;' +
      'vertical-align:middle;opacity:.75;flex:none}' +
      '.ti-i:hover,.ti-i[aria-expanded=true]{opacity:1;color:#0b4bc4}' +
      '.ti-i:focus-visible{outline:2px solid #0b4bc4;outline-offset:2px}' +
      '.job-actions>.ti-i{margin-left:auto;align-self:center}' +
      '@media (max-width:560px){.ti-i{width:22px;height:22px;min-width:22px;font-size:13px;opacity:1}}';
    document.head.appendChild(s2);
  }
  function creaI(testo) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ti-i'; b.textContent = 'i';
    b.setAttribute('aria-label', 'Cosa vuol dire'); b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();     /* non deve premere il pulsante sotto */
      if (fissato && ancora === b) { nascondi(); return; }
      mostra(b, testo); fissato = true; b.setAttribute('aria-expanded', 'true');
    });
    if (conMouse) {
      b.addEventListener('mouseenter', function () { if (!fissato) mostra(b, testo); });
      b.addEventListener('mouseleave', function () { if (!fissato) nascondi(); });
    }
    return b;
  }
  function attaccaI(el, testo) {
    if (!el || el.dataset.tiI) return;
    el.dataset.tiI = '1';
    el.appendChild(document.createTextNode(' '));
    el.appendChild(creaI(testo));
  }
  function passata() {
    if (stoScrivendo) return;
    stoScrivendo = true;
    try {
      stileI();
      document.querySelectorAll('label:not([data-ti-i])').forEach(function (l) {
        var t = testoPerParola(l.textContent); if (t) attaccaI(l, t);
      });
      document.querySelectorAll('.fatt-tot > .l:not([data-ti-i])').forEach(function (l) {
        var t = testoPerParola(l.textContent); if (t) attaccaI(l, t);
      });
      document.querySelectorAll('.job-actions:not([data-ti-i])').forEach(function (riga) {
        var voci = [];
        riga.querySelectorAll('button, .btn').forEach(function (b) {
          if (b.classList.contains('ti-i')) return;
          var t = testoDi(b) || testoPerParola(b.textContent);
          if (t) voci.push('\u2022 ' + b.textContent.trim() + ': ' + t);
        });
        riga.dataset.tiI = '1';
        if (voci.length) riga.appendChild(creaI(voci.join('\n\n')));
      });
      /* ⚠️ NEL MENU DI NAVIGAZIONE NON SI ATTACCA NIENTE — 14 agosto 2026.
         Difetto vero, visto da Alessio sull'iPhone e riprodotto qui in
         modalita' touch vera (nuove/touch-iphone.py): senza mouse questo
         pezzo attaccava una (i) a TUTTE E 18 le voci del menu ☰. Ogni voce
         passava da 42 a 69 px e diventava un riquadro alto con dentro una
         casellina, cioe' il menu non si leggeva piu' a colpo d'occhio —
         che e' esattamente quello che serve a chi ha la dislessia.
         Le prove di prima non lo vedevano perche' giravano a 390 px su un
         finto computer, dove hover:hover resta acceso e conMouse e' true.

         Nel menu la (i) non serve: la voce ha gia' l'icona e il suo nome
         («Fatture», «Cestino»), e appena entri la sezione si presenta da
         sola con la sua riga di spiegazione. Le (i) restano dove servono
         davvero: le etichette dei moduli, i totali della fattura, i
         pulsanti del lavoro. Scelta di Alessio, 14 agosto sera.

         Resta invece [data-aiuto] fuori dal menu: li' la (i) e' l'unico
         aiuto che funziona al tocco, ed e' quello per cui era nata. */
      if (!conMouse) {
        document.querySelectorAll('[data-aiuto]:not([data-ti-i])').forEach(function (el) {
          if (el.closest('.side') || el.hasAttribute('data-tab')) return;   /* il menu no */
          var t = testoDi(el); if (!t) return;
          var dove = el.querySelector('span:not(.tab-cnt)') || el;
          if (dove.dataset.tiI) return;
          attaccaI(dove, t);
        });
      }
    } finally { stoScrivendo = false; }
  }

  function avvia() {
    /* Il (i) va messo SEMPRE: e' l'unico aiuto che funziona al tocco.
       Prima qui c'era un "return" che spegneva tutto sui telefoni. */
    passata();
    if (!obs) {
      obs = new MutationObserver(function () { passata(); });
      obs.observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.ti-i')) nascondi();
    });

    /* il passaggio del mouse resta com'era, ma solo dove il mouse c'e' davvero */
    if (!conMouse) return;

    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest('[data-tab],[data-action],[data-aiuto]');
      if (!el || el === ancora) return;
      var t = testoDi(el);
      if (!t) return;
      /* il title del browser darebbe due riquadri sovrapposti: lo metto da parte */
      if (el.title) { el.dataset.titleOff = el.title; el.removeAttribute('title'); }
      clearTimeout(timer);
      timer = setTimeout(function () { mostra(el, t); }, RITARDO);
    });

    document.addEventListener('mouseout', function (e) {
      var el = e.target.closest('[data-tab],[data-action],[data-aiuto]');
      if (!el) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      nascondi();
    });

    /* il riquadro non deve restare appeso quando succede altro */
    window.addEventListener('scroll', nascondi, true);
    window.addEventListener('blur', nascondi);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') nascondi(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
