// [SPOSTATO] gest-ricerca.js: era dentro gest-core.js, righe 11292-11563, spostato identico.
  /* ============================================================
     LA RICERCA UNICA — 19 agosto 2026

     Il gestionale aveva una ricerca per sezione: quella dei lavori
     cercava solo nei lavori, quella dei clienti solo nei clienti. Per
     sapere tutto di «Verdi» bisognava aprire quattro sezioni e scrivere
     quattro volte la stessa parola. Qui si scrive una volta sola.

     ⚠️ CERCANDO UN CLIENTE DEVONO USCIRE ANCHE LE SUE COSE. Un lavoro
        di Verdi dentro non ha scritto «Verdi» da nessuna parte: ha solo
        il suo cliente_id. Per questo i clienti si cercano per primi, e
        i loro id fanno da secondo setaccio su lavori, preventivi e
        fatture. Senza questo passaggio la ricerca sembrerebbe funzionare
        (il cliente esce) ma darebbe zero lavori a chi ne ha venti.
     ⚠️ SI CERCA DENTRO IL REPARTO in cui si sta (mestiere_id), come fa
        ogni altra lettura del gestionale: se no da «Idraulica» uscirebbero
        i clienti di «Giardinaggio».
     ⚠️ LE RIGHE NEL CESTINO NON ESCONO: ci pensa js/cestino.js, che si
        mette in mezzo a ogni sb.from(). Qui non si fa niente di speciale
        proprio per non avere la regola in due posti.
     ⚠️ I DATI SI LEGGONO QUANDO SI ENTRA NELLA CASELLA, non a ogni
        lettera: se no ogni tasto sarebbero quattro interrogazioni al
        database. Si rileggono ogni volta che ci si rientra, cosi' una
        fattura appena creata c'e' gia'.
     ⚠️ PREVENTIVI E FATTURE NON SI APRONO DALLA CACHE della loro
        sezione: se non ci sei mai entrato quella cache e' vuota e il
        clic non farebbe niente, in silenzio. Si rileggono dal database
        riga per riga.
     ============================================================ */
  const CT_TETTO=2000;   /* righe per tabella al massimo */
  const CT_QUANTE=6;     /* quante se ne mostrano per gruppo */
  let ctDati=null, ctTimer=null, ctCaricando=false, ctTroncato=false, ctMancanti=[];

  const CT_CAMPI={
    clienti:["nome","referente","telefono","email","citta","indirizzo","piva","cf","note"],
    lavori:["descrizione","dove","note","lavoro_svolto","pratica_tipo","pratica_protocollo"],
    preventivi:["titolo","numero","oggetto","note"],
    fatture:["numero","oggetto","cli_nome","note"]
  };
  const CT_ST_PREV={bozza:"Bozza",inviato:"Inviato",accettato:"Accettato",rifiutato:"Rifiutato"};
  const CT_ST_FATT={bozza:"Bozza",emessa:"Emessa",pagata:"Pagata",insoluta:"Insoluta",annullata:"Annullata"};

  function ctPiatto(t){
    return String(t==null?"":t).toLowerCase()
      .replace(/[àáâä]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i")
      .replace(/[òóôö]/g,"o").replace(/[ùúûü]/g,"u");
  }
  /* si mettono insieme solo i campi che la riga ha davvero: pratica_tipo
     esiste per gli studi tecnici e non per l'impresa edile, e chiedere un
     campo che non c'e' non deve far saltare niente */
  function ctTesto(riga,campi){
    let s="";
    for(let i=0;i<campi.length;i++){
      const v=riga[campi[i]];
      if(v!=null&&v!=="")s+=" "+v;
    }
    return ctPiatto(s);
  }
  async function ctCarica(){
    if(!sb||!sbUid)return "Non risulti collegato.";
    const mid=curMestiere();
    if(mid==null)return "Entra prima in un reparto.";
    const leggi=t=>sb.from(t).select("*").eq("user_id",sbUid).eq("mestiere_id",mid).limit(CT_TETTO);
    const [rc,rl,rp,rf]=await Promise.all([
      leggi("gest_clienti"),leggi("gest_lavori"),leggi("gest_preventivi"),leggi("gest_fatture")
    ]);
    /* ⚠️ UNA TABELLA CHE NON SI APRE NON DEVE SPEGNERE TUTTA LA RICERCA.
       Un collaboratore puo' avere il permesso sui lavori e non sulle fatture:
       col controllo unico («se c'e' un errore, mi fermo») a lui la ricerca non
       avrebbe funzionato mai, nemmeno sui clienti. Adesso esce quello che si
       riesce a leggere, e quello che manca SI DICE. */
    ctMancanti=[];
    const prendi=(r,come)=>{ if(r.error){ctMancanti.push(come);return [];} return r.data||[]; };
    ctDati={
      clienti:prendi(rc,"clienti"), lavori:prendi(rl,"lavori"),
      preventivi:prendi(rp,"preventivi"), fatture:prendi(rf,"fatture")
    };
    ctTroncato=[rc,rl,rp,rf].some(r=>(r.data||[]).length>=CT_TETTO);
    if(ctMancanti.length===4)return "Non riesco a leggere i dati: "+(rc.error||rl.error||rp.error||rf.error).message;
    return null;
  }
  /* ⚠️ 19 agosto 2026 — PERCHE' IL CLIENTE SI ATTACCA ALLA RIGA, e non si
     fa «o il cliente o il testo».
     Il primo tentativo diceva: esce se la riga contiene le parole OPPURE se
     e' di un cliente trovato. Con una parola sola sembrava giusto. Con due
     no: scrivendo «verdi bagno» uscivano TUTTI i lavori di Verdi — la
     tinteggiatura delle scale compresa — perche' bastava che il cliente
     fosse quello, e «bagno» non lo guardava piu' nessuno.
     Adesso il nome (e i dati) del cliente si ATTACCANO al testo della riga,
     e poi si chiede che ci siano TUTTE le parole. «Verdi» da solo tira
     fuori tutto di Verdi; «verdi bagno» solo il bagno di Verdi. */
  function ctTrova(q){
    if(!ctDati)return null;
    const parole=ctPiatto(q).split(/\s+/).filter(Boolean);
    if(!parole.length)return null;
    const dentro=testo=>parole.every(w=>testo.indexOf(w)>=0);
    const nomeCli={}, testoCli={};
    ctDati.clienti.forEach(c=>{
      nomeCli[String(c.id)]=c.nome||"";
      testoCli[String(c.id)]=ctTesto(c,CT_CAMPI.clienti);
    });
    /* la riga senza cliente non deve pescare il testo di nessuno: con
       cliente_id nullo si cerca solo dentro la riga */
    const suo=r=>(r.cliente_id!=null&&testoCli[String(r.cliente_id)])?(" "+testoCli[String(r.cliente_id)]):"";
    return {
      clienti:ctDati.clienti.filter(c=>dentro(ctTesto(c,CT_CAMPI.clienti))),
      lavori:ctDati.lavori.filter(l=>dentro(ctTesto(l,CT_CAMPI.lavori)+suo(l))),
      preventivi:ctDati.preventivi.filter(p=>dentro(ctTesto(p,CT_CAMPI.preventivi)+suo(p))),
      fatture:ctDati.fatture.filter(f=>dentro(ctTesto(f,CT_CAMPI.fatture)+suo(f))),
      nomeCli:nomeCli
    };
  }
  function ctMeta(){
    const v=[];
    for(let i=0;i<arguments.length;i++){ const x=arguments[i]; if(x)v.push('<span>'+esc(x)+'</span>'); }
    return v.join("");
  }
  /* ⚠️ CLIENTE E LAVORO NON LI APRE QUESTA RICERCA: la riga porta con se'
     lo stesso data-action dei pulsanti che ci sono gia' («apri-cli»,
     «edit-job»), e li apre il gestore di sempre. Riscrivere qui come si
     apre un lavoro vorrebbe dire avere la stessa cosa in due posti, e il
     giorno che cambia una la si aggiorna in uno solo.
     Preventivo e fattura no: i loro pulsanti pescano dalla lista gia' a
     schermo, che e' vuota se in quella sezione non ci sei mai entrato. */
  function ctRiga(tipo,id,titolo,sotto){
    const AZ={cli:"apri-cli",lav:"edit-job"};
    return '<button type="button" class="ct-riga" data-ct="'+esc(tipo)+'" data-id="'+esc(String(id))+'"'
      +(AZ[tipo]?' data-action="'+AZ[tipo]+'"':'')+'>'
      +'<span class="ct-t">'+esc(titolo)+'</span>'
      +(sotto?'<span class="ct-s">'+sotto+'</span>':'')+'</button>';
  }
  function ctBlocco(titolo,righe){
    if(!righe.length)return "";
    const piu=(righe.length>CT_QUANTE)
      ? '<div class="ct-piu">Ce ne sono '+righe.length+': scrivi una parola in più per restringere.</div>' : "";
    return '<div class="ct-gruppo"><div class="ct-cap">'+esc(titolo)+' <b>'+righe.length+'</b></div>'
      +righe.slice(0,CT_QUANTE).join("")+piu+'</div>';
  }
  function ctDisegna(q){
    const box=$("#ct-pop"); if(!box)return;
    const r=ctTrova(q);
    if(!r){box.innerHTML="";return;}
    const pro=(ruoloUtente==='professionista');
    const nome=id=>(id!=null&&r.nomeCli[String(id)])?r.nomeCli[String(id)]:"";
    let h="";
    h+=ctBlocco("Clienti", r.clienti.map(c=>
        ctRiga("cli",c.id,c.nome||"(cliente senza nome)",ctMeta(c.citta||"",c.telefono||""))));
    h+=ctBlocco(_lav(), r.lavori.map(l=>
        ctRiga("lav",l.id,l.descrizione||(pro?"Pratica":"Lavoro"),
          ctMeta(nome(l.cliente_id),l.dove||"",l.data_prevista?fdate(l.data_prevista):"",statoLabel[l.stato]||""))));
    h+=ctBlocco("Preventivi", r.preventivi.map(p=>
        ctRiga("prev",p.id,p.titolo||"Preventivo",
          ctMeta(nome(p.cliente_id),CT_ST_PREV[p.stato]||p.stato||""))));
    /* «Fattura bozza senza numero» si leggeva male: una bozza si chiama
       «Bozza di fattura», come nel titolo del suo modulo */
    h+=ctBlocco("Fatture", r.fatture.map(f=>
        ctRiga("fatt",f.id,(f.numero?("Fattura "+fattNum(f)):"Bozza di fattura"),
          ctMeta(nome(f.cliente_id),CT_ST_FATT[f.stato]||f.stato||""))));
    if(!h)h='<div class="ct-vuoto">Nessun risultato per «'+esc(q)+'».</div>';
    /* niente tagli silenziosi: se il conto e' arrivato al tetto, si dice */
    if(ctTroncato)h+='<div class="ct-piu">Hai più di '+CT_TETTO+' righe in una sezione: cerco dentro le prime '+CT_TETTO+'.</div>';
    /* e se una sezione non si è aperta, si dice pure: se no la ricerca
       direbbe «non c'è niente» di una cosa che non ha nemmeno guardato */
    if(ctMancanti.length)h+='<div class="ct-piu">Non riesco a leggere: '+esc(ctMancanti.join(", "))+'. Quello che c\'è lì dentro non esce.</div>';
    box.innerHTML=h;
  }
  /* ============================================================
     ⛔ 29 agosto 2026 — APRIRE UNA COSA DA FUORI (gradino 2 della chat)
     ============================================================
     La Chat con AI, quando nomina un lavoro o una fattura, mette sotto un
     pulsante «Aprilo». Ma la chat sta fuori da questa closure e da li'
     dentro non si vede niente.
     ⛔ E NON SI RISCRIVE COME SI APRE UNA COSA. E' la stessa regola gia'
     scritta venti righe piu' su per la ricerca in alto: cliente e lavoro
     si aprono col loro `data-action` di sempre («apri-cli», «edit-job»),
     preventivo e fattura con le due funzioni che la ricerca usa gia'.
     Riscrivere qui come si apre un lavoro vorrebbe dire avere la stessa
     cosa in tre posti.
     ⚠️ Il pulsante finto si attacca al body prima di premerlo: un
     elemento staccato non fa arrivare il clic al gestore che sta sul
     document, e non succederebbe niente.
     ⚠️ L'id arriva dalla chat, cioe' da una lettura gia' filtrata per
     utente e reparto — e ctApriPrev/ctApriFatt lo rileggono comunque con
     `.eq("user_id", sbUid)`. Due serrature, come sempre. */
  window.apriCosa=function(tipo,id){
    try{
      if(!id)return false;
      if(tipo==="prev"){ ctApriPrev(id); return true; }
      if(tipo==="fatt"){ ctApriFatt(id); return true; }
      const AZ={cli:"apri-cli",lav:"edit-job"};
      const a=AZ[tipo]; if(!a)return false;
      const b=document.createElement("button");
      b.type="button"; b.setAttribute("data-action",a); b.setAttribute("data-id",String(id));
      b.style.display="none";
      document.body.appendChild(b);
      b.click();
      b.remove();
      return true;
    }catch(_){ return false; }
  };
  function ctApri(){ const b=$("#ct-pop"); if(b)b.classList.add("aperta"); }
  function ctChiudi(){ const b=$("#ct-pop"); if(b){b.classList.remove("aperta");b.innerHTML="";} }
  function ctAzzera(){ const i=$("#ct-q"); if(i)i.value=""; ctChiudi(); }
  async function ctApriPrev(id){
    ctChiudi();
    const {data,error}=await sb.from("gest_preventivi").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(error){toast("Non riesco ad aprire il preventivo: "+error.message);return;}
    if(!data){toast("Questo preventivo non c'è più: forse è nel Cestino, o l'ha eliminato qualcun altro");return;}
    prevForm(data);
  }
  async function ctApriFatt(id){
    ctChiudi();
    const {data,error}=await sb.from("gest_fatture").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(error){toast("Non riesco ad aprire la fattura: "+error.message);return;}
    if(!data){toast("Questa fattura non c'è più: forse è nel Cestino, o l'ha eliminata qualcun altro");return;}
    fattForm(data);
  }
  async function ctRicarica(){
    if(ctCaricando)return null;
    ctCaricando=true;
    const err=await ctCarica();
    ctCaricando=false;
    if(err)ctDati=null;
    return err;
  }
  function ctMostraErrore(msg){
    const b=$("#ct-pop"); if(!b)return;
    b.innerHTML='<div class="ct-vuoto">'+esc(msg)+'</div>';
    ctApri();
  }
  function ctInit(){
    const inp=$("#ct-q"); if(!inp)return;
    /* entrando nella casella i dati si rileggono: una fattura fatta due
       minuti fa deve uscire, se no la ricerca dice il falso */
    inp.addEventListener("focus",async function(){
      const err=await ctRicarica();
      const v=inp.value.trim();
      if(err){ if(v.length>=2)ctMostraErrore(err); return; }
      if(v.length>=2){ ctDisegna(v); ctApri(); }
    });
    inp.addEventListener("input",function(){
      clearTimeout(ctTimer);
      const v=inp.value.trim();
      if(v.length<2){ ctChiudi(); return; }
      ctTimer=setTimeout(async function(){
        if(!ctDati){ const err=await ctRicarica(); if(err){ctMostraErrore(err);return;} }
        const q=inp.value.trim();
        if(q.length<2){ ctChiudi(); return; }
        ctDisegna(q); ctApri();
      },220);
    });
    inp.addEventListener("keydown",function(e){
      if(e.key==="Escape"){ ctAzzera(); inp.blur(); }
    });
    const x=$("#ct-x"); if(x)x.addEventListener("click",function(){ ctAzzera(); inp.focus(); });
    /* fuori dalla casella si chiude; dentro no, se no il clic sul risultato
       lo chiuderebbe prima di arrivarci */
    document.addEventListener("click",function(e){
      if(!e.target.closest("#ct-barra"))ctChiudi();
    });
    document.addEventListener("click",function(e){
      const r=e.target.closest(".ct-riga"); if(!r)return;
      const tipo=r.dataset.ct, id=r.dataset.id;
      if(tipo==="prev"){ ctApriPrev(id); return; }
      if(tipo==="fatt"){ ctApriFatt(id); return; }
      /* cliente e lavoro: li apre il data-action che la riga porta con se',
         qui si chiude soltanto la tendina */
      ctChiudi();
    });
  }
  ctInit();

