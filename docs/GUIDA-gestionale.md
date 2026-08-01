# Il gestionale TrovaImpresa — guida a quello che è stato costruito

Scritto il 1 agosto 2026, dopo due giornate di lavoro.
Serve a capire *come funziona* e soprattutto *perché è fatto così*,
per poterci mettere mano tra sei mesi senza ricostruire tutto a memoria.

---

# PARTE 1 — Il sistema AI a crediti

## L'idea

Un solo gestionale, con le funzioni AI che si sbloccano pagando.
Non due prodotti separati: due codebase da mantenere da solo sono
il doppio dei bug e il doppio dei deploy.

Con lo sblocco a pagamento hai anche un vantaggio commerciale: chi è sul
piano base **vede** i pulsanti AI con il badge PRO. È pubblicità gratuita
che sta dentro il prodotto, tutti i giorni.

## Come funziona, in tre pezzi

### Pezzo 1 — Il database (Supabase)

Tabella `ai_accounts`, una riga per utente:

| colonna | a cosa serve |
|---|---|
| `plan` | `base`, `ai`, `ai_pro` |
| `monthly_quota` | quanti crediti al mese dà il piano |
| `credits_used` | quanti ne ha già usati questo mese |
| `credits_extra` | crediti comprati con le ricariche |
| `period_start` | primo del mese corrente |
| `help_used` | domande gratuite all'assistente già fatte |

**Regola importante:** la quota mensile **non si accumula**. Se non usi i
crediti di luglio, ad agosto riparti da capo. I crediti *comprati* con le
ricariche invece restano per sempre.

Il motivo: senza questa regola un cliente accumula 700 crediti in un anno
e poi te li brucia tutti in un giorno.

### Pezzo 2 — Lo scalo dei crediti (funzione SQL)

`consume_ai_credit()` fa quattro cose in ordine:

1. **Blocca la riga** dell'utente (`SELECT ... FOR UPDATE`)
2. Azzera i crediti se è iniziato un mese nuovo
3. Controlla se ce ne sono abbastanza — se no, ritorna `no_credits`
4. Scala prima dalla quota mensile, poi dalle ricariche

Il punto 1 è il cuore di tutto. Senza il blocco, un utente che manda
venti richieste insieme le vedrebbe passare tutte scalando un credito
solo. Con il blocco, le venti richieste si mettono in fila e vengono
servite una per volta.

### Pezzo 3 — La Edge Function (il server)

`ai-generate` su Supabase. La sequenza è questa:

```
1. Chi sei?          -> verifica il token dell'utente
2. Cosa vuoi?        -> controlla che la funzione richiesta esista
3. Puoi permettertelo? -> scala il credito PRIMA di chiamare l'AI
4. Chiama l'AI
5. Se l'AI fallisce  -> RIMBORSA il credito
6. Registra il costo reale in euro
```

Il punto 3 è l'ordine che conta: si scala prima, si spende dopo. Al
contrario, chi manda richieste in parallelo ti farebbe pagare venti
chiamate scalandone una.

Il punto 5 evita di far pagare al cliente un errore tuo.

## Perché non si può fregare

| Come uno proverebbe | Cosa lo ferma |
|---|---|
| Cambiare i crediti dalla console del browser | RLS: nessuna regola di modifica per l'utente |
| Chiamare la funzione senza pagare | Il controllo crediti gira prima dell'AI |
| Venti richieste insieme con un credito | Il `FOR UPDATE` le mette in fila |
| Rubare la chiave dell'AI | Non è mai nel browser, sta nei segreti Supabase |
| Usare la tua AI per altro | Le istruzioni sono fisse sul server, l'utente manda solo il testo |
| Attivarsi il piano Pro da solo | `set_plan` è ristretta al ruolo di servizio |

**La cosa più importante da ricordare:** Supabase, quando crei una
funzione, la rende eseguibile a *tutti* per impostazione predefinita.
Va tolto il permesso a mano. Senza quel passaggio, chiunque si sarebbe
attivato il piano Pro gratis scrivendo una riga nella console.

---

# PARTE 2 — Le funzioni AI

## Quelle a pagamento (costano crediti)

**Preventivo** — descrivi il lavoro a parole, l'AI scrive le voci di
costo con quantità e prezzi. Poi lo salvi tra i tuoi preventivi come
bozza, lo correggi e lo stampi in PDF con la tua intestazione.

**Compila cliente** — scrivi *"Condominio Le Betulle, via Verdi 12
Milano, amministratore Rossi, 02 1234567"* e l'AI riempie i quattro campi
del modulo.

