Prompt per la sessione nuova — dopo la notte del 21 agosto 2026
Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

⛔ **La cartella del progetto è `C:\Users\Utente\Downloads\trovaimpresa`** (in Cowork si apre come `$HOME/mnt/trovaimpresa`). Se non risulta già collegata, chiedimi l'accesso **a quella cartella lì**: non startene a cercare in giro nel computer.

Prima di rispondermi leggi `CLAUDE.md`, che sta nella cartella del progetto: è la memoria di tutto. In particolare la testa del file (le regole fisse) e le **tre sezioni del 21 agosto in fondo**: il controllo totale del gestionale, il resoconto della sera, e quella della tarda serata (il timeout del preventivo e i nomi dei gestionali). Dentro ci sono le lezioni che sono costate la giornata.

Come si lavora con me — le regole che non si sgarrano

* Parlami in italiano semplice, e scrivi CORTO. Ho la dislessia: massimo una decina di righe per messaggio, **una domanda per volta**. I dettagli mettili nei file, non in chat. Se devo scegliere fra due cose, spiegamele in parole mie; se non so rispondere, decidi tu e dimmi perché.
* ⛔ NIENTE comandi git dalla mia cartella, nemmeno `git status`: crea un `.git/index.lock` fantasma che mi blocca i commit per ore. Per sapere cosa è cambiato, guarda i file.
* Il push lo faccio io. Dammi un blocco solo, su UNA RIGA, pronto da incollare in Git Bash. ⛔ La riga del git dammela DA SOLA, e rileggila carattere per carattere prima di mandarmela. La scheda di collaudo scrivimela come testo normale, fuori dal riquadro.
* ⛔ Per tornare indietro su un file usa il numero del commit, non `HEAD~1`: il 21 agosto avevo fatto due commit e `HEAD~1` ha riportato indietro niente. Il numero si legge nella riga del push precedente (`e236d97..755b6ba`).
* ⛔ PRIMA di darmi il blocco git, esegui `node tools/controllo-push.js` sulla mia cartella. Gira in 5 secondi e dice cosa fermerebbe la pubblicazione. La consegna è quattro cose: banchi verdi · controllo verde · md5 uguale · blocco git.
* ⚠️ Raggruppa le modifiche in UN push solo. Netlify: 300 crediti al mese e ogni push ne costa 15 — cioè venti push al mese. Quello che sta in `sql/` e in `tools/` non va online; un push di soli file `.md` e `.sql` non fa ripartire la pubblicazione, quindi non costa crediti.
* Le chiavi Stripe e Supabase stanno nelle variabili di Netlify: non scriverle mai nel codice e non chiedermele in chat.
* Le query per Supabase scrivimele per l'SQL Editor, dove sono collegato come postgres. UNA query alla volta. Se una query deve dirmi qualcosa, me lo dice con una RIGA DI RISULTATO, mai con `raise notice`.
* Non mostrarmi mai una riga di codice da sola in chat: io incollo quella. Dammi sempre il blocco intero, o meglio il file.
* ⛔ NON aprire `gestionale-negozio.html` e `gestionale-noleggio.html`.
* Io non sono in grado di collaudare il codice: la verifica è tua, sempre, anche quando non te la chiedo. Posso aprire una pagina e dirti cosa vedo, quello sì — ed è così che il 21 agosto sono usciti i difetti più grossi.
* Una prova che non diventa rossa sul file rotto non prova niente: i banchi si controllano nei due versi, sempre col loro file di sabotaggi. E una prova che gira a vuoto senza finire deve diventare rossa, non restare zitta.
* Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file tocchi, e aspetta la mia conferma.
* Consegna così: scrivi nella mia cartella, mandami il file in chat, controlla l'md5 da tutte e due le parti, e dimmi cosa cliccare.
* Se hai sbagliato, dimmelo subito e per primo.
* Il sito pubblico non parla mai di me: il mio nome resta solo nel footer.
* ⛔ Per un modulo nuovo mai `openSheet()`: sempre `openSheetGrande()`.
* I banchi di prova stanno nel tuo contenitore, in `prove/`, non nella mia cartella. Se non te lo dico io, non spostarli.
* ⛔ Quando costruisci una schermata, i pulsanti devono sembrare pulsanti: usa la classe `.quick-add` di `css/gestionale.css`.
* ⛔ I prezzi sono i MIEI, non si inventano. Se per un pezzo non hai un mio numero, si scrive che dipende e da cosa — non si tappa il buco con una cifra presa da internet.

⚠️⚠️ LE LEZIONI, prima di scrivere una riga

