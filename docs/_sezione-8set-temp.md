
# 8 SETTEMBRE 2026 — LA PUBBLICITÀ CHE FUNZIONA E LE MAIL CHE NON ARRIVAVANO

Serata partita dai →4← lavori sulla pubblicità rimasti dal →7← set. Uno è stato
**cancellato ragionando** (le categorie), uno **era già fatto** (la mail di
scadenza), gli altri due sono fatti e collaudati. Poi, cercando perché mancava
l'avviso di un'iscrizione, è venuto fuori il difetto più grosso del sito.

→11← commit: →b5c514b← → →1afcc39←.

---

## ⛔ LE CATEGORIE NON SI FANNO — decisione di Alex, e ha ragione lui

Il →7← set era stato deciso di dividere le →106← homepage città in →318←
(artigiani / imprese / professionisti). **Annullato.**

Il ragionamento è suo, parola per parola:
> «il sito non fa ricerca per mestiere ma per citta»
> «nessino vedrebbe la loro inserzione perche chi cerca adesso inserisce
> solamente la citta non anche la categoria»

Chi cerca scrive **solo la città** e finisce su `index.html?citta=X`. Le pagine
`cerca-artigiani` / `cerca-imprese` / `cerca-professionisti` **esistono già e
accettano già `?citta=`** (sono le →318← pagine, non serve creare niente), ma ci
arriva solo chi clicca una card in più. Vendere spazi lì = vendere posti che
quasi nessuno vede.

**La causa non è la pubblicità, è la RICERCA.** Finché la barra chiede solo la
città e non il mestiere, la pubblicità per categoria non è vendibile. Il lavoro
che sbloccherebbe tutto è aggiungere il mestiere alla ricerca — **non deciso**.

⚠️ **Claude aveva proposto le →3← pagine di ricerca senza chiedersi da dove
arriva il traffico.** Alex l'ha smontata due volte prima che capisse.

---

## FATTO E COLLAUDATO

**1. Sul telefono chi ha pagato adesso si vede** (→b5c514b←)
Era il buco più grosso: sotto i →1100← px il cartello spariva, e Service House
pagava restando invisibile a metà dei visitatori. Ora entra dentro la pagina,
largo quanto lo schermo, **subito dopo la sezione a cui è ancorato sul
computer** (scelta di Alex fra →3← anteprime: «e troppo in alto cosi» sulla
posizione in cima). La soluzione esisteva già dal →6← set in `spazi-laterali.js`
(`.ti-spazio-tel`) ma non era stata portata nel file nuovo.

Misure vere: servono →140← px liberi per lato. A →1280← px ce ne sono →117←
(non si vede), a →1366← →160←, a →1920← →437←.

**2. Le →14← locandine nelle pagine città** (→de9f826←)
Niente più spazi vuoti: gli spazi liberi mostrano le locandine di TrovaImpresa,
le stesse della home nazionale. **Sul telefono NO**: lì va solo chi paga
(«giusto sul telefono solo i paganti»).

**3. L'ELENCO UNICO — `js/spazi-elenco.js`** (→52a24d6←)
Il difetto di fondo del →7← set è chiuso. Un solo file dice, per ognuno dei →10←
spazi: prezzo, misura, in quale pagina va, e la frase che legge il cliente.
Lo leggono `pubblicita.html` (listino, prezzi, misure, fasce), `spazi-citta.js`
(quali cartelli mostrare) e `spazi-laterali.js` — che **non legge più il
`data-spazi` incollato nell'HTML**.
→18← prove passate: su `imprese-<citta>.html` e sulle pagine mestiere+città
l'elenco risponde «nessuno spazio», quindi il caso dei →161← non si ripete.

**4. I cartelli mostrano di essere cliccabili** (→52a24d6←, →3e81647←)
Ombra + immagine che si ingrandisce del →4%← dentro il riquadro, più una
freccina ↗ in un angolo. Nessuna scritta sopra la grafica del cliente.
Nasce da una domanda di Alex: «come fanno le perosne a sapere che devono
cliccare?» — non lo sapeva nemmeno lui.