**Compila lavoro** — scrivi *"Giovedì prossimo taglio siepe da Le
Betulle, ci va Marco, 350 euro"* e l'AI riempie descrizione, data,
operatore, importo.

## Quella gratuita

**Assistente "Come si fa"** — 30 domande al mese per tutti, anche sul
piano base. Risponde a "come aggiungo un cliente?" nominando i pulsanti
veri del tuo gestionale.

**Perché gratis:** costa 5€ all'anno su 40 clienti. Un cliente che
capisce il gestionale non disdice, e chi lo usa poi vede le funzioni a
pagamento. È il tuo anti-abbandono, non un centro di costo.

## La regola che non va rotta mai

**L'AI non scrive mai nel database.**

Genera, riempie il modulo, e poi si ferma. È l'umano che preme Salva, e
il salvataggio lo fa il codice che c'era già.

Se l'AI scrivesse da sola sarebbe più magica per due settimane, finché
non assegna un lavoro al cliente sbagliato e passi una serata a capire
cosa è successo.

## I costi veri, misurati

| | |
|---|---|
| Costo di un preventivo generato | **0,0066 €** |
| Piano AI (299€/anno, 150 crediti/mese) | costo massimo 12 €/anno |
| Margine nel caso peggiore | **92%** |

"Caso peggiore" vuol dire con il cliente che brucia ogni singolo credito
ogni mese. Nella realtà si sta sul 20-40%.

Il numero si controlla con la vista `ai_margini_mensili`. **Se il costo
medio per operazione supera 0,08€, qualcosa è cambiato e va guardato.**

---

# PARTE 3 — Il restyling

## Il problema di partenza

Non era brutto: era **incoerente**. Verde nell'header, blu sui pulsanti,
giallo su "Esporta", emoji ovunque. E il contenuto viveva in un terzo
dello schermo.

Per un gestionale l'estetica non è vanità. È il segnale che i dati
dell'azienda sono al sicuro. Chi vede le emoji pensa "app fatta in casa"
e non ci carica sopra la contabilità.

## Le regole che sono state fissate

### 1. Il colore significa qualcosa

Un solo colore di marchio: il blu. Gli altri colori **solo per
comunicare uno stato**:

| colore | significa |
|---|---|
| verde | fatto, pagato, disponibile |
| ambra | in attesa: da fare, da incassare, in scadenza |
| rosso | **problema vero**: in ritardo, scaduto, in perdita |
| blu | in corso |

**La regola del rosso è la più importante:** rosso solo se sei in
ritardo, non se c'è del lavoro. Un lavoro previsto per giovedì prossimo
è normale, non un allarme.

Se tutto ciò che è normale è rosso, quando qualcosa è davvero in ritardo
non te ne accorgi più. È lo stesso motivo per cui le spie dell'auto non
sono tutte rosse.

Il rosso oggi appare solo su: lavori in ritardo, utile e margine
negativi, scadenze passate, azioni che cancellano.

### 2. Tabelle, non card

Le card sono un formato da telefono: grandi, poche informazioni, tanto
spazio sprecato. Su un monitor da 1700px in ufficio un gestionale serio
mostra **una tabella**: venti lavori in un colpo d'occhio invece di tre.

Questa è probabilmente la scelta che ha cambiato di più l'impressione
generale, più dei colori.

Tutte le sezioni a elenco usano **una funzione sola**,
`renderTabella(config)`. Una sola implementazione da correggere quando
qualcosa non va, non otto.

### 3. Le viste sono domande, non stati del database

I filtri non si chiamano più "Da fare / Fatti", ma:

**Tutti · In ritardo · Oggi · Prossimi · Da incassare · Archivio**

Chi apre il gestionale la mattina non pensa "vediamo i record in stato
da_fare": pensa *"cosa sono in ritardo?"*.

E "Tutti" deve esserci sempre: le viste servono a filtrare quando ne hai
cinquanta, non a nascondere quando ne hai tre.

### 4. Le date si scrivono in parole

Non "28/07/2026" ma **"3 giorni fa"**, "oggi", "fra 2 settimane". La data
assoluta ti costringe a fare il conto in testa; il gestionale il conto lo
sa già fare. Oltre i 30 giorni torna la data normale.

C'è una funzione sola, `quando()`, usata ovunque.

### 5. Le cifre si incolonnano

`font-variant-numeric: tabular-nums` fa sì che 2.800 e 680 finiscano
allineate. È un dettaglio da niente che separa i gestionali veri da
quelli fatti in casa: l'occhio confronta gli importi senza sforzo.

### 6. Niente emoji

Le emoji cambiano forma su ogni sistema e nessun software gestionale
serio le usa. Al loro posto icone SVG, 16px, grigie.

