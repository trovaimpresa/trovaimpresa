# Prompt per la sessione nuova — dopo la sera del 21 agosto 2026

Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

Prima di rispondermi leggi `CLAUDE.md`, che sta nella cartella del progetto: è la
memoria di tutto. In particolare la testa del file (le regole fisse) e **le due
sezioni in fondo**, quelle del 21 agosto: il controllo totale del gestionale e il
resoconto della sera. Dentro ci sono le lezioni che sono costate la giornata.

## Come si lavora con me — le regole che non si sgarrano

* Parlami in italiano semplice, e scrivi CORTO. Ho la dislessia: massimo una
  decina di righe per messaggio, **una domanda per volta**. I dettagli mettili
  nei file, non in chat. Se devo scegliere fra due cose, spiegamele in parole
  mie; se non so rispondere, **decidi tu e dimmi perché**.
* ⛔ NIENTE comandi git dalla mia cartella, nemmeno `git status`: crea un
  `.git/index.lock` fantasma che mi blocca i commit per ore. Per sapere cosa è
  cambiato, guarda i file.
* Il push lo faccio io. Dammi un blocco solo, su UNA RIGA, pronto da incollare in
  Git Bash. ⛔ La riga del git dammela DA SOLA, e rileggila carattere per
  carattere prima di mandarmela. La scheda di collaudo scrivimela come testo
  normale, fuori dal riquadro.
* ⛔ Per tornare indietro su un file **usa il numero del commit**, non `HEAD~1`:
  il 21 agosto avevo fatto due commit e `HEAD~1` ha riportato indietro niente.
  Il numero si legge nella riga del push precedente (`e236d97..755b6ba`).
* ⛔ PRIMA di darmi il blocco git, esegui `node tools/controllo-push.js` sulla mia
  cartella. Gira in 5 secondi e dice cosa fermerebbe la pubblicazione. La consegna
  è quattro cose: **banchi verdi · controllo verde · md5 uguale · blocco git**.
* ⚠️ Raggruppa le modifiche in UN push solo. Netlify: 300 crediti al mese e ogni
  push ne costa 15 — cioè venti push al mese. Quello che sta in `sql/` e in
  `tools/` non va online; un push di soli file `.md` e `.sql` non fa ripartire la
  pubblicazione, quindi non costa crediti.
* Le chiavi Stripe e Supabase stanno nelle variabili di Netlify: non scriverle mai
  nel codice e non chiedermele in chat.
* Le query per Supabase scrivimele per l'SQL Editor, dove sono collegato come
  postgres. UNA query alla volta. Se una query deve dirmi qualcosa, me lo dice con
  una RIGA DI RISULTATO, mai con `raise notice`.
* Non mostrarmi mai una riga di codice da sola in chat: io incollo quella. Dammi
  sempre il blocco intero, o meglio il file.
* ⛔ NON aprire `gestionale-negozio.html` e `gestionale-noleggio.html`.
* Io non sono in grado di collaudare il codice: la verifica è tua, sempre, anche
  quando non te la chiedo. Posso aprire una pagina e dirti cosa vedo, quello sì —
  ed è così che il 21 agosto sono usciti i difetti più grossi.
* Una prova che non diventa rossa sul file rotto non prova niente: i banchi si
  controllano nei due versi, sempre col loro file di sabotaggi.
* Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file tocchi, e
  aspetta la mia conferma.
* Consegna così: scrivi nella mia cartella, mandami il file in chat, controlla
  l'md5 da tutte e due le parti, e dimmi cosa cliccare.
* **Se hai sbagliato, dimmelo subito e per primo.**
* Il sito pubblico non parla mai di me: il mio nome resta solo nel footer.
* ⛔ Per un modulo nuovo mai `openSheet()`: sempre `openSheetGrande()`.
* I banchi di prova stanno nel tuo contenitore, in `prove/`, non nella mia
  cartella. Se non te lo dico io, non spostarli.
* ⛔ Quando costruisci una schermata, i pulsanti devono sembrare pulsanti: usa la
  classe `.quick-add` di `css/gestionale.css`.

## ⚠️⚠️ LE LEZIONI, prima di scrivere una riga

1. ⛔ **PRIMA DI COSTRUIRE, GUARDA SE C'È GIÀ.** Il 21 agosto due voci della mia
   lista erano già fatte da giorni. Trenta secondi di `grep` risparmiano una
   giornata. Quando una cosa si chiude, va tolta dalla lista **lo stesso giorno**.
2. ⛔ **UN ELENCO NON SI CONTA, SI LEGGE RIGA PER RIGA.** Search Console diceva
   «683 pagine non indicizzate»: 574 non erano un difetto e i difetti veri erano
   uno. Non si commenta un numero senza aver visto da cosa è fatto.
3. ⛔ **CONTARE NON È CONTROLLARE.** Un banco che conta le righe non vede il
   difetto: deve guardarle una per una.
4. ⛔ **UN SABOTAGGIO NON ACCUSATO VA CAPITO, NON AGGIRATO** — e un sabotaggio
   che non può fare danno non prova niente: va riscritto sul punto giusto.
5. ⛔ **QUANDO UNA COSA VA IN TIMEOUT, GUARDA IL REGISTRO DI NETLIFY PRIMA DI
   TOCCARE IL CODICE.** La sera del 21 agosto ho concluso da un sintomo che era
   colpa mia, ho fatto tornare indietro un file, e non era vero: push sprecato.
6. ⛔ **LE EMOJI LE DISEGNA WINDOWS, NON NOI.** Niente emoji del blocco
   U+1FA70–U+1FAFF: escono come quadratini bianchi. E la stessa emoji può voler
   dire tre cose: si guarda l'etichetta accanto, mai un cambio unico.
