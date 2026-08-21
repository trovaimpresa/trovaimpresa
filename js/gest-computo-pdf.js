
  /* ============================================================
     IL PDF DEL COMPUTO METRICO
     ============================================================
     E' il motivo per cui un computo esiste: si consegna. Al committente, al
     Comune, all'impresa che deve fare il prezzo. Finche' restava chiuso dentro
     lo schermo, un tecnico lo guardava e chiudeva la scheda.

     La differenza con un preventivo e' tutta qui: un preventivo dice "20,46 m2
     a 18,50". Un computo deve far vedere COME sono venuti fuori quei 20,46 —
     riga per riga, coi vuoti sottratti. Chi lo riceve deve poter rifare il
     conto con la calcolatrice, se no non se lo fida.

     Le lettere fuori dal Latin-1 (l'euro, il meno lungo, gli apici storti)
     jsPDF con l'helvetica non le sa scrivere ed escono quadratini: per questo
     si legge "EUR" e non il simbolo, e i meno sono trattini normali. */
  /* ============================================================
     IL PREZZO SCRITTO IN LETTERE — 18 agosto 2026

     Sulla lista di gara ogni prezzo va scritto due volte: in cifre e in
     lettere. Se le due non combaciano, in gara vale QUELLA IN LETTERE —
     quindi qui uno zero di troppo non e' un dettaglio grafico, e' un
     prezzo diverso.

     Si scrive come si scrive in Italia: tutto attaccato, e i centesimi
     dopo la barra. «18,50» -> «diciotto/50». «1.234,00» -> «milleduecento-
     trentaquattro/00».
     ============================================================ */
  const _LU=["zero","uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci",
    "undici","dodici","tredici","quattordici","quindici","sedici","diciassette","diciotto","diciannove"];
  const _LD=["","","venti","trenta","quaranta","cinquanta","sessanta","settanta","ottanta","novanta"];

  function _lettereFino999(n){
    if(n===0) return "";
    if(n<20) return _LU[n];
    if(n<100){
      const d=Math.floor(n/10), u=n%10;
      let s=_LD[d];
      /* «ventuno», non «ventiuno»; «ventotto», non «ventiotto» */
      if(u===1||u===8) s=s.slice(0,-1);
      return s+(u?_LU[u]:"");
    }
    const c=Math.floor(n/100), r=n%100;
    let cento=(c===1?"cento":_LU[c]+"cento");
    const resto=_lettereFino999(r);
    /* «centotto», non «centootto»; «centottanta», non «centoottanta».
       La o finale di cento cade davanti a una parola che comincia per o. */
    if(resto.charAt(0)==="o") cento=cento.slice(0,-1);
    return cento+resto;
  }
  function _lettereIntero(n){
    n=Math.floor(Math.abs(n));
    if(n===0) return "zero";
    if(n>=1e9) return String(n);          /* oltre il miliardo non serve a nessuno */
    let out="";
    const mil=Math.floor(n/1e6), mila=Math.floor((n%1e6)/1000), resto=n%1000;
    if(mil) out+=(mil===1?"unmilione":_lettereIntero(mil)+"milioni");
    if(mila) out+=(mila===1?"mille":_lettereIntero(mila)+"mila");
    if(resto) out+=_lettereFino999(resto);
    return out;
  }
  /* «18,50» -> «diciotto/50» — come lo scrivono i computi di gara */
  function prezzoInLettere(v){
    const n=Math.round((+v||0)*100);
    const seg=n<0?"meno ":"";
    const a=Math.abs(n);
    const euro=Math.floor(a/100), cent=a%100;
    return seg+_lettereIntero(euro)+"/"+String(cent).padStart(2,"0");
  }
  /* per il totale: «diconsi euro ...» tutto a parole, centesimi compresi */
  function euroInLettere(v){
    const n=Math.round((+v||0)*100), a=Math.abs(n);
    const euro=Math.floor(a/100), cent=a%100;
    return (n<0?"meno ":"")+_lettereIntero(euro)+"/"+String(cent).padStart(2,"0");
  }

  /* ============================================================
     LA LISTA PER LA GARA — 18 agosto 2026

     Un computo, DUE STAMPE. Non due computi.
       · «Scarica il PDF» = il Computo Metrico Estimativo, con le misure:
         dice da dove viene ogni quantita'. E' il documento tuo e del
         cliente.
       · «Lista per la gara» = quello che si consegna alla stazione
         appaltante: le misure NON ci vanno (le ha gia' fatte il
         progettista), e ogni prezzo va scritto due volte, in cifre e in
         lettere.

     ⚠️ Gli stessi identici dati. Due computi separati vorrebbero dire
        tenerli allineati a mano, e il giorno che cambi una misura ne
        aggiorni uno solo — e' la trappola delle due copie.
     ⚠️ In gara, se cifre e lettere non combaciano, vale QUELLA IN
        LETTERE. Percio' il numero in lettere non e' un abbellimento:
        e' il prezzo. Si scrive da `prezzoInLettere`, che ha il suo banco.
     ⚠️ Ribasso, oneri di sicurezza aziendali e costi della manodopera
        restano RIGHE VUOTE da riempire a penna, come nel modello vero:
        sono dichiarazioni dell'impresa, non numeri che decide un
        programma.
     ============================================================ */
  /* ============================================================
     IMPORTARE LE LAVORAZIONI IN UN COMPUTO — 18 agosto 2026

     Quando il computo te lo manda gia' fatto un progettista, le voci sono
     ottanta e riscriverle a mano e' una serata buttata.

     ⚠️ Entrano tutte come «A CORPO» (`quantita_manuale = true`), ed e' la
        scelta giusta: in un computo di qualcun altro la quantita' e' GIA'
        FATTA, le misure che la producono non ce le hai. Se entrassero come
        «dalle misure», ognuna varrebbe ZERO e il preventivo le lascerebbe
        fuori tutte — cioe' l'importazione sembrerebbe riuscita e il
        documento uscirebbe vuoto.
     ⚠️ Le voci si AGGIUNGONO in fondo, non sostituiscono niente. Un file
        caricato due volte fa le voci doppie: meglio doppie e visibili che
        una cancellazione che non hai chiesto.
     ⚠️ Il prezzo puo' mancare: sulla lista di gara e' vuoto apposta, lo
        scrivi tu dopo. Ma quante ne sono arrivate senza prezzo si DICE,
        se no ti ritrovi un computo che vale zero e non sai perche'.
     ============================================================ */
  const COMP_IMP_MAX=2000;
  function compApriFile(){
    const f=$("#comp-file"); if(!f) return;
    f.value="";
    /* ⚠️ 20 agosto 2026 — due strade, una porta sola. Il geometra manda
       l'Excel o il PDF, e chi carica non deve sapere la differenza: la
       riconosce il gestionale dal nome del file. */
    f.onchange=function(){
      const file=f.files&&f.files[0]; if(!file)return;
      if(/\.pdf$/i.test(file.name||"")) compImportaPdf(file);
      else compImporta(file);
    };
    f.click();
  }
  async function compImporta(file){
    if(!sbUid){toast("Devi essere loggato");return;}
    const cid=compVociCompId;
    if(!cid){toast("Salva prima il computo, poi importa le lavorazioni");return;}
    toast("Sto leggendo "+file.name+"…");
    if(!(await caricaXLSX())){toast("Non riesco a scaricare il modulo per leggere i file Excel: controlla la connessione e riprova");return;}
    let righe;
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(new Uint8Array(buf),{type:"array"});
      righe=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:""});
    }catch(e){
      toast("Non riesco ad aprire il file: "+((e&&e.message)||e)+". Se è un CSV, riaprilo con Excel e salvalo come .xlsx.");
      return;
    }
    if(!righe||!righe.length){toast("Il file è vuoto.");return;}

    let iInt=-1;
    for(let i=0;i<Math.min(righe.length,30);i++){
      if((righe[i]||[]).some(c=>/descriz|lavoraz|denominaz/i.test(String(c||"")))){iInt=i;break;}
    }
    if(iInt<0){
      toast("Il file non ha una riga di intestazione. Ci vuole una riga con scritto Descrizione (e possibilmente Codice, U.M., Quantità, Prezzo).");
      return;
    }
    const C=_pzCol(righe[iInt]);
    if(C.descrizione==null){toast("Non trovo la colonna della descrizione.");return;}
    /* ⚠️ senza la quantita' non si importa NIENTE: entrerebbero ottanta voci
       tutte a zero, e sembrerebbe che l'importazione sia andata bene. */
    if(C.quantita==null){
      toast("Non trovo la colonna della quantità. Nel file ci vuole una colonna con scritto «Quantità»: senza, le lavorazioni entrerebbero tutte a zero.");
      return;
    }

    const dati=righe.slice(iInt+1);
    const voci=[]; let saltate=0, senzaPrezzo=0, senzaQta=0;
    dati.slice(0,COMP_IMP_MAX).forEach(function(r){
      const desc=String(r[C.descrizione]!=null?r[C.descrizione]:"").replace(/\s+/g," ").trim();
      if(!desc||desc.length<3){saltate++;return;}
      const q=_pzNum(r[C.quantita]);
      const p=(C.prezzo!=null)?_pzNum(r[C.prezzo]):null;
      /* ⚠️ 18 agosto 2026 — UNA RIGA SENZA QUANTITA' NON E' UNA LAVORAZIONE.
         In fondo a un file ci sono quasi sempre «TOTALE», «Ribasso %»,
         «Oneri di sicurezza»: hanno la descrizione e basta. Prima entravano
         come lavorazioni da zero, e il computo si ritrovava quattro voci
         finte in fondo che il preventivo poi buttava fuori in silenzio.
         Adesso si saltano, e quante se ne saltano si DICE. */
      if(q==null||!isFinite(q)){ senzaQta++; return; }
      if(!p) senzaPrezzo++;
      voci.push({
        codice:(C.codice!=null?String(r[C.codice]||"").trim():"")||null,
        descrizione:desc,
        unita:(C.unita!=null?String(r[C.unita]||"").trim():"")||null,
        quantita_manuale:true,
        quantita:(q!=null&&isFinite(q))?q:0,
        prezzo_unitario:p||0
      });
    });
    if(!voci.length){toast("Nel file non ho trovato nessuna lavorazione con una descrizione. Righe lette: "+dati.length+".");return;}

    const avvisi=[];
    if(senzaQta) avvisi.push(senzaQta+(senzaQta===1
        ? " riga saltata perché senza quantità (di solito è il totale in fondo)"
        : " righe saltate perché senza quantità (di solito sono i totali in fondo)"));
    if(senzaPrezzo) avvisi.push(senzaPrezzo+(senzaPrezzo===1?" senza prezzo":" senza prezzo"));
    if(saltate) avvisi.push(saltate+(saltate===1?" riga saltata perché senza descrizione":" righe saltate perché senza descrizione"));
    if(!gconfirm("Sto per aggiungere "+voci.length+(voci.length===1?" lavorazione":" lavorazioni")+" a questo computo.\n\n"
      +"Entrano come «A corpo»: la quantità è quella del file, le misure non ci sono.\n"
      +(avvisi.length?("\n⚠ "+avvisi.join("\n⚠ ")+"\n"):"")
      +"\nLe aggiungo in fondo a quelle che ci sono già. Vado?")) { toast("Importazione annullata"); return; }

    const messe=await _compScriviVoci(cid,voci);
    if(messe==null)return;
    toast(messe+(messe===1?" lavorazione importata ✔":" lavorazioni importate ✔")
          +(senzaPrezzo?("  ·  "+senzaPrezzo+" senza prezzo: scrivilo tu"):""));
  }

  /* ⚠️ 20 agosto 2026 — LA SCRITTURA STA IN UN POSTO SOLO.
     Da oggi le lavorazioni entrano da DUE porte, l'Excel e il PDF. Il modo di
     scriverle nel database (l'ordine che riprende da dove eravamo, i blocchi
     da 200, cosa si dice se il database si ferma a meta') deve restare uno:
     una regola che sta in due posti non si sistema a meta'.
     Torna quante ne ha scritte, oppure null se si e' fermata. */
  async function _compScriviVoci(cid,voci){
    /* si parte dopo l'ultima voce che c'e' gia', se no l'ordine si accavalla */
    let ordine=(compVociCache||[]).reduce(function(m,v){return Math.max(m,+v.ordine||0);},0)+1;
    const righeDb=voci.map(function(v,i){
      return Object.assign({}, v, {user_id:sbUid, computo_id:cid, ordine:ordine+i});
    });
    /* a blocchi di 200, come fa l'importazione del prezzario: un pacchetto
       solo da mille righe il database lo rifiuta */
    let messe=0;
    for(let i=0;i<righeDb.length;i+=200){
      const {error}=await sb.from("gest_computo_voci").insert(righeDb.slice(i,i+200)).select("id");
      if(error){
        toast("Errore dopo "+messe+(messe===1?" lavorazione":" lavorazioni")+": "+error.message
              +(messe?" — quelle già entrate restano, ricarica e riprova con le altre.":""));
        await renderCompVoci(cid);
        return null;
      }
      messe+=Math.min(200,righeDb.length-i);
    }
    await renderCompVoci(cid);
    return messe;
  }

  /* ============================================================
     20 agosto 2026 — IL COMPUTO CHE ARRIVA IN PDF
     ============================================================
     Chiesto da Alessio: «a volte il geometra ci consegna il computo senza
     prezzi e il preventivo ce lo dobbiamo fare noi sul suo computo».
     L'Excel si leggeva gia' dal 18 agosto. Questo legge il PDF.

     ⛔ NON SI FIDA DI UN MODELLO. Un computo italiano lo stampano PriMus,
     STR, Blumatica e questo gestionale, e ognuno lo impagina a modo suo: un
     lettore costruito sulle colonne di PriMus non leggerebbe il primo foglio
     stampato da un altro programma. Si fida invece di UNA COSA SOLA, che c'e'
     in tutti perche' e' come si scrive un computo in italiano:

         SOMMANO... mq 174,06                  (PriMus)
         Sommano mq 20,460 € 18,50 € 378,51    (questo gestionale)

     La riga «Sommano» CHIUDE una lavorazione e porta con se' unita' di misura
     e quantita'. Quello che sta sopra, fino alla lavorazione prima, e' la
     descrizione.

     ⛔ NIENTE ENTRA SENZA CHE ALESSIO L'ABBIA GUARDATO. Il PDF non e' un
     Excel: qui si legge un foglio STAMPATO, e se sbaglio una cifra — 20,46
     che diventa 2046 — il preventivo che l'impresa manda al cliente e'
     sbagliato e ci rimette lei. Percio' si apre sempre la schermata di
     conferma, con accanto a ogni riga IL PEZZO DI FOGLIO da cui l'ho preso.

     ⚠️ TRE COSE CHE AVREI SBAGLIATO SENZA I FOGLI VERI DI ALESSIO:
     1. il foglio di PriMus e' orizzontale, ma dentro il PDF e' una pagina
        verticale girata di 90 gradi: senza Util.transform si leggevano ZERO
        righe su un foglio pieno;
     2. PriMus scrive le migliaia con l'apostrofo tipografico: «mq 1´344,00»;
     3. mi ero fatto un elenco mio delle unita' di misura (mq, mc, cad...) e
        il foglio vero aveva «ton» e «cadauno»: cinque lavorazioni su
        ottantasette scartate in silenzio.
     Il banco sta in prove/: legge i due PDF veri e controlla che le tariffe
     in comune diano le STESSE quantita' nei due fogli.
     ============================================================ */

  /* ⛔ SOTTO QUESTE LETTERE, IL PDF E' UNA FOTOGRAFIA. Un foglio scritto da
     un programma ne ha decine di migliaia; una scansione ne ha zero. Sta qui
     e non dentro compImportaPdf perche' il banco possa provarla davvero. */
  const CP_MIN_LETTERE=80;
  let _pdfProm2=null;
  const CP_PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const CP_PDFJS_W="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  function caricaPdfJs(){
    if(window.pdfjsLib)return Promise.resolve(true);
    if(!_pdfProm2)_pdfProm2=_caricaScript(CP_PDFJS).then(function(ok){
      /* ⚠️ «il file e' arrivato» non vuol dire «la libreria c'e'». Se arriva
         una pagina di errore, o un file vuoto, lo script si carica lo stesso e
         window.pdfjsLib resta vuoto: senza questo controllo l'utente si
         beccava «Cannot read properties of undefined», che non vuol dire
         niente. Trovato dal banco nel browser. */
      if(!ok||!window.pdfjsLib||!window.pdfjsLib.getDocument){_pdfProm2=null;return false;}
      try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc=CP_PDFJS_W; }catch(e){}
      return true;
    });
    return _pdfProm2;
  }

  /* --- numeri all'italiana: 1.234,56 · e l'apostrofo di PriMus: 1´344,00 --- */
  function _cpNum(s){
    if(s==null)return null;
    let t=String(s).trim().replace(/[€\s´’′']/g,"");
    if(!t)return null;
    if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t=t.replace(/\./g,"").replace(",",".");
    else if(/^-?\d+,\d+$/.test(t)) t=t.replace(",",".");
    else if(/^-?\d+(\.\d+)?$/.test(t)) { /* gia' all'inglese */ }
    else return null;
    const n=parseFloat(t);
    return isFinite(n)?n:null;
  }
  const _cpEDec = s => /^-?\d{1,3}(\.\d{3})*,\d+$/.test(String(s).trim());

  /* ⚠️ NIENTE ELENCO DI UNITA' SCRITTO DA ME: non puo' prevedere quello che
     scrive un geometra. Dopo «Sommano» viene una parola corta di lettere e
     SUBITO DOPO un numero — «Sommano il capitolo € 378,51» non passa perche'
     dopo «il» non c'e' un numero ma «capitolo». */
  function _cpUnita(s){
    const t=String(s||"").trim().toLowerCase().replace(/[.…]+$/,"");
    if(!t||t.length>10)return false;
    return /^[a-zà-ù%²³0-9\/]+$/i.test(t) && /[a-zà-ù%²³]/i.test(t);
  }

  function _cpRighe(parole){
    const R=[];
    parole.slice().sort((a,b)=>(a.y-b.y)||(a.x-b.x)).forEach(p=>{
      const u=R[R.length-1];
      if(u&&Math.abs(u.y-p.y)<=2.2){u.parole.push(p);u.y=(u.y+p.y)/2;}
      else R.push({y:p.y,parole:[p]});
    });
    R.forEach(r=>{
      r.parole.sort((a,b)=>a.x-b.x);
      r.testo=r.parole.map(p=>p.t).join(" ").replace(/\s+/g," ").trim();
    });
    return R;
  }

  /* l'intestazione e il piede: le righe che si ripetono uguali su quasi tutte
     le pagine. Non un elenco di frasi scritto da me — quello varrebbe solo
     per PriMus. */
  function _cpTeste(pagine){
    const conta={};
    pagine.forEach(p=>{
      const bordo=p.righe.filter(r=>r.y<p.altezza*0.28||r.y>p.altezza*0.90);
      const viste={};
      bordo.forEach(r=>{
        const k=r.testo.replace(/\d+/g,"#").toLowerCase();
        if(k.length>3&&!viste[k]){viste[k]=1;conta[k]=(conta[k]||0)+1;}
      });
    });
    const soglia=Math.max(3,Math.ceil(pagine.length*0.6));
    const teste={};
    Object.keys(conta).forEach(k=>{ if(conta[k]>=soglia)teste[k]=1; });
    return teste;
  }

  /* dove comincia la colonna della descrizione: la x da cui parte la maggior
     parte del testo lungo. A sinistra ci sono il numero e il codice. */
  function _cpXDesc(righe){
    const conta={};
    righe.forEach(r=>{
      if(r.parole.length<4)return;
      const lettere=r.parole.filter(p=>/[a-zà-ù]{3}/i.test(p.t)).length;
      if(lettere<3)return;
      const prima=r.parole.find(p=>/[a-zà-ù]{3}/i.test(p.t));
      if(!prima)return;
      const k=Math.round(prima.x/3)*3;
      conta[k]=(conta[k]||0)+lettere;
    });
    let best=0,bestN=-1;
    Object.keys(conta).forEach(k=>{ if(conta[k]>bestN){bestN=conta[k];best=+k;} });
    return best;
  }

  function _cpSommano(r){
    const P=r.parole;
    const i=P.findIndex(p=>/^sommano/i.test(p.t.replace(/[.…]+$/,"")));
    if(i<0)return null;
    const dopo=P.slice(i+1).map(p=>p.t).filter(t=>t!=="€"&&t!=="");
    if(!dopo.length)return null;
    if(!_cpUnita(dopo[0]))return null;
    const q=_cpNum(dopo[1]);
    if(q===null)return null;
    return {unita:dopo[0].replace(/[.…]+$/,""), quantita:q,
            prezzo:dopo.length>2?_cpNum(dopo[2]):null, originale:r.testo};
  }

  /* la riga delle misure — «tramezzo cucina 2 3,20 2,70 17,280» — non e'
     descrizione, e' il conto della quantita'.
     ⚠️ La prima versione bastava che ci fossero due numeri e buttava via
     descrizioni vere: su PriMus «8 pedate di larghezza cm 60» spariva.
     Servono DUE cose insieme: numeri scritti con la virgola (una misura, non
     «cm 60») E incolonnati a destra, dove stanno le colonne delle dimensioni. */
  function _cpMisure(r,xDesc){
    const dec=r.parole.filter(p=>_cpEDec(p.t));
    if(dec.length<2)return false;
    return dec.filter(p=>p.x>xDesc+120).length>=2;
  }

  function _cpLeggi(pagine){
    const teste=_cpTeste(pagine);
    const tutte=[];
    pagine.forEach(p=>p.righe.forEach(r=>{
      const k=r.testo.replace(/\d+/g,"#").toLowerCase();
      if((r.y<p.altezza*0.28||r.y>p.altezza*0.90)&&teste[k])return;
      if(!r.testo)return;
      tutte.push(r);
    }));
    const xDesc=_cpXDesc(tutte), xSin=xDesc-4;

    const voci=[]; let corr=null, ultimoN=0;
    const nuova=()=>({numero:null,tariffa:[],desc:[],originali:[]});

    /* ⚠️ COME SI RICONOSCE IL NUMERO DELLA LAVORAZIONE. «Il primo intero nella
       colonna di sinistra» ne perdeva cinque su ottantasette: quella colonna e'
       stretta e i codici lunghi ci vanno a capo dentro, quindi ci si trovano
       pezzi come «0» o «2», che sono la coda di S01.01.001.10 e S01.01.002.42.
       La regola vera non dipende dall'impaginazione: I NUMERI SALGONO. */
    /* ⚠️ ONESTA': QUESTA REGOLA IL BANCO NON RIESCE A PROVARLA.
       Sabotandola (facendo passare qualunque intero) le prove restano verdi,
       perche' sui DUE fogli veri che ho la protegge gia' l'altra regola qui
       sotto (numero + testo accanto). Resta scritta perche' serve al caso in
       cui un pezzo di codice andato a capo finisca su una riga che ha ANCHE
       la descrizione — non l'ho visto succedere, e non posso dire che sia
       provata. Se un giorno arriva un foglio che la fa scattare, si vedra'.
       ⛔ Non si scrive «provata» quello che il banco non fa diventare rosso. */
    function eNumLav(t){
      if(!/^\d{1,4}$/.test(t))return false;
      const n=+t;
      return n>ultimoN && n<=ultimoN+50;
    }
    function chiudi(v,som,testo){
      v.originali.push(testo);
      if(v.numero!==null)ultimoN=v.numero;
      voci.push({numero:v.numero, tariffa:v.tariffa.join("").trim()||null,
        descrizione:v.desc.join(" ").replace(/\s+/g," ").trim(),
        unita:som.unita, quantita:som.quantita, prezzo:som.prezzo,
        originali:v.originali.concat()});
    }

    tutte.forEach(r=>{
      const sin=r.parole.filter(p=>p.x<xSin);
      const des=r.parole.filter(p=>p.x>=xSin);
      const som=_cpSommano(r);

      if(som){
        const v=corr||nuova();
        /* il codice PUO' FINIRE SULLA RIGA DEL «SOMMANO»: la colonna e'
           stretta e i codici lunghi ci vanno a capo */
        sin.forEach(p=>v.tariffa.push(p.t));
        chiudi(v,som,r.testo);
        corr=null;
        return;
      }

      /* una riga fatta SOLO di colonna di sinistra, subito dopo una
         lavorazione chiusa, e' la coda del codice di QUELLA */
      if(!corr&&!des.length&&sin.length&&voci.length){
        const pezzo=sin.map(p=>p.t).join("");
        if(sin.length<=2&&/^[0-9A-Za-z.\-\/]{1,12}$/.test(pezzo)&&/\d/.test(pezzo)){
          const u=voci[voci.length-1];
          if(u.tariffa)u.tariffa=(u.tariffa+pezzo).trim();
        }
        return;
      }

      /* ⛔ QUI COMINCIA UNA LAVORAZIONE, e solo qui: un numero che sale nella
         colonna stretta E del testo accanto. Serve a tenere fuori la carta
         intestata: il «5» di «Via Dante Alighieri, 5» era diventato il numero
         della lavorazione n. 1, e da li' in poi il 2, il 3 e il 4 venivano
         scartati perche' «non salivano». */
      const numLav=sin.find(p=>eNumLav(p.t));
      if(numLav&&des.length){
        corr=nuova(); corr.numero=+numLav.t;
        sin.forEach(p=>{ if(p!==numLav)corr.tariffa.push(p.t); });
        if(!_cpMisure(r,xDesc))corr.desc.push(des.map(p=>p.t).join(" "));
        corr.originali.push(r.testo);
        return;
      }

      /* fuori da una lavorazione non si raccoglie niente: carta intestata,
         titoli dei capitoli e righe di riporto restano fuori */
      if(!corr)return;

      sin.forEach(p=>corr.tariffa.push(p.t));
      if(des.length&&!_cpMisure(r,xDesc))corr.desc.push(des.map(p=>p.t).join(" "));
      corr.originali.push(r.testo);
    });
    return {voci:voci, xDesc:xDesc};
  }

  /* --- le parole di un PDF, pagina per pagina --- */
  async function _cpParole(file){
    const buf=await file.arrayBuffer();
    const doc=await window.pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;
    const pagine=[];
    let lettere=0;
    for(let i=1;i<=doc.numPages;i++){
      const p=await doc.getPage(i);
      const vp=p.getViewport({scale:1});
      const c=await p.getTextContent();
      const parole=[];
      c.items.forEach(function(it){
        const t=(it.str||"").trim(); if(!t)return;
        lettere+=t.length;
        /* ⚠️ LA PAGINA PUO' ESSERE GIRATA. Il foglio di PriMus e' orizzontale,
           e dentro il PDF e' una pagina verticale con «/Rotate 90»: prendendo
           it.transform cosi' com'e', la prima riga finiva a y = -221 e il
           lettore non trovava piu' niente. Util.transform applica la rotazione
           e mette la y che cresce verso il basso, come si legge. */
        const tx=window.pdfjsLib.Util.transform(vp.transform,it.transform);
        const parti=t.split(/\s+/).filter(Boolean);
        const larg=it.width||0;
        let acc=0;
        parti.forEach(function(w){
          const q=larg*(w.length/Math.max(t.replace(/\s/g,"").length,1));
          parole.push({t:w,x:tx[4]+acc,y:tx[5]});
          acc+=q+larg*0.02;
        });
      });
      pagine.push({altezza:vp.height,larghezza:vp.width,righe:_cpRighe(parole)});
    }
    return {pagine:pagine, lettere:lettere, quante:doc.numPages};
  }

  let cpLette=null;

  async function compImportaPdf(file){
    if(!sbUid){toast("Devi essere loggato");return;}
    const cid=compVociCompId;
    if(!cid){toast("Salva prima il computo, poi carica il foglio del geometra");return;}
    toast("Sto leggendo "+file.name+"…");
    if(!(await caricaPdfJs())){toast("Non riesco a scaricare il modulo per leggere i PDF: controlla la connessione e riprova");return;}

    let letto;
    try{ letto=await _cpParole(file); }
    catch(e){ toast("Non riesco ad aprire il PDF: "+((e&&e.message)||e)); return; }

    /* ⚠️ UNA SCANSIONE NON E' UN PDF DA LEGGERE: e' una fotografia. Dentro non
       c'e' nessuna lettera, e inventarsi i numeri sarebbe la cosa peggiore che
       posso fare. Lo si dice, e si dice anche cosa fare. */
    if(letto.lettere<CP_MIN_LETTERE){
      toast("Questo PDF non ha testo dentro: è la fotografia (o la scansione) di un foglio. Non posso leggerne i numeri senza inventarmeli. Chiedi al geometra il file originale, in PDF o in Excel.");
      return;
    }

    const r=_cpLeggi(letto.pagine);
    if(!r.voci.length){
      toast("Nel PDF non ho trovato nessuna riga «Sommano»: è quella che chiude una lavorazione e porta la quantità. Se il foglio è fatto in un altro modo, mandami il file e lo faccio leggere.");
      return;
    }
    cpLette={cid:cid, nome:file.name, voci:r.voci, pagine:letto.quante};
    compPdfConferma();
  }

  /* ---- la schermata di conferma: NIENTE entra senza passare da qui ---- */
  function compPdfConferma(){
    if(!cpLette)return;
    const V=cpLette.voci;
    const senzaPrezzo=V.filter(v=>!(+v.prezzo)).length;
    const senzaTar=V.filter(v=>!v.tariffa).length;
    const qtaZero=V.filter(v=>!(+v.quantita>0)).length;

    const avvisi=[];
    if(senzaPrezzo)avvisi.push("<b>"+senzaPrezzo+"</b> "+(senzaPrezzo===1?"riga è senza prezzo":"righe sono senza prezzo")+": sul foglio del geometra è normale, i prezzi ce li metti tu dopo col pulsante «Prendi i prezzi dal prezzario».");
    if(senzaTar)avvisi.push("<b>"+senzaTar+"</b> "+(senzaTar===1?"riga è senza codice":"righe sono senza codice")+" di tariffa: quelle il prezzario non le può cercare.");
    if(qtaZero)avvisi.push("<b>"+qtaZero+"</b> "+(qtaZero===1?"riga ha quantità zero":"righe hanno quantità zero")+": controllale, o toglile.");

    const riga=(v,i)=>'<div class="cp-riga" data-i="'+i+'">'
      +'<label class="cp-si"><input type="checkbox" class="cp-ck" checked> <span>la prendo</span></label>'
      +'<div class="cp-num">'+(v.numero!=null?("n. "+esc(String(v.numero))):"—")+'</div>'
      +'<div class="cp-campi">'
      +  '<div class="field"><label>Codice di tariffa</label><input class="cp-tar" value="'+esc(v.tariffa||"")+'"'+_noAuto()+'></div>'
      +  '<div class="field"><label>U.M.</label><input class="cp-um" value="'+esc(v.unita||"")+'"'+_noAuto()+'></div>'
      +  '<div class="field"><label>Quantità</label><input class="cp-qta" inputmode="decimal" value="'+esc(_misTesto(v.quantita))+'"'+_noAuto()+'></div>'
      +  '<div class="field"><label>Prezzo unitario</label><input class="cp-prz" inputmode="decimal" value="'+(v.prezzo?esc(String(v.prezzo).replace(".",",")):"")+'" placeholder="lo metti tu"'+_noAuto()+'></div>'
      +'</div>'
      +'<div class="cp-desc cm-testo">'+esc(v.descrizione||"(senza descrizione)")+'</div>'
      /* ⚠️ IL PEZZO DI FOGLIO ORIGINALE, sotto ogni riga. E' l'unica cosa che
         permette di accorgersi se ho letto male: senza, si dovrebbe credermi
         sulla parola. */
      +'<div class="cp-orig">Sul foglio: '+esc((v.originali||[]).slice(-1)[0]||"")+'</div>'
      +'</div>';

    openSheetGrande("Controlla quello che ho letto",
       /* «sh-centro»: la finestra e' larga quanto lo schermo, ma queste
          righe si leggono una sotto l'altra e restano al centro. */
       '<div class="sh-b sh-centro"><div class="sh-tit">'+V.length+(V.length===1?" lavorazione letta":" lavorazioni lette")+' da «'+esc(cpLette.nome)+'»</div>'
      +  '<div class="sh-nota">Il PDF è un foglio <b>stampato</b>: l\'ho letto, non me l\'ha detto nessuno. Guarda le quantità prima di farle entrare — sotto ogni riga c\'è <b>il pezzo di foglio</b> da cui l\'ho presa.<br>Chi non ti convince, togli la spunta e non entra.</div>'
      +  (avvisi.length?('<div class="sh-nota">⚠ '+avvisi.join("<br>⚠ ")+'</div>'):'')
      +  '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0">'
      +    '<button type="button" class="btn-ghost quick-add" data-action="cp-tutte">Segna tutte</button>'
      +    '<button type="button" class="btn-ghost quick-add" data-action="cp-nessuna">Togli tutte</button>'
      +  '</div>'
      +  '<div id="cp-lista">'+V.map(riga).join("")+'</div>'
      +'</div>',
       '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="cp-metti">Metti dentro le lavorazioni segnate</button>');
  }

  async function compPdfMetti(){
    if(!cpLette){toast("Non c'è niente da mettere dentro");return;}
    const cid=cpLette.cid;
    const voci=[];
    let tolte=0;
    $$("#cp-lista .cp-riga").forEach(function(r){
      const ck=r.querySelector(".cp-ck");
      if(!ck||!ck.checked){tolte++;return;}
      const q=_numDa((r.querySelector(".cp-qta")||{}).value||"");
      const p=_numDa((r.querySelector(".cp-prz")||{}).value||"");
      const d=cpLette.voci[+r.dataset.i]||{};
      voci.push({
        codice:String((r.querySelector(".cp-tar")||{}).value||"").trim()||null,
        descrizione:String(d.descrizione||"").trim()||"(senza descrizione)",
        unita:String((r.querySelector(".cp-um")||{}).value||"").trim()||null,
        quantita_manuale:true,
        quantita:(q!=null&&isFinite(q))?q:0,
        prezzo_unitario:(p!=null&&isFinite(p))?p:0
      });
    });
    if(!voci.length){toast("Non hai segnato nessuna riga: non entra niente.");return;}
    if(!gconfirm("Sto per aggiungere "+voci.length+(voci.length===1?" lavorazione":" lavorazioni")+" a questo computo.\n\n"
      +"Entrano come «A corpo»: la quantità è quella del foglio, le misure non ci sono.\n"
      +(tolte?("\n⚠ "+tolte+(tolte===1?" riga l'hai tolta":" righe le hai tolte")+" e non entra"+(tolte===1?"":"no")+".\n"):"")
      +"\nLe aggiungo in fondo a quelle che ci sono già. Vado?")){toast("Non ho messo dentro niente");return;}

    const messe=await _compScriviVoci(cid,voci);
    if(messe==null)return;
    cpLette=null;
    closeSheet();
    const senzaPrezzo=voci.filter(v=>!(+v.prezzo_unitario)).length;
    toast(messe+(messe===1?" lavorazione dal PDF ✔":" lavorazioni dal PDF ✔")
          +(senzaPrezzo?("  ·  "+senzaPrezzo+" senza prezzo: premi «Prendi i prezzi dal prezzario»"):""));
  }

  /* ============================================================
     19 agosto 2026 — «PRENDI I PREZZI DAL PREZZARIO»
     ============================================================
     Un computo importato da Excel arriva con le lavorazioni ma SENZA i
     prezzi: sulla lista di gara sono vuoti apposta. Ottantasette righe a
     0,00 € vogliono dire un preventivo che vale zero. Qui si cerca il
     CODICE dentro il prezzario e si riempie il prezzo.

     Le tre regole che tengono in piedi la cosa:

     1. SI TOCCA SOLO QUELLO CHE È A ZERO. Un prezzo già scritto è una
        decisione presa: non si sovrascrive mai, nemmeno se il prezzario
        dice un altro numero.
     2. SI CERCA SOLO DENTRO LA TARIFFA DICHIARATA DAL COMPUTO. Sul PDF
        resta scritto «Tariffa Regione Lazio 2023»: pescare il prezzo
        dall'Umbria, su una gara, è un errore che si paga. Se il computo
        non dichiara nessuna tariffa non si tira a indovinare: si dice e
        ci si ferma.
     3. NEL DUBBIO NON SI RIEMPIE, SI DICE. Un codice come A03.01.019.a
        nel prezzario ha tre sotto-varianti (.1 .2 .3) con prezzi diversi:
        sceglierne una a caso è PEGGIO che lasciare la riga a zero, perché
        lo zero si vede e il prezzo sbagliato no. Stessa cosa quando
        l'unità di misura non combacia: un prezzo al «mq/cm» finito su una
        riga in «m³» è un conto sbagliato che sembra giusto (è la trappola
        chiusa il 18 agosto con _uniMetti).

     ⚠️ I CODICI NON SI CERCANO IN MEMORIA. In memoria ce ne stanno 500
        (PP_MAX) e un prezzario regionale ne ha 12.762: cercare lì dentro
        riempirebbe quattro voci su ottanta e sembrerebbe che il prezzario
        non c'entri niente. Si chiedono al database, a blocchi, per codice.
     ============================================================ */
  let compPrzEsito="", compPrzEsitoId=null;
  const PRZ_BLOCCO=30;      /* quanti codici per viaggio (2 filtri a testa) */
  const PRZ_TETTO=500;      /* quante righe al massimo per viaggio */

  /* le unità si confrontano appiattite: «m2», «mq», «M²» sono la stessa cosa,
     «mq/cm» e «m³» no. Nel dubbio si preferisce dire «diverse» e non riempire. */
  function _uniPiatta(u){
    let s=_ppPiatto(String(u==null?"":u)).replace(/\s+/g,"").replace(/\./g,"");
    s=s.replace(/²/g,"2").replace(/³/g,"3");
    if(s==="mq")s="m2";
    if(s==="mc")s="m3";
    if(s==="ml")s="m";
    if(s==="n"||s==="nr"||s==="num"||s==="pz"||s==="pezzi"||s==="pezzo")s="cad";
    if(s==="kilogrammi"||s==="kg")s="kg";
    return s;
  }
  /* un codice buono per andare a cercare: lettere, numeri, punto, trattino,
     barra. ⚠️ La percentuale e il trattino basso, dentro un LIKE, sono JOLLY:
     un codice che li contiene pescherebbe mezzo prezzario e riempirebbe la
     riga col prezzo di un'altra lavorazione. Quelli non si cercano. */
  function _codPulito(c){
    const s=String(c==null?"":c).trim();
    return (s && /^[A-Za-z0-9.\-\/]{2,60}$/.test(s)) ? s : "";
  }
  const _codChiave=c=>String(c==null?"":c).trim().toUpperCase();

  /* ⚠️ 19 agosto 2026 — le descrizioni del prezzario regionale sono lunghe
     otto righe: nell'elenco vanno accorciate. Ma un taglio secco a 110
     lettere spezza a metà parola («…e l'avvicinamento del»), e sembra che
     manchi un pezzo del gestionale, non della frase. Qui si torna indietro
     fino all'ultimo spazio e si mettono i tre puntini. */
  function _przAccorcia(t,quante){
    const s=String(t==null?"":t).replace(/\s+/g," ").trim();
    if(s.length<=quante)return s;
    const tagliato=s.slice(0,quante);
    const spazio=tagliato.lastIndexOf(" ");
    return (spazio>quante*0.5?tagliato.slice(0,spazio):tagliato).replace(/[ ,;.:]+$/,"")+"…";
  }
  function _przRigaHtml(v,motivo){
    return '<div class="spesa-row"><span>'
      +(v.codice?'<b>'+esc(String(v.codice))+'</b> · ':'')
      +esc(_przAccorcia(v.descrizione||"(senza descrizione)",110))
      +'<small class="sp-forn">'+motivo+'</small></span><b></b><span></span></div>';
  }
  function _przGruppo(titolo,elenco){
    if(!elenco||!elenco.length)return "";
    return '<div class="prz-gruppo">'+titolo+'</div>'+elenco.join("");
  }

  async function compPrezziDaPrezzario(){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const cid=compVociCompId;
    if(!cid){toast("Apri prima il computo");return;}
    const comp=compCache.find(x=>String(x.id)===String(cid))||{};

    /* ---- 1. quali lavorazioni sono a zero ---- */
    const tutte=Array.from(compVociCache||[]);
    if(!tutte.length){toast("Questo computo non ha ancora lavorazioni");return;}
    const aZero=tutte.filter(function(v){return !(+v.prezzo_unitario);});
    if(!aZero.length){toast("Nessuna lavorazione a 0,00 €: non c'è niente da riempire");return;}

    /* ---- 2. dentro quale tariffa si cerca ---- */
    const errP=await ppCarica();
    if(errP){
      toast(_compManca(errP)
        ? "Per il prezzario serve l'aggiornamento del database (sql/gest-computo-metrico.sql)"
        : ("Non riesco a leggere il prezzario: "+errP.message));
      return;
    }
    const fonti=ppFonti();
    const dich=String(comp.prezzario||"").trim();
    /* stessa regola della ricerca dentro la lavorazione: nome uguale, oppure
       le parole in comune. Una regola sola, in un posto solo. */
    const fonte=(fonti.indexOf(dich)>=0)?dich:_ppSceltaAuto(fonti,[dich,(comp.prezzario_anno||"")].join(" "));
    if(!fonte){
      compPrzEsitoId=cid;
      compPrzEsito='<div class="sh-nota" style="border-left:4px solid var(--err,#c0392b);padding-left:10px;margin-top:14px">'
        +'<b>Non so dove cercare i prezzi.</b><br>'
        +(fonti.length
          ? 'Questo computo non dice da quale prezzario vengono i prezzi, oppure il nome scritto non somiglia a nessuna delle tariffe che hai. Aprilo, vai su <b>Da dove vengono i prezzi</b> e scegli la tariffa dalla tendina.'
          : 'Il tuo prezzario è ancora vuoto: prima importa una tariffa nella sezione <b>Prezzario</b>, poi torna qui.')
        +'<br><br>Non ho toccato nessuna lavorazione.'
        +'<div style="margin-top:10px"><button type="button" class="btn-ghost quick-add" data-action="comp-prz-chiudi">Ho capito</button></div></div>';
      await renderCompVoci(cid);
      toast("Non so da quale prezzario prendere i prezzi");
      return;
    }

    /* ---- 3. i codici da cercare ---- */
    const senzaCodice=[], codStrano=[], daCercare=[];
    aZero.forEach(function(v){
      const scritto=String(v.codice==null?"":v.codice).trim();
      if(!scritto){senzaCodice.push(v);return;}
      if(!_codPulito(scritto)){codStrano.push(v);return;}
      daCercare.push(v);
    });
    if(!daCercare.length){
      compPrzEsitoId=cid;
      compPrzEsito=_przResoconto(fonte,aZero.length,0,
        {varianti:[],doppioni:[],unita:[],zeroLi:[],mancanti:[],falliti:[]},senzaCodice,codStrano);
      await renderCompVoci(cid);
      toast("Nessuna delle lavorazioni a zero ha un codice: non c'è niente da cercare");
      return;
    }

    toast("Sto cercando "+daCercare.length+(daCercare.length===1?" codice":" codici")+" dentro «"+fonte+"»…");

    /* ---- 4. si chiede al database, a blocchi ----
       Per ogni codice si chiedono DUE cose in un colpo:
         · il codice preciso            (ilike senza jolly = uguale, maiuscole a parte)
         · le sue sotto-varianti        (codice.*)
       Le maiuscole non contano apposta: un ingegnere scrive A03.01.019.A dove
       la Regione scrive A03.01.019.a, e con un confronto secco non si
       troverebbe NIENTE su tutto il computo. */
    const chiavi=[]; const visti={};
    daCercare.forEach(function(v){
      const k=_codPulito(v.codice);
      if(!visti[_codChiave(k)]){visti[_codChiave(k)]=1;chiavi.push(k);}
    });
    const trovate={};
    for(let i=0;i<chiavi.length;i+=PRZ_BLOCCO){
      const pezzo=chiavi.slice(i,i+PRZ_BLOCCO);
      const filtro=pezzo.map(function(c){return "codice.ilike."+c+",codice.ilike."+c+".*";}).join(",");
      const {data,error}=await sb.from("gest_prezzi_propri")
        .select("codice,descrizione,unita,prezzo_unitario,fonte")
        .eq("user_id",sbUid).is("eliminato_il",null).eq("fonte",fonte)
        .or(filtro).order("codice").limit(PRZ_TETTO);
      if(error){
        toast(_compManca(error)
          ? "Per il prezzario serve l'aggiornamento del database (sql/gest-computo-metrico.sql)"
          : ("Non riesco a leggere il prezzario: "+error.message));
        return;
      }
      (data||[]).forEach(function(r){
        const k=_codChiave(r.codice);
        (trovate[k]=trovate[k]||[]).push(r);
      });
    }

    /* ---- 5. si decide voce per voce ---- */
    const pieni=[], esiti={varianti:[],doppioni:[],unita:[],zeroLi:[],mancanti:[],falliti:[]};
    daCercare.forEach(function(v){
      const k=_codChiave(v.codice);
      const esatte=trovate[k]||[];
      /* le sotto-varianti stanno sotto una chiave diversa: si raccolgono
         guardando tutte le chiavi che cominciano col codice più un punto */
      let figlie=[];
      Object.keys(trovate).forEach(function(kk){
        if(kk!==k&&kk.indexOf(k+".")===0)figlie=figlie.concat(trovate[kk]);
      });
      if(!esatte.length){
        if(figlie.length)esiti.varianti.push({v:v,n:figlie.length});
        else esiti.mancanti.push({v:v});
        return;
      }
      const prezzi=[];
      esatte.forEach(function(r){const p=+r.prezzo_unitario||0;if(prezzi.indexOf(p)<0)prezzi.push(p);});
      if(prezzi.length>1){esiti.doppioni.push({v:v,n:esatte.length});return;}
      if(!(prezzi[0]>0)){
        /* il codice c'è ma vale zero (o meno di zero) anche nel prezzario: se
           ha sotto-varianti è la voce madre, e il prezzo vero sta nelle figlie */
        if(figlie.length)esiti.varianti.push({v:v,n:figlie.length});
        else esiti.zeroLi.push({v:v});
        return;
      }
      const scelta=esatte[0];
      const uV=_uniPiatta(v.unita), uP=_uniPiatta(scelta.unita);
      if(uV&&uP&&uV!==uP){esiti.unita.push({v:v,pu:scelta.unita});return;}
      pieni.push({v:v,prezzo:prezzi[0],riga:scelta});
    });

    if(!pieni.length){
      compPrzEsitoId=cid;
      compPrzEsito=_przResoconto(fonte,aZero.length,0,esiti,senzaCodice,codStrano);
      await renderCompVoci(cid);
      toast("Nessun prezzo riempito: guarda l'elenco sotto le lavorazioni");
      return;
    }

    /* ---- 6. si chiede, poi si scrive ---- */
    const restano=aZero.length-pieni.length;
    if(!gconfirm("Ho trovato il prezzo per "+pieni.length+(pieni.length===1?" lavorazione":" lavorazioni")
      +" su "+aZero.length+" a 0,00 €.\n\n"
      +"Li prendo da «"+fonte+"», solo dove il codice e l'unità di misura combaciano.\n"
      +(restano?("\nLe altre "+restano+" le lascio a zero e ti dico una per una perché.\n"):"")
      +"\nI prezzi già scritti non li tocco. Vado?")){toast("Non ho toccato niente");return;}

    let messe=0;
    for(let i=0;i<pieni.length;i+=10){
      const pezzo=pieni.slice(i,i+10);
      const res=await Promise.all(pezzo.map(function(x){
        return sb.from("gest_computo_voci").update({prezzo_unitario:x.prezzo})
          .eq("id",x.v.id).eq("user_id",sbUid).select("id");
      }));
      res.forEach(function(r,j){
        /* ⚠️ non basta che non ci sia l'errore: se non torna nessuna riga il
           prezzo NON è stato scritto (permessi, riga sparita). Va detto. */
        if(r.error||!r.data||!r.data.length)esiti.falliti.push({v:pezzo[j].v,msg:(r.error&&r.error.message)||"nessuna riga scritta"});
        else messe++;
      });
    }

    compPrzEsitoId=cid;
    compPrzEsito=_przResoconto(fonte,aZero.length,messe,esiti,senzaCodice,codStrano);
    await renderCompVoci(cid);
    rinfresca("computi");
    toast(messe
      ? (messe+(messe===1?" prezzo riempito ✔":" prezzi riempiti ✔")+(aZero.length-messe?("  ·  "+(aZero.length-messe)+" ancora a zero: leggi sotto"):""))
      : "Nessun prezzo scritto: leggi l'elenco sotto le lavorazioni");
  }

  /* il resoconto: quante ne ha riempite e, una per una, perché le altre no.
     ⚠️ Niente tagli silenziosi: se un gruppo è lungo si scrive quante sono e
     se ne mostrano venti, non si accorciano di nascosto. */
  function _przResoconto(fonte,quanteAZero,messe,esiti,senzaCodice,codStrano){
    const TETTO=20;
    const taglia=function(elenco,fai){
      const righe=elenco.slice(0,TETTO).map(fai);
      if(elenco.length>TETTO)righe.push('<div class="sh-nota">…e altre '+(elenco.length-TETTO)+'. Sono tutte ancora a 0,00 € nell\'elenco qui sopra.</div>');
      return righe;
    };
    let h='<div class="prz-box">'
      +'<div class="prz-tit">Prezzi presi da «'+esc(fonte)+'»</div>'
      +'<div class="prz-conta">'
      +'<b>'+messe+'</b> '+(messe===1?"prezzo riempito":"prezzi riempiti")
      +' su <b>'+quanteAZero+'</b> '+(quanteAZero===1?"lavorazione che era":"lavorazioni che erano")+' a 0,00 €.'
      +'</div>';

    h+=_przGruppo("Hanno sotto-varianti: il prezzo scegli tu",
      taglia(esiti.varianti,function(x){
        return _przRigaHtml(x.v,"nel prezzario questo codice ha "+x.n+(x.n===1?" variante":" varianti")+" con prezzi diversi — apri la lavorazione e cercala a mano");
      }));
    h+=_przGruppo("Il codice c'è più volte con prezzi diversi",
      taglia(esiti.doppioni,function(x){
        return _przRigaHtml(x.v,x.n+" voci con lo stesso codice e prezzi diversi — apri la lavorazione e scegli");
      }));
    h+=_przGruppo("L'unità di misura non combacia",
      taglia(esiti.unita,function(x){
        return _przRigaHtml(x.v,"qui è «"+esc(String(x.v.unita||"—"))+"», nel prezzario è «"+esc(String(x.pu||"—"))+"» — un prezzo messo così sarebbe sbagliato senza vedersi");
      }));
    h+=_przGruppo("Nel prezzario valgono zero anche loro",
      taglia(esiti.zeroLi,function(x){
        return _przRigaHtml(x.v,"il codice c'è, ma nel prezzario il prezzo è 0,00 €");
      }));
    h+=_przGruppo("Il codice non è in questo prezzario",
      taglia(esiti.mancanti,function(x){
        return _przRigaHtml(x.v,"nessuna voce con questo codice dentro «"+esc(fonte)+"»");
      }));
    h+=_przGruppo("Senza codice: non c'è niente da cercare",
      taglia(senzaCodice,function(v){
        return _przRigaHtml(v,"scrivi il codice del prezzario nella lavorazione, poi rifai la ricerca");
      }));
    h+=_przGruppo("Codice scritto in un modo che non posso cercare",
      taglia(codStrano,function(v){
        return _przRigaHtml(v,"nel codice ci sono caratteri che non posso usare per cercare (spazi, %, _): correggilo nella lavorazione");
      }));
    h+=_przGruppo("Il prezzo NON è stato scritto",
      taglia(esiti.falliti,function(x){
        return _przRigaHtml(x.v,"il database non ha scritto la riga: "+esc(String(x.msg||"")));
      }));

    h+='<div style="margin-top:12px"><button type="button" class="btn-ghost quick-add" data-action="comp-prz-chiudi">Chiudi questo elenco</button></div>'
      +'</div>';
    return h;
  }

  async function computoListaGara(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const cli=await cliDelDocumento(c.cliente_id,"nome,indirizzo,referente");

    const [rc,rv]=await Promise.all([
      sb.from("gest_computo_capitoli").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine"),
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine")
    ]);
    if(rc.error||rv.error){toast("Non riesco a leggere il computo: "+((rc.error||rv.error).message));return;}
    const capitoli=rc.data||[], voci=rv.data||[];
    if(!voci.length){toast("Il computo è vuoto: aggiungi almeno una lavorazione");return;}

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    /* N. e Tariffa | LAVORI E FORNITURE | u.m. | Quantità | in cifre | in lettere | TOTALE */
    const X=[10,28,112,124,142,160,182,200];
    const M=X[0], R=X[7], FONDO=272;
    const mid=(a,b)=>(X[a]+X[b])/2;
    /* ⚠️ 19 agosto 2026 — «useGrouping:true» NON si toglie.
       Senza, Intl in italiano lascia il punto delle migliaia solo dai cinque
       numeri in su: sullo stesso foglio si leggeva «€ 97.000,00» e, due righe
       sotto, «€ 3000,00». Su un documento che va a un ente è la prima cosa che
       si nota, e fa sembrare sbagliato un numero che è giusto.
       Trovato guardando la fotografia del quadro economico, non a mente. */
    const _eur=n=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n||0);
    const _d2 =n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0);
    const _q3 =n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:3,maximumFractionDigits:3}).format(+n||0);

    let y=0, tabTop=0, totale=0;

    function chiudiCorpo(){
      doc.setDrawColor(110);doc.setLineWidth(.2);
      for(let i=1;i<=6;i++)doc.line(X[i],tabTop,X[i],y);
      doc.line(M,tabTop,M,y);doc.line(R,tabTop,R,y);doc.line(M,y,R,y);
    }
    function testaTabella(){
      const h1=4.6,h2=4.4,H=h1+h2;
      doc.setFillColor(238,241,243);doc.rect(M,y,R-M,H,"F");
      doc.setDrawColor(110);doc.setLineWidth(.2);doc.rect(M,y,R-M,H);
      doc.setFont("helvetica","bold");doc.setFontSize(6.6);doc.setTextColor(0);
      doc.text("PREZZO UNITARIO (euro)",mid(4,6),y+3.2,{align:"center"});
      doc.line(X[4],y+h1,X[6],y+h1);
      const b=y+H-1.5;
      doc.text("Num.Ord. / TARIFFA",mid(0,1),b,{align:"center"});
      doc.text("LAVORI E FORNITURE PER L'ESECUZIONE DELL'APPALTO",mid(1,2),b,{align:"center"});
      doc.text("unità",mid(2,3),b,{align:"center"});
      doc.text("Quantità",mid(3,4),b,{align:"center"});
      doc.text("in cifre",mid(4,5),b,{align:"center"});
      doc.text("in lettere",mid(5,6),b,{align:"center"});
      doc.text("TOTALE",mid(6,7),b,{align:"center"});
      [1,2,3,4,6].forEach(i=>doc.line(X[i],y,X[i],y+H));
      doc.line(X[5],y+h1,X[5],y+H);
      y+=H;tabTop=y;
    }
    function nuovaPagina(){
      chiudiCorpo();
      doc.addPage();y=13;testaTabella();
      doc.setFont("helvetica","normal");doc.setTextColor(0);
    }
    function spazio(h){ if(y+h>FONDO)nuovaPagina(); }

    /* ---------- l'intestazione, come il modello vero ---------- */
    y=14;
    doc.setFont("helvetica","bold");doc.setFontSize(11);
    doc.text(az.nome||"",M,y);
    let hy=y+4.4;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    [az.piva?("P.IVA "+az.piva):"", az.indirizzo||"",
     [az.telefono?("Tel "+az.telefono):"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=3.8;});
    doc.setTextColor(0);
    y=hy+4;
    doc.setFont("helvetica","bold");doc.setFontSize(11.5);
    const tG=doc.splitTextToSize("LISTA DELLE LAVORAZIONI E FORNITURE PREVISTE PER L'ESECUZIONE DELL'OPERA O DEI LAVORI",R-M);
    doc.text(tG,M,y);y+=tG.length*5+3;
    doc.setDrawColor(180);doc.line(M,y,R,y);y+=6;

    doc.setFont("helvetica","normal");doc.setFontSize(9);
    const dati=[["OGGETTO:", c.oggetto||c.titolo||""],
                ["COMMITTENTE:", (cli.nome||"")+(cli.indirizzo?" - "+cli.indirizzo:"")],
                ["LUOGO:", c.luogo||""],
                ["PREZZARIO:", (c.prezzario||"")+(c.prezzario_anno?" "+c.prezzario_anno:"")]];
    dati.forEach(function(d){
      if(!String(d[1]).trim()) return;
      doc.setFont("helvetica","bold");doc.text(d[0],M,y);
      doc.setFont("helvetica","normal");
      const t=doc.splitTextToSize(String(d[1]),R-M-34);
      doc.text(t,M+34,y);y+=Math.max(t.length*4.2,4.6);
    });
    y+=4;
    testaTabella();

    /* ---------- il corpo ---------- */
    let n=0;
    const perCap={}; voci.forEach(v=>{(perCap[v.capitolo_id||"_"]=perCap[v.capitolo_id||"_"]||[]).push(v);});
    const gruppi=capitoli.map(cp=>({cap:cp,voci:perCap[cp.id]||[]}))
                         .concat(perCap["_"]?[{cap:null,voci:perCap["_"]}]:[]);

    gruppi.forEach(function(g){
      if(!g.voci.length) return;
      if(g.cap){
        spazio(9);
        doc.setFont("helvetica","bold");doc.setFontSize(8);
        /* ⚠️ 21 agosto 2026 — QUI C'ERA SCRITTO «g.cap.nome».
           Quella colonna non esiste: nel database il capitolo si chiama
           «titolo» (e «numero»). Risultato: sopra ogni gruppo di
           lavorazioni la Lista per la gara stampava la parola
           «Capitolo», sempre, invece di Demolizioni, Murature,
           Impianti. Nel PDF del computo era gia' giusto: era sbagliato
           solo qui. Trovato leggendo, non da un banco. */
        doc.text(String((g.cap.numero?g.cap.numero+" - ":"")+(g.cap.titolo||"Capitolo")),X[1]+1.5,y+3.6);
        y+=5.4;doc.setDrawColor(200);doc.line(X[1],y,R,y);
      }
      g.voci.forEach(function(v){
        n++;
        const pu=+v.prezzo_unitario||0, qta=+v.quantita||0, imp=Math.round(qta*pu*100)/100;
        totale+=imp;
        const desc=doc.splitTextToSize(String(v.descrizione||"(senza descrizione)"),X[2]-X[1]-3);
        const cod=doc.splitTextToSize(String(v.codice||""),X[1]-X[0]-3);
        const lettere=doc.splitTextToSize(prezzoInLettere(pu),X[6]-X[5]-3);
        const righe=Math.max(desc.length,cod.length+1,lettere.length,1);
        const H=righe*3.5+3.4;
        spazio(H+4);
        doc.setFont("helvetica","bold");doc.setFontSize(7.4);
        doc.text(String(n),mid(0,1),y+3.4,{align:"center"});
        doc.setFont("helvetica","normal");doc.setFontSize(6.8);
        cod.forEach((r,i)=>doc.text(r,X[0]+1.5,y+7+i*3.2));
        doc.setFontSize(7.4);
        desc.forEach((r,i)=>doc.text(r,X[1]+1.5,y+3.4+i*3.5));
        /* la riga del totale della voce, come «SOMMANO...» del modello */
        const yb=y+H-1.4;
        doc.setFont("helvetica","bold");
        doc.text("SOMMANO",X[1]+1.5,yb);
        doc.setFont("helvetica","normal");
        doc.text(_umPdf(v.unita||""),mid(2,3),yb,{align:"center"});
        doc.text(_q3(qta),X[4]-1.5,yb,{align:"right"});
        doc.text(pu?_d2(pu):"",X[5]-1.5,yb,{align:"right"});
        doc.setFontSize(6.4);
        lettere.forEach((r,i)=>doc.text(r,X[5]+1.5,y+3.4+i*3.2));
        doc.setFontSize(7.4);
        doc.text(pu?_d2(imp):"",R-1.5,yb,{align:"right"});
        y+=H;
        doc.setDrawColor(215);doc.line(X[1],y,R,y);
      });
    });
    chiudiCorpo();

    /* ---------- il piede, con le righe da riempire a penna ---------- */
    y+=6; spazio(60);
    doc.setFont("helvetica","bold");doc.setFontSize(9);
    doc.text("Parziale LAVORI A MISURA",X[1]+1.5,y);
    doc.text(_eur(totale),R,y,{align:"right"});y+=6;
    doc.setFontSize(11);
    doc.text("T O T A L E",X[1]+1.5,y);
    doc.text(_eur(totale),R,y,{align:"right"});y+=5.4;
    doc.setFont("helvetica","normal");doc.setFontSize(8.5);
    const dic=doc.splitTextToSize("(diconsi euro "+euroInLettere(totale)+")",R-M);
    doc.text(dic,X[1]+1.5,y);y+=dic.length*4+4;

    /* ⚠️ queste tre le riempie l'impresa a penna: sono dichiarazioni sue */
    doc.setFontSize(9);
    [["Pari a Ribasso del ______________ %",""],
     ["(ribasso in lettere) ______________________________________________",""],
     ["Oneri di sicurezza aziendali   euro ______________________________",""],
     ["Costi della manodopera   euro ____________________________________",""]]
      .forEach(function(r){ doc.text(r[0],M,y); y+=6.4; });

    y+=6; spazio(26);
    doc.text((c.luogo?String(c.luogo).split(",").pop().trim()+", ":"")+fdate(c.data||todayStr()),M,y);
    y+=14;
    doc.setFont("helvetica","bold");
    doc.text("IL CONCORRENTE",R-30,y,{align:"center"});
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(120);
    doc.text("(timbro e firma)",R-30,y+4,{align:"center"});
    doc.setTextColor(0);

    const np=doc.getNumberOfPages();
    for(let p=1;p<=np;p++){
      doc.setPage(p);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140);
      doc.text("LISTA DELLE LAVORAZIONI E FORNITURE"+(c.numero?"  ·  n. "+c.numero:"")+
        (c.prezzario?"  ·  prezzi da "+c.prezzario+(c.prezzario_anno?" "+c.prezzario_anno:""):""),M,290,{maxWidth:150});
      doc.text("Pag. "+p+" di "+np,R,290,{align:"right"});
      doc.setTextColor(0);
    }
    doc.save("lista-gara-"+(c.numero||"").replace(/[^a-z0-9]+/gi,"-")+"-"+
      (c.titolo||"computo").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)+".pdf");
    toast("Lista per la gara scaricata ✅");
  }

  async function computoPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const cli=await cliDelDocumento(c.cliente_id,"nome,indirizzo,referente");

    const [rc,rv]=await Promise.all([
      sb.from("gest_computo_capitoli").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine"),
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine")
    ]);
    if(rc.error||rv.error){toast("Non riesco a leggere il computo: "+((rc.error||rv.error).message));return;}
    const capitoli=rc.data||[], voci=rv.data||[];
    if(!voci.length){toast("Il computo è vuoto: aggiungi almeno una lavorazione");return;}

    /* tutte le misure in una volta sola: una query per ogni voce su un computo
       da cento voci vorrebbe dire cento viaggi e mezzo minuto di attesa */
    /* ⚠️ IL PDF CHE SI CONTRADDICEVA — 14 agosto 2026.
       Qui l'errore non si guardava: sopra, su capitoli e voci, sì; su questa
       lettura no. Se la rete cade proprio qui (o la query va in timeout), mis
       resta vuoto e il PDF esce LO STESSO: sotto ogni lavorazione c'è ancora
       scritto «Quantità 20,46 mq», ma le righe delle misure che fanno quel
       20,46 non ci sono. È un computo metrico senza il computo delle misure —
       il documento dice una cosa e non la dimostra, e il messaggio in fondo
       diceva pure «PDF del computo scaricato ✅».
       Riprodotto facendo rispondere 500 a quella sola query: PDF scaricato,
       quantità presenti, misure assenti, nessun avviso.
       Adesso ci si ferma prima di disegnare qualsiasi cosa: meglio nessun PDF
       che un PDF da mandare al cliente con dentro un buco che non si vede. */
    const {data:mis,error:eMis}=await sb.from("gest_computo_misure").select("*")
      .eq("user_id",sbUid).in("voce_id",voci.map(v=>v.id)).order("ordine");
    if(eMis){
      toast("Non riesco a leggere le misure: il PDF verrebbe fuori senza le righe delle misure. Riprova fra un momento. ("+esc(eMis.message||"")+")");
      return;
    }
    const misDi={};(mis||[]).forEach(m=>{(misDi[m.voce_id]=misDi[m.voce_id]||[]).push(m);});

    const pubblico=(c.tipo==="pubblico");
    const rp=compRiepilogo(voci,c);

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});

    /* ---- le colonne, nell'ordine di sempre ----
       N. | Tariffa | Descrizione | Dimensioni (P.U. lungh. largh. alt./peso) | Quantità | Prezzo (unit. totale)
       X[i] e' il bordo SINISTRO della colonna i; X[10] e' il bordo destro del foglio. */
    const X=[10,17,39,94,106,120,134,148,168,184,200];
    const M=X[0], R=X[10], FONDO=270;
    const mid=(a,b)=>(X[a]+X[b])/2;

    /* ⚠️ IL METRO QUADRO CHE DIVENTAVA METRO — 11 agosto 2026.
       Il programma che scrive i PDF non sa disegnare il quadratino e il
       cubetto, e invece di sbagliare LI BUTTA VIA IN SILENZIO: "m²" usciva
       stampato "m", "m³" usciva "m". A schermo si leggeva giusto, sul foglio
       consegnato al cliente no. In un computo metrico e' il difetto peggiore
       possibile: 73 metri quadri di intonaco e 73 metri lineari di cornice
       sono due lavori e due prezzi diversi, e sulla carta si leggevano uguali.
       Provato: l'euro, i gradi e le lettere accentate li scrive benissimo,
       sono SOLO gli esponenti a sparire.
       Nel PDF quindi si scrive "mq" e "mc", che e' come si e' sempre scritto
       sui computi di carta. A schermo resta m² e m³, che e' piu' bello. */
    const _um=_umPdf;
    /* ⚠️ 19 agosto 2026 — «useGrouping:true» NON si toglie.
       Senza, Intl in italiano lascia il punto delle migliaia solo dai cinque
       numeri in su: sullo stesso foglio si leggeva «€ 97.000,00» e, due righe
       sotto, «€ 3000,00». Su un documento che va a un ente è la prima cosa che
       si nota, e fa sembrare sbagliato un numero che è giusto.
       Trovato guardando la fotografia del quadro economico, non a mente. */
    const _eur=n=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n||0);
    const _q3 =n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:3,maximumFractionDigits:3}).format(+n||0);
    const _d2 =n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0);
    const _pu =n=>(n==null||+n===1)?"":(Number.isInteger(+n)?String(+n):_q3(n));

    let y=0, tabTop=0, riporto=0;

    /* le righe verticali si tirano solo quando la pagina e' finita: prima non si
       sa fin dove arriva il corpo della tabella */
    function chiudiCorpo(){
      doc.setDrawColor(110);doc.setLineWidth(.2);
      for(let i=1;i<=9;i++)doc.line(X[i],tabTop,X[i],y);
      doc.line(M,tabTop,M,y);doc.line(R,tabTop,R,y);doc.line(M,y,R,y);
    }
    function testaTabella(){
      const h1=4.6,h2=4.4,H=h1+h2;
      doc.setFillColor(238,241,243);doc.rect(M,y,R-M,H,"F");
      doc.setDrawColor(110);doc.setLineWidth(.2);doc.rect(M,y,R-M,H);
      doc.setFont("helvetica","bold");doc.setFontSize(6.6);doc.setTextColor(0);
      doc.text("Dimensioni",mid(3,7),y+3.2,{align:"center"});
      doc.text("Prezzo",mid(8,10),y+3.2,{align:"center"});
      doc.line(X[3],y+h1,X[7],y+h1);
      doc.line(X[8],y+h1,X[10],y+h1);
      const b=y+H-1.5;
      doc.text("N.",mid(0,1),b,{align:"center"});
      doc.text("Tariffa",mid(1,2),b,{align:"center"});
      doc.text("Descrizione dei lavori",mid(2,3),b,{align:"center"});
      doc.text("P.U.",mid(3,4),b,{align:"center"});
      doc.text("Lunghez.",mid(4,5),b,{align:"center"});
      doc.text("Larghez.",mid(5,6),b,{align:"center"});
      doc.text("Alt./Peso",mid(6,7),b,{align:"center"});
      doc.text("Quantità",mid(7,8),b,{align:"center"});
      doc.text("Unitario",mid(8,9),b,{align:"center"});
      doc.text("Totale",mid(9,10),b,{align:"center"});
      /* le colonne larghe partono da sopra, le sotto-colonne da meta' */
      [1,2,3,7,8].forEach(i=>doc.line(X[i],y,X[i],y+H));
      [4,5,6,9].forEach(i=>doc.line(X[i],y+h1,X[i],y+H));
      y+=H;tabTop=y;
    }
    /* "A riportare" in fondo e "Riporto" in cima: e' cosi' che un computo di
       venti fogli si controlla senza rifare tutte le somme da capo. */
    function nuovaPagina(){
      chiudiCorpo();
      doc.setFont("helvetica","bold");doc.setFontSize(7.6);
      doc.text("A riportare",X[7]-1.5,y+4,{align:"right"});
      doc.text(_eur(riporto),R-1.5,y+4,{align:"right"});
      doc.addPage();y=13;testaTabella();
      doc.setFont("helvetica","bold");doc.setFontSize(7.6);
      doc.text("Riporto",X[7]-1.5,y+4,{align:"right"});
      doc.text(_eur(riporto),R-1.5,y+4,{align:"right"});
      y+=5.5;doc.setDrawColor(180);doc.line(M,y,R,y);y+=1;
      /* ⚠️ il grassetto va RIMESSO A POSTO qui dentro. Senza questa riga la
         prima lavorazione dopo ogni cambio pagina usciva tutta in grassetto:
         il "Riporto" lascia il grassetto acceso, e chi chiama nuovaPagina()
         non se lo aspetta. Visto guardando la pagina 2 di una prova da 25 voci. */
      doc.setFont("helvetica","normal");
    }
    const spazio=h=>{if(y+h>FONDO)nuovaPagina();};
    /* ⚠️ DOPO CHE LA TABELLA È CHIUSA SI USA QUESTO, NON spazio() — 11/8/2026.
       spazio() chiama nuovaPagina(), che richiude la tabella una seconda volta
       (tirando le righe verticali giù nel vuoto), scrive «A riportare» quando
       non c'è più niente da riportare, e apre il foglio dopo stampando
       l'INTESTAZIONE DI UNA TABELLA VUOTA più un «Riporto». Il riepilogo dei
       capitoli e il riquadro dei totali finivano stampati là sotto, e l'ultima
       pagina sembrava un documento venuto male. Visto guardando il PDF, non
       leggendo il codice.
       Qui la tabella non c'è più: se non ci sta, si volta pagina e basta. */
    const spazioFuoriTabella=h=>{if(y+h>FONDO){doc.addPage();y=16;}};

    /* ---- intestazione, solo sulla prima pagina ---- */
    y=14;
    doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    let hy=y+4.8;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=3.8;});
    doc.setTextColor(0);
    doc.setFont("helvetica","bold");doc.setFontSize(13);
    doc.text("COMPUTO METRICO ESTIMATIVO",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    doc.text((c.numero?"N. "+c.numero+"     ":"")+"del "+fdate(c.data||todayStr()),R,y+4.8,{align:"right"});
    if(pubblico)doc.text("lavori pubblici",R,y+8.6,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+13)+1;doc.setDrawColor(180);doc.line(M,y,R,y);y+=6;

    doc.setFont("helvetica","bold");doc.setFontSize(10.5);
    const tit=doc.splitTextToSize(c.titolo||_cm('nome'),R-M);
    doc.text(tit,M,y);y+=tit.length*4.6+0.5;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    if(c.oggetto){const o=doc.splitTextToSize("Oggetto: "+c.oggetto,R-M);doc.text(o,M,y);y+=o.length*3.9;}
    if(c.luogo){doc.text("Luogo: "+c.luogo,M,y);y+=3.9;}
    if(cli.nome){doc.text("Committente: "+cli.nome+(cli.indirizzo?" - "+cli.indirizzo:""),M,y);y+=3.9;}
    if(c.prezzario){doc.text("Prezzario: "+c.prezzario+(c.prezzario_anno?" "+c.prezzario_anno:""),M,y);y+=3.9;}
    doc.setTextColor(0);y+=4;

    testaTabella();

    /* ---- il corpo ---- */
    const senzaCap=voci.filter(v=>!v.capitolo_id);
    const gruppi=capitoli.map(cap=>({cap:cap,voci:voci.filter(v=>String(v.capitolo_id)===String(cap.id))}));
    if(senzaCap.length)gruppi.push({cap:null,voci:senzaCap});

    let n=0;const sub=[];
    gruppi.forEach(g=>{
      let subTot=0;
      if(g.cap||capitoli.length){
        spazio(10);
        doc.setFillColor(232,238,236);doc.rect(M,y,R-M,5.4,"F");
        doc.setFont("helvetica","bold");doc.setFontSize(8);
        doc.text(g.cap?((g.cap.numero?g.cap.numero+" - ":"")+(g.cap.titolo||"Capitolo")):"Senza capitolo",X[2]+1.5,y+3.7);
        y+=5.4;doc.setDrawColor(110);doc.line(M,y,R,y);
      }
      g.voci.forEach(v=>{
        n++;
        const righeM=v.quantita_manuale?[]:(misDi[v.id]||[]);
        doc.setFont("helvetica","normal");doc.setFontSize(7.4);
        const dLin=doc.splitTextToSize(v.descrizione||"(senza descrizione)",X[3]-X[2]-3);
        const tLin=doc.splitTextToSize(v.codice||"",X[2]-X[1]-2.5);
        const testa=Math.max(dLin.length,tLin.length)*3.2;
        spazio(testa+(righeM.length+1)*3.3+9);
        doc.setFont("helvetica","normal");doc.setFontSize(7.4);
        doc.text(String(n),mid(0,1),y+3,{align:"center"});
        doc.text(tLin,X[1]+1.2,y+3);
        doc.text(dLin,X[2]+1.5,y+3);
        y+=testa+1.4;
        doc.setFontSize(7.1);
        if(v.quantita_manuale){
          doc.setTextColor(110);doc.text("a corpo",X[2]+4,y+2.6);doc.setTextColor(0);y+=3.3;
        }else if(!righeM.length){
          doc.setTextColor(110);doc.text("nessuna misura",X[2]+4,y+2.6);doc.setTextColor(0);y+=3.3;
        }
        righeM.forEach(m=>{
          if(y+4>FONDO){nuovaPagina();}
          doc.setFont("helvetica","normal");doc.setFontSize(7.1);
          doc.text((m.detrai?"- ":"")+(m.descrizione||"(senza nome)"),X[2]+4,y+2.6,{maxWidth:X[3]-X[2]-6});
          const pu=_pu(m.parti);
          if(pu)doc.text(pu,X[4]-1.5,y+2.6,{align:"right"});
          if(m.lunghezza!=null)doc.text(_d2(m.lunghezza),X[5]-1.5,y+2.6,{align:"right"});
          if(m.larghezza!=null)doc.text(_d2(m.larghezza),X[6]-1.5,y+2.6,{align:"right"});
          if(m.altezza!=null)  doc.text(_d2(m.altezza),  X[7]-1.5,y+2.6,{align:"right"});
          doc.text(_q3(m.quantita),X[8]-1.5,y+2.6,{align:"right"});
          y+=3.3;
        });
        spazio(8);
        doc.setDrawColor(110);doc.line(X[6],y+0.4,R,y+0.4);
        doc.setFont("helvetica","bold");doc.setFontSize(7.3);
        doc.text("Sommano",X[7]-1.5,y+3.6,{align:"right"});
        doc.text((v.unita?_um(v.unita)+"  ":"")+_q3(v.quantita),X[8]-1.5,y+3.6,{align:"right"});
        doc.text(_eur(v.prezzo_unitario),X[9]-1.5,y+3.6,{align:"right"});
        doc.text(_eur(v.importo),R-1.5,y+3.6,{align:"right"});
        y+=5;
        if(pubblico&&(v.incidenza_manodopera||v.oneri_sicurezza)){
          doc.setFont("helvetica","normal");doc.setFontSize(6.5);doc.setTextColor(110);
          doc.text([v.incidenza_manodopera?"costo del personale "+_pct(v.incidenza_manodopera)+"%":"",
                    v.oneri_sicurezza?"oneri sicurezza "+_eur(v.oneri_sicurezza):""].filter(Boolean).join("   ·   "),X[2]+4,y+2.2);
          doc.setTextColor(0);y+=3.2;
        }
        doc.setDrawColor(205);doc.line(M,y,R,y);y+=1.2;
        subTot+=(+v.importo||0);riporto+=(+v.importo||0);
      });
      subTot=Math.round(subTot*100)/100;
      sub.push({t:g.cap?((g.cap.numero?g.cap.numero+" - ":"")+(g.cap.titolo||"Capitolo")):"Senza capitolo",v:subTot});
      spazio(9);
      doc.setFillColor(246,248,249);doc.rect(M,y,R-M,5.6,"F");
      doc.setFont("helvetica","bold");doc.setFontSize(8);
      doc.text(g.cap?"Sommano il capitolo":"Sommano le lavorazioni senza capitolo",X[2]+1.5,y+3.9);
      doc.text(_eur(subTot),R-1.5,y+3.9,{align:"right"});
      y+=5.6;doc.setDrawColor(110);doc.line(M,y,R,y);y+=1.2;
    });
    y-=1.2;   /* l'ultima riga aveva lasciato una striscia vuota sotto */
    chiudiCorpo();
    y+=9;

    /* ---- riepilogo dei capitoli e totale ---- */
    spazioFuoriTabella(24+sub.length*5);
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Riepilogo dei capitoli",M,y);y+=5.5;
    doc.setFont("helvetica","normal");doc.setFontSize(8.5);
    sub.forEach(s=>{spazioFuoriTabella(8);doc.text(s.t,M+2,y,{maxWidth:120});doc.text(_eur(s.v),R-1.5,y,{align:"right"});y+=4.8;});
    y+=3;

    /* ⚠️ IL RIQUADRO DEVE TORNARE CON LA CALCOLATRICE — 11 agosto 2026.
       Prima usciva così:
           Totale dei lavori                          8.468,05
           Oneri sicurezza (non soggetti a ribasso)      75,00
           Ribasso 10%                              -   839,31
           TOTALE                                     7.628,74
       Chi lo riceve somma e trova 7.703,74, cioè 75 euro in più. Il totale
       scritto era quello giusto — gli oneri della sicurezza sono GIÀ DENTRO
       il totale dei lavori, non si sommano una seconda volta — ma sul foglio
       sembravano una somma. A schermo era scritto bene («di cui»); nel PDF
       quel «di cui» non c'era. Su un computo per una gara è la prima cosa che
       ti fanno rispiegare.
       Adesso le righe si sommano una sotto l'altra, nell'ordine, e il conto
       torna: si toglie la sicurezza dal ribassabile, si applica il ribasso,
       si rimette la sicurezza. È il modo in cui il computo si è sempre
       presentato su carta. */
    const righeTot=[];
    if(rp.perc){
      if(rp.sicurezza){
        righeTot.push(["Totale dei lavori",rp.lordo,false]);
        righeTot.push(["a dedurre oneri della sicurezza",rp.sicurezza,true]);
        righeTot.push(["Importo soggetto a ribasso",rp.lordo-rp.sicurezza,false]);
        righeTot.push(["Ribasso "+_pct(rp.perc)+"%",rp.ribasso,true]);
        righeTot.push(["Oneri della sicurezza, non ribassabili",rp.sicurezza,false,true]);
      }else{
        righeTot.push(["Totale dei lavori",rp.lordo,false]);
        righeTot.push(["Ribasso "+_pct(rp.perc)+"%",rp.ribasso,true]);
      }
    }
    const hBox=righeTot.length*5.6+15;
    spazioFuoriTabella(hBox+4);
    doc.setDrawColor(31,111,92);doc.setLineWidth(.5);doc.rect(R-92,y,92,hBox);doc.setLineWidth(.2);
    let ry=y+6.5;doc.setFont("helvetica","normal");doc.setFontSize(8.5);
    /* la colonna dell'etichetta è larga 62 mm, non 56: con 56 la riga
       «Oneri della sicurezza, non ribassabili» andava a capo e finiva
       stampata sopra la riga sotto */
    righeTot.forEach(r=>{doc.text(r[0],R-90,ry,{maxWidth:62});
      doc.text((r[2]?"- ":(r[3]?"+ ":""))+_eur(r[1]),R-2,ry,{align:"right"});ry+=5.6;});
    if(righeTot.length){doc.setDrawColor(31,111,92);doc.line(R-90,ry-2.8,R-2,ry-2.8);}
    doc.setFont("helvetica","bold");doc.setFontSize(11);
    doc.text("TOTALE",R-90,ry+4);doc.text(_eur(rp.netto),R-2,ry+4,{align:"right"});
    y+=hBox+7;

    if(pubblico&&(rp.manodopera||rp.sicurezza)){
      spazioFuoriTabella(14);
      doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.text("Da dichiarare in gara",M,y);y+=4.6;
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
      doc.text("Costo del personale: "+_eur(rp.manodopera),M,y);y+=4;
      doc.text("Oneri della sicurezza non soggetti a ribasso: "+_eur(rp.sicurezza),M,y);y+=4;
      doc.setTextColor(0);y+=2;
    }

    /* ============================================================
       IL QUADRO ECONOMICO — 19 agosto 2026
       ============================================================
       Il computo dice quanto costano i lavori; questo dice quanto costa
       l'opera. È il foglio che finisce nella delibera.

       Esce solo sui LAVORI PUBBLICI e solo se c'è davvero qualcosa nella
       parte B: su un computo pubblico appena nato, un quadro economico con
       undici righe a zero sarebbe una pagina in più che dice il nulla.

       ⚠️ Le righe si sommano una sotto l'altra, nell'ordine, e il conto deve
       tornare con la calcolatrice — è la lezione dell'11 agosto sul riquadro
       del totale. Per questo la manodopera sta su una riga «di cui», staccata
       dalla somma: sta già dentro i lavori e sommarla due volte gonfierebbe
       l'opera del costo del personale. */
    const qe=qeCalcola(qeRighe(c),rp.netto);
    const qeB=qe.righe.filter(r=>r.importo);
    if(pubblico&&qeB.length){
      spazioFuoriTabella(30);
      doc.setFont("helvetica","bold");doc.setFontSize(10);
      doc.text("Quadro economico",M,y);y+=6;
      const qriga=function(et,v,grassetto,indent){
        spazioFuoriTabella(8);
        doc.setFont("helvetica",grassetto?"bold":"normal");doc.setFontSize(grassetto?9:8.5);
        if(indent)doc.setTextColor(110);
        doc.text(et,M+(indent?6:2),y,{maxWidth:R-M-40});
        doc.text(_eur(v),R-1.5,y,{align:"right"});
        doc.setTextColor(0);
        y+=5;
      };
      /* i due titoli di sezione non portano un importo: il loro totale sta in
         fondo alla sezione, dove si legge dopo aver visto gli addendi */
      const qtitolo=function(t){
        spazioFuoriTabella(8);
        doc.setFont("helvetica","bold");doc.setFontSize(9);
        doc.text(t,M+2,y);y+=5;
      };
      qtitolo("A · LAVORI");
      qriga("Lavori a corpo e a misura",Math.round((rp.lordo-rp.sicurezza)*100)/100);
      if(rp.sicurezza)qriga("Oneri della sicurezza, non soggetti a ribasso",rp.sicurezza);
      if(rp.perc&&rp.ribasso)qriga("Ribasso d'asta "+_pct(rp.perc)+"% sulla parte ribassabile",-rp.ribasso);
      spazioFuoriTabella(8);
      doc.setDrawColor(150);doc.line(M+2,y-3.2,R-1.5,y-3.2);
      qriga("Totale A",qe.totaleA,true);
      if(rp.manodopera)qriga("di cui costo della manodopera, non soggetto a ribasso",rp.manodopera,false,true);
      y+=2;
      qtitolo("B · SOMME A DISPOSIZIONE DELLA STAZIONE APPALTANTE");
      qeB.forEach(function(r){
        qriga(r.d+(r.p!=null?"   ("+_pct(r.p)+"% di A)":""),r.importo);
      });
      spazioFuoriTabella(8);
      doc.setDrawColor(150);doc.line(M+2,y-3.2,R-1.5,y-3.2);
      qriga("Totale B",qe.totaleB,true);
      y+=3;
      spazioFuoriTabella(16);
      doc.setDrawColor(31,111,92);doc.setLineWidth(.5);doc.rect(M,y,R-M,11);doc.setLineWidth(.2);
      doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text("TOTALE QUADRO ECONOMICO  (A + B)",M+3,y+7.2);
      doc.text(_eur(qe.totale),R-3,y+7.2,{align:"right"});
      y+=17;
    }
    if(c.note){
      /* ===== 12 agosto 2026 (sera) — LE NOTE ROMPEVANO L'ULTIMA PAGINA =====
         Due errori in tre righe.
         1) «spazio(15)» e' la funzione della TABELLA, e qui la tabella e' chiusa
            da un pezzo: chiamarla la richiudeva una seconda volta (righe
            verticali tirate giu' nel vuoto), scriveva «A riportare» quando non
            c'era piu' niente da riportare, e apriva un foglio con
            l'intestazione di una tabella VUOTA. E' scritto a chiare lettere nel
            commento di spazioFuoriTabella, venti righe piu' su, e qui era stato
            usato lo stesso quello sbagliato.
         2) le note lunghe non venivano mai spezzate: si stampavano tutte di
            fila, uscivano dal foglio e passavano sopra il pie' di pagina.
         Adesso: la funzione giusta, e le righe si stampano una per una
         voltando pagina quando serve. */
      spazioFuoriTabella(14);
      doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text("Note",M,y);y+=4.6;
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
      const nl=doc.splitTextToSize(c.note,R-M);
      nl.forEach(function(riga){
        if(y+3.9>FONDO){doc.addPage();y=16;}
        doc.text(riga,M,y);y+=3.9;
      });
      doc.setTextColor(0);
    }

    const np=doc.getNumberOfPages();
    for(let p=1;p<=np;p++){
      doc.setPage(p);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140);
      doc.text((c.numero?"Computo n. "+c.numero+"  ·  ":"")+(c.titolo||"")+
        (c.prezzario?"  ·  prezzi da "+c.prezzario+(c.prezzario_anno?" "+c.prezzario_anno:""):""),M,290,{maxWidth:150});
      doc.text("Pag. "+p+" di "+np,R,290,{align:"right"});
      doc.setTextColor(0);
    }
    doc.save("computo-"+(c.numero||"").replace(/[^a-z0-9]+/gi,"-")+"-"+
      (c.titolo||"metrico").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)+".pdf");
    toast("PDF del computo scaricato ✅");
  }

  /* ============================================================
     21 agosto 2026 — IL CRONOPROGRAMMA IN PDF
     ============================================================
     A schermo il calendario c'e' dal 20 agosto. Ma in una gara il
     cronoprogramma e' un documento che si CONSEGNA: va stampato, con
     l'intestazione dell'azienda, il committente e una firma sotto.

     ⛔ IL FOGLIO NON RIFA' NESSUN CONTO.
        Le date le decide cronoDate, la scala cronoScala, la posizione
        e la larghezza di ogni barra _cgBarraPerc, i giorni totali
        _cgGiorniLav — le stesse funzioni che disegnano lo schermo.
        Se il PDF se le riscrivesse, il foglio consegnato e la
        schermata direbbero prima o poi due cose diverse, e nessuno se
        ne accorgerebbe fino alla gara. E' la lezione gia' pagata il
        20 agosto, quando la formula della barra viveva in due posti e
        rompendone uno solo il banco restava verde.

     ⛔ IL FOGLIO ESCE DA QUELLO CHE E' SALVATO, non dalle caselle.
        cronoModifiche dice se qualcuno ha cambiato i giorni senza
        premere Salva: in quel caso ci si ferma e si dice cosa fare.
        Stessa rete del SAL (salModifiche).

     Il foglio e' ORIZZONTALE: un calendario di quattro mesi su una
     pagina in piedi diventa una striscia di due centimetri.
     ============================================================ */
  async function cronoPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    if(!sb||!sbUid){toast("Devi essere collegato");return;}
    if(cronoModifiche(id)){
      toast("Hai delle modifiche non salvate: premi prima «Salva il cronoprogramma», poi scarica il PDF. Il foglio esce da quello che è salvato, non da quello che vedi nelle caselle.");
      return;
    }
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const cli=await cliDelDocumento(c.cliente_id,"nome,indirizzo,referente");

    /* ⚠️ LA DATA DI PARTENZA SI RILEGGE DAL DATABASE, non dalla cache.
       compCache la aggiorna quando salvi, ma se il computo e' stato
       toccato da un'altra scheda (o da un altro dispositivo) la copia in
       memoria e' vecchia — e un calendario che parte dal giorno sbagliato
       ha tutte le date sbagliate, una per una, senza sembrarlo. */
    const rcp=await sb.from("gest_computi").select("data_inizio")
      .eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(rcp.error){
      toast(/data_inizio/i.test(String(rcp.error.message||""))
        ? "Per il cronoprogramma serve l'aggiornamento del database: esegui sql/gest-computo-cronoprogramma.sql su Supabase"
        : "Non riesco a leggere il computo: "+(rcp.error.message||""));
      return;
    }
    const inizioTesto=(rcp.data&&rcp.data.data_inizio)||"";

    /* ⚠️ le colonne per NOME, non con «*»: con «*» il database risponde bene
       anche quando l'aggiornamento non e' stato eseguito, e uscirebbe un
       foglio con tutte le fasi «senza durata» invece di dire cosa fare. */
    const rc=await sb.from("gest_computo_capitoli")
      .select("id,numero,titolo,ordine,giorni,insieme")
      .eq("user_id",sbUid).eq("computo_id",id).order("ordine");
    if(rc.error){
      toast(/giorni|insieme/i.test(String(rc.error.message||""))
        ? "Per il cronoprogramma serve l'aggiornamento del database: esegui sql/gest-computo-cronoprogramma.sql su Supabase"
        : "Non riesco a leggere i capitoli: "+(rc.error.message||""));
      return;
    }
    const caps=rc.data||[];
    if(!caps.length){toast("Questo computo non ha capitoli: il cronoprogramma si fa a fasi, e le fasi sono i capitoli.");return;}
    if(!inizioTesto){toast("Manca la data di partenza: scrivila in «Si comincia il», premi Salva, poi scarica il PDF.");return;}

    const righe=cronoDate(caps,inizioTesto);
    const sc=cronoScala(righe);
    if(!sc.primo||!sc.ultimo){toast("Nessuna fase ha una durata: scrivi i giorni di almeno una fase, premi Salva, poi scarica il PDF.");return;}
    const giorniLav=_cgGiorniLav(sc.primo,sc.ultimo);
    const mesi=cronoMesi(sc.primo,sc.ultimo);

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4",orientation:"landscape"});
    /* N. | FASE | giorni | inizio | fine | il calendario
       X[i] e' il bordo SINISTRO della colonna i; X[6] e' il bordo destro. */
    const X=[10,18,104,120,142,164,287];
    const M=X[0], R=X[6], GX=X[5], GW=R-GX;
    const FONDO=176;                       /* il foglio orizzontale e' alto 210 */
    const mid=(a,b)=>(X[a]+X[b])/2;
    /* dove cade sul foglio un giorno del calendario */
    const gx=d=>GX+_cgQuanti(sc.primo,d)*GW/sc.arco;
    /* le righe verticali che separano un mese dall'altro (la prima no: e' il
       bordo della colonna) */
    const sepMesi=mesi.map(ms=>gx(ms.da)).filter(x=>x>GX+0.2);

    let y=0, tabTop=0;

    function chiudiCorpo(){
      doc.setDrawColor(110);doc.setLineWidth(.2);
      for(let i=1;i<=5;i++)doc.line(X[i],tabTop,X[i],y);
      doc.line(M,tabTop,M,y);doc.line(R,tabTop,R,y);doc.line(M,y,R,y);
    }
    /* ⚠️ LE RIGHE DEI MESI VANNO SOTTO LE BARRE, NON SOPRA.
       Disegnate alla fine, passavano sopra le barre e una fase lunga
       sembrava spezzata in due. Visto guardando il foglio stampato, non il
       codice: nel testo del PDF non si vede niente di tutto questo. */
    function grigliaMesi(alt){
      doc.setDrawColor(215);
      sepMesi.forEach(x=>doc.line(x,y,x,y+alt));
      doc.setDrawColor(110);
    }
    function testaTabella(){
      const h1=4.6,h2=4.4,H=h1+h2;
      doc.setFillColor(238,241,243);doc.rect(M,y,R-M,H,"F");
      doc.setDrawColor(110);doc.setLineWidth(.2);doc.rect(M,y,R-M,H);
      doc.setFont("helvetica","bold");doc.setFontSize(6.6);doc.setTextColor(0);
      doc.text("CALENDARIO",mid(5,6),y+3.2,{align:"center"});
      doc.line(X[5],y+h1,X[6],y+h1);
      const b=y+H-1.5;
      doc.text("N.",mid(0,1),b,{align:"center"});
      doc.text("FASE",mid(1,2),b,{align:"center"});
      doc.text("giorni",mid(2,3),b,{align:"center"});
      doc.text("inizio",mid(3,4),b,{align:"center"});
      doc.text("fine",mid(4,5),b,{align:"center"});
      /* il nome del mese si scrive solo se ci sta: sotto i 9 mm «set 26»
         finirebbe addosso a quello dopo */
      doc.setFontSize(6);
      mesi.forEach(function(ms){
        const x1=gx(ms.da), x2=gx(ms.a)+GW/sc.arco;
        if(x1>GX+0.2){doc.setDrawColor(150);doc.line(x1,y+h1,x1,y+H);doc.setDrawColor(110);}
        if(x2-x1>=9)doc.text(MESI_BREVI[ms.m]+" "+String(ms.y).slice(2),(x1+x2)/2,b,{align:"center"});
      });
      doc.setFontSize(6.6);
      [1,2,3,4,5].forEach(i=>doc.line(X[i],y,X[i],y+H));
      y+=H;tabTop=y;
    }
    function nuovaPagina(){
      chiudiCorpo();
      doc.addPage();y=13;testaTabella();
      doc.setFont("helvetica","normal");doc.setTextColor(0);
    }
    const spazio=h=>{if(y+h>FONDO)nuovaPagina();};
    /* ⚠️ DOPO CHE LA TABELLA E' CHIUSA SI USA QUESTO, NON spazio() — e' lo
       stesso inciampo del PDF del computo dell'11 agosto: spazio() chiama
       nuovaPagina(), che richiude una tabella che non c'e' piu' e apre il
       foglio dopo con l'intestazione di una tabella vuota. */
    const spazioFuoriTabella=h=>{if(y+h>FONDO){doc.addPage();y=16;}};

    /* ---- intestazione, solo sulla prima pagina ---- */
    y=14;
    doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    let hy=y+4.8;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=3.8;});
    doc.setTextColor(0);
    doc.setFont("helvetica","bold");doc.setFontSize(13);
    doc.text("CRONOPROGRAMMA DEI LAVORI",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    doc.text((c.numero?"Computo n. "+c.numero+"     ":"")+"del "+fdate(c.data||todayStr()),R,y+4.8,{align:"right"});
    if(c.tipo==="pubblico")doc.text("lavori pubblici",R,y+8.6,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+13)+1;doc.setDrawColor(180);doc.line(M,y,R,y);y+=6;

    doc.setFont("helvetica","bold");doc.setFontSize(10.5);
    const tit=doc.splitTextToSize(c.titolo||_cm('nome'),R-M);
    doc.text(tit,M,y);y+=tit.length*4.6+0.5;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    if(c.oggetto){const o=doc.splitTextToSize("Oggetto: "+c.oggetto,R-M);doc.text(o,M,y);y+=o.length*3.9;}
    if(c.luogo){doc.text("Luogo: "+c.luogo,M,y);y+=3.9;}
    if(cli.nome){doc.text("Committente: "+cli.nome+(cli.indirizzo?" - "+cli.indirizzo:""),M,y);y+=3.9;}
    doc.text("Si comincia il "+fdate(inizioTesto)+"   ·   consegna prevista il "+fdate(_cgIso(sc.ultimo)),M,y);y+=3.9;
    doc.setTextColor(0);y+=4;

    testaTabella();

    /* ---- il corpo: una riga per fase ---- */
    let n=0;
    righe.forEach(function(r){
      n++;
      const cp=r.cap||{};
      /* il titolo del capitolo lo scrive l'utente: si stampa com'e' */
      const tt=doc.splitTextToSize(String((cp.numero?cp.numero+" - ":"")+(cp.titolo||"(capitolo senza titolo)")),X[2]-X[1]-3);
      const H=Math.max(tt.length*3.6+3.4,7.6);
      spazio(H+2);
      grigliaMesi(H);
      const yb=y+H/2+1.2;
      doc.setFont("helvetica","bold");doc.setFontSize(7.4);
      doc.text(String(n),mid(0,1),yb,{align:"center"});
      doc.setFont("helvetica","normal");
      tt.forEach((t,i)=>doc.text(t,X[1]+1.5,y+4.2+i*3.6));
      doc.setFont("helvetica","bold");
      doc.text(r.giorni>0?String(r.giorni):"-",mid(2,3),yb,{align:"center"});
      doc.setFont("helvetica","normal");
      doc.text(r.inizio?fdate(_cgIso(r.inizio)):"-",mid(3,4),yb,{align:"center"});
      doc.text(r.fine?fdate(_cgIso(r.fine)):"-",mid(4,5),yb,{align:"center"});
      /* LA BARRA: posizione e larghezza vengono da _cgBarraPerc, la stessa
         che disegna lo schermo. Qui si converte solo da percentuale a
         millimetri. */
      const b=_cgBarraPerc(r,sc.primo,sc.arco);
      if(b){
        /* le fasi in parallelo in blu scuro: a schermo sono a righe, e le
           righe diagonali su una stampante in bianco e nero spariscono */
        if(r.parallelo)doc.setFillColor(11,75,196);else doc.setFillColor(0,102,255);
        doc.rect(GX+b.sx*GW/100, y+H/2-1.9, b.larg*GW/100, 3.8, "F");
      }
      y+=H;
      doc.setDrawColor(215);doc.line(M,y,R,y);
    });
    chiudiCorpo();

    /* ---- il riquadro con i giorni totali ---- */
    y+=6;spazioFuoriTabella(18);
    doc.setDrawColor(11,75,196);doc.setLineWidth(.5);doc.rect(M,y,R-M,11);doc.setLineWidth(.2);
    doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(0);
    doc.text(giorniLav+(giorniLav===1?" giorno":" giorni")+" di lavoro",M+3,y+7.2);
    doc.text("dal "+fdate(_cgIso(sc.primo))+" al "+fdate(_cgIso(sc.ultimo)),R-3,y+7.2,{align:"right"});
    y+=17;

    spazioFuoriTabella(14);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    const nota=doc.splitTextToSize("I giorni indicati sono giorni di lavoro: sabato e domenica non si contano. Ogni fase comincia quando finisce quella precedente; le fasi in blu scuro cominciano insieme alla precedente e si svolgono in parallelo.",R-M);
    nota.forEach(function(riga){ if(y+3.9>FONDO+14){doc.addPage();y=16;} doc.text(riga,M,y);y+=3.9; });
    doc.setTextColor(0);y+=6;

    spazioFuoriTabella(24);
    doc.setFontSize(9);
    doc.text((c.luogo?String(c.luogo).split(",").pop().trim()+", ":"")+fdate(todayStr()),M,y);
    y+=14;
    doc.setFont("helvetica","bold");
    doc.text("TIMBRO E FIRMA",R-40,y,{align:"center"});
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(120);
    doc.text("____________________________",R-40,y+4.6,{align:"center"});
    doc.setTextColor(0);

    const np=doc.getNumberOfPages();
    for(let p=1;p<=np;p++){
      doc.setPage(p);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140);
      doc.text("CRONOPROGRAMMA"+(c.numero?"  ·  computo n. "+c.numero:"")+(c.titolo?"  ·  "+c.titolo:""),M,203,{maxWidth:210});
      doc.text("Pag. "+p+" di "+np,R,203,{align:"right"});
      doc.setTextColor(0);
    }
    doc.save("cronoprogramma-"+(c.numero||"").replace(/[^a-z0-9]+/gi,"-")+"-"+
      (c.titolo||"computo").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)+".pdf");
    toast("Cronoprogramma scaricato ✅");
  }

  /* ============================================================
     21 agosto 2026 — IL COMPUTO DI VARIANTE IN PDF
     ============================================================
     Sui privati e' il foglio che toglie le liti: nero su bianco, cosa e'
     cambiato e quanto costa in piu' o in meno, con una firma sotto. Sui
     pubblici e' un documento vero da consegnare.

     ⛔ IL CONFRONTO NON SI RIFA' QUI: lo fa varConfronta, la stessa che
        disegna la pagina «Cosa e' cambiato». Il foglio e lo schermo non
        possono dire due cose diverse.

     ⛔ SI ACCOPPIA PER origine_id, mai per codice ne' per descrizione —
        il motivo lungo sta sopra varConfronta.

     ⚠️ E CI SI FERMA SE I CONTI NON TORNANO. Le righe stampate
        (cambiate + aggiunte - tolte) devono fare esattamente la
        differenza scritta nel riquadro in fondo. Se non la fanno, il
        foglio direbbe una cifra che le sue stesse righe non dimostrano:
        meglio nessun PDF che un PDF cosi'. E' la lezione del computo del
        14 agosto, dove il foglio usciva con dentro un buco che non si
        vedeva e il messaggio diceva pure «scaricato ✅».
     ============================================================ */
  async function variantePdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    if(!sb||!sbUid){toast("Devi essere collegato");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}
    if(!c.variante_di){toast("Questo computo non è una variante: non c'è niente da confrontare.");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const cli=await cliDelDocumento(c.cliente_id,"nome,indirizzo,referente");

    const [rO,rN,rP]=await Promise.all([
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",c.variante_di).order("ordine"),
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",c.id).order("ordine"),
      sb.from("gest_computi").select("id,numero,titolo,data").eq("id",c.variante_di).eq("user_id",sbUid).maybeSingle()
    ]);
    if(rO.error||rN.error){
      const e=rO.error||rN.error;
      toast(/origine_id|variante_di/i.test(String(e.message||""))
        ? "Per la variante serve l'aggiornamento del database: esegui sql/gest-computo-variante.sql su Supabase"
        : "Non riesco a leggere il confronto: "+(e.message||""));
      return;
    }
    const orig=rO.data||[], nuove=rN.data||[];
    /* ⚠️ senza origine_id il confronto direbbe che e' cambiato TUTTO:
       un foglio del genere non si stampa, si dice cosa eseguire. */
    if(varVistaSenzaOrigine(orig,nuove)){
      toast("Per la variante serve l'aggiornamento del database: esegui sql/gest-variante-origine-vista.sql su Supabase");
      return;
    }
    const part=(rP&&!rP.error)?rP.data:null;
    if(!orig.length&&!part){
      toast("Il computo di partenza non c'è più: non c'è niente con cui confrontare questa variante.");
      return;
    }

    const r=varConfronta(orig,nuove);
    if(!r.cambiate.length&&!r.aggiunte.length&&!r.tolte.length){
      toast("Per ora non è cambiato niente: il foglio direbbe soltanto che i due computi sono uguali.");
      return;
    }

    /* ⚠️ LA PROVA DEL NOVE, PRIMA DI DISEGNARE QUALSIASI COSA.
       Le righe rimaste identiche si annullano fra i due computi, quindi la
       somma di quelle stampate DEVE fare la differenza del riquadro. Se non
       la fa, o il confronto ha perso una riga o il riquadro dice un'altra
       cosa: in tutti e due i casi il foglio non si stampa. */
    const _imp=v=>(+v.quantita||0)*(+v.prezzo_unitario||0);
    const sommaStampata=
        r.cambiate.reduce((s,x)=>s+(x.impB-x.impA),0)
      + r.aggiunte.reduce((s,v)=>s+_imp(v),0)
      - r.tolte.reduce((s,v)=>s+_imp(v),0);
    if(Math.abs(sommaStampata-r.diff)>0.05){
      toast("Errore: le righe del confronto non fanno la differenza in fondo. Non ti do un foglio che non dimostra il suo stesso totale — riapri il computo e riprova.");
      return;
    }

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    /* N. | Tariffa | Descrizione | u.m. | Quantità | Prezzo unit. | Importo | Differenza */
    const X=[10,17,36,104,114,132,152,174,200];
    const M=X[0], R=X[8], FONDO=268;
    const mid=(a,b)=>(X[a]+X[b])/2;
    /* ⚠️ «useGrouping:true» NON si toglie: senza, sullo stesso foglio si legge
       «€ 97.000,00» e due righe sotto «€ 3000,00». */
    const _eur=n=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n||0);
    /* ⚠️ 21 agosto 2026 — «useGrouping:true» ANCHE QUI, e non e' un dettaglio.
       Senza, Intl in italiano mette il punto delle migliaia solo dai cinque
       numeri in su: sul primo foglio uscito dal banco si leggeva
       «€ 11.001,00» nel riquadro in fondo e «2220,00» due colonne piu' su,
       sulla stessa pagina. E' lo stesso difetto trovato il 19 agosto sul
       quadro economico, guardando una fotografia. */
    const _d2 =n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n||0);
    const _q3 =n=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:true}).format(+n||0);

    let y=0, tabTop=0, nRiga=0;

    function chiudiCorpo(){
      doc.setDrawColor(110);doc.setLineWidth(.2);
      for(let i=1;i<=7;i++)doc.line(X[i],tabTop,X[i],y);
      doc.line(M,tabTop,M,y);doc.line(R,tabTop,R,y);doc.line(M,y,R,y);
    }
    function testaTabella(){
      const H=6.4;
      doc.setFillColor(238,241,243);doc.rect(M,y,R-M,H,"F");
      doc.setDrawColor(110);doc.setLineWidth(.2);doc.rect(M,y,R-M,H);
      doc.setFont("helvetica","bold");doc.setFontSize(6.6);doc.setTextColor(0);
      const b=y+H-2.1;
      doc.text("N.",mid(0,1),b,{align:"center"});
      doc.text("Tariffa",mid(1,2),b,{align:"center"});
      doc.text("Descrizione dei lavori",mid(2,3),b,{align:"center"});
      doc.text("u.m.",mid(3,4),b,{align:"center"});
      doc.text("Quantità",mid(4,5),b,{align:"center"});
      doc.text("Prezzo unit.",mid(5,6),b,{align:"center"});
      doc.text("Importo",mid(6,7),b,{align:"center"});
      doc.text("Differenza",mid(7,8),b,{align:"center"});
      [1,2,3,4,5,6,7].forEach(i=>doc.line(X[i],y,X[i],y+H));
      y+=H;tabTop=y;
    }
    function nuovaPagina(){
      chiudiCorpo();
      doc.addPage();y=13;testaTabella();
      doc.setFont("helvetica","normal");doc.setTextColor(0);
    }
    const spazio=h=>{if(y+h>FONDO)nuovaPagina();};
    const spazioFuoriTabella=h=>{if(y+h>FONDO){doc.addPage();y=16;}};

    /* il titolo di un gruppo (Cambiate · Aggiunte · Tolte) */
    function gruppo(t,quante){
      spazio(9);
      doc.setFillColor(246,247,249);doc.rect(M,y,R-M,5.6,"F");
      doc.setFont("helvetica","bold");doc.setFontSize(7.6);doc.setTextColor(0);
      doc.text(t+"  ("+quante+")",X[1]+1.5,y+3.9);
      y+=5.6;doc.setDrawColor(200);doc.line(M,y,R,y);
    }

    /* UNA VOCE. «linee» sono le righe di numeri sotto la descrizione:
       una sola (aggiunta o tolta) oppure due (prima / adesso). */
    function voce(v,linee,diff){
      nRiga++;
      /* ⛔ la descrizione arriva dal prezzario: si stampa com'e', non si
         tocca e non passa da nessuna traduzione (regola del 20 agosto). */
      const desc=doc.splitTextToSize(String(v.descrizione||"(senza descrizione)"),X[3]-X[2]-3);
      const cod=doc.splitTextToSize(String(v.codice||""),X[2]-X[1]-3);
      const H=3.6+Math.max(desc.length,cod.length,1)*3.5+linee.length*3.8+1.6;
      spazio(H+2);
      doc.setFont("helvetica","bold");doc.setFontSize(7.4);
      doc.text(String(nRiga),mid(0,1),y+4.6,{align:"center"});
      doc.setFont("helvetica","normal");doc.setFontSize(6.8);
      cod.forEach((t,i)=>doc.text(t,X[1]+1.5,y+4.6+i*3.2));
      doc.setFontSize(7.4);
      desc.forEach((t,i)=>doc.text(t,X[2]+1.5,y+4.6+i*3.5));

      let yl=y+3.6+Math.max(desc.length,cod.length,1)*3.5+2.8;
      linee.forEach(function(L){
        doc.setFontSize(7);
        doc.setTextColor(L.et==="adesso"?0:120);
        doc.text(L.et,X[2]+4,yl);
        doc.text(_umPdf(v.unita||""),mid(3,4),yl,{align:"center"});
        doc.text(_q3(L.q),X[5]-1.5,yl,{align:"right"});
        doc.text(_d2(L.p),X[6]-1.5,yl,{align:"right"});
        doc.text(_d2(L.imp),X[7]-1.5,yl,{align:"right"});
        doc.setTextColor(0);
        yl+=3.8;
      });
      /* la differenza, in fondo alla voce e in grassetto: e' l'unica cosa
         che si guarda davvero */
      doc.setFont("helvetica","bold");doc.setFontSize(8);
      doc.text((diff>=0?"+ ":"- ")+_d2(Math.abs(diff)),R-1.5,yl-3.8,{align:"right"});
      doc.setFont("helvetica","normal");
      y+=H;
      doc.setDrawColor(215);doc.line(M,y,R,y);
    }

    /* ---- intestazione ---- */
    y=14;
    doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    let hy=y+4.8;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=3.8;});
    doc.setTextColor(0);
    doc.setFont("helvetica","bold");doc.setFontSize(13);
    doc.text("COMPUTO DI VARIANTE",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    doc.text((c.numero?"N. "+c.numero+"     ":"")+"del "+fdate(c.data||todayStr()),R,y+4.8,{align:"right"});
    if(c.tipo==="pubblico")doc.text("lavori pubblici",R,y+8.6,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+13)+1;doc.setDrawColor(180);doc.line(M,y,R,y);y+=6;

    doc.setFont("helvetica","bold");doc.setFontSize(10.5);
    const tit=doc.splitTextToSize(c.titolo||_cm('nome'),R-M);
    doc.text(tit,M,y);y+=tit.length*4.6+0.5;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    if(c.oggetto){const o=doc.splitTextToSize("Oggetto: "+c.oggetto,R-M);doc.text(o,M,y);y+=o.length*3.9;}
    if(c.luogo){doc.text("Luogo: "+c.luogo,M,y);y+=3.9;}
    if(cli.nome){doc.text("Committente: "+cli.nome+(cli.indirizzo?" - "+cli.indirizzo:""),M,y);y+=3.9;}
    doc.text("Variante del computo: "+(part
        ? ((part.numero?"n. "+part.numero+" - ":"")+(part.titolo||"(senza titolo)")+(part.data?"  ·  del "+fdate(part.data):""))
        : "(non più presente)"),M,y);y+=3.9;
    /* ⚠️ il singolare: usciva «le 1 righe rimaste uguali». Visto leggendo il
       foglio vero uscito dal banco, non il codice. */
    doc.text("Qui sotto c'è solo quello che è cambiato"
      +(r.uguali>0
        ? (r.uguali===1?": la riga rimasta uguale non è elencata."
                       :": le "+r.uguali+" righe rimaste uguali non sono elencate.")
        : "."),M,y);y+=3.9;
    doc.setTextColor(0);y+=4;

    testaTabella();

    /* ---- il corpo ---- */
    if(r.cambiate.length){
      gruppo("CAMBIATE",r.cambiate.length);
      r.cambiate.forEach(function(x){
        voce(x.voce,
             [{et:"prima", q:x.qA,p:x.pA,imp:x.impA},
              {et:"adesso",q:x.qB,p:x.pB,imp:x.impB}],
             x.impB-x.impA);
      });
    }
    if(r.aggiunte.length){
      gruppo("AGGIUNTE",r.aggiunte.length);
      r.aggiunte.forEach(function(v){
        const q=+v.quantita||0, p=+v.prezzo_unitario||0;
        voce(v,[{et:"adesso",q:q,p:p,imp:q*p}],q*p);
      });
    }
    if(r.tolte.length){
      gruppo("TOLTE",r.tolte.length);
      r.tolte.forEach(function(v){
        const q=+v.quantita||0, p=+v.prezzo_unitario||0;
        voce(v,[{et:"prima",q:q,p:p,imp:q*p}],-(q*p));
      });
    }
    chiudiCorpo();

    /* ---- i tre numeri che contano ---- */
    y+=7;spazioFuoriTabella(34);
    doc.setFont("helvetica","normal");doc.setFontSize(9.5);
    const conto=[["Computo di partenza",r.impOrig],["Variante",r.impVar]];
    conto.forEach(function(k){
      doc.text(k[0],X[2],y);
      doc.text(_eur(k[1]),R-1.5,y,{align:"right"});
      y+=5.6;
    });
    doc.setDrawColor(150);doc.line(X[2],y-3.2,R-1.5,y-3.2);
    y+=1;
    doc.setDrawColor(11,75,196);doc.setLineWidth(.5);doc.rect(M,y,R-M,11);doc.setLineWidth(.2);
    doc.setFont("helvetica","bold");doc.setFontSize(11);
    /* ⚠️ lo zero non è «in più»: stessa regola dello schermo. Succede quando
       quello che è stato tolto pareggia esattamente quello che è stato
       aggiunto — e su un documento «IN PIÙ € 0,00» è una contraddizione. */
    const pari=Math.abs(r.diff)<0.005;
    doc.text(pari?"NESSUNA DIFFERENZA":(r.diff>0?"IN PIÙ":"IN MENO"),M+3,y+7.2);
    doc.text(pari?_eur(0)
                :((r.diff>0?"+ ":"- ")+_eur(Math.abs(r.diff))
                  +(r.perc!=null?"   ("+(r.diff>0?"+":"-")+_pct(Math.abs(r.perc))+"%)":"")),
             R-3,y+7.2,{align:"right"});
    y+=17;

    spazioFuoriTabella(14);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    const nota=doc.splitTextToSize("Sono gli importi delle lavorazioni, senza il ribasso: il ribasso è lo stesso sui due computi e non cambia la differenza in percentuale.",R-M);
    nota.forEach(function(riga){ if(y+3.9>FONDO+10){doc.addPage();y=16;} doc.text(riga,M,y);y+=3.9; });
    doc.setTextColor(0);y+=6;

    /* le due firme: una variante la accettano in due */
    spazioFuoriTabella(28);
    doc.setFontSize(9);
    doc.text((c.luogo?String(c.luogo).split(",").pop().trim()+", ":"")+fdate(todayStr()),M,y);
    y+=14;
    doc.setFont("helvetica","bold");
    doc.text("IL COMMITTENTE",M+35,y,{align:"center"});
    doc.text("TIMBRO E FIRMA",R-35,y,{align:"center"});
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(120);
    doc.text("____________________________",M+35,y+4.6,{align:"center"});
    doc.text("____________________________",R-35,y+4.6,{align:"center"});
    doc.setTextColor(0);

    const np=doc.getNumberOfPages();
    for(let p=1;p<=np;p++){
      doc.setPage(p);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140);
      doc.text("COMPUTO DI VARIANTE"+(c.numero?"  ·  n. "+c.numero:"")+(c.titolo?"  ·  "+c.titolo:""),M,290,{maxWidth:150});
      doc.text("Pag. "+p+" di "+np,R,290,{align:"right"});
      doc.setTextColor(0);
    }
    doc.save("variante-"+(c.numero||"").replace(/[^a-z0-9]+/gi,"-")+"-"+
      (c.titolo||"computo").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)+".pdf");
    toast("Computo di variante scaricato ✅");
  }

  /* ============================================================
     22 agosto 2026 — L'ANALISI DEI PREZZI IN PDF
     ============================================================
     In una gara l'«analisi dei nuovi prezzi» e' un allegato: dentro ci
     sono TUTTE le lavorazioni il cui prezzo e' stato costruito, una
     dietro l'altra. Non un foglio per lavorazione — quello sarebbe un
     mucchio di fogli che nessuno tiene insieme.

     ⛔ IL CONTO NON SI RIFA' QUI. Lo fa il database (vista
        gest_analisi_totali, sql/gest-analisi-prezzi.sql), lo legge la
        schermata «Come e' fatto il prezzo» e lo legge questo foglio.
        Tre posti che guardano lo stesso numero, non tre posti che lo
        calcolano. E' la regola del 21 agosto.

     ⛔ E CI SI FERMA SE I CONTI NON TORNANO — tre controlli, prima di
        disegnare qualsiasi cosa (vedi _anPdfControlla). Il terzo e' il
        motivo per cui questo foglio esiste: il prezzo scritto qui DEVE
        essere lo stesso che il computo metrico usa per quella
        lavorazione. Se si scollassero, in gara si consegnerebbero due
        documenti che si contraddicono. Meglio nessun PDF.

     ⚠️ IL NUMERO DELLA LAVORAZIONE E' QUELLO DEL COMPUTO METRICO, non
        una numerazione nuova. Chi legge deve poter tornare al computo e
        ritrovare la riga: un codice che esiste solo su questo foglio non
        collega niente. Per questo si passa da _compGruppi, che mette le
        voci nello stesso ordine in cui le numera computoPdf: prima i
        capitoli in ordine, poi quelle senza capitolo.
     ============================================================ */

  /* Le voci raggruppate per capitolo, nell'ordine in cui vengono numerate
     sui fogli: i capitoli in ordine (anche quelli vuoti), e in fondo le
     voci senza capitolo.
     ⚠️ Questo stesso raggruppamento e' scritto a mano dentro computoPdf e
     dentro computoListaGara. NON le ho toccate oggi: spostare un pezzo di
     un documento che funziona e aggiungerne uno nuovo nello stesso push
     vuol dire non sapere piu' quale dei due ha rotto le cose. Il banco
     (banco-analisi-pdf.js) tiene le due copie verbatim e controlla che
     diano lo stesso ordine di questa: se un domani una delle tre cambia,
     diventa rosso. L'unificazione va fatta in un push suo. */
  function _compGruppi(voci,capitoli){
    const senzaCap=(voci||[]).filter(v=>!v.capitolo_id);
    const gruppi=(capitoli||[]).map(cap=>({cap:cap,
      voci:(voci||[]).filter(v=>String(v.capitolo_id)===String(cap.id))}));
    if(senzaCap.length)gruppi.push({cap:null,voci:senzaCap});
    return gruppi;
  }

  /* «un metro quadro», «un'ora», «una tonnellata».
     ⚠️ La tabella e' AN_UNO, la stessa dello schermo: NON una fila di
     .replace(), che il 21 agosto produsse «un metonnelitrolataro
     quintaleuadro». E la frase di ripiego e' identica a quella della
     schermata, cosi' il foglio e lo schermo dicono la stessa parola. */
  /* ⚠️ 22 agosto 2026 — UN PREZZARIO VERO SCRIVE «mq» DOVE LA TENDINA SCRIVE
     «m²». Visto da Alessio in una foto: nella stessa lista una lavorazione
     diceva «20,46 m²» e quella sotto «174,06 mq» — la prima scelta dalla
     tendina, la seconda arrivata da un prezzario importato.
     AN_UNO ha le chiavi della tendina: su «mq» non trovava niente e il foglio
     avrebbe scritto «l'analisi è per una unità di mq» e «PREZZO PER UNA UNITÀ
     DI MQ», invece di «un metro quadro». Su un documento di gara è brutto e
     sembra un errore.
     Quindi: prima si prova la chiave così com'è, poi si passa da _uniPiatta —
     la STESSA che usa l'importazione del prezzario per capire se due unità
     sono la stessa cosa — e si torna alla chiave della tendina.
     ⛔ Una tabella, non una fila di .replace(). */
  const AN_PIATTA={ "m":"m", "m2":"m²", "m3":"m³", "kg":"kg", "q":"q", "t":"t",
                    "cad":"cad", "corpo":"corpo", "ora":"ora", "giorno":"giorno", "l":"l" };
  function _anPdfUno(u){
    const uni=String(u==null?"":u).trim();
    if(AN_UNO[uni])return AN_UNO[uni];
    const chiave=AN_PIATTA[_uniPiatta(uni)];
    if(chiave&&AN_UNO[chiave])return AN_UNO[chiave];
    return uni?("una unità di "+uni):"una unità";
  }

  /* I TRE CONTROLLI. Torna "" se va tutto bene, oppure la frase da dire.
     Soglia: il centesimo, non lo zero esatto — due millesimi di euro si
     stampano comunque uguali, e un foglio che si rifiuta di uscire per
     due millesimi non lo si stampa mai. */
  function _anPdfControlla(v,t,righe){
    const nome=String(v.descrizione||"(senza descrizione)").slice(0,60);
    if(!t||!righe||!righe.length)
      return "«"+nome+"» risulta col prezzo costruito ma l'analisi non c'è più: riapri la lavorazione.";
    const somma=righe.reduce((s,r)=>s+(+r.quantita||0)*(+r.prezzo_unitario||0),0);
    if(Math.abs(somma-(+t.costi||0))>0.01)
      return "Su «"+nome+"» le righe stampate non fanno i costi diretti. Non ti do un foglio che non dimostra il suo stesso totale.";
    if(Math.abs((+t.costi||0)+(+t.spese||0)+(+t.utile||0)-(+t.prezzo||0))>0.01)
      return "Su «"+nome+"» costi + spese generali + utile non fanno il prezzo. Il foglio non esce.";
    /* ⛔ IL CONTROLLO PER CUI QUESTO FOGLIO ESISTE */
    if(Math.abs((+t.prezzo||0)-(+v.prezzo_unitario||0))>0.01)
      return "Su «"+nome+"» il prezzo dell'analisi e quello del computo non coincidono. In gara non si consegnano due fogli che si contraddicono: riapri la lavorazione e risalva.";
    return "";
  }

  async function analisiPdf(id){
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    if(!sb||!sbUid){toast("Devi essere collegato");return;}
    const c=compCache.find(x=>String(x.id)===String(id));
    if(!c){toast("Computo non trovato");return;}
    const {data:az}=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    if(!az||!az.nome){toast("Compila prima i Dati azienda");return aziendaForm();}
    const cli=await cliDelDocumento(c.cliente_id,"nome,indirizzo,referente");

    const [rc,rv]=await Promise.all([
      sb.from("gest_computo_capitoli").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine"),
      sb.from("gest_computo_voci_calc").select("*").eq("user_id",sbUid).eq("computo_id",id).order("ordine")
    ]);
    if(rc.error||rv.error){toast("Non riesco a leggere il computo: "+((rc.error||rv.error).message||""));return;}
    const capitoli=rc.data||[], voci=rv.data||[];
    if(!voci.length){toast("Il computo è vuoto: non c'è nessun prezzo da analizzare");return;}

    /* ⚠️ SE L'AGGIORNAMENTO DEL DATABASE NON C'E', NON SI MENTE.
       Senza la colonna prezzo_da_analisi il foglio direbbe «nessuna
       lavorazione ha l'analisi» — che e' una bugia con l'aria di essere
       giusta. E' la lezione della variante del 21 agosto: si guarda la
       COLONNA, non il valore (su un computo normale e' legittimamente
       falsa su tutte le righe). */
    if(!voci.some(v=>Object.prototype.hasOwnProperty.call(v,"prezzo_da_analisi"))){
      toast("Per l'analisi dei prezzi serve l'aggiornamento del database: esegui sql/gest-analisi-prezzi.sql su Supabase");
      return;
    }

    /* le voci col prezzo costruito, NELLO STESSO ORDINE E COLLO STESSO
       NUMERO che hanno sul computo metrico */
    const inFila=[];
    let n=0;
    _compGruppi(voci,capitoli).forEach(function(g){
      g.voci.forEach(function(v){
        n++;
        if(v.prezzo_da_analisi===true)inFila.push({n:n,v:v,cap:g.cap});
      });
    });
    if(!inFila.length){
      toast("Nessuna lavorazione ha l'analisi dei prezzi: aprine una e costruisci il prezzo sotto «Come è fatto il prezzo».");
      return;
    }

    const ids=inFila.map(x=>x.v.id);
    const [rr,rt]=await Promise.all([
      sb.from("gest_analisi_righe").select("*").eq("user_id",sbUid).in("voce_id",ids).order("ordine"),
      sb.from("gest_analisi_totali").select("*").eq("user_id",sbUid).in("voce_id",ids)
    ]);
    /* ⚠️ 14 agosto 2026, la lezione del computo: se questa lettura fallisce
       e non si guarda, il foglio esce LO STESSO — coi prezzi in fondo e
       senza le righe che li fanno. Un documento che dice una cosa e non la
       dimostra, col messaggio «scaricato ✅» sotto. */
    if(rr.error||rt.error){
      const e=rr.error||rt.error;
      toast(/gest_analisi|does not exist|schema cache|relation/i.test(String(e.message||""))
        ? "Per l'analisi dei prezzi serve l'aggiornamento del database: esegui sql/gest-analisi-prezzi.sql su Supabase"
        : "Non riesco a leggere l'analisi: il foglio verrebbe fuori senza le righe che fanno il prezzo. Riprova fra un momento. ("+String(e.message||"")+")");
      return;
    }
    const righeDi={};(rr.data||[]).forEach(r=>{(righeDi[r.voce_id]=righeDi[r.voce_id]||[]).push(r);});
    const totDi={};  (rt.data||[]).forEach(t=>{ totDi[t.voce_id]=t; });

    /* ⛔ LA PROVA DEL NOVE, PRIMA DI DISEGNARE QUALSIASI COSA */
    for(let i=0;i<inFila.length;i++){
      const guaio=_anPdfControlla(inFila[i].v,totDi[inFila[i].v.id],righeDi[inFila[i].v.id]);
      if(guaio){toast(guaio);return;}
    }

    const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"});
    /* Descrizione | u.m. | Quantità | Prezzo unit. | Importo */
    const X=[10,118,132,152,174,200];
    const M=X[0], R=X[5], FONDO=268;
    const mid=(a,b)=>(X[a]+X[b])/2;

    /* ⚠️ «useGrouping:true» SU OGNI AIUTANTE, non solo su quello dei totali.
       Senza, Intl in italiano mette il punto delle migliaia solo dai cinque
       numeri in su: sullo stesso foglio si legge «€ 11.001,00» e, due
       colonne più su, «2220,00». Trovato il 19 agosto sul quadro economico
       e di nuovo il 21 sulla variante, tutte e due le volte guardando una
       fotografia. */
    const _eur=n2=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n2||0);
    const _d2 =n2=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(+n2||0);
    const _q3 =n2=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:true}).format(+n2||0);
    const _pc =n2=>new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n2||0);

    let y=0, tabTop=0;

    function chiudiCorpo(){
      if(!tabTop)return;
      doc.setDrawColor(110);doc.setLineWidth(.2);
      for(let i=1;i<=4;i++)doc.line(X[i],tabTop,X[i],y);
      doc.line(M,tabTop,M,y);doc.line(R,tabTop,R,y);doc.line(M,y,R,y);
    }
    function testaTabella(){
      const H=6.2;
      doc.setFillColor(238,241,243);doc.rect(M,y,R-M,H,"F");
      doc.setDrawColor(110);doc.setLineWidth(.2);doc.rect(M,y,R-M,H);
      doc.setFont("helvetica","bold");doc.setFontSize(6.6);doc.setTextColor(0);
      const b=y+H-2.1;
      doc.text("Descrizione",X[0]+2,b);
      doc.text("u.m.",mid(1,2),b,{align:"center"});
      doc.text("Quantità",mid(2,3),b,{align:"center"});
      doc.text("Prezzo unit.",mid(3,4),b,{align:"center"});
      doc.text("Importo",mid(4,5),b,{align:"center"});
      [1,2,3,4].forEach(i=>doc.line(X[i],y,X[i],y+H));
      y+=H;tabTop=y;
      doc.setFont("helvetica","normal");doc.setTextColor(0);
    }
    /* ⚠️ 22 agosto 2026 — UNA PAGINA NON COMINCIA CON UN PREZZO SENZA NOME.
       Se un'analisi e' cosi' lunga da non stare in una pagina, la seconda
       pagina si apriva con «Costi diretti / Spese generali / PREZZO PER UN
       METRO QUADRO» e basta: chi la legge non sa di quale lavorazione sia.
       Su un documento di gara e' un difetto grosso. Adesso, quando un blocco
       continua, in cima si ripete «N. 4 · Tariffa NP.02 — segue».
       Visto guardando il foglio stampato, non il codice. */
    let inCorso=null;
    function segue(){
      if(!inCorso)return;
      doc.setFillColor(240,242,244);doc.rect(M,y,R-M,5,"F");
      doc.setFont("helvetica","bold");doc.setFontSize(7.6);doc.setTextColor(60);
      doc.text("N. "+inCorso.n+(inCorso.v.codice?"   ·   Tariffa "+String(inCorso.v.codice):"")+"   —   segue",M+2,y+3.5);
      doc.setTextColor(0);doc.setFont("helvetica","normal");
      y+=5+2;
    }
    function nuovaPagina(){
      chiudiCorpo();
      doc.addPage();y=13;segue();testaTabella();
    }
    const spazio=h=>{if(y+h>FONDO)nuovaPagina();};
    function fuoriTabella(h){
      if(y+h>FONDO){chiudiCorpo();tabTop=0;doc.addPage();y=16;segue();}
    }

    /* ---- intestazione ---- */
    y=14;
    doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    let hy=y+4.8;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t=>{doc.text(t,M,hy);hy+=3.8;});
    doc.setTextColor(0);
    doc.setFont("helvetica","bold");doc.setFontSize(13);
    doc.text("ANALISI DEI PREZZI",R,y,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    doc.text((c.numero?"N. "+c.numero+"     ":"")+"del "+fdate(c.data||todayStr()),R,y+4.8,{align:"right"});
    if(c.tipo==="pubblico")doc.text("lavori pubblici",R,y+8.6,{align:"right"});
    doc.setTextColor(0);
    y=Math.max(hy,y+13)+1;doc.setDrawColor(180);doc.line(M,y,R,y);y+=6;

    doc.setFont("helvetica","bold");doc.setFontSize(10.5);
    const tit=doc.splitTextToSize(c.titolo||_cm('nome'),R-M);
    doc.text(tit,M,y);y+=tit.length*4.6+0.5;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);
    if(c.oggetto){const o=doc.splitTextToSize("Oggetto: "+c.oggetto,R-M);doc.text(o,M,y);y+=o.length*3.9;}
    if(c.luogo){doc.text("Luogo: "+c.luogo,M,y);y+=3.9;}
    if(cli.nome){doc.text("Committente: "+cli.nome+(cli.indirizzo?" - "+cli.indirizzo:""),M,y);y+=3.9;}

    /* ⚠️ quante sono e quante NO: se non si scrive, chi legge crede che
       manchino delle lavorazioni. Il singolare va scritto, se no esce
       «le 1 lavorazioni» — il difetto del 21 agosto. */
    const senza=voci.length-inFila.length;
    doc.text((inFila.length===1
        ? "Qui sotto c'è l'unica lavorazione il cui prezzo è costruito con l'analisi"
        : "Qui sotto ci sono le "+inFila.length+" lavorazioni il cui prezzo è costruito con l'analisi")
      +(senza>0
        ? ": "+(senza===1?"l'altra lavorazione viene":"le altre "+senza+" lavorazioni vengono")
          +" dal prezzario o hanno il prezzo scritto a mano."
        : "."),M,y,{maxWidth:R-M});y+=3.9;
    doc.text("Ogni analisi è per UNA unità di misura: la quantità totale la mette il computo metrico con le misure.",M,y,{maxWidth:R-M});y+=3.9;
    doc.setTextColor(0);y+=4;

    /* ---- una lavorazione ---- */
    function blocco(x){
      const v=x.v, t=totDi[v.id], righe=(righeDi[v.id]||[]);
      const uniPdf=_umPdf(v.unita||"");
      const perUno=_anPdfUno(v.unita);

      /* la fascia col numero, la tariffa e la descrizione: il numero e' lo
         stesso del computo metrico */
      const testa=(x.cap&&(x.cap.numero||x.cap.titolo))
        ? String((x.cap.numero?x.cap.numero+" - ":"")+(x.cap.titolo||""))
        : "";
      /* ⛔ la descrizione arriva dal prezzario o l'ha scritta lui: si stampa
         com'e', non passa da nessuna traduzione (regola del 20 agosto). */
      const desc=doc.splitTextToSize(String(v.descrizione||"(senza descrizione)"),R-M-6);

      /* ⚠️ 22 agosto 2026 — UNA LAVORAZIONE NON SI SPEZZA SE PUO' STARE
         INTERA. Prima si guardava solo se ci stava l'intestazione: succedeva
         che la tabella finisse in fondo alla pagina e il conto (costi, spese,
         utile, prezzo) andasse da solo sulla pagina dopo, lasciando mezza
         pagina bianca. Su un documento di gara ogni nuovo prezzo si legge
         tutto insieme: quanto costa e come ci si arriva.
         Quindi si misura PRIMA quanto e' alto tutto il blocco; se non ci sta
         qui ma ci starebbe su una pagina vuota, si volta pagina subito.
         Se e' piu' alto di una pagina intera (analisi lunghissime) si spezza
         come prima, con l'intestazione della tabella che si ripete.
         Visto guardando il foglio stampato. */
      const nGruppi=AN_TIPI.filter(tp=>righe.some(r=>r.tipo===tp[0])).length;
      const altoRighe=righe.reduce(function(s,r){
        return s+Math.max(doc.splitTextToSize(String(r.descrizione||"(senza nome)"),X[1]-X[0]-3).length*3.4,3.4)+2.2;
      },0);
      const altoTotale=6+3.4+desc.length*4+1.2+4.4+6.2+nGruppi*5+altoRighe+3*4.6+10+20;   /* l'ultimo numero e' il margine di sicurezza */
      inCorso=null;                       /* la fascia del blocco nuovo non e' un «segue» */
      if(y+altoTotale>FONDO && altoTotale<=FONDO-16){ chiudiCorpo(); tabTop=0; doc.addPage(); y=16; }
      else fuoriTabella(26+desc.length*4);
      if(tabTop){chiudiCorpo();tabTop=0;y+=4;}
      inCorso=x;                          /* da qui in poi, se si volta pagina, si ripete chi e' */

      doc.setFillColor(232,238,236);doc.rect(M,y,R-M,6,"F");
      doc.setFont("helvetica","bold");doc.setFontSize(8.4);doc.setTextColor(0);
      doc.text("N. "+x.n+(v.codice?"   ·   Tariffa "+String(v.codice):""),M+2,y+4.1);
      if(testa){
        doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.setTextColor(80);
        doc.text(testa,R-2,y+4.1,{align:"right",maxWidth:(R-M)/2});
        doc.setTextColor(0);
      }
      y+=6+3.4;
      doc.setFont("helvetica","normal");doc.setFontSize(8.4);
      doc.text(desc,M,y);y+=desc.length*4+1.2;
      doc.setFontSize(7.6);doc.setTextColor(90);
      doc.text("Unità di misura: "+(uniPdf||"—")+"   ·   l'analisi è per "+perUno,M,y);
      doc.setTextColor(0);y+=4.4;

      testaTabella();

      /* le righe, raggruppate: su un'analisi i gruppi vanno separati, non
         messi in fila uno dietro l'altro.
         ⚠️ «Manodopera» con la MAIUSCOLA: per gli studi tecnici il
         gestionale riscrive «manodopera» in «tempo speso», e su un'analisi
         il termine giusto e' quello di legge. Le etichette vengono da
         AN_TIPI, che le ha gia' maiuscole. */
      AN_TIPI.forEach(function(tp){
        const gr=righe.filter(r=>r.tipo===tp[0]);
        if(!gr.length)return;                       /* il gruppo vuoto non si stampa */
        const sub=gr.reduce((s,r)=>s+(+r.quantita||0)*(+r.prezzo_unitario||0),0);
        spazio(6);
        doc.setFillColor(246,247,249);doc.rect(M,y,R-M,5,"F");
        doc.setFont("helvetica","bold");doc.setFontSize(7.4);
        doc.text(String(tp[1]).toUpperCase(),M+2,y+3.5);
        doc.text(_d2(sub),R-1.5,y+3.5,{align:"right"});
        y+=5;doc.setDrawColor(205);doc.line(M,y,R,y);
        doc.setFont("helvetica","normal");
        gr.forEach(function(r){
          const d=doc.splitTextToSize(String(r.descrizione||"(senza nome)"),X[1]-X[0]-3);
          const H=Math.max(d.length*3.4,3.4)+2.2;
          spazio(H+1);
          doc.setFontSize(7.4);
          d.forEach((tt,i)=>doc.text(tt,X[0]+2,y+3.4+i*3.4));
          const yb=y+3.4;
          doc.text(_umPdf(r.unita||""),mid(1,2),yb,{align:"center"});
          doc.text(_q3(r.quantita),X[3]-1.5,yb,{align:"right"});
          doc.text(_d2(r.prezzo_unitario),X[4]-1.5,yb,{align:"right"});
          doc.text(_d2((+r.quantita||0)*(+r.prezzo_unitario||0)),R-1.5,yb,{align:"right"});
          y+=H;
          doc.setDrawColor(225);doc.line(M,y,R,y);
        });
      });

      chiudiCorpo();tabTop=0;

      /* ---- il conto della lavorazione ---- */
      /* ⚠️ 22 agosto 2026 — IL RIQUADRO SI MISURA PRIMA DI DISEGNARLO.
         La prima versione scriveva «PREZZO PER UN METRO QUADRO» dentro un
         riquadro alto 10 mm con un maxWidth stretto: la scritta andava a
         capo, e la seconda riga («METRO QUADRO») usciva DAL riquadro e
         finiva sopra il «diconsi euro». Sul «PREZZO PER UN PEZZO» non
         succedeva, perche' e' piu' corto — cioe' il difetto si vedeva solo
         su certe unita' di misura.
         Trovato dal banco leggendo il foglio vero, non guardando il codice.
         Adesso: si misura quanto e' largo il prezzo, si spezza l'etichetta
         in quante righe servono, e il riquadro CRESCE. Vale anche per le
         unita' scritte a mano («una unita' di viaggio da 20 q.li»), che
         possono essere lunghe quanto vogliono. */
      const rig=[
        ["Costi diretti","",t.costi],
        ["Spese generali",_pc(t.spese_perc)+" %",t.spese],
        ["Utile",_pc(t.utile_perc)+" %",t.utile]
      ];
      const XB=X[1];                                  /* il riquadro del prezzo comincia qui */
      doc.setFont("helvetica","bold");doc.setFontSize(9.4);
      const prezzoTxt=_eur(t.prezzo);
      const largEt=Math.max((R-3)-doc.getTextWidth(prezzoTxt)-(XB+3)-5,24);
      const et=doc.splitTextToSize("PREZZO PER "+perUno.toUpperCase(),largEt);
      const HB=Math.max(10,3.6+et.length*4.6);
      fuoriTabella(rig.length*4.6+HB+18);
      /* ⚠️ ARIA fra la tabella e il conto. Con 2,5 mm il «Costi diretti»
         risultava incollato all'ultima riga della tabella e sembrava una
         riga della tabella senza bordi. E' lo stesso difetto della scritta
         grigia attaccata ai pulsanti, visto da Alessio il 21 agosto: qui
         l'ho visto guardando il foglio stampato, non il codice. */
      y+=6;
      doc.setFont("helvetica","normal");doc.setFontSize(8.4);
      rig.forEach(function(rg){
        doc.text(rg[0],XB,y);
        if(rg[1])doc.text(rg[1],X[4]-1.5,y,{align:"right"});
        doc.text(_eur(rg[2]),R-1.5,y,{align:"right"});
        y+=4.6;
      });
      doc.setDrawColor(150);doc.line(XB,y-3.1,R-1.5,y-3.1);
      y+=0.8;
      doc.setDrawColor(11,75,196);doc.setLineWidth(.5);doc.rect(XB-2,y,R-XB+2,HB);doc.setLineWidth(.2);
      doc.setFont("helvetica","bold");doc.setFontSize(9.4);
      const y0=y+(HB-et.length*4.6)/2+3.6;
      et.forEach((s,i)=>doc.text(s,XB+1,y0+i*4.6));
      doc.text(prezzoTxt,R-3,y+HB/2+1.6,{align:"right"});
      y+=HB+3;
      /* il prezzo in lettere: su un documento di gara ci va, ed e' la stessa
         funzione del computo (ha il suo banco dal 18 agosto) */
      doc.setFont("helvetica","normal");doc.setFontSize(7.6);doc.setTextColor(90);
      doc.text("(diconsi euro "+euroInLettere(t.prezzo)+")",XB,y);
      doc.setTextColor(0);y+=7;
      inCorso=null;                       /* il blocco e' finito */
    }

    inFila.forEach(blocco);

    /* ---- in fondo: la data e le firme ---- */
    fuoriTabella(30);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(0);
    doc.text((c.luogo?String(c.luogo).split(",").pop().trim()+", ":"")+fdate(todayStr()),M,y);
    y+=14;
    doc.setFont("helvetica","bold");
    /* sui lavori pubblici l'analisi la approva il Direttore dei Lavori e
       l'impresa l'accetta: due firme. Su un privato il foglio e' dell'impresa */
    if(c.tipo==="pubblico"){
      doc.text("IL DIRETTORE DEI LAVORI",M+38,y,{align:"center"});
      doc.text("TIMBRO E FIRMA",R-38,y,{align:"center"});
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(120);
      doc.text("____________________________",M+38,y+4.6,{align:"center"});
      doc.text("____________________________",R-38,y+4.6,{align:"center"});
    }else{
      doc.text("TIMBRO E FIRMA",R-40,y,{align:"center"});
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(120);
      doc.text("____________________________",R-40,y+4.6,{align:"center"});
    }
    doc.setTextColor(0);

    const np=doc.getNumberOfPages();
    for(let p=1;p<=np;p++){
      doc.setPage(p);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140);
      doc.text("ANALISI DEI PREZZI"+(c.numero?"  ·  computo n. "+c.numero:"")+(c.titolo?"  ·  "+c.titolo:""),M,290,{maxWidth:150});
      doc.text("Pag. "+p+" di "+np,R,290,{align:"right"});
      doc.setTextColor(0);
    }
    doc.save("analisi-prezzi-"+(c.numero||"").replace(/[^a-z0-9]+/gi,"-")+"-"+
      (c.titolo||"computo").replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,40)+".pdf");
    toast("Analisi dei prezzi scaricata ✅");
  }
