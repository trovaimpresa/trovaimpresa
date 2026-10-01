// [SPOSTATO] op-agenda-giorno.js: era dentro op-core.js, righe 269-627, spostato identico.

async function boot(session){
  if(!session){gate("Per entrare usa il link che ti ha mandato la tua impresa.");return;}
  MIO.uid=session.user.id;
  const {data:membri,error}=await sb.from("gest_membri")
    .select("impresa_id,operatore_id,ruolo,stato,permessi").eq("membro_id",MIO.uid).eq("stato","attivo");
  if(error){gate("Non riesco a caricare. Riprova tra poco.");return;}
  if(!membri||!membri.length){
    if(await forseSonoIlCapo()){gateCapo();return;}
    gate("Non sei ancora collegato a un'impresa. Apri il link di invito.");return;
  }
  MIO.impresaId=membri[0].impresa_id;
  /* ⛔ 5 SETTEMBRE 2026 — QUI SI LEGGEVA LA TABELLA, E DA OGGI NON SI PUO'.
     Chiusa `imprese` (l'elenco iscritti non si scarica piu' in blocco), questa
     riga tornava VUOTA: l'operaio non e' il padrone di quella riga. E non dava
     errore — sta dentro un try/catch — quindi al COLLABORATORE DI STUDIO le
     pratiche si sarebbero chiamate «Lavori» invece che «Pratiche», in silenzio.
     ⚠️ Un difetto che non fa rumore e' il peggiore: sembra che funzioni.
     Adesso si chiede `gest_tipo_impresa(id)`, che risponde solo a chi e' in
     squadra e da' SOLO il tipo: nessun'altra colonna esce. */
  try{
    const {data:t}=await sb.rpc("gest_tipo_impresa",{_impresa:MIO.impresaId});
    MIO.tipoStudio=t||null;
  }catch(_){MIO.tipoStudio=null;}
  /* appena si sa il mestiere, le scritte si adattano: qui e non piu' tardi,
     se no la prima schermata si vede per un attimo con le parole sbagliate */
  adattaParole();
  MIO.operatoreId=membri[0].operatore_id;
  MIO.ruolo=membri[0].ruolo;
  if(MIO.operatoreId){
    const {data:op}=await sb.from("gest_operatori").select("nome").eq("id",MIO.operatoreId).maybeSingle();
    MIO.nome=(op&&op.nome)||"Operatore";
  }
  $("#hd-name").textContent=MIO.nome||"Operatore";
  const perms=membri[0].permessi;
  MIO.permessi=perms||{};
  /* 13 agosto 2026 — CHI ENTRA, E DOVE ATTERRA
     Prima si entrava SOLO con «Lavori» o «Clienti». Conseguenze vere:
     · chi aveva soltanto «Pagamenti» (o soltanto «Fatture») trovava il
       lucchetto: la spunta era accesa e non serviva a niente;
     · una persona vecchia con la casella dei permessi vuota ({}) finiva
       anche lei fuori, proprio il caso che permessiMai() doveva proteggere,
       perche' {} e' comunque un oggetto e passava il primo controllo.
     Adesso entra chiunque abbia almeno una sezione vera, e si atterra sulla
     prima che ha. Il lucchetto resta solo per chi non ne ha nessuna, e dice
     cosa manca invece di «sezioni in arrivo». */
  if(!qualcosaDaVedere()){
    const LABELS={calendario:"Calendario",lavori:"Lavori",foto:"Foto",note:"Note",clienti:"Clienti",fatture:"Fatture",pagamenti:"Pagamenti"};
    const attivi=Object.keys(LABELS).filter(puo).map(k=>LABELS[k]);
    gate(attivi.length
      ? ("Per adesso hai solo: "+attivi.join(", ")+". Da sole queste spunte non aprono nessuna schermata: chiedi al tuo capo anche Lavori, Clienti, Fatture o Pagamenti.")
      : "Il tuo capo non ti ha ancora dato nessun permesso. Chiediglielo e riapri questa pagina.");
    return;
  }
  renderNav();
  if(puo("lavori")){
    await loadLavori();
    const n=new Date();calY=n.getFullYear();calM=n.getMonth();
    renderCal();renderDay();
    show("agenda");
    tmbAvvia();
    caricaCartaMia();
  }else if(puo("clienti")){
    await loadClienti();
    show("clienti");
  }else if(puo("fatture")){
    await loadFatture();
    show("fatture");
  }else{
    /* solo la carta aziendale: si apre l'agenda, che pero' resta con dentro
       la sola carta (calendario ed elenco lavori li spegne applicaPermessi) */
    show("agenda");
    await caricaCartaMia();
    if($("#carta-panel").style.display!=="block")$("#carta-nessuna").classList.remove("hidden");
  }
}

