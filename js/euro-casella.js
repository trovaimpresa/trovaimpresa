/* ============================================================
   IL PUNTO DELLE MIGLIAIA NELLE CASELLE IN EURO
   ============================================================
   Chiesto da Alessio il 22 agosto 2026: «l'ho messo io, non esce di suo».

   A cosa serve: su una casella dove si scrive mezzo milione, «500000» e
   «500.000» sono lo stesso numero ma non si leggono uguale — il primo lo devi
   contare col dito. E se uno sbaglia una cifra (5000000 invece di 500000) a
   occhio nudo non se ne accorge, mentre 5.000.000 contro 500.000 si vede
   subito. Su un compenso quello zero in piu' vale decine di migliaia di euro.

   COME SI USA: si mette `data-euro` sulla casella. Basta quello.
   Niente da chiamare, niente da collegare: il file si mette in ascolto da
   solo su tutta la pagina, anche sui moduli che nascono dopo (e nel
   gestionale i moduli nascono tutti dopo, con innerHTML).

   ⛔ DOVE NON SI METTE, MAI:
   - quantita', misure, ore, litri, percentuali. Nel computo «0.500» vuol dire
     mezzo metro: un punto delle migliaia li' farebbe un disastro.
   - caselle il cui numero viene riletto con `parseFloat` o con `+valore`
     invece che con `_numIt`/`_numeroIt`. Quelle il punto non lo capiscono:
     `+"1.250"` fa 1,25. Al 22 agosto 2026 sono l'importo di Negozio e
     Noleggio e il prezzo della conferma del computo letto dal PDF
     (`.cp-prz`, che passa da `_numDa`).
     ⚠️ Prima di aggiungere un `data-euro` nuovo: guardare CHI legge quella
     casella. Se non e' `_numIt`, il punto NON si mette.

   ⚠️ I DECIMALI NON SI TOCCANO. Qui si raggruppano solo le migliaia. I
   prezzari regionali usano quattro decimali (numeric(14,4)): tagliarli a due
   vorrebbe dire cambiare un prezzo solo aprendo e richiudendo un modulo.

   ⚠️ MENTRE SI CORREGGE IN MEZZO A UN NUMERO NON SI TOCCA NIENTE. Riscrivere
   la casella sposta il cursore in fondo: se lo facessimo a ogni tasto,
   tornare indietro a correggere una cifra diventerebbe impossibile. Quello
   che resta storto si raddrizza da solo appena si esce dalla casella.
   ============================================================ */
(function(){
  'use strict';

  function formatta(el, forza){
    if(!el || el.tagName!=="INPUT") return;
    /* si riscrive solo se il cursore sta in fondo, cioe' mentre si scrive
       normalmente. Altrimenti si aspetta l'uscita dalla casella. */
    var inFondo = true;
    try{ inFondo = (el.selectionStart==null) || (el.selectionStart===el.value.length); }catch(e){}
    if(!inFondo && !forza) return;

    var grezzo = String(el.value==null?"":el.value);
    if(grezzo==="") return;
    var meno = /^\s*-/.test(grezzo);
    var pulito = grezzo.replace(/[^\d,]/g,"");     /* via punti, euro, spazi; la virgola resta */
    if(pulito===""){ if(grezzo!=="") el.value=""; return; }

    var parti  = pulito.split(",");
    var intero = parti[0].replace(/^0+(?=\d)/,"");             /* via gli zeri davanti */
    var dec    = (parti.length>1) ? ("," + parti.slice(1).join("")) : "";
    var conPunti = (intero===""?"0":intero).replace(/\B(?=(\d{3})+(?!\d))/g,".");
    var nuovo = (meno?"-":"") + conPunti + dec;
    if(nuovo===grezzo) return;

    el.value = nuovo;
    try{ el.setSelectionRange(nuovo.length, nuovo.length); }catch(e){}
  }

  /* raddrizza tutte le caselle gia' scritte dentro un pezzo di pagina */
  function tutte(root){
    var box = root || document;
    if(!box.querySelectorAll) return;
    var el = box.querySelectorAll("input[data-euro]");
    for(var i=0;i<el.length;i++){ el[i].setAttribute("data-euro-pronto","1"); formatta(el[i], true); }
  }

  function bersaglio(t){
    return t && t.tagName==="INPUT" && t.hasAttribute && t.hasAttribute("data-euro");
  }
  /* in CATTURA: cosi' la casella e' gia' a posto quando il gestionale legge
     il numero per rifare i suoi conti dal vivo */
  document.addEventListener("input",   function(e){ if(bersaglio(e.target)) formatta(e.target,false); }, true);
  document.addEventListener("focusout",function(e){ if(bersaglio(e.target)) formatta(e.target,true ); }, true);

  /* i moduli del gestionale nascono con innerHTML, gia' pieni dei valori
     salvati: quando compaiono, anche quelli vanno raddrizzati. */
  if(window.MutationObserver){
    var inCoda=false;
    var osserva=function(){
      if(inCoda) return;
      inCoda=true;
      var poi=function(){
        inCoda=false;
        var el=document.querySelectorAll("input[data-euro]:not([data-euro-pronto])");
        for(var i=0;i<el.length;i++){ el[i].setAttribute("data-euro-pronto","1"); formatta(el[i],true); }
      };
      if(window.requestAnimationFrame) window.requestAnimationFrame(poi); else setTimeout(poi,16);
    };
    var avvia=function(){
      new MutationObserver(osserva).observe(document.documentElement,{childList:true,subtree:true});
      osserva();
    };
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",avvia);
    else avvia();
  }

  window.euroCasella = { formatta: formatta, tutte: tutte };
})();
