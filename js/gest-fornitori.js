/* ═══ FETTA F2 · I FORNITORI ══════════════════════════════════════════
   Staccata da gestionale-app.html il 6 settembre 2026.
   DUE pezzi, presi da due punti del file: righe 5772-6004 e 6078-6167.

   COSA C'E' DENTRO
   Pezzo 1 — l'anagrafica e le fatture da pagare: fornCache/fattfCache,
   FORN_CATS (le categorie di rivendita), renderFornitori (disegna sia
   l'elenco dei fornitori sia le fatture fornitore), fornScheda, e i
   documenti del fornitore (docFornId, fornDocApri, renderDocForn,
   uploadDocFornitore, fornDocElimina).
   Pezzo 2 — il modulo del fornitore: _tiRisultati, fornForm, fornTiCerca,
   fornTiScegli (l'aggancio a un'impresa gia' iscritta a TrovaImpresa) e
   saveForn.
   Taglio puro: dentro non e' cambiato un carattere.

   ⛔ PERCHE' SONO DUE PEZZI E NON UNO
   Fra i due c'e' un blocco che NON e' dei fornitori: i documenti del
   LAVORO (docLavId, renderDocLavoro, uploadDocLavoro, lavDocElimina).
   Sono copiati riga per riga da quelli del fornitore — stessa tabella
   gest_foto, stesso deposito — ma si agganciano a `lavoro_id` invece che a
   `fornitore_id`. Portarli via qui avrebbe spento i documenti dei lavori.
   Restano nella pagina.

   ⚠️ CHI CHIAMA QUESTA ROBA DA FUORI — e perche' funziona lo stesso
   - `fornCache` la leggono le fatture fornitore (fattfForm), il Report e il
     gestore dei clic in fondo alla pagina. `fattfCache` la legge lo stesso
     gestore dei clic. Tutte letture DENTRO una funzione: quando quella gira,
     questo file e' gia' nato.
   - `fattfForm`, `saveFattf` e le fatture fornitore RESTANO nella pagina e
     chiamano `renderFornitori()` per ridisegnare. Funziona per la stessa
     ragione.

   ⛔ LE DUE REGOLE DI QUESTO FILE
   1. Non e' chiuso dentro niente (niente IIFE): vive nello stesso spazio
      della pagina e vede sb, sbUid, cur, esc, eur2, toast, closeSheet, $
      senza che nessuno glieli passi. Per la stessa ragione, un nome
      dichiarato anche nella pagina spegnerebbe TUTTO il gestionale.
   2. Al primo livello qui non si puo' USARE niente che stia nella pagina:
      questo file parte PRIMA. fornCache/fattfCache/_tiRisultati partono
      vuoti e FORN_CATS e' un elenco scritto a mano: non chiamano niente.

   Il banco che protegge tutto questo:
   prove-claude/banchi-fissi/smontaggio/banco-fette.js
   ═══════════════════════════════════════════════════════════════════════ */

  /* ============================================================
     FORNITORI — le rivendite dove l'impresa compra il materiale.
     gest_fornitori (anagrafica) + gest_fatture_fornitori (da pagare).
     DDL: sql/gest-fornitori.sql. Idea di Alessio, 7 agosto 2026.
     Paracadute: se le tabelle non ci sono ancora (migrazione non
     eseguita), la sezione lo dice invece di rompersi.
     ============================================================ */
  let fornCache=[],fattfCache=[];
  const FORN_CATS=["Rivendita edile","Ferramenta","Colorificio","Termoidraulica","Materiale elettrico","Legname","Noleggio attrezzature","Cava / Inerti","Altro"];
  /* 20 nov 2026 (studio, voce Fornitori) — i fornitori di uno studio tecnico
     non sono rivendite: sono topografi, laboratori, geologi, copisterie,
     software. La categoria e' solo testo: un fornitore gia' salvato con una
     voce dell'impresa la tiene (si aggiunge in fondo alla tendina). */
  const FORN_CATS_STUDIO=["Topografo / rilievi","Laboratorio prove","Geologo","Strutturista / consulente","Termotecnico / impiantista","Copisteria / stampe","Software e licenze","Visure e servizi","Ufficio e cancelleria","Altro"];
  function _foPro(){ try{ return ruoloUtente==='professionista'; }catch(e){ return false; } }
  async function renderFornitori(){
    const box=$("#forn-list"),lst=$("#fattf-list"),rr=$("#fattf-riass"),tt=$("#fattf-tit");
    if(!box||!cur)return;
    if(!sb||!sbUid){box.innerHTML=tabVuoto("I tuoi fornitori","Accedi per gestirli.");if(lst)lst.innerHTML="";return;}
    const mid=curMestiere(), oggi=todayStr();
    const [rf,rff]=await Promise.all([
      /* 20 nov 2026 — regola di Alex: in cima gli ULTIMI salvati (era in ordine di nome) */
      sb.from("gest_fornitori").select("*").eq("user_id",sbUid).eq("mestiere_id",mid).order("created_at",{ascending:false}),
      sb.from("gest_fatture_fornitori").select("*").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);
    if(rf.error||rff.error){
      const em=((rf.error||rff.error).message)||"";
      const msg=/gest_fornitori|gest_fatture_fornitori|schema cache|does not exist/i.test(em)
        ? "La sezione Fornitori ha bisogno di un aggiornamento del database: esegui sql/gest-fornitori.sql su Supabase (SQL Editor → Run)."
        : "";
      /* 11 nov 2026 — collaudo 3.13: senza rete, lo stesso riquadro di Lavori e Clienti, col Riprova */
      if(msg)box.innerHTML='<div class="rie-errore"><b>'+esc(msg)+'</b></div>';
      else listaNonLetta(box,"i fornitori","fornitori");
      if(lst)lst.innerHTML="";if(rr)rr.innerHTML="";if(tt)tt.style.display="none";
      return;
    }
    fornCache=rf.data||[];fattfCache=rff.data||[];
    /* 20 nov 2026 (studio, voce Fornitori — si' di Alex, foto approvata):
       allo studio «Acquisti del mese» non serve (e' la merce del cantiere) */
    const _acqB=document.querySelector('#fornitori [data-acq="mese"]');if(_acqB)_acqB.style.display=_foPro()?"none":"";
    /* ...e accanto a ogni fattura si scrive per quale pratica / lavoro e' */
    const lavNomi=await _ffNomiLavori(fattfCache);
    /* quanto hai speso da ogni fornitore quest'anno (dalle spese dei lavori).
       Lettura tollerante: se la colonna fornitore_id non c'e' ancora, si salta. */
    const annoCorr=oggi.slice(0,4);let spesoForn={};
    try{
      const rsp=await sb.from("gest_spese").select("fornitore_id,importo,data,created_at").eq("user_id",sbUid).not("fornitore_id","is",null);
      if(!rsp.error)(rsp.data||[]).forEach(x=>{
        const d=(x.data||String(x.created_at||"").slice(0,10)||"");
        if(d.slice(0,4)!==annoCorr)return;
        const k=String(x.fornitore_id);spesoForn[k]=(spesoForn[k]||0)+(+x.importo||0);
      });
    }catch(e){}
    /* aperte prima (per scadenza), pagate in fondo */
    /* 10 nov 2026 — regola di Alessio: in cima le ULTIME salvate (prima erano
       in ordine di scadenza). Le pagate restano in fondo; le scadute si
       vedono lo stesso, dal rosso e dal riassunto qui sopra. */
    fattfCache.sort((a,b)=>((a.stato==="pagata")-(b.stato==="pagata"))||String(b.created_at||"").localeCompare(String(a.created_at||"")));
    const aperte=fattfCache.filter(f=>f.stato!=="pagata");
    const totAp=aperte.reduce((sm,f)=>sm+(+f.importo||0),0);
    const scadute=aperte.filter(f=>f.scadenza&&f.scadenza<oggi);
    if(rr)rr.innerHTML=aperte.length
      ? '<div class="ff-riass'+(scadute.length?' rit':'')+'"><b>'+eur(totAp)+'</b> da pagare in '+aperte.length+(aperte.length===1?' fattura':' fatture')+(scadute.length?' — <b>'+scadute.length+(scadute.length===1?' scaduta':' scadute')+'</b>':'')+'</div>'
      : "";
    if(!fornCache.length){
      box.innerHTML=tabVuoto("I tuoi fornitori",
        _foPro()
          ? "Chi lavora per lo studio: topografo, laboratorio prove, geologo, copisteria, software. Qui tieni i contatti (chiama o scrivi su WhatsApp con un tocco) e le loro fatture da pagare con le scadenze: niente più brutte sorprese."
          : "Le rivendite e i negozi dove compri il materiale. Qui tieni i contatti (chiama o scrivi su WhatsApp con un tocco) e le fatture da pagare con le scadenze: niente più brutte sorprese.",
        _SVGV+'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
        {t:"+ Aggiungi il primo fornitore",a:"new-forn"});
      tabBottoneTesta(box,false);
    }else{
      tabBottoneTesta(box,true);
      const perForn={};aperte.forEach(f=>{const k=String(f.fornitore_id||"");perForn[k]=perForn[k]||{n:0,tot:0};perForn[k].n++;perForn[k].tot+=(+f.importo||0);});
      box.innerHTML=fornCache.map(f=>{
        const ap=perForn[String(f.id)];
        const waTel=waCleanTel(f.telefono||"");
        /* la card si apre col click (scheda in sola lettura, come i Clienti);
           sulla card restano solo le azioni rapide Chiama/WhatsApp */
        return '<div class="card t-neutro" data-action="forn-scheda" data-id="'+esc(String(f.id))+'" style="cursor:pointer">'
          +'<div class="c-head"><h3>'+esc(f.nome)+'</h3></div>'
          +(f.categoria?'<div class="c-lab">'+esc(f.categoria)+'</div>':'')
          +(f.trovaimpresa_id?'<div class="c-lab" style="color:var(--ok);font-weight:700">✓ Collegato a TrovaImpresa</div>':'')
          +'<div class="c-righe">'
          +'<div class="c-r"><span class="c-rt">Da pagare</span><span class="c-rv '+(ap?'':'ok')+'">'+(ap?eur(ap.tot)+' ('+ap.n+')':'niente')+'</span></div>'
          +(spesoForn[String(f.id)]?'<div class="c-r"><span class="c-rt">Speso nel '+annoCorr+'</span><span class="c-rv">'+eur(spesoForn[String(f.id)])+'</span></div>':'')
          +(f.telefono?'<div class="c-r"><span class="c-rt">Telefono</span><span class="c-rv">'+esc(f.telefono)+'</span></div>':'')
          +'</div>'
          +'<div class="card-acts">'
          /* 7 nov 2026 — collaudo della semplicita' (ok di Alex): sulla riga solo «Apri»,
             come nelle altre sezioni. Chiama e WhatsApp stanno nella scheda. */
          +'<button class="btn" data-action="forn-scheda" data-id="'+esc(String(f.id))+'">Apri</button>'
          +'</div></div>';
      }).join("");
    }
    if(tt)tt.style.display=fattfCache.length?"":"none";
    /* 27 nov 2026 (giro nuovo, sessione 5) — una fattura pagata stava sotto il
       titolo «Fatture da pagare». Le pagate restano in fondo, sotto «Pagate». */
    if(tt)tt.textContent=aperte.length?"Fatture da pagare":"Fatture pagate";
    let _ffPagTit=!aperte.length;
    if(lst)lst.innerHTML=fattfCache.map(f=>{
      const nome=(fornCache.find(x=>String(x.id)===String(f.fornitore_id))||{}).nome||"Fornitore";
      const pag=f.stato==="pagata";
      const rit=!pag&&f.scadenza&&f.scadenza<oggi;
      const q=f.scadenza?quando(f.scadenza,{neutro:pag}):{testo:"senza scadenza",classe:"q-vuoto"};
      const _tp=(pag&&!_ffPagTit)?(_ffPagTit=true,'<h4 class="ff-pag-tit" style="margin:20px 0 10px;font-size:16px;color:var(--testo-2)">Pagate</h4>'):'';
      return _tp+'<div class="ff-r'+(rit?' rit':'')+(pag?' pag':'')+'">'
        +'<div class="ff-info"><b>'+esc(nome)+'</b>'+(f.numero?' · n. '+esc(f.numero):'')+(f.note?'<small>'+esc(f.note)+'</small>':'')+_ffPerLavoro(f,lavNomi)+'</div>'
        +'<span class="ff-q '+(rit?'q-passato':q.classe)+'">'+(pag?'pagata':(rit?'scaduta '+q.testo:q.testo))+'</span>'
        +'<span class="ff-imp">'+eur(f.importo)+'</span>'
        +'<div class="ff-acts">'
        +'<button class="btn btn-sm" data-action="fattf-stato" data-id="'+esc(String(f.id))+'" data-v="'+(pag?'da_pagare':'pagata')+'">'+(pag?'↩ Riapri':'✔ Pagata')+'</button>'
        +'<button class="btn btn-sm" data-action="edit-fattf" data-id="'+esc(String(f.id))+'">Modifica</button>'
        +'<button class="btn btn-sm btn-danger" data-action="del-fattf" data-id="'+esc(String(f.id))+'" title="Elimina">🗑</button>'
        +'</div></div>';
    }).join("");
  }
  /* Scheda del fornitore in sola lettura: si apre col click sulla card,
     si legge tutto, e Modifica/Elimina/Documenti stanno qui dentro. */
  async function fornScheda(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const {data:f}=await sb.from("gest_fornitori").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(!f){toast("Fornitore non trovato");return;}
    const {data:ff}=await sb.from("gest_fatture_fornitori").select("*").eq("user_id",sbUid).eq("fornitore_id",id).order("scadenza",{ascending:true});
    /* 19 nov 2026 — come nell'elenco: in cima le ULTIME salvate, le pagate in fondo */
    const fatture=(ff||[]).sort((a,b)=>((a.stato==="pagata")-(b.stato==="pagata"))||String(b.created_at||"").localeCompare(String(a.created_at||"")));
    const oggi=todayStr();
    const aperte=fatture.filter(x=>x.stato!=="pagata");
    const totAp=aperte.reduce((sm,x)=>sm+(+x.importo||0),0);
    const waTel=waCleanTel(f.telefono||"");
    const lavNomi=await _ffNomiLavori(fatture);
    const tag=f.categoria?'<span class="tipo-tag">'+esc(f.categoria)+'</span>':'';
    const righeFatt=fatture.length?fatture.map(x=>{
      const pag=x.stato==="pagata", rit=!pag&&x.scadenza&&x.scadenza<oggi;
      const q=x.scadenza?quando(x.scadenza,{neutro:pag}):{testo:"senza scadenza",classe:"q-vuoto"};
      return '<div class="ff-r'+(rit?' rit':'')+(pag?' pag':'')+'" style="margin-bottom:8px">'
        +'<div class="ff-info">'+(x.numero?'<b>n. '+esc(x.numero)+'</b>':'<b>Fattura</b>')+(x.note?'<small>'+esc(x.note)+'</small>':'')+_ffPerLavoro(x,lavNomi)+'</div>'
        +'<span class="ff-q '+(rit?'q-passato':q.classe)+'">'+(pag?'pagata':(rit?'scaduta '+q.testo:q.testo))+'</span>'
        +'<span class="ff-imp">'+eur(x.importo)+'</span>'
        +'<div class="ff-acts"><button class="btn btn-sm" data-action="fattf-stato" data-id="'+esc(String(x.id))+'" data-v="'+(pag?'da_pagare':'pagata')+'" data-forn="'+esc(String(f.id))+'">'+(pag?'↩ Riapri':'✔ Pagata')+'</button></div>'
        +'</div>';
    }).join(""):'<p class="sh-nota" style="margin-top:0">Nessuna fattura registrata per questo fornitore.</p>';
    openSheetGrande(esc(f.nome||"Fornitore")+tag,
      ctrStrisciaHTML('fornitore',f)
      +'<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Contatti</div>'
      +_rigaDato("Telefono",f.telefono,"tel:")
      +_rigaDato("Email",f.email,"mailto:")
      +_rigaDato("Indirizzo",f.indirizzo)
      +'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">'
      +(f.telefono?'<a class="btn" href="tel:'+esc(f.telefono)+'" style="text-decoration:none">📞 Chiama</a>':'')
      +(waTel?'<button class="btn" data-action="sq-wa" data-wa="https://wa.me/'+waTel+'">WhatsApp</button>':'')
      +(f.trovaimpresa_id?'<a class="btn" href="/profilo-impresa.html?id='+esc(String(f.trovaimpresa_id))+'" target="_blank" style="text-decoration:none">🏪 Profilo TrovaImpresa</a>':'')
      +'</div></div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Dati</div>'
      +_rigaDato("Partita IVA",f.piva)
      +_rigaDato("Note",f.note)
      +(f.trovaimpresa_id?'<div class="dato"><span class="dato-lab">TrovaImpresa</span><span class="dato-val" style="color:var(--ok);font-weight:700">✓ Collegato</span></div>':'')
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Le sue fatture'+(aperte.length?' — da pagare '+eur(totAp):'')+'</div>'
      +righeFatt
      +'<button class="btn-primary" data-action="new-fattf-forn" data-id="'+esc(String(f.id))+'" style="margin-top:10px">+ Fattura per questo fornitore</button>'
      +'</div>'
      +'</div></div>',
      /* 16 agosto 2026 — «Documenti» ed «Elimina» salgono/scendono al loro
         posto come in tutte le altre finestre: le azioni sul documento in
         alto, Elimina in fondo a sinistra. In fondo a destra restano Chiudi
         e Modifica, che qui e' il passo successivo (non c'e' un Salva). */
      '<button class="btn b-cancel" data-action="close">Chiudi</button>'
      +'<button class="btn-primary" data-action="edit-forn-full" data-id="'+esc(String(f.id))+'">&#9998; Modifica</button>',
      [{lab:"\ud83d\udcce Documenti",action:"forn-doc",data:{id:f.id}},
       {lab:"\ud83d\uddd1 Elimina",action:"del-forn",data:{id:f.id},del:true}]);
  }

  /* ---- documenti del fornitore: listini, contratti, fatture in PDF/foto.
     Stessa tabella gest_foto dei documenti cliente, con fornitore_id
     (sql/gest-fornitori-plus.sql). ---- */
  let docFornId=null, docFornNome="";
  async function fornDocApri(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const f=fornCache.find(x=>String(x.id)===String(id));
    docFornId=id; docFornNome=(f&&f.nome)||"fornitore";
    openSheetGrande("Documenti di "+esc(docFornNome),
      '<div class="sh-b">'
      +'<div class="sh-tit">Carica un documento</div>'
      +'<p class="sh-nota" style="margin-top:0">'+(_foPro()
        ?'Offerte, incarichi, relazioni, certificati di prova, fatture in PDF: qui restano attaccati al fornitore e non si perdono.'
        :'Listini, contratti, DDT, fatture in PDF o la foto fatta alla cassa: qui restano attaccati al fornitore e non si perdono.')+' Massimo 15 MB per file.</p>'
      +'<button class="btn-primary" data-action="forn-doc-scegli" style="margin-top:6px">Scegli i file dal computer</button>'
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Documenti gi&agrave; caricati</div>'
      +'<div id="doc-forn-lista"><div class="loading">Caricamento...</div></div>'
      +'</div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    renderDocForn();
  }
  async function renderDocForn(){
    const box=$("#doc-forn-lista");if(!box||!docFornId)return;
    const {data,error}=await sb.from("gest_foto").select("id,storage_path,nome_file,created_at")
      .eq("user_id",sbUid).eq("fornitore_id",docFornId).eq("tipo","doc_fornitore")
      .order("created_at",{ascending:false});
    if(error){
      const em=(error.message||"");
      box.innerHTML='<div class="campo-aiuto" style="color:var(--attesa)">'+(/fornitore_id/i.test(em)&&/column|schema cache/i.test(em)
        ?'I documenti del fornitore hanno bisogno di un aggiornamento del database: esegui sql/gest-fornitori-plus.sql su Supabase.'
        :'Non riesco a leggere i documenti: '+esc(em))+'</div>';
      return;
    }
    if(!data||!data.length){box.innerHTML='<div class="campo-aiuto">Nessun documento per ora. Usa il pulsante qui sopra.</div>';return;}
    box.innerHTML=data.map(d=>{
      const nome=d.nome_file||String(d.storage_path||"").split("/").pop()||"documento";
      const quando2=d.created_at?new Date(d.created_at).toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric"}):"";
      return '<div class="doc-riga">'
        +'<span class="doc-ico">'+docCliIcona(nome)+'</span>'
        +'<span class="doc-nome">'+esc(nome)+'<small>'+esc(quando2)+'</small></span>'
        +'<button class="btn" data-action="doc-cli-apri" data-id="'+esc(d.id)+'">Apri</button>'
        +'<button class="btn b-del" data-action="forn-doc-del" data-id="'+esc(d.id)+'">Elimina</button>'
        +'</div>';
    }).join("");
  }
  async function uploadDocFornitore(files){
    if(!files||!files.length||!docFornId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    let ok=0,ko=0;
    for(const file of Array.from(files)){
      const pr=await preparaFileUpload(file);
      if(pr.errore){toast(pr.errore);ko++;continue;}
      const safe=String(pr.nome||"documento").replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+"/fornitori/"+docFornId+"/"+Date.now()+"_"+safe;
      const {error:up}=await sb.storage.from("gestionale-foto").upload(path,pr.file);
      if(up){toast("Non caricato: "+up.message);ko++;continue;}
      const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,fornitore_id:docFornId,tipo:"doc_fornitore",operatore:"Capo",storage_path:path,nome_file:pr.nome||safe});
      if(ins){
        const em=(ins.message||"");
        toast(/fornitore_id/i.test(em)&&/column|schema cache/i.test(em)
          ?"Documento non registrato: esegui sql/gest-fornitori-plus.sql su Supabase"
          :"Non registrato: "+em);
        await _fileOrfano("gestionale-foto",path);
        ko++;continue;
      }
      ok++;
    }
    if(ok)toast(ok+(ok===1?" documento caricato ✔":" documenti caricati ✔"));
    renderDocForn();
  }
  async function fornDocElimina(id){
    /* 12 nov 2026 — regola 22: la domanda dice il nome del documento */
    const {data:r}=await sb.from("gest_foto").select("storage_path,nome_file").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(!(await window.chiediVia(r&&r.nome_file?("«"+String(r.nome_file).slice(0,80)+"»"):"questo documento",true,"Lo riprendi dal Cestino quando vuoi.")))return;
    const {data:okD,error}=await sb.from("gest_foto").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!okD||!okD.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
    /* col cestino il file NON si tocca: se no il ripristino darebbe un'immagine rotta */
    if(r&&r.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo())){try{await sb.storage.from("gestionale-foto").remove([r.storage_path]);}catch(e){}}
    /* 20 nov 2026 — come i documenti della pratica: va nel Cestino, e lo si dice */
    renderDocForn();toast((window.cestinoAttivo&&window.cestinoAttivo())?"Documento nel cestino: lo riprendi da lì":"Documento eliminato");
  }

  let _tiRisultati=[];
  function fornForm(f){
    const isNew=!(f&&f.id);f=f||{};
    const _lista=_foPro()?FORN_CATS_STUDIO.slice():FORN_CATS.slice();
    if(f.categoria&&_lista.indexOf(f.categoria)<0)_lista.push(f.categoria);
    const cats=_lista.map(c=>'<option value="'+c+'" '+(c===(f.categoria||"")?'selected':'')+'>'+c+'</option>').join("");
    openSheetGrande(isNew?'Nuovo fornitore':'Modifica fornitore',
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Chi è</div>'
      +'<div class="field"><label>Nome</label><input id="fo-nome" value="'+esc(f.nome||'')+'" placeholder="'+(_foPro()?'Es. Studio Rilievi Rossi':'Es. Edil Market Rossi')+'"></div>'
      +'<div class="field"><label>Tipo</label><select id="fo-cat"><option value="">— scegli —</option>'+cats+'</select></div>'
      +'<div class="row2">'
      +'<div class="field"><label>Telefono</label><input id="fo-tel" value="'+esc(f.telefono||'')+'" placeholder="Es. 340 1234567"></div>'
      +'<div class="field"><label>Email</label><input id="fo-email" value="'+esc(f.email||'')+'" placeholder="'+(_foPro()?'studio@...':'ordini@...')+'"></div></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Altri dati</div>'
      +'<div class="field"><label>Partita IVA</label><input id="fo-piva" value="'+esc(f.piva||'')+'"></div>'
      +'<div class="field"><label>Indirizzo</label><input id="fo-ind" value="'+esc(f.indirizzo||'')+'" placeholder="Es. Via Roma 12, Rieti"></div>'
      +'<div class="field"><label>Note</label><textarea id="fo-note" placeholder="'+(_foPro()?'Es. chiedere di Marco, rilievo a corpo fino a 40 punti':'Es. chiedere di Marco, sconto 10% sui laterizi')+'">'+esc(f.note||'')+'</textarea></div>'
      /* 19 nov 2026 — il riquadro «Collegamento TrovaImpresa» e' stato TOLTO
         (deciso da Alex): cercava solo i negozi iscritti e non ce n'e' nessuno,
         quindi non trovava mai niente. Il collegamento gia' salvato non si
         perde: resta in questa casella nascosta. fornTiCerca / fornTiScegli
         restano nel file, non le chiama piu' nessuno. */
      +'<input type="hidden" id="fo-tid" value="'+esc(f.trovaimpresa_id||'')+'">'
      +'</div>'
      +'</div></div>',
      ctrTastoHTML('fornitore')
      +'<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="save-forn" data-id="'+(f.id||'')+'">'+(isNew?'Aggiungi':'Salva')+'</button>');
    ctrAscolta('fornitore');
  }
  async function fornTiCerca(){
    const q=($("#fo-ti-q")&&$("#fo-ti-q").value.trim())||"";
    const box=$("#fo-ti-risultati");if(!box)return;
    if(q.length<2){box.innerHTML='<div class="campo-aiuto">Scrivi almeno 2 lettere del nome.</div>';return;}
    box.innerHTML='<div class="loading">Cerco su TrovaImpresa...</div>';
    const {data,error}=await sb.from("imprese")
      .select("id,nome_attivita,citta,provincia,telefono,email,indirizzo")
      .eq("tipo","negozio").or("is_test.is.null,is_test.eq.false")
      .ilike("nome_attivita","%"+q+"%").limit(8);
    if(error){box.innerHTML='<div class="campo-aiuto" style="color:var(--attesa)">Ricerca non riuscita, riprova.</div>';return;}
    _tiRisultati=data||[];
    if(!_tiRisultati.length){box.innerHTML='<div class="campo-aiuto">Nessun negozio trovato con questo nome. Puoi comunque salvare il fornitore senza collegamento.</div>';return;}
    box.innerHTML=_tiRisultati.map((r,i)=>'<div class="doc-riga" style="cursor:pointer" data-action="forn-ti-scegli" data-i="'+i+'">'
      +'<span class="doc-ico">🏪</span>'
      +'<span class="doc-nome">'+esc(r.nome_attivita||"Negozio")+'<small>'+esc([r.citta,r.provincia].filter(Boolean).join(" ("))+(r.provincia?")":"")+'</small></span>'
      +'<button type="button" class="btn">Collega</button></div>').join("");
  }
  function fornTiScegli(i){
    const r=_tiRisultati[+i];if(!r)return;
    if($("#fo-tid"))$("#fo-tid").value=r.id;
    /* i campi vuoti si riempiono coi dati del negozio; quelli già scritti non si toccano */
    if($("#fo-nome")&&!$("#fo-nome").value.trim())$("#fo-nome").value=r.nome_attivita||"";
    if($("#fo-tel")&&!$("#fo-tel").value.trim())$("#fo-tel").value=r.telefono||"";
    if($("#fo-email")&&!$("#fo-email").value.trim())$("#fo-email").value=r.email||"";
    if($("#fo-ind")&&!$("#fo-ind").value.trim())$("#fo-ind").value=[r.indirizzo,r.citta].filter(Boolean).join(", ");
    const st=$("#fo-ti-stato");
    if(st)st.innerHTML='<div class="ff-riass" style="background:var(--ok-bg);border-color:var(--ok);color:var(--ok)">✓ Collegato a <b>'+esc(r.nome_attivita||"negozio")+'</b> <button type="button" class="btn btn-sm" data-action="forn-ti-scollega" style="margin-left:8px">Scollega</button></div>';
    const box=$("#fo-ti-risultati");if(box)box.innerHTML="";
    toast("Negozio collegato: ricordati di salvare ✔");
  }
  let fornSalvo=false;   /* 19 nov 2026: due tocchi su «Aggiungi» facevano DUE fornitori (provato dal vivo) */
  async function saveForn(id){
    if(fornSalvo)return;
    const nome=$("#fo-nome").value.trim();if(!nome){campoManca($("#fo-nome"),"Manca il nome del fornitore: scrivilo qui.");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    fornSalvo=true;
    try{ await _saveForn(id,nome); }
    finally{ fornSalvo=false; }
  }
  async function _saveForn(id,nome){
    /* 19 nov 2026 — stesso nome di un fornitore che c'e' gia': si chiede prima */
    if(!id&&(fornCache||[]).some(x=>String(x.nome||"").trim().toLowerCase()===nome.toLowerCase())){
      if(!(await gconfirm("Hai già un fornitore che si chiama «"+nome+"».\n\nLo aggiungo lo stesso?")))return;
    }
    const _bs=document.querySelector('#sheet [data-action="save-forn"]');if(_bs)_bs.disabled=true;
    try{ await _saveFornScrivi(id,nome); }
    finally{ if(_bs&&document.body.contains(_bs))_bs.disabled=false; }
  }
  async function _saveFornScrivi(id,nome){
    const row={nome,categoria:$("#fo-cat").value||null,telefono:$("#fo-tel").value.trim()||null,
      email:$("#fo-email").value.trim()||null,piva:$("#fo-piva").value.trim()||null,
      indirizzo:$("#fo-ind").value.trim()||null,note:$("#fo-note").value.trim()||null,
      trovaimpresa_id:($("#fo-tid")&&$("#fo-tid").value)||null};
    let {data,error}=id
      ?await sb.from("gest_fornitori").update(row).eq("id",id).eq("user_id",sbUid).select("id")
      :await sb.from("gest_fornitori").insert(Object.assign({},row,{user_id:sbUid,mestiere_id:curMestiere()})).select("id");
    let avvisoTi=false;
    if(error&&/trovaimpresa_id/i.test(error.message||"")&&/column|schema cache/i.test(error.message||"")){
      delete row.trovaimpresa_id;
      ({data,error}=id
        ?await sb.from("gest_fornitori").update(row).eq("id",id).eq("user_id",sbUid).select("id")
        :await sb.from("gest_fornitori").insert(Object.assign({},row,{user_id:sbUid,mestiere_id:curMestiere()})).select("id"));
      if(!error)avvisoTi=true;
    }
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
    closeSheet();renderFornitori();rinfresca("riepilogo");
    /* 24 nov 2026 — si era partiti dalla fattura da pagare: si torna lì */
    if(!id&&window._ffRitorno){
      const R=window._ffRitorno;window._ffRitorno=null;
      try{
        const _imp=parseFloat(String(R.importo||"").replace(/\./g,"").replace(",","."));
        await fattfForm({fornitore_id:data[0].id,lavoro_id:R.lavoro_id,numero:R.numero||null,data:R.data||null,
          importo:isNaN(_imp)?null:_imp,scadenza:R.scadenza||null,note:R.note||null});
        if(R.pratica)window._tornaPraticaDaFf=R.pratica;
      }catch(e){}
    }
    toast(avvisoTi?"Salvato, ma il collegamento TrovaImpresa no: manca la migrazione SQL (gest-fornitori-plus)":(id?"Aggiornato ✔":"Fornitore aggiunto ✔"));
  }

  /* ============================================================
     20 nov 2026 (studio, voce Fornitori — «1 si 2 si 3 si» di Alex, foto
     approvate). Le fatture dei fornitori parlano con la PRATICA:
     - accanto a ogni fattura «per la pratica «…»» (elenco e scheda);
     - dentro la pratica l'elenco delle sue fatture, con «Apri» e
       «+ Fattura di un fornitore per questa pratica»; chiudendo o salvando
       la fattura si torna nella pratica (window._tornaPraticaDaFf).
     Valgono per tutte le facce: all'impresa si dice «lavoro».
     ============================================================ */
  async function _ffNomiLavori(lista){
    const ids=[...new Set((lista||[]).map(x=>x.lavoro_id).filter(Boolean).map(String))];
    if(!ids.length||!sb||!sbUid)return {};
    try{
      const {data}=await (sb.raw?sb.raw("gest_lavori"):sb.from("gest_lavori")).select("id,descrizione,eliminato_il").eq("user_id",sbUid).in("id",ids);
      const m={};(data||[]).forEach(l=>{m[String(l.id)]=(l.descrizione||"")+(l.eliminato_il?" (nel cestino)":"");});
      return m;
    }catch(e){ return {}; }
  }
  function _ffPerLavoro(f,nomi){
    if(!f||!f.lavoro_id)return "";
    const n=(nomi||{})[String(f.lavoro_id)];
    return '<small class="ff-lav">'+(_foPro()?'per la pratica':'per il lavoro')+(n?' «'+esc(n)+'»':'')+'</small>';
  }
  async function lavFattForn(lavoroId){
    const mb=$("#margine-box");if(!mb||!sb||!sbUid||!lavoroId)return;
    let box=$("#lav-ff");
    if(!box){box=document.createElement("div");box.id="lav-ff";box.className="lav-ff";mb.parentNode.insertBefore(box,mb.nextSibling);}
    const pro=_foPro();
    const [rff,rfo]=await Promise.all([
      sb.from("gest_fatture_fornitori").select("id,numero,importo,stato,scadenza,fornitore_id,created_at").eq("user_id",sbUid).eq("lavoro_id",lavoroId),
      sb.from("gest_fornitori").select("id,nome").eq("user_id",sbUid)
    ]);
    if(String(speseLavoroId||"")!==String(lavoroId))return;   /* nel frattempo si e' aperto un altro lavoro */
    if(rff.error){box.innerHTML="";return;}
    const ff=(rff.data||[]).sort((a,b)=>((a.stato==="pagata")-(b.stato==="pagata"))||String(b.created_at||"").localeCompare(String(a.created_at||"")));
    const nomi={};((rfo&&rfo.data)||[]).forEach(x=>{nomi[String(x.id)]=x.nome;});
    const oggi=todayStr(), tot=ff.reduce((a,x)=>a+(+x.importo||0),0);
    const nuova='<button type="button" class="btn btn-sm" data-action="lav-ff-nuova" data-id="'+esc(String(lavoroId))+'">+ Fattura di un fornitore per '+(pro?'questa pratica':'questo lavoro')+'</button>';
    /* 25 nov 2026 (sì di Alex, «facciamoli tutti») — i MATERIALI comprati per
       questo lavoro: le righe «Cosa hai comprato» delle fatture qui sopra
       (gest_acquisti.lavoro_id). Si leggono e basta: i soldi sono gia' nelle
       fatture, quindi nel margine non entrano una seconda volta.
       Allo studio niente: la merce non la segna. */
    let mat="";
    if(!pro&&ff.length){
      try{
        const ra=await sb.from("gest_acquisti").select("id,descrizione,quantita,unita,importo,data,created_at").eq("user_id",sbUid).eq("lavoro_id",lavoroId);
        if(String(speseLavoroId||"")!==String(lavoroId))return;
        const A=(!ra.error&&ra.data)||[];
        if(A.length){
          A.sort((a,b)=>String(b.data||"").localeCompare(String(a.data||""))||String(b.created_at||"").localeCompare(String(a.created_at||"")));
          const tA=A.reduce((a,x)=>a+(+x.importo||0),0);
          const q=x=>{const n=+x.quantita;if(!n)return "";return String(Math.round(n*1000)/1000).replace(".",",")+(x.unita?" "+x.unita:"");};
          mat='<div class="lav-ff-tit lav-mat-tit">Materiali comprati per questo lavoro — '+eur2(tA)+'</div>'
            +A.map(x=>'<div class="ff-r lav-mat"><div class="ff-info"><b>'+esc(x.descrizione||"Materiale")+'</b>'+(q(x)?' · '+esc(q(x)):'')+'</div>'
              +'<span class="ff-q">'+esc(x.data?fdate(x.data):"")+'</span><span class="ff-imp">'+eur2(+x.importo||0)+'</span></div>').join("")
            +'<p class="lav-ff-vuoto">Sono le righe delle fatture qui sopra: nel guadagno contano una volta sola.</p>';
        }
      }catch(_){}
    }
    if(!ff.length){box.innerHTML='<div class="lav-ff-tit">Fatture dei fornitori</div><p class="lav-ff-vuoto">Nessuna fattura di fornitore collegata.</p>'+nuova;return;}
    box.innerHTML='<div class="lav-ff-tit">Fatture dei fornitori di '+(pro?'questa pratica':'questo lavoro')+' — '+eur2(tot)+'</div>'
      +ff.map(x=>{
        const pag=x.stato==="pagata", rit=!pag&&x.scadenza&&x.scadenza<oggi;
        return '<div class="ff-r'+(rit?' rit':'')+(pag?' pag':'')+'">'
          +'<div class="ff-info"><b>'+esc(nomi[String(x.fornitore_id)]||"Fornitore")+'</b>'+(x.numero?' · n. '+esc(x.numero):'')+'</div>'
          +'<span class="ff-q'+(rit?' q-passato':'')+'">'+(pag?'pagata':(rit?'scaduta':'da pagare'))+'</span>'
          +'<span class="ff-imp">'+eur2(+x.importo||0)+'</span>'
          +'<div class="ff-acts"><button type="button" class="btn btn-sm" data-action="lav-ff-apri" data-id="'+esc(String(x.id))+'" data-lav="'+esc(String(lavoroId))+'">Apri</button></div>'
          +'</div>';
      }).join("")
      +nuova+mat;
  }
  /* ============================================================
     25 nov 2026 (sì di Alex) — LA FATTURA PAGATA CON LA CARTA AZIENDALE.
     Segnando «Pagata» si sceglie come: bonifico/contanti oppure una carta.
     Con la carta nasce un movimento di spesa sulla carta (il saldo scende)
     che porta fattura_forn_id: Report, Riepilogo e Tasse NON lo contano
     fra le spese, perche' la fattura c'e' gia'. Riaprendo la fattura il
     movimento si toglie; cambiando l'importo della fattura si aggiorna.
     ============================================================ */
  async function ffCarteReparto(){
    try{
      const {data}=await sb.from("gest_carte").select("id,nome,stato").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("nome");
      return (data||[]);
    }catch(e){return [];}
  }
  /* "" = bonifico/contanti · id = quella carta · null = annullato */
  async function ffComeHaiPagato(){
    if(!sb||!sbUid)return "";
    const C=await ffCarteReparto();
    if(!C.length)return "";
    return await new Promise(function(fine){
      const ov=document.createElement("div");ov.id="ffc-ov";
      ov.innerHTML='<div id="ffc-box" role="dialog" aria-modal="true" aria-labelledby="ffc-t">'
        +'<h3 id="ffc-t">Come l\'hai pagata?</h3>'
        +'<p>Se l\'hai pagata con una carta aziendale, la spesa esce anche dal saldo della carta.</p>'
        +'<div id="ffc-az">'
        +C.map(c=>'<button type="button" class="ffc-carta" data-c="'+esc(String(c.id))+'">💳 '+esc(c.nome||"Carta")+(c.stato==="bloccata"?" (bloccata)":"")+'</button>').join("")
        +'<button type="button" class="ffc-altro" data-c="">Bonifico, contanti o altro</button>'
        +'<button type="button" class="ffc-no">Annulla</button>'
        +'</div></div>';
      function chiudi(v){document.removeEventListener("keydown",tasto,true);ov.remove();fine(v);}
      function tasto(e){if(e.key==="Escape"){e.preventDefault();chiudi(null);}}
      ov.addEventListener("click",function(e){
        const b=e.target.closest("button");
        if(b){if(b.classList.contains("ffc-no"))return chiudi(null);return chiudi(b.dataset.c||"");}
        if(e.target===ov)chiudi(null);
      });
      document.addEventListener("keydown",tasto,true);
      document.body.appendChild(ov);
      const p=ov.querySelector(".ffc-carta");if(p)p.focus();
    });
  }
  /* scrive/aggiorna/toglie il movimento della carta legato alla fattura.
     cartaId "" = nessuna carta (si toglie quello che c'era). Torna una frase. */
  async function ffCartaPaga(fattId,cartaId){
    try{
      const r=await sb.from("gest_fatture_fornitori").select("id,numero,importo,lavoro_id,fornitore_id,data_pagata").eq("id",fattId).eq("user_id",sbUid).maybeSingle();
      const f=r&&r.data; if(!f)return "";
      const ex=await sb.from("gest_carte_movimenti").select("id,carta_id").eq("user_id",sbUid).eq("fattura_forn_id",fattId);
      const vecchi=(ex&&ex.data)||[];
      if(!cartaId){
        if(!vecchi.length)return "";
        const d=await sb.from("gest_carte_movimenti").delete().eq("user_id",sbUid).eq("fattura_forn_id",fattId).select("id");
        if(d.error||!(d.data||[]).length)return "attenzione: la spesa sulla carta non si è tolta, toglila dalla carta";
        return "tolta anche la spesa dalla carta";
      }
      let nomeF=((fornCache||[]).find(x=>String(x.id)===String(f.fornitore_id))||{}).nome;
      if(!nomeF&&f.fornitore_id){try{const rn=await (sb.raw||sb.from.bind(sb))("gest_fornitori").select("nome").eq("id",f.fornitore_id).maybeSingle();nomeF=rn&&rn.data&&rn.data.nome;}catch(_){}}
      const riga={carta_id:cartaId,tipo:"spesa",importo:+f.importo||0,lavoro_id:f.lavoro_id||null,
        causale:"Fattura"+(f.numero?" n. "+f.numero:"")+(nomeF?" — "+nomeF:""),data:f.data_pagata||todayStr()};
      if(vecchi.length){
        const u=await sb.from("gest_carte_movimenti").update(riga).eq("user_id",sbUid).eq("fattura_forn_id",fattId).select("id");
        if(u.error||!(u.data||[]).length)return "attenzione: la spesa sulla carta non si è aggiornata";
        return "spesa aggiornata sulla carta";
      }
      const i=await sb.from("gest_carte_movimenti").insert(Object.assign({user_id:sbUid,inserito_da:"Capo",fattura_forn_id:fattId},riga)).select("id");
      if(i.error||!(i.data||[]).length)return "attenzione: la spesa sulla carta NON è stata scritta, scrivila dalla carta";
      return "spesa tolta anche dal saldo della carta";
    }catch(e){return "attenzione: la spesa sulla carta non si è scritta";}
  }
  /* la fattura gia' pagata con la carta e poi modificata (importo, lavoro):
     il movimento si allinea. Se non c'e' movimento non si fa niente. */
  async function ffCartaAllinea(fattId){
    try{
      const ex=await sb.from("gest_carte_movimenti").select("carta_id").eq("user_id",sbUid).eq("fattura_forn_id",fattId).limit(1);
      const m=(ex&&ex.data||[])[0]; if(!m)return "";
      return await ffCartaPaga(fattId,m.carta_id);
    }catch(e){return "";}
  }
  async function lavFfApri(fattId,lavoroId){
    let row={lavoro_id:lavoroId};
    if(fattId){
      const {data,error}=await sb.from("gest_fatture_fornitori").select("*").eq("id",fattId).eq("user_id",sbUid).maybeSingle();
      if(error||!data){toast("Questa fattura non c'è più (potrebbe essere nel cestino)");return;}
      row=data;
    }
    /* sempre riletti: dalla pratica non si e' passati da Fornitori, e la lista
       in memoria puo' essere vecchia (provato: la tendina sceglieva un altro
       fornitore e il salvataggio veniva rifiutato) */
    {const {data:fo}=await sb.from("gest_fornitori").select("*").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("created_at",{ascending:false});if(fo)fornCache=fo;}
    await fattfForm(row);
    window._tornaPraticaDaFf=String(lavoroId);
  }
