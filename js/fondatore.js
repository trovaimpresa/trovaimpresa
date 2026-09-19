/* ============================================================
   BARRA DEL FONDATORE — TrovaImpresa (agosto 2026)

   Compare SOLO alle email elencate in AMMESSI. Per tutti gli altri
   questo file non fa assolutamente nulla: non disegna niente, non
   scrive niente, non rallenta la pagina.

   A cosa serve: provare il sito senza doversi fare un account finto
   per ogni categoria.
     - "Vedi come"  -> cambia la CATEGORIA mostrata (impresa/artigiano/
                       professionista). È solo una vista: i dati restano
                       i tuoi. Vale per il gestionale.
     - "Piano"      -> cambia DAVVERO il piano del tuo profilo nel
                       database (free <-> premium), così vedi il
                       comportamento vero su tutto il sito, ricerca
                       compresa. È reversibile con un altro clic.
     - Link rapidi  -> tutte le pagine di lavoro a portata di clic.

   Per aggiungere una pagina alla barra: aggiungi una riga in LINKS.
   Per far comparire la barra su un'altra pagina: metti
   <script src="/js/fondatore.js"></script> prima di </body>.
   ============================================================ */
(function(){
  "use strict";

  var AMMESSI = ["pintoalessio@icloud.com"];   /* aggiungi altre email fra apici, separate da virgola */

  var SU = "https://nacvrsgkyfavykxjxszu.supabase.co";
  var SK = "sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";

  var LINKS = [
    {t:"Gestionale",   u:"/gestionale-app.html"},
    {t:"Negozio",      u:"/gestionale-negozio.html"},
    {t:"Noleggio",     u:"/gestionale-noleggio.html"},
    {t:"App operaio",  u:"/gestionale-operatore.html"},
    {t:"Pannello",     u:"/pannello-impresa.html"},
    {t:"Admin",        u:"/admin.html"},
    {t:"Chi lo usa",   u:"/admin-utilizzo.html"},
    {t:"Sito",         u:"/index.html"}
  ];

  var CATEGORIE = [
    {v:"",               t:"Vedi come: come sono io"},
    {v:"impresa",        t:"Vedi come: Impresa"},
    {v:"artigiano",      t:"Vedi come: Artigiano"},
    {v:"professionista", t:"Vedi come: Professionista"},
    {v:"negozio",        t:"Vedi come: Negozio"}
  ];

  var CHIAVE_VISTA = "ti_vedi_tipo";
  var CHIAVE_CHIUSA = "ti_barra_chiusa";   /* la X adesso si ricorda: la barra resta chiusa finché non la riapri dalla linguetta */

  function leggiVista(){ try{ return sessionStorage.getItem(CHIAVE_VISTA)||""; }catch(e){ return ""; } }
  function scriviVista(v){ try{ v?sessionStorage.setItem(CHIAVE_VISTA,v):sessionStorage.removeItem(CHIAVE_VISTA); }catch(e){} }
  function barraChiusa(){ try{ return localStorage.getItem(CHIAVE_CHIUSA)==="1"; }catch(e){ return false; } }
  function scriviChiusa(v){ try{ v?localStorage.setItem(CHIAVE_CHIUSA,"1"):localStorage.removeItem(CHIAVE_CHIUSA); }catch(e){} }

  function ammesso(email){
    var e = String(email||"").trim().toLowerCase();
    for(var i=0;i<AMMESSI.length;i++){ if(AMMESSI[i].trim().toLowerCase()===e) return true; }
    return false;
  }

  function attendiSupabase(fn,tentativi){
    tentativi = tentativi||0;
    if(window.supabase && window.supabase.createClient) return fn();
    if(tentativi>40) return;                       /* ~8 secondi, poi lascia perdere */
    setTimeout(function(){ attendiSupabase(fn,tentativi+1); },200);
  }

  function disegna(sb, profilo, email){
    if(document.getElementById("ti-fondatore")) return;

    var premium = String((profilo&&profilo.piano)||"").toLowerCase()==="premium";
    var vista   = leggiVista();

    var css = document.createElement("style");
    css.textContent = ''
      + '#ti-fondatore{position:fixed;top:0;left:0;right:0;z-index:2147483000;'
      + 'background:#0a2a4d;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;'
      + 'font-size:14px;line-height:1.4;box-shadow:0 2px 10px rgba(0,0,0,.25)}'
      + '#ti-fondatore .ti-in{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:7px 12px}'
      + '#ti-fondatore .ti-tag{font-weight:800;letter-spacing:.03em;background:#7b1fa2;padding:4px 10px;border-radius:999px;font-size:13px;white-space:nowrap}'
      + '#ti-fondatore select{font-family:inherit;font-size:14px;font-weight:600;padding:6px 10px;border-radius:8px;border:none;background:#12395f;color:#fff;cursor:pointer}'
      + '#ti-fondatore button{font-family:inherit;font-size:14px;font-weight:700;padding:6px 12px;border-radius:8px;border:none;cursor:pointer}'
      + '#ti-fondatore .ti-piano{background:#fff;color:#0a2a4d}'
      + '#ti-fondatore .ti-piano.on{background:#7b1fa2;color:#fff}'
      + '#ti-fondatore a{color:#cfe2ff;text-decoration:none;padding:5px 9px;border-radius:7px;white-space:nowrap}'
      + '#ti-fondatore a:hover{background:#12395f;color:#fff}'
      + '#ti-fondatore a.qui{background:#12395f;color:#fff;font-weight:700}'
      + '#ti-fondatore .ti-sep{flex:1 1 auto}'
      + '#ti-fondatore .ti-x{background:none;color:#9fb6d0;font-size:18px;padding:2px 8px}'
      + '#ti-fondatore .ti-links{display:flex;flex-wrap:wrap;gap:2px;align-items:center}'
      /* Sul telefono: UNA riga sola che si fa scorrere col dito, invece di
         andare a capo sei volte e mangiarsi un terzo dello schermo.
         La X sta ferma a destra, sopra tutto, sempre raggiungibile. */
      + '@media(max-width:760px){'
      +   '#ti-fondatore .ti-in{gap:6px;padding:6px 46px 6px 8px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch}'
      +   '#ti-fondatore .ti-links{flex-wrap:nowrap}'
      +   '#ti-fondatore .ti-sep{display:none}'
      +   '#ti-fondatore a{padding:4px 7px;font-size:13px}'
      +   '#ti-fondatore .ti-x{position:absolute;top:0;right:0;bottom:0;background:#0a2a4d;padding:0 12px;font-size:20px;box-shadow:-6px 0 8px rgba(10,42,77,.9)}'
      + '}'
      /* La linguetta per riaprire la barra quando è chiusa: bordo sinistro, a metà schermo */
      + '#ti-riapri{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2147483000;'
      + 'background:#7b1fa2;color:#fff;border:none;border-radius:0 10px 10px 0;padding:14px 9px;'
      + 'font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:14px;font-weight:800;'
      + 'cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}';
    document.head.appendChild(css);

    /* Se l'ultima volta hai premuto la X, la barra resta chiusa: compare solo
       la linguetta viola sul bordo sinistro, che la riapre con un tocco. */
    if(barraChiusa()){ linguetta(); } else { apriBarra(); }

    function linguetta(){
      if(document.getElementById("ti-riapri")) return;
      var b = document.createElement("button");
      b.id = "ti-riapri";
      b.textContent = "F";
      b.title = "Riapri la barra del fondatore";
      b.onclick = function(){ scriviChiusa(false); b.remove(); apriBarra(); };
      document.body.appendChild(b);
    }

    function apriBarra(){
    if(document.getElementById("ti-fondatore")) return;
    var qui = location.pathname.replace(/\/$/,"") || "/index.html";
    var bar = document.createElement("div");
    bar.id = "ti-fondatore";
    bar.innerHTML = ''
      + '<div class="ti-in">'
      +   '<span class="ti-tag">FONDATORE</span>'
      +   '<select id="ti-vista">'
      +     CATEGORIE.map(function(c){
              return '<option value="'+c.v+'"'+(c.v===vista?' selected':'')+'>'+c.t+'</option>';
            }).join("")
      +   '</select>'
      +   '<button class="ti-piano'+(premium?' on':'')+'" id="ti-piano">'
      +     (premium?'Piano: PREMIUM':'Piano: Free')
      +   '</button>'
      +   '<span class="ti-links">'
      +     LINKS.map(function(l){
              var attivo = qui===l.u || qui===l.u.replace(".html","");
              return '<a href="'+l.u+'"'+(attivo?' class="qui"':'')+'>'+l.t+'</a>';
            }).join("")
      +   '</span>'
      +   '<span class="ti-sep"></span>'
      +   '<button class="ti-x" id="ti-chiudi" title="Nascondi la barra (la riapri dalla linguetta viola a sinistra)">&times;</button>'
      + '</div>';
    document.body.appendChild(bar);

    /* spinge giu' la pagina, così la barra non copre niente */
    function spazio(){
      document.body.style.paddingTop = bar.offsetHeight + "px";
    }
    spazio();
    window.addEventListener("resize", spazio);

    document.getElementById("ti-chiudi").onclick = function(){
      bar.remove(); document.body.style.paddingTop = "";
      window.removeEventListener("resize", spazio);
      scriviChiusa(true);        /* si ricorda: al prossimo caricamento resta chiusa */
      linguetta();               /* e la linguetta per riaprirla è già lì */
    };

    document.getElementById("ti-vista").onchange = function(){
      scriviVista(this.value);
      location.reload();
    };

    document.getElementById("ti-piano").onclick = function(){
      var b = this, nuovo = premium ? "free" : "premium";
      if(!confirm("Cambio il tuo piano in "+nuovo.toUpperCase()+"?\n\nE' una modifica vera sul tuo profilo, la puoi rifare al contrario quando vuoi.")) return;
      b.disabled = true; b.textContent = "Un attimo…";
      var patch = {piano:nuovo};
      if(nuovo==="free") patch.premium_scadenza = null;
      sb.from("imprese").update(patch).eq("user_id",profilo.user_id).select("id")
        .then(function(r){
          if(r.error) throw r.error;
          if(!r.data || !r.data.length) throw new Error("nessuna riga aggiornata");
          location.reload();
        })
        .catch(function(e){
          b.disabled = false; b.textContent = premium?"Piano: PREMIUM":"Piano: Free";
          alert("Non sono riuscito a cambiare il piano: "+((e&&e.message)||"riprova"));
        });
    };
    }   /* fine apriBarra */
  }

  /* ============================================================
     19 settembre 2026 \u2014 IL CONTROLLO DEGLI AGGIORNAMENTI DEL DATABASE
     ============================================================
     Nel gestionale ci sono una trentina di messaggi del tipo \u00abesegui
     sql/qualcosa.sql su Supabase\u00bb. Sono scritti per me, ma li legge
     l'iscritto: lo mandano in un posto dove non pu\u00f2 entrare.

     Il punto vero per\u00f2 \u00e8 un altro. Il database \u00e8 UNO SOLO per tutti:
     se un aggiornamento \u00e8 fatto, \u00e8 fatto per tutti; se manca, \u00e8 rotto
     per tutti. Controllati il 19 settembre: c'erano tutti e 11.
     Quindi oggi quei messaggi non li vede nessuno.

     Il giorno che aggiungo una funzione e mi DIMENTICO di eseguire il
     suo file sql, per\u00f2, compaiono davvero \u2014 e io non lo so finch\u00e9 non
     me lo dice un iscritto. Questo controllo serve a quello: lo scopro
     io in tre secondi, non lui dopo tre settimane.

     \u26a0\ufe0f COSTA ZERO A CHI NON SONO IO. Sta in questo file apposta:
        fondatore.js esce subito per chiunque non sia nell'elenco
        AMMESSI, quindi per gli iscritti queste letture non esistono.
     \u26a0\ufe0f PARTE DOPO, non all'apertura: aspetta che la pagina abbia
        finito le sue cose. Ieri abbiamo tolto 28 domande dall'avvio,
        non se ne rimettono 11 dalla porta di servizio.
     \u26a0\ufe0f SI GUARDA LA COLONNA, NON IL VALORE. Una colonna che esiste ma
        \u00e8 vuota \u00e8 legittima; una che non esiste \u00e8 un aggiornamento
        mancante. Per aggiungerne una: una riga in PROVE. */
  var PROVE = [
    {sql:"gest-cestino.sql",                 t:"gest_lavori",              c:"id,eliminato_il"},
    {sql:"gest-cestino.sql",                 t:"promemoria",               c:"id,eliminato_il"},
    {sql:"gest-computo-metrico.sql",         t:"gest_computo_voci",        c:"id"},
    {sql:"gest-computo-quadro.sql",          t:"gest_computi",             c:"id,quadro_economico"},
    {sql:"gest-computo-cronoprogramma.sql",  t:"gest_computi",             c:"id,data_inizio"},
    {sql:"gest-computo-cronoprogramma.sql",  t:"gest_computo_capitoli",    c:"id,giorni,insieme"},
    {sql:"gest-computo-variante.sql",        t:"gest_computi",             c:"id,variante_di"},
    {sql:"gest-analisi-prezzi.sql",          t:"gest_computo_voci_calc",   c:"id,prezzo_da_analisi"},
    {sql:"capitolo-costi-sicurezza.sql",     t:"gest_computo_capitoli",    c:"id,sicurezza"},
    {sql:"gest-sal.sql",                     t:"gest_sal",                 c:"id"},
    {sql:"gest-sal-fattura.sql",             t:"gest_sal",                 c:"id,fattura_id"},
    {sql:"gest-rapportini-cestino.sql",      t:"gest_rapportini",          c:"id,eliminato_il"},
    {sql:"gest-ore-e-crediti.sql",           t:"gest_crediti",             c:"id"},
    {sql:"gest-preventivo-sezioni.sql",      t:"gest_preventivo_righe",    c:"id,sezione"},
    {sql:"gest-fattura-cassa.sql",           t:"gest_fatture",             c:"id,cassa_perc,cassa_tipo"}
  ];
  function controllaDatabase(sb){
    var mancano = [];
    var fatte = 0;
    PROVE.forEach(function(p){
      sb.from(p.t).select(p.c).limit(1).then(function(r){
        if(r && r.error) mancano.push(p);
        if(++fatte === PROVE.length) esito(mancano);
      }, function(){ if(++fatte === PROVE.length) esito(mancano); });
    });
  }
  function esito(mancano){
    if(!mancano.length){
      console.log("[fondatore] aggiornamenti del database: tutti a posto ("+PROVE.length+" controllati)");
      return;
    }
    /* raggruppati per file sql: uno stesso file pu\u00f2 aver dato due buchi */
    var files = [];
    mancano.forEach(function(m){ if(files.indexOf(m.sql)<0) files.push(m.sql); });
    console.warn("[fondatore] AGGIORNAMENTI DEL DATABASE MANCANTI:", files.join(", "),
                 "\u2014 dettaglio:", mancano.map(function(m){return m.t+"("+m.c+")";}).join(" \u00b7 "));
    var barra = document.getElementById("ti-fondatore");
    if(!barra) return;
    var d = document.createElement("div");
    d.id = "ti-db-manca";
    d.style.cssText = "background:#b3261e;color:#fff;padding:8px 12px;font-size:14px;font-weight:600";
    d.textContent = "\u26d4 Database indietro: manca " + files.join(", ")
      + ". Nel gestionale ci sono pezzi spenti finch\u00e9 non li esegui su Supabase.";
    barra.appendChild(d);
  }

  function avvia(){
    var sb;
    try{ sb = window.supabase.createClient(SU,SK); }catch(e){ return; }
    sb.auth.getSession().then(function(r){
      var s = r && r.data && r.data.session;
      if(!s) return;
      var email = s.user.email || "";
      if(!ammesso(email)) return;                  /* non sei tu: la barra non esiste */
      sb.from("imprese").select("user_id,piano,tipo,nome_attivita").eq("user_id",s.user.id).maybeSingle()
        .then(function(res){
          var p = (res && res.data) || {user_id:s.user.id, piano:"free", tipo:null};
          var _poi = function(){
            disegna(sb,p,email);
            /* il controllo del database parte DOPO, a pagina finita: non
               deve rubare niente all'apertura del gestionale */
            setTimeout(function(){ try{ controllaDatabase(sb); }catch(e){} }, 6000);
          };
          if(document.readyState==="loading"){
            document.addEventListener("DOMContentLoaded", _poi);
          }else{
            _poi();
          }
        });
    }).catch(function(){});
  }

  attendiSupabase(avvia);
})();
