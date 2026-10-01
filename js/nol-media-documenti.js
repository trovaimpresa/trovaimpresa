// [SPOSTATO] nol-media-documenti.js: era dentro nol-core.js, righe 4491-4860, spostato identico.


  /* ================================================================
     FOTO E VIDEO DEL NOLEGGIO — 23 agosto 2026
     Chiesto da Alessio: «si fotografa un mezzo e si fa sempre un video
     del mezzo, per assicurarsi che quando rientra non presenti danni non
     dichiarati».

     Due momenti, mai mescolati: COM'E' USCITO e COM'E' TORNATO. E' il
     confronto fra i due che vale: una foto sola non dimostra niente.

     ⛔ LO SPAZIO. Un video da telefono e' 60-150 MB al minuto: dieci
     noleggi e il magazzino e' pieno. Percio' qui dentro:
       · le foto si rimpiccioliscono sempre (1600 px, JPEG 0,7);
       · i video si RIFANNO piu' piccoli nel browser, 720p senza audio,
         prima di partire. Dove il browser non sa farlo (succede su certi
         iPhone) si carica l'originale e lo si dice, invece di far finta.
     ================================================================ */
  const MEDIA_BUCKET={foto:"gestionale-foto",video:"gestionale-video",documento:"gestionale-foto"};
  const MEDIA_FOTO_MAX = 15*1024*1024;   /* prima di rimpicciolire */
  const MEDIA_VIDEO_MAX= 200*1024*1024;  /* prima di ridurre */
  const MEDIA_VIDEO_DOPO_MAX = 50*1024*1024; /* dopo aver ridotto: se supera, no */
  let mediaCache=[], mediaQ="", mediaApertoId=null, mediaUrl={};

  function mediaPeso(b){
    b=+b||0;
    /* all'italiana: 3,9 MB e non 3.9 MB */
    return b>=1048576 ? (b/1048576).toFixed(1).replace(".",",")+" MB"
                      : Math.max(1,Math.round(b/1024))+" KB";
  }

  /* ---- le foto: 1600 px e JPEG 0,7, gli stessi numeri del gestionale ---- */
  function mediaRiduciFoto(file){
    return new Promise((res,rej)=>{
      const img=new Image(), rd=new FileReader();
      rd.onerror=rej;
      rd.onload=()=>{img.onerror=rej;img.onload=()=>{
        const max=1600; let w=img.width,h=img.height;
        if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        cv.toBlob(b=>b?res(b):rej(new Error("no blob")),"image/jpeg",0.7);
      };img.src=rd.result;};
      rd.readAsDataURL(file);
    });
  }

  /* ---- i video: si rifanno a 720p senza audio ----
     Si guarda il video da capo a fondo e si registra quello che passa sul
     canvas: e' l'unico modo di rimpicciolire un video dentro il browser,
     e vuol dire che ci mette quanto dura il video. Si avvisa mentre va.
     Se il browser non sa fare una delle tre cose che servono
     (captureStream, MediaRecorder, il formato) si torna indietro
     all'originale senza rompere niente. */
  function mediaFormatoVideo(){
    if(typeof MediaRecorder==="undefined") return null;
    const prove=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"];
    for(const t of prove){ try{ if(MediaRecorder.isTypeSupported(t)) return t; }catch(e){} }
    return null;
  }
  function mediaRiduciVideo(file,avvisa){
    return new Promise(res=>{
      const tipo=mediaFormatoVideo();
      if(!tipo) return res({blob:file,ridotto:false,perche:"questo browser non sa rimpicciolire i video"});
      let url=null, chiuso=false;
      const fine=(r)=>{ if(chiuso) return; chiuso=true; if(url)try{URL.revokeObjectURL(url);}catch(e){} res(r); };
      try{
        url=URL.createObjectURL(file);
        const v=document.createElement("video");
        v.muted=true; v.playsInline=true; v.preload="auto"; v.src=url;
        v.onerror=()=>fine({blob:file,ridotto:false,perche:"il video non si è aperto"});
        v.onloadedmetadata=()=>{
          const dur=v.duration||0;
          /* oltre due minuti rifarlo vorrebbe dire due minuti di attesa:
             si carica com'e' e si dice perche' */
          if(!isFinite(dur)||dur>120) return fine({blob:file,ridotto:false,perche:"il video è più lungo di due minuti"});
          const max=1280; let w=v.videoWidth||1280, h=v.videoHeight||720;
          if(w>h){ if(w>max){h=Math.round(h*max/w);w=max;} } else { if(h>max){w=Math.round(w*max/h);h=max;} }
          w-=w%2; h-=h%2;
          const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
          const cx=cv.getContext("2d");
          let flusso=null;
          try{ flusso=cv.captureStream(24); }catch(e){ return fine({blob:file,ridotto:false,perche:"questo browser non sa registrare dal canvas"}); }
          if(!flusso) return fine({blob:file,ridotto:false,perche:"questo browser non sa registrare dal canvas"});
          let reg=null;
          try{ reg=new MediaRecorder(flusso,{mimeType:tipo,videoBitsPerSecond:1200000}); }
          catch(e){ return fine({blob:file,ridotto:false,perche:"il browser ha rifiutato il formato"}); }
          const pezzi=[];
          reg.ondataavailable=e=>{ if(e.data&&e.data.size) pezzi.push(e.data); };
          reg.onerror=()=>fine({blob:file,ridotto:false,perche:"la riduzione si è fermata"});
          reg.onstop=()=>{
            const nuovo=new Blob(pezzi,{type:tipo.split(";")[0]});
            /* se per qualche motivo e' venuto piu' grosso, si tiene l'originale */
            if(!nuovo.size||nuovo.size>=file.size) return fine({blob:file,ridotto:false,perche:"ridotto non pesava meno"});
            fine({blob:nuovo,ridotto:true,tipo:tipo.split(";")[0]});
          };
          const disegna=()=>{
            if(v.ended||v.paused){ try{reg.stop();}catch(e){} return; }
            try{ cx.drawImage(v,0,0,w,h); }catch(e){}
            if(avvisa&&dur) avvisa(Math.min(99,Math.round(v.currentTime/dur*100)));
            requestAnimationFrame(disegna);
          };
          v.onended=()=>{ try{reg.stop();}catch(e){} };
          try{ reg.start(1000); }catch(e){ return fine({blob:file,ridotto:false,perche:"la registrazione non è partita"}); }
          v.play().then(disegna).catch(()=>fine({blob:file,ridotto:false,perche:"il video non è partito"}));
          /* rete di sicurezza: mai piu' del doppio della durata */
          setTimeout(()=>{ if(!chiuso){ try{reg.stop();}catch(e){} } },(dur*1000)+15000);
        };
      }catch(e){ fine({blob:file,ridotto:false,perche:"non è stato possibile ridurlo"}); }
    });
  }

  /* ---- l'elenco: un noleggio per riga, con quante foto e video ha ---- */
  async function loadMedia(){
    if(!(sb&&sbUid)) return;
    const box=$("#media-body"); if(!box) return;
    const {data:nol}=await sb.from("nol_noleggi")
      .select("id,mezzo,mezzo_id,cliente,data_uscita,data_rientro_prevista,data_rientro_effettivo")
      .eq("user_id",sbUid).order("data_uscita",{ascending:false});
    const N=nol||[];
    let M=[];
    const {data:med,error}=await sb.from("nol_media").select("*").eq("user_id",sbUid);
    if(error){
      box.innerHTML='<p style="color:#666;padding:8px">Le foto del noleggio non sono ancora accese: esegui <b>sql/noleggio-foto-video.sql</b> su Supabase e ricarica la pagina.</p>';
      if($("#media-peso"))$("#media-peso").textContent="";
      return;
    }
    M=med||[]; mediaCache=M;
    const perNol={};
    M.forEach(m=>{ (perNol[m.noleggio_id]=perNol[m.noleggio_id]||[]).push(m); });
    const totale=M.reduce((s,m)=>s+(+m.byte||0),0);
    if($("#media-peso"))$("#media-peso").textContent=M.length
      ? M.length+(M.length===1?" file":" file")+" in tutto, "+mediaPeso(totale)+" di spazio."
      : "Ancora nessuna foto e nessun video.";
    if(!N.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun noleggio. Le foto si attaccano a un noleggio.</p>';return;}
    const q=(mediaQ||"").trim().toLowerCase();
    const vis=N.filter(x=>!q||((x.mezzo||"")+" "+(x.cliente||"")).toLowerCase().includes(q));
    if(!vis.length){box.innerHTML='<p style="color:#666;padding:8px">Niente che si chiami cos&igrave;.</p>';return;}
    box.innerHTML=vis.map(x=>{
      const mm=perNol[x.id]||[];
      const c=(mo,ge)=>mm.filter(m=>m.momento===mo&&m.genere===ge).length;
      const conta=(mo)=>{const f=c(mo,"foto"),v=c(mo,"video");
        return (f?f+(f===1?" foto":" foto"):"nessuna foto")+" · "+(v?v+(v===1?" video":" video"):"nessun video");};
      const senza=!mm.length, peso=mm.reduce((s,m)=>s+(+m.byte||0),0);
      return nolCard({col:senza?"#c62828":"#2e7d32",
        titolo:esc(x.mezzo||"—"),
        eti:[senza?{t:"NESSUNA PROVA"}:{t:esc(mediaPeso(peso))}],
        corpo:`<div class="sub">${x.cliente?"Cliente: "+esc(x.cliente):"Cliente non indicato"}</div>
        <div class="sub2">Alla consegna: ${esc(conta("uscita"))}</div>
        <div class="sub2">Al rientro: ${esc(conta("rientro"))}</div>`,
        pulsanti:nolPulsanti("media",x.id)});
    }).join("");
  }
  $('[data-tab="media"]')?.addEventListener("click",loadMedia);
  /* la casella del file nasce e muore con la scheda: l'ascoltatore sta sul
     documento, se no dalla seconda apertura non risponde piu' */
  document.addEventListener("change",e=>{
    if(e.target&&e.target.id==="media-file"){ const f=e.target.files; e.target.value=""; mediaCarica(f); }
  });
  $("#media-search")?.addEventListener("input",e=>{mediaQ=e.target.value;loadMedia();});


  /* ================================================================
     «CARICA PDF» SU TUTTE LE SCHEDE — 23 agosto 2026
     Chiesto da Alessio: stampa PDF e carica PDF su tutti i documenti di
     tutto il gestionale noleggio.

     Un blocco solo, uguale dappertutto: si scrive qui e compare su mezzo,
     cliente, noleggio, prodotto, fornitore, movimento. Se domani nasce una
     scheda nuova, le basta una riga.

     ⛔ SUL MEZZO NON E' UN VEZZO, E' LA LEGGE. Dichiarazione CE, libretto
     d'uso, verbali di verifica periodica e registro manutenzioni devono
     stare attaccati al mezzo e andare col mezzo (D.Lgs 81/08 art. 71 e 72).
     ================================================================ */
  const DOC_AIUTO={
    mezzo:"Dichiarazione CE, libretto d'uso e manutenzione, verbali di verifica periodica, registro manutenzioni, assicurazione. Vanno col mezzo: qui restano attaccati e non si perdono.",
    cliente:"Visura, documento d'identità, dichiarazione degli operatori firmata, corrispondenza.",
    noleggio:"Il contratto firmato, il verbale di consegna, il DDT, la ricevuta della cauzione.",
    prodotto:"Scheda tecnica, scheda di sicurezza, certificati.",
    fornitore:"Listini, contratti, DDT, fatture.",
    movimento:"Bolla, ricevuta, documento di trasporto.",
    magazzino:"Scheda tecnica, scheda di sicurezza, certificati."
  };
  const DOC_MAX = 20*1024*1024;
  let docCache=[], docTipo=null, docId=null;

  /* il riquadro. Si mette in fondo a una scheda, prima di Annulla/Salva. */
  function nolDocBlocco(tipo,id){
    if(!id) return `<div class="nol-riq nol-cam"><h4>Documenti</h4>
      <p style="margin:0;font-size:14px;color:#666">Salva prima la scheda: poi qui puoi attaccare i PDF.</p></div>`;
    /* la lista si chiede dopo che la scheda e' a schermo */
    setTimeout(()=>caricaDocumenti(tipo,id),0);
    return `<div class="nol-riq nol-cam">
      <h4>Documenti (PDF)</h4>
      <p style="margin:0 0 10px;font-size:14px;color:#666">${esc(DOC_AIUTO[tipo]||"Qui restano attaccati e non si perdono.")}</p>
      <div class="nol-azioni">
        <button type="button" class="nol-az nol-az-apri" data-action="doc-add" data-t="${tipo}" data-id="${id}">📎 Carica PDF</button>
      </div>
      <div id="nol-doc-lista" style="margin-top:10px"></div>
      <input type="file" id="nol-doc-file" style="display:none">
    </div>`;
  }

  async function caricaDocumenti(tipo,id){
    docTipo=tipo; docId=id; docCache=[];
    const box=$("#nol-doc-lista"); if(!box||!(sb&&sbUid)) return;
    const {data,error}=await sb.from("nol_media").select("*")
      .eq("user_id",sbUid).eq("attaccato_a",tipo).eq("attaccato_id",id)
      .order("created_at",{ascending:false});
    if(error){
      box.innerHTML='<p class="gior-vuoto">I documenti non sono ancora accesi: esegui <b>sql/noleggio-contratto.sql</b> su Supabase e ricarica la pagina.</p>';
      return;
    }
    docCache=data||[];
    disegnaDocumenti();
  }

  function disegnaDocumenti(){
    const box=$("#nol-doc-lista"); if(!box) return;
    if(!docCache.length){box.innerHTML='<p class="gior-vuoto">Ancora nessun documento.</p>';return;}
    box.innerHTML=docCache.map(d=>`
      <div class="doc-riga">
        <button type="button" class="doc-nome" data-action="doc-vedi" data-id="${d.id}">
          <span class="doc-ic">${d.genere==="documento"?"📄":"🖼️"}</span>${esc(d.nome_file||"documento")}</button>
        <span class="doc-peso">${esc(mediaPeso(d.byte))}</span>
        <button type="button" class="media-x" data-action="doc-elim" data-id="${d.id}" title="Butta">×</button>
      </div>`).join("");
  }

  function docChiedi(tipo,id){
    docTipo=tipo; docId=id;
    const inp=$("#nol-doc-file"); if(!inp) return;
    inp.value=""; inp.accept="application/pdf,image/*"; inp.multiple=true;
    /* niente «capture»: qui si allega un file che c'e' gia', non si scatta */
    try{ inp.removeAttribute("capture"); }catch(e){}
    inp.click();
  }

  async function docCarica(files){
    if(!files||!files.length||!docTipo||!docId) return;
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    let fatti=0;
    for(const f of Array.from(files)){
      const pdf=(f.type||"").indexOf("pdf")>=0;
      if(!pdf&&!(f.type||"").startsWith("image/")){toast("Si possono allegare PDF o foto");continue;}
      if(f.size>DOC_MAX){toast("File troppo grande, massimo 20 MB");continue;}
      let dati=f, nome=f.name||("documento-"+Date.now());
      /* una foto di un documento si rimpicciolisce come tutte le altre;
         un PDF non si tocca, se no si rovina */
      if(!pdf){ try{ dati=await mediaRiduciFoto(f); nome=nome.replace(/\.[^.]+$/,"")+".jpg"; }catch(e){ dati=f; } }
      const safe=nome.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+"/noleggio/doc/"+docTipo+"-"+docId+"/"+Date.now()+"_"+safe;
      const {error:up}=await sb.storage.from("gestionale-foto").upload(path,dati,{contentType:dati.type||undefined});
      if(up){toast("Non caricato: "+up.message);continue;}
      const riga={user_id:sbUid,attaccato_a:docTipo,attaccato_id:docId,
                  genere:pdf?"documento":"foto",storage_path:path,nome_file:safe,byte:dati.size};
      const {data:ins,error:eIns}=await sb.from("nol_media").insert(riga).select("*").single();
      if(eIns){
        try{ await sb.storage.from("gestionale-foto").remove([path]); }catch(e){}
        toast("Non salvato: "+eIns.message); continue;
      }
      docCache.unshift(ins); fatti++;
    }
    if(fatti){ disegnaDocumenti(); toast(fatti===1?"Documento allegato ✔":fatti+" documenti allegati ✔"); }
  }

  async function docVedi(id){
    const d=docCache.find(x=>String(x.id)===String(id)); if(!d) return;
    const u=await mediaLink(d);
    if(!u){toast("Il file non si apre");return;}
    window.open(u,"_blank");
  }

  async function docElimina(id){
    const d=docCache.find(x=>String(x.id)===String(id)); if(!d) return;
    if(!confirm("Buttare «"+(d.nome_file||"questo documento")+"»?\n"+cestFrase())) return;
    const {error}=await sb.from("nol_media").delete().eq("id",d.id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!cestAcceso()){ try{ await sb.storage.from(MEDIA_BUCKET[d.genere]||"gestionale-foto").remove([d.storage_path]); }catch(e){} }
    docCache=docCache.filter(x=>String(x.id)!==String(id));
    delete mediaUrl[id];
    disegnaDocumenti(); toast("Documento buttato");
  }

  /* la casella nasce dentro la scheda: l'ascoltatore sta sul documento */
  document.addEventListener("change",e=>{
    if(e.target&&e.target.id==="nol-doc-file"){ const f=e.target.files; e.target.value=""; docCarica(f); }
  });

  /* ---- la scheda: com'e' uscito, com'e' tornato ---- */
  async function schedaMedia(n){
    if(!n){toast("Questo noleggio non si trova più");return;}
    mediaApertoId=n.id;
    openSheet(`<h3>Foto e video — ${esc(n.mezzo||"mezzo")}${n.cliente?" · "+esc(n.cliente):""}</h3>
      ${nolPulsantiScheda("noleggio",n.id,["nol-pdf","nol-stampa"])}
      <div class="nol-riq nol-cam">
        <h4>Com'&egrave; uscito — ${esc(fdate(n.data_uscita))}</h4>
        <p style="margin:0 0 10px;font-size:14px;color:#666">Fotografa il mezzo da tutti i lati e fai un giro in video. &Egrave; questa la prova che al rientro vale.</p>
        <div class="nol-azioni">
          <button type="button" class="nol-az nol-az-apri" data-action="media-add" data-m="uscita" data-g="foto">+ Foto</button>
          <button type="button" class="nol-az" data-action="media-reg" data-m="uscita">&#9679; Registra qui il video</button>
          <button type="button" class="nol-az" data-action="media-add" data-m="uscita" data-g="video">Carica un video</button>
        </div>
        <div class="media-griglia" id="media-uscita"></div>
      </div>
      <div class="nol-riq nol-cam">
        <h4>Com'&egrave; tornato${n.data_rientro_effettivo?" — "+esc(fdate(n.data_rientro_effettivo)):""}</h4>
        <p style="margin:0 0 10px;font-size:14px;color:#666">Le stesse inquadrature di prima: cos&igrave; il confronto si vede a colpo d'occhio.</p>
        <div class="nol-azioni">
          <button type="button" class="nol-az nol-az-apri" data-action="media-add" data-m="rientro" data-g="foto">+ Foto</button>
          <button type="button" class="nol-az" data-action="media-reg" data-m="rientro">&#9679; Registra qui il video</button>
          <button type="button" class="nol-az" data-action="media-add" data-m="rientro" data-g="video">Carica un video</button>
        </div>
        <div class="media-griglia" id="media-rientro"></div>
      </div>

      <!-- ⛔ LA VIDEOCAMERA DENTRO IL GESTIONALE — 23 agosto 2026.
           Un video girato dall'app Fotocamera dell'iPhone pesa 100–150 MB al
           minuto: non entra nemmeno nel deposito (tetto 50 MB per file), e
           Safari non sa rimpicciolirlo dopo. Girandolo QUI, a 720p e 1,2
           Mbps, nasce sui 10 MB al minuto: entra, si carica in fretta e si
           vede lo stesso benissimo. -->
      <div class="nol-riq" id="reg-box" style="display:none">
        <h4 id="reg-tit">Registra il video</h4>
        <p id="reg-spiega" style="margin:0 0 10px;font-size:14px;color:#666">Gira intorno al mezzo con calma: parti da un angolo e fai tutto il giro, poi le parti che si rovinano (cingoli, vetri, benna). Puoi parlare: la voce si registra.</p>
        <video id="reg-video" playsinline muted autoplay></video>
        <div id="reg-stato" class="reg-stato"></div>
        <div class="nol-azioni" id="reg-tasti"></div>
      </div>

      <div id="media-lavoro" style="font-size:15px;color:#0066ff;font-weight:600;min-height:22px"></div>
      ${nolDocBlocco("noleggio",n.id||"")}
      <input type="file" id="media-file" style="display:none">
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Chiudi</button></div>`);
    disegnaMedia();
  }

  async function disegnaMedia(){
    for(const mo of ["uscita","rientro"]){
      const box=$("#media-"+mo); if(!box) continue;
      const righe=mediaCache.filter(m=>String(m.noleggio_id)===String(mediaApertoId)&&m.momento===mo);
      if(!righe.length){box.innerHTML='<p class="gior-vuoto">Ancora niente.</p>';continue;}
      box.innerHTML=righe.map(m=>`
        <div class="media-cella">
          <button type="button" class="media-apri" data-action="media-vedi" data-id="${m.id}">
            ${m.genere==="video"?'<span class="media-play">▶</span>':`<img id="media-img-${m.id}" alt="">`}
          </button>
          <div class="media-sotto">${esc(mediaPeso(m.byte))}
            <button type="button" class="media-x" data-action="media-elim" data-id="${m.id}" title="Butta">×</button></div>
        </div>`).join("");
      /* le anteprime arrivano una per volta: sono link firmati, non file */
      righe.filter(m=>m.genere==="foto").forEach(async m=>{
        const u=await mediaLink(m); const im=$("#media-img-"+m.id); if(im&&u) im.src=u;
      });
    }
  }

  async function mediaLink(m){
    if(mediaUrl[m.id]) return mediaUrl[m.id];
    try{
      const {data}=await sb.storage.from(MEDIA_BUCKET[m.genere]||"gestionale-foto")
        .createSignedUrl(m.storage_path,3600);
      if(data&&data.signedUrl){ mediaUrl[m.id]=data.signedUrl; return data.signedUrl; }
    }catch(e){}
    return null;
  }

  /* ---- caricare ---- */
  let mediaChiesto=null;
