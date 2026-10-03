/* 3 ott 2026 - BORDO BLU su tutte le card del gestionale (artigiano, impresa, professionista, noleggio, app operaio).
   Il CSS dei vari pezzi del gestionale e' scritto in tanti posti: invece di rincorrerli uno per uno,
   questo script mette la classe ti-bb a ogni card (sfondo bianco o striscia colorata sul lato) e la classe
   ti-bgt ai fondi chiari grandi. Il colore vero sta in css/gestionale-stile.css. */
(function(){
  if(window.__tiBB)return;window.__tiBB=1;
  var fatti=new WeakSet();
  var SKIP={INPUT:1,SELECT:1,TEXTAREA:1,LABEL:1,IMG:1,svg:1,SVG:1,PATH:1,OPTION:1,TR:1,TD:1,TH:1,TBODY:1,THEAD:1,TABLE:1,SPAN:1,B:1,I:1,SMALL:1,P:1,H1:1,H2:1,H3:1,H4:1,UL:1,LI:0};
  var FUORI='.side,.topbar,header,nav,#landing,#gest-striscia,#toast,.toast,.ti-fond,#ti-riapri,[id^="ti-"],.menu-altro';
  function chiaro(c){var m=c.match(/\d+/g);if(!m||m.length<3)return false;if(m.length>3&&+m[3]===0)return false;return +m[0]>=232&&+m[1]>=236&&+m[2]>=228}
  function nera(c){var m=c.match(/\d+/g);return m&&+m[0]<60&&+m[1]<70&&+m[2]<110}
  function esamina(e){
    if(e.nodeType!==1||SKIP[e.tagName]||e.classList.contains('ti-bb')||e.classList.contains('ti-bgt'))return;
    if(e.closest(FUORI))return;
    var w=e.offsetWidth,h=e.offsetHeight;if(w<110||h<28)return;
    if((e.tagName==='BUTTON'||e.tagName==='A')&&(w<150||h<56))return;     /* i tasti piccoli restano com'e' */
    var c=getComputedStyle(e);
    if(c.position==='fixed'||c.position==='sticky')return;
    var rad=parseFloat(c.borderTopLeftRadius)||0;
    var bl=parseFloat(c.borderLeftWidth)||0,bt=parseFloat(c.borderTopWidth)||0;
    var striscia=bl>=3&&c.borderLeftStyle==='solid';
    if((e.tagName==='BUTTON'||e.tagName==='A')&&(nera(c.backgroundColor)||!chiaro(c.backgroundColor)))return;
    if(chiaro(c.backgroundColor)&&!striscia&&w>=300&&h>=260&&rad<8&&bt===0){e.classList.add('ti-bgt');fatti.add(e);return}
    if(!(striscia||(chiaro(c.backgroundColor)&&(rad>=6||bt>=1))))return;
    if(rad>=h/2&&h<56&&!striscia)return;           /* pillole e tasti tondi: no */
    if(nera(c.backgroundColor))return;
    e.classList.add('ti-bb');fatti.add(e);
  }
  function scansiona(nodo){
    if(!nodo||nodo.nodeType!==1)return;
    esamina(nodo);
    var f=nodo.querySelectorAll?nodo.querySelectorAll('*'):[];
    for(var i=0;i<f.length;i++)esamina(f[i]);
  }
  var coda=[],uni=[],t=null;
  function lavora(){t=null;var c=coda,u=uni;coda=[];uni=[];for(var i=0;i<u.length;i++)if(u[i].isConnected)esamina(u[i]);for(var j=0;j<c.length;j++)if(c[j].isConnected)scansiona(c[j])}
  function pianifica(n){coda.push(n);if(!t)t=setTimeout(lavora,120)}
  function pianificaUno(n){uni.push(n);if(!t)t=setTimeout(lavora,120)}
  function avvia(){
    scansiona(document.body);
    new MutationObserver(function(ms){ms.forEach(function(m){
      if(m.type==='childList'){
        if(m.target.nodeType===1)pianificaUno(m.target);          /* il contenitore che si e' riempito */
        m.addedNodes.forEach(function(n){if(n.nodeType===1)pianifica(n)});
      }else if(m.type==='attributes'&&m.target.nodeType===1&&!(m.attributeName==='class'&&fatti.has(m.target)))pianifica(m.target);
    })}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});
  }
  if(document.body)avvia();else document.addEventListener('DOMContentLoaded',avvia);
})();
