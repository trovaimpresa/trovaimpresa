/* 12 ottobre 2026 — I PREVENTIVI DA CONTROLLARE, DAL GESTIONALE (lato titolare)
   Stessa tabella della pagina dell'operaio (gest_op_preventivi, js/op-preventivi.js).
   Qui il titolare: li vede (rosso = da controllare, verde = controllato, con la nota
   dell'operaio), ne aggiunge, li riporta da controllare, li elimina.
   Porta: pulsante in cima alla Squadra (#gp-banner).
   ⚠️ Parte dopo la pagina ma usa sb, sbUid, esc, toast, openSheetGrande solo a chiamata avvenuta. */
const GP_TAB="gest_op_preventivi";
let GP=[];
let gpForm=false;

function gpData(s){try{return new Date(s).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});}catch(_){return "";}}
function gpEuro(n){if(n==null||n==="")return "";const v=Number(n);if(isNaN(v))return "";return v.toLocaleString("it-IT",{style:"currency",currency:"EUR"});}
function gpFiles(p){let a=p.files;if(typeof a==="string"){try{a=JSON.parse(a);}catch(_){a=[];}}return Array.isArray(a)?a.filter(f=>f&&f.path):[];}

async function gpCarica(){
  if(!sb||!sbUid){GP=[];return false;}
  const {data,error}=await sb.from(GP_TAB).select("*").eq("user_id",sbUid).is("eliminato_il",null).order("created_at",{ascending:false});
  if(error){toast("Non riesco a leggere i preventivi: "+error.message);GP=[];return false;}
  GP=data||[];return true;
}
async function gpBanner(){
  const b=document.getElementById("gp-banner");if(!b)return;
  if(!sb||!sbUid){b.innerHTML="";return;}
  try{
    const {data}=await sb.from(GP_TAB).select("id,stato").eq("user_id",sbUid).is("eliminato_il",null);
    const tot=(data||[]).length,da=(data||[]).filter(x=>x.stato!=="controllato").length;
    b.innerHTML='<button type="button" class="gp-ban'+(da?" r":"")+'" data-gp="apri">Preventivi da controllare'
      +(da?' <span class="gp-n">'+da+'</span>':(tot?' <span class="gp-ok">tutti controllati</span>':""))+'</button>';
  }catch(_){}
}
function gpCard(p,urls){
  const ok=p.stato==="controllato",fs=gpFiles(p),imp=gpEuro(p.importo);
  const mini=fs.length?'<div class="gp-fs">'+fs.map(f=>{
    const u=urls[f.path];
    if(f.tipo&&f.tipo.indexOf("image/")===0&&u)return '<a class="gp-th" href="'+u+'" target="_blank" rel="noopener"><img src="'+u+'" alt=""></a>';
    return '<a class="gp-pdf" href="'+(u||"#")+'" target="_blank" rel="noopener">'+esc(f.nome||"File")+'</a>';
  }).join("")+'</div>':"";
  const esito=ok?('<div class="gp-es"><b>Controllo:</b> '+(p.esito_nota?esc(p.esito_nota):"nessuna nota")
    +'<small>'+esc(p.controllato_da||"")+(p.controllato_il?" · "+gpData(p.controllato_il):"")+'</small></div>'):"";
  return '<div class="gp-card '+(ok?"v":"r")+'">'
    +'<div class="gp-t">'+esc(p.titolo)+'</div>'
    +'<div class="gp-d">'+[imp,gpData(p.created_at),p.creato_da?("caricato da "+p.creato_da):""].filter(Boolean).map(esc).join(" · ")+'</div>'
    +(p.nota?'<div class="gp-nota">'+esc(p.nota)+'</div>':"")
    +mini
    +'<span class="gp-st '+(ok?"g":"r")+'">'+(ok?"CONTROLLATO":"DA CONTROLLARE")+'</span>'+esito
    +'<div class="gp-btns">'+(ok?'<button type="button" class="gp-b" data-gp="riapri" data-id="'+p.id+'">Riporta da controllare</button>':"")
    +'<button type="button" class="gp-b gp-x" data-gp="elimina" data-id="'+p.id+'">Elimina</button></div></div>';
}
function gpModulo(){
  if(!gpForm)return '<button type="button" class="gp-b gp-p gp-grande" data-gp="nuovo">+ Aggiungi preventivo</button>';
  return '<div class="gp-form"><div class="gp-t">Nuovo preventivo</div>'
    +'<label for="gp-tit">Nome (cliente o lavoro)</label><input id="gp-tit" maxlength="120" placeholder="Es. Rossi - bagno">'
    +'<label for="gp-imp">Importo (facoltativo)</label><input id="gp-imp" inputmode="decimal" maxlength="20" placeholder="Es. 4500">'
    +'<label for="gp-nota">Nota per chi controlla (facoltativo)</label><textarea id="gp-nota" rows="3" maxlength="500" placeholder="Es. Controlla le misure"></textarea>'
    +'<label for="gp-file">Foto o PDF</label><input id="gp-file" type="file" accept="image/*,application/pdf" multiple>'
    +'<div class="gp-btns"><button type="button" class="gp-b gp-p" data-gp="salva" id="gp-salva">Salva</button>'
    +'<button type="button" class="gp-b" data-gp="chiudi">Annulla</button></div></div>';
}
async function gpDisegna(){
  const box=document.getElementById("gp-corpo");if(!box)return;
  await gpCarica();
  const da=GP.filter(p=>p.stato!=="controllato"),fa=GP.filter(p=>p.stato==="controllato");
  const paths=[...new Set(GP.flatMap(p=>gpFiles(p).map(f=>f.path)))],urls={};
  if(paths.length){try{const {data}=await sb.storage.from("gestionale-foto").createSignedUrls(paths,3600);(data||[]).forEach(u=>{if(u&&u.path&&u.signedUrl)urls[u.path]=u.signedUrl;});}catch(_){}}
  const box2=document.getElementById("gp-corpo");if(!box2)return;
  box2.innerHTML='<div id="gp-mod">'+gpModulo()+'</div>'
    +(da.length?da.map(p=>gpCard(p,urls)).join(""):"")
    +(fa.length?'<div class="gp-flab">Controllati</div>'+fa.map(p=>gpCard(p,urls)).join(""):"")
    +(!GP.length?'<div class="gp-vuoto">Nessun preventivo. Premi il pulsante per aggiungere il primo: chi lavora con te lo vede sul telefono e lo controlla.</div>':"");
  gpBanner();
}
function gpApri(){
  gpForm=false;
  openSheetGrande("Preventivi da controllare",'<div id="gp-corpo"><div class="gp-vuoto">Carico…</div></div>','<button class="btn b-cancel" data-action="close">Chiudi</button>');
  gpDisegna();
}
async function gpSalva(){
  const v=s=>{const e=document.querySelector(s);return e?String(e.value||"").trim():"";};
  const titolo=v("#gp-tit");
  if(!titolo){toast("Scrivi il nome del preventivo");return;}
  let importo=null;const it=v("#gp-imp");
  if(it){const n=Number(it.replace(/\./g,"").replace(",","."));if(isNaN(n)||n<0){toast("Non ho capito l'importo: scrivilo come 4500 oppure 4500,50");return;}importo=n;}
  const inp=document.getElementById("gp-file"),files=inp&&inp.files?[...inp.files]:[];
  const btn=document.getElementById("gp-salva");if(btn){btn.disabled=true;btn.textContent="Salvo…";}
  const fin=()=>{if(btn){btn.disabled=false;btn.textContent="Salva";}};
  const via=async(l)=>{for(const c of l){try{await sb.storage.from("gestionale-foto").remove([c.path]);}catch(_){}}};
  const caricati=[];
  for(const file of files){
    const p=await preparaFileUpload(file);
    if(p.errore){toast(p.errore);await via(caricati);fin();return;}
    const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=sbUid+"/preventivi/"+Date.now()+"_"+Math.floor(Math.random()*1000)+"_"+safe;
    const {error:up}=await sb.storage.from("gestionale-foto").upload(path,p.file);
    if(up){toast("File non caricato: "+up.message);await via(caricati);fin();return;}
    caricati.push({path:path,nome:p.nome,tipo:(p.file&&p.file.type)||file.type||""});
  }
  const {error}=await sb.from(GP_TAB).insert({user_id:sbUid,titolo:titolo.slice(0,120),importo:importo,nota:v("#gp-nota").slice(0,500)||null,files:caricati,creato_da:"Titolare"});
  if(error){await via(caricati);toast("Preventivo non salvato: "+error.message);fin();return;}
  gpForm=false;toast("Preventivo salvato");await gpDisegna();
}
async function gpScrivi(id,patch,ok){
  const {data,error}=await sb.from(GP_TAB).update(patch).eq("id",id).eq("user_id",sbUid).select("id");
  if(error||!data||!data.length){toast("Non salvato: "+(error?error.message:"riprova"));return false;}
  if(ok)toast(ok);return true;
}
document.addEventListener("click",function(e){
  const b=e.target.closest&&e.target.closest("[data-gp]");if(!b)return;
  const a=b.getAttribute("data-gp"),id=b.getAttribute("data-id");
  if(a==="apri")gpApri();
  else if(a==="nuovo"){gpForm=true;const m=document.getElementById("gp-mod");if(m)m.innerHTML=gpModulo();}
  else if(a==="chiudi"){gpForm=false;const m=document.getElementById("gp-mod");if(m)m.innerHTML=gpModulo();}
  else if(a==="salva")gpSalva();
  else if(a==="riapri")gpScrivi(id,{stato:"da_controllare",esito_nota:null,controllato_da:null,controllato_il:null},"Riportato da controllare").then(ok=>{if(ok)gpDisegna();});
  else if(a==="elimina"){
    if(b.dataset.sicuro!=="1"){b.dataset.sicuro="1";b.textContent="Sicuro? Premi ancora";return;}
    gpScrivi(id,{eliminato_il:new Date().toISOString()},"Eliminato").then(ok=>{if(ok)gpDisegna();});
  }
});

