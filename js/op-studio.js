/* ═══ 20 novembre 2026 — L'APP DEL COLLABORATORE PARLA DA STUDIO ═══════════
   Chiesto da Alex: sul telefono del collaboratore di uno studio tecnico l'app
   diceva «Lavori», «cantiere», «squadra», «Chat col capo», anche quando il
   titolare e' uno studio. Qualche pezzo era gia' tradotto (PAROLE / etic in
   js/op-agenda-giorno.js), tutto il resto no.

   COME FUNZIONA
   · Parte SOLO se MIO.tipoStudio === 'professionista' (lo legge boot() da
     gest_tipo_impresa). Per impresa, artigiano e negozio non fa niente: il
     testo resta quello scritto nei file, carattere per carattere.
   · Cambia solo le NOSTRE frasi: un elenco di pezzi di frase fissi (dai piu'
     lunghi ai piu' corti) + le parole sole («Lavori», «Cantiere»).
   · ⛔ NON tocca quello che ha scritto qualcuno: nomi dei clienti, descrizione
     della pratica, indirizzi, messaggi della chat, note, caselle e tendine
     (OP_STUDIO_SALTA). E' la stessa regola di _SKIP_UTENTE nel gestionale:
     un cliente «Edilcantiere Srl» non deve diventare un'altra cosa.
   · Un osservatore guarda la pagina: quello che i file disegnano dopo
     (schede, finestra «Segna la giornata», chat) passa di qui da solo.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  const OP_STUDIO_SALTA='textarea,input,select,option,.ch-t,.ch-n,.cli-card h3,.cli-info,.where,.op-voce,.op-voce-sez,.op-t,.op-cosa,.op-dove,.rap-nome,.sp-testo,.rv-scelta[data-lav],.istr,#lv-title,#lv-meta,#hd-name,#hd-imp,.job h3,.mg-r>div,.ti-orig';
  /* l'ordine conta: prima le frasi lunghe, poi i pezzi corti */
  const OP_STUDIO_FRASI=[
    ["Non sei ancora collegato a un'impresa. Apri il link di invito.","Non sei ancora collegato a uno studio. Apri il link di invito."],
    ["Non è la tua: qui entra il tuo operaio, con il suo account, e vede i lavori del giorno. Tu lo inviti dal gestionale: Squadra → «+ Nuova persona», poi apri la sua scheda e fagli inquadrare il QR.",
     "Non è la tua: qui entra il tuo collaboratore, con il suo account, e vede le pratiche del giorno. Tu lo inviti dal gestionale: Collaboratori → «+ Nuova persona», poi apri la sua scheda e fagli inquadrare il QR."],
    ["Per entrare usa il link che ti ha mandato la tua impresa.","Per entrare usa il link che ti ha mandato lo studio."],
    ["Non hai messo le ore a nessuno: la manodopera di oggi su questo lavoro resta a zero, e il margine del cantiere esce più alto del vero.",
     "Non hai messo le ore a nessuno: il tempo di oggi su questa pratica resta a zero, e il margine della pratica esce più alto del vero."],
    ["Qui le cose generali. Per un lavoro scrivi dentro il lavoro.","Qui le cose generali. Per una pratica scrivi dentro la pratica."],
    ["Puoi leggere le note, ma non cambiarle: il permesso «Note» ce l'ha il tuo capo.","Puoi leggere le note, ma non cambiarle: il permesso «Note» te lo dà il titolare."],
    ["Ancora nessuna foto. Le foto si aggiungono dentro il lavoro.","Ancora nessuna foto. Le foto si aggiungono dentro la pratica."],
    ["Foto, spese e bolla: la controlla il capo","Foto e spese: la controlla il titolare"],
    ["Scrivi o parla: ore, materiali e spese insieme","Scrivi o parla: ore, cosa hai fatto e spese insieme"],
    ["Vuoto: non hai parlato di materiali","Vuoto: non hai detto cosa hai fatto"],
    ["Scrivi in quale cantiere hai lavorato.","Scrivi su quale pratica o sopralluogo hai lavorato."],
    ["Questi soldi entrano nel conto di questo cantiere.","Questi soldi entrano nel conto di questa pratica."],
    ["Per quelle di tutta la squadra c’è il rapportino, dentro il lavoro","Per quelle di tutti i collaboratori c’è il rapportino, dentro la pratica"],
    ["Queste persone non sono nella squadra di questo lavoro.","Queste persone non sono fra i collaboratori di questa pratica."],
    ["Non riesco a leggere la squadra di questo lavoro.","Non riesco a leggere i collaboratori di questa pratica."],
    ["Non riesco a leggere la squadra.","Non riesco a leggere i collaboratori."],
    ["Squadra non leggibile.","Collaboratori non leggibili."],
    ["nessun lavoro assegnato","nessuna pratica assegnata"],
    ["su un lavoro","su una pratica"],
    ["il permesso sui Lavori","il permesso sulle Pratiche"],
    ["anche Lavori, Clienti, Fatture o Pagamenti","anche Pratiche, Clienti, Fatture o Pagamenti"],
    ["Da fatturare (lavori finiti)","Da fatturare (pratiche finite)"],
    ["Nessun lavoro finito da fatturare.","Nessuna pratica finita da fatturare."],
    ["Questo lavoro non risulta tra i tuoi.","Questa pratica non risulta tra le tue."],
    ["Divise per lavoro: dal capo, in corso e finito.","Divise per pratica: dallo studio, in corso e finita."],
    ["Nome (cliente o lavoro)","Nome (cliente o pratica)"],
    ["Messaggi su questo lavoro","Messaggi su questa pratica"],
    ["Le voci del lavoro","Le voci della pratica"],
    ["Foto del lavoro","Foto della pratica"],
    ["Lavori di adesso","Pratiche di adesso"],
    ["Lavori di oggi","Pratiche di oggi"],
    ["Lavori del ","Pratiche del "],
    ["Lavori vecchi","Pratiche vecchie"],
    ["Nessun lavoro vecchio.","Nessuna pratica vecchia."],
    ["Lavoro senza nome","Pratica senza nome"],
    ["Lavoro finito","Pratica finita"],
    ["Segna come fatto","Segna come fatta"],
    ["Su quale lavoro?","Su quale pratica?"],
    ["Scegli il lavoro","Scegli la pratica"],
    ["Apri il lavoro","Apri la pratica"],
    ["Chat col capo","Chat con lo studio"],
    ["Foto dal capo","Foto dallo studio"],
    ["Video dal capo","Video dallo studio"],
    ["Nessuna foto dal capo.","Nessuna foto dallo studio."],
    ["Nessun video dal capo.","Nessun video dallo studio."],
    ["Nessun video dal capo.","Nessun video dallo studio."],
    ["Il capo ti ha scritto","Il titolare ti ha scritto"],
    ["il capo l'ha scartata","il titolare l'ha scartata"],
    ["aspetta il capo","aspetta il titolare"],
    ["Manda al capo","Manda al titolare"],
    ["Mandata al capo","Mandata al titolare"],
    ["Scrivi al capo","Scrivi al titolare"],
    ["Nota del capo","Nota del titolare"],
    ["crediti AI dell’impresa","crediti AI dello studio"],
    ["credito AI dell’impresa","credito AI dello studio"],
    ["L’impresa non ha","Lo studio non ha"],
    ["L’impresa ha finito","Lo studio ha finito"],
    ["la tua impresa","lo studio"],
    ["Il tuo capo","Il titolare"],
    ["il tuo capo","il titolare"],
    ["al tuo capo","al titolare"],
    ["Dillo al capo","Dillo al titolare"],
    ["dillo al capo","dillo al titolare"],
    ["Chiedi al capo","Chiedi al titolare"],
    ["chiedi al capo","chiedi al titolare"],
    ["al capo","al titolare"],
    ["Il capo","Il titolare"],
    ["il capo","il titolare"],
    ["su questo lavoro","su questa pratica"],
    ["per questo lavoro","per questa pratica"],
    ["di questo lavoro","di questa pratica"],
    ["questo lavoro","questa pratica"],
    ["dentro ogni lavoro","dentro ogni pratica"],
    ["nessun lavoro","nessuna pratica"],
    ["Nessun lavoro","Nessuna pratica"]
  ];
  /* le parole sole: un pulsante o un titolo che dice solo quella */
  const OP_STUDIO_SOLE={"Lavori":"Pratiche","Lavoro":"Pratica","Cantiere":"Pratica o sopralluogo","Materiali":"Cosa hai fatto","Materiale":"Cosa hai fatto","Squadra":"Collaboratori","Bolla o fattura":"Ricevuta o fattura","Fotografa la bolla":"Fotografa la ricevuta"};
  const OP_STUDIO_TRIGGER=/lavor[oi]\b|Lavor[oi]\b|cantiere|Cantiere|squadra|Squadra|\bcapo\b|impresa|operaio|Materiali?|materiali|[Bb]olla|Segna come fatto/;

  function opStudioFrase(s){
    if(!s||!OP_STUDIO_TRIGGER.test(s))return s;
    const t=s.trim();
    if(OP_STUDIO_SOLE[t])return s.replace(t,OP_STUDIO_SOLE[t]);
    for(const f of OP_STUDIO_FRASI){ if(s.indexOf(f[0])>=0)s=s.split(f[0]).join(f[1]); }
    /* i conti: «3 lavori da fare» → «3 pratiche da fare» */
    s=s.replace(/(\d+)\s+lavori\b/g,"$1 pratiche").replace(/(\d+)\s+lavoro\b/g,"$1 pratica")
       .replace(/\blavori? da fare\b/g,function(m){return m.indexOf("lavori")===0?"pratiche da fare":"pratica da fare";});
    return s;
  }
  /* 20 nov 2026 (sera, chiesto da Alex) — PRIMA DI ENTRARE.
     La schermata d'ingresso e il nome dell'icona arrivano prima che l'app sappia
     chi e' il titolare. Allora ci si ricorda che e' di uno studio: lo scrive il
     link dell'invito («&studio=1», gestionale-invito.html) e lo riscrive l'app
     ogni volta che il titolare si sa (localStorage «ti_op_studio»).
     Quando il titolare si sa, vince sempre lui. */
  function opStudioRicordato(){
    try{ if(new URLSearchParams(location.search).get("studio")==="1")return true; }catch(_){}
    try{ return localStorage.getItem("ti_op_studio")==="1"; }catch(_){ return false; }
  }
  function opStudioAttivo(){
    try{
      if(typeof MIO!=="undefined"&&MIO&&MIO.tipoStudio)return MIO.tipoStudio==='professionista';
      return opStudioRicordato();
    }catch(_){ return false; }
  }
  /* il titolare adesso si sa: lo si scrive per la prossima volta */
  function opStudioRicorda(){
    try{
      if(typeof MIO==="undefined"||!MIO||!MIO.tipoStudio)return;
      if(MIO.tipoStudio==='professionista')localStorage.setItem("ti_op_studio","1");
      else{
        localStorage.removeItem("ti_op_studio");
        /* ci si ricordava di uno studio, ma il titolare e' un'impresa: nome di prima */
        const m=document.querySelector('link[rel="manifest"]');
        if(m&&/studio/.test(m.getAttribute("href")||""))m.setAttribute("href","/manifest-operaio.json");
        const t=document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if(t&&t.getAttribute("content")==="Studio")t.setAttribute("content","Cantiere");
      }
    }catch(_){}
  }
  /* il nome sotto l'icona: «Studio» invece di «Cantiere». Vale per chi la mette
     sul telefono da adesso (Android lo legge dal manifest, iPhone dalla riga
     apple-mobile-web-app-title). Un'icona gia' messa non cambia nome da sola. */
  function opStudioIcona(){
    try{
      const m=document.querySelector('link[rel="manifest"]');
      if(m&&!/studio/.test(m.getAttribute("href")||""))m.setAttribute("href","/manifest-operaio-studio.json");
      const t=document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if(t&&t.getAttribute("content")!=="Studio")t.setAttribute("content","Studio");
    }catch(_){}
  }

  function opStudioGiro(root){
    if(!root||!opStudioAttivo())return;
    /* finche' il titolare non si sa, ci si fida del ricordo SOLO per la
       schermata d'ingresso: l'app vera aspetta di sapere chi e' (se no un
       collaboratore passato a un'impresa vedrebbe «Pratiche» per sempre) */
    try{
      if(!(typeof MIO!=="undefined"&&MIO&&MIO.tipoStudio)){
        const el=root.nodeType===1?root:root.parentElement;
        if(!el||!el.closest||!el.closest("#gate"))return;
      }
    }catch(_){ return; }
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(t){
      return (t.parentElement&&t.parentElement.closest(OP_STUDIO_SALTA))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    const nodi=[];while(w.nextNode())nodi.push(w.currentNode);
    nodi.forEach(function(t){ const v=t.nodeValue; const nv=opStudioFrase(v); if(nv!==v)t.nodeValue=nv; });
    /* i suggerimenti grigi e le scritte per chi non vede li abbiamo scritti noi */
    (root.querySelectorAll?root:document).querySelectorAll('[placeholder],[title],[aria-label]').forEach(function(el){
      if(el.closest('.ch-t,.ch-n,.op-t,.op-cosa,.cli-card h3'))return;
      ['placeholder','title','aria-label'].forEach(function(a){
        const v=el.getAttribute(a); if(!v)return; const nv=opStudioFrase(v); if(nv!==v)el.setAttribute(a,nv);
      });
    });
  }
  let _oss=null, _inGiro=false;
  function opStudioAccendi(){
    opStudioRicorda();
    if(!opStudioAttivo())return;
    opStudioIcona();
    if(!/dello studio/.test(document.title))document.title=document.title.replace(/agenda/i,"agenda dello studio");
    ["#gate","#app","#rv-ov","#toast"].forEach(function(q){ opStudioGiro(document.querySelector(q)); });
    if(_oss)return;
    _oss=new MutationObserver(function(muts){
      if(_inGiro)return; _inGiro=true;
      try{ muts.forEach(function(m){
        if(m.type==="characterData"){ const p=m.target.parentNode; if(p&&p.nodeType===1)opStudioGiro(p); }
        else m.addedNodes.forEach(function(n){ if(n.nodeType===1)opStudioGiro(n); else if(n.nodeType===3&&n.parentNode)opStudioGiro(n.parentNode); });
      }); }finally{ _inGiro=false; }
    });
    _oss.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  window.opStudioAccendi=opStudioAccendi;
  window.opStudioFrase=opStudioFrase;
  /* boot() chiama adattaParole() appena sa il mestiere: ci si attacca li',
     senza toccare boot. Se adattaParole non c'e', si riprova ogni tanto. */
  function aggancia(){
    if(typeof adattaParole!=="function"){ return false; }
    if(adattaParole.__studio)return true;
    const vecchia=adattaParole;
    const nuova=function(){ const r=vecchia.apply(this,arguments); try{ opStudioAccendi(); }catch(_){} return r; };
    nuova.__studio=true;
    window.adattaParole=nuova;
    try{ adattaParole=nuova; }catch(_){}
    return true;
  }
  if(!aggancia()) document.addEventListener("DOMContentLoaded",aggancia);
  /* se il mestiere era gia' noto prima che questo file arrivasse */
  setTimeout(function(){ try{ opStudioAccendi(); }catch(_){} },0);
  /* e se boot() ha chiamato adattaParole PRIMA che questo file arrivasse
     (rete lenta): si guarda ancora per qualche secondo, poi basta */
  let _giri=0;
  const _t=setInterval(function(){
    _giri++;
    try{ if(typeof MIO!=="undefined"&&MIO&&MIO.tipoStudio){ opStudioAccendi(); clearInterval(_t); } }catch(_){}
    /* il cancello compare senza che il titolare si sappia: se ci si ricorda dello studio, si traduce */
    try{ if(opStudioRicordato())opStudioAccendi(); }catch(_){}
    if(_giri>40)clearInterval(_t);
  },500);
})();