async function loadLavori(){
  let q=sb.from("gest_lavori").select("*").eq("user_id",MIO.impresaId);
  if(MIO.operatoreId && MIO.ruolo!=='segretaria')q=q.eq("operatore_id",MIO.operatoreId); /* segretaria: niente filtro operatore → tutte le pratiche dello studio */
  const {data}=await q.order("data_prevista",{ascending:true});
  LAVORI=data||[];
  const ids=[...new Set(LAVORI.map(l=>l.cliente_id).filter(Boolean))];
  if(ids.length){
    const {data:cl}=await sb.from("gest_clienti").select("id,nome,indirizzo").in("id",ids);
    CLIENTI=Object.fromEntries((cl||[]).map(c=>[c.id,c]));
  }
}

async function loadClienti(){
  if(CLIENTI_LISTA)return renderClientiSezione();
  const {data}=await sb.from("gest_clienti").select("id,nome,indirizzo,referente,telefono").eq("user_id",MIO.impresaId).order("nome");
  CLIENTI_LISTA=data||[];
  renderClientiSezione();
}
function renderClientiSezione(){
  const box=$("#clienti-list");
  const lista=CLIENTI_LISTA||[];
  box.innerHTML=lista.length?lista.map(c=>`<div class="cli-card"><h3>${esc(c.nome)}</h3>
    <div class="cli-info">${c.indirizzo?"📍 "+esc(c.indirizzo)+"<br>":""}${c.referente?"👤 "+esc(c.referente)+" ":""}${c.telefono?"📞 "+esc(c.telefono):""}</div></div>`).join("")
    :`<div class="empty-state">Nessun cliente</div>`;
}

async function loadScadenze(){
  if(SCADENZE_LISTA)return renderScadenzeSezione();
  const [{data:sc},{data:cl}]=await Promise.all([
    sb.from("gest_scadenze").select("id,titolo,tipo_pratica,cliente_id,data_scadenza,stato,note").eq("user_id",MIO.impresaId).order("data_scadenza",{ascending:true}),
    sb.from("gest_clienti").select("id,nome").eq("user_id",MIO.impresaId)
  ]);
  SCADENZE_LISTA=sc||[];
  SCAD_CLIMAP=Object.fromEntries((cl||[]).map(c=>[c.id,c.nome]));
  renderScadenzeSezione();
}
function renderScadenzeSezione(){
  const box=$("#scadenze-list");
  const lista=SCADENZE_LISTA||[];
  const oggi=ymd(new Date());
  const[ay,am,ad]=oggi.split("-").map(Number);
  const lim=ymd(new Date(ay,am-1,ad+7));
  box.innerHTML=lista.length?lista.map(s=>scadCardOperatore(s,oggi,lim)).join("")
    :`<div class="empty-state">Nessuna scadenza</div>`;
}
function scadCardOperatore(s,oggi,lim){
  const fatta=s.stato==="fatta";
  const cliNome=s.cliente_id?(SCAD_CLIMAP[s.cliente_id]||"(cliente eliminato)"):"";
  let bg="#eef2f7",fg="#555",lab="Aperta";
  if(fatta){bg="#e3f3e8";fg="var(--green-d)";lab="Fatta";}
  else if(s.data_scadenza&&s.data_scadenza<oggi){bg="#fdecea";fg="#c0392b";lab="Scaduta";}
  else if(s.data_scadenza&&s.data_scadenza<=lim){bg="#fff4e5";fg="#c2410c";lab="In scadenza";}
  return `<div class="cli-card"><h3>${esc(s.titolo||"Scadenza")}</h3>
    <div class="cli-info">${s.tipo_pratica?"📄 "+esc(s.tipo_pratica)+"<br>":""}${cliNome?"👤 "+esc(cliNome)+"<br>":""}📅 ${dataIt(s.data_scadenza)} <span class="badge" style="background:${bg};color:${fg}">${lab}</span>${s.note?"<br>📝 "+esc(s.note):""}</div></div>`;
}

