# Memoria progetto — TrovaImpresa

## Come lavoriamo (IMPORTANTE)
- Modalità **Cowork**: Claude modifica i file direttamente nella cartella. Non servono prompt per Claude Code.
- **Il `git push` lo fa Alex** dal suo Git Bash. Claude NON deve tentare il push dal proprio ambiente: fallisce sempre.
- Motivo: nell'ambiente di Claude la cartella `.git` è vista tramite un mount con cache "congelata", che mostra un `index.lock` **fantasma** già rimosso lato Windows. Non è un problema reale sul PC di Alex — i suoi push funzionano regolarmente.
- Quindi: dopo aver modificato i file, dare **subito** ad Alex il blocco pronto da incollare (`git add ... / git commit -m "..." / git push`), senza tentativi a vuoto. Ad Alex di norma non serve `rm -f .git/index.lock`.
- Deploy: Netlify pubblica in automatico a ogni push su `main`.

## Preferenze di Alex
- Rispondere **in italiano**, in modo semplice e pratico, conciso.
- Soluzioni pronte da copiare/incollare, poca teoria.
- Alex è **solo founder e sviluppatore** (HTML/CSS/JS, Supabase, Netlify). Email: pintoalessio@icloud.com.

## Stile email di Alex (per le mail agli iscritti)
- Tono **caldo, personale, in prima persona singolare** ("ho deciso di attivare", "sarei lieto", "Resto a disposizione").
- Apertura: "Gentile [Nome]," poi "grazie per esserti iscritto a TrovaImpresa.com".
- Spesso include un **regalo/incentivo**: Piano Premium 3 mesi gratis.
- Sottolinea **visibilità** e **contatto con potenziali clienti**.
- Chiusura fissa: "Un cordiale saluto, Il Team di TrovaImpresa.com".
- Mittente: info@trovaimpresa.com. Colori brand: blu #0066ff, blu scuro #0a2a4d, viola Premium #7b1fa2.
- Template pronto: `email-completa-profilo.html` (versione HTML impaginata).

## Stack e ambiente
- Repo GitHub `trovaimpresa/trovaimpresa`, branch `main`.
- Netlify: `NODE_VERSION = "22"` in `netlify.toml`.
- `@supabase/supabase-js` **bloccato a 2.39.8** in package.json: le versioni più recenti richiedono Node 22 / WebSocket nativo e rompono le Netlify Functions con l'errore "native WebSocket not found". Non sbloccare il `^`.
- Supabase project: `nacvrsgkyfavykxjxszu`.

## TRAPPOLE NOTE (leggere prima di scrivere codice)

### 1. Gli id sono UUID: negli `onclick` vanno SEMPRE fra apici
Le tabelle usano id **UUID**, non interi. Scrivere l'id in un handler inline senza apici
produce JavaScript non valido e **il pulsante muore in silenzio**:

```js
// SBAGLIATO -> onclick="elimina(4a3f9b2c-58cc-4372-a567-0e02b2c3d479)"
//              "0e02b2c3d479" non e' un numero valido -> Uncaught SyntaxError
'<button onclick="elimina(' + x.id + ')">'
`<button onclick="elimina(${x.id})">`

// GIUSTO
'<button onclick="elimina(\'' + x.id + '\')">'
`<button onclick="elimina('${x.id}')">`
```

Sintomo: `Uncaught SyntaxError: Invalid or unexpected token` a `nomepagina:1`, e il clic non fa
nulla. Corretto in `admin.html` (11 pulsanti) a luglio 2026. Meglio ancora: `data-id` +
un solo event listener sul contenitore, come in `le-mie-inserzioni.html`.

Corollario: **mai `parseInt()` su un id**. Su un UUID che inizia per "4" restituisce 4 e
manda tutto fuori strada. Confrontare sempre con `String(a) === String(b)`.

### 2. Scritture admin: mai con la chiave anon
`imprese` ha RLS con scrittura riservata al proprietario (`user_id = auth.uid()`, ruolo
`authenticated`). Il pannello admin usa la chiave **anon senza sessione**: PostgREST non
restituisce errore quando RLS blocca una UPDATE, aggiorna **zero righe** e risponde OK.
Risultato: pulsanti che sembrano funzionare e non scrivono niente.

