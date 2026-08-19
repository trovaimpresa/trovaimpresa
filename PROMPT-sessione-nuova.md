# Prompt per la sessione nuova — dopo il 19 agosto 2026

Copia e incolla tutto quello che sta sotto la riga.

---

Ciao. Riprendiamo il lavoro su TrovaImpresa.

**Prima di rispondermi leggi `CLAUDE.md`**, che sta nella cartella del
progetto: è la memoria di tutto. In particolare la testa del file (le regole
fisse) e **le quattro sezioni del 19 agosto** — dentro ci sono le lezioni che
sono costate la giornata.

## Come si lavora con me — le regole che non si sgarrano

- **Parlami in italiano semplice, e scrivi CORTO.** Ho la dislessia: testo
  grande, poca confusione, **massimo una decina di righe per messaggio, una
  domanda per volta**. I dettagli mettili nei file, non in chat.
- ⛔ **NIENTE comandi git dalla mia cartella, nemmeno `git status`**: crea un
  `.git/index.lock` fantasma che mi blocca i commit per ore. Per sapere cosa
  è cambiato, guarda i file.
- **Il push lo faccio io.** Dammi **un blocco solo, su UNA RIGA**, pronto da
  incollare in Git Bash. ⛔ **La riga del git dammela DA SOLA**, e
  **rileggila carattere per carattere prima di mandarmela**: il 19 agosto me
  l'hai data due volte sbagliata — una con una virgoletta di troppo alla fine
  (`git push"`), che mi ha piantato Git Bash sul prompt `>`, e una col nome di
  un file storpiato. La scheda di collaudo scrivimela come testo normale,
  fuori dal riquadro.
- ⚠️ **Raggruppa le modifiche in UN push solo.** Netlify: 300 crediti al mese
  sul piano gratuito e **ogni push ne costa 15** — cioè venti push al mese.
  Quello che sta in `sql/` e in `tools/` non va online (sono già 404): quella
  roba non ha bisogno di push.
- **Le chiavi Stripe e Supabase stanno nelle variabili di Netlify**: non
  scriverle mai nel codice e non chiedermele in chat.
- **Le query per Supabase scrivimele per l'SQL Editor**, dove sono collegato
  come postgres. **UNA query alla volta.** Se una query deve dirmi qualcosa,
  me lo dice con una **RIGA DI RISULTATO**, mai con `raise notice`.
- **Non mostrarmi mai una riga di codice da sola in chat**: io incollo quella.
  Dammi sempre il blocco intero, o meglio il file.
- ⛔ **NON aprire `gestionale-negozio.html` e `gestionale-noleggio.html`.**
- **Io non sono in grado di collaudare il codice: la verifica è tua, sempre**,
  anche quando non te la chiedo. Posso aprire una pagina e dirti cosa vedo,
  quello sì.
- **Una prova che non diventa rossa sul file rotto non prova niente**: i banchi
  si controllano nei due versi, sempre col loro file di sabotaggi.
- **Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file
  tocchi, e aspetta la mia conferma.**
- **Consegna così:** scrivi nella mia cartella, mandami il file in chat,
  controlla l'md5 da tutte e due le parti, e dimmi cosa cliccare.
- **Se hai sbagliato, dimmelo subito e per primo.**
- **Il sito pubblico non parla mai di me:** il mio nome resta solo nel footer.
- ⛔ **Per un modulo nuovo mai `openSheet()`** (la finestrella piccola): sempre
  `openSheetGrande()`.
- **I banchi di prova stanno nel tuo contenitore, in `prove/`**, non nella mia
  cartella.
- ⛔ **Quando costruisci una schermata, i pulsanti devono SEMBRARE pulsanti.**
  Il 19 agosto te l'ho dovuto dire tre volte guardando tre schermate diverse:
  bordo e sfondo, se no sembrano testo e non li clicca nessuno. Adesso la
  regola `.quick-add` in `css/gestionale.css` li sistema tutti: **usa quella
  classe**, non inventarne una nuova senza bordo.

## ⚠️⚠️ LE LEZIONI CHE COSTANO — leggi prima di scrivere una riga

**1. Un finto non deve MAI essere più permissivo dell'oggetto che imita.**
Quando scrivi un finto la domanda è **«cosa RIFIUTA quello vero?»**, non «cosa
accetta». E gli aiuti si **ritagliano dal file**, non si riscrivono.

**2. Ma nemmeno più POVERO del vero**, se no le prove inventano difetti che
non ci sono.

**3. Chi non ha fatto il login non è «loggato con l'uid vuoto»: è un altro
RUOLO (`anon`).** Una regola scritta `to authenticated` per lui non esiste.

