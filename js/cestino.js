/* ============================================================
   IL CESTINO DEL GESTIONALE — TrovaImpresa (9 agosto 2026)

   Richiesta di Alessio: "se uno cancella per errore è meglio poter
   recuperare". Prima ogni Elimina era definitivo, e in tre casi si portava
   dietro altra roba: il reparto con tutte le sue pratiche, la carta con
   tutti i suoi movimenti, il cliente con i suoi documenti.

   COME FUNZIONA, IN UNA RIGA
   Questo file si mette in mezzo fra il gestionale e il database:
     - ogni LETTURA di una tabella "col cestino" salta le righe eliminate
     - ogni CANCELLAZIONE diventa "scrivi la data in eliminato_il"
   Il resto del gestionale non se ne accorge: non è stata cambiata nemmeno
   una delle sessanta letture sparse nei quattro pannelli. Ed è proprio il
   punto: così non se ne può dimenticare nessuna.

   PERCHE' NON SCATTA PIU' LA CATENA
   Le cancellazioni a catena sono una regola del database e scattano solo su
   una cancellazione VERA. Qui non si cancella mai niente, quindi i figli
   restano al loro posto e tornano su insieme al padre.

   COME SI USA
   Subito dopo aver creato il client Supabase:
       if (window.attivaCestino) window.attivaCestino(sb);
   Da quel momento tutto il resto del codice funziona come prima.
   Per leggere ANCHE le righe eliminate (serve solo alla sezione Cestino):
       sb.raw("gest_lavori").select("*").not("eliminato_il","is",null)

   ------------------------------------------------------------
   12 agosto 2026 — DUE BUCHI CHIUSI

   BUCO 1: un errore di rete spegneva il cestino.
   Il commento qui sotto diceva "un errore di rete non deve spegnere il
   cestino", ma il codice riprovava una volta sola e poi lo spegneva lo
   stesso. Da quel momento, per tutta la sessione, ogni Elimina tornava
   definitivo — mentre i messaggi di conferma continuavano a dire che la
   roba finiva nel cestino.
   Adesso: finché non c'e' una risposta CHIARA dal database, il cestino non
   si spegne e l'eliminazione viene BLOCCATA con un messaggio ("aspetta un
   attimo"). Si riprova da soli a 2s, 5s, 15s, 45s e poi ogni minuto.
   Non si perde niente per colpa della rete: al massimo si aspetta.

   BUCO 2: la prova di accensione guardava UNA tabella sola.
   Chiedeva a gest_lavori e da quella decideva per tutte quante. Se una
   migrazione era passata a meta', il cestino si accendeva lo stesso e su
   quelle tabelle la cancellazione restava vera, in silenzio.
   Adesso: si chiede a tutte insieme (una domanda piccolissima per tabella, sparate
   in parallelo, un solo giro di rete, una volta per sessione). Ogni tabella
   ha il suo stato:
     - la colonna c'e'      -> cestino acceso su quella tabella
     - la colonna NON c'e'  -> vedi sotto
     - non si sa ancora     -> eliminazione BLOCCATA
   Se la colonna manca su TUTTE, vuol dire che la migrazione non e'
   mai stata eseguita: il cestino resta spento come prima e il gestionale
   si comporta come sempre (meglio un cestino che non c'e' che un pannello
   bianco). Se invece manca solo su ALCUNE, la migrazione e' passata a
   meta': su quelle tabelle l'eliminazione viene BLOCCATA, perche' li' e' il
   posto dove i dati sparirebbero senza che nessuno se ne accorga.
   ------------------------------------------------------------ */
