// [SPOSTATO] gest-finestre-eventi.js: era dentro gest-core.js, righe 11564-12571, spostato identico.
  /* ⛔ 21 agosto 2026 — SE UN PEZZO NON ARRIVA, IL GESTIONALE LO DICE.
     Da quando le sezioni pesanti stanno in quattro file esterni
     (js/gest-fatture.js · js/gest-computo.js · js/gest-sal-prezzario.js ·
     js/gest-computo-pdf.js, caricati alle righe 502-505), questa tabella era
     l'UNICO punto del blocco che li nominava subito, appena letta la pagina.
     Se uno dei quattro non arrivava — rete di cantiere, un 503 di Netlify —
     la riga lanciava ReferenceError e da li' in giu' NON veniva eseguito piu'
     niente: la pagina iniziale si disegnava lo stesso (load e' altrove) e poi
     nessuna scheda si apriva piu'. Nessun messaggio, nessun errore visibile.
     Provato davvero, con un 503 finto su js/gest-computo.js.
     ⚠️ Adesso il nome si cerca a runtime: se manca, la pagina lo dice in cima
     e quella singola scheda spiega cosa fare, invece di restare muta.
     ⚠️ Chi sposta una funzione di sezione in un altro file non deve fare
     niente qui: basta che resti una funzione di primo livello. */
  var _pezziMancanti=[];
  function _rt(nome){
    var f=window[nome];
    if(typeof f==="function")return f;
    _pezziMancanti.push(nome);
    return function(){
      if(typeof toast==="function")
        toast("⚠️ Questa parte non si è caricata. Ricarica la pagina (F5).");
    };
  }
  const RENDER_TAB={
    riepilogo:_rt("renderRiepilogo"), lavori:_rt("renderJobs"), preventivi:_rt("renderPreventivi"), computi:_rt("renderComputi"),
    prezzario:_rt("renderPrezzario"), sal:_rt("renderSalTutti"),
    fatture:_rt("renderFatture"), calendario:_rt("renderCal"), agenda:_rt("renderAgenda"),
    mezzi:_rt("renderMezzi"), attrezzature:_rt("renderAttrezzature"), squadra:_rt("renderDip"),
    carte:_rt("renderCarte"), clienti:_rt("renderClienti"), scadenzario:_rt("renderScadenze"), crediti:_rt("renderCrediti"), cestino:_rt("renderCestino"),
    report:_rt("renderReport"), galleria:_rt("renderGalleria"), mappa:_rt("renderMappa"),
    richieste:_rt("renderRichieste"), dalsito:_rt("renderDalSito"), fornitori:_rt("renderFornitori"),
    assistenza:_rt("renderAssistenza"),
    promemoria:_rt("renderPromemoria"), giornate:_rt("renderGiornate"), fisco:_rt("renderFisco")
  };
  /* l'avviso in cima: si vede subito, senza aspettare che clicchi la scheda
     rotta. Scritto con il DOM nudo apposta — se manca un pezzo non e' il
     momento di dipendere da altre funzioni del gestionale. */
  if(_pezziMancanti.length){
    try{
      var _av=document.createElement("div");
      _av.setAttribute("role","alert");
      _av.style.cssText="position:fixed;left:0;right:0;top:0;z-index:99999;background:#8a1c1c;color:#fff;"
        +"font:600 15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:12px 16px;text-align:center";
      _av.textContent="Una parte del gestionale non si è caricata. Ricarica la pagina (F5). "
        +"Se il problema resta, controlla la connessione.";
      document.body.appendChild(_av);
      console.error("[gestionale] pezzi non caricati:",_pezziMancanti.join(", "));
    }catch(e){}
  }
  /* ============================================================
     INVIO E BARRA SPAZIATRICE — 6 settembre 2026
     ============================================================
     Tutto il gestionale si comanda con data-action e un ascoltatore del
     CLIC. Un <button> o un <a> risponde al tasto Invio da solo, perche' il
     browser gli manda un clic finto: un <div> no, mai. Percio' una scheda
     scritta come <div data-action=...> si puo' guardare ma non aprire.
     Questo ascoltatore fa la stessa cosa che fa il browser coi bottoni:
     su Invio o barra spaziatrice manda un clic vero all'elemento.
     ⚠️ Salta i comandi VERI (button, a, input, select, textarea): li' ci
     pensa gia' il browser, e chiamare click() li' vorrebbe dire farlo due
     volte. E salta chi non e' raggiungibile da tastiera, che senza
     tabindex non prende mai il fuoco: percio' accendere una scheda vuol
     dire aggiungerle tabindex="0" e role="button", come per .panel-card.
     ⛔ preventDefault sulla barra spaziatrice: se no la pagina scorre
     mentre apri, e sembra che sia successo altro. */
  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" "&&e.key!=="Spacebar")return;
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    const t=e.target&&e.target.closest?e.target.closest("[data-action]"):null;
    if(!t)return;
    if(/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(t.tagName))return;
    e.preventDefault();
    t.click();
  });

  /* 18 nov 2026 — LE AZIONI DELLA SCHEDA GIUSTA.
     «Apri» su una scheda mette da parte le altre sue azioni (_azPendenti) e la
     finestra che si apre se le prende. Lo faceva l'ascoltatore qui sotto. Ma i
     Promemoria hanno un ascoltatore LORO (js/gest-promemoria.js), che e'
     caricato prima e quindi parte prima: la finestra si apriva con le azioni
     del promemoria aperto LA VOLTA PRIMA. Aprivi A, poi B, premevi «Butta» e
     nel Cestino finiva A; e dopo, «Nuovo cliente» si apriva con «Segna fatto»
     e «Butta» di un promemoria.
     Adesso lo fa questo ascoltatore, che lavora «in discesa» (capture) e
     quindi parte prima di TUTTI gli altri, in qualunque file stiano. */
  document.addEventListener("click",function(e){
    const t=e.target&&e.target.closest?e.target.closest("[data-action]"):null;if(!t)return;
    const a=String(t.dataset.action||""),id=t.dataset.id;
    if(AZ_APERTURA.test(a)) _azPendenti=AZ_APRI[a+":"+String(id==null?"":id)]||null;
  },true);

  document.addEventListener("click",async e=>{
    const t=e.target.closest("[data-action]");if(!t)return;
    const a=t.dataset.action,id=t.dataset.id;
    /* i pulsanti in fondo alla finestra: prima si chiude, poi si fa.
       Se no si cambia lo stato e si resta davanti al modulo vecchio. */
    if(t.dataset.chiudi){ const _ov=$("#overlay"); if(_ov)_ov.classList.remove("open"); }
    /* «Apri» su una scheda: le altre azioni di quella scheda aspettano qui,
       e se le prende la finestra appena si apre (vedi openSheetGrande). */
    /* 18 nov 2026 — questa riga adesso sta nell'ascoltatore qui sopra, che
       parte PRIMA di tutti gli altri (vedi «LE AZIONI DELLA SCHEDA GIUSTA»). */
    if(a==="spesa-add")return spesaAdd();
    /* "Mostra tutti": svuota la casella di ricerca della sezione in cui si sta */
    if(a==="cerca-azzera"){
      const sez=t.closest("section");
      const campi=sez?sez.querySelectorAll(".lav-search"):[];
      let fatto=false;
      campi.forEach(function(el){ if(el.value){ el.value=""; el.dispatchEvent(new Event("input",{bubbles:true})); fatto=true; } });
      if(!fatto&&sez){ /* la ricerca poteva stare nella barra in alto */
        const g=$("#f-search"); if(g&&g.value){ g.value=""; g.dispatchEvent(new Event("input",{bubbles:true})); }
      }
      return;
    }
    if(a==="ptl-conferma")return prevToLavoroConferma(id,+t.dataset.tot||0);
    if(a==="cest-vista"){cestVista=t.dataset.v||"reparto";renderCestino();return;}
    if(a==="cest-ripristina")return cestRipristina(id);
    if(a==="cest-definitivo")return cestDefinitivo(id);
    if(a==="new-cred")return credForm(null);
    if(a==="edit-cred")return credApri(id);   /* 20 nov 2026: anche da ricerca e Scadenzario (credCache vuota) */
    if(a==="cred-att")return credApriAttestato(id);
    if(a==="save-cred")return saveCred(id);
    if(a==="cred-traguardo")return credTraguardo();
    if(a==="save-cred-traguardo")return saveCredTraguardo();
    if(a==="cred-anno"){credAnno=t.dataset.v;renderCrediti();return;}
    if(a==="del-cred")return delCred(id);
    if(a==="verbale")return verbaleForm(id);
    if(a==="verbale-pdf")return verbalePdf(id);
    if(a==="ore-add")return oreAdd();
    if(a==="ore-del"){if((await window.chiediVia("questa riga di ore",true,"La riprendi dal Cestino quando vuoi.")))return oreDel(id);return;}
    if(a==="rap-del")return rapCestina(id);   /* la domanda la fa lui: gli serve il numero delle ore */
    if(a==="asst-invia")return asstInvia();
    if(a==="asst-allega")return asstScegliFile();
    if(a==="asst-togli-file")return asstTogliFile();
    if(a==="spesa-del"){/* 13 nov 2026 (quarto giro) — la domanda dice QUALE spesa: il nome si legge dalla riga toccata */const _rs=t.closest(".spesa-row"),_ns=_rs&&_rs.querySelector("span"),_nb=_rs&&_rs.querySelector("b");let _nomeSp="";if(_ns){const _c=_ns.cloneNode(true);_c.querySelectorAll("small").forEach(x=>x.remove());_nomeSp=_c.textContent.trim().slice(0,80);}if((await window.chiediVia(_nomeSp?("la spesa «"+_nomeSp+"»"+(_nb?" da "+_nb.textContent.trim():"")):"questa spesa",true,"La riprendi dal Cestino quando vuoi.")))sb.from("gest_spese").delete().eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non eliminata: "+(res.error?res.error.message:"nessuna riga trovata. Riprova."));return;}renderSpeseBlock(speseLavoroId);});return;}
    if(a==="scegli-tipo")return _salvaTipo(id);   /* 14 agosto: chi non ha mai detto che lavoro fa */
    if(a==="landing-riprova")return renderLanding();
    if(a==="new-computo")return computoForm(null);
    /* 25 nov 2026 — dal giorno del Calendario al giro sulla Mappa */
    if(a==="mp-giro"){closeSheet();if(typeof mpApriGiro==="function")mpApriGiro(t.dataset.d);return;}
    /* 24 nov 2026 (giro dello studio) — computo nuovo già legato a cliente e/o pratica
       (dalla scheda del cliente e dalla pratica) */
    if(a==="new-computo-pre"){
      const d=t.dataset, c={};
      if(d.cli)c.cliente_id=d.cli; if(d.lav)c.lavoro_id=d.lav;
      if(d.lav&&!d.cli){const s=document.querySelector("#j-cli,#j-cliente");if(s&&s.value)c.cliente_id=s.value;}
      if(d.lav){const dv=document.querySelector("#j-dove");if(dv&&dv.value.trim())c.luogo=dv.value.trim();
        const ds=document.querySelector("#j-desc");if(ds&&ds.value.trim())c.titolo=ds.value.trim();}
      if(d.lav&&typeof gconfirm==="function"&&!(await gconfirm("Apro il computo nuovo al posto di questa pratica.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?")))return;
      return computoForm(c);
    }
    if(a==="edit-computo")return computoForm(compCache.find(c=>String(c.id)===String(id)));
    if(a==="save-computo")return saveComputo(id);
    if(a==="comp-dup")return compDuplica(id);
    if(a==="comp-variante")return compDuplica(id,true);
    if(a==="del-computo")return delComputo(id);
    if(a==="comp-pdf")return computoPdf(id);
    if(a==="comp-gara")return computoListaGara(id);
    if(a==="comp-analisi")return analisiPdf(id);
    if(a==="co-pag")return compPag(+t.dataset.p);
    if(a==="crono-salva")return cronoSalva();
    if(a==="crono-fuori-metti")return cronoFuoriMetti();
    /* i due pulsanti stanno DENTRO la scheda del computo aperto: l'id e'
       quello, non serve leggerlo dal pulsante */
    if(a==="crono-pdf")return cronoPdf(ctrComputoId);
    if(a==="var-pdf")return variantePdf(ctrComputoId);
    if(a==="comp-importa")return compApriFile();
    if(a==="comp-geometra")return compGeometraApri();   /* 7 nov 2026 — il file del geometra dalla lista */
    if(a==="cp-metti")return compPdfMetti();
    if(a==="cp-tutte"){$$("#cp-lista .cp-ck").forEach(x=>{x.checked=true;});return;}
    if(a==="cp-nessuna"){$$("#cp-lista .cp-ck").forEach(x=>{x.checked=false;});return;}
    if(a==="comp-prezzi")return compPrezziDaPrezzario();
    if(a==="comp-prz-chiudi"){compPrzEsito="";compPrzEsitoId=null;return renderCompVoci(compVociCompId);}
    if(a==="pp-usa")return ppUsa(id);
    if(a==="pp-del")return ppDel(id);
    if(a==="pp-salva")return ppSalva();
    if(a==="pp-tutte"){ppFonteScelta="";return ppCerca();}
    if(a==="pp-solo"){const b=$("#pp-fonte-box");ppFonteScelta=(b&&b.dataset.sua)||"";return ppCerca();}
    if(a==="comp-prev")return computoAPreventivo(id);
    if(a==="sal-nuovo")return salForm(null);
    if(a==="sal-el-apri")return salApriDaElenco(id);
    if(a==="sal-torna")return salTorna();
    if(a==="sal-filtro"){salFiltro=t.dataset.v||"tutti";renderSalTutti();return;}
    if(a==="sal-comp-apri")return salApriComputo(id);
    if(a==="sal-vai-computi"){const b=document.querySelector('nav.tabs button[data-tab="computi"]');if(b){b.click();window.scrollTo(0,0);}return;}
    if(a==="sal-apri")return salForm(id);
    if(a==="sal-salva")return salSalva(id);
    if(a==="sal-pdf")return salPdf(id);
    if(a==="sal-cert")return salCertificatoPdf(id);   /* 20 nov 2026 — studio */
    if(a==="sal-fattura")return salAFattura(id);
    if(a==="sal-fatt-intero")return salFatturaCon("intero");
    if(a==="sal-fatt-netto")return salFatturaCon("netto");
    if(a==="sal-del")return salElimina(id);
    if(a==="new-prezzo")return prezzoForm(null);
    if(a==="edit-prezzo")return prezzoForm(id);
    if(a==="save-prezzo")return savePrezzo(id);
    if(a==="del-prezzo")return delPrezzo(id);
    if(a==="pz-importa")return pzApriFile();
    if(a==="pz-vai")return pzEsegui();
    if(a==="pz-annulla")return pzAnnullaImport();
    if(a==="comp-filtro"){compFiltro=t.dataset.v;renderComputi();return;}
    if(a==="comp-cap-apri"){compCapNuovo=true;compCapEdit=null;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-annulla"){compCapNuovo=false;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-edit"){compCapEdit=id;compCapNuovo=false;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-edit-annulla"){compCapEdit=null;renderCompVoci(compVociCompId);return;}
    if(a==="comp-cap-rinomina")return compCapRinomina(id);
    if(a==="comp-cap-salva")return compCapSalva();
    if(a==="comp-cap-del")return compCapDel(id);
    if(a==="comp-voce-new")return compVoceForm(null);
    if(a==="comp-sel-apri"){compSelModo=true;compSel.clear();compCapNuovo=false;compCapEdit=null;renderCompVoci(compVociCompId);return;}
    if(a==="comp-sel-annulla"){compSelModo=false;compSel.clear();renderCompVoci(compVociCompId);return;}
    if(a==="comp-sel")return compSelTocca(id);
    if(a==="comp-sel-sposta")return compSelSposta();
    if(a==="comp-voce")return compVoceForm(id);
    if(a==="comp-voce-del")return compVoceDel(id);
    if(a==="comp-voce-su")return compVoceSposta(id,-1);
    if(a==="comp-voce-giu")return compVoceSposta(id,1);
    if(a==="comp-voce-salva")return compVoceSalva(id);
    if(a==="comp-torna")return compTornaAlComputo();
    if(a==="an-add")return anAdd(id);
    if(a==="an-edit")return anEdit(id);
    if(a==="an-del")return anDel(id);
    if(a==="an-annulla")return anAnnulla();
    if(a==="comp-mis-add")return compMisAdd(id);
    if(a==="comp-mis-edit")return compMisEdit(id);
    if(a==="comp-mis-annulla")return compMisAnnulla();
    if(a==="comp-mis-del")return compMisDel(id);
    if(a==="new-prev")return prevForm(null);
    /* «✨ Genera con AI»: stesso modulo, con la riga dell'AI gia' aperta */
    if(a==="new-prev-ai")return prevForm(null,null,true);
    /* «Controlla prima di mandarlo»: vale per qualunque sezione, il tipo
       di documento se lo porta scritto addosso il pulsante */
    if(a==="ctr-guarda"){ctrGuardaTutto(t.dataset.ctr||"preventivo");return;}
    /* la rilettura dell'AI: costa un credito, quindi parte solo da qui */
    if(a==="ctr-ai"){ctrAiGuarda(t.dataset.ctr||"preventivo");return;}
    if(a==="ds-filtro"){dsFilter=t.dataset.v||"da_fare";renderDalSito();return;}
    /* 11 nov 2026 — collaudo 3.16: dalla pagina vuota si va a vedere la propria scheda pubblica */
    if(a==="ds-mia-pagina"){if(dsMieIds&&dsMieIds.length)window.open("/profilo-impresa.html?id="+encodeURIComponent(dsMieIds[0]),"_blank","noopener");return;}
    if(a==="ds-apri")return dsApri(id);
    if(a==="ds-contatti")return dsContatti(id);
    if(a==="ds-prev")return dsCreaPreventivo(id);
    if(a==="ds-prev-apri"){const _r=dsCache.find(x=>String(x.id)===String(id));if(!_r||!_r._prevId){toast("Non trovo il preventivo di questa richiesta");return;}closeSheet();return window.apriCosa("prev",_r._prevId);}
    if(a==="ds-chiudi")return dsChiudi(id,false);
    if(a==="ds-riapri")return dsChiudi(id,true);
    if(a==="edit-prev")return prevForm(prevCache.find(p=>p.id===id));
    /* dal Riepilogo: prevCache può essere ancora vuota (scheda Preventivi mai aperta),
       quindi il preventivo si prende dalla lista già caricata per il blocco. */
    if(a==="rie-prev"){const p=rieprevCache.find(x=>String(x.id)===String(id));if(p)prevForm(p);return;}
    if(a==="save-prev")return savePrev(id||null);
    if(a==="prev-nota-add"){const b=$("#pv-note-lista");if(b){b.insertAdjacentHTML("beforeend",prevNotaRigaHtml(""));const ult=b.querySelector("[data-nota]:last-child .nt-txt");if(ult)ult.focus();}return;}
    if(a==="prev-nota-del"){const d=t.closest("[data-nota]");if(d){const b=$("#pv-note-lista");d.remove();
      /* se le togli tutte resta una riga vuota: se no non hai piu' dove scrivere */
      if(b&&!b.querySelector("[data-nota]"))b.insertAdjacentHTML("beforeend",prevNotaRigaHtml(""));}
      return;}
    if(a==="ore-parcella")return orePortaInParcella();
    if(a==="pv-cli-nuovo"){
      const box=$("#pv-cli-nuovo"), apri=$("#pv-cli-apri");
      if(box){box.style.display="";const n=$("#pv-cli-nome");if(n){n.value="";n.focus();}}
      if(apri)apri.style.display="none";
      return;
    }
    if(a==="pv-cli-annulla"){
      const box=$("#pv-cli-nuovo"), apri=$("#pv-cli-apri");
      if(box)box.style.display="none";
      if(apri)apri.style.display="";
      return;
    }
    if(a==="pv-cli-salva")return pvCliSalva();
    if(a==="dp-apri"){
      const box=$("#dp-box"), apri=$("#dp-apri");
      if(box){box.style.display="";const c=$("#dp-cat");if(c)c.focus();}
      if(apri)apri.style.display="none";
      return;
    }
    if(a==="dp-chiudi"){
      const box=$("#dp-box"), apri=$("#dp-apri");
      if(box)box.style.display="none";
      if(apri)apri.style.display="";
      return;
    }
    if(a==="dp-metti")return dpMetti();
    if(a==="prev-pz-apri")return prevPzApri();     /* 18 nov 2026 */
    if(a==="prev-pz-usa")return prevPzUsa(id);
    if(a==="prev-riga-add"){$("#prev-righe").insertAdjacentHTML("beforeend",prevRigaHtml());return;}
    /* un capitolo si può aggiungere anche a mano, non solo arrivando da un
       computo: chi scrive il preventivo a mano ha lo stesso bisogno di
       dividere «Demolizioni» da «Opere murarie». */
    if(a==="prev-cap-add"){$("#prev-righe").insertAdjacentHTML("beforeend",prevRigaHtml({sezione:true}));return;}
    if(a==="qe-riga-add"){$("#co-qe-righe").insertAdjacentHTML("beforeend",qeRigaHtml());qeAggiorna();return;}
    if(a==="qe-riga-del"){const d=t.closest("[data-qe]");if(d){d.remove();qeAggiorna();}return;}
    if(a==="prev-riga-del"){const d=t.closest("[data-riga]");if(d){d.remove();prevTotaleLive();
      /* anche i riepiloghi sotto: prima restavano col numero vecchio e sullo
         schermo comparivano due totali diversi */
      aggiornaRiepilogoParcella();aggiornaRiepilogoIvaImpresa();}return;}
    if(a==="prev-filtro"){prevFilter=t.dataset.v;renderPreventivi();return;}
    if(a==="prev-stato"){sb.from("gest_preventivi").update({stato:t.dataset.v}).eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non salvato: "+(res.error?res.error.message:"nessuna riga modificata. Riprova."));return;}rinfresca("preventivi","riepilogo");if(t.dataset.v==="accettato"&&typeof window.tiSpunta==="function")window.tiSpunta("Preventivo accettato");else toast("Preventivo aggiornato ✔");});return;}
    if(a==="prev-to-lavoro")return prevToLavoro(id);
    if(a==="prev-to-fatt")return fattDaPreventivoId(id);
    if(a==="del-prev"){/* 11 nov 2026 — collaudo 3.3: la domanda dice QUALE preventivo e che va nel Cestino, non che sparisce */const _pv=((typeof prevCache!=="undefined"?prevCache:[])||[]).find(x=>String(x.id)===String(id));const _nm=_pv&&_pv.titolo?"«"+_pv.titolo+"»":"questo preventivo";const _ok=(typeof window.tiChiedi==="function")?await window.tiChiedi("Lo riprendi dal Cestino quando vuoi.",{titolo:"Mettere nel cestino "+_nm+"?",si:"Sì, nel cestino",no:"No",rosso:true}):await gconfirm("Mettere nel cestino "+_nm+"?");if(_ok)sb.from("gest_preventivi").delete().eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non eliminato: "+(res.error?res.error.message:"nessuna riga trovata. Riprova."));return;}rinfresca("preventivi","riepilogo");toast("Preventivo nel cestino: lo riprendi da lì");});return;}
    if(a==="prev-pdf")return prevControllaEManda(id);
    if(a==="prev-incarico")return incaricoForm(id);
    if(a==="incarico-pdf")return incaricoPdf(id);
    if(a==="prev-ordine")return ordineForm(id);
    if(a==="ordine-pdf")return ordinePdf(id);
    if(a==="report-csv")return reportCsv();
    if(a==="report-pdf")return reportPdf();
    if(a==="lav-vista"){filter.vista=t.dataset.v;renderJobs();return;}
    if(a==="lav-pstato"){filter.pstato=t.dataset.v||"";renderJobs();return;}   /* 19 nov 2026: studio, «A che punto sta» */
    /* un solo menu "..." per tutte le sezioni: le voci le ha già preparate
       renderTabella, qui si legge solo il registro. */
    if(a==="tab-menu"){
      /* il menu vive in una cella <td> nella tabella, in .job-menu nelle schede */
      const cella=t.closest("td")||t.closest(".job-menu")||t.parentElement;
      const aperto=cella&&cella.querySelector(".lav-pop");
      tabChiudiPop();
      if(aperto)return;                                   /* secondo clic: chiude */
      const voci=(TAB_MENU[t.dataset.tab]||{})[String(id)];
      if(voci&&voci.length&&cella)cella.insertAdjacentHTML("beforeend",tabPop(voci));
      return;
    }
    /* stesso menu, ma per le schede che si preparano le voci da sole
       (Preventivi, Fatture, Clienti, Squadra, Mezzi, Scadenzario...) */
    if(a==="scheda-menu"){
      const cella=t.closest(".job-menu")||t.parentElement;
      const aperto=cella&&cella.querySelector(".lav-pop");
      tabChiudiPop();
      if(aperto)return;
      const voci=SCHEDA_MENU[t.dataset.k];
      if(voci&&voci.length&&cella)cella.insertAdjacentHTML("beforeend",tabPop(voci));
      return;
    }
    if(a==="fatt-vista"){fattVista=t.dataset.v;renderFatture();return;}
    if(a==="burger"){const s=document.querySelector(".side");if(s)s.classList.toggle("open");return;}
    if(a==="export-excel")return esportaExcel();
    if(a==="export-json")return esportaJson();
    if(a==="vai-report"){const b=document.querySelector('nav.tabs button[data-tab="report"]');if(b)b.click();return;}
    /* click su una scheda del Riepilogo: entra nella sezione corrispondente,
       come se avessi cliccato la voce nel menu di sinistra. */
    if(a==="rie-go"){const b=document.querySelector('nav.tabs button[data-tab="'+t.dataset.go+'"]');if(b){b.click();window.scrollTo(0,0);}return;}
    /* 11 nov 2026 — collaudo 3.3: Riprova del riquadro rosso delle liste (listaNonLetta) */
    if(a==="lista-riprova"){const f=RENDER_TAB[t.dataset.tab];t.disabled=true;t.textContent="Riprovo…";if(f)Promise.resolve(f()).catch(()=>{});return;}
    if(a==="rie-riprova"){const g=$("#rie-grid");if(g)g.innerHTML='<div class="rc-caricamento">Caricamento del riepilogo…</div>';renderRiepilogo();renderContatori();return;}
    /* dal Riepilogo: la patente a crediti sta nella finestra Dati azienda,
       che non è una scheda del menu — quindi apro direttamente quella. */
    if(a==="rie-azienda")return aziendaForm();
    /* 24 nov 2026 — dall'Assistente: le pratiche con le integrazioni del Comune */
    if(a==="rie-integr"){filter.vista="tutti";filter.pstato="integrazioni";const b=document.querySelector('nav.tabs button[data-tab="lavori"]');if(b){b.click();window.scrollTo(0,0);}else renderJobs();return;}
    if(a==="rie-bolle")return (typeof acqApri==="function")?acqApri(t.dataset.mese||""):null;
    if(a==="rie-piu"){
      $$('#rie-alert [data-ro-piu]').forEach(function(x){x.style.display="";});
      const tt=$("#ro-piu-tasto"); if(tt)tt.remove();
      return;
    }
    /* ⛔ 19 settembre 2026 — IL TASTO CHE NON PORTAVA DA NESSUNA PARTE.
       «rie-go» qui sopra fa esattamente questo, ma si chiama come il
       Riepilogo e negli altri file nessuno lo sapeva. Cosi' il 18 settembre
       sono nati dei tasti con data-action="vai-sezione" (il resoconto del
       prezzario, il riquadro delle fatture emesse) che NON avevano nessuno
       che li ascoltava: si cliccava e non succedeva niente.
       Adesso il nome generico c'e' davvero, e vale per tutti i file.
       Si usa cosi': data-action="vai-sezione" data-go="<nome della sezione>". */
    if(a==="cest-guasto-copia"){
      const g=cestGuastoLeggi();
      if(!g){ toast("Non c’è niente da copiare"); return; }
      /* ⛔ 19 settembre 2026, provato dal vivo — navigator.clipboard NON
         basta: nel browser dentro l’app il permesso «clipboard-write»
         risulta negato e il tasto diceva solo «selezionalo a mano».
         Quindi prima si prova la strada vecchia (una casella nascosta piu'
         execCommand), che funziona dappertutto e non chiede permessi, e
         solo se fallisce si prova quella nuova. */
      let fatto=false;
      try{
        const c=document.createElement("textarea");
        c.value=g.testo;
        c.setAttribute("readonly","");
        c.style.cssText="position:fixed;top:0;left:-9999px;opacity:0";
        document.body.appendChild(c);
        c.select(); c.setSelectionRange(0,c.value.length);
        fatto=document.execCommand("copy");
        c.remove();
      }catch(e){}
      if(fatto){ toast("Elenco copiato ✔ — incollalo dove vuoi tenerlo"); return; }
      try{
        navigator.clipboard.writeText(g.testo).then(
          function(){ toast("Elenco copiato ✔ — incollalo dove vuoi tenerlo"); },
          function(){ toast("Non sono riuscito a copiarlo: selezionalo con il dito e copia"); });
      }catch(e){ toast("Non sono riuscito a copiarlo: selezionalo con il dito e copia"); }
      return;
    }
    if(a==="cest-guasto-via"){
      try{ localStorage.removeItem(CEST_GUASTO); }catch(e){}
      closeSheet();
      /* ⛔ 19 settembre 2026, provato dal vivo — renderCestino() rifa'
         tutte le domande al database e ci mette qualche secondo: premevi
         il tasto e l’avviso restava li', come se non avesse funzionato.
         Quindi prima si toglie dallo schermo, poi si rifa' il conto. */
      const _f=t.closest?t.closest(".cest-testa"):null; if(_f)_f.remove();
      renderCestino();
      toast("Avviso tolto");
      return;
    }
    if(a==="vai-sezione"){
      const dove=t.dataset.go||"";
      closeSheet();
      const b=document.querySelector('nav.tabs button[data-tab="'+dove+'"]');
      if(b){b.click();window.scrollTo(0,0);}
      return;
    }
    /* ⛔ 19 settembre 2026 — DAL PANNELLO «IL SAL NON SI E' COLLEGATO»
       ALLO STATO DI AVANZAMENTO GIUSTO.
       Non basta portare nella sezione: con dieci SAL in elenco quello da
       controllare e' ancora da cercare. Quindi si entra nella sezione e poi
       si aspetta che l'elenco si sia riempito (e' asincrono) per aprire
       proprio quello. Qualche tentativo e poi si lascia perdere, restando
       comunque nella sezione giusta: mai un'attesa infinita. */
    if(a==="fatt-vai-sal"){
      closeSheet();
      const b=document.querySelector('nav.tabs button[data-tab="sal"]');
      if(b){b.click();window.scrollTo(0,0);}
      if(id){
        let giri=0;
        (function apri(){
          giri++;
          const pronto = (typeof salTuttiCache!=="undefined") && salTuttiCache
            && salTuttiCache.some(function(x){return String(x.id)===String(id);});
          if(pronto && typeof salApriDaElenco==="function"){ salApriDaElenco(id); return; }
          if(giri<12){ setTimeout(apri,400); return; }
          /* ⛔ 19 settembre 2026, provato dal vivo — se il SAL non si trova
             (il suo computo sta in un altro reparto, o e’ finito nel
             Cestino) prima non succedeva NIENTE: restavi nell’elenco senza
             sapere perche'. E il silenzio e' proprio il difetto che stiamo
             togliendo. */
          toast("Non trovo quello stato di avanzamento in questo reparto: prova a cercarlo negli altri, o nel Cestino");
        })();
      }
      return;
    }
    /* ⛔ 18 settembre 2026 — LA RIGA DELLA FATTURA SI APRIVA SULL'ELENCO.
       Il Riepilogo la scrive per nome e numero e si porta dietro il suo id
       (gest-riepilogo.js, riga della scheda Fatture), ma qui l'id si buttava
       via: si finiva in cima alla sezione, e con trenta fatture in elenco
       quella che avevi cliccato era da ritrovare a mano. Le altre due righe
       del Riepilogo aprono davvero la loro scheda — questa no.
       ⚠️ fattCache si riempie con renderFatture, che è asincrona: si prova
          qualche volta e poi si lascia perdere, restando comunque nella
          sezione giusta. Mai un'attesa infinita. */
    if(a==="rie-go-fatture"){
      const b=document.querySelector('nav.tabs button[data-tab="fatture"]');
      if(b){b.click();window.scrollTo(0,0);}
      if(id){
        let giri=0;
        (function apri(){
          const f=(typeof fattCache!=="undefined"&&fattCache)?fattCache.find(x=>String(x.id)===String(id)):null;
          if(f){ try{ fattForm(f); }catch(e){} return; }
          if(++giri<12) setTimeout(apri,400);
        })();
      }
      return;
    }
  });
  /* al cambio desktop/mobile ridisegna liste (tabella ↔ card).
     Come sopra: su iOS vecchi esiste solo addListener. */
  try{
    const _mqLis=window.matchMedia("(min-width:881px)");
    const _mqLisCambio=()=>{if(cur){renderJobs();renderFatture();}};
    if(_mqLis.addEventListener)_mqLis.addEventListener("change",_mqLisCambio);
    else if(_mqLis.addListener)_mqLis.addListener(_mqLisCambio);
  }catch(e){}

  function openSheet(html){_azPendenti=null;const s=$("#sheet");s.className="sheet";
    /* stessa freccia della finestra grande: si esce sempre uguale */
    s.innerHTML='<div class="sh-back-riga">'+_BTN_INDIETRO+'</div>'+html;
    $("#overlay").classList.add("open");}
  /* Variante grande: SOLO i moduli lunghi (lavoro e preventivo). Intestazione e
     piede restano fermi, scorre solo il corpo — prima per salvare bisognava
     arrivare in fondo a una colonna di dieci campi.
     corpo = due <div class="sh-col"> dentro <div class="sh-cols">: sopra i 900px
     diventano due colonne, sotto tornano una sola.
     Il modulo lavoro aggiunge .sh-cols--3 e divide i due contenitori in quattro
     blocchi .sh-b-a/b/c/d: sopra i 1500px la griglia passa a tre colonne. */
  const _ICO_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  /* 16 agosto 2026 (5) — SI ESCE SEMPRE ALLO STESSO MODO.
     Prima da una finestra si usciva in tre modi diversi a seconda di dove
     eri: la × in alto a destra, «Annulla» in fondo, oppure una freccia.
     Tre gesti per la stessa cosa. Adesso in cima a sinistra c'e' una
     freccia grande, uguale in tutte le finestre, e la × non c'e' piu'. */
  const _ICO_INDIETRO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
  const _BTN_INDIETRO='<button class="sh-back" data-action="close" title="Torna indietro" aria-label="Torna indietro">'+_ICO_INDIETRO+'<span>Indietro</span></button>';
  function openSheetGrande(titolo,corpo,azioni,azioniSue){
    /* le azioni della scheda da cui si e' arrivati: entrano dopo il primo
       pulsante (che e' sempre «Annulla»), cosi' «Salva» resta l'ultimo. */
    let _sopra="";
    /* azioni che la finestra si porta da sola (non arrivano da una scheda):
       vanno anche loro in alto, cosi' la regola e' una sola per tutti. */
    if(azioniSue&&azioniSue.length){
      _azPendenti=(_azPendenti||[]).concat(azioniSue);
    }
    if(_azPendenti&&_azPendenti.length){
      /* 16 agosto 2026 — I DOPPIONI DEL COMPUTO.
         Qualche finestra i suoi pulsanti in fondo li aveva gia' (il Computo
         ha PDF, «Crea il preventivo» ed Elimina). Aggiungendoci sopra quelli
         della scheda uscivano due «PDF» e due «Elimina» nella stessa
         finestra: uno chiude e l'altro no, e non si capisce quale premere.
         Quindi: se un'azione c'e' gia' in fondo, non la si rimette. */
      const _gia=String(azioni||"");
      const _nuove=_azPendenti.filter(x=>x&&x.action&&_gia.indexOf('data-action="'+x.action+'"')<0);
      _sopra=azioniSopra(_nuove);
      azioni=azioniElimina(_nuove)+(azioni||"");
    }
    _azPendenti=null;
    const s=$("#sheet");
    s.className="sheet sheet--grande";
    s.innerHTML=`<div class="sh-head">${_BTN_INDIETRO}<h3>${titolo}</h3>${_sopra}</div>
      <div class="sh-body">${corpo}</div>
      <div class="sh-foot">${azioni}</div>`;
    $("#overlay").classList.add("open");
    /* Il corpo scorre: senza questo il modulo si apre già scorso di qualche
       riga (resta la posizione della volta prima) e la prima etichetta sparisce. */
    /* ⚠️ 20 agosto 2026 — «RICORDA A PAGINA PIENA» (detto da Alessio).
       Le finestre lunghe (lavoro, preventivo, fattura, computo...) prendono
       tutto lo schermo; quelle corte restano una finestrella centrata.
       Prima il CSS lo capiva guardando se dentro c'era «.sh-cols», le due
       colonne. Il computo le colonne non ce le ha piu' — ha le pagine
       «.copag» — e da un momento all'altro si e' rimpicciolito a 880 px in
       mezzo allo schermo: ERRORE MIO, e non l'ha visto nessun banco.
       ⛔ Adesso il nome da guardare e' UNO SOLO: la classe «sh-lunga», messa
          qui. Chi domani inventa una terza forma di finestra la aggiunge in
          questa riga, non in dieci regole del CSS sparse per il file. */
    /* ⚠️ 20 agosto 2026 (2) — visto da Alessio: «perché queste finestre
       piccole?». La conferma del computo letto dal PDF (.cp-riga) e' lunga
       88 righe e si apriva in una finestrella da 880 px con dentro una
       barretta di scorrimento lunga un dito. Le finestre qui sotto sono
       TUTTE quelle lunghe del gestionale: le altre (scegli un lavoro, scegli
       un preventivo, il tipo di fattura) sono tre righe in croce e a tutto
       schermo diventerebbero un lenzuolo bianco. */
    if(s.querySelector(".sh-cols,.copag,.cp-riga,.grp-riep")) s.classList.add("sh-lunga");   /* 20 nov 2026: + il Riepilogo delle Giornate */
    const _b=s.querySelector(".sh-body");
    if(_b){
      /* Le emoji diventano icone SVG subito dopo l'apertura: il contenuto cambia
         altezza e il browser "insegue" la posizione (scroll anchoring), lasciando
         il modulo scorso di qualche riga. Riportiamo l'inizio anche dopo. */
      _b.scrollTop=0;
      requestAnimationFrame(function(){_b.scrollTop=0;});
      setTimeout(function(){_b.scrollTop=0;},80);
      setTimeout(function(){_b.scrollTop=0;},250);
    }
  }
  /* 15 nov 2026 (sesto giro, n. 1) — «Scrivi il costo orario di …» dentro un
     lavoro apre la scheda della persona AL POSTO del lavoro (la finestra e' una
     sola). Quando quella scheda si chiude — Salva, Annulla, la freccia, il
     clic fuori — si torna nel lavoro da cui si era partiti, non all'elenco.
     Il lavoro da riaprire sta qui; si usa una volta sola. */
  var _tornaAlLavoro=null;
  function closeSheet(){
    $("#overlay").classList.remove("open");
    const _lid=_tornaAlLavoro; _tornaAlLavoro=null;
    /* solo se a chiudersi e' proprio la scheda della persona */
    /* 19 nov 2026 (voce Pratiche) — anche la scadenza aperta dalla scheda
       della pratica («+ Aggiungi una scadenza»): chiusa, si torna nella pratica */
    if(_lid&&document.querySelector("#sheet #d-nome, #sheet #s-tit"))lavoroApri(_lid);
  }
  /* 19 nov 2026 (voce Pratiche) — una fotografia delle caselle del lavoro
     appena aperto: serve a non chiedere «se hai scritto qualcosa va perso»
     quando non hai toccato niente. */
  function _lavValori(){
    const v=[...document.querySelectorAll('#sheet [id^="j-"]')]
      .filter(e=>"value" in e&&e.tagName!=="BUTTON")
      /* le caselle dei soldi si riscrivono da sole («1200,5» → «1.200,50»): si confronta il numero */
      .map(e=>e.id+"="+(e.hasAttribute("data-euro")?String(parseFloat(String(e.value).replace(/\./g,"").replace(",","."))||0):e.value));
    const st=document.querySelector("#sheet #j-stato .on");
    return v.join("|")+"|stato="+(st?st.dataset.v:"");
  }
  var _lavFoto=null;
  /* Riapre un lavoro salvato rileggendolo dal database (e' l'azione «edit-job»:
     sta qui perche' la usano in due). */
  async function lavoroApri(id){
    closeSheet();
    /* 12 agosto 2026 — maybeSingle + il controllo. Prima era .single(): se la
       riga non c'era piu' (eliminata da un altro dispositivo, o finita nel
       Cestino mentre l'elenco a schermo era vecchio) data restava null, e la
       riga dopo leggeva data.data_prevista su null. Risultato: la finestra si
       chiudeva e NON SUCCEDEVA NIENTE, senza un messaggio. Mancava anche il
       filtro sull'utente, che c'e' in tutte le altre letture puntuali. */
    const{data}=await sb.from('gest_lavori').select('*').eq('id',id).eq('user_id',sbUid).maybeSingle();
    if(!data){toast("Questo lavoro non c'è più: forse è nel Cestino, o l'ha eliminato qualcun altro");return;}
    /* 24 nov 2026 (giro della pratica) — tornando nella pratica da un'altra
       finestra (fattura del fornitore, ecc.) i pulsanti in alto («Segna fatto»,
       «Foto», «Altro ▾») sparivano: arrivano solo col clic sulla scheda. Si
       riprendono da li', se la scheda e' a schermo. */
    try{if(!_azPendenti&&typeof AZ_APRI!=="undefined")_azPendenti=AZ_APRI["edit-job:"+String(id)]||null;}catch(_){}
    jobForm({...data, dataPrevista:data.data_prevista, clienteId:data.cliente_id, assegnatoId:data.operatore_id, fattStato:data.fatt_stato, /* 9/8/2026: mancava la traduzione di questi due, e la casella 'Cosa è stato fatto' si apriva VUOTA: al primo Salva il consuntivo scritto la volta prima veniva cancellato. */ lavoroSvolto:data.lavoro_svolto, note:data.note});if(editing){editing.realId = data.id;renderSpeseBlock(data.id,+data.importo||0);renderMezziBlock(data.id);renderLavMedia();renderLavScadenze();renderOreBlock(data.id);renderRapportiniBlock(data.id);renderDocLavoro(data.id);renderLavPreventivo(data.id);}
    try{_lavFoto=_lavValori();}catch(_){_lavFoto=null;}
  }
  $("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeSheet();});

  document.addEventListener("click",async e=>{
    const t=e.target.closest("[data-action]");if(!t)return;
    const a=t.dataset.action,id=t.dataset.id;
    /* se il clic arriva dalla striscia di una scheda, il modulo che sta per
       aprirsi deve accendersi da solo: se no lo apri e non sai dove guardare */
    if(t.classList&&t.classList.contains("ctr-str-vai")) ctrAccendiSubito=t.dataset.ctr||null;
    if(a==="enter")return enterPanel(t.dataset.p);
    if(a==="new-panel")return panelForm();
    if(a==="save-panel")return savePanel();
    if(a==="del-panel")return delPanel(t.dataset.id);
    if(a==="home")return goHome();
    if(a==="azienda")return aziendaForm();
    /* 24 agosto 2026 — il Noleggio e' di tutta l'azienda, non di un reparto:
       da qui si esce dritti verso la sua pagina, come "Dati azienda". */
    if(a==="noleggio"){location.href="/gestionale-noleggio";return;}
    /* 5 set 2026 — si lascia il bigliettino del rientro, come fa il Noleggio
       quando esce: tornando indietro si rientra nel reparto dov'eri. */
    if(a==="appoperaio"){
      try{sessionStorage.setItem("gest_rientro",String(Date.now()));}catch(e){}
      location.href="/gestionale-operatore.html";return;}
    if(a==="abbonamento")return apriAbbonamento(t);
    if(a==="save-azienda")return saveAzienda();
    if(a==="pdf")return generaPdf(id);
    if(a==="chiama"){const n=String(t.dataset.q||"").replace(/[^\d+]/g,"");if(n)location.href="tel:"+n;return;}
    if(a==="map"){window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(t.dataset.q),"_blank");return;}
    if(a==="new-job")return jobForm(null,"",null,true);
    /* 24 nov 2026 (collaudo Galleria dello studio) — «📷 Foto» dal menu della
       pratica apriva una pagina sua che mostrava solo le foto «prima» (2 su 4,
       niente fine lavori, niente video) e non le faceva ingrandire. Adesso
       porta nella Galleria, gia' filtrata su quella pratica: la stessa strada
       di «Guarda in Galleria» dentro la scheda. */
    if(a==="lf-open")return galApriPratica(t.dataset.id);
    if(a==="lf-back"){$$("nav.tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="lavori"));$$("section").forEach(s=>s.classList.toggle("active",s.id==="lavori"));renderJobs();window.scrollTo(0,0);return;}
    /* ---- fatture ---- */
    if(a==="new-fattura")return fattNuovaScegli();
    if(a==="fatt-vuota"){closeSheet();return fattForm(null);}
    if(a==="fatt-da-lavori")return fattDaLavoriScegli();
    if(a==="fatt-da-lavori-ok")return fattDaLavoriConferma();
    if(a==="fatt-da-prev")return fattDaPreventivoScegli();
    if(a==="fatt-da-prev-ok")return fattDaPreventivoConferma();
    if(a==="edit-fatt"){const f=fattCache.find(x=>String(x.id)===String(id));if(f)fattForm(f);return;}
    if(a==="lav-prev-apri"){const _pp=prevCache.find(x=>String(x.id)===String(id));closeSheet();if(_pp)return prevForm(_pp);const _bt=document.querySelector('nav.tabs button[data-tab="preventivi"]');if(_bt)_bt.click();return;}
    if(a==="save-fatt")return saveFattura(id||null);
    if(a==="fatt-riga-add"){$("#fatt-righe").insertAdjacentHTML("beforeend",fattRigaHtml());fattTotaleLive();return;}
    if(a==="fatt-riga-del"){const d=t.closest("[data-riga]");if(d){d.remove();fattTotaleLive();}return;}
    if(a==="fatt-stato")return fattCambiaStato(id,t.dataset.v);
    if(a==="fatt-riprova")return renderFatture();   /* 15 nov 2026: «Non riesco a controllare i numeri delle fatture» */
    if(a==="del-fatt")return eliminaFattura(id);
    if(a==="fatt-pdf")return fatturaPdf(id);
    if(a==="fatt-manda")return fattManda(id);
    if(a==="fatt-nc")return fattNotaCredito(id);   /* 19 nov 2026 — nota di credito da questa fattura */
    if(a==="fatt-acconto")return fattAcconto(id);   /* 17 nov 2026 — porta la fattura nella ricevuta di pagamento */
    if(a==="fatt-buchi-ok")return fattBuchiOk();   /* 17 nov 2026 — js/gest-fattura-manda.js */
    if(a==="fatt-xml")return fatturaXml(id);
    if(a==="fatt-sdi")return fattSdi(id);   /* 29/09/2026 — js/gest-sdi.js */
    if(a==="new-job-date"){closeSheet();return jobForm(null,t.dataset.d,null,true);}
    if(a==="edit-job")return lavoroApri(id);   /* 15 nov 2026: la funzione sta sopra, accanto a closeSheet */
    /* renderFotoBlocks va richiamato QUI: jobForm lo chiama alla fine, ma realId
       viene assegnato solo dopo, e senza quello non sa quale lavoro interrogare. */
    if(a==="save-job")return saveJob();
    if(a==="view-foto"){const src=fotoCache[t.dataset.id];if(src){$("#lb-img").src=src;$("#lightbox").classList.add("open");}return;}
    /* 19 nov 2026 — galChiudiVedi ferma anche il video e toglie la barra della Galleria */
    if(a==="close-lb"){if(window.galChiudiVedi)galChiudiVedi();else $("#lightbox").classList.remove("open");return;}
    if(a==="gal-vedi")return galVedi(t.dataset.id);
    if(a==="gal-prec")return galSposta(-1);
    if(a==="gal-succ")return galSposta(1);
    if(a==="gal-scarica")return galScarica();
    if(a==="gal-nulla")return;
    if(a==="del-foto"){/* 11 nov 2026 — regola 22: dice dove va */if((await (window.cestinoAttivo&&window.cestinoAttivo()?window.chiediCestino("questa foto","La riprendi dal Cestino quando vuoi."):tiChiedi("Eliminare per sempre questa foto?"))))deleteFoto(t.dataset.id);return;}
    if(a==="gal-tipo"){galFilter.tipo=t.dataset.v;segmOn("#gal-tipo",t.dataset.v);renderGalleria();return;}
    if(a==="gal-media"){galFilter.media=t.dataset.v;segmOn("#gal-media",t.dataset.v);renderGalleria();return;}
    if(a==="gal-nuovo"){galCaricaLavori().then(galUploadForm);return;}
    if(a==="mp-vista"){mpVista=t.dataset.v;segmOn("#mp-vista",t.dataset.v);renderMappa();return;}
    if(a==="mp-ricalcola"){toast("Ricalcolo le distanze…");renderMappa(true);return;}
    /* 19 nov 2026 — dalla Mappa: la strada per arrivare al cantiere, partendo da dove sei */
    if(a==="mp-strada"){mpStrada(t.dataset.q);return;}
    if(a==="mp-apri"){mpApri(t.dataset.id);return;}
    if(a==="vai-galleria")return galApriPratica(t.dataset.id);
    if(a==="gal-pdf")return galPdfPratica(t.dataset.id,t);   /* 24 nov 2026: le foto della pratica in PDF */
    if(a==="gal-carica")return galCarica();
    if(a==="gal-del-foto"){/* 11 nov 2026 — regola 22: dice dove va */if((await (window.cestinoAttivo&&window.cestinoAttivo()?window.chiediCestino("questa foto","La riprendi dal Cestino quando vuoi."):tiChiedi("Eliminare per sempre questa foto?"))))galDelFoto(t.dataset.id);return;}
    if(a==="gal-del-video"){/* 11 nov 2026 — regola 22: dice dove va */if((await (window.cestinoAttivo&&window.cestinoAttivo()?window.chiediCestino("questo video","La riprendi dal Cestino quando vuoi."):tiChiedi("Eliminare per sempre questo video?"))))galDelVideo(t.dataset.id);return;}
    if(a==="gal-play")return galVedi(t.dataset.id);   /* 19 nov 2026: il video si guarda dentro la Galleria */
    if(a==="ag-stato"){agFilter.stato=t.dataset.v;segmOn("#ag-stato",t.dataset.v);renderAgenda();return;}
    /* 6 set 2026 — le due linguette di Agenda operatore: «Da fare» e «Ore fatte» */
    if(a==="ag-vista"){
      const v=t.dataset.v; segmOn("#ag-vista",v);
      $("#ag-parte-lavori").style.display = v==="ore" ? "none" : "";
      $("#ag-parte-ore").style.display    = v==="ore" ? "" : "none";
      if(v==="ore") renderOre();
      return;
    }
    if(a==="ore-mese"){_oreSpostaMese(+t.dataset.v);return;}
    if(a==="ore-csv"){oreScaricaCsv();return;}
    if(a==="ore-fix"){oreMettiUscita(t);return;}
    if(a==="ore-apri"){
      const id=t.dataset.id;
      oreAperte[id]=!oreAperte[id];
      renderOre();
      return;
    }
    /* 12 agosto 2026 (sera) — "del-job" tolto: era l'eliminazione dell'archivio
       LOCALE, e l'unico pulsante che la chiamava stava dentro jobCard, che non
       si disegna piu' da mesi. Se per sbaglio fosse tornata raggiungibile
       avrebbe tolto il lavoro dallo schermo lasciandolo su Supabase. Quella
       vera e' "del-job-supa". */
    if(a==="del-job-supa"){
      /* 11 nov 2026 — collaudo 3.4: la domanda dice QUALE lavoro (regola 22) */
      const _cest=!!(window.cestinoAttivo&&window.cestinoAttivo());
      const _lv=((typeof lavCache!=="undefined"?lavCache:[])||[]).find(x=>String(x.id)===String(id));
      const _nm=_lv&&_lv.descrizione?"«"+String(_lv.descrizione).slice(0,80)+"»":"";
      /* ⚠️ 19 nov 2026 (voce Pratiche) — LE SCADENZE DEL LAVORO BUTTATO.
         Come per i mezzi (14 ago): col Cestino il «set null» del database non
         scatta mai, e la pratica buttata lasciava vive le sue scadenze
         (integrazioni, fine lavori): nello Scadenzario «(pratica eliminata)»
         e l'email del mattino continuava ad avvisare. Adesso vanno nel
         Cestino con lei e tornano su con lei (CEST_FIGLI in gest-cestino.js).
         Quelle gia' «fatte» restano dove sono: sono storia. */
      let _nScL=0;
      try{const r=await sb.from("gest_scadenze").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("lavoro_id",id).neq("stato","fatta");_nScL=r.count||0;}catch(_){}
      const _pro=ruoloUtente==='professionista';
      const _scT=_nScL?("Ha "+_nScL+(_nScL===1?" scadenza aperta: va":" scadenze aperte: vanno")+" nel Cestino insieme a "+(_pro?"lei":"lui")+". "):"";
      if(_cest&&_nm&&typeof window.tiChiedi==="function"){
        if(!(await window.tiChiedi(_scT+(_pro?"La riprendi":"Lo riprendi")+" dal Cestino quando vuoi.",{titolo:"Mettere nel cestino "+_nm+"?",si:"Sì, nel cestino",no:"No",rosso:true})))return;
      }else if(!(await gconfirm(_scT+(_cest
          ? "Eliminare questo lavoro? Finisce nel Cestino: da lì puoi rimetterlo a posto."
          : "Eliminare questo lavoro? L'azione non si può annullare."))))return;
      const {data:foto}=await sb.from("gest_foto").select("storage_path").eq("lavoro_id",id).eq("user_id",sbUid);
      /* col cestino il file NON si tocca: se no il ripristino darebbe un'immagine rotta */
      if(foto&&foto.length&&!(window.cestinoAttivo&&window.cestinoAttivo())){
        const paths=foto.map(f=>f.storage_path).filter(Boolean);
        if(paths.length)await sb.storage.from("gestionale-foto").remove(paths);
        await sb.from("gest_foto").delete().eq("lavoro_id",id).eq("user_id",sbUid);
      }
      const {data:okDel,error}=await sb.from("gest_lavori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDel||!okDel.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
      /* col Cestino acceso questa «delete» scrive solo la data (si ripescano insieme) */
      if(_nScL&&_cest){ try{ await sb.from("gest_scadenze").delete().eq("user_id",sbUid).eq("lavoro_id",id).neq("stato","fatta"); }catch(_){} }
      renderAll();
      const _conSc=_nScL&&_cest?(" con "+_nScL+(_nScL===1?" scadenza":" scadenze")):"";
      toast(_cest?(_pro?("Pratica nel cestino"+_conSc+": la riprendi da lì"):("Lavoro nel cestino"+_conSc+": lo riprendi da lì")):"Lavoro eliminato ✔");return;
    }
    if(a==="stato"){const l=db().lavori.find(x=>x.id===id);l.stato=t.dataset.v;if(l.stato==="fatto"&&!l.dataFatto)l.dataFatto=l.dataPrevista||todayStr();await save();renderAll();toast("Stato: "+statoLabel[l.stato]);return;}
    if(a==="stato-supa"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v, dp=t.dataset.dp||"";
      const {data:okSt2,error}=await sb.from("gest_lavori").update({stato:v,data_fatto:v==="fatto"?(dp||todayStr()):null}).eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okSt2||!okSt2.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
      /* 12 agosto 2026 — mancavano "agenda" e "calendario". Nell'Agenda
         premevi "✔ Segna fatto", compariva il messaggio, e la riga restava
         li' com'era: sembrava che non avesse funzionato e si ripremeva. Sul
         calendario il pallino restava del colore vecchio. */
      rinfresca("lavori","riepilogo","agenda","calendario");
      if(v==="fatto"&&typeof window.tiSpunta==="function")window.tiSpunta("Lavoro finito"); else toast("Stato: "+(statoLabel[v]||v));
      return;
    }
    /* Dal lavoro: prima questo pulsante scriveva a mano "fatturato" sul lavoro,
       e la fattura non esisteva da nessuna parte. Ora apre la fattura vera, con
       il lavoro già dentro come voce. Lo stato del lavoro lo scrive la fattura. */
    if(a==="fatt")return fattDaUnLavoro(id);
    if(a==="upload-fattura")return chiediFatturaPdf(id);
    if(a==="open-fattura")return apriFatturaPdf(id);
    if(a==="open-day")return openDay(t.dataset.d);
    if(a==="save-note"){
      const ds=t.dataset.d,v=$("#day-note").value.trim();
      const midN=curMestiere();
      if(!sb||!sbUid||!noteSupaOk||!midN){
        /* vecchio modo: solo su questo dispositivo */
        if(v)db().note[ds]=v;else delete db().note[ds];
        await save();closeSheet();renderCal();
        toast(noteSupaOk?"Nota salvata 📌":"Nota salvata solo su questo dispositivo (manca la migrazione SQL)");return;
      }
      if(v){
        /* ⛔ 30 agosto 2026 — QUI LA NOTA NON SI SALVAVA MAI.
           C'era `eliminato_il:null`, ma in `gest_note` quella colonna NON
           ESISTE: e' l'avanzo del cestino delle note, tolto il 9/8/2026
           poche ore dopo averlo messo (sta scritto in js/cestino.js).
           Postgres rifiutava tutto l'upsert e a schermo usciva «Nota non
           salvata». Le note del calendario non arrivavano al database.
           Il cestino delle note non c'e': il ramo qui sotto cancella davvero. */
        const {data:okN,error}=await sb.from("gest_note").upsert({user_id:sbUid,mestiere_id:midN,data:ds,testo:v},{onConflict:"user_id,mestiere_id,data"}).select("id");
        if(error){toast("Nota non salvata: "+error.message);return;}
        if(!okN||!okN.length){toast("Nota non salvata: nessuna riga modificata. Riprova.");return;}
        noteCache[ds]=v;
      }else{
        /* 17 nov 2026 — «Salva nota» senza aver scritto niente, in un giorno
           senza nota, diceva «Nota eliminata»: non c'era niente da eliminare. */
        if(!noteCache[ds]){closeSheet();return;}
        const {error}=await sb.from("gest_note").delete().eq("user_id",sbUid).eq("mestiere_id",midN).eq("data",ds).select("id");
        if(error){toast("Nota non eliminata: "+error.message);return;}
        delete noteCache[ds];
      }
      closeSheet();renderCal();toast(v?"Nota salvata 📌":"Nota eliminata");return;
    }
    /* 11 agosto 2026 — IL MESE CHE NON CAMBIAVA.
       Prima: cal.setMonth(cal.getMonth()-1). Se oggi è il 31 marzo, chiedere
       "il 31 del mese prima" vuol dire chiedere il 31 FEBBRAIO: febbraio non
       ce l'ha, e il calendario ti sbatteva al 3 marzo. Premevi la freccia e
       restavi nello stesso mese. Stessa cosa in avanti: dal 31 gennaio
       saltavi febbraio di netto.
       Adesso ci si sposta sempre al PRIMO del mese, che tutti i mesi hanno.
       Il giorno non serve: il calendario usa solo l'anno e il mese, e
       l'anno cambia da solo (mese -1 da gennaio = dicembre dell'anno prima).
       Si vede solo nei giorni 29, 30 e 31: per questo sembrava capitare a caso. */
    if(a==="cal-prev"){cal=new Date(cal.getFullYear(),cal.getMonth()-1,1);renderCal();return;}
    if(a==="cal-next"){cal=new Date(cal.getFullYear(),cal.getMonth()+1,1);renderCal();return;}
    if(a==="cal-today"){cal=new Date();renderCal();return;}
    if(a==="cal-ritardo"){filter.vista="ritardo";const b=document.querySelector('nav.tabs button[data-tab="lavori"]');if(b)b.click();else renderJobs();return;}
    if(a==="new-cli")return cliForm(null,t.dataset.tipo||"privato");
    if(a==="commercialista")return commForm();
    if(a==="save-comm")return saveComm();
    if(a==="comm-doc")return docCommApri();
    if(a==="apri-cli")return cliScheda(id);
    if(a==="cli-nuovo-prev")return cliNuovoPer("prev",id);
    if(a==="cli-nuovo-lav")return cliNuovoPer("lav",id);
    if(a==="doc-cli")return docCliApri(id);
    if(a==="doc-cli-apri")return docCliScarica(id);
    if(a==="doc-cli-del")return docCliElimina(id);
    if(a==="doc-cli-mail")return docCliMailForm(id);
    if(a==="doc-cli-invia")return docCliInvia(id);
    if(a==="doc-cli-scegli"){const i=$("#cli-doc-file");if(i)i.click();return;}
    if(a==="edit-cli"){
      let pieno=null;
      if(sb&&sbUid){
        const {data:r}=await sb.from("gest_clienti").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
        pieno=r||null;
      }
      const _rCli=await cliForm(pieno||cliCache.find(c=>c.id===id));
      /* 13 nov 2026 (quarto giro) — chi arriva dalla finestra dello SDI deve
         trovare APERTO «Dati per la fattura» (codice destinatario, PEC,
         partita IVA): prima si apriva la scheda e bisognava cercarlo. */
      if(t.dataset.fisc){
        setTimeout(function(){
          const _ap=document.getElementById("c-fisc-apri"), _bx=document.getElementById("c-fisc-box");
          if(_ap&&_ap.style.display!=="none")_ap.click();
          else if(_bx)_bx.style.display="";
          const _cs=document.getElementById("c-sdi");
          if(_cs){ try{_cs.scrollIntoView({block:"center"});}catch(_){} }
        },250);
      }
      return _rCli;
    }
    if(a==="save-cli")return saveCli(id);
    if(a==="del-cli")return delCli(id);
    if(a==="new-mezzo")return mezzoForm(null,"mezzo");
    if(a==="edit-mezzo")return mezzoForm(mezziCache.find(m=>String(m.id)===String(id)));
    if(a==="save-mezzo")return saveMezzo(id||null);
    if(a==="mezzo-filtro"){mezziFilter=t.dataset.v;renderMezzi();return;}
    if(a==="attrezzo-filtro"){attrezzFilter=t.dataset.v;renderAttrezzature();return;}
    if(a==="new-attrezzatura")return mezzoForm(null,"attrezzatura");
    if(a==="mezzo-scad")return scadForm(null,{mezzo_id:id});
    if(a==="del-mezzo"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const {count:usi}=await sb.from("gest_lavoro_mezzi").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("mezzo_id",id);
      /* ⚠️ LE SCADENZE DEL MEZZO BUTTATO — 14 agosto 2026.
         gest_scadenze.mezzo_id ha «on delete cascade» nel database, ma col
         Cestino quella catena NON scatta mai: eliminare scrive una data, non
         cancella la riga. Risultato riprodotto: vendi il furgone, e il
         gestionale continua a dirti «Revisione del furgone in scadenza» —
         col nome del mezzo e tutto, come se niente fosse.
         Si mettono via anche loro, come si fa già con le fatture del
         fornitore. E tornano su insieme al mezzo, perché CEST_FIGLI adesso
         sa che sono figlie sue. */
      const {count:nSc}=await sb.from("gest_scadenze").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("mezzo_id",id);
      /* 12 nov 2026 (secondo giro) — regola 22: la domanda dice QUALE mezzo e DOVE va */
      const _mzD=((typeof mezziCache!=="undefined"?mezziCache:[])||[]).find(x=>String(x.id)===String(id));
      /* 20 nov 2026 (voce Strumenti) — allo studio la domanda parlava di
         «revisione, assicurazione, bollo» e il messaggio di «Mezzo nel cestino»
         per una stazione totale. Adesso: mezzo, attrezzatura (lei) o strumento. */
      const _attD=!!(_mzD&&_mzD.categoria==="attrezzatura"), _proD=(ruoloUtente==='professionista');
      const _fD=_attD&&!_proD;   /* l'attrezzatura e' femminile */
      const _cosaD=_attD?(_proD?"strumento":"attrezzatura"):"mezzo";
      const _nmD=_mzD&&_mzD.nome?"«"+_mzD.nome+"»":(_fD?"questa attrezzatura":"questo "+_cosaD);
      const _cestD=!!(window.cestinoAttivo&&window.cestinoAttivo());
      const _quali=_attD?(_proD?"taratura, manutenzione…":"verifiche, manutenzione…"):"revisione, assicurazione, bollo…";
      const _sottoD=(usi?`È collegat${_fD?"a":"o"} a ${usi} ${usi===1?(_proD?"pratica":"lavoro"):(_proD?"pratiche":"lavori")}. `:"")
          +(nSc?`Ha ${nSc} ${nSc===1?"scadenza":"scadenze"} (${_quali}): ${nSc===1?"va":"vanno"} nel Cestino insieme a ${_fD?"lei":"lui"} e ${nSc===1?"torna":"tornano"} se ${_fD?"la":"lo"} rimetti a posto. `:"");
      if(!(await window.chiediVia(_nmD,true,_cestD?(_sottoD+(_fD?"La":"Lo")+" riprendi dal Cestino quando vuoi."):undefined)))return;
      const {data,error}=await sb.from("gest_mezzi").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Non eliminato: nessuna riga rimossa");return;}
      try{ await sb.from("gest_scadenze").delete().eq("mezzo_id",id).eq("user_id",sbUid); }catch(e){}
      renderMezzi();renderAttrezzature();renderScadenze();
      toast(_cestD?((_cosaD.charAt(0).toUpperCase()+_cosaD.slice(1))+" nel cestino"+(nSc?(" con "+nSc+(nSc===1?" scadenza":" scadenze")):"")+": "+(_fD?"la":"lo")+" riprendi da lì"):(_fD?"Eliminata":"Eliminato"));return;
    }
    if(a==="new-carta")return cartaForm(null);
    if(a==="edit-carta")return cartaForm(carteCache.find(c=>String(c.id)===String(id)));
    if(a==="save-carta")return saveCarta(id||null);
    if(a==="del-carta")return delCarta(id);
    if(a==="carta-dettaglio")return apriDettaglioCarta(id);
    if(a==="save-movimento")return salvaMovimentoCarta();
    if(a==="del-movimento")return eliminaMovimentoCarta(id);
    if(a==="mezzo-rifornimenti")return apriRifornimenti(id);
    if(a==="save-rifornimento")return salvaRifornimento();
    if(a==="del-rifornimento")return eliminaRifornimento(id);
    if(a==="save-richiesta")return salvaRichiesta();
    if(a==="lm-add")return mezzoLavoroAdd();
    if(a==="lm-del"){
      if(!sbUid){toast("Devi essere loggato");return;}
      if(!(await tiChiedi(ruoloUtente==='professionista'?"Togliere questo strumento dalla pratica?":"Togliere questo mezzo dal lavoro?")))return;
      const {data,error}=await sb.from("gest_lavoro_mezzi").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Non rimosso: nessuna riga eliminata");return;}
      renderMezziBlock(mezziLavoroId);try{renderAttrezzature();renderMezzi();}catch(e){}return;
    }
    if(a==="new-scad")return scadForm(null);
    /* "+ Aggiungi una scadenza" dalla scheda della pratica: nasce già collegata.
       Il modulo della scadenza si apre SOPRA quello della pratica: chiudendolo
       si torna alla pratica, quindi qui non chiudo niente. */
    if(a==="scad-da-pratica"){
      /* 9 agosto 2026 — la finestra è UNA sola (#sheet): aprendo il modulo
         della scadenza si riscrive quello della pratica, e quello che c'era
         scritto e non ancora salvato va perso. Prima non lo diceva nessuno
         (il commento qui sopra sosteneva pure il contrario). Ora si avvisa. */
      /* 19 nov 2026 (voce Pratiche) — si chiede solo se nel modulo e' cambiato
         qualcosa; e chiusa la scadenza si torna nella pratica (_tornaAlLavoro).
         Prima lo chiedeva sempre, e salvando si finiva nell'elenco. */
      let _cambiato=true;
      try{_cambiato=(_lavFoto==null)||(_lavValori()!==_lavFoto);}catch(_){}
      if(_cambiato&&!(await gconfirm("Apro il modulo della scadenza al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?")))return;
      const lavId=id;
      const l=(lavCache||[]).find(x=>String(x.id)===String(lavId));
      await scadForm(null,{lavoro_id:lavId,cliente_id:(l&&l.cliente_id)||null});
      if(document.querySelector("#sheet #s-tit")&&$("#overlay").classList.contains("open"))_tornaAlLavoro=lavId;
      return;
    }
    /* 19 nov 2026 (sì di Alex) — «Apri» su una scadenza dentro la pratica/lavoro:
       si apre la scadenza e, chiusa, si torna nella pratica (_tornaAlLavoro). */
    if(a==="scad-da-pratica-apri"){
      let _cambiato=true;
      try{_cambiato=(_lavFoto==null)||(_lavValori()!==_lavFoto);}catch(_){}
      if(_cambiato&&!(await gconfirm("Apro la scadenza al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?")))return;
      const lavId=t.dataset.lav;
      const {data:s1,error:e1}=await sb.from("gest_scadenze").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
      if(e1){toast("Non riesco ad aprire la scadenza: "+e1.message);return;}
      if(!s1){toast("Questa scadenza non c'è più");if(typeof renderLavScadenze==="function")renderLavScadenze();return;}
      await scadForm(s1);
      if(lavId&&document.querySelector("#sheet #s-tit")&&$("#overlay").classList.contains("open"))_tornaAlLavoro=lavId;
      return;
    }
    /* 20 nov 2026 (sì di Alex) — computo e SAL dentro la pratica dello studio */
    if(a==="lav-comp-apri"||a==="lav-sal-apri"||a==="lav-sal-nuovo"){
      let _cambiato=true;
      try{_cambiato=(_lavFoto==null)||(_lavValori()!==_lavFoto);}catch(_){}
      if(_cambiato&&!(await gconfirm("Apro il computo al posto di questa pratica.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?")))return;
      const compId=(a==="lav-comp-apri")?id:t.dataset.comp;
      return salDaPratica(compId,(a==="lav-comp-apri")?undefined:(a==="lav-sal-apri"?id:null),t.dataset.lav);
    }
    if(a==="scad-vista"){scadVista=t.dataset.v;renderScadenze();return;}
    if(a==="scad-persona"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      /* 14 agosto notte: passa dalla stessa porta di «sq-edit», che rilegge.
         Prima, se la persona era in cache, si apriva con i dati vecchi: e' la
         stessa scheda e lo stesso rischio di riscrivere sopra. */
      return squadraApri(id);
    }
    if(a==="edit-scad"){
      const inCache=scadCache.find(s=>String(s.id)===String(id));
      if(inCache)return scadForm(inCache);
      /* 12 agosto 2026 (sera) — dal calendario si puo' aprire una scadenza senza
         aver mai aperto lo Scadenzario: la memoria e' vuota e prima si apriva un
         modulo NUOVO e vuoto, che salvando creava un DOPPIONE invece di
         modificare quella. Adesso la scadenza si va a prendere. */
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const {data:s1,error:e1}=await sb.from("gest_scadenze").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
      if(e1){toast("Non riesco ad aprire la scadenza: "+e1.message);return;}
      if(!s1){toast("Questa scadenza non c'è più");rinfresca("calendario","scadenzario");return;}
      return scadForm(s1);
    }
    if(a==="save-scad")return saveScad(id);
    if(a==="scad-stato"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v;
      /* 12 agosto 2026 (sera) — .neq("stato",v) e' la rete di sicurezza contro i
         DOPPIONI: qui sotto, se la scadenza si ripete, "fatta" ne crea un'altra.
         Senza questo controllo bastava premere "Segna fatta" due volte (o
         cliccare due volte, o riaprire la scheda) per ritrovarsi due, tre
         scadenze future identiche. Cosi' invece il database non tocca niente e
         non nasce niente. */
      /* 18 nov 2026 — si chiede indietro TUTTA la riga: la prossima si fa da
         quella, non dalla memoria dell'elenco (che dal Calendario puo' essere
         vuota: e allora la prossima non nasceva, senza dirlo). */
      const {data:okSc,error}=await sb.from("gest_scadenze").update({stato:v}).eq("id",id).eq("user_id",sbUid).neq("stato",v).select("*");
      if(error){toast("Errore: "+error.message);return;}
      if(!okSc||!okSc.length){
        const _g=scadCache.find(x=>String(x.id)===String(id));
        if(_g&&String(_g.stato||"")===v){
          toast(v==="fatta"?"Era già segnata fatta":"Era già aperta");
          renderScadenze();return;
        }
        toast("Non salvato: nessuna riga modificata. Riprova.");return;
      }
      /* ===== 12 agosto 2026 — la prossima nasce da sola =====
         Se questa scadenza si ripete, appena la segni fatta ne creo un'altra
         con la stessa roba e la data spostata avanti. Prima segnavi fatta la
         revisione e non ti avvisava mai piu'. */
      let _rip="";
      if(v==="fatta"){
        try{
          const vecchia=(okSc&&okSc[0]&&okSc[0].titolo!==undefined)?okSc[0]:scadCache.find(x=>String(x.id)===String(id));
          const n=vecchia?(+vecchia.ripeti_mesi||0):0;
          if(n>0&&vecchia.data_scadenza){
            const nuovaData=_mesiDopo(vecchia.data_scadenza,n);
            const _rep=vecchia.mestiere_id||curMestiere();
            /* 18 nov 2026 — collaudo dello Scadenzario: «Segna fatta», «Riapri»,
               «Segna fatta» di nuovo faceva DUE prossime uguali (visto dal vivo).
               Se la prossima c'e' gia' (stesso nome, stesso giorno, ancora
               aperta) non se ne fa un'altra. Se non si riesce a guardare, si
               crea lo stesso: meglio un doppione che una scadenza persa. */
            let _giaC=false;
            try{
              const {data:gia}=await sb.from("gest_scadenze").select("id")
                .eq("user_id",sbUid).eq("mestiere_id",_rep).eq("titolo",vecchia.titolo)
                .eq("data_scadenza",nuovaData).neq("stato","fatta").limit(1);
              _giaC=!!(gia&&gia.length);
            }catch(_){}
            if(_giaC) _rip=" — la prossima c'è già: è il "+fdate(nuovaData);
            else{
              /* la persona: prima la prossima la perdeva (il patentino di Mario
                 rinasceva senza Mario). Se la colonna non c'e', si riprova senza. */
              const _nuova={
                user_id:sbUid, mestiere_id:_rep,
                titolo:vecchia.titolo, tipo_pratica:vecchia.tipo_pratica||null,
                cliente_id:vecchia.cliente_id||null, mezzo_id:vecchia.mezzo_id||null,
                lavoro_id:vecchia.lavoro_id||null, note:vecchia.note||null,
                operatore_id:vecchia.operatore_id||null,
                avvisa:vecchia.avvisa!==false, ripeti_mesi:n,
                data_scadenza:nuovaData, stato:"aperta"};
              let {error:e2}=await sb.from("gest_scadenze").insert(_nuova);
              if(e2&&String(e2.message||"").indexOf("operatore_id")>=0){
                delete _nuova.operatore_id;
                ({error:e2}=await sb.from("gest_scadenze").insert(_nuova));
              }
              if(e2)_rip=" — ma la prossima non è stata creata: "+e2.message;
              else  _rip=" — la prossima è il "+fdate(nuovaData);
            }
          }
        }catch(e){}
      }
      renderScadenze();rinfresca("riepilogo","calendario");
      toast(v==="fatta"?("Scadenza completata ✔"+_rip):"Riaperta");return;
    }
    if(a==="del-scad"){if(!sbUid){toast("Devi essere loggato");return;}
      /* 11 nov 2026 — collaudo 3.11: la domanda dice QUALE scadenza (regola 22) */
      const _cest=!!(window.cestinoAttivo&&window.cestinoAttivo());
      const _sc=((typeof scadCache!=="undefined"?scadCache:[])||[]).find(x=>String(x.id)===String(id));
      const _nm=_sc&&_sc.titolo?"«"+String(_sc.titolo).slice(0,80)+"»":"questa scadenza";
      const _ok=(_cest&&typeof window.tiChiedi==="function")
        ?await window.tiChiedi("La riprendi dal Cestino quando vuoi.",{titolo:"Mettere nel cestino "+_nm+"?",si:"Sì, nel cestino",no:"No",rosso:true})
        :await gconfirm("Eliminare "+_nm+"?");
      if(_ok){const {data:okDs,error}=await sb.from("gest_scadenze").delete().eq("id",id).eq("user_id",sbUid).select("id");if(error){toast("Errore: "+error.message);return;}if(!okDs||!okDs.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}renderScadenze();rinfresca("calendario","riepilogo");toast(_cest?"Scadenza nel cestino: la riprendi da lì":"Scadenza eliminata");}return;}
    if(a==="new-dip")return squadraForm();
    if(a==="sq-add")return squadraAdd();
    if(a==="sq-edit"){
      /* 15 nov 2026 (sesto giro, n. 1) — dal margine di un lavoro: la scheda
         della persona prende il posto del lavoro, e quello che nel lavoro non
         e' salvato si perde. Si chiede, come per «＋ nuovo cliente» (quick-cli),
         e chiusa la scheda si torna nel lavoro (vedi _tornaAlLavoro). */
      const _lid=(t.closest("#sheet")&&typeof editing!=="undefined"&&editing&&editing.realId)?editing.realId:null;
      if(!_lid)return squadraApri(id);
      const _pp=(dipCache||[]).find(d=>String(d.id)===String(id));
      const _chi=_pp&&_pp.nome?"di "+String(_pp.nome).slice(0,60):"della persona";
      const _pro=(typeof ruoloUtente!=="undefined"&&ruoloUtente==="professionista");   /* nello studio il lavoro si chiama pratica */
      if(!(await gconfirm("Apro la scheda "+_chi+" al posto di "+(_pro?"questa pratica":"questo lavoro")+".\n\nSe hai scritto qualcosa senza salvare, va perso. Quando chiudi la scheda torni "+(_pro?"alla pratica":"al lavoro")+". Continuare?")))return;
      await squadraApri(id);
      if(document.querySelector("#sheet #d-nome")&&$("#overlay").classList.contains("open"))_tornaAlLavoro=_lid;
      return;
    }
    if(a==="sq-save")return squadraSave(id);
    if(a==="sq-copy"){copyLink(t.dataset.link);return;}
    if(a==="sq-qr"){mostraQrInvito(t.dataset.link,t.dataset.nome||"");return;}
    if(a==="sq-invito")return squadraNuovoInvito(id);
    if(a==="sq-wa"){window.open(t.dataset.wa,"_blank");return;}
    if(a==="sq-revoca"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      /* 18 nov 2026 — il «Sì» diceva «Sì, elimina»: qui non si elimina nessuno */
      if(!(typeof window.tiChiedi==="function"
        ?await window.tiChiedi("Dal telefono non entra più. La persona resta in squadra: glielo ridai con «Nuovo invito».",{titolo:"Togliere l'accesso a "+String(t.dataset.nome||"questa persona").slice(0,60)+"?",si:"Sì, togli l'accesso",no:"No",rosso:true})
        :await gconfirm("Rimuovere l'accesso a "+t.dataset.nome+"? Non potrà più entrare nel gestionale.")))return;
      const {data:okRev,error}=await sb.from("gest_membri").update({stato:"revocato"}).eq("operatore_id",id).eq("impresa_id",sbUid).select("operatore_id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okRev||!okRev.length){toast("Non rimosso: nessuna riga modificata. Riprova.");return;}
      renderDip();toast("Accesso tolto");return;
    }
    if(a==="sq-del")return dipElimina(id);
    if(a==="save-dip")return saveDip(id);
    /* 12 agosto 2026 (sera) — "edit-dip" e "del-dip" tolti: lavoravano sullo
       stesso archivio locale morto (db().dipendenti, sempre vuoto). La squadra
       vera si modifica con "sq-edit" e sta su gest_operatori. */
    /* ---- Fornitori ---- */
    if(a==="new-forn")return fornForm(null);
    /* 24 nov 2026 (giro della pratica, studio) — «+ Nuovo fornitore» da dentro la
       fattura da pagare: prima, salvato il fornitore, si chiudeva tutto e la
       fattura che stavi scrivendo spariva. Ora si torna alla fattura, col
       fornitore nuovo già scelto e quello che avevi scritto ancora lì. */
    if(a==="new-forn-da-ff"){
      const v=s=>{const e=document.querySelector(s);return e?e.value:"";};
      window._ffRitorno={lavoro_id:v("#ff-lav")||null,numero:v("#ff-num"),data:v("#ff-data"),
        importo:v("#ff-imp"),scadenza:v("#ff-scad"),note:v("#ff-note"),pratica:window._tornaPraticaDaFf||null};
      return fornForm(null);
    }
    if(a==="forn-scheda")return fornScheda(id);
    if(a==="edit-forn")return fornForm(fornCache.find(x=>String(x.id)===String(id)));
    if(a==="edit-forn-full"){
      const {data:rf}=await sb.from("gest_fornitori").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
      return fornForm(rf||fornCache.find(x=>String(x.id)===String(id)));
    }
    if(a==="forn-ti-cerca")return fornTiCerca();
    if(a==="forn-ti-scegli")return fornTiScegli(t.dataset.i);
    if(a==="forn-ti-scollega"){
      if($("#fo-tid"))$("#fo-tid").value="";
      const st=$("#fo-ti-stato");if(st)st.innerHTML="";
      toast("Collegamento rimosso: ricordati di salvare");return;
    }
    if(a==="new-fattf-forn")return fattfForm({fornitore_id:id});
    /* 20 nov 2026 — fatture dei fornitori dentro la pratica / il lavoro */
    if(a==="lav-ff-apri"||a==="lav-ff-nuova"){
      let _cambiato=true;
      try{_cambiato=(_lavFoto==null)||(_lavValori()!==_lavFoto);}catch(_){}
      const _pro=(typeof ruoloUtente!=="undefined"&&ruoloUtente==="professionista");
      if(_cambiato&&!(await gconfirm("Apro la fattura al posto di "+(_pro?"questa pratica":"questo lavoro")+".\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?")))return;
      return lavFfApri(a==="lav-ff-apri"?id:null,a==="lav-ff-apri"?t.dataset.lav:id);
    }
    if(a==="forn-doc")return fornDocApri(id);
    if(a==="forn-doc-scegli"){const i=$("#forn-doc-file");if(i)i.click();return;}
    if(a==="lav-doc-scegli"){const i=$("#lav-doc-file");if(i)i.click();return;}
    if(a==="lav-doc-del")return lavDocElimina(id);
    if(a==="forn-doc-del")return fornDocElimina(id);
    if(a==="save-forn")return saveForn(id||null);
    if(a==="del-forn"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const nf=fattfCache.filter(x=>String(x.fornitore_id)===String(id)).length;
      /* 11 nov 2026 — collaudo 3.13: dice quale fornitore e che va nel Cestino */
      const _fo=(fornCache||[]).find(x=>String(x.id)===String(id));
      if(!(await window.chiediCestino(_fo&&_fo.nome?"«"+_fo.nome+"»":"questo fornitore",
        nf?(nf===1?"Ci va anche la sua fattura registrata. ":"Ci vanno anche le sue "+nf+" fatture registrate. ")+"Li riprendi dal Cestino quando vuoi.":"")))return;
      const {data:okDf2,error}=await sb.from("gest_fornitori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDf2||!okDf2.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
      /* col cestino la catena del database non scatta più: le sue fatture le
         mettiamo via a mano, se no restavano vive e continuavano a contare
         nel "da pagare" agganciate a un fornitore che non c'e' più. */
      try{ await sb.from("gest_fatture_fornitori").delete().eq("fornitore_id",id).eq("user_id",sbUid); }catch(e){}
      /* 24 nov 2026 (collaudo Cestino dello studio) — anche i suoi DOCUMENTI.
         Restavano vivi e invisibili (la scheda del fornitore non c'era piu'), e
         «Elimina per sempre» del fornitore si rifiutava per colpa loro. Col
         Cestino questa «delete» scrive solo la data: tornano col fornitore. */
      if(window.cestinoAttivo&&window.cestinoAttivo()){ try{ await sb.from("gest_foto").delete().eq("fornitore_id",id).eq("user_id",sbUid); }catch(e){} }
      closeSheet();renderFornitori();rinfresca("riepilogo");toast("Fornitore nel cestino: lo riprendi da lì");return;
    }
    if(a==="new-fattf")return fattfForm(null);
    if(a==="edit-fattf")return fattfForm(fattfCache.find(x=>String(x.id)===String(id)));
    if(a==="save-fattf")return saveFattf(id||null);
    if(a==="del-fattf"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const _ff=(fattfCache||[]).find(x=>String(x.id)===String(id))||{}, _fn=((fornCache||[]).find(x=>String(x.id)===String(_ff.fornitore_id))||{}).nome;
      const _nf="la fattura"+(_ff.numero?" n. "+_ff.numero:"")+(_fn?" di «"+_fn+"»":"");
      if(!(await window.chiediCestino(_nf,"La riprendi dal Cestino quando vuoi.")))return;
      const {data:okDff,error}=await sb.from("gest_fatture_fornitori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDff||!okDff.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}
      renderFornitori();rinfresca("riepilogo");toast("Fattura nel cestino: la riprendi da lì");return;
    }
    if(a==="fattf-stato"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const v=t.dataset.v;
      const patch={stato:v,data_pagata:v==="pagata"?todayStr():null};
      const {data:okFs,error}=await sb.from("gest_fatture_fornitori").update(patch).eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okFs||!okFs.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
      renderFornitori();rinfresca("riepilogo");
      if(t.dataset.forn)fornScheda(t.dataset.forn);   /* dalla scheda: si riapre aggiornata */
      toast(v==="pagata"?"Segnata pagata ✔":"Riaperta");return;
    }
    if(a==="quick-cli"){
      /* stesso motivo di scad-da-pratica: la finestra è una sola e questa
         prende il posto di quella aperta (9/8/2026) */
      if(!(await gconfirm("Apro il modulo del cliente al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?")))return;
      return cliForm(null);
    }
    if(a==="close"){
      /* 16 nov 2026 — dentro una LAVORAZIONE o un SAL «Indietro» torna al
         computo: prima chiudeva tutto e ci si ritrovava nell'elenco dei
         computi, a riaprire il computo per ogni lavorazione guardata. */
      try{
        if(document.querySelector("#sheet #cv-desc")&&typeof compVociCompId!=="undefined"&&compVociCompId)return compTornaAlComputo();
        /* la schermata «Controlla quello che ho letto» (PDF del geometra):
           «Annulla» e «Indietro» riportano al computo, non lo chiudono */
        if(document.querySelector("#sheet #cp-lista")&&typeof compVociCompId!=="undefined"&&compVociCompId)return compTornaAlComputo();
        if(document.querySelector("#sheet #sal-voci")&&typeof salTorna==="function")return salTorna();
        /* 20 nov 2026 — computo aperto dalla pratica: chiuso, si torna nella pratica */
        /* 20 nov 2026 — fattura di un fornitore aperta dalla pratica: si torna li' */
        const _tf=window._tornaPraticaDaFf;
        if(_tf&&document.querySelector("#sheet #ff-forn")){window._tornaPraticaDaFf=null;closeSheet();return lavoroApri(_tf);}
        const _tp=window._tornaPraticaDaComp;
        if(_tp&&document.querySelector("#sheet #co-nav")&&typeof compVociCompId!=="undefined"&&String(compVociCompId)===_tp.comp){
          window._tornaPraticaDaComp=null; closeSheet(); return lavoroApri(_tp.lav);
        }
      }catch(_e){}
      return closeSheet();
    }
  });

  /* ---- la barra in basso (solo telefono): preme la voce vera del menu ---- */
  (function barraBasso(){
    const bb=document.getElementById("barra-basso"); if(!bb)return;
    bb.querySelectorAll("button[data-vai]").forEach(function(b){
      b.addEventListener("click",function(){
        const v=document.querySelector('nav.tabs button[data-tab="'+b.dataset.vai+'"]');
        if(v)v.click();
      });
    });
    /* 29/09/2026 — le etichette della barra sono corte: «Lavori e interventi»
       non ci sta e usciva «Lavori e i…». Resta la prima parola (Lavori,
       Pratiche, Incarichi). Si rifa se un altro pezzo cambia il testo. */
    function corte(){
      bb.querySelectorAll("button[data-vai] span").forEach(function(s){
        const t=s.textContent.trim();
        if(t.indexOf(" ")>0&&t.length>9){ s.title=t; s.textContent=t.split(" ")[0]; }
      });
    }
    corte();
    try{ new MutationObserver(corte).observe(bb,{subtree:true,childList:true,characterData:true}); }catch(e){}
    function sincro(){
      const att=document.querySelector("nav.tabs button.active");
      const k=att?att.dataset.tab:"";
      bb.querySelectorAll("button[data-vai]").forEach(function(b){
        b.classList.toggle("on", b.dataset.vai===k);
      });
    }
    /* la sezione cambia anche da altre strade (deep link, schede del
       Riepilogo, «torna ai lavori»): invece di rincorrerle tutte, si guarda
       quale voce del menu e' accesa. */
    try{
      const nav=document.querySelector(".side nav.tabs");
      if(nav)new MutationObserver(sincro).observe(nav,{subtree:true,attributes:true,attributeFilter:["class"]});
    }catch(e){}
    sincro();
  })();

  $$("nav.tabs button").forEach(b=>{
    b.onclick=()=>{
      /* 22 agosto 2026 — i pulsanti che portano a un'ALTRA pagina (Noleggio).
         Vanno riconosciuti per primi: non hanno una sezione da accendere, e
         senza questa riga il menu andrebbe a cercare "#undefined" e morirebbe
         in silenzio, portandosi dietro tutti gli altri pulsanti. */
      if(b.dataset.vai){location.href=b.dataset.vai;return;}
      $$("nav.tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
      /* 18 nov 2026 — Attrezzature sta dentro «Mezzi e attrezzature»: nel menu si accende quella */
      if(b.classList.contains("mz-dentro")){const _mzb=$('nav.tabs button[data-tab="mezzi"]');if(_mzb)_mzb.classList.add("active");}
      /* 18 nov 2026 — Promemoria sta dentro «Scadenze e promemoria»: nel menu si accende quella */
      if(b.classList.contains("sp-dentro")){const _spb=$('nav.tabs button[data-tab="scadenzario"]');if(_spb)_spb.classList.add("active");}
      /* 18 nov 2026 — Agenda sta dentro «Squadra e agenda» */
      if(b.classList.contains("ag-dentro")){const _agb=$('nav.tabs button[data-tab="squadra"]');if(_agb)_agb.classList.add("active");}
      /* 24 nov 2026 — studio: SAL dentro «Computo e SAL», Richieste dal sito dentro «Preventivi e richieste» */
      if(b.classList.contains("st-dentro")){const _stb=$('nav.tabs button[data-tab="'+(b.dataset.tab==="sal"?"computi":"preventivi")+'"]');if(_stb)_stb.classList.add("active");}
      $$("section").forEach(s=>s.classList.remove("active"));$("#"+b.dataset.tab).classList.add("active");
      /* Render pigro: la sezione si ridisegna all'apertura se è segnata "da
         rifare" (dopo un salvataggio o all'ingresso nel reparto). Alcune si
         ridisegnano sempre: lavori/agenda cambiano forma con la larghezza
         dello schermo, mappa e richieste si disegnano solo quando le apri. */
      const tb=b.dataset.tab;
      const SEMPRE=["lavori","agenda","mappa","richieste","dalsito","mezzi","attrezzature","assistenza","fisco"]; /* fisco: i soldi da incassare cambiano da Fatture, va sempre riletto */
      if(_tabSporchi.has(tb)||SEMPRE.includes(tb)){
        _tabSporchi.delete(tb);
        const fn=RENDER_TAB[tb];if(fn)fn();
      }
      const sd=document.querySelector(".side");if(sd)sd.classList.remove("open"); /* chiude il menu hamburger su mobile */
      window.scrollTo({top:0,behavior:"smooth"});
    };
  });
  /* chiude il menu "..." a ogni clic fuori dal pulsante che lo apre */
  document.addEventListener("click",e=>{if(!e.target.closest(".lav-dots"))tabChiudiPop();});
  /* la tabella si ridisegna al passaggio desktop/mobile: sotto 880px tornano le card.
     ATTENZIONE: su iPhone e iPad vecchi (iOS 13 e prima) matchMedia non ha
     addEventListener, ha solo il vecchio addListener. Senza questo controllo la riga
     lanciava un errore e tutto quello che viene dopo -- compreso l'avvio -- non
     partiva: schermata bianca. */
  try{
    const _mqTab=window.matchMedia("(min-width:881px)");
    const _mqCambio=()=>{if(cur){renderJobs();renderAgenda();}};
    if(_mqTab.addEventListener)_mqTab.addEventListener("change",_mqCambio);
    else if(_mqTab.addListener)_mqTab.addListener(_mqCambio);
  }catch(e){}
  /* i due filtri a tendina: l'elemento resta lo stesso a ogni render (cambiano solo
     le <option>), quindi il listener si aggancia una volta sola qui */
  if($("#ag-op-sel"))$("#ag-op-sel").onchange=e=>{agFilter.op=e.target.value;renderAgenda();};
  if($("#gal-op-sel"))$("#gal-op-sel").onchange=e=>{galFilter.op=e.target.value;renderGalleria();};
  if($("#gal-lav-sel"))$("#gal-lav-sel").onchange=e=>{galFilter.lav=e.target.value;renderGalleria();};
  $("#f-search").oninput=e=>{filter.q=e.target.value;renderJobs();};
  if($("#cli-search"))$("#cli-search").oninput=e=>{cliQ=e.target.value;renderClienti();};
  /* la ricerca del Cestino non rilegge il database: filtra quello che c'e' gia'
     in memoria, quindi puo' girare a ogni lettera senza pesare */
  if($("#cest-search"))$("#cest-search").oninput=e=>{cestQ=e.target.value;renderCestino(true);};
  if($("#dip-search"))$("#dip-search").oninput=e=>{dipQ=e.target.value;renderDip();};
  if($("#lf-file"))$("#lf-file").onchange=e=>{uploadLavoroFoto(e.target.files);e.target.value="";};
  if($("#lf-video-file"))$("#lf-video-file").onchange=e=>{uploadLavoroVideo(e.target.files);e.target.value="";};
  if($("#fatt-pdf-file"))$("#fatt-pdf-file").onchange=e=>{uploadFatturaPdf(e.target.files[0]);e.target.value="";};
  if($("#cli-doc-file"))$("#cli-doc-file").onchange=e=>{uploadDocCliente(e.target.files);e.target.value="";};
  if($("#forn-doc-file"))$("#forn-doc-file").onchange=e=>{uploadDocFornitore(e.target.files);e.target.value="";};
  if($("#lav-doc-file"))$("#lav-doc-file").onchange=e=>{uploadDocLavoro(e.target.files);e.target.value="";};