**4. Il banco segna rosso, non esplode.** Se una prova va in errore o va in
timeout, va contata come **rossa**, non deve ammazzare lo script. E chi lancia
i sabotaggi deve saper distinguere «nessuna rossa» da «il banco è esploso»:
il 19 agosto un banco esplodeva e sembrava che passasse.

**5. Una regola che sta in due posti non si sistema a metà.**

**6. ⛔ `exception when others then return new` È UNA TRAPPOLA.** Se scrivi un
`exception when others`, l'errore va scritto da qualche parte. C'è la tabella
`public.errori_trigger`: **se non è vuota, qualcosa si sta perdendo.**

**7. Prima di dire «è un difetto», guarda il VALORE, non il nome.** Il 19
agosto è successo due volte: il diario diceva «lat e lng vuote per TUTTE» ed
erano vuote per 83 su 87; e il sospetto che la mappa fosse vuota per il nome
sbagliato è caduto guardando i dati.

**8. Una prova fatta da chi ha già dato il consenso non prova niente sul
visitatore nuovo.** È così che il pixel di Meta era stato dato per buono.

**9. Una prova che nasce nel momento sbagliato non prova niente.**

## Dove siamo

Il 19 agosto è stata una giornata lunghissima. In sintesi:

- **mattina:** i capitoli dal computo al preventivo · il quadro economico dei
  lavori pubblici · le 9 prove «da capire» riscritte;
- **mezzogiorno:** «Prendi i prezzi dal prezzario» dentro il computo (41
  prezzi su 87 sul computo vero) · il prezzario della Regione Lazio importato
  (4 file, 12.762 voci);
- **pomeriggio:** le regole dei due depositi di file · e **il difetto più
  costoso**: il trigger `completa_profilo_extra` scriveva in due colonne
  inesistenti e buttava via undici giorni di iscrizioni in silenzio.
  Corretto, e i profili completi sono passati **da 0 a 21**;
- **sera:** vedi qui sotto.

### ⛔ Il 62% non era gente persa: era il pixel dietro il banner dei cookie

**Il pixel di Meta sta dentro `cookie-banner.js` e parte SOLO dopo il clic su
«Accetta tutti».** Chi sceglie «Solo tecnici» o non tocca il banner, per Meta
**non è mai arrivato**. →326← su →854← fa il **38%**: è la percentuale di chi
accetta i cookie. Anche i →44← iscritti sono sotto-contati, per lo stesso
motivo.

⚠️ **La vecchia nota «il pixel lo inietta Netlify» era sbagliata**, e nasceva
da una prova letta male. Non ripeterla.

### Il contatore delle visite — già online, sta raccogliendo

`js/conta-visita.js` scrive due righe per ogni apertura di pagina nella
tabella `public.visite_sito`: `arrivo` (subito) e `visto` (pagina disegnata e
persona ancora lì dopo 2 secondi). Niente cookie, niente IP. Legge `fbclid`,
il codice che Meta attacca a ogni clic.

⚠️ `ms_attesa` comprende i 2 secondi di attesa: per sapere quanto ci ha messo
la pagina, **togliere 2000**.

### La mappa

Da →4← imprese a →86←. Chi ha l'indirizzo sta sul punto vero, chi ha solo la
città sta nella sua zona, sparpagliato di poco, e sulla scheda si legge «zona
di Roma (RM)». `mappa.html` adesso legge `lat`/`lng` dal database: prima
chiedeva la posizione una per una e ci metteva **un minuto e mezzo**.
`tools/riempi-mappa.html` non va online e si rilancia col doppio clic (dopo il
primo giro serve **F5** per far tornare il pulsante «Comincia»).

### La contabilità dei lavori (SAL)

Database e schermata fatti. Le quantità sono **progressive**: si scrive quanto
si è fatto DALL'INIZIO. Il SAL precedente è **uno solo**, non la somma di
tutti. Il ribasso passa da `compRiepilogoDa()`, che resta l'unico posto dove
quella formula esiste.

⚠️ **Il SAL non è il mio mestiere: l'ho voluto io lo stesso.** Quando la prima
impresa lo userà davvero, fatti spiegare da lei come lo fa, e correggi.

**Manca il PDF.**

**Migrazioni SQL eseguite il 19 agosto sera:** `sql/conteggio-visite.sql` ·
`sql/mappa-posizioni.sql` · `sql/gest-sal.sql`

### ⛔ IL PREZZO — deciso la sera del 19 agosto

**Il piano gratuito resta esattamente com'è. Il Premium passa da →49← € l'anno
a →29← € al mese, oppure →249← € l'anno.** Un piano solo, con dentro tutto:
visibilità e gestionale. I tre mesi di prova restano, e adesso valgono →87← €.

Perché: 49 € l'anno fanno 4 € al mese, e **la pubblicità era in perdita** —
un'impresa iscritta costa →5,47← €, se paga una su dieci un cliente costa
→54,70← € e ne rendeva 49. Adesso ne rende 249-348, e si ripaga in due mesi.

