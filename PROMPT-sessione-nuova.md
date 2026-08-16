Lavoriamo sul gestionale di TrovaImpresa (gestionale-app.html).

Attiva le skill: trovaimpresa-gestionale, guida-passo-passo,
collaudo-obbligatorio, consigliere-crescita.
Leggi CLAUDE.md prima di toccare qualsiasi cosa: in fondo c'è
"DOVE SIAMO REALMENTE RIMASTI (16 agosto, pomeriggio - il programma AI)".
Lì dentro c'è l'elenco completo dei lavori e le decisioni già prese
(100 crediti al mese, si parte dal Blocco 0).

UN LAVORO SOLO: BLOCCO 0 - CHIUDERE IL BUCO DEI CREDITI AI

Oggi c'è un pulsante "Ricarica 150 crediti - 19 euro" che porta a
ricarica-crediti.html, e quella pagina NON ESISTE. Chi clicca sbatte il muso.
Il resto del sistema crediti invece c'è già (tabella ai_accounts, funzioni
consume_ai_credit e get_ai_status, colonna credits_extra per i crediti
comprati che non scadono).

Le cinque cose da fare, in quest'ordine:

1. SQL: portare quota_per_piano a 100 crediti al mese per il piano che paga
   (oggi dà: base 0, ai 60, ai_pro 300).
2. SQL: una funzione riservata al service_role che aggiunge i crediti
   comprati a ai_accounts.credits_extra.
3. netlify/functions/crea-checkout-crediti.js - pagamento singolo Stripe,
   copiato da crea-checkout-gestionale.js. Tre tagli: 150, 400, 1000 crediti.
4. ricarica-crediti.html - la pagina che manca, con i tre tagli.
5. L'accredito dentro stripe-webhook-abbonamenti.js.

IL PUNTO PIÙ DELICATO, dimmelo se lo vedi anche tu: se il webhook sbaglia,
uno paga e non riceve i crediti. E se Stripe manda lo stesso webhook due
volte (lo fa), non deve accreditare due volte. Voglio la prova del caso che
deve essere RIFIUTATO, non solo di quello che deve funzionare.

REGOLE CHE NON SI VIOLANO

- Le funzioni SQL si provano su un PostgreSQL 16 vero nel container, con lo
  schema ricostruito DAI FILE in sql/, chiavi esterne vere, pg_safeupdate
  acceso e una finta auth.uid() pilotabile. Il 9 agosto una funzione provata
  con 10 scenari è arrivata lo stesso in produzione con due buchi che
  cancellavano dati, perché lo schema di prova non somigliava abbastanza a
  quello vero.
- Rispetta tutte le regole fisse del gestionale (skill
  trovaimpresa-gestionale): mai openSheet() per un form, sempre
  openSheetGrande() a due colonne; colore = stato; tabelle con
  renderTabella(); date con quando(); niente emoji; variabili CSS; ogni
  UPDATE/DELETE verificata con .select('id').
- Prima di toccare qualsiasi file, spiegami cosa hai capito e quali file
  tocchi, e aspetta la mia conferma.
- Io non sono in grado di collaudare il codice: la verifica è tua, sempre.
  Non chiedermi mai di fare da collaudatore. A me tocca solo la prova finale
  a clic, e me la devi servire pronta e numerata.
- Una prova che non diventa rossa sul file rotto non prova niente: si
  controlla nei due versi.
- NIENTE comandi git dalla mia cartella, nemmeno "git status": crea un
  .git/index.lock fantasma che mi blocca i commit per ore.
- Il push lo faccio io. Tu dammi UN blocco solo, pronto da incollare.
- Le query per Supabase scrivimele per l'SQL Editor, dove sono collegato come
  postgres. UNA query alla volta. Se una query deve dirmi qualcosa, me lo dice
  con una RIGA DI RISULTATO, mai con raise notice.
- Non mostrarmi mai una riga di codice da sola nella chat: io incollo quella.
  Dammi sempre il blocco intero.
- Consegna così: scrivi nella mia cartella, mandami il file in chat, controlla
  l'md5 da tutte e due le parti, e dimmi cosa cliccare.
- Le chiavi Stripe stanno nelle variabili di Netlify: non scriverle mai nel
  codice e non chiedermele in chat.
- Parlami in italiano semplice. Ho la dislessia: testo grande, poca confusione.
  Nel gestionale niente testo sotto i 13 px.
- Se hai sbagliato, dimmelo subito e per primo.
- NON aprire gestionale-negozio.html e gestionale-noleggio.html.

ALLA CONSEGNA

Collaudo vero con scheda a spunte: provata la pagina ricarica-crediti.html sul
computer e sul telefono, provato il checkout in modalità test di Stripe,
provato il webhook che arriva due volte (deve accreditare una volta sola),
provato il webhook di un pagamento fallito (non deve accreditare niente),
provato che dopo la ricarica i crediti si vedono davvero nel gestionale.
Spiegato a passaggi numerati, senza gergo.

I banchi stanno in prove/: banco_browser.js (327 controlli, BANCO_SOLO=l3|l4|l5),
banco_sql.py, banco_supporto.py, e i sabotaggi rompi*.py. Aggiungi la tua serie
e la tua rompi_*.py.

DOPO IL BLOCCO 0, NELL'ORDINE (non farli adesso, sono scritti in CLAUDE.md):
Blocco 1 "Controlla i tuoi crediti" - Blocco 2 il bollino "AI" - Blocco 3 il
controllore dei preventivi - poi i quattro lavori di grafica rimasti (sezioni
allineate alle finestre, ricerca unica, "Fattura n. 12/undefined", calendario).

Fammi domande se vuoi, ma semplici e con le risposte già pronte da scegliere.
