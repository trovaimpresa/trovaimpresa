// [SPOSTATO] nol-lavori-fatture-pdf.js: era dentro nol-core.js, righe 4062-4334, spostato identico.

  function jobCard(l){
    const c=cliById(l.clienteId), d=dipById(l.assegnatoId), dove=l.dove||(c&&c.indirizzo)||"";
    const fatto=l.stato==="fatto", fs=l.fattStato||"none";
    const lavLab=fatto?"Fatto":(l.stato==="in_corso"?"In corso":"Da fare");
    const fattDot=fs==="pagata"?"verde":(fs==="emessa"?"rosso":"grigio");
    const fattLab=fs==="pagata"?"Pagata":(fs==="emessa"?"Emessa, da incassare":"Non fatturata");
    return `<div class="job">
      <div class="job-top"><div class="job-cli">${esc(c?c.nome:"(cliente eliminato)")}</div></div>
      ${l.descrizione?`<div class="job-desc">${esc(l.descrizione)}</div>`:""}
      <div class="stati">
        <span class="st"><i class="pall ${fatto?'verde':'rosso'}"></i><span class="lab">${lavLab}</span></span>
        ${l.importo?`<span class="st"><i class="pall ${fattDot}"></i><span class="lab">${fattLab}</span></span>`:""}
      </div>
      ${l.lavoroSvolto?`<div class="job-done">✔ Fatto: ${esc(l.lavoroSvolto)}</div>`:""}
      ${l.note?`<div class="job-note">📝 ${esc(l.note)}</div>`:""}
      <div class="job-meta">
        ${dove?`<span>📍 ${esc(dove)}</span>`:""}
        <span>📅 ${fdate(l.dataPrevista)}</span>
        ${d?`<span>👷 ${esc(d.nome)}</span>`:""}
        ${l.ore?`<span>⏱ ${l.ore} h</span>`:""}
        ${l.importo?`<span class="euro ${fs==='pagata'?'pg':'np'}">💶 ${_eur(l.importo)}</span>`:""}
      </div>
      <div class="job-actions">
        ${dove?`<button class="ja map" data-action="map" data-q="${esc(dove)}">🗺 Mappa</button>`:""}
        ${l.stato==="da_fare"?`<button class="ja go" data-action="stato" data-id="${l.id}" data-v="in_corso">▶ Avvia</button>`:""}
        ${!fatto?`<button class="ja go" data-action="stato" data-id="${l.id}" data-v="fatto">✔ Segna fatto</button>`:""}
        ${fatto&&fs==="none"?`<button class="ja unpay" data-action="fatt" data-id="${l.id}" data-v="emessa">📄 Fattura emessa</button>`:""}
        ${fs==="emessa"?`<button class="ja pay" data-action="fatt" data-id="${l.id}" data-v="pagata">💶 Segna pagata</button>`:""}
        ${fs==="pagata"?`<button class="ja unpay" data-action="fatt" data-id="${l.id}" data-v="emessa">↩ Non pagata</button>`:""}
        <button class="ja" data-action="edit-job" data-id="${l.id}">✏ Modifica</button>
        <button class="ja del" data-action="del-job" data-id="${l.id}">🗑</button>
      </div></div>`;
  }

  /* Pulisce un numero per wa.me. Numeri vuoti → "" (link senza destinatario).
     - se l'originale inizia con "+" o "00" ha già il prefisso internazionale:
       usa le cifre così come sono (tolto "00" iniziale, il "+" cade con le non-cifre);
     - altrimenti, se le cifre iniziano con "3" (mobile IT) antepone "39". */
  function waCleanTel(tel){
    if(!tel)return"";
    const raw=String(tel).trim();
    const intl=raw[0]==="+"||raw.indexOf("00")===0;
    let n=raw.replace(/\D/g,"");
    if(!n)return"";
    if(intl){if(n.indexOf("00")===0)n=n.slice(2);return n;}
    if(/^3/.test(n))return"39"+n;
    return n;
  }
  function jobCardSupa(l,withFoto,opTel){
    const fatto=l.stato==="fatto", dove=l.dove||"";
    const lavLab=fatto?"Fatto":(l.stato==="in_corso"?"In corso":"Da fare");
    const dp=esc(l.data_prevista||"");
    const opLink=location.href.replace(/[^/]*$/,"")+"gestionale-operatore.html";
    const isPro=ruoloUtente==='professionista';
    const termCap=isPro?"Pratica":"Lavoro";
    const intro=isPro?"Ciao! C'è una nuova pratica per te.":"Ciao! C'è un nuovo lavoro per te.";
    const waText=encodeURIComponent(intro+"\n"+termCap+": "+(l.descrizione||termCap)+"\nDove: "+(dove||"—")+"\nData prevista: "+fdate(l.data_prevista)+"\nApri l'app operatore: "+opLink);
    const waTel=waCleanTel(opTel);
    const wa=waTel?("https://wa.me/"+waTel+"?text="+waText):("https://wa.me/?text="+waText);
    return `<div class="job">
      <div class="job-top"><div class="job-cli">${esc(l.descrizione||"Lavoro")}</div></div>
      <div class="stati">
        <span class="st"><i class="pall ${fatto?'verde':'rosso'}"></i><span class="lab">${lavLab}</span></span>
      </div>
      <div class="job-meta">
        ${dove?`<span>📍 ${esc(dove)}</span>`:""}
        <span>📅 ${fdate(l.data_prevista)}</span>
      </div>
      <div class="job-actions">
        ${dove?`<button class="ja map" data-action="map" data-q="${esc(dove)}">🗺 Mappa</button>`:""}
        ${withFoto&&l.stato==="da_fare"?`<button class="ja go" data-action="stato-supa" data-id="${esc(l.id)}" data-v="in_corso" data-dp="${dp}">▶ Avvia</button>`:""}
        ${withFoto&&!fatto?`<button class="ja go" data-action="stato-supa" data-id="${esc(l.id)}" data-v="fatto" data-dp="${dp}">✔ Segna fatto</button>`:""}
        ${withFoto&&fatto?`<button class="ja" data-action="stato-supa" data-id="${esc(l.id)}" data-v="da_fare" data-dp="${dp}">↩ Riapri</button>`:""}
        ${withFoto?`<button class="ja" data-action="lf-open" data-id="${esc(l.id)}" data-desc="${esc(l.descrizione||"Lavoro")}">📷 Foto (cosa fare)</button>`:""}
        ${withFoto?`<button class="ja" data-action="sq-wa" data-wa="${esc(wa)}">Avvisa su WhatsApp</button>`:""}
      </div></div>`;
  }
  async function renderJobs(){
    const box=$("#jobs-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">📋</div><p>Nessun lavoro qui</p><small>Cambia filtro o aggiungi un nuovo lavoro</small></div>`;return;}
    const {data}=await sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,operatore_id").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    let L=data||[];
    const {data:ops}=await sb.from("gest_operatori").select("id,telefono").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    const telMap=Object.fromEntries((ops||[]).map(o=>[o.id,o.telefono||""]));
    if(filter.stato==="fatto")L=L.filter(l=>l.stato==="fatto");
    else if(filter.stato==="da_fare")L=L.filter(l=>l.stato!=="fatto");
    else if(filter.stato==="in_corso")L=L.filter(l=>l.stato==="in_corso");
    else if(filter.stato==="da_incassare")L=[];
    if(filter.q){const q=filter.q.toLowerCase();L=L.filter(l=>(l.descrizione||"").toLowerCase().includes(q)||(l.dove||"").toLowerCase().includes(q));}
    L.sort((a,b)=>(a.data_prevista||"9999").localeCompare(b.data_prevista||"9999"));
    box.innerHTML=L.length?L.map(l=>jobCardSupa(l,true,telMap[l.operatore_id]||"")).join(""):`<div class="empty"><div class="ic">📋</div><p>Nessun lavoro qui</p><small>Cambia filtro o aggiungi un nuovo lavoro</small></div>`;
  }

  let lfLavoroId=null;
  function showLavoroFoto(id,desc){
    lfLavoroId=id;
    if($("#lf-title"))$("#lf-title").textContent="Foto — "+(desc||"cosa fare");
    $$("nav.tabs button").forEach(x=>x.classList.remove("active"));
    $$("section").forEach(s=>s.classList.toggle("active",s.id==="lavoro-foto"));
    window.scrollTo(0,0);renderLavoroFoto();
  }
  async function renderLavoroFoto(){
    const grid=$("#lf-grid");if(!grid)return;
    if(!sb||!sbUid||!lfLavoroId){grid.innerHTML="";return;}
    const {data}=await sb.from("gest_foto").select("storage_path").eq("lavoro_id",lfLavoroId).eq("tipo","da_fare");
    const fs=data||[];
    if(!fs.length){grid.innerHTML=`<div class="empty"><div class="ic">📷</div><p>Ancora nessuna foto</p><small>Aggiungi le foto di cosa c'è da fare</small></div>`;return;}
    grid.innerHTML="";
    for(const f of fs){
      const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
      if(su&&su.signedUrl){const d=document.createElement("div");d.className="thumb";const img=document.createElement("img");img.src=su.signedUrl;d.appendChild(img);grid.appendChild(d);}
    }
  }
  async function uploadLavoroFoto(files){
    if(!files||!files.length||!lfLavoroId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    let n=0;
    for(const file of Array.from(files)){
      /* ridimensiona a 1600px/JPEG 0.75 e blocca oltre 15 MB (js/foto-upload.js) */
      const p=await preparaFileUpload(file);
      if(p.errore){toast(p.errore);continue;}
      const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+"/"+lfLavoroId+"/"+Date.now()+"_"+safe;
      const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
      if(up){toast("Foto non caricata: "+up.message);continue;}
      const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,lavoro_id:lfLavoroId,tipo:"da_fare",operatore:"Capo",storage_path:path});
      if(ins){toast("Foto su, ma non salvata: "+ins.message);continue;}
      n++;
    }
    if(n)toast(n===1?"Foto aggiunta ✔":n+" foto aggiunte ✔");
    renderLavoroFoto();
  }
  let fattUploadLavoroId=null;
  function chiediFatturaPdf(lavoroId){
    fattUploadLavoroId=lavoroId;
    $("#fatt-pdf-file").click();
  }
  async function uploadFatturaPdf(file){
    if(!file||!fattUploadLavoroId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    if(file.type!=="application/pdf"){toast("Carica un file PDF");return;}
    /* il PDF non è un'immagine: preparaFileUpload lo lascia intatto, applica solo il limite */
    const p=await preparaFileUpload(file);
    if(p.errore){toast(p.errore);return;}
    const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=sbUid+"/"+fattUploadLavoroId+"/"+Date.now()+"_"+safe;
    const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
    if(up){toast("Fattura non caricata: "+up.message);return;}
    const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,lavoro_id:fattUploadLavoroId,tipo:"fattura",operatore:"Capo",storage_path:path});
    if(ins){toast("File su, ma non salvato: "+ins.message);return;}
    toast("Fattura PDF caricata ✔");renderFatture();
  }
  async function apriFatturaPdf(fotoId){
    const all=Object.values(fatturaPdfCache);
    const f=all.find(p=>p.id===fotoId);
    if(!f)return;
    const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
    if(su&&su.signedUrl)window.open(su.signedUrl,"_blank");
    else toast("Non riesco ad aprire la fattura");
  }
  /* ⛔ 22 agosto 2026 — sulla riga solo «Apri».
     Prima ogni fattura si portava dietro quattro pulsanti: PDF, carica PDF,
     apri PDF e il cambio di stato. Con venti fatture erano ottanta pulsanti
     e non si trovava piu' niente. Adesso stanno tutti dentro la scheda. */
  function fattRow(l){
    const st=l.fatt_stato||"none";
    const pdf=fatturaPdfCache[l.id];
    return nolCard({col:FATT_COLORE[st],
      titolo:esc(l.descrizione||"Lavoro"),
      eti:[{t:esc(FATT_ETICHETTA[st].toUpperCase())}],
      corpo:`<div class="sub">${_eur(l.importo)}${l.ore?" · "+esc(String(l.ore))+" ore":""}</div>
      <div class="sub2">📅 ${fdate(l.data_fatto||l.data_prevista)}${pdf?" · 📄 fattura allegata":""}</div>`,
      pulsanti:nolPulsanti("fattura",l.id)});
  }

  /* ── LA SCHEDA DELLA FATTURA — a tutta pagina ──
     ⚠️ Non e' il fatturatore vero (niente righe, IVA, ritenuta, bollo,
     numerazione): quello sta nel gestionale imprese. Qui si tiene il conto
     di cosa e' stato fatto, quanto, e se e' stato incassato. */
  function schedaFattura(l){
    l=l||{};
    const v=(k)=>esc(l[k]==null?"":l[k]);
    const st=l.fatt_stato||"none";
    const pdf=fatturaPdfCache[l.id];
    openSheet(`<h3>${esc(nolTitolo("fattura",l))}</h3>${nolPulsantiScheda("fattura",l.id||"")}
      <div class="field"><label>Oggetto *</label>
        <textarea id="nfa-desc" placeholder="Cosa è stato fatto o noleggiato">${v('descrizione')}</textarea></div>
      <div class="field"><label>Dove</label><input id="nfa-dove" value="${v('dove')}" placeholder="Cantiere, indirizzo"></div>
      <div class="nol-riq nol-cam">
        <h4>Soldi</h4>
        <div class="nol-due">
          <div><label>Importo €</label><input id="nfa-imp" inputmode="decimal" value="${l.importo==null?"":String(l.importo).replace(".",",")}" placeholder="0,00"></div>
          <div><label>Ore lavorate</label><input id="nfa-ore" inputmode="decimal" value="${v('ore')}" placeholder="0"></div>
        </div>
        <p style="margin:10px 0 0;font-size:14px;color:#666">L'importo va scritto anche con la virgola: 1.250,50 si salva intero.</p>
      </div>
      <div class="nol-riq nol-cam">
        <h4>Date</h4>
        <div class="nol-due">
          <div><label>Data prevista</label><input type="date" id="nfa-dataprev" value="${v('data_prevista')}"></div>
          <div><label>Data del fatto</label><input type="date" id="nfa-datafatto" value="${v('data_fatto')}"></div>
        </div>
      </div>
      <div class="field"><label>Stato del lavoro</label><div class="seg" id="nfa-lav">
        ${["da_fare","in_corso","fatto"].map(x=>`<button type="button" data-v="${x}" class="${(l.stato||"da_fare")===x?"on":""}">${esc(statoLabel[x])}</button>`).join("")}</div></div>
      <div class="field"><label>Stato della fattura</label><div class="seg" id="nfa-stato">
        ${["none","emessa","pagata"].map(s=>`<button type="button" data-v="${s}" class="${st===s?"on":""}">${esc(FATT_ETICHETTA[s])}</button>`).join("")}</div></div>
      <div class="field"><label>Fattura in PDF</label>
        <div class="nol-azioni">
          ${pdf?`<button class="nol-az" data-action="open-fattura" data-id="${esc(pdf.id)}">📄 Apri il PDF allegato</button>`:""}
          <button class="nol-az" data-action="upload-fattura" data-id="${l.id||""}">📎 ${pdf?"Sostituisci":"Allega"} il PDF</button>
        </div></div>
      <div class="field"><label>Note</label><textarea id="nfa-note" placeholder="Quello che serve ricordare">${v('note')}</textarea></div>
      ${nolDocBlocco("fattura",l.id||"")}
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button>
      <button class="b-save" data-action="save-fatt" data-id="${l.id||""}">Salva</button></div>`);
    bindSeg("nfa-stato"); bindSeg("nfa-lav");
  }

  async function salvaFattura(id){
    if(!id){toast("Questa fattura non si trova più");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const desc=$("#nfa-desc").value.trim();
    if(!desc){toast("Scrivi l'oggetto della fattura");return;}
    const dati={descrizione:desc,
      dove:$("#nfa-dove").value.trim()||null,
      /* ⚠️ _numIt e non +valore: con «1250,50» il vecchio codice salvava 0 */
      importo:_numIt($("#nfa-imp").value),
      ore:$("#nfa-ore").value===""?null:_numIt($("#nfa-ore").value),
      data_prevista:$("#nfa-dataprev").value||null,
      data_fatto:$("#nfa-datafatto").value||null,
      stato:segVal("nfa-lav")||"da_fare",
      fatt_stato:segVal("nfa-stato")||"none",
      note:$("#nfa-note").value.trim()||null};
    const {error}=await sb.from("gest_lavori").update(dati).eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); renderFatture(); renderJobs(); toast("Fattura aggiornata ✔");
  }
  let fatturaPdfCache={};
  async function renderFatture(){
    let L=[];
    if(sb&&sbUid){
      /* 24 agosto 2026 — prima filtrava "solo i lavori del reparto in cui
         sono": col Noleggio senza piu' reparto, mostra i lavori di TUTTA
         l'azienda, di qualunque reparto — niente sparisce, si allarga solo
         lo sguardo. */
      const {data}=await sb.from("gest_lavori").select("id,descrizione,stato,importo,fatt_stato,data_prevista,data_fatto").eq("user_id",sbUid);
      L=(data||[]).filter(l=>+l.importo>0);
      const ids=L.map(l=>l.id);
      fatturaPdfCache={};
      if(ids.length){
        const {data:pdfs}=await sb.from("gest_foto").select("id,lavoro_id,storage_path,created_at").eq("user_id",sbUid).eq("tipo","fattura").in("lavoro_id",ids).order("created_at",{ascending:false});
        (pdfs||[]).forEach(p=>{if(!fatturaPdfCache[p.lavoro_id])fatturaPdfCache[p.lavoro_id]=p;});
      }
    }
    const daFatt=L.filter(l=>l.stato==="fatto"&&(l.fatt_stato||"none")==="none");
    const daInc=L.filter(l=>l.fatt_stato==="emessa");
    const pagate=L.filter(l=>l.fatt_stato==="pagata");
    const tInc=daInc.reduce((s,l)=>s+(+l.importo||0),0);
    const tFatt=daFatt.reduce((s,l)=>s+(+l.importo||0),0);
    $("#fatt-summary").innerHTML=`<div class="num-c fatt-tot"><div class="l num-d">Da incassare (fatture emesse)</div><div class="n num-n">${_eur(tInc)}</div></div>
      <div class="num-c fatt-tot alt"><div class="l num-d">Lavori finiti da fatturare</div><div class="n num-n">${_eur(tFatt)}</div></div>`;
    let h="";
    h+=`<div class="mini-title">📄 Da fatturare (lavori finiti)</div>`;
    h+=daFatt.length?daFatt.map(fattRow).join(""):`<p class="fatt-empty">Nessun lavoro finito in attesa di fattura.</p>`;
    h+=`<div class="mini-title">💶 Emesse · da incassare</div>`;
    h+=daInc.length?daInc.map(fattRow).join(""):`<p class="fatt-empty">Nessuna fattura da incassare.</p>`;
    h+=`<div class="mini-title">✅ Pagate</div>`;
    h+=pagate.length?pagate.map(fattRow).join(""):`<p class="fatt-empty">Ancora nessuna fattura pagata.</p>`;
    $("#fatt-body").innerHTML=h;
  }
  $('[data-tab="fatture"]')?.addEventListener("click",renderFatture);
