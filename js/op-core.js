// [SPOSTATO] op-core.js: le righe 1-627 del vecchio file ora stanno in: op-base.js (righe 1-268), op-agenda-giorno.js (righe 269-627). Qui resta il resto.
/* ============================================================
   LE SPESE CHE HA SEGNATO LUI, E COME SI CORREGGONO — 5 set 2026

   ⛔ Perche' qui e non nel pannello del capo: chi sbaglia la cifra e' chi la
   scrive, e se ne accorge sul momento (24,50 diventato 2450, la virgola nel
   posto sbagliato, il fornitore sbagliato). Prima non poteva ne' vederla ne'
   correggerla, e la correzione diventava lavoro del capo.

   ⚠️ Si vedono SOLO le sue: il database non gli fa leggere le altre
   (`gest_spese_team_read` chiede che `creato_da` sia il suo). Non e' una
   scelta della schermata: e' una regola del database. Anche chiamando
   Supabase da fuori, le spese dei colleghi non escono.
   ============================================================ */
let SPESE_MIE=[];
async function renderMieSpese(){
  const box=document.getElementById("lv-spese-box");
  const lista=document.getElementById("lv-spese-list");
  if(!box||!lista)return;
  SPESE_MIE=[];
  if(!sb||!curLavoro||!MIO.impresaId||!MIO.operatoreId||!puo("pagamenti")){
    box.classList.add("hidden");return;
  }
  const {data,error}=await sb.from("gest_spese")
    .select("id,descrizione,importo,data,created_at")
    .eq("user_id",MIO.impresaId).eq("lavoro_id",curLavoro.id)
    .eq("creato_da",MIO.operatoreId).is("eliminato_il",null)
    .order("created_at",{ascending:false}).limit(20);
  /* se la lettura non riesce il riquadro sparisce in silenzio: e' un di piu',
     non deve rompere la schermata del lavoro */
  if(error){box.classList.add("hidden");return;}
  SPESE_MIE=data||[];
  box.classList.remove("hidden");
  if(!SPESE_MIE.length){
    lista.innerHTML='<div class="sp-vuoto">Qui compaiono le spese che segni tu su questo lavoro, cos&igrave; se sbagli una cifra la correggi da solo.</div>';
    return;
  }
  lista.innerHTML=SPESE_MIE.map(x=>
    '<div class="sp-riga" data-sp="'+esc(String(x.id))+'">'
    +'<div class="sp-testo">'+esc(x.descrizione||"Spesa")
    +(x.data?'<br><span style="color:var(--muted);font-size:13px">'+dataIt(x.data)+'</span>':'')
    +'</div>'
    +'<div class="sp-imp">'+eur(x.importo)+'</div>'
    +'<button type="button" class="sp-fix" data-fix="'+esc(String(x.id))+'">Correggi</button>'
    +'</div>').join("");
}

document.getElementById("lv-spese-list").addEventListener("click",async e=>{
  const bFix=e.target.closest("[data-fix]");
  if(bFix){ speseApriForm(bFix.getAttribute("data-fix")); return; }
  const bAnn=e.target.closest("[data-sp-annulla]");
  if(bAnn){ renderMieSpese(); return; }
  const bSal=e.target.closest("[data-sp-salva]");
  if(bSal){ await speseSalva(bSal.getAttribute("data-sp-salva"),bSal); return; }
});

function speseApriForm(id){
  const riga=document.querySelector('.sp-riga[data-sp="'+id+'"]');
  const x=SPESE_MIE.find(y=>String(y.id)===String(id));
  if(!riga||!x)return;
  riga.outerHTML='<div class="sp-form">'
    +'<input type="text" id="sp-des" value="'+esc(x.descrizione||"")+'" placeholder="Per cosa hai speso">'
    +'<input type="text" inputmode="decimal" id="sp-imp" value="'
      +String(Number(x.importo)||0).replace(".",",")+'" placeholder="Quanto (es. 24,50)">'
    +'<div class="row-btns">'
    +'<button type="button" class="btn-line" data-sp-annulla="1" style="flex:1">Lascia stare</button>'
    +'<button type="button" class="btn-fill" data-sp-salva="'+esc(String(id))+'" style="flex:1">Salva</button>'
    +'</div></div>';
}

async function speseSalva(id,bottone){
  const des=((document.getElementById("sp-des")||{}).value||"").trim();
  const imp=_numIt((document.getElementById("sp-imp")||{}).value||"");
  if(!des){toast("Scrivi per cosa hai speso");return;}
  if(!(imp>0)){toast("Scrivi quanto hai speso, per esempio 24,50");return;}
  if(imp>1000000){toast("Importo troppo alto: controlla quello che hai scritto");return;}
  if(bottone)bottone.disabled=true;
  /* ⚠️ `.select("id")` non e' un vezzo: una UPDATE fermata da una regola del
     database NON da' errore, torna zero righe. Senza questo conto la schermata
     direbbe «corretta» con il database intatto. E' lo stesso inciampo preso
     con le ore il →15← agosto. */
  const {data,error}=await sb.from("gest_spese")
    .update({descrizione:des,importo:imp})
    .eq("id",id).eq("creato_da",MIO.operatoreId).select("id");
  if(bottone)bottone.disabled=false;
  if(error){toast("Non corretta: "+(error.message||"il database non risponde"));return;}
  if(!data||!data.length){toast("Non corretta: questa spesa non l'hai scritta tu.");await renderMieSpese();return;}
  toast("Spesa corretta \u2714");
  await renderMieSpese();
}
$("#btn-back").onclick=()=>{renderCal();renderDay();show("agenda");};

async function caricaFoto(lavoroId){
  const {data}=await sb.from("gest_foto").select("storage_path,tipo").eq("lavoro_id",lavoroId).order("created_at",{ascending:false});
  const capo=$("#lv-foto-capo"), grid=$("#lv-foto");
  capo.innerHTML="";grid.innerHTML="";
  const rows=data||[];
  const daCapo=rows.filter(f=>f.tipo==="da_fare"), mie=rows.filter(f=>f.tipo!=="da_fare");
  if(!daCapo.length)capo.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:14px">Nessuna foto dal capo.</div>';
  else for(const f of daCapo){
    const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
    if(su&&su.signedUrl){const img=document.createElement("img");img.src=su.signedUrl;capo.appendChild(img);}
  }
  if(!mie.length)grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:14px">Ancora nessuna foto.</div>';
  else for(const f of mie){
    const {data:su}=await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path,3600);
    if(su&&su.signedUrl){const img=document.createElement("img");img.src=su.signedUrl;grid.appendChild(img);}
  }
}

/* foto: carica */
$("#btn-foto").onclick=()=>{ if(chiedoPermesso("foto","di aggiungere foto"))$("#lv-file").click(); };
$("#lv-file").onchange=async e=>{
  const file=e.target.files[0];if(!file||!curLavoro)return;
  $("#btn-foto").disabled=true;$("#btn-foto").textContent="Carico…";
  /* ridimensiona a 1600px/JPEG 0.75 e blocca oltre 15 MB (js/foto-upload.js).
     Qui conta doppio: si carica dal cantiere, spesso con poco campo. */
  const p=await preparaFileUpload(file);
  if(p.errore){
    toast(p.errore);
    $("#btn-foto").disabled=false;$("#btn-foto").textContent="📷 Aggiungi foto";
    e.target.value="";return;
  }
  const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=MIO.impresaId+"/"+curLavoro.id+"/"+Date.now()+"_"+safe;
  const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
  if(up){toast("Foto non caricata: "+up.message);}
  else{
    const {error:ins}=await sb.from("gest_foto").insert({user_id:MIO.impresaId,lavoro_id:curLavoro.id,tipo:"lavoro",operatore:MIO.nome,storage_path:path});
    if(ins){await _fileOrfano("gestionale-foto",path);toast("Foto non salvata: "+ins.message+" — riprova");}
    else{toast("Foto aggiunta ✔");await caricaFoto(curLavoro.id);}
  }
  $("#btn-foto").disabled=false;$("#btn-foto").textContent="📷 Aggiungi foto";
  e.target.value="";
};

/* video: stessa idea delle foto, ma niente compressione (troppo pesante nel
   browser) — solo il limite di 50 MB a bloccare i file troppo grandi */
async function caricaVideo(lavoroId){
  const {data}=await sb.from("gest_video").select("id,storage_path,tipo").eq("lavoro_id",lavoroId).order("created_at",{ascending:false});
  const capo=$("#lv-video-capo"), grid=$("#lv-video");
  if(!capo||!grid)return;
  capo.innerHTML="";grid.innerHTML="";
  const rows=data||[];
  const daCapo=rows.filter(v=>v.tipo==="da_fare"), mie=rows.filter(v=>v.tipo!=="da_fare");
  if(!daCapo.length)capo.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:14px">Nessun video dal capo.</div>';
  else for(const v of daCapo){
    const {data:su}=await sb.storage.from("gestionale-video").createSignedUrl(v.storage_path,3600);
    if(su&&su.signedUrl){const d=document.createElement("div");d.className="vid-ph";d.textContent="▶️";d.onclick=()=>window.open(su.signedUrl,"_blank");capo.appendChild(d);}
  }
  if(!mie.length)grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:14px">Ancora nessun video.</div>';
  else for(const v of mie){
    const {data:su}=await sb.storage.from("gestionale-video").createSignedUrl(v.storage_path,3600);
    if(su&&su.signedUrl){const d=document.createElement("div");d.className="vid-ph";d.textContent="▶️";d.onclick=()=>window.open(su.signedUrl,"_blank");grid.appendChild(d);}
  }
}
$("#btn-video").onclick=()=>{ if(chiedoPermesso("foto","di aggiungere video"))$("#lv-video-file").click(); };
$("#lv-video-file").onchange=async e=>{
  const file=e.target.files[0];if(!file||!curLavoro)return;
  if(file.size>52428800){
    toast("Il video supera i 50 MB");
    e.target.value="";return;
  }
  $("#btn-video").disabled=true;$("#btn-video").textContent="Carico…";
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=MIO.impresaId+"/"+curLavoro.id+"/"+Date.now()+"_"+safe;
  const {error:up}=await sb.storage.from("gestionale-video").upload(path,file);
  if(up){toast("Video non caricato: "+up.message);}
  else{
    const {error:ins}=await sb.from("gest_video").insert({user_id:MIO.impresaId,lavoro_id:curLavoro.id,tipo:"lavoro",operatore:MIO.nome,storage_path:path});
    if(ins){await _fileOrfano("gestionale-video",path);toast("Video non salvato: "+ins.message+" — riprova");}
    else{toast("Video aggiunto ✔");await caricaVideo(curLavoro.id);}
  }
  $("#btn-video").disabled=false;$("#btn-video").textContent="🎥 Aggiungi video (max 50 MB)";
  e.target.value="";
};

