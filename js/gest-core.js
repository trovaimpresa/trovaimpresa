// [SPOSTATO] gest-core.js: le righe 1-11563 del vecchio file ora stanno in: gest-base.js (righe 1-421), gest-reparti.js (righe 422-1251), gest-ingresso.js (righe 1252-1842), gest-ai-moduli.js (righe 1843-3411), gest-riepilogo-schede.js (righe 3412-3986), gest-schede-clienti.js (righe 3987-4805), gest-carte-documenti.js (righe 4806-5415), gest-richieste-chat.js (righe 5416-6041), gest-scadenze-pratiche.js (righe 6042-6983), gest-commercialista.js (righe 6984-7418), gest-elimina-reparto.js (righe 7419-8084), gest-ore-spese.js (righe 8085-9228), gest-preventivi.js (righe 9229-10132), gest-cestino.js (righe 10133-11291), gest-ricerca.js (righe 11292-11563). Qui resta il resto.
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
    promemoria:_rt("renderPromemoria"), fisco:_rt("renderFisco")
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

  document.addEventListener("click",e=>{
    const t=e.target.closest("[data-action]");if(!t)return;
    const a=t.dataset.action,id=t.dataset.id;
    /* i pulsanti in fondo alla finestra: prima si chiude, poi si fa.
       Se no si cambia lo stato e si resta davanti al modulo vecchio. */
    if(t.dataset.chiudi){ const _ov=$("#overlay"); if(_ov)_ov.classList.remove("open"); }
    /* «Apri» su una scheda: le altre azioni di quella scheda aspettano qui,
       e se le prende la finestra appena si apre (vedi openSheetGrande). */
    if(AZ_APERTURA.test(String(a))) _azPendenti=AZ_APRI[String(a)+":"+String(id==null?"":id)]||null;
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
    if(a==="edit-cred")return credForm(credCache.find(c=>String(c.id)===String(id)));
    if(a==="save-cred")return saveCred(id);
    if(a==="cred-anno"){credAnno=t.dataset.v;renderCrediti();return;}
    if(a==="del-cred")return delCred(id);
    if(a==="verbale")return verbaleForm(id);
    if(a==="verbale-pdf")return verbalePdf(id);
    if(a==="ore-add")return oreAdd();
    if(a==="ore-del"){if(gconfirm("Eliminare questa riga di ore?"))return oreDel(id);return;}
    if(a==="rap-del")return rapCestina(id);   /* la domanda la fa lui: gli serve il numero delle ore */
    if(a==="asst-invia")return asstInvia();
    if(a==="asst-allega")return asstScegliFile();
    if(a==="asst-togli-file")return asstTogliFile();
    if(a==="spesa-del"){if(confirm("Eliminare questa spesa?"))sb.from("gest_spese").delete().eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non eliminata: "+(res.error?res.error.message:"nessuna riga trovata. Riprova."));return;}renderSpeseBlock(speseLavoroId);});return;}
    if(a==="scegli-tipo")return _salvaTipo(id);   /* 14 agosto: chi non ha mai detto che lavoro fa */
    if(a==="landing-riprova")return renderLanding();
    if(a==="new-computo")return computoForm(null);
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
    /* i due pulsanti stanno DENTRO la scheda del computo aperto: l'id e'
       quello, non serve leggerlo dal pulsante */
    if(a==="crono-pdf")return cronoPdf(ctrComputoId);
    if(a==="var-pdf")return variantePdf(ctrComputoId);
    if(a==="comp-importa")return compApriFile();
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
    if(a==="ds-apri")return dsApri(id);
    if(a==="ds-contatti")return dsContatti(id);
    if(a==="ds-prev")return dsCreaPreventivo(id);
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
    if(a==="prev-stato"){sb.from("gest_preventivi").update({stato:t.dataset.v}).eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non salvato: "+(res.error?res.error.message:"nessuna riga modificata. Riprova."));return;}rinfresca("preventivi","riepilogo");toast("Preventivo aggiornato ✔");});return;}
    if(a==="prev-to-lavoro")return prevToLavoro(id);
    if(a==="prev-to-fatt")return fattDaPreventivoId(id);
    if(a==="del-prev"){if(gconfirm("Eliminare questo preventivo?"))sb.from("gest_preventivi").delete().eq("id",id).eq("user_id",sbUid).select("id").then(res=>{if(res.error||!res.data||!res.data.length){toast("Non eliminato: "+(res.error?res.error.message:"nessuna riga trovata. Riprova."));return;}rinfresca("preventivi","riepilogo");toast("Preventivo eliminato");});return;}
    if(a==="prev-pdf")return prevPdf(id);
    if(a==="prev-incarico")return incaricoForm(id);
    if(a==="incarico-pdf")return incaricoPdf(id);
    if(a==="prev-ordine")return ordineForm(id);
    if(a==="ordine-pdf")return ordinePdf(id);
    if(a==="report-csv")return reportCsv();
    if(a==="lav-vista"){filter.vista=t.dataset.v;renderJobs();return;}
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
    if(a==="rie-riprova"){const g=$("#rie-grid");if(g)g.innerHTML='<div class="rc-caricamento">Caricamento del riepilogo…</div>';renderRiepilogo();renderContatori();return;}
    /* dal Riepilogo: la patente a crediti sta nella finestra Dati azienda,
       che non è una scheda del menu — quindi apro direttamente quella. */
    if(a==="rie-azienda")return aziendaForm();
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
    if(s.querySelector(".sh-cols,.copag,.cp-riga")) s.classList.add("sh-lunga");
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
  function closeSheet(){$("#overlay").classList.remove("open");}
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
    if(a==="map"){window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(t.dataset.q),"_blank");return;}
    if(a==="new-job")return jobForm(null,"",null,true);
    if(a==="lf-open")return showLavoroFoto(t.dataset.id,t.dataset.desc);
    if(a==="lf-back"){$$("nav.tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="lavori"));$$("section").forEach(s=>s.classList.toggle("active",s.id==="lavori"));renderJobs();window.scrollTo(0,0);return;}
    /* ---- fatture ---- */
    if(a==="new-fattura")return fattNuovaScegli();
    if(a==="fatt-vuota"){closeSheet();return fattForm(null);}
    if(a==="fatt-da-lavori")return fattDaLavoriScegli();
    if(a==="fatt-da-lavori-ok")return fattDaLavoriConferma();
    if(a==="fatt-da-prev")return fattDaPreventivoScegli();
    if(a==="fatt-da-prev-ok")return fattDaPreventivoConferma();
    if(a==="edit-fatt"){const f=fattCache.find(x=>String(x.id)===String(id));if(f)fattForm(f);return;}
    if(a==="save-fatt")return saveFattura(id||null);
    if(a==="fatt-riga-add"){$("#fatt-righe").insertAdjacentHTML("beforeend",fattRigaHtml());fattTotaleLive();return;}
    if(a==="fatt-riga-del"){const d=t.closest("[data-riga]");if(d){d.remove();fattTotaleLive();}return;}
    if(a==="fatt-stato")return fattCambiaStato(id,t.dataset.v);
    if(a==="del-fatt")return eliminaFattura(id);
    if(a==="fatt-pdf")return fatturaPdf(id);
    if(a==="fatt-xml")return fatturaXml(id);
    if(a==="fatt-sdi")return fattSdi(id);   /* 29/09/2026 — js/gest-sdi.js */
    if(a==="new-job-date"){closeSheet();return jobForm(null,t.dataset.d,null,true);}
    if(a==="edit-job"){
      closeSheet();
      /* 12 agosto 2026 — maybeSingle + il controllo. Prima era .single(): se la
         riga non c'era piu' (eliminata da un altro dispositivo, o finita nel
         Cestino mentre l'elenco a schermo era vecchio) data restava null, e la
         riga dopo leggeva data.data_prevista su null. Risultato: la finestra si
         chiudeva e NON SUCCEDEVA NIENTE, senza un messaggio. Mancava anche il
         filtro sull'utente, che c'e' in tutte le altre letture puntuali. */
      const{data}=await sb.from('gest_lavori').select('*').eq('id',id).eq('user_id',sbUid).maybeSingle();
      if(!data){toast("Questo lavoro non c'è più: forse è nel Cestino, o l'ha eliminato qualcun altro");return;}
      jobForm({...data, dataPrevista:data.data_prevista, clienteId:data.cliente_id, assegnatoId:data.operatore_id, fattStato:data.fatt_stato, /* 9/8/2026: mancava la traduzione di questi due, e la casella 'Cosa è stato fatto' si apriva VUOTA: al primo Salva il consuntivo scritto la volta prima veniva cancellato. */ lavoroSvolto:data.lavoro_svolto, note:data.note});if(editing){editing.realId = data.id;renderSpeseBlock(data.id,+data.importo||0);renderMezziBlock(data.id);renderLavMedia();renderLavScadenze();renderOreBlock(data.id);renderRapportiniBlock(data.id);renderDocLavoro(data.id);}return;}
    /* renderFotoBlocks va richiamato QUI: jobForm lo chiama alla fine, ma realId
       viene assegnato solo dopo, e senza quello non sa quale lavoro interrogare. */
    if(a==="save-job")return saveJob();
    if(a==="view-foto"){const src=fotoCache[t.dataset.id];if(src){$("#lb-img").src=src;$("#lightbox").classList.add("open");}return;}
    if(a==="close-lb"){$("#lightbox").classList.remove("open");return;}
    if(a==="del-foto"){if(confirm("Eliminare questa foto?"))deleteFoto(t.dataset.id);return;}
    if(a==="gal-tipo"){galFilter.tipo=t.dataset.v;segmOn("#gal-tipo",t.dataset.v);renderGalleria();return;}
    if(a==="gal-media"){galFilter.media=t.dataset.v;segmOn("#gal-media",t.dataset.v);renderGalleria();return;}
    if(a==="gal-nuovo"){galCaricaLavori().then(galUploadForm);return;}
    if(a==="mp-vista"){mpVista=t.dataset.v;segmOn("#mp-vista",t.dataset.v);renderMappa();return;}
    if(a==="mp-ricalcola"){toast("Ricalcolo le distanze…");renderMappa(true);return;}
    if(a==="vai-galleria"){
      galFilter.lav=t.dataset.id;galFilter.media="";galFilter.tipo="";galFilter.op="";
      closeSheet();
      const b=document.querySelector('nav.tabs button[data-tab="galleria"]');
      if(b)b.click();
      segmOn("#gal-media","");segmOn("#gal-tipo","");
      renderGalleria();window.scrollTo(0,0);
      return;
    }
    if(a==="gal-carica")return galCarica();
    if(a==="gal-del-foto"){if(confirm("Eliminare questa foto?"))galDelFoto(t.dataset.id);return;}
    if(a==="gal-del-video"){if(confirm("Eliminare questo video?"))galDelVideo(t.dataset.id);return;}
    if(a==="gal-play"){const u=galVideoCache[t.dataset.id];if(u)window.open(u,"_blank");else toast("Video non ancora pronto, riprova tra un attimo");return;}
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
      if(!gconfirm(window.cestinoAttivo&&window.cestinoAttivo()
          ? "Eliminare questo lavoro? Finisce nel Cestino: da lì puoi rimetterlo a posto."
          : "Eliminare questo lavoro? L'azione non si può annullare."))return;
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
      renderAll();toast("Lavoro eliminato ✔");return;
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
      rinfresca("lavori","riepilogo","agenda","calendario");toast("Stato: "+(statoLabel[v]||v));return;
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
    if(a==="new-cli")return cliForm(null,t.dataset.tipo||"privato");
    if(a==="commercialista")return commForm();
    if(a==="save-comm")return saveComm();
    if(a==="comm-doc")return docCommApri();
    if(a==="apri-cli")return cliScheda(id);
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
      return cliForm(pieno||cliCache.find(c=>c.id===id));
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
      if(!gconfirm(
          (usi?`Questo mezzo è collegato a ${usi} lavori. `:"")
          +(nSc?`Ha ${nSc} ${nSc===1?"scadenza":"scadenze"} (revisione, assicurazione, bollo…): ${nSc===1?"va":"vanno"} nel Cestino insieme a lui e ${nSc===1?"torna":"tornano"} se lo rimetti a posto.\n\n`:"")
          +"Eliminare questo mezzo?"))return;
      const {data,error}=await sb.from("gest_mezzi").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Non eliminato: nessuna riga rimossa");return;}
      try{ await sb.from("gest_scadenze").delete().eq("mezzo_id",id).eq("user_id",sbUid); }catch(e){}
      renderMezzi();renderAttrezzature();renderScadenze();
      toast(nSc?("Eliminato — con "+nSc+(nSc===1?" scadenza":" scadenze")):"Eliminato");return;
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
      if(!confirm("Togliere questo mezzo dal lavoro?"))return;
      const {data,error}=await sb.from("gest_lavoro_mezzi").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Non rimosso: nessuna riga eliminata");return;}
      renderMezziBlock(mezziLavoroId);return;
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
      if(!gconfirm("Apro il modulo della scadenza al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?"))return;
      const lavId=id;
      const l=(lavCache||[]).find(x=>String(x.id)===String(lavId));
      return scadForm(null,{lavoro_id:lavId,cliente_id:(l&&l.cliente_id)||null});
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
      const {data:okSc,error}=await sb.from("gest_scadenze").update({stato:v}).eq("id",id).eq("user_id",sbUid).neq("stato",v).select("id");
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
          const vecchia=scadCache.find(x=>String(x.id)===String(id));
          const n=vecchia?(+vecchia.ripeti_mesi||0):0;
          if(n>0&&vecchia.data_scadenza){
            const nuovaData=_mesiDopo(vecchia.data_scadenza,n);
            const {error:e2}=await sb.from("gest_scadenze").insert({
              user_id:sbUid, mestiere_id:vecchia.mestiere_id||curMestiere(),
              titolo:vecchia.titolo, tipo_pratica:vecchia.tipo_pratica||null,
              cliente_id:vecchia.cliente_id||null, mezzo_id:vecchia.mezzo_id||null,
              lavoro_id:vecchia.lavoro_id||null, note:vecchia.note||null,
              avvisa:vecchia.avvisa!==false, ripeti_mesi:n,
              data_scadenza:nuovaData, stato:"aperta"});
            if(e2)_rip=" — ma la prossima non è stata creata: "+e2.message;
            else  _rip=" — la prossima è il "+fdate(nuovaData);
          }
        }catch(e){}
      }
      renderScadenze();rinfresca("riepilogo","calendario");
      toast(v==="fatta"?("Scadenza completata ✔"+_rip):"Riaperta");return;
    }
    if(a==="del-scad"){if(!sbUid){toast("Devi essere loggato");return;}if(gconfirm("Eliminare questa scadenza?")){const {data:okDs,error}=await sb.from("gest_scadenze").delete().eq("id",id).eq("user_id",sbUid).select("id");if(error){toast("Errore: "+error.message);return;}if(!okDs||!okDs.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}renderScadenze();rinfresca("calendario","riepilogo");toast("Scadenza eliminata");}return;}
    if(a==="new-dip")return squadraForm();
    if(a==="sq-add")return squadraAdd();
    if(a==="sq-edit")return squadraApri(id);
    if(a==="sq-save")return squadraSave(id);
    if(a==="sq-copy"){copyLink(t.dataset.link);return;}
    if(a==="sq-qr"){mostraQrInvito(t.dataset.link,t.dataset.nome||"");return;}
    if(a==="sq-wa"){window.open(t.dataset.wa,"_blank");return;}
    if(a==="sq-revoca"){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      if(!gconfirm("Rimuovere l'accesso a "+t.dataset.nome+"? Non potrà più entrare nel gestionale."))return;
      const {data:okRev,error}=await sb.from("gest_membri").update({stato:"revocato"}).eq("operatore_id",id).eq("impresa_id",sbUid).select("operatore_id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okRev||!okRev.length){toast("Non rimosso: nessuna riga modificata. Riprova.");return;}
      renderDip();toast("Accesso rimosso");return;
    }
    if(a==="sq-del")return dipElimina(id);
    if(a==="save-dip")return saveDip(id);
    /* 12 agosto 2026 (sera) — "edit-dip" e "del-dip" tolti: lavoravano sullo
       stesso archivio locale morto (db().dipendenti, sempre vuoto). La squadra
       vera si modifica con "sq-edit" e sta su gest_operatori. */
    /* ---- Fornitori ---- */
    if(a==="new-forn")return fornForm(null);
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
    if(a==="forn-doc")return fornDocApri(id);
    if(a==="forn-doc-scegli"){const i=$("#forn-doc-file");if(i)i.click();return;}
    if(a==="lav-doc-scegli"){const i=$("#lav-doc-file");if(i)i.click();return;}
    if(a==="lav-doc-del")return lavDocElimina(id);
    if(a==="forn-doc-del")return fornDocElimina(id);
    if(a==="save-forn")return saveForn(id||null);
    if(a==="del-forn"){
      if(!sbUid){toast("Devi essere loggato");return;}
      const nf=fattfCache.filter(x=>String(x.fornitore_id)===String(id)).length;
      if(!gconfirm(nf?`Eliminare questo fornitore? Verranno eliminate anche le sue ${nf} fatture registrate.`:"Eliminare questo fornitore?"))return;
      const {data:okDf2,error}=await sb.from("gest_fornitori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDf2||!okDf2.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
      /* col cestino la catena del database non scatta più: le sue fatture le
         mettiamo via a mano, se no restavano vive e continuavano a contare
         nel "da pagare" agganciate a un fornitore che non c'e' più. */
      try{ await sb.from("gest_fatture_fornitori").delete().eq("fornitore_id",id).eq("user_id",sbUid); }catch(e){}
      closeSheet();renderFornitori();rinfresca("riepilogo");toast("Fornitore eliminato");return;
    }
    if(a==="new-fattf")return fattfForm(null);
    if(a==="edit-fattf")return fattfForm(fattfCache.find(x=>String(x.id)===String(id)));
    if(a==="save-fattf")return saveFattf(id||null);
    if(a==="del-fattf"){
      if(!sbUid){toast("Devi essere loggato");return;}
      if(!gconfirm("Eliminare questa fattura?"))return;
      const {data:okDff,error}=await sb.from("gest_fatture_fornitori").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!okDff||!okDff.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}
      renderFornitori();rinfresca("riepilogo");toast("Fattura eliminata");return;
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
      if(!gconfirm("Apro il modulo del cliente al posto di questo.\n\nSe hai scritto qualcosa senza salvare, va perso. Continuare?"))return;
      return cliForm(null);
    }
    if(a==="close")return closeSheet();
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

  /* ============================================================
     ⛔ 5 SETTEMBRE 2026 — APRENDO IL GESTIONALE SI VEDE LA SCHERMATA
        DEI REPARTI, NON L'ULTIMO REPARTO DI IERI
     ============================================================
     Alessio, con due fotografie: «ogni volta che apro il gestionale si apre
     questa finestra (dentro il reparto «progetto casa», sezione Assistenza
     diretta), invece si deve aprire quella dei reparti».
     ⚠️ NON si toglie la memoria dell'ultimo reparto: il →23← agosto era
     stata messa apposta, perche' uscendo dal NOLEGGIO si finiva sulla
     schermata dei reparti e Alessio disse «mi fa uscire completamente».
     Le due cose non litigano se si distingue COME si e' arrivati qui:
       · si ARRIVA DA UN'ALTRA PAGINA DEL GESTIONALE (noleggio, negozio,
         config, operatore) -> si rientra dritti dov'era: e' un rientro.
       · si APRE il gestionale (dal pannello, da un preferito, scrivendo
         l'indirizzo, dalla barra FONDATORE) -> schermata dei reparti.
       · c'e' un link diretto con il cancelletto (#preventivi) -> comanda
         quello, come prima, se no il link non aprirebbe piu' niente.
     Cosi' l'ultimo reparto resta scritto (`gest_ultimo_reparto`) e la
     freccia «Indietro» continua a funzionare come sempre. */
  /* ⚠️ IL BIGLIETTINO HA UNA SCADENZA (→10← secondi), e non e' un vezzo.
     Chi torna dal Noleggio ci arriva con `history.back()`: se il browser
     ripesca la pagina dalla memoria (bfcache) questo codice non gira
     nemmeno, e il bigliettino resterebbe scritto. Mezz'ora dopo, aprendo
     il gestionale da zero nella stessa scheda, quel bigliettino vecchio lo
     rispedirebbe dentro al reparto — cioe' esattamente il difetto che
     stiamo togliendo. Con la scadenza un bigliettino vecchio non vale. */
  function _rientroDaGestionale(){
    try{
      const t=parseInt(sessionStorage.getItem("gest_rientro")||"0",10);
      sessionStorage.removeItem("gest_rientro");
      if(t && (Date.now()-t) < 10000) return true;
    }catch(e){}
    try{
      if(!document.referrer) return false;
      const u=new URL(document.referrer);
      if(u.origin!==location.origin) return false;
      return /gestionale-(noleggio|negozio|config|operatore)/.test(u.pathname);
    }catch(e){ return false; }
  }

  /* ⛔ 20 settembre 2026 — IL PROMEMORIA AL RITORNO DALL'ABBONAMENTO.
     Scelta di Alessio: quando uno disdice NON lo si obbliga a esportare —
     «non deve essere obbligato a esportare ma un consiglio». Chi ha gia'
     scaricato si troverebbe un passaggio in piu' proprio mentre se ne va, e
     chi non scarica puo' tornare a farlo quando vuole (anche dal muro del
     pagamento, da oggi). Quindi: una riga, un tasto, e si chiude.
     ⚠️ NON sappiamo se ha davvero disdetto: dal portale di Stripe si torna
     indietro uguale che uno abbia cambiato la carta, cambiato piano o
     disdetto. Per questo la frase dice «se hai disdetto», e non da' per
     scontato niente.
     ⚠️ Il bigliettino scade dopo 30 minuti e si cancella appena letto: uno
     che riapre il gestionale domani non se lo ritrova addosso. */
  function _rientroAbbonamento(){
    var t=0;
    try{ t=parseInt(sessionStorage.getItem("gest_da_abbonamento")||"0",10);
         sessionStorage.removeItem("gest_da_abbonamento"); }catch(e){}
    if(!t || (Date.now()-t) > 1800000) return;
    var land=document.querySelector("#landing .landing-top");
    if(!land) return;
    var d=document.createElement("div");
    d.className="rientro-abb";
    d.innerHTML='<div class="rientro-abb-txt"><b>Bentornato.</b> Se hai disdetto, '
      + 'i tuoi dati restano tuoi: puoi portarteli via quando vuoi.</div>';
    var b=document.createElement("button");
    b.type="button"; b.className="rientro-abb-btn"; b.textContent="Scarica i tuoi dati";
    b.onclick=function(){ esportaExcel(); };
    var x=document.createElement("button");
    x.type="button"; x.className="rientro-abb-x"; x.setAttribute("aria-label","Chiudi"); x.textContent="\u00d7";
    x.onclick=function(){ d.remove(); };
    d.appendChild(b); d.appendChild(x);
    land.insertAdjacentElement("afterend", d);
  }

  load().then(()=>{
    _rientroAbbonamento();
    if(cur) return;
    renderLanding();
    /* e poi, se si sa dove si era, si entra dritti: la landing resta
       disegnata sotto, cosi' la freccia trova gia' tutto pronto. */
    const ps=state.panels||[];
    let id=null; try{id=localStorage.getItem(GEST_ULTIMO);}catch(e){}
    if(id&&ps.some(p=>p.id===id&&!p.cestinato)&&(_deepTab||_rientroDaGestionale())) enterPanel(id);
    /* il secondo dei due punti: adesso i reparti del browser ci sono. Se
       l'utente non si sa ancora, questa non fa niente e ci pensa _authRefresh. */
    pulisciRepartiSpariti();
  });
