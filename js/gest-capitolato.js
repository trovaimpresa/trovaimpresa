/* ============================================================
   IL CAPITOLATO — 16 ottobre 2026
   ============================================================
   Il capitolato e' il foglio che dice al cliente COSA si fa, con quali
   materiali, cosa e' compreso e cosa NO. Si allega al preventivo: serve a
   non litigare dopo («questo non era compreso»).

   Dove sta: nel menu di ogni preventivo, «📋 Capitolato». Si apre una
   finestra grande a due colonne (come il preventivo): a sinistra l'intestazione,
   a destra le voci dei lavori. In fondo: Scarica PDF e Salva.

   ⛔ NON C'E' UNA TABELLA NUOVA. Il capitolato sta in UNA colonna del
   preventivo (gest_preventivi.capitolato, jsonb — sql/capitolato-nel-preventivo.sql).
   Perche': cosi' segue il preventivo dappertutto — finisce nel Cestino con lui,
   si ripristina con lui, se ne va con lui — senza toccare l'elenco del cestino
   ne' quello dei reparti, che sono i due posti dove una tabella nuova fa danni.
   Il rovescio: un preventivo = un capitolato.

   ⛔ L'AI (1 credito) e' una funzione a parte: supabase/functions/ai-capitolato.
   Non inventa marche, prezzi, percentuali o durate: quello che non e' stato
   detto resta vuoto. E non scrive mai nel database: riempie le caselle e
   chi lavora controlla e salva lui. Quello che hai scritto a mano non si tocca:
   le voci dell'AI si aggiungono in fondo, le caselle gia' piene restano.

   ⛔ Si usa SOLO openSheetGrande(), mai openSheet(): la finestrella e' vietata.
   ⛔ Niente testo sotto i 13 px.

   Il file sta dentro una scatola (function(){...})() perche' i nomi qui
   sotto non devono scontrarsi con quelli degli altri file del gestionale,
   che vivono tutti nella stessa pagina. Fuori esce una cosa sola:
   window.gestCapitolato (serve ai banchi di prova).
   ============================================================ */