/* carta aziendale: la mostro solo se al mio operatoreId è assegnata una
   carta attiva. Il saldo arriva dalla vista gest_carte_saldo (ricariche
   meno spese), non si scrive mai a mano. */
let MIA_CARTA=null;
async function caricaCartaMia(){
  if(!MIO.operatoreId)return;
  /* senza il permesso «Pagamenti» la carta non si carica nemmeno: non si
     chiede al database una cosa che non si deve vedere */
  if(!(permessiMai()||puo("pagamenti"))){const cp=$("#carta-panel");if(cp)cp.style.display="none";return;}
  const {data}=await sb.from("gest_carte_saldo").select("carta_id,nome,saldo")
    .eq("user_id",MIO.impresaId).eq("dipendente_id",MIO.operatoreId).eq("stato","attiva").limit(1);
  const mia=(data&&data[0])||null;
  if(!mia){$("#carta-panel").style.display="none";return;}
  MIA_CARTA=mia;
  $("#carta-panel").style.display="block";
  $("#carta-info").innerHTML=`<div style="font-size:24px;font-weight:800;color:var(--green-d)">${eur(mia.saldo)}</div><div style="font-size:15px;color:var(--muted)">Saldo disponibile — ${esc(mia.nome)}</div>`;
  const {data:mov}=await sb.from("gest_carte_movimenti").select("tipo,importo,causale,data").eq("carta_id",mia.carta_id).order("data",{ascending:false}).limit(5);
  const st=$("#carta-storico");
  if(!mov||!mov.length){st.innerHTML="";return;}
  st.innerHTML=mov.map(m=>`<div style="display:flex;justify-content:space-between;font-size:15px;padding:6px 0;border-bottom:1px solid var(--line)">
    <span>${m.tipo==="spesa"?"➖":"➕"} ${esc(m.causale||(m.tipo==="spesa"?"Spesa":"Ricarica"))}</span>
    <span style="font-weight:700">${eur(m.importo)}</span></div>`).join("");
}
$("#btn-carta-spesa").onclick=()=>{ if(!chiedoPermesso("pagamenti","di usare la carta aziendale"))return;
  $("#carta-form").classList.remove("hidden");$("#btn-carta-spesa").style.display="none";};
$("#btn-carta-annulla").onclick=()=>{
  $("#carta-form").classList.add("hidden");$("#btn-carta-spesa").style.display="block";
  $("#carta-imp").value="";$("#carta-causale").value="";
};
$("#btn-carta-salva").onclick=async()=>{
  if(!MIA_CARTA)return;
  if(!chiedoPermesso("pagamenti","di usare la carta aziendale"))return;
  const importo=_numIt($("#carta-imp").value);
  if(!importo||importo<=0){toast("Scrivi quanto hai speso, per esempio 12,50");return;}
  /* un tetto ci vuole: senza, un dito appoggiato sullo zero manda al database
     un numero che la colonna non regge, e l'errore arriva dopo */
  if(importo>1000000){toast("Importo troppo alto: controlla quello che hai scritto");return;}
  const causale=$("#carta-causale").value.trim()||null;
  $("#btn-carta-salva").disabled=true;
  const {error}=await sb.from("gest_carte_movimenti").insert({
    user_id:MIO.impresaId,carta_id:MIA_CARTA.carta_id,tipo:"spesa",importo,causale,inserito_da:MIO.nome
  });
  $("#btn-carta-salva").disabled=false;
  if(error){toast("Errore: "+error.message);return;}
  toast("Spesa registrata ✔");
  $("#carta-imp").value="";$("#carta-causale").value="";
  $("#carta-form").classList.add("hidden");$("#btn-carta-spesa").style.display="block";
  caricaCartaMia();
};

/* ===================================================================
   + RAPIDO — 15 agosto 2026
   Tre tocchi: cosa, quale lavoro, conferma. Niente AI, niente crediti,
   e funziona anche con poco campo: sono tre scritture normali.
   ⚠️ Le ore NON prendono una strada nuova: creano un rapportino con dentro
   solo chi lo scrive. Cosi' resta un posto solo da cui passano le ore, e il
   margine del lavoro le vede come tutte le altre.
   =================================================================== */
const RV={passo:0,tipo:null,lavoro:null,ore:8,testo:"",importo:"",
          /* la voce: quello che ha detto, quello che l'AI ha capito,
             le ore per persona e i nomi che ho buttato via */
          detto:"",capito:null,vOre:{},vScarti:[]};
const RV_TIPI=[
  {k:"voce",      lab:"🎙 Racconta la giornata",
                                   sub:"Parla e basta: ore, materiali e spese insieme", perm:"rapportini"},
  {k:"ore",       lab:"Ore",       sub:null,                                       perm:"rapportini"},
  /* ⚠️ 5 set 2026: le sub di «Materiale» e «Spesa» le decide il mestiere, e si
     leggono al momento di disegnare (il ruolo si sa solo dopo il database). */
  {k:"materiale", lab:"Materiale", sub:null,                                       perm:"rapportini"},
  {k:"nota",      lab:"Nota",      sub:"Un appunto sulla giornata",                perm:"rapportini"},
  {k:"spesa",     lab:"Spesa",     sub:null,                                       perm:"pagamenti"}
];
function _rvSub(t){
  if(t.k==="ore")return _p('subOre');
  if(t.k==="materiale")return _p('subMateriale');
  if(t.k==="spesa")return _p('subSpesa');
  return t.sub;
}

function rvChiudi(){ $("#rv-ov").classList.add("hidden"); RV.passo=0; }
function rvApri(){
  RV.passo=1; RV.tipo=null; RV.lavoro=null; RV.ore=8; RV.testo=""; RV.importo=""; RV.autoLavoro=false;
  RV.detto=""; RV.capito=null; RV.vOre={}; RV.vScarti=[];
  $("#rv-ov").classList.remove("hidden");
  rvDisegna();
}
/* i lavori piu' recenti, i finiti in fondo: in cantiere si segna quasi sempre
   su quello di oggi o di ieri */
function rvLavori(){
  return (LAVORI||[]).slice()
    .sort((a,b)=>{
      const fa=(a.stato==="fatto")?1:0, fb=(b.stato==="fatto")?1:0;
      if(fa!==fb)return fa-fb;
      return String(b.data_prevista||"").localeCompare(String(a.data_prevista||""));
    })
    .slice(0,8);
}
/* ============================================================
   ⛔ 5 SETTEMBRE 2026 — IL LAVORO DI OGGI IN CIMA, E GIA' SCELTO
   ============================================================
   La scelta del lavoro era una lista sola: con →3← lavori va bene, con →40←
   diventa un elenco da scorrere col guanto. Fluida il cantiere lo indovina col
   GPS; noi non abbiamo il GPS, ma sappiamo una cosa che basta quasi sempre:
   QUALE LAVORO E' SEGNATO PER OGGI.
   Deciso da Alessio il 5 settembre: «oggi in cima e preselezionato».
     · un solo lavoro oggi  -> e' gia' scelto, un tocco in meno
     · piu' d'uno           -> quelli di oggi in cima, sotto il titolino «Oggi»
     · nessuno              -> la lista di prima, tale e quale
   ⚠️ Preselezionato NON vuol dire obbligato: dal passo dopo si torna
   indietro con la freccia e si sceglie un altro lavoro, come prima.
   ============================================================ */
