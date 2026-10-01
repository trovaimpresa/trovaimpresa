/* ============================================================
   IL CANCELLO DEL GESTIONALE — 23 agosto 2026

   Fino a oggi questa schermata viveva DENTRO gestionale-app.html, e
   basta: gestionale-noleggio.html non ne aveva nessuna. Chi si scriveva
   l'indirizzo del noleggio a mano entrava, senza login e senza abbonamento.
   Alessio l'aveva segnato nel referto del 22 agosto: «il noleggio non ha
   nessun cancello: chi conosce l'indirizzo entra».

   Adesso il cancello e' UNO SOLO e sta qui: lo caricano il gestionale
   imprese e il gestionale noleggio. Se domani si cambia una regola si
   cambia in un punto — non in due, dove uno dei due si dimentica.

   COME SI USA, in fondo alla pagina:
       <script>window.GATE_PAGINA='gestionale-noleggio';</script>
       <script src="/js/gate-gestionale.js"></script>
   GATE_PAGINA e' facoltativo: finisce nel registro degli accessi.

   ⚠️ IL VERSO GIUSTO: nel dubbio si sta FUORI, non dentro. Le due porte
   che si aprivano da sole (tempo scaduto e lettura in errore) sono state
   chiuse il 22 agosto, e qui restano chiuse.

   NOTA: questo e' il cancello della PAGINA. Il lucchetto vero sono le
   regole di Supabase: questa e' la porta, quelle sono le serrature.
   ============================================================ */
