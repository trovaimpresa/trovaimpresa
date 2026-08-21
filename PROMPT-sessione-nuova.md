# Prompt per la sessione nuova — dopo la notte del 21 agosto 2026

Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

⛔ La cartella del progetto è `C:\Users\Utente\Downloads\trovaimpresa` (in Cowork si apre come `$HOME/mnt/trovaimpresa`). Se non risulta già collegata, chiedimi l'accesso a quella cartella lì: non startene a cercare in giro nel computer.

Prima di rispondermi leggi `CLAUDE.md`, che sta nella cartella del progetto: è la memoria di tutto. In particolare la testa del file (le regole fisse) e **le quattro sezioni in fondo, tutte del 21 agosto**: il controllo totale del gestionale, il resoconto della sera, quella della tarda serata (il timeout del preventivo e i nomi dei gestionali), e quelle della **notte fonda** — via gli Strumenti dai pannelli, la coda della chat rimessa, il campo indirizzo nella barra laterale, e **l'ordine dei prossimi tre lavori**. Dentro ci sono le lezioni che sono costate la giornata.

## Come si lavora con me — le regole che non si sgarrano

* Parlami in italiano semplice, e scrivi CORTO. Ho la dislessia: massimo una decina di righe per messaggio, **una domanda per volta**. I dettagli mettili nei file, non in chat. Se devo scegliere fra due cose, spiegamele in parole mie; se non so rispondere, decidi tu e dimmi perché.
* ⚠️ **Quando ti chiedo una cosa piccola, fai quella piccola.** Il 21 sera ti avevo chiesto un campo per scrivere un indirizzo: è arrivato un campo, una finestra che si apriva, un'intestazione e tre pulsanti. Tutta roba che non avevo chiesto — e ogni pezzo in più è un pezzo da mantenere.
* ⛔ NIENTE comandi git dalla mia cartella, nemmeno `git status`: crea un `.git/index.lock` fantasma che mi blocca i commit per ore. Per sapere cosa è cambiato, guarda i file.
* Il push lo faccio io. Dammi un blocco solo, su UNA RIGA, pronto da incollare in Git Bash. ⛔ La riga del git dammela DA SOLA, e rileggila carattere per carattere prima di mandarmela. La scheda di collaudo scrivimela come testo normale, fuori dal riquadro.
* ⛔ Per tornare indietro su un file usa il numero del commit, non `HEAD~1`: il 21 agosto avevo fatto due commit e `HEAD~1` ha riportato indietro niente. Il numero si legge nella riga del push precedente (`5e5f63e..6da3e57`).
* ⛔ PRIMA di darmi il blocco git, esegui `node tools/controllo-push.js` sulla mia cartella. Gira in 5 secondi e dice cosa fermerebbe la pubblicazione. La consegna è quattro cose: **banchi verdi · controllo verde · md5 uguale · blocco git**.
* ⚠️ Raggruppa le modifiche in UN push solo. Netlify: 300 crediti al mese e ogni push ne costa 15 — cioè venti push al mese. Quello che sta in `sql/` e in `tools/` non va online; un push di soli file `.md` e `.sql` non fa ripartire la pubblicazione, quindi non costa crediti.
* Le chiavi Stripe e Supabase stanno nelle variabili di Netlify: non scriverle mai nel codice e non chiedermele in chat.
* Le query per Supabase scrivimele per l'SQL Editor, dove sono collegato come postgres. UNA query alla volta. Se una query deve dirmi qualcosa, me lo dice con una RIGA DI RISULTATO, mai con `raise notice`.
* Non mostrarmi mai una riga di codice da sola in chat: io incollo quella. Dammi sempre il blocco intero, o meglio il file.
* ⛔ NON aprire `gestionale-negozio.html` e `gestionale-noleggio.html`. **Se ti serve guardarci dentro, chiedimelo prima.**
* Io non sono in grado di collaudare il codice: la verifica è tua, sempre, anche quando non te la chiedo. Posso aprire una pagina e dirti cosa vedo, quello sì — ed è così che il 21 agosto sono usciti i difetti più grossi.
* Una prova che non diventa rossa sul file rotto non prova niente: i banchi si controllano nei due versi, sempre col loro file di sabotaggi. E una prova che gira a vuoto senza finire deve diventare rossa, non restare zitta.
* Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file tocchi, e aspetta la mia conferma.
* Consegna così: scrivi nella mia cartella, mandami il file in chat, controlla l'md5 da tutte e due le parti, e dimmi cosa cliccare.
* Se hai sbagliato, dimmelo subito e per primo.
* Il sito pubblico non parla mai di me: il mio nome resta solo nel footer.
* ⛔ Per un modulo nuovo mai `openSheet()`: sempre `openSheetGrande()`.
* I banchi di prova stanno nel tuo contenitore, in `prove/`, non nella mia cartella. Se non te lo dico io, non spostarli.
* ⛔ Quando costruisci una schermata, i pulsanti devono sembrare pulsanti: usa la classe `.quick-add` di `css/gestionale.css`. Sul telefono nessun pulsante sotto i **44 px** di altezza: il dito lo sbaglia.
* ⛔ I prezzi sono i MIEI, non si inventano. Se per un pezzo non hai un mio numero, si scrive che dipende e da cosa — non si tappa il buco con una cifra presa da internet.

