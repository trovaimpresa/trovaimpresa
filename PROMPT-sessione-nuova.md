# Prompt per la sessione nuova — 19 agosto 2026, sera

Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

**Prima di rispondermi leggi `CLAUDE.md`**, che sta nella cartella del
progetto: e' la memoria di tutto. In particolare la testa del file (le regole
fisse) e **le tre sezioni del 19 agosto** — dentro ci sono le lezioni che sono
costate la giornata.

## Come si lavora con me — le regole che non si sgarrano

- **Parlami in italiano semplice, e scrivi CORTO.** Ho la dislessia: testo
  grande, poca confusione, **massimo una decina di righe per messaggio, una
  domanda per volta**. I dettagli mettili nei file, non in chat.
- ⛔ **NIENTE comandi git dalla mia cartella, nemmeno `git status`**: crea un
  `.git/index.lock` fantasma che mi blocca i commit per ore. Per sapere cosa
  e' cambiato, guarda i file.
- **Il push lo faccio io.** Dammi **un blocco solo, su UNA RIGA**, pronto da
  incollare in Git Bash. ⛔ **La riga del git dammela DA SOLA**: il 19 agosto
  me l'hai messa attaccata alla scheda di collaudo, ho incollato tutto in Git
  Bash e la shell si e' impantanata. La scheda scrivimela come testo normale,
  fuori dal riquadro.
- ⚠️ **Raggruppa le modifiche in UN push solo.** Netlify: 300 crediti al mese
  sul piano gratuito e **ogni push ne costa 15** — cioe' venti push al mese. Il
  19 agosto il sito e' andato in pausa a meta' mattina per questo.
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
- **Consegna cosi':** scrivi nella mia cartella, mandami il file in chat,
  controlla l'md5 da tutte e due le parti, e dimmi cosa cliccare.
- **Se hai sbagliato, dimmelo subito e per primo.**
- **Il sito pubblico non parla mai di me:** il mio nome resta solo nel footer.
- ⛔ **Per un modulo nuovo mai `openSheet()`** (la finestrella piccola): sempre
  `openSheetGrande()`.
- **I banchi di prova stanno nel tuo contenitore, in `prove/`**, non nella mia
  cartella.

## ⚠️⚠️ LE LEZIONI DEL 19 AGOSTO — leggi prima di scrivere una riga

**1. Un finto non deve MAI essere piu' permissivo dell'oggetto che imita.**
Tre difetti sono arrivati sul sito col banco verde, sempre per questo:
`sb.insert([…])` finto accettava righe con chiavi diverse (quello vero manda
`?columns=` con l'unione delle chiavi e scrive NULL); `$$` finto restituiva un
Array mentre nel gestionale e' una NodeList (ha `forEach`, non ha `filter`);
gli aiuti delle fotografie erano riscritti a mano invece che ritagliati dal
file. Quando scrivi un finto la domanda e' **«cosa RIFIUTA quello vero?»**,
non «cosa accetta». E gli aiuti si **ritagliano dal file**, non si riscrivono.

**2. Ma nemmeno piu' POVERO del vero.** Nel pomeriggio e' successo il
contrario: il finto `storage.buckets` non aveva le colonne che Supabase ha, e
una tabella non era leggibile dai ruoli che sul sito la leggono. Le prove
dicevano «no» dove il database vero dice «si», cioe' inventavano difetti.

**3. Chi non ha fatto il login non e' «loggato con l'uid vuoto»: e' un altro
RUOLO (`anon`).** Una regola scritta `to authenticated` per lui non esiste
proprio. Provarlo da `authenticated` vuol dire provare la cosa sbagliata.

**4. Il banco segna rosso, non esplode.** Se una regola va in errore, l'errore
dev'essere contato come una prova rossa, non far morire lo script.

**5. Una regola che sta in due posti non si sistema a meta'.** Le foto avevano
la spunta sulla tabella ma non sul deposito dei file: chi passava dal deposito
scavalcava la tabella.

**6. In una fila di pulsanti, o sono tutti uguali o quello diverso sembra un
allarme.** Detto da me guardando lo schermo: «stona».

## Dove siamo

Il 19 agosto e' stata una giornata lunga. In sintesi:

- **mattina:** i capitoli dal computo al preventivo (schermo, PDF, conferma
  d'ordine, lettera d'incarico) · il quadro economico dei lavori pubblici ·
  le 9 prove «da capire» riscritte;
- **mezzogiorno:** «**Prendi i prezzi dal prezzario**» dentro il computo —
  cerca il codice, riempie solo le voci a 0,00 €, solo dentro la tariffa
  dichiarata, e dice una per una perche' non ha riempito le altre. Sul computo
  vero di Magliano Sabina: **41 prezzi su 87**. Il prezzario della Regione
  Lazio e' finalmente dentro (4 file, 12.762 voci, tariffa «Tariffa Regione
  Lazio»);