function rvLavoriOggi(){
  const oggi=ymd(new Date());
  return (LAVORI||[]).filter(l=>l.data_prevista===oggi && l.stato!=="fatto");
}
function rvUnicoDiOggi(){
  const o=rvLavoriOggi();
  return (o.length===1)?o[0]:null;
}
function rvNomeLavoro(l){
  const c=CLIENTI[l.cliente_id];
  return (c&&c.nome) || (l.descrizione?l.descrizione.slice(0,40):"Lavoro senza nome");
}
function rvDisegna(){
  const corpo=$("#rv-corpo"), tit=$("#rv-tit"), back=$("#rv-indietro");
  back.classList.toggle("hidden", RV.passo<=1);

  if(RV.passo===1){
    tit.textContent="Cosa vuoi segnare?";
    const usabili=RV_TIPI.filter(t=>puo(t.perm));
    if(!usabili.length){
      corpo.innerHTML='<div class="rv-nota">Il capo non ti ha dato nessun permesso per segnare le cose da qui. Servono «Rapportini» oppure «Pagamenti».</div>';
      return;
    }
    corpo.innerHTML=usabili.map(t=>'<button type="button" class="rv-scelta" data-tipo="'+t.k+'">'+esc(t.lab)+'<small>'+esc(_rvSub(t))+'</small></button>').join("");
    return;
  }

  if(RV.passo===2){
    tit.textContent="Su quale lavoro?";
    const lv=rvLavori();
    if(!lv.length){
      corpo.innerHTML='<div class="rv-nota">'+esc(_p('nessunLavoro'))+'</div>';
      return;
    }
    const bottone=function(l){
      const dove=l.dove?" — "+l.dove:"";
      return '<button type="button" class="rv-scelta" data-lav="'+esc(l.id)+'">'+esc(rvNomeLavoro(l))
        +'<small>'+esc((l.data_prevista?dataIt(l.data_prevista):"senza data")+dove)+'</small></button>';
    };
    /* 5 set 2026 — quelli di oggi in cima, con il loro titolino. Gli altri
       restano sotto nell'ordine di prima: nessun lavoro sparisce. */
    const oggi=rvLavoriOggi();
    const idOggi={}; oggi.forEach(l=>{idOggi[String(l.id)]=1;});
    const altri=lv.filter(l=>!idOggi[String(l.id)]);
    corpo.innerHTML=(oggi.length
        ? '<div class="rv-gruppo">Oggi</div>'+oggi.map(bottone).join("")
          +(altri.length?'<div class="rv-gruppo">Gli altri</div>':"")
        : "")
      +altri.map(bottone).join("");
    return;
  }

  /* passo 3: la conferma, diversa per ogni cosa */
  const nome=RV.lavoro?rvNomeLavoro(RV.lavoro):"";

  /* passo 4: quello che l'AI ha capito, da controllare prima di salvare */
  if(RV.passo===4){ voceDisegnaControllo(nome); return; }

  if(RV.tipo==="voce"){
    tit.textContent="Racconta la giornata";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' · oggi</div>'
      /* il testo si ritrova tornando indietro: chi ha appena dettato tre righe
         in piedi su un ponteggio non le ridetta perche' ha premuto la freccia */
      +'<textarea class="rv-in" id="rv-detto" rows="5" placeholder="'+esc(_p('esDettato'))+'">'+esc(RV.detto||"")+'</textarea>'
      +'<div class="rv-mic">🎙 <b>Non scrivere: parla.</b> Tocca qui sopra, poi sulla tastiera del telefono tieni premuto il tasto del <b>microfono</b> e racconta com’è andata. Le parole compaiono da sole.</div>'
      +'<button type="button" class="rv-ok" id="rv-pensa">Fammi vedere cosa hai capito</button>'
      +'<div class="rv-nota">Costa 1 credito AI dell’impresa. Dopo puoi correggere tutto: niente viene salvato finché non confermi tu.</div>';
    return;
  }

  if(RV.tipo==="ore"){
    tit.textContent="Quante ore?";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' · oggi</div>'
      +'<div class="rv-riga"><button type="button" class="rv-pm" data-d="-0.5" aria-label="Togli mezz\u2019ora">\u2212</button>'
      +'<div class="rv-num" id="rv-ore">'+String(RV.ore).replace(".",",")+'</div>'
      +'<button type="button" class="rv-pm" data-d="0.5" aria-label="Aggiungi mezz\u2019ora">+</button></div>'
      +'<button type="button" class="rv-ok" id="rv-ok">Conferma</button>'
      +'<div class="rv-nota">Sono le TUE ore. Per quelle di tutta la squadra c\u2019\u00e8 il rapportino, dentro il lavoro.</div>';
    return;
  }
  if(RV.tipo==="materiale"||RV.tipo==="nota"){
    const m=RV.tipo==="materiale";
    tit.textContent=m?(_p('cosaUsato')+"?"):"Cosa scrivi?";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' \u00b7 oggi</div>'
      +'<textarea class="rv-in" id="rv-testo" rows="3" placeholder="'+esc(m?_p('esUsatoCorto'):"Es. pioggia, fermi due ore")+'"></textarea>'
      +'<button type="button" class="rv-ok" id="rv-ok">Conferma</button>'
      +(m?'<div class="rv-nota">Scrivi le cose, non i prezzi: quelli stanno nelle spese, se no vengono contati due volte.</div>':'');
    return;
  }
  if(RV.tipo==="spesa"){
    tit.textContent="Quanto hai speso?";
    corpo.innerHTML='<div class="rv-nota">'+esc(nome)+' \u00b7 oggi</div>'
      +'<input class="rv-in" id="rv-imp" type="text" inputmode="decimal" placeholder="Importo (es. 24,50)" data-euro>'
      +'<input class="rv-in" id="rv-testo" type="text" placeholder="Per cosa? (es. viti e tasselli)">'
      +'<button type="button" class="rv-ok" id="rv-ok">Conferma</button>'
      +'<div class="rv-nota">Questi soldi entrano nel conto di questo cantiere. La carta aziendale \u00e8 un\u2019altra cosa e resta dov\u2019\u00e8.</div>';
    return;
  }
}
/* un ascolto solo sul contenitore: il contenuto viene rifatto a ogni passo */
$("#rv-corpo").addEventListener("click",async e=>{
  const t=e.target.closest("[data-tipo]");
  if(t){
    RV.tipo=t.dataset.tipo;
    /* 5 set 2026 — un solo lavoro segnato per oggi: e' gia' scelto, si salta
       la schermata della lista. Con la freccia «‹» si torna alla lista e si
       cambia, quindi non si resta chiusi dentro una scelta sbagliata. */
    const solo=rvUnicoDiOggi();
    if(solo){ RV.lavoro=solo; RV.passo=3; RV.autoLavoro=true; }
    else { RV.lavoro=null; RV.passo=2; RV.autoLavoro=false; }
    rvDisegna(); return;
  }
  const l=e.target.closest("[data-lav]");
  if(l){ RV.lavoro=(LAVORI||[]).find(x=>String(x.id)===String(l.dataset.lav))||null; RV.passo=3; RV.autoLavoro=false; rvDisegna(); return; }
  const pm=e.target.closest(".rv-pm");
  if(pm){
    let v=(+RV.ore||0)+(parseFloat(pm.dataset.d)||0);
    if(v<0.5)v=0.5; if(v>24)v=24;
    RV.ore=Math.round(v*2)/2;
    const c=$("#rv-ore"); if(c)c.textContent=String(RV.ore).replace(".",",");
    return;
  }
  /* le ore della schermata di controllo: stessi pulsanti del rapportino grande */
  const vp=e.target.closest(".rap-pm");
  if(vp){
    const riga=vp.closest(".rap-riga"); if(!riga)return;
    const op=riga.dataset.op;
    let v=(+RV.vOre[op]||0)+(parseFloat(vp.dataset.d)||0);
    if(v<0)v=0; if(v>24)v=24;
    RV.vOre[op]=Math.round(v*2)/2;
    const cella=document.getElementById("vore-"+op);
    if(cella){
      cella.textContent=(RV.vOre[op]===0)?"0":String(RV.vOre[op]).replace(".",",");
      cella.classList.toggle("zero",RV.vOre[op]===0);
    }
    return;
  }
  if(e.target.closest("#rv-pensa")){ await vocePensa(); return; }
  if(e.target.closest("#rv-salva-voce")){ await voceSalva(); return; }
  if(e.target.closest("#rv-ok")) await rvSalva();
});
$("#btn-rapido").onclick=rvApri;
$("#rv-x").onclick=rvChiudi;
$("#rv-indietro").onclick=()=>{
  /* ⚠️ 5 set 2026: quando il lavoro e' stato scelto DA SOLO, il passo →2←
     non e' mai stato disegnato — ma tornando indietro ci si deve arrivare
     lo stesso, se no dal passo →3← si finirebbe dritti al passo →1← e non
     si potrebbe cambiare cantiere. */
  RV.passo=Math.max(1,RV.passo-1);
  if(RV.autoLavoro){ RV.autoLavoro=false; }
  rvDisegna();
};
$("#rv-ov").onclick=e=>{ if(e.target===$("#rv-ov"))rvChiudi(); };

/* ===================================================================
   LA VOCE — 15 agosto 2026
   L'operaio detta con il microfono della sua tastiera, il server capisce,
   e QUI si controlla riga per riga prima di far vedere qualcosa.

   ⚠️ QUELLO CHE TIENE NON E' IL PROMPT, E' QUESTO FILTRO.
   Al server e' scritto "non inventare nomi". Ma un prompt e' un desiderio,
   non una garanzia: prima o poi un modello ci mette dentro un Marco che non
   c'e'. Un'ora sulla persona sbagliata e' una busta paga sbagliata, e salta
   fuori a fine mese quando nessuno si ricorda piu' niente.
   Quindi: i nomi che non sono nella squadra di questo lavoro NON entrano, e
   quelli buttati via si vedono scritti, non spariscono in silenzio.
   =================================================================== */

/* la gente di questo lavoro: la stessa regola del rapportino grande */
function voceGente(){
  const mid=RV.lavoro&&RV.lavoro.mestiere_id;
  return (SQUADRA||[]).filter(p=>!mid||!p.mestiere_id||String(p.mestiere_id)===String(mid));
}

/* due nomi sono la stessa persona? Il parlato non ha accenti ne' maiuscole:
   "DE LUCA", "de luca" e "De Lucà" devono cadere sulla stessa riga. */
function voceStessoNome(a,b){
  /* \u0300-\u036f sono gli accenti staccati da normalize("NFD"). Scritti con
     il codice e non con il carattere vero: un accento invisibile dentro una
     regola e' il tipo di riga che si rompe al primo salvataggio storto. */
  const p=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
              .replace(/[^a-z0-9]+/g," ").trim();
  return p(a)!==""&&p(a)===p(b);
}

