  /* ============================================================
     10 novembre 2026 — IL COMPUTO CON L'AI
     ============================================================
     Due lavori, chiesti da Alessio («aumentiamo le sue capacità»):

       1. AGGIUNGERE LAVORAZIONI a un computo (che c'è o nuovo) dicendolo
          alla Chat con AI: «nel computo di Rossi aggiungi 50 metri di siepe».
       2. METTERE I PREZZI alle righe a zero (il computo del geometra),
          presi dal Prezzario di chi lavora.

     ⛔ L'AI NON SCRIVE NIENTE. La chat prepara una PROPOSTA
     (netlify/functions/chat-gestionale.mjs, attrezzi `compila_computo` e
     `prezzi_computo`) e qui si apre una schermata di controllo: una spunta
     per riga, i numeri si possono correggere, e nel computo entra solo
     quello che l'utente fa entrare col suo pulsante. È la stessa regola
     della schermata «Controlla quello che ho letto» del PDF del geometra,
     e le righe hanno lo stesso aspetto (.cp-riga).

     ⛔ LA SCRITTURA RESTA IN UN POSTO SOLO: le lavorazioni nuove passano da
     `_compScriviVoci` (gest-computo-pdf.js), come Excel e PDF.

     ⛔ UN PREZZO SI SCRIVE SOLO SU UNA RIGA ANCORA A ZERO. Lo controlla la
     pagina prima di mostrare la riga, e lo ricontrolla il database al
     momento di scrivere (filtro sull'update): un prezzo già messo è una
     decisione presa e non si tocca.

     Questo file NON è in un IIFE, come gli altri js/gest-*: vede sb, sbUid,
     esc, eur, toast, $, $$, openSheetGrande, closeSheet, compCache,
     compVociCompId, computoForm, renderComputi, renderCompVoci,
     _compScriviVoci, curMestiere, todayStr. Le sue azioni le ascolta da
     solo (i clic della pagina lasciano passare quello che non conoscono).
     ============================================================ */
  let caiStato=null;

  /* «1.250,50» → 1250.5 · «12,5» → 12.5 · vuoto o storto → null */
  function caiNum(t){
    let s=String(t==null?"":t).trim().replace(/[€\s]/g,"");
    if(!s)return null;
    if(s.indexOf(",")>=0)s=s.replace(/\./g,"").replace(",",".");
    const n=Number(s);
    return (isFinite(n)&&n>=0)?n:null;
  }
  function caiTesto(n){
    if(n==null||n===""||!isFinite(+n))return "";
    return String(Math.round((+n)*1000)/1000).replace(".",",");
  }
  function caiVaiAlComputo(){
    const b=document.querySelector('nav.tabs button[data-tab="computi"]');
    if(b&&!b.classList.contains("active"))b.click();
  }
  async function caiTrova(id){
    let c=(compCache||[]).find(function(x){return String(x.id)===String(id);});
    if(!c){ await renderComputi(); c=(compCache||[]).find(function(x){return String(x.id)===String(id);}); }
    return c||null;
  }

  /* ---------------- 1. LAVORAZIONI DA AGGIUNGERE ---------------- */
  function caiDisegnaVoci(){
    const S=caiStato; if(!S)return;
    const V=S.voci;
    const senza=V.filter(function(v){return !(+v.prezzo_unitario>0);}).length;
    const riga=function(v,i){
      const haPrezzo=(+v.prezzo_unitario>0);
      return '<div class="cp-riga cai-riga" data-i="'+i+'">'
        +'<label class="cp-si"><input type="checkbox" class="cp-ck" checked> <span>la prendo</span></label>'
        +'<div class="cai-desc">'+esc(v.descrizione||"")+'</div>'
        +'<div class="cp-campi cai-campi">'
        +  '<div class="field"><label>Unità</label><input class="cai-um" value="'+esc(v.unita||"")+'" autocomplete="off"></div>'
        +  '<div class="field"><label>Quantità</label><input class="cai-qta" inputmode="decimal" value="'+esc(caiTesto(v.quantita))+'" placeholder="la metti tu" autocomplete="off"></div>'
        +  '<div class="field"><label>Prezzo unitario</label><input class="cai-prz" inputmode="decimal" value="'+esc(haPrezzo?caiTesto(v.prezzo_unitario):"")+'" placeholder="lo metti tu" autocomplete="off"></div>'
        +'</div>'
        +(haPrezzo
            ? '<div class="cp-orig">Prezzo preso dal tuo prezzario'+(v.prezzo_da?(': «'+esc(v.prezzo_da)+'»'):'')+'</div>'
            : '<div class="cp-orig cai-manca">Senza prezzo: nel tuo prezzario non l\'ho trovato. Scrivilo qui sopra, oppure dopo.</div>')
        +'</div>';
    };
    openSheetGrande("Controlla le lavorazioni",
       '<div class="sh-b sh-centro"><div class="sh-tit">'+V.length+(V.length===1?" lavorazione preparata":" lavorazioni preparate")+' per «'+esc(S.titolo||"il computo")+'»'+(S.id?'':' (computo nuovo)')+'</div>'
      +  '<div class="sh-nota">Le ha preparate l\'AI: guarda quantità e prezzi prima di farle entrare. Chi non ti convince, togli la spunta e non entra.'
      +    (senza?('<br>⚠ <b>'+senza+'</b> '+(senza===1?'riga è senza prezzo':'righe sono senza prezzo')+'.'):'')+'</div>'
      +  '<div id="cai-lista">'+V.map(riga).join("")+'</div>'
      +  '<div class="cai-totale">Totale delle righe segnate <b id="cai-tot">—</b></div>'
      +'</div>',
       '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="cai-metti">Metti dentro</button>');
    caiSomma();
  }
  function caiSomma(){
    const out=$("#cai-tot"); if(!out)return;
    let tot=0;
    $$("#cai-lista .cai-riga").forEach(function(r){
      const ck=r.querySelector(".cp-ck"); if(!ck||!ck.checked)return;
      const q=caiNum((r.querySelector(".cai-qta")||{}).value), p=caiNum((r.querySelector(".cai-prz")||{}).value);
      if(q!=null&&p!=null)tot+=Math.round(q*p*100)/100;
    });
    out.textContent=eur(tot);
  }
  async function caiMettiVoci(btn){
    const S=caiStato; if(!S||S.modo!=="aggiungi")return;
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const voci=[];
    $$("#cai-lista .cai-riga").forEach(function(r){
      const ck=r.querySelector(".cp-ck"); if(!ck||!ck.checked)return;
      const d=S.voci[+r.dataset.i]||{};
      const q=caiNum((r.querySelector(".cai-qta")||{}).value), p=caiNum((r.querySelector(".cai-prz")||{}).value);
      voci.push({
        codice:null,
        descrizione:String(d.descrizione||"").trim()||"(senza descrizione)",
        unita:String((r.querySelector(".cai-um")||{}).value||"").trim()||null,
        quantita_manuale:true,
        quantita:(q!=null)?q:0,
        prezzo_unitario:(p!=null)?p:0
      });
    });
    if(!voci.length){toast("Non hai segnato nessuna riga: non entra niente.");return;}
    if(btn){btn.disabled=true;btn.textContent="Un attimo…";}
    try{
      let c=null;
      if(S.id){
        c=await caiTrova(S.id);
        if(!c){toast("Non trovo più questo computo: ricarica la pagina e riprova");return;}
      }else{
        /* il computo nuovo nasce QUI, quando l'utente ha confermato: prima no */
        const ins=await sb.from("gest_computi").insert({
          user_id:sbUid, mestiere_id:curMestiere(), titolo:S.titolo||"Computo",
          data:todayStr(), tipo:"privato", stato:"bozza"
        }).select().single();
        if(ins.error||!ins.data){toast("Non sono riuscito a creare il computo: "+((ins.error&&ins.error.message)||"riprova"));return;}
        await renderComputi();
        c=(compCache||[]).find(function(x){return String(x.id)===String(ins.data.id);})||ins.data;
        S.id=c.id;
      }
      caiStato=null;
      await computoForm(c);
      /* le lavorazioni che ci sono già vanno lette PRIMA di scrivere: da lì
         _compScriviVoci prende l'ordine da cui ripartire */
      await renderCompVoci(c.id);
      const messe=await _compScriviVoci(c.id,voci);
      if(messe==null)return;
      const senza=voci.filter(function(v){return !(+v.prezzo_unitario);}).length;
      toast(messe+(messe===1?" lavorazione aggiunta ✔":" lavorazioni aggiunte ✔")+(senza?("  ·  "+senza+" senza prezzo"):""));
      renderComputi();
    }catch(e){
      toast("Non sono riuscito ad aggiungere le lavorazioni: "+((e&&e.message)||"riprova"));
    }finally{
      if(btn&&btn.isConnected){btn.disabled=false;btn.textContent="Metti dentro";}
    }
  }

  /* ---------------- 2. PREZZI SULLE RIGHE A ZERO ---------------- */
  async function caiApriPrezzi(campi,id){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const c=await caiTrova(id);
    if(!c){toast("Non trovo questo computo in questo reparto");return;}
    const rv=await sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine");
    if(rv.error){toast("Non riesco a leggere le lavorazioni: "+rv.error.message);return;}
    const perId={};(rv.data||[]).forEach(function(v){perId[String(v.id)]=v;});
    const righe=[];let giaPiene=0;
    (campi.prezzi||[]).forEach(function(p){
      const v=perId[String(p.voce_id)];
      if(!v)return;                                   /* non è una riga di questo computo */
      if(+v.prezzo_unitario>0){giaPiene++;return;}    /* un prezzo già messo non si tocca */
      if(righe.some(function(x){return String(x.v.id)===String(v.id);}))return;
      righe.push({v:v,prezzo:+p.prezzo_unitario,da:p.prezzo_da||"",sicuro:p.sicuro!==false});
    });
    if(!righe.length){
      toast(giaPiene?"Quelle lavorazioni hanno già il loro prezzo: non ho toccato niente.":"Non ho trovato righe a zero a cui proporre un prezzo.");
      return;
    }
    caiStato={modo:"prezzi",id:id,titolo:c.titolo||"",righe:righe};
    const incerte=righe.filter(function(r){return !r.sicuro;}).length;
    const riga=function(r,i){
      const q=(+r.v.quantita||0);
      return '<div class="cp-riga cai-riga" data-i="'+i+'">'
        +'<label class="cp-si"><input type="checkbox" class="cp-ck"'+(r.sicuro?' checked':'')+'> <span>lo prendo</span></label>'
        +'<div class="cai-desc">'+esc(r.v.descrizione||"")+'</div>'
        +'<div class="cp-campi cai-campi cai-campi--due">'
        +  '<div class="field"><label>Quantità</label><div class="cai-fisso">'+esc(caiTesto(q))+(r.v.unita?(' '+esc(r.v.unita)):'')+'</div></div>'
        +  '<div class="field"><label>Prezzo unitario</label><input class="cai-prz" inputmode="decimal" value="'+esc(caiTesto(r.prezzo))+'" autocomplete="off"></div>'
        +'</div>'
        +'<div class="cp-orig">Preso dal tuo prezzario'+(r.da?(': «'+esc(r.da)+'»'):'')+'</div>'
        +(r.sicuro?'':'<div class="cp-orig cai-manca">Qui il prezzo non è sicuro: può non essere la stessa lavorazione. Guardala tu, e se va bene metti la spunta.</div>')
        +'</div>';
    };
    openSheetGrande("Controlla i prezzi",
       '<div class="sh-b sh-centro"><div class="sh-tit">'+righe.length+(righe.length===1?" prezzo proposto":" prezzi proposti")+' per «'+esc(c.titolo||"il computo")+'»</div>'
      +  '<div class="sh-nota">Li ha scelti l\'AI dentro il tuo prezzario, solo per le righe che erano a zero. Il prezzo lo puoi correggere. Entra solo chi ha la spunta.'
      +    (incerte?('<br>⚠ <b>'+incerte+'</b> '+(incerte===1?'riga è senza spunta':'righe sono senza spunta')+': lì il prezzo non è sicuro.'):'')+'</div>'
      +  '<div id="cai-lista">'+righe.map(riga).join("")+'</div>'
      +'</div>',
       '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="cai-prezzi-metti">Metti i prezzi</button>');
  }
  async function caiMettiPrezzi(btn){
    const S=caiStato; if(!S||S.modo!=="prezzi")return;
    const da=[];
    $$("#cai-lista .cai-riga").forEach(function(r){
      const ck=r.querySelector(".cp-ck"); if(!ck||!ck.checked)return;
      const x=S.righe[+r.dataset.i]; if(!x)return;
      const p=caiNum((r.querySelector(".cai-prz")||{}).value);
      if(p!=null&&p>0)da.push({id:x.v.id,prezzo:p});
    });
    if(!da.length){toast("Non hai segnato nessun prezzo: non cambia niente.");return;}
    if(btn){btn.disabled=true;btn.textContent="Un attimo…";}
    let messe=0,saltate=0;
    try{
      for(let i=0;i<da.length;i+=10){
        const pezzo=da.slice(i,i+10);
        const res=await Promise.all(pezzo.map(function(x){
          /* ⛔ solo se la riga è ANCORA a zero: lo decide il database */
          return sb.from("gest_computo_voci").update({prezzo_unitario:x.prezzo})
            .eq("id",x.id).eq("user_id",sbUid).eq("computo_id",S.id)
            .or("prezzo_unitario.is.null,prezzo_unitario.eq.0").select("id");
        }));
        res.forEach(function(r){ if(r.error||!r.data||!r.data.length)saltate++; else messe++; });
      }
      const idC=S.id; caiStato=null;
      const c=await caiTrova(idC);
      if(c)await computoForm(c);
      toast(messe+(messe===1?" prezzo messo ✔":" prezzi messi ✔")+(saltate?("  ·  "+saltate+" non scritti (avevano già un prezzo, o la riga non c'è più)"):""));
      renderComputi();
    }catch(e){
      toast("Non sono riuscito a mettere i prezzi: "+((e&&e.message)||"riprova"));
      if(btn&&btn.isConnected){btn.disabled=false;btn.textContent="Metti i prezzi";}
    }
  }

  /* ---------------- la porta della chat ---------------- */
  window.gestComputoDaAI=function(campi,id){
    if(!campi)return false;
    caiVaiAlComputo();
    if(Array.isArray(campi.prezzi)&&campi.prezzi.length){
      if(!id)return false;
      caiApriPrezzi(campi,id);
      return true;
    }
    if(!Array.isArray(campi.voci)||!campi.voci.length)return false;
    caiStato={modo:"aggiungi",id:id||null,titolo:campi.titolo||"",voci:campi.voci};
    caiDisegnaVoci();
    return true;
  };

  /* ---------------- i due pulsanti dentro il computo ----------------
     Portano alla Chat con AI con la frase già cominciata: lì si scrive o si
     detta, e se serve l'AI chiede. Niente seconda casella da imparare. */
  function caiAllaChat(testo,manda){
    const b=document.querySelector('nav.tabs button[data-tab="chat"]');
    if(!b){toast("La chat non è disponibile: ricarica la pagina.");return;}
    closeSheet();
    b.click(); window.scrollTo(0,0);
    const fine=Date.now()+5000;
    (function prova(){
      const c=document.getElementById("chat-domanda"), m=document.getElementById("chat-manda");
      if(c&&m){
        const n=document.getElementById("chat-nuova"); if(n)n.click();
        c.value=testo;
        if(manda){ m.click(); return; }
        c.focus();
        try{ c.setSelectionRange(testo.length,testo.length); }catch(e){}
        return;
      }
      if(Date.now()<fine)setTimeout(prova,150);
    })();
  }
  function caiTitoloAperto(){
    const c=(compCache||[]).find(function(x){return String(x.id)===String(compVociCompId);});
    return c?String(c.titolo||"").trim():"";
  }

  document.addEventListener("click",function(e){
    const t=e.target.closest("[data-action]"); if(!t)return;
    const a=t.dataset.action;
    if(a==="cai-metti")return caiMettiVoci(t);
    if(a==="cai-prezzi-metti")return caiMettiPrezzi(t);
    if(a==="comp-ai"){
      const tit=caiTitoloAperto();
      if(!tit){toast("Dai prima un titolo al computo e salvalo");return;}
      return caiAllaChat("Nel computo «"+tit+"» aggiungi: ",false);
    }
    if(a==="comp-ai-prezzi"){
      const tit=caiTitoloAperto();
      if(!tit){toast("Dai prima un titolo al computo e salvalo");return;}
      return caiAllaChat("Nel computo «"+tit+"» metti i prezzi alle lavorazioni che sono a zero, presi dal mio prezzario.",true);
    }
  });
  document.addEventListener("input",function(e){
    if(e.target&&e.target.closest&&e.target.closest("#cai-lista"))caiSomma();
  });
  document.addEventListener("change",function(e){
    if(e.target&&e.target.closest&&e.target.closest("#cai-lista"))caiSomma();
  });
