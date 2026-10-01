// [SPOSTATO] gest-commercialista.js: era dentro gest-core.js, righe 6984-7418, spostato identico.
  /* ================= DOCUMENTI DEL CLIENTE =================
     Riusa il deposito e la tabella che già portano i PDF delle fatture
     (bucket gestionale-foto + gest_foto): cambia solo il collegamento,
     che qui è cliente_id invece di fattura_id.
     Serve per tenere insieme al cliente il verbale del condominio, il
     preventivo firmato, il capitolato: le carte che oggi si perdono. */
  let docCliId=null, docCliNome="", docCommAttivo=false;

  function docCliIcona(nome){
    const n=String(nome||"").toLowerCase();
    if(/\.(jpg|jpeg|png|webp|gif|heic)$/.test(n))return "🖼";
    if(/\.pdf$/.test(n))return "📕";
    if(/\.(doc|docx|odt)$/.test(n))return "📘";
    if(/\.(xls|xlsx|csv)$/.test(n))return "📗";
    return "📄";
  }
  function docCliPeso(b){
    if(!b&&b!==0)return "";
    return b>=1048576 ? (b/1048576).toFixed(1)+" MB" : Math.max(1,Math.round(b/1024))+" KB";
  }

  /* Scheda del cliente in sola lettura: si apre, si legge, non si tocca niente.
     Prima per vedere l'email o la partita IVA bisognava entrare in "Modifica",
     col rischio di cambiare qualcosa per sbaglio. Modifica e Documenti stanno
     qui dentro, in fondo. */
  const _TIPO_LAB={privato:"Privato",azienda:"Azienda",condominio:"Condominio"};

  function _rigaDato(etichetta,valore,link){
    const v=(valore==null||String(valore).trim()==="")?"":String(valore).trim();
    if(!v)return '<div class="dato"><span class="dato-lab">'+etichetta+'</span><span class="dato-val vuoto">non indicato</span></div>';
    const dentro=link?'<a href="'+link+esc(v)+'">'+esc(v)+'</a>':esc(v);
    return '<div class="dato"><span class="dato-lab">'+etichetta+'</span><span class="dato-val">'+dentro+'</span></div>';
  }

  /* ================= COMMERCIALISTA =================
     Un reparto suo, di fianco ai Dati azienda. I dati stanno nella stessa
     riga gest_azienda (colonne comm_*): il commercialista è uno solo per
     l'impresa, non serve una tabella a parte.

     NOTA su cosa NON serve: se il commercialista ha la delega al cassetto
     fiscale — e ormai ce l'hanno quasi tutti — le fatture elettroniche le
     scarica da solo dall'Agenzia delle Entrate. Mandargliele sarebbe roba
     che ha già. Quello che NON gli arriva sono scontrini, ricevute di carta
     e spese di cassa: per quelli c'e' la sezione documenti qui sotto. */
  async function commForm(){
    if(!sbUid){toast("Devi essere loggato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    const a=az||{};
    openSheetGrande("Il tuo commercialista",
      '<div class="sh-cols sh-cols--fatt"><div class="sh-col">'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Chi &egrave;</div>'
      +   '<div class="field"><label>Studio</label>'
      +     '<input id="cm-studio" value="'+esc(a.comm_studio||"")+'" placeholder="Es. Studio Rossi &amp; Associati"></div>'
      +   '<div class="field"><label>Nome della persona</label>'
      +     '<input id="cm-nome" value="'+esc(a.comm_nome||"")+'" placeholder="Con chi parli di solito"></div>'
      + '</div>'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Come lo raggiungi</div>'
      +   '<div class="field"><label>Telefono</label>'
      +     '<input id="cm-tel" type="tel" value="'+esc(a.comm_tel||"")+'" placeholder="Es. 320 1234567"></div>'
      +   '<div class="field"><label>Email</label>'
      +     '<input id="cm-email" type="email" value="'+esc(a.comm_email||"")+'" placeholder="studio@email.it"></div>'
      +   '<div class="field"><label>PEC</label>'
      +     '<input id="cm-pec" type="email" value="'+esc(a.comm_pec||"")+'" placeholder="studio@pec.it"></div>'
      + '</div>'
      + '</div><div class="sh-col">'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Documenti per lui</div>'
      +   '<p class="sh-nota" style="margin-top:0">Scontrini, ricevute di carta, spese di cassa: le cose che <b>non</b> gli arrivano da sole. Le fatture elettroniche non servono, quelle se le scarica dal cassetto fiscale con la delega.</p>'
      +   '<button type="button" class="btn" data-action="comm-doc">&#128206; Apri i documenti del commercialista</button>'
      + '</div>'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Appunti</div>'
      +   '<div class="field"><label>Note</label>'
      +     '<textarea id="cm-note" rows="6" placeholder="Quello che ti serve ricordare: scadenze, come preferisce ricevere le cose, cosa ti chiede ogni volta">'+esc(a.comm_note||"")+'</textarea></div>'
      + '</div>'
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      + '<button class="btn-primary" data-action="save-comm">Salva</button>');
  }

  async function saveComm(){
    if(!sbUid){toast("Devi essere loggato");return;}
    const v=q=>{const e=$(q);return e?String(e.value||"").trim():"";};
    const row={user_id:sbUid,
      comm_studio:v("#cm-studio")||null, comm_nome:v("#cm-nome")||null,
      comm_tel:v("#cm-tel")||null, comm_email:v("#cm-email")||null,
      comm_pec:v("#cm-pec")||null, comm_note:v("#cm-note")||null};
    let {error}=await sb.from("gest_azienda").upsert(row,{onConflict:"user_id"});
    /* se le colonne non ci sono ancora, lo dico chiaro invece di fallire in silenzio */
    if(error){
      const manca=/comm_/.test(error.message||"");
      toast(manca?"Serve prima l'aggiornamento del database (sql/aggiungi-commercialista.sql)":"Errore: "+error.message);
      return;
    }
    closeSheet();toast("Commercialista salvato ✔");
  }

  /* Documenti del commercialista: stesso deposito e stessa tabella dei documenti
     cliente, ma legati a te invece che a un cliente (tipo "doc_commercialista"). */
  async function docCommApri(){
    if(!sbUid){toast("Devi essere loggato");return;}
    docCliId=null; docCommAttivo=true;
    openSheetGrande("Documenti per il commercialista",
      '<div class="sh-b">'
      + '<div class="sh-tit">Carica un documento</div>'
      + '<p class="sh-nota" style="margin-top:0">Scontrini, ricevute, spese di cassa: quello che il commercialista non trova nel cassetto fiscale. Puoi caricarne pi&ugrave; di uno alla volta. Massimo 15 MB per file.</p>'
      + '<button class="btn-primary" data-action="doc-cli-scegli" style="margin-top:6px">Scegli i file dal computer</button>'
      + '</div>'
      + '<div class="sh-b">'
      + '<div class="sh-tit">Documenti gi&agrave; caricati</div>'
      + '<div id="doc-cli-lista"><div class="loading">Caricamento...</div></div>'
      + '</div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    renderDocCli();
  }

  async function cliScheda(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    let c=null;
    const {data:r}=await sb.from("gest_clienti").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    c=r||cliCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Cliente non trovato");return;}

    const tipo=_TIPO_LAB[c.tipo]||"Privato";
    const tag='<span class="tipo-tag">'+tipo+'</span>';
    const ind=cliIndirizzo(c);
    const etNome=c.tipo==="azienda"?"Ragione sociale":(c.tipo==="condominio"?"Nome condominio":"Nome e cognome");
    const etRef=c.tipo==="condominio"?"Amministratore":"Referente";

    openSheetGrande(esc(c.nome||"Cliente")+tag,
      /* la striscia sta PRIMA di tutto: se c'e' qualcosa da guardare, lo
         vedi appena apri, non dopo aver scorso mezza scheda */
      ctrStrisciaHTML('cliente',c)
      + '<div class="sh-cols sh-cols--fatt"><div class="sh-col">'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Chi &egrave;</div>'
      +   _rigaDato(etNome,c.nome)
      +   _rigaDato(etRef,c.referente)
      +   _rigaDato("Telefono",c.telefono,"tel:")
      +   _rigaDato("Email",c.email,"mailto:")
      + '</div>'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Dove sta</div>'
      +   _rigaDato("Indirizzo",ind)
      + '</div>'
      + '</div><div class="sh-col">'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Dati fiscali</div>'
      +   _rigaDato("Partita IVA",c.piva)
      +   _rigaDato("Codice fiscale",c.cod_fiscale)
      + '</div>'
      + '<div class="sh-b">'
      +   '<div class="sh-tit">Dove mandargli la fattura</div>'
      +   _rigaDato("Codice destinatario",c.sdi_codice)
      +   _rigaDato("PEC",c.sdi_pec)
      + '</div>'
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>'
      + '<button class="btn" data-action="doc-cli" data-id="'+esc(c.id)+'">&#128206; Documenti</button>'
      + '<button class="btn-primary" data-action="edit-cli" data-id="'+esc(c.id)+'">&#9998; Modifica</button>');
  }

  async function docCliApri(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const c=cliCache.find(x=>String(x.id)===String(id));
    docCliId=id; docCliNome=(c&&c.nome)||"cliente"; docCommAttivo=false;
    openSheetGrande("Documenti di "+esc(docCliNome),
      `<div class="sh-b">
         <div class="sh-tit">Carica un documento</div>
         <p class="sh-nota" style="margin-top:0">Verbali, preventivi firmati, capitolati, permessi, foto: qui restano attaccati al cliente e non si perdono. Puoi caricarne pi&ugrave; di uno alla volta. Massimo 15 MB per file.</p>
         <button class="btn-primary" data-action="doc-cli-scegli" style="margin-top:6px">Scegli i file dal computer</button>
       </div>
       <div class="sh-b">
         <div class="sh-tit">Documenti gi&agrave; caricati</div>
         <div id="doc-cli-lista"><div class="loading">Caricamento...</div></div>
       </div>`,
      `<button class="btn b-cancel" data-action="close">Chiudi</button>`);
    renderDocCli();
  }

  async function renderDocCli(){
    const box=$("#doc-cli-lista"); if(!box)return;
    if(!docCommAttivo&&!docCliId)return;
    let q=sb.from("gest_foto").select("id,storage_path,nome_file,created_at").eq("user_id",sbUid);
    /* due gruppi distinti: quelli di un cliente e quelli del commercialista */
    q = docCommAttivo ? q.eq("tipo","doc_commercialista")
                      : q.eq("cliente_id",docCliId).eq("tipo","documento");
    const {data,error}=await q.order("created_at",{ascending:false});
    if(error){
      /* se la colonna non c'e' ancora, lo dico invece di lasciare la rotella */
      box.innerHTML='<div class="campo-aiuto" style="color:var(--attesa)">Non riesco a leggere i documenti: '+esc(error.message)+'</div>';
      return;
    }
    if(!data||!data.length){
      box.innerHTML='<div class="campo-aiuto">Nessun documento per ora. Usa il pulsante qui sopra.</div>';
      return;
    }
    box.innerHTML=data.map(d=>{
      const nome=d.nome_file||String(d.storage_path||"").split("/").pop()||"documento";
      const quando=d.created_at?new Date(d.created_at).toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric"}):"";
      return '<div class="doc-riga">'
        +   '<span class="doc-ico">'+docCliIcona(nome)+'</span>'
        +   '<span class="doc-nome">'+esc(nome)+'<small>'+esc(quando)+'</small></span>'
        +   '<button class="btn" data-action="doc-cli-apri" data-id="'+esc(d.id)+'">Apri</button>'
        +   '<button class="btn b-mail" data-action="doc-cli-mail" data-id="'+esc(d.id)+'">Invia</button>'
        +   '<button class="btn b-del" data-action="doc-cli-del" data-id="'+esc(d.id)+'">Elimina</button>'
        + '</div>';
    }).join("");
  }

  async function uploadDocCliente(files){
    if(!files||!files.length)return;
    if(!docCommAttivo&&!docCliId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    let ok=0, ko=0;
    for(const file of Array.from(files)){
      const p=await preparaFileUpload(file);
      if(p.errore){toast(p.errore);ko++;continue;}
      const safe=String(p.nome||"documento").replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+(docCommAttivo?"/commercialista/":"/clienti/"+docCliId+"/")+Date.now()+"_"+safe;
      const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
      if(up){toast("Non caricato: "+up.message);ko++;continue;}
      const riga=docCommAttivo
        ? {user_id:sbUid,tipo:"doc_commercialista",operatore:"Capo",storage_path:path,nome_file:p.nome||safe}
        : {user_id:sbUid,cliente_id:docCliId,tipo:"documento",operatore:"Capo",storage_path:path,nome_file:p.nome||safe};
      let {error:ins}=await sb.from("gest_foto").insert(riga);
      if(ins&&(ins.message||"").indexOf("nome_file")>=0){
        /* database senza la colonna del nome: salvo lo stesso, il nome si legge dal path */
        delete riga.nome_file;
        ({error:ins}=await sb.from("gest_foto").insert(riga));
      }
      if(ins){await _fileOrfano("gestionale-foto",path);toast("File non salvato: "+ins.message);ko++;continue;}
      ok++;
    }
    if(ok)toast(ok===1?"Documento caricato ✔":ok+" documenti caricati ✔");
    renderDocCli();
  }

  /* Manda il documento al cliente per email, in allegato, con copia a te.
     Il file NON passa dal browser: la funzione sul server lo prende dal
     deposito e lo attacca, dopo aver controllato che sia davvero tuo. */
  async function docCliMailForm(id){
    const {data:r}=await sb.from("gest_foto").select("id,nome_file,storage_path").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(!r){toast("Documento non trovato");return;}
    const nome=r.nome_file||String(r.storage_path||"").split("/").pop()||"documento";
    const c=cliCache.find(x=>String(x.id)===String(docCliId))||{};
    const mail=(c.email||"").trim();
    const avviso=mail?"":'<div class="sh-nota" style="color:var(--attesa)">Questo cliente non ha una email salvata. Scrivila qui: poi conviene metterla anche nella sua scheda, cos&igrave; la prossima volta c&rsquo;&egrave; gi&agrave;.</div>';
    openSheetGrande("Invia "+esc(nome),
      '<div class="sh-b">'
      + '<div class="sh-tit">A chi lo mando</div>'
      + '<div class="field"><label>Email del cliente</label>'
      +   '<input id="dm-a" type="email" value="'+esc(mail)+'" placeholder="cliente@email.it"></div>'
      + avviso
      + '</div>'
      + '<div class="sh-b">'
      + '<div class="sh-tit">Cosa scrivo</div>'
      + '<div class="field"><label>Oggetto</label>'
      +   '<input id="dm-ogg" value="'+esc(nome)+'" placeholder="Oggetto della email"></div>'
      + '<div class="field"><label>Messaggio</label>'
      +   '<textarea id="dm-msg" rows="6" placeholder="Due righe per accompagnare il documento">'+(docCommAttivo?"Buongiorno,\n\nin allegato le mando il documento per la contabilit\u00e0.\n\nGrazie.":"Buongiorno,\n\nin allegato trova il documento richiesto.\n\nResto a disposizione.")+'</textarea></div>'
      + '<label class="chk-riga"><input type="checkbox" id="dm-copia" checked> Manda una copia anche a me</label>'
      + '</div>',
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      + '<button class="btn-primary" data-action="doc-cli-invia" data-id="'+esc(id)+'">Invia</button>');
    if(typeof aiScriviMeglioAggancia==="function")aiScriviMeglioAggancia("#dm-msg","dm");
  }

  async function docCliInvia(id){
    const a=(($("#dm-a")||{}).value||"").trim();
    if(a.indexOf("@")<0){toast("Scrivi un indirizzo email valido");return;}
    const oggetto=($("#dm-ogg")||{}).value||"";
    const messaggio=($("#dm-msg")||{}).value||"";
    const copia=!!(($("#dm-copia")||{}).checked);
    const btn=document.querySelector('[data-action="doc-cli-invia"]');
    if(btn){btn.disabled=true;btn.textContent="Invio in corso...";}
    try{
      const {data:s}=await sb.auth.getSession();
      const tok=s&&s.session&&s.session.access_token;
      if(!tok){toast("Sessione scaduta: rientra nel gestionale");return;}
      const res=await fetch("/.netlify/functions/invia-documento-cliente",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({access_token:tok,doc_id:id,a:a,oggetto:oggetto,messaggio:messaggio,copia_a_me:copia})
      });
      const out=await res.json().catch(function(){return {};});
      if(!res.ok||!out.success){toast("Non inviata: "+((out&&out.error)||res.status));return;}
      toast("Documento inviato ✔");
      docCliApri(docCliId);
    }catch(e){
      toast("Errore di rete: "+e.message);
    }finally{
      if(btn){btn.disabled=false;btn.textContent="Invia";}
    }
  }

  async function docCliScarica(id){
    const {data:r}=await sb.from("gest_foto").select("storage_path").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(!r||!r.storage_path){toast("Documento non trovato");return;}
    const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(r.storage_path,3600);
    if(su&&su.signedUrl)window.open(su.signedUrl,"_blank");
    else toast("Non riesco ad aprire il documento");
  }

  async function docCliElimina(id){
    if(!gconfirm("Eliminare questo documento?"))return;
    const {data:r}=await sb.from("gest_foto").select("storage_path").eq("id",id).eq("user_id",sbUid).maybeSingle();
    const {error}=await sb.from("gest_foto").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    /* col cestino il file NON si tocca: se no il ripristino darebbe un'immagine rotta */
    if(r&&r.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo()))await sb.storage.from("gestionale-foto").remove([r.storage_path]);
    toast("Documento eliminato");
    renderDocCli();
  }

  async function saveCli(id){
    const v=q=>{const e=$(q);return e?String(e.value||"").trim():"";};
    const nome=v("#c-nome");if(!nome){toast("Scrivi il nome");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const row={nome,
      tipo:(($("#c-tipo-box")||{}).dataset||{}).tipo||"privato",
      indirizzo:v("#c-ind"), referente:v("#c-ref"), telefono:v("#c-tel"), email:v("#c-email")||null,
      cap:v("#c-cap")||null, citta:v("#c-citta")||null, prov:v("#c-prov").toUpperCase()||null,
      piva:v("#c-piva")||null, cod_fiscale:v("#c-cf").toUpperCase()||null,
      sdi_codice:v("#c-sdi").toUpperCase()||null, sdi_pec:v("#c-pec")||null};

    let {data:okCli,error}=id
      ?await sb.from("gest_clienti").update(row).eq("id",id).eq("user_id",sbUid).select("id")
      :await sb.from("gest_clienti").insert({...row,user_id:sbUid,mestiere_id:curMestiere()}).select("id");
    /* se le colonne fiscali non ci sono ancora nel database, salvo il resto
       invece di far fallire tutto — stessa rete dei Dati azienda */
    const OPZ=["tipo","email","cap","citta","prov","piva","cod_fiscale","sdi_codice","sdi_pec"];
    const tolte=[];
    while(error){
      const c=OPZ.find(x=>!tolte.includes(x)&&(error.message||"").indexOf(x)>=0);
      if(!c)break;
      delete row[c];tolte.push(c);
      ({data:okCli,error}=id
        ?await sb.from("gest_clienti").update(row).eq("id",id).eq("user_id",sbUid).select("id")
        :await sb.from("gest_clienti").insert({...row,user_id:sbUid,mestiere_id:curMestiere()}).select("id"));
    }
    if(error){toast("Errore: "+error.message);return;}
    if(!okCli||!okCli.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
    closeSheet();renderClienti();rinfresca("fatture","riepilogo");
    toast(tolte.length?"Attenzione: salvato, ma i campi fiscali richiedono un aggiornamento del database":(id?"Aggiornato":"Cliente aggiunto ✔"));
  }
  function dipForm(d){
    const isNew=!d;d=d||{};
    /* 9 agosto 2026 — finestra grande. Qui il campo è uno solo, quindi niente
       due colonne: sarebbero mezze vuote. Il modulo completo della persona
       (telefono, documenti, scadenze) è squadraForm. */
    openSheetGrande(isNew?"Nuova persona":"Rinomina persona",
      `<div class="sh-b">
        <div class="sh-tit">Come si chiama</div>
        <div class="field"><label>Nome</label><input id="d-nome" value="${esc(d.nome||"")}" placeholder="${ruoloUtente==='professionista'?'Es. Giulia':'Es. Wahid'}"></div>
        <p class="sh-nota">Telefono, documenti e scadenze si aggiungono dopo, aprendo la sua scheda.</p>
      </div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-dip" data-id="${d.id||""}">${isNew?"Aggiungi":"Salva"}</button>`);
  }
  async function saveDip(id){
    const nome=$("#d-nome").value.trim();if(!nome){toast("Scrivi il nome");return;}
    if(id)db().dipendenti=db().dipendenti.map(d=>d.id===id?{...d,nome}:d);else db().dipendenti.push({id:uid(),nome});
    await save();closeSheet();renderAll();toast("Salvato ✔");
  }

  /* ⚠️ 21 agosto 2026 — L'ANTEPRIMA. Alessio: «e troppo sempliciotto».
     La finestra chiedeva tre cose (nome, icona, colore) e non faceva vedere
     che cosa ne usciva: la card la scoprivi dopo aver premuto «Crea reparto».
     Adesso la card sta lì mentre scegli, ed è la STESSA che disegna la
     pagina iniziale — stesse classi, stesso CSS. */
  function _panelAnteprima(){
    const box=$("#p-prev"); if(!box)return;
    const c=COLORI[nuovoSel.col]||COLORI[0];
    /* ⚠️ 21 agosto 2026 — anche le icone della tendina prendono il colore
       scelto: se no scegli il verde e continui a vedere disegni blu, e non
       capisci come verra' finche' non guardi l'anteprima. */
    const ic=$("#p-ic"); if(ic)ic.style.color=c.ad;
    const nome=($("#p-nome")&&$("#p-nome").value.trim())||"";
    const vuoto=!nome;
    box.innerHTML=cartaReparto({as:c.as,ad:c.ad,icon:nuovoSel.icon,nome:nome,_vuoto:vuoto},0,0,true);
  }

  function panelForm(){
    nuovoSel={icon:"🔨",col:0};
    /* 9 agosto 2026 — finestra grande a due colonne: a sinistra il nome,
       a destra come lo si riconosce a colpo d'occhio (icona e colore). */
    openSheetGrande("Nuovo reparto",
      `<div class="sh-cols"><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">Come si chiama</div>
        <div class="field"><label>Nome del reparto</label><input id="p-nome" placeholder="${ruoloUtente==='professionista'?'Es. Progettazione, Direzione lavori, Catasto':'Es. Muratura, Idraulica, Giardini'}"></div>
        <p class="sh-nota">Ogni reparto tiene i suoi ${ruoloUtente==='professionista'?'pratiche, clienti e collaboratori':'lavori, clienti e persone'} separati dagli altri: quello che sta in uno non si mischia con l'altro.</p>
        </div>
        <div class="sh-b">
        <div class="sh-tit">Come verrà</div>
        <div class="p-prev-box" id="p-prev"></div>
        <div class="field"><label>Colore</label><div class="colors" id="p-col">${COLORI.map((c,i)=>`<button type="button" class="cl ${i===0?'on':''}" data-col="${i}" style="background:${c.a}" title="colore ${i+1}"></button>`).join("")}</div></div>
        <p class="sh-nota">È la scheda che troverai nella pagina di apertura, insieme agli altri reparti.</p>
        </div>
        </div><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">Come lo riconosci</div>
        <div class="field"><label>Icona</label>
          <div class="picker no-ico" id="p-ic">${ICONE_GRUPPI.map(g=>
            `<div class="pk-gruppo"><span class="pk-tit">${g[0]}</span><div class="pk-fila">`
            + g[1].map(i=>`<button type="button" class="pk ${i===nuovoSel.icon?'on':''}" data-ic="${i}">${icoRep(i)}</button>`).join("")
            + `</div></div>`).join("")}</div></div>
        </div>
        </div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-panel">Crea reparto</button>`);
    $("#p-ic").onclick=e=>{const b=e.target.closest("[data-ic]");if(!b)return;nuovoSel.icon=b.dataset.ic;
      /* ⛔ querySelectorAll e non .children: adesso i bottoni stanno dentro i
         gruppi, e i figli diretti del picker sono i gruppi, non i bottoni. */
      $("#p-ic").querySelectorAll("[data-ic]").forEach(x=>x.classList.toggle("on",x===b));_panelAnteprima();};
    $("#p-col").onclick=e=>{const b=e.target.closest("[data-col]");if(!b)return;nuovoSel.col=+b.dataset.col;[...$("#p-col").children].forEach(x=>x.classList.toggle("on",x===b));_panelAnteprima();};
    if($("#p-nome"))$("#p-nome").oninput=_panelAnteprima;
    _panelAnteprima();
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
