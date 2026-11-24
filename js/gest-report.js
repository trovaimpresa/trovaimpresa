  /* ============================================================
     REPORT — staccato il 6 settembre 2026
     Fetta G dello smontaggio di gestionale-app.html.

     I numeri del reparto messi in fila: incassato, da incassare, spese,
     margine, e il confronto fra i mesi. Piu' reportCsv, che li porta fuori
     in un foglio per Excel.

     ⚠️ QUI NON SI INVENTA NESSUN CONTO. I numeri arrivano dalle stesse
     viste che serve il Riepilogo: se un domani cambia una regola, cambia
     nel database e il Report la segue da solo. Se ti accorgi che il Report
     e il Riepilogo dicono cifre diverse, il difetto non e' qui: e' che
     qualcuno ha rifatto un conto a mano da una parte sola. E' gia'
     successo col noleggio prenotato, il 6 settembre.

     ⚠️ _fetchAllExport ed esportaExcel NON sono qui: sono il backup di
     tutto il gestionale, un'altra cosa, e sono rimasti nella pagina.

     ⚠️ FILE APERTO (niente IIFE): vive nello stesso spazio della pagina.
     ============================================================ */

  let repData=null;
  /* 21 nov 2026 (studio, voce Report) — le parole dello studio scritte alla
     FONTE. Il traduttore della pagina cambiava solo alcune frasi dello schermo
     («Manodopera 100,00 €», «Spese nei lavori», «ogni lavoro» restavano) e non
     arriva per niente al PDF e al file per Excel, che uscivano da cantiere
     («Ore per operatore», «Guadagno o perdita per lavoro»). */
  function _repPro(){ return typeof ruoloUtente!=="undefined" && ruoloUtente==="professionista"; }
  function _repW(){
    const p=_repPro();
    return {
      lav:   p?"Pratica":"Lavoro",
      perLav:p?"Guadagno o perdita per pratica":"Guadagno o perdita per lavoro",
      imp:   p?"Importo della pratica":"Importo del lavoro",
      md:    p?"Tempo speso":"Manodopera",
      mdTot: p?"Tempo speso dai collaboratori (ore × costo orario)":"Manodopera (ore × costo orario)",
      spLav: p?"Spese nelle pratiche":"Spese nei lavori",
      uscite:p?"Uscite = spese + fornitori + tempo speso.":"Uscite = spese + fornitori + manodopera.",
      valore:p?"Valore delle pratiche":"Valore dei lavori",
      oreTit:p?"Ore per collaboratore":"Ore per operatore",
      chi:   p?"Collaboratore":"Operatore"
    };
  }
  /* 12 nov 2026 — regola 19: uno zero è grigio e senza segno (prima «−0,00 €») */
  function _repZero(v,segno){
    return (+v||0)===0 ? '<td style="color:#5f6b7a">'+eur(0)+'</td>'   /* lo stesso grigio di .fp-zero in Tasse e fisco */
                       : '<td style="color:var(--testo)">'+segno+eur(v)+'</td>';
  }
  async function renderReport(){
    const box=$("#rep-body");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=tabVuoto("Nessun dato","Accedi per vedere i report.",
      _SVGV+'<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>');return;}
    const mid=curMestiere();
    const _rR=await Promise.all([
      sb.from("gest_lavori").select("id,descrizione,stato,importo,fatt_stato,data_prevista,data_fatto,ore,cliente_id,operatore_id").eq("user_id",sbUid).eq("mestiere_id",mid),
      /* 24 nov 2026 (collaudo Cestino dello studio) — cliente o collaboratore
         nel Cestino: le sue ore e la sua classifica restavano, ma col nome «—».
         Si leggono anche quelli nel Cestino, col nome «… (nel cestino)». */
      (sb.raw?sb.raw("gest_clienti"):sb.from("gest_clienti")).select("id,nome,eliminato_il").eq("user_id",sbUid).or(_cliOr(mid)),
      (sb.raw?sb.raw("gest_operatori"):sb.from("gest_operatori")).select("id,nome,eliminato_il").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);
    /* 12 nov 2026 — regola 20: senza rete non si scrivono guadagni a zero */
    if(letturaKo(_rR[0])){listaNonLetta(box,"il report","report");return;}
    const _nelC=x=>Object.assign({},x,{nome:(x.nome||"")+(x.eliminato_il?" (nel cestino)":"")});
    const [{data:lav},{data:_cl0},{data:_ops0}]=_rR;
    const cl=(_cl0||[]).map(_nelC), ops=(_ops0||[]).map(_nelC);
    const L=lav||[];
    let SP=[];
    if(L.length){const {data:sp}=await sb.from("gest_spese").select("importo,data,lavoro_id").eq("user_id",sbUid).in("lavoro_id",L.map(l=>l.id));SP=sp||[];}
    /* ---- spese fatte con le carte aziendali ----
       Prima il Report le ignorava del tutto: guardava solo le spese scritte dentro
       i lavori, quindi l'utile risultava più alto del vero. Ora entrano nel conto,
       ma restano una voce separata così si capisce sempre da dove viene il numero. */
    /* ===== 9 agosto 2026 — l'incassato si legge dalle FATTURE =====
       Prima il Report lo calcolava da gest_lavori.fatt_stato, che pero' si
       aggiorna solo per le fatture nate da un lavoro agganciato: una fattura
       fatta da preventivo o da zero non toccava nessun lavoro. Risultato:
       Riepilogo e Report davano due numeri diversi per la stessa cosa, e chi
       fattura sempre da preventivo leggeva "Incassato 0".
       Le fatture pagate sono la fonte vera: è li' che stanno i soldi. */
    let FT=[], FTR=[];
    try{
      /* "*" e non l'elenco delle colonne: chiedendo cassa_perc e spese, se la
         migrazione della cassa non è stata eseguita PostgREST risponde 400,
         FT resta vuoto e tutto l'incassato del Report va a ZERO senza dirlo.
         (9/8/2026 — trovato subito dopo averlo scritto.) */
      const {data:ft}=await sb.from("gest_fatture").select("*")
        .eq("user_id",sbUid).eq("mestiere_id",mid);
      FT=ft||[];
      if(FT.length){
        const {data:fr}=await sb.from("gest_fattura_righe").select("fattura_id,qta,prezzo,iva")
          .eq("user_id",sbUid).in("fattura_id",FT.map(f=>f.id));
        FTR=fr||[];
      }
    }catch(e){ FT=[]; FTR=[]; }
    /* l'imponibile di ogni fattura: è il numero confrontabile con l'importo
       dei lavori, senza IVA (che non è tuo) */
    const righePerFatt={};
    FTR.forEach(r=>{(righePerFatt[r.fattura_id]=righePerFatt[r.fattura_id]||[]).push(r);});
    const impFatt={};
    FT.forEach(f=>{impFatt[f.id]=fattImponibile(f,righePerFatt[f.id]);});
    const _dataInc=f=>String(f.data_pagata||f.data||"");
    const pagate=FT.filter(f=>f.stato==="pagata");
    /* Chi non usa la sezione Fatture (tante imprese segnano l'incasso sul
       lavoro e basta) non deve vedere l'incassato crollare a zero: se non
       c'e' NESSUNA fattura si torna al vecchio conteggio sui lavori.
       Se le fatture ci sono comandano loro, se no si conterebbe due volte. */
    const _daLavori=!FT.length;
    const _incassoIn=(chiave,lung)=>_daLavori
      ? L.filter(l=>l.fatt_stato==="pagata"&&(l.data_fatto||"").slice(0,lung)===chiave).reduce((s,l)=>s+(+l.importo||0),0)
      : pagate.filter(f=>_dataInc(f).slice(0,lung)===chiave).reduce((s,f)=>s+(impFatt[f.id]||0),0);

    /* ===== 9 agosto 2026 — i pieni pagati in contanti =====
       Solo i rifornimenti con carta finivano nei costi, e ci finivano di
       rimbalzo perché creano un movimento carta. Quelli in contanti o coi
       buoni non entravano da nessuna parte: un'impresa che fa metà dei pieni
       in contanti vedeva un utile più alto del vero.
       Si contano quelli SENZA movimento_id: gli altri sono già dentro i
       movimenti delle carte e conterebbero due volte. */
    /* ===== 9 agosto 2026 — le fatture dei fornitori nei costi =====
       Erano registrate, collegate al lavoro, e non le leggeva nessuno: il
       margine guardava solo gest_spese. Ora entrano, ma su una RIGA LORO:
       se qualcuno segna la stessa spesa due volte (una come Spesa del lavoro
       e una come fattura fornitore) si vede subito da dove viene il numero. */
    let FF=[];
    try{
      const {data:ff}=await sb.from("gest_fatture_fornitori").select("importo,data,lavoro_id,stato")
        .eq("user_id",sbUid).eq("mestiere_id",mid);
      FF=ff||[];
    }catch(e){ FF=[]; }
    const ffIn=(chiave,lung)=>FF.filter(f=>String(f.data||"").slice(0,lung)===chiave)
                                .reduce((s,f)=>s+(+f.importo||0),0);
    const totFF=FF.reduce((s,f)=>s+(+f.importo||0),0);

    let RIF=[];
    try{
      /* ⛔ 4 settembre 2026 — LO STESSO FILTRO DEL RIEPILOGO. Il 13 agosto
         il filtro sul reparto era stato messo nel Riepilogo e non qui: il
         Report contava i pieni in contanti di TUTTI i reparti, il Riepilogo
         solo quelli di questo. Misurato: un pieno da 100 € nel reparto
         Giardinaggio abbassava l'utile del reparto Edilizia nel Report e non
         nel Riepilogo. Come la', si prendono anche i pieni SENZA reparto
         (quelli registrati prima che la colonna esistesse). */
      const {data:rf}=await sb.from("gest_rifornimenti").select("importo,data,movimento_id,mezzo_id")
        .eq("user_id",sbUid).or("mestiere_id.eq."+mid+",mestiere_id.is.null");
      RIF=(rf||[]).filter(r=>!r.movimento_id);
    }catch(e){ RIF=[]; }
    const rifIn=(chiave,lung)=>RIF.filter(r=>String(r.data||"").slice(0,lung)===chiave)
                                  .reduce((s,r)=>s+(+r.importo||0),0);
    const totRif=RIF.reduce((s,r)=>s+(+r.importo||0),0);

    /* ⛔ 4 settembre 2026 — IL NOLEGGIO INTERNO ANCHE QUI. Dal 24 agosto il
       Riepilogo conta come spesa del reparto il mezzo del tuo Noleggio dato a
       questo reparto (nol_noleggi con mestiere_id). Il Report non lo sapeva:
       stesso mese, due utili diversi. Stessa lettura e stessa data che conta
       (l'uscita del mezzo), cosi' i due numeri sono uno solo. */
    let NOL=[];
    try{
      const {data:nl}=await sb.from("nol_noleggi").select("importo,data_uscita,fase")
        .eq("user_id",sbUid).eq("mestiere_id",mid);
      /* 6 settembre 2026 — stessa regola del Riepilogo: un mezzo ancora
         prenotato non e' una spesa. Se i due filtri si scollano, il Riepilogo
         e il Report tornano a dire due utili diversi. */
      NOL=(nl||[]).filter(n=>(n.fase||'fuori')!=='prenotato');
    }catch(e){ NOL=[]; }
    const nolIn=(chiave,lung)=>NOL.filter(n=>String(n.data_uscita||"").slice(0,lung)===chiave)
                                  .reduce((s,n)=>s+(+n.importo||0),0);
    const totNol=NOL.reduce((s,n)=>s+(+n.importo||0),0);

    let CM=[], CARTE=[];
    try{
      /* 19 nov 2026 — anche le carte nel Cestino, come il Riepilogo (13 agosto):
         le spese fatte con una carta poi eliminata sono uscite davvero. Prima
         mettendo la carta nel Cestino il Report toglieva le sue spese e il
         margine saliva da solo; il Riepilogo invece le teneva. */
      const _sbCarte=(sb.raw||sb.from.bind(sb));
      const {data:ca}=await _sbCarte("gest_carte").select("id,nome,stato").eq("user_id",sbUid).eq("mestiere_id",mid);
      CARTE=ca||[];
      if(CARTE.length){
        const {data:mv}=await sb.from("gest_carte_movimenti").select("id,tipo,importo,causale,data,created_at,carta_id")
          .eq("user_id",sbUid).in("carta_id",CARTE.map(c=>c.id));
        CM=(mv||[]).filter(m=>m.tipo==="spesa");
      }
    }catch(e){}
    const carteNome=Object.fromEntries(CARTE.map(c=>[c.id,c.nome||"Carta"]));
    const totCarte=CM.reduce((t,m)=>t+(+m.importo||0),0);
    repData={L,cl:cl||[],ops:ops||[],SP,FF:FF,md:null};   /* md arriva piu' sotto */
    const cliMap=Object.fromEntries((cl||[]).map(c=>[c.id,c.nome]));
    const opMap=Object.fromEntries((ops||[]).map(o=>[o.id,o.nome]));
    /* ultimi 12 mesi: a 6 il grafico era una fila di barrette minuscole e non si
       vedeva la stagionalita' (l'anno intero, non mezzo). Altezza barre 160px. */
    const H_BAR=160;
    const now=new Date(), mkeys=[];
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);mkeys.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));}
    const inc=mkeys.map(k=>_incassoIn(k,7));
    /* anche il grafico dei 12 mesi conta tutti i costi, se no la barra delle
       spese dice una cosa e i totali storici più sotto ne dicono un'altra */
    const spm=mkeys.map(k=>
      SP.filter(x=>(x.data||"").slice(0,7)===k).reduce((s,x)=>s+(+x.importo||0),0)
      +CM.filter(m=>String(m.data||m.created_at||"").slice(0,7)===k).reduce((s,m)=>s+(+m.importo||0),0)
      +rifIn(k,7)+ffIn(k,7)+nolIn(k,7));
    const mx=Math.max(...inc,...spm,1);
    /* 19 nov 2026 (sì di Alex) — I NUMERI DEL MESE scritti in chiaro: sul
       telefono le barre non dicono le cifre (il «title» col dito non si vede).
       Sono gli stessi due numeri dell'ultima colonna del grafico, e l'utile e'
       lo stesso del Riepilogo (incassato − spese, la manodopera non c'e'). */
    const mNome=(m=>m.charAt(0).toUpperCase()+m.slice(1))(mesi[now.getMonth()]), mInc=inc[11], mSp=spm[11], mUt=mInc-mSp;
    const meseBox=`<div class="rep-mese">
        <div><small>${mNome} · incassato</small><b>${eur(mInc)}</b></div>
        <div><small>${mNome} · spese</small><b>${mSp?"−"+eur(mSp):eur(0)}</b></div>
        <div><small>${mNome} · utile</small><b class="${mUt>0?"rep-ok":mUt<0?"rep-err":""}">${mUt<0?"−":""}${eur(Math.abs(mUt))}</b></div></div>`;
    const hBar=v=>v>0?Math.max(Math.round(v/mx*H_BAR),2):0;
    const bars=mkeys.map((k,i)=>{
      const lab=mesi[+k.slice(5,7)-1].slice(0,3);
      return `<div class="rep-bar-col"><div class="rep-bars">
        <div class="rep-bar inc" style="height:${hBar(inc[i])}px" title="Incassato ${eur(inc[i])}"></div>
        <div class="rep-bar sp" style="height:${hBar(spm[i])}px" title="Spese ${eur(spm[i])}"></div></div>
        <span class="rep-bar-lab${(11-i)%2?" rep-lab-alt":""}">${lab}</span></div>`;
    }).join("");
    /* top clienti */
    const perCli={};
    L.forEach(l=>{if(!l.cliente_id||!(+l.importo))return;perCli[l.cliente_id]=(perCli[l.cliente_id]||0)+(+l.importo||0);});
    const topCli=Object.entries(perCli).sort((a,b)=>b[1]-a[1]).slice(0,5);
    /* ore per operatore */
    /* 12 nov 2026 — spostato piu' sotto, dopo caricaManodopera: le ore si contano
       dalle stesse righe che fanno il costo della manodopera. */
    const totInc=_daLavori
      ? L.filter(l=>l.fatt_stato==="pagata").reduce((s,l)=>s+(+l.importo||0),0)
      : pagate.reduce((s,f)=>s+(impFatt[f.id]||0),0);
    const totSp=SP.reduce((s,x)=>s+(+x.importo||0),0);
    const anno=String(now.getFullYear());
    const incAnno=_incassoIn(anno,4);
    /* guadagno/perdita per singolo lavoro (importo − spese) */
    const spPer={};SP.forEach(x=>{spPer[x.lavoro_id]=(spPer[x.lavoro_id]||0)+(+x.importo||0);});
    /* 12 agosto 2026 — le fatture dei fornitori e la manodopera entrano anche
       QUI. Prima il Report diceva "guadagno 9.000" su un lavoro che nella sua
       scheda diceva 4.000: leggeva il lavoro_id delle fatture fornitori
       (riga sopra) e poi non lo usava. */
    const ffPer={};FF.forEach(x=>{if(x.lavoro_id)ffPer[x.lavoro_id]=(ffPer[x.lavoro_id]||0)+(+x.importo||0);});
    const _md=await caricaManodopera(mid,L);
    /* 12 nov 2026 — ORE PER OPERATORE dalle righe di gest_ore, come la manodopera.
       Prima guardava solo la casella «ore» del lavoro: con le ore segnate riga
       per riga usciva «Manodopera 56,25 €» e sotto «Segna le ore nei lavori».
       Stessa regola di costoManodopera: se un lavoro ha righe valgono quelle,
       se no vale la sua casella. Chi non ha il nome finisce in «Senza nome». */
    const perOp={}, _conRigheOp={};
    (_md.righe||[]).forEach(o=>{const h=+o.ore||0;if(!h||!o.lavoro_id)return;_conRigheOp[String(o.lavoro_id)]=1;const k=o.operatore_id!=null?String(o.operatore_id):"";perOp[k]=(perOp[k]||0)+h;});
    L.forEach(l=>{if(_conRigheOp[String(l.id)]||!(+l.ore))return;const k=l.operatore_id?String(l.operatore_id):"";perOp[k]=(perOp[k]||0)+(+l.ore||0);});
    const opRows=Object.entries(perOp).sort((a,b)=>b[1]-a[1]);
    /* 12 agosto 2026 (sera) — il costo della manodopera di TUTTI i lavori del
       Report. Serve ai "Totali storici" qui sotto: la manodopera entrava nel
       margine di ogni singolo lavoro ma NON nel margine totale, cosi' sommando
       i lavori uno per uno non tornava mai col totale, e la differenza era
       esattamente lo stipendio della squadra. */
    const totMD=Object.keys(_md.per).reduce(function(s,k){return s+(+_md.per[k]||0);},0);
    /* 24 nov 2026 — il rimborso spese delle fatture al cliente (riaddebito dei fornitori) */
    let rimPer={};try{if(typeof rimborsiInFattura==="function")rimPer=await rimborsiInFattura(L.filter(l=>ffPer[l.id]||spPer[l.id]).map(l=>l.id));}catch(e){}
    try{repData.rimPer=rimPer;}catch(e){}
    let ML=L.filter(l=>(+l.importo||0)>0||spPer[l.id]||ffPer[l.id]||_md.per[String(l.id)])
      .map(l=>({id:l.id,d:l.descrizione||"Lavoro",inc:+l.importo||0,sp:spPer[l.id]||0,
                ff:ffPer[l.id]||0, md:_md.per[String(l.id)]||0, rim:rimPer[String(l.id)]||0}));
    ML.forEach(m=>{m.marg=margineLavoro(m.inc,m.sp,m.ff,m.md,m.rim);
      /* 19 nov 2026 — la barra grigia e' TUTTO quello che e' uscito (spese +
         fornitori + manodopera), come il guadagno scritto accanto. Prima era
         solo le spese: «Guadagno 800» con una barra grigia quasi vuota. */
      m.cost=(+m.sp||0)+(+m.ff||0)+(+m.md||0);});
    /* il CSV deve dare lo STESSO margine del Report: gli passo gli stessi dati */
    if(repData)repData.md=_md;
    ML.sort((a,b)=>a.marg-b.marg);
    const mlMax=Math.max(...ML.map(m=>Math.max(m.inc,m.cost)),1);
    const nPos=ML.filter(m=>m.marg>0).length,nNeg=ML.filter(m=>m.marg<0).length,nZero=ML.filter(m=>m.marg===0).length;
    const mlRows=ML.slice(0,15).map(m=>{
      const badge=m.marg>0?`<span class="mbadge pos">▲ Guadagno ${eur(m.marg)}</span>`:m.marg<0?`<span class="mbadge neg">▼ Perdita ${eur(Math.abs(m.marg))}</span>`:`<span class="mbadge zero">Pareggio</span>`;
      return `<div class="mlav"><div class="mlav-top"><b>${esc(m.d)}</b>${badge}</div>
      <div class="mlav-bars"><div class="mlav-bar inc" style="width:${Math.max(m.inc/mlMax*100,m.inc?1:0)}%"></div><div class="mlav-bar sp" style="width:${Math.max(m.cost/mlMax*100,m.cost?1:0)}%"></div></div>
      <div class="mlav-sub">Importo ${eur(m.inc)}${m.rim?" · Rimborso spese +"+eur(m.rim):""} · Spese ${eur(m.sp)}${m.ff?" · Fornitori "+eur(m.ff):""}${m.md?" · "+_repW().md+" "+eur(m.md):""}</div>
      <button class="btn rep-apri" data-action="edit-job" data-id="${esc(String(m.id))}">${_repPro()?"Apri la pratica ›":"Apri il lavoro ›"}</button></div>`;
    }).join("");
    /* ⛔ 22 agosto 2026 — se le ore non si sono potute leggere, TUTTI i
       margini di questa pagina (e i Totali storici, e il CSV) sono scritti
       senza la manodopera. Prima non lo diceva nessuno e il Report faceva
       sembrare i lavori piu' in guadagno di quello che erano. */
    const avvisoOre=(_md.oreLette===false)
      ? `<p class="fatt-empty" style="margin:0 0 12px;color:var(--err);font-weight:700">⚠️ Non sono riuscito a leggere le ore: in questa pagina <b>la manodopera non è contata</b>, quindi i margini qui sotto sono più alti del vero. Ricarica la pagina.</p>`
      : "";
    /* 21 nov 2026 (sì di Alex, foto approvata) — ANNO PER ANNO: incassato,
       spese e utile di ogni anno, per la dichiarazione. Stessi conti del mese
       qui sotto (incassato − spese; la manodopera e' un costo interno e resta
       solo nel margine dei lavori), solo con la chiave dell'anno. */
    const _anniSet=new Set([String(now.getFullYear())]);
    const _annoDi=d=>{const a=String(d||"").slice(0,4);if(/^\d{4}$/.test(a))_anniSet.add(a);};
    (_daLavori?L.filter(l=>l.fatt_stato==="pagata").map(l=>l.data_fatto):pagate.map(_dataInc)).forEach(_annoDi);
    SP.forEach(x=>_annoDi(x.data)); CM.forEach(m=>_annoDi(m.data||m.created_at)); RIF.forEach(r=>_annoDi(r.data)); FF.forEach(f=>_annoDi(f.data)); NOL.forEach(n=>_annoDi(n.data_uscita));
    const ANNI=[..._anniSet].sort().reverse().slice(0,6).map(a=>{
      const i=_incassoIn(a,4);
      const sp=SP.filter(x=>String(x.data||"").slice(0,4)===a).reduce((s,x)=>s+(+x.importo||0),0)
        +CM.filter(m=>String(m.data||m.created_at||"").slice(0,4)===a).reduce((s,m)=>s+(+m.importo||0),0)
        +rifIn(a,4)+ffIn(a,4)+nolIn(a,4);
      return {a,inc:i,sp,ut:i-sp};});
    const _utCol=v=>`color:${v>0?"var(--ok)":v<0?"var(--err)":"#5f6b7a"}`;
    const _utTxt=v=>(v<0?"−":"")+eur(Math.abs(v));
    const anniCard=`<div class="rep-card rep-anni"><h3>${_ICO_LISTA}Anno per anno</h3>
      <p class="rep-sub">Quello che ti serve per la dichiarazione: incassato, spese e utile di ogni anno.</p>
      <table class="rep-table rep-anni-pc"><tr><td><b>Anno</b></td><td><b>Incassato</b></td><td><b>Spese</b></td><td><b>Utile</b></td></tr>
      ${ANNI.map(r=>`<tr><td>${r.a}</td><td>${eur(r.inc)}</td><td>${r.sp?"−"+eur(r.sp):eur(0)}</td><td style="${_utCol(r.ut)}"><b>${_utTxt(r.ut)}</b></td></tr>`).join("")}</table>
      <table class="rep-table rep-anni-tel">${ANNI.map(r=>`<tr><td><b>${r.a}</b><br><span class="rep-anni-sub">incassato ${eur(r.inc)} · spese ${r.sp?"−"+eur(r.sp):eur(0)}</span></td><td style="${_utCol(r.ut)}"><b>${_utTxt(r.ut)}</b></td></tr>`).join("")}</table></div>`;
    const mlCard=`<div class="rep-card" style="grid-column:1/-1"><h3>${_ICO_EURO}Guadagno o perdita per lavoro</h3>
      ${avvisoOre}
      <div class="rep-legend" style="margin:0 0 12px;flex-wrap:wrap"><span><i style="background:var(--blu)"></i>${_repW().imp}</span><span><i class="rep-i-sp"></i>Spese, fornitori e manodopera</span><span style="margin-left:auto;font-weight:700">${nPos} in guadagno · ${nZero} in pareggio · ${nNeg} in perdita</span></div>
      <p class="rep-sub" style="margin:0 0 10px">${_repPro()?"Il guadagno di ogni pratica è sulla sua parcella, anche se non è ancora stata pagata.":"Il guadagno di ogni lavoro è sul suo prezzo, anche se non è ancora stato pagato."}</p>
      ${ML.length?mlRows:`<p class="fatt-empty">Metti un importo nei lavori e registra le spese (dentro "Modifica" del lavoro) per vedere qui il margine.</p>`}
      ${ML.length>15?`<p class="fatt-empty" style="margin-top:8px">Mostro i 15 lavori col margine più basso: se un lavoro non compare, è tra quelli in positivo.</p>`:""}</div>`;
    /* 19 nov 2026 — i numeri dello schermo, uguali, per il PDF e per il file Excel */
    const _marg=totInc-totSp-totCarte-totRif-totFF-totNol-totMD;
    if(repData){
      repData.tot={anno,incAnno,totInc,totSp,totCarte,totRif,totFF,totNol,totMD,marg:_marg};
      repData.mese={nome:mNome,inc:mInc,sp:mSp,ut:mUt};
      repData.anni=ANNI; repData.ML=ML; repData.mesi=mkeys.map((k,i)=>({k,inc:inc[i],sp:spm[i]}));
      repData.topCli=topCli.map(([id,v])=>[cliMap[id]||"—",v]);
      repData.oreOp=opRows.map(([id,v])=>[opMap[id]||(id?"—":"Senza nome"),v]);
      repData.oreLette=_md.oreLette!==false;
    }
    box.innerHTML=`<div class="rep-grid">
      ${mlCard}
      ${anniCard}
      <div class="rep-card" style="grid-column:1/-1"><h3>${_ICO_TREND}Incassi e spese — ultimi 12 mesi</h3>
        ${meseBox}
        <div class="rep-bar-wrap">${bars}</div>
        <div class="rep-legend"><span><i style="background:var(--blu)"></i>Incassato</span><span><i class="rep-i-sp"></i>Spese</span></div></div>
      ${/* Solo dati storici: da fare / in corso / fatti stanno già nel Riepilogo,
            che è la foto di adesso. Qui conta l'andamento nel tempo, non ripeterlo. */""}
      <div class="rep-card"><h3 class="con-sub">${_ICO_LISTA}Totali di questo reparto</h3>
        <p class="rep-sub">Da quando usi il gestionale. Il margine è: soldi incassati meno tutte le spese.</p><table class="rep-table">
        <tr><td>Incassato ${anno} <span style="font-size:13px;color:var(--testo-3)">(IVA esclusa)</span></td>${_repZero(incAnno,"")}</tr>
        <tr><td>Incassato totale <span style="font-size:13px;color:var(--testo-3)">(IVA esclusa)</span></td>${_repZero(totInc,"")}</tr>
        <tr><td>${_repW().spLav}</td>${_repZero(totSp,"−")}</tr>
        ${(_repPro()&&!totCarte)?"":`<tr><td>Spese con le carte</td>${_repZero(totCarte,"−")}</tr>`}
        ${totRif?`<tr><td>Rifornimenti pagati in contanti</td><td style="color:var(--testo)">−${eur(totRif)}</td></tr>`:""}
        ${totFF?`<tr><td>Fatture dei fornitori</td><td style="color:var(--testo)">−${eur(totFF)}</td></tr>`:""}
        ${totNol?`<tr><td>Noleggio interno <span style="font-size:13px;color:var(--testo-3)">(mezzi del tuo Noleggio)</span></td><td style="color:var(--testo)">−${eur(totNol)}</td></tr>`:""}
        ${totMD?`<tr><td>${_repPro()?"Tempo speso dai collaboratori":"Manodopera"} <span style="font-size:13px;color:var(--testo-3)">(ore × costo orario)</span></td><td style="color:var(--testo)">−${eur(totMD)}</td></tr>`:""}
        <tr><td><b>Margine totale</b></td><td style="color:${totInc-totSp-totCarte-totRif-totFF-totNol-totMD>=0?'var(--ok)':'var(--err)'}">${(m=>(m<0?'−':'')+eur(Math.abs(m)))(totInc-totSp-totCarte-totRif-totFF-totNol-totMD)}</td></tr></table></div>
      <div class="rep-card"><h3>${_ICO_TROFEO}Migliori clienti (per ${_repPro()?"valore delle pratiche":"valore dei lavori"})</h3><table class="rep-table">
        ${topCli.length?topCli.map(([id,v])=>`<tr><td>${(cliMap[id]&&!/nel cestino/.test(cliMap[id]))?`<button type="button" class="aic-link rep-cli" style="padding:4px 0;text-align:left" data-action="edit-cli" data-id="${esc(String(id))}">${esc(cliMap[id])} ›</button>`:esc(cliMap[id]||"—")}</td><td>${eur(v)}</td></tr>`).join(""):`<tr><td colspan="2" style="color:var(--muted)">${_repPro()?"Collega i clienti alle pratiche per vedere la classifica.":"Collega i clienti ai lavori per vedere la classifica."}</td></tr>`}</table></div>
      ${ruoloUtente==='professionista'?"":`
      <div class="rep-card"><h3>${_ICO_CARTA}Spese con le carte aziendali</h3>
        <p class="rep-sub">Soldi usciti dalle carte, non legati a un lavoro preciso. Sono compresi nel margine qui sopra.</p>
        <table class="rep-table">
        ${CM.length
          ? CM.slice().sort((a,b)=>String(b.data||b.created_at||"").localeCompare(String(a.data||a.created_at||""))).slice(0,6)
              .map(m=>`<tr><td>${esc(m.causale||"Spesa")}<br><span style="font-size:13px;color:var(--testo-3)">${esc(carteNome[m.carta_id]||"")}</span></td><td>−${eur(m.importo)}</td></tr>`).join("")
            +`<tr><td><b>Totale</b></td><td><b>−${eur(totCarte)}</b></td></tr>`
          : `<tr><td colspan="2" style="color:var(--muted)">Nessuna spesa registrata sulle carte.</td></tr>`}
        </table></div>`}
      <div class="rep-card"><h3>${_ICO_OROLOGIO}Ore per operatore</h3><table class="rep-table">
        ${opRows.length?opRows.map(([id,v])=>`<tr><td>${esc(opMap[id]||(id?"—":"Senza nome"))}</td><td>${String(Math.round(v*10)/10).replace(".",",")} h</td></tr>`).join(""):`<tr><td colspan="2" style="color:var(--muted)">${_repPro()?"Scrivi le ore nel «Registro delle ore» della pratica per vedere il totale per persona.":"Segna le ore nei lavori per vedere il totale per persona."}</td></tr>`}</table></div>
    </div>`;
  }

  function reportCsv(){
    if(!repData||!repData.L.length){toast("Nessun dato da esportare");return;}
    const cliMap=Object.fromEntries(repData.cl.map(c=>[c.id,c.nome]));
    const opMap=Object.fromEntries(repData.ops.map(o=>[o.id,o.nome]));
    const speseMap={};repData.SP.forEach(x=>{speseMap[x.lavoro_id]=(speseMap[x.lavoro_id]||0)+(+x.importo||0);});
    /* 12 agosto 2026 — stesse colonne che vede il Report: fatture dei
       fornitori e manodopera. Prima il CSV dava un terzo numero ancora. */
    const ffMap={};(repData.FF||[]).forEach(x=>{if(x.lavoro_id)ffMap[x.lavoro_id]=(ffMap[x.lavoro_id]||0)+(+x.importo||0);});
    const mdMap=(repData.md&&repData.md.per)||{};
    /* 19 nov 2026 — i centesimi puliti: prima usciva «800,4000000000001» */
    const num=n=>String(typeof _cent2==="function"?_cent2(+n||0):Math.round((+n||0)*100)/100).replace(".",",");
    /* le ore come sullo schermo: se il lavoro ha righe di ore valgono quelle
       (prima il file diceva 0 ore e lo schermo 5 h) */
    const orePer={},conRighe={};
    ((repData.md&&repData.md.righe)||[]).forEach(o=>{if(!o.lavoro_id)return;const k=String(o.lavoro_id);conRighe[k]=1;orePer[k]=(orePer[k]||0)+(+o.ore||0);});
    const oreLav=l=>conRighe[String(l.id)]?orePer[String(l.id)]:(+l.ore||0);
    const fattLab={none:"",emessa:"Emessa",pagata:"Pagata"};
    const W=_repW();
    const rows=[[_repPro()?"Pratica":"Descrizione","Stato","Data prevista",_repPro()?"Data fine":"Data fatto","Cliente",W.chi,"Ore","Importo","Spese","Fatture fornitori",W.md,"Margine","Fattura"]];
    repData.L.forEach(l=>{
      const sp=speseMap[l.id]||0, ff=ffMap[l.id]||0, md=mdMap[String(l.id)]||0;
      rows.push([l.descrizione||"",statoLabel[l.stato]||l.stato,l.data_prevista||"",l.data_fatto||"",cliMap[l.cliente_id]||"",opMap[l.operatore_id]||"",String(Math.round(oreLav(l)*10)/10).replace(".",","),num(l.importo),num(sp),num(ff),num(md),num(margineLavoro(l.importo,sp,ff,md,(repData.rimPer||{})[String(l.id)])),fattLab[l.fatt_stato||"none"]!=null?fattLab[l.fatt_stato||"none"]:(l.fatt_stato||"")]);
    });
    /* 19 nov 2026 (sì di Alex) — in fondo i Totali, gli stessi della schermata */
    const T=repData.tot;
    if(T){
      rows.push([]); rows.push(["Totali di questo reparto"]);
      [["Incassato "+T.anno+" (IVA esclusa)",T.incAnno],["Incassato totale (IVA esclusa)",T.totInc],
       [W.spLav,-T.totSp],["Spese con le carte",-T.totCarte],["Rifornimenti pagati in contanti",-T.totRif],
       ["Fatture dei fornitori",-T.totFF],["Noleggio interno",-T.totNol],[W.mdTot.replace("×","x"),-T.totMD],
       ["Margine totale",T.marg]].forEach(([n,v])=>{ if(v||/Incassato|Margine|lavori|pratiche/.test(n)||(/carte/.test(n)&&!_repPro())) rows.push([n,num(v)]); });
      if((repData.anni||[]).length){ rows.push([]); rows.push(["Anno","Incassato","Spese","Utile"]); repData.anni.forEach(r=>rows.push([r.a,num(r.inc),num(-r.sp),num(r.ut)])); }
      if(repData.mese){const M=repData.mese; rows.push([]); rows.push([M.nome+" - incassato",num(M.inc)]); rows.push([M.nome+" - spese",num(-M.sp)]); rows.push([M.nome+" - utile",num(M.ut)]);}
    }
    const csv="﻿"+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download=(_repPro()?"report-pratiche-":"report-lavori-")+todayStr()+".csv";a.click();URL.revokeObjectURL(a.href);
    toast("File per Excel scaricato ⬇");
  }

  /* ===== 19 nov 2026 (sì di Alex) — IL REPORT IN PDF =====
     Gli stessi numeri dello schermo (repData, riempito da renderReport):
     nessun conto rifatto qui. Stessa forma del PDF delle Giornate. */
  async function reportPdf(){
    if(!repData||!repData.tot){toast("Apri prima il Report, poi scarica il PDF");return;}
    if(!(await caricaJsPDF())){ toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
    const J=window.jspdf&&window.jspdf.jsPDF; if(!J) return;
    const doc=new J({unit:"mm",format:"a4"}); const W=210,M=15; let y=18;
    if(typeof window.gestLogoPdf==="function"){ try{ y=await window.gestLogoPdf(doc,M,y)||y; }catch(e){} }
    const T=s=>String(s==null?"":s).replace(/\u2212/g,"-").replace(/[^\x00-\xFF€]/g,"");
    const E=v=>((+v||0)<0?"-":"")+eur(Math.abs(+v||0));
    const pagina=hh=>{ if(y+hh>282){ doc.addPage(); y=20; } };
    try{
      const ra=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
      const az=ra&&ra.data;
      if(az&&az.nome){
        doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.text(T(az.nome),M,y); y+=5.5;
        doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
        [az.piva?"P.IVA "+az.piva:"",(typeof azIndirizzo==="function"?azIndirizzo(az):az.indirizzo)||""].filter(Boolean).forEach(t=>{ doc.text(T(t),M,y); y+=4.5; });
        doc.setTextColor(0); y+=6;
      }
    }catch(e){}
    let rep=""; try{ const e=document.getElementById("tb-panel-name"); rep=(e&&e.textContent.trim()!=="—"&&e.textContent.trim())||""; }catch(e){}
    doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text(T("Report"+(rep?" - "+rep:"")),M,y); y+=6;
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90); doc.text(T("Stampato il "+todayStr().split("-").reverse().join("/")),M,y); doc.setTextColor(0); y+=3;
    doc.setDrawColor(255,136,0); doc.setLineWidth(.8); doc.line(M,y,W-M,y); y+=10;
    function tabella(titolo,cols,righe,larg,nota){
      pagina(20); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(T(titolo),M,y); y+=6;
      if(nota){ doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90); doc.text(T(nota),M,y); doc.setTextColor(0); y+=5; }
      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setFillColor(236,240,245); doc.rect(M,y-5,W-2*M,7,"F");
      let x=M; cols.forEach((c,i)=>{ if(i) doc.text(T(c),x+larg[i]-2,y,{align:"right"}); else doc.text(T(c),x+2,y); x+=larg[i]; }); y+=6;
      doc.setFont("helvetica","normal");
      righe.forEach(r=>{
        const linee=r.map((c,i)=>doc.splitTextToSize(T(c),larg[i]-4));
        const hh=Math.max(...linee.map(l=>l.length))*4.6+2;
        pagina(hh); x=M;
        const grassetto=r._b; if(grassetto) doc.setFont("helvetica","bold");
        linee.forEach((l,i)=>{ if(i) doc.text(l,x+larg[i]-2,y,{align:"right"}); else doc.text(l,x+2,y); x+=larg[i]; });
        if(grassetto) doc.setFont("helvetica","normal");
        y+=hh; doc.setDrawColor(226,232,240); doc.setLineWidth(.2); doc.line(M,y-3.5,W-M,y-3.5);
      });
      y+=8;
    }
    const t=repData.tot, ms=repData.mese;
    if(!repData.oreLette){ doc.setTextColor(200,0,0); doc.setFontSize(10); doc.text(T("Attenzione: le ore non si sono potute leggere, la manodopera non e' contata."),M,y); doc.setTextColor(0); y+=8; }
    tabella(ms.nome+" (questo mese)",["Voce","Importo"],[["Incassato",E(ms.inc)],["Spese",E(-ms.sp)],Object.assign(["Utile",E(ms.ut)],{_b:1})],[130,50]);
    const PW=_repW();
    const tr=[["Incassato "+t.anno+" (IVA esclusa)",E(t.incAnno)],["Incassato totale (IVA esclusa)",E(t.totInc)],[PW.spLav,E(-t.totSp)]];
    if(!_repPro()||t.totCarte) tr.push(["Spese con le carte",E(-t.totCarte)]);
    if(t.totRif) tr.push(["Rifornimenti pagati in contanti",E(-t.totRif)]);
    if(t.totFF)  tr.push(["Fatture dei fornitori",E(-t.totFF)]);
    if(t.totNol) tr.push(["Noleggio interno",E(-t.totNol)]);
    if(t.totMD)  tr.push([PW.mdTot.replace("×","x"),E(-t.totMD)]);
    tr.push(Object.assign(["Margine totale",E(t.marg)],{_b:1}));
    tabella("Totali di questo reparto",["Voce","Importo"],tr,[130,50],"Da quando usi il gestionale. Margine = soldi incassati meno tutte le spese.");
    if((repData.anni||[]).length) tabella("Anno per anno",["Anno","Incassato","Spese","Utile"],repData.anni.map(r=>Object.assign([r.a,E(r.inc),E(-r.sp),E(r.ut)])),[45,45,45,45],"Per la dichiarazione: incassato meno spese di ogni anno.");
    tabella("Ultimi 12 mesi",["Mese","Incassato","Spese"],repData.mesi.slice().reverse().map(m=>[(x=>x.charAt(0).toUpperCase()+x.slice(1))(mesi[+m.k.slice(5,7)-1])+" "+m.k.slice(0,4),E(m.inc),E(-m.sp)]),[80,50,50]);
    if((repData.ML||[]).length)
      tabella(PW.perLav,[PW.lav,"Importo","Uscite","Margine"],repData.ML.map(m=>[m.d,E(m.inc),E(-m.cost),E(m.marg)]),[80,34,34,32],PW.uscite);
    if((repData.topCli||[]).length) tabella("Migliori clienti",["Cliente",PW.valore],repData.topCli.map(([n,v])=>[n,E(v)]),[130,50]);
    if((repData.oreOp||[]).length) tabella(PW.oreTit,["Persona","Ore"],repData.oreOp.map(([n,v])=>[n,String(Math.round(v*10)/10).replace(".",",")+" h"]),[130,50]);
    doc.save("Report"+(rep?" - "+rep:"")+" - "+todayStr()+".pdf");
  }

  /* ---- ESPORTAZIONE DATI (portabilità: Excel + JSON) ---- */
