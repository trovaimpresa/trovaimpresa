  /* ============================================================
     GALLERIA E MAPPA — staccate il 6 settembre 2026
     Fetta G dello smontaggio di gestionale-app.html.

     · GALLERIA — le foto e i video dei lavori: l'elenco, i filtri per
       operatore e per lavoro, il caricamento, le firme temporanee dei file
       (durano un'ora, entro i 50 minuti si riusano invece di richiederle) e
       la cancellazione.
     · MAPPA — i cantieri aperti con un indirizzo, gli spilli, la distanza
       dall'ufficio. Leaflet si scarica al primo uso, non prima.

     ⚠️ _fileOrfano NON sta qui, ed e' voluto: toglie un file dal magazzino
     quando la sua riga sparisce, e lo usano altri OTTO punti del gestionale
     (foto, video, allegati, documenti). E' un aiuto di tutti, non della
     Galleria: e' rimasto nel nucleo della pagina.

     ⚠️ Roba di qui che serve anche fuori — non cancellarla credendola
     inutile: galNomeOp, mpFormattaKm, mpCaricaLeaflet, MP_CACHE_KEY,
     galVideoCache.

     ⚠️ FILE APERTO (niente IIFE), come gli altri gest-*.js: vive nello
     stesso spazio della pagina, quindi vede sb, sbUid, esc, toast, $ e
     compagnia — e un nome dichiarato qui non deve esistere altrove.
     Il banco lo controlla: prove-claude/banchi-fissi/smontaggio/banco-fette.js
     ============================================================ */

  /* ⛔ 6 settembre 2026 — QUESTA RIGA HA SPENTO LA GALLERIA E LA MAPPA.
     Prima era «const GAL_VUOTO=_SVGV+'...'», cioe' si costruiva NEL MOMENTO
     in cui il file nasce. Ma _SVGV e' dichiarato dentro gestionale-app.html,
     che parte DOPO questo file: alla prima riga il file moriva, e tutto
     quello che veniva dopo — renderGalleria, renderMappa, il caricamento
     delle foto — non nasceva proprio. A schermo non usciva nessun errore:
     la Galleria mostrava zero foto e la Mappa zero spilli, come se non ci
     fosse niente da vedere. La bugia piu' silenziosa che ci sia.
     Adesso e' una FUNZIONE: si costruisce quando serve, e quando serve la
     pagina e' gia' partita da un pezzo.
     ⚠️ REGOLA GENERALE PER LE FETTE CHE VERRANNO: in un file staccato,
     al primo livello non si puo' USARE niente che stia nella pagina —
     lo si puo' solo nominare dentro una funzione. */
  const GAL_VUOTO=()=>_SVGV+'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
  /* 24 nov 2026 (collaudo Galleria dello studio) — LE PAROLE DELLO STUDIO.
     Il traduttore dello studio non arrivava ai bottoni «Prima<span> del
     lavoro</span>» (la frase spezzata da uno span non combacia) e traduceva
     il resto in «Prima della pratica / A pratica finita», che un geometra non
     dice. Allo studio le foto sono quelle del sopralluogo (prima dei lavori)
     e quelle a fine lavori; chi carica e' «Io», non «Capo».
     Tutto in un posto solo: _galPro() e _galParola(). */
  function _galPro(){return ruoloUtente==='professionista';}
  function _galTag(q){return q==="prima"?"Prima":(_galPro()?"Fine lavori":"Finito");}
  function galParole(){
    const pro=_galPro();
    const intro=document.querySelector("#galleria .gal-intro");
    if(intro&&!intro.dataset.impresa)intro.dataset.impresa=intro.innerHTML;
    if(intro)intro.innerHTML=pro
      ?"Le foto del <b>sopralluogo</b> e del rilievo, e quelle <b>a fine lavori</b>, divise per pratica."
      :intro.dataset.impresa;
    const bP=document.querySelector('#gal-tipo [data-v="prima"]'), bD=document.querySelector('#gal-tipo [data-v="dopo"]');
    if(bP)bP.innerHTML='<span class="gal-pc">'+(pro?"Prima dei lavori":"Prima del lavoro")+'</span><span class="gal-tel">Prima</span>';
    if(bD)bD.innerHTML='<span class="gal-pc">'+(pro?"Fine lavori":"A lavoro finito")+'</span><span class="gal-tel">'+(pro?"Fine lavori":"Finito")+'</span>';
  }
  /* la Galleria aperta su una pratica sola (da «Guarda in Galleria» e da «📷 Foto») */
  function galApriPratica(id){
    galFilter.lav=String(id||"");galFilter.media="";galFilter.tipo="";galFilter.op="";
    closeSheet();
    const b=document.querySelector('nav.tabs button[data-tab="galleria"]');
    if(b)b.click();
    segmOn("#gal-media","");segmOn("#gal-tipo","");
    renderGalleria();window.scrollTo(0,0);
  }
  function galVuoto(box){
    box.style.display="block";
    box.innerHTML=tabVuoto("Nessuna foto o video da mostrare","Usa il pulsante «Carica foto o video» qui sopra, oppure cambia i filtri.",GAL_VUOTO());
  }
  /* ================= GALLERIA =================
     Da qui si carica, si guarda e si elimina. Prima la Galleria sapeva solo
     mostrare le foto: caricare ed eliminare si poteva fare unicamente dalla
     scheda del lavoro, e i video non si vedevano affatto.
     Ogni sezione fa il suo mestiere: le foto e i video sono mestiere di qui.
     ============================================ */

  /* 19 nov 2026 — la foto a tutto schermo si chiude anche col tasto Esc.
     «capture» e stop: se la foto e' stata aperta da dentro un lavoro, Esc
     chiude la foto e basta, non anche la finestra del lavoro sotto. */
  document.addEventListener("keydown",function(e){
    const lb=document.getElementById("lightbox");
    if(!lb||!lb.classList.contains("open"))return;
    if(e.key==="Escape"){e.preventDefault();e.stopPropagation();galChiudiVedi();return;}
    /* le frecce della tastiera: foto prima / dopo, solo se aperta dalla Galleria */
    if(lb.classList.contains("lb-gal")&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){
      e.preventDefault();e.stopPropagation();galSposta(e.key==="ArrowLeft"?-1:1);
    }
  },true);

  /* ===== 19 nov 2026 — LA FOTO GRANDE: SCARICA, CHIUDI, FRECCE (sì di Alex) =====
     Prima la foto a tutto schermo era solo l'immagine: niente pulsanti, per
     chiudere si toccava lo sfondo, per vedere la dopo si chiudeva e si
     riapriva, e non si poteva scaricare. I video si aprivano in un'altra pagina.
     Adesso dalla Galleria si apre «galVedi»: barra in alto con il lavoro,
     «Scarica» e «Chiudi»; frecce ‹ › (anche tastiera e dito che scorre); sotto
     «2 di 6 · data · chi». I video si guardano qui dentro.
     ⚠️ Le foto aperte da altre parti (scheda del lavoro, Giornate) usano
     ancora «view-foto», la foto e basta: non toccate. */
  let galInfo={};         /* id -> {kind,lav,tag,op,quando,path}: lo scrive renderGalleria */
  let galLista=[], galPos=0;
  function galVedi(id){
    /* l'ordine e' quello che si vede a schermo, filtri compresi */
    galLista=Array.from(document.querySelectorAll('#gal-body [data-action="gal-vedi"]'))
      .map(el=>el.dataset.id).filter(x=>galInfo[x]);
    galPos=Math.max(0,galLista.indexOf(String(id)));
    if(!galLista.length)return;
    galMostra();
  }
  function galSposta(d){
    if(galLista.length<2)return;
    galPos=(galPos+d+galLista.length)%galLista.length;
    galMostra();
  }
  async function galMostra(){
    const lb=$("#lightbox");if(!lb)return;
    const id=galLista[galPos], g=galInfo[id];if(!g)return;
    lb.querySelectorAll(".lb-x").forEach(e=>e.remove());
    const img=$("#lb-img");
    if(img){img.removeAttribute("src");img.style.display="none";}
    const n=galLista.length;
    const giorno=g.quando?fdate(String(g.quando).slice(0,10)):"";
    lb.insertAdjacentHTML("beforeend",
       '<div class="lb-x lb-bar"><span class="lb-t">'+esc(g.lav)+' · '+esc(g.tag)+'</span>'
      +'<button type="button" class="lb-b" data-action="gal-scarica">⬇ Scarica</button>'
      +'<button type="button" class="lb-b lb-scuro" data-action="close-lb">✕ Chiudi</button></div>'
      +(n>1?'<button type="button" class="lb-x lb-fr lb-sx" data-action="gal-prec" aria-label="Foto prima">‹</button>'
           +'<button type="button" class="lb-x lb-fr lb-dx" data-action="gal-succ" aria-label="Foto dopo">›</button>':"")
      +'<div class="lb-x lb-sotto"><span class="lb-tag">'+esc(g.tag)+' · </span>'+(galPos+1)+' di '+n+(giorno?' · '+esc(giorno):"")+(g.op?' · '+esc(g.op):"")+'</div>');
    lb.classList.add("open","lb-gal");
    if(g.kind==="foto"){
      if(!fotoCache[id])await galFirma("gestionale-foto",[{id,storage_path:g.path}],fotoCache);
      if(galLista[galPos]!==id)return;               /* nel frattempo si e' passati a un'altra */
      if(img&&fotoCache[id]){img.src=fotoCache[id];img.style.display="";}
    }else{
      if(!galVideoCache[id])await galFirma("gestionale-video",[{id,storage_path:g.path}],galVideoCache);
      if(galLista[galPos]!==id)return;
      if(!galVideoCache[id]){toast("Video non ancora pronto, riprova tra un attimo");return;}
      /* data-action="gal-nulla": toccare il video (play, volume) non deve chiudere */
      lb.insertAdjacentHTML("beforeend",'<video class="lb-x lb-video" data-action="gal-nulla" controls playsinline preload="metadata" src="'+esc(galVideoCache[id])+'"></video>');
    }
  }
  function galChiudiVedi(){
    const lb=$("#lightbox");if(!lb)return;
    lb.querySelectorAll("video").forEach(v=>{try{v.pause();}catch(e){}});
    lb.querySelectorAll(".lb-x").forEach(e=>e.remove());
    const img=$("#lb-img");if(img)img.style.display="";
    lb.classList.remove("open","lb-gal");
  }
  /* Scarica: un indirizzo firmato col nome del file, cosi' il telefono e il
     computer lo salvano invece di aprirlo (vale anche su iPhone). */
  async function galScarica(){
    const id=galLista[galPos], g=galInfo[id];if(!g||!g.path)return;
    const est=(String(g.path).match(/\.([a-z0-9]{2,5})$/i)||["",g.kind==="foto"?"jpg":"mp4"])[1];
    const pulito=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
    const nome=[pulito(g.lav)||"lavoro",pulito(g.tag).toLowerCase(),String(g.quando||"").slice(0,10),String(galPos+1)].filter(Boolean).join("-")+"."+est;
    try{
      const {data,error}=await sb.storage.from(g.kind==="foto"?"gestionale-foto":"gestionale-video")
        .createSignedUrl(g.path,600,{download:nome});
      if(error||!data||!data.signedUrl){toast("Non riesco a scaricarla: "+traduciErrore(String((error&&error.message)||"riprova")));return;}
      const a=document.createElement("a");a.href=data.signedUrl;a.download=nome;a.rel="noopener";
      document.body.appendChild(a);a.click();a.remove();
      toast((g.kind==="foto"?"Foto":"Video")+" in arrivo nei download");
    }catch(e){toast("Non riesco a scaricarla: controlla la connessione");}
  }
  /* il dito che scorre sulla foto, sul telefono */
  (function(){
    let x0=null;
    document.addEventListener("touchstart",function(e){
      const lb=document.getElementById("lightbox");
      x0=(lb&&lb.classList.contains("lb-gal")&&lb.contains(e.target)&&e.touches.length===1)?e.touches[0].clientX:null;
    },{passive:true});
    document.addEventListener("touchend",function(e){
      if(x0==null||!e.changedTouches.length)return;
      const dx=e.changedTouches[0].clientX-x0;x0=null;
      if(Math.abs(dx)>60)galSposta(dx>0?-1:1);
    },{passive:true});
  })();

  let galVideoCache={};   /* id riga gest_video -> url firmato, per aprire il video */
  let galRigheFoto={};    /* id -> riga: serve per eliminare (storage_path) */
  let galRigheVideo={};

  /* ===== 12 agosto 2026 (sera) — IL NOME DI CHI HA FATTO LA FOTO =====
     Questa funzione leggeva db().dipendenti: l'archivio LOCALE del primo
     gestionale, quello che sta nel browser. Da quando la squadra vive su
     Supabase quell'elenco resta vuoto per sempre, quindi il nome non usciva
     mai — e al suo posto veniva stampato l'ID della persona, cioe' una
     striscia di lettere e numeri sopra la miniatura e dentro la tendina
     «chi l'ha caricata».
     Adesso legge la squadra vera (dipCache, da gest_operatori) e, se proprio
     non trova il nome, NON stampa un codice: non stampa niente. */
  const galNomiOp={};      /* riserva: id -> nome, letta una volta dal database */
  function galNomeOp(v){
    if(!v)return "";
    if(v==="Capo")return _galPro()?"Io":"Capo";
    const d=(dipCache||[]).find(x=>String(x.id)===String(v));
    if(d&&d.nome)return d.nome;
    return galNomiOp[String(v)]||"";
  }

  async function renderGalleria(){
    if(!cur)return;
    const box=$("#gal-body");if(!box)return;
    const selOp=$("#gal-op-sel"), selLav=$("#gal-lav-sel");
    galParole();
    if(!sb||!sbUid){
      if(selOp)selOp.innerHTML='<option value="">Tutti</option>';
      if(selLav)selLav.innerHTML='<option value="">'+esc(_msgPro("Tutti i cantieri"))+'</option>';
      galVuoto(box);return;
    }
    const _rG=await Promise.all([
      /* 19 nov 2026 — created_at: in cima le ULTIME caricate (regola di Alex).
         Prima non c'era nessun ordine: le foto uscivano come capitava, e dopo
         un «Rimetti a posto» dal Cestino cambiavano di posto. */
      sb.from("gest_foto").select("id,lavoro_id,storage_path,tipo,operatore,created_at").eq("user_id",sbUid),
      sb.from("gest_video").select("id,lavoro_id,storage_path,tipo,operatore,created_at").eq("user_id",sbUid),
      sb.from("gest_lavori").select("id,descrizione,data_prevista").eq("user_id",sbUid).eq("mestiere_id",curMestiere())
    ]);
    /* 12 nov 2026 — regola 20: senza rete non si dice «Nessuna foto» */
    if(letturaKo(_rG[0],_rG[2])){listaNonLetta(box,"le foto","galleria");return;}
    const [{data:foto},{data:video},{data:lavori}]=_rG;
    const lavArr=(lavori||[]);
    const lavName=Object.fromEntries(lavArr.map(l=>[l.id,l.descrizione||"Lavoro"]));
    const lavIds=new Set(lavArr.map(l=>l.id));

    /* le foto di tipo "fattura" non sono foto di cantiere: restano fuori */
    const tutteF=(foto||[]).filter(f=>lavIds.has(f.lavoro_id)&&!_nonFoto(f.tipo));
    const tutteV=(video||[]).filter(v=>lavIds.has(v.lavoro_id));
    galRigheFoto={};tutteF.forEach(f=>galRigheFoto[f.id]=f);
    galRigheVideo={};tutteV.forEach(v=>galRigheVideo[v.id]=v);

    /* tendina "chi l'ha caricata" */
    const ops=new Set();
    tutteF.concat(tutteV).forEach(x=>{if(x.operatore)ops.add(x.operatore);});
    /* i nomi di chi ha caricato: se la squadra non e' ancora stata letta (o la
       persona e' di un altro reparto) si vanno a prendere qui, una volta sola.
       Meglio una domanda in piu' che un codice stampato sopra una foto. */
    {
      const mancano=Array.from(ops).filter(o=>o!=="Capo"&&!galNomeOp(o));
      if(mancano.length){
        try{
          const {data:nm}=await sb.from("gest_operatori").select("id,nome")
            .eq("user_id",sbUid).in("id",mancano);
          (nm||[]).forEach(function(o){ if(o&&o.nome)galNomiOp[String(o.id)]=o.nome; });
        }catch(e){}
      }
    }
    /* ⚠️ IL FILTRO CHE PUNTA A CHI NON C'E' PIU' — 14 agosto 2026 (notte).
       Eliminando l'ultima foto di una persona (o di un cantiere), quella
       sparisce dalla tendina — ma galFilter restava puntato su di lei.
       Risultato: la tendina mostra «Tutti», e la Galleria resta VUOTA senza
       che si capisca perche'. L'unico modo di uscirne era ricaricare.
       Se il valore scelto non esiste piu', il filtro torna su «Tutti». */
    if(galFilter.op&&!ops.has(galFilter.op))galFilter.op="";
    if(selOp)selOp.innerHTML=['<option value=""'+(galFilter.op===""?" selected":"")+'>Tutti</option>']
      .concat(Array.from(ops).map(o=>'<option value="'+esc(o)+'"'+(galFilter.op===o?" selected":"")+'>'+esc(galNomeOp(o))+'</option>')).join("");

    /* tendina cantiere: solo i lavori che hanno almeno una foto o un video */
    const conRoba=new Set(tutteF.map(f=>f.lavoro_id).concat(tutteV.map(v=>v.lavoro_id)));
    /* 24 nov 2026 — arrivando da una pratica SENZA foto («Carica dalla
       Galleria», «📷 Foto») il filtro tornava su «Tutte» e si vedevano le foto
       delle altre pratiche. Se la pratica esiste il filtro resta: la Galleria
       dice «nessuna foto» e «Carica» parte gia' su quella pratica. */
    if(galFilter.lav&&!conRoba.has(galFilter.lav)&&!lavIds.has(galFilter.lav))galFilter.lav="";
    if(selLav)selLav.innerHTML=['<option value=""'+(galFilter.lav===""?" selected":"")+'>'+esc(_msgPro("Tutti i cantieri"))+'</option>']
      .concat(lavArr.filter(l=>conRoba.has(l.id)||String(l.id)===String(galFilter.lav))
        .sort((a,b)=>String(b.data_prevista||"").localeCompare(String(a.data_prevista||"")))
        .map(l=>'<option value="'+esc(l.id)+'"'+(galFilter.lav===l.id?" selected":"")+'>'+esc(l.descrizione||"Lavoro")+'</option>')).join("");

    /* filtri */
    const quando=x=>FOTO_TIPO_UI[x.tipo]==="prima"?"prima":"dopo";
    const passa=x=>(!galFilter.op||x.operatore===galFilter.op)
                 &&(!galFilter.lav||String(x.lavoro_id)===String(galFilter.lav))
                 &&(!galFilter.tipo||quando(x)===galFilter.tipo);
    const F=(galFilter.media==="video")?[]:tutteF.filter(passa);
    const V=(galFilter.media==="foto") ?[]:tutteV.filter(passa);

    if(!F.length&&!V.length){galVuoto(box);return;}

    /* raggruppo per cantiere */
    /* 19 nov 2026 — l'ultima caricata va in cima: foto e video mescolati per
       data, e il cantiere con la cosa piu' nuova sta sopra agli altri (la Map
       tiene l'ordine in cui i cantieri compaiono). */
    const gruppi=new Map();
    const metti=(x,kind)=>{const k=x.lavoro_id||"";if(!gruppi.has(k))gruppi.set(k,[]);gruppi.get(k).push({x,kind});};
    F.map(f=>({x:f,kind:"foto"})).concat(V.map(v=>({x:v,kind:"video"})))
      .sort((a,b)=>String(b.x.created_at||"").localeCompare(String(a.x.created_at||"")))
      .forEach(o=>metti(o.x,o.kind));

    galInfo={};
    let html="";
    gruppi.forEach((arr,k)=>{
      const nF=arr.filter(a=>a.kind==="foto").length, nV=arr.length-nF;
      const conta=[nF?nF+(nF===1?" foto":" foto"):"",nV?nV+(nV===1?" video":" video"):""].filter(Boolean).join(" · ");
      /* 24 nov 2026 (sì di Alex) — «PDF delle foto»: solo se ci sono foto */
      html+='<div class="gal-group"><div class="gal-cantiere">'+esc(lavName[k]||"—")
          + '<span class="gal-conta">'+conta+'</span>'
          + (nF&&k?'<button type="button" class="btn gal-pdf" data-action="gal-pdf" data-id="'+esc(k)+'">📄 PDF delle foto</button>':"")
          + '</div><div class="thumbs">';
      arr.forEach(({x,kind})=>{
        const q=quando(x), tag=_galTag(q), tcls=q==="prima"?"prima":"dopo";
        const op=galNomeOp(x.operatore);
        galInfo[x.id]={kind,lav:lavName[k]||"",tag,op,quando:x.created_at||"",path:x.storage_path||""};
        if(kind==="foto"){
          html+='<div class="thumb"><img data-gfoto="'+esc(x.id)+'" loading="lazy" decoding="async" width="150" height="150" data-action="gal-vedi" data-id="'+esc(x.id)+'" alt="">'
              + '<span class="thtag '+tcls+'">'+tag+'</span>'
              + (op?'<span class="thop">'+esc(op)+'</span>':"")
              + '<button class="thdel" data-action="gal-del-foto" data-id="'+esc(x.id)+'" title="Elimina">×</button></div>';
        }else{
          html+='<div class="thumb thumb-video" data-action="gal-vedi" data-id="'+esc(x.id)+'">'
              + '<div class="vid-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Video</span></div>'
              + '<span class="thtag '+tcls+'">'+tag+'</span>'
              + (op?'<span class="thop">'+esc(op)+'</span>':"")
              + '<button class="thdel" data-action="gal-del-video" data-id="'+esc(x.id)+'" title="Elimina">×</button></div>';
        }
      });
      html+='</div></div>';
    });
    box.style.display="block";
    box.innerHTML=html;

    /* ===== 12 agosto 2026 (sera) — LA GALLERIA PESAVA COME UN FILM =====
       Prima, ogni volta che si apriva la Galleria o si toccava un filtro:
         - si chiedeva un indirizzo firmato UNO PER UNO, in fila (60 foto = 60
           viaggi di rete uno dietro l'altro);
         - si scaricavano TUTTE le foto INTERE, anche quelle a tre schermate di
           distanza, per farne quadratini da 150 px. Con foto da telefono sono
           decine di megabyte per ogni sguardo, e in cantiere si paga a giga.
       Adesso: le firme si chiedono TUTTE INSIEME, si riusano finche' valgono
       (durano un'ora), e le immagini si scaricano solo quando arrivano davvero
       sotto gli occhi (loading="lazy" sul tag img). */
    await galFirma("gestionale-foto",F,fotoCache);
    F.forEach(function(f){
      if(!fotoCache[f.id])return;
      const im=box.querySelector('img[data-gfoto="'+f.id+'"]');
      if(im)im.src=fotoCache[f.id];
    });
    await galFirma("gestionale-video",V,galVideoCache);
  }
  /* ===== 12 agosto 2026 (sera) — I FILE ORFANI NEL DEPOSITO =====
     Otto punti del gestionale fanno la stessa identica cosa: caricano il file
     nel bucket, poi scrivono la riga nel database che lo nomina. Se la riga
     NON si scrive — rete che cade, permesso negato, una colonna che manca — il
     messaggio lo diceva («Foto su, ma non salvata») ma il file restava
     caricato, senza piu' nessuna riga che lo nominasse: invisibile nel
     gestionale, impossibile da ritrovare, e a occupare spazio per sempre. Con
     le foto da telefono sono megabyte a ogni tentativo andato male, e nel
     deposito di Supabase lo spazio si paga.
     Adesso, appena si sa che la riga non c'e', il file si toglie. */
  /* 13 agosto 2026 — prima questa funzione non guardava com'era andata.
     Supabase non lancia mai su errore: risponde {error}. Quindi quel `catch`
     non prendeva niente e, se la pulizia non riusciva (permesso sul deposito,
     rete), il file restava li' e non lo sapeva nessuno — nemmeno il codice.
     Adesso risponde: `true` se il file e' stato tolto davvero. Chi chiama puo'
     dirlo, o almeno contarlo. */

  const galFirmaTs={};
  const GAL_FIRMA_MS=50*60*1000;
  async function galFirma(bucket,righe,cache){
    if(!sb||!righe||!righe.length)return;
    const ora=Date.now();
    const daFare=righe.filter(function(r){
      return !(cache[r.id]&&(ora-(galFirmaTs[r.id]||0)<GAL_FIRMA_MS));
    });
    if(!daFare.length)return;
    try{
      const {data,error}=await sb.storage.from(bucket)
        .createSignedUrls(daFare.map(r=>r.storage_path),3600);
      if(error||!data)return;
      /* le risposte tornano nello stesso ordine delle richieste; il path e' il
         controllo di sicurezza, cosi' non si attacca l'indirizzo alla foto
         sbagliata se un giorno l'ordine cambiasse */
      data.forEach(function(x,i){
        const r=daFare[i];
        if(!x||!r||x.error||!x.signedUrl)return;
        if(x.path&&String(x.path)!==String(r.storage_path))return;
        cache[r.id]=x.signedUrl; galFirmaTs[r.id]=ora;
      });
    }catch(e){}
  }

  /* ================= MAPPA =================
     Dove sono i cantieri e quanto distano dall'azienda.
     Tre pezzi, tutti gratuiti e senza chiavi da gestire:
       - la carta la disegna Leaflet con le tessere di OpenStreetMap
       - l'indirizzo diventa un punto sulla carta con Nominatim
       - i chilometri su strada e i minuti arrivano da OSRM
     Nominatim chiede al massimo una richiesta al secondo: per questo le
     chiamate sono in fila una dietro l'altra e ogni risultato viene messo
     da parte sul computer, così un indirizzo già cercato non si ricerca mai più.
     ========================================= */

  /* 12 agosto 2026 (sera) — da v2 a v3: la memoria vecchia va buttata.
     Dentro ci sono i punti calcolati con mezzo indirizzo (senza CAP e comune) e
     gli indirizzi segnati "non trovato" per colpa di un errore 429 del servizio
     mappe. Tenerla vorrebbe dire correggere il codice e continuare a leggere i
     numeri sbagliati di ieri. Cambiando nome si riparte puliti: la prima
     apertura della Mappa ci mette qualche secondo in piu', una volta sola. */
  const MP_CACHE_KEY="ti_mappa_cache_v3";
  let mpCache=null, mpVista="aperti", mpMappa=null, mpLayer=null, mpInCorso=false;
  /* 19 nov 2026 (collaudo Mappa) — mpGuasto: il servizio della carta non
     risponde (rete caduta, troppe richieste). Prima un guasto e un indirizzo
     sbagliato davano lo STESSO messaggio: «Non trovo l'indirizzo del tuo
     ufficio, scrivilo con via e comune» anche quando l'indirizzo era giusto.
     mpVecchi: i punti di prima, tenuti da parte quando premi «Ricalcola»,
     cosi' se il servizio non risponde non perdi le distanze che avevi.
     mpRifai: hai cambiato «Lavori da fare / Tutti» (o reparto) mentre cercavo
     gli indirizzi: finito il giro, lo rifaccio con la scelta nuova. Prima la
     scelta veniva ignorata e il pulsante diceva «Tutti» sopra la lista dei
     soli lavori da fare. */
  let mpGuasto=false, mpVecchi=null, mpRifai=false, mpRifaiForza=false;
  /* 24 nov 2026 (consiglio accettato da Alex) — «Chi ci va»: solo i posti di
     una persona. "" = tutti, "_nessuno" = nessuno assegnato (anche chi e' nel
     Cestino, come l'Agenda), altrimenti l'id della persona. */
  let mpChi="";
  document.addEventListener("change",function(e){
    if(e.target&&e.target.id==="mp-chi"){mpChi=e.target.value||"";renderMappa();}
  });

  function mpLeggiCache(){
    if(mpCache)return mpCache;
    try{mpCache=JSON.parse(localStorage.getItem(MP_CACHE_KEY)||"{}");}catch(e){mpCache={};}
    if(!mpCache.punti)mpCache.punti={};
    return mpCache;
  }
  function mpSalvaCache(){try{localStorage.setItem(MP_CACHE_KEY,JSON.stringify(mpCache));}catch(e){}}
  function mpChiave(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim();}
  const mpAspetta=ms=>new Promise(r=>setTimeout(r,ms));

  /* carica Leaflet solo la prima volta che apri la Mappa */
  function mpCaricaLeaflet(){
    if(window.L)return Promise.resolve(true);
    return new Promise(resolve=>{
      const css=document.createElement("link");
      css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(css);
      const js=document.createElement("script");
      js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      js.onload=()=>resolve(true);js.onerror=()=>resolve(false);
      document.head.appendChild(js);
    });
  }

  /* 26 set 2026 — il pin a goccia, del colore dello stato, col numero dei
     lavori quando nello stesso posto ce n'e' piu' d'uno. */
  function mpPinIcona(col,n){
    const num=n>1?'<text x="15" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="'+col+'" font-family="system-ui,Arial">'+n+'</text>'
                 :'<circle cx="15" cy="14" r="4.5" fill="'+col+'"/>';
    return L.divIcon({className:"mp-pin",iconSize:[30,40],iconAnchor:[15,39],popupAnchor:[0,-34],
      html:'<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 39C15 39 2 23.5 2 14a13 13 0 0 1 26 0c0 9.5-13 25-13 25z" fill="'+col+'" stroke="#fff" stroke-width="2.5"/>'
          +'<circle cx="15" cy="14" r="8" fill="#fff"/>'+num+'</svg>'});
  }

  /* indirizzo scritto a mano -> punto sulla carta */
  /* opz={via,comune}: ricerca "a caselle" (via e comune separati). Serve
     quando il comune l'ho aggiunto io: scritto tutto insieme, «via Garibaldi
     100, Rieti» finiva in via Garibaldi a Fara in Sabina, PROVINCIA di Rieti,
     a 33 km, con scritto accanto «comune ipotizzato: Rieti». */
  async function mpTrovaPunto(indirizzo,vicinoA,opz){
    const q=opz?("c:"+mpChiave(opz.via)+"|"+mpChiave(opz.comune)):mpChiave(indirizzo);
    if(!q||q==="c:|")return null;
    const C=mpLeggiCache();
    if(C.punti[q]!==undefined)return C.punti[q];       /* null incluso: già cercato e non trovato */
    const diPrima=()=>(mpVecchi&&mpVecchi[q]!==undefined)?mpVecchi[q]:null;
    /* servizio gia' giu' in questo giro: non lo richiamo per ogni cantiere
       (prima si aspettavano 30 secondi per sentirsi dire niente) */
    if(mpGuasto)return diPrima();
    let trovato;
    for(let prova=0;;prova++){
    try{
      let url="https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=it"
        +(opz?"&street="+encodeURIComponent(opz.via)+"&city="+encodeURIComponent(opz.comune)
             :"&q="+encodeURIComponent(indirizzo));
      /* spingo la ricerca verso la zona dell'ufficio: senza questo, una via che
         esiste anche in un'altra provincia poteva essere pescata a 400 km */
      if(vicinoA){
        const d=1.2;
        url+="&viewbox="+(vicinoA.lon-d)+","+(vicinoA.lat+d)+","+(vicinoA.lon+d)+","+(vicinoA.lat-d);
      }
      const r=await fetch(url,{headers:{"Accept":"application/json"}});
      /* ===== 12 agosto 2026 (sera) — UN GUASTO NON E' UNA RISPOSTA =====
         Prima QUALSIASI cosa andasse storta veniva scritta in memoria come
         "questo indirizzo non esiste", e ci restava per sempre. Il caso vero:
         il servizio gratuito delle mappe risponde 429 «troppe richieste» —
         succede di continuo se apri la Mappa con venti cantieri — e da quel
         momento quei cantieri non comparivano MAI PIU', nemmeno il giorno
         dopo, perche' la risposta sbagliata era ormai incisa. Adesso un
         guasto non si scrive: si riprova la volta dopo. */
      if(!r.ok){
        await mpAspetta(r.status===429?2500:1100);
        if(prova<1)continue;              /* un'altra volta sola */
        mpGuasto=true;
        return diPrima();                 /* non si scrive niente in memoria */
      }
      const d0=await r.json();
      const a=(d0&&d0[0])?d0[0]:null;
      const ad=(a&&a.address)||{};
      trovato=a?{lat:+a.lat,lon:+a.lon,nome:a.display_name||"",
                 comune:ad.city||ad.town||ad.village||ad.municipality||""}:null;
      break;
    }catch(e){
      /* rete caduta, richiesta bloccata: come sopra, non e' una risposta */
      await mpAspetta(1100);
      if(prova<1)continue;
      mpGuasto=true;
      return diPrima();
    }
    }
    C.punti[q]=trovato;
    mpSalvaCache();
    await mpAspetta(1100);        /* il servizio gratuito accetta una richiesta al secondo */
    return C.punti[q];
  }

  /* due punti -> chilometri in linea d'aria.
     È la stessa identica formula che usa la mappa del sito (cerca-artigiani):
     nessun servizio esterno da interrogare, quindi il numero compare subito. */
  function mpDistanzaKm(a,b){
    if(!a||!b)return null;
    const R=6371;
    const dLat=(b.lat-a.lat)*Math.PI/180, dLon=(b.lon-a.lon)*Math.PI/180;
    const x=Math.sin(dLat/2)**2
      +Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  }

  /* 19 nov 2026 — i lavori senza indirizzo, in fondo alla lista */
  function mpSenzaHtml(lista){
    if(!lista||!lista.length)return "";
    const n=lista.length;
    /* 24 nov 2026 (collaudo Mappa dello studio) — «1 pratica… Aprilo»: le
       parole si scrivono qui, giuste per tutte e due le facce. Il nome della
       pratica sta in .mp-u: e' dell'utente, il traduttore non lo tocca. */
    const pro=_mpPro();
    const tit=pro?(n===1?'1 pratica senza indirizzo':n+' pratiche senza indirizzo'):(n===1?'1 lavoro senza indirizzo':n+' lavori senza indirizzo');
    const apri=pro?(n===1?'Aprila':'Aprile'):(n===1?'Aprilo':'Aprili');
    return '<div class="mp-avviso mp-avviso-lieve mp-senza"><span><b>'+tit+'</b>, '
      +(n===1?'non è sulla carta':'non sono sulla carta')+'. '+apri+' e scrivi il campo «Dove».</span>'
      +lista.map(l=>'<div class="mp-senza-r"><span class="mp-u">'+esc(l.descrizione||(pro?"Pratica":"Lavoro"))+'</span>'
        +'<button type="button" class="btn" data-action="mp-apri" data-id="'+esc(String(l.id))+'">Apri</button></div>').join("")
      +'</div>';
  }
  /* I pulsanti dentro il fumetto: Leaflet ferma il clic prima che arrivi al
     document (dove ascolta il gestionale). Li prendo prima, in «capture». */
  function mpAscoltaFumetti(){
    const c=document.getElementById("mp-mappa");
    if(!c||c._mpAscolta)return;
    c._mpAscolta=true;
    c.addEventListener("click",function(e){
      const b=e.target&&e.target.closest?e.target.closest(".leaflet-popup [data-action]"):null;
      if(!b)return;
      e.preventDefault();e.stopPropagation();
      if(b.dataset.action==="mp-apri")mpApri(b.dataset.id);
      else if(b.dataset.action==="mp-strada")mpStrada(b.dataset.q);
    },true);
  }
  function mpApri(id){
    if(mpMappa)try{mpMappa.closePopup();}catch(e){}
    if(window.apriCosa)window.apriCosa("lav",id);
  }
  function mpStrada(q){
    window.open("https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(q||""),"_blank");
  }

  /* 19 nov 2026 — «Manda a …»: lo stesso messaggio WhatsApp dei Lavori
     (_waLavoro), con l'indirizzo intero e il punto salvato */
  function mpMandaBtn(r,ops){
    const o=ops[r.l.operatore_id];
    const nome=o&&o.nome?String(o.nome).trim().split(/\s+/)[0]:"";
    let wa="";
    /* il punto appena trovato vale subito, anche prima che sia salvato */
    const lp=r.p?Object.assign({},r.l,{dove_lat:r.p.lat,dove_lon:r.p.lon,dove_geo:r.strada}):r.l;
    try{wa=_waLavoro(lp,(o&&o.telefono)||"",(r.c&&r.c.nome)||"",r.strada);}catch(e){return "";}
    return '<button class="btn mp-r-btn mp-manda" data-action="sq-wa" data-wa="'+esc(wa)+'">'+(nome?"Manda a "+esc(nome):"Manda a\u2026")+'</button>';
  }
  /* salva i punti uno dopo l'altro, senza disturbare: se non si puo'
     (rete, permessi di chi non e' il titolare) resta tutto come prima */
  async function mpSalvaPunti(lista){
    for(const x of lista||[]){
      try{
        const {id,...campi}=x;
        await sb.from("gest_lavori").update(campi).eq("id",id).eq("user_id",sbUid);
      }catch(e){}
    }
  }

  /* 24 nov 2026 — la faccia dello studio tecnico */
  function _mpPro(){return ruoloUtente==='professionista';}
  /* testo dell'UTENTE (nome della pratica, indirizzo, cliente, collaboratore):
     sta in .mp-u, che e' nell'elenco _SKIP_UTENTE. Prima «Rilievo del cantiere
     Bianchi» diventava «Rilievo della pratica Bianchi» nella lista e nel fumetto. */
  function _mpU(t){return '<span class="mp-u">'+esc(t||"")+'</span>';}

  function mpLargFumetto(){
    const w=(document.getElementById("mp-mappa")||{}).clientWidth||400;
    return Math.max(180,Math.min(300,w-90));
  }

  function mpFormattaKm(km){
    if(km==null)return "—";
    return (km<10?(Math.round(km*10)/10).toString().replace(".",","):Math.round(km))+" km";
  }


  async function renderMappa(forza){
    const box=$("#mp-lista"), avviso=$("#mp-avviso");
    if(!box)return;
    /* 24 nov 2026 — la legenda: allo studio «Fatta» (la pratica) */
    try{const lf=document.querySelector("#mappa .mp-legenda .dot.done");if(lf&&lf.nextSibling)lf.nextSibling.nodeValue=_mpPro()?"Fatta":"Fatto";}catch(e){}
    if(!sb||!sbUid||!cur){box.innerHTML="";return;}
    if(mpInCorso){mpRifai=true;if(forza)mpRifaiForza=true;return;}
    mpInCorso=true;
    mpGuasto=false;mpVecchi=null;
    let finito=false;
    try{
      if(forza){mpVecchi=Object.assign({},mpLeggiCache().punti);mpCache={punti:{}};mpSalvaCache();}

      /* 1) da dove si parte: l'indirizzo dell'azienda */
      /* ===== 12 agosto 2026 (sera) — L'UFFICIO FINIVA A CASO IN ITALIA =====
         Qui si leggevano SOLO «nome» e «indirizzo». Ma azIndirizzo() mette
         insieme via + CAP + citta' + provincia: senza quelle tre colonne
         l'indirizzo diventava un nudo «Via Roma 10», e il servizio delle mappe
         lo piazzava nella prima Via Roma 10 che trovava in Italia. Da li' in
         poi TUTTE le distanze erano sbagliate — e credibili, che e' peggio.
         E siccome il punto dell'ufficio serve anche a restringere la ricerca
         dei cantieri alla zona giusta, sbagliava pure quelli. */
      const {data:az,error:_eMp}=await sb.from("gest_azienda")
        .select("nome,indirizzo,cap,citta,prov").eq("user_id",sbUid).maybeSingle();
      /* 12 nov 2026 — regola 20: senza rete non si chiede un indirizzo che c'e' gia' */
      if(_eMp){if(avviso)avviso.innerHTML="";$("#mp-mappa").style.display="none";listaNonLetta(box,"la mappa","mappa");return;}
      const partenzaTxt=azIndirizzo(az).trim();
      /* Anche senza l'indirizzo dell'ufficio la carta si vede lo stesso, con i pin
         dei cantieri: mancano solo i chilometri, perché non c'e' da dove misurarli. */
      if(avviso)avviso.innerHTML = partenzaTxt
        ? '<div class="mp-ufficio"><span class="mp-u-lab">Ufficio</span><b>'
          +esc(az.nome||"La tua azienda")+'</b><span class="mp-u-ind">'+esc(partenzaTxt)+'</span></div>'
        /* 26 set 2026 — l'avviso andava a capo a pezzi (.mp-avviso e' flex e
           ogni <b> diventava una colonna) e mandava a cercare un pulsante.
           Adesso una frase sola e il pulsante che porta dove serve. */
        : '<div class="mp-avviso"><span>Per vedere i chilometri scrivi l\'<b>indirizzo del tuo ufficio</b> in Dati azienda.</span>'
          +'<button type="button" class="btn" data-action="azienda">Apri Dati azienda</button></div>';
      $("#mp-mappa").style.display="";

      /* 2) i lavori con un indirizzo */
      /* 19 nov 2026 (sì di Alex) — anche chi ci va e il punto gia' salvato
         (sql/2026-11-19-lavori-punto-mappa.sql): la Mappa e l'app dell'operaio
         adesso si parlano. Se le colonne nuove mancassero, si legge come prima. */
      let _rOp=null;
      try{_rOp=sb.from("gest_operatori").select("id,nome,telefono").eq("user_id",sbUid);}catch(e){}
      let _rL=await sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,cliente_id,operatore_id,dove_lat,dove_lon,dove_km,dove_geo,pratica_stato").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
      if(_rL.error&&/dove_|column/i.test(_rL.error.message||""))_rL=await sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,cliente_id,operatore_id").eq("user_id",sbUid).eq("mestiere_id",curMestiere());
      const mpOp={};
      try{const ro=_rOp?await _rOp:null;((ro&&ro.data)||[]).forEach(o=>{mpOp[o.id]=o;});}catch(e){}
      const [{data:lav,error:_eL},{data:cli,error:_eC}]=await Promise.all([
        Promise.resolve(_rL),
        /* stessa storia dell'ufficio: senza CAP, citta' e provincia l'indirizzo
           del cliente e' mezzo indirizzo, e il pin finisce dall'altra parte
           d'Italia */
        sb.from("gest_clienti").select("id,nome,indirizzo,cap,citta,prov,paese").eq("user_id",sbUid).or(_cliOr(curMestiere()))
      ]);
      /* 19 nov 2026 — senza rete qui diceva «Nessun cantiere da mostrare» */
      if(_eL||_eC){if(avviso)avviso.innerHTML="";$("#mp-mappa").style.display="none";listaNonLetta(box,"la mappa","mappa");return;}
      const cliMap=Object.fromEntries((cli||[]).map(c=>[c.id,c]));
      /* ATTENZIONE: qui la lista dei lavori NON si può chiamare L.
         Leaflet, la libreria che disegna la carta, si chiama proprio L: chiamando
         L la lista dei lavori le si andava sopra, e L.map("mp-mappa") non creava
         più la carta ma provava a scorrere la lista dei lavori. Da qui l'errore
         «string "mp-mappa" is not a function». */
      let LAV=(lav||[]);
      if(mpVista==="aperti")LAV=LAV.filter(l=>l.stato!=="fatto");
      /* 24 nov 2026 — «Chi ci va»: la tendina conta quello che si sta
         guardando («da fare» o «tutti»), poi si tiene solo la persona scelta */
      const _nessuno=l=>!l.operatore_id||!mpOp[l.operatore_id];
      const chiBox=document.getElementById("mp-chi-box"), chiSel=document.getElementById("mp-chi");
      const opIds=Object.keys(mpOp);
      if(chiBox&&chiSel){
        if(!opIds.length){chiBox.hidden=true;mpChi="";}
        else{
          if(mpChi&&mpChi!=="_nessuno"&&!mpOp[mpChi])mpChi="";
          const nOp=id=>LAV.filter(l=>String(l.operatore_id)===String(id)).length;
          const nomi=opIds.map(id=>({id,nome:String(mpOp[id].nome||"").trim()||"Senza nome",n:nOp(id)}))
            .sort((a,b)=>a.nome.localeCompare(b.nome,"it"));
          chiSel.innerHTML='<option value="">Tutti ('+LAV.length+')</option>'
            +nomi.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome)+' ('+x.n+')</option>').join("")
            +'<option value="_nessuno">Nessuno ('+LAV.filter(_nessuno).length+')</option>';
          chiSel.value=mpChi;
          chiBox.hidden=false;
        }
      }
      if(mpChi==="_nessuno")LAV=LAV.filter(_nessuno);
      else if(mpChi)LAV=LAV.filter(l=>String(l.operatore_id)===String(mpChi));
      const voci=LAV.map(l=>{
        const c=cliMap[l.cliente_id];
        /* cliIndirizzo() mette insieme via + CAP + citta' + provincia: prima
           qui si usava il solo c.indirizzo e si perdeva meta' indirizzo */
        const ind=(l.dove||"").trim()||cliIndirizzo(c).trim();
        return {l,c,ind};
      });
      /* 19 nov 2026 (sì di Alex) — i lavori senza indirizzo non sparivano: si
         dicono in fondo alla lista, col pulsante per aprirli e scriverlo */
      const senzaInd=voci.filter(v=>!v.ind).map(v=>v.l);
      const _vociInd=voci.filter(v=>v.ind);
      voci.length=0; voci.push(..._vociInd);

      /* 3) LA CARTA PRIMA DI TUTTO.
         Prima la disegnavo alla fine, dopo aver cercato tutti gli indirizzi: per
         qualche secondo si vedeva solo un rettangolo bianco e sembrava rotta.
         Ora la carta compare subito e i pin si aggiungono man mano che li trovo. */
      const ok=await mpCaricaLeaflet();
      if(ok&&window.L){
        const cont=document.getElementById("mp-mappa");
        if(mpMappa&&(!cont||!cont._leaflet_id)){mpMappa=null;}  /* contenitore rifatto: ricomincio */
        if(!mpMappa){
          if(cont)cont.innerHTML="";
          mpMappa=L.map("mp-mappa",{scrollWheelZoom:false}).setView([41.9,12.5],5);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {maxZoom:18,attribution:"© OpenStreetMap"}).addTo(mpMappa);
        }
        if(mpLayer)mpLayer.remove();
        mpLayer=L.layerGroup().addTo(mpMappa);
        mpAscoltaFumetti();
        setTimeout(()=>{try{mpMappa.invalidateSize();}catch(e){}},100);
        /* se dopo 6 secondi non è arrivata nessuna tessera, la carta è bloccata */
        setTimeout(()=>{
          try{
            const t=document.querySelectorAll("#mp-mappa img.leaflet-tile-loaded").length;
            if(!t&&avviso&&!avviso.dataset.tile){
              avviso.dataset.tile="1";
              avviso.insertAdjacentHTML("beforeend",'<div class="mp-avviso">La carta non riesce a scaricare le immagini da OpenStreetMap. Le distanze qui sotto funzionano lo stesso. Se hai un blocco pubblicit&agrave; o una protezione attiva sul browser, prova a disattivarla su questo sito.</div>');
            }
          }catch(e){}
        },6000);
      }else{
        $("#mp-mappa").innerHTML='<div class="mp-carico">Non riesco a caricare la carta. La lista con le distanze qui sotto funziona lo stesso.</div>';
      }
      const punti=[];
      const inquadra=()=>{
        if(!(ok&&window.L&&mpMappa))return;
        try{if(punti.length)mpMappa.fitBounds(punti,{padding:[40,40],maxZoom:14});}catch(e){}
      };

      /* 4) l'ufficio */
      const dice=(fatti,tot)=>{box.innerHTML='<div class="mp-carico">Sto cercando gli indirizzi sulla carta… '+fatti+' di '+tot+'.<br>Ci vuole un secondo per ognuno, ma solo la prima volta.</div>';};
      dice(0,voci.length+1);
      const pPart=partenzaTxt?await mpTrovaPunto(partenzaTxt+", Italia"):null;
      const comuneUff=(pPart&&pPart.comune)||"";
      if(partenzaTxt&&!pPart&&avviso&&!mpGuasto){
        /* 19 nov 2026 — il pulsante si chiama «Dati azienda», non «Azienda»: lo metto qui */
        avviso.innerHTML='<div class="mp-avviso"><span>Non trovo l\'indirizzo del tuo ufficio: ho cercato <b>'+esc(partenzaTxt)+'</b>. Scrivilo con via, numero e comune, per esempio <b>Via Roma 10, Rieti</b>.</span>'
          +'<button type="button" class="btn" data-action="azienda">Apri Dati azienda</button></div>';
      }
      if(pPart&&ok&&window.L){
        punti.push([pPart.lat,pPart.lon]);
        L.marker([pPart.lat,pPart.lon]).addTo(mpLayer)
          .bindPopup("<b>Il tuo ufficio</b><br>"+esc(az.nome||"La tua azienda"));
        inquadra();
      }

      /* 5) i cantieri, uno alla volta: il pin compare appena lo trovo */
      const mpGruppi={};
      const righe=[];
      const mpDaSalvare=[];
      let fatti=1;
      for(const v of voci){
        /* Se l'indirizzo non dice in che comune sta ("via verani 18"), do' per
           buono il comune dell'ufficio. Prima cercavo alla cieca in tutta Italia
           e potevo pescare una via con lo stesso nome a centinaia di chilometri:
           usciva un numero preciso e completamente sbagliato. */
        const haComune=/\d{5}|,/.test(v.ind);
        const ipotesi=!haComune&&!!comuneUff;
        const q=v.ind+(haComune?", Italia":(comuneUff?", "+comuneUff+", Italia":", Italia"));
        let pt=await mpTrovaPunto(q,pPart), circa=false;
        /* 26 set 2026 — se la via col numero non c'e' sulla carta gratuita
           (succede: molti civici non sono segnati), si riprova senza numero.
           Il pin cade sulla via e nella lista c'e' scritto «via trovata, numero no». */
        if(!pt){
          const senzaNum=q.replace(/(\b\d{1,4}[a-zA-Z]?\b)(?=\s*,)/,"").replace(/\s+,/g,",").replace(/,\s*,/g,",");
          if(senzaNum!==q){ pt=await mpTrovaPunto(senzaNum,pPart); circa=!!pt; }
        }
        /* 19 nov 2026 — il comune l'ho aggiunto io: il punto trovato deve stare
           DAVVERO in quel comune. Se no riprovo con via e comune separati; se
           ancora non torna, «scrivi anche il comune» invece di un numero sbagliato. */
        let fuoriComune=false;
        if(ipotesi&&pt&&pt.comune&&mpChiave(pt.comune)!==mpChiave(comuneUff)){
          const pt2=await mpTrovaPunto(null,pPart,{via:v.ind,comune:comuneUff});
          if(pt2&&(!pt2.comune||mpChiave(pt2.comune)===mpChiave(comuneUff))){pt=pt2;circa=false;}
          else fuoriComune=true;
        }
        const guasto=!pt&&mpGuasto;
        let km=(pt&&pPart)?mpDistanzaKm(pPart,pt):null;
        /* rete di sicurezza: se l'indirizzo era incompleto e il risultato è
           lontanissimo, non è il posto giusto. Meglio dire "non lo so". */
        const sospetto=fuoriComune||(!haComune&&km!=null&&km>80);
        if(sospetto)km=null;
        /* per «Indicazioni»: lo stesso indirizzo che ho cercato io, comune compreso */
        const strada=(ipotesi&&!sospetto)?v.ind+", "+comuneUff:v.ind;
        righe.push({...v,p:sospetto?null:pt,km,ipotesi,sospetto,circa,guasto,strada});
        /* 19 nov 2026 — il punto trovato si salva nel lavoro (per l'app dell'operaio) */
        if(pt&&!sospetto&&!guasto){
          const kmS=km!=null?Math.round(km*10)/10:null, L0=v.l;
          const cambia=L0.dove_geo!==v.ind||Math.abs((+L0.dove_lat||0)-pt.lat)>1e-6||Math.abs((+L0.dove_lon||0)-pt.lon)>1e-6
            ||(L0.dove_km==null?null:+L0.dove_km)!==kmS;
          if(cambia&&("dove_geo" in L0))mpDaSalvare.push({id:L0.id,dove_lat:pt.lat,dove_lon:pt.lon,dove_km:kmS,dove_geo:v.ind});
        }
        if(pt&&!sospetto&&ok&&window.L){
          punti.push([pt.lat,pt.lon]);
          /* 26 set 2026 — UN PIN PER OGNI LAVORO (Alessio: «ci devono essere i
             pin per ogni lavoro»). Prima erano pallini, e tre lavori nello
             stesso indirizzo finivano uno sopra l'altro: se ne vedeva uno.
             Adesso stesso punto = un pin solo col NUMERO dei lavori, e il
             fumetto li elenca tutti. Il colore e' quello del piu' urgente. */
          const peso=v.l.stato==="fatto"?0:(inRitardo(v.l.stato,v.l.data_prevista,v.l.pratica_stato)?2:1);
          const chiave=pt.lat.toFixed(5)+","+pt.lon.toFixed(5);
          const g=mpGruppi[chiave]||(mpGruppi[chiave]={lav:[],peso:0,m:null});
          g.lav.push({t:v.l.descrizione||(_mpPro()?"Pratica":"Lavoro"),ind:v.ind,km,id:v.l.id,strada});
          g.peso=Math.max(g.peso,peso);
          const icona=mpPinIcona(["#059669","#D97706","#DC2626"][g.peso],g.lav.length);
          /* 19 nov 2026 (sì di Alex) — nel fumetto «Apri il lavoro» e «Indicazioni» */
          const fumetto=g.lav.map(x=>"<b>"+_mpU(x.t)+"</b><br>"+_mpU(x.ind)
              +(x.km!=null?"<br><b>"+mpFormattaKm(x.km)+"</b> dall'ufficio":"")
              +'<div class="mp-fum-btn"><button type="button" class="btn" data-action="mp-apri" data-id="'+esc(String(x.id))+'">Apri il lavoro</button>'
              +'<button type="button" class="btn" data-action="mp-strada" data-q="'+esc(x.strada)+'">Indicazioni</button></div>').join("<hr style='border:0;border-top:1px solid #e3e8ef;margin:10px 0'>");
          if(g.m){ g.m.setIcon(icona); g.m.setPopupContent(fumetto); }
          /* 19 nov 2026 — fumetto largo al massimo quanto la carta (sul telefono usciva di lato) */
          else g.m=L.marker([pt.lat,pt.lon],{icon:icona}).addTo(mpLayer).bindPopup(fumetto,{maxWidth:mpLargFumetto()});
          inquadra();
        }
        fatti++;dice(fatti-1,voci.length+1);
      }
      righe.sort((a,b)=>(a.km==null?1e9:a.km)-(b.km==null?1e9:b.km));
      mpSalvaPunti(mpDaSalvare);
      /* metto da parte le distanze: la scheda Mappa del Riepilogo le legge da qui
         senza rifare nessun calcolo e senza chiamare nessun servizio */
      /* 24 nov 2026 — non si azzera piu': l'Assistente cerca i km di OGNI
         pratica aperta per il suo indirizzo, e con «Tutti» o con un altro
         reparto qui dentro finivano solo quelli dell'ultima vista (anche le
         FATTE: «La pratica più vicina 0,7 km» era una pratica gia' chiusa). */
      const C2=mpLeggiCache();if(!C2.km)C2.km={};
      righe.forEach(r=>{if(r.km!=null)C2.km[mpChiave(r.ind)]=r.km;});
      mpSalvaCache();

      /* 6) la lista sotto la carta */
      const senzaHtml=mpSenzaHtml(senzaInd);
      if(!righe.length&&mpChi){
        /* 24 nov 2026 — con una persona scelta: non e' che mancano gli indirizzi */
        const chiN=mpChi==="_nessuno"?"senza nessuno":("di "+String((mpOp[mpChi]&&mpOp[mpChi].nome)||"").trim().split(/\s+/)[0]);
        box.innerHTML='<div class="mp-avviso mp-avviso-lieve"><span>Niente da mostrare sulla carta '+esc(chiN)+'. Scegli «Tutti» in «Chi ci va» per vedere gli altri.</span></div>'+senzaHtml;
        finito=true;
        return;
      }
      if(!righe.length){
        box.innerHTML=tabVuoto("Nessun cantiere da mostrare",
          "Scrivi il campo «Dove» "+(_mpPro()?"nelle pratiche":"nei lavori")+", oppure l'indirizzo nelle schede clienti.",
          _SVGV+'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/></svg>')+senzaHtml;
        finito=true;
        return;
      }
      const nonTrovati=pPart?righe.filter(r=>!r.p&&!r.guasto).length:0;
      box.innerHTML=
        (mpGuasto?'<div class="mp-avviso"><span>Il servizio della carta adesso non risponde. Riprova fra qualche minuto con <b>Ricalcola distanze</b>.</span></div>':"")
        +(nonTrovati?'<div class="mp-avviso mp-avviso-lieve"><b>'+nonTrovati+(nonTrovati===1?' cantiere senza distanza':' cantieri senza distanza')+'.</b> Controlla il campo «Dove» '+(_mpPro()?'della pratica':'del lavoro')+' e scrivi anche il comune, per esempio <b>Via Verani 18, Rieti</b>.</div>':"")
        +'<div class="mp-righe">'
        +righe.map(r=>{
          /* 19 nov 2026 — un lavoro FATTO non e' in ritardo: prima la data
             passata usciva in rosso («49 giorni fa») come un lavoro da fare */
          const fatto=r.l.stato==="fatto";
          const q=quando(r.l.data_prevista,fatto?{neutro:true}:null);
          const rit=inRitardo(r.l.stato,r.l.data_prevista,r.l.pratica_stato);
          return '<div class="mp-riga'+(r.p?"":" senza")+'">'
            +'<div class="mp-r-testo">'
            +  '<div class="mp-r-tit">'+_mpU(r.l.descrizione||(_mpPro()?"Pratica":"Lavoro"))+'</div>'
            +  '<div class="mp-r-sub">'+_mpU(r.ind)
            +    (r.c?' · '+_mpU(r.c.nome||""):"")
            +    ' · '+(fatto?'<span class="mp-fatto">'+(_mpPro()?'fatta':'fatto')+'</span> · ':"")+'<span class="'+(rit?"q-passato":q.classe)+'">'+(rit?"in ritardo ("+esc(q.testo)+")":esc(q.testo))+'</span>'
            +    (r.ipotesi&&!r.sospetto?' · <span class="mp-ipotesi">comune ipotizzato: '+esc(comuneUff)+'</span>':"")
            +    (r.circa?' · <span class="mp-ipotesi">via trovata, numero no</span>':"")
            +    (fatto?"":' · <span class="mp-civa">Ci va: '+((mpOp[r.l.operatore_id]&&mpOp[r.l.operatore_id].nome)?_mpU(mpOp[r.l.operatore_id].nome):"nessuno")+'</span>')
            +    '</div>'
            +'</div>'
            +'<div class="mp-r-dist">'
            +  (r.km!=null?'<div class="mp-km">'+mpFormattaKm(r.km)+'</div><div class="mp-min">dall\'ufficio</div>'
                 :(!partenzaTxt?'<div class="mp-km">—</div><div class="mp-min">manca l\'ufficio</div>'
                   :(mpGuasto&&(r.guasto||!pPart)?'<div class="mp-km">?</div><div class="mp-min">riprova pi&ugrave; tardi</div>'
                   :(!pPart?'<div class="mp-km">?</div><div class="mp-min">ufficio non trovato</div>'
                   :(r.sospetto?'<div class="mp-km">?</div><div class="mp-min">scrivi anche il comune</div>'
                               :'<div class="mp-km">?</div><div class="mp-min">indirizzo non trovato</div>')))))
            +'</div>'
            /* 19 nov 2026 (sì di Alex) — «Apri» il lavoro */
            +'<button class="btn mp-r-btn" data-action="mp-apri" data-id="'+esc(String(r.l.id))+'">Apri</button>'
            /* 19 nov 2026 (sì di Alex) — mandalo a chi ci va, su WhatsApp */
            +(fatto?"":mpMandaBtn(r,mpOp))
            /* 19 nov 2026 — «Indicazioni» apre la STRADA per arrivarci (dal punto
               dove sei), non solo il punto sulla carta come faceva prima */
            +'<button class="btn mp-r-btn" data-action="mp-strada" data-q="'+esc(r.strada)+'">Indicazioni</button>'
            +'</div>';
        }).join("")
        +'</div>'
        +senzaHtml;
      finito=true;
    }catch(err){
      /* Se qualcosa va storto voglio vederlo scritto qui, non restare davanti a
         una pagina vuota senza sapere perché. */
      const m=(err&&(err.message||err.toString()))||"errore sconosciuto";
      if(box)box.innerHTML='<div class="mp-avviso"><b>La mappa si &egrave; fermata.</b><br>'
        +esc(m)+'<br><br>Se non si sistema, scrivici da Aiuto → Assistenza diretta e manda questa schermata: con questa scritta si capisce cosa sistemare.</div>';
      try{console.error("[MAPPA]",err);}catch(e){}
    }finally{
      /* «Ricalcola» e poi il servizio della carta (o la connessione) non
         risponde: rimetto i punti di prima, cosi' non si perdono le distanze */
      if(mpVecchi&&(mpGuasto||!finito)){
        const C3=mpLeggiCache();
        for(const k in mpVecchi)if(C3.punti[k]===undefined)C3.punti[k]=mpVecchi[k];
        mpSalvaCache();
      }
      mpInCorso=false;
      if(mpRifai){const f=mpRifaiForza;mpRifai=mpRifaiForza=false;setTimeout(()=>renderMappa(f),0);}
    }
  }

  /* ===== 24 nov 2026 — LE FOTO DELLA PRATICA IN UN PDF (sì di Alex) =====
     Allo studio e' la «Documentazione fotografica» da allegare alla pratica
     (CILA, SCIA, fine lavori) o da mandare al cliente; all'impresa sono le
     «Foto del lavoro». Intestazione come il PDF per il cliente delle
     Giornate (logo + nome da Dati azienda), poi pratica, cliente, luogo,
     data, e le foto due per riga, numerate, con la data. Allo studio in fondo
     la firma del tecnico. I video non ci vanno: lo dice il messaggio. */
  async function galPdfPratica(lavId,btn){
    if(!sb||!sbUid||!lavId)return;
    const pro=_galPro();
    const {data:fs,error}=await sb.from("gest_foto").select("id,storage_path,tipo,operatore,created_at")
      .eq("user_id",sbUid).eq("lavoro_id",lavId).order("created_at",{ascending:true});
    if(error){toast("Non riesco a leggere le foto: "+traduciErrore(String(error.message||"")));return;}
    const foto=(fs||[]).filter(f=>!_nonFoto(f.tipo)&&FOTO_TIPO_UI[f.tipo]);
    if(!foto.length){toast("Su questa pratica non ci sono foto da mettere nel PDF");return;}
    if(!(await caricaJsPDF())){toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova");return;}
    const J=window.jspdf&&window.jspdf.jsPDF;if(!J)return;
    const tBtn=btn?btn.textContent:"";if(btn){btn.disabled=true;btn.textContent="Preparo il PDF…";}
    try{
      const {data:l}=await sb.raw("gest_lavori").select("descrizione,dove,cliente_id").eq("id",lavId).eq("user_id",sbUid).maybeSingle();
      let cli="";
      if(l&&l.cliente_id){try{const {data:c}=await sb.raw("gest_clienti").select("nome").eq("id",l.cliente_id).maybeSingle();cli=(c&&c.nome)||"";}catch(e){}}
      const doc=new J({unit:"mm",format:"a4"}),W=210,M=15,FONDO=282;
      const T=x=>String(x==null?"":x).replace(/[\u2013\u2014]/g,"-").replace(/[^\x00-\xFF€]/g,"");
      let y=18;
      if(typeof window.gestLogoPdf==="function"){try{y=await window.gestLogoPdf(doc,M,y)||y;}catch(e){}}
      let nome="";
      try{const ra=await sb.from("gest_azienda").select("nome,ragione_sociale").eq("user_id",sbUid).maybeSingle();nome=(ra&&ra.data&&(ra.data.nome||ra.data.ragione_sociale))||"";}catch(e){}
      if(!nome){try{const ri=await sb.from("imprese").select("nome_attivita").eq("user_id",sbUid).maybeSingle();nome=(ri&&ri.data&&ri.data.nome_attivita)||"";}catch(e){}}
      if(nome){doc.setFont("helvetica","bold");doc.setFontSize(15);doc.setTextColor(10,42,77);doc.text(T(nome),M,y+2);doc.setTextColor(0);y+=9;}
      doc.setDrawColor(255,136,0);doc.setLineWidth(0.8);doc.line(M,y,W-M,y);y+=11;
      doc.setFont("helvetica","bold");doc.setFontSize(21);doc.text(pro?"Documentazione fotografica":"Foto del lavoro",M,y);y+=9;
      const riga=(et,v)=>{if(!v)return;doc.setFont("helvetica","bold");doc.setFontSize(11.5);doc.text(et,M,y);
        doc.setFont("helvetica","normal");const r=doc.splitTextToSize(T(v),W-2*M-28);doc.text(r,M+28,y);y+=6*r.length;};
      riga(pro?"Pratica":"Lavoro",(l&&l.descrizione)||"");
      riga("Cliente",cli);
      riga("Luogo",(l&&l.dove)||"");
      riga("Data",fdate(todayStr()));
      y+=5;
      const gap=6,cw=(W-2*M-gap)/2,ch=cw*0.75,cap=7;
      let n=0;
      for(const [tit,quale] of [[pro?"Prima dei lavori":"Prima del lavoro","prima"],[pro?"Fine lavori":"A lavoro finito","dopo"]]){
        const lista=foto.filter(f=>FOTO_TIPO_UI[f.tipo]===quale);
        if(!lista.length)continue;
        if(y+12+ch+cap>FONDO){doc.addPage();y=18;}
        doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text(T(tit),M,y);y+=5;
        for(let i=0;i<lista.length;i+=2){
          if(y+ch+cap>FONDO){doc.addPage();y=18;}
          for(let j=0;j<2&&i+j<lista.length;j++){
            const f=lista[i+j],x=M+j*(cw+gap);n++;
            const im=await gxImmagine(f.storage_path,1200,0.75);
            doc.setDrawColor(226,232,240);doc.setLineWidth(0.3);doc.rect(x,y,cw,ch);
            if(im){const k=Math.min(cw/im.w,ch/im.h),w=im.w*k,h=im.h*k;doc.addImage(im.url,"JPEG",x+(cw-w)/2,y+(ch-h)/2,w,h);}
            else{doc.setFontSize(10);doc.setTextColor(120);doc.text("Foto non disponibile",x+cw/2,y+ch/2,{align:"center"});doc.setTextColor(0);}
            doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(70);
            const chi=galNomeOp(f.operatore);
            doc.text(T("Foto "+n+" - "+fdate(String(f.created_at||"").slice(0,10))+(chi&&chi!=="Io"&&chi!=="Capo"?" - "+chi:"")),x,y+ch+4.5);
            doc.setTextColor(0);
          }
          y+=ch+cap+3;
        }
        y+=3;
      }
      if(pro){
        if(y+24>FONDO){doc.addPage();y=24;}
        y+=8;doc.setFont("helvetica","normal");doc.setFontSize(11);
        doc.text("Il tecnico",W-M-60,y);doc.setDrawColor(120);doc.setLineWidth(0.3);doc.line(W-M-60,y+14,W-M,y+14);
      }
      const tot=doc.getNumberOfPages();
      for(let p=1;p<=tot;p++){doc.setPage(p);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(140);
        doc.text("Pag. "+p+" di "+tot,W-M,292,{align:"right"});doc.setTextColor(0);}
      const pul=String((l&&l.descrizione)||"pratica").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g," ").trim().slice(0,60);
      doc.save((pro?"Documentazione fotografica - ":"Foto del lavoro - ")+pul+".pdf");
      const nV=Object.values(galRigheVideo||{}).filter(v=>String(v.lavoro_id)===String(lavId)).length;
      toast("PDF con "+(n===1?"1 foto":n+" foto")+" ✔"+(nV?" — i video non ci vanno: in un PDF non si guardano":""));
    }catch(e){toast("PDF non riuscito: "+String(e&&e.message||e));}
    finally{if(btn){btn.disabled=false;btn.textContent=tBtn;}}
  }

  /* ---- finestra "Carica foto o video" ---- */
  function galUploadForm(){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    /* 19 nov 2026 — se in Galleria stai guardando un cantiere solo, il lavoro
       e' gia' scelto: prima andava cercato di nuovo nella tendina. */
    const lavPre=String(galFilter&&galFilter.lav||"");
    const lavOpts=(galLavCache||[]).map(l=>'<option value="'+esc(l.id)+'"'+(String(l.id)===lavPre?" selected":"")+'>'+esc(l.descrizione||"Lavoro")+'</option>').join("");
    const dipOpts=dipCache.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.nome)+'</option>').join("");
    /* 10 agosto 2026 — era rimasta l'ultima finestrella piccola su un modulo.
       Convertita a finestra grande a due colonne come tutte le altre. */
    openSheetGrande('Carica foto o video',
       '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">'+(_galPro()?"Di che pratica si tratta":"Di che lavoro si tratta")+'</div>'
      +  '<div class="field"><label>Il lavoro</label>'
      +    '<select id="gu-lav"><option value="">'+esc(_msgPro("— scegli il lavoro —"))+'</option>'+lavOpts+'</select></div>'
      +  (lavOpts?'':'<div class="sh-nota" style="color:var(--attesa)">In questo reparto non hai ancora nessun lavoro: creane uno in <b>Lavori</b> e poi torna qui.</div>')
      +  '<div class="field"><label>Quando sono state fatte?</label><div class="seg" id="gu-quando">'
      +    '<button data-v="prima" class="on">'+(_galPro()?"Prima dei lavori":"Prima del lavoro")+'</button>'
      +    '<button data-v="dopo">'+(_galPro()?"Fine lavori":"A lavoro finito")+'</button></div></div>'
      +  '<div class="field"><label>Chi le ha fatte</label>'
      +    '<select id="gu-op"><option value="Capo">'+esc(_msgPro("Capo (io)"))+'</option>'+dipOpts+'</select></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">I file</div>'
      +  '<div class="field"><label>Foto (puoi sceglierne pi&ugrave; di una)</label>'
      +    '<input type="file" id="gu-foto" accept="image/*" multiple></div>'
      +  '<div class="field"><label>Video (uno per volta, massimo 50 MB)</label>'
      +    '<input type="file" id="gu-video" accept="video/*"></div>'
      +  '<div class="sh-nota">'+(_galPro()
            ?"Le foto della pratica entrano da sole nel <b>Verbale di sopralluogo</b>: caricale tutte qui."
            :"Le foto del prima e del dopo sono quelle che convincono il prossimo cliente: caricale sempre.")+'</div>'
      +  '<div id="gu-stato" class="gu-stato"></div>'
      +'</div>'
      +'</div></div>',

       '<button class="btn b-cancel" data-action="close">Annulla</button>'
      +'<button class="btn-primary b-save" data-action="gal-carica">Carica</button>');
    bindSeg("gu-quando");
  }

  /* la lista dei lavori serve alla finestra di caricamento: la tengo aggiornata */
  let galLavCache=[];
  async function galCaricaLavori(){
    if(!sb||!sbUid||!cur)return;
    const {data}=await sb.from("gest_lavori").select("id,descrizione,data_prevista")
      .eq("user_id",sbUid).eq("mestiere_id",curMestiere())
      .order("data_prevista",{ascending:false});
    galLavCache=data||[];
  }

  async function galCarica(){
    const lav=$("#gu-lav")?$("#gu-lav").value:"";
    if(!lav){toast("Scegli prima di quale lavoro sono");return;}
    const quando=segVal("gu-quando")||"prima";
    const tipoDb=quando==="prima"?"da_fare":"fatto";
    const op=$("#gu-op")?$("#gu-op").value:"Capo";
    const fotoFiles=$("#gu-foto")?Array.from($("#gu-foto").files||[]):[];
    const vidFile=($("#gu-video")&&$("#gu-video").files&&$("#gu-video").files[0])||null;
    if(!fotoFiles.length&&!vidFile){toast("Scegli almeno una foto o un video");return;}
    const st=$("#gu-stato"), btn=document.querySelector('[data-action="gal-carica"]');
    const dice=m=>{if(st)st.textContent=m;};
    if(btn){btn.disabled=true;btn.textContent="Sto caricando…";}
    let nF=0,nV=0,errori=[];
    try{
      let i=0;
      for(const file of fotoFiles){
        i++;dice("Foto "+i+" di "+fotoFiles.length+"…");
        /* 19 nov 2026 — un file che non e' una foto il deposito lo rifiuta con
           un messaggio in inglese («mime type … is not supported»): si dice
           prima, in italiano. */
        if(!/^image\//i.test(file.type||"")&&!/\.(jpe?g|png|webp|heic)$/i.test(file.name||"")){
          errori.push("«"+file.name+"» non è una foto");continue;
        }
        const pr=await preparaFileUpload(file);
        if(pr.errore){errori.push(pr.errore);continue;}
        const safe=pr.nome.replace(/[^a-zA-Z0-9._-]/g,"_");
        const path=sbUid+"/"+lav+"/"+Date.now()+"_"+safe;
        const {error:up}=await sb.storage.from("gestionale-foto").upload(path,pr.file);
        if(up){errori.push("Foto non caricata: "+up.message);continue;}
        const {error:ins}=await sb.from("gest_foto").insert({user_id:sbUid,lavoro_id:lav,tipo:tipoDb,operatore:op,storage_path:path});
        if(ins){await _fileOrfano("gestionale-foto",path);errori.push("Foto non salvata: "+ins.message);continue;}
        nF++;
      }
      if(vidFile){
        /* 19 nov 2026 — il deposito prende solo MP4, MOV e WEBM: gli altri
           tornavano con un messaggio in inglese. */
        const vidOk=/^video\/(mp4|quicktime|webm)$/i.test(vidFile.type||"")||(!vidFile.type&&/\.(mp4|mov|webm)$/i.test(vidFile.name||""));
        if(vidFile.size>52428800){errori.push("Il video pesa più di 50 MB: fanne uno più corto (circa un minuto)");}
        else if(!vidOk){errori.push("Questo video non si può caricare: va bene MP4 o MOV, quelli fatti col telefono");}
        else{
          dice("Sto caricando il video…");
          const safe=vidFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
          const path=sbUid+"/"+lav+"/"+Date.now()+"_"+safe;
          const {error:up}=await sb.storage.from("gestionale-video").upload(path,vidFile);
          if(up){errori.push("Video non caricato: "+up.message);}
          else{
            const {error:ins}=await sb.from("gest_video").insert({user_id:sbUid,lavoro_id:lav,tipo:tipoDb,operatore:op,storage_path:path});
            if(ins){await _fileOrfano("gestionale-video",path);errori.push("Video non salvato: "+ins.message);} else nV++;
          }
        }
      }
    }catch(e){errori.push(String(e&&e.message||e));}
    if(btn){btn.disabled=false;btn.textContent="Carica";}
    if(errori.length&&!nF&&!nV){dice(errori.join(" · "));toast(errori[0]);return;}
    closeSheet();
    const pezzi=[];if(nF)pezzi.push(nF===1?"1 foto":nF+" foto");if(nV)pezzi.push(nV===1?"1 video":nV+" video");
    /* 19 nov 2026 — se una parte non e' andata si dice QUALE, non «qualcosa» */
    /* 19 nov 2026 — diceva «1 foto caricato»: foto e' femminile */
    const _fin=nV?((nF+nV)===1?"o":"i"):(nF===1?"a":"e");
    toast(pezzi.join(" e ")+" caricat"+_fin+" ✔"+(errori.length?" — non caricato: "+errori.join("; "):""));
    renderGalleria();renderRiepilogo();
  }

  async function galDelFoto(id){
    const r=galRigheFoto[id];if(!r)return;
    const {data:tolte,error}=await sb.from("gest_foto").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Foto non eliminata: "+error.message);return;}
    if(!tolte||!tolte.length){toast("Foto non eliminata: non hai i permessi su questa riga");return;}
    let avviso=(window.cestinoAttivo&&window.cestinoAttivo())?"Foto nel cestino: la riprendi da lì":"Foto eliminata";
    if(r.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo())){
      const {error:eRm}=await sb.storage.from("gestionale-foto").remove([r.storage_path]);
      if(eRm)avviso="Riga eliminata, ma il file resta nel bucket: "+eRm.message;
    }
    delete fotoCache[id];delete galRigheFoto[id];
    renderGalleria();renderRiepilogo();toast(avviso);
  }

  async function galDelVideo(id){
    const r=galRigheVideo[id];if(!r)return;
    const {data:tolte,error}=await sb.from("gest_video").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Video non eliminato: "+error.message);return;}
    if(!tolte||!tolte.length){toast("Video non eliminato: non hai i permessi su questa riga");return;}
    let avviso=(window.cestinoAttivo&&window.cestinoAttivo())?"Video nel cestino: lo riprendi da lì":"Video eliminato";
    if(r.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo())){
      const {error:eRm}=await sb.storage.from("gestionale-video").remove([r.storage_path]);
      if(eRm)avviso="Riga eliminata, ma il file resta nel bucket: "+eRm.message;
    }
    delete galVideoCache[id];delete galRigheVideo[id];
    renderGalleria();renderRiepilogo();toast(avviso);
  }

  /* menu "..." della riga Agenda: tutte le azioni che prima erano pulsanti nella card */
