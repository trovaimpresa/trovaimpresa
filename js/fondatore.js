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
  /* ⛔ 19 SETTEMBRE 2026 — DA 15 CONTROLLI A 149, CON UNA DOMANDA SOLA.
     Prima qui c'erano 15 prove scritte a mano, ognuna con la sua domanda al
     database: 15 domande, e coprivano 13 file sql su 37. Gli altri 24 non li
     guardava nessuno.
     Adesso l'elenco e' completo e la domanda e' UNA: il browser manda quello
     che si aspetta, il database (funzione gest_schema_mancanti, in
     sql/controllo-aggiornamenti.sql) risponde con quello che manca. Se non
     manca niente risponde zero righe.
     Costa meno di prima e controlla sei volte piu' roba.

     COME SI LEGGE L'ELENCO — tre forme, una regola:
       tabella.colonna   una colonna dentro una tabella o una vista
       nome              una tabella oppure una vista
       nome()            una funzione del database

     QUANDO SI AGGIORNA: il giorno che scrivo un file sql nuovo, aggiungo qui
     la sua riga. E' l'unico posto da toccare.

     ⛔ DUE COSE NON CI SONO APPOSTA, e non vanno rimesse:
        gest_note.eliminato_il  — tolta il 9/8/2026 (il cestino rompeva il
          salvataggio delle note del calendario: il motivo sta scritto per
          esteso in js/cestino.js);
        nol_mezzi.eliminato_il  — quella tabella non esiste piu' dal 4/9/2026,
          l'anagrafica dei mezzi e' una sola (sql/mezzi-una-lista-sola.sql).
     Sono gli unici due buchi del 19 settembre, e sono voluti.

     ⚠️ NON SI SCRIVE PIU' A MANO. Il controllo prima di pubblicare
        (tools/controllo-push.js, punto 8) legge la cartella sql/ e ferma
        il push se qui manca un file che il gestionale nomina. Cosi' il
        giorno che me ne dimentico non lo scopro da un iscritto.

     ⚠️ COSTA ZERO A CHI NON SONO IO. Sta in questo file apposta:
        fondatore.js esce subito per chiunque non sia nell'elenco AMMESSI,
        quindi per gli iscritti questa domanda non esiste.
     ⚠️ PARTE DOPO, non all'apertura: il 18 settembre abbiamo tolto 28
        domande dall'avvio, non se ne rimettono dalla porta di servizio.
     ⚠️ SI GUARDA IL NOME, NON IL VALORE. Una colonna che esiste ma e'
        vuota e' legittima; una che non esiste e' un aggiornamento mancante. */
  var PROVE = {
    "aggiungi-commercialista.sql":      "gest_azienda.comm_studio gest_azienda.comm_nome gest_azienda.comm_tel gest_azienda.comm_email gest_azienda.comm_pec gest_azienda.comm_note",
    "chat-avvisi.sql":                  "chat_avvisi",
    "capitolo-costi-sicurezza.sql":     "gest_computo_capitoli.sicurezza gest_computo_totali",
    "controllo-aggiornamenti.sql":      "gest_schema_mancanti()",
    "gest-analisi-arrotondamento.sql":  "gest_analisi_righe_calc gest_analisi_totali",
    "gest-analisi-prezzi.sql":          "gest_computo_voci.an_spese_perc gest_computo_voci.an_utile_perc gest_analisi_righe gest_analisi_totali gest_computo_voci_calc",
    "gest-azienda-polizza.sql":         "gest_azienda.pol_compagnia gest_azienda.pol_numero gest_azienda.pol_massimale gest_azienda.pol_scadenza",
    "gest-azienda-tariffa-oraria.sql":  "gest_azienda.tariffa_oraria",
    "gest-cestino-elimina.sql":         "_gest_cascata() gest_cestino_elimina()",
    "gest-cestino.sql":                 "gest_lavori.eliminato_il gest_clienti.eliminato_il gest_preventivi.eliminato_il gest_fatture.eliminato_il gest_scadenze.eliminato_il gest_mestieri.eliminato_il gest_mezzi.eliminato_il gest_operatori.eliminato_il gest_carte.eliminato_il gest_fornitori.eliminato_il gest_fatture_fornitori.eliminato_il gest_spese.eliminato_il gest_ore.eliminato_il gest_crediti.eliminato_il gest_foto.eliminato_il gest_video.eliminato_il gest_mezzi_scadenze",
    "gest-computo-cronoprogramma.sql":  "gest_computi.data_inizio gest_computo_capitoli.giorni gest_computo_capitoli.insieme",
    "gest-computo-metrico.sql":         "gest_computi.preventivo_id gest_computi.ribasso_perc gest_computi.prezzario gest_computi.prezzario_anno gest_computo_voci.incidenza_manodopera gest_computo_voci.oneri_sicurezza gest_prezzi_propri.incidenza_manodopera gest_prezzi_propri.fonte gest_computi gest_computo_capitoli gest_computo_voci gest_computo_misure gest_prezzi_propri gest_computo_voci_calc gest_computo_totali",
    "gest-computo-quadro.sql":          "gest_computi.quadro_economico",
    "gest-computo-variante.sql":        "gest_computi.variante_di gest_computo_voci.origine_id",
    "gest-fattura-cassa.sql":           "gest_fatture.cassa_perc gest_fatture.cassa_tipo gest_fatture.spese",
    "gest-fornitori-plus.sql":          "gest_fornitori.trovaimpresa_id gest_foto.fornitore_id",
    "gest-fornitori.sql":               "gest_fornitori gest_fatture_fornitori",
    "gest-ore-e-crediti.sql":           "gest_azienda.cfp_obiettivo gest_ore gest_crediti",
    "gest-parcella-professionisti.sql": "gest_preventivi.cassa_perc gest_preventivi.iva_perc gest_preventivi.ritenuta gest_preventivi.ritenuta_perc gest_preventivi.spese_forfait",
    "gest-permessi-collaboratori.sql":  "gest_puo_sezione()",
    "gest-pratiche-professionisti.sql": "gest_lavori.pratica_tipo gest_lavori.pratica_protocollo gest_lavori.pratica_comune gest_lavori.pratica_data_dep gest_lavori.pratica_stato gest_lavori.catasto_foglio gest_lavori.catasto_particella gest_lavori.catasto_sub",
    "gest-preventivo-sezioni.sql":      "gest_preventivo_righe.sezione",
    "gest-rapportini-cestino.sql":      "gest_rapportino_cestina()",
    "gest-rapportini.sql":              "gest_ore.rapportino_id gest_rapportini",
    "gest-sal-fattura.sql":             "gest_sal.fattura_id",
    "gest-sal.sql":                     "gest_sal gest_sal_righe gest_sal_righe_calc gest_sal_totali",
    "gest-scelte.sql":                  "gest_scelte gest_scelte_link gest_scelte_controlla_lavoro()",
    "gest-scadenze-pratiche.sql":       "gest_scadenze.lavoro_id gest_scadenze.avvisi gest_scadenze.avvisa",
    "gest-scadenze-ripeti.sql":         "gest_scadenze.ripeti_mesi",
    "gest-squadra-nomi.sql":            "gest_squadra_nomi",
    "gest-variante-origine-vista.sql":  "gest_computo_voci_calc",
    "gestionale-mezzi.sql":             "gest_scadenze.mezzo_id gest_mezzi gest_lavoro_mezzi gest_mezzi_scadenze",
    "mezzi-una-lista-sola.sql":         "gest_mezzi.noleggiabile gest_mezzi.codice gest_mezzi.tariffa_ora gest_mezzi.tariffa_giorno gest_mezzi.tariffa_settimana gest_mezzi.tariffa_mese gest_mezzi.ore_incluse_giorno gest_mezzi.tariffa_ora_extra gest_mezzi.km_inclusi_giorno gest_mezzi.tariffa_km gest_mezzi.usura_fissa gest_mezzi.usura_percento gest_mezzi.cauzione gest_mezzi.ha_contaore gest_mezzi.ha_contakm gest_mezzi.verifica_ultima gest_mezzi.verifica_mesi gest_mezzi.verifica_ente gest_mezzi.assicurazione_scad gest_mezzi.revisione_scad gest_mezzi.collaudo_scad gest_mezzi.tagliando_ogni_ore gest_mezzi.tagliando_ultimo_ore gest_mezzi.contaore_attuale gest_mezzi.fuori_servizio gest_mezzi.fuori_servizio_perche gest_mezzi.manutenzione_note gest_mezzi_scadenze",
    "neg-preventivi-cestino.sql":       "neg_preventivi.eliminato_il",
    "noleggio-cestino.sql":             "nol_clienti.eliminato_il nol_noleggi.eliminato_il neg_prodotti.eliminato_il neg_fornitori.eliminato_il neg_movimenti.eliminato_il",
    "noleggio-fatture.sql":             "nol_noleggi.fattura_id gest_azienda.num_fattura nol_fatture",
    "noleggio-foto-video.sql":          "nol_media",
    "prezzi-e-galleria.sql":            "prezzi_impresa galleria_lavori",
    "promemoria-sezione.sql":           "promemoria.ora promemoria.note promemoria.avvisa_giorni promemoria.ripeti_mesi promemoria.stato promemoria.eliminato_il",
    "supporto-origine.sql":             "supporto_messaggi.origine"
  };

  /* l'elenco scritto sopra, tradotto in quello che la funzione del database
     sa leggere. Si costruisce qui una volta sola. */
  function _attese(){
    var fuori = [];
    Object.keys(PROVE).forEach(function(file){
      PROVE[file].split(/\s+/).forEach(function(v){
        if(!v) return;
        if(v.slice(-2) === "()"){
          fuori.push({k:"funzione", f:file, t:v.slice(0,-2), c:null});
        }else if(v.indexOf(".") > 0){
          var due = v.split(".");
          fuori.push({k:"colonna", f:file, t:due[0], c:due[1]});
        }else{
          fuori.push({k:"tabella", f:file, t:v, c:null});
        }
      });
    });
    return fuori;
  }

  function controllaDatabase(sb){
    var attese = _attese();
    sb.rpc("gest_schema_mancanti", {attese: attese}).then(function(r){
      if(r && r.error){
        /* la funzione stessa non c'e' ancora: e' il primo aggiornamento da fare */
        console.warn("[fondatore] il controllo non ha potuto girare:", r.error.message,
                     "\u2014 esegui sql/controllo-aggiornamenti.sql su Supabase");
        esito([{file:"controllo-aggiornamenti.sql", oggetto:"gest_schema_mancanti()"}], attese.length);
        return;
      }
      esito((r && r.data) || [], attese.length);
    }, function(e){
      console.warn("[fondatore] il controllo non ha potuto girare:", e);
    });
  }

  function esito(mancano, quanti){
    if(!mancano.length){
      console.log("[fondatore] aggiornamenti del database: tutti a posto ("
                  + quanti + " controllati, " + Object.keys(PROVE).length + " file sql)");
      return;
    }
    /* raggruppati per file sql: uno stesso file puo' aver dato due buchi */
    var files = [];
    mancano.forEach(function(m){ if(files.indexOf(m.file) < 0) files.push(m.file); });
    console.warn("[fondatore] AGGIORNAMENTI DEL DATABASE MANCANTI:", files.join(", "),
                 "\u2014 dettaglio:", mancano.map(function(m){ return m.oggetto; }).join(" \u00b7 "));
    var barra = document.getElementById("ti-fondatore");
    if(!barra) return;
    var d = document.createElement("div");
    d.id = "ti-db-manca";
    d.style.cssText = "background:#b3261e;color:#fff;padding:8px 12px;font-size:14px;font-weight:600";
    d.textContent = "\u26d4 Database indietro: manca " + files.join(", ")
      + ". Nel gestionale ci sono pezzi spenti finch\u00e9 non li esegui su Supabase."
      + " Il dettaglio \u00e8 in F12 \u2192 Console, riga [fondatore].";
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