async function vocePensa(){
  const b=$("#rv-pensa");
  const detto=(($("#rv-detto")||{}).value||"").trim();
  RV.detto=detto;
  if(detto.length<10){toast("Racconta qualcosa di piu’: almeno una frase intera.");return;}
  if(detto.length>4000){toast("Troppo lungo. Racconta la giornata, non il mese.");return;}
  if(!RV.lavoro){toast("Scegli il lavoro");return;}
  if(!chiedoPermesso("rapportini","di scrivere il rapportino"))return;

  if(SQUADRA===null)await caricaSquadra();
  const gente=voceGente();
  if(!gente.length){toast("Non riesco a leggere la squadra di questo lavoro. Segna a mano con «Ore».");return;}

  if(b){b.disabled=true;b.textContent="Sto ascoltando…";}
  const rimetti=()=>{const x=$("#rv-pensa"); if(x){x.disabled=false;x.textContent="Fammi vedere cosa hai capito";}};

  let sess=null;
  try{ sess=(await sb.auth.getSession()).data.session; }catch(_){}
  const token=sess&&sess.access_token;
  if(!token){rimetti();toast("Sessione scaduta: esci e rientra.");return;}

  /* la lista vera va DENTRO il messaggio: il server non sa chi c'e' in
     squadra, e senza lista i nomi se li inventerebbe per forza */
  const messaggio="SQUADRA: "+gente.map(p=>p.nome).join("; ")
    +"\nIO SONO: "+(MIO.nome||"")
    +"\nDETTO: "+detto;

  let risp=null;
  try{
    const r=await fetch(SUPA_URL+"/functions/v1/ai-generate",{
      method:"POST",
      headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({feature:"dati_rapportino",input:messaggio})
    });
    risp=await r.json();
    if(!r.ok){
      rimetti();
      /* 402 = crediti. Da oggi sono quelli dell'IMPRESA, non suoi: il
         messaggio deve mandarlo dal capo, non farlo sentire in difetto. */
      if(r.status===402){
        toast(risp&&risp.reason==="plan_without_ai"
          ? "L’impresa non ha le funzioni AI. Segna a mano con «Ore»."
          : "L’impresa ha finito i crediti AI del mese. Dillo al capo, intanto segna a mano.");
      }else if(r.status===400&&/non riconosciuta/i.test((risp&&risp.error)||"")){
        /* l'app e' piu' avanti del server: succede se il telefono ha gia' la
           pagina nuova e la funzione online e' ancora quella vecchia. Dirlo
           in modo che si capisca, invece di sputare l'errore del server. */
        toast("Questa cosa non è ancora accesa sul server. Segna a mano con «Ore», e dillo al capo.");
      }else{
        toast((risp&&risp.error)||"Il servizio non ha risposto. Riprova, oppure segna a mano.");
      }
      return;
    }
  }catch(err){
    rimetti();
    toast("Niente rete. Segna a mano con «Ore»: quello funziona anche senza campo.");
    return;
  }

  const pulito=voceRipulisci(risp&&risp.result, gente);
  if(!pulito){
    rimetti();
    toast("Non ho capito quello che hai detto. Riprova con parole piu’ semplici, o segna a mano.");
    return;
  }
  RV.capito=pulito;
  RV.vOre={};
  gente.forEach(p=>{RV.vOre[p.id]=0;});
  pulito.ore.forEach(o=>{RV.vOre[o.id]=o.ore;});
  RV.vScarti=pulito.scarti;
  RV.passo=4;
  rvDisegna();
}

/* Prende quello che ha detto il server e lo riduce a cose vere.
   Torna null se non c'e' niente di leggibile. */
function voceRipulisci(grezzo, gente){
  let j=null;
  try{ j=JSON.parse(String(grezzo||"")); }catch(_){ return null; }
  if(!j||typeof j!=="object")return null;

  const ore=[], scarti=[];
  if(Array.isArray(j.ore)){
    j.ore.forEach(r=>{
      if(!r||typeof r!=="object")return;
      const p=gente.find(g=>voceStessoNome(g.nome,r.nome));
      if(!p){
        const n=String(r.nome||"").trim();
        if(n&&scarti.indexOf(n)<0)scarti.push(n);
        return;
      }
      let v=Number(r.ore);
      if(!isFinite(v)||v<=0)return;
      if(v>24)v=24;                       /* in un giorno non ce ne stanno di piu' */
      v=Math.round(v*2)/2;                /* mezz'ora e' il passo dei pulsanti */
      const gia=ore.find(x=>x.id===p.id); /* nominato due volte: si somma, non si raddoppia */
      if(gia){ gia.ore=Math.min(24,Math.round((gia.ore+v)*2)/2); }
      else   { ore.push({id:p.id,nome:p.nome,ore:v}); }
    });
  }

  const testo=(v,max)=>String(v==null?"":v).replace(/\s+/g," ").trim().slice(0,max);
  const materiali=testo(j.materiali,600);
  const note=testo(j.note,1000);

  let spesaImp=null, spesaDes="";
  if(j.spesa&&typeof j.spesa==="object"){
    const n=(typeof j.spesa.importo==="string")?_numIt(j.spesa.importo):Number(j.spesa.importo);
    if(isFinite(n)&&n>0&&n<=1000000){
      spesaImp=Math.round(n*100)/100;
      spesaDes=testo(j.spesa.descrizione,200);
    }
  }

  if(!ore.length&&!materiali&&!note&&spesaImp===null)return null;
  return {ore:ore,materiali:materiali,note:note,spesaImp:spesaImp,spesaDes:spesaDes,scarti:scarti};
}

function voceDisegnaControllo(nomeLavoro){
  const corpo=$("#rv-corpo"), tit=$("#rv-tit");
  tit.textContent="Controlla, poi salva";
  const c=RV.capito||{ore:[],materiali:"",note:"",spesaImp:null,spesaDes:"",scarti:[]};
  const gente=voceGente();
  const puoSpesa=puo("pagamenti");

  let h='<div class="rv-nota">'+esc(nomeLavoro)+' · oggi</div>';

  if(c.scarti&&c.scarti.length){
    h+='<div class="rv-scarti"><b>Non ho messo le ore di: '+esc(c.scarti.join(", "))+'.</b><br>'
      +'Queste persone non sono nella squadra di questo lavoro. Se ci hanno lavorato davvero, dillo al capo: le ore le mette lui.</div>';
  }

  h+='<div class="rv-sez">Ore</div>';
  if(!gente.length){
    h+='<div class="rv-vuoto">Squadra non leggibile.</div>';
  }else{
    h+=gente.map(p=>{
      const v=+RV.vOre[p.id]||0;
      return '<div class="rap-riga" data-op="'+esc(p.id)+'">'
        +'<div class="rap-nome">'+esc(p.nome||"Senza nome")+'</div>'
        +'<button type="button" class="rap-pm" data-d="-0.5" aria-label="Togli mezz’ora a '+esc(p.nome||"")+'">−</button>'
        +'<div class="rap-ore'+(v===0?" zero":"")+'" id="vore-'+esc(p.id)+'">'+(v===0?"0":String(v).replace(".",","))+'</div>'
        +'<button type="button" class="rap-pm" data-d="0.5" aria-label="Aggiungi mezz’ora a '+esc(p.nome||"")+'">+</button>'
        +'</div>';
    }).join("");
  }

  h+='<div class="rv-sez">Materiali</div>'
    +'<textarea class="rv-in" id="rv-v-mat" rows="2" placeholder="Vuoto: non hai parlato di materiali">'+esc(c.materiali)+'</textarea>'
    +'<div class="rv-sez">Note</div>'
    +'<textarea class="rv-in" id="rv-v-note" rows="3" placeholder="Vuoto: non c’era niente da segnare">'+esc(c.note)+'</textarea>';

  if(puoSpesa){
    h+='<div class="rv-sez">Spesa</div>'
      +'<input class="rv-in" id="rv-v-imp" type="text" inputmode="decimal" placeholder="Importo (es. 24,50)" value="'
        +esc(c.spesaImp===null?"":String(c.spesaImp).replace(".",","))+'" data-euro>'
      +'<input class="rv-in" id="rv-v-des" type="text" placeholder="Per cosa?" value="'+esc(c.spesaDes)+'">';
  }else if(c.spesaImp!==null){
    /* ha parlato di soldi ma non ha il permesso: dirglielo, non ingoiarlo */
    h+='<div class="rv-sez">Spesa</div>'
      +'<div class="rv-scarti">Hai parlato di una spesa di '+esc(String(c.spesaImp).replace(".",","))
      +' €, ma il capo non ti ha dato il permesso «Pagamenti»: non la salvo. Diglielo tu.</div>';
  }

  h+='<button type="button" class="rv-ok" id="rv-salva-voce">Salva tutto</button>'
    +'<div class="rv-nota">Fino a qui non è stato salvato niente. Il credito AI è già stato usato per capire quello che hai detto.</div>';

  corpo.innerHTML=h;
}

async function voceSalva(){
  if(!RV.lavoro){toast("Scegli il lavoro");return;}
  if(!chiedoPermesso("rapportini","di scrivere il rapportino"))return;
  const b=$("#rv-salva-voce");
  const rimetti=()=>{const x=$("#rv-salva-voce"); if(x){x.disabled=false;x.textContent="Salva tutto";}};
  if(b){b.disabled=true;b.textContent="Salvo…";}

  const materiali=(($("#rv-v-mat")||{}).value||"").trim();
  const note=(($("#rv-v-note")||{}).value||"").trim();
  const righe=Object.keys(RV.vOre).filter(k=>(+RV.vOre[k])>0).map(k=>({op:k,ore:+RV.vOre[k]}));

  /* la spesa passa da due porte, non da una: le caselle non ci sono nemmeno
     se manca il permesso, e comunque qui si ricontrolla. Nascondere un
     pulsante non e' una difesa: una pagina rimasta aperta da prima, o un
     permesso tolto nel frattempo, e la casella e' ancora li'. */
  const puoSpesa=puo("pagamenti");
  const imp=puoSpesa?_numIt((($("#rv-v-imp")||{}).value||"")):null;
  const des=puoSpesa?(($("#rv-v-des")||{}).value||"").trim():"";
  const vuoleSpesa=puo("pagamenti")&&puoSpesa&&imp!==null&&imp>0;
  if(vuoleSpesa&&imp>1000000){rimetti();toast("Importo troppo alto: controlla quello che hai scritto.");return;}
  if(vuoleSpesa&&!des){rimetti();toast("Scrivi per cosa hai speso.");return;}

  if(!righe.length&&!materiali&&!note&&!vuoleSpesa){
    rimetti();toast("Non c’è niente da salvare: metti almeno le ore di qualcuno.");return;
  }

  /* un rapportino solo, come quello grande: le ore ci si appendono sotto */
  const rid=await rvNuovoRapportino({materiali:materiali||null,note:note||null});
  if(!rid){rimetti();return;}

  const oggi=ymd(new Date());
  let oreScritte=0, oreFallite=[];
  for(const r of righe){
    const {data,error}=await sb.from("gest_ore").insert({
      user_id:MIO.impresaId, mestiere_id:(RV.lavoro.mestiere_id||null),
      lavoro_id:RV.lavoro.id, operatore_id:r.op,
      data:oggi, ore:r.ore, rapportino_id:rid
    }).select("id");
    if(error||!data||!data.length){
      const p=(SQUADRA||[]).find(x=>String(x.id)===String(r.op));
      oreFallite.push((p&&p.nome)||"qualcuno");
    }else oreScritte++;
  }

  let spesaOk=null;
  if(vuoleSpesa){
    const {data,error}=await sb.from("gest_spese").insert({
      user_id:MIO.impresaId, lavoro_id:RV.lavoro.id,
      descrizione:des, importo:imp, inserito_da:MIO.nome,
      /* ⛔ 5 set 2026 — LA FIRMA. `inserito_da` e' solo un nome scritto a mano:
         non vale come firma. `creato_da` punta alla riga di gest_operatori ed
         e' quello su cui girano le regole del database. Senza, dal 5 settembre
         la spesa NON viene scritta (regola gest_spese_team_insert). */
      creato_da:MIO.operatoreId
    }).select("id");
    spesaOk=!(error||!data||!data.length);
  }

  /* ⚠️ Si dice "salvato" SOLO di quello che e' stato scritto davvero.
     Un permesso che blocca non da' errore: senza questo conto l'app direbbe
     "tutto a posto" con il database vuoto. */
  if(oreFallite.length||spesaOk===false){
    rimetti();
    let m="Salvato solo in parte.";
    if(oreFallite.length)m+=" Ore non scritte: "+oreFallite.join(", ")+".";
    if(spesaOk===false)m+=" La spesa non è entrata.";
    toast(m+" Dillo al capo.");
    return;
  }

  rvChiudi();
  const pezzi=[];
  if(oreScritte)pezzi.push(oreScritte===1?"1 persona":oreScritte+" persone");
  if(materiali)pezzi.push("materiali");
  if(note)pezzi.push("note");
  if(spesaOk)pezzi.push("spesa");
  toast("Rapportino salvato ✔ "+(pezzi.length?"("+pezzi.join(", ")+")":""));
}

