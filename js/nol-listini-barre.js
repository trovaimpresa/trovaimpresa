// [SPOSTATO] nol-listini-barre.js: era dentro nol-core.js, righe 6436-6654, spostato identico.

  /* ⛔ 22 agosto 2026 — tolti quattro ascoltatori morti (.nol-edit, .prod-edit,
     .forn-edit, .mov-edit): cercavano pulsanti che sulla riga non ci sono piu'.
     Peggio, cancellavano senza controllare user_id. Adesso tutto passa da
     nolElimina, che il controllo ce l'ha. */
  async function loadProdotti(){
    if(!(sb&&sbUid)) return;
    const {data}=await sb.from("neg_prodotti")
      .select("*")
      .eq("user_id",sbUid).order("nome");
    const prods=data||[], box=$("#prodotti-body");
    if(!box) return;
    if(!prods.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun prodotto. Aggiungine uno.</p>';return;}
    box.innerHTML=prods.map(p=>{
      const sotto=(p.quantita??0)<=(p.soglia_minima??0);
      return nolCard({col:sotto?"#c62828":"#1565c0",
        titolo:esc(p.nome||"—"),
        eti:[sotto?{t:"SOTTO SCORTA",col:"#c62828"}:null],
        corpo:`<div class="sub">${esc([p.categoria||"",_eur(p.prezzo)+" / "+(p.unita||"pz"),"in magazzino "+(p.quantita??0)+" "+(p.unita||"pz")].filter(Boolean).join(" · "))}</div>
        ${p.codice?`<div class="sub2">cod. ${esc(p.codice)}</div>`:""}`,
        pulsanti:nolPulsanti("prodotto",p.id)});}).join("");
  }
  $('[data-tab="prodotti"]')?.addEventListener("click",loadProdotti);
  async function loadMagazzino(){
    if(!(sb&&sbUid)) return;
    const {data}=await sb.from("neg_prodotti")
      .select("id,nome,quantita,soglia_minima").eq("user_id",sbUid).order("nome");
    const prods=data||[], box=$("#magazzino-body");
    if(!box) return;
    if(!prods.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun prodotto in magazzino.</p>';return;}
    box.innerHTML=prods.map(p=>{
      const q=p.quantita??0, s=p.soglia_minima??0, sotto=q<=s;
      return nolCard({col:sotto?"#c62828":"#2e7d32",
        testa:`<div><strong>${esc(p.nome||"—")}</strong>
            <div class="sub2">Scorta minima: ${esc(String(s))}</div></div>
          <div style="text-align:right">
            <span style="font-size:26px;font-weight:700;line-height:1">${esc(String(q))}</span>
            ${sotto?'<div><span class="nol-eti" style="background:#c62828">SOTTO SCORTA</span></div>':""}
          </div>`,
        pulsanti:nolPulsanti("magazzino",p.id)});
    }).join("");
  }
  $('[data-tab="magazzino"]')?.addEventListener("click",loadMagazzino);
  async function loadFornitori(){
    if(!(sb&&sbUid)) return;
    const {data}=await sb.from("neg_fornitori")
      .select("id,nome,telefono,email,indirizzo,piva,note").eq("user_id",sbUid).order("nome");
    const f=data||[], box=$("#fornitori-body");
    if(!box) return;
    if(!f.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun fornitore. Aggiungine uno.</p>';return;}
    box.innerHTML=f.map(x=>
      nolCard({col:"#1565c0",
        titolo:esc(x.nome||"—"),
        corpo:`<div class="sub">${esc([x.telefono?"☎ "+x.telefono:"",x.email||"",x.piva?"P.IVA "+x.piva:""].filter(Boolean).join(" · "))||""}</div>
        ${x.indirizzo?`<div class="sub2">${esc(x.indirizzo)}</div>`:""}
        ${x.note?`<div class="sub2">${esc(x.note)}</div>`:""}`,
        pulsanti:nolPulsanti("fornitore",x.id)})).join("");
  }
  $('[data-tab="fornitori"]')?.addEventListener("click",loadFornitori);
  async function loadMovimenti(){
    if(!(sb&&sbUid)) return;
    const {data}=await sb.from("neg_movimenti")
      .select("id,tipo,prodotto,quantita,importo,controparte,data_mov,note").eq("user_id",sbUid).order("data_mov",{ascending:false});
    const m=data||[], box=$("#movimenti-body");
    if(!box) return;
    if(!m.length){box.innerHTML='<p style="color:#666;padding:8px">Nessun movimento.</p>';return;}
    box.innerHTML=m.map(x=>{
      const ETI={vendita:["#2e7d32","↑","VENDITA"],acquisto:["#e65100","↓","ACQUISTO"],
                 reso:["#757575","↩","RESO"],rettifica:["#1565c0","≈","RETTIFICA"]};
      const [col,fre,et]=ETI[x.tipo]||ETI.acquisto;
      return nolCard({col:col,
        titolo:`${fre} ${esc(x.prodotto||"—")}`,
        eti:[{t:et}],
        corpo:`<div class="sub">${esc("Q.tà "+(x.quantita??0)+" · "+_eur(x.importo)+(x.controparte?" · "+x.controparte:""))}</div>
        <div class="sub2">${esc(fdate(x.data_mov)+(x.note?" · "+x.note:""))}</div>`,
        pulsanti:nolPulsanti("movimento",x.id)});
    }).join("");
  }
  $('[data-tab="movimenti"]')?.addEventListener("click",loadMovimenti);

  /* ================================================================
     CERCA ED ESPORTA — 23 agosto 2026
     Chiesto da Alessio insieme alla fatturazione. Nel gestionale imprese
     c'erano gia'; qui no, e con dieci mezzi non si sentiva. Con duecento
     si': trovare «quel Bobcat» scorrendo una griglia non e' lavoro.

     ⛔ SI SCRIVE UNA VOLTA SOLA, per tutte le sezioni. La barra non si
     mette a mano sezione per sezione: si costruisce da questa tabella e
     si infila sotto il titolo. Cosi' una sezione nuova che nasce domani
     ce l'ha gratis, e non ci si dimentica di una.

     ⚠️ LA RICERCA GUARDA QUELLO CHE SI VEDE. Cerca dentro il testo della
     card, non dentro colonne scelte da me: se una cosa e' scritta sulla
     riga, si trova. E' anche l'unico modo che non mente — non capita di
     cercare una parola che si legge sullo schermo e non trovare niente.

     ⛔ L'ESPORTAZIONE ESPORTA QUELLO CHE VEDI: se hai cercato, escono
     solo le righe rimaste. Le colonne sono le stesse identiche del foglio
     stampato (nolRighe): un posto solo da cambiare, e carta, PDF ed Excel
     restano uguali fra loro.
     ================================================================ */
  const NOL_BARRE=[
    ["mezzi",      "mezzo",    "Cerca un mezzo: nome, codice, tipo"],
    ["clienti-nol","cliente",  "Cerca un cliente: nome, telefono, P.IVA"],
    ["noleggi",    "noleggio", "Cerca: mezzo, cliente, numero di contratto"],
    ["prodotti",   "prodotto", "Cerca un prodotto: nome, codice, categoria"],
    ["magazzino",  "magazzino","Cerca un prodotto in magazzino"],
    ["fornitori",  "fornitore","Cerca un fornitore: nome, telefono, P.IVA"],
    ["movimenti",  "movimento","Cerca: prodotto, cliente o fornitore"],
    ["cauzioni",   "cauzione", "Cerca: cliente o mezzo"],
    /* ⚠️ la sezione «Fatture» tiene due elenchi (le fatture del noleggio e
       i lavori del gestionale imprese): il quarto valore dice quale dei due. */
    ["fattnol",    "fattnol",  "Cerca: cliente, numero, periodo","fattnol-body"]
  ];
  const NOL_BARRA_DI={};
  NOL_BARRE.forEach(b=>{NOL_BARRA_DI[b[0]]=b;});

  function nolMettiBarre(){
    NOL_BARRE.forEach(([sez,tipo,invito,idCorpo])=>{
      const box=$("#"+(idCorpo||sez+"-body"));
      if(!box||!box.parentNode||document.getElementById("barra-"+sez)) return;
      const barra=document.createElement("div");
      barra.className="nol-barra"; barra.id="barra-"+sez;
      barra.innerHTML='<input type="search" class="nol-cerca" data-cerca="'+sez+'" '+
        'autocomplete="off" spellcheck="false" placeholder="'+esc(invito)+'">'+
        '<button type="button" class="btn add" data-action="nol-esporta" data-s="'+sez+'">&#10515; Esporta in Excel</button>'+
        '<span class="nol-conta" id="conta-'+sez+'"></span>';
      /* ⚠️ la barra va SUBITO SOPRA L'ELENCO, non sotto il titolo: cosi'
         sta attaccata alla cosa che filtra, anche dove in mezzo ci sono la
         spiegazione e i totali (Cauzioni, Fatture). */
      box.parentNode.insertBefore(barra,box);
      /* ⛔ ogni elenco si ridisegna per conto suo quando ricarica: invece di
         ricordarsi di richiamare il filtro alla fine di otto funzioni (e
         dimenticarne una), lo si riapplica da solo appena la lista cambia. */
      try{ new MutationObserver(()=>nolCerca(sez)).observe(box,{childList:true}); }catch(e){}
    });
  }

  function nolCerca(sez){
    const casella=document.querySelector('[data-cerca="'+sez+'"]');
    const t=(casella?casella.value:"").trim().toLowerCase();
    const box=$("#"+sez+"-body"); if(!box) return;
    const carte=Array.prototype.slice.call(box.querySelectorAll(".nol-card"));
    let visti=0;
    carte.forEach(c=>{
      const ok=!t||(c.textContent||"").toLowerCase().indexOf(t)>=0;
      c.style.display=ok?"":"none";
      if(ok) visti++;
    });
    const cnt=$("#conta-"+sez);
    if(cnt) cnt.textContent = !carte.length ? ""
      : (!t ? carte.length+(carte.length===1?" riga":" righe")
            : (visti?visti+" su "+carte.length:"nessuna riga con «"+(casella?casella.value.trim():"")+"»"));
  }
  document.addEventListener("input",e=>{
    const c=e.target.closest("[data-cerca]"); if(c) nolCerca(c.dataset.cerca);
  });

  /* gli id delle righe rimaste a video, nell'ordine in cui si vedono */
  function nolIdVisibili(sez){
    const box=$("#"+sez+"-body"); if(!box) return [];
    return Array.prototype.slice.call(box.querySelectorAll(".nol-card"))
      .filter(c=>c.style.display!=="none")
      .map(c=>{const b=c.querySelector('[data-action="nol-mod"]'); return b?b.dataset.id:null;})
      .filter(Boolean);
  }

  async function nolEsporta(sez){
    const b=NOL_BARRA_DI[sez]; if(!b) return;
    const tipo=b[1], t=NOL_TIPI[tipo];
    if(!(sb&&sbUid)){toast("Devi essere collegato");return;}
    const ids=nolIdVisibili(sez);
    if(!ids.length){toast("Non c'è niente da esportare");return;}
    const {data,error}=await sb.from(t.tab).select("*").eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    const per={}; (data||[]).forEach(r=>{per[r.id]=r;});
    const righe=ids.map(i=>per[i]).filter(Boolean);
    if(!righe.length){toast("Non c'è niente da esportare");return;}
    /* le colonne: le stesse del foglio stampato, nell'ordine in cui
       compaiono. Una riga che non ha una voce lascia la cella vuota. */
    const cols=[], tab=righe.map(r=>{
      const m={};
      nolRighe(tipo,r).forEach(([k,v])=>{ if(cols.indexOf(k)<0) cols.push(k); m[k]=v; });
      return m;
    });
    /* ⚠️ il punto e virgola, non la virgola: Excel italiano apre cosi'.
       E il BOM davanti, se no gli accenti diventano geroglifici. */
    const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
    const csv="﻿"+[cols].concat(tab.map(m=>cols.map(c=>m[c]==null?"":m[c])))
      .map(r=>r.map(q).join(";")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=sez+"-"+todayStr()+".csv";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{try{URL.revokeObjectURL(a.href);a.remove();}catch(e){}},1000);
    toast(righe.length+(righe.length===1?" riga scaricata ✔":" righe scaricate ✔"));
  }
  nolMettiBarre();

  /* 6 agosto 2026 — Margine dal vivo: quanto ci guadagni su ogni pezzo.
     Si aggiorna mentre scrivi il prezzo di acquisto o quello di vendita. */
  function mostraMargine(){
    const box=$("#np-margine"); if(!box)return;
    const acq=parseFloat($("#np-acquisto")?$("#np-acquisto").value:"")||0;
    const ven=parseFloat($("#np-prezzo")?$("#np-prezzo").value:"")||0;
    const um=$("#np-unita")?$("#np-unita").value:"pz";
    if(!acq||!ven){box.textContent="";return;}
    const marg=ven-acq, perc=acq>0?(marg/acq*100):0;
    const col=marg>0?"#1e8e3e":(marg<0?"#c0392b":"#5b6672");
    const eur=n=>n.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
    box.innerHTML='<span style="color:'+col+';font-weight:700">Guadagno: '+eur(marg)+' al '+um+
      ' ('+(perc>=0?"+":"")+perc.toFixed(0)+'%)</span>'+
      (marg<0?' <span style="color:#c0392b">— attenzione: lo vendi sotto costo</span>':"");
  }
  ["np-acquisto","np-prezzo","np-unita"].forEach(function(id){
    const el=$("#"+id);
    if(el){el.addEventListener("input",mostraMargine);el.addEventListener("change",mostraMargine);}
  });
