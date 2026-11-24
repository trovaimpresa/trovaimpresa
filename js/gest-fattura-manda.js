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
      +   (puoFile?'<div class="aic-fila"><button type="button" class="aic-btn aic-btn--pieno" data-action="fm-condividi">'+(svg.file||"")+'<span>Condividi il PDF</span></button></div>'
                  +'<div class="sh-nota" style="margin:8px 0 14px">Si apre WhatsApp o la posta con il PDF già attaccato.</div>':'')
      +   '<div class="aic-fila">'
      +     '<button type="button" class="aic-btn'+(puoFile?'':' aic-btn--pieno')+'" data-action="fm-wa">'+(svg.wa||"")+'<span>WhatsApp</span></button>'
      +     '<button type="button" class="aic-btn" data-action="fm-mail">'+SVG_MAIL+'<span>Email</span></button>'
      +   '</div>'
      +   '<div class="aic-fila aic-fila--sotto">'
      +     '<button type="button" class="aic-btn" data-action="fm-copia">'+(svg.copia||"")+'<span>Copia il messaggio</span></button>'
      +     '<button type="button" class="aic-btn" data-action="fm-pdf">'+(svg.file||"")+'<span>Scarica il PDF</span></button>'
      +   '</div>'
      +   '<div class="sh-nota" style="margin-top:14px">WhatsApp ed Email si aprono col messaggio già scritto. <b>Il PDF lo alleghi tu</b>: scaricalo con il pulsante qui sopra.</div>'
      +   ((!_fm.tel&&!_fm.mail)?'<div class="aic-banda aic-banda--attesa" style="margin-top:12px">Nella scheda del cliente non ci sono né telefono né email: li scegli tu quando si apre WhatsApp o la posta.</div>':'')
      + '</div>'
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
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
