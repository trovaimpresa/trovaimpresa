# TrovaImpresa — cose da fare sul gestionale

Aggiornato: 31 luglio 2026

---

## Fatto oggi

- Sistema crediti AI: tabelle, RLS, scalo atomico, blocco a zero crediti
- Edge Function `ai-generate` con rimborso automatico se l'AI fallisce
- Preventivi generati dall'AI, salvati nel gestionale, stampabili in PDF
- Assistente "Come si fa" gratuito, 30 domande/mese, conosce il gestionale
- "Compila con AI" sui moduli Cliente e Lavoro
- Sezione Mezzi e attrezzature, con scadenze collegate allo Scadenzario
- Restyling: palette blu, menu a card in due gruppi, barra superiore
- Sezione Lavori rifatta a tabella con viste (Tutti, In ritardo, Oggi,
  Prossimi, Da incassare, Archivio)
- Grafico spese accumulate contro preventivo dentro il lavoro
- CSS estratto in `css/gestionale.css`

---

## Restyling: stato finale

Il **desktop di `gestionale-app.html` è finito**. Tutte le 11 sezioni
hanno la grafica nuova.

Cosa resta scoperto, in ordine di importanza:

1. **Le card sotto 880px** — le 8 sezioni a tabella hanno un fallback a
   card per il telefono, ed è rimasto quello vecchio (bordo blu, pallini,
   emoji, pulsanti impilati). Conta perché gli operai guardano l'Agenda
   dal cantiere.
2. **Gli altri tre gestionali** — `gestionale-negozio.html`,
   `gestionale-noleggio.html`, `gestionale-operatore.html` non sono mai
   stati toccati. Sono prodotti a sé, non rifiniture.
3. Rifiniture minori: stati vuoti sul ramo "non loggato", emoji nei toast
   (~30 stringhe), emoji fuori dalla tabella dell'iconizzatore, la
   landing di scelta reparto, i form dentro le modali.
4. Codice morto: `jobCard` e `agendaCard`, mai chiamate (~40 righe).

---

## Funzioni: cosa costruire e cosa no

Analizzata la lista dei moduli degli ERP italiani (Zucchetti,
TeamSystem). **Quasi tutto è fuori mercato per un artigiano.**

### Mai costruire
Produzione e MRP, distinta base, WMS e picking, integrazione corrieri,
paghe e contributi, contabilità generale con piano dei conti, pipeline
CRM, gamification del magazzino. Il cliente non ha nulla di tutto
questo, e ogni voce di menu in più è una persona in meno che capisce
il prodotto.

### Il buco vero: la fattura elettronica
Oggi il gestionale fa "PDF di cortesia". In Italia una fattura B2B senza
XML inviato allo SdI non è una fattura, quindi il cliente rifà tutto
altrove. Finché è così è un'agenda evoluta, non un gestionale — ed è il
motivo per cui è difficile chiedere 300€/anno.

**Non costruirla:** servono canale accreditato SdI, notifiche di scarto
e conservazione a norma per 10 anni. Si integra un fornitore esistente
via API.

### Tre idee che valgono, e sono già a portata
1. **Cruscotto liquidità a 30 giorni** — dati già presenti (fatture da
   incassare + lavori programmati). Risponde a "riesco a pagare gli
   stipendi il mese prossimo".
2. **Avviso di marginalità nel preventivo** — mentre scrive, l'AI
   confronta con lavori simili già fatti e avvisa se il margine scende.
   Nessun concorrente ce l'ha.
3. **Ricerca in linguaggio naturale** — estende l'assistente esistente:
   "fatture non pagate di Rossi sopra i 1.000 euro" filtra la tabella.

---

## Prossimi lavori, in ordine

### 0. STRIPE — prima di tutto il resto
Il gestionale ha funzioni AI che nessuno può comprare. La modale dei
piani porta a una pagina che non incassa. Ogni altra funzione è teoria
finché non si sa se qualcuno paga 299€.

