/* ============================================================
   IL CAPITOLATO — 16 ottobre 2026 (seconda versione, potenziata)
   ============================================================
   Il capitolato e' il foglio che dice al cliente COSA si fa, con quali
   materiali, cosa e' compreso e cosa NO. Si allega al preventivo: serve a
   non litigare dopo («questo non era compreso»).

   Dove sta: nel menu di ogni preventivo, «📋 Capitolato». Si apre una
   finestra grande a due colonne (come il preventivo): a sinistra l'intestazione,
   le foto allegate, a destra le voci dei lavori e le firme. In fondo: PDF e Salva.

   COSA SA FARE (le 7 migliorie del 16 ottobre sera)
   1. PIU' CAPITOLATI PER PREVENTIVO: schede in alto (bagno, cucina, tetto...).
   2. «PORTA LE VOCI» COMPLETO: una voce per capitolo del preventivo, con le righe
      e le quantita'. E «un capitolato per ogni capitolo».
   3. 10 MODELLI PRONTI (bagno, ristrutturazione, tinteggiatura, elettrico, tetto,
      facciata, cartongesso, idraulico, pavimenti, infissi).
   4. FOTO E ALLEGATI: foto del cantiere, planimetrie, schede fotografate. Stanno
      nel bucket «gestionale-foto» (cartella = id utente) e finiscono in fondo al PDF.
   5. PDF CON LOGO E COLORE DELL'IMPRESA + «Pagina x di y».
   6. FIRMA SUL TELEFONO: l'impresa e il cliente firmano col dito. E' una firma
      elettronica SEMPLICE (non qualificata): vale come prova di accordo, non come
      la firma digitale con Openapi, che arriva dopo. La firma vale SOLO per il testo
      che c'era quando e' stata fatta: se il capitolato cambia, la firma decade.
   7. L'AI CONTROLLA cosa manca o puo' far discutere (1 credito, stessa funzione).

   ⛔ NON C'E' UNA TABELLA NUOVA. Tutto sta in UNA colonna del preventivo
   (gest_preventivi.capitolato, jsonb — sql/capitolato-nel-preventivo.sql).
   Perche': cosi' segue il preventivo dappertutto — finisce nel Cestino con lui,
   si ripristina con lui, se ne va con lui.
   FORMATO: {capitolati:[{id,nome,voci,dove,inizio,durata,pagamenti,garanzie,note,
   allegati:[{path,nome}],firme:{impresa:{img,data,hash},cliente:{img,data,hash}}}],aggiornato}
   Il formato VECCHIO (un solo capitolato: {voci,dove,...}) si legge ancora: diventa
   il primo capitolato. Nessun SQL da eseguire.

   ⛔ L'AI (1 credito) e' una funzione a parte: supabase/functions/ai-capitolato.
   Non inventa marche, prezzi, percentuali o durate. Non scrive mai nel database:
   riempie le caselle e chi lavora controlla e salva lui. Il controllo (modo
   «controllo») segnala soltanto: non cambia niente da solo.

   ⛔ Si usa SOLO openSheetGrande(), mai openSheet(): la finestrella e' vietata.
   ⛔ Niente testo sotto i 13 px.
   ⛔ I file caricati e poi tolti (o mai salvati) si cancellano dallo storage
   quando si salva o si chiude: niente file orfani.

   Il file sta dentro una scatola (function(){...})() perche' i nomi qui
   sotto non devono scontrarsi con quelli degli altri file del gestionale,
   che vivono tutti nella stessa pagina. Fuori esce una cosa sola:
   window.gestCapitolato (serve ai banchi di prova).
   ============================================================ */