## ⚠️⚠️ LE LEZIONI, prima di scrivere una riga

1. ⛔ **PRIMA DI COSTRUIRE, GUARDA SE C'È GIÀ.** Il 21 agosto due voci della mia lista erano già fatte da giorni, e la sera mi hai offerto di costruire una porta d'ingresso al gestionale che esisteva già (`AMMESSI` e `?chiave=apri`). La notte è successo di nuovo: stavi per «portare il Preventivo AI dentro il gestionale», e nel gestionale c'era già («✨ Genera con AI»). Trenta secondi di lettura del file risparmiano una giornata. Quando una cosa si chiude, va tolta dalla lista lo stesso giorno.
2. ⛔ **UN ELENCO NON SI CONTA, SI LEGGE RIGA PER RIGA.** Search Console diceva «683 pagine non indicizzate»: 574 non erano un difetto e i difetti veri erano uno.
3. ⛔ **CONTARE NON È CONTROLLARE.** Un banco che conta le righe non vede il difetto: deve guardarle una per una.
4. ⛔ **UN SABOTAGGIO NON ACCUSATO VA CAPITO, NON AGGIRATO** — e un sabotaggio che non può fare danno non prova niente: va riscritto sul punto giusto. Il 21 notte ne sono usciti tre: uno appeso in fondo al file (fuori dai tag `<script>` è testo, non codice), uno che colpiva la prima di due `.subscribe()` invece di quella giusta, e uno che riduceva un pulsante a 43 px quando la prova ne chiedeva 40.
5. ⛔ **LO SCHEMA DI PROVA SI COPIA DA QUELLO VERO, NON SI IMMAGINA.** `imprese.id` è un NUMERO, non un uuid come le altre tabelle.
6. ⛔ **QUANDO UNA COSA VA IN TIMEOUT, GUARDA IL REGISTRO DI NETLIFY PRIMA DI TOCCARE IL CODICE.**
7. ⛔ **UN DIFETTO VECCHIO CHE RESTA LÌ FA DA SCUDO A QUELLI NUOVI.** Una prova scritta come «non peggio di prima» non diventa rossa se il file era già rotto. Dove si può, la misura va assoluta.
8. ⛔ **CERCARE UNA SCRITTA NEL FILE NON È CONTROLLARE.** Il nome di una funzione resta scritto anche quando la funzione è sparita e solo la chiamata è rimasta — cioè proprio quando il file è rotto.
9. ⛔ **UN `addEventListener` SCRITTO A MANO NON È «CHIAMATO DA NESSUNO»: GIRA DA SOLO.** Una pulizia che guarda solo «chi mi chiama» non lo vede, e quello tiene in vita mezzo file.
10. ⛔ **IL CODICE GIÀ MORTO PRIMA NON SI TOCCA.** Non è il lavoro di stasera.
11. ⛔ **LE EMOJI LE DISEGNA WINDOWS, NON NOI.** Niente emoji del blocco U+1FA70–U+1FAFF: escono come quadratini bianchi.
12. ⛔ **UNA REGOLA CHE STA IN DUE POSTI NON SI SISTEMA A METÀ.** Vale per il codice e per le liste.
13. ⚠️ **NON METTERMI DAVANTI DUE MONDI COME SE FOSSERO LO STESSO.** Il prezzario della Regione serve per i lavori pubblici; i prezzi delle guide sono quelli di mercato.

## Dove siamo

