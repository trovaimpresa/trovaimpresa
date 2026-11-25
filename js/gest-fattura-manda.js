/* ============================================================
   MANDA LA FATTURA AL CLIENTE — 17 novembre 2026

   Prima c'era solo «Crea il PDF»: lo scaricavi e poi ti arrangiavi.
   Adesso dalla fattura si apre una finestra col messaggio gia' scritto
   (numero, importo, scadenza, IBAN) e i pulsanti per mandarlo:

     - Condividi il PDF  -> sul telefono apre WhatsApp / Mail col file
                            gia' attaccato (solo dove il telefono lo sa fare)
     - WhatsApp          -> apre la chat col messaggio
     - Email             -> apre il tuo programma di posta col messaggio
     - Copia il messaggio
     - Scarica il PDF

   NON manda niente da solo e NON scrive niente nel database: apre
   soltanto il programma, a mandare sei tu.

   Usa le cose della pagina (fattCache, fattConti, fatturaPdf...): questo
   file va caricato DOPO js/gest-fatture.js.
   ============================================================ */
  let _fm=null;

  /* ===== 25 nov 2026 — L'EMAIL COL PDF ALLEGATO, DA TROVAIMPRESA =====
     «Manda l'email col PDF» → si vede A CHI va (l'email nella scheda del
     cliente) → «Sì, manda». Il gestionale fa lo STESSO PDF di «Crea il PDF»,
     lo mette nel deposito privato e chiama netlify/functions/invia-fattura-email.js.
     Da qui partono solo il numero della fattura e il percorso del file:
     destinatario e testo li legge il server dal database (regola del 27 set).
     Tetti: gli stessi del preventivo, 5 al giorno per impresa. */
  const FM_SVG_MAIL='<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>';
  function fmNomeFile(f){
    const nome=(f.cli_nome||fmCliente(f).nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase();
    return "fattura-"+(f.numero?f.numero+"-"+fattAnno(f):"bozza")+"-"+nome+".pdf";
  }
  function fmOra(iso){ try{ const d=new Date(iso); return d.toLocaleDateString("it-IT")+" alle "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }catch(e){ return ""; } }
  function fmMailHtml(){
    if(!_fm)return "";
    const m=_fm.mailSt||{}, s=m.stato;
    const f=(typeof fattCache!=="undefined"?fattCache:[]).find(x=>String(x.id)===String(_fm.id))||{};
    const altre='<div class="sh-nota" style="margin-top:8px">Intanto puoi mandarla con WhatsApp o con la tua posta, qui sotto.</div>';
    if(s==="conferma"||s==="invio"){
      return '<div class="aic-banda" style="margin-top:12px;background:#fff;border:1.5px solid var(--blu,#0066ff)">'
        +'<div style="font-weight:700;font-size:17px;margin-bottom:8px">Manda per email</div>'
        +'<div style="margin:4px 0"><b>A:</b> '+esc(_fm.mail)+'</div>'
        +'<div style="margin:4px 0"><b>Allegato:</b> '+esc(fmNomeFile(f))+'</div>'
        +'<div style="margin:4px 0"><b>Nel testo:</b> numero, data'+(f.stato!=="pagata"&&f.tipo!=="nota_credito"?', scadenza e IBAN':'')+'</div>'
        +(f.stato==="bozza"?'<div style="margin:8px 0 0;color:var(--attesa,#b45309)"><b>È ancora una bozza</b>, senza numero: nell\'email c\'è scritto che la fattura vera arriva dopo.</div>':'')
        +'<div class="campo-aiuto" style="margin-top:6px">Parte da TrovaImpresa col nome della tua attività. Se il cliente risponde, la risposta arriva a te.</div>'
        +'<div class="aic-fila" style="margin-top:12px">'
        +  '<button type="button" class="aic-btn" data-action="fm-mail-annulla"'+(s==="invio"?' disabled':'')+'>Annulla</button>'
        +  '<button type="button" class="aic-btn aic-btn--pieno" data-action="fm-mail-manda"'+(s==="invio"?' disabled':'')+'>'+FM_SVG_MAIL+'<span>'+(s==="invio"?"Sto mandando…":"Sì, manda")+'</span></button>'
        +'</div></div>';
    }
    if(s==="mandato") return '<div class="aic-banda aic-banda--ok" style="margin-top:12px"><b>Mandata a '+esc(m.a)+'</b> alle '+esc(m.ora)+', col PDF allegato.'
        +(m.restano!=null?'<div style="margin-top:4px">Oggi puoi mandarne ancora '+m.restano+'.</div>':'')+'</div>';
    if(s==="senza") return '<div class="aic-banda aic-banda--attesa" style="margin-top:12px"><b>Il cliente non ha l\'email.</b> Scrivila nella sua scheda in Clienti, poi riprova.'+altre+'</div>';
    if(s==="finita") return '<div class="aic-banda aic-banda--attesa" style="margin-top:12px"><b>'+(m.perche==="impresa"?"Oggi hai già mandato 5 email: è il massimo al giorno.":"Oggi le email del sito sono finite.")+'</b> Domani si riparte.'+altre+'</div>';
    if(s==="errore") return '<div class="aic-banda aic-banda--attesa" style="margin-top:12px"><b>Non è partita.</b> '+esc(m.testo||"Riprova fra poco.")+altre+'</div>';
    return _fm.mailUltimo?'<div class="campo-aiuto" style="margin-top:10px">Ultima email mandata a '+esc(_fm.mailUltimo.a)+' il '+esc(fmOra(_fm.mailUltimo.creato_il))+'.</div>':'';
  }
  function fmMailRidisegna(){ const b=document.getElementById("fm-mail"); if(b)b.innerHTML=fmMailHtml(); }
  async function fmMailLeggi(id){
    try{
      const r=await sb.from("gest_email_documenti").select("a,creato_il").eq("fattura_id",id).eq("user_id",sbUid)
        .order("creato_il",{ascending:false}).limit(1);
      if(_fm&&String(_fm.id)===String(id)&&!r.error&&r.data&&r.data[0]){ _fm.mailUltimo=r.data[0]; if(!_fm.mailSt)fmMailRidisegna(); }
    }catch(e){}
  }
  async function fmMailManda(){
    if(!_fm||!_fm.mailSt||_fm.mailSt.stato!=="conferma")return;
    const id=_fm.id;
    const fine=m=>{ if(_fm&&_fm.id===id){ _fm.mailSt=m; fmMailRidisegna(); } };
    fine({stato:"invio"});
    try{
      const pdf=await fatturaPdf(id,{blob:true});
      if(!pdf||!pdf.blob) return fine({stato:"errore",testo:"Non riesco a fare il PDF: controlla la connessione."});
      const percorso=sbUid+"/email-documenti/fatt-"+id+"-"+Date.now()+".pdf";
      const up=await sb.storage.from("gestionale-foto").upload(percorso,pdf.blob,{contentType:"application/pdf",upsert:false});
      if(up.error) return fine({stato:"errore",testo:"Il PDF non si carica: "+(up.error.message||"riprova")});
      const ss=await sb.auth.getSession(), tk=ss&&ss.data&&ss.data.session&&ss.data.session.access_token;
      const r=await fetch("/.netlify/functions/invia-fattura-email",{method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+(tk||"")},
        body:JSON.stringify({fattura_id:id,percorso:percorso})});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.ok){
        const d=new Date(); _fm.mailUltimo={a:j.a,creato_il:d.toISOString()};
        return fine({stato:"mandato",a:j.a,ora:String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"),restano:j.restano});
      }
      if(j.codice==="senza_email") return fine({stato:"senza"});
      if(j.codice==="impresa"||j.codice==="sito"||j.codice==="quota") return fine({stato:"finita",perche:j.codice});
      return fine({stato:"errore",testo:j.error||"Riprova fra poco."});
    }catch(e){ fine({stato:"errore",testo:"Problema di rete: riprova fra poco."}); }
  }

  function fmCliente(f){
    const c=(typeof fattCliCache!=="undefined"?fattCliCache:[]).find(x=>String(x.id)===String(f.cliente_id));
    return c||{};
  }
  function fmTesto(f){
    const az=(typeof fattAzienda!=="undefined"&&fattAzienda)||{};
    const c=fattConti(f);
    const num=f.numero?("n. "+f.numero+"/"+fattAnno(f)):"";
    const cosa=(f.tipo==="nota_credito"?"la nota di credito ":"la fattura ")+num;
    const r=[];
    r.push("Buongiorno, le mando "+(f.numero?cosa.trim():"in anticipo la fattura (ancora in bozza)")+(f.data?" del "+fdate(f.data):"")+".");
    const gia=(f.stato==="emessa"&&typeof fattGia==="function")?fattGia(f,c):0;
    if(gia>0){
      r.push("Importo della fattura: "+eur2(c.daPagare)+".");
      r.push("Già ricevuti: "+eur2(gia)+". Resta da pagare: "+eur2(c.daPagare-gia)+".");
    }else r.push("Importo"+(f.stato==="pagata"?"":" da pagare")+": "+eur2(c.daPagare)+".");
    /* 19 nov 2026 (studio) — col netto nel messaggio e il totale sul PDF il
       cliente legge due numeri diversi: si dice perche' */
    /* 24 nov 2026 — ente pubblico in scissione dei pagamenti */
    if(c.scissione&&f.tipo!=="nota_credito")
      r.push("L'IVA di "+eur2(c.iva)+" la versate voi all'Erario (scissione dei pagamenti, art. 17-ter): non è compresa nell'importo.");
    if((+c.ritenuta||0)>0&&f.tipo!=="nota_credito")
      r.push("La ritenuta d'acconto di "+eur2(c.ritenuta)+" è già tolta: la versa lei all'Erario col modello F24.");
    if(f.stato!=="pagata"&&f.tipo!=="nota_credito"){
      const gg=(+az.giorni_pagamento)||30, sc=fattScadenza(f,gg), mo=fattModo(f), ib=fattIban(f);
      if(sc)r.push("Da pagare entro il "+fdate(sc)+".");
      if(mo&&(mo[0]==="bonifico"||mo[0]==="riba")&&ib){
        r.push("Bonifico su IBAN: "+ib);
        if(f.numero)r.push("Causale: fattura n. "+f.numero+"/"+fattAnno(f));
      }else if(mo){
        r.push("Pagamento: "+mo[1].replace(/ \(.*$/,"")+".");
      }
    }
    r.push("");
    r.push("Grazie."+(az.nome?"\n"+String(az.nome).trim():""));
    return r.join("\n");
  }

  function fattManda(id){
    const f=(typeof fattCache!=="undefined"?fattCache:[]).find(x=>String(x.id)===String(id));
    if(!f){toast("Fattura non trovata");return;}
    const cli=fmCliente(f);
    _fm={id:f.id,tel:cli.telefono||"",mail:cli.email||"",
         ogg:(f.numero?("Fattura n. "+f.numero+"/"+fattAnno(f)):"Fattura")+(((typeof fattAzienda!=="undefined"&&fattAzienda)||{}).nome?" — "+fattAzienda.nome:"")};
    const svg=(typeof _AIC_SVG!=="undefined"&&_AIC_SVG)||{};
    const SVG_MAIL='<svg class="aic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>';
    /* il telefono sa condividere un file? (iPhone e Android si', quasi nessun computer) */
    let puoFile=false;
    try{ puoFile=!!(navigator.canShare&&navigator.canShare({files:[new File(["x"],"x.pdf",{type:"application/pdf"})]})); }catch(e){}
    const nome=esc(f.cli_nome||cli.nome||"il cliente");

    openSheetGrande("Manda al cliente",
      '<div class="sh-cols"><div class="sh-col">'
      + '<div class="sh-b"><div class="sh-tit">Il messaggio per '+nome+'</div>'
      +   (f.stato==="bozza"?'<div class="aic-banda aic-banda--attesa" style="margin-bottom:12px"><b>Questa è ancora una bozza</b>, senza numero. Meglio emetterla prima di mandarla.</div>':'')
      +   '<div class="field"><textarea id="fm-testo" rows="10" style="min-height:240px">'+esc(fmTesto(f))+'</textarea></div>'
      +   '<div class="sh-nota">Puoi cambiarlo come vuoi prima di mandarlo.</div>'
      + '</div>'
      + '</div><div class="sh-col">'
      + '<div class="sh-b"><div class="sh-tit">Come lo mandi</div>'
      +   '<div class="aic-fila"><button type="button" class="aic-btn aic-btn--pieno" data-action="fm-mail-apri">'+SVG_MAIL+'<span>Manda l\'email col PDF</span></button></div>'
      +   '<div class="sh-nota" style="margin:8px 0 0">Parte da TrovaImpresa, col PDF già attaccato.</div>'
      +   '<div id="fm-mail"></div>'
      +   '<div class="sh-tit" style="margin-top:22px;font-size:16px">Oppure</div>'
      +   (puoFile?'<div class="aic-fila"><button type="button" class="aic-btn" data-action="fm-condividi">'+(svg.file||"")+'<span>Condividi il PDF</span></button></div>'
                  +'<div class="sh-nota" style="margin:8px 0 14px">Si apre WhatsApp o la posta con il PDF già attaccato.</div>':'')
      +   '<div class="aic-fila">'
      +     '<button type="button" class="aic-btn" data-action="fm-wa">'+(svg.wa||"")+'<span>WhatsApp</span></button>'
      +     '<button type="button" class="aic-btn" data-action="fm-mail">'+SVG_MAIL+'<span>La tua posta</span></button>'
      +   '</div>'
      +   '<div class="aic-fila aic-fila--sotto">'
      +     '<button type="button" class="aic-btn" data-action="fm-copia">'+(svg.copia||"")+'<span>Copia il messaggio</span></button>'
      +     '<button type="button" class="aic-btn" data-action="fm-pdf">'+(svg.file||"")+'<span>Scarica il PDF</span></button>'
      +   '</div>'
      +   '<div class="sh-nota" style="margin-top:14px">WhatsApp e la tua posta si aprono col messaggio già scritto. <b>Il PDF lo alleghi tu</b>: scaricalo con il pulsante qui sopra.</div>'
      +   ((!_fm.tel&&!_fm.mail)?'<div class="aic-banda aic-banda--attesa" style="margin-top:12px">Nella scheda del cliente non ci sono né telefono né email: li scegli tu quando si apre WhatsApp o la posta.</div>':'')
      + '</div>'
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    fmMailLeggi(f.id);
  }

  function fmLeggi(){ const t=document.getElementById("fm-testo"); return t?t.value:""; }

  document.addEventListener("click",async function(e){
    const t=e.target.closest&&e.target.closest("[data-action]"); if(!t||!_fm)return;
    const a=t.dataset.action;
    if(a==="fm-wa"){
      const tel=(typeof waCleanTel==="function")?waCleanTel(_fm.tel):"";
      window.open("https://wa.me/"+(tel||"")+"?text="+encodeURIComponent(fmLeggi()),"_blank","noopener");
      return;
    }
    if(a==="fm-mail"){
      const m=String(_fm.mail||"").replace(/[^A-Za-z0-9.@_+-]/g,"");
      location.href="mailto:"+m+"?subject="+encodeURIComponent(_fm.ogg)+"&body="+encodeURIComponent(fmLeggi());
      return;
    }
    if(a==="fm-copia"){
      /* prima la strada vecchia, che funziona sempre e non chiede permessi
         (lezione del 19 settembre); quella nuova solo come riserva */
      const x=document.getElementById("fm-testo"); let fatto=false;
      try{ if(x){x.focus();x.select();fatto=document.execCommand("copy");} }catch(err){}
      if(!fatto){ try{ await navigator.clipboard.writeText(fmLeggi()); fatto=true; }catch(err){} }
      toast(fatto?"Messaggio copiato ✅":"Selezionato: premi Ctrl+C per copiarlo");
      return;
    }
    if(a==="fm-pdf"){ fatturaPdf(_fm.id); return; }
    if(a==="fm-mail-apri"){
      if(!String(_fm.mail||"").trim()){ _fm.mailSt={stato:"senza"}; fmMailRidisegna(); return; }
      _fm.mailSt={stato:"conferma"}; fmMailRidisegna();
      const b=document.getElementById("fm-mail"); if(b&&b.scrollIntoView)b.scrollIntoView({block:"nearest",behavior:"smooth"});
      return;
    }
    if(a==="fm-mail-annulla"){ _fm.mailSt=null; fmMailRidisegna(); return; }
    if(a==="fm-mail-manda"){ fmMailManda(); return; }
    if(a==="fm-condividi"){
      const pdf=await fatturaPdf(_fm.id,{blob:true});
      if(!pdf||!pdf.blob)return;
      try{
        await navigator.share({files:[new File([pdf.blob],pdf.nome,{type:"application/pdf"})],title:_fm.ogg,text:fmLeggi()});
      }catch(err){
        /* AbortError = ha chiuso lui la finestra di condivisione: non e' un errore */
        if(!err||err.name!=="AbortError")toast("Non riesco a condividere il file da qui: scarica il PDF e allegalo a mano");
      }
      return;
    }
  });
