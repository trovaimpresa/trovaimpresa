// [SPOSTATO] nol-avvio.js: era dentro nol-core.js, righe 6655-6687 del riferimento, spostato identico. nol-core.js non esiste piu': questo e' l'ultimo pezzo, quello che parte per ultimo. Contiene anche il blocco del login (onAuthStateChange / getSession), che e' stato messo qui perche' parte da solo e richiama funzioni di pezzi sotto.
  if(sb){
    sb.auth.onAuthStateChange((_e,s)=>{sbUid=s?s.user.id:null;logRuoloUtente(sbUid);backfillMestieri();renderGalleria();renderRiepilogo();renderCal();renderFatture();renderPromemoria();});
    /* ⛔ 14 settembre 2026 — I PROMEMORIA VANNO RIDISEGNATI ANCHE QUI.
       Le altre sezioni del noleggio leggono da `db()`, che c'e' gia' quando
       parte renderAll(). I promemoria no: li legge da Supabase, e quando
       renderAll() gira `sbUid` e' ancora null — usciva «Accedi per scriverli»
       e la sezione restava vuota anche da loggati. Trovato provando dal vivo,
       non leggendo il codice. */
    sb.auth.getSession().then(({data})=>{sbUid=data.session?data.session.user.id:null;backfillMestieri();renderGalleria();renderRiepilogo();renderCal();renderFatture();renderPromemoria();});
  }

  /* 24 agosto 2026 — «Lavori» e' sparito col reparto: qui c'erano i due
     collegamenti a #stato-chips/#f-search, che non esistono piu'. */
  if($("#lf-file"))$("#lf-file").onchange=e=>{uploadLavoroFoto(e.target.files);e.target.value="";};
  if($("#fatt-pdf-file"))$("#fatt-pdf-file").onchange=e=>{uploadFatturaPdf(e.target.files[0]);e.target.value="";};

  /* ⛔ 24 agosto 2026 — IL NOLEGGIO SI APRE GIA' DENTRO, SEMPRE.
     Fino a ieri si entrava dritti nell'ultimo reparto usato (22 agosto).
     Oggi il reparto e' sparito del tutto: non c'e' piu' niente da scegliere,
     si entra e basta. */
  /* ⛔ 22 agosto 2026 — IL NOLEGGIO E' SEMPRE BLU (invariato: lo faceva
     enterPanel() a ogni ingresso in un reparto, e serve ancora — il CSS di
     :root da solo non basta, css/gestionale.css lo sovrascrive col suo blu
     di marchio, che e' lo stesso colore ma non vince i confronti esatti). */
  (function(){
    const r=document.documentElement.style;
    r.setProperty("--accent","#0066ff");r.setProperty("--accent-d","#0047b3");r.setProperty("--accent-soft","#e8f1ff");
  })();
  (async()=>{
    await load();
    renderAll();renderRiepilogoNegozio();nolScriviFreccia();
  })();
