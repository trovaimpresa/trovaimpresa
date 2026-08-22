
  /* ============================================================
     LA CONTABILITA' DEI LAVORI — GLI STATI DI AVANZAMENTO (SAL)
     ============================================================
     A cosa serve: un lavoro lungo non si fa pagare tutto alla fine. Ogni
     tanto conti quello che hai fatto e chiedi un acconto. Quel conto e' il
     SAL, e si appoggia al COMPUTO: le righe sono le sue lavorazioni, coi
     prezzi gia' scritti. Non si riscrive niente.

     ⚠️ LA REGOLA DA NON DIMENTICARE: le quantita' sono PROGRESSIVE.
     In ogni SAL si scrive "quanto ho fatto DALL'INIZIO", non "da ultima
     volta". Se un mese sbagli a contare, il mese dopo si raddrizza da solo;
     con le quantita' "da ultima volta" l'errore resta dentro per sempre.
     Percio' il modulo mostra sempre, accanto alla casella, quanto avevi
     contato l'ultima volta: e' il numero da cui riparti.

       questo SAL = maturato di oggi − maturato del SAL precedente

     ⚠️ IL RIBASSO NON SI RICALCOLA QUI. Passa da compRiepilogoDa(), che e'
     l'unico posto del gestionale dove quella formula esiste (oneri della
     sicurezza fuori dal ribasso sui lavori pubblici, sconto sul resto).
     Due copie della stessa formula sono il difetto che ha fatto perdere
     una mattinata sulle fatture.

     Le tabelle e le viste stanno in sql/gest-sal.sql.
     ============================================================ */
  let salCache=[], salTot={}, salVociCache=[], salRigheCache={}, salPrec={},
      salComputoId=null, salApertoId=null, salApertoDati=null, salDaElenco=false;

  function _salManca(err){
    const m=(err&&(err.message||err.details||""))||"";
    return /gest_sal/i.test(m) || /schema cache|does not exist|relation/i.test(m);
  }

  /* I conti di un SAL, partendo dalla riga della vista gest_sal_totali.
     Il ribasso lo applica compRiepilogoDa, qui non si tocca. */
  function salConti(t,comp){
    const c2=n=>Math.round((+n||0)*100)/100;
    if(!t)t={};
    const oggi = compRiepilogoDa(t.maturato, t.oneri_sicurezza, t.importo_manodopera, comp);
    const prima= compRiepilogoDa(t.maturato_precedente, t.oneri_sicurezza_precedenti, t.manodopera_precedente, comp);
    const lordo = c2(oggi.netto - prima.netto);
    let perc = +t.ritenuta_perc||0;
    if(!isFinite(perc)||perc<0)perc=0;
    if(perc>100)perc=100;
    const ritenuta = c2(lordo * perc / 100);
    return { maturato:oggi.netto, precedente:prima.netto, lordo:lordo,
             perc:perc, ritenuta:ritenuta, netto:c2(lordo-ritenuta) };
  }

  /* ---- l'elenco dei SAL dentro la scheda del computo ---- */
  async function renderSalList(computoId){
    const box=$("#co-sal"); if(!box)return;
    salComputoId=computoId;
    /* si sta entrando da DENTRO il computo: il tasto «torna» del SAL deve
       riportare al computo, non all'elenco generale (vedi salTorna) */
    salDaElenco=false;
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}

    const [rs,rt]=await Promise.all([
      sb.from("gest_sal").select("*").eq("user_id",sbUid).eq("computo_id",computoId).order("numero"),
      sb.from("gest_sal_totali").select("*").eq("user_id",sbUid).eq("computo_id",computoId)
    ]);

    if(rs.error){
      box.innerHTML='<div class="lm-vuoto">'+(_salManca(rs.error)
        ? 'La contabilità dei lavori non è ancora accesa. Esegui <b>sql/gest-sal.sql</b> su Supabase e riapri il computo.'
        : 'Non riesco a leggere gli stati di avanzamento: '+esc(rs.error.message))+'</div>';
      return;
    }

    salCache=rs.data||[];
    salTot={}; (rt.data||[]).forEach(t=>{salTot[String(t.sal_id)]=t;});
    const comp=compCache.find(x=>String(x.id)===String(computoId))||{};

    let h="";
    if(!salCache.length){
      h+='<div class="lm-vuoto">Nessuno stato di avanzamento. Quando hai fatto un pezzo di lavoro e vuoi chiedere un acconto, creane uno.</div>';
    } else {
      salCache.forEach(s=>{
        const k=salConti(salTot[String(s.id)],comp);
        h+='<div class="spesa-row" data-action="sal-apri" data-id="'+esc(String(s.id))+'" style="cursor:pointer;align-items:flex-start">'
          +'<span><b>SAL n. '+esc(String(s.numero))+'</b>'+(s.stato==="bozza"?' · bozza':'')
          +  '<small class="sp-forn">'+fdate(s.data)
          +    ' · fatto finora '+eur2(k.maturato)
          +    (k.precedente?(' · già chiesto '+eur2(k.precedente)):'')
          +    (k.ritenuta?(' · trattenuto '+eur2(k.ritenuta)):'')
          +    (s.fattura_id?' · <b>già fatturato</b>':'')
          +  '</small></span>'
          +'<b>'+eur2(k.netto)+'</b>'
          /* ⚠️ 19 agosto 2026 — LA PRIMA VOLTA L'HO FATTO SBAGLIATO.
             Era un quadratino da 34 px con dentro la sola faccina del foglio:
             Alessio l'ha guardato e ha detto «si vede troppo piccolo, quasi
             non si vede». Aveva ragione, e la regola c'era gia': .quick-add
             (bordo blu, sfondo, 46 px, testo da 17) esiste da stasera apposta
             perche' i pulsanti si vedano. Un'icona da sola non e' un pulsante:
             ci vuole scritto PDF. margin-top:0 solo perche' qui sta dentro una
             riga, non sotto un elenco. */
          +'<button type="button" class="quick-add" data-action="sal-pdf" data-id="'+esc(String(s.id))+'" title="Scarica il foglio da consegnare al committente" style="margin-top:0;flex:0 0 auto">📄 PDF</button>'
          +'<button type="button" class="rdel" data-action="sal-del" data-id="'+esc(String(s.id))+'" title="Butta questo SAL nel cestino" style="border:1px solid var(--bordo-forte,#cbd2da);background:var(--card,#fff);color:var(--err,#c0392b);border-radius:8px;min-width:34px;height:34px;font-size:17px;line-height:1;cursor:pointer;flex:0 0 auto">×</button></div>';
      });
    }
    h+='<button type="button" class="btn-ghost quick-add" data-action="sal-nuovo">+ Nuovo stato di avanzamento</button>';
    box.innerHTML=h;
  }

  /* ============================================================
     L'ELENCO UNICO DEGLI STATI DI AVANZAMENTO — 20 agosto 2026
     ============================================================
     Chiesto da Alessio: «tutti i SAL di tutti i computi in un elenco solo,
     quali ho chiesto e quali no, il PDF, la fattura».

     ⛔ NON e' un SAL che vive per conto suo. Qui non si crea niente e non si
     calcola niente di nuovo: si LEGGE. La riga apre lo stesso SAL di sempre,
     dentro il suo computo, con la stessa funzione salForm(). Un SAL senza
     computo dietro perderebbe il «su 20,46 previsti», il controllo «hai
     contato piu' del computo» e il ribasso: diventerebbe una fattura con le
     date (strada B, scartata il 19 agosto).

     ⚠️ I conti passano da salConti() + compRiepilogoDa(), le stesse due
     funzioni del riquadro a schermo e del PDF. Nessuna formula copiata: se
     questo elenco dicesse un numero e la scheda un altro, non ci si potrebbe
     fidare di nessuno dei due.

     ⚠️ IL RIBASSO STA SUL COMPUTO, NON SUL SAL. Per questo ogni SAL va
     appaiato al suo computo PRIMA di fare il conto: con un computo mancante
     il netto uscirebbe senza ribasso, cioe' piu' alto del vero. Se il computo
     non c'e' (o e' nel cestino) il SAL non si mostra proprio.
     ============================================================ */
  const SAL_VISTE=[{k:"tutti",lab:"Tutti"},{k:"da",lab:"Da fatturare"},{k:"fatt",lab:"Fatturati"}];
  let salTuttiCache=[], salTuttiComp={}, salTuttiTot={}, salTuttiCli={}, salFiltro="tutti";

  function salFiltra(L,k){
    if(k==="da")  return L.filter(s=>!s.fattura_id);
    if(k==="fatt")return L.filter(s=>!!s.fattura_id);
    return L;
  }
  /* due cifre sono «la stessa» se lo sono al centesimo: sono tutte e due
     gia' arrotondate da c2(), ma confrontare due numeri con la virgola con
     === e' il modo piu' facile per farsi fregare da 0,1+0,2 */
  function _salUguali(a,b){return Math.round((+a||0)*100)===Math.round((+b||0)*100);}

  /* la scheda dell'elenco: stessa forma di tutte le altre sezioni */
  function salCard(s){
    const comp=salTuttiComp[String(s.computo_id)]||{};
    const k=salConti(salTuttiTot[String(s.id)],comp);
    const q=quando(s.data,{neutro:true});
    const fatturato=!!s.fattura_id;
    const bozza=(s.stato||"bozza")!=="emesso";
    const periodo=(s.periodo_dal||s.periodo_al)
      ? ("🗓 dal "+(s.periodo_dal?fdate(s.periodo_dal):"—")+" al "+(s.periodo_al?fdate(s.periodo_al):"—"))
      : "";
    return schedaJob({
      tono: fatturato?"t-ok":"t-attesa",
      titolo: "SAL n. "+esc(String(s.numero||"—"))+" — "+esc(comp.titolo||"(computo senza titolo)"),
      destra: '<span class="stato '+(fatturato?"fatto":(bozza?"da_fare":"in_corso"))+'">'
              +(fatturato?"Fatturato":(bozza?"Bozza":"Emesso"))+'</span>',
      meta:[
        comp.cliente_id?("👤 "+esc(salTuttiCli[comp.cliente_id]||"—")):"",
        "📅 "+esc(q.testo),
        periodo,
        /* ⚠️ 20 agosto 2026 — LO STESSO NUMERO DUE VOLTE CONFONDE.
           Su un SAL senza ribasso, senza un SAL prima e senza ritenuta,
           «fatto finora» e il totale in grassetto sono la STESSA cifra:
           uno dei due non aggiunge niente. In quel caso sparisce.
           (Visto sullo schermo di Alessio: 231,25 € scritto due volte.) */
        _salUguali(k.maturato,k.netto)?"":("🧱 fatto finora "+eur2(k.maturato)),
        k.precedente?("↩ già chiesto "+eur2(k.precedente)):"",
        k.ritenuta?("🔒 trattenuto "+eur2(k.ritenuta)+" ("+_pct(k.perc)+"%)"):"",
        '<b>'+eur2(k.netto)+'</b>',
        comp.tipo==="pubblico"?"🏛 lavori pubblici":""
      ],
      nota: s.note?("📝 "+esc(s.note)):"",
      azioni: salVoci(s)
    });
  }
  /* le azioni: le stesse nella scheda e nel menu «...».
     ⚠️ «sal-el-apri» NON comincia per edit-/apri-: e' voluto. Le azioni che
     combaciano con AZ_APERTURA fanno comparire UN pulsante solo («Apri») e
     mandano tutto il resto sotto i «...». Qui il PDF e' la ragione per cui
     questo elenco esiste, e deve restare un pulsante che si vede, con la
     parola scritta (la lezione dei pulsanti piccoli del 19 agosto). */
  function salVoci(s){
    return [{lab:"✏ Apri",action:"sal-el-apri",data:{id:s.id}},
            {lab:"📄 PDF",action:"sal-pdf",data:{id:s.id}},
            {lab:(s.fattura_id?"🧾 Rifai la fattura dell'acconto":"🧾 Crea la fattura dell'acconto"),
             action:"sal-fattura",data:{id:s.id}},
            {lab:"🗑 Elimina",action:"sal-del",data:{id:s.id},del:true}];
  }

  async function renderSalTutti(){
    const box=$("#sal-list"); if(!box)return;
    const viste=$("#sal-viste");
    if(!sb||!sbUid){
      if(viste)viste.innerHTML="";
      box.style.display="block";
      box.innerHTML=tabVuoto("Nessuno stato di avanzamento","Accedi per vedere la contabilità dei lavori.",_SVGV+'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>');
      return;
    }
    const mid=curMestiere();

    /* Tutto in una volta sola. I computi si leggono con sb (che salta quelli
       nel cestino): un SAL il cui computo e' nel cestino non compare qui. */
    const [rc,rs,rt,rcl]=await Promise.all([
      sb.from("gest_computi").select("*").eq("user_id",sbUid).eq("mestiere_id",mid),
      sb.from("gest_sal").select("*").eq("user_id",sbUid).order("data",{ascending:false}),
      sb.from("gest_sal_totali").select("*").eq("user_id",sbUid),
      _sbTutto("gest_clienti").select("id,nome,eliminato_il").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);

    /* ⚠️ un errore non si ingoia: senza i computi il ribasso sparisce e i
       numeri sarebbero piu' alti del vero; senza i totali non c'e' nessun
       numero. In tutti e due i casi si dice cosa e' successo. */
    if(rs.error||rc.error||rt.error){
      const err=rs.error||rc.error||rt.error;
      if(viste)viste.innerHTML="";
      box.style.display="block";
      box.innerHTML=tabVuoto(
        _salManca(err)?"La contabilità dei lavori non è ancora accesa":"Non riesco a leggere gli stati di avanzamento",
        _salManca(err)
          ? "Esegui <b>sql/gest-sal.sql</b> su Supabase (SQL Editor → Run) e ricarica la pagina."
          : "Il database ha risposto: "+esc(err.message||""),
        _SVGV+'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>');
      return;
    }

    salTuttiComp={};(rc.data||[]).forEach(c=>{salTuttiComp[String(c.id)]=c;});
    salTuttiTot={};(rt.data||[]).forEach(t=>{salTuttiTot[String(t.sal_id)]=t;});
    salTuttiCli={};(rcl&&rcl.data||[]).forEach(c=>{salTuttiCli[c.id]=(c.nome||"")+(c.eliminato_il?" (nel cestino)":"");});
    /* solo i SAL dei computi DI QUESTO REPARTO: il gestionale lavora un
       reparto alla volta, e un SAL senza il suo computo non si sa contare */
    salTuttiCache=(rs.data||[]).filter(x=>!!salTuttiComp[String(x.computo_id)]);

    const cnt=$("#cnt-sal");if(cnt)cnt.textContent=salTuttiCache.length?String(salTuttiCache.length):"";

    const conta={};SAL_VISTE.forEach(v=>conta[v.k]=salFiltra(salTuttiCache,v.k).length);
    const L=salFiltra(salTuttiCache,salFiltro);
    const somma=L.reduce((a,s)=>a+salConti(salTuttiTot[String(s.id)],salTuttiComp[String(s.computo_id)]||{}).netto,0);

    renderTabella({
      id:"sal", box:"#sal-list",
      viste:"#sal-viste", visteDef:SAL_VISTE, vista:salFiltro, conta:conta, azioneVista:"sal-filtro",
      vuoto:tabVuoto(
        salTuttiCache.length?"Nessuno stato di avanzamento con questo filtro":"Ancora nessuno stato di avanzamento",
        salTuttiCache.length?"Prova a cambiare vista qui sopra."
          :"Uno stato di avanzamento è il conto di quello che hai fatto finora, per farti pagare un acconto mentre il lavoro va avanti. Nasce dentro un computo: aprilo e creane uno.",
        _SVGV+'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
        salTuttiCache.length?null:{t:"Vai ai computi",a:"sal-vai-computi"}),
      colonne:[{lab:"N.",w:"10%"},{lab:"Computo",w:"34%"},{lab:"Cliente",w:"20%",cls:"c-cli"},
               {lab:"Quando",w:"16%"},{lab:"Importo",w:"20%",cls:"c-imp"}],
      righe:L.map(s=>{
        const comp=salTuttiComp[String(s.computo_id)]||{};
        const q=quando(s.data,{neutro:true});
        return {
          id:s.id,
          click:{action:"sal-el-apri",data:{id:s.id}},
          celle:[
            esc(String(s.numero||"—")),
            '<span class="c-nome">'+esc(comp.titolo||"(computo senza titolo)")+'</span>',
            esc(salTuttiCli[comp.cliente_id]||"—"),
            {h:q.testo,cls:q.classe},
            {h:eur2(salConti(salTuttiTot[String(s.id)],comp).netto),cls:"c-imp"}
          ],
          menu:salVoci(s)
        };
      }),
      cards:()=>L.map(s=>salCard(s)).join(""),
      totale: L.length?{testo:L.length+" "+(L.length===1?"stato di avanzamento":"stati di avanzamento"),valore:eur2(somma)}:null
    });
  }

  /* Aprire un SAL dall'elenco generale = aprirlo dentro il suo computo.
     ⚠️ Prima di chiamare salForm bisogna rimettere in piedi le tre cose che
     la scheda si aspetta di trovare gia' pronte, perche' di solito ci si
     arriva da dentro il computo:
       salComputoId  quale computo si sta guardando;
       compCache     deve contenere quel computo — da li' salAggiorna prende
                     RIBASSO e tipo di lavoro. Senza, il conto a schermo
                     uscirebbe senza ribasso, cioe' piu' alto del vero;
       salCache      i SAL di quel computo, che servono a trovare il SAL
                     PRECEDENTE («l'ultima volta») e a proporre il numero.
     Chi salta uno di questi tre pezzi non vede un errore: vede un numero
     sbagliato, che e' peggio. */
  async function salApriDaElenco(id){
    const s=salTuttiCache.find(x=>String(x.id)===String(id));
    if(!s){toast("Stato di avanzamento non trovato: riapri la sezione");return;}
    const comp=salTuttiComp[String(s.computo_id)];
    if(!comp){toast("Il computo di questo stato di avanzamento non si trova (potrebbe essere nel cestino)");return;}

    const i=compCache.findIndex(x=>String(x.id)===String(comp.id));
    if(i<0)compCache.push(comp); else compCache[i]=comp;

    salComputoId=comp.id;
    salCache=salTuttiCache.filter(x=>String(x.computo_id)===String(comp.id));
    salTot={};salCache.forEach(x=>{if(salTuttiTot[String(x.id)])salTot[String(x.id)]=salTuttiTot[String(x.id)];});
    salDaElenco=true;
    await salForm(id);
  }

  /* «← Torna»: dove si torna dipende da dove si era.
     Sta in una funzione sola perche' i punti che tornano indietro sono DUE
     (il pulsante in fondo alla scheda e la fine di salSalva): una regola che
     sta in due posti non si sistema a meta'. */
  async function salTorna(){
    if(salDaElenco){ closeSheet(); await renderSalTutti(); window.scrollTo(0,0); return; }
    await compTornaAlComputo();
  }

  /* ---- la scheda di un SAL ---- */
  async function salForm(salId){
    if(!salComputoId){toast("Apri prima il computo");return;}
    const computoId=salComputoId;
    const comp=compCache.find(x=>String(x.id)===String(computoId))||{};

    let s={};
    if(salId){
      const {data,error}=await sb.from("gest_sal").select("*").eq("id",salId).eq("user_id",sbUid).maybeSingle();
      if(error){toast("Errore: "+error.message);return;}
      if(!data){toast("Stato di avanzamento non trovato");return;}
      s=data;
    } else {
      /* il numero lo propone il gestionale: max+1 fra quelli che ci sono */
      /* ⚠️ 21 agosto 2026 — todayStr(), non toISOString(). toISOString da'
         l'ora di Greenwich: d'estate, fra mezzanotte e le due, uno stato di
         avanzamento aperto OGGI nasceva con la data di IERI — ed e' un
         documento contabile che si firma. E' la correzione dell'11 agosto:
         questi due punti erano rimasti indietro perche' stanno in un altro file. */
      s={ numero: salCache.reduce((m,x)=>Math.max(m,+x.numero||0),0)+1,
          data: todayStr(),
          ritenuta_perc: (comp.tipo==="pubblico"?0.5:0),
          stato:"bozza" };
    }
    salApertoId=s.id||null;
    /* la fotografia di com'era quando l'hai aperto: serve al PDF per capire
       se hai scritto qualcosa senza salvare (vedi salModifiche()) */
    salApertoDati=s;
    const isNew=!s.id;

    /* le lavorazioni del computo, con la quantita' vera calcolata dal database */
    const rv=await sb.from("gest_computo_voci_calc").select("*")
      .eq("user_id",sbUid).eq("computo_id",computoId).order("ordine");
    if(rv.error){toast("Non riesco a leggere le lavorazioni: "+rv.error.message);return;}
    salVociCache=rv.data||[];

    /* quello che avevi gia' contato: in questo SAL e nel SAL precedente */
    salRigheCache={}; salPrec={};
    if(s.id){
      const rr=await sb.from("gest_sal_righe").select("voce_id,quantita_eseguita").eq("user_id",sbUid).eq("sal_id",s.id);
      (rr.data||[]).forEach(r=>{salRigheCache[String(r.voce_id)]=+r.quantita_eseguita||0;});
    }
    const precedente=salCache.filter(x=>(+x.numero||0)<(+s.numero||0)).sort((a,b)=>(+b.numero||0)-(+a.numero||0))[0];
    if(precedente){
      const rp=await sb.from("gest_sal_righe").select("voce_id,quantita_eseguita").eq("user_id",sbUid).eq("sal_id",precedente.id);
      (rp.data||[]).forEach(r=>{salPrec[String(r.voce_id)]=+r.quantita_eseguita||0;});
    }

    const rigaVoce=v=>{
      const fatto=salRigheCache[String(v.id)];
      const prima=salPrec[String(v.id)];
      return '<div class="sal-riga" data-voce="'+esc(String(v.id))+'" data-prezzo="'+esc(String(v.prezzo_unitario||0))+'"'
        +' data-sic="'+esc(String(v.oneri_sicurezza||0))+'" data-mano="'+esc(String(v.incidenza_manodopera||0))+'"'
        +' data-qta="'+esc(String(v.quantita||0))+'"'
        +' style="border-bottom:1px solid var(--bordo,#e6e9ee);padding:10px 2px">'
        +'<div class="cm-testo" style="font-size:15px">'+(v.codice?'<b>'+esc(v.codice)+'</b> · ':'')+esc(v.descrizione||"(senza descrizione)")+'</div>'
        +'<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px">'
        /* ⚠️ la casella NON sta dentro un .field, quindi il CSS del gestionale
           non la veste: senza queste misure scritte qui esce alta due
           millimetri e con un filo di bordo, illeggibile. Visto sullo
           schermo di Alessio il 19 agosto. */
        +  '<input type="text" inputmode="decimal" class="sal-q"'+_noAuto()
        +    ' value="'+(fatto!=null?_misTesto(fatto):"")+'" placeholder="0"'
        +    ' aria-label="Quantità fatta finora"'
        +    ' style="width:140px;height:46px;padding:0 12px;font-family:inherit;'
        +      'font-size:17px;font-weight:700;color:var(--testo,#22303f);'
        +      'background:var(--card,#fff);border:1.5px solid var(--bordo-forte,#cbd2da);'
        +      'border-radius:10px">'
        +  '<small style="color:var(--testo2,#5a6672)">'
        +    'su '+_misLetta(v.quantita)+(v.unita?" "+esc(v.unita):"")
        +    ' previsti × '+eur2(v.prezzo_unitario)
        +    (prima!=null?(' · l\'ultima volta: '+_misLetta(prima)):'')
        +  '</small>'
        +  '<b class="sal-imp" style="margin-left:auto">'+eur2((+fatto||0)*(+v.prezzo_unitario||0))+'</b>'
        +'</div>'
        +'<div class="sal-avviso" style="display:none;color:var(--err,#c0392b);font-size:14px;margin-top:4px">'
        +  'Hai contato più di quello che c\'era nel computo.</div>'
        +'</div>';
    };

    openSheetGrande(isNew?"Nuovo stato di avanzamento":("SAL n. "+(s.numero||"")),
       '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Quello che hai fatto</div>'
      +  '<div class="sh-nota">In ogni casella scrivi <b>quanto hai fatto dall\'inizio del lavoro</b>, non da ultima volta. Il gestionale toglie da solo quello che avevi già chiesto.</div>'
      +  '<div id="sal-voci">'+(salVociCache.length
          ? salVociCache.map(rigaVoce).join("")
          : '<div class="lm-vuoto">Questo computo non ha ancora lavorazioni.</div>')+'</div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Il conto</div>'
      +  '<div id="sal-conto" class="qe-tot"></div>'
      /* il pulsante sta QUI e non in fondo alla finestra: nel piede ci sono
         gia' tre pulsanti e su un telefono da 390 px il quarto usciva fuori.
         Classe .quick-add, quella coi bordi che si vedono. */
      +  (isNew?'':'<button type="button" class="quick-add" data-action="sal-fattura" data-id="'+esc(String(s.id))+'">→ Crea la fattura di questo acconto</button>')
      +  (s.fattura_id?'<div class="sh-nota">Da questo stato di avanzamento hai <b>già creato una fattura</b>. Se ne fai un\'altra, stai chiedendo due volte gli stessi soldi.</div>':'')
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">La scheda</div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Numero</label><input type="number" id="sal-num" value="'+esc(String(s.numero||1))+'" style="max-width:120px"></div>'
      +    '<div class="field"><label>Data</label><input type="date" id="sal-data" value="'+esc(s.data||"")+'"></div>'
      +  '</div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Periodo dal</label><input type="date" id="sal-dal" value="'+esc(s.periodo_dal||"")+'"></div>'
      +    '<div class="field"><label>Periodo al</label><input type="date" id="sal-al" value="'+esc(s.periodo_al||"")+'"></div>'
      +  '</div>'
      +  '<div class="field"><label>Ritenuta di garanzia (%)</label>'
      +    '<input type="text" inputmode="decimal" id="sal-rit"'+_noAuto()
      +    ' value="'+(s.ritenuta_perc!=null?String(s.ritenuta_perc).replace(".",","):"")+'" placeholder="0,50" style="max-width:160px"></div>'
      +  '<div class="sh-nota">È la fetta di ogni acconto che il committente tiene da parte e ti ridà a fine lavori, a collaudo fatto. Nelle gare pubbliche è lo <b>0,50%</b>. Sui lavori privati, se non l\'avete pattuita, metti 0.</div>'
      +  '<div class="field"><div class="seg" id="sal-stato">'
      +    '<button data-v="bozza"'+((s.stato||"bozza")==="bozza"?' class="on"':'')+'>Bozza</button>'
      +    '<button data-v="emesso"'+(s.stato==="emesso"?' class="on"':'')+'>Emesso</button>'
      +  '</div></div>'
      +  '<div class="field"><textarea id="sal-note" placeholder="Note">'+esc(s.note||"")+'</textarea></div>'
      +'</div>'
      +'</div></div>',

       '<button class="btn b-cancel" data-action="sal-torna">'+(salDaElenco?"← Torna all'elenco":"← Torna al computo")+'</button>'
      /* il PDF solo su un SAL che esiste gia': su uno appena aperto non c'e'
         ancora niente di salvato da mettere sul foglio */
      +(isNew?"":'<button class="btn" data-action="sal-pdf" data-id="'+esc(String(s.id))+'">📄 PDF</button>')
      +'<button class="btn-primary b-save" data-action="sal-salva" data-id="'+esc(String(s.id||""))+'">'+(isNew?"Crea il SAL":"Salva")+'</button>');

    bindSeg("sal-stato");
    const box=$("#sal-voci");
    if(box)box.addEventListener("input",salAggiorna);
    const rit=$("#sal-rit");
    if(rit)rit.addEventListener("input",salAggiorna);
    salAggiorna();
  }

  /* Il conto a schermo, mentre scrivi. Il ribasso passa da compRiepilogoDa:
     la formula resta una sola. Il database rifà lo stesso conto nella vista
     gest_sal_totali, e il banco di prova controlla che diano lo stesso numero. */
  function salAggiorna(){
    const box=$("#sal-conto"); if(!box)return;
    const comp=compCache.find(x=>String(x.id)===String(salComputoId))||{};
    let lordo=0, sic=0, mano=0, oltre=0;
    $$("#sal-voci .sal-riga").forEach(function(r){
      const inp=r.querySelector(".sal-q");
      const q=_numDa(inp?inp.value:"");
      const p=+r.dataset.prezzo||0;
      const qc=+r.dataset.qta||0;
      const imp=q*p;
      lordo+=imp;
      if(qc>0){
        sic += (+r.dataset.sic||0) * (q/qc);
        mano+= imp * (+r.dataset.mano||0)/100;
      }
      const b=r.querySelector(".sal-imp"); if(b)b.textContent=eur2(imp);
      const av=r.querySelector(".sal-avviso");
      const male=(q>qc);
      if(av)av.style.display=male?"":"none";
      if(male)oltre++;
    });
    /* il precedente lo sa il database: qui si usa quello gia' letto */
    const t=salTot[String(salApertoId||"")]||{};
    const k=salConti({ maturato:lordo, oneri_sicurezza:sic, importo_manodopera:mano,
                       maturato_precedente:t.maturato_precedente,
                       oneri_sicurezza_precedenti:t.oneri_sicurezza_precedenti,
                       manodopera_precedente:t.manodopera_precedente,
                       ritenuta_perc:_numDa(($("#sal-rit")&&$("#sal-rit").value)||"0") }, comp);

    box.innerHTML=
       '<div class="qe-r"><span>Fatto dall\'inizio</span><b>'+eur2(k.maturato)+'</b></div>'
      +'<div class="qe-r"><span>Già chiesto coi SAL prima</span><b>−'+eur2(k.precedente)+'</b></div>'
      +'<div class="qe-r"><span>Questo stato di avanzamento</span><b>'+eur2(k.lordo)+'</b></div>'
      +(k.ritenuta?'<div class="qe-r"><span>Ritenuta di garanzia '+String(k.perc).replace(".",",")+'%</span><b>−'+eur2(k.ritenuta)+'</b></div>':'')
      +'<div class="qe-r qe-r--tot"><span><b>Da chiedere adesso</b></span><b>'+eur2(k.netto)+'</b></div>'
      +(oltre?'<div class="sh-nota" style="color:var(--err,#c0392b)">Ci sono <b>'+oltre+'</b> lavorazioni contate oltre il computo. Non è vietato — i lavori cambiano — ma controlla che sia voluto.</div>':'')
      +(k.lordo<0?'<div class="sh-nota" style="color:var(--err,#c0392b)">Questo SAL viene <b>negativo</b>: hai contato meno del SAL precedente. Ricorda che le quantità sono quelle fatte <b>dall\'inizio</b>.</div>':'');
  }

  /* legge un numero scritto a mano (virgola o punto), senza passare dal DOM */
  function _numDa(v){
    const s=String(v==null?"":v).trim().replace(/\s/g,"").replace(",",".");
    if(!s)return 0;
    const n=parseFloat(s);
    return isFinite(n)?n:0;
  }

  async function salSalva(id){
    if(!sbUid||!salComputoId)return;
    const numero=parseInt(($("#sal-num")&&$("#sal-num").value)||"1",10);
    if(!(numero>=1)){toast("Il numero del SAL parte da 1");return;}
    const dal=($("#sal-dal")&&$("#sal-dal").value)||null;
    const al =($("#sal-al") &&$("#sal-al").value) ||null;
    if(dal&&al&&al<dal){toast("Il periodo finisce prima di cominciare: controlla le due date");return;}

    const testa={
      user_id:sbUid, computo_id:salComputoId,
      mestiere_id:curMestiere()||null,
      numero:numero,
      /* ⚠️ vedi la nota del 21 agosto piu' su: qui era l'altro punto rimasto
         con l'ora di Greenwich. */
      data:($("#sal-data")&&$("#sal-data").value)||todayStr(),
      periodo_dal:dal, periodo_al:al,
      ritenuta_perc:_numDa(($("#sal-rit")&&$("#sal-rit").value)||"0"),
      stato:segVal("sal-stato")||"bozza",
      note:String(($("#sal-note")&&$("#sal-note").value)||"").trim()||null
    };

    let res;
    if(id) res=await sb.from("gest_sal").update(testa).eq("id",id).eq("user_id",sbUid).select("id");
    else   res=await sb.from("gest_sal").insert(testa).select("id");
    if(res.error){
      toast(/gest_sal_numero_unico|duplicate key/i.test(res.error.message||"")
        ? "C'è già un SAL con questo numero su questo computo: cambia numero."
        : (_salManca(res.error)
            ? "La contabilità dei lavori non è accesa: esegui sql/gest-sal.sql su Supabase."
            : "Errore: "+res.error.message));
      return;
    }
    if(!res.data||!res.data.length){toast("Non salvato: nessuna riga scritta. Riprova.");return;}
    const salId=res.data[0].id;

    /* Le righe: si riscrivono tutte. Prima si cancellano quelle di questo SAL,
       poi si mettono solo quelle con una quantita' scritta.
       ⚠️ Le righe a zero NON si scrivono: una voce non ancora cominciata non
       deve comparire nel documento. */
    const righe=[];
    $$("#sal-voci .sal-riga").forEach(function(r){
      const inp=r.querySelector(".sal-q");
      const q=_numDa(inp?inp.value:"");
      if(q>0)righe.push({user_id:sbUid, sal_id:salId, voce_id:r.dataset.voce, quantita_eseguita:q});
    });

    const rd=await sb.from("gest_sal_righe").delete().eq("sal_id",salId).eq("user_id",sbUid).select("id");
    if(rd.error){toast("Errore ripulendo le righe: "+rd.error.message);return;}
    if(righe.length){
      const ri=await sb.from("gest_sal_righe").insert(righe).select("id");
      if(ri.error){toast("Errore salvando le righe: "+ri.error.message);return;}
      if(!ri.data||ri.data.length!==righe.length){
        toast("Attenzione: scritte "+((ri.data||[]).length)+" righe su "+righe.length+". Riapri il SAL e controlla.");
      }
    }

    /* anche l'elenco unico va segnato «da rifare»: se non lo si fa, uno
       salva un SAL, apre «Stati di avanzamento» e trova ancora i numeri di
       prima. */
    rinfresca("computi","sal");
    if(!id){ salCache.push({id:salId,numero:numero}); toast("SAL creato ✔"); await salForm(salId); return; }
    toast("SAL salvato ✔");
    await salTorna();
  }

  async function salElimina(id){
    if(!gconfirm("Buttare questo stato di avanzamento nel cestino?"))return;
    const res=await sb.from("gest_sal").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(res.error){toast("Errore: "+res.error.message);return;}
    if(!res.data||!res.data.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
    toast("Nel cestino ✔");
    /* ⚠️ dall'elenco unico #co-sal non esiste: renderSalList uscirebbe subito
       e la riga appena buttata resterebbe li' a schermo, come se non fosse
       successo niente. */
    if(salDaElenco){ await renderSalTutti(); _tabSporchi.add("computi"); return; }
    _tabSporchi.add("sal");
    await renderSalList(salComputoId);
  }


  /* ============================================================
     IL PDF DELLO STATO DI AVANZAMENTO — 19 agosto 2026
     ============================================================
     Un SAL che resta dentro lo schermo non serve a niente: e' il foglio che si
     consegna al committente (o al direttore dei lavori) per farsi pagare
     l'acconto. Deve dire quattro cose, in quest'ordine, e deve farle rifare
     con la calcolatrice a chi lo riceve:

        quanto hai fatto DALL'INIZIO  -  quanto ti hanno gia' liquidato
        =  quanto vale questo SAL  -  la ritenuta di garanzia
        =  quanto ti devono adesso

     ⚠️ I CONTI NON SI RIFANNO QUI. Il lordo, il ribasso e il netto passano da
     compRiepilogoDa(); la differenza col SAL precedente e la ritenuta passano
     da salConti(). Sono le stesse due funzioni che disegnano il riquadro a
     schermo: se il foglio e lo schermo dicessero due numeri diversi, il
     documento non varrebbe niente. E' la lezione delle fatture, dove la stessa
     formula in tre posti dava tre numeri.

     ⚠️ IL FOGLIO NASCE DA QUELLO CHE E' SALVATO, non da quello che hai appena
     scritto nelle caselle. Se ci sono modifiche non salvate ci si ferma e lo si
     dice: un documento che non e' quello che hai davanti e' peggio di nessun
     documento.

     ⚠️ E ci si ferma anche se una lettura va storta o se la somma delle righe
     stampate non fa il totale del riquadro. E' la lezione del PDF del computo
     del 14 agosto 2026: l'errore non guardato faceva uscire un foglio con
     dentro un buco che non si vede, e il messaggio diceva pure «scaricato ✅».

     ⚠️ «mq» e «mc» al posto di m² e m³: jsPDF gli esponenti li butta via in
     silenzio e 73 metri quadri diventano 73 metri (vedi _umPdf). */

  /* C'e' qualcosa scritto nelle caselle e non ancora salvato?
     Vale solo se la scheda aperta e' proprio quella di questo SAL. */
  function salModifiche(id){
    if(!$("#sal-voci"))return false;                       /* scheda non aperta */
    if(String(salApertoId||"")!==String(id))return false;  /* scheda di un altro SAL */
    const s=salApertoDati||{};
    const val=k=>{const e=$("#"+k);return e?String(e.value==null?"":e.value):null;};
    const q5=n=>Math.round((+n||0)*1e5)/1e5;

    if(val("sal-num") !==null && (parseInt(val("sal-num")||"0",10)||0)!==(+s.numero||0))return true;
    if(val("sal-data")!==null && (val("sal-data")||"")!==(s.data||""))return true;
    if(val("sal-dal") !==null && (val("sal-dal")||"") !==(s.periodo_dal||""))return true;
    if(val("sal-al")  !==null && (val("sal-al")||"")  !==(s.periodo_al||""))return true;
    if(val("sal-note")!==null && String(val("sal-note")||"").trim()!==String(s.note||"").trim())return true;
    if($("#sal-rit")  && q5(_numDa(val("sal-rit")||"0"))!==q5(s.ritenuta_perc))return true;
    if($("#sal-stato")&& (segVal("sal-stato")||"bozza")!==(s.stato||"bozza"))return true;

    /* le quantita': quelle scritte adesso contro quelle lette dal database.
       Le righe a zero non si salvano, quindi qui non si contano nemmeno. */
    const ora={};
    $$("#sal-voci .sal-riga").forEach(function(r){
      const inp=r.querySelector(".sal-q");
      const q=q5(_numDa(inp?inp.value:""));
      if(q>0)ora[String(r.dataset.voce)]=q;
    });
    const salvate={};
    Object.keys(salRigheCache).forEach(function(v){
      const q=q5(salRigheCache[v]); if(q>0)salvate[v]=q;
    });
    const chiavi=Object.keys(ora);
    if(chiavi.length!==Object.keys(salvate).length)return true;
    for(let i=0;i<chiavi.length;i++){ if(salvate[chiavi[i]]!==ora[chiavi[i]])return true; }
    return false;
  }

  /* ============================================================
     DAL SAL ALLA FATTURA — 19 agosto 2026
     ============================================================
     Il SAL dice quanto ti devono; la fattura e' come glielo chiedi. Fino a
     stasera bisognava riscrivere a mano l'importo dentro una fattura nuova,
     e un numero ribattuto a mano e' un numero che prima o poi si sbaglia.

     ⚠️ LA CIFRA LA SCEGLI TU, OGNI VOLTA. Sono due modi veri, e cambiano da
     committente a committente:
       - INTERA: fatturi tutto l'avanzamento, ed e' il committente che
         trattiene la ritenuta di garanzia quando paga;
       - AL NETTO: la ritenuta te la togli tu dalla fattura, e la riavrai a
         fine lavori con una fattura a parte.
     Non e' una cosa da decidere al posto suo, e nemmeno una da chiedere una
     volta sola: si chiede a ogni fattura.

     ⚠️ I CONTI NON SI RIFANNO QUI: l'importo esce da salConti(), la stessa
     funzione del riquadro a schermo e del PDF.

     ⚠️ NON SI SCRIVE NIENTE NEL DATABASE. Si apre il modulo della fattura
     gia' compilato: la controlla lui e la salva lui. Il collegamento SAL ->
     fattura si scrive solo DOPO che la fattura esiste (vedi fattSalInCorso).
     ============================================================ */
  let salFattDati=null;

  async function salAFattura(id){
    if(!sb||!sbUid){toast("Devi essere collegato");return;}
    if(salModifiche(id)){
      toast("Hai delle modifiche non salvate: premi prima Salva, poi crea la fattura. La fattura nasce da quello che è salvato.");
      return;
    }

    const rs=await sb.from("gest_sal").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(rs.error){toast("Non riesco a leggere lo stato di avanzamento: "+rs.error.message);return;}
    const s=rs.data; if(!s){toast("Stato di avanzamento non trovato");return;}
    if(s.fattura_id&&!gconfirm("Da questo stato di avanzamento hai già creato una fattura.\n\nSe ne fai un'altra stai chiedendo due volte gli stessi soldi.\n\nNe faccio un'altra lo stesso?"))return;

    const rcp=await sb.from("gest_computi").select("*").eq("id",s.computo_id).eq("user_id",sbUid).maybeSingle();
    if(rcp.error){toast("Non riesco a leggere il computo: "+rcp.error.message);return;}
    const comp=rcp.data; if(!comp){toast("Il computo di questo stato di avanzamento non si trova");return;}

    const rt=await sb.from("gest_sal_totali").select("*").eq("sal_id",s.id).eq("user_id",sbUid).maybeSingle();
    if(rt.error){toast("Non riesco a leggere i totali del SAL: senza quelli l'importo della fattura sarebbe sbagliato. Riprova fra un momento. ("+(rt.error.message||"")+")");return;}
    if(!rt.data){toast("I totali di questo SAL non si trovano. Riapri il computo e riprova.");return;}
    const k=salConti(rt.data,comp);

    /* ⚠️ zero e negativo si fermano QUI. Un SAL negativo vuol dire che hai
       contato meno del SAL precedente: una fattura in negativo non e' una
       fattura, e' una nota di credito, ed e' un'altra cosa. */
    if(!(k.lordo>0)){
      toast(k.lordo<0
        ? "Questo stato di avanzamento è negativo ("+eur2(k.lordo)+"): hai contato meno del SAL precedente. Controlla le quantità — su un importo negativo non si fa una fattura."
        : "Questo stato di avanzamento vale 0 €: non c'è ancora niente da fatturare.");
      return;
    }

    salFattDati={sal:s,comp:comp,k:k};

    openSheetGrande("La fattura di questo acconto",
       '<div class="sh-b"><div class="sh-tit">Per quale cifra la faccio?</div>'
      +'<div class="fn-scelte">'
      +  '<button type="button" class="fn-s" data-action="sal-fatt-intero">'
      +    '<span class="fn-t">Per l\'intero · '+eur2(k.lordo)+'</span>'
      +    '<span class="fn-d">Fatturi tutto l\'avanzamento. È il committente che trattiene la ritenuta di garanzia quando ti paga.</span></button>'
      +  '<button type="button" class="fn-s" data-action="sal-fatt-netto">'
      +    '<span class="fn-t">Al netto della ritenuta · '+eur2(k.netto)+'</span>'
      +    '<span class="fn-d">'+(k.ritenuta
             ? 'La ritenuta di garanzia del '+_pct(k.perc)+'% ('+eur2(k.ritenuta)+') la togli tu dalla fattura. La riavrai a fine lavori, a collaudo fatto, con una fattura a parte.'
             : 'Su questo SAL la ritenuta di garanzia è 0, quindi la cifra è la stessa di sopra.')+'</span></button>'
      +'</div>'
      +'<div class="sh-nota">Non salvo niente adesso: si apre la fattura già scritta, la controlli tu e la salvi tu.</div>'
      +'</div>',
       '<button class="btn b-cancel" data-action="close">Annulla</button>');
  }

  async function salFatturaCon(modo){
    const d=salFattDati;
    if(!d){toast("Riapri lo stato di avanzamento e riprova");return;}
    const s=d.sal, comp=d.comp, k=d.k;
    const importo=(modo==="netto")?k.netto:k.lordo;
    if(!(importo>0)){toast("Non c'è niente da fatturare");return;}

    const periodo=(s.periodo_dal||s.periodo_al)
      ? (" — lavori eseguiti "
         +(s.periodo_dal?"dal "+fdate(s.periodo_dal):"")
         +(s.periodo_al?((s.periodo_dal?" al ":"fino al ")+fdate(s.periodo_al)):""))
      : "";
    /* la descrizione e' quello che il committente legge sulla fattura: deve
       bastare da sola a dire di quale avanzamento si tratta, senza avere
       sotto mano il SAL. E se la ritenuta e' gia' stata tolta, lo dice. */
    const desc="Stato avanzamento lavori n. "+(s.numero||1)+" del "+fdate(s.data||todayStr())
      +(comp.titolo?" — "+comp.titolo:"")
      +periodo
      +((modo==="netto"&&k.ritenuta)
        ? " (importo al netto della ritenuta di garanzia del "+_pct(k.perc)+"%, pari a "+eur2(k.ritenuta)+")"
        : "");

    closeSheet();
    await fattForm(null,{
      cliente_id:comp.cliente_id||null,
      data:todayStr(),
      /* un SAL e' un acconto: il tipo giusto e' quello, non "fattura" */
      tipo:"acconto",
      _sal:s.id,
      _righe:[{descrizione:desc, qta:1, prezzo:importo,
               iva:fattForfettario()?0:ivaDefault(), ordine:0}]
    });
    /* ⚠️ il cliente del computo puo' non stare nell'anagrafica di QUESTO
       reparto: la tendina delle fatture legge solo i clienti del reparto
       corrente. In quel caso resterebbe su «nessuno» e la fattura si
       salverebbe senza cliente senza che nessuno lo dica. */
    const sel=$("#fa-cli");
    if(comp.cliente_id&&sel&&!sel.value){
      toast("Attenzione: il cliente del computo non è nell'anagrafica di questo reparto, quindi la tendina è su «nessuno». Sceglilo a mano prima di emetterla.");
    }
    salFattDati=null;
  }

  async function salPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    if(!sb||!sbUid){toast("Devi essere collegato");return;}
    if(salModifiche(id)){
      toast("Hai delle modifiche non salvate: premi prima Salva, poi scarica il PDF. Il foglio esce da quello che è salvato, non da quello che vedi nelle caselle.");
      return;
    }

    const rs=await sb.from("gest_sal").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(rs.error){toast("Non riesco a leggere lo stato di avanzamento: "+rs.error.message);return;}
    const s=rs.data; if(!s){toast("Stato di avanzamento non trovato");return;}

    const rcp=await sb.from("gest_computi").select("*").eq("id",s.computo_id).eq("user_id",sbUid).maybeSingle();
    if(rcp.error){toast("Non riesco a leggere il computo: "+rcp.error.message);return;}
    const comp=rcp.data; if(!comp){toast("Il computo di questo stato di avanzamento non si trova");return;}

    const [rt,rr]=await Promise.all([
      sb.from("gest_sal_totali").select("*").eq("sal_id",s.id).eq("user_id",sbUid).maybeSingle(),
      sb.from("gest_sal_righe_calc").select("*").eq("sal_id",s.id).eq("user_id",sbUid).order("ordine")
    ]);
    if(rt.error){toast("Non riesco a leggere i totali del SAL: il foglio uscirebbe senza il conto. Riprova fra un momento. ("+(rt.error.message||"")+")");return;}
    if(rr.error){toast("Non riesco a leggere le lavorazioni del SAL: il foglio uscirebbe senza le righe. Riprova fra un momento. ("+(rr.error.message||"")+")");return;}
    const t=rt.data;
    if(!t){toast("I totali di questo SAL non si trovano. Se hai appena eseguito sql/gest-sal.sql, riapri il computo e riprova.");return;}
    const righe=rr.data||[];
    if(!righe.length){toast("Questo stato di avanzamento non ha nessuna lavorazione contata: scrivi almeno una quantità, salva, e poi scarica il PDF.");return;}

    const {data:azLetta}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    const az=azLetta||{};
    const cli=await cliDelDocumento(comp.cliente_id,"nome,indirizzo,referente");

    /* ---- i conti: le stesse funzioni della schermata, nessuna copia ---- */
    const oggi =compRiepilogoDa(t.maturato,            t.oneri_sicurezza,           t.importo_manodopera, comp);
    const prima=compRiepilogoDa(t.maturato_precedente, t.oneri_sicurezza_precedenti,t.manodopera_precedente, comp);
    const k=salConti(t,comp);

    /* ⚠️ la somma delle righe che sto per stampare DEVE fare il totale del
       riquadro. Se non lo fa, il foglio si contraddice da solo e non esce. */
    const sommaRighe=Math.round(righe.reduce((a,r)=>a+(+r.importo||0),0)*100)/100;
    if(Math.abs(sommaRighe-oggi.lordo)>0.01){
      toast("Non stampo il foglio: la somma delle righe ("+eur2(sommaRighe)+") non fa il totale del SAL ("+eur2(oggi.lordo)+"). Riapri il SAL, salvalo di nuovo e riprova.");
      return;
    }

    /* la fascia rossa: un SAL in bozza, o senza dati fiscali, non si consegna */
    const motivi=[];
    if((s.stato||"bozza")!=="emesso")motivi.push("è ancora una BOZZA");
    if(!az.nome)motivi.push("manca il nome dell'attività");
    if(!String(az.piva||"").trim())motivi.push("manca la partita IVA");
    const _bozza=motivi.length>0;

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});

    /* le colonne: X[i] e' il bordo SINISTRO della colonna i, X[7] il bordo destro */
    const X=[12,20,44,116,128,150,172,198];
    const M=X[0], R=X[7], FONDO=262;
    const mid=(a,b)=>(X[a]+X[b])/2;
    /* ⚠️ useGrouping:true non si toglie: senza, sullo stesso foglio si legge
       «€ 97.000,00» e due righe sotto «€ 3000,00» (19 agosto 2026). */
    const _eur=n=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n||0);
    let y=20, tabTop=0;

    function testaTabella(){
      const H=7;
      doc.setFillColor(238,241,243);doc.rect(M,y,R-M,H,"F");
      doc.setDrawColor(110);doc.setLineWidth(.2);doc.rect(M,y,R-M,H);
      doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(0);
      const b=y+H-2.4;
      doc.text("N.",mid(0,1),b,{align:"center"});
      doc.text("Tariffa",mid(1,2),b,{align:"center"});
      doc.text("Descrizione dei lavori",mid(2,3),b,{align:"center"});
      doc.text("U.M.",mid(3,4),b,{align:"center"});
      doc.text("Q.tà eseguita",mid(4,5),b,{align:"center"});
      doc.text("Prezzo unit.",mid(5,6),b,{align:"center"});
      doc.text("Importo",mid(6,7),b,{align:"center"});
      for(let i=1;i<=6;i++)doc.line(X[i],y,X[i],y+H);
      y+=H;tabTop=y;
    }
    function chiudiCorpo(){
      doc.setDrawColor(110);doc.setLineWidth(.2);
      for(let i=1;i<=6;i++)doc.line(X[i],tabTop,X[i],y);
      doc.line(M,tabTop,M,y);doc.line(R,tabTop,R,y);doc.line(M,y,R,y);
    }
    function nuovaPagina(){ chiudiCorpo();doc.addPage();y=16;testaTabella(); }

    /* ---- intestazione ---- */
    if(_bozza){
      /* la fascia si disegna PRIMA di tutto: in fondo basterebbe non arrivarci */
      doc.setFillColor(192,57,43);doc.rect(0,0,210,11,"F");
      doc.setTextColor(255);doc.setFont("helvetica","bold");doc.setFontSize(9);
      doc.text("NON DA CONSEGNARE: "+motivi.join(" · "),105,7.2,{align:"center"});
      doc.setTextColor(0);y=26;
    }
    doc.setFont("helvetica","bold");doc.setFontSize(15);
    doc.text(az.nome||"(il nome della tua attività va nei Dati azienda)",M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);
    let hy=y+5.5;
    [az.piva?"P.IVA "+az.piva:"", azIndirizzo(az),
     [az.tel?"Tel "+az.tel:"", az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(function(r){doc.text(r,M,hy);hy+=4.2;});
    doc.setTextColor(0);
    doc.setFont("helvetica","bold");doc.setFontSize(14);
    doc.text("STATO DI AVANZAMENTO LAVORI",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("N. "+(s.numero||1)+"   del "+fdate(s.data||todayStr()),R,y+5.5,{align:"right"});
    if(s.periodo_dal||s.periodo_al){
      doc.text("Periodo "+(s.periodo_dal?"dal "+fdate(s.periodo_dal):"")
        +(s.periodo_al?(s.periodo_dal?" al ":"fino al ")+fdate(s.periodo_al):""),R,y+10,{align:"right"});
    }
    doc.setTextColor(0);
    y=Math.max(hy,y+14)+3;doc.setDrawColor(210);doc.line(M,y,R,y);y+=8;

    /* ⚠️ 19 agosto 2026 — «Spett.le» E SOTTO UN TRATTINO.
       Sul computo il cliente e' facoltativo: se non c'e', qui usciva la
       scritta «Spett.le» con sotto una lineetta. Su un foglio che si
       consegna sembra un documento lasciato a meta'. Se il cliente non
       c'e', non si scrive niente: il foglio comincia dai lavori.
       Visto sul PDF vero di Alessio, non a mente. */
    if(cli.nome){
      doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.text("Spett.le",M,y);y+=5.5;
      doc.setFont("helvetica","normal");doc.setFontSize(11);doc.text(String(cli.nome),M,y);y+=5;
      doc.setFontSize(8.5);doc.setTextColor(90);
      if(cli.indirizzo){doc.text(String(cli.indirizzo),M,y);y+=4.2;}
      if(cli.referente){doc.text("Rif. "+cli.referente,M,y);y+=4.2;}
      doc.setTextColor(0);y+=4;
    }

    doc.setFont("helvetica","bold");doc.setFontSize(10.5);
    const ogg=doc.splitTextToSize("Lavori: "+(comp.oggetto||comp.titolo||"—"),R-M);
    doc.text(ogg,M,y);y+=ogg.length*5+1;
    doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);
    const sotto=[comp.luogo?"Luogo: "+comp.luogo:"",
                 comp.numero?"Computo n. "+comp.numero:"",
                 comp.tipo==="pubblico"?"Lavori pubblici":""].filter(Boolean).join("   ·   ");
    if(sotto){doc.text(sotto,M,y);y+=4.2;}
    doc.setTextColor(0);y+=4;

    /* ---- la tabella ---- */
    testaTabella();
    doc.setFont("helvetica","normal");
    righe.forEach(function(r,i){
      const desc=doc.splitTextToSize(String(r.descrizione||"(senza descrizione)"),X[3]-X[2]-5);
      /* la riga dell'avviso «oltre il computo» si porta dietro la sua altezza:
         senza, finiva appiccicata sotto l'ultima riga della descrizione */
      const h=Math.max(desc.length*3.6+3, 7)+(r.oltre_computo?3.4:0);
      if(y+h>FONDO)nuovaPagina();
      doc.setDrawColor(190);doc.setLineWidth(.15);doc.line(M,y+h,R,y+h);
      doc.setFontSize(7.6);
      doc.text(String(i+1),mid(0,1),y+4,{align:"center"});
      if(r.codice)doc.text(String(r.codice),X[1]+1.5,y+4);
      doc.text(desc,X[2]+1.5,y+4);
      doc.text(_umPdf(r.unita||""),mid(3,4),y+4,{align:"center"});
      doc.text(_misLetta(r.quantita_eseguita),X[5]-1.5,y+4,{align:"right"});
      doc.text(_eur(r.prezzo_unitario),X[6]-1.5,y+4,{align:"right"});
      doc.setFont("helvetica","bold");
      doc.text(_eur(r.importo),R-1.5,y+4,{align:"right"});
      doc.setFont("helvetica","normal");
      /* ⚠️ contato piu' del previsto: non e' vietato (i lavori cambiano), ma sul
         foglio si scrive, non si nasconde. Chi lo firma deve saperlo. */
      if(r.oltre_computo){
        doc.setTextColor(192,57,43);doc.setFontSize(6.4);
        doc.text("oltre il computo (previsti "+_misLetta(r.quantita_computo)+")",X[2]+1.5,y+h-1.4);
        doc.setTextColor(0);doc.setFontSize(7.6);
      }
      y+=h;
    });
    chiudiCorpo();
    y+=8;

    /* ---- il riquadro dei conti ---- */
    const voci=[];
    voci.push(["Lavori eseguiti dall'inizio",oggi.lordo,false,false]);
    if(oggi.perc)voci.push(["Ribasso "+_pct(oggi.perc)+"%",oggi.ribasso,true,false]);
    voci.push(["Importo maturato a tutto il "+fdate(s.data||todayStr()),k.maturato,false,false]);
    voci.push([(t.numero_precedente!=null?"Già liquidato (fino al SAL n. "+t.numero_precedente+")":"Già liquidato in precedenza"),k.precedente,true,false]);
    voci.push(["Importo del presente stato di avanzamento",k.lordo,false,true]);
    if(k.ritenuta)voci.push(["Ritenuta di garanzia "+_pct(k.perc)+"%",k.ritenuta,true,false]);

    const hBox=voci.length*6+16;
    if(y+hBox>272){doc.addPage();y=20;}
    doc.setDrawColor(31,111,92);doc.setLineWidth(.4);doc.rect(R-108,y,108,hBox);doc.setLineWidth(.2);
    let ry=y+7;
    doc.setFontSize(9);
    voci.forEach(function(v){
      doc.setFont("helvetica",v[3]?"bold":"normal");
      doc.text(String(v[0]),R-106,ry);
      doc.text((v[2]?"- ":"")+_eur(v[1]),R-2,ry,{align:"right"});
      ry+=6;
    });
    doc.setDrawColor(31,111,92);doc.line(R-106,ry-3,R-2,ry-3);
    doc.setFont("helvetica","bold");doc.setFontSize(11.5);
    doc.text("NETTO DA PAGARE",R-106,ry+4);
    doc.text(_eur(k.netto),R-2,ry+4,{align:"right"});
    y+=hBox+8;

    /* sui lavori pubblici i due numeri che l'ente chiede sempre */
    if(comp.tipo==="pubblico"){
      if(y+12>282){doc.addPage();y=20;}
      doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);
      doc.text("Di cui maturati: oneri della sicurezza (non soggetti a ribasso) "+_eur(oggi.sicurezza)
        +"   ·   costo del personale "+_eur(oggi.manodopera),M,y,{maxWidth:R-M});
      doc.setTextColor(0);y+=8;
    }

    if(s.note){
      const nl=doc.splitTextToSize(String(s.note),R-M);
      if(y+nl.length*4.5+8>282){doc.addPage();y=20;}
      doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.text("Note",M,y);y+=5;
      doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);
      doc.text(nl,M,y);y+=nl.length*4.5;doc.setTextColor(0);
    }

    /* la nota in fondo e il numero di pagina, su ogni foglio */
    const np=doc.getNumberOfPages();
    for(let i=1;i<=np;i++){
      doc.setPage(i);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140);
      if(i===np){
        doc.text("Le quantità indicate sono quelle eseguite dall'inizio dei lavori; l'importo del presente stato di avanzamento è "
          +"la differenza rispetto a quanto già liquidato. Importi al netto dell'IVA.",M,286,{maxWidth:R-M-24});
      }
      doc.text("Pag. "+i+" di "+np,R,289,{align:"right"});
      doc.setTextColor(0);
    }

    doc.save((_bozza?"BOZZA-":"")+"SAL-"+(s.numero||1)+"-"
      +String(comp.titolo||cli.nome||"lavori").replace(/[^a-z0-9]+/gi,"-").toLowerCase().replace(/^-|-$/g,"")+".pdf");
    toast(_bozza
      ? ("Scaricato, ma sul foglio c'è la fascia rossa: "+motivi.join(" · ")+".")
      : "PDF dello stato di avanzamento scaricato ✅");
  }


  /* ============================================================
     LA SEZIONE PREZZARIO
     ============================================================
     La stessa tabella che il computo interroga (gest_prezzi_propri), qui vista
     per intero: si correggono le voci, si aggiornano i prezzi, e si carica un
     prezzario intero da un file invece di scrivere trecento righe a mano.

     Non c'e' il mestiere_id: il prezzario e' della PERSONA, come i crediti
     formativi. Le voci si vedono uguali da tutti i reparti — un prezzo di
     demolizione non cambia perche' cambi cantiere. */
  let pzCache=[], pzTimer=null;
  const PZ_MAX=1000;

  async function renderPrezzario(){
    filoMetti("prezzario","prezzario");
    const box=$("#pz-list");if(!box)return;
    const cnt=$("#cnt-prezzario");
    if(!sb||!sbUid){box.innerHTML=tabVuoto("Prezzario","Accedi per usare il tuo prezzario.","");return;}
    const {data,error}=await sb.from("gest_prezzi_propri").select("*")
      .eq("user_id",sbUid).is("eliminato_il",null)
      .order("usata_volte",{ascending:false}).limit(PZ_MAX);
    if(error){
      box.innerHTML='<div class="lm-vuoto">'+(_compManca(error)
        ? ('Per il prezzario serve l\'aggiornamento del database: '+COMP_SQL_HTML)
        : 'Non riesco a leggere il prezzario: '+esc(error.message))+'</div>';
      return;
    }
    pzCache=data||[];
    if(cnt)cnt.textContent=pzCache.length?String(pzCache.length):"";
    const q=String(($("#pz-cerca")&&$("#pz-cerca").value)||"").trim();
    const L=_ppFiltra(pzCache,q);

    if(!pzCache.length){
      box.innerHTML=tabVuoto("Il prezzario è vuoto",
        "Puoi scrivere le voci una per una, oppure caricare tutto il tuo prezzario da un file Excel qui sopra. Poi nel computo le ritrovi cercando una parola.",
        _SVGV+'<path d="M20.59 13.41 12 22l-9-9V3h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
        {t:"+ Scrivi la prima voce",a:"new-prezzo"});
      return;
    }
    if(!L.length){
      box.innerHTML='<p class="fatt-empty">Nessuna voce con questa parola. Hai '+pzCache.length+' voci nel prezzario.</p>';
      return;
    }
    /* niente tagli silenziosi: se il prezzario e' piu' grande di quanto ne
       tiriamo giu', si dice invece di far credere che siano tutte */
    const avviso=(pzCache.length>=PZ_MAX)
      ? '<div class="sh-nota">Il prezzario ha almeno '+PZ_MAX+' voci: qui sotto vedi le '+PZ_MAX+' che usi di più. Cerca una parola per trovare le altre.</div>' : "";
    /* ===== 18 agosto 2026 — LE VOCI DIVENTANO SCHEDE =====
       Prima erano righe sottili prese in prestito dalle spese: il PREZZO —
       cioe' la sola cosa che cerchi quando apri il prezzario — stava in
       fondo a una riga grigia piccola, in mezzo all'unita', alla categoria
       e al «mai usata». Adesso ogni voce e' una scheda come nei Preventivi,
       e il prezzo sta grande e da solo.
       ⚠️ Il pulsante × resta DENTRO la scheda: il gestore dei clic prende
       il `data-action` piu' interno, quindi cliccare la × cestina e non
       apre la voce. */
    box.innerHTML=avviso+'<div class="pz-griglia">'+L.map(x=>
      '<div class="pz-card" data-action="edit-prezzo" data-id="'+esc(String(x.id))+'">'
      +  '<div class="pz-testa">'
      +    (x.codice?'<span class="pz-cod">'+esc(x.codice)+'</span>':'<span class="pz-cod pz-cod--no">senza codice</span>')
      +    '<button type="button" class="rdel pz-x" data-action="del-prezzo" data-id="'+esc(String(x.id))+'" title="Metti nel cestino">&times;</button>'
      +  '</div>'
      +  '<div class="pz-desc">'+esc(x.descrizione||"(senza descrizione)")+'</div>'
      +  '<div class="pz-prezzo">'+eur2(x.prezzo_unitario)+(x.unita?'<small> / '+esc(x.unita)+'</small>':'')+'</div>'
      +  '<div class="pz-meta">'
      +    (x.categoria?esc(x.categoria)+' · ':'')
      +    (x.fonte?esc(x.fonte)+' · ':'')
      +    ((+x.usata_volte)?("usata "+(+x.usata_volte)+((+x.usata_volte===1)?" volta":" volte")):"mai usata")
      +  '</div>'
      +'</div>').join("")
      +'</div>'
      +'<div class="sh-nota">'+L.length+(L.length===1?" voce":" voci")+(q?(" su "+pzCache.length):"")+'. Clicca una voce per correggerla.</div>';
    const ce=$("#pz-cerca");
    if(ce&&!ce._agganciato){
      ce._agganciato=true;
      ce.oninput=function(){clearTimeout(pzTimer);pzTimer=setTimeout(renderPrezzario,250);};
    }
  }

  /* ---- la scheda di una voce del prezzario ---- */
  function prezzoForm(id){
    const x=(id?pzCache.find(v=>String(v.id)===String(id)):null)||{};
    const isNew=!x.id;
    const uniOpts='<option value="">— unità —</option>'+UNITA.map(u=>
      '<option value="'+u+'"'+(u===(x.unita||"")?" selected":"")+'>'+u+'</option>').join("");
    openSheetGrande(isNew?"Nuova voce del prezzario":"Voce del prezzario",
       '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">La voce</div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Codice del prezzario</label><input id="pz-cod"'+_noAuto()+' value="'+esc(x.codice||"")+'" placeholder="A.01.002"></div>'
      +    '<div class="field"><label>Unità di misura</label><select id="pz-uni">'+uniOpts+'</select></div>'
      +  '</div>'
      +  '<div class="field"><label>Descrizione</label><textarea id="pz-desc" rows="5" placeholder="Come la scrive il prezzario, per esteso">'+esc(x.descrizione||"")+'</textarea></div>'
      +  '<div class="field"><label>Prezzo unitario (€)</label><input type="text" inputmode="decimal" id="pz-prezzo"'+_noAuto()+' value="'+(x.prezzo_unitario!=null?_prezzoTesto(x.prezzo_unitario):"")+'" placeholder="18,50" style="max-width:200px"></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Per ritrovarla</div>'
      +  '<div class="field"><label>Categoria</label><input id="pz-cat"'+_noAuto()+' value="'+esc(x.categoria||"")+'" placeholder="Es. Demolizioni, Intonaci, Pavimenti"></div>'
      +  '<div class="field"><label>Da dove viene questo prezzo</label><input id="pz-fonte"'+_noAuto()+' value="'+esc(x.fonte||"")+'" placeholder="Es. Tariffa Regione Lazio 2023, listino mio"></div>'
      +  '<div class="sh-nota">La fonte serve quando fra sei mesi ti chiedi perché quel prezzo era proprio quello.</div>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">Solo per i lavori pubblici</div>'
      +  '<div class="field"><label>Quanta parte del prezzo è costo del personale (%)</label><input type="text" inputmode="decimal" id="pz-mano"'+_noAuto()+' value="'+(x.incidenza_manodopera!=null?String(x.incidenza_manodopera).replace(".",","):"")+'" placeholder="35" style="max-width:160px"></div>'
      +  '<div class="sh-nota">Se la scrivi qui, entra da sola nella lavorazione ogni volta che usi questa voce.</div>'
      +'</div>'
      +(isNew?'':'<div class="sh-b"><div class="sh-tit">Quanto la usi</div><div class="sh-nota">'
        +((+x.usata_volte)?("L'hai usata "+(+x.usata_volte)+((+x.usata_volte===1)?" volta":" volte")+": sta in cima alla ricerca."):"Non l'hai ancora mai usata in un computo.")
        +'</div></div>')
      +'</div></div>',

       '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +(isNew?"":'<button class="btn btn-danger" data-action="del-prezzo" data-id="'+esc(String(x.id))+'">🗑 Metti nel cestino</button>')
      +'<button class="btn-primary b-save" data-action="save-prezzo" data-id="'+esc(x.id||"")+'">'+(isNew?"Crea la voce":"Salva")+'</button>');
  }

  async function savePrezzo(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const desc=String(($("#pz-desc")&&$("#pz-desc").value)||"").trim();
    if(!desc){toast("Scrivi almeno la descrizione della voce");return;}
    const riga={
      descrizione:desc,
      codice:String(($("#pz-cod")&&$("#pz-cod").value)||"").trim()||null,
      unita:($("#pz-uni")&&$("#pz-uni").value)||null,
      prezzo_unitario:_numIt("#pz-prezzo")||0,
      categoria:String(($("#pz-cat")&&$("#pz-cat").value)||"").trim()||null,
      fonte:String(($("#pz-fonte")&&$("#pz-fonte").value)||"").trim()||null,
      incidenza_manodopera:_numIt("#pz-mano")
    };
    let res;
    if(id)res=await sb.from("gest_prezzi_propri").update(riga).eq("id",id).eq("user_id",sbUid).select("id");
    else  res=await sb.from("gest_prezzi_propri").insert(Object.assign({user_id:sbUid},riga)).select("id");
    if(res.error){
      toast(_compManca(res.error)?("Per il prezzario serve l'aggiornamento del database: "+COMP_SQL_TESTO):("Errore: "+res.error.message));
      return;
    }
    if(!res.data||!res.data.length){toast("Non salvata: nessuna riga scritta. Riprova.");return;}
    closeSheet();
    ppTutte=[];                 /* la ricerca dentro il computo si rifa' */
    rinfresca("prezzario");
    toast(id?"Voce aggiornata ✔":"Voce creata ✔");
  }
  async function delPrezzo(id){
    const x=pzCache.find(v=>String(v.id)===String(id))||{};
    if(!gconfirm((_cestOn()?"Mettere «":"Eliminare «")+(x.descrizione||"")+"»?\n\n"+fraseCestino()+"\nI computi già fatti non cambiano."))return;
    const {error}=await sb.from("gest_prezzi_propri").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    closeSheet();
    ppTutte=[];
    rinfresca("prezzario");
    toast(_cestOn()?"Voce messa nel cestino":"Voce eliminata");
  }

  /* ============================================================
     IMPORTARE UN PREZZARIO DA UN FILE
     ============================================================
     Un tecnico ha la tariffa regionale in un foglio Excel scaricato dal sito
     della Regione. Scrivere trecento voci a mano non lo fa nessuno: o si
     importa, o il prezzario resta vuoto e la funzione non serve a niente.

     Le colonne NON si prendono per posizione: ogni Regione mette le sue in un
     ordine diverso. Si cerca l'intestazione per come e' scritta (codice /
     tariffa / articolo, descrizione, unita' / u.m., prezzo / importo), e se
     l'intestazione non c'e' si parte dalla prima riga.

     I NUMERI ITALIANI: "1.234,56" e "1234.56" devono dare lo stesso numero.
     Il punto delle migliaia insieme alla virgola dei decimali e' la trappola
     classica: 1.234 letto male diventa 1,234 euro invece di 1.234. */
  const PZ_IMP_MAX=5000;
  /* 11 agosto 2026 — un tempo qui c'era una regola a parte, e sbagliava il
     caso piu' comune dei file delle Regioni: "1.250" senza virgola diventava
     1,25. Adesso si usa la STESSA regola dei moduli (_numeroIt): una sola, in
     un posto solo. Due copie della stessa regola si disallineano. */
  function _pzNum(v){
    if(v==null)return null;
    if(typeof v==="number")return isFinite(v)?v:null;
    return _numeroIt(v);
  }
  /* 11 agosto 2026 — L'ORDINE DI QUESTI CONTROLLI CONTA, ED ERA SBAGLIATO.
     L'unita' di misura veniva cercata PRIMA del prezzo, e cercava la parola
     "unit": cosi' la colonna «Prezzo unitario» finiva presa per la colonna
     dell'unita' di misura, il prezzo non si trovava piu' e si importava un
     prezzario intero con TUTTI I PREZZI A ZERO. Ed e' la dicitura piu' comune
     nei prezzari regionali.
     Adesso: prima la manodopera (che dice "incidenza", non "prezzo"), poi il
     prezzo; e l'unita' di misura si rifiuta di riconoscere un'intestazione
     che parla di soldi.
     Aggiunto anche «Cod.» abbreviato: prima si cercava "codic" con cinque
     lettere e un'intestazione «Cod.» restava senza colonna. */
  function _pzCol(intest){
    const C={};
    /* 12 agosto 2026 (sera) — l'elenco delle parole che vogliono dire "soldi"
       era corto: i prezzari regionali scrivono anche «€», «€/U.M.», «EUR»,
       «P.U.», «Prezzo unitario in euro», «Elenco prezzi». Se nessuna veniva
       riconosciuta, la colonna del prezzo non si trovava e TUTTE le voci
       entravano a 0,00 € senza un messaggio (piu' sotto adesso c'e' anche il
       controllo finale che se ne accorge comunque). */
    const soldi=/prezzo|importo|costo|euro|valore|€|\beur\b|^p\.?\s?u\.?$|unitar|tariffa unitaria|elenco prezzi/;
    intest.forEach((t,i)=>{
      const x=_ppPiatto(String(t||"")).trim();
      if(C.descrizione==null&&/descriz|lavoraz|denominaz|oggetto/.test(x))C.descrizione=i;
      else if(C.codice==null&&/^cod\b|^cod\.|codic|tariff|articol|^art\b|^art\.|n\.?\s?art|^voce\b/.test(x))C.codice=i;
      else if(C.mano==null&&/manodoper|incidenz|^mano\b/.test(x))C.mano=i;
      else if(C.prezzo==null&&soldi.test(x))C.prezzo=i;
      else if(C.unita==null&&!soldi.test(x)&&/^u\.?\s?m\.?$|^unita|unita di misura|^misura$|^um$/.test(x))C.unita=i;
      else if(C.categoria==null&&/categor|capitol|gruppo|famigl/.test(x))C.categoria=i;
      /* ⚠️ 18 agosto 2026 — la quantita' serve solo all'importazione dentro un
         COMPUTO (il prezzario non ce l'ha, e infatti la ignora). Sta in fondo
         all'elenco apposta: «quantita» non deve rubare la colonna a nessuno,
         e soprattutto non deve farsi confondere con i soldi. */
      else if(C.quantita==null&&!soldi.test(x)&&/quantit|^q\.?ta\.?$|^qta$|^somman/.test(x))C.quantita=i;
    });
    return C;
  }
  /* ⚠️ L'IMPORTAZIONE SI FA IN DUE TEMPI. 10 agosto 2026.
     Prima il file entrava dritto e la tariffa prendeva il nome del FILE: chi
     scarica dalla Regione si ritrovava scritto "prezzario_2023_def_rev2" su
     ogni voce e sul menu a tendina. Adesso prima si legge, si fa vedere cosa
     c'e' dentro e si chiede come si chiama; poi si importa.

     E l'AGGIORNAMENTO fra due anni non sovrascrive niente: la tariffa nuova
     entra come tariffa a se' ("Lazio 2025" accanto a "Lazio 2023"), col
     confronto di cosa e' cambiato, e la vecchia si mette nel cestino solo se
     lo dici tu. Sovrascrivere i prezzi sarebbe la cosa piu' pericolosa che
     possiamo fare: un computo in corso cambierebbe totale sotto gli occhi. */
  let pzPend=null;
  function pzApriFile(){
    const f=$("#pz-file");
    if(!f)return;
    f.value="";                 /* se no, ricaricando lo stesso file non scatta */
    f.onchange=function(){ if(f.files&&f.files[0])pzImporta(f.files[0]); };
    f.click();
  }
  function _pzEsito(html,tono){
    const b=$("#pz-esito");if(!b)return;
    b.innerHTML='<div class="sh-nota" style="border-left:4px solid var('+(tono==="err"?"--err,#c0392b":"--acc,#1f6f5c")+');padding-left:10px;margin-bottom:12px">'+html+'</div>';
  }
  function _pzNomeDaFile(nome){
    return nome.replace(/\.(xlsx?|xlsm|csv)$/i,"").replace(/[_-]+/g," ")
      .replace(/\s+/g," ").trim().slice(0,60);
  }
  async function pzImporta(file){
    if(!sbUid){toast("Devi essere loggato");return;}
    pzPend=null;
    _pzEsito("Sto leggendo <b>"+esc(file.name)+"</b>…");
    if(!(await caricaXLSX())){_pzEsito("Non riesco a scaricare il modulo per leggere i file Excel: controlla la connessione e riprova.","err");return;}
    let righe;
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(new Uint8Array(buf),{type:"array"});
      const sh=wb.Sheets[wb.SheetNames[0]];
      righe=XLSX.utils.sheet_to_json(sh,{header:1,raw:false,defval:""});
    }catch(e){
      _pzEsito("Non riesco ad aprire il file: "+esc((e&&e.message)||String(e))+"<br>Se è un CSV, prova a riaprirlo con Excel e salvarlo come .xlsx.","err");
      return;
    }
    if(!righe||!righe.length){_pzEsito("Il file è vuoto.","err");return;}

    /* l'intestazione: la prima riga che parla di "descrizione" */
    let iInt=-1;
    for(let i=0;i<Math.min(righe.length,30);i++){
      if((righe[i]||[]).some(c=>/descriz|lavoraz|denominaz/i.test(String(c||"")))){iInt=i;break;}
    }
    const C=(iInt>=0)?_pzCol(righe[iInt]):{codice:0,descrizione:1,unita:2,prezzo:3};
    if(iInt>=0&&C.descrizione==null){
      _pzEsito("Non trovo la colonna della descrizione. Il file deve avere una riga di intestazione con scritto <b>Descrizione</b> (e possibilmente Codice, U.M., Prezzo).","err");
      return;
    }
    /* senza intestazione non si tira a indovinare in silenzio: si fa vedere
       come sarebbe la prima riga e si chiede */
    if(iInt<0){
      const pr=(function(){for(let i=0;i<Math.min(righe.length,10);i++){
        const r=righe[i]||[];if(r.some(c=>String(c||"").trim()))return r;}return [];})();
      const mostra=(i,lab)=>lab+": "+(String((pr[i]!=null?pr[i]:"")).trim()||"(vuoto)");
      if(!gconfirm("Il file non ha una riga di intestazione riconoscibile.\n\n"
        +"Leggo le colonne in quest'ordine, e la prima riga verrebbe fuori così:\n\n"
        +mostra(0,"Codice")+"\n"+mostra(1,"Descrizione")+"\n"+mostra(2,"Unità")+"\n"+mostra(3,"Prezzo")
        +"\n\nSe non è così, annulla: metti nel file una riga con scritto Codice, Descrizione, U.M., Prezzo e riprova.\n\nVado avanti?")){
        _pzEsito("Importazione annullata. Aggiungi al file una riga di intestazione con <b>Codice · Descrizione · U.M. · Prezzo</b> e riprova.","err");
        return;
      }
    }
    const dati=righe.slice(iInt>=0?iInt+1:0);

    const voci=[];let saltate=0;
    dati.slice(0,PZ_IMP_MAX).forEach(r=>{
      const desc=String((r[C.descrizione]!=null?r[C.descrizione]:"")).replace(/\s+/g," ").trim();
      if(!desc||desc.length<3){saltate++;return;}
      voci.push({
        codice:(C.codice!=null?String(r[C.codice]||"").trim():"")||null,
        descrizione:desc,
        unita:(C.unita!=null?String(r[C.unita]||"").trim():"")||null,
        prezzo_unitario:((C.prezzo!=null)?_pzNum(r[C.prezzo]):null)||0,
        categoria:(C.categoria!=null?String(r[C.categoria]||"").trim():"")||null,
        incidenza_manodopera:(C.mano!=null?_pzNum(r[C.mano]):null)
      });
    });
    if(!voci.length){_pzEsito("Nel file non ho trovato nessuna voce con una descrizione. Righe lette: "+dati.length+".","err");return;}

    /* ===== 12 agosto 2026 (sera) — IL PREZZARIO A ZERO =====
       Per la descrizione il controllo c'era, per il PREZZO no: se la colonna
       non veniva riconosciuta (o c'era ma con i numeri scritti in un modo che
       non si legge) entravano centinaia di voci tutte a 0,00 € e nessuno
       diceva niente. Poi le usavi in un computo e il totale veniva zero, senza
       capire perche'. Adesso: se non ne ha nemmeno una col prezzo mi fermo; se
       ne mancano piu' di una su quattro lo dico prima di importare. */
    const conPrezzo=voci.filter(v=>(+v.prezzo_unitario||0)>0).length;
    const _intest=(iInt>=0)?(righe[iInt]||[]).map(x=>String(x||"").trim()).filter(Boolean).join(" · "):"(nessuna riga di intestazione)";
    if(conPrezzo===0){
      _pzEsito("Ho letto <b>"+voci.length+" voci</b>, ma <b>nessuna ha un prezzo</b>: entrerebbero tutte a 0,00 € e il prezzario non servirebbe a niente."
        +"<br><br>Le colonne che ho visto sono queste:<br><b>"+esc(_intest)+"</b>"
        +"<br><br>"+(C.prezzo==null
            ? "Nessuna di queste dice «prezzo». Rinomina la colonna dei soldi in <b>Prezzo</b> (oppure Prezzo unitario, Importo, €) e riprova."
            : "La colonna «"+esc(String((righe[iInt]||[])[C.prezzo]||"").trim()||"prezzo")+"» c'è ma dentro non ci sono numeri leggibili: controlla che i prezzi non siano scritti come testo o con simboli strani.")
        ,"err");
      return;
    }
    const senzaPrezzo=voci.length-conPrezzo;

    /* quello che c'e' gia' nel prezzario, per il confronto e per i doppioni */
    const {data:vecchie}=await sb.from("gest_prezzi_propri")
      .select("id,codice,descrizione,prezzo_unitario,fonte")
      .eq("user_id",sbUid).is("eliminato_il",null).limit(20000);
    pzPend={file:file.name, voci:voci, saltate:saltate, tagliate:Math.max(0,dati.length-PZ_IMP_MAX), vecchie:(vecchie||[])};

    const fonti=Array.from(new Set(pzPend.vecchie.map(x=>x.fonte).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"it"));
    $("#pz-esito").innerHTML=
      '<div class="sh-b" style="border-left:4px solid var(--acc,#1f6f5c)">'
      +'<div class="sh-tit">Ho letto '+voci.length+' voci da '+esc(file.name)+'</div>'
      +(pzPend.tagliate?('<div class="sh-nota">Il file ne ha '+dati.length+': ne leggo le prime '+PZ_IMP_MAX+'.</div>'):'')
      +(saltate?('<div class="sh-nota">'+saltate+' righe non hanno una descrizione e le salto (titoli, righe vuote, totali).</div>'):'')
      +(senzaPrezzo>voci.length/4
        ? ('<div class="sh-nota" style="border-left:4px solid var(--err,#c0392b);padding-left:10px">'
           +'<b>Attenzione:</b> '+senzaPrezzo+' voci su '+voci.length+' entrerebbero a <b>0,00 €</b>. '
           +'Spesso sono i titoli dei capitoli, ma se sono voci vere controlla la colonna del prezzo nel file.</div>')
        : (senzaPrezzo?('<div class="sh-nota">'+senzaPrezzo+' voci non hanno un prezzo e entrano a 0,00 € (di solito sono i titoli dei capitoli).</div>'):''))
      +'<div class="field"><label>Come si chiama questa tariffa?</label>'
      +  '<input id="pz-nome"'+_noAuto()+' value="'+esc(_pzNomeDaFile(file.name))+'" placeholder="Es. Tariffa Regione Lazio 2025"></div>'
      +'<div class="sh-nota">È il nome che vedrai nella tendina quando fai un computo, e quello che finisce sul documento.</div>'
      +(fonti.length
        ? '<div class="field"><label>Questa aggiorna una tariffa che hai già?</label><select id="pz-agg">'
          +'<option value="">— no, è una tariffa nuova —</option>'
          +fonti.map(f=>'<option value="'+esc(f)+'">'+esc(f)+'</option>').join("")
          +'</select></div>'
        : '')
      +'<div id="pz-confronto"></div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">'
      +  '<button type="button" class="btn-primary quick-add" data-action="pz-vai">Importa le '+voci.length+' voci</button>'
      +  '<button type="button" class="btn-ghost quick-add" data-action="pz-annulla">Annulla</button>'
      +'</div></div>';
    const sa=$("#pz-agg");
    if(sa)sa.onchange=pzConfronta;
    const ni=$("#pz-nome");if(ni){ni.focus();ni.select();}
  }

  /* il confronto con la tariffa vecchia: si accoppiano per CODICE, che e'
     l'unica cosa che resta uguale fra un anno e l'altro. Le descrizioni le
     riscrivono sempre. */
  function pzConfronta(){
    const box=$("#pz-confronto");if(!box||!pzPend)return;
    const vecchia=($("#pz-agg")&&$("#pz-agg").value)||"";
    if(!vecchia){box.innerHTML="";return;}
    const V=pzPend.vecchie.filter(x=>x.fonte===vecchia);
    const chi=x=>_ppPiatto(x.codice||"").replace(/\s/g,"");
    const mapV={};V.forEach(x=>{const k=chi(x);if(k)mapV[k]=x;});
    let uguali=0,cambiati=0,nuove=0;const esempi=[];
    pzPend.voci.forEach(n=>{
      const k=chi(n);const v=k?mapV[k]:null;
      if(!v){nuove++;return;}
      const d=Math.round(((+n.prezzo_unitario||0)-(+v.prezzo_unitario||0))*100)/100;
      if(d===0){uguali++;return;}
      cambiati++;
      if(esempi.length<3)esempi.push(esc(n.codice||"")+": "+eur2(v.prezzo_unitario)+" → <b>"+eur2(n.prezzo_unitario)+"</b>");
    });
    const codiciNuovi=new Set(pzPend.voci.map(chi).filter(Boolean));
    const sparite=V.filter(x=>chi(x)&&!codiciNuovi.has(chi(x))).length;
    box.innerHTML='<div class="sh-nota" style="border-left:3px solid var(--bordo);padding-left:10px">'
      +'<b>Rispetto a «'+esc(vecchia)+'»</b> ('+V.length+' voci):<br>'
      +cambiati+' prezzi cambiati · '+uguali+' uguali · '+nuove+' voci nuove · '+sparite+' non ci sono più'
      +(esempi.length?('<br><small>'+esempi.join(' · ')+'</small>'):'')
      +'</div>'
      +'<div class="field"><label>E della vecchia che ne faccio?</label><div class="seg" id="pz-vecchia">'
      +'<button data-v="tieni" class="on">Tienila</button>'
      +'<button data-v="cestino">'+(_cestOn()?"Mettila nel cestino":"Eliminala per sempre")+'</button></div>'
      +'<div class="sh-nota">Tenerle tutte e due serve se hai computi in corso con i prezzi vecchi: le scegli dalla tendina. I computi già fatti non cambiano in nessun caso.</div></div>';
    bindSeg("pz-vecchia");
  }
  function pzAnnullaImport(){
    pzPend=null;
    _pzEsito("Importazione annullata. Non ho toccato niente.");
  }

  async function pzEsegui(){
    if(!pzPend){toast("Scegli prima un file");return;}
    const nome=String(($("#pz-nome")&&$("#pz-nome").value)||"").trim();
    if(!nome){toast("Dai un nome a questa tariffa");return;}
    const vecchia=($("#pz-agg")&&$("#pz-agg").value)||"";
    const inCestino=(vecchia&&segVal("pz-vecchia")==="cestino");

    /* la vecchia va nel cestino PRIMA, con una sola richiesta: js/cestino.js
       trasforma il delete in una data, quindi si recupera tutto */
    if(inCestino){
      _pzEsito("Metto «"+esc(vecchia)+"» nel cestino…");
      const {error}=await sb.from("gest_prezzi_propri").delete()
        .eq("user_id",sbUid).eq("fonte",vecchia);
      if(error){_pzEsito("Non riesco a mettere via la tariffa vecchia: "+esc(error.message),"err");return;}
    }
    /* doppioni: solo dentro la STESSA tariffa. Lo stesso codice in due regioni
       diverse e' normale e non va tolto. */
    const gia=new Set(pzPend.vecchie.filter(x=>x.fonte===nome&&!(inCestino&&x.fonte===vecchia))
      .map(x=>_ppPiatto((x.codice||"")+"§"+(x.descrizione||""))));
    const nuove=[];let doppie=0;
    pzPend.voci.forEach(v=>{
      const k=_ppPiatto((v.codice||"")+"§"+v.descrizione);
      if(gia.has(k)){doppie++;return;}
      gia.add(k);
      nuove.push(Object.assign({user_id:sbUid,fonte:nome},v));
    });
    if(!nuove.length){
      _pzEsito("Non c'era niente di nuovo da importare: tutte le "+doppie+" voci erano già dentro «"+esc(nome)+"».","err");
      return;
    }
    let messe=0;
    for(let i=0;i<nuove.length;i+=200){
      const pezzo=nuove.slice(i,i+200);
      const {error}=await sb.from("gest_prezzi_propri").insert(pezzo);
      if(error){
        _pzEsito("Importate "+messe+" voci, poi il database si è fermato: "+esc(error.message),"err");
        ppTutte=[];pzPend=null;rinfresca("prezzario");
        return;
      }
      messe+=pezzo.length;
      _pzEsito("Sto caricando… "+messe+" di "+nuove.length);
    }
    ppTutte=[];pzPend=null;
    _pzEsito("<b>Importate "+messe+" voci</b> nella tariffa «"+esc(nome)+"»."
      +(doppie?(" "+doppie+" c'erano già e non le ho rifatte."):"")
      +(inCestino?(_cestOn()?(" La tariffa «"+esc(vecchia)+"» è nel Cestino: se serve la rimetti a posto da lì."):(" La tariffa «"+esc(vecchia)+"» è stata eliminata per sempre: il cestino non era attivo.")):"")
      +" Adesso la scegli dalla tendina quando fai un computo.");
    rinfresca("prezzario");
    toast("Tariffa importata: "+messe+" voci ✔");
  }

  /* ============================================================
     DAL COMPUTO AL PREVENTIVO
     ============================================================
     Un computo e' gia' un preventivo: voci, quantita', prezzi. Ribatterlo a
     mano e' lavoro buttato, ed e' anche il punto dove nascono gli errori,
     perche' i numeri si copiano a occhio.

     Le quantita' entrano ARROTONDATE A TRE DECIMALI: nel computo stanno con
     cinque, ma su un preventivo che legge il cliente "20,46 m²" e' la cifra
     giusta, non "20,46000".

     Il RIBASSO diventa una riga a parte in fondo, negativa, invece di essere
     spalmato sui prezzi: cosi' il cliente vede quanto gli hai scontato, e il
     totale del preventivo torna identico a quello del computo. Se lo
     nascondessimo dentro i prezzi unitari, i due documenti direbbero la stessa
     cifra finale ma prezzi diversi voce per voce, e la prima domanda del primo
     che li confronta sarebbe "e allora quale dei due e' giusto?". */
  /* ⚠️ IL CHIAVISTELLO DEL DOPPIO CLIC — 14 agosto 2026.
     Difetto vero, riprodotto nel browser con la rete lenta di un cantiere:
     due clic su «Crea il preventivo» facevano DUE preventivi, tutti e due
     col NUMERO 1. Il numero progressivo si calcola prima di scrivere, e in
     quel mezzo secondo il pulsante restava premibile — chi non è sicuro che
     il clic abbia preso ne fa un secondo.
     Due preventivi con lo stesso numero è la cosa che il commercialista
     trova subito e non si sistema più: i numeri di un anno si rifanno tutti.
     Il controllo su preventivo_id non bastava: quello guarda compCache, che
     al secondo clic non è ancora stata riletta.
     Il chiavistello è la variabile, non il pulsante spento: se un domani il
     pulsante cambia forma, la doppia scrittura resta bloccata lo stesso.
     (È lo stesso chiavistello di compMisAdd, dal 10 agosto: lì c'era, qui no.) */
  let compPrevInCorso=false;
  async function computoAPreventivo(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    if(compPrevInCorso){toast("Sto già creando il preventivo, un attimo…");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}
    if(c.preventivo_id){
      if(!gconfirm("Da questo computo hai già creato un preventivo.\n\nNe faccio un altro?"))return;
    }
    compPrevInCorso=true;
    const _btPrev=$('[data-action="comp-prev"]');
    if(_btPrev){_btPrev.disabled=true;_btPrev.textContent="Sto creando il preventivo…";}
    /* da qui in poi ogni uscita deve riaprire il chiavistello, se no il
       pulsante resta bloccato per sempre e non si crea più niente */
    const _libera=()=>{compPrevInCorso=false;
      if(_btPrev){_btPrev.disabled=false;_btPrev.textContent="→ Crea il preventivo";}};
    try{
      return await _computoAPreventivo(id,c,_libera);
    }catch(e){
      _libera();
      toast("Non sono riuscito a creare il preventivo: "+((e&&e.message)||"riprova"));
    }
  }
  async function _computoAPreventivo(id,c,_libera){
    /* ⚠️ 19 agosto 2026 — I CAPITOLI SI LEGGONO INSIEME ALLE LAVORAZIONI.
       Se la lettura dei capitoli non riesce, il preventivo si fa lo stesso,
       piatto: meglio un preventivo senza titoli che nessun preventivo. */
    const [rv,rc]=await Promise.all([
      sb.from("gest_computo_voci_calc").select("*")
        .eq("user_id",sbUid).eq("computo_id",id).order("ordine"),
      sb.from("gest_computo_capitoli").select("*")
        .eq("user_id",sbUid).eq("computo_id",id).order("ordine")
        .then(r=>r,e=>({data:null,error:e}))
    ]);
    const {data:vv,error:eV}=rv;
    if(eV){_libera();toast("Non riesco a leggere le lavorazioni: "+eV.message);return;}
    const capitoli=(rc&&!rc.error&&rc.data)?rc.data:[];
    const voci=vv||[];
    if(!voci.length){_libera();toast("Il computo è vuoto: aggiungi almeno una lavorazione");return;}

    /* ⚠️ LA QUANTITÀ ZERO DIVENTAVA UNO — 11 agosto 2026.
       Una lavorazione inserita ma NON ANCORA MISURATA vale 0 € nel computo,
       ed è giusto. Ma il preventivo, dovunque faccia i conti, scrive
       (+r.qta||1): lo zero viene letto come "non scritto" e diventa 1. Quella
       riga arrivava quindi al cliente a 1 × prezzo unitario. Una voce da
       1.850 €/corpo gonfiava il preventivo di 1.850 €, e i due documenti dello
       stesso lavoro smettevano di dire la stessa cifra. Nel PDF del preventivo
       compariva pure «1» nella colonna quantità, come se fosse voluto.
       Il ||1 del preventivo NON si tocca: serve alle righe scritte a mano,
       dove lasciare la quantità vuota vuol dire "una". Si sistema qui, dove
       si sa che 0 vuol dire "non ancora misurata": si avvisa e non si porta. */
    const senzaMisure=voci.filter(v=>!(Math.round((+v.quantita||0)*1000)/1000));
    if(senzaMisure.length){
      const q=senzaMisure.length;
      if(!gconfirm(q===1
        ? "La lavorazione «"+String(senzaMisure[0].descrizione||"senza descrizione").slice(0,60)+"» non ha ancora le misure, quindi vale 0 €.\n\nNel preventivo non la porto: se ci finisse, il cliente se la vedrebbe conteggiata una volta a prezzo pieno.\n\nVuoi creare lo stesso il preventivo con le altre?"
        : "Ci sono "+q+" lavorazioni senza misure, che valgono 0 €.\n\nNel preventivo non le porto: se ci finissero, il cliente se le vedrebbe conteggiate una volta a prezzo pieno ciascuna.\n\nVuoi creare lo stesso il preventivo con le altre?")){_libera();return;}
    }
    /* ⚠️ 19 agosto 2026 — L'ORDINE DEL COMPUTO NON ARRIVAVA AL PREVENTIVO.
       Difetto vero, riprodotto al banco (prove/banco_computo_preventivo.js).
       Qui si leggevano le lavorazioni con .order("ordine") e si buttavano in
       un elenco piatto. Ma `ordine` è il contatore di TUTTO il computo
       (max+1 su compVociCache, vedi compVoceSalva), mentre le frecce su/giù
       spostano soltanto DENTRO un capitolo. Quindi una lavorazione aggiunta
       DOPO a un capitolo di sopra prende un numero più alto di tutte quelle
       dei capitoli sotto:

         computo   →  A01 A02 A03 | B01 B02        (come si vede a schermo)
         preventivo→  A01 A02 B01 B02 A03          (com'era)

       Sul foglio che legge il cliente le demolizioni finivano dopo gli
       intonaci. E i CAPITOLI non arrivavano affatto: 87 righe attaccate,
       senza un titolo che dicesse dove finisce una parte.

       Adesso si raggruppa per capitolo, nell'ordine dei capitoli, e dentro
       ognuno per `ordine` — le stesse due chiavi con cui renderCompVoci
       disegna la schermata. Le lavorazioni senza capitolo vanno in fondo,
       esattamente come nel computo. */
    const _q=v=>Math.round((+v.quantita||0)*1000)/1000;
    const _misurate=voci.filter(_q);
    const _perOrdine=(a,b)=>(+a.ordine||0)-(+b.ordine||0);
    const gruppi=capitoli.slice().sort(_perOrdine).map(k=>({
      cap:k, voci:_misurate.filter(v=>String(v.capitolo_id||"")===String(k.id)).sort(_perOrdine)
    })).filter(g=>g.voci.length);
    const orfane=_misurate.filter(v=>!v.capitolo_id
      ||!capitoli.some(k=>String(k.id)===String(v.capitolo_id))).sort(_perOrdine);
    if(orfane.length)gruppi.push({cap:null, voci:orfane});

    const righe=[];
    gruppi.forEach(g=>{
      /* il titolo esce solo se i capitoli ci sono davvero: su un computo
         senza capitoli il preventivo resta identico a prima, e «Senza
         capitolo» non è un titolo da far leggere a un cliente. */
      if(g.cap){
        righe.push({user_id:sbUid, sezione:true, qta:0, prezzo:0,
          descrizione:(g.cap.numero?String(g.cap.numero)+" — ":"")
                     +(g.cap.titolo||"(capitolo senza titolo)"),
          ordine:righe.length});
      }
      g.voci.forEach(v=>{
        /* ⚠️ «sezione:false» NON si toglie, anche se il database ha già il
           suo default. Vedi la spiegazione lunga su _scriviRighePrev: in una
           scrittura di piu' righe insieme, tutte devono avere le STESSE
           chiavi, se no le altre finiscono a NULL e salta tutto. */
        righe.push({user_id:sbUid, sezione:false,
          descrizione:(v.codice?v.codice+" — ":"")+(v.descrizione||"(senza descrizione)")+(v.unita?"  ("+_umPdf(v.unita)+")":""),
          qta:_q(v),
          prezzo:+v.prezzo_unitario||0,
          ordine:righe.length});
      });
    });
    if(!righe.filter(r=>!_rigaSezione(r)).length){_libera();toast("Nessuna lavorazione ha le misure: il preventivo sarebbe vuoto");return;}

    const rp=compRiepilogo(voci,c);
    if(rp.perc&&rp.ribasso){
      righe.push({user_id:sbUid, descrizione:"Ribasso "+_pct(rp.perc)+"% sul totale dei lavori"
        +(rp.sicurezza?" (oneri della sicurezza esclusi)":""),
        qta:1, prezzo:-rp.ribasso, ordine:righe.length});
    }

    /* stessa formula del numero progressivo di savePrev: si contano anche i
       preventivi nel cestino, se no il prossimo riprende un numero già usato.
       13 agosto 2026: come gli altri due posti, adesso guarda anche l'anno e il
       reparto. Questo terzo era sfuggito: l'ha trovato la prova, non io. */
    /* qui la data del preventivo e' sempre oggi: lo dice l'insert qui sotto
       (data:todayStr()). Nessuna variabile `data` in questa funzione. */
    const _annoPrev=todayStr().slice(0,4);
    const _midPrev=curMestiere();
    let numero=prevCache.filter(x=>String(x.data||"").slice(0,4)===_annoPrev)
                        .reduce((m,x)=>Math.max(m,+x.numero||0),0)+1;
    try{
      const _sbP=(sb.raw||sb.from.bind(sb));
      const {data:maxP,error:eP}=await _sbP("gest_preventivi").select("numero")
        .eq("user_id",sbUid).eq("mestiere_id",_midPrev)
        .gte("data",_annoPrev+"-01-01").lte("data",_annoPrev+"-12-31")
        .order("numero",{ascending:false}).limit(1);
      if(eP){_libera();toast("Numero non assegnato: "+eP.message);return;}
      const nMax=(maxP&&maxP[0]&&+maxP[0].numero)||0;
      if(nMax+1>numero)numero=nMax+1;
    }catch(e){_libera();toast("Numero non assegnato: riprova");return;}

    const {data:np,error}=await sb.from("gest_preventivi").insert({
      user_id:sbUid, mestiere_id:curMestiere(),
      titolo:c.titolo||"Preventivo da computo",
      cliente_id:c.cliente_id||null,
      data:todayStr(), stato:"bozza", numero:numero,
      note:[c.oggetto?("Oggetto: "+c.oggetto):"", c.luogo?("Luogo: "+c.luogo):"",
            c.prezzario?("Prezzi da "+c.prezzario+(c.prezzario_anno?" "+c.prezzario_anno:"")):"",
            "Da "+_cm('uno')+(c.numero?" n. "+c.numero:"")].filter(Boolean).join("\n")||null
    }).select().single();
    if(error){_libera();toast("Errore: "+error.message);return;}

    const {error:e2,persi:persiSez}=await _scriviRighePrev(righe.map(r=>({...r,preventivo_id:np.id})));
    if(e2){_libera();toast("Il preventivo è nato ma le voci no: "+e2.message);return;}

    /* il collegamento serve a non rifarlo due volte per sbaglio */
    await sb.from("gest_computi").update({preventivo_id:np.id}).eq("id",id).eq("user_id",sbUid);

    /* andata bene. Il collegamento si segna SUBITO anche nella copia che il
       gestionale ha in mano: rinfresca() non e' asincrona e non aspetta la
       rilettura, quindi senza questa riga un secondo clic poco dopo
       ritroverebbe il computo ancora «senza preventivo» e ne farebbe un
       altro in silenzio. Cosi' invece chiede conferma, com'e' giusto. */
    c.preventivo_id=np.id;
    closeSheet();
    rinfresca("preventivi","computi","riepilogo");
    _libera();
    toast(persiSez
      ? ("Preventivo n. "+numero+" creato dal computo ✔ — ma "+AVVISO_SEZIONI)
      : ("Preventivo n. "+numero+" creato dal computo ✔ Lo trovi in Preventivi"));
  }
