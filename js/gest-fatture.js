  /* ================= FATTURE =================
     Fino al 2 agosto la fattura non esisteva: erano tre caselle attaccate al
     lavoro (fatt_stato, num_fatt, data_fatt_emessa). Una fattura per lavoro,
     una riga sola, niente IVA, niente acconti, niente nota di credito — e
     senza l'IVA riga per riga il file XML per lo SDI non si poteva nemmeno
     cominciare.

     Ora la fattura è una cosa a se': gest_fatture + gest_fattura_righe, sullo
     stampo dei preventivi, più la tabella ponte gest_fattura_lavori che
     permette di mettere più lavori nella stessa fattura.

     La casella fatt_stato sul lavoro NON è stata cancellata: adesso è
     un riflesso. Quando una fattura passa a emessa o pagata, i lavori che ci
     stanno dentro si aggiornano da soli. Così Lavori, Report, Riepilogo ed
     Esporta continuano a funzionare esattamente come prima.
     ========================================== */

  const FATT_VISTE=[
    {k:"tutte",    lab:"Tutte"},
    {k:"bozze",    lab:"Bozze"},
    {k:"incassare",lab:"Da incassare"},
    {k:"scadute",  lab:"Scadute", err:true},
    {k:"pagate",   lab:"Pagate"}
  ];
  /* le aliquote che usa un'impresa edile: 22 ordinaria, 10 manutenzione e
     ristrutturazione, 4 prima casa, 0 quando l'IVA non si applica */
  const IVA_SCELTE=[22,10,4,0];
  /* Le casse dei tecnici, col codice che lo SDI vuole nel file elettronico.
     TC03 = Cassa Geometri, TC04 = Inarcassa (ingegneri e architetti),
     TC17 = EPPI (periti industriali), TC22 = INPS gestione separata.
     ⚠️ Da far confermare al commercialista la prima volta. */
  /* 12 agosto 2026 (sera) — FATT_CASSE non si usa piu': le cinque combinazioni
     fisse "percentuale + cassa" sono diventate due campi separati (vedi il
     commento lungo qui sotto). La togliamo invece di lasciarla a fare
     confusione: era anche la ragione per cui il 2% spariva. */
  /* ============================================================
     12 agosto 2026 (sera) — LA CASSA: QUALE, E QUANTO

     Prima era UNA tendina sola che teneva insieme due cose diverse: la cassa
     («chi») e la percentuale («quanto»). Cinque combinazioni fisse, e basta.
     Da lì venivano due guai veri:
       - il preventivo offriva il 2%, la tendina della fattura non ce l'aveva,
         e passando in fattura quei soldi sparivano dal documento;
       - se la cassa non era scritta, il file per lo SDI tirava a indovinare e
         metteva TC22 (INPS) su una parcella di un geometra.
     Adesso sono due campi: la cassa la scegli dall'elenco ufficiale, la
     percentuale la scrivi tu — perché il contributo integrativo cambia da
     cassa a cassa e nel tempo, e non è una cosa che il gestionale può
     indovinare al posto tuo. Il primo valore proposto è quello dell'ULTIMA
     fattura che hai fatto: viene dai tuoi dati, non da un'ipotesi mia.

     L'elenco è quello delle specifiche della fattura elettronica (v1.2.2),
     codice per codice.
     ============================================================ */
  const FATT_CASSE_TIPI=[
    ["TC01","TC01 — Cassa forense (avvocati)"],
    ["TC02","TC02 — Cassa dottori commercialisti"],
    ["TC03","TC03 — Cassa Geometri"],
    ["TC04","TC04 — Inarcassa (ingegneri e architetti)"],
    ["TC05","TC05 — Cassa del notariato"],
    ["TC06","TC06 — Cassa ragionieri e periti commerciali"],
    ["TC07","TC07 — ENASARCO (agenti e rappresentanti)"],
    ["TC08","TC08 — ENPACL (consulenti del lavoro)"],
    ["TC09","TC09 — ENPAM (medici)"],
    ["TC10","TC10 — ENPAF (farmacisti)"],
    ["TC11","TC11 — ENPAV (veterinari)"],
    ["TC12","TC12 — ENPAIA (impiegati dell'agricoltura)"],
    ["TC13","TC13 — Fondo spedizionieri e agenzie marittime"],
    ["TC14","TC14 — INPGI (giornalisti)"],
    ["TC15","TC15 — ONAOSI (orfani sanitari)"],
    ["TC16","TC16 — CASAGIT (giornalisti)"],
    ["TC17","TC17 — EPPI (periti industriali)"],
    ["TC18","TC18 — EPAP (pluricategoriale)"],
    ["TC19","TC19 — ENPAB (biologi)"],
    ["TC20","TC20 — ENPAPI (infermieri)"],
    ["TC21","TC21 — ENPAP (psicologi)"],
    ["TC22","TC22 — INPS (gestione separata)"]
  ];
  /* l'ultima cassa e l'ultima percentuale che ha usato davvero: si leggono
     dalle sue fatture, così la prossima è già compilata e non deve ricordarsi
     niente. Se non ne ha ancora fatte, i campi restano vuoti. */
  function fattUltimaCassa(){
    const F=(typeof fattCache!=="undefined"&&fattCache)?fattCache:[];
    const conCassa=F.filter(x=>x&&(+x.cassa_perc||0)>0&&x.cassa_tipo)
      .sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
    if(conCassa.length)return {tipo:conCassa[0].cassa_tipo, perc:+conCassa[0].cassa_perc||0};
    return {tipo:"", perc:0};
  }
  /* 10% è l'aliquota della ristrutturazione: giusta per un'impresa edile,
     sbagliata per uno studio tecnico, che di norma fattura al 22%.
     Prima era 10 per tutti e un geometra emetteva fatture con l'IVA sbagliata
     senza accorgersene (9 agosto 2026). */
  const IVA_DEF_EDILE=10, IVA_DEF_STUDIO=22;
  const ivaDefault=()=>ruoloUtente==='professionista'?IVA_DEF_STUDIO:IVA_DEF_EDILE;
  const FATT_TIPI=[["fattura","Fattura"],["acconto","Fattura di acconto"],["nota_credito","Nota di credito"]];
  const FATT_STATO_LAB={bozza:"Bozza",emessa:"Emessa, da incassare",pagata:"Pagata",annullata:"Annullata"};
  const FATT_TIPO_LAB={fattura:"Fattura",acconto:"Acconto",nota_credito:"Nota di credito"};

  let fattCache=[], fattRighe={}, fattLavori={}, fattCliCache=[], fattLavLiberi=[];
  let fattAzienda=null, fatturaPdfCache={}, fattVista="tutte", fattRigheCount=0;

  /* in regime forfettario non si applica IVA: il gestionale toglie la colonna,
     mette la dicitura di legge sul PDF e propone il bollo da 2 euro */
  function fattForfettario(){ return (fattAzienda&&fattAzienda.regime_fiscale)==="RF19"; }

  /* i conti della fattura. Sono gli stessi della vista gest_fatture_totali su
     Supabase: qui li rifaccio in locale perché le righe le ho già lette per
     disegnare la scheda, e una lettura in meno è una lettura in meno. */
  /* l'aliquota che comanda: quella su cui sta più imponibile. Serve per
     applicare l'IVA anche alla cassa e alle spese, che non sono righe. */
  function fattAliquotaPrevalente(R){
    const per={};
    (R||[]).forEach(r=>{const a=+r.iva||0;per[a]=(per[a]||0)+(+r.qta||0)*(+r.prezzo||0);});
    const chiavi=Object.keys(per);
    if(!chiavi.length)return 0;
    return +chiavi.sort((a,b)=>per[b]-per[a])[0];
  }
  /* ===== 9 agosto 2026 — I CONTI DELLA FATTURA =====
     Adesso sono ESATTAMENTE quelli della parcella (vedi calcolaParcella):
       compenso  ->  + cassa (sul solo compenso)  ->  + spese
       ->  IVA su tutto  ->  - ritenuta (sul SOLO compenso)
     Prima mancava la cassa (un geometra non poteva fatturare il suo 5%) e la
     ritenuta veniva calcolata su tutto l'imponibile: se metteva in fattura
     bolli e diritti, gli trattenevano il 20% anche su quelli. */
  /* ============================================================
     12 agosto 2026 — LO SCONTO, E I CONTI IN UN POSTO SOLO

     Lo sconto toglieva i soldi dal TOTALE ma non dall'imponibile: l'IVA
     restava calcolata sul prezzo pieno. Su una fattura da 15.000 con 500 di
     sconto voleva dire tre cose, tutte sbagliate:
       - al cliente venivano addebitati 70 euro di IVA che non doveva pagare
       - il PDF diceva "imponibile 15.000" e il foglio Excel 14.500
       - nel file per lo SDI la somma dei riepiloghi (17.100) non tornava con
         il totale del documento (16.600): motivo di scarto

     Adesso lo sconto si toglie dall'IMPONIBILE, ripartito in proporzione fra
     le aliquote, e l'IVA si calcola su quello che il cliente paga davvero.
     Nel file per lo SDI le basi partono gia' scontate, quindi il totale del
     documento e' esattamente la somma dei riepiloghi (piu' il bollo, che si
     dichiara a parte): il conto non puo' piu' non tornare.

     Questa funzione e' l'UNICO posto dove si fa il conto. La usano la scheda,
     il PDF, il file per lo SDI, l'anteprima nel modulo, il Report e l'Excel.
     Se viene voglia di riscrivere la formula da qualche altra parte: e' cosi'
     che erano nati i tre numeri diversi di prima.
     ============================================================ */
  /* ===== 12 agosto 2026 (notte) — LO SCONTO ADESSO STA ANCHE SULLE RIGHE =====
     La mattina del 12 lo sconto era stato tolto dagli imponibili dei riepiloghi
     e, giustamente, era sparito il <ScontoMaggiorazione> di documento. Ma le
     RIGHE del file per lo SDI erano rimaste col prezzo pieno, e nel file non
     c'era piu' niente che spiegasse la differenza:

        <PrezzoTotale>10000.00</PrezzoTotale>            <- la riga
        <ImponibileImporto>9000.00</ImponibileImporto>   <- il riepilogo

     mille euro che non tornano e che nessun campo dichiara. Il commercialista
     apre la fattura e trova un buco.
     Adesso lo sconto si ripartisce riga per riga, in proporzione: ogni riga
     porta il suo <ScontoMaggiorazione> e il PrezzoTotale gia' scontato, e i
     riepiloghi sono la SOMMA di quelle righe, non un conto fatto a parte. Cosi'
     il file torna comunque lo si legga, e il totale del documento non cambia di
     un centesimo rispetto a prima.
     Le quote sono arrotondate al centesimo e l'ultima riga assorbe il resto: la
     somma delle quote fa esattamente lo sconto scritto nel modulo.
     Sul PDF che legge il cliente lo sconto resta dov'era, una riga sola sotto
     il totale: e' piu' chiaro da leggere e i numeri sono gli stessi. */
  function fattBasi(f,R,forf){
    if(forf===undefined)forf=fattForfettario();
    const c2=n=>Math.round((+n||0)*100)/100;
    /* arrotondamento al centesimo PER DIFETTO: serve dove un tetto non deve mai
       superare il valore vero (lo sconto di una riga).
       Quell'1e-9 non e' un vezzo: in virgola mobile 0,29 x 100 fa
       28,999999999999996, e Math.floor da solo restituirebbe 28 — cioe' 0,28.
       Succedeva sul 4,6% degli importi a due decimali, e su una fattura
       azzerata dallo sconto si portava via un centesimo: totale 0,01 € invece
       di zero. Un miliardesimo e' mille volte piu' piccolo di un millesimo di
       centesimo: non puo' far salire un tetto sopra il valore vero. */
    const _giu2=n=>Math.floor((+n||0)*100+1e-9)/100;
    const RR=R||[];
    let compenso=0;
    const linee=RR.map(function(r){
      const imp=(+r.qta||0)*(+r.prezzo||0);
      compenso+=imp;
      return {iva:forf?0:(+r.iva||0), pieno:imp, sconto:0, totale:imp};
    });
    /* la cassa si arrotonda SUBITO al centesimo, non alla fine: nel file per lo
       SDI <ImportoContributoCassa> e' scritto a due decimali, e se qui dentro
       ne portasse cinque il riepilogo non tornerebbe con la somma delle righe
       piu' la cassa dichiarata — un centesimo fuori su 234 fatture su 60.000 */
    const cassa=c2(compenso*(+f.cassa_perc||0)/100);
    /* ===== 13 agosto 2026 — LE DUE SPESE =====
       Fino a ieri c'era una casella sola, "Spese", e finiva nell'imponibile con
       l'IVA della fattura. Il commercialista: le spese anticipate in nome e per
       conto del cliente (bolli, diritti, visure, con la ricevuta intestata a
       lui e zero ricarico) sono ESCLUSE dalla base imponibile — art. 15, comma
       1, n. 3 del DPR 633/72 — e vanno in una riga a IVA 0 con natura N1.
       Su 150 € di spese sono 33 € di IVA in meno.
       Le trasferte, il carburante e i materiali non sono art. 15: quelli hanno
       la loro casella, prendono l'IVA normale ed entrano nella base della
       ritenuta.
         spese     = anticipate art. 15  (fuori IVA, fuori cassa, fuori ritenuta)
         speseIva  = rimborso spese vive (IVA normale, dentro la ritenuta)
       Sulla cassa del rimborso imponibile il commercialista ha confermato:
       il contributo integrativo si calcola SOLO sul compenso professionale, i
       rimborsi di spese vive restano fuori. Cosi' com'e' e' giusto.

       ⚠️ LE FATTURE GIA' EMESSE NON SI TOCCANO. Una fattura accettata dallo SDI
       non si puo' correggere a posteriori: se il gestionale le ricalcolasse,
       non tornerebbe piu' ne' col file mandato all'Agenzia ne' col bonifico del
       cliente. Percio' ogni fattura si porta dietro il regime con cui e' NATA
       (spese_regime), scritto una volta alla creazione e mai piu' toccato.
       Senza quel segno = fattura vecchia = conto di prima, identico. */
    const art15=(f.spese_regime==="art15");
    const spese=+f.spese||0;                     /* anticipate */
    const speseIva=art15?(+f.spese_iva||0):0;    /* rimborso imponibile (solo dal nuovo regime) */
    const aliqPrev=forf?0:fattAliquotaPrevalente(RR);
    const pieno=compenso+cassa+spese+speseIva;
    /* uno sconto piu' grande del lavoro non esiste: si ferma li', se no
       uscirebbero imponibili negativi e il file verrebbe scartato.
       Col regime nuovo lo sconto sta tutto sulle righe del lavoro (e' la
       scelta fatta il 12 agosto: non tocca la cassa), quindi si ferma al
       compenso; con quello vecchio si comporta come si e' sempre comportato. */
    const sconto=Math.min(Math.max(+f.sconto||0,0),art15?compenso:pieno);
    /* Lo sconto si toglie dalle RIGHE, che sono l'unico posto dove si puo'
       dichiarare. Se e' piu' grande di tutte le righe messe insieme (capita
       solo con una parcella fatta di sola cassa e spese) l'avanzo si toglie
       dalla parte cassa+spese, che riga non e'. */
    const scRighe=Math.min(sconto,compenso);
    linee.forEach(function(l){
      /* lo sconto di una riga non puo' essere negativo ne' piu' grande della
         riga: senza questi due paletti uscivano PrezzoTotale negativi (con le
         quantita' a decimali dei computi: 0,448 x 3,13) e righe scontate "al
         contrario", cioe' con il prezzo totale piu' alto di quantita x prezzo */
      /* il tetto e' il pieno arrotondato PER DIFETTO al centesimo: con c2 il
         tetto poteva stare mezzo centesimo SOPRA il valore della riga e il
         prezzo totale usciva a -0,01 (qta 16,95 x 1.699,90 = 28.813,305).
         Per difetto invece lo sconto scritto nel file non supera mai la riga,
         qualunque cosa faccia l'arrotondamento. */
      const q=(compenso>0)?c2(scRighe*l.pieno/compenso):0;
      l.sconto=Math.max(0,Math.min(q,_giu2(l.pieno)));
    });
    /* Il resto dell'arrotondamento si mette sulle righe piu' capienti, non
       sempre sull'ultima: sull'ultima, se era piccola, sfondava. Si gira finche'
       c'e' resto e finche' qualcuna ha ancora spazio. */
    let avanzo=c2(scRighe-linee.reduce((s,l)=>c2(s+l.sconto),0));
    if(avanzo){
      const ordine=linee.map((l,i)=>i).sort((a,b)=>linee[b].pieno-linee[a].pieno);
      for(const i of ordine){
        if(!avanzo)break;
        const l=linee[i];
        const nuovo=Math.max(0,Math.min(c2(l.sconto+avanzo),_giu2(l.pieno)));
        avanzo=c2(avanzo-(nuovo-l.sconto));
        l.sconto=nuovo;
      }
    }
    /* quello che non e' entrato nelle righe (sconto piu' grande di tutte le
       righe messe insieme, o righe tutte piene) si toglie dalla parte
       cassa+spese, che riga non e'. Non puo' essere negativo e non puo' essere
       piu' grande di cassa+spese: se no si toglieva da un secchio vuoto e
       usciva un IMPONIBILE NEGATIVO, cioe' una fattura che vale meno di zero. */
    const _dato=linee.reduce((s,l)=>c2(s+l.sconto),0);
    /* Col regime NUOVO scResto non deve esistere: lo sconto tocca solo le
       righe, punto. Se lo si lasciava vivo, i centesimi che il tetto per
       difetto non riesce a distribuire (succede con le quantita' a tre decimali
       dei computi) venivano tolti dal secchio del 22% mentre la riga delle
       spese, che sta nel secchio art. 15, veniva scritta al netto: due
       riepiloghi sbagliati in due direzioni opposte, su tre fatture su quattro.
       Adesso lo sconto DICHIARATO e' quello davvero distribuito sulle righe:
       non puo' valere piu' di quanto e' stato applicato.
       Sulle fatture VECCHIE si comporta come si e' sempre comportato.
       ⚠️ Sulle vecchie resta un caso che non si puo' chiudere: se lo sconto e'
       cosi' grosso da sfondare anche le spese, l'avanzo va a togliere dal
       riepilogo mentre la cassa continua a dichiarare il suo importo pieno nel
       suo blocco. Per sistemarlo bisognerebbe o ridurre un dato fiscale gia'
       dichiarato, o limitare lo sconto al compenso anche sulle vecchie — e
       quello cambierebbe i totali di fatture gia' mandate allo SDI, che e'
       proprio la cosa che non si fa. Riguarda solo fatture nate prima del
       13 agosto 2026 con uno sconto che azzera la parcella. */
    const scResto=art15?0:Math.min(Math.max(0,c2(sconto-_dato)),c2(cassa+spese));
    const scontoVero=art15?_dato:sconto;
    linee.forEach(function(l){ l.totale=c2(l.pieno-l.sconto); });

    /* I riepiloghi non si contano piu' per sola ALIQUOTA ma per aliquota +
       NATURA: da oggi la stessa fattura puo' avere due righe a zero che voglio
       dire cose diverse — le prestazioni di un forfettario (N2.2, "non
       soggetta") e le spese anticipate (N1, "escluse ex art. 15"). Metterle
       nello stesso mucchio sarebbe una dichiarazione falsa. */
    const natLinea=forf?"N2.2":"";
    const basi={};   /* "aliquota|natura" -> {al, nat, imp} */
    const _metti=function(al,nat,imp){
      const k=al+"|"+nat;
      if(!basi[k])basi[k]={al:+al,nat:nat,imp:0};
      basi[k].imp=c2(basi[k].imp+imp);
    };
    linee.forEach(function(l){ _metti(l.iva,natLinea,l.totale); });
    /* cassa e rimborso spese non sono righe ma fanno imponibile: vanno
       sull'aliquota che comanda, quella su cui sta piu' roba */
    if(cassa)   _metti(aliqPrev,natLinea,cassa);
    if(speseIva)_metti(aliqPrev,natLinea,speseIva);
    if(spese)   art15 ? _metti(0,"N1",spese) : _metti(aliqPrev,natLinea,spese);
    if(scResto) _metti(aliqPrev,natLinea,-scResto);

    const righe=Object.keys(basi).map(k=>basi[k])
      .sort((a,b)=>(b.al-a.al)||(a.nat<b.nat?-1:a.nat>b.nat?1:0))
      .map(function(b){
        const imponibile=Math.max(0,c2(b.imp));
        return {aliquota:b.al, natura:b.nat, imponibile:imponibile, imposta:c2(imponibile*b.al/100)};
      });
    /* i totali sono la somma dei riepiloghi GIA' ARROTONDATI: cosi' il totale
       del documento non puo' discostarsi nemmeno di un centesimo da quello che
       lo SDI ricalcola riga per riga */
    const imponibile=c2(righe.reduce((s,r)=>s+r.imponibile,0));
    const iva=c2(righe.reduce((s,r)=>s+r.imposta,0));
    /* il compenso che RESTA dopo lo sconto: e' la base della ritenuta (vedi
       fattConti). Si somma dalle righe gia' scontate, non si ricalcola a parte. */
    const compensoNetto=c2(linee.reduce((s,l)=>c2(s+l.totale),0));
    return {righe:righe,linee:linee,compenso:compenso,compensoNetto:compensoNetto,
            cassa:cassa,spese:spese,speseIva:speseIva,
            art15:art15,scResto:scResto,aliqPrev:aliqPrev,natLinea:natLinea,
            sconto:scontoVero,pieno:pieno,imponibile:imponibile,iva:iva};
  }
  /* ===== 12 agosto 2026 — LA NOTA DI CREDITO =====
     Una nota di credito e' un documento che TOGLIE soldi: annulla o riduce una
     fattura gia' emessa. Il gestionale la sapeva stampare (TD04 nel file per
     lo SDI) ma poi la SOMMAVA come se fosse un incasso in piu'.
     In pratica: fattura 10.000 + IVA e nota di credito 2.000 + IVA facevano
     dire "Da incassare 14.640 €" invece di 9.760 €. Quasi 4.900 euro di
     differenza con due soli documenti, sul numero che si guarda ogni giorno.

     Il documento in se' resta POSITIVO — sul PDF e nel file per lo SDI gli
     importi di una nota di credito si scrivono positivi, e' il tipo del
     documento a dire che vanno sottratti. Quindi il segno non si tocca nei
     conti del documento: si aggiunge a parte, e lo usano solo i totali.
     Regola semplice: se stai SOMMANDO piu' documenti, usa i valori "firmati".
     Se stai mostrando o stampando UN documento, usa quelli normali. */
  function fattSegno(f){ return (f&&f.tipo==="nota_credito")?-1:1; }
  /* righeDate: serve al Riepilogo, che le sue righe le ha gia' in mano e non
     puo' pescarle da fattRighe (quella cache si riempie solo aprendo la sezione
     Fatture). Prima il Riepilogo si riscriveva la formula del netto per conto
     suo — quarta copia — e in due giorni si e' scollata due volte. */
  function fattConti(f,righeDate){
    /* stesso ordine che usa il file per lo SDI: da quando ogni riga porta il
       suo sconto, "la riga numero 3" deve voler dire la stessa cosa nei due
       posti, se no prezzi e sconti finiscono su righe diverse */
    const R=(righeDate||fattRighe[f.id]||[]).slice().sort((a,b)=>(+a.ordine||0)-(+b.ordine||0));
    const b=fattBasi(f,R);
    const segno=fattSegno(f);
    /* ===== 13 agosto 2026 — LA BASE DELLA RITENUTA =====
       Il commercialista, sulla domanda dello sconto: «la ritenuta va calcolata
       sull'imponibile AL NETTO dello sconto. Applicarla sul lordo originario
       creerebbe un credito d'imposta fittizio per te e un versamento sbagliato
       da parte del cliente.»
       Qui c'era b.compenso, cioe' il lordo. Fino all'11 agosto tornava lo
       stesso, perche' lo sconto non riduceva l'imponibile; dalla mattina del 12
       l'imponibile ha cominciato a scendere e la base della ritenuta e' rimasta
       ferma. Su 10.000 con 2.000 di sconto il file dichiarava 2.000 di ritenuta
       invece di 1.600: 400 € di netto sbagliati, e nessuno dei controlli
       incrociati poteva accorgersene, perche' schermo, PDF, XML, Riepilogo e
       Excel leggevano tutti lo stesso numero sbagliato.
       Dentro ci va anche il rimborso delle spese vive (trasferte, carburante,
       materiali), che e' soggetto a ritenuta. Restano fuori la cassa e le
       spese anticipate art. 15: non sono compenso, sono soldi del cliente.
       ⚠️ Le fatture nate prima del 13 agosto tengono la base di allora: sono
       gia' state mandate allo SDI e il cliente ha gia' versato quella cifra
       all'Erario. Il segno e' lo stesso delle spese, spese_regime. */
    const baseRit=b.art15?((b.compensoNetto||0)+(b.speseIva||0)):b.compenso;
    const ritenuta=baseRit*(+f.ritenuta_perc||0)/100;
    /* Due numeri diversi, e mescolarli è un errore che lo SDI vede subito:
       - totale     = quanto vale il documento (imponibile scontato + IVA + bollo)
       - daPagare   = quanto ti bonifica davvero il cliente, tolta la ritenuta
       La ritenuta non è uno sconto: è una parte del tuo compenso che il
       cliente versa allo Stato al posto tuo. Il documento vale lo stesso. */
    const totale=b.imponibile+b.iva+(+f.bollo||0);
    const daPagare=totale-ritenuta;
    return {compenso:b.compenso,cassa:b.cassa,spese:b.spese,speseIva:b.speseIva,art15:b.art15,
            aliqPrev:b.aliqPrev,natLinea:b.natLinea,scResto:b.scResto,
            sconto:b.sconto,pieno:b.pieno,righeIva:b.righe,linee:b.linee,
            imponibile:b.imponibile,iva:b.iva,ritenuta:ritenuta,totale:totale,daPagare:daPagare,
            /* per i TOTALI: la nota di credito entra col meno */
            segno:segno, totaleFirmato:totale*segno, daPagareFirmato:daPagare*segno,
            imponibileFirmato:b.imponibile*segno};
  }
  /* ===== 9 agosto 2026 — l'imponibile di una fattura, in UN POSTO SOLO =====
     Report ed Excel lo ricalcolavano sommando solo qta*prezzo: senza la cassa
     previdenziale e senza le spese, quindi per uno studio con la cassa al 5%
     ogni numero usciva più basso del vero.
     12 agosto 2026: adesso chiama fattBasi, la stessa che usano scheda, PDF e
     file per lo SDI, quindi lo sconto e gli arrotondamenti sono identici
     ovunque. IVA esclusa: l'IVA non è tua. */
  function fattImponibile(f,righeDellaFattura){
    /* col segno: questa funzione la chiamano solo Riepilogo, Report ed Excel,
       che SOMMANO piu' fatture. Una nota di credito deve abbassare il totale,
       e nel foglio Excel deve comparire col meno, com'e' giusto che sia. */
    return fattBasi(f,righeDellaFattura||[]).imponibile*fattSegno(f);
  }
  function fattNumero(f){
    return fattNum(f);
  }
  function fattScadenza(f,gg){ return f.data?_giorniDopo(f.data,gg):""; }
  function fattScaduta(f,gg){
    if(f.stato!=="emessa")return false;
    const sc=fattScadenza(f,gg);
    return !!(sc&&sc<todayStr());
  }
  function fattGiorniDa(ds){
    if(!ds)return null;
    const g=_giorniA(ds);
    return g===null?null:-g;
  }

  /* ---- il riflesso sul lavoro ----
     Il lavoro deve sapere se è stato fatturato: lo usano la scheda del lavoro,
     il Report, il Riepilogo e l'esportazione. Invece di duplicare il dato a
     mano, lo riscrivo qui ogni volta che la fattura cambia stato. */
  async function fattSincronizzaLavori(fatturaId,stato){
    if(!sb||!sbUid||!fatturaId)return;
    const ids=(fattLavori[fatturaId]||[]);
    if(!ids.length)return;
    const nuovo = stato==="pagata" ? "pagata" : (stato==="emessa" ? "emessa" : "none");
    try{
      const {error}=await sb.from("gest_lavori").update({fatt_stato:nuovo}).in("id",ids).eq("user_id",sbUid).select("id");
      if(error)toast("Attenzione: i lavori collegati alla fattura non si sono aggiornati");
    }catch(e){ toast("Attenzione: i lavori collegati alla fattura non si sono aggiornati"); }
  }

  /* ---- il numero, assegnato una volta sola ----
     Una bozza non consuma nessun numero: il numero si prende quando dichiari
     la fattura emessa, ed è il piu' alto dell'anno piu' uno. Cosi' riparte da
     1 ogni gennaio.
     Il vincolo unique(user_id, anno, numero) sul database fa da rete: se due
     salvataggi partissero insieme, il secondo viene rifiutato invece di
     creare due fatture con lo stesso numero.

     12 agosto 2026 — qui c'era scritto "ed e' il primo libero di quell'anno,
     cosi' non lascia buchi". Non era vero: il codice prende il massimo piu'
     uno, quindi eliminando la n.3 la prossima diventa la 6 e la 3 resta un
     buco. Ma la cosa importante e' un'altra: riempire quel buco sarebbe
     SBAGLIATO. Un numero gia' usato e' bruciato, e ridarlo a una fattura piu'
     recente vorrebbe dire avere la n.3 con una data successiva alla n.4 —
     un'irregolarita' che il commercialista vede subito. Il comportamento
     giusto e' quello che il codice fa gia': andare avanti e basta.
     Quello che mancava era dirlo: adesso i buchi si VEDONO (vedi il riquadro
     "Fatture emesse" in cima alla sezione).

     12 agosto 2026 — il numero non si scrive piu' qui. Prima si faceva una
     scrittura per il numero e una seconda per lo stato: se la seconda falliva
     (rete che cade) la fattura restava BOZZA con il numero gia' consumato, e
     quel numero non lo usava piu' nessuno. Adesso questa funzione lo calcola
     e basta; a scriverlo e' chi cambia lo stato, in una volta sola. */
  async function fattProssimoNumero(f){
    if(f.numero)return f.numero;
    const anno=(f.data||todayStr()).slice(0,4);
    /* sb.raw: si guardano ANCHE le fatture nel cestino. Se no, eliminata la
       n.7 la fattura dopo riprendeva il 7 e sbatteva contro il numero già
       occupato da quella nel cestino: non si emetteva più niente per tutto l'anno. */
    const _sbF=(sb.raw||sb.from.bind(sb));
    const {data,error}=await _sbF("gest_fatture").select("numero")
      .eq("user_id",sbUid).eq("anno",+anno).not("numero","is",null)
      .order("numero",{ascending:false}).limit(1);
    /* se la lettura fallisce NON si tira a indovinare: dare per buono "0+1"
       vorrebbe dire assegnare il numero 1 a una fattura di dicembre */
    if(error){toast("Numero non assegnato: "+error.message);return null;}
    return ((data&&data[0]&&+data[0].numero)||0)+1;
  }

  /* ---------- la scheda della fattura ---------- */
  function fattCard(f,gg){
    const c=fattConti(f);
    const scaduta=fattScaduta(f,gg);
    const gio=f.stato==="emessa"?fattGiorniDa(f.data):null;
    const pdf=fatturaPdfCache[f.id];
    const nLav=(fattLavori[f.id]||[]).length;
    const tono = f.stato==="pagata" ? "t-ok"
               : scaduta            ? "t-err"
               : f.stato==="emessa" ? "t-attesa"
               : f.stato==="annullata" ? "t-neutro" : "t-info";
    const statoLab = scaduta ? "Scaduta, non pagata" : (FATT_STATO_LAB[f.stato]||f.stato);
    const cli=fattCliCache.find(x=>String(x.id)===String(f.cliente_id));
    const nome=f.cli_nome||(cli&&cli.nome)||"—";

    const meta=[
      "🧾 "+esc(fattNumero(f)),
      "📅 "+fdate(f.data),
      "👤 "+esc(nome),
      /* 9 agosto 2026 — questa riga vive dentro .fatt-info, che il traduttore
         salta apposta: la parola giusta va scelta qui. */
      nLav?("🛠 "+nLav+(ruoloUtente==='professionista'?(nLav===1?" pratica":" pratiche"):(nLav===1?" lavoro":" lavori"))):"",
      f.stato==="emessa"&&gio!=null
        ? '<span'+(scaduta?' style="color:var(--err);font-weight:700"':'')+'>⏳ aspetti da '+gio+(gio===1?" giorno":" giorni")+'</span>'
        : "",
      f.tipo!=="fattura" ? "📄 "+FATT_TIPO_LAB[f.tipo] : "",
      pdf?"":'<span style="color:var(--testo-3)">nessun PDF allegato</span>'
    ];

    const az=[];
    if(f.stato==="bozza")   az.push({lab:"📤 Emetti",       action:"fatt-stato",data:{id:f.id,v:"emessa"}});
    if(f.stato==="emessa")  az.push({lab:"💶 Segna pagata", action:"fatt-stato",data:{id:f.id,v:"pagata"}});
    if(f.stato==="pagata")  az.push({lab:"↩ Non pagata",    action:"fatt-stato",data:{id:f.id,v:"emessa"}});
    az.push({lab:"✏ Apri",     action:"edit-fatt",data:{id:f.id}});
    /* due PDF diversi, e i nomi di prima si scambiavano facilmente:
       uno lo CREA il gestionale, l'altro lo ALLEGHI tu se ce l'hai. */
    az.push({lab:"⬇ Crea il PDF",action:"fatt-pdf",data:{id:f.id}});
    /* l'XML solo sulle emesse: una bozza non ha il numero, e senza numero
       lo SDI non la accetta */
    if(f.numero) az.push({lab:"⬇ File per lo SDI (XML)",action:"fatt-xml",data:{id:f.id}});
    if(pdf) az.push({lab:"📄 Apri il PDF allegato",action:"open-fattura", data:{id:pdf.id}});
    else    az.push({lab:"📎 Allega un PDF tuo",   action:"upload-fattura",data:{id:f.id}});
    az.push({lab:"🗑 Elimina",action:"del-fatt",data:{id:f.id},del:true});

    return schedaJob({
      tono,
      titolo:esc(f.cli_nome||(cli&&cli.nome)||"Fattura")+" — "+esc(statoLab),
      /* col meno davanti: una nota di credito che mostra "2.000 €" come una
         fattura normale e' il modo piu' facile per sbagliare i conti a occhio */
      destra:'<span class="job-imp">'+(c.segno<0?"−":"")+eur(c.daPagare)+'</span>',
      meta,
      nota:f.note?"📝 "+esc(f.note):"",
      azioni:az
    });
  }

  /* ---------- la sezione ---------- */
  async function renderFatture(){
   filoMetti("fatture","fatture");
   try{
    const body=$("#fatt-body"), viste=$("#fatt-viste"), sum=$("#fatt-summary");
    if(!body)return;
    if(!sb||!sbUid||!cur){
      if(sum)sum.innerHTML="";if(viste)viste.innerHTML="";
      body.className="";body.style.display="block";
      body.innerHTML=tabVuoto("Le fatture","Accedi per gestire le fatture di questo reparto.");
      return;
    }
    const mid=curMestiere();

    const [{data:ff},{data:cls},{data:az},{data:lav}]=await Promise.all([
      sb.from("gest_fatture").select("*").eq("user_id",sbUid).eq("mestiere_id",mid),
      sb.from("gest_clienti").select("*").eq("user_id",sbUid).eq("mestiere_id",mid).order("nome"),
      sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      sb.from("gest_lavori").select("id,descrizione,dove,stato,importo,data_fatto,data_prevista,cliente_id")
        .eq("user_id",sbUid).eq("mestiere_id",mid).eq("stato","fatto")
    ]);
    fattCache=ff||[]; fattCliCache=cls||[]; fattAzienda=az||null;
    fattRighe={}; fattLavori={}; fatturaPdfCache={};

    const ids=fattCache.map(f=>f.id);
    if(ids.length){
      const [{data:rr},{data:fl},{data:pdfs}]=await Promise.all([
        sb.from("gest_fattura_righe").select("*").eq("user_id",sbUid).in("fattura_id",ids).order("ordine"),
        sb.from("gest_fattura_lavori").select("fattura_id,lavoro_id").eq("user_id",sbUid).in("fattura_id",ids),
        sb.from("gest_foto").select("id,fattura_id,storage_path,created_at").eq("user_id",sbUid).eq("tipo","fattura").in("fattura_id",ids)
      ]);
      (rr||[]).forEach(r=>{(fattRighe[r.fattura_id]=fattRighe[r.fattura_id]||[]).push(r);});
      (fl||[]).forEach(x=>{(fattLavori[x.fattura_id]=fattLavori[x.fattura_id]||[]).push(x.lavoro_id);});
      /* il registro per il menu dei Lavori: chi è già dentro una fattura */
      _lavFatturati=new Set((fl||[]).map(x=>String(x.lavoro_id)));
      (pdfs||[]).forEach(p=>{if(p.fattura_id&&!fatturaPdfCache[p.fattura_id])fatturaPdfCache[p.fattura_id]=p;});
    }

    /* i lavori finiti che non stanno ancora dentro nessuna fattura:
       sono il "da fatturare" e la sorgente del selettore */
    const dentro=new Set();
    Object.values(fattLavori).forEach(a=>a.forEach(x=>dentro.add(String(x))));
    fattLavLiberi=(lav||[]).filter(l=>+l.importo>0 && !dentro.has(String(l.id)));

    const gg=(fattAzienda&&+fattAzienda.giorni_pagamento)||30;
    const anno=todayStr().slice(0,4);
    const conti={};fattCache.forEach(f=>{conti[f.id]=fattConti(f);});

    const emesse = fattCache.filter(f=>f.stato==="emessa");
    const pagate = fattCache.filter(f=>f.stato==="pagata");
    /* una nota di credito non e' un credito: non puo' essere "scaduta" e non
       puo' essere "il credito piu' vecchio" */
    const scadute= emesse.filter(f=>fattSegno(f)>0&&fattScaduta(f,gg));

    /* le note di credito entrano col meno: se no "da incassare" cresce proprio
       quando hai appena restituito dei soldi */
    const tInc  = emesse.reduce((s,f)=>s+conti[f.id].daPagareFirmato,0);
    const tFatt = fattLavLiberi.reduce((s,l)=>s+(+l.importo||0),0);
    const incAnno = pagate.filter(f=>String(f.data_pagata||f.data||"").slice(0,4)===anno)
                          .reduce((s,f)=>s+conti[f.id].daPagareFirmato,0);
    const attese = emesse.filter(f=>fattSegno(f)>0).map(f=>fattGiorniDa(f.data)).filter(x=>x!=null);
    const piuVecchio = attese.length?Math.max.apply(null,attese):null;
    const emesseAnno = fattCache.filter(f=>f.numero&&String(f.anno)===anno).length;
    /* ===== 12 agosto 2026 — I BUCHI NELLA NUMERAZIONE SI DEVONO VEDERE =====
       Elimini la n.3 e la prossima prende la 6: la 3 resta un buco per sempre,
       e finora non lo diceva nessuno. Riempirlo sarebbe sbagliato (un numero
       gia' usato e' bruciato, e ridarlo a una fattura piu' recente vuol dire
       la n.3 con la data dopo la n.4), quindi la cosa giusta e' mostrarlo:
       cosi' te ne accorgi tu, non il commercialista a marzo.
       Si legge sull'ANNO INTERO dell'utente, non sul reparto: la serie dei
       numeri e' una sola per partita IVA, e con due reparti guardare solo il
       reparto farebbe vedere buchi che non esistono. */
    let buchiTesto="numerate nel corso dell'anno", buchiTono="neutro";
    try{
      const _raw=(sb.raw||sb.from.bind(sb));
      const [{data:vivi},{data:tutti}]=await Promise.all([
        sb.from("gest_fatture").select("numero").eq("user_id",sbUid).eq("anno",+anno).not("numero","is",null),
        _raw("gest_fatture").select("numero").eq("user_id",sbUid).eq("anno",+anno).not("numero","is",null)
      ]);
      const setVivi=new Set((vivi||[]).map(x=>+x.numero));
      const setTutti=new Set((tutti||[]).map(x=>+x.numero));
      const massimo=setTutti.size?Math.max.apply(null,Array.from(setTutti)):0;
      const buchi=[];
      for(let n=1;n<=massimo;n++) if(!setVivi.has(n)) buchi.push({n:n, cestino:setTutti.has(n)});
      if(buchi.length){
        const nCest=buchi.filter(b=>b.cestino).length;
        const elenco=buchi.slice(0,6).map(b=>"n."+b.n).join(", ")+(buchi.length>6?"…":"");
        buchiTesto=(buchi.length===1?"manca la ":"mancano le ")+elenco
          +(nCest?(nCest===buchi.length?" — "+(nCest===1?"è nel Cestino":"sono nel Cestino"):" — qualcuna è nel Cestino"):"");
        buchiTono="err";
      }
    }catch(e){}

    const box=(n,l,sub,tono,azione)=>'<div class="fatt-tot'+(tono?" t-"+tono:"")
      +(azione?'" '+azione+' style="cursor:pointer':'')+'"><div class="n">'+n+'</div>'
      +'<div class="l">'+l+'</div>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>';
    if(sum)sum.innerHTML=
        box(eur(tInc),"Da incassare",emesse.length+(emesse.length===1?" fattura emessa":" fatture emesse"),scadute.length?"err":"attesa")
      + box(eur(tFatt),"Da fatturare",
            fattLavLiberi.length?(fattLavLiberi.length+(fattLavLiberi.length===1?" lavoro finito · clicca per fatturarlo":" lavori finiti · clicca per fatturarli")):"niente in attesa",
            "info", fattLavLiberi.length?'data-action="fatt-da-lavori"':"")
      /* 13 agosto 2026 — questo riquadro e quello del Report si chiamavano
         tutti e due «Incassato 2026» e davano due numeri diversi: su una
         fattura da 10.000 € al 22%, 12.200 € qui e 10.000 € là. Nessuno dei
         due sbagliato — qui sono i soldi entrati davvero (IVA compresa,
         ritenuta tolta), là è l'imponibile su cui si fa l'utile. Adesso si
         chiamano con parole diverse, così non si confondono più. */
      + box(eur(incAnno),"Entrato in cassa "+anno,"IVA compresa, ritenuta tolta","ok")
      + box(piuVecchio==null?"—":(piuVecchio+" gg"),"Il credito più vecchio",
            piuVecchio==null?"nessuna fattura in attesa":"dalla data della fattura",
            (piuVecchio!=null&&piuVecchio>gg)?"err":"neutro")
      + box(String(emesseAnno),"Fatture emesse "+anno,buchiTesto,buchiTono);

    const filtra=(A,v)=>
        v==="bozze"    ? A.filter(f=>f.stato==="bozza")
      : v==="incassare"? A.filter(f=>f.stato==="emessa")
      : v==="scadute"  ? A.filter(f=>fattSegno(f)>0&&fattScaduta(f,gg))
      : v==="pagate"   ? A.filter(f=>f.stato==="pagata")
      : A.slice();
    const conta={};FATT_VISTE.forEach(v=>conta[v.k]=filtra(fattCache,v.k).length);
    if(viste)viste.innerHTML=FATT_VISTE.map(v=>{
      const n=conta[v.k]||0;
      return '<button class="vista'+(fattVista===v.k?" on":"")+'" data-action="fatt-vista" data-v="'+v.k+'">'
        +v.lab+(n?'<span class="v-cnt'+(v.err?" err":"")+'">'+n+'</span>':'')+'</button>';
    }).join("");

    let R=filtra(fattCache,fattVista);
    /* prima quelle che chiedono qualcosa: scadute, poi emesse, poi bozze,
       poi le pagate. A parita', la più recente in cima. */
    const rank=f=>fattScaduta(f,gg)?0:(f.stato==="emessa"?1:(f.stato==="bozza"?2:(f.stato==="pagata"?3:4)));
    R.sort((a,b)=>rank(a)-rank(b)
      || String(b.data||"").localeCompare(String(a.data||""))
      || (+b.numero||0)-(+a.numero||0));

    if(!R.length){
      body.className="";body.style.display="block";
      const filtrando=fattCache.length>0;
      body.innerHTML=tabVuoto(
        filtrando?"Nessuna fattura con questo filtro":"Ancora nessuna fattura",
        filtrando?"Prova a cambiare vista qui sopra."
                 :"Righe con quantità, prezzo e IVA, il numero progressivo che riparte ogni anno, e il PDF pronto da mandare. Una fattura può raccogliere più lavori dello stesso cliente: uno solo, oppure tutti quelli del mese.",
        _SVGV+'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6"/><path d="M16 12h-6"/></svg>',
        filtrando?null:{t:"+ Crea la prima fattura",a:"new-fattura"});
      return;
    }
    body.className="griglia-schede";body.style.display="grid";
    body.innerHTML=R.map(f=>fattCard(f,gg)).join("");
   }catch(err){
    const m=(err&&(err.message||err.toString()))||"errore sconosciuto";
    const b=$("#fatt-body");
    if(b){b.className="";b.style.display="block";
      b.innerHTML='<div class="mp-avviso"><b>Le fatture non si sono caricate.</b><br>'+esc(m)
        +'<br><br>Se dice che una tabella non esiste, manca il blocco SQL delle fatture su Supabase.</div>';}
    try{console.error("[FATTURE]",err);}catch(e){}
   }
  }

  /* ---------- il modulo ---------- */
  /* ============================================================
     L'ANNO CHE MANCAVA — 18 agosto 2026

     Su una fattura senza la colonna `anno` (le bozze vecchie, nate prima
     che quella colonna esistesse) usciva «Fattura n. 12/undefined» —
     addosso al documento, nel titolo della finestra, nel messaggio di
     conferma e nella causale del PDF. Cinque posti, tutti con lo stesso
     `f.numero+"/"+f.anno`.

     L'anno pero' c'e' sempre: sta dentro la DATA. Quindi si legge da li'
     quando la colonna e' vuota, e «undefined» non si vede piu' da
     nessuna parte.
     ⚠️ Non si tira a indovinare con l'anno di oggi: una fattura del 2025
        riaperta nel 2026 diventerebbe «12/2026», cioe' un numero che non
        e' mai esistito. Se non c'e' ne' anno ne' data, si scrive «—».
     ============================================================ */
  function fattAnno(f){
    f=f||{};
    if(f.anno) return String(f.anno);
    const d=String(f.data||"");
    return /^\d{4}/.test(d) ? d.slice(0,4) : "—";
  }
  /* «n. 12/2026», oppure «bozza senza numero» */
  function fattNum(f){
    f=f||{};
    return f.numero ? ("n. "+f.numero+"/"+fattAnno(f)) : "bozza senza numero";
  }

  function fattRigaHtml(r){
    r=r||{};fattRigheCount++;
    const iva=r.iva!=null?+r.iva:ivaDefault();
    const opts=IVA_SCELTE.map(v=>'<option value="'+v+'"'+(+iva===v?" selected":"")+'>'+v+'%</option>').join("");
    return '<div class="fatt-riga" data-riga>'
      + '<input class="fr-desc" placeholder="Descrizione voce" value="'+esc(r.descrizione||"")+'">'
      + '<input class="fr-qta" type="text" inputmode="decimal" placeholder="Q.tà" value="'+_numTesto(r.qta!=null?r.qta:1)+'">'
      + '<input class="fr-prezzo" type="text" inputmode="decimal" placeholder="Prezzo €" value="'+_prezzoCasella(r.prezzo)+'">'
      + '<select class="fr-iva"'+(fattForfettario()?' style="display:none"':'')+'>'+opts+'</select>'
      + '<button type="button" class="rdel" data-action="fatt-riga-del">×</button></div>';
  }
  /* il regime delle spese del modulo aperto adesso — vedi fattForm */
  let fattRegimeCorrente="art15";
  /* i totali si rifanno a ogni tasto premuto: si vede il conto crescere
     mentre scrivi, invece di scoprirlo dopo aver salvato */
  function fattTotaleLive(){
    /* Array.from: $$ restituisce una NodeList, che non ha .map */
    const R=Array.from($$("#fatt-righe [data-riga]")).map(d=>({
      qta:_numRiga(d,".fr-qta",0),
      prezzo:_numRiga(d,".fr-prezzo",0),
      iva:+(d.querySelector(".fr-iva")||{}).value||0}));
    const f={
      cassa_perc:_numIt("#fa-cassa")||0,
      spese:_numIt("#fa-spese")||0,
      spese_iva:_numIt("#fa-spese-iva")||0,
      /* il regime e' quello della fattura che si sta scrivendo: "art15" se e'
         nuova, quello con cui e' nata se si sta correggendo una vecchia. Se
         qui mettessi sempre il nuovo, riaprendo una fattura del mese scorso il
         riquadro direbbe un numero e il salvataggio ne scriverebbe un altro. */
      spese_regime:fattRegimeCorrente,
      sconto:_numIt("#fa-sconto")||0,
      bollo:_numIt("#fa-bollo")||0,
      ritenuta_perc:_numIt("#fa-rit")||0
    };
    /* 12 agosto 2026 — gli STESSI conti della scheda, del PDF e del file per
       lo SDI. Prima la formula era riscritta qui a mano, e in forfettario
       l'anteprima sommava un'IVA che il salvataggio poi azzerava: leggevi
       1.832 e salvavi 1.502. */
    const b=fattBasi(f,R);
    const forf=fattForfettario();
    /* stessa base di fattConti: sul netto dopo lo sconto se la fattura e' nuova,
       sul lordo se e' nata prima del 13 agosto */
    const ritE=(b.art15?((b.compensoNetto||0)+(b.speseIva||0)):b.compenso)*f.ritenuta_perc/100;
    const tot=b.imponibile+b.iva+f.bollo;        /* quanto vale il documento */
    const netto=tot-ritE;                        /* quanto ti bonificano davvero */
    const el=$("#fatt-somma");
    if(el)el.innerHTML=
        '<div class="fs-r"><span>'+(ruoloUtente==='professionista'?'Compenso':'Imponibile')+'</span><b>'+eur2(b.compenso)+'</b></div>'
      + (b.cassa ?'<div class="fs-r"><span>Cassa '+f.cassa_perc+'%</span><b>'+eur2(b.cassa)+'</b></div>':"")
      + (b.speseIva?'<div class="fs-r"><span>Rimborso spese</span><b>'+eur2(b.speseIva)+'</b></div>':"")
      + (b.spese ?'<div class="fs-r"><span>Spese anticipate'+(b.art15?' (fuori IVA)':'')+'</span><b>'+eur2(b.spese)+'</b></div>':"")
      + (b.sconto?'<div class="fs-r"><span>Sconto</span><b>−'+eur2(b.sconto)+'</b></div>':"")
      /* "Imponibile IVA" non si puo' piu' dire, da quando dentro ci sono anche
         le spese art. 15 che l'IVA non ce l'hanno: su 5.550 di imponibile
         l'IVA e' 1.188 e non 1.221, e chi fa il conto a mente non torna. */
      + ((b.cassa||b.spese||b.speseIva||b.sconto)?'<div class="fs-r"><span>'+((b.spese&&b.art15)?'Totale imponibile':'Imponibile IVA')+'</span><b>'+eur2(b.imponibile)+'</b></div>':"")
      + (forf?"":'<div class="fs-r"><span>IVA</span><b>'+eur2(b.iva)+'</b></div>')
      + (f.bollo?'<div class="fs-r"><span>Bollo</span><b>'+eur2(f.bollo)+'</b></div>':"")
      + (ritE   ?'<div class="fs-r"><span>Ritenuta '+_pct(f.ritenuta_perc)+'%</span><b>−'+eur2(ritE)+'</b></div>':"")
      + '<div class="fs-r fs-tot"><span>'+(ritE?"Totale fattura":"Totale")+'</span><b>'+eur2(tot)+'</b></div>'
      + (ritE?'<div class="fs-r fs-tot"><span>Netto a pagare</span><b>'+eur2(netto)+'</b></div>':"");
    return tot;
  }

  async function fattForm(f,preset){
    const isNew=!f;
    f=f||preset||{};
    /* con che regime delle spese lavora questo modulo: nuovo se la fattura sta
       nascendo adesso, quello con cui e' nata se la stiamo correggendo.
       Serve all'anteprima "Il conto", che se no direbbe un numero diverso da
       quello che finisce nel database. */
    fattRegimeCorrente=isNew?"art15":(f.spese_regime||null);
    let righe=[];
    if(sb&&sbUid){
      if(!fattCliCache.length){
        const {data}=await sb.from("gest_clienti").select("*").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("nome");
        fattCliCache=data||[];
      }
      if(!fattAzienda){
        const {data}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
        fattAzienda=data||null;
      }
      if(f.id){
        /* ===== 12 agosto 2026 (sera) — LA RETE DI SICUREZZA =====
           L'errore di questa lettura non lo guardava nessuno. Se il database non
           rispondeva (rete che cade, sessione scaduta, un secondo di Supabase
           giu') il modulo si apriva SENZA RIGHE, come una fattura vuota. E il
           Salva, che prima cancella tutte le righe e poi riscrive quelle del
           modulo, le cancellava per davvero: fattura svuotata, e a schermo
           "Salvato". Adesso, se non riesco a leggerle, il modulo non si apre. */
        const {data:rr,error:erR}=await sb.from("gest_fattura_righe").select("*").eq("fattura_id",f.id).order("ordine");
        if(erR){
          toast("Non riesco a leggere le righe della fattura: "+(erR.message||"il database non risponde")
                +". Non apro il modulo, se no rischi di svuotarla. Riprova fra un attimo.");
          return;
        }
        righe=rr||[];
      }
    }
    if(!righe.length&&preset&&preset._righe)righe=preset._righe;

    const bloccata=f.stato==="emessa"||f.stato==="pagata";
    const cliOpts=fattCliCache.map(c=>'<option value="'+c.id+'"'+(String(c.id)===String(f.cliente_id)?" selected":"")+'>'+esc(c.nome)+'</option>').join("");
    const tipoOpts=FATT_TIPI.map(t=>'<option value="'+t[0]+'"'+((f.tipo||"fattura")===t[0]?" selected":"")+'>'+t[1]+'</option>').join("");
    const nLav=(preset&&preset._lavori?preset._lavori.length:(fattLavori[f.id]||[]).length);

    const titolo = isNew ? "Nuova fattura"
                 : (f.numero ? "Fattura n. "+f.numero+"/"+fattAnno(f) : "Bozza di fattura");

    openSheetGrande(titolo,
      /* colonna di sinistra più larga: le voci hanno bisogno di spazio per la
         descrizione, che è la cosa che il cliente legge davvero */
      '<div class="sh-cols sh-cols--fatt"><div class="sh-col">'

      + '<div class="sh-b"><div class="sh-tit">A chi e quando</div>'
      +   '<div class="field"><label>Cliente</label><select id="fa-cli"><option value="">— nessuno —</option>'+cliOpts+'</select>'
      +     (fattCliCache.length?'':'<div class="campo-aiuto" style="color:var(--attesa)">In questo reparto non hai ancora nessun cliente in anagrafica, quindi la tendina è vuota. Puoi scrivere le voci lo stesso e salvare la bozza: il cliente lo aggiungi in <b>Clienti</b> e poi lo scegli qui. Per <b>emettere</b> la fattura il cliente serve.</div>')
      +   '</div>'
      +   '<div class="row2">'
      +     '<div class="field"><label>Data</label><input type="date" id="fa-data" value="'+(f.data||todayStr())+'"></div>'
      +     '<div class="field"><label>Tipo</label><select id="fa-tipo">'+tipoOpts+'</select></div>'
      +   '</div>'
      +   (nLav?'<div class="sh-nota">Questa fattura raccoglie <b>'+nLav+(nLav===1?" lavoro":" lavori")+'</b>. I lavori collegati si segnano da soli come fatturati quando la emetti.</div>':'')
      +   (bloccata?'<div class="sh-nota" style="color:var(--attesa)">⚠ Questa fattura è già stata emessa. Se la cambi, cambia un documento che il cliente ha già ricevuto: fallo solo se sai cosa stai facendo.</div>':'')
      + '</div>'

      + '<div class="sh-b"><div class="sh-tit">Voci della fattura</div>'
      +   '<div id="fatt-righe">'+((righe.length?righe:[{}]).map(r=>fattRigaHtml(r)).join(""))+'</div>'
      +   '<button type="button" class="btn-ghost quick-add" data-action="fatt-riga-add">+ Aggiungi voce</button>'
      +   (fattForfettario()?'<div class="sh-nota">Sei in regime forfettario: la colonna IVA è nascosta e le voci vanno senza IVA.</div>'
                            :(ruoloUtente==='professionista'
                              ?'<div class="sh-nota">Le prestazioni professionali vanno al 22%. Le aliquote ridotte (10%, 4%) valgono per chi esegue i lavori, non per la parcella.</div>'
                              :'<div class="sh-nota">L\'aliquota si sceglie riga per riga. In edilizia il 10% è quello della manutenzione e ristrutturazione, il 4% della prima casa.</div>'))
      + '</div>'

      + '</div><div class="sh-col">'

      + '<div class="sh-b"><div class="sh-tit">Il conto</div>'
      +   '<div class="fatt-somma" id="fatt-somma"></div>'
      + '</div>'

      + '<div class="sh-b"><div class="sh-tit">In fondo alla fattura</div>'
      +   '<div class="row2">'
      +     '<div class="field"><label>Sconto (€)</label><input type="text" inputmode="decimal" id="fa-sconto" value="'+_numTesto(+f.sconto||"")+'" placeholder="0"></div>'
      +     '<div class="field"><label>Bollo (€)</label><input type="text" inputmode="decimal" id="fa-bollo" value="'+_numTesto(+f.bollo||"")+'" placeholder="0"></div>'
      +   '</div>'
      /* ===== 9 agosto 2026 — la cassa previdenziale =====
         C'era nel preventivo e mancava in fattura: un geometra non poteva
         riportare il suo 5%. Il codice TipoCassa è quello che vuole lo SDI
         nel file elettronico, per sapere DI QUALE cassa si tratta.
         12 agosto 2026 (sera): DUE campi invece di una tendina sola. Vedi il
         commento lungo su FATT_CASSE_TIPI. */
      +   (ruoloUtente==='professionista'
            ? (function(){
                const _u=fattUltimaCassa();
                /* fattura nuova: si parte da quello che ha usato l'ultima volta.
                   Fattura già scritta: si mostra quello che c'e' dentro. */
                const _tip=(f&&f.id)?(f.cassa_tipo||""):((f&&f.cassa_tipo)||_u.tipo||"");
                const _prc=(f&&f.id)?(+f.cassa_perc||0):((+((f||{}).cassa_perc)||0)||_u.perc||0);
                return '<div class="row2">'
                + '<div class="field"><label>Quale cassa previdenziale</label><select id="fa-cassa-tipo">'
                +   '<option value="">— nessuna cassa —</option>'
                +   FATT_CASSE_TIPI.map(function(o){
                        return '<option value="'+o[0]+'"'+(_tip===o[0]?' selected':'')+'>'+esc(o[1])+'</option>';
                      }).join("")
                + '</select></div>'
                + '<div class="field"><label>Contributo cassa (%)</label><input type="text" inputmode="decimal" id="fa-cassa"'+_noAuto()+' value="'+_numTesto(_prc||"")+'" placeholder="Es. 4"></div>'
                + '</div>'
                /* ⚠️ Su una fattura nata PRIMA del 13 agosto le spese seguono
                   ancora il conto di allora (dentro l'imponibile, con l'IVA).
                   Farle vedere con l'etichetta nuova sarebbe una bugia sullo
                   schermo, e la casella del rimborso scriverebbe un numero che
                   nessuno legge: qui il modulo si adatta alla fattura. */
                + (fattRegimeCorrente==="art15"
                    ? '<div class="field"><label>Spese anticipate (bolli, diritti, visure)</label><input type="text" inputmode="decimal" id="fa-spese" value="'+_numTesto(+f.spese||"")+'" placeholder="0"></div>'
                    + '<div class="field"><label>Rimborso spese (trasferte, materiali)</label><input type="text" inputmode="decimal" id="fa-spese-iva" value="'+_numTesto(+f.spese_iva||"")+'" placeholder="0"></div>'
                    + '<div class="sh-nota">Le <b>spese anticipate</b> sono quelle che hai pagato tu per il cliente con la ricevuta intestata a lui e senza guadagnarci niente: bolli, diritti, visure. Sono escluse dall\'IVA (art. 15) e non entrano né nella cassa né nella ritenuta.<br><br>Il <b>rimborso spese</b> è per trasferte, carburante e materiali: quello l\'IVA ce l\'ha, ed entra nella ritenuta.<br><br>La cassa si calcola sul compenso. La percentuale la scrivi tu: cambia da cassa a cassa, e il gestionale non la indovina al posto tuo.</div>'
                    : '<div class="field"><label>Spese documentate</label><input type="text" inputmode="decimal" id="fa-spese" value="'+_numTesto(+f.spese||"")+'" placeholder="0"></div>'
                    + '<div class="sh-nota"><b>Questa fattura è nata prima del 13 agosto 2026</b>, quindi le spese seguono ancora il conto di allora: entrano nell\'imponibile e prendono l\'IVA. Non la cambio, perché è già stata mandata allo SDI così e deve restare uguale a quella che ha in mano il cliente.<br><br>Dalla prossima fattura nuova troverai due caselle separate: spese anticipate (escluse IVA, art. 15) e rimborso spese.<br><br>La cassa si calcola sul compenso. La percentuale la scrivi tu.</div>');
              })()
            : '')
      +   '<div class="field"><label>Ritenuta d\'acconto (%)</label><input type="text" inputmode="decimal" id="fa-rit" value="'+_numTesto(+f.ritenuta_perc||"")+'" placeholder="0" style="max-width:160px"></div>'
      +   (fattForfettario()?'<div class="sh-nota">In forfettario serve il <b>bollo da 2 €</b> quando la fattura supera i 77,47 €. Scrivi 2 nel campo qui sopra.</div>':'')
      + '</div>'

      + '<div class="sh-b"><div class="sh-tit">Note</div>'
      +   '<div class="field"><textarea id="fa-note" placeholder="Condizioni di pagamento, riferimenti, esclusioni...">'+esc(f.note||"")+'</textarea></div>'
      +   '<div class="sh-nota">Compaiono in fondo al PDF.</div>'
      + '</div>'

      + '</div></div>',

      ctrTastoHTML('fattura')
      +'<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="save-fatt" data-id="'+(f.id||"")+'">'+(isNew?"Crea fattura":"Salva")+'</button>');
    ctrAscolta('fattura');

    /* i lavori scelti nel selettore viaggiano attaccati al modulo finche' non si salva */
    fattLavoriInCorso = (preset&&preset._lavori) ? preset._lavori.slice() : null;
    /* lo stato di avanzamento da cui nasce questa fattura, se ce n'e' uno:
       viaggia attaccato al modulo e si scrive solo quando la fattura e' salvata
       davvero. Serve a non chiedere due volte lo stesso acconto. */
    fattSalInCorso = (preset&&preset._sal) ? String(preset._sal) : null;

    const cont=$("#fatt-righe");
    if(cont)cont.addEventListener("input",fattTotaleLive);
    /* 12 agosto 2026 — #fa-cassa e #fa-spese mancavano: un geometra sceglieva
       "5% Cassa Geometri" e scriveva 150 di spese, e il riquadro "Il conto"
       restava fermo sul numero di prima. La cassa e' una tendina, quindi
       serve anche "change". */
    /* ⚠️ 21 agosto 2026 — e mancava anche #fa-spese-iva, il «Rimborso spese».
       Stesso difetto di allora, su un campo aggiunto dopo: scrivevi 200 € e
       il riquadro restava fermo sul numero di prima; salvavi e cambiava.
       Se domani nasce un altro campo che entra nel conto, la sua riga va
       aggiunta QUI, se no il riquadro mente di nuovo. */
    ["#fa-sconto","#fa-bollo","#fa-rit","#fa-cassa","#fa-cassa-tipo","#fa-spese","#fa-spese-iva"].forEach(id=>{
      const e=$(id);if(!e)return;
      e.addEventListener("input",fattTotaleLive);
      e.addEventListener("change",fattTotaleLive);
    });
    fattTotaleLive();
  }
  let fattLavoriInCorso=null, fattSalInCorso=null;

  /* Un salvataggio che fallisce con un messaggino che svanisce è peggio di
     uno che non fallisce: si perde quello che si è scritto e non si capisce
     perché. Questo riquadro resta dentro il modulo finche' non si riprova. */
  function fattErrore(testo){
    const b=document.querySelector("#sheet .sh-body");
    if(!b){toast(testo);return;}
    let box=b.querySelector("#fatt-errore");
    if(!box){
      box=document.createElement("div");
      box.id="fatt-errore";box.className="fatt-errore";
      b.insertBefore(box,b.firstChild);
    }
    box.innerHTML="<b>La fattura non e\u2019 stata salvata.</b><br>"+esc(testo)
      +"<br><br>Quello che hai scritto e\u2019 ancora qui: correggi e riprova, oppure manda questa schermata ad Alessio.";
    b.scrollTop=0;
    try{console.error("[FATTURA]",testo);}catch(e){}
  }

  async function saveFattura(id){
    if(!sbUid){fattErrore("Non risulti loggato.");return;}
    try{
    const righe=[];
    $$("#fatt-righe [data-riga]").forEach((d,i)=>{
      const descrizione=d.querySelector(".fr-desc").value.trim();
      if(!descrizione)return;
      righe.push({
        descrizione,
        qta:_numRiga(d,".fr-qta",1),
        prezzo:_numRiga(d,".fr-prezzo",0),
        iva: fattForfettario()?0:(+(d.querySelector(".fr-iva")||{}).value||0),
        ordine:i
      });
    });
    if(!righe.length){fattErrore("Manca almeno una voce: scrivi una descrizione, la quantità e il prezzo.");return;}

    const cliente_id=$("#fa-cli").value||null;
    const data=$("#fa-data").value||todayStr();
    const testata={
      cliente_id, data,
      anno:+data.slice(0,4),
      tipo:$("#fa-tipo").value||"fattura",
      sconto:_numIt("#fa-sconto")||0,
      bollo:_numIt("#fa-bollo")||0,
      ritenuta_perc:_numIt("#fa-rit")||0,
      note:$("#fa-note").value.trim()||null
    };
    /* cassa e spese: i campi ci sono solo per gli studi. Si scrivono solo se
       ci sono davvero, se no una fattura di un'impresa li azzererebbe. */
    if($("#fa-cassa")){
      /* due campi, due dati: quanto e quale. */
      testata.cassa_perc=_numIt("#fa-cassa")||0;
      testata.cassa_tipo=($("#fa-cassa-tipo")&&$("#fa-cassa-tipo").value)||null;
      testata.spese=_numIt("#fa-spese")||0;
      /* la casella del rimborso c'e' solo sulle fatture nuove: su una vecchia
         non si scrive niente in quella colonna, cosi' non resta un numero
         appoggiato li' che nessuno legge */
      if($("#fa-spese-iva"))testata.spese_iva=_numIt("#fa-spese-iva")||0;
    }
    /* Il regime delle spese si scrive UNA VOLTA SOLA, quando la fattura nasce,
       e non si tocca mai piu' — nemmeno se un giorno riapri e risalvi una
       fattura vecchia. Una fattura accettata dallo SDI non si corregge a
       posteriori: se il gestionale la ricalcolasse col conto nuovo non
       tornerebbe piu' ne' col file mandato all'Agenzia ne' col bonifico del
       cliente. Le vecchie restano vecchie, per sempre. */
    if(!id)testata.spese_regime="art15";
    /* una copia dei dati del cliente resta dentro la fattura: se domani cambi
       l'indirizzo in anagrafica, la fattura già emessa non deve cambiare */
    const c=fattCliCache.find(x=>String(x.id)===String(cliente_id));
    if(c){
      testata.cli_nome=c.nome||null; testata.cli_piva=c.piva||null;
      testata.cli_cod_fiscale=c.cod_fiscale||null; testata.cli_indirizzo=c.indirizzo||null;
      testata.cli_cap=c.cap||null; testata.cli_citta=c.citta||null; testata.cli_prov=c.prov||null;
      testata.cli_sdi=c.sdi_codice||null; testata.cli_pec=c.sdi_pec||null;
    }
    testata.regime_fiscale=(fattAzienda&&fattAzienda.regime_fiscale)||null;

    let fid=id, vecchieRighe=[];
    /* se sql/gest-fattura-cassa.sql non è ancora stato eseguito, le tre
       colonne nuove non esistono: invece di perdere TUTTA la fattura le
       togliamo e riproviamo, dicendolo (stesso schema dei Dati azienda). */
    let avvisoCassa=false;
    const _senzaCassa=o=>{const x=Object.assign({},o);delete x.cassa_perc;delete x.cassa_tipo;delete x.spese;delete x.spese_iva;delete x.spese_regime;return x;};
    const _eCassaMancante=e=>/cassa_perc|cassa_tipo|\bspese\b|spese_iva|spese_regime/.test((e&&e.message)||"")&&/column|schema cache/i.test((e&&e.message)||"");
    if(id){
      let {data:okFat,error}=await sb.from("gest_fatture").update(testata).eq("id",id).eq("user_id",sbUid).select("id");
      if(error&&_eCassaMancante(error)){
        const rip=await sb.from("gest_fatture").update(_senzaCassa(testata)).eq("id",id).eq("user_id",sbUid).select("id");
        okFat=rip.data;error=rip.error;if(!error)avvisoCassa=true;
      }
      if(error){fattErrore(error.message);return;}
      if(!okFat||!okFat.length){fattErrore("Non salvata: nessuna riga modificata. Riprova.");return;}
      /* ===== 12 agosto 2026 (sera) — PRIMA SI SCRIVE, POI SI CANCELLA =====
         Qui le vecchie voci venivano cancellate SUBITO e le nuove scritte dopo.
         Bastava che l'inserimento fallisse — la rete che cade a metà, una
         descrizione troppo lunga, un permesso — per restare con una fattura
         SENZA NESSUNA VOCE e senza modo di riaverle. Adesso si segnano da parte
         gli id di quelle vecchie e si tolgono solo DOPO che le nuove sono
         entrate: se qualcosa va storto, la fattura è ancora tutta lì. */
      const {data:vecc,error:eVec}=await sb.from("gest_fattura_righe").select("id").eq("fattura_id",id).eq("user_id",sbUid);
      if(eVec){fattErrore("Non riesco a leggere le voci di prima: "+eVec.message);return;}
      vecchieRighe=(vecc||[]).map(r=>r.id);
    }else{
      const nuova={...testata,user_id:sbUid,mestiere_id:curMestiere(),stato:"bozza"};
      let {data:nf,error}=await sb.from("gest_fatture").insert(nuova).select().single();
      if(error&&_eCassaMancante(error)){
        const rip=await sb.from("gest_fatture").insert(_senzaCassa(nuova)).select().single();
        nf=rip.data;error=rip.error;if(!error)avvisoCassa=true;
      }
      if(error){fattErrore(error.message);return;}
      fid=nf.id;
    }
    const {error:e2}=await sb.from("gest_fattura_righe")
      .insert(righe.map(r=>({...r,user_id:sbUid,fattura_id:fid})));
    if(e2){fattErrore("Le voci non sono state salvate: "+e2.message+" — quelle di prima sono ancora al loro posto.");return;}
    /* adesso che le nuove ci sono, si tolgono quelle di prima */
    if(vecchieRighe.length){
      const {error:eDel}=await sb.from("gest_fattura_righe").delete().in("id",vecchieRighe).eq("user_id",sbUid);
      if(eDel){
        fattErrore("Le voci nuove sono salvate, ma le vecchie non si sono cancellate ("+eDel.message
                  +"): adesso la fattura ha le voci doppie. Riapri e salva di nuovo.");
        return;
      }
    }

    /* i lavori scelti nel selettore, agganciati adesso che la fattura esiste */
    if(fattLavoriInCorso&&fattLavoriInCorso.length){
      const {error:e3}=await sb.from("gest_fattura_lavori")
        .insert(fattLavoriInCorso.map(lid=>({user_id:sbUid,fattura_id:fid,lavoro_id:lid})));
      if(e3&&!/duplicate|unique/i.test(e3.message||""))toast("Lavori non collegati: "+e3.message);
      fattLavori[fid]=(fattLavori[fid]||[]).concat(fattLavoriInCorso);
      fattLavoriInCorso=null;
    }

    /* ⚠️ 19 agosto 2026 — LO STATO DI AVANZAMENTO SI SEGNA COME FATTURATO.
       Senza, niente impedisce di creare DUE fatture per lo stesso SAL: gli
       stessi soldi chiesti due volte al committente, e nessuno che se ne
       accorga finche' non arriva lui a dirlo.
       Se la fattura non si e' salvata, qui non ci si arriva nemmeno: il
       collegamento si scrive solo dopo, mai prima.
       E se la colonna non c'e' ancora (migrazione non eseguita) la fattura
       resta buona lo stesso: si dice cosa manca e perche' e' importante. */
    if(fattSalInCorso){
      const {data:okSal,error:e4}=await sb.from("gest_sal")
        .update({fattura_id:fid}).eq("id",fattSalInCorso).eq("user_id",sbUid).select("id");
      if(e4){
        toast(/fattura_id|column|schema cache/i.test(e4.message||"")
          ? "Fattura salvata, ma lo stato di avanzamento non se la ricorda: esegui sql/gest-sal-fattura.sql su Supabase, se no rischi di fatturare due volte lo stesso acconto."
          : "Fattura salvata, ma non sono riuscito a collegarla al SAL: "+e4.message);
      }else if(!okSal||!okSal.length){
        toast("Fattura salvata, ma il collegamento allo stato di avanzamento non è stato scritto. Riapri il SAL e controlla.");
      }
      fattSalInCorso=null;
    }

    closeSheet();
    if(avvisoCassa)toast("Salvata, ma cassa e spese NON sono state registrate: esegui sql/gest-fattura-cassa.sql su Supabase.");
    rinfresca("fatture","riepilogo","lavori");
    toast(id?"Fattura aggiornata ✔":"Fattura creata ✔ — è una bozza, emettila quando è pronta");
    }catch(err){
      fattErrore((err&&(err.message||err.toString()))||"errore sconosciuto");
    }
  }

  /* ---------- cambio di stato ---------- */
  async function fattCambiaStato(id,v){
    const f=fattCache.find(x=>String(x.id)===String(id));
    if(!f){toast("Fattura non trovata");return;}
    /* una fattura senza cliente non è una fattura: finche' è bozza va bene,
       ma non deve poter prendere un numero */
    if(v==="emessa"&&!f.cliente_id){
      toast("Scegli il cliente prima di emetterla: una fattura deve dire a chi va");
      fattForm(f);return;
    }
    const patch={stato:v};
    if(v==="pagata")patch.data_pagata=todayStr();
    if(v==="emessa")patch.data_pagata=null;
    /* numero e stato nella STESSA scrittura: se va storto non resta una bozza
       con un numero gia' bruciato addosso */
    let _nuovoNum=null;
    if(v==="emessa"&&!f.numero){
      _nuovoNum=await fattProssimoNumero(f);
      if(_nuovoNum==null)return;
      patch.numero=_nuovoNum;
      patch.anno=+((f.data||todayStr()).slice(0,4));
    }
    const {data:okSt,error}=await sb.from("gest_fatture").update(patch).eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!okSt||!okSt.length){toast("Non salvata: nessuna riga modificata. Riprova.");return;}
    if(_nuovoNum!=null){f.numero=_nuovoNum;f.anno=patch.anno;}
    await fattSincronizzaLavori(id,v);
    rinfresca("fatture","riepilogo","lavori");
    toast(v==="emessa"?("Fattura n. "+f.numero+"/"+fattAnno(f)+" emessa ✔"):(v==="pagata"?"Segnata pagata ✔":"Aggiornata"));
  }

  async function eliminaFattura(id){
    const f=fattCache.find(x=>String(x.id)===String(id));
    const avviso=f&&f.numero
      ? "Questa fattura ha il numero "+f.numero+"/"+fattAnno(f)+". Cancellarla lascia un buco nella numerazione, e i buchi il commercialista li vede. Se è sbagliata, di solito si fa una nota di credito.\n\nEliminare lo stesso?"
      : "Eliminare questa bozza di fattura?";
    if(!gconfirm(avviso))return;
    await fattSincronizzaLavori(id,"none");
    const {data:okEl,error}=await sb.from("gest_fatture").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!okEl||!okEl.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}
    rinfresca("fatture","riepilogo","lavori");toast("Fattura eliminata");
  }

  /* ---------- le tre origini ----------
     1. da uno o più lavori finiti  2. da un preventivo accettato  3. vuota */

  function fattDaLavoriScegli(){
    if(!fattLavLiberi.length){toast("Non ci sono lavori finiti da fatturare");return;}
    /* raggruppo per cliente: fatturare insieme tre lavori di clienti diversi
       non ha senso, e mostrarli mischiati invita a sbagliare */
    const perCli={};
    fattLavLiberi.forEach(l=>{const k=String(l.cliente_id||"");(perCli[k]=perCli[k]||[]).push(l);});
    const nomeCli=k=>{const c=fattCliCache.find(x=>String(x.id)===k);return c?c.nome:"Senza cliente";};
    const gruppi=Object.keys(perCli).sort((a,b)=>nomeCli(a).localeCompare(nomeCli(b)));

    openSheetGrande("Quali lavori metto in fattura",
      '<div class="sh-b"><div class="sh-tit">Lavori finiti non ancora fatturati</div>'
      + '<div class="sh-nota">Spunta i lavori dello <b>stesso cliente</b>: diventano le voci di una fattura sola. È così che tre lavori per lo stesso condominio smettono di essere tre fatture.</div>'
      + '<div id="fl-lista">'
      + gruppi.map(k=>
          '<div class="fl-gruppo"><div class="fl-cli">'+esc(nomeCli(k))+'</div>'
          + perCli[k].map(l=>
              '<label class="fl-riga"><input type="checkbox" class="fl-ck" value="'+esc(l.id)+'" data-cli="'+esc(k)+'">'
              + '<span class="fl-t">'+esc(l.descrizione||"Lavoro")
              +   (l.dove?'<span class="fl-d">'+esc(l.dove)+'</span>':"")
              + '</span><span class="fl-i">'+eur(l.importo)+'</span></label>').join("")
          + '</div>').join("")
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="fatt-da-lavori-ok">Continua</button>');
  }

  async function fattDaLavoriConferma(){
    const ck=Array.from($$("#fl-lista .fl-ck:checked"));
    if(!ck.length){toast("Spunta almeno un lavoro");return;}
    const cli=new Set(ck.map(c=>c.dataset.cli));
    if(cli.size>1){toast("Scegli lavori di un cliente solo: una fattura va a un cliente solo");return;}
    const ids=ck.map(c=>c.value);
    const lavori=fattLavLiberi.filter(l=>ids.includes(String(l.id)));
    const clienteId=[...cli][0]||null;
    /* 9 agosto 2026 — ogni lavoro porta l'aliquota del SUO preventivo
       accettato: prima partivano tutti dal 10% di default, e un preventivo
       firmato al 22% diventava una fattura al 10%. */
    const righeIva=[];
    for(let i=0;i<lavori.length;i++){
      const l=lavori[i];
      const al=fattForfettario()?0:await _ivaDalPreventivo(l.id);
      righeIva.push({descrizione:(l.descrizione||"Prestazione di servizi")+(l.dove?" — "+l.dove:""),
        qta:1, prezzo:+l.importo||0, iva:al, ordine:i});
    }
    closeSheet();
    fattForm(null,{
      cliente_id:clienteId||null,
      data:todayStr(),
      _lavori:ids,
      _righe:righeIva
    });
  }

  async function fattDaPreventivoScegli(){
    if(!sb||!sbUid)return;
    const {data}=await sb.from("gest_preventivi").select("*")
      .eq("user_id",sbUid).eq("mestiere_id",curMestiere()).eq("stato","accettato")
      .order("data",{ascending:false});
    const P=data||[];
    if(!P.length){toast("Non ci sono preventivi accettati");return;}
    const cliNome=id=>{const c=fattCliCache.find(x=>String(x.id)===String(id));return c?c.nome:"";};
    openSheetGrande("Da quale preventivo accettato",
      '<div class="sh-b"><div class="sh-tit">Preventivi accettati</div>'
      + '<div class="sh-nota">La fattura si porta dietro tutte le righe del preventivo, con quantità e prezzi. Non devi riscrivere niente.</div>'
      + '<div id="fp-lista">'
      + P.map(p=>'<label class="fl-riga"><input type="radio" name="fp" class="fp-ck" value="'+esc(p.id)+'">'
          + '<span class="fl-t">N. '+esc(String(p.numero||"—"))+' — '+esc(p.titolo||"Preventivo")
          + (cliNome(p.cliente_id)?'<span class="fl-d">'+esc(cliNome(p.cliente_id))+'</span>':"")
          + '</span><span class="fl-i">'+fdate(p.data)+'</span></label>').join("")
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="fatt-da-prev-ok">Continua</button>');
  }

  async function fattDaPreventivoConferma(){
    const sel=document.querySelector("#fp-lista .fp-ck:checked");
    if(!sel){toast("Scegli un preventivo");return;}
    return fattDaPreventivoId(sel.value);
  }
  /* ===== 12 agosto 2026 (sera) — LA FATTURA SI FA ANCHE DAL PREVENTIVO =====
     Il passaggio preventivo -> fattura esisteva, ma solo partendo da Fatture:
     "+ Nuova fattura" -> "Da un preventivo accettato" -> scegli nell'elenco.
     Dal preventivo, che e' il posto dove uno sta guardando quando il cliente
     dice "va bene", non si poteva fare: bisognava ricordarsi la strada lunga.
     Ora il corpo di quella funzione sta qui, prende un id, e lo chiamano tutti
     e due i punti: una sola strada, gli stessi conti. */
  async function fattDaPreventivoId(pid){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const [{data:p,error:eP},{data:rr,error:eR}]=await Promise.all([
      sb.from("gest_preventivi").select("*").eq("id",pid).eq("user_id",sbUid).maybeSingle(),
      sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",pid).order("ordine")
    ]);
    if(eP||eR){toast("Non riesco a leggere il preventivo: "+((eP||eR).message||"il database non risponde"));return;}
    if(!p){toast("Preventivo non trovato");return;}
    if(!(rr||[]).length){toast("Questo preventivo non ha voci: aprilo, aggiungile e riprova.");return;}
    /* la percentuale della cassa passa SEMPRE intera, qualunque sia. Quale
       cassa sia lo dice la fattura: se non l'hai mai scritta, il modulo la
       propone in bianco e il controllo del file elettronico te la chiede
       prima di generarlo. */
    const _cp=+p.cassa_perc||0;
    const _uc=fattUltimaCassa();
    if(_cp>0&&!_uc.tipo){
      toast("La cassa al "+_pct(_cp)+"% è passata in fattura. Scegli anche QUALE cassa è: serve al file elettronico.");
    }
    closeSheet();
    fattForm(null,{
      cliente_id:p.cliente_id||null,
      data:todayStr(),
      note:p.note||null,
      /* 9 agosto 2026 — il lavoro nato dal preventivo accettato va agganciato
         alla fattura, se no restava "da fatturare" per sempre e si poteva
         fatturare due volte. `lavoro_id` sul preventivo veniva scritto e non
         letto da nessuno: è esattamente il dato che serviva qui. */
      _lavori: p.lavoro_id ? [p.lavoro_id] : null,
      /* 9 agosto 2026 — la parcella deve arrivare INTERA in fattura.
         Prima passavano solo le righe: la ritenuta ripartiva da zero e il
         cliente riceveva una fattura con un importo diverso da quello che
         aveva firmato nella lettera d'incarico.
         Le spese (bolli, diritti) diventano una riga a IVA 0: sono anticipi
         fuori campo, non compenso. */
      /* la parcella arriva INTERA: cassa, spese e ritenuta sono gli stessi tre
         concetti che ora esistono anche in fattura, quindi i conti coincidono
         al centesimo con quelli firmati nella lettera d'incarico. */
      ritenuta_perc: p.ritenuta ? (+p.ritenuta_perc||20) : 0,
      cassa_perc: +p.cassa_perc||0,
      /* 12 agosto 2026 (sera) — prima si cercava la cassa in base alla sola
         percentuale: col 2% non trovava niente e la cassa restava vuota, e con
         il 4% poteva scegliere Inarcassa a un consulente del lavoro. Adesso si
         riprende quella che ha usato l'ultima volta — un suo dato, non
         un'ipotesi — e se non ce n'e' resta da scegliere. */
      cassa_tipo: _uc.tipo||null,
      spese: +p.spese_forfait||0,
      /* i titoli dei capitoli NON passano in fattura: una fattura elettronica
         ha righe di DettaglioLinee, e una riga da 0 € col nome di un capitolo
         è rumore dentro un file che va allo SDI. Il conto non cambia (una
         riga di capitolo vale sempre zero), cambia solo che non c'è. */
      _righe:(rr||[]).filter(r=>!_rigaSezione(r)).map((r,i)=>({
        descrizione:r.descrizione, qta:+r.qta||1, prezzo:+r.prezzo||0,
        /* 9 agosto 2026 — l'aliquota promessa nel preventivo (e firmata nella
           conferma d'ordine) deve arrivare uguale in fattura: prima partiva
           sempre dal 10% di default anche se il preventivo diceva 22 o 4. */
        iva:fattForfettario()?0:((p.iva_perc!=null&&p.iva_perc!=="")?(+p.iva_perc||0):ivaDefault()), ordine:i
      }))
    });
  }



  /* Il pulsante "+ Nuova": prima creava un lavoro con la fattura già emessa.
     Ora chiede da dove nasce la fattura, perché le strade sono tre. */
  function fattNuovaScegli(){
    const nLav=fattLavLiberi.length;
    openSheetGrande("Da dove nasce questa fattura",
      '<div class="sh-b"><div class="sh-tit">Scegli come partire</div>'
      + '<div class="fn-scelte">'
      +   '<button type="button" class="fn-s" data-action="fatt-da-lavori">'
      +     '<span class="fn-t">Da uno o più lavori finiti</span>'
      +     '<span class="fn-d">'+(nLav?(nLav+(nLav===1?" lavoro finito aspetta":" lavori finiti aspettano")+" di essere fatturati. Li spunti e diventano le voci."):"Al momento non ci sono lavori finiti da fatturare.")+'</span></button>'
      +   '<button type="button" class="fn-s" data-action="fatt-da-prev">'
      +     '<span class="fn-t">Da un preventivo accettato</span>'
      +     '<span class="fn-d">Si porta dietro tutte le righe con quantità e prezzi. Non riscrivi niente.</span></button>'
      +   '<button type="button" class="fn-s" data-action="fatt-vuota">'
      +     '<span class="fn-t">Vuota, la scrivo io</span>'
      +     '<span class="fn-d">Per acconti, rimborsi spese, consulenze: tutto quello che non ha un lavoro dietro.</span></button>'
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>');
  }

  /* dalla scheda di un lavoro: fattura con dentro quel lavoro solo */
  /* l'aliquota del preventivo accettato per quel lavoro; se non c'e', il default */
  async function _ivaDalPreventivo(lavoroId){
    try{
      const {data}=await sb.from("gest_preventivi").select("iva_perc")
        .eq("user_id",sbUid).eq("lavoro_id",lavoroId).eq("stato","accettato").limit(1);
      const v=data&&data[0]&&data[0].iva_perc;
      if(v!=null&&v!=="")return +v||0;
    }catch(e){}
    return ivaDefault();
  }
  async function fattDaUnLavoro(lavoroId){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    /* se quel lavoro sta già dentro una fattura, non ne creo un'altra: apro quella */
    const {data:gia}=await sb.from("gest_fattura_lavori").select("fattura_id").eq("user_id",sbUid).eq("lavoro_id",lavoroId).limit(1);
    if(gia&&gia.length){
      const {data:f}=await sb.from("gest_fatture").select("*").eq("id",gia[0].fattura_id).maybeSingle();
      if(f){closeSheet();
        if(!fattCliCache.length){const {data:c}=await sb.from("gest_clienti").select("*").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("nome");fattCliCache=c||[];}
        fattForm(f);toast("Questo lavoro è già in una fattura: te l'ho aperta");return;}
    }
    const {data:l}=await sb.from("gest_lavori").select("*").eq("id",lavoroId).eq("user_id",sbUid).maybeSingle();
    if(!l){toast("Lavoro non trovato");return;}
    closeSheet();
    /* 9 agosto 2026 — l'aliquota promessa al cliente. Se quel lavoro nasce da
       un preventivo accettato, l'IVA è quella che il cliente ha firmato nella
       conferma d'ordine: partire dal 10% di default significava mandargli una
       fattura diversa dal foglio che ha in mano. */
    const ivaLav=await _ivaDalPreventivo(l.id);
    fattForm(null,{
      cliente_id:l.cliente_id||null,
      data:todayStr(),
      _lavori:[l.id],
      _righe:[{descrizione:(l.descrizione||"Prestazione di servizi")+(l.dove?" — "+l.dove:""),
               qta:1, prezzo:+l.importo||0, iva:fattForfettario()?0:ivaLav, ordine:0}]
    });
  }

  /* ---------- il PDF ----------
     Il vecchio PDF metteva TOTALE = importo del lavoro, senza imponibile e
     senza IVA: non era una fattura, era una ricevuta. Questo ha le righe con
     l'aliquota, il riepilogo per aliquota che chiede lo SDI, e le diciture di
     legge per il forfettario. Resta una copia di cortesia: la fattura valida
     è quella elettronica. */
  async function fatturaPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const f=fattCache.find(x=>String(x.id)===String(id));
    if(!f){toast("Fattura non trovata");return;}
    const R=(fattRighe[f.id]||[]).slice().sort((a,b)=>(+a.ordine||0)-(+b.ordine||0));
    if(!R.length){toast("Questa fattura non ha voci");return;}
    const az=fattAzienda||{};
    const forf=(f.regime_fiscale||az.regime_fiscale)==="RF19";
    const c=fattConti(f);

    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:"mm",format:"a4"});
    const M=16, Rx=194;
    let y=18;

    /* intestazione: chi emette */
    doc.setFont("helvetica","bold");doc.setFontSize(15);
    doc.text(az.nome||"La tua azienda",M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;
    [az.piva?"P.IVA "+az.piva:"", az.cod_fiscale?"C.F. "+az.cod_fiscale:"", azIndirizzo(az),
     [az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});

    /* numero e data */
    doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(13);
    doc.text(FATT_TIPO_LAB[f.tipo]||"Fattura",Rx,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(90);
    doc.text(f.numero?("N. "+f.numero+" / "+fattAnno(f)):"Bozza — non ancora emessa",Rx,y+6,{align:"right"});
    doc.text("del "+fdate(f.data),Rx,y+11,{align:"right"});
    doc.setTextColor(0);

    y=Math.max(hy,y+16)+4;doc.setDrawColor(210);doc.line(M,y,Rx,y);y+=9;

    /* cliente */
    const cli=fattCliCache.find(x=>String(x.id)===String(f.cliente_id))||{};
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Cliente",M,y);y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(11);
    doc.text(f.cli_nome||cli.nome||"—",M,y);y+=5;
    doc.setFontSize(9);doc.setTextColor(90);
    const cInd=[f.cli_indirizzo||cli.indirizzo||"",
                [f.cli_cap||cli.cap||"", f.cli_citta||cli.citta||""].filter(Boolean).join(" ")
                 +((f.cli_prov||cli.prov)?" ("+(f.cli_prov||cli.prov)+")":"")].filter(x=>x.trim());
    cInd.forEach(t=>{doc.text(t,M,y);y+=4.5;});
    const cFisc=[(f.cli_piva||cli.piva)?"P.IVA "+(f.cli_piva||cli.piva):"",
                 (f.cli_cod_fiscale||cli.cod_fiscale)?"C.F. "+(f.cli_cod_fiscale||cli.cod_fiscale):""].filter(Boolean).join("   ");
    if(cFisc){doc.text(cFisc,M,y);y+=4.5;}
    doc.setTextColor(0);y+=7;

    /* tabella delle voci */
    const colQ=Rx-96, colP=Rx-66, colI=Rx-40, colT=Rx;
    doc.setFillColor(11,75,196);doc.rect(M,y,Rx-M,8,"F");
    doc.setTextColor(255);doc.setFont("helvetica","bold");doc.setFontSize(9);
    doc.text("Descrizione",M+2,y+5.5);
    doc.text("Q.tà",colQ,y+5.5,{align:"right"});
    doc.text("Prezzo",colP,y+5.5,{align:"right"});
    if(!forf)doc.text("IVA",colI,y+5.5,{align:"right"});
    doc.text("Importo",colT-2,y+5.5,{align:"right"});
    doc.setTextColor(0);doc.setFont("helvetica","normal");y+=8;

    R.forEach(r=>{
      const imp=(+r.qta||0)*(+r.prezzo||0);
      const al=forf?0:(+r.iva||0);
      const lines=doc.splitTextToSize(r.descrizione||"",colQ-M-8);
      const h=Math.max(lines.length*4.6+5, 9);
      if(y+h>262){doc.addPage();y=20;}
      doc.setDrawColor(220);doc.line(M,y,Rx,y);
      doc.setFontSize(9.5);
      doc.text(lines,M+2,y+5.5);
      /* la virgola c'era già, ma non la rete contro la coda della virgola
         mobile: una quantità nata da una somma poteva uscire in fattura come
         «0,30000000000000004». _numTesto fa tutte e due le cose, ed è lo
         stesso che scrive la quantità sul preventivo — i due documenti dello
         stesso lavoro devono dire il numero nello stesso modo. */
      doc.text(_numTesto(+r.qta||0),colQ,y+5.5,{align:"right"});
      doc.text(eurPdf(r.prezzo),colP,y+5.5,{align:"right"});
      if(!forf)doc.text(_pct(al)+"%",colI,y+5.5,{align:"right"});
      doc.text(eurPdf(imp),colT-2,y+5.5,{align:"right"});
      y+=h;
    });
    doc.setDrawColor(180);doc.line(M,y,Rx,y);y+=8;

    /* riepilogo per aliquota: è quello che chiede lo SDI, e serve al
       commercialista per controllare in due secondi.
       12 agosto 2026 — le righe arrivano da fattConti (fattBasi): cassa e
       spese sono gia' dentro, e lo sconto e' gia' ripartito. Prima il conto si
       rifaceva qui a mano, ed e' cosi' che PDF, Excel e file per lo SDI
       finivano per dire tre numeri diversi. */
    /* ===== 12 agosto 2026 — IL TOTALE FINIVA FUORI PAGINA =====
       Il salto pagina esisteva SOLO dentro l'elenco delle voci. Da qui in poi
       (riepilogo IVA, totali, pagamento, note, stato) y cresceva senza che
       nessuno guardasse il fondo del foglio: con una ventina di voci il
       riquadro TOTALE veniva disegnato 8 mm oltre il bordo dell'A4, quindi
       spariva, e il piè di pagina — che sta a quota fissa 283 — ci finiva
       sopra. Una fattura lunga usciva senza il totale.
       spazio(h) chiede: "ci stanno ancora h millimetri?". Se no, pagina nuova.
       LIMITE 262: sotto ci deve restare posto per il piè di pagina. */
    const LIMITE=262;
    const spazio=h=>{ if(y+h>LIMITE){doc.addPage();y=20;} };

    const righeIva=(c.righeIva||[]);
    if(!forf&&righeIva.length){
      /* il riepilogo IVA non si spezza a metà: o ci sta tutto o va di là */
      spazio(9+righeIva.length*4.2);
      doc.setFontSize(8.5);doc.setTextColor(110);
      doc.text("Riepilogo IVA",M,y);y+=4.5;
      righeIva.forEach(ri=>{
        doc.text("aliquota "+ri.aliquota+"%  ·  imponibile "+eurPdf(ri.imponibile)+"  ·  imposta "+eurPdf(ri.imposta),M,y);y+=4.2;
      });
      doc.setTextColor(0);y+=4;
    }

    /* totali */
    const riga=(lab,val,grosso)=>{
      spazio(grosso?9:6);
      doc.setFont("helvetica",grosso?"bold":"normal");
      doc.setFontSize(grosso?11.5:10);
      doc.text(lab,Rx-70,y);doc.text(val,Rx-2,y,{align:"right"});
      y+=grosso?7:5.4;
    };
    /* il blocco dei totali si tiene insieme: quante righe saranno, piu' i due
       riquadri. Se non ci stanno tutte, si parte da una pagina nuova invece di
       spezzare il conto in due fogli. */
    const _extra=(c.cassa||c.spese||c.speseIva||c.sconto);
    const _nRighe=1+(!forf?1:0)+(+f.bollo?1:0)+(c.ritenuta?1:0)
                 +(_extra?(1+(c.cassa?1:0)+(c.spese?1:0)+(c.speseIva?1:0)+(c.sconto?1:0)):0);
    spazio(_nRighe*5.4+13+(c.ritenuta?13:0));
    /* 9 agosto 2026 — cassa e spese in chiaro: prima il PDF mostrava un solo
       "Imponibile" e il cliente non capiva da dove usciva il totale. */
    if(_extra){
      riga(ruoloUtente==='professionista'?"Compenso":"Imponibile voci",eurPdf(c.compenso));
      if(c.cassa)riga("Cassa previdenziale "+_pct(f.cassa_perc)+"%",eurPdf(c.cassa));
      if(c.speseIva)riga("Rimborso spese",eurPdf(c.speseIva));
      /* le spese anticipate vanno scritte per quello che sono: il cliente deve
         capire perche' su quei soldi non c'e' l'IVA */
      if(c.spese)riga(c.art15?"Spese anticipate (escluse art. 15)":"Spese documentate",eurPdf(c.spese));
      /* lo sconto sta QUI, prima dell'imponibile: e' da li' che si toglie, ed
         e' su quello che resta che si calcola l'IVA */
      if(c.sconto)riga("Sconto","-"+eurPdf(c.sconto));
    }
    riga((c.spese&&c.art15)?"Totale imponibile":("Imponibile"+(_extra?" IVA":"")),eurPdf(c.imponibile));
    if(!forf)riga("IVA",eurPdf(c.iva));
    if(+f.bollo)riga("Imposta di bollo",eurPdf(f.bollo));
    if(c.ritenuta)riga("Ritenuta d'acconto "+_pct(f.ritenuta_perc)+"%","-"+eurPdf(c.ritenuta));
    doc.setDrawColor(11,75,196);doc.setLineWidth(.4);
    doc.rect(Rx-72,y-2,72,11);doc.setLineWidth(.2);
    y+=6;riga("TOTALE",eurPdf(c.totale),true);
    if(c.ritenuta){
      y+=2;doc.setDrawColor(11,75,196);doc.setLineWidth(.4);doc.rect(Rx-72,y-2,72,11);doc.setLineWidth(.2);
      y+=6;riga("NETTO A PAGARE",eurPdf(c.daPagare),true);
    }
    y+=6;

    /* pagamento e note */
    if(az.iban){
      spazio(20);
      doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Pagamento",M,y);y+=5.5;
      doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
      doc.text("Bonifico — IBAN "+az.iban,M,y);y+=4.5;
      if(f.numero)doc.text("Causale: fattura n. "+f.numero+"/"+fattAnno(f),M,y),y+=4.5;
      doc.setTextColor(0);y+=3;
    }
    if(f.note){
      const _rn=doc.splitTextToSize(f.note,Rx-M);
      spazio(12+_rn.length*4.4);
      doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Note",M,y);y+=5.5;
      doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
      _rn.forEach(t=>{ spazio(6); doc.text(t,M,y);y+=4.4; });
      doc.setTextColor(0);y+=3;
    }
    spazio(8);
    doc.setFont("helvetica","bold");doc.setFontSize(10);
    doc.text("Stato: "+(f.stato==="pagata"?"PAGATA":(f.stato==="emessa"?"DA SALDARE":"BOZZA")),M,y);

    /* diciture di legge in fondo */
    const piede=[];
    if(forf)piede.push("Operazione senza applicazione dell'IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014 (regime forfettario).");
    if(forf&&+f.bollo)piede.push("Imposta di bollo assolta in modo virtuale.");
    piede.push("Documento non fiscale (copia di cortesia). La fattura elettronica valida viene emessa tramite Sistema di Interscambio.");
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(140);
    let py=283;piede.reverse().forEach(t=>{
      const L=doc.splitTextToSize(t,Rx-M);
      py-=L.length*3.2;doc.text(L,M,py);
    });

    const nome=(f.cli_nome||cli.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase();
    doc.save("fattura-"+(f.numero?f.numero+"-"+fattAnno(f):"bozza")+"-"+nome+".pdf");
    toast("PDF scaricato ✅");
  }


  /* ================= FATTURA ELETTRONICA (XML per lo SDI) =================
     Il PDF che il gestionale scarica è una copia di cortesia: per lo Stato
     non vale niente. La fattura che conta è questo file XML, nel formato
     FatturaPA. Qui il gestionale lo GENERA e te lo fa scaricare: lo carichi
     sul portale del tuo commercialista, che lo manda allo SDI. L'invio
     automatico è un altro lavoro e viene dopo.

     Formato: FatturaPA 1.2.2, attributo versione FPR12 (fattura fra privati).
     Le specifiche tecniche sono passate alla 1.9.1 il 15 maggio 2026, ma sono
     ritocchi che non toccano una fattura edile: lo schema del file è lo stesso.

     REGOLA IMPORTANTE: questo file non si manda mai senza averlo prima passato
     dal validatore gratuito dell'Agenzia delle Entrate. Il gestionale controlla
     quello che può controllare (campi mancanti, formati sbagliati), ma la
     parola finale ce l'ha il validatore. ====================================== */

  const XML_TIPO={fattura:"TD01", acconto:"TD02", nota_credito:"TD04"};

  /* Sotto i tag XML non ci va tutto: & < > " ' vanno scritti in un altro modo,
     altrimenti il file si rompe. Es. "Rossi & Figli" diventa "Rossi &amp; Figli". */
  function xesc(v){
    return String(v==null?"":v)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  }
  /* lo SDI vuole il punto come separatore dei decimali e due cifre esatte */
  const xnum=n=>(Math.round((+n||0)*100)/100).toFixed(2);
  /* Le QUANTITA' non sono soldi: la colonna e' numeric(12,3) (metri quadri,
     metri cubi, ore) e lo schema dello SDI ne accetta fino a otto decimali.
     Scritte con xnum, cioe' arrotondate a due, il controllo che lo SDI fa su
     ogni riga — quantita x prezzo meno lo sconto deve fare il prezzo totale —
     non tornava piu': 2,675 x 3,74 diventava 2,68 x 3,74. */
  /* Attenzione al formato: lo SDI vuole da DUE a otto decimali, quindi gli zeri
     in coda si tolgono ma mai sotto il secondo — "2.5" verrebbe scartato. */
  const xqta=n=>{
    let s=(Math.round((+n||0)*1e6)/1e6).toFixed(6);
    while(s.endsWith("0")&&s.charAt(s.length-3)!==".")s=s.slice(0,-1);
    return s;
  };
  /* la denominazione ha un limite di 80 caratteri; le descrizioni di 1000 */
  const xtaglia=(v,n)=>String(v==null?"":v).trim().slice(0,n);

  /* ---- il controllo prima di generare ----
     Meglio dire subito cosa manca che produrre un file che lo SDI rifiuta
     una settimana dopo. Ogni voce dice cosa manca e dove si mette. */
  function fattXmlControllo(f){
    const az=fattAzienda||{};
    const cli=fattCliCache.find(x=>String(x.id)===String(f.cliente_id))||{};
    const R=fattRighe[f.id]||[];
    const forf=(f.regime_fiscale||az.regime_fiscale)==="RF19";
    const m=[];

    if(!f.numero) m.push("La fattura è ancora una bozza: prima va emessa, così prende il numero.");

    /* 12 agosto 2026 (sera) — la cassa senza il suo codice.
       Se c'e' una percentuale di cassa ma non e' scritto DI QUALE cassa si
       tratta, il file non si puo' fare: lo SDI vuole il codice, e prima il
       gestionale ne inventava uno (TC22, INPS) anche a un geometra. */
    if((+f.cassa_perc||0)>0&&!(f.cassa_tipo||"").trim())
      m.push("C'è il contributo cassa al "+_pct(f.cassa_perc)+"% ma non è scritto quale cassa è. Apri la fattura e scegli la cassa nel campo «Quale cassa previdenziale»: il file elettronico vuole il codice (per esempio TC03 per i geometri, TC04 per Inarcassa).");

    /* --- chi emette: te --- */
    if(!(az.nome||"").trim())        m.push("Manca il nome della tua azienda — Dati azienda.");
    const pulita=v=>String(v||"").replace(/[^0-9A-Za-z]/g,"").toUpperCase();
    /* La partita IVA non è un numero qualsiasi: l'ultima cifra è una cifra di
       controllo calcolata dalle altre dieci. Così una battitura sbagliata si
       becca subito, invece di scoprirla quando lo SDI scarta la fattura.
       (Somma le cifre dispari così come sono; raddoppia le pari e se viene
       più di 9 toglie 9; il totale deve finire con zero.) */
    const pivaOk=v=>{
      if(!/^\d{11}$/.test(v))return false;
      let s=0;
      for(let i=0;i<11;i++){
        let d=+v[i];
        if(i%2===1){d*=2;if(d>9)d-=9;}
        s+=d;
      }
      return s%10===0;
    };
    const azPiva=pulita(az.piva);
    if(!azPiva)                      m.push("Manca la tua partita IVA — Dati azienda.");
    else if(!/^\d{11}$/.test(azPiva))
      m.push("La tua partita IVA è di "+azPiva.length+" cifre, ma una partita IVA italiana ne ha esattamente 11 — Dati azienda.");
    else if(!pivaOk(azPiva))
      m.push("La tua partita IVA ha 11 cifre ma non è valida: l'ultima cifra è una cifra di controllo e non torna. Probabilmente è un errore di battitura — Dati azienda.");
    const azCf=pulita(az.cod_fiscale);
    if(azCf&&!/^(\d{11}|[A-Z0-9]{16})$/.test(azCf))
      m.push("Il tuo codice fiscale non ha una forma valida: 11 cifre per un'azienda, 16 caratteri per una persona — Dati azienda.");
    if(!(az.regime_fiscale||"").trim()) m.push("Manca il tuo regime fiscale — Dati azienda.");
    /* ===== 10 agosto 2026 — IVA a zero senza essere in forfettario =====
       Quando una voce ha l'aliquota 0 lo SDI pretende di sapere PERCHE'.
       Il file scrive sempre Natura N2.2 con la dicitura del regime forfettario:
       giusta per chi e' in forfettario, FALSA per un'impresa edile che mette lo
       zero per un altro motivo — tipicamente l'inversione contabile del
       subappalto edile, che vuole un codice diverso.
       Finche' non e' chiaro quale sia il caso, meglio fermarsi qui che mandare
       allo SDI un documento che dichiara una cosa non vera. */
    if(!forf && (R||[]).some(r=>(+r.iva||0)===0) && (R||[]).length){
      m.push("C'è una voce con IVA allo 0% ma tu non sei in regime forfettario. "
        +"Il file elettronico scriverebbe «operazione non soggetta — regime forfettario», "
        +"che nel tuo caso non è vero. Se è un'inversione contabile del subappalto edile "
        +"(o un altro caso di IVA non applicata) serve un codice diverso: sentiamo il "
        +"commercialista e lo aggiungiamo. Intanto il PDF puoi mandarlo, il file elettronico no.");
    }
    if(!(az.indirizzo||"").trim())   m.push("Manca la via della tua sede — Dati azienda.");
    if(!/^\d{5}$/.test((az.cap||"").trim()))  m.push("Il CAP della tua sede manca o non è di 5 cifre — Dati azienda.");
    if(!(az.citta||"").trim())       m.push("Manca la città della tua sede — Dati azienda.");
    if((az.prov||"").trim()&&!/^[A-Za-z]{2}$/.test((az.prov||"").trim()))
      m.push("La provincia della tua sede deve essere di 2 lettere, es. RI — Dati azienda.");
    /* Anche l'IBAN ha la sua prova del nove: si spostano le prime quattro
       lettere in fondo, si trasformano le lettere in numeri, e il numerone
       che viene fuori diviso 97 deve dare resto 1. Se una cifra è sbagliata
       il resto cambia. Meglio scoprirlo qui che con un bonifico perso. */
    const ibanOk=v=>{
      if(!/^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/.test(v))return false;
      const r=v.slice(4)+v.slice(0,4);
      let n="";
      for(const ch of r) n += (ch>="A"&&ch<="Z") ? String(ch.charCodeAt(0)-55) : ch;
      /* il numero è troppo lungo per una divisione normale: si divide a pezzi */
      let resto=0;
      for(const ch of n) resto=(resto*10+(+ch))%97;
      return resto===1;
    };
    const iban=pulita(az.iban);
    if(iban&&!/^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/.test(iban))
      m.push("L'IBAN non ha la forma di un IBAN italiano: IT, 2 cifre, 1 lettera e poi 22 caratteri, 27 in tutto — Dati azienda. Se lo lasci vuoto la fattura si fa lo stesso, senza i dati del bonifico.");
    else if(iban&&!ibanOk(iban))
      m.push("L'IBAN ha la forma giusta ma non è valido: la sua cifra di controllo non torna. C'è un carattere sbagliato — Dati azienda.");

    /* --- chi riceve: il cliente --- */
    if(!f.cliente_id)                m.push("La fattura non ha un cliente.");
    else{
      const piva=(f.cli_piva||cli.piva||"").trim();
      const cf  =(f.cli_cod_fiscale||cli.cod_fiscale||"").trim();
      const pP=pulita(piva), pC=pulita(cf);
      if(!pP&&!pC)                   m.push("Il cliente non ha né partita IVA né codice fiscale — apri la sua scheda in Clienti.");
      if(pP&&!/^\d{11}$/.test(pP))
        m.push("La partita IVA del cliente è di "+pP.length+" cifre invece di 11 — Clienti.");
      else if(pP&&!pivaOk(pP))
        m.push("La partita IVA del cliente ha 11 cifre ma non è valida: la cifra di controllo non torna. Ricontrollala — Clienti.");
      if(pC&&!/^(\d{11}|[A-Z0-9]{16})$/.test(pC))
        m.push("Il codice fiscale del cliente non ha una forma valida: 11 cifre per un condominio o un'azienda, 16 caratteri per un privato — Clienti.");
      if(!(f.cli_indirizzo||cli.indirizzo||"").trim()) m.push("Manca la via del cliente — Clienti.");
      if(!/^\d{5}$/.test((f.cli_cap||cli.cap||"").trim())) m.push("Il CAP del cliente manca o non è di 5 cifre — Clienti.");
      if(!(f.cli_citta||cli.citta||"").trim())          m.push("Manca la città del cliente — Clienti.");
      const prv=(f.cli_prov||cli.prov||"").trim();
      if(prv&&!/^[A-Za-z]{2}$/.test(prv)) m.push("La provincia del cliente deve essere di 2 lettere, es. RI — Clienti.");
      const sdi=(f.cli_sdi||cli.sdi_codice||"").trim();
      const pec=(f.cli_pec||cli.sdi_pec||"").trim();
      if(!sdi&&!pec)
        m.push("Il cliente non ha né codice destinatario né PEC. Se non li ha davvero, scrivi 0000000 nel codice destinatario: la fattura gli arriverà nel suo cassetto fiscale.");
      if(sdi&&sdi!=="0000000"&&sdi.length!==7)
        m.push("Il codice destinatario del cliente deve essere di 7 caratteri (o 0000000 se non ce l'ha).");
    }

    /* --- le righe --- */
    if(!R.length) m.push("La fattura non ha nessuna voce.");
    R.forEach((r,i)=>{
      if(!(r.descrizione||"").trim()) m.push("La voce n. "+(i+1)+" non ha descrizione.");
      if(!forf && (+r.iva||0)===0)
        m.push("La voce «"+xtaglia(r.descrizione,40)+"» ha IVA 0% ma tu non sei in regime forfettario. "
             + "Lo SDI in questo caso vuole sapere PERCHÉ non c'è IVA, e il gestionale non può indovinarlo. "
             + "Metti l'aliquota giusta, oppure chiedi al commercialista quale caso è.");
    });
    return m;
  }

  /* ---- il file ---- */
  function fattXmlCostruisci(f){
    const az=fattAzienda||{};
    const cli=fattCliCache.find(x=>String(x.id)===String(f.cliente_id))||{};
    const R=(fattRighe[f.id]||[]).slice().sort((a,b)=>(+a.ordine||0)-(+b.ordine||0));
    const forf=(f.regime_fiscale||az.regime_fiscale)==="RF19";
    const c=fattConti(f);

    /* ⚠️ 21 agosto 2026 — LA PARTITA IVA SI PULISCE ANCHE QUI, NON SOLO NEL
       CONTROLLO. fattXmlControlla valida con "pulita" (riga 1603), quindi
       "012.345.678.97" PASSA il controllo; poi qui dentro finiva nel file
       cosi' com'era, e lo SDI scarta: IdCodice vuole 11 cifre e basta.
       Il nome del file era gia' giusto (li' le cifre si estraevano a parte):
       il file si chiamava bene e dentro era sbagliato.
       Stessa pulizia del controllo: restano solo lettere e numeri. */
    const xpul=v=>String(v||"").replace(/[^0-9A-Za-z]/g,"").toUpperCase();

    const cPiva = xpul(f.cli_piva||cli.piva);
    const cCf   = xpul(f.cli_cod_fiscale||cli.cod_fiscale);
    const cSdi  =(f.cli_sdi||cli.sdi_codice||"").trim();
    const cPec  =(f.cli_pec||cli.sdi_pec||"").trim();
    const codDest = cSdi || "0000000";

    /* il progressivo dell'invio: identifica il file, non la fattura.
       Basta che sia diverso ogni volta e lungo al massimo 10 caratteri. */
    /* ⚠️ qui NON si puo' usare fattAnno cosi' com'e': se l'anno non si sa
       lui risponde «—», e nel progressivo del file elettronico ci vogliono
       cifre. Se manca davvero si usa l'anno della data, e in ultima
       spiaggia quello di oggi: il progressivo identifica l'INVIO, non la
       fattura, quindi non falsa nessun numero. */
    const _annoProg=(/^\d{4}$/.test(fattAnno(f))?fattAnno(f):String(new Date().getFullYear()));
    const prog=_annoProg.slice(2)+String(f.numero).padStart(5,"0");

    const sede=(o,pref)=>
        "        <Indirizzo>"+xesc(xtaglia(o[pref+"indirizzo"],60))+"</Indirizzo>\n"
      + "        <CAP>"+xesc((o[pref+"cap"]||"").trim())+"</CAP>\n"
      + "        <Comune>"+xesc(xtaglia(o[pref+"citta"],60))+"</Comune>\n"
      + ((o[pref+"prov"]||"").trim()?"        <Provincia>"+xesc(o[pref+"prov"].trim().toUpperCase())+"</Provincia>\n":"")
      + "        <Nazione>IT</Nazione>\n";

    /* i dati del cliente: quelli congelati nella fattura, se ci sono, altrimenti
       quelli dell'anagrafica di adesso */
    const cliDati={
      indirizzo:f.cli_indirizzo||cli.indirizzo||"",
      cap:f.cli_cap||cli.cap||"",
      citta:f.cli_citta||cli.citta||"",
      prov:f.cli_prov||cli.prov||"",
      nome:f.cli_nome||cli.nome||""
    };

    let x='<?xml version="1.0" encoding="UTF-8"?>\n';
    x+='<p:FatturaElettronica versione="FPR12"'
     + ' xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"'
     + ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"'
     + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
     + ' xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2'
     + ' http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2.2/Schema_del_file_xml_FatturaPA_versione_1.2.2.xsd">\n';

    /* ---- INTESTAZIONE ---- */
    x+='  <FatturaElettronicaHeader>\n';
    x+='    <DatiTrasmissione>\n';
    x+='      <IdTrasmittente>\n        <IdPaese>IT</IdPaese>\n        <IdCodice>'+xesc(xpul(az.piva))+'</IdCodice>\n      </IdTrasmittente>\n';
    x+='      <ProgressivoInvio>'+xesc(prog)+'</ProgressivoInvio>\n';
    x+='      <FormatoTrasmissione>FPR12</FormatoTrasmissione>\n';
    x+='      <CodiceDestinatario>'+xesc(codDest)+'</CodiceDestinatario>\n';
    /* la PEC si scrive solo quando il cliente non ha un codice destinatario:
       messa insieme al codice, lo SDI scarta il file */
    if(codDest==="0000000"&&cPec) x+='      <PECDestinatario>'+xesc(cPec)+'</PECDestinatario>\n';
    x+='    </DatiTrasmissione>\n';

    x+='    <CedentePrestatore>\n      <DatiAnagrafici>\n';
    x+='        <IdFiscaleIVA>\n          <IdPaese>IT</IdPaese>\n          <IdCodice>'+xesc(xpul(az.piva))+'</IdCodice>\n        </IdFiscaleIVA>\n';
    if(xpul(az.cod_fiscale)) x+='        <CodiceFiscale>'+xesc(xpul(az.cod_fiscale))+'</CodiceFiscale>\n';
    x+='        <Anagrafica>\n          <Denominazione>'+xesc(xtaglia(az.nome,80))+'</Denominazione>\n        </Anagrafica>\n';
    x+='        <RegimeFiscale>'+xesc(az.regime_fiscale||"RF01")+'</RegimeFiscale>\n';
    x+='      </DatiAnagrafici>\n      <Sede>\n'+sede(az,"")+'      </Sede>\n    </CedentePrestatore>\n';

    x+='    <CessionarioCommittente>\n      <DatiAnagrafici>\n';
    if(cPiva) x+='        <IdFiscaleIVA>\n          <IdPaese>IT</IdPaese>\n          <IdCodice>'+xesc(cPiva)+'</IdCodice>\n        </IdFiscaleIVA>\n';
    if(cCf)   x+='        <CodiceFiscale>'+xesc(cCf)+'</CodiceFiscale>\n';
    x+='        <Anagrafica>\n          <Denominazione>'+xesc(xtaglia(cliDati.nome,80))+'</Denominazione>\n        </Anagrafica>\n';
    x+='      </DatiAnagrafici>\n      <Sede>\n'+sede(cliDati,"")+'      </Sede>\n    </CessionarioCommittente>\n';
    x+='  </FatturaElettronicaHeader>\n';

    /* ---- CORPO ---- */
    x+='  <FatturaElettronicaBody>\n    <DatiGenerali>\n      <DatiGeneraliDocumento>\n';
    x+='        <TipoDocumento>'+(XML_TIPO[f.tipo]||"TD01")+'</TipoDocumento>\n';
    x+='        <Divisa>EUR</Divisa>\n';
    x+='        <Data>'+xesc(f.data)+'</Data>\n';
    x+='        <Numero>'+xesc(String(f.numero))+'</Numero>\n';
    /* l'ordine di questi blocchi non è a caso: lo schema li vuole cosi' */
    if(+f.ritenuta_perc){
      /* 9 agosto 2026 — RT01 = persona fisica, RT02 = persona giuridica.
         Era fisso a RT02: uno studio individuale (la gran parte dei tecnici)
         è persona fisica e il file usciva con il tipo sbagliato.
         Si distingue dal codice fiscale: 16 caratteri = persona fisica. */
      const _cfAz=String(az.cod_fiscale||"").replace(/\s/g,"");
      const _tipoRit=(_cfAz.length===16)?"RT01":(az.piva&&_cfAz===String(az.piva)?"RT02":"RT01");
      x+='        <DatiRitenuta>\n';
      x+='          <TipoRitenuta>'+_tipoRit+'</TipoRitenuta>\n';
      x+='          <ImportoRitenuta>'+xnum(c.ritenuta)+'</ImportoRitenuta>\n';
      x+='          <AliquotaRitenuta>'+xnum(f.ritenuta_perc)+'</AliquotaRitenuta>\n';
      x+='          <CausalePagamento>A</CausalePagamento>\n';
      x+='        </DatiRitenuta>\n';
    }
    /* ===== 12 agosto 2026 — BOLLO E CASSA ERANO INVERTITI =====
       Lo schema FatturaPA vuole questi blocchi in un ordine preciso:
           DatiRitenuta  ->  DatiBollo  ->  DatiCassaPrevidenziale
       Qui la cassa usciva PRIMA del bollo. Un architetto o un geometra con
       la cassa previdenziale E il bollo da 2 euro (il caso piu' comune fra
       i tecnici giovani, e per i forfettari il bollo e' obbligatorio sopra
       77,47 euro) si vedeva il file rifiutato dal validatore dell'Agenzia
       come non conforme allo schema — e nel gestionale non c'era niente che
       glielo dicesse. Il commento due righe sopra diceva gia' "l'ordine di
       questi blocchi non e' a caso": era vero, ed era sbagliato lo stesso. */
    if(+f.bollo){
      x+='        <DatiBollo>\n          <BolloVirtuale>SI</BolloVirtuale>\n          <ImportoBollo>'+xnum(f.bollo)+'</ImportoBollo>\n        </DatiBollo>\n';
    }
    /* la cassa previdenziale, con il codice della cassa.
       Va anche sommata all'imponibile del riepilogo IVA, più sotto. */
    /* ...e solo se la cassa e' rimasta davvero dentro l'imponibile: su una
       fattura azzerata dallo sconto l'imponibile va a zero, e dichiarare un
       contributo cassa che non sta in nessun imponibile e' un file che non
       torna. */
    if(+f.cassa_perc&&c.cassa&&c.imponibile>0){
      x+='        <DatiCassaPrevidenziale>\n';
      /* 12 agosto 2026 (sera) — qui c'era «f.cassa_tipo || "TC22"»: se la cassa
         non era scritta il file dichiarava allo SDI che era INPS, che per un
         geometra o un ingegnere e' FALSO. Adesso non si indovina: il controllo
         qui sopra (fattXmlControllo) blocca il file e chiede di scegliere. */
      x+='          <TipoCassa>'+xesc(f.cassa_tipo)+'</TipoCassa>\n';
      x+='          <AlCassa>'+xnum(f.cassa_perc)+'</AlCassa>\n';
      x+='          <ImportoContributoCassa>'+xnum(c.cassa)+'</ImportoContributoCassa>\n';
      x+='          <ImponibileCassa>'+xnum(c.compenso)+'</ImponibileCassa>\n';
      x+='          <AliquotaIVA>'+xnum(forf?0:c.aliqPrev)+'</AliquotaIVA>\n';
      if(forf)x+='          <Natura>N2.2</Natura>\n';
      x+='        </DatiCassaPrevidenziale>\n';
    }
    /* 12 agosto 2026 — lo sconto NON si dichiara qui, a livello di documento:
       lo dichiara ogni RIGA col suo <ScontoMaggiorazione> (piu' sotto), e i
       riepiloghi sono la somma di quelle righe gia' scontate. Cosi' il file e'
       coerente comunque lo si legga e non c'e' modo di contarlo due volte.
       (Fino a stanotte non era dichiarato da nessuna parte: le righe avevano il
       prezzo pieno e i riepiloghi l'imponibile scontato.) */
    /* qui va il valore del DOCUMENTO, non quello che incassi: lo SDI lo
       confronta con la somma di imponibile e imposta, e se ci sottrai la
       ritenuta il file viene segnalato. La ritenuta si toglie più sotto,
       nell'importo del pagamento. */
    x+='        <ImportoTotaleDocumento>'+xnum(c.totale)+'</ImportoTotaleDocumento>\n';
    if((f.note||"").trim()) x+='        <Causale>'+xesc(xtaglia(f.note,200))+'</Causale>\n';
    x+='      </DatiGeneraliDocumento>\n    </DatiGenerali>\n';

    x+='    <DatiBeniServizi>\n';
    R.forEach((r,i)=>{
      const al=forf?0:(+r.iva||0);
      /* la riga gia' scontata la calcola fattBasi, in un posto solo: qui non si
         rifa' il conto, se no le due copie prima o poi si scollano */
      const L=(c.linee&&c.linee[i])||{pieno:(+r.qta||0)*(+r.prezzo||0),sconto:0,
                                      totale:(+r.qta||0)*(+r.prezzo||0)};
      x+='      <DettaglioLinee>\n';
      x+='        <NumeroLinea>'+(i+1)+'</NumeroLinea>\n';
      x+='        <Descrizione>'+xesc(xtaglia(r.descrizione,1000))+'</Descrizione>\n';
      x+='        <Quantita>'+xqta(r.qta)+'</Quantita>\n';
      x+='        <PrezzoUnitario>'+xnum(r.prezzo)+'</PrezzoUnitario>\n';
      /* l'ordine dei campi dentro DettaglioLinee non e' libero: lo sconto sta
         fra PrezzoUnitario e PrezzoTotale, e PrezzoTotale deve essere
         quantita x prezzo MENO lo sconto, se no il file viene segnalato. */
      if(L.sconto>0){
        x+='        <ScontoMaggiorazione>\n';
        x+='          <Tipo>SC</Tipo>\n';
        x+='          <Importo>'+xnum(L.sconto)+'</Importo>\n';
        x+='        </ScontoMaggiorazione>\n';
      }
      x+='        <PrezzoTotale>'+xnum(L.totale)+'</PrezzoTotale>\n';
      x+='        <AliquotaIVA>'+xnum(al)+'</AliquotaIVA>\n';
      /* quando l'IVA è zero lo SDI vuole sapere perché: in forfettario è
         il codice N2.2, "operazione non soggetta" */
      if(al===0) x+='        <Natura>N2.2</Natura>\n';
      x+='      </DettaglioLinee>\n';
    });
    /* ===== 13 agosto 2026 — LE SPESE ADESSO SONO RIGHE =====
       Cassa a parte (che ha il suo blocco), tutto quello che sta dentro
       l'imponibile deve avere una riga che lo dichiari: se no chi somma le
       righe trova dei soldi che non tornano e non sa da dove escono. Le spese
       stavano solo dentro il riepilogo: 150 € inspiegati su ogni parcella.
       E una parcella di sole spese generava un DatiBeniServizi senza nemmeno
       una riga, che lo schema non accetta proprio. */
    let _nl=R.length;
    const _rigaExtra=function(desc,imp,al,nat){
      _nl++;
      x+='      <DettaglioLinee>\n';
      x+='        <NumeroLinea>'+_nl+'</NumeroLinea>\n';
      x+='        <Descrizione>'+xesc(xtaglia(desc,1000))+'</Descrizione>\n';
      x+='        <Quantita>1.00</Quantita>\n';
      x+='        <PrezzoUnitario>'+xnum(imp)+'</PrezzoUnitario>\n';
      x+='        <PrezzoTotale>'+xnum(imp)+'</PrezzoTotale>\n';
      x+='        <AliquotaIVA>'+xnum(al)+'</AliquotaIVA>\n';
      if(nat) x+='        <Natura>'+nat+'</Natura>\n';
      x+='      </DettaglioLinee>\n';
    };
    if(c.speseIva)_rigaExtra("Rimborso spese inerenti l'incarico",c.speseIva,forf?0:c.aliqPrev,forf?"N2.2":"");
    /* sulle fatture vecchie uno sconto piu' grande delle righe veniva tolto
       dalla parte cassa+spese: la riga qui va scritta al netto di quell'avanzo,
       se no dichiara piu' di quello che sta nel riepilogo. Sulle fatture nuove
       scResto e' sempre zero, perche' li' lo sconto si ferma al compenso. */
    const _speseRiga=Math.max(0,(+c.spese||0)-(+c.scResto||0));
    if(_speseRiga)_rigaExtra(c.art15
                    ?"Spese anticipate in nome e per conto del cliente ex art. 15 DPR 633/72"
                    :"Spese documentate",
                  _speseRiga, c.art15?0:(forf?0:c.aliqPrev), c.art15?"N1":(forf?"N2.2":""));
    /* I riepiloghi arrivano da fattConti (fattBasi), che ha gia' fatto due
       cose: messo cassa e spese sull'aliquota giusta (la cassa e il rimborso
       su quella che comanda, le spese anticipate fuori campo) e tolto lo sconto
       riga per riga. Sono gli STESSI numeri che il cliente legge sul PDF, e la
       loro somma e' esattamente ImportoTotaleDocumento meno il bollo. */
    (c.righeIva||[]).forEach(ri=>{
      const al=ri.aliquota, nat=ri.natura||"";
      x+='      <DatiRiepilogo>\n';
      x+='        <AliquotaIVA>'+xnum(al)+'</AliquotaIVA>\n';
      if(nat) x+='        <Natura>'+nat+'</Natura>\n';
      x+='        <ImponibileImporto>'+xnum(ri.imponibile)+'</ImponibileImporto>\n';
      x+='        <Imposta>'+xnum(ri.imposta)+'</Imposta>\n';
      x+='        <EsigibilitaIVA>I</EsigibilitaIVA>\n';
      if(nat==="N2.2") x+='        <RiferimentoNormativo>Operazione non soggetta a IVA ai sensi dell\'art. 1, commi 54-89, L. 190/2014 - regime forfettario</RiferimentoNormativo>\n';
      if(nat==="N1")   x+='        <RiferimentoNormativo>Spese anticipate in nome e per conto del cliente - escluse ex art. 15, comma 1, n. 3, DPR 633/72</RiferimentoNormativo>\n';
      x+='      </DatiRiepilogo>\n';
    });
    x+='    </DatiBeniServizi>\n';

    if((az.iban||"").trim()){
      const gg=(+az.giorni_pagamento)||30;
      x+='    <DatiPagamento>\n      <CondizioniPagamento>TP02</CondizioniPagamento>\n';
      x+='      <DettaglioPagamento>\n';
      x+='        <ModalitaPagamento>MP05</ModalitaPagamento>\n';
      x+='        <DataScadenzaPagamento>'+xesc(_giorniDopo(f.data,gg))+'</DataScadenzaPagamento>\n';
      /* mai negativo: su una fattura vecchia azzerata dallo sconto la ritenuta
         e' calcolata sul lordo e supera il documento. Il totale non si tocca
         (e' gia' stato mandato allo SDI cosi'), ma un importo da pagare sotto
         zero e' comunque una cosa che non esiste. */
      x+='        <ImportoPagamento>'+xnum(Math.max(0,c.daPagare))+'</ImportoPagamento>\n';
      x+='        <IBAN>'+xesc(az.iban.replace(/\s+/g,"").toUpperCase())+'</IBAN>\n';
      x+='      </DettaglioPagamento>\n    </DatiPagamento>\n';
    }

    x+='  </FatturaElettronicaBody>\n</p:FatturaElettronica>\n';
    return {xml:x, nome:"IT"+String(az.piva||"").replace(/\D/g,"")+"_"+prog+".xml"};
  }

  async function fatturaXml(id){
    const f=fattCache.find(x=>String(x.id)===String(id));
    if(!f){toast("Fattura non trovata");return;}
    const mancano=fattXmlControllo(f);
    if(mancano.length){
      openSheetGrande("Non posso ancora fare il file per lo SDI",
        '<div class="sh-b"><div class="sh-tit">Cosa manca</div>'
        + '<div class="sh-nota">Lo SDI rifiuta la fattura se anche una sola di queste cose non c\'è. Meglio saperlo adesso che fra una settimana.</div>'
        + '<ul class="xml-manca">'+mancano.map(m=>"<li>"+esc(m)+"</li>").join("")+'</ul>'
        + '</div>',
        '<button class="btn b-cancel" data-action="close">Ho capito</button>');
      return;
    }
    const {xml,nome}=fattXmlCostruisci(f);
    /* scarico il file senza passare da nessun server: resta tutto sul tuo computer */
    const blob=new Blob([xml],{type:"application/xml;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=nome;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
    toast("File XML scaricato ✅ — passalo dal validatore prima di mandarlo");
  }
