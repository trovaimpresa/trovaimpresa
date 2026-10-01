// [SPOSTATO] nol-firme-documenti.js: era dentro nol-core.js, righe 3419-3805, spostato identico.

  /* ================================================================
     LA FIRMA COL DITO — 23 agosto 2026

     ⛔ PERCHE'. Sul verbale c'era scritto un NOME. Un nome scritto non e'
     una firma: chi contesta i danni dice «io non ho firmato niente», e ha
     ragione. Il verbale vale perche' e' fatto in contraddittorio e
     SOTTOSCRITTO dalle due parti; senza sottoscrizione e' un foglio che ti
     sei scritto da solo.

     ⛔ UN RIQUADRO SOLO, riusato dappertutto: i due verbali, il contratto
     e la seconda firma delle clausole vessatorie. Se domani serve una
     firma su un altro foglio, si chiama questo e basta.

     ⚠️ La firma e' un disegno PNG scritto come testo (sui 10 KB) e sta
     ATTACCATO alla riga del noleggio, non in un file a parte: un file si
     perde, e il verbale resterebbe senza firma senza che nessuno se ne
     accorga.

     ⚠️ Si disegna coi «pointer events», che sul telefono sono il dito e
     sul computer il mouse: uno solo, e vale per tutti e due.
     ================================================================ */
  let firmeVal={};

  function firmaBlocco(chiave,etichetta,nota){
    const v=firmeVal[chiave]||"";
    return `<div class="firma-riq" id="firma-riq-${chiave}">
      <label class="firma-eti">${esc(etichetta)}</label>
      <div class="firma-area" id="firma-area-${chiave}">
        ${v?`<img class="firma-img" id="firma-img-${chiave}" src="${v}" alt="firma">`
           :`<canvas class="firma-tela" id="firma-tela-${chiave}" width="800" height="240"></canvas>`}
      </div>
      <div class="nol-azioni" style="margin-top:6px">
        ${v?`<button type="button" class="nol-az" data-action="firma-rifai" data-k="${chiave}">Rifai la firma</button>`
           :`<button type="button" class="nol-az" data-action="firma-pulisci" data-k="${chiave}">Cancella</button>`}
      </div>
      <p class="firma-nota">${v?"Firmata &#10003;":esc(nota||"Firma qui col dito, o col mouse.")}</p>
    </div>`;
  }

  /* si attacca DOPO che il riquadro e' nella pagina */
  function firmaAttiva(chiave){
    const tela=document.getElementById("firma-tela-"+chiave);
    if(!tela||tela.dataset.pronta==="1") return;
    tela.dataset.pronta="1";
    const ctx=tela.getContext("2d");
    ctx.lineWidth=3; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#111";
    let giu=false, ultimo=null, scritto=false;
    const dove=ev=>{
      const r=tela.getBoundingClientRect();
      return {x:(ev.clientX-r.left)*(tela.width/r.width),
              y:(ev.clientY-r.top)*(tela.height/r.height)};
    };
    const inizio=ev=>{ giu=true; ultimo=dove(ev); ev.preventDefault();
      try{ tela.setPointerCapture(ev.pointerId); }catch(e){} };
    const muovi=ev=>{
      if(!giu) return;
      const p=dove(ev);
      ctx.beginPath(); ctx.moveTo(ultimo.x,ultimo.y); ctx.lineTo(p.x,p.y); ctx.stroke();
      ultimo=p; scritto=true; ev.preventDefault();
    };
    const fine=()=>{ if(!giu) return; giu=false;
      if(scritto){ firmeVal[chiave]=firmaRitaglia(tela); } };
    tela.addEventListener("pointerdown",inizio);
    tela.addEventListener("pointermove",muovi);
    tela.addEventListener("pointerup",fine);
    tela.addEventListener("pointercancel",fine);
    tela.addEventListener("pointerleave",fine);
  }
  /* ⛔ SI RITAGLIA INTORNO AL SEGNO. Una tela da 800x240 quasi tutta
     trasparente pesava 250 KB e nel PDF diventava tre quarti di mega, per
     una firma grande come un francobollo in mezzo al bianco. Ritagliata:
     poche decine di KB, e sul foglio si vede grande e diritta. */
  function firmaRitaglia(tela){
    let d;
    try{ d=tela.getContext("2d").getImageData(0,0,tela.width,tela.height); }
    catch(e){ return tela.toDataURL("image/png"); }
    const a=d.data, W=tela.width, H=tela.height;
    let x0=W, y0=H, x1=-1, y1=-1;
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      if(a[(y*W+x)*4+3]>10){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    }
    if(x1<0) return "";
    const p=10;
    x0=Math.max(0,x0-p); y0=Math.max(0,y0-p);
    x1=Math.min(W-1,x1+p); y1=Math.min(H-1,y1+p);
    const w=x1-x0+1, h=y1-y0+1;
    const c2=document.createElement("canvas"); c2.width=w; c2.height=h;
    c2.getContext("2d").drawImage(tela,x0,y0,w,h,0,0,w,h);
    return c2.toDataURL("image/png");
  }
  function firmaPulisci(chiave){
    const tela=document.getElementById("firma-tela-"+chiave);
    if(tela) tela.getContext("2d").clearRect(0,0,tela.width,tela.height);
    delete firmeVal[chiave];
  }
  function firmaRifai(chiave){
    delete firmeVal[chiave];
    const riq=document.getElementById("firma-riq-"+chiave);
    if(!riq) return;
    const eti=riq.querySelector(".firma-eti");
    const nuovo=document.createElement("div");
    nuovo.innerHTML=firmaBlocco(chiave,eti?eti.textContent:"Firma","");
    riq.replaceWith(nuovo.firstElementChild);
    firmaAttiva(chiave);
  }
  /* le firme di partenza, lette dalla riga del noleggio */
  function firmeDa(n,coppie){
    firmeVal={};
    coppie.forEach(([chiave,campo])=>{ if(n&&n[campo]) firmeVal[chiave]=n[campo]; });
  }
  function firmaSveglia(chiavi){ chiavi.forEach(firmaAttiva); }
  document.addEventListener("click",e=>{
    const p=e.target.closest('[data-action="firma-pulisci"]');
    if(p){ firmaPulisci(p.dataset.k); return; }
    const r=e.target.closest('[data-action="firma-rifai"]');
    if(r){ firmaRifai(r.dataset.k); return; }
  });
  window.__firmaPerProva=(k)=>firmeVal[k]||"";

  function docsRiquadro(n,momento){
    const rientro=(momento==="rientro");
    const lista=docsCheck[momento];
    const fatto=rientro?n.verbale_rientro_il:n.verbale_uscita_il;
    const ddt  =rientro?n.ddt_rientro_num  :n.ddt_uscita_num;
    return `<div class="nol-riq nol-cam">
      <h4>${rientro?"Al rientro":"Alla consegna"}${fatto?" — verbale chiuso il "+esc(cestQuando(fatto)):""}</h4>
      <p style="margin:0 0 10px;font-size:14px;color:#666">${rientro
        ? "Le stesse voci della consegna, ricontrollate una per una. Quello che qui &egrave; segnato DANNO e alla consegna no, &egrave; un danno del cliente."
        : "Si controlla insieme al cliente, voce per voce. &Egrave; questa la carta che al rientro vale."}</p>
      <div class="verb-lista">${lista.map((x,i)=>`
        <div class="verb-riga">
          <div class="verb-voce">${esc(x.voce)}</div>
          <div class="seg verb-seg" data-mom="${momento}" data-i="${i}">
            ${["ok","usura","danno"].map(st=>`<button type="button" data-v="${st}" class="${x.stato===st?"on":""}">${esc(VERBALE_BREVI[st])}</button>`).join("")}
          </div>
          <input class="verb-nota" data-mom="${momento}" data-i="${i}" placeholder="Nota" value="${esc(x.nota||"")}">
        </div>`).join("")}</div>
      <div class="nol-due" style="margin-top:12px">
        <div><label>Chi firma per il cliente</label>
          <input id="verb-firma-${momento}" value="${esc((rientro?n.firma_rientro:n.firma_uscita)||"")}" placeholder="Cognome e nome"></div>
        <div><label>Numero del DDT</label>
          <input value="${esc(ddt||"")}" placeholder="Si assegna da solo" readonly style="background:#f2f5f8"></div>
      </div>
      ${firmaBlocco("verb-"+momento,
        rientro?"Firma del cliente alla riconsegna":"Firma del cliente alla consegna",
        "Dai il telefono al cliente e fallo firmare qui: è la sottoscrizione che rende il verbale una prova.")}
      <div class="nol-azioni" style="margin-top:14px">
        <button type="button" class="nol-az nol-az-apri" data-action="verb-stampa" data-m="${momento}">Stampa il verbale</button>
        <button type="button" class="nol-az" data-action="verb-pdf" data-m="${momento}">Verbale in PDF</button>
        <button type="button" class="nol-az" data-action="ddt-stampa" data-m="${momento}">Stampa il DDT</button>
        <button type="button" class="nol-az" data-action="ddt-pdf" data-m="${momento}">DDT in PDF</button>
      </div>
      <p style="margin:10px 0 0;font-size:13px;color:#666">Il numero del DDT si prende da solo dal contatore dell'azienda la prima volta che lo stampi, e poi non cambia pi&ugrave;.</p>
    </div>`;
  }

  async function schedaDocumenti(n){
    if(!n){toast("Questo noleggio non si trova pi&ugrave;");return;}
    docsApertoId=n.id;
    docsCheck={uscita:verbaleNormalizza(n.check_uscita),
               rientro:verbaleNormalizza(n.check_rientro)};
    firmeDa(n,[["verb-uscita","firma_uscita_img"],["verb-rientro","firma_rientro_img"]]);
    const rientrato=!!n.data_rientro_effettivo;
    openSheet(`<h3>Documenti — ${esc(n.mezzo||"mezzo")}${n.cliente?" · "+esc(n.cliente):""}</h3>
      <div class="nol-riq nol-cam">
        <h4>Il contratto${n.contratto_num?" — n. "+esc(n.contratto_num):""}</h4>
        <p style="margin:0 0 10px;font-size:14px;color:#666">${n.contratto_num
          ? "Tipo di noleggio: "+(n.tipo_nolo==="caldo"?"a caldo, con un nostro operatore":"a freddo, senza operatore")+"."
          : "Il numero del contratto si scrive nella scheda del noleggio, insieme a chi user&agrave; la macchina."}</p>
        <div class="nol-azioni">
          <button type="button" class="nol-az nol-az-apri" data-action="nol-contr-stampa" data-id="${n.id}">Stampa il contratto</button>
          <button type="button" class="nol-az" data-action="nol-contr-pdf" data-id="${n.id}">Contratto in PDF</button>
          <button type="button" class="nol-az" data-action="nol-mod" data-t="noleggio" data-id="${n.id}">Apri il noleggio</button>
        </div>
      </div>
      ${docsRiquadro(n,"uscita")}
      ${rientrato?docsRiquadro(n,"rientro")
        :`<div class="nol-riq nol-cam"><h4>Al rientro</h4>
           <p style="margin:0;font-size:14px;color:#666">Il mezzo &egrave; ancora fuori. Il verbale di riconsegna e il DDT di rientro compaiono qui appena scrivi la data di rientro effettivo nella scheda del noleggio.</p></div>`}
      ${docsCauzione(n)}
      ${nolDocBlocco("noleggio",n.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-docs" data-id="${n.id}">Salva</button></div>`);
    firmaSveglia(["verb-uscita","verb-rientro"]);
  }

  /* le due carte della cauzione, dentro i Documenti: ⛔ la regola di Alessio
     e' che ogni documento del noleggio si stampa e si porta in PDF. Queste
     due non fanno eccezione. */
  function docsCauzione(n){
    const imp=+n.cauzione||0;
    if(imp<=0) return `<div class="nol-riq nol-cam"><h4>La cauzione</h4>
      <p style="margin:0;font-size:14px;color:#666">Questo noleggio non ha cauzione. Se la prendi, scrivila nella scheda del noleggio: la ricevuta e la quietanza compaiono qui.</p></div>`;
    const st=cauStatoDi(n), dasv=cauDaSvincolare(n);
    const stato=st==="svincolata"
      ? "Svincolata il "+fdate(n.cauzione_svincolata_il)+": restituiti "+_eur(n.cauzione_restituita||0)+
        ((+n.cauzione_trattenuta||0)?", trattenuti "+_eur(n.cauzione_trattenuta):"")+"."
      : (dasv?"⛔ Il mezzo è rientrato: questa cauzione va svincolata."
             :"In deposito: "+_eur(imp)+(CAU_FORMA[n.cauzione_forma]?" · "+CAU_FORMA[n.cauzione_forma]:"")+".");
    return `<div class="nol-riq nol-cam"><h4>La cauzione — ${esc(_eur(imp))}</h4>
      <p style="margin:0 0 10px;font-size:14px;color:${dasv?"#c62828":"#666"}">${esc(stato)}</p>
      <div class="nol-azioni">
        <button type="button" class="nol-az nol-az-apri" data-action="nol-cauz-stampa" data-m="ricevuta" data-id="${n.id}">Stampa la ricevuta</button>
        <button type="button" class="nol-az" data-action="nol-cauz-pdf" data-m="ricevuta" data-id="${n.id}">Ricevuta in PDF</button>
        <button type="button" class="nol-az" data-action="nol-cauz-stampa" data-m="svincolo" data-id="${n.id}">Stampa la quietanza</button>
        <button type="button" class="nol-az" data-action="nol-cauz-pdf" data-m="svincolo" data-id="${n.id}">Quietanza in PDF</button>
      </div></div>`;
  }

  /* i clic sulla lista di controllo: delegati, come tutto il resto */
  document.addEventListener("click",e=>{
    const b=e.target.closest(".verb-seg button"); if(!b) return;
    const sg=b.closest(".verb-seg"), mom=sg.dataset.mom, i=+sg.dataset.i;
    sg.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    if(docsCheck[mom]&&docsCheck[mom][i]) docsCheck[mom][i].stato=b.dataset.v;
  });
  document.addEventListener("input",e=>{
    const c=e.target.closest(".verb-nota"); if(!c) return;
    const mom=c.dataset.mom, i=+c.dataset.i;
    if(docsCheck[mom]&&docsCheck[mom][i]) docsCheck[mom][i].nota=c.value;
  });

  async function salvaDocumenti(id){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const dati={check_uscita:docsCheck.uscita};
    const fu=$("#verb-firma-uscita"); if(fu) dati.firma_uscita=fu.value.trim()||null;
    dati.firma_uscita_img=firmeVal["verb-uscita"]||null;
    if($("#verb-firma-rientro")){
      dati.check_rientro=docsCheck.rientro;
      dati.firma_rientro=$("#verb-firma-rientro").value.trim()||null;
      dati.firma_rientro_img=firmeVal["verb-rientro"]||null;
    }
    let {error}=await sb.from("nol_noleggi").update(dati).eq("id",id).eq("user_id",sbUid);
    /* rete di salvataggio: se sql/noleggio-firme.sql non e' ancora passato,
       il verbale si salva lo stesso senza il disegno della firma */
    if(error&&/firma_.*_img/i.test(error.message||"")&&/column|schema cache/i.test(error.message||"")){
      const senza={...dati}; delete senza.firma_uscita_img; delete senza.firma_rientro_img;
      ({error}=await sb.from("nol_noleggi").update(senza).eq("id",id).eq("user_id",sbUid));
      if(!error) toast("Salvato, ma la firma no: manca sql/noleggio-firme.sql");
    }
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadDocumenti(); toast("Verbale salvato ✔");
  }

  /* stampare il verbale lo CHIUDE: da quel momento c'e' una data, e
     nell'elenco quel foglio smette di essere rosso */
  async function verbaleFoglio(momento,inPdf){
    const n=await nolLeggi("noleggio",docsApertoId);
    if(!n){toast("Questo noleggio non si trova più");return;}
    const patch={};
    patch[momento==="rientro"?"check_rientro":"check_uscita"]=docsCheck[momento];
    const f=$("#verb-firma-"+momento); if(f) patch[momento==="rientro"?"firma_rientro":"firma_uscita"]=f.value.trim()||null;
    patch[momento==="rientro"?"verbale_rientro_il":"verbale_uscita_il"]=new Date().toISOString();
    const chiaveImg=momento==="rientro"?"firma_rientro_img":"firma_uscita_img";
    patch[chiaveImg]=firmeVal["verb-"+momento]||null;
    /* ⚠️ stampare il verbale lo CHIUDE: la firma disegnata va salvata qui
       dentro, se no si stampa un foglio firmato che nel database non
       risulta firmato. */
    let {error:eSalva}=await sb.from("nol_noleggi").update(patch).eq("id",n.id).eq("user_id",sbUid);
    if(eSalva&&/firma_.*_img/i.test(eSalva.message||"")&&/column|schema cache/i.test(eSalva.message||"")){
      const senza={...patch}; delete senza[chiaveImg];
      await sb.from("nol_noleggi").update(senza).eq("id",n.id).eq("user_id",sbUid);
      toast("Stampo, ma la firma non si salva: manca sql/noleggio-firme.sql");
    }
    const agg=Object.assign({},n,patch);
    const dati=await nolVerbaleDati(agg,momento);
    if(inPdf) nolDocPdf(dati); else nolDocStampa(dati);
    loadDocumenti();
  }
  async function ddtFoglio(momento,inPdf){
    let n=await nolLeggi("noleggio",docsApertoId);
    if(!n){toast("Questo noleggio non si trova più");return;}
    n=await nolDdtNumero(n,momento);
    const dati=await nolDdtDati(n,momento);
    if(inPdf) nolDocPdf(dati); else nolDocStampa(dati);
    loadDocumenti();
  }

  /* ================================================================
     LA RICEVUTA DELLA CAUZIONE E LA QUIETANZA DI SVINCOLO — 23 ago 2026

     Due fogli, un motore solo: gli stessi mattoni del contratto, del
     verbale e del DDT (nolDocStampa / nolDocPdf).

     ⛔ PERCHE' CONTANO. La cauzione e' l'unico pezzo del noleggio in cui
     tieni in mano soldi di un altro. Senza una carta firmata:
       · alla consegna il cliente puo' dire di averti dato di piu';
       · al rientro puo' dire di non aver mai ricevuto indietro niente.
     La quietanza chiude tutte e due le discussioni con una riga sola:
     «dichiara di non avere null'altro a pretendere».

     ⚠️ La cauzione NON e' un acconto e NON e' un corrispettivo: non va in
     fattura e non entra nel totale del noleggio. Sul foglio c'e' scritto.
     ================================================================ */
  async function nolCauzioneDati(n,momento){
    const svincolo=(momento==="svincolo");
    const [{data:az},{data:mz},{data:cl}]=await Promise.all([
      sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      n.mezzo_id   ? sb.from("gest_mezzi").select("*").eq("id",n.mezzo_id).maybeSingle()      : Promise.resolve({data:null}),
      n.cliente_id ? sb.from("gest_clienti").select("*").eq("id",n.cliente_id).maybeSingle() : Promise.resolve({data:null})
    ]);
    const A=az||{}, M=mz||{}, C=cl||{};
    const imp=+n.cauzione||0;
    const tratt=+n.cauzione_trattenuta||0;
    const rest=(n.cauzione_restituita==null||n.cauzione_restituita==="")?Math.max(0,imp-tratt):(+n.cauzione_restituita||0);
    const quando=svincolo?(n.cauzione_svincolata_il||n.data_rientro_effettivo||todayStr())
                         :(n.cauzione_ricevuta_il||n.data_uscita||todayStr());
    const danni=(Array.isArray(n.check_rientro)?n.check_rientro:[]).filter(x=>x&&x.stato==="danno");

    const blocchi=[];
    blocchi.push({t:"testata",azienda:A.nome||"(compila i Dati azienda)",
      sotto:[A.piva?"P.IVA "+A.piva:"",A.indirizzo||"",
             [A.tel?"Tel "+A.tel:"",A.email||""].filter(Boolean).join("   ")].filter(Boolean),
      titolo:svincolo?"QUIETANZA DI SVINCOLO CAUZIONE":"RICEVUTA DI DEPOSITO CAUZIONALE",
      dettaglio:"del "+fdate(quando)+(n.contratto_num?"   ·   contratto n. "+n.contratto_num:"")});

    blocchi.push({t:"coppie",titolo:"Le parti e il noleggio",righe:[
      ["Locatore",A.nome||"—"],
      ["Conduttore",C.nome||n.cliente||"—"],
      ["P.IVA / Cod. Fiscale",C.piva||null],
      ["Attrezzatura",M.nome||n.mezzo||"—"],
      ["Codice / matricola",M.codice||null],
      ["Consegna",n.data_uscita?fdate(n.data_uscita):null],
      ["Riconsegna",n.data_rientro_effettivo?fdate(n.data_rientro_effettivo):null]
    ]});

    if(!svincolo){
      blocchi.push({t:"coppie",titolo:"Il deposito",righe:[
        ["Importo ricevuto",_eur(imp)],
        ["Forma",CAU_FORMA[n.cauzione_forma]||"non indicata"],
        ["Riferimento",n.cauzione_rif||null],
        ["Ricevuto il",fdate(quando)]
      ]});
      blocchi.push({t:"testo",titolo:"Dichiarazione",corpo:[
        "Il Locatore dichiara di aver ricevuto dal Conduttore la somma sopra indicata a titolo di deposito cauzionale, a garanzia dell'esatto adempimento degli obblighi derivanti dal contratto di noleggio.",
        "Il deposito non costituisce acconto né corrispettivo del noleggio e non è soggetto a fatturazione. Salvo diverso accordo scritto, non produce interessi.",
        "La somma sarà restituita alla riconsegna dell'attrezzatura, effettuato il controllo in contraddittorio, al netto degli eventuali danni eccedenti la normale usura, dei costi di reintegro e degli importi contrattuali non ancora pagati."
      ]});
    } else {
      blocchi.push({t:"coppie",titolo:"Il conto del deposito",righe:[
        ["Cauzione ricevuta",_eur(imp)],
        ["Trattenuto",tratt?("− "+_eur(tratt)):"nessuna trattenuta"],
        ["RESTITUITO AL CONDUTTORE",_eur(rest)],
        ["Svincolata il",fdate(quando)],
        ["Motivo della trattenuta",tratt?(n.cauzione_motivo||"(da specificare)"):null]
      ]});
      if(danni.length){
        blocchi.push({t:"tabella",titolo:"I danni rilevati alla riconsegna",
          intro:"Voci segnate come danno nel verbale di riconsegna sottoscritto dalle parti.",
          colonne:["Che cosa","Nota"],
          righe:danni.map(x=>[x.voce,x.nota||""]),
          nota:"La trattenuta sopra indicata si riferisce a queste voci."});
      }
      blocchi.push({t:"testo",titolo:"Dichiarazione",corpo:[
        tratt
          ? "Le parti danno atto che alla riconsegna sono state rilevate le difformità sopra indicate, eccedenti la normale usura, e concordano la trattenuta dell'importo indicato a copertura dei relativi costi."
          : "Le parti danno atto che alla riconsegna non sono state rilevate difformità eccedenti la normale usura.",
        "Il Locatore restituisce al Conduttore la somma di "+_eur(rest)+" a saldo del deposito cauzionale.",
        "Il Conduttore, ricevuta tale somma, dichiara di non avere null'altro a pretendere in relazione al deposito cauzionale e al contratto di noleggio sopra richiamato."
      ]});
    }

    blocchi.push({t:"firme",
      vessatorie:svincolo
        ? "La presente quietanza è rilasciata in duplice originale, uno per ciascuna delle parti."
        : "La presente ricevuta è rilasciata in duplice originale, uno per ciascuna delle parti.",
      colonne:svincolo
        ? [["Il Locatore",A.nome||""],["Il Conduttore, per quietanza",C.nome||n.cliente||""]]
        : [["Il Locatore, per ricevuta",A.nome||""],["Il Conduttore",C.nome||n.cliente||""]]});

    return {blocchi,titolo:(svincolo?"Quietanza di svincolo cauzione — ":"Ricevuta di cauzione — ")+
            (C.nome||n.cliente||"cliente")};
  }

  async function cauzioneFoglio(id,momento,inPdf){
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const n=await nolLeggi("noleggio",id);
    if(!n){toast("Salva prima il noleggio, poi stampa la ricevuta");return;}
    if(!(+n.cauzione>0)){toast("Questo noleggio non ha una cauzione");return;}
    if(momento==="svincolo"&&cauStatoDi(n)!=="svincolata"&&!n.data_rientro_effettivo){
      toast("Il mezzo non è ancora rientrato: la quietanza si stampa allo svincolo");return;
    }
    const dati=await nolCauzioneDati(n,momento);
    if(inPdf) nolDocPdf(dati); else nolDocStampa(dati);
  }