/* crea il rapportino e restituisce il suo id, oppure null. Stessa strada del
   rapportino grande: .select("id") perche' un permesso che blocca NON da'
   errore, torna riuscito a vuoto. */
async function rvNuovoRapportino(campi){
  const {data,error}=await sb.from("gest_rapportini").insert(Object.assign({
    user_id:MIO.impresaId,
    mestiere_id:(RV.lavoro&&RV.lavoro.mestiere_id)||null,
    lavoro_id:RV.lavoro.id,
    creato_da:MIO.operatoreId,
    data:ymd(new Date())
  },campi)).select("id");
  if(error||!data||!data.length){
    toast("Non salvato: "+((error&&error.message)||"il database non ha scritto niente"));
    return null;
  }
  return data[0].id;
}

async function rvSalva(){
  if(!RV.lavoro){toast("Scegli il lavoro");return;}
  const b=$("#rv-ok"); if(b){b.disabled=true;b.textContent="Salvo\u2026";}
  const rimetti=()=>{ if(b){b.disabled=false;b.textContent="Conferma";} };

  if(RV.tipo==="ore"){
    if(!chiedoPermesso("rapportini","di segnare le ore")){rimetti();return;}
    const rid=await rvNuovoRapportino({});
    if(!rid){rimetti();return;}
    const {data,error}=await sb.from("gest_ore").insert({
      user_id:MIO.impresaId, mestiere_id:(RV.lavoro.mestiere_id||null),
      lavoro_id:RV.lavoro.id, operatore_id:MIO.operatoreId,
      data:ymd(new Date()), ore:RV.ore, rapportino_id:rid
    }).select("id");
    if(error||!data||!data.length){
      rimetti();
      toast("Rapportino salvato, ma le ore NO: "+((error&&error.message)||"il database non ha scritto niente")+" \u2014 dillo al capo");
      return;
    }
    rimetti(); rvChiudi(); toast(String(RV.ore).replace(".",",")+" ore segnate \u2714");
    return;
  }

  if(RV.tipo==="materiale"||RV.tipo==="nota"){
    if(!chiedoPermesso("rapportini","di scrivere il rapportino")){rimetti();return;}
    const txt=(($("#rv-testo")||{}).value||"").trim();
    if(!txt){toast("Scrivi qualcosa, poi conferma");rimetti();return;}
    const rid=await rvNuovoRapportino(RV.tipo==="materiale"?{materiali:txt}:{note:txt});
    if(!rid){rimetti();return;}
    rimetti(); rvChiudi(); toast(RV.tipo==="materiale"?"Materiale segnato \u2714":"Nota segnata \u2714");
    return;
  }

  if(RV.tipo==="spesa"){
    if(!chiedoPermesso("pagamenti","di registrare le spese")){rimetti();return;}
    const imp=_numIt(($("#rv-imp")||{}).value||"");
    const txt=(($("#rv-testo")||{}).value||"").trim();
    if(!(imp>0)){toast("Scrivi quanto hai speso, per esempio 24,50");rimetti();return;}
    if(imp>1000000){toast("Importo troppo alto: controlla quello che hai scritto");rimetti();return;}
    if(!txt){toast("Scrivi per cosa hai speso");rimetti();return;}
    const {data,error}=await sb.from("gest_spese").insert({
      user_id:MIO.impresaId, lavoro_id:RV.lavoro.id,
      descrizione:txt, importo:imp, inserito_da:MIO.nome,
      creato_da:MIO.operatoreId /* la firma: vedi l'altro insert qui sopra */
    }).select("id");
    if(error||!data||!data.length){
      rimetti();
      toast("Non salvata: "+((error&&error.message)||"il database non ha scritto niente"));
      return;
    }
    rimetti(); rvChiudi(); toast("Spesa segnata \u2714");
    return;
  }
  rimetti();
}

/* ===================================================================
   RAPPORTINO DI CANTIERE — 15 agosto 2026
   Le ore finiscono in gest_ore, dove sono sempre state: da li' il pannello
   del titolare calcola gia' il margine di ogni lavoro. Non c'e' una seconda
   tabella delle ore, se no prima o poi i due numeri litigano.
   =================================================================== */
let SQUADRA=null;          /* null = non ancora letta. [] = letta e vuota. */
let RAP_ORE={};            /* id operatore -> ore scelte con i pulsanti */

async function caricaSquadra(){
  if(!puo("rapportini")){SQUADRA=[];return;}
  /* ⚠️ 5 set 2026: `gest_squadra_nomi` sembra vuota se la si guarda da
     amministratore (→0← righe) — ma NON e' roba morta. E' una VISTA che
     filtra su `auth.uid()`: chi la interroga senza essere loggato non vede
     niente per costruzione. Serve, ed e' usata qui sotto.
     gest_squadra_nomi e' una VISTA con dentro solo id, reparto e nome.
     Il costo orario e i documenti dei colleghi non escono da li'. */
  const {data,error}=await sb.from("gest_squadra_nomi")
    .select("id,nome,mestiere_id").eq("user_id",MIO.impresaId).order("nome");
  if(error){SQUADRA=[];console.warn("[rapportino] squadra non letta:",error.message);return;}
  SQUADRA=data||[];
}

function rapScrivi(op){
  const cella=document.getElementById("ore-"+op);
  if(!cella)return;
  const v=+RAP_ORE[op]||0;
  cella.textContent=(v===0)?"0":String(v).replace(".",",");
  cella.classList.toggle("zero",v===0);
  const tot=Object.keys(RAP_ORE).reduce((s,k)=>s+(+RAP_ORE[k]||0),0);
  const box=$("#rap-tot");
  if(box)box.textContent=tot>0?("In tutto: "+String(tot).replace(".",",")+(tot===1?" ora":" ore")):"";
  opGuardaRapportino();
}

/* ============================================================
   IL CONTROLLORE SUL TELEFONO — 19 agosto 2026

   Nel pannello del capo il controllore guarda i documenti che partono
   al cliente. Qui i moduli sono due — il rapportino e la spesa con la
   carta — e il danno e' un altro: non un documento brutto, ma un
   NUMERO SBAGLIATO che entra nel margine del lavoro e non lo vede
   piu' nessuno.

   ⚠️ SEGNA E BASTA, come di la'. Non spegne nessun pulsante, non
      cambia niente da solo, e quello che c'era prima (le ore
      obbligatorie, l'importo obbligatorio) e' rimasto com'era.
   ⚠️ QUI E' SEMPRE «DA GUARDARE», MAI «DA CORREGGERE». Le cose che
      fermano davvero il salvataggio le fermava gia' il codice di
      prima: se qui ci fosse anche del rosso, sarebbe rosso per cose
      che si possono salvare lo stesso.
   ⚠️ E' una SECONDA MACCHINA, non una seconda copia delle regole: le
      quattro regole di qui non esistono di la', e viceversa. Il
      giorno che i due pannelli dovessero condividerle davvero, si
      tira fuori un js/controllore.js — ma non oggi, che il pannello
      del capo funziona.
   ============================================================ */
const OP_ORE_TANTE=12;
/* i soldi finiti dove non vanno: il simbolo, la parola, oppure un
   numero con DUE decimali (8,50). «1,5 m di tubo» ha un decimale solo
   e non fa scattare niente: se no ogni misura diventerebbe un avviso. */
const OP_SOLDI=/€|\beuro\b|\d+[.,]\d{2}(?!\d)/i;

