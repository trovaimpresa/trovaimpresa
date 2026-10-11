/* 11 ottobre 2026 — LA CHAT NEL GESTIONALE (lato titolare)
   Due porte, dal menu «...»:
     · Squadra -> «Messaggi»            = chat generale con quella persona
     · Lavori  -> «Messaggi del lavoro» = chat di quel lavoro
   Il motore e' js/chat-squadra.js. Qui: si apre la finestra e si passa chi e'
   chi. ⚠️ Le azioni si agganciano con un ascoltatore PROPRIO: quelli della
   pagina (data-action) sono catene di if che non conoscono questi nomi. */
function chatGestApri(titolo,ctx){
  openSheetGrande(titolo,'<div id="ch-gest"></div>','<button class="btn b-cancel" data-action="close">Chiudi</button>');
  chatMonta(document.getElementById("ch-gest"),ctx);
}
document.addEventListener("click",function(e){
  const t=e.target.closest&&e.target.closest("[data-action=chat-squadra],[data-action=chat-lavoro]");
  if(!t)return;
  if(typeof tabChiudiPop==="function")tabChiudiPop();
  const a=t.dataset.action,id=t.dataset.id;
  const tel=function(opId){const o=(typeof dipCache!=="undefined"&&dipCache||[]).find(function(x){return String(x.id)===String(opId);});return o?o.telefono:"";};
  const base={impresaId:sbUid,lato:"titolare",nome:"Titolare"};
  if(a==="chat-squadra"){
    chatGestApri("Messaggi con "+(t.dataset.nome||"la persona"),Object.assign(base,{
      operatoreId:id,destinatario:t.dataset.nome||"la persona",telDestinatario:tel(id),
      linkAvviso:location.origin+"/gestionale-operatore.html?chat=1",
      dopoLetti:function(){if(typeof renderDip==="function")renderDip();}}));
  }else{
    chatGestApri("Messaggi: "+(t.dataset.t||"lavoro"),Object.assign(base,{
      lavoroId:id,titolo:t.dataset.t||"",operatoreId:t.dataset.op||null,
      destinatario:"la squadra",telDestinatario:t.dataset.op?tel(t.dataset.op):"",
      linkAvviso:location.origin+"/gestionale-operatore.html?lavoro="+id}));
  }
});
