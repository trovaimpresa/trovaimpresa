/* ============================================================
   IL CANCELLO DEL GESTIONALE — 23 agosto 2026

   Fino a oggi questa schermata viveva DENTRO gestionale-app.html, e
   basta: gestionale-noleggio.html non ne aveva nessuna. Chi si scriveva
   l'indirizzo del noleggio a mano entrava, senza login e senza Premium.
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
        Quando sar&agrave; pronto entrer&agrave; nel piano <b>Premium</b>, insieme alla vetrina
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
      <p id="gate-paywall-titolo" style="margin:0 0 14px;font-size:20px;font-weight:800;line-height:1.4;">Il Gestionale &egrave; incluso nel piano Premium</p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;">Cantieri, squadra, preventivi PDF, fatture, agenda, scadenze fiscali e mezzi: tutto in un unico posto.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">Con il <strong>Premium</strong> lo sblocchi insieme a tutto il resto: <strong>5&euro; al mese</strong> oppure <strong>49&euro; l&rsquo;anno</strong>.</p>
      <div id="gate-btns">
        <a href="/info-premium.html" style="display:block;text-align:center;text-decoration:none;width:100%;padding:16px;margin-bottom:10px;border-radius:10px;background:var(--blu,#0066ff);color:#fff;font-size:17px;font-weight:700;">Scopri il Premium</a>
        <a href="/prezzi.html" style="display:block;text-align:center;text-decoration:none;width:100%;padding:16px;border-radius:10px;background:var(--sfondo,#f3f5f2);color:var(--testo,#1c2b36);font-size:16px;font-weight:700;">Vedi tutti i piani</a>
      </div>
      <p style="margin:18px 0 0;font-size:14px;color:var(--testo-3,#7a848f);text-align:center;line-height:1.6;">Pagamento sicuro con Stripe &middot; disdici quando vuoi</p>
      <p style="margin:14px 0 0;font-size:15px;text-align:center;line-height:1.6;">Hai gi&agrave; il Premium? <a href="/login-impresa.html" style="color:var(--blu,#0066ff);font-weight:700;text-decoration:none;">Accedi</a></p>
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
  var SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic";
  var RETURN=location.origin+location.pathname;
  function q(id){return document.getElementById(id);}
  /* ===== MANUTENZIONE =====
     Se true, il gestionale è chiuso a tutti tranne le email in AMMESSI.
     Rimessa a false il 6 agosto 2026: aperto ai Premium.
     ⛔ RIMESSA A TRUE IL 20 AGOSTO 2026, deciso da Alessio:
        «prima si costruisce la casa poi si vende».
        Il gestionale si finisce con calma e si apre quando vale i soldi
        che si chiedono, non prima. Per riaprirlo: rimettere false —
        ma prima ricontrollare il testo della schermata qui sotto. */
  var MANUTENZIONE = true;
  var AMMESSI = ['pintoalessio@icloud.com'];   /* aggiungi qui altre email fra apici, separate da virgola */

  /* ===== CHI PUO' ENTRARE — 6 agosto 2026 =====
     Il gestionale è incluso nel piano Premium (5 euro/mese o 49 euro/anno).
     Chi è Free vede la schermata che spiega come sbloccarlo.
     Il blocco sulla card del pannello resta: questo chiude l'accesso diretto
     di chi si scrive l'indirizzo a mano.
     NOTA: è un blocco lato pagina. I dati restano comunque protetti da RLS
     su Supabase: ognuno vede solo i propri. */
  function haPremium(row){
    if(!row) return false;
    var piano = String(row.piano||'').trim().toLowerCase();
    if(piano !== 'premium') return false;
    /* se c'e' una scadenza ed è passata, non è più Premium */
    if(row.premium_scadenza){
      var scad = new Date(row.premium_scadenza);
      if(!isNaN(scad.getTime()) && scad.getTime() < Date.now()) return false;
    }
    return true;
  }

  /* ⛔ 22 agosto 2026 — le schermate si spengono a vicenda da un ELENCO SOLO.
     Prima ognuna spegneva le altre a mano: con la quarta (gate-lento)
     dimenticarne una avrebbe lasciato due schermate una sopra l'altra. */
  var GATE_SCHERMATE=['gate-checking','gate-paywall','gate-manutenzione','gate-lento'];
  function gateMostra(quale){
    q('gate-gestionale').style.display='flex';
    GATE_SCHERMATE.forEach(function(id){ var e=q(id); if(e)e.style.display=(id===quale?'block':'none'); });
    document.body.style.overflow='hidden';
  }
  function showChecking(t){gateMostra('gate-checking');q('gate-checking').textContent=t;}
  function showPaywall(){gateMostra('gate-paywall');}
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
  window.attivaGestionale=function(piano){
    var b=q('gate-btns');b.style.opacity='0.5';b.style.pointerEvents='none';
    fetch('/.netlify/functions/crea-checkout-gestionale',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({piano:piano,email:window._gestEmail||'',returnUrl:RETURN})})
      .then(function(r){return r.json();})
      .then(function(d){if(d&&d.url){location.href=d.url;}else{alert('Errore: '+((d&&d.error)||'riprova'));b.style.opacity='1';b.style.pointerEvents='auto';}})
      .catch(function(){alert('Errore di rete, riprova.');b.style.opacity='1';b.style.pointerEvents='auto';});
  };
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
    if(!window.supabase){return setTimeout(start,200);}
    var gc=window.supabase.createClient(SU,SK);
    window._gc=gc;
    showChecking('Apertura del gestionale…');
    var deciso=false;
    var chiave=(new URLSearchParams(location.search).get('chiave')==='apri');
    /* esito: 'ok' entra · 'manutenzione' · 'premium' mostra il Premium ·
              'lento' non si e' riuscito a verificare */
    var decidi=function(email,esito){
      if(deciso)return; deciso=true;
      if(chiave){hideGate();return;}                       /* scorciatoia per Alessio */
      if(esito==='lento'){showLento();return;}             /* nel dubbio, FUORI */
      if(!ammesso(email)){showManutenzione();return;}
      if(esito==='premium'){showPaywall();return;}
      hideGate();
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
        /* senza login non si entra: si vede la schermata del Premium col link per accedere */
        if(!s){clearTimeout(timer);decidi('','premium');return;}
        window._gestUid=s.user.id;
        gc.from('imprese').select('email, piano, premium_scadenza').eq('user_id',s.user.id).maybeSingle().then(function(res){
          /* ⚠️ Supabase non lancia: l'errore torna DENTRO la risposta. Senza
             questa riga una lettura rifiutata passava per «nessuna riga»,
             cioe' per «non e' Premium»: colpa data al piano invece che alla
             rete. */
          if(res&&res.error){ if(tentativi<2){prova();} else {clearTimeout(timer);decidi(window._gestEmail||'','lento');} return; }
          clearTimeout(timer);
          var row=res && res.data;
          window._gestEmail=(row&&row.email)||s.user.email||'';
          var ok=haPremium(row);
          window._gestPremium=ok;
          registraAccesso(gc,s.user.id,window._gestEmail,ammesso(window._gestEmail)&&ok);
          decidi(window._gestEmail, ok?'ok':'premium');
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
