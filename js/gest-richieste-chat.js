// [SPOSTATO] gest-richieste-chat.js: era dentro gest-core.js, righe 5416-6041, spostato identico.
  /* ============================================================
     19 settembre 2026 — LE DUE COSE CHE IL RIEPILOGO NON DICEVA
     ============================================================
     «Richieste dal sito» e «Promemoria» avevano il pallino sulla voce di
     menu e basta. Ma sul telefono il menu sta chiuso dietro il burger:
     una richiesta di un cliente arrivata dalla pagina di TrovaImpresa
     esisteva solo dentro un cassetto chiuso. Per un artigiano una
     richiesta non vista è un lavoro perso — ed è il motivo per cui il
     sito esiste.

     ⚠️ NON SI LEGGE NIENTE DI NUOVO. I due numeri il gestionale li ha
        già: renderContatori conta i promemoria per il suo pallino e
        contaDalSito le richieste per il suo. Qui si riusano quelli. Una
        lettura in più all'apertura è esattamente quello che abbiamo tolto
        ieri, e non si rimette dalla porta di servizio.

     ⚠️ L'ORDINE DI ARRIVO NON CONTA. La fascia la disegna
        gest-riepilogo.js, i numeri arrivano da qui, e chi arriva per
        primo non lo sappiamo: tutti e due chiamano questa, e l'ultimo
        completa il lavoro. Per questo la funzione si può richiamare
        quante volte si vuole — prima toglie le sue righe di prima. */
  let _rieDalSito=null, _riePromem=null;
  function rieVociExtra(){
    const ra=$("#rie-alert"); if(!ra)return;
    const voci=[];
    if(_rieDalSito&&_rieDalSito>0)voci.push({
      go:"dalsito", grave:true,
      t:_rieDalSito+(_rieDalSito===1?" richiesta dal sito da aprire":" richieste dal sito da aprire"),
      d:"Un cliente ti ha scritto dalla tua pagina su TrovaImpresa"});
    if(_riePromem&&_riePromem>0)voci.push({
      go:"promemoria", grave:true,
      t:_riePromem+(_riePromem===1?" promemoria passato":" promemoria passati"),
      d:"Il giorno che avevi segnato è già passato"});

    /* via le righe del giro precedente, sempre: così non si accumulano */
    ra.querySelectorAll("[data-rie-extra]").forEach(function(x){x.remove();});
    if(!voci.length){ _rieContaFascia(ra); return; }

    /* se la fascia dice «Tutto in ordine» non lo è più: diventa una fascia
       vera, con dentro solo queste righe. Il resto lo rimetterà il
       Riepilogo al prossimo giro, e questa funzione non lo tocca. */
    let box=ra.querySelector(".rie-oggi:not(.tutto-ok)");
    if(!box){
      const okBox=ra.querySelector(".rie-oggi.tutto-ok");
      if(okBox)okBox.remove();
      ra.insertAdjacentHTML("beforeend",
        '<div class="rie-oggi"><div class="ro-tit"><span class="ro-pallino"></span>Da sistemare oggi</div>'
        +'<div class="ro-sotto"></div></div>');
      box=ra.querySelector(".rie-oggi:not(.tutto-ok)");
    }
    const sotto=box.querySelector(".ro-sotto");
    /* in cima: un cliente che aspetta viene prima di tutto il resto */
    const dopo=sotto||box.firstChild;
    voci.slice().reverse().forEach(function(v){
      const d=document.createElement("div");
      d.className="ro-riga "+(v.grave?"grave":"attesa");
      d.setAttribute("data-rie-extra","1");
      d.setAttribute("data-action","rie-go");
      d.setAttribute("data-go",v.go);
      d.innerHTML='<span class="ro-testo">'+esc(v.t)+'<span class="ro-dett">'+esc(v.d)+'</span></span>'
                 +'<span class="ro-freccia">\u203a</span>';
      dopo.parentNode.insertBefore(d,dopo.nextSibling);
    });
    _rieContaFascia(ra);
  }
  /* il numero in cima deve dire quante righe ci sono davvero, comprese
     quelle chiuse dietro «Vedi le altre» e queste due */
  function _rieContaFascia(ra){
    const box=ra.querySelector(".rie-oggi:not(.tutto-ok)"); if(!box)return;
    const sotto=box.querySelector(".ro-sotto"); if(!sotto)return;
    const n=box.querySelectorAll(".ro-riga:not(#ro-piu-tasto)").length;
    if(!n)return;
    sotto.textContent=(n===1?"Una cosa che chiede attenzione.":n+" cose che chiedono attenzione.")
      +" Clicca una riga per andarci.";
  }
  window.rieVociExtra=rieVociExtra;

  /* Il pallino sulla voce di menu: quante richieste non ancora aperte. */
  async function contaDalSito(){
    if(!sb||!sbUid){setCnt("#cnt-dalsito",0);return;}
    try{
      const L=dsCache.length?dsCache:await dsCarica();
      const n=L.filter(r=>r._stato==="nuova").length;
      setCnt("#cnt-dalsito",n,"attesa");
      _rieDalSito=n; try{ rieVociExtra(); }catch(e){}
    }catch(e){}
  }

  /* Apre la scheda della richiesta. Aprirla = averla vista. */
  async function dsApri(pid){
    const r=dsCache.find(x=>String(x.id)===String(pid));
    if(!r){toast("Richiesta non trovata, riprova");return;}
    const st=_dsSt(r), q=quando(_dsData(r),{neutro:true});
    const riga=(et,v)=>v?`<div class="field"><label>${et}</label><div>${esc(String(v))}</div></div>`:"";
    openSheetGrande("Richiesta dal sito — "+esc(r.nome||""),
      `<div class="sh-cols"><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">Chi ha scritto</div>
        ${riga("Nome",[r.nome,r.cognome].filter(Boolean).join(" "))}
        ${riga("Città",r.citta)}
        ${riga("Indirizzo",r.via)}
        <div class="field"><label>Contatti</label>
          <div id="ds-contatti">
            <button class="btn" type="button" data-action="ds-contatti" data-id="${esc(String(r.id))}">Mostra email e telefono</button>
          </div></div>
        </div>
        <div class="sh-b">
        <div class="sh-tit">Quando</div>
        ${riga("Arrivata",q.testo)}
        ${riga("Stato",st.lab)}
        ${r.risposta_at?riga("Già risposto dal sito","sì"):""}
        </div>
        </div><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">Cosa chiede</div>
        ${riga("Lavoro",_dsCosa(r))}
        ${riga("Descrizione",r.descrizione)}
        ${riga("Quando gli servirebbe",r.data_preferita)}
        ${riga("Urgenza",r.urgenza)}
        ${riga("Budget",r.budget)}
        ${riga("Metri quadri",r.mq)}
        ${riga("Piano",r.piano)}
        ${riga("Altro",r.note_aggiuntive)}
        ${r.foto?`<div class="field"><label>Foto</label><a href="${esc(r.foto)}" target="_blank" rel="noopener">Apri la foto</a></div>`:""}
        </div>
        </div></div>`,
      `<button class="btn b-cancel" data-action="close">Chiudi</button>
       <button class="btn-primary b-save" data-action="ds-prev" data-id="${esc(String(r.id))}">Crea il preventivo</button>`);
    if(r._stato==="nuova"){
      if(await dsSegna(r.id,"vista")){r._stato="vista";contaDalSito();}
    }
  }

  /* I contatti non stanno nel database: li da' solo la function, e solo a
     chi ha quella richiesta indirizzata a se'. */
  async function dsContatti(pid){
    const box=$("#ds-contatti");if(!box)return;
    box.innerHTML="Un attimo…";
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(!session)throw new Error("sessione scaduta, rientra");
      const res=await fetch("/.netlify/functions/contatto-preventivo",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},
        body:JSON.stringify({preventivo_id:Number(pid)})
      });
      if(!res.ok)throw new Error(await res.text());
      const c=await res.json();
      const tel=(c.telefono||"").replace(/[\s\-+]/g,"").replace(/^39/,"");
      box.innerHTML=
        (c.email?`<div><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>`:"")
        +(c.telefono?`<div><a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a>`
          +(tel?` · <a href="https://wa.me/39${esc(tel)}" target="_blank" rel="noopener">WhatsApp</a>`:"")+`</div>`:"")
        +((!c.email&&!c.telefono)?"Nessun recapito nella richiesta":"");
    }catch(e){
      box.innerHTML='<span style="color:var(--err)">Non riesco a mostrarli: '+esc(e.message||"riprova")+"</span>";
    }
  }

  /* Il pulsante che porta il cliente dentro il gestionale.
     Prima cerca se il cliente c'e' gia' (stesso telefono, non eliminato):
     senza il controllo, ogni richiesta creerebbe un doppione in rubrica. */
  async function dsCreaPreventivo(pid){
    const r=dsCache.find(x=>String(x.id)===String(pid));
    if(!r){toast("Richiesta non trovata, riprova");return;}
    const mid=curMestiere();
    if(!mid){toast("Apri prima un reparto");return;}
    let contatti={email:"",telefono:""};
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(session){
        const res=await fetch("/.netlify/functions/contatto-preventivo",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},
          body:JSON.stringify({preventivo_id:Number(r.id)})
        });
        if(res.ok)contatti=await res.json();
      }
    }catch(e){}

    const nomeCli=[r.nome,r.cognome].filter(Boolean).join(" ").trim()||"Cliente dal sito";
    let cliId=null;
    const telSec=String(contatti.telefono||"").replace(/\D/g,"");
    if(telSec){
      const {data:gia}=await sb.from("gest_clienti")
        .select("id,telefono").eq("user_id",sbUid).or(_cliOr(mid)).is("eliminato_il",null);
      const trovato=(gia||[]).find(c=>String(c.telefono||"").replace(/\D/g,"")===telSec);
      if(trovato)cliId=trovato.id;
    }
    if(!cliId){
      const {data:nuovo,error:eC}=await sb.from("gest_clienti").insert({
        user_id:sbUid, mestiere_id:mid, nome:nomeCli, tipo:"privato",
        email:contatti.email||null, telefono:contatti.telefono||null,
        citta:r.citta||null, indirizzo:r.via||null
      }).select("id");
      if(eC||!nuovo||!nuovo.length){
        toast("Non sono riuscito a creare il cliente: "+((eC&&eC.message)||"nessuna riga scritta"));
        return;
      }
      cliId=nuovo[0].id;
      toast("Cliente aggiunto in rubrica ✔");
    }

    closeSheet();
    const desc=[_dsCosa(r),r.descrizione].filter(Boolean).join(" — ");
    await prevForm(null,{
      cliente_id:cliId,
      titolo:_dsCosa(r),
      note:"Richiesta arrivata da TrovaImpresa il "+fdate(_dsData(r))+".\n"+(desc||"")
    });
    if(await dsSegna(r.id,"preventivo")){r._stato="preventivo";}
    rinfresca("dalsito","clienti");
  }

  async function dsChiudi(pid,riapri){
    if(await dsSegna(pid,riapri?"vista":"chiusa")){
      const r=dsCache.find(x=>String(x.id)===String(pid));
      if(r)r._stato=riapri?"vista":"chiusa";
      toast(riapri?"Riaperta":"Chiusa ✔");
      rinfresca("dalsito");
    }
  }

  async function renderRichieste(){
    const lista=$("#rq-lista");if(!lista)return;
    const _ta=$("#rq-testo");
    if(_ta&&!_ta._agg){_ta._agg=true;
      document.querySelectorAll("[data-rq-es]").forEach(b=>b.addEventListener("click",()=>{_ta.value=b.dataset.rqEs;_ta.focus();_ta.setSelectionRange(_ta.value.length,_ta.value.length);}));
      if(window.aiMicrofono&&window.aiMicHTML){const m=$("#rq-mic");if(m){m.outerHTML=aiMicHTML("rq-mic");aiMicrofono($("#rq-mic"),_ta,$("#rq-st"));}}
    }
    _rqSegnaViste();          /* apri la sezione = hai visto le risposte */
    if(!sb||!sbUid){lista.innerHTML="";return;}
    const {data}=await sb.from("gest_richieste")
      .select("id,testo,stato,risposta,created_at")
      .eq("user_id",sbUid).order("created_at",{ascending:false});
    const R=data||[];
    if(!R.length){
      lista.innerHTML=`<div class="gal-intro" style="margin-top:22px">Qui sotto compariranno le cose che ci hai chiesto, con lo stato di ognuna.</div>`;
      return;
    }
    const fmt=d=>d?new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"}):"";
    lista.innerHTML=`<h3 class="rq-tit">Cosa ci hai chiesto</h3>`+R.map(r=>{
      const st=RQ_STATI[r.stato]||RQ_STATI.ricevuta;
      return `<div class="rq-riga rq-${esc(r.stato||"ricevuta")}">
        <div class="rq-testa">
          <span class="rq-pill" style="background:${st.bg};color:${st.fg}">${st.lab}</span>
          <span class="rq-data">${fmt(r.created_at)}</span>
        </div>
        <div class="rq-testo">${esc(r.testo)}</div>
        ${r.risposta?`<div class="rq-risp"><b>Risposta:</b> ${esc(r.risposta)}</div>`:""}
      </div>`;
    }).join("");
  }

  async function salvaRichiesta(){
    if(!sbUid){toast("Devi essere loggato");return;}
    const ta=$("#rq-testo");
    const testo=(ta?ta.value:"").trim();
    if(testo.length<5){toast("Scrivi cosa ti serve, anche poche parole");return;}
    if(testo.length>2000){toast("Troppo lungo: massimo 2000 caratteri");return;}
    let email="";
    try{const {data:{user}}=await sb.auth.getUser();email=(user&&user.email)||"";}catch(e){}
    const {data,error}=await sb.from("gest_richieste")
      .insert({user_id:sbUid,email,testo}).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(ta)ta.value="";
    toast("Ricevuto, grazie ✔");
    /* le email partono dal server: se non parte, la richiesta resta comunque salvata */
    try{
      await fetch("/.netlify/functions/richiesta-funzione",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:(data&&data[0])?data[0].id:null})
      });
    }catch(e){}
    renderRichieste();
    _rqSegnaViste();
  }

  /* ============================================================
     IL NUMERINO SU «CHIEDI UNA FUNZIONE» — 15 agosto 2026 (12)

     Conta le richieste a cui il fondatore ha risposto e che l'utente non ha
     ancora aperto. Prima l'impresa scriveva, la risposta arrivava, e lei non
     lo sapeva: doveva ripassare di li' per caso.

     ⚠️ Le "viste" stanno nel BROWSER, non nel database, e va detto invece di
     farlo sembrare quello che non e': su gest_richieste l'utente non ha il
     permesso di scrivere (solo leggere e inserire), e aprire quel permesso
     per un numerino vorrebbe dire una regola nuova su una tabella che oggi e'
     chiusa bene. Conseguenza vera: se apre il gestionale da un altro
     computer, il numerino ricompare una volta. Meglio un numero in piu' che
     una risposta non letta.
     ============================================================ */
  const RQ_VISTE="ti_risposte_viste_v1";
  function _rqViste(){
    try{return JSON.parse(localStorage.getItem(RQ_VISTE)||"[]");}catch(e){return [];}
  }
  function _rqSegnaViste(){
    if(!sb||!sbUid)return;
    sb.from("gest_richieste").select("id,risposta").eq("user_id",sbUid)
      .then(({data,error})=>{
        if(error||!data)return;
        const con=data.filter(r=>String(r.risposta||"").trim()!=="").map(r=>String(r.id));
        try{localStorage.setItem(RQ_VISTE,JSON.stringify(con));}catch(e){}
        setCnt("#cnt-richieste",0);
      });
  }
  async function contaRichiesteNuove(){
    if(!sb||!sbUid){setCnt("#cnt-richieste",0);return;}
    try{
      const {data,error}=await sb.from("gest_richieste")
        .select("id,risposta").eq("user_id",sbUid);
      /* se la lettura non riesce NON si scrive zero: uno zero falso dice
         "non hai risposte" ed e' la bugia peggiore proprio qui */
      if(error||!data)return;
      const viste=_rqViste();
      const n=data.filter(r=>String(r.risposta||"").trim()!=="" && viste.indexOf(String(r.id))<0).length;
      setCnt("#cnt-richieste",n,"attesa");
      _pallinoMenu();
    }catch(e){}
  }

  /* ============================================================
     ASSISTENZA DIRETTA — la chat col fondatore. 15 agosto 2026 (12)

     Stessa tabella dei quattro pannelli pubblici (supporto_messaggi) e stesso
     pannello admin: chi scrive da qui e chi scrive dal pannello finiscono
     nella stessa conversazione. Nessun doppione da tenere allineato.

     COME ARRIVANO I MESSAGGI NUOVI, IN DUE MODI INSIEME
     1) il collegamento vivo di Supabase, che avvisa da solo (gia' acceso sulla
        tabella: verificato il 15 agosto);
     2) un ricontrollo ogni 20 secondi, come rete di sicurezza.
     Il secondo non e' un doppione inutile: in cantiere la linea cade, e quando
     cade il collegamento vivo muore in silenzio — nessun errore, semplicemente
     non arriva piu' niente. Il ricontrollo se ne accorge da solo.

     ⚠️ IL LUCCHETTO NON LO METTE QUESTA PAGINA, LO METTE IL DATABASE.
     Ognuno legge solo le righe dove user_id e' il suo (regola
     supporto_select_own). Anche se qui ci fosse un errore, un'impresa non
     potrebbe vedere la chat di un'altra.
     ============================================================ */
  let asstCache=[], asstCanale=null, asstTimer=null, asstAperta=false, asstInvio=false;

  function _asstOra(d){
    try{return new Date(d).toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});}catch(e){return "";}
  }
  function _asstGiorno(d){
    try{
      const q=quando(String(d||"").slice(0,10),{neutro:true});
      return q&&q.testo?q.testo:fdate(String(d||"").slice(0,10));
    }catch(e){return "";}
  }

  function asstDisegna(){
    const box=$("#asst-msgs");if(!box)return;
    if(!asstCache.length){
      box.innerHTML='<div class="asst-vuoto">Qui non c\'è ancora niente.<br>Scrivi il primo messaggio: <b>ti rispondo io</b>, non un robot.</div>';
      return;
    }
    let ultimoGiorno="";
    box.innerHTML=asstCache.map(m=>{
      const g=String(m.created_at||"").slice(0,10);
      let testa="";
      if(g&&g!==ultimoGiorno){ultimoGiorno=g;testa='<div class="asst-giorno">'+esc(_asstGiorno(m.created_at))+'</div>';}
      const mio=!m.da_admin;
      return testa+'<div class="asst-msg '+(mio?"mio":"suo")+'">'+esc(m.messaggio||"")
        +_asstAllegatoHtml(m)
        +'<div class="asst-quando">'+(mio?"tu":"TrovaImpresa")+' · '+esc(_asstOra(m.created_at))
        /* 27 set 2026 — sui tuoi messaggi: «Letto» quando TrovaImpresa li ha aperti */
        +(mio?(m.letto?' · <b>✓✓ Letto</b>':' · ✓ Inviato'):'')+'</div></div>';
    }).join("");
    box.scrollTop=box.scrollHeight;
    _asstRisolviAllegati();
  }

  /* ---- ALLEGATI (3 settembre 2026) ----
     Il file sta nel bucket privato «supporto-allegati», cartella <uid>/.
     Il link per vederlo e' firmato e dura un'ora: si chiede al momento, e si
     tiene in una mappa per non richiederlo a ogni ridisegno. */
  const _asstUrl={};
  let asstFileScelto=null;
  function _asstEImg(m){return /^image\//.test(m.allegato_tipo||"")||/\.(jpe?g|png|webp|gif|heic)$/i.test(m.allegato||"");}
  function _asstAllegatoHtml(m){
    if(!m.allegato)return "";
    const u=_asstUrl[m.allegato];
    const nome=esc(m.allegato_nome||"allegato");
    if(_asstEImg(m)){
      return '<a class="asst-img" data-path="'+esc(m.allegato)+'" '+(u?'href="'+u+'" target="_blank" rel="noopener"':'')+'>'
        +(u?'<img src="'+u+'" alt="'+nome+'" loading="lazy">':'<span class="asst-file">Carico la foto…</span>')+'</a>';
    }
    return '<a class="asst-file" data-path="'+esc(m.allegato)+'" '+(u?'href="'+u+'" target="_blank" rel="noopener"':'')+'>'
      +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> '+nome+'</a>';
  }
  async function _asstRisolviAllegati(){
    if(!sb)return;
    const mancanti=[...new Set(asstCache.filter(m=>m.allegato&&_asstUrl[m.allegato]===undefined).map(m=>m.allegato))];
    if(!mancanti.length)return;
    const {data,error}=await sb.storage.from("supporto-allegati").createSignedUrls(mancanti,3600);
    /* chi non si risolve viene segnato con "" cosi' non si richiede all'infinito */
    mancanti.forEach(pth=>{_asstUrl[pth]="";});
    if(error||!data)return;
    let nuovi=0;
    data.forEach((r,i)=>{if(r&&r.signedUrl){_asstUrl[r.path||mancanti[i]]=r.signedUrl;nuovi++;}});
    if(nuovi&&asstAperta)asstDisegna();
  }
  function asstScegliFile(){const i=$("#asst-file");if(i)i.click();}
  function asstFileCambiato(){
    const i=$("#asst-file");const f=i&&i.files&&i.files[0];
    const chip=$("#asst-chip");
    if(!f){asstFileScelto=null;if(chip){chip.hidden=true;chip.innerHTML="";}return;}
    const ok=/^image\//.test(f.type)||f.type==="application/pdf";
    if(!ok){toast("Puoi allegare solo foto, screenshot o PDF");i.value="";asstFileScelto=null;return;}
    asstFileScelto=f;
    if(chip){
      chip.hidden=false;
      chip.innerHTML='<span>'+esc(f.name)+'</span><button type="button" class="asst-chip-x" data-action="asst-togli-file" title="Togli">×</button>';
    }
  }
  function asstTogliFile(){const i=$("#asst-file");if(i)i.value="";asstFileCambiato();}

  async function asstLeggi(segnaLetti){
    if(!sb||!sbUid)return false;
    const {data,error}=await sb.from("supporto_messaggi")
      .select("id,messaggio,da_admin,letto,created_at,allegato,allegato_nome,allegato_tipo")
      .eq("user_id",sbUid).order("created_at",{ascending:true});
    if(error||!data)return false;
    asstCache=data;
    if(asstAperta)asstDisegna();
    const nonLetti=data.filter(m=>m.da_admin&&!m.letto).length;
    if(segnaLetti&&nonLetti){
      /* si scrive SOLO la colonna «letto»: e' l'unica su cui il database ci
         lascia scrivere (sql/supporto-messaggi-lucchetto.sql), ed e' giusto
         cosi' — il testo delle risposte non deve poterlo toccare nessuno. */
      const r=await sb.from("supporto_messaggi").update({letto:true})
        .eq("user_id",sbUid).eq("da_admin",true).eq("letto",false).select("id");
      if(!r.error&&r.data){asstCache.forEach(m=>{if(m.da_admin)m.letto=true;});}
      setCnt("#cnt-assistenza",0);
    }else{
      setCnt("#cnt-assistenza",nonLetti,"attesa");
    }
    _pallinoMenu();
    return true;
  }

  async function renderAssistenza(){
    const box=$("#asst-msgs");if(!box)return;
    const _at=$("#asst-testo");
    if(_at&&!_at._agg){_at._agg=true;
      /* Invio manda, Maiusc+Invio va a capo: come nel pannello admin e in ogni chat */
      _at.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();asstInvia();}});
      if(window.aiMicrofono&&window.aiMicHTML){const m=$("#asst-mic");if(m){m.outerHTML=aiMicHTML("asst-mic");aiMicrofono($("#asst-mic"),_at,$("#asst-nota"));}}
    }
    asstAperta=true;
    const fi=$("#asst-file");
    if(fi&&!fi._agganciato){fi._agganciato=true;fi.addEventListener("change",asstFileCambiato);}
    if(!sb||!sbUid){box.innerHTML='<div class="asst-vuoto">Accedi per scrivere.</div>';return;}
    if(!asstCache.length)box.innerHTML='<div class="asst-vuoto">Leggo…</div>';
    const ok=await asstLeggi(true);
    if(!ok){
      box.innerHTML='<div class="asst-vuoto">Non riesco a leggere i messaggi: controlla la connessione e riprova.</div>';
      return;
    }
    asstDisegna();
    const nota=$("#asst-nota");
    if(nota)nota.textContent="I messaggi nuovi compaiono da soli, non serve ricaricare la pagina.";
    asstVedetta();
  }

  /* la vedetta gira anche quando la chat e' chiusa: il numerino sul pulsante
     deve salire mentre l'utente sta facendo tutt'altro. Si accende una volta
     sola per sessione. */
  function asstVedetta(){
    if(!sb||!sbUid)return;
    if(!asstCanale){
      try{
        asstCanale=sb.channel("assistenza-"+sbUid)
          .on("postgres_changes",
              {event:"INSERT",schema:"public",table:"supporto_messaggi",filter:"user_id=eq."+sbUid},
              function(){ asstLeggi(asstAperta&&tabCorrente()==="assistenza"); })
          .subscribe();
      }catch(e){ asstCanale=null; }   /* resta il ricontrollo qui sotto */
    }
    if(!asstTimer){
      /* ⚠️ 20 secondi e non 2: e' una rete di sicurezza, non il motore. Con 2
         secondi sarebbero 1800 richieste l'ora per ogni impresa collegata,
         per una chat che riceve due messaggi al giorno. */
      asstTimer=setInterval(function(){
        if(document.hidden)return;      /* scheda in secondo piano: non si scomoda nessuno */
        asstLeggi(asstAperta&&tabCorrente()==="assistenza");
      },20000);
    }
  }

  async function asstInvia(){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(asstInvio)return;               /* doppio clic: un messaggio solo */
    const ta=$("#asst-testo");
    let testo=(ta?ta.value:"").trim();
    if(!testo&&!asstFileScelto){toast("Scrivi il messaggio o allega una foto, poi premi Invia");return;}
    if(testo.length>2000){toast("Troppo lungo: massimo 2000 caratteri");return;}
    asstInvio=true;
    /* l'allegato si carica PRIMA di scrivere la riga: se il caricamento
       fallisce non parte un messaggio che parla di una foto che non c'e' */
    let allegato=null,allegatoNome=null,allegatoTipo=null;
    if(asstFileScelto){
      toast("Carico l'allegato…");
      const prep=window.preparaFileUpload?await preparaFileUpload(asstFileScelto,{lato:1600,qualita:0.8}):{file:asstFileScelto,nome:asstFileScelto.name};
      if(prep.errore){asstInvio=false;toast(prep.errore);return;}
      const pulito=String(prep.nome||"allegato").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-80);
      const path=sbUid+"/"+Date.now()+"-"+pulito;
      const tipo=(prep.file&&prep.file.type)||asstFileScelto.type||"application/octet-stream";
      const up=await sb.storage.from("supporto-allegati").upload(path,prep.file,{contentType:tipo,upsert:false});
      if(up.error){asstInvio=false;toast("Allegato non caricato: "+(up.error.message||"errore"));return;}
      allegato=path;allegatoNome=asstFileScelto.name;allegatoTipo=tipo;
      if(!testo)testo=/^image\//.test(tipo)?"Ti mando una foto":"Ti mando un file";
    }
    /* .select("id") non e' un vezzo: una scrittura fermata dai permessi NON
       da' errore, torna riuscita a vuoto. Senza, la pagina direbbe "mandato"
       e nel database non ci sarebbe niente. */
    const riga={user_id:sbUid,da_admin:false,messaggio:testo,letto:false,origine:"gestionale",
                allegato:allegato,allegato_nome:allegatoNome,allegato_tipo:allegatoTipo};
    let {data,error}=await sb.from("supporto_messaggi").insert(riga).select("id");
    /* 15 agosto 2026 (13) — «origine» dice al pannello admin che questo
       messaggio arriva dal gestionale e non dal sito. Se la colonna non c'e'
       ancora (sql/supporto-origine.sql non lanciato) si rimanda il messaggio
       senza: meglio una conversazione senza etichetta che un'impresa che
       preme Invia e non parte niente. */
    if(error&&/origine|42703|PGRST204|schema cache/i.test((error.code||"")+" "+(error.message||""))){
      delete riga.origine;
      ({data,error}=await sb.from("supporto_messaggi").insert(riga).select("id"));
    }
    asstInvio=false;
    if(error){toast("Non mandato: "+(error.message||"errore"));return;}
    if(!data||!data.length){toast("Non mandato: il database non ha scritto niente. Riprova.");return;}
    if(ta)ta.value="";
    asstTogliFile();
    /* 27 set 2026 — l'email ad Alessio parte dal server (supporto-avviso):
       qui si passa solo il numero del messaggio e il gettone della sessione.
       Se non parte, il messaggio e' comunque salvato: non si dice niente. */
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(session&&data&&data[0])fetch("/.netlify/functions/supporto-avviso",{method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},
        body:JSON.stringify({msg_id:data[0].id})}).catch(()=>{});
    }catch(_){}
    await asstLeggi(false);
    asstDisegna();
    toast("Mandato ✔");
  }

  /* ============================================================
     IL PALLINO SULLE TRE LINEETTE — 15 agosto 2026 (12)
     Sul telefono la barra laterale e' chiusa dietro il pulsante col menu:
     il numerino ci sta dentro e non lo vedrebbe nessuno, cioe' proprio quando
     serve di piu' (uno in cantiere che aspetta una risposta). Il pallino sta
     fuori, sul pulsante che si vede sempre.
     ============================================================ */
  function _pallinoMenu(){
    try{
      const b=document.querySelector(".burger");if(!b)return;
      const n=["#cnt-assistenza","#cnt-richieste"]
        .reduce((s,x)=>{const e=$(x);return s+((e&&e.textContent.trim())?1:0);},0);
      b.classList.toggle("ha-novita",n>0);
      b.title=n>0?"Menu — c'è qualcosa di nuovo per te":"Menu";
    }catch(e){}
  }

  /* ---- mezzi usati su un lavoro (gest_lavoro_mezzi): si salva subito,
         fuori da saveJob(), esattamente come le spese ---- */
  let mezziLavoroId=null;
  async function renderMezziBlock(lavoroId){
    mezziLavoroId=lavoroId;
    const wrap=$("#mezzi-wrap");if(!wrap||!sb||!sbUid)return;
    /* 9 agosto 2026 — a uno studio i Mezzi sono nascosti dal menu, ma questo
       riquadro compariva lo stesso dentro la pratica, e diceva pure
       "aggiungilo dalla scheda Mezzi": una scheda che lui non ha. */
    if(ruoloUtente==='professionista'){wrap.style.display="none";return;}
    wrap.style.display="block";
    const [{data:usati},{data:tutti}]=await Promise.all([
      sb.from("gest_lavoro_mezzi").select("id,mezzo_id").eq("user_id",sbUid).eq("lavoro_id",lavoroId),
      sb.from("gest_mezzi").select("id,nome,targa").eq("user_id",sbUid).or(_cliOr(curMestiere())).order("nome")
    ]);
    const U=usati||[], T=tutti||[];
    const etichetta=m=>esc(m.nome)+(m.targa?" ("+esc(m.targa)+")":"");
    const nomi=Object.fromEntries(T.map(m=>[m.id,etichetta(m)]));
    $("#lm-list").innerHTML=U.length?U.map(x=>`<div class="spesa-row"><span style="flex:1">${nomi[x.mezzo_id]||"(mezzo eliminato)"}</span><button type="button" class="sdel" data-action="lm-del" data-id="${x.id}">🗑</button></div>`).join(""):`<p class="fatt-empty">Nessun mezzo collegato a questo lavoro.</p>`;
    const usati_ids=new Set(U.map(x=>x.mezzo_id));
    const liberi=T.filter(m=>!usati_ids.has(m.id));
    $("#lm-sel").innerHTML=liberi.length
      ?`<option value="">— scegli un mezzo —</option>`+liberi.map(m=>`<option value="${m.id}">${etichetta(m)}</option>`).join("")
      :`<option value="">${T.length?"Tutti i mezzi sono già collegati":"Nessun mezzo: aggiungilo dalla scheda Mezzi"}</option>`;
  }
  async function mezzoLavoroAdd(){
    if(!sbUid||!mezziLavoroId)return;
    const mezzo_id=$("#lm-sel").value;if(!mezzo_id){toast("Scegli un mezzo");return;}
    const {data,error}=await sb.from("gest_lavoro_mezzi").insert({user_id:sbUid,lavoro_id:mezziLavoroId,mezzo_id}).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga aggiunta");return;}
    renderMezziBlock(mezziLavoroId);toast("Mezzo aggiunto ✔");
  }

  /* SCADENZARIO (solo professionista): tabella gest_scadenze, isolamento user_id+mestiere_id come gest_lavori/gest_clienti */
  /* 9 agosto 2026 — elenco allungato per gli studi: le date che un tecnico non
     può bucare non sono solo "che pratica e'", ma "che cosa scade".
     Per imprese e artigiani l'elenco resta identico a prima. */
  const tipiScadenza=()=>ruoloUtente==='professionista'
    ?["Presentazione pratica","Integrazione richiesta dal Comune","Silenzio-assenso",
      "Inizio lavori","Fine lavori","Proroga","Collaudo","Agibilità",
      "Variante","Deposito sismico","Accatastamento","Rinnovo polizza",
      "Crediti formativi",
      /* 9 agosto 2026 — ora che gli studi hanno la sezione Strumenti: una misura
         presa con uno strumento fuori taratura non vale, e la taratura scade */
      "Taratura strumento","Manutenzione strumento",
      "Altro"]
    :["DURC","Assicurazione","Revisione mezzo","Bollo","Tagliando","Manutenzione programmata","Certificazione",
      "Pagamento fornitore",
      /* 15 agosto 2026 — le cose che scadono addosso a UNA PERSONA. Prima
         finivano in "Attestati e patentini", un campo di testo libero: ci
         scrivevi "muletto" e non scadeva mai. */
      "Patentino","Idoneità sanitaria",
      /* 9 agosto 2026 — le date del cantiere: ora che le scadenze si attaccano
         al lavoro servono anche a imprese e artigiani */
      "Consegna lavori","SAL (stato avanzamento)","Fine lavori","Verifica ponteggio",
      "Altro"];
  let scadCache=[];
