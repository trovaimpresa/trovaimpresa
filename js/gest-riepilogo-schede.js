// [SPOSTATO] gest-riepilogo-schede.js: era dentro gest-core.js, righe 3412-3986, spostato identico.
  /* ============================================================
     RENDER PIGRO — prima renderAll ridisegnava le 15 sezioni insieme
     (~60 letture dal database) a ogni ingresso E a ogni salvataggio.
     Ora ridisegna solo la sezione aperta; le altre vengono segnate
     "da rifare" e si caricano alla prima apertura (vedi il click sui tab).
     renderClienti e renderDip girano comunque: riempiono cliCache e
     dipCache, che le tendine "Cliente" e "Chi ci va" del form lavoro
     usano da qualsiasi sezione.
     ============================================================ */
  const _tabSporchi=new Set();
  function tabCorrente(){const b=document.querySelector("nav.tabs button.active");return (b&&b.dataset.tab)||"riepilogo";}
  function renderAll(){
    if(!cur)return;
    Object.keys(RENDER_TAB).forEach(x=>_tabSporchi.add(x));
    const t=tabCorrente();
    _tabSporchi.delete(t);_tabSporchi.delete("clienti");_tabSporchi.delete("squadra");
    renderClienti();renderDip();
    if(t!=="clienti"&&t!=="squadra"){const fn=RENDER_TAB[t];if(fn)fn();}
    renderContatori();contaDalSito();
  }
  /* Dopo un salvataggio: ridisegna subito solo le sezioni che l'utente sta
     guardando; le altre si segnano "da rifare" per la prossima apertura. */
  function rinfresca(){
    const t=tabCorrente();
    for(const tb of arguments){
      if(tb===t){_tabSporchi.delete(tb);const fn=RENDER_TAB[tb];if(fn)fn();}
      else _tabSporchi.add(tb);
    }
    renderContatori();
  }
  /* 12 agosto 2026 — il Cestino non si aggiornava MAI dopo una cancellazione:
     eliminavi un cliente, aprivi il Cestino e trovavi la lista di prima, senza
     la cosa appena buttata. Le 34 cancellazioni sparse nel file chiamano chi
     rinfresca() e chi direttamente renderQualcosa(): invece di correggerle una
     per una (e dimenticarne qualcuna), lo dice js/cestino.js, che e' l'unico
     punto da cui passano TUTTE le cancellazioni del gestionale. */
  window.segnaCestinoDaRifare=function(quante){
    try{
      _tabSporchi.add("cestino");
      /* il pallino sale subito: se no restava indietro finche' non si apriva
         la sezione.
         12 agosto 2026 (sera) — prima saliva di UNO per ogni comando, non per
         ogni riga: eliminavi un reparto con 40 pratiche e faceva +2 invece di
         +41, e una cancellazione che non trovava niente lo faceva salire lo
         stesso. Adesso js/cestino.js dice quante righe sono davvero finite nel
         cestino; se non si puo' sapere (chi ha cancellato non ha chiesto
         indietro le righe) si rilegge il numero vero invece di indovinare. */
      if(typeof cestTotale==="number"){
        if(typeof quante==="number"&&quante>=0){
          if(quante>0){cestTotale+=quante;setCnt("#cnt-cestino",cestTotale,"attesa");}
        }else{
          cestContato=false;contaCestinoUnaVolta();
        }
      }
      if(tabCorrente()==="cestino"){_tabSporchi.delete("cestino");renderCestino();}
    }catch(e){}
  };
  /* Il pallino del Cestino c'era nel menu dal primo giorno e non si e' mai
     acceso: nessuno lo riempiva. Il conteggio vero costa 18 domandine (solo il
     numero, nessuna riga scaricata), quindi si fa UNA volta per sessione; poi
     si tiene aggiornato da solo — renderCestino lo riscrive esatto a ogni
     apertura, e ogni cosa buttata via lo fa salire di uno. */
  let cestContato=false;
  async function contaCestinoUnaVolta(){
    if(cestContato||!sb||!sbUid)return;
    if(!(window.cestinoAttivo&&window.cestinoAttivo()))return;
    const st=window.cestinoStato&&window.cestinoStato();
    if(st&&st.attesa>0)return;              /* non si sa ancora: si riprova al giro dopo */
    cestContato=true;
    const mioGiro=++cestGen;
    try{
      const n=await Promise.all(CEST_COSE.map(function(c){
        return sb.raw(c.t).select("id",{count:"exact",head:true})
          .eq("user_id",sbUid).not("eliminato_il","is",null)
          .then(x=>(x&&typeof x.count==="number")?x.count:null).catch(()=>null);
      }));
      /* 13 agosto 2026 — qui il catch restituiva ZERO, cioe' trasformava "non
         ho potuto contare" in "non c'e' niente": con la rete giu' il pallino
         spariva, e cestContato=true gli impediva di riprovare da solo. Adesso
         una tabella che non risponde vale null, e se anche una sola e' null il
         pallino non si tocca e si riprova al giro dopo. */
      if(n.some(v=>v==null)){cestContato=false;return;}
      /* se nel frattempo ne e' partito un altro, questo e' vecchio: i suoi
         numeri sono di prima e non devono toccare il pallino */
      if(mioGiro!==cestGen)return;
      cestTotale=n.reduce((a,b)=>a+b,0);
      setCnt("#cnt-cestino",cestTotale,"attesa");
    }catch(e){cestContato=false;}
  }
  /* 13 agosto 2026 — IL PALLINO NON SCENDEVA MAI.
     Nella vista di partenza ("Questo reparto") il numero del menu poteva solo
     salire: eliminavi un reparto, il pallino diceva 15, rimettevi tutto a
     posto e il Cestino restava vuoto ma il pallino continuava a dire 15, con
     l'intestazione che diceva "0 cose eliminate in questo reparto". Si
     sistemava solo cliccando "Tutti i reparti".
     Il conto vero esiste gia' (18 domande di solo conteggio, nessuna riga
     scaricata): bastava rifarlo ogni volta che qualcosa esce dal Cestino. */
  /* Serve un gettone: senza, due riconteggi che si accavallano (clic ripetuti,
     o uno lento e uno veloce) scrivono nel pallino in ordine di ARRIVO e non di
     partenza. Il vecchio, tornato per ultimo, rimetteva il numero di prima:
     pallino 13 col Cestino vuoto, cioe' esattamente il difetto che questa
     correzione doveva chiudere — e non si riparava piu' girando per il
     gestionale. Misurato: capitava una volta su otto.
     In vista "Tutti i reparti" non serve nemmeno contare: renderCestino, che
     parte un istante dopo, il totale esatto ce l'ha gia' — erano 18 domande
     buttate a ogni ripristino. */
  let cestGen=0;
  function _cestRicontaPallino(){
    if(cestVista==="tutti")return;
    cestContato=false; contaCestinoUnaVolta();
  }

  /* ============================================================
     CONTATORI DEL MENU (tappa 2)
     Pallino a destra della voce, solo se il numero e' > 0.
     Rosso = problema reale (lavoro in ritardo, scadenza scaduta);
     ambra = roba che aspetta. Stessa regola dei colori di stato.
     ============================================================ */
  function setCnt(sel,n,tipo){
    const el=$(sel);if(!el)return;
    el.className="tab-cnt";
    if(!n){el.textContent="";return;}          /* :empty lo nasconde */
    el.textContent=n>99?"99+":String(n);
    el.classList.add(tipo==="err"?"err":"attesa");
    el.title=tipo==="err"?"Ci sono elementi in ritardo o scaduti":"In attesa";
  }
  async function renderContatori(){
    ["#cnt-lavori","#cnt-preventivi","#cnt-mezzi","#cnt-attrezzature","#cnt-scadenzario","#cnt-fornitori","#cnt-promemoria"].forEach(x=>setCnt(x,0));
    if(!sb||!sbUid||!cur)return;
    const mid=curMestiere();if(!mid)return;
    const oggi=todayStr(), lim30=_giorniDopo(oggi,30);
    try{
      const [{data:lav},{data:pv},{data:mz},{data:vw},{data:sc},{data:ff}]=await Promise.all([
        sb.from("gest_lavori").select("stato,data_prevista").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_preventivi").select("stato").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_mezzi").select("id,categoria").eq("user_id",sbUid).or(_cliOr(mid)),
        sb.from("gest_mezzi_scadenze").select("mezzo_id,scadute,prossima_data").eq("user_id",sbUid),
        sb.from("gest_scadenze").select("stato,data_scadenza").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_fatture_fornitori").select("stato,scadenza").eq("user_id",sbUid).eq("mestiere_id",mid)
      ]);
      /* Lavori: aperti (da fare o in corso). Rosso se almeno uno è in ritardo. */
      const aperti=(lav||[]).filter(l=>l.stato!=="fatto");
      setCnt("#cnt-lavori",aperti.length,aperti.some(l=>inRitardo(l.stato,l.data_prevista))?"err":"attesa");
      /* Preventivi: in attesa di risposta. */
      setCnt("#cnt-preventivi",(pv||[]).filter(p=>p.stato==="bozza"||p.stato==="inviato").length,"attesa");
      /* Mezzi e Attrezzature: la vista gest_mezzi_scadenze non ha mestiere_id,
         quindi filtro sui mezzi del reparto.
         12 agosto 2026 — due pallini, non uno: stanno nella stessa tabella ma
         sono due sezioni diverse, e prima le tarature degli strumenti finivano
         nel pallino dei Mezzi (che al professionista e' pure nascosto).
         Attrezzature era l'unica sezione con delle scadenze e senza pallino. */
      const _idVeicoli=new Set((mz||[]).filter(m=>m.categoria!=="attrezzatura").map(m=>m.id));
      const _idStrum  =new Set((mz||[]).filter(m=>m.categoria==="attrezzatura").map(m=>m.id));
      const _avvisa=ids=>(vw||[]).filter(v=>ids.has(v.mezzo_id)&&(v.scadute>0||(v.prossima_data&&v.prossima_data<=lim30)));
      const mAvvisa=_avvisa(_idVeicoli), sAvvisa2=_avvisa(_idStrum);
      setCnt("#cnt-mezzi",mAvvisa.length,mAvvisa.some(v=>v.scadute>0)?"err":"attesa");
      setCnt("#cnt-attrezzature",sAvvisa2.length,sAvvisa2.some(v=>v.scadute>0)?"err":"attesa");
      /* Scadenzario: aperte, scadute o entro 30 giorni. */
      /* 27 set 2026 — anche quelle delle PERSONE (visita medica, formazione...):
         lo Scadenzario le mostra, e il numerino del menu diceva 1 mentre dentro
         ce n'erano 2 scadute. Stessa lista che usa renderScadenze. */
      let _per=[];try{_per=await scadenzePersone(curMestiere());}catch(_){}
      const sAperte=(sc||[]).concat(_per).filter(x=>x.stato!=="fatta"&&x.data_scadenza&&x.data_scadenza<=lim30);
      setCnt("#cnt-scadenzario",sAperte.length,sAperte.some(x=>x.data_scadenza<oggi)?"err":"attesa");
      /* Fornitori: fatture da pagare. Rosso se qualcuna è scaduta.
         (se la tabella non esiste ancora, ff è undefined e il pallino resta spento) */
      const ffAp=(ff||[]).filter(x=>x.stato!=="pagata");
      setCnt("#cnt-fornitori",ffAp.length,ffAp.some(x=>x.scadenza&&x.scadenza<oggi)?"err":"attesa");
      /* 14 settembre 2026 — Promemoria: quelli da fare entro 30 giorni, rosso
         se almeno uno e' gia' passato.
         ⚠️ NON si filtra per reparto: i promemoria sono della PERSONA, non del
            pannello (vedi js/gest-promemoria.js). E' la stessa eccezione del
            prezzario e dei crediti formativi.
         ⚠️ La lettura sta FUORI dal Promise.all qui sopra apposta: se la
            migrazione sql/promemoria-sezione.sql non e' ancora stata eseguita,
            la colonna `eliminato_il` non esiste e la richiesta fallisce. Dentro
            al Promise.all si porterebbe dietro TUTTI gli altri pallini. */
      try{
        const {data:pr}=await sb.from("promemoria")
          .select("data,stato").eq("user_id",sbUid)
          .is("eliminato_il",null).neq("stato","fatto").lte("data",lim30);
        const prAp=pr||[];
        setCnt("#cnt-promemoria",prAp.length,prAp.some(x=>x.data&&x.data<oggi)?"err":"attesa");
        /* nella fascia vanno solo quelli GIA' PASSATI: «Da sistemare oggi»
           sono le cose che chiedono attenzione adesso, non fra tre settimane */
        _riePromem=prAp.filter(x=>x.data&&x.data<oggi).length;
        try{ rieVociExtra(); }catch(e){}
      }catch(e){}
    }catch(e){}
    contaCestinoUnaVolta();   /* senza await: il pallino del Cestino arriva quando arriva */
  }

  /* ================= RIEPILOGO A SCHEDE =================
     Una scheda per ogni voce del menu, nello stesso ordine del menu.
     Ogni scheda fa UNA cosa sola: dice come sta quella sezione con un numero
     grande, e mostra sotto le due righe più importanti. Cliccando la scheda si
     entra nella sezione; cliccando una riga si apre direttamente quell'elemento.
     Nessun dato nuovo: sono gli stessi numeri di prima, solo raggruppati per
     sezione invece che sparsi. ===================================== */

  /* l'icona della scheda è clonata dal bottone del menu: così menu e riepilogo
     restano identici per sempre, anche se un domani cambio un'icona. */
  function rieIco(tab){
    const b=document.querySelector('nav.tabs button[data-tab="'+tab+'"] svg');
    return b?b.outerHTML:"";
  }

  /* o = {tab, titolo, n, lab, tono, righe:[{t,v,cls,action,id}], vuoto} */
  /* ===== 12 agosto 2026 (sera) — IL PLURALE =====
     Le schede del Riepilogo scrivono il numero grande e sotto l'etichetta.
     L'etichetta era fissa al plurale, quindi con UNA cosa sola si leggeva
     «1 lavori aperti», «1 clienti in anagrafica», «1 scadenze entro 30
     giorni». Su una prima pagina che deve dare il colpo d'occhio, e per chi
     legge con fatica, e' un inciampo a ogni riga. */
  function _plur(n,uno,tanti){ return (+n===1)?uno:tanti; }

  /* ===== 20 agosto 2026 — IL PALLINO ROSSO O VERDE SU OGNI SCHEDA =====
     Chiesto da Alessio: «rosso se va male, verde se ok».

     ⛔ LA REGOLA STA IN UN POSTO SOLO, e quel posto e' la fascia «Da
     sistemare oggi» qui sopra. Il pallino di una scheda e' rosso quando la
     fascia nomina quella sezione come un problema: cosi' le due cose non si
     possono scollare. Se la fascia dice «1 lavoro in ritardo», la scheda
     Lavori ha il pallino rosso, sempre.
     Piu' i casi che la fascia non racconta ma che sono comunque «va male»:
     quelli erano gia' segnati da tono:"err" (scaduto, in ritardo, in perdita).

     ⚠️ IL ROSSO NON SI ACCENDE PERCHE' UNA SEZIONE HA ROBA DENTRO. Due
     computi non sono un problema, e un preventivo mandato ieri nemmeno. Se il
     rosso si accendesse cosi' sarebbero rossi quasi tutti e non direbbe piu'
     niente: e' rosso il preventivo fermo da PIU' DI UNA SETTIMANA, non quello
     di ieri. */
  let _rieMale=new Set();
  /* ============================================================
     ⛔ 22 agosto 2026 — QUALI RIGHE DI `gest_foto` NON SONO FOTO
     ============================================================
     `gest_foto` non tiene solo le foto del lavoro: dentro ci stanno anche
     file che foto non sono — il PDF della fattura e, da oggi, i DOCUMENTI
     della pratica (visura, planimetria, ricevuta di protocollo).
     ⚠️ Chi disegna foto li deve lasciare fuori, perche' il rendering
     assume sempre un `<img>`: un PDF diventa un'immagine rotta.
     ⛔ Prima la parola «fattura» stava scritta in QUATTRO punti (il
     contatore del Riepilogo, quello della scheda, la Galleria e il verbale).
     Bastava dimenticarne uno. Adesso l'elenco sta qui, e basta.
     ⚠️ `_nonFotoSql` e' la forma per PostgREST; `_nonFoto` quella per
     filtrare in JavaScript. Stessa lista tutte e due. */
  const TIPI_NON_FOTO=['fattura','documento'];
  const _nonFotoSql='('+TIPI_NON_FOTO.join(',')+')';
  const _nonFoto=t=>TIPI_NON_FOTO.indexOf(String(t||''))>=0;

  function rieCard(o){
    /* ===== 15 agosto 2026 — IL RIEPILOGO CHE SI RIEMPIE DA SOLO =====
       Prima le 16 schede c'erano sempre tutte, anche appena aperto un reparto
       nuovo: una parete di «Nessun cliente registrato», «Nessuna fattura»,
       «Nessuna foto». Chi entrava la prima volta vedeva sedici caselle vuote e
       non capiva da dove si comincia.
       Adesso ogni scheda dichiara se la sua sezione ha davvero qualcosa
       dentro (o.dati). Se non ce l'ha, la scheda non viene proprio disegnata:
       compare il giorno che quel dato esiste. */
    if(o.dati===false)return "";
    const righe=(o.righe||[]).filter(Boolean).slice(0,2);
    const corpo=righe.length
      ? '<div class="rc-list">'+righe.map(r=>{
          const cli=r.action?' data-action="'+r.action+'" data-id="'+esc(r.id)+'"':"";
          return '<div class="rc-r'+(r.action?" cliccabile":"")+'"'+cli+'>'
               +   '<span class="rc-rt'+(r.fisso?"":" rc-rt-u")+'">'+esc(r.t||"")+'</span>'
               +   '<span class="rc-rv'+(r.cls?" "+r.cls:"")+'">'+esc(r.v||"")+'</span>'
               + '</div>';
        }).join("")+'</div>'
      : '<div class="rc-vuoto">'+esc(o.vuoto||"Niente da segnalare")+'</div>';
    const male=(o.male!=null)?!!o.male:(o.tono==="err"||_rieMale.has(o.tab));
    return '<div class="rie-card t-'+(o.tono||"neutro")+(righe.length?"":" vuota")+'" data-action="rie-go" data-go="'+o.tab+'">'
         +   '<div class="rc-head">'+rieIco(o.tab)+'<span class="rc-tit">'+esc(o.titolo)+'</span>'
         +     '<i class="rc-pall '+(male?"male":"bene")+'"'
         +       ' title="'+(male?"Qui c\u2019\u00e8 qualcosa che va male":"Qui \u00e8 tutto a posto")+'"'
         +       ' aria-label="'+(male?"qualcosa che va male":"tutto a posto")+'"></i></div>'
         +   '<div class="rc-n">'+esc(String(o.n))+'</div>'
         +   '<div class="rc-l">'+esc(o.lab||"")+'</div>'
         +   corpo
         + '</div>';
  }

  function rieVuotoTotale(){
    const g=$("#rie-grid");if(!g)return;
    g.innerHTML='<div class="rc-caricamento">Caricamento del riepilogo…</div>';
  }

  /* ---- Riepilogo: preventivi che aspettano una risposta ----
     Un preventivo in bozza o inviato è lavoro potenziale fermo: senza questo blocco
     lo si scopriva solo entrando nella scheda Preventivi. Dal più vecchio, così
     in cima c'e' sempre quello da sollecitare. Se non ce n'e' nessuno il blocco
     sparisce del tutto (titolo compreso): niente sezioni vuote nel Riepilogo. */
  const _ICO='<svg class="ic16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  const _ICO_OROLOGIO=_ICO+'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
  /* icone dei titoli del Report: stesso tratto e stessa misura delle icone del menu */
  const _ICO_EURO=_ICO+'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>';
  const _ICO_TREND=_ICO+'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>';
  const _ICO_LISTA=_ICO+'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';
  const _ICO_CARTA=_ICO+'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>';
  const _ICO_TROFEO=_ICO+'<path d="M6 9a6 6 0 0 0 12 0V3H6Z"/><path d="M6 5H3v2a4 4 0 0 0 4 4"/><path d="M18 5h3v2a4 4 0 0 1-4 4"/><path d="M12 15v4"/><path d="M8 21h8"/></svg>';
  let rieprevCache=[];
  async function renderPrevAttesa(attesa,cliMapIn){
    const box=$("#rie-prev");if(!box)return;
    rieprevCache=attesa||[];
    if(!rieprevCache.length){box.innerHTML="";return;}
    const L=rieprevCache.slice().sort((a,b)=>String(a.data||"9999").localeCompare(String(b.data||"9999")));
    const {data:rr}=await sb.from("gest_preventivo_righe").select("preventivo_id,qta,prezzo").in("preventivo_id",L.map(p=>p.id));
    const cliMap=cliMapIn||{};
    const tot={};(rr||[]).forEach(r=>{tot[r.preventivo_id]=(tot[r.preventivo_id]||0)+impRiga(r.qta,r.prezzo);});
    box.innerHTML=`<div class="mini-title">Preventivi in attesa di risposta</div><div class="righe">`
      +L.map(p=>{
        const q=quando(p.data,{neutro:true});          /* neutro: qui il rosso non c'entra */
        const g=_giorniA(p.data), att=g===null?0:-g;   /* giorni di attesa */
        const cls=att>14?"q-attesa":q.classe;          /* oltre due settimane: ambra */
        const imp=tot[p.id]||0;
        return rigaCompatta({
          id:p.id, action:"rie-prev", bar:"da_fare",
          titolo:p.titolo||"Preventivo",
          sub:[cliMap[p.cliente_id]||"",{t:q.testo,cls:cls}],
          imp:imp?eur(imp):""
        });
      }).join("")+`</div>`;
  }

  /* 12 agosto 2026 (sera) — jobCard e agendaCard tolte: erano due schede
     complete (un centinaio di righe) che NON le chiamava piu' nessuno da
     quando le sezioni usano schedaJob. Restavano li' a somigliare al codice
     vivo, con dentro azioni che non esistono piu' e letture dell'archivio
     locale morto: la prossima volta che si cerca un difetto si finisce a
     leggere queste invece di quelle vere. */

  /* Pulisce un numero per wa.me. Numeri vuoti → "" (link senza destinatario).
     - se l'originale inizia con "+" o "00" ha già il prefisso internazionale:
       usa le cifre così come sono (tolto "00" iniziale, il "+" cade con le non-cifre);
     - altrimenti, se le cifre iniziano con "3" (mobile IT) antepone "39". */
  function waCleanTel(tel){
    if(!tel)return"";
    const raw=String(tel).trim();
    const intl=raw[0]==="+"||raw.indexOf("00")===0;
    let n=raw.replace(/\D/g,"");
    if(!n)return"";
    if(intl){if(n.indexOf("00")===0)n=n.slice(2);return n;}
    if(/^3/.test(n))return"39"+n;
    return n;
  }
  /* conImp: l'importo a destra del titolo. Lo chiede solo il Riepilogo, dove la
     lista serve a capire quanto vale il lavoro in arrivo. */
  /* Card lavoro: solo le 2-3 azioni più probabili in vista, tutto il resto
     (Mappa, Foto, WhatsApp, PDF, fattura, Elimina) nel menu "...". Prima
     c'erano fino a 7 pulsanti in fila, con Elimina a un dito da Segna fatto.
     menuTab = registro TAB_MENU della sezione ("lav" o "ag"). */
  /* 16 agosto 2026 (4) — anche i Lavori come tutte le altre sezioni: fuori
     solo «Apri», dentro la finestra Avvia / Segna fatto / Riapri e tutte le
     voci che prima stavano sotto i «...». */
  function schedaAzioniLavoro(l,withFoto,fatto,dp,menuTab){
    const az=[{lab:"✏ Modifica",action:"edit-job",data:{id:l.id}}];
    if(withFoto&&l.stato==="da_fare")az.push({lab:"▶ Avvia",action:"stato-supa",data:{id:l.id,v:"in_corso",dp:dp}});
    if(withFoto&&!fatto)az.push({lab:"✔ Segna fatto",action:"stato-supa",data:{id:l.id,v:"fatto",dp:dp}});
    if(withFoto&&fatto)az.push({lab:"↩ Riapri",action:"stato-supa",data:{id:l.id,v:"da_fare",dp:dp}});
    /* le voci che stavano nei «...»: le ha gia' preparate renderTabella */
    const extra=menuTab?((TAB_MENU[menuTab]||{})[String(l.id)]||[]):[];
    extra.forEach(function(v){
      if(!v||v.sep)return;
      /* niente doppioni con i tre pulsanti qui sopra */
      if(v.action==="edit-job"||v.action==="stato-supa")return;
      az.push(v);
    });
    return schedaUnPulsante(az)||schedaAzioni(az);
  }
  function jobCardSupa(l,withFoto,opTel,conImp,menuTab){
    const fatto=l.stato==="fatto", dove=l.dove||"";
    const late=inRitardo(l.stato,l.data_prevista);
    const lavLab=fatto?"Fatto":(l.stato==="in_corso"?"In corso":"Da fare");
    const dp=esc(l.data_prevista||"");
    const dots=menuTab?`<span class="job-menu"><button class="lav-dots" data-action="tab-menu" data-tab="${menuTab}" data-id="${esc(String(l.id))}" title="Altre azioni">&#8943;</button></span>`:"";
    return `<div class="job">
      <div class="job-top"><div class="job-cli">${esc(l.descrizione||"Lavoro")}</div>
        ${conImp&&+l.importo?`<span class="job-imp">${eur(l.importo)}</span>`:""}</div>
      <div class="stati">
        <span class="st"><i class="pall ${fatto?'verde':(late?'ritardo':'rosso')}"${late?' title="In ritardo"':''}></i><span class="lab">${lavLab}</span></span>
      </div>
      <div class="job-meta">
        ${dove?`<span>📍 ${esc(dove)}</span>`:""}
        <span>📅 ${fdate(l.data_prevista)}</span>
        ${(ruoloUtente==='professionista'&&l.pratica_tipo)?`<span>📄 ${esc(l.pratica_tipo)}</span>`:""}
        ${(ruoloUtente==='professionista'&&l.pratica_stato)?`<span>🏛 ${esc((PRATICA_STATI.find(x=>x[0]===l.pratica_stato)||[])[1]||"")}</span>`:""}
        ${(ruoloUtente==='professionista'&&l.pratica_protocollo)?`<span>N. ${esc(l.pratica_protocollo)}</span>`:""}
      </div>
      <div class="job-actions">${schedaAzioniLavoro(l,withFoto,fatto,dp,menuTab)}</div></div>`;
  }
  /* Lavori: tabella ordinabile su desktop, card su mobile */
  const _deskTab=()=>window.matchMedia("(min-width:881px)").matches;
  function _waLavoro(l,opTel){
    const opLink=location.href.replace(/[^/]*$/,"")+"gestionale-operatore.html";
    const isPro=ruoloUtente==='professionista';
    const termCap=isPro?"Pratica":"Lavoro";
    const intro=isPro?"Ciao! C'\u00e8 una nuova pratica per te.":"Ciao! C'\u00e8 un nuovo lavoro per te.";
    const waText=encodeURIComponent(intro+"\n"+termCap+": "+(l.descrizione||termCap)+"\nDove: "+(l.dove||"\u2014")+"\nData prevista: "+fdate(l.data_prevista)+"\nApri l'app operatore: "+opLink);
    const waTel=waCleanTel(opTel);
    return waTel?("https://wa.me/"+waTel+"?text="+waText):("https://wa.me/?text="+waText);
  }

  /* ============================================================
     "QUANDO" IN PAROLE — distanza da oggi, non la data.
     Riutilizzabile: serve anche a Preventivi, Fatture, Scadenzario.
     Ritorna {testo, classe}; la classe porta il colore (.q-*).
     opt.neutro = "qui una data passata non è un problema" (lavoro già fatto,
     fattura pagata...): il rosso resta riservato ai ritardi veri.
     ============================================================ */
  const MESI_BREVI=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
  function quando(ds,opt){
    if(!ds)return{testo:"\u2014",classe:"q-vuoto"};
    const g=_giorniA(ds);                       /* positivo = nel futuro */
    if(g===null)return{testo:"\u2014",classe:"q-vuoto"};
    if(g<0){const n=-g;return{testo:n===1?"ieri":n+" giorni fa",classe:(opt&&opt.neutro)?"q-neutro":"q-passato"};}
    if(g===0)return{testo:"oggi",classe:"q-oggi"};
    if(g===1)return{testo:"domani",classe:"q-futuro"};
    if(g<14)return{testo:"fra "+g+" giorni",classe:"q-futuro"};
    if(g<=30){const w=Math.round(g/7);return{testo:"fra "+w+" settimane",classe:"q-futuro"};}
    const mm=+ds.split("-")[1], dd=+ds.split("-")[2];
    return{testo:dd+" "+MESI_BREVI[mm-1],classe:"q-futuro"};
  }

  /* ============================================================
     LAVORI — viste al posto dei filtri di stato
     ============================================================ */
  /* "Tutti" è la vista di apertura: chi entra vede il lavoro del reparto per intero,
     poi semmai restringe. Le altre viste servono a restringere, non a nascondere:
     per questo la prima vista non la sceglie più il codice in base ai ritardi.
     Le viste dei lavori aperti coprono tutta la linea del tempo, senza buchi:
     ritardo (prima di oggi) + oggi + prossimi (dopo oggi) = tutti i non finiti.
     "Prossimi" non ha limite in avanti: prima si fermava a domenica e i lavori
     più in la' sparivano da ogni vista pur restando nei contatori.
     Il lavoro senza data sta in "Prossimi": non è in ritardo e non è di oggi,
     e senza questo finirebbe fuori da tutte le viste (stesso buco di prima).
     Archivio raccoglie tutti i finiti; "Da incassare" è un suo sottoinsieme e
     per questo resta fuori dal conto della copertura. */
  const LAV_VISTE=[
    {k:"tutti",    lab:"Tutti"},
    {k:"ritardo",  lab:"In ritardo"},
    {k:"oggi",     lab:"Oggi"},
    {k:"prossimi", lab:"Prossimi"},
    {k:"incassare",lab:"Da incassare"},
    {k:"archivio", lab:"Archivio"}
  ];
  /* ============================================================
     LE CARD CON I NUMERI — 19 agosto 2026

     ⚠️ LA REGOLA: si mostra SOLO un numero che risponde a una domanda.
        «2 preventivi» non e' un numero: e' il conto delle righe, e si
        legge gia' nella fascia sotto. «2 fermi da 34 giorni» invece e'
        una domanda con la risposta dentro.
     ⚠️ Le card che si possono cliccare fanno una cosa sola e prevedibile:
        o filtrano la lista con un filtro CHE ESISTE GIA' (stessa formula,
        quindi il numero e la lista non possono litigare), o aprono la
        riga di cui parlano. Mai un filtro nuovo scritto qui: sarebbe la
        seconda copia della stessa regola.
     ⚠️ Una card senza risposta NON SI MOSTRA (zero preventivi in attesa =
        niente card). Un muro di zeri fa smettere di guardare anche i
        numeri veri.
     ============================================================ */
  const NUM_MIN_ESITI=3;   /* sotto tre esiti la percentuale non vuol dire niente */
  function _ggDa(d){
    if(!d)return null;
    const a=Date.parse(String(d)+"T00:00:00"), b=Date.parse(todayStr()+"T00:00:00");
    if(isNaN(a)||isNaN(b))return null;
    return Math.round((b-a)/86400000);
  }
  function _ggCorto(n){
    if(n==null)return "—";
    if(n<=0)return "oggi";
    return n+(n===1?" giorno":" giorni");
  }
  /* «negli ultimi 12 mesi»: si conta all'indietro dal mese di oggi, senza
     inventarsi i giorni (il 31 marzo meno un mese non esiste) */
  function _daMesi(mesi){
    const d=new Date(todayStr()+"T00:00:00");
    d.setMonth(d.getMonth()-mesi);
    const p=n=>(n<10?"0":"")+n;
    return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
  }
  function numCard(o){
    const cliccabile=!!o.action;
    const tag=cliccabile?"button":"div";
    const az=cliccabile
      ? ' type="button" data-action="'+esc(o.action)+'"'
        +(o.v!=null?' data-v="'+esc(String(o.v))+'"':"")
        +(o.id!=null?' data-id="'+esc(String(o.id))+'"':"")
      : "";
    return '<'+tag+' class="num-c'+(o.tono?" num-c--"+o.tono:"")+(cliccabile?" num-c--vai":"")+'"'+az+'>'
      +'<span class="num-d">'+esc(o.domanda)+'</span>'
      +'<span class="num-n">'+esc(o.numero)+'</span>'
      +(o.sotto?'<span class="num-s">'+esc(o.sotto)+'</span>':"")
      +'</'+tag+'>';
  }
  function numFila(cards){
    const v=(cards||[]).filter(Boolean);
    return v.length?('<div class="num-fila">'+v.join("")+'</div>'):"";
  }

  function lavFiltra(L,v,oggi){
    const aperto=l=>l.stato!=="fatto";
    if(v==="tutti")    return L.slice();
    if(v==="ritardo")  return L.filter(l=>aperto(l)&&!!l.data_prevista&&l.data_prevista<oggi);
    if(v==="oggi")     return L.filter(l=>aperto(l)&&l.data_prevista===oggi);
    if(v==="prossimi") return L.filter(l=>aperto(l)&&(!l.data_prevista||l.data_prevista>oggi));
    if(v==="incassare")return L.filter(l=>l.stato==="fatto"&&(l.fatt_stato||"none")!=="pagata");   /* lo stato lo scrive la fattura quando viene emessa */
    if(v==="archivio") return L.filter(l=>l.stato==="fatto");
    return L;
  }
  const _SVGV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
  const LAV_VUOTO={
    tutti:    {t:"Ancora nessun lavoro",           s:"Il cuore del gestionale: cliente, indirizzo, data, chi ci va e quanto costa. Da qui nascono foto, spese, margine e fattura.", i:_SVGV+'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', b:{t:"+ Crea il primo lavoro",a:"new-job"}},
    ritardo:  {t:"Nessun lavoro in ritardo",      s:"Sei in pari con le scadenze.",            i:_SVGV+'<path d="M20 6 9 17l-5-5"/></svg>'},
    oggi:     {t:"Niente in programma per oggi",  s:"Nessun lavoro con data di oggi.",         i:_SVGV+'<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/></svg>'},
    prossimi: {t:"Nessun lavoro in programma", s:"Non c'\u00e8 niente da fare dopo oggi.",     i:_SVGV+'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>'},
    incassare:{t:"Hai incassato tutto",           s:"Nessuna fattura in sospeso.",             i:_SVGV+'<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7 7 0 1 0 0 12"/></svg>'},
    archivio: {t:"Ancora nessun lavoro finito",   s:"Qui finiscono i lavori completati.",      i:_SVGV+'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>'}
  };
  function lavVuoto(v){
    const e=LAV_VUOTO[v]||LAV_VUOTO.tutti;
    return tabVuoto(e.t,e.s,e.i,e.b);
  }
  /* menu "..." della riga: nessuna azione della vecchia barra è andata persa */
  /* i lavori che stanno già dentro una fattura, anche solo in bozza: serve al
     menu per non offrire "Crea fattura" su qualcosa che è già fatturato.
     Lo riempie renderFatture, che quella tabella la legge comunque. */
  let _lavFatturati=new Set();
  function lavVoci(l,wa){
    const dp=l.data_prevista||"", fatto=l.stato==="fatto", fs=l.fatt_stato||"none";
    const v=[];
    if(l.stato==="da_fare")v.push({lab:"\u25b6 Avvia",action:"stato-supa",data:{id:l.id,v:"in_corso",dp:dp}});
    if(!fatto)v.push({lab:"\u2714 Segna fatto",action:"stato-supa",data:{id:l.id,v:"fatto",dp:dp}});
    else v.push({lab:"\u21a9 Riapri",action:"stato-supa",data:{id:l.id,v:"da_fare",dp:dp}});
    v.push({lab:"\ud83d\udcf7 Foto",action:"lf-open",data:{id:l.id,desc:l.descrizione||"Lavoro"}});
    /* il verbale di sopralluogo è roba da tecnici: nasce dalle foto della pratica */
    if(ruoloUtente==='professionista')v.push({lab:"\ud83d\udccb Verbale di sopralluogo",action:"verbale",data:{id:l.id}});
    if(l.dove)v.push({lab:"\ud83d\uddfa Mappa",action:"map",data:{q:l.dove}});
    v.push({lab:"\ud83d\udcac Avvisa su WhatsApp",action:"sq-wa",data:{wa:wa}});
    /* 26 set 2026 — le idee rubate (js/gest-ai-cantiere.js) */
    v.push({lab:"📣 Aggiorna il cliente",action:"res-cliente",data:{id:l.id}});
    if(ruoloUtente!=='professionista')v.push({lab:"🎨 Scelte del cliente",action:"scelte-cliente",data:{id:l.id}});
    v.push({sep:true});
    v.push({lab:"\ud83d\udcc4 Scarica PDF",action:"pdf",data:{id:l.id}});
    if(fatto)v.push({lab:(fs==="none"&&!_lavFatturati.has(String(l.id)))?"\ud83e\uddfe Crea fattura":"\ud83e\uddfe Apri fattura",action:"fatt",data:{id:l.id}});
    v.push({sep:true});
    v.push({lab:"\ud83d\uddd1 Elimina",action:"del-job-supa",data:{id:l.id},del:true});
    return v;
  }

  /* ============================================================
     TABELLA CONDIVISA \u2014 una sola implementazione per tutte le sezioni.
     Prima ogni scheda aveva la sua griglia di card con i pulsanti in fila:
     le stesse azioni cambiavano posto (e forma) da una sezione all'altra, e
     in Squadra finivano incolonnate una sotto l'altra. Qui la riga è sempre
     uguale ovunque: click sulla riga = apri, "..." = tutto il resto.
     Le voci del menu restano <button data-action="..."> identici a prima,
     così i gestori del click già esistenti continuano a funzionare.

     cfg = {
       id          chiave del registro dei menu (una per sezione)
       box         selettore del contenitore
       viste       selettore delle schede vista (o niente: rubriche come Condomini)
       visteDef    [{k,lab,err}]  con vista (attiva), conta{k:n}, azioneVista
       colonne     [{lab,w,cls,sort}]   w = larghezza in %
       righe       [{id, celle:[html | {h,cls}], click:{action,data}, menu:[voci]}]
       totale      {testo,valore} oppure niente
       vuoto       html dello stato vuoto
       cards       ()=>html  usato sotto 880px al posto della tabella
       sortAction/sortK/sortD  intestazioni ordinabili (le usa solo Fatture)
     }
     ============================================================ */
  const TAB_MENU={};
  function tabChiudiPop(){document.querySelectorAll(".lav-pop").forEach(x=>x.remove());}

