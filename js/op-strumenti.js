/* ═══ 25 NOVEMBRE 2026 — «I TUOI STRUMENTI» NELL'APP DEL COLLABORATORE ═══
   (Tappa 3 n. 5, sì di Alex, foto approvata). In cima a «Lavori di adesso»:
   gli strumenti/attrezzature che il titolare gli ha dato («Chi ce l'ha»),
   con la prossima scadenza (taratura, revisione…): verde in regola,
   arancione entro 30 giorni, rosso scaduta.
   ⛔ Non legge gest_mezzi: passa SOLO da gest_strumenti_miei
   (sql/2026-11-25-strumenti-miei.sql), che dà nome e scadenza, niente costi.
   Se non ha niente, il riquadro non c'è.
   ═════════════════════════════════════════════════════════════════════ */
(function(){
  function e(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function studio(){ try{return typeof MIO!=="undefined"&&MIO.tipoStudio==="professionista";}catch(x){return false;} }
  function oggi(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function giorni(a,b){return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000);}
  function dm(s){var p=String(s).split("-");return p[2]+"/"+p[1]+(p[0]!==String(new Date().getFullYear())?"/"+p[0]:"");}
  function stato(sc){
    if(!sc||!sc.data)return {c:"#64748b",t:"nessuna scadenza",b:false};
    var o=oggi(), g=giorni(o,sc.data);
    if(g<0)return {c:"#c0392b",t:"scaduta il "+dm(sc.data),b:true};
    if(g===0)return {c:"#c0392b",t:"scade oggi",b:true};
    if(g<=30)return {c:"#b45309",t:"fra "+g+(g===1?" giorno":" giorni"),b:false};
    return {c:"#15803d",t:"in regola",b:false};
  }
  var giri=0;
  async function accendi(){
    if(typeof MIO==="undefined"||!MIO.impresaId||typeof sb==="undefined"||!sb){ if(++giri<120)setTimeout(accendi,500); return; }
    var pl=document.getElementById("op-p-lavori"); if(!pl||document.getElementById("op-stru"))return;
    var r; try{ r=await sb.rpc("gest_strumenti_miei",{_impresa:MIO.impresaId}); }catch(x){return;}
    if(!r||r.error||!r.data||!r.data.ok)return;
    var L=r.data.strumenti||[]; if(!L.length)return;
    var tutteAttr=L.every(function(x){return x.categoria==="attrezzatura";});
    var tit=studio()?"I tuoi strumenti":(tutteAttr?"Le tue attrezzature":"Mezzi e attrezzature che hai tu");
    /* prima quelle scadute, poi le vicine */
    L.sort(function(a,b){var da=a.scadenza&&a.scadenza.data||"9999",db=b.scadenza&&b.scadenza.data||"9999";return da.localeCompare(db)||String(a.nome).localeCompare(String(b.nome));});
    var box=document.createElement("div"); box.id="op-stru"; box.className="op-stru";
    box.innerHTML='<div class="op-stru-t">🔧 '+e(tit)+'</div>'+L.map(function(x){
      var s=stato(x.scadenza);
      return '<div class="op-stru-r"><div><b>'+e(x.nome||"—")+'</b>'+(x.scadenza&&x.scadenza.titolo?'<small>'+e(x.scadenza.titolo)+'</small>':'')+'</div>'
        +'<span style="color:'+s.c+(s.b?';font-weight:700':'')+'">'+e(s.t)+'</span></div>';
    }).join("");
    pl.insertBefore(box,pl.firstChild);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",accendi); else accendi();
})();
