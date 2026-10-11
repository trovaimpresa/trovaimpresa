/* 11 ottobre 2026 — I PREVENTIVI DA CONTROLLARE (pagina dell'operaio)
   Il capo manda un preventivo (foto o PDF) e vuole che lo controlli. Prima finiva
   nella chat insieme a foto e indirizzi. Adesso ha la sua scheda:
   · ROSSO  = da controllare
   · VERDE  = controllato (con la tua nota)
   Tabella: gest_op_preventivi (sql/gest-op-preventivi.sql). File nel deposito
   gestionale-foto, cartella <impresa>/preventivi/.
   ⚠️ Il file parte dopo op-schede.js: usa MIO, sb, esc, toast, etic, preparaFileUpload
   della pagina solo a chiamata avvenuta, mai in cima. */
let OP_PREV=[];
let opPrevForm=false;      /* il modulo «Aggiungi» e' aperto? */
let opPrevApri=null;       /* id del preventivo di cui si sta scrivendo l'esito */
const OP_PREV_TAB="gest_op_preventivi";

function opPrevData(s){try{return new Date(s).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});}catch(_){return "";}}
function opPrevEuro(n){if(n==null||n==="")return "";const v=Number(n);if(isNaN(v))return "";return v.toLocaleString("it-IT",{style:"currency",currency:"EUR"});}
function opPrevFiles(p){let a=p.files;if(typeof a==="string"){try{a=JSON.parse(a);}catch(_){a=[];}}return Array.isArray(a)?a.filter(f=>f&&f.path):[];}

async function opPrevCarica(){
  if(!sb||!MIO||!MIO.impresaId){OP_PREV=[];return;}
  const {data,error}=await sb.from(OP_PREV_TAB).select("*").eq("user_id",MIO.impresaId).is("eliminato_il",null).order("created_at",{ascending:false});
  if(error){toast("Non riesco a leggere i preventivi: "+error.message);OP_PREV=[];return;}
  OP_PREV=data||[];
}
function opPrevBadge(){
  const n=OP_PREV.filter(p=>p.stato!=="controllato").length;
  const e=document.getElementById("op-n-prev");if(e)e.textContent=n?"("+n+")":"";
}
/* solo il numero rosso sul pulsante: una lettura leggera, usata da opRender */
async function opPrevConta(){
  try{
    if(!sb||!MIO||!MIO.impresaId)return;
    const {count}=await sb.from(OP_PREV_TAB).select("id",{count:"exact",head:true}).eq("user_id",MIO.impresaId).is("eliminato_il",null).eq("stato","da_controllare");
    const e=document.getElementById("op-n-prev");if(e)e.textContent=count?"("+count+")":"";
  }catch(_){}
}

