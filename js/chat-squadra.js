/* 11 ottobre 2026 — LA CHAT DELLA SQUADRA (titolare <-> operaio)
   Due tipi, stessa tabella `gest_messaggi` (sql/gest-messaggi.sql):
     · per LAVORO   -> chatMonta(el,{lavoroId:...})   i messaggi restano su quel lavoro
     · GENERALE     -> chatMonta(el,{})                una chat con UNA persona
   Lo usano due pagine: la pagina dell'operaio (lato "operaio") e il gestionale
   (lato "titolare"). Contesto da passare:
     {impresaId, lato, nome, operatoreId, telDestinatario, titolo, linkAvviso}
   «Come lo viene a sapere l'altro?» -> dopo l'invio compare un pulsante che apre
   WhatsApp con la riga gia' scritta e il link. Niente avvisi automatici.
   ⚠️ Il file parte PRIMA della pagina: usa sb, esc, toast solo a chiamata avvenuta. */
const CHAT_TAB="gest_messaggi";
const CHAT_SECONDI=10;
let _chatTimer=null;

function chatTel(x){
  let t=String(x||"").replace(/[^\d+]/g,"");
  if(!t)return "";
  if(t.startsWith("+"))t=t.slice(1);else if(t.startsWith("00"))t=t.slice(2);
  else if(/^3\d{8,9}$/.test(t))t="39"+t;
  return /^\d{8,15}$/.test(t)?t:"";
}
function chatOra(s){
  try{const d=new Date(s),o=new Date();
    const hm=d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
    if(d.toDateString()===o.toDateString())return hm;
    return d.toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit"})+" "+hm;}catch(_){return "";}
}
function chatQuery(ctx){
  let q=sb.from(CHAT_TAB).select("*").eq("user_id",ctx.impresaId);
  q=ctx.lavoroId?q.eq("lavoro_id",ctx.lavoroId):q.is("lavoro_id",null).eq("operatore_id",ctx.operatoreId);
  return q;
}
function chatBolla(m,ctx){
  const mio=m.autore===ctx.lato;
  return '<div class="ch-r '+(mio?"mio":"suo")+'"><div class="ch-b">'
    +'<div class="ch-n">'+esc(mio?"Tu":(m.autore_nome||(m.autore==="titolare"?"Titolare":"Operaio")))+' <span>'+esc(chatOra(m.created_at))+'</span></div>'
    +'<div class="ch-t">'+esc(m.testo)+'</div></div></div>';
}
async function chatConta(ctx){
  /* quanti messaggi dell'altra parte non sono ancora stati letti */
  try{
    let q=sb.from(CHAT_TAB).select("id",{count:"exact",head:true}).eq("user_id",ctx.impresaId).is("letto_il",null).neq("autore",ctx.lato);
    if(ctx.lavoroId)q=q.eq("lavoro_id",ctx.lavoroId);
    else if(ctx.tutti){/* tutte le chat generali di questa impresa */q=q.is("lavoro_id",null);}
    else q=q.is("lavoro_id",null).eq("operatore_id",ctx.operatoreId);
    const {count}=await q;return count||0;
  }catch(_){return 0;}
}
async function chatSegnaLetti(ctx,msgs){
  const ids=(msgs||[]).filter(m=>m.autore!==ctx.lato&&!m.letto_il).map(m=>m.id);
  if(!ids.length)return;
  try{await sb.from(CHAT_TAB).update({letto_il:new Date().toISOString()}).in("id",ids);}catch(_){}
  if(typeof ctx.dopoLetti==="function")ctx.dopoLetti();
}

async function chatMonta(el,ctx){
  if(!el||!sb||!ctx||!ctx.impresaId)return;
  if(_chatTimer){clearInterval(_chatTimer);_chatTimer=null;}
  el.innerHTML='<div class="ch-box"><div class="ch-lista" id="ch-lista"><div class="ch-vuoto">Carico i messaggi…</div></div>'
    +'<div class="ch-comp"><textarea id="ch-testo" rows="2" maxlength="2000" placeholder="Scrivi un messaggio"></textarea>'
    +'<button type="button" class="ch-invia" id="ch-invia">Invia</button></div>'
    +'<div id="ch-avviso"></div></div>';
  let msgs=[];
  const lista=el.querySelector("#ch-lista");
  const disegna=(giu)=>{
    lista.innerHTML=msgs.length?msgs.map(m=>chatBolla(m,ctx)).join(""):'<div class="ch-vuoto">Nessun messaggio. Scrivi il primo.</div>';
    if(giu)lista.scrollTop=lista.scrollHeight;
  };
  const carica=async(giu)=>{
    const {data,error}=await chatQuery(ctx).order("created_at",{ascending:true}).limit(300);
    if(error){lista.innerHTML='<div class="ch-vuoto">Non riesco a leggere i messaggi: '+esc(error.message)+'</div>';return;}
    const nuovo=!msgs.length||(data||[]).length!==msgs.length||((data||[]).slice(-1)[0]||{}).id!==(msgs.slice(-1)[0]||{}).id;
    msgs=data||[];
    if(nuovo||giu)disegna(true);
    chatSegnaLetti(ctx,msgs);
  };
  await carica(true);
  el.querySelector("#ch-invia").onclick=async()=>{
    const ta=el.querySelector("#ch-testo"),testo=String(ta.value||"").trim();
    if(!testo)return;
    const b=el.querySelector("#ch-invia");b.disabled=true;
    const riga={user_id:ctx.impresaId,operatore_id:ctx.operatoreId||null,lavoro_id:ctx.lavoroId||null,autore_nome:ctx.nome||null,testo:testo.slice(0,2000)};
    const {error}=await sb.from(CHAT_TAB).insert(riga);
    b.disabled=false;
    if(error){toast("Messaggio non inviato: "+error.message);return;}
    ta.value="";
    await carica(true);
    /* l'avviso: un pulsante che apre WhatsApp con la riga pronta */
    const av=el.querySelector("#ch-avviso");
    const cosa=ctx.titolo?("su «"+ctx.titolo+"»"):"in chat";
    const corto=testo.length>200?testo.slice(0,200)+"…":testo;
    const msg="*Nuovo messaggio "+cosa+"*\n«"+corto+"»\n\nRispondi qui:\n"+(ctx.linkAvviso||"");
    const tel=chatTel(ctx.telDestinatario);
    const url=(tel?("https://wa.me/"+tel):"https://wa.me/")+"?text="+encodeURIComponent(msg.replace(/\n{3,}/g,"\n\n"));
    av.innerHTML='<a class="ch-wa" href="'+url+'" target="_blank" rel="noopener">Avvisa '+esc(ctx.destinatario||"l'altro")+' su WhatsApp</a>'
      +'<div class="ch-nota">Il messaggio e\' salvato. Questo pulsante serve solo a farglielo sapere subito.</div>';
  };
  _chatTimer=setInterval(()=>{
    if(!document.body.contains(el)||el.offsetParent===null){if(!document.body.contains(el)){clearInterval(_chatTimer);_chatTimer=null;}return;}
    carica(false);
  },CHAT_SECONDI*1000);
}
function chatFerma(){if(_chatTimer){clearInterval(_chatTimer);_chatTimer=null;}}

if(!document.getElementById("chat-stile")){
  const st=document.createElement("style");st.id="chat-stile";
  st.textContent=
    ".ch-box{display:flex;flex-direction:column;gap:10px}"
    +".ch-lista{max-height:46vh;min-height:120px;overflow-y:auto;background:#eef2f6;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}"
    +".ch-vuoto{color:#4b5563;font-size:17px;padding:14px;text-align:center}"
    +".ch-r{display:flex}.ch-r.mio{justify-content:flex-end}"
    +".ch-b{max-width:84%;border-radius:14px;padding:9px 12px;font-size:18px;line-height:1.4}"
    +".ch-r.mio .ch-b{background:#d6ecff;border:1.5px solid #8fc3f0}"
    +".ch-r.suo .ch-b{background:#fff;border:1.5px solid #b9c3cf}"
    +".ch-n{font-size:14px;font-weight:700;color:#334155;margin-bottom:2px}.ch-n span{font-weight:500;color:#64748b;margin-left:4px}"
    +".ch-t{white-space:pre-wrap;word-break:break-word;color:#0b1220}"
    +".ch-comp{display:flex;gap:8px;align-items:stretch}"
    +".ch-comp textarea{flex:1;min-width:0;box-sizing:border-box;font:inherit;font-size:18px;padding:10px;border:1.5px solid #9aa7b5;border-radius:10px;resize:vertical}"
    +".ch-invia{flex:none;min-width:84px;border:0;border-radius:10px;background:#1c7a43;color:#fff;font:inherit;font-size:18px;font-weight:800;cursor:pointer}"
    +".ch-invia:disabled{opacity:.6}"
    +".ch-wa{display:block;text-align:center;text-decoration:none;border:2px solid #1c7a43;color:#1c7a43;background:#fff;border-radius:10px;padding:14px 8px;font-size:18px;font-weight:800}"
    +".ch-nota{font-size:15px;color:#4b5563;margin-top:6px}";
  document.head.appendChild(st);
}