/* ===== fatture (segretaria: carica/apre il PDF, non genera) ===== */
async function loadFatture(){
  if(FATTURE_LISTA)return renderFattureSezione();
  const [{data:lav},{data:cl}]=await Promise.all([
    sb.from("gest_lavori").select("id,descrizione,cliente_id,stato,importo,fatt_stato,data_prevista,data_fatto").eq("user_id",MIO.impresaId),
    sb.from("gest_clienti").select("id,nome").eq("user_id",MIO.impresaId)
  ]);
  FATTURE_LISTA=(lav||[]).filter(l=>+l.importo>0);
  FATT_CLIMAP=Object.fromEntries((cl||[]).map(c=>[c.id,c.nome]));
  await loadFattPdf();
  renderFattureSezione();
}
async function loadFattPdf(){
  FATT_PDFCACHE={};
  const ids=(FATTURE_LISTA||[]).map(l=>l.id);
  if(!ids.length)return;
  const {data:pdfs}=await sb.from("gest_foto").select("id,lavoro_id,storage_path,created_at").eq("user_id",MIO.impresaId).eq("tipo","fattura").in("lavoro_id",ids).order("created_at",{ascending:false});
  (pdfs||[]).forEach(p=>{if(!FATT_PDFCACHE[p.lavoro_id])FATT_PDFCACHE[p.lavoro_id]=p;});
}
function sezFatt(titolo,arr,vuoto){
  const cards=arr.length?arr.map(fattCardOperatore).join(""):`<div class="empty-state">${vuoto}</div>`;
  return `<div class="day-title" style="font-size:15px;margin-top:14px">${titolo}</div>${cards}`;
}
function fattCardOperatore(l){
  const cli=l.cliente_id?(FATT_CLIMAP[l.cliente_id]||"(cliente eliminato)"):"";
  const pdf=FATT_PDFCACHE[l.id];
  let lab="Da fatturare",bg="#fff4e5",fg="#c2410c";
  if(l.fatt_stato==="pagata"){lab="Pagata";bg="#e3f3e8";fg="var(--green-d)";}
  else if(l.fatt_stato==="emessa"){lab="Emessa";bg="#eef2f7";fg="#555";}
  const apri=pdf?`<button class="btn-line" data-fatt-open="${esc(pdf.id)}">📄 Apri fattura PDF</button>`:"";
  return `<div class="cli-card"><h3>${esc(l.descrizione||"Lavoro")}</h3>
    <div class="cli-info">${cli?"👤 "+esc(cli)+"<br>":""}💶 ${eur(l.importo)} <span class="badge" style="background:${bg};color:${fg}">${lab}</span>${(l.data_fatto||l.data_prevista)?"<br>📅 "+dataIt(l.data_fatto||l.data_prevista):""}</div>
    <div class="row-btns" style="margin-top:10px">${apri}<button class="btn-line" data-fatt-up="${l.id}">📎 Carica fattura PDF</button></div></div>`;
}
function renderFattureSezione(){
  const box=$("#fatture-list");
  const lista=FATTURE_LISTA||[];
  if(!lista.length){box.innerHTML=`<div class="empty-state">Nessuna pratica da fatturare</div>`;return;}
  const daFatt=lista.filter(l=>l.stato==="fatto"&&(l.fatt_stato||"none")==="none");
  const emesse=lista.filter(l=>l.fatt_stato==="emessa");
  const pagate=lista.filter(l=>l.fatt_stato==="pagata");
  let h="";
  h+=sezFatt("📄 Da fatturare (lavori finiti)",daFatt,"Nessun lavoro finito da fatturare.");
  h+=sezFatt("💶 Emesse · da incassare",emesse,"Nessuna fattura da incassare.");
  h+=sezFatt("✅ Pagate",pagate,"Ancora nessuna fattura pagata.");
  box.innerHTML=h;
  box.querySelectorAll("[data-fatt-up]").forEach(b=>b.onclick=()=>chiediFatturaPdf(b.dataset.fattUp));
  box.querySelectorAll("[data-fatt-open]").forEach(b=>b.onclick=()=>apriFatturaPdf(b.dataset.fattOpen));
}
/* 13 agosto 2026 — questo pulsante non chiedeva NIENTE a nessuno: una persona
   con «Fatture» ✔ e «Foto» ✘ caricava un file nel deposito delle foto e
   scriveva la riga in gest_foto, scavalcando il permesso foto col dito.
   La fattura in PDF pero' e' un documento della fattura, non una foto di
   cantiere: adesso comanda la spunta «Fatture», qui e sul database. */