function opPrevCard(p,urls){
  const ok=p.stato==="controllato";
  const fs=opPrevFiles(p);
  const imp=opPrevEuro(p.importo);
  const miniature=fs.length?'<div class="op-pfiles">'+fs.map((f,i)=>{
    const u=urls[f.path];
    if(f.tipo&&f.tipo.indexOf("image/")===0&&u)return '<a class="op-pth" href="'+u+'" target="_blank" rel="noopener"><img src="'+u+'" alt=""></a>';
    return '<a class="op-pdf" href="'+(u||"#")+'" target="_blank" rel="noopener">'+esc(f.nome||"File")+'</a>';
  }).join("")+'</div>':"";
  const esito=ok?('<div class="op-esito"><b>Il tuo controllo:</b> '+(p.esito_nota?esc(p.esito_nota):"nessuna nota")
      +'<small>'+esc(p.controllato_da||"")+(p.controllato_il?" · "+opPrevData(p.controllato_il):"")+'</small></div>'):"";
  const form=(!ok&&opPrevApri===p.id)
    ?'<div class="op-esform"><label class="op-lab" for="op-esito">Cosa hai trovato? (facoltativo)</label>'
      +'<textarea id="op-esito" rows="3" maxlength="500" placeholder="Es. Manca l\'IVA. Il totale non torna."></textarea>'
      +'<div class="op-btns"><button type="button" class="op-b p" data-prev="conferma" data-id="'+p.id+'">Conferma: controllato</button>'
      +'<button type="button" class="op-b" data-prev="annulla">Annulla</button></div></div>'
    :'<div class="op-btns">'
      +(ok?'<button type="button" class="op-b" data-prev="riapri" data-id="'+p.id+'">Riporta da controllare</button>'
          :'<button type="button" class="op-b p" data-prev="controlla" data-id="'+p.id+'">Segna come controllato</button>')
      +'<button type="button" class="op-b op-bx" data-prev="elimina" data-id="'+p.id+'">Elimina</button></div>';
  return '<div class="op-card op-prev '+(ok?"v":"r")+'" data-id="'+p.id+'">'
    +'<div class="op-t">'+esc(p.titolo)+'</div>'
    +'<div class="op-dove">'+[imp,opPrevData(p.created_at),p.creato_da?("caricato da "+p.creato_da):""].filter(Boolean).map(esc).join(" · ")+'</div>'
    +(p.nota?'<div class="op-cosa">'+esc(p.nota)+'</div>':"")
    +miniature
    +'<span class="op-st '+(ok?"g":"r")+'">'+(ok?"CONTROLLATO":"DA CONTROLLARE")+'</span>'
    +esito+form+'</div>';
}
function opPrevModulo(){
  if(!opPrevForm)return '<button type="button" class="op-b p op-grande" data-prev="nuovo">+ Aggiungi preventivo</button>';
  return '<div class="op-pform"><div class="op-t">Nuovo preventivo</div>'
    +'<label class="op-lab" for="op-p-tit">Nome (cliente o lavoro)</label>'
    +'<input id="op-p-tit" maxlength="120" placeholder="Es. Rossi - bagno">'
    +'<label class="op-lab" for="op-p-imp">Importo (facoltativo)</label>'
    +'<input id="op-p-imp" inputmode="decimal" maxlength="20" placeholder="Es. 4500">'
    +'<label class="op-lab" for="op-p-nota">Nota del capo (facoltativo)</label>'
    +'<textarea id="op-p-nota" rows="3" maxlength="500" placeholder="Es. Controlla le misure"></textarea>'
    +'<label class="op-lab" for="op-p-file">Foto o PDF</label>'
    +'<input id="op-p-file" type="file" accept="image/*,application/pdf" multiple>'
    +'<div class="op-btns"><button type="button" class="op-b p" data-prev="salva" id="op-p-salva">Salva</button>'
    +'<button type="button" class="op-b" data-prev="chiudi">Annulla</button></div></div>';
}

async function opRenderPrev(){
  const box=document.getElementById("op-prev-lista");if(!box)return;
  const mod=document.getElementById("op-prev-modulo");if(mod)mod.innerHTML=opPrevModulo();
  await opPrevCarica();opPrevBadge();
  const daFare=OP_PREV.filter(p=>p.stato!=="controllato"),fatti=OP_PREV.filter(p=>p.stato==="controllato");
  const sub=document.getElementById("op-prev-sub");
  if(sub)sub.textContent=daFare.length?(daFare.length+(daFare.length===1?" preventivo da controllare":" preventivi da controllare")):(fatti.length?"Tutto controllato":"");
  const paths=[...new Set(OP_PREV.flatMap(p=>opPrevFiles(p).map(f=>f.path)))];
  const urls={};
  if(paths.length){try{const {data}=await sb.storage.from("gestionale-foto").createSignedUrls(paths,3600);(data||[]).forEach(u=>{if(u&&u.path&&u.signedUrl)urls[u.path]=u.signedUrl;});}catch(_){}}
  box.innerHTML=(daFare.length?daFare.map(p=>opPrevCard(p,urls)).join(""):"")
    +(fatti.length?'<div class="op-flab">Controllati</div>'+fatti.map(p=>opPrevCard(p,urls)).join(""):"")
    +(!OP_PREV.length?'<div class="empty-state">Nessun preventivo. Premi il pulsante qui sopra per aggiungere il primo.</div>':"");
}

