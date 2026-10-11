/* 11 ottobre 2026 — LA MAPPA DENTRO IL LAVORO (pagina dell'operaio)
   Sotto «Cosa devi fare»: la mappa dell'indirizzo del lavoro (o del cliente).
   12 ott: se nell'indirizzo manca la citta', si aggiunge quella del cliente. */
(function(){
  const _apri=window.openLavoro;
  if(typeof _apri!=="function")return;
  window.openLavoro=async function(id){
    const r=await _apri.apply(this,arguments);
    try{
      const l=(LAVORI||[]).find(x=>x.id===id),el=document.getElementById("lv-mappa");
      if(!el)return r;
      const dove=(l&&typeof opDove==="function")?opDove(l):"";
      el.innerHTML=mappaHtml(dove,"");
      if(l&&l.cliente_id&&dove&&sb){
        const {data}=await sb.from("gest_clienti").select("citta").eq("id",l.cliente_id).maybeSingle();
        const c=data&&data.citta;
        if(c&&document.getElementById("lv-mappa")===el)el.innerHTML=mappaHtml(dove,c);
      }
    }catch(_){}
    return r;
  };
})();
