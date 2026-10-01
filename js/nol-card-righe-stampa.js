// [SPOSTATO] nol-card-righe-stampa.js: era dentro nol-core.js, righe 1052-1465, spostato identico.

  /* ================================================================
     LE SCHEDE A TUTTA PAGINA — 22 agosto 2026
     Stesso stampo del resto del gestionale: openSheet() + i due pulsanti
     in fondo. Gli id delle caselle sono rimasti quelli di prima, cosi' il
     conto del noleggio continua a leggerle senza sapere che sono altrove.
     ================================================================ */

  /* ================================================================
     I PULSANTI DI OGNI SCHEDA — 22 agosto 2026
     Modifica · Copia · PDF · Stampa · Elimina, gli stessi su Mezzi,
     Clienti e Noleggi. Una funzione sola li disegna e una sola li
     esegue: se domani se ne aggiunge uno, si aggiunge in un punto.
     ================================================================ */
  /* ⛔ 22 agosto 2026, deciso da Alessio: SULLA RIGA SOLO «APRI».
     Le cinque funzioni stanno DENTRO la scheda, non sparse sull'elenco: un
     elenco con cinque pulsanti per riga, con dieci mezzi, sono cinquanta
     pulsanti su una schermata e non si trova piu' niente. */
  /* ================================================================
     ⛔ 24 agosto 2026 (sera) — UNA SOLA FUNZIONE PER TUTTE LE SCHEDE
     ================================================================
     Le schede degli elenchi (Clienti, Mezzi, Noleggi, Prodotti, Magazzino,
     Fornitori, Movimenti, Calendario, Fatture, Cauzioni, Contratti e
     documenti, Foto e video, Cestino, Rendimento, e le due fasce del
     Riepilogo) erano scritte a mano in DICIOTTO punti diversi del file,
     ognuna col colore della barra scritto a mano dentro l'attributo style.
     Cambiare la forma voleva dire trovarli tutti e diciotto e non
     dimenticarne nessuno.

     Adesso il disegno sta QUI, in un posto solo. Chi disegna un elenco dice
     COSA c'e' nella scheda; COM'E' FATTA lo decide questa funzione.

     o = {
       titolo    il nome in grassetto in cima
       eti       le pastiglie di stato: [{t:"IN RITARDO", col:"#c62828"}]
       testa     al posto di titolo+eti, quando la riga in cima e' fatta a
                 modo suo (il Magazzino ha il numerone a destra)
       corpo     le righe sotto, gia' pronte in HTML
       pulsanti  di solito nolPulsanti("mezzo", id)
       cls       classi in piu' sulla scheda (le righe del Calendario)
     }

     ⛔ IL COLORE STA SOLO DOVE C'E' ANCHE LA PAROLA. La pastiglia resta
     colorata («IN RITARDO», «PAGATA»): li' il colore accompagna un testo, e
     chi non distingue rosso e verde legge comunque. La barra sopra la scheda
     invece e' sparita: era colore senza parola, e con dodici sezioni accese
     faceva una pagina a scacchi. E' la stessa regola che Alessio ha gia'
     scelto il 21 agosto per il gestionale imprese («LE STRISCE DELLE SEZIONI
     DIVENTANO NEUTRE», in css/gestionale.css).
     ⚠️ `col` si continua a passare e si continua a usare: e' il colore della
     pastiglia, non piu' quello della barra.
     ================================================================ */
  function nolCard(o){
    o=o||{};
    const testa = (o.testa!=null)
      ? o.testa
      : '<strong>'+(o.titolo!=null?o.titolo:"")+'</strong>'
        +(o.eti||[]).filter(Boolean).map(e=>
            '<span class="nol-eti" style="--c:'+(e.col||o.col||"#475569")+'">'+e.t+'</span>').join("");
    return '<div class="nol-card'+(o.cls?" "+o.cls:"")+'">'
         +   '<div class="tit">'+testa+'</div>'
         +   (o.corpo||"")
         +   (o.pulsanti||"")
         + '</div>';
  }

  function nolPulsanti(tipo,id){
    return `<div class="nol-azioni">
      <button class="nol-az nol-az-apri" data-action="nol-mod" data-t="${tipo}" data-id="${id}">Apri</button>
    </div>`;
  }

  /* Gli stessi pulsanti anche DENTRO la scheda aperta: chi sta guardando un
     mezzo o un noleggio deve poterlo stampare, farne il PDF, copiarlo o
     buttarlo da li', senza chiuderlo e ritrovare la riga nell'elenco.
     "Modifica" qui non c'e': ci sei gia' dentro. */
  /* «quali» serve per la Giornata del calendario: un giorno non si copia e
     non si elimina, ma si stampa e si porta in PDF come tutto il resto. */
  function nolPulsantiScheda(tipo,id,quali){
    if(!id) return "";
    const tutti=[["nol-copia","Copia",""],["nol-pdf","PDF",""],
                 ["nol-stampa","Stampa",""],["nol-elim","Elimina"," nol-az-rosso"]];
    const usa=quali&&quali.length?tutti.filter(x=>quali.indexOf(x[0])>=0):tutti;
    return `<div class="nol-azioni nol-azioni-scheda">${usa.map(x=>
      `<button class="nol-az${x[2]}" data-action="${x[0]}" data-t="${tipo}" data-id="${id}">${x[1]}</button>`
    ).join("")}</div>`;
  }

  const NOL_TIPI={
    mezzo:  {tab:"gest_mezzi",  che:"Mezzo",   ricarica:()=>loadMezzi(),      scheda:d=>schedaMezzo(d)},
    cliente:{tab:"gest_clienti",che:"Cliente", ricarica:()=>loadClientiNol(), scheda:d=>schedaClienteNol(d)},
    noleggio:{tab:"nol_noleggi",che:"Noleggio",ricarica:()=>loadNoleggi(),    scheda:d=>schedaNoleggio(d)},
    prodotto:{tab:"neg_prodotti", che:"Prodotto", ricarica:()=>loadProdotti(),  scheda:d=>schedaProdotto(d)},
    fornitore:{tab:"neg_fornitori",che:"Fornitore",ricarica:()=>loadFornitori(),scheda:d=>schedaFornitore(d)},
    movimento:{tab:"neg_movimenti",che:"Movimento",ricarica:()=>loadMovimenti(),scheda:d=>schedaMovimento(d)},
    /* Magazzino guarda la stessa tabella dei Prodotti, ma da un'altra
       finestra: qui interessa solo quanto ce n'e' e quando riordinare. */
    magazzino:{tab:"neg_prodotti",che:"Giacenza",femm:true,ricarica:()=>loadMagazzino(),scheda:d=>schedaMagazzino(d),
               avviso:"Sparisce il prodotto dal catalogo, non solo la giacenza."},
    /* La fattura e' la stessa riga del lavoro: qui si guarda il lato soldi.
       «avviso» esce nella domanda prima di eliminare, perche' buttare la
       fattura vuol dire buttare anche il lavoro che c'e' sotto. */
    fattura:{tab:"gest_lavori",che:"Fattura",femm:true,ricarica:()=>{renderFatture();renderCal();},
             scheda:d=>schedaFattura(d),
             avviso:"Sparisce anche il lavoro collegato."},
    /* «media» serve solo a far funzionare «Apri» sull'elenco delle foto:
       la sua scheda non ha ne' Copia ne' Elimina, quindi da qui non si
       puo' cancellare un noleggio per sbaglio. */
    media:{tab:"nol_noleggi",che:"Foto e video",ricarica:()=>loadMedia(),scheda:d=>schedaMedia(d)},
    /* La cauzione e' un pezzo del noleggio, non una riga a parte: si apre la
       scheda del noleggio, dove c'e' il riquadro. Il foglio che si stampa da
       qui, pero', parla solo di soldi in deposito. */
    cauzione:{tab:"nol_noleggi",che:"Cauzione",femm:true,ricarica:()=>loadCauzioni(),
              scheda:d=>schedaNoleggio(d),
              avviso:"Sparisce tutto il noleggio, non solo la cauzione."},
    /* la fattura del noleggio: una riga sua, in una tabella sua */
    fattnol:{tab:"nol_fatture",che:"Fattura",femm:true,ricarica:()=>loadFattureNol(),
             scheda:d=>schedaFatturaNol(d),
             avviso:"I noleggi che ci sono dentro tornano da fatturare."},
    documenti:{tab:"nol_noleggi",che:"Documenti",ricarica:()=>loadDocumenti(),scheda:d=>schedaDocumenti(d)},
    /* La giornata non e' una riga del database: e' quello che succede in un
       giorno. Ha un suo lettore, e si stampa come tutto il resto. */
    giornata:{che:"Giornata", ricarica:()=>renderCal(), scheda:d=>apriGiornata(d.id),
              leggi:ds=>leggiGiornata(ds)}
  };

  async function nolLeggi(tipo,id){
    const t=NOL_TIPI[tipo]; if(!t) return null;
    if(t.leggi) return await t.leggi(id);
    if(!sb) return null;
    const {data}=await sb.from(t.tab).select("*").eq("id",id).single();
    return data||null;
  }

  /* ── le cauzioni, le parole ── (23 agosto 2026)
     Scritte una volta sola: le usano la scheda, l'elenco, la ricevuta e la
     quietanza. Se domani si aggiunge una forma, si aggiunge qui e compare
     in tutti e quattro. */
  const CAU_FORMA={contanti:"Contanti",assegno:"Assegno",bonifico:"Bonifico",
                   carta:"Preautorizzazione su carta",fideiussione:"Fideiussione"};
  const CAU_STATO={nessuna:"Nessuna cauzione",in_deposito:"In deposito",svincolata:"Svincolata"};
  /* lo stato vero di una cauzione: quello scritto, o quello che si capisce
     dai numeri per i noleggi salvati prima che questa parte esistesse */
  function cauStatoDi(n){
    if(n.cauzione_stato&&CAU_STATO[n.cauzione_stato]) return n.cauzione_stato;
    return (+n.cauzione||0)>0 ? "in_deposito" : "nessuna";
  }
  /* ⛔ da svincolare = il mezzo e' tornato ma i soldi no. E' la lista di
     lavoro: sono le telefonate che il cliente ti fa se te ne dimentichi. */
  function cauDaSvincolare(n){
    return cauStatoDi(n)==="in_deposito" && !!n.data_rientro_effettivo;
  }

  /* le righe da mettere sul foglio: etichetta e valore, niente colonne vuote */
  function nolRighe(tipo,d){
    const e=(x)=>x==null||x===""?null:String(x);
    const soldi=(x)=>(x==null||x==="")?null:_eur(_numIt(x));
    let r=[];
    if(tipo==="mezzo") r=[
      ["Nome",e(d.nome)],["Codice / matricola",e(d.codice)],["Tipo",e(d.tipo)],
      ["Stato",e(d.stato)],
      ["Tariffa a ora",soldi(d.tariffa_ora)],["Tariffa al giorno",soldi(d.tariffa_giorno)],
      ["Tariffa a settimana",soldi(d.tariffa_settimana)],["Tariffa al mese",soldi(d.tariffa_mese)],
      ["Ore comprese al giorno",d.ha_contaore?e(d.ore_incluse_giorno):null],
      ["Ogni ora in più",d.ha_contaore?soldi(d.tariffa_ora_extra):null],
      ["Km compresi al giorno",d.ha_contakm?e(d.km_inclusi_giorno):null],
      ["Ogni km in più",d.ha_contakm?soldi(d.tariffa_km):null],
      ["Usura, quota fissa",soldi(d.usura_fissa)],
      ["Usura, % sul tempo",d.usura_percento?d.usura_percento+"%":null],
      ["Cauzione",soldi(d.cauzione)],["Note",e(d.note)]];
    if(tipo==="cliente") r=[
      ["Nome",e(d.nome)],["Telefono",e(d.telefono)],["Email",e(d.email)],
      ["Indirizzo",e(d.indirizzo)],["P.IVA / Cod. Fiscale",e(d.piva)],["Note",e(d.note)]];
    if(tipo==="noleggio"){
      /* ⛔ 28 agosto 2026 — le date si scrivono all'italiana anche qui.
         Nel Cestino uscivano grezze («2026-08-08») mentre due righe sopra,
         sullo stesso foglio, c'era scritto «buttato il 28/08/2026». */
      const dat=(x)=>x==null||x===""?null:fdate(x);
      r=[["Mezzo",e(d.mezzo)],["Cliente",e(d.cliente)],
         ["Uscita",dat(d.data_uscita)==null?null:dat(d.data_uscita)+(d.ora_uscita?" alle "+String(d.ora_uscita).slice(0,5):"")],
         ["Rientro previsto",dat(d.data_rientro_prevista)],
         ["Rientro effettivo",dat(d.data_rientro_effettivo)],
         ["Contaore uscita",e(d.contaore_uscita)],["Contaore rientro",e(d.contaore_rientro)],
         ["Km uscita",e(d.km_uscita)],["Km rientro",e(d.km_rientro)]];
      const dp=d.dettaglio_prezzo;
      if(dp&&Array.isArray(dp.righe)) dp.righe.forEach(x=>r.push([x.voce+"  ("+x.dettaglio+")",_eur(x.importo)]));
      r.push(["IMPORTO",soldi(d.importo)]);
      r.push(["Cauzione (deposito, a parte)",soldi(d.cauzione)]);
      r.push(["Cauzione, in che forma",CAU_FORMA[d.cauzione_forma]||null]);
      r.push(["Cauzione, stato",(+d.cauzione||0)>0?CAU_STATO[cauStatoDi(d)]:null]);
      r.push(["Pagamento",d.stato_pagamento==="pagato"?"Pagato":"Da pagare"]);
      r.push(["Danni",e(d.danni)]);
      r.push(["Tipo di noleggio",d.tipo_nolo==="caldo"?"A caldo (con operatore)":"A freddo (senza operatore)"]);
      r.push(["Contratto",d.contratto_num?("n. "+d.contratto_num+(d.contratto_data?" del "+fdate(d.contratto_data):"")):null]);
      (Array.isArray(d.operatori)?d.operatori:[]).forEach((o,i)=>
        r.push(["Chi la usa "+(i+1),[o.nome,o.cf,o.abil,o.scad?"scade "+fdate(o.scad):""].filter(Boolean).join(" · ")]));
      r.push(["Com'era alla consegna",e(d.stato_consegna)]);
      r.push(["Com'è tornato",e(d.stato_rientro)]);
      r.push(["Note",e(d.note)]);
    }
    if(tipo==="prodotto") r=[
      ["Nome",e(d.nome)],["Codice",e(d.codice)],["Categoria",e(d.categoria)],
      ["Unità di misura",e(d.unita)],["Quantità in magazzino",e(d.quantita)],
      ["Scorta minima",e(d.soglia_minima)],
      ["Prezzo di acquisto",soldi(d.prezzo_acquisto)],["Prezzo di vendita",soldi(d.prezzo)],
      ["IVA",d.iva_perc==null?null:d.iva_perc+"%"],["Note",e(d.note)]];
    if(tipo==="magazzino"){
      const q=+(d.quantita||0), s=+(d.soglia_minima||0), pz=+(d.prezzo||0);
      r=[["Prodotto",e(d.nome)],["Codice",e(d.codice)],["Unità di misura",e(d.unita)],
         ["Quantità in magazzino",String(d.quantita??0)],
         ["Scorta minima",String(d.soglia_minima??0)],
         ["Situazione",q<=s?"SOTTO SCORTA — da riordinare":"a posto"],
         ["Valore della giacenza",pz?_eur(q*pz):null]];
    }
    if(tipo==="fattura"){
      r=[["Oggetto",e(d.descrizione)],["Dove",e(d.dove)],
         ["Data del lavoro",d.data_fatto||d.data_prevista?fdate(d.data_fatto||d.data_prevista):null],
         ["Stato del lavoro",statoLabel[d.stato]||e(d.stato)],
         ["Stato della fattura",FATT_ETICHETTA[d.fatt_stato||"none"]],
         ["Importo",soldi(d.importo)],["Ore lavorate",e(d.ore)],["Note",e(d.note)]];
    }
    if(tipo==="giornata"){
      r=[["Giorno",fdate(d.id)]];
      const gruppo=(et,lista,come)=>{
        if(!lista||!lista.length){r.push([et,"nessuno"]);return;}
        r.push([et,String(lista.length)]);
        lista.forEach(x=>r.push(["   ·",come(x)]));
      };
      gruppo("Escono oggi",d.escono,x=>(nolFaseDi(x)==="prenotato"?"[prenotato] ":"")+(x.mezzo||"mezzo")+" → "+(x.cliente||"cliente")+
        (x.data_rientro_prevista?"  (rientro previsto "+fdate(x.data_rientro_prevista)+")":""));
      gruppo("Rientri previsti oggi",d.rientrano,x=>(x.mezzo||"mezzo")+" da "+(x.cliente||"cliente"));
      gruppo("Ancora fuori, in ritardo",d.ritardi,x=>(x.mezzo||"mezzo")+" da "+(x.cliente||"cliente")+
        "  (doveva rientrare il "+fdate(x.data_rientro_prevista)+")");
      gruppo("Lavori",d.lavori,x=>(x.descrizione||"(senza descrizione)")+
        "  ["+(statoLabel[x.stato]||x.stato||"")+"]");
      if(d.nota) r.push(["Nota del giorno",e(d.nota)]);
    }
    if(tipo==="cauzione"){
      const st=cauStatoDi(d);
      r=[["Cliente",e(d.cliente)],["Mezzo",e(d.mezzo)],
         ["Contratto",d.contratto_num?("n. "+d.contratto_num):null],
         ["Importo della cauzione",soldi(d.cauzione)],
         ["In che forma",CAU_FORMA[d.cauzione_forma]||null],
         ["Riferimento",e(d.cauzione_rif)],
         ["Ricevuta il",d.cauzione_ricevuta_il?fdate(d.cauzione_ricevuta_il):null],
         ["Stato",CAU_STATO[st]],
         ["Mezzo rientrato il",d.data_rientro_effettivo?fdate(d.data_rientro_effettivo):null]];
      if(st==="svincolata"){
        r.push(["Svincolata il",d.cauzione_svincolata_il?fdate(d.cauzione_svincolata_il):null]);
        r.push(["Trattenuto per danni",soldi(d.cauzione_trattenuta)]);
        r.push(["Restituito al cliente",soldi(d.cauzione_restituita)]);
        r.push(["Perché è stato trattenuto",e(d.cauzione_motivo)]);
      } else if(cauDaSvincolare(d)){
        r.push(["Da fare","Il mezzo è rientrato: questa cauzione va svincolata."]);
      }
    }
    if(tipo==="fattnol"){
      r=[["Numero",d.numero?"n. "+d.numero:null],
         ["Data",d.data?fdate(d.data):null],
         ["Cliente",e(d.cliente)],
         ["Periodo",(d.periodo_dal&&d.periodo_al)?(fdate(d.periodo_dal)+" — "+fdate(d.periodo_al)):null],
         ["Stato",FATTNOL_ETI[d.stato||"bozza"]]];
      (Array.isArray(d.righe)?d.righe:[]).forEach(x=>
        r.push([x.voce+(x.dettaglio?"  ("+x.dettaglio+")":""),_eur(x.importo)]));
      r.push(["Imponibile",soldi(d.imponibile)]);
      r.push(["IVA "+(d.iva_perc==null?22:d.iva_perc)+"%",soldi(d.iva)]);
      r.push(["TOTALE",soldi(d.totale)]);
      r.push(["Pagata il",d.pagata_il?fdate(d.pagata_il):null]);
      r.push(["Note",e(d.note)]);
    }
    if(tipo==="media") r=[
      ["Tipo",d.genere==="video"?"Video":"Foto"],
      ["Momento",d.momento==="rientro"?"Al rientro":"Alla consegna"],
      ["Nome del file",e(d.nome_file)],
      ["Peso",d.byte?mediaPeso(d.byte):null],
      ["Nota",e(d.nota)]];
    if(tipo==="fornitore") r=[
      ["Nome",e(d.nome)],["Telefono",e(d.telefono)],["Email",e(d.email)],
      ["Indirizzo",e(d.indirizzo)],["P.IVA",e(d.piva)],["Note",e(d.note)]];
    if(tipo==="movimento") r=[
      ["Tipo",e(d.tipo)],["Prodotto",e(d.prodotto)],["Quantità",e(d.quantita)],
      ["Importo",soldi(d.importo)],["Cliente o fornitore",e(d.controparte)],
      ["Data",e(d.data_mov)],["Note",e(d.note)]];
    return r.filter(x=>x[1]!=null&&x[1]!=="");
  }

  function nolTitolo(tipo,d){
    if(tipo==="giornata") return "Giornata — "+fdate(d.id);
    /* la stessa riga e' un lavoro finche' non ha un importo: chiamarla
       «fattura» quando non c'e' niente da incassare confonde e basta */
    if(tipo==="fattura")  return (+d.importo>0?"Fattura — ":"Lavoro — ")+(d.descrizione||"senza oggetto");
    if(tipo==="magazzino")return "Magazzino — "+(d.nome||"prodotto");
    return (NOL_TIPI[tipo]?NOL_TIPI[tipo].che:"Scheda")+" — "+
           (d.nome||[d.mezzo,d.cliente].filter(Boolean).join(" · ")||"senza nome");
  }

  /* ---- STAMPA: una finestra pulita, senza il resto della pagina ---- */
  function nolStampa(tipo,d){
    const righe=nolRighe(tipo,d);
    const az=(state.azienda&&state.azienda.nome)?state.azienda.nome:"";
    const w=window.open("","_blank","width=900,height=1000");
    if(!w){toast("Il browser ha bloccato la finestra di stampa");return;}
    w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8">
      <title>${esc(nolTitolo(tipo,d))}</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222;margin:32px;font-size:15px}
      h1{font-size:22px;margin:0 0 4px}
      .az{color:#666;font-size:14px;margin-bottom:18px}
      table{width:100%;border-collapse:collapse}
      td{padding:8px 0;border-bottom:1px solid #eee;vertical-align:top}
      td.l{color:#666;width:42%}
      td.v{font-weight:600}
      </style><style>
/* 22 set 2026 — le icone disegnate al posto delle faccine.
   Dentro una frase: grandi come la riga e dello stesso colore del testo.
   Da sole in un riquadro (le schede delle guide, i due banner): grandi
   quanto era la faccina e del colore della scheda — blu, o arancione
   dove la scheda e' arancione. */
.ti-ic{width:1.1em;height:1.1em;vertical-align:-.18em;display:inline-block;flex:none}
.ti-ic-solo{width:1em;height:1em;vertical-align:-.08em;color:var(--hc,#0066ff)}
</style>
</head><body>
      <h1>${esc(nolTitolo(tipo,d))}</h1>
      <div class="az">${esc(az)}</div>
      <table>${righe.map(x=>`<tr><td class="l">${esc(x[0])}</td><td class="v">${esc(x[1])}</td></tr>`).join("")}</table>
      </body></html>`);
    w.document.close();
    /* si aspetta che la finestra abbia finito di disegnarsi: senza, su
       Chrome la stampa parte su una pagina ancora bianca */
    w.onload=()=>{w.focus();w.print();};
    setTimeout(()=>{try{w.focus();w.print();}catch(e){}},350);
  }

  /* ---- PDF: la stessa scheda, ma da tenere ---- */
  function nolPdf(tipo,d){
    if(!(window.jspdf&&window.jspdf.jsPDF)){toast("Il PDF non è disponibile adesso");return;}
    const righe=nolRighe(tipo,d);
    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    const M=18, R=210-M; let y=22;
    const az=(state.azienda&&state.azienda.nome)?state.azienda.nome:"";
    doc.setFont("helvetica","bold");doc.setFontSize(16);
    doc.text(nolTitolo(tipo,d),M,y); y+=7;
    if(az){doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(110);doc.text(az,M,y);y+=6;}
    doc.setTextColor(30); y+=2;
    righe.forEach(x=>{
      if(y>272){doc.addPage();y=22;}
      doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(110);
      doc.text(String(x[0]),M,y);
      doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(30);
      /* il valore va a destra, e se e' lungo va a capo invece di uscire dal foglio */
      const linee=doc.splitTextToSize(String(x[1]),R-M-72);
      doc.text(linee,M+72,y);
      y+=Math.max(7,linee.length*5.5);
      doc.setDrawColor(230);doc.line(M,y-3,R,y-3);
    });
    const nome=nolTitolo(tipo,d).replace(/[^a-zA-Z0-9 _-]/g,"").replace(/\s+/g,"-");
    doc.save(nome+".pdf");
  }

  /* ---- COPIA: lo stesso, con "(copia)" nel nome ---- */
  async function nolCopia(tipo,d){
    const t=NOL_TIPI[tipo]; if(!t||!t.tab||!sbUid) return;
    const nuovo=Object.assign({},d);
    /* ⚠️ via l'id e la data di creazione: se restassero, il database
       rifiuterebbe la riga nuova perche' quell'id esiste gia'. */
    delete nuovo.id; delete nuovo.created_at;
    nuovo.user_id=sbUid;
    if(nuovo.nome) nuovo.nome=nuovo.nome+" (copia)";
    if(tipo==="noleggio"){ nuovo.data_rientro_effettivo=null; nuovo.stato_pagamento="da_pagare"; }
    /* la copia di una fattura nasce da fatturare, se no si incassa due volte */
    if(tipo==="fattura"){ nuovo.descrizione=(nuovo.descrizione||"Lavoro")+" (copia)";
                          nuovo.fatt_stato="none"; }
    const {error}=await sb.from(t.tab).insert(nuovo);
    if(error){toast("Errore: "+error.message);return;}
    t.ricarica(); renderRiepilogoNegozio(); toast(t.che+(t.femm?" copiata ✔":" copiato ✔"));
  }

  /* ---- ELIMINA ---- */
  async function nolElimina(tipo,d){
    const t=NOL_TIPI[tipo]; if(!t||!t.tab) return;
    /* 29/09/2026 — una fattura gia' partita allo SDI esiste per il Fisco: non si butta */
    if(tipo==="fattnol"&&d.sdi_uuid&&d.sdi_stato!=="scartata"){toast("Questa fattura è già partita allo SDI: non si elimina. Per correggerla serve una nota di credito.");return;}
    const come=d.nome||d.descrizione||d.mezzo||"questa scheda";
    if(!confirm("Eliminare "+t.che.toLowerCase()+" «"+come+"»?\n"+
                (t.avviso?t.avviso+"\n":"")+cestFrase())) return;
    const {error}=await sb.from(t.tab).delete().eq("id",d.id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    t.ricarica(); renderRiepilogoNegozio(); toast(t.che+(t.femm?" eliminata":" eliminato"));
  }

  /* un gestore solo per tutti e cinque i pulsanti, di tutte e tre le schede */
  /* ⛔ 24 agosto 2026 — QUESTO GESTORE PRENDEVA ANCHE ROBA NON SUA.
     Cerca ogni bottone che comincia per «nol-», e sotto quel nome ci
     stanno anche «nol-contr-pdf», «nol-contr-stampa», «nol-cauz-pdf» e
     «nol-cauz-stampa», che sono di un altro gestore e non hanno il
     data-t. Risultato: ogni volta che si stampava un contratto, una
     ricevuta o una quietanza compariva il messaggio nero «Questa scheda
     non si trova più» — un errore che non c'era. Il foglio usciva lo
     stesso, ma chi legge quel messaggio non si fida più del gestionale.
     Adesso il gestore prende SOLO i suoi cinque pulsanti. */
  const NOL_PULSANTI_SCHEDA=["nol-mod","nol-copia","nol-pdf","nol-stampa","nol-elim"];
  document.addEventListener("click",async e=>{
    const b=e.target.closest('[data-action^="nol-"]'); if(!b) return;
    const tipo=b.dataset.t, id=b.dataset.id, a=b.dataset.action;
    if(NOL_PULSANTI_SCHEDA.indexOf(a)<0) return;
    const d=await nolLeggi(tipo,id);
    if(!d){toast("Questa scheda non si trova più");return;}
    if(a==="nol-mod")    return NOL_TIPI[tipo].scheda(d);
    if(a==="nol-copia")  return nolCopia(tipo,d);
    /* la fattura ha gia' il suo PDF vero — intestazione, numero, cliente,
       IBAN — e non va sostituito con l'elenco etichetta/valore */
    if(a==="nol-pdf")    return tipo==="fattura"?generaPdf(d.id):nolPdf(tipo,d);
    if(a==="nol-stampa") return nolStampa(tipo,d);
    if(a==="nol-elim")   return nolElimina(tipo,d);
  });
