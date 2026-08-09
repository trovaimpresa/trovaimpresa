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
  var SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic";

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

  function leggiVista(){ try{ return sessionStorage.getItem(CHIAVE_VISTA)||""; }catch(e){ return ""; } }
  function scriviVista(v){ try{ v?sessionStorage.setItem(CHIAVE_VISTA,v):sessionStorage.removeItem(CHIAVE_VISTA); }catch(e){} }

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
      + '#ti-fondatore .ti-tag{font-weight:800;letter-spacing:.03em;background:#7b1fa2;padding:4px 10px;border-radius:999px;font-size:12px;white-space:nowrap}'
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
      + '@media(max-width:760px){#ti-fondatore .ti-in{gap:6px;padding:6px 8px}#ti-fondatore a{padding:4px 7px;font-size:13px}}';
    document.head.appendChild(css);

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
      +   '<button class="ti-x" id="ti-chiudi" title="Nascondi fino al prossimo caricamento">&times;</button>'
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
          if(document.readyState==="loading"){
            document.addEventListener("DOMContentLoaded", function(){ disegna(sb,p,email); });
          }else{
            disegna(sb,p,email);
          }
        });
    }).catch(function(){});
  }

  attendiSupabase(avvia);
})();