function opAvvTogli(el){
  if(!el)return;
  const d=el.nextElementSibling;
  if(d&&d.classList&&d.classList.contains("op-avv"))d.remove();
  if(el.classList)el.classList.remove("op-storto");
}
function opAvvMetti(el,testo){
  if(!el)return;
  opAvvTogli(el);
  if(el.classList)el.classList.add("op-storto");
  const d=document.createElement("div");
  d.className="op-avv";
  const m=document.createElement("span");
  m.className="op-avv-mk"; m.textContent="DA GUARDARE";
  const t=document.createElement("span");
  t.className="op-avv-t"; t.textContent=testo;      /* testo, mai HTML */
  d.appendChild(m); d.appendChild(t);
  el.parentNode.insertBefore(d,el.nextSibling);
}
function opGuardaRapportino(){
  const mat=document.getElementById("rap-materiali");
  if(mat){
    if(OP_SOLDI.test(mat.value||""))
      opAvvMetti(mat,"Qui dentro ci sono dei prezzi. Scrivi solo le cose: quanto sono costate lo sa già il gestionale dalle spese e dalle fatture, e scritte due volte contano doppio.");
    else opAvvTogli(mat);
  }
  const tot=document.getElementById("rap-tot");
  if(!tot)return;
  const chiavi=Object.keys(RAP_ORE||{});
  const ore=chiavi.reduce((s,k)=>s+(+RAP_ORE[k]||0),0);
  const troppe=chiavi.filter(k=>(+RAP_ORE[k]||0)>OP_ORE_TANTE);
  if(troppe.length){
    const chi=((SQUADRA||[]).find(p=>String(p.id)===String(troppe[0]))||{}).nome||"Qualcuno";
    opAvvMetti(tot,chi+" ha "+_oreTxt(RAP_ORE[troppe[0]])+" in un giorno solo: di solito è il dito rimasto sul «+».");
  }else if(!ore){
    opAvvMetti(tot,"Non hai messo le ore a nessuno: la manodopera di oggi su questo lavoro resta a zero, e il margine del cantiere esce più alto del vero.");
  }else opAvvTogli(tot);
}
function opGuardaCarta(){
  const cau=document.getElementById("carta-causale");
  if(!cau)return;
  const imp=document.getElementById("carta-imp");
  const scritto=!!(imp&&String(imp.value||"").trim());
  if(scritto&&!String(cau.value||"").trim())
    opAvvMetti(cau,"Senza «per cosa» il capo si ritrova un importo e basta — e fra un mese non te lo ricordi nemmeno tu.");
  else opAvvTogli(cau);
}
/* si guarda quando ESCI da una casella, mai mentre batti: un segno che
   si accende sotto le dita e' un fastidio, non un aiuto */
(function opAscolta(){
  const att=(id,fn)=>{ const e=document.getElementById(id); if(e)e.addEventListener("blur",fn); };
  att("rap-materiali",opGuardaRapportino);
  att("carta-causale",opGuardaCarta);
  att("carta-imp",opGuardaCarta);
})();

async function renderRapportino(){
  const box=$("#lv-rap-box");
  if(!box)return;
  const attivo=puo("rapportini");
  box.classList.toggle("hidden",!attivo);
  if(!attivo)return;

  $("#rap-data").textContent="Giornata di "+dataIt(ymd(new Date()));
  $("#rap-materiali").value="";
  $("#rap-note").value="";
  RAP_ORE={};

  if(SQUADRA===null)await caricaSquadra();

  /* solo la gente del reparto di questo lavoro: in un'impresa con piu' reparti
     un elenco con dentro tutti sarebbe lungo e pieno di gente che non c'entra */
  const mid=curLavoro&&curLavoro.mestiere_id;
  const gente=(SQUADRA||[]).filter(p=>!mid||!p.mestiere_id||String(p.mestiere_id)===String(mid));

  const cont=$("#rap-squadra");
  if(!gente.length){
    cont.innerHTML='<div class="rap-vuoto">Non riesco a leggere la squadra. Se sei appena stato aggiunto, chiudi e riapri l’app; se non passa, chiedi al capo il permesso «Rapportini».</div>';
    return;
  }
  cont.innerHTML=gente.map(p=>{
    RAP_ORE[p.id]=0;
    return '<div class="rap-riga" data-op="'+esc(p.id)+'">'
      +'<div class="rap-nome">'+esc(p.nome||"Senza nome")+'</div>'
      +'<button type="button" class="rap-pm" data-d="-0.5" aria-label="Togli mezz’ora a '+esc(p.nome||"")+'">−</button>'
      +'<div class="rap-ore zero" id="ore-'+esc(p.id)+'">0</div>'
      +'<button type="button" class="rap-pm" data-d="0.5" aria-label="Aggiungi mezz’ora a '+esc(p.nome||"")+'">+</button>'
      +'</div>';
  }).join("")+'<div class="rap-tot" id="rap-tot"></div>';

  renderMieiRapportini();
}

/* ============================================================
   I RAPPORTINI GIA' SCRITTI, E COME SI BUTTANO VIA — 15 agosto 2026

   Perche' serve qui e non solo nel pannello del capo: chi sbaglia il
   rapportino e' chi lo scrive, e se ne accorge sul momento (giorno sbagliato,
   salvato due volte, lavoro sbagliato). Aspettare che se ne accorga il
   titolare vuol dire tenersi in casa per giorni delle ore doppie che gonfiano
   la manodopera di quel cantiere.

   ⚠️ Si butta via con gest_rapportino_cestina, non con .delete():
   le ore di gest_ore il collaboratore NON le puo' toccare (e' giusto cosi',
   sono le paghe), quindi una cancellazione da qui lascerebbe il rapportino
   nel Cestino e le ore vive. La funzione del database le mette via tutte e
   due nello stesso istante.
   Si vedono SOLO i suoi: quelli dei colleghi non li puo' toccare, e un
   pulsante che non funziona e' peggio di un pulsante che non c'e'.
   ============================================================ */
function _oreTxt(n){
  const v=Math.round((+n||0)*100)/100;
  return String(v).replace(".",",")+" h";
}

async function renderMieiRapportini(){
  const box=document.getElementById("rap-vecchi");
  const lista=document.getElementById("rap-vecchi-list");
  if(!box||!lista)return;
  if(!sb||!curLavoro||!MIO.impresaId||!MIO.operatoreId){box.style.display="none";return;}

  const [r1,r2]=await Promise.all([
    sb.from("gest_rapportini").select("id,data,materiali,note")
      .eq("user_id",MIO.impresaId).eq("lavoro_id",curLavoro.id)
      .eq("creato_da",MIO.operatoreId)
      .order("data",{ascending:false}).limit(10),
    sb.from("gest_ore").select("ore,rapportino_id")
      .eq("user_id",MIO.impresaId).eq("lavoro_id",curLavoro.id)
  ]);

  /* se la lettura non riesce si sparisce in silenzio: e' un riquadro in piu',
     non deve rompere la schermata su cui si scrive il rapportino */
  if(r1.error||!r1.data||!r1.data.length){box.style.display="none";return;}

  const perRap={};
  if(!r2.error)(r2.data||[]).forEach(o=>{
    const k=String(o.rapportino_id||""); if(!k)return;
    perRap[k]=(perRap[k]||0)+(+o.ore||0);
  });

  box.style.display="";
  lista.innerHTML=r1.data.map(r=>{
    const pezzi=[];
    if(r.materiali)pezzi.push(esc(String(r.materiali).slice(0,60)));
    if(r.note)pezzi.push(esc(String(r.note).slice(0,60)));
    return '<div class="rap-v-riga">'
      +'<div class="rap-v-testo"><b>'+dataIt(r.data)+'</b>'
      +(pezzi.length?'<br>'+pezzi.join(" · "):"")+'</div>'
      +'<div class="rap-v-ore">'+(r2.error?"—":_oreTxt(perRap[String(r.id)]||0))+'</div>'
      +'<button type="button" class="rap-v-del" data-rap="'+esc(String(r.id))+'" '
      +'aria-label="Butta via il rapportino del '+dataIt(r.data)+'">&times;</button>'
      +'</div>';
  }).join("");
}

async function rapButtaVia(id,bottone){
  if(!id||!sb)return;
  if(bottone)bottone.disabled=true;
  try{
    const prova=await sb.rpc("gest_rapportino_cestina",{p_id:id,p_conferma:false});
    if(prova.error){
      const m=(prova.error.code||"")+" "+(prova.error.message||"");
      if(/PGRST202|Could not find the function|schema cache/i.test(m)){
        alert("Non ho buttato via niente.\n\nQuesta cosa non è ancora accesa sul server: "
             +"dillo al tuo capo, deve lanciare sql/gest-rapportini-cestino.sql su Supabase.");
        return;
      }
      toast("Errore: "+(prova.error.message||"il database non risponde"));
      return;
    }
    const p=prova.data||{};
    if(!p.ok){
      if(p.motivo==="gia"){toast("Era già nel cestino.");}
      else if(p.motivo==="permesso"){toast("Questo rapportino non lo puoi buttare via: non l'hai scritto tu.");}
      else{toast("Non l'ho trovato.");}
      await renderMieiRapportini();
      return;
    }

    const righe=+p.righe_ore||0, ore=+p.ore||0;
    let msg="Butti via il rapportino del "+dataIt(p.data)+"?\n\n";
    msg+= righe
      ? ("Vanno via anche le ore che ci hai messo: "+righe+(righe===1?" riga":" righe")
         +", "+_oreTxt(ore)+" in tutto.\n\n")
      : "Non ci sono ore attaccate.\n\n";
    msg+="Finisce nel Cestino: il tuo capo può rimetterlo a posto dal gestionale.";
    if(!confirm(msg))return;

    const fatto=await sb.rpc("gest_rapportino_cestina",{p_id:id,p_conferma:true});
    if(fatto.error){toast("Non buttato via: "+(fatto.error.message||"errore"));return;}
    const f=fatto.data||{};
    if(!f.ok||!f.fatto){
      toast(f.motivo==="gia"?"Era già nel cestino.":"Non buttato via: riprova.");
    }else{
      toast(righe?("Buttato via, con "+_oreTxt(ore)):"Buttato via");
    }
    await renderMieiRapportini();
  }finally{
    if(bottone)bottone.disabled=false;
  }
}

/* un ascolto solo sul contenitore: le righe si rifanno a ogni apertura */
document.getElementById("rap-vecchi-list").addEventListener("click",e=>{
  const b=e.target.closest(".rap-v-del"); if(!b)return;
  rapButtaVia(b.dataset.rap,b);
});

