/* =========================================================================
   LE TAVOLE DEL DECRETO PARAMETRI — DM 17 giugno 2016
   =========================================================================
   Da dove vengono questi numeri: dall'allegato ufficiale del decreto,
   pubblicato in Gazzetta Ufficiale n.174 del 27 luglio 2016, pagine 69-78
   (file dell'Istituto Poligrafico dello Stato). Sono stati LETTI dal PDF,
   non scritti a memoria, e ricontrollati con due metodi indipendenti.

   ⛔ NON TOCCARE QUESTI NUMERI A MANO. Sono numeri di legge: se se ne
   sbaglia uno, il gestionale calcola un compenso, lo scrive bene, e nessuno
   si accorge che e' sbagliato. Quando il decreto cambia, si rifa' la lettura
   dal PDF nuovo e si sostituisce questo file intero.

   ⚠️ DUE COSE DA SAPERE, che a guardare la tavola non si vedono:

   1. Le colonne NON sono otto. STRUTTURE e IMPIANTI sono spaccate in due,
      e i due numeri sono diversi:
        STRUTTURE_A = categorie S.01 e S.03      (lo dice l'intestazione)
        STRUTTURE_B = categorie S.02, S.04, S.05, S.06
        IMPIANTI_A  = categorie IA.xx
        IMPIANTI_B  = categorie IB.xx
      Esempio vero, riga QbII.01: impianti A = 0,16 · impianti B = 0,20.
      Chi legge "otto colonne" sbaglia del 20% su meta' degli impianti.

   2. 13 prestazioni non hanno un numero solo, ma UNO PER FASCIA D'IMPORTO,
      a scaglioni come l'IRPEF (campo `scaglioni` invece di `q`).
      ========================================================================= */
