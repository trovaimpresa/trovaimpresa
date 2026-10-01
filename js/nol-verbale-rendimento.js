// [SPOSTATO] nol-verbale-rendimento.js: era dentro nol-core.js, righe 2604-3032, spostato identico.


  /* ================================================================
     IL VERBALE DI CONSEGNA E RICONSEGNA, E IL DDT — 23 agosto 2026

     ⛔ LA STESSA LISTA NEI DUE MOMENTI. E' tutto qui il senso del verbale:
     se alla consegna e al rientro si guardano cose diverse, al rientro non
     si dimostra niente. Percio' le voci sono le stesse, scritte una volta
     sola, e i due verbali le ripetono identiche.

     Il DDT serve a non far scattare la presunzione di cessione: sopra c'e'
     scritto che i beni viaggiano «a titolo di noleggio» (art. 53 DPR
     633/72). Ne va uno all'andata e uno al ritorno.
     ================================================================ */
  const VERBALE_VOCI=[
    "Carrozzeria e struttura","Vetri, specchi, cabina","Pneumatici o cingoli",
    "Luci e segnalatori","Livelli: olio, refrigerante","Carburante",
    "Batteria e avviamento","Comandi e dispositivi di sicurezza",
    "Accessori e attrezzi in dotazione","Chiavi",
    "Documenti a bordo: libretto, dichiarazione CE","Pulizia"
  ];
  const VERBALE_STATI={ok:"A posto",usura:"Usura normale",danno:"DANNO"};
  /* sui pulsanti servono parole corte: dodici voci per tre pulsanti sono
     trentasei pulsanti, e con «Usura normale» andavano a capo tutti */
  const VERBALE_BREVI={ok:"A posto",usura:"Usura",danno:"Danno"};

  /* la lista di partenza: tutte le voci a posto, da correggere a mano */
  function verbaleVuoto(){
    return VERBALE_VOCI.map(v=>({voce:v,stato:"ok",nota:""}));
  }
  /* ⚠️ se un domani si aggiunge una voce, i verbali gia' scritti non la
     hanno: si mette in coda invece di far sparire quello che c'era. */
  function verbaleNormalizza(lista){
    const dentro=Array.isArray(lista)?lista.slice():[];
    VERBALE_VOCI.forEach(v=>{ if(!dentro.some(x=>x.voce===v)) dentro.push({voce:v,stato:"ok",nota:""}); });
    return dentro;
  }

  async function nolVerbaleDati(n,momento){
    const rientro=(momento==="rientro");
    const [{data:az},{data:mz},{data:cl},{data:med}]=await Promise.all([
      sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      n.mezzo_id   ? sb.from("gest_mezzi").select("*").eq("id",n.mezzo_id).maybeSingle()     : Promise.resolve({data:null}),
      n.cliente_id ? sb.from("gest_clienti").select("*").eq("id",n.cliente_id).maybeSingle() : Promise.resolve({data:null}),
      sb.from("nol_media").select("genere,momento").eq("user_id",sbUid).eq("noleggio_id",n.id)
    ]);
    const A=az||{}, M=mz||{}, C=cl||{};
    const mm=(med||[]).filter(x=>x.momento===momento);
    const lista=verbaleNormalizza(rientro?n.check_rientro:n.check_uscita);
    const quando=rientro?(n.data_rientro_effettivo||n.data_rientro_prevista):n.data_uscita;
    const ora=rientro?n.ora_rientro:n.ora_uscita;
    const danni=lista.filter(x=>x.stato==="danno");

    const blocchi=[];
    blocchi.push({t:"testata",azienda:A.nome||"(compila i Dati azienda)",
      sotto:[A.piva?"P.IVA "+A.piva:"",A.indirizzo||""].filter(Boolean),
      titolo:rientro?"VERBALE DI RICONSEGNA":"VERBALE DI CONSEGNA",
      dettaglio:fdate(quando)+(ora?" alle "+String(ora).slice(0,5):"")+
        (n.contratto_num?"   ·   contratto n. "+n.contratto_num:"")});

    blocchi.push({t:"coppie",titolo:"Le parti e l'attrezzatura",righe:[
      ["Locatore",A.nome||"—"],
      ["Conduttore",C.nome||n.cliente||"—"],
      ["Attrezzatura",M.nome||n.mezzo||"—"],
      ["Codice / matricola",M.codice||null],
      ["Luogo",n.luogo||null],
      ["Contaore",rientro?(n.contaore_rientro!=null?String(n.contaore_rientro):null)
                         :(n.contaore_uscita!=null?String(n.contaore_uscita):null)],
      ["Chilometri",rientro?(n.km_rientro!=null?String(n.km_rientro):null)
                           :(n.km_uscita!=null?String(n.km_uscita):null)]
    ]});

    blocchi.push({t:"tabella",titolo:"Stato dell'attrezzatura",
      intro:rientro
        ? "Le stesse voci controllate alla consegna, ricontrollate una per una alla riconsegna."
        : "Controllo eseguito in contraddittorio al momento della consegna.",
      colonne:["Che cosa","Come sta","Note"],
      righe:lista.map(x=>[x.voce,VERBALE_STATI[x.stato]||x.stato,x.nota||""]),
      nota:mm.length
        ? "Allegate "+mm.filter(x=>x.genere==="foto").length+" foto e "+
          mm.filter(x=>x.genere==="video").length+" video, scattati in questo momento."
        : "⚠️ Nessuna foto allegata a questo momento."});

    blocchi.push({t:"testo",titolo:rientro?"Dichiarazioni":"Dichiarazioni",
      corpo: rientro
        ? [ danni.length
              ? "Alla riconsegna sono state rilevate difformità rispetto allo stato di consegna alle voci: "+
                danni.map(x=>x.voce).join(", ")+". Sono danni eccedenti la normale usura e restano a carico del Conduttore, al valore di riparazione o di sostituzione."
              : "Alla riconsegna non sono state rilevate difformità eccedenti la normale usura rispetto allo stato di consegna.",
            "La cauzione viene restituita al netto di quanto sopra e degli importi non ancora pagati.",
            (n.stato_rientro?("Note sullo stato: "+n.stato_rientro):null)
          ].filter(Boolean)
        : [ "Il Locatore attesta, ai sensi dell'art. 72 comma 2 del D.Lgs 81/2008, il buono stato di conservazione, manutenzione ed efficienza dell'attrezzatura a fini di sicurezza al momento della consegna.",
            "Il Conduttore dichiara di ricevere l'attrezzatura nello stato sopra descritto, completa degli accessori indicati e corredata del manuale d'uso e delle certificazioni.",
            (n.stato_consegna?("Note sullo stato: "+n.stato_consegna):null)
          ].filter(Boolean)});

    blocchi.push({t:"firme",
      vessatorie:"Il presente verbale è redatto in contraddittorio e sottoscritto da entrambe le parti. Fa fede dello stato dell'attrezzatura al momento indicato.",
      colonne:[["Il Locatore",A.nome||"",null],
               ["Il Conduttore",(rientro?n.firma_rientro:n.firma_uscita)||C.nome||n.cliente||"",
                (rientro?n.firma_rientro_img:n.firma_uscita_img)||null]]});

    return {blocchi,titolo:(rientro?"Verbale di riconsegna — ":"Verbale di consegna — ")+
            (M.nome||n.mezzo||"mezzo")};
  }

  /* ---- il DDT ---- */
  async function nolDdtDati(n,momento){
    const rientro=(momento==="rientro");
    const [{data:az},{data:mz},{data:cl}]=await Promise.all([
      sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      n.mezzo_id   ? sb.from("gest_mezzi").select("*").eq("id",n.mezzo_id).maybeSingle()     : Promise.resolve({data:null}),
      n.cliente_id ? sb.from("gest_clienti").select("*").eq("id",n.cliente_id).maybeSingle() : Promise.resolve({data:null})
    ]);
    const A=az||{}, M=mz||{}, C=cl||{};
    const num =rientro?n.ddt_rientro_num :n.ddt_uscita_num;
    const data=rientro?(n.ddt_rientro_data||n.data_rientro_effettivo)
                      :(n.ddt_uscita_data||n.data_uscita);
    const mitt=rientro?(C.nome||n.cliente||"—"):(A.nome||"—");
    const dest=rientro?(A.nome||"—"):(C.nome||n.cliente||"—");

    const blocchi=[];
    blocchi.push({t:"testata",azienda:A.nome||"(compila i Dati azienda)",
      sotto:[A.piva?"P.IVA "+A.piva:"",A.indirizzo||"",
             [A.tel?"Tel "+A.tel:"",A.email||""].filter(Boolean).join("   ")].filter(Boolean),
      titolo:"DOCUMENTO DI TRASPORTO",
      dettaglio:(num?"N. "+num:"N. da assegnare")+"   ·   del "+fdate(data||todayStr())+
        "   ·   "+(rientro?"rientro":"consegna")});

    blocchi.push({t:"coppie",titolo:"Mittente e destinatario",righe:[
      ["Mittente",mitt],
      ["Destinatario",dest],
      ["Indirizzo di destinazione",rientro?(A.indirizzo||null):(n.luogo||C.indirizzo||null)],
      ["P.IVA / Cod. Fiscale del cliente",C.piva||null]
    ]});

    blocchi.push({t:"tabella",titolo:"Beni trasportati",
      intro:"",
      colonne:["Descrizione","Codice / matricola","Q.tà"],
      righe:[[M.nome||n.mezzo||"—", M.codice||"", "1"]],
      nota:""});

    blocchi.push({t:"coppie",titolo:"Trasporto",righe:[
      /* ⛔ la riga che fa esistere questo foglio */
      ["Causale del trasporto","NOLEGGIO — beni ceduti a titolo non traslativo"],
      ["Aspetto esteriore dei beni","A vista"],
      ["Trasporto a cura di",n.trasporto||"Conduttore"],
      ["Data e ora di inizio trasporto",fdate(data||todayStr())+
        ((rientro?n.ora_rientro:n.ora_uscita)?" alle "+String(rientro?n.ora_rientro:n.ora_uscita).slice(0,5):"")]
    ]});

    blocchi.push({t:"testo",titolo:"",corpo:[
      "Documento di trasporto emesso ai sensi del D.P.R. 472/1996. I beni sono ceduti a titolo di noleggio e restano di proprietà del mittente: la consegna non costituisce cessione."
    ]});

    /* ⛔ 24 agosto 2026 — LA FIRMA DEL CLIENTE FINISCE ANCHE SUL DDT.
       Al collaudo la firma si raccoglieva col dito nel verbale e il DDT
       usciva con le righe vuote da firmare a penna: due fogli della stessa
       consegna, uno firmato e uno no. Il DDT e' la carta che prova che il
       mezzo e' stato consegnato, quella che si tira fuori quando il cliente
       dice «a me non e' mai arrivato».
       ⚠️ Alla consegna il cliente RICEVE, e firma da destinatario; al
       rientro e' lui che riporta il mezzo, e firma da conducente. */
    const firmaCli=(rientro?n.firma_rientro_img:n.firma_uscita_img)||null;
    const nomeCli =(rientro?n.firma_rientro:n.firma_uscita)||C.nome||n.cliente||"";
    blocchi.push({t:"firme",vessatorie:"",
      colonne: rientro
        ? [["Firma del conducente",nomeCli,firmaCli],["Firma del destinatario",A.nome||"",null]]
        : [["Firma del conducente",A.nome||"",null],["Firma del destinatario",nomeCli,firmaCli]]});

    return {blocchi,titolo:"DDT "+(num?num:"")+" — "+(M.nome||n.mezzo||"mezzo")};
  }

  /* ⛔ 24 agosto 2026 — IL NUMERO DEL CONTRATTO SE LO PRENDE DA SOLO.
     Al collaudo il DDT il numero se lo prendeva e il contratto no: quello
     andava scritto a mano, e nessuno lo diceva. Cosi' un contratto
     stampato, firmato in due punti e scaricato in PDF risultava
     «mancante» nella schermata dei documenti, con la scritta rossa
     MANCANO 4. Stessa identica regola del DDT: si prende alla PRIMA
     stampa, dal contatore dell'azienda, e poi non cambia piu'.
     ⚠️ Se il numero l'hai scritto tu a mano, resta il tuo: qui si entra
     solo quando la casella e' vuota. */
  async function nolContrattoNumero(n){
    if(n&&n.contratto_num&&String(n.contratto_num).trim()) return n;
    if(!(n&&n.id)) return n;
    const {data:az,error:e1}=await sb.from("gest_azienda")
      .select("num_contratto").eq("user_id",sbUid).maybeSingle();
    /* se la colonna non c'e' ancora (query non lanciata) non si inventa
       niente: si lascia il contratto come sta, com'era prima di oggi */
    if(e1||!az||az.num_contratto==null) return n;
    const num=az.num_contratto||1;
    const patch={contratto_num:String(num),
                 contratto_data:n.contratto_data||n.data_uscita||todayStr()};
    const {error}=await sb.from("nol_noleggi").update(patch)
      .eq("id",n.id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return n;}
    await sb.from("gest_azienda").update({num_contratto:num+1}).eq("user_id",sbUid);
    toast("Contratto n. "+num);
    return Object.assign({},n,patch);
  }

  /* il numero del DDT: si prende dal contatore dell'azienda e si consuma,
     come fa gia' la fattura. Una volta assegnato non cambia piu'. */
  async function nolDdtNumero(n,momento){
    const rientro=(momento==="rientro");
    if(rientro?n.ddt_rientro_num:n.ddt_uscita_num) return n;
    const {data:az}=await sb.from("gest_azienda").select("num_ddt").eq("user_id",sbUid).maybeSingle();
    const num=(az&&az.num_ddt)||1;
    const patch=rientro
      ? {ddt_rientro_num:String(num),ddt_rientro_data:n.data_rientro_effettivo||todayStr()}
      : {ddt_uscita_num:String(num), ddt_uscita_data:n.data_uscita||todayStr()};
    const {error}=await sb.from("nol_noleggi").update(patch).eq("id",n.id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return n;}
    await sb.from("gest_azienda").update({num_ddt:num+1}).eq("user_id",sbUid);
    return Object.assign({},n,patch);
  }



  /* ================================================================
     RENDIMENTO — quanto rende ogni mezzo, 23 agosto 2026
     E' l'ultima delle otto cose che hanno tutti i gestionali noleggio
     (14 su 19 nello studio del mercato) e che a noi mancava.

     La domanda a cui risponde e' una sola, e se la fa ogni noleggiatore:
     «quell'escavatore me lo sono ripagato o sta fermo in piazzale?»

     ⛔ Un mezzo che non esce mai non e' un mezzo che non rende: e' un mezzo
     che COSTA (bollo, assicurazione, posto, verifiche). Percio' qui i mezzi
     fermi non spariscono in fondo alla lista: si vedono in rosso.
     ================================================================ */
  let rendPeriodo="anno", rendDati=null;

  function rendIntervallo(){
    const oggi=todayStr(), a=oggi.slice(0,4), m=oggi.slice(0,7);
    if(rendPeriodo==="mese")  return {dal:m+"-01",   al:oggi, eti:"questo mese",  gg:Number(oggi.slice(8,10))};
    if(rendPeriodo==="anno")  return {dal:a+"-01-01",al:oggi, eti:"quest'anno",
                                      gg:Math.round((new Date(oggi)-new Date(a+"-01-01"))/86400000)+1};
    return {dal:"1900-01-01",al:oggi,eti:"da sempre",gg:null};
  }
  /* quanti giorni di quel noleggio cadono dentro il periodo */
  function _giorniDentro(n,dal,al){
    const d1=n.data_uscita, d2=n.data_rientro_effettivo||n.data_rientro_prevista||al;
    if(!d1) return 0;
    const a=d1>dal?d1:dal, b=d2<al?d2:al;
    if(a>b) return 0;
    return Math.round((new Date(b)-new Date(a))/86400000)+1;
  }

  async function loadRendimento(){
    if(!(sb&&sbUid)) return;
    const box=$("#rendimento-body"); if(!box) return;
    const {dal,al,eti,gg}=rendIntervallo();
    const [{data:mezzi},{data:nol}]=await Promise.all([
      sb.from("gest_mezzi").select("*").eq("user_id",sbUid).eq("noleggiabile",true).order("nome"),
      sb.from("nol_noleggi").select("*").eq("user_id",sbUid)
    ]);
    const MZ=mezzi||[], N=(nol||[]).filter(x=>x.data_uscita&&x.data_uscita<=al&&
      ((x.data_rientro_effettivo||x.data_rientro_prevista||al)>=dal));
    const perMezzo={};
    MZ.forEach(m=>perMezzo[m.id]={m,volte:0,giorni:0,reso:0,incassato:0,daPagare:0,cauzioni:0});
    /* ⚠️ i noleggi senza collegamento al mezzo (quelli vecchi, scritti col
       nome) non si buttano via: si contano a parte e si dice quanti sono. */
    let orfani=0, resoOrfani=0;
    N.forEach(x=>{
      const r=perMezzo[x.mezzo_id];
      const imp=+x.importo||0;
      if(!r){ orfani++; resoOrfani+=imp; return; }
      r.volte++; r.giorni+=_giorniDentro(x,dal,al); r.reso+=imp;
      if(x.stato_pagamento==="pagato") r.incassato+=imp; else r.daPagare+=imp;
      if(!x.data_rientro_effettivo) r.cauzioni+=(+x.cauzione||0);
    });
    const righe=Object.values(perMezzo).sort((a,b)=>b.reso-a.reso);
    rendDati={righe,dal,al,eti,gg,orfani,resoOrfani};

    const totReso=righe.reduce((s,r)=>s+r.reso,0);
    const totInc =righe.reduce((s,r)=>s+r.incassato,0);
    const totDa  =righe.reduce((s,r)=>s+r.daPagare,0);
    const totCau =righe.reduce((s,r)=>s+r.cauzioni,0);
    const fermi  =righe.filter(r=>!r.volte).length;
    if($("#rend-testa")) $("#rend-testa").innerHTML=`
      <div class="money-row">
        <div class="money in"><div class="n">${esc(_eur(totReso+resoOrfani))}</div><div class="l">Reso dal noleggio</div><div class="sub">${esc(eti)}</div></div>
        <div class="money out"><div class="n">${esc(_eur(totDa))}</div><div class="l">Ancora da incassare</div><div class="sub">Di questi noleggi</div></div>
      </div>
      <div style="font-size:14px;color:#666;margin:12px 0 0">
        Incassato ${esc(_eur(totInc))} · cauzioni ancora in deposito ${esc(_eur(totCau))}${
          fermi?' · <b class="rend-fermi">'+fermi+(fermi===1?" mezzo fermo":" mezzi fermi")+"</b>":""}${
          orfani?" · "+orfani+(orfani===1?" noleggio":" noleggi")+" senza mezzo collegato ("+esc(_eur(resoOrfani))+")":""}
      </div>`;

    if(!righe.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun mezzo.</p>';return;}
    box.innerHTML=righe.map(r=>{
      /* ⚠️ un mezzo uscito un giorno su duecento non e' «usato lo 0% del
         tempo»: e' poco, ma non zero. Zero lo si scrive solo se e' fermo. */
      const uso=(gg&&gg>0)?(r.giorni>0?Math.max(1,Math.min(100,Math.round(r.giorni/gg*100))):0):null;
      const fermo=!r.volte;
      const col=fermo?"#c62828":(uso!=null&&uso>=50?"#2e7d32":"#e65100");
      return nolCard({col:col,
        titolo:esc(r.m.nome||"—"),
        eti:[{t:fermo?"MAI USCITO":esc(_eur(r.reso))}],
        corpo:`<div class="sub">${fermo
          ? "In piazzale per tutto il periodo: non ha reso niente, ma è costato lo stesso."
          : esc(r.volte+(r.volte===1?" noleggio":" noleggi")+" · "+r.giorni+(r.giorni===1?" giorno":" giorni")+" fuori"+
                (uso!=null?" · usato il "+uso+"% del tempo":""))}</div>
        ${fermo?"":`<div class="rend-barra"><i style="width:${uso||0}%;background:${col}"></i></div>`}
        ${fermo?"":`<div class="sub2">${esc("Incassato "+_eur(r.incassato)+
            (r.daPagare?" · da incassare "+_eur(r.daPagare):"")+
            (r.cauzioni?" · cauzioni in deposito "+_eur(r.cauzioni):""))}</div>`}`,
        pulsanti:nolPulsanti("mezzo",r.m.id)});
    }).join("");
  }
  $('[data-tab="rendimento"]')?.addEventListener("click",loadRendimento);
  $$("#rend-periodo .chip").forEach(c=>c.addEventListener("click",()=>{
    $$("#rend-periodo .chip").forEach(x=>x.classList.remove("on"));
    c.classList.add("on"); rendPeriodo=c.dataset.v; loadRendimento();
  }));

  /* ---- portarselo via: un CSV che Excel apre con un doppio clic ---- */
  function rendEsporta(){
    if(!rendDati||!rendDati.righe.length){toast("Non c'è niente da esportare");return;}
    const {righe,eti,gg}=rendDati;
    /* ⚠️ il punto e virgola, non la virgola: Excel italiano apre cosi'.
       E il BOM davanti, se no gli accenti diventano geroglifici. */
    const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
    /* anche il CSV e' una scrittura: stesso arrotondamento del resto */
    const num=v=>String(_cent(v)).replace(".",",");
    const testa=["Mezzo","Codice","Noleggi","Giorni fuori","Uso %","Reso €","Incassato €","Da incassare €","Cauzioni in deposito €"];
    const corpo=righe.map(r=>[r.m.nome||"",r.m.codice||"",r.volte,r.giorni,
      (gg&&gg>0)?Math.min(100,Math.round(r.giorni/gg*100)):"",
      num(r.reso),num(r.incassato),num(r.daPagare),num(r.cauzioni)]);
    const csv="﻿"+[testa].concat(corpo).map(r=>r.map(q).join(";")).join("\r\n");
    const b=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(b);
    a.download="rendimento-"+eti.replace(/[^a-z0-9]+/gi,"-")+"-"+todayStr()+".csv";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{try{URL.revokeObjectURL(a.href);a.remove();}catch(e){}},1000);
    toast("Scaricato ✔");
  }

  /* ================================================================
     CONTRATTI E DOCUMENTI — 23 agosto 2026
     Alessio: «non vedo la sezione contratti». Aveva ragione: il contratto
     stava DENTRO il noleggio e basta. Adesso le carte sono cinque
     (contratto, due verbali, due DDT) e vogliono una casa loro, dove si
     veda a colpo d'occhio a quale noleggio manca quale foglio.
     ================================================================ */
  let docsCache=[], docsQ="", docsApertoId=null, docsCheck={uscita:[],rientro:[]};

  const DOCS_FOGLI=[
    {k:"contratto", lab:"Contratto", ce:n=>!!n.contratto_num},
    {k:"vu", lab:"Verbale consegna", ce:n=>!!n.verbale_uscita_il},
    {k:"du", lab:"DDT consegna",     ce:n=>!!n.ddt_uscita_num},
    {k:"vr", lab:"Verbale rientro",  ce:n=>!!n.verbale_rientro_il, solo:n=>!!n.data_rientro_effettivo},
    {k:"dr", lab:"DDT rientro",      ce:n=>!!n.ddt_rientro_num,    solo:n=>!!n.data_rientro_effettivo}
  ];

  /* ================================================================
     LE CAUZIONI — 23 agosto 2026
     Una schermata sola per rispondere a tre domande che oggi non avevano
     risposta: quanto ho in mano, di chi sono, quali devo rendere subito.
     ⛔ «Da svincolare» viene per primo apposta: e' l'unica di queste tre
     che e' un lavoro da fare, non un numero da guardare.
     ================================================================ */
  let cauFiltro="aperte";
  const CAU_VUOTO={
    dasvincolare:"Nessuna cauzione da svincolare. Tutti i mezzi rientrati hanno la loro partita chiusa.",
    aperte:"Nessuna cauzione in deposito: non stai tenendo soldi di nessuno.",
    chiuse:"Nessuna cauzione ancora svincolata.",
    tutte:"Nessun noleggio con cauzione. La cauzione si scrive nella scheda del noleggio."};

  async function loadCauzioni(){
    if(!(sb&&sbUid)) return;
    const box=$("#cauzioni-body"); if(!box) return;
    const {data}=await sb.from("nol_noleggi").select("*").eq("user_id",sbUid)
      .order("data_uscita",{ascending:false});
    /* ⚠️ un noleggio senza cauzione qui non c'entra niente: sparisce, invece
       di allungare l'elenco con righe da zero euro. */
    const N=(data||[]).filter(x=>(+x.cauzione||0)>0);
    const scrivi=(id,txt)=>{const e=$("#"+id);if(e)e.textContent=txt;};
    const inMano=N.filter(x=>cauStatoDi(x)==="in_deposito");
    const chiuse=N.filter(x=>cauStatoDi(x)==="svincolata");
    scrivi("kc-mano",_eur(inMano.reduce((s,x)=>s+(+x.cauzione||0),0)));
    scrivi("kc-svincolate",_eur(chiuse.reduce((s,x)=>s+(+x.cauzione_restituita||0),0)));
    scrivi("kc-trattenute",_eur(chiuse.reduce((s,x)=>s+(+x.cauzione_trattenuta||0),0)));
    const daSv=N.filter(cauDaSvincolare);
    const pall=$("#cnt-cauzioni");
    if(pall){pall.textContent=daSv.length?String(daSv.length):"";
             pall.style.display=daSv.length?"inline-block":"none";}

    let lista=N;
    if(cauFiltro==="dasvincolare") lista=daSv;
    if(cauFiltro==="aperte")       lista=inMano;
    if(cauFiltro==="chiuse")       lista=chiuse;
    if(!lista.length){
      box.innerHTML='<p style="color:#666;padding:8px">'+esc(CAU_VUOTO[cauFiltro]||CAU_VUOTO.tutte)+'</p>';
      return;
    }
    /* prima quelle da rendere: sono le uniche su cui c'e' da muoversi */
    lista=lista.slice().sort((a,b)=>(cauDaSvincolare(b)?1:0)-(cauDaSvincolare(a)?1:0));
    box.innerHTML=lista.map(x=>{
      const st=cauStatoDi(x), dasv=cauDaSvincolare(x);
      const col=st==="svincolata"?"#2e7d32":(dasv?"#c62828":"#e65100");
      const eti=st==="svincolata"?"SVINCOLATA":(dasv?"DA SVINCOLARE":"IN DEPOSITO");
      const gg=dasv&&x.data_rientro_effettivo
        ? Math.round((new Date(todayStr())-new Date(x.data_rientro_effettivo))/86400000) : 0;
      const sotto=[CAU_FORMA[x.cauzione_forma]||"forma non indicata",
                   x.cauzione_rif?"rif. "+x.cauzione_rif:"",
                   x.cauzione_ricevuta_il?"presa il "+fdate(x.cauzione_ricevuta_il):""]
                  .filter(Boolean).join(" · ");
      const chiusura=st==="svincolata"
        ? "Svincolata il "+fdate(x.cauzione_svincolata_il)+
          " · restituiti "+_eur(x.cauzione_restituita||0)+
          ((+x.cauzione_trattenuta||0)?" · trattenuti "+_eur(x.cauzione_trattenuta):"")
        : (dasv?"Mezzo rientrato il "+fdate(x.data_rientro_effettivo)+
                (gg>0?" — sono passati "+gg+(gg===1?" giorno":" giorni"):"")
              :"Mezzo ancora fuori: la cauzione resta in deposito.");
      return nolCard({col:col,
        titolo:esc(_eur(x.cauzione)),
        eti:[{t:esc(eti)}],
        corpo:`<div class="sub">${x.cliente?esc(x.cliente):"Cliente non indicato"}${x.mezzo?esc(" · "+x.mezzo):""}</div>
        <div class="sub2">${esc(sotto)}</div>
        <div class="sub2">${esc(chiusura)}</div>`,
        pulsanti:nolPulsanti("cauzione",x.id)});
    }).join("");
  }
  $('[data-tab="cauzioni"]')?.addEventListener("click",loadCauzioni);
