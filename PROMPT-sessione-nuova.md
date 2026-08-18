# Prompt per la sessione nuova — 18 agosto 2026, pomeriggio

Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

**Prima di rispondermi leggi `CLAUDE.md`**, che sta nella cartella del
progetto: e' la memoria di tutto. In particolare la testa del file (le regole
fisse) e le ultime due sezioni, del 18 agosto.

## Come si lavora con me — le regole che non si sgarrano

- **Parlami in italiano semplice, e scrivi CORTO.** Ho la dislessia: testo
  grande, poca confusione, **massimo 10 righe per messaggio, una domanda per
  volta**. I dettagli mettili nei file, non in chat.
- ⛔ **NIENTE comandi git dalla mia cartella, nemmeno `git status`**: crea un
  `.git/index.lock` fantasma che mi blocca i commit per ore.
- **Il push lo faccio io.** Dammi **un blocco solo, su UNA RIGA**, pronto da
  incollare in Git Bash.
- **Le chiavi Stripe e Supabase stanno nelle variabili di Netlify**: non
  scriverle mai nel codice e non chiedermele in chat.
- **Le query per Supabase scrivimele per l'SQL Editor**, dove sono collegato
  come postgres. **UNA query alla volta.** Se una query deve dirmi qualcosa,
  me lo dice con una **RIGA DI RISULTATO**, mai con `raise notice` (l'SQL
  Editor i notice non li fa vedere).
- **Non mostrarmi mai una riga di codice da sola in chat**: io incollo quella.
  Dammi sempre il blocco intero, o meglio il file.
- ⛔ **NON aprire `gestionale-negozio.html` e `gestionale-noleggio.html`.**
- **Io non sono in grado di collaudare il codice: la verifica e' tua, sempre.**
  Non chiedermi mai di fare da collaudatore. Posso aprire una pagina e dirti
  cosa vedo, quello si'.
- **Una prova che non diventa rossa sul file rotto non prova niente**: i banchi
  si controllano nei due versi, sempre col loro file di sabotaggi.
- **Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file
  tocchi, e aspetta la mia conferma.**
- **Consegna cosi'**: scrivi nella mia cartella, mandami il file in chat,
  controlla l'md5 da tutte e due le parti, e dimmi cosa cliccare.
- **Se hai sbagliato, dimmelo subito e per primo.**
- Il sito pubblico non parla mai di me: il mio nome resta solo nel footer.

## Dove siamo

Oggi, 18 agosto, sono stati chiusi due punti di una lista di quattro che
avevamo deciso di fare **uno alla volta**:

1. ✅ **La roba privata scaricabile dal sito.** `CLAUDE.md`, lo schema del
   database, il codice delle funzioni e un csv con nomi, telefoni ed email di
   imprese vere erano aperti a chiunque. Chiusi con 20 rinvii in
   `netlify.toml`, piu' un `404.html` nuovo e un controllo automatico al push
   che se ne accorge se domani nasce qualcosa di nuovo da tenere fuori.
2. ✅ **Il telefono del cliente mandato a 5 imprese.** Adesso l'impresa riceve
   la richiesta **senza contatti** e un pulsante «Voglio contattarlo»: nome,
   telefono ed email compaiono solo a chi clicca, e resta scritto chi e
   quando. Provato dal vivo sul sito.

**Ultimo push: `af747df`.**

## ⚠️ LA PRIMA COSA DA FARE

Nel database e' rimasta una **richiesta finta** creata per la prova dal vivo
(nome «PROVA — non chiamare», telefono 3990000000). Va buttata via:

> lanciami `sql/prova-prendi-richiesta-pulisci.sql` nell'SQL Editor e guarda
> la riga che risponde (dice anche se il pulsante era stato premuto).

## Cosa resta, in ordine

3. **Le 95 pagine citta' vuote.** In Search Console stanno come «Rilevata, ma
   attualmente non indicizzata»: sono le pagine citta' senza nessuna impresa
   dentro. O si riempiono o si tolgono dalla sitemap. Da capire **con i numeri
   veri**, non a intuito (Search Console e il database).
4. **Il calendario del gestionale e' illeggibile**: scrive a 12 px (10,5 sul
   telefono, sotto il minimo dei 13 di tutto il progetto), taglia i nomi a
   meta' e ha caselle enormi e vuote. `.cal-lav-t` in `css/gestionale.css`.

E poi, dalla lista lunga in fondo a `CLAUDE.md`:

- l'**email delle 24 ore** e l'email vera alle imprese non sono mai state
  viste partire da una richiesta vera;
- il grafico dell'admin vuole due colonne nuove (`premium_dal`,
  `gestionale_dal`);
- il «Genera con AI» dei Preventivi usa ancora la vecchia finestrella
  separata;
- le sezioni del gestionale sono ancora a 16-17 px con le schede grigie,
  mentre le finestre sono a 21 px su foglio bianco: stonano;
- la **ricerca unica** nel gestionale (una casella sola per cliente, lavori,
  preventivi e fatture);
- «Fattura n. 12/undefined»: manca l'anno nel titolo.

## I banchi di prova

Stanno nel container di Claude, non nella mia cartella (`prove/`). Se servono
vanno rifatti. Quelli di oggi: `banco_contatto_su_richiesta.js` (41 prove) +
`rompi_contatto_su_richiesta.py` (16 sabotaggi), `banco_consenso.js` (154) +
`rompi_consenso.py` (15), `banco_controllo_push.py` (37).

**Partiamo dal punto 3.** Prima dimmi cosa hai capito e cosa vorresti toccare,
e aspetta il mio ok.
