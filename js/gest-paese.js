/* 15 nov 2026 (sesto giro, MANCA 4) — IL PAESE DEL CLIENTE.
   Un file solo, caricato dall'App e dal Noleggio: la tendina «Paese» della
   scheda cliente, il nome del paese da stampare e la domanda «è estero?».

   Nel database: gest_clienti.paese (sql/clienti-paese.sql), due lettere.
   VUOTO = ITALIA: i clienti di prima non si toccano.

   ⛔ Il file per lo SdI NON si fa per un cliente estero (regole da far
   confermare al commercialista): si ferma e lo dice (paeseEsteroSdi). */
(function(){
  "use strict";
  /* Italia per prima, poi i vicini, poi in ordine di nome */
  var PAESI=[
    ["IT","Italia"],
    ["SM","San Marino"],["VA","Città del Vaticano"],["CH","Svizzera"],["FR","Francia"],
    ["DE","Germania"],["AT","Austria"],["SI","Slovenia"],["HR","Croazia"],
    ["AL","Albania"],["AR","Argentina"],["AU","Australia"],["BE","Belgio"],["BR","Brasile"],
    ["BG","Bulgaria"],["CA","Canada"],["CN","Cina"],["CY","Cipro"],["DK","Danimarca"],
    ["AE","Emirati Arabi Uniti"],["EE","Estonia"],["FI","Finlandia"],["JP","Giappone"],
    ["GR","Grecia"],["IE","Irlanda"],["IS","Islanda"],["IL","Israele"],["LV","Lettonia"],
    ["LI","Liechtenstein"],["LT","Lituania"],["LU","Lussemburgo"],["MT","Malta"],
    ["MA","Marocco"],["MC","Monaco"],["ME","Montenegro"],["NO","Norvegia"],
    ["NL","Paesi Bassi"],["PL","Polonia"],["PT","Portogallo"],["GB","Regno Unito"],
    ["CZ","Repubblica Ceca"],["RO","Romania"],["RU","Russia"],["RS","Serbia"],
    ["SK","Slovacchia"],["ES","Spagna"],["US","Stati Uniti"],["SE","Svezia"],
    ["TN","Tunisia"],["TR","Turchia"],["UA","Ucraina"],["HU","Ungheria"]
  ];
  function pulito(p){ p=String(p==null?"":p).trim().toUpperCase(); return /^[A-Z]{2}$/.test(p)?p:""; }
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }

  /* "" se il cliente e' italiano (o non si sa), se no le due lettere */
  window.paeseEstero=function(c){
    var p=pulito(c&&typeof c==="object"?c.paese:c);
    return (p&&p!=="IT")?p:"";
  };
  window.paeseNome=function(p){
    p=pulito(p); if(!p) return "Italia";
    for(var i=0;i<PAESI.length;i++) if(PAESI[i][0]===p) return PAESI[i][1];
    return p;
  };
  /* in coda all'indirizzo stampato: «, Svizzera». Per l'Italia niente. */
  window.paeseCoda=function(c){
    var p=window.paeseEstero(c);
    return p?", "+window.paeseNome(p):"";
  };
  /* la frase che ferma il file per lo SdI ("" se il cliente e' italiano) */
  window.paeseEsteroSdi=function(c){
    var p=window.paeseEstero(c);
    return p?("Il cliente è estero ("+window.paeseNome(p)+"): il file per lo SdI di questa fattura fallo fare al commercialista."):"";
  };
  window.paeseTendina=function(id,val){
    var v=pulito(val)||"IT", h='<select id="'+esc(id)+'" data-paese="1">', trovato=false;
    for(var i=0;i<PAESI.length;i++){
      var s=PAESI[i][0]===v; if(s) trovato=true;
      h+='<option value="'+PAESI[i][0]+'"'+(s?" selected":"")+'>'+esc(PAESI[i][1])+'</option>';
    }
    if(!trovato) h+='<option value="'+esc(v)+'" selected>'+esc(v)+'</option>';
    return h+'</select>';
  };
  /* La scheda cliente cambia col paese: all'estero il CAP si scrive libero e
     la provincia non c'e'. Lo stesso pezzo per l'App (c-) e il Noleggio (ncl-). */
  window.paeseAdatta=function(pre){
    var q=function(s){ return document.getElementById(pre+s); };
    var sel=q("paese"), cap=q("cap"), prov=q("prov"); if(!sel||!cap) return;
    var est=!!window.paeseEstero(sel.value);
    if(est){ cap.removeAttribute("inputmode"); cap.setAttribute("maxlength","12"); cap.placeholder="Es. CH-6900"; }
    else   { cap.setAttribute("inputmode","numeric"); cap.setAttribute("maxlength","5"); cap.placeholder="Es. 02100"; }
    var fp=prov&&(prov.closest(".field")||prov.parentNode);
    if(fp) fp.style.display=est?"none":"";
    /* la frase rossa di prima («Il CAP è di 5 cifre») non vale piu': le due
       schede la tolgono da sole quando la casella «cambia» */
    try{ cap.dispatchEvent(new Event("change")); }catch(_){}
  };
  document.addEventListener("change",function(e){
    var t=e.target; if(!t||!t.dataset||t.dataset.paese!=="1") return;
    window.paeseAdatta(String(t.id||"").replace(/paese$/,""));
  });
})();