(function () {
  "use strict";

  /* Le tabelle che entrano nel cestino.
     NON ci sono le righe di preventivi e fatture: vengono cancellate e
     riscritte a ogni salvataggio, il cestino si riempirebbe di fantasmi.
     NON c'e' gest_lavoro_mezzi: è solo un collegamento, si rifa' con un clic.
     NON ci sono gest_carte_movimenti e gest_rifornimenti: alimentano due VISTE
     del database (gest_carte_saldo, gest_mezzi_carburante) che non stanno nei
     file del progetto. Nel cestino il movimento sparirebbe dall'elenco ma il
     saldo resterebbe scalato: meglio una cancellazione vera che un numero
     sbagliato sui soldi.
     NON c'e' gest_note (tolta il 9/8/2026 poche ore dopo averla messa): la nota
     del calendario si salva con un upsert su "un giorno = una nota", e un
     vincolo di unicita' PARZIALE (quello che serve al cestino) non può fare
     da arbitro a ON CONFLICT. Risultato: nessuna nota si salvava più.
     Una nota è una riga di testo: la cancellazione vera va benissimo. */
  /* 10 agosto 2026 — aggiunti gest_computi e gest_prezzi_propri.
     NON ci sono gest_computo_capitoli, gest_computo_voci e gest_computo_misure:
     sono pezzi del computo e se ne vanno con lui, come le righe di una fattura.
     Metterle qui sarebbe la trappola di gest_note: la funzione "Elimina per
     sempre" le vedrebbe come cose vive e un computo non si svuoterebbe piu'. */
  /* ⚠️ QUESTO ELENCO HA UN GEMELLO: REPARTO_CONTENUTO in gestionale-app.html
     (le tabelle che hanno la colonna mestiere_id). Una tabella che sta la' e
     non qui viene cancellata PER SEMPRE mentre il messaggio dell'utente
     promette il Cestino. Se ne aggiungi una di la', passa anche di qui. */
  /* 15 agosto 2026 — aggiunta gest_rapportini (la giornata di cantiere).
     Fino a oggi il rapportino non si poteva eliminare per niente, e nel
     pannello c'era scritto il perche': senza questa riga il pulsante avrebbe
     cancellato davvero. Adesso la riga c'e', e con lei il pulsante.
     ⚠️ Le ORE del rapportino non passano di qui: le mette via la funzione
     gest_rapportino_cestina (sql/gest-rapportini-cestino.sql), che tocca
     rapportino e ore nello stesso istante. Due scritture separate lasciavano
     scoperto il caso peggiore: rapportino sparito e ore ancora vive dentro il
     margine del lavoro. */
  var TABELLE = [
    "gest_lavori", "gest_clienti", "gest_preventivi", "gest_fatture",
    "gest_scadenze", "gest_mestieri", "gest_mezzi", "gest_operatori",
    "gest_carte",
    "gest_fornitori", "gest_fatture_fornitori", "gest_spese",
    "gest_ore", "gest_crediti", "gest_foto", "gest_video",
    "gest_computi", "gest_prezzi_propri", "gest_rapportini",
    /* 19 agosto 2026 — gli stati di avanzamento (SAL). Le loro RIGHE non
       ci vanno: sono pezzi del SAL e se ne vanno con lui, come le righe di
       una fattura (vedi la nota 3 in sql/gest-computo-metrico.sql). */
    "gest_sal",
    /* 23 agosto 2026 — le tre tabelle del noleggio e le tre del magazzino.
       La colonna «eliminato_il» e' stata aggiunta su Supabase con
       sql/noleggio-cestino.sql (risposta: 6 colonne). Prima di oggi qui
       dentro non c'erano, e tutto quello che si cancellava dal gestionale
       noleggio spariva davvero. */
    "nol_mezzi", "nol_clienti", "nol_noleggi",
    "neg_prodotti", "neg_fornitori", "neg_movimenti"
  ];

  var COL = "eliminato_il";

  /* Lo stato di OGNI tabella, non piu' uno solo per tutte:
       "attesa" = non lo sappiamo ancora (rete)   -> si blocca
       "ok"     = la colonna c'e'                 -> cestino acceso
       "manca"  = la colonna non c'e'             -> vedi migrazioneMai() */
  var stato = {};
  TABELLE.forEach(function (t) { stato[t] = "attesa"; });

  var motivo = "";             /* "", "rete", "migrazione", "migrazione-parziale" */
  var provaFatta = null;       /* promessa: si risolve al primo giro completo */
  var risolviProva = null;
  var giaRisolta = false;

  function quante(v) {
    var n = 0;
    TABELLE.forEach(function (t) { if (stato[t] === v) n++; });
    return n;
  }
  /* La migrazione non e' MAI stata eseguita: la colonna manca su tutte.
     E' il caso "installazione vecchia": il gestionale deve funzionare come
     prima, con le cancellazioni vere. */
  function migrazioneMai() { return quante("manca") === TABELLE.length; }

  /* Il cestino "e' acceso" per il resto del gestionale (messaggi di conferma,
     pulizia dei file, ecc.). E' spento SOLO quando siamo sicuri che la
     migrazione non e' mai stata fatta. In tutti gli altri casi e' acceso,
     perche' o mette davvero le cose nel cestino, o blocca: in nessuno dei due
     casi qualcosa sparisce per sempre, quindi dire "finisce nel cestino" non
     e' mai una bugia. */
  function attivo() { return !migrazioneMai(); }

  /* Su questa tabella, adesso, cosa succede se il gestionale chiama .delete()?
       "cestino" = diventa una data (soft delete)
       "vera"    = cancellazione vera (migrazione mai fatta, o tabella fuori elenco)
       "blocca"  = non si tocca niente e si avvisa */
  function cosaFa(tabella) {
    if (TABELLE.indexOf(tabella) < 0) return "vera";
    if (stato[tabella] === "ok") return "cestino";
    if (migrazioneMai()) return "vera";
    return "blocca";                     /* "attesa" oppure migrazione a meta' */
  }

  window.CESTINO_TABELLE      = TABELLE;
  window.cestinoAttivo        = function () { return attivo(); };
  window.cestinoMotivo        = function () { return motivo; };
  window.cestinoPronto        = function () { return provaFatta || Promise.resolve(false); };
  /* nuove, per chi vuole sapere di piu' (nessuno le usa ancora: non rompono niente) */
  window.cestinoTabellaAttiva = function (t) { return stato[t] === "ok"; };
  window.cestinoStato         = function () {
    return { motivo: motivo, attesa: quante("attesa"), ok: quante("ok"), manca: quante("manca"), tabelle: JSON.parse(JSON.stringify(stato)) };
  };

  /* ---- il messaggio all'utente quando un'eliminazione viene bloccata ----
     Il gestionale ha la sua funzione toast(), ma sta dentro una chiusura e da
     qui non si vede. Se un giorno diventa window.toast la usiamo; altrimenti
     ci disegnamo un avviso nostro. Testo grande e riga larga: regola dislessia. */
  var ultimoAvviso = 0;
  function avvisa(testo) {
    try {
      if (typeof window.toast === "function") { window.toast(testo); return; }
      var ora = Date.now();
      if (ora - ultimoAvviso < 1200) return;   /* niente raffiche di avvisi uguali */
      ultimoAvviso = ora;
      var d = document.getElementById("cestino-avviso");
      if (!d) {
        d = document.createElement("div");
        d.id = "cestino-avviso";
        d.setAttribute("role", "status");
        d.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);" +
          "max-width:min(560px,92vw);z-index:2147483000;background:#b3261e;color:#fff;" +
          "padding:16px 20px;border-radius:12px;font-size:17px;line-height:1.6;" +
          "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;" +
          "box-shadow:0 8px 30px rgba(0,0,0,.25);text-align:center;";
        document.body.appendChild(d);
      }
      d.textContent = testo;
      d.style.display = "block";
      clearTimeout(d.__t);
      d.__t = setTimeout(function () { d.style.display = "none"; }, 7000);
    } catch (e) { /* se anche questo fallisce, resta il messaggio dell'errore */ }
  }

  /* ---- il finto "builder" che si restituisce quando si blocca ----
     Deve comportarsi come una richiesta a Supabase: si possono attaccare
     .eq(), .select(), ecc. e alla fine si legge {data,error}. Cosi' il
     gestionale mostra il suo messaggio d'errore come fa sempre, senza che
     nessuna delle sue 75 chiamate debba essere toccata. */
  var METODI = ["select", "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is",
    "in", "not", "or", "and", "filter", "match", "contains", "containedBy",
    "overlaps", "order", "limit", "range", "abortSignal", "throwOnError", "csv", "geojson"];
  function bloccato(messaggio) {
    var risposta = { data: null, error: { message: messaggio, code: "CESTINO_BLOCCATO" }, count: null, status: 503, statusText: "Service Unavailable" };
    var b = {};
    METODI.forEach(function (m) { b[m] = function () { return b; }; });
    b.single = b.maybeSingle = function () { return b; };
    b.then = function (ok, ko) { return Promise.resolve(risposta).then(ok, ko); };
    b.catch = function (f) { return Promise.resolve(risposta).catch(f); };
    b.finally = function (f) { return Promise.resolve(risposta).finally(f); };
    return b;
  }

  window.attivaCestino = function (sb) {
    if (!sb || sb.__cestino) return sb;    /* mai due volte sullo stesso client */
    sb.__cestino = true;

    var fromOriginale = sb.from.bind(sb);
    sb.raw = fromOriginale;                /* la porta di servizio, per il Cestino */

    /* --------------------------------------------------------------
       LA PROVA: una domanda piccolissima per OGNI tabella dell'elenco,
       tutte insieme. Chiede una riga sola e una colonna sola.
       Si fa una volta per sessione; poi si riprova solo su quelle che
       non hanno risposto per colpa della rete.
       -------------------------------------------------------------- */
    function provaUna(t) {
      return fromOriginale(t).select("id").is(COL, null).limit(1)
        .then(function (r) { return { t: t, err: (r && r.error) || null }; },
              function (e) { return { t: t, err: e || { message: "rete" } }; });
    }
    function eColonnaMancante(err) {
      var m = (err && (err.message || err.details || err.hint || "")) || "";
      var c = (err && err.code) || "";
      return c === "42703" || m.indexOf(COL) >= 0 || m.indexOf("42703") >= 0;
    }
    /* "la tabella non esiste" (42P01) non e' un problema di rete: quella
       tabella non ci sara' mai, quindi non ha senso continuare a riprovare.
       La trattiamo come "manca", cosi' non blocca niente. */
    function eTabellaMancante(err) {
      var m = (err && (err.message || "")) || "";
      var c = (err && err.code) || "";
      return c === "42P01" || /does not exist|schema cache|not find the table/i.test(m);
    }

    function giro() {
      var daFare = TABELLE.filter(function (t) { return stato[t] === "attesa"; });
      if (!daFare.length) return Promise.resolve();
      return Promise.all(daFare.map(provaUna)).then(function (esiti) {
        esiti.forEach(function (e) {
          if (!e.err) { stato[e.t] = "ok"; return; }
          if (eColonnaMancante(e.err) || eTabellaMancante(e.err)) { stato[e.t] = "manca"; return; }
          /* qualsiasi altra cosa = rete/permessi: NON si decide, si riprova */
        });
        aggiornaMotivo();
      });
    }

    function aggiornaMotivo() {
      var attesa = quante("attesa"), manca = quante("manca");
      if (attesa > 0)              motivo = "rete";
      else if (migrazioneMai())    motivo = "migrazione";
      else if (manca > 0)          motivo = "migrazione-parziale";
      else                         motivo = "";

      if (motivo === "migrazione") {
        console.warn("[cestino] spento: manca la colonna " + COL +
                     " su tutte le tabelle. Esegui sql/gest-cestino.sql su Supabase.");
      } else if (motivo === "migrazione-parziale") {
        console.warn("[cestino] MIGRAZIONE A META'. Manca la colonna " + COL + " su: " +
                     TABELLE.filter(function (t) { return stato[t] === "manca"; }).join(", ") +
                     ". Su quelle tabelle l'eliminazione e' BLOCCATA finche' non esegui sql/gest-cestino.sql.");
      } else if (motivo === "rete") {
        console.warn("[cestino] in attesa di risposta su " + quante("attesa") +
                     " tabelle: l'eliminazione resta bloccata finche' non si sa.");
      }

      /* la promessa pubblica si risolve al primo giro che chiude tutto */
      if (!giaRisolta && quante("attesa") === 0) {
        giaRisolta = true;
        if (risolviProva) risolviProva(quante("ok") > 0);
      }
    }

    provaFatta = new Promise(function (res) { risolviProva = res; });

    /* riprova da sola: 2s, 5s, 15s, 45s e poi ogni minuto, solo su quelle
       rimaste in attesa. Se la rete torna, il cestino si accende da solo e
       l'utente non deve fare niente. */
    var RITARDI = [0, 2000, 5000, 15000, 45000];
    var passo = 0;
    (function ciclo() {
      giro().then(function () {
        if (quante("attesa") === 0) return;              /* finito */
        var attesa = passo < RITARDI.length - 1 ? RITARDI[++passo] : 60000;
        setTimeout(ciclo, attesa);
      });
    })();

    sb.from = function (tabella) {
      var q = fromOriginale(tabella);
      if (TABELLE.indexOf(tabella) < 0) return q;

      /* --- LETTURA: salta le righe che stanno nel cestino ---
         Si filtra solo se su QUESTA tabella sappiamo che la colonna c'e'.
         Finche' non si sa, non si filtra: come prima. */
      var selectOriginale = q.select.bind(q);
      q.select = function () {
        var b = selectOriginale.apply(null, arguments);
        if (stato[tabella] !== "ok") return b;
        try { return b.is(COL, null); } catch (e) { return b; }
      };

      /* --- CANCELLAZIONE --- */
      var deleteOriginale = q.delete.bind(q);
      q.delete = function () {
        var fa = cosaFa(tabella);

        if (fa === "vera") return deleteOriginale.apply(null, arguments);

        if (fa === "blocca") {
          var testo = (stato[tabella] === "attesa")
            ? "Aspetta un attimo: sto controllando che il cestino sia pronto. Riprova fra qualche secondo."
            : "Su questa parte del gestionale il cestino non è ancora installato. Per non perdere niente per sempre, l'eliminazione è bloccata.";
          console.warn("[cestino] eliminazione bloccata su " + tabella + " (stato: " + stato[tabella] + ")");
          avvisa(testo);
          return bloccato(testo);
        }

        /* fa === "cestino": si riparte da un builder pulito, cosi' i filtri
           (.eq, .in, ...) che il chiamante mette DOPO il .delete() si
           attaccano all'update senza accorgersi di niente, e .select("id")
           restituisce le righe toccate esattamente come prima. */
        var patch = {};
        patch[COL] = new Date().toISOString();
        /* .is(COL,null): si mettono nel cestino solo le righe vive. Senza,
           eliminando un reparto si riscriveva la data anche sulle pratiche
           già nel cestino, e risalivano in cima con una data sbagliata. */
        var b = fromOriginale(tabella).update(patch).is(COL, null);

        /* 12 agosto 2026 — appena una cosa entra nel cestino lo diciamo alla
           sezione Cestino, che se no restava ferma alla lista di prima.
           Lo facciamo qui perche' e' l'unico punto da cui passano TUTTE le
           cancellazioni del gestionale: cosi' non se ne puo' dimenticare
           nessuna. I filtri che il chiamante attacca dopo (.eq, .select...)
           tornano sempre lo stesso oggetto, quindi basta avvolgere il .then. */
        var thenVero = b.then.bind(b);
        b.then = function (ok, ko) {
          return thenVero(function (r) {
            if (!(r && r.error)) {
              /* 12 agosto 2026 (sera) — quante righe sono finite davvero nel
                 cestino. Si sa solo se chi ha cancellato ha chiesto indietro le
                 righe con .select(...): in quel caso r.data e' l'elenco. Se non
                 lo si sa si passa null, e il gestionale rilegge il conteggio
                 vero invece di aggiungere uno a caso. */
              var quante = (r && r.data && typeof r.data.length === "number") ? r.data.length : null;
              try { if (typeof window.segnaCestinoDaRifare === "function") window.segnaCestinoDaRifare(quante); } catch (e) { }
            }
            return ok ? ok(r) : r;
          }, ko);
        };
        return b;
      };

      return q;
    };

    return sb;
  };
})();
