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
  async function renderReport(){
    const box=$("#rep-body");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=tabVuoto("Nessun dato","Accedi per vedere i report.",
      _SVGV+'<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>');return;}
    const mid=curMestiere();
    const [{data:lav},{data:cl},{data:ops}]=await Promise.all([
      sb.from("gest_lavori").select("id,descrizione,stato,importo,fatt_stato,data_prevista,data_fatto,ore,cliente_id,operatore_id").eq("user_id",sbUid).eq("mestiere_id",mid),
      sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(mid)),
      sb.from("gest_operatori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);
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
      const {data:ca}=await sb.from("gest_carte").select("id,nome,stato").eq("user_id",sbUid).eq("mestiere_id",mid);
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
    const hBar=v=>v>0?Math.max(Math.round(v/mx*H_BAR),2):0;
    const bars=mkeys.map((k,i)=>{
      const lab=mesi[+k.slice(5,7)-1].slice(0,3);
      return `<div class="rep-bar-col"><div class="rep-bars">
        <div class="rep-bar inc" style="height:${hBar(inc[i])}px" title="Incassato ${eur(inc[i])}"></div>
        <div class="rep-bar sp" style="height:${hBar(spm[i])}px" title="Spese ${eur(spm[i])}"></div></div>
        <span class="rep-bar-lab">${lab}</span></div>`;
    }).join("");
    /* top clienti */
    const perCli={};
    L.forEach(l=>{if(!l.cliente_id||!(+l.importo))return;perCli[l.cliente_id]=(perCli[l.cliente_id]||0)+(+l.importo||0);});
    const topCli=Object.entries(perCli).sort((a,b)=>b[1]-a[1]).slice(0,5);
    /* ore per operatore */
    const perOp={};
    L.forEach(l=>{if(!l.operatore_id||!(+l.ore))return;perOp[l.operatore_id]=(perOp[l.operatore_id]||0)+(+l.ore||0);});
    const opRows=Object.entries(perOp).sort((a,b)=>b[1]-a[1]);
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
    /* 12 agosto 2026 (sera) — il costo della manodopera di TUTTI i lavori del
       Report. Serve ai "Totali storici" qui sotto: la manodopera entrava nel
       margine di ogni singolo lavoro ma NON nel margine totale, cosi' sommando
       i lavori uno per uno non tornava mai col totale, e la differenza era
       esattamente lo stipendio della squadra. */
    const totMD=Object.keys(_md.per).reduce(function(s,k){return s+(+_md.per[k]||0);},0);
    let ML=L.filter(l=>(+l.importo||0)>0||spPer[l.id]||ffPer[l.id]||_md.per[String(l.id)])
      .map(l=>({d:l.descrizione||"Lavoro",inc:+l.importo||0,sp:spPer[l.id]||0,
                ff:ffPer[l.id]||0, md:_md.per[String(l.id)]||0}));
    ML.forEach(m=>m.marg=margineLavoro(m.inc,m.sp,m.ff,m.md));
    /* il CSV deve dare lo STESSO margine del Report: gli passo gli stessi dati */
    if(repData)repData.md=_md;
    ML.sort((a,b)=>a.marg-b.marg);
    const mlMax=Math.max(...ML.map(m=>Math.max(m.inc,m.sp)),1);
    const nPos=ML.filter(m=>m.marg>0).length,nNeg=ML.filter(m=>m.marg<0).length,nZero=ML.filter(m=>m.marg===0).length;
    const mlRows=ML.slice(0,15).map(m=>{
      const badge=m.marg>0?`<span class="mbadge pos">▲ Guadagno ${eur(m.marg)}</span>`:m.marg<0?`<span class="mbadge neg">▼ Perdita ${eur(Math.abs(m.marg))}</span>`:`<span class="mbadge zero">Pareggio</span>`;
      return `<div class="mlav"><div class="mlav-top"><b>${esc(m.d)}</b>${badge}</div>
      <div class="mlav-bars"><div class="mlav-bar inc" style="width:${Math.max(m.inc/mlMax*100,m.inc?1:0)}%"></div><div class="mlav-bar sp" style="width:${Math.max(m.sp/mlMax*100,m.sp?1:0)}%"></div></div>
      <div class="mlav-sub">Incasso ${eur(m.inc)} · Spese ${eur(m.sp)}${m.ff?" · Fornitori "+eur(m.ff):""}${m.md?" · Manodopera "+eur(m.md):""}</div></div>`;
    }).join("");
    /* ⛔ 22 agosto 2026 — se le ore non si sono potute leggere, TUTTI i
       margini di questa pagina (e i Totali storici, e il CSV) sono scritti
       senza la manodopera. Prima non lo diceva nessuno e il Report faceva
       sembrare i lavori piu' in guadagno di quello che erano. */
    const avvisoOre=(_md.oreLette===false)
      ? `<p class="fatt-empty" style="margin:0 0 12px;color:var(--err);font-weight:700">⚠️ Non sono riuscito a leggere le ore: in questa pagina <b>la manodopera non è contata</b>, quindi i margini qui sotto sono più alti del vero. Ricarica la pagina.</p>`
      : "";
    const mlCard=`<div class="rep-card" style="grid-column:1/-1"><h3>${_ICO_EURO}Guadagno o perdita per lavoro</h3>
      ${avvisoOre}
      <div class="rep-legend" style="margin:0 0 12px;flex-wrap:wrap"><span><i style="background:var(--blu)"></i>Incasso</span><span><i style="background:var(--testo-3)"></i>Spese</span><span style="margin-left:auto;font-weight:700">${nPos} in guadagno · ${nZero} in pareggio · ${nNeg} in perdita</span></div>
      ${ML.length?mlRows:`<p class="fatt-empty">Metti un importo nei lavori e registra le spese (dentro "Modifica" del lavoro) per vedere qui il margine.</p>`}
      ${ML.length>15?`<p class="fatt-empty" style="margin-top:8px">Mostro i 15 lavori col margine più basso: se un lavoro non compare, è tra quelli in positivo.</p>`:""}</div>`;
    box.innerHTML=`<div class="rep-grid">
      ${mlCard}
      <div class="rep-card" style="grid-column:1/-1"><h3>${_ICO_TREND}Incassi e spese — ultimi 12 mesi</h3>
        <div class="rep-bar-wrap">${bars}</div>
        <div class="rep-legend"><span><i style="background:var(--blu)"></i>Incassato</span><span><i style="background:var(--testo-3)"></i>Spese</span></div></div>
      ${/* Solo dati storici: da fare / in corso / fatti stanno già nel Riepilogo,
            che è la foto di adesso. Qui conta l'andamento nel tempo, non ripeterlo. */""}
      <div class="rep-card"><h3 class="con-sub">${_ICO_LISTA}Totali storici</h3>
        <p class="rep-sub">Da quando usi il gestionale</p><table class="rep-table">
        <tr><td>Incassato ${anno} <span style="font-size:13px;color:var(--testo-3)">(IVA esclusa)</span></td><td>${eur(incAnno)}</td></tr>
        <tr><td>Incassato totale <span style="font-size:13px;color:var(--testo-3)">(IVA esclusa)</span></td><td>${eur(totInc)}</td></tr>
        <tr><td>Spese nei lavori</td><td style="color:var(--testo)">−${eur(totSp)}</td></tr>
        <tr><td>Spese con le carte</td><td style="color:var(--testo)">−${eur(totCarte)}</td></tr>
        ${totRif?`<tr><td>Rifornimenti pagati in contanti</td><td style="color:var(--testo)">−${eur(totRif)}</td></tr>`:""}
        ${totFF?`<tr><td>Fatture dei fornitori</td><td style="color:var(--testo)">−${eur(totFF)}</td></tr>`:""}
        ${totNol?`<tr><td>Noleggio interno <span style="font-size:13px;color:var(--testo-3)">(mezzi del tuo Noleggio)</span></td><td style="color:var(--testo)">−${eur(totNol)}</td></tr>`:""}
        ${totMD?`<tr><td>Manodopera <span style="font-size:13px;color:var(--testo-3)">(ore × costo orario)</span></td><td style="color:var(--testo)">−${eur(totMD)}</td></tr>`:""}
        <tr><td><b>Margine totale</b></td><td style="color:${totInc-totSp-totCarte-totRif-totFF-totNol-totMD>=0?'var(--ok)':'var(--err)'}">${eur(totInc-totSp-totCarte-totRif-totFF-totNol-totMD)}</td></tr></table></div>
      <div class="rep-card"><h3>${_ICO_TROFEO}Migliori clienti (per fatturato)</h3><table class="rep-table">
        ${topCli.length?topCli.map(([id,v])=>`<tr><td>${esc(cliMap[id]||"—")}</td><td>${eur(v)}</td></tr>`).join(""):`<tr><td colspan="2" style="color:var(--muted)">Collega i clienti ai lavori per vedere la classifica.</td></tr>`}</table></div>
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
        ${opRows.length?opRows.map(([id,v])=>`<tr><td>${esc(opMap[id]||"—")}</td><td>${Math.round(v*10)/10} h</td></tr>`).join(""):`<tr><td colspan="2" style="color:var(--muted)">Segna le ore nei lavori per vedere il totale per persona.</td></tr>`}</table></div>
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
    const num=n=>String(+n||0).replace(".",",");
    const rows=[["Descrizione","Stato","Data prevista","Data fatto","Cliente","Operatore","Ore","Importo","Spese","Fatture fornitori","Manodopera","Margine","Fattura"]];
    repData.L.forEach(l=>{
      const sp=speseMap[l.id]||0, ff=ffMap[l.id]||0, md=mdMap[String(l.id)]||0;
      rows.push([l.descrizione||"",statoLabel[l.stato]||l.stato,l.data_prevista||"",l.data_fatto||"",cliMap[l.cliente_id]||"",opMap[l.operatore_id]||"",num(l.ore),num(l.importo),num(sp),num(ff),num(md),num(margineLavoro(l.importo,sp,ff,md)),l.fatt_stato||"none"]);
    });
    const csv="﻿"+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download="report-lavori-"+todayStr()+".csv";a.click();URL.revokeObjectURL(a.href);
    toast("CSV esportato ⬇");
  }

  /* ---- ESPORTAZIONE DATI (portabilità: Excel + JSON) ---- */
