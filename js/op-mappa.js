/* 11 ottobre 2026 — LA MAPPA DENTRO IL LAVORO (pagina dell'operaio)
   Sotto «Cosa devi fare»: la mappa dell'indirizzo del lavoro (o del cliente). */
(function(){
  const _apri=window.openLavoro;
  if(typeof _apri!=="function")return;
  window.openLavoro=async function(id){
    const r=await _apri.apply(this,arguments);
    try{
      const l=(LAVORI||[]).find(x=>x.id===id),el=document.getElementById("lv-mappa");
      if(el)el.innerHTML=(l&&typeof opDove==="function")?mappaHtml(opDove(l)):"";
    }catch(_){}
    return r;
  };
})();