async function opPrevSalva(){
  if(!chiedoPermesso("lavori","di aggiungere preventivi"))return;
  const v=s=>{const e=document.querySelector(s);return e?String(e.value||"").trim():"";};
  const titolo=v("#op-p-tit");
  if(!titolo){toast("Scrivi il nome del preventivo");return;}
  let importo=null;const it=v("#op-p-imp");
  if(it){const n=Number(it.replace(/\./g,"").replace(",","."));if(isNaN(n)||n<0){toast("Non ho capito l'importo: scrivilo come 4500 oppure 4500,50");return;}importo=n;}
  const inp=document.getElementById("op-p-file"),files=inp&&inp.files?[...inp.files]:[];
  const btn=document.getElementById("op-p-salva");if(btn){btn.disabled=true;btn.textContent="Salvo…";}
  const fin=()=>{if(btn){btn.disabled=false;btn.textContent="Salva";}};
  const caricati=[];
  for(const file of files){
    const p=await preparaFileUpload(file);
    if(p.errore){toast(p.errore);for(const c of caricati)await _fileOrfano("gestionale-foto",c.path);fin();return;}
    const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=MIO.impresaId+"/preventivi/"+Date.now()+"_"+Math.floor(Math.random()*1000)+"_"+safe;
    const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
    if(up){toast("File non caricato: "+up.message);for(const c of caricati)await _fileOrfano("gestionale-foto",c.path);fin();return;}
    caricati.push({path:path,nome:p.nome,tipo:(p.file&&p.file.type)||file.type||""});
  }
  const {error}=await sb.from(OP_PREV_TAB).insert({user_id:MIO.impresaId,titolo:titolo.slice(0,120),importo:importo,nota:v("#op-p-nota").slice(0,500)||null,files:caricati,creato_da:MIO.nome||null});
  if(error){for(const c of caricati)await _fileOrfano("gestionale-foto",c.path);toast("Preventivo non salvato: "+error.message);fin();return;}
  opPrevForm=false;toast("Preventivo salvato ✔");await opRenderPrev();
}
async function opPrevScrivi(id,patch,ok){
  const {data,error}=await sb.from(OP_PREV_TAB).update(patch).eq("id",id).eq("user_id",MIO.impresaId).select("id");
  if(error){toast("Non salvato: "+error.message);return false;}
  if(!data||!data.length){toast("Non salvato: il capo non ti ha dato il permesso sui Lavori.");return false;}
  if(ok)toast(ok);return true;
}
function opPrevAzione(e){
  const b=e.target.closest&&e.target.closest("[data-prev]");if(!b)return;
  const a=b.getAttribute("data-prev"),id=b.getAttribute("data-id");
  if(a==="nuovo"){opPrevForm=true;opRenderPrev();}
  else if(a==="chiudi"){opPrevForm=false;opRenderPrev();}
  else if(a==="salva")opPrevSalva();
  else if(a==="controlla"){opPrevApri=id;opRenderPrev();}
  else if(a==="annulla"){opPrevApri=null;opRenderPrev();}
  else if(a==="conferma"){
    const t=document.getElementById("op-esito");
    opPrevScrivi(id,{stato:"controllato",esito_nota:t&&t.value.trim()?t.value.trim().slice(0,500):null,controllato_da:MIO.nome||null,controllato_il:new Date().toISOString()},"Segnato come controllato ✔")
      .then(ok=>{if(ok){opPrevApri=null;opRenderPrev();}});
  }
  else if(a==="riapri")opPrevScrivi(id,{stato:"da_controllare",esito_nota:null,controllato_da:null,controllato_il:null},"Riportato da controllare").then(ok=>{if(ok)opRenderPrev();});
  else if(a==="elimina"){
    if(b.dataset.sicuro!=="1"){b.dataset.sicuro="1";b.textContent="Sicuro? Premi ancora";return;}
    opPrevScrivi(id,{eliminato_il:new Date().toISOString()},"Eliminato").then(ok=>{if(ok)opRenderPrev();});
  }
}
document.addEventListener("click",opPrevAzione);
window.opRenderPrev=opRenderPrev;window.opPrevConta=opPrevConta;
