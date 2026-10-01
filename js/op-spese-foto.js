// [SPOSTATO] op-spese-foto.js: era dentro op-core.js, righe 628-853, spostato identico.
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

