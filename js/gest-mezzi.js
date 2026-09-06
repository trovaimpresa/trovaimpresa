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
    const _leggiMezzi=async col=>await sb.from("gest_mezzi").select(col).eq("user_id",sbUid).or(_cliOr(mid)).order("nome");
    const [rmz,{data:vw},{data:cb}]=await Promise.all([
      _leggiMezzi(_MZCOL).then(r=>(r.error&&/column|schema cache/i.test(r.error.message||""))?_leggiMezzi(_MZCORTO):r),
      sb.from("gest_mezzi_scadenze").select("mezzo_id,aperte,scadute,prossima_data,prossimo_titolo,prossimo_tipo").eq("user_id",sbUid),
      /* i totali carburante: se la tabella non c'e' ancora, cb resta vuoto e non cambia niente */
      sb.from("gest_mezzi_carburante").select("mezzo_id,spesa_totale,km_litro").eq("user_id",sbUid)
    ]);
    mezziCache=(rmz&&rmz.data)||[];
    carbMap=Object.fromEntries((cb||[]).map(v=>[v.mezzo_id,v]));
    return Object.fromEntries((vw||[]).map(v=>[v.mezzo_id,v]));
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
    const tutti=mezziCache.filter(m=> attrezzo ? m.categoria==="attrezzatura" : m.categoria!=="attrezzatura");
    const filtro=attrezzo?attrezzFilter:mezziFilter;
    const filtra=(A,v)=>v==="manutenzione"?A.filter(m=>m.stato==="manutenzione"):A.slice();
    const conta={};MEZZI_VISTE.forEach(v=>conta[v.k]=filtra(tutti,v.k).length);
    const L=filtra(tutti,filtro);
    renderTabella({
      id:attrezzo?"attrezzature":"mezzi", box:attrezzo?"#attr-list":"#mezzi-list",
      viste:attrezzo?"#attr-viste":"#mezzi-viste", visteDef:MEZZI_VISTE, vista:filtro, conta:conta,
      azioneVista:attrezzo?"attrezzo-filtro":"mezzo-filtro",
      vuoto:tabVuoto(
        tutti.length?(attrezzo?(STRU?"Nessuno strumento con questo filtro":"Nessuna attrezzatura con questo filtro"):"Nessun mezzo con questo filtro")
                    :(attrezzo?(STRU?"Gli strumenti dello studio":"Le attrezzature"):"I mezzi"),
        tutti.length?"Prova a cambiare filtro qui sopra."
          :(attrezzo
            ? (STRU
               ? "Stazione totale, distanziometro laser, termocamera, livello. Con le date delle tarature: il Riepilogo ti avvisa prima che scadano."
               : "Ponteggi, betoniere, trabattelli, trapani. Con le date delle verifiche periodiche: il Riepilogo ti avvisa prima che scadano.")
            : "Furgoni, escavatori, auto. Con le date di revisione, assicurazione e bollo, e i rifornimenti: il Riepilogo ti avvisa prima che scadano."),
        attrezzo
          ? _SVGV+'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
          : _SVGV+'<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
        tutti.length?null:{t:attrezzo?(STRU?"+ Aggiungi il primo strumento":"+ Aggiungi la prima attrezzatura"):"+ Aggiungi il primo mezzo",
                           a:attrezzo?"new-attrezzatura":"new-mezzo"}),
      colonne:[{lab:attrezzo?(STRU?"Strumento":"Attrezzatura"):"Mezzo",w:"26%"},{lab:"Tipo",w:"16%",cls:"c-chi"},
               {lab:attrezzo?"Matricola":"Targa",w:"16%",cls:"c-chi"},
               {lab:"Stato",w:"20%"},{lab:"Prossima scadenza",w:"22%",cls:"c-cli"}],
      righe:L.map(m=>{
        const st=MEZZO_STATI[m.stato]||MEZZO_STATI.disponibile;
        return {
          id:m.id,
          click:{action:"edit-mezzo",data:{id:m.id}},
          celle:[
            `<span class="c-nome">${esc(m.nome||"—")}</span>`,
            esc(m.tipo||"—"),
            esc(m.targa||"—"),
            `<span class="stato" style="background:${st.bg};color:${st.fg}">${st.lab}</span>`,
            cellaScadenza(scadMap[m.id])
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
  const MEZZI_VISTE=[{k:"tutti",lab:"Tutti"},{k:"manutenzione",lab:"In manutenzione"}];
  /* colonna "Prossima scadenza": il tipo sopra, il quando sotto.
     Rosso se è già passata, ambra se casca entro 30 giorni: prima il rosso
     scattava solo col conteggio delle scadute e l'ambra a 7 giorni. */
  function cellaScadenza(sc){
    if(!sc||!sc.prossima_data){
      if(sc&&sc.scadute>0)return `<span class="cli-nome q-passato">${sc.scadute} ${sc.scadute===1?"scaduta":"scadute"}</span>`;
      return `<span class="cli-nome vuoto">—</span>`;
    }
    const g=_giorniA(sc.prossima_data), q=quando(sc.prossima_data);
    const cls=g<0?"q-passato":(g<=30?"q-attesa":"q-futuro");
    const eti=sc.prossimo_tipo||sc.prossimo_titolo||"Scadenza";
    return `<span class="cli-nome">${esc(eti)}</span><span class="cli-dove ${cls}">${q.testo}</span>`;
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
    if(sc&&sc.scadute>0){
      tono="t-err";
      scTesto=`<span style="color:var(--err);font-weight:700">⚠ ${sc.scadute} ${sc.scadute===1?"scadenza scaduta":"scadenze scadute"}</span>`;
    }else if(sc&&sc.prossima_data){
      const g=_giorniA(sc.prossima_data);
      const eti=sc.prossimo_tipo||sc.prossimo_titolo||"Scadenza";
      const quando=g===0?"oggi":(g===1?"tra 1 giorno":"tra "+g+" giorni");
      if(g<=7)tono="t-attesa";
      scTesto=`<span style="color:${g<=7?"var(--attesa)":"var(--muted)"};font-weight:${g<=7?"700":"400"}">📅 ${esc(eti)} ${quando}</span>`;
    }else{ tono="t-neutro"; }
    const cb=carbMap[m.id];
    const carbTesto=cb&&(+cb.spesa_totale)>0
      ? "⛽ "+eur2(cb.spesa_totale)+(cb.km_litro?" · "+String(cb.km_litro).replace(".",",")+" km/l":"")
      : "";
    return schedaJob({
      tono, titolo:esc(m.nome),
      destra:`<span class="stato" style="background:${st.bg};color:${st.fg}">${st.lab}</span>`,
      meta:[cat, m.targa?"🔖 "+esc(m.targa):"", carbTesto, scTesto],
      nota:m.note?"📝 "+esc(m.note):"",
      azioni:[
        {lab:"⛽ Rifornimenti",action:"mezzo-rifornimenti",data:{id:m.id}},
        {lab:"＋ Scadenza",action:"mezzo-scad",data:{id:m.id}},
        {lab:"✏ Modifica",action:"edit-mezzo",data:{id:m.id}},
        {lab:"🗑 Elimina",action:"del-mezzo",data:{id:m.id},del:true}
      ]});
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
        </div><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">${STRU?"La taratura":"Dove sta di casa"}</div>
        ${STRU
          ? `<input type="hidden" id="m-cat" value="${esc(cat)}">
             <p class="sh-nota" style="margin-top:0">La <b>taratura</b> e le verifiche periodiche si aggiungono dopo, dal pulsante <b>＋ Scadenza</b> sulla scheda dello strumento: il Riepilogo ti avvisa prima che scadano, e una misura presa con uno strumento fuori taratura non vale.</p>`
          : `<label style="display:flex;align-items:flex-start;gap:10px;font-size:1rem;margin:2px 0 12px;cursor:pointer">
          <input type="checkbox" id="m-attrezzo" ${attrezzo?"checked":""} style="width:20px;height:20px;flex-shrink:0;margin-top:2px">
          <span>È un'attrezzatura (non si guida) — sta fra le Attrezzature invece che fra i Mezzi</span></label>
        <label style="display:flex;align-items:flex-start;gap:10px;font-size:1rem;margin:2px 0 12px;cursor:pointer">
          <input type="checkbox" id="m-nolo" ${m.noleggiabile?"checked":""} style="width:20px;height:20px;flex-shrink:0;margin-top:2px">
          <span>Lo noleggio anche a terzi — compare nel listino del <b>Noleggio</b>, dove gli metti le tariffe</span></label>`}
        </div>
        ${STRU?"":`<div class="sh-b">
        <div class="sh-tit">Le scadenze</div>
        <p class="sh-nota" style="margin-top:0">Si scrivono qui <b>una volta sola</b>: le vede anche il Noleggio, e con l'assicurazione scaduta il mezzo non si può dare a nessuno. Le altre scadenze (bollo, tagliando, quello che vuoi) si aggiungono dal pulsante <b>＋ Scadenza</b> sulla scheda.</p>
        <div class="row2">
          <div class="field"><label>Assicurazione, scade il</label><input type="date" id="m-assic" value="${esc(m.assicurazione_scad||"")}"></div>
          <div class="field"><label>Revisione, scade il</label><input type="date" id="m-revis" value="${esc(m.revisione_scad||"")}"></div></div>
        <div class="row2">
          <div class="field"><label>Collaudo, scade il</label><input type="date" id="m-collaudo" value="${esc(m.collaudo_scad||"")}"></div>
          <div class="field"><label>Ultima verifica periodica</label><input type="date" id="m-vdata" value="${esc(m.verifica_ultima||"")}"></div></div>
        <div class="field"><label>La verifica si ripete ogni quanti mesi</label><input type="number" id="m-vmesi" min="0" max="120" value="${m.verifica_mesi==null?"":esc(m.verifica_mesi)}" placeholder="0 = non è soggetto"></div>
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
  }
  async function saveMezzo(id){
    const nome=$("#m-nome").value.trim();if(!nome){toast("Scrivi il nome del mezzo");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
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
    let {data,error}=await _scrivi({..._base,..._extra});
    /* se sql/mezzi-una-lista-sola.sql non e' ancora passato, quelle colonne
       non ci sono: il mezzo si salva lo stesso, e si dice cosa manca */
    if(error&&/column|schema cache/i.test(error.message||"")
            &&/noleggiabile|assicurazione_scad|revisione_scad|collaudo_scad|verifica_/i.test(error.message||"")){
      ({data,error}=await _scrivi(_base));
      if(!error)toast("Salvato, ma le scadenze no: manca sql/mezzi-una-lista-sola.sql");
    }
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata");return;}
    closeSheet();renderMezzi();renderAttrezzature();
    const _pro=(ruoloUtente==='professionista');
    toast(id?"Aggiornato":(categoria==="attrezzatura"?(_pro?"Strumento aggiunto ✔":"Attrezzatura aggiunta ✔"):"Mezzo aggiunto ✔"));
  }