/* i pulsanti si ascoltano una volta sola, sul contenitore: le righe vengono
   rifatte a ogni apertura, e agganciare l'ascolto a ognuna le lascerebbe
   attaccate tutte quelle di prima */
$("#rap-squadra").addEventListener("click",e=>{
  const b=e.target.closest(".rap-pm"); if(!b)return;
  const riga=b.closest(".rap-riga"); if(!riga)return;
  const op=riga.dataset.op;
  let v=(+RAP_ORE[op]||0)+(parseFloat(b.dataset.d)||0);
  if(v<0)v=0;
  if(v>24)v=24;               /* piu' di 24 ore in un giorno non esistono */
  RAP_ORE[op]=Math.round(v*2)/2;
  rapScrivi(op);
});

$("#btn-rap-salva").onclick=async()=>{
  if(!curLavoro)return;
  if(!chiedoPermesso("rapportini","di scrivere il rapportino"))return;

  const righe=Object.keys(RAP_ORE).filter(k=>(+RAP_ORE[k])>0).map(k=>({op:k,ore:+RAP_ORE[k]}));
  const materiali=($("#rap-materiali").value||"").trim();
  const note=($("#rap-note").value||"").trim();
  if(!righe.length&&!materiali&&!note){toast("Metti almeno le ore di qualcuno.");return;}

  const b=$("#btn-rap-salva"), testo=b.textContent;
  b.disabled=true;b.textContent="Salvo…";
  const oggi=ymd(new Date());

  /* .select("id") NON e' un vezzo: una scrittura fermata dai permessi NON da'
     errore, torna riuscita a vuoto. Senza questo controllo l'app direbbe
     "Salvato" e nel database non ci sarebbe niente. */
  const {data:rap,error:e1}=await sb.from("gest_rapportini").insert({
    user_id:MIO.impresaId,
    mestiere_id:(curLavoro.mestiere_id||null),
    lavoro_id:curLavoro.id,
    creato_da:MIO.operatoreId,
    data:oggi,
    materiali:materiali||null,
    note:note||null
  }).select("id");

  if(e1||!rap||!rap.length){
    b.disabled=false;b.textContent=testo;
    toast("Non salvato: "+((e1&&e1.message)||"il database non ha scritto niente"));
    return;
  }
  const rid=rap[0].id;

  if(righe.length){
    const {data:ore,error:e2}=await sb.from("gest_ore").insert(righe.map(r=>({
      user_id:MIO.impresaId,
      mestiere_id:(curLavoro.mestiere_id||null),
      lavoro_id:curLavoro.id,
      operatore_id:r.op,
      data:oggi,
      ore:r.ore,
      rapportino_id:rid
    }))).select("id");
    /* se le ore non entrano tutte lo dico, invece di far finta: sono loro che
       tengono in piedi il margine del lavoro */
    if(e2||!ore||ore.length!==righe.length){
      b.disabled=false;b.textContent=testo;
      toast("Rapportino salvato, ma le ore NO: "+((e2&&e2.message)||("scritte "+((ore&&ore.length)||0)+" su "+righe.length))+" — dillo al capo");
      return;
    }
  }

  b.disabled=false;b.textContent=testo;
  await renderRapportino();
  toast("Rapportino salvato ✔");
};

/* ============================================================
   ⛔ 22 agosto 2026 — «SALVATO ✔» CHE NON ERA SALVATO
   ============================================================
   Quando la regola del database rifiuta la riga, PostgREST NON risponde
   con un errore: risponde "va bene, ho cambiato zero righe". Qui sotto si
   guardava solo l'errore, quindi il collaboratore leggeva
   «Segnato come fatto ✔», tornava a casa convinto, e nel gestionale del
   titolare il lavoro restava aperto. Nessuno dei due lo sapeva.

   ⚠️ E la pagina non puo' saperlo da sola: il pulsante delle note chiede il
   permesso «note», ma la riga che scrive sta in gest_lavori, che il database
   protegge col permesso «lavori». Due parole diverse per la stessa cosa: il
   controllo della pagina NON e' il controllo del database.
   (Oggi chi non ha «lavori» non arriva nemmeno ad aprire un lavoro, quindi a
   schermo quel caso non si vede — controllato. Ma la risposta del database
   resta l'unica che conta, e va guardata.)

   Adesso si chiede indietro la riga scritta (.select("id")): se non torna
   niente, non e' stato scritto niente, e si dice.
   ⚠️ Questo funziona perche' chi puo' MODIFICARE un lavoro puo' anche
   LEGGERLO (lavori_update vuole il permesso «lavori», lavori_read si
   accontenta di «lavori» oppure «fatture»): se un giorno quelle due regole
   cambiassero, un salvataggio riuscito potrebbe tornare vuoto e questa
   scritta direbbe una bugia al contrario.
   ============================================================ */
const NIENTE_PERMESSO="Non l'ho segnato: il capo non ti ha dato il permesso sui Lavori. Chiediglielo e riprova.";
async function scriviLavoro(patch){
  const r=await sb.from("gest_lavori").update(patch).eq("id",curLavoro.id).select("id");
  if(r&&r.error)return {ok:false,msg:"Non salvato: "+(r.error.message||"errore")};
  if(!r||!r.data||!r.data.length)return {ok:false,msg:NIENTE_PERMESSO};
  return {ok:true};
}

/* salva note */
$("#btn-salva").onclick=async()=>{
  if(!curLavoro)return;
  if(!chiedoPermesso("note","di scrivere le note"))return;
  const txt=$("#lv-note").value;
  $("#btn-salva").disabled=true;
  const r=await scriviLavoro({lavoro_svolto:txt});
  $("#btn-salva").disabled=false;
  if(!r.ok){toast(r.msg);return;}
  curLavoro.lavoro_svolto=txt;const l=LAVORI.find(x=>x.id===curLavoro.id);if(l)l.lavoro_svolto=txt;
  toast("Salvato ✔");
};

/* segna fatto */
$("#btn-fatto").onclick=async()=>{
  if(!curLavoro)return;
  $("#btn-fatto").disabled=true;
  const r=await scriviLavoro({stato:"fatto",data_fatto:ymd(new Date())});
  $("#btn-fatto").disabled=false;
  if(!r.ok){toast(r.msg);return;}
  curLavoro.stato="fatto";const l=LAVORI.find(x=>x.id===curLavoro.id);if(l){l.stato="fatto";l.data_fatto=ymd(new Date());}
  toast("Segnato come fatto ✔");
  openLavoro(curLavoro.id);
};

/* esci */
$("#btn-esci").onclick=async()=>{await sb.auth.signOut();gate("Sei uscito. Per rientrare apri il tuo link di invito.");};
$("#nav-agenda").onclick=()=>{renderCal();renderDay();show("agenda");};
$("#nav-clienti").onclick=async()=>{await loadClienti();show("clienti");};
$("#nav-scadenze").onclick=async()=>{await loadScadenze();show("scadenze");};
$("#nav-fatture").onclick=async()=>{await loadFatture();show("fatture");};
$("#fatt-pdf-file").onchange=e=>{uploadFatturaPdf(e.target.files[0]);e.target.value="";};

/* ============================================================
   ===== TIMBRATURA (6 settembre 2026) =====
   Perche' esiste: negli altri gestionali da cantiere (Fluida, Connecteam)
   l'operaio la mattina fa UNA cosa sola: preme «Entrata». Le ore poi si
   sommano da sole. Qui invece l'unico modo di segnare le ore era «Segna la
   giornata», che si compila a fine turno, a memoria, e infatti spesso non si
   compilava affatto.

   ⚠️ LA REGOLA DEL CANTIERE: SENZA CAMPO DEVE FUNZIONARE LO STESSO.
   In cantiere la rete non c'e' quasi mai (scale, seminterrati, campagna).
   Quindi la timbratura NON aspetta il database: si scrive subito sul
   telefono (localStorage), si vede subito sullo schermo, e parte da sola
   appena torna la rete. L'operaio puo' chiudere l'app: la coda resta.

   ⚠️ PERCHE' C'E' client_id: e' un codice che genera IL TELEFONO, non il
   database. Se la spedizione va a meta' (rete che va e viene) il telefono
   riprova con lo STESSO codice, e Postgres — che ha un indice unico su
   (user_id, client_id) — risponde 23505 «esiste gia'». Quel 23505 per noi
   NON e' un errore: vuol dire «era gia' arrivata», e la togliamo dalla coda.
   Senza questo, una timbratura riprovata →3← volte diventava →3← entrate.

   ⚠️ COSA NON FA: non scrive NIENTE dentro gest_ore. Se lo facesse, le ore
   della timbratura si sommerebbero a quelle scritte a mano in «Segna la
   giornata» e la busta paga verrebbe doppia. La timbratura per adesso e' un
   registro a parte, che si guarda; il travaso nelle ore, se lo vorremo, e'
   una decisione separata da prendere con calma.

   ⚠️ creato_da NON e' auth.uid(): le regole del database controllano
   `m.operatore_id = creato_da`, quindi ci va MIO.operatoreId. Con l'uid la
   riga verrebbe rifiutata e la coda non si svuoterebbe mai.
   ============================================================ */
const TMB_CODA_KEY = "tmb_coda_v1";
const TMB = { oggi: [], mandando: false, orologio: null };

