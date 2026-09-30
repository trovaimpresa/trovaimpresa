// [SPOSTATO] gest-ingresso.js: era dentro gest-core.js, righe 1252-1842, spostato identico.
  /* ============================================================
     ⛔ 22 agosto 2026 — UNA PAROLA SI CAMBIA SOLO SE E' UNA PAROLA INTERA
     ============================================================
     Segnalato da Alessio: nella ricerca in alto un cliente che si chiama
     «Edilcantiere» diventava «Edilpratica». La colpa non era della ricerca:
     era di qui. L'elenco `_FRASI` si applicava come pezzo di testo, quindi
     «cantiere» veniva trovato e cambiato ANCHE dentro un'altra parola.

     ⚠️ E' la TERZA volta che questo difetto esce, sempre da una porta
     diversa: le tendine (12 agosto), il testo del prezzario (20 agosto), la
     ricerca in alto (oggi). Ogni volta si era chiuso il posto, mai la causa.
     ⛔ Adesso si chiude la causa: le voci fatte di UNA SOLA PAROLA si
     cambiano solo quando quella parola sta da sola. Le frasi (che hanno gli
     spazi dentro, e dentro un nome non ci finiscono) restano come prima.

     ⚠️ Niente lookbehind nell'espressione: su Safari vecchi non c'e' e
     l'intero blocco morirebbe. Si tiene il carattere di prima in un gruppo
     e lo si rimette. */
  const _SOLA_PAROLA=/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
  const _FRASI_RX=_FRASI.map(function(f){
    if(!_SOLA_PAROLA.test(f[0]))return [f[0],f[1],false];
    return [new RegExp('([^A-Za-zÀ-ÖØ-öø-ÿ]|^)'+f[0]+'(?![A-Za-zÀ-ÖØ-öø-ÿ])','g'),f[1],true];
  });

  function _swapPratiche(s){
    for(const f of _FRASI_RX){
      if(f[2]){ s=s.replace(f[0],'$1'+f[1]); }
      else if(s.indexOf(f[0])>=0){ s=s.split(f[0]).join(f[1]); }
    }
    /* conteggi nudi: "1 lavoro"→"1 pratica", "N lavori"→"N pratiche" */
    s=s.replace(/(\d+)\s+lavori\b/g,'$1 pratiche').replace(/(\d+)\s+lavoro\b/g,'$1 pratica');
    /* tab/intestazione: nodo composto SOLO dalla parola */
    const t=s.trim();
    if(t==='Lavori')s=s.replace('Lavori','Pratiche');
    else if(t==='Lavoro')s=s.replace('Lavoro','Pratica');
    return s;
  }
  /* Contenitori del CONTENUTO inserito dall'utente: i loro nodi di testo NON vanno tradotti
     (nomi reparti, titoli/descrizioni pratiche, note, dati cliente, nomi operatori).
     Restano traducibili le etichette fisse (tab "Lavori", "+ Nuovo lavoro", contatori, messaggi vuoti…). */
  /* 12 agosto 2026 (sera) — «option» in questo elenco.
     Le tendine sono piene di NOMI scritti dall'utente: clienti, pratiche,
     collaboratori, fornitori, mezzi. Il traduttore ci passava sopra e li
     riscriveva dentro la parola: un cliente che si chiama «Edilcantiere Srl»
     diventava «Edilpratica Srl», «Condominio Le Terrazze» diventava un'altra
     cosa ancora. Riguardava 27 tendine.
     Le poche voci FISSE che avevano bisogno della traduzione (Tutti i cantieri,
     scegli il lavoro, Capo) adesso sono tradotte alla fonte con _msgPro. */
  /* ⚠️ 20 agosto 2026 (sera) — «.cm-testo» E IL TESTO DEL PREZZARIO.
     Visto da Alessio in una foto: dentro una lavorazione c'era scritto
     «nell'ambito DEL PRATICA dei materiali riutilizzabili». Nel testo vero
     della Regione Lazio c'e' «nell'ambito del CANTIERE».

     ⛔ IL TESTO DEL COMPUTO NON E' NOSTRO. Le descrizioni arrivano dal
        prezzario ufficiale o dal PDF del progettista: in una gara sono un
        riferimento con un valore legale, e riscriverne una parola e' come
        correggere il capitolato di qualcun altro. Vale anche per i titoli
        dei capitoli, che li scrive l'utente.

     La classe «cm-testo» si mette su OGNI pezzo che contiene testo del
     computo (lavorazioni, capitoli, confronto della variante, SAL,
     conferma del PDF, cronoprogramma). Una classe sola, un posto solo:
     chi domani disegna una schermata nuova col testo di una lavorazione
     dentro se la mette e non ci pensa piu'. */
  /* ⚠️ 22 agosto 2026 — «.ct-t» e «.ct-s»: le righe dei risultati della
     ricerca in alto. Dentro ci sono NOMI scritti dall'utente (clienti,
     pratiche, fornitori) e il traduttore ci passava sopra. La radice e' gia'
     chiusa qui sopra (una parola si cambia solo se e' intera), ma questi due
     restano nell'elenco lo stesso: sono contenuto dell'utente e non vanno
     toccati nemmeno per caso. */
  const _SKIP_UTENTE='option,.rc-rt-u,.cm-testo,.job-cli,.job-desc,.job-done,.job-note,.job-meta,.fatt-info,.day-job,.gal-cantiere,.thop,.card h3,.card p,.c-nome,.c-cli,.c-chi,.riga-tit,.cal-lav-t,.ct-t,.ct-s,#panel-name,#panel-sub,#tb-panel-name,#rie-title,#lf-title,#gal-op-sel,#ag-op-sel,#d-ruolo,textarea';
  /* ⛔ 21 agosto 2026 — DUE LISTE, NON UNA.
     «textarea» sta in _SKIP_UTENTE per proteggere quello che l'utente SCRIVE
     DENTRO la casella. Ma il suggerimento grigio (`placeholder`) e il `title`
     li abbiamo scritti NOI: non sono roba sua, e vanno tradotti.
     Con una lista sola, a un geometra il gestionale offriva ancora
     «Giovedì prossimo taglio siepe da Le Betulle».
     ⚠️ Tutto il resto della lista resta identico: «.cm-testo» e compagnia
     proteggono anche gli attributi, e devono continuare a farlo. */
  const _SKIP_ATTRIBUTI=_SKIP_UTENTE.split(',').filter(s=>s!=='textarea').join(',');
  let _praticheObs=null;
  function _osservaPratiche(){
    if(!_praticheObs)return;
    ['#appview','#sheet'].forEach(sel=>{const el=document.querySelector(sel);if(el)_praticheObs.observe(el,{childList:true,subtree:true,characterData:true});});
  }
  /* le parole che fanno scattare la traduzione: in un posto solo, così
     testo e attributi usano lo stesso metro */
  const _DA_TRADURRE=/lavor[oi]\b|squadr|condomin|amministrator|operai|operator|cantier|manodoper|dipendent|muratore|capo\b|siepe|cemento|imprese come la tua|Wahid/i;
  /* ⛔ 22 agosto 2026 — IL TRADUTTORE SU UN PEZZO DI PAGINA QUALSIASI.
     Le finestre dell'AI (js/ai-integrazione.js) si attaccano direttamente a
     document.body, cioe' FUORI da #appview e #sheet: l'osservatore non le ha
     mai viste, e per uno studio tecnico l'AI parlava da impresa edile.
     Invece di far guardare tutta la pagina all'osservatore (che si
     risveglierebbe a ogni respiro), chi crea una finestra sua chiama questa
     quando l'ha attaccata. Il conto delle parole resta in un posto solo. */
  /* ⛔ 21 agosto 2026 — I SUGGERIMENTI GRIGI E I «title» IN UN POSTO SOLO.
     Questo giro era scritto DUE VOLTE, identico, qui e in localizzaPratiche.
     Una regola che sta in due posti si sistema a meta': la seconda copia
     avrebbe continuato a saltare le textarea.
     ⚠️ Nessun rischio di rimbalzo: l'osservatore guarda childList/subtree,
     non gli attributi, quindi cambiarli non lo risveglia. */
  function _traduciAttributi(root){
    if(!root)return;
    root.querySelectorAll('[placeholder],[title]').forEach(function(el){
      if(el.closest(_SKIP_ATTRIBUTI))return;
      ['placeholder','title'].forEach(function(att){
        const v=el.getAttribute(att);
        if(!v||!_DA_TRADURRE.test(v))return;
        const nv=_swapPratiche(v);
        if(nv!==v)el.setAttribute(att,nv);
      });
    });
  }
  function _traduciDentro(root){
    if(!root)return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(t){return t.parentElement&&t.parentElement.closest(_SKIP_UTENTE)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
    nodi.forEach(t=>{const v=t.nodeValue;if(v&&_DA_TRADURRE.test(v)){const nv=_swapPratiche(v);if(nv!==v)t.nodeValue=nv;}});
    _traduciAttributi(root);
  }
  /* il ponte per chi sta fuori dal blocco: window.gestTraduci(elemento).
     Non fa niente se non e' uno studio tecnico. */
  window.gestTraduci=function(el){
    if(ruoloUtente!=='professionista')return;
    try{ _traduciDentro(el); }catch(e){}
  };

  function localizzaPratiche(){
    if(ruoloUtente!=='professionista')return;
    if(_praticheObs)_praticheObs.disconnect(); /* si stacca durante la riscrittura: le mutazioni che genera (e quelle già in coda) vengono scartate → niente loop */
    /* ⛔ 22 agosto 2026 — «#barra-basso» MANCAVA, ed e' il difetto segnalato
       da Alessio: sul telefono la barra in basso diceva ancora «Lavori»
       mentre tutto il resto diceva «Pratiche». Il traduttore guardava solo
       dentro la schermata e dentro le finestre; la barra sta fuori da tutte
       e due. Una parola sola, in un posto dimenticato. */
    ['#appview','#sheet','#barra-basso'].forEach(sel=>{
      const root=document.querySelector(sel);if(!root)return;
      const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(t){return t.parentElement&&t.parentElement.closest(_SKIP_UTENTE)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
      const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
      nodi.forEach(t=>{const v=t.nodeValue;if(v&&_DA_TRADURRE.test(v)){const nv=_swapPratiche(v);if(nv!==v)t.nodeValue=nv;}});
      /* 9 agosto 2026 — anche i suggerimenti grigi dentro le caselle e i
         "title". Prima restavano fuori per costruzione (il traduttore guarda
         solo i nodi di testo) e restituivano frasi da cantiere.
         ⛔ 21 agosto 2026 — questo giro era scritto qui e dentro
         _traduciDentro: adesso e' uno solo, e sta in _traduciAttributi. */
      _traduciAttributi(root);
    });
    _osservaPratiche(); /* si riattacca solo a riscrittura conclusa */
  }
  function avviaLocalizzazionePratiche(){
    if(ruoloUtente!=='professionista'||_praticheObs)return;
    _praticheObs=new MutationObserver(()=>localizzaPratiche());
    localizzaPratiche();
  }
  if(sb){
    /* getSession e onAuthStateChange sparano entrambi all'avvio: senza il
       controllo su _authUidVisto tutto veniva disegnato DUE volte. */
    let _authUidVisto="(mai)";
    function _authRefresh(){
      if(_authUidVisto===String(sbUid))return;
      _authUidVisto=String(sbUid);
      /* prima di disegnare: un reparto che il database non ha piu' non deve
         restare aperto (vedi pulisciRepartiSpariti) */
      if(sbUid)pulisciRepartiSpariti();
      if(cur){renderAll();}else{renderLanding();}
      /* 15 agosto 2026 (12) — i numerini partono da qui, non dall'apertura
         della sezione: devono salire mentre l'utente sta facendo tutt'altro.
         Senza await: se la rete e' lenta il gestionale non aspetta un pallino. */
      if(sbUid){ try{ asstVedetta(); asstLeggi(false); contaRichiesteNuove(); contaDalSito(); aiStrisciaCarica(); }catch(e){} }
    }
    sb.auth.onAuthStateChange((_e,s)=>{sbUid=TI_GIRO?GIRO_UID:(s?s.user.id:null);logRuoloUtente(sbUid);backfillMestieri();_authRefresh();});
    sb.auth.getSession().then(({data})=>{sbUid=TI_GIRO?GIRO_UID:(data.session?data.session.user.id:null);backfillMestieri();_authRefresh();});
  }

  /* ---- RESTYLING PRO: emoji dell'interfaccia → icone SVG (Lucide-style) ----
     Un observer riscrive i nodi di testo: ogni emoji nota diventa un'icona SVG.
     Le emoji "contenuto utente" (icone reparto, note scritte dall'utente nei textarea) non vengono toccate. */
  const _ICONS={
    "🗺":'<path d="M9 3 4 5v16l5-2 6 2 5-2V3l-5 2-6-2z"/><path d="M9 3v16"/><path d="M15 5v16"/>',
    "✏":'<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    "🗑":'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    "📷":'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    "📄":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "📑":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "💶":'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    "📅":'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    "📍":'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    "👷":'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "👤":'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "⏱":'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "📝":'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
    "🗒":'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
    "📞":'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/>',
    "🏢":'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M12 10h.01"/>',
    "📌":'<path d="M12 17v5"/><path d="M9 10.8 7.5 12.3a1 1 0 0 0 .7 1.7h7.6a1 1 0 0 0 .7-1.7L15 10.8V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1Z"/>',
    "📤":'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    "📈":'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    "📊":'<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>',
    "📋":'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    "🏆":'<path d="M6 9a6 6 0 0 0 12 0V3H6Z"/><path d="M6 5H3v2a4 4 0 0 0 4 4"/><path d="M18 5h3v2a4 4 0 0 1-4 4"/><path d="M12 15v4"/><path d="M8 21h8"/>',
    "⬇":'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    "⚙":'<circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
    "📎":'<path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 1 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/>',
    "💡":'<path d="M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 0 0 12 3a5 5 0 0 0-4.5 8.5c.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "▶":'<path d="m6 4 14 8-14 8Z"/>',
    "↩":'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    "✔":'<path d="M20 6 9 17l-5-5"/>',
    "✅":'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    "💬":'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/>',
    "⚠":'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "🔓":'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    "＋":'<path d="M5 12h14"/><path d="M12 5v14"/>',
    "➕":'<path d="M5 12h14"/><path d="M12 5v14"/>',
    "🌳":'<path d="M8 19a4 4 0 0 1-1-7.9 5.5 5.5 0 0 1 10 0A4 4 0 0 1 16 19Z"/><path d="M12 19v3"/>',
    "🌿":'<path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 9-9 4.5-.8 7 1 8 2-1 1-2.5 3.5-3 6-1 5-4 8-7 8Z"/><path d="M4 21c3-5 7-8 12-9"/>',
    "🧹":'<path d="m9.1 14.9 7.7-7.7a2.1 2.1 0 1 1 3 3l-7.7 7.7"/><path d="M9 15c-2 0-5 1-6 6 3 0 6-1 8-4Z"/>',
    "🧱":'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 12h18"/><path d="M9 5v7"/><path d="M15 12v7"/>',
    "🔧":'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    "⚡":'<path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z"/>',
    "🎨":'<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/><path d="M12 22a2 2 0 0 1 0-4 4 4 0 0 0 4-4 6 6 0 0 0-4-10"/>',
    "🚿":'<path d="m4 4 2.5 2.5"/><path d="M13.5 6.5a4.95 4.95 0 0 0-7 7"/><path d="M15 5 5 15"/><path d="M14 17v.01"/><path d="M10 16v.01"/><path d="M13 13v.01"/><path d="M16 10v.01"/><path d="M11 20v.01"/><path d="M17 14v.01"/><path d="M20 11v.01"/>',
    "🪚":'<path d="M3 15h8l6-6 4 4-6 6H3z"/><path d="M7 15v3"/><path d="M11 15v3"/>',
    "🛠":'<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="m17.6 3.2 3.4 3.3-2 2-3.4-3.4z"/><path d="m14 7 3 3"/>',
    "🏠":'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
    "🪜":'<path d="M8 3v18"/><path d="M16 3v18"/><path d="M8 8h8"/><path d="M8 13h8"/><path d="M8 18h8"/>',
    "🏗":'<path d="M3 21h18"/><path d="M6 21V7l9-4v18"/><path d="M6 11h9"/><path d="M15 7h4v4"/>',
    "🔌":'<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M6 8h12v4a6 6 0 0 1-12 0Z"/>',
    /* 10 agosto 2026 — le tre dei Computi metrici.
       Senza di loro Windows disegnava 🏷 come un quadratino minuscolo in bianco
       e nero, perche' e' un'emoji "da testo" che senza il selettore di variante
       non diventa colorata. Come icona SVG il problema non esiste piu', e sta
       in fila con tutte le altre. */
    "📐":'<path d="M4 4v16h16"/><path d="M4 4 20 20"/>',
    "🏷":'<path d="M20.6 12.4 12.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6Z"/><path d="M7 7h.01"/>',
    /* 26 set 2026 — le idee rubate: il microfono e «Aggiorna il cliente» */
    "🎤":'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
    "📣":'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    "🏛":'<path d="M3 22h18"/><path d="m12 3 9 6H3Z"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/>'
  };
  const _EMO_KEYS=Object.keys(_ICONS).join("|");
  const _EMO_RE=new RegExp("("+_EMO_KEYS+")️?","g");
  const _EMO_TEST=new RegExp("("+_EMO_KEYS+")");
  const _svgIcon=e=>'<svg class="emic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+_ICONS[e]+'</svg>';
  /* select: le <option> sono testo, non markup — sostituirle con uno <span> le distruggerebbe */
  /* ⚠️ 21 agosto 2026 — «.no-ico»: QUI LE EMOJI RESTANO EMOJI.
     Alessio, guardando le card dei reparti a colori: «queste per esempio mi
     piacciono». Nel gestionale non le vedeva mai, perche' _iconizza le
     sostituisce TUTTE con un disegnino grigio a tratto. Va bene dentro i
     menu e i pulsanti, dove il grigio sta in fila con il resto; NON va bene
     dove l'icona e' una scelta dell'utente — la tendina del reparto e la
     card che ne esce. Li' l'emoji si vede com'e', a colori. */
  const _ICO_SKIP='textarea,script,style,select,.no-ico';
  let _icoObs=null;
  function _iconizza(){
    if(_icoObs)_icoObs.disconnect();
    ["#appview","#sheet","#landing"].forEach(sel=>{
      const root=document.querySelector(sel);if(!root)return;
      const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(t){
        if(!t.nodeValue||!_EMO_TEST.test(t.nodeValue))return NodeFilter.FILTER_REJECT;
        return t.parentElement&&t.parentElement.closest(_ICO_SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
      const nodi=[];let n;while(n=w.nextNode())nodi.push(n);
      nodi.forEach(t=>{
        const span=document.createElement("span");
        span.innerHTML=t.nodeValue.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])).replace(_EMO_RE,(m,e)=>_svgIcon(e));
        t.parentNode.replaceChild(span,t);
      });
    });
    ["#appview","#sheet","#landing"].forEach(sel=>{const el=document.querySelector(sel);if(el)_icoObs.observe(el,{childList:true,subtree:true,characterData:true});});
  }
  _icoObs=new MutationObserver(()=>_iconizza());
  setTimeout(_iconizza,0);

  /* LANDING */
  async function renderLanding(){
    let ps=state.panels||[];
    let rows=[];
    if(sb&&sbUid){
      const {data}=await sb.from("gest_lavori").select("mestiere_id,stato").eq("user_id",sbUid);
      rows=data||[];
      /* ⚠️ «ANCORA NESSUN REPARTO» QUANDO IL DATABASE NON RISPONDE — 14/8/2026.
         Qui sotto l'errore della lettura dei reparti non veniva guardato: se
         la connessione cadeva, «mest» restava vuoto, la lista si svuotava e
         al suo posto compariva «Ancora nessun reparto. Creane uno qui sotto»
         — cioè ESATTAMENTE quello che vede uno che si è appena iscritto.
         Chi ha tre reparti pieni di lavori apre il gestionale e legge che non
         ha niente: la prima cosa che pensa è di aver perso tutto.
         Adesso, se la lettura fallisce, i reparti NON si svuotano (resta
         quello che il browser ha già in mano) e si dice cos'è successo. */
      /* FONTE PRIMARIA dei reparti = gest_mestieri su Supabase (visibili da qualsiasi browser/account).
         state.panels resta come cache/fallback locale: lo idratiamo dai mestieri così entrata (cur/curMestiere)
         e contatori continuano a funzionare senza altre modifiche. */
      const {data:mest,error:eMest}=await sb.from("gest_mestieri").select("id,nome,icona,colore,ordine").eq("user_id",sbUid).order("ordine",{ascending:true});
      if(eMest){
        _landingGuasta=eMest.message||"la connessione non ha risposto";
        ps=state.panels||[];        /* si tiene quello che c'è, non si svuota */
        _landingDisegna(ps,rows);
        return;
      }
      _landingGuasta=null;
      let changed=false;
      ps=(mest||[]).map(m=>{
        let p=(state.panels||[]).find(x=>x.mestiere_id===m.id);
        const pal=COLORI.find(c=>c.a===m.colore); /* dark/soft (ad/as) non sono su DB: ricavati dalla palette per colore */
        if(!p){
          const col=pal||{a:m.colore,ad:m.colore,as:m.colore};
          p={id:uid(),nome:m.nome,icon:m.icona||"🛠️",a:col.a,ad:col.ad,as:col.as,mestiere_id:m.id};
          (state.panels=state.panels||[]).push(p);
          if(!state[p.id])state[p.id]={clienti:[],dipendenti:[],lavori:[],note:{}};
          changed=true;
        }else{
          p.nome=m.nome; p.icon=m.icona||p.icon; /* nome/icona dal DB come fonte primaria */
          if(pal){p.a=pal.a;p.ad=pal.ad;p.as=pal.as;}
          /* qui ci arriva solo chi il database dà per vivo: se era segnato
             cestinato vuol dire che l'hanno appena recuperato */
          if(p.cestinato){p.cestinato=false;changed=true;}
        }
        return p;
      });
      if(changed)await save();

      /* ⚠️ IL PRIMO REPARTO SE LO CREA IL GESTIONALE — 14 agosto 2026.
         Misurato prima di cambiare: dall'apertura al preventivo in PDF
         c'erano 11 tocchi e 7 cose da scrivere, e i primi tre tocchi
         servivano solo a creare un «reparto» — una parola che a un
         idraulico che lavora da solo non dice niente. Chi apre il
         gestionale dal cantiere perché il cliente gli ha chiesto un
         prezzo, lì chiude.
         Adesso il primo reparto si crea da solo, col nome della sua
         attività. Chi ne vuole un secondo lo aggiunge come prima.

         I TRE PALETTI, e sono tutti necessari:
         1. SOLO se la lettura è andata bene. Se il database non risponde
            si arriva qui con la lista vuota per un guasto, e creare un
            reparto vorrebbe dire aggiungerne uno a chi ne ha già tre —
            il difetto che ho appena corretto, girato al contrario;
         2. SOLO se non ne ha nessuno (`mest` letto davvero, lunghezza 0);
         3. SOLO una volta per sessione (`_repartoAuto`), se no due
            renderLanding di fila ne fanno due. */
      if(!eMest && (mest||[]).length===0 && !_repartoAuto){
        _repartoAuto=true;
        const _nome=await _nomePrimoReparto();
        const {data:m1,error:e1}=await sb.from("gest_mestieri")
          .insert({user_id:sbUid,nome:_nome,icona:"🛠️",colore:(COLORI[0]||{}).a||"#2e629e",ordine:0})
          .select().single();
        if(!e1&&m1){
          const col=COLORI[0]||{a:"#2e629e",ad:"#2e629e",as:"#2e629e"};
          const p1={id:uid(),nome:_nome,icon:"🛠️",a:col.a,ad:col.ad,as:col.as,mestiere_id:m1.id};
          (state.panels=state.panels||[]).push(p1);
          if(!state[p1.id])state[p1.id]={clienti:[],dipendenti:[],lavori:[],note:{}};
          await save();
          ps=[p1];
          /* ⛔ 20 settembre 2026 — NON SI ENTRA PIU' DENTRO DA SOLI.
             Prima qui c'era `enterPanel(p1.id)`: appena creato il primo
             reparto il gestionale ci saltava dentro, e chi apriva per la
             prima volta si trovava nel «Riepilogo» di un reparto che non
             aveva chiesto. Decisione di Alessio: all'apertura si vede
             SEMPRE l'elenco dei reparti, e dentro ci si entra con un
             tocco. Il reparto continua a crearsi da solo (14 ago 2026):
             quello che cambia e' solo dove si atterra.
             ⚠️ Restano validi gli altri due ingressi automatici, che non
             sono la prima apertura: il link diretto con `#tab` e il
             rientro da noleggio/negozio/config (riga ~13038). */
          _landingDisegna(ps,rows);
          return;
        }
        /* se non riesce non si dice niente e non si blocca niente: resta
           il pulsante «Nuovo reparto», com'era prima */
      }
    }
    _landingDisegna(ps,rows);
    /* deep link + un solo reparto: entra da solo */
    if(_deepTab&&ps.length===1)enterPanel(ps[0].id);
  }

  /* una volta per sessione: due renderLanding di fila non fanno due reparti */
  let _repartoAuto=false;
  /* il nome del primo reparto: quello della sua attività, se ce l'ha.
     Se non ce l'ha, una parola che va bene per chiunque — mai «Reparto 1». */
  async function _nomePrimoReparto(){
    try{
      const {data}=await sb.from("imprese").select("nome_attivita").eq("user_id",sbUid).maybeSingle();
      const n=String((data&&data.nome_attivita)||"").trim();
      if(n)return n.slice(0,60);
    }catch(e){}
    return ruoloUtente==='professionista'?"Il mio studio":"I miei lavori";
  }

  /* ⛔ 20 settembre 2026 — L'ABBONAMENTO SI GESTISCE DA DENTRO IL GESTIONALE.
     ⚠️ NON si riapre il checkout: a chi e' gia' abbonato creerebbe un
     SECONDO abbonamento (29 + 39 euro al mese). Si passa dal portale di
     Stripe, la stessa porta del pannello:
     netlify/functions/portale-clienti.js, che legge CHI SEI DAL TOKEN e
     mai dall'email mandata dal browser — se no chiunque potrebbe aprire
     il portale di un altro e disdirgli l'abbonamento.
     ⚠️ Il portale vuole `returnUrl` che cominci con https://trovaimpresa.com,
     se no la funzione ti rimanda al pannello: da qui gli passiamo la
     pagina dove sei, cosi' tornando indietro ti ritrovi dov'eri.
     ⚠️ Chi e' in prova e non ha nessun abbonamento su Stripe riceve
     `senza_abbonamento`: non e' un guasto, e la frase gliela dice lui. */
  async function apriAbbonamento(bottone){
    const prima = bottone ? bottone.textContent : "";
    if(bottone){ bottone.disabled=true; bottone.textContent="Apro…"; }
    try{
      const {data:ses} = await sb.auth.getSession();
      const token = ses && ses.session && ses.session.access_token;
      if(!token){
        toast("La sessione è scaduta. Rientra e riprova.");
      }else{
        /* il bigliettino del ritorno: al rientro dal portale gli si ricorda,
           UNA volta sola, che i suoi dati puo' portarseli via. Vedi
           `_rientroAbbonamento()` piu' sotto. */
        try{ sessionStorage.setItem("gest_da_abbonamento", String(Date.now())); }catch(e){}
        const r = await fetch("/.netlify/functions/portale-clienti",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
          body:JSON.stringify({returnUrl:location.href})
        });
        let d=null; try{ d=await r.json(); }catch(e){}
        if(d && d.url){ location.href=d.url; return; }
        toast((d && (d.messaggio||d.error)) || "Non riesco ad aprire la gestione abbonamento. Riprova più tardi.");
      }
    }catch(e){
      toast("Errore: "+((e && e.message) || e));
    }
    if(bottone){ bottone.disabled=false; bottone.textContent=prima; }
  }

  /* ⛔ 26 settembre 2026 — LA RIGA DEL REPARTO, VERSIONE «B» SCELTA DA ALESSIO.
     Prima: carta piccola, «5 da fare · 5 lavori totali» scritto piccolo e
     il cestino grande accanto al nome, nel posto dove si tocca di piu'.
     Adesso ogni reparto e' una riga larga: icona, nome, il numero dei
     lavori da fare grande, il tasto blu «Apri →», e il cestino piccolo e
     grigio in fondo, lontano dal nome (chiede sempre conferma: delPanel).
     Una funzione sola per l'elenco e per l'anteprima del modulo «nuovo
     reparto», cosi' le due non si scollano.
     «da fare» = stato diverso da «fatto». */
  function cartaReparto(p,df,tot,anteprima){
    const pro=ruoloUtente==='professionista';
    const tutto=pro?(tot===1?'pratica in tutto':'pratiche in tutto'):(tot===1?'lavoro in tutto':'lavori in tutto');
    const apri=anteprima?'':` data-action="enter" data-p="${p.id}" role="button" tabindex="0"`;
    const cest=anteprima?'':`<button type="button" class="pc-del" data-action="del-panel" data-id="${p.id}" title="Elimina reparto" aria-label="Elimina reparto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>`;
    return `<div class="panel-card pc3${df?' c-dafare':''}"${apri}>
      <span class="pc-ic no-ico" style="background:${p.as};color:${p.ad}">${icoRep(p.icon)}</span>
      <div class="pc3-nome"><h2${p._vuoto?' class="pc-vuoto"':''}>${p._vuoto?"Il nome del reparto":esc(p.nome)}</h2>
        <span class="pc3-sotto">${df} da fare &middot; ${tot} ${tutto}</span></div>
      <div class="pc3-num"><b>${df}</b><span>da fare</span></div>
      <span class="pc3-apri">Apri <span aria-hidden="true">&rarr;</span></span>
      ${cest}
    </div>`;
  }

  /* il guasto della lettura dei reparti: null = tutto a posto */
  let _landingGuasta=null;
  function _landingDisegna(ps,rows){
    /* ⛔ 18 settembre 2026 — UN REPARTO NEL CESTINO NON STA NELL'ELENCO.
       «pulizia» ed «elettricista», nel cestino dal 21 agosto, comparivano
       identici ai vivi: stesso colore, stessa scheda, nessuna scritta. Ci si
       entrava senza sapere di essere in un reparto buttato via.
       ⚠️ NON si toccano i dati: `cestinato` è solo una bandierina sulla copia
          del browser. Chi lo recupera se lo ritrova qui da solo. */
    ps=(ps||[]).filter(p=>!p.cestinato); rows=rows||[];
    $("#panels").innerHTML=ps.length?ps.map(p=>{
      const mine=p.mestiere_id?rows.filter(l=>l.mestiere_id===p.mestiere_id):[];
      const tot=mine.length, df=mine.filter(l=>l.stato!=="fatto").length;
      /* ⚠️ 21 agosto 2026 — LA RIGA COLORATA IN CIMA ALLA CARD NON C'E' PIU'.
         Qui sopra c'era style="border-top:4px solid ${p.a}": quattro reparti
         facevano quattro righe di quattro colori diversi, e la stessa cosa la
         diceva gia' l'icona qui sotto, che il colore del reparto ce l'ha (e lo
         tiene). Un colore che dice due volte la stessa cosa non ne dice
         nessuna: e' la regola del Riepilogo del 20 agosto, portata anche qui.
         ⛔ Il colore del reparto NON si perde: resta sull'icona e sul pallino
            accanto al nome quando entri dentro (vedi enterPanel). */
      /* ⛔ 6 settembre 2026 — LA SCHEDA SI APRE ANCHE DA TASTIERA.
         Era un <div> nudo: da tastiera non ci si arrivava. Il cestino qui
         sotto invece e' un <button>, quindi da tastiera ci si arrivava
         benissimo — su una schermata con una scheda sola si poteva
         CANCELLARE un reparto ma non entrarci. Un danno che fa male una
         volta e in modo definitivo.
         ⚠️ Resta un <div> con role="button", NON diventa un <button> vero:
         un <button> dentro un altro <button> non e' HTML valido e il
         cestino sta dentro la scheda. Il tasto Invio e la barra spaziatrice
         li fa funzionare l'ascoltatore unico piu' in basso (cerca
         «INVIO E BARRA SPAZIATRICE»). */
      return cartaReparto(p,df,tot,false);
    }).join("")+'<button class="new-rep-btn pc3-nuovo" data-action="new-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> Nuovo reparto</button>':(_landingGuasta
      ? `<div class="empty-rep" style="border-color:var(--err,#c0392b)">
           <b>Non riesco a leggere i tuoi reparti.</b><br>
           Non vuol dire che non ci sono: è la connessione con il database che non ha risposto.<br>
           <small style="opacity:.8">${esc(String(_landingGuasta))}</small><br>
           <button class="btn" data-action="landing-riprova" style="margin-top:10px">Riprova</button>
         </div>`
      : `<div class="empty-rep">Ancora nessun reparto.<br>Creane uno qui sotto 👇</div>`);
    /* col guasto in corso il modulo «crea reparto» si nasconde: se no si
       finisce per crearne uno doppio credendo di aver perso il primo */
    const _nb=document.querySelector(".wrap > .new-rep-btn");
    if(_nb)_nb.style.display=ps.length?"none":"";   // con dei reparti, «Nuovo reparto» sta nella griglia
    const _nuovo=document.querySelector("#nuovo-reparto,#panel-new,.landing-new");
    if(_nuovo)_nuovo.style.display=_landingGuasta?"none":"";
  }

  /* ⛔ 23 agosto 2026 — SI RIENTRA DOVE SI ERA.
     Alessio: «quando esco dal noleggio mi fa uscire completamente». Usciva
     dal noleggio, tornava qui e trovava la schermata «scegli il reparto»
     invece del reparto in cui stava lavorando: un clic in piu' ogni volta,
     e la sensazione di essere stato buttato fuori. Adesso l'ultimo reparto
     aperto si ricorda, come fa gia' il noleggio dal 22 agosto.
     La schermata dei reparti non e' sparita: ci si torna con la freccia. */
  const GEST_ULTIMO="gest_ultimo_reparto";

  function enterPanel(id){
    cur=id;const p=(state.panels||[]).find(x=>x.id===id);if(!p)return goHome();
    try{if(!TI_GIRO)localStorage.setItem(GEST_ULTIMO,id);}catch(e){}
    /* colore primario fisso (blu professionale): il colore del reparto resta solo come pallino accanto al nome */
    const dot=$("#rep-dot");if(dot)dot.style.background=p.a;
    const tdot=$("#tb-rep-dot");if(tdot)tdot.style.background=p.a;
    $("#panel-name").textContent=p.nome;$("#panel-sub").textContent="Reparto "+p.nome;
    if($("#tb-panel-name"))$("#tb-panel-name").textContent=p.nome;
    if($("#rie-title"))$("#rie-title").textContent="Riepilogo — "+p.nome;
    $("#landing").style.display="none";$("#appview").style.display="flex";
    filter={vista:"tutti",q:""};$("#f-search").value="";cal=new Date();
    cliQ="";dipQ="";if($("#cli-search"))$("#cli-search").value="";if($("#dip-search"))$("#dip-search").value="";
    cestQ="";if($("#cest-search"))$("#cest-search").value="";
    prevFilter="tutti";fattVista="tutte";scadVista="tutte";
    galFilter={op:"",tipo:"",media:"",lav:""};segmOn("#gal-tipo","");segmOn("#gal-media","");
    mpVista="aperti";segmOn("#mp-vista","aperti");if(mpLayer){try{mpLayer.remove();}catch(e){}mpLayer=null;}
    agFilter={op:"",stato:"aperti"};segmOn("#ag-stato","aperti");
    /* 6 set 2026: cambiando reparto si riparte sempre da «Da fare», e il mese
       delle ore si azzera: se no si restava su un mese vecchio di un altro reparto */
    segmOn("#ag-vista","lavori"); oreMese=null; oreAperte={};
    if($("#ag-parte-lavori"))$("#ag-parte-lavori").style.display="";
    if($("#ag-parte-ore"))$("#ag-parte-ore").style.display="none";
    mezziFilter="tutti";attrezzFilter="tutti";
    /* ⚠️ 15 agosto 2026 (11) — QUI C'ERA «la prima voce in alto», cioe' i===0.
       Ha funzionato per mesi solo perche' il Riepilogo era il primo pulsante.
       Appena in cima e' arrivato «Chiedi una funzione», entrare in un reparto
       accendeva QUELLA voce mentre a schermo si apriva il Riepilogo: il menu
       diceva una cosa e la pagina ne mostrava un'altra. E siccome
       tabCorrente() legge proprio la voce accesa, il gestionale credeva
       davvero di stare su «Chiedi una funzione»: il primo salvataggio avrebbe
       ridisegnato la sezione sbagliata.
       Adesso si accende per NOME, come fa gia' la riga qui sotto per la
       sezione: chi sposta un pulsante non rompe piu' niente. */
    $$("nav.tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="riepilogo"));
    $$("section").forEach((s,i)=>s.classList.toggle("active",s.id==="riepilogo"));
    renderAll();window.scrollTo(0,0);
    _applyDeepTab(); /* link diretto tipo #preventivi: apre subito la scheda richiesta */
    _riapriUltimaSezione();
  }

  /* ⛔ 23 agosto 2026 — e si rientra anche nella SEZIONE dove si era.
     Non basta rientrare nel reparto: se stavi guardando «Lavori e interventi»
     e torni dal noleggio, ti aspetti «Lavori e interventi», non il Riepilogo.
     Il link diretto (#preventivi) vince: se c'e' quello, comanda lui. */
  const GEST_ULTIMA_SEZ="gest_ultima_sezione";
  function _riapriUltimaSezione(){
    /* ⛔ 6 settembre 2026, Alessio: «perche' mi apre su Squadra? mi deve aprire
       su Riepilogo, tutti cosi' devono essere».
       Il 23 agosto questa funzione riapriva l'ultima sezione visitata: se
       chiudevi su Squadra, il giorno dopo ripartivi da Squadra. L'idea era
       comoda tornando dal noleggio, ma nell'uso di tutti i giorni il
       gestionale si apriva ogni volta su una schermata diversa, e il Riepilogo
       — che e' la vista che serve per prima — non lo vedeva quasi mai nessuno.
       Adesso si apre SEMPRE sul Riepilogo, come gli altri gestionali
       (negozio, noleggio, operatore) che non hanno mai avuto questa memoria.
       Resta valido il link diretto (gestionale-app.html#preventivi): quello
       lo decide chi clicca, non il gestionale da solo. */
    return;
  }
  document.addEventListener("click",function(e){
    const b=e.target.closest&&e.target.closest('nav.tabs button[data-tab]');
    if(!b) return;
    try{if(!TI_GIRO)localStorage.setItem(GEST_ULTIMA_SEZ,b.dataset.tab);}catch(e2){}
  });
  /* Deep link: gestionale-app.html#calendario / #scadenzario / #preventivi / #report ... */
  let _deepTab=(location.hash||"").replace("#","")||null;
  if(_deepTab&&!["riepilogo","agenda","calendario","lavori","preventivi","fatture","report","galleria","clienti","squadra","mezzi","scadenzario","mappa","fornitori","crediti","cestino","carte","attrezzature","richieste","dalsito","computi","assistenza","promemoria","fisco"].includes(_deepTab))_deepTab=null; /* 29/09/2026 «fisco»: ci arriva il Noleggio */
  function _applyDeepTab(){
    if(!_deepTab)return;
    /* un link salvato tipo #mezzi non deve portare il professionista in una sezione nascosta */
    if(ruoloUtente==='professionista'&&TAB_NASCOSTI_PRO.indexOf(_deepTab)>=0){_deepTab=null;return;}
    const b=document.querySelector('nav.tabs button[data-tab="'+_deepTab+'"]');
    _deepTab=null;
    if(b)b.click();
  }
  function goHome(){
    cur=null;
    /* chi torna alla schermata dei reparti CI VUOLE STARE: si dimentica
       l'ultimo, se no al prossimo giro lo si rispedisce dentro da solo. */
    try{localStorage.removeItem(GEST_ULTIMO);}catch(e){}
    $("#appview").style.display="none";$("#landing").style.display="block";renderLanding();aiStrisciaCarica();window.scrollTo(0,0);}

