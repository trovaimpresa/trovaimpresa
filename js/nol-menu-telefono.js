/* ============================================================
   IL MENU DEL NOLEGGIO SUL TELEFONO — 12 novembre 2026
   ============================================================
   Secondo giro del controllore: sul telefono il menu era una striscia di
   20 voci da scorrere di lato (il Cestino stava a 2.700 px a destra) e
   «+ Nuovo noleggio» usciva tagliato. Adesso è come nell'App:
     · in alto a destra il pulsante bianco con le tre righe: apre il menu
       a tutto schermo, con TUTTE le voci una sotto l'altra;
     · in basso la barra fissa: Riepilogo, Noleggi, Mezzi, Fatture.
   Le voci NON vengono copiate: il menu a tutto schermo è la stessa
   <nav class="tabs"> di sempre, solo disegnata in colonna (css nel file
   gestionale-noleggio.html, blocco «menu del telefono»). Sul computer
   questo file non cambia niente: tutto è nascosto sopra i 700 px.
   Anteprima approvata da Alex in foto il 12 nov 2026. */
(function(){
  "use strict";
  function avvia(){
    var topin=document.querySelector("header.top .top-in");
    var nav=document.querySelector("header.top nav.tabs");
    if(!topin||!nav||document.getElementById("nol-menu-btn"))return;

    /* il pulsante con le tre righe */
    var mb=document.createElement("button");
    mb.id="nol-menu-btn"; mb.type="button"; mb.setAttribute("aria-label","Menu"); mb.title="Menu";
    mb.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    var az=document.querySelector('header.top [data-action="azienda"]');
    var destra=az?az.parentElement:null;
    if(destra&&destra.parentElement===topin){destra.classList.add("nol-top-azioni");topin.insertBefore(mb,destra);}
    else topin.appendChild(mb);

    /* «Dati azienda» sul telefono diventa «Azienda», se no «+ Nuovo noleggio» esce tagliato */
    if(az){
      Array.prototype.slice.call(az.childNodes).forEach(function(n){
        if(n.nodeType===3&&/Dati azienda/.test(n.nodeValue)){
          var s=document.createElement("span");
          s.innerHTML=' <span class="az-lungo">Dati azienda</span><span class="az-corto">Azienda</span>';
          az.replaceChild(s,n);
        }
      });
    }

    /* titolo e «Chiudi» del menu aperto */
    var tit=document.createElement("div"); tit.id="nol-menu-tit"; tit.textContent="Menu";
    var x=document.createElement("button"); x.id="nol-menu-x"; x.type="button"; x.textContent="× Chiudi";
    document.body.appendChild(tit); document.body.appendChild(x);
    function apri(){document.body.classList.add("nol-menu-on");}
    function chiudi(){document.body.classList.remove("nol-menu-on");}
    mb.addEventListener("click",apri);
    x.addEventListener("click",chiudi);
    document.addEventListener("keydown",function(e){if(e.key==="Escape")chiudi();});

    /* la barra in basso */
    var IC={
      riepilogo:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
      noleggi:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
      mezzi:'<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
      fatture:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6"/><path d="M16 12h-6"/>'
    };
    var VOCI=[["riepilogo","Riepilogo"],["noleggi","Noleggi"],["mezzi","Mezzi"],["fatture","Fatture"]];
    var bb=document.createElement("nav");
    bb.className="barra-basso"; bb.id="barra-basso"; bb.setAttribute("aria-label","Sezioni principali");
    bb.innerHTML=VOCI.map(function(v){
      return '<button type="button" data-vai-nol="'+v[0]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[v[0]]+'</svg><span>'+v[1]+'</span></button>';
    }).join("");
    document.body.appendChild(bb);
    function segna(tab){
      Array.prototype.forEach.call(bb.querySelectorAll("button"),function(b){b.classList.toggle("on",b.getAttribute("data-vai-nol")===tab);});
    }
    bb.addEventListener("click",function(e){
      var b=e.target.closest("button"); if(!b)return;
      var t=nav.querySelector('[data-tab="'+b.getAttribute("data-vai-nol")+'"]');
      chiudi(); if(t)t.click();
    });
    /* una voce scelta (dal menu o dalla barra): il menu si chiude e la barra segna dove sei */
    nav.addEventListener("click",function(e){
      var b=e.target.closest("button"); if(!b)return;
      if(b.classList.contains("nol-altro"))return;
      chiudi(); if(b.getAttribute("data-tab"))segna(b.getAttribute("data-tab"));
    });
    var att=nav.querySelector("button.active[data-tab]"); segna(att?att.getAttribute("data-tab"):"riepilogo");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",avvia); else avvia();
})();