(function(){
  "use strict";

  /* ---------- i modelli pronti ----------
     Voci scritte per un cliente che non e' del mestiere. I materiali restano
     «da concordare»: marche e formati li decide chi fa il lavoro, non il modello.
     Le esclusioni sono quelle che di solito fanno discutere dopo. */
  var DA_CONCORDARE="Da concordare con il cliente";
  var MODELLI={
    bagno:{nome:"Bagno — rifacimento completo",voci:[
      {titolo:"Demolizioni e rimozioni",
       cosa:"Demolizione del pavimento e dei rivestimenti esistenti, rimozione dei sanitari e smontaggio dei vecchi impianti a vista.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie in discarica autorizzata.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti. Opere strutturali."},
      {titolo:"Impianto idraulico",
       cosa:"Nuove linee di scarico e di acqua calda e fredda, con valvole di intercettazione. Allaccio dei nuovi sanitari.",
       materiali:DA_CONCORDARE,
       compreso:"Prova di tenuta dell'impianto prima della chiusura delle tracce.",
       escluso:"Spostamento delle colonne di scarico condominiali. Modifiche alla caldaia o alla rete generale."},
      {titolo:"Impianto elettrico del bagno",
       cosa:"Linea per luci, prese e ventilazione del bagno, con collegamento equipotenziale.",
       materiali:DA_CONCORDARE,
       compreso:"Frutti e placche della serie concordata.",
       escluso:"Adeguamento del quadro elettrico generale dell'abitazione."},
      {titolo:"Massetto e impermeabilizzazione",
       cosa:"Rifacimento del massetto di livellamento e posa della guaina impermeabile sul pavimento e alla base delle pareti.",
       materiali:"",
       compreso:"Pendenze verso lo scarico della doccia.",
       escluso:"Rinforzo o riparazione di solai danneggiati."},
      {titolo:"Pavimenti e rivestimenti",
       cosa:"Posa del pavimento e del rivestimento delle pareti, con stuccatura delle fughe e profili d'angolo.",
       materiali:DA_CONCORDARE,
       compreso:"Colla, stucco e profili.",
       escluso:"Piastrelle e materiali scelti dal cliente oltre il prezzo indicato nel preventivo."},
      {titolo:"Sanitari e rubinetteria",
       cosa:"Montaggio dei sanitari, della rubinetteria e del piatto o box doccia, con collaudo finale.",
       materiali:DA_CONCORDARE,
       compreso:"Collegamenti, sigillature e pulizia finale del bagno.",
       escluso:"Difetti di fabbrica dei sanitari forniti dal cliente."}
    ]},
    ristrutturazione:{nome:"Ristrutturazione appartamento",voci:[
      {titolo:"Demolizioni e rimozioni",
       cosa:"Demolizione di pavimenti, rivestimenti e tramezzi indicati in progetto, e rimozione degli impianti da rifare.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie in discarica autorizzata.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti. Demolizione di muri portanti."},
      {titolo:"Opere murarie",
       cosa:"Costruzione dei nuovi tramezzi, tracce per gli impianti e loro chiusura, ripristini degli intonaci.",
       materiali:DA_CONCORDARE,
       compreso:"Materiali e mano d'opera per le murature indicate nel preventivo.",
       escluso:"Pratiche edilizie e progetti. Ripristino di murature nascoste e trovate in cattivo stato."},
      {titolo:"Impianto elettrico",
       cosa:"Rifacimento delle linee, dei punti luce e delle prese, con nuovo quadro elettrico.",
       materiali:DA_CONCORDARE,
       compreso:"Frutti e placche della serie concordata. Dichiarazione di conformità.",
       escluso:"Aumento della potenza del contatore (a carico del cliente presso il fornitore)."},
      {titolo:"Impianto idraulico",
       cosa:"Rifacimento delle linee di scarico e di acqua calda e fredda, con collettori e valvole.",
       materiali:DA_CONCORDARE,
       compreso:"Prova di tenuta dell'impianto prima della chiusura delle tracce.",
       escluso:"Spostamento delle colonne condominiali. Sostituzione di caldaia e radiatori, se non indicata."},
      {titolo:"Massetti e pavimenti",
       cosa:"Massetto di livellamento e posa dei nuovi pavimenti e battiscopa.",
       materiali:DA_CONCORDARE,
       compreso:"Colla, stucco e battiscopa.",
       escluso:"Pavimenti e materiali scelti dal cliente oltre il prezzo indicato nel preventivo."},
      {titolo:"Intonaci e tinteggiatura",
       cosa:"Rasatura delle pareti e dei soffitti e tinteggiatura a due mani.",
       materiali:DA_CONCORDARE,
       compreso:"Protezione di pavimenti e serramenti. Pulizia finale.",
       escluso:"Spostamento dei mobili. Colori speciali o decorazioni."}
    ]},
    tinteggiatura:{nome:"Tinteggiatura interna",voci:[
      {titolo:"Protezione e preparazione",
       cosa:"Copertura di pavimenti, mobili e serramenti. Stuccatura di buchi e crepe e carteggiatura delle pareti.",
       materiali:"",
       compreso:"Teli, nastri e stucco.",
       escluso:"Spostamento di mobili e arredi, se non concordato. Trattamento di muffe o infiltrazioni."},
      {titolo:"Fondo e isolante",
       cosa:"Mano di fondo dove serve per far aderire bene la pittura, e isolante sulle macchie.",
       materiali:DA_CONCORDARE,
       compreso:"Prodotto e applicazione.",
       escluso:""},
      {titolo:"Tinteggiatura di pareti e soffitti",
       cosa:"Tinteggiatura a due mani di pareti e soffitti, con cura dei bordi e degli angoli.",
       materiali:DA_CONCORDARE,
       compreso:"Pittura nel colore scelto e due mani complete.",
       escluso:"Colori speciali, decorazioni e smalti su porte e infissi."},
      {titolo:"Pulizia finale",
       cosa:"Rimozione dei teli e pulizia degli ambienti a fine lavoro.",
       materiali:"",
       compreso:"Smaltimento dei residui di cantiere.",
       escluso:""}
    ]},
    elettrico:{nome:"Impianto elettrico",voci:[
      {titolo:"Tracce e predisposizioni",
       cosa:"Esecuzione delle tracce nelle pareti e posa delle scatole e dei tubi per i nuovi punti.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie.",
       escluso:"Ripristino degli intonaci e delle finiture, se non indicato nel preventivo."},
      {titolo:"Linee e punti luce e presa",
       cosa:"Posa dei cavi e realizzazione dei punti luce, delle prese e dei comandi indicati.",
       materiali:DA_CONCORDARE,
       compreso:"Cavi, tubi e scatole.",
       escluso:"Punti aggiuntivi richiesti a lavori iniziati."},
      {titolo:"Quadro elettrico",
       cosa:"Nuovo quadro con interruttori differenziali e magnetotermici, e collegamento delle linee.",
       materiali:DA_CONCORDARE,
       compreso:"Montaggio, cablaggio e targhette identificative.",
       escluso:"Aumento della potenza del contatore (a carico del cliente presso il fornitore)."},
      {titolo:"Frutti e placche",
       cosa:"Montaggio di interruttori, prese e placche a lavori finiti.",
       materiali:DA_CONCORDARE,
       compreso:"Frutti e placche della serie concordata.",
       escluso:"Serie di pregio oltre il prezzo indicato nel preventivo."},
      {titolo:"Collaudo e dichiarazione di conformità",
       cosa:"Prove di funzionamento dell'impianto e rilascio della dichiarazione di conformità.",
       materiali:"",
       compreso:"Dichiarazione di conformità ai sensi del D.M. 37/2008.",
       escluso:"Verifiche e pratiche richieste da enti esterni."}
    ]},
    tetto:{nome:"Tetto — rifacimento o manutenzione",voci:[
      {titolo:"Cantiere e sicurezza",
       cosa:"Allestimento del cantiere in quota con le protezioni anticaduta previste per legge.",
       materiali:"",
       compreso:"Linee vita provvisorie e protezioni per chi lavora in quota.",
       escluso:"Ponteggio, se non indicato nel preventivo. Occupazione di suolo pubblico e relative pratiche."},
      {titolo:"Rimozione del manto esistente",
       cosa:"Smontaggio delle tegole o del manto di copertura esistente e pulizia del piano di posa.",
       materiali:"",
       compreso:"Trasporto e smaltimento dei materiali di risulta in discarica autorizzata.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti. Sostituzione di travi o tavolato ammalorati, se non indicata."},
      {titolo:"Struttura e isolamento",
       cosa:"Controllo della struttura portante, posa del tavolato dove previsto, dell'isolante e della guaina.",
       materiali:DA_CONCORDARE,
       compreso:"Materiali di posa e fissaggi indicati nel preventivo.",
       escluso:"Riparazione di travi o elementi strutturali trovati danneggiati dopo la rimozione del manto."},
      {titolo:"Nuovo manto di copertura",
       cosa:"Posa del nuovo manto di copertura con i colmi, i fissaggi e i pezzi speciali.",
       materiali:DA_CONCORDARE,
       compreso:"Posa a regola d'arte e sigillature nei punti di raccordo.",
       escluso:"Tegole o coppi scelti dal cliente oltre il prezzo indicato nel preventivo."},
      {titolo:"Lattonerie e grondaie",
       cosa:"Montaggio di grondaie, pluviali, scossaline e converse.",
       materiali:DA_CONCORDARE,
       compreso:"Staffe, fissaggi e sigillature.",
       escluso:"Allaccio dei pluviali alla fognatura o ai pozzetti."},
      {titolo:"Pulizia e verifica finale",
       cosa:"Pulizia del cantiere e controllo finale della tenuta della copertura.",
       materiali:"",
       compreso:"Rimozione delle protezioni e dei residui di lavoro.",
       escluso:""}
    ]},
    facciata:{nome:"Facciata — ripristino e tinteggiatura",voci:[
      {titolo:"Ponteggio e protezioni",
       cosa:"Montaggio e smontaggio del ponteggio, con teli di protezione per i passanti e i serramenti.",
       materiali:"",
       compreso:"Montaggio, smontaggio e nolo per la durata dei lavori.",
       escluso:"Occupazione di suolo pubblico e relative pratiche. Spostamento di cavi o insegne di terzi."},
      {titolo:"Pulizia e preparazione",
       cosa:"Lavaggio della facciata, rimozione delle parti di intonaco che si staccano e raschiatura della pittura non aderente.",
       materiali:"",
       compreso:"Smaltimento dei residui.",
       escluso:"Rifacimento di intonaci estesi non previsti nel preventivo."},
      {titolo:"Ripristini",
       cosa:"Ripristino dell'intonaco ammalorato, sigillatura delle crepe e dei bordi di balconi e cornici.",
       materiali:DA_CONCORDARE,
       compreso:"Malte e sigillanti.",
       escluso:"Riparazioni strutturali o di balconi con ferri a vista, se non indicate."},
      {titolo:"Fondo e tinteggiatura",
       cosa:"Mano di fondo e tinteggiatura della facciata a due mani, con cura dei bordi e dei dettagli.",
       materiali:DA_CONCORDARE,
       compreso:"Pittura nel colore scelto e due mani complete.",
       escluso:"Colori speciali o decorazioni. Tinteggiatura di ringhiere e serramenti, se non indicata."},
      {titolo:"Pulizia finale",
       cosa:"Rimozione dei teli e pulizia dell'area di cantiere.",
       materiali:"",
       compreso:"Smaltimento dei residui.",
       escluso:""}
    ]},
    cartongesso:{nome:"Cartongesso — pareti e controsoffitti",voci:[
      {titolo:"Tracciamento e struttura",
       cosa:"Tracciamento delle pareti o dei controsoffitti e montaggio della struttura metallica.",
       materiali:DA_CONCORDARE,
       compreso:"Guide, montanti e fissaggi.",
       escluso:"Demolizioni e opere murarie preliminari, se non indicate."},
      {titolo:"Isolamento e impianti",
       cosa:"Posa dell'isolante dove previsto e passaggio dei tubi e dei cavi degli impianti prima della chiusura.",
       materiali:DA_CONCORDARE,
       compreso:"Posa dell'isolante nelle pareti indicate.",
       escluso:"Opere di impianto elettrico o idraulico, se non indicate nel preventivo."},
      {titolo:"Posa delle lastre",
       cosa:"Fissaggio delle lastre di cartongesso, con lastre idrofughe o antincendio dove previsto.",
       materiali:DA_CONCORDARE,
       compreso:"Lastre, viti e nastri per le giunzioni.",
       escluso:"Lastre speciali non indicate nel preventivo."},
      {titolo:"Stuccatura e finitura",
       cosa:"Stuccatura delle giunzioni e carteggiatura, fino alla superficie pronta per la pittura.",
       materiali:DA_CONCORDARE,
       compreso:"Stucco, rasatura e pulizia della polvere.",
       escluso:"Tinteggiatura, se non indicata nel preventivo."}
    ]},
    idraulico:{nome:"Impianto idraulico e termico",voci:[
      {titolo:"Tracce e smontaggi",
       cosa:"Smontaggio delle vecchie tubazioni e dei terminali e apertura delle tracce nelle pareti.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti. Ripristino degli intonaci, se non indicato."},
      {titolo:"Linee di scarico",
       cosa:"Posa delle nuove linee di scarico con le pendenze corrette e i collegamenti alle colonne.",
       materiali:DA_CONCORDARE,
       compreso:"Tubi, raccordi e sifoni.",
       escluso:"Spostamento delle colonne di scarico condominiali."},
      {titolo:"Linee acqua calda e fredda",
       cosa:"Posa delle linee di adduzione con collettori e valvole di intercettazione.",
       materiali:DA_CONCORDARE,
       compreso:"Isolamento delle tubazioni e prova di tenuta prima della chiusura delle tracce.",
       escluso:"Modifiche alla rete generale del condominio."},
      {titolo:"Riscaldamento",
       cosa:"Collegamento di caldaia, radiatori o pavimento radiante secondo quanto indicato nel preventivo.",
       materiali:DA_CONCORDARE,
       compreso:"Collegamenti, riempimento e messa in funzione.",
       escluso:"Fornitura di caldaia e radiatori, se non indicata. Pratiche per la messa in servizio."},
      {titolo:"Collaudo",
       cosa:"Prove di funzionamento dell'impianto, regolazione e consegna al cliente.",
       materiali:"",
       compreso:"Prova a pressione e dichiarazione di conformità, se prevista.",
       escluso:"Verifiche richieste da enti esterni."}
    ]},
    pavimenti:{nome:"Pavimenti e rivestimenti",voci:[
      {titolo:"Rimozione dei vecchi pavimenti",
       cosa:"Demolizione e rimozione del pavimento e del battiscopa esistenti.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti."},
      {titolo:"Massetto e preparazione del fondo",
       cosa:"Verifica del piano, rasatura o rifacimento del massetto e posa dell'impermeabilizzante dove serve.",
       materiali:DA_CONCORDARE,
       compreso:"Livellamento del fondo fino alla quota concordata.",
       escluso:"Riparazione di solai danneggiati o fuori piano oltre le tolleranze."},
      {titolo:"Posa del pavimento",
       cosa:"Posa del nuovo pavimento, con fughe regolari e tagli rifiniti.",
       materiali:DA_CONCORDARE,
       compreso:"Colla, stucco delle fughe e distanziatori.",
       escluso:"Pavimento scelto dal cliente oltre il prezzo indicato nel preventivo. Posa in diagonale o con disegni, se non indicata."},
      {titolo:"Battiscopa e finiture",
       cosa:"Posa del battiscopa, dei profili di raccordo e delle soglie.",
       materiali:DA_CONCORDARE,
       compreso:"Fissaggi e sigillature.",
       escluso:""},
      {titolo:"Pulizia finale",
       cosa:"Pulizia del pavimento a fine posa.",
       materiali:"",
       compreso:"Rimozione dei residui di colla e stucco.",
       escluso:"Trattamenti protettivi speciali, se non indicati."}
    ]},
    infissi:{nome:"Serramenti e infissi",voci:[
      {titolo:"Rilievo e ordine",
       cosa:"Rilievo delle misure in cantiere e ordine dei nuovi serramenti.",
       materiali:DA_CONCORDARE,
       compreso:"Sopralluogo e rilievo delle misure.",
       escluso:"Variazioni di misura chieste dopo l'ordine."},
      {titolo:"Rimozione dei vecchi infissi",
       cosa:"Smontaggio dei vecchi serramenti e dei controtelai, con protezione dei pavimenti.",
       materiali:"",
       compreso:"Trasporto e smaltimento dei vecchi serramenti.",
       escluso:"Rimozione di persiane o tapparelle non indicate nel preventivo."},
      {titolo:"Posa dei nuovi serramenti",
       cosa:"Posa dei nuovi serramenti a regola d'arte, con sigillature e schiume isolanti.",
       materiali:DA_CONCORDARE,
       compreso:"Controtelaio, sigillature, accessori e regolazione di ante e maniglie.",
       escluso:"Tapparelle, zanzariere e oscuranti non indicati nel preventivo."},
      {titolo:"Ripristini e finiture",
       cosa:"Ripristino delle spallette e dei bordi intorno ai nuovi serramenti.",
       materiali:DA_CONCORDARE,
       compreso:"Rasature e stuccature di raccordo.",
       escluso:"Tinteggiatura delle pareti, se non indicata nel preventivo. Pratiche per le detrazioni fiscali."}
    ]}
  };

  /* ---------- un po' di utilita' ---------- */
  var BUCKET="gestionale-foto";
  var MAX_ALL=6;                /* foto/allegati per capitolato */
  function T(v){ return (v==null)?"":String(v).trim(); }
  function vuota(v){ return !(T(v.titolo)||T(v.cosa)||T(v.materiali)||T(v.compreso)||T(v.escluso)); }
  function copiaVoce(v){ return {titolo:T(v.titolo),cosa:T(v.cosa),materiali:T(v.materiali),compreso:T(v.compreso),escluso:T(v.escluso)}; }
  function nuovoId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  function el(id){ return document.getElementById(id); }

  /* un capitolato vuoto */
  function capVuoto(nome){
    return {id:nuovoId(),nome:nome||"Capitolato",voci:[],dove:"",inizio:"",durata:"",pagamenti:"",garanzie:"",note:"",allegati:[],firme:{}};
  }
  /* rimette in ordine un capitolato letto dal database */
  function pulisci(c){
    c=c||{};
    var o=capVuoto(T(c.nome)||"Capitolato");
    if(c.id) o.id=String(c.id);
    o.voci=(c.voci||[]).map(copiaVoce).filter(function(v){ return !vuota(v); });
    ["dove","inizio","durata","pagamenti","garanzie","note"].forEach(function(k){ o[k]=T(c[k]); });
    o.allegati=(c.allegati||[]).filter(function(a){ return a&&a.path; }).map(function(a){ return {path:String(a.path),nome:T(a.nome)}; }).slice(0,MAX_ALL);
    o.firme=(c.firme&&typeof c.firme==="object")?c.firme:{};
    return o;
  }
  /* il vecchio formato (un capitolato solo) diventa il primo della lista */
  function normalizza(cap){
    var out=[];
    if(cap&&Array.isArray(cap.capitolati)){
      cap.capitolati.forEach(function(c){ out.push(pulisci(c)); });
    }else if(cap&&(cap.voci||cap.dove||cap.pagamenti||cap.note||cap.garanzie)){
      out.push(pulisci(cap));
    }
    if(!out.length) out.push(capVuoto("Capitolato"));
    return out;
  }
  function nonVuoto(c){
    return !!(c.voci.length||c.dove||c.inizio||c.durata||c.pagamenti||c.garanzie||c.note||c.allegati.length||Object.keys(c.firme||{}).length);
  }
  /* l'impronta del testo: serve alla firma. Se il testo cambia, l'impronta cambia
     e la firma fatta prima non vale piu'. Non entrano il nome della scheda ne' le firme. */
  function impronta(c){
    var s=JSON.stringify([c.voci,c.dove,c.inizio,c.durata,c.pagamenti,c.garanzie,c.note,(c.allegati||[]).map(function(a){ return a.path; })]);
    var h=5381;
    for(var i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))|0; }
    return String(h);
  }
  function oraIt(iso){
    var d=new Date(iso); if(isNaN(d.getTime())) return "";
    return fdate(iso.slice(0,10))+" alle "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  }

  /* Il CSS sta qui e non in css/gestionale.css, che si divide con
     il gestionale del noleggio. Le misure rispettano la regola dei 13 px. */
  function stile(){
    if(el("cap-stile")) return;
    var s=document.createElement("style"); s.id="cap-stile";
    s.textContent=
      ".cap-voce{border:1px solid var(--bordo);border-radius:12px;padding:14px 16px 4px;margin-bottom:14px;background:var(--sfondo)}"
     +".cap-voce-t{display:flex;align-items:center;gap:8px;margin-bottom:10px}"
     +".cap-voce-n{flex:0 0 auto;font-size:16px;font-weight:800;color:var(--testo)}"
     +".cap-voce-f{flex:1 1 auto;margin:0}"
     +".cap-voce-f input{font-weight:700}"
     +".cap-voce .rdel{flex:0 0 auto;min-width:44px;height:44px;border:1px solid var(--bordo-forte);background:var(--card);color:var(--err);border-radius:10px;cursor:pointer;font-size:22px}"
     +".cap-voce .rdel:hover{background:var(--err-bg)}"
     +".cap-riep{font-size:15px;line-height:1.6;color:var(--testo);margin-bottom:12px}"
     +".cap-riep b{font-weight:700}"
     +".cap-azioni{display:flex;gap:8px;flex-wrap:wrap}"
     /* le schede in alto */
     +".cap-schede{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px}"
     +".cap-sch,.cap-sch-new{min-height:44px;padding:0 18px;border-radius:999px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}"
     +".cap-sch{border:1px solid var(--bordo-forte);background:var(--card);color:var(--testo)}"
     +".cap-sch:hover{background:var(--blu-tenue)}"
     +".cap-sch.on{background:var(--blu);border-color:var(--blu);color:#fff}"
     +".cap-sch-new{border:1px dashed var(--blu);background:transparent;color:var(--blu)}"
     +".cap-sch-new:hover{background:var(--blu-tenue)}"
     /* il controllo dell'AI */
     +".cap-ctr{border:1px solid var(--bordo-forte);border-radius:12px;background:var(--card);padding:14px 16px;margin:10px 0 16px}"
     +".cap-ctr-g{font-size:15px;line-height:1.5;font-weight:700;color:var(--testo);margin-bottom:10px}"
     +".cap-ctr-i{border-top:1px solid var(--bordo);padding:12px 0}"
     +".cap-ctr-d{font-size:13px;font-weight:800;color:var(--blu-scuro);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}"
     +".cap-ctr-p{font-size:15px;line-height:1.5;color:var(--testo)}"
     +".cap-ctr-s{font-size:15px;line-height:1.5;color:var(--testo-2);margin-top:4px}"
     +".cap-ctr-i .btn-ghost{margin-top:6px}"
     /* foto e allegati */
     +".cap-all{display:flex;align-items:center;gap:10px;margin-bottom:10px}"
     +".cap-all-th{flex:0 0 auto;width:64px;height:64px;border-radius:8px;object-fit:cover;background:var(--bordo);border:1px solid var(--bordo-forte)}"
     +".cap-all-n{flex:1 1 auto;min-width:0}"
     +".cap-all .rdel{flex:0 0 auto;min-width:44px;height:44px;border:1px solid var(--bordo-forte);background:var(--card);color:var(--err);border-radius:10px;cursor:pointer;font-size:22px}"
     +".cap-st{font-size:14px;line-height:1.5;color:var(--testo-2);margin-top:6px}"
     +".cap-st--ok{color:var(--ok);font-weight:700}"
     +".cap-st--err{color:var(--err);font-weight:700}"
     /* le firme */
     +".cap-firma{margin-bottom:16px}"
     +".cap-firma-c{display:block;width:100%;aspect-ratio:10/3;border:2px dashed var(--bordo-forte);border-radius:12px;background:#fff;touch-action:none;cursor:crosshair}"
     +".cap-firma-b{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px}";
    document.head.appendChild(s);
  }

  /* ---------- le voci ---------- */
  function voceHtml(v,i){
    v=v||{};
    var righe=Math.max(3,Math.min(12,String(v.cosa||"").split("\n").length+1));
    return '<div class="cap-voce" data-voce>'
      +'<div class="cap-voce-t"><span class="cap-voce-n">'+(i+1)+'.</span>'
      +'<div class="field cap-voce-f"><input class="cp-v-tit" placeholder="Es. Impianto idraulico" value="'+esc(v.titolo||"")+'"></div>'
      +'<button type="button" class="rdel" data-action="cap-voce-del" title="Togli questa voce">×</button></div>'
      +'<div class="field"><label>Cosa si fa</label><textarea class="cp-v-cosa" rows="'+righe+'" placeholder="Cosa fai, scritto per il cliente">'+esc(v.cosa||"")+'</textarea></div>'
      +'<div class="field"><label>Materiali (marca e tipo)</label><input class="cp-v-mat" placeholder="Es. Gres porcellanato 60x60, prima scelta" value="'+esc(v.materiali||"")+'"></div>'
      +'<div class="row2">'
      +'<div class="field"><label>Compreso</label><textarea class="cp-v-comp" rows="2" placeholder="Cosa è incluso nel prezzo">'+esc(v.compreso||"")+'</textarea></div>'
      +'<div class="field"><label>Escluso</label><textarea class="cp-v-esc" rows="2" placeholder="Cosa NON è incluso">'+esc(v.escluso||"")+'</textarea></div></div>'
      +'</div>';
  }
  function rinumera(){
    var e=document.querySelectorAll("#cp-voci .cap-voce .cap-voce-n");
    for(var i=0;i<e.length;i++) e[i].textContent=(i+1)+".";
  }
  function leggiVoci(){
    var out=[];
    var e=document.querySelectorAll("#cp-voci .cap-voce");
    for(var i=0;i<e.length;i++){
      var q=function(c){ var x=e[i].querySelector(c); return x?T(x.value):""; };
      var v={titolo:q(".cp-v-tit"),cosa:q(".cp-v-cosa"),materiali:q(".cp-v-mat"),compreso:q(".cp-v-comp"),escluso:q(".cp-v-esc")};
      if(!vuota(v)) out.push(v);
    }
    return out;
  }
  function riempiVoci(voci){
    var c=el("cp-voci"); if(!c) return;
    var h=""; (voci&&voci.length?voci:[{}]).forEach(function(v,i){ h+=voceHtml(v,i); });
    c.innerHTML=h;
  }
  function aggiungiVoci(voci){
    var c=el("cp-voci"); if(!c) return;
    /* le voci rimaste vuote (in un modulo nuovo ce n'e' una) si tolgono;
       quelle scritte a mano restano e le nuove vanno in fondo */
    var e=c.querySelectorAll(".cap-voce");
    for(var i=0;i<e.length;i++){
      var q=function(k){ var x=e[i].querySelector(k); return x?T(x.value):""; };
      if(vuota({titolo:q(".cp-v-tit"),cosa:q(".cp-v-cosa"),materiali:q(".cp-v-mat"),compreso:q(".cp-v-comp"),escluso:q(".cp-v-esc")})) e[i].remove();
    }
    var n=c.querySelectorAll(".cap-voce").length, h="";
    voci.forEach(function(v,i){ h+=voceHtml(v,n+i); });
    c.insertAdjacentHTML("beforeend",h);
    rinumera();
  }

  /* ---------- lo stato della finestra ---------- */
  /* lista = i capitolati del preventivo; att = quello che si vede;
     prima = i file gia' nel database all'apertura; sess = i file caricati in questa apertura */
  var _stato={id:null,p:null,righe:[],cli:{},lista:[],att:0,prima:[],sess:[],ctr:[]};
  var _pad={};

  function attivo(){ return _stato.lista[_stato.att]; }

  /* quello che c'e' scritto nelle caselle ADESSO (senza le firme) */
  function leggiContenuto(){
    var V=function(id){ var e=el(id); return e?T(e.value):""; };
    var base=attivo()||capVuoto();
    return {id:base.id,nome:V("cp-nome")||"Capitolato",voci:leggiVoci(),dove:V("cp-dove"),inizio:V("cp-inizio"),durata:V("cp-durata"),
            pagamenti:V("cp-pag"),garanzie:V("cp-gar"),note:V("cp-note"),allegati:base.allegati||[],firme:base.firme||{}};
  }
  /* come sopra, piu' le firme disegnate in questa apertura */
  function leggiForm(){
    var c=leggiContenuto();
    c.firme=Object.assign({},c.firme);
    ["impresa","cliente"].forEach(function(k){
      var pd=_pad[k]; if(!pd||!pd.mod) return;
      if(pd.vuoto) delete c.firme[k];
      else c.firme[k]={img:pd.cv.toDataURL("image/png"),data:pd.data||new Date().toISOString(),hash:pd.hash};
      pd.mod=false;
    });
    return c;
  }
  /* fotografa la scheda che si vede dentro la lista */
  function sync(){
    if(!_stato.lista||!_stato.lista.length) return null;
    var c=leggiForm();
    _stato.lista[_stato.att]=c;
    return c;
  }
  function haQualcosa(){ return leggiVoci().length>0; }

  /* ---------- le schede in alto ---------- */
  function renderSchede(){
    var c=el("cp-schede"); if(!c) return;
    var h=_stato.lista.map(function(x,i){
      return '<button type="button" class="cap-sch'+(i===_stato.att?' on':'')+'" data-action="cap-sch" data-i="'+i+'">'+esc(x.nome||"Capitolato")+'</button>';
    }).join("");
    h+='<button type="button" class="cap-sch-new" data-action="cap-sch-new">+ Nuovo capitolato</button>';
    c.innerHTML=h;
    var molti=_stato.lista.length>1;
    var d=el("cp-elimina"); if(d) d.style.display=molti?"":"none";
    var pt=el("cp-pdf-tutti"); if(pt) pt.style.display=molti?"":"none";
  }

  /* mette nelle caselle il capitolato della scheda scelta */
  function caricaForm(){
    var c=attivo(); if(!c) return;
    var S=function(id,v){ var e=el(id); if(e) e.value=v||""; };
    S("cp-nome",c.nome); S("cp-dove",c.dove); S("cp-inizio",c.inizio); S("cp-durata",c.durata);
    S("cp-pag",c.pagamenti); S("cp-gar",c.garanzie); S("cp-note",c.note);
    S("cp-modello",""); S("cp-pag-sel","");
    riempiVoci(c.voci&&c.voci.length?c.voci:null);
    var ctr=el("cp-ctr"); if(ctr){ ctr.hidden=true; ctr.innerHTML=""; }
    _stato.ctr=[];
    renderAllegati();
    iniziaPad("impresa"); iniziaPad("cliente");
    statoFirme();
    renderSchede();
  }

  function cambiaScheda(i){
    if(i<0||i>=_stato.lista.length||i===_stato.att) return;
    sync();
    _stato.att=i;
    caricaForm();
  }
  function nuovaScheda(nome,voci){
    var corr=sync();
    var c=capVuoto(nome||("Capitolato "+(_stato.lista.length+1)));
    if(corr&&corr.dove) c.dove=corr.dove;
    if(voci) c.voci=voci;
    _stato.lista.push(c);
    _stato.att=_stato.lista.length-1;
    caricaForm();
    return c;
  }
  function eliminaScheda(){
    if(_stato.lista.length<2) return;
    var c=attivo();
    if(!gconfirm('Elimino il capitolato «'+(c.nome||"Capitolato")+'»? Le sue voci, le foto e le firme si perdono.')) return;
    _stato.lista.splice(_stato.att,1);
    _stato.att=Math.max(0,_stato.att-1);
    caricaForm();
    toast("Capitolato tolto. Salva per confermare.");
  }

  /* ---------- il preventivo diventa voci ---------- */
  function gruppiPreventivo(){
    var g=[],cur=null;
    _stato.righe.forEach(function(r){
      if(_rigaSezione(r)){ cur={titolo:T(r.descrizione)||"Lavorazioni",righe:[],sez:true}; g.push(cur); return; }
      if(!T(r.descrizione)) return;
      if(!cur){ cur={titolo:"",righe:[],sez:false}; g.push(cur); }
      cur.righe.push(r);
    });
    return g;
  }
  function qtaTesto(r){ var q=+r.qta; return (q&&q!==1)?String(q).replace(".",","):""; }
  function rigaTesto(r){ var q=qtaTesto(r); return T(r.descrizione).slice(0,200)+(q?" — quantità "+q:""); }
  function voceDaRiga(r){
    var q=qtaTesto(r);
    return {titolo:T(r.descrizione).slice(0,120),cosa:q?"Quantità prevista: "+q:"",materiali:"",compreso:"",escluso:""};
  }
  /* se il preventivo ha i capitoli: UNA voce per capitolo, con tutte le sue righe e le quantita'.
     Se non li ha: una voce per riga. */
  function vociDaPreventivo(){
    var g=gruppiPreventivo(), out=[], haSez=g.some(function(x){ return x.sez; });
    g.forEach(function(x){
      if(!x.righe.length) return;
      if(haSez){
        var righe=x.righe.slice(0,40).map(function(r){ return "- "+rigaTesto(r); });
        if(x.righe.length>40) righe.push("- …e altre "+(x.righe.length-40)+" voci");
        out.push({titolo:(x.titolo||"Altre lavorazioni").slice(0,120),cosa:"Opere previste:\n"+righe.join("\n"),materiali:"",compreso:"",escluso:""});
      }else{
        x.righe.forEach(function(r){ out.push(voceDaRiga(r)); });
      }
    });
    return out;
  }
  function nCapitoli(){ return gruppiPreventivo().filter(function(x){ return x.sez&&x.righe.length; }).length; }

  /* ---------- la finestra ---------- */
  async function capitolatoForm(id){
    if(!sb||!sbUid){ toast("Devi essere loggato"); return; }
    var p=prevCache.find(function(x){ return String(x.id)===String(id); });
    if(!p){ toast("Preventivo non trovato"); return; }
    stile();
    var r1=await sb.from("gest_preventivi").select("capitolato").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(r1.error){
      /* 42703 = la colonna non c'e': il file SQL non e' stato eseguito */
      toast(r1.error.code==="42703"
        ? "Manca un pezzo nel database (sql/capitolato-nel-preventivo.sql). Avvisa Claude."
        : "Non riesco a leggere il capitolato: "+(r1.error.message||"il database non risponde")+". Riprova fra un attimo.");
      return;
    }
    var r2=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    var righe=(r2&&r2.data)||[];
    var cli=await cliDelDocumento(p.cliente_id);
    var lista=normalizza(r1.data&&r1.data.capitolato);
    var prima=[]; lista.forEach(function(c){ c.allegati.forEach(function(a){ prima.push(a.path); }); });
    _stato={id:id,p:p,righe:righe,cli:cli||{},lista:lista,att:0,prima:prima,sess:[],ctr:[]};
    _pad={};

    var modOpz='<option value="">— Scegli un modello —</option>'
      +Object.keys(MODELLI).map(function(k){ return '<option value="'+k+'">'+esc(MODELLI[k].nome)+'</option>'; }).join("");
    var pagOpz='<option value="">— Scegli, oppure scrivi sotto —</option>'
      +ORD_PAGAMENTI.map(function(o){ return '<option value="'+o[0]+'">'+esc(o[1])+'</option>'; }).join("");
    var nVoci=vociDaPreventivo().length, nCap=nCapitoli();
    var esempio="Rifacimento bagno 5 mq: demolisco tutto, nuovo impianto idraulico, gres 60x60 a terra e a parete, sanitari sospesi, doccia a filo pavimento. Tre settimane.";

    var corpo=
      '<div class="cap-schede" id="cp-schede"></div>'
      /* la riga dell'AI: stessa faccia di quella del preventivo */
      +'<div class="ai-riga" id="cp-ai">'
      +'<button type="button" class="ai-riga-apri" id="cp-ai-apri" aria-expanded="false" aria-controls="cp-ai-giu">'
      +'<span class="ai-riga-mk">AI</span><span class="ai-riga-t">Descrivi il lavoro a parole e ti scrivo il capitolato</span><span class="ai-riga-c">1 credito</span></button>'
      +'<div class="ai-riga-giu" id="cp-ai-giu" hidden>'
      +'<label class="ai-riga-lab" for="cp-ai-in">Scrivi come lo racconteresti al telefono</label>'
      +'<textarea id="cp-ai-in" rows="3" placeholder="'+esc(esempio)+'"></textarea>'
      +'<div class="ai-riga-az"><button type="button" class="ai-riga-go" id="cp-ai-go" data-action="cap-ai">Scrivi il capitolato</button>'
      +'<div class="ai-riga-st" id="cp-ai-st" role="status"></div></div></div></div>'
      /* il controllo dell'AI */
      +'<div class="ai-riga" id="cp-ctr-riga">'
      +'<button type="button" class="ai-riga-apri" id="cp-ctr-go" data-action="cap-ctr">'
      +'<span class="ai-riga-mk">AI</span><span class="ai-riga-t">Controlla cosa manca o può far discutere</span><span class="ai-riga-c">1 credito</span></button></div>'
      +'<div class="cap-ctr" id="cp-ctr" role="status" hidden></div>'
      +'<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Che capitolato è</div>'
      +'<div class="cap-riep"><b>Preventivo n. '+esc(p.numero||"")+'</b> del '+esc(fdate(p.data||todayStr()))+(p.titolo?' — '+esc(p.titolo):'')
      +'<br>Cliente: <b>'+esc(cli&&cli.nome?cli.nome:"— nessuno —")+'</b></div>'
      +'<div class="field"><label>Nome di questo capitolato</label><input id="cp-nome" maxlength="40" placeholder="Es. Bagno, Cucina, Tetto"></div>'
      +'<div class="field"><label>Indirizzo del cantiere</label><input id="cp-dove" placeholder="Es. Via Roma 12, Rieti"></div>'
      +'<div class="field"><label>Parti da un modello</label><select id="cp-modello">'+modOpz+'</select>'
      +'<div class="campo-aiuto">Il modello scrive già le voci. Tu cambi quello che serve.</div></div>'
      +'<button type="button" class="btn-ghost quick-add" id="cp-elimina" data-action="cap-sch-del" style="display:none">Elimina questo capitolato</button>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">Tempi e pagamenti</div>'
      +'<div class="row2"><div class="field"><label>Inizio lavori</label><input type="date" id="cp-inizio"></div>'
      +'<div class="field"><label>Durata (giorni lavorativi)</label><input id="cp-durata" inputmode="numeric" placeholder="Es. 15"></div></div>'
      +'<div class="field"><label>Come si paga</label><select id="cp-pag-sel">'+pagOpz+'</select>'
      +'<textarea id="cp-pag" rows="3" style="margin-top:8px" placeholder="Es. 30% alla firma, 40% a metà lavori, 30% a fine lavori"></textarea></div>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">Foto e allegati</div>'
      +'<div class="campo-aiuto" style="margin-bottom:10px">Foto del cantiere, planimetrie, schede dei materiali fotografate. Finiscono in fondo al PDF. Massimo '+MAX_ALL+'.</div>'
      +'<div id="cp-all"></div>'
      +'<input type="file" id="cp-file" accept="image/*" multiple hidden>'
      +'<button type="button" class="btn-ghost quick-add" id="cp-all-add" data-action="cap-all-add">+ Aggiungi foto</button>'
      +'<div class="cap-st" id="cp-all-st" role="status"></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Le voci dei lavori</div>'
      +'<div id="cp-voci"></div>'
      +'<div class="cap-azioni"><button type="button" class="btn-ghost quick-add" data-action="cap-voce-add">+ Aggiungi voce</button>'
      +(nVoci?'<button type="button" class="btn-ghost quick-add" data-action="cap-voci-prev">+ Porta le voci dal preventivo ('+nVoci+')</button>':'')
      +(nCap>=2?'<button type="button" class="btn-ghost quick-add" data-action="cap-prev-sep">Un capitolato per ogni capitolo ('+nCap+')</button>':'')
      +'</div></div>'
      +'<div class="sh-b"><div class="sh-tit">Garanzie e note</div>'
      +'<div class="field"><label>Garanzie in più (la garanzia di legge la scrive già il PDF)</label><textarea id="cp-gar" rows="2" placeholder="Es. Garanzia di 2 anni sull\'impianto idraulico"></textarea></div>'
      +'<div class="field"><label>Note e condizioni particolari</label><textarea id="cp-note" rows="3" placeholder="Es. Il cliente fornisce le piastrelle. Smaltimento macerie a carico dell\'impresa."></textarea></div>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">Firme</div>'
      +'<div class="campo-aiuto" style="margin-bottom:10px">Si firma col dito, sullo schermo. La firma vale solo per il testo che c\'è adesso: se lo cambi, va rifatta.</div>'
      +firmaHtml("cliente","Firma del cliente")
      +firmaHtml("impresa","Firma dell'impresa")
      +'</div>'
      +'</div></div>';

    openSheetGrande("Capitolato — "+(p.titolo||("preventivo n. "+(p.numero||""))),
      corpo,
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn" id="cp-pdf-tutti" data-action="cap-pdf-tutti" data-id="'+esc(String(id))+'" style="display:none">📄 PDF di tutti</button>'
      +'<button class="btn" data-action="cap-pdf" data-id="'+esc(String(id))+'">📄 Scarica PDF</button>'
      +'<button class="btn-primary b-save" data-action="cap-salva" data-id="'+esc(String(id))+'">Salva capitolato</button>');
    caricaForm();

    /* apre e chiude la riga dell'AI */
    var apri=el("cp-ai-apri"), giu=el("cp-ai-giu"), riga=el("cp-ai");
    if(apri&&giu) apri.onclick=function(){
      var apre=giu.hasAttribute("hidden");
      if(apre) giu.removeAttribute("hidden"); else giu.setAttribute("hidden","");
      apri.setAttribute("aria-expanded",apre?"true":"false");
      if(riga) riga.classList.toggle("ai-riga--aperta",apre);
      if(apre) setTimeout(function(){ var i=el("cp-ai-in"); if(i) i.focus(); },60);
    };
  }

  /* ---------- le firme col dito ---------- */
  function firmaHtml(k,titolo){
    return '<div class="cap-firma"><label class="ai-riga-lab" style="display:block;margin-bottom:6px">'+esc(titolo)+'</label>'
      +'<canvas class="cap-firma-c" id="cp-pad-'+k+'" aria-label="'+esc(titolo)+'"></canvas>'
      +'<div class="cap-firma-b"><button type="button" class="btn-ghost quick-add" data-action="cap-firma-del" data-k="'+k+'">Cancella la firma</button>'
      +'<span class="cap-st" id="cp-firma-st-'+k+'" role="status"></span></div></div>';
  }
  function iniziaPad(k){
    var cv=el("cp-pad-"+k); if(!cv) return;
    var r=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    var w=Math.max(300,Math.round((r.width||600)*dpr));
    cv.width=w; cv.height=Math.round(w*0.3);
    var g=cv.getContext("2d");
    g.lineWidth=Math.max(2,2.4*dpr); g.lineCap="round"; g.lineJoin="round"; g.strokeStyle="#111";
    var pd=_pad[k]={cv:cv,g:g,mod:false,vuoto:true,giu:false,hash:"",data:""};
    var f=(attivo()&&attivo().firme||{})[k];
    if(f&&f.img){
      pd.vuoto=false;
      var im=new Image();
      im.onload=function(){ g.drawImage(im,0,0,cv.width,cv.height); };
      im.src=f.img;
    }
    var punto=function(e){ var b=cv.getBoundingClientRect(); return {x:(e.clientX-b.left)*cv.width/b.width,y:(e.clientY-b.top)*cv.height/b.height}; };
    cv.onpointerdown=function(e){
      e.preventDefault();
      try{ cv.setPointerCapture(e.pointerId); }catch(_){}
      pd.giu=true; var s=punto(e);
      g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x+0.1,s.y+0.1); g.stroke();
    };
    cv.onpointermove=function(e){
      if(!pd.giu) return; e.preventDefault();
      var s=punto(e); g.lineTo(s.x,s.y); g.stroke(); g.beginPath(); g.moveTo(s.x,s.y);
    };
    var fine=function(){
      if(!pd.giu) return; pd.giu=false;
      pd.mod=true; pd.vuoto=false; pd.data=new Date().toISOString();
      pd.hash=impronta(leggiContenuto());
      statoFirme();
    };
    cv.onpointerup=fine; cv.onpointercancel=fine;
  }
  function cancellaPad(k){
    var pd=_pad[k]; if(!pd) return;
    pd.g.clearRect(0,0,pd.cv.width,pd.cv.height);
    pd.mod=true; pd.vuoto=true; pd.hash=""; pd.data="";
    statoFirme();
  }
  /* la firma e' valida solo se il testo non e' cambiato dopo */
  function firmaValida(f,c){ return !!(f&&f.img&&f.hash&&f.hash===impronta(c)); }
  function statoFirme(){
    var c=leggiContenuto();
    ["impresa","cliente"].forEach(function(k){
      var st=el("cp-firma-st-"+k); if(!st) return;
      var pd=_pad[k], f=null;
      if(pd&&pd.mod){ f=pd.vuoto?null:{img:"x",hash:pd.hash,data:pd.data}; }
      else f=(c.firme||{})[k];
      st.className="cap-st";
      if(!f||!f.img){ st.textContent="Non ancora firmato."; return; }
      if(firmaValida(f,c)){ st.className="cap-st cap-st--ok"; st.textContent="Firmato il "+oraIt(f.data||new Date().toISOString())+"."; }
      else{ st.className="cap-st cap-st--err"; st.textContent="Il capitolato è cambiato dopo la firma: la firma non vale più. Fai firmare di nuovo."; }
    });
  }

  /* ---------- foto e allegati ---------- */
  function nomePulito(n){ return String(n||"Foto").replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim().slice(0,60)||"Foto"; }
  function riduciImmagine(file){
    return new Promise(function(ok,ko){
      var url=URL.createObjectURL(file), im=new Image();
      im.onload=function(){
        var k=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight));
        var w=Math.max(1,Math.round(im.naturalWidth*k)), h=Math.max(1,Math.round(im.naturalHeight*k));
        var c=document.createElement("canvas"); c.width=w; c.height=h;
        var g=c.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,w,h); g.drawImage(im,0,0,w,h);
        c.toBlob(function(b){ URL.revokeObjectURL(url); if(b) ok({blob:b,w:w,h:h}); else ko(new Error("immagine non leggibile")); },"image/jpeg",0.82);
      };
      im.onerror=function(){ URL.revokeObjectURL(url); ko(new Error("formato non supportato: manda una foto JPG o PNG")); };
      im.src=url;
    });
  }
  function renderAllegati(){
    var box=el("cp-all"); if(!box) return;
    var c=attivo(); var a=(c&&c.allegati)||[];
    box.innerHTML=a.map(function(x,i){
      return '<div class="cap-all" data-i="'+i+'"><img class="cap-all-th" alt="" data-path="'+esc(x.path)+'">'
        +'<input class="cap-all-n" data-i="'+i+'" value="'+esc(x.nome)+'" maxlength="60" aria-label="Didascalia">'
        +'<button type="button" class="rdel" data-action="cap-all-del" data-i="'+i+'" title="Togli">×</button></div>';
    }).join("");
    var add=el("cp-all-add"); if(add) add.style.display=a.length>=MAX_ALL?"none":"";
    if(!a.length) return;
    try{
      var r=sb.storage.from(BUCKET).createSignedUrls(a.map(function(x){ return x.path; }),3600);
      Promise.resolve(r).then(function(res){
        var d=(res&&res.data)||[];
        d.forEach(function(s){
          if(!s||!s.signedUrl) return;
          var im=box.querySelector('img[data-path="'+(window.CSS&&CSS.escape?CSS.escape(s.path):s.path)+'"]');
          if(im) im.src=s.signedUrl;
        });
      }).catch(function(){});
    }catch(e){}
  }
  async function aggiungiAllegati(files){
    var st=el("cp-all-st");
    sync();
    var c=attivo(); if(!c) return;
    var libero=MAX_ALL-c.allegati.length;
    if(libero<=0){ toast("Massimo "+MAX_ALL+" allegati per capitolato"); return; }
    files=[].slice.call(files).slice(0,libero);
    var fatti=0;
    for(var i=0;i<files.length;i++){
      var f=files[i];
      if(st){ st.className="cap-st"; st.textContent="Carico "+(i+1)+" di "+files.length+"..."; }
      try{
        var r=await riduciImmagine(f);
        var path=sbUid+"/capitolati/"+_stato.id+"/"+c.id+"_"+Date.now()+"_"+i+".jpg";
        var up=await sb.storage.from(BUCKET).upload(path,r.blob,{contentType:"image/jpeg"});
        if(up&&up.error) throw up.error;
        c.allegati.push({path:path,nome:nomePulito(f.name)});
        _stato.sess.push(path);
        fatti++;
      }catch(e){
        if(st){ st.className="cap-st cap-st--err"; st.textContent="Non riesco a caricare «"+f.name+"»: "+((e&&e.message)||"riprova")+"."; }
      }
    }
    if(fatti&&st){ st.className="cap-st cap-st--ok"; st.textContent=fatti+(fatti===1?" foto caricata":" foto caricate")+". Salva per tenerle."; }
    renderAllegati(); statoFirme();
  }
  async function togliFile(paths){
    for(var i=0;i<paths.length;i++){
      try{
        if(typeof _fileOrfano==="function") await _fileOrfano(BUCKET,paths[i]);
        else await sb.storage.from(BUCKET).remove([paths[i]]);
      }catch(e){}
    }
  }
  function tuttiIPath(lista){ var o=[]; lista.forEach(function(c){ (c.allegati||[]).forEach(function(a){ o.push(a.path); }); }); return o; }

  /* ---------- salvare ---------- */
  async function salva(id,zitto){
    if(!sync()) return null;
    var lista=_stato.lista.map(function(c){ return pulisci(c); }).filter(nonVuoto);
    /* pulisci() butta le firme sbagliate? No: le tiene, ma la firma dentro e' valida solo col suo testo */
    var dati=lista.length?{capitolati:lista,aggiornato:new Date().toISOString()}:null;
    var res=await sb.from("gest_preventivi").update({capitolato:dati}).eq("id",id).eq("user_id",sbUid).select("id");
    if(res.error||!res.data||!res.data.length){
      toast("Non salvato: "+((res.error&&res.error.message)||"il preventivo non risponde")+". Riprova.");
      return null;
    }
    /* i file che non servono piu' (tolti, o caricati e poi lasciati) si cancellano ora */
    var finali=tuttiIPath(lista);
    var daTogliere=_stato.prima.concat(_stato.sess).filter(function(p,i,a){ return finali.indexOf(p)<0&&a.indexOf(p)===i; });
    if(daTogliere.length) await togliFile(daTogliere);
    _stato.prima=finali; _stato.sess=[];
    if(!zitto) toast("Capitolato salvato ✅");
    return dati||{capitolati:[]};
  }
  /* si esce senza salvare: i file caricati in questa apertura non servono a nessuno */
  async function chiudiSenzaSalvare(){
    var daTogliere=(_stato.sess||[]).filter(function(p){ return (_stato.prima||[]).indexOf(p)<0; });
    _stato.sess=[];
    if(daTogliere.length) await togliFile(daTogliere);
  }

  /* ---------- l'AI che scrive ---------- */
  async function scriviConAI(){
    var inp=el("cp-ai-in"), go=el("cp-ai-go"), st=el("cp-ai-st");
    if(!inp||!go||!st) return;
    var testo=T(inp.value);
    if(!testo){ st.className="ai-riga-st ai-riga-st--err"; st.textContent="Scrivi due righe qui sopra e riprovo."; inp.focus(); return; }
    if(!window.AI||typeof window.AI.capitolato!=="function"){
      st.className="ai-riga-st ai-riga-st--err"; st.textContent="L'assistente non si è caricato. Ricarica la pagina e riprova."; return;
    }
    /* le voci del preventivo vanno anche all'AI: cosi' il capitolato parla
       delle stesse lavorazioni che il cliente ha letto nel preventivo */
    /* ⛔ IL SERVER ACCETTA AL MASSIMO 8000 CARATTERI. Un preventivo grosso (visto dal
       vivo il 16 ott: quasi 90 voci) li superava e l'AI rispondeva «Il testo e' troppo
       lungo» senza fare niente. Per questo qui si taglia: il testo scritto da chi usa
       il gestionale ha la precedenza (fino a 3000), le voci del preventivo entrano
       una per una finche' c'e' posto, ognuna accorciata a 140 caratteri. */
    var righe=_stato.righe.filter(function(r){ return !_rigaSezione(r)&&T(r.descrizione); });
    var MAX=7400;
    var input=testo.slice(0,3000);
    if(_stato.p&&_stato.p.titolo) input+="\n\nTitolo del preventivo: "+T(_stato.p.titolo).slice(0,200);
    if(righe.length){
      var elenco=[], tot=input.length+30;
      for(var k=0;k<righe.length;k++){
        var riga="- "+T(righe[k].descrizione).slice(0,140);
        if(tot+riga.length+1>MAX) break;
        elenco.push(riga); tot+=riga.length+1;
      }
      if(elenco.length) input+="\n\nVoci del preventivo:\n"+elenco.join("\n");
    }
    var prima=go.textContent;
    go.disabled=true; go.textContent="Ci penso io...";
    st.className="ai-riga-st"; st.textContent="";
    try{
      var d=await window.AI.capitolato(input);
      if(d===null){ go.disabled=false; go.textContent=prima; return; }   /* crediti finiti: l'avviso l'ha gia' dato l'AI */
      var messi=[];
      var nuove=(d.voci||[]).map(copiaVoce).filter(function(v){ return !vuota(v); });
      if(nuove.length){ aggiungiVoci(nuove); messi.push(nuove.length+(nuove.length===1?" voce":" voci")); }
      /* una casella gia' scritta non si tocca */
      var metti=function(id,val,nome){
        var e=el(id); val=T(val);
        if(!e||!val||T(e.value)) return;
        e.value=val; messi.push(nome);
      };
      metti("cp-durata",d.durata_giorni==null?"":String(parseInt(d.durata_giorni,10)||""),"durata");
      metti("cp-pag",d.pagamenti,"pagamenti");
      metti("cp-gar",d.garanzie,"garanzie");
      metti("cp-note",d.note,"note");
      if(!messi.length){
        st.className="ai-riga-st ai-riga-st--err";
        st.textContent="Non ho capito niente di utile. Prova a scriverlo con più dettagli: cosa, dove, quanto tempo.";
      }else{
        st.className="ai-riga-st ai-riga-st--ok";
        st.textContent="Fatto: "+messi.join(", ")+". Leggi e correggi quello che non va: la firma è tua.";
      }
      statoFirme();
    }catch(e){
      st.className="ai-riga-st ai-riga-st--err";
      st.textContent=(e&&e.message)?e.message:"Non ci sono riuscito. Riprova fra un attimo.";
    }
    go.disabled=false; go.textContent=prima;
  }

  /* ---------- l'AI che controlla ---------- */
  function testoPerControllo(c){
    var cut=function(s,n){ return T(s).slice(0,n); };
    var s=[];
    s.push("Lavoro: "+cut(_stato.p&&_stato.p.titolo,200));
    if(c.dove) s.push("Luogo: "+cut(c.dove,200));
    s.push("Inizio lavori: "+(c.inizio||"non indicato")+" · Durata (giorni lavorativi): "+(c.durata||"non indicata"));
    s.push("Pagamenti: "+(cut(c.pagamenti,500)||"non indicati"));
    s.push("Garanzie in più: "+(cut(c.garanzie,400)||"nessuna"));
    s.push("Note: "+(cut(c.note,600)||"nessuna"));
    s.push("\nVOCI DEL CAPITOLATO:");
    c.voci.forEach(function(v,i){
      s.push((i+1)+". "+cut(v.titolo,120)+" | Cosa: "+cut(v.cosa,500)+" | Materiali: "+(cut(v.materiali,200)||"non indicati")+" | Compreso: "+(cut(v.compreso,300)||"niente")+" | Escluso: "+(cut(v.escluso,300)||"niente"));
    });
    var out=s.join("\n");
    var righe=_stato.righe.filter(function(r){ return !_rigaSezione(r)&&T(r.descrizione); });
    if(righe.length){
      var MAX=7400, el2=["\n\nVOCI DEL PREVENTIVO:"], tot=out.length+24;
      for(var k=0;k<righe.length;k++){
        var riga="- "+cut(righe[k].descrizione,120);
        if(tot+riga.length+1>MAX) break;
        el2.push(riga); tot+=riga.length+1;
      }
      if(el2.length>1) out+=el2.join("\n");
    }
    return out.slice(0,7900);
  }
  async function controllaConAI(){
    var go=el("cp-ctr-go"), box=el("cp-ctr"); if(!go||!box) return;
    var c=sync();
    if(!c||!c.voci.length){ toast("Scrivi prima almeno una voce dei lavori, poi la faccio controllare"); return; }
    if(!window.AI||typeof window.AI.capitolato!=="function"){ toast("L'assistente non si è caricato. Ricarica la pagina e riprova."); return; }
    var lab=go.querySelector(".ai-riga-t"), prima=lab?lab.textContent:"";
    go.disabled=true; if(lab) lab.textContent="Sto controllando...";
    try{
      var d=await window.AI.capitolato(testoPerControllo(c),"controllo");
      if(d===null) return;   /* crediti finiti: l'avviso l'ha gia' dato l'AI */
      var seg=(d.segnalazioni||[]).filter(function(x){ return x&&(T(x.problema)||T(x.suggerimento)); }).slice(0,8);
      _stato.ctr=seg;
      var h='<div class="cap-ctr-g">'+esc(T(d.giudizio)||(seg.length?"Ho trovato "+seg.length+(seg.length===1?" cosa":" cose")+" da guardare.":"Non ho trovato niente che manca."))+'</div>';
      seg.forEach(function(x,i){
        h+='<div class="cap-ctr-i"><div class="cap-ctr-d">'+esc(T(x.dove)||"Generale")+'</div>'
          +'<div class="cap-ctr-p">'+esc(T(x.problema))+'</div>'
          +(T(x.suggerimento)?'<div class="cap-ctr-s">Da scrivere: «'+esc(T(x.suggerimento))+'»</div>'
            +'<button type="button" class="btn-ghost quick-add" data-action="cap-ctr-nota" data-i="'+i+'">Aggiungi alle note</button>':'')
          +'</div>';
      });
      box.innerHTML=h; box.hidden=false;
    }catch(e){
      box.innerHTML='<div class="cap-ctr-g cap-st--err">'+esc((e&&e.message)||"Non ci sono riuscito. Riprova fra un attimo.")+'</div>'; box.hidden=false;
    }finally{
      go.disabled=false; if(lab) lab.textContent=prima;
    }
  }

  /* ---------- il PDF ---------- */
  function coloreImpresa(d){
    var c=d&&((d.personalizzazione&&d.personalizzazione.colore_header)||d.colore_header);
    var m=/^#?([0-9a-f]{6})$/i.exec(T(c)); if(!m) return null;
    var n=parseInt(m[1],16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    /* troppo chiaro = illeggibile sulla carta bianca */
    if((0.299*r+0.587*g+0.114*b)>170) return null;
    return [r,g,b];
  }
  function leggiBlobDataUrl(blob){
    return new Promise(function(ok,ko){ var fr=new FileReader(); fr.onload=function(){ ok(fr.result); }; fr.onerror=function(){ ko(new Error("lettura")); }; fr.readAsDataURL(blob); });
  }
  function misuraImmagine(url){
    return new Promise(function(ok,ko){ var im=new Image(); im.onload=function(){ ok({w:im.naturalWidth,h:im.naturalHeight}); }; im.onerror=function(){ ko(new Error("immagine")); }; im.src=url; });
  }

  async function capitolatoPdf(id,tutti){
    if(!(await caricaJsPDF())){ toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
    var p=prevCache.find(function(x){ return String(x.id)===String(id); }); if(!p){ toast("Preventivo non trovato"); return; }
    var rz=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    var az=rz&&rz.data;
    if(!az||!az.nome){ toast("Compila prima i Dati azienda"); return aziendaForm(); }
    if(!sync()){ toast("Apri prima il capitolato"); return; }
    var daFare=(tutti?_stato.lista:[attivo()]).map(function(c){ return pulisci(c); }).filter(function(c){ return c.voci.length; });
    if(!daFare.length){ toast("Scrivi almeno una voce dei lavori, o scegli un modello"); return; }
    if(tutti){
      var senza=_stato.lista.filter(function(c){ return !c.voci.length&&nonVuoto(pulisci(c)); });
      if(senza.length){ toast("«"+(senza[0].nome||"Capitolato")+"» non ha voci: lo salto nel PDF"); }
    }
    /* il PDF salva anche: quello che esce sul foglio e' quello che resta nel gestionale */
    var salvato=await salva(id,true);
    if(!salvato) return;
    var col=null;
    try{ var ri=await sb.from("imprese").select("colore_header,personalizzazione").eq("user_id",sbUid).maybeSingle(); col=coloreImpresa(ri&&ri.data); }catch(e){}
    var c=_stato.cli||{};
    var rr=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    var imponibile=0; ((rr&&rr.data)||[]).forEach(function(r){ imponibile+=impRiga(r.qta,r.prezzo); });
    var perc=(p.iva_perc==null||p.iva_perc==="")?null:(+p.iva_perc||0);
    var ivaVal=perc?_centPerc(imponibile,perc):0;
    var totale=_cent2(imponibile+ivaVal);

    var doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
    var M=18, R=210-M, L=R-M, y=20;
    function colorTesto(colore,predefinito){
      if(Array.isArray(colore)) doc.setTextColor(colore[0],colore[1],colore[2]);
      else doc.setTextColor(colore==null?(predefinito||0):colore);
    }
    function stileTesto(size,grassetto,colore){
      doc.setFont("helvetica",grassetto?"bold":"normal"); doc.setFontSize(size||9.5); colorTesto(colore);
    }
    /* ogni pagina ha una fascia sottile nel colore dell'impresa */
    function fascia(){ if(col){ doc.setFillColor(col[0],col[1],col[2]); doc.rect(0,0,210,3.2,"F"); } }
    function nuovaPagina(){ doc.addPage(); fascia(); y=20; }
    function paragrafo(txt,size,grassetto,colore,rientro){
      stileTesto(size,grassetto,colore);
      var r=rientro||0;
      doc.splitTextToSize(String(txt),L-r).forEach(function(riga){
        if(y+4.6>272){ nuovaPagina(); stileTesto(size,grassetto,colore); }
        doc.text(riga,M+r,y); y+=4.6;
      });
      doc.setTextColor(0);
    }
    var nArt=0;
    function titoletto(t){ nArt++; y+=4; if(y+10>272){ nuovaPagina(); } paragrafo(nArt+". "+t,10.5,true,col); y+=1.5; }

    /* le allegate: si scaricano prima, cosi' un file mancante non rompe il PDF a meta' */
    var foto={};
    for(var ci=0;ci<daFare.length;ci++){
      for(var ai=0;ai<daFare[ci].allegati.length;ai++){
        var a=daFare[ci].allegati[ai];
        try{
          var dl=await sb.storage.from(BUCKET).download(a.path);
          if(dl&&dl.error) throw dl.error;
          var url=await leggiBlobDataUrl(dl.data);
          var mis=await misuraImmagine(url);
          foto[a.path]={url:url,w:mis.w,h:mis.h};
        }catch(e){ /* resta fuori: nel PDF compare «immagine non disponibile» */ }
      }
    }

    async function scriviCapitolato(dati,indice){
      nArt=0;
      if(indice>0) doc.addPage();
      fascia(); y=20;
      /* intestazione impresa */
      y=window.gestLogoPdf?await window.gestLogoPdf(doc,M,y):y;
      doc.setFont("helvetica","bold"); doc.setFontSize(15); colorTesto(col); doc.text(az.nome,M,y);
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
      var hy=y+6;
      [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
        .filter(Boolean).forEach(function(t){ doc.text(t,M,hy); hy+=4.5; });
      doc.setTextColor(0);
      y=hy+6; if(col) doc.setDrawColor(col[0],col[1],col[2]); else doc.setDrawColor(210);
      doc.line(M,y,R,y); y+=9;

      doc.setFont("helvetica","bold"); doc.setFontSize(15); colorTesto(col);
      doc.text("CAPITOLATO DEI LAVORI",105,y,{align:"center"}); y+=6;
      doc.setTextColor(0);
      var nome=(daFare.length>1||(dati.nome&&dati.nome!=="Capitolato"))?dati.nome:"";
      if(nome){ doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(nome,105,y,{align:"center"}); y+=5.5; }
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
      doc.text("Rif. preventivo n. "+(p.numero||"")+" del "+fdate(p.data||todayStr()),105,y,{align:"center"});
      doc.setTextColor(0); y+=10;

      /* le parti */
      var cliInd=[T(c.indirizzo),[T(c.cap),T(c.citta)].filter(Boolean).join(" ")+(T(c.prov)?" ("+String(c.prov).toUpperCase()+")":"")].filter(function(x){ return x&&x.trim(); }).join(", ");
      var cliRighe=[c.nome||"—"];
      if(cliInd) cliRighe.push(cliInd);
      if(c.piva) cliRighe.push("P.IVA "+c.piva);
      if(c.cod_fiscale) cliRighe.push("C.F. "+c.cod_fiscale);
      paragrafo("IL COMMITTENTE",9.5,true); cliRighe.forEach(function(r){ paragrafo(r,9.5,false); }); y+=3;
      paragrafo("L'IMPRESA ESECUTRICE",9.5,true);
      [az.nome,azIndirizzo(az),az.piva?"P.IVA "+az.piva:""].filter(Boolean).forEach(function(r){ paragrafo(r,9.5,false); });
      y+=2;

      titoletto("Oggetto dei lavori");
      paragrafo((p.titolo||"Lavori")+(dati.dove?". Luogo di esecuzione: "+dati.dove:"")+".");

      titoletto("Descrizione delle opere");
      var art=nArt;
      dati.voci.forEach(function(v,i){
        if(y+22>272){ nuovaPagina(); }
        y+=1.5;
        paragrafo(art+"."+(i+1)+"  "+(v.titolo||"Lavorazione"),10,true);
        if(v.cosa) paragrafo(v.cosa,9.5,false,0,4);
        if(v.materiali) paragrafo("Materiali: "+v.materiali,9.5,false,0,4);
        if(v.compreso) paragrafo("Compreso: "+v.compreso,9.5,false,0,4);
        if(v.escluso) paragrafo("Escluso: "+v.escluso,9.5,false,0,4);
        y+=1.5;
      });
      paragrafo("Tutto quanto non espressamente indicato in questo capitolato si intende escluso.",8.8,false,90);

      if(dati.inizio||dati.durata){
        titoletto("Tempi di esecuzione");
        var tempi=[];
        if(dati.inizio) tempi.push("I lavori avranno inizio il "+fdate(dati.inizio)+".");
        if(dati.durata) tempi.push("La durata prevista è di "+dati.durata+" giorni lavorativi.");
        paragrafo(tempi.join(" ")+" Non sono computati nei termini i giorni di maltempo che impediscono la lavorazione e le sospensioni richieste dal Committente.");
      }

      titoletto("Corrispettivo e pagamenti");
      paragrafo("Il corrispettivo è quello indicato nel preventivo n. "+(p.numero||"")+" del "+fdate(p.data||todayStr())
        +", che fa parte di questo capitolato: totale "+eurPdf(totale)+(perc?" (IVA "+_pct(perc)+"% compresa)":" (IVA esclusa)")+".");
      if(dati.pagamenti){ y+=1; paragrafo(dati.pagamenti); }
      if(az.iban){ y+=1; paragrafo("Il pagamento avviene tramite bonifico bancario sull'IBAN "+az.iban+"."); }

      titoletto("Garanzia");
      paragrafo("L'Impresa garantisce le opere eseguite a regola d'arte ai sensi degli artt. 1667 e 1669 del codice civile. "
        +"Eventuali difformità o vizi devono essere segnalati dal Committente per iscritto entro i termini di legge."
        +(dati.garanzie?" "+dati.garanzie:""));

      titoletto("Varianti e lavori aggiuntivi");
      paragrafo("Ogni lavorazione non prevista in questo capitolato deve essere concordata per iscritto fra le parti, con il relativo prezzo, prima di essere eseguita.");

      if(dati.note){ titoletto("Condizioni particolari"); paragrafo(dati.note); }

      if(dati.allegati.length){
        titoletto("Allegati");
        dati.allegati.forEach(function(a,i){ paragrafo("Allegato "+(i+1)+" - "+(a.nome||"Foto"),9.5,false,0,4); });
        paragrafo("Gli allegati si trovano nelle pagine in fondo a questo documento.",8.8,false,90);
      }

      /* le firme: un blocco unico, che non si spezza fra due pagine */
      if(y+50>280){ nuovaPagina(); }
      y+=8;
      paragrafo((T(az.citta)?az.citta+", ":"")+"li "+fdate(todayStr()),9.5,false);
      y+=16;
      doc.setDrawColor(120);
      var lineaY=y;
      doc.line(M,y,M+70,y); doc.line(R-70,y,R,y);
      /* la firma col dito si stampa solo se il testo e' quello che c'era quando e' stata fatta */
      var firmato={};
      [["impresa",M],["cliente",R-70]].forEach(function(k){
        var f=(dati.firme||{})[k[0]];
        if(firmaValida(f,dati)){
          try{ doc.addImage(f.img,"PNG",k[1]+2,lineaY-17,55,16.5); firmato[k[0]]=f; }catch(e){}
        }
      });
      y+=5;
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
      doc.text("L'Impresa",M,y); doc.text("Il Committente",R-70,y);
      if(firmato.impresa||firmato.cliente){
        doc.setFontSize(8);
        if(firmato.impresa) doc.text("Firmato il "+oraIt(firmato.impresa.data),M,y+4.5);
        if(firmato.cliente) doc.text("Firmato il "+oraIt(firmato.cliente.data),R-70,y+4.5);
        doc.setFontSize(7.5);
        doc.text("Firma elettronica semplice apposta sul dispositivo dell'Impresa.",M,y+10);
      }
      doc.setTextColor(0);

      /* le foto allegate, una per pagina */
      for(var i=0;i<dati.allegati.length;i++){
        var al=dati.allegati[i], ft=foto[al.path];
        nuovaPagina();
        paragrafo("Allegato "+(i+1)+" - "+(al.nome||"Foto"),11,true,col);
        y+=3;
        if(!ft){ paragrafo("(immagine non disponibile)",9.5,false,90); continue; }
        var maxW=L, maxH=235, k=Math.min(maxW/ft.w,maxH/ft.h);
        var w=ft.w*k, h=ft.h*k;
        try{ doc.addImage(ft.url,"JPEG",M+(L-w)/2,y,w,h); }catch(e){ paragrafo("(immagine non disponibile)",9.5,false,90); }
      }
    }

    for(var n=0;n<daFare.length;n++) await scriviCapitolato(daFare[n],n);

    /* il piede di ogni pagina */
    var tot=doc.getNumberOfPages();
    for(var pg=1;pg<=tot;pg++){
      doc.setPage(pg);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(120);
      doc.text(String(az.nome),M,289);
      doc.text("Pagina "+pg+" di "+tot,R,289,{align:"right"});
    }
    doc.setTextColor(0);

    var etichetta=tutti&&daFare.length>1?"tutti":(daFare[0].nome&&daFare[0].nome!=="Capitolato"?daFare[0].nome:"");
    var nomeFile="capitolato-"+(p.numero||"")+(etichetta?"-"+String(etichetta).replace(/[^a-z0-9]+/gi,"-").toLowerCase().replace(/^-|-$/g,""):"")
      +"-"+String(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf";
    doc.save(nomeFile);
    toast("Capitolato scaricato ✅");
  }

  /* ---------- i pulsanti ---------- */
  document.addEventListener("click",async function(e){
    var t=e.target.closest&&e.target.closest("[data-action]"); if(!t) return;
    var a=t.dataset.action;
    if(a==="close"){ if(_stato&&_stato.sess&&_stato.sess.length) chiudiSenzaSalvare(); return; }
    if(a.indexOf("cap-")!==0&&a!=="prev-capitolato") return;
    if(a==="prev-capitolato") return capitolatoForm(t.dataset.id);
    if(a==="cap-salva"){ var d=await salva(t.dataset.id); if(d) closeSheet(); return; }
    if(a==="cap-pdf") return capitolatoPdf(t.dataset.id,false);
    if(a==="cap-pdf-tutti") return capitolatoPdf(t.dataset.id,true);
    if(a==="cap-ai") return scriviConAI();
    if(a==="cap-ctr") return controllaConAI();
    if(a==="cap-ctr-nota"){
      var s=_stato.ctr[+t.dataset.i]; var nt=el("cp-note"); if(!s||!nt) return;
      var riga=T(s.suggerimento); if(!riga) return;
      if(nt.value.indexOf(riga)>=0){ toast("È già nelle note"); return; }
      nt.value=(T(nt.value)?T(nt.value)+"\n":"")+riga;
      statoFirme(); toast("Aggiunto alle note ✔"); return;
    }
    if(a==="cap-sch") return cambiaScheda(+t.dataset.i);
    if(a==="cap-sch-new") return void nuovaScheda();
    if(a==="cap-sch-del") return eliminaScheda();
    if(a==="cap-voce-add"){
      var c=el("cp-voci"); if(!c) return;
      c.insertAdjacentHTML("beforeend",voceHtml({},c.querySelectorAll(".cap-voce").length));
      var ult=c.querySelectorAll(".cap-voce .cp-v-tit"); if(ult.length) ult[ult.length-1].focus();
      return;
    }
    if(a==="cap-voce-del"){
      var box=t.closest(".cap-voce"); if(box) box.remove();
      if(!document.querySelector("#cp-voci .cap-voce")) riempiVoci(null);
      rinumera(); statoFirme(); return;
    }
    if(a==="cap-voci-prev"){
      var voci=vociDaPreventivo();
      if(!voci.length){ toast("Il preventivo non ha voci"); return; }
      aggiungiVoci(voci); statoFirme(); toast("Voci portate dal preventivo ✔"); return;
    }
    if(a==="cap-prev-sep"){
      var g=gruppiPreventivo().filter(function(x){ return x.sez&&x.righe.length; });
      if(g.length<2) return;
      if(!gconfirm("Creo "+g.length+" capitolati, uno per ogni capitolo del preventivo. Continuo?")) return;
      var corr=sync();
      /* se il capitolato che si vede e' ancora vuoto, viene sostituito dal primo */
      if(corr&&!nonVuoto(pulisci(corr))&&_stato.lista.length===1){ _stato.lista=[]; _stato.att=0; }
      g.forEach(function(x){
        var cc=capVuoto(String(x.titolo).slice(0,40)); if(corr&&corr.dove) cc.dove=corr.dove;
        cc.voci=x.righe.map(voceDaRiga);
        _stato.lista.push(cc);
      });
      _stato.att=_stato.lista.length-g.length;
      caricaForm();
      toast(g.length+" capitolati creati ✔"); return;
    }
    if(a==="cap-all-add"){ var fi=el("cp-file"); if(fi){ fi.value=""; fi.click(); } return; }
    if(a==="cap-all-del"){
      sync(); var cu=attivo(); var ix=+t.dataset.i; if(!cu||!cu.allegati[ix]) return;
      cu.allegati.splice(ix,1); renderAllegati(); statoFirme(); return;
    }
    if(a==="cap-firma-del") return cancellaPad(t.dataset.k);
  });
  document.addEventListener("change",function(e){
    var t=e.target; if(!t||!t.id) return;
    if(t.id==="cp-file"){ if(t.files&&t.files.length) aggiungiAllegati(t.files); return; }
    if(t.id==="cp-modello"){
      var m=MODELLI[t.value]; if(!m) return;
      if(haQualcosa()&&!gconfirm("Questo modello sostituisce le voci che hai già scritto. Continuo?")){ t.value=""; return; }
      riempiVoci(m.voci.map(copiaVoce));
      var nm=el("cp-nome");
      if(nm&&/^Capitolato( \d+)?$/.test(T(nm.value)||"Capitolato")){ nm.value=m.nome.split(" — ")[0]; nomeScheda(); }
      statoFirme();
      toast("Modello caricato: cambia quello che serve");
      return;
    }
    if(t.id==="cp-pag-sel"){
      var k=t.value; if(!k) return;
      var txt=ORD_PAG_TESTO[k], box=el("cp-pag");
      if(box&&txt){ box.value=txt; statoFirme(); }
    }
  });
  /* il nome sulla scheda si aggiorna mentre scrivi; le didascalie delle foto restano nella lista;
     ogni modifica al testo controlla se le firme sono ancora valide */
  function nomeScheda(){
    var b=document.querySelector("#cp-schede .cap-sch.on"), n=el("cp-nome");
    if(b&&n) b.textContent=T(n.value)||"Capitolato";
  }
  document.addEventListener("input",function(e){
    var t=e.target; if(!t) return;
    if(t.id==="cp-nome"){ nomeScheda(); return; }
    if(t.classList&&t.classList.contains("cap-all-n")){
      var cu=attivo(), i=+t.dataset.i; if(cu&&cu.allegati[i]) cu.allegati[i].nome=T(t.value).slice(0,60);
      return;
    }
    if((t.id&&t.id.indexOf("cp-")===0)||(t.closest&&t.closest("#cp-voci"))) statoFirme();
  });

  window.gestCapitolato={apri:capitolatoForm,pdf:capitolatoPdf,modelli:MODELLI,normalizza:normalizza};
})();
