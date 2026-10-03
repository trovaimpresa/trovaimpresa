// [SPOSTATO] gest-reparti.js: era dentro gest-core.js, righe 422-1251, spostato identico.
  /* ===== 10 agosto 2026 — IL CLIENTE DEI DOCUMENTI =====
     Un documento gia' fatto non deve cambiare perche' hai messo il cliente nel
     cestino. Ma preventivo, conferma d'ordine, lettera d'incarico e verbale il
     nome del cliente lo rileggono ogni volta con sb.from, che dal 9 agosto salta
     le righe nel cestino: al posto del nome usciva "—" e l'indirizzo vuoto, su
     un foglio che il cliente firma.
     Qui si legge dalla porta di servizio (sb.raw), quella che vede tutto: per un
     DOCUMENTO il cliente serve com'era, cestino o no. A schermo invece resta il
     filtro, e l'elenco dei preventivi continua a dire "Nome (nel cestino)".
     sb.raw c'e' solo se il cestino e' acceso: se manca si usa sb.from, come prima. */
  function _sbTutto(tab){ return (sb.raw?sb.raw(tab):sb.from(tab)); }
  async function cliDelDocumento(clienteId,campi){
    if(!clienteId)return {};
    try{
      const {data}=await _sbTutto("gest_clienti").select(campi||"*")
        .eq("id",clienteId).eq("user_id",sbUid).maybeSingle();
      return data||{};
    }catch(e){ return {}; }
  }
  const sbRand=()=>Math.random().toString(36).slice(2,8).toUpperCase();
  const inviteLink=c=>location.href.replace(/[^/]*$/,"")+"gestionale-invito.html?codice="+c;
  function copyLink(txt){
    const ok=()=>toast("Link copiato ✔");
    const fb=()=>{const a=document.createElement("textarea");a.value=txt;a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.focus();a.select();let d=false;try{d=document.execCommand("copy");}catch(_){}document.body.removeChild(a);d?ok():prompt("Copia il link a mano:",txt);};
    (navigator.clipboard&&navigator.clipboard.writeText)?navigator.clipboard.writeText(txt).then(ok).catch(fb):fb();
  }

  /* ============================================================
     IL QR DELL'INVITO — 5 settembre 2026
     ============================================================
     In cantiere l'operaio non scrive un indirizzo a mano, e non sempre il capo
     ha il suo numero di WhatsApp. Il QR si inquadra con la fotocamera e si e'
     dentro. E' lo STESSO link di «Copia link»: non c'e' nessun secondo codice.

     ⚠️ La libreria del QR si scarica SOLO quando si preme il pulsante, non a
     ogni apertura del gestionale: e' un di piu', non deve pesare su chi non lo
     usa. E se non si scarica (niente linea, CDN giu') non si lascia una
     finestra vuota: si mostra il link scritto, che e' quello che serve davvero.
     ============================================================ */
  let _qrPronto=null;
  function _caricaQr(){
    if(window.QRCode)return Promise.resolve(true);
    if(_qrPronto)return _qrPronto;
    _qrPronto=new Promise(function(risolvi){
      const sc=document.createElement("script");
      sc.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      sc.onload=function(){risolvi(!!window.QRCode);};
      sc.onerror=function(){risolvi(false);};
      document.head.appendChild(sc);
    });
    return _qrPronto;
  }
  async function mostraQrInvito(link,nome){
    if(!link){toast("Questa persona non ha ancora un codice d'invito");return;}
    openSheet('<h3 style="margin:6px 0 4px">Il QR di '+esc(nome||"questa persona")+'</h3>'
      +'<p style="margin:0 0 14px;color:var(--muted);font-size:var(--f-base)">Faglielo inquadrare con la fotocamera del telefono: si apre la sua app e non deve scrivere niente.</p>'
      +'<div id="qr-box" style="display:flex;justify-content:center;padding:14px;background:#fff;border:1px solid var(--linea,#e3e8ef);border-radius:12px;min-height:200px;align-items:center">Sto preparando il QR…</div>'
      +'<p style="margin:12px 0 0;font-size:13px;color:var(--muted);word-break:break-all">'+esc(link)+'</p>'
      +'<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'
      +'<button class="btn" data-action="sq-copy" data-link="'+esc(link)+'">🔗 Copia il link</button></div>');
    const ok=await _caricaQr();
    const box=document.getElementById("qr-box");
    if(!box)return;               /* la finestra e' gia' stata chiusa */
    box.innerHTML="";
    if(!ok){
      box.textContent="Il QR non si e' potuto disegnare (manca la linea). Usa il link qui sotto o «Invia su WhatsApp».";
      return;
    }
    try{ new window.QRCode(box,{text:link,width:220,height:220,correctLevel:window.QRCode.CorrectLevel.M}); }
    catch(_){ box.textContent="Il QR non si e' potuto disegnare. Usa il link qui sotto."; }
  }

  let ruoloUtente=null;

  /* ⛔ 21 agosto 2026 — COME SI CHIAMA IL GESTIONALE.
     Uno solo, ma ognuno legge il nome del suo mestiere: e' la scelta di
     Alessio del 21 agosto, presa dopo aver guardato cosa costerebbe
     dividerlo davvero (24.000 righe da tenere in due copie, per l'1% che
     e' diverso).
     ⚠️ I nomi delle chiavi sono quelli veri del database (`imprese.tipo`),
        gli stessi delle tre scelte di _chiediTipo(): impresa · artigiano ·
        professionista. Il negozio ha un gestionale suo, non passa di qui.
     ⚠️ Chi non ha ancora scelto il tipo (registrazione a meta') NON deve
        vedere un nome sbagliato: legge «Il tuo gestionale», come prima. */
  const _NOMI_GESTIONALE={
    impresa:'Gestionale impresa',
    artigiano:'Gestionale artigiano',
    professionista:'Gestionale studio'
  };
  function nomeGestionale(){
    return _NOMI_GESTIONALE[String(ruoloUtente||'').trim().toLowerCase()]||'Il tuo gestionale';
  }
  function applicaNomeGestionale(){
    const nome=nomeGestionale();
    /* titolo grande della schermata iniziale (statico nell'HTML, fuori dal translator) */
    const lt=document.querySelector('.landing-top h1');
    if(lt)lt.textContent=nome;
    /* ⛔ 18 settembre 2026 — LA RIGA SOTTO IL TITOLO E LA NOTA DEI REPARTI.
       Sono scritte nell'HTML statico, cioè FUORI da #appview: il traduttore
       delle pratiche non le ha mai viste. Allo studio tecnico la prima
       schermata diceva ancora «Lavori, preventivi e fatture» e parlava di
       idraulica e giardinaggio, mentre da dentro era tutto «pratiche».
       Stanno qui perché qui sta già il titolo della stessa schermata: una
       regola che vale per la landing sta in un posto solo. */
    const _pro18=(ruoloUtente==='professionista');
    const ls=document.querySelector('.landing-top small');
    /* \u26a0\ufe0f 18 settembre 2026 \u2014 NON \u00abparcelle\u00bb: dentro, la sezione si chiama
       FATTURE anche per lo studio tecnico. Una riga che promette una parola
       che poi nel menu non c'\u00e8 manda a cercare una cosa che non esiste. */
    if(ls)ls.textContent=_pro18?'Pratiche, preventivi e fatture':'Lavori, preventivi e fatture';
    const ln=document.querySelector('.landing-nota-rep');
    if(ln)ln.innerHTML=_pro18
      ? 'Un <b>reparto</b> serve solo per tenere separate due attivit\u00e0, per esempio strutture e catasto.'
      : 'Un <b>reparto</b> serve solo per tenere separate due attivit\u00e0, per esempio idraulica e giardinaggio.';
    /* e il nome della scheda del browser, che si vede quando si tengono
       aperte piu' pagine */
    document.title=nome+' — TrovaImpresa';
  }

  /* Legge la categoria (tipo) dell'utente loggato — stesso metodo dei pannelli: tabella 'imprese', campo 'tipo', chiave user_id */
  async function logRuoloUtente(uid){
    if(!sb||!uid){console.log('[gestionale] ruolo utente: nessun utente loggato');return;}
    const {data,error}=await sb.from('imprese').select('tipo').eq('user_id',uid).maybeSingle();
    if(error){console.log('[gestionale] ruolo utente: errore lettura',error.message);return;}
    ruoloUtente=data&&data.tipo?data.tipo:null;
    /* 24 set 2026 — nel giro (dati finti) il mestiere lo dice l'indirizzo:
       la domanda «Che lavoro fai?» non si fa, non c'e' niente da salvare. */
    if(TI_GIRO)ruoloUtente=GIRO_TIPO;
    /* ⚠️ CHI NON HA IL TIPO NON E' UN ERRORE: E' UNA REGISTRAZIONE A META'.
       14 agosto 2026. Sul database ci sono 4 account veri con `tipo` vuoto
       (e anche il nome dell'attività vuoto): si sono iscritti e non hanno
       finito. Il gestionale li trattava come «né impresa né artigiano né
       professionista» e mostrava le etichette di partenza — cioè quelle
       dell'impresa edile anche a un geometra, con le aliquote sbagliate.
       Non era scritto da nessuna parte, e loro non potevano saperlo.
       Adesso glielo si chiede, una volta sola, appena entrano. Vale anche
       per chi si registrerà male domani: la domanda si ripresenta finché
       non risponde, e la risposta va nel database sua. */
    if(!ruoloUtente&&!_tipoChiesto)_chiediTipo(uid);
    /* Barra FONDATORE: "Vedi come" fa provare le altre categorie senza cambiare
       account. È solo una vista: i dati mostrati restano i propri. */
    try{var _vq=new URLSearchParams(location.search).get("vedi");if(_vq!==null){_vq?sessionStorage.setItem("ti_vedi_tipo",_vq):sessionStorage.removeItem("ti_vedi_tipo");}}catch(_e){}
    try{var _vc=sessionStorage.getItem("ti_vedi_tipo");if(_vc)ruoloUtente=_vc;}catch(_e){}
    console.log('[gestionale] ruolo utente:',ruoloUtente||'(nessun profilo)');
    /* scadenzario attivo per tutti i ruoli (imprese: DURC, assicurazioni, mezzi...) */
    const _tabScad=document.querySelector('#tab-scadenzario');
    if(_tabScad)_tabScad.style.display='';
    /* ⛔ 21 agosto 2026 — IL NOME DEL GESTIONALE STA IN UN POSTO SOLO (qui sotto).
       Chi si registra come impresa apre il «Gestionale impresa», l'artigiano il
       «Gestionale artigiano», lo studio tecnico il «Gestionale studio».
       ⚠️ Prima il nome dello studio («Gestionale Studio») stava scritto qui
          dentro il ramo del professionista: se domani si aggiunge un nome
          nuovo si finisce con la stessa regola in due posti — ed e' la
          lezione che e' gia' costata una giornata. Adesso il nome lo decide
          nomeGestionale() e basta. */
    applicaNomeGestionale();
    /* 30 set 2026 — parole semplici per artigiano e impresa (lo studio resta com'era) */
    if(ruoloUtente!=='professionista'){
      const _bj=document.querySelector('[data-action="export-json"]');
      if(_bj&&/Backup/.test(_bj.textContent))_bj.textContent="Salva una copia dei dati";
      const _rc=document.querySelector('[data-action="report-csv"]');
      if(_rc)_rc.textContent="⬇ Scarica per Excel";
    }
    if(ruoloUtente==='professionista'){
      const sub=document.querySelector('.landing-sub');
      if(sub)sub.textContent="Ogni reparto è separato: pratiche, clienti, collaboratori e calendario non si mischiano.";
      const fsearch=document.querySelector('#f-search'); /* placeholder in HTML statico: per-ruolo via JS, non dal translator */
      if(fsearch)fsearch.placeholder="Cerca cliente o pratica...";
      /* la ricerca unica: allo studio tecnico non si dice «lavoro», si dice
         «pratica» — come in tutto il resto del suo pannello */
      const ctq=document.querySelector('#ct-q');
      if(ctq)ctq.placeholder="Cerca un nome: cliente, pratica, preventivo, fattura";
      avviaLocalizzazionePratiche();
      adattaMenuProfessionista();
      renderScadenze();
      if(!cur)renderLanding(); /* ruoloUtente noto solo ora: ridisegna le card landing coi contatori "pratiche" */
    } else if(ruoloUtente==='artigiano'){
      /* ⛔ 22 agosto 2026 — la terza faccia. Prima l'artigiano cadeva qui sotto,
         nel ramo dell'impresa edile, ed e' da li' che gli arrivavano Computo
         metrico, Prezzario e Stati di avanzamento. */
      adattaMenuArtigiano();
    } else {
      adattaMenuImpresa();
    }
  }

  /* ===== 14 agosto 2026 — «Che lavoro fai?», per chi non l'ha mai detto =====
     Sono le registrazioni rimaste a metà: `imprese.tipo` vuoto. Finché resta
     vuoto il gestionale mostra le etichette dell'impresa edile a tutti, IVA
     al 10% compresa — a un geometra sono sbagliate, e lui non ha nessun modo
     di accorgersene.
     Tre voci sole, scritte come le direbbe lui, e si sceglie una volta. */
  let _tipoChiesto=false;
  function _chiediTipo(uid){
    _tipoChiesto=true;
    const scelte=[
      ["impresa","Impresa edile",
       "Cantieri, squadra, mezzi. Lavori, preventivi e fatture con l'IVA al 10%."],
      ["artigiano","Artigiano",
       "Idraulico, elettricista, imbianchino, giardiniere: lavori tuoi, con o senza dipendenti."],
      ["professionista","Studio tecnico",
       "Geometra, architetto, ingegnere, perito. Pratiche invece di lavori, parcelle con cassa e ritenuta."]
    ];
    openSheetGrande("Che lavoro fai?",
      '<div class="sh-b"><div class="sh-tit">Scegli come sei</div>'
      + '<div class="sh-nota" style="margin-bottom:12px">Serve a chiamare le cose col loro nome e a mettere le aliquote giuste. Lo scegli una volta e si cambia quando vuoi.</div>'
      + '<div class="fn-scelte">'
      +   scelte.map(function(s){
            return '<button type="button" class="fn-s" data-action="scegli-tipo" data-id="'+s[0]+'">'
              + '<span class="fn-t">'+s[1]+'</span>'
              + '<span class="fn-d">'+s[2]+'</span></button>';
          }).join("")
      + '</div></div>',
      '<button class="btn b-cancel" data-action="close">Lo faccio dopo</button>');
  }
  async function _salvaTipo(t){
    if(!sb||!sbUid||!t)return;
    const {data,error}=await sb.from("imprese").update({tipo:t}).eq("user_id",sbUid).select("user_id");
    /* ⚠️ come sul piano nella barra del fondatore: Supabase NON lancia mai su
       errore, e zero righe aggiornate non è un errore. Se non si controllano
       tutte e due le cose si dice «fatto» a chi non ha salvato niente. */
    if(error||!data||!data.length){
      toast("Non sono riuscito a salvare: "+((error&&error.message)||"nessuna riga aggiornata")+". Riprova.");
      return;
    }
    closeSheet();
    toast("Fatto ✔ Ricarico con le etichette giuste…");
    setTimeout(function(){location.reload();},900);
  }

  /* ===== 6 agosto 2026 — Menu su misura per lo studio professionale =====
     Un architetto o un geometra non ha furgoni, betoniere e carte carburante:
     quelle sezioni si nascondono. "Squadra" diventa "Collaboratori" e il gruppo
     "Azienda" diventa "Studio".
     Si NASCONDE soltanto: i dati restano nel database e le sezioni tornano
     visibili da sole se l'utente cambia tipo. Nessuna cancellazione. */
  /* 9 agosto 2026 — le Attrezzature restano visibili agli studi, rinominate
     "Strumenti": stazione totale, distanziometro laser, termocamera e livello
     hanno la TARATURA PERIODICA obbligatoria, ed è esattamente il mestiere di
     questa sezione (scadenze delle verifiche). Restano nascosti solo i mezzi
     con la targa e le carte carburante. */
  const TAB_NASCOSTI_PRO=['mezzi','carte'];
  function adattaMenuProfessionista(){
    if(ruoloUtente!=='professionista')return;
    try{
      TAB_NASCOSTI_PRO.forEach(function(t){
        document.querySelectorAll('[data-tab="'+t+'"]').forEach(function(el){ el.style.display='none'; });
      });
      /* Squadra -> Collaboratori */
      document.querySelectorAll('[data-tab="squadra"] span').forEach(function(s){
        if(s.textContent.trim()==='Squadra')s.textContent='Collaboratori';
      });
      /* Attrezzature -> Strumenti (voce di menu, titolo e testo della sezione) */
      document.querySelectorAll('[data-tab="attrezzature"] span').forEach(function(s){
        if(s.textContent.trim()==='Attrezzature')s.textContent='Strumenti';
      });
      /* Crediti formativi: voce nascosta a tutti, accesa solo per gli studi */
      var _tabC=document.querySelector('#tab-crediti');
      if(_tabC)_tabC.style.display='';
      /* Computo metrico: nascosta a tutti, accesa per gli studi tecnici */
      var _tabCo=document.querySelector('#tab-computi');
      if(_tabCo)_tabCo.style.display='';
      /* 30/09/2026 — per uno studio il Computo metrico e' il lavoro principale:
         sale in vista nel menu corto, sotto Clienti (era dentro «Altre voci»). */
      window._tiPromuovi=[['computi','clienti']];
      if(typeof window.menuCortoPromuovi==='function')window.menuCortoPromuovi('computi','clienti');
      /* 30/09/2026 — in Mezzi la frase mandava a «Attrezzature», ma per gli studi
         la voce si chiama «Strumenti» (come nel menu). */
      var _miz=document.querySelector('#mezzi .gal-intro b');
      if(_miz&&_miz.textContent.trim()==='Attrezzature')_miz.textContent='Strumenti';
      /* il Prezzario va insieme al computo: senza computo non serve a niente */
      var _tabPz=document.querySelector('#tab-prezzario');
      if(_tabPz)_tabPz.style.display='';
      /* Gli stati di avanzamento stanno dentro il computo: si accendono
         insieme a lui. Se un domani il computo si accende anche alle imprese
         edili, questa voce va accesa nello stesso punto -- una regola che sta
         in due posti non si sistema a meta'. */
      var _tabSal=document.querySelector('#tab-sal');
      if(_tabSal)_tabSal.style.display='';
      var _secA=document.querySelector('#attrezzature');
      if(_secA){
        var _h=_secA.querySelector('h2'); if(_h&&_h.textContent.trim()==='Attrezzature')_h.textContent='Strumenti';
        var _b=_secA.querySelector('.btn.add'); if(_b)_b.textContent='+ Nuovo strumento';
        var _i=_secA.querySelector('.gal-intro');
        if(_i)_i.textContent="Stazione totale, distanziometro laser, termocamera, livello: gli strumenti dello studio, con le date delle tarature e delle verifiche. Il Riepilogo ti avvisa prima che scadano.";
      }
      /* intestazione del gruppo: "Azienda" -> "Studio" */
      document.querySelectorAll('.side-group').forEach(function(g){
        if(g.textContent.trim()==='Azienda')g.textContent='Studio';
      });
      /* se l'utente era già dentro una sezione nascosta, lo riporto al riepilogo */
      var attivo=document.querySelector('[data-tab].active');
      if(attivo && TAB_NASCOSTI_PRO.indexOf(attivo.getAttribute('data-tab'))>=0){
        var home=document.querySelector('[data-tab="riepilogo"]');
        if(home)home.click();
      }
    }catch(_){}
  }
  /* ============================================================
     ⛔ 22 agosto 2026 — LA TERZA FACCIA: IL GESTIONALE ARTIGIANO
     ============================================================
     Deciso da Alessio il 21 agosto sera, foglio in
     `prove-claude/GESTIONALE-ARTIGIANO.md`. NON e' un file suo: e' la terza
     faccia di questo, come lo studio tecnico. 24.323 righe di cui cambia
     meno dell'1%: un file separato vuol dire pagare due volte ogni
     correzione.

     ⛔ SI NASCONDE SOLTANTO. I dati restano nel database e le voci tornano
     da sole se `imprese.tipo` cambia. Nessuna cancellazione, nessuna query.

     ⚠️ ATTENZIONE A COME SONO ACCESE LE VOCI, perche' non sono tutte uguali:
       - `computi`, `prezzario`, `sal`, `crediti` nell'HTML nascono gia' con
         `style="display:none"`. Non le accende nessuno per conto suo: le
         accendeva SOLO adattaMenuImpresa() (le prime tre) e
         adattaMenuProfessionista() (tutte e quattro). Quindi all'artigiano
         basta NON passare da li'. Le rimetto comunque a `none` qui sotto,
         esplicitamente: se un domani qualcuno le accende in un terzo posto,
         l'artigiano non se le ritrova addosso in silenzio.
       - `squadra`, `agenda`, `carte` sono accese per tutti nell'HTML.
         ⚠️ Fino al 4 set venivano spente a mano qui sotto; dal 5 settembre
         2026 restano ACCESE anche all'artigiano (vedi il riquadro sotto).

     ⚠️ Squadra si spegne ma Attrezzature resta. Guardato nel codice: nella
     scheda dell'attrezzatura NON c'e' nessuna tendina che pesca dalla
     squadra — c'e' solo la nota libera «Dove si trova, chi lo usa». Quindi
     non resta nessuna tendina vuota e non c'e' niente da cambiare.
     La tendina «Chi ci va» nella scheda del LAVORO invece resta com'e':
     scelta di Alessio, 22 agosto — «per adesso lasciala».
     ============================================================ */
  /* ============================================================
     5 SETTEMBRE 2026 -- SQUADRA, AGENDA E CARTE TORNANO ALL'ARTIGIANO
     ============================================================
     Fino a oggi qui c'era ['squadra','agenda','carte']: era una scelta VERA
     di Alessio (21 agosto sera, foglio prove-claude/GESTIONALE-ARTIGIANO.md,
     alla voce Squadra: «se lavora da solo non serve»). NON era una svista.
     ⛔ Ma quella scelta e' di PRIMA che nascesse il gestionale operatore.
     Con Squadra spenta l'artigiano non puo' invitare NESSUNO: la pagina
     dell'invito non e' raggiungibile, quindi gest_membri resta vuota e
     gestionale-operatore.html per lui non esiste. E gli artigiani sono gli
     iscritti piu' numerosi (→62← contro →44← imprese).
     Riacceso da Alessio il 5 settembre 2026: un idraulico con due ragazzi e'
     esattamente il caso d'uso. Restano spente solo le →4← voci da appalti
     (computo, prezzario, SAL nascoste nell'HTML + `crediti` qui sotto).
     ============================================================ */
  const TAB_NASCOSTI_ART=[];
  /* ============================================================
     29 agosto 2026 — IL COMPUTO TORNA ANCHE ALL'ARTIGIANO
     ============================================================
     Deciso da Alessio: anche a un artigiano il geometra manda il computo
     senza prezzi e gli chiede il preventivo. Il 22 agosto le tre voci
     Computo / Prezzario / SAL erano state tolte staccandolo dal ramo
     dell'impresa; oggi le rivuole.
     ⛔ QUI DENTRO RESTA SOLO `crediti`: e' l'unica voce da appalti che
     l'artigiano non ha (i crediti formativi sono degli studi tecnici).
     ⚠️ Questo elenco NON serve solo al menu: `tabNascosti()` lo legge anche
     per le schede del Riepilogo e per decidere se leggere i computi dal
     database. Togliere le tre voci da qui le accende in tutti e tre i posti
     insieme -- una regola che sta in due posti non si sistema a meta'.
     ⚠️ Le parole: `_cm()` da' gia' le parole dell'impresa a chiunque non sia
     studio tecnico, quindi l'artigiano legge «Computo da prezzare» senza
     nessuna riga in piu'. Scelta di Alessio, 29 agosto: parole uguali
     all'impresa.
     ============================================================ */
  const TAB_APPALTI_ART=['crediti'];
  /* ⛔ LA PAROLA STA IN UN POSTO SOLO (qui), ma va scritta in TRE punti.
     «Lavori» diventa «Lavori e interventi»: Alessio ha chiesto di tenere
     tutte e due le parole, cosi' va bene sia a chi fa cantieri sia a chi fa
     mezze giornate. ⚠️ Il terzo punto e' la BARRA IN BASSO del telefono:
     dimenticarla e' esattamente il difetto trovato sul gestionale del
     geometra («sul telefono il menu resta Lavori»). */
  const LAV_ART='Lavori e interventi';
  /* ============================================================
     ⛔ LA PAROLA DEL LAVORO STA QUI DENTRO, E SOLO QUI
     ============================================================
     22 agosto, secondo giro. La prima volta l'avevo cambiata in TRE posti e
     mi ero convinto che bastasse. Alessio ha mandato la fotografia del
     gestionale vero: la scheda del Riepilogo diceva ancora «Lavori».
     ⚠️ E' lo stesso identico inciampo del computo, il 20 agosto — la' erano
     dieci posti invece di quattro. Rincorrere le parole una per una non
     funziona: la volta dopo se ne dimentica un'altra. Adesso chi la deve
     SCRIVERE la chiede a `_lav()`, e chi la deve RISCRIVERE nell'HTML gia'
     stampato lo fa in adattaMenuArtigiano(). Il banco legge tutta la pagina
     e cerca la parola sbagliata: prova 21.
     ⚠️ Per lo studio tecnico la parola resta «Pratiche», come prima: qui
     dentro c'e' anche il suo caso, se no la stessa regola tornava a stare in
     due posti. */
  function _lav(){
    if(ruoloUtente==='artigiano')return LAV_ART;
    if(ruoloUtente==='professionista')return 'Pratiche';
    return 'Lavori';
  }
  function adattaMenuArtigiano(){
    if(ruoloUtente!=='artigiano')return;
    try{
      /* ⚠️ tutto dentro `nav.tabs`: fuori di li' ci sono i pulsantini
         `.lav-dots` delle righe, che hanno anche loro un `data-tab`. */
      const nav=document.querySelector('nav.tabs');
      if(!nav)return;
      TAB_NASCOSTI_ART.concat(TAB_APPALTI_ART).forEach(function(t){
        nav.querySelectorAll('[data-tab="'+t+'"]').forEach(function(el){ el.style.display='none'; });
      });
      /* ⛔ 29 agosto 2026 — le tre voci del computo si accendono DA UN PUNTO
         SOLO: adattaMenuImpresa(). Quella funzione accende #tab-computi,
         #tab-prezzario e #tab-sal e riscrive le parole con _cm(); esce da
         sola solo per gli studi tecnici, quindi per l'artigiano fa
         esattamente la stessa cosa che fa per l'impresa edile.
         ⚠️ NON si ricopiano qui le tre righe: la regola del computo sta in
         un posto solo, come la parola. */
      adattaMenuImpresa();
      /* 1) la voce del menu di sinistra */
      nav.querySelectorAll('[data-tab="lavori"] span').forEach(function(s){
        if(s.textContent.trim()==='Lavori')s.textContent=LAV_ART;
      });
      /* 2) il titolo della sezione */
      var _h=document.querySelector('#lavori h2');
      if(_h&&_h.textContent.trim()==='Lavori')_h.textContent=LAV_ART;
      /* 3) la barra in basso del telefono */
      document.querySelectorAll('#barra-basso [data-vai="lavori"] span').forEach(function(s){
        if(s.textContent.trim()==='Lavori')s.textContent=LAV_ART;
      });
      /* se era gia' dentro una sezione che adesso e' spenta, torna al riepilogo */
      var attivo=nav.querySelector('[data-tab].active');
      if(attivo && tabNascosto(attivo.getAttribute('data-tab'))){
        var home=nav.querySelector('[data-tab="riepilogo"]');
        if(home)home.click();
      }
    }catch(_){}
  }

  /* ============================================================
     ⛔ 22 agosto 2026 — QUALI VOCI SONO SPENTE: SI CHIEDE QUI, E SOLO QUI
     ============================================================
     Una regola che sta in due posti non si sistema a meta'. Le voci spente
     servono a DUE schermate:
       1. il menu di sinistra (adattaMenuProfessionista / adattaMenuArtigiano);
       2. il RIEPILOGO, che ha una scheda per ogni voce del menu.
     Se l'elenco restasse solo nel menu, il Riepilogo mostrerebbe la scheda di
     una sezione senza voce, e un clic porterebbe in una schermata fantasma —
     e' esattamente il motivo per cui il 10 agosto era nato `_proNascosto`.
     Adesso lo chiedono tutti e due a questa funzione.
     ⚠️ NON si guarda il `display` del pulsante: il Riepilogo puo' disegnarsi
     prima che il menu sia stato adattato, e si leggerebbe «acceso» per tutti. */
  function tabNascosti(){
    if(ruoloUtente==='professionista')return TAB_NASCOSTI_PRO;
    if(ruoloUtente==='artigiano')return TAB_NASCOSTI_ART.concat(TAB_APPALTI_ART);
    return [];
  }
  function tabNascosto(t){ return tabNascosti().indexOf(t)>=0; }

  /* ============================================================
     20 agosto 2026 — IL COMPUTO SI APRE ANCHE ALLE IMPRESE
     ============================================================
     Fino a ieri Computo metrico e Prezzario li accendeva SOLO
     adattaMenuProfessionista(): le 87 imprese iscritte non vedevano nemmeno
     la voce. Era scritto nel file dal 10 agosto — «accenderla anche per le
     imprese edili e' una riga, quando si decide» — e quel «quando si decide»
     e' arrivato il 20 agosto.

     ⛔ LA DECISIONE E' DI ALESSIO, ED E' NATA DA UNA COSA CHE HA DETTO LUI:
        «a volte il geometra ci consegna il computo SENZA PREZZI e il
        preventivo ce lo dobbiamo fare noi sul suo computo».
        Il computo *estimativo* lo redige il tecnico — su questo non si
        discute. Ma IL PREZZO LO FA L'IMPRESA, e oggi lo fa su Excel.

     ⚠️ E QUINDI SI CHIAMA IN UN ALTRO MODO. «Computo metrico» e' la parola
     del tecnico, di una cosa che lui CREA. L'impresa quel documento se lo
     trova in mano e ci deve mettere i prezzi: per lei si chiama «Computo da
     prezzare». Stessa sezione, due nomi — come «pratica» e «lavoro». Gli
     studi tecnici non si accorgono di niente.

     ⚠️ IL PREZZARIO SI ACCENDE INSIEME, per forza: senza, il pulsante
     «Prendi i prezzi dal prezzario» non ha da dove pescarli e sarebbe un
     pulsante che non fa mai niente.
     ⚠️ Anche gli «Stati di avanzamento», deciso da Alessio: sui lavori
     PRIVATI non c'e' nessun direttore dei lavori e il SAL se lo fa l'impresa
     da sola. Il riquadro dei SAL sta dentro il computo comunque: lasciare la
     voce spenta l'avrebbe solo resa piu' difficile da trovare.
     ============================================================ */
  /* ============================================================
     ⛔ LA PAROLA DEL COMPUTO STA QUI DENTRO, E SOLO QUI
     ============================================================
     20 agosto 2026, secondo giro. La prima volta avevo cambiato il nome in
     QUATTRO posti e mi ero convinto che bastasse. Alessio ha mandato la
     fotografia della pagina vera: il titolo della finestra diceva ancora
     «Nuovo computo metrico» e la pagina vuota parlava di «vuoti da
     detrarre». Erano DIECI posti, non quattro.

     Rincorrere le parole una per una non funziona: la volta dopo se ne
     dimentica un'altra. Adesso la parola sta in questa tabella, e chi la
     deve scrivere la chiede a _cm(). Un posto nuovo che si dimentica di
     chiedergliela lo trova il banco, che legge tutta la pagina e cerca la
     parola sbagliata.
     ============================================================ */
  const _CM={
    pro:{
      nome:"Computo metrico", uno:"computo metrico", tanti:"computi metrici",
      nuovo:"Nuovo computo metrico", crea:"+ Nuovo computo",
      primo:"+ Crea il primo computo", vuoto:"Ancora nessun computo",
      spiega:"Un computo raccoglie le lavorazioni con le loro misure: parti uguali, lunghezza, larghezza, altezza, e i vuoti da detrarre. La quantità la calcola il gestionale."
    },
    imp:{
      nome:"Computo da prezzare", uno:"computo da prezzare", tanti:"computi da prezzare",
      nuovo:"Nuovo computo da prezzare", crea:"+ Nuovo computo",
      primo:"+ Crea il primo computo", vuoto:"Ancora nessun computo da prezzare",
      spiega:"Il computo che ti manda il geometra arriva quasi sempre senza prezzi. Creane uno qui e dentro ci carichi il suo file: le lavorazioni entrano con le loro quantità, e i prezzi ce li metti tu."
    }
  };
  function _cm(k){ return (ruoloUtente==='professionista'?_CM.pro:_CM.imp)[k]; }

  function adattaMenuImpresa(){
    if(ruoloUtente==='professionista')return;
    try{
      ['#tab-computi','#tab-prezzario','#tab-sal'].forEach(function(sel){
        var b=document.querySelector(sel);
        if(b)b.style.display='';
      });
      /* la voce del menu */
      document.querySelectorAll('[data-tab="computi"] span').forEach(function(x){
        if(x.textContent.trim()===_CM.pro.nome)x.textContent=_cm('nome');
      });
      /* il titolo e la frase di apertura della sezione */
      var sez=document.querySelector('#computi');
      if(sez){
        var h=sez.querySelector('h2');
        if(h&&h.textContent.trim()===_CM.pro.nome)h.textContent=_cm('nome');
        var bt=sez.querySelector('.btn.add');
        if(bt&&bt.textContent.trim()===_CM.pro.crea)bt.textContent=_cm('crea');
        var i=sez.querySelector('.gal-intro');
        /* ⚠️ scritto dal punto di vista di chi il computo lo RICEVE, non di
           chi lo fa. E senza mettere l'impresa in posizione di chi chiede. */
        /* 26 set 2026 — accorciato: quattro righe diventano una. */
        if(i)i.innerHTML='Carichi il computo del geometra, ci metti <b>i tuoi prezzi</b> e con un clic diventa un <b>preventivo</b>.';
      }
      /* ============================================================
         ⛔ 29 agosto 2026 — DUE POSTI CHE NON CHIEDEVANO LA PAROLA A _cm()
         ============================================================
         Trovati nella prova dal vivo sul gestionale vero, aprendo la
         pagina come artigiano e cercando la parola sbagliata in TUTTI i
         testi (non guardando una schermata per volta):
           - la sezione PREZZARIO diceva «Nel computo metrico le ritrovi»;
           - la sezione PREVENTIVI diceva «da un computo metrico gia' fatto».
         La parola del tecnico, due centimetri sotto una voce di menu che
         dice «Computo da prezzare».
         ⚠️ Non e' un difetto nato oggi: c'era gia' per l'impresa edile dal
         20 agosto. E' lo stesso inciampo della striscia del filo, in altre
         due stanze -- «una regola che sta in piu' posti non si sistema a
         meta'». Oggi si vede anche all'artigiano, e si chiude qui.
         Si riscrive SOLO il <b>, non tutta la frase: il resto della
         spiegazione e' giusto per tutti e due i ruoli.
         ============================================================ */
      ['#preventivi','#prezzario'].forEach(function(sel){
        var s=document.querySelector(sel); if(!s)return;
        var i=s.querySelector('.gal-intro'); if(!i)return;
        i.querySelectorAll('b').forEach(function(g){
          if(g.textContent.trim()===_CM.pro.uno)g.textContent=_cm('uno');
        });
      });
    }catch(_){}
  }

  /* Solo professionista: nei TESTI VISIBILI dell'interfaccia del reparto (#appview e i form in #sheet)
     traduce le etichette fisse lavoro→pratica con concordanza femminile corretta (vedi _FRASI),
     più swap a parola solo per conteggi nudi e tab/intestazione.
     Agisce solo sui nodi di testo (non su id/classi/attributi/placeholder né su tabelle/campi Supabase). */
  /* Frasi fisse con articolo/aggettivo: tradotte come unità per la concordanza femminile (pratica/pratiche).
     Ordine: prima le frasi più lunghe/specifiche, poi quelle brevi (es. "Nuovo lavoro"). */
  const _FRASI=[
    ['Prossimi lavori da fare','Prossime pratiche da fare'],
    ['quanti lavori hai da fare','quante pratiche hai da fare'],
    ['Tutti i lavori del reparto','Tutte le pratiche del reparto'],
    ['tutti i suoi lavori','tutte le sue pratiche'],
    ['Lavori finiti da fatturare','Pratiche finite da fatturare'],
    ['Da fatturare (lavori finiti)','Da fatturare (pratiche finite)'],
    ['Nessun lavoro finito in attesa di fattura.','Nessuna pratica finita in attesa di fattura.'],
    ['Nessun lavoro in sospeso','Nessuna pratica in sospeso'],
    ['Aggiungi un lavoro col pulsante','Aggiungi una pratica col pulsante'],
    ['Cambia filtro o aggiungi un nuovo lavoro','Cambia filtro o aggiungi una nuova pratica'],
    ['Nessun lavoro in questa data.','Nessuna pratica in questa data.'],
    ['Nessun lavoro qui','Nessuna pratica qui'],
    /* 10 agosto 2026 — tre frasi uscivano sgrammaticate: le regole corte
       ('lavoro aperto' -> 'pratica aperta') cambiavano il nome ma non
       l'articolo davanti, e si leggeva "Nessun pratica aperta". Vanno QUI,
       prima di quelle corte, perche' l'elenco si applica in ordine. */
    ['Nessun lavoro aperto','Nessuna pratica aperta'],
    ['Nessun lavoro assegnato','Nessuna pratica assegnata'],
    ['Ancora nessun lavoro finito','Ancora nessuna pratica finita'],
    ['+ Lavoro in questa data','+ Pratica in questa data'],
    ['Questo operatore non ha lavori assegnati','Questo collaboratore non ha pratiche assegnate'],
    ['Assegna i lavori a una persona dalla scheda del lavoro','Assegna le pratiche a una persona dalla scheda della pratica'],
    ['Le foto si caricano dalla scheda del lavoro','Le foto si caricano dalla scheda della pratica'],
    ['Prima del lavoro','Prima della pratica'],
    ['A lavoro finito','A pratica finita'],
    ['Foto lavoro DA FARE','Foto pratica DA FARE'],
    ['Foto lavoro FATTO','Foto pratica FATTO'],
    ['per mostrarti il lavoro','per mostrarti la pratica'],
    ['a lavoro finito','a pratica finita'],
    ['per questo lavoro','per questa pratica'],
    ['Modifica lavoro','Modifica pratica'],
    /* 16 agosto 2026 — titolo della prima zona del modulo */
    ['Il lavoro','La pratica'],
    ['Nuovo lavoro','Nuova pratica'],
    ['Crea lavoro','Crea pratica'],
    /* ⚠️ 22 agosto 2026 — LE FRASI DELLE FINESTRE DELL'AI.
       Per uno studio tecnico l'AI diceva ancora «lavoro»: nessuna di queste
       frasi era in elenco, quindi il traduttore non le avrebbe cambiate
       nemmeno se ci fosse arrivato. Visto da Alessio in una foto.
       ⛔ DALLE PIU' LUNGHE ALLE PIU' CORTE: l'elenco si applica in ordine, e
          «Descrivi il lavoro» e' l'inizio delle due sopra. Se stesse prima,
          quelle due non scatterebbero mai. */
    ['Descrivi il lavoro come lo racconteresti al cliente','Descrivi la pratica come la racconteresti al cliente'],
    ['Descrivi il lavoro un po\' più nel dettaglio','Descrivi la pratica un po\' più nel dettaglio'],
    ['Scrivi il lavoro a parole','Scrivi la pratica a parole'],
    ['Come creo il mio primo lavoro?','Come creo la mia prima pratica?'],
    ['Descrivi il lavoro','Descrivi la pratica'],
    /* ⚠️ 21 agosto 2026 — I DUE ESEMPI DENTRO LE CASELLE GRANDI.
       Sono suggerimenti scritti da noi, non testo dell'utente: prima non
       arrivavano nemmeno al traduttore (le textarea erano protette), e
       adesso che ci arrivano devono avere la loro frase, se no il
       traduttore ci passa sopra e non cambia niente.
       ⛔ Frase INTERA, non la singola parola: «taglio siepe» dentro una
          frase da giardiniere non si aggiusta cambiando due parole. */
    ['Giovedì prossimo taglio siepe da Le Betulle, ci va Marco, 350 euro',
     'Martedì prossimo rilievo per la CILA in via Verdi 12, ci va Marco, 350 euro'],
    ['Es. sabbia e cemento per il bagno di Via Roma',
     'Es. visure catastali per la pratica di Via Roma'],
    /* ⚠️ e le altre quattro che il traduttore raggiungeva GIA', ma su cui
       passava sopra senza cambiare niente perche' non erano in elenco.
       ⛔ «Carta cantiere Nord» va qui, PRIMA della regola corta su
          «cantiere»: con quella sola diventava «Carta pratica Nord». */
    ['Es. Carta Mario, Carta cantiere Nord','Es. Carta Mario, Carta studio Nord'],
    ['Cerca un nome: cliente, lavoro, preventivo, fattura',
     'Cerca un nome: cliente, pratica, preventivo, fattura'],
    ['Cerca cliente, indirizzo, lavoro','Cerca cliente, indirizzo, pratica'],
    ['Apri il lavoro','Apri la pratica'],
    /* Testi nuovi 2026 (preventivi, spese/margine, report, tabelle) */
    ['Spese e materiali di questo lavoro','Spese e materiali di questa pratica'],
    ['Guadagno o perdita per lavoro','Guadagno o perdita per pratica'],
    ['lavori in perdita','pratiche in perdita'],
    ['lavoro in perdita','pratica in perdita'],
    /* 11 agosto 2026 — sulla Mappa il filtro diceva «Pratiche da fare» accanto
       a «Tutti i lavori»: mezza tradotta. Va DOPO 'Tutti i lavori del reparto',
       che e' piu' lunga e deve vincere. */
    ['Tutti i lavori','Tutte le pratiche'],
    ['Lavori da fare','Pratiche da fare'],
    ['Lavori in corso','Pratiche in corso'],
    ['Lavori fatti','Pratiche fatte'],
    ['Mostro i 15 lavori col margine più basso: se un lavoro non compare, è tra quelli in positivo.','Mostro le 15 pratiche col margine più basso: se una pratica non compare, è tra quelle in positivo.'],
    ['Metti un importo nei lavori e registra le spese (dentro "Modifica" del lavoro) per vedere qui il margine.','Metti un importo nelle pratiche e registra le spese (dentro "Modifica" della pratica) per vedere qui il margine.'],
    ['trasformalo in lavoro','trasformalo in pratica'],
    ['Accettato → crea lavoro','Accettato → crea pratica'],
    /* 9 agosto 2026 — frasi intere: sostituire la sola parola lasciava
       articoli e aggettivi al maschile ("I pratiche ... da soli ... fatturati"). */
    ['I lavori collegati si segnano da soli come fatturati','Le pratiche collegate si segnano da sole come fatturate'],
    ['tutto quello che non ha un lavoro dietro','tutto quello che non ha una pratica dietro'],
    ['Lavoro creato dal preventivo','Pratica creata dal preventivo'],
    ['Il cliente ha accettato? Creo il lavoro dal preventivo','Il cliente ha accettato? Creo la pratica dal preventivo'],
    ['Le fatture nascono dai lavori finiti con un importo','Le fatture nascono dalle pratiche finite con un importo'],
    ['Lavoro ↑','Pratica ↑'],
    ['Lavoro ↓','Pratica ↓'],
    ['Lavoro:','Pratica:'],
    ['per operatore','per collaboratore'],
    /* squadra/membro → collaboratore/collaboratori: frasi esatte (collaboratori = maschile plurale).
       Le più specifiche prima della parola nuda "Squadra" per la concordanza corretta. */
    ['Squadra non disponibile','Collaboratori non disponibili'],
    ['Accedi per gestire la squadra','Accedi per gestire i collaboratori'],
    ['Squadra','Collaboratori'],
    /* condominio/amministratore → cliente: frasi esatte. Le più specifiche prima della parola
       nuda "Condomini", così "Condomini / Clienti" non diventa "Clienti / Clienti". */
    /* frasi nuove dei fix di agosto 2026: vanno tradotte anche per il professionista */
    ['Lavoro creato, ma il preventivo non risulta accettato','Pratica creata, ma il preventivo non risulta accettato'],
    ['Attenzione: i lavori collegati alla fattura non si sono aggiornati','Attenzione: le pratiche collegate alla fattura non si sono aggiornate'],
    ['Dove (vuoto = indirizzo del condominio)','Dove (vuoto = indirizzo del cliente)'],
    ['Nome condominio / cliente','Nome cliente'],
    ['Condomini / Clienti','Clienti'],
    ['Condominio / Cantiere','Cliente'],
    ['Referente / Amministratore','Referente'],
    /* 9 agosto 2026 — questa riga rompeva la parola: "Condomini" è dentro
       "Condominio", e con una sostituzione secca ogni "Condominio" diventava
       "Clientio". Si vedeva nel pulsante, nella scheda cliente e perfino nei
       NOMI scritti dall'utente ("Condominio Le Terrazze" -> "Clientio Le
       Terrazze"). Per un tecnico il condominio è un cliente legittimo:
       la parola si lascia stare. */
    /* "Agenda operatore" → "Agenda" (togli "operatore"); operatore → collaboratore solo nelle
       etichette/filtri legati ai collaboratori. La parola nuda "Operatore" per ultima. */
    ['Agenda operatore','Agenda'],
    ['Filtra per operatore','Filtra per collaboratore'],
    ['Scegli un operatore','Scegli un collaboratore'],
    ['(operatore)','(collaboratore)'],
    ['Operatore','Collaboratore'],
    /* etichetta del menu assegnatario nel form pratica → "Collaboratore". Il ruolo "Operaio"
       del form Squadra è protetto via _SKIP_UTENTE (#d-ruolo), quindi resta invariato. */
    ['Operaio','Collaboratore'],
    /* Messaggi toast/confirm (professionista): frasi esatte, concordanza corretta.
       Il numero in "N lavori collegati" lo gestisce a parte la regex dei conteggi nudi. */
    ['Lavoro creato ✔','Pratica creata ✔'],
    ['Lavoro aggiornato','Pratica aggiornata'],
    ['Lavoro non trovato','Pratica non trovata'],
    ['Scegli un condominio','Scegli un cliente'],
    ['Condominio aggiunto ✔','Cliente aggiunto ✔'],
    ['Eliminare questo lavoro?','Eliminare questa pratica?'],
    ['Eliminare questo condominio?','Eliminare questo cliente?'],
    ['lavori collegati. Eliminarlo comunque?','pratiche collegate. Eliminarlo comunque?'],
    ['Lavoro eliminato','Pratica eliminata'],
    ['Persona eliminata','Collaboratore eliminato'],

    /* ===== 9 agosto 2026 — LE PAROLE DA CANTIERE =====
       "cantiere" non era nemmeno nel filtro: nessuna frase che lo conteneva
       veniva mai tradotta. Un ingegnere leggeva "Chi va in cantiere", "Mansione
       in cantiere", "Es. Muratore". Ordine: prima le frasi lunghe, poi le corte,
       se no la corta mangia la lunga. */
    ['Il cantiere più vicino','La pratica più vicina'],
    ['cantieri aperti con un indirizzo','pratiche aperte con un indirizzo'],
    ['Dove sono i tuoi cantieri','Dove sono le tue pratiche'],
    ['Nessun cantiere da mostrare','Nessuna pratica da mostrare'],
    ['Tutti i cantieri','Tutte le pratiche'],
    ['— scegli il lavoro —','— scegli la pratica —'],
    ['le distanze dei cantieri','le distanze delle pratiche'],
    ['con i cantieri','con le pratiche'],
    ['senza distanza','senza distanza'],
    ['Mansione in cantiere','Ruolo nello studio'],
    ['mansione in cantiere','ruolo nello studio'],
    ['Chi va in cantiere le vede dal telefono','Chi fa il sopralluogo le vede dal telefono'],
    ['pronto per andare in cantiere','pronto per uscire'],
    ['raggruppati per cantiere','raggruppati per pratica'],
    ['materiale per un cantiere','materiale per una pratica'],
    ['in cantiere con l\'app dell\'operaio','sul posto con l\'app del collaboratore'],
    ['Cliente / Cantiere','Cliente'],
    ['Cantiere','Pratica'],
    ['cantieri','pratiche'],
    /* ⛔ 22 agosto 2026 — L'ARTICOLO. «cantiere» è maschile, «pratica» è
       femminile: scambiando la sola parola usciva «dal pratica», «del
       pratica», «al pratica». Queste righe stanno PRIMA di quella secca
       qui sotto, perché l'elenco si applica in ordine e la prima che
       acchiappa vince. Trovate facendo girare il traduttore su tutte le
       2.958 scritte della pagina, non a occhio: prove/frasi-geometra/.
       ⚠️ «dal cantiere» non c'è, e non è una dimenticanza: queste righe a
       più parole si cercano dentro la frase pezzo per pezzo, quindi
       «al cantiere» acchiappa anche la coda di «d-al cantiere» e ne esce
       «d-alla pratica». L'avevo scritta lo stesso, e il sabotaggio che la
       toglieva restava muto: aveva ragione lui, ed è stata tolta. */
    ['del cantiere','della pratica'],
    ['al cantiere','alla pratica'],
    ['nel cantiere','nella pratica'],
    ['sul cantiere','sulla pratica'],
    ['col cantiere','con la pratica'],
    ['il cantiere','la pratica'],
    ['un cantiere','una pratica'],
    ['Il cantiere','La pratica'],
    ['Un cantiere','Una pratica'],
    ['cantiere','pratica'],

    /* parole singole: minuscole e maiuscole erano trattate diversamente */
    ['app operaio','app collaboratore'],
    ['app dell\'operaio','app del collaboratore'],
    /* ⛔ 22 agosto 2026 — L'APOSTROFO. «operaio» comincia per vocale,
       «collaboratore» per consonante: lo scambio secco faceva
       «all'collaboratore», «l'collaboratore». Dopo l'apostrofo di un
       articolo ci vuole una vocale, quindi l'articolo va rifatto intero. */
    ['all\'operaio','al collaboratore'],
    ['dell\'operaio','del collaboratore'],
    ['nell\'operaio','nel collaboratore'],
    ['sull\'operaio','sul collaboratore'],
    ['dall\'operaio','dal collaboratore'],
    ['un\'operaio','un collaboratore'],
    ['l\'operaio','il collaboratore'],
    ['L\'operaio','Il collaboratore'],
    ['Operaio','Collaboratore'],
    ['operaio','collaboratore'],
    ['operai','collaboratori'],
    ['dipendenti','collaboratori'],
    ['Muratore','Disegnatore CAD'],
    ['la manodopera sui lavori','il tempo speso sulle pratiche'],
    /* ⛔ 22 agosto 2026 — l'articolo, di nuovo al contrario: «manodopera» è
       femminile, «tempo speso» è maschile → usciva «la tempo speso». */
    ['della manodopera','del tempo speso'],
    ['dalla manodopera','dal tempo speso'],
    ['alla manodopera','al tempo speso'],
    ['nella manodopera','nel tempo speso'],
    ['sulla manodopera','sul tempo speso'],
    ['la manodopera','il tempo speso'],
    ['una manodopera','un tempo speso'],
    ['La manodopera','Il tempo speso'],
    ['manodopera','tempo speso'],
    ['Capo (io)','Io'],
    ['imprese come la tua','studi come il tuo'],

    /* i conteggi con l'aggettivo dietro: la regex numerica da sola faceva
       "3 lavori finiti" -> "3 pratiche finiti" */
    ['lavori finiti','pratiche finite'],
    ['lavoro finito','pratica finita'],
    ['lavori aperti','pratiche aperte'],
    ['lavoro aperto','pratica aperta'],
    ['lavori assegnati','pratiche assegnate'],
    ['lavoro assegnato','pratica assegnata'],
    ['lavori collegati','pratiche collegate'],
    ['lavoro collegato','pratica collegata'],
    ['a fine lavoro','a pratica chiusa'],
    ['persone in squadra','persone nello studio'],
    /* 12 agosto 2026 (sera) — i singolari mancavano: da quando le etichette del
       Riepilogo concordano ("1 persona in squadra", "1 operatore con..."), se
       il singolare non sta in questo elenco lo studio tecnico legge la parola
       da cantiere. */
    ['persona in squadra','persona nello studio'],
    ['operatore con lavori assegnati','collaboratore con pratiche assegnate'],
    ['operatori con lavori assegnati','collaboratori con pratiche assegnate'],
    ['cantiere aperto con un indirizzo','pratica aperta con un indirizzo'],
    ['operatori','collaboratori'],
    /* ⛔ 22 agosto 2026 — stesso apostrofo di «operaio» qui sopra */
    ['all\'operatore','al collaboratore'],
    ['dell\'operatore','del collaboratore'],
    ['nell\'operatore','nel collaboratore'],
    ['sull\'operatore','sul collaboratore'],
    ['dall\'operatore','dal collaboratore'],
    ['l\'operatore','il collaboratore'],
    ['L\'operatore','Il collaboratore'],
    ['operatore','collaboratore'],
    ['Nessun operatore registrato','Nessun collaboratore registrato'],

    /* i suggerimenti grigi dentro le caselle (placeholder) e i title: prima il
       traduttore non li guardava nemmeno, e un ingegnere leggeva "Es. taglio
       siepe e pulizia aiuole" (9 agosto 2026) */
    ['Es. taglio siepe e pulizia aiuole','Es. CILA per rifacimento bagno'],
    ['Es. Cemento, noleggio piattaforma...','Es. bolli, diritti di segreteria, visure...'],
    ['Es. chiamare amministratore, portare scala...','Es. richiamare il Comune, preparare la visura...'],
    ['Es. Wahid','Es. Giulia'],
    ['Compila quando il lavoro è finito','Compila quando la pratica è chiusa'],
    ['Descrivi il lavoro, preparo io le voci di costo','Descrivi la pratica, preparo io le voci'],
    ['Chi ci ha lavorato (facoltativo)','Chi ci ha messo mano (facoltativo)'],
    ['le ore dei dipendenti giorno per giorno','le ore dei collaboratori giorno per giorno'],
  ];
