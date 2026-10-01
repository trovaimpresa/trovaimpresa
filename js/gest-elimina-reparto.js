// [SPOSTATO] gest-elimina-reparto.js: era dentro gest-core.js, righe 7419-8084, spostato identico.
  /* ============================================================
     12 agosto 2026 — ELIMINA REPARTO, riscritta. Era il punto piu'
     pericoloso di tutto il gestionale, per tre motivi messi insieme:

     1) contava SOLO i lavori. Ma il reparto (gest_mestieri) si porta dietro
        tutto quello che ha dentro con la catena del database: clienti,
        preventivi, fatture, fornitori, mezzi, persone, carte, scadenze,
        computi. Chi leggeva "e i suoi 3 lavori" non poteva nemmeno
        immaginare di perdere anche 40 clienti e 12 fatture.
     2) diceva sempre "L'operazione e' definitiva", anche quando il Cestino
        era acceso e quindi si poteva tornare indietro: il messaggio non
        raccontava quello che succedeva davvero.
     3) non guardava MAI se le cancellazioni erano andate a buon fine: il
        reparto spariva dallo schermo anche quando nel database c'era ancora,
        e ricompariva al primo ricaricamento.

     Adesso: si conta tutto, si dice la verita' su cosa si puo' recuperare,
     e se il database non risponde non si toglie niente dallo schermo.
     ============================================================ */
  /* Le tabelle che stanno dentro un reparto (hanno la colonna mestiere_id).
     I nomi sono scritti in lingua "impresa": ci pensa gconfirm a girarli in
     pratiche/collaboratori per gli studi tecnici.
     ⚠️ SE AGGIUNGI UNA RIGA QUI, aggiungi la tabella anche a TABELLE in
     js/cestino.js (riga 82) e la colonna eliminato_il in sql/gest-cestino.sql.
     Una tabella che sta qui ma non li' viene cancellata PER SEMPRE mentre il
     messaggio promette il Cestino. Se te ne dimentichi il gestionale sbaglia
     dalla parte giusta — repartoBloccanti blocca l'eliminazione dei reparti —
     ma con un messaggio che da' la colpa a una migrazione SQL che invece e' a
     posto: la vera causa e' questa riga. */
  const REPARTO_CONTENUTO=[
    ["gest_lavori",            "lavoro",               "lavori"],
    /* 12 agosto 2026 (notte) — LE ORE MANCAVANO DALL'ELENCO.
       gest_ore ha la colonna mestiere_id (sql/gest-ore-e-crediti.sql riga 39)
       e il gestionale ce la scrive davvero (oreAdd), ma qui dentro non c'era.
       Eliminando il reparto le ore restavano VIVE e irraggiungibili — il loro
       lavoro e il loro reparto erano nel Cestino — e poi "Elimina per sempre"
       si rifiutava all'infinito ("1 ore lavorate non sono nel cestino"), senza
       nessuna schermata da cui metterle via: il vicolo cieco che il commento
       qui sopra dava per chiuso era ancora aperto.
       Stando qui, le ore entrano da sole anche nel conteggio del messaggio e
       in CEST_FIGLI, cioe' nel ripristino. */
    ["gest_ore",               "ora lavorata",         "ore lavorate"],
    /* 15 agosto 2026 — I RAPPORTINI MANCAVANO DA QUESTO ELENCO.
       Stessa storia delle ore qui sopra: gest_rapportini ha la colonna
       mestiere_id (sql/gest-rapportini.sql) e il telefono ce la scrive
       davvero. Senza questa riga, eliminando il reparto i rapportini
       restavano VIVI e irraggiungibili — il loro lavoro nel Cestino — e poi
       "Elimina per sempre" del reparto si sarebbe rifiutato all'infinito. */
    ["gest_rapportini",        "rapportino",           "rapportini"],
    ["gest_clienti",           "cliente",              "clienti"],
    ["gest_preventivi",        "preventivo",           "preventivi"],
    ["gest_fatture",           "fattura",              "fatture"],
    ["gest_fatture_fornitori", "fattura di fornitore", "fatture di fornitori"],
    ["gest_fornitori",         "fornitore",            "fornitori"],
    ["gest_mezzi",             "mezzo o attrezzatura", "mezzi e attrezzature"],
    ["gest_operatori",         "persona",              "persone"],
    ["gest_carte",             "carta aziendale",      "carte aziendali"],
    ["gest_scadenze",          "scadenza",             "scadenze"],
    ["gest_computi",           "computo",              "computi"]
  ];
  /* Dodici domande piccolissime (solo il conteggio, nessuna riga scaricata)
     sparate tutte insieme: un solo giro di rete, e solo quando si preme
     Elimina, che non e' cosa di tutti i giorni.
     Oltre al conteggio si porta a casa una cosa che serve subito dopo: la
     tabella esiste nel database, oppure no? Le due cose si distinguono solo
     qui, dal codice dell'errore: 42P01 (o "does not exist") = tabella che non
     c'e' proprio. Il Cestino, che vede solo "colonna mancante", le tratta
     tutte e due allo stesso modo e blocca. */
  function _tabellaAssente(err){
    const m=(err&&(err.message||err.details||""))||"";
    const c=(err&&err.code)||"";
    return c==="42P01"||/does not exist|schema cache|could not find the table/i.test(m);
  }
  async function contaReparto(mid){
    const righe=await Promise.all(REPARTO_CONTENUTO.map(async function(v){
      try{
        const {count,error}=await sb.from(v[0]).select("id",{count:"exact",head:true})
          .eq("user_id",sbUid).eq("mestiere_id",mid);
        if(error)return {tab:v[0],lab:null,n:0,ko:!_tabellaAssente(error),assente:_tabellaAssente(error)};
        const n=count||0;
        return {tab:v[0],lab:n?(n+" "+(n===1?v[1]:v[2])):null,n:n,ko:false,assente:false};
      }catch(e){return {tab:v[0],lab:null,n:0,ko:true,assente:false};}
    }));
    return {
      righe:righe,
      voci:righe.map(r=>r.lab).filter(Boolean),
      /* se anche una sola lettura e' fallita non si puo' giurare sull'elenco:
         meglio dirlo che far credere che il reparto sia vuoto */
      incerto:righe.some(r=>r.ko)
    };
  }
  /* 12 agosto 2026 (notte) — IL CONTROLLO CHE MANCAVA.
     Prima si cancellava una tabella per volta e si scopriva solo alla settima
     che il Cestino su quella parte non e' installato: le prime sei erano gia'
     dentro il Cestino, il reparto era ancora sullo schermo — vivo e vuoto — e
     il messaggio diceva "il reparto NON e' stato eliminato", che era vero solo
     per il reparto. Adesso si chiede PRIMA, a tutte e tredici (le dodici del
     contenuto piu' il reparto stesso), e se anche una sola bloccherebbe non si
     tocca niente.
     Le tabelle che nel database non esistono proprio non contano: non hanno
     righe, non c'e' niente da mettere via. */
  function repartoBloccanti(righe){
    if(!(window.cestinoAttivo&&window.cestinoAttivo()))return [];   /* cancellazioni vere: non blocca nessuno */
    if(typeof window.cestinoTabellaAttiva!=="function")return [];
    const assenti={};
    (righe||[]).forEach(function(r){ if(r.assente)assenti[r.tab]=true; });
    const nome={};
    REPARTO_CONTENUTO.forEach(function(v){ nome[v[0]]=v[2]; });
    nome.gest_mestieri="il reparto stesso";
    return REPARTO_CONTENUTO.map(v=>v[0]).concat(["gest_mestieri"])
      .filter(t=>!assenti[t]&&!window.cestinoTabellaAttiva(t))
      .map(t=>nome[t]||t);
  }
  async function delPanel(id){
    const p=(state.panels||[]).find(x=>x.id===id);
    if(!p)return;

    /* ===== ⛔ 21 agosto 2026 — «L'HO CANCELLATO E TORNA» =====
       Alessio: «due reparti cancellati perche sono tornati?» — e poi «si sono
       andati via ma a volte tornano».
       La prova e' stata la DATA: i reparti «tornati» avevano nel database la
       loro data di nascita vecchia (giardiniere 19/06, elettricista 15/08).
       Non erano stati ricreati: NON ERANO MAI STATI CANCELLATI.

       Il perche' sta qui sotto: tutta la cancellazione dal database vive
       dentro un `if(sb && sbUid && p.mestiere_id)`. Se una delle tre manca —
       il login scaduto, o una scheda che nel browser ha perso il collegamento
       — quel pezzo viene SALTATO. Ma subito dopo il reparto veniva tolto
       dall'elenco lo stesso, e il gestionale scriveva «Reparto eliminato».
       Sparito dallo schermo, vivo nel database. Alla riapertura l'elenco si
       rifa' dal database, e il reparto torna. Ecco il «a volte».

       ⛔ LA REGOLA: SE NON SI PUO' CANCELLARE DAL DATABASE, NON SI CANCELLA
          NEMMENO DALLO SCHERMO. Un reparto che resta con una spiegazione e'
          meglio di uno che sparisce e ritorna: la seconda volta non sai piu'
          di che cosa fidarti.
       ⚠️ E' la stessa famiglia della bugia del 12 agosto («sono gia' nel
          Cestino, vai a riprenderle» quando non c'erano). */
    if(!sb||!sbUid){
      alert("Il reparto NON è stato eliminato, e non ho toccato niente.\n\n"
        +"Non risulti collegato: senza collegamento posso toglierlo da questa "
        +"schermata, ma nel database resterebbe — e ricomparirebbe alla "
        +"prossima apertura.\n\nRientra da trovaimpresa.com e riprova.");
      return;
    }
    if(!p.mestiere_id){
      alert("Il reparto NON è stato eliminato, e non ho toccato niente.\n\n"
        +"Questa scheda ha perso il collegamento con il database: se la "
        +"togliessi dallo schermo tornerebbe alla prossima apertura.\n\n"
        +"Ricarica la pagina (Ctrl+F5) e riprova. Se torna anche dopo, "
        +"dimmelo: vuol dire che nel database c'è un reparto in più.");
      return;
    }

    /* Se il Cestino sta ancora facendo la sua prova di accensione,
       l'eliminazione verrebbe bloccata a meta' strada: meglio dirlo prima di
       far rispondere a una domanda inutile. */
    const cst=window.cestinoStato&&window.cestinoStato();
    if(cst&&cst.attesa>0){
      toast("Attenzione: sto ancora controllando che il Cestino sia pronto. Riprova fra qualche secondo.");
      return;
    }
    const conCestino=!!(window.cestinoAttivo&&window.cestinoAttivo());

    let dentro={righe:[],voci:[],incerto:false};
    if(sb&&sbUid&&p.mestiere_id)dentro=await contaReparto(p.mestiere_id);

    /* Il controllo che manca a meta' strada: si chiede a tutte PRIMA, e se una
       sola bloccherebbe non si tocca niente e non si fa nemmeno la domanda. */
    if(sb&&sbUid&&p.mestiere_id){
      const bloccanti=repartoBloccanti(dentro.righe);
      if(bloccanti.length){
        alert("Il reparto NON è stato eliminato, e non ho toccato niente.\n\n"
          +"Su queste parti il Cestino non è ancora installato, e per non perdere "
          +"niente per sempre l'eliminazione è bloccata:\n  •  "+bloccanti.join("\n  •  ")
          +"\n\nEsegui i file della cartella sql/ su Supabase e riprova.");
        return;
      }
    }

    let msg="Stai per eliminare il reparto «"+p.nome+"».\n\n";
    if(dentro.voci.length)   msg+="Dentro ci sono:\n"+dentro.voci.map(v=>"  •  "+v).join("\n")+"\n\n";
    else if(dentro.incerto)  msg+="Non sono riuscito a controllare cosa c'è dentro: la connessione non ha risposto.\n\n";
    else                     msg+="Il reparto è vuoto.\n\n";
    if(dentro.incerto&&dentro.voci.length)msg+="ATTENZIONE: questo elenco potrebbe essere incompleto.\n\n";
    msg+=conCestino
      ? "Va tutto nel Cestino: se sbagli puoi rimetterlo a posto da lì.\n\nContinuare?"
      : "ATTENZIONE: il Cestino non è attivo. Sparisce tutto per sempre e non si può tornare indietro.\n\nContinuare?";
    if(!gconfirm(msg))return;

    if(sb&&sbUid&&p.mestiere_id){
      /* ===== 12 agosto 2026 (sera) — LA PROMESSA ADESSO E' VERA =====
         Stamattina ho reso onesto il CONTEGGIO (il messaggio elenca tutte e 11
         le cose che ci sono dentro) ma non la CANCELLAZIONE: si buttavano via
         solo i lavori e il reparto. Clienti, preventivi, fatture, fornitori,
         mezzi, persone, carte, scadenze e computi restavano VIVI nel database e
         invisibili sullo schermo — il reparto da cui si raggiungono non c'era
         piu' — e non stavano nemmeno nel Cestino, quindi non si potevano
         rimettere a posto. E poi "Elimina per sempre" sul reparto si rifiutava,
         perche' li trovava ancora vivi: vicolo cieco.
         Adesso si svuota davvero, una tabella per volta, i figli prima e il
         reparto per ultimo: cosi' ogni cosa e' ripescabile anche da sola.
         Una tabella che nel database non esiste (migrazione mai eseguita) non
         blocca niente: non c'e' niente da mettere via. Tutto il resto si'. */
      /* 12 agosto 2026 (notte) — E SE SI ROMPE LO STESSO A META'?
         Il controllo qui sopra toglie di mezzo il caso che capitava davvero
         (Cestino non installato su una parte). Resta la rete che cade fra la
         terza e la quarta tabella: da un browser non si puo' fare una cosa
         sola indivisibile, quindi si fa la seconda cosa migliore — si TORNA
         INDIETRO. Si segna l'ora di partenza e, se qualcosa va storto, si
         rimette a posto solo quello che e' finito nel Cestino da quell'ora in
         poi (le righe gia' nel Cestino da prima non vengono ritimbrate, quindi
         non rischiano di risalire). */
      const inizio=new Date().toISOString();
      const assenti={}; (dentro.righe||[]).forEach(function(r){ if(r.assente)assenti[r.tab]=true; });
      const fatte=[]; let guasto="";

      /* Quattro esiti diversi, non due. Le prime due volte che ho scritto
         questa funzione rispondeva si'/no, e il "no" finiva sempre nello stesso
         messaggio: "sono già nel Cestino, vai a riprenderle". Era una bugia in
         due casi su quattro — quando non era stato toccato ancora niente, e
         soprattutto quando il Cestino non e' installato e quelle righe erano
         state cancellate PER SEMPRE. La bugia peggiore nel momento peggiore.
           "niente" = non avevo ancora toccato niente
           "ok"     = rimesso tutto a posto
           "no"     = e' rimasta roba nel Cestino, si ripesca a mano
           "persi"  = erano cancellazioni vere: non tornano piu' */
      const rimaste=[];                          /* quelle che il rollback NON e' riuscito a riprendere */
      async function tornaIndietro(){
        if(!fatte.length)return "niente";
        if(!conCestino)return "persi";           /* .delete() vera: non c'e' niente da annullare */
        if(typeof sb.raw!=="function"){fatte.forEach(t=>rimaste.push(t));return "no";}
        for(const t of fatte){
          try{
            const {error}=await sb.raw(t).update({eliminato_il:null})
              .eq("user_id",sbUid).eq("mestiere_id",p.mestiere_id).gte("eliminato_il",inizio);
            if(error)rimaste.push(t);
          }catch(e){rimaste.push(t);}
        }
        return rimaste.length?"no":"ok";
      }
      /* L'elenco da mostrare, con i numeri: chi deve decidere se tirare fuori un
         backup vuole leggere "2 lavori", non "lavori". I conteggi sono quelli
         gia' letti da contaReparto un momento fa. */
      function elenca(tabelle){
        const uno={}, tanti={}, quante={};
        REPARTO_CONTENUTO.forEach(function(v){ uno[v[0]]=v[1]; tanti[v[0]]=v[2]; });
        /* Solo i conteggi che sono arrivati davvero. Quando la lettura fallisce
           contaReparto restituisce n:0 con ko:true — se si guardasse il numero
           si scriverebbe "0 lavori" dentro il messaggio "cancellate PER SEMPRE",
           cioe' si direbbe a chi ha appena perso due lavori che non ha perso
           niente, e il backup non lo tirerebbe fuori. Il numero che non si sa
           non si scrive. */
        (dentro.righe||[]).forEach(function(r){ if(!r.ko)quante[r.tab]=r.n; });
        return tabelle.map(function(t){
          const n=quante[t];
          /* "non so il numero" e non "non so quante": meta' delle etichette sono
             maschili (lavori, preventivi, computi metrici) e la concordanza
             sbagliata si nota subito. Cosi' va bene per tutte e dodici. */
          if(typeof n!=="number")return (tanti[t]||t)+" (non so il numero)";
          return n+" "+(n===1?(uno[t]||t):(tanti[t]||t));
        }).join("\n  •  ");
      }

      for(const v of REPARTO_CONTENUTO){
        if(assenti[v[0]])continue;                  /* tabella che non esiste: niente da mettere via */
        const r=await sb.from(v[0]).delete().eq("user_id",sbUid).eq("mestiere_id",p.mestiere_id);
        const er=r&&r.error;
        if(!er){fatte.push(v[0]);continue;}
        const m=(er.code||"")+" "+(er.message||"");
        if(/42P01|42703|does not exist|schema cache|could not find/i.test(m))continue;
        guasto=v[2]+" ("+(er.message||"errore")+")";
        break;
      }
      if(!guasto){
        const r2=await sb.from("gest_mestieri").delete().eq("id",p.mestiere_id).eq("user_id",sbUid);
        if(r2&&r2.error)guasto="il reparto stesso ("+(r2.error.message||"errore")+")";
      }
      if(guasto){
        const esito=await tornaIndietro();
        /* Il pallino del Cestino aveva cominciato a contare mentre le
           cancellazioni erano ancora in volo e si era fermato su un numero di
           mezzo: dopo un rollback riuscito diceva "12" con il Cestino vuoto,
           cioe' il contrario del messaggio qui sotto. Adesso che non c'e' piu'
           niente in volo si rifa' il conto vero (18 domande di solo conteggio).
           Va fatto QUI, dopo tornaIndietro(), mai prima. */
        cestContato=false;contaCestinoUnaVolta();
        const testa="Il reparto NON è stato eliminato.\n\nMi sono fermato su: "+guasto+"\n\n";
        let coda;
        if(esito==="niente")     coda="Non ho fatto in tempo a toccare niente: dentro il reparto è "
                                     +"tutto come prima. Riprova fra un momento.";
        else if(esito==="ok")    coda="Ho rimesso a posto quello che era già finito nel Cestino: dentro "
                                     +"il reparto è tutto come prima. Riprova fra un momento.";
        else if(esito==="persi") coda="⚠️ ATTENZIONE: su questo gestionale il Cestino NON è installato, "
                                     +"quindi queste cose sono già state cancellate PER SEMPRE e non "
                                     +"posso rimetterle a posto:\n  •  "+elenca(fatte)
                                     +"\n\nSe hai un backup, è il momento di usarlo. Per non farlo "
                                     +"succedere più, esegui sql/gest-cestino.sql su Supabase.";
        else                     coda="⚠️ ATTENZIONE: questa parte del contenuto è rimasta nel Cestino "
                                     +"e non sono riuscito a rimetterla a posto da solo:\n  •  "+elenca(rimaste)
                                     +"\n\nVai nel Cestino, scegli «Tutti i reparti» e premi «Rimetti a "
                                     +"posto» su quelle cose. Il resto del reparto è già a posto.";
        /* ⛔ 19 settembre 2026 — L'ELENCO CHE SPARIVA CON UN OK.
           Qui sotto c'era un alert(). Dentro c'era o l'elenco delle cose
           rimaste nel Cestino da rimettere a posto a mano, o — nel caso
           peggiore, quello senza Cestino — l'elenco di quelle cancellate
           PER SEMPRE. Premevi OK e quell'elenco non esisteva piu' da
           nessuna parte: nel caso peggiore era l'unica traccia di quello
           che avevi perso, e la riga che diceva «usa il backup» era andata
           via insieme all'elenco delle cose da recuperare.
           Adesso: un pannello che resta, un tasto per copiarselo, e la
           stessa cosa scritta in cima al Cestino finche' non dici tu che
           l'hai sistemata. */
        const _guastoTesto=testa+coda;
        cestGuastoSalva(_guastoTesto);
        try{ console.error("[reparto]",_guastoTesto); }catch(_e){}
        cestGuastoPannello(_guastoTesto);
        renderLanding();return;
      }
    }
    state.panels=(state.panels||[]).filter(x=>x.id!==id);
    delete state[id];
    await save();renderLanding();
    toast(conCestino?"Reparto messo nel Cestino ✔ — lo puoi rimettere a posto da lì":"Reparto eliminato");
  }

  /* ⛔ 29 agosto 2026 (notte) — anche QUI si arrotonda coi centesimi esatti.
     Intl arrotonda il numero in virgola mobile com'e', quindi 4.996,0485
     poteva uscire scritto 4.996,04 mentre il database dice 4.996,05: il
     conto giusto e la scritta sbagliata. Il numero si pulisce PRIMA di
     scriverlo. */
  const eurPdf=n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(_cent2(n))+" EUR";
  /* ⚠️ L'UNITÀ DI MISURA NEI PDF — 11 agosto 2026.
     Il programma che scrive i PDF non sa disegnare il quadratino e il cubetto,
     e invece di sbagliare LI BUTTA VIA IN SILENZIO: «m²» usciva stampato «m»,
     «m³» usciva «m». A schermo si leggeva giusto, sul foglio consegnato al
     cliente no. In un computo metrico è il difetto peggiore possibile:
     73 metri quadri di intonaco e 73 metri lineari di cornice sono due lavori
     e due prezzi diversi, e sulla carta si leggevano uguali.
     Provato dal vivo: l'euro, i gradi e le lettere accentate li scrive
     benissimo — spariscono SOLO gli esponenti.
     Nei PDF si scrive quindi «mq» e «mc», come si è sempre scritto sui computi
     di carta. A schermo restano m² e m³, che sono più belli. */
  const _umPdf=u=>String(u==null?"":u)
    .replace(/m²/g,"mq").replace(/m³/g,"mc")
    .replace(/²/g,"2").replace(/³/g,"3");
  /* Il vecchio contatore delle fatture (uno solo, sul lavoro, che non
     ripartiva mai) è stato tolto: adesso il numero lo assegna la fattura
     quando la emetti, e riparte da 1 ogni anno. Vedi fattProssimoNumero(). */

  async function generaPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const {data:lav}=await sb.from("gest_lavori").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(!lav){toast("Lavoro non trovato");return;}
    let c={};
    c=await cliDelDocumento(lav.cliente_id,"nome,indirizzo,referente");
    /* il numero NON si assegna qui: scaricare il PDF non deve impegnare
       un numero di fattura. Lo assegna assegnaNumFatt() quando segni "Emessa". */
    const numFatt=lav.num_fatt||null;
    const l={numFatt,dataFatto:lav.data_fatto,dataPrevista:lav.data_prevista,descrizione:lav.descrizione,lavoroSvolto:lav.lavoro_svolto,ore:lav.ore,importo:lav.importo,fattStato:lav.fatt_stato};
    const pp=(state.panels||[]).find(p=>p.id===cur), repNome=pp?pp.nome:"";
    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"}), M=18, R=210-M;
    let y=20;
    y=window.gestLogoPdf?await window.gestLogoPdf(doc,M,y):y;   /* 27 set 2026 — il logo (js/gest-logo.js) */
    doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    let hy=y+6;[az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")].filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=4.5;});
    doc.setTextColor(0);
    /* 9 agosto 2026 — questo NON è una fattura.
       La colonna num_fatt non si scrive più da nessuna parte (il numero lo
       assegna la fattura vera su gest_fatture), quindi il documento usciva
       intestato "FATTURA" con scritto "Non ancora emessa" e più sotto
       "Causale: Fattura n. null". Il file si chiamava fattura-null.pdf.
       Adesso è quello che è davvero: il riepilogo della pratica/lavoro.
       Se un giorno servisse la copia di cortesia di una fattura, si prende
       dalla sezione Fatture (fatturaPdf), che sa il numero vero. */
    const _pro=(ruoloUtente==='professionista');
    const _tit=_pro?"SCHEDA PRATICA":"SCHEDA LAVORO";
    doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text(_tit,R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    doc.text("Riepilogo per il cliente",R,y+5.5,{align:"right"});
    doc.text("del "+fdate(l.dataFatto||l.dataPrevista||todayStr()),R,y+10.5,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+15)+4;doc.setDrawColor(210);doc.line(M,y,R,y);y+=10;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Cliente",M,y);y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(11);doc.text(c.nome||"—",M,y);y+=5;
    doc.setFontSize(9);doc.setTextColor(90);
    if(c.indirizzo){doc.text(c.indirizzo,M,y);y+=4.5;}
    if(c.referente){doc.text("Rif. "+c.referente,M,y);y+=4.5;}
    doc.setTextColor(0);y+=8;
    doc.setFillColor(31,111,92);doc.rect(M,y,R-M,8,"F");
    doc.setTextColor(255);doc.setFont("helvetica","bold");doc.setFontSize(9.5);
    doc.text("Descrizione",M+2,y+5.5);doc.text("Importo",R-2,y+5.5,{align:"right"});
    doc.setTextColor(0);doc.setFont("helvetica","normal");y+=8;
    const descr=(repNome?repNome+" — ":"")+(l.descrizione||l.lavoroSvolto||"Prestazione di servizi");
    const lines=doc.splitTextToSize(descr,R-M-42);
    const det=[];if(l.dataFatto||l.dataPrevista)det.push("Data "+fdate(l.dataFatto||l.dataPrevista));if(l.ore)det.push(l.ore+" ore");
    const detStr=det.join("   ·   ");
    const rowH=lines.length*5+(detStr?5:0)+6;
    doc.setDrawColor(210);doc.rect(M,y,R-M,rowH);
    doc.setFontSize(10);doc.text(lines,M+2,y+6);doc.text(eurPdf(l.importo),R-2,y+6,{align:"right"});
    if(detStr){doc.setFontSize(8.5);doc.setTextColor(120);doc.text(detStr,M+2,y+6+lines.length*5);doc.setTextColor(0);}
    y+=rowH+4;
    doc.setDrawColor(31,111,92);doc.setLineWidth(.4);doc.rect(R-70,y,70,12);doc.setLineWidth(.2);
    doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("TOTALE",R-68,y+7.6);doc.text(eurPdf(l.importo),R-2,y+7.6,{align:"right"});
    y+=22;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Pagamento",M,y);y+=5.5;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90);
    if(az.iban){doc.text("Bonifico — IBAN "+az.iban,M,y);y+=4.5;}
    /* niente "Causale: Fattura n. null": qui va il riferimento vero */
    doc.text((_pro?"Pratica: ":"Lavoro: ")+(l.descrizione||"—"),M,y);y+=5;
    doc.setTextColor(0);doc.setFont("helvetica","bold");doc.text("Stato: "+(l.fattStato==="pagata"?"PAGATA":"DA SALDARE"),M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(140);
    doc.text("Documento non fiscale (copia di cortesia). La fattura elettronica valida viene emessa tramite Sistema di Interscambio.",M,286,{maxWidth:R-M});
    const fn=(_pro?"pratica-":"lavoro-")+String(l.descrizione||"scheda").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)
      +"-"+(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf";
    doc.save(fn);toast("PDF scaricato ✅");renderFatture();
  }

  function compress(file){
    return new Promise((res,rej)=>{
      const img=new Image(), rd=new FileReader();
      rd.onerror=rej;
      rd.onload=()=>{img.onerror=rej;img.onload=()=>{
        /* stessi valori di js/foto-upload.js: le foto del flusso locale finiscono
           nello stesso bucket, non devono avere una risoluzione diversa */
        const max=1600;let w=img.width,h=img.height;
        if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        res(cv.toDataURL("image/jpeg",0.75));
      };img.src=rd.result;};
      rd.readAsDataURL(file);
    });
  }
  function syncEditingToJob(){const j=db().lavori.find(l=>l.id===editing.id);if(j)j.foto=editing.foto;}
  async function addFoto(files,tipo,operatore){
    let n=0;
    for(const f of Array.from(files)){
      if(!f.type||!f.type.startsWith("image/"))continue;
      if(f.size>15*1024*1024){toast("Foto troppo grande, massimo 15 MB");continue;}
      let dataURL;try{dataURL=await compress(f);}catch(e){continue;}
      const id="f"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      try{await window.storage.set("gfoto_"+id,dataURL);}catch(e){toast("Foto troppo grande, non salvata");continue;}
      fotoCache[id]=dataURL;editing.foto.push({id,tipo,operatore:operatore||"",ts:Date.now()});n++;
    }
    syncEditingToJob();await save();renderFotoBlocks();renderGalleria();
    if(n)toast(n+" foto aggiunte 📷");
  }
  /* ---- FOTO DEL MODULO: locali (non ancora salvate) + quelle su Supabase ----
     Il blocco foto della scheda lavoro leggeva SOLO l'archivio locale: le foto
     già su Supabase non comparivano più dopo un F5, e da un altro dispositivo
     mai. gest_lavori non ha una colonna foto, stanno in gest_foto.
     I tipi non coincidono: nel modulo sono "prima"/"dopo", nella tabella
     "da_fare"/"fatto"/"lavoro". "lavoro" è quello che scrive l'app operatore
     dal cantiere, cioè il caso più frequente: va letto insieme a "fatto". */
  const FOTO_TIPO_UI={da_fare:"prima",fatto:"dopo",lavoro:"dopo"};
  let fotoSupa={};   /* id riga gest_foto -> {storage_path} : serve a deleteFoto */

  async function deleteFoto(id){
    /* foto già su Supabase: si cancella la riga E il file, in quest'ordine.
       La .select('id') fa da cancello: se la RLS blocca, PostgREST non da'
       errore, tocca zero righe e risponde OK — senza questo controllo la foto
       "sparirebbe" dallo schermo per poi ricomparire al render successivo. */
    const sup=fotoSupa[id];
    if(sup){
      if(!sb||!sbUid){toast("Devi essere loggato");return;}
      const {data:tolte,error}=await sb.from("gest_foto").delete().eq("id",id).eq("user_id",sbUid).select("id");
      if(error){toast("Foto non eliminata: "+error.message);return;}
      if(!tolte||!tolte.length){toast("Foto non eliminata: non hai i permessi su questa riga");return;}
      let avviso="Foto eliminata";
      if(sup.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo())){
        const {error:eRm}=await sb.storage.from("gestionale-foto").remove([sup.storage_path]);
        /* la riga non c'e' più: il file resta orfano nel bucket, ma la foto
           è sparita davvero dall'app. Meglio dirlo che tacere. */
        if(eRm)avviso="Riga eliminata, ma il file resta nel bucket: "+eRm.message;
      }
      delete fotoSupa[id];delete fotoCache[id];
      renderFotoBlocks();renderGalleria();toast(avviso);
      return;
    }
    /* foto locale non ancora salvata: resta il vecchio percorso */
    editing.foto=editing.foto.filter(f=>f.id!==id);
    try{await window.storage.delete("gfoto_"+id);}catch(e){}
    delete fotoCache[id];syncEditingToJob();await save();renderFotoBlocks();renderGalleria();toast("Foto eliminata");
  }
  /* src="" = da riempire dopo (foto locale, hydrateFoto legge da IndexedDB).
     Per quelle su Supabase l'URL firmato arriva già pronto.
     onerror: se il file non c'e' più nel bucket la miniatura sparisce invece
     di restare l'icona di immagine rotta. */
  function fotoThumb(f,withDel,src){
    /* stessa storia di galNomeOp: dipById legge l'archivio locale morto */
    const opName=galNomeOp(f.operatore);
    /* loading="lazy": la foto si scarica solo quando arriva davvero sotto gli
       occhi. In un lavoro con 40 foto prima partivano tutte insieme. */
    const img=src
      ? `<img src="${esc(src)}" loading="lazy" decoding="async" width="84" height="84" data-action="view-foto" data-id="${esc(f.id)}" onerror="this.closest('.thumb').remove()">`
      : `<img data-foto="${esc(f.id)}" loading="lazy" decoding="async" width="84" height="84" data-action="view-foto" data-id="${esc(f.id)}">`;
    return `<div class="thumb">${img}
      ${opName?`<span class="thop">${esc(opName)}</span>`:""}
      ${withDel?`<button class="thdel" data-action="del-foto" data-id="${esc(f.id)}">×</button>`:""}</div>`;
  }
  let _fotoRun=0;
  /* video dentro il modulo "Modifica lavoro": a differenza delle foto NON
     si mette in cache come base64 (troppo pesante per file fino a 50 MB),
     si carica subito su Supabase. Per questo serve già un lavoro salvato
     (editing.realId): se manca, si avvisa e basta. */
  async function uploadVideoLavoro(file,tipoDb,operatore,inputEl){
    if(!file)return;
    const lav=editing&&editing.realId;
    if(!lav){toast("Salva prima il lavoro, poi potrai aggiungere il video");if(inputEl)inputEl.value="";return;}
    if(file.size>52428800){toast("Il video supera i 50 MB");if(inputEl)inputEl.value="";return;}
    if(!sbUid){toast("Devi essere loggato");return;}
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=sbUid+"/"+lav+"/"+Date.now()+"_"+safe;
    const {error:up}=await sb.storage.from("gestionale-video").upload(path,file);
    if(up){toast("Video non caricato: "+up.message);if(inputEl)inputEl.value="";return;}
    const {error:ins}=await sb.from("gest_video").insert({user_id:sbUid,lavoro_id:lav,tipo:tipoDb,operatore:operatore||"Capo",storage_path:path});
    if(ins){await _fileOrfano("gestionale-video",path);toast("Video non salvato: "+ins.message);if(inputEl)inputEl.value="";return;}
    toast("Video aggiunto ✔");if(inputEl)inputEl.value="";renderVideoBlocks();
  }
  async function renderVideoBlocks(){
    const p=$("#th-vid-prima"),d=$("#th-vid-dopo");if(!p&&!d)return;
    const lav=editing&&editing.realId;
    if(!lav){
      if(p)p.innerHTML='<div style="font-size:13px;color:var(--testo-3)">Salva prima il lavoro, poi potrai aggiungere il video.</div>';
      if(d)d.innerHTML="";
      return;
    }
    if(!sb||!sbUid)return;
    const {data}=await sb.from("gest_video").select("id,storage_path,tipo").eq("lavoro_id",lav).eq("user_id",sbUid);
    const righe=(data||[]).filter(r=>FOTO_TIPO_UI[r.tipo]);
    const vidThumb=url=>`<div class="thumb"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#222;color:#fff;font-size:22px;cursor:pointer" onclick="window.open('${url}','_blank')">▶️</div></div>`;
    const render=async(box,tipo)=>{
      if(!box)return;
      const rs=righe.filter(r=>FOTO_TIPO_UI[r.tipo]===tipo);
      const urls=await Promise.all(rs.map(async r=>{
        const {data:su}=await sb.storage.from("gestionale-video").createSignedUrl(r.storage_path,3600);
        return su&&su.signedUrl?su.signedUrl:null;
      }));
      box.innerHTML=urls.filter(Boolean).map(vidThumb).join("");
    };
    await render(p,"prima");await render(d,"dopo");
  }
  async function renderFotoBlocks(){
    const p=$("#th-prima"),d=$("#th-dopo");if(!p&&!d)return;
    const run=++_fotoRun;   /* se parte un secondo render, il primo non sovrascrive */
    /* 1) subito le locali non ancora salvate: chi ha appena aggiunto una foto
          la deve vedere senza aspettare la rete. Quelle già caricate (uploaded)
          si saltano: arrivano da Supabase, altrimenti si vedrebbero doppie. */
    const loc=(editing.foto||[]).filter(f=>!f.uploaded);
    const dis=(box,tipo,extra)=>{if(box)box.innerHTML=loc.filter(f=>f.tipo===tipo).map(f=>fotoThumb(f,true)).join("")+(extra||"");};
    dis(p,"prima");dis(d,"dopo");
    hydrateFoto();
    /* 2) poi quelle su Supabase, per il lavoro aperto */
    const lav=editing&&editing.realId;
    if(!lav||!sb||!sbUid)return;
    let righe=[];
    try{
      const {data}=await sb.from("gest_foto").select("id,storage_path,tipo,operatore")
        .eq("lavoro_id",lav).eq("user_id",sbUid);
      righe=(data||[]).filter(r=>FOTO_TIPO_UI[r.tipo]);   /* fuori le fatture e i tipi ignoti */
    }catch(e){return;}
    /* firma tutte insieme (una sola richiesta invece di una per foto) e riusa
       quelle ancora valide; chi non si firma — file cancellato dal bucket — si
       scarta come prima */
    await galFirma("gestionale-foto",righe,fotoCache);
    if(run!==_fotoRun)return;                              /* render superato */
    const ok=righe.filter(r=>fotoCache[r.id]).map(r=>({r,url:fotoCache[r.id]}));
    fotoSupa={};
    ok.forEach(({r,url})=>{fotoSupa[r.id]=r;fotoCache[r.id]=url;});  /* fotoCache: fa funzionare view-foto */
    const html=t=>ok.filter(({r})=>FOTO_TIPO_UI[r.tipo]===t)
      .map(({r,url})=>fotoThumb({id:r.id,operatore:r.operatore||""},true,url)).join("");
    dis(p,"prima",html("prima"));
    dis(d,"dopo",html("dopo"));
    hydrateFoto();
  }
  async function hydrateFoto(){
    const els=Array.from($$("img[data-foto]")).filter(im=>!im.getAttribute("src"));
    for(const im of els){const id=im.dataset.foto;
      try{if(!(id in fotoCache)){const r=await window.storage.get("gfoto_"+id);fotoCache[id]=r&&r.value?r.value:"";}
        if(fotoCache[id])im.src=fotoCache[id];}catch(e){}
    }
  }
  async function _fileOrfano(bucket,path){
    if(!sb||!path)return false;
    try{
      const {error}=await sb.storage.from(bucket).remove([path]);
      if(error){console.warn("[gestionale] file orfano NON tolto:",bucket,path,error.message);return false;}
      return true;
    }catch(e){console.warn("[gestionale] file orfano NON tolto:",bucket,path,e&&e.message);return false;}
  }
  /* Le firme durano un'ora: entro i 50 minuti si riusano invece di chiederne
     di nuove a ogni ridisegno. Cosi' cambiare filtro quattro volte non rifa'
     quattro volte lo stesso lavoro. */
  function agVoci(l,wa){
    const dp=l.data_prevista||"", fatto=l.stato==="fatto";
    const v=[{lab:"✏ Modifica",action:"edit-job",data:{id:l.id}}];
    if(l.dove)v.push({lab:"🗺 Mappa",action:"map",data:{q:l.dove}});
    if(l.stato==="da_fare")v.push({lab:"▶ Avvia",action:"stato-supa",data:{id:l.id,v:"in_corso",dp:dp}});
    if(!fatto)v.push({lab:"✔ Segna fatto",action:"stato-supa",data:{id:l.id,v:"fatto",dp:dp}});
    else v.push({lab:"↩ Riapri",action:"stato-supa",data:{id:l.id,v:"da_fare",dp:dp}});
    v.push({lab:"📷 Foto",action:"lf-open",data:{id:l.id,desc:l.descrizione||"Lavoro"}});
    v.push({lab:"💬 Avvisa su WhatsApp",action:"sq-wa",data:{wa:wa}});
    v.push({sep:true});
    v.push({lab:"🗑 Elimina",action:"del-job-supa",data:{id:l.id},del:true});
    return v;
  }
  const AG_VUOTO=_SVGV+'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14h6"/></svg>';
  async function renderAgenda(){
    if(!cur)return;
    const body=$("#ag-body"), sel=$("#ag-op-sel");
    if(!sb||!sbUid){
      if(sel)sel.innerHTML=`<option value="">Tutti</option>`;
      if(body){body.style.display="block";body.innerHTML=tabVuoto("Niente da fare qui","Assegna i lavori a una persona dalla scheda del lavoro, voce «Chi ci va».",AG_VUOTO);}
      return;
    }
    /* elenco operatori della squadra del reparto (Supabase) */
    const {data:ops}=await sb.from("gest_operatori").select("id,nome,telefono").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    const OPS=ops||[];
    const telMap=Object.fromEntries(OPS.map(o=>[o.id,o.telefono||""]));
    if(sel)sel.innerHTML=[`<option value=""${agFilter.op===""?" selected":""}>Tutti</option>`]
      .concat(OPS.map(d=>`<option value="${esc(d.id)}"${agFilter.op===d.id?" selected":""}>${esc(d.nome)}</option>`)).join("");
    /* lavori del reparto (Supabase) */
    /* "*" per i professionisti: le schede mostrano tipo pratica, stato e
       protocollo, e con l'elenco fisso quei campi non arrivavano mai (9/8/2026) */
    const {data}=await sb.from("gest_lavori").select(ruoloUtente==='professionista'?"*":"id,descrizione,dove,stato,data_prevista,operatore_id,importo").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
    let L=data||[];
    if(agFilter.stato==="aperti")L=L.filter(l=>l.stato!=="fatto");
    if(agFilter.op)L=L.filter(l=>l.operatore_id===agFilter.op);
    L.sort((a,b)=>(a.data_prevista||"9999").localeCompare(b.data_prevista||"9999"));
    const tot=L.reduce((a,l)=>a+(+l.importo||0),0);
    renderTabella({
      id:"ag", box:"#ag-body",
      vuoto:tabVuoto("Niente da fare qui",
        agFilter.op?"Questo operatore non ha lavori assegnati.":"Assegna i lavori a una persona dalla scheda del lavoro, voce «Chi ci va».",AG_VUOTO),
      colonne:[{lab:"Lavoro",w:"34%"},{lab:"Dove",w:"26%",cls:"c-cli"},{lab:"Quando",w:"16%"},
               {lab:"Stato",w:"12%"},{lab:"Importo",w:"12%",cls:"c-imp"}],
      righe:L.map(l=>{
        const fatto=l.stato==="fatto";
        const late=inRitardo(l.stato,l.data_prevista);
        const q=quando(l.data_prevista,{neutro:fatto});
        const st=late?{c:"ritardo",l:"In ritardo"}:fatto?{c:"fatto",l:"Fatto"}
                :l.stato==="in_corso"?{c:"in_corso",l:"In corso"}:{c:"da_fare",l:"Da fare"};
        return {
          id:l.id,
          click:{action:"edit-job",data:{id:l.id}},
          celle:[
            `<span class="lav-bar ${st.c}" title="${st.l}"></span><span class="c-nome">${esc(l.descrizione||"—")}</span>`,
            esc(l.dove||"—"),
            {h:q.testo,cls:q.classe},
            `<span class="stato ${st.c}">${st.l}</span>`,
            +l.importo?eur(l.importo):"—"
          ],
          menu:agVoci(l,_waLavoro(l,telMap[l.operatore_id]||""))
        };
      }),
      totale:{testo:L.length+" "+(L.length===1?"lavoro":"lavori"),valore:eur(tot)},
      cards:()=>L.map(l=>jobCardSupa(l,true,telMap[l.operatore_id]||"",false,"ag")).join("")
    });
  }


