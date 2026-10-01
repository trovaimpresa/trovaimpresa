// [SPOSTATO] nol-registratore-calendario.js: era dentro nol-core.js, righe 4861-5167, spostato identico.
  /* ================================================================
     LA VIDEOCAMERA DENTRO IL GESTIONALE — 23 agosto 2026

     ⛔ IL PROBLEMA VERO, IN UN NUMERO: il deposito accetta 50 MB per file.
     Un minuto girato con l'app Fotocamera di un iPhone pesa 100–150 MB.
     Non e' che «occupa troppo spazio»: NON SI CARICA PROPRIO. E Safari non
     sa rimpicciolire un video dopo (captureStream su un <video> non ce
     l'ha), quindi nemmeno la riduzione nel browser lo salva.

     ⛔ Percio' il video si gira QUI: 720p, 1,2 Mbps, audio a 64 kbps mono.
     Nasce sui 10 MB al minuto — cioe' entra, si carica in un attimo, e per
     far vedere un graffio si vede benissimo lo stesso.

     ⚠️ L'AUDIO SI TIENE, e non e' un dettaglio: «qui c'era gia' questo
     segno» detto ad alta voce mentre lo si inquadra vale piu' di dieci
     fotografie mute.

     ⚠️ DUE FRENI, perche' nessuno si ritrovi con un file che non si carica:
     tre minuti al massimo, e stop automatico a 45 MB.
     ================================================================ */
  const REG_MAX_SEC  = 180;
  const REG_MAX_BYTE = 45*1024*1024;
  let regStream=null, regRec=null, regPezzi=[], regBlob=null, regTipo="",
      regMomento="uscita", regDa=0, regTicchio=null, regFase="chiuso";

  /* mp4 per primo: un webm girato su Android non si apre su un iPhone, e
     il video serve proprio a farlo vedere a qualcun altro. */
  function regFormato(){
    if(typeof MediaRecorder==="undefined") return null;
    const prove=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4",
                 "video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
    for(const t of prove){ try{ if(MediaRecorder.isTypeSupported(t)) return t; }catch(e){} }
    return null;
  }
  function regTasti(){
    const box=$("#reg-tasti"); if(!box) return;
    const b=(azione,testo,forte)=>'<button type="button" class="nol-az'+(forte?" nol-az-apri":"")+
      '" data-action="'+azione+'">'+testo+'</button>';
    if(regFase==="pronto")    box.innerHTML=b("reg-avvia","&#9679; Registra",true)+b("reg-chiudi","Annulla");
    else if(regFase==="gira") box.innerHTML=b("reg-ferma","&#9632; Ferma",true);
    else if(regFase==="fatto")box.innerHTML=b("reg-usa","Usa questo video",true)+
                                            b("reg-rifai","Rifai")+b("reg-chiudi","Annulla");
    else box.innerHTML="";
    /* ⚠️ in fondo alla scheda c'e' la barra «Chiudi» appiccicata: senza
       questo, sul telefono il tasto «Ferma» finiva sotto la barra e non si
       riusciva a fermare la registrazione. */
    if(regFase!=="chiuso"){
      try{ box.scrollIntoView({behavior:"smooth",block:"center"}); }catch(e){}
    }
  }
  function regDillo(t){ const e=$("#reg-stato"); if(e) e.innerHTML=t||""; }
  function regPesoOra(){ return regPezzi.reduce((s,p)=>s+(p.size||0),0); }
  function regOrologio(){
    const sec=Math.floor((Date.now()-regDa)/1000);
    const m=Math.floor(sec/60), s=sec%60;
    regDillo('<b class="reg-pallino">&#9679;</b> '+m+":"+String(s).padStart(2,"0")+
      " · circa "+mediaPeso(regPesoOra())+" · massimo "+Math.floor(REG_MAX_SEC/60)+" minuti");
    if(sec>=REG_MAX_SEC){ toast("Tre minuti: ho fermato io"); regFerma(); return; }
    if(regPesoOra()>=REG_MAX_BYTE){ toast("45 MB: ho fermato io, se no non si carica"); regFerma(); }
  }

  async function regApri(momento){
    const box=$("#reg-box"); if(!box) return;
    regMomento=momento||"uscita";
    box.style.display="";
    const tit=$("#reg-tit"); if(tit) tit.textContent=
      momento==="rientro"?"Registra il video del rientro":"Registra il video della consegna";
    regFase="pronto"; regTasti(); regDillo("");
    if(!regFormato()){
      regFase="chiuso"; regTasti();
      regDillo('<span class="reg-male">Questo browser non sa registrare video. Usa «Carica un video».</span>');
      return;
    }
    if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){
      regFase="chiuso"; regTasti();
      regDillo('<span class="reg-male">Questo browser non dà accesso alla fotocamera. Usa «Carica un video».</span>');
      return;
    }
    try{
      regStream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},
        audio:true});
    }catch(e){
      regFase="chiuso"; regTasti();
      regDillo('<span class="reg-male">Fotocamera non disponibile: '+esc(e&&e.message?e.message:"permesso negato")+
        '. Puoi sempre usare «Carica un video».</span>');
      return;
    }
    const v=$("#reg-video");
    if(v){ v.srcObject=regStream; v.muted=true; v.controls=false; try{ await v.play(); }catch(e){} }
    regDillo("Inquadra il mezzo e premi «Registra».");
    box.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  function regSpegni(){
    if(regTicchio){ clearInterval(regTicchio); regTicchio=null; }
    try{ if(regRec&&regRec.state!=="inactive") regRec.stop(); }catch(e){}
    regRec=null;
    try{ if(regStream) regStream.getTracks().forEach(t=>t.stop()); }catch(e){}
    regStream=null;
  }
  function regChiudi(){
    regSpegni();
    regPezzi=[]; regBlob=null; regFase="chiuso";
    const v=$("#reg-video");
    if(v){ try{ v.pause(); }catch(e){} v.srcObject=null; if(v.src){try{URL.revokeObjectURL(v.src);}catch(e){} v.removeAttribute("src");} v.controls=false; }
    const box=$("#reg-box"); if(box) box.style.display="none";
    regTasti(); regDillo("");
  }
  function regAvvia(){
    if(!regStream){ toast("La fotocamera non è accesa"); return; }
    const tipo=regFormato(); if(!tipo){ toast("Questo browser non sa registrare"); return; }
    regPezzi=[]; regBlob=null; regTipo=tipo;
    try{
      regRec=new MediaRecorder(regStream,{mimeType:tipo,videoBitsPerSecond:1200000,audioBitsPerSecond:64000});
    }catch(e){
      try{ regRec=new MediaRecorder(regStream); }catch(e2){ toast("Non riesco a registrare"); return; }
    }
    regRec.ondataavailable=ev=>{ if(ev.data&&ev.data.size) regPezzi.push(ev.data); };
    regRec.onstop=()=>{
      if(regTicchio){ clearInterval(regTicchio); regTicchio=null; }
      regBlob=new Blob(regPezzi,{type:regTipo||"video/webm"});
      regFase="fatto"; regTasti();
      const v=$("#reg-video");
      if(v){ try{ v.pause(); }catch(e){} v.srcObject=null; v.muted=false; v.controls=true;
             try{ v.src=URL.createObjectURL(regBlob); }catch(e){} }
      regDillo("Fatto: "+mediaPeso(regBlob.size)+". Guardalo, poi «Usa questo video».");
    };
    /* un pezzo al secondo: cosi' il peso si vede crescere davvero e il
       freno dei 45 MB puo' scattare in tempo */
    regRec.start(1000);
    regDa=Date.now(); regFase="gira"; regTasti(); regOrologio();
    regTicchio=setInterval(regOrologio,1000);
  }
  function regFerma(){
    if(regTicchio){ clearInterval(regTicchio); regTicchio=null; }
    try{ if(regRec&&regRec.state!=="inactive") regRec.stop(); }catch(e){ regFase="pronto"; regTasti(); }
  }
  function regRifai(){
    regPezzi=[]; regBlob=null;
    const v=$("#reg-video");
    if(v){ v.controls=false; v.muted=true; if(v.src){try{URL.revokeObjectURL(v.src);}catch(e){} v.removeAttribute("src");}
           if(regStream){ v.srcObject=regStream; try{ v.play(); }catch(e){} } }
    regFase=regStream?"pronto":"chiuso"; regTasti();
    regDillo(regStream?"Inquadra il mezzo e premi «Registra».":"");
  }
  async function regUsa(){
    if(!regBlob||!regBlob.size){ toast("Non c'è niente da salvare"); return; }
    const est=(regTipo||"").indexOf("mp4")>=0?".mp4":".webm";
    const nome="giro-"+(regMomento==="rientro"?"rientro":"consegna")+"-"+todayStr()+est;
    let file;
    try{ file=new File([regBlob],nome,{type:regTipo||"video/webm"}); }
    catch(e){ file=regBlob; file.name=nome; }
    mediaChiesto={momento:regMomento,genere:"video"};
    const b=regBlob; regBlob=null;
    regChiudi();
    /* ⛔ «gia' ridotto»: questo video e' NATO a 720p qui dentro. Rifarlo da
       capo vorrebbe dire aspettare un'altra volta la sua durata per non
       guadagnare niente. */
    await mediaCarica([file],true);
    if(b&&b.size>REG_MAX_BYTE) toast("Attenzione: il file è grosso");
  }

  /* una porta per il banco: dice a che punto sta la videocamera senza
     doverlo indovinare da quello che si vede */
  window.__regStato=()=>({fase:regFase,acceso:!!regStream,
    peso:regBlob?regBlob.size:0,tipo:regTipo||"",pezzi:regPezzi.length});

  function mediaChiedi(momento,genere){
    mediaChiesto={momento,genere};
    const inp=$("#media-file"); if(!inp) return;
    inp.value="";
    inp.accept = genere==="video" ? "video/*" : "image/*";
    inp.multiple = genere!=="video";
    /* sul telefono apre la fotocamera invece della galleria */
    try{ inp.setAttribute("capture","environment"); }catch(e){}
    inp.click();
  }
  function mediaDillo(t){ const e=$("#media-lavoro"); if(e) e.textContent=t||""; }

  async function mediaCarica(files,giaRidotto){
    if(!files||!files.length||!mediaChiesto||!mediaApertoId) return;
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const {momento,genere}=mediaChiesto;
    const nol=mediaCache.length?null:null;
    let fatti=0;
    for(const f of Array.from(files)){
      let dati=f, nome=f.name||("file-"+Date.now()), ridotto=false, perche="";
      if(genere==="foto"){
        if(!f.type||!f.type.startsWith("image/")){toast("Questo non è una foto");continue;}
        if(f.size>MEDIA_FOTO_MAX){toast("Foto troppo grande, massimo 15 MB");continue;}
        mediaDillo("Sto rimpicciolendo la foto…");
        try{ dati=await mediaRiduciFoto(f); ridotto=true; nome=nome.replace(/\.[^.]+$/,"")+".jpg"; }
        catch(e){ dati=f; }
      }else{
        if(!f.type||!f.type.startsWith("video/")){toast("Questo non è un video");continue;}
        if(f.size>MEDIA_VIDEO_MAX){toast("Video troppo grande, massimo 200 MB");continue;}
        /* ⛔ un video girato dentro il gestionale e' gia' a 720p: rifarlo
           vorrebbe dire aspettare un'altra volta la sua durata per niente. */
        if(giaRidotto){ ridotto=true; }
        else{
          mediaDillo("Sto riducendo il video… 0%");
          const r=await mediaRiduciVideo(f,p=>mediaDillo("Sto riducendo il video… "+p+"%"));
          dati=r.blob; ridotto=r.ridotto; perche=r.perche||"";
          if(ridotto) nome=nome.replace(/\.[^.]+$/,"")+((r.tipo||"").indexOf("mp4")>=0?".mp4":".webm");
        }
        if(dati.size>MEDIA_VIDEO_DOPO_MAX){
          mediaDillo("");
          toast("Video troppo pesante anche dopo la riduzione ("+mediaPeso(dati.size)+"): fanne uno più corto");
          continue;
        }
      }
      mediaDillo("Sto caricando…");
      const safe=nome.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+"/noleggio/"+mediaApertoId+"/"+Date.now()+"_"+safe;
      const bucket=MEDIA_BUCKET[genere];
      const {error:up}=await sb.storage.from(bucket).upload(path,dati,{contentType:dati.type||undefined});
      if(up){mediaDillo("");toast("Non caricato: "+up.message);continue;}
      const riga={user_id:sbUid,noleggio_id:mediaApertoId,momento,genere,
                  storage_path:path,nome_file:safe,byte:dati.size};
      const {data:ins,error:eIns}=await sb.from("nol_media").insert(riga).select("*").single();
      if(eIns){
        /* il file c'e' ma la riga no: si toglie il file, se no resta orfano
           e occupa spazio per sempre senza che nessuno lo veda */
        try{ await sb.storage.from(bucket).remove([path]); }catch(e){}
        mediaDillo(""); toast("Non salvato: "+eIns.message); continue;
      }
      mediaCache.push(ins); fatti++;
      if(genere==="video"&&!ridotto&&perche) toast("Caricato senza ridurlo: "+perche);
    }
    mediaDillo("");
    mediaChiesto=null;
    if(fatti){ await disegnaMedia(); toast(fatti===1?"Aggiunto ✔":fatti+" aggiunti ✔"); }
  }

  async function mediaVedi(id){
    const m=mediaCache.find(x=>String(x.id)===String(id)); if(!m) return;
    const u=await mediaLink(m);
    if(!u){toast("Il file non si apre");return;}
    window.open(u,"_blank");
  }

  async function mediaElimina(id){
    const m=mediaCache.find(x=>String(x.id)===String(id)); if(!m) return;
    if(!confirm("Buttare "+(m.genere==="video"?"questo video":"questa foto")+"?\n"+cestFrase())) return;
    const {error}=await sb.from("nol_media").delete().eq("id",m.id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    /* ⚠️ col cestino acceso il FILE non si tocca: se no, rimettendo a posto
       la riga si ritroverebbe un'anteprima rotta. */
    if(!cestAcceso()){ try{ await sb.storage.from(MEDIA_BUCKET[m.genere]).remove([m.storage_path]); }catch(e){} }
    mediaCache=mediaCache.filter(x=>String(x.id)!==String(id));
    delete mediaUrl[id];
    await disegnaMedia();
    toast(m.genere==="video"?"Video buttato":"Foto buttata");
  }

  $('[data-tab="cestino"]')?.addEventListener("click",()=>renderCestinoNol());
  $("#cest-search")?.addEventListener("input",e=>{cestQ=e.target.value;renderCestinoNol(true);});

  $('[data-tab="calendario"]')?.addEventListener("click",renderCal);

  /* ================================================================
     CALENDARIO — 22 agosto 2026
     Per un noleggiatore il calendario non e' l'agenda dei lavori: e'
     «chi esce oggi, chi rientra oggi, chi doveva rientrare e non e'
     tornato». Percio' il mese mostra i noleggi, e il giorno si apre a
     tutta pagina come tutte le altre schede.
     ================================================================ */
  let calJobs=[], calNol=[];
  async function renderCal(){
    const y=cal.getFullYear(), m=cal.getMonth();
    $("#cal-title").textContent=mesi[m]+" "+y;
    if(sb&&sbUid){
      /* 24 agosto 2026 — anche qui, niente piu' filtro per reparto: tutti i
         lavori dell'azienda sul calendario, come le fatture. */
      const {data}=await sb.from("gest_lavori").select("id,descrizione,stato,data_prevista").eq("user_id",sbUid);
      calJobs=data||[];
      const {data:nn}=await sb.from("nol_noleggi")
        .select("id,mezzo,cliente,data_uscita,data_rientro_prevista,data_rientro_effettivo,importo,stato_pagamento,fase")
        .eq("user_id",sbUid);
      calNol=nn||[];
    } else { calJobs=[]; calNol=[]; }
    const oggi=todayStr();
    const lead=(new Date(y,m,1).getDay()+6)%7, days=new Date(y,m+1,0).getDate();
    const dow=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
    let html=dow.map(d=>`<div class="cal-dow">${d}</div>`).join("");
    for(let i=0;i<lead;i++)html+=`<div class="cal-cell empty"></div>`;
    for(let d=1;d<=days;d++){
      const ds=ymd(y,m,d), g=giornoDi(ds,oggi);
      const dots=[]
        .concat(g.escono.slice(0,4).map(x=>'<i class="dot '+(nolFaseDi(x)==="prenotato"?"prenot":"esce")+'" title="'+(nolFaseDi(x)==="prenotato"?"prenotato":"esce")+'"></i>'))
        .concat(g.rientrano.slice(0,4).map(()=>'<i class="dot rientra" title="rientra"></i>'))
        .concat(g.ritardi.slice(0,3).map(()=>'<i class="dot ritardo" title="in ritardo"></i>'))
        .concat(g.lavori.slice(0,3).map(j=>`<i class="dot ${j.stato==='fatto'?'done':'todo'}"></i>`))
        .slice(0,8).join("");
      const note=db().note[ds]?`<span class="cal-note-mark">📌</span>`:"";
      html+=`<div class="cal-cell ${ds===oggi?"today":""}" data-action="open-day" data-d="${ds}"><span class="dn">${d}</span>${note}<div class="cal-dots">${dots}</div></div>`;
    }
    $("#cal-grid").innerHTML=html;
    calListaTelefono(y,m,days,oggi);
    /* la riga di oggi sopra il mese: quello che serve sapere appena entri */
    const o=giornoDi(oggi,oggi), box=$("#cal-oggi");
    if(box) box.innerHTML=
      `<button class="cal-oggi-b esce"   data-action="open-day" data-d="${oggi}"><b>${o.escono.length}</b> escono oggi</button>`+
      `<button class="cal-oggi-b rientra" data-action="open-day" data-d="${oggi}"><b>${o.rientrano.length}</b> rientri previsti</button>`+
      `<button class="cal-oggi-b ritardo" data-action="open-day" data-d="${oggi}"><b>${o.ritardi.length}</b> in ritardo</button>`;
  }
