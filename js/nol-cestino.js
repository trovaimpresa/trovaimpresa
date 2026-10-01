// [SPOSTATO] nol-cestino.js: era dentro nol-core.js, righe 4335-4490, spostato identico.

  /* ================================================================
     IL CESTINO DEL NOLEGGIO — 23 agosto 2026
     `js/cestino.js` era caricato in questa pagina dal primo giorno, ma il
     suo elenco di tabelle conteneva solo le `gest_*`: tutto quello che si
     cancellava da qui spariva davvero. Il 23 agosto Alessio ha eseguito
     `sql/noleggio-cestino.sql` (risposta: 6 colonne) e sono state aggiunte
     le tre tabelle del noleggio e le tre del magazzino.

     ⛔ Lo stampo e' quello di tutte le altre sezioni: sulla riga solo
     «Apri». «Butta per sempre» sta DENTRO la scheda, dietro un clic in
     piu': e' l'unico pulsante di tutto il gestionale da cui non si torna
     indietro, e non deve stare su un elenco dove si scorre col pollice.
     ================================================================ */
  const CEST_COSE=[
    {t:"gest_mezzi",    lab:"Mezzo",           tipo:"mezzo",     col:"#2e7d32"},
    {t:"gest_clienti",  lab:"Cliente",         tipo:"cliente",   col:"#1565c0"},
    {t:"nol_noleggi",   lab:"Noleggio",        tipo:"noleggio",  col:"#e65100"},
    {t:"neg_prodotti",  lab:"Prodotto",        tipo:"prodotto",  col:"#1565c0"},
    {t:"neg_fornitori", lab:"Fornitore",       tipo:"fornitore", col:"#1565c0"},
    {t:"neg_movimenti", lab:"Movimento",       tipo:"movimento", col:"#757575"},
    {t:"gest_lavori",   lab:"Lavoro / fattura",tipo:"fattura",   col:"#7C3AED"},
    {t:"nol_media",     lab:"Foto o video",    tipo:"media",     col:"#00838f"},
    /* 14 settembre 2026 — senza questa riga un promemoria buttato spariva e
       basta: la riga restava nel database con eliminato_il scritto, ma nel
       Cestino non la vedeva nessuno e non si poteva rimettere a posto. */
    {t:"promemoria",    lab:"Promemoria",      tipo:"promemoria",col:"#0066ff"}
  ];
  let cestCache=[], cestQ="";

  function cestAcceso(){return !!(window.cestinoAttivo&&window.cestinoAttivo()&&sb&&sb.raw);}
  /* la frase da mettere nella domanda prima di eliminare: col cestino acceso
     «non si torna indietro» sarebbe una bugia, e spaventa per niente */
  function cestFrase(){return cestAcceso()
    ? "Finisce nel Cestino: da lì lo rimetti a posto quando vuoi."
    : "Non si torna indietro.";}
  function cestNome(r){
    return [r.nome,r.descrizione,r.mezzo,r.prodotto,r.titolo,r.nome_file,r.testo]
      .map(v=>String(v==null?"":v).trim()).find(v=>v!=="")||"(senza nome)";
  }
  function cestQuando(iso){
    if(!iso) return "";
    const d=String(iso).slice(0,10), o=String(iso).slice(11,16);
    return fdate(d)+(o?" alle "+o:"");
  }
  function cestSegnaPallino(n){
    const e=$("#cnt-cestino"); if(!e) return;
    /* ⚠️ display="" NON riaccende niente: il foglio di stile dice
       display:none, e la casella vuota ci ricasca. Ci vuole il valore vero. */
    e.textContent=n>0?String(n):""; e.style.display=n>0?"inline-block":"none";
  }

  async function renderCestinoNol(soloDisegno){
    const box=$("#cest-body"); if(!box) return;
    if(!(sb&&sbUid)){box.innerHTML='<p style="color:#666;padding:8px">Devi essere collegato.</p>';return;}
    const st=(window.cestinoStato&&window.cestinoStato())||null;
    if(st&&st.attesa>0){
      box.innerHTML='<p style="color:#666;padding:8px">Sto controllando il cestino. Ci vuole un attimo: finché non ho una risposta chiara dal database non lascio eliminare niente. Riprova fra qualche secondo.</p>';
      return;
    }
    if(!cestAcceso()){
      box.innerHTML='<p style="color:#666;padding:8px">Il cestino non è ancora acceso su questa parte. Esegui <b>sql/noleggio-cestino.sql</b> su Supabase e ricarica la pagina.</p>';
      return;
    }
    if(!soloDisegno){
      /* una domanda piccola per tabella, tutte insieme: un solo giro di rete */
      const risposte=await Promise.all(CEST_COSE.map(async c=>{
        let r=null;
        try{
          r=await sb.raw(c.t).select("*").eq("user_id",sbUid)
              .not("eliminato_il","is",null)
              .order("eliminato_il",{ascending:false}).limit(200);
        }catch(e){ r=null; }
        return {c:c, righe:(r&&!r.error&&r.data)||[], ko:!!(!r||r.error)};
      }));
      cestCache=[];
      risposte.forEach(x=>x.righe.forEach(r=>cestCache.push({
        tab:x.c.t, tipo:x.c.tipo, lab:x.c.lab, col:x.c.col,
        nome:cestNome(r).slice(0,80), quando:r.eliminato_il, id:r.id, riga:r
      })));
      cestCache.sort((a,b)=>String(b.quando||"").localeCompare(String(a.quando||"")));
      /* ⚠️ se una tabella non ha risposto, «non lo so» non e' «zero»: il
         pallino non si riscrive, se no direbbe meno del vero. */
      if(!risposte.some(x=>x.ko)) cestSegnaPallino(cestCache.length);
    }
    const q=(cestQ||"").trim().toLowerCase();
    const vis=cestCache.map((x,i)=>({x:x,i:i}))
      .filter(v=>!q||(v.x.nome+" "+v.x.lab).toLowerCase().includes(q));
    if(!cestCache.length){
      box.innerHTML='<p style="color:#666;padding:8px">Il cestino è vuoto. Quello che elimini finisce qui.</p>';return;
    }
    if(!vis.length){
      box.innerHTML='<p style="color:#666;padding:8px">Niente che si chiami così, fra le '+cestCache.length+' cose nel cestino.</p>';return;
    }
    box.innerHTML=vis.map(v=>
      nolCard({col:v.x.col,
        titolo:esc(v.x.nome),
        eti:[{t:esc(v.x.lab.toUpperCase())}],
        corpo:`<div class="sub2">Buttato il ${esc(cestQuando(v.x.quando))}</div>`,
        pulsanti:`<div class="nol-azioni">
          <button class="nol-az nol-az-apri" data-action="cest-apri" data-i="${v.i}">Apri</button>
        </div>`})).join("");
  }

  /* la scheda di una cosa nel cestino: a tutta pagina come tutte le altre,
     con dentro quello che c'era scritto, cosi' si riconosce prima di
     decidere. Le stesse righe della stampa: `nolRighe`. */
  function schedaCestino(i){
    const v=cestCache[i]; if(!v){toast("Questa riga non c'è più");return;}
    let righe=[];
    try{ righe=nolRighe(v.tipo,v.riga)||[]; }catch(e){ righe=[]; }
    openSheet(`<h3>Nel cestino — ${esc(v.nome)}</h3>
      <div class="nol-azioni nol-azioni-scheda">
        <button class="nol-az nol-az-apri" data-action="cest-su" data-i="${i}">Rimetti a posto</button>
        <button class="nol-az nol-az-rosso" data-action="cest-mai" data-i="${i}">Butta per sempre</button>
      </div>
      <div class="nol-riq nol-cam"><h4>${esc(v.lab)} — buttato il ${esc(cestQuando(v.quando))}</h4>
        <table class="cest-righe">${righe.map(r=>
          `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")
          ||'<tr><td colspan="2">Niente da mostrare.</td></tr>'}</table>
      </div>
      <div class="sheet-actions"><button class="b-cancel" data-action="close">Annulla</button></div>`);
  }

  async function cestRimetti(i){
    const v=cestCache[i]; if(!v||!cestAcceso()) return;
    const {error}=await sb.raw(v.tab).update({eliminato_il:null})
      .eq("id",v.id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();
    cestCache.splice(i,1); cestSegnaPallino(cestCache.length);
    await renderCestinoNol();
    const t=NOL_TIPI[v.tipo]; if(t&&t.ricarica) t.ricarica();
    renderRiepilogoNegozio();
    toast(v.lab+" rimesso a posto ✔");
  }

  async function cestPerSempre(i){
    const v=cestCache[i]; if(!v||!cestAcceso()) return;
    if(!confirm("Buttare per sempre «"+v.nome+"»?\nQuesta volta non si torna indietro davvero.")) return;
    /* sb.raw e non sb.from: qui la cancellazione deve essere vera */
    const {error}=await sb.raw(v.tab).delete().eq("id",v.id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();
    cestCache.splice(i,1); cestSegnaPallino(cestCache.length);
    await renderCestinoNol();
    toast(v.lab+" buttato per sempre");
  }

  /* js/cestino.js chiama questa quando qualcosa entra nel cestino: e' l'unico
     punto da cui passano TUTTE le cancellazioni, cosi' non se ne dimentica
     nessuna e il pallino non resta indietro. */
  window.segnaCestinoDaRifare=function(){
    if($("#cestino")&&$("#cestino").classList.contains("active")) renderCestinoNol();
    else cestSegnaPallino((parseInt($("#cnt-cestino")?$("#cnt-cestino").textContent:"0")||0)+1);
  };