function tmbCodice(){
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}
function tmbCodaLeggi(){
  try{ const a = JSON.parse(localStorage.getItem(TMB_CODA_KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch(e){ return []; }
}
function tmbCodaScrivi(a){
  try{ localStorage.setItem(TMB_CODA_KEY, JSON.stringify(a)); }catch(e){}
}
function tmbOraHM(iso){
  const d = new Date(iso);
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}
function tmbDurata(ms){
  if(ms < 0) ms = 0;
  const m = Math.floor(ms/60000);
  return Math.floor(m/60) + "h " + String(m%60).padStart(2,"0") + "m";
}

/* le timbrature di OGGI gia' arrivate al database */
async function tmbCaricaOggi(){
  if(!sb || !MIO.impresaId || !MIO.operatoreId){ TMB.oggi = []; return; }
  const g = ymd(new Date());
  const r = await sb.from("gest_timbrature")
    .select("id,tipo,quando,ora_telefono,client_id,lavoro_id")
    .eq("user_id", MIO.impresaId)
    .eq("creato_da", MIO.operatoreId)
    .is("eliminato_il", null)
    .gte("quando", g + "T00:00:00")
    .lte("quando", g + "T23:59:59.999")
    .order("quando", { ascending: true });
  /* se la rete non c'e' NON si svuota quello che avevamo: si tiene l'ultimo
     elenco buono, se no la schermata si azzera proprio dove il campo manca */
  if(!r || r.error) return;
  TMB.oggi = r.data || [];
}

/* svuota la coda: una alla volta, in ordine, e si ferma al primo intoppo vero */
async function tmbManda(){
  if(TMB.mandando || !sb || !MIO.impresaId || !MIO.operatoreId) return;
  if(typeof navigator !== "undefined" && navigator.onLine === false) return;
  let coda = tmbCodaLeggi();
  if(!coda.length) return;
  TMB.mandando = true;
  try{
    while(coda.length){
      const t = coda[0];
      const r = await sb.from("gest_timbrature").insert({
        user_id:      MIO.impresaId,
        creato_da:    MIO.operatoreId,
        tipo:         t.tipo,
        quando:       t.quando,
        ora_telefono: t.quando,
        lavoro_id:    t.lavoro_id || null,
        client_id:    t.client_id
      });
      const err = r && r.error;
      /* 23505 = «questo client_id c'e' gia'»: era arrivata, e' fatta */
      const gia = err && (err.code === "23505" || /duplicate key/i.test(err.message || ""));
      if(err && !gia) break;          /* rete o permessi: si riprova dopo */
      coda.shift();
      tmbCodaScrivi(coda);
    }
  }finally{
    TMB.mandando = false;
  }
  await tmbCaricaOggi();
  tmbDisegna();
}

/* l'elenco di oggi = quelle del database + quelle ancora in coda */
function tmbTutte(){
  const arrivate = TMB.oggi.map(x => ({
    quando: x.ora_telefono || x.quando,
    tipo: x.tipo, client_id: x.client_id, attesa: false
  }));
  const visti = {};
  arrivate.forEach(x => { if(x.client_id) visti[x.client_id] = 1; });
  const g = ymd(new Date());
  const incoda = tmbCodaLeggi()
    .filter(x => !visti[x.client_id] && ymd(new Date(x.quando)) === g)
    .map(x => ({ quando: x.quando, tipo: x.tipo, client_id: x.client_id, attesa: true }));
  return arrivate.concat(incoda).sort((a,b) => new Date(a.quando) - new Date(b.quando));
}

/* le ore di oggi: si accoppiano entrata/uscita in ordine.
   Un'entrata ancora aperta conta fino ad adesso. */
function tmbTotaleMs(righe){
  let tot = 0, aperta = null;
  righe.forEach(r => {
    if(r.tipo === "entrata"){ if(aperta === null) aperta = new Date(r.quando).getTime(); }
    else if(aperta !== null){ tot += new Date(r.quando).getTime() - aperta; aperta = null; }
  });
  if(aperta !== null) tot += Date.now() - aperta;
  return tot;
}

function tmbDisegna(){
  const card = $("#tmb-card");
  if(!card || card.classList.contains("hidden")) return;
  const righe  = tmbTutte();
  const coda   = tmbCodaLeggi();
  const ultima = righe.length ? righe[righe.length-1] : null;
  const dentro = !!(ultima && ultima.tipo === "entrata");

  /* la striscia arancione della coda */
  const cd = $("#tmb-coda");
  if(coda.length){
    cd.classList.remove("hidden");
    const una = coda.length === 1;
    $("#tmb-coda-n").textContent = una ? "1 timbratura da mandare"
                                       : coda.length + " timbrature da mandare";
    /* singolare/plurale: «Parte da sola» con →2← in coda faceva sembrare che
       ne partisse una sola e le altre restassero indietro */
    $("#tmb-coda-t").textContent = "Nessun campo. "
      + (una ? "Parte da sola" : "Partono da sole")
      + " appena torna la rete: puoi chiudere l'app.";
  }else cd.classList.add("hidden");

  /* la striscia verde «sei entrato» */
  const st = $("#tmb-stato");
  if(dentro){
    st.classList.remove("hidden");
    $("#tmb-stato-t").textContent = "Sei entrato alle " + tmbOraHM(ultima.quando);
    $("#tmb-stato-s").textContent = ultima.attesa ? "segnata sul telefono" : "";
    $("#tmb-ore").textContent = tmbDurata(tmbTotaleMs(righe));
  }else st.classList.add("hidden");

  $("#tmb-vuoto").classList.toggle("hidden", righe.length > 0);

  /* il pulsante grosso */
  const b = $("#tmb-btn");
  b.classList.toggle("esci",  dentro);
  b.classList.toggle("entra", !dentro);
  const adesso = tmbOraHM(new Date().toISOString());
  b.innerHTML = (dentro ? "⏹️ Uscita" : "▶️ Entrata")
    + '<small id="tmb-btn-sub">' + (righe.length ? "sono le " + adesso : "segna adesso, ore " + adesso) + "</small>";

  /* l'elenco della giornata */
  const box = $("#tmb-lista");
  if(!righe.length){ box.innerHTML = ""; return; }
  box.innerHTML = righe.map(r =>
    '<div class="tmb-riga' + (r.attesa ? " attesa" : "") + '">'
    + '<span class="ic ' + (r.tipo === "entrata" ? "e" : "u") + '">'
    + (r.tipo === "entrata" ? "▶️" : "⏹️") + "</span> "
    + (r.tipo === "entrata" ? "Entrata" : "Uscita")
    + (r.attesa
        ? " " + tmbOraHM(r.quando) + '<span class="att">⏳ da mandare</span>'
        : '<span class="h">' + tmbOraHM(r.quando) + "</span>")
    + "</div>"
  ).join("")
  + '<div class="tmb-tot"><span>Oggi</span><span>' + tmbDurata(tmbTotaleMs(righe)) + "</span></div>";
}

/* preme il pulsante: si scrive PRIMA sul telefono, poi si prova a mandarla */
function tmbTimbra(){
  if(!MIO.operatoreId) return;
  const righe  = tmbTutte();
  const ultima = righe.length ? righe[righe.length-1] : null;
  const tipo   = (ultima && ultima.tipo === "entrata") ? "uscita" : "entrata";
  /* se oggi c'e' UN SOLO lavoro, la timbratura si attacca a quello: se sono
     due o piu' non si indovina, resta senza cantiere (la riga vale lo stesso) */
  let lav = null;
  try{
    const g = ymd(new Date());
    const doggi = (LAVORI || []).filter(l => String(l.data_prevista || l.data || "").slice(0,10) === g);
    if(doggi.length === 1) lav = doggi[0].id;
  }catch(e){}
  const coda = tmbCodaLeggi();
  coda.push({ client_id: tmbCodice(), tipo: tipo, quando: new Date().toISOString(), lavoro_id: lav });
  tmbCodaScrivi(coda);
  tmbDisegna();                                   /* si vede SUBITO, senza rete */
  toast(tipo === "entrata" ? "Entrata segnata ✔" : "Uscita segnata ✔");
  tmbManda();
}

async function tmbAvvia(){
  const card = $("#tmb-card");
  if(!card || card.classList.contains("hidden")) return;
  const b = $("#tmb-btn");
  if(b && !b.dataset.tmbLegato){ b.dataset.tmbLegato = "1"; b.onclick = tmbTimbra; }
  await tmbCaricaOggi();
  await tmbManda();
  tmbDisegna();
  /* l'orologio della striscia verde: le ore salgono da sole, senza ricaricare */
  if(TMB.orologio) clearInterval(TMB.orologio);
  TMB.orologio = setInterval(tmbDisegna, 30000);
}

/* appena torna la rete la coda parte da sola, anche se l'operaio non tocca niente */
window.addEventListener("online", () => { tmbManda(); });
document.addEventListener("visibilitychange", () => { if(!document.hidden) tmbManda(); });

/* ===== RESTYLING PRO: emoji dell'interfaccia → icone SVG ===== */
const _ICONS={
  "📍":'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  "👤":'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "📞":'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/>',
  "📄":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "📅":'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  "📝":'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  "💶":'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  "📷":'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  "📎":'<path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 1 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/>',
  "🔒":'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
};
const _EMO_KEYS=Object.keys(_ICONS).join("|");
const _EMO_RE=new RegExp("("+_EMO_KEYS+")️?","g");
const _EMO_TEST=new RegExp("("+_EMO_KEYS+")");
const _svgIcon=e=>'<svg class="emic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+_ICONS[e]+'</svg>';
let _icoObs=null;
function _iconizza(){
  if(_icoObs)_icoObs.disconnect();
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(t){
    if(!t.nodeValue||!_EMO_TEST.test(t.nodeValue))return NodeFilter.FILTER_REJECT;
    return t.parentElement&&t.parentElement.closest("textarea,script,style")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
  const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
  nodi.forEach(t=>{
    const span=document.createElement("span");
    span.innerHTML=t.nodeValue.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])).replace(_EMO_RE,(m,e)=>_svgIcon(e));
    t.parentNode.replaceChild(span,t);
  });
  _icoObs.observe(document.body,{childList:true,subtree:true,characterData:true});
}
_icoObs=new MutationObserver(()=>_iconizza());
_iconizza();

/* ===== avvio ===== */
if(!sb){
  /* niente libreria = niente app: si dice, e non si prova nemmeno a
     partire (se no il primo sb.auth spacca tutto un'altra volta) */
  gate("Non riesco a caricare l'app: la linea non basta. Spostati dove prende meglio e riapri la pagina.");
}else{
  sb.auth.getSession().then(({data})=>boot(data.session));
  sb.auth.onAuthStateChange((_e,s)=>setTimeout(()=>boot(s),0));
}
