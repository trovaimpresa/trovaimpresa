// [SPOSTATO] gest-schede-clienti.js: era dentro gest-core.js, righe 3987-4805, spostato identico.
  /* ============================================================
     16 agosto 2026 — LE SCHEDE ERANO ALTE IL DOPPIO DEL NECESSARIO
     Nei Lavori una scheda mostra due pulsanti e mette il resto sotto
     i «...». Preventivi, Fatture, Clienti, Squadra, Mezzi, Scadenzario
     e Richieste dal sito no: stampavano TUTTE le voci come pulsanti.
     Un preventivo in bozza ne aveva sette, uno sotto l'altro: la scheda
     diventava alta come mezzo schermo e ogni scheda era alta in modo
     diverso dalla vicina, a seconda di quante voci aveva.
     Adesso passano tutte di qui: due pulsanti in chiaro, il resto nel
     menu «...». Cosi' le schede sono tutte della stessa altezza.
     Il primo dei due e' sempre quello che apre la scheda (edit-...),
     perche' e' quello che si usa piu' di tutti.
     ============================================================ */
  /* 16 agosto 2026 (2) — FUORI SI APRE E BASTA.
     Sulla scheda dell'elenco resta UN pulsante solo: «Apri». Tutto il
     resto — PDF, cambio stato, elimina — sta DENTRO la finestra, in
     fondo, accanto a Salva: si entra, si guarda, si decide.
     Le azioni in fondo alla finestra chiudono la finestra prima di
     partire (data-chiudi): se no cambi lo stato e resti davanti al
     modulo che mostra ancora quello vecchio. */
  function schedaApri(action,dati,lab){
    return `<button class="btn btn-sm ja" data-action="${action}"${tabAttr(dati)}>${lab||"Apri"}</button>`;
  }
  /* Il registro delle azioni: la scheda le mette da parte, la finestra che si
     apre se le prende e se le mette in fondo, accanto a Salva.
     Chiave = azione di apertura + id, cosi' due sezioni non si pestano i piedi. */
  /* L'azione che «apre» non si chiama uguale dappertutto: edit-prev,
     edit-mezzo, apri-cli, sq-edit, carta-dettaglio... sono tutte quella.
     Qui c'e' l'elenco, in un posto solo. */
  const AZ_APERTURA=/^(edit-|apri-)|^(sq-edit|carta-dettaglio)$/;
  const AZ_APRI={};
  let _azPendenti=null;
  /* L'azione che «apre» non si chiama uguale dappertutto: edit-prev,
     edit-mezzo, edit-scad, apri-cli, sq-edit... sono tutte quella. */
  function schedaUnPulsante(azioni){
    const az=(azioni||[]).filter(x=>x&&!x.sep);
    const i=az.findIndex(x=>x.action&&AZ_APERTURA.test(String(x.action)));
    if(i<0)return null;                       /* niente apertura: si resta come prima */
    const apri=az[i], resto=az.filter((x,k)=>k!==i);
    /* senza id non si sa cosa aprire: meglio lasciare la scheda com'era
       (due pulsanti e i «...») che dare un «Apri» che non apre niente */
    const rid=apri.data&&apri.data.id;
    if(rid==null||rid==="")return null;
    AZ_APRI[String(apri.action)+":"+String(rid)]=resto;
    return schedaApri(apri.action,apri.data,"Apri");
  }
  /* 16 agosto 2026 (3) — DOVE STANNO LE AZIONI DENTRO LA FINESTRA
     Prima erano tutte e nove in fondo, in fila con Annulla e Salva. Ma sono
     due cose diverse: «Annulla» e «Salva» riguardano quello che stai
     SCRIVENDO, «Scarica PDF» / «Segna inviato» / «Accettato» riguardano il
     DOCUMENTO e non c'entrano niente con i campi che stai compilando.
     Quindi: le azioni sul documento vanno IN ALTO, accanto al titolo — le
     vedi appena apri, prima di scendere nei campi. In fondo restano due
     pulsanti soli, sempre negli stessi due posti.
     «Elimina» sta in fondo A SINISTRA: in alto sarebbe a due centimetri
     dalla X per chiudere, e un giorno di fretta ci finisci sopra. */
  function _azBottone(a,cls){
    return `<button class="${cls}${a.del?" btn-danger":""}" data-chiudi="1" data-action="${a.action}"${tabAttr(a.data)}>${a.lab}</button>`;
  }
  function _azUtili(voci){
    /* NIENTE filtro sul nome dell'azione: l'azione che apre e' gia' stata
       tolta da schedaUnPulsante. Filtrando anche qui, nelle Carte spariva
       «Modifica» (edit-carta) solo perche' comincia per «edit-», mentre
       quella che apre la carta e' «carta-dettaglio». */
    return (voci||[]).filter(x=>x&&!x.sep);
  }
  function azioniSopra(voci){
    const v=_azUtili(voci).filter(x=>!x.del);
    return v.length?`<div class="sh-head-az">${v.map(a=>_azBottone(a,"btn btn-sm")).join("")}</div>`:"";
  }
  function azioniElimina(voci){
    const v=_azUtili(voci).filter(x=>x.del);
    return v.map(a=>_azBottone(a,"btn sh-foot-sx")).join("");
  }
  const SCHEDA_MENU={}; let _schedaMenuN=0;
  const SCHEDA_BTN_MAX=2;
  function schedaAzioni(azioni){
    const az=(azioni||[]).filter(x=>x&&!x.sep);
    if(!az.length)return "";
    const i=az.findIndex(x=>x.action&&AZ_APERTURA.test(String(x.action)));
    if(i>0){const e=az.splice(i,1)[0];az.unshift(e);}
    const primi=az.slice(0,SCHEDA_BTN_MAX), resto=az.slice(SCHEDA_BTN_MAX);
    let h=primi.map(a=>`<button class="btn btn-sm ja${a.del?" btn-danger del":""}" data-action="${a.action}"${tabAttr(a.data)}>${a.lab}</button>`).join("");
    if(resto.length){
      const k="sm"+(++_schedaMenuN);
      SCHEDA_MENU[k]=resto;
      h+=`<span class="job-menu"><button class="lav-dots" data-action="scheda-menu" data-k="${k}" title="Altre azioni">&#8943;</button></span>`;
    }
    return h;
  }
  function tabAttr(d){return Object.keys(d||{}).map(k=>` data-${k}="${esc(String(d[k]))}"`).join("");}
  function tabPop(voci){
    return '<div class="lav-pop">'+(voci||[]).map(v=>v.sep
      ? '<hr class="sep">'
      : `<button${v.del?' class="del"':''} data-action="${v.action}"${tabAttr(v.data)}>${v.lab}</button>`
    ).join("")+'</div>';
  }
  /* Nasconde il "+" in alto quando la sezione è vuota e c'e' già il
     bottone grande dentro il riquadro vuoto. Vale per tutte le sezioni. */
  function tabBottoneTesta(box, mostra){
    const sez=box&&box.closest?box.closest("section"):null;
    if(!sez)return;
    sez.querySelectorAll(".sec-head .btn.add").forEach(b=>{ b.style.display = mostra ? "" : "none"; });
  }

  function renderTabella(cfg){
    const box=$(cfg.box);if(!box)return;
    tabChiudiPop();
    const vb=cfg.viste?$(cfg.viste):null;
    if(vb)vb.innerHTML=(cfg.visteDef||[]).map(v=>{
      const n=(cfg.conta||{})[v.k]||0;
      const badge=n?`<span class="v-cnt${v.err?" err":""}">${n}</span>`:"";
      return `<button class="vista${cfg.vista===v.k?" on":""}" data-action="${cfg.azioneVista}" data-v="${v.k}">${v.lab}${badge}</button>`;
    }).join("");
    const R=cfg.righe||[];
    /* Mai due bottoni che fanno la stessa cosa: quando la sezione è vuota
       comanda quello grande in mezzo alla pagina, e quello piccolo in alto
       sparisce. Appena c'e' qualcosa dentro, torna. */
    /* 9 agosto 2026 — BUG SERIO risolto qui.
       Il "+" in alto si nascondeva ogni volta che l'elenco era vuoto, perché
       in mezzo alla pagina compare il bottone grande. Ma quando l'elenco è
       vuoto per colpa di una RICERCA, il messaggio "Nessun risultato" non ha
       nessun bottone: sparivano tutti e due e non si poteva più aggiungere
       niente, senza capire perché.
       Adesso il "+" si nasconde solo se il messaggio in mezzo ha davvero il
       suo bottone (lo si riconosce dalla classe lv-btn). */
    const _vuotoHtml=cfg.vuoto||"";
    const _vuotoHaBottone=_vuotoHtml.indexOf("lv-btn")>=0;
    tabBottoneTesta(box, R.length>0 || !_vuotoHaBottone);
    if(!R.length){box.style.display="block";box.innerHTML=cfg.vuoto||"";return;}
    /* il registro dei menu "..." si riempie PRIMA del bivio schede/tabella:
       prima stava solo nel ramo tabella, e nelle schede il menu restava vuoto */
    TAB_MENU[cfg.id]={};R.forEach(r=>{if(r.menu&&r.menu.length)TAB_MENU[cfg.id][String(r.id)]=r.menu;});
    /* le voci finite nei «...» delle schede si rifanno a ogni ridisegno:
       senza questa riga il registro cresce a ogni salvataggio e non si svuota mai */
    Object.keys(SCHEDA_MENU).forEach(k=>{delete SCHEDA_MENU[k];});
    /* SCHEDE SEMPRE, non solo su schermo stretto.
       Prima sul computer usciva una tabella a righe e sul telefono le schede:
       due disegni diversi per la stessa cosa. Ora ogni sezione ha la stessa
       forma del Riepilogo, su qualunque schermo.
       (Per tornare alle tabelle basta rimettere "!_deskTab()&&" qui davanti.) */
    if(cfg.cards){
      box.style.display="grid";box.classList.add("griglia-schede");
      /* ===== 12 agosto 2026 (sera) — LA RIGA DEI TOTALI ESISTEVA E NON SI VEDEVA =====
         Da quando le sezioni disegnano SEMPRE le schede (e non piu' la tabella
         sul computer), questo ramo esce da qui: e con la tabella se n'e' andata
         anche la riga dei totali. Quattro sezioni la calcolano da mesi e non la
         mostra nessuno — Lavori/Pratiche (quanto valgono in tutto), Agenda,
         Preventivi e Clienti (quanti sono). Adesso e' una fascia in cima alla
         griglia, larga quanto la pagina, e cambia con i filtri: se guardi "In
         ritardo", il totale e' di quelli in ritardo. */
      const _t=cfg.totale
        ? '<div class="tab-tot"><span>'+cfg.totale.testo+'</span>'
          +(cfg.totale.valore?('<b>'+cfg.totale.valore+'</b>'):'')+'</div>'
        : '';
      /* le card con i numeri stanno SOPRA la fascia dei totali: prima le
         domande («quanti sono fermi?»), poi il conto della lista */
      box.innerHTML=(cfg.numeri||"")+_t+cfg.cards();
      return;
    }
    box.classList.remove("griglia-schede");
    const freccia=k=>cfg.sortK===k?(cfg.sortD>0?" \u2191":" \u2193"):"";
    const cols=cfg.colonne.map(c=>`<col style="width:${c.w}">`).join("")+'<col style="width:36px">';
    const intest=cfg.colonne.map(c=>{
      const cl=c.cls?` class="${c.cls}"`:"";
      return (c.sort&&cfg.sortAction)
        ? `<th${cl} data-action="${cfg.sortAction}" data-k="${c.sort}" style="cursor:pointer">${c.lab}${freccia(c.sort)}</th>`
        : `<th${cl}>${c.lab}</th>`;
    }).join("")+"<th></th>";
    const corpo=R.map(r=>{
      const apri=r.click?` data-action="${r.click.action}"${tabAttr(r.click.data)}`:"";
      const celle=r.celle.map((cel,i)=>{
        const c=cfg.colonne[i]||{};
        const obj=cel&&typeof cel==="object";
        const cl=[c.cls,obj?cel.cls:""].filter(Boolean).join(" ");
        return `<td${cl?` class="${cl}"`:""}>${obj?cel.h:cel}</td>`;
      }).join("");
      const menu=(r.menu&&r.menu.length)
        ? `<button class="lav-dots" data-action="tab-menu" data-tab="${cfg.id}" data-id="${esc(String(r.id))}" title="Altre azioni">&#8943;</button>`
        : "";
      return `<tr${apri}>${celle}<td class="c-menu">${menu}</td></tr>`;
    }).join("");
    const ultima=cfg.colonne[cfg.colonne.length-1]||{};
    const tot=cfg.totale
      ? `<tr class="lav-tot"><td colspan="${cfg.colonne.length-1}">${cfg.totale.testo}</td><td class="${ultima.cls||""}">${cfg.totale.valore}</td><td></td></tr>`
      : "";
    box.style.display="block";
    box.innerHTML=`<table class="ltab"><colgroup>${cols}</colgroup><thead><tr>${intest}</tr></thead><tbody>${corpo}${tot}</tbody></table>`;
  }
  /* ---- stato vuoto, riusabile da tutte le sezioni ----
     Prima era solo un titolo e una riga: chi apriva una sezione vuota non
     capiva a cosa servisse ne' da dove cominciare. Ora la frase spiega cosa
     ci si fa, e il pulsante fa partire la cosa da fare senza andarla a cercare.
       titolo  il nome di quello che manca
       sotto   a cosa serve questa sezione, in parole semplici
       icona   svg già pronto (facoltativo)
       btn     {t:"testo del pulsante", a:"azione"} — si mette SOLO quando la
               sezione è davvero vuota, mai quando è un filtro a nascondere
               tutto: li' un pulsante "aggiungi il primo" è una bugia. */
  function tabVuoto(titolo,sotto,icona,btn){
    const b=btn?`<button class="btn-primary lv-btn" data-action="${btn.a}">${btn.t}</button>`:"";
    return `<div class="lav-vuoto">${icona||_SVGV+'<circle cx="12" cy="12" r="9"/></svg>'}<h3>${titolo}</h3><p>${sotto}</p>${b}</div>`;
  }
  /* ---- LA SCHEDA UNICA DI TUTTE LE SEZIONI ----
     Prima Lavori e Preventivi avevano un disegno (barretta colorata a sinistra,
     pulsanti in fondo) e Condomini, Squadra, Mezzi e Scadenzario un altro
     (niente barretta, pulsanti incolonnati a destra). Due modi di disegnare la
     stessa cosa: girando le sezioni il gestionale sembrava fatto da due persone.
     Ora passano tutte da qui.
       tono    "t-err" | "t-attesa" | "t-ok" | "t-neutro" — il colore della
               barretta a sinistra: rosso scaduto, arancione in arrivo, verde a
               posto, grigio quando non c'e' nessuno stato da dire
       titolo  il nome, in grande (già passato per esc)
       destra  la pastiglia di stato a destra del titolo, facoltativa
       meta    le righe di dettaglio, una per voce
       nota    il riquadro giallo in fondo (note libere), facoltativo
       azioni  [{lab,action,data,del}] — gli stessi oggetti dei menu "..." */
  function schedaJob(o){
    const meta=(o.meta||[]).filter(Boolean);
    return `<div class="job ${o.tono||"t-neutro"}">
      <div class="job-top"><div class="job-cli">${o.titolo||""}</div>${o.destra||""}</div>
      ${meta.length?`<div class="job-meta">${meta.map(x=>`<span>${x}</span>`).join("")}</div>`:""}
      ${o.nota?`<div class="job-note">${o.nota}</div>`:""}
      <div class="job-actions">${schedaUnPulsante(o.azioni)||schedaAzioni(o.azioni)}</div></div>`;
  }
  function tabVuotoCerca(q){
    /* il pulsante per togliere la ricerca: senza, chi cerca una cosa che non
       c'e' resta davanti a una schermata vuota senza capire che basta
       svuotare la casella qui sopra */
    return `<div class="lav-vuoto">${_SVGV}<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`
      + `<h3>Nessun risultato</h3><p>Niente trovato per «${esc(q)}».</p>`
      + `<button class="btn-primary lv-btn-cerca" data-action="cerca-azzera">Mostra tutti</button></div>`;
  }

  /* colonna Cliente: prima riga il nome (o "—" se il lavoro non ha cliente collegato),
     seconda riga l'indirizzo, che prima usurpava il posto del nome e confondeva. */
  function cellaCliente(nome,dove){
    const n=(nome||"").trim(), d=(dove||"").trim();
    let h=n?`<span class="cli-nome">${esc(n)}</span>`
           :`<span class="cli-nome vuoto">—</span>`;
    if(d)h+=`<span class="cli-dove">${esc(d)}</span>`;
    return h;
  }

  /* ---- RIGA COMPATTA del Riepilogo ----
     Le due liste del Riepilogo (prossimi lavori, preventivi in attesa) erano card
     alte con i pulsanti in fila: tanta altezza per poche informazioni, e le stesse
     azioni già presenti nella sezione vera. Qui la riga è alta 44px, il click
     apre l'elemento e non c'e' nessun pulsante.
     bar = classe di stato (.ritardo/.da_fare/.in_corso/.fatto)
     sub = [testo, ...] con eventuale {t,cls} per colorare il "quando". */
  function rigaCompatta(o){
    const sub=(o.sub||[]).filter(Boolean).map(x=>typeof x==="object"
      ? `<span class="${x.cls||""}">${esc(x.t)}</span>`
      : esc(x)).join(" · ");
    return `<div class="riga" data-action="${o.action}" data-id="${esc(String(o.id))}" title="${esc(o.titolo||"")}">
      <i class="riga-bar ${o.bar||"da_fare"}"></i>
      <span class="riga-txt"><span class="riga-tit">${esc(o.titolo||"—")}</span>${sub?`<span class="riga-sub">${sub}</span>`:""}</span>
      ${o.imp?`<span class="riga-imp">${o.imp}</span>`:""}
    </div>`;
  }

  let lavCache=[], lavTel={};
  async function renderJobs(){
    const box=$("#jobs-list"), viste=$("#lav-viste");
    if(!box)return;
    tabChiudiPop();
    if(!sb||!sbUid){if(viste)viste.innerHTML="";box.style.display="block";box.innerHTML=lavVuoto("tutti");return;}
    /* 28/09/2026 — senza reparto aperto le tre letture partivano con
       mestiere_id=null e Supabase rispondeva 400 (tre errori rossi nella
       console). Si aspetta di essere dentro un reparto. */
    if(!curMestiere())return;
    const oggi=todayStr();
    const [{data:lav},{data:ops},{data:cls}]=await Promise.all([
      /* Per gli studi si legge tutta la riga ("*") invece dell'elenco fisso: servono
         anche i campi della pratica per riaprirli in modifica. Con "*" non si rischia
         l'errore "colonna inesistente" se la migrazione SQL non è ancora stata fatta. */
      sb.from("gest_lavori").select(ruoloUtente==='professionista'?"*":"id,descrizione,dove,stato,data_prevista,operatore_id,cliente_id,importo,fatt_stato").eq("user_id",sbUid).eq("mestiere_id",curMestiere()),
      sb.from("gest_operatori").select("id,nome,telefono").eq("user_id",sbUid).eq("mestiere_id",curMestiere()),
      sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(curMestiere()))
    ]);
    const TUTTI=lav||[];
    lavCache=TUTTI;
    lavTel=Object.fromEntries((ops||[]).map(o=>[o.id,o.telefono||""]));
    const opName=Object.fromEntries((ops||[]).map(o=>[o.id,o.nome||""]));
    const cliName=Object.fromEntries((cls||[]).map(c=>[c.id,c.nome||""]));
    /* conteggi per vista: sulla lista intera, non su quella cercata */
    const conta={};LAV_VISTE.forEach(v=>conta[v.k]=lavFiltra(TUTTI,v.k,oggi).length);
    let L=lavFiltra(TUTTI,filter.vista,oggi);
    if(filter.q){
      const q=filter.q.toLowerCase();
      L=L.filter(l=>(l.descrizione||"").toLowerCase().includes(q)
                  ||(l.dove||"").toLowerCase().includes(q)
                  ||(cliName[l.cliente_id]||"").toLowerCase().includes(q));
    }
    /* In "Tutti" i finiti scendono in fondo: la lista serve a vedere cosa resta da fare.
       Nelle altre viste i lavori sono già tutti aperti o tutti chiusi, quindi conta solo la data. */
    const _fin=l=>l.stato==="fatto"?1:0;
    L.sort((a,b)=>(filter.vista==="tutti"?_fin(a)-_fin(b):0)
                ||(a.data_prevista||"9999").localeCompare(b.data_prevista||"9999"));
    const tot=L.reduce((a,l)=>a+(+l.importo||0),0);
    const _praPro=(ruoloUtente==='professionista');
    renderTabella({
      id:"lav", box:"#jobs-list",
      viste:"#lav-viste", visteDef:LAV_VISTE.map(v=>({k:v.k,lab:v.lab,err:v.k==="ritardo"})),
      vista:filter.vista, conta:conta, azioneVista:"lav-vista",
      vuoto:filter.q?tabVuotoCerca(filter.q):lavVuoto(filter.vista),
      /* 9 agosto 2026 — per uno studio la colonna "Chi" conta poco (spesso è
         solo lui), mentre "a che punto sta la pratica" — Depositata, In
         istruttoria, Integrazioni richieste — non si vedeva da NESSUNA parte
         pur essendo salvata nel database. Adesso è li'. */
      colonne:_praPro
        ? [{lab:"Pratica",w:"34%"},{lab:"Cliente",w:"22%",cls:"c-cli"},{lab:"Quando",w:"15%"},
           {lab:"A che punto",w:"17%",cls:"c-chi"},{lab:"Importo",w:"12%",cls:"c-imp"}]
        : [{lab:"Lavoro",w:"36%"},{lab:"Cliente",w:"24%",cls:"c-cli"},{lab:"Quando",w:"17%"},
           {lab:"Chi",w:"10%",cls:"c-chi"},{lab:"Importo",w:"13%",cls:"c-imp"}],
      righe:L.map(l=>{
        const q=quando(l.data_prevista,{neutro:l.stato==="fatto"});
        const late=inRitardo(l.stato,l.data_prevista);
        const _staPra=(PRATICA_STATI.find(x=>x[0]===l.pratica_stato)||[])[1]||"";
        return {
          id:l.id,
          click:{action:"edit-job",data:{id:l.id}},
          celle:[
            `<span class="lav-bar ${late?"ritardo":l.stato}" title="${late?"In ritardo":(statoLabel[l.stato]||l.stato)}"></span><span class="c-nome">${esc(l.descrizione||"\u2014")}</span>`
              +((_praPro&&l.pratica_tipo)?`<span class="pra-tag">${esc(l.pratica_tipo)}</span>`:""),
            cellaCliente(cliName[l.cliente_id],l.dove),
            {h:q.testo,cls:q.classe},
            _praPro?(_staPra?esc(_staPra):"\u2014"):esc(opName[l.operatore_id]||"\u2014"),
            +l.importo?eur(l.importo):"\u2014"
          ],
          menu:lavVoci(l,_waLavoro(l,lavTel[l.operatore_id]||""))
        };
      }),
      numeri:lavNumeri(TUTTI,oggi,_praPro),
      totale:{testo:L.length+" "+(L.length===1?"lavoro":"lavori"),valore:eur(tot)},
      cards:()=>L.map(l=>jobCardSupa(l,true,lavTel[l.operatore_id]||"",false,"lav")).join("")
    });
  }

  /* ⚠️ i due conti qui sotto NON sono riscritti: chiamano lavFiltra, la
     stessa funzione che fa le viste. Cosi' il numero sulla card e la lista
     che esce cliccandola non possono dire due cose diverse.
     ⚠️ Le card guardano SEMPRE tutti i lavori, non quelli filtrati a
     schermo: «quanti sono in ritardo» e' una domanda sul reparto, non
     sulla vista aperta adesso. La fascia dei totali qui sotto invece segue
     il filtro — sono due cose diverse ed e' giusto cosi'. */
  function lavNumeri(TUTTI,oggi,pro){
    const ritardo=lavFiltra(TUTTI,"ritardo",oggi);
    const daInc  =lavFiltra(TUTTI,"incassare",oggi);
    const valInc =daInc.reduce((s,l)=>s+(+l.importo||0),0);
    /* il piu' in ritardo di tutti: la card sopra dice quanti sono, questa
       dice qual e' il peggiore e da quanto sta li' */
    const peggio =ritardo.slice().sort((a,b)=>String(a.data_prevista||"9999").localeCompare(String(b.data_prevista||"9999")))[0];
    const gg     =peggio?_ggDa(peggio.data_prevista):null;
    /* uno / tanti scritti a mano: «pratica/pratiche» e «lavoro/lavori» non
       si fanno con una regola, si scrivono */
    const uno=pro?"pratica":"lavoro", tanti=pro?"pratiche":"lavori";
    const quanti=n=>n+" "+(n===1?uno:tanti);
    return numFila([
      ritardo.length?numCard({
        domanda:"In ritardo",
        numero:String(ritardo.length),
        sotto:quanti(ritardo.length)+" oltre la data",
        tono:"err", action:"lav-vista", v:"ritardo"}):null,
      peggio?numCard({
        domanda:"Il più in ritardo",
        numero:_ggCorto(gg),
        sotto:(peggio.descrizione||("Senza nome")),
        tono:"err", action:"edit-job", id:peggio.id}):null,
      daInc.length?numCard({
        domanda:"Finiti e non ancora incassati",
        numero:eur(valInc),
        sotto:quanti(daInc.length)+(daInc.length===1?" già fatto":" già fatti"),
        tono:"attesa", action:"lav-vista", v:"incassare"}):null
    ]);
  }

  let lfLavoroId=null;
  function showLavoroFoto(id,desc){
    lfLavoroId=id;
    if($("#lf-title"))$("#lf-title").textContent="Foto — "+(desc||"cosa fare");
    $$("nav.tabs button").forEach(x=>x.classList.remove("active"));
    $$("section").forEach(s=>s.classList.toggle("active",s.id==="lavoro-foto"));
    window.scrollTo(0,0);renderLavoroFoto();renderLavoroVideo();
  }
  async function renderLavoroFoto(){
    const grid=$("#lf-grid");if(!grid)return;
    if(!sb||!sbUid||!lfLavoroId){grid.innerHTML="";return;}
    const {data}=await sb.from("gest_foto").select("storage_path").eq("lavoro_id",lfLavoroId).eq("tipo","da_fare");
    const fs=data||[];
    if(!fs.length){grid.innerHTML=tabVuoto("Ancora nessuna foto",
      "Le foto di cosa c\u2019\u00e8 da fare e di com\u2019\u00e8 venuto. Chi va in cantiere le vede dal telefono nell\u2019app operaio, e a fine lavoro hai la prova di quello che hai fatto.",
      _SVGV+'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>');return;}
    grid.innerHTML="";
    for(const f of fs){
      const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
      if(su&&su.signedUrl){const d=document.createElement("div");d.className="thumb";const img=document.createElement("img");img.src=su.signedUrl;d.appendChild(img);grid.appendChild(d);}
    }
  }
  async function uploadLavoroFoto(files){
    if(!files||!files.length||!lfLavoroId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    let n=0;
    for(const file of Array.from(files)){
      /* ridimensiona a 1600px/JPEG 0.75 e blocca oltre 15 MB (js/foto-upload.js) */
      const p=await preparaFileUpload(file);
      if(p.errore){toast(p.errore);continue;}
      const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+"/"+lfLavoroId+"/"+Date.now()+"_"+safe;
      const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
      if(up){toast("Foto non caricata: "+up.message);continue;}
      const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,lavoro_id:lfLavoroId,tipo:"da_fare",operatore:"Capo",storage_path:path});
      if(ins){await _fileOrfano("gestionale-foto",path);toast("Foto non salvata: "+ins.message);continue;}
      n++;
    }
    if(n)toast(n===1?"Foto aggiunta ✔":n+" foto aggiunte ✔");
    renderLavoroFoto();
  }

  /* video "prima": stessa logica delle foto "cosa fare", bucket/tabella dedicati
     perché gest_foto assume sempre <img> nel rendering. Nessuna compressione:
     il video resta così com'e', solo il limite di 50 MB lo blocca se troppo grande. */
  async function renderLavoroVideo(){
    const grid=$("#lf-video-grid");if(!grid)return;
    if(!sb||!sbUid||!lfLavoroId){grid.innerHTML="";return;}
    const {data}=await sb.from("gest_video").select("id,storage_path").eq("lavoro_id",lfLavoroId).eq("tipo","da_fare");
    const vs=data||[];
    grid.innerHTML="";
    for(const v of vs){
      const {data:su}=await sb.storage.from("gestionale-video").createSignedUrl(v.storage_path,3600);
      if(su&&su.signedUrl){
        const d=document.createElement("div");d.className="thumb";
        d.innerHTML='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#222;color:#fff;font-size:22px;cursor:pointer">▶️</div>';
        d.onclick=()=>window.open(su.signedUrl,"_blank");
        grid.appendChild(d);
      }
    }
  }
  async function uploadLavoroVideo(files){
    if(!files||!files.length||!lfLavoroId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    const file=files[0];
    if(file.size>52428800){toast("Il video supera i 50 MB");return;}
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=sbUid+"/"+lfLavoroId+"/"+Date.now()+"_"+safe;
    const {error:up}=await sb.storage.from("gestionale-video").upload(path,file);
    if(up){toast("Video non caricato: "+up.message);return;}
    const {error:ins}=await sb.from("gest_video").insert({user_id:sbUid,lavoro_id:lfLavoroId,tipo:"da_fare",operatore:"Capo",storage_path:path});
    if(ins){await _fileOrfano("gestionale-video",path);toast("Video non salvato: "+ins.message);return;}
    toast("Video aggiunto ✔");renderLavoroVideo();
  }
  /* il PDF vero della fattura (quello del commercialista) si carica a mano e
     ora si appoggia alla FATTURA, non al lavoro: una fattura può avere dentro
     più lavori, ma il documento è uno solo. */
  let fattUploadId=null;
  function chiediFatturaPdf(fatturaId){
    fattUploadId=fatturaId;
    $("#fatt-pdf-file").click();
  }
  async function uploadFatturaPdf(file){
    if(!file||!fattUploadId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    if(file.type!=="application/pdf"){toast("Carica un file PDF");return;}
    /* il PDF non è un'immagine: preparaFileUpload lo lascia intatto, applica solo il limite */
    const p=await preparaFileUpload(file);
    if(p.errore){toast(p.errore);return;}
    const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=sbUid+"/fatture/"+fattUploadId+"/"+Date.now()+"_"+safe;
    const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
    if(up){toast("Fattura non caricata: "+up.message);return;}
    const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,fattura_id:fattUploadId,tipo:"fattura",operatore:"Capo",storage_path:path});
    if(ins){await _fileOrfano("gestionale-foto",path);toast("File non salvato: "+ins.message);return;}
    toast("Fattura PDF caricata \u2714");renderFatture();
  }
  async function apriFatturaPdf(fotoId){
    const f=Object.values(fatturaPdfCache).find(p=>String(p.id)===String(fotoId));
    if(!f)return;
    const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
    if(su&&su.signedUrl)window.open(su.signedUrl,"_blank");
    else toast("Non riesco ad aprire la fattura");
  }


  /* ---- note del giorno: prima vivevano solo nel browser (localStorage),
     ora su gest_note così si vedono da tutti i dispositivi e non si perdono.
     Se la tabella non c'e' ancora (migrazione SQL non eseguita) si torna al
     vecchio modo e si avvisa: nessuna nota va persa. ---- */
  let noteCache={}, noteSupaOk=true, noteAvvisato=false;
  async function caricaNote(){
    noteCache={};
    const mid=curMestiere();
    if(!sb||!sbUid||!mid){noteCache=Object.assign({},db().note||{});return;}
    const {data,error}=await sb.from("gest_note").select("data,testo").eq("user_id",sbUid).eq("mestiere_id",mid);
    if(error){
      noteSupaOk=false;noteCache=Object.assign({},db().note||{});
      if(!noteAvvisato){noteAvvisato=true;toast("Le note del calendario restano solo su questo dispositivo: manca la migrazione SQL (gest_note)");}
      return;
    }
    noteSupaOk=true;
    (data||[]).forEach(n=>{noteCache[n.data]=n.testo;});
    /* migrazione automatica: le vecchie note del browser salgono su Supabase
       una volta sola, poi il localStorage si svuota */
    const vecchie=Object.entries(db().note||{}).filter(([ds,tx])=>tx&&String(tx).trim());
    if(vecchie.length){
      const righe=vecchie.map(([ds,tx])=>({user_id:sbUid,mestiere_id:mid,data:ds,testo:String(tx)}));
      const {error:e2}=await sb.from("gest_note").upsert(righe,{onConflict:"user_id,mestiere_id,data",ignoreDuplicates:true});
      if(!e2){
        righe.forEach(r=>{if(!noteCache[r.data])noteCache[r.data]=r.testo;});
        db().note={};await save();
        toast("Le vecchie note del calendario sono state spostate su Supabase ✔");
      }
    }
  }

  let calJobs=[], calScad=[];
  async function renderCal(){
    const y=cal.getFullYear(), m=cal.getMonth();
    $("#cal-title").textContent=mesi[m]+" "+y;
    if(sb&&sbUid){const {data}=await sb.from("gest_lavori").select("id,descrizione,stato,data_prevista").eq("user_id",sbUid).eq("mestiere_id",curMestiere());calJobs=data||[];}
    else calJobs=[];
    /* ===== 12 agosto 2026 — LE SCADENZE SUL CALENDARIO =====
       Il calendario leggeva UNA tabella sola: i lavori. Le scadenze — DURC,
       assicurazioni, revisioni, tarature, visite mediche — hanno tutte una
       data e non si vedevano nel posto dove uno le va a cercare.
       Ed era un controsenso preciso: quando crei una pratica con data futura
       il gestionale ti propone "Vuoi che ti ricordi la data del ...?" e crea
       una scadenza, che poi sul calendario non compariva.
       Ci sono anche quelle delle PERSONE (visita medica, formazione, permesso
       di soggiorno), che non sono righe di gest_scadenze ma date sulla scheda. */
    calScad=[];
    if(sb&&sbUid){
      try{
        const mid=curMestiere();
        const [{data:sc},per]=await Promise.all([
          sb.from("gest_scadenze").select("id,titolo,data_scadenza,stato,mezzo_id")
            .eq("user_id",sbUid).eq("mestiere_id",mid),
          scadenzePersone(mid)
        ]);
        calScad=(sc||[]).filter(x=>x.data_scadenza)
          .map(x=>({id:x.id,titolo:x.titolo||"Scadenza",data:x.data_scadenza,fatta:x.stato==="fatta"}))
          /* si portano dietro _persona e _opId: nel riquadro del giorno servono
             per aprire la SCHEDA DELLA PERSONA invece del modulo scadenza (una
             visita medica non e' una riga di gest_scadenze, e' una data sulla
             scheda dell'operaio). */
          .concat((per||[]).map(x=>({id:x.id,titolo:x.titolo+" · "+x._nome,data:x.data_scadenza,fatta:false,
                                     _persona:true,_opId:x._opId})));
      }catch(e){ calScad=[]; }
    }
    await caricaNote();
    const lead=(new Date(y,m,1).getDay()+6)%7, days=new Date(y,m+1,0).getDate();
    const dow=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
    let html=dow.map(d=>`<div class="cal-dow">${d}</div>`).join("");
    for(let i=0;i<lead;i++)html+=`<div class="cal-cell empty"></div>`;
    /* Prima nella cella c'erano solo pallini: si vedeva "quanti", mai "quali".
       Ora ogni lavoro è una righina con la barretta di stato e il titolo troncato,
       gli stessi colori della tabella Lavori. Oltre il quarto: "+N". */
    /* ⚠️ 18 agosto 2026 — da 4 a 3. I nomi adesso vanno a capo invece di
       essere tagliati a meta', quindi ogni riga puo' occupare due righe
       vere: con quattro voci la casella diventava una colonna. Tre si
       leggono, e il «+N» dice quante ne restano — non si perde niente. */
    const MAX_CELLA=3;
    for(let d=1;d<=days;d++){
      const ds=ymd(y,m,d), jobs=calJobs.filter(l=>l.data_prevista===ds);
      const scaduto=ds<todayStr();
      /* le scadenze del giorno, sotto i lavori e con la loro barretta */
      const sc=calScad.filter(x=>x.data===ds);
      /* 12 agosto 2026 (sera) — i posti nella cella sono MAX_CELLA IN TUTTO, non
         quattro per i lavori piu' altri quattro per le scadenze. Prima si
         potevano vedere otto righe e il "+N" era calcolato lo stesso su
         MAX_CELLA: con 2 lavori e 3 scadenze ne vedevi 5 e c'era scritto "+1". */
      const nJobs=Math.min(jobs.length,MAX_CELLA);
      const nSc=Math.min(sc.length,MAX_CELLA-nJobs);
      const righe=jobs.slice(0,nJobs).map(j=>{
        const cls=j.stato==="fatto"?"fatto":(scaduto?"ritardo":(j.stato==="in_corso"?"in_corso":"da_fare"));
        const tit=j.descrizione||"Lavoro";
        return `<span class="cal-lav"><i class="cal-lav-bar ${cls}"></i><span class="cal-lav-t">${esc(tit)}</span></span>`;
      }).join("");
      const righeSc=sc.slice(0,nSc).map(x=>{
        const cls=x.fatta?"fatto":(scaduto?"ritardo":"scad");
        return `<span class="cal-lav"><i class="cal-lav-bar ${cls}"></i><span class="cal-lav-t">⏰ ${esc(x.titolo)}</span></span>`;
      }).join("");
      const tot=jobs.length+sc.length, mostrate=nJobs+nSc;
      const piu=tot>mostrate?`<span class="cal-piu">+${tot-mostrate}</span>`:"";
      const we=(lead+d-1)%7>=5?" we":"";
      const note=noteCache[ds]?`<span class="cal-note-mark">📌</span>`:"";
      html+=`<div class="cal-cell${ds===todayStr()?" today":""}${we}" data-action="open-day" data-d="${ds}"><span class="dn">${d}</span>${note}<div class="cal-lavori">${righe}${righeSc}${piu}</div></div>`;
    }
    $("#cal-grid").innerHTML=html;
    calListaTelefono(y,m,days);
  }

  /* ===== 26 settembre 2026 — IL CALENDARIO SUL TELEFONO (modello «A») =====
     Sul telefono le caselle sono larghe 48 px: i nomi dei lavori uscivano
     tagliati a pezzi («prat o…») e non si leggeva niente. Adesso sul
     telefono la griglia mostra solo i pallini colorati (lo fa il CSS) e
     sotto c'e' questo ELENCO, giorno per giorno, coi nomi interi:
     - mese di oggi: da oggi in avanti (oggi c'e' sempre, anche se vuoto);
     - un altro mese: tutti i giorni che hanno qualcosa.
     Sul computer l'elenco non si vede (display:none sopra i 760 px).
     Ogni riga apre quello che apre il riquadro del giorno: il lavoro, la
     scadenza, la scheda della persona. Il titolo del giorno apre il giorno. */
  function calListaTelefono(y,m,days){
    const grid=$("#cal-grid"); if(!grid)return;
    let box=$("#cal-lista");
    if(!box){ grid.insertAdjacentHTML("afterend",'<div id="cal-lista" class="cal-lista"></div>'); box=$("#cal-lista"); }
    const oggi=todayStr(), meseOggi=oggi.slice(0,7)===ymd(y,m,1).slice(0,7);
    const GG=["domenica","luned\u00ec","marted\u00ec","mercoled\u00ec","gioved\u00ec","venerd\u00ec","sabato"];
    let h="";
    for(let d=1;d<=days;d++){
      const ds=ymd(y,m,d);
      if(meseOggi&&ds<oggi)continue;
      const jobs=calJobs.filter(l=>l.data_prevista===ds), sc=calScad.filter(x=>x.data===ds), nota=noteCache[ds];
      if(!jobs.length&&!sc.length&&!nota&&ds!==oggi)continue;
      const scaduto=ds<oggi, dd=new Date(y,m,d);
      const nome=GG[dd.getDay()], tit=nome.charAt(0).toUpperCase()+nome.slice(1)+" "+d+" "+mesi[m];
      h+='<div class="cl-g'+(ds===oggi?" oggi":"")+'" data-action="open-day" data-d="'+ds+'">'
        +(ds===oggi?"Oggi \u00b7 ":"")+esc(tit)+'</div>';
      jobs.forEach(j=>{
        const cls=j.stato==="fatto"?"fatto":(scaduto?"ritardo":(j.stato==="in_corso"?"in_corso":"da_fare"));
        h+='<div class="cl-r" data-action="edit-job" data-id="'+esc(String(j.id))+'"><i class="cal-lav-bar '+cls+'"></i>'
          +'<span class="cl-t">'+esc(j.descrizione||"Lavoro")+'</span><span class="cl-f">\u203a</span></div>';
      });
      sc.forEach(x=>{
        const cls=x.fatta?"fatto":(scaduto?"ritardo":"scad");
        const az=x._persona?'data-action="scad-persona" data-id="'+esc(String(x._opId||""))+'"'
                           :'data-action="edit-scad" data-id="'+esc(String(x.id))+'"';
        h+='<div class="cl-r" '+az+'><i class="cal-lav-bar '+cls+'"></i>'
          +'<span class="cl-t">Scadenza: '+esc(x.titolo)+'</span><span class="cl-f">\u203a</span></div>';
      });
      if(nota)h+='<div class="cl-r" data-action="open-day" data-d="'+ds+'"><i class="cal-lav-bar nota"></i>'
          +'<span class="cl-t">Nota: '+esc(String((nota&&nota.testo)||nota).slice(0,80))+'</span><span class="cl-f">\u203a</span></div>';
      if(!jobs.length&&!sc.length&&!nota)h+='<div class="cl-vuoto">Niente in programma</div>';
    }
    box.innerHTML=h||'<div class="cl-vuoto">Niente in programma in questo mese</div>';
  }

  /* ===== 12 agosto 2026 — IL RIQUADRO DEL GIORNO =====
     Tre cose che non andavano, tutte e tre qui dentro:

     1) SUL TELEFONO NON SI CHIUDEVA. Questa finestra non aveva ne' la X ne'
        un pulsante Chiudi: l'unico modo previsto era cliccare FUORI dal
        foglio. Ma sotto gli 880 px il foglio e' largo quanto lo schermo e
        alto quanto lo schermo (css/gestionale.css, .sheet dentro la media
        query): un "fuori" non esiste. E in tutto il file non c'e' un solo
        gestore del tasto Esc. Chi apriva un giorno solo per guardarlo restava
        dentro, e doveva ricaricare la pagina o salvare una nota che non
        voleva salvare. Adesso c'e' il pulsante Chiudi.
     2) LE RIGHE SEMBRAVANO CLICCABILI E NON LO ERANO. Il CSS mette la manina
        (.day-job ha cursor:pointer) ma non c'era nessuna azione: ci cliccavi
        sopra e non succedeva niente. Dal calendario non si poteva aprire un
        lavoro. Adesso si apre, come gia' si fa dal Riepilogo.
     3) UN LAVORO "IN CORSO" VENIVA SCRITTO "DA FARE". Nella cella del
        calendario la barretta blu c'e' e la legenda lo promette; appena
        aprivi il giorno diventava "Da fare" col pallino ambra. */
  function openDay(ds){
    const jobs=calJobs.filter(l=>l.data_prevista===ds);
    const list=jobs.length?jobs.map(j=>{
      const sf=j.stato==="fatto", inCorso=j.stato==="in_corso", late=inRitardo(j.stato,ds);
      const cls=sf?'fatto':(late?'ritardo':(inCorso?'in_corso':'da_fare'));
      const lab=sf?'Fatto':(inCorso?'In corso':'Da fare');
      const dot=sf?'done':(late?'ritardo':(inCorso?'corso':'todo'));  /* .dot.corso esiste gia' nel CSS, la usa la legenda del calendario */
      return `<div class="day-job" data-action="edit-job" data-id="${esc(String(j.id))}" title="Apri il lavoro"><i class="dot ${dot}"></i>
        <div style="flex:1"><b style="font-size:14px">${esc(j.descrizione||"(senza descrizione)")}</b></div>
        <span class="stato ${cls}">${lab}</span></div>`;}).join("")
      :`<p style="color:var(--muted);font-size:14px;margin-bottom:12px">Nessun lavoro in questa data.</p>`;
    /* le scadenze di quel giorno: sola lettura, ma almeno si vedono */
    const scDel=calScad.filter(x=>x.data===ds);
    /* 12 agosto 2026 (sera) — queste righe usano .day-job, che nel CSS ha la
       manina (cursor:pointer): stamattina ho reso cliccabili i lavori e ho
       aggiunto queste SENZA azione, ricreando lo stesso difetto che avevo
       appena chiuso. Adesso si aprono: la scadenza vera nel suo modulo, quella
       di una persona nella scheda della persona (li' si cambia la data). */
    const listSc=scDel.length?scDel.map(x=>{
      const late=!x.fatta&&ds<todayStr();
      const azione=x._persona
        ? `data-action="scad-persona" data-id="${esc(String(x._opId||""))}" title="Apri la scheda della persona"`
        : `data-action="edit-scad" data-id="${esc(String(x.id))}" title="Apri la scadenza"`;
      return `<div class="day-job" ${azione}><i class="dot ${x.fatta?'done':(late?'ritardo':'todo')}"></i>
        <div style="flex:1"><b style="font-size:14px">⏰ ${esc(x.titolo)}</b></div>
        <span class="stato ${x.fatta?'fatto':(late?'ritardo':'da_fare')}">${x.fatta?'Fatta':(late?'Scaduta':'Scadenza')}</span></div>`;}).join(""):"";
    /* ⛔ 29 agosto 2026 — Alessio: «la voglio come e' su tutti i gestionali».
       Era l'ultima finestra rimasta con la sola freccia in cima invece della
       testata col titolo e del piede fermo. Il contenuto e' lo stesso: cambia
       solo la porta da cui passa — qui titolo, corpo e azioni vanno separati,
       perche' e' cosi' che openSheetGrande li vuole nelle imprese. */
    openSheetGrande(fdate(ds),
      `<div class="day-jobs">${list}${listSc}</div>
      <div class="field"><label>📌 Nota / promemoria del giorno</label>
        <textarea id="day-note" placeholder="Es. chiamare amministratore, portare scala...">${esc(noteCache[ds]||"")}</textarea></div>`,
      `<button class="btn b-cancel" data-action="close">Chiudi</button>
        <button class="btn b-cancel" data-action="new-job-date" data-d="${ds}">+ Lavoro in questa data</button>
        <button class="btn-primary b-save" data-action="save-note" data-d="${ds}">Salva nota</button>`);
  }

  /* Condomini e Squadra sono rubriche: non hanno stati, quindi niente viste.
     Al loro posto la sola ricerca, che qui è l'unico modo utile di restringere. */
  let cliQ="", dipQ="";
  function cliVoci(c){
    return [
      {lab:"👁 Apri scheda",action:"apri-cli",data:{id:c.id}},
      {lab:"🗺 Mappa",action:"map",data:{q:cliIndirizzo(c)||c.nome}},
      {sep:true},
      {lab:"🗑 Elimina",action:"del-cli",data:{id:c.id},del:true}
    ];
  }
  /* l'indirizzo completo del cliente, rimesso insieme dai pezzi.
     Se città e CAP non sono compilati resta quello che c'era prima: chi ha
     già scritto tutto dentro "Via e numero" non perde niente. */
  function cliIndirizzo(c){
    if(!c)return "";
    const via=(c.indirizzo||"").trim();
    const coda=[(c.cap||"").trim(),(c.citta||"").trim()].filter(Boolean).join(" ");
    const pr=(c.prov||"").trim();
    if(!coda&&!pr)return via;
    return [via,coda+(pr?" ("+pr.toUpperCase()+")":"")].filter(Boolean).join(", ");
  }
  function cliCard(c){
    const fisc=[c.piva?"P.IVA "+esc(c.piva):"", c.cod_fiscale?"C.F. "+esc(c.cod_fiscale):""].filter(Boolean).join(" · ");
    const ind=cliIndirizzo(c);
    const TAG={azienda:"Azienda",condominio:"Condominio",privato:"Privato"};
    const tag=TAG[c.tipo]?'<span class="tipo-tag">'+TAG[c.tipo]+'</span>':"";
    return schedaJob({
      tono:"t-neutro",                 /* un cliente non ha uno stato: barretta grigia */
      titolo:esc(c.nome)+tag,
      meta:[ind?"📍 "+esc(ind):"",
            c.referente?"👤 "+esc(c.referente):"",
            c.telefono?"📞 "+esc(c.telefono):"",
            c.email?"✉️ "+esc(c.email):"",
            fisc?"🧾 "+fisc:""],
      azioni:cliVoci(c)
    });
  }
  /* ===== 9 agosto 2026 — l'avviso "ha N lavori collegati" diceva sempre 0 =====
     Contava su db().lavori, lo store LOCALE, che col flusso Supabase resta
     sempre vuoto: le pratiche stanno su gest_lavori. Quindi un cliente con
     dieci pratiche e tre fatture si cancellava col messaggio generico. */
  async function delCli(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const pro=ruoloUtente==='professionista';
    let nLav=0,nFat=0;
    try{
      const [{count:cl},{count:cf}]=await Promise.all([
        sb.from("gest_lavori").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("cliente_id",id),
        sb.from("gest_fatture").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("cliente_id",id)
      ]);
      nLav=cl||0; nFat=cf||0;
    }catch(e){}
    const pezzi=[];
    if(nLav)pezzi.push(nLav+" "+(pro?(nLav===1?"pratica":"pratiche"):(nLav===1?"lavoro":"lavori")));
    if(nFat)pezzi.push(nFat+" "+(nFat===1?"fattura":"fatture"));
    /* 9 agosto 2026 — la rassicurazione elencava solo le pratiche anche quando
       aveva appena contato una fattura: si costruisce da quello che ha trovato. */
    const restano=[];
    if(nLav)restano.push(pro?"le pratiche":"i lavori");
    if(nFat)restano.push(nFat===1?"la fattura":"le fatture");
    const msg=pezzi.length
      ? "Questo cliente ha "+pezzi.join(" e ")+" collegate."
        +(window.cestinoAttivo&&window.cestinoAttivo()
          ? "\n\nFinisce nel Cestino e puoi rimetterlo a posto; "+restano.join(" e ")+" restano."
          : "\n\nEliminarlo comunque?")
      : "Eliminare questo cliente?";
    if(!gconfirm(msg))return;
    const {data:okDc,error}=await sb.from("gest_clienti").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!okDc||!okDc.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
    renderClienti();toast("Cliente eliminato");
  }
  async function renderClienti(){
    const box=$("#cli-list");if(!box)return;
    if(!sb||!sbUid){box.style.display="block";box.innerHTML=tabVuoto("Nessun cliente","Accedi per gestire i clienti.");return;}
    const {data}=await sb.from("gest_clienti").select("*").eq("user_id",sbUid).or(_cliOr(curMestiere())).order("nome");
    cliCache=data||[];
    let L=cliCache;
    if(cliQ){
      /* ===== 12 agosto 2026 (sera) — LA RICERCA CLIENTI GUARDAVA CINQUE CAMPI =====
         E non quelli che si usano davvero. Il commercialista ti manda una
         partita IVA e ti chiede di chi è: la incollavi qui e non trovava
         NIENTE, perché la P.IVA non veniva nemmeno guardata. Stessa cosa per
         codice fiscale, comune, CAP, provincia, codice SdI e note.
         E un telefono scritto «333 111 2222» non trovava quello salvato
         «3331112222»: adesso i numeri si confrontano senza spazi né punti. */
      const q=cliQ.trim().toLowerCase();
      const _cifre=s=>String(s||"").replace(/[\s.\-\/()]/g,"").toLowerCase();
      const qn=_cifre(q);
      L=L.filter(function(c){
        const campi=[c.nome,c.indirizzo,c.citta,c.prov,c.cap,c.referente,c.telefono,
                     c.email,c.piva,c.cod_fiscale,c.sdi_codice,c.sdi_pec,c.note];
        if(campi.some(x=>String(x||"").toLowerCase().includes(q)))return true;
        return qn.length>=3 && campi.some(x=>_cifre(x).includes(qn));
      });
    }
    renderTabella({
      id:"cli", box:"#cli-list",
      vuoto:cliQ?tabVuotoCerca(cliQ):tabVuoto("Qui tieni i tuoi clienti",
        "Nome, indirizzo, referente e telefono. Una volta inserito un cliente lo scegli dal menu quando crei un lavoro o un preventivo, senza riscrivere l\u2019indirizzo ogni volta.",
        _SVGV+'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg>',
        {t:"+ Aggiungi il primo cliente",a:"new-cli"}),
      colonne:[{lab:"Nome",w:"30%"},{lab:"Indirizzo",w:"34%",cls:"c-cli"},
               {lab:"Referente",w:"20%",cls:"c-chi"},{lab:"Telefono",w:"16%",cls:"c-chi"}],
      righe:L.map(c=>({
        id:c.id,
        click:{action:"edit-cli",data:{id:c.id}},
        /* l'indirizzo completo (con CAP, comune e provincia), non la sola via:
           due «Via Roma 10» di due paesi diversi erano indistinguibili */
        celle:[`<span class="c-nome">${esc(c.nome||"—")}</span>`,esc(cliIndirizzo(c)||"—"),esc(c.referente||"—"),esc(c.telefono||"—")],
        menu:cliVoci(c)
      })),
      totale:{testo:L.length+" "+(L.length===1?"cliente":"clienti"),valore:""},
      cards:()=>L.map(c=>cliCard(c)).join("")
    });
  }

  /* giorni da oggi alla data ds (positivo = nel futuro)
     ⛔ AIUTO COMUNE: NON portarla via in una fetta. Stava in mezzo ai mezzi
     e sembrava loro, ma la chiamano anche il controllo delle date, i
     preventivi in attesa, js/gest-fatture.js e js/gest-riepilogo.js.
     Il 6 settembre 2026 la fetta dei mezzi le e' stata tagliata intorno. */
  function _giorniA(ds){if(!ds)return null;const[y,m,d]=ds.split("-").map(Number);const a=new Date(y,m-1,d);const o=new Date();o.setHours(0,0,0,0);return Math.round((a-o)/86400000);}
