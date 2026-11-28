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
                      ["documento_scadenza","Documento d'identit\u00e0","Documento"],
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
  /* ============================================================
     21 ott 2026 — LE SCADENZE SCRITTE SULLA SCHEDA DEL MEZZO.
     Assicurazione, revisione, collaudo e verifica periodica si scrivono
     dentro il mezzo (o l'attrezzatura), e nello Scadenzario non comparivano:
     proprio dove uno va a cercarle. Stessa idea delle persone: sola lettura,
     il dato resta in un posto solo, si cambia aprendo il mezzo. Le date sono
     le stesse della vista gest_mezzi_scadenze.
     ============================================================ */
  const SCAD_MEZZO=[["assicurazione_scad","Assicurazione"],["revisione_scad","Revisione"],["collaudo_scad","Collaudo"]];
  /* 20 nov 2026 (voce Strumenti) — icona e parola di una scadenza attaccata a
     un mezzo o a uno strumento (la categoria la legge renderScadenze) */
  function _mzIcona(id){ const c=(window._mezCat||{})[id]; return c==="attrezzatura"?"🔧":"🚚"; }
  function _mzEliminato(){ return ruoloUtente==='professionista'?"(strumento eliminato)":"(mezzo eliminato)"; }
  /* 24 nov 2026 (studio, voce Scadenze e promemoria) — allo studio senza Mezzi
     nel menu uscivano «Revisione · escavatore» e «Assicurazione · escavatore»
     (i mezzi senza reparto dell'impresa). Come la tendina del modulo: allo
     studio coi Mezzi nascosti si vedono solo gli strumenti. La usa anche il
     Calendario (calAltreDate). */
  function _mzSoloStrumenti(){
    try{ return ruoloUtente==='professionista'&&typeof tabNascosto==='function'&&!!tabNascosto("mezzi"); }catch(e){ return false; }
  }
  async function scadenzeMezzi(mid){
    if(!sb||!sbUid)return [];
    try{
      const {data:mz}=await sb.from("gest_mezzi")
        .select("id,nome,tipo,categoria,assicurazione_scad,revisione_scad,collaudo_scad,verifica_ultima,verifica_mesi")
        .eq("user_id",sbUid).or(_cliOr(mid||curMestiere())).is("eliminato_il",null);
      const out=[];
      const _soloStr=_mzSoloStrumenti();
      (mz||[]).forEach(function(m){
        const att=m.categoria==="attrezzatura"; /* 18 nov: era m.tipo, che e' testo libero («Trapano») */
        if(_soloStr&&!att)return;
        const _attN=(ruoloUtente==='professionista')?"Strumento":"Attrezzatura";
        const base={_mezzo:true,_mzId:m.id,_tab:att?"attrezzature":"mezzi",_nome:m.nome||(att?_attN:"Mezzo"),
                    tipo_pratica:att?_attN:"Mezzo",stato:"aperta"};
        SCAD_MEZZO.forEach(function(t){
          if(m[t[0]])out.push(Object.assign({id:"mz:"+m.id+":"+t[0],titolo:t[1],data_scadenza:m[t[0]]},base));
        });
        if(m.verifica_ultima&&(+m.verifica_mesi||0)>0)
          out.push(Object.assign({id:"mz:"+m.id+":verifica",titolo:"Verifica periodica",
            data_scadenza:_mesiDopo(m.verifica_ultima,+m.verifica_mesi)},base));
      });
      return out;
    }catch(_){ return []; }
  }
  /* ============================================================
     18 nov 2026 (si' di Alex, foto prima) — LE FATTURE DEI FORNITORI DA PAGARE.
     Stavano in Fornitori, nel Calendario e nell'email, ma non qui: proprio
     dove uno guarda cosa scade. Stessa idea di persone e mezzi: sola lettura,
     il dato resta in un posto solo, si apre e si segna pagata dalla fattura.
     Solo quelle NON pagate e con la data di scadenza scritta.
     ============================================================ */
  async function scadenzeFornitori(mid){
    if(!sb||!sbUid)return [];
    try{
      const m=mid||curMestiere();
      const [rff,rfo]=await Promise.all([
        sb.from("gest_fatture_fornitori").select("id,numero,scadenza,stato,importo,fornitore_id").eq("user_id",sbUid).eq("mestiere_id",m),
        sb.from("gest_fornitori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",m)
      ]);
      if(rff.error)return [];
      const nomi={};((rfo&&rfo.data)||[]).forEach(function(f){nomi[String(f.id)]=f.nome;});
      const out=[];
      (rff.data||[]).forEach(function(x){
        if(!x.scadenza||x.stato==="pagata")return;
        out.push({id:"ff:"+x.id,_forn:true,_ffId:x.id,_nome:nomi[String(x.fornitore_id)]||"Fornitore",
          titolo:"Fattura"+(x.numero?" n. "+x.numero:"")+((+x.importo||0)?" — "+eur2(+x.importo):""),
          tipo_pratica:"Da pagare",data_scadenza:x.scadenza,stato:"aperta"});
      });
      return out;
    }catch(_){ return []; }
  }
  /* 19 nov 2026 (le voci si parlano) — LE FATTURE DEI CLIENTI DA INCASSARE.
     Le fatture dei fornitori da pagare c'erano gia', quelle dei clienti no:
     si vedevano solo nel Calendario. Sola lettura come le altre: si apre e si
     segna pagata dalla fattura. Solo quelle EMESSE (col numero) e non pagate.
     La data e' la stessa del Calendario: «Da pagare entro» se c'e', se no la
     data della fattura + i giorni di pagamento di Dati azienda. La cifra e'
     quello che MANCA (vista gest_fatture_totali, colonna resto: tolti gli
     acconti), come in «Farsi pagare». */
  async function scadenzeIncassi(mid){
    if(!sb||!sbUid)return [];
    try{
      const m=mid||curMestiere();
      const [rf,raz]=await Promise.all([
        sb.from("gest_fatture").select("id,numero,data,scadenza,cli_nome").eq("user_id",sbUid).eq("mestiere_id",m)
          .eq("stato","emessa").is("eliminato_il",null).not("numero","is",null),
        sb.from("gest_azienda").select("giorni_pagamento").eq("user_id",sbUid).maybeSingle()
      ]);
      if(rf.error||!(rf.data||[]).length)return [];
      const gg=(raz&&raz.data&&+raz.data.giorni_pagamento)||30;
      let resto={};
      try{
        const rt=await sb.from("gest_fatture_totali").select("fattura_id,resto,totale").in("fattura_id",rf.data.map(x=>x.id));
        if(!rt.error)(rt.data||[]).forEach(t=>{resto[String(t.fattura_id)]=(t.resto!=null?+t.resto:+t.totale);});
      }catch(_){}
      const out=[];
      rf.data.forEach(function(x){
        if(!x.data&&!x.scadenza)return;
        let d=x.scadenza;
        if(!d){const t=new Date(x.data+"T12:00:00");t.setDate(t.getDate()+gg);d=t.toISOString().slice(0,10);}
        const r=resto[String(x.id)];
        if(r!=null&&!(r>0.004))return;           /* gia' tutta incassata con gli acconti */
        out.push({id:"fc:"+x.id,_incassa:true,_fcId:x.id,_nome:x.cli_nome||"Cliente",
          titolo:"Da incassare: fattura n. "+x.numero+(r!=null?" — "+eur2(r):""),
          tipo_pratica:"Da incassare",data_scadenza:d,stato:"aperta"});
      });
      return out;
    }catch(_){ return []; }
  }
  /* 19 nov 2026 (si' di Alex, foto prima) — LA SCADENZA DELLE CARTE AZIENDALI.
     Sola lettura, come mezzi e fornitori: il dato sta nella carta, si apre da li'.
     Se la colonna non c'e' ancora (sql/2026-11-19-carte-scadenza.sql) non esce niente. */
  async function scadenzeCarte(mid){
    if(!sb||!sbUid)return [];
    try{
      const r=await sb.from("gest_carte").select("*").eq("user_id",sbUid).eq("mestiere_id",mid||curMestiere());
      if(r.error)return [];
      return (r.data||[]).filter(c=>c.scadenza).map(c=>({id:"ca:"+c.id,_carta:true,_caId:c.id,_nome:c.nome||"Carta",
        titolo:"Scadenza della carta",tipo_pratica:"Carta aziendale",data_scadenza:c.scadenza,stato:"aperta"}));
    }catch(_){ return []; }
  }
  /* 20 nov 2026 (si' di Alex, foto prima) — I CREDITI FORMATIVI CHE MANCANO.
     Sola lettura, come carte e fornitori. Esce solo da ottobre dell'ultimo
     anno del periodo (anno o triennio, come dice l'Ordine) e solo se mancano
     crediti: lo stesso conto della sezione (credConto in gest-preventivi.js).
     I corsi sono della PERSONA: si vedono uguali in tutti i reparti, e solo a
     chi ha la voce «Crediti formativi» nel menu. */
  async function scadenzeCrediti(){
    if(!sb||!sbUid||typeof credConto!=="function")return [];
    const tb=document.querySelector("#tab-crediti");
    if(!tb||tb.style.display==="none")return [];
    try{
      const [rc,ra]=await Promise.all([
        sb.from("gest_crediti").select("data,crediti,tipo").eq("user_id",sbUid),
        sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle()
      ]);
      if(rc.error)return [];
      const reg=credRegolaDa(ra&&!ra.error?ra.data:null);
      const K=credConto(rc.data||[],reg,todayStr().slice(0,4));
      if(!K.avviso)return [];
      const n=v=>String(Math.round(v*100)/100).replace(".",",");
      let frase=K.mancano>0?("ne mancano "+n(K.mancano)):"";
      if(K.mancaDeont>0)frase+=K.mancano>0?(" (di cui "+n(K.mancaDeont)+" di deontologia)"):("mancano "+n(K.mancaDeont)+" di deontologia");
      return [{id:"cfp:"+K.a,_cred:true,_nome:reg.periodo===3?("triennio "+K.da+"–"+K.a):("anno "+K.a),
        titolo:"Crediti formativi: "+frase,
        tipo_pratica:"Crediti formativi",data_scadenza:K.scade,stato:"aperta"}];
    }catch(_){ return []; }
  }
  async function renderScadenze(){
    const box=$("#scad-list");if(!box)return;
    if(!cur){box.innerHTML="";return;}
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">📅</div><p>Nessuna scadenza</p><small>Accedi per gestire lo scadenzario</small></div>`;return;}
    const mid=curMestiere();
    const _rS=await Promise.all([
      /* "*" invece dell'elenco fisso: se sql/gest-scadenze-pratiche.sql non è ancora
         stato eseguito, le colonne nuove semplicemente non arrivano e la sezione
         non si rompe (stessa scelta già fatta per le pratiche). */
      sb.from("gest_scadenze").select("*").eq("user_id",sbUid).eq("mestiere_id",mid).order("data_scadenza",{ascending:true}),
      /* 24 nov 2026 (studio, voce Clienti) — anche i clienti nel Cestino, come
         Pratiche e Preventivi: prima la scadenza diceva «(cliente eliminato)»
         per un cliente che si rimette a posto con un clic. */
      ((window.cestinoAttivo&&window.cestinoAttivo()&&sb.raw)
        ? sb.raw("gest_clienti").select("id,nome,eliminato_il")
        : sb.from("gest_clienti").select("id,nome")
      ).eq("user_id",sbUid).or(_cliOr(mid)),
      sb.from("gest_mezzi").select("id,nome,categoria").eq("user_id",sbUid).or(_cliOr(mid)),
      /* i nomi delle pratiche si leggono qui e non da lavCache: lavCache è piena
         solo se l'utente ha già aperto la sezione Pratiche, altrimenti ogni
         scadenza collegata sembrerebbe (ruoloUtente==='professionista'?"(pratica eliminata)":"(lavoro eliminato)") pur esistendo. */
      sb.from("gest_lavori").select("id,descrizione").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);
    /* 12 nov 2026 — regola 20: senza rete non si dice «Aggiungi la prima scadenza» */
    if(letturaKo(_rS[0])){listaNonLetta(box,"le scadenze","scadenzario");return;}
    const [{data:sc},{data:cl},{data:mz},{data:lvNomi}]=_rS;
    scadCache=sc||[];
    const cliMap=Object.fromEntries((cl||[]).map(c=>[c.id,(c.nome||"")+(c.eliminato_il?" (nel cestino)":"")]));
    const mezMap=Object.fromEntries((mz||[]).map(m=>[m.id,m.nome]));
    /* 20 nov 2026 (voce Strumenti) — la stazione totale usciva col camion 🚚 e
       «(mezzo eliminato)»: icona e parola si decidono dalla categoria */
    window._mezCat=Object.fromEntries((mz||[]).map(m=>[m.id,m.categoria||"mezzo"]));
    const lavMap=Object.fromEntries((lvNomi||[]).map(l=>[l.id,l.descrizione||"Senza nome"]));
    const oggi=todayStr(),lim=_giorniDopo(oggi,7);

    const [scadPersone,scadMezzi,scadForn,scadCarte,scadInc,scadCred]=await Promise.all([scadenzePersone(mid),scadenzeMezzi(mid),scadenzeFornitori(mid),scadenzeCarte(mid),scadenzeIncassi(mid),scadenzeCrediti()]);
    const scadTutte=scadCache.concat(scadPersone,scadMezzi,scadForn,scadCarte,scadInc,scadCred).sort(function(a,b){
      return String(a.data_scadenza||"9999-99-99").localeCompare(String(b.data_scadenza||"9999-99-99"));
    });
    const filtra=(A,v)=>v==="scadute"?A.filter(s=>s.stato!=="fatta"&&s.data_scadenza&&s.data_scadenza<oggi)
                      :v==="prossime"?A.filter(s=>s.stato!=="fatta"&&(!s.data_scadenza||s.data_scadenza>=oggi))
                      :v==="fatte"?A.filter(s=>s.stato==="fatta"):A.slice();
    const conta={};SCAD_VISTE.forEach(v=>conta[v.k]=filtra(scadTutte,v.k).length);
    /* 18 nov 2026 — il numero della linguetta «Scadenze» (quelle da fare) */
    window._spN=window._spN||{};window._spN.scad=(conta.scadute||0)+(conta.prossime||0);window._spN.scadMid=mid;
    try{ if(typeof spUnisci==="function") spUnisci(); }catch(e){}
    /* 24 nov 2026 — il numero dei Promemoria sulla linguetta restava quello
       vecchio: un promemoria scritto da Tasse e fisco o da «Parla» segna solo
       «da ridisegnare» la linguetta che non si vede, e qui c'era «Promemoria (0)».
       Si conta di nuovo ogni volta (una domanda piccola, solo il numero). */
    try{
      if(typeof spUnito==="function"&&spUnito()){
        sb.from("promemoria").select("id",{count:"exact",head:true}).eq("user_id",sbUid)
          .is("eliminato_il",null).or("stato.is.null,stato.neq.fatto")
          .then(function(r){ if(r&&!r.error&&r.count!=null){ window._spN.prom=r.count; try{spUnisci();}catch(e){} } });
      }
    }catch(e){}
    let L=filtra(scadTutte,scadVista);
    /* 18 nov 2026 — collaudo dello Scadenzario: in «Tutte» una scadenza fatta
       stava in mezzo a quelle ancora da fare (ordine per data): adesso le fatte
       vanno in fondo. In «Fatte» in cima sta l'ultima, non la piu' vecchia. */
    if(scadVista==="fatte") L.reverse();
    else if(scadVista==="tutte") L=L.filter(s=>s.stato!=="fatta").concat(L.filter(s=>s.stato==="fatta").reverse());
    renderTabella({
      id:"scad", box:"#scad-list",
      viste:"#scad-viste", visteDef:SCAD_VISTE, vista:scadVista, conta:conta, azioneVista:"scad-vista",
      vuoto:tabVuoto("Le scadenze da non dimenticare",
        (ruoloUtente==='professionista'?"Pratiche, tarature degli strumenti, polizze.":"DURC, assicurazioni, revisioni dei mezzi, pratiche.")+" Quelle gi\u00e0 passate finiscono in cima al Riepilogo, cos\u00ec le vedi appena apri.",
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
                 :s.mezzo_id?(mezMap[s.mezzo_id]||_mzEliminato()):"";
        if(s._cred){
          const apriCr={action:"vai-sezione",data:{go:"crediti"}};
          return {
            id:s.id,
            click:apriCr,
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"In tempo")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
              esc(s.tipo_pratica),
              `🎓 ${esc(s._nome)}`,
              {h:q.testo,cls:q.classe}
            ],
            menu:[{lab:"🎓 Apri i crediti formativi",action:"vai-sezione",data:{go:"crediti"}}]
          };
        }
        if(s._carta){
          const apriC={action:"cal-vai",data:{tab:"carte",azione:"carta-dettaglio",id:s._caId}};
          return {
            id:s.id,
            click:apriC,
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"In tempo")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
              esc(s.tipo_pratica),
              `💳 ${esc(s._nome)}`,
              {h:q.testo,cls:q.classe}
            ],
            menu:[{lab:"💳 Apri la carta",action:"cal-vai",data:{tab:"carte",azione:"carta-dettaglio",id:s._caId}}]
          };
        }
        if(s._incassa){
          return {
            id:s.id,
            click:{action:"cal-vai",data:{tab:"fatture",azione:"edit-fatt",id:s._fcId}},
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"In tempo")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
              esc(s.tipo_pratica),
              `👤 ${esc(s._nome)}`,
              {h:q.testo,cls:q.classe}
            ],
            menu:[{lab:"🧾 Apri la fattura",action:"cal-vai",data:{tab:"fatture",azione:"edit-fatt",id:s._fcId}}]
          };
        }
        if(s._forn){
          const apriF={action:"cal-vai",data:{tab:"fornitori",azione:"edit-fattf",id:s._ffId}};
          return {
            id:s.id,
            click:apriF,
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"In tempo")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
              esc(s.tipo_pratica),
              `🏭 ${esc(s._nome)}`,
              {h:q.testo,cls:q.classe}
            ],
            menu:[{lab:"🏭 Apri la fattura del fornitore",action:"cal-vai",data:{tab:"fornitori",azione:"edit-fattf",id:s._ffId}}]
          };
        }
        if(s._mezzo){
          const apri={action:"cal-vai",data:{tab:s._tab,azione:"edit-mezzo",id:s._mzId}};
          return {
            id:s.id,
            click:apri,
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"In tempo")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
              esc(s.tipo_pratica),
              `${s._tab==="attrezzature"?"🔧":"🚚"} ${esc(s._nome)}`,
              {h:q.testo,cls:q.classe}
            ],
            menu:[{lab:(s._tab==="attrezzature"?"🔧 "+(ruoloUtente==='professionista'?"Apri la scheda dello strumento":"Apri la scheda dell'attrezzatura"):"🚚 Apri la scheda del mezzo"),action:"cal-vai",data:{tab:s._tab,azione:"edit-mezzo",id:s._mzId}}]
          };
        }
        if(s._persona){
          return {
            id:s.id,
            click:{action:"scad-persona",data:{id:s._opId}},
            celle:[
              `<span class="lav-bar ${s.data_scadenza<oggi?"ritardo":(s.data_scadenza<=lim?"da_fare":"in_corso")}" title="${s.data_scadenza<oggi?"Scaduta":(s.data_scadenza<=lim?"In scadenza":"In tempo")}"></span><span class="c-nome">${esc(s.titolo)}</span>`,
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
            `<span class="lav-bar ${fatta?"fatto":(s.data_scadenza&&s.data_scadenza<oggi?"ritardo":(s.data_scadenza&&s.data_scadenza<=lim?"da_fare":"in_corso"))}" title="${fatta?"Fatta":(s.data_scadenza&&s.data_scadenza<oggi?"Scaduta":(s.data_scadenza&&s.data_scadenza<=lim?"In scadenza":"In tempo"))}"></span><span class="c-nome">${esc(s.titolo||"Scadenza")}</span>`,
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
  /* 7 nov 2026 — collaudo della semplicita' (ok di Alex): «Aperta» non si capiva:
     adesso «In tempo»; i pulsanti delle righe si chiamano tutti «Apri». */
  const SCAD_VISTE=[{k:"tutte",lab:"Tutte"},{k:"scadute",lab:"Scadute",err:true},{k:"prossime",lab:"Prossime"},{k:"fatte",lab:"Fatte"}];
  let scadVista="tutte";
  /* 27 nov 2026 (giro nuovo, sessione 5) — un'assicurazione fra 10 giorni diceva
     «In tempo», come una fra un anno. Entro 30 giorni si dice quanto manca. */
  function scadCard(s,cliMap,oggi,lim,mezMap,lavMap){
    const h=_scadCard(s,cliMap,oggi,lim,mezMap,lavMap);
    try{
      if(s&&s.stato!=="fatta"&&s.data_scadenza&&s.data_scadenza>lim){
        const g=Math.round((new Date(s.data_scadenza)-new Date(oggi))/86400000);
        if(g>0&&g<=30)return h.replace(">In tempo</span>",">Tra "+g+" giorni</span>");
      }
    }catch(_){}
    return h;
  }
  function _scadCard(s,cliMap,oggi,lim,mezMap,lavMap){
    if(s._cred){
      let bgR="var(--sfondo)",fgR="var(--testo-2)",labR="In tempo",tonoR="t-neutro";
      if(s.data_scadenza<oggi){bgR="var(--err-bg)";fgR="var(--err)";labR="Scaduta";tonoR="t-err";}
      else if(s.data_scadenza<=lim){bgR="var(--attesa-bg)";fgR="var(--attesa)";labR="In scadenza";tonoR="t-attesa";}
      return schedaJob({
        tono:tonoR, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgR};color:${fgR}">${labR}</span>`,
        meta:["🎓 "+esc(s._nome), "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri",action:"vai-sezione",data:{go:"crediti"}}]
      });
    }
    if(s._carta){
      let bgC="var(--sfondo)",fgC="var(--testo-2)",labC="In tempo",tonoC="t-neutro";
      if(s.data_scadenza<oggi){bgC="var(--err-bg)";fgC="var(--err)";labC="Scaduta";tonoC="t-err";}
      else if(s.data_scadenza<=lim){bgC="var(--attesa-bg)";fgC="var(--attesa)";labC="In scadenza";tonoC="t-attesa";}
      return schedaJob({
        tono:tonoC, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgC};color:${fgC}">${labC}</span>`,
        meta:["💳 "+esc(s._nome), "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri",action:"cal-vai",data:{tab:"carte",azione:"carta-dettaglio",id:s._caId}}]
      });
    }
    if(s._incassa){
      let bgI="var(--sfondo)",fgI="var(--testo-2)",labI="In tempo",tonoI="t-neutro";
      if(s.data_scadenza<oggi){bgI="var(--err-bg)";fgI="var(--err)";labI="Scaduta";tonoI="t-err";}
      else if(s.data_scadenza<=lim){bgI="var(--attesa-bg)";fgI="var(--attesa)";labI="In scadenza";tonoI="t-attesa";}
      return schedaJob({
        tono:tonoI, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgI};color:${fgI}">${labI}</span>`,
        meta:["👤 "+esc(s._nome)+" (cliente)", "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri",action:"cal-vai",data:{tab:"fatture",azione:"edit-fatt",id:s._fcId}}]
      });
    }
    if(s._forn){
      let bgF="var(--sfondo)",fgF="var(--testo-2)",labF="In tempo",tonoF="t-neutro";
      if(s.data_scadenza<oggi){bgF="var(--err-bg)";fgF="var(--err)";labF="Scaduta";tonoF="t-err";}
      else if(s.data_scadenza<=lim){bgF="var(--attesa-bg)";fgF="var(--attesa)";labF="In scadenza";tonoF="t-attesa";}
      return schedaJob({
        tono:tonoF, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgF};color:${fgF}">${labF}</span>`,
        meta:["🏭 "+esc(s._nome)+" (fornitore)", "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri",action:"cal-vai",data:{tab:"fornitori",azione:"edit-fattf",id:s._ffId}}]
      });
    }
    if(s._mezzo){
      let bgM="var(--sfondo)",fgM="var(--testo-2)",labM="In tempo",tonoM="t-neutro";
      if(s.data_scadenza<oggi){bgM="var(--err-bg)";fgM="var(--err)";labM="Scaduta";tonoM="t-err";}
      else if(s.data_scadenza<=lim){bgM="var(--attesa-bg)";fgM="var(--attesa)";labM="In scadenza";tonoM="t-attesa";}
      return schedaJob({
        tono:tonoM, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgM};color:${fgM}">${labM}</span>`,
        meta:[(s._tab==="attrezzature"?"🔧 ":"🚚 ")+esc(s._nome), "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri",action:"cal-vai",data:{tab:s._tab,azione:"edit-mezzo",id:s._mzId}}]
      });
    }
    if(s._persona){
      let bgP="var(--sfondo)",fgP="var(--testo-2)",labP="In tempo",tonoP="t-neutro";
      if(s.data_scadenza<oggi){bgP="var(--err-bg)";fgP="var(--err)";labP="Scaduta";tonoP="t-err";}
      else if(s.data_scadenza<=lim){bgP="var(--attesa-bg)";fgP="var(--attesa)";labP="In scadenza";tonoP="t-attesa";}
      return schedaJob({
        tono:tonoP, titolo:esc(s.titolo),
        destra:`<span class="stato" style="background:${bgP};color:${fgP}">${labP}</span>`,
        meta:["👷 "+esc(s._nome), "📅 "+fdate(s.data_scadenza)],
        azioni:[{lab:"Apri",action:"scad-persona",data:{id:s._opId}}]
      });
    }
    const fatta=s.stato==="fatta";
    const cliNome=s.cliente_id?(cliMap[s.cliente_id]||"(cliente eliminato)"):"";
    const mezNome=s.mezzo_id?((mezMap||{})[s.mezzo_id]||_mzEliminato()):"";
    const lavNome=s.lavoro_id?((lavMap||{})[s.lavoro_id]||(ruoloUtente==='professionista'?"(pratica eliminata)":"(lavoro eliminato)")):"";
    /* dipCache tiene solo chi c'e' adesso in squadra: se il nome non si trova,
       quella persona e' stata tolta. Si dice, invece di lasciare il vuoto. */
    const opeNome=s.operatore_id?(((dipCache||[]).find(o=>String(o.id)===String(s.operatore_id))||{}).nome||(ruoloUtente==='professionista'?"(persona non più nello studio)":"(persona non più in squadra)")):"";
    let bg="var(--sfondo)",fg="var(--testo-2)",lab="In tempo",tono="t-neutro";
    if(fatta){bg="var(--ok-bg)";fg="var(--ok)";lab="Fatta";tono="t-ok";}
    else if(s.data_scadenza&&s.data_scadenza<oggi){bg="var(--err-bg)";fg="var(--err)";lab="Scaduta";tono="t-err";}
    else if(s.data_scadenza&&s.data_scadenza<=lim){bg="var(--attesa-bg)";fg="var(--attesa)";lab="In scadenza";tono="t-attesa";}
    return schedaJob({
      tono, titolo:esc(s.titolo||"Scadenza"),
      destra:`<span class="stato" style="background:${bg};color:${fg}">${lab}</span>`,
      meta:[(s.tipo_pratica&&s.tipo_pratica!==s.titolo)?"📄 "+esc(s.tipo_pratica):"",
            lavNome?"📁 "+esc(lavNome):"",
            cliNome?"👤 "+esc(cliNome):"",
            mezNome?_mzIcona(s.mezzo_id)+" "+esc(mezNome):"",
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
        sb.from("gest_mezzi").select("id,nome,targa,categoria").eq("user_id",sbUid).or(_cliOr(mid)).order("nome")
      ]);
      cl=dc||[];mz=dm||[];
      /* 20 nov 2026 (voce Strumenti) — allo studio senza Mezzi nel menu, nella tendina
         «Strumento» uscivano anche escavatore e furgone. Quello gia' scelto resta. */
      if(ruoloUtente==='professionista'&&typeof tabNascosto==='function'&&tabNascosto("mezzi"))
        mz=mz.filter(m=>m.categoria==="attrezzatura"||String(m.id)===String(s&&s.mezzo_id||""));
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
    /* 18 nov 2026 — collaudo dello Scadenzario: una scadenza NUOVA nasceva col
       tipo «DURC» gia' scelto. Chi scriveva «Revisione furgone» e non toccava
       la tendina si ritrovava «DURC» sulla scheda; chi lasciava il titolo vuoto
       salvava una scadenza chiamata «DURC» senza volerlo. Adesso la nuova parte
       da «— scegli —». Una gia' salvata tiene il suo tipo. */
    const tipoVuoto=(isNew&&!s.tipo_pratica)?'<option value="" selected>— scegli —</option>':"";
    const tipoOpts=tipoVuoto+tipiScadenza().map(tp=>`<option value="${esc(tp)}" ${tp===s.tipo_pratica?"selected":""}>${esc(tp)}</option>`).join("");
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
      +`</select><div class="sh-nota">${pro?"Taratura, polizza, rinnovo dell'iscrizione":"Revisione, DURC, assicurazione, taratura, visita medica"}: quando la segni fatta, quella dopo nasce da sola.</div></div>`
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
      +`<div class="field"><label>Persona (facoltativo)</label><select id="s-ope"><option value="">— nessuna —</option>${opeOpts}</select><div class="campo-aiuto">Per le cose che scadono addosso a una persona: ${pro?"polizza, iscrizione all'albo, corso sulla sicurezza":"patentino del muletto, piattaforma aerea, primo soccorso"}.</div></div>`
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
    /* 24 nov 2026 (si' di Alex, foto prima) — «Rimanda» come nei Promemoria */
    if(!isNew&&s.id&&s.stato!=="fatta") scadRimandaMetti(s.id);
  }
  /* ===== 24 nov 2026 (si' di Alex, foto prima) — «RIMANDA ▾» NELLA SCADENZA =====
     Il Comune concede la proroga, la polizza slitta: prima bisognava aprire
     la data e riscriverla. Si conta dalla SUA data (e' una scadenza, non un
     promemoria: «di un mese» vuol dire un mese dopo quella di prima).
     Gli avvisi dell'email ripartono (avvisi=null), come in _saveScad.
     Stesso stile del «Rimanda» dei Promemoria (classe prom-rimanda). */
  const SCAD_RIMANDA=[["g7","Di una settimana"],["m1","Di un mese"],["m3","Di 3 mesi"]];
  function scadRimandaMetti(id){
    const testa=document.querySelector("#sheet .sh-head"); if(!testa)return;
    let az=testa.querySelector(".sh-head-az");
    if(!az){az=document.createElement("div");az.className="sh-head-az";testa.appendChild(az);}
    if(az.querySelector(".scad-rimanda"))return;
    const d=document.createElement("details");
    d.className="sh-altro prom-rimanda scad-rimanda";
    d.innerHTML='<summary class="btn btn-sm">Rimanda ▾</summary><div class="sh-altro-pop">'
      +SCAD_RIMANDA.map(x=>'<button class="btn btn-sm" data-chiudi="1" data-action="scad-rimanda" data-id="'
        +esc(String(id))+'" data-g="'+x[0]+'">'+x[1]+'</button>').join("")+'</div>';
    const primo=az.querySelector(".az-prima");
    if(primo)primo.after(d); else az.prepend(d);
  }
  let _scadRimando=false;
  async function scadRimanda(id,g){
    if(_scadRimando||!sb||!sbUid)return;
    _scadRimando=true;
    try{
      const {data:s1,error:e1}=await sb.from("gest_scadenze").select("id,data_scadenza,titolo").eq("id",id).eq("user_id",sbUid).maybeSingle();
      if(e1||!s1||!s1.data_scadenza){toast("Non rimandata: "+((e1&&e1.message)||"scadenza non trovata"));return;}
      const nuova=/^m/.test(g)?_mesiDopo(s1.data_scadenza,+String(g).slice(1)||1):_giorniDopo(s1.data_scadenza,+String(g).slice(1)||7);
      let r=await sb.from("gest_scadenze").update({data_scadenza:nuova,avvisi:null}).eq("id",id).eq("user_id",sbUid).select("id");
      if(r.error&&/avvisi/.test(r.error.message||""))
        r=await sb.from("gest_scadenze").update({data_scadenza:nuova}).eq("id",id).eq("user_id",sbUid).select("id");
      if(r.error||!r.data||!r.data.length){toast("Non rimandata: "+((r.error&&r.error.message)||"nessuna riga scritta"));return;}
      /* la finestra aperta ha ancora la data vecchia: si chiude, se no «Salva» la rimetterebbe */
      try{closeSheet();}catch(e){}
      toast("Rimandata al "+fdate(nuova)+" ✔");
      renderScadenze(); rinfresca("calendario","riepilogo");
    }finally{_scadRimando=false;}
  }
  if(!window.__scadRimAscolto){
    window.__scadRimAscolto=1;
    document.addEventListener("click",function(e){
      const t=e.target&&e.target.closest?e.target.closest('[data-action="scad-rimanda"]'):null;
      if(t) scadRimanda(t.dataset.id,t.dataset.g);
    });
  }
  /* 18 nov 2026 — collaudo dello Scadenzario: due tocchi veloci su «Crea»
     facevano DUE scadenze uguali (visto dal vivo). Stesso freno dei Promemoria. */
  let _scadSalvo=false;
  async function saveScad(id){
    if(_scadSalvo)return;
    _scadSalvo=true;
    try{ await _saveScad(id); } finally{ _scadSalvo=false; }
  }
  async function _saveScad(id){
    /* 11 nov 2026 — collaudo 3.11: se il titolo e' vuoto ma il tipo e'
       scelto (DURC, Revisione…) il titolo e' il tipo: una casella in meno.
       Quello che manca davvero si segna sulla casella (campoManca). */
    const _manca=(sel,frase)=>{ if(typeof campoManca==="function") campoManca($(sel),frase); else toast(frase); };
    let titolo=$("#s-tit").value.trim();
    const _tipo=$("#s-tipo")?$("#s-tipo").value:"";
    if(!titolo&&_tipo&&!/^altro$/i.test(_tipo)) titolo=_tipo;
    if(!titolo){_manca("#s-tit","Manca cosa scade: scrivilo qui.");return;}
    const data_scadenza=$("#s-data").value;if(!data_scadenza){_manca("#s-data","Manca la data della scadenza: mettila qui.");return;}
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
    /* 24 nov 2026 (studio, Scadenze e promemoria) — CAMBIATA LA DATA, GLI
       AVVISI RIPARTONO. L'email del mattino segna in «avvisi» le tappe gia'
       mandate (30, 7, 1). Spostando le integrazioni dal 15 gennaio al 15
       febbraio (proroga del Comune) restava «30,7»: della data nuova non
       arrivava piu' l'avviso dei 30 e dei 7 giorni. Come «inviato» dei Promemoria. */
    if(id){
      const _vec=(scadCache||[]).find(x=>String(x.id)===String(id));
      if(!_vec||String(_vec.data_scadenza||"")!==data_scadenza) row.avvisi=null;
    }
    /* Se sql/gest-scadenze-pratiche.sql non è ancora stato eseguito, le colonne
       nuove non esistono: invece di far fallire tutto il salvataggio le tolgo una
       alla volta e riprovo (stessa scelta già fatta nei Dati azienda). */
    /* ripeti_mesi si toglie come le altre se la colonna non c'e' ancora:
       chi non ha eseguito sql/gest-scadenze-ripeti.sql continua a salvare */
    const OPZ=["lavoro_id","avvisa","ripeti_mesi","operatore_id","avvisi"];
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
    /* 20 nov 2026 (voce Strumenti) — salvata la taratura, la scheda dello strumento
       restava «Disponibile» senza scadenza finche' non si cambiava pagina */
    try{ renderAttrezzature(); }catch(e){}
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
  const PRATICA_STATI=[["da_preparare","Da preparare"],["depositata","Depositata"],["istruttoria","In istruttoria"],["integrazioni","Integrazioni richieste"],["approvata","Approvata"],["archiviata","Finita"]];
  /* ⛔ 28 nov 2026 (giro nuovo, sessione 10, DECISO DA ALEX) — UN SOLO «STATO»
     NELLA PRATICA. Prima c'erano «A che punto sta» (Comune) e «Stato» (Da fare /
     In corso / Fatto): per un geometra un doppione. Allo studio si vede solo
     «A che punto sta»; «archiviata» si chiama «Finita» ed e' il «fatto» del
     lavoro. Nel database restano le due colonne, tenute d'accordo qui:
       praPunto(l)      → cosa si legge a schermo (fatto = Finita, sempre)
       praStatoDa(ps,s) → lo «stato» che va col punto scelto
     Da preparare tiene «da fare» o «in corso»; Depositata…Approvata = in corso;
     Finita = fatto. Impresa e artigiano: non cambia niente. */
  const praPunto=l=>(l&&l.stato==="fatto")?"archiviata":((l&&l.pratica_stato)||"da_preparare");
  const praStatoDa=(ps,prima)=>ps==="archiviata"?"fatto":(ps==="da_preparare"||!ps?(prima==="in_corso"?"in_corso":"da_fare"):"in_corso");
  const praPuntoNome=l=>(PRATICA_STATI.find(x=>x[0]===praPunto(l))||[])[1]||"";
  window.praPunto=praPunto; window.praStatoDa=praStatoDa;
  /* dentroBox=true: il riquadro che lo contiene ha già il suo titolo, quindi
     qui si salta l'intestazione interna (evita due titoli uno sull'altro). */
  function bloccoPratica(job,dentroBox){
    if(ruoloUtente!=='professionista')return "";
    job=job||{};
    const tipi=PRATICA_TIPI.map(t=>`<option value="${esc(t)}" ${t===(job.pratica_tipo||"")?"selected":""}>${(t==="Agibilita'"?"Agibilità":t)||"— scegli —"}</option>`).join("");
    const stati=PRATICA_STATI.map(s=>`<option value="${s[0]}" ${s[0]===praPunto(job)?"selected":""}>${s[1]}</option>`).join("");
    return `
      ${dentroBox?"":`<div class="sh-tit pr-tit" style="margin-top:6px">Dati della pratica</div>`}
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
        <!-- 19 nov 2026 (voce Pratiche): ogni casella dice cosa e'. Prima erano
             tre caselle con solo «Es. 12 / Es. 345 / Es. 2»: sul telefono una
             sotto l'altra, e non si capiva quale fosse il foglio. -->
        <div class="pr-cat">
          <label class="pr-cat-c" for="j-cat-fog"><span>Foglio</span><input id="j-cat-fog" value="${esc(job.catasto_foglio||"")}" placeholder="Es. 12"></label>
          <label class="pr-cat-c" for="j-cat-par"><span>Particella</span><input id="j-cat-par" value="${esc(job.catasto_particella||"")}" placeholder="Es. 345"></label>
          <label class="pr-cat-c" for="j-cat-sub"><span>Sub</span><input id="j-cat-sub" value="${esc(job.catasto_sub||"")}" placeholder="Es. 2"></label>
        </div>
      </div>`;
  }
  /* ⛔ 7 nov 2026 — UNA CASELLA IN MENO DA RICORDARE. Quando la pratica passa
     a «Depositata» e la data di deposito e' vuota, ci si mette oggi (si
     cambia se serve). Se una data c'e' gia', non si tocca. */
  if(!window._praticaDataAuto){
    window._praticaDataAuto=true;
    document.addEventListener("change",function(e){
      const t=e.target;
      /* solo quando lo sceglie LUI: se lo ha messo l'AI, una data non detta
         resta vuota (isTrusted e' falso per gli eventi del programma) */
      if(!e.isTrusted||!t||t.id!=="j-pr-stato"||t.value!=="depositata")return;
      const d=document.getElementById("j-pr-data");
      if(!d||d.value)return;
      d.value=todayStr();
      d.dispatchEvent(new Event("input",{bubbles:true}));
      try{toast("Data di deposito: oggi. Cambiala se serve.");}catch(_){}
    });
  }
  /* 28 nov 2026 (un solo stato) — scegliendo «A che punto sta» lo «stato»
     nascosto lo segue (anche quando lo sceglie l'AI: niente isTrusted). */
  if(!window._praticaStatoUnico){
    window._praticaStatoUnico=true;
    document.addEventListener("change",function(e){
      const t=e.target; if(!t||t.id!=="j-pr-stato")return;
      const seg=document.getElementById("j-stato"); if(!seg)return;
      const on=seg.querySelector("button.on"), v=praStatoDa(t.value,on?on.dataset.v:"");
      seg.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
    });
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
        /* 19 nov 2026 (voce Pratiche) — per lo studio la data NON si mette da
           sola a oggi: una pratica creata e lasciata cosi' il giorno dopo era
           gia' «In ritardo» (rossa), mentre aspettava solo il Comune. */
        +`<div class="field"><label>Data prevista</label><input type="date" id="j-data" value="${job.dataPrevista||((pro||!isNew)?"":todayStr())}"></div>`
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
    /* 24 nov 2026 (giro della pratica, studio) — se il cliente della pratica non
       è nella tendina (appena creato da una richiesta dal sito, o nel Cestino)
       la tendina restava su «— scegli —» e «Salva» lo cancellava dalla pratica.
       Ora c'è sempre: il nome si legge un attimo dopo. */
    let cliOpts=cliCache.map(c=>`<option value="${c.id}" ${c.id===job.clienteId?"selected":""}>${esc(c.nome)}</option>`).join("");
    if(job.clienteId&&!cliCache.some(c=>String(c.id)===String(job.clienteId))){
      cliOpts+=`<option value="${esc(job.clienteId)}" selected data-cli-manca="1">Cliente della pratica</option>`;
      setTimeout(async function(){
        try{
          const {data}=await _sbTutto("gest_clienti").select("id,nome,eliminato_il").eq("id",job.clienteId).limit(1);
          const c=data&&data[0], o=document.querySelector('#j-cli option[data-cli-manca]');
          if(c&&o){o.textContent=(c.nome||"Cliente")+(c.eliminato_il?" (nel cestino)":"");
            if(!c.eliminato_il&&!cliCache.some(x=>String(x.id)===String(c.id)))cliCache.push({id:c.id,nome:c.nome});}
        }catch(e){}
      },0);
    }
    const dipOpts=dipCache.map(d=>`<option value="${d.id}">${esc(d.nome)}</option>`).join("");
    /* 18 nov 2026 — collaudo dell'Agenda operatore: se chi ci va non e' piu' in
       squadra (e' nel Cestino) la tendina restava su «— nessuno —» e premendo
       Salva il lavoro PERDEVA la persona, in silenzio. Adesso la sua voce resta
       («… (nel cestino)») e salvando non cambia niente. */
    const dipSel=id=>dipCache.map(d=>`<option value="${d.id}" ${d.id===id?"selected":""}>${esc(d.nome)}</option>`).join("")
      +((id&&!dipCache.some(d=>d.id===id))?`<option value="${esc(id)}" data-fuori="1" selected>Persona nel cestino</option>`:"");
    if(job.assegnatoId&&!dipCache.some(d=>d.id===job.assegnatoId)&&sb&&typeof sb.raw==="function"){
      const _idF=job.assegnatoId;
      (async()=>{try{
        const r=await sb.raw("gest_operatori").select("nome,eliminato_il").eq("id",_idF).maybeSingle();
        const o=document.querySelector('#j-dip option[data-fuori]');
        if(o&&r&&r.data&&r.data.nome)o.textContent=r.data.nome+(r.data.eliminato_il?" (nel cestino)":"");
      }catch(e){}})();
    }
    /* Modulo lungo -> modale grande. A sinistra il lavoro in se' (cosa, dove,
       quando, chi, com'e' andata), a destra gli allegati e i soldi. */
    openSheetGrande(isNew?"Nuovo lavoro":"Modifica lavoro",
      `<div class="sh-cols sh-cols--3"><div class="sh-col">
      <div class="sh-b sh-b-a">
      <div class="sh-tit">Il lavoro</div>
      <div class="field"><label>Cliente / Cantiere</label>
        <select id="j-cli"><option value="">— scegli —</option>${cliOpts}</select>
        <button class="btn-ghost quick-add" data-action="quick-cli">+ Aggiungi nuovo cliente</button></div>
      ${bloccoPratica(job)}
      <div class="field"><label>Cosa c'è da fare</label><textarea id="j-desc" placeholder="Es. taglio siepe e pulizia aiuole">${esc(job.descrizione||"")}</textarea></div>
      <div class="field"><label>Dove (vuoto = indirizzo del cliente)</label><input id="j-dove" value="${esc(job.dove||"")}" placeholder="Es. Via Roma 12, scala B, piano 3"></div>
      <div class="row2">
        <div class="field"><label>Data prevista</label><input type="date" id="j-data" value="${job.dataPrevista||""}"></div>
        <div class="field"><label>${ruoloUtente==='professionista'?"Collaboratore":"Chi ci va"}</label><select id="j-dip"><option value="">— nessuno —</option>${dipSel(job.assegnatoId)}</select></div></div>
      <div class="field"${ruoloUtente==='professionista'?' hidden':''}><label>Stato</label><div class="seg" id="j-stato">
        ${["da_fare","in_corso","fatto"].map(s=>`<button data-v="${s}" class="${job.stato===s?"on":""}">${statoLabel[s]}</button>`).join("")}</div></div>
      </div>
      <div class="sh-b" id="lav-prev-wrap" style="display:none"></div>
      <div class="sh-b sh-b-b">
      <div class="field campo-titolo"><label>${ruoloUtente==='professionista'?"Cosa è stato fatto (consuntivo)":"Cosa è stato fatto"}</label><textarea id="j-svolto" placeholder="Compila quando il lavoro è finito">${esc(job.lavoroSvolto||"")}</textarea></div>
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
      <div class="field campo-titolo" id="spese-wrap" style="display:none"><label>💶 ${ruoloUtente==='professionista'?'Spese di questa pratica':'Spese e materiali di questo lavoro'}</label>
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
        <!-- 13 nov 2026 (lista «MANCA», n. 7) — «Chi le ha fatte» si vede SEMPRE,
             anche con la squadra vuota: ci sono «io» e «un'altra persona». -->
        <div class="ore-add2">
          <label class="ore-c"><span>Che giorno</span><input id="or-data" type="date"></label>
          <label class="ore-c"><span>Quante ore</span><input id="or-ore" type="text" inputmode="decimal" placeholder="Es. 2,5"></label>
          <label class="ore-c ore-c--tutta"><span>Chi le ha fatte</span><select id="or-chi"><option value="">Scegli chi</option></select></label>
          <!-- 14 nov 2026 (lista «MANCA», n. 3) — il costo orario si chiede SUBITO, quando
               la persona nasce da qui: se no la sua manodopera non entra mai nel margine.
               Si può lasciare vuoto: la persona nasce lo stesso e il margine dice che manca. -->
          <label class="ore-c" id="or-chi-nuovo-box" style="display:none"><span>Nome della persona</span><input id="or-chi-nuovo" placeholder="Nome e cognome"></label>
          <label class="ore-c" id="or-chi-costo-box" style="display:none"><span>Quanto ti costa all'ora (€)</span><input id="or-chi-costo" type="text" inputmode="decimal" placeholder="Es. 22,50"></label>
          <label class="ore-c ore-c--tutta"><span>Cosa ha fatto (se vuoi)</span><input id="or-nota" placeholder="${ruoloUtente==='professionista'?"Es. Rilievo e pratica al Comune":"Es. Posa piastrelle bagno"}"></label>
          <button type="button" class="btn ore-c--tutta" data-action="ore-add">+ Aggiungi le ore</button></div>
        <div class="margine-box" id="ora-box"></div>
        <!-- 22 agosto 2026 — IL PONTE FRA LE ORE E LA PARCELLA.
             Le ore si segnavano e finivano li': il conto per la parcella si
             rifaceva a mano. Il pulsante compare solo quando delle ore ci
             sono davvero (lo accende renderOreBlock). -->
        <button type="button" class="btn quick-add" id="ore-in-parcella" data-action="ore-parcella" style="display:none;margin-top:10px">💶 Porta le ore nella parcella</button></div>
      <div class="field campo-titolo" id="rap-wrap" style="display:none"><label>${ruoloUtente==='professionista'?"Resoconti di giornata":"Giornate di questo lavoro"}</label>
        <div class="spese-list" id="rap-list"></div>
        <!-- 13 nov 2026 (lista «MANCA», n. 6) — il rapportino da far firmare al cliente -->
        <button type="button" class="btn quick-add" data-action="rapf-nuovo" style="margin-top:8px">＋ ${ruoloUtente==='professionista'?"Resoconto":"Rapportino"} da far firmare</button>
        <div class="campo-aiuto">${ruoloUtente==='professionista'?'Li scrivono i collaboratori dalla loro app':'Li scrive la squadra dal telefono'}, oppure tu qui: il cliente firma col dito sullo schermo. Con la <b>&times;</b> butti via un rapportino sbagliato: le sue ore vanno nel cestino insieme a lui, e da lì tornano su insieme.</div></div>
      <div class="field campo-titolo"><label>Fattura</label>
        <div class="j-fatt-info">${
          (job.fattStato||"none")==="pagata" ? "\u2714 Fatturato e incassato"
          : (job.fattStato||"none")==="emessa" ? "\ud83e\uddfe Fatturato, in attesa di incasso"
          : "Non ancora fatturato"}</div>
        <div class="campo-aiuto">Lo stato lo decide la fattura, non questo modulo: si aggiorna da solo quando emetti o incassi.${
          /* 21 ott 2026 — il testo diceva «usa il pulsante Crea fattura sulla
             scheda del lavoro», ma quel pulsante non c'e': «Crea fattura» sta
             nel menu «…» della riga, e compare solo quando il lavoro e' FATTO.
             E si leggeva anche a lavoro gia' fatturato. Trovato nel collaudo.
             14 nov 2026 (quinto giro, n. 11) — nella riga adesso c'e' solo
             «Apri»: «Crea fattura» sta IN ALTO in questa finestra, quando il
             lavoro e' Fatto. La frase dice quello. */
          (job.id&&(job.fattStato||"none")==="none")
            ?' Quando '+(ruoloUtente==='professionista'?'la pratica':'il lavoro')+' è finit'+(ruoloUtente==='professionista'?'a':'o')+', segnal'+(ruoloUtente==='professionista'?'a':'o')+' <b>Fatto</b>: poi qui in alto trovi <b>Crea fattura</b>.'
            :''}</div></div>
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
  /* ===== 13 nov 2026 (lista «MANCA», n. 5) — LE VOCI DEL PREVENTIVO NEL LAVORO =====
     Il lavoro nato da un preventivo portava solo il titolo: per sapere cosa
     c'era da fare si doveva riaprire il preventivo. Adesso le voci si LEGGONO
     dal preventivo collegato (gest_preventivi.lavoro_id) e si mostrano qui.
     ⛔ Non si copiano: restano in un posto solo. Se il preventivo cambia,
        qui si vede subito. I conti sono quelli di sempre (impRiga, prevSconto). */
  async function renderLavPreventivo(lavoroId){
    const box=$("#lav-prev-wrap");if(!box)return;
    box.style.display="none";box.innerHTML="";
    if(!sb||!sbUid||!lavoroId)return;
    try{
      const {data:pp,error}=await sb.from("gest_preventivi").select("*")
        .eq("user_id",sbUid).eq("lavoro_id",lavoroId).is("eliminato_il",null).order("created_at",{ascending:false});
      if(error||!pp||!pp.length)return;
      const {data:rr}=await sb.from("gest_preventivo_righe").select("*")
        .in("preventivo_id",pp.map(p=>p.id)).order("ordine");
      const pro=ruoloUtente==='professionista';
      /* 27 nov 2026 (giro nuovo, sessione 7) — in forfettario niente «IVA esclusa» */
      if(typeof fattAziendaPronta==="function"){ try{ await fattAziendaPronta(); }catch(_){ } }
      const _forf=(typeof fattForfettario==="function")&&fattForfettario();
      const num=n=>String(+(+n||0).toFixed(3)).replace(".",",");
      let h="";
      pp.forEach(function(p){
        const R=(rr||[]).filter(r=>String(r.preventivo_id)===String(p.id));
        if(!R.length)return;
        const voci=R.filter(r=>!r.sezione);
        const somma=voci.reduce((t,r)=>t+impRiga(r.qta,r.prezzo),0);
        const sc=(typeof prevSconto==="function")?prevSconto(somma,p):0;
        h+='<div class="sh-tit">'+(pro?'Le prestazioni del preventivo N. ':'Le voci del preventivo N. ')+esc(String(p.numero||""))+'</div>'
          +'<div class="lpv-lista">'
          + R.map(function(r){
              if(r.sezione)return '<div class="lpv-sez">'+esc(r.descrizione||"")+'</div>';
              const q=(+r.qta)||1;
              return '<div class="lpv-riga"><div class="lpv-d">'+esc(r.descrizione||"")
                +'<small>'+num(q)+((typeof prevUnitaTesto==="function"&&prevUnitaTesto(r.unita))?' '+esc(prevUnitaTesto(r.unita)):'')+' × '+eur2(+r.prezzo||0)+'</small></div>'
                +'<div class="lpv-t">'+eur2(impRiga(r.qta,r.prezzo))+'</div></div>';
            }).join("")
          +(sc?'<div class="lpv-riga"><div class="lpv-d">Sconto</div><div class="lpv-t">− '+eur2(sc)+'</div></div>':'')
          +'<div class="lpv-riga lpv-tot"><div class="lpv-d">'+(_forf?'Totale':'Totale, IVA esclusa')+'</div><div class="lpv-t">'+eur2(_cent2(somma-sc))+'</div></div>'
          +'</div>'
          +'<button type="button" class="btn quick-add" data-action="lav-prev-apri" data-id="'+esc(String(p.id))+'">Apri il preventivo</button>';
      });
      if(!h)return;
      box.innerHTML=h;box.style.display="";
    }catch(_){}
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
  /* 15 nov 2026 (sesto giro, n. 5) — nel database il tipo resta «Agibilita'»
     (con l'apostrofo): quello che si SCRIVE in un titolo ha l'accento vero. */
  function praticaTipoScritto(t){
    t=String(t||"").trim();
    return t==="Agibilita'"?"Agibilità":t;
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
      const tipo=praticaTipoScritto((dati&&dati.pratica_tipo)||"");   /* 15 nov 2026: nel titolo «Agibilità» */
      const desc=String((dati&&dati.descrizione)||"").trim();
      const titolo=titoloScadenza(tipo,desc,pro);
      /* 11 nov 2026 — collaudo 3.4: si dicono solo gli avvisi che arriveranno
         davvero. Per un lavoro fra 9 giorni «30 giorni prima» non parte mai, e
         per un lavoro di oggi non ne parte nessuno: allora non si chiede. */
      const _gg=Math.round((new Date(data+"T12:00:00")-new Date(todayStr()+"T12:00:00"))/864e5);
      const _av=[[30,"30 giorni prima"],[7,"7 giorni prima"],[1,"il giorno prima"]].filter(x=>_gg>=x[0]).map(x=>x[1]);
      if(!_av.length)return;
      const _avT=_av.length===1?_av[0]:_av.slice(0,-1).join(", ")+" e "+_av[_av.length-1];
      if(!(await gconfirm("Vuoi che ti ricordi la data del "+fdate(data)+"?\n\n"
        +"Creo la scadenza \""+titolo+"\" collegata a "+(pro?"questa pratica":"questo lavoro")+" e ti avviso per email "+_avT+".")))return;
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

  /* ===== 7 novembre 2026 — LE INTEGRAZIONI NON SI BUCANO =====
     Quando una pratica passa a «Integrazioni richieste», il Comune di solito
     da' 30 giorni per mandarle: scaduti quelli la pratica si archivia. Qui si
     propone la scadenza collegata alla pratica (avvisi per email come le
     altre). La data si cambia dallo Scadenzario, se il Comune ne ha dato
     un'altra. Se c'e' gia' una scadenza aperta di integrazioni per questa
     pratica, non si chiede di nuovo. */
  async function proponiScadenzaIntegrazioni(lavId,dati){
    try{
      if(!sb||!sbUid||!lavId||ruoloUtente!=='professionista')return;
      const {data:gia,error}=await sb.from("gest_scadenze").select("id,tipo_pratica,stato")
        .eq("user_id",sbUid).eq("lavoro_id",lavId);
      if(error)return;
      if((gia||[]).some(x=>x.tipo_pratica==="Integrazione richiesta dal Comune"&&x.stato!=="fatta"))return;
      const t=new Date(todayStr()+"T12:00:00");t.setDate(t.getDate()+30);
      const data=t.toISOString().slice(0,10);
      const desc=String((dati&&dati.descrizione)||"").trim();
      const tipo=praticaTipoScritto((dati&&dati.pratica_tipo)||"");   /* 15 nov 2026: nel titolo «Agibilità» */
      /* 19 nov 2026 (voce Pratiche) — «Integrazioni CILA — CILA bagno Rossi»:
         il tipo si scriveva due volte se c'era gia' nella descrizione */
      const _base=titoloScadenza(tipo,desc,true);
      const titolo=(!desc&&!tipo)?"Integrazioni":(desc&&_base===desc)?("Integrazioni — "+desc):("Integrazioni "+_base).trim();
      if(!(await gconfirm("Il Comune ha chiesto le integrazioni.\n\nDi solito ci sono 30 giorni per mandarle: ti segno la scadenza al "+fdate(data)+"?\n\nTe la ricordo per email 7 giorni prima e il giorno prima. Se il Comune ti ha dato un'altra data, la cambi da «Scadenze e promemoria».")))return;
      const row={user_id:sbUid,mestiere_id:curMestiere(),titolo:titolo.slice(0,120),
        tipo_pratica:"Integrazione richiesta dal Comune",lavoro_id:lavId,
        cliente_id:(dati&&dati.cliente_id)||null,data_scadenza:data,stato:"aperta",avvisa:true};
      let {error:e2}=await sb.from("gest_scadenze").insert(row);
      if(e2&&(e2.message||"").indexOf("avvisa")>=0){ delete row.avvisa; ({error:e2}=await sb.from("gest_scadenze").insert(row)); }
      if(e2){toast("Scadenza non creata: "+e2.message);return;}
      rinfresca("scadenzario","riepilogo");
      toast("Scadenza delle integrazioni creata ✔ Te la ricordo per email");
    }catch(_){}
  }

  /* ===== 25 novembre 2026 — LE SCADENZE DI LEGGE DELLA PRATICA (sì di Alex, foto approvata) =====
     Regole NAZIONALI (DPR 380/2001, art. 15 e 23; L. 241/1990 art. 19):
     - SCIA «Depositata»: il Comune può bloccarla entro 30 giorni; lavori da
       iniziare entro 1 anno e finire entro 3 anni.
     - SCIA alternativa al PdC «Depositata»: si inizia dopo 30 giorni; poi
       1 anno per iniziare e 3 per finire, contati da quel giorno.
     - Permesso di Costruire «Approvata»: inizio entro 1 anno dal rilascio,
       fine entro 3 anni (dal rilascio: data prudente, si sposta se si inizia dopo).
     La CILA no: la legge nazionale non le dà termini (alcune Regioni sì).
     Base = «Data di deposito» (se manca, oggi); per il PdC il giorno in cui lo
     segni «Approvata». Una scadenza già presente (stesso tipo) non si rifà. */
  function _dataPiu(base,giorni,anni){
    const d=new Date(base+"T12:00:00");
    if(anni)d.setFullYear(d.getFullYear()+anni);
    if(giorni)d.setDate(d.getDate()+giorni);
    return d.toISOString().slice(0,10);
  }
  async function proponiScadenzeLegge(lavId,dati){
    try{
      if(!sb||!sbUid||!lavId||ruoloUtente!=='professionista'||!dati)return;
      const tipo=String(dati.pratica_tipo||"").trim(), st=dati.pratica_stato;
      const oggi=todayStr();
      let base, R, intro;
      if((tipo==="SCIA"||tipo==="SCIA alternativa al PdC")&&st==="depositata"){
        base=dati.pratica_data_dep||oggi;
        intro="Hai depositato la "+tipo+(base===oggi?" oggi":" il "+fdate(base))+".";
        if(tipo==="SCIA") R=[
          [_dataPiu(base,30,0),"Termine di legge: controllo del Comune sulla SCIA","il Comune può bloccarla fino a questo giorno (30 giorni)"],
          [_dataPiu(base,0,1),"Termine di legge: inizio lavori della SCIA","i lavori vanno iniziati entro questo giorno (1 anno)"],
          [_dataPiu(base,0,3),"Termine di legge: fine lavori della SCIA","i lavori vanno finiti entro questo giorno (3 anni)"]];
        else{ const ef=_dataPiu(base,30,0); R=[
          [ef,"Termine di legge: da qui si possono iniziare i lavori","da questo giorno puoi iniziare i lavori (30 giorni)"],
          [_dataPiu(ef,0,1),"Termine di legge: inizio lavori della SCIA alternativa","i lavori vanno iniziati entro questo giorno (1 anno)"],
          [_dataPiu(ef,0,3),"Termine di legge: fine lavori della SCIA alternativa","i lavori vanno finiti entro questo giorno (3 anni)"]]; }
      }else if(tipo==="Permesso di Costruire"&&st==="approvata"){
        base=oggi;
        intro="Hai segnato approvato il Permesso di Costruire oggi.";
        R=[[_dataPiu(base,0,1),"Termine di legge: inizio lavori del Permesso di Costruire","i lavori vanno iniziati entro questo giorno (1 anno)"],
           [_dataPiu(base,0,3),"Termine di legge: fine lavori del Permesso di Costruire","i lavori vanno finiti entro questo giorno (3 anni dall'inizio: se inizi dopo, spostala)"]];
      }else return;
      const {data:gia,error}=await sb.from("gest_scadenze").select("tipo_pratica,stato").eq("user_id",sbUid).eq("lavoro_id",lavId);
      if(error)return;
      const ci=new Set((gia||[]).filter(x=>x.stato!=="fatta").map(x=>x.tipo_pratica));
      R=R.filter(x=>!ci.has(x[1]));
      if(!R.length)return;
      if(!(await gconfirm(intro+"\n\nTi segno "+(R.length===1?"la scadenza":"le scadenze")+" di legge?\n\n"
        +R.map(x=>"• "+fdate(x[0])+" — "+x[2]).join("\n")
        +"\n\nTe le ricordo per email 30, 7 e 1 giorno prima. Sono le regole nazionali (DPR 380): se la Regione o il Comune ti hanno dato altre date, le cambi da «Scadenze e promemoria».")))return;
      const desc=String(dati.descrizione||"").trim();
      let fatte=0, err="";
      for(const x of R){
        const row={user_id:sbUid,mestiere_id:curMestiere(),titolo:(((t=>t.charAt(0).toUpperCase()+t.slice(1))(x[1].replace("Termine di legge: ","")))+(desc?" — "+desc:"")).slice(0,120),
          tipo_pratica:x[1],lavoro_id:lavId,cliente_id:dati.cliente_id||null,data_scadenza:x[0],stato:"aperta",avvisa:true};
        let {error:e2}=await sb.from("gest_scadenze").insert(row);
        if(e2&&(e2.message||"").indexOf("avvisa")>=0){ delete row.avvisa; ({error:e2}=await sb.from("gest_scadenze").insert(row)); }
        if(e2)err=e2.message; else fatte++;
      }
      rinfresca("scadenzario","riepilogo","calendario");
      toast(err?("Create "+fatte+" su "+R.length+": "+err):(fatte===1?"Scadenza di legge creata ✔":fatte+" scadenze di legge create ✔")+" Te le ricordo per email");
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
      +'</div></div>'
      /* 20 nov 2026 (sì di Alex, foto prima) — SOLO STUDIO: computo e stati
         di avanzamento di questa pratica (la direzione lavori). Prima il
         computo si collegava alla pratica ma dalla pratica non si vedeva. */
      /* 25 nov 2026 (sì di Alex, «facciamoli tutti») — anche impresa e
         artigiano: «Computo e acconti» di questo lavoro */
      +'<div class="sh-b"><div class="field campo-titolo"><label>\uD83D\uDCD0 '+(pro?'Computo e stati di avanzamento':'Computo e acconti')+'</label>'
        +'<div class="lav-media" id="lav-comp">Sto controllando…</div></div></div>';
  }
  /* il riquadro qui sopra: computi collegati a questa pratica e i loro SAL.
     I conti passano da compRiepilogo / salConti, come nel resto: nessuna copia. */
  async function renderLavComputi(){
    const box=$("#lav-comp");if(!box)return;
    const lav=editing&&editing.realId;
    const pro=ruoloUtente==='professionista';
    const P=pro?{q:'questa pratica',sal:'SAL',salN:'SAL n. ',fatto:'eseguito finora ',rib:'ribasso ',senza:'senza ribasso',nuovoSal:'+ Nuovo stato di avanzamento',
        prima:'Salva prima la pratica: poi qui vedi il suo computo e i SAL.',scegli:'Nel computo, alla pagina «La scheda», scegli questa pratica: il computo e i suoi SAL compaiono qui.',
        err:'Non riesco a leggere computo e SAL: controlla la connessione e riapri la pratica.'}
      :{q:'questo lavoro',sal:'acconti',salN:'Acconto n. ',fatto:'fatto finora ',rib:'sconto ',senza:'senza sconto',nuovoSal:'+ Nuovo acconto',
        prima:'Salva prima il lavoro: poi qui vedi il suo computo e gli acconti.',scegli:'Nel computo, alla pagina «La scheda», scegli questo lavoro: il computo e i suoi acconti compaiono qui.',
        err:'Non riesco a leggere computo e acconti: controlla la connessione e riapri il lavoro.'};
    if(!lav){box.innerHTML='<div class="lm-vuoto">'+P.prima+'</div>';return;}
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}
    try{
      const rc=await sb.from("gest_computi").select("*").eq("user_id",sbUid).eq("lavoro_id",lav).order("data",{ascending:false});
      if(rc.error)throw rc.error;
      const C=rc.data||[];
      if(!C.length){
        box.innerHTML='<div class="lm-conta">Nessun computo collegato a '+P.q+'</div>'
          +'<div class="lm-vuoto">'+P.scegli+'</div>'
          /* 24 nov 2026 (giro dello studio) — il computo si fa anche da qui */
          +'<button type="button" class="btn btn-sm" data-action="new-computo-pre" data-lav="'+esc(String(lav))+'">+ Nuovo computo per '+P.q+'</button>';
        return;
      }
      const ids=C.map(c=>c.id);
      const [rv,rk,rs,rt]=await Promise.all([
        sb.from("gest_computo_voci_calc").select("computo_id,capitolo_id,quantita,prezzo_unitario,importo,oneri_sicurezza,incidenza_manodopera").eq("user_id",sbUid).in("computo_id",ids),
        sb.from("gest_computo_capitoli").select("id,computo_id,sicurezza").eq("user_id",sbUid).in("computo_id",ids),
        sb.from("gest_sal").select("*").eq("user_id",sbUid).in("computo_id",ids).order("numero",{ascending:false}),
        sb.from("gest_sal_totali").select("*").eq("user_id",sbUid).in("computo_id",ids)
      ]);
      if(rs.error||rt.error)throw (rs.error||rt.error);
      const tot={};(rt.data||[]).forEach(t=>{tot[String(t.sal_id)]=t;});
      let h='';
      C.forEach(function(c){
        let imp=null;
        try{
          if(!rv.error&&typeof compRiepilogo==="function"){
            const V=(rv.data||[]).filter(v=>String(v.computo_id)===String(c.id));
            const K=(rk.data||[]).filter(k=>String(k.computo_id)===String(c.id));
            imp=compRiepilogo(V,c,K).netto;
          }
        }catch(_){imp=null;}
        h+='<div class="lsc-r"><div class="lsc-info"><b>Computo — '+esc(c.titolo||"senza titolo")+'</b>'
          +'<small>'+(c.ribasso_perc?(P.rib+String(c.ribasso_perc).replace(".",",")+'%'):P.senza)+'</small></div>'
          +'<span class="lsc-q">'+(imp!=null?eur2(imp):'')+'</span>'
          +'<button type="button" class="btn lsc-apri" data-action="lav-comp-apri" data-id="'+esc(String(c.id))+'" data-lav="'+esc(String(lav))+'">Apri</button></div>';
        (rs.data||[]).filter(x=>String(x.computo_id)===String(c.id)).forEach(function(s){
          const k=salConti(tot[String(s.id)],c);
          h+='<div class="lsc-r"><div class="lsc-info"><b>'+P.salN+esc(String(s.numero||""))+' · '+((s.stato||"bozza")==="emesso"?'emesso':'bozza')+'</b>'
            +'<small>'+esc(fdate(s.data))+' · '+P.fatto+eur2(k.maturato)+'</small></div>'
            +'<span class="lsc-q">'+eur2(k.netto)+'</span>'
            +'<button type="button" class="btn lsc-apri" data-action="lav-sal-apri" data-id="'+esc(String(s.id))+'" data-comp="'+esc(String(c.id))+'" data-lav="'+esc(String(lav))+'">Apri</button></div>';
        });
      });
      h+='<button type="button" class="btn-ghost quick-add" data-action="lav-sal-nuovo" data-comp="'+esc(String(C[0].id))+'" data-lav="'+esc(String(lav))+'">'+P.nuovoSal+'</button>';
      box.innerHTML=h;
    }catch(e){
      box.innerHTML='<div class="lm-vuoto">'+P.err+'</div>';
    }
  }
  async function renderLavScadenze(){
    try{ renderLavComputi(); }catch(_){}
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
        +  (fatta?'fatta':(rit?'scaduta '+q.testo:q.testo))
        +  ((x.data_scadenza&&!/^\d/.test(q.testo||''))?'<small class="lsc-d">'+esc(fdate(x.data_scadenza))+'</small>':'')+'</span>'   /* la data solo se «fra 12 giorni»: «10 gen» la dice gia' */
        /* 19 nov 2026 (sì di Alex) — la scadenza si apre da qui; chiusa, si torna nella pratica */
        +'<button type="button" class="btn lsc-apri" data-action="scad-da-pratica-apri" data-id="'+esc(String(x.id))+'" data-lav="'+esc(String(lav))+'">Apri</button>'
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
    const {data}=await sb.from("gest_clienti").select("id,nome,indirizzo,cap,citta,prov").eq("user_id",sbUid).or(_cliOr(curMestiere())).order("nome");
    sel.innerHTML=`<option value="">— nessuno —</option>`+(data||[]).map(c=>`<option value="${esc(c.id)}" ${c.id===selId?"selected":""}>${esc(c.nome)}</option>`).join("");
    /* 21 ott 2026 — scegliendo il cliente, il «Dove» si riempie col suo
       indirizzo, se e' vuoto. Se l'avevi gia' scritto tu non si tocca; se
       l'aveva messo lui da un altro cliente, si aggiorna. */
    const dove=$("#j-dove"); if(!dove)return;
    const ind=c=>{if(!c)return "";const luogo=[c.cap,c.citta].filter(x=>x&&String(x).trim()).join(" ")+(c.prov?" ("+c.prov+")":"");
      return [c.indirizzo,luogo].map(x=>String(x||"").trim()).filter(Boolean).join(", ");};
    sel.addEventListener("change",function(){
      const c=(data||[]).find(x=>String(x.id)===String(sel.value));
      const v=ind(c);
      if(!dove.value.trim()||dove.value===dove.dataset.auto){ dove.value=v; dove.dataset.auto=v; }
    });
  }
  function bindSeg(id){$$("#"+id+" button").forEach(b=>b.onclick=()=>{$$("#"+id+" button").forEach(x=>x.classList.remove("on"));b.classList.add("on");});}
  function segVal(id){const e=$("#"+id+" button.on");return e?e.dataset.v:"";}

  async function saveJob(){
    if(editing&&editing.supa){
      if(!sbUid){toast("Devi essere loggato");return;}
      const descrizione=$("#j-desc").value.trim(), data_prevista=$("#j-data").value, operatore_id=$("#j-operaio")?$("#j-operaio").value:"";
      /* 11 nov 2026 — collaudo 3.4: la casella che manca si segna (campoManca) */
      if(!descrizione){campoManca($("#j-desc"),"Manca cosa c'è da fare: scrivilo qui.");return;}
      /* 19 nov 2026 (voce Pratiche) — la pratica puo' nascere senza data (si aspetta il Comune) */
      /* 27 nov 2026 — un lavoro gia' fatto senza data (nato da un preventivo) si salva anche senza */
      if(!data_prevista&&ruoloUtente!=='professionista'&&!editing.id){campoManca($("#j-data"),"Manca la data: mettila qui.");return;}
      const importo=_numIt("#j-imp")||0;
      if(editing.fattura&&!(importo>0)){campoManca($("#j-imp"),"Manca l'importo: scrivilo qui.");return;}
      const cliente_id=($("#j-cliente")&&$("#j-cliente").value)?$("#j-cliente").value:null;
      const obj=Object.assign({user_id:sbUid,mestiere_id:curMestiere(),stato:editing.fattura?"fatto":"da_fare",
        descrizione,dove:$("#j-dove").value.trim(),data_prevista:data_prevista||null,operatore_id:operatore_id||null,importo,cliente_id},
        leggiCampiPratica());
      /* 28 nov 2026 — allo studio lo stato nasce dal punto della pratica */
      if(ruoloUtente==='professionista'&&!editing.fattura&&obj.pratica_stato){obj.stato=praStatoDa(obj.pratica_stato,"da_fare");if(obj.stato==="fatto")obj.data_fatto=todayStr();}
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
      if(obj.pratica_stato==="integrazioni")await proponiScadenzaIntegrazioni(realId,obj);
      if(obj.pratica_stato==="depositata"||obj.pratica_stato==="approvata")await proponiScadenzeLegge(realId,obj);
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
      /* 28 nov 2026 — allo studio lo stato e' quello del punto della pratica */
      if(ruoloUtente==='professionista'&&mod.pratica_stato)mod.stato=praStatoDa(mod.pratica_stato,mod.stato);
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
      /* 7 nov 2026 — lo stato della pratica PRIMA di salvare: la scadenza
         delle integrazioni si propone solo quando ci si ARRIVA adesso */
      let _statoPraticaPrima=null;
      if(mod.pratica_stato==="integrazioni"||mod.pratica_stato==="depositata"||mod.pratica_stato==="approvata"){
        try{
          const {data:_s}=await sb.from("gest_lavori").select("pratica_stato")
            .eq("id",editing.realId).eq("user_id",sbUid).maybeSingle();
          _statoPraticaPrima=_s?_s.pratica_stato:null;
        }catch(e){}
      }
      const _idPratica=editing.realId;
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
      if(mod.pratica_stato==="integrazioni"&&_statoPraticaPrima!=="integrazioni"&&!avvisoPratica2)
        await proponiScadenzaIntegrazioni(_idPratica,mod);
      /* 25 nov 2026 — scadenze di legge quando la pratica ARRIVA a Depositata/Approvata */
      if((mod.pratica_stato==="depositata"||mod.pratica_stato==="approvata")&&_statoPraticaPrima!==mod.pratica_stato&&!avvisoPratica2)
        await proponiScadenzeLegge(_idPratica,mod);
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
    const tipoCli=(c.tipo==='azienda'||c.tipo==='condominio'||c.tipo==='ente')?c.tipo:'privato';
    const LAB_T={privato:{nome:'Nome e cognome',ph:'Es. Mario Rossi',ref:'Referente (se diverso)'},
                 azienda:{nome:'Ragione sociale',ph:'Es. Rossi Costruzioni Srl',ref:'Referente'},
                 condominio:{nome:'Nome condominio',ph:'Es. Condominio Via Roma 12',ref:'Amministratore'},
                 /* 24 nov 2026 — ente pubblico (sì di Alex): Comune, scuola, ASL */
                 ente:{nome:"Nome dell'ente",ph:'Es. Comune di Rieti',ref:'Ufficio o responsabile'}};
    const Lt=LAB_T[tipoCli];
    const T_TIT={privato:"Nuovo cliente privato",azienda:"Nuova azienda",condominio:"Nuovo condominio",ente:"Nuovo ente pubblico"};
    /* 6 nov 2026 — IL MODULO PIU' CORTO. Prima si apriva con 12 caselle
       insieme anche per un privato. Adesso si vedono nome, telefono, email e
       indirizzo; i dati per la fattura (P.IVA, codice fiscale, codice
       destinatario, PEC) stanno dietro un pulsante e si aprono da soli se
       servono: azienda o condominio, un dato gia' scritto, il controllo
       «Controlla che sia giusto», o l'AI che li riempie. Nessun campo
       sparisce: sono tutti nel modulo, come prima. */
    const _fiscPieno=!!(c.piva||c.cod_fiscale||c.sdi_codice||c.sdi_pec);
    const _fiscAperto=tipoCli!=='privato'||_fiscPieno;
    const _refVis=tipoCli!=='privato'||!!c.referente;
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
            <button type="button" class="tipo-btn${tipoCli==='ente'?' on':''}" data-t="ente" onclick="setTipoCliente(this)">Ente pubblico<small>Comune, scuola, ASL</small></button>
          </div>
        </div>
        <div class="field"><label id="lab-c-nome">${Lt.nome}</label>
          <input id="c-nome" value="${esc(c.nome||"")}" placeholder="${Lt.ph}"></div>
        <div class="field" id="c-ref-f"${_refVis?'':' style="display:none"'}><label id="lab-c-ref">${Lt.ref}</label><input id="c-ref" value="${esc(c.referente||"")}" placeholder="Es. Mario Rossi"></div>
        <div class="row2">
          <div class="field"><label>Telefono</label><input id="c-tel" type="tel" value="${esc(c.telefono||"")}" placeholder="Es. 0746 123456"></div>
          <div class="field"><label>Email</label><input id="c-email" type="email" value="${esc(c.email||"")}" placeholder="cliente@email.it"></div>
        </div>
        <div class="sh-nota">L'email serve per mandargli preventivi e fatture. Non &egrave; la PEC: quella sta nei dati per la fattura.</div>
      </div>

      <div class="sh-b">
        <div class="sh-tit">Note</div>
        <div class="field"><textarea id="c-note" rows="3" placeholder="Es. chiamare dopo le 18, citofono Rossi, paga sempre a 30 giorni">${esc(c.note||"")}</textarea></div>
        <div class="sh-nota">Le vedi solo tu, nella sua scheda. Non escono su preventivi e fatture.</div>
      </div>

      </div><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Dove sta</div>
        <div class="field"><label>Via e numero</label><input id="c-ind" value="${esc(c.indirizzo||"")}" placeholder="Es. Via Roma, 12"></div>
        <div class="row2">
          <div class="field"><label>CAP</label><input id="c-cap" value="${esc(c.cap||"")}" ${window.paeseEstero&&window.paeseEstero(c)?'placeholder="Es. CH-6900" maxlength="12"':'placeholder="Es. 02100" inputmode="numeric" maxlength="5"'}></div>
          <div class="field"><label>Città</label><input id="c-citta" value="${esc(c.citta||"")}" placeholder="Es. Rieti"></div>
        </div>
        <div class="row2">
          <div class="field"><label>Paese</label>${window.paeseTendina?window.paeseTendina("c-paese",c.paese):""}</div>
          <div class="field"${window.paeseEstero&&window.paeseEstero(c)?' style="display:none"':''}><label>Provincia</label>
            <input id="c-prov" value="${esc(c.prov||"")}" placeholder="Es. RI" maxlength="2" style="max-width:120px;text-transform:uppercase"></div>
        </div>
      </div>

      <button type="button" class="btn" id="c-fisc-apri" style="width:100%;min-height:54px;height:auto;white-space:normal;line-height:1.35;padding:12px 16px;font-size:18px;font-weight:700;justify-content:flex-start;text-align:left;${_fiscAperto?'display:none':''}">+ Dati per la fattura <span style="font-weight:400">(codice fiscale, partita IVA, PEC)</span></button>
      <div id="c-fisc-box"${_fiscAperto?'':' style="display:none"'}>
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
        <div class="field"><label id="lab-c-sdi">${tipoCli==='ente'?'Codice univoco ufficio (6 caratteri)':'Codice destinatario'}</label>
          <input id="c-sdi" value="${esc(c.sdi_codice||"")}" placeholder="7 caratteri" maxlength="7" style="text-transform:uppercase"></div>
        <div class="field"><label>PEC</label><input id="c-pec" type="email" value="${esc(c.sdi_pec||"")}" placeholder="cliente@pec.it"></div>
        <div class="sh-nota" id="nota-c-ente"${tipoCli==='ente'?'':' style="display:none"'}><b>Ente pubblico:</b> serve il codice univoco dell'ufficio (6 caratteri), te lo dà l'ente o lo trovi su indicepa.gov.it. La PEC da sola non basta. In fattura metto la scissione dei pagamenti: l'IVA la versa l'ente.</div>
        <div class="sh-nota">Te li dà il cliente. Uno dei due basta. Se non ha né l'uno né l'altro — capita con i privati — si usa <b>0000000</b> e la fattura gli arriva nel cassetto fiscale.</div>
      </div>
      </div>

      </div></div>`,
      `${ctrTastoHTML('cliente')}
       <button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-cli" data-id="${c.id||""}">${isNew?"Crea":"Salva"}</button>`);
    cliFiscSorveglia();
    if(isNew)aiRigaVia('cliente',!!aiApri);
    ctrAscolta('cliente');
  }
  /* 6 nov 2026 — apre i dati per la fattura nascosti.
     Si aprono da soli quando: si preme il pulsante, si preme «Controlla che
     sia giusto» (il controllo puo' segnare proprio quelle caselle), oppure
     una di quelle caselle riceve un valore (l'AI che compila, il dettato).
     Il controllo gira solo finche' il modulo e' aperto. */
  function cliFiscApri(){
    const b=document.getElementById("c-fisc-box"), t=document.getElementById("c-fisc-apri");
    if(b)b.style.display=""; if(t)t.style.display="none";
  }
  window.cliFiscApri=cliFiscApri;
  function cliFiscSorveglia(){
    const t=document.getElementById("c-fisc-apri");
    if(t)t.onclick=cliFiscApri;
    const ctr=document.querySelector('#sheet [data-action="ctr-guarda"][data-ctr="cliente"]');
    if(ctr)ctr.addEventListener("click",cliFiscApri);
    const giro=setInterval(function(){
      const b=document.getElementById("c-fisc-box");
      if(!b){clearInterval(giro);return;}
      const rf=document.getElementById("c-ref-f"), ri=document.getElementById("c-ref");
      if(rf&&rf.style.display==="none"&&ri&&String(ri.value||"").trim())rf.style.display="";
      if(b.style.display!=="none")return;
      if(["c-piva","c-cf","c-sdi","c-pec"].some(function(id){const e=document.getElementById(id);return e&&String(e.value||"").trim();}))cliFiscApri();
    },600);
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
                      fisc:"Un condominio ha il codice fiscale, non la partita IVA."},
             ente:{nome:"Nome dell'ente",ph:"Es. Comune di Rieti",ref:"Ufficio o responsabile",
                      fisc:"Un ente pubblico ha il codice fiscale di 11 cifre (a volte anche la partita IVA)."}}[t];
    const ls=document.getElementById("lab-c-sdi"); if(ls) ls.textContent=t==="ente"?"Codice univoco ufficio (6 caratteri)":"Codice destinatario";
    const ne=document.getElementById("nota-c-ente"); if(ne) ne.style.display=t==="ente"?"":"none";
    const ln=document.getElementById("lab-c-nome"); if(ln) ln.textContent=L.nome;
    const inp=document.getElementById("c-nome");    if(inp) inp.placeholder=L.ph;
    const lr=document.getElementById("lab-c-ref");  if(lr) lr.textContent=L.ref;
    const nf=document.getElementById("nota-c-fisc");if(nf) nf.textContent=L.fisc;
    /* 6 nov 2026 — un'azienda o un condominio i dati fiscali li hanno sempre:
       si aprono. Il referente/amministratore si vede; per un privato no,
       a meno che non sia gia' scritto. */
    if(t!=="privato")cliFiscApri();
    const rf=document.getElementById("c-ref-f"), ri=document.getElementById("c-ref");
    if(rf)rf.style.display=(t!=="privato"||(ri&&String(ri.value||"").trim()))?"":"none";
    /* anche il titolo in cima segue il bottone: prima restava quello di partenza
       e leggevi "Nuova azienda" con Privato acceso */
    const ht=document.querySelector("#sheet .sh-head h3");
    if(ht&&/^Nuov/.test(ht.textContent||"")){
      ht.textContent={privato:"Nuovo cliente privato",azienda:"Nuova azienda",condominio:"Nuovo condominio",ente:"Nuovo ente pubblico"}[t];
    }
  };


