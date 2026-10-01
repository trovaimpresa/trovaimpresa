// [SPOSTATO] gest-scadenze-pratiche.js: era dentro gest-core.js, righe 6042-6983, spostato identico.
  /* ===== 12 agosto 2026 — LE SCADENZE CHE SI RIPETONO =====
     Segnavi "fatta" la revisione, il DURC, l'assicurazione, la taratura, la
     visita medica... e non ti avvisava MAI PIU'. In tutto il gestionale non
     esisteva il concetto di ricorrenza: ogni scadenza era una volta sola, e
     lo Scadenzario diventava un elenco di cose gia' andate.
     Adesso una scadenza puo' dire "mi ripeto ogni N mesi": quando la segni
     fatta, quella dopo nasce da sola con la data giusta.

     _mesiDopo tiene conto della fine mese: 31 gennaio + 1 mese non e' il
     31 febbraio (che non esiste), e' il 28 — o il 29 negli anni bisestili. */
  function _mesiDopo(ds,n){
    const[y,m,d]=String(ds).split("-").map(Number);
    if(!y||!m||!d)return ds;
    const primo=new Date(y,m-1+(+n||0),1);
    const ultimoDelMese=new Date(primo.getFullYear(),primo.getMonth()+1,0).getDate();
    const dt=new Date(primo.getFullYear(),primo.getMonth(),Math.min(d,ultimoDelMese));
    const mm=String(dt.getMonth()+1).padStart(2,"0"),dd=String(dt.getDate()).padStart(2,"0");
    return dt.getFullYear()+"-"+mm+"-"+dd;
  }
  const SCAD_RIPETI=[[0,"Non si ripete"],[3,"Ogni 3 mesi"],[6,"Ogni 6 mesi"],[12,"Ogni anno"],
                     [24,"Ogni 2 anni"],[36,"Ogni 3 anni"],[60,"Ogni 5 anni"]];
  function _giorniDopo(ds,n){const[y,m,d]=ds.split("-").map(Number);const dt=new Date(y,m-1,d+n);const mm=String(dt.getMonth()+1).padStart(2,"0"),dd=String(dt.getDate()).padStart(2,"0");return dt.getFullYear()+"-"+mm+"-"+dd;}
  /* ============================================================
     SCADENZE DELLE PERSONE — non sono righe di gest_scadenze.
     Si leggono dalle date della scheda persona (gest_operatori) e compaiono
     in sola lettura: si risolvono aggiornando la data nella scheda, cosi' il
     dato resta in un posto solo e non si creano doppioni da tenere allineati.

     12 agosto 2026 — questo pezzo stava DENTRO renderScadenze, e quindi lo
     vedeva solo chi apriva lo Scadenzario. Il Riepilogo non ne sapeva niente:
     visita medica scaduta, formazione sicurezza scaduta, permesso di soggiorno
     scaduto — per un'impresa edile sono le scadenze che portano le sanzioni —
     e in prima pagina non compariva NIENTE. Lo Scadenzario intanto promette,
     testuale: "Quelle gia' passate finiscono in cima al Riepilogo, cosi' le
     vedi appena apri". Adesso e' una funzione sola e la chiamano tutti e due.
     ============================================================ */
  const SCAD_PERSONA=[["visita_medica_scadenza","Visita medica","Sicurezza"],
                      ["formazione_scadenza","Formazione sicurezza","Sicurezza"],
                      ["documento_scadenza","Documento d'identita'","Documento"],
                      ["permesso_scadenza","Permesso di soggiorno","Documento"]];
  async function scadenzePersone(mid){
    if(!sb||!sbUid)return [];
    try{
      const {data:ops}=await sb.from("gest_operatori")
        .select("id,nome,visita_medica_scadenza,formazione_scadenza,documento_scadenza,permesso_scadenza")
        .eq("user_id",sbUid).eq("mestiere_id",mid||curMestiere());
      const out=[];
      (ops||[]).forEach(function(o){
        SCAD_PERSONA.forEach(function(t){
          if(!o[t[0]])return;
          out.push({id:"op:"+o.id+":"+t[0],_persona:true,_opId:o.id,_nome:o.nome||"Persona",
            titolo:t[1],tipo_pratica:t[2],data_scadenza:o[t[0]],stato:"aperta"});
        });
      });
      return out;
    }catch(_){ return []; }
  }
  async function renderScadenze(){
    const box=$("#scad-list");if(!box)return;
    if(!cur){box.innerHTML="";return;}
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">📅</div><p>Nessuna scadenza</p><small>Accedi per gestire lo scadenzario</small></div>`;return;}
    const mid=curMestiere();
    const [{data:sc},{data:cl},{data:mz},{data:lvNomi}]=await Promise.all([
      /* "*" invece dell'elenco fisso: se sql/gest-scadenze-pratiche.sql non è ancora
         stato eseguito, le colonne nuove semplicemente non arrivano e la sezione
         non si rompe (stessa scelta già fatta per le pratiche). */
      sb.from("gest_scadenze").select("*").eq("user_id",sbUid).eq("mestiere_id",mid).order("data_scadenza",{ascending:true}),
      sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(mid)),
      sb.from("gest_mezzi").select("id,nome").eq("user_id",sbUid).or(_cliOr(mid)),
      /* i nomi delle pratiche si leggono qui e non da lavCache: lavCache è piena
         solo se l'utente ha già aperto la sezione Pratiche, altrimenti ogni
         scadenza collegata sembrerebbe (ruoloUtente==='professionista'?"(pratica eliminata)":"(lavoro eliminato)") pur esistendo. */
      sb.from("gest_lavori").select("id,descrizione").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);
    scadCache=sc||[];
    const cliMap=Object.fromEntries((cl||[]).map(c=>[c.id,c.nome]));
    const mezMap=Object.fromEntries((mz||[]).map(m=>[m.id,m.nome]));
    const lavMap=Object.fromEntries((lvNomi||[]).map(l=>[l.id,l.descrizione||"Senza nome"]));
    const oggi=todayStr(),lim=_giorniDopo(oggi,7);

    const scadPersone=await scadenzePersone(mid);
    const scadTutte=scadCache.concat(scadPersone).sort(function(a,b){
      return String(a.data_scadenza||"9999-99-99").localeCompare(String(b.data_scadenza||"9999-99-99"));
    });
    const filtra=(A,v)=>v==="scadute"?A.filter(s=>s.stato!=="fatta"&&s.data_scadenza&&s.data_scadenza<oggi)
                      :v==="prossime"?A.filter(s=>s.stato!=="fatta"&&(!s.data_scadenza||s.data_scadenza>=oggi))
                      :v==="fatte"?A.filter(s=>s.stato==="fatta"):A.slice();
    const conta={};SCAD_VISTE.forEach(v=>conta[v.k]=filtra(scadTutte,v.k).length);
    const L=filtra(scadTutte,scadVista);
    renderTabella({
      id:"scad", box:"#scad-list",
      viste:"#scad-viste", visteDef:SCAD_VISTE, vista:scadVista, conta:conta, azioneVista:"scad-vista",
      vuoto:tabVuoto("Le scadenze da non dimenticare",
        "DURC, assicurazioni, revisioni dei mezzi, pratiche. Quelle gi\u00e0 passate finiscono in cima al Riepilogo, cos\u00ec le vedi appena apri.",
        _SVGV+'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
        {t:"+ Aggiungi la prima scadenza",a:"new-scad"}),
      colonne:[{lab:"Scadenza",w:"32%"},{lab:"Tipo",w:"18%",cls:"c-chi"},
               {lab:"Riferimento",w:"24%",cls:"c-cli"},{lab:"Quando",w:"26%"}],
      righe:L.map(s=>{
        const fatta=s.stato==="fatta";
        const q=quando(s.data_scadenza,{neutro:fatta});
        const rif=s._persona?s._nome
                 :s.lavoro_id?(lavMap[s.lavoro_id]||(ruoloUtente==='professionista'?"(pratica eliminata)":"(lavoro eliminato)"))
                 :s.cliente_id?(cliMap[s.cliente_id]||"(cliente eliminato)")
                 :s.mezzo_id?(mezMap[s.mezzo_id]||"(mezzo eliminato)"):"";
        if(s._persona){
          return {
            id:s.id,
            click:{action:"scad-persona",data:{id:s._opId}},
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"Aperta")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
              esc(s.tipo_pratica||"—"),
              `👷 ${esc(rif)}`,
              {h:q.testo,cls:q.classe}
            ],
            menu:[{lab:"👷 Apri la scheda della persona",action:"scad-persona",data:{id:s._opId}}]
          };
        }
        return {
          id:s.id,
          click:{action:"edit-scad",data:{id:s.id}},
          celle:[
            `<span class="lav-bar ${fatta?"fatto":(s.data_scadenza&&s.data_scadenza<oggi?"ritardo":(s.data_scadenza&&s.data_scadenza<=lim?"da_fare":"in_corso"))}" title="${fatta?"Fatta":(s.data_scadenza&&s.data_scadenza<oggi?"Scaduta":(s.data_scadenza&&s.data_scadenza<=lim?"In scadenza":"Aperta"))}"></span><span class="c-nome">${esc(s.titolo||"Scadenza")}</span>`,
            esc(s.tipo_pratica||"—"),
            rif?esc(rif):`<span class="cli-nome vuoto">—</span>`,
            {h:q.testo,cls:q.classe}
          ],
          menu:[
            fatta?{lab:"↩ Riapri",action:"scad-stato",data:{id:s.id,v:"aperta"}}
                 :{lab:"✔ Segna fatta",action:"scad-stato",data:{id:s.id,v:"fatta"}},
            {sep:true},
            {lab:"✏ Modifica",action:"edit-scad",data:{id:s.id}},
            {lab:"🗑 Elimina",action:"del-scad",data:{id:s.id},del:true}
          ]
        };
      }),
      cards:()=>L.map(s=>scadCard(s,cliMap,oggi,lim,mezMap,lavMap)).join("")
    });
  }
  const SCAD_VISTE=[{k:"tutte",lab:"Tutte"},{k:"scadute",lab:"Scadute",err:true},{k:"prossime",lab:"Prossime"},{k:"fatte",lab:"Fatte"}];
  let scadVista="tutte";
  function scadCard(s,cliMap,oggi,lim,mezMap,lavMap){
    if(s._persona){
      let bgP="var(--sfondo)",fgP="var(--testo-2)",labP="Aperta",tonoP="t-neutro";
      if(s.data_scadenza<oggi){bgP="var(--err-bg)";fgP="var(--err)";labP="Scaduta";tonoP="t-err";}
      else if(s.data_scadenza<=lim){bgP="var(--attesa-bg)";fgP="var(--attesa)";labP="In scadenza";tonoP="t-attesa";}
      return schedaJob({
        tono:tonoP, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgP};color:${fgP}">${labP}</span>`,
        meta:["👷 "+esc(s._nome), "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri la scheda",action:"scad-persona",data:{id:s._opId}}]
      });
    }
    const fatta=s.stato==="fatta";
    const cliNome=s.cliente_id?(cliMap[s.cliente_id]||"(cliente eliminato)"):"";
    const mezNome=s.mezzo_id?((mezMap||{})[s.mezzo_id]||"(mezzo eliminato)"):"";
    const lavNome=s.lavoro_id?((lavMap||{})[s.lavoro_id]||(ruoloUtente==='professionista'?"(pratica eliminata)":"(lavoro eliminato)")):"";
    /* dipCache tiene solo chi c'e' adesso in squadra: se il nome non si trova,
       quella persona e' stata tolta. Si dice, invece di lasciare il vuoto. */
    const opeNome=s.operatore_id?(((dipCache||[]).find(o=>String(o.id)===String(s.operatore_id))||{}).nome||"(persona non più in squadra)"):"";
    let bg="var(--sfondo)",fg="var(--testo-2)",lab="Aperta",tono="t-neutro";
    if(fatta){bg="var(--ok-bg)";fg="var(--ok)";lab="Fatta";tono="t-ok";}
    else if(s.data_scadenza&&s.data_scadenza<oggi){bg="var(--err-bg)";fg="var(--err)";lab="Scaduta";tono="t-err";}
    else if(s.data_scadenza&&s.data_scadenza<=lim){bg="var(--attesa-bg)";fg="var(--attesa)";lab="In scadenza";tono="t-attesa";}
    return schedaJob({
      tono, titolo:esc(s.titolo||"Scadenza"),
      destra:`<span class="stato" style="background:${bg};color:${fg}">${lab}</span>`,
      meta:[s.tipo_pratica?"📄 "+esc(s.tipo_pratica):"",
            lavNome?"📁 "+esc(lavNome):"",
            cliNome?"👤 "+esc(cliNome):"",
            mezNome?"🚚 "+esc(mezNome):"",
            opeNome?"👷 "+esc(opeNome):"",
            "📅 "+fdate(s.data_scadenza),
            ((+s.ripeti_mesi||0)?"🔁 "+((SCAD_RIPETI.find(r=>r[0]===+s.ripeti_mesi)||[0,""])[1]||"").toLowerCase():""),
            (s.avvisa===false?"🔕 nessuna email":"")],
      nota:s.note?"📝 "+esc(s.note):"",
      azioni:[
        fatta?{lab:"↩ Riapri",action:"scad-stato",data:{id:s.id,v:"aperta"}}
             :{lab:"✔ Segna fatta",action:"scad-stato",data:{id:s.id,v:"fatta"}},
        {lab:"✏ Modifica",action:"edit-scad",data:{id:s.id}},
        {lab:"🗑 Elimina",action:"del-scad",data:{id:s.id},del:true}
      ]});
  }
  /* preset: valori precompilati per una NUOVA scadenza (es. mezzo_id dal pulsante "+ Scadenza" della card mezzo) */
  async function scadForm(s,preset){
    const isNew=!s;s=s||preset||{};
    const mid=curMestiere();
    let cl=[],mz=[];
    if(sb&&sbUid){
      const [{data:dc},{data:dm}]=await Promise.all([
        sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(mid)).order("nome"),
        sb.from("gest_mezzi").select("id,nome,targa").eq("user_id",sbUid).or(_cliOr(mid)).order("nome")
      ]);
      cl=dc||[];mz=dm||[];
    }
    const pro=ruoloUtente==='professionista';
    const PAROLA=pro?"pratica":"lavoro";
    /* elenco pratiche/lavori del reparto: la scadenza si attacca a quella giusta.
       Le più recenti in cima, massimo 100: oltre non serve e la tendina resta corta. */
    let lv=[];
    if(sb&&sbUid){
      const {data:dl}=await sb.from("gest_lavori").select("id,descrizione,dove,data_prevista")
        .eq("user_id",sbUid).eq("mestiere_id",mid).order("data_prevista",{ascending:false}).limit(100);
      lv=dl||[];
    }
    const tipoOpts=tipiScadenza().map(tp=>`<option value="${esc(tp)}" ${tp===s.tipo_pratica?"selected":""}>${esc(tp)}</option>`).join("");
    const cliOpts=cl.map(c=>`<option value="${c.id}" ${c.id===s.cliente_id?"selected":""}>${esc(c.nome)}</option>`).join("");
    const opeOpts=(dipCache||[]).map(o=>`<option value="${o.id}" ${String(o.id)===String(s.operatore_id||"")?"selected":""}>${esc(o.nome)}</option>`).join("");
    const mezOpts=mz.map(m=>`<option value="${m.id}" ${m.id===s.mezzo_id?"selected":""}>${esc(m.nome)}${m.targa?" ("+esc(m.targa)+")":""}</option>`).join("");
    const lavOpts=lv.map(l=>`<option value="${l.id}" ${String(l.id)===String(s.lavoro_id||"")?"selected":""}>${esc(l.descrizione||("Senza nome"))}${l.dove?" — "+esc(l.dove):""}</option>`).join("");
    const avvisaOn=s.avvisa!==false;
    openSheetGrande(isNew?("Nuova scadenza"):("Modifica scadenza"),
      '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Che cosa scade</div>'
      +`<div class="field"><label>Titolo</label><input id="s-tit" value="${esc(s.titolo||"")}" placeholder="${pro?"Es. Fine lavori CILA Via Roma":"Es. Revisione furgone"}"></div>`
      +`<div class="field"><label>Tipo</label><select id="s-tipo">${tipoOpts}</select></div>`
      +`<div class="field"><label>Data scadenza</label><input type="date" id="s-data" value="${s.data_scadenza||""}"></div>`
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Promemoria via email</div>'
      +`<label style="display:flex;align-items:center;gap:10px;font-size:1rem;margin:2px 0 10px;cursor:pointer"><input type="checkbox" id="s-avvisa" ${avvisaOn?"checked":""} style="width:20px;height:20px"><span>Avvisami per email</span></label>`
      +`<div class="field"><label>Si ripete</label><select id="s-ripeti">`
      +  SCAD_RIPETI.map(r=>'<option value="'+r[0]+'"'+((+s.ripeti_mesi||0)===r[0]?' selected':'')+'>'+r[1]+'</option>').join("")
      +`</select><div class="sh-nota">Revisione, DURC, assicurazione, taratura, visita medica: quando la segni fatta, quella dell'anno dopo nasce da sola. Prima dovevi ricordartene tu.</div></div>`
      +'<p class="sh-nota">Ti arriva una email 30 giorni prima, 7 giorni prima e il giorno prima, all\'indirizzo con cui entri qui. Una sola email al giorno con tutte le scadenze vicine, non una per ognuna.</p>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +`<div class="sh-tit">A che cosa si riferisce</div>`
      +`<p class="sh-nota" style="margin-top:0">Collegala ${pro?"alla pratica":"al lavoro"}: la ritrovi dentro la sua scheda e capisci al volo di chi \u00e8.</p>`
      +`<div class="field"><label>${pro?"Pratica":"Lavoro"} (facoltativo)</label><select id="s-lav"><option value="">— ${pro?"nessuna":"nessuno"} —</option>${lavOpts}</select></div>`
      +`<div class="field"><label>Cliente (facoltativo)</label><select id="s-cli"><option value="">— nessuno —</option>${cliOpts}</select></div>`
      +`<div class="field"><label>${pro?"Strumento":"Mezzo / attrezzatura"} (facoltativo)</label><select id="s-mezzo"><option value="">— nessuno —</option>${mezOpts}</select></div>`
      /* 15 agosto 2026 — la persona. I nomi arrivano da dipCache, la squadra
         gia' letta: nessuna domanda in piu' al database. */
      +`<div class="field"><label>Persona (facoltativo)</label><select id="s-ope"><option value="">— nessuna —</option>${opeOpts}</select><div class="campo-aiuto">Per le cose che scadono addosso a una persona: patentino del muletto, piattaforma aerea, primo soccorso.</div></div>`
      +'</div>'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Note</div>'
      +`<div class="field"><textarea id="s-note" placeholder="Numero di protocollo, ufficio, riferimenti...">${esc(s.note||"")}</textarea></div>`
      +'</div>'
      +'</div></div>',
      ctrTastoHTML('scadenza')
      +'<button class="btn b-cancel" data-action="close">Annulla</button>'
      +`<button class="btn-primary b-save" data-action="save-scad" data-id="${s.id||""}">${isNew?"Crea":"Salva"}</button>`);
    ctrAscolta('scadenza');
  }
  async function saveScad(id){
    const titolo=$("#s-tit").value.trim();if(!titolo){toast("Scrivi il titolo");return;}
    const data_scadenza=$("#s-data").value;if(!data_scadenza){toast("Inserisci la data di scadenza");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const tipo_pratica=$("#s-tipo")?$("#s-tipo").value:"";
    const cliente_id=($("#s-cli")&&$("#s-cli").value)?$("#s-cli").value:null;
    const mezzo_id=($("#s-mezzo")&&$("#s-mezzo").value)?$("#s-mezzo").value:null;
    const lavoro_id=($("#s-lav")&&$("#s-lav").value)?$("#s-lav").value:null;
    const operatore_id=($("#s-ope")&&$("#s-ope").value)?$("#s-ope").value:null;
    const avvisa=$("#s-avvisa")?!!$("#s-avvisa").checked:true;
    const note=$("#s-note").value.trim();
    const ripeti_mesi=$("#s-ripeti")?(+$("#s-ripeti").value||0):0;
    const row={titolo,tipo_pratica,cliente_id,mezzo_id,lavoro_id,operatore_id,data_scadenza,note,avvisa,ripeti_mesi};
    /* Se sql/gest-scadenze-pratiche.sql non è ancora stato eseguito, le colonne
       nuove non esistono: invece di far fallire tutto il salvataggio le tolgo una
       alla volta e riprovo (stessa scelta già fatta nei Dati azienda). */
    /* ripeti_mesi si toglie come le altre se la colonna non c'e' ancora:
       chi non ha eseguito sql/gest-scadenze-ripeti.sql continua a salvare */
    const OPZ=["lavoro_id","avvisa","ripeti_mesi","operatore_id"];
    const tolte=[];
    async function prova(){
      return id
        ? await sb.from("gest_scadenze").update(row).eq("id",id).eq("user_id",sbUid).select("id")
        : await sb.from("gest_scadenze").insert(Object.assign({},row,{user_id:sbUid,mestiere_id:curMestiere(),stato:"aperta"})).select("id");
    }
    let {data,error}=await prova();
    while(error){
      const c=OPZ.find(x=>!tolte.includes(x)&&(error.message||"").indexOf(x)>=0);
      if(!c)break;
      delete row[c];tolte.push(c);
      ({data,error}=await prova());
    }
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata");return;}
    closeSheet();renderScadenze();renderMezzi();
    /* 12 agosto 2026 (sera) — da stamattina le scadenze si vedono sul calendario
       e nel Riepilogo, ma nessuno diceva a quelle due schermate di ridisegnarsi:
       creavi una scadenza, andavi sul calendario e non c'era. */
    rinfresca("calendario","riepilogo");
    if(tolte.indexOf("ripeti_mesi")>=0&&tolte.length===1){toast("Salvata, ma per farla ripetere serve l'aggiornamento del database (sql/gest-scadenze-ripeti.sql).");}
    else if(tolte.length){toast("Salvata, ma il collegamento alla pratica richiede l'aggiornamento del database (sql/gest-scadenze-pratiche.sql).");}
    else toast(id?"Aggiornato":"Scadenza aggiunta ✔");
  }

  /* FORM LAVORO (nessun campo "servizio": il reparto è già il pannello) */
  /* ===== 6 agosto 2026 — Dati della pratica (solo studi professionali) =====
     Per un'impresa un lavoro è cosa/dove/quando. Per un geometra la pratica ha
     anche il tipo, il Comune, il protocollo e i dati catastali.
     Il blocco compare SOLO se ruoloUtente === 'professionista': per tutti gli
     altri la funzione restituisce stringa vuota e il form resta identico a prima.
     Colonne DB: sql/gest-pratiche-professionisti.sql */
  const PRATICA_TIPI=["","CILA","CILAS","SCIA","SCIA alternativa al PdC","Permesso di Costruire","Autorizzazione paesaggistica","Agibilita'","Sanatoria","Accatastamento","Voltura","Altro"];
  const PRATICA_STATI=[["da_preparare","Da preparare"],["depositata","Depositata"],["istruttoria","In istruttoria"],["integrazioni","Integrazioni richieste"],["approvata","Approvata"],["archiviata","Archiviata"]];
  /* dentroBox=true: il riquadro che lo contiene ha già il suo titolo, quindi
     qui si salta l'intestazione interna (evita due titoli uno sull'altro). */
  function bloccoPratica(job,dentroBox){
    if(ruoloUtente!=='professionista')return "";
    job=job||{};
    const tipi=PRATICA_TIPI.map(t=>`<option value="${esc(t)}" ${t===(job.pratica_tipo||"")?"selected":""}>${t||"— scegli —"}</option>`).join("");
    const stati=PRATICA_STATI.map(s=>`<option value="${s[0]}" ${s[0]===(job.pratica_stato||"da_preparare")?"selected":""}>${s[1]}</option>`).join("");
    return `
      ${dentroBox?"":`<div class="field" style="border-top:1px solid var(--linea,#e5e7eb);padding-top:14px;margin-top:4px">
        <label style="font-size:15px;font-weight:800;color:var(--blu,#0066ff)">📄 Dati della pratica</label>
      </div>`}
      <div class="row2">
        <div class="field"><label>Tipo di pratica</label><select id="j-pr-tipo">${tipi}</select></div>
        <div class="field"><label>A che punto sta</label><select id="j-pr-stato">${stati}</select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Comune</label><input id="j-pr-comune" value="${esc(job.pratica_comune||"")}" placeholder="Es. Rieti"></div>
        <div class="field"><label>N. protocollo</label><input id="j-pr-prot" value="${esc(job.pratica_protocollo||"")}" placeholder="Es. 12345/2026"></div>
      </div>
      <div class="field"><label>Data di deposito</label><input type="date" id="j-pr-data" value="${esc(job.pratica_data_dep||"")}"></div>
      <div class="field"><label>Dati catastali</label>
        <div class="row3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <input id="j-cat-fog" value="${esc(job.catasto_foglio||"")}" placeholder="Es. 12">
          <input id="j-cat-par" value="${esc(job.catasto_particella||"")}" placeholder="Es. 345">
          <input id="j-cat-sub" value="${esc(job.catasto_sub||"")}" placeholder="Es. 2">
        </div>
      </div>`;
  }
  /* Legge i campi della pratica dal form. Se non è un professionista
     restituisce un oggetto vuoto, così non finisce niente nel salvataggio. */
  function leggiCampiPratica(){
    if(ruoloUtente!=='professionista')return {};
    const v=id=>{const e=$("#"+id);return e?e.value.trim():"";};
    return {
      pratica_tipo:v("j-pr-tipo")||null,
      pratica_stato:v("j-pr-stato")||null,
      pratica_comune:v("j-pr-comune")||null,
      pratica_protocollo:v("j-pr-prot")||null,
      pratica_data_dep:v("j-pr-data")||null,
      catasto_foglio:v("j-cat-fog")||null,
      catasto_particella:v("j-cat-par")||null,
      catasto_sub:v("j-cat-sub")||null
    };
  }
  /* Le colonne della pratica potrebbero non essere ancora state create su Supabase.
     In quel caso PostgREST risponde 400 e si perderebbe TUTTO il salvataggio:
     qui si riprova senza quei campi, così il lavoro si salva comunque.
     (Stessa lezione della colonna "condivisibile" dei preventivi.) */
  function eColonnaPraticaMancante(err){
    const m=(err&&err.message)||"";
    return /pratica_|catasto_/i.test(m) && /column|schema cache/i.test(m);
  }
  function senzaCampiPratica(obj){
    const o=Object.assign({},obj);
    Object.keys(o).forEach(k=>{ if(/^pratica_|^catasto_/.test(k))delete o[k]; });
    return o;
  }

  function jobForm(job,presetDate,preset,supa,fattura,aiApri){
    const isNew=!job;
    const jid=job?job.id:uid();
    job=job||Object.assign({id:jid,stato:"da_fare",fattStato:"none",dataPrevista:presetDate||""},preset||{});
    editing={id:jid,foto:(job.foto||[]).slice(),supa:!!supa,fattura:!!fattura};
    fotoSupa={};   /* registro delle foto su Supabase: è del lavoro aperto, non va ereditato */
    /* 22 agosto 2026 — stessa ragione: il lavoro a cui si attaccano i
       documenti non si eredita da quello aperto prima. Chi lo apre davvero
       (edit-job) lo rimette subito dopo con renderDocLavoro(). */
    docLavId=null;
    if(supa){
      /* 9 agosto 2026 — finestra GRANDE a due colonne anche qui.
         Prima era la finestrella piccola: con i "Dati della pratica" in fondo
         diventava una colonna lunghissima da scorrere. A sinistra il lavoro,
         a destra i soldi e (per gli studi) il fascicolo della pratica. */
      const pro=ruoloUtente==='professionista';
      openSheetGrande(fattura?"Nuova fattura":(pro?"Nuova pratica":"Nuovo lavoro"),
        '<div class="sh-cols"><div class="sh-col">'
        +'<div class="sh-b">'
        +`<div class="sh-tit">${pro?"La pratica":"Il lavoro"}</div>`
        +(isNew?aiRigaHTML('lavoro'):'')
        +`<div class="field"><label>Cosa c'è da fare</label><textarea id="j-desc" placeholder="${pro?"Es. CILA per rifacimento bagno":"Es. taglio siepe e pulizia aiuole"}">${esc(job.descrizione||"")}</textarea></div>`
        +`<div class="field"><label>Dove</label><input id="j-dove" value="${esc(job.dove||"")}" placeholder="Es. Via Roma 12, scala B, piano 3"></div>`
        +'<div class="row2">'
        +`<div class="field"><label>Data prevista</label><input type="date" id="j-data" value="${job.dataPrevista||todayStr()}"></div>`
        +`<div class="field"><label>${pro?"Collaboratore":"Operaio"}</label><select id="j-operaio"><option value="">— nessuno —</option></select></div></div>`
        +'<div class="field"><label>Cliente</label><select id="j-cliente"><option value="">— nessuno —</option></select></div>'
        +'</div>'
        +'</div><div class="sh-col">'
        +'<div class="sh-b">'
        +`<div class="sh-tit">${pro?"Compenso":"Importo"}</div>`
        +`<div class="field"><label>Importo (€)</label><input type="text" id="j-imp" inputmode="decimal" value="${_numTesto(job.importo)}" placeholder="0" data-euro></div>`
        +`<p class="sh-nota" style="margin-bottom:0">Puoi lasciarlo a zero adesso e metterlo dopo${pro?", quando fai la parcella":""}.</p>`
        +'</div>'
        +(pro?('<div class="sh-b"><div class="sh-tit">\ud83d\udcc4 Dati della pratica</div>'+bloccoPratica(job,true)+'</div>'):'')
        +'</div></div>',
        ctrTastoHTML('lavoro')
        +'<button class="btn b-cancel" data-action="close">Annulla</button>'
        +`<button class="btn-primary b-save" data-action="save-job">${fattura?"Crea fattura":(pro?"Crea pratica":"Crea lavoro")}</button>`);
      fillOperai();fillClienti(job.cliente_id);
      if(isNew)aiRigaVia('lavoro',!!aiApri);
      ctrAscolta('lavoro');
      return;
    }
    const cliOpts=cliCache.map(c=>`<option value="${c.id}" ${c.id===job.clienteId?"selected":""}>${esc(c.nome)}</option>`).join("");
    const dipOpts=dipCache.map(d=>`<option value="${d.id}">${esc(d.nome)}</option>`).join("");
    const dipSel=id=>dipCache.map(d=>`<option value="${d.id}" ${d.id===id?"selected":""}>${esc(d.nome)}</option>`).join("");
    /* Modulo lungo -> modale grande. A sinistra il lavoro in se' (cosa, dove,
       quando, chi, com'e' andata), a destra gli allegati e i soldi. */
    openSheetGrande(isNew?"Nuovo lavoro":"Modifica lavoro",
      `<div class="sh-cols sh-cols--3"><div class="sh-col">
      <div class="sh-b sh-b-a">
      <div class="sh-tit">Il lavoro</div>
      <div class="field"><label>Cliente / Cantiere</label>
        <select id="j-cli"><option value="">— scegli —</option>${cliOpts}</select>
        <button class="btn-ghost quick-add" data-action="quick-cli">+ Aggiungi nuovo cliente</button></div>
      <div class="field"><label>Cosa c'è da fare</label><textarea id="j-desc" placeholder="Es. taglio siepe e pulizia aiuole">${esc(job.descrizione||"")}</textarea></div>
      <div class="field"><label>Dove (vuoto = indirizzo del cliente)</label><input id="j-dove" value="${esc(job.dove||"")}" placeholder="Es. Via Roma 12, scala B, piano 3"></div>
      ${bloccoPratica(job)}
      <div class="row2">
        <div class="field"><label>Data prevista</label><input type="date" id="j-data" value="${job.dataPrevista||""}"></div>
        <div class="field"><label>Chi ci va</label><select id="j-dip"><option value="">— nessuno —</option>${dipSel(job.assegnatoId)}</select></div></div>
      <div class="field"><label>Stato</label><div class="seg" id="j-stato">
        ${["da_fare","in_corso","fatto"].map(s=>`<button data-v="${s}" class="${job.stato===s?"on":""}">${statoLabel[s]}</button>`).join("")}</div></div>
      </div>
      <div class="sh-b sh-b-b">
      <div class="field campo-titolo"><label>Cosa è stato fatto (consuntivo)</label><textarea id="j-svolto" placeholder="Compila quando il lavoro è finito">${esc(job.lavoroSvolto||"")}</textarea></div>
      <div class="field"><label>Note</label><textarea id="j-note" placeholder="Materiali, problemi, da ricordare...">${esc(job.note||"")}</textarea></div>
      </div>
      </div><div class="sh-col">
      <div class="sh-b sh-b-c">
      <div class="field campo-titolo"><label>Foto e video</label>
        <div class="lav-media" id="lav-media">Sto controllando…</div>
      </div>
      </div>
      <!-- ============================================================
           ⛔ 22 agosto 2026 — I DOCUMENTI DEL LAVORO (e della PRATICA)
           ============================================================
           Fino a ieri qui dentro entravano solo immagini e video. Per uno
           studio tecnico quello che ha in mano su una pratica e' tutt'altro:
           visura catastale, planimetria, elaborato, ricevuta di protocollo
           del Comune. Sono PDF, e non avevano un posto: restavano in una
           cartella sul computer, e otto mesi dopo il fascicolo era a meta'.
           ⚠️ Il magazzino c'era gia' (bucket "gestionale-foto", tabella
           "gest_foto") e i PDF li accetta gia': lo fanno la fattura in PDF e
           i documenti dei fornitori. Mancava solo la porta.
           ⚠️ Sta chiuso finche' il lavoro non e' salvato: un documento ha
           bisogno di un "lavoro_id" a cui attaccarsi. Stessa regola delle
           spese e delle ore.
           ⛔ NIENTE APICI ROVESCI IN QUESTO COMMENTO: sta dentro una stringa
           a template di JavaScript, e un apice rovescio la chiude. Il file
           smette di funzionare tutto insieme, in silenzio. -->
      <div class="sh-b">
      <div class="field campo-titolo" id="lav-doc-wrap" style="display:none"><label>📎 Documenti di questo lavoro</label>
        <div class="sh-nota" style="margin-top:0">Visura, planimetria, elaborato, ricevuta di protocollo, capitolato, DURC: qui restano attaccati e non si perdono. PDF o foto, massimo 15 MB per file.</div>
        <div id="lav-doc-lista"></div>
        <button type="button" class="btn quick-add" data-action="lav-doc-scegli">＋ Aggiungi documento</button>
      </div>
      </div>
      ${bloccoScadenzePratica()}
      <div class="sh-b sh-b-d">
      <div class="field campo-titolo" id="spese-wrap" style="display:none"><label>💶 Spese e materiali di questo lavoro</label>
        <div class="spese-list" id="spese-list"></div>
        <div class="spesa-add">
          <input id="sp-desc" placeholder="Es. Cemento, noleggio piattaforma...">
          <input id="sp-imp" type="text" inputmode="decimal" placeholder="€ (es. 12,50)" data-euro>
          <select id="sp-forn" title="Da quale fornitore (facoltativo)"><option value="">— fornitore —</option></select>
          <button type="button" class="btn" data-action="spesa-add">+ Aggiungi</button></div>
        <div class="margine-box" id="margine-box"></div></div>
      <div class="field campo-titolo" id="mezzi-wrap" style="display:none"><label>🚚 Mezzi e attrezzature usati in questo lavoro</label>
        <div class="spese-list" id="lm-list"></div>
        <div class="mezzo-add">
          <select id="lm-sel"></select>
          <button type="button" class="btn" data-action="lm-add">+ Aggiungi</button></div></div>
      <div class="field" id="andamento-wrap" style="display:none"></div>
      <div class="row2">
        <div class="field"><label>Ore lavorate</label><input type="text" id="j-ore" inputmode="decimal" value="${_numTesto(job.ore)}" placeholder="0"></div>
        <div class="field"><label>Importo (€)</label><input type="text" id="j-imp" inputmode="decimal" value="${_numTesto(job.importo)}" placeholder="0" data-euro></div></div>
      <div class="field campo-titolo" id="ore-wrap" style="display:none"><label>⏱ Registro delle ore</label>
        <div class="spese-list" id="ore-list"></div>
        <div class="spesa-add ore-add">
          <input id="or-data" type="date" title="Che giorno">
          <input id="or-ore" type="text" inputmode="decimal" placeholder="Ore (es. 2,5)">
          <select id="or-chi" title="Chi ci ha lavorato (facoltativo)"><option value="">— chi —</option></select>
          <button type="button" class="btn" data-action="ore-add">+ Aggiungi</button></div>
        <input id="or-nota" placeholder="Cosa hai fatto (facoltativo)" style="margin-top:6px;width:100%">
        <div class="margine-box" id="ora-box"></div>
        <!-- 22 agosto 2026 — IL PONTE FRA LE ORE E LA PARCELLA.
             Le ore si segnavano e finivano li': il conto per la parcella si
             rifaceva a mano. Il pulsante compare solo quando delle ore ci
             sono davvero (lo accende renderOreBlock). -->
        <button type="button" class="btn quick-add" id="ore-in-parcella" data-action="ore-parcella" style="display:none;margin-top:10px">💶 Porta le ore nella parcella</button></div>
      <div class="field campo-titolo" id="rap-wrap" style="display:none"><label>Rapportini di giornata</label>
        <div class="spese-list" id="rap-list"></div>
        <div class="campo-aiuto">Li scrive chi sta in cantiere, dal telefono. Con la <b>&times;</b> butti via un rapportino sbagliato: le sue ore vanno nel cestino insieme a lui, e da lì tornano su insieme. Per correggere le ore senza toccare il rapportino usa il registro qui sopra.</div></div>
      <div class="field campo-titolo"><label>Fattura</label>
        <div class="j-fatt-info">${
          (job.fattStato||"none")==="pagata" ? "\u2714 Fatturato e incassato"
          : (job.fattStato||"none")==="emessa" ? "\ud83e\uddfe Fatturato, in attesa di incasso"
          : "Non ancora fatturato"}</div>
        <div class="campo-aiuto">Lo stato lo decide la fattura, non questo modulo: si aggiorna da solo quando emetti o incassi.${
          job.id?' <b>Salva</b>, poi usa il pulsante <b>Crea fattura</b> sulla scheda del lavoro.':''}</div></div>
      </div>
      </div></div>`,
      `${ctrTastoHTML('lavoro')}
       <button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-job">${isNew?"Crea lavoro":"Salva"}</button>`);
    ctrAscolta('lavoro');
    bindSeg("j-stato");
    renderLavMedia();
    renderLavScadenze();
    /* cambiando l'importo cambia quanto rende un'ora: il riquadro si rifa' */
    const _imp=$("#j-imp");
    if(_imp)_imp.addEventListener("input",function(){ if(oreLavoroId)renderOreBlock(oreLavoroId); });
  }
  /* ===== 9 agosto 2026 — La scadenza proposta da sola =====
     Un tecnico che salva una pratica con una data ha appena scritto una cosa
     da non dimenticare. Invece di lasciargliela ricopiare a mano nello
     scadenzario, gliela propongo: decide sempre lui con Si'/No.
     Si propone SOLO se: è un professionista, c'e' una data non passata, e su
     quella pratica non c'e' già una scadenza per quella stessa data (così
     salvando due volte non chiede due volte). */
  /* ===== 10 agosto 2026 — il titolo della scadenza non si ripete =====
     Veniva fuori "CILA — CILA prova": il tipo davanti piu' la descrizione, che
     il tipo ce l'aveva gia' dentro perche' e' la prima cosa che uno scrive.
     Regola: il tipo si mette davanti SOLO se nella descrizione non c'e' gia'.
     Il confronto ignora maiuscole, accenti e punteggiatura, cosi' "Cila prova",
     "C.I.L.A. prova" e "CILA prova" contano tutte come ripetizione. */
  function _senzaAccenti(s){
    return String(s||"").toLowerCase()
      .replace(/[àáâä]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i")
      .replace(/[òóôö]/g,"o").replace(/[ùúûü]/g,"u");
  }
  function _paroleChiave(s){
    return _senzaAccenti(s).replace(/[^a-z0-9]+/g," ").trim();
  }
  function titoloScadenza(tipo,desc,pro){
    tipo=String(tipo||"").trim();
    desc=String(desc||"").trim();
    if(!desc)return tipo||(pro?"Pratica":"Lavoro");
    if(!tipo)return desc;
    const t=_paroleChiave(tipo).replace(/ /g,""), d=_senzaAccenti(desc);
    if(!t)return desc;
    /* Si cerca il tipo dentro la descrizione lettera per lettera, lasciando
       passare punti e spazi in mezzo: cosi' "CILA" trova anche "C.I.L.A." e
       "Permesso di costruire". I due bordi "non lettera" servono a non trovarlo
       dentro un'altra parola: se no "SCIA" si nasconderebbe in "fascia". */
    const sep="[^a-z0-9]*";
    const dentro="(?:^|[^a-z0-9])"+t.split("").join(sep)+"(?:[^a-z0-9]|$)";
    let ripete=false;
    try{ ripete=new RegExp(dentro).test(d); }catch(_){ ripete=(" "+_paroleChiave(desc)+" ").indexOf(" "+_paroleChiave(tipo)+" ")>=0; }
    return ripete ? desc : (tipo+" — "+desc);
  }

  async function proponiScadenzaPratica(lavId,dati){
    try{
      if(!sb||!sbUid||!lavId)return;
      const data=(dati&&dati.data_prevista)||"";
      if(!data||data<todayStr())return;
      const {data:gia,error}=await sb.from("gest_scadenze").select("id,data_scadenza")
        .eq("user_id",sbUid).eq("lavoro_id",lavId);
      if(error)return;                                   /* colonna non ancora creata: zitto */
      if((gia||[]).some(x=>x.data_scadenza===data))return;
      const pro=ruoloUtente==='professionista';
      const tipo=String((dati&&dati.pratica_tipo)||"").trim();
      const desc=String((dati&&dati.descrizione)||"").trim();
      const titolo=titoloScadenza(tipo,desc,pro);
      if(!gconfirm("Vuoi che ti ricordi la data del "+fdate(data)+"?\n\n"
        +"Creo la scadenza \""+titolo+"\" collegata a "+(pro?"questa pratica":"questo lavoro")+" e ti avviso per email 30 giorni prima, 7 giorni prima e il giorno prima."))return;
      const row={user_id:sbUid,mestiere_id:curMestiere(),titolo:titolo.slice(0,120),
        tipo_pratica:pro?"Presentazione pratica":"Consegna lavori",lavoro_id:lavId,
        cliente_id:(dati&&dati.cliente_id)||null,data_scadenza:data,stato:"aperta",avvisa:true};
      let {error:e2}=await sb.from("gest_scadenze").insert(row);
      if(e2&&(e2.message||"").indexOf("avvisa")>=0){    /* database non ancora aggiornato del tutto */
        delete row.avvisa;
        ({error:e2}=await sb.from("gest_scadenze").insert(row));
      }
      if(e2){toast("Scadenza non creata: "+e2.message);return;}
      rinfresca("scadenzario","riepilogo");
      toast("Scadenza creata ✔ Te la ricordo per email");
    }catch(_){}
  }

  /* ===== 9 agosto 2026 — Scadenze dentro la scheda della pratica =====
     Per un tecnico la pratica NON è una riga di lavoro: è un fascicolo con
     delle date che non si possono bucare. Qui, dentro la scheda, si vedono le
     scadenze già collegate e se ne aggiunge una senza uscire e senza dover
     poi ricordarsi di ricollegarla.
     Compare SOLO ai professionisti: per imprese e artigiani la funzione
     restituisce stringa vuota e la finestra resta identica a prima. */
  function bloccoScadenzePratica(){
    /* 9 agosto 2026 — acceso anche per imprese e artigiani: un cantiere ha
       le sue date da non bucare (consegna, SAL, fine lavori, ponteggio)
       esattamente come una pratica. Cambia solo la parola. */
    const pro=ruoloUtente==='professionista';
    return '<div class="sh-b">'
      +'<div class="field campo-titolo"><label>\u23F0 Scadenze di '+(pro?'questa pratica':'questo lavoro')+'</label>'
      +'<div class="lav-media" id="lav-scad">Sto controllando…</div>'
      +'</div></div>';
  }
  async function renderLavScadenze(){
    const box=$("#lav-scad");if(!box)return;
    const lav=editing&&editing.realId;
    const pro=ruoloUtente==='professionista';
    if(!lav){
      box.innerHTML='<div class="lm-vuoto">Salva prima '+(pro?'la pratica':'il lavoro')+': poi qui potrai attaccarci le sue scadenze.</div>';
      return;
    }
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}
    let righe=[];
    try{
      const {data,error}=await sb.from("gest_scadenze").select("*")
        .eq("user_id",sbUid).eq("lavoro_id",lav).order("data_scadenza",{ascending:true});
      /* colonna lavoro_id non ancora creata: lo dico invece di lasciare la rotella */
      if(error){
        box.innerHTML='<div class="lm-vuoto">Per collegare le scadenze serve l\'aggiornamento del database (sql/gest-scadenze-pratiche.sql).</div>';
        return;
      }
      righe=data||[];
    }catch(e){
      box.innerHTML='<div class="lm-vuoto">Non sono riuscito a leggere le scadenze.</div>';
      return;
    }
    const oggi=todayStr();
    const aperte=righe.filter(x=>x.stato!=="fatta");
    const scadute=aperte.filter(x=>x.data_scadenza&&x.data_scadenza<oggi);
    let testa;
    const QUESTO=pro?'questa pratica':'questo lavoro';
    if(!righe.length) testa='Nessuna scadenza su '+QUESTO;
    else if(scadute.length) testa='<b style="color:var(--err)">'+scadute.length+(scadute.length===1?' scadenza passata':' scadenze passate')+'</b> su '+righe.length;
    else testa='<b>'+aperte.length+(aperte.length===1?' scadenza aperta':' scadenze aperte')+'</b> su '+QUESTO;
    const elenco=righe.slice(0,6).map(function(x){
      const q=quando(x.data_scadenza,{neutro:x.stato==="fatta"});
      const fatta=x.stato==="fatta";
      const rit=!fatta&&x.data_scadenza&&x.data_scadenza<oggi;
      return '<div class="lsc-r'+(rit?' rit':'')+(fatta?' fatta':'')+'">'
        +'<div class="lsc-info"><b>'+esc(x.titolo||"Scadenza")+'</b>'
        +(x.tipo_pratica?'<small>'+esc(x.tipo_pratica)+'</small>':'')+'</div>'
        /* ⛔ 21 agosto 2026 — IL COLORE STA SOLO DOVE C'E' ANCHE LA PAROLA.
           La riga diventava rossa e accanto c'era scritto solo «3 giorni
           fa»: chi non distingue il rosso non sapeva che era in ritardo.
           Il colore NON si toglie, si aggiunge la parola — ed e' la stessa
           forma che usano gia' i Fornitori («scaduta 3 giorni fa»). */
        /* ⚠️ la pastiglia era gia' rossa da sola: «quando()» restituisce
           «q-passato» per una data passata che non sia segnata fatta.
           Scriverlo un'altra volta qui era un ramo che non faceva niente —
           l'ha trovato un sabotaggio che nessun banco poteva accusare. */
        +'<span class="lsc-q '+(fatta?'':q.classe)+'">'
        +  (fatta?'fatta':(rit?'scaduta '+q.testo:q.testo))+'</span>'
        +'</div>';
    }).join("");
    box.innerHTML='<div class="lm-conta">'+testa+'</div>'
      +elenco
      +(righe.length>6?'<div class="lm-vuoto">…e altre '+(righe.length-6)+'</div>':'')
      +'<button type="button" class="btn lm-btn" data-action="scad-da-pratica" data-id="'+esc(String(lav))+'">+ Aggiungi una scadenza</button>';
  }

  /* ---- riga "Foto e video" della finestra Lavori ----
     Le foto e i video adesso sono mestiere della Galleria. Qui resta solo il
     conteggio e il collegamento: vedi a colpo d'occhio se il lavoro ha materiale
     e ci arrivi con un clic, senza che questa finestra torni a fare il lavoro
     di un'altra sezione. */
  async function renderLavMedia(){
    const box=$("#lav-media");if(!box)return;
    const lav=editing&&editing.realId;
    if(!lav){
      box.innerHTML='<div class="lm-vuoto">Salva prima il lavoro. Poi le foto e i video li carichi dalla <b>Galleria</b>.</div>';
      return;
    }
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}
    let nF=0,nV=0;
    try{
      const [f,v]=await Promise.all([
        sb.from("gest_foto").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("lavoro_id",lav).not("tipo","in",_nonFotoSql),
        sb.from("gest_video").select("id",{count:"exact",head:true}).eq("user_id",sbUid).eq("lavoro_id",lav)
      ]);
      nF=f.count||0;nV=v.count||0;
    }catch(e){}
    const conta=(nF+nV)
      ? '<b>'+nF+(nF===1?" foto":" foto")+'</b> e <b>'+nV+(nV===1?" video":" video")+'</b> su questo lavoro'
      : 'Nessuna foto e nessun video su questo lavoro';
    box.innerHTML='<div class="lm-conta">'+conta+'</div>'
      +'<button type="button" class="btn lm-btn" data-action="vai-galleria" data-id="'+esc(lav)+'">'
      +  ((nF+nV)?"Guarda in Galleria":"Carica dalla Galleria")+'</button>';
  }

  async function fillOperai(){
    const sel=$("#j-operaio");if(!sel||!sb||!sbUid)return;
    const {data}=await sb.from("gest_operatori").select("id,nome,telefono").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    sel.innerHTML=`<option value="">— nessuno —</option>`+(data||[]).map(o=>`<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join("");
  }
  async function fillClienti(selId){
    const sel=$("#j-cliente");if(!sel||!sb||!sbUid)return;
    const {data}=await sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(curMestiere())).order("nome");
    sel.innerHTML=`<option value="">— nessuno —</option>`+(data||[]).map(c=>`<option value="${esc(c.id)}" ${c.id===selId?"selected":""}>${esc(c.nome)}</option>`).join("");
  }
  function bindSeg(id){$$("#"+id+" button").forEach(b=>b.onclick=()=>{$$("#"+id+" button").forEach(x=>x.classList.remove("on"));b.classList.add("on");});}
  function segVal(id){const e=$("#"+id+" button.on");return e?e.dataset.v:"";}

  async function saveJob(){
    if(editing&&editing.supa){
      if(!sbUid){toast("Devi essere loggato");return;}
      const descrizione=$("#j-desc").value.trim(), data_prevista=$("#j-data").value, operatore_id=$("#j-operaio")?$("#j-operaio").value:"";
      if(!descrizione||!data_prevista){toast("Compila Descrizione e Data");return;}
      const importo=_numIt("#j-imp")||0;
      if(editing.fattura&&!(importo>0)){toast("Inserisci l'importo");return;}
      const cliente_id=($("#j-cliente")&&$("#j-cliente").value)?$("#j-cliente").value:null;
      const obj=Object.assign({user_id:sbUid,mestiere_id:curMestiere(),stato:editing.fattura?"fatto":"da_fare",
        descrizione,dove:$("#j-dove").value.trim(),data_prevista,operatore_id:operatore_id||null,importo,cliente_id},
        leggiCampiPratica());
      /* niente scorciatoia "nasce già fatturato": la fattura si crea dalla sua sezione */
      let {data,error}=await sb.from('gest_lavori').insert(obj).select('id').single();
      let avvisoPratica=false;
      if(error&&eColonnaPraticaMancante(error)){
        const rip=await sb.from('gest_lavori').insert(senzaCampiPratica(obj)).select('id').single();
        data=rip.data;error=rip.error;
        if(!error)avvisoPratica=true;
      }
      if(error){toast("Errore: "+error.message);return;}
      const realId=data.id;
      /* il numero di fattura lo assegna la fattura quando la emetti */
      /* 12 agosto 2026 — mancavano "calendario" e "agenda". Creavi un lavoro
         dal calendario, cliccando il giorno 20: compariva "Lavoro creato ✔" e
         il giorno 20 restava VUOTO, anche uscendo e rientrando, per tutta la
         sessione. Il lavoro c'era (si vedeva in Lavori), ma il calendario non
         veniva mai avvisato di ridisegnarsi. */
      closeSheet();rinfresca("lavori","fatture","riepilogo","calendario","agenda");
      /* un solo messaggio: prima l'avviso "migrazione mancante" veniva coperto
         subito dal toast verde e nessuno lo leggeva */
      toast(avvisoPratica?"Creato, ma i dati della pratica NON sono salvati: manca la migrazione SQL":(editing.fattura?"Fattura creata ✔":"Lavoro creato ✔"));
      if(!editing.fattura)await proponiScadenzaPratica(realId,obj);
      return;
    }
    if(editing && editing.realId){
      const mod=Object.assign({
        descrizione:$("#j-desc").value.trim(),
        dove:$("#j-dove").value.trim(),
        data_prevista:$("#j-data").value||null,
        operatore_id:$("#j-dip").value||null,
        cliente_id:$("#j-cli").value||null,
        stato:segVal("j-stato"),
        importo:_numIt("#j-imp")||0,
        /* fatt_stato non si scrive più da qui: è il riflesso della fattura */
        lavoro_svolto:$("#j-svolto").value.trim()||null,
        note:$("#j-note").value.trim()||null,
        ore:_numIt("#j-ore")
      }, leggiCampiPratica());
      /* 9 agosto 2026 — chiudendo dal modulo (invece che col pulsante "Segna
         fatto" della scheda) la data di chiusura non veniva scritta: il Report
         filtra su data_fatto, quindi quella pratica spariva dal grafico dei 12
         mesi e dall'incassato dell'anno. Riaprendola, la data si toglie. */
      if(mod.stato==="fatto"){
        /* La data vera si chiede al DATABASE, non a lavCache: per le imprese
           lavCache non contiene data_fatto (l'elenco delle colonne non la
           include), quindi la guardia non scattava mai e ogni salvataggio
           sovrascriveva la data di chiusura con quella prevista. Caso vero:
           l'operaio chiude il lavoro oggi dall'app di cantiere, il capo apre
           "Modifica" per scrivere le ore e la data reale spariva. (9/8/2026) */
        let _gia=null;
        try{
          const {data:_p}=await sb.from("gest_lavori").select("data_fatto")
            .eq("id",editing.realId).eq("user_id",sbUid).maybeSingle();
          _gia=_p&&_p.data_fatto;
        }catch(e){}
        if(!_gia)mod.data_fatto=mod.data_prevista||todayStr();
      }else{
        mod.data_fatto=null;
      }
      let {data:okJob,error}=await sb.from('gest_lavori').update(mod).eq('id', editing.realId).eq('user_id',sbUid).select('id');
      let avvisoPratica2=false;
      if(error&&eColonnaPraticaMancante(error)){
        const rip=await sb.from('gest_lavori').update(senzaCampiPratica(mod)).eq('id', editing.realId).eq('user_id',sbUid).select('id');
        okJob=rip.data;error=rip.error;
        if(!error)avvisoPratica2=true;
      }
      if(error){toast("Errore: "+error.message);return;}
      if(!okJob||!okJob.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
      /* segnata emessa o pagata: è questo il momento in cui la fattura prende il numero */
      /* il numero di fattura lo assegna la fattura quando la emetti, non il lavoro */
      /* ===== 13 agosto 2026 — LE FOTO CHE SI PERDEVANO NEL SALVATAGGIO =====
         Questo giro non guardava NIENTE: ne' se il file era davvero salito,
         ne' se la riga era stata scritta. E in fondo metteva comunque
         `f.uploaded=true`. Provato ritagliando questo pezzo e facendolo
         girare (nuove/salvalavoro-foto.js), succedeva questo:

         · caricamento fallito (poco campo in cantiere) -> si scriveva lo
           stesso la riga, che puntava a un file MAI SALITO: nel gestionale
           compariva una foto che non si apre. La foto vera restava solo nel
           telefono e, marcata «gia' caricata», non si riprovava MAI PIU'.
         · riga rifiutata -> il file restava nel deposito senza niente che lo
           nominasse, e anche li' marcata «gia' caricata».
         · in tutti e due i casi, nessun avviso: il messaggio diceva
           «Lavoro aggiornato ✔».

         Adesso: se il file non sale non si scrive la riga; se la riga non si
         scrive si toglie il file; si marca «caricata» SOLO quando sono andate
         bene tutte e due; e alla fine si dice quante sono rimaste indietro,
         perche' quelle si riproveranno al prossimo salvataggio. */
      let fotoKo=0;
      for(const f of (editing.foto||[])){
        if(f.uploaded) continue;
        try{
          let dataURL=fotoCache[f.id]||await window.storage.get("gfoto_"+f.id);
          if(!dataURL)continue;
          const blob=await (await fetch(dataURL)).blob();
          const path=sbUid+"/"+editing.realId+"/"+Date.now()+"_"+f.id+".jpg";
          const {error:up}=await sb.storage.from("gestionale-foto").upload(path,blob);
          if(up){fotoKo++;continue;}
          const tipoMap=f.tipo==="prima"?"da_fare":(f.tipo==="dopo"?"fatto":f.tipo);
          const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,lavoro_id:editing.realId,tipo:tipoMap,operatore:f.operatore||"Capo",storage_path:path});
          if(ins){await _fileOrfano("gestionale-foto",path);fotoKo++;continue;}
          f.uploaded=true;
        }catch(e){fotoKo++;}
      }
      closeSheet();renderAll();
      toast(fotoKo
        ? (fotoKo===1?"Lavoro aggiornato, ma 1 foto non è salita: resta nel telefono e ci riprovo al prossimo salvataggio"
                     :"Lavoro aggiornato, ma "+fotoKo+" foto non sono salite: restano nel telefono e ci riprovo al prossimo salvataggio")
        : (avvisoPratica2?"Aggiornato, ma i dati della pratica NON sono salvati: manca la migrazione SQL":"Lavoro aggiornato ✔"));
      /* NIENTE proposta di scadenza qui: si chiede solo alla CREAZIONE.
         Prima si ripresentava a OGNI modifica, e rispondendo No tornava
         identica al salvataggio dopo, all'infinito. (9/8/2026) */
      return;
    }
    const cli=$("#j-cli").value;if(!cli){toast("Scegli un cliente");return;}
    const id=editing.id, exists=db().lavori.some(l=>l.id===id), prev=db().lavori.find(l=>l.id===id);
    const stato=segVal("j-stato");
    /* lo stato della fattura non si tocca da qui: lo decide la fattura */
    const fattStato=(prev&&prev.fattStato)||"none";
    const obj={id,clienteId:cli,descrizione:$("#j-desc").value.trim(),dove:$("#j-dove").value.trim(),
      dataPrevista:$("#j-data").value,assegnatoId:$("#j-dip").value,stato,lavoroSvolto:$("#j-svolto").value.trim(),
      note:$("#j-note").value.trim(),ore:_numIt("#j-ore"),importo:_numIt("#j-imp"),fattStato,pagato:fattStato==="pagata",
      foto:editing.foto,numFatt:prev?prev.numFatt:undefined};
    obj.dataFatto=stato==="fatto"?(prev&&prev.dataFatto?prev.dataFatto:(obj.dataPrevista||todayStr())):"";
    if(exists)db().lavori=db().lavori.map(l=>l.id===id?obj:l);else db().lavori.push(obj);
    await save();closeSheet();renderAll();toast(exists?"Lavoro aggiornato":"Lavoro creato ✔");
  }

  /* Il cliente adesso finisce dentro una fattura, e la fattura elettronica
     vuole sapere di lui le stesse cose che vuole sapere di te: partita IVA o
     codice fiscale, dove sta di preciso, e dove mandargliela. Stessa finestra
     grande a due colonne dei Dati azienda: a sinistra chi è e dove sta,
     a destra il fisco. Tutti i campi nuovi sono facoltativi. */
  function cliForm(c,tipoNuovo,aiApri){
    const isNew=!c;c=c||{};
    if(isNew&&tipoNuovo)c.tipo=tipoNuovo;
    const priv=ruoloUtente==='professionista';
    /* che tipo di cliente è: privato (il caso più comune), azienda o condominio.
       Cambia solo le parole del modulo, non i campi: così nessuno resta bloccato. */
    const tipoCli=(c.tipo==='azienda'||c.tipo==='condominio')?c.tipo:'privato';
    const LAB_T={privato:{nome:'Nome e cognome',ph:'Es. Mario Rossi',ref:'Referente (se diverso)'},
                 azienda:{nome:'Ragione sociale',ph:'Es. Rossi Costruzioni Srl',ref:'Referente'},
                 condominio:{nome:'Nome condominio',ph:'Es. Condominio Via Roma 12',ref:'Amministratore'}};
    const Lt=LAB_T[tipoCli];
    const T_TIT={privato:"Nuovo cliente privato",azienda:"Nuova azienda",condominio:"Nuovo condominio"};
    openSheetGrande(isNew?(T_TIT[tipoCli]||"Nuovo cliente"):"Modifica cliente",
      `<div class="sh-cols sh-cols--fatt"><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Chi è</div>
        ${isNew?aiRigaHTML('cliente'):''}
        <div class="field"><label>Che tipo di cliente è</label>
          <div class="tipo-cli" id="c-tipo-box" data-tipo="${tipoCli}">
            <button type="button" class="tipo-btn${tipoCli==='privato'?' on':''}" data-t="privato" onclick="setTipoCliente(this)">Privato<small>una persona</small></button>
            <button type="button" class="tipo-btn${tipoCli==='azienda'?' on':''}" data-t="azienda" onclick="setTipoCliente(this)">Azienda<small>ditta o società</small></button>
            <button type="button" class="tipo-btn${tipoCli==='condominio'?' on':''}" data-t="condominio" onclick="setTipoCliente(this)">Condominio<small>con amministratore</small></button>
          </div>
        </div>
        <div class="field"><label id="lab-c-nome">${Lt.nome}</label>
          <input id="c-nome" value="${esc(c.nome||"")}" placeholder="${Lt.ph}"></div>
        <div class="row2">
          <div class="field"><label id="lab-c-ref">${Lt.ref}</label><input id="c-ref" value="${esc(c.referente||"")}" placeholder="Es. Mario Rossi"></div>
          <div class="field"><label>Telefono</label><input id="c-tel" type="tel" value="${esc(c.telefono||"")}" placeholder="Es. 0746 123456"></div>
        </div>
        <div class="field"><label>Email</label>
          <input id="c-email" type="email" value="${esc(c.email||"")}" placeholder="cliente@email.it"></div>
        <div class="sh-nota">Serve per mandargli preventivi e fatture via email. Non &egrave; la PEC: quella si scrive pi&ugrave; in basso.</div>
      </div>

      <div class="sh-b">
        <div class="sh-tit">Dove sta</div>
        <div class="field"><label>Via e numero</label><input id="c-ind" value="${esc(c.indirizzo||"")}" placeholder="Es. Via Roma, 12"></div>
        <div class="row2">
          <div class="field"><label>CAP</label><input id="c-cap" value="${esc(c.cap||"")}" placeholder="Es. 02100" inputmode="numeric"></div>
          <div class="field"><label>Città</label><input id="c-citta" value="${esc(c.citta||"")}" placeholder="Es. Rieti"></div>
        </div>
        <div class="field"><label>Provincia</label>
          <input id="c-prov" value="${esc(c.prov||"")}" placeholder="Es. RI" maxlength="2" style="max-width:120px;text-transform:uppercase"></div>
        <div class="sh-nota">L'indirizzo finisce sul PDF della fattura e serve alla Mappa per calcolare la distanza del cantiere.</div>
      </div>

      </div><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Dati fiscali</div>
        <div class="row2">
          <div class="field"><label>Partita IVA</label><input id="c-piva" value="${esc(c.piva||"")}" placeholder="Se è un'azienda"></div>
          <div class="field"><label>Codice fiscale</label><input id="c-cf" value="${esc(c.cod_fiscale||"")}" placeholder="Se è un privato" style="text-transform:uppercase"></div>
        </div>
        <div class="sh-nota" id="nota-c-fisc">Un condominio ha il codice fiscale, un'azienda la partita IVA, un privato il codice fiscale. Basta quello che ha.</div>
      </div>

      <div class="sh-b">
        <div class="sh-tit">Dove mandargli la fattura</div>
        <div class="field"><label>Codice destinatario</label>
          <input id="c-sdi" value="${esc(c.sdi_codice||"")}" placeholder="7 caratteri" maxlength="7" style="text-transform:uppercase"></div>
        <div class="field"><label>PEC</label><input id="c-pec" type="email" value="${esc(c.sdi_pec||"")}" placeholder="cliente@pec.it"></div>
        <div class="sh-nota">Te li dà il cliente. Uno dei due basta. Se non ha né l'uno né l'altro — capita con i privati — si usa <b>0000000</b> e la fattura gli arriva nel cassetto fiscale. Non servono ancora a niente: li chiederà la fattura elettronica.</div>
      </div>

      </div></div>`,
      `${ctrTastoHTML('cliente')}
       <button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-cli" data-id="${c.id||""}">${isNew?"Crea":"Salva"}</button>`);
    if(isNew)aiRigaVia('cliente',!!aiApri);
    ctrAscolta('cliente');
  }
  /* Clic su Privato / Azienda / Condominio: cambia solo le parole del modulo.
     Nessun campo sparisce, così nessuno resta bloccato se il suo caso è strano. */
  window.setTipoCliente=function(btn){
    const box=btn.closest(".tipo-cli");if(!box)return;
    const t=btn.dataset.t||"privato";
    box.dataset.tipo=t;
    box.querySelectorAll(".tipo-btn").forEach(b=>b.classList.toggle("on",b===btn));
    const L={privato:{nome:"Nome e cognome",ph:"Es. Mario Rossi",ref:"Referente (se diverso)",
                      fisc:"Per un privato serve il codice fiscale. La partita IVA lasciala vuota."},
             azienda:{nome:"Ragione sociale",ph:"Es. Rossi Costruzioni Srl",ref:"Referente",
                      fisc:"Per un'azienda serve la partita IVA."},
             condominio:{nome:"Nome condominio",ph:"Es. Condominio Via Roma 12",ref:"Amministratore",
                      fisc:"Un condominio ha il codice fiscale, non la partita IVA."}}[t];
    const ln=document.getElementById("lab-c-nome"); if(ln) ln.textContent=L.nome;
    const inp=document.getElementById("c-nome");    if(inp) inp.placeholder=L.ph;
    const lr=document.getElementById("lab-c-ref");  if(lr) lr.textContent=L.ref;
    const nf=document.getElementById("nota-c-fisc");if(nf) nf.textContent=L.fisc;
    /* anche il titolo in cima segue il bottone: prima restava quello di partenza
       e leggevi "Nuova azienda" con Privato acceso */
    const ht=document.querySelector("#sheet .sh-head h3");
    if(ht&&/^Nuov/.test(ht.textContent||"")){
      ht.textContent={privato:"Nuovo cliente privato",azienda:"Nuova azienda",condominio:"Nuovo condominio"}[t];
    }
  };