function chiediFatturaPdf(lavoroId){
  if(!chiedoPermesso("fatture","di caricare le fatture"))return;
  fattUploadLavoroId=lavoroId;$("#fatt-pdf-file").click();
}
async function uploadFatturaPdf(file){
  if(!file||!fattUploadLavoroId)return;
  if(file.type!=="application/pdf"){toast("Carica un file PDF");return;}
  /* il PDF non è un'immagine: preparaFileUpload lo lascia intatto, applica solo il limite */
  const p=await preparaFileUpload(file);
  if(p.errore){toast(p.errore);return;}
  const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=MIO.impresaId+"/"+fattUploadLavoroId+"/"+Date.now()+"_"+safe;
  const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
  if(up){toast("Fattura non caricata: "+up.message);return;}
  const {error:ins}=await sb.from("gest_foto").insert({user_id:MIO.impresaId,lavoro_id:fattUploadLavoroId,tipo:"fattura",operatore:MIO.nome,storage_path:path});
  if(ins){
    /* la riga e' stata rifiutata: il file e' gia' salito e non lo collega piu'
       niente. Si toglie subito, se no resta nel deposito e non lo trova nessuno. */
    await _fileOrfano("gestionale-foto",path);
    toast("Fattura non salvata: "+ins.message+" — riprova");return;
  }
  toast("Fattura PDF caricata ✔");
  await loadFattPdf();renderFattureSezione();
}
async function apriFatturaPdf(fotoId){
  const f=Object.values(FATT_PDFCACHE).find(p=>p.id===fotoId);
  if(!f)return;
  const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
  if(su&&su.signedUrl)window.open(su.signedUrl,"_blank");
  else toast("Non riesco ad aprire la fattura");
}

/* ===== calendario ===== */
function renderCal(){
  $("#cal-mese").textContent=MESI[calM]+" "+calY;
  const grid=$("#cal-grid");grid.innerHTML="";
  DOW.forEach(d=>{const e=document.createElement("div");e.className="cal-dow";e.textContent=d;grid.appendChild(e);});
  const first=new Date(calY,calM,1);
  let start=first.getDay();start=(start===0)?6:start-1; // lun=0
  for(let i=0;i<start;i++){const e=document.createElement("div");e.className="cal-day empty";grid.appendChild(e);}
  const days=new Date(calY,calM+1,0).getDate();
  const oggi=ymd(new Date());
  const conLavoro=new Set(LAVORI.map(l=>l.data_prevista).filter(Boolean));
  for(let g=1;g<=days;g++){
    const ds=calY+"-"+String(calM+1).padStart(2,"0")+"-"+String(g).padStart(2,"0");
    const b=document.createElement("button");
    b.className="cal-day"+(ds===oggi?" oggi":"")+(ds===selDate?" sel":"");
    b.textContent=g;
    if(conLavoro.has(ds)){const dot=document.createElement("span");dot.className="dot";b.appendChild(dot);}
    b.onclick=()=>{selDate=ds;renderCal();renderDay();};
    grid.appendChild(b);
  }
}
$("#cal-prev").onclick=()=>{calM--;if(calM<0){calM=11;calY--;}renderCal();};
$("#cal-next").onclick=()=>{calM++;if(calM>11){calM=0;calY++;}renderCal();};

