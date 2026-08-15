Lavoriamo sul gestionale di TrovaImpresa (gestionale-app.html).

Attiva le skill: trovaimpresa-gestionale, guida-passo-passo,
collaudo-obbligatorio, consigliere-crescita.
Leggi CLAUDE.md prima di toccare qualsiasi cosa, in fondo c'e' "DOVE SIAMO
RIMASTI (15 agosto, sera - seconda tornata)": il Lavoro 1 del Riepilogo e'
gia' fatto e in produzione.

UN LAVORO SOLO: LA SCHEDA COMPLETA ("Report completo")

Dentro il Riepilogo, insieme alle altre schede, ci deve essere una sua card
personale che si chiama "Report completo". Cliccandola si apre un report
completo di tutto il reparto in una pagina sola.

Come deve essere:

- Tutte le sezioni gia' aperte, con il loro contenuto vero, una sotto
  l'altra. Fuori il Cestino e fuori "Cosa ti manca?" / "Chiedi una funzione".
- Le sezioni vuote non si mostrano.
- Tutto in SOLA LETTURA: niente pulsanti per modificare, niente menu "...",
  niente caselle da compilare.
- Non si modifica a mano: si aggiorna DA SOLO perche' legge gli stessi dati e
  usa le stesse funzioni di calcolo delle sezioni vere. Se cambio una regola
  in una sezione, il report deve dire subito il numero nuovo.
- Due pulsanti in cima: "Crea PDF" e "Stampa". La stampa deve uscire pulita:
  niente menu laterale, niente barre, in modo che diventi un foglio da
  portare in riunione o dal commercialista.
- NIENTE grafico per adesso: lo facciamo in un secondo momento.
- NIENTE interruttore "nascondi importi": non serve a nessuno.
- Niente librerie esterne pesanti. jsPDF c'e' gia' nel file e si carica solo
  quando serve.

REGOLE CHE NON SI VIOLANO

- Rispetta tutte le regole fisse di gestionale-app.html (skill
  trovaimpresa-gestionale): colore = stato, tabelle con renderTabella() mai
  card, date con quando(), niente emoji, variabili CSS, azioni nel menu "...",
  ogni UPDATE/DELETE verificata con .select('id').
- Questo lavoro NON tocca il salvataggio dei dati: e' tutta visualizzazione.
  Non modificare le funzioni che scrivono su Supabase.
- Il rischio vero, dimmelo se lo vedi: se riscrivi da capo il modo di
  mostrare fatture, preventivi e computi, quella diventa una SECONDA COPIA.
  Fra un mese cambio una regola in una sezione e il Report completo continua a
  dire il numero vecchio - su un foglio che porto in riunione. Usa le stesse
  funzioni, e mettici una prova che confronta i numeri del Report completo con
  quelli delle sezioni vere.
- Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file
  tocchi, e aspetta la mia conferma.
- Io non sono in grado di collaudare il codice: la verifica e' tua, sempre.
  Non chiedermi mai di fare da collaudatore. A me tocca solo la prova finale a
  clic, e me la devi servire pronta e numerata.
- Una prova che non diventa rossa sul file rotto non prova niente: si controlla
  nei due versi.
- NIENTE comandi git dalla mia cartella, nemmeno "git status": crea un
  .git/index.lock fantasma che mi blocca i commit per ore.
- Il push lo faccio io. Tu dammi UN blocco solo, pronto da incollare.
- Le query per Supabase scrivimele per l'SQL Editor, dove sono collegato come
  postgres. UNA query alla volta. Se una query deve dirmi qualcosa, me lo dice
  con una RIGA DI RISULTATO, mai con raise notice.
- Non mostrarmi mai una riga di codice da sola nella chat: io incollo quella.
  Dammi sempre il blocco intero.
- Consegna cosi': scrivi nella mia cartella, mandami il file in chat, controlla
  l'md5 da tutte e due le parti, e dimmi cosa cliccare.
- Parlami in italiano semplice. Ho la dislessia: testo grande, poca confusione.
  Nel gestionale niente testo sotto i 13 px.
- Se hai sbagliato, dimmelo subito e per primo.
- NON aprire gestionale-negozio.html e gestionale-noleggio.html.

ALLA CONSEGNA

Collaudo vero con scheda a spunte: provata la card nel Riepilogo, provato il
report con poche sezioni piene e con tante, provato che e' davvero solo
lettura (nessun pulsante di modifica, nessun menu "..."), provati "Crea PDF" e
"Stampa", e provato che i numeri del report sono uguali a quelli delle sezioni
vere. Spiegato a passaggi numerati, senza gergo.

I banchi stanno in prove/: banco_browser.js (327 controlli, BANCO_SOLO=l3|l4|l5),
banco_sql.py, banco_supporto.py, e i sabotaggi rompi*.py. Aggiungi la tua serie
(l6) e la tua rompi_l6.py.

Fammi domande se vuoi, ma semplici e con le risposte gia' pronte da scegliere.