Il gestionale è finito ed è chiuso (`MANUTENZIONE = true`, riga ~15272): «prima si costruisce la casa poi si vende». Per entrarci io: `trovaimpresa.com/gestionale-app?chiave=apri`. Prezzo, clienti e incassi non sono il discorso.

Online e provato, la notte del 21 agosto:

* la falla di `ai-claude.js` richiusa — l'impresa si ricava dall'accesso, con la scadenza del Premium e un tetto di 4 secondi sui controlli;
* il preventivo AI non va più in timeout: lavora in background fino a 15 minuti;
* ogni gestionale ha il nome del suo mestiere: Gestionale impresa · artigiano · studio · negozio;
* **via il riquadro «🛠️ Strumenti» dai 4 pannelli** (7 caselle, ~4.400 righe in meno). Deciso da me: presi uno per uno non facevano abbonare nessuno;
* **rimessa la coda di `pannello-impresa.html`**: il file finiva a metà frase e **tutta la chat del pannello impresa era morta**, in silenzio, senza un errore in console;
* **campo indirizzo nella barra laterale** (`js/vai-dal-cliente.js`, un file solo per tutti e 4): scrivi la via con la città, la mappa che sta già lì si sposta col segnalino, e un pulsante apre il navigatore del telefono.

## ⛔ DA DOVE SI RIPARTE — l'ordine l'ho deciso io

**1. IL GESTIONALE ARTIGIANO — si costruisce e si collauda. È tutto già deciso: non chiedermi niente, parti.**

⛔ NON è un file suo: è la terza faccia di `gestionale-app.html`, come lo studio tecnico. Confermato da me dopo aver visto i numeri. Non ridiscuterlo.

* **Restano 15 voci**: Riepilogo · Lavori · Clienti · Preventivi · Fatture · Scadenzario · Calendario · Richieste dal sito · Galleria · Cestino **+ Fornitori · Mezzi · Attrezzature · Report · Mappa**.
* **Se ne spengono 7**: Computo metrico · Prezzario · Stati di avanzamento · Crediti formativi · Squadra · Agenda operatore · Carte.
* **Le parole**: «Lavori» diventa **«Lavori e interventi»** — tutte e due, non una sola.
* ⚠️ Attrezzature resta ma Squadra si spegne: «chi ce l'ha in mano» va cambiato in una nota scritta a mano, se no è una tendina vuota.
* Nasce `adattaMenuArtigiano()` accanto a `adattaMenuProfessionista()`. Oggi l'artigiano cade dentro `adattaMenuImpresa()`, ed è da lì che gli arrivano computo, prezzario e SAL. Si **nasconde soltanto**: i dati restano.

**2. IL GESTIONALE NEGOZIO — un lavoro iniziato e mai finito.** È rimasto molto indietro, come i professionisti. È un file davvero separato, e con ragione (magazzino, giacenze, scarico merce), ma le correzioni fatte sul gestionale principale lì non arrivano mai. Aperti dal 7 agosto: `esc()` sui dati nelle card `neg_*` · il banner errore-lettura sul riepilogo · la numerazione dei preventivi fatta dal browser (due dispositivi = due preventivi con lo stesso numero).

**3. IL GESTIONALE NOLEGGIO — farlo entrare dentro impresa e negozio.** Nelle imprese ci possono stare noleggiatori, e nei negozi il noleggio di attrezzature. È **2.233 righe** — non un gestionale, un modulo — e usa tre sole tabelle sue (`nol_mezzi`, `nol_clienti`, `nol_noleggi`) mentre per il resto pesca già da `gest_*` e `neg_*`. Oggi **non è collegato a niente**: ci si arriva solo da un link in `admin.html`. Diventerà una sezione «Noleggio» che si accende solo per chi noleggia. ⚠️ Prima di attaccarlo a qualcuno: le tre tabelle `nol_*` non hanno un file SQL nel progetto, quindi nessuno sa com'è fatto il loro lucchetto. Va guardato con una query.

## Il resto che resta aperto, dopo i tre

