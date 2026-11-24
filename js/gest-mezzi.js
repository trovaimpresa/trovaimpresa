/* ═══ FETTA E1 · MEZZI E ATTREZZATURE ═════════════════════════════════
   Staccata da gestionale-app.html il 6 settembre 2026.
   DUE pezzi, righe 5165-5177 e 5180-5428, con in mezzo cinque righe che
   NON potevano uscire (vedi qui sotto).

   COSA C'E' DENTRO
   MEZZO_STATI (disponibile / in uso / in manutenzione), mezziCache e i due
   filtri, caricaMezziCache (la lettura unica dal database),
   renderMezzi e renderAttrezzature, renderParcoMezzi (la tabella con le
   scadenze), MEZZI_VISTE, cellaScadenza, mezzoCard, mezzoForm e saveMezzo.
   Taglio puro: dentro non e' cambiato un carattere.

   ⛔ COSA E' RIMASTO NEL MEZZO, E PERCHE' — `_giorniA`
   Fra i due pezzi, alla riga 5178-5179 della pagina, sta:
       function _giorniA(ds){ ... }   // giorni da oggi a una data
   Sembrava dei mezzi perche' sta in mezzo alle scadenze, ma la chiamano
   anche il controllo delle date, i preventivi in attesa, js/gest-fatture.js
   e js/gest-riepilogo.js: e' un AIUTO COMUNE. Portarlo via qui l'avrebbe
   tolto a tutti loro. E' lo stesso errore che il 6 settembre stava per
   succedere con `_fileOrfano`. RESTA NELLA PAGINA, e questo file lo chiama
   da li' (sempre dentro una funzione, mai al primo livello).

   COSA NON C'E' — il NOLEGGIO
   I rifornimenti e il noleggio (apriRifornimenti, renderRifornimenti,
   salvaRifornimento, rifMezzoId) stanno piu' avanti nella pagina e NON sono
   usciti. ⚠️ Il noleggio ha il filtro sulla FASE (fuori / rientrato) scritto
   in DUE posti — js/gest-riepilogo.js e js/gest-report.js — che si erano
   gia' scollati una volta. Quando si staccheranno, va guardato quello.
   `mezziCache` la leggono anche il noleggio (in 2 punti) e il controllo dei
   doppioni sui nomi e sulle targhe: la leggono tutti dentro una funzione,
   quindi quando gira, questo file e' gia' nato.

   ⛔ LE DUE REGOLE DI QUESTO FILE
   1. Non e' chiuso dentro niente (niente IIFE): vive nello stesso spazio
      della pagina e vede sb, sbUid, cur, esc, toast, closeSheet, $ senza che
      nessuno glieli passi. Per la stessa ragione, un nome dichiarato anche
      nella pagina spegnerebbe TUTTO il gestionale al caricamento.
   2. Al primo livello qui non si puo' USARE niente che stia nella pagina:
      questo file parte PRIMA. MEZZO_STATI e' un elenco scritto a mano e
      mezziCache parte vuota: non chiamano niente.

   Il banco che protegge tutto questo:
   prove-claude/banchi-fissi/smontaggio/banco-fette.js
   ═══════════════════════════════════════════════════════════════════════ */

  /* ============================================================
     MEZZI E ATTREZZATURE — tabella gest_mezzi, stesso modello di gest_clienti
     (isolamento user_id + mestiere_id). Le scadenze restano in gest_scadenze
     con la colonna mezzo_id; il riepilogo per mezzo arriva dalla vista
     gest_mezzi_scadenze. DDL: sql/gestionale-mezzi.sql
     ============================================================ */
  const MEZZO_STATI={
    disponibile:{lab:"Disponibile",bg:"var(--ok-bg)",fg:"var(--ok)"},
    in_uso:{lab:"In uso",bg:"var(--info-bg)",fg:"var(--info)"},
    manutenzione:{lab:"In manutenzione",bg:"var(--attesa-bg)",fg:"var(--attesa)"},
    fuori_uso:{lab:"Fuori uso",bg:"var(--sfondo)",fg:"var(--testo-2)"}
  };
  let mezziCache=[], mezziFilter="tutti", attrezzFilter="tutti";
  /* 12 nov 2026 (secondo giro) — i noleggi aperti di ogni mezzo: nel Noleggio
     l'escavatore era «In ritardo · 73 giorni», qui «Disponibile» in verde. */
  let mezziNolMap={};
  /* 20 nov 2026 (voce Strumenti) — usi nelle pratiche/lavori e nomi di chi ce l'ha */
  let mezziUsiMap={}, mezziOpNomi={};
  /* 24 nov 2026 — uscite e rientri: per ogni mezzo l'uscita aperta e l'ultimo rientro */
  let mezziUscMap={};
  function mezzoChiUso(m){
    const pro=(ruoloUtente==='professionista'), n=mezziUsiMap[m.id]||0;
    const chi=m.operatore_id&&mezziOpNomi[String(m.operatore_id)];
    return [chi?"Ce l'ha "+chi:"", n?("usat"+(m.categoria==="attrezzatura"&&!pro?"a":"o")+" in "+n+" "+(pro?(n===1?"pratica":"pratiche"):(n===1?"lavoro":"lavori"))):""].filter(Boolean).join(" · ");
  }

  /* Mezzi e attrezzature stanno in due sezioni diverse: un furgone e un
     ponteggio non hanno niente in comune. La lettura dal database è una
     sola (mezziCache tiene tutto, serve anche altrove), poi ogni sezione
     disegna solo la sua categoria. */
  async function caricaMezziCache(){
    const mid=curMestiere();
    /* ⛔ 4 settembre 2026 — UNA LISTA SOLA DI MEZZI.
       I mezzi del Noleggio e quelli del gestionale stanno nella stessa
       tabella. Due conseguenze qui:
       · si legge con _cliOr: un mezzo dell'azienda (senza reparto, come
         quelli nati nel Noleggio) si vede in TUTTI i reparti, esattamente
         come i clienti;
       · si chiedono anche le colonne delle scadenze. Se sql/mezzi-una-lista-sola.sql
         non e' ancora passato quelle colonne non ci sono e la lettura
         fallirebbe TUTTA, lasciando la sezione Mezzi vuota: allora si
         richiede la versione corta e si tira avanti. */
    const _MZCOL="id,nome,categoria,tipo,targa,stato,note,noleggiabile,codice,assicurazione_scad,revisione_scad,collaudo_scad,verifica_ultima,verifica_mesi,fuori_servizio";
    const _MZCORTO="id,nome,categoria,tipo,targa,stato,note";
    /* 20 nov 2026 (voce Strumenti) — regola di Alex: in cima l'ultimo salvato.
       Prima in ordine di nome: lo strumento appena aggiunto finiva in mezzo. */
    const _leggiMezzi=async col=>await sb.from("gest_mezzi").select(col).eq("user_id",sbUid).or(_cliOr(mid)).order("created_at",{ascending:false});
    /* 20 nov 2026 (voce Strumenti) — «Chi ce l'ha» (operatore_id, sql/2026-11-20-strumenti-chi-ce-l-ha.sql):
       se la colonna manca si rilegge senza, poi la versione corta come prima */
    const _colErr=r=>r.error&&/column|schema cache/i.test(r.error.message||"");
    const [rmz,{data:vw},{data:cb},rsx,rnl,rlm,rop,rtar,rusc]=await Promise.all([
      _leggiMezzi(_MZCOL+",operatore_id,km_attuali,tagliando_ogni_km,tagliando_ultimo_km").then(r=>_colErr(r)?_leggiMezzi(_MZCOL+",operatore_id,km_attuali"):r).then(r=>_colErr(r)?_leggiMezzi(_MZCOL+",operatore_id"):r).then(r=>_colErr(r)?_leggiMezzi(_MZCOL):r).then(r=>_colErr(r)?_leggiMezzi(_MZCORTO):r),
      sb.from("gest_mezzi_scadenze").select("mezzo_id,aperte,scadute,prossima_data,prossimo_titolo,prossimo_tipo").eq("user_id",sbUid),
      /* i totali carburante: se la tabella non c'e' ancora, cb resta vuoto e non cambia niente */
      sb.from("gest_mezzi_carburante").select("mezzo_id,spesa_totale,km_litro").eq("user_id",sbUid),
      /* 11 nov 2026 — collaudo 3.14: QUALI sono scadute, non solo quante */
      sb.from("gest_scadenze").select("mezzo_id,titolo,tipo_pratica,data_scadenza,stato").eq("user_id",sbUid)
        .not("mezzo_id","is",null).lt("data_scadenza",todayStr()),
      /* i noleggi: se la tabella non c'e' o non risponde, rnl resta vuoto e non cambia niente */
      Promise.resolve(sb.from("nol_noleggi").select("mezzo_id,fase,data_uscita,data_rientro_prevista,data_rientro_effettivo").eq("user_id",sbUid).not("mezzo_id","is",null)).then(r=>r,()=>null),
      /* 20 nov 2026 — in quante pratiche/lavori e' usato, e i nomi di chi ce l'ha */
      Promise.resolve(sb.from("gest_lavoro_mezzi").select("mezzo_id").eq("user_id",sbUid)).then(r=>r,()=>null),
      Promise.resolve(sb.from("gest_operatori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",mid)).then(r=>r,()=>null),
      /* la prossima taratura ancora aperta di ogni strumento: la mostra il modulo */
      Promise.resolve(sb.from("gest_scadenze").select("id,mezzo_id,data_scadenza,ripeti_mesi,stato").eq("user_id",sbUid)
        .eq("tipo_pratica","Taratura strumento").not("mezzo_id","is",null).neq("stato","fatta").order("data_scadenza",{ascending:true})).then(r=>r,()=>null),
      /* 24 nov 2026 — uscite e rientri (sql/2026-11-24-mezzi-uscite.sql): se la tabella manca resta vuoto */
      Promise.resolve(sb.from("gest_mezzi_uscite").select("id,mezzo_id,operatore_id,chi_nome,lavoro_id,motivo,km_uscita,km_rientro,uscita_il,rientro_il")
        .eq("user_id",sbUid).is("eliminato_il",null).order("uscita_il",{ascending:false}).limit(500)).then(r=>r,()=>null)
    ]);
    mezziUscMap={};
    ((rusc&&!rusc.error&&rusc.data)||[]).forEach(x=>{
      const o=mezziUscMap[x.mezzo_id]||(mezziUscMap[x.mezzo_id]={aperta:null,ultima:null});
      if(!x.rientro_il){ if(!o.aperta)o.aperta=x; }
      else if(!o.ultima)o.ultima=x;
    });
    window._mzTaratura={};
    ((rtar&&!rtar.error&&rtar.data)||[]).forEach(x=>{ if(!window._mzTaratura[x.mezzo_id])window._mzTaratura[x.mezzo_id]=x; });
    mezziUsiMap={};
    ((rlm&&!rlm.error&&rlm.data)||[]).forEach(x=>{ mezziUsiMap[x.mezzo_id]=(mezziUsiMap[x.mezzo_id]||0)+1; });
    mezziOpNomi=Object.fromEntries(((rop&&!rop.error&&rop.data)||[]).map(o=>[String(o.id),o.nome||""]));
    window._mezziKo=!!(!rmz||rmz.error);
    mezziCache=(rmz&&rmz.data)||[];
    carbMap=Object.fromEntries((cb||[]).map(v=>[v.mezzo_id,v]));
    /* stessa regola del Noleggio (nolFaseDi + peso): in ritardo batte fuori, fuori batte prenotato */
    mezziNolMap={};
    {const _og=todayStr();
     ((rnl&&!rnl.error&&rnl.data)||[]).forEach(x=>{
       const f=x.fase||(x.data_rientro_effettivo?"rientrato":((x.data_uscita&&x.data_uscita>_og)?"prenotato":"fuori"));
       if(f==="rientrato")return;
       const rit=(f==="fuori"&&x.data_rientro_prevista&&x.data_rientro_prevista<_og)
         ?Math.round((new Date(_og)-new Date(x.data_rientro_prevista))/86400000):0;
       const peso=f==="fuori"?(rit?3:2):1, p=mezziNolMap[x.mezzo_id];
       if(!p||peso>p.peso||(peso===p.peso&&rit>p.rit))mezziNolMap[x.mezzo_id]={peso:peso,rit:rit};
     });}
    mezziScaduteMap={};
    ((rsx&&!rsx.error&&rsx.data)||[]).forEach(x=>{ if(x.stato==="fatta")return;
      (mezziScaduteMap[x.mezzo_id]=mezziScaduteMap[x.mezzo_id]||[]).push({t:x.tipo_pratica||x.titolo||"Scadenza",d:x.data_scadenza}); });
    return Object.fromEntries((vw||[]).map(v=>[v.mezzo_id,v]));
  }

  /* ============================================================
     18 nov 2026 — MEZZI E ATTREZZATURE: UNA VOCE SOLA, DUE LINGUETTE
     (deciso da Alex, foto approvata). Non si cancella niente: le due
     sezioni #mezzi e #attrezzature restano, e resta anche il pulsante
     «attrezzature» del menu, solo che non si vede (classe .mz-dentro):
     cosi' tutto quello che lo «preme» da fuori (Scadenzario, Calendario,
     Riepilogo, Chat, collegamenti #attrezzature) continua a funzionare.
     ⛔ Lo studio tecnico NON ha i mezzi (TAB_NASCOSTI_PRO): li' resta la
     voce sola «Strumenti», senza linguette. mzUnito() lo decide.
     La chiamano renderParcoMezzi e le tre adattaMenu… (js/gest-reparti.js). */
  function mzUnito(){
    try{ return !(typeof tabNascosto==="function"&&tabNascosto("mezzi")); }catch(e){ return true; }
  }
  function mzUnisci(){
    const uni=mzUnito(), pro=(ruoloUtente==='professionista');
    const nomeA=pro?"Strumenti":"Attrezzature";
    const tutto=pro?"Mezzi e strumenti":"Mezzi e attrezzature";
    const bM=document.querySelector('nav.tabs button[data-tab="mezzi"]'),
          bA=document.querySelector('nav.tabs button[data-tab="attrezzature"]');
    if(bA)bA.classList.toggle("mz-dentro",uni);
    /* 18 nov: entrando da #attrezzature il clic arriva prima di questa riga: la voce unita va accesa qui */
    if(uni&&bA&&bM&&bA.classList.contains("active"))bM.classList.add("active");
    if(bM){ const s=bM.querySelector("span"); if(s){ const t=uni?tutto:"Mezzi"; if(s.textContent!==t)s.textContent=t; } }
    const nA=mezziCache.filter(m=>m.categoria==="attrezzatura").length, nM=mezziCache.length-nA;
    [["mezzi","Mezzi"],["attrezzature",nomeA]].forEach(function(x){
      const sec=document.getElementById(x[0]); if(!sec)return;
      const h=sec.querySelector(".sec-head h2"), t=uni?tutto:x[1];
      if(h&&h.textContent!==t)h.textContent=t;
      let g=sec.querySelector(".mz-ling");
      if(!uni){ if(g)g.remove(); return; }
      if(!g){ g=document.createElement("div"); g.className="segm mz-ling"; const sh=sec.querySelector(".sec-head"); if(!sh)return; sh.after(g); }
      const html='<button type="button" data-mz="mezzi"'+(x[0]==="mezzi"?' class="on"':'')+'>Mezzi ('+nM+')</button>'
        +'<button type="button" data-mz="attrezzature"'+(x[0]==="attrezzature"?' class="on"':'')+'>'+nomeA+' ('+nA+')</button>';
      if(g.innerHTML!==html)g.innerHTML=html;
    });
  }
  if(!window.__mzAscolto){
    window.__mzAscolto=1;
    document.addEventListener("click",function(e){
      const b=e.target.closest&&e.target.closest("[data-mz]"); if(!b||b.classList.contains("on"))return;
      const v=document.querySelector('nav.tabs button[data-tab="'+b.getAttribute("data-mz")+'"]');
      if(v)v.click();
    });
  }
  async function renderMezzi(){ return renderParcoMezzi("mezzo"); }
  async function renderAttrezzature(){ return renderParcoMezzi("attrezzatura"); }

  async function renderParcoMezzi(cat){
    const attrezzo = (cat==="attrezzatura");
    /* per uno studio le "attrezzature" sono gli strumenti di misura */
    const STRU = attrezzo && ruoloUtente==='professionista';
    const box=$(attrezzo?"#attr-list":"#mezzi-list");if(!box)return;
    if(!cur){box.innerHTML="";return;}
    if(!sb||!sbUid){
      box.innerHTML=`<div class="empty"><div class="ic">${attrezzo?"🔧":"🚚"}</div><p>Nessun${attrezzo?"a attrezzatura":" mezzo"}</p><small>Accedi per gestire mezzi e attrezzature</small></div>`;
      return;
    }
    const scadMap=await caricaMezziCache();
    try{ mzUnisci(); }catch(e){}
    /* 12 nov 2026 — regola 20: senza rete non si dice «I mezzi» vuoti */
    if(window._mezziKo){listaNonLetta(box,attrezzo?(STRU?"gli strumenti":"le attrezzature"):"i mezzi",attrezzo?"attrezzature":"mezzi",attrezzo?"#attr-viste":"#mezzi-viste");return;}
    const tutti=mezziCache.filter(m=> attrezzo ? m.categoria==="attrezzatura" : m.categoria!=="attrezzatura");
    const filtro=attrezzo?attrezzFilter:mezziFilter;
    /* 24 nov 2026 — «Liberi» e «Fuori» solo per i mezzi: le attrezzature non escono col registro */
    const _viste=attrezzo?MEZZI_VISTE.filter(v=>v.k==="tutti"||v.k==="manutenzione"):MEZZI_VISTE;
    const _fuori=m=>!!(mezziUscMap[m.id]&&mezziUscMap[m.id].aperta);
    const filtra=(A,v)=>v==="manutenzione"?A.filter(m=>m.stato==="manutenzione")
      :(v==="fuori"?A.filter(_fuori)
      :(v==="liberi"?A.filter(m=>!_fuori(m)&&(!m.stato||m.stato==="disponibile")&&!(mezziNolMap[m.id]&&mezziNolMap[m.id].peso>=2)):A.slice()));
    const conta={};_viste.forEach(v=>conta[v.k]=filtra(tutti,v.k).length);
    const L=filtra(tutti,filtro);
    renderTabella({
      id:attrezzo?"attrezzature":"mezzi", box:attrezzo?"#attr-list":"#mezzi-list",
      viste:attrezzo?"#attr-viste":"#mezzi-viste", visteDef:_viste, vista:filtro, conta:conta,
      azioneVista:attrezzo?"attrezzo-filtro":"mezzo-filtro",
      vuoto:tabVuoto(
        tutti.length?(attrezzo?(STRU?"Nessuno strumento con questo filtro":"Nessuna attrezzatura con questo filtro"):"Nessun mezzo con questo filtro")
                    :(attrezzo?(STRU?"Gli strumenti dello studio":"Le attrezzature"):"I mezzi"),
        tutti.length?"Prova a cambiare filtro qui sopra."
          :(attrezzo
            ? (STRU
               ? "Stazione totale, distanziometro laser, termocamera, livello. Con le date delle tarature: l'Assistente ti avvisa prima che scadano."
               : "Ponteggi, betoniere, trabattelli, trapani. Con le date delle verifiche periodiche: l'Assistente ti avvisa prima che scadano.")
            : "Furgoni, escavatori, auto. Con le date di revisione, assicurazione e bollo, e i rifornimenti: l'Assistente ti avvisa prima che scadano."),
        attrezzo
          ? _SVGV+'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
          : _SVGV+'<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
        tutti.length?null:{t:attrezzo?(STRU?"+ Aggiungi il primo strumento":"+ Aggiungi la prima attrezzatura"):"+ Aggiungi il primo mezzo",
                           a:attrezzo?"new-attrezzatura":"new-mezzo"}),
      colonne:[{lab:attrezzo?(STRU?"Strumento":"Attrezzatura"):"Mezzo",w:"26%"},{lab:"Tipo",w:"16%",cls:"c-chi"},
               {lab:attrezzo?"Matricola":"Targa",w:"16%",cls:"c-chi"},
               {lab:"Stato",w:"20%"},{lab:"Prossima scadenza",w:"22%",cls:"c-cli"}],
      righe:L.map(m=>{
        const md=mezzoDate(m,scadMap[m.id]), st=mezzoEtichetta(m,md);
        return {
          id:m.id,
          click:{action:"edit-mezzo",data:{id:m.id}},
          celle:[
            `<span class="c-nome">${esc(m.nome||"—")}</span>`,
            esc(m.tipo||"—")+(mezzoChiUso(m)?`<span class="cli-dove">${esc(mezzoChiUso(m))}</span>`:""),
            esc(m.targa||"—"),
            `<span class="stato" style="background:${st.bg};color:${st.fg}">${st.lab}</span>`,
            cellaScadenza(md)
          ],
          menu:[
            attrezzo?null:{lab:"⛽ Rifornimenti",action:"mezzo-rifornimenti",data:{id:m.id}},
            {lab:"📅 Aggiungi scadenza",action:"mezzo-scad",data:{id:m.id}},
            {sep:true},
            {lab:"✏ Modifica",action:"edit-mezzo",data:{id:m.id}},
            {lab:"🗑 Elimina",action:"del-mezzo",data:{id:m.id},del:true}
          ].filter(Boolean)
        };
      }),
      cards:()=>L.map(m=>mezzoCard(m,scadMap[m.id])).join("")
    });
  }
  const MEZZI_VISTE=[{k:"tutti",lab:"Tutti"},{k:"liberi",lab:"Liberi"},{k:"fuori",lab:"Fuori"},{k:"manutenzione",lab:"In manutenzione"}];
  /* 11 nov 2026 — collaudo 3.14. Le date scritte NEL MODULO del mezzo
     (assicurazione, revisione, collaudo, verifica) non entravano nella
     vista gest_mezzi_scadenze, che conta solo le righe dello Scadenzario:
     un'assicurazione scaduta lasciava il mezzo «Disponibile» in verde.
     E la riga diceva «1 scadenza scaduta» senza dire quale.
     Qui le due fonti si mettono insieme: scadute (con nome e data) e la
     prossima. Le stesse quattro date di calAltreDate (calendario). */
  let mezziScaduteMap={};
  function mezzoDate(m,sc){
    const oggi=todayStr(), scad=[], fut=[];
    const piuMesi=(d,n)=>{const x=new Date(d+"T12:00:00");const g=x.getDate();x.setMonth(x.getMonth()+n);if(x.getDate()<g)x.setDate(0);
      return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
    const mod=[["assicurazione_scad","Assicurazione"],["revisione_scad","Revisione"],["collaudo_scad","Collaudo"]]
      .filter(c=>m[c[0]]).map(c=>({t:c[1],d:m[c[0]]}));
    if(m.verifica_ultima&&(+m.verifica_mesi||0)>0)mod.push({t:"Verifica periodica",d:piuMesi(m.verifica_ultima,+m.verifica_mesi)});
    mod.forEach(x=>(x.d<oggi?scad:fut).push(x));
    const nMod=scad.length;
    (mezziScaduteMap[m.id]||[]).forEach(x=>scad.push(x));
    if(sc&&sc.prossima_data)fut.push({t:sc.prossimo_tipo||sc.prossimo_titolo||"Scadenza",d:sc.prossima_data});
    scad.sort((a,b)=>a.d.localeCompare(b.d)); fut.sort((a,b)=>a.d.localeCompare(b.d));
    /* se lo Scadenzario dice di piu' di quelle lette (lettura fallita), il numero resta */
    const nSc=Math.max(scad.length, ((sc&&sc.scadute)||0)+nMod);
    return {scadute:scad, n:nSc, prossima:fut[0]||null};
  }
  function mezzoScaduteTesto(md){
    if(!md.n)return "";
    const nomi=md.scadute.map(x=>x.t);
    if(!nomi.length)return md.n+" "+(md.n===1?"scadenza scaduta":"scadenze scadute");
    if(nomi.length===1)return nomi[0]+": scadeva il "+fdate(md.scadute[0].d);
    return "Scadute: "+nomi.slice(0,3).join(", ")+(nomi.length>3?" e altre "+(nomi.length-3):"");
  }
  /* colonna "Prossima scadenza": il tipo sopra, il quando sotto.
     Rosso se è già passata, ambra se casca entro 30 giorni: prima il rosso
     scattava solo col conteggio delle scadute e l'ambra a 7 giorni. */
  function cellaScadenza(md){
    if(md.n)return `<span class="cli-nome q-passato">${esc(mezzoScaduteTesto(md))}</span>`;
    if(!md.prossima)return `<span class="cli-nome vuoto">—</span>`;
    const g=_giorniA(md.prossima.d), q=quando(md.prossima.d);
    const cls=g<0?"q-passato":(g<=30?"q-attesa":"q-futuro");
    return `<span class="cli-nome">${esc(md.prossima.t)}</span><span class="cli-dove ${cls}">${q.testo}</span>`;
  }
  /* l'etichetta dello stato: con una scadenza passata non puo' dire
     «Disponibile» in verde (7 nov), e adesso vale anche nella tabella */
  function mezzoEtichetta(m,md){
    const st=MEZZO_STATI[m.stato]||MEZZO_STATI.disponibile;
    const _libero=(m.stato==="disponibile"||m.stato==="in_uso"||!m.stato);
    if(md.n&&_libero) return {lab:"Da rinnovare",bg:"var(--err-bg)",fg:"var(--err)"};
    /* 12 nov 2026 — un mezzo fuori a noleggio non e' «Disponibile» (blu = in corso, regola 15) */
    const _nl=mezziNolMap[m.id];
    if(_nl&&_libero){
      if(_nl.peso===3) return {lab:"In ritardo · "+_nl.rit+(_nl.rit===1?" giorno":" giorni"),bg:"var(--err-bg)",fg:"var(--err)"};
      if(_nl.peso===2) return {lab:"Fuori a noleggio",bg:"var(--info-bg)",fg:"var(--info)"};
      return {lab:"Prenotato",bg:"var(--attesa-bg)",fg:"var(--attesa)"};
    }
    return st;
  }
  function mezzoCard(m,sc){
    const st=MEZZO_STATI[m.stato]||MEZZO_STATI.disponibile;
    const cat=m.tipo?((m.categoria==="attrezzatura"?"🔧 ":"🚚 ")+esc(m.tipo))
                    :(m.categoria==="attrezzatura"
                      ?(ruoloUtente==='professionista'?"🔧 Strumento":"🔧 Attrezzatura")
                      :"🚚 Mezzo");
    /* la barretta a sinistra dice come sta il mezzo senza leggere:
       rossa se ha scadenze già passate, arancione se una arriva entro 7 giorni */
    let scTesto="", tono="t-ok";
    const md=mezzoDate(m,sc);
    if(md.n){
      tono="t-err";
      scTesto=`<span style="color:var(--err);font-weight:700">⚠ ${esc(mezzoScaduteTesto(md))}</span>`;
    }else if(md.prossima){
      const g=_giorniA(md.prossima.d);
      const eti=md.prossima.t;
      const quando=g===0?"oggi":(g===1?"tra 1 giorno":"tra "+g+" giorni");
      if(g<=7)tono="t-attesa";
      scTesto=`<span style="color:${g<=7?"var(--attesa)":"var(--muted)"};font-weight:${g<=7?"700":"400"}">📅 ${esc(eti)} ${quando}</span>`;
    }else{ tono="t-neutro"; }
    const cb=carbMap[m.id];
    const carbTesto=cb&&(+cb.spesa_totale)>0
      ? "⛽ "+eur2(cb.spesa_totale)+(cb.km_litro?" · "+String(cb.km_litro).replace(".",",")+" km/l":"")
      : "";
    /* 7 nov 2026: con una scadenza passata l'etichetta non puo' dire
       «Disponibile» in verde. Diventa «Da rinnovare» in rosso
       (manutenzione e fuori uso restano: dicono gia' che non va). */
    let etic=mezzoEtichetta(m,md);
    /* 24 nov 2026 — uscite e rientri: chi ce l'ha adesso, i km, il pulsante */
    const _u=(m.categoria!=="attrezzatura")?(mezziUscMap[m.id]||{}):{};
    const _km=(m.categoria!=="attrezzatura")?mzKm(m):null;
    let _chi=mezzoChiUso(m)?"👤 "+esc(mezzoChiUso(m)):"", _rit="";
    /* 24 nov 2026 — il tagliando a km */
    const _tg=(m.categoria!=="attrezzatura")?mzTagliando(m):null;
    let _tgTesto="";
    if(_tg){
      if(_tg.manca<0){ _tgTesto=`<span style="color:var(--err);font-weight:700">⚠ Tagliando passato di ${mzKmTesto(-_tg.manca)}</span>`; tono="t-err"; }
      else if(_tg.manca<=MZ_TAG_AVVISO){ _tgTesto=`<span style="color:var(--attesa);font-weight:700">🔧 Tagliando fra ${mzKmTesto(_tg.manca)}</span>`; if(tono!=="t-err")tono="t-attesa"; }
      else _tgTesto="🔧 Tagliando fra "+mzKmTesto(_tg.manca);
    }
    if(_u.aperta){
      _chi=`<b>👤 Fuori con ${esc(_u.aperta.chi_nome||"—")} ${esc(mzQuando(_u.aperta.uscita_il))}</b>`;
      if(etic.lab==="Disponibile"||etic.lab==="In uso")etic={lab:"Fuori",bg:"var(--info-bg)",fg:"var(--info)"};
    }else if(_u.ultima){
      const kf=(_u.ultima.km_rientro!=null&&_u.ultima.km_uscita!=null)?(+_u.ultima.km_rientro-(+_u.ultima.km_uscita)):null;
      _rit="↩ Rientrato "+esc(mzQuando(_u.ultima.rientro_il))+(_u.ultima.chi_nome?" con "+esc(_u.ultima.chi_nome):"")+(kf!=null?" · "+mzKmTesto(kf):"");
    }
    const _html=schedaJob({
      tono, titolo:esc(m.nome),
      destra:`<span class="stato" style="background:${etic.bg};color:${etic.fg}">${etic.lab}</span>`,
      meta:[cat, m.targa?"🔖 "+esc(m.targa):"", _km!=null?"🛣 "+mzKmTesto(_km):"", _chi, carbTesto, _rit, _tgTesto, scTesto],
      nota:m.note?"📝 "+esc(m.note):"",
      azioni:[
        /* 18 nov 2026 — i rifornimenti sono dei mezzi: sulla betoniera non si offrono (come gia' nella tabella) */
        m.categoria==="attrezzatura"?null:{lab:"⛽ Rifornimenti",action:"mezzo-rifornimenti",data:{id:m.id}},
        {lab:"＋ Scadenza",action:"mezzo-scad",data:{id:m.id}},
        {lab:"✏ Modifica",action:"edit-mezzo",data:{id:m.id}},
        {lab:"🗑 Elimina",action:"del-mezzo",data:{id:m.id},del:true}
      ].filter(Boolean)});
    if(m.categoria==="attrezzatura")return _html;
    /* fuori a noleggio, in manutenzione o fuori uso: non si fa uscire (il rientro si', se era gia' fuori) */
    const _nl=mezziNolMap[m.id];
    if(!_u.aperta&&((_nl&&_nl.peso>=2)||m.stato==="manutenzione"||m.stato==="fuori_uso"))return _html;
    const _btn=_u.aperta
      ?`<button class="btn-primary btn-sm mz-btn" data-action="mz-rientra" data-id="${esc(String(m.id))}">↩ Rientrato</button>`
      :`<button class="btn-primary btn-sm mz-btn" data-action="mz-esce" data-id="${esc(String(m.id))}">→ Esce</button>`;
    return _html.replace(/<\/div><\/div>\s*$/,_btn+"</div></div>");
  }
  function mezzoForm(m,catIniziale){
    const isNew=!m;m=m||{};
    /* Uno studio non ha mezzi con la targa: quello che registra qui è sempre
       uno strumento. Quindi per lui la categoria è decisa (attrezzatura) e la
       spunta "e' un'attrezzatura" non compare: sceglierebbe fra due cose di cui
       una non esiste nel suo menu. */
    /* Se sta modificando una riga che già esiste, la categoria salvata NON si
       tocca: un mezzo registrato prima resta un mezzo, non diventa uno
       strumento di nascosto. La forzatura vale solo per le righe nuove. */
    const cat=(ruoloUtente==='professionista')
      ? (m.categoria||"attrezzatura")
      : (m.categoria||catIniziale||"mezzo");
    const attrezzo=(cat==="attrezzatura");
    const STRU=(ruoloUtente==='professionista')&&attrezzo;
    /* i tipi già usati diventano suggerimenti: non un elenco chiuso */
    const tipiUsati=[...new Set(mezziCache.map(x=>(x.tipo||"").trim()).filter(Boolean))].sort();
    const tipoSugg=tipiUsati.map(t=>`<option value="${esc(t)}">`).join("");
    /* 20 nov 2026 (voce Strumenti) — «Chi ce l'ha» (tutte le facce) e, per lo
       studio, la prossima taratura che diventa una scadenza vera */
    const _pers=Object.entries(mezziOpNomi).sort((a,b)=>a[1].localeCompare(b[1]));
    const _pro=(ruoloUtente==='professionista');
    const chiOpts=`<option value="">— ${_pro?"in studio":"in azienda"} —</option>`+_pers.map(p=>`<option value="${esc(p[0])}" ${String(m.operatore_id||"")===p[0]?"selected":""}>${esc(p[1])}</option>`).join("");
    const _tar=STRU?((window._mzTaratura||{})[m.id]||null):null;
    const _ripOpts=(typeof SCAD_RIPETI!=="undefined"?SCAD_RIPETI:[[0,"Non si ripete"],[12,"Ogni anno"],[24,"Ogni 2 anni"]])
      .map(r=>`<option value="${r[0]}" ${((_tar?(+_tar.ripeti_mesi||0):12)===r[0])?"selected":""}>${r[1]}</option>`).join("");
    const statoOpts=Object.keys(MEZZO_STATI)
      .map(k=>`<option value="${k}" ${((m.stato||"disponibile")===k)?"selected":""}>${MEZZO_STATI[k].lab}</option>`).join("");
    /* 9 agosto 2026 — finestra grande a due colonne (regola fissa sulle finestre) */
    openSheetGrande(STRU?(isNew?"Nuovo strumento":"Modifica strumento")
                        :(isNew?(attrezzo?"Nuova attrezzatura":"Nuovo mezzo"):(attrezzo?"Modifica attrezzatura":"Modifica mezzo")),
      `<div class="sh-cols"><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">Che cos'è</div>
        <div class="field"><label>Nome</label><input id="m-nome" value="${esc(m.nome||"")}" placeholder="${STRU?"Es. Stazione totale Leica TS07":(attrezzo?"Es. Ponteggio 6 m, Betoniera 350 l":"Es. Furgone Ducato, Fiat Doblo")}"></div>
        <div class="row2">
          <div class="field"><label>Tipo</label>
            <input id="m-tipo" list="m-tipo-sugg" value="${esc(m.tipo||"")}" placeholder="${STRU?"Es. stazione totale, distanziometro, termocamera":(attrezzo?"Es. ponteggio, betoniera, trapano":"Es. furgone, escavatore, auto")}" autocomplete="off">
            <datalist id="m-tipo-sugg">${tipoSugg}</datalist></div>
          <div class="field"><label>${attrezzo?"Matricola":"Targa"}</label><input id="m-targa" value="${esc(m.targa||"")}" placeholder="${attrezzo?"Es. MT-4471":"Es. AB123CD"}"></div></div>
        <div class="field"><label>Stato</label><select id="m-stato">${statoOpts}</select></div>
        </div>
        <div class="sh-b">
        <div class="sh-tit">Chi ce l'ha</div>
        <div class="field"><label>${_pro?"Collaboratore":"Persona"}</label><select id="m-chi">${chiOpts}</select></div>
        <p class="sh-nota" style="margin-top:0">${_pers.length?"Lo vedi sulla scheda: «Ce l'ha …».":(_pro?"Aggiungi i collaboratori nella voce Collaboratori.":"Aggiungi le persone nella voce Squadra.")} ${_pro?"Le pratiche dove si usa le colleghi dalla pratica, nel riquadro «Strumenti usati».":"I lavori dove si usa li colleghi dal lavoro."}</p>
        </div>
        </div><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">${STRU?"La taratura":"Dove sta di casa"}</div>
        ${STRU
          ? `<input type="hidden" id="m-cat" value="${esc(cat)}">
             <div class="row2">
               <div class="field"><label>Prossima taratura</label><input type="date" id="m-tar-data" value="${esc((_tar&&_tar.data_scadenza)||"")}"></div>
               <div class="field"><label>Si ripete</label><select id="m-tar-ripeti">${_ripOpts}</select></div></div>
             <p class="sh-nota" style="margin-top:0">Diventa una scadenza «Taratura strumento»: la vedi nello Scadenzario e ti arriva l'email 30 e 7 giorni prima. Quando la segni fatta, quella dopo nasce da sola. Le altre (manutenzione, verifica) dal pulsante <b>＋ Scadenza</b> sulla scheda.</p>`
          : `<label style="display:flex;align-items:flex-start;gap:10px;font-size:1rem;margin:2px 0 12px;cursor:pointer">
          <input type="checkbox" id="m-attrezzo" ${attrezzo?"checked":""} style="width:20px;height:20px;flex-shrink:0;margin-top:2px">
          <span>È un'attrezzatura (non si guida) — sta fra le Attrezzature invece che fra i Mezzi</span></label>
        <label style="display:flex;align-items:flex-start;gap:10px;font-size:1rem;margin:2px 0 12px;cursor:pointer">
          <input type="checkbox" id="m-nolo" ${m.noleggiabile?"checked":""} style="width:20px;height:20px;flex-shrink:0;margin-top:2px">
          <span>Lo noleggio anche a terzi — compare nel listino del <b>Noleggio</b>, dove gli metti le tariffe</span></label>`}
        </div>
        ${(STRU||attrezzo)?"":mzTagliandoHTML(m)}
        ${STRU?"":`<div class="sh-b">
        <div class="sh-tit">Le scadenze</div>
        <p class="sh-nota" style="margin-top:0">Bollo e le altre: pulsante <b>＋ Scadenza</b> qui in alto.</p>
        <div class="row2">
          <div class="field"><label>Assicurazione, scade il</label><input type="date" id="m-assic" value="${esc(m.assicurazione_scad||"")}"></div>
          <div class="field"><label>Revisione, scade il</label><input type="date" id="m-revis" value="${esc(m.revisione_scad||"")}"></div></div>
        <div class="row2">
          <div class="field"><label>Collaudo, scade il</label><input type="date" id="m-collaudo" value="${esc(m.collaudo_scad||"")}"></div>
          <div class="field"><label>Ultima verifica periodica</label><input type="date" id="m-vdata" value="${esc(m.verifica_ultima||"")}"></div></div>
        <div class="field"><label>La verifica si ripete ogni quanti mesi</label><input type="number" id="m-vmesi" min="0" max="120" value="${!(+m.verifica_mesi)?"":esc(m.verifica_mesi)}" placeholder="Vuoto se non serve"></div>
        </div>`}
        <div class="sh-b">
        <div class="sh-tit">Note</div>
        <div class="field"><textarea id="m-note" placeholder="Dove si trova, chi lo usa, promemoria...">${esc(m.note||"")}</textarea></div>
        </div>
        </div></div>`,
      ctrTastoHTML('mezzo')
      +`<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-mezzo" data-id="${m.id||""}">${isNew?"Crea":"Salva"}</button>`);
    ctrAscolta('mezzo');
    /* 24 nov 2026 — il registro delle uscite sotto le note (solo i mezzi gia' salvati) */
    if(!isNew&&!attrezzo)mzRegistro(m.id);
  }
  async function saveMezzo(id){
    const nome=$("#m-nome").value.trim();if(!nome){campoManca($("#m-nome"),"Manca il nome: scrivilo qui.");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    /* 24 nov 2026 — il tagliando a km: si controlla prima di salvare niente */
    let _tagCampi=null;
    if($("#m-tag-ogni")){
      const o=mzLeggiKm("#m-tag-ogni"), u=mzLeggiKm("#m-tag-ult");
      if(o.errore){campoManca($("#m-tag-ogni"),"Scrivi solo il numero dei km, es. 30.000");return;}
      if(u.errore){campoManca($("#m-tag-ult"),"Scrivi solo il numero dei km, es. 21.000");return;}
      if(!o.vuoto&&o.n<500){campoManca($("#m-tag-ogni"),"Ogni quanti km? Di solito fra 15.000 e 40.000");return;}
      _tagCampi={tagliando_ogni_km:o.vuoto?null:o.n, tagliando_ultimo_km:u.vuoto?null:u.n};
    }
    /* per lo studio la spunta non c'e': la categoria viaggia nel campo nascosto
       messo dal modulo, così il salvataggio non deve indovinarla */
    const ckAttr=$("#m-attrezzo"), catFissa=$("#m-cat");
    const categoria=ckAttr?(ckAttr.checked?"attrezzatura":"mezzo")
                          :((catFissa&&catFissa.value)||"attrezzatura");
    const tipo=$("#m-tipo").value.trim()||null;
    const targa=$("#m-targa").value.trim(), stato=$("#m-stato").value, note=$("#m-note").value.trim();
    /* ⛔ 4 settembre 2026 — le scadenze del mezzo si scrivono QUI e stanno
       sulla riga del mezzo: sono le stesse identiche che vede il Noleggio.
       Prima erano due schede diverse in due pagine diverse e la revisione
       andava aggiornata due volte. Una data vuota vale null, non "". */
    const _d=q=>{const e=$(q);return e&&e.value?e.value:null;};
    const _extra=$("#m-assic")?{
      noleggiabile:!!($("#m-nolo")&&$("#m-nolo").checked),
      assicurazione_scad:_d("#m-assic"), revisione_scad:_d("#m-revis"),
      collaudo_scad:_d("#m-collaudo"),  verifica_ultima:_d("#m-vdata"),
      verifica_mesi:Math.max(0,Math.min(120,Math.round(+(($("#m-vmesi")||{}).value||0))||0))
    }:{};
    const _scrivi=async campi=>id
      ?await sb.from("gest_mezzi").update(campi).eq("id",id).eq("user_id",sbUid).select("id")
      :await sb.from("gest_mezzi").insert({user_id:sbUid,mestiere_id:curMestiere(),...campi}).select("id");
    const _base={nome,categoria,tipo,targa,stato,note};
    /* 20 nov 2026 — chi ce l'ha: se la colonna manca si salva senza e si dice */
    const _chiEl=$("#m-chi"); let _senzaChi=false;
    if(_chiEl)_base.operatore_id=_chiEl.value||null;
    let {data,error}=await _scrivi({..._base,..._extra});
    if(error&&_chiEl&&/operatore_id/i.test(error.message||"")){
      delete _base.operatore_id; _senzaChi=true;
      ({data,error}=await _scrivi({..._base,..._extra}));
    }
    /* se sql/mezzi-una-lista-sola.sql non e' ancora passato, quelle colonne
       non ci sono: il mezzo si salva lo stesso, e si dice cosa manca */
    if(error&&/column|schema cache/i.test(error.message||"")
            &&/noleggiabile|assicurazione_scad|revisione_scad|collaudo_scad|verifica_/i.test(error.message||"")){
      ({data,error}=await _scrivi(_base));
      if(!error)toast("Salvato, ma le scadenze no: manca sql/mezzi-una-lista-sola.sql");
    }
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata");return;}
    /* 20 nov 2026 (voce Strumenti) — la prossima taratura diventa una scadenza
       vera (email, Scadenzario, Cestino insieme allo strumento). Se ce n'e' gia'
       una aperta si aggiorna quella, non se ne fa una seconda. */
    let _tarMsg="";
    const _td=$("#m-tar-data");
    if(_td){
      const _mid=data[0].id, _dt=_td.value||null, _rip=+(($("#m-tar-ripeti")||{}).value||0)||0;
      const _ap=(window._mzTaratura||{})[_mid];
      try{
        if(_ap&&_dt&&(_ap.data_scadenza!==_dt||(+_ap.ripeti_mesi||0)!==_rip)){
          const r=await sb.from("gest_scadenze").update({data_scadenza:_dt,ripeti_mesi:_rip}).eq("id",_ap.id).eq("user_id",sbUid).select("id");
          if(r.error||!r.data||!r.data.length)_tarMsg=" — la taratura però non è aggiornata, riprova dalla scadenza";
        }else if(!_ap&&_dt){
          const r=await sb.from("gest_scadenze").insert({user_id:sbUid,mestiere_id:curMestiere(),titolo:"Taratura strumento",tipo_pratica:"Taratura strumento",
            mezzo_id:_mid,data_scadenza:_dt,ripeti_mesi:_rip,avvisa:true,stato:"aperta"}).select("id");
          if(r.error||!r.data||!r.data.length)_tarMsg=" — la taratura però non è salvata: aggiungila con «＋ Scadenza»";
        }
      }catch(e){ _tarMsg=" — la taratura però non è salvata"; }
      try{ renderScadenze(); rinfresca("calendario","riepilogo"); }catch(e){}
    }
    if(_tagCampi){
      const rt=await sb.from("gest_mezzi").update(_tagCampi).eq("id",data[0].id).eq("user_id",sbUid).select("id");
      if(rt.error||!rt.data||!rt.data.length)_tarMsg=" — il tagliando però non è salvato"+(rt.error&&/column|schema cache/i.test(rt.error.message||"")?": manca sql/2026-11-24-mezzi-tagliando-km.sql":", riprova");
    }
    closeSheet();renderMezzi();renderAttrezzature();
    if(_senzaChi){toast("Salvato, ma «Chi ce l'ha» no: manca sql/2026-11-20-strumenti-chi-ce-l-ha.sql");return;}
    if(_tarMsg){toast((id?"Aggiornato":(categoria==="attrezzatura"?"Strumento aggiunto":"Mezzo aggiunto"))+_tarMsg);return;}
    const _pro=(ruoloUtente==='professionista');
    /* 18 nov 2026 — spostato da una parte all'altra: spariva dall'elenco senza dire dove andava */
    const _era=id?((mezziCache.find(x=>String(x.id)===String(id))||{}).categoria==="attrezzatura"?"attrezzatura":"mezzo"):null;
    if(id&&!_pro&&_era!==categoria){toast(categoria==="attrezzatura"?"Aggiornato — adesso sta fra le Attrezzature":"Aggiornato — adesso sta fra i Mezzi");return;}
    toast(id?"Aggiornato":(categoria==="attrezzatura"?(_pro?"Strumento aggiunto ✔":"Attrezzatura aggiunta ✔"):"Mezzo aggiunto ✔"));
  }


  /* ═══ 24 NOVEMBRE 2026 — USCITE E RIENTRI DEI MEZZI ═══════════════════
     Chi prende il furgone, con quanti km, dove va; e quando torna.
     Tabella gest_mezzi_uscite (sql/2026-11-24-mezzi-uscite.sql). Qui scrive
     il titolare; l'operaio scrive dalla sua app (js/op-mezzi.js) passando da
     gest_mezzo_prendo / gest_mezzo_riporto, che controllano il permesso «mezzi».
     ⚠️ Un mezzo ha UNA sola uscita aperta: lo tiene l'indice unico del
     database, quindi due tocchi insieme non fanno due uscite.
     ═════════════════════════════════════════════════════════════════════ */
  function mzPunti(n){ return String(Math.round(+n)).replace(/\B(?=(\d{3})+(?!\d))/g,"."); }
  function mzKmTesto(n){ return mzPunti(n)+" km"; }
  /* i km di adesso: il piu' alto fra quelli scritti sul mezzo e quelli del registro */
  function mzKm(m){
    const u=mezziUscMap[m.id]||{};
    let k=(m.km_attuali!=null&&m.km_attuali!=="")?+m.km_attuali:null;
    [u.aperta&&u.aperta.km_uscita, u.ultima&&u.ultima.km_rientro, u.ultima&&u.ultima.km_uscita].forEach(x=>{
      if(x!=null&&x!==""&&(k==null||+x>k))k=+x;
    });
    return k;
  }
  function mzQuando(ts){
    if(!ts)return "";
    const d=new Date(ts), oggi=new Date();
    const g=Math.round((new Date(oggi.toDateString())-new Date(d.toDateString()))/86400000);
    const hh=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
    if(g===0)return "oggi alle "+hh;
    if(g===1)return "ieri alle "+hh;
    return "il "+d.toLocaleDateString("it-IT")+" alle "+hh;
  }
  /* un numero di km scritto a mano: «177.117», «177117», «177 117» */
  function mzLeggiKm(sel){
    const el=$(sel); const t=((el&&el.value)||"").trim();
    if(!t)return {vuoto:true};
    if(!/^[\d.\s]+(,\d+)?$/.test(t))return {errore:true};
    const n=Math.round(+t.replace(/[.\s]/g,"").replace(",","."));
    if(!isFinite(n)||n<0||n>9999999)return {errore:true};
    return {n};
  }
  function mzTabellaManca(err){ return /gest_mezzi_uscite|relation|schema cache/i.test((err&&err.message)||""); }
  let _mzSalvo=false;

  async function mzEsceForm(id){
    const m=mezziCache.find(x=>String(x.id)===String(id)); if(!m)return;
    const k=mzKm(m), mid=curMestiere();
    let lav=[];
    try{
      const r=await sb.from("gest_lavori").select("id,descrizione,dove,cliente_id,data_prevista,stato")
        .eq("user_id",sbUid).eq("mestiere_id",mid).is("eliminato_il",null).neq("stato","fatto")
        .order("data_prevista",{ascending:true}).limit(200);
      lav=(r&&r.data)||[];
    }catch(e){}
    const _cli=c=>((cliCache||[]).find(x=>String(x.id)===String(c))||{}).nome||"";
    const _tit=l=>{const c=_cli(l.cliente_id);const d=(l.descrizione||"").slice(0,50);return [d||c||"Lavoro",c&&d?c:"",l.dove||""].filter(Boolean).join(" — ");};
    const _pro=(ruoloUtente==='professionista');
    const lavOpts=`<option value="">— nessuno —</option>`+lav.map(l=>`<option value="${esc(String(l.id))}">${esc(_tit(l))}</option>`).join("");
    const pers=Object.entries(mezziOpNomi).sort((a,b)=>a[1].localeCompare(b[1]));
    const chiOpts=`<option value="">Io (titolare)</option>`+pers.map(p=>`<option value="${esc(p[0])}">${esc(p[1])}</option>`).join("");
    openSheetGrande("Esce — "+esc(m.nome)+(m.targa?" · "+esc(m.targa):""),
      `<div class="sh-cols"><div class="sh-col">
        <div class="sh-b"><div class="sh-tit">Chi lo prende</div>
          <div class="field"><label>Persona</label><select id="mz-chi">${chiOpts}</select></div>
          <p class="sh-nota" style="margin-top:0">Data e ora si scrivono da sole quando premi «Registra l'uscita».${pers.length?"":" Le persone le aggiungi in Squadra."}</p></div>
        <div class="sh-b"><div class="sh-tit">I chilometri</div>
          <div class="field"><label>Km alla partenza</label><input id="mz-km" type="text" inputmode="numeric" value="${k!=null?mzPunti(k):""}" placeholder="Es. 177.117"></div>
          <p class="sh-nota" style="margin-top:0">${k!=null?"Sono quelli dell'ultima volta. Se sul cruscotto c'è un altro numero, correggilo.":"Scrivi quelli del cruscotto: al rientro il gestionale conta i km fatti."}</p></div>
      </div><div class="sh-col">
        <div class="sh-b"><div class="sh-tit">Dove va</div>
          <div class="field"><label>${_pro?"Pratica":"Lavoro"}</label><select id="mz-lav">${lavOpts}</select></div>
          <div class="field"><label>Motivo <span style="font-weight:400">(se vuoi)</span></label><input id="mz-motivo" maxlength="300" placeholder="Es. porta il materiale, va dal fornitore"></div></div>
        <div class="sh-b"><div class="sh-tit">Al rientro</div>
          <p class="sh-nota" style="margin-top:0">Sulla scheda del mezzo compare «↩ Rientrato»: si scrivono i km d'arrivo e il gestionale conta da solo i km fatti. Gli operai lo fanno dalla loro app, scheda «Mezzi», se in Squadra hanno il permesso «Mezzi».</p></div>
      </div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="mz-esce-salva" data-id="${esc(String(m.id))}">Registra l'uscita</button>`);
  }

  async function mzEsceSalva(id){
    if(_mzSalvo)return;
    const m=mezziCache.find(x=>String(x.id)===String(id)); if(!m)return;
    const km=mzLeggiKm("#mz-km");
    if(km.errore){campoManca($("#mz-km"),"Scrivi solo il numero dei km, es. 177.117");return;}
    const prima=mzKm(m);
    if(!km.vuoto&&prima!=null&&km.n<prima&&typeof window.tiChiedi==="function"){
      if(!(await window.tiChiedi("Hai scritto "+mzKmTesto(km.n)+", ma l'ultima volta erano "+mzKmTesto(prima)+".",{titolo:"I chilometri sono giusti?",si:"Sì, sono giusti",no:"No, li correggo"}))){
        const e=$("#mz-km"); if(e){try{e.focus();e.select();}catch(_){}} return;
      }
    }
    const opId=($("#mz-chi")||{}).value||null;
    const riga={user_id:sbUid, mezzo_id:m.id, operatore_id:opId,
      chi_nome:opId?(mezziOpNomi[opId]||null):"Titolare",
      lavoro_id:($("#mz-lav")||{}).value||null,
      motivo:((($("#mz-motivo")||{}).value)||"").trim().slice(0,300)||null,
      km_uscita:km.vuoto?null:km.n};
    _mzSalvo=true;
    try{
      const {data,error}=await sb.from("gest_mezzi_uscite").insert(riga).select("id");
      if(error){
        if(error.code==="23505"){toast("Questo mezzo risulta già fuori: prima registra il rientro");closeSheet();renderMezzi();return;}
        if(mzTabellaManca(error)){toast("Manca sql/2026-11-24-mezzi-uscite.sql: l'uscita non è salvata");return;}
        toast("Errore: "+error.message);return;
      }
      if(!data||!data.length){toast("Non salvato: nessuna riga scritta");return;}
      if(!km.vuoto&&(prima==null||km.n>prima)){
        try{ await sb.from("gest_mezzi").update({km_attuali:km.n}).eq("id",m.id).eq("user_id",sbUid).select("id"); }catch(e){}
      }
      closeSheet(); await renderMezzi();
      toast("Uscita registrata: "+(riga.chi_nome||"")+" ha "+m.nome);
    }finally{ _mzSalvo=false; }
  }

  async function mzRientraForm(id){
    const m=mezziCache.find(x=>String(x.id)===String(id)); if(!m)return;
    const u=(mezziUscMap[m.id]||{}).aperta;
    if(!u){toast("Questo mezzo non risulta fuori");renderMezzi();return;}
    const kmU=u.km_uscita;
    openSheetGrande("Rientro — "+esc(m.nome)+(m.targa?" · "+esc(m.targa):""),
      `<div class="sh-cols"><div class="sh-col">
        <div class="sh-b"><div class="sh-tit">Com'è uscito</div>
          <div class="dato"><b>Chi</b> ${esc(u.chi_nome||"—")}</div>
          <div class="dato"><b>Quando</b> ${esc(mzQuando(u.uscita_il))}</div>
          <div class="dato"><b>Km alla partenza</b> ${kmU!=null?mzKmTesto(kmU):"non scritti"}</div>
          ${u.motivo?`<div class="dato"><b>Motivo</b> ${esc(u.motivo)}</div>`:""}
        </div>
      </div><div class="sh-col">
        <div class="sh-b"><div class="sh-tit">I chilometri all'arrivo</div>
          <div class="field"><label>Km sul cruscotto</label><input id="mz-km2" type="text" inputmode="numeric" placeholder="${kmU!=null?"Es. "+mzPunti(+kmU+50):"Es. 177.203"}"></div>
          <p class="sh-nota" id="mz-fatti" style="margin-top:0">${kmU!=null?"Scrivili e qui vedi i km fatti.":"Se non li sai lascia vuoto: il rientro si registra lo stesso."}</p></div>
      </div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="mz-rientra-salva" data-id="${esc(String(m.id))}">Registra il rientro</button>`);
    const inp=$("#mz-km2");
    if(inp&&kmU!=null)inp.addEventListener("input",()=>{
      const r=mzLeggiKm("#mz-km2"), f=$("#mz-fatti"); if(!f)return;
      if(r.vuoto){f.textContent="Scrivili e qui vedi i km fatti.";f.style.color="";return;}
      if(r.errore){f.textContent="Scrivi solo il numero, es. 177.203";f.style.color="var(--err)";return;}
      const d=r.n-(+kmU);
      if(d<0){f.textContent="Sono meno di quelli della partenza ("+mzKmTesto(kmU)+")";f.style.color="var(--err)";return;}
      f.textContent="Km fatti: "+mzKmTesto(d);f.style.color="";
    });
    try{inp&&inp.focus();}catch(e){}
  }

  async function mzRientraSalva(id){
    if(_mzSalvo)return;
    const m=mezziCache.find(x=>String(x.id)===String(id)); if(!m)return;
    const u=(mezziUscMap[m.id]||{}).aperta; if(!u){closeSheet();renderMezzi();return;}
    const km=mzLeggiKm("#mz-km2");
    if(km.errore){campoManca($("#mz-km2"),"Scrivi solo il numero dei km, es. 177.203");return;}
    if(!km.vuoto&&u.km_uscita!=null&&km.n<+u.km_uscita){
      campoManca($("#mz-km2"),"Sono meno dei km alla partenza ("+mzKmTesto(u.km_uscita)+")");return;
    }
    _mzSalvo=true;
    try{
      const {data,error}=await sb.from("gest_mezzi_uscite").update({rientro_il:new Date().toISOString(),km_rientro:km.vuoto?null:km.n})
        .eq("id",u.id).eq("user_id",sbUid).is("rientro_il",null).select("id");
      if(error){toast("Errore: "+error.message);return;}
      if(!data||!data.length){toast("Il rientro era già registrato");closeSheet();renderMezzi();return;}
      const prima=mzKm(m);
      if(!km.vuoto&&(prima==null||km.n>prima)){
        try{ await sb.from("gest_mezzi").update({km_attuali:km.n}).eq("id",m.id).eq("user_id",sbUid).select("id"); }catch(e){}
      }
      closeSheet(); await renderMezzi();
      toast("Rientrato ✔"+((!km.vuoto&&u.km_uscita!=null)?" — "+mzKmTesto(km.n-(+u.km_uscita))+" fatti":""));
    }finally{ _mzSalvo=false; }
  }

  /* il registro dentro la scheda del mezzo: in cima l'ultima uscita */
  async function mzRegistro(mezzoId){
    const col=document.querySelector("#sheet .sh-cols .sh-col:last-child"); if(!col)return;
    const box=document.createElement("div"); box.className="sh-b"; box.id="mz-registro";
    box.innerHTML='<div class="sh-tit">Uscite e rientri</div><p class="sh-nota" style="margin-top:0">Sto leggendo…</p>';
    col.appendChild(box);
    const r=await Promise.resolve(sb.from("gest_mezzi_uscite").select("id,chi_nome,lavoro_id,motivo,km_uscita,km_rientro,uscita_il,rientro_il")
      .eq("user_id",sbUid).eq("mezzo_id",mezzoId).is("eliminato_il",null).order("uscita_il",{ascending:false}).limit(30)).then(x=>x,()=>null);
    if(!document.body.contains(box))return;
    if(!r||r.error){box.innerHTML='<div class="sh-tit">Uscite e rientri</div><p class="sh-nota" style="margin-top:0">Non riesco a leggere le uscite: riprova fra poco.</p>';return;}
    const L=r.data||[];
    if(!L.length){box.innerHTML='<div class="sh-tit">Uscite e rientri</div><p class="sh-nota" style="margin-top:0">Ancora nessuna uscita. Dalla scheda del mezzo premi «→ Esce».</p>';return;}
    let tot=0;
    const righe=L.map(x=>{
      const kf=(x.km_rientro!=null&&x.km_uscita!=null)?(+x.km_rientro-(+x.km_uscita)):null;
      if(kf!=null)tot+=kf;
      const quando=new Date(x.uscita_il).toLocaleDateString("it-IT");
      const km=x.rientro_il?(kf!=null?mzKmTesto(kf):"km non scritti"):"<b style=\"color:var(--info)\">fuori adesso</b>";
      return `<div class="mz-reg"><span class="mz-reg-d">${esc(quando)}</span><span class="mz-reg-c">${esc(x.chi_nome||"—")}${x.motivo?" · "+esc(x.motivo):""}</span><span class="mz-reg-k">${km}</span></div>`;
    }).join("");
    box.innerHTML='<div class="sh-tit">Uscite e rientri</div>'+righe
      +(tot?`<p class="sh-nota">${L.length===1?"In questa uscita":"In tutto, in queste "+L.length+" uscite"}: ${mzKmTesto(tot)}.</p>`:"");
  }

  if(!window.__mzUsciteAscolto){
    window.__mzUsciteAscolto=1;
    document.addEventListener("click",function(e){
      const b=e.target.closest&&e.target.closest("[data-action]"); if(!b)return;
      const a=b.getAttribute("data-action"), id=b.getAttribute("data-id");
      if(a==="mz-esce"){e.preventDefault();e.stopPropagation();mzEsceForm(id);}
      else if(a==="mz-rientra"){e.preventDefault();e.stopPropagation();mzRientraForm(id);}
      else if(a==="mz-esce-salva"){e.preventDefault();mzEsceSalva(id);}
      else if(a==="mz-rientra-salva"){e.preventDefault();mzRientraSalva(id);}
    });
  }


  /* ═══ 24 NOVEMBRE 2026 — IL TAGLIANDO A KM ═══════════════════════════
     «Si fa ogni N km» e «ultimo fatto a N km» (sql/2026-11-24-mezzi-tagliando-km.sql).
     I km di adesso sono quelli di mzKm(): arrivano da soli con le uscite.
     Sotto MZ_TAG_AVVISO km mancanti la scheda si fa arancione, sotto zero rossa;
     lo dicono anche l'Assistente (js/gest-riepilogo.js) e l'email del lunedi'.
     ═════════════════════════════════════════════════════════════════════ */
  const MZ_TAG_AVVISO=1000;
  function mzTagliando(m){
    const ogni=+m.tagliando_ogni_km||0, ult=(m.tagliando_ultimo_km==null||m.tagliando_ultimo_km==="")?null:+m.tagliando_ultimo_km;
    const km=mzKm(m);
    if(!ogni||ult==null||km==null)return null;
    const prossimo=ult+ogni;
    return {prossimo, manca:prossimo-km, km};
  }
  function mzTagliandoNota(m,ogni,ult){
    const km=mzKm(m);
    if(!ogni)return "Scrivi ogni quanti km va fatto: te lo ricorda il gestionale.";
    if(ult==null)return "Scrivi a quanti km hai fatto l'ultimo tagliando.";
    if(km==null)return "Il prossimo tagliando è a <b>"+mzKmTesto(ult+ogni)+"</b>. I km del mezzo arrivano con la prima uscita.";
    const manca=ult+ogni-km;
    return "Adesso è a <b>"+mzKmTesto(km)+"</b>: il prossimo tagliando è a <b>"+mzKmTesto(ult+ogni)+"</b>, "
      +(manca<0?"<b style=\"color:var(--err)\">passato di "+mzKmTesto(-manca)+"</b>.":"fra "+mzKmTesto(manca)+".");
  }
  function mzTagliandoHTML(m){
    const km=m.id?mzKm(m):null;
    const ogni=+m.tagliando_ogni_km||0, ult=(m.tagliando_ultimo_km==null||m.tagliando_ultimo_km==="")?null:+m.tagliando_ultimo_km;
    return `<div class="sh-b" id="m-tag-box" data-mid="${esc(String(m.id||""))}">
        <div class="sh-tit">Il tagliando</div>
        <div class="row2">
          <div class="field"><label>Si fa ogni (km)</label><input id="m-tag-ogni" type="text" inputmode="numeric" value="${ogni?mzPunti(ogni):""}" placeholder="Es. 30.000"></div>
          <div class="field"><label>Ultimo fatto a (km)</label><input id="m-tag-ult" type="text" inputmode="numeric" value="${ult!=null?mzPunti(ult):""}" placeholder="Es. 21.000"></div></div>
        <p class="sh-nota" id="m-tag-nota" style="margin-top:0">${m.id?mzTagliandoNota(m,ogni,ult):"Scrivi ogni quanti km va fatto: te lo ricorda il gestionale."}</p>
        ${km!=null?`<button type="button" class="btn" data-action="mz-tag-fatto" data-km="${km}" style="width:100%">🔧 Tagliando fatto adesso (${mzKmTesto(km)})</button>`:""}
        <p class="sh-nota">I km arrivano da soli dalle uscite e dai rientri. Quando mancano ${mzKmTesto(MZ_TAG_AVVISO)} ti avvisa: sulla scheda, nell'Assistente e nell'email del lunedì.</p>
        </div>`;
  }
  function mzTagliandoRinfresca(){
    const box=$("#m-tag-box"), n=$("#m-tag-nota"); if(!box||!n)return;
    const m=mezziCache.find(x=>String(x.id)===box.dataset.mid)||{};
    const o=mzLeggiKm("#m-tag-ogni"), u=mzLeggiKm("#m-tag-ult");
    if(o.errore||u.errore){n.textContent="Scrivi solo il numero dei km.";return;}
    n.innerHTML=m.id?mzTagliandoNota(m,o.vuoto?0:o.n,u.vuoto?null:u.n):(o.vuoto?"Scrivi ogni quanti km va fatto: te lo ricorda il gestionale.":"Il prossimo tagliando sarà a "+(u.vuoto?"—":mzKmTesto(u.n+o.n))+".");
  }
  if(!window.__mzTagAscolto){
    window.__mzTagAscolto=1;
    document.addEventListener("input",function(e){ if(e.target&&(e.target.id==="m-tag-ogni"||e.target.id==="m-tag-ult"))mzTagliandoRinfresca(); });
    document.addEventListener("click",function(e){
      const b=e.target.closest&&e.target.closest('[data-action="mz-tag-fatto"]'); if(!b)return;
      e.preventDefault(); const i=$("#m-tag-ult"); if(!i)return;
      i.value=mzPunti(+b.dataset.km); i.dispatchEvent(new Event("input",{bubbles:true}));
      if(typeof toast==="function")toast("Segnato a "+mzKmTesto(+b.dataset.km)+": premi «Salva»");
    });
  }