- **pomeriggio:** **le regole dei due depositi di file**. Il deposito «foto»
  non aveva dentro solo le foto — anche le fatture, i documenti dei clienti,
  dei fornitori e del commercialista — e qualsiasi collaboratore, anche con
  tutte le spunte tolte, poteva scaricarli e cancellarli. Chiuso. E chiuso
  anche il secondo buco: su `documenti-incarichi` chiunque, anche senza
  account, poteva caricare file dove voleva e grandi quanto voleva.

**Migrazioni SQL gia' eseguite il 19 agosto:** `sql/gest-preventivo-sezioni.sql`
· `sql/gest-computo-quadro.sql` · `sql/gest-deposito-file.sql` ·
`sql/gest-deposito-incarichi.sql`.

## ⛔ DA DOVE SI RIPARTE

**1. La contabilita' dei lavori (SAL).** E' il lavoro di questa sessione.
Chiesta da me il 19 agosto e mai cominciata. Serve una migrazione SQL nuova.
Prima di scrivere una riga, spiegami cosa hai capito e chiedimi come lavoro io
con gli stati di avanzamento — non darlo per scontato.

**2. L'analisi dei prezzi.** Su un lavoro pubblico la chiedono in appendice,
insieme all'elenco dei prezzi unitari.

**3. Il difetto del telefono sui preventivi.** A 390 px la casella della
descrizione nelle voci si schiaccia a due dita: `.sheet .prev-riga` a
`1fr 80px 118px 48px` non lascia spazio. Vale per tutte le righe.

**4. Il pulsante «Prendi i prezzi dal prezzario» anche in cima** all'elenco
delle lavorazioni: in fondo a 88 righe non lo trova nessuno — per trovarlo mi
e' servito il Ctrl+F.

**5. `cv-candidati/registrazioni`:** stessa famiglia del deposito incarichi.
La cartella e' gia' bloccata, manca solo il limite di misura.

**6. Il conteggio delle richieste** per fermare chi insiste a caricare file:
non si fa con una regola del database, e' un lavoro a parte.

## Il sito — quando il gestionale e' a posto

- Le **95 pagine citta' vuote** in Search Console.
- **L'email vera alle imprese**, mai vista partire da una richiesta reale.
- **Il grafico dell'admin**, che vuole `premium_dal` e `gestionale_dal`.

## ⛔ E una cosa da NON fare

**Non spezzare `gestionale-app.html` in venti file.** 19.000 righe in un file
solo si cercano in un secondo, e quel lavoro mi fermerebbe per giorni senza
dare niente a nessuna impresa. Se me lo proponi, la risposta e' no.

## Roba di prova da buttare

Nel reparto «progetto casa» i preventivi n. 4, 5 e 6 sono nati dalle prove del
19 agosto: si possono eliminare.

## Una decisione che resta mia

I banchi di prova spariscono a ogni sessione. La regola «i banchi stanno nel
tuo contenitore» e' mia e resta mia. La proposta era: tenerli in `prove/` nella
mia cartella, fuori dal deploy con un rinvio in `netlify.toml` come gia' fatto
per `CLAUDE.md`. **Se non te lo dico io, non spostarli.**

---

Partiamo dal punto 1, il SAL. Prima dimmi cosa hai capito e quali file vuoi
toccare, e aspetta il mio ok.
