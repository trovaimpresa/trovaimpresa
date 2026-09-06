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

  const GAL_VUOTO=_SVGV+'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
  function galVuoto(box){
    box.style.display="block";
    box.innerHTML=tabVuoto("Nessuna foto o video da mostrare","Usa il pulsante «Carica foto o video» qui sopra, oppure cambia i filtri.",GAL_VUOTO);
  }
  /* ================= GALLERIA =================
     Da qui si carica, si guarda e si elimina. Prima la Galleria sapeva solo
     mostrare le foto: caricare ed eliminare si poteva fare unicamente dalla
     scheda del lavoro, e i video non si vedevano affatto.
     Ogni sezione fa il suo mestiere: le foto e i video sono mestiere di qui.
     ============================================ */

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
    if(v==="Capo")return "Capo";
    const d=(dipCache||[]).find(x=>String(x.id)===String(v));
    if(d&&d.nome)return d.nome;
    return galNomiOp[String(v)]||"";
  }

  async function renderGalleria(){
    if(!cur)return;
    const box=$("#gal-body");if(!box)return;
    const selOp=$("#gal-op-sel"), selLav=$("#gal-lav-sel");
    if(!sb||!sbUid){
      if(selOp)selOp.innerHTML='<option value="">Tutti</option>';
      if(selLav)selLav.innerHTML='<option value="">'+esc(_msgPro("Tutti i cantieri"))+'</option>';
      galVuoto(box);return;
    }
    const [{data:foto},{data:video},{data:lavori}]=await Promise.all([
      sb.from("gest_foto").select("id,lavoro_id,storage_path,tipo,operatore").eq("user_id",sbUid),
      sb.from("gest_video").select("id,lavoro_id,storage_path,tipo,operatore").eq("user_id",sbUid),
      sb.from("gest_lavori").select("id,descrizione,data_prevista").eq("user_id",sbUid).eq("mestiere_id",curMestiere())
    ]);
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
    if(galFilter.lav&&!conRoba.has(galFilter.lav))galFilter.lav="";
    if(selLav)selLav.innerHTML=['<option value=""'+(galFilter.lav===""?" selected":"")+'>'+esc(_msgPro("Tutti i cantieri"))+'</option>']
      .concat(lavArr.filter(l=>conRoba.has(l.id))
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
    const gruppi=new Map();
    const metti=(x,kind)=>{const k=x.lavoro_id||"";if(!gruppi.has(k))gruppi.set(k,[]);gruppi.get(k).push({x,kind});};
    F.forEach(f=>metti(f,"foto"));V.forEach(v=>metti(v,"video"));

    let html="";
    gruppi.forEach((arr,k)=>{
      const nF=arr.filter(a=>a.kind==="foto").length, nV=arr.length-nF;
      const conta=[nF?nF+(nF===1?" foto":" foto"):"",nV?nV+(nV===1?" video":" video"):""].filter(Boolean).join(" · ");
      html+='<div class="gal-group"><div class="gal-cantiere">'+esc(lavName[k]||"—")
          + '<span class="gal-conta">'+conta+'</span></div><div class="thumbs">';
      arr.forEach(({x,kind})=>{
        const q=quando(x), tag=q==="prima"?"Prima":"Finito", tcls=q==="prima"?"prima":"dopo";
        const op=galNomeOp(x.operatore);
        if(kind==="foto"){
          html+='<div class="thumb"><img data-gfoto="'+esc(x.id)+'" loading="lazy" decoding="async" width="150" height="150" data-action="view-foto" data-id="'+esc(x.id)+'" alt="">'
              + '<span class="thtag '+tcls+'">'+tag+'</span>'
              + (op?'<span class="thop">'+esc(op)+'</span>':"")
              + '<button class="thdel" data-action="gal-del-foto" data-id="'+esc(x.id)+'" title="Elimina">×</button></div>';
        }else{
          html+='<div class="thumb thumb-video" data-action="gal-play" data-id="'+esc(x.id)+'">'
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

  /* indirizzo scritto a mano -> punto sulla carta */
  async function mpTrovaPunto(indirizzo,vicinoA){
    const q=mpChiave(indirizzo);
    if(!q)return null;
    const C=mpLeggiCache();
    if(C.punti[q]!==undefined)return C.punti[q];       /* null incluso: già cercato e non trovato */
    let trovato;
    try{
      let url="https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=it&q="+encodeURIComponent(indirizzo);
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
        return null;                      /* non si scrive niente in memoria */
      }
      const d0=await r.json();
      const a=(d0&&d0[0])?d0[0]:null;
      const ad=(a&&a.address)||{};
      trovato=a?{lat:+a.lat,lon:+a.lon,nome:a.display_name||"",
                 comune:ad.city||ad.town||ad.village||ad.municipality||""}:null;
    }catch(e){
      /* rete caduta, richiesta bloccata: come sopra, non e' una risposta */
      await mpAspetta(1100);
      return null;
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

  function mpFormattaKm(km){
    if(km==null)return "—";
    return (km<10?(Math.round(km*10)/10).toString().replace(".",","):Math.round(km))+" km";
  }


  async function renderMappa(forza){
    const box=$("#mp-lista"), avviso=$("#mp-avviso");
    if(!box)return;
    if(!sb||!sbUid||!cur){box.innerHTML="";return;}
    if(mpInCorso)return;
    mpInCorso=true;
    try{
      if(forza){mpCache={punti:{}};mpSalvaCache();}

      /* 1) da dove si parte: l'indirizzo dell'azienda */
      /* ===== 12 agosto 2026 (sera) — L'UFFICIO FINIVA A CASO IN ITALIA =====
         Qui si leggevano SOLO «nome» e «indirizzo». Ma azIndirizzo() mette
         insieme via + CAP + citta' + provincia: senza quelle tre colonne
         l'indirizzo diventava un nudo «Via Roma 10», e il servizio delle mappe
         lo piazzava nella prima Via Roma 10 che trovava in Italia. Da li' in
         poi TUTTE le distanze erano sbagliate — e credibili, che e' peggio.
         E siccome il punto dell'ufficio serve anche a restringere la ricerca
         dei cantieri alla zona giusta, sbagliava pure quelli. */
      const {data:az}=await sb.from("gest_azienda")
        .select("nome,indirizzo,cap,citta,prov").eq("user_id",sbUid).maybeSingle();
      const partenzaTxt=azIndirizzo(az).trim();
      /* Anche senza l'indirizzo dell'ufficio la carta si vede lo stesso, con i pin
         dei cantieri: mancano solo i chilometri, perché non c'e' da dove misurarli. */
      if(avviso)avviso.innerHTML = partenzaTxt
        ? '<div class="mp-ufficio"><span class="mp-u-lab">Ufficio</span><b>'
          +esc(az.nome||"La tua azienda")+'</b><span class="mp-u-ind">'+esc(partenzaTxt)+'</span></div>'
        : '<div class="mp-avviso">Per vedere le distanze mi serve l\'indirizzo del tuo ufficio. Lo trovi nel pulsante <b>Azienda</b> in alto a destra, primo campo utile: <b>Indirizzo</b>. Scrivilo con via, numero e comune. Intanto la carta con i cantieri la vedi lo stesso.</div>';
      $("#mp-mappa").style.display="";

      /* 2) i lavori con un indirizzo */
      const [{data:lav},{data:cli}]=await Promise.all([
        sb.from("gest_lavori").select("id,descrizione,dove,stato,data_prevista,cliente_id").eq("user_id",sbUid).eq("mestiere_id",curMestiere()),
        /* stessa storia dell'ufficio: senza CAP, citta' e provincia l'indirizzo
           del cliente e' mezzo indirizzo, e il pin finisce dall'altra parte
           d'Italia */
        sb.from("gest_clienti").select("id,nome,indirizzo,cap,citta,prov").eq("user_id",sbUid).or(_cliOr(curMestiere()))
      ]);
      const cliMap=Object.fromEntries((cli||[]).map(c=>[c.id,c]));
      /* ATTENZIONE: qui la lista dei lavori NON si può chiamare L.
         Leaflet, la libreria che disegna la carta, si chiama proprio L: chiamando
         L la lista dei lavori le si andava sopra, e L.map("mp-mappa") non creava
         più la carta ma provava a scorrere la lista dei lavori. Da qui l'errore
         «string "mp-mappa" is not a function». */
      let LAV=(lav||[]);
      if(mpVista==="aperti")LAV=LAV.filter(l=>l.stato!=="fatto");
      const voci=LAV.map(l=>{
        const c=cliMap[l.cliente_id];
        /* cliIndirizzo() mette insieme via + CAP + citta' + provincia: prima
           qui si usava il solo c.indirizzo e si perdeva meta' indirizzo */
        const ind=(l.dove||"").trim()||cliIndirizzo(c).trim();
        return {l,c,ind};
      }).filter(v=>v.ind);

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
      if(partenzaTxt&&!pPart&&avviso){
        avviso.innerHTML='<div class="mp-avviso">Non trovo l\'indirizzo del tuo ufficio: ho cercato <b>'+esc(partenzaTxt)+'</b>. Scrivilo con via, numero e comune (per esempio <b>Via Roma 10, Rieti</b>) dal pulsante <b>Azienda</b> in alto a destra. Intanto la carta con i cantieri la vedi lo stesso.</div>';
      }
      if(pPart&&ok&&window.L){
        punti.push([pPart.lat,pPart.lon]);
        L.marker([pPart.lat,pPart.lon]).addTo(mpLayer)
          .bindPopup("<b>Il tuo ufficio</b><br>"+esc(az.nome||"La tua azienda"));
        inquadra();
      }

      /* 5) i cantieri, uno alla volta: il pin compare appena lo trovo */
      const righe=[];
      let fatti=1;
      for(const v of voci){
        /* Se l'indirizzo non dice in che comune sta ("via verani 18"), do' per
           buono il comune dell'ufficio. Prima cercavo alla cieca in tutta Italia
           e potevo pescare una via con lo stesso nome a centinaia di chilometri:
           usciva un numero preciso e completamente sbagliato. */
        const haComune=/\d{5}|,/.test(v.ind);
        const ipotesi=!haComune&&!!comuneUff;
        const q=v.ind+(haComune?", Italia":(comuneUff?", "+comuneUff+", Italia":", Italia"));
        const pt=await mpTrovaPunto(q,pPart);
        let km=(pt&&pPart)?mpDistanzaKm(pPart,pt):null;
        /* rete di sicurezza: se l'indirizzo era incompleto e il risultato è
           lontanissimo, non è il posto giusto. Meglio dire "non lo so". */
        const sospetto=(!haComune&&km!=null&&km>80);
        if(sospetto)km=null;
        righe.push({...v,p:sospetto?null:pt,km,ipotesi,sospetto});
        if(pt&&!sospetto&&ok&&window.L){
          punti.push([pt.lat,pt.lon]);
          const col=v.l.stato==="fatto"?"#059669":(inRitardo(v.l.stato,v.l.data_prevista)?"#DC2626":"#D97706");
          L.circleMarker([pt.lat,pt.lon],{radius:11,color:"#fff",weight:3,fillColor:col,fillOpacity:1})
            .addTo(mpLayer)
            .bindPopup("<b>"+esc(v.l.descrizione||"Lavoro")+"</b><br>"+esc(v.ind)
              +(km!=null?"<br><b>"+mpFormattaKm(km)+"</b> dall'ufficio":""));
          inquadra();
        }
        fatti++;dice(fatti-1,voci.length+1);
      }
      righe.sort((a,b)=>(a.km==null?1e9:a.km)-(b.km==null?1e9:b.km));
      /* metto da parte le distanze: la scheda Mappa del Riepilogo le legge da qui
         senza rifare nessun calcolo e senza chiamare nessun servizio */
      const C2=mpLeggiCache();C2.km={};
      righe.forEach(r=>{if(r.km!=null)C2.km[mpChiave(r.ind)]=r.km;});
      mpSalvaCache();

      /* 6) la lista sotto la carta */
      if(!righe.length){
        box.innerHTML=tabVuoto("Nessun cantiere da mostrare",
          "Scrivi il campo «Dove» nei lavori, oppure l'indirizzo nelle schede clienti.",
          _SVGV+'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/></svg>');
        return;
      }
      const nonTrovati=pPart?righe.filter(r=>!r.p).length:0;
      box.innerHTML=
        (nonTrovati?'<div class="mp-avviso mp-avviso-lieve"><b>'+nonTrovati+(nonTrovati===1?' cantiere senza distanza':' cantieri senza distanza')+'.</b> Nel campo «Dove» del lavoro scrivi anche il comune, per esempio <b>Via Verani 18, Rieti</b> invece di <b>via verani 18</b>. Senza il comune la stessa via esiste in cento paesi e non posso sapere quale sia il tuo.</div>':"")
        +'<div class="mp-righe">'
        +righe.map(r=>{
          const q=quando(r.l.data_prevista);
          const rit=inRitardo(r.l.stato,r.l.data_prevista);
          return '<div class="mp-riga'+(r.p?"":" senza")+'">'
            +'<div class="mp-r-testo">'
            +  '<div class="mp-r-tit">'+esc(r.l.descrizione||"Lavoro")+'</div>'
            +  '<div class="mp-r-sub">'+esc(r.ind)
            +    (r.c?' · '+esc(r.c.nome||""):"")
            +    ' · <span class="'+(rit?"q-passato":q.classe)+'">'+esc(q.testo)+'</span>'
            +    (r.ipotesi&&!r.sospetto?' · <span class="mp-ipotesi">comune ipotizzato: '+esc(comuneUff)+'</span>':"")
            +    '</div>'
            +'</div>'
            +'<div class="mp-r-dist">'
            +  (r.km!=null?'<div class="mp-km">'+mpFormattaKm(r.km)+'</div><div class="mp-min">dall\'ufficio</div>'
                 :(!pPart?'<div class="mp-km">—</div><div class="mp-min">manca l\'ufficio</div>'
                   :(r.sospetto?'<div class="mp-km">?</div><div class="mp-min">indirizzo troppo vago</div>'
                               :'<div class="mp-km">?</div><div class="mp-min">indirizzo non trovato</div>')))
            +'</div>'
            +'<button class="btn mp-r-btn" data-action="map" data-q="'+esc(r.ind)+'">Indicazioni</button>'
            +'</div>';
        }).join("")
        +'</div>';
    }catch(err){
      /* Se qualcosa va storto voglio vederlo scritto qui, non restare davanti a
         una pagina vuota senza sapere perché. */
      const m=(err&&(err.message||err.toString()))||"errore sconosciuto";
      if(box)box.innerHTML='<div class="mp-avviso"><b>La mappa si &egrave; fermata.</b><br>'
        +esc(m)+'<br><br>Manda questa schermata ad Alessio: con questa scritta si capisce cosa sistemare.</div>';
      try{console.error("[MAPPA]",err);}catch(e){}
    }finally{ mpInCorso=false; }
  }

  /* ---- finestra "Carica foto o video" ---- */
  function galUploadForm(){
    if(!sb||!sbUid){toast("Devi essere loggato");return;}
    const lavOpts=(galLavCache||[]).map(l=>'<option value="'+esc(l.id)+'">'+esc(l.descrizione||"Lavoro")+'</option>').join("");
    const dipOpts=dipCache.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.nome)+'</option>').join("");
    /* 10 agosto 2026 — era rimasta l'ultima finestrella piccola su un modulo.
       Convertita a finestra grande a due colonne come tutte le altre. */
    openSheetGrande('Carica foto o video',
       '<div class="sh-cols"><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">Di che lavoro si tratta</div>'
      +  '<div class="field"><label>Il lavoro</label>'
      +    '<select id="gu-lav"><option value="">'+esc(_msgPro("— scegli il lavoro —"))+'</option>'+lavOpts+'</select></div>'
      +  (lavOpts?'':'<div class="sh-nota" style="color:var(--attesa)">In questo reparto non hai ancora nessun lavoro: creane uno in <b>Lavori</b> e poi torna qui.</div>')
      +  '<div class="field"><label>Quando sono state fatte?</label><div class="seg" id="gu-quando">'
      +    '<button data-v="prima" class="on">Prima del lavoro</button>'
      +    '<button data-v="dopo">A lavoro finito</button></div></div>'
      +  '<div class="field"><label>Chi le ha fatte</label>'
      +    '<select id="gu-op"><option value="Capo">'+esc(_msgPro("Capo (io)"))+'</option>'+dipOpts+'</select></div>'
      +'</div>'
      +'</div><div class="sh-col">'
      +'<div class="sh-b"><div class="sh-tit">I file</div>'
      +  '<div class="field"><label>Foto (puoi sceglierne pi&ugrave; di una)</label>'
      +    '<input type="file" id="gu-foto" accept="image/*" multiple></div>'
      +  '<div class="field"><label>Video (uno per volta, massimo 50 MB)</label>'
      +    '<input type="file" id="gu-video" accept="video/*"></div>'
      +  '<div class="sh-nota">Le foto del prima e del dopo sono quelle che convincono il prossimo cliente: caricale sempre.</div>'
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
        if(vidFile.size>52428800){errori.push("Il video supera i 50 MB");}
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
    if(errori.length&&!nF&&!nV){dice(errori[0]);toast(errori[0]);return;}
    closeSheet();
    const pezzi=[];if(nF)pezzi.push(nF===1?"1 foto":nF+" foto");if(nV)pezzi.push(nV===1?"1 video":nV+" video");
    toast(pezzi.join(" e ")+" caricat"+((nF+nV)===1?"o":"i")+" ✔"+(errori.length?" (qualcosa non è andato)":""));
    renderGalleria();renderRiepilogo();
  }

  async function galDelFoto(id){
    const r=galRigheFoto[id];if(!r)return;
    const {data:tolte,error}=await sb.from("gest_foto").delete().eq("id",id).eq("user_id",sbUid).select("id");
    if(error){toast("Foto non eliminata: "+error.message);return;}
    if(!tolte||!tolte.length){toast("Foto non eliminata: non hai i permessi su questa riga");return;}
    let avviso="Foto eliminata";
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
    let avviso="Video eliminato";
    if(r.storage_path&&!(window.cestinoAttivo&&window.cestinoAttivo())){
      const {error:eRm}=await sb.storage.from("gestionale-video").remove([r.storage_path]);
      if(eRm)avviso="Riga eliminata, ma il file resta nel bucket: "+eRm.message;
    }
    delete galVideoCache[id];delete galRigheVideo[id];
    renderGalleria();renderRiepilogo();toast(avviso);
  }

  /* menu "..." della riga Agenda: tutte le azioni che prima erano pulsanti nella card */