### 7. I pulsanti stanno nel menu "..."

Cinque pulsanti per riga per venti righe fanno cento pulsanti a schermo.
Il click sulla riga apre l'elemento, il resto sta nel menu.

---

# PARTE 4 — La sezione Mezzi

Anagrafica di furgoni, piattaforme, attrezzi. Due decisioni di
progettazione che vale la pena capire:

**Le scadenze non sono colonne del mezzo.** Revisione, bollo e
assicurazione si agganciano allo **Scadenzario che c'era già**, con una
colonna `mezzo_id` in più. Così riusano la logica "scaduta / in scadenza
entro 7 giorni" già scritta e collaudata. Zero logica duplicata.

**Più mezzi per lavoro**, con una tabella ponte: un abbattimento usa
piattaforma, motosega e cippatrice, non un mezzo solo.

**La regola dei permessi è stata messa subito**, non dopo: i
collaboratori devono poter *leggere* i mezzi assegnati ma non
modificarli. Su una tabella precedente questa cosa era stata scoperta
dopo, quando la sezione risultava vuota per la squadra.

---

# PARTE 5 — I bug trovati, e cosa insegnano

Questi sono i più istruttivi. Nessuno si vedeva leggendo il codice:
sono usciti tutti provando davvero.

**L'importo `1.000` salvato come 1 euro.** Il punto delle migliaia veniva
letto come virgola decimale. Non era un errore visibile: un preventivo da
mille euro finiva nel database come uno. Te ne accorgi a fine mese
guardando il fatturato e non capendo.
*Lezione: gli errori silenziosi sono peggio di quelli rumorosi.*

**Il lavoro invisibile.** Le viste erano In ritardo / Oggi / Questa
settimana / Archivio. Un lavoro con data oltre domenica non rientrava in
nessuna: il contatore lo contava, la tabella non lo mostrava.
*Lezione: quando dividi in categorie, verifica che la somma torni sempre
al totale.*

**Il contenuto largo un terzo dello schermo.** Un elemento con margini
automatici dentro un contenitore flessibile non si allarga: si stringe
sul contenuto. Il limite di larghezza non c'entrava niente.
*Lezione: misura, non indovinare.*

**Le frecce fantasma.** Sembrava un pulsante dimenticato: era la barra di
scorrimento di Windows, innescata da mezzo pixel di sforamento.

**Il secondo Claude Code aperto sulla stessa cartella.** Due sessioni
scrivevano sullo stesso file e si sovrascrivevano a vicenda.
*Lezione: una sola sessione per cartella.*

---

# PARTE 6 — Dove sta cosa

| Cosa | Dove |
|---|---|
| Tutto il gestionale | `gestionale-app.html` |
| Gli stili | `css/gestionale.css` |
| Il codice AI del frontend | `js/ai-integrazione.js` |
| Le tabelle e le funzioni AI | Supabase → SQL Editor |
| Il cervello dell'AI | Supabase → Edge Functions → `ai-generate` |
| Il manuale che l'assistente conosce | dentro la Edge Function |

**Da mettere al sicuro:** lo schema SQL e il codice della Edge Function
vivono solo su Supabase. Se si perdono vanno riscritti a memoria.

---

# PARTE 7 — Come attivare un piano a mano

Finché Stripe non c'è, si fa da Supabase → SQL Editor:

```sql
-- attiva il piano AI a un cliente per 12 mesi
select public.set_plan('UUID-DEL-CLIENTE', 'ai', 12);

-- ricarica 150 crediti dopo un pagamento
select public.add_credits_pack(
  'UUID-DEL-CLIENTE', 150, 19.00, 'bonifico', 'rif-univoco-123'
);

-- vedere quanto ti costa davvero l'AI
select * from public.ai_margini_mensili;
```

Per i primi clienti va benissimo così: dieci secondi di lavoro a testa.

---

# PARTE 8 — Il vantaggio competitivo, in una frase

Il concorrente costa **700€/anno** e risolve il problema "non so usarlo"
con **una persona**: costosa, lenta, non sempre disponibile, che spiega
male.

Tu lo risolvi con un assistente dentro il software, che risponde in tre
secondi, alle dieci di sera, e spiega bene ogni volta. Ti costa **sette
millesimi di euro a domanda**.

Loro non possono copiarti: dovrebbero riscrivere il prodotto.

**Conseguenza sui prezzi:** oggi chiedi 119€/anno contro i loro 700€. Non
sei "l'alternativa economica" — sei il prodotto che funziona a un sesto
del prezzo. Quel divario non ti fa vincere le trattative, ti fa sembrare
un giocattolo.
