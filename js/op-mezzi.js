/* ═══ 24 NOVEMBRE 2026 — I MEZZI NELL'APP DELL'OPERAIO ════════════════
   Scheda «Mezzi»: l'operaio prende un furgone libero («Prendo questo»,
   km e cantiere) e lo riporta («Lo riporto», km d'arrivo). Il titolare lo
   vede subito nel gestionale, voce Mezzi e attrezzature.
   ⛔ Non legge ne' scrive la tabella dei mezzi: passa SOLO dalle funzioni
   del database gest_mezzi_operaio / gest_mezzo_prendo / gest_mezzo_riporto
   (sql/2026-11-24-mezzi-uscite.sql), che controllano chi e' e se ha il
   permesso «mezzi». Cosi' non vede costi, tariffe e note.
   La scheda compare solo se ha il permesso E il titolare ha almeno un mezzo.
   ═════════════════════════════════════════════════════════════════════ */
(function(){
  var MZ=[], mzForm=null, mzOcc=false;
  function e(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function punti(n){return String(Math.round(+n)).replace(/\B(?=(\d{3})+(?!\d))/g,".");}
  function quando(ts){
    if(!ts)return "";
    var d=new Date(ts), o=new Date();
    var g=Math.round((new Date(o.toDateString())-new Date(d.toDateString()))/86400000);
    var hh=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
    if(g===0)return "da oggi alle "+hh;
    if(g===1)return "da ieri alle "+hh;
    return "dal "+d.toLocaleDateString("it-IT");
  }
  function leggiKm(v){
    var t=String(v||"").trim(); if(!t)return {vuoto:true};
    if(!/^[\d.\s]+(,\d+)?$/.test(t))return {errore:true};
    var n=Math.round(+t.replace(/[.\s]/g,"").replace(",","."));
    if(!isFinite(n)||n<0||n>9999999)return {errore:true};
    return {n:n};
  }
  function studio(){ return !!(window.MIO&&MIO.tipoStudio==="professionista")||(typeof MIO!=="undefined"&&MIO.tipoStudio==="professionista"); }
  function lavTit(id){
    var l=(typeof LAVORI!=="undefined"?LAVORI:[]).find(function(x){return String(x.id)===String(id);});
    return l&&typeof opTitolo==="function"?opTitolo(l):"";
  }

  async function carica(){
    var r=await sb.rpc("gest_mezzi_operaio",{_impresa:MIO.impresaId});
    if(r.error||!r.data||!r.data.ok)return null;
    MZ=(r.data.mezzi||[]).filter(function(m){return m.stato!=="fuori_uso";});
    /* il mio per primo, poi i liberi, poi quelli fuori con un collega */
    MZ.sort(function(a,b){
      var pa=a.aperta?(a.aperta.mia?0:2):1, pb=b.aperta?(b.aperta.mia?0:2):1;
      return pa-pb||String(a.nome||"").localeCompare(String(b.nome||""));
    });
    return MZ;
  }

  function scheda(m){
    var t=e(m.nome||"Mezzo")+(m.targa?" · "+e(m.targa):"");
    if(m.aperta&&m.aperta.mia){
      var dove=m.aperta.lavoro_id?lavTit(m.aperta.lavoro_id):"";
      return '<div class="op-card r"><div class="op-t">'+t+'</div>'
        +'<div class="op-dove">Ce l\'hai tu '+e(quando(m.aperta.uscita_il))+(dove?" · "+e(dove):"")+'</div>'
        +'<span class="op-st r">CE L\'HAI TU</span>'
        +'<div class="op-btns"><button type="button" class="op-b p" data-mz-riporto="'+e(m.id)+'">↩ Lo riporto</button></div></div>';
    }
    if(m.aperta){
      return '<div class="op-card v" style="border-left-color:#9ca3af"><div class="op-t">'+t+'</div>'
        +'<div class="op-dove">Fuori con '+e(m.aperta.chi||"un collega")+' '+e(quando(m.aperta.uscita_il))+'</div>'
        +'<span class="op-st" style="background:#eef2f7;color:#374151">FUORI</span></div>';
    }
    var manut=m.stato==="manutenzione";
    return '<div class="op-card v"'+(manut?' style="border-left-color:#b45309"':'')+'><div class="op-t">'+t+'</div>'
      +(m.km!=null?'<div class="op-dove">'+punti(m.km)+' km</div>':'')
      +(manut?'<span class="op-st" style="background:#fff7ed;color:#b45309">IN MANUTENZIONE</span>':'<span class="op-st g">LIBERO</span>')
      +(manut?'':'<div class="op-btns"><button type="button" class="op-b p" data-mz-prendo="'+e(m.id)+'">→ Prendo questo</button></div>')
      +'</div>';
  }

  function disegna(msg){
    var box=document.getElementById("op-p-mezzi"); if(!box)return;
    if(mzForm){ disegnaForm(box,msg); return; }
    box.innerHTML='<div class="op-h">Mezzi</div>'
      +'<div class="op-sub">Prendi un mezzo e scrivi i km. Quando lo riporti, scrivi i km di arrivo.</div>'
      +(msg?'<div class="op-fblocco" style="font-size:18px;font-weight:700">'+e(msg)+'</div>':'')
      +(MZ.length?MZ.map(scheda).join(""):'<div class="op-sub">Nessun mezzo.</div>');
  }

  function disegnaForm(box,msg){
    var m=MZ.find(function(x){return String(x.id)===String(mzForm.id);}); if(!m){mzForm=null;disegna();return;}
    var riporto=mzForm.tipo==="riporto";
    var lavori=(typeof LAVORI!=="undefined"?LAVORI:[]).filter(function(l){return !(typeof opFatto==="function"&&opFatto(l));});
    var opts='<option value="">— nessuno —</option>'+lavori.map(function(l){return '<option value="'+e(l.id)+'">'+e(typeof opTitolo==="function"?opTitolo(l):"Lavoro")+'</option>';}).join("");
    var km0=riporto?m.aperta.km_uscita:m.km;
    box.innerHTML='<div class="op-h">'+(riporto?"Riporti ":"Prendi ")+e(m.nome||"il mezzo")+'</div>'
      +'<div class="op-sub">'+(m.targa?e(m.targa)+" · ":"")+'data e ora si scrivono da sole.</div>'
      +'<div class="op-fblocco">'
      +(msg?'<div style="color:#c62828;font-weight:800;font-size:18px;margin-bottom:8px">'+e(msg)+'</div>':'')
      +'<label class="mz-l" for="mz-km">'+(riporto?"Km sul cruscotto adesso":"Km sul cruscotto")+'</label>'
      +'<input id="mz-km" class="mz-km" inputmode="numeric" autocomplete="off" value="'+(!riporto&&km0!=null?punti(km0):"")+'" placeholder="'+(km0!=null?"Es. "+punti(+km0+(riporto?50:0)):"Es. 177.117")+'">'
      +'<p class="mz-n" id="mz-nota">'+(riporto
          ?(km0!=null?"Alla partenza erano "+punti(km0)+" km.":"Se non li sai lascia vuoto.")
          :(km0!=null?"Sono quelli dell'ultimo rientro. Se sul cruscotto c'è un altro numero, correggilo.":"Scrivi quelli del cruscotto."))+'</p>'
      +(riporto?'':'<label class="mz-l" for="mz-lav">'+(studio()?"Dove vai (pratica)":"Dove vai")+'</label><select id="mz-lav" class="mz-km">'+opts+'</select>'
        +'<label class="mz-l" for="mz-mot">Perché <span style="font-weight:500">(se vuoi)</span></label><input id="mz-mot" class="mz-km mz-km-t" maxlength="300" placeholder="Es. porto il materiale">')
      +'<div class="op-btns" style="margin-top:18px"><button type="button" class="op-b" data-mz-annulla="1">Annulla</button>'
      +'<button type="button" class="op-b p" data-mz-ok="1">'+(riporto?"↩ L'ho riportato":"→ Lo prendo")+'</button></div>'
      +'</div>';
    var inp=document.getElementById("mz-km");
    if(riporto&&inp&&km0!=null)inp.addEventListener("input",function(){
      var r=leggiKm(inp.value), n=document.getElementById("mz-nota"); if(!n)return;
      if(r.vuoto||r.errore){n.textContent="Alla partenza erano "+punti(km0)+" km.";return;}
      var d=r.n-(+km0); n.textContent=d<0?"Sono meno di quelli della partenza ("+punti(km0)+" km)":"Km fatti: "+punti(d);
    });
  }

  async function conferma(){
    if(mzOcc||!mzForm)return;
    var m=MZ.find(function(x){return String(x.id)===String(mzForm.id);}); if(!m)return;
    var km=leggiKm((document.getElementById("mz-km")||{}).value);
    if(km.errore){disegnaForm(document.getElementById("op-p-mezzi"),"Scrivi solo il numero dei km, es. 177.117");return;}
    var riporto=mzForm.tipo==="riporto";
    if(riporto&&!km.vuoto&&m.aperta.km_uscita!=null&&km.n<+m.aperta.km_uscita){
      var v=(document.getElementById("mz-km")||{}).value;
      disegnaForm(document.getElementById("op-p-mezzi"),"Sono meno dei km alla partenza ("+punti(m.aperta.km_uscita)+")");
      var i=document.getElementById("mz-km"); if(i)i.value=v; return;
    }
    mzOcc=true;
    var bt=document.querySelector("[data-mz-ok]"); if(bt){bt.disabled=true;bt.textContent="Un attimo…";}
    try{
      var r;
      if(riporto){
        r=await sb.rpc("gest_mezzo_riporto",{_impresa:MIO.impresaId,_uscita:m.aperta.id,_km:km.vuoto?null:km.n});
      }else{
        r=await sb.rpc("gest_mezzo_prendo",{_impresa:MIO.impresaId,_mezzo:m.id,_km:km.vuoto?null:km.n,
          _lavoro:((document.getElementById("mz-lav")||{}).value)||null,
          _motivo:((document.getElementById("mz-mot")||{}).value)||null});
      }
      var d=r&&r.data;
      if(r.error||!d){mzOcc=false;disegnaForm(document.getElementById("op-p-mezzi"),"Non è partito: controlla la connessione e riprova.");return;}
      if(!d.ok){
        var dice={gia_fuori:"Questo mezzo l'ha appena preso "+(d.chi||"un collega")+".",
                  km_bassi:"Sono meno dei km alla partenza ("+punti(d.km_uscita||0)+").",
                  permesso:"Il tuo capo non ti ha dato il permesso «Mezzi».",
                  non_tua:"Questo mezzo non risulta preso da te.",
                  non_aperta:"Il rientro era già registrato."}[d.errore]||"Non è andato: riprova.";
        mzForm=null; await carica(); mzOcc=false; disegna(dice); return;
      }
      var fatto=riporto?("Riportato ✔"+(d.km_fatti!=null?" — "+punti(d.km_fatti)+" km fatti":"")):("Preso ✔ — "+(m.nome||"il mezzo")+" è tuo");
      mzForm=null; await carica(); mzOcc=false; disegna(fatto);
    }catch(err){ mzOcc=false; disegnaForm(document.getElementById("op-p-mezzi"),"Non è partito: controlla la connessione e riprova."); }
  }

  window.opRenderMezzi=async function(){
    var box=document.getElementById("op-p-mezzi"); if(!box)return;
    if(!MZ.length)box.innerHTML='<div class="op-h">Mezzi</div><div class="op-sub">Sto caricando…</div>';
    var l=await carica();
    if(l===null){box.innerHTML='<div class="op-h">Mezzi</div><div class="op-sub">Non riesco a leggere i mezzi: controlla la connessione.</div>';return;}
    disegna();
  };

  document.addEventListener("click",function(ev){
    var t=ev.target.closest&&ev.target.closest("[data-mz-prendo],[data-mz-riporto],[data-mz-annulla],[data-mz-ok]"); if(!t)return;
    var box=document.getElementById("op-p-mezzi"); if(!box||!box.contains(t))return;
    if(t.hasAttribute("data-mz-prendo")){mzForm={id:t.getAttribute("data-mz-prendo"),tipo:"prendo"};disegna();window.scrollTo(0,box.offsetTop-10);}
    else if(t.hasAttribute("data-mz-riporto")){mzForm={id:t.getAttribute("data-mz-riporto"),tipo:"riporto"};disegna();window.scrollTo(0,box.offsetTop-10);}
    else if(t.hasAttribute("data-mz-annulla")){mzForm=null;disegna();}
    else if(t.hasAttribute("data-mz-ok")){conferma();}
  });

  /* la scheda nasce quando si sa chi e' (MIO.impresaId) e solo se serve */
  var giri=0;
  async function accendi(){
    if(typeof MIO==="undefined"||!MIO.impresaId||!window.sb&&typeof sb==="undefined"){ if(++giri<120)setTimeout(accendi,500); return; }
    if(typeof puo==="function"&&!puo("mezzi"))return;
    if(studio())return;   /* lo studio non ha i mezzi (voce nascosta) */
    if(document.getElementById("op-p-mezzi"))return;
    var l=await carica(); if(!l||!l.length)return;
    var tabs=document.getElementById("op-tabs"), pl=document.getElementById("op-p-lavori"); if(!tabs||!pl)return;
    var b=document.createElement("button"); b.type="button"; b.dataset.s="mezzi"; b.textContent="Mezzi";
    var primo=tabs.querySelector('[data-s="lavori"]');
    if(primo&&primo.nextSibling)tabs.insertBefore(b,primo.nextSibling); else tabs.appendChild(b);
    b.onclick=function(){ if(typeof opVaiScheda==="function")opVaiScheda("mezzi"); };
    var p=document.createElement("div"); p.id="op-p-mezzi"; p.className="hidden";
    pl.parentNode.insertBefore(p,pl.nextSibling);
    disegna();
    /* se ce l'ha lui, la scheda si apre da sola: e' la cosa da fare */
    if(MZ.some(function(m){return m.aperta&&m.aperta.mia;})&&typeof opVaiScheda==="function"&&(typeof opScheda==="undefined"||opScheda==="lavori"))opVaiScheda("mezzi");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",accendi); else accendi();
})();