(function(){
  "use strict";

  /* ---------- i modelli pronti ----------
     Voci scritte per un cliente che non e' del mestiere. I materiali restano
     «da concordare»: marche e formati li decide chi fa il lavoro, non il modello.
     Le esclusioni sono quelle che di solito fanno discutere dopo. */
  var DA_CONCORDARE="Da concordare con il cliente";
  var MODELLI={
    bagno:{nome:"Bagno — rifacimento completo",voci:[
      {titolo:"Demolizioni e rimozioni",
       cosa:"Demolizione del pavimento e dei rivestimenti esistenti, rimozione dei sanitari e smontaggio dei vecchi impianti a vista.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie in discarica autorizzata.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti. Opere strutturali."},
      {titolo:"Impianto idraulico",
       cosa:"Nuove linee di scarico e di acqua calda e fredda, con valvole di intercettazione. Allaccio dei nuovi sanitari.",
       materiali:DA_CONCORDARE,
       compreso:"Prova di tenuta dell'impianto prima della chiusura delle tracce.",
       escluso:"Spostamento delle colonne di scarico condominiali. Modifiche alla caldaia o alla rete generale."},
      {titolo:"Impianto elettrico del bagno",
       cosa:"Linea per luci, prese e ventilazione del bagno, con collegamento equipotenziale.",
       materiali:DA_CONCORDARE,
       compreso:"Frutti e placche della serie concordata.",
       escluso:"Adeguamento del quadro elettrico generale dell'abitazione."},
      {titolo:"Massetto e impermeabilizzazione",
       cosa:"Rifacimento del massetto di livellamento e posa della guaina impermeabile sul pavimento e alla base delle pareti.",
       materiali:"",
       compreso:"Pendenze verso lo scarico della doccia.",
       escluso:"Rinforzo o riparazione di solai danneggiati."},
      {titolo:"Pavimenti e rivestimenti",
       cosa:"Posa del pavimento e del rivestimento delle pareti, con stuccatura delle fughe e profili d'angolo.",
       materiali:DA_CONCORDARE,
       compreso:"Colla, stucco e profili.",
       escluso:"Piastrelle e materiali scelti dal cliente oltre il prezzo indicato nel preventivo."},
      {titolo:"Sanitari e rubinetteria",
       cosa:"Montaggio dei sanitari, della rubinetteria e del piatto o box doccia, con collaudo finale.",
       materiali:DA_CONCORDARE,
       compreso:"Collegamenti, sigillature e pulizia finale del bagno.",
       escluso:"Difetti di fabbrica dei sanitari forniti dal cliente."}
    ]},
    ristrutturazione:{nome:"Ristrutturazione appartamento",voci:[
      {titolo:"Demolizioni e rimozioni",
       cosa:"Demolizione di pavimenti, rivestimenti e tramezzi indicati in progetto, e rimozione degli impianti da rifare.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie in discarica autorizzata.",
       escluso:"Rimozione di materiali contenenti amianto, se presenti. Demolizione di muri portanti."},
      {titolo:"Opere murarie",
       cosa:"Costruzione dei nuovi tramezzi, tracce per gli impianti e loro chiusura, ripristini degli intonaci.",
       materiali:DA_CONCORDARE,
       compreso:"Materiali e mano d'opera per le murature indicate nel preventivo.",
       escluso:"Pratiche edilizie e progetti. Ripristino di murature nascoste e trovate in cattivo stato."},
      {titolo:"Impianto elettrico",
       cosa:"Rifacimento delle linee, dei punti luce e delle prese, con nuovo quadro elettrico.",
       materiali:DA_CONCORDARE,
       compreso:"Frutti e placche della serie concordata. Dichiarazione di conformità.",
       escluso:"Aumento della potenza del contatore (a carico del cliente presso il fornitore)."},
      {titolo:"Impianto idraulico",
       cosa:"Rifacimento delle linee di scarico e di acqua calda e fredda, con collettori e valvole.",
       materiali:DA_CONCORDARE,
       compreso:"Prova di tenuta dell'impianto prima della chiusura delle tracce.",
       escluso:"Spostamento delle colonne condominiali. Sostituzione di caldaia e radiatori, se non indicata."},
      {titolo:"Massetti e pavimenti",
       cosa:"Massetto di livellamento e posa dei nuovi pavimenti e battiscopa.",
       materiali:DA_CONCORDARE,
       compreso:"Colla, stucco e battiscopa.",
       escluso:"Pavimenti e materiali scelti dal cliente oltre il prezzo indicato nel preventivo."},
      {titolo:"Intonaci e tinteggiatura",
       cosa:"Rasatura delle pareti e dei soffitti e tinteggiatura a due mani.",
       materiali:DA_CONCORDARE,
       compreso:"Protezione di pavimenti e serramenti. Pulizia finale.",
       escluso:"Spostamento dei mobili. Colori speciali o decorazioni."}
    ]},
    tinteggiatura:{nome:"Tinteggiatura interna",voci:[
      {titolo:"Protezione e preparazione",
       cosa:"Copertura di pavimenti, mobili e serramenti. Stuccatura di buchi e crepe e carteggiatura delle pareti.",
       materiali:"",
       compreso:"Teli, nastri e stucco.",
       escluso:"Spostamento di mobili e arredi, se non concordato. Trattamento di muffe o infiltrazioni."},
      {titolo:"Fondo e isolante",
       cosa:"Mano di fondo dove serve per far aderire bene la pittura, e isolante sulle macchie.",
       materiali:DA_CONCORDARE,
       compreso:"Prodotto e applicazione.",
       escluso:""},
      {titolo:"Tinteggiatura di pareti e soffitti",
       cosa:"Tinteggiatura a due mani di pareti e soffitti, con cura dei bordi e degli angoli.",
       materiali:DA_CONCORDARE,
       compreso:"Pittura nel colore scelto e due mani complete.",
       escluso:"Colori speciali, decorazioni e smalti su porte e infissi."},
      {titolo:"Pulizia finale",
       cosa:"Rimozione dei teli e pulizia degli ambienti a fine lavoro.",
       materiali:"",
       compreso:"Smaltimento dei residui di cantiere.",
       escluso:""}
    ]},
    elettrico:{nome:"Impianto elettrico",voci:[
      {titolo:"Tracce e predisposizioni",
       cosa:"Esecuzione delle tracce nelle pareti e posa delle scatole e dei tubi per i nuovi punti.",
       materiali:"",
       compreso:"Trasporto e smaltimento delle macerie.",
       escluso:"Ripristino degli intonaci e delle finiture, se non indicato nel preventivo."},
      {titolo:"Linee e punti luce e presa",
       cosa:"Posa dei cavi e realizzazione dei punti luce, delle prese e dei comandi indicati.",
       materiali:DA_CONCORDARE,
       compreso:"Cavi, tubi e scatole.",
       escluso:"Punti aggiuntivi richiesti a lavori iniziati."},
      {titolo:"Quadro elettrico",
       cosa:"Nuovo quadro con interruttori differenziali e magnetotermici, e collegamento delle linee.",
       materiali:DA_CONCORDARE,
       compreso:"Montaggio, cablaggio e targhette identificative.",
       escluso:"Aumento della potenza del contatore (a carico del cliente presso il fornitore)."},
      {titolo:"Frutti e placche",
       cosa:"Montaggio di interruttori, prese e placche a lavori finiti.",
       materiali:DA_CONCORDARE,
       compreso:"Frutti e placche della serie concordata.",
       escluso:"Serie di pregio oltre il prezzo indicato nel preventivo."},
      {titolo:"Collaudo e dichiarazione di conformità",
       cosa:"Prove di funzionamento dell'impianto e rilascio della dichiarazione di conformità.",
       materiali:"",
       compreso:"Dichiarazione di conformità ai sensi del D.M. 37/2008.",
       escluso:"Verifiche e pratiche richieste da enti esterni."}
    ]}
  };

  /* ---------- un po' di utilita' ---------- */
  function T(v){ return (v==null)?"":String(v).trim(); }
  function vuota(v){ return !(T(v.titolo)||T(v.cosa)||T(v.materiali)||T(v.compreso)||T(v.escluso)); }
  function copiaVoce(v){ return {titolo:T(v.titolo),cosa:T(v.cosa),materiali:T(v.materiali),compreso:T(v.compreso),escluso:T(v.escluso)}; }

  /* Il CSS delle voci sta qui e non in css/gestionale.css, che si divide con
     il gestionale del noleggio. Le misure rispettano la regola dei 13 px. */
  function stile(){
    if(document.getElementById("cap-stile")) return;
    var s=document.createElement("style"); s.id="cap-stile";
    s.textContent=
      ".cap-voce{border:1px solid var(--bordo);border-radius:12px;padding:14px 16px 4px;margin-bottom:14px;background:var(--sfondo)}"
     +".cap-voce-t{display:flex;align-items:center;gap:8px;margin-bottom:10px}"
     +".cap-voce-n{flex:0 0 auto;font-size:16px;font-weight:800;color:var(--testo)}"
     +".cap-voce-f{flex:1 1 auto;margin:0}"
     +".cap-voce-f input{font-weight:700}"
     +".cap-voce .rdel{flex:0 0 auto;min-width:44px;height:44px;border:1px solid var(--bordo-forte);background:var(--card);color:var(--err);border-radius:10px;cursor:pointer;font-size:22px}"
     +".cap-voce .rdel:hover{background:var(--err-bg)}"
     +".cap-riep{font-size:15px;line-height:1.6;color:var(--testo);margin-bottom:12px}"
     +".cap-riep b{font-weight:700}"
     +".cap-azioni{display:flex;gap:8px;flex-wrap:wrap}";
    document.head.appendChild(s);
  }

  function voceHtml(v,i){
    v=v||{};
    return '<div class="cap-voce" data-voce>'
      +'<div class="cap-voce-t"><span class="cap-voce-n">'+(i+1)+'.</span>'
      +'<div class="field cap-voce-f"><input class="cp-v-tit" placeholder="Es. Impianto idraulico" value="'+esc(v.titolo||"")+'"></div>'
      +'<button type="button" class="rdel" data-action="cap-voce-del" title="Togli questa voce">×</button></div>'
      +'<div class="field"><label>Cosa si fa</label><textarea class="cp-v-cosa" rows="3" placeholder="Cosa fai, scritto per il cliente">'+esc(v.cosa||"")+'</textarea></div>'
      +'<div class="field"><label>Materiali (marca e tipo)</label><input class="cp-v-mat" placeholder="Es. Gres porcellanato 60x60, prima scelta" value="'+esc(v.materiali||"")+'"></div>'
      +'<div class="row2">'
      +'<div class="field"><label>Compreso</label><textarea class="cp-v-comp" rows="2" placeholder="Cosa è incluso nel prezzo">'+esc(v.compreso||"")+'</textarea></div>'
      +'<div class="field"><label>Escluso</label><textarea class="cp-v-esc" rows="2" placeholder="Cosa NON è incluso">'+esc(v.escluso||"")+'</textarea></div></div>'
      +'</div>';
  }
  function rinumera(){
    var el=document.querySelectorAll("#cp-voci .cap-voce .cap-voce-n");
    for(var i=0;i<el.length;i++) el[i].textContent=(i+1)+".";
  }
  function leggiVoci(){
    var out=[];
    var el=document.querySelectorAll("#cp-voci .cap-voce");
    for(var i=0;i<el.length;i++){
      var q=function(c){ var x=el[i].querySelector(c); return x?T(x.value):""; };
      var v={titolo:q(".cp-v-tit"),cosa:q(".cp-v-cosa"),materiali:q(".cp-v-mat"),compreso:q(".cp-v-comp"),escluso:q(".cp-v-esc")};
      if(!vuota(v)) out.push(v);
    }
    return out;
  }
  function riempiVoci(voci){
    var c=document.getElementById("cp-voci"); if(!c) return;
    var h=""; (voci&&voci.length?voci:[{}]).forEach(function(v,i){ h+=voceHtml(v,i); });
    c.innerHTML=h;
  }
  function aggiungiVoci(voci){
    var c=document.getElementById("cp-voci"); if(!c) return;
    /* le voci rimaste vuote (in un modulo nuovo ce n'e' una) si tolgono;
       quelle scritte a mano restano e le nuove vanno in fondo */
    var el=c.querySelectorAll(".cap-voce");
    for(var i=0;i<el.length;i++){
      var q=function(k){ var x=el[i].querySelector(k); return x?T(x.value):""; };
      if(vuota({titolo:q(".cp-v-tit"),cosa:q(".cp-v-cosa"),materiali:q(".cp-v-mat"),compreso:q(".cp-v-comp"),escluso:q(".cp-v-esc")})) el[i].remove();
    }
    var n=c.querySelectorAll(".cap-voce").length, h="";
    voci.forEach(function(v,i){ h+=voceHtml(v,n+i); });
    c.insertAdjacentHTML("beforeend",h);
    rinumera();
  }
  function leggiForm(){
    var V=function(id){ var e=document.getElementById(id); return e?T(e.value):""; };
    return {voci:leggiVoci(),dove:V("cp-dove"),inizio:V("cp-inizio"),durata:V("cp-durata"),
            pagamenti:V("cp-pag"),garanzie:V("cp-gar"),note:V("cp-note")};
  }
  function haQualcosa(){ var c=leggiForm(); return c.voci.length>0; }

  /* ---------- la finestra ---------- */
  var _stato={id:null,p:null,righe:[],cli:{}};

  async function capitolatoForm(id){
    if(!sb||!sbUid){ toast("Devi essere loggato"); return; }
    var p=prevCache.find(function(x){ return String(x.id)===String(id); });
    if(!p){ toast("Preventivo non trovato"); return; }
    stile();
    var r1=await sb.from("gest_preventivi").select("capitolato").eq("id",id).eq("user_id",sbUid).maybeSingle();
    if(r1.error){
      /* 42703 = la colonna non c'e': il file SQL non e' stato eseguito */
      toast(r1.error.code==="42703"
        ? "Manca un pezzo nel database (sql/capitolato-nel-preventivo.sql). Avvisa Claude."
        : "Non riesco a leggere il capitolato: "+(r1.error.message||"il database non risponde")+". Riprova fra un attimo.");
      return;
    }
    var cap=(r1.data&&r1.data.capitolato)||{};
    var r2=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    var righe=(r2&&r2.data)||[];
    var cli=await cliDelDocumento(p.cliente_id);
    _stato={id:id,p:p,righe:righe,cli:cli||{}};

    var modOpz='<option value="">— Scegli un modello —</option>'
      +Object.keys(MODELLI).map(function(k){ return '<option value="'+k+'">'+esc(MODELLI[k].nome)+'</option>'; }).join("");
    var pagOpz='<option value="">— Scegli, oppure scrivi sotto —</option>'
      +ORD_PAGAMENTI.map(function(o){ return '<option value="'+o[0]+'">'+esc(o[1])+'</option>'; }).join("");
    var nRighe=righe.filter(function(r){ return !_rigaSezione(r)&&T(r.descrizione); }).length;
    var esempio="Rifacimento bagno 5 mq: demolisco tutto, nuovo impianto idraulico, gres 60x60 a terra e a parete, sanitari sospesi, doccia a filo pavimento. Tre settimane.";

    var corpo=
      /* la riga dell'AI: stessa faccia di quella del preventivo */
      '<div class="ai-riga" id="cp-ai">'
      +'<button type="button" class="ai-riga-apri" id="cp-ai-apri" aria-expanded="false" aria-controls="cp-ai-giu">'
      +'<span class="ai-riga-mk">AI</span><span class="ai-riga-t">Descrivi il lavoro a parole e ti scrivo il capitolato</span><span class="ai-riga-c">1 credito</span></button>'
      +'<div class="ai-riga-giu" id="cp-ai-giu" hidden>'
      +'<label class="ai-riga-lab" for="cp-ai-in">Scrivi come lo racconteresti al telefono</label>'
      +'<textarea id="cp-ai-in" rows="3" placeholder="'+esc(esempio)+'"></textarea>'
      +'<div class="ai-riga-az"><button type="button" class="ai-riga-go" id="cp-ai-go" data-action="cap-ai">Scrivi il capitolato</button>'
      +'<div class="ai-riga-st" id="cp-ai-st" role="status"></div></div></div></div>'
      +'<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Che capitolato è</div>'
      +'<div class="cap-riep"><b>Preventivo n. '+esc(p.numero||"")+'</b> del '+esc(fdate(p.data||todayStr()))+(p.titolo?' — '+esc(p.titolo):'')
      +'<br>Cliente: <b>'+esc(cli&&cli.nome?cli.nome:"— nessuno —")+'</b></div>'
      +'<div class="field"><label>Indirizzo del cantiere</label><input id="cp-dove" value="'+esc(cap.dove||"")+'" placeholder="Es. Via Roma 12, Rieti"></div>'
      +'<div class="field"><label>Parti da un modello</label><select id="cp-modello">'+modOpz+'</select>'
      +'<div class="campo-aiuto">Il modello scrive già le voci. Tu cambi quello che serve.</div></div>'
      +'</div>'
      +'<div class="sh-b"><div class="sh-tit">Tempi e pagamenti</div>'
      +'<div class="row2"><div class="field"><label>Inizio lavori</label><input type="date" id="cp-inizio" value="'+esc(cap.inizio||"")+'"></div>'
      +'<div class="field"><label>Durata (giorni lavorativi)</label><input id="cp-durata" inputmode="numeric" value="'+esc(cap.durata||"")+'" placeholder="Es. 15"></div></div>'
      +'<div class="field"><label>Come si paga</label><select id="cp-pag-sel">'+pagOpz+'</select>'
      +'<textarea id="cp-pag" rows="3" style="margin-top:8px" placeholder="Es. 30% alla firma, 40% a metà lavori, 30% a fine lavori">'+esc(cap.pagamenti||"")+'</textarea></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Le voci dei lavori</div>'
      +'<div id="cp-voci"></div>'
      +'<div class="cap-azioni"><button type="button" class="btn-ghost quick-add" data-action="cap-voce-add">+ Aggiungi voce</button>'
      +(nRighe?'<button type="button" class="btn-ghost quick-add" data-action="cap-voci-prev">+ Porta le voci dal preventivo ('+nRighe+')</button>':'')
      +'</div></div>'
      +'<div class="sh-b"><div class="sh-tit">Garanzie e note</div>'
      +'<div class="field"><label>Garanzie in più (la garanzia di legge la scrive già il PDF)</label><textarea id="cp-gar" rows="2" placeholder="Es. Garanzia di 2 anni sull\'impianto idraulico">'+esc(cap.garanzie||"")+'</textarea></div>'
      +'<div class="field"><label>Note e condizioni particolari</label><textarea id="cp-note" rows="3" placeholder="Es. Il cliente fornisce le piastrelle. Smaltimento macerie a carico dell\'impresa.">'+esc(cap.note||"")+'</textarea></div>'
      +'</div>'
      +'</div></div>';

    openSheetGrande("Capitolato — "+(p.titolo||("preventivo n. "+(p.numero||""))),
      corpo,
      '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn" data-action="cap-pdf" data-id="'+esc(String(id))+'">📄 Scarica PDF</button>'
      +'<button class="btn-primary b-save" data-action="cap-salva" data-id="'+esc(String(id))+'">Salva capitolato</button>');
    riempiVoci(cap.voci&&cap.voci.length?cap.voci:null);

    /* apre e chiude la riga dell'AI */
    var apri=document.getElementById("cp-ai-apri"), giu=document.getElementById("cp-ai-giu"), riga=document.getElementById("cp-ai");
    if(apri&&giu) apri.onclick=function(){
      var apre=giu.hasAttribute("hidden");
      if(apre) giu.removeAttribute("hidden"); else giu.setAttribute("hidden","");
      apri.setAttribute("aria-expanded",apre?"true":"false");
      if(riga) riga.classList.toggle("ai-riga--aperta",apre);
      if(apre) setTimeout(function(){ var i=document.getElementById("cp-ai-in"); if(i) i.focus(); },60);
    };
  }

  /* ---------- salvare ---------- */
  async function salva(id,zitto){
    var dati=leggiForm();
    dati.aggiornato=new Date().toISOString();
    var res=await sb.from("gest_preventivi").update({capitolato:dati}).eq("id",id).eq("user_id",sbUid).select("id");
    if(res.error||!res.data||!res.data.length){
      toast("Non salvato: "+((res.error&&res.error.message)||"il preventivo non risponde")+". Riprova.");
      return null;
    }
    if(!zitto) toast("Capitolato salvato ✅");
    return dati;
  }

  /* ---------- l'AI ---------- */
  async function scriviConAI(){
    var inp=document.getElementById("cp-ai-in"), go=document.getElementById("cp-ai-go"), st=document.getElementById("cp-ai-st");
    if(!inp||!go||!st) return;
    var testo=T(inp.value);
    if(!testo){ st.className="ai-riga-st ai-riga-st--err"; st.textContent="Scrivi due righe qui sopra e riprovo."; inp.focus(); return; }
    if(!window.AI||typeof window.AI.capitolato!=="function"){
      st.className="ai-riga-st ai-riga-st--err"; st.textContent="L'assistente non si è caricato. Ricarica la pagina e riprova."; return;
    }
    /* le voci del preventivo vanno anche all'AI: cosi' il capitolato parla
       delle stesse lavorazioni che il cliente ha letto nel preventivo */
    /* ⛔ IL SERVER ACCETTA AL MASSIMO 8000 CARATTERI. Un preventivo grosso (visto dal
       vivo il 16 ott: quasi 90 voci) li superava e l'AI rispondeva «Il testo e' troppo
       lungo» senza fare niente. Per questo qui si taglia: il testo scritto da chi usa
       il gestionale ha la precedenza (fino a 3000), le voci del preventivo entrano
       una per una finche' c'e' posto, ognuna accorciata a 140 caratteri. */
    var righe=_stato.righe.filter(function(r){ return !_rigaSezione(r)&&T(r.descrizione); });
    var MAX=7400;
    var input=testo.slice(0,3000);
    if(_stato.p&&_stato.p.titolo) input+="\n\nTitolo del preventivo: "+T(_stato.p.titolo).slice(0,200);
    if(righe.length){
      var elenco=[], tot=input.length+30;
      for(var k=0;k<righe.length;k++){
        var riga="- "+T(righe[k].descrizione).slice(0,140);
        if(tot+riga.length+1>MAX) break;
        elenco.push(riga); tot+=riga.length+1;
      }
      if(elenco.length) input+="\n\nVoci del preventivo:\n"+elenco.join("\n");
    }
    var prima=go.textContent;
    go.disabled=true; go.textContent="Ci penso io...";
    st.className="ai-riga-st"; st.textContent="";
    try{
      var d=await window.AI.capitolato(input);
      if(d===null){ go.disabled=false; go.textContent=prima; return; }   /* crediti finiti: l'avviso l'ha gia' dato l'AI */
      var messi=[];
      var nuove=(d.voci||[]).map(copiaVoce).filter(function(v){ return !vuota(v); });
      if(nuove.length){ aggiungiVoci(nuove); messi.push(nuove.length+(nuove.length===1?" voce":" voci")); }
      /* una casella gia' scritta non si tocca */
      var metti=function(id,val,nome){
        var e=document.getElementById(id); val=T(val);
        if(!e||!val||T(e.value)) return;
        e.value=val; messi.push(nome);
      };
      metti("cp-durata",d.durata_giorni==null?"":String(parseInt(d.durata_giorni,10)||""),"durata");
      metti("cp-pag",d.pagamenti,"pagamenti");
      metti("cp-gar",d.garanzie,"garanzie");
      metti("cp-note",d.note,"note");
      if(!messi.length){
        st.className="ai-riga-st ai-riga-st--err";
        st.textContent="Non ho capito niente di utile. Prova a scriverlo con più dettagli: cosa, dove, quanto tempo.";
      }else{
        st.className="ai-riga-st ai-riga-st--ok";
        st.textContent="Fatto: "+messi.join(", ")+". Leggi e correggi quello che non va: la firma è tua.";
      }
    }catch(e){
      st.className="ai-riga-st ai-riga-st--err";
      st.textContent=(e&&e.message)?e.message:"Non ci sono riuscito. Riprova fra un attimo.";
    }
    go.disabled=false; go.textContent=prima;
  }

  /* ---------- il PDF ---------- */
  async function capitolatoPdf(id){
    if(!(await caricaJsPDF())){ toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
    var p=prevCache.find(function(x){ return String(x.id)===String(id); }); if(!p){ toast("Preventivo non trovato"); return; }
    var rz=await sb.from("gest_azienda").select("*").eq("user_id",sbUid).maybeSingle();
    var az=rz&&rz.data;
    if(!az||!az.nome){ toast("Compila prima i Dati azienda"); return aziendaForm(); }
    var dati=leggiForm();
    if(!dati.voci.length){ toast("Scrivi almeno una voce dei lavori, o scegli un modello"); return; }
    /* il PDF salva anche: quello che esce sul foglio e' quello che resta nel gestionale */
    var salvato=await salva(id,true);
    if(!salvato) return;
    var c=_stato.cli||{};
    var rr=await sb.from("gest_preventivo_righe").select("*").eq("preventivo_id",id).order("ordine");
    var imponibile=0; ((rr&&rr.data)||[]).forEach(function(r){ imponibile+=impRiga(r.qta,r.prezzo); });
    var perc=(p.iva_perc==null||p.iva_perc==="")?null:(+p.iva_perc||0);
    var ivaVal=perc?_centPerc(imponibile,perc):0;
    var totale=_cent2(imponibile+ivaVal);

    var doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
    var M=18, R=210-M, L=R-M, y=20;
    function stileTesto(size,grassetto,colore){
      doc.setFont("helvetica",grassetto?"bold":"normal"); doc.setFontSize(size||9.5); doc.setTextColor(colore==null?0:colore);
    }
    function paragrafo(txt,size,grassetto,colore,rientro){
      stileTesto(size,grassetto,colore);
      var r=rientro||0;
      doc.splitTextToSize(String(txt),L-r).forEach(function(riga){
        if(y+4.6>272){ doc.addPage(); y=20; stileTesto(size,grassetto,colore); }
        doc.text(riga,M+r,y); y+=4.6;
      });
      doc.setTextColor(0);
    }
    var nArt=0;
    function titoletto(t){ nArt++; y+=4; if(y+10>272){ doc.addPage(); y=20; } paragrafo(nArt+". "+t,10.5,true); y+=1.5; }

    /* intestazione impresa */
    y=window.gestLogoPdf?await window.gestLogoPdf(doc,M,y):y;
    doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(az.nome,M,y);
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
    var hy=y+6;
    [az.piva?"P.IVA "+az.piva:"",azIndirizzo(az),[az.tel?"Tel "+az.tel:"",az.email||""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(function(t){ doc.text(t,M,hy); hy+=4.5; });
    doc.setTextColor(0);
    y=hy+6; doc.setDrawColor(210); doc.line(M,y,R,y); y+=9;

    doc.setFont("helvetica","bold"); doc.setFontSize(15);
    doc.text("CAPITOLATO DEI LAVORI",105,y,{align:"center"}); y+=6;
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
    doc.text("Rif. preventivo n. "+(p.numero||"")+" del "+fdate(p.data||todayStr()),105,y,{align:"center"});
    doc.setTextColor(0); y+=10;

    /* le parti */
    var cliInd=[T(c.indirizzo),[T(c.cap),T(c.citta)].filter(Boolean).join(" ")+(T(c.prov)?" ("+String(c.prov).toUpperCase()+")":"")].filter(function(x){ return x&&x.trim(); }).join(", ");
    var cliRighe=[c.nome||"—"];
    if(cliInd) cliRighe.push(cliInd);
    if(c.piva) cliRighe.push("P.IVA "+c.piva);
    if(c.cod_fiscale) cliRighe.push("C.F. "+c.cod_fiscale);
    paragrafo("IL COMMITTENTE",9.5,true); cliRighe.forEach(function(r){ paragrafo(r,9.5,false); }); y+=3;
    paragrafo("L'IMPRESA ESECUTRICE",9.5,true);
    [az.nome,azIndirizzo(az),az.piva?"P.IVA "+az.piva:""].filter(Boolean).forEach(function(r){ paragrafo(r,9.5,false); });
    y+=2;

    titoletto("Oggetto dei lavori");
    paragrafo((p.titolo||"Lavori")+(dati.dove?". Luogo di esecuzione: "+dati.dove:"")+".");

    titoletto("Descrizione delle opere");
    dati.voci.forEach(function(v,i){
      if(y+22>272){ doc.addPage(); y=20; }
      y+=1.5;
      paragrafo("2."+(i+1)+"  "+(v.titolo||"Lavorazione"),10,true);
      if(v.cosa) paragrafo(v.cosa,9.5,false,0,4);
      if(v.materiali) paragrafo("Materiali: "+v.materiali,9.5,false,0,4);
      if(v.compreso) paragrafo("Compreso: "+v.compreso,9.5,false,0,4);
      if(v.escluso) paragrafo("Escluso: "+v.escluso,9.5,false,0,4);
      y+=1.5;
    });
    paragrafo("Tutto quanto non espressamente indicato in questo capitolato si intende escluso.",8.8,false,90);

    if(dati.inizio||dati.durata){
      titoletto("Tempi di esecuzione");
      var tempi=[];
      if(dati.inizio) tempi.push("I lavori avranno inizio il "+fdate(dati.inizio)+".");
      if(dati.durata) tempi.push("La durata prevista è di "+dati.durata+" giorni lavorativi.");
      paragrafo(tempi.join(" ")+" Non sono computati nei termini i giorni di maltempo che impediscono la lavorazione e le sospensioni richieste dal Committente.");
    }

    titoletto("Corrispettivo e pagamenti");
    paragrafo("Il corrispettivo è quello indicato nel preventivo n. "+(p.numero||"")+" del "+fdate(p.data||todayStr())
      +", che fa parte di questo capitolato: totale "+eurPdf(totale)+(perc?" (IVA "+_pct(perc)+"% compresa)":" (IVA esclusa)")+".");
    if(dati.pagamenti){ y+=1; paragrafo(dati.pagamenti); }
    if(az.iban){ y+=1; paragrafo("Il pagamento avviene tramite bonifico bancario sull'IBAN "+az.iban+"."); }

    titoletto("Garanzia");
    paragrafo("L'Impresa garantisce le opere eseguite a regola d'arte ai sensi degli artt. 1667 e 1669 del codice civile. "
      +"Eventuali difformità o vizi devono essere segnalati dal Committente per iscritto entro i termini di legge."
      +(dati.garanzie?" "+dati.garanzie:""));

    titoletto("Varianti e lavori aggiuntivi");
    paragrafo("Ogni lavorazione non prevista in questo capitolato deve essere concordata per iscritto fra le parti, con il relativo prezzo, prima di essere eseguita.");

    if(dati.note){ titoletto("Condizioni particolari"); paragrafo(dati.note); }

    /* le firme: un blocco unico, che non si spezza fra due pagine */
    if(y+46>280){ doc.addPage(); y=20; }
    y+=8;
    paragrafo((T(az.citta)?az.citta+", ":"")+"li "+fdate(todayStr()),9.5,false);
    y+=14;
    doc.setDrawColor(120);
    doc.line(M,y,M+70,y); doc.line(R-70,y,R,y);
    y+=5;
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90);
    doc.text("L'Impresa",M,y); doc.text("Il Committente",R-70,y);
    doc.setTextColor(0);

    doc.save("capitolato-"+(p.numero||"")+"-"+String(c.nome||"cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".pdf");
    toast("Capitolato scaricato ✅");
  }

  /* ---------- i pulsanti ---------- */
  document.addEventListener("click",async function(e){
    var t=e.target.closest&&e.target.closest("[data-action]"); if(!t) return;
    var a=t.dataset.action;
    if(a.indexOf("cap-")!==0&&a!=="prev-capitolato") return;
    if(a==="prev-capitolato") return capitolatoForm(t.dataset.id);
    if(a==="cap-salva"){ var d=await salva(t.dataset.id); if(d) closeSheet(); return; }
    if(a==="cap-pdf") return capitolatoPdf(t.dataset.id);
    if(a==="cap-ai") return scriviConAI();
    if(a==="cap-voce-add"){
      var c=document.getElementById("cp-voci"); if(!c) return;
      c.insertAdjacentHTML("beforeend",voceHtml({},c.querySelectorAll(".cap-voce").length));
      var ult=c.querySelectorAll(".cap-voce .cp-v-tit"); if(ult.length) ult[ult.length-1].focus();
      return;
    }
    if(a==="cap-voce-del"){
      var box=t.closest(".cap-voce"); if(box) box.remove();
      if(!document.querySelector("#cp-voci .cap-voce")) riempiVoci(null);
      rinumera(); return;
    }
    if(a==="cap-voci-prev"){
      var voci=_stato.righe.filter(function(r){ return !_rigaSezione(r)&&T(r.descrizione); }).map(function(r){
        var q=+r.qta;
        return {titolo:T(r.descrizione),cosa:(q&&q!==1)?"Quantità prevista: "+String(q).replace(".",","):"",materiali:"",compreso:"",escluso:""};
      });
      if(!voci.length){ toast("Il preventivo non ha voci"); return; }
      aggiungiVoci(voci); toast("Voci portate dal preventivo ✔"); return;
    }
  });
  document.addEventListener("change",function(e){
    var t=e.target; if(!t||!t.id) return;
    if(t.id==="cp-modello"){
      var m=MODELLI[t.value]; if(!m) return;
      if(haQualcosa()&&!gconfirm("Questo modello sostituisce le voci che hai già scritto. Continuo?")){ t.value=""; return; }
      riempiVoci(m.voci.map(copiaVoce));
      toast("Modello caricato: cambia quello che serve");
      return;
    }
    if(t.id==="cp-pag-sel"){
      var k=t.value; if(!k) return;
      var txt=ORD_PAG_TESTO[k], box=document.getElementById("cp-pag");
      if(box&&txt) box.value=txt;
    }
  });

  window.gestCapitolato={apri:capitolatoForm,pdf:capitolatoPdf,modelli:MODELLI};
})();
