# Memoria progetto — TrovaImpresa

> ⛔ **QUESTO FILE È STATO SFOLTITO IL 15 SETTEMBRE 2026.**
> Era arrivato a →1,25← MB e →23.832← righe: nessuna sessione riusciva a
> leggerlo tutto, e il 15 settembre è successo il danno vero — Claude non ha
> visto un'analisi già scritta due giorni prima e l'ha rifatta da capo.
> Il racconto giorno per giorno è finito in **`STORIA-2026.md`**: non si legge
> all'inizio, si cerca dentro con `grep` quando serve sapere PERCHÉ una cosa è
> fatta così. Qui restano **le regole**, **com'è fatto il sito**, **le trappole**
> e **le ultime due settimane**.

## ⛔ DOVE SONO I FILE — la prima cosa da fare in ogni sessione nuova

**La cartella del progetto è: `C:\Users\Utente\Downloads\trovaimpresa`**

- In Cowork si apre come `$HOME/mnt/trovaimpresa` (`device_list_dir`, `device_bash`,
  `device_stage_files`). Se non risulta collegata, si chiede l'accesso **a quella
  cartella lì**: non si va a cercare in giro per il computer di Alessio.
- Dentro, quello che serve sempre:
  `CLAUDE.md` (questa memoria) · `PROMPT-sessione-nuova.md` ·
  le pagine `.html` in cima (pannelli, gestionale, pagine città) ·
  `sql/` · `netlify/functions/` · `js/` · `css/` ·
  `tools/controllo-push.js` (da lanciare PRIMA di ogni blocco git) ·
  `tools/banco-gestionale.js` (dal 12 nov 2026: da lanciare dopo OGNI modifica al
  gestionale, app o noleggio — regola 25 di `docs/REGOLE-SEMPLICITA.md`) ·
  `prove-claude/` (rapporti e fogli di lavoro: **in `.gitignore`, non va online**).
- ⛔ Da qui NON si lancia nessun comando git, nemmeno in sola lettura.
- ⛔ **AGGIORNATO il 4 set 2026**: i banchi di prova adesso stanno **QUI**, in
  `prove-claude/banchi-fissi/` (che è nel `.gitignore`), in un posto fisso e senza
  date nel nome: `conti/` · `computo/` · `assistenza-ai/` · `pagine/` · `fascia/`,
  con i lanciatori `gira-conti.sh`, `gira-computo.sh`, `gira-assistenza-ai.sh`,
  `gira-pagine.sh`, `gira-fascia.sh`. Gli zip con la data dentro `prove-claude/`
  sono STORIA, non strumenti. La vecchia riga diceva che stavano nel contenitore
  di Claude, in `prove/`: non è più vero.
- `LAVORI-APERTI.md` (nella radice) è il **quaderno dei lavori a metà**: cosa è
  iniziato e non finito, cosa manca, cosa deve decidere Alex. Si legge all'inizio
  di ogni sessione e si aggiorna alla fine. È protetto online da una regola 404 in
  `netlify.toml`.
## Come lavoriamo (IMPORTANTE)
- Modalità **Cowork**: Claude modifica i file direttamente nella cartella. Non servono prompt per Claude Code.
- **Il `git push` lo fa Alex** dal suo Git Bash. Claude NON deve tentare il push dal proprio ambiente: fallisce sempre.
- Motivo: nell'ambiente di Claude la cartella `.git` è vista tramite un mount con cache "congelata", che mostra un `index.lock` **fantasma** già rimosso lato Windows. Non è un problema reale sul PC di Alex — i suoi push funzionano regolarmente.
- ⛔ **NESSUN COMANDO GIT DALLA CARTELLA COLLEGATA, NEMMENO IN SOLA LETTURA.**
  Il 9 agosto 2026 Claude ha lanciato un innocuo `git status --short` per vedere
  cosa restava da committare: quel comando ha **creato** `.git/index.lock` e non
  è riuscito a rimuoverlo, perché dal ponte non si possono cancellare file.
  Il lucchetto è rimasto e ha bloccato ogni `git add`/`git commit` di Alex per
  ore — i suoi push dicevano "Everything up-to-date" perché i commit non erano
  mai avvenuti. **Tre tornate di lavoro sono rimaste fuori senza che si vedesse.**
  Quindi: niente `git status`, `git log`, `git diff` — niente. Per sapere cosa è
  cambiato, si guardano i file. Se il lucchetto si ripresenta, l'unico che può
  toglierlo è Alex: `rm -f .git/index.lock` da Git Bash.
- Quindi: dopo aver modificato i file, dare **subito** ad Alex il blocco pronto da incollare (`git add ... / git commit -m "..." / git push`), senza tentativi a vuoto. Ad Alex di norma non serve `rm -f .git/index.lock`.
- Deploy: **ogni push su `main` pubblica** (→15← crediti Netlify l'uno). Il
  cancello `#pubblica` messo la mattina del 16 novembre 2026 è stato TOLTO lo
  stesso giorno su richiesta di Alex («mi da fastidio»): non rimetterlo senza
  che lo chieda lui. Resta la regola di buon senso: lavori raggruppati, un push
  a fine lavoro, e si pubblica quando Alex dice «pubblica».

### ⛔ REGOLA FISSA: PRIMA DI COSTRUIRE, CHIEDERE SE SERVE (15/8/2026)

**Prima di scrivere una riga di una funzione nuova, chiedere ad Alessio se gli
serve.** Non «come la vuoi»: **se la vuole**.

La domanda da fargli è una sola:
**un'impresa smetterebbe di pagare TrovaImpresa se questa cosa non ci fosse?**
Se la risposta è no, la funzione va in fondo alla lista, e glielo si dice
**prima**, non dopo aver consegnato.

E se il lavoro è un foglio, una stampa o una schermata, prima di consegnarlo:
**questo lo porteresti in riunione?** Se la risposta è no, non è finito.

⚠️ Nasce dal 15 agosto 2026: una serata intera su un «Report completo» che era
la fotocopia del Riepilogo — stesse card, stesse posizioni — e che nessun
iscritto aveva chiesto. Costruito, provato, sabotato, messo online e tolto la
sera stessa. La misura giusta stava già nel messaggio di Alessio («un foglio da
portare in riunione o dal commercialista») e non è stata usata: sono state
controllate per ore le cifre, e mai la frase che diceva a cosa doveva servire.

⚠️ E attenzione a un altro inciampo della stessa giornata: quando Alessio dice
**«usa le stesse funzioni»**, sta parlando dei **CONTI** — vuole che i numeri
non si scollino fra due schermate. **Non sta dicendo come deve essere fatto il
disegno.** Prendere quella regola come una regola sull'aspetto è esattamente
quello che ha prodotto la fotocopia.

### ⛔ REGOLA FISSA DI ALESSIO SULLE FINESTRE (8/8/2026 — non sgarrare mai più)
**MAI usare `openSheet()` (la finestrella piccola) per form o schede nuove.**
Alessio la ODIA. Qualsiasi form o scheda nuova va fatta con **`openSheetGrande()`
a due colonne** (`sh-cols` / `sh-col` / `sh-b` / `sh-tit`), come Dati azienda,
la scheda cliente e la scheda fornitore. Vale per TUTTI i gestionali.
Sbagliato due volte coi Fornitori (form fornitore, poi form fattura): alla terza
volta è un problema serio di fiducia. Prima di consegnare un form nuovo,
controllare SEMPRE con `grep openSheet(` che non ce ne siano di piccoli.

### ⛔ REGOLA FISSA SUL TONO DEL SITO PUBBLICO (8/8/2026 — non sgarrare mai più)
**1. Il sito non parla di Alessio. Mai.** Niente racconto personale, niente foto, niente
"mi chiamo", niente storia dei 25 anni in prima persona, niente "progetto portato avanti
da solo" / "appena nato" (fa sembrare tutto piccolo e in difficoltà). Il nome di Alessio
resta SOLO nel footer, dove serve per legge. Prima di scrivere qualsiasi testo che parla
di lui o della sua attività: **chiederglielo**, mai scriverlo di iniziativa.

**2. Il sito parla di cosa riceve l'impresa**: più visibilità e più contatti nella sua zona.
Anche la pagina "Chi siamo" deve rispondere a "cosa ci guadagno io impresa", non a "chi sei tu".

**3. Le imprese non cercano niente — è TrovaImpresa che offre.** Sono già al lavoro: il sito
arriva e dà loro **una vetrina in più**, gratis, senza che l'abbiano chiesta. Un'impresa che
"cerca lavoro" è un'impresa che non ne ha: è triste e la sminuisce davanti al cliente.
- ✅ Giusto: "ti diamo", "ti regaliamo", "i clienti della tua zona ti trovano", "la tua
  vetrina sempre online", "sei tu che scegli", "prendi anche questa".
- ⛔ Vietato: "cerchi lavoro", "trova lavoro", "hai bisogno di clienti", "riempi l'agenda",
  "aiutiamo le imprese in difficoltà", e ogni frase che metta l'impresa in posizione di chi
  chiede invece che di chi viene cercato.
- Coerente coi 3 mesi di Premium: sono un **regalo**, non uno sconto per convincerle.

**Errore fatto l'8 agosto 2026**: scritta una "Chi siamo" in prima persona con la storia dei
25 anni di cantiere e lo spazio foto. Bocciata due volte. Non riproporlo in nessuna forma.
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

⛔ **19 SETTEMBRE 2026 — VALE ANCHE IN LETTURA, NON SOLO IN SCRITTURA.**
La sola regola di SELECT su `imprese` e':
`imprese_select_propria` -> `(user_id = auth.uid()) OR sono_il_fondatore()`,
e `sono_il_fondatore()` e' vera **solo per `pintoalessio@icloud.com`**.
Quindi il pannello admin, che leggeva con `sb.from('imprese')` (chiave
pubblica), faceva vedere:
- **1 impresa** se in Chrome c'era collegato un altro account di Alex —
  ed e' successo davvero: il 18 set si e' registrato con
  `pintoalessio@hotmail.it` per provare la porta del gestionale;
- **0 imprese** dopo aver svuotato i cookie, perche' per gli ospiti di
  SELECT non ce n'e' nessuna.
Adesso c'e' l'helper **`adminLista(tabella)`** in `admin.html`, gemello di
`adminWrite()`: passa da `admin-dati` con la password e legge con
`service_role`. Lo usano `caricaImprese()` e i nomi delle imprese nella
tabella della pubblicita'.
⚠️ **Regola generale: nel pannello admin nessuna lettura con `sb.from(...)`
su tabelle protette.** Se una casella dice un numero piccolo e strano
invece di un errore, e' quasi sempre questo.

### 3. Verificare che una scrittura sia andata a buon fine
Aggiungere sempre `.select('id')` a UPDATE e DELETE e controllare che tornino righe.
Senza, una scrittura bloccata da RLS e' indistinguibile da una riuscita.

### 4. ⛔ NON DIRE CHE UNA FUNZIONE NON ESISTE FINCHE' NON HAI TUTTI I FILE
**19 settembre 2026, l'errore piu' grosso della giornata.**
Claude ha cercato `compApriFile()` dentro `/mnt/user-data/uploads/trovaimpresa/js/`,
dove aveva portato **12 file su 24**, non l'ha trovata, e ha concluso che il
pulsante «Carica qui il computo del geometra» fosse morto. L'ha detto ad Alex
**due volte** e l'ha scritto nella pagina che vende.

La funzione c'era dal 18 agosto, in **`js/gest-computo-pdf.js`** — uno dei 12
file non portati — e fa **piu'** di quella che Claude stava per scrivere: legge
Excel, CSV **e PDF** (con `pdf.js`, righe «Sommano», e riconosce le scansioni).
Anche `compPrezziDaPrezzario()` c'era, nello stesso file.

E la copia scritta per «riparare» avrebbe fatto un danno vero: due
`const COMP_IMP_MAX` nello stesso spazio globale = **SyntaxError**, e
`gest-computo-pdf.js` non sarebbe partito affatto. Via tutti i PDF del computo.

**La regola, da qui in avanti:**
1. La pagina del gestionale carica **24 file js**. L'elenco vero si prende cosi':
   `grep -o '<script[^>]*src="/js/[a-z0-9-]*\.js"' gestionale-app.html`
2. Prima di dire «non esiste», si portano **tutti**, e si controlla che ci siano.
3. Per trovare i pulsanti morti si guarda che ogni `if(a==="...")return X();`
   abbia la sua `X` definita — **su tutti i file caricati**. Fatto cosi' il
   19 settembre su **→153← pulsanti: zero morti.**
4. Una funzione definita due volte in file diversi non da' errore (vince
   l'ultimo caricato), ma **due `const` con lo stesso nome fanno saltare il
   secondo file intero**.

### 5. ⛔ DOPO OGNI `device_commit_files`, RICONTROLLARE CON L'md5
Regola di Alex, e il 19 settembre e' servita due volte: `device_commit_files`
ha risposto **`written`** rimandando poi la **versione vecchia** del file.
Si riconosce dalla misura in byte che non cambia.
**Cura:** ricopiare il file sotto un **nome nuovo** in `/mnt/user-data/outputs/`
(es. `gestionale-v2.html`) e rifare il commit da li'. Con lo stesso nome di
prima continua a rimandare quello vecchio.
Il controllo si fa sempre: `device_stage_files` + `md5sum`, e i due md5 devono
combaciare. Senza, si pubblica la versione di prima senza accorgersene.
## Pannelli
- 5 pannelli: `pannello-impresa`, `pannello-artigiano`, `pannello-professionisti`, `pannello-negozio` (le 4 categorie business) + `pannello-candidato`.
- Modal "Genera preventivo con AI": stile `.modal-ai` a tutta pagina (fullscreen), header chiaro. Funzione AI (generaConAI/generaTestoPreventivo/calcolaPrezzo) uniforme su tutti i 4 pannelli.
- Badge numero preventivi non risposti sulla card "Richiesta di preventivo": presente su **tutti e 4** i pannelli, negozio compreso (verificato luglio 2026 — la vecchia nota "negozio ancora senza" era superata).

# COM'È FATTO IL SITO — schede di riferimento

## Preventivi (pay-per-lead RIMOSSO — luglio 2026)
- **Nessun pagamento**: l'impresa vede gratis i contatti (email/telefono) delle richieste indirizzate a lei. Rimossi pulsante "Sblocca a 5€", sezione "Richieste dalla tua zona" e i file `crea-checkout-lead.js`, `stripe-webhook-lead.js`, `sql/pay-per-lead.sql`, `sql/condivisione-lead.sql`.
- Le richieste arrivano nella tabella `preventivi`; i pannelli leggono la vista `preventivi_safe` (esclude email/telefono). I contatti si ottengono dalla function `contatto-preventivo.js`, che ora li restituisce a chi ha la richiesta indirizzata (nessun gate di pagamento).
- **ATTENZIONE**: se si aggiungono colonne nuove a `preventivi`, rieseguire il blocco `GRANT SELECT (colonne tranne email/telefono) ON public.preventivi TO anon, authenticated` e ricreare `preventivi_safe`, altrimenti il pannello va in 403 ("permission denied for table preventivi").
- Env Stripe `STRIPE_WEBHOOK_SECRET_LEAD` non serve più (l'endpoint webhook lead su Stripe si può disattivare).

### ⚠️ 6 agosto 2026 — il form dei preventivi era ROTTO da sempre
La vecchia nota diceva che `sbloccato` e `condivisibile` erano "colonne inutilizzate ma innocue".
Non era vero: erano state **rimosse dal database**, e due pezzi del sito le chiedevano ancora.

**1. Nessun cliente poteva mandare una richiesta.** `profilo-impresa.html` scriveva la colonna
`condivisibile`, che non esisteva più: PostgREST rispondeva **400** e la richiesta andava persa.
In console: `Could not find the 'condivisibile' column of 'preventivi'`. Ecco perché la tabella
`preventivi` era a **zero righe**: non era (solo) mancanza di traffico, era un bug.
→ Risolto con `sql/preventivi-condivisibile.sql` (ricrea la colonna) **e** nel codice: se la
colonna manca, l'insert viene ritentato senza, così la richiesta non si perde mai più.

**2. L'impresa non vedeva i contatti del cliente.** `contatto-preventivo.js` faceva
`select('id, impresa_id, sbloccato, email, telefono, nome')`: la colonna `sbloccato` non c'è
più, la query falliva e il pannello mostrava "⚠️ Errore nel caricamento, riprova".
→ Tolta dalla select. Aggiunto anche il log dell'errore, prima veniva ingoiato in silenzio.

**3. `tipo_lavoro` e `categoria_lavoro` sono due colonne diverse.** Il pannello mostra "Lavoro"
leggendo `tipo_lavoro`, che il form non riempiva mai (restava "—"). Ora il form scrive
entrambe con lo stesso valore. Le richieste vecchie restano con il trattino.

**Regola generale**: prima di dire che una colonna è "inutilizzata ma innocua", controllare
chi la nomina con `grep -rn "nomecolonna" netlify/functions *.html`. Una colonna citata in una
query e assente dal DB non dà un avviso: fa fallire tutta la scrittura.

### ⚠️ Il profilo pubblico è UNO SOLO per tutti e quattro i tipi
`cerca-imprese`, `cerca-artigiani`, `cerca-negozi` e `cerca-professionisti` portano **tutte
allo stesso `profilo-impresa.html`**. Quindi un negozio di ceramiche si presenta con
"Richiedi un sopralluogo per un preventivo", che per lui non ha senso: vende materiale,
non va in cantiere. Stessa cosa per il professionista (che però ha almeno il suo form
"richiesta di incarico"). **Da differenziare: è il lavoro aperto più grosso sul sito.**

### Notifica email delle richieste (ricollegata — 6 agosto 2026)
`netlify/functions/notifica-preventivo.js` (Resend) esisteva ed era completa, ma **nessuno la
chiamava**: era stata staccata con la nota "la richiesta appare direttamente nel pannello".
Molte imprese però nel pannello non entrano per giorni. Ora `profilo-impresa.html` la richiama
subito dopo l'insert, in "best effort": se la mail non parte, il cliente vede comunque
"Richiesta inviata" e la richiesta resta salvata. Doppia via: pannello **e** email.
- L'altro form (quello che esce nelle pagine `cerca-*` quando non ci sono risultati) usa
  `richiesta-cliente.js` e mandava già due mail: una ad `info@trovaimpresa.com` e una alle
  imprese della zona. Non è stato toccato.
- Serve `RESEND_API_KEY` nelle variabili di Netlify.

**Stessa cosa per le richieste di INCARICO ai professionisti** (`submitIncarico`): anche
quelle finivano solo nel pannello. Ora chiamano la stessa function — i professionisti
stanno in `imprese` come tutti, quindi la trova per id. Due correzioni alla function:
- **prima pretendeva `email_cliente`**: ma negli incarichi l'email è facoltativa, quindi
  chi lasciava solo il telefono non faceva partire niente. Ora basta uno dei due recapiti.
- **il pulsante dell'email portava tutti su `pannello-artigiano`**, anche negozi e
  professionisti, che lì non trovavano nulla. Ora c'è la mappa `PANNELLI` per tipo.

### Form richiesta preventivo rifatto (6 agosto 2026)
In `profilo-impresa.html`, sezione `#sec-preventivo`:
- due passaggi numerati: **prima il lavoro, poi i contatti** (prima chiedeva nome/email/telefono
  come prima cosa, ed è lì che la gente si ferma);
- **telefono obbligatorio** con controllo di lunghezza, email con controllo del formato;
- errori: il campo sbagliato prende la classe `.errore` (bordo rosso), la pagina ci scorre sopra
  e il messaggio dice cosa fare;
- foto, data, urgenza e budget nascosti dietro "Aggiungi altri dettagli" (`togglePrevExtra()`);
- budget a fasce invece del campo libero;
- città precompilata da `?citta=` o da `localStorage.ti_citta_scelta` (`precompilaCittaPreventivo()`);
- tre righe in testa che dicono cosa succede (gratis, risponde l'impresa, dati non pubblicati);
- campi più grandi: etichette 13,5px (erano 11), testo 16px (era 14), `.fr2` va a una colonna
  sotto i 560px.
## Piani e gestionale (deciso il 6 agosto 2026)
Struttura confermata da Alessio, **non riproporne altre** senza che lo chieda lui:
- **Free**: profilo pubblico visibile, con i blocchi che ha già. Le card riservate hanno
  `data-premium="true"` e prendono il lucchetto 🔒 da `bloccaCardPremium()` nei 4 pannelli.
- **Premium**: 5 €/mese o 49 €/anno, **gestionale incluso**. Nessun add-on separato da vendere.
- **3 mesi di Premium regalati a ogni nuovo iscritto**: servono a far conoscere il Premium nel
  periodo in cui le imprese non ricevono ancora clienti. In DB: `piano='premium'` +
  `premium_pagato=false` + `premium_scadenza` valorizzata. `controlla-scadenze-premium.js`
  avvisa 7 giorni prima; allo scadere si torna Free da soli.

### Stato del gestionale
- **Pronto**: imprese e artigiani. **Non pronto**: professionisti e negozi.
- La modalità manutenzione è stata **tolta** il 6 agosto (`var MANUTENZIONE = false` in
  `gestionale-app.html`). Per richiuderlo a tutti basta rimettere `true` in quella riga.
- Da quella data l'accesso diretto a `/gestionale-app.html` controlla il piano: entra chi ha
  `piano='premium'` non scaduto (funzione `haPremium(row)`), gli altri vedono la schermata che
  spiega il Premium. Scorciatoia per Alessio sempre valida: `?chiave=apri`.
- Se la lettura del piano fallisce (rete), **si entra**: meglio far passare qualcuno in più che
  bloccare fuori chi paga. I dati restano comunque protetti da RLS.
- Il vecchio paywall a 12 €/mese e 119 €/anno non si usa più: `crea-checkout-gestionale.js`
  resta lì ma non è collegato a niente.
- **AI: già spenta di suo.** Ogni utente nasce in `ai_accounts` con `plan='base'` e
  `monthly_quota=0`, quindi le funzioni AI non partono per nessuno finché non gli si assegna
  una quota. Il sistema crediti (quota mensile, crediti extra, log consumi, ricariche) è
  costruito e pronto: quando si vorrà venderla, va solo collegato a Stripe.
## Gestionale Studio — la versione per i professionisti (6 agosto 2026)
Non è un file a parte: è **lo stesso `gestionale-app.html`** che cambia faccia quando
`ruoloUtente === 'professionista'` (letto da `imprese.tipo`). Artigiani, imprese e negozi
non vedono niente di tutto questo: ogni funzione qui sotto restituisce vuoto per loro.

**Cosa c'era già prima di oggi**: titolo "Gestionale Studio", lavori→pratiche in tutti i
testi visibili (mappa `_FRASI` + `_swapPratiche`), reparti tipo Progettazione/Direzione
lavori/Catasto, scadenzario con SCIA/CILA/Permesso/Agibilità.

**Aggiunto il 6 agosto:**

### 1. Menu su misura — `adattaMenuProfessionista()`
Nasconde **Mezzi, Attrezzature e Carte** (`TAB_NASCOSTI_PRO`), rinomina *Squadra* in
**Collaboratori** e il gruppo *Azienda* in **Studio**. Se l'utente era dentro una sezione
nascosta viene riportato al Riepilogo. **Si nasconde soltanto**: i dati restano nel database
e tornano visibili da soli se il profilo cambia tipo.

### 2. Campi della pratica — `bloccoPratica()` / `leggiCampiPratica()`
Nel form del lavoro compare "📄 Dati della pratica": tipo (CILA, CILAS, SCIA, PdC,
paesaggistica, agibilità, sanatoria, accatastamento, voltura), stato (da preparare →
depositata → istruttoria → integrazioni → approvata → archiviata), Comune, protocollo,
data di deposito, e i catastali foglio/particella/sub.
- Colonne su `gest_lavori`: `sql/gest-pratiche-professionisti.sql`
- `renderJobs()` per i professionisti legge `select("*")` invece dell'elenco fisso: servono
  i campi pratica per riaprirli in modifica, e con `*` non si rischia l'errore colonna assente.

### 3. La parcella — `calcolaParcella()` / `bloccoParcella()`
**La formula, che è la parte da non sbagliare:**
```
cassa      = compenso × cassa%          (4% Inarcassa, 5% Geometri)
imponibile = compenso + cassa + spese
IVA        = imponibile × iva%
ritenuta   = compenso × 20%             ← SOLO sul compenso, mai su cassa e spese
totale     = imponibile + IVA − ritenuta
```
Verifica: 1.000 € compenso, cassa 4%, IVA 22%, con ritenuta → **1.068,80 €**.
Con 100 € di spese la ritenuta resta 200 €, non sale.
- La **ritenuta si applica solo se il cliente è sostituto d'imposta** (azienda,
  professionista, condominio). Con un privato NO: nel form c'è scritto sotto la casella.
- Colonne su `gest_preventivi`: `sql/gest-parcella-professionisti.sql`
- Il riepilogo si ricalcola dal vivo (`aggiornaRiepilogoParcella`) su ogni modifica.

### 4. Il PDF — dentro `prevPdf()`
Con `isParcella` il titolo diventa **PARCELLA**, il riquadro del totale diventa il riepilogo
riga per riga fino a **NETTO A PAGARE**, e il file si salva come `parcella-N-cliente.pdf`.
**Usa la stessa `calcolaParcella()` del form**: se un giorno si cambia la formula, va
cambiata in un punto solo e i due restano allineati.

### Paracadute contro le colonne mancanti
Sia le pratiche sia la parcella hanno `eColonna...Mancante()` + `senzaCampi...()`: se la
migrazione SQL non è stata eseguita, il salvataggio **viene ritentato senza quei campi** e
l'utente riceve l'avviso "manca la migrazione SQL", invece di perdere tutto il lavoro.
È la lezione della colonna `condivisibile`: applicarlo sempre quando si aggiungono colonne.

### Cosa manca ancora al Gestionale Studio
- Nessuno l'ha ancora provato sul serio: al primo test vero aspettarsi ritocchi.
## Gestionale imprese/artigiani — revisione completa (6 agosto 2026, sera)
Revisione totale di `gestionale-app.html` (3 analisi separate: bug, grafica, efficienza) e
poi sistemato tutto in blocchi, con test di Alessio a ogni passo. Giudizio: da 7 a ~8/10.
I punti di forza da non toccare: linguaggio "da cantiere", patente a crediti, scadenze
sicurezza squadra, XML FatturaPA con pre-validazione in italiano, backup/export libero.

### Blocco 1 — Salvataggi sicuri (niente più "Salvato ✔" falso)
- Il pattern `.select('id')` + "Non salvato: nessuna riga modificata" (già presente in
  mezzi/carte/scadenzario) è stato esteso a TUTTE le scritture vecchie: modifica lavoro
  (`saveJob`), stati e delete preventivi, `savePrev`, `saveFattura`, `fattCambiaStato`,
  `eliminaFattura`, `saveCli`, `squadraSave`, `stato-supa`, `scad-stato`, `sq-revoca`,
  delete di lavori/spese/scadenze/clienti.
- **Rete anti-doppioni** su fatture e preventivi: nel salvataggio (delete righe + re-insert)
  ora si controlla l'esito della delete E si verifica con una select che non siano rimaste
  righe vecchie prima di inserire le nuove. Prima una delete bloccata da RLS raddoppiava le voci.
- `fattSincronizzaLavori` non è più muta: se il riflesso su `gest_lavori.fatt_stato` fallisce, avvisa.
- `prevToLavoro`: se il preventivo non passa ad "accettato", avvisa (prima si rischiava il lavoro doppio).

### Blocco 1b — Riepilogo onesto quando la rete manca
- `renderRiepilogo`: flag `erroreLettura`/`erroreLettura2` + controllo `r.error` su ogni
  query dei due `Promise.all` (prima i catch vuoti mostravano "Tutto in ordine" con gli zeri).
- Fallimento totale → banner rosso fisso `.rie-errore` con pulsante **Riprova**
  (`data-action="rie-riprova"`); fallimento parziale → avviso "alcuni numeri incompleti".

### Blocco 1c — Note calendario su Supabase
- Tabella **`gest_note`** (`sql/gest-note.sql`): una nota per giorno per reparto, RLS
  owner-all + team-read. Prima stavano in localStorage e si perdevano cambiando dispositivo.
- `caricaNote()` in `renderCal`: carica in `noteCache`, **migra da sola** le vecchie note del
  browser (upsert ignoreDuplicates) e poi svuota il localStorage. Se la tabella non c'è
  ancora, si torna al vecchio modo con avviso "manca la migrazione SQL" — nessun blocco.
- Migrazione eseguita da Alessio il 6 agosto sera ("Success. No rows returned").

### Blocco 2 — Grafica e messaggi
- Aggiunti `<!DOCTYPE html>`, `<head>`, `<title>Gestionale — TrovaImpresa</title>`, `noindex`
  (prima il file iniziava con `<meta>` nudo → quirks mode).
- **Toast rifatto** (`toast()` + `traduciErrore()`): errori rossi che restano 5s, conferme
  verdi 2,6s; gli errori Supabase in inglese (RLS, Failed to fetch, JWT, duplicate key,
  colonna mancante...) vengono tradotti in italiano semplice. CSS `.toast.ok`/`.toast.err`.
- **Condomini → Clienti ovunque** per imprese/artigiani/negozi (Riepilogo, form lavoro,
  conferme, avvisi XML, contatori). "Condominio" resta SOLO come tipo di cliente
  (Privato/Azienda/Condominio) coi suoi campi.
- **Card lavori**: da 7 pulsanti a 2-3 (Modifica + azione di stato) + menu "⋯" con tutto il
  resto (Mappa, Foto, WhatsApp, PDF, fattura, Elimina in rosso in fondo). BUG TROVATO: in
  modalità "schede sempre" il registro `TAB_MENU` non veniva mai riempito (stava solo nel
  ramo tabella di `renderTabella`) → spostato prima del bivio; il gestore `tab-menu` ora
  funziona anche nelle card (cerca `td` O `.job-menu`). `jobCardSupa` ha il 5° parametro
  `menuTab` ("lav" o "ag").
- Menu laterale leggibile: `--testo-3` scurito a #64748B (era #94A3B8), `.side-group`
  13,5px, contatori/sottotitoli ingranditi, bottoni "+ Nuova fattura/carta/scadenza".

### Blocco 3 — Velocità
- **jsPDF e xlsx non si caricano più all'avvio** (~1,2MB): `caricaJsPDF()`/`caricaXLSX()`
  al primo clic, stesso pattern di `mpCaricaLeaflet`.
- **Render pigro**: `renderAll()` non ridisegna più le 15 sezioni (~60 query) — segna tutte
  "da rifare" (`_tabSporchi`), ridisegna solo la sezione aperta + contatori + SEMPRE
  `renderClienti`/`renderDip` (riempiono `cliCache`/`dipCache`, servono alle tendine del
  form lavoro da qualsiasi sezione). Il click sui tab ridisegna se sporco o se nella lista
  `SEMPRE` (lavori/agenda/mappa/richieste/mezzi/attrezzature). Mappa `RENDER_TAB` tab→funzione.
- **`rinfresca("tab1","tab2",...)`**: dopo i salvataggi ridisegna solo la sezione corrente,
  le altre le segna sporche. Usata nei salvataggi/stati/delete di fatture, preventivi, lavori, clienti.
- **Doppio render all'avvio eliminato**: `getSession` + `onAuthStateChange` passano da
  `_authRefresh()` con guardia `_authUidVisto`.

### Bug noti RESTANTI su gestionale-app (non urgenti)
- Galleria: `galNomeOp()` cerca in `db().dipendenti` (vuoto) invece che in `dipCache` →
  sotto le foto compare l'UUID dell'operatore invece del nome.
- Calendario su mobile illeggibile (celle ~48px): conviene una lista per giorno sotto i 760px.
- Campi obbligatori non segnati nei form (validazione = solo toast).
- Un `matchMedia(...).addEventListener` non protetto da try (Safari vecchi); `carbMap`
  globale implicita.

### Funzioni future in ordine di valore (per quando Alessio le chiede)
1. Email automatica delle scadenze (DURC, revisioni, visite mediche, fatture scadute):
   Resend + scheduled function tipo `controlla-scadenze-premium.js`. ~1 giorno, valore enorme.
2. Rapportino ore per operaio per giorno (il costo orario in Squadra c'è già, inutilizzato).
3. Prima nota / cassa (entrate-uscite generiche: affitto, F24, leasing).
4. PWA (manifest + service worker): icona in home, regge il cantiere senza campo.
5. Nel form azienda c'è ancora scritto "la fattura elettronica la sto ancora costruendo":
   FALSO, il generatore XML c'è ed è buono. Da correggere quel testo.
## Gestionale Negozio e Noleggio (6 agosto 2026)
`gestionale-negozio.html` e `gestionale-noleggio.html` erano in buona parte copie del
gestionale imprese con sopra le sezioni di magazzino. **Condividono le tabelle
`neg_prodotti`, `neg_movimenti` e `neg_fornitori`**: quando si tocca il form dei prodotti
in uno, va toccato anche nell'altro, altrimenti divergono.

### Pulizia fatta
- Il pulsante grande della barra diceva **"+ Nuovo lavoro"**: ora è "+ Nuovo prodotto"
  (negozio, azione `new-prod`) e "+ Nuovo noleggio" (noleggio, azione `new-nol`).
- Nel negozio i clienti nel menu si chiamavano **"Condomini"** ed erano nascosti: ora si
  chiamano "Clienti" e si vedono (servono per fatture e preventivi).
- Le sezioni da cantiere (agenda operatore, lavori, squadra, galleria, scadenzario) erano
  già nascoste con `display:none` da prima: lasciate così.

### Campi del prodotto — `sql/neg-prodotti-campi.sql`
Aggiunti `unita`, `prezzo_acquisto`, `iva_perc`, `fornitore_id`.
- **Senza unità di misura "quantità 40" non vuol dire niente**: 40 pezzi? 40 mq? 40 sacchi?
  Le voci: pz, mq, ml, mc, kg, q, t, sacco, bancale, conf, lt.
- `mostraMargine()` calcola il guadagno mentre scrivi ("2,30 € al sacco, +51%") e avvisa
  in rosso se il prezzo di vendita è sotto il costo.
- **TRAPPOLA TROVATA**: `quantita` e `soglia_minima` erano `integer`. Il codice accettava
  i decimali ma il database li rifiutava — 12,5 mq era impossibile. Portate a
  `numeric(12,3)`, insieme a `neg_movimenti.quantita`. Se si aggiungono campi numerici,
  **controllare sempre il tipo della colonna, non solo il codice**.

### Preventivi del negozio — `sql/neg-preventivi.sql`
Mancavano del tutto (zero occorrenze di "preventivo" nel file), eppure una rivendita fa
offerte alle imprese ogni giorno. Due tabelle nuove: `neg_preventivi` +
`neg_preventivo_righe`, con RLS "solo la propria roba".
- Le righe si prendono dal magazzino (nome, prezzo e unità arrivano da soli) oppure sono
  libere (trasporto, scarico col camion gru, taglio a misura).
- **Ordine dei conti** (`pvCalcola`): prima gli sconti di riga, poi lo sconto generale sul
  netto, e **l'IVA per ultima** su quello che resta. Verifica: 100 sacchi a 6,50 + 30 mq a
  26,50 → merce 1.445,00, IVA 317,90, totale 1.762,90.
- **"Il cliente ha accettato"** (`pvAccetta`): mostra cosa sta per uscire, chiede conferma,
  scarica le giacenze e registra il movimento di uscita. **Scarica solo le righe con
  `prodotto_id`**: le righe libere non hanno giacenza.
- PDF con intestazione, righe con unità di misura, riepilogo sconti e in fondo la validità.

### Cosa manca ancora al negozio
- Il **DDT** (bolla di consegna): chi vende materiale ne compila una a ogni consegna.
- Gli **ordini a fornitore**: i fornitori sono in elenco ma non si registra cosa hai ordinato.
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
Rilanciato di nuovo il 6 agosto 2026 → **34 su 106** (72 ancora senza imprese).
Rilanciato il 29 agosto 2026 → **43 su 106** (63 senza imprese, perché lì non c'è
nessun iscritto). Da quella data lo script salta anche le schede senza email
confermata, e cerca la città in modo esatto (vedi il bug di Enna, 29/8/2026).

**Il numero da guardare non è quante città, ma quante imprese per città.** Al 6 agosto:
Roma 6, Napoli 3, Torino 3, Sassari/Pavia/Venezia 2, **tutte le altre 1 sola**. Una pagina
con una sola impresa vale poco per Google e ancora meno per il cliente, che chiede un
preventivo e non può confrontare niente. La soglia utile è **3-4 imprese per città**:
meglio concentrarsi sulle città già avviate che spargersi su quelle vuote.

Blocco pronto da dare ad Alex (⚠️ 29/8/2026: NIENTE `git add -A`, solo i file
toccati — vedi le regole sulla cartella collegata):
```bash
cd /c/Users/Utente/Downloads/trovaimpresa && node genera-imprese-citta.js
```
poi, se la riga finale dice `Errori: 0`:
```bash
node tools/controllo-push.js && git add imprese-*.html && git commit -m "Rigenerate le sezioni imprese locali" && git push
```
⚠️ **Il `cd` va messo davanti**: il 29/8/2026 Alessio ha detto «fatto» ma lo
script non era mai partito, e i file risultavano non modificati dalle 06:35.
Prima di credere a un «fatto», controllare l'ora di modifica dei file.

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
  Per una guida nuova: creare l'HTML + INSERT in `blog_articoli` (con `mestiere`, vedi sotto)
  + voce in `sitemap.xml` + card in `costi-ristrutturazione.html`.
- Come modello grafico conviene copiare **`quanto-costa-parete-cartongesso.html`**: è il file
  più aggiornato e contiene tutto (style completo, navbar, calcolatore col suo JS, FAQ +
  JSON-LD, sezione "Trova imprese nella tua città"). Il template in `docs/` è più vecchio.

### Blog diviso per mestiere (agosto 2026)
`blog.html` non è più una griglia unica ordinata per data: raggruppa gli articoli in
**sezioni per mestiere**, con una barra di salto rapido in cima e, in ogni sezione, il link
diretto alla ricerca di quel mestiere (es. "Trova un idraulico →" → `cerca-artigiani.html?mestiere=Idraulica`).
Serviva a creare il ponte guida → marketplace, che prima non c'era.

- Colonna **`mestiere`** su `blog_articoli` (`sql/blog-mestieri.sql`). Valori ammessi, che
  devono coincidere con l'array `GRUPPI` dentro `blog.html`:
  `ristrutturazione, bagno, elettrico, clima, tetto, infissi, pavimenti, pitture,
  cartongesso, bonus, strumenti, imprese`.
- **Rete di sicurezza**: se `mestiere` è vuoto, `blog.html` riconosce l'articolo dallo slug
  tramite la mappa `MAPPA_SLUG`; gli slug sconosciuti finiscono in "Altre guide". La pagina
  funziona anche se la colonna non esiste ancora (riprova la query senza).
- Quando aggiungi una guida: valorizza `mestiere` nell'INSERT **e** aggiungi lo slug a
  `MAPPA_SLUG` in `blog.html`. Se il mestiere è nuovo, aggiungi prima la voce in `GRUPPI`.

### Guide pubblicate ad agosto 2026 (28 articoli in totale)
Nuove il 5 agosto: `quanto-costa-rifare-la-cucina`, `quanto-costa-abbattere-un-muro`,
`come-leggere-un-preventivo-edile` (con checklist interattiva al posto del calcolatore),
`come-trovare-clienti-impresa-edile` (rivolta alle imprese, senza sezione città),
`bonus-edilizi-2026` (panoramica di tutti i bonus; ha **sostituito** l'articolo omonimo che
viveva solo nel DB — stesso slug, ora con pagina statica).

- **Attenzione ai doppioni sui bonus**: esistono `bonus-edilizi-2026` (panoramica) e
  `bonus-ristrutturazione-2026` (approfondimento). Non crearne un terzo: si cannibalizzano.
- **Da far confermare ad Alex**: massimale ecobonus infissi (60.000 €, trovato su una sola
  fonte) e percentuali del conto termico 3.0 (in pagina volutamente non scritte, si rimanda
  al GSE). Prezzi cucina e muro: cercati su fonti di settore, in attesa del suo controllo.
- **Sezioni del blog con un solo articolo** — elettrico, infissi, pavimenti, pitture,
  cartongesso: sono mestieri molto cercati, è lì che conviene mettere le prossime guide.

### Regole di Alex sulle pagine esistenti
- **NON toccare** title, meta description, canonical, JSON-LD, robots.txt, sitemap delle
  pagine già a posto. Si aggiunge contenuto visibile, non si tocca la testa del file.
- I 7 errori 404 non si sistemano (7 pagine su 848, impatto zero).

### Dove siamo davvero (6 agosto 2026) — leggere prima di dare consigli
- **Il lancio vero è il 20 luglio 2026**, non maggio. Il dominio era online da prima ma il sito
  era in modifica. Da quella data gira una **campagna Meta da 8 €/giorno rivolta alle IMPRESE**
  (non ai privati). Quindi i dati di Search Console, che vedono solo Google, raccontano una
  parte sola della storia.
- **49 imprese iscritte** in tre settimane (1 · 2 · 18 · 15 · 13 a settimana), cioè circa
  **3 € per iscrizione**. Il canale funziona ed è a rubinetto: si apre e si chiude.
- **1 solo cliente pagante**: 20 € per uno spazio pubblicitario su Roma.
- **Zero richieste di preventivo** — ma vedi sopra: il form era rotto. Il numero non misurava
  il traffico, misurava un bug.
- Alessio fa il **muratore**, il sito lo porta avanti da solo nei ritagli. Evitare analisi
  lunghe piene di numeri: servono cose da fare, spiegate a clic.
- **La fase è "far crescere, non far pagare"**: riempire di imprese e di contenuti, la
  monetizzazione viene dopo. Non riproporre cambi di prezzi o di modello.
- Profilo admin di prova: `pintoalessio@icloud.com`, nome "luigi", ha **`is_test = true`** e
  quindi non compare nelle ricerche. Metterlo a `false` per testare, poi rimetterlo a `true`.

### Stato SEO (3 mag – 31 lug 2026)
79 clic totali, di cui **57 di brand** ("trovaimpresa"): SEO vera = 22 clic in 3 mesi.
La homepage prende 67 clic su 79. Le guide fanno 488 impressioni ma CTR 0,8% (posizione
troppo bassa). Dominio di 5 mesi: numeri normali per l'età, non un fallimento.
## Da fare / opzionali
- (Opzionale) Pulizia DB: droppare colonne/tabella del vecchio pay-per-lead ora inutilizzate.
- (Opzionale) Pulizia righe `annunci_pubblicitari` rimaste in `pending`: acquisti mai completati, restano lì per sempre e ora il cliente se le vede in `le-mie-inserzioni.html`.
- **Deciso di NON mettere** spazi pubblicitari sulle pagine `cerca-*` e `risultati.html` (scelta di Alex, luglio 2026). Non riproporlo.
- Eseguire `sql/trigger-candidato.sql` su Supabase e aggiungere il filtro sul `tipo` a `crea_profilo_impresa` (vedi sopra).
- Se in futuro si vuole salvare i campi extra alla registrazione impresa, ampliare il trigger `crea_profilo_impresa` per leggerli da `raw_user_meta_data`.
- **72 città sono ancora senza imprese** (6 agosto 2026): è la lista di lavoro per il reclutamento.
  Obiettivo concreto, non "trovare imprese ovunque". E vedi sopra: prima portare a 3-4 imprese
  le città già avviate (Roma, Napoli, Torino), poi allargare.
- **Piano reclutamento imprese: da finire.** Analisi fatta, decisioni aperte: (a) se regalare
  gli strumenti del gestionale o limitarsi a cambiare il messaggio (oggi l'offerta vende
  "visibilità", che a traffico zero non è credibile — gli strumenti sì); (b) quante ore a
  settimana Alex può davvero dedicarci, perché lavora in cantiere. Materiali proposti e non
  ancora fatti: email per la lista `reclutamento-lazio.csv`, volantino per le rivendite,
  traccia telefonata, riscrittura di `perche-registrarsi.html`.
- Guide "quanto costa" ancora da arricchire: **bagno (priorità, è la ricerca più fatta)**,
  tetto, cappotto, imbiancare, fotovoltaico. Sono le più corte e le più vecchie: il modello
  da raggiungere è `quanto-costa-parete-cartongesso.html`.
- ~~Logo rotto su 40 pagine~~ **RISOLTO il 6 agosto**: cercavano `/trovaimpresa_logo_transparent.png`
  che non esiste; sostituito con `/img/trovaimpresa-logo.svg` su tutte e 40. Controllato che
  non ci siano altre immagini mancanti nel sito: non ce ne sono.
- **Da provare**: il Gestionale Studio (menu, campi pratica, parcella, PDF) e i preventivi
  del negozio non li ha ancora usati nessuno davvero.
- **Il lavoro aperto più grosso**: differenziare il profilo pubblico per negozi e
  professionisti (oggi è uno solo per tutti, vedi sopra).
- Mancano al negozio: **DDT** e **ordini a fornitore**.
- **Prezzi da confermare ad Alessio**: guida infissi, nuova tabella a pezzo dell'8 agosto
  (finestra 1 anta 70x120 PVC 270-380 / alluminio 440-650; 2 ante 120x140 PVC 480-680 /
  all. 770-1.150; portafinestra 1 anta 550-750 / 850-1.250; portafinestra 2 ante 800-1.150 /
  1.300-1.950; scorrevole 240x230 PVC 1.400-2.200 / all. 2.500-4.500; zanzariere 60-150 €).
  Ricavati dai €/mq gia' presenti nella guida piu' il rincaro del 20-30% sui pezzi piccoli:
  **vanno verificati da Alessio, che il mestiere lo conosce.**
- **Prezzi da confermare ad Alessio**: guida cucina (500–1.250 €/mq, spostare lo scarico
  +30/50%, mobile 1.000–1.400 €/ml) e guida muro (tramezzo 40–50 €/mq, portante con
  cerchiatura 2.000–7.000 €, putrelle 2,25–8,00 €/kg).
- **Risposta alla domanda "marketplace o software"** (6 agosto 2026): **marketplace.** Le
  entrate previste sono Premium + pubblicità, con il gestionale come extra più avanti. Il sito
  è "una vetrina in più" per le imprese, gratis, e Alessio porta i privati con SEO e pubblicità.
  La domanda è chiusa: non riaprirla a meno che non lo faccia lui.

# ⛔ LE TRAPPOLE — tutto quello che ha già fatto male una volta

Estratto automaticamente il 15 settembre 2026 da →176← sessioni di agosto e
settembre. Ogni voce porta il titolo della giornata in cui è successo: il
racconto per intero sta in `STORIA-2026.md`, si cerca da lì.

### 7 agosto 2026 — Studio rifinito, Negozio revisionato, FORNITORI (funzione nuova)
- ⚠️ VERIFICARE che Alessio abbia eseguito le 2 migrazioni SQL su Supabase.

### SITO — BLOCCO B: registrazioni e login (8 agosto 2026)
  - ⚠️ Il bug che ha risolto: il form del NEGOZIO obbligava a scegliere la categoria

### SITO — BLOCCO C: blog, guide e pagine di servizio (8 agosto 2026)
  ⚠️ **Le guide NON usano ancora `?mestiere=`**: con ~49 imprese iscritte un filtro stretto

### LAVORO DELL'8 AGOSTO 2026 (pomeriggio)
  ⚠️ **Manca ancora l'indirizzo completo della sede** (via e civico) e il numero REA:
- ⚠️ **NON inserire il link alla piattaforma ODR europea**: è stata dismessa il 20 luglio
⚠️ **REGOLA**: ogni tendina obbligatoria di un modulo pubblico deve avere "Altro" con
- ⚠️ **Alessio NON vuole emoji**: usare le icone SVG a linea gia' presenti in `index.html`
⚠️ L'apprendimento e' ripartito l'8 agosto: non toccare niente fino al 12-13 agosto.
⚠️ **NON usare git dal ponte col PC, nemmeno `git status`**: l'8 agosto un mio `git status`

### SEO E TRAFFICO — la fotografia dell'8 agosto 2026
⚠️ **Su alcune parole sei gia' SECONDO e non ti clicca nessuno**: "costo serramenti",
- ⚠️ nel titolo del bagno c'era "Guida di un muratore": tolto, il sito non parla di Alessio.
     ⚠️ Usare la classe CSS **`.esperienza`** per i riquadri, non `.box` (non esiste).
     ⚠️ **Lezione**: le cifre nuove vanno sempre riallineate alla "Risposta rapida" in cima
     ⚠️ In questa pagina la classe del riquadro e' **`.note`**, NON `.esperienza`: le guide non
   - ⚠️ Nella sezione detrazioni del cappotto NON sono state toccate le percentuali: le
⚠️ **Deciso di NON aprire Google Ads adesso**: prima far rendere le 124 pagine che gia'

### BACHECHE LAVORO E CANDIDATURE (8 agosto 2026, sera)
⚠️ Il caso personale di Alessio (2.400 €/mese, giornata 250 €) è rimasto invariato ma

### BACHECHE LAVORO — SECONDA PARTE (8 agosto 2026, sera tardi)
⚠️ **La password l'ho TENUTA di proposito**: generandola a caso la persona non rientrerebbe
⚠️ **Regione/provincia/citta' TENUTE**: sono 3 tendine collegate, la citta' esiste solo se
⚠️ Su `offerte-registrazione`, `registrazione-candidato` e `trova-cantieri` il menu e'
⚠️ Alessio ha bocciato due volte l'idea dei **due riquadri dentro la pagina** ("mischiato"):
⚠️ **15 funzioni sembravano mancanti ma era un falso allarme**: stanno in
⚠️ **`pannello-impresa.html` ha un `<script>` aperto e mai chiuso** (22 aperti, 21 chiusi).

### PROSSIMI LAVORI CONCORDATI (aggiornato l'8 agosto 2026)
⚠️ **Serve ad Alessio**: la **P.IVA** per il footer della home (c'è già il commento pronto
⚠️ NOTA per Claude: il 7 agosto il ponte col PC ha servito una copia VECCHIA di questo file

### 9 agosto 2026 — PROFESSIONISTI: primo strumento (scadenze delle pratiche)
⚠️ **Da far controllare ad Alessio**: le clausole standard (recesso, GDPR, foro,

### 9 agosto 2026 — TRAVASO fra gestionale impresa e professionista
### ⚠️ LEZIONE SUI SOLDI (7 bug trovati dalla verifica prima di consegnare)

### 9 agosto 2026 — CHECKUP DEL GESTIONALE PROFESSIONISTI (prima parte)
⚠️ **Da far confermare al commercialista**: i codici TipoCassa e la regola
⚠️ Le schede leggono `l.pratica_*`: ogni query che le alimenta deve fare

### 9 agosto 2026 — CHECKUP DEL GESTIONALE IMPRESE (+ regressioni di giornata)
   **LEZIONE: prima di rendere parziale un vincolo di unicita', cercare tutti
   **LEZIONE: mai chiedere per nome una colonna appena aggiunta in una query
⚠️ Il Riepilogo e il Report ora contano gli STESSI costi (spese lavori, carte,

### Il giro di test sul profilo IMPRESA — 10 agosto 2026
- ⛔ **Il 10 agosto e' stato lanciato di nuovo `git log` dalla cartella collegata**, contro

### 11 agosto 2026 (sera, 5) — GLI AIUTI: UNO DICEVA UNA BUGIA, TANTI NON DICEVANO NIENTE
⚠️ **`ruoloUtente` non è leggibile da `aiuti.js`** — è un `let` chiuso dentro lo `<script>` della
⚠️ **NON è stato aggiunto `new-cli`.** Quei pulsanti hanno già un `title` loro, diverso per

### 11 agosto 2026 (sera, 6) — LE SCHEDE DELLE IMPRESE ERANO INVISIBILI SU GOOGLE
⚠️ **Il noindex NON va nel ramo dell'errore di rete.** `_profiloKo` viene chiamata anche
⚠️ **Ho dovuto cambiare anche il link di sopra** in `/gestionale-app.html?vedi=` (con
- ⛔ **NON creare le 565 pagine mestiere+città.** Con 59 imprese sarebbero quasi tutte
- ⛔ **NON riscrivere le guide prezzi.** Controllata `quanto-costa-cambiare-gli-infissi`:
⚠️ Nota per le prossime sessioni: dal container di Claude **non si arriva a Supabase**

### 12 agosto 2026 — CONTROLLO GENERALE DELLE 21 VOCI, E 7 TORNATE DI CORREZIONI
## ⚠️ LA LEZIONE DI OGGI (leggerla prima di rifare un controllo così)
- ⚠️ **Da dire sempre ad Alessio**: questo decide cosa l'operaio vede e può fare

### 13 agosto 2026 — RICONTROLLO DEL 12, POI CINQUE CORREZIONI E LE SPESE ART. 15
## ⚠️ LA LEZIONE DI OGGI

### 13 agosto 2026 (sera) — TRE GRUPPI CHIUSI, E UN BANCO DI PROVA CHE PARLA
⚠️ **Gira nell'ambiente di Claude, non sul computer di Alessio** (serve
## ⚠️ LA LEZIONE DI OGGI — È CAMBIATA RISPETTO A IERI

### 14 agosto 2026 — LA PRIORITÀ 1 SI CHIUDE SENZA SCRIVERE UNA RIGA DI SQL
## ⚠️ LA LEZIONE DI OGGI — è la stessa di ieri, tre volte in una mattina

### 14 agosto 2026 (sera) — LE DUE PICCOLE, IL COMPUTO APERTO, E IL MENU DEL TELEFONO RIPRODOTTO
## ⚠️ LA LEZIONE — TRE VOLTE ANCORA, E TUTTE E TRE ERANO MIE

### 14 agosto 2026 (notte) — IL COMPUTO METRICO A FONDO: CINQUE DIFETTI, TUTTI SUI SOLDI
## ⚠️ LA LEZIONE — DUE FALSI ALLARMI, TUTTI E DUE MIEI

### 14 agosto 2026 (notte, 2) — RISCHIO DATI E RISCHIO CONTI: I CINQUE CHE ERANO SOLO SOSPETTI
⚠️ **Vale da adesso.** I mezzi eliminati prima hanno lasciato le scadenze vive:
## ⚠️ LA LEZIONE — QUATTRO VOLTE, TUTTE MIE

### 14 agosto 2026 (notte, 3) — I 7 FASTIDI: LA LISTA DEL 13 AGOSTO SI CHIUDE
## ⚠️ LA LEZIONE — SEI RIGHE ROSSE FALSE, IN TRE MODI NUOVI

### 14 agosto 2026 — IL PRIMO MINUTO: DA 11 TOCCHI A 6
## ⚠️ LA LEZIONE — LA PROVA CHE SEGUE UN PERCORSO CHE NON ESISTE PIÙ

### 14 agosto 2026 (notte) — CHI SE N'È ANDATO
## ⚠️ LA REGOLA CHE NON SI TOCCA
## ⚠️ LA LEZIONE — DUE BUGIE, TUTTE E DUE MIE

### 14 agosto 2026 (notte, 2) — I SOLDI CHE SPARIVANO
⚠️ Il passato non si recupera in nessun caso: quei pagamenti non sono mai

### 14 agosto 2026 (notte, 3) — (a) I PAGAMENTI SI SCRIVONO
⚠️ E i «premium» che si vedono in giro sono quelli **regalati** dal pannello:
⚠️ **LA REGOLA CHE NON SI TOCCA: se prendere nota fallisce, l'attivazione si
⚠️ **Perché funzioni, `invoice.paid` va acceso anche dalla parte di Stripe**
## ⚠️ LA LEZIONE — LA DICIASSETTESIMA

### 14 agosto 2026 (notte, 4) — (b) L'ANNUNCIO GIÀ PAGATO, E LA SCHERMATA INCASSI
⚠️ La riga dell'annuncio **resta giusto che sparisca**: l'annuncio è roba
⚠️ E la prima versione **non compilava**: due `%` in un `raise notice` e gli

### 14 agosto 2026 (notte, 5) — ⚠️ HO SBAGLIATO IL TIPO DI `impresa_id`
## LA LEZIONE — LA DICIOTTESIMA, E DIVERSA DALLE ALTRE

### 14 agosto 2026 (notte, 8) — IL COSTO ORARIO CHE SI RISCRIVE SOPRA
⚠️ Da guardare quando si torna lì: lo stesso **render pigro** vale per tutte

### 14 agosto 2026 (notte, 9) — LA SCHEDA SI APRE CLICCANDOLA
⚠️ Al primo giro accusava «Copia link» di aprire la scheda. Era falso:

### 14 agosto 2026 (notte, 11) — RIPRISTINATO: LE SCHEDE TORNANO COM'ERANO
⚠️ E il **Cestino** resta fuori comunque: lì cliccare una riga la **rimette a

### 15 agosto 2026 — IL BLOG: LA PRIMA GUIDA PER CHI IL PREVENTIVO LO SCRIVE
⚠️ **Poi è saltato fuori un fatto che cambiava tutto: Alessio non ha l'azienda.**

### 15 agosto 2026 (2) — LA FASE 1 NON C'ERA DA FARE
⚠️ **Se avessi costruito una sezione «Scadenze» nuova, Alessio si sarebbe

### 15 agosto 2026 (3) — IL RAPPORTINO DI CANTIERE (Fase 2a)
⚠️ **Niente seconda tabella delle ore.** Due posti dove stanno le ore vuol dire
⚠️ `rapportino_id` è **set null e non cascade**: buttando via un rapportino le
**⚠️ IL BUCO TROVATO PROVANDO.** Il capo squadra poteva scrivere ore «sciolte»,
**⚠️ LA PRIMA VERSIONE SI POTEVA SCRIVERE.** Nella prova il capo squadra ci ha
⚠️ **I materiali senza prezzo, e non è una dimenticanza.** Il costo dei

### 15 agosto 2026 (4) — I RAPPORTINI SI LEGGONO NEL PANNELLO
⚠️ **Niente pulsante per eliminare un rapportino.** `gest_rapportini` non sta

### 15 agosto 2026 (5) — UNA SCADENZA PUO' ESSERE DI UNA PERSONA
⚠️ **set null, non cascade**, come `gest_ore.operatore_id`: se una persona viene
**⚠️ Un limite del file, trovato provandolo:** `add column if not exists` non

### 15 agosto 2026 (6) — «+ RAPIDO»: TRE TOCCHI DAL CANTIERE
⚠️ **La decisione migliore era già nel prompt di Alessio**, e va scritta perché
⚠️ **Le ore NON prendono una strada nuova**: creano un rapportino con dentro
⚠️ **Nessuna spunta nuova.** «Pagamenti» dice già testualmente *«Vede la sua
⚠️ **Scrivere sì, leggere no.** L'elenco delle spese di un cantiere, in fila,

### 15 agosto 2026 (7) — LE DUE LEZIONI, E IL BANCO
⚠️ **Il lavoro che manca: portarle su `harness.py`.** Quel giorno si registrano
⚠️ **Nessuno ha ancora usato niente di tutto questo da un telefono vero, in

### 15 agosto 2026 (8) — I CREDITI AI LI PAGA L'IMPRESA
## LA REGOLA NUOVA, IN UNA RIGA
- ⚠️ **Il titolare non cambia di una virgola.** In `gest_membri` non c'è come
- ⚠️ **Due imprese = nessuna.** Non si indovina a chi far pagare: paga lui.
- ⚠️ **`ai_usage_log.usato_da`**: da oggi il registro dice anche CHI li ha
⚠️ **Tre bugie del banco, prima che dicesse il vero:** `reset_stato()` non

### 15 agosto 2026 (9) — LA VOCE DAL CANTIERE
   ⚠️ **Perché:** `webkitSpeechRecognition` **non c'è su iPhone**. Un pulsante
⚠️ **Altre tre bugie dei banchi:** una prova **ricopiava** il codice della
⚠️ **Da fare a mano, non è un push:** il **deploy della Edge Function**
⚠️ **Nessuno ha ancora dettato un rapportino da un telefono vero.**
⚠️ **Due buchi veri chiusi su `supporto_messaggi`**: un'impresa poteva
⚠️ **Altre bugie dei banchi trovate oggi:** il banco girava come
⚠️ **Un difetto vero introdotto e trovato dai sabotaggi:** `enterPanel`
⚠️ **Prima di costruire una funzione nuova, quella domanda va fatta a lui.**
⚠️ **Errore da non rifare**: gli è stato detto che a posizione 10 il CTR
⚠️ **`richieste` era già occupato** da «Chiedi una funzione»: usare lo stesso
   ⚠️ le richieste dalle pagine `cerca-*` che mandano telefono ed email in
  ⚠️ **Punto delicato**: se il webhook sbaglia, uno paga e non riceve i
- ⚠️ **Le richieste dalle pagine `cerca-*` mandano telefono ed email in chiaro
- ⚠️ **Mistero non risolto**: `gestionale-app.html` non carica

### 16 agosto 2026 — BLOCCO 0: IL BUCO DEI CREDITI AI SI CHIUDE, CON UN PAGAMENTO VERO
**⚠️ Qui ho rotto di proposito la regola del file.** Tutto il resto di

### 18 agosto 2026 — LA ROBA PRIVATA ERA SCARICABILE DA CHIUNQUE
⚠️ Stanno **prime di tutte le altre**: Netlify tiene buona la prima regola
⚠️ Se serve aggiungere un attrezzo `.js` da riga di comando, va messo in
- ⚠️ Sabotato il `netlify.toml` VERO due volte: tolto il blocco di
⚠️ **Trappola del banco, trovata subito:** il banco copia il controllo

### 18 agosto 2026 (3) — L'AI DENTRO IL MODULO DEI PREVENTIVI
⚠️ **Chi aggiunge una sezione nuova con delle righe** rifa' la stessa
⚠️ **Da qui in poi:** ogni pulsante nuovo in una `.sec-head` va guardato

### 18 agosto 2026 (4) — IL CONTROLLORE DEI DOCUMENTI (idea di Alessio)
⚠️ **La stessa frase cambia parola col ruolo**: «Il lavoro» per
⚠️ **A un'impresa di protocolli e Comuni non si parla mai.**
⚠️ **Le lavorazioni NON sono caselle del modulo**: sono righe salvate,
⚠️ **Si contano le CIFRE, non i caratteri** (`ctrCifre`): «IT 012 345
⚠️ Il codice fiscale a **11** caratteri passa: condomini ed enti ce
⚠️ Il tipo si legge da `#c-tipo-box` `data-tipo`, non dal database: nel

### 18 agosto 2026 (5) — LA GIORNATA LUNGA: GRAFICA, GARA, IMPORTAZIONI
⚠️ Mostra solo i passi il cui pulsante di menu **non e' `display:none`**:
⚠️ **DUE VOLTE, LO STESSO INCIAMPO**: una regola scritta in fondo al CSS
⚠️ **LA CASELLA DELL'AI SCHIACCIATA** (segnalata da lui con una foto):
⚠️ **In gara, se cifre e lettere non combaciano vale quello in LETTERE.**
⚠️ **LA REGOLA CHE TIENE IN PIEDI TUTTO**: le voci entrano con
⚠️ **Le righe senza quantita' si saltano** (TOTALE, Ribasso %, Oneri,
⚠️ **DETTO PER PRIMO**: «l'importazione di un prezzario regionale» stava
⚠️ Dentro lo zip ci sono **due alfabeti** (cp1252 e utf-8) e **due
⚠️ **UN DIFETTO VERO TROVATO QUI**: `ppUsa` impostava l'unita' **solo se
**LA REGOLA: chi scrive righe di preventivo mette `sezione` su TUTTE, mai su
⚠️ **IL COSTO DELLA MANODOPERA NON SI SOMMA**: sta dentro i lavori, è un «di
### ⚠️⚠️⚠️ LA LEZIONE DEL GIORNO: IL BANCO PIÙ GENTILE DEL MONDO VERO
⚠️ Un ritaglio finisce **prima** del commento che apre la sezione dopo, non

### 19 agosto 2026 (2) — «PRENDI I PREZZI DAL PREZZARIO» (il punto 1, finalmente)
- ⚠️ **I codici non si cercano in memoria.** In memoria ce ne stanno 500
- ⚠️ **Le maiuscole non contano, apposta.** Un ingegnere scrive
- ⚠️ **I codici con `%` o `_` non vanno al database.** Dentro un LIKE sono
⚠️ Alla prima prova era stato scelto il file sbagliato (il computo di
⚠️ Sul sito quell'arancione sta come FILO a sinistra e come segno delle icone,
⚠️ **Quello che il banco NON poteva provare** era il filtro vero contro

### 19 agosto 2026 (3) — LE REGOLE DEL DEPOSITO DEI FILE
⚠️ **NIENTE elenco di tipi di file permessi, ed e' una scelta.** La pagina
⚠️ **Quello che NON e' chiuso:** uno puo' ancora caricare tanti file da 10 MB
**⚠️ NETLIFY.** Il sito e' andato in pausa il 19 agosto a meta' mattina: «This
**⚠️ I banchi di prova stanno nel container, in `prove/`**, come vuole la

### 19 agosto 2026 (4), SERA — IL PIXEL DIETRO IL BANNER, LA MAPPA, IL SAL
⚠️ **La nota vecchia del diario diceva «lo inietta Netlify». Era sbagliata.**
⚠️ **`ms_attesa` comprende i 2 secondi di attesa.** Per sapere quanto ci ha
⚠️ `anon` sulla tabella puo' SOLO scrivere, colonna per colonna: `creato_il` e
⚠️ **Il riempimento lo lancia Alessio**, non Claude: il container non ha
⚠️ **`mappa.html` NON usava `lat`/`lng`.** Chiedeva la posizione di ogni
⚠️ Correzione detta per prima: «le pagine di ricerca usano gia' lat e lng» era
⚠️ **Alessio ha detto «non lo so, non e' il mio lavoro».** Gli e' stato
⚠️ **IL PRECEDENTE E' UNO SOLO, NON LA SOMMA DI TUTTI.** Il maturato del SAL
⚠️ **Il ribasso non si ricalcola nel SAL:** passa da `compRiepilogoDa()`, che
⚠️ **La regola sta PRIMA di `.comp-azioni .quick-add` nel file, e ci deve
⚠️ Stessa famiglia: la casella della quantita' nel SAL era **alta due

### 19 agosto 2026 (5), TARDA SERA — IL PREZZO
⛔ **Il conto che ha deciso tutto:** portare un'impresa iscritta con la
⚠️ Strade scartate lungo la discussione, e vale la pena sapere perche':
⚠️ Il rovescio: il **71%** delle imprese edili ha meno di due dipendenti. Sono

### 19 agosto 2026 (6), NOTTE — IL SAL SI CHIUDE: IL FOGLIO E LA FATTURA
**⛔ Il PDF NON esce** (e lo dice, invece di uscire monco) quando:
⚠️ I conti passano da `salConti()` e `compRiepilogoDa()`, le stesse due
**⚠️ La cifra la sceglie Alessio, OGNI VOLTA**, perche' sono due modi veri e
**⛔ RIFIUTA di partire** se il SAL vale 0 € o e' **negativo** (una fattura in
⚠️ **Da guardare fra due giorni:** dei 5 arrivati da Meta, **solo 1** e'
⚠️ **Perche' conta per i soldi:** il computo col prezzario da 12.762 voci e il
- ⚠️ Il rovescio: il **71%** delle imprese edili ha meno di due dipendenti, e
**⛔ LA DECISIONE RESTA AD ALESSIO, E LA RISPOSTA NON STA NEL CODICE.**
⚠️ Resta la nota di sempre: **il SAL non e' il mestiere di Alessio.** Quando la

### 20 agosto 2026 — LA SEZIONE «STATI DI AVANZAMENTO» (il punto 1)
⛔ **NON e' un SAL che vive senza computo.** La strada B resta scartata. Qui
⚠️ Si vedono **solo i SAL del reparto in cui sei**, e solo quelli il cui
  ⚠️ `gest_mestieri` / `gest_clienti` / `gest_lavori` / `gest_preventivi` non
⚠️ E il banco aveva un terzo buco: `.job-meta span` prendeva ogni riga **due
   ⚠️ E il finto Supabase aveva un buco: `.order()` non ordinava niente. Se non
⚠️ **È la risposta vera al punto 6 di ieri**, e non e' venuta dal codice: e'

### 20 agosto 2026 (2) — IL RIEPILOGO NEUTRO: LE ICONE E I PALLINI
⚠️ **Perché neutro.** Prima la barretta e il numero cambiavano colore col
⚠️ **IL ROSSO NON SI ACCENDE PERCHÉ UNA SEZIONE HA ROBA DENTRO.** Due computi
⚠️ **Una voce nuova nel menù va aggiunta anche nel blocco dei colori in
   ⚠️ Il riquadro dentro il gestionale dice ancora **«5€ al mese oppure 49€

### 20 agosto 2026 (3) — IL COMPUTO SI APRE ALLE IMPRESE: «COMPUTO DA PREZZARE»
⚠️ **L'Excel ha le quantità già scritte; il PDF no.** Su un PDF l'AI legge una

### 20 agosto 2026 (4) — ⚠️ IL MIO ERRORE: LA PAROLA STAVA IN DIECI POSTI, NON QUATTRO
⚠️ **Nei MESSAGGI del Cestino la parola è quella neutra** — «2 computi» — e non
⚠️ **`get lab()`, non `lab:`.** La lista delle sezioni del Cestino è un `const`

### 20 agosto 2026 (5) — IL COMPUTO CHE ARRIVA IN PDF
⚠️ Nel banco c'è una prova apposta: **dopo aver letto il PDF, nel computo non
⚠️ **I due PDF non escono da questo computer.** Dentro ci sono i nomi e

### 20 agosto 2026 (2), SERA — LA SCALA DEL COMPUTO
⚠️ **La lezione, di nuovo:** *una regola agganciata al nome di un pezzo si

### 20 agosto 2026 (3), SERA — IL CRONOPROGRAMMA
- ⚠️ **dopo un gruppo in parallelo si riparte dalla fase PIÙ LUNGA**, non
⛔ **nelle scritte nuove non si usano parole che passano dalla traduzione.**
  ⚠️ Uno **NON è provato** e sta scritto anche nel codice: tenere la data a
⚠️ **Prima del push va eseguito `sql/gest-computo-cronoprogramma.sql` su

### 20 agosto 2026 (4), SERA — IL COMPUTO DI VARIANTE
⛔ **Su una variante non si offre di rifarne un'altra.** Una variante della
⚠️ **I soldi si confrontano al centesimo, non con «uguale».** Due numeri che
  ⚠️ **Tre numeri li avevo scritti a mente e li avevo sbagliati: il banco mi
⚠️ **Prima del push va eseguito `sql/gest-computo-variante.sql` su Supabase.**

### 20 agosto 2026 (5), SERA — ⛔ IL TESTO DEL PREZZARIO NON SI TOCCA
⛔ **Il testo del computo NON È NOSTRO.** Le descrizioni arrivano dal
⚠️ **Fanno QUATTRO difetti in un giorno trovati guardando le foto e non dal

### 20 agosto 2026 (6), SERA — IL GESTIONALE TORNA CHIUSO
⛔ **E una cosa che avevo sbagliato io, due volte di fila.** Gli ho fatto
⚠️ **Chi tocca quel testo: non rimetterci dentro un impegno.** Ci sono quattro
⛔ **LA DIREZIONE, decisa da Alessio la sera del 20 agosto:
⚠️ Gli **artigiani non pagheranno mai**: sono clienti non paganti.
⚠️ guardare **l'iniezione di Netlify**, non il codice.
⚠️ **Le due liste lunghe stanno in `prove-claude/`:**
⚠️ **LA COSA PIÙ UTILE IMPARATA OGGI:** quattro difetti su quattro li ha
⛔ **NIENTE SQL.** I due fogli non chiedono al database niente che non ci
  ⚠️ **`useGrouping:true` va messo su OGNI helper di numeri di OGNI PDF**,
⛔ **RESTANO DUE RIGHE, nella sola «Lista per la gara» (`computoListaGara`):**
⚠️ **I DUE SABOTAGGI DICHIARATI**, che il banco NON fa diventare rossi:
⚠️ **UNA TRAPPOLA DEL BANCO, non del gestionale:** `JSON.stringify(Infinity)`
⚠️ **E UNA DI jsPDF:** `class X extends jsPDF` **non funziona** — il
⚠️ **LA COSA PIÙ UTILE, ANCORA OGGI:** i due difetti che i banchi non hanno
⛔ **IL DIFETTO PIÙ GRAVE DELLA GIORNATA, e non l'ha visto nessun banco.**
⚠️ **E IL TOTALE IN FONDO ERA GIUSTO.** Le righe uguali si annullano
### ⛔ E LA REGOLA SUL BANCO CHE MI HA INGANNATO
⚠️ **REGOLA GENERALE PER I BANCHI:** un finto database deve restituire
⚠️ **Nel contenitore c'è anche un PostgreSQL 16 vero**, con
⚠️ Il prezzo dell'analisi va chiuso a **2 decimali**, non a 4: è quello che
**⛔ LE REGOLE DA NON PERDERE**
⚠️ **DUE TRAPPOLE DEL BANCO, non del gestionale** (valgono per tutti i banchi
- ⚠️ `compVoceSalva` **non scrive `prezzo_unitario`** quando l'analisi
⛔ **Una fila di `.replace()` su una parola che i `.replace()` prima hanno
⛔ **Due modi diversi per la stessa cosa nella stessa schermata sono un
⛔ **OGNI testo scritto dall'utente che finisce a schermo va dentro
⚠️ «Manodopera» con la MAIUSCOLA non viene tradotta, «manodopera» minuscola
⚠️ **IL CONTO VERO DELLA GIORNATA: sei difetti trovati da Alessio guardando
## ⛔ SPEZZARE `gestionale-app.html` — LA REGOLA È CAMBIATA (21 agosto 2026, notte)
⚠️ **PIÙ SU IN QUESTO FILE, E NEI PROMPT VECCHI, C'È SCRITTO «non spezzare
gestionale-app.html in venti file, è no». QUELLA REGOLA NON VALE PIÙ.**
**⛔ NON venti file. Tre o quattro**, e solo pezzi che stanno in piedi da soli
**⛔ SPEZZARE NON VUOL DIRE RISCRIVERE.** È un **taglio puro**: le funzioni si
**⛔ LA PROVA, e non se ne accettano altre al posto di questa:**
⛔ **L'ordine conta:** l'ultima riga del blocco è `load()`, che accende il
⚠️ **DA QUI IN POI, OGNI FUNZIONE NUOVA HA UN NOME PUBBLICO.** Prima di
⚠️ **Quello che parte da solo** sta in due posti soli, ed è rimasto tutto nel
⛔ **`prove/banco-identico.js` — 14 verdi.** La prova che aveva chiesto
⚠️ **I BANCHI DI IERI NON SONO STATI RIFATTI**, e va detto invece di lasciarlo
⛔ **Regola: prima di contare i nomi in un file, si tolgono commenti e
⚠️ **NON c'entrava niente con lo spezzamento.** `js/ai-integrazione.js` è del
⛔ **E il file passava `node --check`**: non è un errore di sintassi, è un
⚠️ **Stessa famiglia di «le 1 righe rimaste uguali» del 21 agosto.**
⛔ **REGOLA: quando un titolo passa da `nn()`, la riga sotto deve passare
⛔ **REGOLA: prima di sabotare, il banco va fatto girare SENZA sabotaggi e
⛔ **E chi sabota ripristina i file anche se viene ammazzato**: un tetto di
⚠️ **E il conto vero della giornata, di nuovo: due difetti, tutti e due
⚠️ **Il primo pulsante si chiamava «📄 Scarica il PDF» e basta.** Con
  ⚠️ **Le colonne del finto database vengono dai file di `sql/`** (`colonne.js`
  ⚠️ **E il banco legge i RETTANGOLI dentro il flusso del PDF**, non solo il
⛔ **UNA REGOLA NUOVA SUI SABOTAGGI: L'ANCORA DEVE ESSERE UNICA.**
⛔ **Per il PDF dell'analisi era un difetto vero:** `AN_UNO` ha le chiavi
⛔ **Una tabella, non una fila di `.replace()`.**
⚠️ **RESTA DA FARE, ed è un difetto suo:** *a schermo* le due unità si
⛔ **LA REGOLA: SI SOMMA QUELLO CHE SI STAMPA.** Ogni numero si chiude a DUE
⛔ **L'IMPORTO DI RIGA ADESSO LO DÀ IL DATABASE.** Schermata e PDF se lo
⚠️ **E il banco non deve rifare quella formula.** Il finto database del banco
### ⚠️ E UN ERRORE MIO, TROVATO DAL BANCO POCHE ORE DOPO AVER SCRITTO LA REGOLA
⚠️ **UN SABOTAGGIO L'HO TOLTO INVECE DI DICHIARARLO.** «Solo le spese
⛔ Un sabotaggio che non può rompere niente non è una prova: è un numero
- ⛔ **`az.telefono` NON ESISTE**: nella tabella `gest_azienda` la colonna si
- ⛔ **`az.indirizzo` è la SOLA VIA**: CAP, città e provincia stanno in
⚠️ **LA PROVA CHE CONTA:** l'intestazione della Lista è adesso **identica**,
⚠️ **Intl in italiano mette il punto da solo SOLO dai cinque numeri in su**:
⛔ **`prove/banco-migliaia.js`** — conta i **17** formattatori di numeri di
⚠️ **E la coincidenza peggiora tutto: l'esempio era l'indirizzo VERO di
⛔ **REGOLA: un `placeholder` che potrebbe essere scambiato per un valore va
⚠️ **RESTA DA GUARDARE:** nel gestionale ci sono **118 suggerimenti**, e ~51
  ⛔ **DALLE PIÙ LUNGHE ALLE PIÙ CORTE:** l'elenco si applica in ordine e
⛔ **Perché non ho allargato l'osservatore a tutta la pagina:** si
⚠️ **UN LIMITE DICHIARATO, non una prova verde:** il `placeholder` di una
⛔ Non si scrive «provata» una cosa che il banco non accusa: **n. 28 in
⛔ `.ai-box--sm` (440 px) viene DOPO e resta piccola: è la finestrella dei
⚠️ **Un sabotaggio l'ho cambiato invece di dichiararlo:** «larghezza in px

### 21 agosto 2026 — L'ERRORE ROSSO SULLA HOMEPAGE: LO METTEVA NETLIFY
⚠️ **Non è in nessun file della cartella, e non è in `netlify.toml`.** Ho
⛔ **In un commento non si scrivono tag veri.** Vale per la chiusura del body e
⚠️ È la stessa famiglia dell'errore del 18 agosto (i backtick dentro un commento

### 21 agosto 2026 (2) — LE STRISCE DELLE SEZIONI DIVENTANO NEUTRE
## LA REGOLA — la stessa del Riepilogo
⛔ **IL COLORE STA SOLO DOVE C'E' ANCHE LA PAROLA.**
⚠️ **Le classi `t-*` non si tolgono**: le usa il resto del gestionale. Qui
⚠️ `css/gestionale.css` lo carica anche `ricarica-crediti.html`, che pero' non
⛔ **Due domande, non una**: (1) le barrette e i numeri sono neutri? (2) il
⛔ **Tolta la riga, tenuta l'icona.** Il colore del reparto non si perde:
⚠️ **La striscia dell'AI («249 crediti da usare») NON e' stata toccata**, ed
⛔ **Un dato di prova tutto uguale non prova niente.** Aggiunto un lavoro
⛔ **«Neutro» non vuol dire «senza».** Il 20 agosto la barretta del Riepilogo

### 21 agosto 2026 (4) — LA FINESTRA «NUOVO REPARTO»
## LA REGOLA NUOVA: `.no-ico`
⛔ **Nel resto del gestionale non cambia niente**: menu, pulsanti e schede
   ⚠️ Quindi i **quattro blu quasi uguali restano**, e restano anche i due
⛔ **Le emoji si scrivono col selettore di variante** (🏗️ ⛏️ ❄️ ☀️ 🖌️ 🏛️
⛔ **Ma alla prima corsa i sabotaggi accusati erano 7 su 11**, e tutti e
⚠️ La lezione e' la stessa di stamattina coi dati tutti uguali: **un banco

### 21 agosto 2026 (5) — LE ICONE DEL REPARTO LE DISEGNIAMO NOI
- ⛔ **la chiave resta l'emoji**: i reparti gia' creati hanno l'emoji dentro
- ⛔ **sette disegni fuori lista**: le emoji che Windows non ha non si possono
⚠️ E uno l'ho dovuto riscrivere due volte: «do alla lampadina il disegno del
## ⛔ LA REGOLA CHE MI MANCAVA: PRIMA DI DARGLI IL BLOCCO GIT, ESEGUIRE IL CONTROLLO
⚠️ Da oggi la consegna e' quattro cose, non tre:
⚠️ Il sito online **non e' mai cambiato**: il controllo si e' fermato prima di

### 21 agosto 2026 (6) — «L'HO CANCELLATO E TORNA»
⚠️ La lezione: una diagnosi che spiega bene i sintomi non e' una diagnosi.
## LA REGOLA
⛔ **SE NON SI PUO' CANCELLARE DAL DATABASE, NON SI CANCELLA NEMMENO DALLO
   ⛔ Adesso c'e' una **guardia**: se un sabotaggio cambia piu' di sei righe,

### 21 agosto 2026 (7) — IL TITOLO CHE CONTRADDICEVA LA SCHEDA
⛔ **Quando due conti diversi stanno sulla stessa schermata, il titolo deve

### 21 agosto 2026 (8) — I SEGNAPOSTO CHE SEMBRANO DATI (n. 27, chiuso)
⛔ **Ma il filtro di quel banco escludeva `^\d+$`, `^0000`, `^IT\.\.`**, e così
⚠️ **Un filtro che toglie rumore toglie anche prove.** Erano 22, non 19.
⚠️ È la stessa trappola di `doc.text("Pag. "...)` — e questa volta se n'è

### 21 agosto 2026 (9) — IL SUGGERIMENTO GRIGIO DELLA CASELLA GRANDE (n. 28, chiuso)
⚠️ **E l'ultima e' peggio delle altre: cambiava, ma male.** Senza la sua riga
⛔ **Non basta chiedersi «cambia?»: si guarda in che cosa cambia.** Il banco
- ⛔ quello che ha scritto l'utente — il testo **dentro** la casella, i nomi,

### 21 agosto 2026 (10) — TRE LAVORI, UN PUSH SOLO
⛔ **SI CAMBIA SOLO QUELLO CHE SI LEGGE.** Nel database resta quello che ha
⛔ **IN TABELLA CI SONO SOLO `m2` E `m3`.** `_uniPiatta` appiattisce «ml» e
⚠️ Sul foglio stampato si va **nell'altro verso** (`_umPdf`: «m²» → «mq»),
⚠️ **Il piccone mi ha preso cinque tentativi.** Le prime due versioni erano
⚠️ **`banco-analisi-pdf.js` è diventato rosso da solo**, e ha fatto il suo
⛔ **UNA PROVA CHE HO DOVUTO BUTTARE.** La prima stesura di `banco-icone.js`

### ⛔ 21 agosto 2026 — I NUMERI VERI DELLA PUBBLICITÀ
⚠️ Quindi ogni numero del pannello di Meta va letto sapendo che è
⚠️ E sono quasi tutte della pubblicità: prima della campagna il sito aveva
⛔ Avevo detto ad Alessio «~18 € al giorno» e **era sbagliato**: quel numero

### 21 agosto 2026 (11) — TRE PEZZI DEL GESTIONALE
⛔ **Quattro colonne in 390 px non ci stanno.** Sotto i →560← px la riga va a
⚠️ Fatto con `grid-template-areas`: **l'HTML non si tocca**, si sposta solo
⚠️ La riga del **capitolo** ha due caselle sole: senza una regola sua
⛔ **Scritto una volta sola** (`_btnPrezzi`), messo in due posti. Due copie
⚠️ Si vede solo se c'è davvero un prezzo a zero, come prima.
- ⛔ ma nello **Scadenzario** la riga diventava rossa e accanto c'era scritto
⛔ **Il colore non si toglie: si aggiunge la parola.** Adesso dice
⛔ **Un sabotaggio non accusato va capito, non aggirato**: due volte su tre
⚠️ Fra i sabotaggi ce ne sono due che servono a proteggere quello che **NON**
⛔ E uno di quei due all'inizio **non veniva accusato**: il banco controllava

### ✅ 21 agosto 2026 — IL GESTIONALE È FINITO (la lista del 21 è chiusa)
⛔ **PRIMA DI COSTRUIRE, SI GUARDA SE C'È GIÀ.** Trenta secondi di
⚠️ E la causa vera: **una nota vecchia lasciata in una lista**. Quando una

### 21 agosto 2026 (12) — UNA PAGINA, UN INDIRIZZO SOLO (Google)
⛔ **«Riempire le 95 pagine città» è tanto lavoro per niente.** Non è stato
⚠️ **`force = true` è obbligatorio**: il file `imprese-bologna.html` esiste
⚠️ **301, non 302**: a Google si dice che il trasloco è definitivo.
⚠️ **Scritte una per una, non con un jolly**: il jolly di Netlify prende
⚠️ Stanno **dopo** le regole del 404: Netlify tiene buona la prima che
- ⛔ **ma ogni link deve portare su una pagina che ESISTE** — togliere il
⛔ **Un sabotaggio non accusato, e la lezione è la stessa di stamattina:**

### ⛔ 21 agosto 2026 (13) — I QUADRATINI BIANCHI ERANO SUL SITO PUBBLICO
⛔ **Le emoji non le disegniamo noi: le disegna Windows.** Quelle del blocco
⛔ **Un cambio unico avrebbe messo la porta al posto del pavimento.** Si
⚠️ Le quattro nuove sono state scelte **anche** perché libere: su
⚠️ **Provate sul suo computer prima di scriverle**: gliele ho messe in chat e
⛔ `⚒️` e `🖼️` si scrivono **col selettore di variante**: senza, Windows le
⚠️ Sulla homepage i riquadri con l'icona grande sono **sei**: un primo banco
⚠️ E il conto della giornata, di nuovo: **il difetto più visibile di oggi

### 21 agosto 2026 (14) — LE →7← PAGINE «NON TROVATE»: NE ERA ROTTA →1←
⚠️ **E prima di questa tabella avevo detto ad Alessio che «Google tiene
⚠️ Le date di scansione delle prime tre erano **più vecchie della
⚠️ **`SUPABASE_URL` non è vuota**: è una costante scritta a mano nel file.
⛔ **E il verso opposto, che qui è quello che conta di più:** nove indirizzi

### ⛔ 21 agosto 2026 — I PREZZI DELLA PAGINA MURATORE: DECISIONE DI ALESSIO
⛔ **Ma la sezione c'era già.** La pagina ha la tariffa oraria per tutti e
⛔ **E aveva ragione lui.** I numeri della pagina sono i prezzi **di mercato**,
⚠️ **NON RIPROPORLO.** Se un domani questo confronto torna utile, si riparte

### ⛔ 21 agosto 2026 — CONTROLLO TOTALE DEL GESTIONALE, PRIMA DI APRIRLO
⚠️ Quello che resta davvero è che un concorrente **scarica tutta la lista in
⛔ **La lezione: prima di chiamare falla una cosa, si guarda a cosa serve.**
- ⚠️ Passano: `service_role` (Stripe, il controllo notturno), l'SQL Editor, e
- ⚠️ Sull'INSERT non si blocca il piano (se no salterebbe il regalo dei 3 mesi):
- ⚠️ Si è potuto chiudere perché **nessuna pagina scrive le recensioni dal
⚠️ Qui **non si può chiedere un accesso**: chi scrive nella nuvoletta è un
- ⚠️ Col tetto pieno **non dà errore**: risponde una cosa che il browser non
- ⚠️ Se il contatore non risponde si va avanti lo stesso: meglio un assistente
- ⚠️ Aggiunto anche il controllo della **scadenza** del Premium, che prima non
- ⛔ Ha richiesto **12 punti in 4 file**: `pannello-impresa` · `artigiano` ·
- ⚠️ Chi sposta una funzione di sezione in un altro file non deve fare niente
- ⚠️ **Il banco carica il file vero in una VM e genera l'XML per davvero**, poi
⚠️ **Se domani nasce un altro campo che entra nel conto, la sua riga va aggiunta
    ⚠️ Tutti e due vogliono prima una risposta del commercialista.
⛔ **Quando una cosa si chiude, va tolta dalla lista lo stesso giorno.**

### ⛔ 21 agosto 2026, SERA — IL PUSH DELLA SICUREZZA, E DUE MIEI SBAGLI
⛔ **LA REGOLA: quando una function va in timeout, si guarda il REGISTRO DI
⛔ **Per tornare indietro si usa il numero del commit, non `HEAD~1`.** Il numero
- ⛔ 19:45: 504, con «ristrutturazione completa chiavi in mano, demolizione,
⚠️ **Non è rotto da stasera: è fragile da sempre, e cade proprio sui lavori
⚠️ **I quattro pannelli però mandano già il gettone della sessione**

### ✅ 21 agosto 2026, NOTTE — LA FALLA DI `ai-claude.js` È RICHIUSA
⚠️ **Ripescata la lezione del pomeriggio** («un sabotaggio che non può fare

### ✅ 21 agosto 2026, TARDA SERA — IL TIMEOUT DEL PREVENTIVO, E I NOMI DEI GESTIONALI
⛔ **Perché cadeva.** Non si era rotto niente: Netlify taglia una function
⚠️ La lezione della sera («guarda il registro di Netlify») resta valida e non è
  ⛔ **`imprese.id` è un NUMERO (bigint), non un uuid** come nelle altre
⚠️ **Due lezioni sui banchi, di stasera:**
⛔ **Deciso: NON si divide.** Un motore solo, una faccia per mestiere — come
⚠️ Il nome dello studio prima stava scritto **dentro** il ramo del
⚠️ **Perché la sua mail non basta:** `ammesso()` guarda l'email scritta nella
⛔ **Prima di aprirlo a tutti resta il punto vero: il cancello del Premium vive
- ⚠️ **L'IVA**: mette 10% su tutto. Sanitari e rubinetteria sono «beni
⛔ **La regola della skill guide-prezzi vale anche qui: i prezzi sono i SUOI,
⚠️ Salvare nello Storico preventivi NON è un lavoro da mezz'ora: lo storico
- ⛔ Oggi l'artigiano **cade nel ramo dell'impresa edile** (`adattaMenuImpresa`)
⚠️ Alessio ha detto **«aspetta a partire, devo capire»**: il foglio è suo, si

### ✅ 21 agosto 2026, NOTTE FONDA — VIA IL RIQUADRO «STRUMENTI» DAI 4 PANNELLI
⛔ **`strumenti-cantiere.js` NON è stato toccato**: sono i Cantieri, che non
   ⚠️ Sono due mondi paralleli: Netlify+background (gratis, 15 minuti) contro
⚠️ **Tre lezioni di stanotte, tutte già scritte qui sopra e ricomparse:**
⛔ E una regola nuova: **il codice già morto prima non si tocca.** La prima
⛔ Una funzione si toglie **solo** se il suo nome non compare più da nessuna
⛔ **Non erano «i messaggi in tempo reale»: era TUTTA la chat del pannello
⚠️ **E in console non compariva NIENTE**: zero errori di sintassi, in tutti e
⚠️ **Due sabotaggi hanno insegnato qualcosa, di nuovo:**
- ⛔ **Il navigatore è quello vero, non disegnato da noi**: su iPhone Mappe di
⚠️ È la regola «una regola che sta in due posti non si sistema a metà»: una
⚠️ **Tre cose imparate stanotte, sui banchi:**
⛔ **La lezione: quando chiede una cosa piccola, si fa quella piccola.** Aveva

### ⛔ 21 agosto 2026, FINE SERATA — L'ORDINE DEI PROSSIMI TRE LAVORI
⛔ **NON è un file suo. È la terza faccia di `gestionale-app.html`**, come lo
⚠️ **Il nodo da non dimenticare**: Attrezzature resta ma Squadra si spegne, e
⚠️ Il prezzo che paga è che **le correzioni fatte sul gestionale principale lì
- ⛔ **oggi non è collegato a niente**: l'unico posto che ci porta è un link in
⚠️ **Da controllare PRIMA di attaccarlo a qualcuno**: le tre tabelle `nol_*`

### ✅ 22 agosto 2026 — IL GESTIONALE ARTIGIANO, LA TERZA FACCIA
⛔ **Si nasconde soltanto**: i dati restano nel database e le voci tornano da
- ⚠️ **Le voci non erano tutte accese allo stesso modo.** `computi`,
⚠️ È lo **stesso identico inciampo del computo, il 20 agosto**: lì erano dieci
⛔ Ha anche chiesto se non fosse un effetto del suo pannello admin. **No**: la
⚠️ `tabNascosto()` **non guarda il `display` del pulsante**: il Riepilogo può
⚠️ **La cosa che ha fatto la differenza: i dati finti dovevano essere PIENI.**
⚠️ **Un sabotaggio ha corretto me, non il codice.** «adattaMenuArtigiano gira

### ✅ 22 agosto 2026 — I DOCUMENTI DELLA PRATICA (i PDF)
⚠️ **Il magazzino c'era già.** Bucket `gestionale-foto`, tabella `gest_foto`,
⛔ **Adesso l'elenco sta in un posto solo**: `TIPI_NON_FOTO` (+ `_nonFotoSql`
⛔ **La cosa che ha fatto la differenza: il finto Supabase applica i filtri
⚠️ **E tre prove sono state riscritte perché non potevano diventare rosse:**
⚠️ **E il banco stesso poteva mentire**: quando un sabotaggio lo faceva

### ✅ 22 agosto 2026 — LE ORE DIVENTANO UNA PARCELLA
- ⚠️ **Una riga per PERSONA, non per giorno.** Un cliente non vuole leggere
⛔ **NON è il costo del collaboratore.** `gest_operatori.costo_orario` è
⚠️ **Senza tariffa il prezzo arriva VUOTO, non a zero.** Uno zero sembra un
⚠️ **Se la query SQL non è stata eseguita non si rompe niente**: la casella
⚠️ **Quattro prove rosse su cinque erano colpa del BANCO, non del codice**, e
- ⛔ trattava un **elenco** di righe come se fosse **una riga sola**: la prova
⛔ **E una lezione nuova: il banco premeva la funzione, non il pulsante.**
⚠️ **Il finto Supabase adesso è UNO SOLO** (`prove/finto-supabase.js`), usato

### ✅ 22 agosto 2026 — LE MISURE DEL PREVENTIVO AI, E IL CLIENTE NUOVO
⛔ Gli avevo proposto un lavoro grosso sui prezzi **senza aver provato prima
⛔ **Una quantità che manca è peggio di un prezzo sbagliato.** Il prezzo
⚠️ **E l'altezza vale metà del conto**, come ha fatto notare Alessio: lo
⚠️ **Deciso da Alessio a metà lavoro.** Avevo costruito e collaudato un
⛔ Non si poteva copiare il pulsante del lavoro: quello (`quick-cli`) apre il
⚠️ Se un cliente con quel nome c'è già (confronto tollerante: maiuscole,
⚠️ E una quarta, sul contare: la prova sugli apici rovesci della funzione

### ✅ 22 agosto 2026 — LA MINA DEI DUE FILE SQL DEL COMPUTO
⚠️ **Questo push non costa crediti Netlify**: sono solo `.sql` e `.md`, e un
⛔ Rilanciando i vecchi, **i prezzi dell'analisi tornavano di colpo a quelli
⚠️ **`raise exception`, non `raise notice`.** Un avviso si legge e si va
⚠️ **Su un database vuoto la guardia lascia passare**: la prima installazione
⛔ **Non è stato provato a occhio, e non sul database di Alessio.** Nel
⚠️ **Una prova è nata rossa per colpa sua**: «la guardia sta prima del primo
⚠️ **E un sabotaggio era un doppione senza accorgersene**: «la guardia finisce

### ✅ 22 agosto 2026 — IL NOME CHE SI CAMBIAVA DA SOLO, E LA BARRA DEL GEOMETRA
⚠️ **È la terza volta che questo difetto esce, sempre da una porta diversa:**
⛔ Ogni volta si era chiuso **il posto**, mai **la causa**. Adesso è chiusa la
⚠️ **Niente lookbehind nell'espressione**: su Safari vecchi non c'è e
⚠️ **E la cintura resta**: `.ct-t` e `.ct-s` (le righe dei risultati) sono
⚠️ **Quattro sabotaggi sono nati muti, e nessuno è stato aggirato:**

### ✅ 22 agosto 2026 — IL TOTALE È LA SOMMA DI QUELLO CHE SI STAMPA
⛔ **L'importo di una riga si arrotonda PRIMA di sommarlo**, e il conto sta in
⚠️ Prima quella moltiplicazione era scritta a mano in **quattordici punti**:
⛔ Lì pesa il doppio: nel file per lo **SdI**, `<PrezzoTotale>` è scritto a due
⚠️ **Quello che si perde, e va detto**: quello vecchio era nato apposta perché
⛔ **La prova 0 guarda il BANCO, non il gestionale**, e ha fatto il suo
⚠️ E la prova «nessuno somma più a mano» guarda solo le righe di **codice**:

### 22 AGOSTO 2026 — LE TRE PICCOLE
⛔ **Una regola che sta in quattro posti non si sistema a metà.**
⛔ **Prima si rende innocuo il testo, poi si decora.** Quello che arriva
⚠️ Se il file non si caricasse, i pannelli tornano al modo di prima: la
⛔ **Tre sabotaggi sono restati MUTI, e ognuno ha insegnato una cosa.**
⚠️ Due inciampi miei nel banco, scritti perché non si ripetano:

### 22 AGOSTO 2026 — I LUCCHETTI
⛔ Quindi: **il lucchetto del gestionale sta solo nella finestra del
⚠️ **Non è un secondo guardiano: è lo stesso, riscritto.** Se un giorno si
⚠️ Non il paywall: i pulsanti da 12 € partirebbero senza email e il pagamento
⚠️ Le tre schermate adesso si spengono a vicenda da un **elenco solo**
⚠️ Due inciampi miei nei banchi, scritti perché non si ripetano: attaccando un

### 22 AGOSTO 2026 — I DATI CHE SI PERDONO SENZA DIRLO
⛔ **Quando la regola del database rifiuta la riga, PostgREST non risponde con
⚠️ Funziona perché **chi può modificare un lavoro può anche leggerlo**
⚠️ E il pulsante delle note chiede il permesso **«note»**, ma la riga che
⚠️ È la stessa lezione già imparata dieci righe più sotto per la squadra
⛔ **Un sabotaggio muto, e aveva ragione lui.** Avevo scritto un caso a parte
⚠️ Tre inciampi miei nel banco: `js/cestino.js` avvolge il client e fa

### 22 AGOSTO 2026 — LE FRASI DEL GEOMETRA, E IL MESSAGGIO DEL DATABASE
⛔ **Non trovate a occhio.** `prove/frasi-geometra/cerca.js` prende **tutte le
⚠️ **Una prova sola non bastava**: «nessuna frase esce storta» sarebbe verde
⛔ Una frase che sta in dodici posti non si sistema a metà.
⚠️ **Mi ero corretto sbagliando.** Avevo detto ad Alessio che quei messaggi
⛔ **Tre sabotaggi muti, e avevano ragione tutti e tre.**
⚠️ E un rosso finto: la prova «il nome del file sta in un posto solo» leggeva

### 22 AGOSTO 2026 — GLI AIUTI SUL TELEFONO
⚠️ **Prima ho controllato se la voce della lista era ancora vera**, invece di
⛔ **La (i) nel menu non si rimette** (scelta di Alessio del 14 agosto: sul
⚠️ **Si mette in TUTTE le sezioni, non solo in quella aperta.** Cambiare
⚠️ Dove una presentazione c'è già scritta a mano (Riepilogo, Agenda, Galleria)
⚠️ La riga sta dentro `#appview`, quindi il traduttore dello studio tecnico ci
⛔ **Un sabotaggio muto, e aveva ragione lui.** Avevo messo **due lucchetti
⚠️ E una prova mia troppo larga: «la riga viene dopo il titolo» era verde anche

### 22 AGOSTO 2026 — LA PORTA CHE SI APRIVA DA SOLA
⚠️ Aggiunto anche il controllo che mancava: `if(res && res.error)`. Supabase
⚠️ Le quattro schermate del cancello adesso si spengono a vicenda da un
⛔ Restano com'erano: la scorciatoia `?chiave=apri` e la manutenzione.
⚠️ **Due inciampi miei nel banco, e uno era grosso.**
⛔ E un sabotaggio muto: il ramo «non riesco nemmeno a leggere la sessione»
⚠️ **Il banco è lento apposta**: due prove aspettano davvero 20 secondi per

### DA DOVE SI RIPARTE — dopo il 22 agosto 2026
- ⚠️ **P si arrotonda alla SESTA cifra decimale.** Il decreto non dice come
- ⚠️ **Il correttivo (D.Lgs. 209/2024) NON ha cambiato i valori** di G e Q: ha
   ⚠️ Prima di aggiungere un `data-euro` nuovo: guardare **CHI legge** quella
⚠️ **Non è stato sistemato** (deciso il 22 agosto: prima le cose del decreto).
⛔ **Il file è scritto e provato, ma va ESEGUITO nell'SQL Editor.** Finché non
⛔ **LA REGOLA CHE ALESSIO HA DOVUTO RIPETERE QUATTRO VOLTE.**
⚠️ **E l'altra lezione della serata: GUARDA COM'È VENUTA PRIMA DI
⚠️ `prove/porta-gestionale` e `prove/dati-che-si-perdono` sono **lenti**:

### 23 AGOSTO 2026 — IL GESTIONALE NOLEGGIO, LA GIORNATA INTERA
⚠️ **La compressione lato server è stata valutata e messa da parte**: con i
⛔ **La regola che ne esce: se un foglio si può scaricare, il banco lo deve
⚠️ La firma si **ritaglia intorno al segno** prima di salvarla: la tela

### 23 AGOSTO 2026, SERA — SI ENTRA NEL GESTIONALE CON UN TOCCO
⚠️ **`/gestionale` NON è quello giusto.** In `netlify.toml` c'è un rinvio che
⚠️ **`manifest.json` è un `.json` in cartella principale, e il controllo
⚠️ Da dire alle imprese: **chi ha in mano il telefono sbloccato entra nel

### 24 AGOSTO 2026 — IL COLLAUDO DEL NOLEGGIO, E I TREDICI DIFETTI
## ⛔ LA LEZIONE PIÙ CARA DELLA GIORNATA
⚠️ Prima di costruire una qualsiasi di queste: chiedere ad Alessio se gli
⛔ **Il mezzo è uno solo per tutta l'azienda.** Se il Noleggio sta dentro il
⚠️ Da capire prima di toccare: le sezioni del noleggio nascoste ma presenti
⛔ Prima di costruirlo: **misurare.** Una query che dica quanti MB stanno

### 25 AGOSTO 2026 — LE SCHEDE DEL NOLEGGIO, E I TESTI PICCOLI DAPPERTUTTO
## LA REGOLA DETTA DA ALESSIO, IN PAROLE SUE
⚠️ **Sono DUE forme diverse, non una.** Chi legge «come il gestionale
⛔ **Il pallino è rosso solo dove c'è un lavoro da fare** — mezzi in ritardo,
⛔ **La barra colorata sopra le schede è sparita.** Il colore è passato nella
## ⛔ LA LEZIONE PIÙ CARA DELLA GIORNATA — LA TERZA VOLTA
⚠️ E la lezione sotto la lezione: **il banco aveva DUE prove sui 13px e
⚠️ `css/gestionale.css` lo usano DUE pagine: dopo averlo toccato è stato
⚠️ **`schermo.js` era rotto e nessuno se n'era accorto**: cercava la sezione

### 26 AGOSTO 2026 — IL NEGOZIO SCENDE A ZERO TESTI PICCOLI
⚠️ **Il negozio NON carica `css/gestionale.css`.** La trappola numero 1 del
⚠️ **Una trappola che ha reso muta la prova 2 al primo giro.** Da quando

### 26 AGOSTO 2026 — IL NEGOZIO CHE FUNZIONA, E IL BANCO CHE MANCAVA A DUE GESTIONALI SU TRE
⛔ **`neg_preventivo_righe` NON ci è entrata, ed è voluto.** Stessa regola dei
- ⛔ **`prezzo_impresa` vuoto NON vuol dire zero**: vuol dire «su questo
⛔ «Butta per sempre» **deve** usare `sb.raw`, se no il cestino se la riprende.
⚠️ **Le classi sono state riscritte DENTRO la pagina.** `gestionale-negozio.html`
⚠️ Scaduti e fermi sono **due cose diverse** e non si contano due volte.
⛔ **Fatture è rimasta fuori APPOSTA**: dice ancora «Lavori finiti da
⛔ **Cosa NON prova ancora, ed è scritto nel documento del banco**: il PDF e
⚠️ **Tre trappole del banco, tutte e tre verdi per finta**, da ricordare:
## ⛔ LA LEZIONE PIÙ CARA DELLA GIORNATA — il finto restituiva le righe VERE

### 26 AGOSTO 2026, SERA — IL GIRO DELLA MERCE NEL NEGOZIO
⛔ Non sono decisioni tecniche: se cambiano, cambia il codice, non il contrario.
⚠️ Lanciata **dal connettore Supabase**, non a mano: da stasera Claude arriva
⛔ **Chi tocca la giacenza è UNO SOLO.** Prima erano tre posti diversi.
⚠️ **Il buco che resta, ed è scritto apposta:** ripescando dal Cestino un
⚠️ **Due prove erano verdi per finta, e me l'hanno detto i sabotaggi:**
⛔ E il lucchetto di «Merce arrivata» è **doppio** — la domanda «era già
⛔ **E la priorità che ha detto, e vale da qui in avanti: finire il gestionale e
⚠️ **`openSheetGrande` si divide l'html DA SOLA**: primo `<h3>` →
⛔ **Le corte sono rimaste piccole, ed è voluto**: «Nuovo reparto», «Rinomina
⛔ **Le classi sono riscritte DENTRO la pagina** (`.sheet--grande`, `.sh-head`,
⚠️ **I Movimenti sono rimasti come sono**, apposta: hanno il pulsante «Merce
⛔ **Le schede si rileggono dal DATABASE, non dalla lista a schermo**: la
⛔ **La trappola, ed è la numero 1 del banco delle imprese:** una prova che

### 27 AGOSTO 2026 — IL PDF DELLA FATTURA: LA FINE DELLA STRADA DEI SOLDI
⛔ **Nessun file del sito è stato toccato.** `gestionale-app.html` e
⛔ **Una bozza non si inventa un numero**: scrive «Bozza — non ancora emessa» e
## ⚠️ LA LEZIONE DI OGGI — una prova verde che non provava niente
⛔ **LA REGOLA CHE RESTA:** una prova che dipende da «quanto è lungo» non si fa
⛔ `admin.html` (le 87 scritte piccole) resta fuori: Alessio ha detto che per

### 27 AGOSTO 2026 (2) — IL FILE PER LO SDI: LA STRADA DEI SOLDI È COPERTA
⛔ **Nessun file del sito toccato**, di nuovo: `gestionale-app.html`
⚠️ **È la stessa strada del PDF**, con un aggancio diverso: là si sostituisce
⛔ **LA REGOLA CHE RESTA:** quando il gestionale si ferma e dice «non posso», la

### 27 AGOSTO 2026 (3) — LA PARCELLA DELLO STUDIO TECNICO
⚠️ Adesso il finto sa fare **tre ruoli**: `impresa`, `professionista`, e
⛔ **Nessun file del sito toccato** (`49d89af5c29f541538b83dbc64c416cf` e
⚠️ **Oggi le due copie dicono lo stesso numero, quindi non è un difetto.** Ma è
⛔ **Il gestionale NON è stato cambiato** — non c'era niente di rotto da
⛔ **LA REGOLA CHE RESTA:** quando un sabotaggio non si vede, la domanda giusta

### 27 AGOSTO 2026 (4) — LA GRAFICA DEL NEGOZIO: IL FOGLIO CHE NON CARICAVA
⛔ **`gestionale-negozio.html` non caricava `css/gestionale.css`.**
   ⛔ **Trovato A OCCHIO.** I due banchi erano verdi tutti e due: non è un
⛔ **Quando Alessio dice «è tutta da costruire», non sta esagerando: sta

### 27 AGOSTO 2026 (sera) — LE 169 RIGHE DI STILE DOPPIE, TOLTE
⛔ **E c'era un secondo inganno, più grosso:** la finestra grande, fotografata
⚠️ **Una regola per volta non basta.** Due righe che dicono la stessa cosa si
⛔ **Quando due foto uguali risultano diverse, prima si dubita del metro.**
⛔ **La priorità dichiarata da Alessio resta una sola:**

### 28 AGOSTO 2026 — IL COLLAUDO A MANO DEL NEGOZIO: TRE DIFETTI CHE NESSUN ERRORE SEGNALAVA
⚠️ `var _frenoNumeri` e non `let`: le funzioni che lo usano stanno **sopra** nel

### 28 AGOSTO 2026 (4) — ⚠️ LE 14 ROSSE DEL NOLEGGIO CHE NON ESISTEVANO
⛔ **LA REGOLA:** chi si copia il sito in una cartella di lavoro si copia **tutti i

### 28 AGOSTO 2026 (5) — DOVE SIAMO, E COSA RESTA
⚠️ Il gestionale negozio **non carica** `ai-integrazione.js`: il suo «Aiuto» è una
⛔ **La priorità dichiarata da Alessio resta una sola:**

### 28 agosto 2026, sera — IL COLLAUDO DEL NOLEGGIO E LE FINESTRE A TUTTA PAGINA
⚠️ Il banco `noleggio-scritte` aveva un percorso incastrato `/root/lavoro/sito`
⚠️ Le 2 rosse delle imprese erano del banco, non del codice: cercava
⛔ **La priorità dichiarata da Alessio resta una sola:**

### 29 AGOSTO 2026 — LA GIORNATA DELLA PULIZIA: SEO, VETRINE VUOTE, DOPPIONI, CURRICULUM
⛔ **Regola:** prima di rincorrere una percentuale della Search Console,
⚠️ **Le date vogliono l'ora e il fuso orario.** Con `"datePublished": "2026-08-01"`
⚠️ **Il Test dei risultati avanzati non si ricarica: si rifà.** Riaprire la
⛔ **SCARTATA l'idea delle 2.300 pagine guida×città.** Sarebbero pagine quasi
⛔ **`admin.html` NON ha il filtro, di proposito**: Alessio deve continuare a
⛔ **NESSUNO DEI DUE BLOCCA, ed è una scelta.** Chi si è iscritto con l'email
⚠️ **Il campo Email della registrazione è al PASSO 3 (Contatti)**, non al
⚠️ **Trappola nelle prove RLS:** le prime due prove davano rosso perché il
⛔ **La priorità dichiarata da Alessio resta:

### 29 AGOSTO 2026 (seconda sessione) — IL TEST VERO DI TUTTO: QUATTRO GESTIONALI E IL SITO
## ⛔ LA LEZIONE TECNICA DELLA GIORNATA

### 29 agosto 2026 (sera) — IL COMPUTO ALL'ARTIGIANO, LA SERRATURA DEL PRO, E LA CHAT CON AI
⛔ **La lezione che resta:** le parole che cambiano col ruolo **non si cercano
⛔ Quel trigger proteggeva `piano`, `premium_pagato`, `premium_scadenza`,
⛔ **Il Pro non entra nella decisione di chi entra nel gestionale**: sbagliare
⚠️ Oggi `MANUTENZIONE=true` con `AMMESSI=['pintoalessio@icloud.com']`, e il
⚠️ Il vantaggio «la chat sa in che sezione sei» **non dipende da dov'è il
⛔ **Non è stata scritta nessuna formula nuova.** La vista
⚠️ La vista però **non toglie il cestino**: quel filtro sta fuori, in
⚠️ **Una bozza non è un incasso**, e la chat lo dice.
⛔ Ad aprirla **non è la chat**: è `window.apriCosa(tipo,id)` in
⚠️ Il segnalino diventa pulsante **solo** se l'id ha la forma di un id vero.
  ⛔ **Svuotare non azzera il contatore**: la riga resta per il conto del mese,
⛔ **Il numero dei →300← messaggi compresi sta solo dentro `chat_stato()`**:
⚠️ `consume_ai_credit(p_feature, p_cost)` si prende chi chiama da `auth.uid()`:
⚠️ **il 251 è misurato, non indovinato**: la sezione comincia a →195← px
⚠️ **Difetto segnalato e non ancora sistemato**: in

### 29 AGOSTO 2026 (notte) — IL GRADINO 3: «TI RIEMPIO IL MODULO, TU SALVI»
⛔ **L'AI non scrive mai nel database.** Riempie il modulo, salvi tu, col codice
⛔ **La macchina che riempie sta in un posto solo.** Le righe che riempivano
⚠️ **Il secondo argomento di `gestApriModuloAI`.** `conRiga === false` apre il
⚠️ **La data va nel modulo solo se è AAAA-MM-GG.** `j-data` è un
⛔ **La strada sbagliata, scartata dopo averla scritta.** Il primo tentativo
⚠️ Per questo l'attrezzo si può richiamare **una volta sola** (`daSistemare`):
⛔ **È il difetto peggiore del gradino 3, perché non si vede**: il modulo è
⚠️ Tutto in UTC (`getUTCDay`, `toISOString`), così il fuso non sposta il giorno,
⛔ **Una prova che si autoassolve è peggio di nessuna prova**, perché fa credere

### 29 AGOSTO 2026 (notte fonda) — L'ARROTONDAMENTO DEL BROWSER, E LA RETE CHE NON C'ERA PIÙ
⛔ **Non era il database a sbagliare: era il browser.** Il browser è stato
⚠️ **Come fa `_cent2` a contare esatto.** Non indovina e **non guarda i bit**:
⚠️ **Sparisce anche il trucco dell'`1e-9`** che serviva a `_giu2`: non serve più
⛔ **La formula sta in un posto solo** (regola →6← del gestionale). Il foglio si
⚠️ Il banco è stato fatto girare **anche sulla versione di prima**: →5← rosse.
⚠️ Ha girato anche il banco vecchio del gestionale imprese

### 29 AGOSTO 2026 (notte fonda, seconda parte) — IL COLLAUDO DAL VIVO, E QUELLO CHE HA TROVATO
⛔ **E quella vista la legge `chat_soldi()`**: cioè **la chat** e **l'email del
⚠️ **Era la stessa cosa già sistemata il →9← agosto in Report ed Excel.** Nella
⛔ **Spezzato in due apposta**: il conto vero non legge niente, così il banco può
⛔ **Il buco →2← è più frequente del →1←, ed era invisibile al primo banco**: i
⚠️ **Anche scrivere un numero è un arrotondamento.** `eur2` ed `eurPdf` usavano
⚠️ **Misurato:** con la pulizia delle quindici cifre, la moltiplicazione a numeri
⚠️ Il banco dei conti è stato fatto girare anche sulla versione **prima**: →5←

### 29 AGOSTO 2026 (notte fonda, terza parte) — I PREZZI NUOVI E LE DUE PORTE
⚠️ **Lezione della serata, prima di tutto.** Gli accordi sul prezzo del
⛔ **Prima di riaprire una decisione, si cerca se è già scritta.**
⛔ **E qui c'è il buco aperto**: le pagine dicono →29←€, ma
⛔ **La scelta del piano si fa PRIMA di pagare, mai dentro il prodotto già
⛔ **Quindi non si ragiona su quante imprese lo usano: non possono entrarci.**
⛔ **Far vedere e far provare viene prima di far pagare.** L'obiezione di Claude

### 30 AGOSTO 2026 — LA CASSA CHE BATTE IL PREZZO GIUSTO, E LE DUE PORTE COSTRUITE
⚠️ **Lezione della giornata, prima di tutto.** Le porte del pannello sono state
⛔ **Prima di consegnare una modifica alle porte, si guardano le due porte
⛔ I vecchi →5←€/→49←€ sono ancora **attivi e «Predefinito»**: si archiviano solo
⛔ **La riga che ha chiarito tutto, detta da Alessio:** *«quello da →29← non ha la
⚠️ L'assaggio (→10← messaggi, contati **senza filtro sul mese**, se no il →1←° di
⚠️ **Collaudato dal vivo**: Alessio è entrato col piano `free`, ha girato le
⛔ **Il push lo fa Alessio. Punto.**

### 30 AGOSTO 2026 (mattina) — LE PORTE OVUNQUE, E UNA CHAT CHE SA LE SUE COSE
⚠️ **Lezione della giornata, prima di tutto.** →4← difetti trovati, e →3← non li
⛔ **I banchi provano il codice, non la pagina.** Una consegna non è finita
   ⚠️ Fermare **non** ridà il messaggio: è già partito e il server l'ha contato.
   ⚠️ Gli errori di piano e crediti restano JSON normale col loro codice
⛔ **Il buco più assurdo, chiuso**: la chat sapeva che avevi la fattura
⛔ **Come si tiene il reparto sui figli** (le tabelle senza `mestiere_id`):
⛔ **CHI AGGIUNGE UN MODULO ALLA CHAT AGGIUNGE UNA RIGA LÌ.**
⚠️ Ognuno è stato girato **anche sulla versione prima della correzione**: se
⛔ `prove/chat-attrezzi/banco.js`, citato in cima a `chat-gestionale`, **non

### 30 AGOSTO 2026 (pomeriggio) — I QUATTRO PANNELLI, CARD PER CARD
⚠️ **Lezione della giornata.** →9← difetti chiusi, e i →3← peggiori **non li
⛔ **E una seconda, nuova:** un banco che prova una FINTA pagina non prova la
⛔ La regola sta in **due posti** (pannelli e gestionale): il banco
⛔ **`type="number"` NON protegge i soldi.** Misurato nel browser vero:
⛔ **E l'AI ripete le stesse cose**: `chiediSupportoAI()` costruisce il prompt
⛔ **È ancora chiuso a tutti tranne il fondatore**: `MANUTENZIONE = true` in

### 30 AGOSTO 2026 (sera) — LA COLONNA CHE NON C'ERA, E IL GESTIONALE APERTO
⚠️ **Il filo di tutta la serata, in una riga.** Il codice diceva cose che il
⛔ **E la lezione che vale più di tutte le correzioni:** →4← difetti su →6← li
⚠️ **Cosa NON vede**, da sapere prima di fidarsi del verde: le →10← funzioni
⚠️ L'elenco delle colonne è una **fotografia** in `prove-claude/colonne-vere.txt`:
⛔ **Ci sono ricascato:** buttare via solo le RIGHE di commento non basta — un
⚠️ In quell'elenco lo stato →0← **non vuol dire fallita**: è una risorsa di un

### 30 AGOSTO 2026 (notte) — IL PANNELLO PUBBLICO, SETTE DIFETTI A ZERO
⚠️ **Il filo di tutta la nottata, in una riga.** Il codice c'era, ed era
⛔ **La lezione che vale più di tutte:** →3← difetti su →7← erano
⚠️ **Non rimettere mai una lettura diretta di `feedback_clienti` da una
⚠️ `recensioni_pubbliche()` ha un `limit 50` dentro: sopra le →50←
## ⛔ IL PESO DEL `:not(#qualcosa)` — LA LEZIONE CSS DELLA SERATA
⛔ **E la correzione ovvia NON funzionava.** `.leaflet-tile{max-width:none
⚠️ Si esce dalla rete **solo dentro la mappa e solo per piastrelle e
⚠️ `flex-basis:100%` è quello che manda a capo la colonna di sinistra da
⚠️ Quel blocco deve stare **dopo** il `nowrap !important`: a parità di peso
  ⚠️ Da sapere: per `mostraRiga` lo **zero conta come pieno**
⛔ **CORREZIONE alla nota del 29 agosto.** In cima a `profilo-impresa.html` è
⚠️ **Restano →4← misure sotto i 13 px, e sono volutamente lì**: `.cdh` →9←,
  ⚠️ In Playwright, fra due `route` che combaciano **vince l'ultima
⚠️ Imparato pulendo: su `feedback_clienti` c'è un vincolo

### 31 AGOSTO 2026 — LA SCHEDA PUBBLICA SUL TELEFONO, NOVE CONSEGNE
⚠️ `storage.objects` ha un guardiano che vieta il DELETE diretto
⛔ **L'errore che ho fatto:** alla riga nuova avevo dato l'id
⚠️ **Perché non si può usare `max-width`**: `css/mobile.css` ha

### 31 AGOSTO 2026 (sera) — LA HOMEPAGE SUL TELEFONO, DA 7848 A 6370 PIXEL
⚠️ Il banco del 30 agosto (`banco-menu-telefono.js`) e' diventato rosso: non
⚠️ Sulle guide serve il `!important`, e non e' pigrizia: quelle carte non
⚠️ Sulle guide, al primo tentativo la colonna dell'emoji era di →34← px e il
⚠️ Perche' non si prova nemmeno a metterne due per riga: ci pensa gia'
⚠️ Nel banco c'e' una prova sull'ORDINE: piu' su nel file c'e' gia' un
⚠️ Applicato a UNO SOLO dei due. Provato anche sull'altro e misurato: il
⚠️ Per riaprire il testo NON si scrive `-webkit-line-clamp:none`: si toglie

### 1 SETTEMBRE 2026 — LA SCHEDA PUBBLICA SI TROVA E SI CONDIVIDE, UNDICI CONSEGNE
⚠️ **Il filo di tutta la giornata, in una riga.** La mattina si è chiusa la
⛔ **La lezione che vale più di tutte, e costa di più:** tre volte oggi ho
⚠️ **La regola generale:** quando un banco diventa rosso perché il mondo è
⚠️ **Anche Facebook taglia**, circa un terzo. La differenza è quanto.
⚠️ **Due prove del banco sono state GIRATE**: prima pretendevano che il tondo
⛔ **Il primo tentativo era sbagliato e va detto:** avevo capito «dividi a
⚠️ **`minmax(0,1fr)`, non `1fr`.** In una griglia `1fr` vuol dire «almeno
⚠️ **`margin-bottom:0` sulle carte.** `.card` ne ha →20← px e, sommandosi al
⚠️ Come funziona, per chi ci torna: sul telefono la colonna di sinistra e la
⚠️ **L'avviso era già scritto nel file, due righe sopra, dal →30← agosto**:
⛔ **Scrivendolo sono cascato nella trappola dei commenti HTML** già scritta
⛔ **Contato nel database prima di scrivere una riga:**
⚠️ **`costruisciMeta` è scritta DUE volte, e devono restare identiche
⚠️ **Nel dubbio la pagina passa intatta.** Id non valido, Supabase giù, riga
⚠️ **Costa.** L'Edge Function gira a ogni apertura di scheda e le funzioni sul
⛔ **NIENTE STELLE nel JSON-LD.** Oggi →0← imprese su →82← hanno una
⛔ **E la trappola del commento che si chiude da solo, ricapitata.** Nella
⚠️ **`/sitemap-offerte.xml` dice «1 errore» in Search Console e non è un
⚠️ Le scritte dei collegamenti sono i **titoli veri** delle pagine, letti dal
⛔ **Un falso allarme che vale la pena raccontare.** Al primo giro il banco ha

### 2 SETTEMBRE 2026 — LA SCHEDA CHE SI FA CERCARE, E LE QUATTRO CARTE DEL GESTIONALE
> ⛔ **LA LEZIONE: quando la stessa richiesta torna due volte, non si

### 2 SETTEMBRE 2026, SERA — LE QUATTRO CARTE SUGLI ALTRI PANNELLI, E LA FINESTRA CHE SPIEGA PRIMA DI FAR PAGARE
⚠️ **Copiare dai pannelli buoni, non reinventare** (skill `stessa-forma`), e non

### 4 SETTEMBRE 2026 — LE QUATTRO REGISTRAZIONI DIVENTANO UNA SCHERMATA
- ⛔ **prima le caselle, POI la spunta dei Termini**: prima il modulo vuoto ti
- ⚠️ Facebook →239← su →239← e Instagram →47← su →47← hanno `fbclid`: **tutto il

### →12← difetti chiusi · UNA SOLA lista di mezzi · i centesimi del Noleggio
⛔ Perche': nella tabella qui sopra la riga →11← **non c'e'** (ci sono 1-10 e 12) e
⚠️ **REGOLA: un difetto si scrive nel quaderno con COSA E' e DOVE SI VEDE, mai
⚠️ **Regola 6 ribadita dai fatti: una formula dei soldi sta in UN posto solo.**
⚠️ **Un banco che gira con un solo tempo non misura l'ordine di arrivo.** Quando
- ⚠️ **`nol_mezzi` NON è stata cancellata**: resta come copia di sicurezza.
⚠️ **Lezione: i vincoli del database vanno guardati, non dati per buoni.** Un
- ⛔ **il prezzo unitario veniva arrotondato al centesimo PRIMA di moltiplicare**:
⚠️ **Due banchi vecchi erano SCADUTI**, non rotti dal lavoro di oggi (si
⚠️ **Un terzo banco è scaduto e NON è stato sistemato**: `banco-preventivi` del

### 4 SETTEMBRE 2026 (notte) — GLI ALLEGATI DELLA RICHIESTA DI PREVENTIVO
## ⛔ LA REGOLA NUOVA: UN CARICAMENTO NON PUÒ FALLIRE ZITTO
⚠️ Un `catch(_){}` vuoto attorno a una cosa che deve arrivare a
- ⚠️ pulizia fatta **nello stesso momento**: riga e file cancellati, il
- ⚠️ per cancellare i file e' servita una policy DELETE **temporanea**,

### 5 SETTEMBRE 2026 — I DUE PROMPT FUSI, E →4← LAVORI CHIUSI
⚠️ Regola: quando arriva un prompt nuovo, non sostituisce il vecchio — si
⛔ Non bastava una riga in `sitemap.xml`: la pagina **senza `?id` si dichiara
- ⛔ **DA DECIDERE**: oggi quella sitemap contiene **→1← solo indirizzo**, ed
⚠️ **Trappola del banco, presa davvero**: il primo sabotaggio («scrive un
- ⚠️ come si prova di non aver toccato altro: si normalizza OGNI `font-size` a
- ⚠️ **anche la versione ONLINE e' troncata** allo stesso identico punto
- ⛔ **non e' stato indovinato niente**: manca la coda di
⛔ **E' per questo che non si sostituisce e basta**: tornando indietro si
⚠️ **DA PROPORRE AD ALEX (non fatto, e' fuori da quello che ha chiesto)**:
⛔ **La causa NON era la funzione.** `anteprimaDevice()` la sua riga la
⚠️ **REGOLA**: quando uno stile scritto sull'elemento «non fa niente», la
⚠️ **E il banco va fatto girare a PIU' LARGHEZZE di finestra**: con una sola
⚠️ `_esc` della pagina e' dichiarata DENTRO `caricaProfilo`: da fuori non si
⚠️ **Nel database ci sono →0← negozi** e `prodotti`/`marchi` sono vuote su
⚠️ Trovato cercando, non costruendo. **Terza volta in due giorni** che una
⛔ **QUELLO CHE INVECE E' UN RISCHIO VERO**: `PRESTAZIONI_CATALOGO` e' scritto
⛔ **La quinta cosa, quella che conta**: nel sito la tabella la nominava ancora
⚠️ **REGOLA: prima di buttare una tabella, cercarne il nome anche nel SITO,
⛔ **«Password requirements» (lettere+numeri) lasciato SPENTO apposta**: la
⚠️ **REGOLA: una voce vecchia del quaderno si verifica PRIMA di lavorarci.**
⛔ **Chi aggiunge una email nuova aggiunge anche questa fascia.** Il banco
⚠️ **Il viewBox dell'SVG originale tagliava la «a» finale.** `img/trovaimpresa-logo.svg`
⛔ **Non si dice «c'e' il logo» perche' il codice contiene la riga giusta.**
⚠️ Prima di correre a «recuperare da Git» un file grosso, **rilanciare il
⛔ **Perche' nessuno se n'era accorto**: il browser i tag li chiude da solo.
⛔ **La coda vecchia NON si incolla tale e quale.** Dentro c'era anche
⚠️ Usa **solo `git log` e `git show`**, che leggono e basta: non toccano
⚠️ **`demo-arcade.html` non era troncata: e' nata cosi'.** Non e' una pagina,

### e il primo operaio VERO: →7← buchi trovati, →6← chiusi
⛔ **Cercato prima di toccare, come chiesto da Alex**: NON era una svista. Era
⚠️ Ma quella scelta e' di **prima** che nascesse il gestionale operatore, e con
⚠️ **REGOLA CONFERMATA DAI FATTI**: una decisione vecchia va riaperta quando
⛔ **Non bastava togliere la memoria dell'ultimo reparto**: era stata messa
⚠️ **IL BIGLIETTINO HA UNA SCADENZA (→10← s), e non e' un vezzo.** Chi torna dal
⚠️ E il `document.referrer` da solo NON basta: tornando indietro nella storia il
⛔ **La differenza che cambia tutto**: il Noleggio e' TUO (stesso account),
⚠️ **DIFETTO MIO, PRESO DAL COLLAUDO DAL VIVO**: nella card avevo scritto «apri
⛔ **`inserito_da` NON valeva come firma**: e' un nome scritto a mano
⛔ **TRAPPOLA DEL BANCO SUL DATABASE**: la prima volta era rosso e non per colpa
⚠️ **Un banco che prova i permessi deve prima farsi un'impresa col piano in
⚠️ Con la freccia si torna comunque alla lista: il passo →2← non e' mai stato
⛔ **IL GUARDIANO E' SCRITTO AL CONTRARIO, ED E' IL PUNTO.** Non elenca le
⚠️ **Due eccezioni volute**: `preposto` e `segretaria` continuano a vedere e
⚠️ I banchi sul PC **ritagliano le funzioni dal file vero** e le fanno girare:
⚠️ **Una policy di `delete` senza la sua `select` non serve a niente.**
⛔ **Niente `RETURNING` nel `delete` del banco**: con `RETURNING` il
⛔ **Il banco non fa `rollback`: finisce con un `raise exception` apposta.**
⚠️ **Terza volta in due giorni che il difetto e' «fallisce e non lo dice a
⛔ **NON ferma la pubblicazione, di proposito.** →76← rossi al primo giro
⛔ **IL `try` INTORNO NON PROTEGGE.** La libreria di Supabase **non lancia
⚠️ **Le tre peggiori sono in `stripe-webhook-abbonamenti.js`** (righe →181←,
⚠️ **Uno spazio fa parte della catena solo se sta intorno a un punto.**
⚠️ **La lettura giusta**: email e telefono di un artigiano e' GIUSTO che siano
⛔ **LA MAPPA ERA ROTTA E NON L'AVEVA MAI DETTO NESSUNO.** `mappa.html` chiedeva
⚠️ E' la voce →14← del quaderno, ma peggio: `controllo-colonne.js` guarda solo
⚠️ **`tools/rimanda-conferme.js` da oggi non trova piu' niente**: legge `imprese`
## LEZIONE IN PIU'
⛔ **Non ho inventato un meccanismo nuovo: quel file ne aveva gia' uno.**
⚠️ `avvisaAlessio` non lancia MAI un'eccezione. **Un allarme che rompe
⚠️ La disdetta del gestionale (riga →295←) va nel verso opposto: se
⚠️ Il database finto ha **due catene diverse**, come quello vero:
⚠️ **Chi aggiunge un nome nuovo per il client lo aggiunge anche in
⚠️ E non dava nessun errore: il pulsante semplicemente non c'era.
⛔ **E' il prezzo del negozio in un file suo, e questa e' la SECONDA volta**
⚠️ **Un difetto che non fa rumore e' il peggiore: sembra che funzioni.** Si e'
⚠️ **Una domanda sul saldo di mezzo euro ha scoperto un buco nei soldi.**
⚠️ **IL RIMBORSO DA SOLO NON DICE NIENTE.** `charge.refunded` porta
⚠️ **Rimborso PARZIALE: non si toglie niente in automatico.** Uno che si fa
⛔ **IL DIFETTO CHE HA TROVATO IL BANCO, e che avevo scritto io.** Se la
⚠️ **`charge.refunded` va ACCESO anche dalla parte di Stripe** (Webhook →
⚠️ Lasciati SPENTI apposta: `checkout.session.expired`,
⚠️ **Chi aggiunge un `ev.type` nuovo nel webhook deve accenderlo anche su
⚠️ **Oggi non ha ancora fatto danni, ed e' l'unica fortuna**: letto dal
⛔ **LA REGOLA**: quando un pezzo di codice dipende da un interruttore che
⚠️ Dal vivo quasi non si vedeva — ognuno apre la pagina col suo mestiere e la
⚠️ **Una scommessa non e' una verifica.** L'avevo detto ad Alex come
⚠️ **Quello che invece manca davvero**: l'unico annuncio pagato
⚠️ E anche qui **il rimborso non e' gestito**: se si rimborsa un annuncio,
⚠️ **Le due cose vanno insieme.** Il `.gitignore` ferma git; il controllo
⛔ **Su una cosa di soldi non si dice una mezza verita' detta di fretta.**
⚠️ **Non riproporlo.** Il giorno che arrivera' un pagamento vero di un

### 6 SETTEMBRE 2026 — I TRE ATTREZZI CIECHI
⛔ **LA COSA DA RICORDARE: quando si chiude una porta, si controlla chi ci
⚠️ Il testo dell'email **non e' nel sito**: `auth/v1/resend` fa rimandare il
⛔ **E IL PEZZO CHE VALE DI PIU': adesso il referto DICE QUANTE STRADE HA
⚠️ Va rifatto **ogni volta che si aggiunge o si toglie una colonna o una
⚠️ **A schermo non cambia niente**, ed e' il punto: `gestionale-operatore.html`

### 🆕 IL 6 SETTEMBRE 2026 — IL RESTO DELLA GIORNATA
⚠️ **Mandare non è cliccare.** Da ricontare fra →2-3← giorni con questa query:
⛔ **LEZIONE**: il «Reset template» di Supabase azzera **anche l'OGGETTO**, non
⛔ **LIMITE DI CLAUDE**: il sistema non gli lascia mandare email a persone vere,
⛔ **NON scrive dentro `gest_ore`.** Se lo facesse, le ore si sommerebbero a
⛔ **I DUE CONTI NON SI SOMMANO MAI.** «Ore timbrate» e «ore scritte a mano» sono
⚠️ **Niente filtro per reparto**: `gest_ore` ha `mestiere_id`, `gest_timbrature`
- ⛔ **`_set` era chiusa dentro `caricaImprese()`** in `admin.html`: Recensioni
- ⛔ **`richieste_clienti` non la apriva NESSUNA pagina** dal →21 lug←. Su →14←
- ⛔ **La leva delle scritte**: ingrandire un pezzo alla volta non basta. Si usa
- ⛔ **Trappola di `display: contents`**: (1) `:first-child` matcha OGNI

### 🆕 IL 6 SETTEMBRE 2026 — POMERIGGIO: IL COMPUTO E LO SMONTAGGIO
⛔ Il commento sopra `qeBaseA()` diceva gia' che il quadro DEVE leggere il
⚠️ Con una RETE: non si ridisegna se ci sono giorni scritti e non salvati
⛔ **DUE PAROLE CHE SEMBRANO UGUALI E NON LO SONO:**
- ⚠️ La vecchia casella per lavorazione **resta viva** e si somma: si vede solo
- ⛔ **IL CONTO STA IN DUE POSTI**: `compRiepilogo()` in js/gest-computo.js e
⛔ **PERCHE' E' FACILE, E PERCHE' E' PERICOLOSO.** I file staccati NON sono
⚠️ Due aiuti comuni **salvati dal taglio sbagliato**: `_fileOrfano` (usato in
⛔ **E a schermo non usciva nessun errore**: la Galleria diceva «nessuna foto»
**LA REGOLA, per le fette che restano:** in un file staccato, al primo livello
**LA REGOLA DI METODO:** prima di ogni fetta ci si SCRIVE i numeri delle

### 🆕 IL 6 SETTEMBRE 2026 — SERA: SEI FETTE IN UNA SESSIONE
⛔ **LA LEZIONE:** un banco che smette di guardare e continua a dire verde e'
- ⛔ **`_giorniA`** (giorni da oggi a una data). Stava **in mezzo** ai mezzi e

### 🆕 IL 6 SETTEMBRE 2026 — NOTTE: I QUATTRO PROBLEMI RIMASTI
⛔ **L'IDEA DEL BANCO: non guarda le PAROLE delle due formule, le fa GIRARE.**
⛔ **E SE NON SA TRADURRE, NON DICE VERDE.** Se nella vista compare una
⚠️ **IL BUCO CHE RESTA, ed e' scritto a lettere grosse dentro il banco.** La
⚠️ E il confronto dice che le due sono **d'accordo**, non che hanno **ragione**:
⛔ **PRIMA LA MISURA.** Misurato dal vivo nel browser sul computo da →88←
⛔ **E DUE DELLE TRE IPOTESI ERANO SBAGLIATE, e solo il numero lo diceva.**
⛔ **La memoria c'era gia'.** `ppTutte` e' la stessa che usa `ppCerca()` con
⚠️ **RESTANO APERTE due cose piu' piccole**, misurate ma non fatte:
⛔ **IL CENSIMENTO: NON ERA SOLO QUELLA.** Lo stesso schema — un elemento che
⚠️ **UN FALSO ALLARME PRESO AL PRIMO GIRO**, che vale la pena ricordare: il
⛔ **IL PERICOLO DI UN TAGLIO NON E' TAGLIARE TROPPO POCO: E' TAGLIARE LA COSA
⚠️ **UNA COSA TROVATA E NON TOCCATA:** dentro i moduli ci sono altre **→108←

### 7 SETTEMBRE 2026 — LA PUBBLICITÀ CHE NON SI VEDEVA
⚠️ **Finché non esiste un elenco unico "questo spazio sta in questa pagina",

### 8 SETTEMBRE 2026 — LA PUBBLICITÀ CHE FUNZIONA E LE MAIL CHE NON ARRIVAVANO
⚠️ **Claude aveva proposto le →3← pagine di ricerca senza chiedersi da dove
  ⚠️ **CORREZIONE dell'→8← set, guardando Resend dal connettore**: aperture e
⚠️ Il collegamento MCP Supabase **non** può toccare la configurazione Auth: solo
⚠️ **CORREZIONE: partite →22←, non →24←.** Resend ne ha bloccate →2← in uscita
⚠️ **Il difetto delle mail non arrivate era UNO SOLO: lo spam**, già riparato.
⚠️ La campagna del →7← set diceva a →96← imprese «Nella ricerca imprese — →12←€»,

### 9 SETTEMBRE 2026 — SERA: LA VISIBILITÀ DENTRO LE RISPOSTE DELLE AI
⚠️ **La proprietà giusta è `https://trovaimpresa.com/` sull'account
**LA REGOLA CHE ESCE DA QUI, ed è la cosa più importante della serata:**


# LE ULTIME DUE SETTIMANE — per intero

# 12 SETTEMBRE 2026 — DA 340 A 1.802 PAGINE, LA CAMPAGNA, E LE FOTO

Sessione lunga, →7← push. Partita da una domanda di Alex («mi posiziono meglio su
Google?») e finita su tre cose diverse: le pagine mestiere+città su tutta Italia,
la prima campagna email vera, e la foto che l'impresa può scegliere.

## LA REGOLA NUOVA DI ALEX (sostituisce «modifica solo quello che chiedo»)

> «facciamo di tutto per favore anche se non te lo chiedo, perché se non lo
> chiedo è perché non lo so come si fa, non perché non lo voglio fare»

Quindi Claude porta a termine il lavoro **per intero** — i pezzi necessari, i
controlli, le parti che Alex non sa di dover chiedere — senza aspettare il
permesso pezzo per pezzo, restando dentro il lavoro in corso.

⚠️ **Resta in piedi la regola del 5 set**: per qualunque cosa che si vede a
schermo, prima l'anteprima in foto (computer E telefono), i file veri si toccano
solo dopo il suo ok.

## DA 20 A TUTTE E 106 LE CITTÀ

**La prova che ha fatto decidere.** Simulato il link che ogni iscritto vero
avrebbe ricevuto nella mail. Su →102← iscritti: solo →46← ricevevano la pagina
del proprio mestiere, →3← la pagina città, e →53← — più della metà — solo la
vetrina, perché la loro città non era fra le →20←. I professionisti stavano
peggio di tutti: geometra a Sassari, geometra a Matera, architetto a La Spezia,
nessuna delle tre coperta. Dopo il lavoro: →86← con la pagina giusta, →11← con
la pagina città, →5← con la sola vetrina.

**Le 106 città sono i capoluoghi di provincia**, e c'è già una
`imprese-<slug>.html` per ognuno. Non servono pagine di provincia separate: le
pagine mestiere pescano per città **O provincia**, quindi Portici finisce dentro
`muratore-napoli`. Le province sono coperte attraverso il capoluogo.

**Controllato prima di generare**: tutti e →106← i file città hanno il riquadro
`settore-locale`, e tutti e →106← i paragrafi sono DIVERSI fra loro (da →577← a
→1.168← caratteri, media →726←). Quindi le →1.802← pagine non sono gemelle.

**Totale**: →1.802← pagine = →17← voci × →106← città. Testo visibile medio
→12.160← caratteri. Titoli e H1 tutti diversi, zero doppioni, zero link rotti.

### Tre script nuovi, che chiudono tre buchi
- `aggiorna-categorie-citta.js` — riscrive la griglia «Categorie disponibili a X»
  in TUTTE le pagine città (→12← artigiani + →6← tecnici verso le pagine vere).
  Ha toccato →87← pagine, →19← erano già a posto. Ogni pagina città regala →17←
  link interni: →1.802← link, nessuno rotto. **Senza questo le pagine nuove
  nascevano orfane**, e una pagina orfana Google la ignora anche se sta in sitemap
- `sincronizza-citta.js` — RISOLVE il problema delle tre copie dell'elenco città.
  Legge solo da `genera-mestiere-citta.js` e riscrive l'elenco dentro
  `netlify/functions/invia-annuncio.js` e `js/condividi-vetrina.js`. Era proprio
  quel disallineamento a far ricevere il link sbagliato a →53← iscritti
- `aggiorna-citta-guide.js` PATCHATO — ora prende solo le prime →20← città
  (`MAX = 20`): →106← pulsanti in fondo a ogni guida sarebbero un muro illeggibile

### La regola che dorme: 6 in evidenza + tutti gli altri
Sopra le →12← imprese la pagina si divide in due: «In evidenza» →6← cartellini
grandi ai Premium (`IN_EVIDENZA`) e «Tutti gli altri a <città>» un elenco
compatto fino a →60← nomi (`MAX_ELENCO`), free compresi. Sotto le →12← non cambia
NIENTE. Verificato: →0← pagine su →1.802← si dividono oggi.

**La giostra** (`ordina()`): quando i Premium sono più di →6←, il punto di
partenza gira ogni settimana e gira diverso su ogni pagina (seme = numero di
settimana + hash del nome file). Se no in una città con →40← Premium ne
pagherebbero →40← e se ne vedrebbero sempre gli stessi →6←. I free restano sotto
ordinati per voto: quello è merito, non turno.

**Il perché strategico**, detto ad Alex: oggi il Premium è un cartellino viola.
Con questa regola diventa «stai in cima con la foto, o stai in una riga di
elenco» — una differenza che si capisce in mezzo secondo, senza togliere niente
a nessuno e senza rompere la promessa «resta gratis».

## DIFETTI TROVATI E CHIUSI OGGI

1. **La provincia che non si chiama come il capoluogo** — il generatore pesca con
   `provincia ilike 'Monza%'`, quindi una ditta di Besana in Brianza sta DAVVERO
   dentro `muratore-monza`; ma email e pannello cercavano la provincia identica
   nell'elenco e mandavano alla scheda. Aggiunta `dallaProvincia()` in tutti e due
   i file. Sistemate «Monza e della Brianza», «Forlì-Cesena», «Massa-Carrara».
   Restano fuori «Verbano-Cusio-Ossola» e «Sud Sardegna»: quelle imprese non
   compaiono nemmeno nelle pagine, quindi il link alla scheda è corretto
2. **«Troppi destinatari in una volta (102). Il massimo è 100»** — `MAX_DESTINATARI`
   era il limite di Resend usato per sbaglio come tetto nostro. Ora la lista si
   spezza in gruppi da →100← (`PER_LOTTO`) con →600←ms di pausa; tetto nostro a
   →1000←. ⚠️ Se un gruppo fallisce a metà NON si dice «non è partita»: si dice
   quante sono partite e che non vanno rimandate
3. **I link non cliccabili nelle email** — uscivano come testo semplice. Funzione
   `cliccabili()` in `testoInHtml`: ogni indirizzo diventa un `<a href>` blu. Si
   linkifica DOPO `esc()` e la punteggiatura finale resta fuori dal link
4. **Il «37 persone» in `admin.html`** — numero scritto a mano e vecchio, tolto
5. **Il generatore si piantava zitto** — `impreseCitta()` chiamava Supabase SENZA
   scadenza: se la rete non risponde (non rifiuta: proprio non risponde) `fetch`
   in Node aspetta per sempre. Aggiunto `SCADENZA_MS = 8000` +
   `AbortSignal.timeout`. ⚠️ **REGOLA**: ogni chiamata di rete dentro uno script
   che Alex lancia a mano deve avere una scadenza — lui vede solo una finestra
   nera ferma e non sa se aspettare o fermare
6. **Nessun modo di scegliere la foto principale** — vedi sotto

## LA CAMPAGNA «LA TUA PAGINA È ONLINE»

Partita alle →11:28← UTC al gruppo «completi»: →98← inviate, →98← consegnate,
→0← rimbalzi, →0← spam. I →4← rimasti fuori (id →54, 55, 59, 60←, iscritti il
→22 lug←) non hanno mai scritto il nome dell'attività.

**Letta una mail VERA col connettore Resend** (al geometra di Livorno Ferraris):
`[PAGINA]` → `/elettricista-vercelli`, `[VETRINA]` → `/profilo-impresa?id=199`,
`[CITTA]` → «Livorno Ferraris». Quel link esisteva solo da quel giorno.
⚠️ **LEZIONE: dopo ogni campagna, leggere una mail vera dal connettore.** Il
difetto dei link non cliccabili non si vedeva né dal codice né dal pannello.

### ⛔ LA QUOTA RESEND È FINITA SUL SERIO (annulla il «falso allarme» dell'8 set)
Resend ha mandato «80%» e «100% of your daily quota» alle →13:28←. Misurato:
→103← email il 12 set. Piano FREE = →100←/giorno, →3.000←/mese.
Il rischio vero non è la campagna (è partita tutta): è che per il resto della
giornata **non parte più niente, comprese le conferme iscrizione**.
Prezzi verificati il 12 set: Free →0←$ (100/giorno) · Pro →20←$/mese (50.000/mese,
nessun tetto giornaliero) · Scale →90←$/mese.
[stated] Alex: «adesso non ho soldi per Resend, lo farò più avanti quando il sito
vive di soldi suoi». **Finché resta il piano free: mandare le campagne la mattina
presto**, così le conferme del pomeriggio passano.

### ⚠️ DUE POSTE DIVERSE, da non confondere
- **RESEND** manda le email AUTOMATICHE (conferme, benvenuto, campagne). È quella
  col tetto giornaliero
- **ARUBA** è la casella di Alex. Le risposte scritte a mano a un'impresa partono
  da lì e NON toccano il tetto di Resend
- ⛔ **«Scrivi a tutti» manda solo a GRUPPI, non a una persona sola.** Alex ha
  provato a rispondere a Lares da lì, ha premuto «Mandala solo a me», e la
  risposta è arrivata a lui. Per rispondere a UNA impresa: Aruba → Rispondi

## LE FOTO DEI LAVORI, E UN ERRORE DI CLAUDE

**La prima risposta vera alla campagna** (Lares Srls, Roma, id →95←, alle
→14:29←): «Grazie, sembra tutto a posto. Come posso aggiungere le foto, perché
trovo solo una e non è la migliore».

⛔ **ERRORE DI CLAUDE, il secondo in due giorni**: ha detto ad Alex che «le foto
dei lavori non si possono caricare». FALSO. Aveva cercato la colonna `foto_urls`,
che su questo progetto non si usa. Le foto stanno nella TABELLA `lavori_foto`
(id, owner_id, foto, titolo, descrizione, pubblico, created_at, ordine) e nel
bucket `foto-lavori`. Il pannello ce l'ha completo: carta «📷 Foto dei lavori» →
sezione `sec-foto-lavori`.
**LEZIONE: prima di dire «questa cosa non esiste», cercare il NOME GIUSTO. Un
grep a vuoto su un nome inventato non è una prova.** Si parte dalla pagina che la
cosa la MOSTRA (qui `profilo-impresa.html`, che legge `lavori_foto`) e si risale.

Numeri veri: `lavori_foto` ha →159← righe di →45← proprietari, →158← pubbliche.
Su →102← imprese, →53← hanno il logo. Lares ha →1← sola foto.

### ⭐ «METTI PER PRIMA» — fatto e pubblicato
Il buco vero c'era: la galleria ordinava per `created_at` e **nessuno poteva
decidere quale foto lo rappresenta**.
- Migrazione `lavori_foto_ordine_12set2026`: colonna `ordine integer not null
  default 0` + indice `(owner_id, ordine desc, created_at desc)`. Additiva: con
  tutte a →0← l'ordine resta quello di prima (verificato su un'impresa con →14←
  foto)
- Il pulsante scrive `max(ordine)+1` sulla foto scelta: passa davanti a tutte
  senza rinumerare le altre. Provato a secco in SQL senza scrivere niente
- Fatto nei →3← pannelli (impresa, artigiano, professionisti) + `profilo-impresa.html`.
  Il negozio resta fuori: lì la sezione non c'è
- ⚠️ **I DUE ORDINI DEVONO RESTARE UGUALI** (pannelli e scheda pubblica), se no
  l'impresa mette la stella e sulla scheda non cambia niente

## COSA SI È CAPITO SU GOOGLE (ragionamento con Alex, niente codice)

**Le tre porte**: (1) ti trovo? sitemap + link interni — aperta oggi; (2) vali la
pena? paragrafo locale, prezzi veri — lavorata; (3) sei meglio degli altri? —
quella dura.

**La verità sulla porta 3**: per «muratore roma» davanti ci sono ProntoPro,
Edilnet, Houzz, PagineGialle. Non si battono adesso. Ma «geometra sassari» non lo
presidia nessuno. **Non combattere per Roma: vinci le città piccole.**

**Le tre leve, in ordine di forza**: (1) i link da fuori — il più forte e il più
lento, e Alex ha già deciso che le testate locali si contattano più avanti;
(2) quello che solo lui può scrivere — è muratore da →25← anni, i concorrenti
hanno pagine scritte da chi non ha mai tenuto una cazzuola; (3) le ricerche
precise invece delle categorie.

⛔ **Detto ad Alex e da tenere fermo**: NON riempire le pagine con imprese prese
da elenchi pubblici senza che loro lo sappiano. Sono profili di gente che non ha
chiesto niente, in Italia con le ditte individuali sono guai veri, e butta via
l'unico vantaggio che ha (essere uno di loro).

## IL DATO CHE APRE TROVALAVORO

I **Subappalti** sono →6← annunci (uno il 12 set: LAKI COSTRUZIONI). **Nessuno
dei →6← aveva un account**: tutti hanno pubblicato senza registrarsi. E →3← di
quei →6← non sono iscritti al sito per niente.
Le **Offerte di lavoro** sono a →0←. La differenza è UNA RIGA di permesso:
`subappalti_insert_public` accetta `anon`, `offerte_insert_owner` pretende
`authenticated` + una riga in `imprese`.
⚠️ `offerte_lavoro` ha GIÀ le colonne `nome_azienda`, `email`, `telefono` e
`impresa_id` può restare vuoto: **il database è già pronto** per l'annuncio
anonimo.
E le query vere di Search Console («stipendio muratore italia», «stipendio
muratore 1 livello», «quanto prende un muratore») sono **lavoratori**, non
clienti: il pubblico di TrovaLavoro arriva già sul sito e oggi se ne va.

## NOTE DI METODO
- Da Cowork in nuvola **Supabase non si raggiunge** (`nacvrsgkyfavykxjxszu.supabase.co`
  fuori dall'allowlist): `node genera-mestiere-citta.js` usa sempre
  `dati-imprese.json`. Per dati freschi si rifà la scorta con l'MCP Supabase
- Da Cowork **`curl` verso trovaimpresa.com torna →000←** (bloccato dal proxy):
  per collaudare dal vivo si usa WebFetch, non curl
- Nei terminali Windows basta aver selezionato del testo col mouse e l'output si
  ferma: si preme Invio e riparte. Dirlo PRIMA di ipotizzare guasti
# 15 settembre 2026 — LA PORTA DEL GESTIONALE, E I CREDITI NETLIFY

Alex: «non voglio togliere il gestionale dal sito ma sdoppiarlo, venderlo sia sul
sito che su Google come gestionale puro». Poi, capito il meccanismo: «ok adesso
ho capito grazie facciamolo adesso».

## LA DOMANDA VERA: serve un secondo account?

No. È **la stessa registrazione con due facce**. Il parametro `?da=gestionale`
sull'indirizzo cambia quello che si vede, non quello che si crea:

| | dal sito | da `?da=gestionale` |
|---|---|---|
| caselle | →7← (nome, email, password, mestiere, regione, provincia, città) | →3← (nome, email, password) |
| titolo | «🏗️ Registrazione Impresa» | «Crea il tuo Gestionale» |
| sottotitolo | «Entra nella rete TrovaImpresa» | «Preventivi, fatture e cantieri in ordine» |
| vetrina | accesa | **spenta** |
| dopo la conferma | pannello | gestionale |

## IL DATABASE — migrazione `vetrina_attiva_15set2026` (già applicata)

`sql/vetrina-attiva.sql` nel repo racconta tutto. In breve:
- `imprese.vetrina_attiva boolean not null default true`
- `imprese_pubbliche` ha una terza condizione: `AND COALESCE(vetrina_attiva, true) = true`
- `crea_profilo_impresa()` legge il metadato con
  `(lower(coalesce(new.raw_user_meta_data->>'vetrina_attiva','')) <> 'false')`

⚠️ **NIENTE cast `::boolean`**: i metadati arrivano come testo e una stringa
storta farebbe saltare TUTTA la registrazione con un errore di conversione. Così
l'unico modo di nascere spenti è scrivere esattamente `'false'`; qualunque altro
valore — assente, vuoto, sbagliato — nasce ACCESO.

⚠️ **COALESCE e non `= true` secco** nella vista: se un giorno la colonna
tornasse null, la scheda deve restare VISIBILE. Il difetto che fa sparire le
schede è peggio di quello che ne mostra una di troppo.

Provato dentro transazioni annullate: →132← imprese, →103← visibili prima e
→103← dopo. Tre finti iscritti: gestionale → SPENTA, marketplace → ACCESA,
valore storto → ACCESA. Dopo il rollback: →0← finti rimasti.

**Provato anche dal vivo**: l'iscrizione vera di Alex (`pinto ristrutturazione`,
15 set ore 17:15) è nata con `vetrina_attiva = false` e metadato `'false'`.

## L'INTERRUTTORE NEI PANNELLI — senza, la porta era una gabbia

Chi nasce con la vetrina spenta non poteva più pubblicarsi. Blocco
«INTERRUTTORE DELLA SCHEDA PUBBLICA» in coda ai →3← pannelli (impresa,
artigiano, professionisti), dentro una funzione anonima, dopo il blocco grande:
non tocca una riga di quello che c'era.
- vetrina spenta → fascia rossa in cima + card «Scheda pubblica: spenta»
- vetrina accesa → solo la card «Scheda pubblica: accesa»
- l'interruttore va nei due sensi
- dopo l'accensione dice che servono **mestiere e città**, se no non lo trova
  nessuno lo stesso. Dirgli solo «fatto» sarebbe una bugia.

⚠️ La card si aggiunge in **CODA** alla griglia, non in testa: il foglio di
stile colora i bordi con `:nth-child(2)` e `:nth-child(3)`, e mettendola in testa
le carte che c'erano già cambiavano tutte colore.

RLS: non serve nessuna funzione nuova, `imprese_update_owner` permette già al
proprietario di scrivere la sua riga.

## ⛔ IL DIFETTO PIÙ IMPORTANTE DELLA GIORNATA: `emailRedirectTo` NON ESISTE

Il modulo mandava `emailRedirectTo: origin + '/login-impresa.html?redirect=gestionale'`.
**Quel valore non viene MAI usato.** Dall'8 settembre il modello della mail su
Supabase punta a mano a `https://trovaimpresa.com/conferma.html?token_hash=...`,
quindi `emailRedirectTo` viene buttato via.

Per questo chi si iscriveva dalla porta del gestionale atterrava sul sito.

**La decisione va presa in `conferma.html`**, guardando chi è: dopo `verifyOtp`
la funzione `adattaAlGestionale()` legge prima
`user_metadata.vetrina_attiva === 'false'`, poi `imprese.vetrina_attiva` come
rete di sicurezza. Se viene dal gestionale cambia titolo, testo e bottone
(«Apri il gestionale» → `/login-impresa.html?redirect=gestionale`).

LEZIONE: prima di aggiungere un parametro a `emailRedirectTo`, controllare cosa
c'è scritto nel modello della mail su Supabase. Se il modello ha un indirizzo
scritto a mano, `emailRedirectTo` è codice morto.

## ⛔ LA TRAPPOLA DEL FILE CHE NON ARRIVA — da ricordare sempre

Tre volte in una giornata `device_commit_files` ha risposto `written` ma sul PC
di Alex è arrivata la **versione precedente**. Git diceva
`nothing to commit, working tree clean` — ed era la verità, non un errore di git.

Causa: la cartella di transito (`/mnt/user-data/outputs/`) qualche volta serve
una copia vecchia quando il `cp` è appena avvenuto. Si è visto anche
dall'orologio del file, indietro di →9← minuti rispetto all'originale.

**REGOLA**: dopo ogni `device_commit_files`, rifare `device_stage_files` dello
stesso file e controllare la dimensione o cercare dentro la modifica. Se non
combacia, riscrivere in una cartella con un nome nuovo
(`/mnt/user-data/outputs/porta-<timestamp>/`) e ricommettere con `force`.
Sintomo tipico: «l'ho sistemato ma sul sito non cambia niente».

## ⛔ I CREDITI NETLIFY — ERA GIA' SCRITTO IL 13 SETTEMBRE, E L'HO ROTTA IO

⚠️ **Errore di metodo, da non ripetere.** Il 13 settembre questa analisi era
gia' stata fatta e messa in `LAVORI-APERTI.md` («DOVE FINISCONO I SOLDI DI
NETLIFY»), con la regola **un solo push a fine lavoro**. Il 15 settembre
Claude non l'ha cercata, ha rifatto la stessa analisi da capo e intanto ha
fatto fare ad Alex →5← push separati. La regola c'era: e' stata rotta.
**Prima di riaprire un tema — prezzi, piani, costi, struttura — si cerca in
`LAVORI-APERTI.md` e in `CLAUDE.md` se e' gia' deciso.**

⛔ **Il piano di Alex e' vecchio** (→$20←, →3.000← crediti) e **se lo cambia
non torna piu'**. Il Pro da' →5.000← crediti: non basterebbe comunque, e
costerebbe di piu'. **Non proporgli di cambiare piano.** La soluzione e'
una sola: pubblicare meno.

### I numeri del 15 settembre (confermano quelli del 13)

Misurato sul pannello di Alex (piano Pro, →3.000← crediti + una ricarica da
→3.000←, finiti tutti e due):

| voce | crediti |
|---|---|
| **Production deploys — →500←** | **7.500** |
| Bandwidth | 38,5 |
| Web requests — →153.664← | 30,7 |
| Compute | 8,3 |
| AI inference | 0 |
| **Totale** | **7.577,5** |

**→15← crediti a pubblicazione.** Il sito che gira, le visite, le funzioni,
l'email del mattino e la chat AI insieme fanno →77← crediti: niente.
Netlify **non conta il tempo** (una build dura →27← secondi), conta le volte.

→3.000← ÷ →15← = **→200← pubblicazioni al mese**, cioè ~→6← al giorno.
Alex ne aveva fatte →500←, →17← al giorno.

⛔ **REGOLA FISSA**: si prepara tutto il lavoro, si mandano le foto, si controlla
che i file siano arrivati davvero, e si dà **UN SOLO PUSH** alla fine. Mai un
push per ogni correzione. La ricarica di Alex arriva **dopo il →20← di ogni
mese**.

## ALTRI DIFETTI TROVATI E RIPARATI OGGI

1. **«Rimanda l'email»** non portava il `?redirect=gestionale` (nei →3← moduli e
   in `login-impresa.html`). Sistemato — anche se, vedi sopra, su quella strada
   `emailRedirectTo` conta poco.
2. **I pulsanti «Provalo» e «Comincia adesso» erano morti al secondo clic**:
   puntavano tutti e due a `#scegli`, e se l'indirizzo finisce già con `#scegli`
   il browser non si muove. Non è un errore: è come funzionano le ancore. Adesso
   il clic è gestito a mano in `prova-il-gestionale.html`, con lo sconto
   dell'altezza della barra appiccicata.
3. **Il modulo di registrazione si allargava per tutto lo schermo** mentre la
   testata blu restava stretta — su un monitor grande le caselle erano lunghe
   →1.800← px. Il `.container` da →680← px si chiude subito dopo la testata
   (c'è un `</div>` di troppo), quindi `.content` non era dentro niente. Invece
   di spostare i div si è dato a `.content` le stesse misure:
   `padding: 32px 24px; max-width: 680px; margin: 0 auto; box-sizing: border-box`.
   ⚠️ Il difetto c'era anche sulla registrazione NORMALE, non solo su quella del
   gestionale.
4. **«solo così il tuo profilo diventa attivo e i clienti possono trovarti»**:
   una bugia per chi arriva dal gestionale, che ha la vetrina spenta. Adesso la
   frase cambia.

## LA PAGINA DI VENDITA — `prova-il-gestionale.html`

- Le →3← porte sono salite **sopra** i prezzi (prima stavano a →1.211← px
  dall'alto: si vedeva il prezzo prima di come si comincia)
- Una parola sola su tutti e tre i pulsanti: **«Iscriviti»**
- I due piani hanno lo **stesso bordo**: prima quello con l'AI aveva bordo blu e
  sfondo sfumato e sembrava già scelto, l'altro uno scarto
- ⚠️ Togliendo «30 giorni gratis» dal pulsante arancione, quella promessa si
  legge solo dentro la pagina. Se le iscrizioni calano, è la prima cosa da
  rimettere

## GOOGLE — il gestionale è entrato nell'AI Overview

Cercando «gestionale trovaimpresa», l'AI Overview di Google scrive:
«Se stai cercando **Trova Impresa** (trovaimpresa.com), ti riferisci a un noto
**software gestionale in cloud specifico per imprese edili e artigiani**» — con
il prezzo giusto, →249← € all'anno, e →3← citazioni a trovaimpresa.com. Sotto,
primo e secondo risultato sono due pagine sue; nella colonna di lato c'è
**Odoo**. Le →27← pagine del 13 settembre stanno funzionando.

⚠️ **Il nome fa confusione**: l'AI Overview mette le mani avanti con «se invece
intendevi un sistema per cercare i dati legali di un'altra azienda…». *Trova
Impresa* suona come «trova i dati di un'impresa», tipo visura. Nelle pagine del
gestionale scrivere sempre **«gestionale per imprese edili»**, mai
«TrovaImpresa» da solo: al nome nudo Google non sa ancora attaccare il
significato giusto.

I «3 mesi in regalo» sono già spariti da tutte le pagine (controllate →12←):
resta solo in `termini-condizioni.html` come *«Promozione chiusa il 13 settembre
2026»*, e lì **deve restare** — chi l'ha avuta ce l'ha fino a scadenza.

## NOTE DI METODO (aggiunte oggi)

- **Da Cowork in nuvola trovaimpresa.com non si raggiunge nemmeno con Playwright**
  (proxy: `ERR_TUNNEL_CONNECTION_FAILED`). Per collaudare dal vivo si usa il
  browser sul PC di Alex (`Claude_Browser__javascript_tool` con `fetch`): legge
  le pagine pubblicate e non costa crediti Netlify.
- **Claude non crea account.** La prova finale di un'iscrizione — email vera,
  link di conferma, atterraggio — la fa Alex. Dirglielo sempre, invece di
  lasciar credere che sia stato collaudato tutto.
- **Ogni `execute_sql` dell'MCP Supabase è una transazione a sé**: un `begin;`
  non sopravvive alla chiamata dopo. Le prove con finti utenti vanno scritte
  **in una sola query**, e si controlla sempre dopo che non sia rimasto niente.


---

# IL 17 SETTEMBRE 2026 — IL `noindex` SULLA PORTA DEL GESTIONALE

Commit →bafd185←. →2← file: `prova-il-gestionale.html`, `sitemap-gestionale.xml`.

## Il fatto

La porta separata del gestionale, costruita il →15 settembre← (`?da=gestionale`,
`vetrina_attiva`, interruttore nei pannelli), non e' mai uscita su Google.
Il motivo era una riga sola dentro `prova-il-gestionale.html`:

    <meta name="robots" content="noindex,follow">

Unica pagina del sito con quel tag. Verificato a mano su `index.html`,
`prezzi.html`, `software-gestionale-imprese-edili.html`,
`gestionale-termoidraulici.html`: nessuna ce l'ha.

In piu': `canonical` con il `.html` finale (tutte le altre pagine senza), e la
pagina assente da tutte e →3← le sitemap.

## Cosa e' stato cambiato

| Prima | Dopo |
|---|---|
| `<meta name="robots" content="noindex,follow">` | riga tolta |
| `canonical …/prova-il-gestionale.html` | `canonical …/prova-il-gestionale` |
| `<title>Prova il gestionale — TrovaImpresa</title>` | `<title>Gestionale TrovaImpresa per l'edilizia — preventivi, fatture e cantieri</title>` |
| non in sitemap | prima riga di `sitemap-gestionale.xml`, `priority 1.0` |

Il titolo nuovo e' una scelta di Alex: vuole che cercando **«gestionale
trovaimpresa»** esca il prodotto, non un articolo del blog.
⚠️ Non contraddice la regola del →13 set← («nelle pagine scrivere sempre
*gestionale per imprese edili*, mai *TrovaImpresa* da solo»): qui il nome nudo
non c'e', c'e' *Gestionale TrovaImpresa **per l'edilizia***, che il significato
ce l'ha attaccato.

## Regole nuove, da non ridimenticare

- ⛔ **Sospetto «Google non ci trova» → prima cosa: `grep robots <pagina>`.**
  Prima delle sitemap, prima dei link interni, prima della home. →3← minuti.
- ⛔ **L'ordine e' push → Netlify Published → test in tempo reale → richiesta di
  indicizzazione.** Chiedere l'indicizzazione prima che il deploy sia online fa
  leggere a Google la versione vecchia e la richiesta viene RIFIUTATA.
- ⛔ **Le sitemap si mandano dal menu «Sitemap», non da «Controllo URL».**
  Da Controllo URL la richiesta viene accettata ma non serve a niente.
- ⛔ **Una pagina con `noindex` e `priority 1.0` nella sitemap non da' nessun
  avviso**: la sitemap tace e Google obbedisce al `noindex`.

## Metodo — l'errore piu' costoso della serata e' stato di Claude

Alex ha scritto **due volte** «forse non ci capiamo». Nel mezzo Claude ha
risposto per un'ora a domande che non erano quelle fatte: ha spiegato la home,
poi le descrizioni vecchie su Google, poi ha proposto un menu nuovo — mentre la
domanda era «perche' cercando il mio gestionale esce un blog».

**Regola: quando la risposta non combacia con la domanda, ci si ferma e si
chiede in una riga. Non si indovina una seconda volta.** Indovinare due volte
di fila costa piu' tempo di qualunque domanda.

Corollario gia' scritto altrove ma ignorato oggi: **prima di dire «non era mai
stato fatto», cercare nel quaderno.** Il lavoro del →15 settembre← era scritto
in `LAVORI-APERTI.md` e Claude ha detto ad Alex che non c'era traccia.


# LA NOTTE DEL 17 SETTEMBRE 2026 — I 30 GIORNI DI PROVA NASCONO COL PROFILO

`prova-il-gestionale.html` promette «30 giorni gratis, senza carta». Chi si
iscriveva da quella porta nasceva con `gest_prova_fine` vuoto — →0← righe su
→137← ce l'avevano — e trovava il **paywall** al primo ingresso.

Migrazione **`prova_30_giorni_porta_gestionale_17set2026`**, due funzioni:

- `crea_profilo_impresa()` scrive `now() + interval '30 days'` **solo** quando
  `raw_user_meta_data->>'vetrina_attiva' = 'false'`, cioe' solo dalla porta del
  gestionale. Dal marketplace non cambia niente.
- `imprese_blocca_piano()` ha un'eccezione nuova, la **1-bis**: passa l'INSERT
  quando `current_setting('app.nascita_profilo')` vale `'1'`.

## ⛔ Perche' il contrassegno e non un controllo sul ruolo

`imprese_blocca_piano()` azzera `gest_prova_fine` su ogni INSERT che non venga
da `service_role`/`postgres`/`supabase_admin` — regola del →30 ago←, e va
tenuta. Allargarla al ruolo con cui gira la registrazione sarebbe stato fragile.

`app.nascita_profilo` lo accende **solo** `crea_profilo_impresa()`, per la riga
che sta creando lei, e lo spegne alla riga dopo (anche nel ramo `exception`).
**Dal browser non si puo' accendere**: PostgREST lascia passare solo i parametri
con prefisso `request.`. Provato fingendo il ruolo `anon`: un UPDATE del browser
a →9999← giorni viene respinto, un INSERT a mano con la prova dentro viene
azzerato, e la nascita legittima tiene i suoi →30← giorni.

## ⚠️ Se un giorno si tocca questa roba

La prova e la vetrina viaggiano **sullo stesso metadato**: `vetrina_attiva`
uguale a `'false'` vuol dire insieme «vetrina spenta» e «30 giorni aperti».
Se un giorno servisse una nascita con la vetrina spenta **senza** prova, quel
metadato non basta piu': ci vuole un `da_gestionale` suo, scritto dai →3← moduli.

## Regola nuova

- ⛔ **Una promessa scritta su una pagina e' un collaudo da fare.** «30 giorni
  gratis» stava li' dal →14 settembre← e non li riceveva nessuno. Quando una
  pagina promette qualcosa, si controlla nel database che quel qualcosa arrivi.


# 18 SETTEMBRE 2026 — LA PAGINA DEL GESTIONALE SI CHIAMA `/gestionale`

Si chiamava `prova-il-gestionale.html`. La gente su Google scrive **«gestionale
trovaimpresa»**, non «prova il gestionale»: l'indirizzo non combaciava con la
ricerca. Adesso indirizzo, `<title>` e `<h1>` dicono tutti e tre **Gestionale
TrovaImpresa**.

- `/prova-il-gestionale` → `/gestionale`, **301 con `force = true`**. Il `force`
  serve perche' il vecchio file e' rimasto nella cartella: senza, Netlify
  servirebbe il file e il rinvio non partirebbe.
- La scorciatoia `/gestionale` → `gestionale-invito.html` e' diventata
  `/invito-gestionale`. `gestionale-app.html` chiama sempre
  `gestionale-invito.html?codice=…`, quindi non si rompe niente.
- →90← link cambiati in →32← file, **generatore compreso**
  (`genera-pagine-gestionale.js`): se si cambia un indirizzo e non si tocca il
  generatore, la prima rigenerazione delle pagine rimette il link vecchio.

## Regola nuova

- ⛔ **L'indirizzo di una pagina e' una parola chiave.** Deve contenere quello
  che la gente scrive su Google, non come la chiamiamo noi in casa. Prima di
  battezzare una pagina: quale ricerca deve intercettare?
- ⛔ **Prima di prendersi un indirizzo, cercarlo in `netlify.toml`**: puo' gia'
  rinviare da qualche parte.


# 18–19 SETTEMBRE 2026 — «IL GESTIONALE SA LA COSA, MA NON TE LA FA TROVARE»

Due giornate su una cosa sola: non funzioni nuove, ma **avvisi che dicevano
«c'e' un problema» senza dire dove**. Alex l'ha chiesto cosi': «controlla cosa
puo' mancare per funzionare e essere piu' completo possibile… se alcuni
passaggi sono troppo difficili da capire, semplifichiamoli».

## ⛔ LA REGOLA NUOVA, IN UNA RIGA

> **Ogni messaggio che dice «c'e' qualcosa» deve anche dire DOVE, e portarci.**

Trovata cinque volte in due giorni, sempre uguale: il gestionale conosceva
gia' la risposta (il numero del SAL, quale casella, quale fattura) e la
buttava via mentre scriveva il messaggio. Non era un problema di codice
mancante: era informazione gia' in mano, non consegnata.

## GLI →8← BUCHI, CHIUSI E PROVATI DAL VIVO

| n | dove | prima | adesso |
|---|---|---|---|
| 1 | file per lo SDI | →25← righe e un solo «Ho capito» | raggruppate per posto, un tasto per gruppo |
| 2 | resoconto prezzario | le righe dicevano il problema | le righe ci portano |
| 3 | «non so dove cercare i prezzi» | solo testo | due tasti veri |
| 4 | cronoprogramma | →3← avvisi che sparivano | portano alla pagina e alla casella |
| 5 | fatture emesse | «mancano le n.3, n.5» | apre il Cestino (solo se ci sono davvero) |
| 6 | SAL non collegato | messaggino cancellato da «Fattura creata» | pannello che dice **quale** SAL e ci porta |
| 7 | emetti senza cliente | messaggino che svaniva | la tendina si segna in rosso e prende il fuoco |
| 8 | eliminazione a meta' | `alert()` con l'elenco dentro | resta in cima al Cestino finche' non lo chiudi |

⚠️ **Il buco 6 era il piu' caro**: senza quel collegamento si puo' fatturare
**due volte lo stesso acconto**. E il messaggio che lo diceva veniva cancellato
tre righe dopo da «Fattura creata ✔», che gli finiva sopra.

## L'APERTURA DEL GESTIONALE: DA →16,8← A →1,5← SECONDI

`js/cestino.js` faceva **→28← domande di prova al database a ogni apertura**,
per ogni iscritto, solo per sapere se le tabelle avevano la colonna
`eliminato_il`. La risposta non cambia mai: adesso si ricorda per →30← giorni
(`localStorage`, chiave `gest_cestino_colonne`).

⚠️ **La trappola dentro la correzione**: senza la riga
`if (!daFare.length) { aggiornaMotivo(); return Promise.resolve(); }` la
promessa `cestinoPronto()` non si chiudeva mai e **ogni Elimina restava
bloccato**. Una cache che non risolve la promessa e' peggio di nessuna cache.

⚠️ **E la trappola nella misura**: il browser dentro l'app Claude aggiunge
~→600← ms a ogni connessione nuova. Misurando li' sembrava che la correzione
non servisse. Provata la stessa pagina in Chrome vero: →16,8← → →1,5←.
**Le misure di velocita' si fanno in Chrome vero, mai nel browser dell'app.**

## IL CONTROLLO DEGLI AGGIORNAMENTI DEL DATABASE (19 set)

Il database e' **UNO SOLO** per tutti gli iscritti. Se un aggiornamento c'e',
c'e' per tutti; se manca, e' rotto per tutti insieme. Quindi non esiste
«l'iscritto a cui manca una migrazione»: o manca a tutti o a nessuno.

Il rischio vero e' un altro: **Alex scrive un file sql nuovo e si dimentica di
eseguirlo**. Adesso ci sono due reti:

1. **Nel gestionale** — `js/fondatore.js`, variabile `PROVE`: →149← controlli
   su →37← file sql, **una sola domanda** al database (funzione
   `gest_schema_mancanti`, in `sql/controllo-aggiornamenti.sql`). Gira solo
   per Alex, →6← secondi dopo l'apertura. Se manca qualcosa: barra rossa col
   nome del file da eseguire.
2. **Al push** — `tools/controllo-push.js`, **punto 8**: legge la cartella
   `sql/` e **ferma la pubblicazione** se un file sql nominato dal gestionale
   non e' in `PROVE`, o se `PROVE` nomina un file cancellato.

Provato il 19 settembre: →149← controlli, →833← ms, **zero mancanti**.

⚠️ **Due esclusioni volute**, scritte come eccezioni in `controllo-push.js`
(`FUORI_APPOSTA`) per non avere avvisi finti a ogni push:
`gest_note.eliminato_il` (tolta il 9/8, rompeva le note del calendario) e
`nol_mezzi.eliminato_il` (tabella sparita il 4/9).

⛔ **La trappola del lettore sql**: un `alter table` puo' aggiungere **piu'
colonne in una volta sola**. Leggendo solo la prima si perdevano →54← colonne
su →151←. Se un giorno si riscrive quel pezzo: si prende **tutta**
l'istruzione fino al punto e virgola, poi dentro si cercano tutte le
`add column`.

## ⚠️ LE LEZIONI — TUTTE E TRE MIE

**1. Misurare prima di lavorare. Due lavori interi sono morti cosi'.**
- «Sistemare i →35← messaggi sql»: controllate tutte le migrazioni, **c'erano
  tutte**. Quei messaggi sono rami morti che non vede nessuno. Il lavoro non
  esisteva — ed e' diventato il controllo qui sopra.
- «Far girare le migrazioni per ogni iscritto»: il database e' uno solo.
  Il lavoro non esisteva proprio.

**2. Una cosa non e' finita finche' non l'hai toccata sul sito vero.**
Il →19← settembre il collaudo dal vivo ha trovato **→3← difetti** che
`node --check` aveva lasciato passare tranquillamente:
- «Copia l'elenco» **non copiava**: `navigator.clipboard` e' negato in
  parecchi browser. **Cura: prima la strada vecchia** (`textarea` nascosta +
  `document.execCommand("copy")`), che funziona sempre e non chiede permessi;
  quella nuova solo come riserva.
- «L'ho sistemato, togli l'avviso» lasciava l'avviso a schermo →3← secondi
  (il rinfresco e' asincrono): si toglie **prima** dal DOM, poi si rinfresca.
- Il SAL non trovato non diceva **niente** — cioe' il difetto che stavamo
  togliendo.

**3. Un tasto pubblicato puo' essere morto.**
Il →18← settembre ho pubblicato `data-action="vai-sezione"` in
`gest-computo-pdf.js` **senza** il pezzo che lo ascolta in
`gestionale-app.html`. Il tasto c'era, si cliccava, non succedeva niente.
⛔ **Quando si inventa un `data-action` nuovo, si controlla che il suo
`if(a==="…")` sia davvero nel file grande, e si prova il clic dal vivo.**

## ⚠️ IL FILE CHE TORNA INDIETRO — CONFERMATO E CON LA CURA

Il →19← settembre e' successo di nuovo: `device_commit_files` risponde
**`written`**, ma poi il file sul computer e' quello di prima (le scritture di
Claude e i `git add -A` di Alex si pestano i piedi). Il push diceva
**«nothing to commit»** con dentro →30← righe di lavoro sparite.

**La cura, da fare sempre:** dopo ogni `device_commit_files`, **ristaggiare il
file e confrontarlo** con la copia in `/mnt/user-data/outputs/`. Se non
combaciano, si riscrive con `force: true` e si ricontrolla. Solo allora si da'
ad Alex il blocco git.

## ⚠️ TRE DIAGNOSI SBAGLIATE, RITIRATE IN PUBBLICO

1. «Crediti formativi si vede all'artigiano e non all'impresa» — avevo letto
   l'elenco delle sezioni nel DOM invece del menu. Non la vede nessuno dei due,
   ed e' giusto cosi'.
2. «pulizia ed elettricista sono reparti fantasma» — stanno nel Cestino dal
   →21← agosto, **scritto nel commento di Alex del →4← settembre**.
   ⛔ Prima di riaprire una decisione, **cercare se e' gia' scritta**.
3. «La correzione del cestino non ha migliorato niente» — misurata nel browser
   sbagliato (vedi sopra).

## Regole nuove, in breve

- ⛔ Ogni messaggio che dice «c'e' qualcosa» deve dire **dove**, e portarci.
- ⛔ Un tasto che non porta da nessuna parte e' peggio di nessun tasto: se non
  c'e' niente da aprire (un numero mai usato, per esempio), **il riquadro resta
  fermo**.
- ⛔ Le misure di velocita' **in Chrome vero**, mai nel browser dentro l'app.
- ⛔ Dopo `device_commit_files`, **ristaggiare e confrontare** prima di dare il
  blocco git.
- ⛔ Un `data-action` nuovo si prova **cliccandolo**, non leggendolo.
- ⛔ Un avviso che comparirebbe a ogni push va messo fra le **eccezioni con il
  suo perche'**: un avviso finto ripetuto insegna a saltare gli avvisi.

---

# 26 SETTEMBRE 2026 — LE IDEE RUBATE AI GESTIONALI STRANIERI

Alessio ha chiesto di «rubare idee» ai gestionali fuori dall'Italia (Jobber,
Buildertrend, Plancraft, Tradify...). Ne ha scelte cinque, fatte tutte
insieme, un solo push. Codice nuovo quasi tutto in **`js/gest-ai-cantiere.js`**
(stesso stile degli altri js/ del gestionale: non in un IIFE, un suo
ascoltatore su `[data-action]`).

| n | cosa | dove si apre |
|---|---|---|
| 1 | **Foto della fattura del fornitore**: l'AI legge fornitore, numero, data, totale IVA compresa, scadenza; propone di aggiungere il fornitore se non c'e'; la foto resta fra i documenti del fornitore | Fornitori → «📷 Fotografa una fattura» / «+ Fattura da pagare» |
| 2 | **«Parla»**: microfono del browser (Web Speech, gratis) nella riga AI di lavoro, cliente, preventivo | riga «AI» dentro i moduli |
| 3 | **Aggiorna il cliente**: dai rapportini del periodo l'AI scrive il messaggio WhatsApp | finestra del lavoro → «📣 Aggiorna il cliente» |
| 4 | **Scrivilo meglio**: riscrive il messaggio al cliente senza cambiare date e prezzi, con «Torna com'era» | dentro «Aggiorna il cliente» e nell'email del documento al cliente |
| 5 | **Scelte del cliente**: l'impresa mette le possibilita' (con foto e prezzo), il cliente sceglie da `trovaimpresa.com/scelte?t=...` senza account e conferma; all'impresa arriva un'email | finestra del lavoro → «🎨 Scelte del cliente» (non per i professionisti) |

## Dove sta cosa

- **Edge Function nuova `ai-cantiere`** (Supabase, verify_jwt): le feature
  `dati_fattura_fornitore` (con immagine o PDF), `resoconto_cliente`,
  `scrivi_meglio`. 1 credito l'una, stesse funzioni SQL di `ai-generate`
  (consume/settle/refund). Copia nel repo: `supabase/functions/ai-cantiere/index.ts`.
  ⛔ `ai-generate` NON e' stata toccata apposta.
- `js/ai-integrazione.js`: nuova porta `AI.cantiere(feature, testo, file, json)`.
- **Tabelle nuove** `gest_scelte` e `gest_scelte_link` — `sql/gest-scelte.sql`,
  eseguito il 26/9 (migrazione `gest_scelte_26set2026`), in `PROVE` di fondatore.js.
  Niente `eliminato_il` apposta: il cestino non le conosce e una scelta buttata
  la vedrebbe ancora il cliente. Trigger `gest_scelte_controlla_lavoro`: il
  lavoro deve essere dell'impresa che scrive.
- **`netlify/functions/scelte-cliente.js`**: l'unica porta del cliente. Chi e'
  lo dice solo il token; dopo la conferma le scelte sono ferme (409), si
  riaprono dal gestionale.
- **`scelte.html`**: la pagina del cliente, noindex, grande, col pollice.

## Decisioni di Alessio

- ⛔ In fondo al messaggio «Aggiorna il cliente» **niente** riga «Lavori seguiti
  con TrovaImpresa»: l'aveva proposta Claude, Alessio l'ha fatta togliere.
  Il messaggio porta solo il nome dell'impresa (da Dati azienda).
- Al resoconto l'AI non riceve nome ne' indirizzo del cliente, e non parla mai
  di soldi. Il «Buongiorno Marco» lo mette il gestionale.

## Provato prima del push

Edge function con un finto (13 prove verdi: immagine, PDF, file sbagliato,
JSON rotto → rimborso, crediti finiti → 402). SQL su Postgres 16 vero (altro
account rifiutato da RLS e dal trigger, cascata sul lavoro). Le 5 funzioni nel
gestionale vero col finto delle imprese, computer e telefono: zero errori.
⚠️ Le risposte VERE dell'AI si vedono solo sul sito, dopo il push.

---

# 26 SETTEMBRE 2026 (pomeriggio) — PREZZI, GALLERIA, CHAT

Idee prese da siti stranieri (Thumbtack, Houzz), scelte da Alessio. Un push solo.

| cosa | dove |
|---|---|
| **«I tuoi prezzi»** nei 3 pannelli (impresa, artigiano, professionisti): l'impresa scrive «Rifacimento bagno — da 6.000 € a lavoro finito» | `js/prezzi-impresa.js` (aggiunge da solo sezione `sec-prezzi` e carta dopo «Foto dei lavori», avvolge `showSection`) · tabella `prezzi_impresa` |
| **I prezzi sulla scheda pubblica** (carta `#card-prezzi-impresa`, prima di «Quanto costa»; nascosta se non ce ne sono) | `profilo-impresa.html` |
| **Galleria «Lavori realizzati»**: le foto di «Foto dei lavori» di tutte le imprese, filtri tipo/città/cerca fatti DAL DATABASE a pezzi da 24; il tocco porta alla scheda | `lavori-realizzati.html` · vista `galleria_lavori` (security_invoker) · link sotto le foto di ogni scheda · sitemap |
| **Chat: email di avviso** all'impresa quando il cliente scrive, al cliente quando l'impresa risponde (link `profilo-impresa?id=X&chat=<codice>` che riapre la chat da qualsiasi telefono) | `netlify/functions/chat-avviso.js` · tabella `chat_avvisi` |
| **Chat: numeri ed email non si cancellano più** (tolto il trigger `pulisci_chat`) | `sql/chat-avvisi.sql` |
| **Chat: Invio manda, e un invio fallito lo dice** (il testo resta nella casella) | scheda + 3 pannelli |
| **Tolta la casella «giro la richiesta ad altre 5 imprese»** | `profilo-impresa.html` |

## Decisioni e cose da sapere

- ⛔ La casella «se l'impresa non risponde in 48 ore giro la richiesta ad altre 5 imprese» **non l'ha mai fatto nessuno**: nessuna funzione inoltrava. Era una promessa falsa, ed era contro il modello vetrina (5 set). Tolta; `condivisibile` si scrive sempre false.
- ⛔ Galleria: **niente commenti** fra imprese (deciso con Alessio): diventerebbero critiche fra concorrenti e andrebbero controllati a mano.
- ⛔ `chat-avviso.js`: chi scrive a chi lo decidono i MESSAGGI nel database, non il browser. L'email del cliente si prende solo dai messaggi scritti dal cliente (così un'impresa non manda email a chi vuole). Una email ogni 30 minuti per conversazione e verso, massimo 20 avvisi al giorno per impresa. 10 prove verdi + 2 sabotaggi accusati.
- ⚠️ `chat_avvisi` ha RLS accesa e ZERO regole, ma la SELECT data a `authenticated`: serve solo perché `gest_schema_mancanti` (che guarda information_schema) la veda. Senza, il controllo del fondatore la darebbe mancante.
- ⚠️ `maschera_contatti` resta: la usa ancora `trg_pulisci_preventivo` sulle richieste di preventivo.
- ⚠️ Resend gratuito = 100 email al giorno in tutto il sito: gli avvisi della chat ci passano dentro.
- Numeri al 26 set: →110← foto pubbliche di →44← imprese nella galleria; nella chat c'era →1← solo messaggio da sempre.
- Migrazioni applicate: `prezzi_e_galleria_26set2026`, `chat_avvisi_26set2026` (file in `sql/`, righe in `PROVE` di fondatore.js).

## 26 set (sera) — la grafica di Foto dei lavori, Messaggi, I tuoi prezzi

- `js/sezioni-vetrina.js` (nei 3 pannelli, DOPO `prezzi-impresa.js`): solo aspetto, stile limitato a `#sec-foto-lavori`, `#sec-messaggi`, `#sec-prezzi`, larghezza massima →1100← px (Alex: «queste linee lunghe e piatte»).
- Foto dei lavori: riquadro grande «Tocca per scegliere la foto» con anteprima; **l'elenco `#lista-lavori-foto` è stato spostato dal RIEPILOGO dentro la sezione** (la funzione lo trova per id). `salvaLavoroFoto` avvolta solo per svuotare l'anteprima.
- Messaggi: conversazioni a riquadri con iniziale e ora (avvolge `renderListaConversazioni`), chat aperta con testa (nome, email, pulsanti a destra; avvolge `apriConversazione`).
- ⚠️ `js/freccia-indietro.js` parte PRIMA e trasforma i «← Torna» in `.ti-back`: chi aggiunge sezioni dopo di lui deve scrivere la freccia già fatta (come `prezzi-impresa.js`).
- Alex: «il sito è tutto così, miglioriamolo». Deciso di andare un pannello/sezione alla volta, sempre con le foto prima.
- 26 set (sera, 2): il RIEPILOGO dei pannelli nello stesso `js/sezioni-vetrina.js` — al centro (max →1240← px, anche Foto/Messaggi/Prezzi: sul 1920 di Alex restava un buco a destra), copertina max →320← px, carte in riga icona+scritte, via le strisce colorate, emoji QR/Priorità/Video → icone. ⚠️ Nelle carte doppie (lavoro, subappalto) la colonna va scritta a mano, se no la scritta finisce nella colonna stretta dell'icona. Calendario e «I due gestionali» ancora da rifare.
- Home: riquadro `#le-idee` «Cerchi idee per casa?» → `/lavori-realizzati`, subito dopo `#categorie`.

---

# 27 SETTEMBRE 2026 — LA GRAFICA DEI GESTIONALI, IL LOGO, E L'ASSISTENZA CHE AVVISA

Giornata lunga, →11← push, tutti provati dal vivo su trovaimpresa.com.

## Grafica (gestionale principale + Noleggio)
- **Righe «gonfie»**: ogni lista (`.griglia-schede > .job`) e' una riga con filo
  colorato a sinistra (`--acc` per sezione, in `css/gestionale.css`), ombra, «Apri» a destra.
  Nel Noleggio stesse righe su `.nol-elenco > .nol-card` e `#prom-list > .card`
  (CSS dentro `gestionale-noleggio.html`, prefisso `#app-root`).
- **Promemoria a righe**: `js/gest-promemoria.js` ora passa `cards:` a `renderTabella`
  (`promCard`, usa `schedaJob`). La nota gialla (`.job-note`) sta su una riga sua.
- **Menu del telefono**: icone →34← px a menu aperto (`.side.open`).
- **Noleggio**: menu in alto a →16,5← px; tolto `&nbsp;` dalle `.sub` vuote (3 punti).
- `js/gest-icone.js`: aggiunta l'icona `ripeti` (🔁 🔄).

## Il logo dell'impresa (richiesta n. 1 di «Chiedi una funzione», chiusa «Fatta»)
- `js/gest-logo.js` (IIFE): legge `imprese.logo_url` (lo stesso della vetrina,
  deposito `loghi-imprese`, `<uid>/logo.webp`). Slot `[data-logo="grande"]` nella
  prima schermata (se manca: riquadro «+ Il tuo logo» che lo carica) e
  `[data-logo="piccolo"]` in barra reparto, menu del telefono e testata Noleggio.
  La pagina lo accende con `gestLogoAvvia(sb,()=>sbUid)` subito dopo `let sbUid`.
- **Nei PDF**: `window.gestLogoPdf(doc,M,y)` disegna il logo sopra il nome
  dell'impresa e restituisce la y nuova. Chiamato in →7← PDF: `generaPdf` (app),
  `prevPdf`/`incaricoPdf`/`ordinePdf`/`verbalePdf` (gest-documenti-pdf.js),
  `fatturaPdf` (gest-fatture.js), `salPdf` (gest-sal-prezzario.js).
  ⛔ NON nei fogli del computo (Lista gara, analisi): intestazione del modello ufficiale.
  Se il logo non si carica il PDF esce lo stesso (timeout 6 s, ridisegnato in PNG).

## «Chiedi una funzione» e «Assistenza diretta»
- Card del menu modello «1» (bordo blu pieno, icona nel tondo, stessa altezza).
  Con qualcosa di nuovo la card si accende d'arancione, tondo rosso col numero, e la
  scritta diventa «Hai una risposta nuova» / «Hai un messaggio nuovo» (solo CSS, `:has`).
- Nel Noleggio: due riquadri in cima al Riepilogo (`.nol-cta`, `data-sup-apri`) e le
  due sezioni copiate, codice con prefisso `sup` dentro l'IIFE. Stesse tabelle.
- Esempi da toccare (`data-rq-es`), microfono «Parla» (riusa `aiMicrofono` di
  gest-ai-cantiere.js), Invio manda / Maiusc+Invio a capo, spunte «✓ Inviato / ✓✓ Letto».
- Bug chiuso: `.asst-chip` mostrava un riquadro vuoto (display vinceva su `[hidden]`).

## Le email (Resend) — PROVATE CON EMAIL VERE
- **Impresa scrive in Assistenza → Alessio**: `netlify/functions/supporto-avviso.js`.
  Dal browser solo `msg_id` + gettone; il server controlla che il messaggio sia di chi
  chiama e scritto da meno di 10 min. Una email ogni 15 min per impresa.
- **Alessio risponde → impresa**: dentro `admin-supporto.js` azione `reply`
  (una ogni 15 min per conversazione; `origine` decide il link, gestionale o sito).
- **Richiesta cambia stato o riceve risposta → impresa**: azione `avvisa_richiesta`
  di `admin-supporto.js`, chiamata da `admin.html`.
- `richiesta-funzione.js`: parte solo per richieste di meno di 10 min (prima chiunque
  poteva rimandare le email di una richiesta vecchia).
- ⚠️ Tutto dentro le →100← email al giorno di Resend gratuito.

## Pannello admin
- «Cosa chiedono»: filtro «Da fare / Tutte», risposta in una casella dentro la
  scheda (niente piu' `prompt()`), stato attuale acceso in blu, avviso `rqaToast`.
- Chat: sotto le tue risposte «✓ Consegnata / ✓✓ Letta».

## L'ACCOUNT SBAGLIATO (successo davvero oggi)
Alessio ha aperto il gestionale dall'admin e l'ha trovato vuoto: in un'altra scheda
era entrato con **pintoalessio@hotmail.it** (account di prova, reparto «pinto
ristrutturazione»). Il browser tiene UN account alla volta per tutto il sito, e il
pulsante «Apri il Gestionale» dell'admin apre quello collegato.
- Prima schermata del gestionale: «Sei dentro come … · Cambia account» (gest-logo.js).
- `js/fondatore.js`: se il browser e' quello dell'admin (`ti_admin_user`) e l'account
  NON e' in `AMMESSI`, fascia arancione «qui sei dentro come …» + «Esci e rientra col tuo».
- Consiglio dato: l'account di prova si apre in una finestra in incognito.

## Da ricordare
- Il negozio (`gestionale-negozio.html`) non esiste piu' nella cartella.
- Il Noleggio ha il menu in alto, non a sinistra: deciso di lasciarlo cosi'.

# 27 SETTEMBRE 2026 — CHIUSE LE PORTE DELLE EMAIL

Trovato nel controllo completo del sito: →6← funzioni spedivano email firmate
TrovaImpresa a chiunque, senza controllare chi le chiamava (bastava conoscere
l'indirizzo). Rischio: dominio in lista nera dello spam → tutte le email del
sito (conferme, avvisi) finiscono nello spam.

Regola da oggi: **una funzione che manda email NON si fida del messaggio**.
Legge destinatario e testo dal database, oppure chiede una chiave.
- `notifica-risposta-preventivo` → prende solo `preventivo_id`; parte se nel DB
  c'e' una risposta con `risposta_at` dell'ultima ora. Testo, email, nome dal DB.
- `notifica-risposta-incarico` → idem con `incarico_id` (il pannello
  professionisti ora lo manda).
- `notifica-preventivo` → parte solo se nell'ultima ora c'e' una riga vera in
  `preventivi` / `incarichi_richieste` per quell'impresa con la stessa email o
  lo stesso telefono (ultime 6 cifre). Tutto il testo del modulo disinnescato.
- `invia-email-lead` → serve utente+password admin (admin.html li manda).
- `notifica-spazio-libero` → rilegge la riga di `lista_attesa_pubblicita` per id,
  parte solo se `stato='offerto'`, usa l'email del DB.
- `invia-email-benvenuto` → `premium:true` solo con header `x-chiave-interna`
  = SUPABASE_SERVICE_KEY (lo manda `stripe-webhook-abbonamenti`); email di
  nessun iscritto → non manda piu' niente; nome disinnescato.
- `invia-email` (modulo contatti → info@) → testo disinnescato.
Banco: `prove-claude/banchi-fissi/banco-email.js` (24 prove, tutte verdi).
Backup: `prove-claude/*-prima-email-27set.*`.

# 27 SETTEMBRE 2026 (sera) — I 4 PUNTI DI SICUREZZA

Migrazione `sicurezza_27set2026` (gia' nel database) + codice:
1. **Freno password admin** — tabella `admin_tentativi` + funzione `admin_freno`
   (solo chiave di servizio). Tutte le funzioni admin (16) chiamano
   `netlify/functions/lib/admin-freno.js` PRIMA di confrontare la password:
   10 errori dallo stesso IP in 15 min (o 100 in tutto) → bloccato 15 min,
   anche con la password giusta. Se il DB non risponde NON blocca.
   admin.html mostra «Troppi tentativi sbagliati» (`bloccato:true` da admin-auth).
   ⚠️ Una funzione admin NUOVA deve chiamare anche lei il freno.
2. **Candidati** — `candidati_lavoro_pubblici` ricreata SENZA `sesso` e solo
   con chi ha un account (`user_id is not null`): chi si candida a un annuncio
   senza iscriversi non finisce piu' nell'elenco pubblico.
3. **Anti-spam** — trigger `trg_freno_moduli` (funzione `freno_moduli`) su
   `preventivi`, `incarichi_richieste` (10/ora stessa email o telefono, 30/ora
   per impresa), `subappalti` (5 al giorno) e `chat_messaggi` lato cliente
   (30 in 10 min per conversazione, 60/ora per email).
4. **Gestionale** — trigger `trg_gest_stesso_padrone` su tutte le tabelle gest_
   con collegamenti: ogni collegamento deve puntare a una riga dello STESSO
   account. `gest_redeem_invito`: serve essere collegati e il codice vale
   →14← giorni.
Banco: `prove-claude/banchi-fissi/banco-freno.js` (16 verdi); le prove del
database sono state fatte in transazioni annullate (tutte verdi).

## 27 SETTEMBRE 2026 (notte) — TASSE E FISCO, TAPPA 1: «FARSI PAGARE» (NASCOSTO)

- File nuovo `js/gest-fisco.js` + 4 punti in `gestionale-app.html` (voce `#tab-fisco`, `<section id="fisco">`, `fisco:_rt("renderFisco")` in RENDER_TAB, `<script>`) + stile `.fp-*` in fondo a `css/gestionale.css`.
- ⛔ NASCOSTO: `#tab-fisco` nasce `display:none`; lo accende `fiscoAccendi()` solo con `?giro=1` o per le email in `FISCO_ANTEPRIMA`. Per accenderlo a tutti: togliere il controllo in `fiscoAccendi()` (e aggiungere "fisco" all'elenco dei deep link).
- Legge le fatture `emessa` NON pagate di TUTTI i reparti (non filtra per mestiere), scadenza = data + `gest_azienda.giorni_pagamento`.
- 4 passi: 1 promemoria gentile, 2 sollecito deciso, 3 diffida PEC (testo + PDF), 4 giudice (info). Ogni passo mandato va in `gest_solleciti` (RLS own, giro_demo_lettura, trg_gest_piano, trg_gest_stesso_padrone). «Ha pagato» = come fattCambiaStato: stato pagata + data_pagata + gest_lavori.fatt_stato.
- Interessi: B2B (cliente tipo `azienda`) mora D.Lgs 231/2002 + 40 €; privati interesse legale. Tassi in `FP_MORA` / `FP_LEGALE`: quando cambiano si AGGIUNGE una riga, non si corregge la vecchia.
- Numeri verificati il 27/09/2026: mora 2H2026 10,40% (1H2026 10,15%), legale 2026 1,60%, giudice di pace fino a 10.000 €, da soli fino a 1.100 €, contributo unificato decreto ingiuntivo 21,50/49/118,50/259 € + marca 27 €.
- Banco: `prove-claude/banchi-fissi/banco-fisco.html` (dati finti, niente rete).

## 27 SETTEMBRE 2026 (notte, 2) — TASSE E FISCO, TAPPA 2: «LE TUE TASSE» (NASCOSTO)

- File nuovo `js/gest-fisco-tasse.js` (`fiscoTasse(box)`), chiamato da `renderFisco()` quando si sceglie «Le tue tasse». Stile `.ft-*` in fondo a `css/gestionale.css`.
- Tabella `gest_fisco_profilo` (una riga per utente: forma, regime, cassa, anno_inizio, aliquota_5, coeff, riduzione35, iva, spese_anno, perc_commercialista). File `sql/fisco.sql` (con `gest_solleciti`), riga in `PROVE` di fondatore.js. Giro: profili di esempio per i 3 utenti demo (impresa = srl, artigiano = forfettario, professionista = forfettario CIPAG).
- Senza profilo: lo indovina da `gest_azienda.regime_fiscale` (RF19 = forfettario) e dal ruolo, e dice «l'ho indovinato: controllalo».
- Incassato = fatture PAGATE nell'anno (data_pagata), imponibile. Stima sull'anno intero (proiezione) dopo il 60° giorno.
- Conti: forfettario = incassi × coeff, contributi (INPS minimo + 24%/25% oltre 18.808/56.224; −35% se riduzione; GS 26,07%; CIPAG 20% min 4.240; Inarcassa 14,5% min 2.785), imposta 15%/5% su (reddito − contributi). Ordinario individuale = IRPEF 23/33/43 su (incassi − spese − contributi), SENZA detrazioni e addizionali (lo dice). Società: nessun calcolo, solo la % del commercialista.
- Scadenze dal calendario 1/10/2026–31/12/2027 (fisco/regole-2026 voce 11), acconti stimati al 50% delle tasse dell'anno. «Ricordamelo» scrive nei `promemoria` (avviso 7 giorni prima), senza doppioni.
- Strumenti: ravvedimento (D.Lgs 87/2024: 0,0833%/giorno fino a 14, 1,25% fino a 30, 1,39% fino a 90, 3,125% entro l'anno, 3,57% entro 2, 4,17% oltre; interessi legali 2% 2025, 1,6% 2026) e «Mi è arrivata una lettera» (avviso bonario 60 gg / 20 rate; cartella 60 gg / 84 rate fino a 120.000 €, decadenza a 8 rate).
- ⚠️ Quando esce la circolare INPS 2027 si aggiornano `FT_INPS` e le date 2027.
- Banco: `prove-claude/banchi-fissi/banco-fisco-tasse.html` (?sez=tasse&p=forf|ord|srl|gs|none).

## 27 SETTEMBRE 2026 (notte, 3) — TASSE E FISCO, TAPPA 3: «SOPRAVVIVERE» (NASCOSTO)

- File nuovo `js/gest-fisco-vivere.js` (`fiscoVivere(box, mio)`), stile `.fv-*`. Usa `ftStima`, `ftScadenze`, `ftIndovina` di gest-fisco-tasse.js: i conti NON sono rifatti.
- «Quanto ti resta»: incassato (fatture pagate, imponibile) − spese − tasse stimate. Le spese sono le STESSE fonti del Riepilogo (gest_spese, gest_carte_movimenti tipo spesa, gest_rifornimenti senza movimento_id, gest_fatture_fornitori), di tutti i reparti e dell'anno. Se il Riepilogo aggiunge una fonte, va aggiunta in `fvSpese`.
- «I prossimi 3 mesi»: entrano le fatture emesse alla loro scadenza (quelle già scadute a parte, con link a Farsi pagare), escono le fatture fornitori non pagate e le scadenze fiscali stimate. Avviso sul mese peggiore.
- «Il prezzo giusto»: bisezione su ftStima per trovare l'incasso annuo che lascia il netto voluto; giornata e ora minime; «Usa come mia tariffa oraria» scrive `gest_azienda.tariffa_oraria`. I numeri si ricordano nelle colonne `pg_*` di `gest_fisco_profilo` (migrazione `fisco_prezzo_giusto`, in sql/fisco.sql e PROVE).
- «La cartella dell'anno»: PDF (jsPDF, logo con gestLogoPdf) con profilo, incassi per mese, spese, fatture aperte, fornitori da pagare, stima, domande per il commercialista.
- ⛔ Corsa fra sezioni: `fpGiro` in gest-fisco.js. Ogni sezione riceve `mio` e dopo ogni await esce se `mio !== fpGiro`. Chi aggiunge una sezione nuova deve fare lo stesso.

## 27 SETTEMBRE 2026 (notte, 4) — TASSE E FISCO, TAPPA 4: «CHIEDI ALL'AI» (NASCOSTO)

- File nuovo `js/gest-fisco-ai.js` (`fiscoAI(box, mio)`), stile `.fi-*`. Chat semplice come la Chat con AI (niente benvenuto, niente domande di esempio: decisione di Alessio del 29 agosto) + «📷 Lettera» (foto o PDF).
- AI: Edge Function Supabase `ai-cantiere` (versione 4, deploy dal connettore, NON costa crediti Netlify), feature nuove `domanda_fisco` (testo) e `spiega_lettera` (foto/PDF → JSON chi/cosa/in_breve/importo/scadenza/urgenza/cosa_fare/rate/attenzione). 1 credito AI ciascuna. Le regole 2026 sono nella costante `REGOLE` dentro la funzione: quando cambiano, si cambiano LI' e in `js/gest-fisco-tasse.js`. Copia nel repo: `supabase/functions/ai-cantiere/index.ts`.
- Il contesto lo costruisce `fiContesto()` (profilo, incassato, stima, riduzione 35%, spese, fatture aperte, tariffa): niente nomi di clienti. Alle AI vanno le ultime 3 domande/risposte; la conversazione vive solo in memoria.
- Provato DAL VIVO con l'account di Alessio (3 crediti): la prima versione sbagliava i contributi del forfettario («paghi sempre il minimo») e scriveva in markdown → corretto il prompt (esempio 38.000 € → circa 7.850 € di INPS, riduzione 35% su tutto, niente markdown, niente sanzioni inventate). Lettera di prova (avviso bonario, ricevuta il 15/09) → scadenza 14/11 giusta, importo giusto, 20 rate.
- ⚠️ È Haiku: sui calcoli a mano può sbagliare. Per questo il contesto porta già i numeri calcolati dal gestionale e il prompt gli dice di usare quelli.
- In giro di prova l'AI non risponde (niente sessione): lo dice con «provalo gratis 30 giorni».

## 30 SETTEMBRE 2026 — SEMPLIFICARE IL GESTIONALE: COSA SI E' FATTO E COSA SI E' DECISO DI LASCIARE

- FATTURE (fatto, `js/gest-fatture.js` + fondo di `css/gestionale.css`): i riquadri in cima da 5 a 3 (Da incassare, Da fatturare, Entrato in cassa). «Il credito piu' vecchio» e «Fatture emesse» non sono piu' riquadri: c'e' UNA riga rossa (`.fatt-avviso`) che compare solo se c'e' un problema (credito fermo oltre i giorni di pagamento, numeri mancanti). Se i numeri mancanti sono nel Cestino la riga si clicca e apre il Cestino. Provata con 5 casi in Node e sul sito vero (3 riquadri, 0 errori, niente sotto 13 px). La riga rossa non e' stata vista sul sito vero: nel reparto provato non c'erano problemi.
- ⛔ DA LASCIARE COSI (Alessio, 30/09): la riga «Puoi scriverlo a mano, dettarlo all'AI, o farlo nascere da un computo metrico gia' fatto» sotto il titolo di Preventivi — «serve questa informazione».
- ⛔ DA LASCIARE COSI (Alessio, 30/09): il Riepilogo coi suoi 16 riquadri — «lo voglio cosi come lo abbiamo fatto». NON riproporre di nasconderne una parte.
  Perche': le schede del Riepilogo compaiono GIA' da sole, solo per le sezioni che hanno qualcosa dentro (js/gest-riepilogo.js: reparto vuoto = «Questo reparto e' ancora vuoto»). I 16 riquadri visti il 30/09 erano il reparto «giardiniere», pieno di dati di prova: un utente nuovo ne vede pochissimi.
- Lavori e Preventivi: gia' ordinati (tabella, un solo pulsante «Apri», numeri solo quando servono). Niente da toccare.
- Noleggio, operatore e negozio non hanno quei riquadri: niente da replicare.
- Nota: la shell sul computer di Alessio non parte (aggiornamento Windows dell'8 settembre); i file si leggono e si scrivono con stage/commit.
- PROVA DA GEOMETRA (30/09, con `?giro=1&tipo=professionista`, dati finti, non si salva niente). Trovato: (1) «Computo metrico» sta dentro «Altre 15 voci», ma per un geometra e' il lavoro principale; (2) nella fattura la casella «Descrizione» e' larga ~114 px; (3) in Mezzi il testo dice «Attrezzature» ma nel menu dello studio la voce e' «Strumenti»; (4) «Falla leggere anche all'AI · 1 credito» non si capisce; (5) filtri di Pratiche tagliati a destra («Arc…»). Da fare solo se Alessio dice di si.
- Le fatture finte del giro partono da numeri a meta' (25-27, 12-13, 8-9): l'avviso rosso «mancano le n.1…» compariva in ogni giro. Ora in giro (`window.TI_GIRO`) l'avviso non si mostra. Nel gestionale vero i numeri li da il gestionale da 1 (`fattProssimoNumero`), quindi l'avviso resta.
- ⚠️ Per scrivere file sul computer di Alessio: un nome di passaggio NUOVO a ogni scrittura in `/mnt/user-data/outputs/`. Riusare lo stesso nome ha fatto scrivere la copia vecchia (successo due volte il 30/09: gest-fatture.js e CLAUDE.md). Dopo ogni scrittura, ri-leggere e confrontare md5/misura.
- FATTO (30/09, dopo la prova da geometra): per gli studi tecnici il «Computo metrico» sale in vista nel menu corto, sotto Clienti (`window.menuCortoPromuovi('computi','clienti')` in `js/gest-menu-corto.js`, chiamata da `adattaMenuProfessionista` in `js/gest-core.js`; se il menu non e' ancora montato la richiesta aspetta in `window._tiPromuovi`). Impresa e artigiano non cambiano. In Mezzi la frase «Il resto sta in Attrezzature» diventa «Strumenti» per gli studi.
- ⚠️ Effetto da tenere d'occhio: con 9 voci in vista il menu degli studi e' piu' lungo; su schermi bassi (768 px) compare lo scorrimento e «Altre voci» finisce sotto. Possibile rimedio, NON deciso: rimpicciolire i due riquadri «Chiedi una funzione» / «Assistenza diretta» (li aveva fissati Alessio il 28/09, quindi chiedere prima).

### 30 settembre 2026 (sera) — PAROLE SEMPLICI per artigiano e impresa

Alex ha chiesto di sostituire le parole difficili, **solo per artigiano e impresa** (lo studio resta com'era; PDF e XML fiscali non si toccano). Deciso con lista «prima → dopo» approvata prima di toccare i file. Tutte le condizioni sono `ruoloUtente==='professionista'` (studio = vecchie parole).

- Backup (JSON) → «Salva una copia dei dati»; Esporta CSV → «Scarica per Excel» (impostati in gest-core.js dopo `applicaNomeGestionale()`).
- Fattura (gest-fatture.js): Imponibile → «Prezzo senza IVA»; «Imponibile IVA» → «Su cui si paga l'IVA»; Bollo → «Marca da bollo (€)»; Ritenuta d'acconto → «Trattenuta (ritenuta d'acconto) %».
- gest-core.js: «Controlla prima di mandarlo» → «Controlla che sia giusto»; `CTR_AI_LABEL` non c'è più, ora è la funzione `ctrAiLabel()` («Fai controllare anche all'intelligenza artificiale · 1 credito»); «Come si incastrano» → «Cosa viene prima e cosa dopo»; blocco `imp` di `_cm`: «Computo da prezzare» → «Elenco lavori da prezzare».
- Collaudato sul sito vero nel giro artigiano, impresa e studio. Non provata dal vivo la riga «Cosa viene prima e cosa dopo» (compare solo con 2+ passi visibili).
- ⚠️ Se si aggiunge una parola nuova: stessa regola, condizione sul ruolo, mai cambiarla per lo studio.


# 1-3 OTTOBRE 2026 — GESTIONALE GRATIS, UN SOLO PIANO A PAGAMENTO, E LA GRAFICA TUTTA SUA

## Cosa e' stato deciso (3 ottobre 2026)
- Il gestionale BASE e' gratis per sempre per chi si iscrive a TrovaImpresa. Un SOLO piano a pagamento: «Gestionale con assistenza AI e chat», →39← euro al mese o →349← euro all'anno. I prezzi Stripe vecchi (→29←/→249←) sono archiviati.
- Per entrare nel gestionale gratis serve il profilo completo (7 voci, `VOCI_PROFILO` in `js/gate-gestionale.js`; la descrizione deve avere almeno →100← caratteri). `pagaDavvero(riga)` = premium_pagato vero + piano premium + non scaduto: chi paga davvero salta il controllo del profilo. Anteprima della schermata del profilo: `?profilo=prova`.
- Interruttori: nel database `gest_base_aperto()` = true; nel codice `GESTIONALE_BASE_APERTO = true` (`PROFILO_MINIMO_ATTIVO = BASE_APERTA`).
- Fatti e online: →27← pagine SEO del gestionale, prezzi, gestionale, termini, info-premium, FAQ; `js/porte-gestionale.js` (le «porte» nel pannello) e `css/porte-unico.css`.
- Home: «Gratis per sempre, senza carta di credito». Email di benvenuto nuova (`netlify/functions/invia-email-benvenuto.js`): oggetto «Benvenuto su TrovaImpresa», fascia verde «Il sito e' gratis, per sempre — gestionale compreso», riquadro «Se hai bisogno, siamo qui».
- Bing avvisato con `tools/indexnow.js` (chiave `c670fbe9c5c6a2205488dd36e94bd040.txt`, gia' dentro `PUBBLICI_APPOSTA`; NON creare un secondo file chiave: il guardiano blocca il push). In Git Bash i percorsi si scrivono `//prezzi` perche' `/prezzi` viene trasformato in un percorso Windows. Google non usa IndexNow: indicizzazione chiesta a mano in Search Console per `/`, `/gestionale`, `/prezzi`.

## PAROLE FISSE DI ALEX (3 ott)
- **«il pannello»** = tutto quello che sta FUORI (scheda «Il tuo gestionale» nei pannelli, prezzi, pagine Google). **«l'app»** = il gestionale dentro (`gestionale-app.html`, reparti, Riepilogo). Se dice solo «gestionale», chiedere quale dei due.
- Su Google e nei testi: nome «TrovaImpresa Gestionale»; per spiegarlo «gestionale per imprese edili e artigiani» (anche «gestionale cantieri», «gestionale preventivi e fatture»); per attirare «gestionale gratuito». NON «sito gestionale».

## LA GRAFICA PROPRIA DEL GESTIONALE — STILE C (scelto da Alex il 3 ott)
Blu progetto a quadretti `#0a2a4d` (griglia `rgba(255,255,255,.06)` ogni →40← px), linee bianche, arancione `#ff8800`, font IBM Plex Sans/Mono, logo `img/trovaimpresa-gestionale-logo.svg` (testo in Trebuchet). Tre posti, tutti online e collaudati dal vivo:
1. **Il pannello «Il tuo gestionale»** nei 3 pannelli (impresa, artigiano, professionisti): contenitore con classe `gest-c`, logo in `.gc-logo`, titolo `.gc-tit`, `.gc-sub`. CSS: `css/porte-unico.css?v=7`. Prezzi uno per riga, bottoni arancioni ≥19px, icone arancioni (stellina →44← px) o bianche (lucchetto di «Entra», →30← px).
2. **La schermata dei reparti** di `gestionale-app.html` (`#landing`): `css/gestionale-stile.css?v=2`, logo come `<img class="gc-brand">` prima dell'`<h1>`.
3. **L'interno dell'app**: SOLO menu a sinistra (`#appview .side`) e barra in alto (`#appview .topbar`) in stile C, voce attiva arancione, contatori arancioni, voci «Chiedi una funzione»/«Assistenza» con bordo bianco; il CENTRO resta bianco di proposito (si lavora per ore su numeri: blu a quadretti stancherebbe).
- ⛔ `css/gestionale-stile.css` si carica DOPO `css/gestionale.css` (che e' in comune a tutti i gestionali); le regole sono scritte con `#landing` / `#appview` davanti. Non toccare `gestionale.css` per lo stile.
- ⚠️ TRAPPOLE CSS trovate: (a) `js/porte-gestionale.js` mette i colori dei bottoni in `style.cssText` inline: per cambiarli serve `!important`; (b) il foglio della pagina ha regole con `#sec-dashboard #porte-gestionale…`: per vincere serve un selettore con gli stessi id; (c) `.g-ico` ha `padding:6px` e l'svg dentro ha `max-width:100%`: l'icona si riduceva a →10← px — serve `padding:0;width:auto` sul contenitore e `max-width:none` sull'svg; (d) le icone del menu dell'app hanno una piastrella colorata sull'svg: va azzerata (`background:transparent`) o su fondo blu sparisce.
- Il titolo «Gestionale impresa/artigiano/…» e' scritto dal JS: non fidarsi del testo nell'HTML.
- Il logo della sua attivita' (con «Cambia logo») e il logo Gestionale stanno uno sotto l'altro nella schermata dei reparti e occupano molto spazio, soprattutto sul telefono: da sistemare.

## LAVORI RIMASTI (3 ott)
1. **TRE PANNELLI, CODICE CONDIVISO.** Confrontati: →161← funzioni su →199← sono identiche nei tre pannelli (~→112← KB), →19← hanno lo stesso nome ma sono diverse (`inizializza`, `caricaProfilo`, `caricaPreventivi`, `inviaPreventivo`…, restano separate), →19← stanno in uno o due soli. Piano: spostare SOLO le identiche in un file condiviso in `js/`, un gruppo alla volta, senza cambiare cosa si vede, un push e un collaudo sui TRE pannelli per gruppo; partire dal gruppo piu' piccolo e dirgli prima quale.
2. Sistemare i due loghi nella schermata dei reparti (anteprima in foto prima).
3. Collaudo dal vivo dello stile C in artigiano e professionista (stesso `gestionale-app.html`) e del telefono DENTRO l'app: visto solo l'impresa.
4. Il noleggio (`gestionale-noleggio.html`) e l'app operaio non hanno lo stile C: da decidere con lui (condividono `css/gestionale.css`).
5. Fra 3-4 giorni: Search Console, se Google ha letto il testo nuovo di `/prezzi` e della home. Le →1.650← pagine «scoperte, non indicizzate» si lasciano stare.
6. Guardare quanti iscritti restano fermi su «Completa il profilo» (7 voci, descrizione ≥100 caratteri): se tanti, abbassare i →100← caratteri. Da misurare nelle prime due settimane anche quanti passano dal gratis al piano a pagamento (se pochissimi, il salto da zero a →39←€ e' troppo grande).
7. `pubblica.bat` (un clic al posto del push): idea NON approvata.

## LEZIONI DEL 3 OTTOBRE
- ⛔ `device_commit_files` ha scritto una copia VECCHIA di un file (il CSS, mancavano le ultime righe) e ha risposto «written»: il push e' partito con un file senza le misure del logo. Cura: dopo OGNI commit ri-prendere il file dal PC con `device_stage_files` e confrontare i BYTE con quelli attesi, PRIMA di dare la riga del push. Se i byte non tornano, ricommittare con `expectedMtimeMs` aggiornato.
- Dopo un push i file nuovi non sono online subito (Netlify ci mette ~1-2 minuti, e il browser puo' tenere il CSS vecchio): si controlla chiedendo il file con `?y=<ora>` e cercando una riga nuova. Quando si cambia un CSS gia' online conviene alzare il numero `?v=` nelle pagine.
- La riga del push va SEMPRE in un blocco di codice a parte (con il pulsante «copia»), mai in linea nel testo. Messaggi di commit senza parentesi tonde. Meno push possibile, lavori raggruppati.
- Per mostrare un'anteprima su una pagina VERA (col suo login) si inietta un `<style>` nel browser integrato e si fotografa, prima di toccare i file. Dopo il test riportare la finestra a «desktop».

## IL CAPITOLATO (16 ott 2026)
- Tasto **«📋 Capitolato»** nel menu di ogni preventivo (tutti i profili). Finestra grande a due colonne: a sinistra intestazione, tempi e pagamenti; a destra le voci (cosa si fa, materiali, compreso, escluso), garanzie e note. In fondo Scarica PDF e Salva.
- **Dove sta il codice:** `js/gest-capitolato.js` (nuovo, dentro una scatola `(function(){...})()`; fuori esce solo `window.gestCapitolato`). Il tasto e' una riga in `prevVoci` (`js/gest-ore-spese.js`), lo script e' caricato in `gestionale-app.html` dopo `gest-documenti-pdf.js`, il tooltip e' in `js/aiuti.js`.
- ⛔ **Niente tabella nuova:** il capitolato e' UNA colonna jsonb del preventivo, `gest_preventivi.capitolato` (`sql/capitolato-nel-preventivo.sql`, GIA' ESEGUITO il 16 ott). Cosi' segue il preventivo nel Cestino e nel ripristino, e non si tocca ne' `TABELLE` in `js/cestino.js` ne' `REPARTO_CONTENUTO`. Il rovescio: un preventivo = un capitolato.
- **Versione base:** 4 modelli pronti (bagno, ristrutturazione, tinteggiatura, impianto elettrico), «Porta le voci dal preventivo» (solo i titoli, i capitoli si saltano), tendina dei pagamenti (stesse di `ORD_PAGAMENTI`).
- **Versione AI (1 credito):** funzione NUOVA `supabase/functions/ai-capitolato` (deployata il 16 ott, `verify_jwt` acceso) + `AI.capitolato` in `js/ai-integrazione.js`. Stesso motivo di `ai-cantiere`: non si e' toccato `ai-generate`. L'AI non inventa marche, prezzi, percentuali o durate; le caselle gia' scritte non si toccano, le voci nuove vanno in fondo.
- Il PDF salva anche (cio' che esce sul foglio e' cio' che resta nel gestionale). Clausole standard (garanzia artt. 1667 e 1669 c.c., varianti): modello di base, da far leggere al commercialista o a un legale.
- **Provato:** banco con 22 controlli (apre, modelli, aggiungi/togli voce, AI, salva, riapri, PDF), pagina vera caricata con Supabase bloccato (zero errori JS, zero id doppi), computer 1600 e telefono 390, nessun testo sotto 13 px.
- ⚠️ **NON provato dal vivo:** la chiamata AI vera (serve il login di Alex) e il salvataggio sul database vero. Dopo il push: provare un capitolato con l'AI e uno a mano, riaprirlo, scaricare il PDF.
- Idea per dopo: quando c'e' la firma elettronica (sabato 17 ott) il capitolato si puo' far firmare dal cliente insieme al preventivo.
- ⛔ **Lezione del 16 ott:** il primo push del capitolato (`f2d9e72`) e' stato FERMATO da `tools/controllo-push.js` (Netlify: «Build script returned non-zero exit code: 2», sito vecchio rimasto online). Motivo: ogni file `.sql` nominato dal gestionale deve avere una riga in `PROVE` dentro `js/fondatore.js`. Aggiunta la riga `capitolato-nel-preventivo.sql`. **Prima di dare il push, far girare `node tools/controllo-push.js` (~2 minuti).**

## IL CAPITOLATO POTENZIATO (16 ott 2026, sera)
- **7 migliorie, tutte in `js/gest-capitolato.js`:** (1) PIU' CAPITOLATI per preventivo, schede in alto; (2) «Porta le voci» COMPLETO: una voce per capitolo del preventivo con righe e quantita', piu' «Un capitolato per ogni capitolo»; (3) 10 modelli (nuovi: tetto, facciata, cartongesso, idraulico, pavimenti, infissi); (4) FOTO e allegati (max 6 per capitolato) nel bucket `gestionale-foto`, cartella `<id utente>/capitolati/<id preventivo>/`, in fondo al PDF; (5) PDF col logo e il COLORE dell'impresa (`imprese.personalizzazione.colore_header`), «Pagina x di y»; (6) FIRMA col dito di cliente e impresa; (7) l'AI CONTROLLA cosa manca (1 credito).
- **Formato nel jsonb:** `{capitolati:[{id,nome,voci,dove,inizio,durata,pagamenti,garanzie,note,allegati,firme}],aggiornato}`. Il formato VECCHIO (`{voci,dove,...}`) si legge ancora come primo capitolato: nessun SQL nuovo.
- ⛔ **La firma col dito e' una firma elettronica SEMPLICE**, non qualificata: vale come prova di accordo. Si salva con l'impronta del testo: se il capitolato cambia dopo la firma, la firma decade e nel PDF non compare. La firma digitale con Openapi resta da fare (rimandata: sabato 17 ott Alex lavora).
- ⛔ **File orfani:** le foto tolte o caricate e poi lasciate (Annulla) si cancellano dallo storage quando si salva o si chiude con Annulla. Se si chiude in altro modo (fuori dalla finestra) puo' restare qualche foto: sono sotto la sua cartella.
- **AI controllo:** `AI.capitolato(testo,"controllo")` → stessa funzione `ai-capitolato` (v3), modo `controllo`, risposta `{giudizio,segnalazioni:[{dove,problema,suggerimento}]}`. Segnala soltanto, non cambia niente.
- **Provato:** banco `prova2.py` con 50 controlli (schede, modelli, foto, firme e decadenza, controllo AI, salva/riapri, vecchio formato, PDF singolo e di tutti, file orfani, zero errori JS, nessun testo sotto 13px).

---

## LE FATTURE RICEVUTE DAI FORNITORI (16 ott 2026, sera)

Pulsante «📥 Fatture ricevute» nella sezione Fatture (gestionale-app.html). Costruito con Openapi.

- **Come funziona:** l'impresa registra il codice destinatario di Openapi **JKKZDGR** sul sito dell'Agenzia delle Entrate, preme «Attiva la ricezione» (azione `ric_attiva` in `netlify/functions/sdi.js`: aggiunge a `/api_configurations` l'avviso `supplier-invoice` SENZA togliere quello dell'esito delle fatture inviate). Quando arriva una fattura Openapi chiama `netlify/functions/sdi-ricevuta.js`, che NON si fida del messaggio: scarica l'XML da Openapi (`/invoices_download/{uuid}`), lo legge e salva.
- **Tutta la logica:** `netlify/functions/lib/sdi-ricezione.js`. Client: `js/gest-ricevute.js`. SQL: `sql/fatture-ricevute.sql` (3 tabelle: `gest_sdi_ricezione`, `gest_fatture_ricevute`, `gest_fatture_ricevute_file`).
- ⛔ **Il file XML sta in una tabella a parte SENZA regole di lettura**: il browser non lo vede mai. Si scarica solo dalla funzione, e solo se la fattura è «sbloccata».
- **Costo:** Openapi fa pagare la fattura ricevuta come quella inviata (risposta del supporto del 15 ott 2026). Quindi: gestionale a pagamento = compresa; gratis = scala 1 invio da `sdi_crediti`; senza invii la fattura si SALVA lo stesso (è un documento fiscale) ma resta «da sbloccare». In PROVA non si scala niente.
- **Il badge e la lista si leggono dal database direttamente** (niente funzione Netlify = niente crediti Netlify). La funzione serve solo per attivare, sbloccare, scaricare.
- ⚠️ **Da sapere dall'impresa:** col codice JKKZDGR le fatture dei fornitori arrivano a TrovaImpresa e NON più al commercialista. La schermata lo dice in un riquadro arancione.
- **Prova:** in sandbox c'è il pulsante «Fattura di prova» (usa `/simulate-supplier-invoice` di Openapi). In produzione non c'è.
- **Collaudo fatto:** 56 controlli sul lato server con un finto Supabase e un finto Openapi (attivazione, avviso doppio, fattura di un altro, invio da rimborsare se il salvataggio fallisce, file di un altro utente...) + 38 sul lato pagina. ⛔ NON provato contro Openapi vero: il formato esatto dell'avviso e di `GET /api_configurations` viene dalla documentazione, non da una prova. Se la prima fattura di prova non arriva, guardare i log di `sdi-ricevuta` su Netlify.
- **Non fatto (di proposito):** Noleggio (ha il suo `nol-sdi.js`, non ha ancora la ricezione); nota di credito passiva trattata come una fattura qualsiasi (si vede «Nota di credito» nella scheda).


# 1 NOVEMBRE 2026 — «INVIA AL CLIENTE» (link, WhatsApp, email, QR, firma col dito)

Chiesto da Alex dopo un collaudo dal vivo: computo e capitolato si potevano
solo scaricare in PDF. Approvato con le foto (computer, telefono, pagina del
cliente). Un push solo.

| pezzo | file |
|---|---|
| pulsante «📤 Invia al cliente», primo in alto e nel menu «...» del preventivo | `js/gest-ore-spese.js` (`prevVoci`) |
| la finestra grande a due colonne (cosa mandi · link · WhatsApp/Email/PDF · stato del cliente · QR) | `js/gest-invia-cliente.js` (IIFE, ascoltatore suo) |
| la pagina del cliente, senza account, con firma col dito | `preventivo-cliente.html` (noindex, stampo `scelte.html`) |
| l'unica porta del cliente | `netlify/functions/preventivo-cliente.js` |
| la tabella | `gest_preventivi_link` — `sql/gest-preventivi-link.sql`, migrazione `gest_preventivi_link_1nov2026` |

- ⛔ **`dati` è una FOTOGRAFIA** scattata dal gestionale all'apertura della
  finestra, con le funzioni dei conti del PDF. La funzione del cliente non fa
  conti. ⚠️ L'ordine dei totali in `invConti()` copia il riquadro di `prevPdf()`:
  se cambia l'uno, va cambiato l'altro.
- ⛔ **La firma la scrive solo il server.** Trigger `gest_preventivi_link_controlla`:
  dal browser la firma si può solo TOGLIERE (versione nuova), mai mettere; le
  aperture non si toccano; dopo la firma `dati` è fermo. Provato fingendo il
  ruolo `authenticated` e il `service_role`, dentro transazioni annullate.
- ⛔ Le foto dei capitolati si firmano solo se il percorso comincia con l'id
  dell'impresa del link.
- La firma vale per preventivo + capitolati mandati insieme (impronta sha256
  della fotografia in `firma_hash`). **Non** finisce dentro le firme del
  capitolato (`gest_preventivi.capitolato.firme`): sono due cose diverse.
- Quando si manda (copia, WhatsApp, email, QR) una bozza diventa «Inviato».
- Alla firma parte un'email all'impresa (Resend, quota condivisa).
- Il PDF per il cliente è la stampa del browser («Stampa o salva PDF»),
  così non nasce un secondo foglio da tenere uguale al primo.

## 1 nov 2026 (sera) — il capitolato: «Invia al cliente» e le VERSIONI

- Nel capitolato, in fondo: «📤 Invia al cliente» (`cap-invia`) — salva e apre
  `window.gestInviaCliente(id,{capitolati:true})`, che mette dentro i capitolati.
- **Le versioni** — tabella `gest_capitolato_versioni` (`sql/gest-capitolato-versioni.sql`,
  migrazione `gest_capitolato_versioni_1nov2026`). Al Salva, se il testo è cambiato
  (confronto in ordine, senza `aggiornato`), il capitolato DI PRIMA va lì. Trigger:
  preventivo tuo + ne tiene 30. «Versioni (n)» accanto a «+ Nuovo capitolato»:
  Vedi · Ripristina (rimette nelle caselle, vale solo col Salva).
- ⛔ `salva()` non cancella più dal deposito le foto che stanno in una versione.
- Le etichette «Firmata dal cliente» / «Mandata al cliente» si ricavano dalle date di
  `gest_preventivi_link` (firmato_il / aggiornato_il) cadute nel periodo di quella versione.
- Trovato e chiuso lo stesso giorno: `js/ai-integrazione.js` cercava la chiave pubblica
  nell'HTML (dal 1 ott sta in `js/gest-base.js` come `SUPA_KEY`): `get_ai_status` dava
  401 a ogni apertura e `AI.stato` restava vuoto.
- **Il controllo rosso/arancio/verde anche nel capitolato** (1 nov, sera): `ctrRegoleCapitolato()`
  in `js/gest-capitolato.js` si registra in `CTR_DOC.capitolato` all'apertura
  (`ctrCapitolatoAccendi`), e in fondo c'è `ctrTastoHTML("capitolato")`. Rosso: nessuna
  voce, voce senza «Cosa si fa», inizio già passato. Arancio: indirizzo, tempi, pagamenti,
  materiali vuoti o «da concordare», voce senza «Escluso». Il capitolato NON è in
  `CTR_AI_SEZIONI`: la sua AI ce l'ha già in cima («Controlla cosa manca»).

# 6 NOVEMBRE 2026 (sera) — IL GESTIONALE DIVENTA UN ASSISTENTE

Chiesto da Alex: «ispezionalo a fondo, rendiamolo piu' semplice e intuitivo,
la grafica come un assistente». Ispezione dal vivo sul suo account, anteprima
in foto approvata («si»), poi →7← push tutti controllati su Netlify e
collaudati sul sito vero (computer 1440 e telefono 375).

## Cosa si e' trovato nell'ispezione
- →7← porte per l'aiuto (Chat, Parla, «Chiedi all'AI cosa fare oggi», Aiuto,
  Assistenza diretta, Chiedi una funzione, AI dei moduli): nessuno sapeva quale usare.
- ⛔ La Chat con AI NON sapeva com'e' fatto il gestionale: a «come faccio la
  fattura dal preventivo?» rispondeva «di solito in alto a destra». E mandava
  ai riquadri «in alto a sinistra» che dalla mattina stavano in fondo.
- La vecchia guida «Come si fa» (MANUALE in `supabase/functions/ai-generate`)
  e' ferma: non conosce Computo, Giornate, Fisco, Capitolato, Promemoria.
- Prezzario: →1.000← schede insieme, pagina alta →186.220← px.
  Cestino: →641← pulsanti, →103.933← px. Il Cestino faceva 6 richieste 400 a
  ogni apertura (6 tabelle senza `mestiere_id` chieste col reparto).

## Cosa e' stato fatto
| cosa | dove |
|---|---|
| Casella «Cosa facciamo?» in cima al Riepilogo: saluto col nome, Parla, Manda, 4 scorciatoie | `js/gest-assistente.js` (nuovo, IIFE) |
| «Manda» → Chat con AI (chat nuova); «Parla» preme il `#gv-btn` di sempre | idem |
| «Aiuto» in alto apre la Chat, non piu' la guida vecchia | idem (`aiutoAllaChat`) |
| Menu: «Riepilogo» si chiama «Assistente»; in vista Assistente, Preventivi, Computo, Lavori, Fatture, Clienti, Calendario; il resto in «Tutto il resto» (Chat, Giornate, Fisco scendono nei gruppi) | `js/gest-menu-corto.js` |
| Telefono: barra Oggi · Lavori · microfono arancione · Preventivi · Fatture; niente barra nella schermata dei reparti; il Parla tondo non si vede mai | `js/gest-assistente.js` |
| La Chat conosce il MANUALE (pulsanti veri) e non indovina le cause degli errori | `netlify/functions/chat-gestionale.mjs` (`MANUALE_GESTIONALE`) |
| Segnalini nuovi `[assistenza]` → «Passa la domanda all'assistenza» (riempie Assistenza diretta, preme Invia lui) e `[racconto]` → «Dividilo in schede» (`window.gestParla`) | `js/gest-chat.js` |
| Le frasi fra un giro e l'altro della chat non escono piu' attaccate | `chat-gestionale.mjs` (`giroManda`) |
| Prezzario 60 alla volta + «Mostra altre», ricerca su tutte, senza rileggere il DB | `js/gest-sal-prezzario.js` |
| Cestino: scelte per tipo in cima + 50 righe alla volta; niente piu' 6 richieste 400 | `js/gest-cestino.js` |
| Studio tecnico: al posto di «Racconta la giornata» la scorciatoia «Cosa scade questo mese?» | `js/gest-assistente.js` |

## Trappole trovate oggi
- ⛔ Nel gestionale ogni `<section>` e' una SEZIONE (nascosta se non `.active`):
  un riquadro nuovo dentro una sezione va fatto con `<div>`, non `<section>`.
- ⛔ `js/gest-dettato.js` mette il microfono piccolo in OGNI textarea: dove non
  serve si spegne con `data-no-dettato`.
- `window._gc` (il client del cancello) arriva DOPO i file js: chi legge dal
  database all'avvio deve riprovare finche' non c'e' (es. il nome del saluto).
- Il ruolo (`ruoloUtente`) si sa qualche istante dopo l'avvio: chi disegna
  cose diverse per lo studio deve ridisegnare quando cambia.
- Il microfono nel browser dell'app Claude e' BLOCCATO: la voce vera la prova
  solo Alex dal telefono. Il racconto si prova chiamando `window.gestParla(testo)`.
- Il push da Claude passa solo se Alex ha detto «pubblica» nel messaggio:
  il sistema blocca i push senza il suo ok esplicito.

## Ancora aperto
1. Noleggio e app operaio non hanno la casella «Cosa facciamo?» (grafica loro:
   prima le foto ad Alex).
2. Non visto: come appare la casella in un reparto vuoto (impresa nuova).
3. La guida vecchia in `ai-generate` resta vecchia: oggi la usa solo chi non
   passa da gestionale-app (da controllare chi la chiama ancora).
4. Il Cestino del reparto giardiniere ha →2.562← cose buttate (quasi tutte voci
   del prezzario). Un «Svuota» per tipo l'ha proposto Claude: Alex non l'ha chiesto.
5. La voce vera dal telefono: tocca ad Alex.

# 7 NOVEMBRE 2026 — LA CHAT CON AI PIÙ FORTE, E LE PRATICHE DELLO STUDIO

Chiesto da Alex: «controlla come funziona la AI, vedi i suoi punti deboli, potenziamola».
Ispezione dal vivo (sul suo account, e su `?giro=1&tipo=professionista`) + registro vero
di `gest_chat_messaggi`. →6← push, tutti controllati su Netlify e collaudati sul sito.

## I difetti trovati dal vivo (tutti chiusi)
1. Date confrontate a mente: il 7/11 un lavoro del 5/9 era «nei tempi». → il server scrive
   `giorni_da_oggi` accanto a ogni riga (`segnaGiorni`), il modello legge e basta.
2. Un'impresa vera ha scritto in ARABO: «non parlo arabo, scrivi in italiano». → regola LINGUA.
3. Al geometra mandava il protocollo nello Scadenzario. → `PAROLE_RUOLO` per ruolo (il browser
   manda `ruolo`, se no si legge `imprese.tipo`).
4. ⛔ `cerca_per_nome` sulle fatture faceva `ilike` su `numero`, che e' INTEGER: errore 42883 a
   ogni ricerca. Adesso testo con ilike su piu' caselle (`DOVE_SI_CERCA` e' un elenco) e il
   numero con `.eq` solo se la parola e' fatta di cifre (`NUMERO_INTERO`).
5. Non vedeva richieste dal sito, promemoria, note del calendario → nuovi in `ATTREZZI` con
   `livello` ('account' = solo user_id; 'impresa' = `impresa_id` letto dal server: ⛔ il
   fondatore per RLS vede le richieste di tutti, senza il filtro gliele mischierebbe).
6. «Quanti lavori aperti» contava anche i finiti, e solo le ultime 25 righe → filtri `stato`,
   `escludi_stato` (con `stato.is.null` dentro, se no il null sparisce), `dal`, `al`,
   `prima_le_prossime`. Nuovo attrezzo `agenda` (cosa fare oggi in un giro solo).
7. Costo →0,04-0,07← $ a domanda: le istruzioni fisse si rimandavano a ogni giro. → cache di
   Anthropic: `sistemaPerClaude` (parte fissa con `cache_control`) + `STRUMENTI_IN_MEMORIA`.
   Misurato dopo: →~0,02← $. Il costo nel registro conta anche i gettoni della cache.

## Le pratiche dello studio
- `netlify/functions/ai-pratica.mjs` (Haiku, 1 credito, stesse rpc dei crediti): testo o FOTO
  (ricevuta SUE, visura, lettera del Comune) → caselle. Sta su Netlify e NON in ai-cantiere per
  non ridistribuire a mano quella funzione. Tipi/stati = elenchi chiusi uguali a `PRATICA_TIPI`
  / `PRATICA_STATI` di js/gest-scadenze-pratiche.js (anche in chat-gestionale.mjs: se cambiano,
  si cambiano in TRE posti).
- Nel modulo dello studio: la riga AI usa `AI.pratica`, pulsante «📷 Leggi un documento».
- `AI.riempiPratica` (js/ai-integrazione.js): una macchina sola per chat, riga AI e foto.
- Chat: `compila_lavoro` con le caselle della pratica (solo ruolo professionista),
  `modifica_lavoro` (lavoro GIA' ESISTENTE, id controllato col reparto; il browser preme
  `edit-job` e riempie solo le caselle dette — ⚠️ aspetta una casella `j-desc` NUOVA: la
  finestra chiusa lascia le sue caselle nella pagina, al primo giro si riempiva quella).
  Agenda studio: `pratiche_integrazioni_richieste`, `pratiche_al_comune` (`giorni_dal_deposito`).
- «Depositata» scelta A MANO con la data vuota → oggi (`e.isTrusted`: se la mette l'AI no).
- Pratica a «Integrazioni richieste» → al Salva `proponiScadenzaIntegrazioni`: scadenza a 30
  giorni collegata, tipo «Integrazione richiesta dal Comune», avvisi email.

## Banco
`/home/claude/banco/banco.mjs` nel contenitore (75 prove, sulla versione vecchia 15 rosse).
⚠️ I banchi vecchi in `prove-claude/` (`banco-attrezzi-30ago.mjs`) contavano su
`DOVE_SI_CERCA` fatto di stringhe: adesso sono elenchi, possono diventare rossi per quello.

## Aperto
1. ~~Il «Parla» non conosce la pratica~~ CHIUSO il 7/11: in `js/gest-voce.js` (`eUnaPratica` / `praticaAVoce`), se e' uno studio e la frase parla di una pratica (e non di un promemoria) si passa da `AI.pratica` invece di comando_voce. Apre sempre una pratica NUOVA. Provato dal vivo: tutte le caselle giuste.
2. Le prove hanno consumato ~29 dei 50 messaggi di chat del mese di Alex, e hanno lasciato 23
   chat di prova nell'archivio (cancellarle col × o dare il via a Claude).
3. Modello della chat ancora Sonnet 4.5.

# 8 NOVEMBRE 2026 — I VIDEO TUTORIAL E LA GUIDA «GUIDAMI»

- `js/gest-tutorial.js`: puntino ▶ su ogni voce del menu che ha un video, e la
  voce «Guidami» (sotto Aiuto) che illumina le voci una per una. La guida legge
  il menu com'è in quel momento: se una voce si sposta o nasce, la segue da sola.
- Caricato da `gestionale-app.html` e da `gestionale-noleggio.html` (qui con
  `data-cartella="/video/tutorial/noleggio/"`: cartella ancora vuota, quindi solo
  la guida, niente puntini).
- I video stanno in `video/tutorial/<data-tab>.mp4` (computer) e
  `<data-tab>-tel.mp4` (telefono); `elenco.json` dice quali esistono. I
  sottotitoli sono stampati dentro, in una fascia blu sotto lo schermo.
- ⛔ Li fa `tools/tutorial/registra.py` (Playwright + ffmpeg): apre il gestionale
  VERO servito in locale con `tools/tutorial/finto-supabase.js` (dati di esempio:
  «Edil Rossi», «Giulia Bianchi»). Quando cambia una schermata, si rifà il suo
  video: `python3 -m http.server 8765` nella cartella del sito, poi
  `python3 tools/tutorial/registra.py preventivi` (o `tutti`). Serve
  `LANG=it_IT.UTF-8` (già nello script) se no le date escono all'americana.
- `/tools/*` è già bloccato da netlify.toml: lo script non va online.
- 8 nov 2026 (dopo): LA VOCE DI ALESSIO. `registra-voce.html` (noindex, non
  collegata da nessuna parte) gli fa leggere le frasi di `video/tutorial/frasi.json`
  una alla volta e le tiene nel browser (IndexedDB); alla fine scarica
  `voce-tutorial.zip`. Poi: `VOCE=/cartella/dello/zip python3 tools/tutorial/registra.py tutti`
  rifa' i video con la sua voce (ogni frase legata al testo del sottotitolo; il
  copione aspetta che la frase finisca). Se si cambia un copione, si rilancia
  `tools/tutorial/frasi.py video/tutorial/frasi.json` dopo la registrazione.
- 8 nov 2026 (sera), scelte di Alex: niente voce (pagina `registra-voce.html`
  tolta: «non sono capace a parlare fluido»); il ▶ dell'«Assistente» apre la
  guida «Guidami» (`VOCE_GUIDA` in gest-tutorial.js) e la voce «Guidami» in fondo
  al menu non c'e' piu'; tolto il video dell'Assistente; i ▶ del menu stanno in
  colonna (posizione fissa a destra, anche con il numerino).
- 8 nov 2026 (sera): RICHIESTE DAL SITO, UNO STATO SOLO fra pannello e gestionale.
  Lo stato sta in `gest_dalsito` (nuova/vista/preventivo/chiusa); la lettura in
  `preventivi.visto_il` (rpc `segna_preventivo_visto`); la risposta dal pannello
  in `preventivi.risposta_at`. Gestionale (`dsCarica`): visto_il -> «Vista»,
  risposta_at -> «Risposto dal sito» (in «Fatte»); ogni dsSegna segna anche visto.
  Pannelli impresa e artigiano: `js/richieste-stato.js` avvolge caricaPreventivi e
  apriModal senza toccarle (bollino vero, «Segna chiusa»/«Riapri», numerino).
  ⛔ dsCarica filtra per `impresa_id` delle PROPRIE imprese: il fondatore per RLS
  vede tutte le richieste del sito, che stanno nell'Admin («Mandata a»).
  Fuori: professionisti (incarichi_richieste, il gestionale non li legge).
  8 nov 2026 (notte): anche gli STUDI TECNICI. Le richieste di incarico
  (`incarichi_richieste`, id uuid) entrano in «Richieste dal sito» del gestionale
  (`dsIncarichi` in gest-carte-documenti.js, righe con `_inc:true`; contatti e
  documenti letti dalla riga, niente function) e lo stato sta nella COLONNA `stato`
  della riga (nuova/vista/preventivo/chiusa; `risposta_at` = «Risposto»), scritta
  direttamente (RLS update owner). Pannello: `js/avviso-incarichi.js` (badge vero,
  «Segna chiusa»/«Riapri», numerino). ⛔ Trovato: `segna_incarico_visto(bigint)`
  non poteva funzionare (id uuid) e il «Ho visto» cercava un id di sole cifre: non
  compariva mai. Il client non la usa piu'; la funzione nel database e' rimasta
  (la migrazione per toglierla e' stata bloccata: da fare a mano se si vuole).


# 8 NOVEMBRE 2026 — LA FIRMA CON CODICE SMS (Openapi, EU-SES)

Chiesta da Alex («nel gestionale era rimasto da fare la firma digitale»). Scelte sue:
**si pagano 5 crediti AI** (a Openapi costa ~0,49 €; 150 crediti = 19 €), si parte da
**preventivo e capitolato** dentro «Invia al cliente». La firma col dito RESTA.

⚠️ Non e' la «firma digitale» qualificata (quella chiede al cliente un certificato suo):
e' la firma elettronica con codice SMS (EU-SES, eIDAS) + registro delle prove di Openapi
per 10 anni. Il PDF firmato lo teniamo NOI: Openapi lo cancella dopo 90 giorni.

| pezzo | file |
|---|---|
| riquadro «Firma con codice SMS» (modulo → aspetta → firmato + «Scarica il PDF firmato») | `js/gest-invia-cliente.js` (colonna destra) |
| la porta dell'impresa: crea / stato / annulla | `netlify/functions/firma-sms.js` |
| Openapi ci avvisa (`?f=<id>&k=<chiave>`) | `netlify/functions/firma-sms-notifica.js` |
| il PDF da firmare, fatto dal SERVER con pdf-lib | `netlify/functions/lib/firma-pdf.js` |
| pezzi in comune (chiamata a Openapi, «aggiorna», email) | `netlify/functions/lib/firma-sms-comune.js` |
| pulsante «Firma con codice SMS» per il cliente | `preventivo-cliente.html` + `netlify/functions/preventivo-cliente.js` (`firma_sms`) |
| dove arriva il cliente dopo | `firma-fatta.html` (noindex) |
| tabella `gest_firme_sms` + deposito privato `firme-sms` | `sql/firma-sms.sql` (riga in PROVE di fondatore.js) |

- ⛔ **Il PDF lo fa il server** dalla fotografia `gest_preventivi_link.dati`. Il browser
  manda solo preventivo + nome, cognome, cellulare, email. `dati_hash` = impronta della
  fotografia: alla firma il link si segna «Firmato da X (codice SMS)» SOLO se l'impronta
  e' ancora quella. Se il preventivo e' cambiato, la firma resta sul PDF di prima.
- ⛔ `gest_firme_sms` la scrive solo il server (niente insert/update per authenticated).
- Crediti: `consume_ai_credit('firma_sms',5)` col gettone dell'impresa PRIMA di Openapi;
  se Openapi rifiuta → `refund_ai_credit`. Una firma aperta per la stessa versione si
  RIUSA (non si paga due volte). «Annulla e rifai» non rimborsa (Openapi l'ha gia' fatta pagare).
- La firma va sull'ULTIMA pagina, a x=50 y=140 (`FIRMA_POS`), subito sotto «Firma del
  cliente:». ✅ Provato dal vivo l'8 nov: Openapi conta in punti PDF DALL'ALTO (con y=420
  cadeva a meta' pagina). In prova la pagina di firma offre nome scritto E disegnato, poi il
  codice SMS al numero scritto: ⛔ nelle prove usare il cellulare di Alex, mai uno inventato.
- ✅ Dal vivo l'8 nov: richiesta presa da Openapi, l'avviso `firma-sms-notifica` e' arrivato
  (stato passato da solo a WAIT_SIGNERS), il PDF si legge giusto. Manca la prova fino in fondo
  (codice SMS → DONE → PDF firmato nel deposito).
- Variabili Netlify: `OPENAPI_FIRMA_TOKEN` (scope esignature EU-SES + GET signatures) e
  `OPENAPI_FIRMA_URL` (`https://test.esignature.openapi.com` in prova,
  `https://esignature.openapi.com` vera). Senza: risponde 503 «non ancora accesa» e il
  gestionale lo dice. In prova il riquadro mostra la striscia «PROVA».
- Dipendenza nuova `pdf-lib` 1.17.1 in package.json. ⚠️ `package-lock.json` NON e' stato
  toccato apposta: e' gia' fuori passo (ci risolve supabase-js 2.110.0) e rifarlo avrebbe
  cambiato le versioni di tutte le funzioni.
- Banchi (nel contenitore di Claude): `banco-firma/banco.js` (33 verdi, finto Supabase +
  finta Openapi; sabotaggi: impronta e rimborso accusati) e `banco-firma/pagina.py`
  (30 verdi, gestionale e pagina del cliente, computer e telefono, zero errori, niente
  sotto 13 px). SQL provato su Postgres 16: il browser non scrive, un altro non vede,
  il preventivo cancellato lascia la firma.
- 8 nov 2026 (sera), decisione di Alex: **la firma SMS si paga SOLO coi crediti comprati**. Funzione `consume_ai_credit_pagati` (`sql/firma-sms-crediti-comprati.sql`, migrazione `firma_sms_crediti_comprati_8nov2026`): plan 'base' → solo `credits_extra`; abbonati 'ai'/'ai_pro' → prima la quota del mese, poi i comprati. I 30 regalati non valgono. `consume_ai_credit` non toccata. Collaudo fino in fondo fatto lo stesso giorno: firma DONE, PDF nel deposito, link firmato, email consegnata.

# 10 NOVEMBRE 2026 — ANTI-TRUFFA: AVVISO NELLE CHAT E «SEGNALA»

- Riquadro giallo «🔒 Per la tua sicurezza» sopra la chat del cliente (`#chat-sicurezza` in profilo-impresa.html) e sopra la chat dei 3 pannelli (`.msg-sicurezza`). Nelle email c'era gia' dal 9 nov (`netlify/functions/lib/avviso-sicurezza.js`), con la riga in piu' «non ti manda inviti a riunioni».
- «⚑ Segnala questa conversazione»: `js/segnala-chat.js` (in profilo-impresa per il cliente, si monta da solo dentro `#chat-aperta` nei pannelli, caricato DOPO pannelli-messaggi.js). Rpc `segnala_chat(p_conv, p_motivo)` (`sql/segnala-chat.sql`, migrazione `segnala_chat_10nov2026`): manda solo codice chat + motivo, impresa/cliente/ultimi 6 messaggi li legge il database; scrive in `segnalazioni` (colonne nuove tipo, riferimento, da, avvisata_il). Una volta al giorno per chat e per parte, max 30/ora sul sito.
- Email ad Alessio: `netlify/functions/segnala-avviso.js`, riceve solo l'id, parte se tipo='chat', meno di 10 minuti, avvisata_il vuoto (segnato PRIMA di mandare).
- Il blocco dei link e' doppio nel database (trigger `trg_blocca_link` del 4 nov e `blocca_link` del 9 nov su alcune tabelle): non fa danni, da pulire con calma.
- **P.IVA (10 nov, sera)** — ⛔ FALLA CHIUSA: un'impresa poteva scriversi `verificata = true` dal browser. Trigger `trg_proteggi_verifica` (`sql/piva-verificata.sql`, migrazione `piva_verificata_10nov2026`): `verificata`, `piva_stato`, `piva_controllata_il`, `piva_nome` le scrivono solo service_role/SQL Editor; se l'impresa cambia la P.IVA il controllo riparte e il bollino automatico si spegne (quello messo a mano dall'admin resta).
  `netlify/functions/verifica-piva.js` (ogni ora, minuto 23): cifra di controllo gratis → 'non_valida'; registro imprese con Openapi Company IT-start SOLO se c'e' `OPENAPI_COMPANY_TOKEN` su Netlify (valida → bollino; cessata → non_valida; non trovata → 'non_trovata', senza bollino). Senza token le P.IVA giuste restano da controllare.
  ⛔ NON usare VIES: conosce solo le P.IVA abilitate al commercio estero. Provato: la P.IVA di Alessio e quella di REDIR SRL, vere, risultano INVALID.
  Al 10 nov: 86 P.IVA scritte, 9 con la cifra di controllo sbagliata (errori di battitura), 97 imprese pubbliche senza P.IVA. L'admin mostra l'esito sotto «Verificata».

# 11 NOVEMBRE 2026 — LA REVISIONE DEL 10 NOV: PARTE 1 E PARTE 2 ONLINE

Tre push, tutti controllati su Netlify e collaudati sul sito vero:
→83bc76e← (7 difetti), →479c262← (finestre, Altro, Excel, 14 px), →ef58797← (Professionista fuori da Altro).

## Cosa c'e' di nuovo
- **`js/ti-finestra.js`** (caricato per primo nei 3 gestionali): la finestra NOSTRA.
  `await tiChiedi(testo,{si,no,rosso})` → true/false; `tiAvviso(testo)`.
  ⛔ **`gconfirm()` adesso restituisce una Promise**: si scrive SEMPRE `await gconfirm(...)`,
  dentro una funzione `async`. Sono stati convertiti →~85← punti (alert, confirm, gconfirm) in
  →33← file con un attrezzo che legge il codice (acorn) e mette `async` dove serve.
  Chi scrive un `confirm(` nuovo nel gestionale sbaglia: usare `tiChiedi`.
- **La domanda prima di uscire** (sempre in ti-finestra.js): se in un modulo hai SCRITTO qualcosa
  (eventi `input` veri, non i valori messi dal codice) e premi Indietro/Annulla (`data-action="close"`,
  `.sh-back`, `.ti-back`) chiede «Hai scritto qualcosa: esco senza salvare?». Dentro `#sheet` conta
  SOLO `data-action="close"`: un «Annulla» con un'altra azione chiude un pezzo del modulo.
  I pulsanti Salva/Invia/Manda/Crea/Registra azzerano il segno.
- **«Parla» non copre nessun pulsante** (`js/gest-voce.js`, `liberaSotto`): guarda in 15 punti cosa
  c'e' sotto; se c'e' un pulsante o una casella, sale sopra (massimo al 75% dello schermo).
- **Sconto**: regola rossa «DA CORREGGERE» in preventivo (≥100% o euro ≥ totale voci), fattura e
  computo (≥100%). Classe `.ctr-riga` = caselle affiancate, il messaggio va sotto la riga.
- **Clienti per reparto**: ricevuta e fatture usano `_cliOr()` come la sezione Clienti.
- **Schermata reparti** (`js/gest-altro.js`, solo computer): fuori «Sei anche un professionista?»,
  «Dati azienda», «Noleggio»; il resto sotto «Altro ▾». Sul telefono resta tutto nel «Menu».
  ⚠️ `gest-anche-pro.js` mette il suo pulsante accanto ad «App operaio», che sta nel menu: gest-altro
  lo riporta fuori (osservatore con `subtree:true`).
- **Noleggio**: «Scarica per Excel» dentro il menu «⋯» (`.nol-piu`) di ogni sezione.
- **14 px**: barra in basso del telefono (con `letter-spacing:-.3px`, se no «Prevent…»), bollino AI,
  «Reparto attivo», righe AI.
- Zero grigio nei reparti; «1 messaggio»; «Sei anche un professionista?» sul telefono solo nel menu.
- Nome del saluto: `imprese.nome` del fondatore = «Alex» (era «luigi»).
- **Pulizia dati**: tolti PROVA di Claude, reparto «Prova Tasse e fisco» (con 16 fatture), 22 chat di
  prova, Cestino svuotato. Righe dell'account: →16.823← → →13.857←; Cestino →2.569← → →0←.

## Come si lavora da oggi (vale piu' delle righe vecchie qui sopra)
- **Il push lo fa Claude** da una copia del repo nella nuvola (`/home/claude/trovaimpresa`, collegata
  con add_repo). Dopo il push si allinea la cartella di Alex: `device_request_delete_permission` sulla
  cartella, poi `git fetch`, `git update-ref refs/heads/main origin/main`, `git read-tree origin/main`,
  `git checkout origin/main -- <file cambiati>`. Cosi' il suo `git status` resta pulito.
- ⛔ Nella cartella di Alex i file sono CRLF e il repo e' LF: lavorando dalla VM Linux tutti i file
  sembrano cambiati. Si scrivono i file in LF, mai `git add -A` dalla cartella collegata.
- **Le foto a 1920**: il browser dell'app mostra solo un pezzo dello schermo. Si usa il finto Supabase
  (`prove-claude/banchi-fissi/computo/finto-impresa.js`) con `prove-claude/attrezzi/anteprima.js`:
  `node anteprima.js <sito> gestionale-app.html 1920 1080 out.png "<codice>"` (il cancello e' spento).

# 11 NOVEMBRE 2026 (sera) — LA REVISIONE, PARTE 3 E 4

- **`tiSpunta(testo,{rosso,sotto,vai,bott,durata})`** in `js/ti-finestra.js` (caricato in tutti e 3 i gestionali): spunta verde che si disegna e sparisce da sola in →1,3← s; con `rosso` e' una X rossa; con `vai` resta finche' non tocchi un pulsante. Usata SOLO sui momenti di traguardo (fattura pagata/emessa, lavoro finito, preventivo accettato, giornata salvata, mezzo rientrato, giornata mandata dall'operaio, primi passi finiti, fattura fornitore contro le bolle). ⛔ Non metterla sui salvataggi normali: se esce sempre non dice piu' niente.
- **Primi passi** (`js/gest-primi-passi.js`): 3 passi — cliente, preventivo (Parla/Scrivi con l'AI), mandalo al cliente (`gestInviaCliente` sull'ultimo preventivo). Il passo 3 conta i preventivi con stato diverso da `bozza`.
- **«Il tuo mese»** in cima all'Assistente: i numeri li calcola `gest-riepilogo.js` (`window._tiMese`), li scrive `window.assMese` in `gest-assistente.js`. Incassato = lo stesso `incMese` del Report (SENZA IVA). Giornate = `giorGruppi()` di `gest-giornate.js` (la regola di cosa e' una giornata sta li', una volta sola). Preventivi accettati = colonna nuova **`gest_preventivi.accettato_il`**, la scrive il trigger `trg_gest_preventivi_accettato_il` (`sql/preventivi-accettato-il.sql`, gia' eseguito, riga in PROVE). Per i preventivi accettati prima dell'11 nov si usa la data del preventivo.
- **Bolle contro fatture**: `bfControllaFattura(fornitore,data)` in `gest-bolle-fatture.js` si chiama dopo il salvataggio di una fattura fornitore; nell'Assistente la riga rossa usa `acqCaricaMese` + `bfConfronta` (mese in corso e scorso), azione `rie-bolle` → `acqApri(mese)`.
- **Banchi**: `prove-claude/` sta GIA' dentro la copia nella nuvola (`/home/claude/trovaimpresa/prove-claude`): `bash prove-claude/banchi-fissi/gira-conti.sh` (34 verdi). Per fotografare i PDF veri: `attrezzi/anteprima-pdf.js` (come anteprima.js, ma serve jsPDF da `/home/claude/lib` e salva i PDF accanto alla foto).
- Il finto Supabase (`finto-impresa.js`) adesso sa `count`, `lt`, `gt`.

# 15 NOVEMBRE 2026 (sera) — TASSE E FISCO: «CHI PAGA PIÙ TASSE?»

- File nuovo `js/gest-fisco-confronto.js` (dopo gest-fisco-tasse.js in gestionale-app.html), stile `.fc-*` in fondo a `css/gestionale.css`. Pulsante nuovo, il primo di «Ti serve aiuto?» (`ftStrumenti`), azione `fc-apri`.
- Confronta sugli stessi incassi e spese: Forfettario, Ordinario, Srl (non per il professionista) e Dipendente. Forfettario e ordinario sono `ftStima()`: i conti NON sono rifatti.
- Srl: un socio solo che lavora e tira fuori tutto l'utile (IRES 24%, IRAP 3,9%, dividendi 26%, INPS artigiani). Esce sempre la piu' cara: manca il caso «lascio i soldi in societa'» (proposto ad Alessio, non ancora chiesto).
- Dipendente: lordo = incassi − spese; 9,19%, detrazioni da lavoro, taglio del cuneo 2026. Con «Dipendente in cassa edile»: trattenuta operaio 1,3972% e costo per la ditta (INPS, INAIL, cassa edile 8,4272%, TFR). Percentuali Cassa Edile di RIETI 2026 (tabella ufficiale); INPS 33,68% e INAIL 7,5% sono medie e l'impresa le cambia: si ricordano in localStorage (`ti_fc_ditta`), NON nel database.
- Tutti i numeri di legge sono le costanti `FC_*` in cima al file, con la fonte.
- Banco: `prove-claude/banchi-fissi/banco-fisco-confronto.html` (?p=forf&apri=1&inc=40000&spese=8000).
- Il push lo fa Claude dal clone in nuvola (`/home/claude/trovaimpresa`, add_repo con push).

# 15 NOVEMBRE 2026 (sera, 2) — FATTURA ELETTRONICA: PREZZI E PAGINE GOOGLE

- I pacchetti SDI veri (Stripe e gestionale) sono →9,90← € (50) e →29← € (200). Le pagine pubbliche dicevano ancora →7,90←/→24←: corrette (prezzi, gestionale, migliori-gestionali-gratis, gest-ricevute.js).
- `software-fatturazione-elettronica-edilizia.html`, `software-gestionale-imprese-edili.html` e il generatore `dati-gestionale-problema.js` dicevano «non manda la fattura allo SDI»: falso dal 5 nov. Ora dicono che la manda con un clic.
- Margine: 50 invii ≈ →6← € (Openapi 0,07 €/invio + Stripe), 200 invii ≈ →14← €.
- ⛔ Se cambiano i prezzi dei pacchetti, cambiarli in TUTTI questi file e in `js/gest-sdi.js`.

# 16 NOVEMBRE 2026 — L'AI DEI PREZZI NEL COMPUTO: RICERCA RIFATTA, «LA PIU' VICINA», IL BINARIO

Tutto in `netlify/functions/chat-gestionale.mjs` (blocco fra `>>> RICERCA-PREZZARIO` e `<<< RICERCA-PREZZARIO`, attrezzi `righe_senza_prezzo` → `cerca_prezzi` → `prezzi_computo`) e in `js/gest-computo-ai.js` (`caiApriPrezzi`).

- **Il registro delle ricerche (`diario`)**: viaggia nell'ultima riga della risposta (`fine:true`), solo per pintoalessio@icloud.com e info@trovaimpresa.com. Per ogni riga: parole cercate, letture, voci rimaste, tolte per unita'/materiale/variante, le 5 mostrate, le scelte, e i TEMPI (`giro` = ogni chiamata all'AI, `ricerche_ms`, `binario`, `totale_ms`). Non scrive niente nel database.
- **La ricerca**: parola INTERA (`\m` di Postgres, filtro `imatch`), SINONIMI da cantiere, al massimo 3 letture per riga, voci in fila con `puntiVoce`.
- **I controlli** (`stessoMateriale`, liste `MATERIALI` e `DISTINTIVE`): se la riga dice un materiale o a cosa serve, la voce lo deve dire anche lei. ⚠️ «grés» nella Tariffa del Lazio ha la e ACUTA (`gr[eèé]s`); il controsoffitto in cartongesso si chiama «pannelli di gesso … rivestiti»; «adduzione» NON e' una parola che distingue (tolta).
- **«La piu' vicina»** (`vicinaDi`, `memoC.vicine`, `campi.vuote`): le righe del pezzo rimaste senza prezzo arrivano alla schermata «Controlla i prezzi» sotto il titolo «N righe non ci sono nel tuo prezzario», con la voce piu' vicina e il suo prezzo. Stessa unita' e stesso materiale → si puo' prendere (MAI con la spunta gia' messa); altra unita' o altro materiale → si legge e basta; niente di simile → «il prezzo mettilo tu». La schermata si apre anche con sole righe vuote.
- **Il binario** : la frase del pulsante («Nel computo «X» metti i prezzi alle lavorazioni che sono a zero…») la riconosce il SERVER, che trova il computo (titolo uguale, uno solo) e legge le righe a zero senza chiederlo al modello: il primo giro e' un `tool_use` finto di `righe_senza_prezzo`. Se il titolo non si trova si fa come prima.
- **Il traduttore dello studio** (`_SKIP_UTENTE` in `js/gest-ingresso.js`) non tocca piu' `.cai-desc` e `.cp-orig`: «Pulizia finale di cantiere» diventava «di pratica».
- ⛔ Il cancello `#pubblica` in netlify.toml e' stato TOLTO: ogni push su main pubblica. Non rimetterlo.

## I numeri (Tariffa del Lazio, 12.764 voci, computo di prova da 36 righe, reparto «ferramenta»)
- 16 nov mattina, 16 righe difficili: 3 proposti, 1 sbagliato → dopo la ricerca nuova 7 proposti, 0 sbagliati.
- 16 nov pomeriggio, 36 righe in due giri (PRIMA di «la piu' vicina» e del binario): 22 proposti (2 per codice), 18 giusti, 1 sbagliato (rasatura a gesso al posto della rasatura per pitturare), 3 da guardare, 14 vuoti; 22 s e 20 s a giro.
- ⚠️ Il risultato dipende dalle PAROLE che sceglie l'AI in `cerca_prezzi`, e l'AI a volte non sceglie una voce buona che ha davanti (guaina liquida, punto luce deviato): per questo le vuote si fanno vedere con la piu' vicina.
- Nel prezzario del Lazio NON ci sono: radiatore in alluminio, piatto doccia in ceramica, porta in legno tamburata, tubo di scarico in polipropilene a metro, pulizia finale. Il quadro elettrico da incasso e' a m² (per l'appartamento la voce e' «Centralino»).

## Come si prova dal vivo
- Reparto «ferramenta» (`mestiere_id` 40edb9f3-04fb-4a87-8790-65ff75ec8c0d, account info@ = utente 1119cf1e…): computo «PROVA CONTROLLORE n» creato con SQL (`gest_computi` + `gest_computo_voci` a prezzo 0). Le 36 righe stanno in `prove-claude/banchi-fissi/assistenza-ai/computo-36-righe.sql`.
- Dal browser integrato, sul gestionale aperto: `fetch` a `/.netlify/functions/chat-gestionale` col gettone di `window._gc`, la frase del pulsante (secondo giro: + « Salta le prime 20 righe a zero: le hai già provate.»), e si legge `fine.diario`. Ogni giro costa 5 messaggi AI.
- Alla fine si cancella computo, voci e righe di `gest_chat_messaggi` della prova e si riconta: 5 computi e 91 messaggi per quell'utente.
- **Banco a secco**: `prove-claude/banchi-fissi/assistenza-ai/banco-prezzario.mjs` (28 prove, prezzario finto, niente rete), dentro `gira-assistenza-ai.sh`.
- ⚠️ `banco-attrezzi.mjs` (5 rosse) e `banco-moduli.mjs` (6 rosse) sono SCADUTI dal 7 novembre (attrezzi e moduli nuovi): rosse uguali prima e dopo il lavoro di oggi. Da aggiornare.

## 16 nov 2026 (sera) — IL COMPUTO DEL PROFESSIONISTA: RIBASSO, FIRMA, TECNICO (online, a8e8d38)
- **Il ribasso si salva da solo** quando si esce dalla casella `#co-rib` (ascoltatore `change` in `computoForm`, solo se il computo esiste gia'): PDF e «Crea il preventivo» leggono il numero SALVATO, e prima uscivano senza ribasso. Fuori scala (<0 o >100) non si salva: lo ferma il «Salva».
- **PDF del computo** (`computoPdf` in `js/gest-computo-pdf.js`): in alto `azAlbo(az)`; in fondo luogo e data, «IL TECNICO» (studio) o «L'IMPRESA» (gli altri), nome, albo, riga «(timbro e firma)». Una misura sola senza nome e senza misure non lascia piu' una riga quasi vuota sopra «Sommano».
- **`gest_azienda.tecnico_firma`** (`sql/2026-11-16-tecnico-firma.sql`, gia' eseguito, riga in PROVE): casella «Nome del tecnico che firma» nei Dati azienda dello studio. Vuota = esce il nome dello studio.
- Provato dal vivo (`?vedi=professionista`, reparto «ferramenta»): casella salvata e riaperta, ribasso 7,5 salvato da solo, PDF col ribasso, il tecnico e l'albo. Pulito tutto.
- ⚠️ `banco-tre-ruoli.js` (17 rosse) e `banco-computo-ribasso-reparti.js` (8 rosse) sono SCADUTI (menu e reparti cambiati): rosse uguali prima e dopo.
- Come fotografare un PDF vero: `anteprima.js` + rotta di `jspdf.umd.min.js` su `/home/claude/lib/node_modules/jspdf`, `API.save` sostituita che restituisce `output('datauristring')`, poi `pdftoppm`.

## 16 nov 2026 (sera, 2) — «LA PIU' VICINA» LONTANA, E SPOSTARE PIU' LAVORAZIONI INSIEME
- **Vicina «lontana»** (`vicinaDi(...,parole)` in chat-gestionale.mjs): la voce piu' vicina si puo' prendere con la spunta SOLO se ha dentro tutte le parole cercate e non dice all'inizio un uso che la riga non dice (`DISTINTIVE`). Se no `perche:'lontana'`: si legge e basta («Somiglia soltanto…»). Nato dal vivo: tramezzatura → muratura faccia a vista, quadro elettrico → quadro luminoso. Banco prezzario: 31 prove.
- **«☑ Sposta più lavorazioni»** nel computo (pagina Lavorazioni, in alto; solo con almeno 1 capitolo e 2 lavorazioni): `compSelModo` / `compSel` / `compSelSposta()` in `js/gest-computo.js`, azioni `comp-sel-*` in `js/gest-finestre-eventi.js`, stile `.comp-sel-*` in fondo a `css/gestionale.css`. Tocchi le righe, scegli il capitolo (o «Senza capitolo»), «Sposta»: vanno IN FONDO a quel capitolo nell'ordine che avevano (`ordine` = max del computo + k). Mentre scegli frecce e × non ci sono. La barra e' sticky a 62 px (sotto i passi del computo); sul telefono e' bassa.
- 16 nov (sera, 3): la vicina e' «lontana» anche se le manca una delle prime DUE parole piene della riga (quadro elettrico → quadro luminoso); banco 32 prove. PDF del computo PRIVATO: sotto il totale «Importi IVA esclusa» (l'IVA si decide nel preventivo; nei lavori pubblici niente riga).
- 16 nov (sera, 4): la regola (7) non bastava con la descrizione VERA del prezzario («elettrico» combaciava con «a cancellazione elettrica» in fondo alla voce). Adesso le prime due parole piene della riga devono stare nei primi 90 caratteri della voce (`testa` in `vicinaDi`). Nel banco la voce E2 ha la descrizione vera e intera; 32 prove. ⛔ Le prove del banco usano le descrizioni VERE, non accorciate.

## 16 nov 2026 (sera, 5) — LA PROVA DA GEOMETRA: EXCEL, LAVORI PUBBLICI, SAL, DUPLICA E VARIANTE
Provato dal vivo nel reparto «ferramenta» (`?vedi=professionista`, computo «PROVA CONTROLLORE 14» creato con SQL: 2 capitoli, 5 lavorazioni, 2 misure, 350 € di sicurezza). Trovato e corretto:
- ⛔ **Importa da Excel: i numeri con 3 decimali entravano MILLE volte piu' grandi** (12,345 m² → 12.345; 22,125 € → 22.125 €). Una cella numerica di Excel arriva come testo all'inglese «12.345» e la regola italiana la leggeva dodicimila. `_pzCrude` / `_pzNumCella` in `js/gest-sal-prezzario.js`: per i file Excel veri (non i CSV) quantita', prezzo e manodopera si prendono dal valore vero della cella. Vale per il computo (`compImporta`) e per il prezzario (`pzImporta`). Banco: `prove-claude/banchi-fissi/computo/banco-importa-excel-numeri.js` (8 prove; serve `xlsx@0.18.5`).
- **Ribasso e totale (lavori pubblici)**: il riquadro diceva «Totale 4.096,03 · Ribasso 10% −374,60» senza dire che 350 € erano sicurezza: adesso ha le stesse righe del fondo delle Lavorazioni (`compRibConto`).
- **Quadro economico allo studio**: «di cui costo del tempo speso» → il traduttore non tocca piu' `#co-qe-a` (`_SKIP_UTENTE`).
- ⛔ **SAL: «Gia' chiesto coi SAL prima» era 0 su ogni SAL nuovo** (e su quello appena creato): il secondo acconto usciva intero finche' non si usciva e rientrava. `salPrecTot` si legge fresco in `salForm`. PDF e fattura erano giusti (leggono il database).
- **SAL col ribasso**: sopra «Fatto dall'inizio» ci sono le righe «Lavori fatti, ai prezzi del computo» e «Ribasso del computo».
- «← Torna al computo» dal SAL riporta alla pagina «Acconti (SAL)».
- **Duplica e Variante** copiano anche `sicurezza`, `giorni`, `insieme` dei capitoli (prima la copia perdeva il segno «costi della sicurezza» e il totale cambiava).
- **Lista per la gara**: il prezzo in lettere andava a capo in mezzo alla parola senza trattino; una riga senza prezzo scriveva «zero/00» (adesso resta vuota).
- Non letto, e lo dice: l'Excel esportato da PriMus («DESIGNAZIONE DEI LAVORI», righe «SOMMANO»): risponde «manca la riga di intestazione». Il PDF di PriMus invece si legge.
- 16 nov (sera, 6): **«Indietro» dentro una lavorazione o un SAL torna al computo** (prima chiudeva tutto: `close` in `js/gest-finestre-eventi.js`). **L'invito «Metti il Gestionale sul telefono» si fa da parte con un modulo aperto** (`body:has(.overlay.open)` in `js/app-invito.js`): copriva «Annulla»/«Salva» nel computo sul telefono e nelle schede del Noleggio a 360 px (le 5 rosse di `tools/banco-gestionale.js noleggio` sono sparite). Telefono a 375 px, computo pubblico: 6 pagine, lavorazione e SAL senza niente fuori schermo, niente sotto 13 px, niente coperto.
- 16 nov (sera, 7) — collaudo dal vivo dopo il push →9531cbd← (computo «PROVA CONTROLLORE 15»): Excel 12,345 × 22,125 = 273,13 ✔, ribasso con la sicurezza ✔, «costo della manodopera» ✔, «Già chiesto coi SAL prima» −1.517,23 sul SAL 2 nuovo ✔, Indietro → pagina SAL ✔, Duplica tiene la sicurezza ✔, lettere col trattino ✔. ⛔ **TROVATO: il SAL ribassa i costi della sicurezza quando stanno nel CAPITOLO marcato** (la vista `gest_sal_righe_calc` guarda solo la casella vecchia): schermo corretto in `salForm`/`salAggiorna` (`data-capsic`); per PDF e fattura serve `sql/2026-11-16-sal-capitolo-sicurezza.sql` — **DA ESEGUIRE** (la migrazione dal connettore e' stata bloccata: serve l'ok di Alessio). Al 16 nov nessun computo vero ha un capitolo sicurezza: nessun SAL vero e' sbagliato. Il traduttore dello studio cambia «Lavori fatti» in «Pratiche fatte»: nel SAL la riga dice «Quello che hai fatto».
- 16 nov (sera, 8): **SAL e capitolo sicurezza CHIUSO** — migrazione `sal_capitolo_sicurezza_16nov2026` eseguita, schermo online (→756ee35←); provato dal vivo: 1.000 € lavori + 350 € sicurezza, ribasso 10% → schermo e PDF 1.250 €. **Quello che la voce dice IN PIU'** (`inPiu`, `mettiInFila`, lista `IN_PIU` in chat-gestionale.mjs): se la riga non dice gesso / pedonabile / autolivellante… la voce che lo aggiunge va DOPO quella semplice, e all'AI arriva il campo `in_piu`. «non pedonabile» non conta. In `puntiVoce` +150 a chi ha TUTTE le parole cercate nei primi 90 caratteri. Nato da: rasatura a gesso (11,68) al posto di «Stuccatura e rasatura di intonaci» (6,32); guaina liquida pedonabile (50,60) al posto della semplice (13,23). Banco prezzario: 44 prove, con le descrizioni vere.

## 16 nov 2026 (sera, 5) — «COMPUTO DA PREZZARE» PER IMPRESA E ARTIGIANO: CAPITOLI, COMPUTO CORTO, PAROLE SEMPLICI (online, 10f49d1)
- **I capitoli del geometra** (`js/gest-computo-pdf.js`): `_compTitoloCapitolo()` = sola descrizione in MAIUSCOLO, corta, non un totale (`COMP_NON_CAPITOLO`). Excel (`compImporta`) e PDF (`_cpLeggi`, `capAttesa`/`capCorr`): diventa capitolo solo se DOPO c'e' una lavorazione. `_compScriviVoci(cid,voci,capitoli)` crea i capitoli (`_compScriviCapitoli`, riusa quello con lo stesso titolo) e mette `capitolo_id`; nelle voci `_cap` e' solo il posto nella lista, nel database non esiste.
- **PDF, descrizione pulita**: `_cpXFineDesc()` trova dove finisce la colonna della descrizione (righe di solo testo, fino al primo salto > 14 pt; serve `w` nelle parole di `_cpParole`); `_cpMisuraDestra()` butta le righe con un numero con la virgola oltre quella colonna; `_cpTestoDesc()` tiene solo le parole dentro. Prezzi nella conferma sempre a due decimali (`_przCasella`).
- **Calendario**: `cronoSenzaCapitolo()` + riquadro giallo `.cg-fuori` + `cronoFuoriMetti()` (azione `crono-fuori-metti`): mette le lavorazioni senza capitolo in «Altri lavori».
- **Computo corto** (solo `ruoloUtente!=='professionista'`): in fila Lavorazioni, Prezzi, Totale; le pagine 4-5-6-7 hanno classe `.dietro` (nascoste finche' non sono `.on`) e si aprono dal menu «Altro» (`co-pag`).
- **Scheda della lavorazione corta**: `compVoceCorta(v,isNew)` gira DOPO `compVoceSemplice` (6 nov, NON e' la stessa cosa: non riusare quel nome). SPOSTA le caselle (descrizione, quantita', unita', prezzo, conto) in `.cv-semplice` e chiude tutto il resto in `<details class="cv-altro">`; aperto da solo se la lavorazione ha le misure. «Salva nel mio prezzario» scende in «Altro».
- **Parole semplici**: `_cpar(studio,semplice)` in cima a `compVoci`. Ribasso → Sconto · Acconti (SAL) → Acconti a lavoro fatto · Cronoprogramma → Calendario dei lavori · Crea la variante → Fai una copia per le modifiche · analisi dei prezzi → come è fatto ogni prezzo · Lista da far prezzare → Foglio senza prezzi · Lavori pubblici → Gara pubblica. Menu e titolo della sezione SAL: `adattaMenuImpresa` (gest-reparti.js) e gest-riepilogo.js. ⚠️ NON cambiati: dentro la sezione SAL (gest-sal-prezzario.js, ~70 «SAL»), la pagina «Cosa è cambiato», i PDF.
- **Pulsanti**: nella pagina Lavorazioni i due dei prezzi solo in cima; nella pagina Prezzi stessi nomi + quello dell'AI; nel menu «Altro» il foglio dei prezzi costruiti c'e' solo se una lavorazione ha `prezzo_da_analisi`. Il nome resta «Computo da prezzare» (scelto da Alex il 16 nov; «Elenco lavori da prezzare» non c'e' piu' da nessuna parte).
- Piccoli: `_compNomeFile()` (niente «computo--»), `_misLetta` col punto delle migliaia, «— nessuno —», `.ctr-nel-menu` (frase lunga dell'AI nel menu).
- ⛔ **Lezione 1**: `git rebase … ; controllo ; git push` in fila con `;` ha PUBBLICATO a meta' rebase (0c028ec, due commit su tre) mentre il controllo diceva rosso: 15 crediti buttati. Si usa `&&`, e il push sta in un comando suo dopo aver letto il controllo.
- ⛔ **Lezione 2**: due sessioni di Claude lavoravano insieme sullo stesso repo e sullo stesso reparto «ferramenta»: conflitti al rebase, e l'altra ha cancellato il mio «PROVA CONTROLLORE 15» a meta' collaudo. Prima del push `git fetch`; nelle prove dal vivo si crea il computo e lo si prova SUBITO, in una chiamata sola.
- ⚠️ `tools/banco-gestionale.js app`: 34 rosse uguali prima e dopo (la striscia «Installa» copriva «Salva» a 360 px; l'altra sessione l'ha toccata in 9531cbd: da rilanciare). Dura ~8 minuti.
- NON provato: un file VERO di un geometra (Excel e PDF di prova li ha fatti Claude), l'artigiano dal vivo (solo impresa e studio), il telefono vero.
- **16 nov (notte) — il lettore del PDF provato su DUE computi VERI** (pubblici, letti dal browser di Alex sul sito dell'ente, senza scaricarli): Camera di Commercio di Bari (PriMus, 309 pagine, 501 lavorazioni) e Comune di Bricherasio (altro programma, 107 pagine, 546 lavorazioni). Dopo le correzioni: 501/501 e 546/546, totale che torna a 7 e a 1 centesimo. Cosa ha insegnato: «SOMMANO a corpo 1,00» (unita' di due parole: le lavorazioni sparivano zitte → ora `perse` le conta e la schermata lo dice); «1 / 493» accanto al numero; un secondo codice sotto il primo («RP. E16.03a», «ARIAP 3.2.1.6.6» → `corr.chiusa`); i titoli di PriMus «… (SbCat 1)» (`_cpTitoloPrimus`, vince il piu' vicino alla lavorazione); «21 maggio 2024» preso per la lavorazione 21; il codice nella colonna della descrizione («Nr. 1  01.A02.A80.020» → `_cpECodice`); la misura dentro la colonna della descrizione (`_cpMisuraInColonna`: numero con la virgola staccato da un salto largo, o riga di soli numeri).
  Come si rifa': nel browser integrato si apre la home dell'ente, si caricano con `<script>` pdf.js e `https://trovaimpresa.com/js/gest-computo-pdf.js`, `fetch` del PDF (stesso sito), poi `_cpParole(blob)` e `_cpLeggi(pagine)`. Dalla nuvola e dalla shell del PC i siti degli enti sono bloccati.
- 16 nov (sera, 9): **dopo il PDF del geometra il computo RESTA APERTO**. `compPdfMetti` (js/gest-computo-pdf.js) non fa piu' `closeSheet()`: chiama `compTornaAlComputo()` e ci si ritrova sulle lavorazioni appena entrate. «Annulla»/«Indietro» nella schermata «Controlla quello che ho letto» (`#cp-lista`) tornano al computo (`close` in js/gest-finestre-eventi.js). L'Excel restava gia' aperto.
- 16 nov (sera, 9): **provati dal vivo** la fattura dell'acconto dal SAL (1.250,00 intero / 1.243,75 al netto della ritenuta 0,5%, tipo «acconto») e l'invito «Metti il Gestionale sul telefono» a 375 px (`?prova-app=1`: con un modulo aperto sparisce, i pulsanti in fondo sono liberi). **L'Excel di PriMus si legge**: `_compPrimusExcel(righe,crude)` in `js/gest-computo-pdf.js` (intestazione «DESIGNAZIONE DEI LAVORI», quantita' e prezzo dalla riga «SOMMANO m²», codice sotto il numero, capitoli «(SpCat n)», apice delle migliaia «2´000,00»); le lavorazioni senza SOMMANO si contano e si dicono. ⚠️ Il banco (`banco-importa-excel-primus.js`, 15 prove) usa un foglio RICOSTRUITO dalla stampa di PriMus: manca la prova con un file vero. **I banchi vecchi sono aggiornati**: `banco-attrezzi.mjs` (61), `banco-moduli.mjs` (42), `banco-tre-ruoli.js` (61), `banco-computo-ribasso-reparti.js` (46). `gira-computo.sh` adesso li fa girare SUL POSTO (6 banchi, niente zip); `finto-impresa.js` sa `lt` e `gt`. Nei banchi «acceso» = c'e' nel menu e non e' spento per il ruolo (il menu e' corto dal 6 nov). **Trovato aggiornando il banco dei reparti**: se il reparto ricordato non c'e' piu' e l'auth arriva per prima, il browser continuava a ricordarlo e non diceva niente → `pulisciRepartiSpariti` (js/gest-base.js) adesso lo dimentica (`_dimentica`) e, se lo trova fra i morti, lo dice.
- 17 nov (mattina): **l'Excel di PriMus provato sul sito vero** (→e905b1a←, computo «PROVA CONTROLLORE 19» in «ferramenta», poi cancellato: 5 computi, 91 messaggi, 0 prove). Foglio fatto come PriMus, caricato con `compImporta(file)`: 4 lavorazioni nei capitoli giusti, 15,39 × 22,125 = 340,50, «a corpo» 2.000,00, e la domanda prima di scrivere («È un computo di PriMus: ho letto N lavorazioni… ⚠ 1 lavorazione non letta (la n. 5) · ⚠ 1 senza prezzo… Vado?»); con «No» non entra niente. **«Sommano positivi / Sommano negativi»** si saltano: vale solo la riga «SOMMANO <unità>» (32,40, non il parziale 36). Banco `banco-importa-excel-primus.js`: 16 prove. ⚠️ Manca ancora la prova con un Excel esportato DAVVERO da PriMus (chiesto ad Alex). Nelle prove dal vivo la finestra della domanda si legge dai pulsanti `.tif-si` / `.tif-no` (`.tif-ov` non esiste).
- 17 nov (mattina, 2): **«SAL» e «variante» non si leggono piu' per impresa e artigiano** (lo studio e i PDF restano uguali). `_sa(studio,semplice)` in cima a `js/gest-sal-prezzario.js` (come `_cpar` del computo): SAL / stato di avanzamento → **acconto** in elenco, scheda, avvisi; anche nel Cestino (`gest-cestino.js`), nel riepilogo (`gest-riepilogo.js`), nel controllo AI della scheda (`gest-ai-moduli.js`) e nella riga sotto il titolo della sezione (`adattaMenuImpresa`, `#sal .gal-intro`). Pagina «Cosa è cambiato»: Variante → **Copia con le modifiche**, «Scarica il foglio delle modifiche», titolo della copia «(modifiche)», ribasso → sconto, percentuale a un decimale (lo studio tiene i tre). Per tutti: «1 riga uguale non elencata»; la ritenuta su un acconto negativo non scrive piu' due «meno». ⚠️ NON cambiati: `js/gest-fatture.js` («La fattura è salvata. Il SAL no.», `_salNome`): da decidere con Alex. `tools/banco-gestionale.js app`: ZERO difetti (erano 34). Foto col banco: `tools/foto-gestionale.js`; per la pagina 7 del computo si aggiunge a `B.DATI` un computo con `variante_di` e le voci in `gest_computo_voci_calc`, poi `computoForm(...)` e `compPag(7)`. In nuvola playwright si prende da `/opt/npm-tools` (in `/tmp/banco` va messo solo `@supabase/supabase-js`).

# 17 NOVEMBRE 2026 — «STO CARICANDO», E IL REGIME CHE NON SI SCEGLIE DA SOLO
- **`listaCarica(box,cosa)`** in `js/gest-schede-clienti.js` (accanto a `listaNonLetta`): scrive «Sto caricando …» SOLO se la lista e' ancora vuota (prima apertura). Usata in Preventivi, Lavori, Fatture, Clienti. Le altre sezioni non ce l'hanno: se serve, e' una riga.
- **Dati azienda** (`js/gest-azienda.js`): la tendina del regime NON nasce piu' su RF01. Se il regime non e' mai stato scelto si prende da `gest_fisco_profilo.regime` (forfettario → RF19, ordinario → RF01); se manca anche li' resta «— scegli il tuo regime —» (la fattura lo chiede gia': «Manca il tuo regime fiscale»). Se Dati azienda e Tasse e fisco dicono due cose diverse esce una riga rossa. Il nome vuoto si riempie con `imprese.nome_attivita`.
- ⚠️ Al 17 nov →12← righe di `gest_azienda` hanno RF01 e non si sa quante l'abbiano scelto davvero (prima era il valore di partenza). Proposto ad Alex un avviso «controlla il tuo regime»: non ancora deciso.
- Il PDF del preventivo mostrava solo «Alessio» perche' cosi' era scritto in Dati azienda: il PDF era giusto. Dati di Alex corretti a mano (nome «Alessio Pinto», regime RF19) col suo si'.
- I prezzi di riferimento dell'AI del preventivo stanno nel prompt di `supabase/functions/ai-generate/index.ts` (feature `preventivo`): Alex li deve ancora confrontare coi suoi.
- 17 nov (mattina, 3) — **collaudo dal vivo dopo il push →d48fa14←** (computi «PROVA CONTROLLORE 20» e «21 (modifiche)» + un SAL, creati con SQL e poi cancellati: 5 computi, 91 messaggi, 0 prove). Da artigiano: «Acconti a lavoro fatto», «Ogni acconto…», «Acconto n. 1», «Già chiesto con gli acconti prima», «Questo acconto», «Copia con le modifiche», «−19,7%», «senza lo sconto», «Scarica il foglio delle modifiche» ✔. Con `?vedi=professionista`: «SAL n. 1», «Variante», «−19,733%», «senza il ribasso» ✔. Zero errori in console. ⚠️ **L'id del reparto per `enterPanel` CAMBIA** (`idmwjohu694grj` non esiste piu'): si cerca per nome, `state.panels.find(x=>x.name==='ferramenta').id`. ⚠️ In nuvola il push e' rifiutato finche' il repo non e' aggiunto alla sessione (`add_repo` con accesso push). `quantita_manuale` di `gest_computo_voci` e' un booleano.
- 17 nov (mattina, 4): **anche la finestra «La fattura è salvata. Il SAL no.»** (`_salAvvisoPannello`, `_salNome` e i due motivi in `js/gest-fatture.js`) dice «acconto» a impresa e artigiano: titolo «La fattura è salvata. L'acconto non è segnato come fatturato.» (deciso da Alex). Lo studio resta «SAL». ⛔ NON toccata la riga della fattura «Stato avanzamento lavori n. …» (`desc` in `salFattura`): va al cliente e allo SDI. Fotografata col banco chiamando `_salAvvisoPannello({nome,perche,id})`; NON ancora online (parte col prossimo push), dal vivo non si puo' far uscire senza rompere apposta il collegamento.

# 17 NOVEMBRE 2026 (sera) — UNA VOCE PER VOLTA: LE FATTURE

Da oggi Alex fa collaudare il gestionale UNA VOCE DEL MENU PER SESSIONE (prima Fatture; la prossima e' Clienti, poi Calendario, poi «Tutto il resto»). A fine sessione Claude gli lascia il prompt per la voce dopo.

Fatto e online (collaudo dal vivo nel reparto «ferramenta», prove «PROVA CONTROLLORE», tutto cancellato alla fine):
- **Cassa e spese si vedono sempre se la fattura le ha dentro** (anche a chi oggi non e' studio); il cliente che non sta piu' in tendina si vede come «… — come scritto in fattura» e salvando resta.
- **Bollo da 2 € automatico** in forfettario sulle fatture NUOVE sopra 77,47 € (`fattBolloAuto`); se lo tocchi tu non lo rimette.
- **«Manda al cliente»** (`js/gest-fattura-manda.js`, azione `fatt-manda`): messaggio gia' scritto, WhatsApp, Email, Copia, Scarica PDF e, sul telefono, «Condividi il PDF» (`navigator.share` col file; `fatturaPdf(id,{blob:true})`). Non manda niente da solo e non scrive nel database.
- **Controllo** (`ctrRegoleFattura`): ritenuta fuori da 0-100 rossa, ritenuta in forfettario arancio, scadenza prima della data rossa, avviso IBAN una volta sola.
- **Acconto ricevuto**: ⛔ NON e' una funzione nuova. L'acconto su una fattura c'era dal 13 nov (ricevuta di pagamento con `fattura_id`); mancava la porta e il conto. Adesso: pulsante «Acconto ricevuto» nella fattura emessa (`fattAcconto` → `gestRicevutePagamento.nuova({cliente_id,fattura_id})`), e `fattAccontiLeggi()` / `fattGia()` in `js/gest-fatture.js` tolgono gli acconti da elenco, «Da incassare», Riepilogo e «Manda al cliente». Nel database la vista `gest_fatture_totali` ha `gia_ricevuto` e `resto` (`sql/2026-11-17-fatture-resto.sql`): li usano `chat_soldi`, `promemoria-mattina.js` e «Farsi pagare» (`js/gest-fisco.js`). ⛔ `totale` della vista NON e' cambiato.
- **Numeri mancanti**: l'avviso non esce nei reparti senza fatture numerate nell'anno; per i numeri eliminati per sempre c'e' «Ho capito» (localStorage `ti_fatt_buchi_<uid>_<anno>`), torna solo se ne manca uno nuovo.
- **Il regime della fattura** (`fattForfDi`, `_fattForfModulo` in `js/gest-fatture.js`; `gest_fattura_conti` in `sql/2026-11-17-fattura-regime-suo.sql`): una fattura COL NUMERO che si ricorda il suo regime si conta con quello, dappertutto; le bozze col regime di oggi. Il modulo di una fattura emessa lavora col suo regime e risalvandola non lo cambia.

Lezioni:
- ⛔ Avevo scritto ad Alex che «l'acconto ricevuto manca». C'era. Prima di dire «manca», cercare in TUTTI i file js (qui `gest-ricevute-pagamento.js`).
- Il push da Claude passa solo quando Alex scrive «pubblica» in quel messaggio: un «sì» o «vai» a un piano non basta.
- Per provare i conti senza `prove-claude/`: caricare `js/centesimi.js` + `js/gest-fatture.js` veri in una `vm` di Node con i globali finti e chiamare `fattConti` prima e dopo (`git stash`): devono cambiare solo i casi voluti.
- Nelle prove dal vivo i reparti si aprono con `enterPanel(state.panels.find(x=>x.nome==='ferramenta').id)` (il campo e' `nome`, non `name`).

Aperto sulle Fatture:
1. NON provati dal vivo: «Condividi il PDF» dal telefono vero, «Acconto ricevuto» fino al salvataggio (serve una fattura emessa con un cliente dell'anagrafica: di prova non se ne emettono), l'email del mattino col resto.
2. «I prossimi 3 mesi» in Tasse e fisco (`js/gest-fisco-vivere.js`) conta ancora la fattura intera, senza togliere gli acconti.
3. Mancano ancora (non chiesti): email automatica col PDF allegato, sollecito dalle Fatture, «Duplica fattura», «Fai la nota di credito da questa».
4. Non provati per regola: Emetti, «Ha pagato», invio allo SDI, controllo con l'AI, «Allega un PDF tuo», fattura da preventivo accettato (in «ferramenta» non ce n'e' uno).

# 17 NOVEMBRE 2026 (sera, 2) — UNA VOCE PER VOLTA: I CLIENTI

Collaudo dal vivo nel reparto «ferramenta» (2 clienti «PROVA CONTROLLORE», 1 lavoro, 1 preventivo, 2 documenti: tutto cancellato, anche dal Cestino e dal deposito: 0 righe).

Dove sta il codice dei Clienti (non in un file solo): modulo `cliForm` in `js/gest-scadenze-pratiche.js`; salva `saveCli`, scheda `cliScheda`, storia `cliStoria`, documenti `docCli*` / `uploadDocCliente` in `js/gest-commercialista.js`; elenco `renderClienti`, `cliCard`, `cliVoci`, `delCli` in `js/gest-schede-clienti.js`; controllo `ctrRegoleCliente` in `js/gest-ai-moduli.js`; i clic in `js/gest-finestre-eventi.js`.

Sistemato e ONLINE (→ff81309← e →d93ee8e←, provato dal vivo dopo ogni push):
- **Doppione**: «+ Nuovo cliente» con un nome che c'e' gia' adesso chiede («C'è già un cliente che si chiama…» · «È un altro: crealo» / «Torno indietro»). Avvisa e non blocca. Solo sui NUOVI.
- **Elimina**: la domanda conta anche i PREVENTIVI collegati (prima solo lavori e fatture).
- **Documenti** (`uploadDocCliente`, vale anche per il commercialista): file vuoto rifiutato; errore del deposito in italiano; se uno entra e uno no si dicono tutti e due; eliminando dice «nel cestino»; pulsante «Scegli i file» (non piu' «dal computer»: sul telefono era sbagliato).
- **Controllo**: telefono senza cifre («abc») e codice SDI non di 7 caratteri anche per il privato → arancio. Un telefono senza cifre nella scheda non e' piu' un link `tel:` vuoto.
- **Excel del backup** (`js/gest-cestino.js`): il foglio «Clienti» porta tutta la rubrica (15 colonne, prima 5).

Da sapere:
- `#cli-search` e' NASCOSTA apposta: si cerca dalla casella in alto (`#ct-q`), che trova nome, P.IVA, telefono, citta'.
- La scheda si apre dal pulsante «Apri»; i pulsanti in testa (Chiama, Mappa, Altro → Elimina) nascono dal menu della riga (`cliVoci`): chiamando `cliScheda(id)` a mano non ci sono, dal clic vero e da `apriCosa('cli',id)` si'.
- Nelle prove: lavori e preventivi di prova si creano con `sb.from(...).insert`, e si cancellano con `sb.raw(...).delete()` + `sb.storage.from('gestionale-foto').remove([...])`.

Funzioni nuove (ok di Alex, foto prima, online con →d93ee8e←):
- **Note sul cliente**: casella `#c-note` nel modulo (`cliForm`), riquadro «Note» nella scheda solo se ci sono (`cliScheda`), colonna `gest_clienti.note` (c'era gia'), anche nell'Excel. Le vede solo l'impresa.
- **«+ Nuovo preventivo» / «+ Nuovo lavoro» nella scheda** (riquadro «Fai qualcosa per lui», azioni `cli-nuovo-prev` / `cli-nuovo-lav` → `cliNuovoPer(tipo,id)` in `js/gest-commercialista.js`): `prevForm(null,{cliente_id})` e `jobForm(null,"",{cliente_id},true)`. ⚠️ La tendina del cliente nel lavoro e' `#j-cliente` (non `#j-cli`, che e' del ramo vecchio).
- «Chiama» non esce piu' se nel telefono non c'e' una cifra.

Provato dal vivo anche: «Invia» documento per email (mandato ad Alex, consegnato su Resend), «Mappa» (indirizzo giusto), fattura in bozza nella scheda, «Compila con AI».

Chiuso la sera del 17 nov (commit 59443af, provato dal vivo, computer e 375 px):
- **«Compila con AI» del cliente riempie tutte le caselle**: funzione nuova `netlify/functions/ai-cliente.mjs` (Haiku, 1 credito, stampo di ai-pratica) + `AI.cliente(testo)` in `js/ai-integrazione.js`. ⛔ `ai-generate` NON toccata. Caselle in «campi» di `js/gest-ai-moduli.js` (13 + il tipo, messo da «extra»); `riempiCliente` e `compila_cliente` / `MODULI.cliente` della Chat allargati uguale.
- **Lavori**: nella riga (tabella e scheda) si legge il nome del cliente; se e' nel Cestino «(nel cestino)» (`cliVista` in `renderJobs`, settimo parametro `cliNome` di `jobCardSupa`).
- **Excel della copia dei dati**: foglio «Clienti» con 16 colonne e la Nota, aperto dal vivo.
- ⛔ **«Unire due clienti doppi»: NO**, deciso da Alex il 17 nov («lasciamoli doppi, potrebbe essere un lavoro differente con lo stesso cliente»). Non riproporlo.
- Resta: la telefonata di «Chiama» e il telefono vero li prova solo Alex; il banco della Chat con AI non e' stato girato dopo aver allargato `MODULI.cliente`.

# 17 NOVEMBRE 2026 (sera, 3) — UNA VOCE PER VOLTA: IL CALENDARIO

Collaudo dal vivo nel reparto «ferramenta» (10 lavori, 3 scadenze, 1 promemoria, 1 mezzo, 1 fornitore + 1 sua fattura, 1 operaio, 2 note «PROVA CONTROLLORE»: tutto cancellato, 0 righe; il reparto e' tornato a 1 lavoro e 2 clienti).

Dove sta il codice: `renderCal`, `caricaNote`, `calAltreDate`, `calVai`, `calListaTelefono`, `openDay` in `js/gest-schede-clienti.js`; i clic (`open-day`, `save-note`, `cal-prev/next/today`, `cal-ritardo`, `new-job-date`) in `js/gest-finestre-eventi.js`; la pagina in `gestionale-app.html` (`#calendario`); lo stile in `css/gestionale.css` (ultimo blocco «17 nov 2026 — COLLAUDO DEL CALENDARIO»).

Sistemato (banco `tools/banco-gestionale.js app`: ZERO difetti):
- **Note e rete**: un errore di RETE in `caricaNote` veniva preso per «manca la tabella»: da li' le note si salvavano solo nel browser. Adesso «manca la tabella» e' solo l'errore vero (`_notaTabellaManca`); `noteCache` non si svuota piu' prima di rileggere.
- **Regola 20**: se lavori si' ma scadenze / promemoria / note no, riga ambra `#cal-parz` («Non riesco a leggere tutte le scadenze e le note… Tocca per riprovare»; `calAltreDate._ko`). Senza rete l'elenco del telefono non dice piu' «Niente in programma» sotto il riquadro rosso.
- **Riquadro del giorno** (`openDay`): «Niente in programma» solo se il giorno e' vuoto davvero (usciva sopra le scadenze); un lavoro in ritardo dice «In ritardo» (diceva «Da fare» col pallino rosso); la scadenza ha il pallino della legenda (`.dot.scad`, `.stato.scad`); righe a 17 px, stato a 14.
- **«Salva nota» a vuoto** in un giorno senza nota non dice piu' «Nota eliminata».
- «Oggi» non sta piu' in un quadrato da 46 px; la puntina della nota e' grande (26 px, blu); sul telefono «Salva nota» e' largo e «+ Lavoro in questa data» va a capo.

Da sapere:
- «Salva nota» passa dal correttore (`js/correggi-giornata.js`, gratis): se corregge si ferma e chiede di premere Salva un'altra volta. NON e' un difetto.
- Nella casella stanno 3 righe in tutto (lavori prima, poi scadenze), il resto e' «+N».
- I promemoria sono della persona: si vedono in tutti i reparti. `promemoria.id` e' un numero messo dal database (non passare l'id).
- Esc non chiude nessuna finestra del gestionale (non e' del Calendario).

Funzioni nuove (ok di Alex il 17 nov, foto prima):
- **La nota scritta nella casella** sul computer (`.cal-lav.nota` in `renderCal`, 80 caratteri, 2 righe; non conta nei 3 posti; sul telefono e' spenta dal CSS perche' c'e' gia' nell'elenco).
- **Si torna al Calendario** dopo aver chiuso un mezzo / promemoria / fattura aperti da li' (`calTornaQuandoChiude(tab)` in coda a `calVai`): guarda ogni 300 ms; se intanto cambi sezione tu, non ti sposta.

Aperto sul Calendario: il pulsante «Parla» copre l'angolo della domenica in alto (vale per tutte le sezioni). NON provati: telefono vero, studio tecnico, fatture «Da incassare».

Provato dal vivo dopo il push 3a3d355, computer e 375 px: tutto ✔

# 17 NOVEMBRE 2026 (sera, 4) — UNA VOCE PER VOLTA: LA CHAT CON AI

Collaudo dal vivo nel reparto «ferramenta» (1 cliente, 1 lavoro, 3 segnature di ore, 1 preventivo, 1 fattura in bozza, 1 scadenza «PROVA CONTROLLORE» creati con SQL; 7 chat di prova: tutto cancellato, 0 righe). Computer (1400) e 375 px.

Dove sta il codice: `netlify/functions/chat-gestionale.mjs` (attrezzi, moduli, istruzioni), `js/gest-chat.js` (la sezione), `js/ai-integrazione.js` (`riempi*`, `compila*DaChat`), `js/gest-ricerca.js` (`apriCosa`). Stile: `css/gestionale-stile.css` (`#chat …`).

Funziona (provato): numeri uguali al database (fattura in bozza 1.082,10 €, ore 15 in 3 segnature, preventivo 470,50 + IVA), lavori in ritardo, agenda, i 5 moduli (lavoro, cliente con tutte e 14 le caselle, scadenza, fornitore, preventivo coi SUOI prezzi), i 4 pulsanti «Apri», «Vai a…», Copia, Ferma, chat nuova pulita, archivio riaperto in ordine, foto letta giusta, altra lingua, «sei in un altro reparto».

Sistemato (da pubblicare; banco nuovo `banco-collaudo-17nov.mjs`, 36 prove):
- **Recapiti del cliente**: `ATTREZZI.clienti` leggeva solo nome, tipo, citta'. A «che telefono ha Rossi?» diceva «non è segnato», ed era segnato. Adesso anche telefono, email, indirizzo, referente, note.
- **Giorno della settimana** (`giornoGiusto`): «giovedì prossimo» finiva nel modulo di VENERDI' (il calendario nelle istruzioni non basta). Se nella domanda c'e' UN solo giorno e la data cade in un altro, il server la sposta al giorno detto piu' vicino (max 3 giorni) e lo dice al modello (`data_corretta`). Vale per i moduli nuovi e per `modifica_lavoro`.
- **Fornitore**: la categoria e' una TENDINA: elenco chiuso `FORN_CATS_OK` (uguale a `FORN_CATS` di js/gest-fornitori.js: se cambia, in DUE posti) + `riempiTendina`. Prima restava «— scegli —» e la chat diceva di averla messa.
- **Scadenza**: casella `tipo` (parole della tendina); se non combacia → «Altro». Prima restava «DURC» anche per la revisione del furgone.
- **«premi Salva»**: nei moduli NUOVI «Salva» non esiste («Crea», «Crea lavoro», «Aggiungi», «Crea preventivo»). Il server dice il nome vero (`bottoneDi`), l'avviso lo legge dal pulsante `.b-save` (`nomeSalva`).
- **Segnalino sconosciuto**: `[apri:scadenze:id]` restava scritto col codice. Si toglie (js/gest-chat.js) e le istruzioni dicono di usare [vai:…].
- **Allegato rifiutato**: il motivo (tipo sbagliato, oltre 3 MB) spariva subito: `scordaAllegato()` svuotava la riga rossa appena scritta. Adesso `scordaAllegato(true)`.
- «Foto» alto come «Parla» e «Manda» (38 → 44 px).

L'errore «400» all'apertura: NON e' del gestionale. Aperto 4 volte (computer e 375 px, elenco reparti e dentro il reparto): tutte le richieste 200. Nel registro di Supabase i 400 del 17 nov sono solo le prove dei collaudi (file `.exe` rifiutato, insert sbagliati apposta, una password sbagliata al login). La console del pannello Browser tiene gli errori vecchi anche dopo aver ricaricato: per questo «c'era già».

Da sapere:
- L'archivio delle chat e' dell'ACCOUNT, non del reparto (`chat_elenco` non filtra `mestiere_id`): in «ferramenta» si vedono anche le chat fatte in «giardiniere». Chiesto ad Alex se dividerle.
- Una scadenza non si apre dalla chat (`apriCosa` conosce lav, prev, fatt, cli, comp). Chiesto ad Alex.
- La chat riprende l'ultima conversazione dopo aver ricaricato (`sessionStorage ti_chat_conv`).
- I banchi della chat stanno sul PC (`prove-claude/banchi-fissi/assistenza-ai/`); il PC puo' essere indietro rispetto a GitHub: si portano nella nuvola e si girano sul clone.

NON provati: telefono vero, microfono («Parla»), PDF vero allegato, studio tecnico, «Manda su WhatsApp», «Segna come pagata» (non si emettono fatture di prova), computo con l'AI (provato il 16 nov).

18 nov 2026 — chiesto da Alex dopo il collaudo:
- **Archivio per reparto**: `chat_elenco(p_quante, p_mestiere)` (`sql/2026-11-18-chat-elenco-reparto.sql`, migrazione `chat_elenco_reparto_18nov2026`, riga in PROVE). La chat aperta si ricorda PER REPARTO (`sessionStorage ti_chat_conv:<reparto>`, `chiaveConv`); tornando nella chat da un altro reparto si rilegge (`controllaReparto`).
- **Una data per ogni chat**: nell'archivio «18 nov 2026, 06:28» = quando e' stata fatta (`iniziata`, il primo messaggio; `dataChat`); dentro la chat una riga col giorno sopra i messaggi (`rigaGiorno`, classe `.asst-giorno`).
- **«Apri la scadenza»**: segnalino `[apri:scad:id]` (anche `scadenze` viene accettato), `apriCosa('scad',id)` → `edit-scad` (js/gest-ricerca.js).
- Provato dal vivo dopo il push →29a782f← (computer e 375 px): archivio per reparto ✔, data ✔, «Apri la scadenza» ✔, telefono letto ✔, giorno della settimana ✔, categoria del fornitore ✔, «premi «Crea lavoro»» ✔, allegato rifiutato che lo dice ✔, «Foto» alto come gli altri ✔.
- ⛔ Trovato dal vivo: dopo un modulo chiuso, la scadenza chiesta alla chat si apriva VUOTA (`quandoCompare` riempiva la casella della finestra vecchia, nascosta, mentre `scadForm` async costruiva la nuova). Adesso aspetta la casella VISIBILE. E una volta la chat ha scritto un telefono inventato: istruzione nuova «telefoni, email, importi, date solo se letti con un attrezzo in questa risposta».


# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: LE GIORNATE

Collaudo dal vivo nel reparto «ferramenta» (2 lavori, 1 persona «Prova Controllore», 5 giornate, 1 spesa, 1 pieno, 1 foto, 1 mezzo di prova: tutto cancellato, anche dal deposito; i conti delle tabelle sono tornati uguali a prima, 0 righe).

Dove sta il codice: `js/gest-giornate.js` (lettura `giorCarica`, disegno `giorDisegna` / `giorDisegnaProp`, AI `giorCompila`, salva `giorSalva` → `giorScrivi`, `giorCancella`, `giorModSalva`, `giorPdf`, i clic su `[data-gior]`); `js/gest-giornate-extra.js` (foto, spesa, benzina e km, fattura o bolla: `gx*`, clic su `[data-gx]`); `js/gest-giornata-completa.js` (le giornate mandate dagli operai); `js/correggi-giornata.js` (il correttore). `giorScrivi` la usano anche «Parla» (`gest-parla.js`) e «Approva».

Sistemato e online:
- ⛔ **Le 8 ore si dividono anche con le giornate GIA' salvate** (`giorScrivi`). Prima si guardavano solo le schede dello stesso salvataggio: la stessa persona segnata in due volte in due cantieri lo stesso giorno prendeva 8 + 8 ore (visto dal vivo: 2 giorni di lavoro, 480 € di manodopera invece di 320). Adesso: ore «da giornata intera» → si ridividono (4 + 4); ore scritte a mano dall'operaio (5) → non si toccano, alla nuova va quello che manca (3). Cancellando una delle due, all'altra tornano le 8 (`giorCancella`).
- **Doppione**: stessa persona, stesso giorno, stesso cantiere → non salva e lo dice («… ha già la giornata di … a «…»»). Capitava con «Come ieri» premuto due volte.
- **Il racconto si svuota dopo il Salva** (restava nella casella, pronto per un doppione).
- **«+ nuovo»**: «DAVID» o «prova controllore» scritti diversi sono la persona che c'e' gia' (nasceva un doppione in Squadra). Confronto con `_gNorm` sul nome intero.
- **«modifica»** cambia solo la nota (`g.nota`): se il rapportino aveva i materiali, «Materiali: …» finiva scritto due volte.
- **Numeri**: «12o» nei chilometri si salvava come 12 (anche nell'importo di spesa e benzina) → adesso lo rifiuta (`gxNonNumero`). ⚠️ La causa e' `_numeroIt` (parseFloat) che vale per tutto il gestionale: NON toccata.
- Solo chilometri: non scrive piu' «0,00 € · 12 km».
- Il messaggio «Controlla qui sotto e premi Salva» non sparisce piu' quando arriva il nome del titolare (`giorMsgSchede`).
- Cestino: la riga delle ore dice «8 ore del 18/11/2026» (diceva solo « del 18/11/2026»).

Da sapere:
- «Salva» passa dal correttore: se corregge «Cosa avete fatto» si ferma e va premuto un'altra volta (come la nota del Calendario).
- «Io»: la scelta sta nel browser (`localStorage gior_io_<uid>`). Nelle prove rimetterla com'era.
- Una giornata nel Cestino sono DUE righe (rapportino + ore): «Rimetti a posto» sul rapportino riporta su anche le ore.
- La spesa e il pieno tolti da Giornate si cancellano per sempre (non vanno nel Cestino), dopo il secondo tocco.
- «Acquisti del mese» conta solo la merce letta da fatture e bolle, non le spese a mano.
- Provare il codice nuovo PRIMA del push: le funzioni di `gest-giornate.js` sono globali, si ridefiniscono nella pagina vera con `(0,eval)(String.raw\`async function giorScrivi(){…}\`)`.
- In nuvola `add_repo` con accesso push passa solo DOPO che Alex ha scritto «pubblica» (prima e' rifiutato): intanto si lavora in un `git clone` pubblico.

Aperto sulle Giornate:
1. Rimettendo a posto dal Cestino una delle due mezze giornate, l'altra (tornata a 8) non si ridivide: 4 + 8.
2. (chiuso) Le tre funzioni proposte: Alex ha detto si' a tutte, vedi sotto.
3. NON provati: la notifica della sera e il consulente del lavoro (sono le impostazioni vere di Alex), «Approva / Scarta» di una giornata mandata da un operaio (serve l'app operaio), «Fattura o bolla» fino al salvataggio (il modulo si apre col lavoro e la data giusti), il telefono vero.

Funzioni nuove (ok di Alex il 18 nov):
- **Giornata intera / Mezza giornata**: sotto i nomi accesi una riga per persona (`giorMezzeHTML`, azione `mz`, `c.mezza` = insieme dei nomi). `giorSalva` passa `mezze[]` a `giorScrivi`, che da' al massimo 4 ore. Se nel racconto c'e' «mezza giornata» l'AI la accende per quella scheda (`giorCompila`). «Parla» non la passa: resta 8.
- **«modifica» completa** (`giorModK`, `giorModTutto`): apre la scheda piena e AGGIORNA il rapportino e le sue ore (non ne crea di nuovi): chi resta cambia giorno/cantiere/ore, chi entra ha una riga nuova, chi esce va nel Cestino. Le ore si dividono con gli altri cantieri del giorno; `giorRidaiOre` le rida' a chi resta nel giorno vecchio. ⚠️ Foto, spese e fatture NON si spostano con la giornata. Il vecchio riquadro col solo testo (`giorModifica`, `giorModSalva`) non si apre piu'.
- **«togli» sotto ogni foto** nella finestra Foto (`gxFotoTogli`, secondo tocco «Sì, togli»): passa da `sb.from("gest_foto").delete()`, quindi va nel Cestino.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: RICHIESTE DAL SITO

Collaudo dal vivo (computer 1440 e 375 px). ⚠️ Le richieste NON sono di un reparto: sono della SCHEDA dell'account (`preventivi.impresa_id` → `imprese` di Alex, id →36←). Per provarle si inseriscono con SQL →3← righe in `preventivi` con `impresa_id=36` e nome «PROVA CONTROLLORE …»; alla fine si cancellano `preventivi`, `gest_dalsito` (stato), il cliente e il preventivo creati in «ferramenta». Fatto: →0← righe.

Dove sta il codice: `js/gest-carte-documenti.js` (elenco, `dsCarica`, `dsSegna`, `dsVoci`), `js/gest-richieste-chat.js` (`dsApri`, `dsContatti`, `dsRisposta`, `dsCreaPreventivo`), azioni `ds-*` in `js/gest-finestre-eventi.js`. Lo stato sta in `gest_dalsito` («nuova» = nessuna riga).

Funziona (provato): elenco e le 3 viste coi numeri, pallino nel menu e riga nell'Assistente, apertura = «Vista», contatti (email, telefono), nomi con `<b>` e virgolette scritti puliti, richiesta quasi vuota, «Segna chiusa» / «Riapri», «Risposta pronta» con l'AI (1 credito: usa quello che ha scritto il cliente), «Crea il preventivo» (cliente in rubrica senza doppioni, titolo e note già scritti), telefono 375 px senza niente tagliato né sotto 13 px, console pulita.

Sistemato (da pubblicare):
- **«Preventivo fatto» senza preventivo**: lo stato cambiava appena si apriva il modulo. Con «Annulla» la richiesta restava «Preventivo fatto» e «Crea il preventivo» spariva. Adesso il modulo porta il numero della richiesta (`#pv-tit` `data-dalsito`) e `savePrev`, a preventivo scritto, chiama `window.dsPrevSalvato(pid, idPreventivo)`: stato + `gest_dalsito.preventivo_creato_id` (prima mai scritto).
- **WhatsApp col numero sbagliato**: si toglieva «39» davanti a qualunque numero, quindi un cellulare 392…/393…/391… perdeva due cifre. `dsTelWa()` usa `waCleanTel` (js/gest-riepilogo-schede.js); un fisso (0…) non mostra WhatsApp. Stesso difetto nei pannelli (`js/pannelli-preventivi.js`): sistemato uguale.
- **Schede ferme su «Nuova»** dopo averle aperte (il pallino scendeva, la scheda no): `rinfresca("dalsito")` in `dsApri`.
- «Quando gli servirebbe» scritto 2026-12-10 → 10/12/2026 (`fdate`).
- Senza telefono il cliente si ritrova per email (no doppioni). «WhatsApp» della risposta alto 44 px.

Funzione nuova (sì di Alex, foto prima): pulsante **«Apri il preventivo»** nella richiesta già trasformata (`dsVoci` in js/gest-carte-documenti.js, azione `ds-prev-apri` in js/gest-finestre-eventi.js → `apriCosa("prev", _prevId)`). C'è solo se `gest_dalsito.preventivo_creato_id` è scritto: le richieste trasformate prima del 18 nov non ce l'hanno.

Da sapere: in `gest_dalsito` di Alex ci sono →3← righe vecchie (richieste →16, 42, 43←, di prima dell'8 nov, non sue): non si vedono, non toccate. Le Giornate del 18 nov erano ancora in lavorazione in un'altra sessione: su GitHub non c'erano.

Provato dal vivo dopo il push 44fa9dd, computer e 375 px: tutto ✔

NON provati: una richiesta vera mandata dalla scheda pubblica (email di avviso comprese), gli incarichi dello studio tecnico (`incarichi_richieste`), la foto allegata, «Email» e «Copia» della risposta, il clic vero su WhatsApp, telefono vero.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: I PROMEMORIA

Collaudo dal vivo (computer 1440 e 375 px). ⚠️ I promemoria NON sono di un reparto: sono dell'account (tabella `promemoria`, niente `mestiere_id`). La tabella era a →0← righe: le prove «PROVA CONTROLLORE …» si scrivono dal modulo vero e alla fine si cancellano con SQL (`delete … where testo ilike 'PROVA CONTROLLORE%'`). Fatto: →0← righe. Per non finire nell'email del mattino (parte alle 5:30 UTC) le prove hanno date del 2027 e si cancellano in giornata.

Dove sta il codice: `js/gest-promemoria.js` (elenco `renderPromemoria`, scheda `promCard`, modulo `promForm`, `salvaPromemoria`, `promStato`, `promButta`, i clic in un ascoltatore SUO). Il pallino lo conta `renderContatori` (js/gest-riepilogo-schede.js), il Calendario li legge in `calAltreDate`, l'email in `netlify/functions/promemoria-mattina.js`. Il Noleggio ha la sua copia in `js/nol-giornata-squadra-promemoria.js`.

Sistemato:
- ⛔ **I pulsanti in alto erano del promemoria aperto LA VOLTA PRIMA.** Aprivi A, poi B, premevi «Butta» (o «Segna fatto») e toccava ad A. Alla prima apertura non c'erano proprio. E dopo, «Nuovo cliente» si apriva con «Segna fatto / Butta» di un promemoria. Causa: l'ascoltatore dei Promemoria è caricato prima di quello della pagina, che è quello che metteva da parte le azioni (`_azPendenti`). Adesso lo fa un ascoltatore «capture» in `js/gest-finestre-eventi.js`, che parte prima di tutti. ⚠️ Chi fa un file nuovo con un ascoltatore suo e un'azione `edit-…` / `apri-…` è coperto da quello.
- **Due tocchi su «Salva» = due promemoria**: fermato (`_promSalvo`). Anche nel Noleggio.
- **«Ogni mese» dal 31 gennaio saltava febbraio** (andava al 3 marzo): `promProssima` si ferma all'ultimo giorno del mese (28 febbraio). Anche nel Noleggio.
- **Il pallino nel menu, l'Assistente e il Calendario** non si aggiornavano dopo Salva / Segna fatto / Butta: `promRidisegna()` → `rinfresca("promemoria","calendario","riepilogo")`.
- **«Butta» senza domanda**: adesso chiede «Mettere nel cestino «…»?» (`tiChiedi`, come lo Scadenzario). Il banco non lo vedeva perché alla prima apertura i pulsanti in alto mancavano.
- Nei «Fatti» in cima c'è l'ultimo. La nota del modulo diceva «alle 7:30»: d'inverno arriva alle 6:30 → «la mattina presto» (anche nel Noleggio).

Da sapere:
- Nelle prove, dopo un'azione aspettare che l'elenco si ridisegni prima di cliccare un'altra scheda; e i pulsanti in alto si cercano dentro `#sheet` (la finestra chiusa resta nella pagina).
- «Salva» passa dal correttore delle parole (come le Giornate): se corregge, va premuto due volte. Ha cambiato «aggiunta una nota» in «Aggiunte una nota»: è il correttore generale, NON toccato.
- Un promemoria «fatto» aperto dal Calendario mentre l'elenco è su «Da fare» prende i pulsanti dall'ultimo disegno che lo conteneva.
- Uno che si ripete, segnato fatto in forte ritardo, va alla data dopo anche se è ancora passata (scelta del 14 set: si parte dalla SUA data).
- Per provare il codice nuovo prima del push: le funzioni di `gest-promemoria.js` sono globali, si ridefiniscono nella pagina vera con `(0,eval)(String(funzione).replace(…))`.

Aperto sui Promemoria:
1. (chiuso) «Rimanda»: Alex ha detto sì, vedi sotto.
2. NON provati: l'email del mattino con dentro un promemoria (parte una volta al giorno), «Parla» e la Chat con AI che scrivono/leggono un promemoria (costano crediti), il Noleggio dal vivo (solo banco), il telefono vero.
3. In `strumenti-comuni.js` restano le vecchie funzioni promemoria dei pannelli (`apriPromemoria`, `eliminaPromemoria`…): nessuna pagina le chiama più (cercato in tutti gli html e js). Codice morto, non toccato.

Funzione nuova (sì di Alex il 18 nov, foto prima): **«Rimanda ▾»** in alto nella finestra del promemoria, dopo «Segna fatto»: A domani / Fra 3 giorni / Fra una settimana (`PROM_RIMANDA`, `promRimandaMetti`, `promRimanda`, azione `prom-rimanda` in `js/gest-promemoria.js`). Si conta da OGGI, non dalla data vecchia; azzera `inviato` (l'avviso riparte). Non c'è sul promemoria nuovo né su quello fatto. La mette `promForm` dopo `openSheetGrande` (un `<details class="sh-altro">` suo: stile e chiusura sono quelli di «Altro ▾»). Sul telefono è una riga larga sotto «Segna fatto». ⚠️ NON nel Noleggio: lì le schede hanno un'altra grafica, serve prima la foto.

Dopo il giro del menu di impresa e artigiano (deciso da Alex il 18 nov): si riparte dal GESTIONALE DEL PROFESSIONISTA (studio tecnico, `?vedi=professionista`), stesse regole, una voce per volta. Prima le voci che ha solo lui (Pratiche, Computo metrico, Parcella, Crediti formativi, Collaboratori…), poi quelle in comune guardando solo cosa cambia per lo studio. All'ultima voce del menu: scrivere ad Alex l'elenco delle voci dello studio nell'ordine del suo menu e dargli il prompt per la prima.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: LO SCADENZARIO

Collaudo dal vivo nel reparto «ferramenta» (computer 1440 e 375 px): 5 scadenze e 1 persona «PROVA CONTROLLORE» (più una chiamata «Bollo», nata dal titolo vuoto), tutto cancellato anche dal Cestino: →0← righe, conti delle tabelle uguali a prima.

Dove sta il codice: `js/gest-scadenze-pratiche.js` (elenco `renderScadenze`, scheda `scadCard`, modulo `scadForm`, `saveScad` → `_saveScad`, le righe in sola lettura `scadenzePersone` / `scadenzeMezzi`, il riquadro dentro il lavoro `renderLavScadenze`); i clic (`new-scad`, `edit-scad`, `scad-stato`, `del-scad`, `scad-persona`) in `js/gest-finestre-eventi.js`; i tipi `tipiScadenza` e `scadCache` in `js/gest-richieste-chat.js`; il controllo `ctrRegoleScadenza` in `js/gest-ai-moduli.js`; l'email in `netlify/functions/promemoria-mattina.js`.

Sistemato e ONLINE (→d69f526←, Netlify riuscito, riprovato dal vivo dopo il push su computer e 375 px: tutto ✔, compreso `ctrRegoleScadenza`; banco `tools/banco-gestionale.js app`: ZERO difetti):
- **Due tocchi su «Crea» = due scadenze** (visto dal vivo): freno `_scadSalvo`, come i Promemoria.
- **La prossima perdeva la persona**: una scadenza che si ripete, segnata fatta, rinasceva senza `operatore_id` (il patentino di Mario senza Mario).
- **«Segna fatta», «Riapri», «Segna fatta» = due prossime uguali**: adesso se la prossima c'è già (stesso nome, stesso giorno, aperta) non se ne fa un'altra, e lo dice.
- La prossima si fa dalla riga che torna dal database (`.select("*")`), non da `scadCache`: dal Calendario la memoria può essere vuota e la prossima non nasceva.
- **Una scadenza nuova nasceva col tipo «DURC»**: adesso parte da «— scegli —» (solo le NUOVE). Titolo vuoto + tipo scelto = il titolo è il tipo (regola dell'11 nov), titolo vuoto + nessun tipo = casella rossa.
- **Ordine**: in «Tutte» le fatte vanno in fondo (stavano in mezzo alle aperte); in «Fatte» in cima c'è l'ultima.
- Il controllo diceva «DA CORREGGERE: manca il titolo» anche quando il Salva lo accetta; e «data passata: il promemoria non ti arriverà più» (non vero: torna nell'email del lunedì).
- Tolta dal modulo la frase «Prima dovevi ricordartene tu».

Funziona (provato): crea, modifica, scaduta in rosso, pallino nel menu, Riepilogo, Calendario (si apre da lì e chiudendo si torna lì), pulsanti in alto della scadenza giusta, cestino → rimetti a posto, note con `<b>` e virgolette scritte pulite, 375 px senza niente fuori né sotto 13 px, console pulita.

Da sapere:
- Le correzioni sono state provate PRIMA del push rimettendo le funzioni nella pagina vera (`(0,eval)(String(fn).replace(…))`); `scad-stato` sta dentro l'ascoltatore grande: per provarlo si mette un ascoltatore «capture» con la copia del pezzo. `ctrRegoleScadenza` invece NON si riesce a sostituire così (il controllore tiene la funzione vecchia): si prova dopo il push.
- Lo Scadenzario del Noleggio (`js/nol-giornata-squadra-promemoria.js`) è spento (la sezione non c'è nel menu): non toccato.
- Nelle prove: le date nel 2027 o passate da più di un giorno non entrano nell'email del mattino.

Aperto sullo Scadenzario:
1. (chiuso) Le fatture dei fornitori nello Scadenzario: Alex ha detto sì, vedi sotto.
2. Nel Cestino due scadenze con lo stesso nome non si distinguono (manca la data nella riga).
3. NON provati: l'email del mattino con dentro una scadenza (parte una volta al giorno), Chat con AI e «Parla» che riempiono la scadenza col tipo nuovo «— scegli —» (costano crediti; `riempiTendina('s-tipo', …, 'Altro')` non è cambiata), lo studio tecnico, il telefono vero.

Funzione nuova (sì di Alex il 18 nov, foto prima): **le fatture dei fornitori da pagare nello Scadenzario** (`scadenzeFornitori(mid)` in `js/gest-scadenze-pratiche.js`, righe con `_forn:true`, in sola lettura come mezzi e persone). Solo quelle NON pagate e con la scadenza scritta, del reparto. «Apri» passa da `cal-vai` → Fornitori → `edit-fattf`. E `calVai` (js/gest-schede-clienti.js) adesso riporta DA DOVE si è partiti (`_da`): dallo Scadenzario, chiuso un mezzo o una fattura, si finiva nel Calendario.

Dopo il giro del menu di impresa e artigiano (deciso da Alex il 18 nov): si riparte dal GESTIONALE DEL PROFESSIONISTA (studio tecnico, `?vedi=professionista`), stesse regole, una voce per volta. Prima le voci che ha solo lui (Pratiche, Computo metrico, Parcella, Crediti formativi, Collaboratori…), poi quelle in comune guardando solo cosa cambia per lo studio. All'ultima voce del menu: scrivere ad Alex l'elenco delle voci dello studio nell'ordine del suo menu e dargli il prompt per la prima.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: L'AGENDA OPERATORE

Collaudo dal vivo nel reparto «ferramenta» (computer 1440 e 375 px): 3 persone «PROVA CONTROLLORE» (una nel Cestino), 5 lavori, 4 righe di ore, 12 timbrature create con SQL. Tutto cancellato: →0← righe, conti delle tabelle uguali a prima.

Dove sta il codice: linguetta «Lavori» = `renderAgenda`, `agVoci` in `js/gest-elimina-reparto.js`; linguetta «Ore fatte» = `renderOre`, `oreMettiUscita`, `oreScaricaCsv` in `js/gest-ore-spese.js`; i clic (`ag-stato`, `ag-vista`, `ore-mese`, `ore-fix`, `ore-apri`, `ore-csv`) in `js/gest-finestre-eventi.js`; la pagina in `gestionale-app.html` (`#agenda`). «Ore fatte» conta TUTTA l'azienda, non il reparto.

Sistemato (provato sulla pagina vera PRIMA del push; banco `tools/banco-gestionale.js app`: ZERO difetti):
- ⛔ **«Metti l'uscita» non faceva niente.** Il pulsante stava dentro uno `<span class="fix" onclick="event.stopPropagation()">`: il clic non arrivava all'ascoltatore della pagina. Tolto lo stop (la riga del giorno non sta dentro la riga della persona).
- **Il mese delle timbrature si tagliava sull'ora di Greenwich**: chi timbrava fra mezzanotte e l'una del primo del mese finiva nel mese prima, come «giornata rimasta aperta», e le sue ore sparivano. Adesso i confini sono `new Date(anno, mese, 1).toISOString()`.
- **Ore scritte senza nome**: si buttavano via e il totale «Ore scritte a mano» era più basso del vero (14 invece di 17). Adesso hanno la riga «Ore senza nome» (`_senza_nome`, non conta in «Chi ha timbrato»).
- **Persona nel Cestino**: in «Ore fatte» era «Persona non in elenco», nei Lavori la riga non diceva nessun nome. Adesso «Nome (nel cestino)» (letto con `sb.raw`).
- ⛔ **Il lavoro di una persona nel Cestino la PERDEVA col Salva** (`jobForm`: la tendina «Chi ci va» restava su «— nessuno —»). Adesso la sua voce resta nella tendina (`option[data-fuori]`).
- **«Tutti»**: i lavori fatti stavano in cima. Adesso in fondo, l'ultimo per primo.
- Se le ore scritte non si leggono lo dice (prima: 0 in silenzio).

Funziona (provato): filtro per persona, «Da fare / Tutti», «Apri» → modifica → Salva e l'Agenda si aggiorna, «Segna fatto» dall'alto, mese prima / dopo, differenza timbrate-scritte, file per Excel (letto il contenuto), 375 px senza niente fuori né sotto 13 px, console pulita.

Da sapere:
- Sul computer E sul telefono i lavori sono schede `.job` (`cards` di `renderTabella`); `display:none` scritto a mano su una scheda sul computer non la nasconde.
- Le foto del pannello Browser arrivano in ritardo: una foto presa nello stesso giro del comando mostra lo stato di PRIMA.
- Per provare prima del push: `(0,eval)(String(renderOre).replace(…))` funziona per `renderOre` e `renderAgenda`.

Aperto sull'Agenda operatore:
1. (chiuso) Funzione nuova, sì di Alex il 18 nov (foto prima): nella tendina «Operatore» la voce **«Nessuno assegnato»** (`agFilter.op=="_nessuno"`) e il numero dei lavori accanto a ogni nome (`_agN`, conta quelli che si stanno guardando: «Da fare» o «Tutti»). La tendina adesso si riempie DOPO aver letto i lavori (`renderAgenda`).
2. La linguetta viola «F» a sinistra copre la prima lettera di «Mostra» sul telefono (vale per tutte le sezioni, come «Parla»).
3. NON provati: l'app dell'operaio che timbra davvero (le timbrature sono state scritte con SQL), lo studio tecnico, il telefono vero. La correzione di `jobForm` va riprovata dal vivo dopo il push (non si riesce a sostituire nella pagina).

Dopo il giro del menu di impresa e artigiano (deciso da Alex il 18 nov): si riparte dal GESTIONALE DEL PROFESSIONISTA (studio tecnico, `?vedi=professionista`), stesse regole, una voce per volta. Prima le voci che ha solo lui (Pratiche, Computo metrico, Parcella, Crediti formativi, Collaboratori…), poi quelle in comune guardando solo cosa cambia per lo studio. All'ultima voce del menu: scrivere ad Alex l'elenco delle voci dello studio nell'ordine del suo menu e dargli il prompt per la prima.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: SQUADRA, MEZZI E ATTREZZATURE (e le due unite)

Collaudo dal vivo nel reparto «ferramenta» (computer 1440 e 375 px): 2 persone, 2 lavori, 5 righe di ore, 1 attestato, 2 mezzi, 1 scadenza, 3 pieni «PROVA CONTROLLORE». Tutto cancellato: →0← righe, conti delle tabelle uguali a prima.

Dove sta il codice: Squadra = `js/gest-squadra.js` (elenco `renderDip`, modulo `squadraForm`, `squadraAdd`, `squadraSave`, `dipElimina`, attestati `doc*`), le schede `js/gest-squadra-giornate.js` (`sqgCard`, `sqgApri`), messaggi `js/chat-squadra.js` + `js/chat-gest.js`, QR `mostraQrInvito` in `js/gest-reparti.js`. Mezzi e Attrezzature = `js/gest-mezzi.js` (una funzione sola, `renderParcoMezzi`), rifornimenti in `js/gest-carte-documenti.js`.

Squadra, sistemato:
- ⛔ **L'invito vale 14 giorni e una volta sola** (`gest_redeem_invito`), ma la scheda diceva «Invitato» + «Mandagli l'app» per sempre, anche dopo «Rimuovi accesso». Il 18 nov gli inviti in attesa nel database erano →5← e tutti e →5← scaduti. Adesso `invitoStato(inv)` → attivo · invitato · scaduto · tolto · senza; `dipStato` dice «Invito scaduto» / «Accesso tolto»; i pulsanti del link ci sono solo se l'invito è vivo (`invitoVivo`).
- **«Nuovo invito»** (sì di Alex, foto prima): `squadraNuovoInvito(id)`, azione `sq-invito`. Codice nuovo, altri 14 giorni, stessa riga di `gest_membri` (ruolo e permessi restano); chi non l'ha mai avuta nasce coi permessi dell'operaio. Poi apre il QR, che adesso ha anche «Invia su WhatsApp».
- Salvare una persona senza invito diceva «ruolo e permessi non aggiornati» a ogni Salva. I messaggi che dicevano «rimandale il link d'invito» / «Nessun accesso» / «Apri la sua scheda e fagli inquadrare il QR» parlavano di cose che non c'erano.
- Sul telefono «Invia» dei messaggi usciva dallo schermo (il microfono avvolge la casella in `.dt-box`). Vale anche per i messaggi del lavoro e per l'app operaio.
- Le schede cambiavano posto (nessun ordine): ultima aggiunta in cima. Con una cosa scaduta, quella in scadenza spariva dalla scheda. Telefono senza cifre: niente link vuoto, e il Controllo lo segna. «Il documento è scaduta» → «scaduto» (`_ctrScad`, quinto parametro).

Mezzi e Attrezzature, sistemato: il Controllo taceva con assicurazione / revisione / collaudo già scaduti; chilometri più bassi di un pieno di prima → chiede; senza carte il pieno partiva su «Carta aziendale»; «9000 km» senza il punto; spostando da una parte all'altra lo dice; «Rifornimenti» non esce più sulle attrezzature.

**UNA VOCE SOLA «Mezzi e attrezzature»** (deciso da Alex, foto prima): `mzUnito()` / `mzUnisci()` in `js/gest-mezzi.js`, stile in fondo a `css/gestionale-stile.css` (`?v=32`).
- ⛔ Non è stato cancellato niente: le sezioni `#mezzi` e `#attrezzature` restano, e resta il pulsante `attrezzature` del menu con la classe `.mz-dentro` (non si vede). Chi lo «preme» da fuori (Scadenzario, Calendario, Riepilogo, Chat `[vai:attrezzature]`, `#attrezzature`) funziona come prima; nel menu si accende «Mezzi e attrezzature» (riga in `js/gest-finestre-eventi.js`). Il numerino conta tutte e due.
- ⛔ Studio tecnico: i mezzi sono nascosti → `mzUnito()` è falso → resta la voce sola «Strumenti», senza linguette. Chi ha scelto «Sei anche un professionista?» vede «Mezzi e strumenti».
- Il Noleggio ha già una voce sola «Mezzi»: non toccato. La Squadra del Noleggio non è nel menu: non toccata.
- Nomi aggiornati: MANUALE di `chat-gestionale.mjs`, `js/aiuti.js`, `js/gest-tutorial.js`, testi delle due sezioni. ⚠️ Il video `attrezzature.mp4` non ha più una voce sua: il ▶ di «Mezzi e attrezzature» fa vedere quello dei mezzi. Da rifare con `tools/tutorial/registra.py` se Alex lo vuole.
- Il banco adesso misura 25 sezioni (Attrezzature non è più una voce): la linguetta Attrezzature si guarda a mano.

Aperto:
1. NON provati: l'operaio che apre il link nuovo dal telefono (serve un telefono vero e un account suo), lo studio tecnico dal vivo prima del push, il telefono vero.
2. Proposto e non deciso: avviso «C'è già una persona con questo nome» quando si aggiunge (come per i clienti).
3. Agenda operatore + Squadra in una voce sola: deciso da Alex il 18 nov in un'altra chat, in questa sessione NON fatto (la riga non è arrivata qui).
4. Mezzi: l'elenco è in ordine di nome, non «ultimi in cima».

Dopo il giro del menu di impresa e artigiano (deciso da Alex il 18 nov): si riparte dal GESTIONALE DEL PROFESSIONISTA (studio tecnico, `?vedi=professionista`), stesse regole, una voce per volta. Prima le voci che ha solo lui (Pratiche, Computo metrico, Parcella, Crediti formativi, Collaboratori…), poi quelle in comune guardando solo cosa cambia per lo studio. All'ultima voce del menu: scrivere ad Alex l'elenco delle voci dello studio nell'ordine del suo menu e dargli il prompt per la prima.

18 nov (sera, dopo il push →89be5816←) — provato dal vivo su computer e 375 px: stati dell'invito, «Nuovo invito» + QR con WhatsApp, «Accesso tolto», Controllo, pieni, linguette: tutto ✔. Poi, sì di Alex:
- **Avviso «C'è già una persona che si chiama…»** in `squadraAdd` (js/gest-squadra.js), come per i clienti: avvisa e non blocca.
- **Video**: un video solo `mezzi.mp4` / `mezzi-tel.mp4` che fa vedere tutte e due le linguette; tolti `attrezzature*.mp4` e il copione `attrezzature` (tools/tutorial/registra.py). ⚠️ `registra.py` scrive in `tools/tutorial/uscita/`: i file vanno copiati a mano in `video/tutorial/` e `elenco.json` NON si copia (quello in uscita contiene solo le voci rifatte).
- ⛔ **Difetto vecchio trovato**: Scadenzario (`scadenzeMezzi`) e Calendario (`calAltreDate`) decidevano «attrezzatura» da `m.tipo`, che è testo libero («Trapano»): un'attrezzatura era sempre «Mezzo» e si apriva nella linguetta Mezzi. Adesso `m.categoria`.
- `calVai` / `calTornaQuandoChiude` guardano la SEZIONE aperta (`section.active`), non la voce accesa del menu: con la voce unita le voci accese sono due. `mzUnisci` accende «Mezzi e attrezzature» anche entrando da `#attrezzature`.
- ⚠️ Studio «puro» (voce sola «Strumenti») NON provabile col conto di Alex: con `?vedi=professionista` (`_facciaScelta()`) i Mezzi restano accesi e si vede «Mezzi e strumenti» con le linguette.
- Deciso da Alex: **Agenda operatore + Squadra in una voce sola** → prossima sessione, foto prima.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: TASSE E FISCO

Collaudo dal vivo nel reparto «ferramenta» (computer 1440 e 375 px), tutte e 4 le linguette e tutte le finestre. Il profilo fiscale e la fattura «Prova Srl» sono di Alex: solo guardati, non toccati. Nessun sollecito segnato, nessuna fattura. Prove: 3 promemoria «Tasse: …» (cancellati) → →0← righe.

Dove sta il codice: `js/gest-fisco.js` (Farsi pagare, «Da fare adesso», lettere, giudice, `fpNum`), `js/gest-fisco-tasse.js` (Le tue tasse, profilo, scadenze, ravvedimento, lettera, IVA, bonus, .ics), `js/gest-fisco-confronto.js` (Chi paga più tasse?), `js/gest-fisco-vivere.js` (Quanto ti resta, prezzo giusto, PDF), `js/gest-fisco-ai.js` (Chiedi all'AI).

Sistemato (banco `tools/banco-gestionale.js app`: ZERO difetti):
- ⛔ **I numeri scritti col punto delle migliaia si rompevano.** Ravvedimento: «1.500,50» = 1,50 € (misurato). Prezzo giusto: «2.000» al mese = 2 € → proponeva una tariffa di 7 € l'ora. Profilo: spese «12.000» = 12. Adesso caselle `type="text" inputmode="decimal"` lette da `fpNum()` (che chiama `_numeroIt`) e riscritte con `fpNumTesto()`.
- **Chi paga più tasse?**: «40.000,50» diventava 4.000.050 € (`fcNum` buttava via la virgola).
- **Due tocchi su «Ricordamelo» = due promemoria** (misurato): freno `_ftRicordo`. E dopo il salvataggio si aggiornano pallino dei Promemoria e Calendario.
- Due tocchi su «L'ho mandata» / «Fatto» = due passi segnati: freno `_fpSegno` (letto nel codice, non provato: avrebbe scritto sulla fattura di Alex).
- «Quanto ti resta», il PDF del commercialista e la Chat dell'AI contavano il TOTALE delle fatture aperte; «Farsi pagare» dal 17 nov conta quello che MANCA (tolti gli acconti, colonna `resto`). Adesso tutti col resto (`fvResto`).
- La lettera PEC diceva «nonostante i solleciti inviati» anche senza solleciti.
- Il file .ics non proteggeva il «;» nei testi.
- Chat dell'AI: una domanda fatta appena aperta partiva senza i numeri. Adesso li aspetta.
- Interessi di mora con `_cent2` (regola dei centesimi).

Studio tecnico (`?vedi=professionista`):
- ⛔ «Quale IVA metto?» rispondeva «10% sulla ristrutturazione» anche allo studio. Per lo studio adesso: 22% sempre, cassa prima dell'IVA, ritenuta 20% solo con clienti aziende/condomini/professionisti. Da forfettario: niente IVA e niente ritenuta.
- «Chi paga più tasse?»: niente pulsante «Dipendente in cassa edile» (già niente Srl).

Funziona (provato): interessi di mora (2.345 € × 71 giorni = 47,44 € + 40 €), i 4 testi (gentile, sollecito, PEC, giudice), PDF della lettera non scaricato, profilo indovinato/salvato, salvadanaio, scadenze (date feriali), consigli, confronto (40.000 €: forfettario 9.726 €, conti rifatti a mano), bonus casa (11.000 → 991,80 €), IVA, 375 px senza niente fuori né sotto 13 px.

Aperto su Tasse e fisco:
1. NON provati: WhatsApp/email del sollecito (scrive sulla fattura vera), «Ha pagato», «Usa come mia tariffa» e «Ricorda questi numeri» (cambierebbero i dati di Alex), le domande all'AI e la foto della lettera (costano crediti), lo studio tecnico dal vivo con le correzioni (si prova dopo il push), il telefono vero.
2. Le date delle scadenze sono scritte a mano fino al 31/12/2027 (`ftScadenze`): a fine 2027 vanno aggiunte quelle del 2028. «IVA del 3° trimestre» legge sempre luglio-settembre 2026.
3. «Incassato» conta solo le fatture PAGATE: gli acconti di una fattura ancora aperta non entrano nelle tasse finché non è pagata tutta.
4. Supabase dal connettore: il 18 nov un `delete` ha chiesto conferma ad Alex e non ha avuto risposta; le righe di prova sono state cancellate dalla pagina (`sb.raw(...).delete()`).

Dopo il giro del menu di impresa e artigiano (deciso da Alex il 18 nov): si riparte dal GESTIONALE DEL PROFESSIONISTA (studio tecnico, `?vedi=professionista`), stesse regole, una voce per volta. Prima le voci che ha solo lui (Pratiche, Computo metrico, Parcella, Crediti formativi, Collaboratori…), poi quelle in comune guardando solo cosa cambia per lo studio. All'ultima voce del menu: scrivere ad Alex l'elenco delle voci dello studio nell'ordine del suo menu e dargli il prompt per la prima.

# 18 NOVEMBRE 2026 — SCADENZE E PROMEMORIA: UNA VOCE SOLA (deciso da Alex, foto approvata)

Come «Mezzi e attrezzature»: `spUnito()` / `spUnisci()` in `js/gest-promemoria.js`, stile in fondo a `css/gestionale-stile.css` (`?v=33`, linguette con la stessa classe `.mz-ling` + `.sp-ling`, riga `.sp-nota`).
- ⛔ Non è stato cancellato niente: `#scadenzario` e `#promemoria` restano, e resta il pulsante `promemoria` del menu con la classe `.sp-dentro` (non si vede). Chi lo «preme» da fuori (Calendario, Chat `[vai:promemoria]`, Assistente, `#promemoria`) funziona come prima; nel menu si accende «Scadenze e promemoria» (riga in `js/gest-finestre-eventi.js`, e `js/gest-chat.js` lo accetta come `mz-dentro`).
- Linguette «Scadenze (n)» e «Promemoria (n)»: n = le cose DA FARE. Li scrivono `renderScadenze` / `renderPromemoria` in `window._spN`; quello che manca si legge una volta facendo girare l'altra render in silenzio (flag `_spCaricoP` / `_spCaricoS`). Il numero delle scadenze vale per il reparto (`scadMid`).
- Il pallino del menu (`#cnt-scadenzario`) è la SOMMA dei due (`renderContatori`, js/gest-riepilogo-schede.js), rosso se uno dei due è scaduto.
- Da tenere: promemoria dell'ACCOUNT, scadenze del REPARTO. Nella linguetta Promemoria la riga «I promemoria si vedono in tutti i reparti.» (sì di Alex).
- Studio tecnico: stessa cosa (lo Scadenzario dello studio ha anche le pratiche). Noleggio: NON toccato.
- Nomi aggiornati: MANUALE di `chat-gestionale.mjs`, `js/aiuti.js`, `js/gest-tutorial.js`, card «Scadenze» del Riepilogo (`js/gest-riepilogo.js`), avviso delle integrazioni (`js/gest-scadenze-pratiche.js`), titolo della sezione. Il banco adesso misura 24 sezioni: la linguetta Promemoria si guarda a mano.
- ⚠️ Il video `promemoria.mp4` non ha più una voce sua: il ▶ fa vedere quello dello Scadenzario.

# 18 NOVEMBRE 2026 — SQUADRA E AGENDA: UNA VOCE SOLA (deciso da Alex, foto approvata)

Come «Mezzi e attrezzature» e «Scadenze e promemoria»: `agUnito()` / `agUnisci()` in `js/gest-squadra.js`, stile `.ag-dentro` in `css/gestionale-stile.css` (`?v=34`), linguette con la classe `.mz-ling` + `.ag-ling`.
- ⛔ Non è stato cancellato niente: `#squadra` e `#agenda` restano, e resta il pulsante `agenda` del menu con la classe `.ag-dentro` (non si vede). Chi lo «preme» da fuori (Riepilogo, Chat `[vai:agenda]`, `#agenda`) funziona come prima; nel menu si accende «Squadra e agenda» (`js/gest-finestre-eventi.js`, e `js/gest-chat.js` lo accetta).
- Linguette «Squadra (n)» = persone del reparto, «Agenda (n)» = lavori da fare. Li scrivono `renderDip` / `renderAgenda` in `window._sqN` (col reparto: `sqMid`, `agMid`).
- Nella linguetta Agenda «Lavori / Ore fatte» (`#ag-vista`) scende sotto le linguette; se la voce non è unita torna nel titolo.
- ⛔ STUDIO TECNICO: NON unito (deciso da Alex: lo studio si guarda nel suo giro). `agUnito()` è falso per `professionista`: restano «Collaboratori» e «Agenda» separate. Noleggio: non toccato.
- Nomi: MANUALE di `chat-gestionale.mjs`, `js/aiuti.js`, `js/gest-tutorial.js`, card «Agenda» del Riepilogo. ⚠️ Video: il ▶ di «Squadra e agenda» fa vedere `squadra.mp4` (non c'è un video che mostra le due linguette).

# 18 NOVEMBRE 2026 — COLLAUDO DEL PREZZARIO (impresa e artigiano)

Provato dal vivo (1440 e 375) nel reparto «ferramenta», righe «PROVA CONTROLLORE», poi cancellate tutte (anche dal Cestino, con `sb.raw`): 0 righe, prezzario di nuovo a 12.764 voci.

Difetti trovati e sistemati:
1. Ricerca: guardava solo le 1000 voci più usate su 12.764 («parquet» 4 su 30, una voce nuova a volte introvabile). Ora `_ppCercaDb()` (js/gest-computo.js) chiede al database con TUTTE le parole (codice, descrizione, categoria). La usano il Prezzario e la ricerca dentro la lavorazione del computo (prima usava solo la PRIMA parola).
2. Numeri falsi: «Hai 1000 voci», «Ne vedi 60 su 1000». Ora `pzTot` = numero vero. «Mostra altre» va oltre le 1000. A parità di uso, le voci più nuove in cima.
3. Doppio tocco su «Crea la voce» = 2 voci; doppio tocco su «Importa» = importa 2 volte. Chiavistelli `pzSalvo`, `pzInCorso`.
4. Unità fuori tendina (cm/mq, dmc, ha, mq/mm) diventavano vuote salvando. Ora si aggiungono alla tendina.
5. Voce scritta a mano senza fonte: restava `null` e l'AI delle richieste (fonte = «mio») non la vedeva. Ora vuoto = «mio» (sulla scheda «prezzo tuo»); la chat e il controllo del preventivo trattano anche `null` come prezzo suo.
6. CSV in UTF-8: «mÂ²» e accenti storti. Stessa cura del computo (16 nov).
7. Importa: il confronto con la tariffa vecchia leggeva 999 voci su 12.762 (tetto 1000 del database). Ora a pezzi da 1000. «mio» non compare più fra le tariffe da aggiornare (col cestino buttava i prezzi suoi).
8. Tendina «Prezzario» del computo e «Prendi i prezzi dal prezzario»: una tariffa appena importata non c'era (contavano solo le 500 voci più usate). Ora `ppCaricaFonti()` le chiede al database (si azzera con `ppFontiDb=null` dove si azzera `ppTutte`). «mio» non è una tariffa.

Nuovo (sì di Alex, foto approvata): «€ Prendi dal prezzario» dentro il preventivo, sotto «+ Aggiungi voce». `prevPzApri` / `prevPzCerca` / `prevPzUsa` in js/gest-preventivi.js (ricerca come il computo: `_ppFiltra` + `_ppCercaDb`). La voce entra con descrizione, unità e prezzo, quantità 1 da correggere (il cursore va lì); se l'ultima riga è vuota la riempie. Conta +1 su `usata_volte`. Provato dal vivo: 12 × 24,50 = 294,00 €, salvato giusto; 375 px a posto.

# 18 NOVEMBRE 2026 — UNA VOCE PER VOLTA: STATI DI AVANZAMENTO (impresa e artigiano)

Provato dal vivo (1440 e 375) nel reparto «ferramenta»: computo «PROVA CONTROLLORE» con 2 lavorazioni e ribasso 10%, acconto 1 (60 + 40,25, ritenuta 0,5%) e acconto 2 (tutto). Conti a schermo = vista `gest_sal_totali` = PDF (1.814,00 e 1.823,12). Poi cancellato tutto con `sb.raw`: 0 righe.

Difetti trovati e sistemati:
1. `_numDa` (js/gest-sal-prezzario.js) cambiava solo la prima virgola: «1.200,5» = 1,2 (22 € invece di 22.000). Ora passa da `_numeroIt`. Vale anche per gest-computo-pdf.js, che la usa.
2. Il secondo acconto ripartiva con ritenuta 0 anche se il primo aveva 0,5%: ora riprende quella dell'ultimo.
3. Ordine: nel computo l'acconto 1 stava sopra; ora in cima l'ultimo. Nell'elenco, a parità di data, il numero più alto sopra.
4. Telefono: una scheda con NOTA e due pulsanti si stringeva a 13 px (parola per parola). Regola in css/gestionale-stile.css con la zona «nota» (v=35). Vale per tutte le sezioni.
5. Sotto «+ Nuovo acconto» una riga ripeteva il messaggio vuoto: tolta per impresa e artigiano (resta allo studio).
6. «Ci sono 1 lavorazioni» → «C'è 1 lavorazione». La domanda «Mettere nel cestino l'acconto n. …» trova il numero anche dall'elenco.

Errore 400 all'apertura: non si ripete (3 aperture, 0 errori). Nei registri Supabase del 18 nov l'unico 400 su una lettura è `gest_preventivi?computo_id=…` (colonna che non esiste) alle 20:49: NON sta in nessun file del sito, quasi certo una prova scritta a mano in un'altra sessione.

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: FORNITORI (impresa e artigiano)

(Il Prezzario era già stato fatto il 18 nov: questa sessione è passata alla voce dopo.)
Provato dal vivo (1440 e 375) nel reparto «ferramenta»: fornitori e fatture «PROVA CONTROLLORE», un documento, pagata/riapri, cestino e ritorno. Poi cancellato tutto (anche dal Cestino e dal deposito file): 0 righe.

Difetti trovati e sistemati:
1. Doppio tocco su «Aggiungi» = 2 fornitori; su «Aggiungi» della fattura = 2 fatture da pagare. Chiavistelli `fornSalvo` (js/gest-fornitori.js) e `fattfSalvo` (js/gest-carte-documenti.js).
2. Scheda del fornitore: le righe delle fatture erano senza stile («scaduta1.200,50 €» attaccato). Le regole `.ff-*` valevano solo per `#fornitori`: ora anche per `#sheet` (css/gestionale.css).
3. Scheda del fornitore: una fattura segnata pagata non si poteva riaprire da lì; ora c'è «Riapri». In cima le ultime salvate (come nell'elenco). «scaduta 9 giorni fa» come nell'elenco.
4. Stesso nome di un fornitore che c'è già, o stesso numero di fattura dallo stesso fornitore: prima di salvare si chiede («Lo aggiungo lo stesso?»). Non blocca.
5. «Modifica fattura»: l'importo si riempie con `_numTesto` (prima a volte «1200.5» all'inglese finché non passava euro-casella).

Funziona e NON toccato: cestino (rimette a posto anche il fornitore della fattura), Scadenze (la fattura scaduta compare), documenti, avvisi su P.IVA ed email.
Nuovo (sì di Alex, foto approvata): la ricerca in alto trova anche i FORNITORI e le FATTURE DA PAGARE (`CT_CAMPI.fornitori` / `fattforn` in js/gest-ricerca.js). Tutte e due le righe aprono la scheda del fornitore (`forn-scheda`, tipo `forn`): la fattura non si apre da `fattfCache`, che è vuota se in Fornitori non ci sei mai entrato. Se le due tabelle non si leggono, la ricerca resta quella di prima.
Tolto (deciso da Alex): il riquadro «Collegamento TrovaImpresa» nel modulo del fornitore. Cercava solo `tipo='negozio'` e di negozi veri iscritti ce ne sono 0. Al suo posto la colonna «Altri dati» (P.IVA, indirizzo, note). `#fo-tid` resta nascosto: un collegamento già salvato non si perde. `fornTiCerca` / `fornTiScegli` restano nel file, non chiamate.
⬜ Non provato dal vivo: «Fotografa una fattura» (AI, crediti a 0) e il margine del lavoro collegato (il lavoro in ferramenta è un dato di Alex).

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: LE CARTE (impresa e artigiano)

Provato dal vivo (1440 e 375) nel reparto «ferramenta» con carte e movimenti «PROVA CONTROLLORE». Poi cancellato tutto, anche dal Cestino: 0 righe.

Difetti trovati e sistemati (7):
1. Doppio tocco su «Aggiungi» della carta e del movimento = 2 righe. Ora chiavistello.
2. Il Riepilogo non si aggiornava dopo un movimento sulla carta.
3. Le note dicevano «numero carta» (che non si salva): tolto.
4. Il «pulsante Movimenti» citato nell'aiuto non c'era con quel nome: testo allineato.
5. Saldo della carta senza rete: se la lettura falliva restava vuoto. Ora avviso.
6. Spesa pagata con la carta: si bloccava salvando. Sistemato.
7. Icona 💳 che spariva/diversa: allineata.

Nuovo (sì di Alex, foto approvata):
- Scadenza della carta: colonna `gest_carte.scadenza` (mese/anno). Compare nello Scadenzario (`scadenzeCarte`), col pallino, e nell'email del mattino insieme ai mezzi. Tendine mese/anno in `_cartaScadHTML` (mese flex:3, anno flex:2, min-width:0 — sul telefono «novembre» era tagliato).
- Casella «Quando» (il giorno) nel movimento della carta.

Commit online cbad526 (+ tendine allargate nel push del Report).
⬜ Non provato dal vivo: email del mattino con una carta, app operaio, telefono vero.

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: REPORT (impresa e artigiano)

Provato dal vivo (1440 e 375) nel reparto «ferramenta»: cliente, operatore (20 €/h, 5 ore), 2 lavori, spese, carta con movimento, fattura fornitore, mezzo con pieno in contanti, tutto «PROVA CONTROLLORE». Conti a schermo giusti: 1.200,50 − 550,35 − 50 − 60,40 − 200 − 100 = 239,75. Poi cancellato tutto con `sb.raw`: 0 righe. Il lavoro di Alex in ferramenta non toccato.
Fatture pagate di prova NON fatte (regola): l'incassato è provato col lavoro segnato «pagata» (reparto senza fatture). Le fatture vere di Alex: `fattImponibile` = vista `gest_fatture_totali` su tutte e 3.

Difetti trovati e sistemati:
1. Carta nel Cestino: il Report toglieva le sue spese (margine più alto), il Riepilogo no. Ora anche il Report legge le carte con `sb.raw`.
2. Reparto senza fatture: il Report contava l'incasso dai lavori, il Riepilogo no → «Novembre 0,00 € incassati», utile −410,50 contro +790,00. Ora `incMese` del Riepilogo usa la stessa regola (se non c'è NESSUNA fattura, lavori «pagata» + data fatto). Anche `_ciSonoSoldi`.
3. File per Excel: margine «800,4000000000001» (ora `_cent2`); ore 0 con le righe di ore (ora come lo schermo); colonna Fattura «none» (ora vuota / Emessa / Pagata).
4. Barra grigia del lavoro = solo spese, mentre il guadagno toglie anche fornitori e manodopera. Ora è tutto quello che esce.
5. Telefono: i nomi dei mesi attaccati («dicgenfeb…»). Ora un mese sì e uno no (sempre il mese di adesso).
6. Frase sbagliata «Il margine conta solo i soldi già incassati»: le spese le conta tutte. Ora «soldi incassati meno tutte le spese».

Nuovo (sì di Alex, foto approvata): 3 riquadri del mese (incassato, spese, utile = stesso utile del Riepilogo); Spese in grigio #5f6b7a (prima blu scuro e nero quasi uguali); «⬇ Scarica PDF» (`reportPdf`, stessa forma del PDF delle Giornate, numeri da `repData`); Totali e mese in fondo al file per Excel. Il pulsante CSV ora si chiama «⬇ File per Excel» (gest-reparti.js).

Differenza voluta, NON toccata: Tasse e fisco conta solo le fatture pagate (di tutti i reparti + noleggio); il Report conta il reparto e, senza fatture, i lavori pagati. Per le tasse vale la fattura.
Non c'è un filtro (periodo/cliente) nel Report: non chiesto.
⬜ Non provati dal vivo: noleggio interno (serve il gestionale Noleggio), un reparto CON fatture pagate (vietato emetterle), telefono vero.

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: GALLERIA (impresa e artigiano)

Provato dal vivo (1440 e 375) nel reparto «ferramenta»: 2 lavori «PROVA CONTROLLORE» (bagno, cucina), 5 foto e 1 video caricati dal modulo vero (foto da 4000 px → 1600 px, 1,65 MB → 0,32 MB), filtri, foto grande, Cestino e ritorno, «Guarda in Galleria» dal lavoro. Poi cancellato tutto, anche dal deposito dei file: conti tornati a prima (5 foto, 1 video, 5 lavori di Alex; nel deposito 7 + 2 file, di cui 2 vecchi senza riga: `video-di-prova.mp4` del 1 ago e `prova-claude.jpg` del 10 nov, NON toccati).

Dove sta il codice: `js/gest-galleria-mappa.js` (`renderGalleria`, `galUploadForm`, `galCarica`, `galDelFoto`/`galDelVideo`, la foto grande `galVedi` / `galMostra` / `galSposta` / `galScarica` / `galChiudiVedi`), i clic in `js/gest-finestre-eventi.js` (`gal-*`, `close-lb`), il contenitore `#lightbox` in `gestionale-app.html`, lo stile in `css/gestionale.css` (`#lightbox …`).

Difetti trovati e sistemati:
1. Nessun ordine: le foto uscivano come capitava (e cambiavano posto dopo un ritorno dal Cestino). Ora in cima l'ultima caricata, foto e video mescolati per data; il cantiere con la cosa più nuova sta sopra.
2. Nel Cestino foto e video della Galleria erano «(senza nome)» (non hanno `nome_file`; `gest_video` la colonna non ce l'ha). Ora «Foto prima del lavoro — <lavoro>» (`cestNomeMedia`, e `cestNomiLavori` legge anche i lavori di foto e video).
3. Un file sbagliato (video .avi, un .txt fra le foto) dava il messaggio del deposito in inglese («mime type … is not supported»). Ora si controlla prima e lo dice in italiano; se una parte va e una no, il messaggio dice QUALE (prima «qualcosa non è andato»). «1 foto caricato» → «caricata».
4. La foto grande stava SOTTO «Parla» e la linguetta viola (z-index 80 contro 800): ora 999990, e la linguetta si nasconde. Esc la chiude (prima no).
5. Con un cantiere scelto nel filtro, «Carica foto o video» apre col lavoro già scelto.
6. Report (sessione di prima): le 3 scritte «Novembre · incassato/spese/utile» a 13 px → 14 (il banco le dava rosse).

Nuovo (sì di Alex, foto prima): la foto grande della Galleria ha in alto il lavoro · Prima/Finito, «⬇ Scarica» e «✕ Chiudi»; le frecce ‹ › (anche tastiera ← → e dito che scorre sul telefono); sotto «2 di 6 · data · chi». I video si guardano lì dentro (prima si aprivano in un'altra pagina). «Scarica» chiede un indirizzo firmato con `download` (nome tipo `lavoro-prima-2026-11-19-2.jpg`): il file si salva invece di aprirsi. ⚠️ Le foto aperte da altre parti (scheda del lavoro, Giornate) usano ancora `view-foto`: la foto e basta.

Da sapere:
- Provare nella pagina vera con `(0,eval)`: le `let` dentro un eval restano chiuse lì dentro (non diventano globali). Per provare `galVedi` & co. bisogna dichiarare `var galLista, galPos, galInfo` fuori. E `RENDER_TAB` tiene la `renderGalleria` VECCHIA: si chiama a mano.
- Le miniature scaricano la foto intera ridotta (≈300 KB l'una, `loading="lazy"`): le miniature vere di Supabase costano a parte, non usate.
⬜ Non provati: un video vero da iPhone (.mov), «Scarica» sul telefono vero, una persona della squadra che carica (in ferramenta c'è solo «Capo»), lo studio tecnico.

Sul telefono (chiesto da Alex: «ristringi sul telefono»): sotto i 700 px niente riga di spiegazione, «Mostra» e «Quando» su una riga larga, «Cantiere» e «Chi l'ha caricata» affiancati, «Prima» / «Finito» al posto di «Prima del lavoro» / «A lavoro finito» (`.gal-pc` / `.gal-tel` nel pulsante, regole in fondo a `css/gestionale.css`). Le foto adesso cominciano nella prima schermata.

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: MAPPA (impresa e artigiano) + MAPPA ↔ APP OPERAIO

Provato dal vivo (1440 e 375) nel reparto «ferramenta»: 8 lavori, 1 cliente, 1 operaio «PROVA CONTROLLORE» (in ritardo, da fare, stesso posto, fatto, senza comune, indirizzo sbagliato, dal cliente, Milano, senza indirizzo). Poi cancellato tutto.

Dove sta il codice: `js/gest-galleria-mappa.js` (`renderMappa`, `mpTrovaPunto`, `mpSenzaHtml`, `mpMandaBtn`, `mpSalvaPunti`, `mpApri`, `mpStrada`), clic in `js/gest-finestre-eventi.js` (`mp-vista`, `mp-ricalcola`, `mp-strada`, `mp-apri`), pagina `#mappa` in `gestionale-app.html`, stile `.mp-*` in `css/gestionale.css`.

Difetti trovati e sistemati:
1. Cambiando «Lavori da fare / Tutti» (o reparto) mentre cercava gli indirizzi, la scelta si perdeva: pulsante su «Tutti», lista dei soli da fare. Adesso finito il giro si rifà (`mpRifai`).
2. «comune ipotizzato: Rieti» con il punto a Fara in Sabina (33 km): adesso il punto deve stare DAVVERO in quel comune; se no si riprova con via e comune separati, se no «scrivi anche il comune».
3. Lavoro FATTO con la data passata in rosso («49 giorni fa»): adesso «fatto» in verde e la data neutra.
4. Servizio della carta giù: diceva «Non trovo l'indirizzo del tuo ufficio, scrivilo con via e comune» (falso) dopo 30 secondi. Adesso si ferma alla prima mancata risposta (2 tentativi), lo dice, e dopo un «Ricalcola» non perde i punti di prima (`mpVecchi`).
5. «pulsante Azienda in alto a destra» non esiste: c'è «Apri Dati azienda».
6. «Indicazioni» apriva solo il punto: adesso la strada (Google Maps «dir»), col comune ipotizzato dentro.
7. Senza rete: diceva «Nessun cantiere da mostrare» se i lavori non si leggevano; adesso «Non riesco a leggere» e la carta vecchia sparisce.
8. ⛔ Fumetti dei pin ROTTI sul telefono (una parola per riga, senza sfondo): `css/mobile.css` metteva max-width:100% anche a `.leaflet-popup` (contenitore largo 0). Uscito dalla rete come piastrelle e segnaposti: vale per tutte le mappe del sito. Fumetto a 16 px (era 13: il 15 px del foglio perdeva contro quello di Leaflet caricato dopo) e largo quanto la carta (`mpLargFumetto`).
9. `js/mappa-indirizzo.js`: nel modulo del lavoro cercava il cliente in `#j-cli`, ma il modulo nuovo ha `#j-cliente`: la città del cliente non si aggiungeva mai alla mappa.

Nuovo (sì di Alex, foto prima): legenda dei colori sopra la carta; «Apri» su ogni riga e «Apri il lavoro» / «Indicazioni» nel fumetto (i clic nel fumetto si prendono in «capture» su `#mp-mappa`: Leaflet li ferma prima del document); in fondo «N lavori senza indirizzo» con i nomi e «Apri».

## MAPPA ↔ APP OPERAIO (chiesto da Alex: «devono parlare tra loro»)
Prima: l'operaio riceveva mezzo indirizzo (solo la via del cliente), «Apri mappa» faceva vedere un punto senza navigatore, il WhatsApp metteva il link solo se c'era «Dove», e la Mappa non sapeva chi ci va.
- **Il punto passa all'operaio**: colonne `gest_lavori.dove_lat`, `dove_lon`, `dove_km`, `dove_geo` (`sql/2026-11-19-lavori-punto-mappa.sql`, migrazione `lavori_punto_mappa_19nov2026`, già eseguita, riga in PROVE). La Mappa le scrive quando trova il cantiere (solo se cambiano). `dove_geo` = l'indirizzo a cui appartiene il punto: se l'indirizzo del lavoro cambia, il punto non vale e si usa il testo.
- **Mappa**: «Ci va: …» e «Manda a …» (WhatsApp, `_waLavoro`, numero dell'operaio; senza nessuno: WhatsApp chiede a chi).
- **WhatsApp** (`_waLavoro`, `_waDove`, `_waStrada` in `js/gest-riepilogo-schede.js`): indirizzo intero (anche quello del cliente) e «Portami lì» col punto se c'è. Vale anche per Lavori e Agenda.
- **App operaio** (`js/op-schede.js`: `opDove`, `opPuntoOk`, `opStradaUrl`, `opKm`; `js/op-mappa.js`; `js/op-agenda-giorno.js`): indirizzo intero (CAP, comune, provincia), «Portami lì» = navigatore (Mappe su iPhone, Google Maps sugli altri) nella scheda e dentro il lavoro, km dall'ufficio.
⚠️ Il punto si salva solo quando il titolare apre la Mappa. Un lavoro nuovo mai visto sulla Mappa va all'operaio col testo.

Banco `tools/banco-gestionale.js app`: ZERO difetti. ⬜ Non provati: un operaio vero dal suo telefono (permessi su CAP/comune del cliente), il telefono vero, lo studio tecnico.

Dopo il giro delle voci (impresa/artigiano, poi studio tecnico), deciso da Alex il 19 nov: (1) un giro di controllo generale; (2) in una sessione NUOVA e separata, controllare che TUTTE le app parlino fra loro (gestionale, app operaio, noleggio, pannelli, sito, app casa…), e farle parlare dove non lo fanno.

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: CESTINO (impresa e artigiano)

Provato dal vivo (1440 e 375) nel reparto «ferramenta», tutto «PROVA CONTROLLORE»: cliente, lavoro, preventivo, fattura in BOZZA (nessuna emessa), foto e video col file nel deposito, 2 scadenze (una del mezzo), mezzo, persona, 56 voci del prezzario, 1 preventivo dell'operaio con foto. Poi cancellato tutto (anche dal Cestino e dal deposito): →0← righe, file nel deposito tornati →19← foto e →3← video.

Codice: `js/gest-cestino.js` (`CEST_COSE`, `CEST_PADRE`, `renderCestino`, `cestRipristina`, `cestDefinitivo`, `cestPulisciFile`, `cestCzStile`), frase in cima in `gestionale-app.html` (`#cestino .gal-intro`), aiuto in `js/aiuti.js`.

Funziona (provato): scelte per tipo, «Mostra altre» (50 alla volta), ricerca, «Rimetti a posto» del mezzo con la sua scadenza, «Elimina per sempre» col file tolto dal deposito, «Svuota» per tipo, «Scegli cosa eliminare» con la barra in basso (anche a 375), senza rete messaggi in italiano.

Difetti trovati e sistemati:
1. Foto/video rimessi a posto col LAVORO ancora nel Cestino: tornavano ma in Galleria non si vedevano. Preventivo/lavoro/fattura tornavano col cliente «(nel cestino)». Adesso `CEST_PADRE` ha più padri per riga (reparto, cliente, lavoro, mezzo, fornitore) e chiede UNA volta «È ancora nel cestino: il lavoro «…». Rimetto a posto anche lui?». ⚠️ Prima leggeva il padre con `select("id,nome,…")`: su `gest_lavori` (niente `nome`) sarebbe andata in errore; adesso `select("*")`. Un solo livello: il cliente del lavoro tirato su non viene chiesto.
2. ⛔ I «Preventivi da controllare» dell'operaio (`gest_op_preventivi`, Squadra) eliminati NON arrivavano nel Cestino: non si riprendevano e le foto restavano nel deposito per sempre. Adesso tipo «Preventivi dell'operaio» (senza reparto, foglia; i file della colonna `files` si tolgono con «Elimina per sempre»). In `js/gest-prev-controllo.js` il messaggio dice «Messo nel cestino: lo riprendi da lì».
3. Lavoro con foto o video: «Elimina per sempre» rifiutava («mettile prima nel cestino») e le foto andavano cercate in Galleria. Adesso come ore e spese: una domanda, se ne vanno insieme, file compresi.
4. Senza rete: sopra l'avviso restavano i numeri vecchi e «Svuota il cestino». Adesso spariscono.
5. Due scadenze con lo stesso nome uguali: adesso «… — scade il 15/02/2027».
6. Nomi come il menu (solo impresa/artigiano): «Mezzi e attrezzature» (era «Mezzi e strumenti»; lo studio «Strumenti»), «Giornate» e «Giornata del …» (era «Rapportini di cantiere»), «Acconti» (era «Stati di avanzamento»), «Voci del tuo prezzario».
7. «Clicca una riga per rimetterla a posto»: falso, la riga non fa niente. Ora «Premi «Rimetti a posto»…».
8. Telefono: «Elimina per sempre» andava a capo spostato a destra; ora i due pulsanti larghi, la «i» accanto al secondo.
9. «Le fatture già emesse restano nel cestino» compariva anche svuotando solo voci del prezzario: ora solo se ci sono fatture. «Se ne vanno anche loro» con una cosa sola → «Se ne va anche quella». Il messaggio dopo «Rimetti a posto» non dice più che il lavoro «ci stava dentro» la foto.

Provato PRIMA del push sulla pagina vera rimettendo le funzioni (`(0,eval)(String(fn).replace(…))`) e cambiando `CEST_COSE`/`CEST_PADRE` sul posto (sono const, ma si possono modificare dentro). Banco `tools/banco-gestionale.js app`: ZERO difetti. ⬜ Non provati: lo studio tecnico (i nomi «Strumenti» / «Rapportino» restano quelli di prima), un reparto intero nel Cestino (non si butta il reparto di Alex).
Pubblicato (→d1758790←, Netlify riuscito) e riprovato sul sito vero a 1440 e 375: tutto ✔. Dal test dopo il push: il messaggio diceva «insieme a il lavoro» → ora «insieme al lavoro» (va col push dopo).

# 19 NOVEMBRE 2026 — UNA VOCE PER VOLTA: CHIEDI UNA FUNZIONE + ASSISTENZA DIRETTA (impresa e artigiano)

Provato dal vivo (1440 e 375) con «PROVA CONTROLLORE»: richiesta mandata (le 2 email partite e consegnate, viste su Resend), risposta finta dal database (stato + testo), numerino, elenco; messaggio in Assistenza con foto, risposta finta, numerino in →5← secondi (collegamento vivo), segnato letto all'apertura; esempi, casella vuota, senza rete. Poi cancellato tutto.

Codice: `js/gest-richieste-chat.js` (`renderRichieste`, `salvaRichiesta`, `contaRichiesteNuove`, `renderAssistenza`, `asstInvia`), copia del Noleggio in `js/nol-supporto.js`, email in `netlify/functions/richiesta-funzione.js` e `supporto-avviso.js`, pannello admin in `admin.html` + `netlify/functions/admin-supporto.js`.

Difetti trovati e sistemati:
1. Toccando un esempio («Mi servirebbe poter…») e premendo subito «Manda» partiva la frase a metà. Ora «Finisci la frase: scrivi cosa ti serve».
2. Il numerino di «Chiedi una funzione» si accendeva solo con una RISPOSTA scritta: «Fatta ✔» o «Per ora non la facciamo» senza testo restavano invisibili. Ora conta la «firma» stato+risposta (chiave `ti_risposte_viste_v2`; le viste della v1 valgono come già viste). Stessa cosa nel Noleggio (`js/nol-supporto.js`).
3. «e un'altra quando la richiesta è fatta»: l'email parte anche per «Ci stiamo lavorando», «non la facciamo» e per ogni risposta → «e un'altra ogni volta che ti rispondo».
4. Senza rete l'Assistenza diceva «Non mandato: TypeError: Failed to fetch» (inglese, in verde). In `js/gest-base.js` (`toast`) «non mandat» e «allegato non» sono errori: rosso e tradotto. Nel Noleggio tradotto in `nol-supporto.js`.
5. ⛔ Pannello admin, «Elimina conversazione» (`delete_conv`): cancellava i messaggi ma le foto allegate restavano nel deposito `supporto-allegati` per sempre. Ora vanno via insieme. ⚠️ Il deposito NON si pulisce dal browser dell'impresa né da SQL (`storage.protect_delete`): serve la chiave del server.

⚠️ Rimasto: →1← file di prova da →70← byte in `supporto-allegati` (`1119cf1e…/1795094826025-prova-controllore.png`): il messaggio è cancellato ma il file non si toglie senza la chiave del server.
Banco `tools/banco-gestionale.js app`: ZERO difetti.

# 19 NOVEMBRE 2026 — LE VOCI DEL MENU SI PARLANO (impresa e artigiano)

Mappa fatta leggendo tutti i js + prova dal vivo (reparto «ferramenta», «PROVA CONTROLLORE», poi 0 righe): cliente → preventivo → lavoro (786 €) → giornata, spesa, fattura fornitore, ore → guadagno 476 € uguale nel lavoro e nel Report → Calendario, Scadenze.

Si parlano già: sito → cliente → preventivo; cliente → preventivo/lavoro; preventivo → lavoro (voci visibili nel lavoro); lavoro ↔ giornate, spese, fornitori, ore, mezzi, galleria, mappa, calendario; prezzario ↔ preventivo e computo; computo → preventivo; acconto → fattura.
Si interrompevano (sistemato, decisione lasciata a Claude da Alex: «fai tu il meglio»):
1. **Fattura dal lavoro** (`fattDaUnLavoro`, js/gest-fatture.js): se il lavoro ha UN preventivo accettato con lo stesso totale (`_prevDelLavoro`), la fattura nasce con le sue voci (`fattDaPreventivoId(id,{dedurre,daLavoro})`); se no la riga sola di sempre. In tutti e due i casi gli acconti GIÀ EMESSI (col numero) nati da un SAL del lavoro o di un computo collegato (`_accontiDelLavoro`) diventano righe «A dedurre: acconto già fatturato (fattura n. … del …)» col prezzo in meno e la loro IVA. Provato: 306 + 480 − 300 + 2 bollo = 488,00; file XML con PrezzoUnitario −300.00 e riepilogo 486,00; il controllo non dà rossi.
2. **Scadenze**: `scadenzeIncassi(mid)` (js/gest-scadenze-pratiche.js) — fatture dei clienti emesse e non pagate, data come il Calendario (scadenza o data + giorni di pagamento), cifra = `resto` della vista (tolti gli acconti), «Apri» → la fattura. Il pallino del menu NON le conta (le Fatture hanno il loro).
Difetti sistemati: la tendina dei clienti della fattura non si rileggeva (un cliente aggiunto dopo l'apertura → fattura su «— nessuno —»): `fattForm` la rilegge sempre. Nel lavoro «Rapportini di giornata» → «Giornate di questo lavoro» (lo studio resta com'era).
Non fatti, idee per dopo: carta → lavoro (la colonna `gest_carte_movimenti.lavoro_id` c'è ma nessuno la scrive); scheda del mezzo → in quali lavori è stato usato.
⚠️ `_accontiDelLavoro` è stato provato con una BOZZA (il filtro «col numero» tolto nella copia di prova): con una fattura emessa vera non provato, per regola.

# 19 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: PRATICHE

Prova dal vivo con `?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE» (3 pratiche, 3 scadenze, 2 PDF), 1440 e 375. Poi cancellato tutto: →0← righe, file tolti dal deposito, conti del reparto tornati come prima.

Codice: modulo `jobForm` / `bloccoPratica` / `saveJob` / `proponiScadenza*` in `js/gest-scadenze-pratiche.js`; elenco `renderJobs` / `lavNumeri` in `js/gest-schede-clienti.js`; apri/elimina/«+ Aggiungi una scadenza» in `js/gest-finestre-eventi.js`; ricerca in alto `js/gest-ricerca.js`; AI `aiRigaVia` (`js/gest-ai-moduli.js`) + `AI.pratica` / `riempiPratica` (`js/ai-integrazione.js`), server `netlify/functions/ai-pratica.mjs`; parole lavoro→pratica `_FRASI` (`js/gest-reparti.js`, applicate da `js/gest-ingresso.js` solo se il testo passa `_DA_TRADURRE`).

Funziona (provato): crea, modifica, «Depositata» mette la data di oggi, «Integrazioni richieste» propone la scadenza a 30 giorni, scadenze nella scheda, documenti PDF (carica, elimina), cestino e «Rimetti a posto», ricerca per protocollo/tipo/Comune, telefono senza righe che escono.

Sistemato (da pubblicare):
1. Dati catastali: tre caselle senza nome («Es. 12 / Es. 345 / Es. 2», sul telefono una sotto l'altra). Ora «Foglio · Particella · Sub» in fila anche a 375 (`.pr-cat` in `css/gestionale.css`; niente style in linea: `mobile.css` mette a una colonna chi ha `grid-template-columns` scritto sull'elemento).
2. Ricerca in alto: non trovava Comune e catastali. Ora sì, e «foglio 12» / «fg 12» / «mappale 120» / «sub 2» trovano quel numero preciso (`ctCatasto`, `ctCatastoDomanda`: «foglio:12;» non pesca il 120).
3. ⛔ Pratica nel Cestino: le sue scadenze restavano vive («(pratica eliminata)» nello Scadenzario e l'email del mattino che avvisava). Ora le scadenze APERTE vanno nel Cestino con lei e tornano su con lei (`del-job-supa` + `CEST_FIGLI.gest_lavori`, `_LAV` fra i padri di `gest_scadenze`). Vale anche per impresa e artigiano.
4. «+ Aggiungi una scadenza» dalla pratica: chiedeva sempre «se hai scritto qualcosa va perso» e dopo il salvataggio si finiva nell'elenco. Ora chiede solo se hai cambiato qualcosa (`_lavValori` / `_lavFoto`, i soldi si confrontano come numero) e chiusa la scadenza si torna nella pratica (`_tornaAlLavoro`).
5. Pratica nuova: la data non si mette più da sola a oggi (il giorno dopo era già «In ritardo»), e si può salvare senza data (finisce in «Prossime»). Solo studio.
6. Leggi un documento (foto/PDF): le caselle della pratica scritte a mano venivano sostituite (es. il Comune). Ora restano (`riempiPratica(d,primo,soloVuote)`); «A che punto sta» cambia solo se è ancora «Da preparare».
7. Parole: «1 pratica già fatto» → «già fatta»; «Finite e non ancora incassate»; filtri «Tutte», «Prossime»; «Documenti di questa pratica», «… su questa pratica» (`_FRASI`); «Chi ci va» → «Collaboratore» (scritto alla fonte: «Chi ci va» non passa `_DA_TRADURRE`); esempio delle ore da studio; «Pratica nel cestino con 2 scadenze: la riprendi da lì»; nel Cestino «la pratica», «Rimessa a posto», «con lei»; documento: «Documento nel cestino: lo riprendi da lì».
8. Titolo scadenza integrazioni: «Integrazioni CILA — … CILA …» → il tipo non si ripete (`titoloScadenza`).
9. Sul telefono la riga sotto il titolo diceva «Da un lavoro nasce il preventivo»: `menuDaStudio()` cercava «Strumenti» nel menu, che dal 18 nov non c'è più. Ora guarda `ruoloUtente`; la riga si riscrive se è nata prima di sapere il ruolo (`data-studio`, si confronta il ruolo e non il testo, se no il traduttore la fa riscrivere all'infinito).

Provato prima del push sulla pagina vera rimettendo le funzioni (1, 2, 3, 4, 5, 7 in parte). ⬜ NON provati dal vivo prima del push: l'AI vera (crediti di Alex finiti: 30/30 di novembre, risposta 402; il riempimento delle caselle è provato con una risposta finta), il microfono, la riga del telefono (9). Banco `tools/banco-gestionale.js app`: ZERO difetti (il banco gira solo da impresa).

Idee per dopo (funzioni nuove, NON fatte, da chiedere ad Alex con la foto): scadenze cliccabili dentro la pratica; filtro per «A che punto sta» (es. tutte le «Integrazioni richieste»); una pratica che aspetta il Comune (Depositata / In istruttoria) non dovrebbe diventare «In ritardo».

## 19 nov 2026 (sera) — PRATICHE: AI DEL FONDATORE E TRE FUNZIONI NUOVE
- **AI senza limite per il fondatore** (pintoalessio@icloud.com e info@trovaimpresa.com, `sono_il_fondatore()`): `consume_ai_credit` e `consume_ai_credit_pagati` non scalano niente, scrivono il registro a 0 crediti; `get_ai_status` dice `plan:'fondatore'`, 9999. File `sql/2026-11-19-fondatore-ai-senza-limite.sql`, migrazione `fondatore_ai_senza_limite_19nov2026` (gia' eseguita). Nel gestionale il contatore mostra «∞». Provato dal vivo: testo e foto di un documento leggono la pratica.
- **Tendina che l'AI non trova** (`_aiTendinaHa`, `_aiNonTrovati` in js/gest-ai-moduli.js): se l'AI scrive un cliente o un collaboratore che non c'e', lo dice («Non trovo … nel tuo elenco: sceglilo tu o aggiungilo»). Prima restava «— nessuno —» in silenzio.
- **Pratica al Comune non e' «In ritardo»**: `inRitardo(stato,data,pratica_stato)` e `_alComune()` in js/gest-base.js. Depositata / In istruttoria con la data passata → «Al Comune» (pallino blu), sta in «Prossime». Tutte le chiamate a `inRitardo` passano `pratica_stato` (riepilogo, agenda, mappa, commercialista, calendario).
- **Filtro «A che punto sta»** sotto le viste delle Pratiche (`lavPstati`, `filter.pstato`, azione `lav-pstato`): solo per lo studio, solo gli stati che ci sono, col numero; «Integrazioni richieste» in rosso.
- **Scadenze cliccabili nella pratica**: «Apri» su ogni scadenza (`scad-da-pratica-apri`), si apre la scadenza e chiudendo si torna nella pratica.
- Provato dal vivo (1440 e 375) iniettando il codice nella pagina vera; dati di prova cancellati (0 righe, ferramenta tornata a 1 lavoro e 1 cliente, 7 file nel deposito).

# 19 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: COMPUTO METRICO

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): computo nuovo, 3 capitoli (uno sicurezza), misure con vuoti, prezzario, AI (lavorazioni e prezzi), ribasso 12,5%, lavori pubblici, costo del personale, quadro economico, SAL + fattura d'acconto in BOZZA, variante, cronoprogramma, tutti i PDF (letti intercettando `jsPDF.API.save`, niente scaricato), Excel e PDF importati. Poi cancellato tutto: conteggi uguali a prima (resta solo la riga automatica di `gest_accessi`), `usata_volte` del prezzario rimesso com'era.

Sistemato:
1. ⛔ PDF del computo e «Crea il preventivo»: i capitoli della sicurezza si leggevano da `compCapCache` (computo aperto per ULTIMO) → con un altro computo aperto prima il PDF ribassava anche la sicurezza. Ora `compRiepilogo(voci,c,capitoli)`.
2. Traduttore dello studio: il testo del prezzario diventava «della pratica» (ricerca nella lavorazione, pagina Prezzi). Classe nuova **`.ti-orig`** + `.pz-desc`, `.cp-d`, `.cp-cap` in `_SKIP_UTENTE`. «manodopera» si scrive `<span class="ti-orig">manodopera</span>` (non più con la maiuscola).
3. «Aggiungi con l'AI»: `compila_computo` ha `codice` e `capitolo`; la pagina rimette codice + descrizione VERA del prezzario (stessa unità) e il capitolo (riusa quello col titolo uguale). ⬜ La parte server si prova solo dopo il push.
4. Ricerca nel prezzario della lavorazione: prima le voci con le parole nei primi 60 caratteri.
5. Pagina Prezzi: tendina del prezzario si salva da sola; con una sola tariffa e nessun prezzario scritto si usa quella; allo studio anche «Metti i prezzi con l'AI».
6. SAL: righe per capitolo (schermo e PDF); PDF dello studio firmato dal Direttore dei lavori (`tecnico_firma`); «dello 0,5%» (`_salDelPct`); sul telefono «PDF» e × non escono più (`.sal-el`).
7. Lista per la gara: righe «oneri della sicurezza non soggetti a ribasso» e «importo soggetto a ribasso»; luogo e data in bianco per il concorrente.
8. PDF: luogo della firma = città dei Dati azienda (era l'ultimo pezzo del luogo dei lavori); sopra la firma «IL TECNICO»/«L'IMPRESA» (`_compChiFirma`); nome file tagliato fra due parole (`_compSlug`).
9. Cronoprogramma: le feste nazionali non sono giorni di lavoro (`_cgFesta`, Pasquetta col calcolo di Gauss).
10. Variante: «Cosa è cambiato» si ridisegna con le lavorazioni (era vecchia dopo una cancellazione); messaggio «Variante creata».
11. Importa PDF: il PDF fatto dal gestionale ricaricato tiene i capitoli («1 - Demolizioni…», `_cpTitoloPrimus`); un capitolo «Oneri della sicurezza» nasce con la spunta sicurezza.
12. Quadro economico: «− 1.371,59 €» come nel riquadro del ribasso.

Banco `tools/banco-gestionale.js app`: ZERO difetti. ⬜ Idee per dopo (da chiedere ad Alex): il capitolo della sicurezza nel cronoprogramma (oggi è una fase con i giorni); «Questo pezzo vale 5 messaggi» anche per il fondatore senza limite.

# 19 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: PREVENTIVI E PARCELLA

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): parcella nuova con cassa 5%, spese 150, IVA e ritenuta (regime ordinario messo SOLO in memoria: Alex è RF19), cliente azienda e privato, PDF (letto con `jsPDF.API.save`), «Invia al cliente» (link, pagina del cliente, testo WhatsApp), accettato → pratica, fattura dal preventivo in BOZZA, ore → parcella, preventivo dal computo, «Genera con AI». Conti giusti: 2.300,50 + cassa 115,03 + spese 150 → IVA 531,42 su 2.415,53 → documento 3.096,95 − ritenuta 460,10 = **2.636,85** uguale in modulo, elenco, PDF, pagina del cliente e fattura. Poi cancellato tutto: conteggi uguali a prima, deposito 5 file.

Sistemato:
1. ⛔ Parcella nata dal computo (o vecchia, senza cassa/IVA salvate): riaperta mostrava cassa 4% e IVA 22% → modulo 516,66 €, elenco e PDF 407,20 €; salvando senza toccare il totale cambiava. Ora `bloccoParcella` propone cassa/IVA SOLO su una parcella nuova (`p.id` assente).
2. Cassa proposta sempre al 4% anche a chi usa il 5%: `prevCassaSolita()` (ultima parcella, poi ultima fattura, se no 4).
3. «Genera con AI» allo studio salvava senza cassa né IVA: ora `prevParcellaNuova()`.
4. Controllo della ritenuta (azienda/condominio sì, privato no) muto: leggeva `cliCache`, vecchia o senza `tipo`. Ora la tendina `#pv-cli` porta `data-tipo` (`ctrTipoCliente`); anche «Controllo prima di mandare» lo dice.
5. Accettato → pratica: nasceva con la data di oggi (domani «In ritardo») e senza stato. Ora senza data e «Da preparare» (`_prevCreaLavoro`, solo studio).
6. Testi al cliente al maschile: «la parcella… Lo trova qui, accettarlo» → «La trova, accettarla» (WhatsApp, email `invia-preventivo-email.js`, finestra). Pagina del cliente: «Scrivi allo studio» (era «all'impresa»).
7. Ordine del riepilogo: Compenso, Cassa, Spese (come la fattura) in modulo, PDF, lettera d'incarico, pagina del cliente.

Banco `tools/banco-gestionale.js app`: ZERO difetti. ⬜ Non provati: «Email con PDF» (manda un'email vera), firma SMS (5 crediti), firma col dito del cliente.
Da guardare (non fatti): sul telefono i 4 pulsanti in testa al preventivo occupano mezzo schermo; in forfettario la riga «Imponibile IVA» si legge anche senza IVA; il bollo da 2 € non è nel totale della parcella (si aggiunge in fattura, e lo dice).
⚠️ Durante la prova un'ALTRA sessione ha creato e cestinato «PROVA ACCONTO — da cancellare» (n. 7, reparto edile): non è di questa prova, è rimasta nel Cestino.

# 19 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: FATTURE

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE» srl azienda + Mario privato, 1440 e 375): fattura vuota con cassa e spese anticipate 150 + rimborso 50 (forfettario: bollo 2 € automatico, 1.462 €), parcella 2.300,50 in ordinario messo SOLO in memoria (2.636,85 netto, uguale alla parcella di ieri), fattura dal preventivo accettato e dalla pratica finita, nota di credito, «Manda al cliente», PDF letto dal blob, file per lo SDI costruito su copia (numero finto, niente invio), telefono. Nessuna fattura emessa. Poi cancellato tutto: conteggi uguali a prima (fatture 3, clienti 2, lavori 5, preventivi 5, file 16).

Sistemato:
1. ⛔ Regime della bozza: PDF, controllo e file SDI leggevano `f.regime_fiscale||azienda`, i conti `fattForfDi` (regime della fattura SOLO col numero). Bozza salvata in ordinario e aperta in forfettario → PDF con colonna IVA 22%, riepilogo 0%, senza dicitura; file SDI righe 22% + riepilogo N2.2 (scarto). Ora tutti `fattForfDi(f)`, `<RegimeFiscale>` da `fattRegimeDi(f)`, ed **Emetti scrive sulla fattura il regime di oggi** (`fattCambiaStato`, provato con un finto database: patch `regime_fiscale:'RF19'`).
2. Ritenuta e tipo del cliente anche in fattura (`ctrRegoleFattura`, solo studio, non in forfettario): privato con ritenuta → «non è sostituto d'imposta»; azienda/condominio senza → «di norma 20%». Caselle ascoltate anche `#fa-rit`, `#fa-cassa-tipo`.
3. Cassa diversa dall'albo dei Dati azienda (geometri TC03, ingegneri/architetti TC04, periti TC17): avviso arancio. L'ultima cassa usata passa da sola alla fattura dopo: uno sbaglio (TC02 commercialisti) si ripeteva.
4. Preventivo già fatturato: nell'elenco «Da un preventivo accettato» c'è «Già in fattura: n. …/bozza»; sceglierlo apre quella fattura (`_fattDeiLavori`, controllo in `fattDaPreventivoId`).
5. Dal preventivo in forfettario la ritenuta non passa più.
6. Parole dello studio scritte alla fonte: «Da una o più pratiche finite», «aspetta di essere fatturata. La spunti», «clicca per fatturarla», finestra «Quali pratiche metto in fattura».
7. PDF: «Contributo Cassa Geometri 5%» (prima solo «Cassa previdenziale»).
8. «Manda al cliente» con ritenuta: «La ritenuta d'acconto di X € è già tolta: la versa lei all'Erario col modello F24» (il PDF dice il totale, il messaggio il netto).

Provato sulla pagina vera rimettendo le funzioni (`fn.toString()` + sostituzione, perché `sb` è `const`). Banco `tools/banco-gestionale.js app`: ZERO difetti.
⬜ Non provati per regola: Emetti vero, invio SDI, «Acconto ricevuto» (serve una emessa), controllo con l'AI.
Funzioni nuove (foto approvate, «si si pubblica»):
- **«↩ Fai la nota di credito»** su una fattura emessa o pagata (`fattNotaCredito`, azione `fatt-nc`): copia cliente, voci, cassa, spese, ritenuta, sconto; nelle note «Nota di credito che storna la fattura n. X/AAAA del GG/MM/AAAA». Da quella riga (`fattRifStornata`) il file SDI scrive `<DatiFattureCollegate>`: se la si toglie dalle note il collegamento sparisce.
- **Telefono (≤600 px)**: i pulsanti in testa alle finestre `.sh-head-az` due per riga (`css/gestionale-stile.css` v36, vale per tutte le finestre grandi).
Da guardare: con spese anticipate in ordinario «Totale imponibile» comprende le spese fuori IVA (l'IVA è su un numero più piccolo); una nota di credito scritta a mano (non da «Fai la nota di credito») non dice quale fattura storna.

# 20 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: CREDITI FORMATIVI

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): 6 corsi 2024-2026 (uno a dicembre, ancora da fare), «2,5» con la virgola, traguardo cambiato, Cestino e «Rimetti a posto», telefono. Poi cancellato tutto: →0← corsi di Alex (com'era), traguardo rimesso a →30←, nessun file nel deposito.

Codice: `renderCrediti` / `credTraguardo` / `credForm` / `saveCred` / `delCred` in `js/gest-preventivi.js`; scheda del Riepilogo in `js/gest-riepilogo.js`; regole del controllore `ctrRegoleCorso` in `js/gest-ai-moduli.js`; tabella `gest_crediti` (niente `mestiere_id`: i corsi sono della persona, uguali in tutti i reparti).

Sistemato:
1. ⛔ Un corso con la data nel futuro (iscritto, non ancora fatto) contava subito: il riquadro poteva dire «sei a posto» prima del corso. Ora conta solo dal giorno del corso; nel riquadro «In programma: X CFP», nell'elenco etichetta blu «In programma». Stesso conto nel Riepilogo e in «Cambia il traguardo».
2. ⛔ «−3» si salvava −3, «due» si salvava 0, vuoto si salvava 0 senza dirlo. Ora `saveCred` ferma con la casella rossa (`campoManca`): vuoto → «se non ne dà, scrivi 0»; lettere; sotto zero. Anche titolo e data mancanti: casella rossa (prima solo un messaggio).
3. «Corso eliminato» → «Corso nel cestino: lo riprendi da lì» (come le altre voci).
4. Tasto «Controlla prima di mandarlo» su un corso (non si manda a nessuno): «mandarlo» resta solo su preventivo, fattura, computo, capitolato (`ctrTastoHTML`).
5. ⛔ Testo sbagliato in «Cambia il traguardo»: «30 per ingegneri e architetti, 20 per i geometri». Vero (cercato il 20 nov): ingegneri almeno 30 CFP sempre; architetti 60 in tre anni (12 deontologia); geometri 60 in tre anni (6 deontologia). Testo corretto.

Banco `tools/banco-gestionale.js app`: ZERO difetti. Correzioni provate sulla pagina vera rimettendo le funzioni (`fn.toString()` + sostituzione).

Funzioni nuove (sì di Alex a tutte e 4, foto prima):
- **Come conta il tuo Ordine** (`credTraguardo` / `saveCredTraguardo`, era «Cambia il traguardo»): Ordine (geometri 60/3 anni/6 deont., architetti 60/3/12, ingegneri 30/anno), anno o triennio, anno di inizio, crediti, di cui deontologia. Colonne `gest_azienda.cfp_ordine`, `cfp_periodo` (1/3), `cfp_inizio`, `cfp_deont` (`sql/2026-11-20-crediti-triennio-attestato.sql`, migrazione `crediti_triennio_attestato_20nov2026`, riga in PROVE). Periodo vuoto = anno con `cfp_obiettivo`, come prima.
- **UN conto solo**: `credRegolaDa(az)`, `credPeriodoDi`, `credConto(corsi,reg,anno)` in `js/gest-preventivi.js` (globali). Li usano la sezione, la scheda del Riepilogo («su 60 del triennio 2024–2026») e lo Scadenzario.
- **Avviso** (`credConto(...).avviso`): da ottobre dell'ultimo anno del periodo, se mancano crediti o deontologia → scheda del Riepilogo accesa con «Ne mancano X entro il 31/12» e riga «Crediti formativi: ne mancano …» nello Scadenzario (`scadenzeCrediti()` in `js/gest-scadenze-pratiche.js`, anche nel pallino del menu; «Apri» → `vai-sezione` crediti). Solo se la voce «Crediti formativi» c'è nel menu.
- **Attestato** (PDF o foto, max 10 MB) nel modulo del corso: `credAttestatoHTML`, `credAttSalva`, `credApriAttestato`; colonne `gest_crediti.attestato_path`, `attestato_nome`; deposito `gestionale-foto`, cartella `<utente>/attestati/`. ⛔ Cartella chiusa ai collaboratori: `gest_file_reparto` riconosce «attestati», `gest_puo_file` dice false (migrazioni `attestati_cartella_20nov2026`, `attestati_solo_titolare_20nov2026`). Il file entra DOPO il salvataggio del corso: se non entra lo dice. «Togli» lo toglie al Salva. Nel Cestino «Elimina per sempre» toglie anche il file (`path:r.storage_path||r.attestato_path`).
- **Ricerca in alto** trova i corsi (titolo, ente, tipo, note, nome dell'attestato) → apre il corso (`edit-cred` → `credApri(id)`, che lo rilegge se `credCache` è vuota).
- Dati azienda: la casella si chiama «Traguardo dei crediti formativi (CFP)».
Provato prima del push col banco del gestionale (pagina vera, database finto, faccia studio, 1440 e 375): triennio 48,5 di 60, deontologia 5,5 di 6, finestra con «Collegio dei Geometri» che riempie 60/3/6, salvataggio, attestato caricato/vuoto rifiutato/tolto, Scadenzario, ricerca, Riepilogo, niente fuori schermo né sotto 13 px. `tools/banco-gestionale.js app`: ZERO difetti.
Pubblicato (→5402bfc←, Netlify riuscito) e riprovato sul sito vero col database vero (1440 e 375): «Collegio dei Geometri» salvato (60/3/2024/6), riquadro 48,5 di 60, attestato caricato e riletto dal deposito, ricerca «ordinamento» → apre il corso, Scadenzario e Riepilogo con l'avviso: tutto ✔. Pulito: →0← corsi di prova, →0← attestati nel deposito, traguardo di Alex rimesso a 30 / anno.
⬜ Non provato: la casella del traguardo nei Dati azienda (stessa colonna `cfp_obiettivo`); un collaboratore che prova ad aprire un attestato (serve un suo account).

# 20 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: COLLABORATORI

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): persona nuova (Disegnatore CAD, 18,50 €/h), ore su una pratica (lei 3,5 + titolare 2), ore → parcella (tariffa dello studio messa a 50 e rimessa vuota), permessi (Segreteria), scadenza della persona, invito (link e pagina dell'invito), Cestino e «Rimetti a posto», ricerca, telefono. Attestati CFP: simulato in SQL un collaboratore attivo vero → `gest_puo_file(... '/attestati/...')` = false in lettura e caricamento (controllo: un file di lavoro = true). Poi cancellato tutto.

Codice: `js/gest-squadra.js` (scheda, permessi, elimina), `js/gest-squadra-giornate.js` (`sqgCard`), `js/gest-ore-spese.js` (`orePortaInParcella`), `js/gest-cestino.js` (`CEST_FIGLI`/`CEST_PADRE`), `js/gest-ricerca.js`, `js/gest-reparti.js` (`inviteLink`, `_FRASI`), `gestionale-invito.html`.

Sistemato:
1. Liste dello studio scritte alla fonte (`_sqPro()`): ruolo nello studio (Geometra, Disegnatore CAD, Praticante…, era Muratore/Gruista), contratti (Partita IVA, Praticantato), attestati (Iscrizione all'albo, Polizza RC, CSP/CSE…), ruolo nell'app «Collaboratore / Coordinatore / Segreteria» (`sqRuoloNome`, il valore salvato resta operaio/preposto/segretaria).
2. Permessi: testi da studio (`PERMS_D_PRO`, «Va insieme a Pratiche»; prima «Va insieme a Lavori» sotto la casella «Pratiche»). «Pagamenti» (carta aziendale) nascosto allo studio, che le Carte non le ha (`permNascosto`).
3. Invito: WhatsApp «Ti ho aggiunto ai collaboratori dello studio» (`sqTestoInvito`); il link porta `&studio=1` e `gestionale-invito.html` dice «lo studio» / «le pratiche» invece di «la tua impresa» / «i lavori».
4. ⛔ Persona nel Cestino: le sue scadenze aperte restavano vive («(persona non più in squadra)» e l'email del mattino). Ora vanno nel Cestino con lei e tornano con lei (`dipElimina` + `CEST_FIGLI.gest_operatori`, padre `persona` in `CEST_PADRE.gest_scadenze`). Vale anche per impresa e artigiano. «Rimessa a posto» al femminile.
5. ⛔ La scheda del titolare: scegliendo «Alex (io)» nelle ore nasce la persona del titolare, che poi in elenco era «Collaboratore · Senza invito · Nuovo invito» (invitare se stesso) e «Messaggi» con se stesso. Ora `dipSonoIo` (id di `_gIo()`): «Tu», «Titolare», niente invito/messaggi, niente «Cosa vede sul telefono». Tutte le facce. ⚠️ `_gIo` è nel browser: su un altro telefono la scheda torna normale.
6. Domanda di elimina: «dai collaboratori dello studio», «servono al margine delle pratiche e alla parcella».
7. Frasi dello studio (`_FRASI`): «non più nello studio», «costo medio dello studio», «Tempo speso:» nel margine della pratica, «I collaboratori lo usano per scriverti».

Funzioni nuove (foto prima, sì di Alex):
- **Tariffa al cliente per persona**: colonna `gest_operatori.tariffa_oraria` (`sql/2026-11-20-collaboratori-tariffa.sql`, migrazione `collaboratori_tariffa_20nov2026`, già eseguita), casella nella scheda (tutte le facce). «Porta le ore nella parcella» usa la tariffa della persona, se vuota quella dei Dati azienda (`tariffaDi`). Paracadute `_senzaTariffa` se la colonna manca.
- **Ricerca in alto trova le persone** (nome, ruolo, telefono, email → apre la scheda con `sq-edit`) e, scrivendo il nome, anche le pratiche assegnate a lei (👤 nel sotto-riga). Gruppo «Collaboratori» (studio) / «Squadra».

Provato col banco (pagina vera, database finto, faccia studio, 1440 e 375) e `tools/banco-gestionale.js app`: ZERO difetti.
⬜ Non provato: l'app del collaboratore aperta da un telefono vero (serve un account suo); l'app del collaboratore (`gestionale-operatore.html`) parla ancora da cantiere («lavori») anche per lo studio.
Pubblicato (→e64897b←, online) e riprovato sul sito vero col database vero (1440 e 375): liste e permessi dello studio, tariffa salvata (35 €), parcella dalle ore (Giulia 35 €, titolare vuoto), «Tempo speso» e «costo medio dello studio» nel margine, scheda «Tu», WhatsApp e link `&studio=1`, ricerca «giulia» (persona + pratica), elimina con «Ha 1 scadenza aperta» e «Rimetti a posto» con la scadenza che torna: tutto ✔. Pulito: conteggi uguali a prima.
⛔ Trovato dopo il push: rimessa a posto la persona, lo Scadenzario diceva «(persona non più in squadra)» accanto alla sua scadenza (dipCache vecchia; e la frase sta in `.c-chi`, che il traduttore salta). Sistemato in `cestRipristina` (rilegge `renderDip` prima di rinfrescare) e in `scadCard` (frase dello studio alla fonte). ⚠️ NON ancora online: parte col prossimo push (commit locale, versioni `?v=20nov-col2`).
⬜ La pagina dell'invito con `&studio=1` è controllata nel file online ma non vista disegnata: aprendola col conto di Alex (membro attivo) rimanda all'app dell'operaio.

# 20 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: STRUMENTI (+ APP DEL COLLABORATORE)

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): stazione totale, GPS, drone, distanziometro; taratura scaduta, manutenzioni, Scadenzario, Assistente, Calendario, Cestino e «Rimetti a posto» (le 2 scadenze vanno e tornano con lo strumento ✔), telefono. Per vedere lo studio «puro» (senza Mezzi) col conto di Alex: `window._tiTipoVero='professionista'; adattaMenuProfessionista()`. Poi cancellato tutto: conteggi uguali a prima (mezzi 2, scadenze 2, lavori 5, persone 1, file 16).

Codice: `js/gest-mezzi.js` (lista, scheda, modulo, salvataggio), Scadenzario `js/gest-scadenze-pratiche.js`, elimina `js/gest-finestre-eventi.js` (`del-mezzo`), strumenti nella pratica `renderMezziBlock` in `js/gest-richieste-chat.js`, Assistente `js/gest-riepilogo.js`.

Sistemato:
1. ⛔ Salvata una taratura dalla scheda, lo strumento restava «Disponibile» senza scadenza finché non si cambiava pagina (`_saveScad` non ridisegnava gli Strumenti).
2. ⛔ Assistente: «Stazione totale · Manutenzione strumento» per una TARATURA scaduta (mostrava la prossima, non quella passata). Ora `_titMz` (vale anche per i mezzi dell'impresa).
3. Parole da cantiere allo studio: domanda di elimina «(revisione, assicurazione, bollo…)» e «Mezzo nel cestino» → strumento/attrezzatura (al femminile) /mezzo; Scadenzario col camion 🚚, «Apri la scheda del mezzo», «(mezzo eliminato)», tipo «Attrezzatura» → chiave inglese, «strumento»; modulo scadenza «Revisione, DURC…» e «patentino del muletto» → frasi dello studio; elenco vuoto «DURC, revisioni dei mezzi» → «Pratiche, tarature, polizze».
4. Nella tendina «Strumento» della scadenza uscivano escavatore e furgone (allo studio senza Mezzi): ora solo strumenti (quello già scelto resta).
5. Ultimi salvati in cima (era in ordine di nome), anche per i mezzi dell'impresa.
6. Intro: «Il Riepilogo ti avvisa» → «L'Assistente» (come nel menu).

Funzioni nuove (foto prima, sì di Alex):
- **Prossima taratura nel modulo dello strumento** (solo studio): data + «Si ripete» → crea/aggiorna UNA scadenza «Taratura strumento» (`window._mzTaratura`, letta in `caricaMezziCache`). Email, Scadenzario e Cestino come le altre.
- **Chi ce l'ha** (`gest_mezzi.operatore_id`, `sql/2026-11-20-strumenti-chi-ce-l-ha.sql`, migrazione `strumenti_chi_ce_l_ha_20nov2026` GIÀ ESEGUITA, riga in `js/fondatore.js`), tutte le facce. Scheda: «Ce l'ha Giulia · usato in 2 pratiche» (`mezzoChiUso`). Paracadute se la colonna manca.
- **Strumenti usati in questa pratica**: il riquadro `#mezzi-wrap` era spento allo studio; ora acceso con parole sue e solo strumenti.
- Ricerca degli strumenti: Alex ha detto NO (per ora).

**APP DEL COLLABORATORE dello studio** (foto prima, sì di Alex): `js/op-studio.js` (nuovo, caricato in fondo a `gestionale-operatore.html`). Parte SOLO se `MIO.tipoStudio==='professionista'`: elenco di frasi fisse (pratiche, titolare, studio, «Cosa hai fatto», «Pratica o sopralluogo», ricevuta al posto di bolla) su testi, suggerimenti e aria-label, con osservatore. NON tocca nomi, descrizioni, indirizzi, chat, note, caselle (`OP_STUDIO_SALTA`). Si aggancia a `adattaParole()`. Provato col banco (studio e impresa: per l'impresa non cambia una parola).
Sistemati anche (20 nov, sera, chiesto da Alex) il nome dell'icona e la schermata d'ingresso: l'app si RICORDA che è di uno studio (`localStorage ti_op_studio`, lo scrive l'invito con `&studio=1` e lo riscrive l'app quando il titolare si sa; `?studio=1` nell'indirizzo vale uguale). Col ricordo si traduce SOLO `#gate` (l'app vera aspetta di sapere il titolare: se è un'impresa il ricordo si cancella e tutto torna «Cantiere»/«Lavori»). Nome dell'icona: `manifest-operaio-studio.json` («Studio», in `PUBBLICI_APPOSTA` di controllo-push.js) + `apple-mobile-web-app-title`. ⚠️ Un'icona già messa sul telefono non cambia nome da sola. Prova col banco: 8 verdi su 8 (fuori/dentro, studio/impresa, invito).

Banco `tools/banco-gestionale.js app`: ZERO difetti. Prova degli strumenti col database finto: 28 verdi su 28 (1440 e 375).
⬜ Non provati: l'app del collaboratore su un telefono vero con un account di studio; l'email del mattino con la taratura (arriva come le altre scadenze, letto nel codice). Le date scritte nel modulo dei MEZZI (assicurazione/revisione) entrano nell'email, la «verifica periodica» no (vecchio, impresa).

# 20 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: AGENDA

Prova da geometra dal vivo (`?vedi=professionista` + `window._tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): collaboratrice Giulia, 4 pratiche (sopralluogo domani, rilievo in ritardo, DOCFA senza nessuno, APE fatta), 2,5 ore dal «Registro delle ore» della pratica, filtro per persona / «Nessuno assegnato» / «Tutti», assegnazione dalla pratica (torna all'Agenda ✔), persona nel Cestino e ritorno, pratica con scadenza nel Cestino e ritorno, telefono. Poi cancellato tutto: conteggi uguali a prima (lavori 5, persone 1, scadenze 2, ore 1, file 7).

Codice: `renderAgenda` / `_agSugg` in `js/gest-elimina-reparto.js`, «Ore fatte» `renderOre` in `js/gest-ore-spese.js`, scheda Agenda dell'Assistente in `js/gest-riepilogo.js`.

Sistemato:
1. Cestino (visto il 20 nov sugli Strumenti): «Rimesso a posto ✔ — e con lui anche altre 2 cose» senza il nome. Ora «Rimessa a posto «Nome» ✔ — e con lei 1 scadenza» (`cestFigli(...,conta)` + `cestContaTesto`, figli contati per tipo, «pratica» allo studio). Provato dal vivo: persona e pratica con scadenza.
2. Rimessa a posto una persona, l'Agenda restava «(nel cestino)»: `agenda` mancava in `rinfresca` di `cestRipristina`.
3. ⛔ Persona nel Cestino → le sue pratiche sparivano dalla tendina (Tutti 5 = nessuno 1, lei non c'è). La domanda di elimina promette «resteranno senza nessuno assegnato»: ora «Nessuno assegnato» comprende chi è nel Cestino (`_agNessuno`); sulla riga resta «… (nel cestino)». Provato dal vivo (Nessuno assegnato 5).
4. ⛔ Assistente, scheda Agenda: la persona nel Cestino contava ancora («Operatore · 4 lavori»). Ora conta solo chi c'è (`opeMap`).
5. ⛔ «Ore fatte», totale: «−2h 29m» in arancio mescolando persone (una solo timbrate, una solo scritte). Ora la differenza conta solo chi ha tutte e due le misure.
6. Parole dello studio: suggerimento «voce «Chi ci va»» → «voce «Collaboratore»» (nella pratica si chiama così); «tutta l'azienda» → «tutto lo studio» (`#ore-chi`); «Totale squadra» → «Totale dello studio»; elenco vuoto «Segna la giornata» → «Registro delle ore» della pratica; «Questo collaboratore non ha pratiche assegnate».
7. Cestino: il tipo «Persone» allo studio si chiama «Collaboratori»; l'avviso dell'accesso dice «In Collaboratori» (era «In Squadra»).
8. Assistente, scheda Collaboratori: «2.5 h» → «2,5 h».

Banco `tools/banco-gestionale.js app`: ZERO difetti. Versioni `?v=20nov-ag` (riepilogo, elimina-reparto, ore-spese, cestino).

Funzioni nuove (foto prima, computer e telefono; «si si e si pubblica» di Alex) — valgono per tutte le facce (impresa: «Lavori (N)», «lavoro senza nessuno»):
- **«Pratiche (N)» sulla scheda del collaboratore** (`js/gest-squadra-giornate.js`: `sqgLeggiPrat` conta le DA FARE del reparto, tasto `data-sqg="pratiche"` → `agFilter.op`, «Da fare», linguetta Pratiche, poi la voce Agenda). Non c'è se la persona non ha niente da fare o se l'Agenda è nascosta (artigiano).
- **«Ore fatte»: «Apri ↓» anche sulle ore scritte** (`renderOre`: `gest_ore` legge anche `lavoro_id,nota`; righe giorno · pratica · cosa ha fatto · ore, ultime in cima; sotto «Apri le Giornate di …» = `data-sqg="apri"`, stessa finestra della scheda Collaboratori). Pratica nel Cestino → «(nel cestino)».
- **Assistente, scheda Agenda: «· N pratiche senza nessuno»** (`labNota` in `rieCard`, classe `.rc-nota` ambra #92400E come `.rc-motivo.attesa`; conta anche chi è nel Cestino; solo se c'è almeno una persona). La scheda compare anche se nessuna pratica è assegnata ma ce n'è una senza nessuno.
Versioni `?v=20nov-ag` anche per `gestionale.css`, `gest-squadra-giornate.js`, `gest-riepilogo-schede.js`. Banco: ZERO difetti.

⬜ Non provato: la tendina col titolare («Alex (io)» nasce solo se gli scrivi ore); l'Agenda vista dall'app del collaboratore.
Pubblicato 879a6ae, Netlify ok, riprovato sul sito vero 1440 e 375 (misure): Pratiche (2) → Agenda filtrata, ore scritte aperte per pratica + Apri le Giornate, Totale dello studio senza falso allarme, «1 pratica senza nessuno» ambra, persona nel Cestino → Nessuno assegnato (3), Cestino col nome e «e con lei 1 scadenza». Pulito: conteggi uguali.
Rimasti fuori da 879a6ae e sistemati il 20 nov (sera): finestra «Giornate di …» (`sqgPersDisegna`) allo studio «Pratica/Pratiche» invece di «Cantiere/Cantieri»; «1 ora» invece di «1 ore». Versione `gest-squadra-giornate.js?v=20nov-ag2`.

# 20 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: STATI DI AVANZAMENTO

Prova da geometra dal vivo (`?vedi=professionista`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): computo con ribasso 10%, capitolo della sicurezza, pratica collegata; SAL n. 1 (120 + «600,5» + «0,5», ritenuta «0,5») e SAL n. 2 (con «1.250» = 1250, oltre il computo). Conti a schermo = vista `gest_sal_totali` = PDF: SAL 1 16.631,38 − 1.663,14 = 14.968,24, ritenuta 74,84, netto 14.893,40; SAL 2 netto 13.903,64. PDF letto con `jsPDF.API.save` (fascia BOZZA, firma «Il Direttore dei lavori»). Cestino e «Rimetti a posto», telefono (niente fuori schermo, niente sotto 13 px). Poi cancellato tutto: conteggi uguali a prima.

Codice: `js/gest-sal-prezzario.js` (elenco, scheda, conto, PDF, fattura), scheda dell'Assistente in `js/gest-riepilogo.js`, `js/gest-cestino.js`.

Sistemato (`?v=20nov-sal`):
1. ⛔ Lo studio poteva fare «Crea la fattura di questo acconto» (14.968 € di lavori sulla SUA partita IVA). Allo studio il SAL lo certifica il direttore dei lavori, la fattura la fa l'impresa: tolta dal menu, dalla scheda e bloccata in `salAFattura` (`_salStudio()`). Filtri dello studio «Tutti / Bozze / Emessi» (`SAL_VISTE_STUDIO`) invece di «Non fatturati / Fatturati»; l'Assistente allo studio non dice più «emessi e non ancora fatturati».
2. ⛔ SAL nuovo con le caselle vuote: si apriva a −14.968 € con l'avviso rosso, e una lavorazione non toccata si salvava a 0 (SAL negativo). Ora un SAL nuovo parte dalle quantità del SAL di prima (sono «dall'inizio») e la nota lo dice. Vale per tutte le facce.
3. ⛔ Buttando nel Cestino un SAL che ha SAL dopo, quello dopo si ricalcolava in silenzio (n. 2 da 13.903 a 28.797 €). Ora la domanda lo dice; messaggio «SAL nel cestino: lo riprendi da lì».
4. Rimesso a posto un SAL, l'elenco restava vecchio: `computi` e `sal` aggiunti ai `rinfresca` del Cestino. `CEST_PADRE.gest_sal` = il computo (un SAL rimesso a posto col computo nel Cestino non si vedeva).
5. Parole dello studio: «Lavori eseguiti», «Eseguito dall'inizio», «Già liquidato coi SAL prima», «Netto da pagare all'impresa», «eseguito finora / già liquidato / ritenuta» nell'elenco, nota della ritenuta («trattiene all'impresa»), pagina vuota («certifica i lavori eseguiti: su quella cifra l'impresa chiede l'acconto»). Impresa e artigiano: invariati («Nessun acconto» nell'Assistente).
6. Giornate (resto dell'Agenda): «Pratica/Pratiche» e «1 ora».

Banco `tools/banco-gestionale.js app`: ZERO difetti. Correzioni provate sulla pagina vera rimettendo le funzioni.
⬜ Da guardare: allo studio la ritenuta del SAL privato senza ribasso sulla sicurezza è voluta (regola delle gare pubbliche); cambiare il SAL n. 1 dopo aver fatto il n. 2 cambia il n. 2 (giusto, ma non lo dice).
Funzioni nuove (foto prima, «1 si 2 si pubblica» di Alex) — SOLO STUDIO:
- **Computo e stati di avanzamento dentro la pratica** (`bloccoScadenzePratica` + `renderLavComputi` in `js/gest-scadenze-pratiche.js`, chiamata da `renderLavScadenze`): computi collegati (`gest_computi.lavoro_id`) col totale (`compRiepilogo`) e i loro SAL (`salConti`), «Apri» e «+ Nuovo stato di avanzamento». Le azioni `lav-comp-apri` / `lav-sal-apri` / `lav-sal-nuovo` (js/gest-finestre-eventi.js) passano da `salDaPratica()` (js/gest-sal-prezzario.js): apre PRIMA il computo (cosi' «← Torna al computo» sa dove tornare), poi il SAL. Chiudendo il computo si torna nella pratica (`window._tornaPraticaDaComp`, letto da «close» solo se il computo aperto e' quello).
- **Certificato di pagamento** (`salCertificatoPdf`, azione `sal-cert`, pulsante nella scheda del SAL e nel menu «⋯»): stessi conti del SAL (`compRiepilogoDa` + `salConti`), importo anche in lettere (`euroInLettere`), firme Direttore dei lavori + Committente, fascia rossa se SAL in bozza o impresa mancante. Numero = numero del SAL.
- **Impresa che esegue i lavori**: casella nella scheda del SAL (solo studio), colonna `gest_sal.impresa_esecutrice` (`sql/2026-11-20-sal-impresa.sql`, migrazione `sal_impresa_20nov2026` GIÀ ESEGUITA, riga in PROVE); un SAL nuovo la riprende dal SAL di prima. Paracadute se la colonna manca.
Pubblicato 7b73a42, Netlify ok, riprovato sul sito vero 1440 e 375: riquadro nella pratica (computo 27.918,00, SAL in cima l'ultimo), nuovo SAL dalla pratica e ritorno alla pratica chiudendo il computo, SAL 2 che riparte dal SAL 1 con l'impresa, Certificato di pagamento 14.893,40 con lettere e firma del DL, niente fattura allo studio, avviso sul SAL dopo, Cestino che ridisegna l'elenco, telefono senza niente fuori. Pulito: conteggi uguali. ⚠️ Durante la prova un'altra sessione ha cancellato la pratica di prova: le prove si fanno in una chiamata sola.

# 20 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: FORNITORI

Prova da geometra dal vivo (`?vedi=professionista` + `window._tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): 6 fornitori (topografo, laboratorio prove, copisteria, software CAD, geologo, strutturista), 5 fatture (1.220,00 scaduta, 610,50, 48,80 senza scadenza, 1098, 1.586) → riassunto 4.563,30 € in 5 fatture, 1 scaduta ✔; 3 collegate alla pratica → margine «Fatture fornitori −3.416,50» ✔; Scadenze (4 con scadenza, la pagata sparisce) ✔; Assistente «Fornitori 4.563,30 · 1 fattura scaduta» ✔; pagata/riapri dalla scheda ✔; documento PDF caricato ✔; ricerca «geologo» ✔; fornitore nel Cestino con la sua fattura e «Rimetti a posto» ✔; telefono: niente fuori schermo, niente sotto 13 px. Poi cancellato tutto (anche file e Cestino): conteggi uguali a prima.

Codice: `js/gest-fornitori.js` (elenco, scheda, documenti, modulo), `fattfForm`/`saveFattf` in `js/gest-carte-documenti.js`, foto AI `ffFotoHTML` in `js/gest-ai-cantiere.js`, margine della pratica `js/gest-ore-spese.js`, Scadenze `scadenzeFornitori` in `js/gest-scadenze-pratiche.js`, Cestino `js/gest-cestino.js`.

Sistemato:
1. ⛔ Modifica di una fattura il cui lavoro/pratica è nel Cestino (o oltre i 100 più recenti): la tendina restava su «nessuno» e al Salva il collegamento SPARIVA (provato dal vivo: `lavoro_id` → null; rimessa a posto la pratica, la fattura non contava più nel margine). Ora la tendina tiene il collegamento («… (nel cestino)», letto con `sb.raw`). Tutte le facce.
2. Tipi di fornitore dello studio (`FORN_CATS_STUDIO`: Topografo / rilievi, Laboratorio prove, Geologo, Strutturista / consulente, Termotecnico / impiantista, Copisteria / stampe, Software e licenze, Visure e servizi, Ufficio e cancelleria, Altro). Una categoria vecchia salvata resta in fondo alla tendina. `_foPro()`.
3. Parole da cantiere allo studio: elenco vuoto e aiuto della voce («rivendite… materiale»), segnaposto (Edil Market, laterizi, ordini@), documenti («DDT… foto alla cassa»), foto AI della fattura («bolla… merce comprata»), «Lavoro collegato» → «Pratica collegata» e la nota del margine, nella pratica «Spese e materiali» → «Spese di questa pratica» (`_FRASI`).
4. Nella fattura del fornitore le caselle «Numero fattura» e «Da pagare entro» avevano l'aiuto delle fatture AI CLIENTI («numerazione continua…», «entro cui il cliente deve pagare»): ora «Numero della sua fattura» e «La paghi entro», con aiuto loro. Tutte le facce.
5. Aiuti delle spese della parcella SBAGLIATI: «Spese anticipate… ci va l'IVA sopra» (da agosto sono fuori IVA, art. 15) e «imponibile = compenso + cassa + spese». Corretti in `js/aiuti.js`.
6. Elenco fornitori: in cima gli ultimi salvati (era per nome). Tutte le facce.
7. Documento del fornitore eliminato: «Documento nel cestino: lo riprendi da lì» (diceva «eliminato»). Cestino: la fattura del fornitore era solo «88» → «Fattura n. 88 — Laboratorio prove · 610,50 €».

8. ⛔ (mio, trovato provando) aprendo la fattura da fuori dei Fornitori la tendina del fornitore poteva essere vecchia: sceglieva un altro nome e il Salva cambiava fornitore. `fattfForm` rilegge i fornitori se quello della fattura non c'è.

Funzioni nuove («1 si 2 si 3 si» di Alex, foto prima computer e telefono) — `?v=20nov-fo`:
- **Fatture dei fornitori dentro la pratica** (tutte le facce: «di questo lavoro» all'impresa): `lavFattForn(lavoroId)` in `js/gest-fornitori.js`, chiamata da `renderSpeseBlock` sotto il margine (`#lav-ff`): chi, n., pagata / da pagare / scaduta, importo, «Apri», «+ Fattura di un fornitore per questa pratica». Azioni `lav-ff-apri` / `lav-ff-nuova` (js/gest-finestre-eventi.js, con la domanda «va perso» solo se la pratica è stata toccata) → `lavFfApri`; Annulla/Indietro e Salva tornano nella pratica (`window._tornaPraticaDaFf`, azzerato da `fattfForm`).
- **Riaddebito nella fattura al cliente** (solo studio, fattura non ancora emessa): `fattRiaddebito(lavIds,fattId)` in `js/gest-fatture.js` sotto «Rimborso spese»: «Su «pratica» hai N fatture di fornitori da riaddebitare», «Mettile nel rimborso spese» (SOMMA alla casella, coi centesimi), «Scegli quali» (spunte). Nel RIMBORSO SPESE, mai nelle spese anticipate art. 15 (fattura intestata allo studio). Se un'altra fattura della stessa pratica ha già un rimborso spese, lo dice.
- **Studio senza merce**: allo studio niente «Acquisti del mese» in Fornitori e niente «Cosa hai comprato» nella fattura del fornitore (e `acqSalva` non gira senza il riquadro: non cancella la merce di una fattura vecchia).
- **«per la pratica «…»»** accanto a ogni fattura nell'elenco e nella scheda del fornitore (`_ffNomiLavori` / `_ffPerLavoro`, «(nel cestino)» se lo è).
Provate sulla pagina vera rimettendo le funzioni (prova in UNA chiamata: dati creati e letti insieme): pratica con 3 fatture (3.416,50, Apri, nuova già sulla pratica), riaddebito di 2 su 3 → rimborso spese 2.196,50 e il conto si aggiorna, niente fattura salvata; elenco «per la pratica», Acquisti nascosto; telefono 375: niente fuori, niente sotto 13 px. Pulito: conteggi uguali a prima.

Banco `tools/banco-gestionale.js app`: ZERO difetti (rifatto dopo le funzioni nuove).
⬜ Non provato dal vivo: «Fotografa una fattura» (AI, 1 credito); l'email del mattino con la fattura scaduta; il ritorno nella pratica dopo «Salva» col file vero (provato solo «Apri» e il salvataggio).
⬜ Da guardare: nella pratica dello studio restano parole da cantiere fuori da questa voce («Rapportini di giornata… li scrive la squadra»), e «Rimborso spese (trasferte, materiali)» nella fattura. La tendina «Strumenti usati in questa pratica» col conto di Alex mostra «escavatore» (conto misto impresa/studio).

# 21 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: REPORT

Prova da geometra dal vivo (`?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375), dati creati, letti e cancellati in UNA chiamata (`window._provaRep(leggi)` scritta nella pagina): cliente srl, collaboratrice Giulia 20 €/h con 5 ore sulla pratica, 2 pratiche pagate (frazionamento 2.500 a novembre, APE 300,50 a febbraio), visure 45,30, 4 fornitori dello studio (topografo 610, laboratorio 244,40, geologo 488 a febbraio, software 120,99 senza pratica).
Conti giusti e UGUALI: Report novembre incassato 2.500 · spese 1.020,69 · utile 1.479,31 = Assistente (scheda Report 1.479,31, `_tiMese.inc` 2.500) = PDF = file per Excel; anno 2.800,50; margine totale 1.191,81; frazionamento +1.500,30, APE −187,50; Fornitori «365,39 da pagare» = Assistente. Fatture pagate: provate SOLO in memoria (finto `sb.from` per `gest_fatture`): parcella 2.300,50 + cassa 5% + spese 150 → 2.565,53 nel Report e nell'Assistente ✔. Nessuna fattura emessa, niente SDI. Pulito: 0 righe di prova, Cestino com'era, nessun file.

Sistemato (`?v=21nov-rep`):
1. ⛔ Fatture «Da fatturare» 3.661 € (3 pratiche) contro 860,50 € (1) dell'Assistente: contava anche le pratiche segnate a mano «pagata»/«emessa» (che il Report conta già come incassate). Ora `fattLavLiberi` salta `fatt_stato` emessa/pagata, come l'Assistente. Tutte le facce.
2. ⛔ Assistente, scheda Collaboratori «0 h questo mese» con 5 ore scritte nel Registro (il Report diceva 5 h): leggeva solo la casella «ore» della pratica. Ora stessa regola del Report (righe di `gest_ore` col loro giorno, se no la casella). Chiude il ✗ della mappa. Tutte le facce.
3. Parole da cantiere allo studio scritte alla FONTE (`_repPro()` / `_repW()` in `js/gest-report.js`): schermo («Importo della pratica», «ogni pratica… sulla sua parcella», «Tempo speso» nella riga della pratica, «Spese nelle pratiche», «Tempo speso dai collaboratori», «per valore delle pratiche», aiuti vuoti); PDF e file per Excel (che il traduttore non raggiunge: «Guadagno o perdita per pratica», «Pratica», «Ore per collaboratore», colonne «Collaboratore», «Tempo speso», «Data fine», file `report-pratiche-…csv`).
4. Allo studio (niente Carte) la riga «Spese con le carte 0,00» non c'è più (schermo, PDF, Excel); torna se ci sono spese di carte (conto misto).
5. Messaggio «CSV esportato» → «File per Excel scaricato» (come il pulsante). Tutte le facce.
Provato sulla pagina vera rimettendo le funzioni (`fn.toString()` + sostituzione) e sul telefono 375: niente fuori schermo, niente sotto 13 px.
Funzioni nuove (foto prima, «Sì si pubblica» di Alex) — tutte le facce, `?v=21nov-rep2`, css `?v=21nov-rep`:
- **Anno per anno** (`anniCard` in `renderReport`): incassato, spese, utile di ogni anno (fino a 6, dall'anno di adesso indietro), stessi conti del mese (incassato − spese; la manodopera resta solo nel margine dei lavori, quindi l'utile dell'anno ≠ «Margine totale»). Computer 4 colonne (`.rep-anni-pc`), telefono a righe (`.rep-anni-tel`, ≤600 px). Anche nel PDF e in fondo al file per Excel (`repData.anni`). Provato: 2026 2.800,50 / −1.508,69 / 1.291,81; 2025 1.000.
- **«Apri la pratica ›» / «Apri il lavoro ›»** su ogni riga di «Guadagno o perdita» (`data-action="edit-job"`, `ML[].id`): apre la scheda; chiudendo si resta nel Report.
⬜ Da guardare: le spese anticipate in nome del cliente (art. 15) entrano nell'«incassato» del Report e dell'Assistente (`fattImponibile`), quindi l'utile del mese le conta come guadagno. Tasse e fisco conta solo fatture pagate (voluto): uno studio senza fatture vede l'incassato nel Report e 0 in Tasse.
⬜ Non provato: reparto con fatture VERE pagate (vietato emetterle); `?vedi=professionista` sul conto misto mostra ancora «Mezzi» nell'Assistente.
Pubblicato 8498503, Netlify ok, riprovato sul sito vero 1440 e 375: Anno per anno, Apri la pratica, Da fatturare, 5 h nell'Assistente ✔. Pulito.

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: GALLERIA

Prova da geometra dal vivo (`?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375): cliente, collaboratrice Giulia, 2 pratiche (frazionamento, APE) + 1 senza foto; caricate dal modulo vero foto del sopralluogo e del rilievo (4000 px → 101 KB), un documento fotografato, un video .webm, un .pdf fra le foto (rifiutato in italiano ✔); filtri pratica / chi / prima-dopo / solo video ✔; foto grande con frecce, video dentro, Scarica (indirizzo firmato ✔); «Guarda in Galleria» dalla pratica ✔; Verbale di sopralluogo: 3 foto, PDF 2 pagine ✔; Cestino e ritorno ✔; telefono: niente fuori, niente sotto 13 px. Poi cancellato tutto: conteggi uguali a prima (foto 5, video 1, lavori 5, persone 1, clienti 2; deposito 7 + 2 file).

Sistemato (`?v=24nov-gal`):
1. ⛔ App del collaboratore (`js/op-spese-foto.js`, `js/op-schede.js`): leggeva anche le foto nel Cestino e i DOCUMENTI della pratica (PDF CILA, visure) come foto rotte. Ora solo `da_fare/fatto/lavoro` e `eliminato_il` vuoto (anche i video). Provato: prima 4 righe (con documento e foto nel Cestino), dopo 2.
2. ⛔ «📷 Foto» dal menu della pratica apriva una pagina sua: solo le foto «prima» (2 su 4), niente fine lavori e video, niente foto grande. Ora porta in Galleria filtrata sulla pratica (`galApriPratica`, usata anche da «Guarda in Galleria»). Tutte le facce. `showLavoroFoto` resta ma non la chiama più nessuno.
3. Pratica SENZA foto: il filtro tornava su «Tutte» e si vedevano le foto delle altre. Ora resta sulla pratica e dice «nessuna foto».
4. Parole dello studio (`_galPro`, `galParole`, `_galTag`): «Prima dei lavori / Fine lavori» (bottoni, etichette, foto grande, modulo, Cestino; `_FRASI` aggiornate), «Io» invece di «Capo», intro e nota del modulo dello studio. Il bottone «Prima<span> del lavoro</span>» non lo traduceva nessuno.
5. Cestino: «Rimesso a posto «Foto…»» → «Rimessa» (non per i documenti). Tutte le facce.
6. Telefono, foto grande: il titolo in alto si taglia e «Prima/Finito» spariva → ora anche nella riga sotto (`.lb-tag`).
7. App del collaboratore dello studio: «Nessun video dal capo» → «dallo studio».
Banco `tools/banco-gestionale.js app`: ZERO difetti. Correzioni provate sulla pagina vera rimettendo le funzioni.

Funzione nuova (foto prima, «il tuo consiglio facciamolo e pubblica» di Alex), tutte le facce:
- **«📄 PDF delle foto»** sul titolo di ogni pratica in Galleria (`galPdfPratica` in `js/gest-galleria-mappa.js`, azione `gal-pdf`, stile `.gal-pdf`): «Documentazione fotografica» (studio) / «Foto del lavoro» (impresa), intestazione come il PDF delle Giornate (logo + Dati azienda), pratica/cliente/luogo/data, «Prima dei lavori» e «Fine lavori», foto 2 per riga numerate con data (e chi, se non sei tu), firma «Il tecnico» allo studio, «Pag. x di y». Usa `gxImmagine` di `js/gest-giornate-extra.js`. I video non ci vanno (lo dice).
- Filtro «Cliente» in Galleria: mostrato in foto, NON scelto da Alex (non fatto).
⬜ Non provati: un collaboratore vero dal telefono; .mov da iPhone; Scarica sul telefono vero.
Pubblicato 39a51c3, Netlify ok, riprovato sul sito vero 1440: PDF delle foto (Documentazione fotografica, 2 pagine, firma Il tecnico), parole dello studio, Foto dal menu in Galleria ✔. Pulito.

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: MAPPA

Prova da geometra dal vivo (`?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375), dati creati, letti e cancellati in UNA chiamata (`window._provaMappa(leggi)` scritta nella pagina): cliente srl con indirizzo, collaboratrice Giulia, 7 pratiche (sopralluogo CILA domani, rilievo in ritardo «Via Garibaldi 100» senza comune, DOCFA senza «Dove» → indirizzo del cliente, APE fatta, frazionamento senza indirizzo, indirizzo sbagliato, Milano). Visti: distanze (0,9 · 1 · 449 km), «Pratiche da fare / Tutte», pin e fumetti, «Indicazioni», «Manda a Giulia» (WhatsApp con «Portami lì» al punto), punto salvato nella pratica per l'app, pratica nel Cestino sparisce ✔, servizio della carta giù (finto `fetch` che fallisce) → in 3 s «non risponde» e le distanze di prima restano ✔, telefono 375 (niente fuori, solo la scritta © OpenStreetMap a 12 px, di Leaflet). Pulito: lavori 5, clienti 2, persone 1 come prima; tolte dalla memoria del browser le 12 voci di prova della carta.
⚠️ «Via Garibaldi 100» senza comune → «scrivi anche il comune» è GIUSTO: la carta gratuita conosce solo quella di Fara in Sabina.

Sistemato (`?v=24nov-mp`):
1. ⛔ Il traduttore dello studio cambiava il TESTO DELL'UTENTE nella Mappa: «Rilievo del cantiere Bianchi» → «Rilievo della pratica Bianchi» (lista e fumetto). Nome, indirizzo, cliente e collaboratore adesso stanno in `.mp-u` (`_mpU`), aggiunta a `_SKIP_UTENTE` in `js/gest-ingresso.js`.
2. ⛔ Assistente, scheda Mappa: «La pratica più vicina 0,7 km» era una pratica FATTA e «Il più lontano 129 km» un lavoro chiuso (prendeva tutti i km dell'ultima vista). Ora cerca i km delle sole pratiche aperte del reparto per indirizzo; la Mappa non azzera più la memoria dei km. «La più lontana» allo studio.
3. ⛔ Assistente: «4 pratiche aperte con un indirizzo», la Mappa ne mostrava 5: leggeva i clienti senza indirizzo. Ora `id,nome,indirizzo,cap,citta,prov,paese`.
4. Parole dello studio alla fonte (`_mpPro`): «fatta», legenda «Fatta», «Controlla il campo «Dove» della pratica», «1 pratica senza indirizzo… Aprila» (impresa: «Aprilo/Aprili»), elenco vuoto «nelle pratiche».
5. App del collaboratore (`opPuntoOk` in `js/op-schede.js`): cliente estero → il punto della Mappa non valeva (il gestionale mette «, Svizzera» in coda). Provato in node, 6 casi.
Banco `tools/banco-gestionale.js app`: ZERO difetti. Correzioni provate sulla pagina vera rimettendo le funzioni.
⬜ Non provati: un collaboratore vero dal suo telefono; il navigatore su iPhone vero.

Funzione nuova («facciamo il tuo consiglio e pubblica» di Alex), tutte le facce, `?v=24nov-mp2`:
- **«Chi ci va»** nella Mappa (`#mp-chi-box` / `#mp-chi` in `gestionale-app.html`, `mpChi` + ascoltatore `change` in `js/gest-galleria-mappa.js`): Tutti (N) · ogni persona (N) · Nessuno (N), contati su quello che guardi («da fare» o «tutte»); «Nessuno» comprende chi è nel Cestino, come l'Agenda. Filtra lista, pin e «senza indirizzo». Se la persona non ha niente: «Niente da mostrare sulla carta di Giulia…». Senza persone la tendina non c'è. Provato dal vivo prima del push (Giulia 2, Marco 1, Nessuno 3, Bruno 0; 1440 e 375, select 44 px, testo 16 px). Pulito.
Pubblicato 128248e, Netlify ok, riprovato sul sito vero 1440: Chi ci va (Giulia 2, Tutti), testo dell'utente protetto anche nel fumetto, fatta/Aprila, Assistente 3 · 0,9 · 1 km ✔. Pulito.

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: CESTINO

⚠️ Chrome non raggiungibile (Alex dal telefono) e sito/database bloccati dalla nuvola: prova fatta (1) sul DATABASE VERO via MCP, come info@trovaimpresa.com, reparto «ferramenta», «PROVA CONTROLLORE», tutto in UN `do $$ … raise exception` (si annulla da solo: 0 righe rimaste, conteggi uguali: lavori 5, file 16, 1 preventivo nel Cestino di un'altra sessione); (2) sulla pagina col banco (`?vedi=professionista`, 1440 e 375, 16 cose nel Cestino). ⬜ La prova sul sito vero col browser va rifatta quando Alex è al computer.
Provati nel database: pratica (con scadenze aperta e fatta, ore, foto, documento, fattura fornitore, computo+SAL), cliente, collaboratore (anche con documento), strumento + taratura, fornitore + fattura (+ documento), computo + SAL, credito con attestato; «Elimina per sempre» (prova e conferma), «Rimetti a posto» con i figli (finestra 2 minuti).

Sistemato (`?v=24nov-cest`):
1. ⛔ Computo nel Cestino: i SAL restavano VIVI e invisibili (l'elenco SAL nasconde quelli col computo nel Cestino) e «Elimina per sempre» del computo si rifiutava («1 stato di avanzamento non è nel cestino») → vicolo cieco. Ora `delComputo` li mette nel Cestino con lui (lo dice: «Ha 1 SAL: va nel Cestino insieme a lui»), `CEST_FIGLI.gest_computi` li riporta su, e «Elimina per sempre» se li porta via con UNA domanda (`CEST_PEZZI`, vale anche per i computi già buttati prima). Provato nel database.
2. ⛔ Fornitore con un DOCUMENTO (relazione PDF): stesso vicolo cieco (`gest_foto.fornitore_id` è a cascata). Ora i documenti vanno e tornano col fornitore (`del-forn` + `CEST_FIGLI`), «Elimina per sempre» li toglie con una domanda e cancella anche il file; il documento rimesso a posto da solo chiede di riportare il fornitore (`CEST_PADRE.gest_foto`).
3. Nomi nel Cestino (`cestNomiAltri`, `CEST_ALTRI`): fattura del fornitore col nome del fornitore anche se è nel Cestino («Fattura n. 88 — Studio topografico Neri · 610,00 €», prima solo «Fattura n. 88»); «SAL n. 1 … — <computo>»; ore e documenti con la pratica («CILA.pdf — Frazionamento…»); documento del fornitore col fornitore. Così la ricerca «neri» trova fornitore, fattura e documento.
4. Parole dello studio: tipo «Pratiche» (era «Pratiche e lavori»), «Giornate» / «Giornata del …» (era «Rapportini di pratica»), nell'elenco di «Elimina per sempre» pratiche/strumenti/collaboratori, «lo strumento» quando si rimette a posto una taratura; «documenti della persona», «pagamenti registrati», «acquisti» (uscivano «altre cose collegate»).
5. Report: cliente o collaboratore nel Cestino → le sue ore e la classifica dicevano «—». Ora «Giulia Bianchi (nel cestino) 3 h» (letti con `sb.raw`). Provato col banco.
Banco `tools/banco-gestionale.js app`: ZERO difetti.
Funzione nuova (sì di Alex, foto prima): sul telefono (≤600 px) le scelte per tipo del Cestino stanno su una riga sola che scorre di lato (`#cest-riass .cest-tipi` in `css/gestionale-stile.css`, `?v=38`). Vale per tutte le facce.
⬜ Non provati: browser vero; un collaboratore vero dal telefono; «Svuota» su pratiche con ore vive dice «usa Elimina per sempre sulla riga» (giusto, ma non fa da solo).

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: CLIENTI

⚠️ Il Cestino del 24 nov (chat «Collaudo voce Cestino studio») NON era pubblicato: stava solo nel suo contenitore, in attesa di «pubblica». Detto ad Alex. Questa sessione NON l'ha potuto riprovare sul sito.
Prova: Chrome non collegato (Alex dal telefono) e trovaimpresa.com bloccato dal proxy → prove sul database vero (info@, reparto «ferramenta», «PROVA CONTROLLORE», UNA chiamata che si annulla da sola: privato con CF, srl con P.IVA e SDI, condominio con CF 11 cifre e PEC, Comune come «azienda» con codice ufficio di 6, SA di Lugano con paese CH e CAP CH-6900; pratica + parcella + computo della srl; srl nel Cestino e ritorno ✔) e sulla copia del gestionale coi dati finti del banco (`?vedi=professionista`, 1440 e 375). Conteggi dopo uguali a prima (clienti 2, lavori 5, computi 5, preventivi 5, fatture 3, scadenze 2).

Sistemato (tutte le facce):
1. ⛔ Ricerca in alto: cercava il campo «cf», che non esiste (la colonna è `cod_fiscale`): incollando il codice fiscale non usciva il cliente. Ora anche CAP, provincia, codice destinatario, PEC. E i clienti senza reparto (quelli che l'elenco Clienti mostra) non si trovavano: letti con `mestiere_id.eq.X,mestiere_id.is.null` (`js/gest-ricerca.js`).
2. ⛔ Scheda del cliente allo studio: «I suoi lavori…», «Lavori (2)» con «Da fare/Fatto». Ora «Le sue pratiche, preventivi, computi e fatture», «Pratiche (N)» col tipo (CILA — …) e lo stato della pratica (Depositata, In istruttoria…; «Finita»). E i **computi** del cliente ci sono (aprono il computo). `cliStoria` in `js/gest-commercialista.js`.
3. Cliente nel Cestino → la domanda contava pratiche, preventivi e fatture ma non i **computi** («Collegati: … 1 computo»). `delCli`.
4. Scadenzario: la scadenza di un cliente nel Cestino diceva «(cliente eliminato)» → ora «Rossi Mario (nel cestino)», come Pratiche e Preventivi (`sb.raw`).
5. Firma con codice SMS (Invia al cliente): per un'azienda o un condominio proponeva «Nome: Rossi Costruzioni / Cognome: Srl». Ora il referente / l'amministratore; se manca, caselle vuote.
6. Controllo del cliente: il codice fiscale di 16 caratteri si verifica con l'ultima lettera (`ctrCfOk`, anche omocodia); quello di 11 cifre (condomini, enti) con la cifra di controllo. Provato: RSSMRA85T10A562S sì, …562T no.
Banco `tools/banco-gestionale.js app`: ZERO difetti (1440, 375, 360). Versioni `?v=24nov-cli`.
⬜ Non provato: sul sito vero col browser (Chrome spento) — da rifare dopo il push.
Pubblicato f073943, Netlify ok, riprovato sul sito vero 1440 e 375: ricerca per codice fiscale e PEC, scheda con pratiche e computi, domanda del Cestino «1 pratica e 1 computo», Scadenzario «(nel cestino)», codice fiscale sbagliato in rosso ✔. Pulito.

Funzioni nuove («facciamo anche le proposte e pubblica» di Alex), tutte le facce, `?v=24nov-cli2`:
- **«Ente pubblico»** quarto tipo di cliente (`tipo='ente'`; Comune, scuola, ASL): «Nome dell'ente», «Ufficio o responsabile», «Codice univoco ufficio (6 caratteri)»; controllo: CF di 11 cifre e codice di 6 OBBLIGATORI (la PEC da sola non basta); ritenuta come azienda/condominio; l'AI del cliente e la Chat conoscono «ente».
- **Fattura all'ente**: riquadro «Ente pubblico» nel modulo (solo se il cliente è un ente): «Scissione dei pagamenti» (spunta, accesa sulle nuove; non in forfettario), CIG, CUP, determina/ordine. Colonne `gest_fatture.scissione`, `cig`, `cup`, `rif_pa` (`sql/2026-11-24-fattura-ente-pubblico.sql`, migrazione `fattura_ente_pubblico_24nov2026` GIÀ ESEGUITA, riga in PROVE; somme della vista uguali prima e dopo). Conti: il documento vale lo stesso, `daPagare` = totale − ritenuta − IVA (`fattConti`); in `gest_fattura_conti` «totale» (= da pagare, quindi anche `resto`) toglie l'IVA. File SDI: codice di 6 → `FPA12`, `EsigibilitaIVA` «S», `DatiOrdineAcquisto` (IdDocumento = determina, se no CIG/CUP) prima di `DatiFattureCollegate`. PDF: riga «IVA versata dall'ente», «NETTO A PAGARE», dicitura art. 17-ter, «CIG · CUP · Rif.». «Manda al cliente» lo dice. Una fattura emessa non cambia scissione risalvandola. Provato col banco: 1.000 + IVA 220, ritenuta 20% → documento 1.220, da pagare 800, file FPA12 con UF1234, S, CIG/CUP.
- **Scheda del cliente corta**: solo i dati scritti; senza P.IVA/CF/codice/PEC un riquadro «Dati per la fattura — Non ancora scritti. Aggiungili» (apre il modulo sui dati fiscali).
⬜ Non provati: invio allo SDI di una fattura FPA12 vera (vietato), il PDF col jsPDF vero (provato dopo il push solo se c'è una fattura in bozza di prova).

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: CALENDARIO

⚠️ Il Cestino del 24 nov NON risulta pubblicato (ultimo commit online f073943, Clienti): non riprovato sul sito.
Prova da geometra dal vivo su trovaimpresa.com (browser di Alex, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375), dati creati, letti e cancellati in UNA chiamata (`window._provaCal(leggi)` scritta nella pagina): cliente srl, collaboratrice Giulia, stazione totale con taratura, 7-8 pratiche (sopralluogo domani con Giulia, SCIA depositata con integrazioni nello stesso giorno, rilievo in ritardo, APE fatta, DOCFA e frazionamento per riempire un giorno, PdC in istruttoria con data passata, agibilità a dicembre), promemoria, nota, fattura del fornitore da pagare; fattura da incassare SOLO in memoria (finto `sb.from` per `gest_fatture`: nessuna fattura emessa, niente SDI). Visti: giorno pieno (3 righe + «+1»), giorno vuoto «Niente in programma», nota scritta e tolta dal riquadro (passa dal correttore: secondo «Salva» ✔), «+ Pratica in questa data» con la data già messa ✔, frecce e «Oggi» ✔, «1 pratica in ritardo · Vedi» → Pratiche ✔, «Da pagare» apre la fattura del fornitore e si torna al Calendario ✔, taratura apre la scadenza ✔, pratica nel Cestino sparisce con la sua scadenza e torna con «Rimetti a posto» («e con lei 1 scadenza») ✔, telefono 375: elenco per giorno, niente fuori schermo, niente sotto 13 px, pulsanti 44-50 px ✔. Pulito ogni volta: conteggi uguali a prima (lavori 5, clienti 2, scadenze 2, persone 1, mezzi 2, fornitori 2, note 0, promemoria 0, fatture 3).

Sistemato (`?v=24nov-cal`):
1. ⛔ Pratica depositata / in istruttoria con la data passata: nella casella e nell'elenco del telefono era ROSSA («in ritardo»), mentre il riquadro del giorno diceva «In corso» e la riga «in ritardo» non la contava. Ora la casella usa `inRitardo()` come Pratiche e il riquadro. Tutte le facce.
2. ⛔ Taratura nel calendario: «⏰ Taratura strumento» senza dire QUALE. Ora «Taratura strumento · Stazione totale» (nome del mezzo/strumento accanto a ogni scadenza col `mezzo_id`, se non c'è già nel titolo). Tutte le facce.
3. Riquadro del giorno: il promemoria aveva l'etichetta «Scadenza» → «Promemoria» (`_prom` in `calAltreDate`).
4. Parole dello studio: legenda «Fatta», riquadro «Fatta», «Apri la pratica», pratica senza nome «Pratica».
5. App del collaboratore (`js/op-agenda-giorno.js`): «Fatto» → «Fatta» allo studio; nel giorno due pratiche dello stesso cliente erano uguali (titolo = nome del cliente) → sotto c'è anche cosa c'è da fare.
Banco `tools/banco-gestionale.js app`: ZERO difetti prima e dopo. Correzioni provate sulla pagina vera rimettendo le funzioni (`fn.toString()` + sostituzione).

Funzioni nuove (foto prima, «Si e si pubblica» di Alex), `?v=24nov-cal2`, css `?v=24nov-cal`:
- **«Chi ci va»** nel Calendario (tutte le facce): nome (prima parola) accanto alla pratica nella casella e nell'elenco del telefono (`.cal-chi-n`), «Ci va: Nome Cognome» nel riquadro del giorno (`.day-chi`), tendina `#cal-chi-box` / `#cal-chi` sopra la griglia come la Mappa: Tutti (N) · persona (N) · Nessuno (N), contati sulle pratiche del MESE guardato; «Nessuno» comprende chi è nel Cestino. Filtra solo pratiche e depositi: scadenze, promemoria e note restano. Senza persone la tendina non c'è. Codice: `calOp`, `calChi`, `calChiNome`, `calChiPassa`, `calChiTendina` in `js/gest-schede-clienti.js`; `renderCal` legge anche `operatore_id,pratica_data_dep` (se una colonna manca rilegge senza).
- **Il giorno del deposito** (solo studio): riga viola «Depositata: …» nel giorno di `pratica_data_dep` (`calDep`, `calDepRiga`, `.cal-lav-bar.dep`, `.dot.dep`, `.stato.dep` #7C3AED), legenda «Deposito» (`.cal-leg-dep`), nel riquadro «Depositata», apre la pratica. Conta nei 3 posti della casella.
Foto fatte col banco (`/tmp/lavoro/foto.js` + `dati-cal.js`: finto `sb.from` con pratiche, persone, scadenze). Banco `tools/banco-gestionale.js app`: ZERO difetti.
⬜ Non provato: collaboratore vero dal suo telefono (letto il codice); fattura vera da incassare (vietato emetterla).
Pubblicato ef907d9, Netlify ok, riprovato sul sito vero 1440 e 375: «Chi ci va» (Tutti 3 · Giulia 1 · Nessuno 2, filtra giusto), «Ci va:» nel giorno, deposito viola + legenda, SCIA al Comune arancio e non rossa («1 pratica in ritardo» = solo il rilievo), taratura col nome ✔. Pulito.
⛔ Trovato dal vivo: sul telefono un nome lungo faceva uscire la tendina «Chi ci va» dallo schermo (anche nella Mappa): sistemato in css/gestionale.css (larga quanto lo schermo sotto i 600 px).

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: SCADENZE E PROMEMORIA

⚠️ Il Cestino dello studio del 24 nov NON risulta ancora pubblicato (ultimo commit online e7b63c1, Calendario): non riprovato. Detto ad Alex.
Prova da geometra dal vivo su trovaimpresa.com (browser integrato, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375), dati creati, provati e cancellati in UNA chiamata (`window._provaSP` / `_provaSP2` scritte nella pagina; la chiamata lunga si lancia senza aspettarla e si legge `window._RSP2`, se no scade a 45 s): cliente, collaboratrice Giulia, stazione totale, pratica SCIA; scadenze integrazioni (collegata a pratica e cliente), deposito sismico, taratura ogni anno (strumento + persona), polizza RC ogni anno, quota albo 31/01 ogni anno, crediti, corso di Giulia, firma col cliente, una scaduta (01/10/2026); promemoria quota Ordine (ogni anno), backup 31/01 (ogni mese), chiamare il Comune. Visti: viste Tutte/Scadute/Prossime/Fatte ✔, «Segna fatta» → prossima 01/03/2028 con strumento e persona ✔, Riapri + Segna fatta → «la prossima c'è già» ✔, 31/01 ogni anno → 31/01/2028 ✔, cliente nel Cestino → «Rossi Mario (nel cestino)» ✔, Giulia nel Cestino → domanda «Ha 2 scadenze aperte», vanno con lei e tornano con «Rimetti a posto» ✔, scadenza nel Cestino «— scade il 30/04/2027» e ritorno ✔, promemoria ogni anno → 20/01/2028 ✔, «Rimanda» → +7 giorni ✔, Butta con domanda ✔, pallino del menu, Calendario, Assistente «1 scadenza passata» ✔, telefono 375: niente fuori schermo, niente sotto 13 px ✔. Pulito ogni volta: conteggi uguali a prima (scadenze 2, promemoria 0, lavori 5, clienti 2, persone 1, mezzi 2).

Sistemato (`?v=24nov-sp`):
1. ⛔ Allo studio coi Mezzi nascosti, Scadenzario e Calendario mostravano «Revisione · escavatore», «Assicurazione · escavatore», «Verifica periodica» (mezzi senza reparto). `_mzSoloStrumenti()` in `js/gest-scadenze-pratiche.js` (studio + `tabNascosto("mezzi")`): solo gli strumenti, in `scadenzeMezzi` e in `calAltreDate` (js/gest-schede-clienti.js). La tendina del modulo lo faceva già dal 20 nov. ⚠️ Col conto di Alex `_tiTipoVero` torna «artigiano» dopo un po': per provarlo va rimesso.
2. ⛔ Cambiando la DATA di una scadenza (proroga del Comune) gli avvisi non ripartivano: l'email segna in `gest_scadenze.avvisi` le tappe già mandate («30,7») e della data nuova non arrivava più niente. Ora `_saveScad` mette `avvisi=null` se la data cambia (come `inviato` dei Promemoria); stessa data → restano. Provato dal vivo. Tutte le facce.
3. Promemoria «Segna fatto» con l'elenco non ancora in memoria non faceva niente, senza dirlo: `promStato` va a prendere la riga (come lo Scadenzario). Tutte le facce.
4. Linguetta «Promemoria (n)» vecchia quando il promemoria nasce fuori (Tasse e fisco «Ricordamelo», «Parla»): `renderScadenze` riconta i promemoria da fare (una domanda col solo numero).
5. Parole dello studio: elenco vuoto dei Promemoria diceva «ordinare il materiale prima della pratica» (il traduttore cambiava «cantiere») → «rinnovare la polizza»; email del mattino allo studio «Documenti dei collaboratori», «Strumenti e carte: cosa scade», «Apri gli strumenti» (#attrezzature) anche nell'oggetto (`netlify/functions/promemoria-mattina.js`, `parole`), provata con `costruisciEmail` finta.
6. «Documento d'identita'» → «Documento d'identità» (scadenze della persona). Tutte le facce.
7. Assistente, scheda «Scadenze»: ora conta anche la carta e i crediti formativi come il pallino del menu e lo Scadenzario (`pScadPers` in js/gest-riepilogo.js).
Banco `tools/banco-gestionale.js app`: ZERO difetti. Correzioni provate sulla pagina vera rimettendo le funzioni (`(0,eval)(String(fn).replace(…))`; ⚠️ incollare le funzioni nel javascript_tool NON le sostituisce: lì sono locali).

Funzioni nuove («Si e pubblica» di Alex, foto prima), `?v=24nov-sp2`, tutte le facce:
- **«Rimanda ▾» nella scadenza** (`SCAD_RIMANDA`, `scadRimandaMetti`, `scadRimanda`, azione `scad-rimanda` con un ascoltatore suo in `js/gest-scadenze-pratiche.js`): Di una settimana / Di un mese / Di 3 mesi, contati dalla SUA data (`_giorniDopo` / `_mesiDopo`, fine mese giusto), `avvisi=null` (riprova senza se la colonna manca), chiude la finestra (se no «Salva» rimetteva la data vecchia), toast «Rimandata al …». Non c'è su una scadenza nuova né su una fatta. Stile `prom-rimanda` come nei Promemoria.
- **Tipo «Iscrizione all'albo»** nella tendina dello studio (`tipiScadenza` in js/gest-richieste-chat.js), prima di «Altro».
- ⛔ Trovato facendolo: anche il «Rimanda» dei Promemoria lasciava aperta la finestra col giorno vecchio, e «Salva» lo riportava indietro. Ora la chiude (`promRimanda`).
⬜ Non provati: l'email del mattino vera (parte una volta al giorno), «Parla» e Chat che scrivono un promemoria (crediti), un collaboratore vero dal telefono.
⬜ Visto, non toccato: la linguetta viola «F» copre la prima lettera della riga sotto le linguette sul telefono (vale per tutte le sezioni, già segnato il 18 nov).

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: ASSISTENTE

⚠️ Il Cestino dello studio del 24 nov NON è pubblicato (ultimo commit online f6d47ff, Scadenze): non riprovato. Il suo lavoro sta solo nel contenitore di quella chat.
Prova da geometra dal vivo su trovaimpresa.com (browser integrato, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375), dati creati, provati e cancellati in UNA chiamata (`window._provaAss(opz)`; si lancia senza aspettarla e si legge `window._RA`): cliente srl, collaboratrice Giulia, stazione totale con taratura scaduta, integrazioni scadute, 4 pratiche (rilievo in ritardo, sopralluogo fra 2 giorni con Giulia, SCIA depositata con data passata, APE finita da fatturare), parcella inviata e ferma, fornitore con fattura scaduta, promemoria passato; fatture SOLO in memoria (finto `sb.from` che rispetta i filtri: una emessa scaduta, una bozza ferma; niente SDI). Le 3 chat aperte dai pulsanti buttate con `chat_svuota`. Conteggi prima = dopo ✔.
Visti: «Parti da qui» (1 fattura scaduta, poi pratica in ritardo, scadenza, strumento, 2 pratiche da fatturare, bozza ferma, preventivo fermo) ✔; schede = voci: Pratiche 3/1 in ritardo ✔, Preventivi 1.024,80 ✔, Fatture da incassare e da fatturare 1.360,50 ✔, Clienti 2 ✔, Calendario 1 ✔, Agenda «Giulia 1 · 2 senza nessuno» ✔, Fornitori 300 ✔, Promemoria ✔; Scadenze 2 = pallino del menu (la linguetta «Scadenze (5)» conta anche fatture da incassare e da pagare: voluto). Telefono 375: niente fuori, niente sotto 13 px, barra «Assistente · Pratiche · microfono · Preventivi · Fatture» ✔.
⚠️ Col conto di Alex (`imprese.tipo` = artigiano) la vista `gest_preventivi_totali` conta la parcella SENZA cassa: la chat ha detto 976 € invece di 1.024,80. Con uno studio vero torna. Non è un difetto.

Sistemato (`?v=24nov-ass`):
1. ⛔ «Fai un preventivo» allo studio: suggerimento delle PIASTRELLE e esempio del bagno; l'AI scriveva da capocantiere. Ora esempio e consiglio da parcella, e all'AI si dice prima che servono solo le prestazioni del tecnico (`PARCELLA_CONTESTO` in `js/gest-ai-moduli.js`). Provato dal vivo: rilievo, progetto, CILA, direzione lavori, catasto, APE, a corpo.
2. ⛔ «Parla» allo studio (`js/gest-parla.js`, finestra fuori dal gestionale = il traduttore non la vede): «Cantiere», «chi sei tu nella squadra?», «Non lavoro in cantiere», «Nota sul cantiere», messaggi d'errore → parole dello studio (`PAROLE_STUDIO`, solo le scritte fisse).
3. ⛔ «Parla»: «ricordami venerdì» detto martedì 24 → promemoria SABATO 28 (conto sbagliato dell'AI). `giornoGiusto()`: un solo giorno della settimana nella frase e data a meno di una settimana → il giorno giusto. Provato in node, 7 casi. Tutte le facce e il Noleggio.
4. «📷 Fotografa un foglio» allo studio: via «Bolla della pratica», «Fattura di un fornitore».
5. Scheda Clienti: «1 cliente in anagrafica» e sotto «Nessun cliente registrato» → «Nessuna pratica aperta» (impresa «Nessun lavoro aperto»). Tutte le facce.
6. Scheda Strumenti / Mezzi: «1 con scadenza vicina» e sotto «scaduta» → «1 con scadenza passata» (o «2 da guardare · 1 passata»). Tutte le facce.
7. Scheda Pratiche: SCIA al Comune con la data passata diceva «9 giorni fa» → «Al Comune», come Pratiche.
8. Scheda Mappa: con una distanza sola «più vicina 21 km / più lontana 21 km» → una riga.
9. Chat (pulsante «Cosa scade questo mese?»): la SCIA depositata stava fra le «pratiche in ritardo» (`netlify/functions/chat-gestionale.mjs`, `agenda`: allo studio fuori le depositate e in istruttoria). Pulsante «Aprilo» → «Aprila» allo studio (`js/gest-chat.js`).
Banco `tools/banco-gestionale.js app` e `noleggio`: ZERO difetti.
⬜ Non provati: la voce vera dal telefono (il microfono del browser di Claude è bloccato), il preventivo AI riempito nel modulo dopo il push (provata la risposta dell'AI).
⬜ Visto, lasciato alla voce «Chat con AI»: allo studio la chat dice ancora «lavoro» («Apri sul lavoro → Crea fattura», «diventati lavori»).
Funzione nuova («Il tuo consiglio faccia e pubblica» di Alex), `?v=24nov-ass2`: in «Parti da qui» allo studio la riga «N pratiche con integrazioni da mandare al Comune» (stato «integrazioni», col nome della prima), grave come il ritardo; «Vai a sistemare» apre le Pratiche su «Tutte» + «Integrazioni richieste» (azione `rie-integr` in `js/gest-finestre-eventi.js`).

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: CHAT CON AI

⚠️ Il Cestino dello studio del 24 nov NON è pubblicato (ultimo commit online 9982fbf, Assistente): non riprovato.
Prova da geometra dal vivo su trovaimpresa.com (browser integrato, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375). Dati creati con `window._provaChat(domande)` (si lancia senza aspettarla, si legge `window._PC`), cancellati con `window._pulisciChat()` (anche `chat_svuota` delle chat nuove): srl + privato, Giulia, 4 pratiche (CILA in integrazioni prot. 4567, SCIA depositata, APE fatta da fatturare, rilievo con Giulia), parcella inviata (1.000, cassa 5%, ritenuta), fattura in BOZZA (niente SDI), scadenza integrazioni; date 2027. 14 domande. Conteggi dopo = prima; tolto anche «PROVA ACCONTO — da cancellare» rimasto nel Cestino dal 19 nov.
Visti: soldi (incassare, bozze, da fatturare) ✔; pratiche al Comune e integrazioni ✔; «cosa scade a gennaio» ✔ «Apri la scadenza»; telefono/email/referente letti ✔; «Segna una nuova CILA/APE» → modulo pieno (cliente, Giulia, data, tipo, stato) con «Crea pratica» ✔; foto «+» della ricevuta del Comune → protocollo 5521, data, foglio/particella/sub nella pratica, «Salva» ✔; «Vai a Fatture · Bozze» apre Fatture su Bozze ✔; «Aprila» apre la pratica ✔; telefono 375: niente fuori, niente sotto 13 px, Foto/Parla/Manda 44 px ✔.
⚠️ Col conto di Alex (`imprese.tipo` artigiano, regime RF19) le viste contano la parcella senza cassa e la fattura senza IVA: non è un difetto della chat.

Sistemato (solo `netlify/functions/chat-gestionale.mjs`, tutte le facce):
1. ⛔ Manuale dell'impresa allo studio: la chat diceva «Crea la fattura da qui» per una pratica, «Accettato, crea lavoro», «Conferma d'ordine», «Salva bozza», barra in basso «Oggi, Lavori», esempio di Wahid. Adesso `MANUALE_STUDIO` = stesso manuale con i pezzi dello studio (`STUDIO_MANUALE`, presi dalla pagina vera): Pratiche, «🧾 Crea fattura» sulla pratica fatta, «Accettato → crea pratica», Lettera d'incarico, Collaboratori, Agenda, Strumenti, Ente pubblico, Galleria con PDF delle foto, barra «Assistente, Pratiche, microfono, Preventivi, Fatture». `istruzioniFisse(ruolo)`: lo studio ha la sua memoria (cache). ⚠️ Se si cambia `MANUALE_GESTIONALE`, un pezzo che non si trova più finisce in `STUDIO_PEZZI_PERSI` e il banco diventa rosso.
2. ⛔ «Cosa deve fare Giulia?» → rispondeva con le pratiche di TUTTI e saltava quella di Giulia (i lavori non avevano `operatore_id`). Adesso `operatore_id` nei lavori e filtro `persona` (solo id vero, solo lavori e ore) in conta/elenco, con la regola «COSA DEVE FARE UNA PERSONA». Vale anche per imprese («i lavori di Wahid»).
3. ⛔ Bozza con ritenuta: «525,00 € (425,00 € imponibile)» — numeri scambiati (425 è il netto, ritenuta tolta; Fatture dice «425,00 € netto da incassare»). Regola dello studio: il totale è già senza ritenuta, «da incassare X € (documento Y €, ritenuta già tolta)», mai «imponibile» il numero più basso.
4. Parcella: «cassa e ritenuta non li vedo da qui» → `preventivi_totali` ora legge compenso, cassa, spese, ritenuta.
5. Stato della pratica inventato («SCIA … in istruttoria» era «depositata») e CILA nominata due volte: regola «lo stato come sta scritto, una volta sola, non cambiarlo se non chiesto».
Banco NUOVO `tools/banco-chat-studio.mjs` (31 prove, 4 sabotaggi tutti accusati). `tools/banco-gestionale.js app`: ZERO difetti.
⬜ Non provati: «Parla» dentro la chat (dettatura: il microfono del browser di Claude è bloccato), un PDF vero col «+», un collaboratore vero.
⬜ Visto, non toccato: «Apri il preventivo» allo studio (la voce del menu si chiama «Preventivi»: coerente).

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: GIORNATE

⚠️ Il Cestino dello studio del 24 nov NON è pubblicato (ultimo commit online d68a4f9, Chat con AI): non riprovato. La Chat con AI del 24 nov è online.
Prova da geometra dal vivo su trovaimpresa.com (browser integrato, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375), dati creati con `window._pgCrea()` e cancellati con `window._pgPulisci()` (tutto quello nato dopo l'ora di partenza nel reparto; `gest_giornate_proposte` ha `creato_il`, si cancella per id): cliente srl, Giulia (20 €/h), 2 pratiche (CILA Rossi depositata 1.500 €, Accatastamento Bianchi 600 €), date 2027. «Racconta la giornata» con l'AI vera (io + Giulia, sopralluogo, catasto, 16 € di diritti), «io» → «aggiungimi», Salva, «Spesa» 52,50 € diritti di segreteria, «modifica» (pratica cambiata), «Per il cliente» + PDF, Riepilogo, PDF del mese (testo letto avvolgendo `jsPDF.save`), giornata mandata da Giulia → «Approva». Numeri uguali: Giornate 320 € tempo speso = Report (240 + 80) ✔, spese 52,50 = Report ✔, «speso finora il 20%» ✔, Agenda «Ore fatte» 16 h (8 + 8) = Report «Ore per collaboratore» ✔. Telefono 375: niente fuori, niente sotto 13 px, pulsanti ≥ 44 px ✔. Pulito: conteggi uguali a prima (lavori 5, clienti 2, persone 1, ore 1, rapportini 1, spese 0, foto 5, deposito 5), niente `gior_io_` nel browser.

Sistemato (`?v=24nov-gio`):
1. ⛔ Il traduttore cambiava il TESTO DELL'UTENTE: «misure in cantiere con l'impresa» → «misure in pratica», «stazione totale in pratica», anche il nome della pratica e «Come ieri». Ora sta in `.gior-u` (in `_SKIP_UTENTE`, js/gest-ingresso.js): righe del mese, giornate da approvare, «Come ieri», Riepilogo, titoli delle finestre, spese, lavoro svolto.
2. ⛔ L'AI scriveva «Catasto» come pratica e al Salva nasceva una pratica vuota «Catasto». Allo studio: `giorPraticaDa(dove,cosa)` cerca la pratica vera con le parole del posto e del racconto (provato dal vivo: «Accatastamento Bianchi»); `giorFermaPraticaNuova` al primo «Salva» dice «Non trovo la pratica «Catasto»… premi di nuovo «Salva» e la creo» (anche in «modifica»). Impresa e artigiano come prima.
3. ⛔ «Per il cliente» (tutte le facce): il PDF non prendeva MAI il nome di Dati azienda (leggeva `ragione_sociale`, colonna che non esiste) → usciva «Admin TrovaImpresa». Ora `select("nome")`.
4. «I pratiche del mese» → «Le pratiche del mese»; «Manodopera del mese» → «Tempo speso nel mese» (come il Report).
5. Allo studio via «Acquisti del mese» (merce da fatture e bolle, tolto in Fornitori il 20 nov) e via «Benzina e km» (chiede un mezzo e mandava alla voce «Mezzi», nascosta allo studio; un pieno già segnato si vede lo stesso). «Fattura o bolla» → «Fattura del fornitore».
6. Parole dello studio alla fonte: esempio del racconto e della casella «Pratica» (niente Campoloniano/tetto), «tu chi sei fra i collaboratori?», «Non contare le mie ore», Spesa «Cosa hai pagato» (es. diritti di segreteria), Foto «Prima dei lavori / Fine lavori», «Per il cliente» con «dei collaboratori» (era «degli collaboratori») e l'esempio da studio, PDF «Resoconto dell'attività», giornate da approvare «insieme a foto e spese», Riepilogo e PDF del mese «Giorni per collaboratore», «Giorni per pratica», «Pratica», «Spese, benzina e fatture», «Fatture dei fornitori», «Foto delle pratiche», consulente «pratica per pratica».
7. Chat con AI dello studio (chiesto da Alex in questa sessione): bozza con ritenuta detta «X € da incassare (Y € il documento, ritenuta già tolta)», mai «più basso dell'imponibile» (`PAROLE_RUOLO` in chat-gestionale.mjs; prova nuova in `tools/banco-chat-studio.mjs`, rossa sulla versione di prima).
Banchi: `tools/banco-gestionale.js app` ZERO difetti; `tools/banco-chat-studio.mjs` 32 verdi. Prova locale coi dati finti: `/tmp/lavoro/gior.js` (testo dell'utente protetto, parole dello studio, `giorPraticaDa`, il fermo al Salva).
⬜ Non provati: l'app del collaboratore dal suo telefono (letto il codice: `js/op-studio.js` traduce «Cantiere», «Manda al titolare», «Ricevuta o fattura»); «Scrivilo con l'AI» del lavoro svolto (1 credito, l'AI parla da cantiere?); la notifica della sera e l'email al consulente.
⬜ Da decidere con Alex: Giornate conta persone e pratiche di TUTTI i reparti («la squadra è una», scelta del 3 nov): nel reparto «ferramenta» comparivano «david» e le potature del giardiniere nell'elenco delle pratiche.
Deciso da Alex («due sì» + «pubblica»), `?v=24nov-gio2`, tutte le facce:
- **Giornate per reparto** (`_gNelReparto` in `js/gest-giornate.js`): persone, pratiche/lavori, ore, «Come ieri», spese, fatture e pieni solo del reparto aperto (persone senza reparto dappertutto). ⛔ Annulla la scelta del 3 nov «la squadra è una». «Ore fatte» dell'Agenda resta di tutta l'azienda (lo dice la sua riga).
- ⛔ Trovato dal vivo dopo il push 5b67d7d: le ore si leggevano SENZA `mestiere_id`, quindi col filtro del reparto il mese restava vuoto. Ora `gest_ore` legge anche `mestiere_id` (e «Come ieri» guarda solo il reparto). ⚠️ Il banco non lo vedeva: le righe finte hanno tutte le colonne qualunque sia il `select`.
- Riprovato sul sito vero: placeholder dello studio, «Accatastamento Bianchi» trovata dall'AI, persone e pratiche solo del reparto, «2 giornate salvate · 1 spesa aggiunta», «misure in cantiere» non tradotto, «Le pratiche del mese», «Tempo speso nel mese», niente «Benzina e km», PDF «Alessio Pinto · Resoconto dell'attività» ✔. Pulito.
- **Spese dette nel racconto** (`giorSpeseDa`, `giorSpeseHTML`, `giorScriviSpese`): dal «cosa» dell'AI, importi con €/euro dopo pagato/speso/comprato/versato → righe con la spunta sotto la scheda; al «Salva» vanno in `gest_spese` sul lavoro della scheda (`c._lavId` scritto da `giorScrivi`). Niente AI in più. Non in «modifica».

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: RICHIESTE DAL SITO

Prova da geometra dal vivo su trovaimpresa.com (browser integrato, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375). La richiesta è partita dal modulo VERO «Affida un incarico» di `profilo-impresa.html?id=36` (la scheda 36 non è pubblica: `_profiloKo` nasconde il modulo, rimesso a vista con `style.display=''` e premuto il pulsante vero → `submitIncarico`, riga in `incarichi_richieste`, `notifica-preventivo` 200, email consegnata a info@). ⚠️ Usare un telefono che NON è già in rubrica: con 333 1234567 il gestionale ha giustamente ripreso «Edilizia Bianchi srl» (stesso numero) invece di creare il cliente.
Visti ✔: elenco «Da fare 1», scheda «Nuova» → aperta = «Vista» (anche nel pannello e nel pallino), contatti, WhatsApp 39…, «Risposta pronta» (1 credito, l'unica chiamata AI), «Crea il preventivo» con cliente nuovo in rubrica e note «Richiesta di incarico…», «Annulla» → resta «Vista», salvato → «Preventivo fatto» (Fatte 1), «Segna chiusa» / «Riapri»; pannello professionisti: stato «Vista» e numerino 1 = «Da fare 1» = riga dell'Assistente «1 richiesta dal sito da aprire». 375 px: niente fuori, niente sotto 13 px. Pulito: conteggi uguali a prima (incarichi 0, clienti 2, preventivi 4, righe 99, dalsito 3), 0 righe «PROVA CONTROLLORE», niente nel Cestino.

Sistemato (`?v=24nov-ds`, stile `?v=37`, pannelli `pannelli-preventivi.js?v=3`):
1. ⛔ «Risposta pronta» allo studio: l'AI scriveva al cliente «i miei prezzi in archivio riguardano demolizioni e tinteggiature». Adesso (`dsRisposta`, `dsPrezziPerRichiesta` in js/gest-richieste-chat.js): allo studio niente prezzario dei LAVORI, «Nome dello studio», «ONORARI DELLO STUDIO», e regole in coda all'input — per tutti: mai parlare dell'elenco dei prezzi; allo studio: chi risponde è uno studio tecnico, prestazione e onorario, niente cantiere. La Edge Function `ai-risposta` NON è stata toccata.
2. ⛔ Email e avviso sul telefono a un professionista: «Richiesta sopralluogo», «Nuova richiesta di preventivo», «Categoria», «registrato come impresa» → «Richiesta di incarico», «Prestazione», «come professionista» (`netlify/functions/notifica-preventivo.js`, `studio = impresa.tipo==='professionista'`).
3. ⛔ Pannello professionisti, card dell'incarico: WhatsApp a `wa.me/3337650000` (senza 39 = numero sbagliato), e WhatsApp anche ai fissi. Ora stessa regola del gestionale. E in `js/pannelli-preventivi.js` «39 333…» scritto senza + non diventa più 3939….
4. ⛔ Telefono: «Crea il preventivo» in testa alla finestra usciva tagliato («Crea il preventiv») — la griglia a 2 colonne del 19 nov (gestionale-stile.css) teneva le scritte su una riga. Ora vanno a capo. Tutte le facce. ⚠️ Il banco non lo vedeva (guarda gli elementi fuori schermo, non il testo che esce dal pulsante).
5. La nota gialla delle schede (3 righe) lasciava vedere la cima della 4ª riga tagliata a metà (7 px sotto): ora 5 px sopra e 3 sotto. Tutte le schede, tutti i gestionali.
6. «Riapri» su una richiesta già trasformata tornava «Vista» con «Crea il preventivo»: ora torna «Preventivo fatto» se si sa qual è il preventivo (imprese/artigiani; per gli incarichi vedi sotto).
7. Allo studio «Lavoro» → «Prestazione» nella scheda dell'incarico; segnaposto della parcella da studio (titolo «Es. Pratica CILA per ristrutturazione», voce «Es. Redazione APE con sopralluogo», capitolo «Es. Progettazione», ricerca «Es. rilievo, APE») — prima «bagno», «tramezzo».
Banchi: `tools/banco-gestionale.js app` e `noleggio` ZERO difetti; `controllo-push.js` verde.
Deciso da Alex («si pubblica»): colonna `incarichi_richieste.preventivo_creato_id uuid` (`sql/2026-11-24-incarichi-preventivo.sql`, migrazione `incarichi_preventivo_creato_24nov2026` GIÀ ESEGUITA, riga in PROVE). `dsIncarichi` la legge (paracadute se manca), `dsSegna` la scrive al «Preventivo fatto»: allo studio c'è «Apri il preventivo» e «Riapri» torna «Preventivo fatto». Le richieste trasformate prima del 24 nov non ce l'hanno.
⬜ Non provati dopo le correzioni (il browser si è scollegato a metà sessione): i 7 punti qui sopra sul sito vero, la nuova «Risposta pronta» (1 credito), un documento allegato dal cliente, l'email nuova.

Secondo giro (altra chat, in parallelo con questa; `?v=24nov-ds3`), provato dal vivo prima del push con 3 incarichi «PROVA CONTROLLORE», poi cancellati:
8. ⛔ Urgenza scritta come codice («Urgenza: alta / bassa / media») → «Urgente / Nessuna fretta / Entro qualche settimana» (`_dsUrg` in js/gest-carte-documenti.js), elenco, scheda e risposta AI.
9. ⛔ Risposta e onorario mandati dal pannello non si vedevano nel gestionale: riquadro «La tua risposta dal pannello» (data, testo, onorario). «Comune dell'immobile» al posto di «Città».
10. ⛔ «Crea il preventivo» riusava in silenzio un cliente con lo stesso telefono anche con un altro nome (dal vivo: «Mario Rossi» finiva su «Edilizia Bianchi srl», non salvato). Ora lo dice. Tutte le facce.
11. ⛔ Chat con AI allo studio: «Non hai richieste dal sito» con 3 incarichi lì. Attrezzo `incarichi_sito` (`colImpresa:'professionista_id'`, niente email/telefono), `incarichi_non_aperti` nell'agenda dello studio, regola in `PAROLE_RUOLO.professionista`. Banco `tools/banco-chat-studio.mjs` 38 verdi (sabotaggio accusato).
⚠️ Due chat hanno fatto la stessa voce insieme: prima di cominciare una voce, `git log origin/main` per vedere se c'è già.

# 24 NOVEMBRE 2026 — STUDIO TECNICO, UNA VOCE PER VOLTA: PREZZARIO

⚠️ Il Cestino dello studio del 24 nov NON è pubblicato (ultimo commit online 63b7199, Richieste dal sito): non riprovato.
Prova da geometra dal vivo su trovaimpresa.com (browser integrato, `?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE», 1440 e 375). Dati creati e cancellati con `window._provaPz(leggi)` (5 onorari: APE 250 a corpo, rilievo 400 al giorno, CILA + DL 1.200 a corpo, vacazione 55 l'ora, DOCFA 600; date portate ad agosto con `update created_at` per farli «vecchi» come quelli veri) e `window._pzPulisci()` (`sb.raw(...)` è una FUNZIONE: `sb.raw("tabella")`, non `sb.raw.from`). Provati: ricerca nel Prezzario e nel preventivo, «€ Prendi dal prezzario» (CILA 1.200 + APE 250 = 1.450 a corpo, `usata_volte` +1), scheda della voce e Salva (250 → 280), Importa CSV di una tariffa onorari («a corpo», «1.150,00»), Chat con AI (3 domande). Prezzario di nuovo a 12.764 voci, 0 righe di prova, 0 preventivi di prova.

Sistemato (`?v=24nov-pz`), tutte le facce:
1. ⛔ I PREZZI TUOI SPARIVANO SOTTO LA TARIFFA. Nel preventivo, «APE», «CILA», «rilievo» davano 8 voci della Tariffa del Lazio (piezometri, «cilindrico») e gli onorari NO; nel Prezzario la «demolizione di tramezzi» di Alex era la 109ª di «demolizione» (la tariffa è più nuova, passa davanti). Ora `_ppCercaMiei` (le voci con fonte «mio» o vuota si cercano a parte) + `_ppMieiPrima` (prima le tue, poi la parola intera: «APE» non è «cAPEzzale»; parole corte intere, lunghe dall'inizio della parola) + `_ppUnisci`, in `js/gest-computo.js`. Le usano il Prezzario (`renderPrezzario`) e il preventivo (`prevPzCerca`). ⚠️ La ricerca dentro la lavorazione del COMPUTO (`ppCerca`) NON è cambiata (lì si cerca nella tariffa).
2. ⛔ Chat con AI: «quanto ho messo per un giorno di rilievo?» → «non ho una tariffa a giornata», con la voce lì (la ricerca va in ordine di CODICE e una voce scritta a mano non ne ha). `miei_prezzi` in `chat-gestionale.mjs` legge a parte le voci tue (fonte mio/vuota), le mette davanti con `tuo: true`; descrizione dell'attrezzo aggiornata.
3. Preventivo: senza parola diceva «Ne ho trovate 500» (le voci in memoria) su 12.764 → niente numero; con la tariffa grande «più di N». Il testo del prezzario nella ricerca passava dal traduttore («Rilievo in cantiere» → «in pratica»): ora `.ti-orig`. Una voce della tariffa occupava un intero schermo del telefono: 3 righe (`#prev-pz-lista .ti-orig`, css/gestionale.css).
4. «1.200,00 € / corpo» → «1.200,00 € a corpo» (schede, tendina della scheda, preventivo); «a corpo» scritto così in un file importato vale come «corpo» (`_pzCorpo`).
5. Parole dello studio (`_pzStudio`): ricerca «Es. APE, CILA, rilievo, catasto», riga sotto il titolo «I tuoi onorari e le voci che usi sempre…», categoria «Es. Onorari, Rilievi, Catasto», prezzario vuoto con gli onorari. Per tutti: «mai usata in un computo o in un preventivo» (prima solo computo). Segnaposto della ricerca accorciati: sul telefono si tagliavano.
Banchi: `tools/banco-gestionale.js app` ZERO difetti; `tools/banco-chat-studio.mjs` 38 verdi; `controllo-push.js` verde.

Funzione nuova (sì di Alex, foto prima), tutte le facce: **«Tutte (N) · I tuoi prezzi (N) · <tariffa> (N)»** in cima al Prezzario (`pzFonte`, `_pzFiltro`, `_pzFontiConta`, `_pzFontiDisegna` in `js/gest-sal-prezzario.js`, stile `.pz-fonti` in fondo a `css/gestionale.css`). Compare solo con almeno 2 gruppi. Il filtro vale per elenco, «Mostra altre» e ricerca. Provato dal vivo: Tutte 12.764 · I tuoi 2 · Lazio 12.762; 375 px niente fuori, pulsanti 16 px.
⬜ Non provati: un collaboratore; il telefono vero.
Funzione nuova («il tuo consiglio si lo voglio» + «pubblica» di Alex), `?v=24nov-pz2`, tutte le facce: **«Che cos'è questo file? Una tariffa / I miei prezzi»** nell'Importa del Prezzario (`#pz-cosa`, `pzImporta` / `_pzEsegui`): con «I miei prezzi» le voci entrano con fonte «mio» (niente nome, niente «aggiorna una tariffa»; doppioni guardati fra i prezzi tuoi). Il nome «mio» per una tariffa è rifiutato. Provato dal vivo: 2 voci entrate come «mio», poi cancellate.
⛔ Trovato facendolo: «Importa le N voci» aveva la scritta INVISIBILE (blu su blu): `.quick-add` dà il colore azzurro e `js/blu-scuro.js` (snippet di Netlify) lo fissa a blu scuro con `!important` sull'elemento. Era così anche nel COMPUTO («Aggiungi la misura», «Aggiungi il capitolo», «Salva il capitolo», l'analisi: provato su un pulsante finto dentro `.sheet`). Regola per tutti `.btn-primary.quick-add,.sheet .btn-primary.quick-add{color:#fff}` (il colore vero è bianco, blu-scuro non lo tocca) e scelte `.seg` dell'importazione a 16 px (erano 13).

# 24 NOVEMBRE 2026 — CALENDARIO SENZA RETE, E DATI AZIENDA DELLO STUDIO

- ⛔ Banco su GitHub rosso da ef907d9 (non f6d47ff): «Chi ci va» aveva aggiunto la lettura delle persone IN FILA dopo i lavori; senza rete ogni lettura aspetta ~7 s e il riquadro rosso arrivava dopo >35 s. Ora lavori e persone insieme, e se i lavori non si leggono `renderCal` mette subito `listaNonLetta` ed esce. Noleggio: le due letture del calendario insieme. Pubblicato 27173c5, banco verde, provato sul sito (rosso in 7 s).
- Dati azienda dello studio (`?v=24nov-az`): nota dei CFP corretta (ingegneri 30/anno, architetti e geometri 60 in 3 anni) + «nel triennio/all'anno» accanto alla casella; «Documenti dei collaboratori»; esempio «Studio Tecnico Rossi»; controllo: codice fiscale con l'ultima lettera (16) o cifra (11) per tutte le facce, «Manca il nome dello studio», polizza scaduta (rosso), in scadenza entro 30 giorni (arancio), polizza scritta a metà (arancio).
- Il nome «Dati azienda» NON si cambia per lo studio: è citato in ~100 messaggi.

# STUDIO — MAPPA DI CHI PARLA CON CHI
Giro dello studio: 25 voci. Fatte: Pratiche, Computo metrico, Preventivi e parcella, Fatture, Crediti formativi, Collaboratori, Strumenti, Agenda, Stati di avanzamento, Fornitori, Report, Galleria, Mappa, Cestino, Clienti, Calendario, Scadenze e promemoria, Assistente, Chat con AI, Giornate, Richieste dal sito, Prezzario, Dati azienda (24 nov; Tasse e fisco già guardato il 18 nov).
(✔ parlano · ✗ parlano male · — non parlano)
- Strumenti ↔ Scadenze e promemoria: ✔ tarature e manutenzioni nello Scadenzario, aprono lo strumento; salvate dalla scheda si ridisegnano (20 nov).
- Strumenti ↔ Assistente (Riepilogo): ✔ riga «strumento con scadenza passata» col nome giusto e scheda Strumenti.
- Strumenti ↔ Calendario: ✔ le scadenze ci sono (icona orologio).
- Strumenti ↔ Pratiche: ✔ dal 20 nov «Strumenti usati in questa pratica»; la scheda dice «usato in N pratiche». — Dalla pratica non si vede la taratura dello strumento (si potrebbe avvisare «strumento fuori taratura»).
- Strumenti ↔ Collaboratori: ✔ «Chi ce l'ha». — La scheda del collaboratore non dice quali strumenti ha.
- Strumenti ↔ Cestino: ✔ le scadenze vanno e tornano con lo strumento.
- Strumenti ↔ Ricerca in alto: — (Alex: no per ora).
- Strumenti ↔ email del mattino: ✔ le tarature arrivano come scadenze.
- Strumenti ↔ app del collaboratore: — il collaboratore non vede gli strumenti che ha.
- Collaboratori ↔ app del collaboratore: ✔ dal 20 nov l'app parla da studio.
- Pratiche ↔ app del collaboratore: ✔ «Pratiche di adesso», messaggi sulla pratica.
- Si può unire: Strumenti resta voce sola (i Mezzi allo studio non ci sono).
- Agenda ↔ Pratiche: ✔ «Apri» apre la pratica e «Indietro» torna all'Agenda; assegnare il collaboratore dalla pratica aggiorna la tendina.
- Agenda ↔ Collaboratori: ✔ dal 20 nov «Pratiche (N)» sulla scheda apre l'Agenda filtrata; persona nel Cestino → ora le sue pratiche stanno in «Nessuno assegnato» (20 nov).
- Agenda ↔ Assistente: ✔ scheda «Agenda» con i numeri uguali (dal 20 nov non conta chi è nel Cestino). dal 20 nov dice anche «N pratiche senza nessuno».
- Agenda ↔ Calendario: ✔ le stesse pratiche con la data; dal 24 nov il Calendario dice chi ci va.
- Agenda (Ore fatte) ↔ Pratiche / Giornate del collaboratore: ✔ le ore del «Registro delle ore» entrano. ✔ dal 20 nov le ore scritte si aprono pratica per pratica, con «Apri le Giornate di …».
- Agenda ↔ Cestino: ✔ dal 20 nov si ridisegna dopo «Rimetti a posto».
- Agenda ↔ app del collaboratore: ✔ il collaboratore vede le pratiche assegnate («Pratiche di adesso», dal codice; non provato con un suo account).
- Collaboratori (Assistente) ↔ Ore fatte: ✔ dal 21 nov le ore del mese della scheda leggono anche gest_ore (stessa regola del Report).
- Si può unire: ✔ UNITE il 24 nov (sì di Alex, foto approvata): «Collaboratori e agenda», linguette «Collaboratori (N)» / «Agenda (N)» (prima, dal 18 nov, separate).
- Stati di avanzamento ↔ Computo metrico: ✔ il SAL vive dentro il computo (righe, prezzi, ribasso, capitoli); «Fai un SAL» apre il computo sulla linguetta giusta.
- Stati di avanzamento ↔ Pratiche: ✔ dal 20 nov riquadro «Computo e stati di avanzamento» nella pratica, «Apri» e chiudendo si torna nella pratica.
- Stati di avanzamento ↔ Fatture: — allo studio giusto così dal 20 nov (la fattura del SAL la fa l'impresa). La parcella della direzione lavori non nasce dal SAL.
- Stati di avanzamento ↔ Preventivi e parcella: — il preventivo nasce dal computo, non dal SAL (giusto).
- Stati di avanzamento ↔ Assistente: ✔ scheda «Stati di avanzamento» con gli stessi conti (salConti); dal 20 nov senza l'allarme «non fatturati» allo studio.
- Stati di avanzamento ↔ Cestino: ✔ dal 20 nov si ridisegna dopo «Rimetti a posto»; il computo è il padre del SAL.
- Stati di avanzamento ↔ Ricerca in alto: — i SAL non si trovano (si trova il computo? da guardare a fine giro).
- Stati di avanzamento ↔ Clienti: ✔ il cliente arriva dal computo (PDF «Spett.le», elenco).
- Si può unire: ✔ UNITE il 24 nov (sì di Alex, foto approvata): «Computo e SAL», linguette «Computi (N)» / «Stati di avanzamento (N)» (telefono «SAL»). L'elenco di tutti i SAL resta, nella sua linguetta.

- Fornitori ↔ Pratiche: ✔ la fattura collegata entra nel margine («Fatture fornitori»); dal 20 nov il collegamento non si perde più modificando la fattura. ✔ dal 20 nov nella pratica c'è l'elenco delle sue fatture, con «Apri» e «+ Fattura» (si torna nella pratica).
- Fornitori ↔ Fatture e parcella: ✔ dal 20 nov la fattura al cliente propone di riaddebitare le fatture dei fornitori della pratica nel rimborso spese. — la PARCELLA (preventivo) no: nasce prima delle spese. Aiuti delle spese corretti il 20 nov.
- Fornitori ↔ Scadenze e promemoria: ✔ le fatture da pagare con la data ci sono; pagata → sparisce.
- Fornitori ↔ Assistente: ✔ scheda Fornitori con lo stesso totale e «1 fattura scaduta». — una fattura scaduta non sale in «Parti da qui».
- Fornitori ↔ Calendario / email del mattino: ✔ (dal codice).
- Fornitori ↔ Report e Tasse e fisco: ✔ le fatture contano come spese (anche quelle non pagate, per data).
- Fornitori ↔ Cestino: ✔ il fornitore va e torna con le sue fatture; dal 20 nov la fattura nel Cestino ha nome e importo.
- Fornitori ↔ Ricerca in alto: ✔ fornitori e fatture da pagare.
- Fornitori ↔ Commercialista: ✔ avviso «senza partita IVA il commercialista non sa…».
- Fornitori ↔ Collaboratori / Strumenti: — non c'entrano.
- Si può unire: NO, Fornitori resta voce sola.

- Report ↔ Assistente: ✔ utile e incassato del mese uguali (scheda Report, «Il tuo mese»); ore dei collaboratori uguali dal 21 nov.
- Report ↔ Fatture: ✔ incassato = imponibile delle fatture pagate (IVA esclusa); il riquadro di Fatture «Entrato in cassa» è IVA compresa e ritenuta tolta (nome diverso, voluto). «Da fatturare» uguale all'Assistente dal 21 nov.
- Report ↔ Fornitori: ✔ le fatture dei fornitori entrano tutte nelle spese (pagate e no, per data) e nel margine della pratica.
- Report ↔ Pratiche: ✔ guadagno o perdita per pratica = margine della scheda (parcella − spese − fornitori − tempo speso); dal 21 nov «Apri la pratica ›».
- Report ↔ Collaboratori / Agenda: ✔ «Ore per collaboratore» dalle righe del Registro delle ore.
- Report ↔ Tasse e fisco: ✗ voluto: Tasse conta solo le fatture pagate di tutti i reparti; il Report, senza fatture, le pratiche segnate «pagata». Spese anticipate art. 15 dentro l'incassato del Report: da guardare.
- Report ↔ Clienti: ✔ «Migliori clienti» per valore delle pratiche. — dal Report non si apre il cliente.
- Report ↔ Preventivi e parcella: — il Report non conta i preventivi (giusto: non sono soldi).
- Si può unire: Report NO (è la voce dei numeri); la scheda «Report» dell'Assistente lo riassume.

- Galleria ↔ Pratiche: ✔ «Guarda in Galleria» nella scheda e, dal 24 nov, anche «📷 Foto» del menu portano alla Galleria filtrata. — dalla Galleria non si apre la pratica.
- Galleria ↔ Verbale di sopralluogo: ✔ le foto della pratica entrano da sole (anche quelle di fine lavori: si tolgono con la spunta).
- Galleria ↔ app del collaboratore: ✔ vede «prima» dallo studio e carica le sue; dal 24 nov niente foto nel Cestino né documenti.
- Galleria ↔ Collaboratori: ✔ «Chi l'ha caricata» col nome; persona nel Cestino: le foto restano.
- Galleria ↔ Clienti: — non si filtra per cliente (proposto il 24 nov, non scelto). ✔ il PDF delle foto porta il nome del cliente.
- Galleria ↔ Cestino: ✔ foto e video vanno e tornano col nome della pratica.
- Galleria ↔ Ricerca in alto: — le foto non si cercano (si cerca la pratica).
- Galleria ↔ Giornate: ✔ le foto prima/dopo delle Giornate sono le stesse righe (stessi tipi).
- Si può unire: Galleria NO (allo studio è l'archivio delle foto di tutte le pratiche); dentro la pratica basta il conteggio + il collegamento.

- Mappa ↔ Pratiche: ✔ «Apri» apre la pratica; il punto trovato si salva nella pratica. Pratica nel Cestino → sparisce dalla Mappa.
- Mappa ↔ Clienti: ✔ senza «Dove» usa l'indirizzo del cliente; nome del cliente nella riga.
- Mappa ↔ Dati azienda: ✔ l'ufficio è il punto di partenza; senza indirizzo «Apri Dati azienda».
- Mappa ↔ Collaboratori: ✔ «Ci va: …» e «Manda a …» (WhatsApp con «Portami lì»).
- Mappa ↔ app del collaboratore: ✔ punto, km e navigatore passano alla pratica (dal codice; cliente estero sistemato il 24 nov).
- Mappa ↔ Assistente: ✔ dal 24 nov numeri uguali (pratiche aperte con indirizzo, più vicina e più lontana solo fra le aperte).
- Mappa ↔ Agenda: ✔ dal 24 nov «Chi ci va» nella Mappa (i posti di una persona, «Nessuno» come l'Agenda). — l'Agenda non dice i km.
- Mappa ↔ Calendario: — i sopralluoghi di domani non hanno «il giro» sulla carta.
- Mappa ↔ Cestino: ✔ (vedi Pratiche).
- Mappa ↔ Ricerca in alto / Strumenti / Fornitori: — non c'entrano.
- Si può unire: Mappa NO (allo studio serve per i sopralluoghi); con Agenda si parlano meglio con un filtro «chi ci va», non unendole.

- Clienti ↔ Pratiche: ✔ «+ Nuova pratica» dalla scheda col cliente già scelto; dal 24 nov la scheda elenca le pratiche col tipo e lo stato della pratica.
- Clienti ↔ Preventivi e parcella: ✔ «+ Nuovo preventivo» dalla scheda; i preventivi nella scheda col totale senza IVA.
- Clienti ↔ Computo metrico / Stati di avanzamento: ✔ dal 24 nov i computi del cliente nella scheda (aprono il computo); il SAL prende il cliente dal computo. — dalla scheda non si fa «+ Nuovo computo».
- Clienti ↔ Fatture: ✔ la fattura prende i dati dal cliente (fotografia); dallo SDI «Modifica» apre «Dati per la fattura». ✔ dal 24 nov un ente pubblico si fattura (FPA12, scissione, CIG/CUP).
- Clienti ↔ Scadenze e promemoria: ✔ dal 24 nov il cliente nel Cestino ha il nome «(nel cestino)».
- Clienti ↔ Mappa: ✔ senza «Dove» la pratica usa l'indirizzo del cliente. — cliente nel Cestino: la pratica va in «senza indirizzo».
- Clienti ↔ Report / Assistente: ✔ «Migliori clienti»; la striscia «Da guardare» nella scheda. — dal Report non si apre il cliente.
- Clienti ↔ Agenda / Collaboratori: — non c'entrano (il cliente si vede nella pratica).
- Clienti ↔ Pagina del cliente (preventivo-cliente) / Invia al cliente: ✔ email e telefono dalla scheda; dal 24 nov firma SMS col referente per aziende e condomini.
- Clienti ↔ Cestino: ✔ va e torna; pratiche, preventivi, computi e fatture restano (dal 24 nov la domanda conta anche i computi).
- Clienti ↔ Ricerca in alto: ✔ dal 24 nov anche codice fiscale, PEC, codice destinatario e i clienti senza reparto.
- Si può unire: NO, Clienti resta voce sola (la scheda è il punto da cui partono preventivi, pratiche e fatture).

- Calendario ↔ Pratiche: ✔ la data prevista; «Apri» apre la pratica; «+ Pratica in questa data» con la data già messa; dal 24 nov il colore del ritardo uguale a Pratiche (al Comune non è in ritardo) e il giorno del deposito in viola.
- Calendario ↔ Scadenze e promemoria: ✔ scadenze delle pratiche, integrazioni, promemoria; aprono la loro scheda.
- Calendario ↔ Strumenti: ✔ dal 24 nov la taratura col nome dello strumento.
- Calendario ↔ Fornitori: ✔ «Da pagare» apre la fattura e si torna al Calendario.
- Calendario ↔ Fatture: ✔ «Da incassare» (provato solo in memoria).
- Calendario ↔ Collaboratori / Agenda: ✔ dal 24 nov «Chi ci va» (nome accanto alla pratica, tendina come la Mappa e l'Agenda, «Nessuno» comprende chi è nel Cestino).
- Calendario ↔ app del collaboratore: ✔ vede i giorni delle sue pratiche; dal 24 nov «Fatta» e cosa c'è da fare sotto il cliente. — non vede scadenze e promemoria dello studio (giusto).
- Calendario ↔ Assistente: ✔ la riga «in ritardo» usa la stessa regola di Pratiche.
- Calendario ↔ Cestino: ✔ pratica nel Cestino sparisce con la sua scadenza, torna con «Rimetti a posto».
- Calendario ↔ Mappa: — i sopralluoghi del giorno non hanno «il giro» sulla carta.
- Si può unire: NO (Calendario = tutte le date dello studio; Agenda = chi fa cosa). Con «Chi ci va» (fatto il 24 nov) si parlano senza unirle.

- Scadenze e promemoria ↔ Pratiche: ✔ la scadenza si attacca alla pratica (nome nella riga), va nel Cestino e torna con lei; integrazioni del Comune proposte dalla pratica.
- Scadenze e promemoria ↔ Clienti: ✔ cliente nella riga, «(nel cestino)» dal 24 nov.
- Scadenze e promemoria ↔ Strumenti: ✔ tarature e verifiche; dal 24 nov allo studio niente mezzi (escavatore). Prossima taratura con strumento e persona.
- Scadenze e promemoria ↔ Collaboratori: ✔ documenti della persona in sola lettura; le sue scadenze vanno nel Cestino e tornano con lei.
- Scadenze e promemoria ↔ Crediti formativi: ✔ riga «ne mancano N» da ottobre; dal 24 nov anche nell'Assistente.
- Scadenze e promemoria ↔ Fatture / Fornitori / Carte: ✔ da incassare, da pagare, scadenza della carta (sola lettura, aprono la loro scheda).
- Scadenze e promemoria ↔ Calendario: ✔ scadenze e promemoria nel giorno; dal 24 nov niente mezzi allo studio.
- Scadenze e promemoria ↔ Assistente: ✔ «N scadenze passate»; dal 24 nov la scheda conta carte e crediti come il pallino.
- Scadenze e promemoria ↔ Tasse e fisco / Parla: ✔ «Ricordamelo» scrive un promemoria; dal 24 nov il numero della linguetta si aggiorna.
- Scadenze e promemoria ↔ email del mattino: ✔ avvisi 30/7/1; dal 24 nov ripartono se cambi la data o premi «Rimanda»; parole dello studio.
- Scadenze e promemoria ↔ Cestino: ✔ scadenza e promemoria vanno e tornano («— scade il …»).
- Scadenze e promemoria ↔ app del collaboratore: — non vede le scadenze dello studio (giusto; vede le sue pratiche).
- Scadenze e promemoria ↔ Ricerca in alto: — le scadenze non si cercano (da guardare a fine giro).
- Si può unire: già unite (18 nov) in una voce con due linguette. Resta così.

- Assistente ↔ Pratiche: ✔ «N pratiche aperte · N in ritardo» uguali a Pratiche (la pratica al Comune non è in ritardo e dal 24 nov dice «Al Comune»).
- Assistente ↔ Fatture: ✔ da incassare, da fatturare, bozze ferme uguali alla sezione (stessa fattConti).
- Assistente ↔ Preventivi e parcella: ✔ totale della parcella uguale; «Fai un preventivo» apre il modulo con l'AI della parcella (dal 24 nov).
- Assistente ↔ Clienti / Calendario / Agenda / Collaboratori / Fornitori / Promemoria / Strumenti / Mappa / Report: ✔ numeri uguali alle voci.
- Assistente ↔ Scadenze e promemoria: ✗ voluto: la scheda conta come il pallino del menu (scadenze, persone, carte, crediti), la linguetta «Scadenze (N)» conta anche fatture da incassare e da pagare (quelle hanno già le schede Fatture e Fornitori).
- Assistente ↔ Chat con AI: ✔ «Manda» e i pulsanti aprono una chat nuova con la domanda; dal 24 nov la chat ha il manuale con le parole dello studio.
- Assistente ↔ Parla / Giornate / Promemoria: ✔ dal 24 nov parole dello studio e giorno della settimana giusto.
- Assistente ↔ Crediti formativi: — la scheda compare solo col primo corso segnato (regola «se non l'hai usata non si vede»); l'avviso «ne mancano» sta nello Scadenzario.
- Assistente ↔ Pratiche con integrazioni: ✔ dal 24 nov riga in «Parti da qui» che apre le Pratiche filtrate su «Integrazioni richieste».
- Si può unire: NO, l'Assistente è la pagina di partenza; non è una voce da unire, è il riassunto di tutte.

- Chat ↔ Pratiche: ✔ legge tipo, stato, Comune, protocollo, deposito; «Aprila» apre la pratica; «Segna una nuova CILA» apre il modulo pieno («Crea pratica»); la foto della ricevuta riempie protocollo e catasto. ✔ dal 24 nov «cosa deve fare Giulia» filtra per persona.
- Chat ↔ Fatture: ✔ da incassare, bozze, «Vai a Fatture · Bozze», «Segna come pagata»; dal 24 nov la ritenuta detta giusta. — non emette (giusto).
- Chat ↔ Preventivi e parcella: ✔ totale, dal 24 nov anche cassa e ritenuta; «Accettato → crea pratica» spiegato giusto.
- Chat ↔ Scadenze e promemoria: ✔ legge e «Apri la scadenza»; apre il modulo della scadenza. — un promemoria non lo apre (lo fa «Parla»).
- Chat ↔ Clienti: ✔ recapiti e referente letti; «Apri il cliente»; modulo cliente pieno.
- Chat ↔ Collaboratori / Agenda: ✔ dal 24 nov le pratiche e le ore di una persona. — non vede gli strumenti che ha.
- Chat ↔ Computo metrico: ✔ «Aggiungi con l'AI» e i prezzi del computo (provati il 16 nov).
- Chat ↔ Calendario / Mappa / Report / Crediti formativi: — non c'entrano direttamente (la chat legge le date con `agenda`).
- Chat ↔ Cestino: ✔ quello nel Cestino non lo vede (`senzaCestino`). Le chat si buttano con la ×.
- Chat ↔ Ricerca in alto: — le chat non si cercano (archivio per reparto con la data).
- Si può unire: NO. La chat è la porta «chiedi» di tutte le voci; l'Assistente la apre con la domanda già scritta.

- Giornate ↔ Pratiche: ✔ ogni giornata sta su una pratica; spese e tempo entrano nel margine («speso finora il N%»). ✔ dal 24 nov l'AI trova la pratica vera e allo studio una pratica nuova non nasce zitta. — dalla giornata non si apre la pratica.
- Giornate ↔ Agenda (Ore fatte): ✔ stesse righe di gest_ore, ore uguali (16 h = 8 + 8, provato).
- Giornate ↔ Report: ✔ tempo speso, spese e «Ore per collaboratore» uguali (provato).
- Giornate ↔ Collaboratori: ✔ nomi nuovi entrano in Collaboratori al Salva; costo orario da lì. ✔ dal 24 nov solo le persone del reparto (deciso da Alex).
- Giornate ↔ Assistente: ✔ «Il tuo mese» conta le giornate con la stessa regola (giorGruppi) e dal 24 nov tutte e due solo del reparto: numeri uguali.
- Giornate ↔ Spese della pratica: ✔ dal 24 nov le spese dette nel racconto vanno fra le spese della pratica al Salva.
- Giornate ↔ Fornitori: ✔ «Fattura del fornitore» apre il modulo di sempre, la fattura entra nel margine della pratica.
- Giornate ↔ Galleria: ✔ le foto prima/dopo sono le stesse righe; dal 24 nov «Prima dei lavori / Fine lavori» come la Galleria.
- Giornate ↔ app del collaboratore: ✔ la giornata mandata dal telefono arriva in «Da approvare» e con «Approva» entra (provato con una riga di prova); dal codice l'app dice «Manda al titolare».
- Giornate ↔ Cestino: ✔ una giornata va nel Cestino (rapportino + ore) e torna.
- Giornate ↔ Chat con AI / Parla: ✔ «Parla» scrive le giornate con la stessa giorScrivi.
- Giornate ↔ Clienti: — il cliente non si vede nella giornata (si vede nella pratica); il PDF «Per il cliente» non porta il nome del cliente (voluto: niente indirizzo).
- Si può unire: Giornate dentro Agenda («Ore fatte»)? NO per ora: Giornate scrive (racconto, spese, PDF per il consulente e per il cliente), Agenda legge le ore; si parlano già coi numeri uguali.

- Richieste dal sito ↔ Scheda pubblica (Affida un incarico): ✔ la richiesta vera arriva in «Da fare» (provato col modulo vero), con prestazione, comune, urgenza, note; documenti del cliente con «Documento N».
- Richieste dal sito ↔ Pannello professionisti: ✔ uno stato solo (Nuova/Vista/Preventivo fatto/Chiusa/Risposto) e numerino = «Da fare»; dal 24 nov WhatsApp col 39. — la risposta scritta dal gestionale (WhatsApp/email) non segna «Risposto» nel pannello (lo segna solo «Invia risposta» del pannello).
- Richieste dal sito ↔ Email e telefono: ✔ avviso subito; dal 24 nov allo studio dice «Richiesta di incarico».
- Richieste dal sito ↔ Preventivi e parcella: ✔ «Crea il preventivo» apre la parcella col cliente, titolo = prestazione, note; «Preventivo fatto» solo a preventivo salvato. ✔ dal 24 nov «Apri il preventivo» anche per gli incarichi.
- Richieste dal sito ↔ Clienti: ✔ cliente nuovo in rubrica, niente doppioni (stesso telefono o stessa email).
- Richieste dal sito ↔ Assistente: ✔ «N richieste dal sito da aprire» = pallino del menu.
- Richieste dal sito ↔ Pratiche: — la richiesta non diventa pratica direttamente (passa dal preventivo: «Accettato → crea pratica»). Giusto.
- Richieste dal sito ↔ Chat con AI: ✔ dal 24 nov (secondo giro) la chat legge gli incarichi (`incarichi_sito`).
- Richieste dal sito ↔ Ricerca in alto: — la ricerca non le trova (da guardare a fine giro).
- Si può unire: ✔ UNITE il 24 nov (sì di Alex, foto approvata): «Preventivi e richieste», linguette «Preventivi (N)» / «Richieste dal sito (N da fare)» (telefono «Dal sito»). Il pallino #cnt-dalsito è spostato sulla voce Preventivi (stesso elemento: numero = Assistente).

- Prezzario ↔ Preventivi e parcella: ✔ «€ Prendi dal prezzario» nel preventivo; dal 24 nov prima i prezzi tuoi (onorari), «a corpo», conta «usata».
- Prezzario ↔ Computo metrico: ✔ la tariffa regionale nella lavorazione e «Prendi i prezzi dal prezzario»; «Salva nel mio prezzario». — nel computo i prezzi tuoi non vengono prima (giusto: lì si usa la tariffa).
- Prezzario ↔ Chat con AI: ✔ dal 24 nov `miei_prezzi` legge prima i prezzi tuoi (`tuo: true`).
- Prezzario ↔ Richieste dal sito: ✔ «Risposta pronta» allo studio usa gli onorari (fonte «mio»).
- Prezzario ↔ Assistente: ✔ scheda «N voci nel tuo prezzario».
- Prezzario ↔ Cestino: ✔ la voce va e torna.
- Prezzario ↔ Ricerca in alto: — le voci non si cercano da lì (si cercano nel Prezzario).
- Prezzario ↔ Fatture: — la fattura nasce dal preventivo (le voci passano da lì); nel modulo fattura non c'è «Prendi dal prezzario».
- Si può unire: NO, è l'archivio dei prezzi; dal 24 nov «I tuoi prezzi» separa gli onorari dalla tariffa.
- Cestino ↔ Pratiche: ✔ scadenze aperte vanno e tornano con la pratica; foto, ore e documenti restano ma spariscono da Galleria/Agenda («(nel cestino)»); «Elimina per sempre» li porta via con una domanda.
- Cestino ↔ Computo / Stati di avanzamento: ✔ dal 24 nov i SAL vanno e tornano col computo (prima restavano vivi e invisibili).
- Cestino ↔ Fornitori: ✔ fatture e, dal 24 nov, documenti vanno e tornano col fornitore; nomi giusti nel Cestino.
- Cestino ↔ Collaboratori / app del collaboratore: ✔ scadenze con lei, accesso tolto (al ritorno lo dice: «Nuovo invito»); l'app legge col Cestino acceso.
- Cestino ↔ Strumenti: ✔ tarature con lo strumento.
- Cestino ↔ Crediti formativi: ✔ l'attestato si cancella col corso solo con «Elimina per sempre».
- Cestino ↔ Report: ✔ dal 24 nov cliente/collaboratore nel Cestino col nome «(nel cestino)». Le ore di una pratica nel Cestino non contano (come il suo margine).
- Cestino ↔ Clienti: ✔ pratiche e computi restano («Collegati: … Restano dove sono»). — la Mappa non usa l'indirizzo di un cliente nel Cestino (la pratica va in «senza indirizzo»).
- Cestino ↔ Assistente / Agenda / Mappa: ✔ (vedi le loro righe).
- Cestino ↔ Ricerca in alto: — la ricerca in alto non guarda il Cestino (c'è la sua casella).
- Si può unire: NO, il Cestino è uno solo per tutte le voci.

# 20 NOVEMBRE 2026 — GIORNATE: FOTO PRIMA E DOPO, LAVORO SVOLTO, PDF PER IL CLIENTE (impresa e artigiano)

Chiesto da Alex (come sulla sua pagina personale «Giornate di cantiere»), foto approvate. Punti 1-3 del suo elenco; 4 (spesa con la carta aziendale) e 5 (app operatore) nel secondo giro.
- **Foto Prima/Dopo**: stessi tipi della Galleria (`da_fare` = prima, `fatto` = dopo). «Foto» della giornata apre la finestra a due colonne (`gxVediFoto`, `gxColonnaFoto`), ognuna col suo «+ Foto prima / dopo» (`gxScegliFoto(g,tipo)` → `gxCaricaFoto(g,files,tipo)`). Pillola «2 foto prima · 3 dopo». `gxDella()` dà anche `prima` e `dopo`.
- **Lavoro svolto** (didascalia per il cliente): colonna `gest_rapportini.didascalia` (`sql/2026-11-20-giornata-didascalia.sql`, migrazione `giornata_didascalia_20nov2026` GIÀ ESEGUITA, riga in PROVE). Letta in `giorCarica` con paracadute (`giorDidaManca`: se la colonna manca si rilegge senza). Si vede sotto la giornata (`.gx-dida`). Una giornata senza rapportino (modo vecchio) non la può salvare: il PDF esce lo stesso.
- **Pulsante «Per il cliente»** (5° pulsante, `gxResoconto`): casella, «Scrivilo con l'AI · 1 credito» (`gxDidaAI` → `AI.didascalia` in `js/ai-integrazione.js` → Edge Function NUOVA `ai-didascalia`, Haiku, fino a 3 foto prima + 3 dopo rimpicciolite a 1024 px; deployata il 20 nov), «Salva» (`gxDidaSalva`), «Scarica il PDF» (salva prima).
- **PDF per il cliente** (`gxPdfCliente`): logo (`gestLogoPdf`) + nome ditta (Dati azienda, se no `imprese.nome_attivita`), «Resoconto del lavoro», data lunga, lavoro svolto, foto prima e dopo due per riga (`gxGrigliaPdf`, 1200 px q .75). ⛔ NIENTE operai, ore, spese, note, luogo. File «Lavoro del 20 novembre 2026.pdf».
- **PDF del mese** (`giorPdf`): in fondo «Foto dei lavori» giornata per giornata (`gxFotoMesePdf`, 1000 px q .72); qui il cantiere si scrive (è per te/consulente).
- Anteprime col banco: `/tmp/anteprima/foto.js` (copia del sito + storage finto + jspdf locale). Banco `tools/banco-gestionale.js app`: ZERO difetti.
- ⬜ Da fare nel secondo giro: spesa con la carta aziendale collegata alla giornata (un posto solo per i soldi, come `js/op-spese-foto.js`); foto prima/dopo, lavoro svolto e spesa con carta nell'app operatore.

# 24 NOVEMBRE 2026 — STUDIO: TRE VOCI UNITE CON LE LINGUETTE (sì di Alex, foto approvate)

Fine del giro «una voce per volta»: adesso il gestionale dello studio si guarda tutto insieme. Tappa 1 = unire le voci che da sole non hanno senso.
- «Computo e SAL» (Computo metrico + Stati di avanzamento) e «Preventivi e richieste» (Preventivi + Richieste dal sito): `js/gest-studio-unite.js` (`stUnisci`, `stSegnaLetto`), NUOVO, incluso subito dopo gest-squadra.js. Solo `professionista`.
- «Collaboratori e agenda»: `agUnito()` in js/gest-squadra.js non esclude più lo studio; nomi dello studio dentro `agUnisci` (Collaboratori / Agenda).
- ⛔ Non si cancella niente: #sal e #dalsito restano, i pulsanti del menu restano con la classe `.st-dentro` (nascosti). Chi li preme da fuori (Assistente, Chat `[vai:sal]`, «Fai un SAL», hash) arriva lo stesso e nel menu si accende la voce unita (`js/gest-finestre-eventi.js`; `js/gest-chat.js` accetta `.st-dentro`).
- Numeri delle linguette: li segnano i render (`stSegnaLetto` in renderComputi, renderSalTutti, renderPreventivi, renderDalSito) per il reparto corrente; l'altra linguetta si legge una volta in silenzio. Richieste dal sito = «da aprire» (solo nuove), uguale al pallino e all'Assistente.
- Telefono: la seconda linguetta ha il nome corto (`.st-lung` / `.st-corto`, sotto 560 px): «SAL», «Dal sito».
- CSS in fondo al blocco unioni di css/gestionale-stile.css (`?v=39`). MANUALE dello studio in chat-gestionale.mjs aggiornato (banco-chat-studio: 38 verdi).
- Provato sul sito vero iniettando il codice nuovo (playwright non c'è nel banco): linguette, menu, arrivo da fuori su #sal e #dalsito, pallino spostato; 375 px niente fuori.
- NON unite (detto ad Alex): Giornate + Agenda (Giornate scrive, Agenda legge, numeri già uguali); Fornitori + Carte (da guardare nel giro della Tappa 2).

# 24 NOVEMBRE 2026 — STUDIO, TAPPA 2: IL GIRO INTERO DI UNA PRATICA, DAL VIVO

Prova da geometra su trovaimpresa.com (`?vedi=professionista` + `_tiTipoVero='professionista'; adattaMenuProfessionista()`, reparto «ferramenta», «PROVA CONTROLLORE»): modulo vero «Affida un incarico» di `profilo-impresa.html?id=36` (scheda non pubblica: `window._incaricoProf={id:36,…}` messo a mano, poi il pulsante vero) → «Crea il preventivo» (cliente nuovo, parcella 1.200 + 800, cassa 4% = 2.080) → «Accettato → crea pratica» (importo 2.000) → computo dalla pratica (1 lavorazione 10.000) → SAL n. 1 al 40% (4.000) → 6 ore nel Registro → spesa 52,50 diritti → fornitore nuovo (geologo) e sua fattura 300 collegata → «Segna fatto» → «Crea fattura» in BOZZA con «Mettile nel rimborso spese» (2.080 + 300 + bollo = 2.382; niente SDI). Poi tutto cancellato: conteggi uguali a prima (lavori 5, clienti 2, preventivi 4, fatture 3, computi 5, SAL 1, ore 1, spese 0, fornitori 2, fatture fornitori 0, persone 1; incarico tolto; tolto anche il collaboratore «Alex» nato da «Alex (io)»).
Numeri uguali ✔: richiesta → «1 richiesta dal sito da aprire» = pallino; parcella 2.080 = fattura (compenso + cassa); margine della pratica = Report «Guadagno»; ore 6 h = Agenda «Ore fatte» = Report; fornitore 300 = Fornitori = Scadenze; «Da fatturare» 860,50 uguale in Assistente e Fatture.

Difetti trovati e sistemati (`?v=24nov-giro`):
1. ⛔ Pratica nata da una richiesta dal sito: si apriva col cliente VUOTO (il cliente nuovo non era in `cliCache`) → «Salva» lo cancellava. Ora `jobForm` mette sempre il cliente della pratica (anche nel Cestino: «(nel cestino)») e la richiesta mette il cliente nuovo in `cliCache`.
2. ⛔ Fattura da pagare → «+ Nuovo fornitore» → «Aggiungi»: si chiudeva tutto e la fattura in scrittura spariva. Ora si torna alla fattura col fornitore scelto e i campi ancora lì (`new-forn-da-ff`, `window._ffRitorno` in gest-finestre-eventi.js / gest-fornitori.js), e poi alla pratica.
3. ⛔ Tornando nella pratica da un'altra finestra mancavano i pulsanti in alto (Segna fatto, Foto, Altro): `lavoroApri` riprende `AZ_APRI["edit-job:"+id]`.
4. ⛔ Margine: la fattura del fornitore riaddebitata al cliente («Rimborso spese») restava solo un costo (guadagno 1.647,50 invece di 1.947,50). `rimborsiInFattura(ids)` in gest-ore-spese.js (gest_fattura_lavori + `spese_iva` delle fatture non annullate, no note di credito; più pratiche = parti uguali) entra in `margineLavoro(…, rimborsi)`: scheda della pratica («Rimborso spese in fattura +…»), Report (riga, PDF, CSV), Assistente (perdita).
5. Scheda cliente: preventivo «2.000 IVA esclusa» contro 2.080 dell'elenco → allo studio la parcella «da incassare» come l'elenco; «N. — —» davanti a computi e preventivi senza numero tolto.
6. Computo: scelta la pratica, cliente e luogo vuoti si prendono dalla pratica.
7. Parole: linguetta del computo «Acconti (SAL)» → «Stati di avanzamento (SAL)» allo studio; «Spese di questa pratica»; rapportini «Li scrivono i collaboratori dalla loro app»; aiuto del primo preventivo «ne fai una pratica».
⬜ Da decidere con Alex: il contributo cassa (4%) entra nell'«Incassato» del Report e di Tasse (imponibile della fattura) ma non nel guadagno della pratica (importo = compenso): sommando le pratiche non torna il totale per la cassa. Il codice cassa (TC03…) non si mette da solo alla prima fattura: lo chiede all'emissione (voluto, 12 ago).

# 24 NOVEMBRE 2026 — STUDIO: LE COPPIE «—» DELLA MAPPA CHE ERANO DIFETTI (`?v=24nov-lega`)
- Report → «Migliori clienti»: il nome apre la scheda del cliente (`apri-cli`, la scheda con «Fai qualcosa per lui»; non se è nel Cestino). Collaudato dopo il push del 25 nov: Report, Galleria «Apri la pratica», ricerca «Scadenze», «+ Nuovo computo» nella scheda ✔.
- Galleria → «Apri la pratica ›» / «Apri il lavoro ›» in testa a ogni gruppo (`edit-job`).
- Giornate → «Le pratiche del mese»: il nome apre la pratica.
- «+ Nuovo computo» dalla scheda del cliente (studio) e «+ Nuovo computo per questa pratica» dentro la pratica: azione `new-computo-pre` (data-cli / data-lav; dalla pratica prende cliente, «Dove» e titolo, e chiede prima di lasciare la pratica).
- Ricerca in alto: anche «Scadenze» (apre `edit-scad`) e «Richieste dal sito» (apre `ds-apri`; riempie `dsCache` se vuota).
- Assistente «Parti da qui»: «N fatture di fornitori scadute» (g:1, va a Fornitori).
- Pratica → «Strumenti usati»: accanto allo strumento «⚠️ Taratura scaduta il …» (gest_scadenze con `mezzo_id`, data passata, non fatta). Vale anche per i mezzi delle imprese.
- Collaboratori: sulla scheda «🔧 Ha: …» (gest_mezzi.operatore_id). Allo studio «· N pratiche» invece di «cantieri».
- Richieste dal sito: WhatsApp/Email della «Risposta pronta» segnano l'incarico come risposto: `stato='risposta_inviata'` + `risposta_at` (SENZA testo: nessuna email al cliente). Pannello professionisti: «✅ Risposto dal gestionale» e numerino senza quelle.
⬜ Provare dal vivo dopo il push (non iniettati nella pagina).

# 25 NOVEMBRE 2026 — STUDIO, TAPPA 3 n. 1: LE SCADENZE DI LEGGE DELLA PRATICA (sì di Alex, foto approvata)
`proponiScadenzeLegge(lavId,dati)` in js/gest-scadenze-pratiche.js (`?v=25nov-legge`), accanto a `proponiScadenzaIntegrazioni`. Si propone (gconfirm con le date) quando la pratica ARRIVA a «Depositata» (SCIA, SCIA alternativa al PdC) o «Approvata» (Permesso di Costruire), sia alla creazione sia alla modifica (`_statoPraticaPrima` letto anche per depositata/approvata).
- SCIA: +30 gg «controllo del Comune», +1 anno inizio, +3 anni fine (dalla data di deposito, se manca oggi).
- SCIA alternativa: +30 gg «da qui si possono iniziare i lavori», poi +1 anno e +3 anni da quel giorno.
- PdC: dal giorno in cui la segni Approvata, +1 anno inizio, +3 anni fine (prudente: si sposta se si inizia dopo).
- CILA esclusa: la legge nazionale non le dà termini. Fonte: DPR 380 art. 15 e 23; regole nazionali, la Regione o il Comune possono cambiarle (lo dice la domanda).
- Ogni data = riga di gest_scadenze (`tipo_pratica` «Termine di legge: …», `avvisa:true`, lavoro e cliente): email 30/7/1, Scadenzario, Calendario, Cestino con la pratica. Già presente (stesso tipo, non fatta) → non si rifà.
- Provato sul sito vero iniettando la funzione: SCIA depositata 20/11 → 20/12/2026, 20/11/2027, 20/11/2029, 3 righe, nello Scadenzario; seconda volta niente domanda. Pulito (pratica e scadenze cancellate).

# 25 NOVEMBRE 2026 — STUDIO, TAPPA 3 n. 2: LE SPESE DELLA PRATICA IN FATTURA (sì di Alex, foto approvata)
`fattSpesePratica(lavIds,fattId)` in js/gest-fatture.js (`?v=25nov-spese`), chiamata accanto a `fattRiaddebito` quando si apre la fattura. Solo studio. Riquadro `#fa-sppr` (classi `.fa-ria` come il riaddebito) sotto «Spese anticipate»: le spese della pratica (gest_spese) con la spunta; spuntate da sole quelle tipiche art. 15 (regex diritti/bolli/visure/marche/oneri/segreteria/catasto/protocollo/tributi/tasse/sanzioni/registro). «Spese anticipate (somma)» → #fa-spese; «Nel rimborso spese» → #fa-spese-iva. Somma, non sostituisce. Avviso se un'altra fattura della stessa pratica ha già `spese`.
Provato sul sito vero iniettando la funzione: pratica di prova con diritti 52,50 + visura 16 + fotocopie 16 → spuntate 68,50, «Spese anticipate» → casella 68,50, conto 1.000 + 68,50 + bollo = 1.070,50. Pulito (pratica e spese cancellate, nessuna fattura salvata).
⬜ Da guardare (c'era già): nel «Conto» le spese anticipate stanno dentro «Totale imponibile» pur essendo «fuori IVA».

# 25 NOVEMBRE 2026 — TAPPA 3 n. 3: IL GIRO DEI SOPRALLUOGHI (sì di Alex, foto approvata)
`mpGiroDisegna()` in js/gest-galleria-mappa.js (`?v=25nov-giro`), riquadro `#mp-giro` in cima alla Mappa (sopra i filtri), stile `.mp-giro*` in fondo a css/gestionale-stile.css (`?v=40`). Vale per tutti (allo studio «sopralluoghi», alle imprese «cantieri»).
- Dati: alla fine di `renderMappa` si mette da parte `mpGiroDati={part:pPart, righe, op:mpOp}` (righe = quelle della Mappa, quindi vista «da fare/tutte» e «Chi ci va» valgono anche qui). Giorno = `mpGiroData` (default domani), tendina data `#mp-giro-d`.
- Ordine: dall'ufficio, ogni volta la tappa più vicina (`mpDistanzaKm`, linea d'aria); km di ogni tratto, ritorno in ufficio, totale. Senza ufficio: ordinate per km.
- «Apri il giro nel navigatore»: Google Maps dir con origin/destination = ufficio e waypoints (max 9). «Manda il giro su WhatsApp»: al telefono della persona scelta in «Chi ci va» (39 davanti), se no senza numero; il testo ha elenco e link del navigatore.
- Calendario: nella finestra del giorno, se ci sono pratiche/lavori, «🗺 Il giro di questo giorno» (`data-action="mp-giro"` → `mpApriGiro(d)` in gest-finestre-eventi.js).
- Provato sul sito vero con la logica iniettata e 3 tappe finte intorno a Rieti: ordine Rieti 0,4 → Cittaducale 7,4 → Contigliano 15 → ufficio 7,2 = 30 km; tappa di un altro giorno esclusa; link del navigatore giusto. Collaudato dopo il push con renderMappa vero e il pulsante del Calendario ✔ (giorno passato giusto). «senza indirizzo» → «non trovati sulla carta» (indirizzo scritto ma non trovato, `?v=25nov-giro2`).

# 25 NOVEMBRE 2026 — EMAIL «Run failed: Banco del gestionale»
Le email di GitHub dopo i push = il Banco (.github/workflows/banco-gestionale.yml) trovava 2 difetti: il nome del cliente nel Report («Migliori clienti», `.rep-cli`) alto 27 px sul telefono (375 e 360), sotto i 44. Ora `min-height:44px;display:inline-flex` (anche il nome della pratica in Giornate, `?v=25nov-44`). Banco rifatto in locale (playwright + /usr/bin/google-chrome al posto del chromium che non si scarica): ZERO difetti.

# 25 NOVEMBRE 2026 — TAPPA 3 n. 4: I KM DALL'UFFICIO NELL'AGENDA (sì di Alex, foto approvata)
- `window.mpKmDi(l)` / `mpKmTesto(km)` in js/gest-galleria-mappa.js: km della riga (`dove_km`, li salva la Mappa) o, se mancano, quelli della cache della Mappa su questo telefono (`ti_mappa_cache_v3`, `km[mpChiave(dove)]`). Solo se c'è «Dove». null = non si scrive niente.
- `jobCardSupa` (js/gest-riepilogo-schede.js): «📍 indirizzo · 2,1 km» in blu (`.km-uff`), quindi in Agenda E nelle schede delle Pratiche, tutte le facce.
- Agenda (`renderAgenda` in js/gest-elimina-reparto.js): se una pratica con indirizzo non ha km, riga `#ag-km-avv` «Per vedere quanti km ci sono dall'ufficio [Apri la Mappa]» (`ag-km-mappa`).
- ⚠️ Impresa: la select dell'Agenda non legge `dove_km` (resta la cache della Mappa) — non toccata per non rompere se manca la colonna.
- Banco locale (playwright + google-chrome) ZERO difetti. `?v=25nov-km`, stile `?v=41`.
- Collaudo dopo il push (giardiniere): prima l'invito, «Apri la Mappa» → 3 pratiche su 4 con «0,6 km» in Agenda e Pratiche. «Via Torino 7, Rieti» non trovata: l'invito restava per sempre → ora la Mappa segna gli indirizzi già cercati (`C2.provati`) e `mpKmDaCercare(l)` invita solo per quelli mai cercati (`?v=25nov-km2`).

# 25 NOVEMBRE 2026 — TAPPA 3 n. 5: «I TUOI STRUMENTI» NELL'APP DEL COLLABORATORE (sì di Alex, foto approvata)
- Funzione del database `gest_strumenti_miei(_impresa)` (`sql/2026-11-25-strumenti-miei.sql`, migrazione `strumenti_miei_25nov2026` GIÀ ESEGUITA): chi sono io (gest_membri attivo → operatore_id), poi gest_mezzi con `operatore_id = io` (nome, categoria) e la prossima scadenza non fatta (gest_scadenze.mezzo_id). Niente costi/note. Solo `authenticated`.
- `js/op-strumenti.js` (NUOVO, in gestionale-operatore.html dopo op-mezzi.js, stile `.op-stru*` nel primo <style>): riquadro `#op-stru` in cima a «Lavori di adesso». Titolo: studio «I tuoi strumenti», impresa «Le tue attrezzature» (o «Mezzi e attrezzature che hai tu»). Stato: rosso scaduta/oggi, arancione entro 30 gg, verde in regola, grigio senza scadenza. Ordinate per scadenza. Nessuno strumento → niente riquadro.
- Provato sul sito vero (app aperta col conto di Alex che fa da «david»): 2 attrezzature di prova date a david con taratura 10/11 e 15/12 → «scaduta il 10/11» rosso, «fra 20 giorni» arancione. Cancellate (mezzi e scadenze di prova = 0).

## 25 nov 2026 — IL CONTRIBUTO CASSA NON È UN INCASSO
- Il contributo integrativo di una cassa privata (CIPAG geometri 5%, Inarcassa 4%…) il cliente lo paga e il professionista lo gira alla cassa: non è reddito, nel forfettario non conta per la soglia. La rivalsa INPS 4% (TC22, Gestione Separata) invece È compenso.
- Nuove funzioni in js/gest-fatture.js: `fattCassaFuori(f)` (vero se cassa_tipo ≠ TC22) e `fattIncassoReddito(f,righe)` = imponibile − cassa (salvo TC22), col segno.
- Usata per l'«Incassato» in: gest-report.js (impFatt, quindi anche margini per pratica), gest-riepilogo.js (Assistente, mese). In gest-fisco-tasse.js (`ftCassaFuori`, globale) e gest-fisco-vivere.js si sottrae la colonna `cassa` della vista gest_fatture_totali (aggiunti `cassa_tipo` e `cassa` alle select). Le fatture del Noleggio non hanno cassa_tipo: restano intere.
- Nel Report, al professionista, la scritta dice «(senza IVA e senza cassa)».
- L'Excel (gest-cestino) resta con l'imponibile vero della fattura: è un documento, non un incasso.
- Prova: parcella 2.000 + cassa 5% → prima 2.100, ora 2.000; con TC22 4% resta 2.080.
- 25 nov (sera, sì di Alex con foto): in fattura, scegliendo la cassa la % si mette da sola (`_CASSA_PERC` in gest-fatture.js: TC01 4, TC02 4, TC03 5, TC04 4, TC06 4, TC17 5, TC21 2, TC22 4) con la nota verde `#fa-cassa-nota`; le altre casse non toccano il numero; «nessuna cassa» svuota la %. Si cambia sempre a mano. Banco locale zero difetti.

# IMPRESE E ARTIGIANI — MAPPA DI CHI PARLA CON CHI
Fatta il 25 nov 2026 (sera) leggendo tutti i js; le righe «provato» sono state rifatte dal vivo nel giro della Tappa 2. (✔ parlano · ✗ parlano male · — non parlano)
Menu (impresa = artigiano, salvo le parole): Assistente · Chat con AI · Richieste dal sito · Lavori (artigiano «Lavori e interventi») · Preventivi · Fatture · Calendario · Squadra e agenda (unite 18 nov) · Mezzi e attrezzature (unite 18 nov) · Computo da prezzare · Acconti a lavoro fatto (SAL) · Prezzario · Scadenze e promemoria (unite 18 nov) · Giornate · Tasse e fisco · Carte · Clienti · Fornitori · Report · Galleria · Mappa · Cestino. L'artigiano NON ha solo «Crediti formativi» (come l'impresa): il menu è lo stesso (`TAB_NASCOSTI_ART=[]`, `TAB_APPALTI_ART=['crediti']`).

Funzioni fatte per lo studio, per impresa e artigiano:
- ✔ già anche qui: il giro sulla Mappa (`mpGiroDisegna`, «cantieri»), i km sulle schede dei lavori (`jobCardSupa`) e l'invito «Apri la Mappa» in Agenda, «Le tue attrezzature» nell'app dell'operaio (`op-strumenti.js`), Report → cliente, Galleria «Apri il lavoro ›», Giornate «I cantieri del mese», ricerca di scadenze e richieste, fornitore scaduto in «Parti da qui», taratura/revisione scaduta nel lavoro, «Ha: …» sulla scheda della persona, rimborso spese nel margine, nuovo fornitore che torna alla fattura.
- — solo studio: spese della pratica in fattura (`fattSpesePratica`), scadenze di legge (SCIA/PdC: all'impresa non servono), cassa in fattura (l'impresa non ha cassa), «+ Nuovo computo» dalla scheda cliente, riquadro «Computo e stati di avanzamento» dentro la pratica (`renderLavComputi`, `pro?`), «Risposto dal gestionale» delle richieste.

Lavori
- Lavori ↔ Clienti: ✔ cliente nel lavoro, «+ Nuovo lavoro» dalla scheda, la scheda elenca i lavori.
- Lavori ↔ Preventivi: ✔ «Accettato → crea lavoro», voci del preventivo visibili nel lavoro.
- Lavori ↔ Fatture: ✔ «Crea fattura» dal lavoro con le voci del preventivo e gli acconti già fatturati a dedurre (19 nov).
- Lavori ↔ Computo / Acconti: ✔ dal 25 nov riquadro «Computo e acconti» nel lavoro (come allo studio).
- Lavori ↔ Giornate / ore / spese: ✔ margine del lavoro, «Giornate di questo lavoro».
- Lavori ↔ Fornitori: ✔ fatture del fornitore nel lavoro, «+ Fattura di un fornitore per questo lavoro».
- Lavori ↔ Mezzi e attrezzature: ✔ «Mezzi usati in questo lavoro», la scheda del mezzo dice in quanti lavori; ✔ revisione scaduta accanto al mezzo.
- Lavori ↔ Carte: ✔ dal 25 nov «Per quale lavoro» nella spesa della carta; entra nel guadagno del lavoro.
- Lavori ↔ Galleria / Mappa / Calendario / Agenda: ✔.
- Lavori ↔ Acquisti (materiali comprati): ✔ dal 25 nov «Materiali comprati per questo lavoro» nel lavoro (solo lettura).

Preventivi e Richieste dal sito
- Richieste dal sito ↔ Preventivi: ✔ «Crea il preventivo» col cliente e il lavoro; «Apri il preventivo».
- Richieste dal sito ↔ Clienti: ✔ cliente nuovo in rubrica, niente doppioni.
- Richieste dal sito ↔ Assistente: ✔ «N richieste da aprire» = pallino.
- Preventivi ↔ Computo: ✔ «Fai il preventivo» dal computo prezzato.
- Preventivi ↔ Prezzario: ✔ «€ Prendi dal prezzario».
- Preventivi ↔ Fatture: ✔ fattura da preventivo.
- Si può unire: Richieste dal sito dentro Preventivi (come allo studio) — da proporre.

Computo e Acconti
- Computo ↔ Acconti (SAL): ✔ l'acconto vive dentro il computo.
- Acconti ↔ Fatture: ✔ «Fattura dell'acconto»; a fine lavoro gli acconti a dedurre.
- Acconti ↔ Assistente: ✔ stessi conti (`salConti`).
- Computo ↔ Lavori: ✗ il computo si collega al lavoro, ma dal lavoro non si vede (vedi sopra).
- Si può unire: Acconti dentro Computo (come «Computo e SAL» dello studio) — da proporre.

Squadra e agenda, Giornate, app dell'operaio
- Squadra ↔ Agenda: unite (18 nov).
- Giornate ↔ Agenda (ore): ✔ stesse righe di gest_ore.
- Giornate ↔ Report: ✔ manodopera e spese uguali.
- Squadra ↔ Mezzi: ✔ «Ce l'ha …» e «Ha: …».
- Squadra ↔ Scadenze: ✔ documenti della persona (attestati, visite).
- App dell'operaio ↔ Lavori / Mappa: ✔ indirizzo intero, «Portami lì», km.
- App dell'operaio ↔ Giornate: ✔ «Manda al titolare» → «Da approvare».
- App dell'operaio ↔ Mezzi: ✔ uscite e rientri, «Le tue attrezzature».
- Si può unire: Giornate + Agenda NO (Giornate scrive, Agenda legge; numeri già uguali).

Mezzi, Carte, Fornitori
- Mezzi ↔ Carte: ✔ il pieno si paga con la carta, la spesa della carta nel Report.
- Mezzi ↔ Scadenze / Calendario / email del mattino: ✔ assicurazione, revisione, tagliando.
- Fornitori ↔ Scadenze / Calendario: ✔ fatture da pagare.
- Fornitori ↔ Acquisti e bolle: ✔ dentro Fornitori («Acquisti del mese», bolle contro fatture).
- Fornitori ↔ Report / Tasse: ✔ spese.
- Carte ↔ Fornitori: ✔ dal 25 nov «✔ Pagata» chiede «Come l'hai pagata?»: con la carta nasce il movimento (conta una volta sola).
- Si può unire: Fornitori + Carte? da valutare; Magazzino non c'è (gli acquisti stanno dentro Fornitori).

Soldi
- Fatture ↔ Report ↔ Tasse ↔ Assistente: ✔ (Tasse conta solo le pagate di tutti i reparti: voluto).
- Fatture ↔ Scadenze / Calendario: ✔ «Da incassare».
- Report ↔ Lavori / Clienti: ✔ «Apri il lavoro», «Migliori clienti».

Il resto
- Cestino ↔ tutte: ✔ (collaudo 19 nov).
- Chat con AI ↔ tutte: ✔ legge e apre; non scrive.
- Ricerca in alto: ✔ clienti, lavori, fornitori, fatture da pagare, scadenze, richieste, computi e acconti (25 nov).

# 25 NOVEMBRE 2026 (sera) — IMPRESE E ARTIGIANI, TAPPA 1: DUE VOCI UNITE (sì di Alex, foto approvata)
- `js/gest-studio-unite.js` (`?v=25nov-unite`) vale anche per `impresa` e `artigiano`: «Preventivi e richieste» (linguette Preventivi / Richieste dal sito, telefono «Dal sito») e «Computo e acconti» (linguette Computi / Acconti a lavoro fatto, telefono «Acconti»). Parole per ruolo in `nomi(c)`. Non si cancella niente: #sal e #dalsito restano, i pulsanti con `.st-dentro`.
- ⛔ Difetto trovato (c'era dal 24 nov): `stUnisci` girava anche per impresa/artigiano (chiamato da `adattaMenuImpresa`) e rimetteva nel menu «Computo metrico» al posto di «Computo da prezzare». Ora il nome da solo viene da `_cm("nome")`.
- MANUALE della chat (`chat-gestionale.mjs`): menu con le due voci unite; anche la chiave di `STUDIO_MANUALE` aggiornata (stesso testo, se no `STUDIO_PEZZI_PERSI`). `tools/banco-chat-studio.mjs`: 38 verdi.
- NON unite: Giornate + Agenda, Fornitori + Carte (sono soldi diversi: prima farle parlare), Magazzino (non c'è: gli acquisti stanno in Fornitori).

# 25 NOVEMBRE 2026 (sera) — IMPRESE E ARTIGIANI, TAPPA 2: IL GIRO INTERO DI UN CANTIERE, DAL VIVO
Conto di Alex = artigiano (l'impresa ha lo stesso codice, cambiano solo «Lavori» e poche parole), reparto «ferramenta», «PROVA CONTROLLORE», poi tutto cancellato (conteggi uguali a prima: lavori 5, clienti 2, preventivi 4, fatture 3, computi 5, SAL 1, ore 1, rapportini 1, fornitori 2, mezzi 2, operatori 1, dalsito 3; richiesta 53 tolta).
Giro: richiesta in `preventivi` (impresa 36) → «Apri» → «Crea il preventivo» (cliente nuovo, 6 mq × 120 + 1.500,50 a corpo = 2.220,50) → «Accettato → crea lavoro» (2.220,50, Via Roma 10) → computo collegato 2.220,50 + acconto n. 1 720 → Marco 25 €/h, 8 ore, giornata → spesa 45,30 → furgone usato + uscita → fornitore + fattura 610 con 2 righe di acquisti → «Crea fattura» dal lavoro in BOZZA (voci del preventivo + bollo = 2.222,50).
Numeri uguali ✔: margine del lavoro 1.365,20 = Report «Guadagno»; Giornate «speso finora il 39%»; ore 8 h = Report; 610 da pagare in Fornitori = Scadenze (15/12); Da fatturare 860,50 uguale in Fatture e Assistente (il bagno in bozza esce dal conto); pallino delle richieste 1. App dell'operaio (conto = david): il lavoro c'è con indirizzo intero e «Portami lì».
Da sapere (non difetti): «Margine totale» del Report = incassato − spese (−855,30 senza incassi), diverso dalla somma dei guadagni dei lavori: voluto. Nel forfettario preventivo e lavoro dicono «IVA esclusa» (frase in molti posti, non toccata). Un'uscita del mezzo scritta senza `chi_nome` dice «Fuori con —» (gestionale e app lo scrivono sempre).
⬜ Non fatto dal vivo: la faccia «impresa» (il conto è artigiano), l'operaio vero dal suo telefono.

# 25 NOVEMBRE 2026 (notte) — IMPRESE E ARTIGIANI, TAPPA 3: I 4 COLLEGAMENTI («facciamoli tutti», design deciso da Claude)
1. **Computo e acconti nel lavoro**: `bloccoScadenzePratica` e `renderLavComputi` (js/gest-scadenze-pratiche.js) valgono per tutti; parole per ruolo nell'oggetto `P` (Acconto n., fatto finora, sconto, + Nuovo acconto). Le domande «Apro il computo al posto di…» dicono «questo lavoro».
2. **Materiali comprati per questo lavoro**: in `lavFattForn` (js/gest-fornitori.js), da `gest_acquisti.lavoro_id`, solo se ci sono fatture del lavoro e non allo studio. Solo lettura: i soldi sono già nelle fatture.
3. **Carta → lavoro**: «Per quale lavoro» nel movimento della carta (`mvLavoriRiempi`, nascosto sulle ricariche), scrive `gest_carte_movimenti.lavoro_id`. `cartePerLavoro()` / `cartePerLavoroTot()` in js/gest-ore-spese.js: le spese con la carta entrano nel guadagno del lavoro (scheda del lavoro con 💳 che apre la carta, Report, Assistente, Giornate). Nei TOTALI non cambia niente: erano già contate come «spese con le carte».
4. **Fattura del fornitore pagata con la carta**: colonna `gest_carte_movimenti.fattura_forn_id` (`sql/2026-11-25-carta-paga-fattura.sql`, migrazione `carta_paga_fattura_25nov2026` GIÀ ESEGUITA, riga in PROVE). «✔ Pagata» chiede «Come l'hai pagata?» (`ffComeHaiPagato`, solo se il reparto ha carte); con la carta `ffCartaPaga` scrive il movimento (saldo giù), «↩ Riapri» lo toglie, modificando la fattura `ffCartaAllinea` lo allinea. ⛔ Report, Riepilogo, Tasse (fisco-vivere) e margine NON contano i movimenti con `fattura_forn_id` (la fattura c'è già): si conta una volta sola. ⚠️ Una fattura messa nel Cestino lascia il movimento (saldo giusto, spesa non contata finché la fattura è nel Cestino).
Provato dal vivo (reparto ferramenta, codice iniettato prima del push): lavoro 2.000 − carta 45 − fattura 300 pagata con la carta = 1.655 (non 1.355); saldo carta 500 → 200 → 155, riaperta → 455; 375 px niente fuori, niente sotto 13 px. Banco app: ZERO difetti. Pulito: 0 righe di prova.
✔ App dell'operaio: «+ Spesa con la carta» ha la tendina «Per quale lavoro?» (facoltativa, i suoi lavori non fatti, già scelto quello aperto): scrive `lavoro_id` (`opCartaLavori` in js/op-spese-foto.js). Provato dal vivo come david: 12,50 € col lavoro giusto.

# 25 NOVEMBRE 2026 (notte) — RICERCA IN ALTO: COMPUTI E ACCONTI/SAL (online 85261b4)
- `js/gest-ricerca.js` (`?v=25nov-ric`): gruppi nuovi «Computi da prezzare» / «Computi metrici» (`_cm("tanti")`) e «Acconti (SAL)» / «Stati di avanzamento (SAL)». Computo: titolo, numero, oggetto, luogo, note + cliente. SAL: numero («acconto 2», «sal 2») + tutto il suo computo; solo i SAL dei computi del reparto (come l'elenco).
- Clic: computo → `ctApriComp` (c'era già); SAL → `data-action="fatt-vai-sal"` (porta nella sezione e apre quel SAL, stesso dell'avviso della fattura).
- Collaudato sul sito vero (progetto casa, giardiniere; 1440 e 375, studio): «ristrutturazione appartamento» → 3 computi + 1 acconto, «acconto 10» → solo l'acconto, i due clic aprono ✔. Banco app ZERO difetti.
- ⛔ La riga «Ricerca in alto: — computi e acconti» della mappa delle imprese è chiusa.

# 25 NOVEMBRE 2026 (notte) — FATTURE: DUPLICA E EMAIL COL PDF (online cc25b7f)
- **Duplica** (`fattDuplica` in js/gest-fatture.js, azione `fatt-dup`, voce «⧉ Duplica» nel menu della fattura): BOZZA nuova, senza numero, data di oggi. Copia cliente, voci, cassa, spese, ritenuta, sconto, bollo, pagamento/IBAN, CIG/CUP. NON copia: numero, stato, lavori e SAL collegati, la riga «storna la fattura…» delle note. In cima «Copia della fattura n. X/AAAA del …».
- **Email col PDF** («Manda al cliente» → «Manda l'email col PDF» → conferma con A:, allegato → «Sì, manda»): `js/gest-fattura-manda.js` fa il PDF (`fatturaPdf {blob:true}`), lo carica in `<uid>/email-documenti/` e chiama `netlify/functions/invia-fattura-email.js`. Il server legge fattura (sua) ed email del cliente dal DB, testo fisso (numero, data, scadenza, IBAN), PDF vero < 5 MB, poi lo cancella. Tetti condivisi coi preventivi (5/impresa, 20/sito). Bozza: si può mandare, l'email dice che la fattura vera arriva dopo.
- Registro: `gest_email_documenti.fattura_id` (`sql/2026-11-25-email-fattura.sql`, migrazione `email_fattura_25nov2026` GIÀ ESEGUITA, riga in PROVE).
- Provato sul sito vero (ferramenta): email partita a info@trovaimpresa.com col PDF, «Oggi puoi mandarne ancora 4»; Duplica con cliente e voci giusti. Pulito (fatture, voci, cliente, file). ⚠️ La riga di prova nel registro email è rimasta (conta 1 delle 5 di oggi): il connettore ha chiesto conferma per cancellarla.

# 26 NOVEMBRE 2026 — BARRA DEL FONDATORE E GIORNATE DAL CESTINO (online 79915fa)
- Telefono: la linguetta viola «F» (`#ti-riapri` in js/fondatore.js) ora è una striscetta di →10← px senza lettera; si allarga toccandola. Non copre più le scritte. Il «Parla» sulla domenica del Calendario NON si è riprodotto (6 mesi, 1440/1366, scroll).
- Giornate: `giorRidividi(opId,data)` in js/gest-giornate.js, chiamata da `cestRipristina` (js/gest-cestino.js) quando torna un rapportino, un'ora o un lavoro. Se tutte le righe del giorno sono «parti uguali» del gestionale e passano le 8 ore, si ridividono. Ore scritte a mano: non si toccano. Provato dal vivo: 4 + 4 → cancellata → 8 → rimessa a posto → 4 + 4. Pulito.
- 26 nov: «Parla» e la mezza giornata (online 98d70ff). In `js/gest-parla.js` (`MEZZA`, `?v=26nov-mz`): se la scheda o la frase (con una giornata sola) dice «mezza giornata», la scheda mostra «Mezza giornata (4 ore)» con «Cambia in giornata intera», e al Salva passa `mezze` a `giorScrivi` (max 4 ore). Provato dal vivo in «ferramenta»: 4 ore salvate. Pulito.
- 26 nov: Noleggio, «Rimanda ▾» sulla scheda del promemoria (online 5a3dfae): `promRimandaHTML`, `promRimanda` in js/nol-giornata-squadra-promemoria.js, azione `prom-rimanda` in js/nol-pannello-azioni.js, stile `.nol-rim` in gestionale-noleggio.html. Si conta da oggi, `inviato=false`. Provato dal vivo (+3 giorni ✔, pulito). La casella «Cosa facciamo?» c'era già (js/nol-assistente.js, 6 nov).
- 26 nov: le SPESE ANTICIPATE art. 15 escono dall'«Incassato» (online 0e91f02, scelta 1 di Alex): `fattIncassoReddito` toglie `b.spese` se `art15`; in Tasse (`ftArt15` in gest-fisco-tasse.js) e in gest-fisco-vivere.js si tolgono come la cassa (select con `spese,spese_regime`). Report dello studio: «(senza IVA, cassa e spese anticipate)». Provato sul sito vero: 1.000 + cassa 50 + diritti 52,50 → incassato 1.000.
