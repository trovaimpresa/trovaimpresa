// [SPOSTATO] nol-base.js: era dentro nol-core.js, righe 1-290, spostato identico.
/* ═══ 29 settembre 2026 — IL CODICE DEL NOLEGGIO, FUORI DALLA PAGINA ══════════
   Questo era dentro gestionale-noleggio.html, dentro il tag script della pagina.
   E' IDENTICO, riga per riga: e' stato solo spostato. Gira nello stesso
   punto della pagina (dopo gest-logo.js, prima del cancello), quindi
   vede le stesse cose di prima. Nessuna riga e' stata cambiata.
   ═════════════════════════════════════════════════════════════════════════ */
  const KEY="gestionale_multiservizi_v5";
  const ICONE=["🌳","🧹","🧱","🔧","⚡","🎨","🚿","🪚","🛠️","🌿","🏠","🪜","🏗️","🔌"];
  const COLORI=[
    {a:"#2e629e",ad:"#1f497a",as:"#e6f4ec"},{a:"#2570c4",ad:"#1a539a",as:"#e6eefa"},
    {a:"#c0703a",ad:"#9c5526",as:"#f7ece2"},{a:"#7c3aed",ad:"#5b27b0",as:"#efe8fb"},
    {a:"#d6336c",ad:"#a51f52",as:"#fbe6ee"},{a:"#2a609d",ad:"#1f7268",as:"#e6f4f2"},
    {a:"#d99e00",ad:"#a87a00",as:"#fbf2d9"},{a:"#5a6670",ad:"#3f4850",as:"#eceef0"}
  ];
  let nuovoSel={icon:"🛠️",col:0};
  let state={};
  /* 24 agosto 2026 — "cur" era l'id del reparto in cui si era entrati:
     adesso il Noleggio non ha piu' un reparto, e' sempre e solo questo,
     quindi "cur" resta sempre acceso da subito (niente piu' schermata
     di scelta che lo lascia a null finche' non si clicca una card). */
  /* ⚠️ "azienda" no: e' gia' una chiave di state (i dati dell'azienda per
     le fatture, state.azienda={num:1}). Con lo stesso nome db() trovava
     quell'oggetto — senza .note — e il calendario si rompeva. */
  let cur="_unico", filter={stato:"tutti",q:""}, cal=new Date(), editing=null, galFilter={op:"",tipo:""}, agFilter={op:"",stato:"aperti"};
  const fotoCache={};

  const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
  const uid=()=>"id"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const eur=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
  const fdate=d=>{if(!d)return"—";const[y,m,g]=d.split("-");return g+"/"+m+"/"+y;};
  const todayStr=()=>new Date().toISOString().slice(0,10);
  const thisMonth=d=>d&&d.slice(0,7)===todayStr().slice(0,7);
  const ymd=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const statoLabel={da_fare:"Da fare",in_corso:"In corso",fatto:"Fatto"};
  /* le tre parole della fattura, scritte in un posto solo: elenco, scheda,
     stampa e PDF devono dire la stessa cosa */
  const FATT_ETICHETTA={none:"Da fatturare",emessa:"Emessa, da incassare",pagata:"Pagata"};
  const FATT_COLORE={none:"#e65100",emessa:"#1565c0",pagata:"#2e7d32"};
  const mesi=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  const esc=s=>(s==null?"":String(s)).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));

  /* ================================================================
     ⛔ 24 agosto 2026 (sera) — LE DUE RIGHETTE IN FONDO ALLE SCHEDE
     ================================================================
     Le otto schede del Riepilogo hanno la forma di `.rie-card` del
     gestionale imprese: sotto il numerone una riga di separazione, e sotto
     fino a DUE righe di dettaglio, piu' il pallino in alto a destra.

     Il numerone continua a scriverlo chi lo scriveva prima (scrivi(id,...)):
     qui si riempiono solo le righette e si accende il pallino.

     ⛔ DUE RIGHE, NON TRE. La terza sparirebbe senza dire niente, e sembra
     che il dato non arrivi: e' successo con rieCard() in gestionale-app.html,
     che ha lo stesso slice(0,2). Se un domani ne servono tre, si cambia
     anche il CSS, non solo questo numero.

     ⚠️ IL ROSSO NON SI ACCENDE PERCHE' LA SCHEDA HA ROBA DENTRO. Cinque
     mezzi prenotati non sono un problema, e nemmeno mille euro incassati.
     E' rosso solo dove c'e' davvero un lavoro da fare: mezzi in ritardo,
     cauzioni da svincolare, noleggi vecchi non pagati. Se si accendesse
     "perche' c'e' qualcosa" sarebbero rossi quasi tutti e non direbbe piu'
     niente. Stessa regola del 20 agosto sul gestionale imprese.
     ================================================================ */
  function nolDett(id,righe,male){
    const box=document.getElementById("d-"+id);
    if(box){
      const r=(righe||[]).filter(Boolean).slice(0,2);   /* ⛔ due, vedi sopra */
      box.className=r.length?"nrc-list":"nrc-vuoto";
      box.innerHTML=r.length
        ? r.map(x=>'<div class="nrc-r"><span class="nrc-rt">'+esc(x.t)+'</span>'
                 + '<span class="nrc-rv">'+esc(x.v)+'</span></div>').join("")
        : esc("Niente da segnalare");
    }
    const p=document.getElementById("p-"+id);
    if(p){
      p.className="nrc-pall "+(male?"male":"bene");
      /* chi non distingue bene rosso e verde deve poterlo leggere lo stesso */
      p.title=male?"Qui c'\u00e8 qualcosa che va male":"Qui \u00e8 tutto a posto";
      p.setAttribute("aria-label",male?"qualcosa che va male":"tutto a posto");
    }
  }
  /* quanti giorni sono passati da una data scritta come 2026-08-24 */
  const _ggDa=d=>{if(!d)return null;
    const a=Date.parse(String(d).slice(0,10)+"T00:00:00"), b=Date.parse(todayStr()+"T00:00:00");
    return (isNaN(a)||isNaN(b))?null:Math.round((b-a)/86400000);};
  /* 24 agosto 2026 — "cur" non e' piu' l'id di un reparto scelto da una
     card (che esisteva gia' in "state"): e' il valore fisso "azienda", che
     in "state" non c'era ancora. Senza questa riga db().note (le note sul
     calendario) restava undefined e il calendario si rompeva appena aperto. */
  const db=()=>state[cur]||(state[cur]={clienti:[],dipendenti:[],lavori:[],note:{}});
  const cliById=id=>db().clienti.find(c=>c.id===id);
  const dipById=id=>db().dipendenti.find(d=>d.id===id);
  const curMestiere=()=>{const p=(state.panels||[]).find(x=>x.id===cur);return p?p.mestiere_id:null;};
  let cliCache=[]; /* clienti del reparto corrente, da gest_clienti (Supabase) */
  let dipCache=[]; /* squadra del reparto corrente: id,nome,telefono,ruolo,permessi (gest_operatori + gest_membri) */

  if(!window.storage){window.storage={get:async k=>{const v=localStorage.getItem(k);return v===null?null:{value:v};},set:async(k,v)=>{localStorage.setItem(k,v);return{value:v};},delete:async k=>{localStorage.removeItem(k);return{deleted:true};}};}
  async function load(){
    try{const r=await window.storage.get(KEY);if(r&&r.value)state=JSON.parse(r.value);}catch(e){}
    state.azienda=state.azienda||{num:1};
    state.panels=state.panels||[];
    state.panels.forEach(p=>{
      if(!state[p.id])state[p.id]={clienti:[],dipendenti:[],lavori:[],note:{}};
      const b=state[p.id];
      b.clienti=b.clienti||[];b.dipendenti=b.dipendenti||[];b.lavori=b.lavori||[];b.note=b.note||{};
      b.lavori.forEach(l=>{if(!l.fattStato)l.fattStato=l.pagato?"pagata":"none";});
    });
    await save();
    backfillMestieri();
  }
  async function save(){try{await window.storage.set(KEY,JSON.stringify(state));}catch(e){toast("Errore salvataggio");}}
  function toast(m){const t=$("#toast");t.textContent=_msgPro(m);t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),1900);}
  /* Solo professionista: i testi dei toast/confirm passano dalla mappa _FRASI (un solo punto qui).
     Artigiano e negozio restano invariati. Non tocca il contenuto utente già interpolato (numeri, nomi). */
  function _msgPro(m){return ruoloUtente==='professionista'?_swapPratiche(String(m)):m;}
  function gconfirm(m){return confirm(_msgPro(m));}

  /* Passo 1 separazione reparti: ogni panel ha un mestiere_id (gest_mestieri) */
  let mestieriBackfilled=false;
  async function backfillMestieri(){
    if(mestieriBackfilled||!sb||!sbUid||!state.panels)return;
    const need=state.panels.filter(p=>!p.mestiere_id);
    mestieriBackfilled=true;
    if(!need.length)return;
    const used=new Set(state.panels.map(p=>p.mestiere_id).filter(Boolean));
    const {data:existing}=await sb.from("gest_mestieri").select("id,nome").eq("user_id",sbUid);
    const squadra=(existing||[]).find(m=>m.nome==="Squadra"&&!used.has(m.id));
    let squadraId=squadra?squadra.id:null, changed=false;
    for(const p of need){
      let mid=null;
      if(squadraId){mid=squadraId;squadraId=null;}
      else{
        const {data:m,error}=await sb.from("gest_mestieri").insert({user_id:sbUid,nome:p.nome,icona:p.icon,colore:p.a,ordine:0}).select().single();
        if(error){toast("Errore reparto: "+error.message);continue;}
        mid=m.id;
      }
      p.mestiere_id=mid;changed=true;
    }
    if(changed){await save();if(!cur)renderLanding();}
  }

  /* SUPABASE — solo per il tab Squadra (riusa gestionale-config.html) */
  const SUPA_URL="https://nacvrsgkyfavykxjxszu.supabase.co";
  const SUPA_KEY="sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";
  const sb=window.supabase?window.supabase.createClient(SUPA_URL,SUPA_KEY):null;
  /* Da qui in poi "cancella" vuol dire "metti da parte": vedi js/cestino.js */
  if(sb&&window.attivaCestino)window.attivaCestino(sb);
  let sbUid=null;
  /* 27 set 2026 — il logo dell'impresa in cima (js/gest-logo.js) */
  if(window.gestLogoAvvia)window.gestLogoAvvia(sb,()=>sbUid);
  const sbRand=()=>Math.random().toString(36).slice(2,8).toUpperCase();
  const inviteLink=c=>location.href.replace(/[^/]*$/,"")+"gestionale-invito.html?codice="+c;
  function copyLink(txt){
    const ok=()=>toast("Link copiato ✔");
    const fb=()=>{const a=document.createElement("textarea");a.value=txt;a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.focus();a.select();let d=false;try{d=document.execCommand("copy");}catch(_){}document.body.removeChild(a);d?ok():prompt("Copia il link a mano:",txt);};
    (navigator.clipboard&&navigator.clipboard.writeText)?navigator.clipboard.writeText(txt).then(ok).catch(fb):fb();
  }
  let ruoloUtente=null;
  /* Legge la categoria (tipo) dell'utente loggato — stesso metodo dei pannelli: tabella 'imprese', campo 'tipo', chiave user_id */
  async function logRuoloUtente(uid){
    if(!sb||!uid){console.log('[gestionale] ruolo utente: nessun utente loggato');return;}
    const {data,error}=await sb.from('imprese').select('tipo').eq('user_id',uid).maybeSingle();
    if(error){console.log('[gestionale] ruolo utente: errore lettura',error.message);return;}
    ruoloUtente=data&&data.tipo?data.tipo:null;
    /* Vista FONDATORE: stessa logica del gestionale principale (9/8/2026) */
    try{var _vq=new URLSearchParams(location.search).get("vedi");if(_vq!==null){_vq?sessionStorage.setItem("ti_vedi_tipo",_vq):sessionStorage.removeItem("ti_vedi_tipo");}}catch(_e){}
    try{var _vc=sessionStorage.getItem("ti_vedi_tipo");if(_vc)ruoloUtente=_vc;}catch(_e){}
    console.log('[gestionale] ruolo utente:',ruoloUtente||'(nessun profilo)');
    const _tabScad=document.querySelector('#tab-scadenzario');
    if(_tabScad)_tabScad.style.display=(ruoloUtente==='professionista')?'':'none';
    if(ruoloUtente==='professionista'){
      const sub=document.querySelector('.landing-sub');
      if(sub)sub.textContent="Ogni reparto è separato: pratiche, clienti, collaboratori e calendario non si mischiano.";
      const lt=document.querySelector('.landing-top h1'); /* titolo landing statico: adattato per ruolo via JS, fuori dal translator */
      if(lt)lt.textContent="Gestionale Studio";
      const fsearch=document.querySelector('#f-search'); /* placeholder in HTML statico: per-ruolo via JS, non dal translator */
      if(fsearch)fsearch.placeholder="Cerca cliente o pratica...";
      avviaLocalizzazionePratiche();
      renderScadenze();
      if(!cur)renderLanding(); /* ruoloUtente noto solo ora: ridisegna le card landing coi contatori "pratiche" */
    }
  }
  /* Solo professionista: nei TESTI VISIBILI dell'interfaccia del reparto (#appview e i form in #sheet)
     traduce le etichette fisse lavoro→pratica con concordanza femminile corretta (vedi _FRASI),
     più swap a parola solo per conteggi nudi e tab/intestazione.
     Agisce solo sui nodi di testo (non su id/classi/attributi/placeholder né su tabelle/campi Supabase). */
  /* Frasi fisse con articolo/aggettivo: tradotte come unità per la concordanza femminile (pratica/pratiche).
     Ordine: prima le frasi più lunghe/specifiche, poi quelle brevi (es. "Nuovo lavoro"). */
  const _FRASI=[
    ['Prossimi lavori da fare','Prossime pratiche da fare'],
    ['quanti lavori hai da fare','quante pratiche hai da fare'],
    ['Tutti i lavori del reparto','Tutte le pratiche del reparto'],
    ['tutti i suoi lavori','tutte le sue pratiche'],
    ['Lavori finiti da fatturare','Pratiche finite da fatturare'],
    ['Da fatturare (lavori finiti)','Da fatturare (pratiche finite)'],
    ['Nessun lavoro finito in attesa di fattura.','Nessuna pratica finita in attesa di fattura.'],
    ['Nessun lavoro in sospeso','Nessuna pratica in sospeso'],
    ['Aggiungi un lavoro col pulsante','Aggiungi una pratica col pulsante'],
    ['Cambia filtro o aggiungi un nuovo lavoro','Cambia filtro o aggiungi una nuova pratica'],
    ['Nessun lavoro in questa data.','Nessuna pratica in questa data.'],
    ['Nessun lavoro qui','Nessuna pratica qui'],
    ['+ Lavoro in questa data','+ Pratica in questa data'],
    ['Questo operatore non ha lavori assegnati','Questo collaboratore non ha pratiche assegnate'],
    ['Assegna i lavori a una persona dalla scheda del lavoro','Assegna le pratiche a una persona dalla scheda della pratica'],
    ['Carica le foto aprendo un lavoro','Carica le foto aprendo una pratica'],
    ['Foto lavoro DA FARE','Foto pratica DA FARE'],
    ['Foto lavoro FATTO','Foto pratica FATTO'],
    ['per mostrarti il lavoro','per mostrarti la pratica'],
    ['a lavoro finito','a pratica finita'],
    ['per questo lavoro','per questa pratica'],
    ['Modifica lavoro','Modifica pratica'],
    ['Nuovo lavoro','Nuova pratica'],
    ['Crea lavoro','Crea pratica'],
    /* squadra/membro → collaboratore/collaboratori: frasi esatte (collaboratori = maschile plurale).
       Le più specifiche prima della parola nuda "Squadra" per la concordanza corretta. */
    ['Squadra non disponibile','Collaboratori non disponibili'],
    ['Accedi per gestire la squadra','Accedi per gestire i collaboratori'],
    ['Squadra','Collaboratori'],
    /* condominio/amministratore → cliente: frasi esatte. Le più specifiche prima della parola
       nuda "Condomini", così "Condomini / Clienti" non diventa "Clienti / Clienti". */
    ['Dove (vuoto = indirizzo del condominio)','Dove (vuoto = indirizzo del cliente)'],
    ['Nome condominio / cliente','Nome cliente'],
    ['Condomini / Clienti','Clienti'],
    ['Condominio / Cantiere','Cliente'],
    ['+ Aggiungi nuovo condominio','+ Aggiungi nuovo cliente'],
    ['Nuovo condominio','Nuovo cliente'],
    ['Modifica condominio','Modifica cliente'],
    ['Nessun condominio','Nessun cliente'],
    ['Referente / Amministratore','Referente'],
    ['Condomini','Clienti'],
    /* "Agenda operatore" → "Agenda" (togli "operatore"); operatore → collaboratore solo nelle
       etichette/filtri legati ai collaboratori. La parola nuda "Operatore" per ultima. */
    ['Agenda operatore','Agenda'],
    ['Filtra per operatore','Filtra per collaboratore'],
    ['Scegli un operatore','Scegli un collaboratore'],
    ['(operatore)','(collaboratore)'],
    ['Operatore','Collaboratore'],
    /* etichetta del menu assegnatario nel form pratica → "Collaboratore". Il ruolo "Operaio"
       del form Squadra è protetto via _SKIP_UTENTE (#d-ruolo), quindi resta invariato. */
    ['Operaio','Collaboratore'],
    /* Messaggi toast/confirm (professionista): frasi esatte, concordanza corretta.
       Il numero in "N lavori collegati" lo gestisce a parte la regex dei conteggi nudi. */
    ['Lavoro creato ✔','Pratica creata ✔'],
    ['Lavoro aggiornato','Pratica aggiornata'],
    ['Lavoro non trovato','Pratica non trovata'],
    ['Scegli un condominio','Scegli un cliente'],
    ['Condominio aggiunto ✔','Cliente aggiunto ✔'],
    ['Eliminare questo lavoro?','Eliminare questa pratica?'],
    ['Eliminare questo condominio?','Eliminare questo cliente?'],
    ['Questo condominio ha','Questo cliente ha'],
    ['lavori collegati. Eliminarlo comunque?','pratiche collegate. Eliminarlo comunque?'],
    ['Lavoro eliminato','Pratica eliminata'],
    ['Condominio eliminato','Cliente eliminato'],
    ['Persona eliminata','Collaboratore eliminato'],
  ];
  function _swapPratiche(s){
    for(const f of _FRASI){if(s.indexOf(f[0])>=0)s=s.split(f[0]).join(f[1]);}
    /* conteggi nudi: "1 lavoro"→"1 pratica", "N lavori"→"N pratiche" */
    s=s.replace(/(\d+)\s+lavori\b/g,'$1 pratiche').replace(/(\d+)\s+lavoro\b/g,'$1 pratica');
    /* tab/intestazione: nodo composto SOLO dalla parola */
    const t=s.trim();
    if(t==='Lavori')s=s.replace('Lavori','Pratiche');
    else if(t==='Lavoro')s=s.replace('Lavoro','Pratica');
    return s;
  }
  /* Contenitori del CONTENUTO inserito dall'utente: i loro nodi di testo NON vanno tradotti
     (nomi reparti, titoli/descrizioni pratiche, note, dati cliente, nomi operatori).
     Restano traducibili le etichette fisse (tab "Lavori", "+ Nuovo lavoro", contatori, messaggi vuoti…). */
  const _SKIP_UTENTE='.job-cli,.job-desc,.job-done,.job-note,.job-meta,.fatt-info,.day-job,.gal-cantiere,.thop,.card h3,.card p,#panel-name,#panel-sub,#rie-title,#lf-title,#gal-op,#ag-op,#d-ruolo,textarea';
  let _praticheObs=null;
  function _osservaPratiche(){
    if(!_praticheObs)return;
    ['#appview','#sheet'].forEach(sel=>{const el=document.querySelector(sel);if(el)_praticheObs.observe(el,{childList:true,subtree:true,characterData:true});});
  }
  function localizzaPratiche(){
    if(ruoloUtente!=='professionista')return;
    if(_praticheObs)_praticheObs.disconnect(); /* si stacca durante la riscrittura: le mutazioni che genera (e quelle già in coda) vengono scartate → niente loop */
    ['#appview','#sheet'].forEach(sel=>{
      const root=document.querySelector(sel);if(!root)return;
      const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(t){return t.parentElement&&t.parentElement.closest(_SKIP_UTENTE)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
      const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
      nodi.forEach(t=>{const v=t.nodeValue;if(v&&/lavor[oi]|squadr|condomin|amministrator|operai|operator/i.test(v)){const nv=_swapPratiche(v);if(nv!==v)t.nodeValue=nv;}});
    });
    _osservaPratiche(); /* si riattacca solo a riscrittura conclusa */
  }
  function avviaLocalizzazionePratiche(){
    if(ruoloUtente!=='professionista'||_praticheObs)return;
    _praticheObs=new MutationObserver(()=>localizzaPratiche());
    localizzaPratiche();
  }