(function(){
  var PAGINA = window.GATE_PAGINA || 'gestionale-app';

  /* la schermata se la disegna da sola, cosi' le pagine non se la copiano */
  var MARKUP = `<div id="gate-gestionale" style="display:none;position:fixed;inset:0;z-index:999999;background:var(--sfondo,#f3f5f2);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;align-items:center;justify-content:center;padding:20px;overflow:auto;">
  <div style="max-width:520px;width:100%;background:var(--card,#fff);border-radius:16px;box-shadow:0 8px 30px rgba(10,42,77,0.12);overflow:hidden;">
    <div style="background:var(--blu,#0066ff);color:#fff;padding:24px;text-align:center;">
      <div style="font-size:20px;font-weight:800;">&#128736;&#65039; Gestionale TrovaImpresa</div>
    </div>
    <div id="gate-checking" style="padding:32px;text-align:center;color:var(--testo-2,#5b6672);font-size:var(--f-base,16px);">Verifica accesso in corso&hellip;</div>
    <div id="gate-manutenzione" style="display:none;padding:30px 30px 34px;color:var(--testo,#1c2b36);">
      <div style="font-size:22px;font-weight:800;line-height:1.35;margin-bottom:18px;">Il gestionale sta arrivando</div>
      <p style="margin:0 0 16px;font-size:17px;line-height:1.7;">
        Stiamo finendo il gestionale per le imprese: lavori e cantieri, preventivi,
        computo metrico, fatture, squadra, mezzi e scadenze. Tutto in un posto solo,
        dal computer e dal telefono in cantiere.
      </p>
      <p style="margin:0 0 16px;font-size:17px;line-height:1.7;">
        Vogliamo darvelo finito, non a met&agrave;: per questo per ora &egrave; chiuso.
      </p>
      <p style="margin:0 0 24px;font-size:17px;line-height:1.7;">
        Quando sar&agrave; pronto entrer&agrave; nel <b>Gestionale</b>, insieme alla vetrina
        su TrovaImpresa.
      </p>
      <div id="gate-avvisami-box" style="background:var(--sfondo,#f3f5f2);border-radius:12px;padding:20px;">
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;font-weight:600;">
          Vuoi essere fra i primi a provarlo?
        </p>
        <button id="gate-avvisami-btn" onclick="avvisamiGestionale()"
          style="width:100%;padding:16px;border:none;border-radius:10px;background:var(--blu,#0066ff);color:#fff;font-size:17px;font-weight:700;cursor:pointer;">
          Avvisami quando &egrave; pronto
        </button>
        <p style="margin:12px 0 0;font-size:14px;color:var(--testo-3,#7a848f);text-align:center;line-height:1.6;">
          Ti scriviamo una sola volta, alla mail del tuo profilo.
        </p>
      </div>
      <div id="gate-avvisami-ok" style="display:none;background:#e6f6ec;border-radius:12px;padding:22px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:#1b8a3f;margin-bottom:8px;">Perfetto, sei in lista &#10004;</div>
        <div style="font-size:16px;line-height:1.6;">Ti avvisiamo appena il gestionale &egrave; pronto.</div>
      </div>
      <p id="gate-avvisami-err" style="display:none;margin:14px 0 0;font-size:15px;color:#b3261e;text-align:center;line-height:1.6;"></p>
      <p style="margin:22px 0 0;text-align:center;">
        <a href="/" style="color:var(--blu,#0066ff);font-size:16px;text-decoration:none;font-weight:600;">&larr; Torna a TrovaImpresa</a>
      </p>
    </div>
    <div id="gate-paywall" style="display:none;padding:28px 28px 32px;color:var(--testo,#1c2b36);">
      <p id="gate-paywall-titolo" style="margin:0 0 12px;font-size:21px;font-weight:800;line-height:1.35;">Il tuo gestionale ti aspetta</p>
      <p id="gate-pw-riga" style="margin:0 0 6px;font-size:16px;line-height:1.7;">Lavori, preventivi, fatture, computo metrico, mezzi e scadenze: tutto in un posto solo.</p>
      <div id="gate-pw-scelto" style="display:none;background:var(--sfondo,#eaf2ff);border-radius:12px;padding:14px 16px;margin:14px 0 18px;">
        <div style="font-size:14px;color:var(--testo-3,#7a848f);font-weight:700;letter-spacing:.4px;">IL PREZZO CHE AVEVI SCELTO</div>
        <div id="gate-pw-nome" style="font-size:19px;font-weight:800;margin-top:4px;"></div>
      </div>
      <div id="gate-btns"></div>
      <p style="margin:16px 0 0;font-size:14px;color:var(--testo-3,#7a848f);text-align:center;line-height:1.6;">Pagamento sicuro con Stripe &middot; si disdice quando vuoi &middot; nessuna IVA da aggiungere</p>
      <p id="gate-pw-err" style="display:none;margin:12px 0 0;font-size:15px;color:#b1442a;text-align:center;line-height:1.6;"></p>
      <p style="margin:14px 0 0;font-size:15px;text-align:center;line-height:1.6;">Hai gi&agrave; pagato? <a href="/login-impresa.html" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">Accedi</a></p>
      <!-- 20 settembre 2026 — LA PORTA DI USCITA NEL MURO.
           Provato dal vivo il 20 settembre con un account senza abbonamento:
           il muro copriva tutto e il tasto «Esporta dati» stava DIETRO. Finito
           il mese pagato uno non entrava piu', e con lui restavano chiusi
           lavori, preventivi, fatture e clienti: i dati c'erano ancora (il
           permesso su Supabase guarda solo chi sei, non il piano — verificato
           leggendo le tabelle da quella stessa pagina), ma non c'era nessuna
           porta per raggiungerli.
           Non e' solo cortesia: i dati di un cliente restano suoi anche quando
           smette di pagare, e deve poterseli riprendere. Anche sei mesi dopo,
           e senza chiederlo a nessuno.
           Compare SOLO se la pagina ha davvero le due funzioni
           (gestionale-app.html le ha, gestionale-noleggio no) e solo a chi e'
           collegato: a uno sconosciuto non c'e' niente da dare. -->
      <p id="gate-pw-export" style="display:none;margin:16px 0 0;padding-top:14px;border-top:1px solid var(--bordo,#e2e8f0);font-size:15px;text-align:center;line-height:1.7;color:var(--testo-3,#7a848f);">I tuoi dati restano tuoi, anche senza abbonamento:<br><a href="#" id="gate-pw-export-x" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">scarica l&rsquo;Excel</a> &middot; <a href="#" id="gate-pw-export-j" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">backup completo</a></p>
      <p style="margin:16px 0 0;text-align:center;"><a href="/" style="color:var(--blu,#0066ff);font-size:16px;text-decoration:none;font-weight:600;">&larr; Torna a TrovaImpresa</a></p>
    </div>
    <!-- 1 ottobre 2026 — IL PROFILO MINIMO. Si vede solo se PROFILO_MINIMO_ATTIVO
         e' acceso (o con ?profilo=prova). Le righe le disegna mostraProfilo(). -->
    <div id="gate-profilo" style="display:none;padding:26px 24px 30px;color:var(--testo,#1c2b36);">
      <style>
        #gate-profilo .gp-riga{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 0;border-top:1px solid var(--bordo,#e2e8f0);}
        #gate-profilo .gp-ico{flex:0 0 24px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;line-height:1;box-sizing:border-box;}
        #gate-profilo .gp-ok{background:#1f9d55;color:#fff;}
        #gate-profilo .gp-no{border:2px solid #b8c1cc;color:transparent;}
        #gate-profilo .gp-nome{flex:1 1 140px;min-width:0;font-size:16px;line-height:1.35;}
        #gate-profilo .gp-aiuto{display:block;font-size:13px;color:var(--testo-3,#7a848f);margin-top:2px;}
        #gate-profilo .gp-btn{flex:0 0 auto;padding:9px 16px;border:1.5px solid var(--blu,#0066ff);border-radius:9px;background:#fff;color:var(--blu,#0066ff);font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;font-family:inherit;line-height:1.2;}
        #gate-profilo .gp-btn:disabled{opacity:.6;cursor:default;}
        #gate-profilo .gp-edit{flex:1 1 100%;display:none;padding:2px 0 4px 36px;}
        #gate-profilo .gp-edit.aperto{display:block;}
        #gate-profilo .gp-in{width:100%;box-sizing:border-box;padding:11px 12px;border:1.5px solid #b8c1cc;border-radius:9px;font-size:16px;font-family:inherit;color:inherit;background:#fff;}
        #gate-profilo textarea.gp-in{min-height:110px;resize:vertical;line-height:1.5;}
        #gate-profilo .gp-sotto{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-top:8px;}
        #gate-profilo .gp-conta{font-size:13px;color:var(--testo-3,#7a848f);flex:1 1 auto;}
        #gate-profilo .gp-salva{padding:10px 20px;border:0;border-radius:9px;background:var(--blu,#0066ff);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;}
        #gate-profilo .gp-salva:disabled{opacity:.6;cursor:default;}
        @media(max-width:480px){#gate-profilo{padding:22px 16px 26px !important;}#gate-profilo .gp-edit{padding-left:0;}}
      </style>
      <p style="margin:0 0 6px;font-size:21px;font-weight:800;line-height:1.35;">Completa il profilo per aprire il gestionale</p>
      <p id="gp-sub" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:var(--testo-2,#5b6672);"></p>
      <div style="display:flex;align-items:center;gap:12px;margin:0 0 6px;">
        <div style="flex:1;height:9px;border-radius:5px;background:#e3e8ee;overflow:hidden;"><div id="gp-barra" style="height:100%;width:0%;background:var(--blu,#0066ff);transition:width .4s ease;"></div></div>
        <span id="gp-conta" style="font-size:14px;font-weight:800;white-space:nowrap;"></span>
      </div>
      <div id="gp-righe"></div>
      <button type="button" id="gp-avanti" style="display:block;width:100%;margin-top:18px;padding:16px;border:0;border-radius:10px;background:var(--blu,#0066ff);color:#fff;font-size:17px;font-weight:800;cursor:pointer;font-family:inherit;">Completa il profilo</button>
      <p id="gp-err" style="display:none;margin:12px 0 0;font-size:15px;color:#b1442a;text-align:center;line-height:1.6;"></p>
      <p id="gp-msg" style="display:none;margin:12px 0 0;font-size:15px;color:#1b8a3f;text-align:center;line-height:1.6;"></p>
      <p id="gate-pr-export" style="display:none;margin:16px 0 0;padding-top:14px;border-top:1px solid var(--bordo,#e2e8f0);font-size:15px;text-align:center;line-height:1.7;color:var(--testo-3,#7a848f);">I tuoi dati restano tuoi:<br><a href="#" id="gate-pr-export-x" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">scarica l&rsquo;Excel</a> &middot; <a href="#" id="gate-pr-export-j" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">backup completo</a></p>
      <p style="margin:16px 0 0;text-align:center;"><a href="/" style="color:var(--blu,#0066ff);font-size:16px;text-decoration:none;font-weight:600;">&larr; Torna a TrovaImpresa</a></p>
    </div>
    <div id="gate-lento" style="display:none;padding:28px 28px 32px;color:var(--testo,#1c2b36);">
      <p style="margin:0 0 14px;font-size:20px;font-weight:800;line-height:1.4;">Non riesco a verificare il tuo accesso</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">La linea sta rispondendo troppo lentamente, oppure &egrave; caduta. Il tuo abbonamento non c&rsquo;entra: appena la linea torna, entri.</p>
      <button type="button" onclick="location.reload();" style="display:block;width:100%;padding:16px;margin-bottom:10px;border:none;border-radius:10px;background:var(--blu,#0066ff);color:#fff;font-size:17px;font-weight:700;cursor:pointer;">Riprova</button>
      <p style="margin:16px 0 0;font-size:15px;text-align:center;line-height:1.6;">Se non si sblocca, scrivi a <a href="mailto:info@trovaimpresa.com" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">info@trovaimpresa.com</a></p>
      <p style="margin:16px 0 0;text-align:center;"><a href="/" style="color:var(--blu,#0066ff);font-size:16px;text-decoration:none;font-weight:600;">&larr; Torna a TrovaImpresa</a></p>
    </div>
  </div>
</div>`;
  if(!document.getElementById('gate-gestionale')){
    var _d=document.createElement('div');
    _d.innerHTML=MARKUP;
    while(_d.firstChild) document.body.appendChild(_d.firstChild);
  }


(function(){
  var SU="https://nacvrsgkyfavykxjxszu.supabase.co";
  var SK="sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";
  var RETURN=location.origin+location.pathname;
  function q(id){return document.getElementById(id);}
  /* ===== MANUTENZIONE =====
     Se true, il gestionale è chiuso a tutti tranne le email in AMMESSI.
     Rimessa a false il 6 agosto 2026: aperto agli abbonati.
     ⛔ RIMESSA A TRUE IL 20 AGOSTO 2026, deciso da Alessio:
        «prima si costruisce la casa poi si vende».
     ✅ RIMESSA A FALSE IL 30 AGOSTO 2026, deciso da Alessio: il gestionale
        si apre a tutti. Il controllo colonne-fantasma era stato allargato
        a tutte e 115 le tabelle e in tutto il gestionale ha trovato UNA
        cosa sola (le note del calendario, sistemata lo stesso giorno).
        ⚠️ Da sapere: quel giorno 99 imprese su 102 non avevano nessun
        reparto, quindi entrano in un gestionale vuoto.
        PER RICHIUDERLO basta rimettere true: nessun dato si perde, e chi
        e' dentro rivede la schermata «Il gestionale sta arrivando». */
  var MANUTENZIONE = false;
  var AMMESSI = ['pintoalessio@icloud.com'];   /* aggiungi qui altre email fra apici, separate da virgola */

  /* ===== CHI PUO' ENTRARE — 6 agosto 2026 =====
     Il gestionale è il Gestionale TrovaImpresa (29 euro/mese o 249 euro/anno,
     prezzi del 29 agosto 2026; il Gestionale AI, che aggiunge la chat con AI,
     costa 39 euro/mese o 349 euro/anno e NON cambia chi entra qui dentro).
     Chi è Free vede la schermata che spiega come sbloccarlo.
     Il blocco sulla card del pannello resta: questo chiude l'accesso diretto
     di chi si scrive l'indirizzo a mano.
     NOTA: è un blocco lato pagina. I dati restano comunque protetti da RLS
     su Supabase: ognuno vede solo i propri. */
  function haPremium(row){
    if(!row) return false;
    var piano = String(row.piano||'').trim().toLowerCase();
    if(piano !== 'premium') return false;
    /* se c'e' una scadenza ed è passata, non è più abbonato */
    if(row.premium_scadenza){
      var scad = new Date(row.premium_scadenza);
      if(!isNaN(scad.getTime()) && scad.getTime() < Date.now()) return false;
    }
    return true;
  }

  /* ============================================================
     ===== IL PIANO PRO — 29 agosto 2026 =====
     ============================================================
     Deciso da Alessio: il Gestionale AI NON sostituisce il Gestionale, ci si aggiunge
     sopra. Gestionale = la vetrina sul sito + il gestionale con tutte le sue
     funzioni, AI comprese. Gestionale AI = quello, PIU' la chat. Chi passa all'AI non
     perde niente, e chi resta sul Gestionale nemmeno: l'unica differenza e' la chat.

     ⛔ E PER QUESTO IL PRO NON STA NELLA COLONNA `piano`.
     Nel progetto ci sono 91 punti, in 29 file, che chiedono
     «piano === 'premium'»: ricerche, badge, vetrina, pannelli, questo
     cancello. Se `piano` diventasse 'pro', tutti e 91 direbbero «non e'
     premium» e a chi paga di piu' spariva la vetrina.
     Sta in due colonne sue, `chat_pro` e `chat_pro_scadenza` — la stessa
     identica forma di `gestionale_attivo` / `gestionale_scadenza`, l'add-on
     del gestionale del 22 agosto. Non e' una forma nuova.

     ⛔ QUESTA FUNZIONE NON DECIDE CHI ENTRA NEL GESTIONALE.
     Decide solo chi vede la chat. Il cancello resta quello del Gestionale:
     sbagliare qui deve poter costare al massimo una chat, mai il gestionale.

     ⚠️ Chiede il
       Gestionale per prima cosa, perche' l'AI si APPOGGIA sopra:
     l'AI con il Gestionale scaduto non vale.
     ============================================================ */
  function haChatPro(row){
    if(!haPremium(row)) return false;          /* l'AI sta SOPRA il Gestionale */
    if(row.chat_pro !== true) return false;    /* solo true vale: null e undefined no */
    /* se c'e' una scadenza ed e' passata, l'AI non vale piu' */
    if(row.chat_pro_scadenza){
      var sc = new Date(row.chat_pro_scadenza);
      if(!isNaN(sc.getTime()) && sc.getTime() < Date.now()) return false;
    }
    return true;
  }
  /* il banco lo chiama da qui: e' l'unico punto che decide chi ha la chat */
  window._haChatPro = haChatPro;

  /* ============================================================
     LA PROVA DI 30 GIORNI — 30 agosto 2026
     Regola di Alessio: «prima lo visita, lo prova, e poi se gli sta bene
     sa il prezzo e paga». Sono due cose diverse:
       VISITA — entra e guarda, non salva. Non c'e' niente da scrivere qui:
                il divieto di salvare sta gia' nel database.
       PROVA  — 30 giorni pieni, salvataggi compresi, senza carta.
                Sta in `gest_prova_fine`, e la scrive solo il server.
     ⚠️ Qui la prova vale quanto il Gestionale: chi ce l'ha entra e basta.
     ============================================================ */
  function inProva(row){
    if(!row||!row.gest_prova_fine)return false;
    var f=new Date(row.gest_prova_fine);
    return !isNaN(f.getTime()) && f.getTime()>Date.now();
  }
  function giorniProva(row){
    if(!inProva(row))return 0;
    return Math.max(1, Math.ceil((new Date(row.gest_prova_fine).getTime()-Date.now())/86400000));
  }
  window._inProva=inProva;

  /* ⛔ 22 agosto 2026 — le schermate si spengono a vicenda da un ELENCO SOLO.
     Prima ognuna spegneva le altre a mano: con la quarta (gate-lento)
     dimenticarne una avrebbe lasciato due schermate una sopra l'altra. */
  var GATE_SCHERMATE=['gate-checking','gate-paywall','gate-manutenzione','gate-lento','gate-profilo'];
  function gateMostra(quale){
    q('gate-gestionale').style.display='flex';
    GATE_SCHERMATE.forEach(function(id){ var e=q(id); if(e)e.style.display=(id===quale?'block':'none'); });
    document.body.style.overflow='hidden';
  }
  function showChecking(t){gateMostra('gate-checking');q('gate-checking').textContent=t;}
  /* ⛔ 18 set 2026 — PAGA-E-ATTIVA: il muro apre la cassa, non una pagina.
     Prima i due bottoni portavano a `info-premium.html` e `prezzi.html`:
     due pagine che SPIEGANO. Chi e' arrivato fin qui ha gia' scelto e si e'
     gia' registrato — vuole pagare, non leggere un'altra volta cosa compra.
     ⚠️ La cassa e il webhook esistono dal 29 agosto: qui si chiama soltanto
        `crea-checkout-abbonamento`, che vuole prodotto + mensile/annuale +
        la mail. Non serve essere dentro: basta la mail. */
  var PIANI_CASSA = {
    'base-anno': { prodotto:'premium',    piano:'annuale', nome:'Gestionale \u2014 249 \u20ac all\u2019anno' },
    'base-mese': { prodotto:'premium',    piano:'mensile', nome:'Gestionale \u2014 29 \u20ac al mese' },
    'ai-anno':   { prodotto:'premium-ai', piano:'annuale', nome:'Gestionale con AI \u2014 349 \u20ac all\u2019anno' },
    'ai-mese':   { prodotto:'premium-ai', piano:'mensile', nome:'Gestionale con AI \u2014 39 \u20ac al mese' }
  };

  function pwErrore(t){
    var e=q('gate-pw-err'); if(!e)return;
    e.textContent=t; e.style.display='block';
  }

  function vaiAllaCassa(chiave, bottone){
    var scelta=PIANI_CASSA[chiave];
    if(!scelta){ pwErrore('Non riconosco il piano. Riprova dalla pagina dei prezzi.'); return; }
    var email=window._gestEmail||'';
    if(!email){ pwErrore('Non trovo la tua email: esci e rientra, poi riprova.'); return; }

    var testoPrima=bottone.textContent;
    bottone.disabled=true; bottone.style.opacity='.65'; bottone.textContent='Apro la cassa\u2026';
    var e=q('gate-pw-err'); if(e)e.style.display='none';

    fetch('/.netlify/functions/crea-checkout-abbonamento',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        prodotto: scelta.prodotto,
        piano:    scelta.piano,
        email:    email,
        /* ⚠️ finito il pagamento si torna QUI, non sul pannello: uno che
           ha appena pagato vuole entrare nel gestionale, non guardare un
           cruscotto. Il webhook nel frattempo ha acceso il piano. */
        returnUrl: location.origin + '/gestionale-app.html'
      })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d && d.url){ location.href=d.url; return; }
      throw new Error((d && d.error) || 'la cassa non ha risposto');
    })
    .catch(function(err){
      bottone.disabled=false; bottone.style.opacity='1'; bottone.textContent=testoPrima;
      pwErrore('Non sono riuscito ad aprire il pagamento: ' + ((err&&err.message)||'riprova fra poco') + '.');
    });
  }

  function bottonePaga(testo, chiave, principale){
    var b=document.createElement('button');
    b.type='button';
    b.textContent=testo;
    b.style.cssText='display:block;width:100%;padding:16px;margin-bottom:10px;border:0;border-radius:10px;'
      + 'font-size:17px;font-weight:800;cursor:pointer;font-family:inherit;'
      + (principale
          ? 'background:var(--blu,#0066ff);color:#fff;'
          : 'background:var(--sfondo,#f3f5f2);color:var(--testo,#1c2b36);');
    b.onclick=function(){ vaiAllaCassa(chiave, b); };
    return b;
  }

  function showPaywall(){
    gateMostra('gate-paywall');
    var box=q('gate-btns'); if(!box)return;
    box.innerHTML='';

    /* ⛔ 24 settembre 2026 — LA PROVA DI 30 GIORNI SUL MURO.
       prova-il-gestionale.html e /gestionale promettono «30 giorni gratis,
       senza carta». Ma chi si iscriveva da li' arrivava QUI, dove c'era solo
       la cassa: la prova si chiedeva solo dal pannello, e lui nel pannello
       non ci passa. Adesso, se e' iscritto e la prova non l'ha mai fatta,
       il primo bottone e' la prova. Una volta sola: lo decide il server. */
    if(window._gestUid && window._gestProvaLibera){
      var bp=document.createElement('button');
      bp.type='button';
      bp.textContent='Provalo gratis 30 giorni';
      bp.style.cssText='display:block;width:100%;padding:16px;margin-bottom:6px;border:0;border-radius:10px;'
        +'font-size:17px;font-weight:800;cursor:pointer;font-family:inherit;background:var(--verde,#1f9d55);color:#fff;';
      bp.onclick=function(){ avviaProvaDalMuro(bp); };
      box.appendChild(bp);
      var np=document.createElement('p');
      np.style.cssText='margin:0 0 16px;text-align:center;font-size:14px;color:var(--testo-3,#7a848f);';
      np.textContent='Senza carta di credito. Finiti i 30 giorni non paghi niente, se non scegli tu.';
      box.appendChild(np);
    }

    var scelto=window._gestPianoScelto;
    if(scelto && PIANI_CASSA[scelto]){
      /* ha gia' scelto sulla pagina: un bottone solo, col suo prezzo */
      var c=q('gate-pw-scelto'), n=q('gate-pw-nome');
      if(c&&n){ n.textContent=PIANI_CASSA[scelto].nome; c.style.display='block'; }
      box.appendChild(bottonePaga('Paga e attiva', scelto, true));
      var alt=document.createElement('p');
      alt.style.cssText='margin:6px 0 0;text-align:center;font-size:15px;';
      alt.innerHTML='<a href="/gestionale#prezzi" style="color:var(--blu,#0066ff);text-decoration:none;font-weight:700;">Cambia prezzo</a>';
      box.appendChild(alt);
    }else{
      /* ⚠️ non ha scelto niente (arriva dal marketplace, o il campo e'
         vuoto): si fa scegliere qui, non si decide al posto suo. */
      box.appendChild(bottonePaga('Gestionale \u2014 249 \u20ac l\u2019anno', 'base-anno', true));
      box.appendChild(bottonePaga('Gestionale con AI \u2014 349 \u20ac l\u2019anno', 'ai-anno', false));
      var v=document.createElement('p');
      v.style.cssText='margin:6px 0 0;text-align:center;font-size:15px;';
      v.innerHTML='<a href="/gestionale#prezzi" style="color:var(--blu,#0066ff);text-decoration:none;font-weight:700;">Vedi tutti e quattro i prezzi</a>';
      box.appendChild(v);
    }

    /* la porta di uscita: vedi la nota nel markup qui sopra */
    mostraScarica();
  }

  /* ⚠️ IL RISULTATO SI DEVE VEDERE. Le funzioni di esportazione parlano con
     toast(), che sta a z-index 90: sotto questo muro (999999) non lo vedrebbe
     nessuno. In css/gestionale.css il toast e' stato alzato sopra il muro, e
     in piu' qui il link stesso dice «Preparo...» mentre lavora: un file grande
     ci mette qualche secondo, e senza un segno uno pensa che il tasto sia
     morto e ci schiaccia sopra cinque volte. */
  /* 1 ottobre 2026: i tre id si possono passare, cosi' la stessa porta di
     uscita serve anche alla schermata del profilo (gate-pr-*). Senza
     argomenti fa quello di prima, identico. */
  function mostraScarica(idBox,idX,idJ,idErr){
    var p=q(idBox||'gate-pw-export'); if(!p) return;
    if(!window._gestUid) return;
    if(typeof window.esportaExcel!=='function'||typeof window.esportaJson!=='function') return;
    p.style.display='block';
    var x=q(idX||'gate-pw-export-x'), j=q(idJ||'gate-pw-export-j');
    function attacca(el,fn){
      if(!el) return;
      el.onclick=function(ev){
        ev.preventDefault();
        var prima=el.textContent;
        el.textContent='Preparo\u2026';
        el.style.pointerEvents='none';
        Promise.resolve().then(fn).catch(function(e){
          var err=q(idErr||'gate-pw-err');
          if(err){ err.textContent='Non sono riuscito a preparare il file: '+((e&&e.message)||'riprova fra poco')+'.'; err.style.display='block'; }
        }).then(function(){ el.textContent=prima; el.style.pointerEvents=''; });
      };
    }
    attacca(x,function(){return window.esportaExcel();});
    attacca(j,function(){return window.esportaJson();});
  }

  function avviaProvaDalMuro(b){
    var prima=b.textContent; b.disabled=true; b.style.opacity='.65'; b.textContent='Un attimo\u2026';
    var e=q('gate-pw-err'); if(e)e.style.display='none';
    window._gc.auth.getSession().then(function(r){
      var t=r&&r.data&&r.data.session&&r.data.session.access_token;
      if(!t)throw new Error('la sessione \u00e8 scaduta: esci e rientra');
      return fetch('/.netlify/functions/prova-gestionale',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}});
    }).then(function(r){return r.json();}).then(function(d){
      if(d && (d.ok || d.gia_dentro || (d.gia_usata && d.attiva))){ location.reload(); return; }
      throw new Error((d&&(d.messaggio||d.error))||'la prova non si \u00e8 aperta');
    }).catch(function(err){
      b.disabled=false; b.style.opacity='1'; b.textContent=prima;
      pwErrore((err&&err.message)||'Riprova fra poco.');
    });
  }
  /* ============================================================
     ===== IL PROFILO MINIMO — 1 ottobre 2026 =====
     ============================================================
     Idea di Alessio: il gestionale base si regala a chi si iscrive, ma chi
     lo vuole usare deve avere un profilo VERO: «verranno bloccati se non
     inseriranno almeno il 90% delle loro informazioni». Cosi' ogni iscritto
     che usa il gestionale lascia sul sito una scheda piena, e il sito vale
     di piu' per i clienti, per i negozi e per chi vuole fare pubblicita'.

     ⚠️ NON E' IL 90%: e' una lista fissa di 7 cose — nome, mestiere, citta',
     telefono scritto bene, descrizione di almeno 100 caratteri, logo, email
     confermata. Una percentuale non si spiega a nessuno e si aggira con un
     campo qualunque; con una lista l'iscritto vede cosa gli manca.
     Le foto dei lavori restano FUORI: oggi `lavori_foto` si conta a parte e
     non e' una colonna del profilo.

     ⛔ INTERRUTTORE SPENTO (PROFILO_MINIMO_ATTIVO = false): oggi questa
     schermata non compare a nessuno. Si accende INSIEME all'apertura del
     gestionale base gratuito, non prima. Misurato il 1 ottobre 2026 su 144
     iscritti: tutte e 7 le voci le hanno 20; almeno 6 le hanno 64; ne manca
     soprattutto la descrizione (32 su 144) e il logo (57 su 144). Quindi
     accenderlo adesso metterebbe davanti alla schermata 124 iscritti, anche
     fra chi PAGA. Per guardarla senza accenderla: aggiungere ?profilo=prova
     all'indirizzo del gestionale (anteprima: non salva niente).

     ⛔ IL LOGO. Nel pannello il pulsante del logo lo vede solo chi ha il
     Premium (`btn-logo` e' nascosto agli altri). Chiedere il logo a chi non
     lo puo' caricare sarebbe un blocco impossibile da superare: per questo
     il caricamento sta QUI, nella schermata. Il database lo permette a
     tutti (la regola di `loghi-imprese` guarda solo che la cartella sia
     dell'utente, non il piano).

     ⛔ IN CASO DI DUBBIO SI ENTRA. Al contrario del resto del cancello:
     questo non e' un controllo di sicurezza, e' una cortesia. Se la lettura
     del profilo va in errore o ci mette piu' di 6 secondi, chi ha gia'
     diritto di entrare entra. Chiudere fuori un cliente pagante per una
     tentennata della rete sarebbe il danno peggiore.
     ============================================================ */
  var PROFILO_MINIMO_ATTIVO = false;
  var DESCR_MIN = 100;           /* caratteri minimi della descrizione */
  var DESCR_MAX_FREE = 200;      /* il piano Free non ne accetta di piu' (vedi modifica-profilo.html) */
  var COLONNE_PROFILO = 'nome_attivita, nome, mestiere, mestieri, citta, telefono, descrizione, logo_url, email_confermata, piano';
  var _gpRiga = null, _gpProva = false, _gpAperto = null;

  function _pieno(v){ return v!==null && v!==undefined && String(v).trim()!==''; }

  /* Un numero italiano: cellulare (3...), fisso (0...) o numero verde.
     Si tolgono spazi, punti, trattini, parentesi e il prefisso +39 / 0039.
     Misurato sui 122 telefoni veri: 121 passano; l'unico scartato e' una
     riga con DUE numeri attaccati. */
  function telefonoValido(t){
    var s=String(t==null?'':t).replace(/[\s.\-()\/]/g,'').replace(/^(\+39|0039)/,'');
    if(!/^\d+$/.test(s)) return false;
    if(/^(\d)\1+$/.test(s)) return false;           /* 3333333333 */
    return /^3\d{8,9}$/.test(s) || /^0\d{5,10}$/.test(s) || /^(800|803|199|848)\d{3,7}$/.test(s);
  }
  /* il mestiere sta in DUE colonne: la vecchia `mestiere` e la lista `mestieri`.
     Vale l'una O l'altra (stessa regola di completa-profilo.js). */
  function _haMestiere(r){
    var l=r.mestieri;
    var haLista=Array.isArray(l) ? l.filter(Boolean).length>0 : _pieno(l);
    return _pieno(r.mestiere) || haLista;
  }
  var VOCI_PROFILO=[
    {id:'nome',        etichetta:'Nome attività',  come:'link',  ok:function(r){return _pieno(r.nome_attivita)||_pieno(r.nome);}},
    {id:'mestiere',    etichetta:'Mestiere',            come:'link',  ok:_haMestiere},
    {id:'citta',       etichetta:'Città',          come:'link',  ok:function(r){return _pieno(r.citta);}},
    {id:'telefono',    etichetta:'Telefono',            come:'testo', aiuto:'Il numero dove ti chiamano i clienti', ok:function(r){return telefonoValido(r.telefono);}},
    {id:'descrizione', etichetta:'Descrizione',         come:'lungo', aiuto:'Almeno 100 caratteri', ok:function(r){return String(r.descrizione==null?'':r.descrizione).trim().length>=DESCR_MIN;}},
    {id:'logo',        etichetta:'Logo',                come:'file',  aiuto:'Il tuo marchio o una foto', ok:function(r){return _pieno(r.logo_url);}},
    {id:'email',       etichetta:'Email confermata',    come:'email', aiuto:'Controlla la tua posta', ok:function(r){return r.email_confermata===true;}}
  ];
  /* l'unico punto che decide se un profilo basta: il banco lo chiama da qui */
  function profiloMinimo(riga){
    var r=riga||{}, fatte=0, mancanti=[];
    VOCI_PROFILO.forEach(function(v){ if(v.ok(r)) fatte++; else mancanti.push(v.id); });
    return {fatte:fatte, totale:VOCI_PROFILO.length, completo:fatte===VOCI_PROFILO.length, mancanti:mancanti};
  }
  window._profiloMinimo=profiloMinimo;
  window._telefonoValido=telefonoValido;

  function leggiProfilo(gc,uid){
    return gc.from('imprese').select(COLONNE_PROFILO).eq('user_id',uid).maybeSingle().then(function(res){
      if(res&&res.error) throw res.error;
      return (res&&res.data)||null;
    });
  }
  /* Si risolve SEMPRE, con 'ok' o 'profilo': mai rifiutata, mai appesa. */
  function controllaProfilo(gc,uid,prova){
    return new Promise(function(risolvi){
      var finito=false, t=null;
      function fine(esito){ if(finito)return; finito=true; clearTimeout(t); risolvi(esito); }
      t=setTimeout(function(){ fine('ok'); },6000);
      leggiProfilo(gc,uid).then(function(riga){
        if(!riga){ fine('ok'); return; }      /* nessuna riga: non tocca a questa schermata dirlo */
        if(prova){ riga=Object.assign({},riga,{descrizione:'',logo_url:'',email_confermata:false}); }
        _gpRiga=riga; _gpProva=!!prova;
        fine(profiloMinimo(riga).completo?'ok':'profilo');
      },function(){ fine('ok'); });
    });
  }

  function gpErr(t){ var e=q('gp-err'),m=q('gp-msg'); if(e){e.textContent=t||'';e.style.display=t?'block':'none';} if(t&&m)m.style.display='none'; }
  function gpMsg(t){ var m=q('gp-msg'),e=q('gp-err'); if(m){m.textContent=t||'';m.style.display=t?'block':'none';} if(t&&e)e.style.display='none'; }
  var GP_ANTEPRIMA='Questa è solo un’anteprima: non salvo niente.';

  function mostraProfilo(){
    gateMostra('gate-profilo');
    disegnaProfilo();
    mostraScarica('gate-pr-export','gate-pr-export-x','gate-pr-export-j','gp-err');
  }
  function profiloCompletato(){
    hideGate();
    if(window._gestProvaGiorni>0)strisciaProva(window._gestProvaGiorni);
  }

  function disegnaProfilo(){
    var esito=profiloMinimo(_gpRiga), man=esito.totale-esito.fatte;
    q('gp-sub').textContent = man===1 ? 'Ti manca 1 cosa. Ci vuole un minuto.' : 'Ti mancano '+man+' cose. Ci vogliono pochi minuti.';
    q('gp-conta').textContent = esito.fatte+' di '+esito.totale;
    q('gp-barra').style.width = Math.round(esito.fatte/esito.totale*100)+'%';
    var box=q('gp-righe'); box.innerHTML='';
    VOCI_PROFILO.forEach(function(v){ box.appendChild(rigaProfilo(v, v.ok(_gpRiga))); });
    q('gp-avanti').onclick=avantiProfilo;
    if(_gpAperto) apriEditor(_gpAperto,true);
  }

  function rigaProfilo(v,ok){
    var riga=document.createElement('div'); riga.className='gp-riga'; riga.setAttribute('data-voce',v.id);
    var ico=document.createElement('span'); ico.className='gp-ico '+(ok?'gp-ok':'gp-no'); ico.textContent=ok?'✓':''; ico.setAttribute('aria-hidden','true');
    var nome=document.createElement('span'); nome.className='gp-nome'; nome.textContent=v.etichetta;
    if(!ok && v.aiuto){ var a=document.createElement('span'); a.className='gp-aiuto'; a.textContent=v.aiuto; nome.appendChild(a); }
    riga.appendChild(ico); riga.appendChild(nome);
    if(ok) return riga;
    if(v.come==='link'){
      var l=document.createElement('a'); l.className='gp-btn'; l.href='/modifica-profilo.html'; l.textContent='Aggiungi';
      if(_gpProva) l.onclick=function(ev){ ev.preventDefault(); gpMsg('Anteprima: da qui ti porto alla pagina per modificare il profilo.'); };
      riga.appendChild(l); return riga;
    }
    if(v.come==='email'){
      var b=document.createElement('button'); b.type='button'; b.className='gp-btn'; b.textContent='Invia di nuovo';
      b.onclick=function(){ rimandaEmail(b); };
      riga.appendChild(b); return riga;
    }
    var bt=document.createElement('button'); bt.type='button'; bt.className='gp-btn'; bt.textContent='Aggiungi';
    bt.onclick=function(){ apriEditor(v.id); };
    var ed=document.createElement('div'); ed.className='gp-edit';
    riga.appendChild(bt); riga.appendChild(ed);
    costruisciEditor(v,ed);
    return riga;
  }

  function apriEditor(id,senzaFocus){
    _gpAperto=id;
    var righe=q('gp-righe').querySelectorAll('.gp-riga');
    for(var i=0;i<righe.length;i++){
      var ed=righe[i].querySelector('.gp-edit'); if(!ed)continue;
      var mio=(righe[i].getAttribute('data-voce')===id);
      if(mio) ed.classList.add('aperto'); else ed.classList.remove('aperto');
      if(mio && !senzaFocus){
        var f=ed.querySelector('input[type=tel],textarea'); if(f){ try{f.focus();}catch(_){} }
        try{ righe[i].scrollIntoView({block:'center',behavior:'smooth'}); }catch(_){}
      }
    }
  }

  function bottoneSalva(testo,fn){
    var b=document.createElement('button'); b.type='button'; b.className='gp-salva'; b.textContent=testo||'Salva';
    b.onclick=fn; return b;
  }

  function costruisciEditor(v,ed){
    var sotto=document.createElement('div'); sotto.className='gp-sotto';
    if(v.id==='telefono'){
      var inp=document.createElement('input'); inp.type='tel'; inp.className='gp-in'; inp.placeholder='333 1234567';
      inp.setAttribute('inputmode','tel'); inp.setAttribute('autocomplete','tel'); inp.maxLength=20;
      var sv=bottoneSalva('Salva',function(){
        var val=inp.value.trim();
        if(!telefonoValido(val)){ gpErr('Scrivi un numero italiano: un cellulare che comincia con 3, oppure un fisso che comincia con 0.'); return; }
        salvaProfilo({telefono:val},sv);
      });
      ed.appendChild(inp); sotto.appendChild(sv); ed.appendChild(sotto);
      return;
    }
    if(v.id==='descrizione'){
      var free=String((_gpRiga&&_gpRiga.piano)||'free').toLowerCase()==='free';
      var ta=document.createElement('textarea'); ta.className='gp-in';
      ta.placeholder='Cosa fai, in quali zone lavori e da quanti anni. Per esempio: «Ristrutturazioni di appartamenti e bagni chiavi in mano, a Rieti e provincia, da 15 anni.»';
      ta.maxLength=free?DESCR_MAX_FREE:2000;
      var co=document.createElement('span'); co.className='gp-conta';
      var agg=function(){
        var n=ta.value.trim().length;
        co.textContent = n>=DESCR_MIN ? 'Perfetto, '+n+' caratteri' : 'Ne mancano '+(DESCR_MIN-n)+' (hai scritto '+n+')';
      };
      ta.addEventListener('input',agg); agg();
      var sd=bottoneSalva('Salva',function(){
        var val=ta.value.trim();
        if(val.length<DESCR_MIN){ gpErr('Servono almeno '+DESCR_MIN+' caratteri: ne hai scritti '+val.length+'.'); return; }
        salvaProfilo({descrizione:val},sd);
      });
      ed.appendChild(ta); sotto.appendChild(co); sotto.appendChild(sd); ed.appendChild(sotto);
      return;
    }
    if(v.id==='logo'){
      var fi=document.createElement('input'); fi.type='file'; fi.accept='image/png,image/jpeg,image/webp'; fi.style.display='none';
      var sc=bottoneSalva('Scegli un’immagine',function(){ if(_gpProva){ gpMsg(GP_ANTEPRIMA); return; } fi.click(); });
      fi.onchange=function(){ caricaLogoProfilo(fi.files&&fi.files[0],sc); fi.value=''; };
      var hint=document.createElement('span'); hint.className='gp-conta'; hint.textContent='JPG, PNG o WEBP. Va bene anche una tua foto.';
      sotto.appendChild(hint); sotto.appendChild(sc); ed.appendChild(fi); ed.appendChild(sotto);
      return;
    }
  }

  /* ⚠️ Ogni UPDATE si verifica con .select('id'): senza, un blocco di Supabase
     passerebbe per un salvataggio riuscito (regola del gestionale). */
  function salvaProfilo(campi,bottone){
    gpErr(''); gpMsg('');
    if(_gpProva){ gpMsg(GP_ANTEPRIMA); return Promise.resolve(false); }
    var gc=window._gc, uid=window._gestUid;
    if(!gc||!uid){ gpErr('Non sono collegato al tuo account: esci e rientra, poi riprova.'); return Promise.resolve(false); }
    var prima=bottone?bottone.textContent:'';
    if(bottone){ bottone.disabled=true; bottone.textContent='Salvo…'; }
    return gc.from('imprese').update(campi).eq('user_id',uid).select('id').then(function(res){
      if(res&&res.error) throw res.error;
      if(!res||!res.data||!res.data.length) throw new Error('il salvataggio non è passato');
      /* se la rilettura non arriva, si tengono i dati di prima piu' quelli appena salvati */
      return leggiProfilo(gc,uid).catch(function(){ return null; });
    }).then(function(riga){
      _gpRiga = riga || Object.assign({},_gpRiga,campi);
      _gpAperto=null;
      if(profiloMinimo(_gpRiga).completo){ profiloCompletato(); }
      else { disegnaProfilo(); gpMsg('Salvato.'); }
      return true;
    }).catch(function(e){
      if(bottone){ bottone.disabled=false; bottone.textContent=prima; }
      gpErr('Non sono riuscito a salvare: '+((e&&e.message)||'riprova fra poco')+'.');
      return false;
    });
  }

  /* Il logo si rimpicciolisce a 400 px (come nel pannello) prima di salirlo:
     una foto di telefono pesa 5 MB e il logo si vede in un cerchio da 120. */
  function rimpicciolisci(file,lato){
    return new Promise(function(ok){
      try{
        var url=URL.createObjectURL(file), im=new Image();
        im.onload=function(){
          try{
            var s=Math.min(1,lato/Math.max(im.width,im.height)), c=document.createElement('canvas');
            c.width=Math.max(1,Math.round(im.width*s)); c.height=Math.max(1,Math.round(im.height*s));
            c.getContext('2d').drawImage(im,0,0,c.width,c.height);
            c.toBlob(function(b){
              URL.revokeObjectURL(url);
              if(!b||!b.size){ ok(null); return; }
              ok({blob:b,tipo:b.type||'image/png',ext:(b.type==='image/webp'?'webp':'png')});
            },'image/webp',0.82);
          }catch(e){ ok(null); }
        };
        im.onerror=function(){ URL.revokeObjectURL(url); ok(null); };
        im.src=url;
      }catch(e){ ok(null); }
    });
  }
  function caricaLogoProfilo(file,bottone){
    gpErr(''); gpMsg('');
    if(!file) return;
    if(_gpProva){ gpMsg(GP_ANTEPRIMA); return; }
    if(!/^image\/(png|jpe?g|webp)$/i.test(file.type||'')){ gpErr('Scegli una foto JPG, PNG o WEBP.'); return; }
    if(file.size>10*1024*1024){ gpErr('L’immagine è troppo grande: scegline una sotto i 10 MB.'); return; }
    var gc=window._gc, uid=window._gestUid;
    if(!gc||!uid){ gpErr('Non sono collegato al tuo account: esci e rientra, poi riprova.'); return; }
    var prima=bottone.textContent; bottone.disabled=true; bottone.textContent='Carico…';
    var ripristina=function(){ bottone.disabled=false; bottone.textContent=prima; };
    rimpicciolisci(file,400).then(function(r){
      if(!r) throw new Error('non riesco a leggere questa immagine, prova con un’altra');
      var path=uid+'/logo.'+r.ext;
      return gc.storage.from('loghi-imprese').upload(path,r.blob,{upsert:true,contentType:r.tipo,cacheControl:'31536000'}).then(function(up){
        if(up&&up.error) throw up.error;
        var pu=gc.storage.from('loghi-imprese').getPublicUrl(path);
        return pu.data.publicUrl+'?v='+Date.now();
      });
    }).then(function(url){
      return salvaProfilo({logo_url:url},bottone);
    }).then(function(fatto){ if(!fatto) ripristina(); })
    .catch(function(e){ ripristina(); gpErr('Non sono riuscito a caricare il logo: '+((e&&e.message)||'riprova fra poco')+'.'); });
  }

  function rimandaEmail(b){
    gpErr(''); gpMsg('');
    if(_gpProva){ gpMsg('Anteprima: non mando nessuna email.'); return; }
    var gc=window._gc, email=window._gestEmail;
    if(!gc||!email){ gpErr('Non trovo la tua email: esci e rientra, poi riprova.'); return; }
    var prima=b.textContent; b.disabled=true; b.textContent='Un attimo…';
    gc.auth.resend({type:'signup',email:email}).then(function(res){
      if(res&&res.error) throw res.error;
      b.disabled=false; b.textContent=prima;
      gpMsg('Ti ho mandato una nuova email. Controlla la posta, anche nella cartella spam.');
    }).catch(function(e){
      b.disabled=false; b.textContent=prima;
      gpErr('Non sono riuscito a mandare l’email: '+((e&&e.message)||'riprova fra poco')+'.');
    });
  }

  /* il pulsante grande: porta alla prima cosa che manca */
  function avantiProfilo(){
    var m=profiloMinimo(_gpRiga).mancanti[0]; if(!m)return;
    var v=VOCI_PROFILO.filter(function(x){return x.id===m;})[0];
    if(v.come==='link'){
      if(_gpProva){ gpMsg('Anteprima: da qui ti porto alla pagina per modificare il profilo.'); return; }
      location.href='/modifica-profilo.html'; return;
    }
    if(v.come==='email'){ gpMsg('Apri la mail che ti abbiamo mandato e premi il link. Se non la trovi, premi «Invia di nuovo».'); return; }
    apriEditor(v.id);
  }

  function showManutenzione(){gateMostra('gate-manutenzione');}
  function showLento(){gateMostra('gate-lento');}

  /* "Avvisami quando è pronto" */
  window.avvisamiGestionale=function(){
    var btn=q('gate-avvisami-btn'), err=q('gate-avvisami-err');
    err.style.display='none';
    if(!window._gestUid||!window._gc){
      err.textContent='Devi essere collegato al tuo account TrovaImpresa per registrarti.';
      err.style.display='block';return;
    }
    btn.disabled=true;btn.style.opacity='0.6';btn.textContent='Un attimo…';
    window._gc.from('gest_interessati')
      .upsert({user_id:window._gestUid,email:window._gestEmail||''},{onConflict:'user_id'})
      .then(function(res){
        if(res&&res.error){throw res.error;}
        q('gate-avvisami-box').style.display='none';
        q('gate-avvisami-ok').style.display='block';
      })
      .catch(function(e){
        btn.disabled=false;btn.style.opacity='1';btn.textContent='Avvisami quando è pronto';
        err.textContent='Non sono riuscito a registrarti: '+((e&&e.message)||'riprova fra poco')+'.';
        err.style.display='block';
      });
  };
  function hideGate(){q('gate-gestionale').style.display='none';document.body.style.overflow='';}

  /* La striscia in basso: incollata al bordo della finestra, larga tutto
     lo schermo, sempre visibile mentre si scorre.

     ⛔ SUL TELEFONO NON DEVE COPRIRE LA BARRA DEI QUATTRO PULSANTI.
     Sotto gli 880 px il gestionale ha `.barra-basso` incollata in fondo
     (56 px di pulsante piu' 12 di aria, piu' il bordo del telefono). La
     striscia si alza di quel tanto: se le si sedesse sopra, sul telefono
     il gestionale diventerebbe inservibile proprio a chi lo sta provando. */
  function strisciaBasso(){
    if(!q('gest-striscia-stile')){
      var st=document.createElement('style');
      st.id='gest-striscia-stile';
      st.textContent='#gest-striscia{position:fixed;left:0;right:0;bottom:0;z-index:9998;'
        +'background:#0a2a4d;color:#fff;padding:12px 16px;font-size:14px;line-height:1.4;'
        /* 27 set 2026: la striscia sta fuori da #app-root, quindi non prendeva
           il carattere del gestionale e usciva in Times. */
        +'font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
        +'display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;'
        +'box-shadow:0 -2px 12px rgba(0,0,0,0.25);'
        +'padding-bottom:calc(12px + env(safe-area-inset-bottom, 0px))}'
        +'@media(max-width:880px){#gest-striscia{'
        +'bottom:calc(68px + env(safe-area-inset-bottom, 0px));'
        +'padding-bottom:12px}}';
      document.head.appendChild(st);
    }
    var d=document.createElement('div');
    d.id='gest-striscia';
    document.body.appendChild(d);
    return d;
  }
  function strisciaVisita(){
    if(q('gest-striscia'))return;
    var d=strisciaBasso();
    var t=document.createElement('span');
    t.textContent='Stai visitando il gestionale: puoi guardare tutto, ma per salvare serve il piano.';
    d.appendChild(t);
    /* ⛔ QUI NON SI VENDE NIENTE. La prova si chiede dalla porta, nel
       pannello, prima di entrare: dentro resta solo la riga che dice
       come stai, e il modo di tornare indietro. */
    var a=document.createElement('a');
    a.href='pannello-impresa.html#dashboard';
    a.textContent='Torna al pannello';
    a.style.cssText='color:#fff;font-size:14px;font-weight:700;text-decoration:underline';
    d.appendChild(a);
  }
  /* 24 set 2026 — IL GIRO: dati finti, niente account. Qui si offre la
     prova, perche' chi fa il giro dalla pagina /gestionale non ha un
     pannello da cui chiederla. */
  function strisciaGiro(){
    if(q('gest-striscia'))return;
    var d=strisciaBasso();
    var t=document.createElement('span');
    t.textContent='Stai guardando un gestionale di prova, con dati finti. Qui non si salva niente.';
    d.appendChild(t);
    var a=document.createElement('a');
    a.href='/gestionale#comincia';
    a.textContent='Provalo gratis 30 giorni';
    a.style.cssText='background:#fff;color:#0a2a4d;font-size:14px;font-weight:800;text-decoration:none;padding:8px 14px;border-radius:8px;white-space:nowrap';
    d.appendChild(a);
  }
  function strisciaProva(giorni){
    if(q('gest-striscia'))return;
    var d=strisciaBasso();
    var t=document.createElement('span');
    t.textContent='Prova del gestionale: ti '+(giorni===1?'resta 1 giorno':('restano '+giorni+' giorni'))+'.';
    d.appendChild(t);
    var a=document.createElement('a');
    a.href='pannello-impresa.html#dashboard';
    a.textContent='Vedi i piani';
    a.style.cssText='color:#fff;font-size:14px;font-weight:700;text-decoration:underline';
    d.appendChild(a);
  }

