/* 11 ottobre 2026 — LE SCHEDE DELL'AGENDA: Lavori · Foto · Archivio
   Prima la prima schermata mischiava tutto: lavori di oggi, calendario, foto
   dentro ogni lavoro. Adesso ogni cosa ha la sua scheda e non si mischia.
   · Lavori   = quelli di adesso. ROSSO = da fare, VERDE = fatto (da poco).
   · Foto     = per cantiere, «Prima» (dal capo) e «Dopo» (le tue) separate.
   · Archivio = i lavori fatti da piu' di 7 giorni + il calendario di prima.
   ⚠️ Non tocca il database ne' i permessi: legge LAVORI (gia' caricato da
   loadLavori) e gest_foto. Il motore di prima (openLavoro, scriviLavoro,
   «Segna come fatto») resta quello. */
const OP_GIORNI_VERDE=7;
let opScheda="lavori";
const OP_MAPPA='<svg class="ti-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

function opFatto(l){const v=(l.stato||"").toLowerCase();return v.includes("fatt")||v.includes("complet");}
/* un lavoro fatto resta in «Lavori» per 7 giorni (cosi' vedi il verde), poi va in Archivio */
function opVecchio(l){
  if(!opFatto(l))return false;
  const d=l.data_fatto||l.data_prevista;
  if(!d)return true;
  const lim=new Date();lim.setDate(lim.getDate()-OP_GIORNI_VERDE);
  return d<ymd(lim);
}
/* il titolo e' il cliente; se non c'e', l'indirizzo; se manca anche quello, l'inizio della descrizione */
function opTitolo(l){
  const cl=CLIENTI[l.cliente_id];
  if(cl&&cl.nome)return cl.nome;
  if(l.dove)return l.dove;
  return l.descrizione?l.descrizione.slice(0,40):"Lavoro";
}
function opDove(l){const cl=CLIENTI[l.cliente_id];return l.dove||(cl&&cl.indirizzo)||"";}
function opMappaUrl(dove){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(dove);}

function opCard(l,conFoto){
  const fatto=opFatto(l), dove=opDove(l);
  const n=(conFoto&&conFoto[l.id])||0;
  const cosa=l.descrizione?`<div class="op-cosa">${esc(l.descrizione.length>140?l.descrizione.slice(0,140)+"…":l.descrizione)}</div>`:"";
  return `<div class="op-card ${fatto?"v":"r"}" data-id="${l.id}">
    <div class="op-t">${esc(opTitolo(l))}</div>
    ${dove&&opTitolo(l)!==dove?`<div class="op-dove">${esc(dove)}</div>`:""}
    ${cosa}
    <span class="op-st ${fatto?"g":"r"}">${fatto?"FATTO":"DA FARE"}</span>
    <div class="op-btns">
      ${dove?`<a class="op-b p" href="${opMappaUrl(dove)}" target="_blank" rel="noopener" data-mappa="1">${OP_MAPPA} Apri mappa</a>`:""}
      ${n?`<button type="button" class="op-b" data-foto="${l.id}">Foto (${n})</button>`:""}
    </div></div>`;
}
function opLegaCard(box){
  box.querySelectorAll(".op-card").forEach(c=>c.onclick=e=>{
    if(e.target.closest("[data-mappa]"))return;
    const f=e.target.closest("[data-foto]");
    if(f){opVaiScheda("foto");return;}
    openLavoro(c.dataset.id);
  });
}

async function opConta(){
  const ids=(LAVORI||[]).map(l=>l.id);
  if(!ids.length)return {};
  const {data}=await sb.from("gest_foto").select("lavoro_id").in("lavoro_id",ids).is("eliminato_il",null).neq("tipo","fattura");
  const m={};(data||[]).forEach(f=>{m[f.lavoro_id]=(m[f.lavoro_id]||0)+1;});
  return m;
}

function opVaiScheda(s){
  opScheda=s;
  document.querySelectorAll("#op-tabs [data-s]").forEach(b=>b.classList.toggle("on",b.dataset.s===s));
  ["lavori","foto","preventivi","archivio"].forEach(k=>{const p=document.getElementById("op-p-"+k);if(p)p.classList.toggle("hidden",k!==s);});
  if(s==="foto")opRenderFoto();
  if(s==="preventivi"&&window.opRenderPrev)opRenderPrev();
  if(s==="archivio"){renderCal();renderDay();opRenderArchivio();}
}