1. ⛔ PRIMA DI COSTRUIRE, GUARDA SE C'È GIÀ. Il 21 agosto due voci della mia lista erano già fatte da giorni, e la sera mi hai offerto di costruire una porta d'ingresso al gestionale che esisteva già (`AMMESSI` e `?chiave=apri`). Trenta secondi di lettura del file risparmiano una giornata. Quando una cosa si chiude, va tolta dalla lista lo stesso giorno.
2. ⛔ UN ELENCO NON SI CONTA, SI LEGGE RIGA PER RIGA. Search Console diceva «683 pagine non indicizzate»: 574 non erano un difetto e i difetti veri erano uno.
3. ⛔ CONTARE NON È CONTROLLARE. Un banco che conta le righe non vede il difetto: deve guardarle una per una.
4. ⛔ UN SABOTAGGIO NON ACCUSATO VA CAPITO, NON AGGIRATO — e un sabotaggio che non può fare danno non prova niente: va riscritto sul punto giusto. (Il 21 sera: «do il permesso di scrivere a chi ha l'account» restava verde, perché senza una regola permissiva il lucchetto blocca lo stesso.)
5. ⛔ LO SCHEMA DI PROVA SI COPIA DA QUELLO VERO, NON SI IMMAGINA. `imprese.id` è un NUMERO, non un uuid come le altre tabelle: il banco dava verde su un file che sul database vero non partiva nemmeno.
6. ⛔ QUANDO UNA COSA VA IN TIMEOUT, GUARDA IL REGISTRO DI NETLIFY PRIMA DI TOCCARE IL CODICE. La sera del 21 agosto hai concluso da un sintomo, mi hai fatto tornare indietro un file, e non era vero: push sprecato.
7. ⛔ LE EMOJI LE DISEGNA WINDOWS, NON NOI. Niente emoji del blocco U+1FA70–U+1FAFF: escono come quadratini bianchi. E la stessa emoji può voler dire tre cose: si guarda l'etichetta accanto, mai un cambio unico.
8. ⛔ UNA REGOLA CHE STA IN DUE POSTI NON SI SISTEMA A METÀ. Vale per il codice e per le liste.
9. ⚠️ NON METTERMI DAVANTI DUE MONDI COME SE FOSSERO LO STESSO. Il prezzario della Regione serve per i lavori pubblici; i prezzi delle guide sono quelli di mercato.

Dove siamo
Il gestionale è finito ed è chiuso (`MANUTENZIONE = true`, riga ~15272): «prima si costruisce la casa poi si vende». Per entrarci io: `trovaimpresa.com/gestionale-app?chiave=apri`. Prezzo, clienti e incassi non sono il discorso.

Online e provato, la notte del 21 agosto:
* la falla di `ai-claude.js` richiusa — l'impresa si ricava dall'accesso, l'`impresa_id` del browser è ignorato, con la scadenza del Premium e un tetto di 4 secondi sui controlli;
* **il preventivo AI non va più in timeout**: lavora in background fino a 15 minuti (`netlify/functions/ai-preventivo-background.js` + `sql/ai-lavori.sql`) e il pannello ripassa a ritirarlo ogni due secondi;
* **ogni gestionale ha il nome del suo mestiere**: Gestionale impresa · artigiano · studio · negozio. Un motore solo, una faccia per mestiere.

⛔ DECISO E NON SI RIDISCUTE: il gestionale impresa e quello dei professionisti **non si dividono**. Sono 24.323 righe, e quello che cambia fra i due mestieri è meno dell'1%: dividerli vuol dire pagare ogni correzione due volte.

⛔ DA DOVE SI RIPARTE

1. **IL GESTIONALE ARTIGIANO.** È il percorso che ho aperto io. Il foglio per decidere sta in `prove-claude/GESTIONALE-ARTIGIANO.md`: 22 voci divise in tre gruppi. Le quattro da togliere sono già chiare (Computo metrico, Prezzario, Stati di avanzamento, Crediti formativi: oggi l'artigiano se le ritrova perché cade nel ramo dell'impresa edile). Le otto in mezzo le segno io. ⚠️ Chiedimi il foglio prima di partire.
2. **VIA GLI STRUMENTI DAI PANNELLI.** Deciso da me: presi uno per uno non fanno abbonare nessuno. Quelli che restano vanno dentro il gestionale, non sparsi nel pannello.
3. **I PREZZI DEL PREVENTIVO AI.** Su un bagno da 15 mq ha scritto 14.600 € + IVA: è il doppio del vero. Il mio numero: un bagno completo di 6 mq a Rieti, tutto compreso (sanitari, rubinetteria, porta), sta fra **6.000 e 7.000 €**. Le istruzioni della schermata «Preventivo AI» (`generaPreventivoDash`) non nominano nemmeno la zona. E l'IVA: mette 10% su tutto, ma sanitari e rubinetteria sono beni significativi — da chiedere al commercialista.
4. **LA FINESTRELLA DEL PREVENTIVO AI**: alta quattro righe per un preventivo di due pagine, e non si può salvare, stampare né capire che si può correggere a mano. Serve: riquadro alto il triplo, Stampa / Salva come PDF, Svuota e rifai.
5. **Il paywall del gestionale vive solo nel browser**: nel database nessuna regola nomina il piano. Un account free userebbe il gestionale intero. Da chiudere **prima** di aprire a chiunque.
6. **`sql/gest-computo-metrico.sql` è una mina**: rilanciato, riporta indietro la vista e i prezzi dell'analisi tornano in silenzio a quelli scritti a mano. E il gestionale, in 14 messaggi, invita a eseguirlo. Serve una guardia (stesso innesco in `gest-computo-quantita-3-decimali.sql`).
7. **Il totale del preventivo non è la somma di quello che si stampa** (tre centesimi su un preventivo vero, e poi la fattura non torna).
8. **I dati che si perdono senza dirlo**: le ore del lavoro, e il collaboratore che segna «fatto» dal telefono senza che arrivi al titolare.
9. **Per il geometra**: la ricerca in alto riscrive i nomi dei clienti («Edilcantiere» → «Edilpratica»), sul telefono il menù resta «Lavori», quattro frasi escono sgrammaticate, e `js/aiuti-gestionale.js` non è caricato da nessuna pagina.
10. **Le 5 pagine «duplicata senza URL canonico»** in Search Console — chiedimi la schermata, quella tabella non passa dal collegamento che usi tu.
11. **Piccole, viste nelle foto**: la mappa dell'Europa che spunta a sinistra nel pannello · il cancelletto `#` e gli asterischi che restano nel testo dell'AI · «Vedi gli artigiani di roma» in minuscolo nella home · la striscia arancione «Non ho trovato la risposta» che sembra un secondo modo di chiedere all'AI.

Legge, non interfaccia — non cominciare senza dirmelo: la fattura alla Pubblica Amministrazione (formato FPA12, codice a 6 caratteri, scissione dei pagamenti) e il reverse charge del subappalto edile (natura N6.7). Prima serve una risposta del commercialista.

Grandi, da non cominciare senza dirmelo: il POS (serve un consulente vero), la contabilità dei lavori pubblici, i formati di scambio, il computo da una foto.

⛔ LE DECISIONI CHE RESTANO MIE — non ripropormele

* L'avviso del prezzo nuovo alle imprese di luglio (Premium da 49 €/anno a 29 €/mese o 249 €/anno). Fermo lì: «è un lavoro che ancora io devo decidere».
* I prezzi della pagina del muratore. Restano quelli che ci sono.
* L'indirizzo nel blocco facoltativo della registrazione: non è un difetto, è una scelta del modulo.
* `.bak-riepiva-123811.html`, che sta nella cartella principale ed è quindi pubblicato. Segnalato, non toccato: decido io se chiuderlo.
* Il passaggio dalla home città prima della ricerca: costa un clic, ma è lì che vive la pubblicità venduta. Scelta mia, non è un difetto.
* Email e telefono delle imprese sono pubblici per scelta (il pulsante «Chiama»). Non è una falla. ⚠️ Quello che resta vero è che un concorrente scarica tutta la lista in un colpo: per chiuderlo serve una vista tipo `preventivi_safe` e toccare molte pagine pubbliche.

La pubblicità, i numeri veri

* Il pixel di Meta sta dietro il banner dei cookie: Meta vede meno della metà di chi arriva. Su →50← clic pagati in tre giorni il sito ne ha visti →50←, Meta ne dichiarava →12←.
* Un'impresa iscritta costa →2,97← €, non 5,47. →81← iscritte in 30 giorni con →240,66← € spesi. Prima della campagna il sito ne aveva →8← in tutto.
* Le query si rileggono con `sql/leggi-visite.sql` e `sql/leggi-iscrizioni.sql`.
* ⚠️ Con →8← € al giorno l'apprendimento di Meta non si chiuderà mai. Deciso: si tiene l'evento «Contatti» e non si tocca niente fino al **26 agosto**, poi si rimisura confrontando `al_giorno_7` con `al_giorno_30`.

Dimmi cosa hai capito e da quale punto vuoi partire. Non toccare nessun file prima che ti dica di sì.
