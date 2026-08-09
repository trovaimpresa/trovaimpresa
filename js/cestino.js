/* ============================================================
   IL CESTINO DEL GESTIONALE — TrovaImpresa (9 agosto 2026)

   Richiesta di Alessio: "se uno cancella per errore e' meglio poter
   recuperare". Prima ogni Elimina era definitivo, e in tre casi si portava
   dietro altra roba: il reparto con tutte le sue pratiche, la carta con
   tutti i suoi movimenti, il cliente con i suoi documenti.

   COME FUNZIONA, IN UNA RIGA
   Questo file si mette in mezzo fra il gestionale e il database:
     - ogni LETTURA di una tabella "col cestino" salta le righe eliminate
     - ogni CANCELLAZIONE diventa "scrivi la data in eliminato_il"
   Il resto del gestionale non se ne accorge: non e' stata cambiata nemmeno
   una delle sessanta letture sparse nei quattro pannelli. Ed e' proprio il
   punto: cosi' non se ne puo' dimenticare nessuna.

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

   SE LA MIGRAZIONE NON E' STATA FATTA
   All'avvio si fa una domanda di prova al database. Se la colonna non c'e',
   il cestino resta spento e il gestionale si comporta esattamente come
   prima: meglio un cestino che non c'e' che un pannello bianco.
   ============================================================ */
(function () {
  "use strict";

  /* Le tabelle che entrano nel cestino.
     NON ci sono le righe di preventivi e fatture: vengono cancellate e
     riscritte a ogni salvataggio, il cestino si riempirebbe di fantasmi.
     NON c'e' gest_lavoro_mezzi: e' solo un collegamento, si rifa' con un clic.
     NON ci sono gest_carte_movimenti e gest_rifornimenti: alimentano due VISTE
     del database (gest_carte_saldo, gest_mezzi_carburante) che non stanno nei
     file del progetto. Nel cestino il movimento sparirebbe dall'elenco ma il
     saldo resterebbe scalato: meglio una cancellazione vera che un numero
     sbagliato sui soldi. */
  var TABELLE = [
    "gest_lavori", "gest_clienti", "gest_preventivi", "gest_fatture",
    "gest_scadenze", "gest_mestieri", "gest_mezzi", "gest_operatori",
    "gest_carte",
    "gest_fornitori", "gest_fatture_fornitori", "gest_spese",
    "gest_ore", "gest_crediti", "gest_note", "gest_foto", "gest_video"
  ];

  var COL = "eliminato_il";
  var attivo = false;          /* si accende solo se la colonna c'e' davvero */
  var provaFatta = null;       /* la promessa della domanda di prova */
  var motivo = "";             /* "migrazione" o "rete": cambia cosa dire all'utente */

  window.CESTINO_TABELLE = TABELLE;
  window.cestinoAttivo   = function () { return attivo; };
  window.cestinoMotivo   = function () { return motivo; };
  window.cestinoPronto   = function () { return provaFatta || Promise.resolve(false); };

  window.attivaCestino = function (sb) {
    if (!sb || sb.__cestino) return sb;    /* mai due volte sullo stesso client */
    sb.__cestino = true;

    var fromOriginale = sb.from.bind(sb);
    sb.raw = fromOriginale;                /* la porta di servizio, per il Cestino */

    /* La domanda di prova: costa una riga e si fa una volta sola.
       Finche' non ha risposto il cestino resta spento, quindi al massimo le
       primissime letture non filtrano: succede solo nei millisecondi prima
       del login, quando non c'e' ancora niente da mostrare. */
    function prova() {
      return fromOriginale("gest_lavori").select("id").is(COL, null).limit(1);
    }
    function eColonnaMancante(err) {
      var m = (err && (err.message || err.details || "")) || "";
      return m.indexOf(COL) >= 0 || m.indexOf("42703") >= 0;
    }
    /* Un errore di RETE non deve spegnere il cestino: se lo spegnessimo, da
       quel momento ogni Elimina tornerebbe definitivo senza che nessuno lo
       sappia. Si riprova una volta, e si spegne SOLO se il database dice
       chiaramente che la colonna non c'e'. */
    provaFatta = prova()
      .then(function (r) {
        if (!r || !r.error) { attivo = true; return true; }
        if (eColonnaMancante(r.error)) {
          console.warn("[cestino] spento: manca la colonna " + COL +
                       ". Esegui sql/gest-cestino.sql su Supabase.");
          motivo = "migrazione";
          attivo = false; return false;
        }
        return new Promise(function (res) { setTimeout(res, 1500); }).then(prova).then(function (r2) {
          if (!r2 || !r2.error) { attivo = true; return true; }
          motivo = eColonnaMancante(r2.error) ? "migrazione" : "rete";
          attivo = false;
          console.warn("[cestino] spento (" + motivo + "):", r2.error && r2.error.message);
          return false;
        });
      })
      .catch(function () { motivo = "rete"; attivo = false; return false; });

    sb.from = function (tabella) {
      var q = fromOriginale(tabella);
      if (TABELLE.indexOf(tabella) < 0) return q;

      /* --- LETTURA: salta le righe che stanno nel cestino --- */
      var selectOriginale = q.select.bind(q);
      q.select = function () {
        var b = selectOriginale.apply(null, arguments);
        if (!attivo) return b;
        try { return b.is(COL, null); } catch (e) { return b; }
      };

      /* --- CANCELLAZIONE: diventa una data --- */
      var deleteOriginale = q.delete.bind(q);
      q.delete = function () {
        if (!attivo) return deleteOriginale.apply(null, arguments);
        /* Si riparte da un builder pulito: i filtri (.eq, .in, ...) che il
           chiamante mette DOPO il .delete() si attaccano all'update senza
           accorgersi di niente, e .select("id") restituisce le righe toccate
           esattamente come prima. */
        var patch = {};
        patch[COL] = new Date().toISOString();
        /* .is(COL,null): si mettono nel cestino solo le righe vive. Senza,
           eliminando un reparto si riscriveva la data anche sulle pratiche
           gia' nel cestino, e risalivano in cima con una data sbagliata. */
        return fromOriginale(tabella).update(patch).is(COL, null);
      };

      return q;
    };

    return sb;
  };
})();