**5. Viste e clic** (→3e81647←, →8483c15←, →fc4c5ab←)
Tabella `annunci_statistiche` (una riga per annuncio per giorno) + funzione
`conta_annuncio(uuid, 'vista'|'clic')` security definer, che conta **solo**
annunci pagati e non scaduti. RLS: le statistiche le legge solo il proprietario.
Mostrati al cliente in `le-mie-inserzioni.html` (due riquadri, ultimi →30← gg) e
ad Alex nell'admin (colonna Visto/Clic con la percentuale), letti lato server da
`netlify/functions/admin-statistiche-pubblicita.js` per non aprire i numeri dei
clienti a chiunque.

**6. Un padrone solo per pagina** (→4acad26←)
Nella pagina città gli spazi li riempie **solo** `spazi-citta.js`.
`pubblicita-spazi.js` scrive la città e si ferma.

**7. Piccoli** (→e69a846←): listino corretto, spia admin a →7← giorni, riga di
prova di Agrigento cancellata (contenuto salvato prima).

**8. Recensioni del sito** (→eaf5aef←): la pagina diceva «→5← recensioni» e ne
mostrava →1←. Ora chi ha nome o commento ha il suo riquadro, gli altri stanno in
una riga «Altri →3← voti». Nome obbligatorio per votare.

---

## ⛔ IL DIFETTO PIÙ GROSSO: LE CONFERME FINIVANO IN SPAM (→1afcc39←)

Partito da una domanda di Alex: la dashboard diceva →4← iscritti, la sua casella
ne aveva →3←.

- **→24← imprese su →127← (il →19%←) non hanno MAI confermato l'email.** Non
  possono entrare nel pannello, non ricevono richieste, ma risultano iscritte
- Alex aveva già sollecitato il →5← set alle →22:36←-→22:38← a →22← di loro:
  **→0← aperture, →0← clic, nessuno mai entrato.** Zero su ventidue
- **CAUSA**, dagli Insights di Resend: «Ensure link URLs match sending domain».
  La mail partiva da `info@trovaimpresa.com` ma il pulsante portava a
  `nacvrsgkyfavykxjxszu.supabase.co`. Per Gmail/Libero/Yahoo/Virgilio è la firma
  del phishing: consegnavano (Delivered) e mettevano in spam
- Tutto il resto era già a posto: DMARC valido, immagini sul dominio, versione
  testo, dimensione

**RIPARATO**: nuova pagina `conferma.html` (riceve `token_hash`, chiama
`supabase.auth.verifyOtp`). Tre stati: attesa, «Profilo attivato», e «Questo
link non vale più» con la casella per farsi rimandare il link **da soli**.
Nel modello Supabase (Authentication > Emails > Confirm signup) Alex ha
sostituito a mano `{{ .ConfirmationURL }}` con
`https://trovaimpresa.com/conferma.html?token_hash={{ .TokenHash }}&type=email`.

⚠️ Il collegamento MCP Supabase **non** può toccare la configurazione Auth: solo
il database. I modelli email li cambia Alex a mano.

**PROVA**: la mail rimandata a Elhediny alle →20:43← ha «Insights →1←» invece di
→2←: la segnalazione sul dominio del link è sparita.

**Fatto poi**: rimandate **tutte e →24←** le conferme, una per una, con il link
personale. →24← su →24← partite, zero errori.

---

## ⛔ LA QUOTA EMAIL — perché il →7← set non partiva più niente

Resend, piano **FREE: →100← email al giorno**.
Il →7← set alle →07:02← è partita la campagna a **→96←** imprese + →2← prove =
→98←. Per il resto della giornata **nessuna email del sito è partita**. Il →3←
set stessa cosa con →89←.

**Da decidere**: piano a pagamento (~→20←$/mese, →50.000← email) oppure spezzare
le campagne (→40← al giorno). Le email di servizio non devono mai essere
sacrificate a una promozionale.

