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
- Deploy: Netlify pubblica in automatico a ogni push su `main`.

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

### 3. Verificare che una scrittura sia andata a buon fine
Aggiungere sempre `.select('id')` a UPDATE e DELETE e controllare che tornino righe.
Senza, una scrittura bloccata da RLS e' indistinguibile da una riuscita.
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