Da →816← clienti paganti a **→115-161←**.

⚠️ **Va detto alle imprese PRIMA**, non quando gli chiedi i soldi.
⚠️ **Niente sconti**: il regalo sono i tre mesi, non il prezzo tagliato.
⚠️ **Dentro il database la parola `premium` resta com'è**: cambia solo il
prezzo e quello che si legge a schermo.

Tutti i conti stanno in `IL-PREZZO-la-decisione.md` e
`IL-PREZZO-i-conti-veri.md`, nella cartella del progetto.

## ⛔ DA DOVE SI RIPARTE

**1. Leggere il contatore delle visite.** La query sta in fondo a
`sql/conteggio-visite.sql`. È l'unica cosa che risponde alla domanda degli
→854← clic: quel 62% è gente persa davvero, o solo gente che non accetta i
cookie? Dammi **una query sola**, e poi leggiamola insieme.

**2. Il PDF dello stato di avanzamento (SAL).** Deve dire: numero e data,
il periodo, le righe con quantità eseguita e importo, il maturato, quello già
chiesto, la ritenuta di garanzia, e la cifra da pagare.

**3. L'errore JavaScript sulla homepage.** Con F12 → Console:
`Uncaught SyntaxError: Identifier 'PAGINE_REGISTRAZIONE' has already been
declared (at assistente-trovaimpresa.js:1:1)`. Nei file compare **una volta
sola** — controllato. La seconda copia la mette qualcun altro, quasi
sicuramente l'iniezione di Netlify, la stessa strada del pixel. **Guarda lì,
non nel codice.**

**4. Il prezzo nuovo sul sito.** Quattro pezzi, e il terzo è il più grosso:
   a) le pagine `prezzi.html`, `info-premium.html`, `info-free.html` — da 49 €
      l'anno a 29 € al mese o 249 € l'anno;
   b) il riquadro nei quattro pannelli che dice alle 87 imprese che il
      gestionale è aperto ed è compreso nei loro tre mesi;
   c) **il pagamento mensile su Stripe** — oggi c'è solo l'annuale, e un
      abbonamento ricorrente è un'altra cosa da costruire;
   d) l'avviso del prezzo nuovo dentro il pannello, prima che scadano i tre
      mesi di regalo delle imprese di luglio.

**Poi, in ordine libero:** l'analisi dei prezzi (lavori pubblici) · la
descrizione schiacciata a 390 px sui preventivi (`.sheet .prev-riga` a
`1fr 80px 118px 48px`) · il pulsante del prezzario anche in cima all'elenco
delle lavorazioni · il limite di misura su `cv-candidati/registrazioni` · il
conteggio delle richieste di caricamento file.

**Sul sito:** le 95 pagine città vuote in Search Console · l'email vera alle
imprese, mai vista partire da una richiesta reale · il grafico dell'admin, che
vuole `premium_dal` e `gestionale_dal`.

## La pubblicità su Meta

Campagna «Contatti», 30 giorni, →240,66← € spesi: →854← clic pagati
(→0,28← € l'uno), →326← «arrivi» secondo Meta, →44← iscritti.
**Adesso sappiamo che 326 e 44 sono numeri sotto-contati.**

⚠️ Il gruppo di inserzioni è fermo in «Apprendimento»: servono 50 eventi in 7
giorni, ne arrivano ~10. Con →8← € al giorno non ci si arriva.

⚠️ **Ogni modifica a pubblico, creatività, budget o evento fa RIPARTIRE
l'apprendimento da zero.**

**Deciso il 19 agosto:** non toccare la campagna per una settimana e
rimisurare.

## Pulizie

- I preventivi n. 4, 5 e 6 del reparto «progetto casa» sono nati dalle prove:
  si possono eliminare.
- In `imprese` c'è **una riga completamente vuota**: nessun nome, nessuna
  città, niente.

## ⛔ E una cosa da NON fare

**Non spezzare `gestionale-app.html` in venti file.** 20.000 righe in un file
solo si cercano in un secondo, e quel lavoro mi fermerebbe per giorni senza
dare niente a nessuna impresa. Se me lo proponi, la risposta è no.

## Una decisione che resta mia

**L'indirizzo sta nel blocco FACOLTATIVO della registrazione**, e 61 imprese
su 87 non l'hanno scritto: senza indirizzo il pallino resta sulla zona. Non è
un difetto, è una scelta del modulo. **Chiedimelo, non cambiarlo di
iniziativa.**

E i banchi di prova stanno nel tuo contenitore, in `prove/`. **Se non te lo
dico io, non spostarli.**

---

Partiamo dal punto 1: **leggere il contatore delle visite**. Dammi una query
sola, poi la leggiamo insieme.