;
  /* ⛔ 20 settembre 2026 — TOLTA `window.attivaGestionale`.
     Apriva `crea-checkout-gestionale`, la cassa del vecchio add-on a
     12/119 euro. Non la chiamava piu' nessuno (controllato in tutto il
     sito), ma era una porta aperta: chi ne conosceva l'indirizzo poteva
     comprare al prezzo vecchio e — peggio — pagare per niente, perche'
     quella cassa accende `gestionale_attivo`, che questo cancello non
     guarda. Oggi si passa tutti da `vaiAllaCassa()` qui sopra, che usa
     `crea-checkout-abbonamento` e i 4 prezzi veri.
     La funzione sul server risponde 410 e spiega perche'. */
  /* Traccia chi apre il gestionale. Una riga ogni 30 minuti per utente,
     così i refresh non riempiono la tabella. Se fallisce non blocca nulla. */
  function registraAccesso(gc,uid,email,attivo){
    try{
      var k='ti_ultimo_accesso_'+uid;
      var last=parseInt(localStorage.getItem(k)||'0',10);
      if(Date.now()-last<30*60*1000)return;
      localStorage.setItem(k,String(Date.now()));
    }catch(_){}
    try{
      gc.from('gest_accessi').insert({
        user_id:uid,
        email:email||'',
        pagina:PAGINA,
        ha_accesso:!!attivo
      }).then(function(){},function(){});
    }catch(_){}
  }
  function ammesso(email){
    if(!MANUTENZIONE)return true;
    if(new URLSearchParams(location.search).get('chiave')==='apri')return true; /* scorciatoia per Alessio */
    var e=String(email||'').trim().toLowerCase();
    for(var i=0;i<AMMESSI.length;i++){ if(AMMESSI[i].trim().toLowerCase()===e)return true; }
    return false;
  }

  function start(){
    /* 24 set 2026 — IL GIRO: si entra e basta, senza chiedere chi sei.
       La chat resta spenta: e' per gli iscritti. */
    if(window.TI_GIRO){
      window._gestPremium=false; window._chatPro=false; window._chatAssaggio=false;
      if(q('gate-gestionale'))hideGate();
      strisciaGiro();
      return;
    }
    if(!window.supabase){return setTimeout(start,200);}
    var gc=window.supabase.createClient(SU,SK);
    window._gc=gc;
    showChecking('Apertura del gestionale…');
    var deciso=false;
    var chiave=(new URLSearchParams(location.search).get('chiave')==='apri');
    /* esito: 'ok' entra · 'manutenzione' · 'premium' mostra il listino ·
              'lento' non si e' riuscito a verificare */
    var decidi=function(email,esito){
      if(deciso)return; deciso=true;
      if(chiave){hideGate();return;}                       /* scorciatoia per Alessio */
      if(esito==='lento'){showLento();return;}             /* nel dubbio, FUORI */
      if(!ammesso(email)){showManutenzione();return;}
      /* 1 ottobre 2026 — ha diritto di entrare, ma il profilo non basta */
      if(esito==='profilo'){ mostraProfilo(); return; }
      if(esito==='premium'){
        /* ⛔ NON SI SPAVENTA IL CLIENTE PRIMA DI FARLO ENTRARE.
           Se arriva dal pulsante «Entra e guarda» del pannello il paywall
           non si mostra: entra, gira dappertutto, e quando prova a salvare
           e' il database a dirgli che serve il piano. La striscia in basso
           gli offre i 30 giorni pieni. */
        if(new URLSearchParams(location.search).get('visita')==='1'){
          hideGate(); strisciaVisita(); return;
        }
        showPaywall();return;
      }
      hideGate();
      if(window._gestProvaGiorni>0)strisciaProva(window._gestProvaGiorni);
    };

    /* ⛔ 22 agosto 2026 — LE DUE PORTE CHE SI APRIVANO DA SOLE.
       Qui c'erano due strade che finivano con «entra»: il tempo scaduto dopo
       8 secondi, e la lettura del piano andata in errore. Erano scelte
       volute, e la ragione era buona — non lasciare fuori chi paga. Ma il
       verso era sbagliato: per entrare gratis bastava RALLENTARE quella
       richiesta, cosa che si fa dal menu degli sviluppatori in tre secondi.
       Adesso il dubbio chiude, non apre. E perche' chi paga non resti fuori
       per un tentennamento della rete, prima di chiudere si RIPROVA una
       seconda volta: due tentativi da 8 secondi, e solo dopo la schermata
       «non riesco a verificare», che ha il pulsante per riprovare. */
    var TEMPO=8000, tentativi=0, timer=null;

    function prova(){
      tentativi++;
      clearTimeout(timer);
      timer=setTimeout(function(){
        if(deciso)return;
        if(tentativi<2){ showChecking('La linea è lenta: riprovo…'); prova(); }
        else decidi(window._gestEmail||'','lento');
      },TEMPO);

      gc.auth.getSession().then(function(r){
        var s=r.data && r.data.session;
        /* senza login non si entra: si vede la schermata del listino col link per accedere */
        if(!s){clearTimeout(timer);decidi('','premium');return;}
        window._gestUid=s.user.id;
        /* ⚠️ 29 agosto 2026 — due colonne in piu' nella STESSA lettura: la
           chat non costa una seconda richiesta. Provate con la chiave anon
           sulla pagina vera prima di metterle qui: se PostgREST non le
           conoscesse, la lettura andrebbe in errore e il cancello
           chiuderebbe a TUTTI. */
        gc.from('imprese').select('email, piano, premium_scadenza, chat_pro, chat_pro_scadenza, gest_prova_fine, gest_piano_scelto').eq('user_id',s.user.id).maybeSingle().then(function(res){
          /* ⚠️ Supabase non lancia: l'errore torna DENTRO la risposta. Senza
             questa riga una lettura rifiutata passava per «nessuna riga»,
             cioe' per «non e' abbonato»: colpa data al piano invece che alla
             rete. */
          if(res&&res.error){ if(tentativi<2){prova();} else {clearTimeout(timer);decidi(window._gestEmail||'','lento');} return; }
          clearTimeout(timer);
          var row=res && res.data;
          window._gestEmail=(row&&row.email)||s.user.email||'';
          /* ⚠️ la prova apre quanto il Gestionale: se restasse fuori, uno che
             ha chiesto i 30 giorni si vedrebbe ancora il paywall. */
          var ok=haPremium(row)||inProva(row);
          window._gestPremium=ok;
          window._gestProvaGiorni=giorniProva(row);
          /* 24 set 2026 — la prova si offre anche dal muro (vedi showPaywall) */
          window._gestProvaLibera=!!row && !row.gest_prova_fine;
          /* ⛔ 18 set 2026 — il prezzo scelto su /gestionale, che il muro
             usera' per aprire la cassa giusta invece di dire 29/249 a tutti. */
          window._gestPianoScelto=(row&&row.gest_piano_scelto)||null;
          /* ⛔ l'AI NON entra nella decisione qui sotto: e' solo una
             lampadina che la chat guardera'. Il cancello resta il Gestionale. */
          /* ⛔ 30 agosto 2026 — LA PORTA DECIDE LA CHAT.
             Dal pannello ci sono due porte: «Gestionale» e
             «Gestionale AI». Chi ha l'AI le apre tutte e due, ma
             entrando da quella del Gestionale deve vedere il gestionale
             senza AI, cioe' SENZA la voce «Chat con AI» — se no le due porte portano
             nello stesso identico posto e la parola «Gestionale AI» non vuol
             dire niente. Il piano non si tocca: si spegne solo la voce. */
          var daPortaPremium=(new URLSearchParams(location.search).get('piano')==='premium');
          window._chatPro=haChatPro(row) && !daPortaPremium;
          /* ⛔ 30 agosto 2026 — L'ASSAGGIO.
             Chi non ha il Gestionale AI vede lo stesso la voce «Chat con AI»
             e puo' scrivere 10 messaggi in tutto: se non la vede, non
             comprera' mai un piano che costa 100 euro l'anno in piu'.
             ⚠️ Non dalla porta del
       Gestionale: da li' si entra nel gestionale
             senza AI, ed e' quello il senso di avere due porte. */
          window._chatAssaggio=(!haChatPro(row)) && !daPortaPremium;
          registraAccesso(gc,s.user.id,window._gestEmail,ammesso(window._gestEmail)&&ok);
          /* 1 ottobre 2026 — il profilo minimo: SOLO per chi ha gia' diritto di
             entrare, e solo con l'interruttore acceso o con ?profilo=prova.
             Con l'interruttore spento questo ramo non si apre mai e il
             cancello fa esattamente quello di prima. */
          var provaProfilo=(new URLSearchParams(location.search).get('profilo')==='prova');
          if(ok && (PROFILO_MINIMO_ATTIVO||provaProfilo)){
            controllaProfilo(gc,s.user.id,provaProfilo).then(function(esito){ decidi(window._gestEmail,esito); });
          }else{
            decidi(window._gestEmail, ok?'ok':'premium');
          }
        },function(){
          /* la lettura non e' riuscita: si riprova, e se non va nemmeno la
             seconda volta si resta FUORI dicendolo (prima qui si entrava) */
          if(tentativi<2){ prova(); return; }
          clearTimeout(timer);
          decidi(window._gestEmail||'','lento');
        });
      },function(){
        if(tentativi<2){ prova(); return; }
        clearTimeout(timer);
        decidi('','lento');
      });
    }
    prova();
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}
})();
})();