4. **I prezzi del preventivo AI.** Su un bagno da 15 mq ha scritto 14.600 € + IVA: è il doppio del vero. Il mio numero: un bagno completo di 6 mq a Rieti, tutto compreso, sta fra 6.000 e 7.000 €. Le istruzioni di `generaPreventivoDash` non nominano nemmeno la zona. E l'IVA: mette 10% su tutto, ma sanitari e rubinetteria sono beni significativi — da chiedere al commercialista.
5. **Il paywall del gestionale vive solo nel browser**: nel database nessuna regola nomina il piano. Un account free userebbe il gestionale intero. Da chiudere prima di aprire a chiunque.
6. **`sql/gest-computo-metrico.sql` è una mina**: rilanciato, riporta indietro la vista e i prezzi dell'analisi tornano in silenzio a quelli scritti a mano. E il gestionale, in 14 messaggi, invita a eseguirlo. Serve una guardia (stesso innesco in `gest-computo-quantita-3-decimali.sql`).
7. **Il totale del preventivo non è la somma di quello che si stampa** (tre centesimi su un preventivo vero, e poi la fattura non torna).
8. **I dati che si perdono senza dirlo**: le ore del lavoro, e il collaboratore che segna «fatto» dal telefono senza che arrivi al titolare.
9. **Per il geometra**: la ricerca in alto riscrive i nomi dei clienti («Edilcantiere» → «Edilpratica»), sul telefono il menù resta «Lavori», quattro frasi escono sgrammaticate, e `js/aiuti-gestionale.js` non è caricato da nessuna pagina.
10. **Le 5 pagine «duplicata senza URL canonico»** in Search Console — chiedimi la schermata, quella tabella non passa dal collegamento che usi tu.
11. **Piccole**: il cancelletto `#` e gli asterischi che restano nel testo dell'AI · «Vedi gli artigiani di roma» in minuscolo nella home · la striscia arancione «Non ho trovato la risposta» che sembra un secondo modo di chiedere all'AI.

**Legge, non interfaccia — non cominciare senza dirmelo**: la fattura alla Pubblica Amministrazione (formato FPA12, codice a 6 caratteri, scissione dei pagamenti) e il reverse charge del subappalto edile (natura N6.7). Prima serve una risposta del commercialista.

**Grandi, da non cominciare senza dirmelo**: il POS (serve un consulente vero), la contabilità dei lavori pubblici, i formati di scambio, il computo da una foto.

## ⛔ LE DECISIONI CHE RESTANO MIE — non ripropormele

* **La mappa nella barra laterale dei pannelli resta.** Sta in tutti e quattro perché è una scelta mia, non un residuo. Non si toglie: le si è dato uno scopo col campo dell'indirizzo, e basta così. ⛔ E niente finestre che si aprono sopra il pannello.
* L'avviso del prezzo nuovo alle imprese di luglio (Premium da 49 €/anno a 29 €/mese o 249 €/anno). Fermo lì: «è un lavoro che ancora io devo decidere».
* I prezzi della pagina del muratore. Restano quelli che ci sono.
* L'indirizzo nel blocco facoltativo della registrazione: non è un difetto, è una scelta del modulo.
* `.bak-riepiva-123811.html`, che sta nella cartella principale ed è quindi pubblicato. Segnalato, non toccato: decido io se chiuderlo.
* Il passaggio dalla home città prima della ricerca: costa un clic, ma è lì che vive la pubblicità venduta. Scelta mia, non è un difetto.
* Email e telefono delle imprese sono pubblici per scelta (il pulsante «Chiama»). Non è una falla. ⚠️ Quello che resta vero è che un concorrente scarica tutta la lista in un colpo: per chiuderlo serve una vista tipo `preventivi_safe` e toccare molte pagine pubbliche.
* Gli **Strumenti** dei pannelli sono stati tolti e non tornano. Quello che serve va dentro il gestionale.

## La pubblicità, i numeri veri

* Il pixel di Meta sta dietro il banner dei cookie: Meta vede meno della metà di chi arriva. Su →50← clic pagati in tre giorni il sito ne ha visti →50←, Meta ne dichiarava →12←.
* Un'impresa iscritta costa →2,97← €, non 5,47. →81← iscritte in 30 giorni con →240,66← € spesi. Prima della campagna il sito ne aveva →8← in tutto.
* Le query si rileggono con `sql/leggi-visite.sql` e `sql/leggi-iscrizioni.sql`.
* ⚠️ Con →8← € al giorno l'apprendimento di Meta non si chiuderà mai. Deciso: si tiene l'evento «Contatti» e non si tocca niente **fino al 26 agosto**, poi si rimisura confrontando `al_giorno_7` con `al_giorno_30`.

---

**Oggi si parte dal punto 1: il gestionale artigiano.** È tutto deciso — dimmi solo cosa tocchi e aspetta il mio sì.