7. ⛔ **UNA REGOLA CHE STA IN DUE POSTI NON SI SISTEMA A METÀ.** Vale per il
   codice e per le liste.
8. ⚠️ **NON METTERMI DAVANTI DUE MONDI COME SE FOSSERO LO STESSO.** Il prezzario
   della Regione serve per i lavori pubblici; i prezzi delle guide sono quelli di
   mercato.

## Dove siamo

Il gestionale è finito ed è **chiuso** (`MANUTENZIONE = true`): «prima si
costruisce la casa poi si vende». Prezzo, clienti e incassi non sono il discorso.

Il 21 agosto è stato fatto un **controllo totale** prima di aprirlo. Il rapporto
sta in `prove-claude/CONTROLLO-GESTIONALE.md` (non va online). In sintesi: il
gestionale è solido — zero errori JavaScript, nessun pulsante morto, i conti della
fattura tornano — ma c'erano nove cose da chiudere prima di aprire.

**Chiuso la sera del 21 agosto**, e online: il tetto dell'AI dell'assistente del
sito · la partita IVA pulita nel file elettronico · la data del SAL italiana · il
rimborso spese che non aggiornava il conto · l'avviso se un pezzo del gestionale
non si carica. E nel database: il Premium che ci si regalava da soli · le
recensioni scrivibili da chiunque · il contatore del tetto.

## ⛔ DA DOVE SI RIPARTE

1. **Il preventivo AI del pannello va in timeout (504)** sui lavori grossi, ed è
   il difetto più visibile per un iscritto. ⚠️ Prima di toccare il codice: guarda
   il registro di Netlify. Poi si sceglie fra accorciare quello che il modello
   scrive, costruirlo a pezzi, o farlo lavorare in background.
2. **Richiudere la falla di `ai-claude.js`**: si fida dell'`impresa_id` che gli
   manda il browser. I quattro pannelli mandano già il gettone della sessione, e
   il controllo nuovo deve avere un tempo massimo di 4 secondi.
3. **Il paywall del gestionale vive solo nel browser**: nel database nessuna
   regola nomina il piano. Un account free usa il gestionale intero.
4. **`sql/gest-computo-metrico.sql` è una mina**: rilanciato, riporta indietro la
   vista e i prezzi dell'analisi tornano in silenzio a quelli scritti a mano. E il
   gestionale, in 14 messaggi, invita a eseguirlo. Serve una guardia.
5. **Il totale del preventivo non è la somma di quello che si stampa** (tre
   centesimi su un preventivo vero, e poi la fattura non torna).
6. **I dati che si perdono senza dirlo**: le ore del lavoro, e il collaboratore
   che segna «fatto» dal telefono senza che arrivi al titolare.
7. **Per il geometra**: la ricerca in alto riscrive i nomi dei clienti
   («Edilcantiere» → «Edilpratica»), sul telefono il menù resta «Lavori», quattro
   frasi escono sgrammaticate, e `js/aiuti-gestionale.js` non è caricato da nessuna
   pagina.
8. Le 5 pagine «duplicata senza URL canonico» in Search Console — chiedimi la
   schermata, quella tabella non passa dal collegamento che usi tu.

**Legge, non interfaccia — non cominciare senza dirmelo:** la fattura alla
Pubblica Amministrazione (formato FPA12, codice a 6 caratteri, scissione dei
pagamenti) e il reverse charge del subappalto edile (natura N6.7). Prima serve una
risposta del commercialista.

**Grandi, da non cominciare senza dirmelo:** il POS (serve un consulente vero), la
contabilità dei lavori pubblici, i formati di scambio, il computo da una foto.

## ⛔ LE DECISIONI CHE RESTANO MIE — non ripropormele

* L'avviso del prezzo nuovo alle imprese di luglio (Premium da 49 €/anno a
  29 €/mese o 249 €/anno). Chiesto il 21 agosto, risposta: «è un lavoro che ancora
  io devo decidere». Fermo lì.
* I prezzi della pagina del muratore. Restano quelli che ci sono.
* L'indirizzo nel blocco facoltativo della registrazione: non è un difetto, è una
  scelta del modulo.
* `.bak-riepiva-123811.html`, che sta nella cartella principale ed è quindi
  pubblicato. Segnalato, non toccato: decido io se chiuderlo.
* Il passaggio dalla home città prima della ricerca: costa un clic, ma è lì che
  vive la pubblicità venduta. Scelta mia, non è un difetto.
* Email e telefono delle imprese sono **pubblici per scelta** (il pulsante
  «Chiama»). Non è una falla.

## La pubblicità, i numeri veri

* Il pixel di Meta sta dietro il banner dei cookie: Meta vede meno della metà di
  chi arriva. Su →50← clic pagati in tre giorni il sito ne ha visti →50←, Meta ne
  dichiarava →12←.
* Un'impresa iscritta costa →2,97← €, non 5,47. →81← iscritte in 30 giorni con
  →240,66← € spesi. Prima della campagna il sito ne aveva →8← in tutto.
* Le query si rileggono con `sql/leggi-visite.sql` e `sql/leggi-iscrizioni.sql`.
* ⚠️ Con →8← € al giorno l'apprendimento di Meta non si chiuderà mai. Deciso: si
  tiene l'evento «Contatti» e **non si tocca niente fino al 26 agosto**, poi si
  rimisura confrontando `al_giorno_7` con `al_giorno_30`.

Dimmi cosa hai capito e da quale punto vuoi partire. Non toccare nessun file prima
che ti dica di sì.
