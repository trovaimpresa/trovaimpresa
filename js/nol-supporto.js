// [SPOSTATO] nol-supporto.js: era dentro nol-core.js, righe 6216-6435, spostato identico.

  /* ============================================================
     27 set 2026 — «CHIEDI UNA FUNZIONE» E «ASSISTENZA DIRETTA» NEL NOLEGGIO
     Copiati dal gestionale principale (renderRichieste / renderAssistenza):
     stesse tabelle, stesse regole del database, stesso pannello admin da cui
     rispondo. I nomi qui iniziano con «sup» per non pestare niente del file.
     ⚠️ Se si cambia la chat di la', va cambiata anche qui.
     ============================================================ */
  const SUP_STATI={
    ricevuta:{lab:"Ricevuta",bg:"#eef2f7",fg:"#5b6b80"},
    in_lavorazione:{lab:"Ci stiamo lavorando",bg:"#fff3e0",fg:"#b26a00"},
    fatta:{lab:"Fatta ✔",bg:"#e6f6ec",fg:"#1b8a3f"},
    non_faremo:{lab:"Per ora non la facciamo",bg:"#fdecea",fg:"#b3261e"}
  };
  const SUP_VISTE="ti_risposte_viste_v1";   /* la stessa chiave del gestionale principale */
  let supCache=[], supInvio=false, supFile=null, supCanale=null;
  const _supUrl={};
  function supCnt(sel,n){const e=$(sel);if(e)e.textContent=n>0?String(n):"";}
  function supSez(){const b=document.querySelector("nav.tabs button.active");return b?b.dataset.tab:"";}
  function supApri(t){const b=document.querySelector('nav.tabs button[data-tab="'+t+'"]');if(b)b.click();}

  async function supRichieste(){
    const lista=$("#rq-lista");if(!lista)return;
    if(!sb||!sbUid){lista.innerHTML="";return;}
    const {data,error}=await sb.from("gest_richieste").select("id,testo,stato,risposta,created_at")
      .eq("user_id",sbUid).order("created_at",{ascending:false});
    if(error){lista.innerHTML='<div class="gal-intro" style="margin-top:22px">Non riesco a leggere le tue richieste: controlla la connessione e riprova.</div>';return;}
    const R=data||[];
    try{localStorage.setItem(SUP_VISTE,JSON.stringify(R.filter(r=>String(r.risposta||"").trim()).map(r=>String(r.id))));}catch(e){}
    supCnt("#cnt-richieste",0);
    if(!R.length){lista.innerHTML='<div class="gal-intro" style="margin-top:22px">Qui sotto compariranno le cose che ci hai chiesto, con lo stato di ognuna.</div>';return;}
    const fmt=d=>d?new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"}):"";
    lista.innerHTML='<h3 style="margin:28px 0 12px;font-size:1.15rem">Cosa ci hai chiesto</h3>'+R.map(r=>{
      const st=SUP_STATI[r.stato]||SUP_STATI.ricevuta;
      return '<div style="background:#fff;border:2px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:14px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">'
        +'<span style="background:'+st.bg+';color:'+st.fg+';font-weight:800;font-size:0.9rem;padding:5px 14px;border-radius:999px">'+st.lab+'</span>'
        +'<span style="color:#475569;font-size:0.9rem">'+fmt(r.created_at)+'</span></div>'
        +'<div style="font-size:1.05rem;line-height:1.6">'+esc(r.testo)+'</div>'
        +(r.risposta?'<div style="margin-top:12px;padding:12px 14px;background:#f4f8ff;border-left:4px solid #0066ff;border-radius:8px;font-size:1rem"><b>Risposta:</b> '+esc(r.risposta)+'</div>':"")
        +'</div>';
    }).join("");
  }
  async function supSalvaRichiesta(){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const ta=$("#rq-testo");const testo=(ta?ta.value:"").trim();
    if(testo.length<5){toast("Scrivi cosa ti serve, anche poche parole");return;}
    if(testo.length>2000){toast("Troppo lungo: massimo 2000 caratteri");return;}
    let email="";
    try{const {data:{user}}=await sb.auth.getUser();email=(user&&user.email)||"";}catch(e){}
    const {data,error}=await sb.from("gest_richieste").insert({user_id:sbUid,email,testo}).select("id");
    if(error){toast("Non mandata: "+error.message);return;}
    if(!data||!data.length){toast("Non mandata: il database non ha scritto niente. Riprova.");return;}
    if(ta)ta.value="";
    toast("Ricevuto, grazie ✔");
    try{await fetch("/.netlify/functions/richiesta-funzione",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:data[0].id})});}catch(e){}
    supRichieste();
  }
  async function supContaRisposte(){
    if(!sb||!sbUid)return;
    const {data,error}=await sb.from("gest_richieste").select("id,risposta").eq("user_id",sbUid);
    if(error||!data)return;       /* se non legge non scrive zero: uno zero falso e' una bugia */
    let viste=[];try{viste=JSON.parse(localStorage.getItem(SUP_VISTE)||"[]");}catch(e){}
    supCnt("#cnt-richieste",data.filter(r=>String(r.risposta||"").trim()&&viste.indexOf(String(r.id))<0).length);
  }

  function _supOra(d){try{return new Date(d).toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});}catch(e){return "";}}
  function _supGiorno(d){
    const g=String(d||"").slice(0,10);if(!g)return "";
    const oggi=new Date().toISOString().slice(0,10);
    const ieri=new Date(Date.now()-864e5).toISOString().slice(0,10);
    return g===oggi?"Oggi":g===ieri?"Ieri":fdate(g);
  }
  function _supImg(m){return /^image\//.test(m.allegato_tipo||"")||/\.(jpe?g|png|webp|gif|heic)$/i.test(m.allegato||"");}
  function _supAllegato(m){
    if(!m.allegato)return "";
    const u=_supUrl[m.allegato];const nome=esc(m.allegato_nome||"allegato");
    if(_supImg(m))return '<a class="asst-img" '+(u?'href="'+u+'" target="_blank" rel="noopener"':'')+'>'+(u?'<img src="'+u+'" alt="'+nome+'" loading="lazy">':'<span class="asst-file">Carico la foto…</span>')+'</a>';
    return '<a class="asst-file" '+(u?'href="'+u+'" target="_blank" rel="noopener"':'')+'>'+nome+'</a>';
  }
  function supDisegna(){
    const box=$("#asst-msgs");if(!box)return;
    if(!supCache.length){box.innerHTML='<div class="asst-vuoto">Qui non c\'è ancora niente.<br>Scrivi il primo messaggio: <b>ti rispondo io</b>, non un robot.</div>';return;}
    let ultimo="";
    box.innerHTML=supCache.map(m=>{
      const g=String(m.created_at||"").slice(0,10);let testa="";
      if(g&&g!==ultimo){ultimo=g;testa='<div class="asst-giorno">'+esc(_supGiorno(m.created_at))+'</div>';}
      const mio=!m.da_admin;
      return testa+'<div class="asst-msg '+(mio?"mio":"suo")+'">'+esc(m.messaggio||"")+_supAllegato(m)
        +'<div class="asst-quando">'+(mio?"tu":"TrovaImpresa")+' · '+esc(_supOra(m.created_at))
        +(mio?(m.letto?' · <b>✓✓ Letto</b>':' · ✓ Inviato'):'')+'</div></div>';
    }).join("");
    box.scrollTop=box.scrollHeight;
    _supRisolvi();
  }
  async function _supRisolvi(){
    const manc=[...new Set(supCache.filter(m=>m.allegato&&_supUrl[m.allegato]===undefined).map(m=>m.allegato))];
    if(!manc.length||!sb)return;
    const {data,error}=await sb.storage.from("supporto-allegati").createSignedUrls(manc,3600);
    manc.forEach(p=>{_supUrl[p]="";});
    if(error||!data)return;
    let n=0;data.forEach((r,i)=>{if(r&&r.signedUrl){_supUrl[r.path||manc[i]]=r.signedUrl;n++;}});
    if(n&&supSez()==="assistenza")supDisegna();
  }
  async function supLeggi(segna){
    if(!sb||!sbUid)return false;
    const {data,error}=await sb.from("supporto_messaggi")
      .select("id,messaggio,da_admin,letto,created_at,allegato,allegato_nome,allegato_tipo")
      .eq("user_id",sbUid).order("created_at",{ascending:true});
    if(error||!data)return false;
    supCache=data;
    const nonLetti=data.filter(m=>m.da_admin&&!m.letto).length;
    if(segna&&nonLetti){
      const r=await sb.from("supporto_messaggi").update({letto:true}).eq("user_id",sbUid).eq("da_admin",true).eq("letto",false).select("id");
      if(!r.error&&r.data)supCache.forEach(m=>{if(m.da_admin)m.letto=true;});
      supCnt("#cnt-assistenza",0);
    }else supCnt("#cnt-assistenza",segna?0:nonLetti);
    if(supSez()==="assistenza")supDisegna();
    return true;
  }
  async function supAssistenza(){
    const box=$("#asst-msgs");if(!box)return;
    const fi=$("#asst-file");
    if(fi&&!fi._agg){fi._agg=true;fi.addEventListener("change",supFileCambiato);}
    const _at=$("#asst-testo");
    if(_at&&!_at._agg){_at._agg=true;_at.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();supInvia();}});}
    if(!sb||!sbUid){box.innerHTML='<div class="asst-vuoto">Accedi per scrivere.</div>';return;}
    if(!supCache.length)box.innerHTML='<div class="asst-vuoto">Leggo…</div>';
    if(!await supLeggi(true)){box.innerHTML='<div class="asst-vuoto">Non riesco a leggere i messaggi: controlla la connessione e riprova.</div>';return;}
    supDisegna();
    const nota=$("#asst-nota");if(nota)nota.textContent="I messaggi nuovi compaiono da soli, non serve ricaricare la pagina.";
  }
  function supFileCambiato(){
    const i=$("#asst-file");const f=i&&i.files&&i.files[0];const chip=$("#asst-chip");
    if(!f){supFile=null;if(chip){chip.hidden=true;chip.innerHTML="";}return;}
    if(!(/^image\//.test(f.type)||f.type==="application/pdf")){toast("Puoi allegare solo foto, screenshot o PDF");i.value="";supFile=null;return;}
    supFile=f;
    if(chip){chip.hidden=false;chip.innerHTML='<span>'+esc(f.name)+'</span><button type="button" class="asst-chip-x" data-action="asst-togli-file" title="Togli">×</button>';}
  }
  function supTogliFile(){const i=$("#asst-file");if(i)i.value="";supFileCambiato();}
  async function supInvia(){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    if(supInvio)return;
    const ta=$("#asst-testo");let testo=(ta?ta.value:"").trim();
    if(!testo&&!supFile){toast("Scrivi il messaggio o allega una foto, poi premi Invia");return;}
    if(testo.length>2000){toast("Troppo lungo: massimo 2000 caratteri");return;}
    supInvio=true;
    let allegato=null,allegatoNome=null,allegatoTipo=null;
    if(supFile){
      toast("Carico l'allegato…");
      const prep=window.preparaFileUpload?await window.preparaFileUpload(supFile,{lato:1600,qualita:0.8}):{file:supFile,nome:supFile.name};
      if(prep.errore){supInvio=false;toast(prep.errore);return;}
      const pulito=String(prep.nome||"allegato").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-80);
      const path=sbUid+"/"+Date.now()+"-"+pulito;
      const tipo=(prep.file&&prep.file.type)||supFile.type||"application/octet-stream";
      const up=await sb.storage.from("supporto-allegati").upload(path,prep.file,{contentType:tipo,upsert:false});
      if(up.error){supInvio=false;toast("Allegato non caricato: "+(up.error.message||"errore"));return;}
      allegato=path;allegatoNome=supFile.name;allegatoTipo=tipo;
      if(!testo)testo=/^image\//.test(tipo)?"Ti mando una foto":"Ti mando un file";
    }
    const riga={user_id:sbUid,da_admin:false,messaggio:testo,letto:false,origine:"gestionale",allegato,allegato_nome:allegatoNome,allegato_tipo:allegatoTipo};
    let {data,error}=await sb.from("supporto_messaggi").insert(riga).select("id");
    if(error&&/origine|42703|PGRST204|schema cache/i.test((error.code||"")+" "+(error.message||""))){
      delete riga.origine;({data,error}=await sb.from("supporto_messaggi").insert(riga).select("id"));
    }
    supInvio=false;
    if(error){toast("Non mandato: "+(error.message||"errore"));return;}
    if(!data||!data.length){toast("Non mandato: il database non ha scritto niente. Riprova.");return;}
    if(ta)ta.value="";
    supTogliFile();
    /* l'email ad Alessio parte dal server (supporto-avviso), come nel gestionale principale */
    try{const {data:{session}}=await sb.auth.getSession();
      if(session)fetch("/.netlify/functions/supporto-avviso",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},body:JSON.stringify({msg_id:data[0].id})}).catch(()=>{});}catch(_){}
    await supLeggi(false);supDisegna();
    toast("Mandato ✔");
  }
  document.addEventListener("click",e=>{
    const ap=e.target.closest("[data-sup-apri]");
    if(ap){supApri(ap.dataset.supApri);return;}
    const b=e.target.closest("[data-action]");if(!b)return;
    const a=b.dataset.action;
    if(a==="save-richiesta")return supSalvaRichiesta();
    if(a==="asst-invia")return supInvia();
    if(a==="asst-allega"){const i=$("#asst-file");if(i)i.click();return;}
    if(a==="asst-togli-file")return supTogliFile();
  });
  /* la vedetta: i numerini salgono anche mentre si fa altro.
     Collegamento vivo + ricontrollo ogni 20 secondi (quando il vivo cade in
     cantiere, il ricontrollo se ne accorge da solo). */
  (function supVedetta(){
    let giri=0;
    const parti=()=>{
      if(!sbUid){if(++giri<40)setTimeout(parti,1500);return;}
      supContaRisposte();supLeggi(false);
      if(!supCanale){
        try{supCanale=sb.channel("assistenza-nol-"+sbUid).on("postgres_changes",
          {event:"INSERT",schema:"public",table:"supporto_messaggi",filter:"user_id=eq."+sbUid},
          ()=>supLeggi(supSez()==="assistenza")).subscribe();}catch(e){supCanale=null;}
      }
      setInterval(()=>{if(!document.hidden)supLeggi(supSez()==="assistenza");},20000);
    };
    setTimeout(parti,1500);
  })();

  $$("nav.tabs button").forEach(b=>b.onclick=()=>{
    $$("nav.tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    $$("section").forEach(s=>s.classList.remove("active"));$("#"+b.dataset.tab).classList.add("active");
    /* ⚠️ 22 agosto 2026 — secco, non "smooth". Con lo scorrimento morbido la
       sezione nuova si disegna mentre la pagina sta ancora scendendo, e chi
       arriva trova la testata tagliata a meta'. Si apre dall'alto e basta. */
    window.scrollTo(0,0);
    document.documentElement.scrollTop=0; document.body.scrollTop=0;
    /* 14 set 2026: i promemoria si rileggono ogni volta che si apre la voce —
       sono della persona, quindi possono essere cambiati dall'altro gestionale
       mentre questa pagina era aperta. */
    if(b.dataset.tab==="promemoria")renderPromemoria();
    if(b.dataset.tab==="richieste")supRichieste();
    if(b.dataset.tab==="assistenza")supAssistenza();
    nolScriviFreccia();
  });