⚠️ La campagna del →7← set diceva a →96← imprese «Nella ricerca imprese — →12←€»,
cioè la frase sbagliata corretta stasera. La prossima deve dire «Nella pagina
della tua città, accanto a "Scegli la categoria"».

---

## I CLIENTI, A FINE SERATA

| Chi | Cosa | Stato |
|---|---|---|
| **Service House** (Torino) | `imprese-dx`, →12←€, →1← mese | pagato, scade →7/10←. Incasso vero: →11,03←€ (Stripe trattiene →0,97←, l'→8%←), sul conto il →14/09← |
| **Bolis Luigi** (Firenze) | `profilo-sx-1`, →13,50←€, **→3← mesi** | ⚠️ **NON pagato**: ordine delle →20:02←, immagine caricata, fermo su Stripe. Da richiamare al →335 388989← |
| **Gabriele** (Roma) | `hero-sx`, →20←€ | scaduto il →23/08← |

**Sulla commissione Stripe**: c'è una quota fissa (~→0,25←€) che non cambia con
l'importo. Su →5←€ pesa il →12%←, su →12←€ l'→8%←, su →13,50←€ il →7%←. Motivo in
più per spingere i periodi lunghi e i pacchetti.

---

## ⛔ ERRORI DI CLAUDE IN QUESTA SESSIONE, DA NON RIPETERE

- **Proposte le →3← pagine di ricerca senza chiedersi chi ci arriva.** Alex ha
  dovuto smontarla due volte
- **L'effetto al passaggio del mouse usava `translateY`**: i due hero sono
  centrati con `translateY(-50%)` e l'effetto glielo sostituiva, facendoli
  crollare di →170← px. Segnalato da Alex, corretto muovendo l'immagine dentro
  al riquadro invece del riquadro
- **Non previsto che `pubblicita-spazi.js` sovrascrivesse le locandine**: erano
  in due a decidere. Trovato da Alex guardando la pagina
- **Dato per scontato che `.guide-costi-home` e `.why-section` non esistessero**
  nella pagina città: c'erano, e mancavano →4← locandine
- **`IntersectionObserver` non risponde sulla pagina vera**: il clic si contava,
  la vista no. Trovato SOLO col collaudo dal vivo, sostituito con un controllo
  diretto ogni →500← ms
- **Spiegazione sbagliata sulla mail mancante** (detto «non ha confermato», i
  dati dicevano il contrario) e **stima sbagliata della commissione Stripe**
  (→0,43←€ invece di →0,97←)

**La regola che ha funzionato**: aprire la pagina e guardarla. Tutti e →4← i
difetti veri sono usciti da lì, non dal codice.

---

## NON RISOLTO — DA FARE

1. **Richiamare Bolis Luigi** (→335 388989←): fermo sul pagamento
2. **Contare quanti dei →24← si attivano** dopo le conferme rimandate stasera
3. **Decidere sul piano Resend** (→100←/giorno non bastano più)
4. **La seconda segnalazione di Resend**: «Don't use no-reply» — non guardata
5. **Casella «iscritti fermi a metà» nell'admin**: stasera il →19%← è saltato
   fuori per caso. Se fosse in dashboard, si vedrebbe salire
6. **Promemoria per chi resta "non pagato"** su Stripe: →2← clienti in →2← giorni,
   uno perso all'ultimo clic
7. **Il messaggio verde in `conferma.html`** si vede poco: Alex ha creduto che
   non avesse funzionato
8. **Le →3← descrizioni del listino** ancora imprecise (hero «sopra ai
   risultati»; inserzioni e profilo si vedono in due pagine)
9. **La ricerca per mestiere** — il lavoro che sbloccherebbe le categorie
10. **Generatore di locandina** nel modulo d'acquisto: chi non ha un'immagine
    bella non compra, e quella di Service House è brutta (Alex: «la sua e
    veramente brutta»). Da regalargliela, ma proponendola, non cambiandola
11. **Pacchetto "più città"**: →12←€ per la sola Torino sono pochi per lui e per
    il cliente