if(!document.getElementById("gp-stile")){
  const st=document.createElement("style");st.id="gp-stile";
  st.textContent=
    "#gp-banner{margin:0 0 14px}"
    +".gp-ban{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;box-sizing:border-box;font:inherit;font-size:19px;font-weight:800;color:#0a2a4d;background:#fff;border:2px solid #0a2a4d;border-radius:12px;padding:16px 18px;cursor:pointer;text-align:left}"
    +".gp-ban.r{border-color:#c62828;background:#fdecea;color:#7f1d1d}"
    +".gp-n{background:#c62828;color:#fff;border-radius:999px;min-width:30px;text-align:center;padding:2px 10px;font-size:18px}"
    +".gp-ok{font-size:16px;font-weight:700;color:#1c7a43}"
    +".gp-card{border:2px solid #0a2a4d;border-radius:12px;padding:14px;margin:12px 0;background:#fff}"
    +".gp-card.r{border-color:#c62828;background:#fff6f5}.gp-card.v{border-color:#1c7a43;background:#f2faf5}"
    +".gp-t{font-size:20px;font-weight:800;color:#0b1220}.gp-d{font-size:16px;color:#4b5563;margin-top:2px}"
    +".gp-nota{font-size:18px;margin-top:6px}"
    +".gp-fs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.gp-th img{display:block;width:96px;height:96px;object-fit:cover;border-radius:10px;border:1.5px solid #b9c3cf}"
    +".gp-pdf{display:inline-block;padding:12px 14px;border:1.5px solid #8fc3f0;border-radius:10px;background:#fff;color:#0a2a4d;font-weight:700;font-size:16px;word-break:break-all}"
    +".gp-st{display:inline-block;margin-top:10px;font-size:15px;font-weight:800;border-radius:8px;padding:4px 10px}"
    +".gp-st.r{background:#c62828;color:#fff}.gp-st.g{background:#1c7a43;color:#fff}"
    +".gp-es{margin-top:8px;font-size:18px}.gp-es small{display:block;color:#4b5563;font-size:15px}"
    +".gp-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}"
    +".gp-b{font:inherit;font-size:17px;font-weight:700;border:1.5px solid #7b8794;background:#fff;color:#0b1220;border-radius:10px;padding:11px 16px;cursor:pointer}"
    +".gp-b.gp-p{background:#0a2a4d;border-color:#0a2a4d;color:#fff}.gp-b.gp-x{color:#b42318;border-color:#e0a39d}.gp-grande{width:100%;font-size:19px;padding:15px}"
    +".gp-form{border:2px solid #0a2a4d;border-radius:12px;padding:14px;background:#fff}"
    +".gp-form label{display:block;font-size:17px;font-weight:700;margin:12px 0 4px}"
    +".gp-form input,.gp-form textarea{width:100%;box-sizing:border-box;font:inherit;font-size:18px;padding:10px;border:1.5px solid #9aa7b5;border-radius:10px}"
    +".gp-flab{font-size:17px;font-weight:800;color:#334155;margin:18px 0 0}"
    +".gp-vuoto{font-size:18px;color:#4b5563;padding:16px;text-align:center}";
  document.head.appendChild(st);
}
/* il numero sul pulsante: appena c'e' l'accesso, poi ogni minuto */
(function(){let n=0;const t=setInterval(function(){n++;if(typeof sbUid!=="undefined"&&sbUid&&typeof sb!=="undefined"&&sb){gpBanner();clearInterval(t);setInterval(gpBanner,60000);}else if(n>40)clearInterval(t);},1000);})();