Tutte le scritture admin passano da `netlify/functions/admin-dati.js` (verifica password
lato server, scrive con `service_role`) tramite l'helper `adminWrite()` in `admin.html`.
La function restituisce `count` = righe toccate: se e' 0 il pannello avvisa.
Tabelle in whitelist: `feedback_clienti, segnalazioni, subappalti, imprese, preventivi, lead_imprese`.

### 3. Verificare che una scrittura sia andata a buon fine
Aggiungere sempre `.select('id')` a UPDATE e DELETE e controllare che tornino righe.
Senza, una scrittura bloccata da RLS e' indistinguibile da una riuscita.

## Pannelli
- 5 pannelli: `pannello-impresa`, `pannello-artigiano`, `pannello-professionisti`, `pannello-negozio` (le 4 categorie business) + `pannello-candidato`.
- Modal "Genera preventivo con AI": stile `.modal-ai` a tutta pagina (fullscreen), header chiaro. Funzione AI (generaConAI/generaTestoPreventivo/calcolaPrezzo) uniforme su tutti i 4 pannelli.
- Badge numero preventivi non risposti sulla card "Richiesta di preventivo": presente su **tutti e 4** i pannelli, negozio compreso (verificato luglio 2026 — la vecchia nota "negozio ancora senza" era superata).

