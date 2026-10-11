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
let _chatEdit=null;          /* id del messaggio che si sta correggendo */
const _chatUrls={};          /* indirizzi temporanei delle foto (percorso -> link) */
const CHAT_BUCKET="gestionale-foto";

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
function chatAllegati(m){
  let a=m.allegati;if(typeof a==="string"){try{a=JSON.parse(a);}catch(_){a=[];}}
  return Array.isArray(a)?a.filter(f=>f&&f.path):[];
}
async function chatUrls(msgs){
  const need=[...new Set((msgs||[]).flatMap(m=>m.eliminato_il?[]:chatAllegati(m).map(f=>f.path)))].filter(p=>!_chatUrls[p]);
  if(!need.length)return;
  try{const {data}=await sb.storage.from(CHAT_BUCKET).createSignedUrls(need,3600);
    (data||[]).forEach(u=>{if(u&&u.path&&u.signedUrl)_chatUrls[u.path]=u.signedUrl;});}catch(_){}
}
function chatBolla(m,ctx){
  const mio=m.autore===ctx.lato,del=!!m.eliminato_il;
  const nome=mio?"Tu":(m.autore_nome||(m.autore==="titolare"?"Titolare":"Operaio"));
  const letto=(mio&&m.letto_il&&!del)?" · Letto":"";
  let corpo;
  if(del){
    corpo='<div class="ch-t ch-del">Messaggio eliminato</div>';
  }else if(_chatEdit===m.id){
    corpo='<textarea class="ch-edit" rows="3" maxlength="2000">'+esc(m.testo)+'</textarea>'
      +'<div class="ch-az"><button type="button" class="ch-bt p" data-ch="salva" data-id="'+m.id+'">Salva</button>'
      +'<button type="button" class="ch-bt" data-ch="annulla">Annulla</button></div>';
  }else{
    const fs=chatAllegati(m).map(f=>{
      const u=_chatUrls[f.path];
      if(f.tipo&&f.tipo.indexOf("image/")===0&&u)return '<a class="ch-img" href="'+u+'" target="_blank" rel="noopener"><img src="'+u+'" alt=""></a>';
      return '<a class="ch-pdf" href="'+(u||"#")+'" target="_blank" rel="noopener">'+esc(f.nome||"File")+'</a>';
    }).join("");
    const haTesto=!!(m.testo&&String(m.testo).trim());
    corpo=(haTesto?'<div class="ch-t">'+esc(m.testo)+'</div>':"")
      +(fs?'<div class="ch-fs">'+fs+'</div>':"")
      +(m.modificato_il?'<div class="ch-mod">modificato</div>':"")
      +(mio?'<div class="ch-az">'+(haTesto?'<button type="button" class="ch-bt" data-ch="mod" data-id="'+m.id+'">Modifica</button>':"")
        +'<button type="button" class="ch-bt ch-x" data-ch="elim" data-id="'+m.id+'">Elimina</button></div>':"");
  }
  return '<div class="ch-r '+(mio?"mio":"suo")+'"><div class="ch-b">'
    +'<div class="ch-n">'+esc(nome)+' <span>'+esc(chatOra(m.created_at))+esc(letto)+'</span></div>'+corpo+'</div></div>';
}
function chatFirma(msgs){return (msgs||[]).map(m=>m.id+"|"+(m.modificato_il||"")+"|"+(m.eliminato_il||"")+"|"+(m.letto_il?1:0)).join(",");}
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
  _chatEdit=null;
  el.innerHTML='<div class="ch-box"><div class="ch-lista" id="ch-lista"><div class="ch-vuoto">Carico i messaggi…</div></div>'
    +'<div class="ch-comp"><textarea id="ch-testo" rows="2" maxlength="2000" placeholder="Scrivi un messaggio"></textarea>'
    +'<button type="button" class="ch-invia" id="ch-invia">Invia</button></div>'
    +'<div class="ch-fr"><label class="ch-foto">Foto o PDF<input type="file" class="ch-file" accept="image/*,application/pdf" multiple style="display:none"></label>'
    +'<span class="ch-pronti"></span></div>'
    +'<div id="ch-avviso"></div></div>';
  let msgs=[],pronti=[],firma="";
  const lista=el.querySelector("#ch-lista");
  const inFile=el.querySelector(".ch-file"),inPronti=el.querySelector(".ch-pronti");
  const disegna=(giu)=>{
    lista.innerHTML=msgs.length?msgs.map(m=>chatBolla(m,ctx)).join(""):'<div class="ch-vuoto">Nessun messaggio. Scrivi il primo.</div>';
    if(giu)lista.scrollTop=lista.scrollHeight;
  };
  const carica=async(giu)=>{
    const {data,error}=await chatQuery(ctx).order("created_at",{ascending:true}).limit(300);
    if(error){lista.innerHTML='<div class="ch-vuoto">Non riesco a leggere i messaggi: '+esc(error.message)+'</div>';return;}
    const nuovoMsgs=data||[],f=chatFirma(nuovoMsgs),cambiato=f!==firma;
    const eraFine=lista.scrollHeight-lista.scrollTop-lista.clientHeight<80;
    msgs=nuovoMsgs;
    if(_chatEdit&&!giu){chatSegnaLetti(ctx,msgs);return;}   /* non si ridisegna mentre si corregge */
    if(cambiato||giu){await chatUrls(msgs);firma=f;disegna(giu||eraFine||!lista.children.length);}
    chatSegnaLetti(ctx,msgs);
  };
  await carica(true);
  inFile.onchange=()=>{
    pronti=pronti.concat([...inFile.files]);inFile.value="";
    inPronti.innerHTML=pronti.length?esc(pronti.length+(pronti.length===1?" file pronto":" file pronti"))+' <button type="button" class="ch-bt" data-ch="togli">Togli</button>':"";
  };
  el.querySelector(".ch-box").addEventListener("click",async function(ev){
    const b=ev.target.closest&&ev.target.closest("[data-ch]");if(!b||!el.contains(b))return;
    const a=b.getAttribute("data-ch"),id=b.getAttribute("data-id");
    if(a==="togli"){pronti=[];inPronti.innerHTML="";}
    else if(a==="mod"){_chatEdit=id;disegna(false);const t=el.querySelector(".ch-edit");if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length);}}
    else if(a==="annulla"){_chatEdit=null;disegna(false);}
    else if(a==="salva"){
      const t=el.querySelector(".ch-edit"),testo=String(t&&t.value||"").trim();
      if(!testo){toast("Scrivi qualcosa, oppure elimina il messaggio");return;}
      b.disabled=true;
      const {data,error}=await sb.from(CHAT_TAB).update({testo:testo.slice(0,2000)}).eq("id",id).select("id");
      b.disabled=false;
      if(error||!data||!data.length){toast("Non salvato: "+(error?error.message:"non puoi cambiare questo messaggio"));return;}
      _chatEdit=null;await carica(true);
    }
    else if(a==="elim"){
      if(b.dataset.sicuro!=="1"){b.dataset.sicuro="1";b.textContent="Sicuro? Premi ancora";return;}
      b.disabled=true;
      /* si cancella davvero: la riga e anche le foto/PDF */
      const m=msgs.find(x=>x.id===id),fs=m?chatAllegati(m).map(f=>f.path):[];
      const {data,error}=await sb.from(CHAT_TAB).delete().eq("id",id).select("id");
      if(error||!data||!data.length){b.disabled=false;toast("Non eliminato: "+(error?error.message:"non puoi togliere questo messaggio"));return;}
      if(fs.length){try{await sb.storage.from(CHAT_BUCKET).remove(fs);}catch(_){}}
      await carica(true);
    }
  });
  el.querySelector("#ch-invia").onclick=async()=>{
    const ta=el.querySelector("#ch-testo"),testo=String(ta.value||"").trim();
    if(!testo&&!pronti.length)return;
    const b=el.querySelector("#ch-invia");b.disabled=true;
    const via=async(lista)=>{for(const c of lista){try{if(typeof _fileOrfano==="function")await _fileOrfano(CHAT_BUCKET,c.path);else await sb.storage.from(CHAT_BUCKET).remove([c.path]);}catch(_){}}};
    const caricati=[];
    for(const file of pronti){
      const p=await preparaFileUpload(file);
      if(p.errore){toast(p.errore);await via(caricati);b.disabled=false;return;}
      const safe=p.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=ctx.impresaId+"/chat/"+Date.now()+"_"+Math.floor(Math.random()*1000)+"_"+safe;
      const {error:up}=await sb.storage.from(CHAT_BUCKET).upload(path,p.file);
      if(up){toast("File non caricato: "+up.message);await via(caricati);b.disabled=false;return;}
      caricati.push({path:path,nome:p.nome,tipo:(p.file&&p.file.type)||file.type||""});
    }
    const riga={user_id:ctx.impresaId,operatore_id:ctx.operatoreId||null,lavoro_id:ctx.lavoroId||null,autore_nome:ctx.nome||null,testo:testo.slice(0,2000),allegati:caricati};
    const {error}=await sb.from(CHAT_TAB).insert(riga);
    b.disabled=false;
    if(error){await via(caricati);toast("Messaggio non inviato: "+error.message);return;}
    ta.value="";pronti=[];inPronti.innerHTML="";
    await carica(true);
    /* l'avviso: un pulsante che apre WhatsApp con la riga pronta */
    const av=el.querySelector("#ch-avviso");
    const cosa=ctx.titolo?("su «"+ctx.titolo+"»"):"in chat";
    const base=testo||(caricati.length===1?"(un file)":"("+caricati.length+" file)");
    const corto=base.length>200?base.slice(0,200)+"…":base;
    const msg="*Nuovo messaggio "+cosa+"*\n«"+corto+"»\n\nRispondi qui:\n"+(ctx.linkAvviso||"");
    const tel=chatTel(ctx.telDestinatario);
    const url=(tel?("https://wa.me/"+tel):"https://wa.me/")+"?text="+encodeURIComponent(msg.replace(/\n{3,}/g,"\n\n"));
    av.innerHTML='<a class="ch-wa" href="'+url+'" target="_blank" rel="noopener">Avvisa '+esc(ctx.destinatario||"l'altro")+' su WhatsApp</a>'
      +'<div class="ch-nota">Il messaggio e\' salvato. Questo pulsante serve solo a farglielo sapere subito.</div>';
  };
  _chatTimer=setInterval(()=>{
    if(!document.body.contains(el)){clearInterval(_chatTimer);_chatTimer=null;return;}
    /* si aggiorna (e si segna «letto») SOLO se la chat si sta davvero guardando:
       finestra chiusa, scheda nascosta o pagina in secondo piano = niente.
       Se no un messaggio arrivato a finestra chiusa risultava gia' letto. */
    if(document.hidden||el.offsetParent===null)return;
    const ov=el.closest("#overlay");
    if(ov&&!ov.classList.contains("open"))return;
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
    +".ch-nota{font-size:15px;color:#4b5563;margin-top:6px}"
    +".ch-del{font-style:italic;color:#64748b}"
    +".ch-mod{font-size:14px;color:#64748b;margin-top:2px}"
    +".ch-az{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}"
    +".ch-bt{font:inherit;font-size:16px;font-weight:700;border:1.5px solid #7b8794;background:#fff;color:#0b1220;border-radius:8px;padding:7px 12px;cursor:pointer}"
    +".ch-bt.p{background:#1c7a43;border-color:#1c7a43;color:#fff}.ch-bt.ch-x{color:#b42318;border-color:#e0a39d}"
    +".ch-edit{width:100%;box-sizing:border-box;font:inherit;font-size:18px;padding:8px;border:1.5px solid #9aa7b5;border-radius:8px;resize:vertical}"
    +".ch-fs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}"
    +".ch-img img{display:block;max-width:220px;max-height:200px;border-radius:10px;border:1.5px solid #b9c3cf}"
    +".ch-pdf{display:inline-block;padding:10px 12px;border:1.5px solid #8fc3f0;border-radius:10px;background:#fff;color:#0a2a4d;font-weight:700;font-size:16px;word-break:break-all}"
    +".ch-fr{display:flex;align-items:center;gap:10px;flex-wrap:wrap}"
    +".ch-foto{display:inline-block;cursor:pointer;border:2px solid #0a2a4d;color:#0a2a4d;background:#fff;border-radius:10px;padding:10px 14px;font-size:17px;font-weight:800}"
    +".ch-pronti{font-size:16px;color:#334155}";
  document.head.appendChild(st);
}