(function(){
  'use strict';

  var FONTE = {
    decreto:  'DM 17 giugno 2016 — decreto parametri',
    gazzetta: 'GU Serie Generale n.174 del 27-7-2016',
    letto_il: '22 agosto 2026',
    nota:     'Il correttivo D.Lgs. 209/2024 non ha cambiato i valori di G e Q: ha cambiato come le prestazioni si raggruppano nei livelli di progetto.'
  };

  /* ---- TAVOLA Z-1: categorie delle opere e grado di complessita' G ---- */
  var Z1 = [
    {cod:'E.01', col:'EDILIZIA', gruppo:'Edilizia', G:0.65, opere:'Edifici rurali per l\'attività agricola con corredi tecnici di tipo semplice (quali tettoie, depositi e ricoveri) - Edifici industriali o artigianali di importanza costruttiva corrente con corredi tecnici di base.'},
    {cod:'E.02', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Edifici rurali per l\'attività agricola con corredi tecnici di tipo complesso - Edifici industriali o artigianali con organizzazione e corredi tecnici di tipo complesso.'},
    {cod:'E.03', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Ostelli, Pensioni, Case albergo – Ristoranti - Motel e stazioni di servizio - negozi - mercati coperti di tipo semplice'},
    {cod:'E.04', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Alberghi, Villaggi turistici - Mercati e Centri commerciali complessi'},
    {cod:'E.05', col:'EDILIZIA', gruppo:'Edilizia', G:0.65, opere:'Edifici, pertinenze, autorimesse semplici, senza particolari esigenze tecniche. Edifici provvisori di modesta importanza'},
    {cod:'E.06', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Edilizia residenziale privata e pubblica di tipo corrente con costi di costruzione nella media di mercato e con tipologie standardizzate.'},
    {cod:'E.07', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Edifici residenziali di tipo pregiato con costi di costruzione eccedenti la media di mercato e con tipologie diversificate.'},
    {cod:'E.08', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Sede Azienda Sanitaria, Distretto sanitario, Ambulatori di base. Asilo Nido, Scuola Materna, Scuola elementare, Scuole secondarie di primo grado fino a 24 classi, Scuole secondarie di secondo grado fino a 25 classi'},
    {cod:'E.09', col:'EDILIZIA', gruppo:'Edilizia', G:1.15, opere:'Scuole secondarie di primo grado oltre 24 classi-Istituti scolastici superiori oltre 25 classi- Case di cura'},
    {cod:'E.10', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Poliambulatori, Ospedali, Istituti di ricerca, Centri di riabilitazione, Poli scolastici, Università, Accademie, Istituti di ricerca universitaria'},
    {cod:'E.11', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Padiglioni provvisori per esposizioni - Costruzioni relative ad opere cimiteriali di tipo normale (colombari, ossari, loculari, edicole funerarie con caratteristiche costruttive semplici), Case parrocchiali, Oratori - Stabilimenti balneari - Aree ed attrezzature per lo sport all\'aperto, Campo sportivo e servizi annessi, di tipo semplice'},
    {cod:'E.12', col:'EDILIZIA', gruppo:'Edilizia', G:1.15, opere:'Aree ed attrezzature per lo sport all\'aperto, Campo sportivo e servizi annessi, di tipo complesso- Palestre e piscine coperte'},
    {cod:'E.13', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Biblioteca, Cinema, Teatro, Pinacoteca, Centro Culturale, Sede congressuale, Auditorium, Museo, Galleria d\'arte, Discoteca, Studio radiofonico o televisivo o di produzione cinematografica - Opere cimiteriali di tipo monumentale, Monumenti commemorativi, Palasport, Stadio, Chiese'},
    {cod:'E.14', col:'EDILIZIA', gruppo:'Edilizia', G:0.65, opere:'Edifici provvisori di modesta importanza a servizio di caserme'},
    {cod:'E.15', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Caserme con corredi tecnici di importanza corrente'},
    {cod:'E.16', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Sedi ed Uffici di Società ed Enti, Sedi ed Uffici comunali, Sedi ed Uffici provinciali, Sedi ed Uffici regionali, Sedi ed Uffici ministeriali, Pretura, Tribunale, Palazzo di giustizia, Penitenziari, Caserme con corredi tecnici di importanza maggiore, Questura'},
    {cod:'E.17', col:'EDILIZIA', gruppo:'Edilizia', G:0.65, opere:'Verde ed opere di arredo urbano improntate a grande semplicità, pertinenziali agli edifici ed alla viabilità, Campeggi e simili'},
    {cod:'E.18', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Arredamenti con elementi acquistati dal mercato, Giardini, Parchi gioco, Piazze e spazi pubblici all\'aperto'},
    {cod:'E.19', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Arredamenti con elementi singolari, Parchi urbani, Parchi ludici attrezzati, Giardini e piazze storiche, Opere di riqualificazione paesaggistica e ambientale di aree urbane.'},
    {cod:'E.20', col:'EDILIZIA', gruppo:'Edilizia', G:0.95, opere:'Interventi di manutenzione straordinaria, ristrutturazione, riqualificazione, su edifici e manufatti esistenti'},
    {cod:'E.21', col:'EDILIZIA', gruppo:'Edilizia', G:1.2, opere:'Interventi di manutenzione straordinaria, restauro, ristrutturazione, riqualificazione, su edifici e manufatti di interesse storico artistico non'},
    {cod:'E.22', col:'EDILIZIA', gruppo:'Edilizia', G:1.55, opere:'Interventi di manutenzione, restauro, risanamento conservativo, riqualificazione, su edifici e manufatti di interesse storico artistico soggetti'},
    {cod:'S.01', col:'STRUTTURE_A', gruppo:'Strutture', G:0.7, opere:'Strutture o parti di strutture in cemento armato, non soggette ad azioni sismiche - riparazione o intervento locale - Verifiche strutturali relative - Ponteggi, centinature e strutture provvisionali di durata inferiore a due anni'},
    {cod:'S.02', col:'STRUTTURE_B', gruppo:'Strutture', G:0.5, opere:'Strutture o parti di strutture in muratura, legno, metallo, non soggette ad azioni sismiche - riparazione o intervento locale - Verifiche strutturali relative,'},
    {cod:'S.03', col:'STRUTTURE_A', gruppo:'Strutture', G:0.95, opere:'Strutture o parti di strutture in cemento armato - Verifiche strutturali relative - Ponteggi, centinature e strutture provvisionali di durata superiore a due anni.'},
    {cod:'S.04', col:'STRUTTURE_B', gruppo:'Strutture', G:0.9, opere:'Strutture o parti di strutture in muratura, legno, metallo - Verifiche strutturali relative - Consolidamento delle opere di fondazione di manufatti dissestati - Ponti, Paratie e tiranti, Consolidamento di pendii e di fronti rocciosi ed opere connesse, di tipo corrente - Verifiche strutturali relative.'},
    {cod:'S.05', col:'STRUTTURE_B', gruppo:'Strutture', G:1.05, opere:'Dighe, Conche, Elevatori, Opere di ritenuta e di difesa, rilevati, colmate. Gallerie, Opere sotterranee e subacquee, Fondazioni speciali.'},
    {cod:'S.06', col:'STRUTTURE_B', gruppo:'Strutture', G:1.15, opere:'Opere strutturali di notevole importanza costruttiva e richiedenti calcolazioni particolari - Verifiche strutturali relative - Strutture con metodologie normative che richiedono modellazione particolare: edifici alti con necessità di valutazioni di secondo ordine.'},
    {cod:'IA.01', col:'IMPIANTI_A', gruppo:'Impianti', G:0.75, opere:'Impianti per l\'approvvigionamento, la preparazione e la distribuzione di acqua nell\'interno di edifici o per scopi industriali - Impianti sanitari - Impianti di fognatura domestica od industriale ed opere relative al t r a t t a m e n to d e lle a c q u e di r if iu t o - R e ti d i d i s t r ib u z i o n e d i c o m b u s ti b i li l i q u i d i o g a s s o si - I mpianti per la d i s t r ib u z io n e d e ll\' a r ia c o m p r e s s a d e l v u o t o e d i g a s m e d i c a l i - I m p i a n t i e r e t i a n t in c e n d io'},
    {cod:'IA.02', col:'IMPIANTI_A', gruppo:'Impianti', G:0.85, opere:'Impianti di riscaldamento - Impianto di raffrescamento, climatizzazione, trattamento dell\'aria - Impianti meccanici di distribuzione fluidi - Impianto solare termico'},
    {cod:'IA.03', col:'IMPIANTI_A', gruppo:'Impianti', G:1.15, opere:'Impianti elettrici in genere, impianti di illuminazione, telefonici, di rivelazione incendi, fotovoltaici, a corredo di edifici e costruzioni di importanza corrente - singole apparecchiature per laboratori e impianti pilota di tipo semplice'},
    {cod:'IA.04', col:'IMPIANTI_A', gruppo:'Impianti', G:1.3, opere:'Impianti elettrici in genere, impianti di illuminazione, telefonici, di sicurezza , di rivelazione incendi , fotovoltaici, a corredo di edifici e costruzioni complessi - cablaggi strutturati - impianti in fibra ottica - singole apparecchiature per laboratori e impianti pilota di tipo complesso'},
    {cod:'IB.04', col:'IMPIANTI_B', gruppo:'Impianti', G:0.55, opere:'Depositi e discariche senza trattamento dei rifiuti.'},
    {cod:'IB.05', col:'IMPIANTI_B', gruppo:'Impianti', G:0.7, opere:'Impianti per le industrie molitorie, cartarie, alimentari, delle fibre tessili naturali, del legno, del cuoio e simili. Impianti della industria chimica inorganica - Impianti della preparazione e distillazione dei combustibili -'},
    {cod:'IB.06', col:'IMPIANTI_B', gruppo:'Impianti', G:0.7, opere:'Impianti siderurgici - Officine meccaniche e laboratori - Cantieri navali - Fabbriche di cemento, calce, laterizi, vetrerie e ceramiche - Impianti per le industrie della fermentazione, chimico-alimentari e tintorie - Impianti termovalorizzatori e impianti di trattamento dei rifiuti - Impianti della industria chimica organica - Impianti della piccola industria chimica speciale - Impianti di metallurgia (esclusi quelli relativi al ferro) - Impianti per la preparazione ed il trattamento dei minerali per la sistemazione e coltivazione delle cave e'},
    {cod:'IB.07', col:'IMPIANTI_B', gruppo:'Impianti', G:0.75, opere:'miniere. Gli impianti precedentemente esposti quando siano di complessità particolarmente rilevante o comportanti rischi e problematiche ambientali molto rilevanti'},
    {cod:'IB.08', col:'IMPIANTI_B', gruppo:'Impianti', G:0.5, opere:'Impianti di linee e reti per trasmissioni e distribuzione di energia elettrica, telegrafia, telefonia.'},
    {cod:'IB.09', col:'IMPIANTI_B', gruppo:'Impianti', G:0.6, opere:'Centrali idroelettriche ordinarie - Stazioni di trasformazioni e di conversione impianti di trazione elettrica'},
    {cod:'IB.10', col:'IMPIANTI_B', gruppo:'Impianti', G:0.75, opere:'Impianti termoelettrici-Impianti dell\'elettrochimica - Impianti della elettrometallurgia - Laboratori con ridotte problematiche tecniche'},
    {cod:'IB.11', col:'IMPIANTI_B', gruppo:'Impianti', G:0.9, opere:'Campi fotovoltaici - Parchi eolici'},
    {cod:'IB.12', col:'IMPIANTI_B', gruppo:'Impianti', G:1.0, opere:'Micro Centrali idroelettriche-Impianti termoelettrici-Impianti della elettrometallurgia di tipo complesso a quello delle opere edili'},
    {cod:'V.01', col:'VIABILITA', gruppo:'Viabilità', G:0.4, opere:'Interventi di manutenzione su viabilità ordinaria'},
    {cod:'V.02', col:'VIABILITA', gruppo:'Viabilità', G:0.45, opere:'Strade, linee tramviarie, ferrovie, strade ferrate, di tipo ordinario, escluse le opere d\'arte da compensarsi a parte - Piste ciclabili'},
    {cod:'V.03', col:'VIABILITA', gruppo:'Viabilità', G:0.75, opere:'Strade, linee tramviarie, ferrovie, strade ferrate, con particolari difficoltà di studio, escluse le opere d\'arte e le stazioni, da compensarsi a parte. - Impianti teleferici e funicolari - Piste aeroportuali e simili.'},
    {cod:'D.01', col:'IDRAULICA', gruppo:'Idraulica', G:0.65, opere:'Opere di navigazione interna e portuali'},
    {cod:'D.02', col:'IDRAULICA', gruppo:'Idraulica', G:0.45, opere:'Bonifiche ed irrigazioni a deflusso naturale, sistemazione di corsi d\'acqua e di bacini montani'},
    {cod:'D.03', col:'IDRAULICA', gruppo:'Idraulica', G:0.55, opere:'Bonifiche ed irrigazioni con sollevamento meccanico di acqua (esclusi i macchinari) - Derivazioni d\'acqua per forza motrice e produzione di energia elettrica.'},
    {cod:'D.04', col:'IDRAULICA', gruppo:'Idraulica', G:0.65, opere:'Impianti per provvista, condotta, distribuzione d\'acqua, improntate a grande semplicità - Fognature urbane improntate a grande semplicità - Condotte subacquee in genere, metanodotti e gasdotti, di tipo ordinario'},
    {cod:'D.05', col:'IDRAULICA', gruppo:'Idraulica', G:0.8, opere:'Impianti per provvista, condotta, distribuzione d\'acqua - Fognature urbane - Condotte subacquee in genere, metanodotti e gasdotti, con problemi tecnici di tipo speciale.'},
    {cod:'T.01', col:'TECNOLOGIE', gruppo:'Tecnologie della informazione', G:0.95, opere:'Sistemi informativi, gestione elettronica del flusso documentale, dematerializzazione e gestione archivi, ingegnerizzazione dei processi, sistemi di gestione delle attività produttive, Data center, server farm.'},
    {cod:'T.02', col:'TECNOLOGIE', gruppo:'Tecnologie della informazione', G:0.7, opere:'Reti locali e geografiche, cablaggi strutturati, impianti in fibra ottica, Impianti di videosorveglianza, controllo accessi, identificazione targhe di veicoli ecc Sistemi wireless, reti wifi, ponti radio.'},
    {cod:'T.03', col:'TECNOLOGIE', gruppo:'Tecnologie della informazione', G:1.2, opere:'Elettronica Industriale Sistemi a controllo numerico, Sistemi di automazione, Robotica.'},
    {cod:'P.01', col:'PAESAGGIO', gruppo:'Paesaggio e ambiente', G:0.85, opere:'Opere relative alla sistemazione di ecosistemi naturali o naturalizzati, alle aree naturali protette ed alle aree a rilevanza faunistica. Opere relative al restauro paesaggistico di territori compromessi ed agli interventi su elementi strutturali del paesaggio. Opere di configurazione di assetto paesaggistico.'},
    {cod:'P.02', col:'PAESAGGIO', gruppo:'Paesaggio e ambiente', G:0.85, opere:'Opere a verde sia su piccola scala o grande scala dove la rilevanza dell\'opera è prevalente rispetto alle opere di tipo costruttivo.'},
    {cod:'P.03', col:'PAESAGGIO', gruppo:'Paesaggio e ambiente', G:0.85, opere:'Opere di riqualificazione e risanamento di ambiti naturali, rurali e forestali o urbani finalizzati al ripristino delle condizioni originarie, al riassetto delle componenti biotiche ed abiotiche.'},
    {cod:'P.04', col:'PAESAGGIO', gruppo:'Paesaggio e ambiente', G:0.85, opere:'Opere di utilizzazione di bacini estrattivi a parete o a fossa'},
    {cod:'P.05', col:'PAESAGGIO', gruppo:'Paesaggio e ambiente', G:0.85, opere:'Opere di assetto ed utilizzazione forestale nonché dell\'impiego ai fini industriali, energetici ed ambientali. Piste forestali, strade forestali– percorsi naturalistici, aree di sosta e di stazionamento dei mezzi forestali. Meccanizzazione forestale'},
    {cod:'P.06', col:'PAESAGGIO', gruppo:'Paesaggio e ambiente', G:0.85, opere:'Opere di intervento per la realizzazione di infrastrutture e di miglioramento dell\'assetto rurale.'},
    {cod:'U.01', col:'TERRITORIO', gruppo:'Territorio e urbanistica', G:0.9, opere:'Opere ed infrastrutture complesse, anche a carattere immateriale, volte a migliorare l\'assetto del territorio rurale per favorire lo sviluppo dei processi agricoli e zootecnici. Opere e strutture per la valorizzazione delle filiere (produzione, trasformazione e commercializzazione delle produzioni agricole e agroalimentari)'},
    {cod:'U.02', col:'TERRITORIO', gruppo:'Territorio e urbanistica', G:0.95, opere:'Interventi di valorizzazione degli ambiti naturali sia di tipo vegetazionale che faunistico'},
    {cod:'U.03', col:'TERRITORIO', gruppo:'Territorio e urbanistica', G:1.0, opere:'Strumenti di pianificazione generale ed attuativa e di pianificazione di settore'},
  ];

  /* ---- TAVOLA Z-2: prestazioni e parametri Q ---- */
  var Z2 = [
    {cod:'Qa.0.01', fase:'a.0 — programmazione e pianificazione', nome:'Pianificazione urbanistica generale (sino a 15.000 abitanti) Pianificazione urbanistica generale (da 15.000 abitanti a 50.000) Pianificazione urbanistica generale ( dei 50.000 abitanti)', a_mano:true, scaglioni:[
      {fascia:'—', fino_a:null, q:{"TERRITORIO": 0.005}},
      {fascia:'—', fino_a:null, q:{"TERRITORIO": 0.003}},
      {fascia:'sull\'eccedenza', fino_a:null, q:{"TERRITORIO": 0.001}},
    ]},
    {cod:'Qa.0.02', fase:'a.0 — programmazione e pianificazione', nome:'Abitanti 15.00 Rilievi e controlli del terreno, analisi geoambientali di risorse e rischi, studi di Abitanti 50.00 geologia applicati ai piani urbanistici generali, ambientali e di difesa del suolo', a_mano:true, scaglioni:[
      {fascia:'Fino a', fino_a:null, q:{"PAESAGGIO": 0.001, "TERRITORIO": 0.001}},
      {fascia:'Sull\'eccedenza fino a', fino_a:null, q:{"PAESAGGIO": 0.0005, "TERRITORIO": 0.0005}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"PAESAGGIO": 0.0001, "TERRITORIO": 0.0001}},
    ]},
    {cod:'Qa.0.03', fase:'a.0 — programmazione e pianificazione', nome:'Pianificazione forestale, paesaggistica, naturalistica ed ambientale', q:{"PAESAGGIO": 0.005, "TERRITORIO": 0.005}},
    {cod:'Qa.0.04', fase:'a.0 — programmazione e pianificazione', nome:'Piani aziendali agronomici, di concimazione, fertilizzazione, reflui e fitoiatrici', q:{"PAESAGGIO": 0.03}},
    {cod:'Qa.0.05', fase:'a.0 — programmazione e pianificazione', nome:'Programmazione economica, territoriale, locale e rurale', q:{"PAESAGGIO": 0.003, "TERRITORIO": 0.003}},
    {cod:'Qa.0.06', fase:'a.0 — programmazione e pianificazione', nome:'Piani urbanistici esecutivi, di sviluppo aziendale, di utilizzazione forestale (valore V sino a € 7.500.000,00)', a_mano:true, scaglioni:[
      {fascia:'—', fino_a:7500000, q:{"PAESAGGIO": 0.026, "TERRITORIO": 0.036}},
      {fascia:'sull\'eccedenza fino a € 15.000.000,00', fino_a:15000000, q:{"PAESAGGIO": 0.016, "TERRITORIO": 0.028}},
      {fascia:'sull\'eccedenza', fino_a:15000000, q:{"PAESAGGIO": 0.01, "TERRITORIO": 0.02}},
    ]},
    {cod:'Qa.0.07', fase:'a.0 — programmazione e pianificazione', nome:'Rilievi e controlli del terreno, analisi geoambientali di risorse e rischi, studi di geologia applicati ai piani urbanistici esecutivi, ambientali e di difesa del suolo', scaglioni:[
      {fascia:'Fino a € 4.000.000,00', fino_a:4000000, q:{"PAESAGGIO": 0.018, "TERRITORIO": 0.018}},
      {fascia:'Sull\'eccedenza € 10.000.000,0 fino a', fino_a:10000000, q:{"PAESAGGIO": 0.012, "TERRITORIO": 0.012}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"PAESAGGIO": 0.008, "TERRITORIO": 0.008}},
    ]},
    {cod:'QaI.01', fase:'a.I — studi di fattibilità', nome:'Relazione illustrativa', q:{"EDILIZIA": 0.045, "STRUTTURE_A": 0.045, "STRUTTURE_B": 0.045, "IMPIANTI_A": 0.045, "IMPIANTI_B": 0.045, "VIABILITA": 0.04, "IDRAULICA": 0.035, "TECNOLOGIE": 0.05, "PAESAGGIO": 0.04}},
    {cod:'QaI.02', fase:'a.I — studi di fattibilità', nome:'Relazione illustrativa, Elaborati progettuali e tecnico economici', q:{"EDILIZIA": 0.09, "STRUTTURE_A": 0.09, "STRUTTURE_B": 0.09, "IMPIANTI_A": 0.09, "IMPIANTI_B": 0.09, "VIABILITA": 0.08, "IDRAULICA": 0.07, "TECNOLOGIE": 0.1, "PAESAGGIO": 0.08}},
    {cod:'QaI.03', fase:'a.I — studi di fattibilità', nome:'Supporto al RUP: accertamenti e verifiche preliminari', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QaII.01', fase:'a.II — stime e valutazioni', nome:'Sintetiche, basate su elementi sintetici e globali, vani, metri cubi, etc. (d.P.R. 327/2001)', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.04, "IMPIANTI_B": 0.04, "VIABILITA": 0.04, "IDRAULICA": 0.04, "TECNOLOGIE": 0.04, "PAESAGGIO": 0.04}},
    {cod:'QaII.02', fase:'a.II — stime e valutazioni', nome:'Particolareggiate, complete di criteri di valutazione, relazione motivata, descrizioni computi e tipi (d.P.R. 327/2001)', q:{"EDILIZIA": 0.08, "STRUTTURE_A": 0.08, "STRUTTURE_B": 0.08, "IMPIANTI_A": 0.08, "IMPIANTI_B": 0.08, "VIABILITA": 0.08, "IDRAULICA": 0.08, "TECNOLOGIE": 0.08, "PAESAGGIO": 0.09}},
    {cod:'QaII.03', fase:'a.II — stime e valutazioni', nome:'Analitiche, integrate con specifiche e distinte, sullo stato e valore dei singoli componenti (d.P.R. 327/2001)', q:{"EDILIZIA": 0.16, "STRUTTURE_A": 0.16, "STRUTTURE_B": 0.16, "IMPIANTI_A": 0.16, "IMPIANTI_B": 0.16, "VIABILITA": 0.16, "IDRAULICA": 0.16, "TECNOLOGIE": 0.16, "PAESAGGIO": 0.16}},
    {cod:'QaIII.01', fase:'a.III — rilievi, studi e analisi', nome:'Rilievi, studi e classificazioni agronomiche, colturali, delle biomasse e delle attività produttive (d.Lgs 152/2006 – All.VI-VII)', q:{"PAESAGGIO": 0.02, "TERRITORIO": 0.0003}},
    {cod:'QaIII.02', fase:'a.III — rilievi, studi e analisi', nome:'Rilievo botanico e analisi vegetazionali dei popolamenti erbacei ed arborei ed animali (d.Lgs 152/2006 – All.VI-VII)', q:{"PAESAGGIO": 0.015, "TERRITORIO": 0.00025}},
    {cod:'QaIII.03', fase:'a.III — rilievi, studi e analisi', nome:'Elaborazioni, analisi e valutazioni con modelli numerici, software dedicati, (incendi boschivi, diffusione inquinanti, idrologia ed idrogeologia, regimazione delle acque, idraulica, colate di fango e di detriti, esondazioni, aree di pericolo, stabilità dei pendii, filtrazioni, reti ecologiche e dinamiche ecologiche) (d.Lgs 152/2006 – All.VI- VII)', q:{"PAESAGGIO": 0.025, "TERRITORIO": 0.03}},
    {cod:'QaIV.01', fase:'a.IV — piani economici', nome:'Piani economici, aziendali, business plan e di investimento', q:{"PAESAGGIO": 0.005, "TERRITORIO": 0.0015}},
    {cod:'QbI.01', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazioni, planimetrie, elaborati grafici', q:{"EDILIZIA": 0.09, "STRUTTURE_A": 0.09, "STRUTTURE_B": 0.09, "IMPIANTI_A": 0.09, "IMPIANTI_B": 0.09, "VIABILITA": 0.08, "IDRAULICA": 0.07, "TECNOLOGIE": 0.1, "PAESAGGIO": 0.08}},
    {cod:'QbI.02', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Calcolo sommario spesa, quadro economico di progetto', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbI.03', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Piano particellare preliminare delle aree o rilievo di massima degli immobili', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QbI.04', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Piano economico e finanziario di massima', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.03, "TECNOLOGIE": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbI.05', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Capitolato speciale descrittivo e prestazionale, schema di contratto', q:{"EDILIZIA": 0.07, "STRUTTURE_A": 0.07, "STRUTTURE_B": 0.07, "IMPIANTI_A": 0.07, "IMPIANTI_B": 0.07, "VIABILITA": 0.07, "IDRAULICA": 0.07, "TECNOLOGIE": 0.07, "PAESAGGIO": 0.07}},
    {cod:'QbI.06', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione geotecnica', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbI.07', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione idrologica', q:{"EDILIZIA": 0.015, "STRUTTURE_A": 0.015, "STRUTTURE_B": 0.015, "IMPIANTI_A": 0.015, "IMPIANTI_B": 0.015, "VIABILITA": 0.015, "IDRAULICA": 0.015, "PAESAGGIO": 0.015}},
    {cod:'QbI.08', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione idraulica', q:{"EDILIZIA": 0.015, "STRUTTURE_A": 0.015, "STRUTTURE_B": 0.015, "IMPIANTI_A": 0.015, "IMPIANTI_B": 0.015, "VIABILITA": 0.015, "IDRAULICA": 0.015, "PAESAGGIO": 0.015}},
    {cod:'QbI.09', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione sismica e sulle strutture', q:{"EDILIZIA": 0.015, "STRUTTURE_A": 0.015, "STRUTTURE_B": 0.015, "IMPIANTI_A": 0.015, "IMPIANTI_B": 0.015, "VIABILITA": 0.015, "IDRAULICA": 0.015, "PAESAGGIO": 0.015}},
    {cod:'QbI.10', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione archeologica', q:{"EDILIZIA": 0.015, "STRUTTURE_A": 0.015, "STRUTTURE_B": 0.015, "IMPIANTI_A": 0.015, "IMPIANTI_B": 0.015, "VIABILITA": 0.015, "IDRAULICA": 0.015, "PAESAGGIO": 0.015}},
    {cod:'QbI.11', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione geologica', scaglioni:[
      {fascia:'Fino a € 250.000,00', fino_a:250000, q:{"EDILIZIA": 0.039, "STRUTTURE_A": 0.039, "STRUTTURE_B": 0.053, "IMPIANTI_A": 0.039, "IMPIANTI_B": 0.039, "VIABILITA": 0.068, "IDRAULICA": 0.053, "PAESAGGIO": 0.053}},
      {fascia:'Sull\'eccedenza fino a € 500.000,00', fino_a:500000, q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.048, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.058, "IDRAULICA": 0.048, "PAESAGGIO": 0.048}},
      {fascia:'Sull\'eccedenza fino a € 1.000.000,00', fino_a:1000000, q:{"EDILIZIA": 0.013, "STRUTTURE_A": 0.013, "STRUTTURE_B": 0.044, "IMPIANTI_A": 0.013, "IMPIANTI_B": 0.013, "VIABILITA": 0.047, "IDRAULICA": 0.044, "PAESAGGIO": 0.044}},
      {fascia:'Sull\'eccedenza fino a € 2.500.000,00', fino_a:2500000, q:{"EDILIZIA": 0.018, "STRUTTURE_A": 0.018, "STRUTTURE_B": 0.042, "IMPIANTI_A": 0.018, "IMPIANTI_B": 0.018, "VIABILITA": 0.034, "IDRAULICA": 0.042, "PAESAGGIO": 0.042}},
      {fascia:'Sull\'eccedenza fino a € 10.000.000,00', fino_a:10000000, q:{"EDILIZIA": 0.022, "STRUTTURE_A": 0.022, "STRUTTURE_B": 0.027, "IMPIANTI_A": 0.022, "IMPIANTI_B": 0.022, "VIABILITA": 0.019, "IDRAULICA": 0.027, "PAESAGGIO": 0.027}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.021, "STRUTTURE_A": 0.021, "STRUTTURE_B": 0.025, "IMPIANTI_A": 0.021, "IMPIANTI_B": 0.021, "VIABILITA": 0.018, "IDRAULICA": 0.025, "PAESAGGIO": 0.025}},
    ]},
    {cod:'QbI.12', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Progettazione integrale e coordinata - Integrazione delle prestazioni specialistiche', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QbI.13', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Studio di inserimento urbanistico', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.03, "IDRAULICA": 0.01, "PAESAGGIO": 0.03}},
    {cod:'QbI.14', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Relazione tecnica sullo stato di consistenza degli immobili da ristrutturare', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03}},
    {cod:'QbI.15', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Prime indicazioni di progettazione antincendio (d.m. 6/02/1982)', q:{"EDILIZIA": 0.005, "STRUTTURE_A": 0.005, "STRUTTURE_B": 0.005, "IMPIANTI_A": 0.005, "IMPIANTI_B": 0.005}},
    {cod:'QbI.16', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Prime indicazioni e prescrizioni per la stesura dei Piani di Sicurezza', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbI.17', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Studi di prefattibilità ambientale', scaglioni:[
      {fascia:'Fino a € 5.000.000,00', fino_a:5000000, q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.035, "STRUTTURE_B": 0.035, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.035, "IDRAULICA": 0.035, "TECNOLOGIE": 0.03, "PAESAGGIO": 0.035}},
      {fascia:'Sull\'eccedenza fino a € 20.000.000,00', fino_a:20000000, q:{"EDILIZIA": 0.015, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.015, "IMPIANTI_B": 0.015, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.015, "PAESAGGIO": 0.02}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.005, "STRUTTURE_A": 0.008, "STRUTTURE_B": 0.008, "IMPIANTI_A": 0.005, "IMPIANTI_B": 0.005, "VIABILITA": 0.008, "IDRAULICA": 0.008, "TECNOLOGIE": 0.005, "PAESAGGIO": 0.008}},
    ]},
    {cod:'QbI.18', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Piano di monitoraggio ambientale', scaglioni:[
      {fascia:'Fino a € 5.000.000,00', fino_a:5000000, q:{"EDILIZIA": 0.018, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.018, "IMPIANTI_B": 0.018, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.018, "PAESAGGIO": 0.02}},
      {fascia:'Sull\'eccedenza fino a € 20.000.000,00', fino_a:20000000, q:{"EDILIZIA": 0.008, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.008, "IMPIANTI_B": 0.008, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.008, "PAESAGGIO": 0.01}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.004, "STRUTTURE_A": 0.005, "STRUTTURE_B": 0.005, "IMPIANTI_A": 0.004, "IMPIANTI_B": 0.004, "VIABILITA": 0.005, "IDRAULICA": 0.005, "TECNOLOGIE": 0.004, "PAESAGGIO": 0.005}},
    ]},
    {cod:'QbI.19', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Supporto al RUP: supervisione e coordinamento della progettazione preliminare', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbI.20', fase:'b.I — progetto di fattibilità (preliminare)', nome:'Supporto al RUP: verifica della progettazione preliminare', q:{"EDILIZIA": 0.06, "STRUTTURE_A": 0.06, "STRUTTURE_B": 0.06, "IMPIANTI_A": 0.06, "IMPIANTI_B": 0.06, "VIABILITA": 0.06, "IDRAULICA": 0.06, "TECNOLOGIE": 0.06, "PAESAGGIO": 0.06}},
    {cod:'QbII.01', fase:'b.II — progetto definitivo', nome:'Relazioni generale e tecniche, Elaborati grafici, Calcolo delle strutture e degli impianti, eventuali Relazione sulla risoluzione delle interferenze e Relazione sulla gestione materie', q:{"EDILIZIA": 0.23, "STRUTTURE_A": 0.18, "STRUTTURE_B": 0.18, "IMPIANTI_A": 0.16, "IMPIANTI_B": 0.2, "VIABILITA": 0.22, "IDRAULICA": 0.18, "TECNOLOGIE": 0.25, "PAESAGGIO": 0.18}},
    {cod:'QbII.02', fase:'b.II — progetto definitivo', nome:'Rilievi dei manufatti', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.04, "IMPIANTI_B": 0.04}},
    {cod:'QbII.03', fase:'b.II — progetto definitivo', nome:'Disciplinare descrittivo e prestazionale', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbII.04', fase:'b.II — progetto definitivo', nome:'Piano particellare d\'esproprio', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.04, "IMPIANTI_B": 0.04, "VIABILITA": 0.04, "IDRAULICA": 0.04, "PAESAGGIO": 0.04}},
    {cod:'QbII.05', fase:'b.II — progetto definitivo', nome:'Elenco prezzi unitari ed eventuali analisi, Computo metrico estimativo, Quadro economic', q:{"EDILIZIA": 0.07, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.07, "IMPIANTI_B": 0.07, "VIABILITA": 0.06, "IDRAULICA": 0.05, "TECNOLOGIE": 0.05, "PAESAGGIO": 0.05}},
    {cod:'QbII.06', fase:'b.II — progetto definitivo', nome:'Studio di inserimento urbanistico', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.03, "IDRAULICA": 0.01, "PAESAGGIO": 0.03}},
    {cod:'QbII.07', fase:'b.II — progetto definitivo', nome:'Rilievi planoaltimetrici', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QbII.08', fase:'b.II — progetto definitivo', nome:'7 Schema di contratto, Capitolato speciale d\'appalto', q:{"EDILIZIA": 0.07, "STRUTTURE_A": 0.07, "STRUTTURE_B": 0.07, "IMPIANTI_A": 0.08, "IMPIANTI_B": 0.08, "VIABILITA": 0.07, "IDRAULICA": 0.07, "TECNOLOGIE": 0.07, "PAESAGGIO": 0.07}},
    {cod:'QbII.09', fase:'b.II — progetto definitivo', nome:'Relazione geotecnica', q:{"EDILIZIA": 0.06, "STRUTTURE_A": 0.06, "STRUTTURE_B": 0.06, "IMPIANTI_A": 0.06, "IMPIANTI_B": 0.06, "VIABILITA": 0.06, "IDRAULICA": 0.06, "PAESAGGIO": 0.06}},
    {cod:'QbII.10', fase:'b.II — progetto definitivo', nome:'Relazione idrologica', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbII.11', fase:'b.II — progetto definitivo', nome:'Relazione idraulica', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbII.12', fase:'b.II — progetto definitivo', nome:'Relazione sismica e sulle strutture', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbII.13', fase:'b.II — progetto definitivo', nome:'Relazione geologica', scaglioni:[
      {fascia:'Fino a € 250.000,00', fino_a:250000, q:{"EDILIZIA": 0.064, "STRUTTURE_A": 0.064, "STRUTTURE_B": 0.133, "IMPIANTI_A": 0.064, "IMPIANTI_B": 0.064, "VIABILITA": 0.145, "IDRAULICA": 0.133, "PAESAGGIO": 0.133}},
      {fascia:'Sull\'eccedenza fino a € 500.000,00', fino_a:500000, q:{"EDILIZIA": 0.019, "STRUTTURE_A": 0.019, "STRUTTURE_B": 0.107, "IMPIANTI_A": 0.019, "IMPIANTI_B": 0.019, "VIABILITA": 0.114, "IDRAULICA": 0.107, "PAESAGGIO": 0.107}},
      {fascia:'Sull\'eccedenza fino a € 1.000.000,00', fino_a:1000000, q:{"EDILIZIA": 0.021, "STRUTTURE_A": 0.021, "STRUTTURE_B": 0.096, "IMPIANTI_A": 0.021, "IMPIANTI_B": 0.021, "VIABILITA": 0.07, "IDRAULICA": 0.096, "PAESAGGIO": 0.096}},
      {fascia:'Sull\'eccedenza fino a € 2.500.000,00', fino_a:2500000, q:{"EDILIZIA": 0.029, "STRUTTURE_A": 0.029, "STRUTTURE_B": 0.079, "IMPIANTI_A": 0.029, "IMPIANTI_B": 0.029, "VIABILITA": 0.035, "IDRAULICA": 0.079, "PAESAGGIO": 0.079}},
      {fascia:'Sull\'eccedenza fino a € 10.000.000,00', fino_a:10000000, q:{"EDILIZIA": 0.038, "STRUTTURE_A": 0.038, "STRUTTURE_B": 0.054, "IMPIANTI_A": 0.038, "IMPIANTI_B": 0.038, "VIABILITA": 0.02, "IDRAULICA": 0.054, "PAESAGGIO": 0.054}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.028, "STRUTTURE_A": 0.028, "STRUTTURE_B": 0.035, "IMPIANTI_A": 0.028, "IMPIANTI_B": 0.028, "VIABILITA": 0.018, "IDRAULICA": 0.035, "PAESAGGIO": 0.035}},
    ]},
    {cod:'QbII.14', fase:'b.II — progetto definitivo', nome:'Analisi storico critica e relazione sulle strutture esistenti', q:{"STRUTTURE_A": 0.09, "STRUTTURE_B": 0.09}},
    {cod:'QbII.15', fase:'b.II — progetto definitivo', nome:'Relazione sulle indagini dei materiali e delle strutture per edifici esistenti', q:{"STRUTTURE_A": 0.12, "STRUTTURE_B": 0.12}},
    {cod:'QbII.16', fase:'b.II — progetto definitivo', nome:'Verifica sismica delle strutture esistenti e individuazione delle carenze strutturali', q:{"STRUTTURE_A": 0.18, "STRUTTURE_B": 0.18}},
    {cod:'QbII.17', fase:'b.II — progetto definitivo', nome:'Progettazione integrale e coordinata - Integrazione delle prestazioni specialistiche', q:{"EDILIZIA": 0.05, "STRUTTURE_A": 0.05, "STRUTTURE_B": 0.05, "IMPIANTI_A": 0.05, "IMPIANTI_B": 0.05, "VIABILITA": 0.05, "IDRAULICA": 0.05, "TECNOLOGIE": 0.05, "PAESAGGIO": 0.05}},
    {cod:'QbII.18', fase:'b.II — progetto definitivo', nome:'Elaborati di progettazione antincendio (d.m. 16/02/1982)', q:{"EDILIZIA": 0.06, "STRUTTURE_A": 0.06, "STRUTTURE_B": 0.06, "IMPIANTI_A": 0.06, "IMPIANTI_B": 0.06}},
    {cod:'QbII.19', fase:'b.II — progetto definitivo', nome:'Relazione paesaggistica (d.lgs. 42/2004)', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QbII.20', fase:'b.II — progetto definitivo', nome:'Elaborati e relazioni per requisiti acustici (Legge 447/95-d.p.c.m. 512/97)', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02}},
    {cod:'QbII.21', fase:'b.II — progetto definitivo', nome:'Relazione energetica (ex Legge 10/91 e s.m.i.)', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03}},
    {cod:'QbII.22', fase:'b.II — progetto definitivo', nome:'Diagnosi energetica (ex Legge 10/91 e s.m.i.) degli edifici esistenti, esclusi i rilievi e le indagini', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02}},
    {cod:'QbII.23', fase:'b.II — progetto definitivo', nome:'Aggiornamento delle prime indicazioni e prescrizioni per la redazione del PSC', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbII.24', fase:'b.II — progetto definitivo', nome:'Studio di impatto ambientale o di fattibilità ambientale (VIA-VAS- AIA)', scaglioni:[
      {fascia:'Fino a € 5.000.000,00', fino_a:5000000, q:{"EDILIZIA": 0.09, "STRUTTURE_A": 0.1, "STRUTTURE_B": 0.1, "IMPIANTI_A": 0.09, "IMPIANTI_B": 0.09, "VIABILITA": 0.1, "IDRAULICA": 0.1, "TECNOLOGIE": 0.09, "PAESAGGIO": 0.1}},
      {fascia:'Sull\'eccedenza fino a € 20.000.000,00', fino_a:20000000, q:{"EDILIZIA": 0.045, "STRUTTURE_A": 0.06, "STRUTTURE_B": 0.06, "IMPIANTI_A": 0.045, "IMPIANTI_B": 0.045, "VIABILITA": 0.06, "IDRAULICA": 0.06, "TECNOLOGIE": 0.045, "PAESAGGIO": 0.06}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.015, "STRUTTURE_A": 0.025, "STRUTTURE_B": 0.025, "IMPIANTI_A": 0.015, "IMPIANTI_B": 0.015, "VIABILITA": 0.025, "IDRAULICA": 0.025, "TECNOLOGIE": 0.015, "PAESAGGIO": 0.025}},
    ]},
    {cod:'QbII.25', fase:'b.II — progetto definitivo', nome:'Piano di monitoraggio ambientale', scaglioni:[
      {fascia:'Fino a € 5.000.000,00', fino_a:5000000, q:{"EDILIZIA": 0.018, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.018, "IMPIANTI_B": 0.018, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.018, "PAESAGGIO": 0.02}},
      {fascia:'Sull\'eccedenza fino a € 20.000.000,00', fino_a:20000000, q:{"EDILIZIA": 0.008, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.008, "IMPIANTI_B": 0.008, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.008, "PAESAGGIO": 0.01}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.004, "STRUTTURE_A": 0.005, "STRUTTURE_B": 0.005, "IMPIANTI_A": 0.004, "IMPIANTI_B": 0.004, "VIABILITA": 0.005, "IDRAULICA": 0.005, "TECNOLOGIE": 0.004, "PAESAGGIO": 0.005}},
    ]},
    {cod:'QbII.26', fase:'b.II — progetto definitivo', nome:'Supporto al RUP: supervisione e coordinamento della prog. def.', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbII.27', fase:'b.II — progetto definitivo', nome:'Supporto RUP: verifica della prog. def.', q:{"EDILIZIA": 0.13, "STRUTTURE_A": 0.13, "STRUTTURE_B": 0.13, "IMPIANTI_A": 0.13, "IMPIANTI_B": 0.13, "VIABILITA": 0.13, "IDRAULICA": 0.13, "TECNOLOGIE": 0.13, "PAESAGGIO": 0.13}},
    {cod:'QbIII.01', fase:'b.III — progetto esecutivo', nome:'Relazione generale e specialistiche, Elaborati grafici, Calcoli esecutivi', q:{"EDILIZIA": 0.07, "STRUTTURE_A": 0.12, "STRUTTURE_B": 0.12, "IMPIANTI_A": 0.15, "IMPIANTI_B": 0.04, "VIABILITA": 0.04, "IDRAULICA": 0.11, "TECNOLOGIE": 0.05, "PAESAGGIO": 0.04}},
    {cod:'QbIII.02', fase:'b.III — progetto esecutivo', nome:'Particolari costruttivi e decorativi', q:{"EDILIZIA": 0.13, "STRUTTURE_A": 0.13, "STRUTTURE_B": 0.13, "IMPIANTI_A": 0.05, "IMPIANTI_B": 0.05, "VIABILITA": 0.08, "IDRAULICA": 0.05, "TECNOLOGIE": 0.1, "PAESAGGIO": 0.08}},
    {cod:'QbIII.03', fase:'b.III — progetto esecutivo', nome:'Computo metrico estimativo, Quadro economico, Elenco prezzi e eventuale analisi, Quadr dell\'incidenza percentuale della quantità di manodopera', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.05, "IMPIANTI_B": 0.05, "VIABILITA": 0.03, "IDRAULICA": 0.04, "TECNOLOGIE": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbIII.04', fase:'b.III — progetto esecutivo', nome:'Schema di contratto, capitolato speciale d\'appalto, cronoprogramma', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QbIII.05', fase:'b.III — progetto esecutivo', nome:'Piano di manutenzione dell\'opera', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.025, "STRUTTURE_B": 0.025, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.03}},
    {cod:'QbIII.06', fase:'b.III — progetto esecutivo', nome:'Progettazione integrale e coordinata - Integrazione delle prestazioni specialistiche', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.03, "TECNOLOGIE": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QbIII.07', fase:'b.III — progetto esecutivo', nome:'Piano di Sicurezza e Coordinamento', q:{"EDILIZIA": 0.1, "STRUTTURE_A": 0.1, "STRUTTURE_B": 0.1, "IMPIANTI_A": 0.1, "IMPIANTI_B": 0.1, "VIABILITA": 0.1, "IDRAULICA": 0.1, "TECNOLOGIE": 0.1, "PAESAGGIO": 0.1}},
    {cod:'QbIII.08', fase:'b.III — progetto esecutivo', nome:'Supporto al RUP: per la supervisione e coordinamento della progettazione esecutiva', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QbIII.09', fase:'b.III — progetto esecutivo', nome:'Supporto al RUP: per la verifica della progettazione esecutiva', q:{"EDILIZIA": 0.13, "STRUTTURE_A": 0.13, "STRUTTURE_B": 0.13, "IMPIANTI_A": 0.13, "IMPIANTI_B": 0.13, "VIABILITA": 0.13, "IDRAULICA": 0.13, "TECNOLOGIE": 0.13, "PAESAGGIO": 0.13}},
    {cod:'QbIII.10', fase:'b.III — progetto esecutivo', nome:'Supporto al RUP: per la programmazione e progettazione appalto', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.04, "IMPIANTI_B": 0.04, "VIABILITA": 0.04, "IDRAULICA": 0.04, "TECNOLOGIE": 0.04, "PAESAGGIO": 0.04}},
    {cod:'QbIII.11', fase:'b.III — progetto esecutivo', nome:'Supporto al RUP: per la validazione del progetto', q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.01, "STRUTTURE_B": 0.01, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.01, "IDRAULICA": 0.01, "TECNOLOGIE": 0.01, "PAESAGGIO": 0.01}},
    {cod:'QcI.01', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Direzione lavori, assistenza al collaudo, prove di accettazione', q:{"EDILIZIA": 0.32, "STRUTTURE_A": 0.38, "STRUTTURE_B": 0.38, "IMPIANTI_A": 0.32, "IMPIANTI_B": 0.45, "VIABILITA": 0.42, "IDRAULICA": 0.42, "TECNOLOGIE": 0.35, "PAESAGGIO": 0.11}},
    {cod:'QcI.02', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Liquidazione (art.194, comma 1, d.P.R. 207/10)-Rendicontazioni e liquidazione tecnico contabile', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03, "VIABILITA": 0.03, "IDRAULICA": 0.04, "TECNOLOGIE": 0.03, "PAESAGGIO": 0.03}},
    {cod:'QcI.03', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Controllo aggiornamento elaborati di progetto, aggiornamento dei manuali d\'uso e manutenzione', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QcI.04', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Coordinamento e supervisione dell\'ufficio di direzione lavori', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QcI.05', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Ufficio della direzione lavori, per ogni addetto con qualifica di direttore operativo', q:{"EDILIZIA": 0.1, "STRUTTURE_A": 0.1, "STRUTTURE_B": 0.1, "IMPIANTI_A": 0.1, "IMPIANTI_B": 0.1, "VIABILITA": 0.1, "IDRAULICA": 0.1, "TECNOLOGIE": 0.1, "PAESAGGIO": 0.1}},
    {cod:'QcI.05.0', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Ufficio della direzione lavori, per ogni addetto con qualifica di direttore operativo 9 “GEOLOGO”', scaglioni:[
      {fascia:'Fino a € 250.000,00', fino_a:250000, q:{"EDILIZIA": 0.039, "STRUTTURE_A": 0.095, "STRUTTURE_B": 0.095, "IMPIANTI_A": 0.039, "IMPIANTI_B": 0.039, "VIABILITA": 0.127, "IDRAULICA": 0.095, "PAESAGGIO": 0.095}},
      {fascia:'Sull\'eccedenza fino a € 500.000,00', fino_a:500000, q:{"EDILIZIA": 0.01, "STRUTTURE_A": 0.081, "STRUTTURE_B": 0.081, "IMPIANTI_A": 0.01, "IMPIANTI_B": 0.01, "VIABILITA": 0.11, "IDRAULICA": 0.081, "PAESAGGIO": 0.081}},
      {fascia:'Sull\'eccedenza fino a € 1.000.000,00', fino_a:1000000, q:{"EDILIZIA": 0.013, "STRUTTURE_A": 0.071, "STRUTTURE_B": 0.071, "IMPIANTI_A": 0.013, "IMPIANTI_B": 0.013, "VIABILITA": 0.077, "IDRAULICA": 0.071, "PAESAGGIO": 0.071}},
      {fascia:'Sull\'eccedenza fino a € 2.500.000,00', fino_a:2500000, q:{"EDILIZIA": 0.018, "STRUTTURE_A": 0.052, "STRUTTURE_B": 0.052, "IMPIANTI_A": 0.018, "IMPIANTI_B": 0.018, "VIABILITA": 0.029, "IDRAULICA": 0.052, "PAESAGGIO": 0.052}},
      {fascia:'Sull\'eccedenza fino a € 10.000.000,00', fino_a:10000000, q:{"EDILIZIA": 0.022, "STRUTTURE_A": 0.042, "STRUTTURE_B": 0.042, "IMPIANTI_A": 0.022, "IMPIANTI_B": 0.022, "VIABILITA": 0.019, "IDRAULICA": 0.042, "PAESAGGIO": 0.042}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.021, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.021, "IMPIANTI_B": 0.021, "VIABILITA": 0.018, "IDRAULICA": 0.03, "PAESAGGIO": 0.03}},
    ]},
    {cod:'QcI.06', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Ufficio della direzione lavori, per ogni addetto con qualifica di ispettore di cantiere', q:{"EDILIZIA": 0.06, "STRUTTURE_A": 0.06, "STRUTTURE_B": 0.06, "IMPIANTI_A": 0.06, "IMPIANTI_B": 0.06, "VIABILITA": 0.06, "IDRAULICA": 0.06, "TECNOLOGIE": 0.06, "PAESAGGIO": 0.06}},
    {cod:'QcI.07', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'10 Variante delle quantità del progetto in corso d\'opera', q:{"EDILIZIA": 0.14, "STRUTTURE_A": 0.09, "STRUTTURE_B": 0.09, "IMPIANTI_A": 0.15, "IMPIANTI_B": 0.15, "VIABILITA": 0.12, "IDRAULICA": 0.12, "TECNOLOGIE": 0.11, "PAESAGGIO": 0.12}},
    {cod:'QcI.08', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Variante del progetto in corso d\'opera', q:{"EDILIZIA": 0.41, "STRUTTURE_A": 0.43, "STRUTTURE_B": 0.43, "IMPIANTI_A": 0.32, "IMPIANTI_B": 0.32, "VIABILITA": 0.42, "IDRAULICA": 0.34, "TECNOLOGIE": 0.4, "PAESAGGIO": 0.42}},
    {cod:'QcI.09', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Contabilità dei lavori a misura', scaglioni:[
      {fascia:'Fino a € 500.000,00', fino_a:500000, q:{"EDILIZIA": 0.06, "STRUTTURE_A": 0.06, "STRUTTURE_B": 0.06, "IMPIANTI_A": 0.045, "IMPIANTI_B": 0.045, "VIABILITA": 0.045, "IDRAULICA": 0.045, "TECNOLOGIE": 0.045, "PAESAGGIO": 0.045}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.012, "STRUTTURE_A": 0.012, "STRUTTURE_B": 0.012, "IMPIANTI_A": 0.09, "IMPIANTI_B": 0.09, "VIABILITA": 0.09, "IDRAULICA": 0.09, "TECNOLOGIE": 0.09, "PAESAGGIO": 0.09}},
    ]},
    {cod:'QcI.10', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Contabilità dei lavori a corpo', scaglioni:[
      {fascia:'Fino a € 500.000,00', fino_a:500000, q:{"EDILIZIA": 0.045, "STRUTTURE_A": 0.045, "STRUTTURE_B": 0.045, "IMPIANTI_A": 0.035, "IMPIANTI_B": 0.035, "VIABILITA": 0.035, "IDRAULICA": 0.035, "TECNOLOGIE": 0.035, "PAESAGGIO": 0.035}},
      {fascia:'Sull\'eccedenza', fino_a:null, q:{"EDILIZIA": 0.09, "STRUTTURE_A": 0.09, "STRUTTURE_B": 0.09, "IMPIANTI_A": 0.07, "IMPIANTI_B": 0.07, "VIABILITA": 0.07, "IDRAULICA": 0.07, "TECNOLOGIE": 0.07, "PAESAGGIO": 0.07}},
    ]},
    {cod:'QcI.11', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Certificato di regolare esecuzione', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.04, "IMPIANTI_B": 0.04, "VIABILITA": 0.04, "IDRAULICA": 0.04, "TECNOLOGIE": 0.04, "PAESAGGIO": 0.04}},
    {cod:'QcI.12', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Coordinamento della sicurezza in esecuzione', q:{"EDILIZIA": 0.25, "STRUTTURE_A": 0.25, "STRUTTURE_B": 0.25, "IMPIANTI_A": 0.25, "IMPIANTI_B": 0.25, "VIABILITA": 0.25, "IDRAULICA": 0.25, "TECNOLOGIE": 0.25, "PAESAGGIO": 0.25}},
    {cod:'QcI.13', fase:'c.I — esecuzione dei lavori (direzione lavori)', nome:'Supporto al RUP: per la supervisione e coordinamento della D.L. e della C.S.E.', q:{"EDILIZIA": 0.04, "STRUTTURE_A": 0.04, "STRUTTURE_B": 0.04, "IMPIANTI_A": 0.04, "IMPIANTI_B": 0.04, "VIABILITA": 0.04, "IDRAULICA": 0.04, "TECNOLOGIE": 0.04, "PAESAGGIO": 0.04}},
    {cod:'QdI.01', fase:'d.I — verifica e collaudo', nome:'12 Collaudo tecnico amministrativo', q:{"EDILIZIA": 0.08, "STRUTTURE_A": 0.08, "STRUTTURE_B": 0.08, "IMPIANTI_A": 0.08, "IMPIANTI_B": 0.08, "VIABILITA": 0.08, "IDRAULICA": 0.08, "TECNOLOGIE": 0.08, "PAESAGGIO": 0.08}},
    {cod:'QdI.02', fase:'d.I — verifica e collaudo', nome:'Revisione tecnico contabile (Parte II, Titolo X, d.P.R. 207/10)', q:{"EDILIZIA": 0.02, "STRUTTURE_A": 0.02, "STRUTTURE_B": 0.02, "IMPIANTI_A": 0.02, "IMPIANTI_B": 0.02, "VIABILITA": 0.02, "IDRAULICA": 0.02, "TECNOLOGIE": 0.02, "PAESAGGIO": 0.02}},
    {cod:'QdI.03', fase:'d.I — verifica e collaudo', nome:'Collaudo statico (Capitolo 9, d.m. 14/01/2008)', q:{"STRUTTURE_A": 0.22, "STRUTTURE_B": 0.22}},
    {cod:'QdI.04', fase:'d.I — verifica e collaudo', nome:'Collaudo tecnico funzionale degli impianti (d.m. 22/01/2008 n°37)', q:{"IMPIANTI_A": 0.18, "IMPIANTI_B": 0.18, "IDRAULICA": 0.18}},
    {cod:'QdI.05', fase:'d.I — verifica e collaudo', nome:'Attestato di certificazione energetica (art.6 d.lgs. 311/2006)esclusa diagnosi energetica', q:{"EDILIZIA": 0.03, "STRUTTURE_A": 0.03, "STRUTTURE_B": 0.03, "IMPIANTI_A": 0.03, "IMPIANTI_B": 0.03}},
    {cod:'QeI.01', fase:'e.I — monitoraggio', nome:'Monitoraggi ambientali, naturalistici, fitoiatrici, faunistici, agronomici, zootecnici (artt. 18,28 Parte III All.1-All. 7 d.Lgs.152/2006)', q:{"PAESAGGIO": 0.002, "TERRITORIO": 0.0015}},
    {cod:'QeI.02', fase:'e.I — monitoraggio', nome:'Ricerche agricole e/o agro-industriali, nelle bioenergie, all\'innovazione e sviluppo dei settori di competenza, la statistica, le ricerche di mercato, le attività relative agli assetti societari, alla cooperazione ed all\'aggregazione di reti di impresa nel settore agricolo, agroalimentare, ambientale, energetico e forestale', q:{"PAESAGGIO": 0.022}},
  ];

  /* ---- ricerche ---- */
  function categoria(cod){ for(var i=0;i<Z1.length;i++) if(Z1[i].cod===cod) return Z1[i]; return null; }
  function prestazione(cod){ for(var i=0;i<Z2.length;i++) if(Z2[i].cod===cod) return Z2[i]; return null; }

  /* Q di una prestazione per una categoria d'opera.
     Se la prestazione e' a scaglioni serve anche il valore dell'opera V:
     si sommano gli scaglioni, come l'IRPEF. */
  function valoreQ(codPrest, codCat, V){
    var p=prestazione(codPrest), c=categoria(codCat);
    if(!p||!c) return null;
    if(p.q) return (p.q[c.col]===undefined)?null:p.q[c.col];
    if(!p.scaglioni) return null;
    /* ⛔ scaglioni che non vanno per importo in euro (es. per numero di abitanti):
       il gestionale NON li calcola da solo. Meglio dire "non lo so" che
       tirare fuori un numero credibile e sbagliato. */
    if(p.a_mano) return null;
    if(!(V>0)) return null;
    var somma=0, gia=0, usato=false;
    for(var i=0;i<p.scaglioni.length;i++){
      var s=p.scaglioni[i], qv=s.q[c.col];
      if(qv===undefined) continue;
      var tetto=(s.fino_a==null)?Infinity:s.fino_a;
      var quota=Math.min(V,tetto)-gia;
      if(quota>0){ somma+=quota*qv; gia+=quota; usato=true; }
      if(gia>=V) break;
    }
    return usato ? somma/V : null;   /* Q medio equivalente sull'intero valore */
  }

  /* =========================================================================
     LA FORMULA — copiata dagli articoli del decreto, non dalla memoria
     -------------------------------------------------------------------------
     Art. 3 c.4:  P = 0,03 + 10 / V^0,4
     Art. 3 c.5:  "Per importi delle singole categorie componenti l'opera
                   inferiori a euro 25.000,00 il parametro P non puo' superare
                   il valore del parametro P corrispondente a tale importo."
     Art. 4:      CP = somma di ( V x G x Q x P )
     Art. 5:      spese e oneri accessori, in misura NON SUPERIORE a:
                   - 25% del compenso fino a 1.000.000 di lavori
                   - 10% del compenso da 25.000.000 in su
                   - in mezzo, per interpolazione lineare
                  ⚠️ e' un TETTO, non una cifra fissa: si puo' chiedere meno.
     ========================================================================= */
  function parametroP(V){
    if(!(V>0)) return null;
    var f=function(v){ return 0.03 + 10/Math.pow(v,0.4); };
    var P=Math.min(f(V), f(25000));       /* art. 3 c.5 */
    /* ⚠️ P si arrotonda alla SESTA cifra decimale.
       Il decreto non dice come arrotondare. I calcolatori pubblici (ACCA e
       gli altri) scrivono P con sei decimali e fanno i conti con quello.
       Se qui si usasse la precisione piena, sull'esempio pubblicato da ACCA
       (scuola, categoria E.09, lavori 500.000 €) usciva 51.227,75 invece di
       51.228,03: 28 centesimi. Poco — ma su una gara il professionista
       confronta il nostro numero col loro, e due numeri diversi sono un
       numero sbagliato. Quindi si segue il loro.
       C'e' la prova che li confronta: prove/banco_decreto.js. */
    return Math.round(P*1000000)/1000000;
  }

  /* Il compenso di UNA categoria d'opera con le sue prestazioni.
     V = importo dei lavori di quella categoria. */
  function compensoCategoria(V, codCat, codPrestazioni){
    var c=categoria(codCat); if(!c||!(V>0)) return null;
    var P=parametroP(V), voci=[], tot=0, mancanti=[];
    for(var i=0;i<codPrestazioni.length;i++){
      var cod=codPrestazioni[i], q=valoreQ(cod,codCat,V), p=prestazione(cod);
      if(q===null||q===undefined){ mancanti.push(cod); continue; }
      var imp=V*c.G*q*P;
      voci.push({cod:cod, nome:p?p.nome:cod, Q:q, importo:imp});
      tot+=imp;
    }
    return {categoria:c.cod, gruppo:c.gruppo, V:V, G:c.G, P:P,
            voci:voci, compenso:tot, prestazioniSenzaValore:mancanti};
  }

  /* Il compenso di tutta l'opera: una riga per categoria.
     righe = [{V:..., cat:'E.06', prestazioni:['QbII.01', ...]}, ...] */
  function compenso(righe){
    var parti=[], tot=0, V=0;
    for(var i=0;i<righe.length;i++){
      var r=compensoCategoria(righe[i].V, righe[i].cat, righe[i].prestazioni||[]);
      if(!r) continue;
      parti.push(r); tot+=r.compenso; V+=righe[i].V;
    }
    return {parti:parti, compenso:tot, importoLavori:V, speseMaxPerc:speseMaxPerc(V),
            speseMax: speseMaxPerc(V)===null?null:tot*speseMaxPerc(V)};
  }

  /* Tetto delle spese forfettarie, in frazione (0,25 = 25%) — art. 5 */
  function speseMaxPerc(importoLavori){
    if(!(importoLavori>0)) return null;
    if(importoLavori<=1000000)  return 0.25;
    if(importoLavori>=25000000) return 0.10;
    return 0.25 - 0.15*(importoLavori-1000000)/24000000;
  }

  window.DecretoParametri = {
    FONTE: FONTE, Z1: Z1, Z2: Z2,
    categoria: categoria, prestazione: prestazione, valoreQ: valoreQ,
    parametroP: parametroP, compensoCategoria: compensoCategoria,
    compenso: compenso, speseMaxPerc: speseMaxPerc
  };
})();