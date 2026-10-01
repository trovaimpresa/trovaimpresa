// [SPOSTATO] op-salvataggio-lavoro.js: era dentro op-core.js, righe 1765-1830, spostato identico.
/* ============================================================
   ⛔ 22 agosto 2026 — «SALVATO ✔» CHE NON ERA SALVATO
   ============================================================
   Quando la regola del database rifiuta la riga, PostgREST NON risponde
   con un errore: risponde "va bene, ho cambiato zero righe". Qui sotto si
   guardava solo l'errore, quindi il collaboratore leggeva
   «Segnato come fatto ✔», tornava a casa convinto, e nel gestionale del
   titolare il lavoro restava aperto. Nessuno dei due lo sapeva.

   ⚠️ E la pagina non puo' saperlo da sola: il pulsante delle note chiede il
   permesso «note», ma la riga che scrive sta in gest_lavori, che il database
   protegge col permesso «lavori». Due parole diverse per la stessa cosa: il
   controllo della pagina NON e' il controllo del database.
   (Oggi chi non ha «lavori» non arriva nemmeno ad aprire un lavoro, quindi a
   schermo quel caso non si vede — controllato. Ma la risposta del database
   resta l'unica che conta, e va guardata.)

   Adesso si chiede indietro la riga scritta (.select("id")): se non torna
   niente, non e' stato scritto niente, e si dice.
   ⚠️ Questo funziona perche' chi puo' MODIFICARE un lavoro puo' anche
   LEGGERLO (lavori_update vuole il permesso «lavori», lavori_read si
   accontenta di «lavori» oppure «fatture»): se un giorno quelle due regole
   cambiassero, un salvataggio riuscito potrebbe tornare vuoto e questa
   scritta direbbe una bugia al contrario.
   ============================================================ */
const NIENTE_PERMESSO="Non l'ho segnato: il capo non ti ha dato il permesso sui Lavori. Chiediglielo e riprova.";
async function scriviLavoro(patch){
  const r=await sb.from("gest_lavori").update(patch).eq("id",curLavoro.id).select("id");
  if(r&&r.error)return {ok:false,msg:"Non salvato: "+(r.error.message||"errore")};
  if(!r||!r.data||!r.data.length)return {ok:false,msg:NIENTE_PERMESSO};
  return {ok:true};
}

/* salva note */
$("#btn-salva").onclick=async()=>{
  if(!curLavoro)return;
  if(!chiedoPermesso("note","di scrivere le note"))return;
  const txt=$("#lv-note").value;
  $("#btn-salva").disabled=true;
  const r=await scriviLavoro({lavoro_svolto:txt});
  $("#btn-salva").disabled=false;
  if(!r.ok){toast(r.msg);return;}
  curLavoro.lavoro_svolto=txt;const l=LAVORI.find(x=>x.id===curLavoro.id);if(l)l.lavoro_svolto=txt;
  toast("Salvato ✔");
};

/* segna fatto */
$("#btn-fatto").onclick=async()=>{
  if(!curLavoro)return;
  $("#btn-fatto").disabled=true;
  const r=await scriviLavoro({stato:"fatto",data_fatto:ymd(new Date())});
  $("#btn-fatto").disabled=false;
  if(!r.ok){toast(r.msg);return;}
  curLavoro.stato="fatto";const l=LAVORI.find(x=>x.id===curLavoro.id);if(l){l.stato="fatto";l.data_fatto=ymd(new Date());}
  toast("Segnato come fatto ✔");
  openLavoro(curLavoro.id);
};

/* esci */
$("#btn-esci").onclick=async()=>{await sb.auth.signOut();gate("Sei uscito. Per rientrare apri il tuo link di invito.");};
$("#nav-agenda").onclick=()=>{renderCal();renderDay();show("agenda");};
$("#nav-clienti").onclick=async()=>{await loadClienti();show("clienti");};
$("#nav-scadenze").onclick=async()=>{await loadScadenze();show("scadenze");};
$("#nav-fatture").onclick=async()=>{await loadFatture();show("fatture");};
$("#fatt-pdf-file").onchange=e=>{uploadFatturaPdf(e.target.files[0]);e.target.value="";};

