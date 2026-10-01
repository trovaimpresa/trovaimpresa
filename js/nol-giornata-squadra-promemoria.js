// [SPOSTATO] nol-giornata-squadra-promemoria.js: era dentro nol-core.js, righe 5168-5580, spostato identico.

  /* 26 set 2026 — IL CALENDARIO SUL TELEFONO (come nel gestionale imprese).
     Sul telefono sotto il mese a pallini c'e' l'elenco, giorno per giorno,
     con i nomi interi: chi esce, chi rientra, chi e' in ritardo, i lavori.
     Mese di oggi: da oggi in avanti. Altro mese: i giorni che hanno qualcosa.
     Ogni riga apre la giornata (a tutta pagina). Sul computer non si vede. */
  function calListaTelefono(y,m,days,oggi){
    const grid=$("#cal-grid"); if(!grid)return;
    let box=$("#cal-lista");
    if(!box){ grid.insertAdjacentHTML("afterend",'<div id="cal-lista" class="cal-lista"></div>'); box=$("#cal-lista"); }
    const meseOggi=oggi.slice(0,7)===ymd(y,m,1).slice(0,7);
    const GG=["domenica","luned\u00ec","marted\u00ec","mercoled\u00ec","gioved\u00ec","venerd\u00ec","sabato"];
    const riga=(ds,cls,t)=>'<div class="cl-r" data-action="open-day" data-d="'+ds+'"><i class="dot '+cls+'"></i>'
      +'<span class="cl-t">'+t+'</span><span class="cl-f">\u203a</span></div>';
    const chi=x=>esc(x.mezzo||"Mezzo")+(x.cliente?" \u00b7 "+esc(x.cliente):"");
    let h="";
    for(let d=1;d<=days;d++){
      const ds=ymd(y,m,d);
      if(meseOggi&&ds<oggi)continue;
      const g=giornoDi(ds,oggi), nota=db().note[ds];
      const tanti=g.escono.length+g.rientrano.length+g.ritardi.length+g.lavori.length;
      if(!tanti&&!nota&&ds!==oggi)continue;
      const nome=GG[new Date(y,m,d).getDay()];
      h+='<div class="cl-g'+(ds===oggi?" oggi":"")+'" data-action="open-day" data-d="'+ds+'">'
        +(ds===oggi?"Oggi \u00b7 ":"")+nome.charAt(0).toUpperCase()+nome.slice(1)+" "+d+" "+mesi[m]+'</div>';
      g.ritardi.forEach(x=>{h+=riga(ds,"ritardo","In ritardo: "+chi(x));});
      g.escono.forEach(x=>{const p=nolFaseDi(x)==="prenotato";h+=riga(ds,p?"prenot":"esce",(p?"Prenotato: ":"Esce: ")+chi(x));});
      g.rientrano.forEach(x=>{h+=riga(ds,"rientra","Rientra: "+chi(x));});
      g.lavori.forEach(j=>{h+=riga(ds,j.stato==="fatto"?"done":"todo",esc(j.descrizione||"Lavoro"));});
      if(nota)h+=riga(ds,"nota","Nota: "+esc(String(nota).slice(0,80)));
      if(!tanti&&!nota)h+='<div class="cl-vuoto">Niente in programma</div>';
    }
    box.innerHTML=h||'<div class="cl-vuoto">Niente in programma in questo mese</div>';
  }

  /* cosa succede in un giorno: la stessa risposta serve al mese, alla
     scheda della giornata, alla stampa e al PDF. Sta scritta una volta. */
  function giornoDi(ds,oggi){
    oggi=oggi||todayStr();
    return {
      escono:    calNol.filter(x=>x.data_uscita===ds),
      rientrano: calNol.filter(x=>x.data_rientro_prevista===ds&&!x.data_rientro_effettivo),
      /* «in ritardo» si conta solo sui giorni gia' passati: nel futuro
         nessuno e' ancora in ritardo */
      ritardi:   ds<=oggi?calNol.filter(x=>!x.data_rientro_effettivo&&x.data_rientro_prevista&&
                                           x.data_rientro_prevista<ds):[],
      lavori:    calJobs.filter(l=>l.data_prevista===ds)
    };
  }

  function leggiGiornata(ds){
    const g=giornoDi(ds);
    return Object.assign({id:ds,nota:db().note[ds]||""},g);
  }

  /* la scheda della giornata, a tutta pagina come tutte le altre */
  function apriGiornata(ds){
    const g=leggiGiornata(ds);
    const COL_GIOR={ritardo:["#c62828","IN RITARDO"],esce:["#e65100","ESCE"],
                    prenot:["#7C3AED","PRENOTATO"],rientra:["#1565c0","RIENTRA"]};
    const riga=(x,tipo,sotto)=>nolCard({cls:"riga-gior "+tipo,
      titolo:esc(x.mezzo||"—"),
      eti:[{t:(COL_GIOR[tipo]||COL_GIOR.rientra)[1],col:(COL_GIOR[tipo]||COL_GIOR.rientra)[0]}],
      corpo:`<div class="sub">${x.cliente?"Cliente: "+esc(x.cliente):"Cliente non indicato"}</div>
      <div class="sub2">${sotto}</div>`,
      pulsanti:nolPulsanti("noleggio",x.id)});
    const vuoto=t=>`<p class="gior-vuoto">${t}</p>`;
    let h="";
    h+=`<div class="mini-title">Escono oggi (${g.escono.length})</div>`;
    h+=g.escono.length?g.escono.map(x=>riga(x,nolFaseDi(x)==="prenotato"?"prenot":"esce",
        "Rientro previsto: "+(x.data_rientro_prevista?fdate(x.data_rientro_prevista):"non indicato"))).join("")
      :vuoto("Nessun mezzo esce in questa data.");
    h+=`<div class="mini-title">Rientri previsti (${g.rientrano.length})</div>`;
    h+=g.rientrano.length?g.rientrano.map(x=>riga(x,"rientra",
        "Uscito il "+(x.data_uscita?fdate(x.data_uscita):"—")+
        " · "+(x.stato_pagamento==="pagato"?"pagato":"da pagare"))).join("")
      :vuoto("Nessun rientro previsto in questa data.");
    if(g.ritardi.length){
      h+=`<div class="mini-title">Ancora fuori, in ritardo (${g.ritardi.length})</div>`;
      h+=g.ritardi.map(x=>riga(x,"ritardo",
        "Doveva rientrare il "+fdate(x.data_rientro_prevista))).join("");
    }
    h+=`<div class="mini-title">Lavori (${g.lavori.length})</div>`;
    h+=g.lavori.length?g.lavori.map(j=>nolCard({cls:"riga-gior lavoro",
        titolo:esc(j.descrizione||"(senza descrizione)"),
        eti:[{t:(statoLabel[j.stato]||j.stato||"").toUpperCase(),col:j.stato==='fatto'?'#2e7d32':'#757575'}],
        pulsanti:nolPulsanti("fattura",j.id)})).join("")
      :vuoto("Nessun lavoro in questa data.");
    openSheet(`<h3>${esc(nolTitolo("giornata",g))}</h3>${nolPulsantiScheda("giornata",ds,["nol-pdf","nol-stampa"])}
      ${h}
      <div class="field" style="margin-top:18px"><label>📌 Nota / promemoria del giorno</label>
        <textarea id="day-note" placeholder="Es. chiamare il cliente, portare la ricarica del gasolio...">${esc(g.nota)}</textarea></div>
      <div class="sheet-actions">
        <button class="b-cancel" data-action="new-job-date" data-d="${ds}">+ Lavoro in questa data</button>
        <button class="b-save" data-action="save-note" data-d="${ds}">Salva nota</button></div>`);
  }
  function openDay(ds){ return apriGiornata(ds); }

  async function renderClienti(){
    const box=$("#cli-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">🏢</div><p>Nessun condominio</p><small>Accedi per gestire i clienti</small></div>`;return;}
    const {data}=await sb.from("gest_clienti").select("id,nome,indirizzo,referente,telefono").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("nome");
    cliCache=data||[];
    box.innerHTML=cliCache.length?cliCache.map(c=>{
      return `<div class="card"><div><h3>${esc(c.nome)}</h3>
        <p>${c.indirizzo?"📍 "+esc(c.indirizzo)+"<br>":""}${c.referente?"👤 "+esc(c.referente)+" ":""}${c.telefono?"· 📞 "+esc(c.telefono):""}</p></div>
        <div class="card-acts"><button data-action="map" data-q="${esc(c.indirizzo||c.nome)}">🗺 Mappa</button>
        <button data-action="edit-cli" data-id="${c.id}">Modifica</button>
        <button class="del" data-action="del-cli" data-id="${c.id}">Elimina</button></div></div>`;
    }).join(""):`<div class="empty"><div class="ic">🏢</div><p>Nessun condominio</p><small>Aggiungi i clienti di questo reparto</small></div>`;
  }
  async function renderDip(){
    const box=$("#dip-list");if(!box)return;
    if(!sb){box.innerHTML=`<div class="empty"><div class="ic">👷</div><p>Squadra non disponibile</p><small>Connessione non riuscita</small></div>`;return;}
    if(!sbUid){box.innerHTML=`<div class="empty"><div class="ic">👷</div><p>Accedi per gestire la squadra</p><small>Entra nel pannello per invitare le persone</small></div>`;return;}
    const [{data:ops},{data:membri}]=await Promise.all([
      sb.from("gest_operatori").select("id,nome,telefono").eq("mestiere_id",curMestiere()),
      sb.from("gest_membri").select("operatore_id,codice,stato,ruolo,permessi")
    ]);
    const mB=Object.fromEntries((membri||[]).map(x=>[x.operatore_id,x]));
    dipCache=(ops||[]).map(o=>{const inv=mB[o.id]||{};return {id:o.id,nome:o.nome,telefono:o.telefono,ruolo:inv.ruolo||"operaio",permessi:inv.permessi||{}};});
    box.innerHTML=(ops&&ops.length)?ops.map(o=>{
      const inv=mB[o.id], att=inv&&inv.stato==="attivo", codice=inv?inv.codice:"";
      const link=inviteLink(codice);
      const wa="https://wa.me/?text="+encodeURIComponent("Ciao! Ti ho aggiunto alla squadra. Apri questo link per collegarti: "+link);
      return `<div class="card"><div><h3>${esc(o.nome)}</h3><div class="cnt">${att?"Attivo":"Invitato"}${o.telefono?" · 📞 "+esc(o.telefono):""}</div></div>
        <div class="card-acts"><button data-action="sq-edit" data-id="${o.id}">Modifica</button>
        ${codice?`<button data-action="sq-copy" data-link="${esc(link)}">Copia link</button>
        <button data-action="sq-wa" data-wa="${esc(wa)}">Invia su WhatsApp</button>
        <button data-action="sq-revoca" data-id="${o.id}" data-nome="${esc(o.nome)}" style="background:#fff0f0;color:#c0392b;border:1px solid #f0c0c0">Rimuovi accesso</button>`:""}</div></div>`;
    }).join(""):`<div class="empty"><div class="ic">👷</div><p>Nessuna persona</p><small>Aggiungi chi lavora in questo reparto</small></div>`;
  }
  const PERMS=[{key:"calendario",label:"Calendario"},{key:"lavori",label:"Lavori"},{key:"foto",label:"Foto"},{key:"note",label:"Note"},{key:"clienti",label:"Clienti"},{key:"fatture",label:"Fatture"},{key:"pagamenti",label:"Pagamenti"}];
  const RUOLO_PRESET={operaio:["calendario","lavori","foto"],preposto:["calendario","lavori","foto","note","clienti"],segretaria:["calendario","lavori","foto","note","clienti","fatture","pagamenti"]};
  function applyRuoloPreset(){
    const on=RUOLO_PRESET[$("#d-ruolo").value]||[];
    $$("#d-perms input[data-perm]").forEach(ch=>ch.checked=on.includes(ch.dataset.perm));
  }
  function squadraForm(op){
    const isNew=!op;op=op||{};
    openSheet(`<h3>${isNew?"Nuova persona":"Modifica persona"}</h3>
      <div class="field"><label>Nome</label><input id="d-nome" value="${esc(op.nome||"")}" placeholder="Es. Wahid"></div>
      <div class="field"><label>Telefono</label><input id="d-tel" type="tel" value="${esc(op.telefono||"")}" placeholder="Es. 333 1234567 (facoltativo)"></div>
      <div class="field"><label>Ruolo</label><select id="d-ruolo">
        <option value="operaio">Operaio</option>
        <option value="preposto">Preposto</option>
        <option value="segretaria">Segretaria</option></select></div>
      <div class="field"><label>Permessi</label><div id="d-perms">
        ${PERMS.map(p=>`<label class="perm-row" style="display:flex;align-items:center;justify-content:space-between;padding:9px 2px"><span>${p.label}</span><input type="checkbox" data-perm="${p.key}" style="width:22px;height:22px"></label>`).join("")}</div></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="${isNew?"sq-add":"sq-save"}" data-id="${op.id||""}">${isNew?"Aggiungi":"Salva"}</button></div>`);
    $("#d-ruolo").onchange=applyRuoloPreset;
    if(isNew){applyRuoloPreset();}
    else{
      if(op.ruolo)$("#d-ruolo").value=op.ruolo;
      const perms=op.permessi||{};
      $$("#d-perms input[data-perm]").forEach(ch=>ch.checked=!!perms[ch.dataset.perm]);
    }
  }
  async function ensureMestiere(){
    const {data}=await sb.from("gest_mestieri").select("id").limit(1);
    if(data&&data.length)return data[0].id;
    const {data:m,error}=await sb.from("gest_mestieri").insert({user_id:sbUid,nome:"Squadra",icona:"🛠️",colore:"#2e629e",ordine:0}).select().single();
    if(error)throw error;
    return m.id;
  }
  async function squadraAdd(){
    const nome=$("#d-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const telefono=$("#d-tel")?$("#d-tel").value.trim():"";
    const ruolo=$("#d-ruolo")?$("#d-ruolo").value:"operaio";
    const permessi={};$$("#d-perms input[data-perm]").forEach(ch=>permessi[ch.dataset.perm]=ch.checked);
    const mestiere_id=curMestiere();
    if(!mestiere_id){toast("Apri un reparto prima di aggiungere una persona");return;}
    const {data:op,error}=await sb.from("gest_operatori").insert({user_id:sbUid,mestiere_id,nome,telefono:telefono||null}).select().single();
    if(error){toast("Errore: "+error.message);return;}
    const codice=sbRand();
    const {error:e2}=await sb.from("gest_membri").insert({impresa_id:sbUid,operatore_id:op.id,codice,stato:"invitato",ruolo,permessi});
    if(e2){toast("Errore invito: "+e2.message);return;}
    closeSheet();renderDip();toast("Persona aggiunta, invito creato ✔");
  }
  async function squadraSave(id){
    if(!id)return;
    const nome=$("#d-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const telefono=$("#d-tel")?$("#d-tel").value.trim():"";
    const ruolo=$("#d-ruolo")?$("#d-ruolo").value:"operaio";
    const permessi={};$$("#d-perms input[data-perm]").forEach(ch=>permessi[ch.dataset.perm]=ch.checked);
    const {error}=await sb.from("gest_operatori").update({nome,telefono:telefono||null}).eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    const {error:e2}=await sb.from("gest_membri").update({ruolo,permessi}).eq("operatore_id",id).eq("impresa_id",sbUid);
    if(e2){toast("Errore permessi: "+e2.message);return;}
    closeSheet();renderDip();toast("Aggiornato ✔");
  }

  /* SCADENZARIO (solo professionista): tabella gest_scadenze, isolamento user_id+mestiere_id come gest_lavori/gest_clienti */
  const TIPI_PRATICA=["SCIA","CILA","Permesso di Costruire","Agibilità","Altro"];
  let scadCache=[];
  function _giorniDopo(ds,n){const[y,m,d]=ds.split("-").map(Number);const dt=new Date(y,m-1,d+n);const mm=String(dt.getMonth()+1).padStart(2,"0"),dd=String(dt.getDate()).padStart(2,"0");return dt.getFullYear()+"-"+mm+"-"+dd;}

  /* ===================================================================
     I PROMEMORIA — 14 settembre 2026
     Gli stessi del gestionale principale (tabella `promemoria`), disegnati
     con le CARTE del noleggio invece che con la tabella.
     ⛔ Il codice sta QUI DENTRO e non in un file js/ a parte come
        js/gest-promemoria.js: lo script del noleggio e' tutto chiuso dentro
        un `(function(){`, quindi da fuori non si vedono ne' sb, ne' sbUid,
        ne' $, ne' esc. Un file esterno non vedrebbe niente.
     ⚠️ NON si filtra per reparto ne' per noleggio: i promemoria sono della
        persona. Quelli scritti qui si vedono nel gestionale principale e
        viceversa.
     =================================================================== */
  let promCache=[], promVista="aperti";
  const PROM_AVVISI=[[0,"Il giorno stesso"],[1,"1 giorno prima"],[3,"3 giorni prima"],
                     [7,"7 giorni prima"],[15,"15 giorni prima"],[30,"30 giorni prima"]];
  const PROM_RIPETI=[["","Mai"],["1","Ogni mese"],["3","Ogni 3 mesi"],["6","Ogni 6 mesi"],["12","Ogni anno"]];
  const promEt=(el,v)=>{const r=el.find(x=>String(x[0])===String(v==null?"":v));return r?r[1]:"";};
  const promOra=o=>o?String(o).slice(0,5):"";

  /* la data del giro dopo, quando si segna fatto uno che si ripete. Si parte
     dalla SUA data e non da oggi: se lo spunti in ritardo, il giro dopo non
     slitta. */
  function promProssima(d,mesi){
    const [y,m,g]=String(d).split("-").map(Number);
    const dt=new Date(y,m-1+(+mesi||0),g);
    return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
  }

  async function renderPromemoria(){
    const box=$("#prom-list"); if(!box) return;
    if(!sb||!sbUid){box.innerHTML='<div class="empty"><div class="ic">🔔</div><p>Nessun promemoria</p><small>Accedi per scriverli</small></div>';return;}
    /* ⛔ il cestino si toglie qui, non nel disegno: se no i contatori delle
       viste contano anche la roba buttata e dicono un numero che a schermo
       non c'e'. */
    const {data,error}=await sb.from("promemoria").select("*")
      .eq("user_id",sbUid).is("eliminato_il",null).order("data",{ascending:true});
    if(error){toast("Promemoria non letti: "+error.message);return;}
    promCache=data||[];

    const filtra=(A,v)=>v==="aperti"?A.filter(p=>p.stato!=="fatto")
                      :v==="fatti"?A.filter(p=>p.stato==="fatto"):A.slice();
    const conta={aperti:filtra(promCache,"aperti").length,
                 fatti:filtra(promCache,"fatti").length, tutti:promCache.length};
    const viste=[["aperti","Da fare"],["fatti","Fatti"],["tutti","Tutti"]];
    const vb=$("#prom-viste");
    if(vb)vb.innerHTML=viste.map(v=>
      `<button class="vista${promVista===v[0]?" on":""}" data-action="prom-vista" data-v="${v[0]}">${v[1]}`
      +(conta[v[0]]?`<span class="v-cnt">${conta[v[0]]}</span>`:"")+`</button>`).join("");

    const L=filtra(promCache,promVista);
    const oggi=todayStr(), lim=_giorniDopo(oggi,7);
    box.innerHTML=L.length
      ? L.map(p=>promCard(p,oggi,lim)).join("")
      : '<div class="empty"><div class="ic">🔔</div><p>Nessun promemoria</p><small>Pagare l’F24, rendere una cauzione, portare il rimorchio alla revisione: scrivilo qui e te lo ricordo per email</small></div>';

    /* il pallino sulla voce del menu: quelli da fare entro 30 giorni, rosso se
       almeno uno e' gia' passato */
    const pall=$("#cnt-promemoria");
    if(pall){
      const vic=promCache.filter(p=>p.stato!=="fatto"&&p.data&&p.data<=_giorniDopo(oggi,30));
      pall.className="tab-cnt";
      if(!vic.length){pall.textContent="";}
      else{pall.textContent=String(vic.length);
           pall.classList.add(vic.some(p=>p.data<oggi)?"err":"attesa");}
    }
  }

  function promCard(p,oggi,lim){
    const fatto=p.stato==="fatto";
    let bg="#eef2f7",fg="#555",lab="Da fare";
    if(fatto){bg="#e3f3e8";fg="var(--fatto)";lab="Fatto";}
    else if(p.data&&p.data<oggi){bg="#fdecea";fg="#c0392b";lab="Passato";}
    else if(p.data&&p.data<=lim){bg="#fff4e5";fg="#c2410c";lab="In scadenza";}
    const ora=promOra(p.ora);
    return `<div class="card"><div>
      <h3>${esc(p.testo||"Promemoria")}</h3>
      <p>📅 ${fdate(p.data)}${ora?" alle "+esc(ora):""} <span class="stato" style="background:${bg};color:${fg}">${lab}</span>`
      +`<br>⏰ ${esc(promEt(PROM_AVVISI,p.avvisa_giorni||0))}`
      +(p.ripeti_mesi?`<br>🔁 ${esc(promEt(PROM_RIPETI,p.ripeti_mesi))}`:"")
      +(p.note?`<br>📝 ${esc(p.note)}`:"")+`</p></div>
      <div class="card-acts">
        ${fatto?`<button data-action="prom-stato" data-id="${p.id}" data-v="aperto">↩ Riapri</button>`
               :`<button data-action="prom-stato" data-id="${p.id}" data-v="fatto">✔ Segna fatto</button>`}
        <button data-action="edit-prom" data-id="${p.id}">Modifica</button>
        <button class="del" data-action="del-prom" data-id="${p.id}">Elimina</button></div></div>`;
  }

  function promForm(p){
    const isNew=!p; p=p||{};
    const opz=(el,sel)=>el.map(x=>`<option value="${x[0]}"${String(x[0])===String(sel==null?"":sel)?" selected":""}>${x[1]}</option>`).join("");
    openSheet(`<h3>${isNew?"Nuovo promemoria":"Modifica promemoria"}</h3>
      <div class="field"><label>Promemoria</label><input id="p-testo" value="${esc(p.testo||"")}" placeholder="Es. Revisione del rimorchio"></div>
      <div class="field"><label>Note</label><textarea id="p-note" placeholder="Quello che ti serve avere sotto mano quando lo leggi">${esc(p.note||"")}</textarea></div>
      <div class="field"><label>Giorno</label><input type="date" id="p-data" value="${esc(p.data||todayStr())}"></div>
      <div class="field"><label>Ora</label><input type="time" id="p-ora" value="${esc(promOra(p.ora))}"></div>
      <div class="field"><label>Avvisami</label><select id="p-avvisa">${opz(PROM_AVVISI,p.avvisa_giorni||0)}</select></div>
      <div class="field"><label>Si ripete</label><select id="p-ripeti">${opz(PROM_RIPETI,p.ripeti_mesi||"")}</select></div>
      <div class="sh-nota">L'email ti arriva la mattina alle <b>7:30</b> del giorno dell'avviso, e dentro c'&egrave; scritta l'ora che hai messo. Quando lo segni <b>fatto</b>, se si ripete torna da solo alla data dopo.</div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-prom" data-id="${p.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
  }

  async function salvaPromemoria(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const v=s=>{const e=$(s);return e?String(e.value||"").trim():"";};
    const testo=v("#p-testo"); if(!testo){toast("Scrivi cosa ti devo ricordare");return;}
    const data=v("#p-data");   if(!data){toast("Metti il giorno");return;}
    const row={user_id:sbUid,testo:testo,note:v("#p-note")||null,data:data,
               ora:v("#p-ora")||null,
               avvisa_giorni:parseInt(v("#p-avvisa"),10)||0,
               ripeti_mesi:parseInt(v("#p-ripeti"),10)||null};
    /* ⛔ se cambia la data, l'avviso riparte: `inviato` e' il segno che l'email
       di questo promemoria e' gia' uscita. Senza azzerarlo, chi sposta un F24
       di un mese non verrebbe piu' avvisato e resterebbe convinto del
       contrario. */
    const vecchio=promCache.find(x=>String(x.id)===String(id));
    if(!id||String(vecchio&&vecchio.data||"")!==data) row.inviato=false;
    /* ⚠️ ogni scrittura si verifica con .select("id"): Supabase non lancia su
       errore, e zero righe toccate non e' un errore. */
    const q=id
      ? await sb.from("promemoria").update(row).eq("id",id).eq("user_id",sbUid).select("id")
      : await sb.from("promemoria").insert(row).select("id");
    if(q.error||!q.data||!q.data.length){
      toast("Non salvato: "+((q.error&&q.error.message)||"nessuna riga scritta"));return;}
    closeSheet(); toast(id?"Promemoria aggiornato ✔":"Promemoria creato ✔");
    renderPromemoria();
  }

  async function promStato(id,stato){
    const p=promCache.find(x=>String(x.id)===String(id)); if(!p)return;
    let row;
    if(stato==="fatto"&&p.ripeti_mesi){
      row={data:promProssima(p.data,p.ripeti_mesi),stato:"aperto",inviato:false};
    }else{
      row={stato:stato};
      if(stato==="aperto")row.inviato=false;
    }
    const q=await sb.from("promemoria").update(row).eq("id",id).eq("user_id",sbUid).select("id");
    if(q.error||!q.data||!q.data.length){
      toast("Non salvato: "+((q.error&&q.error.message)||"nessuna riga scritta"));return;}
    toast(stato==="fatto"&&p.ripeti_mesi ? "Fatto ✔ Torna il "+fdate(row.data)
         : (stato==="fatto"?"Segnato fatto ✔":"Riaperto"));
    renderPromemoria();
  }

  /* Buttare = scrivere la data in eliminato_il. La riga resta e si recupera
     dal Cestino, come tutto il resto. */
  async function promButta(id){
    const q=await sb.from("promemoria").update({eliminato_il:new Date().toISOString()})
      .eq("id",id).eq("user_id",sbUid).select("id");
    if(q.error||!q.data||!q.data.length){
      toast("Non buttato: "+((q.error&&q.error.message)||"nessuna riga scritta"));return;}
    toast("Buttato nel cestino"); renderPromemoria();
  }

  async function renderScadenze(){
    const box=$("#scad-list");if(!box)return;
    if(ruoloUtente!=='professionista'||!cur){box.innerHTML="";return;}
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">📅</div><p>Nessuna scadenza</p><small>Accedi per gestire lo scadenzario</small></div>`;return;}
    const mid=curMestiere();
    const [{data:sc},{data:cl}]=await Promise.all([
      sb.from("gest_scadenze").select("id,titolo,tipo_pratica,cliente_id,data_scadenza,stato,note").eq("user_id",sbUid).eq("mestiere_id",mid).order("data_scadenza",{ascending:true}),
      sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);
    scadCache=sc||[];
    const cliMap=Object.fromEntries((cl||[]).map(c=>[c.id,c.nome]));
    const oggi=todayStr(),lim=_giorniDopo(oggi,7);
    box.innerHTML=scadCache.length?scadCache.map(s=>scadCard(s,cliMap,oggi,lim)).join(""):`<div class="empty"><div class="ic">📅</div><p>Nessuna scadenza</p><small>Aggiungi le scadenze di questo reparto</small></div>`;
  }
  function scadCard(s,cliMap,oggi,lim){
    const fatta=s.stato==="fatta";
    const cliNome=s.cliente_id?(cliMap[s.cliente_id]||"(cliente eliminato)"):"";
    let bg="#eef2f7",fg="#555",lab="Aperta";
    if(fatta){bg="#e3f3e8";fg="var(--fatto)";lab="Fatta";}
    else if(s.data_scadenza&&s.data_scadenza<oggi){bg="#fdecea";fg="#c0392b";lab="Scaduta";}
    else if(s.data_scadenza&&s.data_scadenza<=lim){bg="#fff4e5";fg="#c2410c";lab="In scadenza";}
    return `<div class="card"><div>
      <h3>${esc(s.titolo||"Scadenza")}</h3>
      <p>${s.tipo_pratica?"📄 "+esc(s.tipo_pratica)+"<br>":""}${cliNome?"👤 "+esc(cliNome)+"<br>":""}📅 ${fdate(s.data_scadenza)} <span class="stato" style="background:${bg};color:${fg}">${lab}</span>${s.note?"<br>📝 "+esc(s.note):""}</p></div>
      <div class="card-acts">
        ${fatta?`<button data-action="scad-stato" data-id="${s.id}" data-v="aperta">↩ Riapri</button>`:`<button data-action="scad-stato" data-id="${s.id}" data-v="fatta">✔ Segna fatta</button>`}
        <button data-action="edit-scad" data-id="${s.id}">Modifica</button>
        <button class="del" data-action="del-scad" data-id="${s.id}">Elimina</button></div></div>`;
  }
  async function scadForm(s){
    const isNew=!s;s=s||{};
    const mid=curMestiere();
    let cl=[];
    if(sb&&sbUid){const {data}=await sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",mid).order("nome");cl=data||[];}
    const tipoOpts=TIPI_PRATICA.map(tp=>`<option value="${esc(tp)}" ${tp===s.tipo_pratica?"selected":""}>${esc(tp)}</option>`).join("");
    const cliOpts=cl.map(c=>`<option value="${c.id}" ${c.id===s.cliente_id?"selected":""}>${esc(c.nome)}</option>`).join("");
    openSheet(`<h3>${isNew?"Nuova scadenza":"Modifica scadenza"}</h3>
      <div class="field"><label>Titolo</label><input id="s-tit" value="${esc(s.titolo||"")}" placeholder="Es. Presentazione SCIA"></div>
      <div class="field"><label>Tipo</label><select id="s-tipo">${tipoOpts}</select></div>
      <div class="field"><label>Cliente</label><select id="s-cli"><option value="">— nessuno —</option>${cliOpts}</select></div>
      <div class="field"><label>Data scadenza</label><input type="date" id="s-data" value="${s.data_scadenza||""}"></div>
      <div class="field"><label>Note</label><textarea id="s-note" placeholder="Dettagli, riferimenti...">${esc(s.note||"")}</textarea></div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-scad" data-id="${s.id||""}">${isNew?"Crea":"Salva"}</button></div>`);
  }
  async function saveScad(id){
    const titolo=$("#s-tit").value.trim();if(!titolo){toast("Scrivi il titolo");return;}
    const data_scadenza=$("#s-data").value;if(!data_scadenza){toast("Inserisci la data di scadenza");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const tipo_pratica=$("#s-tipo")?$("#s-tipo").value:"";
    const cliente_id=($("#s-cli")&&$("#s-cli").value)?$("#s-cli").value:null;
    const note=$("#s-note").value.trim();
    const {error}=id
      ?await sb.from("gest_scadenze").update({titolo,tipo_pratica,cliente_id,data_scadenza,note}).eq("id",id).eq("user_id",sbUid)
      :await sb.from("gest_scadenze").insert({user_id:sbUid,mestiere_id:curMestiere(),titolo,tipo_pratica,cliente_id,data_scadenza,note,stato:"aperta"});
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();renderScadenze();toast(id?"Aggiornato":"Scadenza aggiunta ✔");
  }