## Preventivi (pay-per-lead RIMOSSO — luglio 2026)
- **Nessun pagamento**: l'impresa vede gratis i contatti (email/telefono) delle richieste indirizzate a lei. Rimossi pulsante "Sblocca a 5€", sezione "Richieste dalla tua zona" e i file `crea-checkout-lead.js`, `stripe-webhook-lead.js`, `sql/pay-per-lead.sql`, `sql/condivisione-lead.sql`.
- Le richieste arrivano nella tabella `preventivi`; i pannelli leggono la vista `preventivi_safe` (esclude email/telefono). I contatti si ottengono dalla function `contatto-preventivo.js`, che ora li restituisce a chi ha la richiesta indirizzata (nessun gate di pagamento).
- **ATTENZIONE**: se si aggiungono colonne nuove a `preventivi`, rieseguire il blocco `GRANT SELECT (colonne tranne email/telefono) ON public.preventivi TO anon, authenticated` e ricreare `preventivi_safe`, altrimenti il pannello va in 403 ("permission denied for table preventivi").
- DB: le colonne `sbloccato`, `sbloccato_at`, `stripe_session_id`, `condivisibile` e la tabella `lead_sblocchi` restano ma sono **inutilizzate** (innocue). Si possono rimuovere in un secondo momento se si vuole pulire.
- Env Stripe `STRIPE_WEBHOOK_SECRET_LEAD` non serve più (l'endpoint webhook lead su Stripe si può disattivare).

## Registrazione (rifatta — luglio 2026)
- Il profilo in `imprese` NON si crea più con insert manuale lato frontend: lo crea il **trigger `on_auth_user_created`** (function `crea_profilo_impresa`, security definer) leggendo `raw_user_meta_data`.
- I 4 form (`registrazione-impresa/artigiano/professionista/negozio`) + `attiva-profilo` passano i dati in `signUp({ options: { data: {...} } })` con chiavi ESATTE: `tipo, nome_attivita, nome, telefono, citta, provincia, regione, mestiere` (negozio senza `mestiere`).
- **Solo 8 chiavi** vanno al trigger: i campi extra dei form (descrizione, P.IVA, logo, indirizzo, piano, lat/lng, zone, specializzazioni…) **non vengono più salvati alla registrazione** → vanno completati dal pannello/modifica-profilo dopo la conferma mail.
- Conferma email attiva: dopo `signUp` niente sessione, quindi niente login immediato. Messaggio "controlla la mail (anche SPAM)" e redirect a `login-impresa.html`.
- `login-impresa.html`: dopo il login verifica la riga in `imprese` per `user_id`; se manca → `signOut` + messaggio esplicito (non redirect silenzioso).
- Migliorie UX sui 4 form: validazione per-step, campo "Conferma password", indicatore forza password, honeypot anti-bot (`#website_hp`), banner `#form-msg` al posto degli `alert()`. Testo piano Free corretto (rimosso il vecchio "sblocco contatto 5€").

## Registrazione CANDIDATO (allineata — luglio 2026)
- I candidati NON sono imprese: il profilo va in `candidati_lavoro`, non in `imprese`.
- `registrazione-candidato.html` ora usa `supabaseClient.auth.signUp({ options: { data: {...} } })` (prima usava `fetch` diretto a `/auth/v1/signup` + insert manuale). Il CV si carica **prima** del signUp (usa la chiave anon, non la sessione) e l'URL si passa nei metadata.
- **Serve il trigger DB**: `sql/trigger-candidato.sql` crea `crea_profilo_candidato()` + trigger `on_auth_user_created_candidato`, che inserisce in `candidati_lavoro` SOLO quando `tipo = 'candidato'`. Da eseguire su Supabase (come per imprese).
- **ATTENZIONE**: verificare che `crea_profilo_impresa()` NON crei righe in `imprese` per i candidati → deve filtrare su `tipo in ('impresa','artigiano','professionista','negozio')` (snippet nel file SQL).
- Chiavi passate ai metadata: `tipo, nome, cognome, eta, sesso, mestiere, anni_esperienza, competenze, telefono, regione, provincia, citta, cv` (email da `new.email`).
- Stesse migliorie UX degli altri form (banner, honeypot, strength, validazione step) + messaggio conferma mail e redirect a `login-candidato.html`.
- `login-candidato.html`: dopo il login verifica la riga in `candidati_lavoro` per `user_id`; se manca → `signOut` + messaggio esplicito.

## Pubblicità e inserzioni (luglio 2026)
- La pubblicità è venduta **per città**. `js/pubblicita-spazi.js` (home) e `js/spazi-laterali.js`
  (altre pagine) mostrano un annuncio **solo** sulla città per cui è stato pagato.
  Niente rotazione, niente rilevamento da IP: erano state provate e hanno spalmato
  l'annuncio di Roma su tutte le 106 città. Home nazionale = nessun annuncio venduto,
  solo le locandine di TrovaImpresa (`/img/hero-sx.svg`, `/img/hero-dx.svg`).
- `js/citta-obbligatoria.js`: nessun percorso di ricerca parte senza città. Al clic su una
  categoria si apre un pannello che la chiede; dalla home nazionale si passa **sempre** dalla
  home città (`index.html?citta=X`). La scelta resta in `localStorage` (`ti_citta_scelta`),
  quindi il pannello si vede una volta sola. I link restano `<a href>` veri: Google li segue.
- `le-mie-inserzioni.html`: il cliente cambia da solo locandina e link degli spazi attivi,
  ed elimina quelli scaduti o non pagati. Raggiungibile dai 4 pannelli.
- Colonna `mesi` su `annunci_pubblicitari` (`sql/pubblicita-colonna-mesi.sql`): durata
  acquistata, fonte di verità per prezzo e sconti. Le righe vecchie ricadono sul calcolo
  dalle date e in admin sono marcate "~ stimata".
- `controlla-scadenze-pubblicita.js` gira ogni mattina alle 7: avvisa il cliente 7 giorni
  prima della scadenza **e** manda ad Alex un riepilogo (env `ADMIN_EMAIL`, default info@).

## Ricerca (luglio 2026)
- Lo slider distanza parte da **0 = "Solo la città"**. Prima partiva da 100 ("Qualsiasi"),
  cioè il filtro era di fatto spento.
- Chi non ha lat/lng salvate **non passa** il filtro raggio. Prima `_distKm === null`
  lasciava passare tutti, ed è per questo che cercando Rieti uscivano imprese di Roma.
- **Eccezione Premium**: chi paga il Premium resta visibile in tutta la sua regione a
  qualsiasi impostazione dello slider, ma finisce **in fondo** alla lista con l'etichetta
  "anche nella tua regione" (`_fuoriZona` + `ordinaFuoriZona()`).
- Attenzione: `cerca-artigiani.html` usa `cittaSafe`, gli altri 3 file `cittaScelta`.

## SEO e contenuti (agosto 2026)

### ⚠️ REGOLA D'ORO: rilanciare `genera-imprese-citta.js` dopo ogni gruppo di iscrizioni
Le pagine città mostrano le imprese tramite una **sezione statica** scritta dentro l'HTML
dallo script `genera-imprese-citta.js` (marker `<!-- IMPRESE-LOCALI-START/END -->`).
**Non è dinamica**: se lo script non viene rilanciato, le imprese nuove restano invisibili.

Sintomo: ci sono imprese in `imprese` con quella città, ma la pagina non ha la sezione
"Imprese e artigiani attivi a X". Non è un bug, è solo lo script non rilanciato.

Ad agosto 2026 era fermo da luglio: 46 imprese iscritte e **una sola** pagina città
(Rieti) con contenuto. Rilanciato → **31 pagine città popolate** in un colpo.

Blocco pronto da dare ad Alex:
```bash
cd ~/Downloads/trovaimpresa && node genera-imprese-citta.js && git add -A && git commit -m "Aggiornate imprese citta" && git push
```

**Correlazione osservata**: l'unica pagina città che compariva su Google era l'unica con
imprese vere dentro. Le pagine città senza imprese non si posizionano: sono ~420 parole
identiche + un paragrafo unico sul settore edile locale. Il problema è di **offerta**
(poche imprese iscritte), non di SEO.

### Strategia contenuti: guide sui prezzi
Google ha classificato TrovaImpresa come sito di **prezzi edilizi**, non come marketplace
(298 query, quasi tutte ricerche di costo). La strategia è assecondare: guide "quanto costa"
molto approfondite che portano dentro il marketplace.

- Template riutilizzabile: `docs/TEMPLATE-guida-costi.html` (non pubblicato, sta in docs).
- Struttura di una guida: risposta secca col prezzo in alto, box verde **"Parola di cantiere"**
  (l'esperienza vera di Alex, la firma che i concorrenti non possono copiare), tabelle prezzi,
  ▲ cosa fa salire, ▼ cosa fa scendere, ✎ voci dimenticate, ✕ errori da evitare, calcolatore,
  FAQ + JSON-LD FAQPage, blocco finale "Trova imprese nella tua città".
- **I prezzi si chiedono ad Alex, non si inventano**: 25 anni in cantiere come muratore.
  Se non li sa, si cercano su prezziari/fonti di settore e si fanno confermare da lui.
- Le guide sono **file HTML statici nella root**. La tabella Supabase `blog_articoli` serve
  solo a generare la card nel blog, con `url_esterno` che punta al file statico.
  Per una guida nuova: creare l'HTML + INSERT in `blog_articoli` + voce in `sitemap.xml`
  + card in `costi-ristrutturazione.html`.

### Regole di Alex sulle pagine esistenti
- **NON toccare** title, meta description, canonical, JSON-LD, robots.txt, sitemap delle
  pagine già a posto. Si aggiunge contenuto visibile, non si tocca la testa del file.
- I 7 errori 404 non si sistemano (7 pagine su 848, impatto zero).

### Stato SEO (3 mag – 31 lug 2026)
79 clic totali, di cui **57 di brand** ("trovaimpresa"): SEO vera = 22 clic in 3 mesi.
La homepage prende 67 clic su 79. Le guide fanno 488 impressioni ma CTR 0,8% (posizione
troppo bassa). Dominio di 5 mesi: numeri normali per l'età, non un fallimento.

## Gestionale — come funziona (agosto 2026)

### Documenti allegati: un solo meccanismo, due cassetti
I file finiscono nel bucket **`gestionale-foto`** e la riga va in **`gest_foto`**.
Cosa distingue i gruppi:

- `cliente_id` valorizzato + `tipo='documento'` → documenti di quel **cliente**
  (path `<uid>/clienti/<clienteId>/…`)
- `tipo='doc_commercialista'`, senza cliente_id → documenti per il **commercialista**
  (path `<uid>/commercialista/…`)

Stesso codice per tutti e due: la variabile `docCommAttivo` decide il modo.
Colonne aggiunte: `cliente_id`, `nome_file` (`sql/aggiungi-documenti-cliente.sql`).
L'upload passa da `preparaFileUpload()` di `js/foto-upload.js` (comprime le immagini,
lascia intatti i PDF, limite 15 MB).

### Invio di un documento per email
Function **`netlify/functions/invia-documento-cliente.js`**, con Resend.
- Il file **non passa dal browser**: la function lo scarica dal bucket con la service key.
- Verifica l'`access_token` dell'utente e controlla che la riga `gest_foto` sia sua,
  altrimenti chiunque potrebbe farsi mandare i documenti di un altro cambiando un id.
- Manda al destinatario + copia al mittente, `reply_to` = email dell'utente.
- Limite allegato **10 MB** (la base64 gonfia di un terzo e molte caselle rifiutano oltre).

### Reparto Commercialista
Pulsante di fianco a "Dati azienda", nelle due barre (landing e reparto).
I dati stanno in `gest_azienda`, colonne `comm_*` (`sql/aggiungi-commercialista.sql`):
il commercialista è uno solo per impresa, non serviva una tabella nuova.

**Deciso di NON fare l'invio delle fatture al commercialista.** Motivo: ormai
tutti i commercialisti hanno la **delega al cassetto fiscale**, quindi le fatture
elettroniche se le scaricano da soli dall'Agenzia delle Entrate. Mandargliele
sarebbe roba che hanno già. Quello che invece NON gli arriva sono scontrini,
ricevute di carta e spese di cassa: per quelli c'è la sezione documenti.
Non riproporlo.

### Tipi di cliente
`gest_clienti.tipo` = `privato` | `azienda` | `condominio` (`sql/aggiungi-tipo-cliente.sql`).
Tre pulsanti separati in cima alla sezione (`+ Privato`, `+ Azienda`, `+ Condominio`)
e tre bottoni dentro al modulo per correggere il tipo. Cambiano **solo le etichette**,
mai i campi: nessuno deve restare bloccato se il suo caso è strano.
La sezione si chiama **Clienti** per tutti i mestieri (prima "Condomini / Clienti").
La scheda si apre in **sola lettura** (`cliScheda`), con Modifica e Documenti dentro.

### Aiuti a comparsa (tooltip)
File **`js/aiuti.js`**, una riga sola in fondo a `gestionale-app.html`.
- Le frasi stanno in cima al file: `AIUTI_TAB` (chiave = `data-tab`) e
  `AIUTI_AZIONE` (chiave = `data-action`).
- Per un pulsante qualsiasi basta scrivergli `data-aiuto="frase"` in HTML: vince su tutto.
- **Solo col mouse**, di proposito: su telefono il passaggio sopra non esiste e su
  pulsanti che fanno qualcosa un aiuto al tocco darebbe fastidio.
- Fatti: le 16 voci del menu e i 4 pulsanti della barra. Da fare: le singole schermate.

## TRAPPOLE DEL GESTIONALE (imparate sul campo, agosto 2026)

### G1. Un modulo che si riempie da una lista parziale CANCELLA i dati
`renderClienti()` caricava solo `id,nome,indirizzo,referente,telefono`. `cliCache`
restava quindi senza email, tipo, città, partita IVA, PEC. Aprendo "Modifica" il
modulo si riempiva da quella cache: i campi mancanti risultavano **vuoti**, e al
salvataggio venivano riscritti vuoti nel database. Ogni modifica di un cliente
**azzerava in silenzio** email, tipo e tutti i dati fiscali.

Regola: **se un modulo si riempie da una lista caricata prima, quella lista deve
avere tutti i campi.** Meglio ancora, come ora: alla Modifica si **rilegge la riga
dal database**, senza fidarsi della cache.

Sintomo: salvi, compare "Aggiornato" (nessun errore), ma riaprendo il campo è vuoto.

### G2. Chrome riempie da solo le caselle di ricerca
Le caselle `cli-search`, `dip-search`, `f-search` senza `autocomplete="off"` venivano
riempite dal completamento automatico con parole scritte altrove. L'elenco risultava
filtrato a insaputa dell'utente → sembrava "non salva niente" quando invece salvava.
Su ogni casella di ricerca: `autocomplete="off" spellcheck="false"`.

### G3. `gestionale-app.html` non ha `</body>` né `</html>`
Finisce con i `<script src=…>`. Se serve agganciare uno script, si va **in fondo al file**,
non "prima di `</body>`" — quel tag non c'è.

### G4. Il ponte col computer di Alex a volte restituisce copie CONGELATE
Piu' volte lo staging di `gestionale-app.html` e `CLAUDE.md` ha restituito la versione
di ore prima, pur segnalando la dimensione giusta. **Prima di modificare un file grande,
controllare che contenga le ultime modifiche** (es. cercare una stringa aggiunta di
recente). Se e' vecchio: ricostruire riapplicando le modifiche note, non sovrascrivere
alla cieca.

## Da fare / opzionali
- (Opzionale) Pulizia DB: droppare colonne/tabella del vecchio pay-per-lead ora inutilizzate.
- (Opzionale) Pulizia righe `annunci_pubblicitari` rimaste in `pending`: acquisti mai completati, restano lì per sempre e ora il cliente se le vede in `le-mie-inserzioni.html`.
- **Deciso di NON mettere** spazi pubblicitari sulle pagine `cerca-*` e `risultati.html` (scelta di Alex, luglio 2026). Non riproporlo.
- Eseguire `sql/trigger-candidato.sql` su Supabase e aggiungere il filtro sul `tipo` a `crea_profilo_impresa` (vedi sopra).
- Se in futuro si vuole salvare i campi extra alla registrazione impresa, ampliare il trigger `crea_profilo_impresa` per leggerli da `raw_user_meta_data`.
- **75 città sono ancora senza imprese** (agosto 2026): è la lista di lavoro per il reclutamento.
  Obiettivo concreto, non "trovare imprese ovunque".
- **Piano reclutamento imprese: da finire.** Analisi fatta, decisioni aperte: (a) se regalare
  gli strumenti del gestionale o limitarsi a cambiare il messaggio (oggi l'offerta vende
  "visibilità", che a traffico zero non è credibile — gli strumenti sì); (b) quante ore a
  settimana Alex può davvero dedicarci, perché lavora in cantiere. Materiali proposti e non
  ancora fatti: email per la lista `reclutamento-lazio.csv`, volantino per le rivendite,
  traccia telefonata, riscrittura di `perche-registrarsi.html`.
- Guide "quanto costa" ancora da arricchire: **bagno (priorità, è la ricerca più fatta)**,
  tetto, cappotto, imbiancare, fotovoltaico.
- Domanda strategica aperta: TrovaImpresa è un marketplace o un software per imprese edili?
  Sono due aziende diverse e prima o poi cambia dove Alex mette le sue ore.
- **Aiuti a comparsa**: correggere le frasi del menu dove sono imprecise (scritte da Claude
  leggendo il codice, vanno riviste da Alex), poi estenderli una schermata alla volta —
  Lavori, Preventivi, Fatture. Poi la versione per il **sito**: le parole tecniche delle
  guide (trasmittanza, CILA, SCIA, bonifico parlante, massetto…) spiegate al passaggio del
  mouse. Lì serve che funzioni **anche al tocco**, perché le guide si leggono dal telefono.
- Nel repository è finito per sbaglio **`_to_delete/bonus-casa-2026.html`**: pagina messa
  da parte per la cancellazione, ora pubblicata (non collegata, non in sitemap). Da togliere.
- **Prezzo del Premium**: oggi 5 €/mese. Il capo di Alex paga **700 €/anno** un gestionale
  concorrente — comprato senza provarlo, scegliendo il più caro "per andare sul sicuro" —
  e non riesce a usarlo bene. Due indicazioni: il mercato quei soldi ce li ha, e un prezzo
  troppo basso non comunica convenienza ma poca serietà. Da valutare con calma.