/* ===== lista del giorno ===== */
function statoBadge(s){
  const v=(s||"").toLowerCase();
  if(v.includes("fatt")||v.includes("complet"))return'<span class="badge b-fatto">Fatto</span>';
  if(v.includes("corso"))return'<span class="badge b-corso">In corso</span>';
  return'<span class="badge b-dafare">Da fare</span>';
}
/* ============================================================
   ⛔ 5 SETTEMBRE 2026 — LE PAROLE CAMBIANO COL MESTIERE
   ============================================================
   Trovato facendo il giro sui →4← ruoli: il motore andava per tutti, ma le
   SCRITTE erano da muratore. Un geometra che apre l'app per segnare →6← ore su
   una CILA leggeva «Cosa avete usato — Es. 3 sacchi di premiscelato, 20 m di
   tubo, mezzo bancale di laterizi», e un commesso di ferramenta pure.
   Non si rompeva niente: ma la prima impressione era che l'app non fosse per lui.

   ⚠️ LE PAROLE STANNO QUI DENTRO, E SOLO QUI. E' la stessa regola gia' scritta
   per il gestionale del capo il →22← agosto («la parola del lavoro sta in un
   posto solo»): chi la deve SCRIVERE la chiede a `_p()`, chi la deve
   RISCRIVERE nell'HTML gia' stampato lo fa in `adattaParole()`.
   Rincorrere le scritte una per una non funziona: la volta dopo se ne dimentica
   una, ed e' esattamente come e' nato questo difetto.
   ⚠️ Il ruolo si sa solo DOPO la lettura del database (`gest_tipo_impresa`),
   quindi `adattaParole()` gira quando l'app si accende, non prima.
   ============================================================ */
