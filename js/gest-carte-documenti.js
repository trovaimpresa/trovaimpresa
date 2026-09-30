// [SPOSTATO] gest-carte-documenti.js: era dentro gest-core.js, righe 4806-5415, spostato identico.
  /* ============================================================
     CARTE AZIENDALI — tabella gest_carte (anagrafica) + gest_carte_movimenti
     (ricariche/spese). Il saldo NON si scrive mai a mano: arriva sempre
     dalla vista gest_carte_saldo (ricariche - spese). DDL: nella chat con
     l'utente, stesso schema di permessi di gest_mezzi (owner + team_read,
     più un team_insert per i movimenti riservato al dipendente titolare
     della carta — vedi RLS "gest_carte_movimenti_team_insert").
     ============================================================ */
  let carteCache=[];
  async function renderCarte(){
    const box=$("#carte-list");if(!box)return;
    if(!cur){box.innerHTML="";return;}
    if(!sb||!sbUid){box.innerHTML=`<div class="empty"><div class="ic">💳</div><p>Nessuna carta</p><small>Accedi per gestire le carte aziendali</small></div>`;return;}
    const mid=curMestiere();
    const [{data:cs},{data:sd}]=await Promise.all([
      sb.from("gest_carte").select("id,nome,dipendente_id,stato,note").eq("user_id",sbUid).eq("mestiere_id",mid).order("nome"),
      sb.from("gest_carte_saldo").select("carta_id,saldo").eq("user_id",sbUid)
    ]);
    carteCache=cs||[];
    const saldoMap=Object.fromEntries((sd||[]).map(s=>[s.carta_id,s.saldo]));
    if(!carteCache.length){
      box.innerHTML=tabVuoto("Le carte aziendali",
        "Le carte prepagate che dai ai tuoi. Segni cosa ci spendono e quelle spese entrano da sole nel calcolo dell\u2019utile del mese, insieme alle spese dei lavori.",
        _SVGV+'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
        {t:"+ Aggiungi la prima carta",a:"new-carta"});
      return;
    }
    const dipName=id=>{const d=dipCache.find(x=>String(x.id)===String(id));return d?d.nome:null;};
    const ordinate=[...carteCache].sort((a,b)=>(saldoMap[a.id]||0)-(saldoMap[b.id]||0));
    box.innerHTML=ordinate.map(c=>{
      const saldo=saldoMap[c.id]||0;
      const vuota=saldo<=0;
      const nomeDip=dipName(c.dipendente_id);
      const bloccata=c.stato==="bloccata";
      return `<div class="card ${vuota?"t-err":"t-neutro"}" data-action="carta-dettaglio" data-id="${c.id}" style="cursor:pointer">
        <div class="c-head"><h3>${esc(c.nome)}</h3></div>
        <div class="c-num">${eur(saldo)}</div>
        <div class="c-lab">${vuota?"senza soldi — ricarica la carta":"saldo disponibile"}</div>
        <div class="c-righe">
          <div class="c-r"><span class="c-rt">Titolare</span><span class="c-rv">${nomeDip?esc(nomeDip):"nessuno"}</span></div>
          <div class="c-r"><span class="c-rt">Stato</span><span class="c-rv ${bloccata?"":"ok"}">${bloccata?"Bloccata":"Attiva"}</span></div>
        </div>
        <div class="card-acts">${schedaUnPulsante([
          {lab:"Apri",action:"carta-dettaglio",data:{id:c.id}},
          {lab:"✏ Modifica",action:"edit-carta",data:{id:c.id}},
          {lab:"🗑 Elimina",action:"del-carta",data:{id:c.id},del:true}
        ])}</div></div>`;
    }).join("");
  }
  function cartaForm(c){
    const isNew=!c;c=c||{};
    const dipOpts=`<option value="">— nessuno —</option>`+dipCache.map(d=>`<option value="${d.id}" ${String(c.dipendente_id||"")===String(d.id)?"selected":""}>${esc(d.nome)}</option>`).join("");
    /* 9 agosto 2026 — finestra grande a due colonne. Tolti gli stili scritti a
       mano riga per riga: il testo grande nelle finestre lo fa già il CSS
       (blocco "CAMPI DA COMPILARE" in gestionale.css), uguale per tutte. */
    openSheetGrande(isNew?"Nuova carta":"Modifica carta",
      `<div class="sh-cols"><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">La carta</div>
        <div class="field"><label>Nome carta</label><input id="ct-nome" value="${esc(c.nome||"")}" placeholder="Es. Carta Mario, Carta cantiere Nord"></div>
        <div class="field"><label>Titolare (chi ce l'ha in tasca)</label><select id="ct-dip">${dipOpts}</select></div>
        <div class="field"><label>Stato</label><select id="ct-stato">
          <option value="attiva" ${(c.stato||"attiva")==="attiva"?"selected":""}>Attiva</option>
          <option value="bloccata" ${c.stato==="bloccata"?"selected":""}>Bloccata</option></select></div>
        </div>
        </div><div class="sh-col">
        <div class="sh-b">
        <div class="sh-tit">Note</div>
        <div class="field"><textarea id="ct-note" placeholder="Numero carta, limite, promemoria...">${esc(c.note||"")}</textarea></div>
        <p class="sh-nota">Il saldo non si scrive qui: viene da solo dalle ricariche meno le spese, che si registrano dal pulsante <b>Movimenti</b>.</p>
        </div>
        </div></div>`,
      ctrTastoHTML('carta')
      +`<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-carta" data-id="${c.id||""}">${isNew?"Crea":"Salva"}</button>`);
    ctrAscolta('carta');
  }
  async function saveCarta(id){
    const nome=$("#ct-nome").value.trim();if(!nome){toast("Scrivi il nome della carta");return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const dipendente_id=$("#ct-dip").value||null, stato=$("#ct-stato").value, note=$("#ct-note").value.trim()||null;
    const {data,error}=id
      ?await sb.from("gest_carte").update({nome,dipendente_id,stato,note}).eq("id",id).eq("user_id",sbUid).select("id")
      :await sb.from("gest_carte").insert({user_id:sbUid,mestiere_id:curMestiere(),nome,dipendente_id,stato,note}).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata");return;}
    closeSheet();renderCarte();toast(id?"Aggiornata":"Carta aggiunta ✔");
  }
  async function delCarta(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(!gconfirm(window.cestinoAttivo&&window.cestinoAttivo()
        ? "Eliminare questa carta? Finisce nel Cestino e puoi rimetterla a posto. I movimenti restano registrati."
        : "Eliminare questa carta? Anche i movimenti registrati andranno persi."))return;
    const {data,error}=await sb.from("gest_carte").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminata: nessuna riga rimossa");return;}
    renderCarte();toast("Carta eliminata");
  }

  /* dettaglio carta: saldo + movimenti, si apre dalla lista carte */
  let cartaAttivaId=null, movimentiCartaCache=[];
  async function apriDettaglioCarta(id){
    cartaAttivaId=id;
    const c=carteCache.find(x=>String(x.id)===String(id));if(!c)return;
    const dipName=(dipCache.find(d=>String(d.id)===String(c.dipendente_id))||{}).nome;
    openSheetGrande(`💳 ${esc(c.nome)}`,
      `<p style="color:var(--testo-2);font-size:1.05rem;margin-bottom:16px">${dipName?"Titolare: <b>"+esc(dipName)+"</b>":"Nessun titolare assegnato"}</p>
      <div id="ct-saldo-box" style="font-family:'Playfair Display',serif;font-size:3rem;font-weight:700;margin-bottom:22px">—</div>
      <div style="background:#fafafa;border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:22px">
        <div style="font-weight:700;color:#0a2a4d;margin-bottom:14px;font-size:1.1rem">➕ Nuovo movimento</div>
        <div class="row2">
          <div class="field"><label style="font-size:1rem">Tipo</label><select id="mv-tipo" style="font-size:1.05rem;padding:10px">
            <option value="ricarica" selected>Ricarica (aggiunge soldi)</option><option value="spesa">Spesa (toglie soldi)</option></select></div>
          <div class="field"><label style="font-size:1rem">Importo (€)</label><input type="text" id="mv-importo" inputmode="decimal" placeholder="0" style="font-size:1.05rem;padding:10px" data-euro></div>
        </div>
        <div class="field"><label style="font-size:1rem">Per cosa</label><input id="mv-causale" placeholder="Es. Viti e tasselli, ricarica mensile..." style="font-size:1.05rem;padding:10px"></div>
        <button class="btn btn-primary" style="width:100%;font-size:1.05rem;padding:12px" data-action="save-movimento" data-id="${id}">+ Aggiungi movimento</button>
      </div>
      <div id="ct-mov-lista" style="font-size:1.05rem"></div>`,
      `<button class="btn b-cancel" data-action="close">Chiudi</button>`);
    renderMovimentiCarta();
  }
  async function renderMovimentiCarta(){
    const lista=$("#ct-mov-lista"), saldoBox=$("#ct-saldo-box");
    if(!lista||!cartaAttivaId)return;
    const [{data:mv},{data:sd}]=await Promise.all([
      sb.from("gest_carte_movimenti").select("id,tipo,importo,causale,data,inserito_da").eq("carta_id",cartaAttivaId).order("data",{ascending:false}).order("created_at",{ascending:false}),
      sb.from("gest_carte_saldo").select("saldo").eq("carta_id",cartaAttivaId).maybeSingle()
    ]);
    movimentiCartaCache=mv||[];
    const saldo=(sd&&sd.saldo)||0;
    const vuota=saldo<=0;
    if(saldoBox)saldoBox.innerHTML=`${vuota?'<div style="background:var(--err);color:#fff;font-weight:700;font-size:0.95rem;padding:6px 10px;border-radius:8px;margin-bottom:10px;text-align:center">⚠️ SENZA SOLDI — ricarica la carta</div>':""}<span style="color:${vuota?"var(--err)":"#0a2a4d"}">${eur(saldo)}</span>`;
    if(!movimentiCartaCache.length){lista.innerHTML='<div style="color:#999;font-size:0.9rem;text-align:center;padding:14px">Nessun movimento ancora</div>';return;}
    const fmtData=d=>d?new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";
    lista.innerHTML=movimentiCartaCache.map(m=>{
      const segno=m.tipo==="spesa"?"−":"+";
      const colore=m.tipo==="spesa"?"var(--err)":"var(--ok)";
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:600;color:#0a2a4d">${esc(m.causale||(m.tipo==="spesa"?"Spesa":"Ricarica"))}</div>
          <div style="font-size:13px;color:#999">${fmtData(m.data)}${m.inserito_da?" · "+esc(m.inserito_da):""}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-weight:700;color:${colore}">${segno} ${eur(m.importo)}</div>
          <button data-action="del-movimento" data-id="${m.id}" title="Elimina" style="background:transparent;border:none;cursor:pointer;color:#c0392b">🗑️</button>
        </div>
      </div>`;
    }).join("");
  }
  async function salvaMovimentoCarta(){
    if(!cartaAttivaId||!sbUid){toast("Devi essere loggato");return;}
    const tipo=$("#mv-tipo").value;
    const importo=_numIt("#mv-importo")||0;
    if(!importo||importo<=0){toast("Scrivi l'importo, per esempio 12,50");return;}
    /* lo stesso tetto che c'e' nell'app dell'operaio: e' la stessa colonna del
       database, e un dito appoggiato sullo zero non deve passare da una parte
       e fermarsi dall'altra */
    if(importo>1000000){toast("Importo troppo alto: controlla quello che hai scritto");return;}
    const causale=$("#mv-causale").value.trim()||null;
    const {error}=await sb.from("gest_carte_movimenti").insert({
      user_id:sbUid,carta_id:cartaAttivaId,tipo,importo,causale,inserito_da:"Capo"
    });
    if(error){toast("Errore: "+error.message);return;}
    $("#mv-importo").value="";$("#mv-causale").value="";
    toast("Movimento registrato ✔");renderMovimentiCarta();renderCarte();
  }
  async function eliminaMovimentoCarta(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(!gconfirm("Eliminare questo movimento?"))return;
    const {data,error}=await sb.from("gest_carte_movimenti").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga rimossa");return;}
    renderMovimentiCarta();renderCarte();toast("Movimento eliminato");
  }


  /* ============================================================
     RIFORNIMENTI — un pieno per riga, agganciato al MEZZO.
     Le carte restano quello che sono (il portafoglio del dipendente):
     quando si paga con la carta creiamo anche il movimento di spesa e ci
     teniamo il suo id in movimento_id, così se cancelli il rifornimento
     sparisce anche dalla carta e il saldo resta giusto.
     Tabella: gest_rifornimenti + vista gest_mezzi_carburante.
     ============================================================ */
  let rifMezzoId=null, rifCache=[], rifCarte=[], rifOperatori=[];
  const RIF_PAG={carta:{lab:"Carta aziendale",ic:"💳"},buono:{lab:"Buono del distributore",ic:"🎟️"},contanti:{lab:"Contanti",ic:"💶"}};

  async function apriRifornimenti(mezzoId){
    if(!sbUid){toast("Devi essere loggato");return;}
    rifMezzoId=mezzoId;
    const m=mezziCache.find(x=>String(x.id)===String(mezzoId))||{};
    const mid=curMestiere();
    const [{data:ct},{data:op}]=await Promise.all([
      sb.from("gest_carte").select("id,nome,stato").eq("user_id",sbUid).eq("mestiere_id",mid).order("nome"),
      sb.from("gest_operatori").select("id,nome").eq("user_id",sbUid).order("nome")
    ]);
    rifCarte=ct||[]; rifOperatori=op||[];
    const optCarte=rifCarte.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("");
    const optChi=`<option value="">— chi ha fatto il pieno —</option>`+rifOperatori.map(o=>`<option value="${o.id}">${esc(o.nome)}</option>`).join("");
    const optPag=Object.keys(RIF_PAG).map(k=>`<option value="${k}">${RIF_PAG[k].ic} ${RIF_PAG[k].lab}</option>`).join("");
    openSheetGrande(`⛽ Rifornimenti — ${esc(m.nome||"Mezzo")}`,
      `<div id="rf-riassunto" style="margin-bottom:22px"></div>
      <div style="background:#fafafa;border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:22px">
        <div style="font-weight:700;color:#0a2a4d;margin-bottom:14px;font-size:1.1rem">➕ Nuovo pieno</div>
        <div class="row2">
          <div class="field"><label style="font-size:1rem">Giorno</label><input type="date" id="rf-data" value="${todayStr()}" style="font-size:1.05rem;padding:10px"></div>
          <div class="field"><label style="font-size:1rem">Quanto hai speso (€)</label><input type="text" id="rf-importo" inputmode="decimal" placeholder="0" style="font-size:1.05rem;padding:10px" data-euro></div>
        </div>
        <div class="field"><label style="font-size:1rem">Come hai pagato</label><select id="rf-pag" style="font-size:1.05rem;padding:10px">${optPag}</select></div>
        <div class="field" id="rf-carta-box"><label style="font-size:1rem">Con quale carta</label>
          <select id="rf-carta" style="font-size:1.05rem;padding:10px">${optCarte||'<option value="">Nessuna carta registrata</option>'}</select>
          <small style="color:var(--testo-2)">La carta si scala da sola: non riscriverlo nei movimenti.</small></div>
        <div class="row2">
          <div class="field"><label style="font-size:1rem">Distributore</label><input id="rf-distr" placeholder="Es. Q8 via Salaria" style="font-size:1.05rem;padding:10px"></div>
          <div class="field"><label style="font-size:1rem">Chi</label><select id="rf-chi" style="font-size:1.05rem;padding:10px">${optChi}</select></div>
        </div>
        <div class="row2">
          <div class="field"><label style="font-size:1rem">Litri <span style="color:var(--testo-2);font-weight:400">(se vuoi)</span></label><input type="text" id="rf-litri" inputmode="decimal" placeholder="—" style="font-size:1.05rem;padding:10px"></div>
          <div class="field"><label style="font-size:1rem">Chilometri <span style="color:var(--testo-2);font-weight:400">(se vuoi)</span></label><input type="text" id="rf-km" inputmode="numeric" placeholder="—" style="font-size:1.05rem;padding:10px"></div>
        </div>
        <small style="color:var(--testo-2);display:block;margin-bottom:12px">Litri e chilometri servono solo per sapere quanti km fa con un litro. Se hai fretta lasciali vuoti.</small>
        <button class="btn btn-primary" style="width:100%;font-size:1.05rem;padding:12px" data-action="save-rifornimento">+ Registra il pieno</button>
      </div>
      <div id="rf-lista" style="font-size:1.05rem"></div>`,
      `<button class="btn b-cancel" data-action="close">Chiudi</button>`);
    const sel=$("#rf-pag");
    if(sel)sel.addEventListener("change",rifMostraCarta);
    rifMostraCarta();
    renderRifornimenti();
  }

  function rifMostraCarta(){
    const box=$("#rf-carta-box"), sel=$("#rf-pag");
    if(box&&sel)box.style.display=(sel.value==="carta")?"":"none";
  }

  async function renderRifornimenti(){
    const lista=$("#rf-lista"), box=$("#rf-riassunto");
    if(!lista||!rifMezzoId)return;
    const [{data:rf},{data:tot}]=await Promise.all([
      sb.from("gest_rifornimenti").select("id,data,pagamento,distributore,operatore_id,importo,litri,km,movimento_id")
        .eq("mezzo_id",rifMezzoId).order("data",{ascending:false}).order("id",{ascending:false}),
      sb.from("gest_mezzi_carburante").select("*").eq("mezzo_id",rifMezzoId).maybeSingle()
    ]);
    rifCache=rf||[];
    const t=tot||{};
    if(box){
      const kml=t.km_litro?`<div><div style="font-size:0.85rem;color:var(--testo-2)">Km con un litro</div><div style="font-weight:700;font-size:1.4rem">${String(t.km_litro).replace(".",",")}</div></div>`:"";
      const buoni=(+t.spesa_buoni||0)>0?`<div><div style="font-size:0.85rem;color:var(--testo-2)">Di cui con buoni</div><div style="font-weight:700;font-size:1.4rem">${eur2(t.spesa_buoni)}</div></div>`:"";
      box.innerHTML=rifCache.length
        ?`<div style="display:flex;gap:26px;flex-wrap:wrap;background:#f4f8ff;border:1px solid var(--border);border-radius:12px;padding:18px">
            <div><div style="font-size:0.85rem;color:var(--testo-2)">Speso in tutto</div><div style="font-weight:700;font-size:1.4rem">${eur2(t.spesa_totale)}</div></div>
            <div><div style="font-size:0.85rem;color:var(--testo-2)">Pieni fatti</div><div style="font-weight:700;font-size:1.4rem">${t.rifornimenti||rifCache.length}</div></div>
            ${buoni}${kml}
          </div>`
        :"";
    }
    if(!rifCache.length){
      lista.innerHTML='<div style="color:#999;text-align:center;padding:18px">Nessun pieno registrato per questo mezzo</div>';
      return;
    }
    const fmtData=d=>d?new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";
    const chi=id=>{const o=rifOperatori.find(x=>String(x.id)===String(id));return o?o.nome:""};
    lista.innerHTML=rifCache.map(r=>{
      const p=RIF_PAG[r.pagamento]||RIF_PAG.contanti;
      const sotto=[fmtData(r.data),p.ic+" "+p.lab,r.distributore?esc(r.distributore):"",chi(r.operatore_id)?"👷 "+esc(chi(r.operatore_id)):""].filter(Boolean).join(" · ");
      const extra=[r.litri?String(r.litri).replace(".",",")+" litri":"", r.km?Number(r.km).toLocaleString("it-IT")+" km":""].filter(Boolean).join(" · ");
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="min-width:0">
          <div style="font-weight:600;color:#0a2a4d">${eur2(r.importo)}${extra?' <span style="font-weight:400;color:var(--testo-2)">— '+extra+'</span>':''}</div>
          <div style="font-size:0.85rem;color:#999">${sotto}</div>
        </div>
        <button data-action="del-rifornimento" data-id="${r.id}" title="Elimina" style="background:transparent;border:none;cursor:pointer;color:#c0392b;font-size:1.1rem">🗑️</button>
      </div>`;
    }).join("");
  }

  async function salvaRifornimento(){
    if(!rifMezzoId||!sbUid){toast("Devi essere loggato");return;}
    const importo=_numIt("#rf-importo")||0;
    if(!importo||importo<=0){toast("Scrivi quanto hai speso");return;}
    const pagamento=$("#rf-pag").value;
    const carta_id=(pagamento==="carta")?($("#rf-carta").value||null):null;
    if(pagamento==="carta"&&!carta_id){toast("Scegli con quale carta hai pagato");return;}
    const data=$("#rf-data").value||todayStr();
    const distributore=$("#rf-distr").value.trim()||null;
    const operatore_id=$("#rf-chi").value||null;
    const litri=_numIt("#rf-litri");
    const _km=_numIt("#rf-km");
    const km=(_km==null)?null:Math.round(_km);
    const mezzoNome=(mezziCache.find(x=>String(x.id)===String(rifMezzoId))||{}).nome||"Mezzo";

    /* se ha pagato con la carta, la carta si scala qui: un posto solo */
    let movimento_id=null;
    if(carta_id){
      const {data:mv,error:e1}=await sb.from("gest_carte_movimenti").insert({
        user_id:sbUid,carta_id,tipo:"spesa",importo,data,
        causale:"⛽ "+mezzoNome+(distributore?" · "+distributore:""),inserito_da:"Capo"
      }).select("id");
      if(e1){toast("Errore: "+e1.message);return;}
      movimento_id=(mv&&mv[0])?mv[0].id:null;
    }
    const {error}=await sb.from("gest_rifornimenti").insert({
      user_id:sbUid,mestiere_id:curMestiere(),mezzo_id:rifMezzoId,data,pagamento,
      carta_id,movimento_id,distributore,operatore_id,importo,litri,km
    });
    if(error){
      /* se il rifornimento non entra, tolgo anche il movimento appena creato:
         mai lasciare la carta scalata per un pieno che non esiste */
      if(movimento_id)await sb.from("gest_carte_movimenti").delete().eq("id",movimento_id).eq("user_id",sbUid);
      toast("Errore: "+error.message);return;
    }
    ["#rf-importo","#rf-litri","#rf-km","#rf-distr"].forEach(s=>{const el=$(s);if(el)el.value="";});
    toast("Pieno registrato ✔");
    renderRifornimenti();renderMezzi();
    if(carta_id)renderCarte();
  }

  async function eliminaRifornimento(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(!gconfirm("Eliminare questo pieno?"))return;
    const r=rifCache.find(x=>String(x.id)===String(id));
    const {data,error}=await sb.from("gest_rifornimenti").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga rimossa");return;}
    if(r&&r.movimento_id){await sb.from("gest_carte_movimenti").delete().eq("id",r.movimento_id).eq("user_id",sbUid);renderCarte();}
    renderRifornimenti();renderMezzi();toast("Pieno eliminato");
  }


  /* ============================================================
     COSA TI MANCA? — le richieste dell'impresa (gest_richieste).
     Lei scrive, noi rispondiamo cambiando lo stato dal pannello admin.
     Lo stato non lo può toccare: le regole del database glielo impediscono.
     ============================================================ */
  const RQ_STATI={
    ricevuta:{lab:"Ricevuta",bg:"#eef2f7",fg:"#5b6b80"},
    in_lavorazione:{lab:"Ci stiamo lavorando",bg:"#fff3e0",fg:"#b26a00"},
    fatta:{lab:"Fatta ✔",bg:"#e6f6ec",fg:"#1b8a3f"},
    non_faremo:{lab:"Per ora non la facciamo",bg:"#fdecea",fg:"#b3261e"}
  };

  /* ============================================================
     ⛔ 22 agosto 2026 — I DOCUMENTI DEL LAVORO / DELLA PRATICA
     ============================================================
     Copiate riga per riga da quelle dei documenti del fornitore, che dal
     6 settembre 2026 stanno in js/gest-fornitori.js (prima erano qui sopra):
     stessa tabella (`gest_foto`), stesso deposito, stesso modo di aprire e
     di eliminare. Cambia solo il collegamento: `lavoro_id` invece di
     `fornitore_id`, e `tipo:"documento"`.
     ⛔ `tipo:"documento"` NON e' un dettaglio: e' il nome che tiene questi
     file fuori dalla Galleria e dai contatori delle foto. Sta nell'elenco
     `TIPI_NON_FOTO`, in un posto solo.
     ⚠️ Non si comprime niente: preparaFileUpload lascia intatto quello che
     non e' un'immagine, e applica solo il limite dei 15 MB. Una foto invece
     la comprime, ed e' giusto: una planimetria fotografata col telefono pesa
     come otto PDF. */
  let docLavId=null;
  async function renderDocLavoro(lavoroId){
    docLavId=lavoroId||null;
    const wrap=$("#lav-doc-wrap"), box=$("#lav-doc-lista");
    if(!wrap||!box)return;
    if(!docLavId||!sb||!sbUid){wrap.style.display="none";return;}
    wrap.style.display="";
    const {data,error}=await sb.from("gest_foto").select("id,storage_path,nome_file,created_at")
      .eq("user_id",sbUid).eq("lavoro_id",docLavId).eq("tipo","documento")
      .order("created_at",{ascending:false});
    if(error){box.innerHTML='<div class="campo-aiuto" style="color:var(--attesa)">Non riesco a leggere i documenti: '+esc(error.message||"")+'</div>';return;}
    if(!data||!data.length){box.innerHTML='<div class="campo-aiuto">Nessun documento per ora. Usa il pulsante qui sotto.</div>';return;}
    box.innerHTML=data.map(d=>{
      const nome=d.nome_file||String(d.storage_path||"").split("/").pop()||"documento";
      const quando2=d.created_at?new Date(d.created_at).toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric"}):"";
      return '<div class="doc-riga">'
        +'<span class="doc-ico">'+docCliIcona(nome)+'</span>'
        +'<span class="doc-nome">'+esc(nome)+'<small>'+esc(quando2)+'</small></span>'
        +'<button type="button" class="btn" data-action="doc-cli-apri" data-id="'+esc(d.id)+'">Apri</button>'
        +'<button type="button" class="btn b-del" data-action="lav-doc-del" data-id="'+esc(d.id)+'">Elimina</button>'
        +'</div>';
    }).join("");
  }
  async function uploadDocLavoro(files){
    if(!files||!files.length||!docLavId)return;
    if(!sbUid){toast("Devi essere loggato");return;}
    let ok=0;
    for(const file of Array.from(files)){
      const pr=await preparaFileUpload(file);
      if(pr.errore){toast(pr.errore);continue;}
      const safe=String(pr.nome||"documento").replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=sbUid+"/"+docLavId+"/doc/"+Date.now()+"_"+safe;
      const {error:up}=await sb.storage.from("gestionale-foto").upload(path,pr.file);
      if(up){toast("Non caricato: "+up.message);continue;}
      /* ⚠️ come dappertutto: se la riga non si scrive, il file nel deposito
         resta orfano e non lo vede piu' nessuno. Si toglie subito. */
      const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,lavoro_id:docLavId,tipo:"documento",operatore:"Capo",storage_path:path,nome_file:pr.nome||safe});
      if(ins){await _fileOrfano("gestionale-foto",path);toast("Non registrato: "+ins.message);continue;}
      ok++;
    }
    if(ok)toast(ok+(ok===1?" documento caricato ✔":" documenti caricati ✔"));
    /* ⚠️ con l'await: senza, il messaggio arriva mentre l'elenco e' ancora
       quello di prima. Trovato dal banco, non a occhio. */
    await renderDocLavoro(docLavId);
  }
  async function lavDocElimina(id){
    if(!gconfirm("Eliminare questo documento?"))return;
    const {data:r}=await sb.from("gest_foto").select("storage_path").eq("id",id).eq("user_id",sbUid).maybeSingle();
    /* la .select('id') fa da cancello: se la RLS blocca, PostgREST tocca zero
       righe e risponde OK — senza questo si direbbe «eliminato» a vuoto. */
    const {data:okD,error}=await sb.from("gest_foto").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!okD||!okD.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
    /* col cestino il file NON si tocca: se no il ripristino darebbe un documento rotto */
    if(r&&r.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo())){try{await sb.storage.from("gestionale-foto").remove([r.storage_path]);}catch(e){}}
    await renderDocLavoro(docLavId);toast("Documento eliminato");
  }

  async function fattfForm(f){
    const isNew=!(f&&f.id);f=f||{};
    /* 26 set 2026 — prima qui si fermava: «Prima aggiungi un fornitore».
       Con la foto della fattura il fornitore lo si aggiunge da li', con un
       tocco: quindi il modulo si apre lo stesso, con la tendina vuota. */
    const fops=(fornCache.length?'':'<option value="">— nessun fornitore ancora —</option>')+fornCache.map(x=>'<option value="'+x.id+'" '+(String(f.fornitore_id||'')===String(x.id)?'selected':'')+'>'+esc(x.nome)+'</option>').join("");
    let lavOps='<option value="">— nessuno —</option>';
    if(sb&&sbUid){
      const {data:lv}=await sb.from("gest_lavori").select("id,descrizione").eq("user_id",sbUid).eq("mestiere_id",curMestiere()).order("data_prevista",{ascending:false}).limit(100);
      lavOps+=(lv||[]).map(l=>'<option value="'+l.id+'" '+(String(f.lavoro_id||'')===String(l.id)?'selected':'')+'>'+esc(l.descrizione||'Lavoro')+'</option>').join("");
    }
    openSheetGrande(isNew?'Fattura da pagare':'Modifica fattura',
      '<div class="sh-cols"><div class="sh-col">'
      +(isNew&&typeof ffFotoHTML==="function"?ffFotoHTML():'')
      +'<div class="sh-b">'
      +'<div class="sh-tit">La fattura</div>'
      +'<div class="field"><label>Fornitore</label><select id="ff-forn">'+fops+'</select>'
      +(fornCache.length?'':'<div class="campo-aiuto">Con la foto qui sopra lo aggiungo io. A mano: <button type="button" class="aic-link" data-action="new-forn">+ Nuovo fornitore</button></div>')
      +'</div>'
      +'<div class="row2">'
      +'<div class="field"><label>Numero fattura</label><input id="ff-num" value="'+esc(f.numero||'')+'" placeholder="Es. 124/2026"></div>'
      +'<div class="field"><label>Data fattura</label><input type="date" id="ff-data" value="'+(f.data||todayStr())+'"></div></div>'
      +'<div class="row2">'
      +'<div class="field"><label>Importo (€)</label><input type="text" id="ff-imp" inputmode="decimal" value="'+(f.importo||'')+'" placeholder="0" data-euro></div>'
      +'<div class="field"><label>Da pagare entro</label><input type="date" id="ff-scad" value="'+(f.scadenza||'')+'"></div></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b">'
      +'<div class="sh-tit">Collegamenti e note</div>'
      +'<p class="sh-nota" style="margin-top:0">Se la colleghi a un lavoro, il suo importo entra <b>da solo</b> nel margine di quel lavoro, su una riga sua. <b>Non riscriverla anche fra le Spese</b>: la conteresti due volte.</p>'
      +'<div class="field"><label>Lavoro collegato (facoltativo)</label><select id="ff-lav">'+lavOps+'</select></div>'
      +'<div class="field"><label>Note</label><textarea id="ff-note" placeholder="Es. sabbia e cemento per il bagno di Via Roma">'+esc(f.note||'')+'</textarea></div>'
      +'</div>'
      +'</div></div>',
      ctrTastoHTML('fattfornitore')
      +'<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="save-fattf" data-id="'+(f.id||'')+'">'+(isNew?'Aggiungi':'Salva')+'</button>');
    ctrAscolta('fattfornitore');
    if(isNew&&typeof ffFotoVia==="function")ffFotoVia();
  }
  async function saveFattf(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const fornitore_id=$("#ff-forn").value;if(!fornitore_id){toast("Scegli il fornitore");return;}
    const importo=_numIt("#ff-imp")||0;if(!(importo>0)){toast("Scrivi l'importo della fattura, per esempio 1.200,50");return;}
    const row={fornitore_id,numero:$("#ff-num").value.trim()||null,data:$("#ff-data").value||todayStr(),
      importo,scadenza:$("#ff-scad").value||null,lavoro_id:$("#ff-lav").value||null,note:$("#ff-note").value.trim()||null};
    const {data,error}=id
      ?await sb.from("gest_fatture_fornitori").update(row).eq("id",id).eq("user_id",sbUid).select("id")
      :await sb.from("gest_fatture_fornitori").insert(Object.assign({},row,{user_id:sbUid,mestiere_id:curMestiere(),stato:"da_pagare"})).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non salvato: nessuna riga modificata. Riprova.");return;}
    /* la foto letta dall'AI resta fra i documenti del fornitore */
    if(!id&&typeof ffFotoAllega==="function")ffFotoAllega(fornitore_id);
    closeSheet();renderFornitori();rinfresca("riepilogo");toast(id?"Aggiornata ✔":"Fattura registrata ✔");
  }

  /* ============================================================
     RICHIESTE DAL SITO — 15 agosto 2026

     Le richieste NON si copiano da nessuna parte: si leggono direttamente da
     public.preventivi, che ha gia' la sua regola di sicurezza
       preventivi_impresa_select -> EXISTS (imprese WHERE id=impresa_id AND user_id=auth.uid())
     cioe' ogni impresa vede SOLO quelle arrivate a lei. Nessun filtro da
     scrivere qui: se lo scrivessi a mano sarebbe una seconda copia della
     regola, e le due copie prima o poi si scollano.

     Lo stato sta in gest_dalsito. "nuova" NON si scrive: e' l'assenza di riga.

     I contatti del cliente (email e telefono) NON sono leggibili dal
     database: sono revocati per tutti. Si chiedono a contatto-preventivo.js,
     esattamente come fa il pannello. Cosi' se un giorno torna una regola sui
     piani, vale automaticamente anche qui.
     ============================================================ */
  const DS_STATI={
    nuova:      {lab:"Nuova",            bar:"da_fare",  tono:"t-attesa", bg:"var(--attesa-bg)", fg:"var(--attesa)"},
    vista:      {lab:"Vista",            bar:"in_corso", tono:"t-neutro", bg:"var(--info-bg)",   fg:"var(--info)"},
    preventivo: {lab:"Preventivo fatto", bar:"fatto",    tono:"t-ok",     bg:"var(--ok-bg)",     fg:"var(--ok)"},
    chiusa:     {lab:"Chiusa",           bar:"fatto",    tono:"t-neutro", bg:"var(--sfondo)",    fg:"var(--testo-2)"}
  };
  /* Le viste devono coprire TUTTI gli stati: una richiesta con il preventivo
     gia' fatto finiva solo in "Tutte" e sembrava sparita. */
  const DS_VISTE=[{k:"da_fare",lab:"Da fare"},{k:"nuove",lab:"Nuove"},{k:"fatte",lab:"Fatte"},{k:"tutte",lab:"Tutte"}];
  let dsCache=[], dsFilter="da_fare";

  const _dsData=r=>String(r.created_at||"").slice(0,10);
  const _dsCosa=r=>r.categoria_lavoro||r.tipo_lavoro||"Richiesta di preventivo";
  const _dsSt=r=>DS_STATI[r._stato]||DS_STATI.nuova;

  async function dsCarica(){
    if(!sb||!sbUid)return [];
    const [r1,r2]=await Promise.all([
      sb.from("preventivi")
        .select("id,nome,cognome,citta,via,categoria_lavoro,tipo_lavoro,descrizione,data_preferita,urgenza,budget,foto,mq,piano,note_aggiuntive,risposta_at,created_at")
        .order("created_at",{ascending:false}).limit(300),
      sb.from("gest_dalsito").select("preventivo_id,stato,preventivo_creato_id").eq("user_id",sbUid)
    ]);
    if(r1.error){
      toast("Non riesco a leggere le richieste dal sito: "+(r1.error.message||"il database non risponde"));
      return [];
    }
    const m={};(r2.data||[]).forEach(s=>{m[String(s.preventivo_id)]=s;});
    return (r1.data||[]).map(r=>{
      const s=m[String(r.id)];
      return Object.assign({},r,{_stato:(s&&s.stato)||"nuova",_prevId:(s&&s.preventivo_creato_id)||null});
    });
  }

  /* Segna lo stato. Ogni scrittura verificata con .select("id"): senza,
     una scrittura bloccata dalle regole e' identica a una riuscita. */
  async function dsSegna(pid,stato,extra){
    if(!sb||!sbUid)return false;
    const riga=Object.assign({user_id:sbUid,preventivo_id:Number(pid),stato:stato,letta_il:new Date().toISOString()},extra||{});
    const {data,error}=await sb.from("gest_dalsito")
      .upsert(riga,{onConflict:"user_id,preventivo_id"}).select("id");
    if(error||!data||!data.length){
      toast("Non sono riuscito a salvare: "+((error&&error.message)||"nessuna riga scritta"));
      return false;
    }
    return true;
  }

  function dsVoci(r){
    const v=[];
    if(r._stato!=="preventivo")v.push({lab:"🧾 Crea il preventivo",action:"ds-prev",data:{id:r.id}});
    v.push({lab:"📇 Vedi i contatti",action:"ds-apri",data:{id:r.id}});
    v.push({sep:true});
    if(r._stato==="chiusa")v.push({lab:"↩ Riapri",action:"ds-riapri",data:{id:r.id}});
    else v.push({lab:"✔ Segna chiusa",action:"ds-chiudi",data:{id:r.id}});
    return v;
  }

  function dsCard(r){
    const st=_dsSt(r), q=quando(_dsData(r),{neutro:true});
    return schedaJob({
      tono:st.tono,
      titolo:esc(r.nome||"—"),
      destra:`<span class="stato" style="background:${st.bg};color:${st.fg}">${st.lab}</span>`,
      meta:[
        "Arrivata "+q.testo,
        esc(_dsCosa(r)),
        r.citta?esc(r.citta):null,
        r.urgenza?"Urgenza: "+esc(r.urgenza):null
      ],
      nota:r.descrizione?esc(r.descrizione):null,
      azioni:dsVoci(r)
    });
  }

  async function renderDalSito(){
    const box=$("#ds-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML="";return;}
    dsCache=await dsCarica();
    const aperte=dsCache.filter(r=>r._stato==="nuova"||r._stato==="vista");
    const conta={
      da_fare:aperte.length,
      nuove:dsCache.filter(r=>r._stato==="nuova").length,
      fatte:dsCache.filter(r=>r._stato==="preventivo"||r._stato==="chiusa").length,
      tutte:dsCache.length
    };
    let L=dsCache;
    if(dsFilter==="da_fare")L=aperte;
    else if(dsFilter==="nuove")L=dsCache.filter(r=>r._stato==="nuova");
    else if(dsFilter==="fatte")L=dsCache.filter(r=>r._stato==="preventivo"||r._stato==="chiusa");

    renderTabella({
      id:"ds", box:"#ds-list",
      viste:"#ds-viste", visteDef:DS_VISTE, vista:dsFilter, conta:conta, azioneVista:"ds-filtro",
      vuoto:tabVuoto(
        dsCache.length?"Nessuna richiesta con questo filtro":"Ancora nessuna richiesta dal sito",
        dsCache.length?"Prova a cambiare vista qui sopra."
          :"Quando un cliente ti scrive dalla tua pagina su TrovaImpresa, la richiesta compare qui dentro: chi ha scritto, cosa gli serve e i suoi contatti. Da qui gli fai il preventivo con un clic.",
        _SVGV+'<path d="M3 12h4l2 5 4-13 2 8h6"/></svg>',
        null),
      colonne:[{lab:"Arrivata",w:"18%"},{lab:"Chi ha scritto",w:"26%"},{lab:"Cosa chiede",w:"32%"},{lab:"Dove",w:"24%"}],
      righe:L.map(r=>{
        const st=_dsSt(r), q=quando(_dsData(r),{neutro:true});
        return {
          id:r.id,
          click:{action:"ds-apri",data:{id:r.id}},
          celle:[
            {h:q.testo,cls:q.classe},
            `<span class="lav-bar ${st.bar}" title="${st.lab}"></span><span class="c-nome">${esc(r.nome||"—")}</span>`,
            esc(_dsCosa(r)),
            esc(r.citta||"—")
          ],
          menu:dsVoci(r)
        };
      }),
      totale:{testo:L.length+" "+(L.length===1?"richiesta":"richieste")},
      cards:()=>L.map(dsCard).join("")
    });
    contaDalSito();
  }

