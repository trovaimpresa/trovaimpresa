// [SPOSTATO] nol-fatture.js: era dentro nol-core.js, righe 3033-3418, spostato identico.

  /* ================================================================
     LE FATTURE DEL NOLEGGIO — 23 agosto 2026

     ⛔ E' il pezzo che i DDT e i verbali hanno sbloccato. Con un documento
     di trasporto per ogni uscita, la legge permette la FATTURA DIFFERITA
     RIEPILOGATIVA (art. 21 c.4 lett. a DPR 633/72): una fattura sola al
     mese per cliente, emessa entro il 15 del mese dopo, invece di una per
     ogni uscita. Con venti noleggi al mese sono diciannove fatture in meno.

     ⚠️ I RATEI. Un noleggio che parte il 25 di marzo e rientra il 6 di
     aprile non sta tutto in un mese: la fattura di marzo prende i giorni
     di marzo, quella di aprile il resto. Il conto lo fa qui sotto
     fattRigaDa(), e la riga si salva com'e' stata calcolata quel giorno —
     fra un anno si deve poter rispondere «ecco come l'avevo fatto».

     ⛔ LA CAUZIONE NON ENTRA IN FATTURA. E' un deposito, non un
     corrispettivo: sta nella sua sezione e nella sua ricevuta.

     ⛔ UN NOLEGGIO SI FATTURA UNA VOLTA SOLA. Appena finisce dentro una
     fattura si porta scritto quale (fattura_id) e sparisce da quelli da
     fatturare. Se la fattura si butta, tornano liberi da soli.
     ================================================================ */
  const FATTNOL_ETI={bozza:"Bozza",emessa:"Emessa, da incassare",pagata:"Pagata"};
  const FATTNOL_COL={bozza:"#757575",emessa:"#e65100",pagata:"#2e7d32"};
  let fattnolRighe=[], fattnolApertoId=null;

  /* «2026-03» → il primo e l'ultimo giorno di quel mese */
  function fattMesePeriodo(v){
    if(!/^\d{4}-\d{2}$/.test(v||"")) return null;
    const a=+v.slice(0,4), m=+v.slice(5,7);
    const ultimo=new Date(Date.UTC(a,m,0)).getUTCDate();
    return {dal:v+"-01", al:v+"-"+String(ultimo).padStart(2,"0")};
  }
  function _gg(a,b){ return Math.round((new Date(b)-new Date(a))/86400000)+1; }

  /* la riga di fattura di un noleggio dentro un periodo, col rateo.
     Torna null se quel noleggio in quei giorni non c'entra niente. */
  function fattRigaDa(n,dal,al){
    const d1=n.data_uscita;
    const d2=n.data_rientro_effettivo||n.data_rientro_prevista||al;
    if(!d1) return null;
    const a=d1>dal?d1:dal, b=d2<al?d2:al;
    if(a>b) return null;
    const gTot=_gg(d1,d2), gIn=_gg(a,b);
    const imp=+n.importo||0;
    /* ⚠️ se il noleggio sta tutto dentro il periodo NON si divide: si
       prende l'importo intero. Dividere e rimoltiplicare per lo stesso
       numero lascia dei centesimi che poi non tornano col contratto. */
    /* ⛔ 4 settembre 2026 — il rateo passa da _centMulDiv: importo x giorni
       dentro / giorni totali, contato con numeri interi. In virgola mobile
       un rateo che casca su mezzo centesimo andava in giu' e la somma delle
       righe non tornava piu' col contratto. */
    const quota=(gIn>=gTot||gTot<=0)?imp
      :((typeof _centMulDiv==="function")?_centMulDiv(imp,gIn,gTot):Math.round(imp*gIn/gTot*100)/100);
    return {noleggio_id:n.id,
      voce:"Noleggio "+(n.mezzo||"attrezzatura"),
      dettaglio:"dal "+fdate(a)+" al "+fdate(b)+" — "+gIn+(gIn===1?" giorno":" giorni")+
        (gIn<gTot?" (rateo su "+gTot+")":"")+
        (n.ddt_uscita_num?" · DDT "+n.ddt_uscita_num:""),
      giorni:gIn, importo:quota};
  }

  async function loadFattureNol(){
    if(!(sb&&sbUid)) return;
    const box=$("#fattnol-body"); if(!box) return;
    const [{data:ff},{data:nn}]=await Promise.all([
      sb.from("nol_fatture").select("*").eq("user_id",sbUid).is("eliminato_il",null)
        .order("data",{ascending:false}),
      sb.from("nol_noleggi").select("id,importo,fattura_id,eliminato_il").eq("user_id",sbUid)
    ]);
    const F=ff||[];
    const daFatt=(nn||[]).filter(n=>!n.eliminato_il&&(+n.importo||0)>0&&!n.fattura_id);
    const scrivi=(id,txt)=>{const e=$("#"+id);if(e)e.textContent=txt;};
    scrivi("kf-dafatturare",String(daFatt.length));
    scrivi("kf-daincassare",_eur(F.filter(f=>f.stato==="emessa").reduce((s,f)=>s+(+f.totale||0),0)));
    scrivi("kf-incassate",_eur(F.filter(f=>f.stato==="pagata").reduce((s,f)=>s+(+f.totale||0),0)));
    if(!F.length){
      box.innerHTML='<p style="color:#666;padding:8px">Nessuna fattura del noleggio. Premi «+ Nuova fattura»: scegli il cliente e il mese, il resto lo trova lui.</p>';
      return;
    }
    box.innerHTML=F.map(f=>{
      const st=f.stato||"bozza", col=FATTNOL_COL[st]||"#757575";
      const quante=(Array.isArray(f.righe)?f.righe:[]).length;
      return nolCard({col:col,
        titolo:esc(f.numero?"n. "+f.numero:"(senza numero)"),
        eti:[{t:esc((FATTNOL_ETI[st]||st).toUpperCase())}],
        corpo:`<div class="sub">${esc(f.cliente||"Cliente non indicato")}</div>
        <div class="sub2">${esc((f.periodo_dal&&f.periodo_al?fdate(f.periodo_dal)+" — "+fdate(f.periodo_al):"periodo non indicato")+
          " · "+quante+(quante===1?" riga":" righe"))}</div>
        <div class="sub2"><b>${esc(_eur(f.totale))}</b>${esc(" (imponibile "+_eur(f.imponibile)+")")}${
          f.pagata_il?esc(" · pagata il "+fdate(f.pagata_il)):""}</div>${
          f.sdi_stato?`<div class="sub2"><b>SDI:</b> ${esc(({inviata:"partita",consegnata:"consegnata",non_consegnata:"nel cassetto fiscale",scartata:"scartata",errore:"non partita"})[f.sdi_stato]||f.sdi_stato)}${f.sdi_ambiente==="test"?" (prova)":""}</div>`:""}`,
        pulsanti:nolPulsanti("fattnol",f.id)});
    }).join("");
  }
  $('[data-tab="fatture"]')?.addEventListener("click",loadFattureNol);

  async function schedaFatturaNol(f){
    const isNew=!f; f=f||{};
    fattnolApertoId=f.id||null;
    fattnolRighe=Array.isArray(f.righe)?f.righe.map(x=>Object.assign({},x)):[];
    const v=(k)=>esc(f[k]==null?"":f[k]);
    const st=f.stato||"bozza";
    openSheet(`<h3>${isNew?"Nuova fattura":"Fattura "+(f.numero?"n. "+esc(f.numero):"(bozza)")}</h3>
      ${nolPulsantiScheda("fattnol",f.id||"")}
      <div class="row2">
        <div class="field"><label>Cliente *</label><select id="nf-cliente"></select></div>
        <div class="field"><label>Mese da fatturare</label><input type="month" id="nf-mese"></div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Il periodo</h4>
        <div class="nol-due">
          <div><label>Dal</label><input type="date" id="nf-dal" value="${v('periodo_dal')}"></div>
          <div><label>Al</label><input type="date" id="nf-al" value="${v('periodo_al')}"></div>
        </div>
        <div class="nol-azioni">
          <button type="button" class="nol-az nol-az-apri" data-action="fattnol-trova">Trova i noleggi del periodo</button>
        </div>
        <div id="nf-avviso"></div>
        <p style="margin:8px 0 0;font-size:13px;color:#666">Scegli il mese e le due date si riempiono da sole. Un noleggio a cavallo di due mesi entra <b>a rate</b>: solo i giorni che stanno dentro.</p>
      </div>

      <div class="nol-conto"><h4>Le righe della fattura</h4>
        <div id="nf-righe"></div>
        <button type="button" class="nol-agg" id="nf-riga-add">+ Aggiungi una riga a mano</button>
        <div class="nol-due nol-cam" style="margin-top:12px">
          <div><label>IVA %</label><input id="nf-iva" inputmode="decimal" value="${f.iva_perc==null?"22":String(f.iva_perc).replace(".",",")}"></div>
          <div><label>&nbsp;</label><p style="margin:0;font-size:13px;color:#666;padding-top:9px">Nel <b>nolo a caldo</b> in edilizia pu&ograve; valere il reverse charge: in quel caso metti 0 e scrivilo nelle note.</p></div>
        </div>
        <div id="nf-totali"></div>
      </div>

      <div class="nol-riq nol-cam">
        <h4>Numero e stato</h4>
        <div class="nol-due">
          <div><label>Numero</label><input id="nf-numero" value="${v('numero')}" placeholder="si assegna da solo"></div>
          <div><label>Data della fattura</label><input type="date" id="nf-data" value="${v('data')}"></div>
        </div>
        <div style="margin-top:10px"><div class="seg" id="nf-stato">
          ${["bozza","emessa","pagata"].map(s=>`<button type="button" data-v="${s}" class="${st===s?"on":""}">${esc(FATTNOL_ETI[s])}</button>`).join("")}
        </div></div>
        <div class="nol-due" style="margin-top:10px">
          <div><label>Pagata il</label><input type="date" id="nf-pagata" value="${v('pagata_il')}"></div>
          <div><label>&nbsp;</label><p style="margin:0;font-size:13px;color:#666;padding-top:9px">Il numero si prende dal contatore dell'azienda quando la metti su <b>Emessa</b>, se non lo scrivi tu.</p></div>
        </div>
      </div>

      <div class="field"><label>Note</label><input id="nf-note" value="${v('note')}" placeholder="Modalità di pagamento, riferimenti, reverse charge…"></div>

      <div class="nol-azioni">
        <button type="button" class="nol-az nol-az-apri" data-action="fattnol-stampa" data-id="${f.id||""}">Stampa la fattura</button>
        <button type="button" class="nol-az" data-action="fattnol-pdf" data-id="${f.id||""}">Fattura in PDF</button>
        ${f.id&&f.numero&&(st==="emessa"||st==="pagata")?`<button type="button" class="nol-az nol-az-apri" data-nol-sdi="${f.id}">${f.sdi_uuid&&f.sdi_stato!=="scartata"?"Stato SDI":"Invia allo SDI"}</button>`:""}
      </div>
      ${f.sdi_stato?`<p class="nsdi-riga">SDI: <b>${esc(({inviata:"partita, aspettiamo lo SDI",consegnata:"consegnata al cliente",non_consegnata:"nel cassetto fiscale del cliente",scartata:"scartata dallo SDI",errore:"non partita"})[f.sdi_stato]||f.sdi_stato)}</b>${f.sdi_ambiente==="test"?" (prova)":""}</p>`:""}
      <p style="margin:10px 0 0;font-size:13px;color:#666">Salva prima, poi stampa.</p>
      ${nolDocBlocco("fattnol",f.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-fattnol" data-id="${f.id||""}">${isNew?"Crea":"Salva"}</button></div>`);

    const {data:cl}=await sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).order("nome");
    const sel=$("#nf-cliente");
    if(sel) sel.innerHTML='<option value="">— Seleziona cliente —</option>'+
      (cl||[]).map(x=>`<option value="${x.id}" data-nome="${esc(x.nome||"")}">${esc(x.nome||"")}</option>`).join("");
    if(sel&&f.cliente_id) sel.value=f.cliente_id;
    if($("#nf-mese")&&f.periodo_dal) $("#nf-mese").value=String(f.periodo_dal).slice(0,7);
    if(isNew&&$("#nf-mese")&&!$("#nf-mese").value){
      /* di solito si fattura il mese appena finito */
      const oggi=new Date(todayStr());
      const m=new Date(Date.UTC(oggi.getUTCFullYear(),oggi.getUTCMonth()-1,1)).toISOString().slice(0,7);
      $("#nf-mese").value=m;
      const p=fattMesePeriodo(m);
      if(p){$("#nf-dal").value=p.dal;$("#nf-al").value=p.al;}
    }
    bindSeg("nf-stato");
    fattnolDisegnaRighe();
  }

  function fattnolDisegnaRighe(){
    const box=$("#nf-righe"); if(!box) return;
    box.innerHTML=fattnolRighe.length
      ? fattnolRighe.map((r,i)=>`<div class="nf-riga">
          <input data-fr="voce" data-i="${i}" value="${esc(r.voce==null?"":r.voce)}" placeholder="Descrizione">
          <input data-fr="dettaglio" data-i="${i}" value="${esc(r.dettaglio==null?"":r.dettaglio)}" placeholder="Periodo, giorni, DDT">
          <input data-fr="importo" data-i="${i}" inputmode="decimal" value="${esc(r.importo==null?"":String(r.importo).replace(".",","))}" placeholder="0,00">
          <button type="button" class="nol-cons-via" data-frvia="${i}" title="Togli questa riga">&#10005;</button>
        </div>`).join("")
      : '<p style="margin:0;color:#666;font-size:14px">Nessuna riga. Premi «Trova i noleggi del periodo», oppure aggiungine una a mano.</p>';
    fattnolTotali();
  }
  function fattnolTotali(){
    const box=$("#nf-totali"); if(!box) return;
    const imp=fattnolRighe.reduce((s,r)=>s+(+r.importo||0),0);
    const p=_numIt($("#nf-iva")?$("#nf-iva").value:"22");
    const iva=(typeof _centPerc==="function")?_centPerc(imp,p):Math.round(imp*p)/100;
    box.innerHTML=`<table><tr><td>Imponibile</td><td class="n">${esc(_eur(imp))}</td></tr>
      <tr><td>IVA ${esc(String(p).replace(".",","))}%</td><td class="n">${esc(_eur(iva))}</td></tr>
      <tr class="tot"><td>TOTALE</td><td class="n">${esc(_eur(imp+iva))}</td></tr></table>
      <p class="cauz">La cauzione non entra in fattura: &egrave; un deposito, non un corrispettivo.</p>`;
  }
  document.addEventListener("click",e=>{
    if(e.target.closest("#nf-riga-add")){
      fattnolRighe.push({voce:"",dettaglio:"",importo:0}); fattnolDisegnaRighe(); return;
    }
    const via=e.target.closest("#nf-righe [data-frvia]");
    if(via){ fattnolRighe.splice(+via.dataset.frvia,1); fattnolDisegnaRighe(); return; }
  });
  document.addEventListener("input",e=>{
    if(e.target.id==="nf-iva"){ fattnolTotali(); return; }
    if(e.target.id==="nf-mese"){
      const p=fattMesePeriodo(e.target.value);
      if(p){ if($("#nf-dal"))$("#nf-dal").value=p.dal; if($("#nf-al"))$("#nf-al").value=p.al; }
      return;
    }
    const c=e.target.closest("#nf-righe [data-fr]"); if(!c) return;
    const i=+c.dataset.i; if(!fattnolRighe[i]) return;
    if(c.dataset.fr==="importo"){ fattnolRighe[i].importo=_numIt(c.value); fattnolTotali(); }
    else fattnolRighe[i][c.dataset.fr]=c.value;
  });

  async function fattnolTrova(){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const cid=$("#nf-cliente")?$("#nf-cliente").value:"";
    const dal=$("#nf-dal")?$("#nf-dal").value:"", al=$("#nf-al")?$("#nf-al").value:"";
    if(!cid){toast("Scegli prima il cliente");return;}
    if(!dal||!al){toast("Scegli il periodo");return;}
    const {data}=await sb.from("nol_noleggi").select("*").eq("user_id",sbUid).eq("cliente_id",cid);
    const tutti=(data||[]).filter(n=>!n.eliminato_il&&(+n.importo||0)>0);
    const dentro=tutti.filter(n=>!!fattRigaDa(n,dal,al));
    /* ⛔ chi sta gia' su un'altra fattura NON si prende: si dice e basta */
    const liberi=dentro.filter(n=>!n.fattura_id||n.fattura_id===fattnolApertoId);
    const presi =dentro.length-liberi.length;
    fattnolRighe=liberi.map(n=>fattRigaDa(n,dal,al));
    fattnolDisegnaRighe();
    const av=$("#nf-avviso");
    if(av) av.innerHTML=!dentro.length
      ? '<div class="nol-avviso">Nessun noleggio di questo cliente in quei giorni.</div>'
      : '<div class="nol-avviso">Trovati '+dentro.length+(dentro.length===1?" noleggio":" noleggi")+
        (presi?', ma '+presi+(presi===1?" era già su un'altra fattura e non l'ho preso."
                                       :" erano già su altre fatture e non li ho presi."):". Presi tutti.")+'</div>';
    toast(fattnolRighe.length+(fattnolRighe.length===1?" riga trovata":" righe trovate"));
  }

  async function salvaFatturaNol(id){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const sel=$("#nf-cliente");
    if(!sel||!sel.value){toast("Scegli il cliente");return;}
    const righe=fattnolRighe
      .filter(r=>String(r.voce||"").trim()||(+r.importo||0))
      .map(r=>({noleggio_id:r.noleggio_id||null,voce:String(r.voce||"").trim(),
                dettaglio:String(r.dettaglio||"").trim(),giorni:r.giorni==null?null:+r.giorni,
                importo:+r.importo||0}));
    if(!righe.length){toast("La fattura non ha righe");return;}
    /* ⛔ 4 settembre 2026 — gli stessi centesimi del gestionale imprese:
       la somma si ripulisce con _cent2 (la polvere delle somme) e l'IVA
       passa da _centPerc, che moltiplica con numeri interi. */
    const imponibile=_cent(righe.reduce((s,r)=>s+r.importo,0));
    const perc=_numIt($("#nf-iva").value);
    const iva=(typeof _centPerc==="function")?_centPerc(imponibile,perc):Math.round(imponibile*perc)/100;
    let stato=segVal("nf-stato")||"bozza";
    let numero=$("#nf-numero").value.trim()||null;
    let data=$("#nf-data").value||null;
    /* ⛔ il numero si consuma dal contatore dell'azienda, come il DDT, e
       SOLO quando la fattura smette di essere una bozza: una bozza che si
       prende un numero e poi si butta lascia un buco nella numerazione. */
    if(stato!=="bozza"&&!numero){
      const {data:az}=await sb.from("gest_azienda").select("num_fattura").eq("user_id",sbUid).maybeSingle();
      const n=(az&&az.num_fattura)||1;
      numero=String(n);
      await sb.from("gest_azienda").update({num_fattura:n+1}).eq("user_id",sbUid);
    }
    if(stato!=="bozza"&&!data) data=todayStr();
    const dati={cliente_id:sel.value,
      cliente:sel.selectedOptions[0]?sel.selectedOptions[0].dataset.nome:null,
      numero,data,
      periodo_dal:$("#nf-dal").value||null, periodo_al:$("#nf-al").value||null,
      righe, imponibile, iva_perc:perc, iva, totale:_cent(imponibile+iva),
      stato, pagata_il:$("#nf-pagata").value||null,
      note:$("#nf-note").value.trim()||null};
    let fid=id;
    if(id){
      const {error}=await sb.from("nol_fatture").update(dati).eq("id",id).eq("user_id",sbUid);
      if(error){toast("Errore: "+error.message);return;}
    }else{
      const {data:ins,error}=await sb.from("nol_fatture").insert({user_id:sbUid,...dati}).select("id").maybeSingle();
      if(error){toast("Errore: "+error.message);return;}
      fid=ins?ins.id:null;
    }
    /* ⛔ i noleggi che ci sono dentro si segnano, cosi' non li si fattura
       due volte. Prima si liberano tutti quelli che erano su questa
       fattura: se ne hai tolto uno a mano, deve tornare da fatturare. */
    if(fid){
      await sb.from("nol_noleggi").update({fattura_id:null}).eq("user_id",sbUid).eq("fattura_id",fid);
      const ids=righe.map(r=>r.noleggio_id).filter(Boolean);
      for(const nid of ids){
        await sb.from("nol_noleggi").update({fattura_id:fid}).eq("id",nid).eq("user_id",sbUid);
      }
    }
    closeSheet(); loadFattureNol(); loadNoleggi();
    toast(id?"Fattura aggiornata ✔":"Fattura creata ✔");
  }

  /* ---- la fattura su carta e in PDF: stesso motore di tutto il resto ---- */
  async function nolFatturaDati(f){
    const [{data:az},{data:cl}]=await Promise.all([
      sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      f.cliente_id ? sb.from("gest_clienti").select("*").eq("id",f.cliente_id).maybeSingle()
                   : Promise.resolve({data:null})
    ]);
    const A=az||{}, C=cl||{};
    const righe=Array.isArray(f.righe)?f.righe:[];
    const perc=f.iva_perc==null?22:+f.iva_perc;
    const blocchi=[];
    blocchi.push({t:"testata",azienda:A.nome||"(compila i Dati azienda)",
      sotto:[A.piva?"P.IVA "+A.piva:"",A.indirizzo||"",
             [A.tel?"Tel "+A.tel:"",A.email||""].filter(Boolean).join("   ")].filter(Boolean),
      titolo:"FATTURA",
      dettaglio:(f.numero?"N. "+f.numero:"(bozza, senza numero)")+"   ·   del "+fdate(f.data||todayStr())});

    blocchi.push({t:"coppie",titolo:"Cliente",righe:[
      ["Ragione sociale",C.nome||f.cliente||"—"],
      ["Indirizzo",C.indirizzo||null],
      ["P.IVA / Cod. Fiscale",C.piva||null],
      ["Email",C.email||null],
      ["Periodo fatturato",(f.periodo_dal&&f.periodo_al)?(fdate(f.periodo_dal)+" — "+fdate(f.periodo_al)):null]
    ]});

    blocchi.push({t:"tabella",titolo:"Prestazioni",
      intro:"Noleggio di attrezzature. Gli importi sono al netto dell'IVA.",
      colonne:["Descrizione","Periodo e giorni","Importo"],
      righe:righe.map(r=>[r.voce||"",r.dettaglio||"",_eur(r.importo)]),
      nota:"Le attrezzature sono state consegnate e riconsegnate con i documenti di trasporto richiamati sopra."});

    blocchi.push({t:"coppie",titolo:"Totali",righe:[
      ["Imponibile",_eur(f.imponibile)],
      ["IVA "+String(perc).replace(".",",")+"%",_eur(f.iva)],
      ["TOTALE DA PAGARE",_eur(f.totale)]
    ]});

    const testo=["Fattura differita riepilogativa emessa ai sensi dell'art. 21 comma 4 lettera a) del D.P.R. 633/1972, relativa alle consegne effettuate nel periodo indicato e documentate dai documenti di trasporto richiamati."];
    if(perc===0) testo.push("Operazione senza applicazione dell'IVA: l'imposta è assolta dal committente ove ricorra il regime di inversione contabile.");
    if(f.note) testo.push(f.note);
    if(A.iban) testo.push("Pagamento con bonifico su IBAN "+A.iban+".");
    blocchi.push({t:"testo",titolo:"Note",corpo:testo});

    return {blocchi,titolo:"Fattura "+(f.numero?"n. "+f.numero:"bozza")+" — "+(C.nome||f.cliente||"cliente")};
  }
  async function fatturaNolFoglio(id,inPdf){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const f=await nolLeggi("fattnol",id);
    if(!f){toast("Salva prima la fattura, poi stampa");return;}
    const dati=await nolFatturaDati(f);
    if(inPdf) nolDocPdf(dati); else nolDocStampa(dati);
  }
  window.__nolFatturaPerProva=(f)=>nolFatturaDati(f);
  window.nolFatturaStampaProva=async(f)=>nolDocStampa(await nolFatturaDati(f));
  window.__fattRigaPerProva=(n,dal,al)=>fattRigaDa(n,dal,al);

  async function loadDocumenti(){
    if(!(sb&&sbUid)) return;
    const box=$("#documenti-body"); if(!box) return;
    const {data,error}=await sb.from("nol_noleggi").select("*")
      .eq("user_id",sbUid).order("data_uscita",{ascending:false});
    if(error){box.innerHTML='<p style="color:#666;padding:8px">'+esc(error.message)+'</p>';return;}
    docsCache=data||[];
    const q=(docsQ||"").trim().toLowerCase();
    const vis=docsCache.filter(x=>!q||((x.mezzo||"")+" "+(x.cliente||"")+" "+(x.contratto_num||"")).toLowerCase().includes(q));
    if(!docsCache.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun noleggio: le carte si attaccano a un noleggio.</p>';return;}
    if(!vis.length){box.innerHTML='<p style="color:#666;padding:8px">Niente che si chiami cos&igrave;.</p>';return;}
    box.innerHTML=vis.map(n=>{
      const fogli=DOCS_FOGLI.filter(f=>!f.solo||f.solo(n));
      const mancano=fogli.filter(f=>!f.ce(n));
      return nolCard({col:mancano.length?"#c62828":"#2e7d32",
        titolo:esc(n.mezzo||"—"),
        eti:[{t:mancano.length?esc("MANCANO "+mancano.length):"COMPLETO"}],
        corpo:`<div class="sub">${n.cliente?"Cliente: "+esc(n.cliente):"Cliente non indicato"}${
          n.contratto_num?" · contratto n. "+esc(n.contratto_num):""}</div>
        <div class="doc-bollini">${fogli.map(f=>
          `<span class="doc-bollino ${f.ce(n)?"si":"no"}">${f.ce(n)?"✓":"✗"} ${esc(f.lab)}</span>`).join("")}</div>`,
        pulsanti:nolPulsanti("documenti",n.id)});
    }).join("");
  }
  $('[data-tab="documenti"]')?.addEventListener("click",loadDocumenti);
  $("#documenti-search")?.addEventListener("input",e=>{docsQ=e.target.value;loadDocumenti();});
