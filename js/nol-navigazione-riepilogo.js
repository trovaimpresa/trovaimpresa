// [SPOSTATO] nol-navigazione-riepilogo.js: era dentro nol-core.js, righe 291-593, spostato identico.

  /* LANDING */
  async function renderLanding(){
    let ps=state.panels||[];
    let rows=[];
    if(sb&&sbUid){
      const {data}=await sb.from("gest_lavori").select("mestiere_id,stato").eq("user_id",sbUid);
      rows=data||[];
      /* FONTE PRIMARIA dei reparti = gest_mestieri su Supabase (visibili da qualsiasi browser/account).
         state.panels resta come cache/fallback locale: lo idratiamo dai mestieri così entrata (cur/curMestiere)
         e contatori continuano a funzionare senza altre modifiche. */
      const {data:mest}=await sb.from("gest_mestieri").select("id,nome,icona,colore,ordine").eq("user_id",sbUid).order("ordine",{ascending:true});
      let changed=false;
      ps=(mest||[]).map(m=>{
        let p=(state.panels||[]).find(x=>x.mestiere_id===m.id);
        const pal=COLORI.find(c=>c.a===m.colore); /* dark/soft (ad/as) non sono su DB: ricavati dalla palette per colore */
        if(!p){
          const col=pal||{a:m.colore,ad:m.colore,as:m.colore};
          p={id:uid(),nome:m.nome,icon:m.icona||"🛠️",a:col.a,ad:col.ad,as:col.as,mestiere_id:m.id};
          (state.panels=state.panels||[]).push(p);
          if(!state[p.id])state[p.id]={clienti:[],dipendenti:[],lavori:[],note:{}};
          changed=true;
        }else{
          p.nome=m.nome; p.icon=m.icona||p.icon; /* nome/icona dal DB come fonte primaria */
          if(pal){p.a=pal.a;p.ad=pal.ad;p.as=pal.as;}
        }
        return p;
      });
      if(changed)await save();
    }
    $("#panels").innerHTML=ps.length?ps.map(p=>{
      const mine=p.mestiere_id?rows.filter(l=>l.mestiere_id===p.mestiere_id):[];
      const tot=mine.length, df=mine.filter(l=>l.stato!=="fatto").length;
      return `<div class="panel-card" data-action="enter" data-p="${p.id}" style="background:linear-gradient(135deg,${p.a},${p.ad})">
        <button class="pc-del" data-action="del-panel" data-id="${p.id}" title="Elimina reparto">🗑</button>
        <span class="pc-ic">${p.icon}</span><h2>${esc(p.nome)}</h2>
        <span class="pc-meta">${df} da fare · ${tot} ${ruoloUtente==='professionista'?(tot===1?'pratica totale':'pratiche totali'):'lavori totali'}</span></div>`;
    }).join(""):`<div class="empty-rep">Ancora nessun reparto.<br>Creane uno qui sotto 👇</div>`;
  }

  const NOL_ULTIMO="nol_ultimo_reparto";

  /* ================================================================
     LA FRECCIA INDIETRO — regola decisa da Alessio il 22 agosto 2026
       · dentro una sezione (Mezzi, Clienti, Noleggi...) → torna al Riepilogo
       · nel Riepilogo                                   → esce dal noleggio
     E la scritta sulla freccia dice sempre dove porta, cosi' non si scopre
     dove si va dopo averci cliccato.
     Per cambiare reparto si clicca il NOME del reparto qui accanto.
     ================================================================ */
  function nolSezioneAttiva(){
    const b=document.querySelector("nav.tabs button.active");
    return b?b.dataset.tab:"riepilogo";
  }
  function nolScriviFreccia(){
    const f=document.querySelector(".back"); if(!f) return;
    f.textContent = nolSezioneAttiva()==="riepilogo" ? "← Esci" : "← Riepilogo";
  }
  function nolIndietro(){
    if(nolSezioneAttiva()!=="riepilogo"){
      const r=document.querySelector('nav.tabs button[data-tab="riepilogo"]');
      if(r){r.click();return;}
    }
    /* ⛔ 5 settembre 2026 — IL BIGLIETTINO DEL RIENTRO.
       Da oggi gestionale-app.html, quando lo si APRE, mostra la schermata dei
       reparti invece di rientrare nell'ultimo reparto (chiesto da Alessio con
       due fotografie). Ma chi torna DA QUI ci vuole rientrare, dentro, dov'era:
       e' la richiesta del →23← agosto («quando esco dal noleggio mi fa uscire
       completamente»). Quindi si lascia un bigliettino con l'ora: gestionale-app
       lo legge, e se e' fresco (meno di →10← secondi) rientra nel reparto.
       ⚠️ Serve anche per la strada `history.back()` qui sotto: tornando
       indietro nella storia il `document.referrer` NON e' questa pagina, quindi
       senza il bigliettino il rientro non si riconoscerebbe. */
    try{sessionStorage.setItem("gest_rientro",String(Date.now()));}catch(e){}
    /* si esce: si torna da dove si e' arrivati, se si sa. Se no, al gestionale. */
    try{
      if(document.referrer && new URL(document.referrer).origin===location.origin
         && document.referrer.indexOf("gestionale-noleggio")<0){ history.back(); return; }
    }catch(e){}
    /* ⛔ 4 settembre 2026 — QUI C'ERA «/gestionale», E PORTAVA FUORI STRADA.
       In netlify.toml «/gestionale» e' un rinvio a gestionale-invito.html, la
       pagina dove un DIPENDENTE scrive il codice che gli ha dato il titolare.
       Cosi' il titolare che usciva dal Noleggio senza sapere da dove era
       arrivato (link salvato, pagina aperta da sola, prima visita) si
       ritrovava a doversi far invitare nel gestionale suo. */
    location.href="/gestionale-app.html";
  }
  function enterPanel(id){
    cur=id;const p=(state.panels||[]).find(x=>x.id===id);if(!p)return goHome();
    try{localStorage.setItem(NOL_ULTIMO,id);}catch(e){}
    /* ⛔ 22 agosto 2026 — IL NOLEGGIO E' SEMPRE BLU.
       Ogni reparto ha il suo colore, e col reparto "casa" la testata diventava
       verde: sembrava un'altra applicazione. Il noleggio e' uno solo, e il suo
       colore e' quello del gestionale. Il colore del reparto resta scritto sul
       reparto (serve alle sue card), semplicemente non tinge piu' la testata. */
    const r=document.documentElement.style;
    r.setProperty("--accent","#0066ff");r.setProperty("--accent-d","#0047b3");r.setProperty("--accent-soft","#e8f1ff");
    $("#panel-name").textContent=p.nome;$("#panel-sub").textContent="Categoria "+p.nome;
    if($("#rie-title"))$("#rie-title").textContent="Riepilogo — "+p.nome;
    $("#landing").style.display="none";$("#appview").style.display="block";
    filter={stato:"tutti",q:""};$("#f-search").value="";cal=new Date();
    galFilter={op:"",tipo:""};$$("#gal-tipo .chip").forEach(x=>x.classList.toggle("on",x.dataset.v===""));
    agFilter={op:"",stato:"aperti"};$$("#ag-stato .chip").forEach(x=>x.classList.toggle("on",x.dataset.v==="aperti"));
    $$("#stato-chips .chip").forEach(c=>c.classList.toggle("on",c.dataset.stato==="tutti"));
    $$("nav.tabs button").forEach((x,i)=>x.classList.toggle("active",i===0));
    $$("section").forEach((s,i)=>s.classList.toggle("active",s.id==="riepilogo"));
    renderAll();renderRiepilogoNegozio();nolScriviFreccia();window.scrollTo(0,0);
  }
  function goHome(){cur=null;$("#appview").style.display="none";$("#landing").style.display="block";renderLanding();window.scrollTo(0,0);}

  /* 24 agosto 2026 — tolte le 5 sezioni morte del reparto (Agenda operatore,
     Lavori, Condomini, Squadra, Scadenzario): non si vedevano piu' da un
     pezzo, ma questa funzione le ricaricava lo stesso a ogni apertura,
     chiedendo dati "del reparto in cui sono" — una domanda che col reparto
     sparito non ha piu' risposta. */
  function renderAll(){if(!cur)return;renderRiepilogo();renderCal();renderFatture();renderGalleria();renderPromemoria();}

  async function renderRiepilogo(){
    return renderRiepilogoNegozio();
    /* soldi e ore: invariati per ora (dipendono dalle fatture, su localStorage) */
    const L=db().lavori;
    $("#k-daincassare").textContent=_eur(L.filter(l=>l.fattStato!=="pagata"&&l.stato==="fatto").reduce((s,l)=>s+(+l.importo||0),0));
    $("#k-incassato").textContent=_eur(L.filter(l=>l.fattStato==="pagata"&&thisMonth(l.dataFatto)).reduce((s,l)=>s+(+l.importo||0),0));
    const ore=L.filter(l=>thisMonth(l.dataFatto)||thisMonth(l.dataPrevista)).reduce((s,l)=>s+(+l.ore||0),0);
    $("#k-ore").textContent=(Math.round(ore*10)/10)+" h";
    /* contatori e prossimi: da gest_lavori su Supabase */
    if(!sb||!sbUid){
      $("#k-dafare").textContent=0;$("#k-incorso").textContent=0;$("#k-fatti").textContent=0;$("#k-lavori").textContent=0;
      $("#prossimi").innerHTML=`<div class="empty"><div class="ic">✅</div><p>Nessun lavoro in sospeso</p><small>Aggiungi un lavoro col pulsante "+ Nuovo lavoro"</small></div>`;
      return;
    }
    const {data}=await sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,data_fatto").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    const S=data||[];
    $("#k-dafare").textContent=S.filter(l=>l.stato==="da_fare").length;
    $("#k-incorso").textContent=S.filter(l=>l.stato==="in_corso").length;
    $("#k-fatti").textContent=S.filter(l=>l.stato==="fatto"&&thisMonth(l.data_fatto)).length;
    $("#k-lavori").textContent=S.length;
    const pross=S.filter(l=>l.stato!=="fatto").sort((a,b)=>(a.data_prevista||"9999").localeCompare(b.data_prevista||"9999")).slice(0,5);
    $("#prossimi").innerHTML=pross.length?pross.map(l=>jobCardSupa(l)).join(""):`<div class="empty"><div class="ic">✅</div><p>Nessun lavoro in sospeso</p><small>Aggiungi un lavoro col pulsante "+ Nuovo lavoro"</small></div>`;
  }

  async function renderRiepilogoNegozio(){
    const scrivi=(id,txt)=>{const e=$("#"+id);if(e)e.textContent=txt;};
    if(!(sb&&sbUid)){
      ["kn-mezzi","kn-fuori","kn-ritardo","kn-liberi","kn-prenotati"].forEach(i=>scrivi(i,0));
      ["kn-incasso","kn-daincassare","kn-cauzioni"].forEach(i=>scrivi(i,_eur(0)));
      ["kn-mezzi","kn-fuori","kn-ritardo","kn-liberi","kn-prenotati",
       "kn-incasso","kn-daincassare","kn-cauzioni"].forEach(i=>nolDett(i,[],false));
      if($("#rie-ritardi"))$("#rie-ritardi").innerHTML='<p style="color:#666;padding:8px">Nessun mezzo in ritardo.</p>';
      if($("#rie-scadenze"))$("#rie-scadenze").innerHTML='<p style="color:#666;padding:8px">Nessuna scadenza.</p>';
      return;
    }

    /* ── i numeri del noleggio ──
       ⛔ 24 agosto 2026 — tolto da qui il blocco "Magazzino e negozio"
       (neg_prodotti/neg_movimenti): era roba del gestionale Negozio,
       non del Noleggio, e qui non serviva a nessuno. */
    /* ⛔ 4 settembre 2026 — UNA LISTA SOLA. I mezzi stanno tutti in
       gest_mezzi, insieme a quelli del gestionale: qui si mostrano solo
       quelli con la spunta «lo noleggio» (noleggiabile), se no nel listino
       del Noleggio comparirebbe anche il furgone dell'impresa. */
    const {data:mezzi}=await sb.from("gest_mezzi").select("*").eq("user_id",sbUid).eq("noleggiabile",true);
    const MZ=mezzi||[];
    scrivi("kn-mezzi",MZ.length);
    const {data:nol}=await sb.from("nol_noleggi")
      .select("id,mezzo,mezzo_id,cliente,data_rientro_prevista,data_rientro_effettivo,importo,data_uscita,stato_pagamento,fase,cauzione,cauzione_stato,mestiere_id")
      .eq("user_id",sbUid);
    const N=nol||[], oggiN=todayStr();
    /* ⚠️ «fuori adesso» vuol dire dal cliente. Un mezzo PRENOTATO e' ancora
       in piazzale: contarlo fra quelli fuori direbbe una bugia. */
    const prenotati=N.filter(x=>nolFaseDi(x)==="prenotato");
    const fuori=N.filter(x=>nolFaseDi(x)==="fuori");
    const ritardo=fuori.filter(x=>x.data_rientro_prevista&&x.data_rientro_prevista<oggiN);
    scrivi("kn-fuori",fuori.length);
    scrivi("kn-ritardo",ritardo.length);
    scrivi("kn-prenotati",prenotati.length);
    /* liberi = i mezzi che non sono fuori in questo momento */
    /* ⚠️ liberi NON e' «mezzi meno noleggi aperti»: un noleggio vecchio puo'
       non avere il collegamento al mezzo, e il conto andava sotto zero.
       Libero e' il mezzo che non risulta fuori e non e' in officina. */
    /* un mezzo gia' promesso non e' libero, anche se e' ancora in piazzale */
    const fuoriIds={}; fuori.concat(prenotati).forEach(x=>{if(x.mezzo_id)fuoriIds[x.mezzo_id]=1;});
    scrivi("kn-liberi",MZ.filter(m=>!fuoriIds[m.id]&&m.stato!=="manutenzione"&&m.stato!=="noleggiato").length);
    /* ⚠️ «incassato» vuol dire incassato davvero: i noleggi ancora da pagare
       stanno nella casella accanto, non dentro questa. */
    /* ⛔ 4 settembre 2026 — IL NOLEGGIO INTERNO NON SI INCASSA. Un mezzo
       dato a un TUO reparto (mestiere_id pieno) e' un costo di quel reparto,
       e il gestionale imprese lo conta gia' come spesa. Qui finiva in «Da
       incassare» come se un cliente dovesse pagarlo: soldi che non
       arriveranno mai da nessuno, perche' sono i tuoi. Esterni = clienti
       veri; interni = i tuoi reparti, contati a parte, solo per saperlo. */
    const interno=x=>!!x.mestiere_id;
    const esterni=N.filter(x=>!interno(x));
    const delMese=esterni.filter(x=>thisMonth(x.data_uscita));
    const _somma=a=>a.reduce((s,x)=>s+(+x.importo||0),0);
    scrivi("kn-incasso",_eur(_somma(delMese.filter(x=>x.stato_pagamento==="pagato"))));
    scrivi("kn-daincassare",_eur(_somma(esterni.filter(x=>x.stato_pagamento!=="pagato"))));
    const interniAperti=_somma(N.filter(x=>interno(x)&&nolFaseDi(x)!=="rientrato"));
    /* ⛔ le cauzioni NON sono un incasso: stanno in una casella a parte
       apposta, se no il riepilogo racconta di avere soldi che deve rendere. */
    const cauApert=N.filter(x=>(+x.cauzione||0)>0&&cauStatoDi(x)==="in_deposito");
    scrivi("kn-cauzioni",_eur(cauApert.reduce((s,x)=>s+(+x.cauzione||0),0)));

    /* ── le due righette e il pallino di ogni scheda (vedi nolDett) ── */
    const inOfficina=MZ.filter(m=>m.stato==="manutenzione"||m.fuori_servizio);
    const bloccati=MZ.filter(m=>mezzoBloccato(m));
    const liberi=MZ.filter(m=>!fuoriIds[m.id]&&m.stato!=="manutenzione"&&m.stato!=="noleggiato");
    const nomeMezzo=x=>x.mezzo||"Mezzo senza nome";
    const ggRit=x=>{const g=_ggDa(x.data_rientro_prevista);return g+(g===1?" giorno":" giorni");};

    nolDett("kn-mezzi",[
      {t:"Liberi adesso",     v:String(liberi.length)},
      {t:"Fermi in officina", v:String(inOfficina.length)}
    ],bloccati.length>0);

    /* prima quelli che rientrano per primi: sono quelli su cui c'e' da muoversi */
    const fuoriOrd=fuori.slice().sort((a,b)=>
      String(a.data_rientro_prevista||"9999").localeCompare(String(b.data_rientro_prevista||"9999")));
    nolDett("kn-fuori",fuoriOrd.map(x=>({t:nomeMezzo(x),
      v:(x.data_rientro_prevista&&x.data_rientro_prevista<oggiN)
        ?"in ritardo di "+ggRit(x)
        :(x.data_rientro_prevista?"rientra il "+fdate(x.data_rientro_prevista):"senza data")})),
      ritardo.length>0);

    nolDett("kn-ritardo",ritardo.slice()
      .sort((a,b)=>String(a.data_rientro_prevista).localeCompare(String(b.data_rientro_prevista)))
      .map(x=>({t:nomeMezzo(x),v:"da "+ggRit(x)})),
      ritardo.length>0);

    nolDett("kn-liberi",[
      {t:"Fermi in officina",v:String(inOfficina.length)},
      {t:"Gi\u00e0 promessi",  v:String(prenotati.length)}
    ],false);

    nolDett("kn-prenotati",prenotati.slice()
      .sort((a,b)=>String(a.data_uscita||"9999").localeCompare(String(b.data_uscita||"9999")))
      .map(x=>({t:nomeMezzo(x),v:x.data_uscita?"esce il "+fdate(x.data_uscita):"senza data"})),
      false);

    const pagatiMese=delMese.filter(x=>x.stato_pagamento==="pagato");
    /* ⛔ 4 settembre 2026 — DOVE SI LEGGONO I NOLEGGI INTERNI. Tolti da «Da
       incassare» (non sono soldi che arriveranno), il loro valore non doveva
       sparire del tutto: sono i tuoi mezzi che stanno sui tuoi cantieri.
       Vanno qui, dove la seconda riga diceva soltanto il nome del mese, e si
       contano quelli ANCORA FUORI (non il mese): e' quello che serve sapere.
       ⚠️ nolDett mostra solo DUE righe: una terza non si vedrebbe mai. */
    nolDett("kn-incasso",[
      {t:"Noleggi pagati",v:String(pagatiMese.length)},
      interniAperti?{t:"Ai tuoi reparti (non si incassano)",v:_eur(interniAperti)}
                   :{t:"Nel mese di",   v:mesi[new Date(oggiN+"T00:00:00").getMonth()]}
    ],false);

    const daPagare=esterni.filter(x=>x.stato_pagamento!=="pagato"&&(+x.importo||0)>0);
    const vecchioNol=daPagare.slice()
      .sort((a,b)=>String(a.data_uscita||"9999").localeCompare(String(b.data_uscita||"9999")))[0];
    /* rosso solo se un noleggio non pagato e' uscito da piu' di 30 giorni:
       uno di ieri non e' un problema, uno di due mesi fa si'. */
    const nonPagatiVecchi=daPagare.filter(x=>{const g=_ggDa(x.data_uscita);return g!=null&&g>30;});
    nolDett("kn-daincassare",[
      {t:"Noleggi da pagare",v:String(daPagare.length)},
      vecchioNol?{t:"Il pi\u00f9 vecchio",
                  v:vecchioNol.data_uscita?fdate(vecchioNol.data_uscita):"senza data"}:null
    ],nonPagatiVecchi.length>0);

    const daSvincolare=cauApert.filter(cauDaSvincolare);
    nolDett("kn-cauzioni",[
      {t:"Noleggi con cauzione",v:String(cauApert.length)},
      {t:"Da svincolare subito",v:String(daSvincolare.length)}
    ],daSvincolare.length>0);
    if($("#rie-ritardi"))$("#rie-ritardi").innerHTML=ritardo.length?ritardo.map(x=>{
      const gg=Math.round((new Date(oggiN)-new Date(x.data_rientro_prevista))/86400000);
      return nolCard({col:"#c62828",
        titolo:esc(x.mezzo||"—"),
        eti:[{t:esc(gg+(gg===1?" giorno":" giorni"))}],
        corpo:`<div class="sub">${x.cliente?"Cliente: "+esc(x.cliente):"Cliente non indicato"}</div>
        <div class="sub2">Doveva rientrare il ${esc(fdate(x.data_rientro_prevista))}</div>`,
        pulsanti:nolPulsanti("noleggio",x.id)});}).join("")
      :'<p style="color:#666;padding:8px">Nessun mezzo in ritardo. Tutto sotto controllo.</p>';

    /* ── le scadenze: prima quelle che fermano il mezzo, poi quelle vicine ── */
    if($("#rie-scadenze")){
      const righe=[];
      MZ.forEach(m=>{
        const bl=mezzoBloccato(m);
        if(bl){ righe.push({m,col:"#c62828",eti:m.fuori_servizio?"FUORI SERVIZIO":"NON SI PUÒ DARE",
                            testo:(m.nome||"Questo mezzo")+" "+bl,ord:-1}); return; }
        mezzoScadenze(m).forEach(x=>{
          if(x.gg==null||x.gg<0||x.gg>SCAD_AVVISO_GG) return;
          righe.push({m,col:"#e65100",eti:"FRA "+x.gg+(x.gg===1?" GIORNO":" GIORNI"),
                      testo:x.cosa+": "+(x.data?fdate(x.data):"")+
                        (m.verifica_ente&&x.cosa==="Verifica periodica"?" · "+m.verifica_ente:""),ord:x.gg});
        });
      });
      righe.sort((a,b)=>a.ord-b.ord);
      $("#rie-scadenze").innerHTML=righe.length?righe.slice(0,12).map(r=>nolCard({col:r.col,
          titolo:esc(r.m.nome||"—"),
          eti:[{t:esc(r.eti)}],
          corpo:`<div class="sub2">${esc(r.testo)}</div>`,
          pulsanti:nolPulsanti("mezzo",r.m.id)})).join("")
        :'<p style="color:#666;padding:8px">Nessuna scadenza vicina. Verifiche, assicurazioni e revisioni sono a posto.</p>';
    }
  }
  $('[data-tab="riepilogo"]')?.addEventListener("click",renderRiepilogoNegozio);
