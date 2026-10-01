// [SPOSTATO] gest-cestino.js: era dentro gest-core.js, righe 10133-11291, spostato identico.
  /* ===== 9 agosto 2026 — LA SEZIONE CESTINO =====
     Il motore (js/cestino.js) fa sparire le righe eliminate da tutto il
     gestionale. Qui si vedono e si rimettono a posto.
     Si legge con sb.raw(), la porta di servizio che salta il filtro. */
  const CEST_COSE=[
    {t:"gest_lavori",      lab:"Pratiche e lavori", labImp:"Lavori",        campo:"descrizione", ic:"🧰"},
    {t:"gest_clienti",     lab:"Clienti",           campo:"nome",           ic:"👤"},
    {t:"gest_preventivi",  lab:"Preventivi",        campo:"titolo",         ic:"📄"},
    {t:"gest_fatture",     lab:"Fatture",           campo:"numero",         ic:"🧾"},
    {t:"gest_scadenze",    lab:"Scadenze",          campo:"titolo",         ic:"⏰", foglia:true},
    {t:"gest_mestieri",    lab:"Reparti",           campo:"nome",           ic:"🗂"},
    {t:"gest_mezzi",       lab:"Mezzi e strumenti", campo:"nome",           ic:"🚚"},
    {t:"gest_operatori",   lab:"Persone",           campo:"nome",           ic:"👷"},
    {t:"gest_carte",       lab:"Carte aziendali",   campo:"nome",           ic:"💳"},
    {t:"gest_fornitori",   lab:"Fornitori",         campo:"nome",           ic:"🏪"},
    {t:"gest_fatture_fornitori", lab:"Fatture fornitori", campo:"numero",   ic:"🧾", foglia:true},
    {t:"gest_spese",       lab:"Spese",             campo:"descrizione",    ic:"💶", foglia:true},
    {t:"gest_ore",         lab:"Ore lavorate",      campo:"nota",           ic:"⏱", foglia:true},
    /* 15 agosto 2026 — il rapportino di cantiere.
       ⚠️ "campo" non basta e per questo c'e' "nome": un rapportino non ha ne'
       nome ne' titolo ne' descrizione, e il ripiego del Cestino avrebbe
       scritto «del 14/08/2026» e basta. Con dieci rapportini dentro sarebbero
       dieci righe quasi uguali e nessuno saprebbe cosa sta rimettendo a posto.
       Il nome del lavoro lo va a prendere cestNomiLavori(), qui sotto.
       NIENTE "foglia": sotto al rapportino ci sono le ore, quindi "Elimina per
       sempre" deve passare dalla funzione del database che guarda la catena. */
    {t:"gest_rapportini",  lab:"Rapportini di cantiere", campo:"materiali", ic:"📋",
     nome:function(r){
       const q=CEST_LAV[String(r.lavoro_id||"")];
       return "Rapportino del "+fdate(r.data)+(q?(" — "+q):"");
     }},
    /* 14 settembre 2026 — i promemoria. Senza questa riga, buttarne uno lo
       faceva sparire e basta: la riga restava nel database con eliminato_il
       scritto, ma nel Cestino non la vedeva nessuno e non si poteva rimettere
       a posto. ⚠️ `promemoria` non ha mestiere_id: il Cestino se ne accorge da
       solo dall'errore del database e la mostra senza filtro di reparto. */
    {t:"promemoria",       lab:"Promemoria",        campo:"testo",          ic:"🔔", foglia:true},
    {t:"gest_crediti",     lab:"Crediti formativi", campo:"titolo",         ic:"🎓", foglia:true},
    /* ⚠️ 20 agosto 2026 — «get lab», non «lab». Questa lista e' un const e si
       costruisce all'AVVIO, quando il ruolo dell'utente non si sa ancora:
       scritta come lab:_cm('nome') restava congelata sulla parola sbagliata
       per sempre. Col getter la parola si chiede quando si disegna. */
    {t:"gest_computi",     get lab(){return _cm('nome');}, campo:"titolo",   ic:"📐"},
    /* Il SAL non ha ne' nome ne' titolo: senza "nome" il Cestino scriverebbe
       dieci righe uguali e non si saprebbe quale si sta rimettendo a posto.
       NIENTE "foglia": sotto al SAL ci sono le sue righe. */
    {t:"gest_sal",         lab:"Stati di avanzamento", campo:"numero",       ic:"📈",
     nome:function(r){ return "SAL n. "+(r.numero||"?")+" del "+fdate(r.data); }},
    {t:"gest_prezzi_propri", lab:"Voci del tuo elenco prezzi", campo:"descrizione", ic:"🏷", foglia:true},
    {t:"gest_foto",        lab:"Foto e documenti",  campo:"nome_file",      ic:"📷", foglia:true},
    {t:"gest_video",       lab:"Video",             campo:"nome_file",      ic:"🎬", foglia:true}
    /* gest_note NON c'e': e' stata tolta dal cestino il 9/8/2026 (vedi
       js/cestino.js). Lasciarla qui voleva dire una richiesta in piu' a ogni
       apertura, per una categoria che non si riempie mai. */
  ];
  /* "foglia" = non ha figli nel database, quindi si può cancellare davvero
     senza portarsi dietro altro. Le altre NO: eliminare per sempre un reparto
     o un cliente farebbe scattare le cancellazioni a catena e si porterebbe
     via anche roba viva che nel cestino non c'era mai entrata. */

  /* 12 agosto 2026 — il Prezzario prometteva "va nel cestino" senza mai
     controllare che il cestino fosse acceso. Se non lo e' (migrazione non
     eseguita), la voce spariva per sempre mentre il messaggio diceva il
     contrario. Una funzione sola, usata da tutti i messaggi che parlano di
     cestino, cosi' non se ne puo' dimenticare uno. */
  function _cestOn(){ return !!(window.cestinoAttivo&&window.cestinoAttivo()); }
  function fraseCestino(){
    return _cestOn()
      ? "Va nel cestino: se sbagli la rimetti a posto da lì."
      : "ATTENZIONE: il cestino non è attivo, quindi sparisce per sempre e non si può tornare indietro.";
  }

  /* ============================================================
     12 agosto 2026 — CHI STA DENTRO A CHI

     Il ripristino toccava UNA riga sola. Ma ci sono due punti del gestionale
     che mettono via padre e figli insieme:
       - "elimina reparto"   -> il reparto E tutti i suoi lavori
       - "elimina fornitore" -> il fornitore E tutte le sue fatture
     Rimettendo a posto il padre tornava su solo lui, e i figli restavano nel
     cestino uno per uno, da ripescare a mano. Nel frattempo i conti erano
     sbagliati.

     CEST_FIGLI dice cosa tirare su insieme al padre.
     CEST_PADRE serve al contrario: se rimetti a posto un lavoro ma il suo
     reparto e' ancora nel cestino, il lavoro torna e NON si vede da nessuna
     parte, perche' il gestionale mostra solo la roba dei reparti vivi.
     ============================================================ */
  const CEST_FIGLI={
    /* 12 agosto 2026 (sera) — qui c'era solo gest_lavori, perche' "elimina
       reparto" metteva via solo quelli. Adesso mette via tutte e 11 le tabelle
       del reparto, quindi il ripristino le deve tirare su tutte: se no il
       reparto tornava su VUOTO e clienti, fatture e persone restavano nel
       cestino uno per uno, da ripescare a mano.
       L'elenco e' lo stesso di REPARTO_CONTENUTO, scritto in un posto solo,
       cosi' cancellazione e ripristino non possono piu' scollarsi. */
    gest_mestieri : REPARTO_CONTENUTO.map(function(v){return [v[0],"mestiere_id",v[1],v[2]];}),
    gest_fornitori:[["gest_fatture_fornitori","fornitore_id","fattura","fatture"]],
    /* 15 agosto 2026 — le ore del rapportino tornano su con lui.
       Se ne vanno insieme (gest_rapportino_cestina le mette via nello stesso
       istante), quindi devono anche tornare insieme: rimettere a posto il
       rapportino e lasciare le ore nel Cestino vorrebbe dire un margine che
       resta sbagliato dopo che l'utente ha gia' rimediato all'errore. */
    gest_rapportini:[["gest_ore","rapportino_id","ora lavorata","ore lavorate"]],
    /* 14 agosto 2026 — le scadenze del mezzo (revisione, assicurazione,
       bollo) vanno via con lui e tornano su con lui. Prima restavano vive
       ad avvisare per un furgone gia' venduto. */
    gest_mezzi    :[["gest_scadenze","mezzo_id","scadenza","scadenze"]]
  };
  const CEST_PADRE={
    gest_lavori           :["gest_mestieri","mestiere_id","reparto"],
    gest_clienti          :["gest_mestieri","mestiere_id","reparto"],
    gest_preventivi       :["gest_mestieri","mestiere_id","reparto"],
    gest_fatture          :["gest_mestieri","mestiere_id","reparto"],
    gest_mezzi            :["gest_mestieri","mestiere_id","reparto"],
    gest_operatori        :["gest_mestieri","mestiere_id","reparto"],
    gest_carte            :["gest_mestieri","mestiere_id","reparto"],
    gest_scadenze         :["gest_mestieri","mestiere_id","reparto"],
    gest_computi          :["gest_mestieri","mestiere_id","reparto"],
    gest_fornitori        :["gest_mestieri","mestiere_id","reparto"],
    gest_rapportini       :["gest_mestieri","mestiere_id","reparto"],
    gest_fatture_fornitori:["gest_fornitori","fornitore_id","fornitore"]
  };
  /* Quanto largo e' "nello stesso momento". I figli vengono messi via qualche
     istante PRIMA del padre, ma con la rete lenta puo' passare piu' tempo: due
     minuti stanno larghi senza rischiare niente. Il vincolo vero e' l'altro,
     cioe' che il figlio punti proprio a quel padre: serve a non far resuscitare
     un lavoro che era stato buttato via il mese scorso di proposito.
     E comunque, nel dubbio, qui si sbaglia dalla parte giusta: al massimo torna
     su una cosa in piu', che si puo' rieliminare. */
  const CEST_FINESTRA=120000;

  let cestCache=[], cestQ="", cestTotale=null;
  /* 12 agosto 2026 (sera) — IL CESTINO NON GUARDAVA IL REPARTO.
     Chiedeva tutto quello che e' eliminato per QUESTO ACCOUNT, senza badare a
     dove stava: se hai due reparti — poniamo "Edilizia" e "Impianti" — dentro
     "Edilizia" ti trovavi i clienti e le fatture eliminate di "Impianti", con
     lo stesso nome delle tue, e potevi rimetterle a posto o cancellarle per
     sempre senza accorgerti che erano di un altro pannello.
     Adesso si parte da questo reparto e c'e' la vista "Tutti i reparti" per
     vedere il resto: niente diventa irraggiungibile, ma non si mescola piu'. */
  let cestVista="reparto";
  let cestQui=null;                /* quante ce ne sono in QUESTO reparto */
  const CEST_MAX=200;   /* quante se ne mostrano per tipo */

  /* ============================================================
     15 agosto 2026 — DI CHE LAVORO ERA?

     Un rapportino non ha un nome: ha una data e il lavoro a cui appartiene.
     Nel Cestino «del 14/08/2026» ripetuto dieci volte non dice niente, e chi
     preme "Rimetti a posto" non sa cosa sta ripescando.
     Qui si vanno a prendere i nomi dei lavori, UNA volta sola per apertura del
     Cestino, e solo se ci sono davvero righe che ne hanno bisogno.

     sb.raw e non sb.from: il lavoro puo' essere finito nel Cestino anche lui
     (per esempio eliminando tutto il reparto). Con sb.from tornerebbe niente,
     e la riga tornerebbe a dire solo la data proprio nel caso in cui serve di
     piu' capire cosa si sta rimettendo a posto.
     ============================================================ */
  let CEST_LAV={};
  async function cestNomiLavori(risposte){
    CEST_LAV={};
    const ids={};
    (risposte||[]).forEach(function(x){
      if(x.c.t!=="gest_rapportini")return;
      (x.righe||[]).forEach(function(r){ if(r.lavoro_id)ids[String(r.lavoro_id)]=true; });
    });
    const elenco=Object.keys(ids);
    if(!elenco.length||!sb||!sbUid)return;
    try{
      const {data,error}=await sb.raw("gest_lavori")
        .select("id,descrizione").eq("user_id",sbUid).in("id",elenco);
      /* se la lettura non riesce non si inventa niente: la riga dira' solo la
         data, che e' meno ma e' vero */
      if(error||!data)return;
      data.forEach(function(l){
        const d=String(l.descrizione||"").trim();
        if(d)CEST_LAV[String(l.id)]=d.slice(0,45);
      });
    }catch(e){}
  }

  /* ⛔ 19 settembre 2026 — LA TRACCIA DI UN'ELIMINAZIONE FERMATA A META'.
     Se ne occupano insieme il pannello qui sotto e la fascia rossa in cima
     al Cestino: l'elenco si scrive una volta e resta li' finche' non e'
     stato sistemato davvero. Non si cancella da solo dopo tot giorni: e'
     roba persa o da rimettere a posto, e sparisce solo quando lo dice lui. */
  const CEST_GUASTO="gest_cestino_guasto";
  function cestGuastoSalva(testo){
    try{ localStorage.setItem(CEST_GUASTO,
      JSON.stringify({quando:Date.now(),testo:String(testo||"")})); }catch(e){}
  }
  function cestGuastoLeggi(){
    try{ const v=JSON.parse(localStorage.getItem(CEST_GUASTO)||"null");
         return (v&&v.testo)?v:null; }catch(e){ return null; }
  }
  function cestGuastoHTML(){
    const g=cestGuastoLeggi(); if(!g) return "";
    let quando="";
    try{ quando=new Date(g.quando||Date.now()).toLocaleDateString("it-IT"); }catch(e){}
    return '<div class="cest-testa" style="border-left:4px solid var(--err);background:var(--err-bg)">'
      + '<div><b>Un\u2019eliminazione si è fermata a metà</b>'
      +   (quando?' <small>— '+esc(quando)+'</small>':'')+'</div>'
      + '<div class="cest-nota" style="white-space:pre-wrap">'+esc(g.testo)+'</div>'
      + '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'
      +   '<button type="button" class="btn" data-action="cest-guasto-copia">Copia l\u2019elenco</button>'
      +   '<button type="button" class="btn b-cancel" data-action="cest-guasto-via">L\u2019ho sistemato, togli l\u2019avviso</button>'
      + '</div></div>';
  }
  function cestGuastoPannello(testo){
    openSheetGrande("L\u2019eliminazione si è fermata a metà",
        '<div class="sh-b"><div class="sh-nota" style="white-space:pre-wrap">'+esc(testo)+'</div></div>'
      + '<div class="sh-b"><div class="sh-tit">Questo elenco non lo perdi</div>'
      +   '<div class="sh-nota">Resta scritto in cima al <b>Cestino</b> finché non premi '
      +   '«L\u2019ho sistemato». Qui sotto puoi anche copiartelo.</div>'
      +   '<button type="button" class="btn btn-primary" data-action="cest-guasto-copia" '
      +     'style="margin-top:9px">Copia l\u2019elenco</button></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
  }

  async function renderCestino(soloDisegno){
    const box=$("#cest-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML="";return;}
    /* 12 agosto 2026 — tre stati, non piu' due. Nei primi secondi il cestino
       sta ancora facendo la sua prova di accensione: prima qui compariva
       "Il cestino non è ancora acceso", che è una bugia e spaventa. */
    const cst=(window.cestinoStato&&window.cestinoStato())||null;
    if(cst&&cst.attesa>0){
      $("#cest-riass").innerHTML=cestGuastoHTML();
      box.innerHTML=tabVuoto("Sto controllando il cestino",
        "Ci vuole un attimo. Finché non ho una risposta chiara dal database non lascio eliminare niente, così non si perde nulla per colpa della connessione. Riprova fra qualche secondo.",
        _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>');
      return;
    }
    if(!(window.cestinoAttivo&&window.cestinoAttivo())){
      $("#cest-riass").innerHTML=cestGuastoHTML();
      box.innerHTML=tabVuoto("Il cestino non è ancora acceso",
        "Esegui sql/gest-cestino.sql su Supabase (SQL Editor → Run) e ricarica la pagina. Da quel momento tutto quello che elimini finisce qui e si può rimettere a posto.",
        _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>');
      return;
    }
    if(cst&&cst.motivo==="migrazione-parziale"){
      /* la migrazione e' passata a meta': su alcune tabelle l'eliminazione e'
         bloccata, e l'utente deve sapere perche' invece di pensare a un guasto */
      $("#cest-riass").innerHTML=cestGuastoHTML()+'<div class="cest-testa"><div><b>Manca un pezzo di migrazione</b></div>'
        +'<div class="cest-nota">Su alcune parti del gestionale il cestino non è installato, quindi lì l\'eliminazione è bloccata per non perdere niente. '
        +'Esegui sql/gest-cestino.sql su Supabase e ricarica la pagina. Il dettaglio è in F12 → Console, riga [cestino].</div></div>';
    }
    /* soloDisegno = la ricerca: filtra quello che c'e' gia' in memoria, senza
       ridomandare niente al database. Cosi' puo' girare a ogni lettera. */
    if(!soloDisegno){
    /* si chiede a tutte le tabelle insieme: sono piccole richieste in parallelo.
       count:"exact" costa niente in piu' e serve a dire QUANTE ce ne sono
       davvero: prima si mostravano le prime 200 per tipo e le altre sparivano
       senza che nessuno lo dicesse. */
    const _mid=curMestiere();
    /* «gest_mestieri» non si filtra mai per reparto: un reparto eliminato non
       sta dentro nessun reparto, e filtrandolo non lo si potrebbe piu'
       rimettere a posto. Le tabelle che il reparto non ce l'hanno proprio
       (elenco prezzi, crediti formativi: sono della PERSONA, non del pannello)
       si riconoscono dall'errore del database e si mostrano sempre. */
    async function cestChiedi(c){
      const q=function(conReparto){
        let b=sb.raw(c.t).select("*",{count:"exact"}).eq("user_id",sbUid)
          .not("eliminato_il","is",null);
        if(conReparto)b=b.eq("mestiere_id",_mid);
        return b.order("eliminato_il",{ascending:false}).limit(CEST_MAX);
      };
      const filtra=(cestVista!=="tutti")&&!!_mid&&c.t!=="gest_mestieri";
      let r=null;
      try{ r=await q(filtra); }catch(e){ r=null; }
      if(filtra&&r&&r.error&&/mestiere_id|42703|column/i.test((r.error.message||"")+(r.error.code||""))){
        try{ r=await q(false); }catch(e){ r=null; }
      }
      const righe=(r&&!r.error&&r.data)||[];
      /* ko: questa tabella non ha risposto. "Non lo so" non e' "zero" — vedi
         sotto, dove decide se il pallino si puo' scrivere. */
      return {c:c, righe:righe, ko:!!(!r||r.error),
              n:(r&&!r.error&&typeof r.count==="number")?r.count:righe.length};
    }
    const risposte=await Promise.all(CEST_COSE.map(cestChiedi));
    cestQui=risposte.reduce((s,x)=>s+(x.n||0),0);
    /* il pallino del menu conta TUTTO il cestino, non solo questo reparto:
       e' un "hai roba buttata via", non un conteggio di sezione. Quindi si
       aggiorna solo quando si sta guardando davvero tutto. */
    /* 13 agosto 2026 — la stessa guardia che sta in contaCestinoUnaVolta.
       Senza, una tabella che non rispondeva valeva zero, il totale finiva nel
       pallino sottostimato e cestContato=true lo bloccava li' per tutta la
       sessione: il menu diceva 10 con 12 cose nel Cestino, cioe' MENO del vero,
       che e' il verso sbagliato in cui sbagliare. */
    const _incerto=risposte.some(x=>x.ko);
    if(cestVista==="tutti"&&!_incerto){
      cestTotale=cestQui;
      cestContato=true;
      setCnt("#cnt-cestino",cestTotale,"attesa");
    }else if(cestVista==="tutti"){
      cestContato=false;                        /* si riprova al giro dopo */
    }else if(cestTotale!=null&&cestTotale<cestQui){
      cestTotale=cestQui;                       /* non puo' essercene meno del pezzo */
      setCnt("#cnt-cestino",cestTotale,"attesa");
    }
    /* 15 agosto 2026 — i nomi dei lavori, per le righe che da sole non
       direbbero niente (oggi: i rapportini). Si chiede sb.raw perche' il
       lavoro puo' essere nel Cestino anche lui: con sb.from tornerebbe vuoto
       e la riga direbbe solo la data.
       Una domanda sola, e solo se davvero c'e' qualcosa da nominare. */
    await cestNomiLavori(risposte);
    cestCache=[];
    risposte.forEach(function(x){
      x.righe.forEach(function(r){
        /* il nome si cerca su più colonne: non tutte le tabelle hanno lo
           stesso campo, e "(senza nome)" ovunque renderebbe il cestino inutile.
           Se la tabella ha una sua regola ("nome" in CEST_COSE) vince quella:
           certe righe non hanno nessuna colonna che le descriva. */
        const nome=(x.c.nome?String(x.c.nome(r)||"").trim():"")
          || [r[x.c.campo],r.nome,r.titolo,r.descrizione,r.nome_file,r.causale,r.testo,r.numero]
          .map(v=>String(v==null?"":v).trim()).find(v=>v!=="")
          || (r.data?("del "+fdate(r.data)):"")
          || "(senza nome)";
        /* chi e' il "padre" di questa riga, se ce l'ha: serve al ripristino */
        const _p=CEST_PADRE[x.c.t];
        cestCache.push({tab:x.c.t, ic:x.c.ic, foglia:!!x.c.foglia,
          tipo:(ruoloUtente!=='professionista'&&x.c.labImp)?(x.c.t==='gest_lavori'?_lav():x.c.labImp):x.c.lab,
          nome:nome.slice(0,80),
          quando:r.eliminato_il, id:r.id, path:r.storage_path||null,
          padre:(_p&&r[_p[1]])?{tab:_p[0], col:_p[1], id:r[_p[1]], lab:_p[2]}:null});
      });
    });
    cestCache.sort((a,b)=>String(b.quando||"").localeCompare(String(a.quando||"")));
    }

    /* la ricerca: cerca nel nome e nel tipo. Le posizioni restano quelle di
       cestCache, se no "Rimetti a posto" ripescherebbe la riga sbagliata. */
    const q=(cestQ||"").trim().toLowerCase();
    const vis=cestCache.map((x,i)=>({x:x,i:i}))
      .filter(v=>!q||(v.x.nome+" "+v.x.tipo).toLowerCase().includes(q));

    const totVero=(cestQui==null?cestCache.length:cestQui);
    const nascoste=Math.max(0,totVero-cestCache.length);
    /* quante ce ne sono negli ALTRI reparti: si dice, se no uno crede che il
       cestino sia vuoto e invece sta solo guardando un pannello */
    const altrove=(cestVista!=="tutti"&&cestTotale!=null)?Math.max(0,cestTotale-totVero):0;
    if($("#cest-riass"))$("#cest-riass").innerHTML=cestGuastoHTML()+((totVero||q||altrove)
      ? '<div class="cest-testa"><div><b>'+totVero+'</b> '
        +(totVero===1?'cosa eliminata':'cose eliminate')
        +(cestVista!=="tutti"?' in questo reparto':'')
        +(nascoste?(' <small>— ne mostro '+cestCache.length+', le più recenti</small>'):'')
        +(q?(' <small>· trovate '+vis.length+' con «'+esc(cestQ)+'»</small>'):'')
        +'</div><div class="cest-nota">Restano qui finché non le rimetti a posto, e non si vedono da nessun\'altra parte del gestionale. '
        +'Foto, video e documenti però continuano a occupare spazio finché non li elimini per sempre.'
        +(altrove?(' <b>Altre '+altrove+' stanno in altri reparti:</b> per vederle scegli «Tutti i reparti» qui sopra.'):'')
        +'</div></div>'
      : "");

    renderTabella({
      id:"cest", box:"#cest-list",
      viste:"#cest-viste",
      visteDef:[{k:"reparto",lab:"Questo reparto"},{k:"tutti",lab:"Tutti i reparti"}],
      vista:cestVista, conta:{}, azioneVista:"cest-vista",
      vuoto:q
        ? tabVuoto("Nessuna corrispondenza",
            "Nel cestino non c'è niente che si chiami «"+esc(cestQ)+"». Svuota la casella per rivedere tutto.",
            _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
            {t:"Mostra tutto",a:"cerca-azzera"})
        : (altrove
          ? tabVuoto("In questo reparto non hai eliminato niente",
              "Ci sono però "+altrove+" cose eliminate in altri reparti: scegli «Tutti i reparti» qui sopra per vederle.",
              _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>')
          : tabVuoto("Il cestino è vuoto",
            "Qui finisce tutto quello che elimini dal gestionale. Finché è qui non è perso: si rimette a posto con un clic.",
            _SVGV+'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>')),
      colonne:[{lab:"Che cos'era",w:"42%"},{lab:"Tipo",w:"26%",cls:"c-chi"},{lab:"Eliminato",w:"32%"}],
      righe:vis.map(function(v){
        const x=v.x, i=v.i;
        const q=quando(String(x.quando||"").slice(0,10),{neutro:true});
        return {
          id:String(i),
          click:{action:"cest-ripristina",data:{id:String(i)}},
          celle:[
            '<span class="lav-bar in_corso"></span><span class="c-nome">'+x.ic+' '+esc(x.nome)+'</span>',
            esc(x.tipo),
            {h:q.testo,cls:q.classe}
          ],
          menu:[{lab:"↩ Rimetti a posto",action:"cest-ripristina",data:{id:String(i)}}]
            .concat([{lab:"🗑 Elimina per sempre",action:"cest-definitivo",data:{id:String(i)},del:true}])
        };
      }),
      cards:()=>vis.map(function(v){
        const x=v.x, i=v.i;
        return schedaJob({
          tono:"t-neutro", titolo:x.ic+" "+esc(x.nome),
          destra:'<span class="stato" style="background:var(--sfondo);color:var(--testo-2)">'+esc(x.tipo)+'</span>',
          meta:["🗑 eliminato "+quando(String(x.quando||"").slice(0,10),{neutro:true}).testo],
          azioni:[{lab:"↩ Rimetti a posto",action:"cest-ripristina",data:{id:String(i)}}]
            .concat([{lab:"🗑 Elimina per sempre",action:"cest-definitivo",data:{id:String(i)},del:true}])
        });
      }).join("")
    });
  }

  /* rimette a posto UNA riga */
  function cestRiga(tab,id){
    return sb.raw(tab).update({eliminato_il:null}).eq("id",id).eq("user_id",sbUid).select("id");
  }
  /* rimette a posto i figli buttati via nello stesso momento del padre.
     Torna quanti ne ha tirati su. Non fa rumore se qualcosa va storto: il
     padre e' gia' tornato, e un figlio in meno si ripesca a mano. */
  async function cestFigli(tab,id,quando){
    const regole=CEST_FIGLI[tab];
    if(!regole||!quando)return 0;
    const t=new Date(quando).getTime();
    if(!isFinite(t))return 0;
    const da=new Date(t-CEST_FINESTRA).toISOString(), a=new Date(t+CEST_FINESTRA).toISOString();
    let n=0;
    for(const r of regole){
      try{
        const {data}=await sb.raw(r[0]).update({eliminato_il:null})
          .eq("user_id",sbUid).eq(r[1],id)
          .gte("eliminato_il",da).lte("eliminato_il",a)
          .select("id");
        n+=(data||[]).length;
      }catch(e){}
    }
    return n;
  }
  async function cestRipristina(i){
    const x=cestCache[+i];if(!x)return;
    if(!sbUid){toast("Devi essere loggato");return;}

    /* Il padre e' ancora nel cestino? Allora rimettere a posto solo questo non
       serve a niente: torna su ma non si vede da nessuna parte, perche' il
       gestionale mostra solo la roba dei reparti (e dei fornitori) vivi. */
    let padreDaTirareSu=null;
    if(x.padre&&x.padre.id){
      try{
        const {data:pd}=await sb.raw(x.padre.tab).select("id,nome,eliminato_il")
          .eq("id",x.padre.id).eq("user_id",sbUid).limit(1);
        const p=(pd||[])[0];
        if(p&&p.eliminato_il){
          const q=p.nome?(" «"+p.nome+"»"):"";
          if(gconfirm("Questa cosa sta dentro il "+x.padre.lab+q+", che è ancora nel cestino.\n\n"
            +"Se rimetto a posto solo questa, non la vedrai da nessuna parte.\n\n"
            +"Rimetto a posto anche il "+x.padre.lab+"?")) padreDaTirareSu=p;
        }
      }catch(e){}
    }

    let extra=0;
    if(padreDaTirareSu){
      /* la data si legge PRIMA di rimettere a posto il padre: e' quella che dice
         "questi figli sono stati buttati via insieme a lui". Leggendola dopo,
         il padre e' gia' tornato su e la data non c'e' piu': i figli
         resterebbero tutti nel cestino, da ripescare a mano uno per uno. */
      const quandoPadre=padreDaTirareSu.eliminato_il;
      const rp=await cestRiga(x.padre.tab,padreDaTirareSu.id);
      if(rp&&rp.error){toast("Errore: "+rp.error.message);return;}
      extra+=1+await cestFigli(x.padre.tab,padreDaTirareSu.id,quandoPadre);
    }

    const {data,error}=await cestRiga(x.tab,x.id);
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non ripristinato: nessuna riga trovata");return;}
    extra+=await cestFigli(x.tab,x.id,x.quando);

    /* ⚠️ RIMETTERE A POSTO UNA PERSONA NON LE RIDAVA IL TELEFONO — 14/8/2026.
       Eliminando una persona il gestionale le toglie l'accesso
       (gest_membri.stato = 'revocato'): giusto, se no continuerebbe a entrare
       da un elenco dove non compare più.
       Ma «Rimetti a posto» rimetteva solo eliminato_il a null. Lo stato
       restava 'revocato': la persona tornava in elenco, sembrava tutto a
       posto, e la mattina dopo dal telefono non entrava. Il messaggio diceva
       «Rimesso a posto ✔» e basta.
       Riprodotto: nessuna scrittura su gest_membri, nessun avviso.
       L'accesso NON si riaccende da soli — chi è stato eliminato può non
       doverci più entrare — ma adesso si dice, con scritto cosa fare. */
    let _avvisoAccesso="";
    if(x.tab==="gest_operatori"){
      try{
        const rm=await sb.from("gest_membri").select("stato")
          .eq("operatore_id",x.id).eq("impresa_id",sbUid).maybeSingle();
        const st=rm&&rm.data&&rm.data.stato;
        if(st==="revocato"){
          _avvisoAccesso=" — ma dal telefono NON entra: quando l'hai eliminata "
            +"le è stato tolto l'accesso. Apri la sua scheda e rimandale il link d'invito.";
        }
      }catch(e){}
    }

    /* rimesso a posto un reparto o una pratica cambia mezzo gestionale:
       si ridisegna tutto invece di indovinare cosa è cambiato */
    _cestRicontaPallino();
    renderCestino();
    rinfresca("riepilogo","lavori","clienti","preventivi","fatture","scadenzario","mezzi","squadra","fornitori","galleria","report","carte","crediti","calendario");
    if(x.tab==="gest_mestieri"||(padreDaTirareSu&&x.padre.tab==="gest_mestieri"))renderLanding();
    toast((!extra?"Rimesso a posto ✔"
      :extra===1?"Rimesso a posto ✔ — e con lui anche 1 cosa che ci stava dentro"
      :"Rimesso a posto ✔ — e con lui anche altre "+extra+" cose che ci stavano dentro")
      +_avvisoAccesso);
  }

  /* ===== 9 agosto 2026 — ELIMINA PER SEMPRE, VERSIONE SICURA =====
     Prima il pulsante c'era solo sulle cose senza figli, perche' cancellare
     davvero una pratica o un reparto fa scattare le cancellazioni a catena del
     database e si porta via anche roba VIVA, mai finita nel cestino.
     Adesso c'e' su tutto, ma non decide il gestionale: decide Postgres.
     La funzione gest_cestino_elimina (sql/gest-cestino-elimina.sql) legge dal
     catalogo del database chi dipende da chi — quindi non le sfugge nemmeno una
     tabella aggiunta domani — scende lungo tutta la catena e si RIFIUTA di
     cancellare se trova anche una sola riga non ancora nel cestino.
     Il controllo lo rifa' anche al momento della conferma: fra l'anteprima e
     l'ok l'utente potrebbe aver ripristinato qualcosa in un'altra scheda. */
  const CEST_NOMI={
    gest_lavori:"pratiche/lavori", gest_clienti:"clienti", gest_preventivi:"preventivi",
    gest_fatture:"fatture", gest_scadenze:"scadenze", gest_mestieri:"reparti",
    gest_mezzi:"mezzi e strumenti", gest_operatori:"persone", gest_carte:"carte aziendali",
    gest_fornitori:"fornitori", gest_fatture_fornitori:"fatture fornitori",
    gest_spese:"spese", gest_ore:"ore lavorate", gest_crediti:"crediti formativi",
    gest_computi:"computi", gest_computo_capitoli:"capitoli del computo",
    gest_computo_voci:"voci del computo", gest_computo_misure:"misure del computo",
    gest_prezzi_propri:"voci del tuo elenco prezzi",
    gest_rapportini:"rapportini di cantiere",
    gest_foto:"foto e documenti", gest_video:"video", gest_note:"note",
    gest_fattura_righe:"righe della fattura", gest_preventivo_righe:"righe del preventivo",
    gest_fattura_lavori:"collegamenti fattura-lavoro", gest_lavoro_mezzi:"mezzi usati",
    gest_carte_movimenti:"movimenti della carta", gest_rifornimenti:"rifornimenti"
  };
  function cestElenco(v){
    return (v||[]).map(function(x){return "\u2022 "+x.n+" "+(CEST_NOMI[x.tabella]||x.tabella);}).join("\n");
  }

  async function cestDefinitivo(i){
    const x=cestCache[+i];if(!x)return;
    if(!sbUid){toast("Devi essere loggato");return;}

    /* primo giro: non cancella niente, chiede solo cosa succederebbe */
    const {data:prova,error:eProva}=await sb.rpc("gest_cestino_elimina",
      {p_tabella:x.tab,p_id:x.id,p_conferma:false});

    if(eProva||!prova){
      /* Si ripiega sulla vecchia strada SOLO se la funzione non esiste ancora
         (PGRST202 = "function not found"). Se invece il database ha risposto
         con un errore vero, ripiegare vorrebbe dire cancellare aggirando il
         controllo: meglio fermarsi e far vedere l'errore. */
      const m=(eProva&&(eProva.code||"")+" "+(eProva.message||""))||"";
      const nonEsiste=/PGRST202|Could not find the function|schema cache/i.test(m);
      if(!nonEsiste&&eProva){toast("Errore: "+(eProva.message||"il database non risponde"));return;}
      if(x.foglia)return cestDefinitivoFoglia(x);
      toast("Per eliminare per sempre questa scheda esegui sql/gest-cestino-elimina.sql su Supabase");
      return;
    }

    /* una fattura gia' emessa e' un documento fiscale: nel cestino ci resta,
       cancellata per sempre no. Il rifiuto arriva dal database.
       10 agosto 2026 \u2014 il rifiuto arriva anche quando la fattura non e' quella
       cliccata ma sta PIU' SOTTO nella catena (svuotando un reparto se ne
       andrebbe con lui). In quel caso "Questa e' la fattura numero 7" non si
       capisce: si dice quale scheda si stava svuotando e cosa c'e' dentro.
       Il campo "fiscali" (elenco) arriva dalla versione corretta della funzione;
       se il database ha ancora quella vecchia c'e' solo "fiscale" e si usa quello. */
    if(prova.ok===false && prova.fiscale){
      const _num=(prova.fiscali&&prova.fiscali.length?prova.fiscali:[prova.fiscale]);
      const _elenco=_num.map(function(n){return "n. "+n;}).join(", ");
      const _diretta=(x.tab==="gest_fatture");
      alert((_diretta
          ? "Questa \u00e8 la fattura "+_elenco+": \u00e8 un documento fiscale.\n\n"
          : "Dentro \u00ab"+x.nome+"\u00bb c'\u00e8 una fattura gi\u00e0 emessa ("+_elenco+"), "
            +"che \u00e8 un documento fiscale.\n\n")
        +"Pu\u00f2 restare nel cestino quanto vuoi, ma non la cancello per sempre: "
        +"resterebbe un buco nella numerazione senza pi\u00f9 il documento a spiegare cos'era, "
        +"e i buchi il commercialista li vede.\n\n"
        +"Se \u00e8 sbagliata, la strada giusta \u00e8 la nota di credito.");
      return;
    }
    if(prova.ok===false){
      alert("Non posso eliminare \u00ab"+x.nome+"\u00bb per sempre.\n\n"
        +"Ci sono ancora collegate delle cose che NON sono nel cestino:\n"
        +cestElenco(prova.vivi)
        +"\n\nSe la cancellassi adesso sparirebbero anche loro. Mettile prima nel cestino, poi riprova.");
      return;
    }

    const insieme=(prova.anteprima||[]).length
      ? "\n\nInsieme a lei se ne va (\u00e8 gi\u00e0 tutto nel cestino):\n"+cestElenco(prova.anteprima)
      : "";
    /* le righe che sopravvivono ma perdono il riferimento: non bloccano, ma
       l'utente deve saperlo prima, non scoprirlo dopo su una fattura senza cliente */
    const scoll=(prova.scollegate||[]).length
      ? "\n\nQueste restano ma perdono il collegamento:\n"+cestElenco(prova.scollegate)
      : "";
    if(!gconfirm("Eliminare \u00ab"+x.nome+"\u00bb per sempre?"+insieme+scoll
        +"\n\nQuesta volta sparisce davvero e non si recupera pi\u00f9."))return;

    const {data:fatto,error}=await sb.rpc("gest_cestino_elimina",
      {p_tabella:x.tab,p_id:x.id,p_conferma:true});
    if(error){toast("Errore: "+error.message);return;}
    if(!fatto||fatto.ok===false){
      toast("Non eliminato: nel frattempo qualcosa \u00e8 tornato attivo");
      _cestRicontaPallino();
      renderCestino();return;
    }
    await cestPulisciFile(x, fatto.file);
    _cestRicontaPallino();
    renderCestino();
    rinfresca("riepilogo","lavori","clienti","preventivi","fatture","scadenzario","mezzi","squadra","fornitori","galleria","report","carte","crediti","calendario");
    toast("Eliminato per sempre");
  }

  /* il file nello storage se ne va solo adesso, non prima: e' l'unico momento
     in cui siamo sicuri che nessuno lo vuole piu' indietro */
  async function cestPulisciFile(x, elenco){
    /* 9 agosto 2026 — prima si cancellava solo il file della riga cliccata.
       Eliminando un padre, le foto dei figli sparivano dal database ma i file
       restavano nel bucket per sempre, senza piu' nessuna riga che li nominasse:
       spazio occupato e foto di cantiere non piu' cancellabili da nessuna
       schermata. Adesso la funzione del database restituisce anche i percorsi. */
    const perBucket={};
    const metti=(tab,path)=>{
      if(!path)return;
      const b=(tab==="gest_video")?"gestionale-video":"gestionale-foto";
      (perBucket[b]=perBucket[b]||[]).push(path);
    };
    metti(x.tab,x.path);
    (elenco||[]).forEach(r=>metti(r.tabella,r.path));
    for(const b in perBucket){
      try{ await sb.storage.from(b).remove(perBucket[b]); }catch(e){}
    }
  }

  /* via di riserva: vale solo finche' non e' stato eseguito
     sql/gest-cestino-elimina.sql, e solo sulle cose senza figli */
  async function cestDefinitivoFoglia(x){
    if(!gconfirm("Eliminare \u00ab"+x.nome+"\u00bb per sempre?\n\nQuesta volta sparisce davvero e non si recupera pi\u00f9."))return;
    const {data,error}=await sb.raw(x.tab).delete().eq("id",x.id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga trovata");return;}
    await cestPulisciFile(x);
    _cestRicontaPallino();
    renderCestino();
    rinfresca("riepilogo","lavori","clienti","preventivi","fatture","scadenzario","mezzi","squadra","fornitori","galleria","report","carte","crediti","calendario");
    toast("Eliminato per sempre");
  }



  /* ---- REPORT & STATISTICHE ---- */

  async function saveComputo(id){
    if(!sbUid){toast("Devi essere loggato");return;}
    const titolo=($("#co-tit")&&$("#co-tit").value||"").trim();
    if(!titolo){toast("Scrivi almeno il titolo del computo");return;}
    /* rete di sicurezza: qualunque numero di questo modulo si legge con la
       regola italiana (12,5 = 12.5) e non finisce MAI nel database come NaN */
    const num=(x)=>{const v=String(($(x)&&$(x).value)||"").trim();
      if(v==="")return null;const n=_numeroIt(v);return (n==null||!isFinite(n))?null:n;};
    const txt=(x)=>{const v=String(($(x)&&$(x).value)||"").trim();return v===""?null:v;};
    /* ⚠️ LO SCONTO FUORI SCALA — 14 agosto 2026.
       Il campo accettava qualsiasi numero. Provato: 150 dava un totale di
       −500 € (i soldi glieli daresti tu al cliente), −10 faceva SALIRE il
       conto del 10% chiamandolo «ribasso». Nessun avviso, e sul PDF usciva
       stampato «Ribasso -10,00%».
       Qui si dice e si ferma, prima che finisca nel database. Nel conto c'e'
       anche il paracadute (compRiepilogoDa), per i numeri gia' scritti. */
    const _rib=num("#co-rib");
    if(_rib!=null&&(_rib<0||_rib>100)){
      toast(_rib<0
        ? "Il ribasso non può essere negativo: sarebbe un aumento, non uno sconto. Scrivi un numero fra 0 e 100."
        : "Il ribasso non può superare il 100%: il totale verrebbe negativo. Scrivi un numero fra 0 e 100.");
      const _e=$("#co-rib"); if(_e){_e.focus();_e.select&&_e.select();}
      return;
    }
    const row={
      user_id:sbUid, mestiere_id:curMestiere(),
      titolo:titolo,
      numero:txt("#co-num"),
      oggetto:txt("#co-ogg"),
      luogo:txt("#co-luogo"),
      data:($("#co-data")&&$("#co-data").value)||todayStr(),
      cliente_id:($("#co-cli")&&$("#co-cli").value)||null,
      lavoro_id:($("#co-lav")&&$("#co-lav").value)||null,
      tipo:segVal("co-tipo")||"privato",
      stato:segVal("co-stato")||"bozza",
      /* dalla tendina esce il nome esatto della tariffa; con «lo scrivo io»
         valgono i due campi di testo, come prima */
      prezzario:(function(){const e=$("#co-prz-sel");
        if(e&&e.value&&e.value!=="__mio__")return e.value;
        if(e&&e.value==="")return null;
        return txt("#co-prz");})(),
      /* l'anno vale SOLO con «lo scrivo io»: scegliendo una tariffa dalla
         tendina l'anno sta gia' nel suo nome, e con «non lo dico» non c'e'
         niente da datare. Senza questo, dicendo "non lo dico" restava
         appiccicato l'anno di prima. */
      prezzario_anno:(function(){const e=$("#co-prz-sel");
        if(e&&e.value!=="__mio__")return null;
        return num("#co-prz-anno");})(),
      ribasso_perc:_rib,
      note:txt("#co-note"),
      /* la data di partenza del cantiere: il resto del cronoprogramma
         (le durate) sta sui capitoli e si salva dalla pagina 6 */
      data_inizio:($("#co-inizio")?(($("#co-inizio").value||"")||null):undefined),
      /* il quadro economico si scrive ANCHE se adesso il computo è privato:
         chi passa da pubblico a privato per due minuti non deve ritrovarsi il
         lavoro di mezz'ora buttato via. È la stessa scelta degli oneri della
         sicurezza, che restano scritti nelle voci e semplicemente non contano. */
      quadro_economico:($("#co-qe-righe")?qeLetto():undefined)
    };
    if(row.quadro_economico===undefined)delete row.quadro_economico;
    if(row.data_inizio===undefined)delete row.data_inizio;
    let res;
    const _scrivi=async function(r){
      return id ? await sb.from("gest_computi").update(r).eq("id",id).eq("user_id",sbUid).select("id")
                : await sb.from("gest_computi").insert(r).select("id");
    };
    res=await _scrivi(row);
    /* ⚠️ la colonna può non esserci ancora (sql/gest-computo-quadro.sql): il
       computo si salva lo stesso, senza il quadro economico, e si dice. Senza
       questo ripiego un aggiornamento non eseguito bloccava il Salva di TUTTI
       i computi, anche di chi il quadro economico non lo usa. */
    let qePerso=false;
    if(res.error&&"quadro_economico" in row
       &&/quadro_economico/i.test(String(res.error.message||"")+" "+String(res.error.code||""))){
      const senza=Object.assign({},row); delete senza.quadro_economico;
      res=await _scrivi(senza);
      if(!res.error)qePerso=true;
    }
    /* ⚠️ stesso ripiego per la data di inizio del cronoprogramma
       (sql/gest-computo-cronoprogramma.sql): finche' quell'aggiornamento
       non e' stato eseguito, il computo si salva lo stesso. Senza questo,
       un solo file SQL non eseguito bloccherebbe il Salva di TUTTI i
       computi — anche di chi il cronoprogramma non lo usa. */
    let crPerso=false;
    if(res.error&&"data_inizio" in row
       &&/data_inizio/i.test(String(res.error.message||"")+" "+String(res.error.code||""))){
      const senza=Object.assign({},row); delete senza.data_inizio;
      res=await _scrivi(senza);
      if(!res.error)crPerso=true;
    }
    if(res.error){
      toast(_compManca(res.error)
        ? ("Prima serve l'aggiornamento del database: "+COMP_SQL_TESTO)
        : "Errore: "+res.error.message);
      return;
    }
    if(!res.data||!res.data.length){toast("Non salvato: nessuna riga scritta. Riprova.");return;}
    /* ⚠️ 20 agosto 2026 — DOPO «Crea computo» LA FINESTRA SI RIAPRE.
       Prima si chiudeva: restavi davanti all'elenco con una riga nuova e
       nessuna idea di cosa fare adesso. Il computo appena creato e' VUOTO —
       il passo successivo e' sempre lo stesso, mettergli dentro le
       lavorazioni — quindi ce lo si porta dentro noi, sulla pagina 1.
       Solo alla CREAZIONE (!id): su un Salva normale chiudere e' giusto. */
    if(!id&&!qePerso&&res.data[0]&&res.data[0].id){
      await renderComputi();
      rinfresca("riepilogo");
      const nuovo=(compCache||[]).find(x=>String(x.id)===String(res.data[0].id));
      if(nuovo){
        toast("Computo creato ✔ — adesso mettici le lavorazioni");
        await computoForm(nuovo);
        return;
      }
    }
    closeSheet();
    await renderComputi();
    rinfresca("riepilogo");
    toast(qePerso
      ? "Computo salvato, ma il quadro economico NO: manca l'aggiornamento del database (esegui sql/gest-computo-quadro.sql su Supabase)."
      : (crPerso
        ? "Computo salvato, ma la data di inizio NO: manca l'aggiornamento del database (esegui sql/gest-computo-cronoprogramma.sql su Supabase)."
        : (id?"Computo salvato ✔":"Computo creato ✔")));
  }

  /* ===== 11 agosto 2026 — DUPLICARE UN COMPUTO =====
     Due appartamenti uguali, la stessa palazzina con tre scale, lo stesso tipo
     di intervento su un altro edificio: senza questo si ribatte tutto da capo,
     capitolo per capitolo, lavorazione per lavorazione, misura per misura. È
     la funzione che fa la differenza fra "carino" e "me lo tengo".

     COSA SI PORTA DIETRO
     - il computo: titolo con «(copia)», oggetto, luogo, prezzario, ribasso,
       tipo (privato/pubblico) e note
     - il CLIENTE sì, la PRATICA no. Due appartamenti dello stesso condominio
       hanno lo stesso cliente ma non lo stesso lavoro: agganciare due computi
       alla stessa pratica farebbe contare due volte nel Riepilogo.
     - tutti i capitoli, con numero, titolo e ordine
     - tutte le lavorazioni, riattaccate al capitolo GIUSTO della copia (non a
       quello dell'originale: è il punto dove è più facile sbagliare)
     - le misure solo se lo chiedi

     LA COPIA NASCE SEMPRE IN BOZZA e con la data di oggi, anche se
     l'originale era definitivo: una copia appena fatta non è un documento
     chiuso, e datarla come l'originale sarebbe una bugia sul foglio.

     SE QUALCOSA VA STORTO A METÀ, la copia mezza fatta si butta via da sola:
     restare con un computo con i capitoli e senza le lavorazioni sarebbe
     peggio che non averlo copiato. */
  /* ============================================================
     20 agosto 2026 — DUPLICA, E LA VARIANTE
     ============================================================
     Sono la stessa cosa con due differenze:

     - la COPIA e' un computo che non c'entra piu' niente con l'originale
       (il secondo appartamento uguale). Chiede se copiare le misure.
     - la VARIANTE si RICORDA da dove viene (variante_di) e ogni sua riga
       si ricorda da quale riga (origine_id): e' quello che le permette di
       dire cosa e' cambiato. Le misure si copiano SEMPRE, senza chiedere:
       una variante nasce dal lavoro vero, e partire dalle quantita' a zero
       vorrebbe dire riscriverle tutte per poterne cambiare due.
     ============================================================ */
  async function compDuplica(id,variante){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}

    /* quante misure ci sono davvero: se non ce n'è nessuna non ha senso
       chiedere se copiarle */
    const {data:vv,error:eV}=await sb.from("gest_computo_voci")
      .select("*").eq("computo_id",id).eq("user_id",sbUid).order("ordine");
    if(eV){toast("Errore: "+eV.message);return;}
    const voci=vv||[];
    const idVoci=voci.map(v=>v.id);
    let mis=[];
    if(idVoci.length){
      const {data:mm,error:eM}=await sb.from("gest_computo_misure")
        .select("*").eq("user_id",sbUid).in("voce_id",idVoci).order("ordine");
      if(eM){toast("Errore: "+eM.message);return;}
      mis=mm||[];
    }

    let conMisure=false;
    if(variante){
      /* le misure ci sono sempre: sono il punto di partenza di quello che
         cambierai. E si chiede una volta sola, con parole chiare. */
      conMisure=true;
      if(!gconfirm("Faccio la variante del computo «"+(c.titolo||"")+"»?\n\n"
        +"Nasce una COPIA con dentro tutto: capitoli, lavorazioni, prezzi e misure. "
        +"Li cambi come sono andati davvero i lavori.\n\n"
        +"Il computo di partenza NON si tocca, e nella variante trovi la pagina "
        +"«Cosa è cambiato» con le differenze e quanto costa in più o in meno."))return;
    }else if(mis.length){
      conMisure=gconfirm("Copio anche le misure?\n\n"
        +"SÌ  → il computo nuovo arriva identico, con tutte le "+mis.length+" misure già dentro. "
        +"Serve quando il lavoro è lo stesso (il secondo appartamento uguale) e devi solo correggere quello che cambia.\n\n"
        +"NO  → arrivano capitoli, lavorazioni, prezzi e unità di misura, ma le quantità partono da zero. "
        +"Serve quando è lo stesso tipo di lavoro su un edificio diverso.");
    }else{
      if(!gconfirm("Faccio una copia del computo «"+(c.titolo||"")+"»?"))return;
    }

    const {data:cap,error:eC}=await sb.from("gest_computo_capitoli")
      .select("*").eq("computo_id",id).eq("user_id",sbUid).order("ordine");
    if(eC){toast("Errore: "+eC.message);return;}
    const capitoli=cap||[];

    /* 1) il computo nuovo */
    const {data:nuovo,error:e1}=await sb.from("gest_computi").insert(Object.assign({
      user_id:sbUid, mestiere_id:curMestiere(),
      cliente_id:c.cliente_id||null,
      lavoro_id:null, preventivo_id:null,   /* la pratica NON si eredita */
      numero:null,                          /* lo metti tu: non invento un numero doppio */
      data:todayStr(), stato:"bozza",
      titolo:((c.titolo||"Computo")+(variante?" (variante)":" (copia)")).slice(0,200),
      oggetto:c.oggetto||null, luogo:c.luogo||null, note:c.note||null,
      tipo:c.tipo||"privato",
      prezzario:c.prezzario||null, prezzario_anno:c.prezzario_anno||null,
      ribasso_perc:c.ribasso_perc!=null?c.ribasso_perc:null
    },
    /* la colonna si nomina SOLO quando serve davvero: su un database senza
       l'aggiornamento (sql/gest-computo-variante.sql) una copia normale
       continua a funzionare come prima */
    variante?{variante_di:id}:{},
    /* il quadro economico si porta dietro come il ribasso: due appartamenti
       uguali hanno le stesse spese tecniche e la stessa IVA, e riscriverle
       undici righe alla volta è esattamente quello che «Duplica» evita.
       Si nomina la colonna SOLO se c'è: su un database senza l'aggiornamento
       la riga di partenza quella chiave non ce l'ha, e la copia non si rompe. */
    ("quadro_economico" in c)?{quadro_economico:c.quadro_economico||null}:{}
    )).select("id").single();
    if(e1||!nuovo){
      toast(_compManca(e1)
        ? ("Prima serve l'aggiornamento del database: "+COMP_SQL_TESTO)
        : "Copia non riuscita: "+((e1&&e1.message)||"nessuna riga scritta"));
      return;
    }
    const nid=nuovo.id;

    /* Da qui in poi, se salta qualcosa si butta via la copia a metà.
       ⚠️ SI PASSA DALLA PORTA DI SERVIZIO (sb.raw), NON DA sb.from.
       Su gest_computi il Cestino trasforma ogni cancellazione in una data:
       con sb.from la copia mezza fatta non sparirebbe, finirebbe NEL CESTINO,
       e Alessio se la ritroverebbe lì come se l'avesse buttata lui. Qui invece
       la riga è nata due secondi fa da noi ed è incompleta: va tolta davvero,
       e i capitoli già scritti se ne vanno con lei a catena.
       Trovato provando a far guastare il database a metà copia. */
    const rinuncia=async(msg)=>{
      try{
        await (sb.raw?sb.raw("gest_computi"):sb.from("gest_computi"))
          .delete().eq("id",nid).eq("user_id",sbUid);
      }catch(_){}
      toast("Copia non riuscita: "+msg+". Non è rimasto niente a metà.");
    };

    try{
      /* 2) i capitoli, tenendo la mappa vecchio -> nuovo */
      const mappaCap={};
      if(capitoli.length){
        const {data:nc,error:e2}=await sb.from("gest_computo_capitoli").insert(
          capitoli.map(k=>({user_id:sbUid,computo_id:nid,ordine:k.ordine,
                            numero:k.numero,titolo:k.titolo,note:k.note}))
        ).select("id,ordine,titolo");
        if(e2)throw e2;
        /* si riappaiano per ordine+titolo: l'insert di piu' righe restituisce
           le righe nell'ordine in cui gliele hai date, ma non c'e' scritto da
           nessuna parte che sia garantito, e sbagliare qui vorrebbe dire
           lavorazioni finite nel capitolo sbagliato */
        (nc||[]).forEach(n=>{
          const orig=capitoli.find(k=>k.ordine===n.ordine&&String(k.titolo||"")===String(n.titolo||"")
                                      &&!mappaCap[k.id]);
          if(orig)mappaCap[orig.id]=n.id;
        });
        capitoli.forEach((k,i)=>{ if(!mappaCap[k.id]&&nc&&nc[i])mappaCap[k.id]=nc[i].id; });
      }

      /* 3) le lavorazioni */
      const mappaVoci={};
      if(voci.length){
        const {data:nv,error:e3}=await sb.from("gest_computo_voci").insert(
          voci.map(v=>Object.assign({user_id:sbUid,computo_id:nid,
            capitolo_id:v.capitolo_id?(mappaCap[v.capitolo_id]||null):null,
            ordine:v.ordine,codice:v.codice,descrizione:v.descrizione,unita:v.unita,
            prezzo_unitario:v.prezzo_unitario,
            quantita_manuale:!!v.quantita_manuale,
            /* la quantità a mano si porta solo se è scritta a mano: quella
               che viene dalle misure la ricalcola il database */
            quantita:(conMisure||v.quantita_manuale)?(v.quantita||0):0,
            incidenza_manodopera:v.incidenza_manodopera,
            /* ⚠️ da quale riga viene questa riga. Serve SOLO alla variante,
               e serve a lei per non dire bugie: due lavorazioni possono
               avere lo stesso codice in due capitoli diversi, e una
               descrizione si puo' correggere. Confrontando per codice o
               per descrizione, una riga corretta risulterebbe «tolta» e
               «nuova» insieme. */
            oneri_sicurezza:v.oneri_sicurezza,note:v.note},
            variante?{origine_id:v.id}:{}))
        ).select("id,ordine,descrizione");
        if(e3)throw e3;
        (nv||[]).forEach(n=>{
          const orig=voci.find(v=>v.ordine===n.ordine&&String(v.descrizione||"")===String(n.descrizione||"")
                                  &&!mappaVoci[v.id]);
          if(orig)mappaVoci[orig.id]=n.id;
        });
        voci.forEach((v,i)=>{ if(!mappaVoci[v.id]&&nv&&nv[i])mappaVoci[v.id]=nv[i].id; });
      }

      /* 4) le misure, solo se le hai volute */
      if(conMisure&&mis.length){
        const righe=mis.map(m=>({user_id:sbUid,voce_id:mappaVoci[m.voce_id],
          ordine:m.ordine,descrizione:m.descrizione,parti:m.parti,
          lunghezza:m.lunghezza,larghezza:m.larghezza,altezza:m.altezza,
          detrai:!!m.detrai})).filter(r=>r.voce_id);
        /* a blocchi di 200, come fa l'importazione del prezzario: un computo
           grosso puo' avere migliaia di misure e in una volta sola non passa */
        for(let i=0;i<righe.length;i+=200){
          const {error:e4}=await sb.from("gest_computo_misure").insert(righe.slice(i,i+200));
          if(e4)throw e4;
        }
      }
    }catch(err){
      await rinuncia((err&&err.message)||"errore del database");
      return;
    }

    await renderComputi();
    rinfresca("riepilogo");
    toast("Computo duplicato ✔  "+(conMisure?"misure comprese":"senza le misure"));
    /* si apre subito la copia: la prima cosa che si fa è cambiarle il titolo */
    const copia=compCache.find(x=>String(x.id)===String(nid));
    if(copia)computoForm(copia);
  }

  async function delComputo(id){
    if(!sbUid)return;
    const c=compCache.find(x=>String(x.id)===String(id))||{};
    const conCestino=(window.cestinoAttivo&&window.cestinoAttivo());
    if(!gconfirm(conCestino
      ? "Mettere il computo «"+(c.titolo||"")+"» nel cestino?\n\nLo ritrovi nel Cestino e lo puoi rimettere a posto quando vuoi."
      : "Eliminare il computo «"+(c.titolo||"")+"»?\n\nSe ne vanno anche i suoi capitoli, le lavorazioni e le misure, e non si recupera."))return;
    const {data,error}=await sb.from("gest_computi").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Non eliminato: nessuna riga trovata. Riprova.");return;}
    closeSheet();
    await renderComputi();
    rinfresca("riepilogo","cestino");
    toast(conCestino?"Messo nel cestino ✔":"Eliminato");
  }

  /* ---- REPORT & STATISTICHE ---- */
  async function _fetchAllExport(){
    if(!sb||!sbUid){toast("Devi essere loggato");return null;}
    toast("Preparo l'esportazione…");
    /* 9 agosto 2026 — un file che si chiama "backup" e non contiene le FATTURE
       non è un backup. Mancavano anche ore, crediti formativi e fornitori.
       Le tabelle nuove si leggono con .catch: se una migrazione non è stata
       fatta, il backup esce lo stesso con tutto il resto invece di fallire. */
    const vuoto={data:[]};
    const _opz=q=>q.then(r=>r&&!r.error?r:vuoto).catch(()=>vuoto);
    /* 9 agosto 2026 — il backup legge con sb.raw, cioe' SENZA il filtro del
       cestino. Da quando si puo' eliminare per sempre, un file chiamato
       "backup" che non contiene le cose nel cestino sarebbe una trappola:
       uno lo scarica, poi svuota il cestino convinto di essere coperto.
       La colonna eliminato_il resta nel file, quindi si distingue cos'era cosa. */
    const _tab=t=>((window.cestinoAttivo&&window.cestinoAttivo())?sb.raw(t):sb.from(t));
    const [mest,lav,cli,ops,scad,prev,righe,spese,mezzi,lavMezzi,az,
           fatt,fattRig,fattLav,ore,cred,forn,fattForn,
           comp,compCap,compVoci,compMis,prezzi,carte,carteMov,rifor,note,foto,video]=await Promise.all([
      _tab("gest_mestieri").select("*").eq("user_id",sbUid),
      _tab("gest_lavori").select("*").eq("user_id",sbUid),
      _tab("gest_clienti").select("*").eq("user_id",sbUid),
      _tab("gest_operatori").select("*").eq("user_id",sbUid),
      _tab("gest_scadenze").select("*").eq("user_id",sbUid),
      _tab("gest_preventivi").select("*").eq("user_id",sbUid),
      _tab("gest_preventivo_righe").select("*").eq("user_id",sbUid),
      _tab("gest_spese").select("*").eq("user_id",sbUid),
      _tab("gest_mezzi").select("*").eq("user_id",sbUid),
      _tab("gest_lavoro_mezzi").select("*").eq("user_id",sbUid),
      _tab("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
      _opz(_tab("gest_fatture").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fattura_righe").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fattura_lavori").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_ore").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_crediti").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fornitori").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_fatture_fornitori").select("*").eq("user_id",sbUid)),
      /* ===== 12 agosto 2026 (sera) — MANCAVA ANCORA UN PEZZO =====
         Il backup non conteneva i COMPUTI METRICI (con capitoli, voci e
         misure), il PREZZARIO personale, le CARTE aziendali coi loro
         movimenti, i RIFORNIMENTI, le NOTE del calendario e l'elenco di FOTO e
         VIDEO. Un computo da sessanta voci con tutte le misure e' settimane di
         lavoro: se un giorno serve davvero ripartire da questo file, non ci
         sarebbe stato. (Le foto e i video sono l'ELENCO, non i file: quelli
         stanno nello storage e vanno scaricati a parte, ma senza l'elenco non
         si saprebbe nemmeno cosa cercare.) */
      _opz(_tab("gest_computi").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_computo_capitoli").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_computo_voci").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_computo_misure").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_prezzi_propri").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_carte").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_carte_movimenti").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_rifornimenti").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_note").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_foto").select("*").eq("user_id",sbUid)),
      _opz(_tab("gest_video").select("*").eq("user_id",sbUid))
    ]);
    return {mest:mest.data||[],lav:lav.data||[],cli:cli.data||[],ops:ops.data||[],scad:scad.data||[],
            prev:prev.data||[],righe:righe.data||[],spese:spese.data||[],mezzi:mezzi.data||[],
            lavMezzi:lavMezzi.data||[],az:az.data||null,
            fatt:fatt.data||[],fattRig:fattRig.data||[],fattLav:fattLav.data||[],
            ore:ore.data||[],cred:cred.data||[],forn:forn.data||[],fattForn:fattForn.data||[],
            comp:comp.data||[],compCap:compCap.data||[],compVoci:compVoci.data||[],
            compMis:compMis.data||[],prezzi:prezzi.data||[],carte:carte.data||[],
            carteMov:carteMov.data||[],rifor:rifor.data||[],note:note.data||[],
            foto:foto.data||[],video:video.data||[]};
  }
  async function esportaExcel(){
    if(!(await caricaXLSX())){toast("Non riesco a scaricare il modulo Excel: controlla la connessione e riprova");return;}
    const D=await _fetchAllExport();if(!D)return;
    const mN=Object.fromEntries(D.mest.map(m=>[m.id,m.nome]));
    const cN=Object.fromEntries(D.cli.map(c=>[c.id,c.nome]));
    const oN=Object.fromEntries(D.ops.map(o=>[o.id,o.nome]));
    const lN=Object.fromEntries(D.lav.map(l=>[l.id,l.descrizione||""]));
    const pN=Object.fromEntries(D.prev.map(p=>[p.id,p.numero]));
    const wb=XLSX.utils.book_new();
    const add=(nome,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{Vuoto:"—"}]),nome);
    /* 9 agosto 2026 — il foglio prende il nome giusto per chi lo apre, e per gli
       studi ci sono anche i dati della pratica: prima si salvavano nel database
       e non uscivano da nessuna parte, nemmeno qui. */
    const _pro=(ruoloUtente==='professionista');
    add(_lav(),D.lav.map(l=>{
      const r={Reparto:mN[l.mestiere_id]||"",Descrizione:l.descrizione||"",Dove:l.dove||"",
        Cliente:cN[l.cliente_id]||"",[_pro?"Collaboratore":"Operatore"]:oN[l.operatore_id]||"",
        Stato:statoLabel[l.stato]||l.stato||"","Data prevista":l.data_prevista||"",
        "Data fatto":l.data_fatto||"",Ore:+l.ore||0,"Importo €":+l.importo||0,
        "Stato fattura":l.fatt_stato||"none",Consuntivo:l.lavoro_svolto||"",Note:l.note||""};
      if(_pro){
        r["Tipo pratica"]=l.pratica_tipo||"";
        r["A che punto"]=(PRATICA_STATI.find(x=>x[0]===l.pratica_stato)||[])[1]||"";
        r["Comune"]=l.pratica_comune||"";
        r["N. protocollo"]=l.pratica_protocollo||"";
        r["Deposito"]=l.pratica_data_dep||"";
        r["Foglio"]=l.catasto_foglio||"";
        r["Particella"]=l.catasto_particella||"";
        r["Sub"]=l.catasto_sub||"";
      }
      return r;
    }));
    /* le fatture mancavano del tutto dall'esportazione */
    if((D.fatt||[]).length){
      const rPerF={};(D.fattRig||[]).forEach(r=>{(rPerF[r.fattura_id]=rPerF[r.fattura_id]||[]).push(r);});
      const impF={};(D.fatt||[]).forEach(f=>{impF[f.id]=fattImponibile(f,rPerF[f.id]);});
      /* la colonna Tipo mancava: nel foglio una nota di credito era
         indistinguibile da una fattura, e l'imponibile col meno sembrava un
         errore invece che una nota di credito */
      add("Fatture",D.fatt.map(f=>({Numero:f.numero||"",Anno:f.anno||"",Data:f.data||"",
        Tipo:FATT_TIPO_LAB[f.tipo]||"Fattura",
        Cliente:f.cli_nome||cN[f.cliente_id]||"",Stato:f.stato||"","Imponibile €":_cent2(impF[f.id]||0),
        "Cassa %":+f.cassa_perc||0,"Spese €":+f.spese||0,"Ritenuta %":+f.ritenuta_perc||0,
        "Sconto €":+f.sconto||0,"Bollo €":+f.bollo||0,Note:f.note||""})));
    }
    if((D.ore||[]).length)add(_pro?"Ore per pratica":"Ore per lavoro",
      D.ore.map(o=>({[_pro?"Pratica":"Lavoro"]:lN[o.lavoro_id]||"",Data:o.data||"",Ore:+o.ore||0,
        Chi:oN[o.operatore_id]||"",Nota:o.nota||""})));
    if((D.cred||[]).length)add("Crediti formativi",
      D.cred.map(c=>({Titolo:c.titolo||"",Ente:c.ente||"",Data:c.data||"",CFP:+c.crediti||0,Tipo:c.tipo||"",Note:c.note||""})));
    /* i soldi in USCITA: erano scaricati dal database e poi buttati via */
    if((D.forn||[]).length){
      const fN=Object.fromEntries(D.forn.map(f=>[f.id,f.nome]));
      add("Fornitori",D.forn.map(f=>({Nome:f.nome||"",Categoria:f.categoria||"",Telefono:f.telefono||"",
        Email:f.email||"","P.IVA":f.piva||"",Indirizzo:f.indirizzo||"",Note:f.note||""})));
      if((D.fattForn||[]).length)add("Fatture fornitori",D.fattForn.map(x=>({
        Fornitore:fN[x.fornitore_id]||"",Numero:x.numero||"",Data:x.data||"",
        "Importo €":+x.importo||0,Scadenza:x.scadenza||"",Stato:x.stato||"",
        [_pro?"Pratica":"Lavoro"]:lN[x.lavoro_id]||"",Note:x.note||""})));
    }
    add("Clienti",D.cli.map(c=>({Reparto:mN[c.mestiere_id]||"",Nome:c.nome||"",Indirizzo:c.indirizzo||"",Referente:c.referente||"",Telefono:c.telefono||""})));
    add(_pro?"Collaboratori":"Squadra",D.ops.map(o=>({Reparto:mN[o.mestiere_id]||"",Nome:o.nome||"",Telefono:o.telefono||""})));
    const tot={};D.righe.forEach(r=>{tot[r.preventivo_id]=(tot[r.preventivo_id]||0)+impRiga(r.qta,r.prezzo);});
    add("Preventivi",D.prev.map(p=>({Numero:p.numero,Titolo:p.titolo||"",Reparto:mN[p.mestiere_id]||"",Cliente:cN[p.cliente_id]||"",Data:p.data||"",Stato:p.stato||"","Totale €":tot[p.id]||0,Note:p.note||""})));
    add("Voci preventivi",D.righe.map(r=>({"N. preventivo":pN[r.preventivo_id]||"",Descrizione:r.descrizione||"","Q.tà":+r.qta||1,"Prezzo €":+r.prezzo||0,"Totale €":impRiga(r.qta,r.prezzo)})));
    add("Spese",D.spese.map(s=>({Lavoro:lN[s.lavoro_id]||"",Descrizione:s.descrizione||"","Importo €":+s.importo||0,Data:s.data||""})));
    const zN=Object.fromEntries(D.mezzi.map(m=>[m.id,m.nome||""]));
    const zCat={mezzo:"Mezzo",attrezzatura:"Attrezzatura"};
    const zStato={disponibile:"Disponibile",in_uso:"In uso",manutenzione:"In manutenzione",fuori_uso:"Fuori uso"};
    add("Scadenze",D.scad.map(s=>({Reparto:mN[s.mestiere_id]||"",Titolo:s.titolo||"",Tipo:s.tipo_pratica||"",Cliente:cN[s.cliente_id]||"",Mezzo:zN[s.mezzo_id]||"","Data scadenza":s.data_scadenza||"",Stato:s.stato||"",Note:s.note||""})));
    add("Mezzi",D.mezzi.map(m=>({Reparto:mN[m.mestiere_id]||"",Nome:m.nome||"",Categoria:zCat[m.categoria]||m.categoria||"","Targa / matricola":m.targa||"",Stato:zStato[m.stato]||m.stato||"",Note:m.note||""})));
    add("Mezzi per lavoro",D.lavMezzi.map(x=>({Lavoro:lN[x.lavoro_id]||"",Mezzo:zN[x.mezzo_id]||""})));
    if(D.az)add("Dati azienda",[{Nome:D.az.nome||"","P.IVA":D.az.piva||"","Codice fiscale":D.az.cod_fiscale||"",Indirizzo:azIndirizzo(D.az),Telefono:D.az.tel||"",Email:D.az.email||"",IBAN:D.az.iban||"","Regime fiscale":D.az.regime_fiscale||"","Codice destinatario":D.az.sdi_codice||"",PEC:D.az.sdi_pec||"","Patente a crediti":D.az.pat_crediti!=null?String(D.az.pat_crediti):""}]);
    XLSX.writeFile(wb,"gestionale-trovaimpresa-"+todayStr()+".xlsx");
    toast("Dati esportati in Excel ✅");
  }
  async function esportaJson(){
    const D=await _fetchAllExport();if(!D)return;
    /* 9 agosto 2026 — mancavano fatture, righe fattura, collegamenti
       fattura-lavoro, ore, crediti formativi, fornitori e fatture fornitori.
       Un file che si chiama "backup" e non contiene le fatture non è un backup. */
    const out={esportato_il:new Date().toISOString(),formato:"trovaimpresa-gestionale-v2",
      azienda:D.az,mestieri:D.mest,clienti:D.cli,operatori:D.ops,lavori:D.lav,spese:D.spese,
      preventivi:D.prev,preventivo_righe:D.righe,scadenze:D.scad,mezzi:D.mezzi,lavoro_mezzi:D.lavMezzi,
      fatture:D.fatt,fattura_righe:D.fattRig,fattura_lavori:D.fattLav,
      ore:D.ore,crediti:D.cred,fornitori:D.forn,fatture_fornitori:D.fattForn,
      computi:D.comp,computo_capitoli:D.compCap,computo_voci:D.compVoci,computo_misure:D.compMis,
      prezzario:D.prezzi,carte:D.carte,carte_movimenti:D.carteMov,rifornimenti:D.rifor,
      note_calendario:D.note,
      /* elenco dei file, non i file: quelli stanno nello storage */
      foto:D.foto,video:D.video};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:"application/json"}));
    a.download="backup-gestionale-trovaimpresa-"+todayStr()+".json";a.click();URL.revokeObjectURL(a.href);
    toast("Backup JSON scaricato ✅");
  }

  /* click handler dei nuovi strumenti (separato: non tocca quello esistente) */