async function opRender(){
  const box=document.getElementById("op-lista");if(!box)return;
  const vivi=(LAVORI||[]).filter(l=>!opVecchio(l));
  /* rossi in cima, poi verdi; dentro ogni gruppo per data */
  vivi.sort((a,b)=>(opFatto(a)-opFatto(b))||String(a.data_prevista||"").localeCompare(String(b.data_prevista||"")));
  const nRossi=vivi.filter(l=>!opFatto(l)).length;
  const sub=document.getElementById("op-sub");
  if(sub)sub.textContent=vivi.length?(nRossi?(nRossi+(nRossi===1?" lavoro da fare":" lavori da fare")):"Tutto fatto"):"";
  box.innerHTML=vivi.length?vivi.map(l=>opCard(l,null)).join(""):'<div class="empty-state">'+etic("Nessun lavoro da fare.")+'</div>';
  opLegaCard(box);
  try{
    const m=await opConta();
    box.innerHTML=vivi.length?vivi.map(l=>opCard(l,m)).join(""):box.innerHTML;
    opLegaCard(box);
  }catch(_){}
  const arc=document.getElementById("op-n-arch");
  if(arc){const n=(LAVORI||[]).filter(opVecchio).length;arc.textContent=n?"("+n+")":"";}
  if(opScheda==="foto")opRenderFoto();
  if(opScheda==="preventivi"&&window.opRenderPrev)opRenderPrev();
  else if(window.opPrevConta)opPrevConta();
}

async function opRenderFoto(){
  const box=document.getElementById("op-foto-lista");if(!box)return;
  const vivi=(LAVORI||[]).filter(l=>!opVecchio(l));
  if(!vivi.length){box.innerHTML='<div class="empty-state">Nessuna foto.</div>';return;}
  box.innerHTML='<div class="empty-state">Carico le foto…</div>';
  const ids=vivi.map(l=>l.id);
  const {data}=await sb.from("gest_foto").select("lavoro_id,tipo,storage_path").in("lavoro_id",ids).is("eliminato_il",null).neq("tipo","fattura").order("created_at",{ascending:false});
  const per={};(data||[]).forEach(f=>{(per[f.lavoro_id]=per[f.lavoro_id]||[]).push(f);});
  const conFoto=vivi.filter(l=>per[l.id]);
  if(!conFoto.length){box.innerHTML='<div class="empty-state">Ancora nessuna foto. Le foto si aggiungono dentro il lavoro.</div>';return;}
  const paths=[...new Set((data||[]).map(f=>f.storage_path))];
  const {data:urls}=await sb.storage.from("gestionale-foto").createSignedUrls(paths,3600);
  const mappa={};(urls||[]).forEach(u=>{if(u&&u.path&&u.signedUrl)mappa[u.path]=u.signedUrl;});
  const grid=arr=>arr.length?'<div class="foto-grid">'+arr.map(f=>mappa[f.storage_path]?`<img src="${mappa[f.storage_path]}" alt="">`:"").join("")+'</div>':'<div class="op-nofoto">Nessuna</div>';
  box.innerHTML=conFoto.map(l=>{
    const prima=per[l.id].filter(f=>f.tipo==="da_fare"), dopo=per[l.id].filter(f=>f.tipo!=="da_fare");
    return `<div class="op-fblocco"><div class="op-t">${esc(opTitolo(l))}</div>
      <div class="op-flab">Prima</div>${grid(prima)}
      <div class="op-flab">Dopo</div>${grid(dopo)}
      <button type="button" class="op-b" data-apri="${l.id}" style="margin-top:10px;width:100%">Apri il lavoro</button></div>`;
  }).join("");
  box.querySelectorAll("[data-apri]").forEach(b=>b.onclick=()=>openLavoro(b.dataset.apri));
}

function opRenderArchivio(){
  const box=document.getElementById("op-arch-lista");if(!box)return;
  const v=(LAVORI||[]).filter(opVecchio).sort((a,b)=>String(b.data_fatto||b.data_prevista||"").localeCompare(String(a.data_fatto||a.data_prevista||"")));
  box.innerHTML=v.length?v.map(l=>opCard(l,null)).join(""):'<div class="empty-state">Nessun lavoro vecchio.</div>';
  opLegaCard(box);
}

document.querySelectorAll("#op-tabs [data-s]").forEach(b=>b.onclick=()=>opVaiScheda(b.dataset.s));
window.opRender=opRender;
