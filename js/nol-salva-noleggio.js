// [SPOSTATO] nol-salva-noleggio.js: era dentro nol-core.js, righe 3806-4061, spostato identico.

  /* due porte per il banco di prova: servono a controllare il TESTO del
     contratto senza aprire una finestra di stampa. Non le usa nessun altro. */
  window.__nolLeggiPerProva=(id)=>nolLeggi("noleggio",id);
  window.__nolContrattoPerProva=(n)=>nolContrattoDati(n);
  window.nolContrattoStampaProva=(n)=>nolContrattoStampa(n);
  window.__nolVerbalePerProva=(n,m)=>nolVerbaleDati(n,m);
  window.__nolDdtPerProva=(n,m)=>nolDdtDati(n,m);
  window.nolVerbaleStampaProva=async(n,m)=>nolDocStampa(await nolVerbaleDati(n,m));
  /* ⛔ 23 agosto: il banco bloccava cdnjs, quindi jsPDF non c'era e il PDF
     non si provava MAI — si provava solo la stampa su carta. Da questa
     porta il banco puo' scaricare il PDF vero e guardarlo. */
  window.__nolDocPdfProva=(dati)=>nolDocPdf(dati);
  window.nolDdtStampaProva=async(n,m)=>nolDocStampa(await nolDdtDati(n,m));
  window.__nolCauzionePerProva=(n,m)=>nolCauzioneDati(n,m);
  window.nolCauzioneStampaProva=async(n,m)=>nolDocStampa(await nolCauzioneDati(n,m));

  async function salvaNoleggio(id){
    const selM=$("#nn-mezzo"), selC=$("#nn-cliente");
    if(!selM.value){toast("Scegli un mezzo");return;}
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    /* ⛔ IL CONTROLLO CHE VALE. Un mezzo con la verifica periodica o
       l'assicurazione scaduta non esce di qui. Vale solo sui noleggi ancora
       aperti: uno gia' rientrato lo si deve poter correggere anche dopo. */
    const mSel=nolMezzoScelto();
    const bloccato=mSel?mezzoBloccato(mSel):null;
    const gia=$("#nn-effettivo")&&$("#nn-effettivo").value;
    if(bloccato&&!gia){
      toast("Non si può: "+(mSel.nome||"questo mezzo")+" "+bloccato);
      alert("Questo mezzo non si può noleggiare.\n\n"+(mSel.nome||"Il mezzo")+" "+bloccato+".\n\n"
           +"Apri la scheda del mezzo e mettila a posto: la data dell'ultima verifica periodica, "
           +"l'assicurazione, oppure togli la spunta «Fuori servizio».");
      return;
    }
    /* ⛔ 24 agosto 2026 — SENZA LA DATA DI USCITA NON SI SALVA.
       Al collaudo si e' creato un noleggio segnato FUORI con «Uscita — ·
       rientro previsto —» e 0,00 €: il contratto e il DDT sarebbero usciti
       senza data, e il conto non si puo' nemmeno fare. Su una prenotazione
       ancora da confermare invece la data puo' mancare: e' proprio il caso
       del «il cliente richiama venerdi». */
    if((segVal("nn-fase")||"fuori")!=="prenotato" && !$("#nn-uscita").value){
      toast("Manca la data di uscita");
      alert("Manca la data di uscita.\n\n"
        +"Un noleggio già fuori o già rientrato senza data di uscita fa uscire "
        +"il contratto e il DDT senza data, e il conto non si può fare.\n\n"
        +"Se il mezzo non è ancora partito, mettilo su «Prenotato».");
      const du=$("#nn-uscita"); if(du) du.focus();
      return;
    }

    /* ⚠️ i patentini: qui si AVVISA e basta. La dichiarazione la firma il
       cliente, e il noleggiatore non puo' rifiutarsi di scriverla. */
    const scaduti=(nolOperatori||[]).filter(o=>o.scad&&o.nome&&
      new Date(o.scad)<new Date($("#nn-uscita").value||todayStr()));
    if(scaduti.length&&segVal("nn-nolo")!=="caldo"){
      toast("Attenzione: "+scaduti.map(o=>o.nome).join(", ")+" ha il patentino scaduto");
    }
    /* ⛔ lo stesso mezzo promesso due volte: qui si CHIEDE invece di
       vietare. Capita di rientrare in anticipo, e chi noleggia lo sa lui
       se il mezzo fa in tempo. Ma non deve succedere per distrazione. */
    const dalQ=$("#nn-uscita").value, alQ=$("#nn-prevista").value;
    const altri=await nolSovrapposti(selM.value,dalQ,alQ,id);
    if(altri.length){
      const elenco=altri.map(x=>"· "+(x.cliente||"un altro cliente")+", dal "+fdate(x.data_uscita)+
        (x.data_rientro_prevista?" al "+fdate(x.data_rientro_prevista):" (senza rientro previsto)")).join("\n");
      if(!confirm("Questo mezzo è già impegnato in quei giorni:\n\n"+elenco+
                  "\n\nSalvare lo stesso?")) return;
    }
    const nomeM=selM.selectedOptions[0]?selM.selectedOptions[0].dataset.nome:"";
    const nomeC=selC.selectedOptions[0]?selC.selectedOptions[0].dataset.nome:"";
    const conto=nolCalcolaOra();

    /* ⛔ 24 agosto 2026 — l'ultimo controllo, quello sui soldi.
       Se quello che si fa pagare non e' quello che dice il conto, si chiede
       prima di salvare. Al collaudo un escavatore rientrato due giorni
       prima stava andando in fattura a 630 € invece di 480. */
    if(conto&&conto.totaleEuro>0){
      const impS=_numIt($("#nn-importo").value);
      const totS=_cent(conto.totaleEuro);
      if(Math.abs(impS-totS)>=0.005){
        const d=_cent(impS-totS);
        if(!confirm("Stai facendo pagare "+_eur(impS)+", ma il conto dice "+_eur(totS)+".\n\n"
          +"Sono "+_eur(Math.abs(d))+(d>0?" in più":" in meno")+".\n\nVa bene così?")) return;
      }
    }

    const vuoto=id2=>$(id2).value===""?null:_numIt($(id2).value);
    const dati={mezzo:nomeM||null, mezzo_id:selM.value||null,
      cliente:nomeC||null, cliente_id:selC.value||null,
      /* ⛔ 24 agosto 2026 — reparto facoltativo: vuoto = cliente esterno,
         scelto = noleggio interno, conta come spesa nel riepilogo di quel reparto */
      mestiere_id:($("#nn-reparto")&&$("#nn-reparto").value)||null,
      luogo:$("#nn-luogo")?($("#nn-luogo").value.trim()||null):null,
      data_uscita:$("#nn-uscita").value||null,
      data_rientro_prevista:$("#nn-prevista").value||null,
      data_rientro_effettivo:$("#nn-effettivo").value||null,
      ora_uscita:$("#nn-ora-uscita").value||null,
      ora_rientro:$("#nn-ora-rientro").value||null,
      contaore_uscita:vuoto("#nn-contaore-usc"), contaore_rientro:vuoto("#nn-contaore-rie"),
      km_uscita:vuoto("#nn-km-usc"), km_rientro:vuoto("#nn-km-rie"),
      consumi:nolLeggiConsumi(),
      /* ⚠️ il conto si salva riga per riga: fra sei mesi le tariffe saranno
         cambiate, e a un cliente che contesta si risponde col conto DI ALLORA. */
      dettaglio_prezzo:conto?{giorni:conto.giorni,righe:conto.righe,totale:conto.totaleEuro,avvisi:conto.avvisi}:null,
      importo_calcolato:conto?conto.totaleEuro:null,
      importo:_numIt($("#nn-importo").value),
      cauzione:_numIt($("#nn-cauzione").value),
      stato_pagamento:$("#nn-pagamento").value,
      danni:$("#nn-danni").value.trim()||null,
      note:$("#nn-note").value.trim()||null,
      /* il contratto: chi usera' la macchina e come e' uscita */
      fase:segVal("nn-fase")||"fuori",
      prenotazione_nota:$("#nn-prenota-nota")?($("#nn-prenota-nota").value.trim()||null):null,
      tipo_nolo:segVal("nn-nolo")||"freddo",
      contratto_num:$("#nn-cnum")?($("#nn-cnum").value.trim()||null):null,
      contratto_data:$("#nn-cdata")?($("#nn-cdata").value||null):null,
      operatori:nolLeggiOperatori(),
      stato_consegna:$("#nn-stato-cons")?($("#nn-stato-cons").value.trim()||null):null,
      stato_rientro:$("#nn-stato-rie")?($("#nn-stato-rie").value.trim()||null):null,
      /* ── le firme del contratto ── (23 agosto 2026)
         ⛔ la seconda firma non e' un doppione: senza quella, le clausole 6
         e 8 (danni e ritardo) non sono opponibili al cliente. */
      firma_contr_img:firmeVal["contr"]||null,
      firma_contr2_img:firmeVal["contr2"]||null,
      firma_contr_nome:$("#nn-firma-nome")?($("#nn-firma-nome").value.trim()||null):null,
      firma_contr_il:firmeVal["contr"]
        ? ((nolCauApert&&nolCauApert.firma_contr_il)||new Date().toISOString()) : null};
    /* ── la cauzione ── (23 agosto 2026)
       Lo stato non si chiede: si ricava. Zero euro = nessuna cauzione;
       spuntata «chiusa» = svincolata; tutto il resto = ce l'hai in mano. */
    const cauImp=_numIt($("#nn-cauzione").value);
    const cauChiusa=$("#nn-cau-chiusa")&&$("#nn-cau-chiusa").checked;
    Object.assign(dati,{
      cauzione_forma:$("#nn-cau-forma")?($("#nn-cau-forma").value||null):null,
      cauzione_rif:$("#nn-cau-rif")?($("#nn-cau-rif").value.trim()||null):null,
      cauzione_ricevuta_il:$("#nn-cau-data")?($("#nn-cau-data").value||null):null,
      cauzione_stato:cauImp<=0?"nessuna":(cauChiusa?"svincolata":"in_deposito"),
      cauzione_svincolata_il:cauChiusa&&$("#nn-cau-svin-data")?($("#nn-cau-svin-data").value||todayStr()):null,
      cauzione_trattenuta:$("#nn-cau-tratt")&&$("#nn-cau-tratt").value!==""?_numIt($("#nn-cau-tratt").value):null,
      cauzione_restituita:$("#nn-cau-rest")&&$("#nn-cau-rest").value!==""?_numIt($("#nn-cau-rest").value):null,
      cauzione_motivo:$("#nn-cau-motivo")?($("#nn-cau-motivo").value.trim()||null):null});
    /* ⚠️ chiudere una cauzione senza dire quanto e' tornato indietro vuol
       dire non poter rispondere, fra un anno, a chi te lo chiede. */
    if(cauChiusa&&($("#nn-cau-rest")&&$("#nn-cau-rest").value==="")&&
       ($("#nn-cau-tratt")&&$("#nn-cau-tratt").value==="")){
      if(!confirm("Stai chiudendo la cauzione senza scrivere quanto hai restituito.\n\nSalvare lo stesso?")) return;
    }
    const scrivi=(d)=>id
      ? sb.from("nol_noleggi").update(d).eq("id",id).eq("user_id",sbUid)
      : sb.from("nol_noleggi").insert({user_id:sbUid,...d});
    let {error}=await scrivi(dati);
    /* rete di salvataggio: se sql/noleggio-contratto.sql non e' ancora
       passato, il noleggio si salva lo stesso senza le colonne nuove
       invece di andare perso */
    if(error&&/tipo_nolo|contratto_num|contratto_data|operatori|stato_consegna|stato_rientro|fase|prenotazione_nota|cauzione_|firma_contr/i.test(error.message||"")
            &&/column|schema cache/i.test(error.message||"")){
      const senza={...dati};
      ["tipo_nolo","contratto_num","contratto_data","operatori","stato_consegna","stato_rientro",
       "fase","prenotazione_nota",
       "cauzione_forma","cauzione_rif","cauzione_ricevuta_il","cauzione_stato",
       "cauzione_svincolata_il","cauzione_trattenuta","cauzione_restituita","cauzione_motivo",
       "firma_contr_img","firma_contr2_img","firma_contr_nome","firma_contr_il"
      ].forEach(k=>delete senza[k]);
      ({error}=await scrivi(senza));
      if(!error) toast("Salvato, ma non tutto: mancano le query SQL del contratto o delle cauzioni");
    }
    if(error){toast("Errore: "+error.message);return;}
    closeSheet(); loadNoleggi(); loadCauzioni(); renderRiepilogoNegozio(); toast(id?"Noleggio aggiornato ✔":"Noleggio aggiunto ✔");
  }

  $('[data-tab="mezzi"]')?.addEventListener("click",loadMezzi);
  /* ⛔ tolto il quinto ascoltatore morto (.mezzo-edit): cercava pulsanti che
     sulla riga non ci sono piu' e cancellava senza controllare user_id. */

  /* ⛔ 23 agosto 2026 — UN SOLO ELENCO CLIENTI.
     Fino a oggi il noleggio aveva i suoi clienti in «nol_clienti» e il
     gestionale imprese i suoi in «gest_clienti»: chi noleggiava a Rossi ce
     l'aveva scritto due volte, e cambiandogli il telefono lo cambiava in un
     posto solo. Deciso da Alessio: si uniscono. Adesso il noleggio legge e
     scrive «gest_clienti», come tutto il resto (sql/clienti-uno-solo.sql).

     ⚠️ QUI NON SI FILTRA PER REPARTO, e non e' una dimenticanza: il
     gestionale imprese tiene i clienti divisi per reparto apposta, ma per
     chi noleggia un cliente e' un cliente, di qualunque reparto sia. Un
     cliente nuovo creato da qui nasce nel reparto in cui stai. */
  async function loadClientiNol(){
    if(!(sb&&sbUid)) return;
    const {data}=await sb.from("gest_clienti")
      .select("id,nome,telefono,email,indirizzo,piva,note").eq("user_id",sbUid).order("nome");
    const c=data||[], box=$("#clienti-nol-body");
    if(!box) return;
    if(!c.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun cliente. Aggiungine uno.</p>';return;}
    box.innerHTML=c.map(x=>
      nolCard({col:"#1565c0",
        titolo:esc(x.nome||"—"),
        corpo:`<div class="sub">${esc([x.telefono?"☎ "+x.telefono:"",x.email||"",x.piva?"P.IVA "+x.piva:""].filter(Boolean).join(" · "))||""}</div>
        ${x.indirizzo?`<div class="sub2">${esc(x.indirizzo)}</div>`:""}
        ${x.note?`<div class="sub2">${esc(x.note)}</div>`:""}`,
        pulsanti:nolPulsanti("cliente",x.id)})).join("");
  }
  $('[data-tab="clienti-nol"]')?.addEventListener("click",loadClientiNol);
  async function popolaSelectNoleggi(){
    if(!(sb&&sbUid)) return;
    /* ⚠️ nella casellina ci va l'ID, non il nome. Prima ci andava il nome, e
       bastava rinominare un mezzo perche' i noleggi vecchi perdessero il
       collegamento — e senza collegamento il conto non si puo' piu' rifare.
       Il nome si porta dietro lo stesso, per le schermate e per lo storico. */
    const {data:mz}=await sb.from("gest_mezzi").select("*").eq("user_id",sbUid).eq("noleggiabile",true).order("nome");
    const {data:cl}=await sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).order("nome");
    /* 24 agosto 2026 — i reparti veri, per la casella "Per un tuo reparto":
       gli stessi che vede il gestionale imprese (gest_mestieri), nessuno
       escluso. Chi non ne ha (un solo mestiere) non vede mai la scelta. */
    const {data:mestieri}=await sb.from("gest_mestieri").select("id,nome").eq("user_id",sbUid).is("eliminato_il",null).order("ordine");
    nolMezzi=mz||[]; nolMestieri=mestieri||[];
    const selM=$("#nn-mezzo"), selC=$("#nn-cliente"), selR=$("#nn-reparto");
    if(selM)selM.innerHTML='<option value="">— Seleziona mezzo —</option>'+nolMezzi.map(x=>`<option value="${x.id}" data-nome="${esc(x.nome||"")}">${esc(x.nome||"")}</option>`).join("");
    if(selC)selC.innerHTML='<option value="">— Seleziona cliente —</option>'+(cl||[]).map(x=>`<option value="${x.id}" data-nome="${esc(x.nome||"")}">${esc(x.nome||"")}</option>`).join("");
    if(selR)selR.innerHTML='<option value="">— nessuno: è un cliente esterno —</option>'+(mestieri||[]).map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join("");
  }
  async function loadNoleggi(){
    if(!(sb&&sbUid)) return;
    await popolaSelectNoleggi();
    const {data}=await sb.from("nol_noleggi").select("*").eq("user_id",sbUid).order("data_uscita",{ascending:false});
    const n=data||[], box=$("#noleggi-body"), oggi=new Date().toISOString().slice(0,10);
    if(!box) return;
    if(!n.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun noleggio.</p>';return;}
    box.innerHTML=n.map(x=>{
      let col,et;
      const fase=nolFaseDi(x);
      if(fase==="rientrato"){col="#2e7d32";et="RIENTRATO";}
      else if(fase==="prenotato"){col=FASE_ETI.prenotato.c;et="PRENOTATO";}
      else if(x.data_rientro_prevista&&x.data_rientro_prevista<oggi){col="#c62828";et="IN RITARDO";}
      else {col="#e65100";et="FUORI";}
      /* i giorni di ritardo scritti in chiaro: e' la prima cosa che guarda
         chi noleggia, e non deve contarli a mente sul calendario */
      const rit=(et==="IN RITARDO")?Math.round((new Date(oggi)-new Date(x.data_rientro_prevista))/86400000):0;
      const manca=(fase==="prenotato"&&x.data_uscita)?Math.round((new Date(x.data_uscita)-new Date(oggi))/86400000):0;
      /* ⛔ 24 agosto 2026 — noleggio interno: se e' taggato a un reparto,
         una piccola etichetta lo dice subito, senza aprire la scheda */
      const repNome=x.mestiere_id?((nolMestieri.find(m=>m.id===x.mestiere_id)||{}).nome||""):"";
      return nolCard({col:col,
        titolo:esc(x.mezzo||"—"),
        eti:[{t:esc(et)+(rit?esc(" · "+rit+(rit===1?" giorno":" giorni")):"")+(manca>0?esc(" · fra "+manca+(manca===1?" giorno":" giorni")):"")},
             repNome?{t:"🏷 "+esc(repNome),col:"#546e7a"}:null],
        corpo:`<div class="sub">${x.cliente?"Cliente: "+esc(x.cliente):"Cliente non indicato"}</div>
        <div class="sub2">${esc("Uscita "+fdate(x.data_uscita)+" · rientro previsto "+fdate(x.data_rientro_prevista)+(x.data_rientro_effettivo?" · rientrato il "+fdate(x.data_rientro_effettivo):""))}</div>
        <div class="sub2">${esc(_eur(x.importo)+(x.cauzione?" · cauzione "+_eur(x.cauzione)+
          (cauStatoDi(x)==="svincolata"?" (svincolata)":(cauDaSvincolare(x)?" DA SVINCOLARE":"")):"")+
          " · "+(x.stato_pagamento==="pagato"?"pagato":"da pagare")+(x.danni?" · danni: "+x.danni:""))}</div>`,
        pulsanti:nolPulsanti("noleggio",x.id)});
    }).join("");
  }
  $('[data-tab="noleggi"]')?.addEventListener("click",()=>{loadNoleggi().then(nolAggiornaConto);});
  /* ⛔ tolto il sesto ascoltatore morto (.clinol-edit): cercava pulsanti che
     non ci sono piu', cancellava senza controllare user_id, e dal 23 agosto
     avrebbe pure guardato nella tabella sbagliata. */
