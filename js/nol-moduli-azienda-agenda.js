// [SPOSTATO] nol-moduli-azienda-agenda.js: era dentro nol-core.js, righe 5581-5991, spostato identico.

  /* FORM LAVORO (nessun campo "servizio": il reparto è già il pannello) */
  function jobForm(job,presetDate,preset,supa,fattura){
    const isNew=!job;
    const jid=job?job.id:uid();
    job=job||Object.assign({id:jid,stato:"da_fare",fattStato:"none",dataPrevista:presetDate||""},preset||{});
    editing={id:jid,foto:(job.foto||[]).slice(),supa:!!supa,fattura:!!fattura};
    if(supa){
      openSheet(`<h3>${fattura?"Nuova fattura":"Nuovo lavoro"}</h3>
        <div class="field"><label>Cosa c'è da fare</label><textarea id="j-desc" placeholder="Es. taglio siepe e pulizia aiuole">${esc(job.descrizione||"")}</textarea></div>
        <div class="field"><label>Dove</label><input id="j-dove" value="${esc(job.dove||"")}" placeholder="Indirizzo / scala / piano"></div>
        <div class="row2">
          <div class="field"><label>Data prevista</label><input type="date" id="j-data" value="${job.dataPrevista||todayStr()}"></div>
          <div class="field"><label>Operaio</label><select id="j-operaio"><option value="">— nessuno —</option></select></div></div>
        <div class="field"><label>Cliente</label><select id="j-cliente"><option value="">— nessuno —</option></select></div>
        <div class="field"><label>Importo (€)</label><input id="j-imp" inputmode="decimal" value="${job.importo==null?"":String(job.importo).replace(".",",")}" placeholder="0,00" data-eu></div>
        <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
          <button class="b-save" data-action="save-job">${fattura?"Crea fattura":"Crea lavoro"}</button></div>`);
      fillOperai();fillClienti(job.cliente_id);return;
    }
    const cliOpts=db().clienti.map(c=>`<option value="${c.id}" ${c.id===job.clienteId?"selected":""}>${esc(c.nome)}</option>`).join("");
    const dipOpts=dipCache.map(d=>`<option value="${d.id}">${esc(d.nome)}</option>`).join("");
    const dipSel=id=>dipCache.map(d=>`<option value="${d.id}" ${d.id===id?"selected":""}>${esc(d.nome)}</option>`).join("");
    openSheet(`<h3>${isNew?"Nuovo lavoro":"Modifica lavoro"}</h3>
      <div class="field"><label>Condominio / Cantiere</label>
        <select id="j-cli"><option value="">— scegli —</option>${cliOpts}</select>
        <button class="quick-add" data-action="quick-cli">+ Aggiungi nuovo condominio</button></div>
      <div class="field"><label>Cosa c'è da fare</label><textarea id="j-desc" placeholder="Es. taglio siepe e pulizia aiuole">${esc(job.descrizione||"")}</textarea></div>
      <div class="field"><label>Dove (vuoto = indirizzo del condominio)</label><input id="j-dove" value="${esc(job.dove||"")}" placeholder="Indirizzo / scala / piano"></div>
      <div class="row2">
        <div class="field"><label>Data prevista</label><input type="date" id="j-data" value="${job.dataPrevista||""}"></div>
        <div class="field"><label>Chi ci va</label><select id="j-dip"><option value="">— nessuno —</option>${dipSel(job.assegnatoId)}</select></div></div>
      <div class="field"><label>📷 Foto lavoro DA FARE (dal capo)</label>
        <input type="file" id="up-prima" accept="image/*" multiple style="display:none">
        <label class="up-btn" for="up-prima">＋ Aggiungi foto</label>
        <div class="thumbs" id="th-prima"></div></div>
      <div class="field"><label>Stato</label><div class="seg" id="j-stato">
        ${["da_fare","in_corso","fatto"].map(s=>`<button data-v="${s}" class="${job.stato===s?"on":""}">${statoLabel[s]}</button>`).join("")}</div></div>
      <div class="field"><label>Cosa è stato fatto (consuntivo)</label><textarea id="j-svolto" placeholder="Compila quando il lavoro è finito">${esc(job.lavoroSvolto||"")}</textarea></div>
      <div class="field"><label>📷 Foto lavoro FATTO (operatore)</label>
        <select id="op-dopo"><option value="">— chi l'ha fatto —</option>${dipOpts}</select>
        <input type="file" id="up-dopo" accept="image/*" multiple style="display:none">
        <label class="up-btn" for="up-dopo" style="margin-top:8px">＋ Aggiungi foto</label>
        <div class="thumbs" id="th-dopo"></div></div>
      <div class="field"><label>Note</label><textarea id="j-note" placeholder="Materiali, problemi, da ricordare...">${esc(job.note||"")}</textarea></div>
      <div class="row2">
        <div class="field"><label>Ore lavorate</label><input id="j-ore" inputmode="decimal" value="${job.ore==null||job.ore===""?"":String(job.ore).replace(".",",")}" placeholder="0" data-num></div>
        <div class="field"><label>Importo (€)</label><input id="j-imp" inputmode="decimal" value="${job.importo==null||job.importo===""?"":String(job.importo).replace(".",",")}" placeholder="0" data-eu></div></div>
      <div class="field"><label>Fattura</label><div class="seg" id="j-fatt">
        ${[["none","Non emessa"],["emessa","Emessa"],["pagata","Pagata"]].map(p=>`<button data-v="${p[0]}" class="${(job.fattStato||'none')===p[0]?'on':''}">${p[1]}</button>`).join("")}</div></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
        <button class="b-save" data-action="save-job">${isNew?"Crea lavoro":"Salva"}</button></div>`);
    bindSeg("j-stato");bindSeg("j-fatt");
    $("#up-prima").onchange=e=>{addFoto(e.target.files,"prima","Capo");e.target.value="";};
    $("#up-dopo").onchange=e=>{addFoto(e.target.files,"dopo",$("#op-dopo").value);e.target.value="";};
    renderFotoBlocks();
  }
  async function fillOperai(){
    const sel=$("#j-operaio");if(!sel||!sb||!sbUid)return;
    /* 24 agosto 2026 — tutti gli operai dell'azienda, non solo quelli di un reparto */
    const {data}=await sb.from("gest_operatori").select("id,nome,telefono").eq("user_id",sbUid);
    sel.innerHTML=`<option value="">— nessuno —</option>`+(data||[]).map(o=>`<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join("");
  }
  async function fillClienti(selId){
    const sel=$("#j-cliente");if(!sel||!sb||!sbUid)return;
    /* 24 agosto 2026 — tutti i clienti dell'azienda, non solo quelli di un reparto */
    const {data}=await sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).order("nome");
    sel.innerHTML=`<option value="">— nessuno —</option>`+(data||[]).map(c=>`<option value="${esc(c.id)}" ${c.id===selId?"selected":""}>${esc(c.nome)}</option>`).join("");
  }
  function bindSeg(id){$$("#"+id+" button").forEach(b=>b.onclick=()=>{$$("#"+id+" button").forEach(x=>x.classList.remove("on"));b.classList.add("on");});}
  function segVal(id){const e=$("#"+id+" button.on");return e?e.dataset.v:"";}

  async function saveJob(){
    if(editing&&editing.supa){
      if(!sbUid){toast("Devi essere loggato");return;}
      const descrizione=$("#j-desc").value.trim(), data_prevista=$("#j-data").value, operatore_id=$("#j-operaio")?$("#j-operaio").value:"";
      if(!descrizione||!data_prevista){toast("Compila Descrizione e Data");return;}
      /* ⚠️ 22 agosto 2026 — qui «1250,50» diventava ZERO, senza un avviso:
         la casella era type="number" (che con la virgola torna vuota) e si
         leggeva con +valore. Adesso e' una casella normale letta da _numIt. */
      const importo=_numIt($("#j-imp")?$("#j-imp").value:"");
      if(editing.fattura&&!(importo>0)){toast("Inserisci l'importo");return;}
      const cliente_id=($("#j-cliente")&&$("#j-cliente").value)?$("#j-cliente").value:null;
      /* 24 agosto 2026 — nasce senza reparto, come i clienti nuovi: il
         Noleggio non ne ha piu' uno da scrivere qui sopra. */
      const obj={user_id:sbUid,stato:editing.fattura?"fatto":"da_fare",
        descrizione,dove:$("#j-dove").value.trim(),data_prevista,operatore_id:operatore_id||null,importo,cliente_id};
      if(editing.fattura)obj.fatt_stato="emessa";
      const {error}=await sb.from("gest_lavori").insert(obj);
      if(error){toast("Errore: "+error.message);return;}
      closeSheet();renderJobs();renderFatture();toast(editing.fattura?"Fattura creata ✔":"Lavoro creato ✔");return;
    }
    const cli=$("#j-cli").value;if(!cli){toast("Scegli un condominio");return;}
    const id=editing.id, exists=db().lavori.some(l=>l.id===id), prev=db().lavori.find(l=>l.id===id);
    const stato=segVal("j-stato"), fattStato=segVal("j-fatt")||"none";
    const obj={id,clienteId:cli,descrizione:$("#j-desc").value.trim(),dove:$("#j-dove").value.trim(),
      dataPrevista:$("#j-data").value,assegnatoId:$("#j-dip").value,stato,lavoroSvolto:$("#j-svolto").value.trim(),
      /* ⛔ 29 agosto 2026 — le ultime due caselle rimaste type="number".
         Alessio, sul negozio: «se voglio mettere 5.5 non posso, mi mette 55».
         Qui era lo stesso: il modulo grande del lavoro era rimasto indietro
         rispetto a quello piccolo, sistemato il 22 agosto (riga ~6101).
         La casella vuota resta vuota: «non ho segnato le ore» non è «zero ore». */
      note:$("#j-note").value.trim(),
      ore:$("#j-ore").value===""?"":_numIt($("#j-ore").value),
      importo:$("#j-imp").value===""?"":_numIt($("#j-imp").value),fattStato,pagato:fattStato==="pagata",
      foto:editing.foto,numFatt:prev?prev.numFatt:undefined};
    obj.dataFatto=stato==="fatto"?(prev&&prev.dataFatto?prev.dataFatto:(obj.dataPrevista||todayStr())):"";
    if(exists)db().lavori=db().lavori.map(l=>l.id===id?obj:l);else db().lavori.push(obj);
    await save();closeSheet();renderAll();toast(exists?"Lavoro aggiornato":"Lavoro creato ✔");
  }

  function cliForm(c){
    const isNew=!c;c=c||{};
    openSheet(`<h3>${isNew?"Nuovo condominio":"Modifica condominio"}</h3>
      <div class="field"><label>Nome condominio / cliente</label><input id="c-nome" value="${esc(c.nome||"")}" placeholder="${ruoloUtente==='professionista'?'Es. Mario Rossi':'Es. Condominio Via Roma 12'}"></div>
      <div class="field"><label>Indirizzo</label><input id="c-ind" value="${esc(c.indirizzo||"")}" placeholder="Via, numero, città"></div>
      <div class="row2"><div class="field"><label>Referente / Amministratore</label><input id="c-ref" value="${esc(c.referente||"")}" placeholder="Nome"></div>
      <div class="field"><label>Telefono</label><input id="c-tel" value="${esc(c.telefono||"")}" placeholder="Numero"></div></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-cli" data-id="${c.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
  }
  async function saveCli(id){
    const nome=$("#c-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const indirizzo=$("#c-ind").value.trim(),referente=$("#c-ref").value.trim(),telefono=$("#c-tel").value.trim();
    const {error}=id
      ?await sb.from("gest_clienti").update({nome,indirizzo,referente,telefono}).eq("id",id).eq("user_id",sbUid)
      :await sb.from("gest_clienti").insert({user_id:sbUid,mestiere_id:curMestiere(),nome,indirizzo,referente,telefono});
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();renderClienti();toast(id?"Aggiornato":"Condominio aggiunto ✔");
  }
  function dipForm(d){
    const isNew=!d;d=d||{};
    openSheet(`<h3>${isNew?"Nuova persona":"Rinomina persona"}</h3>
      <div class="field"><label>Nome</label><input id="d-nome" value="${esc(d.nome||"")}" placeholder="Es. Wahid"></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-dip" data-id="${d.id||""}">${isNew?"Aggiungi":"Salva"}</button></div>`);
  }
  async function saveDip(id){
    const nome=$("#d-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(id)db().dipendenti=db().dipendenti.map(d=>d.id===id?{...d,nome}:d);else db().dipendenti.push({id:uid(),nome});
    await save();closeSheet();renderAll();toast("Salvato ✔");
  }

  function panelForm(){
    nuovoSel={icon:"🛠️",col:0};
    openSheet(`<h3>Nuovo reparto</h3>
      <div class="field"><label>Nome del reparto</label><input id="p-nome" placeholder="${ruoloUtente==='professionista'?'Es. Progettazione, Direzione lavori, Catasto':'Es. Muratura, Idraulica, Giardini'}"></div>
      <div class="field"><label>Icona</label><div class="picker" id="p-ic">${ICONE.map(i=>`<button type="button" class="pk ${i===nuovoSel.icon?'on':''}" data-ic="${i}">${i}</button>`).join("")}</div></div>
      <div class="field"><label>Colore</label><div class="colors" id="p-col">${COLORI.map((c,i)=>`<button type="button" class="cl ${i===0?'on':''}" data-col="${i}" style="background:${c.a}"></button>`).join("")}</div></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-panel">Crea reparto</button></div>`);
    $("#p-ic").onclick=e=>{const b=e.target.closest("[data-ic]");if(!b)return;nuovoSel.icon=b.dataset.ic;[...$("#p-ic").children].forEach(x=>x.classList.toggle("on",x===b));};
    $("#p-col").onclick=e=>{const b=e.target.closest("[data-col]");if(!b)return;nuovoSel.col=+b.dataset.col;[...$("#p-col").children].forEach(x=>x.classList.toggle("on",x===b));};
  }
  async function savePanel(){
    const nome=$("#p-nome").value.trim();if(!nome){toast("Scrivi il nome del reparto");return;}
    const c=COLORI[nuovoSel.col]||COLORI[0], id=uid();
    let mestiere_id=null;
    if(sb&&sbUid){
      const {data:m,error}=await sb.from("gest_mestieri").insert({user_id:sbUid,nome,icona:nuovoSel.icon,colore:c.a,ordine:0}).select().single();
      if(error){toast("Errore reparto: "+error.message);return;}
      mestiere_id=m.id;
    }
    state.panels=state.panels||[];
    state.panels.push({id,nome,icon:nuovoSel.icon,a:c.a,ad:c.ad,as:c.as,mestiere_id});
    state[id]={clienti:[],dipendenti:[],lavori:[],note:{}};
    await save();closeSheet();renderLanding();toast("Reparto creato ✔");
  }
  async function delPanel(id){
    const p=(state.panels||[]).find(x=>x.id===id);
    if(!p)return;
    let n=0;
    if(sb&&sbUid&&p.mestiere_id){
      const {data}=await sb.from("gest_lavori").select("id").eq("user_id",sbUid).eq("mestiere_id",p.mestiere_id);
      n=(data||[]).length;
    }
    const msg=n?`Stai per eliminare il reparto «${p.nome}» e le sue ${n} pratiche. L'operazione è definitiva. Continuare?`:`Stai per eliminare il reparto «${p.nome}». L'operazione è definitiva. Continuare?`;
    if(!gconfirm(msg))return;
    if(sb&&sbUid&&p.mestiere_id){
      await sb.from("gest_lavori").delete().eq("user_id",sbUid).eq("mestiere_id",p.mestiere_id);
      await sb.from("gest_mestieri").delete().eq("id",p.mestiere_id).eq("user_id",sbUid);
    }
    state.panels=(state.panels||[]).filter(x=>x.id!==id);
    delete state[id];
    await save();renderLanding();toast("Reparto eliminato");
  }

  let aziendaRow=null;
  async function aziendaForm(){
    aziendaRow=null;
    if(sb&&sbUid){const {data}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();aziendaRow=data||null;}
    const a=aziendaRow||{};
    openSheet(`<h3>Dati azienda</h3>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">Compaiono in cima a ogni PDF fattura. Sono i dati dell'azienda multiservizi.</p>
      <div class="field"><label>Nome / Ragione sociale</label><input id="a-nome" value="${esc(a.nome||"")}" placeholder="Es. Multiservizi Rossi srl"></div>
      <div class="field"><label>P.IVA</label><input id="a-piva" value="${esc(a.piva||"")}" placeholder="01234567890"></div>
      <div class="field"><label>Indirizzo</label><input id="a-ind" value="${esc(a.indirizzo||"")}" placeholder="Via, numero, città"></div>
      <div class="row2"><div class="field"><label>Telefono</label><input id="a-tel" value="${esc(a.tel||"")}"></div>
      <div class="field"><label>Email</label><input id="a-email" value="${esc(a.email||"")}"></div></div>
      <div class="field"><label>IBAN (per i bonifici)</label><input id="a-iban" value="${esc(a.iban||"")}" placeholder="IT.."></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-azienda">Salva</button></div>`);
  }
  async function saveAzienda(){
    if(!sbUid){toast("Devi essere loggato");return;}
    const row={user_id:sbUid,
      nome:$("#a-nome").value.trim(),piva:$("#a-piva").value.trim(),indirizzo:$("#a-ind").value.trim(),
      tel:$("#a-tel").value.trim(),email:$("#a-email").value.trim(),iban:$("#a-iban").value.trim(),
      num_fatt:(aziendaRow&&aziendaRow.num_fatt!=null)?aziendaRow.num_fatt:1};
    const {error}=await sb.from("gest_azienda").upsert(row,{onConflict:"user_id"});
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();toast("Dati azienda salvati ✔");
  }

  const eurPdf=n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0)+" EUR";
  async function generaPdf(id){
    if(!window.jspdf){toast("PDF non ancora pronto, riprova tra un attimo");return;}
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const {data:lav}=await sb.from("gest_lavori").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(!lav){toast("Lavoro non trovato");return;}
    let c={};
    if(lav.cliente_id){const {data:cl}=await sb.from("gest_clienti").select("nome,indirizzo,referente").eq("id",lav.cliente_id).maybeSingle();c=cl||{};}
    let numFatt=lav.num_fatt;
    if(!numFatt){
      numFatt=az.num_fatt||1;
      await sb.from("gest_lavori").update({num_fatt:numFatt}).eq("id",id).eq("user_id",sbUid);
      await sb.from("gest_azienda").update({num_fatt:numFatt+1}).eq("user_id",sbUid);
    }
    const l={numFatt,dataFatto:lav.data_fatto,dataPrevista:lav.data_prevista,descrizione:lav.descrizione,lavoroSvolto:lav.lavoro_svolto,ore:lav.ore,importo:lav.importo,fattStato:lav.fatt_stato};
    const pp=(state.panels||[]).find(p=>p.id===cur), repNome=pp?pp.nome:"";
    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"}), M=18, R=210-M;
    let y=20;
    doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;[az.piva?"P.IVA "+az.piva:"",az.indirizzo||"",[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")].filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});
    doc.setTextColor(0);
    doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text("FATTURA",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("Copia di cortesia",R,y+5.5,{align:"right"});
    doc.text("N. "+l.numFatt+"   del "+fdate(l.dataFatto||l.dataPrevista||todayStr()),R,y+10.5,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+15)+4;doc.setDrawColor(210);doc.line(M,y,R,y);y+=10;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Cliente",M,y);y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(11);doc.text(c.nome||"—",M,y);y+=5;
    doc.setFontSize(9);doc.setTextColor(90);
    if(c.indirizzo){doc.text(c.indirizzo,M,y);y+=4.5;}
    if(c.referente){doc.text("Rif. "+c.referente,M,y);y+=4.5;}
    doc.setTextColor(0);y+=8;
    doc.setFillColor(31,111,92);doc.rect(M,y,R-M,8,"F");
    doc.setTextColor(255);doc.setFont("helvetica","bold");doc.setFontSize(9.5);
    doc.text("Descrizione",M+2,y+5.5);doc.text("Importo",R-2,y+5.5,{align:"right"});
    doc.setTextColor(0);doc.setFont("helvetica","normal");y+=8;
    const descr=(repNome?repNome+" — ":"")+(l.descrizione||l.lavoroSvolto||"Prestazione di servizi");
    const lines=doc.splitTextToSize(descr,R-M-42);
    const det=[];if(l.dataFatto||l.dataPrevista)det.push("Data "+fdate(l.dataFatto||l.dataPrevista));if(l.ore)det.push(l.ore+" ore");
    const detStr=det.join("   ·   ");
    const rowH=lines.length*5+(detStr?5:0)+6;
    doc.setDrawColor(210);doc.rect(M,y,R-M,rowH);
    doc.setFontSize(10);doc.text(lines,M+2,y+6);doc.text(eurPdf(l.importo),R-2,y+6,{align:"right"});
    if(detStr){doc.setFontSize(8.5);doc.setTextColor(120);doc.text(detStr,M+2,y+6+lines.length*5);doc.setTextColor(0);}
    y+=rowH+4;
    doc.setDrawColor(31,111,92);doc.setLineWidth(.4);doc.rect(R-70,y,70,12);doc.setLineWidth(.2);
    doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("TOTALE",R-68,y+7.6);doc.text(eurPdf(l.importo),R-2,y+7.6,{align:"right"});
    y+=22;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Pagamento",M,y);y+=5.5;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    if(az.iban){doc.text("Bonifico — IBAN "+az.iban,M,y);y+=4.5;}
    doc.text("Causale: Fattura n. "+l.numFatt,M,y);y+=5;
    doc.setTextColor(0);doc.setFont("helvetica","bold");doc.text("Stato: "+(l.fattStato==="pagata"?"PAGATA":"DA SALDARE"),M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(140);
    doc.text("Documento non fiscale (copia di cortesia). La fattura elettronica valida viene emessa tramite Sistema di Interscambio.",M,286,{maxWidth:R-M});
    const fn="fattura-"+l.numFatt+"-"+(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf";
    doc.save(fn);toast("PDF scaricato ✅");renderFatture();
  }

  function compress(file){
    return new Promise((res,rej)=>{
      const img=new Image(), rd=new FileReader();
      rd.onerror=rej;
      rd.onload=()=>{img.onerror=rej;img.onload=()=>{
        /* stessi valori di js/foto-upload.js: le foto del flusso locale finiscono
           nello stesso bucket, non devono avere una risoluzione diversa */
        const max=1600;let w=img.width,h=img.height;
        if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        res(cv.toDataURL("image/jpeg",0.75));
      };img.src=rd.result;};
      rd.readAsDataURL(file);
    });
  }
  function syncEditingToJob(){const j=db().lavori.find(l=>l.id===editing.id);if(j)j.foto=editing.foto;}
  async function addFoto(files,tipo,operatore){
    let n=0;
    for(const f of Array.from(files)){
      if(!f.type||!f.type.startsWith("image/"))continue;
      let dataURL;try{dataURL=await compress(f);}catch(e){continue;}
      const id="f"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      try{await window.storage.set("gfoto_"+id,dataURL);}catch(e){toast("Foto troppo grande, non salvata");continue;}
      fotoCache[id]=dataURL;editing.foto.push({id,tipo,operatore:operatore||"",ts:Date.now()});n++;
    }
    syncEditingToJob();await save();renderFotoBlocks();renderGalleria();
    if(n)toast(n+" foto aggiunte 📷");
  }
  async function deleteFoto(id){
    editing.foto=editing.foto.filter(f=>f.id!==id);
    try{await window.storage.delete("gfoto_"+id);}catch(e){}
    delete fotoCache[id];syncEditingToJob();await save();renderFotoBlocks();renderGalleria();toast("Foto eliminata");
  }
  function fotoThumb(f,withDel){
    const opName=f.operatore==="Capo"?"Capo":(dipById(f.operatore)?dipById(f.operatore).nome:"");
    return `<div class="thumb"><img data-foto="${f.id}" data-action="view-foto" data-id="${f.id}">
      ${opName?`<span class="thop">${esc(opName)}</span>`:""}
      ${withDel?`<button class="thdel" data-action="del-foto" data-id="${f.id}">×</button>`:""}</div>`;
  }
  function renderFotoBlocks(){
    const p=$("#th-prima"),d=$("#th-dopo");if(!p&&!d)return;
    if(p)p.innerHTML=editing.foto.filter(f=>f.tipo==="prima").map(f=>fotoThumb(f,true)).join("");
    if(d)d.innerHTML=editing.foto.filter(f=>f.tipo==="dopo").map(f=>fotoThumb(f,true)).join("");
    hydrateFoto();
  }
  async function hydrateFoto(){
    const els=Array.from($$("img[data-foto]")).filter(im=>!im.getAttribute("src"));
    for(const im of els){const id=im.dataset.foto;
      try{if(!(id in fotoCache)){const r=await window.storage.get("gfoto_"+id);fotoCache[id]=r&&r.value?r.value:"";}
        if(fotoCache[id])im.src=fotoCache[id];}catch(e){}
    }
  }
  async function renderGalleria(){
    if(!cur)return;
    const box=$("#gal-body");if(!box)return;
    if(!sb||!sbUid){if($("#gal-op"))$("#gal-op").innerHTML="";box.innerHTML=`<div class="empty"><div class="ic">📷</div><p>Nessuna foto in questo reparto</p><small>Carica le foto aprendo un lavoro (cantiere)</small></div>`;return;}
    /* 24 agosto 2026 — niente piu' filtro per reparto, come le fatture e il calendario */
    const [{data:foto},{data:lavori}]=await Promise.all([
      sb.from("gest_foto").select("id,lavoro_id,storage_path,tipo,operatore").eq("user_id",sbUid),
      sb.from("gest_lavori").select("id,descrizione").eq("user_id",sbUid)
    ]);
    const lavName=Object.fromEntries((lavori||[]).map(l=>[l.id,l.descrizione||"Lavoro"]));
    const lavIds=new Set((lavori||[]).map(l=>l.id));
    const all=(foto||[]).filter(f=>lavIds.has(f.lavoro_id)&&f.tipo!=="fattura");
    const ops=new Set();all.forEach(f=>ops.add(f.operatore||""));
    const opChips=[`<button class="chip ${galFilter.op===""?"on":""}" data-action="gal-op" data-v="">${ruoloUtente==='professionista'?'Tutti i collaboratori':'Tutti gli operatori'}</button>`]
      .concat(Array.from(ops).filter(Boolean).map(o=>`<button class="chip ${galFilter.op===o?"on":""}" data-action="gal-op" data-v="${esc(o)}">${esc(o)}</button>`)).join("");
    if($("#gal-op"))$("#gal-op").innerHTML=opChips;
    const matchTipo=f=>galFilter.tipo==="prima"?f.tipo==="da_fare":galFilter.tipo==="dopo"?f.tipo!=="da_fare":true;
    const fs=all.filter(f=>(!galFilter.op||f.operatore===galFilter.op)&&matchTipo(f));
    const groups=new Map();
    fs.forEach(f=>{const k=f.lavoro_id||"";if(!groups.has(k))groups.set(k,[]);groups.get(k).push(f);});
    let html="",any=false;
    groups.forEach((arr,k)=>{any=true;
      html+=`<div class="gal-group"><div class="gal-cantiere">🏢 ${esc(lavName[k]||"—")}</div><div class="thumbs">`;
      arr.forEach(f=>{const dafare=f.tipo==="da_fare",tip=dafare?"Da fare":"Fatto",tcls=dafare?"prima":"dopo",opName=f.operatore||"";
        html+=`<div class="thumb"><img data-gfoto="${esc(f.id)}" data-action="view-foto" data-id="${esc(f.id)}">
          <span class="thtag ${tcls}">${tip}</span>${opName?`<span class="thop">${esc(opName)}</span>`:""}</div>`;});
      html+=`</div></div>`;});
    box.innerHTML=any?html:`<div class="empty"><div class="ic">📷</div><p>Nessuna foto in questo reparto</p><small>Carica le foto aprendo un lavoro (cantiere)</small></div>`;
    for(const f of fs){
      try{const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
        if(su&&su.signedUrl){fotoCache[f.id]=su.signedUrl;const im=box.querySelector(`img[data-gfoto="${f.id}"]`);if(im)im.src=su.signedUrl;}
      }catch(e){}
    }
  }

  function agendaCard(l){
    const c=cliById(l.clienteId), d=dipById(l.assegnatoId), dove=l.dove||(c&&c.indirizzo)||"";
    const fatto=l.stato==="fatto", prima=(l.foto||[]).filter(f=>f.tipo==="prima");
    return `<div class="job">
      <div class="job-top"><div class="job-cli">${esc(c?c.nome:"—")}</div></div>
      ${l.descrizione?`<div class="job-desc">${esc(l.descrizione)}</div>`:""}
      <div class="stati"><span class="st"><i class="pall ${fatto?'verde':'rosso'}"></i><span class="lab">${fatto?'Fatto':(l.stato==='in_corso'?'In corso':'Da fare')}</span></span></div>
      <div class="job-meta">
        ${dove?`<span>📍 ${esc(dove)}</span>`:""}
        <span>📅 ${fdate(l.dataPrevista)}</span>
        ${d?`<span>👷 ${esc(d.nome)}</span>`:""}
        ${l.ore?`<span>⏱ ${l.ore} h</span>`:""}
      </div>
      ${prima.length?`<div class="ag-foto-label">📷 Foto dal capo — cosa fare</div><div class="thumbs">${prima.map(f=>fotoThumb(f,false)).join("")}</div>`:""}
      ${l.note?`<div class="job-note">📝 ${esc(l.note)}</div>`:""}
      <div class="job-actions">
        ${dove?`<button class="ja map" data-action="map" data-q="${esc(dove)}">🗺 Mappa</button>`:""}
        ${l.stato==="da_fare"?`<button class="ja go" data-action="stato" data-id="${l.id}" data-v="in_corso">▶ Avvia</button>`:""}
        ${!fatto?`<button class="ja go" data-action="stato" data-id="${l.id}" data-v="fatto">✔ Segna fatto</button>`:""}
        <button class="ja" data-action="edit-job" data-id="${l.id}">✏ Apri scheda</button>
      </div></div>`;
  }
  async function renderAgenda(){
    if(!cur)return;
    const body=$("#ag-body");
    if(!sb||!sbUid){
      if($("#ag-op"))$("#ag-op").innerHTML=`<button class="chip on" data-action="ag-op" data-v="">Tutti</button>`;
      if(body)body.innerHTML=`<div class="empty"><div class="ic">🗒️</div><p>Niente da fare qui</p><small>Assegna i lavori a una persona dalla scheda del lavoro, voce "Chi ci va"</small></div>`;
      return;
    }
    /* chip operatori dalla squadra del reparto (Supabase) */
    const {data:ops}=await sb.from("gest_operatori").select("id,nome,telefono").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    const OPS=ops||[];
    const telMap=Object.fromEntries(OPS.map(o=>[o.id,o.telefono||""]));
    const opChips=[`<button class="chip ${agFilter.op===""?"on":""}" data-action="ag-op" data-v="">Tutti</button>`]
      .concat(OPS.map(d=>`<button class="chip ${agFilter.op===d.id?"on":""}" data-action="ag-op" data-v="${d.id}">${esc(d.nome)}</button>`)).join("");
    if($("#ag-op"))$("#ag-op").innerHTML=opChips;
    /* lavori del reparto (Supabase) */
    const {data}=await sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,operatore_id").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    let L=data||[];
    if(agFilter.stato==="aperti")L=L.filter(l=>l.stato!=="fatto");
    if(agFilter.op)L=L.filter(l=>l.operatore_id===agFilter.op);
    L.sort((a,b)=>(a.data_prevista||"9999").localeCompare(b.data_prevista||"9999"));
    if(body)body.innerHTML=L.length?L.map(l=>jobCardSupa(l,true,telMap[l.operatore_id]||"")).join(""):`<div class="empty"><div class="ic">🗒️</div><p>Niente da fare qui</p><small>${agFilter.op?"Questo operatore non ha lavori assegnati":"Assegna i lavori a una persona dalla scheda del lavoro, voce \"Chi ci va\""}</small></div>`;
  }
