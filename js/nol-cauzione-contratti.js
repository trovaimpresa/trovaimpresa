// [SPOSTATO] nol-cauzione-contratti.js: era dentro nol-core.js, righe 2108-2603, spostato identico.

  /* ---- la cauzione dentro la scheda ---- (23 agosto 2026)
     Il riquadro dello svincolo compare quando c'e' una data di rientro
     effettivo: prima di allora non c'e' niente da svincolare, e una casella
     che non serve e' una casella che qualcuno riempie per sbaglio. */
  let nolCauApert=null;
  function nolMostraCauzione(){
    const box=$("#nn-cau-svin"); if(!box) return;
    const n=nolCauApert||{};
    const imp=_numIt($("#nn-cauzione")?$("#nn-cauzione").value:0);
    const rientrato=!!($("#nn-effettivo")&&$("#nn-effettivo").value);
    const chiusa=$("#nn-cau-chiusa")&&$("#nn-cau-chiusa").checked;
    box.style.display=(imp>0&&(rientrato||chiusa))?"":"none";

    /* la riga che dice come sta messa: e' la prima cosa che si guarda */
    const riga=$("#nn-cau-riga");
    if(riga){
      if(imp<=0){ riga.innerHTML=""; }
      else{
        const st=chiusa?"svincolata":(rientrato?"in_deposito":"in_deposito");
        const dasv=(st==="in_deposito"&&rientrato);
        const col=st==="svincolata"?"#2e7d32":(dasv?"#c62828":"#e65100");
        const eti=st==="svincolata"?"SVINCOLATA":(dasv?"DA SVINCOLARE":"IN DEPOSITO");
        riga.innerHTML='<div class="nol-avviso" style="background:#fff;border-color:'+col+
          ';color:#333"><b style="color:'+col+'">'+eti+'</b> — '+esc(_eur(imp))+
          (st==="svincolata"?", gi&agrave; chiusa."
            :(dasv?". Il mezzo &egrave; rientrato: questi soldi vanno resi al cliente."
                  :". Sono soldi del cliente: non entrano nel totale del noleggio."))+'</div>';
      }
    }
    /* i danni che il verbale di riconsegna ha gia' scritto: qui servono a
       ricordare PERCHE' si trattiene, non a inventare un importo */
    const dbox=$("#nn-cau-danni");
    if(dbox){
      const danni=(Array.isArray(n.check_rientro)?n.check_rientro:[]).filter(x=>x&&x.stato==="danno");
      dbox.innerHTML=danni.length
        ? '<div class="nol-avviso">Il verbale di riconsegna segna un danno a: <b>'+
          esc(danni.map(x=>x.voce+(x.nota?" ("+x.nota+")":"")).join(", "))+
          '</b>. Quello che trattieni deve corrispondere a questo.</div>'
        : '<p style="margin:0 0 8px;font-size:13px;color:#666">Il verbale di riconsegna non segna danni: la cauzione torna indietro tutta.</p>';
    }
  }
  /* scrivi quanto trattieni, il resto si calcola: e' l'unico conto che
     serve, e farlo a mente davanti al cliente e' come si sbaglia */
  document.addEventListener("input",e=>{
    if(e.target.id==="nn-cau-tratt"){
      const imp=_numIt($("#nn-cauzione").value), tr=_numIt(e.target.value);
      const rest=Math.max(0,imp-tr);
      if($("#nn-cau-rest")) $("#nn-cau-rest").value=String(rest.toFixed(2)).replace(".",",");
      return;
    }
    if(e.target.id==="nn-cauzione"||e.target.id==="nn-effettivo") nolMostraCauzione();
  });

  /* ⛔ 24 agosto 2026 — «RIENTRATO» SCRIVE ANCHE LA DATA.
     Al collaudo si premeva «Rientrato» e la card diceva RIENTRATO, ma la
     data di rientro effettivo restava vuota: per il gestionale il mezzo era
     ancora fuori, il conto non si rifaceva sui giorni veri e il verbale di
     riconsegna non compariva. Due verita' diverse nella stessa scheda.
     Adesso il bottone mette la data di oggi e lo dice: se il mezzo e'
     rientrato prima, la data si corregge a mano. */
  document.addEventListener("click",e=>{
    const b=e.target.closest('#nn-fase button[data-v]'); if(!b) return;
    const d=$("#nn-effettivo"); if(!d) return;
    if(b.dataset.v==="rientrato" && !d.value){
      d.value=todayStr();
      d.dispatchEvent(new Event("change",{bubbles:true}));
      toast("Rientro segnato oggi. Se è rientrato prima, correggi la data.");
    }
  });
  document.addEventListener("change",e=>{
    if(e.target.id==="nn-cau-chiusa"||e.target.id==="nn-effettivo"){
      if(e.target.id==="nn-cau-chiusa"&&e.target.checked&&$("#nn-cau-svin-data")&&!$("#nn-cau-svin-data").value)
        $("#nn-cau-svin-data").value=todayStr();
      nolMostraCauzione();
    }
  });

  /* ---- chi usera' la macchina: le righe della dichiarazione ---- */
  let nolOperatori=[];
  function nolDisegnaOperatori(){
    const box=$("#nn-operatori"); if(!box) return;
    if(!nolOperatori.length){
      box.innerHTML='<p style="color:#c62828;font-size:14px;margin:0 0 10px">Nessun nominativo: senza, il contratto non &egrave; a posto.</p>';
      return;
    }
    box.innerHTML=nolOperatori.map((o,i)=>`<div class="nol-op-riga">
      <input data-op="nome" data-i="${i}" placeholder="Cognome e nome" value="${esc(o.nome==null?"":o.nome)}">
      <input data-op="cf"   data-i="${i}" placeholder="Codice fiscale" value="${esc(o.cf==null?"":o.cf)}">
      <input data-op="abil" data-i="${i}" placeholder="Abilitazione (es. escavatore)" value="${esc(o.abil==null?"":o.abil)}">
      <input data-op="scad" data-i="${i}" type="date" title="Quando scade il patentino" value="${esc(o.scad==null?"":o.scad)}">
      <button type="button" class="nol-cons-via" data-opvia="${i}" title="Togli">✕</button></div>`).join("");
  }
  /* nel nolo a caldo la dichiarazione non si chiede: l'art. 72 c.2 parla di
     «senza operatore». Il riquadro sparisce invece di restare li' a chiedere
     una cosa che non serve. */
  function nolMostraOperatori(){
    const box=$("#nn-op-box"); if(!box) return;
    box.style.display = (segVal("nn-nolo")==="caldo") ? "none" : "";
  }
  function nolLeggiOperatori(){
    return nolOperatori
      .filter(o=>String(o.nome||"").trim()||String(o.cf||"").trim())
      .map(o=>({nome:String(o.nome||"").trim(),cf:String(o.cf||"").trim().toUpperCase(),
                abil:String(o.abil||"").trim(),scad:o.scad||null}));
  }
  document.addEventListener("click",e=>{
    if(e.target.closest("#nn-op-add")){
      nolOperatori.push({nome:"",cf:"",abil:"",scad:""}); nolDisegnaOperatori(); return;
    }
    const via=e.target.closest("#nn-operatori [data-opvia]");
    if(via){ nolOperatori.splice(+via.dataset.opvia,1); nolDisegnaOperatori(); return; }
    if(e.target.closest("#nn-nolo button")) setTimeout(nolMostraOperatori,0);
  });
  document.addEventListener("input",e=>{
    const c=e.target.closest("#nn-operatori [data-op]"); if(!c) return;
    const i=+c.dataset.i; if(!nolOperatori[i]) return;
    nolOperatori[i][c.dataset.op]=c.value;
  });


  /* ================================================================
     IL CONTRATTO DI NOLEGGIO — 23 agosto 2026
     ⛔ D.Lgs 81/2008 art. 72:
       comma 1 — chi noleggia ATTESTA che la macchina e' conforme;
       comma 2 — chi noleggia SENZA OPERATORE deve attestare il buono
                 stato di conservazione, manutenzione ed efficienza al
                 momento della consegna, e deve ACQUISIRE E CONSERVARE
                 per tutta la durata del noleggio la dichiarazione del
                 datore di lavoro con i nominativi di chi la usera',
                 formati e — per le macchine dell'art. 73 c.5 —
                 abilitati.
     E' l'unico documento davvero obbligatorio del noleggio a freddo.

     ⚠️ NEL NOLO A CALDO il comma 2 NON si applica (parla di «senza
     operatore»): la dichiarazione non si chiede, e il contratto lo dice.

     UN MOTORE SOLO: i dati si preparano una volta (nolContrattoDati) e
     due disegnatori li mettono su carta (stampa) e su PDF. Se domani si
     aggiunge una clausola, si aggiunge in un punto e compare in tutti e
     due, senza che si scollino.
     ================================================================ */

  /* le condizioni. Sono il minimo onesto: i modelli veri, scritti con
     ANCE, li ha Assodimi nell'area soci. Le due segnate ⚠️ sono clausole
     vessatorie ex art. 1341 c.2 c.c.: senza la SECONDA firma non valgono. */
  const NOL_CONDIZIONI=[
    ["Consegna","Il Conduttore dichiara di ricevere l'attrezzatura in buono stato di conservazione, manutenzione ed efficienza, completa degli accessori indicati e corredata del manuale d'uso e delle certificazioni."],
    ["Uso","L'attrezzatura va usata solo per l'impiego a cui è destinata, nel luogo indicato, da personale formato e — dove previsto — abilitato. È vietato modificarla o manometterne i dispositivi di sicurezza."],
    ["Custodia","La custodia è a carico del Conduttore per tutta la durata del noleggio, compresi i giorni di fermo e di non utilizzo."],
    ["Manutenzione","Sono a carico del Conduttore i controlli giornalieri, i rabbocchi e i materiali di consumo. La manutenzione programmata resta a carico del Locatore."],
    ["Guasti","Il Conduttore avvisa subito il Locatore e sospende l'uso. Il guasto da normale usura non si addebita; quello da uso improprio si."],
    ["Danni e smarrimento","⚠️ Al rientro si confronta lo stato con quello della consegna. I danni eccedenti la normale usura, e lo smarrimento, sono a carico del Conduttore al valore di riparazione o di sostituzione."],
    ["Cauzione","La cauzione viene restituita al rientro, dopo il controllo, al netto di eventuali danni e importi non pagati."],
    ["Ritardo nella riconsegna","⚠️ Oltre la data di rientro concordata il noleggio continua alla stessa tariffa, senza bisogno di ulteriore accordo, salvo il maggior danno."],
    ["Subnoleggio","È vietato cedere o subnoleggiare l'attrezzatura a terzi senza il consenso scritto del Locatore."],
    ["Trasporto","Salvo diverso accordo scritto, il trasporto di andata e ritorno è a carico del Conduttore."],
    ["Foro competente","Per ogni controversia è competente il foro del luogo in cui ha sede il Locatore."]
  ];

  async function nolContrattoDati(n){
    const [{data:az},{data:mz},{data:cl}]=await Promise.all([
      sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      n.mezzo_id   ? sb.from("gest_mezzi").select("*").eq("id",n.mezzo_id).maybeSingle()     : Promise.resolve({data:null}),
      n.cliente_id ? sb.from("gest_clienti").select("*").eq("id",n.cliente_id).maybeSingle() : Promise.resolve({data:null})
    ]);
    const A=az||{}, M=mz||{}, C=cl||{};
    const caldo=(n.tipo_nolo==="caldo");
    const ops=Array.isArray(n.operatori)?n.operatori:[];
    const dp=n.dettaglio_prezzo;
    const righeConto=(dp&&Array.isArray(dp.righe))?dp.righe.map(x=>[x.voce+(x.dettaglio?"  ("+x.dettaglio+")":""),_eur(x.importo)]):[];

    const blocchi=[];
    blocchi.push({t:"testata",
      azienda:A.nome||"(compila i Dati azienda)",
      sotto:[A.piva?"P.IVA "+A.piva:"",A.indirizzo||"",
             [A.tel?"Tel "+A.tel:"",A.email||""].filter(Boolean).join("   ")].filter(Boolean),
      titolo:"CONTRATTO DI NOLEGGIO",
      dettaglio:(caldo?"a caldo (con operatore)":"a freddo (senza operatore)")+
        (n.contratto_num?"   ·   N. "+n.contratto_num:"")+
        "   ·   del "+fdate(n.contratto_data||n.data_uscita||todayStr())});

    blocchi.push({t:"coppie",titolo:"Le parti",righe:[
      ["LOCATORE",A.nome||"—"],
      ["CONDUTTORE",C.nome||n.cliente||"—"],
      ["Indirizzo",C.indirizzo||null],
      ["P.IVA / Cod. Fiscale",C.piva||null],
      ["Telefono",C.telefono||null],
      ["Email",C.email||null]
    ]});

    blocchi.push({t:"coppie",titolo:"L'attrezzatura",righe:[
      ["Descrizione",M.nome||n.mezzo||"—"],
      ["Codice / matricola",M.codice||null],
      ["Tipo",M.tipo||null],
      ["Contaore alla consegna",n.contaore_uscita!=null?String(n.contaore_uscita):null],
      ["Chilometri alla consegna",n.km_uscita!=null?String(n.km_uscita):null]
    ]});

    blocchi.push({t:"coppie",titolo:"Durata",righe:[
      ["Consegna",fdate(n.data_uscita)+(n.ora_uscita?" alle "+String(n.ora_uscita).slice(0,5):"")],
      ["Riconsegna prevista",n.data_rientro_prevista?fdate(n.data_rientro_prevista):"da concordare"],
      ["Luogo di impiego",n.luogo||null]
    ]});

    blocchi.push({t:"coppie",titolo:"Corrispettivo",
      righe:righeConto.concat([
        ["TOTALE",_eur(n.importo)],
        ["Cauzione (in deposito, non entra nel totale)",n.cauzione?_eur(n.cauzione):"nessuna"],
        ["Pagamento",n.stato_pagamento==="pagato"?"Pagato":"Da pagare"]
      ])});

    /* ⛔ il pezzo che vale piu' di tutto il contratto */
    blocchi.push({t:"testo",titolo:"Attestazione del Locatore — art. 72 D.Lgs 81/2008",
      corpo:[
        "Il Locatore attesta, sotto la propria responsabilità, che l'attrezzatura sopra indicata è conforme ai requisiti di sicurezza previsti dalla normativa vigente (art. 72 comma 1).",
        caldo
          ? "Il noleggio è con operatore messo a disposizione dal Locatore: l'obbligo di cui all'art. 72 comma 2 non trova applicazione. L'operatore resta dipendente del Locatore, che ne conserva la posizione di garanzia; il Committente inserisce mezzo e operatore nella propria organizzazione e provvede al coordinamento e allo scambio di informazioni ai sensi dell'art. 26."
          : "Il Locatore attesta inoltre, ai sensi dell'art. 72 comma 2, il buono stato di conservazione, manutenzione ed efficienza dell'attrezzatura a fini di sicurezza al momento della consegna.",
        "Sono consegnati al Conduttore: manuale d'uso e manutenzione, dichiarazione di conformità e, dove previsto, copia del verbale dell'ultima verifica periodica."
      ]});

    if(!caldo){
      blocchi.push({t:"tabella",titolo:"Dichiarazione del datore di lavoro — art. 72 comma 2",
        intro:"Il sottoscritto datore di lavoro dichiara che l'attrezzatura sarà usata esclusivamente dai lavoratori qui indicati, formati ai sensi del Titolo III e — ove si tratti di attrezzature di cui all'art. 73 comma 5 — in possesso della specifica abilitazione.",
        colonne:["Cognome e nome","Codice fiscale","Abilitazione","Scade il"],
        righe:(ops.length?ops:[{}]).map(o=>[o.nome||"", o.cf||"", o.abil||"", o.scad?fdate(o.scad):""]),
        nota:"Questa dichiarazione va conservata dal Locatore per tutta la durata del noleggio."});
    }

    blocchi.push({t:"numerato",titolo:"Condizioni di noleggio",righe:NOL_CONDIZIONI});

    blocchi.push({t:"firme",
      vessatorie:"Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c. il Conduttore approva espressamente le clausole: 6 (Danni e smarrimento) e 8 (Ritardo nella riconsegna).",
      /* ⛔ la SECONDA firma: senza, le clausole 6 e 8 non sono opponibili.
         Va solo sul contratto — sul verbale e sul DDT non c'entra niente. */
      secondaFirma:"Il Conduttore, per approvazione specifica delle clausole 6 e 8",
      secondaFirmaImg:n.firma_contr2_img||null,
      colonne:[["Il Locatore",A.nome||"",null],
               ["Il Conduttore",n.firma_contr_nome||C.nome||n.cliente||"",n.firma_contr_img||null]]});

    return {blocchi, titolo:"Contratto di noleggio — "+(M.nome||n.mezzo||"mezzo")+
            (C.nome||n.cliente?" · "+(C.nome||n.cliente):"")};
  }

  /* ---- su carta ----
     ⛔ UN DISEGNATORE SOLO. Il contratto, il verbale di consegna, quello di
     rientro e i due DDT sono quattro fogli diversi fatti degli stessi
     mattoni: testata, coppie etichetta/valore, testo, tabella, elenco
     numerato, firme. Chi prepara i dati cambia; chi li mette su carta e'
     sempre questo, e quello del PDF qui sotto. Cosi' i cinque fogli non si
     scollano fra loro e non si scollano fra carta e PDF. */
  /* ⛔ 24 agosto 2026 — IL CONTRATTO SENZA NOMINATIVI NON ESCE IN SILENZIO.
     La tabella «chi userà la macchina» è la dichiarazione del datore di
     lavoro dell'art. 72 comma 2 del D.Lgs 81/08: senza quella il contratto
     non è a posto. Al collaudo il modulo lo scriveva in rosso e poi
     stampava lo stesso. Adesso chiede, come già fa per un mezzo promesso
     due volte: si può stampare uguale — capita di riempirla a mano davanti
     al cliente — ma sapendo cosa manca. */
  function nolContrattoPronto(n){
    const chi=(Array.isArray(n&&n.operatori)?n.operatori:[])
      .filter(o=>o&&o.nome&&String(o.nome).trim());
    const manca=[];
    if(!chi.length) manca.push("· i nominativi di chi userà la macchina (art. 72 comma 2 D.Lgs 81/08)");
    if(!(n&&n.contratto_num&&String(n.contratto_num).trim()))
      manca.push("· il numero del contratto");
    if(!manca.length) return true;
    return confirm("Il contratto non è completo. Manca:\n\n"+manca.join("\n")+
      "\n\nStamparlo lo stesso?");
  }

  async function nolContrattoStampa(n){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    n=await nolContrattoNumero(n);
    if(!nolContrattoPronto(n)) return;
    return nolDocStampa(await nolContrattoDati(n));
  }
  function nolDocStampa(dati){
    const {blocchi,titolo}=dati;
    let h="";
    blocchi.forEach(b=>{
      if(b.t==="testata"){
        h+='<div class="tst"><div><h1>'+esc(b.azienda)+'</h1>'
          + b.sotto.map(x=>'<div class="pic">'+esc(x)+'</div>').join("")
          + '</div><div class="dx"><div class="tit">'+esc(b.titolo)+'</div>'
          + '<div class="pic">'+esc(b.dettaglio)+'</div></div></div>';
      }
      if(b.t==="coppie"){
        const r=b.righe.filter(x=>x[1]!=null&&x[1]!=="");
        if(!r.length) return;
        h+='<h2>'+esc(b.titolo)+'</h2><table>'
          + r.map(x=>'<tr><td class="l">'+esc(x[0])+'</td><td class="v">'+esc(x[1])+'</td></tr>').join("")
          + '</table>';
      }
      if(b.t==="testo"){
        h+='<h2>'+esc(b.titolo)+'</h2>'+b.corpo.map(x=>'<p>'+esc(x)+'</p>').join("");
      }
      if(b.t==="tabella"){
        h+='<h2>'+esc(b.titolo)+'</h2><p>'+esc(b.intro)+'</p><table class="griglia"><tr>'
          + b.colonne.map(c=>'<th>'+esc(c)+'</th>').join("")+'</tr>'
          + b.righe.map(r=>'<tr>'+r.map(c=>'<td>'+(String(c||"").trim()?esc(c):'&nbsp;')+'</td>').join("")+'</tr>').join("")
          + '</table><p class="pic">'+esc(b.nota)+'</p>';
      }
      if(b.t==="numerato"){
        h+='<h2>'+esc(b.titolo)+'</h2><ol>'
          + b.righe.map(x=>'<li><b>'+esc(x[0])+'.</b> '+esc(x[1].replace("⚠️ ",""))+'</li>').join("")
          + '</ol>';
      }
      if(b.t==="firme"){
        /* ⛔ 23 agosto: se c'e' il disegno della firma va SOPRA la riga.
           Un nome scritto non e' una firma. */
        const dis=(img)=>img?'<img class="segno" src="'+img+'" alt="firma">':'<div class="vuoto"></div>';
        h+=(b.vessatorie?'<p class="pic">'+esc(b.vessatorie)+'</p>':'')+'<div class="firme">'
          + b.colonne.map(c=>'<div>'+dis(c[2])+'<div class="riga"></div>'+esc(c[0])
              +(c[1]?'<div class="pic">'+esc(c[1])+'</div>':'')+'</div>').join("")
          + '</div>'
          /* ⛔ 24 agosto 2026 — LA SECONDA FIRMA STA DALLA PARTE DEL CONDUTTORE.
             Al collaudo era disegnata nella colonna di SINISTRA, sotto «Il
             Locatore»: chi legge pensa che l'abbia firmata il locatore. E'
             la firma del Conduttore sulle clausole 6 e 8, e se sta dalla
             parte sbagliata l'approvazione specifica si contesta. */
          + (b.secondaFirma?'<div class="firme"><div></div><div>'+dis(b.secondaFirmaImg)
              +'<div class="riga"></div>'+esc(b.secondaFirma)+'</div></div>':'');
      }
    });
    const w=window.open("","_blank","width=980,height=1100");
    if(!w){toast("Il browser ha bloccato la finestra di stampa");return;}
    w.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>'+esc(titolo)+'</title><style>'
      + 'body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222;margin:28px;font-size:14px;line-height:1.5}'
      + '.tst{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:18px}'
      + 'h1{font-size:20px;margin:0 0 4px}.dx{text-align:right}.tit{font-size:20px;font-weight:700}'
      + '.pic{color:#666;font-size:13px}'
      + 'h2{font-size:15px;margin:20px 0 6px;text-transform:uppercase;letter-spacing:.4px}'
      + 'table{width:100%;border-collapse:collapse}'
      + 'td{padding:5px 0;border-bottom:1px solid #eee;vertical-align:top}'
      + 'td.l{color:#666;width:42%}td.v{font-weight:600}'
      + 'table.griglia td,table.griglia th{border:1px solid #bbb;padding:7px 8px;text-align:left;font-size:13px}'
      + 'ol{padding-left:20px}ol li{margin-bottom:7px}'
      + '.firme{display:flex;gap:40px;margin-top:34px}.firme>div{flex:1;font-size:13px}'
      + '.riga{border-top:1px solid #222;margin-bottom:5px;height:0}'
      + '.segno{display:block;max-width:100%;height:46px;object-fit:contain;object-position:left bottom}'
      + '.vuoto{height:46px}'
      + '@media print{body{margin:14mm}}'
      + '</style></head><body>'+h+'</body></html>');
    w.document.close();
    w.onload=()=>{w.focus();w.print();};
    setTimeout(()=>{try{w.focus();w.print();}catch(e){}},400);
  }

  /* ---- in PDF ---- */
  async function nolContrattoPdf(n){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    n=await nolContrattoNumero(n);
    if(!nolContrattoPronto(n)) return;
    return nolDocPdf(await nolContrattoDati(n));
  }
  function nolDocPdf(dati){
    if(!(window.jspdf&&window.jspdf.jsPDF)){toast("Il PDF non è disponibile adesso");return;}
    const {blocchi,titolo}=dati;
    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    const M=16, R=210-M, L=R-M; let y=20;
    const salta=(h)=>{ if(y+h>282){doc.addPage();y=20;} };
    /* ⛔ 23 agosto 2026 — LE FACCINE NEL PDF.
       Provando il PDF per davvero (prima il banco bloccava jsPDF e non si
       provava mai) e' saltato fuori che «⚠️ Nessuna foto allegata» sul
       foglio diventava «& þ Nessuna foto allegata»: i caratteri fuori dal
       Latin-1 le font standard del PDF non li sanno scrivere e li storpiano.
       Qui si tolgono, e le virgolette e i trattini strani si raddrizzano. */
    const pulisci=(t)=>String(t==null?"":t)
      .replace(/[‘’]/g,"'").replace(/[“”]/g,'"')
      .replace(/[–—]/g,"-").replace(/…/g,"...")
      .replace(/[^\x00-\xFF€]/g,"")
      .replace(/[ \t]{2,}/g," ").trim();
    const testo=(t,x,larg,size,stile,col)=>{
      doc.setFont("helvetica",stile||"normal");doc.setFontSize(size||10);
      doc.setTextColor(col==null?30:col);
      const linee=doc.splitTextToSize(pulisci(t),larg);
      linee.forEach(l=>{ salta(6); doc.text(l,x,y); y+=size>=13?6.5:5; });
    };
    blocchi.forEach(b=>{
      if(b.t==="testata"){
        doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(pulisci(b.azienda),M,y);
        doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(pulisci(b.titolo),R,y,{align:"right"});
        y+=6;
        doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(110);
        const n1=b.sotto.length;
        b.sotto.forEach((x,i)=>doc.text(pulisci(x),M,y+i*4.2));
        doc.text(pulisci(b.dettaglio),R,y,{align:"right"});
        y+=Math.max(n1*4.2,5)+4;
        doc.setDrawColor(60);doc.setLineWidth(.5);doc.line(M,y,R,y);doc.setLineWidth(.2);y+=7;
        doc.setTextColor(30);
        return;
      }
      if(b.t==="coppie"){
        const r=b.righe.filter(x=>x[1]!=null&&x[1]!=="");
        if(!r.length) return;
        salta(14); testo(b.titolo.toUpperCase(),M,L,11,"bold"); y+=1;
        r.forEach(x=>{
          salta(8);
          doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.setTextColor(110);
          doc.text(pulisci(x[0]),M,y);
          doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(30);
          const linee=doc.splitTextToSize(pulisci(x[1]),L-74);
          doc.text(linee,M+74,y);
          y+=Math.max(6,linee.length*5);
          doc.setDrawColor(225);doc.line(M,y-2.5,R,y-2.5);
        });
        y+=4; return;
      }
      if(b.t==="testo"){
        salta(16); testo(b.titolo.toUpperCase(),M,L,11,"bold"); y+=1;
        b.corpo.forEach(p=>{ testo(p,M,L,9.5,"normal",60); y+=2.5; });
        y+=3; return;
      }
      if(b.t==="tabella"){
        salta(30); testo(b.titolo.toUpperCase(),M,L,11,"bold"); y+=1;
        testo(b.intro,M,L,9.5,"normal",60); y+=3;
        /* ⛔ 23 agosto: le colonne erano fisse per quattro e sommavano l'84%
           della riga — su una tabella da tre la tabella finiva a meta'
           foglio. Adesso le larghezze si scelgono in base a quante sono. */
        const nc=b.colonne.length;
        const pesi = nc===4 ? [.32,.28,.24,.16]
                   : nc===3 ? [.46,.32,.22]
                   : nc===2 ? [.55,.45]
                   : b.colonne.map(()=>1/nc);
        const larg=pesi.map(p=>L*p);
        /* ⛔ e le celle si scrivevano su UNA riga sola: «Documenti a bordo:
           libretto, dichiarazione CE» usciva tagliato a meta' su un verbale
           che si firma. Adesso vanno a capo e la riga si alza. */
        const riga=(cel,grassetto)=>{
          doc.setFont("helvetica",grassetto?"bold":"normal");doc.setFontSize(9);
          const linee=cel.map((c,i)=>doc.splitTextToSize(pulisci(c),larg[i]-3).slice(0,4));
          const quante=Math.max(1,...linee.map(l=>l.length));
          const alta=4+quante*4;
          salta(alta+4);
          doc.setTextColor(30);
          let x=M;
          cel.forEach((c,i)=>{ doc.rect(x,y-4,larg[i],alta);
            linee[i].forEach((ln,k)=>doc.text(ln,x+1.5,y+1+k*4));
            x+=larg[i]; });
          y+=alta;
        };
        doc.setDrawColor(150);
        riga(b.colonne,true);
        b.righe.forEach(r=>riga(r,false));
        y+=3; if(b.nota){ testo(b.nota,M,L,9,"normal",110); y+=3; } return;
      }
      if(b.t==="numerato"){
        salta(16); testo(b.titolo.toUpperCase(),M,L,11,"bold"); y+=1;
        b.righe.forEach((x,i)=>{
          salta(10);
          doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(30);
          doc.text(pulisci((i+1)+". "+x[0]),M,y); y+=4.6;
          testo(x[1].replace("⚠️ ",""),M+4,L-4,9,"normal",60); y+=2.5;
        });
        y+=2; return;
      }
      if(b.t==="firme"){
        salta(56);
        if(b.vessatorie){ testo(b.vessatorie,M,L,9,"normal",110); y+=8; }
        const meta=(L-10)/2;
        /* ⛔ 23 agosto: il disegno della firma va SOPRA la riga, non un nome
           scritto a macchina. Se non c'e', resta lo spazio bianco per
           firmare a penna, come prima. */
        const segno=(img,x)=>{ if(!img) return;
          try{ doc.addImage(img,"PNG",x,y-17,Math.min(meta,58),16); }catch(e){} };
        y+=17;
        segno(b.colonne[0][2],M); segno(b.colonne[1][2],M+meta+10);
        doc.setDrawColor(60);
        doc.line(M,y,M+meta,y); doc.line(M+meta+10,y,R,y); y+=4.5;
        doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.setTextColor(30);
        doc.text(pulisci(b.colonne[0][0]),M,y); doc.text(pulisci(b.colonne[1][0]),M+meta+10,y); y+=4.5;
        /* ⚠️ 23 agosto: sotto la riga della firma mancava il NOME, che sulla
           carta stampata c'era: due fogli uguali che dicevano cose diverse. */
        doc.setFontSize(8.5);doc.setTextColor(110);
        if(b.colonne[0][1]) doc.text(pulisci(b.colonne[0][1]),M,y);
        if(b.colonne[1][1]) doc.text(pulisci(b.colonne[1][1]),M+meta+10,y);
        y+=10;
        if(b.secondaFirma){
          /* ⛔ 24 agosto 2026: stessa correzione della carta. La seconda
             firma va nella colonna DESTRA, quella del Conduttore. E
             l'etichetta va a capo da sola: in mezza pagina non ci sta su
             una riga sola, e prima finiva tagliata. */
          salta(30);
          const x2=M+meta+10;
          y+=17; segno(b.secondaFirmaImg,x2);
          doc.line(x2,y,R,y); y+=4.5;
          doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(110);
          doc.splitTextToSize(pulisci(b.secondaFirma),meta).forEach(l=>{ doc.text(l,x2,y); y+=4; });
        }
        return;
      }
    });
    doc.save(titolo.replace(/[^a-zA-Z0-9 _-]/g,"").replace(/\s+/g,"-")+".pdf");
    toast("Contratto scaricato ✔");
  }
