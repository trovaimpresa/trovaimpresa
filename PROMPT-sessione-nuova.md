# Prompt per la sessione nuova — 19 agosto 2026

Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

**Prima di rispondermi leggi `CLAUDE.md`**, che sta nella cartella del
progetto: e' la memoria di tutto. In particolare la testa del file (le regole
fisse) e **l'ultima sezione, quella del 19 agosto** — dentro c'e' la lezione
che e' costata l'intera mattinata.

## Come si lavora con me — le regole che non si sgarrano

- **Parlami in italiano semplice, e scrivi CORTO.** Ho la dislessia: testo
  grande, poca confusione, **massimo una decina di righe per messaggio, una
  domanda per volta**. I dettagli mettili nei file, non in chat.
- ⛔ **NIENTE comandi git dalla mia cartella, nemmeno `git status`**: crea un
  `.git/index.lock` fantasma che mi blocca i commit per ore. Per sapere cosa
  e' cambiato, guarda i file.
- **Il push lo faccio io.** Dammi **un blocco solo, su UNA RIGA**, pronto da
  incollare in Git Bash.
- **Le chiavi Stripe e Supabase stanno nelle variabili di Netlify**: non
  scriverle mai nel codice e non chiedermele in chat.
- **Le query per Supabase scrivimele per l'SQL Editor**, dove sono collegato
  come postgres. **UNA query alla volta.** Se una query deve dirmi qualcosa,
  me lo dice con una **RIGA DI RISULTATO**, mai con `raise notice`.
- **Non mostrarmi mai una riga di codice da sola in chat**: io incollo quella.
  Dammi sempre il blocco intero, o meglio il file.
- ⛔ **NON aprire `gestionale-negozio.html` e `gestionale-noleggio.html`.**
- **Io non sono in grado di collaudare il codice: la verifica e' tua, sempre**,
  anche quando non te la chiedo. Posso aprire una pagina e dirti cosa vedo,
  quello si'.
- **Una prova che non diventa rossa sul file rotto non prova niente**: i banchi
  si controllano nei due versi, sempre col loro file di sabotaggi.
- **Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file
  tocchi, e aspetta la mia conferma.**
- **Consegna cosi'**: scrivi nella mia cartella, mandami il file in chat,
  controlla l'md5 da tutte e due le parti, e dimmi cosa cliccare.
- **Se hai sbagliato, dimmelo subito e per primo.**
- Il sito pubblico non parla mai di me: il mio nome resta solo nel footer.
- ⛔ Per un modulo nuovo mai `openSheet()` (la finestrella piccola): sempre
  `openSheetGrande()`.
- I banchi di prova stanno nel tuo contenitore, in `prove/`, non nella mia
  cartella.

## ⚠️⚠️ LEGGI QUESTO PRIMA DI SCRIVERE UNA RIGA

Il 19 agosto tre difetti sono arrivati sul sito **con il banco verde**, sempre
per la stessa ragione: **il finto era piu' generoso del vero.**

- `sb.insert([…])` finto accettava righe con chiavi diverse. Quello vero no:
  supabase-js manda `?columns=<unione delle chiavi>` e PostgREST scrive a NULL
  quelle che mancano. Una riga senza `sezione` in mezzo a righe che ce l'hanno
  fa saltare tutta la scrittura.
- `$$` finto restituiva un Array. Nel gestionale `$$` e' `querySelectorAll` e
  basta: una **NodeList**, che ha `forEach` ma **non** ha `filter` ne' `map`.
  Un `.filter` ha spento una schermata intera.
- gli aiuti delle fotografie (`eur2`, `_eur`) erano riscritti a mano e diversi
  da quelli veri: la foto mostrava i numeri del banco, non del gestionale.

**Regola: un finto non deve MAI essere piu' permissivo dell'oggetto che imita.**
Quando ne scrivi uno, la domanda e' «cosa **rifiuta** quello vero?», non «cosa
accetta». E gli aiuti si **ritagliano dal file**, non si riscrivono.

## Dove siamo

Ieri e oggi il gestionale ha fatto molta strada. Oggi in particolare:

- le nove prove del banco rimaste «da capire» sono state riscritte
  (`banco_persone_e_numeri.js`, 125 prove);
- il preventivo che nasce da un computo adesso **tiene i capitoli e il loro
  ordine**, a schermo, sul PDF, nella conferma d'ordine e nella lettera
  d'incarico;
- **il quadro economico dei lavori pubblici** e' dentro il computo e sul PDF:
  parte A dai lavori, parte B da scrivere (in euro o in percentuale del
  Totale A), totale A+B.

Due migrazioni SQL sono gia' state eseguite: `sql/gest-preventivo-sezioni.sql`
e `sql/gest-computo-quadro.sql`.

## ⛔ DA DOVE SI RIPARTE

### 1. «Prendi i prezzi dal prezzario» dentro il computo

E' il punto 1 della lista da giorni e non e' mai stato fatto. **Adesso pesa il
doppio**, perche' un preventivo nato dal computo importato esce con 87 righe a
**0,00 €**: le lavorazioni prese dall'Excel non hanno il prezzo.

Serve un pulsante che cerchi il **codice** nel prezzario e riempia **solo le
voci a zero**, **solo dentro la tariffa dichiarata dal computo**, e che dica
quante ne ha riempite e quante no.

⚠️ Un codice come `A03.01.019.a` ha tre sotto-varianti con prezzi diversi
(`.1 .2 .3`): quelle **non** si riempiono da sole, si dicono e basta. Sui
codici del computo di Magliano Sabina il colpo riesce su circa 43 voci su 87.

### 2. La contabilita' dei lavori (SAL)

Chiesta da me il 19 agosto. Ne parliamo quando ci arriviamo.

### 3. L'analisi dei prezzi

Chiesta da me il 19 agosto. Su un lavoro pubblico la chiedono in appendice,
insieme all'elenco dei prezzi unitari.

### 4. Le regole del deposito dei file

Bucket `gestionale-foto` e `gestionale-video`, mai guardate. Ci sta dentro
`foto_team_delete`, che usa `gest_puo_accedere` senza guardare la spunta
«foto». C'era gia', non e' una regressione.

## Un difetto vecchio, gia' visto e lasciato li'

A 390 px (telefono) la casella della descrizione nelle voci del preventivo si
schiaccia a due dita: `.sheet .prev-riga` a `1fr 80px 118px 48px` non lascia
spazio. Vale per **tutte** le righe, anche quelle di prima.

## Il sito — quando il gestionale e' a posto

- Le **95 pagine citta' vuote** in Search Console.
- L'**email vera alle imprese**, mai vista partire da una richiesta reale.
- Il **grafico dell'admin**, che vuole `premium_dal` e `gestionale_dal`.

## Roba di prova da buttare

Nel reparto «progetto casa» i preventivi **n. 4, 5 e 6** sono nati dalle prove
del 19 agosto: si possono eliminare.

---

**Partiamo dal punto 1, «Prendi i prezzi dal prezzario».** Prima dimmi cosa hai
capito e quali file vuoi toccare, e aspetta il mio ok.
