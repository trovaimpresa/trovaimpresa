/* 11 ottobre 2026 — LA CHAT NELLA PAGINA DELL'OPERAIO
   · scheda «Chat»: la chat generale col capo
   · dentro ogni lavoro: la chat di QUEL lavoro (#lv-chat-box)
   Il motore e' js/chat-squadra.js (condiviso col gestionale). Qui solo il
   collegamento con questa pagina. */
/* il numero WhatsApp del capo (lo scrive lui nel gestionale, tabella gest_contatto_capo) */
let _opCapoTel=null;
async function opCapoCarica(){
  if(_opCapoTel!==null)return;
  _opCapoTel="";
  try{
    if(!sb||!MIO||!MIO.impresaId||MIO.uid===MIO.impresaId)return;
    const r=await sb.from("gest_contatto_capo").select("telefono").eq("user_id",MIO.impresaId).maybeSingle();
    _opCapoTel=(r&&r.data&&r.data.telefono)||"";
  }catch(_){}
}
function opChatCtx(lavoro){
  /* se chi guarda E' il titolare (prova la pagina dell'operaio col suo account) i suoi messaggi sono «titolare» */
  const base={impresaId:MIO.impresaId,lato:(MIO.uid&&MIO.uid===MIO.impresaId)?"titolare":"operaio",nome:MIO.nome||"",operatoreId:MIO.operatoreId||null,
    destinatario:"il capo",telDestinatario:_opCapoTel||"",linkAvviso:location.origin+"/gestionale-app.html"+(MIO.operatoreId?"?chat="+MIO.operatoreId:""),
    dopoLetti:()=>{opChatBadge();}};
  if(lavoro){base.lavoroId=lavoro.id;base.linkAvviso=location.origin+"/gestionale-app.html?chatlavoro="+lavoro.id;base.titolo=(typeof opTitolo==="function"?opTitolo(lavoro):"");}
  return base;
}
async function opChatBadge(){
  try{
    if(!sb||!MIO||!MIO.impresaId)return;
    const {count}=await sb.from(CHAT_TAB).select("id",{count:"exact",head:true}).eq("user_id",MIO.impresaId).is("letto_il",null).neq("autore",(MIO.uid&&MIO.uid===MIO.impresaId)?"titolare":"operaio");
    const e=document.getElementById("op-n-chat");if(e)e.textContent=count?"("+count+")":"";
  }catch(_){}
}
async function opRenderChat(){
  const box=document.getElementById("op-chat-box");if(!box)return;
  if(!MIO.operatoreId){box.innerHTML='<div class="empty-state">La chat generale non e\' disponibile per questo accesso. Puoi scrivere dentro ogni lavoro.</div>';return;}
  await opCapoCarica();
  chatMonta(box,opChatCtx(null));
}
/* dentro il lavoro: si monta quando il lavoro si apre */
(function(){
  const _apri=window.openLavoro;
  if(typeof _apri!=="function")return;
  window.openLavoro=async function(id){
    const r=await _apri.apply(this,arguments);
    try{
      const l=(LAVORI||[]).find(x=>x.id===id);
      const el=document.getElementById("lv-chat");
      if(l&&el&&puo("lavori")){await opCapoCarica();chatMonta(el,opChatCtx(l));}
    }catch(_){}
    return r;
  };
})();
window.opRenderChat=opRenderChat;window.opChatBadge=opChatBadge;
