// [SPOSTATO] gest-ricerca.js: era dentro gest-core.js, righe 11292-11563, spostato identico.
  /* ============================================================
     LA RICERCA UNICA — 19 agosto 2026

     Il gestionale aveva una ricerca per sezione: quella dei lavori
     cercava solo nei lavori, quella dei clienti solo nei clienti. Per
     sapere tutto di «Verdi» bisognava aprire quattro sezioni e scrivere
     quattro volte la stessa parola. Qui si scrive una volta sola.

     ⚠️ CERCANDO UN CLIENTE DEVONO USCIRE ANCHE LE SUE COSE. Un lavoro
        di Verdi dentro non ha scritto «Verdi» da nessuna parte: ha solo
        il suo cliente_id. Per questo i clienti si cercano per primi, e
        i loro id fanno da secondo setaccio su lavori, preventivi e
        fatture. Senza questo passaggio la ricerca sembrerebbe funzionare
        (il cliente esce) ma darebbe zero lavori a chi ne ha venti.
     ⚠️ SI CERCA DENTRO IL REPARTO in cui si sta (mestiere_id), come fa
        ogni altra lettura del gestionale: se no da «Idraulica» uscirebbero
        i clienti di «Giardinaggio».
     ⚠️ LE RIGHE NEL CESTINO NON ESCONO: ci pensa js/cestino.js, che si
        mette in mezzo a ogni sb.from(). Qui non si fa niente di speciale
        proprio per non avere la regola in due posti.
     ⚠️ I DATI SI LEGGONO QUANDO SI ENTRA NELLA CASELLA, non a ogni
        lettera: se no ogni tasto sarebbero quattro interrogazioni al
        database. Si rileggono ogni volta che ci si rientra, cosi' una
        fattura appena creata c'e' gia'.
     ⚠️ PREVENTIVI E FATTURE NON SI APRONO DALLA CACHE della loro
        sezione: se non ci sei mai entrato quella cache e' vuota e il
        clic non farebbe niente, in silenzio. Si rileggono dal database
        riga per riga.
     ============================================================ */
  const CT_TETTO=2000;   /* righe per tabella al massimo */
  const CT_QUANTE=6;     /* quante se ne mostrano per gruppo */
  let ctDati=null, ctTimer=null, ctCaricando=false, ctTroncato=false, ctMancanti=[];

  const CT_CAMPI={
    /* 24 nov 2026 (studio, voce Clienti) — «cf» non esiste: la colonna e'
       cod_fiscale. Incollando il codice fiscale di un cliente non usciva niente.
       Anche CAP, provincia, codice destinatario e PEC, come l'elenco Clienti. */
    clienti:["nome","referente","telefono","email","citta","cap","prov","indirizzo","piva","cod_fiscale","sdi_codice","sdi_pec","note"],
    /* 19 nov 2026 (voce Pratiche) — anche il Comune e i catastali: un geometra
       cerca «foglio 12» o la particella, e non usciva niente */
    lavori:["descrizione","dove","note","lavoro_svolto","pratica_tipo","pratica_protocollo",
            "pratica_comune","catasto_foglio","catasto_particella","catasto_sub"],
    preventivi:["titolo","numero","oggetto","note"],
    fatture:["numero","oggetto","cli_nome","note"],
    /* 19 nov 2026 — anche i fornitori e le loro fatture da pagare (sì di Alex) */
    fornitori:["nome","categoria","telefono","email","indirizzo","piva","note"],
    fattforn:["numero","note"],
    /* 20 nov 2026 — i corsi dei crediti formativi (si' di Alex) */
    crediti:["titolo","ente","tipo","note","attestato_nome"],
    /* 20 nov 2026 — le persone (Collaboratori / Squadra), si' di Alex */
    persone:["nome","mansione","telefono","email"],
    /* 24 nov 2026 (giro dello studio) — anche scadenze e richieste dal sito */
    scadenze:["titolo","tipo","tipo_pratica","note"],
    richieste:["nome","descrizione","citta","categoria","prestazione","comune"],
    /* 25 nov 2026 (sì di Alex) — computi e acconti/SAL. Il SAL non ha testo
       suo: si cerca col numero, e col titolo/luogo/cliente del SUO computo */
    computi:["titolo","numero","oggetto","luogo","note"],
    sal:["note"]
  };
  const CT_ST_PREV={bozza:"Bozza",inviato:"Inviato",accettato:"Accettato",rifiutato:"Rifiutato"};
  const CT_ST_FATT={bozza:"Bozza",emessa:"Emessa",pagata:"Pagata",insoluta:"Insoluta",annullata:"Annullata"};

  function ctPiatto(t){
    return String(t==null?"":t).toLowerCase()
      .replace(/[àáâä]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i")
      .replace(/[òóôö]/g,"o").replace(/[ùúûü]/g,"u")
      /* 26 nov 2026 — «3337654321» deve trovare «333 7654321» (e il contrario):
         fra due cifre spazi, punti, trattini e barre non contano */
      .replace(/(\d)[\s.\-\/]+(?=\d)/g,"$1");
  }
  /* si mettono insieme solo i campi che la riga ha davvero: pratica_tipo
     esiste per gli studi tecnici e non per l'impresa edile, e chiedere un
     campo che non c'e' non deve far saltare niente */
  function ctTesto(riga,campi){
    let s="";
    for(let i=0;i<campi.length;i++){
      const v=riga[campi[i]];
      if(v!=null&&v!=="")s+=" "+v;
    }
    return ctPiatto(s);
  }
  async function ctCarica(){
    if(!sb||!sbUid)return "Non risulti collegato.";
    const mid=curMestiere();
    if(mid==null)return "Entra prima in un reparto.";
    const leggi=t=>sb.from(t).select("*").eq("user_id",sbUid).eq("mestiere_id",mid).limit(CT_TETTO);
    /* i corsi sono della PERSONA (niente reparto) e si cercano solo se la voce
       «Crediti formativi» c'e' nel menu */
    const _tbCr=document.querySelector("#tab-crediti");
    const _conCr=!!(_tbCr&&_tbCr.style.display!=="none");
    const [rc,rl,rp,rf,ro,rff,rcr,rop,rsc,rds,rco,rsa]=await Promise.all([
      /* 24 nov 2026 — i clienti senza reparto (quelli di prima dei reparti) stanno
         nell'elenco Clienti di ogni reparto: la ricerca in alto non li trovava */
      sb.from("gest_clienti").select("*").eq("user_id",sbUid).or("mestiere_id.eq."+mid+",mestiere_id.is.null").limit(CT_TETTO),
      leggi("gest_lavori"),leggi("gest_preventivi"),leggi("gest_fatture"),
      leggi("gest_fornitori"),leggi("gest_fatture_fornitori"),
      _conCr?sb.from("gest_crediti").select("*").eq("user_id",sbUid).limit(CT_TETTO):Promise.resolve({data:[]}),
      /* 20 nov 2026 — le persone del reparto (niente costi: si legge solo quello che si mostra) */
      sb.from("gest_operatori").select("id,nome,mansione,telefono,email").eq("user_id",sbUid).eq("mestiere_id",mid).limit(CT_TETTO),
      sb.from("gest_scadenze").select("*").eq("user_id",sbUid).eq("mestiere_id",mid).limit(CT_TETTO),
      (typeof dsCarica==="function")?Promise.resolve(dsCarica()).then(d=>({data:d||[]}),()=>({data:[]})):Promise.resolve({data:[]}),
      /* 25 nov 2026 — i computi del reparto e i SAL (tenuti solo se il loro
         computo è di questo reparto, come fa l'elenco degli acconti) */
      leggi("gest_computi"),
      sb.from("gest_sal").select("id,computo_id,numero,data,stato,note").eq("user_id",sbUid).limit(CT_TETTO)
    ]);
    /* ⚠️ UNA TABELLA CHE NON SI APRE NON DEVE SPEGNERE TUTTA LA RICERCA.
       Un collaboratore puo' avere il permesso sui lavori e non sulle fatture:
       col controllo unico («se c'e' un errore, mi fermo») a lui la ricerca non
       avrebbe funzionato mai, nemmeno sui clienti. Adesso esce quello che si
       riesce a leggere, e quello che manca SI DICE. */
    ctMancanti=[];
    const prendi=(r,come)=>{ if(r.error){ctMancanti.push(come);return [];} return r.data||[]; };
    ctDati={
      clienti:prendi(rc,"clienti"), lavori:prendi(rl,"lavori"),
      preventivi:prendi(rp,"preventivi"), fatture:prendi(rf,"fatture"),
      /* i fornitori sono in piu': se non si leggono la ricerca di prima resta com'era */
      fornitori:(ro&&!ro.error&&ro.data)||[], fattforn:(rff&&!rff.error&&rff.data)||[],
      crediti:(rcr&&!rcr.error&&rcr.data)||[],
      persone:(rop&&!rop.error&&rop.data)||[],
      scadenze:(rsc&&!rsc.error&&rsc.data)||[],
      richieste:(rds&&rds.data)||[],
      computi:(rco&&!rco.error&&rco.data)||[]
    };
    {
      const idComp={}; ctDati.computi.forEach(c=>{idComp[String(c.id)]=1;});
      ctDati.sal=((rsa&&!rsa.error&&rsa.data)||[]).filter(x=>idComp[String(x.computo_id)]);
    }
    /* «ds-apri» pesca dalla lista delle richieste: se non sei mai entrato lì è vuota */
    try{if(typeof dsCache!=="undefined"&&!dsCache.length&&ctDati.richieste.length)dsCache=ctDati.richieste;}catch(e){}
    ctTroncato=[rc,rl,rp,rf].some(r=>(r.data||[]).length>=CT_TETTO);
    if(ctMancanti.length===4)return "Non riesco a leggere i dati: "+(rc.error||rl.error||rp.error||rf.error).message;
    return null;
  }
  /* ⚠️ 19 agosto 2026 — PERCHE' IL CLIENTE SI ATTACCA ALLA RIGA, e non si
     fa «o il cliente o il testo».
     Il primo tentativo diceva: esce se la riga contiene le parole OPPURE se
     e' di un cliente trovato. Con una parola sola sembrava giusto. Con due
     no: scrivendo «verdi bagno» uscivano TUTTI i lavori di Verdi — la
     tinteggiatura delle scale compresa — perche' bastava che il cliente
     fosse quello, e «bagno» non lo guardava piu' nessuno.
     Adesso il nome (e i dati) del cliente si ATTACCANO al testo della riga,
     e poi si chiede che ci siano TUTTE le parole. «Verdi» da solo tira
     fuori tutto di Verdi; «verdi bagno» solo il bagno di Verdi. */
  /* 19 nov 2026 (voce Pratiche) — «foglio 12», «particella 345», «sub 2»:
     la parola davanti al numero si cerca anche lei */
  /* «foglio 12» diventa una parola sola «foglio:12;», cosi' non trova anche
     il foglio 120 (il «;» chiude il numero). Fg, mappale, part., subalterno
     valgono come foglio, particella, sub. */
  const CT_CAT_NOMI={foglio:"foglio",fg:"foglio",particella:"particella",part:"particella",mappale:"particella",map:"particella",sub:"sub",subalterno:"sub"};
  function ctCatasto(l){
    let s="";
    const v=x=>ctPiatto(String(x).trim()).replace(/\s+/g,"");
    if(l.catasto_foglio)s+=" foglio:"+v(l.catasto_foglio)+";";
    if(l.catasto_particella)s+=" particella:"+v(l.catasto_particella)+";";
    if(l.catasto_sub)s+=" sub:"+v(l.catasto_sub)+";";
    return s;
  }
  function ctCatastoDomanda(q){
    return q.replace(/(^|[^a-z0-9])(foglio|fg|particella|part|mappale|map|subalterno|sub)\.?\s*([a-z0-9]+)(?=$|[^a-z0-9])/g,
      function(m,pre,k,n){ return pre+CT_CAT_NOMI[k]+":"+n+";"; });
  }
  function ctTrova(q){
    if(!ctDati)return null;
    const parole=ctCatastoDomanda(ctPiatto(q)).split(/\s+/).filter(Boolean);
    if(!parole.length)return null;
    const dentro=testo=>parole.every(w=>testo.indexOf(w)>=0);
    const nomeCli={}, testoCli={};
    ctDati.clienti.forEach(c=>{
      nomeCli[String(c.id)]=c.nome||"";
      testoCli[String(c.id)]=ctTesto(c,CT_CAMPI.clienti);
    });
    /* la riga senza cliente non deve pescare il testo di nessuno: con
       cliente_id nullo si cerca solo dentro la riga */
    const suo=r=>(r.cliente_id!=null&&testoCli[String(r.cliente_id)])?(" "+testoCli[String(r.cliente_id)]):"";
    /* 20 nov 2026 — scrivendo il nome di una persona escono anche i lavori/le
       pratiche assegnati a lei (gest_lavori.operatore_id), come per il cliente */
    const nomeOp={};
    (ctDati.persone||[]).forEach(o=>{nomeOp[String(o.id)]=o.nome||"";});
    const compDi={};
    (ctDati.computi||[]).forEach(c=>{compDi[String(c.id)]=c;});
    const suaPers=l=>(l.operatore_id!=null&&nomeOp[String(l.operatore_id)])?(" "+ctPiatto(nomeOp[String(l.operatore_id)])):"";
    return {
      clienti:ctDati.clienti.filter(c=>dentro(ctTesto(c,CT_CAMPI.clienti))),
      lavori:ctDati.lavori.filter(l=>dentro(ctTesto(l,CT_CAMPI.lavori)+ctCatasto(l)+suo(l)+suaPers(l))),
      preventivi:ctDati.preventivi.filter(p=>dentro(ctTesto(p,CT_CAMPI.preventivi)+suo(p))),
      fatture:ctDati.fatture.filter(f=>dentro(ctTesto(f,CT_CAMPI.fatture)+suo(f))),
      fornitori:(ctDati.fornitori||[]).filter(o=>dentro(ctTesto(o,CT_CAMPI.fornitori))),
      /* la fattura da pagare esce anche scrivendo il nome del suo fornitore */
      fattforn:(ctDati.fattforn||[]).filter(x=>{
        const o=(ctDati.fornitori||[]).find(y=>String(y.id)===String(x.fornitore_id));
        return dentro(ctTesto(x,CT_CAMPI.fattforn)+(o?" "+ctPiatto(o.nome):""));
      }),
      crediti:(ctDati.crediti||[]).filter(c=>dentro(ctTesto(c,CT_CAMPI.crediti))),
      persone:(ctDati.persone||[]).filter(o=>dentro(ctTesto(o,CT_CAMPI.persone))),
      scadenze:(ctDati.scadenze||[]).filter(x=>dentro(ctTesto(x,CT_CAMPI.scadenze)+suo(x))),
      richieste:(ctDati.richieste||[]).filter(x=>dentro(ctTesto(x,CT_CAMPI.richieste))),
      computi:(ctDati.computi||[]).filter(c=>dentro(ctTesto(c,CT_CAMPI.computi)+suo(c))),
      /* il SAL esce col suo numero («acconto 2», «sal 2») e con tutto quello
         del suo computo: «bagno» tira fuori anche gli acconti del bagno */
      sal:(ctDati.sal||[]).filter(x=>{
        const c=compDi[String(x.computo_id)]||{};
        return dentro(" sal acconto stato avanzamento n."+(x.numero||"")+" "+(x.numero||"")+" "
          +ctTesto(x,CT_CAMPI.sal)+ctTesto(c,CT_CAMPI.computi)+suo(c));
      }),
      compDi:compDi,
      nomeCli:nomeCli, nomeOp:nomeOp
    };
  }
  /* ============================================================
     26 nov 2026 (giro nuovo, sessione 2) — «FORSE CERCAVI»
     Scrivendo «bianki» non usciva niente: un artigiano scrive come
     sente. Se non esce NIENTE, si cerca la parola piu' vicina fra i
     nomi che ci sono davvero (clienti, fornitori, squadra, citta',
     lavori, preventivi, computi): una o due lettere sbagliate, e
     k/ch, j/i, y/i, doppie. Si dice «Forse cercavi: Bianchi» e sotto
     escono gia' i risultati di Bianchi. Non si inventa niente: se
     anche la parola corretta non trova niente, non si propone.
     ============================================================ */
  function ctSuono(w){
    return w.replace(/ch/g,"c").replace(/gh/g,"g").replace(/k/g,"c").replace(/[jy]/g,"i")
      .replace(/w/g,"v").replace(/x/g,"cs").replace(/h/g,"").replace(/(.)\1+/g,"$1");
  }
  function ctDistanza(a,b,max){
    if(Math.abs(a.length-b.length)>max)return max+1;
    let p2=null,p=[];for(let j=0;j<=b.length;j++)p[j]=j;
    for(let i=1;i<=a.length;i++){
      const c=[i];let min=i;
      for(let j=1;j<=b.length;j++){
        let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
        if(p2&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,p2[j-2]+1);
        c[j]=v;if(v<min)min=v;
      }
      if(min>max)return max+1;
      p2=p;p=c;
    }
    return p[b.length];
  }
  function ctParole(){
    const v={};
    const metti=t=>{String(t||"").split(/[^A-Za-zÀ-ÿ0-9']+/).forEach(w=>{
      w=w.replace(/'/g,"");if(w.length<3||/^\d+$/.test(w))return;
      const k=ctPiatto(w);if(!v[k])v[k]=w;
    });};
    (ctDati.clienti||[]).forEach(c=>{metti(c.nome);metti(c.referente);metti(c.citta);});
    (ctDati.fornitori||[]).forEach(o=>metti(o.nome));
    (ctDati.persone||[]).forEach(o=>metti(o.nome));
    (ctDati.lavori||[]).forEach(l=>{metti(l.descrizione);metti(l.dove);});
    (ctDati.preventivi||[]).forEach(x=>metti(x.titolo));
    (ctDati.computi||[]).forEach(x=>metti(x.titolo));
    (ctDati.richieste||[]).forEach(x=>{metti(x.nome);metti(x.citta);});
    return v;
  }
  function ctForse(q){
    if(!ctDati)return null;
    const parole=ctPiatto(q).split(/\s+/).filter(Boolean);
    if(!parole.length)return null;
    const voc=ctParole(), chiavi=Object.keys(voc);
    let cambiata=false;
    const nuove=parole.map(w=>{
      if(w.length<4||/\d/.test(w)||voc[w])return {w:w,vis:voc[w]||w};
      const max=w.length<=5?1:2, sw=ctSuono(w);
      let meglio=null,dm=max+1;
      for(const k of chiavi){
        if(k.length<3)continue;
        let d=ctDistanza(w,k,max);
        const ds=ctDistanza(sw,ctSuono(k),max);
        if(ds<d)d=ds;
        if(d<dm||(d===dm&&meglio&&k.length<meglio.length)){dm=d;meglio=k;}
        if(dm===0)break;
      }
      if(meglio&&dm<=max&&meglio!==w){cambiata=true;return {w:meglio,vis:voc[meglio]};}
      return {w:w,vis:w};
    });
    if(!cambiata)return null;
    const q2=nuove.map(x=>x.vis).join(" ");
    return {q:q2,vis:q2};
  }
  function ctMeta(){
    const v=[];
    for(let i=0;i<arguments.length;i++){ const x=arguments[i]; if(x)v.push('<span>'+esc(x)+'</span>'); }
    return v.join("");
  }
  /* ⚠️ CLIENTE E LAVORO NON LI APRE QUESTA RICERCA: la riga porta con se'
     lo stesso data-action dei pulsanti che ci sono gia' («apri-cli»,
     «edit-job»), e li apre il gestore di sempre. Riscrivere qui come si
     apre un lavoro vorrebbe dire avere la stessa cosa in due posti, e il
     giorno che cambia una la si aggiorna in uno solo.
     Preventivo e fattura no: i loro pulsanti pescano dalla lista gia' a
     schermo, che e' vuota se in quella sezione non ci sei mai entrato. */
  function ctRiga(tipo,id,titolo,sotto){
    /* 19 nov 2026: «forn» apre la scheda del fornitore (forn-scheda la rilegge dal database) */
    /* 25 nov 2026 — «sal» porta nella sezione e apre quel SAL (fatt-vai-sal,
       lo stesso dell'avviso nella fattura). Il computo lo apre ctApriComp. */
    const AZ={cli:"apri-cli",lav:"edit-job",forn:"forn-scheda",cred:"edit-cred",pers:"sq-edit",scad:"edit-scad",ds:"ds-apri",sal:"fatt-vai-sal"};
    return '<button type="button" class="ct-riga" data-ct="'+esc(tipo)+'" data-id="'+esc(String(id))+'"'
      +(AZ[tipo]?' data-action="'+AZ[tipo]+'"':'')+'>'
      +'<span class="ct-t">'+esc(titolo)+'</span>'
      +(sotto?'<span class="ct-s">'+sotto+'</span>':'')+'</button>';
  }
  function ctBlocco(titolo,righe){
    if(!righe.length)return "";
    const piu=(righe.length>CT_QUANTE)
      ? '<div class="ct-piu">Ce ne sono '+righe.length+': scrivi una parola in più per restringere.</div>' : "";
    return '<div class="ct-gruppo"><div class="ct-cap">'+esc(titolo)+' <b>'+righe.length+'</b></div>'
      +righe.slice(0,CT_QUANTE).join("")+piu+'</div>';
  }
  function ctDisegna(q){
    const box=$("#ct-pop"); if(!box)return;
    const h=ctRisultati(q);
    if(h===null){box.innerHTML="";return;}
    if(h){box.innerHTML=h+ctNote();return;}
    /* niente: si prova la parola vicina */
    const f=ctForse(q), h2=f?ctRisultati(f.q):"";
    if(f&&h2){
      box.innerHTML='<div class="ct-forse">Non trovo «'+esc(q)+'». Forse cercavi: '
        +'<button type="button" class="ct-forse-b" data-ct-forse="'+esc(f.q)+'">'+esc(f.vis)+'</button></div>'+h2+ctNote();
      return;
    }
    box.innerHTML='<div class="ct-vuoto">Nessun risultato per «'+esc(q)+'».</div>'+ctNote();
  }
  function ctNote(){
    let h="";
    /* niente tagli silenziosi: se il conto e' arrivato al tetto, si dice */
    if(ctTroncato)h+='<div class="ct-piu">Hai più di '+CT_TETTO+' righe in una sezione: cerco dentro le prime '+CT_TETTO+'.</div>';
    /* e se una sezione non si è aperta, si dice pure: se no la ricerca
       direbbe «non c'è niente» di una cosa che non ha nemmeno guardato */
    if(ctMancanti.length)h+='<div class="ct-piu">Non riesco a leggere: '+esc(ctMancanti.join(", "))+'. Quello che c\'è lì dentro non esce.</div>';
    return h;
  }
  function ctRisultati(q){
    const r=ctTrova(q);
    if(!r)return null;
    const pro=(ruoloUtente==='professionista');
    const nome=id=>(id!=null&&r.nomeCli[String(id)])?r.nomeCli[String(id)]:"";
    let h="";
    h+=ctBlocco("Clienti", r.clienti.map(c=>
        ctRiga("cli",c.id,c.nome||"(cliente senza nome)",ctMeta(c.citta||"",c.telefono||""))));
    h+=ctBlocco(_lav(), r.lavori.map(l=>
        ctRiga("lav",l.id,l.descrizione||(pro?"Pratica":"Lavoro"),
          ctMeta(nome(l.cliente_id),l.dove||"",l.data_prevista?fdate(l.data_prevista):"",statoLabel[l.stato]||"",
            (l.operatore_id!=null&&r.nomeOp[String(l.operatore_id)])?("👤 "+r.nomeOp[String(l.operatore_id)]):""))));
    h+=ctBlocco("Preventivi", r.preventivi.map(p=>
        ctRiga("prev",p.id,p.titolo||"Preventivo",
          ctMeta(nome(p.cliente_id),CT_ST_PREV[p.stato]||p.stato||""))));
    /* «Fattura bozza senza numero» si leggeva male: una bozza si chiama
       «Bozza di fattura», come nel titolo del suo modulo */
    h+=ctBlocco("Fatture", r.fatture.map(f=>
        ctRiga("fatt",f.id,(f.numero?("Fattura "+fattNum(f)):"Bozza di fattura"),
          ctMeta(nome(f.cliente_id),CT_ST_FATT[f.stato]||f.stato||""))));
    /* 19 nov 2026 — fornitori e fatture da pagare. La fattura apre la scheda
       del SUO fornitore (li' c'e' la riga con «Pagata»): cosi' non si pesca
       da fattfCache, che e' vuota se in Fornitori non ci sei mai entrato. */
    const oggiCt=todayStr();
    const apertoDi=id=>(ctDati.fattforn||[]).filter(x=>String(x.fornitore_id)===String(id)&&x.stato!=="pagata").reduce((t,x)=>t+(+x.importo||0),0);
    h+=ctBlocco("Fornitori", r.fornitori.map(o=>{
        const ap=apertoDi(o.id);
        return ctRiga("forn",o.id,o.nome||"(fornitore senza nome)",ctMeta(o.categoria||"",o.telefono||"",ap>0?("da pagare "+eur(ap)):"niente da pagare"));
      }));
    h+=ctBlocco("Fatture da pagare", r.fattforn.filter(x=>x.fornitore_id!=null).map(x=>{
        const o=(ctDati.fornitori||[]).find(y=>String(y.id)===String(x.fornitore_id))||{};
        const pag=x.stato==="pagata";
        return ctRiga("forn",x.fornitore_id,(x.numero?("n. "+x.numero):"Fattura")+(o.nome?" — "+o.nome:""),
          ctMeta(eur(x.importo),pag?"pagata":(x.scadenza?((x.scadenza<oggiCt?"scaduta il ":"da pagare entro il ")+fdate(x.scadenza)):"senza scadenza")));
      }));
    /* 20 nov 2026 — le persone: la riga apre la sua scheda (sq-edit la rilegge dal database) */
    h+=ctBlocco(pro?"Collaboratori":"Squadra", r.persone.map(o=>
        ctRiga("pers",o.id,o.nome||"(senza nome)",ctMeta(o.mansione||"",o.telefono||""))));
    /* 24 nov 2026 — scadenze e richieste dal sito */
    h+=ctBlocco("Scadenze", r.scadenze.map(x=>
        ctRiga("scad",x.id,x.titolo||x.tipo||"Scadenza",
          ctMeta(nome(x.cliente_id),x.data_scadenza?fdate(x.data_scadenza):"",x.fatta?"fatta":""))));
    h+=ctBlocco("Richieste dal sito", r.richieste.map(x=>
        ctRiga("ds",x.id,x.nome||"Richiesta",
          ctMeta(typeof _dsCosa==="function"?_dsCosa(x):"",x.citta||"",x._stato==="nuova"?"da aprire":""))));
    /* 25 nov 2026 — computi e acconti/SAL */
    const _cmT=(typeof _cm==="function")?_cm("tanti"):"computi";
    h+=ctBlocco(_cmT.charAt(0).toUpperCase()+_cmT.slice(1), r.computi.map(c=>
        ctRiga("comp",c.id,(c.numero?("N. "+c.numero+" — "):"")+(c.titolo||"Computo"),
          ctMeta(nome(c.cliente_id),c.luogo||"",c.data?fdate(c.data):""))));
    h+=ctBlocco(pro?"Stati di avanzamento (SAL)":"Acconti (SAL)", r.sal.map(x=>{
        const c=r.compDi[String(x.computo_id)]||{};
        return ctRiga("sal",x.id,(pro?"SAL n. ":"Acconto n. ")+(x.numero||"—"),
          ctMeta(c.titolo||"",nome(c.cliente_id),x.data?fdate(x.data):"",x.stato==="emesso"?"emesso":"bozza"));
      }));
    h+=ctBlocco("Corsi (crediti formativi)", r.crediti.map(c=>
        ctRiga("cred",c.id,c.titolo||"Corso",
          ctMeta(c.ente||"",c.data?fdate(c.data):"",String(+c.crediti||0).replace(".",",")+" CFP",c.attestato_path?"📎 attestato":""))));
    return h;
  }
  /* ============================================================
     ⛔ 29 agosto 2026 — APRIRE UNA COSA DA FUORI (gradino 2 della chat)
     ============================================================
     La Chat con AI, quando nomina un lavoro o una fattura, mette sotto un
     pulsante «Aprilo». Ma la chat sta fuori da questa closure e da li'
     dentro non si vede niente.
     ⛔ E NON SI RISCRIVE COME SI APRE UNA COSA. E' la stessa regola gia'
     scritta venti righe piu' su per la ricerca in alto: cliente e lavoro
     si aprono col loro `data-action` di sempre («apri-cli», «edit-job»),
     preventivo e fattura con le due funzioni che la ricerca usa gia'.
     Riscrivere qui come si apre un lavoro vorrebbe dire avere la stessa
     cosa in tre posti.
     ⚠️ Il pulsante finto si attacca al body prima di premerlo: un
     elemento staccato non fa arrivare il clic al gestore che sta sul
     document, e non succederebbe niente.
     ⚠️ L'id arriva dalla chat, cioe' da una lettura gia' filtrata per
     utente e reparto — e ctApriPrev/ctApriFatt lo rileggono comunque con
     `.eq("user_id", sbUid)`. Due serrature, come sempre. */
  window.apriCosa=function(tipo,id){
    try{
      if(!id)return false;
      if(tipo==="prev"){ ctApriPrev(id); return true; }
      if(tipo==="fatt"){ ctApriFatt(id); return true; }
      if(tipo==="comp"){ ctApriComp(id); return true; }   /* 10 nov 2026 */
      /* 18 nov 2026: anche la scadenza (edit-scad la rilegge col proprio user_id) */
      const AZ={cli:"apri-cli",lav:"edit-job",scad:"edit-scad"};
      const a=AZ[tipo]; if(!a)return false;
      const b=document.createElement("button");
      b.type="button"; b.setAttribute("data-action",a); b.setAttribute("data-id",String(id));
      b.style.display="none";
      document.body.appendChild(b);
      b.click();
      b.remove();
      return true;
    }catch(_){ return false; }
  };
  function ctApri(){ const b=$("#ct-pop"); if(b)b.classList.add("aperta"); }
  function ctChiudi(){ const b=$("#ct-pop"); if(b){b.classList.remove("aperta");b.innerHTML="";} }
  function ctAzzera(){ const i=$("#ct-q"); if(i)i.value=""; ctChiudi(); }
  async function ctApriPrev(id){
    ctChiudi();
    const {data,error}=await sb.from("gest_preventivi").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(error){toast("Non riesco ad aprire il preventivo: "+error.message);return;}
    if(!data){toast("Questo preventivo non c'è più: forse è nel Cestino, o l'ha eliminato qualcun altro");return;}
    prevForm(data);
  }
  /* 10 nov 2026 — il computo si apre dalla SUA sezione: computoForm vuole la
     riga di compCache (quella del reparto aperto), non una letta a parte. */
  async function ctApriComp(id){
    ctChiudi();
    const voce=document.querySelector('nav.tabs button[data-tab="computi"]');
    if(voce&&!voce.classList.contains("active"))voce.click();
    await renderComputi();
    const c=(compCache||[]).find(x=>String(x.id)===String(id));
    if(!c){toast("Questo computo non c'è più in questo reparto: forse è nel Cestino");return;}
    computoForm(c);
  }
  async function ctApriFatt(id){
    ctChiudi();
    const {data,error}=await sb.from("gest_fatture").select("*").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(error){toast("Non riesco ad aprire la fattura: "+error.message);return;}
    if(!data){toast("Questa fattura non c'è più: forse è nel Cestino, o l'ha eliminata qualcun altro");return;}
    fattForm(data);
  }
  async function ctRicarica(){
    if(ctCaricando)return null;
    ctCaricando=true;
    const err=await ctCarica();
    ctCaricando=false;
    if(err)ctDati=null;
    return err;
  }
  function ctMostraErrore(msg){
    const b=$("#ct-pop"); if(!b)return;
    b.innerHTML='<div class="ct-vuoto">'+esc(msg)+'</div>';
    ctApri();
  }
  function ctInit(){
    const inp=$("#ct-q"); if(!inp)return;
    /* entrando nella casella i dati si rileggono: una fattura fatta due
       minuti fa deve uscire, se no la ricerca dice il falso */
    inp.addEventListener("focus",async function(){
      const err=await ctRicarica();
      const v=inp.value.trim();
      if(err){ if(v.length>=2)ctMostraErrore(err); return; }
      if(v.length>=2){ ctDisegna(v); ctApri(); }
    });
    inp.addEventListener("input",function(){
      clearTimeout(ctTimer);
      const v=inp.value.trim();
      if(v.length<2){ ctChiudi(); return; }
      ctTimer=setTimeout(async function(){
        if(!ctDati){ const err=await ctRicarica(); if(err){ctMostraErrore(err);return;} }
        const q=inp.value.trim();
        if(q.length<2){ ctChiudi(); return; }
        ctDisegna(q); ctApri();
      },220);
    });
    inp.addEventListener("keydown",function(e){
      if(e.key==="Escape"){ ctAzzera(); inp.blur(); }
    });
    const x=$("#ct-x"); if(x)x.addEventListener("click",function(){ ctAzzera(); inp.focus(); });
    /* fuori dalla casella si chiude; dentro no, se no il clic sul risultato
       lo chiuderebbe prima di arrivarci */
    document.addEventListener("click",function(e){
      if(!e.target.closest("#ct-barra"))ctChiudi();
    });
    /* 26 nov 2026 — «Forse cercavi: Bianchi»: il clic mette la parola giusta nella casella */
    document.addEventListener("click",function(e){
      const f=e.target.closest(".ct-forse-b"); if(!f)return;
      inp.value=f.dataset.ctForse||""; ctDisegna(inp.value.trim()); ctApri();
    });
    document.addEventListener("click",function(e){
      const r=e.target.closest(".ct-riga"); if(!r)return;
      const tipo=r.dataset.ct, id=r.dataset.id;
      if(tipo==="prev"){ ctApriPrev(id); return; }
      if(tipo==="fatt"){ ctApriFatt(id); return; }
      if(tipo==="comp"){ ctApriComp(id); return; }
      /* cliente e lavoro: li apre il data-action che la riga porta con se',
         qui si chiude soltanto la tendina */
      ctChiudi();
    });
  }
  ctInit();

