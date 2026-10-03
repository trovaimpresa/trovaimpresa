// [SPOSTATO] gest-ai-moduli.js: era dentro gest-core.js, righe 1843-3411, spostato identico.
  /* ============================================================
     LA STRISCIA DELL'AI SULLA HOME — 16 agosto 2026

     Tre cose, e sono quelle che un'impresa deve sapere appena entra:
       1. l'AI ce l'ho o no?
       2. quanti crediti mi restano?
       3. dove ne compro altri?

     Chiusa e' una riga sola. Si apre solo se uno vuole sapere DOVE si
     usa, perche' quello era il problema vero: i quattro pulsanti
     esistevano gia' ma stavano dentro sezioni che devi aprire prima, e
     nessuno ti diceva che c'erano.

     ⚠️ I COSTI QUI SOTTO NON SONO INVENTATI: sono presi da
     supabase/functions/ai-generate/index.ts, dove ogni funzione ha il
     suo `costo`. Preventivo, cliente e lavoro costano 1; l'assistente
     costa 0 e si mangia le 30 domande gratuite del mese.
     Se un domani cambiano li', vanno cambiati anche qui: sono due posti,
     e due posti si disallineano. E' il difetto numero 1 del giudizio.
     ============================================================ */
  let _aiStato=null;

  const _aiCrediti=n=>(n===1?"1 credito":n+" crediti");

  async function aiStrisciaCarica(){
    const box=$("#ai-striscia"); if(!box)return;
    if(!sb||!sbUid){box.hidden=true;return;}
    let st=null;
    try{const r=await sb.rpc("get_ai_status"); if(!r.error)st=r.data;}catch(e){}
    _aiStato=st;
    if(!st){box.hidden=true;return;}   /* vedi il commento nell'HTML */
    _aiStrisciaDisegna();
  }

  function _aiStrisciaDisegna(){
    const box=$("#ai-striscia"), st=_aiStato; if(!box||!st)return;
    const txt=$("#ai-str-txt"), cta=$("#ai-str-cta"), piu=$("#ai-str-piu"), giu=$("#ai-str-giu");
    if(!txt||!cta||!piu||!giu)return;

    const attiva = st.has_ai===true;
    const rest   = Number(st.remaining||0);
    const mese   = Number(st.monthly_left||0);
    const quota  = Number(st.monthly_quota||0);
    const extra  = Number(st.credits_extra||0);
    const aiuto  = Number(st.help_left||0);

    /* colore = stato, mai decorazione: verde quando ce n'e', arancione
       quando stanno finendo (sotto il 20% del mese), grigio quando l'AI
       non c'e'. */
    const pochi = attiva && quota>0 && rest<=Math.round(quota*0.2);
    box.classList.toggle("ai-str--spenta", !attiva);
    box.classList.toggle("ai-str--pochi", pochi);

    if(attiva){
      txt.innerHTML = "<b>"+_aiCrediti(rest)+"</b> da usare"
        + (pochi ? " — stanno finendo" : "");
      cta.textContent = "Ricarica";
      cta.href = "/ricarica-crediti.html";
    }else{
      if(window.GESTIONALE_BASE_APERTO===true){
        /* 3 ott 2026: col gestionale base gratis l'AI e' il piano a pagamento */
        txt.innerHTML = "<b>non è attiva</b> — c'è nell'assistenza AI";
        cta.textContent = "Attiva l'assistenza AI";
        cta.href = "/pannello-impresa.html?attiva=ai";
      }else{
      txt.innerHTML = "<b>non è attiva</b> — arriva col Gestionale";
      cta.textContent = "Vedi il Gestionale";
      cta.href = "/prezzi.html";
      }
    }

    const lavori = _lav();   /* 22 ago: la parola la dice _lav(), non un if suo */
    const rinnovo = st.renews_at ? quando(String(st.renews_at).slice(0,10)).testo : "";

    const conto = (n,et,nota)=>
      '<div class="ai-str-c"><div class="ai-str-cn">'+n+'</div>'
      + '<div class="ai-str-ce">'+et+'</div>'
      + (nota?'<div class="ai-str-cx">'+nota+'</div>':'')+'</div>';

    const posto = (tit,cosa,dove,costo,bottone)=>
      '<li class="ai-str-p"><div class="ai-str-pt">'+tit+'</div>'
      + '<div class="ai-str-pc">'+cosa+'</div>'
      + '<div class="ai-str-pd">'+dove+'</div>'
      + '<div class="ai-str-pp">'+costo+'</div>'
      + (bottone||'')+'</li>';

    giu.innerHTML =
      '<div class="ai-str-conti">'
      + conto(mese, "dei "+quota+" di questo mese", rinnovo?("si rinnovano "+rinnovo):"")
      + conto(extra, extra===1?"comprato":"comprati", "non scadono mai")
      + conto(aiuto, "domande gratis", "all'assistente, ogni mese")
      + '</div>'
      + '<div class="ai-str-tit">Dove lavora l\'AI</div>'
      + '<ul class="ai-str-posti">'
      + posto("Preventivi — «Genera con AI»",
              "Descrivi il lavoro a parole e ti prepara le voci di costo, una per una.",
              "Entra in un reparto, apri Preventivi: sta in alto a destra.",
              "1 credito")
      + posto(lavori+" — «Compila con AI»",
              "Scrivi com'è andata a parole e ti riempie il modulo da solo.",
              "Entra in un reparto, apri "+lavori+": sta in alto a destra.",
              "1 credito")
      + posto("Clienti — «Compila con AI»",
              "Incolli i dati come capita e ti mette ogni cosa al suo posto.",
              "Entra in un reparto, apri Clienti: sta in alto a destra.",
              "1 credito")
      + posto("Aiuto — l'assistente del gestionale",
              "Gli chiedi come si fa una cosa e te lo spiega, con le parole del gestionale.",
              "In alto a destra dentro un reparto — oppure da qui:",
              "gratis, "+aiuto+" domande rimaste questo mese",
              '<button type="button" class="ai-str-b" id="ai-str-aiuto">Chiedi all\'assistente</button>')
      + '</ul>';

    const ba = giu.querySelector("#ai-str-aiuto");
    if(ba) ba.onclick = function(){
      if(window.AI && window.AI.apriAiuto) window.AI.apriAiuto();
      else toast("L'assistente non si è ancora caricato, riprova fra un attimo");
    };

    piu.onclick = function(){
      const apro = giu.hasAttribute("hidden");
      if(apro) giu.removeAttribute("hidden"); else giu.setAttribute("hidden","");
      piu.setAttribute("aria-expanded", apro?"true":"false");
      piu.textContent = apro ? "Chiudi" : "Dove si usa";
    };

    box.hidden = false;
  }

  /* ============================================================
     L'AI DENTRO IL MODULO — 16 agosto 2026

     Prima il giro era questo: si apriva una finestrella, si scriveva,
     la finestrella SI CHIUDEVA, e poi compariva il modulo gia' pieno.
     Non vedevi mai cosa aveva fatto ne' quali caselle aveva toccato: se
     sbagliava una cosa ti ritrovavi in un modulo pieno di roba non tua e
     dovevi ricominciare da capo. Era una scatola nera, non un aiuto.

     Adesso la riga sta DENTRO il modulo, in cima, chiusa. La apri, scrivi
     a parole, e le caselle qui sotto si riempiono davanti agli occhi —
     illuminate per un attimo, cosi' vedi dove ha messo cosa. Se sbaglia,
     correggi quella casella: sei gia' nel modulo.

     ⚠️ NON SI SALVA NIENTE DA SOLO. L'AI riempie e basta: a premere
        «Crea» sei sempre tu, dopo aver guardato.
     ⚠️ I nomi delle caselle stanno in un posto solo (CAMPI qui sotto):
        se domani il modulo cambia, si cambia qui.
     ============================================================ */
  const AI_MODULI = {
    lavoro: {
      feature: 'dati_lavoro',
      titolo:  'Scrivilo a parole e te lo riempio io',
      esempio: 'Giovedì prossimo taglio siepe da Le Betulle, ci va Marco, 350 euro',
      campi: [
        { id:'j-desc',    da:'descrizione', nome:'Cosa c\'è da fare' },
        { id:'j-dove',    da:'dove',        nome:'Dove' },
        { id:'j-data',    da:'data',        nome:'Data prevista' },
        { id:'j-imp',     da:'importo',     nome:'Importo' },
        { id:'j-cliente', da:'cliente',     nome:'Cliente',  tendina:true },
        { id:'j-operaio', da:'operatore',   nome:'Chi ci va', tendina:true }
      ]
    },
    cliente: {
      feature: 'dati_cliente',
      titolo:  'Scrivilo a parole e te lo riempio io',
      esempio: 'Condominio Le Betulle, via Verdi 12 Milano, amministratore Rossi, 02 1234567',
      campi: [
        { id:'c-nome', da:'nome',      nome:'Nome' },
        { id:'c-ind',  da:'indirizzo', nome:'Via e numero' },
        { id:'c-ref',  da:'referente', nome:'Referente' },
        { id:'c-tel',  da:'telefono',  nome:'Telefono' }
      ]
    },
    /* ⚠️ 18 agosto 2026 — IL PREVENTIVO NON E' FATTO DI CASELLE SINGOLE.
       Lavoro e Cliente hanno quattro caselle in croce; qui la sostanza sono
       le VOCI DI COSTO, che sono righe che si aggiungono. Percio' oltre a
       `campi` questo modulo ha `extra`: una funzione che riempie le righe e
       le note. Tutto il resto (crediti, avvisi, illuminazione) resta uguale.

       La feature del server e' `preventivo`, quella che c'era gia' dietro la
       vecchia finestrella: risponde titolo, voci e note. Cliente e Data NON
       li sa (non stanno nella sua risposta) e restano a chi scrive: sono un
       clic sulla tendina e una data gia' compilata con oggi. */
    preventivo: {
      feature: 'preventivo',
      titolo:  'Scrivi il lavoro a parole e ti preparo le voci',
      esempio: 'Rifacimento bagno 6 mq: demolizione rivestimenti, impianto idraulico nuovo, piastrelle a pavimento e parete, sanitari sospesi, box doccia 90x70',
      campi: [
        { id:'pv-tit', da:'titolo', nome:'Titolo' }
      ],
      extra: aiRiempiPreventivo
    }
  };

  function aiRigaHTML(tipo){
    const m = AI_MODULI[tipo]; if(!m) return "";
    const pro = ruoloUtente==='professionista' && tipo==='lavoro';
    return '<div class="ai-riga" id="ai-riga">'
      + '<button type="button" class="ai-riga-apri" id="ai-riga-apri" aria-expanded="false" aria-controls="ai-riga-giu">'
      +   '<span class="ai-riga-mk">AI</span>'
      +   '<span class="ai-riga-t">' + (pro ? 'Scrivi la pratica a parole e te la riempio io' : m.titolo) + '</span>'
      +   '<span class="ai-riga-c">1 credito</span>'
      + '</button>'
      + '<div class="ai-riga-giu" id="ai-riga-giu" hidden>'
      +   '<label class="ai-riga-lab" for="ai-riga-in">Scrivi o parla come al telefono</label>'
      +   '<textarea id="ai-riga-in" rows="2" placeholder="' + esc(m.esempio) + '"></textarea>'
      /* ⛔ 22 agosto 2026 — LE MISURE, SCRITTE PRIMA DI SCRIVERE.
         Alessio aveva chiesto un preventivo per un bagno senza dire quanto
         era grande: l'AI si e' data da sola «bagno standard di circa 8 mq»
         e l'ha scritto solo nella nota in fondo, dove non lo legge nessuno.
         Poi non ha nemmeno usato la sua stessa misura (8 mq di pavimento,
         12 mq di pareti: un bagno da 8 mq rivestito a due metri fa il
         doppio). Una quantita' che manca e' peggio di un prezzo sbagliato:
         il prezzo strano si vede, il rivestimento dimezzato no.
         ⚠️ Deciso da Alessio: NON si chiede, si SCRIVE — «forse non serve
         richiedere i mq, basta scriverlo». Nessuna interruzione, nessun clic
         in piu'. La rete di sicurezza sta dall'altra parte: l'istruzione
         della funzione obbliga l'AI a dire nella PRIMA riga delle note
         quali misure ha supposto. */
      +   (m.feature==='preventivo'
            ? '<div class="campo-aiuto">Scrivi anche <b>quanti mq</b> e <b>fino a che altezza vanno le piastrelle</b> (di solito 1 m o 2 m): se no le quantità me le invento io.</div>'
            : '')
      +   '<div class="ai-riga-az">'
      +     '<button type="button" class="ai-riga-go" id="ai-riga-go">Riempi le caselle</button>'
      /* 26 set 2026 — «Parla»: in cantiere si parla, non si scrive
         (js/gest-ai-cantiere.js). Nasce nascosto: compare solo dove il
         browser sa ascoltare. */
      +     (typeof aiMicHTML==="function"?aiMicHTML("ai-riga-mic"):"")
      +     '<span class="ai-riga-st" id="ai-riga-st"></span>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  /* le tendine Cliente / Chi ci va si riempiono dopo, in un secondo momento:
     si riprova per qualche secondo finche' l'opzione col nome giusto compare.
     Confronto tollerante: minuscole, senza accenti, senza spazi ai bordi. */
  function _aiNorm(s){
    return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
  }
  function _aiTendina(sel, nome, entro, quandoFatto){
    if(!sel||!nome) return;
    const cerca=_aiNorm(nome), fine=Date.now()+(entro||3000);
    (function prova(){
      for(let i=0;i<sel.options.length;i++){
        if(_aiNorm(sel.options[i].textContent)===cerca){
          sel.value=sel.options[i].value;
          sel.dispatchEvent(new Event("change",{bubbles:true}));
          if(quandoFatto)quandoFatto();
          return;
        }
      }
      if(Date.now()<fine) setTimeout(prova,200);
    })();
  }

  function _aiIllumina(el){
    if(!el) return;
    el.classList.add("ai-pieno");
    setTimeout(()=>el.classList.remove("ai-pieno"),2600);
  }

  function aiRigaVia(tipo, apriSubito){
    const m = AI_MODULI[tipo]; if(!m) return;
    const riga=$("#ai-riga"), apri=$("#ai-riga-apri"), giu=$("#ai-riga-giu"),
          inp=$("#ai-riga-in"), go=$("#ai-riga-go"), st=$("#ai-riga-st");
    if(!riga||!apri||!giu||!inp||!go) return;

    function mostra(si){
      if(si) giu.removeAttribute("hidden"); else giu.setAttribute("hidden","");
      apri.setAttribute("aria-expanded", si?"true":"false");
      riga.classList.toggle("ai-riga--aperta", si);
      if(si) setTimeout(()=>inp.focus(),60);
    }
    apri.onclick=()=>mostra(giu.hasAttribute("hidden"));
    if(typeof aiMicrofono==="function") aiMicrofono($("#ai-riga-mic"),inp,st);

    /* ============================================================
       ⛔ 22 agosto 2026 — LE MISURE SI CHIEDONO PRIMA, E GRATIS
       ============================================================
       Segnalato da Alessio con la pagina vera davanti. Aveva scritto
       «rifacimento bagno completo chiavi in mano, piastrelle, sanitari...»
       SENZA nessuna misura. L'AI se n'e' inventata una — «bagno standard di
       circa 8 mq» — e l'ha scritto solo nella nota in fondo, dove non lo
       legge nessuno. Poi non ha nemmeno usato la sua stessa misura: 8 mq di
       pavimento e 12 mq di pareti, quando un bagno da 8 mq rivestito a due
       metri fa piu' del doppio.
       ⛔ Una quantita' che manca e' peggio di un prezzo sbagliato: il prezzo
       strano si vede, il rivestimento dimezzato no — il totale «sembra
       giusto» e l'impresa ci rimette la posa di mezzo bagno.

       ⚠️ La domanda si fa QUI, nel gestionale, PRIMA di chiamare l'AI:
       se a chiedere fosse l'AI costerebbe un credito e non porterebbe a casa
       nessun preventivo.

       ⚠️ E NON BLOCCA: si chiede una volta sola. Se premi di nuovo si va
       avanti lo stesso — ci sono lavori che una misura non ce l'hanno
       (sostituire una caldaia, montare un condizionatore). */
    go.onclick=async function(){
      const testo=inp.value.trim();
      if(!testo){ st.className="ai-riga-st ai-riga-st--err"; st.textContent="Scrivi due righe qui sopra e riprovo."; inp.focus(); return; }
      if(!window.AI||typeof window.AI.dati!=="function"){
        st.className="ai-riga-st ai-riga-st--err";
        st.textContent="L'assistente non si è caricato. Ricarica la pagina e riprova.";
        return;
      }
      const prima=go.textContent;
      go.disabled=true; go.textContent="Ci penso io...";
      st.className="ai-riga-st"; st.textContent="";
      try{
        const d=await window.AI.dati(m.feature,testo);
        if(d===null){ go.disabled=false; go.textContent=prima; return; }  /* crediti finiti: l'avviso l'ha già dato l'AI */
        const messi=[];
        m.campi.forEach(c=>{
          const v=d[c.da];
          if(v===undefined||v===null||String(v).trim()==="") return;
          const el=document.getElementById(c.id);
          if(!el) return;
          if(c.tendina){
            _aiTendina(el,v,3000,()=>_aiIllumina(el));
            messi.push(c.nome);
          }else{
            el.value=String(v);
            el.dispatchEvent(new Event("input",{bubbles:true}));
            _aiIllumina(el);
            messi.push(c.nome);
          }
        });
        /* i moduli che non sono fatti solo di caselle singole (il preventivo,
           che ha le righe) si riempiono qui: `extra` aggiunge al conto quello
           che ha messo, cosi' il messaggio finale resta uno solo. */
        if(typeof m.extra==="function") m.extra(d,messi);
        if(!messi.length){
          st.className="ai-riga-st ai-riga-st--err";
          st.textContent="Non ho capito niente di utile. Prova a scriverlo con più dettagli: cosa, dove, quando, quanto.";
        }else{
          st.className="ai-riga-st ai-riga-st--ok";
          st.textContent="Ho riempito "+messi.length+(messi.length===1?" casella: ":" caselle: ")
            + messi.join(", ") + ". Controlla e correggi quello che serve, poi salva tu.";
        }
      }catch(e){
        st.className="ai-riga-st ai-riga-st--err";
        st.textContent=(e&&e.message)?e.message:"Non ci sono riuscito. Riprova fra un attimo.";
      }
      go.disabled=false; go.textContent=prima;
    };

    inp.addEventListener("keydown",e=>{
      /* Invio manda, Maiuscole+Invio va a capo: nel modulo si scrive una
         frase sola, non un tema. */
      if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); go.click(); }
    });

    if(apriSubito) mostra(true);
  }

  /* ============================================================
     LE VOCI DI COSTO SCRITTE DALL'AI — 18 agosto 2026

     Lavoro e Cliente hanno solo caselle singole, e la riga dell'AI le
     riempie una per una. Il preventivo no: le voci sono RIGHE, e vanno
     aggiunte una sotto l'altra dentro #prev-righe.

     ⚠️ QUELLO CHE HAI SCRITTO A MANO NON SI TOCCA. Si tolgono solo le
        righe rimaste vuote (in un modulo nuovo ce n'e' una, vuota); se hai
        gia' scritto due voci tue, le voci dell'AI si mettono IN FONDO alle
        tue. Nessuno si e' mai visto cancellare quello che aveva scritto.
     ⚠️ NON SI SALVA NIENTE DA SOLO, come dappertutto: qui si riempie e
        basta, a premere «Crea preventivo» sei tu.
     ⚠️ I totali qui sotto vanno rifatti a mano: si aggiornano sull'evento
        "input", che scatta quando scrivi TU, non quando le righe le mette
        il programma. Senza questa riga il totale restava a zero con le
        voci sotto gia' scritte — due numeri diversi nella stessa finestra.
     ============================================================ */
  function aiRiempiPreventivo(d,messi){
    /* ---------- le voci di costo ---------- */
    const voci=(d&&Array.isArray(d.voci))?d.voci:[];
    const box=$("#prev-righe");
    if(box&&voci.length){
      $$("#prev-righe [data-riga]").forEach(function(r){
        const desc=r.querySelector(".pr-desc");
        if(!desc||!desc.value.trim()) r.remove();
      });
      let messe=0;
      voci.forEach(function(v){
        let desc=String((v&&v.descrizione)||"").trim();
        if(!desc) return;
        /* l'unita' di misura non ha una casella sua nel preventivo: va in
           coda alla descrizione, come faceva gia' il salvataggio dell'AI. */
        if(v.unita) desc+=" ("+String(v.unita).trim()+")";
        /* ⚠️ il prezzo che l'AI NON sa resta una casella VUOTA, non «0,00».
           Zero e' un prezzo deciso, e in fondo al preventivo verrebbe
           sommato come tale: una voce regalata senza che nessuno l'abbia
           detto. Vuoto invece si vede subito che manca. Il conto non cambia
           (una casella vuota vale zero lo stesso), cambia quello che leggi. */
        const pz=(v.prezzo_unitario==null||v.prezzo_unitario===""||!isFinite(+v.prezzo_unitario))
                   ? "" : (+v.prezzo_unitario);
        box.insertAdjacentHTML("beforeend",prevRigaHtml({
          descrizione: desc,
          qta:    (v.quantita==null||v.quantita==="")?1:(+v.quantita||0),
          prezzo: pz
        }));
        _aiIllumina(box.lastElementChild);
        messe++;
      });
      if(messe){
        prevTotaleLive();
        if(ruoloUtente==='professionista') aggiornaRiepilogoParcella();
        else aggiornaRiepilogoIvaImpresa();
        messi.push(messe===1?"1 voce di costo":messe+" voci di costo");
      }
    }
    /* ---------- le note che finiscono sul PDF ---------- */
    const note=String((d&&d.note)||"").trim();
    const boxN=$("#pv-note-lista");
    if(note&&boxN){
      const righe=note.split("\n").map(function(x){return x.trim();}).filter(Boolean);
      if(righe.length){
        $$("#pv-note-lista [data-nota]").forEach(function(n){
          const t=n.querySelector(".nt-txt");
          if(!t||!t.value.trim()) n.remove();
        });
        righe.forEach(function(r){
          boxN.insertAdjacentHTML("beforeend",prevNotaRigaHtml(r));
          _aiIllumina(boxN.lastElementChild);
        });
        messi.push(righe.length===1?"1 nota":righe.length+" note");
      }
    }
  }

  /* ============================================================
     IL CONTROLLORE — 18 agosto 2026 (idea di Alessio)

     «Non ci deve essere un blocco di invio ma solo una segnalazione.»
     E' tutto qui: guarda il documento aperto e SEGNA. Non spegne mai il
     Salva, non ferma mai un PDF, non corregge niente da solo. A battere
     e' sempre lui — cosi' l'errore lo vede, invece di ritrovarsi il
     modulo cambiato alle spalle.

     DUE GRAVITA', e la parola conta piu' del colore:
       ROSSO   «DA CORREGGERE» — cosi' il documento esce sbagliato
       ARANCIO «DA GUARDARE»   — si puo' mandare, ma e' meglio vederlo
     Se fosse tutto rosso, dalla terza volta non lo guarderebbe piu'.

     DUE MOMENTI:
       - da solo, quando ESCI da una casella: si segna solo quella;
       - col tasto «Controlla prima di mandarlo»: tutto insieme.
     Mentre batti non succede niente: un segno che si accende sotto le
     dita e' un fastidio, non un aiuto.

     ⚠️ QUESTE REGOLE SONO CODICE NORMALE, NON AI. Costano zero, sono
        immediate e non sbagliano mai. L'AI arrivera' dentro lo stesso
        tasto, per quello che una regola non sa vedere (i refusi, una
        voce troppo vaga). Finche' non c'e', il tasto NON porta il
        bollino AI e non nomina i crediti: un bollino dove l'AI non
        lavora e' una bugia (regola del 16 agosto).

     ⚠️ PER AGGIUNGERE UNA SEZIONE (fatture, computo metrico, fornitori,
        scadenze...) si scrive SOLO la sua voce in CTR_DOC: `caselle` e
        `regole`. La macchina qui sotto non si tocca.
     ============================================================ */
  const CTR_PAROLA={rosso:"DA CORREGGERE",arancio:"DA GUARDARE"};

  /* ============================================================
     IL LETTORE — 18 agosto 2026

     Le regole di Cliente e Fornitore non guardano piu' le caselle: le
     CHIEDONO a un lettore. Cosi' le STESSE regole girano su due cose
     diverse — il modulo aperto e la riga gia' salvata (la scheda) — e
     non esistono due copie che fra un mese si scollano, con la scheda
     che dice «tutto a posto» e il modulo che segna due errori.
     E' la trappola delle tre copie della formula, gia' pagata ad agosto.

     ⚠️ Le altre sei sezioni NON hanno una scheda di sola lettura: ti
        portano dritto nel modulo. Li' il lettore non serve, e non e'
        stato messo per non cambiare codice che gia' funziona.
     ============================================================ */
  function ctrDalModulo(){
    return {
      get: function(id){ const e=document.getElementById(id); return e?String(e.value||"").trim():""; },
      tipo:function(){ const b=$("#c-tipo-box"); return (b&&b.dataset&&b.dataset.tipo)||"privato"; }
    };
  }
  function ctrDallaRiga(mappa,r){
    r=r||{};
    return {
      get: function(id){ const col=mappa[id]; if(!col) return ""; const v=r[col]; return (v==null)?"":String(v).trim(); },
      tipo:function(){ return String(r.tipo||"privato"); }
    };
  }
  /* quale colonna del database corrisponde a quale casella del modulo.
     ⚠️ Serve anche a un'altra cosa: sulla scheda si mostrano SOLO gli
     avvisi sui campi che stanno qui dentro. Un avviso su un dato che la
     riga non contiene sarebbe un avviso inventato. */
  const CTR_MAPPA={
    cliente:{ "c-nome":"nome", "c-tel":"telefono", "c-email":"email",
              "c-piva":"piva", "c-cf":"cod_fiscale",
              "c-sdi":"sdi_codice", "c-pec":"sdi_pec" },
    fornitore:{ "fo-nome":"nome", "fo-piva":"piva",
                "fo-tel":"telefono", "fo-email":"email" }
  };
  /* dove si va a sistemare, cliccando la striscia */
  const CTR_VAI={ cliente:"edit-cli", fornitore:"edit-forn-full" };
  /* quale computo e' aperto adesso: serve perche' le sue lavorazioni
     stanno in una cache, non nel modulo, e su un computo nuovo quella
     cache contiene ancora le voci di quello di prima. */
  let ctrComputoId=null;
  /* ⚠️ 18 agosto 2026 — «Aprilo e sistemalo» apriva il modulo e basta: i
     segni non si accendevano, e Alessio si ritrovava davanti al modulo
     senza sapere DOVE erano le due cose che la striscia gli aveva appena
     detto. Adesso il pulsante lascia scritto qui che tipo di documento
     e' e, appena il modulo attacca l'orecchio, i segni compaiono da soli. */
  let ctrAccendiSubito=null;

  /* i titoli che non dicono niente al cliente */
  const CTR_TITOLI_VAGHI=["preventivo","preventivi","nuovo preventivo","lavoro","lavori",
                          "vari","varie","offerta","computo","test","prova","boh","x"];

  const CTR_DOC={
    preventivo:{
      /* dove attaccare l'orecchio: uscendo da una di queste si guarda
         solo quella. Le righe delle voci nascono dopo, percio' si
         ascolta il contenitore (vedi ctrAscolta). */
      caselle:"#pv-tit,#pv-cli,#pv-data,#pv-iva-imp,#pv-rit",
      dentro:["#prev-righe"],
      regole:ctrRegolePreventivo
    },
    fattura:{
      caselle:"#fa-cli,#fa-data,#fa-bollo,#fa-sconto",
      dentro:["#fatt-righe"],
      regole:ctrRegoleFattura
    },
    computo:{
      caselle:"#co-tit,#co-cli,#co-num,#co-luogo,#co-rib,#co-prz,#co-prz-sel",
      dentro:[],
      regole:ctrRegoleComputo
    },
    cliente:{
      caselle:"#c-nome,#c-tel,#c-email,#c-piva,#c-cf,#c-pec,#c-sdi,#c-citta",
      dentro:[],
      regole:ctrRegoleCliente
    },
    fornitore:{
      caselle:"#fo-nome,#fo-piva,#fo-tel,#fo-email",
      dentro:[],
      regole:ctrRegoleFornitore
    },
    fattfornitore:{
      caselle:"#ff-forn,#ff-num,#ff-data,#ff-imp,#ff-scad",
      dentro:[],
      regole:ctrRegoleFattFornitore
    },
    scadenza:{
      caselle:"#s-tit,#s-data,#s-tipo",
      dentro:[],
      regole:ctrRegoleScadenza
    },
    lavoro:{
      /* il modulo del lavoro esiste in due vestiti (semplice e collegato al
         database): le caselle del cliente si chiamano #j-cli in uno e
         #j-cliente nell'altro. Ci sono tutte e due: quella che non c'e'
         semplicemente non viene trovata, e non fa danno. */
      caselle:"#j-desc,#j-cli,#j-cliente,#j-imp,#j-pr-tipo,#j-pr-stato,#j-pr-comune,#j-pr-prot,#j-pr-data",
      dentro:[],
      regole:ctrRegoleLavoro
    },
    /* ---- 19 agosto 2026: le quattro sezioni che erano scoperte ---- */
    operatore:{
      caselle:"#d-nome,#d-tel,#d-costo,#d-visita,#d-formazione,#d-doc-scad,#d-permesso,#d-cf,#d-email",
      dentro:[],
      regole:ctrRegoleOperatore
    },
    mezzo:{
      caselle:"#m-nome,#m-targa,#m-stato,#m-note,#m-attrezzo",
      dentro:[],
      regole:ctrRegoleMezzo
    },
    carta:{
      caselle:"#ct-nome,#ct-dip,#ct-stato,#ct-note",
      dentro:[],
      regole:ctrRegoleCarta
    },
    corso:{
      caselle:"#cr-tit,#cr-ente,#cr-data,#cr-cfp",
      dentro:[],
      regole:ctrRegoleCorso
    }
  };

  /* il tipo del cliente scelto (privato / azienda / condominio), se lo
     sappiamo. Se cliCache non e' ancora arrivata NON si tira a indovinare:
     meglio nessun avviso che un avviso sbagliato sulla ritenuta. */
  function ctrTipoCliente(){
    const sel=$("#pv-cli"); if(!sel||!sel.value) return null;
    const c=(cliCache||[]).find(x=>String(x.id)===String(sel.value));
    return (c&&c.tipo)?String(c.tipo):null;
  }

  function ctrRegolePreventivo(){
    const out=[];

    /* --- il titolo --- */
    const tit=$("#pv-tit");
    if(tit){
      const v=tit.value.trim();
      if(!v) out.push({el:tit,grave:"rosso",
        dice:"Manca il titolo. Nell'elenco e sul PDF resta una riga senza nome, e fra un mese non sai più qual era."});
      else if(CTR_TITOLI_VAGHI.indexOf(_aiNorm(v))>=0) out.push({el:tit,grave:"arancio",
        dice:"«"+v+"» al cliente non dice niente. Scrivi cosa si fa: «Rifacimento bagno 6 mq»."});
    }

    /* --- le voci di costo --- */
    let conDescrizione=0;
    $$("#prev-righe [data-riga]").forEach(function(r){
      const cd=r.querySelector(".pr-desc"), cq=r.querySelector(".pr-qta"), cp=r.querySelector(".pr-prezzo");
      const desc=cd?cd.value.trim():"";
      const prezzoScritto=cp?cp.value.trim():"";
      const qta=_numRiga(r,".pr-qta",null), prezzo=_numRiga(r,".pr-prezzo",null);
      if(desc) conDescrizione++;
      /* ⚠️ questa e' la piu' importante di tutte: salvando, una riga senza
         descrizione viene BUTTATA VIA (vedi savePrev) — prezzo compreso, e
         senza dire niente a nessuno. */
      if(!desc&&prezzoScritto&&cd) out.push({el:cd,grave:"rosso",
        dice:"C'è un prezzo senza descrizione: salvando, questa riga viene buttata via e il prezzo sparisce senza dirtelo."});
      if(desc&&!prezzoScritto&&cp) out.push({el:cp,grave:"rosso",
        dice:"«"+desc+"» non ha prezzo: nel totale conta zero."});
      if(desc&&prezzoScritto&&prezzo===0&&cp) out.push({el:cp,grave:"rosso",
        dice:"«"+desc+"» ha prezzo zero: al cliente arriva come lavoro regalato."});
      if(desc&&qta===0&&cq) out.push({el:cq,grave:"arancio",
        dice:"Quantità a zero: «"+desc+"» non somma niente nel totale."});
    });
    if(!conDescrizione){
      const primo=$("#prev-righe .pr-desc");
      if(primo) out.push({el:primo,grave:"rosso",
        dice:"Il preventivo non ha nemmeno una voce. Così non si salva, e al cliente non arriva niente."});
    }

    /* --- il cliente --- */
    const cli=$("#pv-cli");
    if(cli&&!cli.value) out.push({el:cli,grave:"arancio",
      dice:"Nessun cliente scelto: il PDF esce senza intestatario, e nell'elenco non lo ritrovi cercando il suo nome."});

    /* --- la data --- */
    const dt=$("#pv-data");
    if(dt&&dt.value&&dt.value<todayStr()) out.push({el:dt,grave:"arancio",
      dice:"La data è indietro rispetto a oggi: sul PDF il cliente legge un preventivo già vecchio."});

    /* --- IVA (imprese e artigiani) oppure ritenuta (professionisti) --- */
    if(ruoloUtente!=='professionista'){
      const iva=$("#pv-iva-imp");
      if(iva&&iva.value==="") out.push({el:iva,grave:"arancio",
        dice:"Senza aliquota IVA il cliente vede solo l'imponibile, e ti richiamerà per chiederti quanto viene finito."});
    }else{
      const rit=$("#pv-rit"), tipo=ctrTipoCliente();
      /* in forfettario la casella e' spenta: non c'e' niente da dire */
      if(rit&&!rit.disabled&&tipo){
        if(rit.checked&&tipo==='privato') out.push({el:rit,grave:"arancio",
          dice:"Il cliente è un privato: la ritenuta d'acconto non si applica. Con lui la casella va lasciata vuota."});
        if(!rit.checked&&(tipo==='azienda'||tipo==='condominio')) out.push({el:rit,grave:"arancio",
          dice:(tipo==='condominio'?"Il cliente è un condominio":"Il cliente è un'azienda")
               +": di norma la ritenuta del 20% va applicata."});
      }
    }
    return out;
  }

  /* ============================================================
     LE REGOLE DELLA FATTURA — quella che va al commercialista

     Qui l'errore non torna indietro dal cliente: torna dal
     commercialista, mesi dopo, quando non ti ricordi piu' niente.
     ============================================================ */
  function ctrRegoleFattura(){
    const out=[];

    /* --- il cliente: su una fattura non e' un dettaglio --- */
    const cli=$("#fa-cli");
    if(cli&&!cli.value) out.push({el:cli,grave:"rosso",
      dice:"Manca il cliente. Una fattura senza intestatario non si manda a nessuno e il commercialista te la rimanda indietro."});

    /* --- le voci --- */
    let conDescrizione=0, imponibile=0;
    $$("#fatt-righe [data-riga]").forEach(function(r){
      const cd=r.querySelector(".fr-desc"), cq=r.querySelector(".fr-qta"), cp=r.querySelector(".fr-prezzo");
      const desc=cd?cd.value.trim():"";
      const prezzoScritto=cp?cp.value.trim():"";
      const qta=_numRiga(r,".fr-qta",null), prezzo=_numRiga(r,".fr-prezzo",null);
      if(desc){ conDescrizione++; imponibile += (qta==null?1:qta)*(prezzo||0); }
      /* stessa trappola del preventivo: salvando, la riga senza descrizione
         viene buttata via — prezzo compreso, e senza dire niente */
      if(!desc&&prezzoScritto&&cd) out.push({el:cd,grave:"rosso",
        dice:"C'è un prezzo senza descrizione: salvando, questa riga viene buttata via e il prezzo sparisce senza dirtelo."});
      if(desc&&!prezzoScritto&&cp) out.push({el:cp,grave:"rosso",
        dice:"«"+desc+"» non ha prezzo: in fattura quella riga vale zero."});
      if(desc&&prezzoScritto&&prezzo===0&&cp) out.push({el:cp,grave:"rosso",
        dice:"«"+desc+"» ha prezzo zero: stai fatturando un lavoro a zero euro."});
      if(desc&&qta===0&&cq) out.push({el:cq,grave:"arancio",
        dice:"Quantità a zero: «"+desc+"» non somma niente nel totale."});
    });
    if(!conDescrizione){
      const primo=$("#fatt-righe .fr-desc");
      if(primo) out.push({el:primo,grave:"rosso",
        dice:"La fattura non ha nemmeno una voce. Così non si salva."});
    }

    /* --- la data: una fattura col domani sopra non si emette --- */
    const dt=$("#fa-data");
    if(dt&&dt.value&&dt.value>todayStr()) out.push({el:dt,grave:"rosso",
      dice:"La data è nel futuro. Una fattura si emette il giorno stesso o prima, non domani: al commercialista salta subito all'occhio."});

    /* --- il bollo del forfettario: 2 € sopra i 77,47 € --- */
    if(typeof fattForfettario==="function"&&fattForfettario()){
      const bollo=$("#fa-bollo");
      const sconto=_numIt("#fa-sconto")||0;
      const netto=imponibile-sconto;
      if(bollo&&netto>77.47&&!(_numIt("#fa-bollo")>0)) out.push({el:bollo,grave:"arancio",
        dice:"Sei in forfettario e la fattura supera i 77,47 €: ci vuole la marca da bollo da 2 €. Scrivi 2 qui."});
    }
    return out;
  }

  /* ============================================================
     LE REGOLE DEL LAVORO / DELLA PRATICA

     Per un'impresa e' un lavoro: cosa, dove, per chi, quanto.
     Per uno studio e' una pratica, e li' c'e' la cosa che fa piu'
     danno di tutte: una pratica DEPOSITATA senza numero di
     protocollo. Il giorno che il Comune chiama, quel numero non ce
     l'hai, e non sai nemmeno dove cercarlo.
     ============================================================ */
  const CTR_PRATICA_DEPOSITATE=["depositata","istruttoria","integrazioni","approvata","archiviata"];

  function ctrRegoleLavoro(){
    const out=[];
    const pro=(ruoloUtente==='professionista');
    const PAROLA=pro?"La pratica":"Il lavoro";

    /* --- cosa c'è da fare --- */
    const desc=$("#j-desc");
    if(desc&&!desc.value.trim()) out.push({el:desc,grave:"rosso",
      dice:"Manca cosa c'è da fare. "+PAROLA+" resta una riga senza nome, e nell'elenco non la riconosci più."});

    /* --- il cliente (il modulo ha due vestiti: #j-cli o #j-cliente) --- */
    const cli=$("#j-cli")||$("#j-cliente");
    if(cli&&!cli.value) out.push({el:cli,grave:"arancio",
      dice:"Nessun cliente scelto: non ritrovi questa scheda cercando il suo nome, e il margine non finisce sotto di lui."});

    /* --- l'importo --- */
    const imp=$("#j-imp");
    if(imp&&!imp.value.trim()) out.push({el:imp,grave:"arancio",
      dice:"Senza importo il margine di questo lavoro non si calcola: le spese si vedono, i soldi che entrano no."});

    if(!pro) return out;

    /* --- da qui in giù solo gli studi professionali --- */
    const tipo=$("#j-pr-tipo"), stato=$("#j-pr-stato"),
          comune=$("#j-pr-comune"), prot=$("#j-pr-prot"), dataDep=$("#j-pr-data");
    const depositata=stato&&CTR_PRATICA_DEPOSITATE.indexOf(stato.value)>=0;

    if(depositata&&prot&&!prot.value.trim()) out.push({el:prot,grave:"rosso",
      dice:"La pratica risulta già depositata ma il numero di protocollo non c'è. È il numero con cui il Comune la chiama: senza, quando ti telefonano non sai nemmeno dove cercarla."});
    if(depositata&&dataDep&&!dataDep.value) out.push({el:dataDep,grave:"arancio",
      dice:"Pratica depositata senza data di deposito: i termini dell'istruttoria si contano da lì."});
    if(tipo&&!tipo.value) out.push({el:tipo,grave:"arancio",
      dice:"Tipo di pratica non scelto: CILA, SCIA e Permesso di Costruire hanno tempi e allegati diversi."});
    if(comune&&!comune.value.trim()) out.push({el:comune,grave:"arancio",
      dice:"Manca il Comune: è il primo dato che serve per ritrovare la pratica."});
    return out;
  }

  /* solo le cifre: una partita IVA scritta «IT 012 345 678 90» ha 11 cifre
     vere, e non e' sbagliata. Si contano quelle, non i caratteri. */
  function ctrCifre(v){ return String(v||"").replace(/\D/g,""); }
  /* un indirizzo scritto bene: qualcosa, la chiocciola, qualcosa, il punto,
     qualcosa. Non serve di piu': il resto lo dice il server quando rimbalza. */
  const CTR_EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function ctrVale(sel){ const e=$(sel); return e?String(e.value||"").trim():""; }

  /* ============================================================
     IL COMPUTO METRICO

     ⚠️ Qui le lavorazioni NON sono caselle del modulo: sono righe gia'
        salvate nel database, disegnate a parte da renderCompVoci in
        compVociCache. Percio' si guarda la cache — ma solo se e' quella
        del computo aperto (`ctrComputoId`), se no su un computo nuovo si
        starebbe leggendo le voci di quello di prima.
     ============================================================ */
  function ctrRegoleComputo(){
    const out=[];
    const tit=$("#co-tit");
    if(tit&&!tit.value.trim()) out.push({el:tit,grave:"rosso",
      dice:"Manca il titolo. Nell'elenco dei computi resta una riga senza nome."});

    const num=$("#co-num");
    if(num&&!num.value.trim()) out.push({el:num,grave:"arancio",
      dice:"Senza numero il computo non lo ritrovi, e sul documento il cliente non ha niente da citare."});

    const cli=$("#co-cli");
    if(cli&&!cli.value) out.push({el:cli,grave:"arancio",
      dice:"Nessun cliente scelto: il documento esce senza intestatario."});

    const luogo=$("#co-luogo");
    if(luogo&&!luogo.value.trim()) out.push({el:luogo,grave:"arancio",
      dice:"Manca dove sono i lavori. Su un computo l'indirizzo ci va sempre: è quello che lo lega al cantiere giusto."});

    /* il prezzario: da dove vengono i prezzi è la prima cosa che ti chiedono */
    const przSel=$("#co-prz-sel"), prz=$("#co-prz");
    if(przSel&&!przSel.value&&prz&&!prz.value.trim()) out.push({el:przSel,grave:"arancio",
      dice:"Non è indicato da dove vengono i prezzi. Su un computo è la prima cosa che ti chiedono: quale prezzario e di che anno."});

    /* il ribasso: sopra il 100% il totale andrebbe sotto zero */
    const rib=$("#co-rib");
    if(rib&&rib.value.trim()){
      const r=_numeroIt(rib.value);
      if(r!=null&&r>100) out.push({el:rib,grave:"rosso",
        dice:"Un ribasso oltre il 100% non esiste: vorrebbe dire pagare il cliente per lavorare."});
      else if(r!=null&&r<0) out.push({el:rib,grave:"rosso",
        dice:"Il ribasso non può essere negativo. Se stai aggiungendo qualcosa, va messo nelle lavorazioni."});
    }

    /* le lavorazioni, dalla cache del computo APERTO */
    if(ctrComputoId&&String(compVociCompId||"")===String(ctrComputoId)
       &&!((compVociCache||[]).length)){
      const dove=$("#co-tit");
      if(dove) out.push({el:dove,grave:"rosso",
        dice:"Il computo non ha nemmeno una lavorazione: il totale è zero e il documento esce vuoto."});
    }
    return out;
  }

  /* ============================================================
     IL CLIENTE

     Un cliente compilato a meta' non si vede finche' non provi a
     fatturargli: e li' e' tardi, perche' la fattura elettronica la
     rifiuta lo SDI, non il gestionale.
     ============================================================ */
  function ctrRegoleCliente(L){
    L=L||ctrDalModulo();
    const out=[];
    const tipo=L.tipo();

    if(!L.get("c-nome")) out.push({campo:"c-nome",grave:"rosso",
      dice:"Manca il nome. Senza, questa scheda non la ritrovi più e nei documenti esce vuota."});

    /* --- di che cosa ha bisogno, secondo quello che è --- */
    const nPiva=ctrCifre(L.get("c-piva")), nCf=L.get("c-cf");

    if(tipo==='azienda'){
      if(!nPiva) out.push({campo:"c-piva",grave:"rosso",
        dice:"È un'azienda e la partita IVA non c'è: senza, la fattura elettronica non si può fare."});
      else if(nPiva.length!==11) out.push({campo:"c-piva",grave:"rosso",
        dice:"La partita IVA ha 11 cifre, questa ne ha "+nPiva.length+". Lo SDI la rifiuta."});
    }else{
      if(!nCf) out.push({campo:"c-cf",grave:"arancio",
        dice:(tipo==='condominio'
              ? "Un condominio ha il codice fiscale: senza, quando gli fatturi ti tocca cercarlo di corsa."
              : "Manca il codice fiscale: per fatturare a un privato serve, e il giorno che ti serve non ce l'hai.")});
      else if(nCf.length!==16&&nCf.length!==11) out.push({campo:"c-cf",grave:"arancio",
        dice:"Il codice fiscale di una persona ha 16 caratteri (11 se è un condominio o un ente): questo ne ha "+nCf.length+"."});
      if(nPiva&&nPiva.length!==11) out.push({campo:"c-piva",grave:"arancio",
        dice:"La partita IVA ha 11 cifre, questa ne ha "+nPiva.length+"."});
    }

    /* --- dove mandare la fattura elettronica --- */
    if(tipo!=='privato'){
      const hSdi=L.get("c-sdi"), hPec=L.get("c-pec");
      if(!hSdi&&!hPec) out.push({campo:"c-sdi",grave:"arancio",
        dice:"Né codice SDI né PEC: la fattura elettronica non sa dove andare e finisce nel cassetto fiscale, dove il cliente non la guarda."});
      else if(hSdi&&hSdi.length!==7) out.push({campo:"c-sdi",grave:"arancio",
        dice:"Il codice SDI è di 7 caratteri, questo ne ha "+hSdi.length+"."});
    }

    /* --- come lo si chiama --- */
    const hTel=L.get("c-tel"), hMail=L.get("c-email"), hPec2=L.get("c-pec");
    if(!hTel&&!hMail) out.push({campo:"c-tel",grave:"arancio",
      dice:"Nessun telefono e nessuna email: questo cliente non lo puoi richiamare."});
    if(hMail&&!CTR_EMAIL.test(hMail)) out.push({campo:"c-email",grave:"rosso",
      dice:"Questa email non è scritta bene: «"+hMail+"». Le manca la chiocciola o il punto finale, e così non le arriva niente."});
    if(hPec2&&!CTR_EMAIL.test(hPec2)) out.push({campo:"c-pec",grave:"rosso",
      dice:"Questa PEC non è scritta bene: «"+hPec2+"». La fattura elettronica non arriverebbe."});
    return out;
  }

  /* ============================================================
     IL FORNITORE
     ============================================================ */
  function ctrRegoleFornitore(L){
    L=L||ctrDalModulo();
    const out=[];
    if(!L.get("fo-nome")) out.push({campo:"fo-nome",grave:"rosso",
      dice:"Manca il nome del fornitore: senza, nelle spese esce una riga vuota."});
    const n=ctrCifre(L.get("fo-piva"));
    if(!n) out.push({campo:"fo-piva",grave:"arancio",
      dice:"Senza partita IVA il commercialista non sa a chi attribuire le fatture di questo fornitore."});
    else if(n.length!==11) out.push({campo:"fo-piva",grave:"arancio",
      dice:"La partita IVA ha 11 cifre, questa ne ha "+n.length+"."});
    const hTel=L.get("fo-tel"), hMail=L.get("fo-email");
    if(!hTel&&!hMail) out.push({campo:"fo-tel",grave:"arancio",
      dice:"Nessun telefono e nessuna email: il giorno che ti serve un pezzo non sai come chiamarlo."});
    if(hMail&&!CTR_EMAIL.test(hMail)) out.push({campo:"fo-email",grave:"rosso",
      dice:"Questa email non è scritta bene: «"+hMail+"». Le manca la chiocciola o il punto finale."});
    return out;
  }

  /* ============================================================
     LA FATTURA DA PAGARE (quella del fornitore)

     Qui l'errore non lo vede nessuno finche' non arriva un sollecito.
     ============================================================ */
  function ctrRegoleFattFornitore(){
    const out=[];
    const forn=$("#ff-forn");
    if(forn&&!forn.value) out.push({el:forn,grave:"rosso",
      dice:"Manca il fornitore: questa spesa non finisce sotto nessuno e nel conto dei fornitori non la vedi."});
    const num=$("#ff-num");
    if(num&&!num.value.trim()) out.push({el:num,grave:"arancio",
      dice:"Senza numero di fattura, se il fornitore ti sollecita non sai di quale sta parlando."});
    const imp=$("#ff-imp");
    if(imp){
      const v=String(imp.value||"").trim();
      const n=_numeroIt(v);
      if(!v) out.push({el:imp,grave:"rosso",
        dice:"Manca l'importo: questa fattura nel conto delle spese vale zero."});
      else if(n===0) out.push({el:imp,grave:"rosso",
        dice:"Importo a zero: una fattura da pagare di zero euro non esiste."});
    }
    const data=$("#ff-data"), scad=$("#ff-scad");
    const d=String((data&&data.value)||""), sc=String((scad&&scad.value)||"");
    if(scad&&!sc) out.push({el:scad,grave:"arancio",
      dice:"Senza data di scadenza questa fattura non compare nello scadenzario, e te ne ricordi quando è tardi."});
    else if(scad&&sc&&d&&sc<d) out.push({el:scad,grave:"rosso",
      dice:"La scadenza è prima della data della fattura: uno dei due giorni è scritto sbagliato."});
    return out;
  }

  /* ============================================================
     LA SCADENZA
     ============================================================ */
  function ctrRegoleScadenza(){
    const out=[];
    const tit=$("#s-tit");
    if(tit&&!tit.value.trim()) out.push({el:tit,grave:"rosso",
      dice:"Manca il titolo: nell'elenco e nell'email di promemoria esce una riga senza nome, e non sai cosa scade."});
    const data=$("#s-data");
    if(data&&!data.value) out.push({el:data,grave:"rosso",
      dice:"Manca la data: senza, non scade mai e il promemoria non parte."});
    else if(data&&data.value&&data.value<todayStr()) out.push({el:data,grave:"arancio",
      dice:"Questa data è già passata: il promemoria non ti arriverà più."});
    return out;
  }

  /* ============================================================
     LE QUATTRO SEZIONI SCOPERTE — 19 agosto 2026
     (squadra, mezzi e attrezzature, carte aziendali, corsi)

     ⚠️ QUI IL ROSSO NON E' «il documento esce brutto»: e' «questa
        persona non puo' stare in cantiere». Visita medica scaduta,
        formazione scaduta, permesso di soggiorno scaduto: se arriva
        un controllo, il cantiere si ferma e la multa la paga lui.
        Sono le uniche cose di tutto il gestionale dove il rosso vuol
        dire una cosa che costa soldi veri lo stesso giorno.
     ⚠️ Trenta giorni prima si diventa arancio: un documento si
        rinnova in tempo solo se lo sai in tempo. Per il permesso di
        soggiorno sono sessanta, perche' il rinnovo e' piu' lento.
     ⚠️ Come tutto il resto del controllore: SEGNA E BASTA. Non spegne
        il Salva, non toglie la persona dalla squadra, non cambia
        niente da solo.
     ============================================================ */
  const CTR_PREAVVISO=30;          /* giorni: da qui in poi e' arancio */
  const CTR_PREAVVISO_PERM=60;     /* il permesso di soggiorno ha la coda lunga */

  /* una scadenza sola, la stessa regola per tutte: scaduta = rosso,
     vicina = arancio, lontana = niente. Scritta una volta, non cinque. */
  function _ctrScad(sel,cosa,perche,preavviso){
    const el=$(sel); if(!el||!el.value) return null;
    const g=_giorniA(el.value);
    if(g==null) return null;
    if(g<0) return {el:el,grave:"rosso",
      dice:cosa+" è scaduta da "+(-g===1?"1 giorno":(-g)+" giorni")+". "+perche};
    if(g<=(preavviso||CTR_PREAVVISO)) return {el:el,grave:"arancio",
      dice:cosa+(g===0?" scade oggi. ":(g===1?" scade domani. ":" scade fra "+g+" giorni. "))+"Muoviti adesso: dopo si fa in fretta a scordarsene."};
    return null;
  }

  /* l'id della riga aperta adesso: sta sul pulsante Salva della finestra.
     Se la finestra e' di una riga nuova torna "", e allora nessuna riga
     della cache puo' essere «se stessa». */
  function _ctrIoId(azione){
    const b=document.querySelector('#sheet [data-action="'+azione+'"]');
    return String((b&&b.dataset&&b.dataset.id)||"");
  }

  function ctrRegoleOperatore(){
    const out=[];
    const nome=$("#d-nome");
    if(nome&&!nome.value.trim()) out.push({el:nome,grave:"rosso",
      dice:"Manca il nome: nell'elenco della squadra e nei rapportini resta una riga senza nome."});

    const tel=$("#d-tel");
    if(tel&&!tel.value.trim()) out.push({el:tel,grave:"arancio",
      dice:"Nessun telefono: dal cantiere non lo chiami, e il messaggio col lavoro assegnato non parte."});

    /* ⚠️ il costo orario non e' un dato dell'anagrafica: e' quello che fa
       il margine. Senza, ogni lavoro conta ZERO di manodopera e il
       guadagno che vedi e' piu' alto del vero. */
    const costo=$("#d-costo");
    if(costo&&!costo.value.trim()) out.push({el:costo,grave:"arancio",
      dice:"Senza costo orario le ore di questa persona valgono zero, e il margine dei lavori esce più alto del vero."});
    else if(costo&&costo.value.trim()){
      const c=_numeroIt(costo.value);
      if(c!=null&&c<=0) out.push({el:costo,grave:"rosso",
        dice:"Un costo orario a zero fa sparire la manodopera dal conto del lavoro."});
      else if(c!=null&&c>200) out.push({el:costo,grave:"arancio",
        dice:"Duecento euro l'ora sono tanti: hai messo il costo del giorno al posto di quello dell'ora?"});
    }

    /* le scadenze che fermano un cantiere */
    [ _ctrScad("#d-visita","La visita medica","Se arriva un controllo, questa persona in cantiere non ci può stare."),
      _ctrScad("#d-formazione","La formazione sulla sicurezza","Senza, in cantiere non ci può stare e la sanzione è a carico tuo."),
      _ctrScad("#d-doc-scad","Il documento d'identità","Serve per il tesserino di riconoscimento."),
      _ctrScad("#d-permesso","Il permesso di soggiorno","Senza permesso valido non può lavorare: è la cosa più grave di questo elenco.",CTR_PREAVVISO_PERM)
    ].forEach(function(s){ if(s)out.push(s); });

    const cf=$("#d-cf");
    if(cf&&cf.value.trim()&&cf.value.trim().length!==16) out.push({el:cf,grave:"arancio",
      dice:"Il codice fiscale di una persona è lungo 16 caratteri: questo ne ha "+cf.value.trim().length+"."});

    const mail=$("#d-email");
    if(mail&&mail.value.trim()&&!CTR_EMAIL.test(mail.value.trim())) out.push({el:mail,grave:"rosso",
      dice:"Questa email non è scritta bene: gli inviti e le comunicazioni non arriveranno."});
    return out;
  }

  function ctrRegoleMezzo(){
    const out=[];
    const nome=$("#m-nome");
    if(nome&&!nome.value.trim()) out.push({el:nome,grave:"rosso",
      dice:"Manca il nome: nell'elenco e nelle tendine dei lavori resta una riga senza nome."});
    /* ⚠️ i doppioni si cercano nella cache della sezione, saltando la riga
       che si sta modificando: se no un mezzo segnalerebbe se stesso. */
    const _io=_ctrIoId("save-mezzo");
    if(nome&&nome.value.trim()){
      const n=nome.value.trim().toLowerCase();
      const gia=(mezziCache||[]).some(x=>String(x.id)!==_io&&String(x.nome||"").trim().toLowerCase()===n);
      if(gia) out.push({el:nome,grave:"arancio",
        dice:"C'è già un mezzo con questo nome: nelle tendine ne vedrai due uguali e non saprai quale scegliere."});
    }
    const attrezzo=!!($("#m-attrezzo")&&$("#m-attrezzo").checked)
                 || (($("#m-cat")&&$("#m-cat").value)==="attrezzatura");
    const targa=$("#m-targa");
    if(targa&&!targa.value.trim()&&!attrezzo) out.push({el:targa,grave:"arancio",
      dice:"Senza targa non colleghi revisione, bollo e assicurazione, e su un rapportino non sai quale mezzo era."});
    if(targa&&targa.value.trim()){
      const t=targa.value.trim().toUpperCase();
      const gia=(mezziCache||[]).some(x=>String(x.id)!==_io&&String(x.targa||"").trim().toUpperCase()===t);
      if(gia) out.push({el:targa,grave:"rosso",
        dice:"Questa targa è già su un altro mezzo: uno dei due è stato inserito due volte, e i costi si dividono fra due schede."});
    }
    const stato=$("#m-stato"), note=$("#m-note");
    if(stato&&(stato.value==="manutenzione"||stato.value==="fuori_uso")&&note&&!note.value.trim())
      out.push({el:note,grave:"arancio",
        dice:"L'hai messo fermo ma non hai scritto perché: fra un mese non ti ricorderai se aspettava un pezzo o era da rottamare."});
    return out;
  }

  function ctrRegoleCarta(){
    const out=[];
    const nome=$("#ct-nome");
    if(nome&&!nome.value.trim()) out.push({el:nome,grave:"rosso",
      dice:"Manca il nome: nell'elenco delle carte resta una riga senza nome."});
    const dip=$("#ct-dip");
    if(dip&&!dip.value) out.push({el:dip,grave:"arancio",
      dice:"Nessun titolare: quando esce una spesa non sai chi l'ha fatta, e la carta non la chiedi indietro a nessuno."});
    const stato=$("#ct-stato"), note=$("#ct-note");
    if(stato&&stato.value==="bloccata"&&note&&!note.value.trim()) out.push({el:note,grave:"arancio",
      dice:"L'hai bloccata ma non hai scritto perché: smarrita, rubata, o solo per ora?"});
    return out;
  }

  function ctrRegoleCorso(){
    const out=[];
    const tit=$("#cr-tit");
    if(tit&&!tit.value.trim()) out.push({el:tit,grave:"rosso",
      dice:"Manca il titolo: nell'elenco dei corsi resta una riga senza nome, e all'Ordine non dimostri niente."});
    const ente=$("#cr-ente");
    if(ente&&!ente.value.trim()) out.push({el:ente,grave:"arancio",
      dice:"Manca chi l'ha organizzato: sull'attestato c'è, e se te lo chiedono devi saperlo dire."});
    const data=$("#cr-data");
    if(data&&!data.value) out.push({el:data,grave:"rosso",
      dice:"Senza data il corso non finisce in nessun anno, e nel conto dei crediti non entra."});
    else if(data&&data.value>todayStr()) out.push({el:data,grave:"arancio",
      dice:"Questa data è nel futuro: i crediti li stai contando prima di averli presi."});
    const cfp=$("#cr-cfp");
    if(cfp&&!cfp.value.trim()) out.push({el:cfp,grave:"arancio",
      dice:"Senza crediti il corso non sposta il conto dell'anno: se davvero non ne dà, scrivi 0."});
    else if(cfp&&cfp.value.trim()){
      const n=_numeroIt(cfp.value);
      /* ⚠️ 12 agosto 2026 la virgola aveva gia' fatto danni qui: «2,5» letto
         come 25 e' mezzo credito che diventa venticinque. Un numero cosi'
         grosso su un corso solo quasi sempre e' una virgola sbagliata. */
      if(n!=null&&n>30) out.push({el:cfp,grave:"arancio",
        dice:"Trenta crediti da un corso solo sono quasi un anno intero: controlla la virgola (2,5 e 25 si somigliano)."});
      else if(n!=null&&n<0) out.push({el:cfp,grave:"rosso",
        dice:"I crediti non possono essere negativi."});
    }
    return out;
  }

  /* ---------- la macchina: da qui in giu' non c'e' niente di specifico ---------- */

  function ctrLista(tipo){
    const doc=CTR_DOC[tipo]; if(!doc||typeof doc.regole!=="function") return [];
    let l=[];
    /* ⚠️ se una regola esplode NON deve portarsi dietro il modulo: il
       controllore e' un aiuto, non un pezzo indispensabile. */
    try{ l=doc.regole(ctrDalModulo())||[]; }catch(e){ console.warn("[controllore]",e); l=[]; }
    /* una regola puo' dire la casella in due modi: `el` quando l'elemento se
       l'e' gia' trovato lei (le righe delle voci, che nascono e muoiono),
       oppure `campo` col nome della casella — ed e' quel nome che permette
       alle stesse regole di girare anche sulla riga salvata. */
    return l.map(function(s){
      if(!s) return null;
      if(s.el) return s;
      const el=s.campo?document.getElementById(s.campo):null;
      return el?{el:el,grave:s.grave,dice:s.dice}:null;
    }).filter(s=>s&&s.el&&document.body.contains(s.el));
  }

  /* ============================================================
     LA STRISCIA SULLA SCHEDA — 18 agosto 2026

     Sulla scheda non ci sono caselle da colorare: c'e' una striscia in
     cima che dice quante cose ci sono e quali, e che cliccata apre
     «Modifica» — dove i segni si accendono sulle caselle vere.

     ⚠️ Si mostrano SOLO gli avvisi sui campi che stanno in CTR_MAPPA,
        cioe' su dati che la riga salvata contiene davvero. Un avviso su
        un dato che li' non c'e' sarebbe inventato.
     ⚠️ Le regole sono LE STESSE del modulo, lette da un'altra parte: se
        domani ne cambia una, cambiano tutte e due le schermate insieme.
     ============================================================ */
  function ctrStrisciaHTML(tipo,riga){
    const mappa=CTR_MAPPA[tipo], doc=CTR_DOC[tipo];
    if(!mappa||!doc||typeof doc.regole!=="function") return "";
    let l=[];
    try{ l=doc.regole(ctrDallaRiga(mappa,riga))||[]; }catch(e){ console.warn("[controllore]",e); return ""; }
    l=l.filter(x=>x&&x.campo&&mappa[x.campo]&&x.dice);
    if(!l.length) return "";
    const rossi=l.filter(x=>x.grave==="rosso").length;
    const grave=rossi?"rosso":"arancio";
    const quante=l.length===1?"1 cosa da guardare":(l.length+" cose da guardare");
    const vai=CTR_VAI[tipo]||"";
    return '<div class="ctr-str ctr-str--'+grave+'">'
      + '<div class="ctr-str-t"><span class="ctr-mk">'+CTR_PAROLA[grave]+'</span>'
      +   '<span class="ctr-str-q">'+quante+'</span></div>'
      + '<ul class="ctr-str-l">'+l.map(x=>'<li class="ctr-str-'+x.grave+'">'+esc(x.dice)+'</li>').join("")+'</ul>'
      + (vai?'<button type="button" class="btn ctr-str-vai" data-action="'+vai+'" data-ctr="'+tipo+'" data-id="'+esc(String((riga&&riga.id)||""))+'">Aprilo e sistemalo</button>':'')
      + '</div>';
  }

  function ctrTogli(el){
    if(!el) return;
    el.classList.remove("ctr-rosso","ctr-arancio");
    const dopo=el.nextElementSibling;
    if(dopo&&dopo.classList&&dopo.classList.contains("ctr-msg")) dopo.remove();
    /* le voci hanno il messaggio sotto la RIGA, non sotto la casella */
    const riga=el.closest?el.closest("[data-riga]"):null;
    if(riga){
      const d=riga.nextElementSibling;
      if(d&&d.classList&&d.classList.contains("ctr-msg")&&d.dataset.per===el.className) d.remove();
    }
  }
  function ctrToglieTutto(){
    $$(".ctr-msg").forEach(x=>x.remove());
    $$(".ctr-rosso,.ctr-arancio").forEach(x=>x.classList.remove("ctr-rosso","ctr-arancio"));
    $$(".conav-ctr").forEach(x=>x.remove());
  }

  /* \u26d4 18 settembre 2026 \u2014 UN AVVISO DENTRO UNA PAGINA CHIUSA NON LO VEDE
     NESSUNO \u2014 la stessa lezione del 19 agosto sulle pieghe, ma per le sei
     linguette del computo, che pieghe non sono.
     Provato dal vivo: il controllo diceva \u00ab3 da guardare\u00bb, i tre avvisi
     stavano sulle pagine 2 e 4, io ero sulla 1, e sulle linguette non c'era
     nessun segno. Per trovarli bisognava aprire le sei pagine a una a una.
     Adesso ogni linguetta che ne ha porta il suo numero, e si va da sola
     sulla prima. Torna il numero della prima pagina che ha un avviso. */
  function ctrSegnaLinguette(lista){
    const nav=document.querySelector("#co-nav");
    if(!nav)return null;
    const conto={};
    (lista||[]).forEach(function(s){
      const pag=(s&&s.el&&s.el.closest)?s.el.closest(".copag"):null;
      const n=pag&&pag.dataset?String(pag.dataset.p||""):"";
      if(!n)return;
      conto[n]=(conto[n]||0)+1;
    });
    let prima=null;
    Object.keys(conto).forEach(function(n){
      const b=nav.querySelector('.conav-v[data-p="'+n+'"]');
      if(!b)return;
      const s=document.createElement("span");
      s.className="conav-ctr";
      s.textContent=String(conto[n]);
      /* stile qui e non nel foglio: \u00e8 un segno che vive quanto il controllo,
         e css/gestionale.css \u00e8 in comune ai quattro gestionali */
      s.style.cssText="display:inline-flex;align-items:center;justify-content:center;"
        +"min-width:20px;height:20px;margin-left:6px;padding:0 6px;border-radius:10px;"
        /* \u26d4 18 settembre 2026 \u2014 13px E NON MENO. Il controllo prima di
           pubblicare si e' fermato su questa riga: l'avevo scritta a 11px.
           Sotto i 13 non si scrive niente, in nessun punto del gestionale. */
        +"background:var(--attesa);color:#fff;font-size:13px;font-weight:700;line-height:1";
      b.appendChild(s);
      if(prima===null||(+n)<(+prima))prima=n;
    });
    return prima;
  }

  function ctrSegna(s){
    if(!s||!s.el) return;
    /* ⚠️ 19 agosto 2026 — UN AVVISO DENTRO UNA PIEGA CHIUSA NON LO VEDE
       NESSUNO. Nella scheda della persona le scadenze (visita medica,
       formazione, permesso di soggiorno) stanno dentro un blocco che si
       apre e si chiude, e chiuso resta chiuso: il controllore avrebbe
       segnato «DA CORREGGERE» in un posto invisibile. Adesso, se il campo
       sta in una piega, la piega si apre. */
    let _p=s.el.closest?s.el.closest("details"):null;
    while(_p){ _p.open=true; _p=_p.parentElement?_p.parentElement.closest("details"):null; }
    s.el.classList.add("ctr-"+s.grave);
    const msg=document.createElement("div");
    msg.className="ctr-msg ctr-msg--"+s.grave;
    msg.dataset.per=s.el.className;
    const mk=document.createElement("span");
    mk.className="ctr-mk"; mk.textContent=CTR_PAROLA[s.grave]||"";
    const tx=document.createElement("span");
    tx.className="ctr-msg-t"; tx.textContent=s.dice;   /* testo, mai HTML */
    msg.appendChild(mk); msg.appendChild(tx);
    /* dentro una voce il messaggio va sotto tutta la riga: di fianco alle
       tre caselle non ci sta, e a capo in mezzo diventa illeggibile */
    const riga=s.el.closest?s.el.closest("[data-riga]"):null;
    const dopo=riga||s.el;
    dopo.parentNode.insertBefore(msg,dopo.nextSibling);
  }

  /* uscendo da una casella: si guarda SOLO quella */
  function ctrGuardaUna(tipo,el){
    if(!el) return;
    ctrTogli(el);
    ctrLista(tipo).filter(s=>s.el===el).forEach(ctrSegna);
  }

  /* il tasto: si guarda tutto insieme e si dice quante cose ci sono */
  function ctrGuardaTutto(tipo){
    ctrToglieTutto();
    const l=ctrLista(tipo);
    l.forEach(ctrSegna);
    if(!l.length){ toast("Ho guardato tutto: non c'è niente da segnalare ✔"); return; }
    const rossi=l.filter(s=>s.grave==="rosso").length;
    const gialli=l.length-rossi;
    const pezzi=[];
    if(rossi)  pezzi.push(rossi+(rossi===1?" da correggere":" da correggere"));
    if(gialli) pezzi.push(gialli+(gialli===1?" da guardare":" da guardare"));
    toast("Te le ho segnate: "+pezzi.join(", ")+". Non ti fermo: puoi salvare lo stesso.");
    /* nel computo: i numeri sulle linguette, e si apre la prima pagina che ne
       ha uno. Senza questo lo scrollIntoView qui sotto cadeva su un elemento
       nascosto e non faceva niente. */
    try{
      const pag=ctrSegnaLinguette(l);
      if(pag&&typeof compPag==="function"){
        const aperta=document.querySelector("#co-nav .conav-v.on");
        if(!aperta||String(aperta.dataset.p)!==String(pag)) compPag(pag,true);
      }
    }catch(e){}
    /* portarlo sulla prima, se no su un modulo lungo non la trova */
    const primo=$(".ctr-msg");
    if(primo&&primo.scrollIntoView) primo.scrollIntoView({block:"center",behavior:"smooth"});
  }

  /* attacca l'orecchio alle caselle del modulo appena aperto */
  function ctrAscolta(tipo){
    const doc=CTR_DOC[tipo]; if(!doc) return;
    /* arrivati qui dalla striscia di una scheda: i segni si accendono subito,
       senza premere niente. La memoria si svuota, cosi' la volta dopo che
       apri lo stesso modulo a mano il modulo e' muto, com'e' giusto. */
    if(ctrAccendiSubito===tipo){
      ctrAccendiSubito=null;
      setTimeout(function(){ ctrGuardaTutto(tipo); },0);
    }
    $$(doc.caselle).forEach(function(el){
      el.addEventListener("blur",()=>ctrGuardaUna(tipo,el));
      /* le tendine e le spunte non hanno un "esco dalla casella" che si
         sente: li' vale il cambio */
      if(el.tagName==="SELECT"||el.type==="checkbox")
        el.addEventListener("change",()=>ctrGuardaUna(tipo,el));
    });
    /* le voci di costo nascono e muoiono mentre scrivi: si ascolta il
       contenitore, cosi' vale anche per le righe aggiunte dopo */
    (doc.dentro||[]).forEach(function(sel){
      const box=$(sel); if(!box) return;
      box.addEventListener("focusout",function(e){
        const el=e.target;
        if(el&&el.tagName==="INPUT") ctrGuardaUna(tipo,el);
      });
    });
  }

  /* Il pezzo di HTML del tasto, uguale per tutte le sezioni.
     ⚠️ Va messo per PRIMO fra le azioni in fondo: cosi' fra lui e «Salva»
     resta sempre in mezzo «Annulla», e non si preme uno per l'altro.
     Niente `sh-foot-sx` qui: quella la usa gia' «Elimina», e due margini
     automatici nella stessa riga si spartiscono lo spazio a caso. */
  function ctrTastoHTML(tipo){
    return '<button type="button" class="btn ctr-tasto" data-action="ctr-guarda" data-ctr="'+tipo+'">'
         + (ruoloUtente==='professionista'?'Controlla prima di mandarlo':'Controlla che sia giusto')+'</button>'
         /* ⚠️ 19 agosto 2026 — IL TASTO DELL'AI SI VEDE SUBITO.
            Prima compariva solo dopo il controllo gratis, per non far
            spendere un credito per sbaglio. Ma nascosto vuol dire anche
            che non sai che c'e': e una cosa che non sai che c'e' non la
            usi mai. Il credito lo protegge il fatto che il tasto va
            PREMUTO, non il fatto che sia invisibile. */
         + (CTR_AI_SEZIONI.indexOf(tipo)>=0
            ? '<button type="button" class="btn ctr-tasto-ai" data-action="ctr-ai" data-ctr="'+tipo+'">'
              + ctrAiLabel()+'</button>'
            : "");
  }

  /* ============================================================
     LA PARTE AI DEL CONTROLLORE — 19 agosto 2026

     Le regole qui sopra sono codice normale: immediate, gratis, e non
     sbagliano mai. Vedono i campi vuoti, i numeri impossibili, le
     aliquote sbagliate. Quello che NON vedono e' come sono scritte le
     cose: un refuso, una voce vaga («opere murarie»), la stessa
     lavorazione contata due volte. Quello lo legge l'AI.

     ⚠️ IL CREDITO SI SPENDE SOLO SE LO DECIDE LUI. Il tasto dell'AI
        compare DOPO il controllo gratis, e va premuto a mano. Se
        partisse dentro lo stesso tasto, ricontrollare un preventivo tre
        volte costerebbe tre crediti senza che nessuno l'abbia chiesto.
     ⚠️ ALL'AI NON VA NIENTE DEL CLIENTE: solo titolo, descrizioni delle
        voci e note. Niente nome, indirizzo, telefono, partita IVA. La
        regola sta scritta anche nel prompt della funzione, ma quella e'
        una promessa: qui e' il codice che non glieli manda.
     ⚠️ QUELLO CHE DICE L'AI E' SEMPRE «DA GUARDARE», MAI «DA
        CORREGGERE», e sta in un riquadro suo, staccato dai segni delle
        regole. Non e' un vezzo grafico: una regola non sbaglia, l'AI
        si', e mischiarle vorrebbe dire far perdere fiducia anche ai
        rossi veri.
     ⚠️ NON CORREGGE E NON BLOCCA NIENTE, come tutto il controllore.
     ============================================================ */
  /* dove l'AI ha davvero qualcosa da leggere: le sezioni con le voci
     scritte a mano. Su un cliente o su una scadenza non avrebbe testo su
     cui lavorare, e un tasto che non serve e' un tasto che confonde. */
  const CTR_AI_SEZIONI=["preventivo","fattura","computo"];
  /* la scritta del tasto sta in un posto solo: dopo una lettura il tasto
     torna com'era, e non si ritrova scritto due modi diversi */
  function ctrAiLabel(){ return ruoloUtente==='professionista' ? "✨ Falla leggere anche all'AI · 1 credito" : "✨ Fai controllare anche all'intelligenza artificiale · 1 credito"; }
  const CTR_AI_MAX=40;      /* quante voci si mandano al massimo */
  const CTR_AI_QUANTE=6;    /* quante segnalazioni si mostrano */
  let ctrAiInCorso=false;

  function _ctrPul(t){ return String(t==null?"":t).replace(/\s+/g," ").trim(); }
  function _ctrVal(sel,dentro){
    const e=(dentro||document).querySelector(sel);
    return e?_ctrPul(e.value):"";
  }
  /* il testo che parte davvero. Torna anche `voci`, che serve a non
     spendere un credito su un documento vuoto. */
  function ctrAiTesto(tipo){
    const r=[]; let voci=0, tagliate=0;
    const metti=function(n,desc,extra){
      voci++;
      if(voci>CTR_AI_MAX){ tagliate++; return; }
      r.push(n+". "+desc+(extra?"  ["+extra+"]":""));
    };
    if(tipo==="preventivo"){
      const t=_ctrVal("#pv-tit"); if(t)r.push("Titolo: "+t);
      r.push("Voci:");
      $$("#prev-righe [data-riga]").forEach(function(d){
        const desc=_ctrVal(".pr-desc",d); if(!desc)return;
        metti(voci+1,desc,"quantità "+(_ctrVal(".pr-qta",d)||"—"));
      });
      const note=[];
      $$("#pv-note-lista .nt-txt").forEach(function(n){ const v=_ctrPul(n.value); if(v)note.push(v); });
      if(note.length)r.push("Note: "+note.join(" / "));
    }else if(tipo==="fattura"){
      r.push("Voci:");
      $$("#fatt-righe [data-riga]").forEach(function(d){
        const desc=_ctrVal(".fr-desc",d); if(!desc)return;
        metti(voci+1,desc,"quantità "+(_ctrVal(".fr-qta",d)||"—"));
      });
      const n=_ctrVal("#fa-note"); if(n)r.push("Note: "+n);
    }else if(tipo==="computo"){
      const t=_ctrVal("#co-tit"); if(t)r.push("Titolo: "+t);
      r.push("Lavorazioni:");
      /* le lavorazioni del computo non stanno nel modulo: stanno nella
         sezione, gia' lette dal database */
      (compVociCache||[]).forEach(function(v){
        const desc=_ctrPul(v.descrizione); if(!desc)return;
        metti(voci+1,desc,"unità "+(_ctrPul(v.unita)||"—")+", quantità "+(v.quantita!=null?v.quantita:"—"));
      });
    }
    return { testo:r.join("\n"), voci:voci, tagliate:tagliate };
  }

  function ctrAiRiquadro(html){
    const corpo=document.querySelector("#sheet .sh-body"); if(!corpo)return null;
    let box=corpo.querySelector(".ctr-ai");
    if(!box){
      box=document.createElement("div");
      box.className="ctr-ai";
      corpo.appendChild(box);
    }
    box.innerHTML=html;
    return box;
  }
  async function ctrAiGuarda(tipo){
    if(ctrAiInCorso)return;
    if(!window.AI||typeof window.AI.dati!=="function"){
      toast("L'AI non è disponibile in questo momento: riprova fra un attimo.");
      return;
    }
    const d=ctrAiTesto(tipo);
    /* ⚠️ un credito su un documento vuoto e' un credito buttato: meglio
       dirglielo prima che dopo */
    if(!d.voci){
      toast("Non c'è ancora niente da rileggere: scrivi almeno una voce.");
      return;
    }
    ctrAiInCorso=true;
    const tasto=document.querySelector('.ctr-tasto-ai[data-ctr="'+tipo+'"]');
    if(tasto){ tasto.disabled=true; tasto.textContent="Sto leggendo…"; }
    const box=ctrAiRiquadro('<div class="ctr-ai-cap">L\'AI sta rileggendo il documento…</div>'
      +'<div class="ctr-ai-sub">Ci mette una decina di secondi.</div>');
    if(box&&box.scrollIntoView)box.scrollIntoView({block:"center",behavior:"smooth"});
    try{
      const out=await window.AI.dati("controllo_documento",d.testo);
      /* null = crediti finiti: la finestra l'ha già mostrata AI.dati, qui
         si toglie solo il riquadro invece di lasciarlo a «sto leggendo» */
      if(out===null){ ctrAiRiquadroVia(); return; }
      const segn=(out&&Array.isArray(out.segnalazioni))?out.segnalazioni:[];
      ctrAiMostra(segn,d.tagliate);
    }catch(e){
      ctrAiRiquadro('<div class="ctr-ai-cap">L\'AI non è riuscita a rileggerlo</div>'
        +'<div class="ctr-ai-sub">'+esc((e&&e.message)||"Riprova fra un attimo.")+'</div>');
    }finally{
      ctrAiInCorso=false;
      if(tasto){ tasto.disabled=false; tasto.textContent=ctrAiLabel(); }
    }
  }
  function ctrAiRiquadroVia(){
    const box=document.querySelector("#sheet .sh-body .ctr-ai");
    if(box)box.remove();
  }
  function ctrAiMostra(segn,tagliate){
    const nota=tagliate
      ? '<div class="ctr-ai-sub">Le voci erano tante: gliene ho fatte leggere le prime '+CTR_AI_MAX+', le altre '+tagliate+' no.</div>'
      : "";
    if(!segn.length){
      ctrAiRiquadro('<div class="ctr-ai-cap">L\'AI l\'ha riletto: non ha trovato niente da dire</div>'
        +'<div class="ctr-ai-sub">Ha guardato refusi, voci vaghe, voci doppie e unità che non tornano.</div>'+nota);
      toast("L'AI l'ha riletto: niente da segnalare ✔");
      return;
    }
    const righe=segn.slice(0,CTR_AI_QUANTE).map(function(s){
      const dove=_ctrPul(s&&s.dove), che=_ctrPul(s&&s.problema);
      if(!che)return "";
      return '<div class="ctr-ai-riga"><span class="ctr-mk">DA GUARDARE</span>'
        +(dove?'<b>'+esc(dove)+'</b> — ':'')+esc(che)+'</div>';
    }).filter(Boolean).join("");
    if(!righe){
      ctrAiRiquadro('<div class="ctr-ai-cap">L\'AI l\'ha riletto: non ha trovato niente da dire</div>'+nota);
      toast("L'AI l'ha riletto: niente da segnalare ✔");
      return;
    }
    /* niente tagli silenziosi: se ne ha trovate più di sei, si dice */
    const troppe=(segn.length>CTR_AI_QUANTE)
      ? '<div class="ctr-ai-sub">Ne ha trovate '+segn.length+': qui sopra ci sono le prime '+CTR_AI_QUANTE+'.</div>' : "";
    ctrAiRiquadro('<div class="ctr-ai-cap">L\'AI ha riletto il documento</div>'
      +'<div class="ctr-ai-sub">Sono cose da guardare, non da correggere per forza: l\'AI può sbagliare. Puoi salvare e mandare lo stesso.</div>'
      +righe+troppe+nota);
    const n=segn.length;
    toast("L'AI ha trovato "+n+(n===1?" cosa da guardare":" cose da guardare")+". Non ti fermo.");
  }

  /* Il ponte per il pulsante «Compila con AI» che sta in cima alle sezioni:
     non apre piu' una finestrella, apre il modulo con la riga gia' pronta.
     Cosi' le due strade portano nello stesso posto. */
  /* ⚠️ 29 agosto 2026 (gradino 3) — IL SECONDO ARGOMENTO.
     `conRiga` dice se il modulo si apre con la riga «Compila con AI»
     gia' spalancata. Chi chiamava prima non lo passa, e per lui non
     cambia niente: senza argomento resta `true`, come e' sempre stato.
     Lo passa `false` solo la CHAT: da li' il testo l'hai gia' scritto
     nella chat, e quella riga, aprendosi, si prende il cursore dopo 60
     millesimi e lo toglie dalla prima casella appena riempita. */
  /* ⛔ 30 agosto 2026, DIFETTO TROVATO COL COLLAUDO DAL VIVO.
     Questo ponte finiva con `jobForm(...)` senza chiedersi che tipo fosse:
     qualunque parola che non era 'cliente' o 'preventivo' apriva il modulo
     del LAVORO. Aggiunti la scadenza e il fornitore dalla chat, chiedere
     «segnami la revisione del furgone» apriva «Nuovo lavoro», e la chat
     diceva convinta «ti ho aperto il modulo»: dallo schermo sembrava tutto
     giusto, ed era il modulo sbagliato.
     ⚠️ Chi aggiunge un modulo alla chat AGGIUNGE UNA RIGA QUI. Il banco
     prove-claude/banco-moduli-30ago.mjs adesso lo controlla. */
  window.gestApriModuloAI=function(tipo,conRiga){
    const riga = (conRiga===false) ? false : true;
    if(tipo==='cliente'){ cliForm(null,'privato',riga); return; }
    if(tipo==='preventivo'){ prevForm(null,null,riga); return; }
    if(tipo==='scadenza'){ scadForm(null); return; }
    if(tipo==='fornitore'){ fornForm(null); return; }
    jobForm(null,"",null,true,false,riga);
  };

  /* ============================================================
     IL FILO — 18 agosto 2026 (domanda di Alessio: «e il cliente lo sa?»)

     No, non lo sapeva. La strada Prezzario -> Computo -> Preventivo ->
     Fattura esisteva, ma stava scritta mezza in una pagina sola: la si
     scopriva per caso. Se non ce l'aveva chiara chi il gestionale l'ha
     costruito, un iscritto non la trovava mai.

     Adesso in cima a quelle sezioni c'e' una striscia sempre uguale, con
     la tappa dove sei accesa e le altre da cliccare. Non e' una
     funzione nuova: e' la stessa strada, disegnata.

     ⚠️ Si mostrano SOLO le tappe che quel profilo ha davvero. Il Computo
        e il Prezzario sono accesi solo per gli studi tecnici: a
        un'impresa una freccia verso una pagina che non esiste sarebbe
        peggio del silenzio.
     ⚠️ Meno di due tappe = niente striscia: una freccia sola non e' una
        strada.
     ============================================================ */
  /* ⚠️ 20 agosto 2026 — IL NOME DEL COMPUTO STA IN QUATTRO POSTI: la voce del
     menu, il titolo della sezione, la scheda del Riepilogo e QUESTA STRISCIA.
     Il quarto me l'ero dimenticato: la striscia scriveva «Computo metrico»
     anche all'impresa, due centimetri sotto un titolo che diceva «Computo da
     prezzare». Trovato guardando la foto della pagina vera, non dal banco.
     Una regola che sta in quattro posti non si sistema in tre. */
  const FILO=[
    {tab:"prezzario",  lab:"Prezzario"},
    {tab:"computi",    lab:"Computo metrico"},
    {tab:"preventivi", lab:"Preventivo"},
    {tab:"fatture",    lab:"Fattura"}
  ];
  function filoLab(p){ return p.tab==="computi" ? _cm('nome') : p.lab; }
  function filoHTML(qui){
    const passi=FILO.filter(function(p){
      const b=document.querySelector('nav.tabs button[data-tab="'+p.tab+'"]');
      return !!b && b.style.display!=="none";
    });
    if(passi.length<2) return "";
    return '<div class="filo">'
      + '<span class="filo-t">'+(ruoloUtente==='professionista'?'Come si incastrano':'Cosa viene prima e cosa dopo')+'</span>'
      + passi.map(function(p,i){
          return (i?'<span class="filo-fre">&rarr;</span>':'')
            + (p.tab===qui
               ? '<span class="filo-p filo-p--qui">'+filoLab(p)+'</span>'
               : '<button type="button" class="filo-p" data-action="rie-go" data-go="'+p.tab+'">'+filoLab(p)+'</button>');
        }).join("")
      + '</div>';
  }
  /* la striscia si mette sotto la frase di apertura della sezione, e si
     rifa' a ogni ridisegno: il profilo puo' cambiare mentre sei dentro */
  function filoMetti(sez,qui){
    const s=document.getElementById(sez); if(!s) return;
    const vecchia=s.querySelector(".filo");
    const html=filoHTML(qui);
    if(!html){ if(vecchia)vecchia.remove(); return; }
    if(vecchia){ vecchia.outerHTML=html; return; }
    const dopo=s.querySelector(".gal-intro")||s.querySelector(".sec-head");
    if(dopo) dopo.insertAdjacentHTML("afterend",html);
  }

  /* controllo segmentato (Agenda "Mostra", Galleria tipo foto): un solo pulsante acceso */
  function segmOn(sel,v){$$(sel+" button").forEach(x=>x.classList.toggle("on",x.dataset.v===v));}
