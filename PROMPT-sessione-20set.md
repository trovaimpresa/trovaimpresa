# Prompt per la sessione nuova — dopo il 19 settembre 2026

Copia tutto quello che sta sotto la riga e incollalo in una chat Cowork nuova.

---

Ciao. Riprendiamo TrovaImpresa. La cartella è `C:\Users\Utente\Downloads\trovaimpresa`.

**Prima di toccare qualunque cosa, leggi in quest'ordine:**

1. `CLAUDE.md` — in particolare la sezione finale **«18–19 SETTEMBRE 2026 — IL GESTIONALE SA LA COSA, MA NON TE LA FA TROVARE»**
2. `LAVORI-APERTI.md` — la prima sezione, **«IL 18–19 SETTEMBRE»**

## Dove siamo arrivati

Nelle ultime due giornate abbiamo chiuso **8 buchi** nel gestionale. Il filo era sempre lo stesso:

> **ogni messaggio che dice «c'è qualcosa» deve anche dire DOVE, e portarci.**

Il gestionale conosceva già la risposta (quale SAL, quale casella, quale fattura) e la buttava via mentre scriveva il messaggio.

Abbiamo anche:
- portato l'apertura del gestionale da **16,8 a 1,5 secondi** (28 domande inutili al database, per ogni iscritto, a ogni apertura)
- costruito il **controllo degli aggiornamenti del database**: 149 controlli su 37 file sql in una sola domanda (`js/fondatore.js` → `PROVE` → funzione `gest_schema_mancanti`), più il **punto 8** di `tools/controllo-push.js` che ferma il push se scrivo un file sql nuovo e mi dimentico di metterlo in elenco

Tutto pubblicato e **provato sul sito vero**, non solo col controllo di sintassi.

## Cosa resta aperto (in ordine di importanza)

**1. Noleggio, negozio e operatore non hanno il controllo del database.**
`PROVE` copre solo il gestionale imprese/artigiani/professionisti. Le altre tre facce hanno i loro file sql e nessuno controlla che siano stati eseguiti. Il punto 8 di `controllo-push.js` le ignora apposta (`FILE_CHE_NOMINANO_SQL`). Serve lo stesso lavoro, un elenco per ognuna.

**2. Gli 8 buchi non sono stati provati su impresa e professionista.**
Il collaudo dal vivo è stato fatto solo sul gestionale **artigiano**. È lo stesso file per tutte e tre le facce, ma `?vedi=impresa` e `?vedi=professionista` cambiano le etichette: i pannelli nuovi (SAL non collegato, fascia del Cestino) vanno riletti con quegli occhi.

**3. Resta un computo di prova da buttare**: `PROVA CLAUDE 18set`, reparto **giardiniere**.

## Come lavoro io (regole che valgono sempre)

- **Rispondi in italiano**, frasi brevi, niente muri di testo. Leggo con fatica.
- **Prima di modificare qualcosa che si vede a schermo: fammi vedere l'anteprima in foto.** I file si toccano dopo il mio ok.
- **Fai il lavoro per intero** anche se non te lo chiedo: se non lo chiedo è perché non so che va fatto, non perché non lo voglio.
- **Il `git push` lo lancio io.** Dammi sempre la riga pronta da incollare, senza che te la chieda.
- **⛔ Nessun comando git dalla cartella collegata**, nemmeno `git status`: crea un lucchetto fantasma che mi blocca i commit per ore.
- **A fine lavoro: un riassunto**, e dimmi cosa faresti dopo.
- Se hai un'opinione diversa dalla mia, dimmela. Voglio il parere onesto.

## Tre trappole che mi sono costate tempo, non ripeterle

1. **Dopo ogni `device_commit_files`, ristaggia il file e confrontalo.** Risponde `written` e poi lascia la versione vecchia. Mi è successo oggi: il push diceva «nothing to commit» con dentro 30 righe di lavoro sparite.

2. **Le misure di velocità si fanno in Chrome vero**, mai nel browser dentro l'app Claude: quello aggiunge ~600 ms a ogni connessione e fa sembrare inutili le correzioni che funzionano.

3. **Una cosa non è finita finché non l'hai cliccata sul sito vero.** Il collaudo dal vivo di oggi ha trovato 3 difetti che `node --check` aveva lasciato passare — compreso un tasto pubblicato ieri che non faceva assolutamente niente.

Dimmi da dove vuoi partire, o proponimi tu l'ordine.