const PAROLE={
  _:{  cosaUsato:"Cosa avete usato",
       subOre:"Le tue ore su questo lavoro",
       esUsato:"Es. 3 sacchi di premiscelato, 20 m di tubo, mezzo bancale di laterizi…",
       esUsatoCorto:"Es. 3 sacchi di premiscelato, 20 m di tubo",
       subMateriale:"Cosa avete consumato (senza prezzi)",
       subSpesa:"Soldi usciti per questo lavoro",
       nessunLavoro:"Non hai nessun lavoro assegnato. Chiedi al capo di metterti su un lavoro.",
       esDettato:"Es. oggi io e Marco otto ore, finito l’intonaco della scala. Comprati due sacchi di premiscelato, 42,50." },
  professionista:{
       cosaUsato:"Su cosa hai lavorato",
       subOre:"Le tue ore su questa pratica",
       esUsato:"Es. sopralluogo, rilievo dell’appartamento, deposito della pratica in Comune…",
       esUsatoCorto:"Es. rilievo, deposito in Comune",
       subMateriale:"Su cosa hai lavorato",
       subSpesa:"Soldi usciti per questa pratica",
       nessunLavoro:"Non hai nessuna pratica assegnata. Chiedi in studio di metterti su una pratica.",
       esDettato:"Es. oggi quattro ore, rilievo dell’appartamento e deposito della CILA. Pagati 32 euro di diritti." },
  negozio:{
       cosaUsato:"Cosa hai fatto",
       subOre:"Le tue ore di oggi",
       esUsato:"Es. scarico bancali, riordino del magazzino, carico furgone del cliente…",
       esUsatoCorto:"Es. scarico bancali, riordino magazzino",
       subMateriale:"Cosa hai fatto in negozio",
       subSpesa:"Soldi usciti per il negozio",
       nessunLavoro:"Non hai nessun lavoro assegnato. Chiedi al titolare di assegnartene uno.",
       esDettato:"Es. oggi sei ore, scaricato due bancali e riordinato il magazzino. Comprato nastro, 12,50." }
};
function _p(k){
  const mio=PAROLE[MIO.tipoStudio];
  return (mio && mio[k]) || PAROLE._[k];
}
/* riscrive quello che nell'HTML e' gia' stampato */
function adattaParole(){
  try{
    const lab=document.getElementById('lv-lab-usato');
    if(lab)lab.textContent=_p('cosaUsato');
    const ta=document.getElementById('rap-materiali');
    if(ta)ta.setAttribute('placeholder',_p('esUsato'));
    /* la nota sotto il riquadro parla di prezzi contati due volte: vale per
       tutti, ma per lo studio «le cose» diventa «quello che hai fatto» */
    const nota=document.querySelector('#lv-rap-box .rap-nota');
    if(nota)nota.innerHTML = (MIO.tipoStudio==='professionista')
      ? "Scrivi <b>quello che hai fatto</b>, non i costi. Quanto sono costati lo sa gi\u00e0 il gestionale dalle spese e dalle fatture: se li riscrivessi qui verrebbero contati due volte."
      : "Scrivi <b>le cose</b>, non i prezzi. Quanto sono costate lo sa gi\u00e0 il gestionale dalle spese e dalle fatture: se le riscrivessi qui verrebbero contate due volte.";
  }catch(_){}
}
function etic(s){
  if(MIO.tipoStudio!=='professionista')return s;
  return s.replace(/Nessun lavoro/g,"Nessuna pratica").replace(/Lavori/g,"Pratiche").replace(/Lavoro/g,"Pratica").replace(/lavoro/g,"pratica").replace(/lavori/g,"pratiche");
}
function renderDay(){
  const oggi=ymd(new Date());
  $("#day-title").textContent=etic((selDate===oggi)?"Lavori di oggi":"Lavori del "+dataIt(selDate));
  const list=LAVORI.filter(l=>l.data_prevista===selDate);
  const box=$("#day-list");
  if(!list.length){box.innerHTML='<div class="empty-state">'+etic("Nessun lavoro per questo giorno.")+'</div>';return;}
  box.innerHTML=list.map(l=>{
    const cl=CLIENTI[l.cliente_id];
    const titolo=cl?cl.nome:(l.descrizione?l.descrizione.slice(0,40):"Lavoro");
    const dove=l.dove||(cl&&cl.indirizzo)||"";
    return `<div class="job" data-id="${l.id}">
      <h3>${esc(titolo)}</h3>
      ${dove?`<div class="where">📍 ${esc(dove)}</div>`:""}
      ${statoBadge(l.stato)}
    </div>`;
  }).join("");
  box.querySelectorAll(".job").forEach(j=>j.onclick=()=>openLavoro(j.dataset.id));
}
function esc(s){return(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ===== dettaglio ===== */
async function openLavoro(id){
  const l=LAVORI.find(x=>x.id===id);if(!l)return;
  curLavoro=l;
  const cl=CLIENTI[l.cliente_id];
  $("#lv-title").textContent=cl?cl.nome:(l.descrizione?l.descrizione.slice(0,50):etic("Lavoro"));
  const bits=[];
  if(l.dove||(cl&&cl.indirizzo))bits.push("📍 "+(l.dove||cl.indirizzo));
  if(l.data_prevista)bits.push("📅 "+dataIt(l.data_prevista));
  $("#lv-meta").innerHTML=bits.join(" · ")+" "+statoBadge(l.stato);
  $("#lv-istr").textContent=l.descrizione||"Nessuna istruzione.";
  $("#lv-note").value=l.lavoro_svolto||"";
  $("#lv-foto").innerHTML="";
  show("lavoro");
  renderRapportino();
  renderMieSpese();   /* 5 set 2026 — le spese che ha segnato lui su questo lavoro */
  caricaFoto(l.id);
  caricaVideo(l.id);
}

