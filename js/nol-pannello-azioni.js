// [SPOSTATO] nol-pannello-azioni.js: era dentro nol-core.js, righe 5992-6215, spostato identico.

  /* ⛔ 22 agosto 2026 — LA FRECCIA IN CIMA A OGNI SCHEDA.
     Si mette QUI, dentro openSheet, e non su una scheda per volta: cosi' ce
     l'hanno tutte, anche quelle che nasceranno domani, e non si puo'
     dimenticarla. Alessio l'ha dovuta chiedere piu' di una volta perche'
     "Annulla" sta in fondo e su una scheda lunga non si vede. */
  /* ================================================================
     ⛔ 29 agosto 2026 — LA FINESTRA UGUALE IN TUTTI I GESTIONALI.
     Alessio, dal test vero del negozio: «non c'e' la freccia per tornare
     indietro… la voglio come e' su tutti i gestionali».
     Qui c'era solo una freccina appiccicata in cima: niente testata col
     titolo, niente piede fermo, e i pulsanti in mezzo alla pagina.
     Adesso questa funzione fa quello che fa openSheetGrande nel negozio
     (copiata riga per riga da gestionale-negozio.html): prende lo STESSO
     html di prima e se lo divide da sola — il primo <h3> diventa la
     testata, il <div class="sheet-actions"> il piede, e in mezzo resta il
     corpo che scorre. Cosi' tutte e ventitre le finestre del noleggio si
     rivestono insieme, senza toccarle una per una.
     ================================================================ */
  const _ICO_INDIETRO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
  const _BTN_INDIETRO='<button class="sh-back" data-action="close" title="Torna indietro" aria-label="Torna indietro">'+_ICO_INDIETRO+'<span>Indietro</span></button>';
  /* l'altezza vera della barra del fondatore, misurata: con lo zoom del
     noleggio non e' 46 px, e il piede col Salva finirebbe fuori schermo */
  function _misuraBarra(){
    const b=document.querySelector("#ti-fondatore");
    if(!b)return;
    const h=Math.round(b.getBoundingClientRect().height/(parseFloat(getComputedStyle(document.body).zoom)||1));
    if(h>0)document.documentElement.style.setProperty("--barra-h",h+"px");
  }
  addEventListener("resize",_misuraBarra);
  function openSheet(html){
    _misuraBarra();
    const s=$("#sheet"), tmp=document.createElement("div");
    tmp.innerHTML=html;
    const h3=tmp.querySelector("h3");
    const titolo=h3?h3.innerHTML:"";
    if(h3)h3.parentNode.removeChild(h3);
    const foot=tmp.querySelector(".sheet-actions");
    const azioni=foot?foot.innerHTML:"";
    if(foot)foot.parentNode.removeChild(foot);
    s.className="sheet sheet--grande";
    /* se dentro c'e' un modulo a colonne, la finestra prende tutto lo schermo */
    if(tmp.querySelector(".sh-cols,.nol-due,.nol-riq")) s.classList.add("sh-lunga");
    s.innerHTML='<div class="sh-head">'+_BTN_INDIETRO+'<h3>'+titolo+'</h3></div>'+
      '<div class="sh-body">'+tmp.innerHTML+'</div>'+
      (azioni?'<div class="sh-foot">'+azioni+'</div>':'');
    $("#overlay").classList.add("open");
    $("#overlay").scrollTop=0;
    if(typeof _sistemaNumeri==="function")_sistemaNumeri(s);
    const b=s.querySelector(".sh-body");
    if(b){b.scrollTop=0;requestAnimationFrame(function(){b.scrollTop=0;});setTimeout(function(){b.scrollTop=0;},80);}
  }
  function closeSheet(){$("#overlay").classList.remove("open");}
  $("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeSheet();});

  document.addEventListener("click",async e=>{
    const t=e.target.closest("[data-action]");if(!t)return;
    const a=t.dataset.action,id=t.dataset.id;
    if(a==="enter")return enterPanel(t.dataset.p);
    if(a==="new-panel")return panelForm();
    if(a==="save-panel")return savePanel();
    if(a==="del-panel")return delPanel(t.dataset.id);
    if(a==="home")return nolIndietro();
    /* 22 agosto 2026 — le schede del noleggio */
    /* 14 settembre 2026 — i promemoria */
    if(a==="new-prom")      return promForm(null);
    if(a==="edit-prom")     return promForm(promCache.find(x=>String(x.id)===String(id)));
    if(a==="save-prom")     return salvaPromemoria(id||null);
    if(a==="prom-stato")    return promStato(id,t.dataset.v);
    if(a==="del-prom")      return promButta(id);
    if(a==="prom-vista"){promVista=t.dataset.v;return renderPromemoria();}
    if(a==="new-mezzo")     return schedaMezzo(null);
    if(a==="new-clinol")    return schedaClienteNol(null);
    if(a==="new-noleggio")  return schedaNoleggio(null);
    if(a==="save-mezzo")    return salvaMezzo(id);
    if(a==="save-clinol")   return salvaClienteNol(id);
    if(a==="save-noleggio") return salvaNoleggio(id);
    if(a==="new-prod")      return schedaProdotto(null);
    if(a==="new-forn")      return schedaFornitore(null);
    if(a==="new-mov")       return schedaMovimento(null);
    if(a==="save-prod")     return salvaProdotto(id);
    if(a==="save-forn")     return salvaFornitore(id);
    if(a==="save-mov")      return salvaMovimento(id);
    if(a==="save-mag")      return salvaMagazzino(id);
    if(a==="save-fatt")     return salvaFattura(id);
    if(a==="nol-contr-stampa"||a==="nol-contr-pdf"){
      const d=await nolLeggi("noleggio",t.dataset.id);
      if(!d){toast("Salva prima il noleggio, poi stampa il contratto");return;}
      return a==="nol-contr-pdf"?nolContrattoPdf(d):nolContrattoStampa(d);
    }
    /* la ricevuta della cauzione e la quietanza di svincolo */
    if(a==="nol-cauz-stampa") return cauzioneFoglio(t.dataset.id,t.dataset.m,false);
    if(a==="nol-cauz-pdf")    return cauzioneFoglio(t.dataset.id,t.dataset.m,true);
    if(a==="cau-filtro"){
      cauFiltro=t.dataset.v;
      $$("#cau-filtro .chip").forEach(x=>x.classList.toggle("on",x.dataset.v===cauFiltro));
      return loadCauzioni();
    }
    if(a==="rend-esporta")  return rendEsporta();
    if(a==="nol-esporta")   return nolEsporta(t.dataset.s);
    /* le fatture del noleggio */
    if(a==="new-fattnol")   return schedaFatturaNol(null);
    if(a==="save-fattnol")  return salvaFatturaNol(id);
    if(a==="fattnol-trova") return fattnolTrova();
    if(a==="fattnol-stampa")return fatturaNolFoglio(t.dataset.id,false);
    if(a==="fattnol-pdf")   return fatturaNolFoglio(t.dataset.id,true);
    if(a==="save-docs")     return salvaDocumenti(id);
    if(a==="verb-stampa")   return verbaleFoglio(t.dataset.m,false);
    if(a==="verb-pdf")      return verbaleFoglio(t.dataset.m,true);
    if(a==="ddt-stampa")    return ddtFoglio(t.dataset.m,false);
    if(a==="ddt-pdf")       return ddtFoglio(t.dataset.m,true);
    if(a==="doc-add")       return docChiedi(t.dataset.t,t.dataset.id);
    if(a==="doc-vedi")      return docVedi(t.dataset.id);
    if(a==="doc-elim")      return docElimina(t.dataset.id);
    if(a==="media-add")     return mediaChiedi(t.dataset.m,t.dataset.g);
    /* la videocamera dentro il gestionale */
    if(a==="media-reg")     return regApri(t.dataset.m);
    if(a==="reg-avvia")     return regAvvia();
    if(a==="reg-ferma")     return regFerma();
    if(a==="reg-usa")       return regUsa();
    if(a==="reg-rifai")     return regRifai();
    if(a==="reg-chiudi")    return regChiudi();
    if(a==="media-vedi")    return mediaVedi(t.dataset.id);
    if(a==="media-elim")    return mediaElimina(t.dataset.id);
    if(a==="cest-apri")     return schedaCestino(+t.dataset.i);
    if(a==="cest-su")       return cestRimetti(+t.dataset.i);
    if(a==="cest-mai")      return cestPerSempre(+t.dataset.i);
    /* il meno e il piu' della giacenza: cambiano solo la casella, si scrive
       sul database quando si preme Salva. Cosi' «Annulla» annulla davvero. */
    if(a==="mag-meno"||a==="mag-piu"){
      const c=$("#ng-quantita"); if(!c) return;
      const n=_numIt(c.value)+(a==="mag-piu"?1:-1);
      c.value=String(Math.max(0,n)).replace(".",",");
      return;
    }
    if(a==="reparti")return goHome();
    if(a==="azienda")return aziendaForm();
    if(a==="save-azienda")return saveAzienda();
    if(a==="pdf")return generaPdf(id);
    if(a==="map"){window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(t.dataset.q),"_blank");return;}
    if(a==="new-job")return jobForm(null,"",null,true);
    /* 6 agosto 2026: il pulsante grande porta al modulo del noleggio,
       con il mezzo già pronto da scegliere. */
    /* ⛔ 29 agosto 2026 - IL PULSANTE IN ALTO NON APRIVA NIENTE. Cercava
       #nn-mezzo in cima alla sezione, dov'era il modulo PRIMA che diventasse
       una finestra: da allora non lo trovava piu' e il pulsante piu' in vista
       del noleggio sembrava morto. Adesso apre la scheda, come quello dentro
       la sezione Noleggi. */
    if(a==="new-nol"){
      $$("nav.tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="noleggi"));
      $$("section").forEach(s=>s.classList.toggle("active",s.id==="noleggi"));
      window.scrollTo({top:0,behavior:"smooth"});
      return schedaNoleggio(null);
    }
    if(a==="lf-open")return showLavoroFoto(t.dataset.id,t.dataset.desc);
    if(a==="lf-back"){$$("nav.tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="lavori"));$$("section").forEach(s=>s.classList.toggle("active",s.id==="lavori"));renderJobs();window.scrollTo(0,0);return;}
    if(a==="new-fattura")return jobForm(null,"",null,true,true);
    if(a==="new-job-date"){closeSheet();return jobForm(null,t.dataset.d,null,true);}
    if(a==="edit-job"){closeSheet();return jobForm(db().lavori.find(l=>l.id===id));}
    if(a==="save-job")return saveJob();
    if(a==="view-foto"){const src=fotoCache[t.dataset.id];if(src){$("#lb-img").src=src;$("#lightbox").classList.add("open");}return;}
    if(a==="close-lb"){$("#lightbox").classList.remove("open");return;}
    if(a==="del-foto"){if(confirm("Eliminare questa foto?"))deleteFoto(t.dataset.id);return;}
    if(a==="gal-tipo"){galFilter.tipo=t.dataset.v;$$("#gal-tipo .chip").forEach(x=>x.classList.toggle("on",x.dataset.v===t.dataset.v));renderGalleria();return;}
    if(a==="gal-op"){galFilter.op=t.dataset.v;renderGalleria();return;}
    if(a==="ag-op"){agFilter.op=t.dataset.v;renderAgenda();return;}
    if(a==="ag-stato"){agFilter.stato=t.dataset.v;$$("#ag-stato .chip").forEach(x=>x.classList.toggle("on",x.dataset.v===t.dataset.v));renderAgenda();return;}
    if(a==="del-job"){if(gconfirm("Eliminare questo lavoro?")){db().lavori=db().lavori.filter(l=>l.id!==id);await save();renderAll();toast("Lavoro eliminato");}return;}
    if(a==="stato"){const l=db().lavori.find(x=>x.id===id);l.stato=t.dataset.v;if(l.stato==="fatto"&&!l.dataFatto)l.dataFatto=l.dataPrevista||todayStr();await save();renderAll();toast("Stato: "+statoLabel[l.stato]);return;}
    if(a==="stato-supa"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v, dp=t.dataset.dp||"";
      const {error}=await sb.from("gest_lavori").update({stato:v,data_fatto:v==="fatto"?(dp||todayStr()):null}).eq("id",id).eq("user_id",sbUid);
      if(error){toast("Errore: "+error.message);return;}
      renderJobs();toast("Stato: "+(statoLabel[v]||v));return;
    }
    if(a==="fatt"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v;
      const {error}=await sb.from("gest_lavori").update({fatt_stato:v}).eq("id",id).eq("user_id",sbUid);
      if(error){toast("Errore: "+error.message);return;}
      renderFatture();toast(v==="pagata"?"Fattura pagata ✅":v==="emessa"?"Fattura emessa 📄":"Aggiornato");return;
    }
    if(a==="upload-fattura")return chiediFatturaPdf(id);
    if(a==="open-fattura")return apriFatturaPdf(id);
    if(a==="open-day")return openDay(t.dataset.d);
    if(a==="save-note"){const ds=t.dataset.d,v=$("#day-note").value.trim();if(v)db().note[ds]=v;else delete db().note[ds];await save();closeSheet();renderCal();toast("Nota salvata 📌");return;}
    if(a==="cal-prev"){cal.setMonth(cal.getMonth()-1);renderCal();return;}
    if(a==="cal-next"){cal.setMonth(cal.getMonth()+1);renderCal();return;}
    if(a==="cal-today"){cal=new Date();renderCal();return;}
    if(a==="new-cli")return cliForm(null);
    if(a==="edit-cli")return cliForm(cliCache.find(c=>c.id===id));
    if(a==="save-cli")return saveCli(id);
    if(a==="del-cli"){if(!sbUid){toast("Devi essere loggato");return;}const n=db().lavori.filter(l=>l.clienteId===id).length;if(gconfirm(n?`Questo condominio ha ${n} lavori collegati. Eliminarlo comunque?`:"Eliminare questo condominio?")){const {error}=await sb.from("gest_clienti").delete().eq("id",id).eq("user_id",sbUid);if(error){toast("Errore: "+error.message);return;}renderClienti();toast("Condominio eliminato");}return;}
    if(a==="new-scad")return scadForm(null);
    if(a==="edit-scad")return scadForm(scadCache.find(s=>s.id===id));
    if(a==="save-scad")return saveScad(id);
    if(a==="scad-stato"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v;
      const {error}=await sb.from("gest_scadenze").update({stato:v}).eq("id",id).eq("user_id",sbUid);
      if(error){toast("Errore: "+error.message);return;}
      renderScadenze();toast(v==="fatta"?"Scadenza completata ✔":"Riaperta");return;
    }
    if(a==="del-scad"){if(!sbUid){toast("Devi essere loggato");return;}if(gconfirm("Eliminare questa scadenza?")){const {error}=await sb.from("gest_scadenze").delete().eq("id",id).eq("user_id",sbUid);if(error){toast("Errore: "+error.message);return;}renderScadenze();toast("Scadenza eliminata");}return;}
    if(a==="new-dip")return squadraForm();
    if(a==="sq-add")return squadraAdd();
    if(a==="sq-edit")return squadraForm(dipCache.find(d=>d.id===id));
    if(a==="sq-save")return squadraSave(id);
    if(a==="sq-copy"){copyLink(t.dataset.link);return;}
    if(a==="sq-wa"){window.open(t.dataset.wa,"_blank");return;}
    if(a==="sq-revoca"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      if(!gconfirm("Rimuovere l'accesso a "+t.dataset.nome+"? Non potrà più entrare nel gestionale."))return;
      const {error}=await sb.from("gest_membri").update({stato:"revocato"}).eq("operatore_id",id).eq("impresa_id",sbUid);
      if(error){toast("Errore: "+error.message);return;}
      renderDip();toast("Accesso rimosso");return;
    }
    if(a==="edit-dip")return dipForm(db().dipendenti.find(d=>d.id===id));
    if(a==="save-dip")return saveDip(id);
    if(a==="del-dip"){if(confirm("Eliminare questa persona?")){db().dipendenti=db().dipendenti.filter(d=>d.id!==id);await save();renderAll();toast("Persona eliminata");}return;}
    if(a==="quick-cli")return cliForm(null);
    if(a==="close")return closeSheet();
  });
