  /* ============================================================
     COMPUTI METRICI — 10 agosto 2026  (primo pezzo: l'elenco e la scheda)
     Tabelle: sql/gest-computo-metrico.sql

     Un computo e' fatto a quattro livelli: computo -> capitoli -> voci ->
     misure. Qui ci sono i primi due passaggi: l'elenco dei computi e la
     scheda del computo. Le lavorazioni con le loro misure sono il pezzo
     dopo, e vanno DENTRO questa scheda (come le Ore dentro la pratica).

     I TOTALI NON SI CALCOLANO QUI. Li legge dalla vista gest_computo_totali:
     il conto lo fa il database, in un posto solo. Se un domani cambia la
     regola, cambia in un punto e tutte le schermate la seguono.
     ============================================================ */
  let compCache=[], compTot={}, compCli={}, compFiltro="tutti", compTabellaOk=true;

  const COMP_VISTE=[{k:"tutti",lab:"Tutti"},{k:"bozza",lab:"Bozze"},{k:"definitivo",lab:"Definitivi"}];
  const COMP_STATO_LAB={bozza:"Bozza",definitivo:"Definitivo"};
  const COMP_BAR={bozza:"da_fare",definitivo:"fatto"};

  /* la tabella non c'e' ancora: lo si dice, invece di restare a girare */
  function _compManca(err){
    const m=(err&&(err.message||err.details||""))||"";
    return /gest_comput|gest_prezzi_propri/i.test(m) || /schema cache|does not exist|relation/i.test(m);
  }

  async function renderComputi(){
    filoMetti("computi","computi");
    const box=$("#comp-list");if(!box)return;
    if(!sb||!sbUid){box.innerHTML=tabVuoto("Nessun computo","Accedi per creare i computi metrici.",
      _SVGV+'<path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 9v12"/></svg>');return;}
    const mid=curMestiere();

    const [rc,rt,rl] = await Promise.all([
      sb.from("gest_computi").select("*").eq("user_id",sbUid).eq("mestiere_id",mid)
        .order("data",{ascending:false}),
      sb.from("gest_computo_totali").select("*").eq("user_id",sbUid),
      /* i clienti si leggono ANCHE dal cestino: un computo di un cliente
         cestinato deve dire il nome, non un trattino (lezione del 10 agosto) */
      _sbTutto("gest_clienti").select("id,nome,eliminato_il").eq("user_id",sbUid).eq("mestiere_id",mid)
    ]);

    if(rc.error){
      compTabellaOk=false;
      $("#comp-viste").innerHTML="";
      box.innerHTML=tabVuoto(
        _compManca(rc.error)?"Questa sezione non è ancora accesa":"Non riesco a leggere i computi",
        _compManca(rc.error)
          ? "Esegui <b>sql/gest-computo-metrico.sql</b> su Supabase (SQL Editor → Run) e ricarica la pagina."
          : "Il database ha risposto: "+esc(rc.error.message),
        _SVGV+'<path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 9v12"/></svg>');
      return;
    }
    compTabellaOk=true;
    compCache=rc.data||[];
    compTot={};(rt&&rt.data||[]).forEach(r=>{compTot[r.computo_id]=r;});
    compCli={};(rl&&rl.data||[]).forEach(c=>{compCli[c.id]=(c.nome||"")+(c.eliminato_il?" (nel cestino)":"");});

    const cnt=$("#cnt-computi");if(cnt)cnt.textContent=compCache.length?String(compCache.length):"";

    const L=compCache.filter(c=>compFiltro==="tutti"||c.stato===compFiltro);
    const conta={};COMP_VISTE.forEach(v=>conta[v.k]=compCache.filter(c=>v.k==="tutti"||c.stato===v.k).length);
    /* il totale dell'elenco e' quello NETTO, ribasso compreso: se in fondo alla
       lista comparisse la cifra piena mentre dentro il computo ce n'e' un'altra,
       il primo a non fidarsi saresti tu. */
    const somma=L.reduce((s,c)=>s+compNetto(c),0);

    renderTabella({
      id:"comp", box:"#comp-list",
      viste:"#comp-viste", visteDef:COMP_VISTE, vista:compFiltro, conta:conta, azioneVista:"comp-filtro",
      vuoto:tabVuoto(
        compCache.length?("Nessun "+_cm('uno')+" con questo filtro"):_cm('vuoto'),
        compCache.length?"Prova a cambiare vista qui sopra.":_cm('spiega'),
        _SVGV+'<path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 9v12"/></svg>',
        compCache.length?null:{t:_cm('primo'),a:"new-computo"}),
      /* La forma sono le SCHEDE, come tutte le altre sezioni (vedi schedaJob):
         la prima versione usava la tabella e sul telefono l'importo finiva
         fuori dallo schermo — cioe' l'unico numero che conta davvero.
         Le colonne restano per il ripiego a tabella, che renderTabella tiene
         ancora dentro. */
      colonne:[{lab:"N.",w:"12%"},{lab:"Computo",w:"31%"},{lab:"Cliente",w:"22%",cls:"c-cli"},
               {lab:"Quando",w:"15%"},{lab:"Importo",w:"20%",cls:"c-imp"}],
      righe:L.map(c=>({
        id:c.id,
        click:{action:"edit-computo",data:{id:c.id}},
        celle:[
          esc(String(c.numero||"—")),
          '<span class="c-nome">'+esc(c.titolo||"(senza titolo)")+'</span>',
          esc(compCli[c.cliente_id]||"—"),
          {h:quando(c.data,{neutro:true}).testo,cls:quando(c.data,{neutro:true}).classe},
          {h:eur(compNetto(c)),cls:"c-imp"}
        ],
        menu:compVoci(c)
      })),
      cards:()=>L.map(c=>compCard(c)).join(""),
      totale: L.length?{testo:L.length+" "+(L.length===1?"computo":"computi"),valore:eur(somma)}:null
    });
  }

  /* le azioni del computo: le stesse nel menu "..." e sui pulsanti della scheda */
  function compVoci(c){
    return [{lab:"✏ Apri il computo",action:"edit-computo",data:{id:c.id}},
            /* ⚠️ 22 agosto 2026 — QUI C'ERA SCRITTO SOLO «Scarica il PDF».
               Con l'analisi dei prezzi qui sotto sarebbero diventati due
               pulsanti che non dicono cosa scaricano, sulla stessa fila.
               E' l'inciampo del 21 agosto, quando ce n'erano tre tutti
               chiamati «Scarica il PDF»: il nome di un pulsante si guarda
               sulla schermata intera, non da solo. */
            {lab:"📄 Scarica il computo metrico",action:"comp-pdf",data:{id:c.id}}]
           /* ⚠️ 20 agosto 2026 — LA LISTA C'E' ANCHE SUI LAVORI PRIVATI.
              Fino a ieri compariva solo sui «Lavori pubblici», con la nota che
              su un privato «non serve a niente». Non era vero, e l'ha detto
              Alessio: e' il foglio con le due colonne dei prezzi VUOTE, quello
              che si manda a un subappaltatore per farsi fare i prezzi da lui.
              E' lo stesso documento che il geometra manda all'impresa.
              Cambia solo il nome: in una gara si chiama cosi', fra privati no. */
           .concat([{lab:(c.tipo==="pubblico"?"🏛 Lista per la gara":"📋 Lista da far prezzare"),
                     action:"comp-gara",data:{id:c.id}}])
           /* 22 agosto 2026 — l'analisi dei prezzi: il foglio che in una gara
              si consegna quando una lavorazione non sta nel prezzario. Sta in
              fila con gli altri documenti del computo perche' e' un documento
              del computo, non di una lavorazione: l'allegato e' uno solo, con
              dentro tutte le lavorazioni col prezzo costruito. */
           .concat([{lab:"🧮 Scarica l'analisi dei prezzi",action:"comp-analisi",data:{id:c.id}}])
           .concat([
            /* 16 agosto 2026 — «Crea il preventivo» stava solo in fondo alla
               finestra. Adesso che le azioni del documento stanno in alto,
               sta in fila con le altre, se no era l'unica rimasta sotto. */
            {lab:"→ Crea il preventivo",action:"comp-prev",data:{id:c.id}},
            {lab:"⧉ Duplica",action:"comp-dup",data:{id:c.id}}])
           /* 20 agosto 2026 — LA VARIANTE. E' una copia, ma che si RICORDA
              da dove viene: cosi' puo' dire cosa e' cambiato.
              ⛔ Su una variante non si offre di rifarne un'altra: una
              variante della variante non e' piu' un confronto, e' una
              catena in cui non si capisce piu' rispetto a cosa. */
           .concat(c.variante_di?[]:[{lab:"± Crea la variante",action:"comp-variante",data:{id:c.id}}])
           .concat([{lab:"🗑 Elimina",action:"del-computo",data:{id:c.id},del:true}]);
  }
  /* la scheda dell'elenco: passa da schedaJob, la scheda unica di tutte le
     sezioni, cosi' i Computi hanno la stessa forma di Pratiche e Preventivi */
  function compCard(c){
    const t=compTot[c.id]||{voci:0,importo:0};
    const q=quando(c.data,{neutro:true});
    const nVoci=+t.voci||0;
    return schedaJob({
      tono: c.stato==="definitivo" ? "t-ok" : "t-attesa",
      titolo: (c.numero?("N. "+esc(String(c.numero))+" — "):"")+esc(c.titolo||"(senza titolo)"),
      destra: '<span class="stato '+(COMP_BAR[c.stato]||"da_fare")+'">'+(COMP_STATO_LAB[c.stato]||esc(c.stato))+'</span>',
      meta:[
        c.cliente_id?("👤 "+esc(compCli[c.cliente_id]||"—")):"",
        c.luogo?("📍 "+esc(c.luogo)):"",
        "📅 "+esc(q.testo),
        nVoci?("🧱 "+nVoci+(nVoci===1?" lavorazione":" lavorazioni")):"🧱 nessuna lavorazione",
        '<b>'+eur(compNetto(c))+'</b>'+((+c.ribasso_perc)?(' <small>ribasso '+_pct(c.ribasso_perc)+'%</small>'):''),
        c.tipo==="pubblico"?"🏛 lavori pubblici":"",
        c.prezzario?("🏷 "+esc(c.prezzario)+(c.prezzario_anno?(" "+c.prezzario_anno):"")):""
      ],
      nota: c.note?("📝 "+esc(c.note)):"",
      azioni: compVoci(c)
    });
  }

  /* ---- la scheda del computo ---- */
  async function computoForm(c){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    if(!compTabellaOk){toast("Prima serve l'aggiornamento del database (sql/gest-computo-metrico.sql)");return;}
    c=c||{};
    const isNew=!c.id;
    /* le tariffe che hai davvero nel Prezzario: servono alla tendina qui sotto */
    await ppCarica();
    const _fonti=ppFonti();
    const _scritto=(c.prezzario||"");
    const _daTendina=(_fonti.indexOf(_scritto)>=0);
    const _mio=(!_daTendina&&(!!_scritto||!_fonti.length));
    const przOpts='<option value=""'+((!_scritto&&_fonti.length)?' selected':'')+'>— non lo dico —</option>'
      +_fonti.map(f=>'<option value="'+esc(f)+'"'+(f===_scritto?' selected':'')+'>'+esc(f)+'</option>').join("")
      +'<option value="__mio__"'+(_mio?' selected':'')+'>— lo scrivo io —</option>';
    const mid=curMestiere();

    /* clienti e pratiche del reparto per le due tendine */
    const [rcl,rlv]=await Promise.all([
      _sbTutto("gest_clienti").select("id,nome,eliminato_il").eq("user_id",sbUid).eq("mestiere_id",mid).order("nome"),
      sb.from("gest_lavori").select("id,descrizione").eq("user_id",sbUid).eq("mestiere_id",mid).order("created_at",{ascending:false})
    ]);
    const pro=ruoloUtente==='professionista';
    const cliOpts=(rcl.data||[]).map(x=>'<option value="'+esc(x.id)+'"'+(String(x.id)===String(c.cliente_id||"")?" selected":"")+'>'
      +esc((x.nome||"")+(x.eliminato_il?" (nel cestino)":""))+'</option>').join("");
    const lavOpts=(rlv.data||[]).map(x=>'<option value="'+esc(x.id)+'"'+(String(x.id)===String(c.lavoro_id||"")?" selected":"")+'>'
      +esc(x.descrizione||"(senza nome)")+'</option>').join("");

    openSheetGrande(isNew?_cm('nuovo'):("Computo "+(c.numero?("n. "+c.numero):"")+" — "+(c.titolo||"")),
       /* ============================================================
          20 agosto 2026 — LA SCALA DEL COMPUTO
          ============================================================
          Idea di Alessio, dopo aver provato a caricare il computo del
          geometra e averci messo dieci minuti a trovare il pulsante:
          «io volevo un gestionale schematico A GRADONI... adesso funzioni
          dentro altre funzioni, si capiscono?».

          Prima questa finestra era UNA pagina lunga: sette caselle di
          anagrafica, poi in fondo a sinistra le lavorazioni con tre
          pulsantini uguali, e in alto a destra — in bella vista — il SAL,
          cioe' l'ULTIMA cosa che fai, offerta su un computo vuoto.
          L'ordine sullo schermo era il contrario dell'ordine del lavoro.

          Adesso c'e' una barra: 1 Lavorazioni · 2 Prezzi · 3 Ribasso e
          totale · 4 La scheda · 5 Acconti (SAL). Una per volta, e si apre
          sulle LAVORAZIONI, non sull'anagrafica.

          ⛔ LE PAGINE CI SONO TUTTE NEL DOCUMENTO, si nascondono col CSS.
          Non si ridisegnano al cambio di voce, e il motivo e' serio:
          compSalva legge le caselle per id (co-num, co-tit, co-rib...). Se
          una pagina non fosse disegnata, quelle caselle non esisterebbero e
          il salvataggio SVUOTEREBBE i campi che non hai davanti — cioe' ti
          cancellerebbe il titolo perche' stavi guardando i prezzi.

          ⚠️ La barra la vedono anche gli studi tecnici, uguale: due
          schermate diverse per la stessa cosa sono due cose da tenere
          allineate, e prima o poi si scollano.
          ============================================================ */
       '<div class="conav" id="co-nav">'
      /* la 7 c'e' SOLO su una variante: su un computo normale non ci
         sarebbe niente da confrontare, e una voce che non fa mai niente
         e' peggio di una voce che non c'e' */
      +  [[1,"Lavorazioni"],[2,"Prezzi"],[3,"Ribasso e totale"],[4,"La scheda"],[5,"Acconti (SAL)"],[6,"Cronoprogramma"]]
         .concat(c.variante_di?[[7,"Cosa è cambiato"]]:[])
         .map(function(v){
           /* su un computo che non e' ancora stato salvato l'unica cosa che
              si puo' fare e' dargli un nome: le altre voci sono spente e lo
              dicono, invece di far premere pulsanti che rispondono «salva
              prima il computo». */
           const spento=isNew&&v[0]!==4;
           const qui=(isNew?4:1)===v[0];
           return '<button type="button" class="conav-v'+(qui?" on":"")+(spento?" spento":"")+'" data-action="co-pag" data-p="'+v[0]+'">'
                + '<span class="conav-n">'+v[0]+'</span>'+v[1]+'</button>';
         }).join("")
      +'</div>'

      +'<div class="copag'+(isNew?" on":"")+'" data-p="4">'
      +'<div class="sh-b"><div class="sh-tit">Che computo è</div>'
      + (isNew?'<div class="sh-nota">Dai un titolo e premi <b>Crea computo</b> qui sotto: subito dopo si accende <b>1 Lavorazioni</b> e ci metti dentro il foglio del geometra.</div>':'')
      +  '<div class="row2">'
      +    '<div class="field"><label>Numero</label><input id="co-num" value="'+esc(c.numero||"")+'" placeholder="01/2026" style="max-width:160px"></div>'
      +    '<div class="field"><label>Data</label><input type="date" id="co-data" value="'+esc(c.data||todayStr())+'"></div>'
      +  '</div>'
      +  '<div class="field"><label>Titolo</label><input id="co-tit" value="'+esc(c.titolo||"")+'" placeholder="Es. Ristrutturazione appartamento"></div>'
      +  '<div class="field"><label>Oggetto dei lavori (facoltativo)</label><textarea id="co-ogg" placeholder="Come lo scriveresti in testa al documento">'+esc(c.oggetto||"")+'</textarea></div>'
      +  '<div class="field"><label>Dove</label><input id="co-luogo" value="'+esc(c.luogo||"")+'" placeholder="Es. via Roma 12, Rieti"></div>'
      +'</div>'

      +'<div class="sh-b"><div class="sh-tit">Per chi</div>'
      +  '<div class="field"><label>Cliente</label><select id="co-cli"><option value="">— nessuno —</option>'+cliOpts+'</select></div>'
      +  '<div class="field"><label>'+(pro?'Pratica collegata':'Lavoro collegato')+'</label><select id="co-lav"><option value="">— nessuna —</option>'+lavOpts+'</select>'
      +    '<div class="sh-nota">Collegarlo serve a ritrovarlo: il computo resta anche se '+(pro?'la pratica':'il lavoro')+' finisce nel cestino.</div></div>'
      +'</div>'

      +'</div>'   /* <- fine pagina 4, il resto della scheda sta piu' sotto */

      +'<div class="copag'+(isNew?"":" on")+'" data-p="1">'
      +'<div class="sh-b"><div class="sh-tit">Le lavorazioni</div>'
      +  '<div class="sh-nota">Da qui comincia tutto: il conto del lavoro, riga per riga.</div>'
      +  '<div class="lav-media" id="co-voci">'
      +    (isNew
        ? '<div class="lm-vuoto">Salva prima il computo: poi qui dentro ci metti i capitoli, le lavorazioni e le loro misure.</div>'
        : '<div class="lm-vuoto">Sto caricando…</div>')
      +  '</div>'
      +'</div>'

      /* 19 agosto 2026 — il quadro economico sta SUBITO SOTTO le lavorazioni:
         i suoi numeri nascono da quelle, e guardarli lontani dal totale che li
         genera è il modo più veloce per non accorgersi di una cifra storta.
         Si vede solo sui Lavori pubblici: su un lavoro privato non esiste. */
      +'</div>'   /* <- fine pagina 1 */

      +'<div class="copag" data-p="3">'
      +'<div class="sh-b" id="co-qe-box"'+(c.tipo==="pubblico"?"":' style="display:none"')+'>'
      +  '<div class="sh-tit">Quadro economico</div>'
      +  '<div id="co-qe-a" class="qe-a"></div>'
      +  '<div class="qe-cap">B · Somme a disposizione della stazione appaltante</div>'
      +  '<div id="co-qe-righe">'+qeRighe(c).map(r=>qeRigaHtml(r)).join("")+'</div>'
      +  '<button type="button" class="btn-ghost quick-add" data-action="qe-riga-add">+ Aggiungi voce</button>'
      +  '<div id="co-qe-tot" class="qe-tot"></div>'
      +  '<div class="sh-nota">Ogni riga o è in <b>euro</b> o è in <b>percentuale del Totale A</b>: se scrivi la percentuale, l\'euro non conta più. La lista è quella standard — cancella quello che non ti serve e aggiungi il tuo.</div>'
      +'</div>'

      /* 19 agosto 2026 — LA CONTABILITA' DEI LAVORI, subito sotto il quadro
         economico: i SAL nascono dalle stesse lavorazioni, e tenerli nella
         scheda del computo evita di dover cercare il lavoro in un'altra
         sezione ogni volta che si chiede un acconto. */
      +'</div>'   /* <- fine pagina 3 (il ribasso ci arriva piu' sotto) */

      +'<div class="copag" data-p="5">'
      +'<div class="sh-b"><div class="sh-tit">Stati di avanzamento (SAL)</div>'
      +  '<div class="lav-media" id="co-sal">'+(isNew
          ? '<div class="lm-vuoto">Salva prima il computo: poi qui dentro ci metti gli stati di avanzamento.</div>'
          : '<div class="lm-vuoto">Sto caricando…</div>')+'</div>'
      +  '<div class="sh-nota">Serve per farsi pagare a pezzi mentre il lavoro va avanti: conti quello che hai fatto e chiedi un acconto.</div>'
      +'</div>'

      +'</div>'   /* <- fine pagina 5 */

      /* ============================================================
         20 agosto 2026 (sera) — IL CRONOPROGRAMMA
         ============================================================
         Le fasi del lavoro sul calendario. Sui lavori pubblici e'
         obbligatorio; a un'impresa serve per sapere quando mandare la
         squadra e quando ordinare i materiali.

         ⛔ LE DATE NON SI SCRIVONO, SI CALCOLANO. Nel database stanno
            solo la data di partenza e le durate: chi comincia quando lo
            decide la catena (vedi cronoDate). Se le date fossero
            scritte, spostare l'inizio del cantiere di un giorno le
            lascerebbe tutte sbagliate senza che nessuno se ne accorga.
         ============================================================ */
      +'<div class="copag" data-p="6">'
      +'<div class="sh-b"><div class="sh-tit">Cronoprogramma</div>'
      /* ⚠️ NON scrivere «Il cantiere comincia il»: per gli studi tecnici il
         gestionale riscrive «cantiere» in «pratica» (vedi _FRASI) e usciva
         «Il pratica comincia il». Se l'ho visto io in una foto, l'avrebbe
         visto anche il primo che paga.
         Qui e nelle altre scritte del cronoprogramma NON si usano parole
         che passano dalla traduzione: cosi' la frase e' giusta per tutti e
         due senza doverla tenere allineata in due posti. */
      +  '<div class="field" style="max-width:280px"><label>Si comincia il</label>' 
      +    '<input type="date" id="co-inizio" value="'+esc(c.data_inizio||"")+'"></div>'
      +  '<div class="lav-media" id="co-crono">'+(isNew
          ? '<div class="lm-vuoto">Salva prima il computo.</div>'
          : '<div class="lm-vuoto">Sto caricando…</div>')+'</div>'
      +'</div>'
      +'</div>'   /* <- fine pagina 6 */

      /* ============================================================
         20 agosto 2026 — IL COMPUTO DI VARIANTE
         ============================================================
         I lavori cambiano in corsa. Questa pagina dice COSA e' cambiato
         rispetto al computo di partenza, e quanto costa in piu' o in meno.
         Sui lavori privati oggi si fa a voce, ed e' li' che nascono le liti.

         ⛔ Il confronto NON e' scritto nel database: si rifa' ogni volta
            dalle due colonne variante_di e origine_id. Scriverlo vorrebbe
            dire che al primo cambio di quantita' sarebbe vecchio.
         ============================================================ */
      +(c.variante_di
        ? '<div class="copag" data-p="7">'
         +'<div class="sh-b"><div class="sh-tit">Cosa è cambiato</div>'
         +  '<div class="lav-media" id="co-var"><div class="lm-vuoto">Sto caricando…</div></div>'
         +'</div>'
         +'</div>'
        : '')

      +'<div class="copag" data-p="4">'
      +'<div class="sh-b"><div class="sh-tit">A cosa serve questo computo</div>'
      +  '<div class="field"><div class="seg" id="co-tipo">'
      +    '<button data-v="privato"'+((c.tipo||"privato")==="privato"?' class="on"':'')+'>Lavori privati</button>'
      +    '<button data-v="pubblico"'+(c.tipo==="pubblico"?' class="on"':'')+'>Lavori pubblici</button>'
      +  '</div>'
      /* ⚠ Qui NON si scrive la parola "manodopera": per gli studi il gestionale
         la riscrive in "tempo speso" (vedi _FRASI), e usciva "l'incidenza della
         tempo speso". Il termine giusto per una gara e' "incidenza della
         manodopera": va sistemato nella traduzione prima di metterlo sul PDF. */
      +  '<div class="sh-nota">Sui <b>lavori pubblici</b> il gestionale ti chiede anche quanta parte del prezzo è costo del personale e gli oneri della sicurezza, che nelle gare vanno dichiarati. Sui lavori privati non ti disturba.</div></div>'
      +  '<div class="field"><div class="seg" id="co-stato">'
      +    '<button data-v="bozza"'+((c.stato||"bozza")==="bozza"?' class="on"':'')+'>Bozza</button>'
      +    '<button data-v="definitivo"'+(c.stato==="definitivo"?' class="on"':'')+'>Definitivo</button>'
      +  '</div></div>'
      +'</div>'

      +'</div>'   /* <- fine pagina 4 (secondo pezzo) */

      +'<div class="copag" data-p="2">'
      +'<div class="sh-b"><div class="sh-tit">Da dove vengono i prezzi</div>'
      +  '<div class="row2">'
      +  '</div>'
      /* ⚠️ LA TARIFFA SI SCEGLIE QUI, IN UN POSTO SOLO. 10 agosto 2026.
         Prima c'erano DUE punti che dicevano la stessa cosa senza parlarsi: qui
         si scriveva a mano il nome che finisce sul PDF, e dentro la lavorazione
         una tendina decideva dove cercare i prezzi. Si poteva stampare "Lazio"
         sul documento e pescare i prezzi dall'Umbria, senza un avviso.
         Adesso qui si sceglie fra le tariffe che hai davvero nel Prezzario, e
         la ricerca dentro le lavorazioni segue questa. Chi non ha ancora
         importato niente usa «lo scrivo io» e va avanti come prima. */
      +  '<div class="field"><label>Prezzario</label><select id="co-prz-sel">'+przOpts+'</select>'
      +    (_fonti.length?'':'<div class="sh-nota">Quando importerai una tariffa nella sezione Prezzario, la troverai qui dentro.</div>')+'</div>'
      +  '<div class="row2" id="co-prz-mio"'+(_mio?'':' style="display:none"')+'>'
      +    '<div class="field"><label>Come si chiama</label><input id="co-prz" value="'+esc(_daTendina?"":(c.prezzario||""))+'" placeholder="Es. Tariffa Regione Lazio"></div>'
      +    '<div class="field"><label>Anno</label><input type="number" id="co-prz-anno" value="'+(c.prezzario_anno||"")+'" placeholder="2023" style="max-width:130px"></div>'
      +  '</div>'
      /* 12 agosto 2026 (sera) — era type="number". Un ribasso si scrive
         «12,5», con la virgola: una casella type=number con la virgola dentro
         non restituisce niente (o restituisce NaN), e il ribasso spariva senza
         un messaggio. In una gara e' il numero piu' importante del documento.
         Adesso e' testo, letta da _numIt come i prezzi: 12,5 e 12.5 vanno bene. */
      +  '<div class="sh-nota">Il prezzario finisce sul documento: un computo deve dire da dove vengono i prezzi, se no il primo che lo legge te lo chiede.</div>'
      +'</div></div>'   /* <- fine pagina 2 */

      /* il ribasso sta con il totale, non coi prezzi: e' l'ultima cosa che si
         tocca, e si guarda insieme alla cifra che cambia */
      +'<div class="copag" data-p="3">'
      +'<div class="sh-b"><div class="sh-tit">Il ribasso</div>'
      +  '<div class="field"><label>Ribasso o sconto (%)</label><input type="text" inputmode="decimal" id="co-rib"'+_noAuto()+' value="'+(c.ribasso_perc!=null?String(c.ribasso_perc).replace(".",","):"")+'" placeholder="Es. 12,5" style="max-width:160px"></div>'
      +  '<div class="sh-nota">Lo sconto che fai sul totale. Il conto col ribasso lo trovi in fondo alle <b>Lavorazioni</b>.</div>'
      +'</div></div>'

      +'<div class="copag" data-p="4">'
      +'<div class="sh-b"><div class="sh-tit">Note</div>'
      +  '<div class="field"><textarea id="co-note" placeholder="Esclusioni, condizioni, riferimenti...">'+esc(c.note||"")+'</textarea></div>'
      +'</div>'
      +'</div>',

       ctrTastoHTML('computo')
      +'<button class="btn b-cancel" data-action="close">Annulla</button>'
      /* PDF, «Crea il preventivo» ed Elimina non stanno piu' qui: arrivano
         dalla scheda e si mettono in alto (Elimina in fondo a sinistra),
         come in tutte le altre finestre. Prima uscivano doppi. */
      +'<button class="btn-primary b-save" data-action="save-computo" data-id="'+esc(c.id||"")+'">'+(isNew?"Crea computo":"Salva")+'</button>');

    /* quale computo e' aperto: le sue lavorazioni stanno in compVociCache,
       non nel modulo, e su un computo nuovo la cache e' ancora quella vecchia */
    ctrComputoId=(c&&c.id)?c.id:null;
    ctrAscolta('computo');
    bindSeg("co-tipo");
    bindSeg("co-stato");
    /* il quadro economico si accende e si spegne col tipo di lavoro, ma NON si
       ridisegna: si nasconde e basta. Ridisegnarlo butterebbe via quello che
       stai scrivendo appena tocchi «Lavori privati» per sbaglio. */
    $$("#co-tipo button").forEach(b=>b.addEventListener("click",qeMostra));
    const _qb=$("#co-qe-righe");
    if(_qb)_qb.addEventListener("input",qeAggiorna);
    qeAggiorna();
    const _ps=$("#co-prz-sel");
    if(_ps)_ps.onchange=function(){
      const box=$("#co-prz-mio");
      if(box)box.style.display=(_ps.value==="__mio__")?"":"none";
    };
    compCapNuovo=false;compCapEdit=null;
    /* la pagina di partenza si accende da qui e NON dall'html: una pagina e'
       fatta di piu' blocchi (la 4 ne ha tre, la 3 ne ha due) e scrivere " on"
       a mano nel primo blocco lasciava spenti gli altri. Un posto solo. */
    compPag(isNew?4:1,true);
    /* la data di inizio ridisegna il calendario mentre la scrivi, senza
       salvare: cosi' si vede subito dove cade la consegna */
    const _ci=$("#co-inizio");
    if(_ci)_ci.addEventListener("change",function(){ cronoAnteprima(); });
    if(!isNew){renderCompVoci(c.id);renderSalList(c.id);renderCrono(c.id);
               if(c.variante_di)renderVariante(c);}
  }

  /* ============================================================
     LE LAVORAZIONI E LE LORO MISURE
     ============================================================
     Il computo e' fatto a quattro livelli e le schermate sono DUE, non una:

       scheda del COMPUTO      -> l'elenco delle lavorazioni, in sola lettura,
                                  coi subtotali per capitolo
       scheda della LAVORAZIONE -> la voce (codice, descrizione, unita', prezzo)
                                  e sotto le sue MISURE

     Perche' due e non una: una sola schermata con tre livelli di modifica
     dentro diventa illeggibile, sul telefono impossibile. Cosi' si fa una
     cosa per volta, e il pulsante "Torna al computo" riporta indietro.

     LA QUANTITA' NON SI SCRIVE MAI. La somma delle misure la fa il database
     (vista gest_computo_voci_calc). Qui si legge e si mostra.
     ============================================================ */
  let compVociCompId=null, compCapCache=[], compVociCache=[], compMisCache=[], compVoceId=null, compCapNuovo=false;
  /* quale capitolo si sta rinominando in questo momento (null = nessuno) */
  let compCapEdit=null;

  /* ===== 11 agosto 2026 — COME SI LEGGE UN NUMERO SCRITTO A MANO =====
     Prima qui c'era una riga sola: cambia la virgola in punto e leggi. Con
     "3,20" funzionava. Con un PREZZO no, e questa funzione i prezzi li legge
     davvero (prezzo unitario della lavorazione e prezzo del prezzario):

        scrivi 1.250,00  ->  diventava 1,25
        scrivi 1 250,00  ->  diventava 1

     Un computo da 12.500 euro usciva da 12,50, e non se ne accorgeva nessuno
     finche' non lo guardava il cliente.

     LA REGOLA, in una riga: l'ULTIMO fra virgola e punto e' quello dei
     decimali, tutti gli altri sono separatori delle migliaia.

       1.250,00  -> l'ultimo e' la virgola -> 1250
       1,250.00  -> l'ultimo e' il punto   -> 1250   (file in inglese)
       3,20      -> una virgola sola       -> 3,20
       3.20      -> un punto solo, 2 cifre -> 3,20
       1.250     -> un punto solo, 3 cifre -> 1250   (migliaia)
       0.500     -> comincia per zero      -> 0,50   (mai migliaia dopo lo 0)

     Sta in un posto solo apposta: la usano sia i moduli (_numIt) sia
     l'importazione del prezzario (_pzNum). Due copie della stessa regola si
     disallineano, ed e' li' che si nascondono i difetti. */
  function _numeroIt(testo){
    /* via euro, spazi normali, spazi insecabili e apostrofi delle migliaia */
    let t=String(testo==null?"":testo).replace(/[€\s '’]/g,"").trim();
    if(t==="")return null;
    const vir=t.lastIndexOf(","), pun=t.lastIndexOf(".");
    if(vir>=0&&pun>=0){
      if(vir>pun) t=t.replace(/\./g,"").replace(/,/g,".");   /* italiano */
      else        t=t.replace(/,/g,"");                      /* inglese  */
    }else if(vir>=0){
      /* piu' virgole e nessun punto = migliaia all'inglese (1,250,000) */
      t=((t.split(",").length-1)>1) ? t.replace(/,/g,"") : t.replace(",",".");
    }else if(pun>=0){
      const punti=t.split(".").length-1;
      const dopo=t.length-pun-1;
      /* prima dell'ultimo punto: se comincia per zero non sono migliaia
         (0.500 e' mezzo metro, non cinquecento) */
      const prima=t.slice(0,pun).replace(/\./g,"");
      const zeroDavanti=prima==="0"||prima==="-0"||/^-?0/.test(prima);
      if(punti>1||(dopo===3&&!zeroDavanti)) t=t.replace(/\./g,"");
    }
    const n=parseFloat(t);
    return isFinite(n)?n:null;
  }
  /* come _numIt ma per un campo dentro una riga (quantita' e prezzo delle
     voci di fattura e preventivo): stessa regola italiana, 2,5 = 2.5 */
  function _numRiga(riga,cls,seVuoto){
    const el=riga&&riga.querySelector(cls);
    const n=_numeroIt((el&&el.value)||"");
    return (n==null||!isFinite(n))?(seVuoto||0):n;
  }
  /* i numeri si scrivono come in cantiere: 3,20 va bene come 3.20 */
  function _numIt(sel){
    return _numeroIt(($(sel)&&$(sel).value)||"");
  }
  /* ===== 12 agosto 2026 (sera) — I NUMERI CON LA VIRGOLA =====
     Dieci caselle importanti erano type="number": sconto, bollo, spese e
     ritenuta della fattura, importo e ore del lavoro, spese del preventivo,
     importo del movimento carta, euro e litri del rifornimento.
     Su tastiera italiana si scrive «12,5»: una casella type=number con la
     virgola dentro non restituisce NIENTE, e quel numero spariva senza un
     messaggio — uno sconto di 12,50 € diventava zero e la fattura usciva
     sbagliata, senza che nessuno se ne accorgesse.
     Adesso sono caselle di testo col tastierino numerico (inputmode="decimal")
     lette da _numIt, e il numero torna scritto con la virgola, come lo ha
     scritto lui. _numTesto e' quello che lo rimette nella casella. */
  function _numTesto(v){
    if(v==null||v==="")return "";
    const n=+v;
    if(!isFinite(n))return "";
    /* 13 agosto 2026 — via la CODA della virgola mobile, non i decimali veri.
       Prima usciva il numero cosi' com'era e una somma si portava dietro la
       coda: 0,1 + 0,2 finiva nella casella come "0,30000000000000004", con la
       riga sotto che diceva "0,3 h". Diciotto cifre in una casella, e due
       numeri diversi per la stessa cosa nella stessa schermata.
       ⚠️ Il primo tentativo arrotondava al CENTESIMO, e quello era peggio del
       male: le quantita' sono numeric(12,3) (metri quadri, metri cubi, ore),
       quindi 12,345 diventava 12,35 solo ad APRIRE la fattura, e risalvando si
       fissava — su 100 € a unita' sono 50 centesimi di documento cambiati
       senza toccare niente. Sei decimali tolgono la coda binaria e non
       toccano nessun dato vero: le colonne piu' fini che abbiamo sono a
       quattro (i prezzi dei prezzari). */
    return String(Math.round(n*1e6)/1e6).replace(".",",");
  }
  /* un PREZZO si scrive sempre con ALMENO due decimali: 18,50 e non 18,5.
     _misTesto taglia gli zeri in coda — giusto per una misura, sbagliato qui.
     13 agosto 2026 — ma "almeno due", non "esattamente due": questa funzione
     riempie anche le caselle del Computo e del Prezzario, dove la colonna e'
     numeric(14,4) perche' i prezzari regionali i quattro decimali li usano.
     Con toFixed(2) bastava aprire una voce da 12,3456 e risalvarla per
     ritrovarsela a 12,35, senza aver toccato niente. */
  function _prezzoTesto(v){
    const n=Math.round((+v||0)*1e4)/1e4;
    let t=n.toFixed(4);
    while(t.endsWith("0")&&t.charAt(t.length-3)!==".")t=t.slice(0,-1);
    return t.replace(".",",");
  }
  /* ⚠️ UN PREZZO SI SCRIVE CON DUE DECIMALI — 14 agosto 2026 (notte).
     Le caselle del prezzo di riga (fatture e preventivi) usavano _numTesto,
     che taglia gli zeri in coda: un prezzo di 18,50 € si rileggeva «18,5».
     Sbagliato non e' il conto — il numero e' lo stesso — ma quello che si
     legge: su un documento che va al cliente un prezzo si scrive sempre con
     i centesimi, come su qualsiasi listino di questo mondo.
     _prezzoTesto esiste dal 13 agosto apposta («almeno due decimali, ma non
     esattamente due, che i prezzari regionali ne usano quattro»): qui non
     veniva usata. E' la stessa storia del «1,00 parti» del Computo, al
     contrario: la funzione giusta c'e', e nel posto sbagliato se ne usa
     un'altra.
     Il campo vuoto resta vuoto: «0,00» in una riga nuova sarebbe rumore. */
  function _prezzoCasella(v){
    return (v==null||v==="")?"":_prezzoTesto(v);
  }
  /* le misure si rileggono con la virgola e SEMPRE con due decimali: in un
     computo si scrive 3,20 e non 3,2, come su carta. Il terzo decimale compare
     solo se serve davvero (1,255), perche' in cantiere si misura al millimetro.
     Prima tagliava tutti gli zeri in coda e usciva "lung. 3,2". */
  function _misTesto(v){
    /* 13 agosto 2026 — il minimo restano DUE decimali (3,20 e non 3,2), ma il
       massimo non e' piu' tre: questa funzione riempie anche la casella della
       quantita' di una voce di computo, e gest_computo_voci.quantita e'
       numeric(16,5) — la colonna piu' fine di tutto il gestionale. Con tre
       decimali fissi bastava aprire una voce da 0,44825 e risalvarla per
       ritrovarsela a 0,448, senza aver toccato niente. */
    const n=Math.round((+v||0)*1e5)/1e5;
    let s=n.toFixed(5);
    while(s.endsWith("0")&&s.charAt(s.length-3)!==".")s=s.slice(0,-1);
    return s.replace(".",",");
  }
  /* La stessa misura, ma per le scritte che si LEGGONO e basta: tre decimali,
     come si e' sempre visto. _misTesto ne tiene cinque perche' riempie anche la
     casella della quantita' a corpo, dove i cinque servono per non perdere
     niente riaprendo; ma nell'elenco delle misure il valore lo calcola il
     database e nessuno lo riscrive, quindi le cifre in piu' sono solo rumore su
     una schermata fatta per leggersi a colpo d'occhio — e la regola e' meno
     confusione, non piu' precisione. */
  function _misLetta(v){
    /* identica alla _misTesto di prima, virgola per virgola: queste tre scritte
       devono restare ESATTAMENTE come si sono sempre lette. Niente Math.round
       davanti: cambierebbe i mezzi millimetri (6,7725 diventava 6,772 e non
       6,773), e qui non sto correggendo niente, sto solo non cambiando. */
    const n=+v||0;
    let s=n.toFixed(3);
    if(s.charAt(s.length-1)==="0")s=s.slice(0,-1);
    return s.replace(".",",");
  }
  /* le PARTI UGUALI sono un conteggio, non una misura: "1 parte", non "1,00 parte" */
  function _partiTesto(v){
    const n=(v==null||v==="")?1:(+v||0);
    return Number.isInteger(n)?String(n):_misTesto(n);
  }
  const UNITA=["m","m²","m³","kg","q","t","cad","n.","corpo","ora","giorno","l"];

  /* ⚠️ IL RIEMPIMENTO AUTOMATICO DI CHROME VA SPENTO SUL COMPUTO. 10 agosto 2026.
     Difetto vero, visto dal vivo: scrivendo "porta" nella descrizione della
     misura, Chrome proponeva la tendina grigia e — cliccandola — riempiva DA
     SOLO anche lunghezza e altezza con i valori di una misura di settimane
     prima. Risultato: una porta alta 2,70 invece di 2,10, e un computo
     sbagliato senza un solo messaggio d'errore. E' successo tre volte di fila.
     Su un preventivo un valore di troppo si vede; su un computo metrico no,
     perche' i numeri sono tutti plausibili.

     Non basta autocomplete="off": Chrome lo ignora quando riconosce il campo
     dal nome o dall'id. Per questo ogni campo prende anche un NOME A CASO a
     ogni disegno: cosi' non somiglia a niente che Chrome abbia in memoria e
     non ha niente da proporre. */
  function _noAuto(){
    return ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"'
      +' name="n'+Math.random().toString(36).slice(2,10)+'"';
  }

  /* una percentuale si scrive corta: 10 e non 10,000; 10,5 resta 10,5 */
  function _pct(n){
    const s=(+n||0).toFixed(3).replace(/0+$/,"").replace(/\.$/,"");
    return s.replace(".",",");
  }

  /* ============================================================
     IL RIEPILOGO DEI SOLDI — UNA FORMULA SOLA, IN TRE POSTI
     ============================================================
     L'elenco dei computi, la scheda del computo e il PDF devono dire lo stesso
     numero. Prima il RIBASSO non lo applicava nessuno dei tre: lo scrivevi nel
     modulo, si salvava, e non succedeva niente — il totale restava quello pieno.
     Su una gara e' la differenza fra vincere e non vincere, e a schermo non si
     vedeva niente di strano.

     Adesso il conto sta SOLO qui dentro. Chi ha bisogno di un totale chiama
     questa: non si riscrive la formula da nessun'altra parte. E' la stessa
     lezione delle fatture, dove la stessa formula in tre posti dava tre numeri.

     Gli ONERI DELLA SICUREZZA non sono soggetti a ribasso: e' la regola delle
     gare pubbliche. Si tolgono dal totale, il ribasso si applica sul resto, poi
     si rimettono. Sui lavori privati sono zero e la formula torna a essere il
     semplice sconto sul totale. */
  function compRiepilogoDa(lordo,sicurezza,manodopera,comp){
    const c2=n=>Math.round((+n||0)*100)/100;
    const L=c2(lordo);
    /* ⚠️ GLI ONERI FANTASMA — 14 agosto 2026.
       I due campi di gara (costo del personale e oneri della sicurezza) si
       vedono SOLO sui computi «Lavori pubblici». Se poi il computo torna
       «privato», spariscono dal modulo ma restano scritti nelle voci —
       compVoceSalva li lascia apposta, per non azzerare il lavoro fatto.
       Qui pero' venivano sommati lo stesso, e lo sconto finiva calcolato su
       (totale − oneri) invece che sul totale.
       Riprodotto nel browser: computo privato da 100.000 con 5.000 di oneri
       rimasti e sconto 20% → il gestionale scriveva 81.000 invece di 80.000.
       Mille euro di differenza, e nella schermata non c'era nessun numero
       che li spiegasse: il campo che li causa non si vede piu'.
       «Non soggetti a ribasso» e' una regola delle GARE PUBBLICHE. Su un
       lavoro privato quei numeri non contano, punto. */
    const pubblico=!!(comp&&comp.tipo==="pubblico");
    let S=pubblico?c2(sicurezza):0;
    /* e non possono essere piu' del totale: con oneri piu' grandi del lordo
       la parte ribassabile diventava negativa e lo sconto FACEVA SALIRE il
       conto (100 di lavori con 500 di oneri e sconto 10% → netto 140). */
    if(S>L)S=L;
    if(S<0)S=0;
    const MO=pubblico?c2(manodopera):0;
    /* lo sconto sta fra 0 e 100: sopra il 100 il totale andava sotto zero
       (sconto 150% su 1.000 → −500 €, cioe' i soldi li dai tu al cliente),
       sotto zero era un aumento travestito da sconto (−10% → 1.100 €).
       Il paracadute sta qui perche' i numeri storti possono essere gia'
       scritti nel database; al salvataggio c'e' anche l'avviso. */
    let perc=(comp&&comp.ribasso_perc!=null&&comp.ribasso_perc!=="")?(+comp.ribasso_perc||0):0;
    if(!isFinite(perc))perc=0;
    if(perc<0)perc=0;
    if(perc>100)perc=100;
    const soggetto=c2(L-S);
    const ribasso=c2(soggetto*perc/100);
    return {lordo:L, perc:perc, ribasso:ribasso, netto:c2(soggetto-ribasso+S),
            sicurezza:S, manodopera:MO};
  }
  /* la stessa cosa partendo dalle voci gia' calcolate (vista gest_computo_voci_calc) */
  function compRiepilogo(voci,comp){
    const V=voci||[];
    return compRiepilogoDa(
      V.reduce((s,v)=>s+(+v.importo||0),0),
      V.reduce((s,v)=>s+(+v.oneri_sicurezza||0),0),
      V.reduce((s,v)=>s+(+v.importo||0)*(+v.incidenza_manodopera||0)/100,0),
      comp);
  }
  /* ============================================================
     19 agosto 2026 — IL QUADRO ECONOMICO DEI LAVORI PUBBLICI
     ============================================================
     Il computo dice quanto costano i LAVORI. Il quadro economico dice quanto
     costa l'OPERA: è il numero che finisce nella delibera, e senza quello un
     progetto per un ente pubblico non si consegna.

     Due parti, e la differenza fra le due è tutta qui:

       A · LAVORI — non si scrive niente, viene dal computo.
       B · SOMME A DISPOSIZIONE della stazione appaltante — si scrive: spese
           tecniche, imprevisti, allacciamenti, IVA, incentivi.

       TOTALE = A + B

     ⚠️ IL COSTO DELLA MANODOPERA NON SI SOMMA. Sta DENTRO i lavori: è un
     «di cui», non un addendo. È lo stesso inganno degli oneri della sicurezza
     chiuso l'11 agosto sul PDF del computo — chi riceve il foglio somma le
     righe con la calcolatrice, e se il conto non torna te lo fa rispiegare.
     Qui la manodopera si scrive su una riga sua, indentata, che dice «di cui»
     e non entra in nessuna somma.

     LE PERCENTUALI si contano sul TOTALE A, cioè lo stesso numero che si legge
     in fondo alle lavorazioni. Una riga o è in euro o è in percentuale: se c'è
     la percentuale, l'euro scritto a mano non conta più (e si vede, perché il
     gestionale riscrive il valore calcolato accanto).

     LA LISTA È UN PUNTO DI PARTENZA, non una legge: ogni stazione appaltante
     piega il quadro economico a modo suo. Le righe si cancellano e se ne
     aggiungono.

     Riferimenti: D.Lgs. 36/2023 come modificato dal D.Lgs. 209/2024;
     incentivi per funzioni tecniche art. 45 (il 2% è il tetto, non un
     obbligo); imprevisti di norma fra il 5 e il 10%. */
  const QE_VOCI=[
    {d:"Lavori in economia, esclusi dall'appalto"},
    {d:"Rilievi, accertamenti e indagini"},
    {d:"Allacciamenti ai pubblici servizi"},
    {d:"Imprevisti", p:5},
    {d:"Acquisizione aree o immobili"},
    {d:"Accantonamenti (artt. 60 e 120): revisione prezzi e accordo bonario"},
    {d:"Spese tecniche: progettazione, direzione lavori, CSP e CSE, contabilità"},
    {d:"Incentivi per funzioni tecniche (art. 45)", p:2},
    {d:"Commissioni giudicatrici, pubblicità, collaudi e prove di laboratorio"},
    {d:"IVA sui lavori", p:10},
    {d:"IVA e cassa previdenziale sulle spese tecniche"}
  ];
  /* il tetto di legge dell'art. 45: sopra si avvisa, non si blocca (il quadro
     economico si scrive anche per opere dove la percentuale è un'altra) */
  const QE_INCENTIVI_MAX=2;
  /* le righe di un computo: quelle salvate, o l'elenco standard tutto a zero.
     Una riga senza descrizione non è una riga: si butta in lettura, se no
     bastava un Salva di troppo per riempire il quadro di vuoti. */
  function qeRighe(c){
    const dentro=c&&c.quadro_economico;
    const l=Array.isArray(dentro)?dentro:(dentro&&Array.isArray(dentro.righe)?dentro.righe:null);
    if(!l)return QE_VOCI.map(v=>({d:v.d, e:null, p:(v.p!=null?v.p:null)}));
    return l.filter(r=>r&&String(r.d||"").trim())
            .map(r=>({d:String(r.d), e:(r.e==null||r.e==="")?null:(+r.e||0),
                      p:(r.p==null||r.p==="")?null:(+r.p||0)}));
  }
  /* il conto. totaleA è il «Totale del computo»: lo stesso numero che si legge
     in fondo alle lavorazioni, ribasso già applicato se c'è. */
  function qeCalcola(righe,totaleA){
    const c2=n=>{const v=+n; return isFinite(v)?Math.round(v*100)/100:0;};
    const A=c2(totaleA);
    const out=(righe||[]).map(function(r){
      let p=(r&&r.p!=null&&r.p!=="")?+r.p:null;
      if(p!=null&&!isFinite(p))p=null;
      /* una percentuale negativa è un aumento travestito, e sopra il 100 è
         un errore di battitura: stessi paracadute del ribasso d'asta */
      if(p!=null){ if(p<0)p=0; if(p>100)p=100; }
      const importo=(p!=null)?c2(A*p/100):c2(r&&r.e);
      return {d:(r&&r.d)||"", p:p, e:(p!=null)?null:c2(r&&r.e), importo:importo};
    });
    const B=c2(out.reduce((s,r)=>s+r.importo,0));
    return {righe:out, totaleA:A, totaleB:B, totale:c2(A+B)};
  }
  /* ---- il quadro economico dentro il modulo del computo ---- */
  function qeRigaHtml(r){
    r=r||{};
    const inPerc=(r.p!=null&&r.p!=="");
    return '<div class="qe-riga" data-qe>'
      +'<input class="qe-d" placeholder="Voce del quadro economico" value="'+esc(r.d||"")+'">'
      +'<input class="qe-e" type="text" inputmode="decimal" placeholder="€" value="'+(inPerc?"":_numTesto(r.e))+'">'
      +'<input class="qe-p" type="text" inputmode="decimal" placeholder="%" value="'+(inPerc?_numTesto(r.p):"")+'">'
      +'<span class="qe-v"></span>'
      +'<button type="button" class="rdel" data-action="qe-riga-del">×</button></div>';
  }
  /* il Totale A si legge SEMPRE dal modulo aperto, non dalla riga salvata: il
     ribasso lo puoi aver appena scritto e non ancora salvato, e un quadro
     economico che si basa sul numero di ieri è peggio di uno vuoto. */
  function qeBaseA(){
    const e=$("#co-rib");
    let rib=null;
    if(e){const n=_numeroIt(e.value); rib=(n==null||!isFinite(n))?null:n;}
    const mie=(String(compVociCompId||"")===String(ctrComputoId||""))?(compVociCache||[]):[];
    return compRiepilogo(mie,{tipo:segVal("co-tipo")||"privato", ribasso_perc:rib});
  }
  function qeLetto(){
    const out=[];
    $$("#co-qe-righe [data-qe]").forEach(function(d){
      const el=d.querySelector(".qe-d");
      const desc=el?el.value.trim():"";
      if(!desc)return;
      const leggi=function(cls){
        const x=d.querySelector(cls);
        const n=_numeroIt((x&&x.value)||"");
        return (n==null||!isFinite(n))?null:n;
      };
      const p=leggi(".qe-p");
      out.push({d:desc, e:(p!=null)?null:leggi(".qe-e"), p:p});
    });
    return out;
  }
  function qeMostra(){
    const box=$("#co-qe-box"); if(!box)return;
    box.style.display=(segVal("co-tipo")==="pubblico")?"":"none";
    qeAggiorna();
  }
  function qeAggiorna(){
    const box=$("#co-qe-righe"); if(!box)return;
    const rp=qeBaseA();
    const q=qeCalcola(qeLetto(),rp.netto);
    /* ---- A: i numeri del computo, senza scrivere niente ---- */
    const riga=(et,v,cls)=>'<div class="qe-r'+(cls?" "+cls:"")+'"><span>'+esc(et)+'</span><b>'+eur2(v)+'</b></div>';
    let a=riga("Lavori a corpo e a misura",Math.round((rp.lordo-rp.sicurezza)*100)/100);
    if(rp.sicurezza)a+=riga("Oneri della sicurezza, non soggetti a ribasso",rp.sicurezza);
    if(rp.perc&&rp.ribasso)a+=riga("Ribasso d'asta "+_pct(rp.perc)+"% sulla parte ribassabile",-rp.ribasso);
    a+=riga("Totale A · LAVORI",q.totaleA,"qe-r--tot");
    /* ⚠️ «di cui»: la manodopera sta GIÀ dentro i lavori. Sta sotto il Totale A
       apposta, indentata e con il verbo, così non la si somma per sbaglio. */
    if(rp.manodopera)a+=riga("di cui costo della manodopera (non soggetto a ribasso)",rp.manodopera,"qe-r--dicui");
    const elA=$("#co-qe-a"); if(elA)elA.innerHTML=a;
    /* ---- il valore calcolato accanto a ogni riga di B ----
       ⚠️ 19 agosto 2026 — «$$» È querySelectorAll E BASTA (riga 471), quindi
       restituisce una NodeList: ha forEach, NON ha filter e non ha map.
       Qui c'era un .filter, e sul sito vero non dava un numero sbagliato:
       spaccava qeAggiorna, che veniva chiamata da compForm PRIMA di
       renderCompVoci — quindi le lavorazioni non partivano nemmeno e il
       computo restava a «Sto caricando…» per sempre.
       Un difetto di una riga che spegne una schermata intera. Il banco non
       l'aveva visto perché il suo finto $$ restituiva un elenco vero: adesso
       è avaro come il browser. */
    const nodi=[];
    $$("#co-qe-righe [data-qe]").forEach(function(d){
      const e=d.querySelector(".qe-d");
      if(e&&e.value.trim())nodi.push(d);
    });
    nodi.forEach(function(d,i){
      const v=d.querySelector(".qe-v"), eu=d.querySelector(".qe-e");
      const r=q.righe[i]; if(!r)return;
      const inPerc=(r.p!=null);
      if(eu){eu.classList.toggle("qe-spenta",inPerc); eu.placeholder=inPerc?"—":"€";}
      if(v)v.textContent=eur2(r.importo);
    });
    /* ---- i totali ---- */
    const t=$("#co-qe-tot");
    if(t){
      let h=riga("Totale B · SOMME A DISPOSIZIONE",q.totaleB,"qe-r--tot");
      h+='<div class="qe-r qe-r--gran"><span>TOTALE QUADRO ECONOMICO</span><b>'+eur2(q.totale)+'</b></div>';
      /* il 2% dell'art. 45 è un tetto: si dice, non si blocca */
      const inc=q.righe.find(r=>/incentiv/i.test(r.d||""));
      if(inc&&inc.p!=null&&inc.p>QE_INCENTIVI_MAX)
        h+='<div class="qe-avv">Gli incentivi per funzioni tecniche sono al '+_pct(inc.p)+'%: l\'art. 45 mette il tetto al '+QE_INCENTIVI_MAX+'%.</div>';
      if(!q.totaleA)
        h+='<div class="qe-avv">Il Totale A è zero: finché il computo non ha lavorazioni con le misure, le percentuali non hanno su cosa contarsi.</div>';
      t.innerHTML=h;
    }
  }
  /* dall'elenco: li' non ci sono le voci, ci sono i totali della vista */
  function compNetto(c){
    const t=compTot[c.id]||{};
    return compRiepilogoDa(t.importo,t.oneri_sicurezza,t.importo_manodopera,c).netto;
  }

  /* ============================================================
     20 agosto 2026 — IL CONFRONTO DELLA VARIANTE
     ============================================================
     varConfronta(orig, nuove) mette a fianco le lavorazioni del computo
     di partenza e quelle della variante, e dice cosa e' cambiato.

     ⛔ SI ACCOPPIANO PER origine_id, NON PER CODICE NE' PER DESCRIZIONE.
        Due lavorazioni possono avere lo stesso codice di tariffa in due
        capitoli diversi (la stessa demolizione al piano terra e al
        primo), e una descrizione si puo' correggere. Accoppiando per
        codice, due righe uguali si confonderebbero fra loro; accoppiando
        per descrizione, una riga a cui hai corretto un refuso
        risulterebbe «tolta» e «nuova» insieme — e la variante direbbe
        una bugia proprio nel documento che serve a non litigare.

     Una riga finisce in uno di tre elenchi:
       CAMBIATE  ha un'origine, e quantita' o prezzo sono diversi
       NUOVE     non ha origine (l'hai aggiunta nella variante)
       TOLTE     era nell'originale e nella variante non c'e' piu'

     Le righe rimaste identiche non compaiono: in un elenco di ottantasette
     righe, le sei che sono cambiate devono saltare all'occhio.
     ============================================================ */
  function varConfronta(orig,nuove){
    const O=Array.from(orig||[]), N=Array.from(nuove||[]);
    const perId={}; O.forEach(function(v){ perId[String(v.id)]=v; });
    const usate={};
    const cambiate=[], aggiunte=[];

    N.forEach(function(v){
      const o=v.origine_id?perId[String(v.origine_id)]:null;
      if(!o){ aggiunte.push(v); return; }
      usate[String(o.id)]=true;
      const qA=+o.quantita||0,  qB=+v.quantita||0;
      const pA=+o.prezzo_unitario||0, pB=+v.prezzo_unitario||0;
      /* ⚠️ i soldi si confrontano al centesimo, non con «===»: due numeri
         che vengono dal database possono differire di un miliardesimo per
         come sono stati scritti, e una riga mai toccata comparirebbe fra
         quelle cambiate. La quantita' ha tre decimali (vedi la vista). */
      const dQ=Math.abs(qA-qB)>0.0005, dP=Math.abs(pA-pB)>0.005;
      if(dQ||dP)cambiate.push({voce:v, prima:o, qA:qA, qB:qB, pA:pA, pB:pB,
                               impA:qA*pA, impB:qB*pB, dQ:dQ, dP:dP});
    });

    const tolte=O.filter(function(o){ return !usate[String(o.id)]; });

    /* i tre numeri in fondo: quanto valevano le lavorazioni prima, quanto
       valgono adesso, e la differenza. Sono gli importi delle righe, senza
       ribasso: il ribasso lo aggiunge chi legge, ed e' lo stesso sui due. */
    const somma=function(a,f){ return a.reduce(function(s,x){ return s+(+f(x)||0); },0); };
    const impOrig=somma(O,function(v){ return (+v.quantita||0)*(+v.prezzo_unitario||0); });
    const impVar =somma(N,function(v){ return (+v.quantita||0)*(+v.prezzo_unitario||0); });

    return { cambiate:cambiate, aggiunte:aggiunte, tolte:tolte,
             impOrig:impOrig, impVar:impVar, diff:impVar-impOrig,
             /* la percentuale non esiste se prima non c'era niente: dividere
                per zero darebbe «Infinity%» stampato sul documento */
             perc:(impOrig>0)?((impVar-impOrig)*100/impOrig):null,
             uguali:N.length-cambiate.length-aggiunte.length };
  }

  /* ============================================================
     ⚠️ 21 agosto 2026 — LA VISTA CHE NON DICEVA DA DOVE VIENE UNA RIGA
     ============================================================
     Il 20 agosto e' stata aggiunta la colonna «origine_id» alla TABELLA
     gest_computo_voci. Ma il gestionale non legge la tabella: legge la
     VISTA gest_computo_voci_calc, che elenca le colonne una per una — e
     origine_id non c'era. Risultato: alla schermata arrivava sempre
     vuoto, e varConfronta faceva l'unica cosa che poteva fare: dichiarare
     AGGIUNTA ogni riga della variante e TOLTA ogni riga dell'originale.
     Su una variante appena creata, identica al computo di partenza, la
     pagina elencava tutte le lavorazioni due volte invece di dire «non e'
     cambiato niente». E il totale in fondo restava GIUSTO — le righe
     uguali si annullano comunque — quindi dai numeri non si vedeva.

     Risolto con sql/gest-variante-origine-vista.sql. Ma il gestionale non
     deve fidarsi che l'aggiornamento sia stato eseguito: se la colonna non
     arriva, NON si mostra un confronto sbagliato, si dice cosa eseguire.
     E' la stessa scelta gia' fatta per «giorni» e «insieme» del
     cronoprogramma: meglio una pagina che dice cosa fare, che una pagina
     che racconta una bugia con l'aria di essere giusta.

     ⛔ SI GUARDA SE LA CHIAVE C'E', non se ha un valore. Su un computo di
        partenza origine_id e' legittimamente vuoto su TUTTE le righe:
        controllare il valore direbbe «vista vecchia» ogni volta.
     ============================================================ */
  function varVistaSenzaOrigine(orig,nuove){
    const riga=((nuove||[])[0])||((orig||[])[0]);
    if(!riga)return false;                    /* niente righe: niente da dire */
    return !Object.prototype.hasOwnProperty.call(riga,"origine_id");
  }

  async function renderVariante(c){
    const box=$("#co-var"); if(!box)return;
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}

    /* ⚠️ IL COMPUTO DI PARTENZA PUO' NON ESSERCI PIU'. La colonna e'
       «on delete set null»: cancellandolo la variante resta ma non ha
       piu' con cosa confrontarsi. Va detto, non vanno mostrati numeri
       inventati. */
    if(!c.variante_di){
      box.innerHTML='<div class="lm-vuoto">Questo computo non è una variante.</div>';
      return;
    }
    const [rO,rN]=await Promise.all([
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",c.variante_di).order("ordine"),
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",c.id).order("ordine")
    ]);
    if(rO.error||rN.error){
      const e=rO.error||rN.error;
      box.innerHTML='<div class="lm-vuoto">'+(/origine_id|variante_di/i.test(String(e.message||""))
        ? 'Per la variante serve l\'aggiornamento del database: esegui <b>sql/gest-computo-variante.sql</b> su Supabase.'
        : 'Non riesco a leggere il confronto: '+esc(e.message))+'</div>';
      return;
    }
    const orig=rO.data||[];
    if(varVistaSenzaOrigine(orig,rN.data)){
      box.innerHTML='<div class="co-vuoto">'
        +'<div class="co-vuoto-ic">🔧</div>'
        +'<h4>Manca un aggiornamento del database</h4>'
        +'<p>Senza, non posso dire quale riga nasce da quale: elencherei <b>tutte</b> le lavorazioni come aggiunte e tolte, e sarebbe una bugia.<br>Esegui <b>sql/gest-variante-origine-vista.sql</b> su Supabase, poi riapri questa pagina.</p>'
        +'</div>';
      return;
    }
    const part=compCache.find(x=>String(x.id)===String(c.variante_di));
    if(!orig.length&&!part){
      box.innerHTML='<div class="co-vuoto">'
        +'<div class="co-vuoto-ic">🔍</div>'
        +'<h4>Il computo di partenza non c\'è più</h4>'
        +'<p>Questa variante resta e funziona come un computo normale, ma non c\'è più niente con cui confrontarla. Se il computo di partenza è nel <b>Cestino</b>, rimettilo a posto e qui torna tutto.</p>'
        +'</div>';
      return;
    }

    const r=varConfronta(orig,rN.data||[]);
    const nome=part?(part.titolo||"(senza titolo)"):"il computo di partenza";

    const riga=function(t,dx,sx,cls){
      return '<div class="spesa-row'+(cls?' '+cls:'')+'"><span>'+t+(sx?'<small class="sp-forn">'+sx+'</small>':'')+'</span><b>'+dx+'</b><span></span></div>';
    };
    /* «cm-testo»: e' testo del computo, non nostro — non si traduce */
    const nomeVoce=function(v){
      return '<span class="cm-testo">'+(v.codice?'<b>'+esc(v.codice)+'</b> · ':'')
        +esc(v.descrizione||"(senza descrizione)")+'</span>';
    };

    let h='<div class="sh-nota">Rispetto a <b>'+esc(nome)+'</b>. Le lavorazioni rimaste uguali non compaiono: qui c\'è solo quello che è cambiato'
      +(r.uguali>0?' ('+r.uguali+(r.uguali===1?' riga uguale':' righe uguali')+' non elencate)':'')+'.</div>';

    if(!r.cambiate.length&&!r.aggiunte.length&&!r.tolte.length){
      h+='<div class="co-vuoto"><div class="co-vuoto-ic">✅</div>'
        +'<h4>Per ora non è cambiato niente</h4>'
        +'<p>La variante è ancora identica al computo di partenza. Vai su <b>1 Lavorazioni</b>, cambia le quantità come sono andate davvero, e qui compare l\'elenco delle differenze.</p></div>';
    }

    if(r.cambiate.length){
      h+='<div class="var-tit">Cambiate <span class="var-n">'+r.cambiate.length+'</span></div>';
      r.cambiate.forEach(function(x){
        const d=x.impB-x.impA;
        const dettaglio=[];
        if(x.dQ)dettaglio.push('quantità '+_misTesto(x.qA)+' → <b>'+_misTesto(x.qB)+'</b>'+(x.voce.unita?' '+esc(x.voce.unita):''));
        if(x.dP)dettaglio.push('prezzo '+eur2(x.pA)+' → <b>'+eur2(x.pB)+'</b>');
        h+=riga(nomeVoce(x.voce),
                (d>=0?'+ ':'− ')+eur2(Math.abs(d)),
                dettaglio.join(' · '),
                d>=0?'var-piu':'var-meno');
      });
    }
    if(r.aggiunte.length){
      h+='<div class="var-tit">Aggiunte <span class="var-n">'+r.aggiunte.length+'</span></div>';
      r.aggiunte.forEach(function(v){
        const imp=(+v.quantita||0)*(+v.prezzo_unitario||0);
        h+=riga(nomeVoce(v),'+ '+eur2(imp),
                _misTesto(v.quantita)+(v.unita?' '+esc(v.unita):'')+' × '+eur2(v.prezzo_unitario),
                'var-piu');
      });
    }
    if(r.tolte.length){
      h+='<div class="var-tit">Tolte <span class="var-n">'+r.tolte.length+'</span></div>';
      r.tolte.forEach(function(v){
        const imp=(+v.quantita||0)*(+v.prezzo_unitario||0);
        h+=riga(nomeVoce(v),'− '+eur2(imp),
                'era '+_misTesto(v.quantita)+(v.unita?' '+esc(v.unita):'')+' × '+eur2(v.prezzo_unitario),
                'var-meno');
      });
    }

    /* i tre numeri che contano, in fondo e in grande */
    /* ⚠️ 21 agosto 2026 — LO ZERO NON È «IN PIÙ», E NON È ROSSO.
       Il colore si sceglieva con «diff>=0», e lo zero ci finiva dentro: su
       una variante ancora identica si leggeva «In più + 0,00 € (+0%)» in
       rosso, cioè il colore che vuol dire «costa di più». E capita anche
       per davvero, non solo su una variante appena creata: se togli 500 €
       da una lavorazione e ne aggiungi 500 su un'altra, la differenza è
       zero. Visto da Alessio in una foto dello schermo.
       Il centesimo è la soglia: sotto, sul documento si legge comunque
       «0,00» — dire che è cambiato qualcosa sarebbe una bugia stampata. */
    const _pari=Math.abs(r.diff)<0.005;
    h+='<div class="var-conto">'
      +  '<div class="var-r"><span>Computo di partenza</span><b>'+eur2(r.impOrig)+'</b></div>'
      +  '<div class="var-r"><span>Variante</span><b>'+eur2(r.impVar)+'</b></div>'
      +  '<div class="var-r var-tot'+(_pari?' pari':(r.diff>0?' su':' giu'))+'"><span>'
      +    (_pari?'Nessuna differenza':(r.diff>0?'In più':'In meno'))+'</span><b>'
      +    (_pari?eur2(0):((r.diff>0?'+ ':'− ')+eur2(Math.abs(r.diff))))
      +    ((!_pari&&r.perc!=null)?' <small>('+(r.diff>0?'+':'−')+_pct(Math.abs(r.perc))+'%)</small>':'')
      +  '</b></div>'
      +'</div>'
      +'<div class="sh-nota">Sono gli importi delle lavorazioni, <b>senza il ribasso</b>: il ribasso è lo stesso sui due computi e non cambia la differenza in percentuale.</div>';

    /* ⚠️ 21 agosto 2026 — IL FOGLIO STAMPATO.
       Sui lavori privati la variante detta a voce e' dove nascono le liti;
       sui lavori pubblici e' un documento che si consegna. In tutti e due i
       casi a schermo non basta: ci vuole un foglio con sopra una firma.
       Il pulsante c'e' SOLO se qualcosa e' cambiato davvero: su due computi
       identici stamperebbe un foglio che non dice niente. */
    if(r.cambiate.length||r.aggiunte.length||r.tolte.length){
      h+='<div class="var-stampa">'
        +  '<button type="button" class="btn" data-action="var-pdf">📄 Scarica il computo di variante</button>'
        +'</div>';
    }
    box.innerHTML=h;
  }

  /* ============================================================
     20 agosto 2026 (sera) — IL CRONOPROGRAMMA
     ============================================================
     Le fasi del lavoro sul calendario: quando comincia ognuna e quanto
     dura. Sui lavori pubblici e' obbligatorio; a un'impresa serve per
     sapere quando mandare la squadra e quando ordinare i materiali.

     LA DURATA STA SUL CAPITOLO, NON SULLA SINGOLA LAVORAZIONE.
     Su un computo da 87 righe scrivere 87 durate e' una serata di
     lavoro, e nessuno programma la singola voce di prezzario: in
     cantiere si ragiona per fasi. Sei numeri invece di ottantasette.

     ⛔ LE DATE NON SI SCRIVONO NEL DATABASE, SI CALCOLANO.
        Nel database stanno solo la data di partenza (gest_computi.
        data_inizio) e le durate (gest_computo_capitoli.giorni). Chi
        comincia quando lo decide cronoDate. Se le date fossero scritte,
        basterebbe spostare l'inizio del cantiere di un giorno per
        averle tutte sbagliate senza che nessuno se ne accorga: e'
        la stessa scelta della quantita' delle lavorazioni, che il
        gestionale legge e non scrive mai.
     ============================================================ */

  /* Una data da «2026-09-14», tenuta a MEZZOGIORNO.
     ⚠️ ONESTA': il mezzogiorno e' una cintura, e il banco NON la fa
     diventare rossa. Ho provato a metterla a mezzanotte e a far girare
     tutto su cinque fusi orari con l'ora legale che cambia di notte
     (Santiago, Beirut, L'Avana, San Paolo, Teheran), sette anni di date:
     zero differenze. La lascio perche' non costa niente e perche' con
     l'ora legale i conti a mezzanotte sono l'unico posto dove un giorno
     puo' sparire — ma non si scrive «provata» una cosa che il banco non
     accusa. */
  /* ⚠️ 21 agosto 2026 — L'ORA DI TUTTE LE DATE SI DECIDE QUI, IN UN POSTO
     SOLO. Prima il mezzogiorno era scritto dentro _cgData; poi e' arrivato
     cronoMesi, che costruisce il primo giorno di ogni mese, e se l'avesse
     scritto per conto suo basterebbe cambiarne una delle due per far
     ballare di un'ora i conti dei giorni — e i mesi del calendario
     stampato non coprirebbero piu' esattamente il cantiere.
     Stessa lezione della formula della barra: due copie non si aggiustano
     insieme. */
  function _cgGiorno(y,m,g){ return new Date(y,m,g,12,0,0); }
  function _cgData(t){
    if(!t)return null;
    const p=String(t).split("-");
    if(p.length!==3)return null;
    const d=_cgGiorno(+p[0],(+p[1])-1,+p[2]);
    return isNaN(d.getTime())?null:d;
  }
  function _cgIso(d){
    if(!d)return "";
    const m=String(d.getMonth()+1).padStart(2,"0"), g=String(d.getDate()).padStart(2,"0");
    return d.getFullYear()+"-"+m+"-"+g;
  }
  /* sabato e domenica non sono giorni di lavoro: una durata di 5 giorni
     scritta da un capomastro vuol dire una settimana, non «lunedi' a
     venerdi' contando il weekend». Se il cantiere comincia di sabato,
     comincia davvero il lunedi'. */
  function _cgFeriale(d){ const g=d.getDay(); return g!==0&&g!==6; }
  function _cgPrimoLav(d){
    const x=new Date(d.getTime());
    let giri=0;
    while(!_cgFeriale(x)&&giri<10){ x.setDate(x.getDate()+1); giri++; }
    return x;
  }
  function _cgDopo(d){ const x=new Date(d.getTime()); x.setDate(x.getDate()+1); return _cgPrimoLav(x); }
  /* il giorno in cui si finisce partendo da «inizio» e lavorando n giorni:
     il primo giorno e' compreso, quindi n=1 finisce il giorno stesso */
  function _cgFine(inizio,n){
    if(!(n>0))return null;
    let x=new Date(inizio.getTime()), fatti=1;
    /* il paletto a 4000 giri e' una rete contro una durata assurda
       arrivata da fuori (il database ne accetta al massimo 2000, ma
       questa funzione la chiama anche l'anteprima, che legge quello che
       stai scrivendo). 4000 giorni di lavoro sono gia' piu' di quindici
       anni: oltre, non e' un cantiere, e' un errore di battitura. */
    let giri=0;
    while(fatti<n&&giri<4000){ x=_cgDopo(x); fatti++; giri++; }
    return x;
  }
  /* quanti giorni di calendario passano fra due date (per disegnare le barre) */
  function _cgQuanti(a,b){ return Math.round((b.getTime()-a.getTime())/86400000); }

  /* ============================================================
     IL CONTO — una funzione sola, e la SOLA che decide le date.
     Ogni capitolo comincia quando finisce il precedente. Con la spunta
     «insieme» comincia invece nello stesso giorno del precedente: e' il
     caso vero delle fasi in parallelo (mentre l'idraulico fa i tubi,
     l'elettricista tira i cavi).
     ⚠️ Dopo un gruppo in parallelo si riparte dal PIU' LUNGO dei due,
        non dall'ultimo scritto: se le murature durano 12 giorni e gli
        impianti 20, gli intonaci non cominciano dopo 12.
     Un capitolo senza durata non occupa tempo e non sposta niente: e'
     una riga ancora da riempire, non una fase da zero giorni.
     ============================================================ */
  function cronoDate(caps,inizioTesto){
    const out=[];
    const base=_cgData(inizioTesto);
    if(!base)return caps.map(function(c){return {cap:c,inizio:null,fine:null,giorni:(+c.giorni||0)};});
    let cursore=_cgPrimoLav(base);
    let gruppoInizio=cursore, gruppoFine=null;
    (caps||[]).forEach(function(c,i){
      const gg=Math.max(0,+c.giorni||0);
      /* ⚠️ ONESTA': «i>0» non cambia il risultato — sulla PRIMA fase i due
         rami finiscono nello stesso punto, e infatti il sabotaggio che lo
         toglie lascia il banco verde. Resta scritto perche' dice
         l'intenzione (insieme a chi, se prima non c'e' nessuno?), non
         perche' serva al conto. */
      const parallelo=(i>0&&!!c.insieme);
      let inizio;
      if(parallelo){
        inizio=gruppoInizio;
      }else{
        if(gruppoFine)cursore=_cgDopo(gruppoFine);
        inizio=cursore; gruppoInizio=inizio; gruppoFine=null;
      }
      const fine=gg>0?_cgFine(inizio,gg):null;
      if(fine&&(!gruppoFine||fine.getTime()>gruppoFine.getTime()))gruppoFine=fine;
      out.push({cap:c, inizio:(gg>0?inizio:null), fine:fine, giorni:gg, parallelo:parallelo});
    });
    return out;
  }

  /* la fine di tutto il cantiere: la data piu' lontana fra tutte le fasi */
  function cronoUltimo(righe){
    let f=null;
    (righe||[]).forEach(function(r){ if(r.fine&&(!f||r.fine.getTime()>f.getTime()))f=r.fine; });
    return f;
  }

  /* ============================================================
     COME SI DISEGNA UNA RIGA — in un posto solo.
     ⚠️ Queste tre funzioni nascono da un difetto vero, trovato dal
     sabotaggio «le barre non sono piu' proporzionali»: la formula della
     barra era scritta DUE volte, in renderCrono e in cronoAnteprima.
     Rompendola in una sola delle due il banco restava verde, perche' a
     schermo vinceva l'altra. E' la lezione che torna: una regola che
     vive in due posti non si puo' aggiustare a meta'.
     ============================================================ */
  function _cgTesto(r){
    return (r.giorni>0&&r.inizio&&r.fine)
      ? (fdate(_cgIso(r.inizio))+" \u2192 "+fdate(_cgIso(r.fine)))
      : "manca la durata";
  }
  /* DOVE COMINCIA E QUANTO E' LUNGA UNA BARRA, in percentuale dell'arco.
     \u26a0\ufe0f 21 agosto 2026 \u2014 QUESTA FORMULA STA IN UN POSTO SOLO, e adesso il
     motivo e' doppio: la usano il disegno a schermo (_cgBarra) e il foglio
     stampato (cronoPdf). Se il PDF se la riscrivesse per conto suo, prima o
     poi il calendario sullo schermo e quello sulla carta direbbero due cose
     diverse \u2014 ed e' esattamente il difetto gia' preso il 20 agosto, quando
     la formula viveva in renderCrono e in cronoAnteprima e rompendone una
     sola il banco restava verde. */
  function _cgBarraPerc(r,primo,arco){
    if(!(r.giorni>0)||!arco||!r.inizio||!r.fine||!primo)return null;
    const off=_cgQuanti(primo,r.inizio), dur=_cgQuanti(r.inizio,r.fine)+1;
    /* la larghezza minima e' 1,2%: una fase di un giorno su un cantiere
       di un anno sarebbe un filo invisibile, e sembrerebbe non esserci */
    return { sx:(off*100/arco), larg:Math.max(1.2,dur*100/arco) };
  }
  function _cgBarra(r,primo,arco){
    const b=_cgBarraPerc(r,primo,arco);
    if(!b)return "";
    return '<i class="cg-barra'+(r.parallelo?" par":"")+'" style="left:'
      +b.sx.toFixed(3)+'%;width:'+b.larg.toFixed(3)+'%"></i>';
  }
  /* quanti giorni di LAVORO dura tutto il cantiere (sabato e domenica non
     si contano). Anche questo in un posto solo: lo legge la riga blu in
     fondo alla schermata e lo stampa il foglio. */
  function _cgGiorniLav(primo,ultimo){
    if(!primo||!ultimo)return 0;
    let n=0, x=_cgPrimoLav(new Date(primo.getTime()));
    while(x.getTime()<=ultimo.getTime()&&n<4000){ n++; x=_cgDopo(x); }
    return n;
  }
  /* cosa c'e' scritto nella riga blu in fondo */
  function _cgTotale(primo,ultimo){
    if(!primo||!ultimo)return "Scrivi la data di inizio e i giorni di ogni fase: il calendario si disegna da solo.";
    const n=_cgGiorniLav(primo,ultimo);
    return '<b>'+n+(n===1?' giorno':' giorni')+' di lavoro</b> \u2014 dal '
      +fdate(_cgIso(primo))+' al <b>'+fdate(_cgIso(ultimo))+'</b>';
  }
  /* LA SCALA DEL DISEGNO: il primo giorno, l'ultimo, e quanti giorni di
     calendario ci stanno in mezzo. Erano tre righe copiate in renderCrono e
     in cronoAnteprima; col foglio stampato diventerebbero tre copie, e tre
     copie non si aggiustano insieme.
     Il +1 c'e' perche' un lavoro che comincia e finisce lo stesso giorno
     dura un giorno, non zero. */
  function cronoScala(righe){
    const primo=(righe||[]).reduce(function(m,r){return (r.inizio&&(!m||r.inizio.getTime()<m.getTime()))?r.inizio:m;},null);
    const ultimo=cronoUltimo(righe);
    return { primo:primo, ultimo:ultimo,
             arco:(primo&&ultimo)?Math.max(1,_cgQuanti(primo,ultimo)+1):0 };
  }
  /* I MESI da scrivere sopra il calendario del foglio stampato: uno per ogni
     mese toccato dal cantiere, tagliato agli estremi veri. Serve solo al PDF
     \u2014 a schermo la barra non ha l'intestazione.
     Il paletto a 600 giri e' la stessa rete di _cgFine: 600 mesi sono
     cinquant'anni, oltre non e' un cantiere ma un errore di battitura. */
  function cronoMesi(primo,ultimo){
    const out=[];
    if(!primo||!ultimo)return out;
    let x=_cgGiorno(primo.getFullYear(),primo.getMonth(),1);
    let giri=0;
    while(x.getTime()<=ultimo.getTime()&&giri<600){
      /* il giorno 0 del mese dopo e' l'ultimo giorno di questo */
      const fineMese=_cgGiorno(x.getFullYear(),x.getMonth()+1,0);
      out.push({ y:x.getFullYear(), m:x.getMonth(),
                 da:(x.getTime()<primo.getTime())?primo:x,
                 a:(fineMese.getTime()>ultimo.getTime())?ultimo:fineMese });
      x=_cgGiorno(x.getFullYear(),x.getMonth()+1,1);
      giri++;
    }
    return out;
  }

  /* le durate come stanno nel database, per sapere se le caselle sono state
     toccate senza salvare (vedi cronoModifiche) */
  let cronoCapCache=[], cronoCapCacheId=null;

  /* C'E' QUALCOSA SCRITTO E NON SALVATO?
     ⚠️ 21 agosto 2026 — il foglio stampato esce da quello che e' SALVATO,
     non da quello che si vede nelle caselle. Senza questo controllo bastava
     cambiare i giorni di una fase, premere subito Scarica il PDF, e portare
     in gara un calendario diverso da quello sullo schermo — senza un solo
     avviso. E' la stessa rete che ha gia' il SAL (salModifiche). */
  function cronoModifiche(id){
    if(!$("#co-crono"))return false;                          /* scheda non aperta */
    if(String(ctrComputoId||"")!==String(id))return false;    /* scheda di un altro computo */
    if(String(cronoCapCacheId||"")!==String(id))return false; /* la cache e' di un altro */
    const c=compCache.find(x=>String(x.id)===String(id))||{};
    const inizio=($("#co-inizio")&&$("#co-inizio").value)||"";
    if(inizio!==String(c.data_inizio||""))return true;
    const righe=Array.from($$("#co-crono .cg-riga")).map(function(r){
      const g=r.querySelector(".cg-gg"), k=r.querySelector(".cg-ins");
      return { id:String((g&&g.dataset.id)||""),
               giorni:(g&&g.value!=="")?Math.round(+g.value):null,
               insieme:!!(k&&k.checked) };
    }).filter(function(x){return x.id;});
    /* nessuna riga a schermo = la pagina non e' ancora stata disegnata:
       non si puo' dire che sia cambiato qualcosa */
    if(!righe.length)return false;
    for(const x of righe){
      const s=cronoCapCache.find(function(y){return y.id===x.id;});
      if(!s)return true;
      if((s.giorni==null?null:+s.giorni)!==(x.giorni==null?null:+x.giorni))return true;
      if(!!s.insieme!==!!x.insieme)return true;
    }
    return false;
  }

  async function renderCrono(computoId){
    const box=$("#co-crono"); if(!box)return;
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}

    /* ⚠️ le colonne si chiedono PER NOME, non con «*». Con «*» il
       database risponde bene anche quando l'aggiornamento non e' stato
       eseguito: si vedrebbe la pagina vuota e l'errore salterebbe fuori
       solo al Salva, dopo aver scritto dodici durate. Chiedendole per
       nome, se mancano lo si sa subito e si dice cosa fare. */
    const rc=await sb.from("gest_computo_capitoli")
      .select("id,numero,titolo,ordine,giorni,insieme")
      .eq("user_id",sbUid).eq("computo_id",computoId).order("ordine");
    if(rc.error){
      /* la colonna «giorni» puo' non esserci ancora: si dice cosa fare,
         non si mostra un errore del database */
      box.innerHTML='<div class="lm-vuoto">'+(/giorni|insieme/i.test(String(rc.error.message||""))
        ? 'Per il cronoprogramma serve l\'aggiornamento del database: esegui <b>sql/gest-computo-cronoprogramma.sql</b> su Supabase.'
        : 'Non riesco a leggere i capitoli: '+esc(rc.error.message))+'</div>';
      return;
    }
    const caps=rc.data||[];
    /* ⚠️ 21 agosto 2026 — le durate COME SONO SALVATE, messe da parte.
       Servono a cronoModifiche: il foglio stampato nasce da quello che e'
       nel database, e se nelle caselle c'e' scritto qualcosa di diverso
       bisogna dirlo PRIMA di stampare, non consegnare un foglio che non
       somiglia allo schermo. E' la stessa rete che ha gia' il SAL. */
    cronoCapCache=caps.map(function(c){return {id:String(c.id),giorni:(c.giorni==null?null:+c.giorni),insieme:!!c.insieme};});
    cronoCapCacheId=String(computoId||"");

    /* ⚠️ SENZA CAPITOLI NON C'E' CRONOPROGRAMMA, e va detto chiaro.
       I computi che arrivano dal PDF del geometra nascono senza
       capitoli: qui si finiva davanti a una pagina vuota senza capire
       perche'. Adesso lo dice, e il pulsante per rimediare sta qui. */
    if(!caps.length){
      box.innerHTML='<div class="co-vuoto">'
        +'<div class="co-vuoto-ic">📅</div>'
        +'<h4>Il cronoprogramma si fa a fasi</h4>'
        +'<p>Le fasi sono i <b>capitoli</b> del computo: Demolizioni, Murature, Impianti… A ognuno dai quanti giorni dura, e il calendario si disegna da solo.<br>Questo computo non ha ancora capitoli.</p>'
        +'<div class="co-vuoto-due"><button type="button" class="btn-primary" data-action="co-pag" data-p="1">Vai alle lavorazioni e crea i capitoli</button></div>'
        +'</div>';
      return;
    }

    const inizio=($("#co-inizio")&&$("#co-inizio").value)||"";
    const righe=cronoDate(caps,inizio);
    /* la scala del disegno sta in cronoScala: la stessa che usa il foglio
       stampato, cosi' le barre non si possono scollare */
    const sc=cronoScala(righe), primo=sc.primo, ultimo=sc.ultimo, arco=sc.arco;

    let h='<div class="cg-righe">';
    righe.forEach(function(r,i){
      const c=r.cap;
      const senza=!(r.giorni>0);
      const barra=_cgBarra(r,primo,arco);
      h+='<div class="cg-riga'+(senza?" senza":"")+'">'
        +  '<div class="cg-tit"><b class="cm-testo">'+(c.numero?esc(c.numero)+" — ":"")+esc(c.titolo||"(capitolo senza titolo)")+'</b>'
        +    '<span class="cg-date">'+_cgTesto(r)+'</span></div>' 
        +  '<div class="cg-campi">'
        +    '<label class="cg-gg-l">giorni <input type="number" min="0" max="2000" class="cg-gg" data-id="'+esc(String(c.id))+'" value="'+(c.giorni!=null?String(c.giorni):"")+'" placeholder="—"></label>'
        +    (i>0?'<label class="cg-ins-l"><input type="checkbox" class="cg-ins" data-id="'+esc(String(c.id))+'"'+(c.insieme?" checked":"")+'> insieme al precedente</label>':'')
        +  '</div>'
        +  '<div class="cg-scala">'+barra+'</div>'
        +'</div>';
    });
    h+='</div>';

    /* il totale: quanti giorni di lavoro in tutto, e quando si consegna */
    h+='<div class="cg-tot">'+_cgTotale(primo,ultimo)+'</div>' 
      /* ⚠️ NON dentro «comp-azioni»: li' dentro .quick-add fa i pulsanti
         arancioni con lo sfondo chiaro, che sono le azioni di contorno
         del computo. Questo e' l'unico pulsante della pagina e serve a
         SALVARE: blu pieno, come «Crea computo». */
      +'<div class="cg-salva">'
      +  '<button type="button" class="btn-primary" data-action="crono-salva">Salva il cronoprogramma</button>'
      /* ⚠️ il blu pieno resta UNO SOLO per schermata, ed e' il Salva: questo
         e' secondario (.btn). In una gara il cronoprogramma va consegnato
         stampato, non fatto vedere sullo schermo. */
      /* ⚠️ 21 agosto 2026 — IL NOME DICE COSA ESCE, e non e' un vezzo.
         Nella cassetta in cima alla stessa schermata c'e' gia' un
         «Scarica il PDF», ed e' il COMPUTO METRICO. Due pulsanti con lo
         stesso nome sulla stessa pagina che scaricano due documenti
         diversi: visto da Alessio in una foto dello schermo, non dal
         banco — il banco leggeva la pagina 6 da sola. */
      +  '<button type="button" class="btn" data-action="crono-pdf">📄 Scarica il cronoprogramma</button>'
      +'</div>'
      +'<div class="sh-nota">I giorni sono <b>giorni di lavoro</b>: sabato e domenica non si contano. Una fase comincia quando finisce quella prima, a meno che non metti la spunta «insieme al precedente».</div>';
    box.innerHTML=h;

    /* si ridisegna mentre si scrive, senza salvare: cosi' si vede subito
       se la consegna cade dopo Natale */
    $$("#co-crono .cg-gg").forEach(function(e){ e.addEventListener("input",cronoAnteprima); });
    $$("#co-crono .cg-ins").forEach(function(e){ e.addEventListener("change",cronoAnteprima); });
  }

  /* l'anteprima NON tocca il database: rifa' i conti con quello che c'e'
     scritto adesso nelle caselle e riscrive solo le date e le barre */
  function cronoAnteprima(){
    const box=$("#co-crono"); if(!box)return;
    /* ⚠️ $$ restituisce una NodeList, che NON ha .map — solo forEach.
       Senza Array.from qui saltava tutto per aria al primo tasto. */
    const caps=Array.from($$("#co-crono .cg-riga")).map(function(r,i){
      const g=r.querySelector(".cg-gg"), k=r.querySelector(".cg-ins");
      return { id:(g&&g.dataset.id)||"", giorni:(g&&g.value!=="")?+g.value:null, insieme:!!(k&&k.checked) };
    });
    const righe=cronoDate(caps,($("#co-inizio")&&$("#co-inizio").value)||"");
    const sc=cronoScala(righe), primo=sc.primo, ultimo=sc.ultimo, arco=sc.arco;
    $$("#co-crono .cg-riga").forEach(function(el,i){
      const r=righe[i]; if(!r)return;
      el.classList.toggle("senza",!(r.giorni>0));
      const t=el.querySelector(".cg-date");
      if(t)t.textContent=_cgTesto(r);
      const sc=el.querySelector(".cg-scala");
      if(sc)sc.innerHTML=_cgBarra(r,primo,arco);
    });
    const t=$("#co-crono .cg-tot");
    if(t)t.innerHTML=_cgTotale(primo,ultimo);
  }

  /* Salva: la data di partenza sul computo, le durate sui capitoli.
     ⚠️ Si scrive SOLO quello che e' cambiato davvero: su un computo con
     dodici capitoli, riscriverli tutti a ogni Salva vuol dire dodici
     scritture per cambiare un numero. */
  async function cronoSalva(){
    if(!sb||!sbUid||!ctrComputoId){toast("Apri prima un computo");return;}
    const inizio=($("#co-inizio")&&$("#co-inizio").value)||null;
    const righe=Array.from($$("#co-crono .cg-riga")).map(function(r){
      const g=r.querySelector(".cg-gg"), k=r.querySelector(".cg-ins");
      return { id:(g&&g.dataset.id)||"", giorni:(g&&g.value!=="")?Math.round(+g.value):null, insieme:!!(k&&k.checked) };
    }).filter(function(x){return x.id;});

    for(const x of righe){
      if(x.giorni!=null&&(!isFinite(x.giorni)||x.giorni<0||x.giorni>2000)){
        toast("I giorni di una fase vanno da 0 a 2000. Controlla il numero.");
        return;
      }
    }

    const rC=await sb.from("gest_computi").update({data_inizio:inizio})
      .eq("id",ctrComputoId).eq("user_id",sbUid).select("id");
    if(rC.error){
      toast(/data_inizio/i.test(String(rC.error.message||""))
        ? "Prima serve l'aggiornamento del database: esegui sql/gest-computo-cronoprogramma.sql su Supabase"
        : "Errore: "+rC.error.message);
      return;
    }
    for(const x of righe){
      const r=await sb.from("gest_computo_capitoli")
        .update({giorni:x.giorni, insieme:x.insieme})
        .eq("id",x.id).eq("user_id",sbUid).select("id");
      if(r.error){
        toast(/giorni|insieme/i.test(String(r.error.message||""))
          ? "Prima serve l'aggiornamento del database: esegui sql/gest-computo-cronoprogramma.sql su Supabase"
          : "Errore: "+r.error.message);
        return;
      }
    }
    /* la cache del computo deve sapere la data nuova, se no riaprendo la
       finestra il cronoprogramma torna a quella di prima */
    const cc=compCache.find(x=>String(x.id)===String(ctrComputoId));
    if(cc)cc.data_inizio=inizio;
    toast("Cronoprogramma salvato ✔");
    await renderCrono(ctrComputoId);
  }

  /* ============================================================
     20 agosto 2026 — LA BARRA DEL COMPUTO: cambiare pagina
     ============================================================
     compPag(n)          -> mostra la pagina n (tutti i suoi blocchi)
     compNavAggiorna(q)  -> con q lavorazioni decide quali voci sono accese

     ⛔ NON si ridisegna niente: si accende e si spegne la classe "on".
        Le caselle del modulo devono restare nel documento anche mentre
        guardi un'altra pagina, se no saveComputo le legge vuote e ti
        cancella quello che non hai davanti (titolo, ribasso, note...).

     Una voce spenta NON e' muta: dice perche' e' spenta (data-perche).
     Un pulsante che non fa niente e non spiega e' peggio di un pulsante
     che non c'e'. */
  function compPag(n,forza){
    const nav=$("#co-nav"); if(!nav)return;
    const b=nav.querySelector('.conav-v[data-p="'+n+'"]');
    if(!b)return;
    if(!forza&&b.classList.contains("spento")){
      toast(b.dataset.perche||"Prima serve salvare il computo.");
      return;
    }
    $$("#co-nav .conav-v").forEach(function(x){x.classList.toggle("on",x===b);});
    $$(".copag").forEach(function(x){x.classList.toggle("on",String(x.dataset.p)===String(n));});
    /* si torna in cima: cambiando voce restando a meta' pagina sembra che
       non sia successo niente */
    const corpo=document.querySelector("#sheet .sh-body");
    if(corpo)corpo.scrollTop=0;
  }

  /* quante lavorazioni ci sono adesso: senza lavorazioni prezzi, ribasso e
     SAL non hanno niente su cui lavorare, e restano spenti con la loro
     spiegazione. Appena ce n'e' una, il numero 1 diventa una spunta verde. */
  function compNavAggiorna(quante){
    const nav=$("#co-nav"); if(!nav)return;
    const ce=(+quante||0)>0;
    [2,3,5,6].forEach(function(n){
      const b=nav.querySelector('.conav-v[data-p="'+n+'"]');
      if(!b)return;
      b.classList.toggle("spento",!ce);
      b.dataset.perche="Prima mettici le lavorazioni: senza quelle qui non c'è niente da fare.";
    });
    const b1=nav.querySelector('.conav-v[data-p="1"]');
    if(b1){
      const n1=b1.querySelector(".conav-n");
      if(n1){ n1.classList.toggle("fatto",ce); n1.textContent=ce?"\u2713":"1"; }
    }
  }

  async function renderCompVoci(computoId){
    const box=$("#co-voci");if(!box)return;
    compVociCompId=computoId;
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}

    const [rc,rv]=await Promise.all([
      sb.from("gest_computo_capitoli").select("*").eq("user_id",sbUid).eq("computo_id",computoId).order("ordine"),
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",computoId).order("ordine")
    ]);
    if(rc.error||rv.error){
      const e=rc.error||rv.error;
      box.innerHTML='<div class="lm-vuoto">'+(_compManca(e)
        ? 'Per le lavorazioni serve l\'aggiornamento del database: esegui <b>sql/gest-computo-metrico.sql</b> su Supabase.'
        : 'Non riesco a leggere le lavorazioni: '+esc(e.message))+'</div>';
      return;
    }
    compCapCache=rc.data||[];
    compVociCache=rv.data||[];
    compNavAggiorna(compVociCache.length);

    const senzaCap=compVociCache.filter(v=>!v.capitolo_id);
    const gruppi=compCapCache.map(cap=>({cap:cap, voci:compVociCache.filter(v=>String(v.capitolo_id)===String(cap.id))}));
    if(senzaCap.length||!compCapCache.length)gruppi.push({cap:null, voci:senzaCap});

    const compQui=compCache.find(x=>String(x.id)===String(computoId))||{};
    const rp=compRiepilogo(compVociCache,compQui);

    /* ⚠️ 11 agosto 2026 — LE FRECCE PER SPOSTARE UNA LAVORAZIONE.
       Prima l'ordine era quello in cui le avevi scritte, PER SEMPRE: una voce
       dimenticata restava in fondo al suo capitolo e l'unico modo di rimetterla
       al posto giusto era cancellarla e riscriverla — perdendo tutte le sue
       misure. Un computo si controlla contro i disegni seguendo l'ordine: se
       l'ordine non si tocca, non si controlla.
       Le frecce spostano DENTRO il capitolo. Per cambiare capitolo si apre la
       lavorazione e si sceglie dalla tendina: sono due gesti diversi e tenerli
       separati evita di spostare una voce in un altro capitolo per sbaglio.
       In cima la freccia su è spenta, in fondo quella giù: spente si vedono
       lo stesso, così i pulsanti non ballano da una riga all'altra. */
    const frecciaSpenta='opacity:.25;cursor:default';
    const frecciaViva='cursor:pointer';
    const bottoneFreccia=(v,verso,primo,ultimo)=>{
      const spenta=(verso<0?primo:ultimo);
      /* La freccia spenta è disabled: così il click non rimbalza sulla riga
         (che ha data-action="comp-voce") aprendo la lavorazione per sbaglio. */
      return '<button type="button"'
        +(spenta?' disabled':' data-action="comp-voce-'+(verso<0?"su":"giu")+'" data-id="'+esc(String(v.id))+'"')
        +' title="'+(spenta?(verso<0?"È già la prima del capitolo":"È già l\'ultima del capitolo")
                           :("Sposta "+(verso<0?"in su":"in giù")))+'"'
        +' style="border:1px solid var(--bordo-forte,#cbd2da);background:var(--card,#fff);'
        +'color:var(--testo,#22303f);border-radius:8px;min-width:34px;height:34px;'
        +'font-size:16px;line-height:1;flex:0 0 auto;'+(spenta?frecciaSpenta:frecciaViva)+'">'
        +(verso<0?"↑":"↓")+'</button>';
    };
    const rigaVoce=(v,i,tot)=>'<div class="spesa-row" data-action="comp-voce" data-id="'+esc(String(v.id))+'" style="cursor:pointer;align-items:flex-start">'
      +'<span class="cm-testo">'+(v.codice?'<b>'+esc(v.codice)+'</b> · ':'')+esc(v.descrizione||"(senza descrizione)")
      +  '<small class="sp-forn">'+_misLetta(v.quantita)+(v.unita?" "+esc(v.unita):"")
      +    ' × '+eur2(v.prezzo_unitario)
      +    (v.quantita_manuale?' · a corpo':(' · '+(+v.misure||0)+((+v.misure===1)?" misura":" misure")))
      +  '</small></span>'
      +'<b>'+eur2(v.importo)+'</b>'
      +(tot>1?bottoneFreccia(v,-1,i===0,i===tot-1)+bottoneFreccia(v,1,i===0,i===tot-1):"")
      +'<button type="button" class="rdel" data-action="comp-voce-del" data-id="'+esc(String(v.id))+'" title="Elimina la lavorazione" style="border:1px solid var(--bordo-forte,#cbd2da);background:var(--card,#fff);color:var(--err,#c0392b);border-radius:8px;min-width:34px;height:34px;font-size:17px;line-height:1;cursor:pointer;flex:0 0 auto">×</button></div>';

    let h="";
    gruppi.forEach(g=>{
      const sub=g.voci.reduce((s,v)=>s+(+v.importo||0),0);
      if(g.cap){
        /* ⚠️ 11 agosto 2026 — IL CAPITOLO SI RINOMINA CLICCANDOCI SOPRA.
           Prima un capitolo si poteva SOLO cancellare: per correggere un
           refuso nel titolo bisognava eliminarlo — e tutte le sue lavorazioni
           finivano «senza capitolo» — poi rifarlo e riaprire una per una le
           lavorazioni per riassegnarle dalla tendina. Su un computo da sessanta
           voci era un pomeriggio. Si rinumera anche, perché il numero che il
           gestionale mette da solo è max+1: cancellato il capitolo 2 di 3, il
           prossimo nasce «4» in un computo che di capitoli ne ha tre. */
        h+=(String(compCapEdit||"")===String(g.cap.id))
          ? '<div style="background:var(--sfondo,#f5f6f8);border-radius:10px;padding:12px;margin:4px 0">'
            +'<div class="row2">'
            +'<div class="field"><label>Numero</label><input id="ce-num"'+_noAuto()
            +' value="'+esc(g.cap.numero||"")+'" placeholder="1" style="max-width:120px"></div>'
            +'<div class="field"><label>Titolo del capitolo</label><input id="ce-tit"'+_noAuto()
            +' value="'+esc(g.cap.titolo||"")+'" placeholder="Es. Demolizioni e rimozioni"></div>'
            +'</div>'
            +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
            +'<button type="button" class="btn-primary quick-add" data-action="comp-cap-rinomina" data-id="'+esc(String(g.cap.id))+'">Salva il capitolo</button>'
            +'<button type="button" class="btn-ghost quick-add" data-action="comp-cap-edit-annulla">Annulla</button>'
            +'</div></div>'
          : '<div class="spesa-row" style="background:var(--sfondo,#f5f6f8)">'
            +'<span class="cm-testo" data-action="comp-cap-edit" data-id="'+esc(String(g.cap.id))+'" style="cursor:pointer" title="Clicca per rinominare il capitolo">'
            +  '<b>'+(g.cap.numero?esc(g.cap.numero)+" — ":"")+esc(g.cap.titolo||"(capitolo senza titolo)")+'</b>'
            +  '<small class="sp-forn">clicca per rinominare</small></span>'
            +'<b>'+eur2(sub)+'</b>'
            +'<button type="button" class="rdel" data-action="comp-cap-del" data-id="'+esc(String(g.cap.id))+'" title="Elimina il capitolo (le lavorazioni restano)">×</button></div>';
      }else if(compCapCache.length&&g.voci.length){
        h+='<div class="spesa-row" style="background:var(--sfondo,#f5f6f8)"><span><b>Senza capitolo</b></span><b>'+eur2(sub)+'</b><span></span></div>';
      }
      h+= g.voci.length ? g.voci.map((v,i)=>rigaVoce(v,i,g.voci.length)).join("")
        : '<p class="fatt-empty">Nessuna lavorazione'+(g.cap?" in questo capitolo":"")+'.</p>';
    });

    /* il piede dei totali: col ribasso diventa tre righe, senza resta una sola.
       I numeri vengono da compRiepilogo, gli stessi che finiscono sul PDF. */
    let piede='<div class="spesa-row" style="border-top:2px solid var(--bordo)"><span><b>'
      +(rp.perc?"Totale dei lavori":"Totale del computo")+'</b></span><b>'+eur2(rp.lordo)+'</b><span></span></div>';
    if(rp.perc){
      piede+='<div class="spesa-row"><span>Ribasso '+_pct(rp.perc)+'%'
        +(rp.sicurezza?'<small class="sp-forn">gli oneri della sicurezza non si ribassano</small>':'')
        +'</span><b style="color:var(--err,#c0392b)">− '+eur2(rp.ribasso)+'</b><span></span></div>'
        +'<div class="spesa-row" style="border-top:2px solid var(--bordo)"><span><b>Totale del computo</b></span><b>'+eur2(rp.netto)+'</b><span></span></div>';
    }
    if(compQui.tipo==="pubblico"&&(rp.manodopera||rp.sicurezza)){
      piede+='<div class="spesa-row"><span>di cui costo del personale</span><b>'+eur2(rp.manodopera)+'</b><span></span></div>'
        +'<div class="spesa-row"><span>di cui oneri della sicurezza</span><b>'+eur2(rp.sicurezza)+'</b><span></span></div>';
    }
    /* ⚠️ 20 agosto 2026 — UN COMPUTO VUOTO NON È UNA PAGINA VUOTA.
       Detto da Alessio guardando lo schermo: «aggiungi lavorazione,
       aggiungi capitolo, messi lì non li capisco, forse perché non sono
       geometra», «oppure sono messi così in basso da non essere
       abbastanza visibili».
       Erano tre pulsantini identici sotto una riga «Totale del computo
       0,00 €»: tre strade con la stessa faccia, e la più importante —
       caricare il file che ti ha mandato il geometra — stava in mezzo,
       in fondo, dopo un totale che diceva zero.
       Su un computo ancora senza niente adesso c'è UNA cassetta grande
       con DUE strade, e si vede subito qual è la prima.
       ⛔ La casella del file (#comp-file) deve esserci in UNO dei due
          rami, mai in tutti e due: due caselle con lo stesso id e il
          caricamento prende quella sbagliata. */
    const _niente=!compVociCache.length&&!compCapCache.length;
    const _fileIn='<input type="file" id="comp-file" accept=".xlsx,.xlsm,.xls,.csv,.pdf" style="display:none">';
    const _cassetta=
       '<div class="co-vuoto">'
      +  '<div class="co-vuoto-ic">\ud83d\udcd0</div>'
      +  '<h4>Qui dentro non c\'è ancora niente</h4>'
      +  '<p>'+(ruoloUtente==='professionista'
            ? 'Le lavorazioni sono le righe del computo. Puoi importarle da un Excel oppure scriverle una per una.'
            : 'Se il geometra ti ha mandato il suo computo, caricalo: le lavorazioni entrano da sole con le loro quantità. Se no, scrivile tu, una per una.')+'</p>'
      +  '<div class="co-vuoto-due">'
      +    '<button type="button" class="btn-primary" data-action="comp-importa">\u2b06 '
      +      (ruoloUtente==='professionista'?'Importa le lavorazioni da Excel':'Carica qui il computo del geometra')+'</button>'
      +    '<button type="button" class="btn-ghost quick-add" data-action="comp-voce-new">+ Le scrivo io, una per una</button>'
      +  '</div>'
      +  _fileIn
      +  (compCapNuovo?'':'<div class="co-vuoto-poi"><button type="button" class="btn-ghost quick-add" data-action="comp-cap-apri">+ Aggiungi capitolo</button>'
      +    '<span>I capitoli servono a raggruppare le lavorazioni (Demolizioni, Murature…). Si possono mettere anche dopo.</span></div>')
      +'</div>';

    box.innerHTML=(_niente ? _cassetta : (h+piede
      +'<div class="comp-azioni">'
      +  '<button type="button" class="btn-ghost quick-add" data-action="comp-voce-new">+ Aggiungi lavorazione</button>'
      /* ⚠️ 18 agosto 2026 — quando il computo te lo manda gia' fatto un
         progettista, le voci sono ottanta e riscriverle a mano e' una serata.
         Qui si caricano da un Excel in un colpo. */
      /* ⚠️ 20 agosto 2026 — il pulsante si chiama in due modi, come la
         sezione. Il tecnico IMPORTA delle lavorazioni dentro un computo che
         sta facendo lui; l'impresa CARICA il computo che le ha mandato il
         geometra. E' la stessa cosa per il codice, non e' la stessa cosa per
         la persona che ce l'ha davanti. */
      +  '<button type="button" class="btn-ghost quick-add" data-action="comp-importa">\u2b06 '
      +    (ruoloUtente==='professionista'
            ? 'Importa le lavorazioni da Excel'
            : 'Carica qui il computo del geometra')+'</button>'
      /* ⛔ la stessa casella del ramo vuoto, NON una copia: l'elenco dei
         formati accettati (.xlsx .xls .csv .pdf) deve stare in UN posto
         solo, se no un giorno il PDF entra da una parte e dall'altra no. */
      +  _fileIn
      /* ⚠️ 19 agosto 2026 — un computo importato arriva con le lavorazioni e i
         prezzi vuoti. Questo pulsante cerca il codice nel prezzario e riempie
         SOLO le righe a zero. Si vede solo se qualcosa a zero c'è davvero: se
         no sarebbe un pulsante che non fa mai niente. */
      +  (Array.from(compVociCache).some(function(v){return !(+v.prezzo_unitario);})
          ? '<button type="button" class="btn-ghost quick-add" data-action="comp-prezzi">€ Prendi i prezzi dal prezzario</button>'
          : '')
      +  (compCapNuovo?'':'<button type="button" class="btn-ghost quick-add" data-action="comp-cap-apri">+ Aggiungi capitolo</button>')
      +'</div>'
      /* il resoconto dell'ultima passata del prezzario: sta qui sotto e non in
         una finestrella, perché è un elenco che si legge con calma. Si vede
         solo sul computo su cui è stato fatto. */
      ))
      +((compPrzEsito&&String(compPrzEsitoId||"")===String(computoId))?compPrzEsito:"")
      /* il capitolo si aggiunge con un campo qui dentro, non con una
         finestrella del browser: e' la stessa forma delle misure e delle spese */
      +(compCapNuovo
        ? '<div style="margin-top:12px;border-top:1px solid var(--bordo);padding-top:12px">'
          +'<div class="field"><label>Titolo del nuovo capitolo</label>'
          +'<input id="cc-tit"'+_noAuto()+' placeholder="Es. Demolizioni e rimozioni"></div>'
          +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
          +'<button type="button" class="btn-primary quick-add" data-action="comp-cap-salva">Aggiungi il capitolo</button>'
          +'<button type="button" class="btn-ghost quick-add" data-action="comp-cap-annulla">Annulla</button>'
          +'</div></div>'
        : '')
      +(_niente?'':'<div class="sh-nota">Clicca una lavorazione per aprirla e scriverci le misure. La quantità la calcola il gestionale dalle misure: non si scrive a mano.</div>');
    if(compCapNuovo){const i=$("#cc-tit");if(i)i.focus();}
    if(compCapEdit){const i=$("#ce-tit");if(i){i.focus();i.select();}}
    /* le lavorazioni sono appena cambiate, quindi è cambiato il Totale A: il
       quadro economico si rifà i conti da solo. Senza questa riga restava
       fermo sui numeri di quando si era aperta la finestra. */
    qeAggiorna();
  }

  /* Sposta una lavorazione di un posto dentro il suo capitolo.
     verso = -1 in su, +1 in giù.

     COME SI SCAMBIA L'ORDINE, e perché non basta scambiare due numeri.
     Il campo "ordine" è dell'intero computo, non del capitolo. Si prendono i
     numeri che il gruppo ha GIÀ, si rimescolano le lavorazioni nell'ordine
     nuovo e si ridistribuiscono gli stessi numeri: così il gruppo non invade
     lo spazio degli altri capitoli e non nascono doppioni.
     Se due lavorazioni avessero per sbaglio lo stesso numero, scambiarli non
     farebbe niente e il pulsante sembrerebbe rotto: in quel caso si rinumera
     il gruppo da capo, a partire dal più piccolo. */
  async function compVoceSposta(id,verso){
    if(!sb||!sbUid||!compVociCompId)return;
    const v=compVociCache.find(x=>String(x.id)===String(id));
    if(!v)return;
    const gruppo=compVociCache
      .filter(x=>String(x.capitolo_id||"")===String(v.capitolo_id||""))
      .slice().sort((a,b)=>(+a.ordine||0)-(+b.ordine||0));
    const i=gruppo.findIndex(x=>String(x.id)===String(id));
    const j=i+verso;
    if(i<0||j<0||j>=gruppo.length)return;      /* già in cima o in fondo */

    let numeri=gruppo.map(x=>+x.ordine||0);
    if(new Set(numeri).size!==numeri.length){
      const m=Math.min.apply(null,numeri);
      numeri=gruppo.map((_,k)=>m+k);
    }
    const nuovo=gruppo.slice();
    nuovo.splice(j,0,nuovo.splice(i,1)[0]);

    /* si scrive solo quello che cambia davvero */
    const daScrivere=[];
    nuovo.forEach((x,k)=>{ if((+x.ordine||0)!==numeri[k])daScrivere.push({id:x.id,ordine:numeri[k]}); });
    if(!daScrivere.length)return;

    const esiti=await Promise.all(daScrivere.map(r=>
      sb.from("gest_computo_voci").update({ordine:r.ordine}).eq("id",r.id).eq("user_id",sbUid).select("id")));
    const guaio=esiti.find(e=>e.error);
    if(guaio){toast("Non spostata: "+guaio.error.message);return;}
    if(esiti.some(e=>!e.data||!e.data.length)){toast("Non spostata: nessuna riga modificata. Riprova.");return;}

    await renderCompVoci(compVociCompId);
  }

  /* Rinomina (e rinumera) un capitolo. Le lavorazioni non si toccano: restano
     attaccate al capitolo, che è lo stesso — cambia solo come si chiama. */
  async function compCapRinomina(id){
    if(!sb||!sbUid)return;
    const t=String(($("#ce-tit")&&$("#ce-tit").value)||"").trim();
    const n=String(($("#ce-num")&&$("#ce-num").value)||"").trim();
    if(!t){toast("Il capitolo ha bisogno di un titolo");return;}
    const {data,error}=await sb.from("gest_computo_capitoli")
      .update({titolo:t,numero:n||null}).eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Errore: "+error.message);return;}
    if(!data||!data.length){toast("Capitolo non salvato: nessuna riga modificata. Riprova.");return;}
    compCapEdit=null;
    await renderCompVoci(compVociCompId);
    toast("Capitolo rinominato ✔");
  }

  async function compCapSalva(){
    if(!compVociCompId)return;
    const t=String(($("#cc-tit")&&$("#cc-tit").value)||"").trim();
    if(!t){toast("Il capitolo ha bisogno di un titolo");return;}
    const ord=compCapCache.reduce((m,c)=>Math.max(m,+c.ordine||0),0)+1;
    const {error}=await sb.from("gest_computo_capitoli").insert({
      user_id:sbUid, computo_id:compVociCompId, ordine:ord, numero:String(ord), titolo:t});
    if(error){toast("Errore: "+error.message);return;}
    compCapNuovo=false;
    await renderCompVoci(compVociCompId);
    toast("Capitolo aggiunto ✔");
  }
  async function compCapDel(id){
    if(!gconfirm("Eliminare questo capitolo?\n\nLe lavorazioni che ci stanno dentro NON si perdono: restano nel computo, in fondo, senza capitolo."))return;
    const {error}=await sb.from("gest_computo_capitoli").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    await renderCompVoci(compVociCompId);
    toast("Capitolo eliminato");
  }
  async function compVoceDel(id){
    const v=compVociCache.find(x=>String(x.id)===String(id))||{};
    if(!gconfirm("Eliminare la lavorazione «"+(v.descrizione||"")+"»?\n\nSe ne vanno anche le sue misure, e non si recupera."))return;
    const {error}=await sb.from("gest_computo_voci").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    await renderCompVoci(compVociCompId);
    rinfresca("computi");
    toast("Lavorazione eliminata");
  }

  /* ---- la scheda della singola lavorazione ---- */
  async function compVoceForm(voceId){
    if(!compVociCompId){toast("Apri prima il computo");return;}
    const computoId=compVociCompId;
    let v={};
    if(voceId){
      const {data,error}=await sb.from("gest_computo_voci").select("*").eq("id",voceId).eq("user_id",sbUid).maybeSingle();
      if(error){toast("Errore: "+error.message);return;}
      if(!data){toast("Lavorazione non trovata");return;}
      v=data;
    }
    compVoceId=v.id||null;
    compMisEditId=null;
    const comp=compCache.find(x=>String(x.id)===String(computoId))||{};
    const pubblico=(comp.tipo==="pubblico");
    const isNew=!v.id;

    const capOpts='<option value="">— senza capitolo —</option>'+compCapCache.map(c=>
      '<option value="'+esc(String(c.id))+'"'+(String(c.id)===String(v.capitolo_id||"")?" selected":"")+'>'
      +esc((c.numero?c.numero+" — ":"")+(c.titolo||""))+'</option>').join("");
    const uniOpts='<option value="">— unità —</option>'+UNITA.map(u=>
      '<option value="'+u+'"'+(u===(v.unita||"")?" selected":"")+'>'+u+'</option>').join("");

    openSheetGrande(isNew?"Nuova lavorazione":"Lavorazione",
       '<div class="sh-cols"><div class="sh-col">'
      /* ============================================================
         IL TUO PREZZARIO — il pezzo che fa risparmiare le giornate
         ============================================================
         Un tecnico ha trecento voci di tariffa regionale e le riusa sempre le
         stesse. Riscriverle a mano a ogni computo e' il lavoro che gli fa
         dire "questo programma non lo uso". Qui si cercano per parola, si
         cliccano, ed entrano gia' fatte: codice, descrizione, unita', prezzo.
         Le voci usate di piu' salgono in cima da sole (usata_volte). */
      +'<div class="sh-b"><div class="sh-tit">Il tuo prezzario</div>'
      +  '<div id="pp-fonte-box"></div>'
      +  '<div class="field"><label>Cerca una voce che usi già</label>'
      +    '<input id="pp-cerca"'+_noAuto()+' placeholder="Scrivi una parola: tramezzo, intonaco, pavimento…"></div>'
      +  '<div id="pp-lista"></div>'
      +  '<div class="sh-nota">Clicca una voce e la lavorazione si riempie da sola. Quando ne scrivi una nuova, salvala nel prezzario col pulsante in fondo: la prossima volta la ritrovi.</div>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">La lavorazione</div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Codice del prezzario</label><input id="cv-cod"'+_noAuto()+' value="'+esc(v.codice||"")+'" placeholder="A.01.002"></div>'
      +    '<div class="field"><label>Unità di misura</label><select id="cv-uni">'+uniOpts+'</select></div>'
      +  '</div>'
      +  '<div class="field"><label>Descrizione</label><textarea id="cv-desc" rows="4" placeholder="Come la scrive il prezzario, per esteso">'+esc(v.descrizione||"")+'</textarea></div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Prezzo unitario (€)</label><input type="text" inputmode="decimal" id="cv-prezzo"'+_noAuto()+' value="'+(v.prezzo_unitario!=null?_prezzoTesto(v.prezzo_unitario):"")+'" placeholder="18,50">'
      /* ⚠️ se la lavorazione ha l'analisi, questa casella non comanda piu'
         niente: si spegne e mostra il prezzo costruito (vedi
         anPrezzoCasella). Una casella che si puo' scrivere e che non serve
         a nulla e' peggio che non averla. */
      +      '<div class="sh-nota" id="cv-prezzo-nota" style="display:none;margin-top:6px">Questo prezzo lo fa <b>l\'analisi</b> qui a fianco: per cambiarlo, cambia le sue righe.</div></div>'
      +    '<div class="field"><label>Capitolo</label><select id="cv-cap">'+capOpts+'</select></div>'
      +  '</div>'
      +'</div>'

      /* Qui c'era una casellina da spuntare. Misurata nel browser: il CSS dei
         campi la stirava a 56px di altezza e la mandava sotto al testo, storta.
         Invece di combattere col foglio di stile, i DUE PULSANTI: e' il
         componente che funziona gia' in tutto il gestionale, si tocca senza
         mirare, e si capisce senza leggere. */
      +'<div class="sh-b"><div class="sh-tit">Come si conta la quantità</div>'
      +  '<div class="field"><div class="seg" id="cv-conta">'
      +    '<button data-v="misure"'+(v.quantita_manuale?'':' class="on"')+'>Dalle misure</button>'
      +    '<button data-v="corpo"'+(v.quantita_manuale?' class="on"':'')+'>A corpo</button>'
      +  '</div>'
      +  '<div class="sh-nota">Con <b>Dalle misure</b> la quantità la fa la somma delle misure qui a fianco, e non si scrive a mano. <b>A corpo</b> serve quando non c\'è niente da misurare: una voce a forfait, le spese generali.</div>'
      +  '</div>'
      +  '<div class="field" id="cv-qta-box" style="'+(v.quantita_manuale?"":"display:none")+'">'
      +    '<label>Quantità</label><input type="text" inputmode="decimal" id="cv-qta"'+_noAuto()+' value="'+(v.quantita!=null?_misTesto(v.quantita):"")+'" placeholder="1" style="max-width:180px"></div>'
      +'</div>'

      +(pubblico
        ? '<div class="sh-b"><div class="sh-tit">Solo per i lavori pubblici</div>'
          +'<div class="row2">'
          +  '<div class="field"><label>Quanta parte del prezzo è costo del personale (%)</label><input type="text" inputmode="decimal" id="cv-mano"'+_noAuto()+' value="'+(v.incidenza_manodopera!=null?String(v.incidenza_manodopera).replace(".",","):"")+'" placeholder="35"></div>'
          +  '<div class="field"><label>Oneri della sicurezza (€)</label><input type="text" inputmode="decimal" id="cv-sic"'+_noAuto()+' value="'+(v.oneri_sicurezza!=null?String(v.oneri_sicurezza).replace(".",","):"")+'" placeholder="0"></div>'
          +'</div>'
          +'<div class="sh-nota">Sono le due cose che nelle gare vanno dichiarate. Gli oneri della sicurezza non sono soggetti a ribasso.</div>'
          +'</div>'
        : '')

      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Le misure</div>'
      +  '<div class="lav-media" id="cv-misure">'+(isNew
          ? '<div class="lm-vuoto">Salva prima la lavorazione: poi qui ci scrivi le misure, una riga per ogni pezzo.</div>'
          : '<div class="lm-vuoto">Sto caricando…</div>')+'</div>'
      +'</div>'
      /* ============================================================
         21 agosto 2026 — L'ANALISI DEI PREZZI, sotto le misure.
         Sta qui e non a sinistra perche' e' la stessa domanda: le misure
         dicono QUANTO, l'analisi dice QUANTO COSTA. E perche' a sinistra
         c'e' l'anagrafica della lavorazione, che si compila una volta
         sola; queste due si guardano insieme e si toccano di continuo.
         ============================================================ */
      +'<div class="sh-b"><div class="sh-tit">Come è fatto il prezzo</div>'
      +  '<div class="lav-media" id="cv-analisi">'+(isNew
          ? '<div class="lm-vuoto">Salva prima la lavorazione: poi, se non sta nel prezzario, qui ci costruisci il prezzo.</div>'
          : '<div class="lm-vuoto">Sto caricando…</div>')+'</div>'
      +'</div>'
      +'</div></div>',

       '<button class="btn b-cancel" data-action="comp-torna">← Torna al computo</button>'
      +'<button class="btn" data-action="pp-salva">★ Salva nel mio prezzario</button>'
      +'<button class="btn-primary b-save" data-action="comp-voce-salva" data-id="'+esc(String(v.id||""))+'">'+(isNew?"Crea lavorazione":"Salva")+'</button>');

    bindSeg("cv-conta");
    /* i due pulsanti accendono/spengono il campo della quantita' e sbiadiscono
       le misure, che con "a corpo" non contano piu' */
    $$("#cv-conta button").forEach(bt=>{
      const prima=bt.onclick;
      bt.onclick=()=>{ if(prima)prima();
        const corpo=(segVal("cv-conta")==="corpo");
        const box=$("#cv-qta-box"); if(box)box.style.display=corpo?"":"none";
        const mis=$("#cv-misure");  if(mis)mis.style.opacity=corpo?"0.45":"1";
      };
    });
    /* la ricerca parte da sola mentre scrivi, ma non a ogni lettera: 250 ms di
       pausa, se no su un prezzario grosso si fanno dieci viaggi per una parola */
    const _ce=$("#pp-cerca");
    if(_ce){_ce.oninput=function(){clearTimeout(ppTimer);ppTimer=setTimeout(ppCerca,250);};}
    ppFonteScelta=null;      /* la prende ppRiempiFonti dal computo */
    ppCerca(true);
    anEditId=null;
    if(!isNew){renderCompMisure(v.id);renderAnalisi(v.id);}
  }

  /* ---- il prezzario personale (tabella gest_prezzi_propri) ---- */
  /* ⚠️ LA RICERCA NON PUO' ESSERE "LETTERA PER LETTERA". 10 agosto 2026.
     Prima il filtro era un ilike sul testo esatto. Provandolo dal vivo: la voce
     salvata si chiamava "demolizione di tramezz-I", si e' cercato "tramezz-O" e
     non usciva niente — con la voce li' dentro. In cantiere nessuno si ricorda
     se l'aveva scritta al singolare o al plurale, e un prezzario che non trova
     quello che ci hai messo dentro e' peggio che non averlo.

     Adesso: le voci si tirano giu' una volta sola quando si apre la scheda e si
     filtrano QUI. Ogni parola cercata viene ridotta alla RADICE (via la vocale
     finale: tramezzo/tramezzi -> "tramezz", intonaco/intonaci -> "intonac") e
     si tolgono gli accenti. Le parole possono stare in qualsiasi ordine.

     IL LIMITE: si tengono in memoria le 500 voci piu' usate. Se il prezzario
     fosse piu' grande, per le altre si va a chiedere al database. Meglio dirlo
     che far finta che il limite non ci sia. */
  let ppCache=[], ppTutte=[], ppTimer=null, ppTetto=false, ppFonteScelta=null;
  const PP_MAX=500;

  /* ⚠️ LA TARIFFA GIUSTA. 10 agosto 2026.
     Chi lavora su due regioni si ritrova nel prezzario l'intonaco del Lazio a
     24,00 e quello dell'Umbria a 22,40: cercando "intonaco" uscivano tutti e
     due, identici a vedersi, e prendendo quello sbagliato nessuno avvisava —
     mentre sul PDF resta scritta la tariffa dichiarata sul computo.
     Adesso: la tendina si mette DA SOLA sulla tariffa che il computo dichiara
     (campo "Prezzario"), e sotto ogni voce si vede da dove viene. */
  function ppFonti(){
    const s=new Set();
    ppTutte.forEach(x=>{ if(x.fonte)s.add(x.fonte); });
    return Array.from(s).sort((a,b)=>a.localeCompare(b,"it"));
  }
  /* la tariffa del computo e quella del prezzario non si chiamano mai uguali
     ("Tariffa Regione Lazio" contro "tariffa-lazio-2023"): si confrontano le
     parole, e vince quella che ne ha di piu' in comune */
  function _ppSceltaAuto(fonti,dichiarata){
    const paroleDi=t=>_ppPiatto(t).split(/[^a-z0-9]+/).filter(w=>w.length>=3).map(_ppRadice);
    const P=paroleDi(dichiarata||"");
    if(!P.length)return null;
    let best=null,punti=0;
    fonti.forEach(f=>{
      const F=paroleDi(f);
      const n=P.filter(w=>F.some(x=>x.indexOf(w)>=0||w.indexOf(x)>=0)).length;
      if(n>punti){punti=n;best=f;}
    });
    return punti?best:null;
  }
  function ppRiempiFonti(){
    const box=$("#pp-fonte-box");if(!box)return;
    const comp=compCache.find(x=>String(x.id)===String(compVociCompId))||{};
    const dich=(comp.prezzario||"").trim();
    const fonti=ppFonti();
    /* la tariffa del computo: se l'hai scelta dalla tendina i nomi combaciano
       in pieno; sui computi vecchi, dove era testo libero, si confrontano le
       parole ("Tariffa Regione Lazio" con "tariffa-lazio-2023") */
    const suaFonte=(fonti.indexOf(dich)>=0)?dich:_ppSceltaAuto(fonti,[dich,(comp.prezzario_anno||"")].join(" "));
    if(ppFonteScelta===null)ppFonteScelta=suaFonte||"";
    const n=ppFonteScelta?ppTutte.filter(x=>x.fonte===ppFonteScelta).length:ppTutte.length;
    const _vc=k=>k+(k===1?" voce":" voci");
    box.innerHTML='<div class="sh-nota" style="margin-bottom:10px">'
      +(ppFonteScelta
        ? 'Cerco dentro <b>'+esc(ppFonteScelta)+'</b> ('+_vc(n)+'), la tariffa di questo computo. '
          +'<button type="button" class="btn-ghost quick-add" data-action="pp-tutte">cerca in tutte</button>'
        : 'Cerco in <b>tutte le tariffe</b> ('+_vc(n)+'): attento a non prendere il prezzo di una regione sbagliata. '
          +(suaFonte?'<button type="button" class="btn-ghost quick-add" data-action="pp-solo">torna a '+esc(suaFonte)+'</button>':''))
      +'</div>';
    box.dataset.sua=suaFonte||"";
  }

  function _ppPiatto(t){
    return String(t||"").toLowerCase()
      .replace(/[àáâä]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i")
      .replace(/[òóôö]/g,"o").replace(/[ùúûü]/g,"u");
  }
  /* la radice: via la vocale finale, ma solo da parole abbastanza lunghe.
     "muro"->"mur", "tramezzi"->"tramezz", ma "m2" e "kg" restano interi */
  function _ppRadice(w){ return (w.length>=4 && /[aeio]$/.test(w)) ? w.slice(0,-1) : w; }
  function _ppFiltra(elenco,q){
    const parole=_ppPiatto(q).split(/[^a-z0-9.]+/).filter(Boolean).map(_ppRadice);
    if(!parole.length)return elenco.slice();
    return elenco.filter(x=>{
      const testo=_ppPiatto((x.codice||"")+" "+(x.descrizione||"")+" "+(x.categoria||""));
      return parole.every(p=>testo.indexOf(p)>=0);
    });
  }
  async function ppCarica(){
    if(!sb||!sbUid){ppTutte=[];return null;}
    const {data,error}=await sb.from("gest_prezzi_propri").select("*")
      .eq("user_id",sbUid).is("eliminato_il",null)
      .order("usata_volte",{ascending:false}).limit(PP_MAX);
    if(error)return error;
    ppTutte=data||[];
    ppTetto=(ppTutte.length>=PP_MAX);
    return null;
  }
  async function ppCerca(ricarica){
    const box=$("#pp-lista");if(!box)return;
    if(!sb||!sbUid){box.innerHTML="";return;}
    if(ricarica||!ppTutte.length){
      const error=await ppCarica();
      if(error){
        box.innerHTML='<div class="sh-nota">'+(_compManca(error)
          ? 'Per il prezzario serve l\'aggiornamento del database: esegui <b>sql/gest-computo-metrico.sql</b> su Supabase.'
          : 'Non riesco a leggere il prezzario: '+esc(error.message))+'</div>';
        return;
      }
    }
    ppRiempiFonti();
    const q=String(($("#pp-cerca")&&$("#pp-cerca").value)||"").trim();
    const base=ppFonteScelta?ppTutte.filter(x=>x.fonte===ppFonteScelta):ppTutte;
    let trovate=_ppFiltra(base,q);
    /* prezzario piu' grande di quanto ne teniamo in memoria: le altre si
       cercano dove stanno davvero, invece di dire "non c'e'" a vanvera */
    if(!trovate.length && q && ppTetto){
      const rad=_ppRadice(_ppPiatto(q).split(/[^a-z0-9.]+/).filter(Boolean)[0]||"");
      if(rad){
        /* ===== 12 agosto 2026 (sera) — LA RICERCA DI RISERVA CAMBIAVA TARIFFA =====
           Il riquadro sopra dice, testuale: «Cerco dentro Tariffa Regione Lazio,
           la tariffa di questo computo». Poi, quando in memoria non trovava
           niente, questa ricerca andava a chiedere al database SENZA il filtro
           della tariffa: proponeva voci della Regione Umbria, dell'anno prima,
           di qualunque altro prezzario. Le cliccavi e finivano dentro un computo
           che dichiara un'altra tariffa — su una gara e' un errore che si paga.
           Adesso cerca dentro la tariffa dichiarata, come promette. */
        let qy=sb.from("gest_prezzi_propri").select("*")
          .eq("user_id",sbUid).is("eliminato_il",null);
        if(ppFonteScelta)qy=qy.eq("fonte",ppFonteScelta);
        const {data}=await qy.ilike("descrizione","%"+rad+"%")
          .order("usata_volte",{ascending:false}).limit(8);
        trovate=data||[];
      }
    }
    ppCache=trovate.slice(0,8);
    if(!ppCache.length){
      box.innerHTML='<p class="fatt-empty">'+(q?"Nessuna voce con questa parola.":"Il prezzario è ancora vuoto: la prima voce la salvi da qui sotto.")+'</p>';
      return;
    }
    /* niente tagli silenziosi: se ce ne sono più di otto, si dice */
    const _extra=(trovate.length>ppCache.length)?('<div class="sh-nota">Ne ho trovate '+trovate.length+': qui sotto le 8 che usi di più. Scrivi una parola in più per restringere.</div>'):"";
    box.innerHTML=ppCache.map(x=>
      '<div class="spesa-row" data-action="pp-usa" data-id="'+esc(String(x.id))+'" style="cursor:pointer;align-items:flex-start">'
      +'<span>'+(x.codice?'<b>'+esc(x.codice)+'</b> · ':'')+esc(x.descrizione||"(senza descrizione)")
      +  '<small class="sp-forn">'+eur2(x.prezzo_unitario)+(x.unita?" / "+esc(x.unita):"")
      +    ((+x.usata_volte)?(" · usata "+(+x.usata_volte)+((+x.usata_volte===1)?" volta":" volte")):"")
      /* la provenienza si vede SEMPRE quando non e' quella dichiarata dal
         computo: prima, avendo scelto una tariffa, la riga non diceva da dove
         veniva il prezzo e una voce di un'altra tariffa era indistinguibile */
      +    ((x.fonte&&(!ppFonteScelta||x.fonte!==ppFonteScelta))
             ?(' · <b'+((ppFonteScelta&&x.fonte!==ppFonteScelta)?' style="color:var(--err,#c0392b)"':'')+'>'+esc(x.fonte)+'</b>'):"")+'</small></span>'
      +'<b></b>'
      +'<button type="button" class="rdel" data-action="pp-del" data-id="'+esc(String(x.id))+'" title="Togli dal prezzario">×</button></div>').join("")+_extra;
  }
  /* riempie la lavorazione con la voce scelta. Il prezzo entra come una FOTO:
     se domani lo alzi nel prezzario, i computi già fatti non cambiano. */
  /* ============================================================
     18 agosto 2026 — L'UNITÀ CHE NON STA NELLA TENDINA
     ============================================================
     La tendina ha dodici unità (m, m², m³, kg, cad…), ma un prezzario vero
     ne usa anche altre: «mq/cm», «paio», «addetto», «cad/giorno». Prima,
     se l'unità della voce non stava nella tendina, NON veniva impostata: la
     lavorazione si prendeva quella rimasta da prima, e nessuno lo diceva.
     Un prezzo al «mq/cm» finito su una riga in «m³» è un conto sbagliato
     che sembra giusto. Adesso l'unità che manca si aggiunge alla tendina.
     ============================================================ */
  function _uniMetti(sel,unita){
    const u=(typeof sel==="string")?$(sel):sel;
    const v=String(unita==null?"":unita).trim();
    if(!u||!v)return false;
    const c=Array.prototype.slice.call(u.options).some(o=>o.value===v);
    if(!c){const o=document.createElement("option");o.value=v;o.textContent=v;u.appendChild(o);}
    u.value=v;
    return true;
  }
  async function ppUsa(id){
    const x=ppCache.find(v=>String(v.id)===String(id));if(!x)return;
    const set=(sel,val)=>{const e=$(sel);if(e)e.value=val;};
    set("#cv-cod",x.codice||"");
    set("#cv-desc",x.descrizione||"");
    set("#cv-prezzo",x.prezzo_unitario!=null?_prezzoTesto(x.prezzo_unitario):"");
    _uniMetti("#cv-uni",x.unita);
    const m=$("#cv-mano");if(m&&x.incidenza_manodopera!=null)m.value=String(x.incidenza_manodopera).replace(".",",");
    sb.from("gest_prezzi_propri").update({usata_volte:(+x.usata_volte||0)+1}).eq("id",id).eq("user_id",sbUid)
      .then(function(){},function(){});
    toast("Voce presa dal prezzario ✔");
  }
  async function ppDel(id){
    const x=ppCache.find(v=>String(v.id)===String(id))||{};
    if(!gconfirm("Togliere «"+(x.descrizione||"")+"» dal tuo prezzario?\n\n"+fraseCestino()+"\nI computi già fatti non cambiano."))return;
    /* .delete() e' quello giusto: js/cestino.js lo trasforma da solo in una
       data su eliminato_il, come per tutte le altre tabelle del gestionale.
       Scriverci la data a mano qui vorrebbe dire avere la regola in due posti. */
    const {error}=await sb.from("gest_prezzi_propri").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    await ppCerca(true);
    toast("Tolta dal prezzario");
  }
  /* salva nel prezzario quello che c'e' scritto adesso nella lavorazione.
     Se una voce con lo STESSO codice e la stessa descrizione c'e' gia', si
     aggiorna il prezzo invece di fare un doppione: se no dopo un mese il
     prezzario e' pieno di "tramezzo" uguali con prezzi diversi. */
  async function ppSalva(){
    if(!sbUid)return;
    const desc=String(($("#cv-desc")&&$("#cv-desc").value)||"").trim();
    if(!desc){toast("Scrivi prima la descrizione della lavorazione");return;}
    const cod=String(($("#cv-cod")&&$("#cv-cod").value)||"").trim()||null;
    const uni=($("#cv-uni")&&$("#cv-uni").value)||null;
    const prezzo=_numIt("#cv-prezzo")||0;
    const mano=$("#cv-mano")?_numIt("#cv-mano"):null;
    let g=sb.from("gest_prezzi_propri").select("id").eq("user_id",sbUid).is("eliminato_il",null).eq("descrizione",desc);
    g=cod?g.eq("codice",cod):g.is("codice",null);
    const {data:gia}=await g.limit(1);
    const riga={descrizione:desc, codice:cod, unita:uni, prezzo_unitario:prezzo};
    if(mano!=null)riga.incidenza_manodopera=mano;
    let error;
    if(gia&&gia.length){
      ({error}=await sb.from("gest_prezzi_propri").update(riga).eq("id",gia[0].id).eq("user_id",sbUid));
    }else{
      ({error}=await sb.from("gest_prezzi_propri").insert(Object.assign({user_id:sbUid,fonte:"mio"},riga)));
    }
    if(error){
      toast(_compManca(error)?"Per il prezzario serve l'aggiornamento del database (sql/gest-computo-metrico.sql)":("Errore: "+error.message));
      return;
    }
    await ppCerca(true);
    toast((gia&&gia.length)?"Prezzo aggiornato nel tuo prezzario ✔":"Voce salvata nel tuo prezzario ✔");
  }

  async function renderCompMisure(voceId){
    const box=$("#cv-misure");if(!box)return;
    const {data,error}=await sb.from("gest_computo_misure").select("*")
      .eq("user_id",sbUid).eq("voce_id",voceId).order("ordine");
    if(error){
      box.innerHTML='<div class="lm-vuoto">Non riesco a leggere le misure: '+esc(error.message)+'</div>';
      return;
    }
    compMisCache=data||[];
    const tot=compMisCache.reduce((s,m)=>s+(+m.quantita||0),0);
    const pezzo=(v,lab)=>v==null?"":(" "+lab+" "+_misTesto(v));
    const righe=compMisCache.length?compMisCache.map(m=>
      '<div class="spesa-row" data-action="comp-mis-edit" data-id="'+esc(String(m.id))+'"'
        +(String(m.id)===String(compMisEditId)?' style="cursor:pointer;background:var(--sfondo,#f5f6f8)"':' style="cursor:pointer"')
        +'><span>'+(m.detrai?'<b style="color:var(--err,#c0392b)">− </b>':'')
        +esc(m.descrizione||"(senza nome)")
        +'<small class="sp-forn">'+_partiTesto(m.parti)+(((m.parti==null?1:+m.parti)===1)?" parte":" parti")
        + pezzo(m.lunghezza,"× lung.")+pezzo(m.larghezza,"× larg.")+pezzo(m.altezza,"× alt.")
        +'</small></span>'
      +'<b'+(m.detrai?' style="color:var(--err,#c0392b)"':'')+'>'+_misLetta(m.quantita)+'</b>'
      +'<button type="button" class="rdel" data-action="comp-mis-del" data-id="'+esc(String(m.id))+'" title="Elimina la misura">×</button></div>'
    ).join(""):'<p class="fatt-empty">Nessuna misura: la quantità è zero.</p>';

    /* ⚠️ LA CORREZIONE DI UNA MISURA. 10 agosto 2026.
       Prima una misura sbagliata si poteva solo cancellare e riscrivere da capo:
       quattro campi e il verso, per cambiare un 2,70 in 2,10. Adesso ci clicchi
       sopra, il modulo qui sotto si riempie con i suoi numeri, e il pulsante
       diventa "Salva la misura". La riga in correzione resta evidenziata, se no
       non si capisce piu' quale si sta toccando. */
    const inCorr=compMisCache.find(m=>String(m.id)===String(compMisEditId))||null;
    if(compMisEditId&&!inCorr)compMisEditId=null;   /* cancellata da un'altra parte */
    const _v=(x)=>x==null?"":esc(_misTesto(x));
    /* ⚠️ LE PARTI UGUALI SONO UN CONTEGGIO, NON UNA MISURA — 14 agosto 2026.
       Il modulo di correzione riempiva anche questa casella con _misTesto, che
       mette sempre due decimali: aprendo una misura da 1 parte ci si trovava
       scritto «1,00 parti», da 2 «2,00 parti». Nell'elenco sopra si legge già
       «1 parte» / «2 parti» (_partiTesto), quindi la stessa misura si leggeva
       in due modi diversi a due dita di distanza. Riprodotto nel browser.
       _partiTesto esisteva apposta dal 10 agosto: qui non veniva usata. */
    const _vp=(x)=>x==null?"":esc(_partiTesto(x));
    box.innerHTML=righe
      +'<div class="spesa-row" style="border-top:2px solid var(--bordo)"><span><b>Quantità totale</b></span><b>'+_misLetta(tot)+'</b><span></span></div>'
      +'<div style="margin-top:14px;border-top:1px solid var(--bordo);padding-top:14px">'
      +  (inCorr?'<div class="sh-tit" style="margin-bottom:8px">Stai correggendo «'+esc(inCorr.descrizione||"(senza nome)")+'»</div>':'')
      +  '<div class="field"><label>Che cosa stai misurando</label><input id="cm-desc"'+_noAuto()+' value="'+(inCorr?esc(inCorr.descrizione||""):"")+'" placeholder="Es. tramezzo cucina, porta da detrarre"></div>'
      /* ⚠️ QUESTO BLOCCO STA QUI SOPRA APPOSTA, non in fondo. 10 agosto 2026.
         Prima stava sotto ai quattro campi delle misure, a un dito dal pulsante
         "Aggiungi": bisognava scorrere per vederlo e sfuggiva sistematicamente.
         Provato dal vivo: tre porte su tre sono entrate SOMMATE invece che
         sottratte, e il computo usciva 23,82 invece di 20,46. Adesso si decide
         subito dopo aver scritto che cosa si sta misurando, che e' il momento
         in cui uno lo sa. */
      +  '<div class="field"><label>Questa misura</label><div class="seg" id="cm-verso">'
      +    '<button data-v="piu"'+((inCorr&&inCorr.detrai)?'':' class="on"')+'>Si aggiunge</button>'
      +    '<button data-v="meno"'+((inCorr&&inCorr.detrai)?' class="on"':'')+'>Si detrae</button>'
      +  '</div>'
      +  '<div class="sh-nota">«Si detrae» sono i vuoti: le porte, le finestre, i fori. Vengono sottratti dal totale.</div></div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Parti uguali</label><input type="text" inputmode="decimal" id="cm-parti"'+_noAuto()+' value="'+(inCorr?_vp(inCorr.parti):"")+'" placeholder="1"></div>'
      +    '<div class="field"><label>Lunghezza</label><input type="text" inputmode="decimal" id="cm-lung"'+_noAuto()+' value="'+(inCorr?_v(inCorr.lunghezza):"")+'" placeholder="3,20"></div>'
      +  '</div>'
      +  '<div class="row2">'
      +    '<div class="field"><label>Larghezza</label><input type="text" inputmode="decimal" id="cm-larg"'+_noAuto()+' value="'+(inCorr?_v(inCorr.larghezza):"")+'" placeholder="vuoto = non la uso"></div>'
      +    '<div class="field"><label>Altezza o spessore</label><input type="text" inputmode="decimal" id="cm-alt"'+_noAuto()+' value="'+(inCorr?_v(inCorr.altezza):"")+'" placeholder="2,70"></div>'
      +  '</div>'
      +  '<button type="button" class="btn-primary quick-add" data-action="comp-mis-add" data-id="'+esc(String(voceId))+'">'+(inCorr?"Salva la misura":"+ Aggiungi la misura")+'</button>'
      +  (inCorr?' <button type="button" class="btn-ghost quick-add" data-action="comp-mis-annulla">Annulla la correzione</button>':'')
      +  '<div class="sh-nota">Un campo <b>vuoto</b> non entra nel conto (vale 1): per i metri quadri riempi lunghezza e altezza e lascia stare la larghezza. Uno <b>zero</b> scritto invece vale zero davvero.</div>'
      +'</div>';
    bindSeg("cm-verso");
  }

  /* ⚠️ Il chiavistello del doppio clic. 10 agosto 2026.
     Difetto vero, trovato provando il computo: la porta da detrarre era entrata
     DUE volte identica. Supabase ci mette qualche decimo di secondo a
     rispondere, e in quel buco il pulsante restava premibile: chi non e' sicuro
     che il clic abbia preso ne fa un secondo, e la misura si salva due volte.
     Riprodotto nel browser con la stessa lentezza della rete: 5 prove su 5.
     Il chiavistello e' la variabile, non il pulsante spento: se un domani il
     pulsante cambia forma, la doppia scrittura resta bloccata lo stesso. */
  let compMisSalvo=false, compMisEditId=null;
  async function compMisAdd(voceId){
    if(!sbUid||!voceId)return;
    if(compMisSalvo)return;
    const desc=String(($("#cm-desc")&&$("#cm-desc").value)||"").trim();
    const parti=_numIt("#cm-parti"), lung=_numIt("#cm-lung"), larg=_numIt("#cm-larg"), alt=_numIt("#cm-alt");
    if(parti==null&&lung==null&&larg==null&&alt==null){
      toast("Scrivi almeno una misura (o le parti uguali)");return;
    }
    /* ⚠️ La rete di sicurezza sui VUOTI. Una misura che si chiama "porta" o
       "finestra" e viene SOMMATA e' quasi sempre un pulsante dimenticato, non
       una scelta: il computo esce piu' grande del vero e non se ne accorge
       nessuno, perche' il numero e' verosimile. Qui si chiede, e basta. */
    if(segVal("cm-verso")!=="meno" && /porta|finestr|vuot|foro|fori|apertur|nicchi|detra|luce/i.test(desc)){
      if(!gconfirm("Questa misura si chiama «"+desc+"»: sembra un vuoto da togliere.\n\n"
        +"Così com'è viene SOMMATA, non sottratta.\n\n"
        +"Vai avanti lo stesso e la aggiungo in più?"))return;
    }
    const bt=$('[data-action="comp-mis-add"]');
    compMisSalvo=true;
    if(bt){bt.disabled=true;bt.textContent="Sto salvando…";}
    const riga={descrizione:desc||null, parti:parti, lunghezza:lung, larghezza:larg, altezza:alt,
                detrai:(segVal("cm-verso")==="meno")};
    let error;
    if(compMisEditId){
      /* si CORREGGE una misura che c'e' gia': l'ordine non si tocca, se no la
         riga corretta salta in fondo e il computo si rimescola sotto gli occhi */
      const r=await sb.from("gest_computo_misure").update(riga)
        .eq("id",compMisEditId).eq("user_id",sbUid).select("id");
      error=r.error;
      if(!error&&(!r.data||!r.data.length))error={message:"nessuna riga modificata. Riprova."};
    }else{
      const ord=compMisCache.reduce((m,x)=>Math.max(m,+x.ordine||0),0)+1;
      const r=await sb.from("gest_computo_misure").insert(Object.assign(
        {user_id:sbUid, voce_id:voceId, ordine:ord},riga));
      error=r.error;
    }
    if(error){
      /* il modulo NON si ridisegna quando c'e' un errore: il pulsante va
         riacceso a mano, se no resta spento e non si aggiunge piu' niente */
      compMisSalvo=false;
      if(bt){bt.disabled=false;bt.textContent=compMisEditId?"Salva la misura":"+ Aggiungi la misura";}
      toast("Errore: "+error.message);return;
    }
    const correggeva=!!compMisEditId;
    compMisEditId=null;
    await renderCompMisure(voceId);   /* ridisegna il pulsante pulito */
    compMisSalvo=false;
    rinfresca("computi");
    toast(correggeva?"Misura corretta ✔":"Misura aggiunta ✔");
  }
  function compMisEdit(id){
    compMisEditId=id;
    renderCompMisure(compVoceId);
  }
  function compMisAnnulla(){
    compMisEditId=null;
    renderCompMisure(compVoceId);
  }
  async function compMisDel(id){
    if(!sbUid)return;
    if(String(id)===String(compMisEditId))compMisEditId=null;
    const {error}=await sb.from("gest_computo_misure").delete().eq("id",id).eq("user_id",sbUid);
    if(error){toast("Errore: "+error.message);return;}
    await renderCompMisure(compVoceId);
    rinfresca("computi");
    toast("Misura eliminata");
  }

  /* ============================================================
     21 agosto 2026 — L'ANALISI DEI PREZZI
     ============================================================
     Quando una lavorazione NON sta nel prezzario, il prezzo non te lo puoi
     inventare: lo devi costruire e far vedere come. Si mettono in fila i
     costi diretti — materiali, Manodopera, noli — poi le SPESE GENERALI
     (13-17%) e l'UTILE dell'impresa (10%). Sui lavori pubblici quelle due
     percentuali le dice la legge.

     ⛔ L'ANALISI E' SEMPRE PER UNA UNITA' DI MISURA.
        Se la lavorazione si misura al metro quadro, qui dentro si scrive
        quanto costa UN metro quadro. La quantita' totale la mette il
        computo con le misure, qui sopra. E' l'errore piu' facile da fare
        e sul foglio si vede subito, perche' il prezzo esce fuori scala di
        cento volte: per questo la frase sta in cima al blocco e non in
        fondo, dove non la legge nessuno.

     ⛔ IL CONTO NON E' QUI. Lo fa il database (vista gest_analisi_totali,
        vedi sql/gest-analisi-prezzi.sql). Questa schermata LEGGE il
        risultato, non lo rifa'. E' la stessa scelta della quantita' delle
        lavorazioni e delle date del cronoprogramma: un conto scritto in
        due posti prima o poi dice due cose diverse.

     ⚠️ «Manodopera» va scritta con la MAIUSCOLA. Per gli studi tecnici il
        gestionale riscrive «manodopera» in «tempo speso» (vedi _FRASI), e
        su un'analisi dei prezzi il termine giusto e' quello di legge.
        Con la maiuscola il traduttore non la tocca. Provato nel banco
        delle parole.
     ============================================================ */
  let anCache=[], anTot=null, anEditId=null, anSalvo=false, anAttiva=false;

  /* la colonna di gest_analisi_totali che tiene il totale di ogni gruppo */
  const AN_COL={ materiale:"materiali", manodopera:"manodopera", nolo:"noli", altro:"altro" };
  const AN_TIPI=[["materiale","Materiali"],["manodopera","Manodopera"],
                 ["nolo","Noli e mezzi"],["altro","Altro"]];

  /* ⚠️ UNA TABELLA, NON UNA FILA DI SOSTITUZIONI. 21 agosto 2026.
     Qui c'era «uni.replace(...).replace(...)» una decina di volte per
     trasformare «m²» in «metro quadro». Le sostituzioni dopo la prima
     mordevano DENTRO la parola gia' scritta: la «t» di «metro» diventava
     «tonnellata», la «l» diventava «litro», la «q» «quintale», e sullo
     schermo si leggeva «un metonnelitrolataro quintaleuadro». Visto nella
     schermata vera, non nel codice.
     Con la tabella c'e' anche l'articolo giusto: un'ora, una tonnellata. */
  const AN_UNO={ "m":"un metro", "m²":"un metro quadro", "m³":"un metro cubo",
                 "kg":"un chilo", "q":"un quintale", "t":"una tonnellata",
                 "cad":"un pezzo", "n.":"un pezzo", "corpo":"un corpo",
                 "ora":"un'ora", "giorno":"una giornata", "l":"un litro" };
  const _anLab=t=>(AN_TIPI.find(x=>x[0]===t)||["","Altro"])[1];

  /* la casella «Prezzo unitario» qui a fianco: se il prezzo lo costruisce
     l'analisi, quella casella non comanda piu' niente. Si spegne e mostra
     il numero vero, invece di restare scrivibile e non servire a nulla. */
  function anPrezzoCasella(){
    const inp=$("#cv-prezzo"), nota=$("#cv-prezzo-nota");
    if(!inp)return;
    if(anAttiva&&anTot){
      inp.value=_prezzoTesto(anTot.prezzo);
      inp.disabled=true;
      inp.style.opacity="0.65";
      if(nota){nota.style.display="";}
    }else{
      inp.disabled=false;
      inp.style.opacity="";
      if(nota){nota.style.display="none";}
    }
  }

  async function renderAnalisi(voceId){
    const box=$("#cv-analisi"); if(!box)return;
    if(!sb||!sbUid){box.innerHTML='<div class="lm-vuoto">Non risulti collegato.</div>';return;}

    const [rr,rt]=await Promise.all([
      sb.from("gest_analisi_righe_calc").select("*").eq("user_id",sbUid).eq("voce_id",voceId).order("ordine"),
      sb.from("gest_analisi_totali").select("*").eq("user_id",sbUid).eq("voce_id",voceId).maybeSingle()
    ]);
    /* ⚠️ se l'aggiornamento del database non e' stato eseguito NON si mostra
       una schermata vuota che sembra funzionante: si dice cosa eseguire.
       Stessa scelta del cronoprogramma e della variante. */
    if(rr.error){
      anAttiva=false; anTot=null; anPrezzoCasella();
      box.innerHTML='<div class="lm-vuoto">'
        +(/righe_calc/i.test(String(rr.error.message||""))
          ? 'Per far tornare i conti al centesimo serve l\'aggiornamento del database: esegui <b>sql/gest-analisi-arrotondamento.sql</b> su Supabase.'
          : /gest_analisi|does not exist|schema cache|relation/i.test(String(rr.error.message||""))
          ? 'Per l\'analisi dei prezzi serve l\'aggiornamento del database: esegui <b>sql/gest-analisi-prezzi.sql</b> su Supabase.'
          : 'Non riesco a leggere l\'analisi: '+esc(rr.error.message))+'</div>';
      return;
    }
    anCache=rr.data||[];
    anTot=(rt&&!rt.error)?(rt.data||null):null;
    anAttiva=!!(anTot&&(+anTot.righe||0)>0);
    anPrezzoCasella();

    const uni=(($("#cv-uni")&&$("#cv-uni").value)||"").trim();
    const perUno=AN_UNO[uni]||(uni?("una unità di "+uni):"una unità");

    let h='<div class="sh-nota" style="margin-top:0"><b>Serve solo se la lavorazione non sta nel prezzario.</b><br>'
      +'Qui dentro si scrive quello che serve per fare <b>'+esc(perUno)+'</b>: non tutta la lavorazione. '
      +'La quantità totale la mettono le misure qui sopra.</div>';

    if(!anCache.length){
      h+='<div class="co-vuoto"><div class="co-vuoto-ic">🧮</div>'
        +'<h4>Il prezzo si costruisce</h4>'
        +'<p>Aggiungi qui sotto i materiali, le ore e i noli che servono per <b>'+esc(perUno)+'</b>. '
        +'Il gestionale ci mette le spese generali e l\'utile, e il prezzo della lavorazione diventa quello.</p></div>';
    }else{
      /* le righe, raggruppate: su un'analisi di gara i tre gruppi vanno
         separati, non messi in fila uno dietro l'altro */
      AN_TIPI.forEach(function(t){
        const righe=anCache.filter(r=>r.tipo===t[0]);
        if(!righe.length)return;
        /* ⛔ 22 agosto 2026 — IL TOTALE DEL GRUPPO LO DA' IL DATABASE.
           Qui si sommavano i numeri lunghi (quantita x prezzo, quattro
           decimali) e si stampavano quelli corti: Materiali 8,93 +
           Manodopera 14,63 + Noli 2,24 facevano 25,80, e i costi diretti
           dicevano 25,79. Un centesimo, su un documento di gara.
           Adesso il conto e' tutto nel database, chiuso a due decimali
           riga per riga (sql/gest-analisi-arrotondamento.sql), e qui si
           legge: schermo e foglio non possono piu' dire due cose diverse. */
        const sub=anTot?(+anTot[AN_COL[t[0]]]||0)
                       :righe.reduce((s,r)=>s+(+r.importo||0),0);
        h+='<div class="an-grp"><span>'+t[1]+'</span><b>'+eur2(sub)+'</b></div>';
        righe.forEach(function(r){
          const imp=+r.importo||0;   /* l'importo lo da' il database, gia' a due decimali */
          h+='<div class="spesa-row" data-action="an-edit" data-id="'+esc(String(r.id))+'"'
            +(String(r.id)===String(anEditId)?' style="cursor:pointer;background:var(--sfondo,#f5f6f8)"':' style="cursor:pointer"')
            /* ⛔ «cm-testo»: QUESTO L'HA SCRITTO LUI, non lo traduciamo.
               21 agosto 2026 — visto da Alessio in una foto: aveva scritto
               «Muratore» nella Manodopera e sullo schermo si leggeva
               «Disegnatore CAD». Per gli studi tecnici il gestionale
               riscrive le parole da cantiere (_FRASI), ma le righe
               dell'analisi le scrive l'utente: sono contenuto suo, come le
               descrizioni del prezzario. Nel database era salvato giusto —
               mentiva solo lo schermo, che è il posto peggiore dove
               mentire. Stessa protezione del 20 agosto. */
            +'><span class="cm-testo">'+esc(r.descrizione||"(senza nome)")
            +'<small class="sp-forn">'+_misTesto(r.quantita)+(r.unita?" "+esc(r.unita):"")
            +' × '+eur2(r.prezzo_unitario)+'</small></span>'
            +'<b>'+eur2(imp)+'</b>'
            +'<button type="button" class="rdel" data-action="an-del" data-id="'+esc(String(r.id))+'" title="Elimina la riga">×</button></div>';
        });
      });

      /* il conto: viene dal database, non si rifà qui */
      const t=anTot||{};
      h+='<div class="an-conto">'
        +'<div class="an-r"><span>Costi diretti</span><b>'+eur2(t.costi)+'</b></div>'
        +'<div class="an-r"><span class="an-lab">Spese generali'
        +  '<input type="text" inputmode="decimal" class="an-perc" id="an-sp"'+_noAuto()
        +  ' value="'+esc(_pct(t.spese_perc))+'" title="dal 13 al 17%">%</span><b>'+eur2(t.spese)+'</b></div>'
        +'<div class="an-r"><span class="an-lab">Utile'
        +  '<input type="text" inputmode="decimal" class="an-perc" id="an-ut"'+_noAuto()
        +  ' value="'+esc(_pct(t.utile_perc))+'" title="di legge il 10%">%</span><b>'+eur2(t.utile)+'</b></div>'
        +'<div class="an-r an-tot"><span>Prezzo per '+esc(perUno)+'</span><b>'+eur2(t.prezzo)+'</b></div>'
        +'</div>'
        +'<div class="sh-nota">L\'utile si calcola su <b>costi + spese generali</b>, come vuole un\'analisi. '
        +'Le percentuali si salvano da sole appena le cambi.</div>';
    }

    /* il modulo per aggiungere (o correggere) una riga */
    const inCorr=anCache.find(r=>String(r.id)===String(anEditId))||null;
    if(anEditId&&!inCorr)anEditId=null;
    const _v=x=>x==null?"":esc(_misTesto(x));
    h+='<div style="margin-top:14px;border-top:1px solid var(--bordo);padding-top:14px">'
      +(inCorr?'<div class="sh-tit" style="margin-bottom:8px">Stai correggendo «<span class="cm-testo">'+esc(inCorr.descrizione||"(senza nome)")+'</span>»</div>':'')
      +'<div class="field"><label>Che cosa serve</label><div class="seg" id="an-tipo">'
      + AN_TIPI.map(function(t){
          const on=(inCorr?inCorr.tipo:"materiale")===t[0];
          return '<button data-v="'+t[0]+'"'+(on?' class="on"':'')+'>'+t[1]+'</button>';
        }).join("")
      +'</div></div>'
      +'<div class="field"><label>Descrizione</label><input id="an-desc"'+_noAuto()
      +' value="'+(inCorr?esc(inCorr.descrizione||""):"")+'" placeholder="Es. Pietra locale a spacco, sp. 3-5 cm"></div>'
      +'<div class="row2">'
      /* ⚠️ 21 agosto 2026 — UNA TENDINA, NON UNA CASELLA.
         Qui c'era una casella da scrivere a mano, e nella lavorazione qui a
         sinistra l'unità si sceglie da una tendina: due modi diversi per la
         stessa cosa nella stessa schermata. E il quadratino di «m²» sulla
         tastiera non si sa fare (Alt+0178 col tastierino): Alessio ha
         scritto «m2», che non è sbagliato ma non è quello che c'è scritto
         due dita più in là. Adesso si sceglie, e chi ha bisogno di «sacco»
         o «viaggio» prende «— la scrivo io —».
         È lo stesso modo del campo prezzario del computo. */
      +  '<div class="field"><label>Unità</label>'
      +    '<select id="an-uni-sel">'
      +      '<option value=""'+((inCorr&&inCorr.unita)?'':' selected')+'>— unità —</option>'
      +      UNITA.map(function(u){
             return '<option value="'+u+'"'+((inCorr&&inCorr.unita===u)?' selected':'')+'>'+u+'</option>';
           }).join("")
      +      '<option value="__mia__"'+((inCorr&&inCorr.unita&&UNITA.indexOf(inCorr.unita)<0)?' selected':'')+'>— la scrivo io —</option>'
      +    '</select>'
      +    '<input id="an-uni" class="an-uni-mia"'+_noAuto()
      +    ' style="margin-top:8px;'+((inCorr&&inCorr.unita&&UNITA.indexOf(inCorr.unita)<0)?'':'display:none')+'"'
      +    ' value="'+(inCorr?esc(inCorr.unita||""):"")+'" placeholder="sacco, viaggio, q.li…"></div>'
      +  '<div class="field"><label>Quantità per '+esc(perUno)+'</label><input type="text" inputmode="decimal" id="an-qta"'+_noAuto()
      +  ' value="'+(inCorr?_v(inCorr.quantita):"")+'" placeholder="1,05"></div>'
      +'</div>'
      +'<div class="field"><label>Prezzo unitario (€)</label><input type="text" inputmode="decimal" id="an-prezzo"'+_noAuto()
      +' value="'+(inCorr?esc(_prezzoTesto(inCorr.prezzo_unitario)):"")+'" placeholder="42,00" style="max-width:200px"></div>'
      +'<button type="button" class="btn-primary quick-add" data-action="an-add" data-id="'+esc(String(voceId))+'">'
      + (inCorr?"Salva la riga":"+ Aggiungi al prezzo")+'</button>'
      + (inCorr?' <button type="button" class="btn-ghost quick-add" data-action="an-annulla">Annulla la correzione</button>':'')
      +'<div class="sh-nota">Per la Manodopera la quantità sono le <b>ore</b>: 0,85 ore di muratore per '+esc(perUno)+', non otto ore di giornata.</div>'
      +'</div>';

    box.innerHTML=h;
    bindSeg("an-tipo");
    /* la casella «la scrivo io» si accende e si spegne con la tendina */
    const _us=$("#an-uni-sel");
    if(_us)_us.onchange=function(){
      const box2=$("#an-uni");
      if(box2){ box2.style.display=(_us.value==="__mia__")?"":"none";
                if(_us.value==="__mia__")box2.focus(); }
    };
    /* le due percentuali si salvano appena le cambi: sono due numeri, e un
       pulsante «salva» in più per due numeri è un pulsante che non si preme */
    ["an-sp","an-ut"].forEach(function(k){
      const e=$("#"+k);
      if(e)e.addEventListener("change",function(){ anPerc(voceId); });
    });
  }

  /* l'unità della riga: dalla tendina, o dalla casella se hai scelto «la
     scrivo io». Sta in una funzione sola perché la leggono sia il salvataggio
     sia il banco: se un domani cambia la tendina, cambia in un posto. */
  function anUnita(){
    const sel=$("#an-uni-sel"), mia=$("#an-uni");
    const v=(sel&&sel.value)||"";
    if(v==="__mia__")return String((mia&&mia.value)||"").trim()||null;
    return v||null;
  }

  /* ⚠️ il chiavistello del doppio clic, come per le misure: Supabase ci mette
     qualche decimo di secondo, e in quel buco il pulsante resta premibile. */
  async function anAdd(voceId){
    if(!sbUid||!voceId)return;
    if(anSalvo)return;
    const desc=String(($("#an-desc")&&$("#an-desc").value)||"").trim();
    if(!desc){toast("Scrivi che cosa serve");return;}
    const q=_numIt("#an-qta"), p=_numIt("#an-prezzo");
    if(q==null||!(q>0)){toast("Scrivi la quantità che serve per una unità di lavorazione");return;}
    if(p==null||p<0){toast("Scrivi il prezzo, e non può essere negativo");return;}
    const riga={ tipo:(segVal("an-tipo")||"materiale"), descrizione:desc,
                 unita:anUnita(), quantita:q, prezzo_unitario:p };
    anSalvo=true;
    const bt=$('[data-action="an-add"]'); if(bt)bt.disabled=true;
    let res;
    if(anEditId){
      res=await sb.from("gest_analisi_righe").update(riga).eq("id",anEditId).eq("user_id",sbUid).select("id");
    }else{
      riga.user_id=sbUid; riga.voce_id=voceId;
      riga.ordine=anCache.reduce((m,x)=>Math.max(m,+x.ordine||0),0)+1;
      res=await sb.from("gest_analisi_righe").insert(riga).select("id");
    }
    anSalvo=false; if(bt)bt.disabled=false;
    if(res.error){
      toast(/gest_analisi|does not exist|schema cache|relation/i.test(String(res.error.message||""))
        ? "Per l'analisi dei prezzi serve l'aggiornamento del database: esegui sql/gest-analisi-prezzi.sql su Supabase"
        : "Errore: "+res.error.message);
      return;
    }
    if(!res.data||!res.data.length){toast("Non salvata: nessuna riga scritta. Riprova.");return;}
    anEditId=null;
    await renderAnalisi(voceId);
    rinfresca("computi");
    toast("Prezzo aggiornato ✔");
  }

  function anEdit(id){ anEditId=(String(anEditId||"")===String(id))?null:id; renderAnalisi(compVoceId); }
  function anAnnulla(){ anEditId=null; renderAnalisi(compVoceId); }

  async function anDel(id){
    if(!sbUid)return;
    /* ⚠️ la domanda NON contiene il nome della riga: gconfirm passa dal
       traduttore (_msgPro), e un «Muratore» scritto da lui ci uscirebbe
       riscritto — la stessa bugia di sopra, ma dentro una domanda a cui si
       risponde sì. Quale riga si sta togliendo si vede già: è quella su cui
       hai premuto la ×. */
    if(!gconfirm("Tolgo questa riga dal prezzo?"))return;
    const res=await sb.from("gest_analisi_righe").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(res.error){toast("Errore: "+res.error.message);return;}
    if(!res.data||!res.data.length){toast("Non eliminata: nessuna riga trovata. Riprova.");return;}
    if(String(anEditId||"")===String(id))anEditId=null;
    await renderAnalisi(compVoceId);
    rinfresca("computi");
    toast("Riga tolta");
  }

  /* le due percentuali stanno sulla LAVORAZIONE, non sulle righe */
  async function anPerc(voceId){
    if(!sbUid||!voceId)return;
    const sp=_numIt("#an-sp"), ut=_numIt("#an-ut");
    for(const x of [["Le spese generali",sp],["L'utile",ut]]){
      if(x[1]!=null&&(!isFinite(x[1])||x[1]<0||x[1]>100)){
        toast(x[0]+" devono stare fra 0 e 100. Controlla il numero.");
        await renderAnalisi(voceId);
        return;
      }
    }
    const res=await sb.from("gest_computo_voci")
      .update({an_spese_perc:sp, an_utile_perc:ut})
      .eq("id",voceId).eq("user_id",sbUid).select("id");
    if(res.error){
      toast(/an_spese_perc|an_utile_perc/i.test(String(res.error.message||""))
        ? "Per l'analisi dei prezzi serve l'aggiornamento del database: esegui sql/gest-analisi-prezzi.sql su Supabase"
        : "Errore: "+res.error.message);
      return;
    }
    await renderAnalisi(voceId);
    rinfresca("computi");
    toast("Percentuali salvate ✔");
  }

  async function compVoceSalva(id){
    if(!sbUid||!compVociCompId)return;
    const desc=String(($("#cv-desc")&&$("#cv-desc").value)||"").trim();
    if(!desc){toast("Scrivi la descrizione della lavorazione");return;}
    const aCorpo=(segVal("cv-conta")==="corpo");
    const row={
      user_id:sbUid, computo_id:compVociCompId,
      capitolo_id:($("#cv-cap")&&$("#cv-cap").value)||null,
      codice:String(($("#cv-cod")&&$("#cv-cod").value)||"").trim()||null,
      descrizione:desc,
      unita:($("#cv-uni")&&$("#cv-uni").value)||null,
      /* ⚠️ se il prezzo lo costruisce l'analisi, la casella qui accanto e'
         spenta e mostra il numero calcolato: riscriverlo qui vorrebbe dire
         schiacciare il prezzo scritto a mano con quello dell'analisi, e il
         giorno che cancelli le righe dell'analisi ti ritroveresti come
         «prezzo tuo» l'ultimo numero che aveva calcolato lei. */
      prezzo_unitario:anAttiva?undefined:(_numIt("#cv-prezzo")||0),
      quantita_manuale:aCorpo,
      quantita:aCorpo?(_numIt("#cv-qta")||0):0,
      incidenza_manodopera:$("#cv-mano")?_numIt("#cv-mano"):undefined,
      oneri_sicurezza:$("#cv-sic")?_numIt("#cv-sic"):undefined
    };
    /* i due campi delle gare esistono solo sui lavori pubblici: se il modulo
       non li mostra non si scrivono, cosi' non azzerano quello che c'era */
    if(row.incidenza_manodopera===undefined)delete row.incidenza_manodopera;
    if(row.oneri_sicurezza===undefined)delete row.oneri_sicurezza;
    if(row.prezzo_unitario===undefined)delete row.prezzo_unitario;
    if(!id){
      row.ordine=compVociCache.reduce((m,x)=>Math.max(m,+x.ordine||0),0)+1;
    }
    let res;
    if(id) res=await sb.from("gest_computo_voci").update(row).eq("id",id).eq("user_id",sbUid).select("id");
    else   res=await sb.from("gest_computo_voci").insert(row).select("id");
    if(res.error){toast("Errore: "+res.error.message);return;}
    if(!res.data||!res.data.length){toast("Non salvata: nessuna riga scritta. Riprova.");return;}
    const nuovoId=res.data[0].id;
    rinfresca("computi");
    /* appena creata si resta dentro: le misure sono il motivo per cui si e'
       aperta questa schermata, e adesso si possono scrivere */
    if(!id){ await compVoceForm(nuovoId); toast("Lavorazione creata ✔ Ora scrivici le misure"); return; }
    toast("Lavorazione salvata ✔");
    await compTornaAlComputo();
  }

  async function compTornaAlComputo(){
    const c=compCache.find(x=>String(x.id)===String(compVociCompId));
    if(!c){closeSheet();await renderComputi();return;}
    await computoForm(c);
    /* si torna DOVE si era: davanti alle lavorazioni, non in cima al modulo.
       Senza questo, ogni volta che si chiude una lavorazione bisogna riscorrere
       tutto il computo per ritrovare l'elenco. */
    /* ⏱ 320 ms non e' un numero a caso: openSheetGrande riporta il modulo in
       cima QUATTRO volte (subito, al frame dopo, a 80 ms e a 250 ms) per via
       delle emoji che diventano icone e cambiano l'altezza. Uno scroll fatto
       prima veniva cancellato dall'ultimo di quei quattro. Se un domani quei
       tempi cambiano, va cambiato anche questo.
       scrollIntoView e non scrollTop: non serve indovinare quale contenitore
       scorre (sul computer .sh-body, e non e' detto che resti cosi'). */
    setTimeout(()=>{
      const box=$("#co-voci"); if(!box)return;
      const blocco=box.closest(".sh-b")||box;
      try{ blocco.scrollIntoView({block:"start",inline:"nearest"}); }catch(_){ blocco.scrollIntoView(true); }
    },320);
  }


