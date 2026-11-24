/* ============================================================
   24 nov 2026 — STUDIO TECNICO: VOCI UNITE CON LE LINGUETTE
   (sì di Alex, foto approvate). Come «Mezzi e attrezzature»,
   «Scadenze e promemoria» e «Squadra e agenda»: NON si cancella niente.
   - «Computo e SAL»          = Computo metrico + Stati di avanzamento
   - «Preventivi e richieste» = Preventivi + Richieste dal sito
   (Collaboratori + Agenda: in js/gest-squadra.js, agUnisci)
   Le sezioni #sal e #dalsito restano, e restano i loro pulsanti nel menu,
   solo che non si vedono (classe .st-dentro): chi li «preme» da fuori
   (Assistente, Chat [vai:sal], #dalsito, «Fai un SAL») arriva lo stesso.
   Il pallino delle richieste da fare (#cnt-dalsito) passa sulla voce
   Preventivi: è lo stesso elemento, spostato, quindi il numero resta
   identico a quello dell'Assistente.
   Solo per lo studio (ruoloUtente==='professionista').
   ============================================================ */
(function(){
  var COPPIE=[
    {a:"computi",b:"sal",tutto:"Computo e SAL",
     la:"Computi",lb:"Stati di avanzamento",lbC:"SAL",nomeA:"Computo metrico"},
    {a:"preventivi",b:"dalsito",tutto:"Preventivi e richieste",
     la:"Preventivi",lb:"Richieste dal sito",lbC:"Dal sito",nomeA:"Preventivi",cnt:"#cnt-dalsito"}
  ];
  function nascosto(t){
    try{
      var b=document.querySelector('nav.tabs button[data-tab="'+t+'"]');
      if(!b)return true;
      if(typeof tabNascosto==="function"&&tabNascosto(t))return true;
      if(t==="computi"||t==="sal"){var tc=document.querySelector("#tab-computi");if(tc&&tc.style.display==="none")return true;}
      return false;
    }catch(e){return true;}
  }
  function stUnita(c){
    try{
      if(typeof ruoloUtente==="undefined"||ruoloUtente!=="professionista")return false;
      return !nascosto(c.a)&&!(typeof tabNascosto==="function"&&tabNascosto(c.b));
    }catch(e){return false;}
  }
  function mid(){try{return typeof curMestiere==="function"?curMestiere():null;}catch(e){return null;}}
  function letto(t){return !!(window._stLetti&&window._stLetti[t]!=null&&window._stLetti[t]===mid());}
  function conta(t){
    if(!letto(t))return null;
    try{
      if(t==="computi")return (typeof compCache!=="undefined"&&compCache&&compCache.length!=null)?compCache.length:null;
      if(t==="sal")return (typeof salTuttiCache!=="undefined"&&salTuttiCache)?salTuttiCache.length:null;
      if(t==="preventivi")return (typeof prevCache!=="undefined"&&prevCache)?prevCache.length:null;
      if(t==="dalsito")return (typeof dsCache!=="undefined"&&dsCache)?dsCache.filter(function(r){return r._stato==="nuova";}).length:null;   /* = pallino del menu e Assistente («da aprire») */
    }catch(e){}
    return null;
  }
  function stUnisci(){
    COPPIE.forEach(function(c){
      var uni=stUnita(c);
      var bA=document.querySelector('nav.tabs button[data-tab="'+c.a+'"]'),
          bB=document.querySelector('nav.tabs button[data-tab="'+c.b+'"]');
      if(bB)bB.classList.toggle("st-dentro",uni);
      if(uni&&bA&&bB&&bB.classList.contains("active"))bA.classList.add("active");
      if(bA){var s=bA.querySelector("span");var t=uni?c.tutto:c.nomeA;if(s&&s.textContent!==t)s.textContent=t;}
      /* il pallino della voce nascosta va sulla voce che si vede */
      if(c.cnt){
        var n=document.querySelector(c.cnt);
        if(n&&bA&&bB){var dove=uni?bA:bB;if(n.parentNode!==dove)dove.appendChild(n);}
        if(n)n.title=uni?"Richieste dal sito da fare":(n.title||"");
      }
      var nA=conta(c.a),nB=conta(c.b);
      var lab=function(t,n){return t+(n!=null?" ("+n+")":"");};
      [c.a,c.b].forEach(function(id){
        var sec=document.getElementById(id);if(!sec)return;
        var sh=sec.querySelector(".sec-head");if(!sh)return;
        var h=sh.querySelector("h2");
        if(h){
          if(uni){if(!h.dataset.stNome)h.dataset.stNome=h.textContent;if(h.textContent!==c.tutto)h.textContent=c.tutto;}
          else if(h.dataset.stNome){h.textContent=h.dataset.stNome;delete h.dataset.stNome;}
        }
        var g=sec.querySelector(".st-ling");
        if(!uni){if(g)g.remove();return;}
        if(!g){g=document.createElement("div");g.className="segm mz-ling st-ling";sh.after(g);}
        var html='<button type="button" data-st="'+c.a+'"'+(id===c.a?' class="on"':'')+'>'+lab(c.la,nA)+'</button>'
          +'<button type="button" data-st="'+c.b+'"'+(id===c.b?' class="on"':'')+'>'
          +'<span class="st-lung">'+lab(c.lb,nB)+'</span><span class="st-corto">'+lab(c.lbC,nB)+'</span></button>';
        if(g.innerHTML!==html)g.innerHTML=html;
      });
      /* il numero dell'altra linguetta: se non è ancora letto si legge una volta, in silenzio */
      if(uni)[c.a,c.b].forEach(function(t){
        if(letto(t))return;
        window._stCarico=window._stCarico||{};
        if(window._stCarico[t]===mid())return;
        window._stCarico[t]=mid();
        var f=null;
        try{
          if(t==="computi"&&typeof renderComputi==="function")f=renderComputi;
          else if(t==="sal"&&typeof renderSalTutti==="function")f=renderSalTutti;
          else if(t==="preventivi"&&typeof renderPreventivi==="function")f=renderPreventivi;
          else if(t==="dalsito"&&typeof renderDalSito==="function")f=renderDalSito;
          if(f)Promise.resolve(f()).catch(function(){});
        }catch(e){}
      });
    });
  }
  window.stUnisci=stUnisci;
  window.stSegnaLetto=function(t){window._stLetti=window._stLetti||{};window._stLetti[t]=mid();try{stUnisci();}catch(e){}};
  if(!window.__stAscolto){
    window.__stAscolto=1;
    document.addEventListener("click",function(e){
      var b=e.target.closest&&e.target.closest("[data-st]");if(!b||b.classList.contains("on"))return;
      var v=document.querySelector('nav.tabs button[data-tab="'+b.getAttribute("data-st")+'"]');
      if(v)v.click();
    });
  }
})();
