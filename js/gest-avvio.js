// [SPOSTATO] gest-avvio.js: era dentro gest-core.js, righe 12572-12657, spostato identico. gest-core.js non esiste piu': questo e' l'ultimo pezzo, quello che parte per ultimo.
  /* ============================================================
     ⛔ 5 SETTEMBRE 2026 — APRENDO IL GESTIONALE SI VEDE LA SCHERMATA
        DEI REPARTI, NON L'ULTIMO REPARTO DI IERI
     ============================================================
     Alessio, con due fotografie: «ogni volta che apro il gestionale si apre
     questa finestra (dentro il reparto «progetto casa», sezione Assistenza
     diretta), invece si deve aprire quella dei reparti».
     ⚠️ NON si toglie la memoria dell'ultimo reparto: il →23← agosto era
     stata messa apposta, perche' uscendo dal NOLEGGIO si finiva sulla
     schermata dei reparti e Alessio disse «mi fa uscire completamente».
     Le due cose non litigano se si distingue COME si e' arrivati qui:
       · si ARRIVA DA UN'ALTRA PAGINA DEL GESTIONALE (noleggio, negozio,
         config, operatore) -> si rientra dritti dov'era: e' un rientro.
       · si APRE il gestionale (dal pannello, da un preferito, scrivendo
         l'indirizzo, dalla barra FONDATORE) -> schermata dei reparti.
       · c'e' un link diretto con il cancelletto (#preventivi) -> comanda
         quello, come prima, se no il link non aprirebbe piu' niente.
     Cosi' l'ultimo reparto resta scritto (`gest_ultimo_reparto`) e la
     freccia «Indietro» continua a funzionare come sempre. */
  /* ⚠️ IL BIGLIETTINO HA UNA SCADENZA (→10← secondi), e non e' un vezzo.
     Chi torna dal Noleggio ci arriva con `history.back()`: se il browser
     ripesca la pagina dalla memoria (bfcache) questo codice non gira
     nemmeno, e il bigliettino resterebbe scritto. Mezz'ora dopo, aprendo
     il gestionale da zero nella stessa scheda, quel bigliettino vecchio lo
     rispedirebbe dentro al reparto — cioe' esattamente il difetto che
     stiamo togliendo. Con la scadenza un bigliettino vecchio non vale. */
  function _rientroDaGestionale(){
    try{
      const t=parseInt(sessionStorage.getItem("gest_rientro")||"0",10);
      sessionStorage.removeItem("gest_rientro");
      if(t && (Date.now()-t) < 10000) return true;
    }catch(e){}
    try{
      if(!document.referrer) return false;
      const u=new URL(document.referrer);
      if(u.origin!==location.origin) return false;
      return /gestionale-(noleggio|negozio|config|operatore)/.test(u.pathname);
    }catch(e){ return false; }
  }

  /* ⛔ 20 settembre 2026 — IL PROMEMORIA AL RITORNO DALL'ABBONAMENTO.
     Scelta di Alessio: quando uno disdice NON lo si obbliga a esportare —
     «non deve essere obbligato a esportare ma un consiglio». Chi ha gia'
     scaricato si troverebbe un passaggio in piu' proprio mentre se ne va, e
     chi non scarica puo' tornare a farlo quando vuole (anche dal muro del
     pagamento, da oggi). Quindi: una riga, un tasto, e si chiude.
     ⚠️ NON sappiamo se ha davvero disdetto: dal portale di Stripe si torna
     indietro uguale che uno abbia cambiato la carta, cambiato piano o
     disdetto. Per questo la frase dice «se hai disdetto», e non da' per
     scontato niente.
     ⚠️ Il bigliettino scade dopo 30 minuti e si cancella appena letto: uno
     che riapre il gestionale domani non se lo ritrova addosso. */
  function _rientroAbbonamento(){
    var t=0;
    try{ t=parseInt(sessionStorage.getItem("gest_da_abbonamento")||"0",10);
         sessionStorage.removeItem("gest_da_abbonamento"); }catch(e){}
    if(!t || (Date.now()-t) > 1800000) return;
    var land=document.querySelector("#landing .landing-top");
    if(!land) return;
    var d=document.createElement("div");
    d.className="rientro-abb";
    d.innerHTML='<div class="rientro-abb-txt"><b>Bentornato.</b> Se hai disdetto, '
      + 'i tuoi dati restano tuoi: puoi portarteli via quando vuoi.</div>';
    var b=document.createElement("button");
    b.type="button"; b.className="rientro-abb-btn"; b.textContent="Scarica i tuoi dati";
    b.onclick=function(){ esportaExcel(); };
    var x=document.createElement("button");
    x.type="button"; x.className="rientro-abb-x"; x.setAttribute("aria-label","Chiudi"); x.textContent="\u00d7";
    x.onclick=function(){ d.remove(); };
    d.appendChild(b); d.appendChild(x);
    land.insertAdjacentElement("afterend", d);
  }

  load().then(()=>{
    _rientroAbbonamento();
    if(cur) return;
    renderLanding();
    /* e poi, se si sa dove si era, si entra dritti: la landing resta
       disegnata sotto, cosi' la freccia trova gia' tutto pronto. */
    const ps=state.panels||[];
    let id=null; try{id=localStorage.getItem(GEST_ULTIMO);}catch(e){}
    if(id&&ps.some(p=>p.id===id&&!p.cestinato)&&(_deepTab||_rientroDaGestionale())) enterPanel(id);
    /* il secondo dei due punti: adesso i reparti del browser ci sono. Se
       l'utente non si sa ancora, questa non fa niente e ci pensa _authRefresh. */
    pulisciRepartiSpariti();
  });
