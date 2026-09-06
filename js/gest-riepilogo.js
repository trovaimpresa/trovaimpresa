/* ═══ FETTA B · IL RIEPILOGO ═══════════════════════════════════════════
   Staccata da gestionale-app.html il 6 settembre 2026 (righe 4113-4856).

   COSA C'E' DENTRO
   Una funzione sola: renderRiepilogo() — la prima schermata del gestionale,
   quella che si apre appena entri. Disegna tutte le schede del riepilogo:
   lavori in ritardo, preventivi fermi, scadenze dei mezzi e delle persone,
   i totali. E' un blocco unico di 744 righe, tagliato senza toccare
   nemmeno un carattere di quello che c'e' dentro.

   COSA NON C'E', E PERCHE'
   - rieCard, rieIco, _plur, _rieMale, rieVuotoTotale, TIPI_NON_FOTO,
     _nonFoto/_nonFotoSql: restano nella pagina. Sono gli aiuti che
     disegnano le schede, li chiama anche renderContatori. Portarli via
     li avrebbe tolti a chi li usa.
   - renderPrevAttesa e le icone _ICO_*: stanno subito sotto nella pagina,
     ma le usa anche il Report. Restano dove sono.
   - Il filtro sulla FASE del noleggio (fuori/rientrato) sta in DUE posti:
     qui dentro e in js/gest-report.js. Sono gemelli: se si cambia la
     regola in uno, va cambiata anche nell'altro. Si erano gia' scollati
     una volta.

   ⛔ LE DUE REGOLE DI QUESTO FILE
   1. Non e' chiuso dentro niente (niente IIFE): vive nello stesso spazio
      della pagina e vede sb, sbUid, esc, eur2, toast, $ senza che nessuno
      glieli passi. Per la stessa ragione, un nome dichiarato anche nella
      pagina spegnerebbe TUTTO il gestionale al caricamento (schermo bianco).
   2. Al primo livello qui non si puo' USARE niente che stia nella pagina:
      questo file parte PRIMA. Nominare una cosa della pagina dentro la
      funzione va bene (quando gira, la pagina e' partita). Il 6 settembre
      un `const X = _SVGV + '...'` in cima a un altro file staccato ha
      spento Galleria e Mappa senza nessun messaggio d'errore.

   Il banco che protegge tutto questo:
   prove-claude/banchi-fissi/smontaggio/banco-fette.js
   ═══════════════════════════════════════════════════════════════════════ */

  async function renderRiepilogo(){
    const G=$("#rie-grid");if(!G)return;
    if($("#rie-alert"))$("#rie-alert").innerHTML="";
    if(!sb||!sbUid||!cur){rieVuotoTotale();return;}
    const mid=curMestiere();
    const oggi=todayStr(), lim7=_giorniDopo(oggi,7), lim30=_giorniDopo(oggi,30);

    /* ============================================================
       ⚠️ 19 agosto 2026 — LE SEI ANDATE E RITORNI

       Le letture del Riepilogo erano ventiquattro, ma il problema non
       erano quelle: erano le SEI ONDATE. Sei volte «chiedo, aspetto la
       risposta, poi chiedo la prossima» — e su una linea da cantiere
       ogni attesa e' un pezzo di secondo in cui non si vede niente,
       uno dopo l'altro, prima ancora del primo numero.

       Tre di quelle ondate non aspettavano NESSUNA delle altre: le
       carte (tutte, anche quelle nel Cestino), i fornitori e i computi.
       Stavano dopo solo perche' erano scritte dopo.

       Adesso PARTONO SUBITO, qui, insieme alla prima ondata, e si
       aspettano piu' giu' dove servono. ⚠️ Nessuna lettura in piu' e
       nessuna in meno, nessun try spostato, nessun `if` tolto: cambia
       solo QUANDO partono. Le due ondate che restano sono quelle che
       aspettano davvero (servono gli id dei lavori e delle fatture).
       Da sei andate e ritorni a due.

       ⚠️ IL PEZZO DELICATO: fornitori e computi hanno una loro rete —
       se la migrazione non e' stata eseguita, la scheda non compare e
       il Riepilogo resta intero. Metterle dentro la Promise.all della
       prima ondata avrebbe fatto scattare l'errore GROSSO («Non riesco
       a leggere i dati») a chi non ha eseguito un file SQL: schermata
       vuota per una scheda in meno. Per questo si avviano a parte e si
       aspettano dentro il loro try, com'erano.
       ============================================================ */
    /* una lettura avviata e non ancora aspettata non deve poter urlare da
       sola: qui qualunque inciampo diventa un {error} da guardare dopo */
    const _avvia=p=>Promise.resolve(p).catch(e=>({error:e||new Error("lettura non riuscita")}));
    /* ⚠️ sb.raw vede anche le carte nel Cestino: le spese fatte con una carta
       poi eliminata sono uscite davvero e restano nei costi (13 agosto) */
    const _sbCarte=(sb.raw||sb.from.bind(sb));
    const pCarteTutte=_avvia(_sbCarte("gest_carte").select("id")
      .eq("user_id",sbUid).eq("mestiere_id",mid));
    const pForn=Promise.all([
      _avvia(sb.from("gest_fatture_fornitori").select("fornitore_id,importo,scadenza,stato").eq("user_id",sbUid).eq("mestiere_id",mid)),
      _avvia(sb.from("gest_fornitori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",mid))
    ]);
    /* i computi si leggono SOLO per gli studi tecnici, come prima: agli altri
       la sezione non c'e', e due letture inutili sono due letture inutili */
    /* ⚠️ 20 agosto 2026 — prima partiva SOLO per gli studi tecnici. Da oggi
       il computo ce l'hanno anche le imprese, e senza questa lettura la loro
       scheda del Riepilogo non sarebbe mai comparsa: la sezione nel menu e
       nessuna scheda che ci porta. Una regola che sta in due posti non si
       sistema a meta'. */
    /* ⛔ 22 agosto 2026 — all'artigiano il computo e' spento: le sue due
       letture non partono nemmeno. Stessa fonte del menu (tabNascosto), non
       un secondo elenco. Il risultato si aspetta solo dentro lo stesso `if`. */
    const pComputi=tabNascosto("computi")?null:Promise.all([
      /* ⚠️ «tipo» SERVE, anche se qui non si mostra — 14 agosto 2026.
         Da oggi compRiepilogoDa guarda il tipo del computo: gli oneri
         della sicurezza restano fuori dal ribasso solo sui lavori
         pubblici. Senza questa colonna il Riepilogo li avrebbe contati
         come «privato» e avrebbe scritto una cifra diversa da quella
         dell'elenco per lo stesso computo. Due schermate, due numeri:
         e' il difetto delle fatture del 13 agosto, in un'altra stanza. */
      _avvia(sb.from("gest_computi").select("id,numero,titolo,stato,data,ribasso_perc,tipo").eq("user_id",sbUid).eq("mestiere_id",mid)
        .order("data",{ascending:false})),
      _avvia(sb.from("gest_computo_totali").select("computo_id,importo,oneri_sicurezza,importo_manodopera").eq("user_id",sbUid))
    ]);
    /* le scadenze delle persone (visita medica, formazione, documento,
       permesso): una lettura sola, e non aspetta niente nemmeno lei */
    const pScadPers=scadenzePersone(mid);

    /* ---- primo giro di letture: tutto quello che non dipende dagli id dei lavori ---- */
    /* se una lettura fallisce NON si fa finta di niente: prima il Riepilogo
       mostrava "Tutto in ordine" con tutti zeri, come se i dati fossero spariti */
    let erroreLettura=false, erroreLettura2=false;
    let L=[],CLI=[],PV=[],OPE=[],MZ=[],MZS=[],SC=[],CA=[],CAS=[],AZ=null,FT=[],FL=[],RIFR=[],FFO=[],NOLR=[];
    try{
      const r=await Promise.all([
        sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,data_fatto,importo,fatt_stato,ore,cliente_id,operatore_id").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_clienti").select("id,nome").eq("user_id",sbUid).or(_cliOr(mid)),
        sb.from("gest_preventivi").select("*").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_operatori").select("id,nome").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_mezzi").select("id,nome,targa,categoria").eq("user_id",sbUid).or(_cliOr(mid)),
        sb.from("gest_mezzi_scadenze").select("mezzo_id,aperte,scadute,prossima_data,prossimo_titolo").eq("user_id",sbUid),
        sb.from("gest_scadenze").select("id,titolo,data_scadenza,stato,mezzo_id").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_carte").select("id,nome,stato").eq("user_id",sbUid).eq("mestiere_id",mid),
        sb.from("gest_carte_saldo").select("carta_id,saldo").eq("user_id",sbUid),
        sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle(),
        sb.from("gest_fatture").select("*").eq("user_id",sbUid).eq("mestiere_id",mid),
        /* i lavori già dentro una fattura, anche solo in bozza: è così che
           la sezione Fatture decide chi e' "da fatturare". Il Riepilogo usava
           invece fatt_stato, che resta "none" finche' la fattura non viene
           emessa: le due schermate si contraddicevano. (9/8/2026) */
        sb.from("gest_fattura_lavori").select("lavoro_id").eq("user_id",sbUid),
        /* i pieni pagati in contanti e le fatture dei fornitori: sono costi
           veri e prima non entravano nell'utile (9/8/2026) */
        /* 13 agosto 2026 — mancava il filtro sul reparto: i pieni di TUTTI i
           reparti finivano nei costi del reparto che stavi guardando. Con due
           reparti, il gasolio dell'uno abbassava l'utile dell'altro. La riga
           qui sotto (fatture fornitori) il filtro ce l'aveva gia'.
           ⚠️ Si prendono anche quelli SENZA reparto: sono i pieni registrati
           prima che la colonna esistesse, e farli sparire dai costi vorrebbe
           dire alzare l'utile di un'impresa che non ha toccato niente. Quelli
           restano contati in tutti i reparti finche' non gli si da' un reparto. */
        sb.from("gest_rifornimenti").select("importo,data,movimento_id")
          .eq("user_id",sbUid).or("mestiere_id.eq."+mid+",mestiere_id.is.null"),
        sb.from("gest_fatture_fornitori").select("importo,data,lavoro_id").eq("user_id",sbUid).eq("mestiere_id",mid),
        /* ⛔ 24 agosto 2026 — il noleggio e' uscito dal reparto, ma un mezzo
           taggato a QUESTO reparto e' un noleggio interno vero: conta come
           spesa qui, come se l'avessi preso da un fornitore esterno. */
        sb.from("nol_noleggi").select("importo,data_uscita,fase").eq("user_id",sbUid).eq("mestiere_id",mid)
      ]);
      L=r[0].data||[];CLI=r[1].data||[];PV=r[2].data||[];OPE=r[3].data||[];
      MZ=r[4].data||[];MZS=r[5].data||[];SC=r[6].data||[];CA=r[7].data||[];CAS=r[8].data||[];
      AZ=r[9].data||null;FT=r[10].data||[];FL=(r[11]&&r[11].data)||[];
      RIFR=(((r[12]&&r[12].data)||[])).filter(x=>!x.movimento_id);   /* quelli con carta sono già in CM */
      FFO=((r[13]&&r[13].data)||[]);
      NOLR=((r[14]&&r[14].data)||[]);
      const conErrore=r.find(x=>x&&x.error);
      if(conErrore)erroreLettura=true;
    }catch(e){erroreLettura=true;}

    if(erroreLettura){
      const ra0=$("#rie-alert");
      if(ra0)ra0.innerHTML='<div class="rie-errore"><b>Non riesco a leggere i dati.</b> '
        +'Forse la connessione fa i capricci: i numeri non sono aggiornati, ma i tuoi dati sono al sicuro. '
        +'<button class="btn" data-action="rie-riprova">Riprova</button></div>';
      G.innerHTML='<div class="rc-caricamento">Dati non caricati. Premi Riprova qui sopra.</div>';
      return;
    }

    const ids=L.map(l=>l.id);
    const cliMap=Object.fromEntries(CLI.map(c=>[c.id,c.nome||""]));
    const opeMap=Object.fromEntries(OPE.map(o=>[o.id,o.nome||""]));
    /* la manodopera ha bisogno dei lavori, quindi prima non poteva partire —
       ma non ha bisogno di NIENT'ALTRO: parte adesso e cammina insieme al
       secondo giro, invece di aspettare che finisca. Le sue tre letture non
       sono un'ondata in piu': sono dentro la stessa.
       ⚠️ caricaManodopera si mangia i suoi errori da sola e torna sempre
       qualcosa: lasciarla correre senza aspettarla non lascia grida in giro. */
    const pMd=caricaManodopera(mid,L);

    /* ---- secondo giro: quello che ha bisogno degli id dei lavori ---- */
    let SP=[],nFoto=0,nVideo=0,PR=[],CM=[],FR=[];
    try{
      const attesaIds=PV.filter(p=>p.stato==="bozza"||p.stato==="inviato").map(p=>p.id);
      /* ===== 13 agosto 2026 — LA CARTA ELIMINATA CHE ALZAVA L'UTILE =====
         `CA` sono le carte VIVE: passa dal Cestino. Quindi i movimenti si
         chiedevano solo per quelle, e mettendo una carta nel Cestino tutte le
         spese gia' fatte con quella carta sparivano dai costi: l'utile del
         mese saliva da solo, senza che nessuno avesse toccato un lavoro.
         Ma quei soldi sono usciti davvero. Si legge dalla porta di servizio
         (sb.raw), come si fa per le tariffe delle persone eliminate dal
         13 agosto: mettere in ordine le carte non riscrive la storia. */
      const {data:carteTutte}=await pCarteTutte;   /* partita in cima, qui si aspetta */
      const carteIds=(carteTutte||[]).map(c=>c.id);
      const q=await Promise.all([
        ids.length?sb.from("gest_spese").select("importo,data,lavoro_id").eq("user_id",sbUid).in("lavoro_id",ids):Promise.resolve({data:[]}),
        ids.length?sb.from("gest_foto").select("id",{count:"exact",head:true}).eq("user_id",sbUid).in("lavoro_id",ids).not("tipo","in",_nonFotoSql):Promise.resolve({count:0}),
        ids.length?sb.from("gest_video").select("id",{count:"exact",head:true}).eq("user_id",sbUid).in("lavoro_id",ids):Promise.resolve({count:0}),
        attesaIds.length?sb.from("gest_preventivo_righe").select("preventivo_id,qta,prezzo").in("preventivo_id",attesaIds):Promise.resolve({data:[]}),
        carteIds.length?sb.from("gest_carte_movimenti").select("tipo,importo,data,created_at,carta_id").eq("user_id",sbUid).in("carta_id",carteIds):Promise.resolve({data:[]}),
        FT.length?sb.from("gest_fattura_righe").select("fattura_id,qta,prezzo,iva").eq("user_id",sbUid).in("fattura_id",FT.map(f=>f.id)):Promise.resolve({data:[]})
      ]);
      SP=q[0].data||[];nFoto=q[1].count||0;nVideo=q[2].count||0;PR=q[3].data||[];
      CM=(q[4].data||[]).filter(m=>m.tipo==="spesa");FR=q[5].data||[];
      if(q.find(x=>x&&x.error))erroreLettura2=true;
    }catch(e){erroreLettura2=true;}

    /* Fornitori: tabelle nuove (sql/gest-fornitori.sql). Lettura separata e
       tollerante: se la migrazione non è stata eseguita, il Riepilogo non va
       in errore e la scheda semplicemente non compare. */
    let FFOR=[],FORNI=[],fornTabOk=true;
    try{
      const [rff2,rfo2]=await pForn;               /* partita in cima, qui si aspetta */
      if(rff2.error||rfo2.error)fornTabOk=false;else{FFOR=rff2.data||[];FORNI=rfo2.data||[];}
    }catch(e){fornTabOk=false;}

    /* ---- calcoli (identici a prima) ---- */
    const aperti   = L.filter(l=>l.stato!=="fatto");
    const ritardo  = aperti.filter(l=>inRitardo(l.stato,l.data_prevista));
    /* Stessa definizione della sezione Fatture: "da incassare" sono le fatture
       che hai EMESSO e che non ti hanno pagato. I lavori finiti non ancora
       fatturati sono un'altra cosa e li conto a parte: prima finivano qui dentro
       e il numero del Riepilogo non tornava con quello di Fatture. */
    /* i conti delle fatture arrivano dalle fatture vere, non più dalle
       caselle sul lavoro: una fattura può tenerne dentro tre, e ha l'IVA. */
    const fattRigheRie={};
    FR.forEach(r=>{ (fattRigheRie[r.fattura_id]=fattRigheRie[r.fattura_id]||[]).push(r); });
    /* 12 agosto 2026 — qui c'era la QUARTA copia della formula, scritta a mano,
       e si dimenticava la cassa previdenziale e le spese. Su una parcella con
       cassa 4% e 150 di spese la sezione Fatture diceva 2.053 e il Riepilogo
       1.800: 253 euro di differenza per una fattura sola, sul numero che vedi
       appena apri il gestionale. Adesso chiama la stessa fattBasi di tutti gli
       altri, quindi la domanda "quanto devo incassare" ha una risposta sola. */
    /* col segno: una nota di credito abbassa il "da incassare", non lo alza */
    /* 13 agosto 2026 — qui la formula del netto era RISCRITTA A MANO: la quarta
       copia. Oggi, cambiando la base della ritenuta, si e' scollata e il
       Riepilogo diceva 400 € meno del vero su tre fatture su quattro. Adesso
       chiama fattConti come tutti gli altri: di copie ne resta UNA. */
    const totaleFatt=f=>fattConti(f,fattRigheRie[f.id]||[]).daPagareFirmato;
    const daInc    = FT.filter(f=>f.stato==="emessa");
    const totDaInc = daInc.reduce((s,f)=>s+totaleFatt(f),0);
    /* "da fatturare" = lavori finiti con un importo che non stanno ancora
       dentro nessuna fattura. Qui basta il flag sul lavoro, che la fattura
       tiene aggiornato da sola. */
    const _giaInFatt=new Set(FL.map(x=>String(x.lavoro_id)));
    const daFatt   = L.filter(l=>l.stato==="fatto"&&!_giaInFatt.has(String(l.id))&&(l.fatt_stato||"none")==="none"&&+l.importo>0);
    const totDaFatt= daFatt.reduce((s,l)=>s+(+l.importo||0),0);
    const ggPag    = (AZ&&+AZ.giorni_pagamento)||30;
    const scadenza = f=>f.data?_giorniDopo(f.data,ggPag):"";
    /* una nota di credito non e' un credito: non puo' essere scaduta */
    const scadute  = daInc.filter(f=>{const sc=scadenza(f);return fattSegno(f)>0&&sc&&sc<oggi;});
    /* 9 agosto 2026 — l'utile si fa sull'IMPONIBILE, non sul totale incassato.
       Prima: incassato con dentro l'IVA meno spese al netto, quindi l'utile
       usciva gonfiato di tutta l'IVA — che non è tua, la giri allo Stato.
       Il Report usa la stessa formula (fattImponibile), così le due
       schermate smettono di dare due utili diversi sugli stessi dati. */
    const incMese  = FT.filter(f=>f.stato==="pagata"&&thisMonth(f.data_pagata||f.data))
                       .reduce((s,f)=>s+fattImponibile(f,(fattRigheRie&&fattRigheRie[f.id])||[]),0);
    const oreMese  = L.filter(l=>thisMonth(l.data_fatto)||thisMonth(l.data_prevista)).reduce((s,l)=>s+(+l.ore||0),0);
    const speseLav = SP.filter(x=>thisMonth(x.data)).reduce((s,x)=>s+(+x.importo||0),0);
    /* anche le spese delle carte entrano nel conto: prima erano invisibili
       e l'utile risultava più alto del vero */
    const speseCarte= CM.filter(m=>thisMonth(m.data||(m.created_at||"").slice(0,10))).reduce((s,m)=>s+(+m.importo||0),0);
    /* 9 agosto 2026 — gli stessi costi che conta il Report: se no il Riepilogo
       dice un utile e il Report un altro. RIF = pieni pagati in contanti
       (quelli con carta stanno già in CM), FFO = fatture dei fornitori. */
    const speseRif  = RIFR.filter(r=>thisMonth(r.data)).reduce((s,r)=>s+(+r.importo||0),0);
    const speseForn = FFO.filter(f=>thisMonth(f.data)).reduce((s,f)=>s+(+f.importo||0),0);
    /* ⛔ 24 agosto 2026 — noleggio interno di questo reparto: la data che conta
       e' l'uscita del mezzo, come per i lavori.
       ⛔ 6 settembre 2026 — UN MEZZO PRENOTATO NON E' UNA SPESA. Prima il conto
       prendeva ogni noleggio con l'uscita in questo mese, anche quelli in fase
       «prenotato», cioe' mezzi promessi ma ancora fermi in piazzale: l'utile
       del mese risultava piu' basso del vero per soldi mai usciti. Adesso
       contano solo i mezzi usciti davvero («fuori») e quelli gia' rientrati.
       Le fasi sono tre: prenotato · fuori · rientrato. */
    const nolReale  = x => (x.fase || 'fuori') !== 'prenotato';
    const speseNol  = NOLR.filter(x=>nolReale(x) && thisMonth(x.data_uscita)).reduce((s,x)=>s+(+x.importo||0),0);
    const speseMese = speseLav+speseCarte+speseRif+speseForn+speseNol;
    const utile     = incMese-speseMese;
    /* la scheda Report compare quando c'e' stato ALMENO UN movimento di soldi,
       anche di mesi passati: una fattura pagata, una spesa, un movimento di
       carta, un pieno, una fattura di un fornitore. Non basta l'utile del mese:
       un'impresa che ha incassato a maggio e a giugno niente deve continuare a
       vedere la sua scheda Report. */
    const _ciSonoSoldi = FT.some(f=>f.stato==="pagata") || SP.length>0 || CM.length>0
                       || RIFR.length>0 || FFO.length>0 || NOLR.some(nolReale);

    /* lavori in perdita: il calcolo resta identico, cambia solo dove si vede
       (ora è una riga dentro "Da sistemare oggi", più in basso) */
    const spPerL={};SP.forEach(x=>{spPerL[x.lavoro_id]=(spPerL[x.lavoro_id]||0)+(+x.importo||0);});
    /* 12 agosto 2026 — lo stesso conto della scheda del lavoro e del Report:
       importo − spese − fatture dei fornitori − manodopera. Prima qui si
       guardavano solo le spese, quindi un lavoro che nella sua scheda era in
       perdita di 1.200 € nel Riepilogo non veniva segnalato mai. */
    const ffPerL={};FFO.forEach(x=>{if(x.lavoro_id)ffPerL[x.lavoro_id]=(ffPerL[x.lavoro_id]||0)+(+x.importo||0);});
    const mdRie=await pMd;                        /* partita piu' su, qui si aspetta */
    const _margL=l=>margineLavoro(l.importo,spPerL[l.id],ffPerL[l.id],mdRie.per[String(l.id)]);
    const inPerdita=L.filter(l=>((+l.importo||0)>0||spPerL[l.id]||ffPerL[l.id]||mdRie.per[String(l.id)])&&_margL(l)<0);

    /* preventivi in attesa (+ totale di ognuno) */
    const attesa=PV.filter(p=>p.stato==="bozza"||p.stato==="inviato")
                   .sort((a,b)=>String(a.data||"9999").localeCompare(String(b.data||"9999")));
    rieprevCache=attesa;
    const totPrev={};PR.forEach(r=>{totPrev[r.preventivo_id]=(totPrev[r.preventivo_id]||0)+impRiga(r.qta,r.prezzo);});
    /* 9 agosto 2026 — anche qui il numero che vede il cliente, come nella
       lista Preventivi e nel PDF: tre schermate, un numero solo. */
    PV.forEach(function(p){
      const base=totPrev[p.id]||0;
      if(ruoloUtente==='professionista'){
        totPrev[p.id]=calcolaParcella(base,p.cassa_perc,p.iva_perc,!!p.ritenuta,p.ritenuta_perc||20,p.spese_forfait).totale;
      }else if(p.iva_perc!=null&&p.iva_perc!==""){
        const iva=_centPerc(base,+p.iva_perc||0);
        totPrev[p.id]=_cent2(base+iva);
      }
    });

    /* prossimi lavori, ordinati per data */
    const pross=aperti.slice().sort((a,b)=>(a.data_prevista||"9999").localeCompare(b.data_prevista||"9999"));
    /* calendario: cosa c'e' nei prossimi 7 giorni */
    const set7=aperti.filter(l=>l.data_prevista&&l.data_prevista>=oggi&&l.data_prevista<=lim7)
                     .sort((a,b)=>a.data_prevista.localeCompare(b.data_prevista));
    /* agenda: lavori aperti raggruppati per operatore */
    const perOpe={};aperti.forEach(l=>{if(l.operatore_id)perOpe[l.operatore_id]=(perOpe[l.operatore_id]||0)+1;});
    const opeOrd=Object.keys(perOpe).sort((a,b)=>perOpe[b]-perOpe[a]);
    /* ===== 12 agosto 2026 — MEZZI E STRUMENTI SONO DUE COSE DIVERSE =====
       Stanno nella stessa tabella, distinti dalla colonna "categoria", e qui
       il Riepilogo li contava insieme: la scheda diceva "2 mezzi in azienda",
       ci cliccavi sopra ed entrando nei Mezzi ne trovavi 1. L'altro era la
       stazione totale. E la verifica del ponteggio scaduta compariva come
       "1 mezzo con scadenza passata", portandoti nei Mezzi.

       Ma la cosa grave era per il PROFESSIONISTA. La sezione Strumenti
       promette TRE VOLTE "il Riepilogo ti avvisa prima che scadano" (e gli
       aiuti una quarta). Non era vero: la scheda Strumenti nel Riepilogo non
       esisteva, e l'unica che leggeva quelle scadenze — la scheda Mezzi — per
       lui e' nascosta. Un ingegnere con la stazione totale fuori taratura non
       lo scopriva mai dalla prima pagina, e una misura presa con uno strumento
       fuori taratura non vale. */
    const _pro=(ruoloUtente==='professionista');
    const _attr=m=>m&&m.categoria==="attrezzatura";
    const MZveicoli=MZ.filter(m=>!_attr(m));
    const MZstrum  =MZ.filter(_attr);
    const mzNome=Object.fromEntries(MZ.map(m=>[m.id,m.nome||"Mezzo"]));
    const _scadDi=elenco=>{
      const ids=new Set(elenco.map(m=>m.id));
      return MZS.filter(v=>ids.has(v.mezzo_id)&&(v.scadute>0||(v.prossima_data&&v.prossima_data<=lim30)))
                .sort((a,b)=>String(a.prossima_data||"9999").localeCompare(String(b.prossima_data||"9999")));
    };
    const mzAvvisa=_scadDi(MZveicoli);
    const stAvvisa=_scadDi(MZstrum);
    /* squadra: quanti lavori aperti ha ciascuno */
    /* carte: saldo per carta */
    const saldoMap=Object.fromEntries(CAS.map(x=>[x.carta_id,+x.saldo||0]));
    const carteAtt=CA.filter(c=>c.stato!=="chiusa");
    const saldoTot=carteAtt.reduce((s,c)=>s+(saldoMap[c.id]||0),0);
    /* condomini: quanti lavori aperti per ciascuno */
    const perCli={};aperti.forEach(l=>{if(l.cliente_id)perCli[l.cliente_id]=(perCli[l.cliente_id]||0)+1;});
    const cliOrd=Object.keys(perCli).sort((a,b)=>perCli[b]-perCli[a]);
    /* scadenzario */
    /* 12 agosto 2026 — anche le scadenze delle PERSONE (visita medica,
       formazione sicurezza, documento, permesso di soggiorno). Prima il
       Riepilogo leggeva solo gest_scadenze: per un'impresa edile mancavano
       proprio quelle che portano le sanzioni, e lo Scadenzario intanto
       prometteva che "quelle gia' passate finiscono in cima al Riepilogo". */
    const SCP=await pScadPers;                    /* partita in cima, qui si aspetta */
    const scTutte=SC.concat(SCP);
    const scAperte=scTutte.filter(x=>x.stato!=="fatta"&&x.data_scadenza&&x.data_scadenza<=lim30)
                     .sort((a,b)=>a.data_scadenza.localeCompare(b.data_scadenza));

    /* ---- "Da sistemare oggi": la scorciatoia in cima ----
       Non calcola niente di nuovo: raccoglie i numeri già contati qui sopra
       e li mette in fila dal più urgente. Le schede sotto restano identiche.
       Se non c'e' niente di scaduto o in ritardo, lo dice e basta. */
    const lavOggi = aperti.filter(l=>l.data_prevista===oggi);
    /* le scadenze legate a un mezzo (revisione, assicurazione...) sono le stesse
       righe che la vista gest_mezzi_scadenze conta per i Mezzi: le tolgo da qui,
       altrimenti la stessa cosa comparirebbe due volte con parole diverse. */
    const scScadute = scAperte.filter(x=>x.data_scadenza<oggi&&!x.mezzo_id);
    const mzScaduti = mzAvvisa.filter(v=>v.scadute>0);
    const limVecchio = _giorniDopo(oggi,-7);
    const prevFermi = attesa.filter(p=>p.data&&String(p.data)<limVecchio);
    const totScadute = scadute.reduce((s,f)=>s+totaleFatt(f),0);

    const DA=[];
    const nn=(n,uno,tanti)=>n+" "+(n===1?uno:tanti);
    if(scadute.length)   DA.push({g:1,male:1,t:nn(scadute.length,"fattura scaduta","fatture scadute"),
                                  d:"Non ti hanno ancora pagato: "+eur(totScadute),go:"fatture"});
    if(daFatt.length)    DA.push({g:2,male:1,t:nn(daFatt.length,"lavoro finito da fatturare","lavori finiti da fatturare"),
                                  d:"Valgono "+eur(totDaFatt)+" e non sono ancora in nessuna fattura",go:"fatture"});
    if(ritardo.length)   DA.push({g:1,male:1,t:nn(ritardo.length,"lavoro in ritardo","lavori in ritardo"),
                                  d:"La data prevista è già passata",go:"lavori"});
    if(scScadute.length) DA.push({g:1,male:1,t:nn(scScadute.length,"scadenza passata","scadenze passate"),
                                  d:(scScadute[0].titolo||"Scadenza")+(scScadute[0]._persona?" · "+scScadute[0]._nome:"")+(scScadute.length>1?" e altre":""),go:"scadenzario"});
    if(mzScaduti.length) DA.push({g:1,male:1,t:nn(mzScaduti.length,"mezzo con scadenza passata","mezzi con scadenza passata"),
                                  d:(mzNome[mzScaduti[0].mezzo_id]||"Mezzo")+(mzScaduti[0].prossimo_titolo?" · "+mzScaduti[0].prossimo_titolo:""),go:"mezzi"});
    /* strumenti e attrezzature: riga loro, e porta nella sezione giusta.
       Per lo studio tecnico e' l'avviso della taratura, quello promesso. */
    const stScaduti = stAvvisa.filter(v=>v.scadute>0);
    if(stScaduti.length) DA.push({g:1,male:1,
      t:nn(stScaduti.length, _pro?"strumento con scadenza passata":"attrezzatura con scadenza passata",
                             _pro?"strumenti con scadenza passata":"attrezzature con scadenza passata"),
      d:(mzNome[stScaduti[0].mezzo_id]||(_pro?"Strumento":"Attrezzatura"))+(stScaduti[0].prossimo_titolo?" · "+stScaduti[0].prossimo_titolo:""),
      go:"attrezzature"});
    if(inPerdita.length) DA.push({g:1,male:1,t:nn(inPerdita.length,"lavoro in perdita","lavori in perdita"),
                                  d:"Fra spese, fornitori e manodopera esce più di quello che entra",go:"report"});
    /* patente a crediti: sotto 15 l'impresa non può operare in cantiere,
       quindi avviso già a 20 per dare il tempo di recuperarli. */
    const patC = AZ&&AZ.pat_crediti!=null ? +AZ.pat_crediti : null;
    /* la patente a crediti serve a chi entra in cantiere: uno studio tecnico
       non ce l'ha, e vedersi un allarme rosso su un adempimento che non lo
       riguarda fa solo perdere fiducia nel resto degli avvisi (9/8/2026) */
    const _patNo=(ruoloUtente==='professionista');
    if(!_patNo&&patC!=null&&patC<15)      DA.push({g:1,male:1,t:"Patente a crediti sotto il minimo — "+patC+(patC===1?" credito":" crediti"),
                                  d:"Sotto 15 crediti non si può operare in cantiere",act:"rie-azienda"});
    else if(!_patNo&&patC!=null&&patC<20) DA.push({g:2,t:"Patente a crediti quasi al minimo — "+patC+" crediti",
                                  d:"Il minimo per operare in cantiere è 15",act:"rie-azienda"});
    if(lavOggi.length)   DA.push({g:2,t:nn(lavOggi.length,"lavoro in programma oggi","lavori in programma oggi"),
                                  d:(lavOggi[0].descrizione||"Lavoro")+(lavOggi.length>1?" e altri":""),go:"lavori"});
    /* ⚠️ 21 agosto 2026 — IL TITOLO DICEVA UNA COSA E LA SCHEDA UN'ALTRA.
       Qui c'era «1 preventivo senza risposta», e due centimetri sotto la
       scheda Preventivi diceva «2 in attesa di risposta». Non sono numeri
       sbagliati — sono due conti diversi: uno e' «fermo da piu' di una
       settimana», l'altro «in attesa» — ma sullo stesso schermo, con le
       stesse parole e numeri diversi, sembra un errore del gestionale.
       ⛔ Il titolo adesso dice DA QUANTO, che e' quello che lo distingue. */
    if(prevFermi.length) DA.push({g:2,male:1,t:nn(prevFermi.length,"preventivo fermo da più di una settimana","preventivi fermi da più di una settimana"),
                                  /* ⚠️ 21 agosto 2026 — con UNO si leggeva "Fermi ... vanno sollecitati".
                                     Il titolo il singolare ce l'aveva (nn), la riga sotto no. Visto da
                                     Alessio in una foto. Stessa famiglia di "le 1 righe rimaste uguali". */
                                  d:prevFermi.length===1
                                      ? "Forse va sollecitato"
                                      : "Forse vanno sollecitati",go:"preventivi"});

    /* dati azienda mancanti: va in cima a tutto il resto. Senza nome e partita
       IVA i PDF di preventivi e fatture escono senza intestazione, quindi è la
       prima cosa da fare appena ci si iscrive. */
    if(!AZ||!(AZ.nome||"").trim()||!(AZ.piva||"").trim()){
      DA.unshift({g:2,t:"Completa i dati della tua azienda",
                  d:"Nome e partita IVA compaiono in cima a ogni preventivo e fattura",act:"rie-azienda"});
    }

    /* ⛔ QUALI SEZIONI VANNO MALE: si prende da qui e da nessun'altra parte,
       cioe' dalla stessa lista che leggi nella fascia. «Lavoro in programma
       oggi» NON e' un guaio, e infatti non ha il segno «male». */
    _rieMale=new Set(DA.filter(x=>x.male&&x.go).map(x=>x.go));

    const ra=$("#rie-alert");
    if(ra){
      if(!DA.length){
        ra.innerHTML='<div class="rie-oggi tutto-ok">'
          + '<div class="ro-tit"><span class="ro-pallino"></span>Tutto in ordine</div>'
          + '<div class="ro-sotto">Niente di scaduto e niente in ritardo. Buon lavoro.</div>'
          + '</div>';
      }else{
        ra.innerHTML='<div class="rie-oggi">'
          + '<div class="ro-tit"><span class="ro-pallino"></span>Da sistemare oggi</div>'
          + '<div class="ro-sotto">'+(DA.length===1?"Una cosa che chiede attenzione.":DA.length+" cose che chiedono attenzione.")+' Clicca una riga per andarci.</div>'
          + DA.slice(0,5).map(r=>
              '<div class="ro-riga '+(r.g===1?"grave":"attesa")+'" '
            +   (r.act?'data-action="'+r.act+'"':'data-action="rie-go" data-go="'+r.go+'"')+'>'
            +   '<span class="ro-testo">'+esc(r.t)+'<span class="ro-dett">'+esc(r.d)+'</span></span>'
            +   '<span class="ro-freccia">›</span>'
            + '</div>').join("")
          + '</div>';
      }
      /* il secondo giro di letture è andato male: i numeri di spese, foto e
         totali possono essere incompleti. Meglio dirlo che far finta di niente. */
      if(erroreLettura2)ra.insertAdjacentHTML("afterbegin",
        '<div class="rie-errore"><b>Alcuni numeri non si sono caricati</b> (spese, foto o totali): '
        +'quello che vedi può essere incompleto. '
        +'<button class="btn" data-action="rie-riprova">Riprova</button></div>');
    }

    /* ---- le 12 schede, nello stesso ordine del menu ---- */
    const C=[];

    C.push(rieCard({
      tab:"lavori", titolo:_lav(), n:aperti.length, dati:L.length>0,
      lab: ritardo.length? ritardo.length+" in ritardo":_plur(aperti.length,"lavoro aperto","lavori aperti"),
      tono: ritardo.length?"err":(aperti.length?"attesa":"ok"),
      vuoto:"Nessun lavoro aperto",
      righe: pross.slice(0,2).map(l=>{const q=quando(l.data_prevista);return{
        t:l.descrizione||"Lavoro", v:q.testo, cls:inRitardo(l.stato,l.data_prevista)?"q-passato":q.classe,
        action:"edit-job", id:l.id};})
    }));

    C.push(rieCard({
      tab:"preventivi", titolo:"Preventivi", n:attesa.length, dati:PV.length>0,
      lab:_plur(attesa.length,"in attesa di risposta","in attesa di risposta"), tono:attesa.length?"attesa":"ok",
      vuoto:"Nessun preventivo in attesa",
      righe: attesa.slice(0,2).map(p=>({
        t:p.titolo||"Preventivo", v:totPrev[p.id]?eur(totPrev[p.id]):"",
        action:"rie-prev", id:p.id}))
    }));

    C.push(rieCard({
      tab:"fatture", titolo:"Fatture", n:eur(totDaInc), dati:(FT.length>0||daFatt.length>0),
      lab: scadute.length
            ? "da incassare · "+scadute.length+(scadute.length===1?" fattura scaduta":" fatture scadute")
            : "da incassare · da fatturare "+eur(totDaFatt),
      tono: scadute.length?"err":(totDaInc>0?"attesa":"ok"),
      vuoto: totDaFatt>0?("Da fatturare: "+eur(totDaFatt)):"Nessuna fattura da incassare",
      righe: daInc.slice()
              .sort((a,b)=>String(a.data||"").localeCompare(String(b.data||"")))
              .slice(0,2).map(f=>{
        const sc=scadenza(f), fuori=sc&&sc<oggi;
        const g=f.data?-_giorniA(f.data):null;
        return {t:"Fattura "+(f.numero?("n. "+f.numero+"/"+fattAnno(f)):"senza numero"),
                v:eur(totaleFatt(f))+(g!=null?" · "+g+" gg":""),
                cls:fuori?"q-passato":"",
                action:"rie-go-fatture", id:f.id};
      })
    }));

    C.push(rieCard({
      tab:"calendario", titolo:"Calendario", n:set7.length, dati:L.some(l=>!!l.data_prevista),
      lab:"nei prossimi 7 giorni", tono:set7.length?"info":"neutro",
      vuoto:"Nessun impegno questa settimana",
      righe: set7.slice(0,2).map(l=>{const q=quando(l.data_prevista);return{
        t:l.descrizione||"Lavoro", v:q.testo, cls:q.classe, action:"edit-job", id:l.id};})
    }));

    if(!tabNascosto("agenda"))C.push(rieCard({
      tab:"agenda", titolo:"Agenda operatore", n:opeOrd.length, dati:L.some(l=>!!l.operatore_id),
      lab:_plur(opeOrd.length,"operatore con lavori assegnati","operatori con lavori assegnati"), tono:opeOrd.length?"info":"neutro",
      vuoto:"Nessun lavoro assegnato",
      righe: opeOrd.slice(0,2).map(k=>({
        t:opeMap[k]||"Operatore", v:perOpe[k]+(perOpe[k]===1?" lavoro":" lavori")}))
    }));

    /* il professionista ha Mezzi, Attrezzature e Carte nascosti nel menu:
       le loro schede non devono comparire nemmeno nel Riepilogo, altrimenti
       un clic lo porta in una sezione "fantasma" senza voce di menu */
    /* ⛔ 22 agosto 2026: l'elenco non sta piu' qui dentro — lo dice
       tabNascosto(), che lo dice anche al menu. Vale per lo studio tecnico
       (mezzi, carte) e per l'artigiano (squadra, agenda, carte, e le quattro
       da appalti). */
    const _proNascosto=tabNascosto;
    if(!_proNascosto("mezzi"))C.push(rieCard({
      tab:"mezzi", titolo:"Mezzi", n:MZveicoli.length, dati:MZveicoli.length>0,
      lab: mzAvvisa.length? mzAvvisa.length+(mzAvvisa.length===1?" con scadenza vicina":" con scadenze vicine")
                          : (MZveicoli.length===1?"mezzo in azienda":"mezzi in azienda"),
      tono: mzAvvisa.some(v=>v.scadute>0)?"err":(mzAvvisa.length?"attesa":"ok"),
      vuoto: MZveicoli.length?"Nessuna scadenza in arrivo":"Nessun mezzo registrato",
      righe: mzAvvisa.slice(0,2).map(v=>{const q=quando(v.prossima_data);return{
        t:mzNome[v.mezzo_id]+(v.prossimo_titolo?" · "+v.prossimo_titolo:""),
        v:v.scadute>0?"scaduta":q.testo, cls:v.scadute>0?"q-passato":q.classe};})
    }));

    /* la scheda che mancava: Strumenti per lo studio, Attrezzature per
       l'impresa. Le tarature e le verifiche periodiche si vedono da qui. */
    C.push(rieCard({
      tab:"attrezzature", titolo: _pro?"Strumenti":"Attrezzature", n:MZstrum.length, dati:MZstrum.length>0,
      lab: stAvvisa.length? stAvvisa.length+(stAvvisa.length===1?" con scadenza vicina":" con scadenze vicine")
                          : (_pro?"strumenti dello studio":"attrezzature in azienda"),
      tono: stAvvisa.some(v=>v.scadute>0)?"err":(stAvvisa.length?"attesa":"ok"),
      vuoto: MZstrum.length?"Nessuna taratura o verifica in arrivo"
                           :(_pro?"Nessuno strumento registrato":"Nessuna attrezzatura registrata"),
      righe: stAvvisa.slice(0,2).map(v=>{const q=quando(v.prossima_data);return{
        t:mzNome[v.mezzo_id]+(v.prossimo_titolo?" · "+v.prossimo_titolo:""),
        v:v.scadute>0?"scaduta":q.testo, cls:v.scadute>0?"q-passato":q.classe};})
    }));

    if(!tabNascosto("squadra"))C.push(rieCard({
      tab:"squadra", titolo:"Squadra", n:OPE.length, dati:OPE.length>0,
      lab:_plur(OPE.length,"persona in squadra","persone in squadra")+" · "+(Math.round(oreMese*10)/10)+" h questo mese",
      tono:"neutro", vuoto:"Nessun operatore registrato",
      righe: OPE.slice(0,2).map(o=>({
        t:o.nome||"Operatore",
        v:(perOpe[o.id]||0)+((perOpe[o.id]||0)===1?" lavoro":" lavori")}))
    }));

    if(fornTabOk){
      const ffAp2=FFOR.filter(f=>f.stato!=="pagata");
      const totFf=ffAp2.reduce((sm,f)=>sm+(+f.importo||0),0);
      const ffRit=ffAp2.filter(f=>f.scadenza&&f.scadenza<oggi);
      const ffOrd=ffAp2.filter(f=>f.scadenza).sort((a,b)=>a.scadenza.localeCompare(b.scadenza));
      const fornNome=Object.fromEntries(FORNI.map(x=>[String(x.id),x.nome||"Fornitore"]));
      C.push(rieCard({
        tab:"fornitori", titolo:"Fornitori", n:eur(totFf), dati:(FFOR.length>0||FORNI.length>0),
        lab: ffRit.length? ffRit.length+(ffRit.length===1?" fattura scaduta":" fatture scadute"):"da pagare ai fornitori",
        tono: ffRit.length?"err":(ffAp2.length?"attesa":"ok"),
        vuoto:"Nessuna fattura da pagare",
        righe: ffOrd.slice(0,2).map(f=>{const q2=quando(f.scadenza);return{
          t:fornNome[String(f.fornitore_id)]||"Fornitore",
          v:q2.testo+" · "+eur(f.importo),
          cls:f.scadenza<oggi?"q-passato":q2.classe};})
      }));
    }

    if(!_proNascosto("carte"))C.push(rieCard({
      tab:"carte", titolo:"Carte", n:eur(saldoTot), dati:CA.length>0,
      lab:"saldo di "+carteAtt.length+(carteAtt.length===1?" carta attiva":" carte attive"),
      tono: saldoTot<0?"err":"neutro", vuoto:"Nessuna carta attiva",
      righe: carteAtt.slice(0,2).map(c=>({
        t:c.nome||"Carta", v:eur(saldoMap[c.id]||0),
        cls:(saldoMap[c.id]||0)<0?"q-passato":""}))
    }));

    C.push(rieCard({
      tab:"clienti", titolo:"Clienti", n:CLI.length, dati:CLI.length>0,
      lab:_plur(CLI.length,"cliente in anagrafica","clienti in anagrafica"), tono:"neutro",
      vuoto:"Nessun cliente registrato",
      righe: cliOrd.slice(0,2).map(k=>({
        t:cliMap[k]||"Cliente",
        v:perCli[k]+(perCli[k]===1?" lavoro aperto":" lavori aperti")}))
    }));

    /* ===== 10 agosto 2026 — la scheda dei Computi metrici =====
       Il Riepilogo ha una scheda per ogni voce del menu, e questa mancava: la
       sezione c'era ma dal Riepilogo non si arrivava.
       Si legge SOLO per gli studi tecnici (gli altri non hanno la sezione) e
       dentro un try: se sql/gest-computo-metrico.sql non e' stato eseguito la
       scheda non compare e il Riepilogo resta intero — meglio una scheda in
       meno che un Riepilogo rotto. */
    if(!tabNascosto("computi")){
      try{
        const [rCo,rTo]=await pComputi;            /* partita in cima, qui si aspetta */
        if(!rCo.error){
          const CO=rCo.data||[];
          /* anche qui il numero e' quello NETTO: il Riepilogo, l'elenco dei
             computi, la scheda e il PDF devono dire tutti la stessa cifra */
          const totDi={};(rTo&&rTo.data||[]).forEach(r=>{totDi[r.computo_id]=r;});
          const impDi={};CO.forEach(c=>{const t=totDi[c.id]||{};
            impDi[c.id]=compRiepilogoDa(t.importo,t.oneri_sicurezza,t.importo_manodopera,c).netto;});
          const bozze=CO.filter(c=>c.stato==="bozza");
          C.push(rieCard({
            /* ⚠️ il titolo lo scrive rieCard, non il menu: se cambiassi solo
               la voce del menu qui resterebbe la parola del tecnico. */
            tab:"computi", titolo:_cm('nome'), n:CO.length, dati:CO.length>0,
            lab: CO.length===1?(_cm('uno')+" nel reparto"):(_cm('tanti')+" nel reparto"),
            tono: bozze.length?"attesa":(CO.length?"ok":"neutro"),
            vuoto:"Nessun "+_cm('uno'),
            righe: CO.slice(0,2).map(c=>({
              t:(c.numero?("N. "+c.numero+" — "):"")+(c.titolo||"Computo"),
              v:eur(impDi[c.id]||0)}))
          }));

          /* ===== 20 agosto 2026 — la scheda degli STATI DI AVANZAMENTO =====
             Ogni voce del menu ha la sua scheda, e questa e' nata insieme alla
             sezione. Try suo: se sql/gest-sal.sql non fosse stato eseguito la
             scheda non compare e il Riepilogo resta intero.
             ⚠️ Solo i SAL dei computi DI QUESTO REPARTO, e solo di computi
             vivi: e' la stessa regola dell'elenco (renderSalTutti). */
          try{
            const [rSa,rSt]=await Promise.all([
              sb.from("gest_sal").select("*").eq("user_id",sbUid).order("data",{ascending:false}),
              sb.from("gest_sal_totali").select("*").eq("user_id",sbUid)
            ]);
            if(!rSa.error&&!rSt.error){
              const compDi={};CO.forEach(c=>{compDi[String(c.id)]=c;});
              const totSa={};(rSt.data||[]).forEach(t=>{totSa[String(t.sal_id)]=t;});
              const SA=(rSa.data||[]).filter(x=>!!compDi[String(x.computo_id)]);
              /* ⚠️ «va male» qui vuol dire SOLDI NON CHIESTI: un SAL emesso e'
                 un conto gia' consegnato al committente, e finche' non diventa
                 fattura quei soldi non li ha chiesti nessuno. Un SAL in BOZZA
                 non e' un problema: e' un lavoro ancora in corso. */
              const daFatt2=SA.filter(x=>x.stato==="emesso"&&!x.fattura_id);
              C.push(rieCard({
                tab:"sal", titolo:"Stati di avanzamento", n:SA.length, dati:SA.length>0,
                lab: daFatt2.length
                      ? daFatt2.length+(daFatt2.length===1?" emesso e non ancora fatturato":" emessi e non ancora fatturati")
                      : _plur(SA.length,"stato di avanzamento","stati di avanzamento"),
                tono: daFatt2.length?"attesa":(SA.length?"ok":"neutro"),
                male: daFatt2.length>0,
                vuoto:"Nessuno stato di avanzamento",
                /* i conti passano da salConti + compRiepilogoDa, come nell'elenco,
                   nella scheda e nel PDF: nessuna formula copiata */
                righe: SA.slice(0,2).map(x=>({
                  t:"SAL n. "+(x.numero||"")+" — "+((compDi[String(x.computo_id)]||{}).titolo||"Computo"),
                  v:eur2(salConti(totSa[String(x.id)],compDi[String(x.computo_id)]||{}).netto)}))
              }));
            }
          }catch(_){}
        }
      }catch(_){}
    }

    C.push(rieCard({
      tab:"scadenzario", titolo:"Scadenzario", n:scAperte.length, dati:scTutte.length>0,
      lab:_plur(scAperte.length,"scadenza entro 30 giorni","scadenze entro 30 giorni"),
      tono: scAperte.some(x=>x.data_scadenza<oggi)?"err":(scAperte.length?"attesa":"ok"),
      /* rosso gia' a sette giorni: una scadenza che scade lunedi' non si
         sistema lunedi'. Trenta giorni invece sono ancora tempo. */
      male: scAperte.some(x=>x.data_scadenza<=lim7),
      vuoto:"Nessuna scadenza in arrivo",
      righe: scAperte.slice(0,2).map(x=>{const q=quando(x.data_scadenza);return{
        t:(x.titolo||"Scadenza")+(x._persona?" · "+x._nome:""), v:x.data_scadenza<oggi?"scaduta":q.testo,
        cls:x.data_scadenza<oggi?"q-passato":q.classe};})
    }));

    C.push(rieCard({
      tab:"report", titolo:"Report", n:eur(utile), dati:_ciSonoSoldi,
      lab:"utile di questo mese (incassato − spese)",
      tono: utile<0?"err":(utile>0?"ok":"neutro"),
      vuoto:"Nessun movimento questo mese",
      /* ⛔ 24 agosto 2026 — rieCard mostra solo le PRIME DUE righe (slice(0,2)):
         una terza voce come riga a se' non si sarebbe mai vista quando
         c'erano gia' rifornimenti o fatture fornitori. Il noleggio interno
         va nella riga "Spese", sempre visibile, come lavori e carte.

         ⛔ 4 settembre 2026 — LA RIGA DELLE SPESE SI LEGGEVA AL CONTRARIO.
         Diceva: «Spese: lavori 0,00 € · carte · noleggio 250,00 €   0,00 €».
         Il numero a destra erano le CARTE, ma la scritta finiva con la parola
         «noleggio» e il suo importo: chiunque legge crede che i 250 € siano
         le carte e che a destra ci sia il noleggio. In piu' le due righe
         «Rifornimenti» e «Fatture dei fornitori» non si vedevano MAI (la
         terza e la quarta riga vengono tagliate), quindi la scheda mostrava
         un utile che comprendeva spese che non nominava nemmeno.
         Adesso: a sinistra tutte le voci con il loro importo, a destra il
         TOTALE delle spese — quello che, tolto dall'incassato, fa l'utile
         grande in cima alla scheda. Nessun conto nuovo: speseMese e' lo
         stesso di sempre. */
      righe:[{t:"Incassato questo mese (IVA esclusa)",v:eur(incMese)},
             (function(){
               const voci=[];
               if(speseLav)  voci.push("lavori "+eur(speseLav));
               if(speseCarte)voci.push("carte "+eur(speseCarte));
               if(speseNol)  voci.push("noleggio "+eur(speseNol));
               if(speseRif)  voci.push("rifornimenti "+eur(speseRif));
               if(speseForn) voci.push("fornitori "+eur(speseForn));
               return {t: voci.length?("Spese: "+voci.join(" · ")):"Spese di questo mese",
                       v: eur(speseMese)};
             })()]
    }));

    C.push(rieCard({
      tab:"galleria", titolo:"Galleria", n:(nFoto+nVideo), dati:(nFoto+nVideo)>0,
      lab:_plur(nFoto+nVideo,"foto o video caricato","foto e video caricati"), tono:"neutro",
      vuoto:"Nessuna foto o video caricato",
      righe:(nFoto+nVideo)?[{t:"Foto",v:String(nFoto)},{t:"Video",v:String(nVideo)}]:[]
    }));

    /* Mappa: quanti cantieri hanno un indirizzo e le distanze già calcolate.
       Qui non chiamo nessun servizio esterno: leggo solo quello che la sezione
       Mappa ha già messo da parte, altrimenti aprire il Riepilogo diventerebbe
       lento e consumerebbe le richieste del servizio gratuito. */
    const conIndirizzo=aperti.filter(l=>{
      const c=CLI.find(x=>x.id===l.cliente_id);
      return (l.dove||"").trim()||(c&&cliIndirizzo(c).trim());
    });
    let mpNote=[];
    try{
      /* 12 agosto 2026 (sera) — il nome era scritto a mano e restava a v2
         mentre la Mappa e' passata a v3: il Riepilogo leggeva la memoria
         VECCHIA, cioe' le distanze sbagliate di prima. Adesso e' la stessa
         costante per tutti e due, quindi non si possono piu' scollare. */
      const C=JSON.parse(localStorage.getItem(MP_CACHE_KEY)||"{}");
      const km=Object.values(C.km||{}).filter(v=>typeof v==="number").sort((a,b)=>a-b);
      if(km.length){
        mpNote=[{t:"Il cantiere più vicino",v:mpFormattaKm(km[0])},
                {t:"Il più lontano",v:mpFormattaKm(km[km.length-1])}];
      }
    }catch(e){}
    C.push(rieCard({
      tab:"mappa", titolo:"Mappa", n:conIndirizzo.length, dati:conIndirizzo.length>0,
      lab:_plur(conIndirizzo.length,"cantiere aperto con un indirizzo","cantieri aperti con un indirizzo"), tono:"neutro",
      vuoto:"Apri la Mappa per calcolare le distanze",
      righe:mpNote
    }));

    /* ===== 15 agosto 2026 — il reparto nuovo =====
       Se non c'e' NIENTE dentro, non si mostra una griglia vuota: si spiega
       come funziona e si offrono i due primi passi. Il riquadro «Tutto in
       ordine» qui sopra resta come prima. */
    const CV=C.filter(Boolean);
    G.innerHTML = CV.length ? CV.join("")
      : '<div class="rie-benvenuto">'
      +   '<div class="rb-tit">Questo reparto è ancora vuoto</div>'
      +   '<div class="rb-txt">Le schede qui sotto compaiono da sole, una alla volta, '
      +     'man mano che inserisci qualcosa. Registra un cliente e compare la scheda '
      +     'Clienti, fai un preventivo e compare quella dei Preventivi.</div>'
      +   '<div class="rb-txt">Si comincia da qui:</div>'
      +   '<div class="rb-bottoni">'
      +     '<button class="btn add" data-action="new-cli" data-tipo="privato">+ Il primo cliente</button>'
      +     '<button class="btn add" data-action="new-prev">+ Il primo preventivo</button>'
      +   '</div>'
      + '</div>';
  }