### 1. Propagare la tabella alle altre sezioni
Preventivi, Fatture, Mezzi, Scadenzario, Condomini, Squadra.
Da fare con una funzione `renderTabella(config)` riusata da tutte,
non sei implementazioni separate.
**In Squadra i pulsanti sono ancora impilati in colonna: è il caso peggiore.**

### 2. Dividere il JavaScript
Come già fatto col CSS. Dopo questo ogni modifica costa una frazione.
Attenzione: il codice sta in una funzione chiusa e `window.AI` deve
restare raggiungibile dall'esterno. Ordine di caricamento da rispettare.

### 3. Mappa e distanza dall'ufficio  ← RICHIESTA DA ALEX
Mostrare per ogni lavoro:
- la mappa del cantiere (c'è già il pulsante "Mappa", va integrato meglio)
- i **chilometri di distanza dall'ufficio** e il tempo di viaggio

A cosa serve davvero:
- calcolare il costo di trasferta da mettere nel preventivo
- assegnare il lavoro all'operatore più vicino
- raggruppare i lavori della giornata per zona invece che a caso

Da valutare: serve l'indirizzo dell'ufficio nei Dati azienda, e un
servizio di calcolo distanze. Verificare i costi prima di scegliere:
alcune API di mappe si pagano a chiamata e su un gestionale con molti
clienti la bolletta può crescere in fretta.

### 4. Stripe per i piani AI
Riusare `crea-checkout-gestionale` esistente, non costruirne un secondo.
Tre cose da non sbagliare:
- verificare la firma Stripe nel webhook
- mettere la service role key nelle variabili Netlify (`set_plan` è
  ristretta e non funziona con la anon key)
- gestire la disdetta: su `customer.subscription.deleted` il piano
  torna a `base`, altrimenti chi disdice continua a consumare a tue spese

### 5. Video nella Galleria
Attenzione allo spazio: il piano free di Supabase dà 1 GB.
Servono un limite di dimensione per file, una quota per cliente e un
controllo sul consumo, prima di attivarli.

---

## Cose piccole rimaste in sospeso

- **Maiuscole nei dati estratti dall'AI**: la correzione è pronta nel file
  `ai-generate-index.ts` ma non è mai stata deployata su Supabase
- **Data nel form Spese**: oggi la mette il database a "oggi". Se registri
  una fattura di tre settimane fa, il grafico del cantiere la piazza nel
  giorno sbagliato
- **Ordinamento per importo** nella vista "Da incassare": vedere per primo
  chi deve di più
- **Emoji residue** da sostituire con icone SVG
- **Etichette poco chiare**: farsi fare l'elenco da Claude Code delle
  parole che non si capiscono senza conoscere il codice

---

## Da mettere al sicuro nel repo

Vivono solo su Supabase, se si perdono vanno riscritti a memoria:

- `sql/01-schema.sql`, `sql/02-functions.sql`, `sql/03-assistente.sql`
- `supabase/functions/ai-generate/index.ts` (il codice della Edge Function)

---

## Grafici decisi ma non ancora fatti

Massimo tre nel Report, oltre diventano rumore:

1. Incassi e spese per mese, 12 mesi, con la linea del margine
2. **Soldi in arrivo nei prossimi mesi** — non c'è ed è il più utile:
   risponde a "riesco a pagare gli stipendi tra due mesi"
3. Guadagno per lavoro (c'è già, va lasciato)

Niente torte, niente grafici per operatore: belli da vedere, non
cambiano nessuna decisione.

---

## Numeri di riferimento

- Costo reale AI: **0,0066 € a preventivo** (misurato, non stimato)
- Piano AI 299€/anno con 150 crediti/mese → **92% di margine** nel caso
  peggiore, cioè con il cliente che li brucia tutti ogni mese
- Il concorrente del capo di Alex: **700 €/anno**, e il cliente non
  riesce a usarlo perché l'assistenza è una persona sola, lenta e poco
  chiara. È lì il vantaggio competitivo, più che nelle funzioni.
