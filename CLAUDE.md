# Memoria progetto — TrovaImpresa

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
- I banchi di prova NON stanno qui: stanno nel contenitore di Claude, in `prove/`.

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

## 7 agosto 2026 — Studio rifinito, Negozio revisionato, FORNITORI (funzione nuova)

### Fix Gestionale Studio (professionisti) — fatti
- Le card **Mezzi e Carte non compaiono più nel Riepilogo** del professionista
  (`_proNascosto()` in renderRiepilogo); bloccato anche il deep link `#mezzi` in `_applyDeepTab`.
- **Avvisi "manca la migrazione SQL" non più coperti dal toast verde**: un solo messaggio
  finale (flag `avvisoPratica`/`avvisoPratica2`/`avvisoParcella`, e `tolte` in saveCli).
  REGOLA: mai due toast di fila — il secondo cancella il primo, l'avviso muore non letto.
- Il blocco **"📄 Dati della pratica" compare anche alla CREAZIONE** del lavoro
  (`${bloccoPratica(job)}` nella sheet corta), non solo in Modifica.
- Due frasi nuove aggiunte a `_FRASI` (preventivo non accettato, lavori collegati fattura).

### Revisione gestionale-negozio.html (stessa cura del 6 agosto) — fatta
- **Salvataggi sicuri su tutte le ~20 scritture** (`.select('id')` + controllo righe).
- **`pvAccetta` col lucchetto anti doppio scarico**: PRIMA lo stato → "accettato" con
  verifica e `.neq("stato","accettato")` (lucchetto lato server), POI lo scarico giacenze
  con esiti controllati riga per riga (elenco "falliti" nell'alert); flag `_pvAccettaInCorso`
  contro il doppio clic veloce. Mai più scarichi doppi o finti.
- **+/− del magazzino**: `parseFloat` + giacenza riletta dal DB (prima `parseInt` sul testo
  a schermo troncava i decimali: 12,5 mq + un clic = 13).
- **Numerazione fatture PDF** verificata prima di stampare (niente numeri doppi).
- Anti-doppioni sul salvataggio del preventivo (delete verificata + select dei resti).
- Doctype/head/`<title>Gestionale Negozio</title>` + noindex; toast verdi/rossi con
  `traduciErrore()`; **Condomini→Clienti**; note calendario su `gest_note` (stessa tabella
  del 6/8, migrazione automatica dal localStorage); jsPDF/xlsx lazy; `_authRefresh` anti
  doppio render; tolto il doppio `renderRiepilogoNegozio()` in enterPanel.
- NON ancora fatto sul negozio (minore): `esc()` sui dati nelle card delle sezioni neg_*
  (self-XSS), banner errore-lettura sul riepilogo negozio, numerazione preventivi
  client-side (max+1, rischio doppioni con due dispositivi).

### FORNITORI — idea di Alessio (7 agosto), fasi 1+2 FATTE su gestionale-app
La metà "soldi in uscita" che mancava: le rivendite dove l'impresa compra il materiale.
- **Tabelle**: `gest_fornitori` (anagrafica) + `gest_fatture_fornitori` (fatture passive:
  numero, data, importo, scadenza, stato da_pagare/pagata, lavoro_id facoltativo).
  DDL: `sql/gest-fornitori.sql`. RLS **solo owner** (i collaboratori non vedono i conti).
  Fase 2: colonna `fornitore_id` su `gest_spese` (`sql/gest-spese-fornitore.sql`, set null).
- **UI**: voce menu "Fornitori" (gruppo Azienda, sotto Clienti) con badge `#cnt-fornitori`
  (rosso se fatture scadute); card fornitore con 📞 Chiama / WhatsApp (riusa `sq-wa`) e
  "Da pagare: X (n)" + "Speso nel [anno]: Y"; lista fatture con riga rossa se scaduta,
  "✔ Pagata"/"↩ Riapri"; riassunto in testa "X € da pagare in N fatture — M scadute";
  card "Fornitori" nel Riepilogo (2 scadenze più vicine); tendina "— fornitore —" nella
  riga di aggiunta spesa del lavoro (facoltativa, si nasconde se anagrafica vuota).
- **Paracadute ovunque**: migrazione non eseguita → la sezione dice quale file SQL serve,
  la spesa si salva senza fornitore con avviso, il Riepilogo non va in errore (lettura
  separata tollerante, NON dentro il Promise.all principale — sennò scatterebbe il banner
  "Non riesco a leggere i dati").
- **Fase 3 (futura, strategica)**: collegare i fornitori ai NEGOZI ISCRITTI a TrovaImpresa —
  "aggiungi fornitore" propone i negozi della zona, e il preventivo fatto dal negozio col suo
  gestionale arriva dentro il gestionale dell'impresa. È il ponte marketplace che nessun
  concorrente può copiare. Da fare quando ci saranno più negozi iscritti.
- ⚠️ VERIFICARE che Alessio abbia eseguito le 2 migrazioni SQL su Supabase.

### Noleggio: analisi fatta, decisione = STRADA 2 (in cassetto)
- **`gestionale-noleggio.html` è ORFANO**: nessun percorso cliente ci arriva — l'unico link
  sta in `admin.html`. Il pannello-negozio porta TUTTI i negozi (anche i noleggiatori) a
  `gestionale-negozio.html`. Deciso con Alessio: niente lavoro grosso finché non c'è un
  cliente noleggiatore vero; resta solo da fare la messa in sicurezza minima.
- Problemi mappati per quando servirà: zero scritture verificate; il ciclo noleggio NON
  tocca lo stato del mezzo (risulta "disponibile" mentre è fuori) né `neg_movimenti`;
  doppio noleggio dello stesso mezzo possibile senza avviso; niente pulsante "Registra
  rientro" (si riedita tutto il form); mezzo e cliente salvati per NOME e non per id;
  KPI "Incassato noleggi" conta anche i non pagati; le tariffe giorno/settimana/mese non
  vengono mai usate (importo a mano); dice "Riepilogo negozio" dentro l'app noleggio;
  `loadProdotti` diverge da quello del negozio (senza unità/margine); dati senza `esc()`.
- **DA FARE (piccolo)**: messa in sicurezza minima del noleggio (salvataggi verificati,
  doctype/title, toast) — non ancora fatta.

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

**Il numero da guardare non è quante città, ma quante imprese per città.** Al 6 agosto:
Roma 6, Napoli 3, Torino 3, Sassari/Pavia/Venezia 2, **tutte le altre 1 sola**. Una pagina
con una sola impresa vale poco per Google e ancora meno per il cliente, che chiede un
preventivo e non può confrontare niente. La soglia utile è **3-4 imprese per città**:
meglio concentrarsi sulle città già avviate che spargersi su quelle vuote.

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

## SITO PUBBLICO — revisione del percorso cliente (7-8 agosto 2026)
Stessa cura fatta sul gestionale, applicata al **Blocco A: il percorso del cliente**
(home → cerca-* → profilo-impresa), cioè la strada che porta alle richieste di preventivo.
Regola SEO rispettata: **mai toccati** title, meta, canonical, JSON-LD, sitemap.

### Passo 1 — il preventivo raggiungibile + contatori veri
- **`profilo-impresa.html`: barra fissa in basso su mobile** (`.cta-bar-mobile`, sotto 768px)
  con "📋 Preventivo gratuito" + "📞 Chiama". Prima il CTA stava in una colonna che su
  telefono finiva dopo ~5 schermate. Si nasconde con `showPreventivo/showIncarico` e
  torna con `hidePreventivo/hideIncarico`; `#cta-bar-tel` segue lo stesso numero di `#btn-tel`.
- **Tolto il widget calendario/meteo/note** dal profilo: chiedeva la **geolocalizzazione**
  al cliente appena apriva (popup del browser = diffidenza immediata) e occupava la prima
  schermata senza dire niente sull'impresa.
- `#risultatiCount` esisteva ma non veniva mai aggiornato su 3 pagine su 4: restava
  "Ricerca in corso..." per sempre. Ora dice "Trovate N imprese" / "Nessun risultato" /
  "Scegli una città per iniziare" / "Errore di caricamento".
- **BUG "Roma, RM"**: la query usava `cittaSafe` (senza virgole) ma `filtraDistanza`
  riceveva `cittaScelta` (con la virgola) → confronto fallito → zero risultati con imprese
  esistenti. Ora passano entrambi `cittaSafe`. (cerca-artigiani era già giusto.)
- **Premium regionale ora su tutte e 4 le pagine**: la mappa città→regione (`window._C2R`,
  costruita da `GEO_ITALIA`) era solo in cerca-artigiani; sulle altre il vantaggio Premium
  scattava solo scegliendo la regione a mano, cioè quasi mai. Vantaggio venduto ma non dato.
- Doppia `cerca()` all'avvio rimossa su imprese/negozi/professionisti.

### Passo 2 — sicurezza e fiducia
- **XSS (era il buco più grave)**: nome/descrizione/città/mestiere/orari/logo delle imprese
  finivano in `innerHTML` senza escape su TUTTE le pagine di ricerca, nei popup mappa, negli
  annunci sponsorizzati e in 3 punti del profilo. Chiunque si registrava poteva iniettare
  script eseguito nel browser di **ogni cliente**. Aggiunta `_sx()` in ogni pagina cerca
  (stessa forma di `_esc`/`recEsc` già presenti nel profilo) e applicata ovunque.
  I banner pubblicitari (`spazi-laterali.js`, `pubblicita-spazi.js`) ora costruiscono
  l'`<img>` con `createElement` invece che concatenando HTML.
  `c.file_url` delle certificazioni: aperto solo se `^https?://` (bloccato `javascript:`).
- **Fiducia** (segnali che facevano dubitare il cliente proprio mentre decideva):
  tolta la statistica **"Piano: Free"** dal profilo; tolto l'avviso *"solo le 3 recensioni
  più recenti sono visibili sul piano Free"*; tolto l'orario **"Lun–Ven 8:00–18:00"** che era
  scritto fisso uguale per tutte le imprese (informazione inventata); "Risposta entro 24 ore"
  allineato a "24-48 ore" come dice il form; tolto il **"P.IVA —"** vuoto dal footer della home
  (⚠️ **Alessio deve ancora dare la P.IVA**: c'è un commento HTML pronto in `index.html`).
- **`risultati.html` era una pagina zombie**: `#nav-search-input` non esiste → TypeError →
  restava su "Caricamento..."; senza `?q` mostrava **tutte le imprese d'Italia** ignorando
  `?citta=&tipo=&mestiere=`; filtri, checkbox e paginazione tutti finti. Sostituita con un
  **instradamento** che porta alla pagina cerca giusta tenendo città/mestiere/regione.

### Passo 3 — il filo dell'intenzione + filtri su telefono
- **Il giro a vuoto della città**: cliccando una categoria dalla home nazionale, `vaiA()`
  mandava sempre a `index.html?citta=X` — l'utente scriveva la città e si ritrovava al punto
  di partenza, senza capire che doveva ricliccare la categoria. **La regola di Alessio (passare
  dalla home città, dove vive la pubblicità venduta) è stata mantenuta**: ora la meta viaggia
  come `&vai=cerca-artigiani.html` e la home città mostra in cima un pulsante arancione
  "Vedi gli artigiani di Roma →" (`#riprendi-ricerca` in index.html + `homeConMeta()` nel js).
  NB: le pagine cerca-* NON hanno spazi pubblicitari (scelta di Alessio di luglio) — è per
  questo che il passaggio dalla home città serve.
- **Filtri su mobile**: sotto 700px `.sidebar` era `display:none` **senza alternativa**: da
  telefono era impossibile scegliere mestiere, valutazione o distanza. Ora è un pannello a
  tutto schermo (`.sidebar.aperta`) aperto dal pulsante `.filtri-btn` sopra i risultati, con
  barra fissa "Mostra i risultati" (`.filtri-azioni`) per chiudere. Su desktop invariato.

### Passo 4 — velocità
- **Leaflet non blocca più il primo caricamento**: tolto dal `<head>` delle 4 pagine cerca e
  del profilo; ora `caricaLeaflet()` (CSS+JS iniettati a richiesta) + `IntersectionObserver`
  sul `#mappa-risultati` con `rootMargin:250px`. `aggiornaMappaRis` salva i risultati in
  `_ultimiRis` e li disegna quando la mappa si accende. Nel profilo la mappa parte solo se
  l'impresa ha lat/lng, e se il download fallisce il riquadro si nasconde.
  Effetto collaterale voluto: il **geocoding a 1,1s per impresa** non parte più se nessuno
  guarda la mappa.
- **Sponsor: N+1 eliminato** — `loadAnnunciCategoria` faceva una query per ogni annuncio;
  ora una sola `.in('id', ids)` + mappa in memoria.
- `index.html`: supabase-js in `defer` (lì serve solo alla pubblicità) + `preconnect` verso
  Supabase e jsDelivr. Loghi delle card con `loading="lazy"` e width/height (niente salti).
- **NON fatto di proposito**: ridurre le colonne di `select('*')` nelle ricerche. Con ~50
  imprese il guadagno è nullo e il rischio di rompere un campo in silenzio è concreto.
  Da fare quando la banca dati cresce (allora enumerare le colonne davvero usate da
  cardHTML, filtraDistanza, ordinaFuoriZona e i popup mappa).

### Passo 5 — rifiniture che fanno perdere clienti
- **Zero risultati = pulsante, non solo consiglio**: `bottoneAllarga(distanzaMax)` +
  `allargaRicerca(km)` mostrano "📍 Allarga la ricerca a 30 km" (o "Cerca in tutta la zona").
  Con 49 imprese su 106 città la ricerca a vuoto è il caso più frequente.
- **"← Torna ai risultati" era `history.back()`**: chi apriva il profilo da un link ricevuto
  su WhatsApp cliccava e non succedeva NIENTE. Ora `#nav-back` punta alla pagina cerca giusta
  per `d.tipo` con la città (`ti_citta_scelta` o quella dell'impresa), e usa `history.back()`
  solo se `document.referrer` è dello stesso host.
- **cerca-artigiani, chip mestiere**: `#mestieri-list .filter-btn` non esiste (il filtro è una
  `<select>`) → il clic sul chip andava in errore e il filtro restava. Aggiunto
  `id="mestiereSelect"`, chip riparato, e `?mestiere=` da URL ora aggiorna anche la tendina
  (prima filtrava ma la tendina diceva "Tutti i mestieri").
- Risultati troncati a 50: ora lo dice ("le prime 50 — restringi la zona"). Badge PREMIUM /
  Sponsorizzato / "anche nella tua regione" portati da 10-11px a 12-12,5px.

### Sito: cosa resta da fare (Blocco A e oltre)
- **Coerenza fra le 4 pagine cerca**: sono quasi-copie divergenti (card con bordo sopra vs a
  sinistra; paginazione solo su artigiani; mestieri come `<select>` su imprese/artigiani ma
  chips su negozi/professionisti). Da unificare.
- **Home**: i due blocchi "Cerca" e "Iscriviti" sono graficamente identici (stesse 4 tessere,
  stesse icone) — un privato può finire per sbaglio nella registrazione impresa. Le tendine
  `.tile-sel` dentro le tessere sono di fatto invisibili/inutili.
- `professionisti.html` è una quinta pagina di ricerca separata da `cerca-professionisti.html`
  (la home linka la prima, l'header le altre): capire quale tenere.
- **Blocco B** (registrazioni, login, i 4 pannelli) e **Blocco C** (blog, guide, pagine di
  servizio): non ancora revisionati.

## SITO — BLOCCO B: registrazioni e login (8 agosto 2026)
Percorso dell'IMPRESA, quello che porta le iscrizioni con la campagna Meta.

### Login e recupero password
- `login-impresa.html`: `traduciSupabase(msg)` → `{testo, rimanda}`. Gli errori Supabase in
  inglese diventano italiano; quando l'errore è "email non confermata" compare il pulsante
  **"📨 Rimandami l'email di conferma"** (`rimandaConferma()` con `auth.resend({type:'signup'})`).
  Prima chi non trovava la mail di conferma restava fuori per sempre.
- `reset-password.html`: prima aspettava SOLO l'evento `PASSWORD_RECOVERY`. Con link scaduto,
  già usato o col flusso nuovo `?code=` (che emette `SIGNED_IN`) la pagina restava su
  "⏳ Verifica del link in corso..." per sempre. Ora `decidi(ok)` accetta anche
  `SIGNED_IN`/`INITIAL_SESSION`, e dopo **6 secondi** senza risposta controlla la sessione e
  decide comunque. Errori `updateUser` tradotti (niente più "New password should be different").

### I 4 form di registrazione: accorciati E finalmente salvano
- **Accorciati**: i campi facoltativi sono dentro blocchi `<details class="extra">`
  ("Aggiungi altri dettagli") — HTML nativo, zero rischio JS. Sopra restano solo i campi
  che servono davvero per iscriversi.
- **`mostraSchermataConferma(email)`**: pannello a tutta pagina dopo il signUp, con il
  pulsante per rimandare la mail di conferma. Prima si veniva sbattuti su login-impresa.
- `emailRedirectTo: window.location.origin + '/login-impresa.html'` e **AbortController a 25s**
  sul signUp (prima, su rete lenta, il pulsante restava "⏳ Invio..." all'infinito).
- **E ora SALVANO**: `sql/trigger-campi-extra.sql` (già eseguito) aggiunge il trigger
  `on_auth_user_created_extra` → function `completa_profilo_extra()`. Gira **dopo**
  `on_auth_user_created` (ordine alfabetico dei trigger a parità di evento) e completa la
  riga con: `nome_negozio, tipo_negozio, mestieri` (2° e 3° mestiere dell'artigiano) e i
  campi facoltativi `piva, indirizzo, cap, descrizione, whatsapp, sito_web, specializzazioni,
  zone, anno_fondazione, dipendenti, anni_esperienza`.
  - **NON tocca `crea_profilo_impresa`**: è il pezzo più delicato del sito.
  - Ha `exception when others then return new;`: se qualcosa va storto la registrazione
    NON si blocca. Meglio un campo mancante che un'iscrizione persa.
  - ⚠️ Il bug che ha risolto: il form del NEGOZIO obbligava a scegliere la categoria
    (Ferramenta, Termoidraulica...) ma `tipo_negozio` non arrivava mai nel profilo. La
    ricerca negozi filtra proprio su quella colonna: **ogni negozio iscritto era invisibile**
    quando un cliente filtrava per la sua categoria.

### ⚠️ TRAPPOLA: i riferimenti orfani quando si toglie un pezzo dal form
Togliendo il finto caricamento del logo era rimasto
`document.getElementById('logo-input').addEventListener(...)`: su un id inesistente è un
TypeError che avrebbe **ammazzato TUTTE le registrazioni**. Preso col grep prima di consegnare.
Stessa cosa era già successa con `#stat-piano` nel profilo (vedi Blocco A).
**REGOLA**: quando si rimuove un elemento da una pagina, `grep` dell'id in tutto il file
prima di consegnare, e provare la pagina in un browser vero.

## SITO — BLOCCO C: blog, guide e pagine di servizio (8 agosto 2026)
28 file: `blog.html`, `articolo.html`, `calcolatori.html`, `costi-ristrutturazione.html`,
`controlla-preventivo-bagno.html` e le 23 guide.

### Passo 1 — le guide non erano collegate al marketplace
- **`js/citta-obbligatoria.js` non era caricato su NESSUNA guida**: solo `index.html` lo
  aveva. Quindi ogni pulsante "Trova un artigiano" in fondo alle guide portava su una
  ricerca **vuota** che chiedeva di ridigitare la città, proprio nel momento in cui il
  lettore aveva appena letto il prezzo. Aggiunto su tutte e 28 prima di `</body>`.
  **Era il buco più costoso di tutto il Blocco C.**
- **Footer senza Privacy / Cookie / Termini su 26 guide su 28**: c'era solo una riga di
  disclaimer. Ora tutte hanno Chi siamo · Contatti · Tutte le guide · Per le imprese +
  Privacy · Cookie · Termini + copyright (e il commento pronto per la P.IVA).
- **Tabelle prezzi che spingevano la pagina di lato su telefono**: `table{display:block;
  overflow-x:auto}` sotto i 700px. Sbordo misurato dopo: 0px su tutte e 28.
- **Numeri senza separatore**: `toLocaleString('it-IT',{useGrouping:'always'})` — i
  calcolatori scrivevano "6600" invece di "6.600".
- **`blog.html` e `articolo.html` morivano** se la libreria Supabase non arrivava
  (`Cannot read properties of undefined (reading 'createClient')`) e restavano su
  "Caricamento..." per sempre. Ora `blog.html` ha `GUIDE_RISERVA` + `mostraRiserva()`:
  mostra comunque l'elenco delle 26 guide, che **sono file HTML statici e non hanno
  bisogno del database**. `articolo.html` dà un pulsante "Vai a tutte le guide".
  Tolto anche `<title>Caricamento... | TrovaImpresa</title>`, che è il titolo che finiva
  su Google e nelle anteprime WhatsApp.

### Passo 2 — il CTA dentro la risposta rapida
- Il box `.answer` ("Risposta rapida", con la cifra) è **dove si ferma la maggior parte dei
  lettori**: aveva il prezzo e zero link, il marketplace stava 5 schermate più giù.
  Aggiunto `.answer-cta` subito sotto, su 23 guide: "Quanto costa a casa tua?" + pulsante
  arancione "Chiedi preventivi gratis nella tua città". Su
  `come-trovare-clienti-impresa-edile.html` (guida B2B) il CTA porta invece a
  `registrazione-impresa.html`.
- **Il mestiere ora sopravvive al giro dalla home città**: `homeConMeta()` buttava via tutto
  quello che stava dopo il "?" del link, quindi
  `cerca-artigiani.html?mestiere=Cartongesso` perdeva il mestiere per strada. Ora viaggia
  come `&mest=` e `index.html` lo rimette nel link del pulsante arancione, che dice
  "Vedi gli artigiani per Cartongesso a Roma".
  ⚠️ **Le guide NON usano ancora `?mestiere=`**: con ~49 imprese iscritte un filtro stretto
  darebbe spesso zero risultati, e un elenco vuoto è peggio di un elenco generico.
  L'impianto è pronto: quando le imprese saranno di più, basta aggiungere `?mestiere=X`
  al link del CTA nelle guide. Valori validi = le `<option>` di cerca-artigiani/cerca-imprese.
- `cerca-imprese.html`: il blocco che leggeva `?mestiere=` cercava dei `.chip` che in quella
  pagina **non esistono** (il filtro è una tendina). Ad allineare la tendina ci pensa già
  `/js/sync-filtro.js`, caricato su tutte e 4 le pagine cerca — quindi qui è rimasto solo
  il filtro vero. Aggiunto `id="mestiereSelect"` per coerenza con cerca-artigiani.

### Passo 2b — le 4 pagine cerca e il profilo non muoiono più senza la CDN
Trovato provando le guide: se `cdn.jsdelivr.net` non risponde (blocco pubblicità del
telefono, wifi pubblico, rete lenta) `supabase.createClient` va in errore e **tutta la
pagina muore**: le 4 `cerca-*` restavano su "Ricerca in corso..." per sempre.
- Guardia prima di `const supabaseClient = ...` su tutte e 4: messaggio chiaro
  ("Non riesco a caricare l'elenco... può essere un blocco pubblicità") + pulsante **Riprova**.
- `profilo-impresa.html`: `sc` può essere `null`. **I dati della scheda arrivano da una
  `fetch` normale, non dalla libreria**, quindi la scheda (nome, telefono, indirizzo, mappa,
  barra CTA) ora si vede lo stesso. Le letture facoltative (video, foto lavori, vetrina)
  si saltano; i due form (preventivo e incarico) avvisano con `_senzaLibreria()` e
  suggeriscono di **chiamare il numero**, invece di sembrare rotti.

### Blocco C: cosa resta
- TOC (indice) nelle guide lunghe; portare le guide vecchie (tetto, cappotto, imbiancare,
  fotovoltaico, bagno) al modello di `quanto-costa-parete-cartongesso.html`.
- `contatti.html`: posizione del messaggio, validazione email, consenso privacy.
- `prezzi.html`: chiarezza sull'IVA e sul "3 mesi gratis".
- `chi-siamo.html`: manca la foto e il racconto dei 25 anni in cantiere.

## LAVORO DELL'8 AGOSTO 2026 (pomeriggio)

### Pagine di servizio (chiusura Blocco C)
- **contatti.html**: la conferma d'invio stava in cima alla pagina, quindi da telefono
  spariva fuori schermo dopo aver premuto Invia — spostata sopra al pulsante, con
  `scrollIntoView`. Tolto `alert()`: gli errori appaiono sotto al campo sbagliato, col
  bordo rosso. Email validata con regex (prima bastava una lettera). **Aggiunto il
  consenso privacy obbligatorio** con link alla Privacy Policy: senza spunta non parte.
- **prezzi.html**: **Alessio è in regime forfettario** — i prezzi (€5/mese, €49/anno)
  sono FINALI, nessuna IVA da aggiungere. Dicitura art. 1 commi 54-89 L. 190/2014 in
  fondo. Sistemato un bug: sull'annuale si leggeva "€49 al mese" (cambiava solo il
  numero, non il periodo). I 3 mesi sono **un regalo di lancio**, senza carta e senza
  rinnovo automatico. Tre FAQ nuove: carta, cosa succede dopo i 3 mesi, dov'è la fregatura.
- **chi-siamo.html**: vedi la regola fissa sul tono in cima a questo file. Tolto ogni
  riferimento ad Alessio. La sezione centrale ora **elogia le imprese**
  ("tra i più bravi al mondo") e presenta TrovaImpresa come **"una vetrina in più"**,
  mai come qualcosa che le imprese si meritano o di cui hanno bisogno.
- **P.IVA inserita**: 01285950570, nel footer di index.html sotto l'email.
  ⚠️ **Manca ancora l'indirizzo completo della sede** (via e civico) e il numero REA:
  servono nei Termini per l'identificazione ex art. 7 D.Lgs. 70/2003.

### Termini e Condizioni riscritti (termini-condizioni.html)
I vecchi erano un modello generico con un buco: la sezione 5 si intitolava "Piani Free"
e il Premium non era descritto affatto. Ora 18 sezioni con indice, scritte sul
funzionamento reale del sito: intermediario non parte del contratto, recensioni (con la
dichiarazione obbligatoria che NON c'è verifica preventiva, D.Lgs. 26/2023), procedura di
segnalazione contenuti illeciti + punto di contatto (DSA, Reg. UE 2022/2065), piani e
prezzi forfettari, recesso 14 giorni solo per i consumatori, dati del gestionale (30
giorni per esportarli), foro di Rieti per i professionisti.
- ⚠️ **NON inserire il link alla piattaforma ODR europea**: è stata dismessa il 20 luglio
  2025 e non è più obbligatoria. Al suo posto il rimando agli organismi ADR del MIMIT.
- Preparato **TrovaImpresa-Termini-per-avvocato.docx** con la bozza + 15 punti da far
  verificare a un legale. Da fare: farlo rileggere.
- `termini-servizio.html` è un doppione orfano, non linkato da nessuna pagina: da cancellare.

### Pannello admin (admin.html)
**22 bug corretti** in una passata. I tre gravi:
1. `renderImprese`/`renderCharts` esplodevano se un'impresa aveva `mestieri` salvato come
   testo invece che come lista → tabella e grafici bloccati su "Caricamento..." per
   sempre. Aggiunto l'helper **`_arr()`**: usarlo SEMPRE sui campi mestieri/zone.
2. `togglePassword` non era definita: l'occhio della password non faceva niente.
3. Quattro `return` muti su errore del database: le tabelle restavano su "Caricamento..."
   senza dire nulla. Aggiunto l'helper **`_erroreTabella(id, colonne, messaggio)`**.
Altri: "Regala Premium" non scriveva `premium_scadenza` (il regalo diventava premium a
vita e risultava "pagante"); "Elimina locandina" diceva sempre "✅ Eliminata!" anche se il
server rifiutava; il filtro "Da controllare" era sparito ed è stato rimesso; il conteggio
in alto non seguiva la ricerca; grafici e abbonamenti includevano i profili di prova
mentre le statistiche no; "null null" e "Invalid Date"; `doLogout` non svuotava le
credenziali. Nuovi helper riusabili: `_arr`, `_data`, `_nomeImp`, `_erroreTabella`, `_giorno`.

### Dashboard admin rifatta
Al posto delle due liste a barre (mestieri/città) c'è **"Crescita iscritti"**: colonne
delle nuove imprese per settimana, con i pulsanti **30 giorni · 3 mesi · Tutto** (su
"Tutto" raggruppa per mese). Sopra il numero grosso del periodo e la pillola
verde/rossa col confronto sul periodo precedente. Tooltip al passaggio del mouse.
- **Il grafico è SVG disegnato a mano, nessuna libreria esterna**: la CDN al sito è già
  stata bloccata in passato, un grafico che dipende da una CDN sarebbe morto.
- Mestieri e città sono ora dietro il pulsante "Vedi mestieri e città più richiesti",
  che apre la modal grande (`modal-content.classList.add('largo')`).
- Funzioni nuove: `renderCrescita()`, `creRange()`, `apriMestieriCitta()`, `_creRaggruppa()`.
  I dati arrivano da `_creLista`, popolata con `impreseVere` (senza profili di prova).

### Registrazioni: nessuno deve restare bloccato (8 agosto 2026, sera)
**Segnalazione reale di Chiara Colucci, interior designer di Torino**: non riusciva a
completare la registrazione e ha cancellato l'account. Pensava servisse il numero di albo;
il blocco vero era un altro: in `registrazione-professionista.html` la tendina
**"Professione principale" (obbligatoria)** aveva solo 14 voci tecniche — niente interior
designer e **niente "Altro"**. Chi non si riconosce nell'elenco non puo' andare avanti e se ne va.

Corretto ovunque:
- **registrazione-professionista.html**: aggiunte 12 professioni (interior designer,
  arredatore, home stager, progettista 3D, progettista del verde, geologo, termotecnico,
  tecnico acustico, tecnico antincendio, restauratore, consulente pratiche edilizie;
  "consulente energetico" rinominato "/ Certificatore APE").
- **registrazione-impresa.html** e **registrazione-negozio.html**: non avevano "Altro"
  per niente. Aggiunto.
- **registrazione-artigiano.html**: aveva un "Altro" muto, che non permetteva di dire cosa.
- In tutte e quattro: scegliendo **"Altro (scrivi quale)"** compare un campo di testo
  obbligatorio; quello che scrive l'utente viene messo **in cima al campo
  `specializzazioni`**, cosi' si vede sul profilo e lo trova la ricerca per testo.
  Funzione `mostraAltroMestiere()` / `mostraAltroTipoNegozio()`.
- Le stesse professioni aggiunte anche in `professionisti.html`, `cerca-professionisti.html`
  e nelle 3 tendine di `modifica-profilo.html`, altrimenti chi si iscrive non e' cercabile.

⚠️ **REGOLA**: ogni tendina obbligatoria di un modulo pubblico deve avere "Altro" con
campo libero. Un elenco chiuso su un campo obbligatorio e' un iscritto perso, in silenzio.

### Pubblicita' Meta: la diagnosi dell'8 agosto 2026
Collegato **Supermetrics** (connettore Claude) all'account Meta Ads. Dati reali degli
ultimi 15 giorni, campagna "Nuova campagna Contatti" (sempre ACTIVE, ~7,50 EUR/giorno):
- spesa 111,83 EUR · 31.690 impression · **448 clic sul link** · **193 arrivi sul sito**
  · 22 iscrizioni registrate dal pixel.
- **Il 57% dei clic pagati non diventa mai una visita**: ~64 EUR su 112 buttati. Causa:
  l'inserzione mandava sulla **homepage** (77 KB, 8 file JS di cui 3 bloccanti, Supabase
  da CDN, Google Fonts, GA) e per giunta alla sezione `#registrati` che sta alla riga
  1053 su 1300 — il telefono deve disegnare tutta la pagina sopra, piu' il banner cookie.
- Chi invece arriva davvero converte all'**11%**: il sito funziona, il problema era la velocita'.
- I due giorni senza iscritti (6-7 agosto) NON erano un guasto: spesa e clic regolari,
  era normale oscillazione (anche il 28-29 luglio zero). Ad agosto l'edilizia e' ferma.
- Il pixel copre quasi tutto: 14 conversioni contate contro 16 iscritti reali in 7 giorni.

**Creata `iscriviti.html`**: pagina di atterraggio per la pubblicita', **8 KB**, CSS in
linea, caratteri di sistema, zero script bloccanti, niente Supabase. Header + 3
rassicurazioni + i 4 pulsanti di registrazione + "cosa ricevi". `cookie-banner.js`
caricato con **defer** (a norma ma non blocca la prima schermata) e `noindex` per non
fare concorrenza alla home su Google.
- ⚠️ **Alessio NON vuole emoji**: usare le icone SVG a linea gia' presenti in `index.html`
  (sezione "Iscriviti"), dentro un quadratino azzurro. Vale per tutto il sito.
- Il link dell'inserzione va cambiato in **trovaimpresa.com/iscriviti.html**.

**Modifiche fatte su Meta l'8 agosto 2026** (campagna "Nuova campagna Contatti",
account act_1512448882327571, budget 10 EUR/giorno, obiettivo Advantage+ leads):
1. **URL dell'inserzione**: da `trovaimpresa.com/#registrati` a **`/iscriviti.html`**. Pubblicato.
2. **Età**: suggerimento **32-44** + controllo "Età minima" alzato a **25**
   (⚠️ nei Controlli Meta non fa salire il minimo oltre 25: il muro vero non si puo'
   mettere a 32 finche' resta acceso l'Advantage+).
3. Eliminate 7 bozze vecchie (ne restano ~10, tutte con errori, da pulire).
**NON fatto, deciso di aspettare**: spegnere l'Advantage+ per usare il pubblico classico
con età 32-55 come muro vero. Da valutare solo se martedì i numeri non si muovono.

**Riferimento da battere (15 giorni prima delle modifiche)**: 43% dei clic diventa una
visita al sito · 5,35 EUR per iscrizione · 11% di conversione da chi arriva davvero.
Migliori posizionamenti: Instagram Feed (2,61 EUR) e Facebook Feed (3,91). Peggiori:
Reels (5,83-6,82, ma si mangiano il 42% del budget), in-stream e Audience Network (zero).
Migliore fascia: **uomini 35-44, 11 iscrizioni su 20 a 2,98 EUR**.
⚠️ L'apprendimento e' ripartito l'8 agosto: non toccare niente fino al 12-13 agosto.

⚠️ **NON usare git dal ponte col PC, nemmeno `git status`**: l'8 agosto un mio `git status`
ha creato `.git/index.lock` che dal mio lato non si puo' cancellare, e ha bloccato tutti i
commit di Alessio. Se ricapita: `rm -f .git/index.lock` dal suo Git Bash.

## SEO E TRAFFICO — la fotografia dell'8 agosto 2026
Collegati a Claude via Supermetrics anche **Google Analytics 4** (proprieta' 541723327,
account pintoluzemilia@gmail.com) e **Google Search Console**. Da qui in poi i dati veri
si leggono da li', non a intuito.

### Quanto traffico c'e' davvero (30 giorni, 9 luglio - 7 agosto)
| Canale | Sessioni | Durata media | Engagement |
|---|---|---|---|
| Pubblicita' Meta | 740 (72%) | 42 secondi | 24% |
| Diretto | 138 | 5 minuti | 64% |
| **Google organico** | **82** | **7 minuti** | **65%** |
| Social non pagato | 41 | 1 minuto | 54% |

**34 visite al giorno in tutto.** Tolta la pubblicita' e il diretto restano 4-5 visitatori
veri al giorno: **ecco perche' era arrivato un solo preventivo. Non e' il sito ad essere
rotto, e' vuoto.** Il traffico da Google e' pochissimo ma di gran lunga il migliore
(7 minuti di permanenza).

### Le pagine SONO indicizzate: il problema e' la posizione
Search Console, 28 giorni: **~2.000 impression, ~55 clic**. robots.txt e sitemap (150 URL,
18 guide + 106 pagine citta') sono a posto. Le pagine ci sono, ma stanno troppo in basso:
- infissi: 593 impression, 4 clic, **posizione 8**
- condizionatore 176 (pos 26) · idraulico 159 (pos 11) · bagno 152 (pos 26)
- pavimento 147 (pos 11) · elettrico 125 (pos 45) · cappotto 98 (pos 11) · tetto 95 (pos 33)
**Quattro pagine sono fra la 8ª e l'11ª posizione: sono il tesoro, basta poco per scavalcare.**

⚠️ **Su alcune parole sei gia' SECONDO e non ti clicca nessuno**: "costo serramenti",
"preventivo infissi", "costo infissi in alluminio", "costo finestra alluminio doppio vetro"
→ tutte posizione 2, zero clic. CTR della pagina infissi: **0,7% invece del 2,5% atteso**.

### Cosa e' stato fatto (8 agosto): titoli e descrizioni riscritti
Riscritti `<title>`, `meta description`, `og:title` e `og:description` di **9 guide**
(infissi, condizionatore, idraulico, bagno, pavimento, elettrico, cappotto, tetto, facciata).
Regole usate, da mantenere:
- **la cifra dentro il titolo** ("Quanto costa cambiare gli infissi: 250-600 €/mq (2026)")
- **tolto "| TrovaImpresa"**: mangia caratteri per un nome che nessuno ancora cerca
- titoli **sotto i 62 caratteri**, altrimenti Google li taglia sul telefono
- nella descrizione **le parole che la gente digita davvero**, prese da Search Console:
  serramenti, montaggio climatizzatore, bagno "da zero", rifacimento tetto, coibentazione,
  ponteggio, punto luce
- ⚠️ nel titolo del bagno c'era "Guida di un muratore": tolto, il sito non parla di Alessio.

### Prossimi passi SEO, in ordine (concordati)
1. ~~Titoli e descrizioni delle 9 guide~~ **FATTO l'8 agosto.** Ricontrollare il CTR in
   Search Console **fra 2-3 settimane** (Google ci mette a rileggere le pagine).
2. ~~Il pasticcio .html / senza .html~~ **FATTO l'8 agosto.** Approfondendo si e' visto
   che NON era una falla grave: il sito aveva **due convenzioni**, ognuna coerente al suo
   interno — `sitemap.xml` (150 URL, senza .html) e `sitemap-seo.xml` (30 pagine categoria:
   architetto, geometra, ferramenta, negozio-*, tutte CON .html), con i canonical allineati
   a ciascuna. Uniformato tutto **senza .html**: corretti i 30 canonical e le 29 URL di
   `sitemap-seo.xml`. ⚠️ **Regola da qui in avanti: URL sempre senza .html**, in canonical,
   sitemap e link interni.
   Resta aperto (piccolo): 12 pagine non hanno canonical; alcune andrebbero messe a
   `noindex` perche' non devono finire su Google — `le-mie-inserzioni`, `conferma-recensione`,
   `email-benvenuto-premium`, `email-completa-profilo`, `demo-arcade`, `importa-bandi`,
   `admin-utilizzo`. ⚠️ NON toccare `google*.html`: sono i file di verifica di Search Console.
3. **Arricchire le 4 guide vicine alla prima pagina** (infissi pos 8, idraulico/pavimento/
   cappotto pos 11) per farle scavalcare.
   - **Infissi FATTA l'8 agosto** (33 -> 37,6 KB). La guida non era corta: mancavano le
     risposte alle domande vere. Aggiunte due sezioni: **"Quanto costa una singola finestra"**
     (tabella a pezzo: una anta, due ante, portafinestra 1 e 2 ante, scorrevole — PVC e
     alluminio) con il riquadro *perche' una finestra piccola costa di piu' al mq*, e
     **"Le marche dei profili"** (Salamander, Rehau, Schueco, Finstral, Veka — parole con cui
     Google gia' la mostra) che spiega che contano piu' camere, vetro e posa del marchio.
     ⚠️ Usare la classe CSS **`.esperienza`** per i riquadri, non `.box` (non esiste).
   - **Metodo che ha funzionato, da ripetere sulle altre**: prendere da Search Console le
     query vere della pagina, controllare con `grep` quali di quelle parole NON ci sono nel
     testo, e scrivere una sezione per ognuna. Sugli infissi mancavano portafinestra, una/due
     ante, i nomi dei profili.
   - **Impianto elettrico FATTA l'8 agosto** (34 -> 38,8 KB). Mancavano le parole piu' cercate:
     bilocale, trilocale, canaline, "senza rompere i muri", citofono, antifurto, contatore.
     Aggiunte tre sezioni: **prezzi per taglio di casa** (bilocale/trilocale/quattro locali/
     villetta), **"Si puo' rifare l'impianto senza rompere i muri?"** (canaline, battiscopa
     portacavi, controsoffitto — con la precisazione che l'impianto esterno prende la stessa
     dichiarazione di conformita' DM 37/08) e **cosa conviene predisporre adesso** (presa TV,
     videocitofono, antifurto, fotovoltaico, aumento contatore).
     ⚠️ **Lezione**: le cifre nuove vanno sempre riallineate alla "Risposta rapida" in cima
     alla pagina, altrimenti la stessa pagina dice due numeri diversi. Qui l'ancora e'
     100 mq = 5.000-9.000 €, e la tabella e' stata ricalcolata su quella.
   - **Idraulico FATTA l'8 agosto** (31 -> 35,7 KB). Scoperta importante: la guida parlava
     SOLO del rifacimento completo, ma fra le query c'e' **"costo idraulico ora"** — gente che
     non vuole rifare niente, ha una perdita o uno scarico otturato e vuole sapere quanto
     costa la chiamata. Mancavano del tutto: all'ora, diritto di chiamata, urgenza, sifone,
     cassetta, disostruzione, scaldabagno. Aggiunte due sezioni: **"Quanto costa chiamare un
     idraulico per un lavoro piccolo"** (diritto di chiamata 30-60 €, tariffa oraria 30-50 €/h,
     maggiorazione festiva, + tabella di 8 interventi comuni a corpo) con il riquadro *le due
     domande da fare al telefono*, e **"Cambiare i tubi vecchi"** (ferro zincato, piombo,
     multistrato).
     💡 **Intuizione da riusare sulle altre guide**: accanto all'intento "rifare tutto" c'e'
     quasi sempre un intento **"riparazione / chiamata"** molto piu' cercato e molto piu'
     vicino alla conversione (chi ha una perdita chiama oggi, chi rifa' il bagno ci pensa sei
     mesi). Verificare se vale anche per elettricista, fabbro, condizionatore.
   - **Pavimento FATTA l'8 agosto** (33 -> 37,6 KB). La sovrapposizione c'era gia' ed era
     spiegata bene. Mancava invece **il prezzo della SOLA POSA** — ed e' la parola su cui la
     pagina e' messa meglio di tutte: *"costo posa pavimento al mq"* **posizione 5**. Aggiunte
     tre sezioni: **"Quanto costa la sola posa, formato per formato"** (30x60/60x60, 20x120
     effetto legno, 120x120, mosaico, parquet flottante vs incollato, + il 20-30% per diagonale
     e spina di pesce), **"I pavimenti sottili da mettere sopra al vecchio"** (resina, gres
     sottile, vinilico/LVT, laminato, con lo SPESSORE in mm perche' il problema vero sono le
     porte) e **"E se sotto c'e' il riscaldamento a pavimento"**.
     La query *"pavimento sottile da sovrapporre ad incastro"* era gia' in posizione 10 senza
     che la pagina nominasse mai il vinilico: ora c'e'.
   - **Cappotto FATTA l'8 agosto** (25 -> 30 KB). Era la piu' corta delle quattro, solo 5
     sezioni. Mancavano le tre domande di chi valuta davvero. Aggiunte:
     **"Cappotto interno: quando e' l'unica strada"** (tabella di confronto esterno/interno con
     costo, ponteggio, spessore, abitabilita' + il riquadro sul rischio muffa, barriera al
     vapore e ponti termici), **"L'insufflaggio: l'alternativa da 20 € al mq"** (15-30 €/mq,
     va verificata l'intercapedine con la telecamera) e **"Il cappotto in condominio"**
     (assemblea, millesimi, e il consiglio di chiedere il conto per appartamento invece del
     totale: e' il motivo per cui i cappotti passano o non passano in assemblea).
     ⚠️ In questa pagina la classe del riquadro e' **`.note`**, NON `.esperienza`: le guide non
     hanno tutte lo stesso CSS. **Controllare sempre le classi disponibili prima di inserire**
     (`grep -o "^\s*\.[a-z-]*" file.html | sort -u`), con un assert che blocca se mancano.
   - ⚠️ Nella sezione detrazioni del cappotto NON sono state toccate le percentuali: le
     aliquote 2026 vanno verificate da Alessio o dal commercialista, non inventate.

**Le 4 guide vicine alla prima pagina sono tutte arricchite (8 agosto).** Prossimo controllo in
Search Console fra 2-3 settimane: guardare se le posizioni 8-11 sono salite e se il CTR e' cresciuto.
4. La pagina **impianto elettrico** ha la domanda piu' alta di tutte (20+ query diverse) ma
   sta in posizione 45: e' quella con piu' potenziale inespresso.

⚠️ **Deciso di NON aprire Google Ads adesso**: prima far rendere le 124 pagine che gia'
esistono e portano zero. Comprare clic mentre l'organico e' fermo sarebbe pagare due volte.
E comunque servirebbero piu' imprese per citta' (oggi 1,5 di media) prima di portare clienti.

## BACHECHE LAVORO E CANDIDATURE (8 agosto 2026, sera)

Punto di partenza: la sezione lavoro **era già tutta costruita** (11 file: offerte-lavoro,
registrazione/login/pannello-candidato, ricerca-candidati, ricerca-offerte, i 4 subappalto,
trova-cantieri) ma **vuota e invisibile**. Non è stato costruito niente di nuovo lato
funzioni: è stato sbloccato e collegato quello che c'era.

### Cosa è stato fatto
- **Le due bacheche sono separate, e stanno nel MENU** (non riquadri dentro la pagina —
  provato, Alessio l'ha bocciato due volte): `Bacheca offerte<br>lavoro` e
  `Bacheca candidature<br>lavoro`, su due righe, classe `.nav-2righe` (index) /
  `.due-righe` (pagine lavoro). Menu presente solo in 5 file: index, bandi, blog,
  offerte-lavoro, offerta-lavoro (+ candidature-lavoro).
- **`ricerca-candidati.html` RIFATTA da zero** come `candidature-lavoro.html`, riusando
  **lo stesso foglio di stile di offerte-lavoro** (header, top-bar blu, sidebar filtri,
  card). Prima era graficamente un altro sito. Vecchio file in `_to_delete/`.
- **Indirizzi allineati**: `/offerte-lavoro` e `/candidature-lavoro`. Redirect 301 in
  netlify.toml per `/ricerca-candidati` e `/ricerca-offerte` (quest'ultima era un doppione
  esatto di offerte-lavoro: due pagine che si facevano concorrenza su Google).
- **PREMIUM TOLTO** su pubblicazione offerte e subappalti: rimosso `data-premium="true"`
  dalle card `offerte-lavoro` (4 pannelli) e `subappalto` (3 pannelli — negozio non ce l'ha).
  In `offerte-registrazione.html` il tetto mensile è passato da `? 999 : 1` a **`= 999`
  (illimitato per tutti)**. Decisione di Alessio: *"non ci devo guadagnare sopra, se mi porta
  traffico per me è un successo"*. Per rimettere un limite ai Free il codice originale è nel
  commento sulla stessa riga.
- **`offerta-lavoro.html` NUOVA**: una pagina per ogni annuncio (`?id=`), con markup
  **JobPosting** (quello che porta gli annunci dentro Google Lavoro), title/description/
  canonical costruiti dall'annuncio, `validThrough` a 90 giorni se l'impresa non mette la
  scadenza. Le card della bacheca ora linkano qui ("Vedi offerta" al posto di "Candidati").
- **`sitemap-offerte.xml`**: funzione Netlify (`netlify/functions/sitemap-offerte.js`) che
  la genera al volo da Supabase, rewrite 200 in netlify.toml, dichiarata in robots.txt.
  Se Supabase non risponde torna una sitemap **vuota ma valida**, non un 500 (un 500
  ripetuto fa perdere fiducia a Google sull'intero file). Cache 1 ora.
- **sitemap.xml**: aggiunte offerte-lavoro, candidature-lavoro, subappalto e i due articoli
  nuovi (da 150 a 155 url). Nessuna delle tre bacheche c'era.
- **PRIVACY CANDIDATI**: vista `candidati_lavoro_pubblici` (niente cognome intero, telefono,
  email, CV) — `sql/candidati-vista-pubblica.sql`, **già eseguito da Alessio l'8 agosto**.
  La pagina legge la vista se sei sloggato e la tabella vera se sei un'impresa loggata
  (controllo su `imprese` per email). ⚠️ Il `revoke select ... from anon` in fondo al file
  è **ancora commentato**: va eseguito dopo qualche giorno di verifica.
- **esc() aggiunto** su `offerte-lavoro.html` e `candidature-lavoro.html`: prima titolo e
  nome azienda finivano in innerHTML senza pulizia. Non era teorico — aprendo la
  pubblicazione a tutti, chiunque poteva iniettare codice da un titolo.
- **Bug corretti su candidature**: "2 candidatoi trovatoi" e il badge `undefined`
  (leggeva `c.livello`, colonna che nel DB non esiste → ora `anni_esperienza`).

### Guida "quanto costa un muratore" — prezzi corretti
Alessio ha segnalato che erano gonfiati. Rifatti i conti con i suoi dati (manovale
1.500-1.800 lordi/mese, muratore 2.000-2.400, +1.000 di contributi, su ~210 giornate):
- costo impresa: **manovale 145-160 €/gg, specializzato 170-195 €** (erano 212 e 250)
- prezzo cliente: **210-240 / 250-280 / squadra 450-500** (erano 260-280 / 300-330 / 550-600)
- in tasca all'operaio: **69-81 / 89-105 €/gg** — su 100 € spesi dall'impresa ne arrivano 48
Aggiornati **tutti e 15 i punti** della pagina (meta, risposta rapida, tabella, calcolatore,
5 FAQ, JSON-LD). Aggiunta la sezione **"Perché in edilizia si lavora in nero"**.
⚠️ Il caso personale di Alessio (2.400 €/mese, giornata 250 €) è rimasto invariato ma
etichettato "fascia alta, 25 anni di anzianità": sta sopra la tabella nuova.

### Due articoli nuovi (portano il pubblico alle bacheche)
- `quanto-guadagna-un-muratore.html` → per gli OPERAI, porta a /offerte-lavoro
- `come-trovare-operai-edili.html` → per le IMPRESE, porta a pubblicare e ai candidati
Entrambi con FAQ + JSON-LD, si linkano a vicenda. **Le cifre condivise sono identiche nei
due articoli e nella guida sui costi** — verificato riga per riga, se si toccano vanno
allineate tutte e tre.
Dati usati: 59,7% assunzioni artigiane di difficile reperimento (media naz. 47%), idraulici
78,8%, tecnici cantiere 75,7%, elettricisti 71,8%. Apprendistato professionalizzante:
aliquota **11,31%** contro 29-32% ordinario, per tutto il periodo formativo + 12 mesi.

### ⚠️ TRAPPOLE NUOVE (imparate sul campo l'8 agosto)
- **Il ponte col PC NON PUÒ CANCELLARE FILE.** Se Claude lancia `git` via device_bash, git
  crea `.git/index.lock` e non riesce a rimuoverlo: **tutti i comandi git di Alessio si
  bloccano**. È successo davvero. → **Claude non deve lanciare git dal suo lato.** Se il lock
  resta, si toglie con `mv .git/index.lock _to_delete/`.
- **Fine riga**: i file che passano dal container tornano in CRLF e git li segna come
  riscritti per intero (diff illeggibile). → dopo ogni `device_commit_files` lanciare
  `sed -i 's/\r$//'` sui file toccati.
- **~120 file del repo hanno modifiche fantasma** (solo CRLF/LF, contenuto identico:
  imprese-*.html, package-lock.json, robots.txt, i backup). → **mai `git add -A`**, sempre
  la lista esplicita dei file, se no il commit è 20.000 righe di rumore.
- **Git Bash di Alessio rompe l'incolla su più righe** (`git pushcd`, `[200~cd`). → dargli
  **un comando su una riga sola** con `&&`.

## BACHECHE LAVORO — SECONDA PARTE (8 agosto 2026, sera tardi)

Continua la sezione sopra. Qui il giro si chiude davvero e il pannello viene ripulito.

### IL BUCO PIU' GROSSO: nessuno poteva candidarsi
La tabella `candidature` esisteva (offerta_id, candidato_id, impresa_id, stato, data),
il **candidato** le vedeva nel suo pannello e l'**impresa** in "Candidature ricevute".
Ma **l'unico punto del sito che le creava era `ricerca-offerte.html`**, la pagina doppione
che avevamo appena reindirizzato. Il pulsante "Candidati" portava a
`registrazione-candidato.html?id=` e quel modulo **il parametro id non lo leggeva nemmeno**:
registrava la persona e perdeva il collegamento con l'annuncio.
→ **Risolto in `offerta-lavoro.html`**: ora il pulsante crea davvero la riga in `candidature`.
Gestisce 5 casi, tutti provati: visitatore sloggato (iscriviti / ho gia' un account),
impresa loggata senza profilo candidato, candidato che si candida, candidato gia' candidato,
doppione a livello DB (23505).

### MODULO CANDIDATO: da 17 campi obbligatori a 7
`registrazione-candidato.html`: obbligatori restano nome, mestiere, email, telefono,
regione, provincia, citta' + password. Cognome, eta', sesso e anni di esperienza sono
diventati **(facoltativo)**; il campo "conferma password" e' stato tolto.
⚠️ **La password l'ho TENUTA di proposito**: generandola a caso la persona non rientrerebbe
piu' nel pannello se non passando da "password dimenticata".
⚠️ **Regione/provincia/citta' TENUTE**: sono 3 tendine collegate, la citta' esiste solo se
scegli le prime due, e la zona e' l'unica cosa che serve davvero a un'impresa.
Chi arriva da un annuncio (`?id=`) dopo la conferma email viene riportato **su quell'annuncio**.

### GRAFICA UNIFICATA — 10 pagine su 10
Tutte le pagine lavoro/subappalto hanno lo stesso menu (`Bacheca offerte<br>lavoro`,
`Bacheca candidature<br>lavoro`, voce attiva evidenziata):
offerte-lavoro, candidature-lavoro, offerta-lavoro, i 4 subappalto,
offerte-registrazione, registrazione-candidato, trova-cantieri.
⚠️ Su `offerte-registrazione`, `registrazione-candidato` e `trova-cantieri` il menu e'
`header.sito` (classe diversa perche' quelle pagine hanno gia' un `.header` che e' il
titolone). Hanno anche `html, body { padding-top:0 !important }` e
`header.sito + * { margin-top:34px }`: senza, il menu finiva rientrato dentro il contenuto.

### PULSANTE DI AZIONE SU OGNI BACHECA
Le due bacheche non avevano **nessun pulsante per agire**: si poteva solo guardare, e per
pubblicare bisognava passare dal pannello (che chi arriva da Google non ha).
Ora ogni bacheca ha **un** pulsante arancione suo, nella barra chiara sotto quella blu:
`.barra-azione` + `.btn-azione`. Offerte → "➕ Pubblica un'offerta di lavoro";
Candidature → "➕ Iscriviti e fatti trovare".
⚠️ Alessio ha bocciato due volte l'idea dei **due riquadri dentro la pagina** ("mischiato"):
le due bacheche vanno tenute **separate**, una voce per ciascuna nel menu, un pulsante per
ciascuna nella sua pagina.

### PANNELLI: una sola card lavoro, con due bottoni
Dopo vari giri (mea culpa, ci ho messo troppo a capire), la forma finale e' **una card con
due bottoni, identica a quella dei subappalti**:
`[ Le mie offerte di lavoro | Candidature ricevute ]  [ Cerco Subappaltatori | Sono Subappaltatore ]`
- **Nuova sezione `sec-mie-offerte` + `caricaMieOfferte()` + `chiudiOfferta()`** su artigiano,
  professionisti e negozio. ⚠️ `pannello-impresa` **ce l'aveva gia'**: era stata costruita
  una volta sola e mai portata sugli altri.
  Mostra ogni annuncio con Online/Chiusa, quante candidature ha ricevuto, "Vedi online" e
  "Chiudi l'offerta" (`attiva = false`).
- Tolte perche' ora stanno nel menu del sito: "Pubblica Offerta di Lavoro", "Ricerca Offerte",
  "Ricerca Candidati", e la card `cerca-lavoro` con "Registrati · Invia CV" (era roba da
  candidato dentro il pannello impresa).
- Corretto: "Ricerca Candidati" puntava a `ricerca-candidati.html`, spostata in `_to_delete`
  quel giorno stesso → ora `candidature-lavoro.html`.
- Lo stato vuoto di "Candidature ricevute" non e' piu' un vicolo cieco: propone
  "Le mie offerte" e "Pubblica un'offerta".

### COMPLETAMENTO PROFILO: adesso conta anche le foto
`js/completa-profilo.js` controllava 9 voci e **le foto non le guardava**: si arrivava al 100%
con zero foto caricate. Aggiunta la voce **"Foto dei lavori", peso 15** (alto di proposito:
per un'edile le foto convincono piu' di qualsiasi descrizione).
Le foto stanno in `lavori_foto`, non fra le colonne di `imprese`, quindi si contano a parte
(`select id, count exact, head` su `impresa_id`) e si iniettano nella riga come `_foto`.
Se quella lettura fallisce, considera 0 e la fascia non si rompe.
Verificato dal vivo: il profilo di Alessio e' passato da 93% a **81%** con "Foto dei lavori"
fra le voci mancanti.

### LA COSA PIU' UTILE IMPARATA OGGI
**Il subappalto funziona meglio del lavoro perche' NON chiede l'account.**
`subappalto-cerca` e `subappalto-offre` non hanno nessun controllo di login: compili,
pubblichi, e il sistema genera un **token** (`crypto.randomUUID()`) che ti da' un link
`subappalto-gestisci.html?token=...` per rigestire il tuo annuncio. Zero registrazione,
zero password, zero email da confermare.
→ **Prossimo lavoro consigliato**: applicare lo stesso schema all'**iscrizione candidato**.
Un muratore che vuole solo farsi trovare non ha bisogno di un account: nome, telefono,
mestiere, citta' e un link personale. Il modulo lungo resta per chi vuole il profilo completo.
Per le OFFERTE invece l'account ha senso: l'impresa deve ricevere le candidature nel pannello.

### AUDIT DELLE CARD DEL PANNELLO (fatto con controllo automatico)
Verificate tutte le card: destinazione, esistenza del file, esistenza della funzione.
⚠️ **15 funzioni sembravano mancanti ma era un falso allarme**: stanno in
`strumenti-comuni.js` e `strumenti-cantiere.js`. Prima di gridare al bug, cercare anche li'.
⚠️ **`pannello-impresa.html` ha un `<script>` aperto e mai chiuso** (22 aperti, 21 chiusi).
C'era gia' prima dell'8 agosto, il browser lo tollera. Da sistemare con calma.
Osservazione di modello: **16 card su 22 sono Premium**. Un'impresa appena iscritta apre il
pannello e vede quasi solo lucchetti. In particolare "Foto dei lavori" e "Certificazioni"
sono Premium ma servono proprio a completare il profilo — cioe' rallentano l'obiettivo.

## PROSSIMI LAVORI CONCORDATI (aggiornato l'8 agosto 2026)
1. ~~Revisione Studio + negozio~~ **FATTA il 7 agosto**.
2. ~~Revisione sito pubblico, percorso cliente (Blocco A)~~ **FATTA il 7-8 agosto**
   (5 passi, vedi la sezione "SITO PUBBLICO" sopra).
3. ~~Sito, Blocco B: registrazioni e login~~ **FATTO l'8 agosto** (vedi sopra).
   **RESTANO i 4 PANNELLI** (pannello-impresa/artigiano/professionisti/negozio): mai
   revisionati, è **il pezzo aperto più grosso** del percorso impresa.
4. ~~Sito, Blocco C: blog e guide~~ **FATTO l'8 agosto** (passi 1, 2 e 2b, vedi sopra).
   Restano le pagine di servizio: contatti, prezzi, chi-siamo, e i TOC nelle guide lunghe.
5. Coerenza fra le 4 pagine cerca + i due blocchi identici in home (dettagli sopra).
6. **Messa in sicurezza minima del noleggio** (strada 2): piccola, ancora da fare.
7. Code minori sul gestionale: galNomeOp (UUID in Galleria), calendario mobile a lista,
   campi obbligatori segnati nei form, esc() sulle card neg_* del negozio.
8. Fornitori Fase 3 (ponte marketplace) quando ci saranno più negozi iscritti.
9. **BACHECHE LAVORO — quello che resta** (vedi sezione sopra):
   - **riempire la bacheca di annunci veri**: è l'unica cosa che manca davvero, e non è
     codice. Si parte dalle 17 imprese di `reclutamento-lazio.csv` (reatino, telefoni ed
     email già verificate).
   - eseguire il `revoke` in fondo a `sql/candidati-vista-pubblica.sql` dopo qualche giorno.
   - **semplificare `registrazione-candidato.html`**: oggi sono **17 campi obbligatori**
     con password e CV. Un muratore quel form non lo compila. Il profilo lo crea un
     trigger dal signUp, quindi si può scendere a 5 campi senza toccare il database.
   - `subappalto.html` e le sue 3 pagine hanno ancora la grafica vecchia, come ce l'aveva
     ricerca-candidati prima di essere rifatta.
   - Search Console: `/sitemap-offerte.xml` darà "1 errore / 0 pagine" finché non c'è
     almeno un annuncio. È normale, non è un bug.
   - **iscrizione candidato in stile subappalto** (token, senza account): è il pezzo che
     più di ogni altro può riempire la bacheca candidature. Vedi la sezione sopra.
   - `<script>` sbilanciato in `pannello-impresa.html` (pre-esistente).
   - decidere se togliere il Premium da "Foto dei lavori" e "Certificazioni".

⚠️ **Serve ad Alessio**: la **P.IVA** per il footer della home (c'è già il commento pronto
in `index.html`) — un sito senza P.IVA visibile perde fiducia proprio con chi teme le truffe.

⚠️ NOTA per Claude: il 7 agosto il ponte col PC ha servito una copia VECCHIA di questo file
(cache del mount). Prima di modificare CLAUDE.md, controllare che contenga le sezioni del
6 e 7 agosto: se mancano, la copia è stantia — confrontare i byte con device_list_dir.

## 9 agosto 2026 — sidebar admin che non scrollava

**Sintomo (segnalato da Alessio):** dopo l'aggiornamento dell'8 agosto, nel pannello
`/admin` la barra laterale non scrollava più; girando la rotellina sopra il menu si
muoveva invece la zona centrale.

**Causa:** `.sidebar` è `position:fixed` con `top:0; bottom:0` ma non aveva **nessun
overflow**. Con 20+ voci di menu il contenuto usciva fuori dal riquadro senza scrollbar,
quindi il browser passava lo scroll al contenitore sotto (il `.main`).

**Fix in `admin.html` (CSS in testa al file):**
- `.sidebar` → aggiunto `overflow:hidden` (il riquadro non deborda più).
- `.sidebar-logo, .sidebar-footer` → `flex:0 0 auto` (logo in alto e logout in basso
  restano sempre fermi, non si schiacciano).
- `.sidebar-nav` → da `flex:1` a `flex:1 1 auto; min-height:0; overflow-y:auto`.
  Il `min-height:0` è la riga che conta: senza, un figlio flex non si lascia
  rimpicciolire e l'`overflow` non parte mai.
- `overscroll-behavior:contain` → arrivati in fondo al menu lo scroll **non passa**
  più al contenuto centrale (era esattamente il fastidio segnalato).
- Scrollbar sottile 7px, grigia chiara, più scura al passaggio del mouse
  (`::-webkit-scrollbar` + `scrollbar-width:thin` per Firefox).

**Backup:** `admin.html.bak-scroll` nella cartella del progetto (cancellabile quando
Alessio ha confermato che va bene).

**Regola per il futuro:** ogni volta che si aggiungono voci al menu admin, la sidebar
regge da sola perché ora scrolla. Ma se un domani si mette un altro pannello a colonne
con `position:fixed`, ricordarsi sempre la coppia `min-height:0` + `overflow-y:auto`
sul figlio che deve scrollare.

## 9 agosto 2026 — Vista FONDATORE completata (un solo account per tutto)

**Problema di Alessio:** col suo unico account (tipo `artigiano`) non poteva provare
gli altri pannelli: ogni pannello controlla `impresaCorrente.tipo` e se non e' il suo
lo **rimbalza via** verso il pannello del suo tipo. La barra FONDATORE
(`js/fondatore.js`) esisteva ma era inclusa SOLO in `gestionale-app.html`.

**Come funziona adesso:**
- La vista si sceglie in 2 modi: barra FONDATORE ("Vedi come") **oppure** parametro
  `?vedi=impresa|artigiano|professionista|negozio` nell'indirizzo. `?vedi=` vuoto
  la cancella. Il parametro serve perche' i link di "Le mie viste" aprono in
  `target="_blank"` e sessionStorage NON passa alla scheda nuova.
- Nei 4 pannelli (`pannello-impresa/artigiano/professionisti/negozio.html`):
  funzione `vistaFondatore(p)` definita dopo `let impresaCorrente = null;` e chiamata
  nei **3 punti** dove si assegna `impresaCorrente` (sessione, INITIAL_SESSION, login),
  SEMPRE prima del controllo che fa il rimbalzo. Cambia `p.tipo` **solo in memoria**
  e **solo se `p.email` e' pintoalessio@icloud.com** — per gli altri utenti non fa nulla.
  Il tipo vero nel database non viene MAI scritto.
- `js/fondatore.js`: aggiunta la categoria **Negozio** al menu "Vedi come".
- Barra fondatore ora inclusa anche in: 4 pannelli + `gestionale-negozio.html` +
  `gestionale-noleggio.html` (prima solo gestionale-app).
- `gestionale-app/negozio/noleggio`: leggono anche `?vedi=` oltre a sessionStorage.
- `admin.html` → "Le mie viste": i 4 link dei pannelli hanno gia' `?vedi=` giusto,
  quindi entrano nella categoria corretta senza rimbalzi.

**Ritocco dopo la prova di Alessio:** il riquadro blu del pannello mostrava
"PANNELLO ARTIGIANO" anche in vista professionista. Non era un bug della vista:
e' il **nome pannello salvato** nella personalizzazione Premium
(`personalizzazione.nome_pannello`), unico per tutti i pannelli. Ora, quando la
vista fondatore e' attiva, quel nome salvato viene ignorato e ogni pannello
mostra il suo titolo di serie ("Pannello professionista", ecc.) — cosi' si
capisce sempre dove ci si trova. Per gli utenti normali nulla cambia.

**Trappole scoperte:**
- `gestionale-noleggio.html` **non aveva** `</body></html>` (finiva con `</script>`):
  aggiunti in fondo insieme all'include di fondatore.js.
- La vista e' per-scheda (sessionStorage): due schede possono avere due viste diverse.
  E' voluto: comodo per confrontare.

**Backup locali** (`*.bak-viste`, piu' `admin.html.bak-scroll`): NON vanno committati.
Fare `git add` SOLO dei file elencati, mai `git add .` finche' ci sono i backup.

## 9 agosto 2026 — PROFESSIONISTI: primo strumento (scadenze delle pratiche)

**Perche':** l'artigiano vive di cantiere, il tecnico vive di **date che non puo'
bucare**. Analisi fatta con Alessio: i 5 strumenti che valgono di piu' per
ingegneri/architetti/geometri/periti sono, in ordine:
1. **scadenzario pratiche con promemoria email** (FATTO, vedi sotto)
2. preventivo + **lettera d'incarico** PDF (obbligo di legge, `calcolaParcella()` c'e' gia')
3. **ore per pratica** (timesheet) -> "quanto hai guadagnato all'ora su questa pratica"
4. **verbale di sopralluogo** con foto (riusare il pattern dell'app operatore)
5. **registro crediti formativi (CFP)** — unica voce di menu nuova, gruppo Studio
Il **computo metrico NO**: contro PriMus si fa brutta figura, deciso di lasciarlo perdere.
La carta vera vs i software: **le imprese sono gia' dentro TrovaImpresa** — un'impresa che
vince una ristrutturazione ha bisogno di un tecnico per la CILA. Il gestionale apre la
porta, gli incarichi la tengono aperta.

### Cosa e' stato fatto (tutto e' gia' in produzione)

**Database — `sql/gest-scadenze-pratiche.sql` (Alessio l'ha eseguito il 9/8):**
- `gest_scadenze.lavoro_id` -> collega la scadenza alla pratica (on delete set null:
  meglio una scadenza orfana che una sparita)
- `gest_scadenze.avvisi` (text) -> le tappe email gia' spedite, es. "30,7"
- `gest_scadenze.avvisa` (bool, default true) -> l'interruttore per spegnerle
- due indici: `lavoro_id`, e `(data_scadenza, stato)` per la funzione delle email

**gestionale-app.html:**
- `tipiScadenza()` per i professionisti: da 5 a **14 tipi** veri (Presentazione pratica,
  Integrazione richiesta dal Comune, Silenzio-assenso, Inizio/Fine lavori, Proroga,
  Collaudo, Agibilita', Variante, Deposito sismico, Accatastamento, Rinnovo polizza,
  Crediti formativi, Altro). Per imprese/artigiani l'elenco resta identico.
- `scadForm()` convertita da `openSheet()` a **`openSheetGrande()` a due colonne**
  (rispetta la regola fissa sulle finestre): sinistra "Che cosa scade" + "Promemoria
  via email"; destra "A che cosa si riferisce" (Pratica/Cliente/Mezzo) + Note.
- `renderScadenze()` legge `select("*")` invece dell'elenco fisso di colonne, cosi'
  non si rompe se la migrazione non e' stata fatta.
- `saveScad()` ha il **paracadute colonne mancanti**: toglie `lavoro_id`/`avvisa` e
  riprova, e lo dice nel toast (stesso pattern dei Dati azienda).
- **`bloccoScadenzePratica()` + `renderLavScadenze()`**: riquadro "Scadenze di questa
  pratica" nella colonna destra della scheda pratica, con "+ Aggiungi una scadenza"
  (azione `scad-da-pratica`) che apre il form gia' collegato a pratica e cliente.
- **`proponiScadenzaPratica()`**: salvando una pratica con data futura, chiede con
  Si'/No se creare la scadenza collegata. Non richiede due volte perche' controlla se
  esiste gia' una scadenza con quella stessa data su quella pratica.

**css/gestionale.css:** classi `.lav-media .lsc-r / .lsc-info / .lsc-q` per le righe
del riquadro (righe alte, bordo rosso a sinistra se la data e' passata).

**netlify/functions/promemoria-scadenze.js** (nuova, schedulata `15 6 * * *`):
manda **una sola email al giorno per persona** con le scadenze a **30, 7 e 1 giorno**.
Usa Resend e `SUPABASE_SERVICE_KEY` (gia' configurate). Niente doppioni: prima di
mandare controlla `avvisi`, dopo aver mandato ci scrive la tappa. Se Resend fallisce
NON segna niente, cosi' l'indirizzo riceve l'email il giorno dopo.

### Trappole imparate stavolta
- **Il tool Write scrive nel container di Claude, NON sul PC di Alessio.** Il file SQL
  sembrava creato ma sul suo disco non c'era. Per i file del progetto usare SEMPRE
  `device_bash` (python/heredoc): e' l'unico che scrive davvero in `~/Downloads/trovaimpresa`.
- Le classi `.ff-r/.ff-info/.ff-q` sono **scoped a `#fornitori`** in gestionale.css:
  riusate altrove escono senza grafica. Servono classi nuove.
- I nomi delle pratiche NON si leggono da `lavCache` fuori dalla sezione Pratiche:
  e' vuota finche' non la si apre, e ogni scadenza collegata sembrerebbe
  "(pratica eliminata)". Vanno letti con una select dedicata.

### Strumento 2 — LETTERA D'INCARICO in PDF (9 agosto 2026, fatto)

Obbligo di legge per i tecnici (art. 9 comma 4 DL 1/2012: compenso pattuito per
iscritto). Nasce dal preventivo che c'e' gia': stesse voci, stessa parcella.

- Voce **"📝 Lettera d'incarico"** nel menu del preventivo, accanto a "Scarica PDF",
  solo per `ruoloUtente==='professionista'` (`prevVoci()`).
- `incaricoForm(id)` — finestra GRANDE due colonne: a sinistra oggetto, prestazioni
  (precompilate dalle voci del preventivo, modificabili) e tempi; a destra il
  riepilogo della parcella in sola lettura, modalita' di pagamento, luogo e foro,
  piu' le condizioni particolari (precompilate dalle note del preventivo).
- `incaricoPdf(id)` — genera il PDF: intestazione studio, le due parti (committente
  e professionista con P.IVA/C.F.), articoli **numerati da soli** (`nArt`), riquadro
  del compenso, pagamento (con IBAN e giorni da Dati azienda), tempi, obblighi del
  committente, recesso, GDPR, foro, condizioni particolari, e il blocco firme con
  la doppia sottoscrizione artt. 1341/1342 c.c.
- **Zero SQL**: le condizioni usate l'ultima volta (tempi, pagamento, luogo, foro)
  restano in `localStorage` con chiave `gest_incarico_default`. Se un domani si
  vogliono come impostazioni dello studio, si spostano in `gest_azienda`.

**Bug trovati dalla verifica prima di consegnare** (tutti corretti, ma la lezione resta):
- le clausole 1341/1342 uscivano dal foglio: `splitTextToSize` aveva larghezza
  `L-72` (102 mm) ma il testo partiva da `R-70` (122 mm) -> 224 mm su un A4 di 210.
  **Regola: la larghezza passata a splitTextToSize deve essere quella della colonna
  in cui si scrive, non quella della pagina.** Verificato girando jsPDF davvero.
- il blocco firme si spezzava in due pagine (data di qua, firme di la'): ora si
  calcola l'altezza totale e si salta pagina UNA volta sola, prima.
- `paragrafo()` stampava tutto il blocco dopo un solo controllo: un testo lungo
  (le condizioni le scrive l'utente) usciva dal fondo. Ora stampa riga per riga
  e cambia pagina da solo.

⚠️ **Da far controllare ad Alessio**: le clausole standard (recesso, GDPR, foro,
obblighi del committente) sono un modello di base, non un parere legale. Vanno
fatte leggere una volta a un consulente. Nel modulo c'e' gia' scritto.

## 9 agosto 2026 — Finestre: la regola e' rispettata dappertutto

Convertite in `openSheetGrande` a due colonne le ultime finestrelle piccole:
- **mezzo / attrezzatura** (`mezzoForm`): sinistra "Che cos'e'", destra la spunta
  attrezzatura + Note
- **carta aziendale** (`cartaForm`): sinistra "La carta", destra Note. Tolti anche
  gli `style="font-size:1.1rem"` scritti a mano su ogni campo: il testo grande
  nelle finestre lo fa gia' il CSS (blocco "CAMPI DA COMPILARE"), uguale per tutte
- **nuova persona** (`dipForm`): finestra grande ma **una colonna sola** — il campo
  e' uno, due colonne sarebbero mezze vuote. (E' il modulo vecchio della modalita'
  locale: quello vero e' `squadraForm`.)
- **nuovo reparto** (`panelForm`): sinistra il nome, destra icona e colore

**Resta di proposito con `openSheet()`** solo la finestra del **giorno del
calendario**: e' l'elenco dei lavori di quel giorno con la nota, non un modulo di
inserimento. Se un domani si vuole uniformare anche quella, e' l'unica rimasta.

**Controllo da rifare dopo ogni modifica alle finestre:**
`grep -n "openSheet(\`" gestionale-app.html` deve restituire **solo** la riga
della finestra del giorno.

## 9 agosto 2026 — ULTIMI TRE STRUMENTI: la lista professionisti e' CHIUSA

Database: **`sql/gest-ore-e-crediti.sql`** (tabelle `gest_ore` e `gest_crediti`
piu' la colonna `gest_azienda.cfp_obiettivo`). Tutte e tre le sezioni funzionano
anche PRIMA di eseguirlo: lo dicono con una frase chiara invece di rompersi.

### 3. REGISTRO DELLE ORE (serve a tutti, non solo agli studi)
Il campo "Ore lavorate" da solo era un numero che nessuno aggiornava. Ora dentro
la scheda del lavoro/pratica c'e' un registro: una riga per volta (data, ore,
chi, cosa), e in fondo **quanto rende un'ora** — compenso diviso ore. E' il conto
che nessuno fa mai e che dice se una pratica conviene.
- `renderOreBlock` / `oreAdd` / `oreDel` / `_oreSalvaTotale`, sul modello del
  blocco spese. Si accende da `edit-job` (come le spese: sul lavoro NUOVO non
  c'e', perche' quel ramo del modulo non ha il campo).
- **Il totale viene riscritto anche in `gest_lavori.ore`**: cosi' Report,
  riepiloghi ed esportazioni continuano a funzionare senza sapere niente della
  tabella nuova. Il campo `#j-ore` diventa readOnly quando ci sono righe.

### 4. VERBALE DI SOPRALLUOGO con foto
Voce "📋 Verbale di sopralluogo" nel menu della pratica (solo studi). Nasce dalle
foto GIA' in Galleria su quella pratica: si spuntano quelle che servono, si
scrive cosa si e' visto ed esce un PDF firmabile. A cosa serve davvero: e' la
prova di com'erano i luoghi PRIMA — sei mesi dopo, alla domanda "quella crepa
c'era gia'?", risponde il verbale con la data.
- `verbaleForm` / `verbalePdf` / `_fotoInDati` / `_misuraFoto`.
- Le foto entrano nel PDF **come dati, non come indirizzo**: gli url firmati di
  Supabase scadono dopo un'ora e il file resterebbe coi buchi.

### 5. CREDITI FORMATIVI (CFP)
Voce nuova nel gruppo Studio (`#tab-crediti`, nascosta nell'HTML e accesa da
`adattaMenuProfessionista`). Riquadro in cima con numero grande, barra e "ti
mancano N crediti". L'obiettivo annuo si imposta nei **Dati azienda** (campo
visibile solo agli studi): 30 per ingegneri e architetti, 20 per i geometri.
Niente `mestiere_id`: l'obbligo e' della persona iscritta all'albo, non del
reparto, quindi i corsi si vedono uguali da tutti i reparti.

### ⚠️ LEZIONI (6 difetti trovati dalla verifica prima di consegnare)
1. **Cancellando l'ultima riga di ore il totale vecchio restava nel database**:
   il campo non veniva azzerato, e Report ed esportazioni continuavano a contare
   ore che nel registro non c'erano piu'. Ora `campo.value=""` e
   `_oreSalvaTotale` scrive **null**, non uno zero finto.
2. **Le foto verticali uscivano schiacciate**: col tetto di 70 mm si accorciava
   l'altezza ma NON la larghezza. **Regola: quando si mette un tetto a una
   dimensione di un'immagine, va riscalata anche l'altra.** Su un verbale che
   deve provare lo stato dei luoghi, misure deformate sono un difetto grave.
3. **Il salto pagina guardava solo la prima foto della riga**: con la seconda
   piu' alta, finiva sotto il bordo del foglio. Ora le misure si calcolano tutte
   PRIMA e il controllo usa l'altezza della riga intera. Verificato con node.
4. L'obiettivo CFP si leggeva dal database ma **non era impostabile da nessuna
   parte**: aggiunto il campo nei Dati azienda (e in `OPZ` del paracadute).
5. `.spesa-add` ha 3 colonne, la riga delle ore ne ha 4: classe `.ore-add`.
6. `confirm()` invece di `gconfirm()`: per gli studi il messaggio non passava
   dal traduttore lavoro→pratica.

### Cosa resta aperto sui professionisti
Niente della lista iniziale. Le idee successive, se serviranno: parcelle
ricorrenti, scadenzario condiviso con il committente, firma digitale dei PDF.
Il **computo metrico resta escluso** (contro PriMus si fa brutta figura).

## 9 agosto 2026 — TRAVASO fra gestionale impresa e professionista

Confronto fatto su richiesta di Alessio: cosa ha l'uno che serve all'altro.
Risultato: **4 buchi**, 3 chiusi (il quarto e' rimasto in cassetto).

**Cosa aveva SOLO il professionista:** dati pratica, parcella completa con
riepilogo dal vivo, PDF "PARCELLA", lettera d'incarico, 14 tipi di scadenza,
blocco scadenze nella scheda.
**Cosa ha SOLO l'impresa:** Mezzi, Attrezzature, Carte carburante.

### 1. L'IVA nel preventivo di imprese e artigiani (il buco piu' grosso)
La FATTURA dell'impresa aveva gia' l'IVA riga per riga; il PREVENTIVO no:
mostrava la somma delle voci e il PDF diceva "prezzi IVA esclusa". Ma il cliente
privato ragiona sul totale finito.
- `bloccoIvaImpresa()` / `aggiornaRiepilogoIvaImpresa()` / `leggiCampiIvaImpresa()`
  — aliquota (22 / 10 ristrutturazione / 4 prima casa / 0) piu' riepilogo dal vivo.
- **Zero SQL**: riusa la colonna `iva_perc` che gia' esiste per la parcella. I due
  non si pestano i piedi: `leggiCampiParcella()` esce vuota per le imprese e
  `leggiCampiIvaImpresa()` esce vuota per i professionisti, e i due blocchi non
  compaiono mai insieme (id diversi: `pv-iva` contro `pv-iva-imp`).
- **Retrocompatibile**: preventivo vecchio con `iva_perc` null -> tutto come prima.
- `prevPdf` ha un ramo nuovo col riquadro Imponibile / IVA / TOTALE finito.
- L'aliquota scelta nel preventivo ora arriva anche in **fattura**
  (`fattDaPreventivoConferma`): prima ripartiva sempre dal 10% di default.

### 2. Blocco scadenze acceso anche per imprese e artigiani
`bloccoScadenzePratica`, `renderLavScadenze` e `proponiScadenzaPratica` non
escono piu' subito se non sei professionista: cambia solo la parola
(pratica/lavoro). Aggiunti alla lista tipi dei non-professionisti: **Consegna
lavori, SAL (stato avanzamento), Fine lavori, Verifica ponteggio**.
La proposta automatica per le imprese usa "Consegna lavori" (esiste nella loro
lista: se il tipo non ci fosse, riaprendo la scadenza la tendina mostrerebbe
il valore sbagliato).

### 3. Conferma d'ordine in PDF per le imprese (gemella della lettera d'incarico)
`ordineForm()` / `ordinePdf()`, voce di menu "📝 Conferma d'ordine" nel
preventivo per i non-professionisti. Differenze vere rispetto alla lettera
d'incarico: c'e' l'**IVA** invece di cassa e ritenuta, c'e' l'articolo
**varianti e lavori aggiuntivi** (dove finiscono quasi tutte le liti), e la
**garanzia artt. 1667-1669 c.c.**; recesso art. 1671 (appalto) invece di quello
generico. Anche qui memoria in `localStorage` (`gest_ordine_default`).

### 4. STRUMENTI per gli studi (fatto subito dopo, stessa giornata)
`TAB_NASCOSTI_PRO` e' passato da `['mezzi','attrezzature','carte']` a
`['mezzi','carte']`: **le Attrezzature restano visibili agli studi, rinominate
"Strumenti"**. Motivo: stazione totale, distanziometro laser, termocamera e
livello hanno la **taratura periodica obbligatoria**, ed e' esattamente il
mestiere di quella sezione (scadenze delle verifiche). Una misura presa con uno
strumento fuori taratura non vale.
- `adattaMenuProfessionista()` rinomina voce di menu, titolo, pulsante e testo
  introduttivo della sezione (stesso schema di Squadra -> Collaboratori).
- `renderParcoMezzi()` ha la variabile `STRU` (= attrezzatura AND professionista)
  per elenco vuoto, colonne e pulsanti.
- `mezzoForm()`: per uno studio la **spunta "e' un'attrezzatura" non compare** —
  sceglierebbe fra due cose di cui una (i Mezzi) non e' nemmeno nel suo menu. Al
  suo posto un campo nascosto `m-cat` porta la categoria al salvataggio.
  **Attenzione**: la forzatura vale solo per le righe NUOVE. Se modifica una riga
  gia' salvata la categoria non si tocca, se no un mezzo registrato prima
  diventerebbe uno strumento di nascosto.
- `tipiScadenza()` per gli studi: aggiunti **"Taratura strumento"** e
  **"Manutenzione strumento"** (senza, la sezione sarebbe stata monca).
- Restano nascoste agli studi solo **Mezzi** (targa, bollo, revisione) e
  **Carte carburante**.

### ⚠️ LEZIONE SUI SOLDI (7 bug trovati dalla verifica prima di consegnare)
Il piu' insidioso: **il totale va sommato sull'IVA GIA' ARROTONDATA ai
centesimi**, non ricalcolato da `imponibile*perc/100`. Con imponibile 1.000,05
al 10% il riquadro scriveva "IVA 100,01" e "TOTALE 1.100,05", ma la somma fa
1.100,06: il cliente che rifa' il conto a mano trova l'errore. Succedeva
nell'1% dei casi al 10%. Peggio: `prevPdf` e la conferma d'ordine usavano
formule diverse, quindi due documenti dello stesso lavoro uscivano con importi
diversi. **Regola: una sola formula, `Math.round((imponibile+ivaArrotondata)*100)/100`,
usata identica in tutti i documenti.** Verificata su 900.000 casi, zero discordanze.
Gli altri sei: la frase in fondo al PDF diceva il falso ("gli importi comprendono
l'IVA" mentre le voci erano al netto); la conferma d'ordine si ricordava
l'**indirizzo del cantiere** della volta prima (documento firmato con l'indirizzo
sbagliato: ora quel campo non si memorizza); l'aliquota non arrivava in fattura;
cancellando una voce i riepiloghi restavano col numero vecchio; e il messaggio
d'errore parlava di "parcella" anche a un'impresa che non sa cosa sia.

## 9 agosto 2026 — IL CESTINO (niente si cancella piu' davvero)

Richiesta di Alessio: "se uno cancella per errore e' meglio poter recuperare".
Scelta sua: **tutto, ovunque**.

### Il controllo di partenza
23 azioni di eliminazione su 21 tabelle. **Tutte avevano gia' la conferma**
(sei sembravano scoperte ma la domanda sta dentro la funzione chiamata).
Quello che mancava era il dopo. Tre casi facevano male: il **reparto** si
portava via tutte le sue pratiche, la **carta** tutti i movimenti, il
**cliente** i suoi documenti.

### Come funziona
**`js/cestino.js`** si mette in mezzo fra il gestionale e il database:
- ogni `.select()` sulle tabelle del cestino riceve `.is("eliminato_il",null)`
- ogni `.delete()` diventa `.update({eliminato_il:ora}).is("eliminato_il",null)`
- `sb.raw(tabella)` e' la porta di servizio che salta il filtro (la usa il Cestino)

**Il punto della scelta**: cosi' non e' stata toccata NESSUNA delle ~60 letture
sparse nei quattro pannelli. Toccandole a mano, dimenticarne una avrebbe fatto
ricomparire roba cancellata. Incluso in tutti e quattro i gestionali
(app, negozio, noleggio, operatore) subito dopo `createClient`.

Bonus: le cancellazioni a catena del database scattano solo su una delete VERA.
Non cancellando mai, la catena non parte e i figli tornano su col padre.

### ⚠️ LE COSE CHE UN SOFT DELETE ROMPE (15 problemi trovati dalla verifica)
Questa e' la parte da rileggere prima di allargare il cestino ad altre tabelle.

1. **I VINCOLI DI UNICITA'.** Il numero fattura e' unico per anno: la riga nel
   cestino continuava a occupare il numero 7 e **non si emettevano piu' fatture
   per tutto l'anno**. Risolto rifacendo il vincolo con `where eliminato_il is
   null`, piu' `fattAssegnaNumero` che ora conta anche il cestino con `sb.raw`.
   Stessa cosa per `gest_note` (una nota per giorno): eliminata una nota, quel
   giorno non era piu' scrivibile. Anche i numeri dei **preventivi** ripartivano
   da capo (li' non c'e' vincolo, quindi nascevano doppioni in silenzio).
2. **LE VISTE DEL DATABASE NON SANNO DEL CESTINO.** `gest_mezzi_scadenze`
   contava le scadenze eliminate e il pallino dei Mezzi restava rosso per
   sempre: rifatta nel file SQL con il filtro.
   **`gest_carte_saldo` e `gest_mezzi_carburante` non stanno nei file del
   progetto** (create a mano in chat): non potendole vedere non le ho toccate,
   e ho **tolto dal cestino `gest_carte_movimenti` e `gest_rifornimenti`**.
   Meglio una cancellazione vera che un saldo carta sbagliato. Quando quelle
   due viste finiranno nel progetto, si possono aggiungere.
3. **LO "SVUOTA CESTINO" E' STATO TOLTO.** Cancellava davvero, quindi faceva
   scattare le catene: svuotando il cestino con dentro un reparto si portava
   via anche clienti, mezzi e fatture VIVI di quel reparto, mai entrati nel
   cestino, e il messaggio diceva "N cose". Al suo posto c'e'
   **"Elimina per sempre" su una riga sola, e solo sulle tabelle FOGLIA**
   (spese, ore, crediti, note, foto, video, scadenze, fatture fornitori) che
   non hanno figli. Sulle altre si puo' solo ripristinare.
4. **I FILE NELLO STORAGE.** Le sei chiamate `storage.remove()` hanno la
   guardia `window.cestinoAttivo()`: col cestino acceso il file NON si tocca,
   se no il ripristino darebbe un'immagine rotta. Il file se ne va solo con
   "Elimina per sempre".
5. **LE CATENE CHE ORA VANNO FATTE A MANO.** Eliminando un fornitore le sue
   fatture restavano vive e continuavano a contare nel "da pagare": ora si
   mettono via esplicitamente. I messaggi di conferma di carta e lavoro sono
   stati riscritti: promettevano cose che non succedono piu'.
6. **La prova all'avvio** non deve spegnere il cestino per un problema di rete:
   riprova una volta e si spegne solo se il database dice che la colonna non
   c'e'. `window.cestinoMotivo()` distingue "migrazione" da "rete" e la sezione
   dice la cosa giusta.

### Cosa resta aperto
- **La sezione Cestino esiste solo in `gestionale-app.html`.** Il motore gira
  ovunque (quindi da negozio e noleggio non si perde niente: clienti, scadenze,
  reparti e note finiscono nel cestino), ma per ripristinare bisogna aprire il
  gestionale principale. Le tabelle `neg_*` e `nol_*` non sono nel cestino.
- Le due viste da portare nel progetto (vedi punto 2).
- Nessuna pulizia automatica: il cestino tiene tutto finche' non si interviene.
  Sono righe, non file: non occupano niente.

### File
`sql/gest-cestino.sql` (colonne, vincoli rifatti, vista, indici) e
`js/cestino.js` (il motore). Va eseguito l'SQL PRIMA di usare il gestionale:
senza, il cestino resta spento e le eliminazioni tornano definitive.

## 9 agosto 2026 — BUG: con una ricerca senza risultati non si poteva piu' aggiungere

Segnalato da Alessio subito dopo il deploy del cestino: "ho creato un cliente ma
non c'e', e non si puo' aggiungerne uno nuovo".

**Che cosa succedeva davvero.** Nella casella di ricerca dei Clienti era rimasto
scritto un indirizzo. L'elenco quindi non mostrava niente ("Nessun risultato"),
e per giunta **spariva anche il pulsante "+"**: `renderTabella` nascondeva il
"+" in alto ogni volta che l'elenco era vuoto, perche' di norma compare il
bottone grande in mezzo alla pagina — ma il messaggio "Nessun risultato" NON ha
nessun bottone. Sparivano tutti e due: sezione bloccata, senza capire perche'.
Il cliente era salvato benissimo: era solo nascosto dal filtro.

**Le tre correzioni:**
1. `renderTabella`: il "+" in alto si nasconde **solo se il messaggio in mezzo
   ha davvero il suo bottone** (riconosciuto dalla classe `lv-btn`). Vale per
   tutte le sezioni in una volta, senza toccarle una per una.
2. `tabVuotoCerca()` ora ha il pulsante **"Mostra tutti"** (azione
   `cerca-azzera`): svuota la casella di ricerca della sezione in cui ci si
   trova e ridisegna. Prima da li' non si tornava indietro.
3. La casella di ricerca era alta 34px con testo piccolo: **sembrava
   un'etichetta, non un campo**. Ora e' alta 44px come gli altri campi e
   **quando contiene qualcosa si accende** (bordo blu doppio, sfondo azzurro,
   grassetto): si vede a colpo d'occhio che stai filtrando.

**La lezione, valida oltre questo caso:** ogni volta che si nasconde un comando
"perche' tanto ce n'e' un altro", bisogna controllare TUTTI gli stati in cui
quell'altro potrebbe non esserci. Qui gli stati vuoti erano due (mai inserito
niente / la ricerca non trova niente) e il ragionamento valeva solo per il primo.

## 9 agosto 2026 — CHECKUP DEL GESTIONALE PROFESSIONISTI (prima parte)

Alessio: "ho paura di fare brutte figure con i clienti". Due revisioni
indipendenti: **oltre 100 rilievi**. Qui la PRIMA ONDATA, gia' fatta: quello che
vede il cliente e quello che perdeva dati. La seconda ondata e' in fondo.

### Quello che vedeva il CLIENTE
1. **Il PDF di una pratica usciva intestato "FATTURA"** con "Non ancora emessa",
   "Causale: Fattura n. **null**" e file `fattura-null.pdf`. Causa: `generaPdf`
   legge `lav.num_fatt`, colonna che **non si scrive piu' da nessuna parte** (il
   numero lo assegna `fattAssegnaNumero` su `gest_fatture`). Ora si chiama
   **SCHEDA PRATICA** / SCHEDA LAVORO, "Riepilogo per il cliente", e il
   riferimento e' la descrizione, non un numero inventato.
2. **Ritenuta e spese si perdevano passando dal preventivo alla fattura**: la
   parcella diceva "netto 4.000", la fattura chiedeva 5.000.
   `fattDaPreventivoConferma` ora passa `ritenuta_perc`, e le spese diventano
   una riga a **IVA 0** (sono anticipi fuori campo, non compenso).
3. **IVA di default 10%** (aliquota ristrutturazione) anche per gli studi, che
   fatturano al 22%. Ora `ivaDefault()` da' 22 al professionista e 10 in edilizia.
4. **"Condominio" diventava "Clientio"**: la regola `['Condomini','Clienti']`
   spezzava la parola, anche dentro i NOMI dei clienti ("Condominio Le Terrazze"
   -> "Clientio Le Terrazze"). Regola rimossa, insieme alle altre
   condominio->cliente: per un tecnico il condominio e' un cliente legittimo.

### Perdite di dati
5. **"Cosa e' stato fatto" si cancellava a ogni riapertura.** `edit-job` non
   traduceva `lavoro_svolto` -> `lavoroSvolto`: la casella si apriva vuota e al
   primo Salva il consuntivo veniva sovrascritto con null. Aggiunte anche `note`.
6. **`data_fatto` non veniva scritta** chiudendo dal modulo (solo il pulsante
   della scheda lo faceva): la pratica spariva dal Report, che filtra su quella
   data. Ora si scrive alla chiusura e si toglie riaprendo.
7. **"+ Aggiungi scadenza" e "+ Aggiungi nuovo cliente" dentro un modulo aperto
   lo distruggevano**: la finestra e' UNA sola (`#sheet`) e la seconda riscrive
   la prima. Ora si avvisa prima. (Il vecchio commento sosteneva il contrario.)

### Roba da cantiere davanti a un ingegnere
8. **Il menu diceva "Attrezzature" e la pagina "Strumenti"**: mancava lo `<span>`
   dentro il pulsante, e `adattaMenuProfessionista` cerca `[data-tab] span`.
9. **Il riquadro "Mezzi e attrezzature" compariva dentro la pratica** di uno
   studio, con scritto "aggiungilo dalla scheda Mezzi" — scheda che lui non ha.
10. **La "Patente a crediti"** (Dati azienda + allarme rosso nel Riepilogo)
    riguarda chi entra in cantiere: nascosta agli studi. **Attenzione**: i campi
    nascosti NON vanno scritti nel salvataggio, se no azzerano il dato di chi la
    patente ce l'ha davvero (guardia aggiunta in `saveAzienda`).
11. **Report: la scheda "Spese con le carte aziendali"** compariva anche agli
    studi (nel Riepilogo era gia' esclusa, nel Report no).

### Il traduttore lavoro->pratica: allargato alla radice
Invece di correggere ~80 scritte una per una:
- **"cantiere" non era nemmeno nel filtro** (riga con la regex): nessuna frase
  che lo conteneva veniva MAI tradotta. Aggiunte al filtro anche manodopera,
  dipendenti, muratore, capo.
- Aggiunte ~40 frasi: cantiere/cantieri con la concordanza giusta, operaio,
  dipendenti, "3 lavori finiti" -> "3 pratiche **finite**" (la vecchia regex
  numerica lasciava l'aggettivo al maschile), "imprese come la tua".
- **Il traduttore ora guarda anche `placeholder` e `title`**, che prima
  restavano fuori per costruzione: un ingegnere leggeva "Es. taglio siepe e
  pulizia aiuole", "Es. Muratore", "Es. Cemento, noleggio piattaforma".
  Nessun rischio di rimbalzo: l'osservatore guarda childList/subtree, non gli
  attributi.

**Come ho verificato**: estratti `_FRASI` e `_swapPratiche` dal file ed eseguiti
con node su TUTTE le stringhe del gestionale che contengono parole da cantiere.
Risultato: restano 2 sole occorrenze, entrambe nomi di colonna
(`dipendente_id`), quindi invisibili. Controllato anche che NON si rompano
"Buon lavoro", "Ore lavorate", "giorni lavorativi", "Ci stiamo lavorando",
"Condominio Aurora". **Questo test va rifatto ogni volta che si tocca `_FRASI`.**

### SECONDA ONDATA — LA CASSA PREVIDENZIALE IN FATTURA (fatta)
Era il buco piu' grosso: il preventivo aveva la parcella completa, la fattura
non sapeva nemmeno cosa fosse la cassa.

**Database — `sql/gest-fattura-cassa.sql`**: `gest_fatture` guadagna
`cassa_perc`, `cassa_tipo` (il codice che lo SDI vuole per sapere QUALE cassa)
e `spese`. Sono gli stessi tre concetti del preventivo.

**I conti (`fattConti`) ora sono IDENTICI a `calcolaParcella`:**
compenso -> + cassa (sul solo compenso) -> + spese -> IVA su tutto ->
- ritenuta (sul SOLO compenso).
Due bug risolti insieme: mancava la cassa, e **la ritenuta si calcolava su tutto
l'imponibile**, quindi mettendo bolli e diritti in fattura veniva trattenuto il
20% anche su quelli.
`fattTotaleLive` usa le stesse formule: prima l'anteprima e il PDF potevano dire
numeri diversi.

**Aliquota prevalente** (`fattAliquotaPrevalente`): cassa e spese non sono righe,
quindi la loro IVA si applica con l'aliquota su cui sta piu' imponibile.

**Il modulo** (solo studi) ha "Cassa previdenziale" con l'elenco `FATT_CASSE`
— ognuna col suo codice: **TC04 Inarcassa, TC03 Geometri, TC17 EPPI periti,
TC22 INPS gestione separata** — e il campo Spese. Paracadute se la migrazione
manca: si tolgono le tre colonne, si salva il resto e lo si dice.

**Il PDF** mostra Compenso / Cassa X% / Spese / Imponibile IVA invece di un solo
"Imponibile" da cui il cliente non capiva come uscisse il totale.

**L'XML per lo SDI**: aggiunto `DatiCassaPrevidenziale`, e **la cassa e le spese
vengono sommate al riepilogo IVA** — senza, la somma dei riepiloghi non torna
col totale del documento e lo SDI scarta il file.
`TipoRitenuta` non e' piu' fisso a RT02: si sceglie dal codice fiscale
dell'azienda (16 caratteri = persona fisica = RT01), perche' la gran parte dei
tecnici ha studio individuale.

**Verificato con node** su 4 casi (geometra 5% + IVA 22 + ritenuta + spese,
Inarcassa 4%, cliente privato senza ritenuta, forfettario): parcella e fattura
danno lo **stesso numero al centesimo**, e la somma dei riepiloghi IVA coincide
col totale del documento. **Questo test va rifatto se si toccano quelle formule.**

⚠️ **Da far confermare al commercialista**: i codici TipoCassa e la regola
RT01/RT02.

### TERZA ONDATA (fatta)

**I dati della pratica non sono piu' invisibili.** Tipo, stato, Comune,
protocollo e catastali si salvavano e non si rivedevano da nessuna parte.
Ora: nell'**elenco Pratiche** la colonna "Chi" (che per uno studio conta poco)
diventa **"A che punto"** con Depositata / In istruttoria / Integrazioni, e
accanto al nome c'e' la pastiglia `.pra-tag` col tipo (CILA, SCIA...);
nelle **schede** compaiono tipo, stato e protocollo; nell'**Excel** ci sono
tutte le colonne `pratica_*` e `catasto_*`.
⚠️ Le schede leggono `l.pratica_*`: ogni query che le alimenta deve fare
`select("*")` per i professionisti. Corretta anche quella dell'**Agenda**, che
aveva l'elenco fisso e quindi non mostrava mai quei campi.

**Il preventivo accettato non fa piu' doppioni.** `prevToLavoro` creava SEMPRE
una riga nuova: il percorso normale (apro la pratica coi dati catastali -> faccio
la parcella -> il cliente accetta) produceva due pratiche, e quella agganciata
alla fattura era la nuova, vuota. Ora, se il cliente ha gia' pratiche non chiuse,
si apre una finestra per **scegliere a quale collegarlo** (o crearne una nuova).

**Report: l'incassato si legge dalle FATTURE PAGATE**, non piu' da
`gest_lavori.fatt_stato` — che si aggiorna solo per le fatture nate da un lavoro
agganciato, quindi chi fattura da preventivo leggeva "Incassato 0" mentre il
Riepilogo mostrava la cifra giusta.

**Backup ed export completi.** Il JSON ora contiene fatture, righe fattura,
collegamenti fattura-lavoro, ore, crediti, fornitori e fatture fornitori
(formato `v2`); l'Excel ha i fogli Fatture, Ore, Crediti formativi, Fornitori e
Fatture fornitori, e i nomi dei fogli seguono il ruolo (Pratiche/Collaboratori).

**Elimina cliente**: l'avviso "ha N pratiche collegate" contava su `db().lavori`,
lo store locale che col flusso Supabase resta sempre vuoto — diceva sempre 0.
Ora conta davvero pratiche e fatture con `count:"exact"`.

**Un difetto trovato dalla verifica**: `impFatt` sommava solo `qta*prezzo`,
quindi Report ed Excel escludevano **cassa previdenziale e spese**: per uno
studio col 5% ogni numero usciva piu' basso del vero. Creata la funzione
**`fattImponibile(f,righe)`** — compenso + cassa + spese − sconto — usata da
tutti e due. **Regola: l'imponibile di una fattura si calcola in un posto solo.**

## 9 agosto 2026 — CHECKUP DEL GESTIONALE IMPRESE (+ regressioni di giornata)

Due revisioni in parallelo: una sul percorso dell'impresa, una a caccia di
**regressioni** causate dalle modifiche fatte oggi per i professionisti.

### ⚠️ REGRESSIONI MIE, di poche ore prima
1. **LE NOTE DEL CALENDARIO NON SI SALVAVANO PIU'.** La piu' grave.
   `sql/gest-cestino.sql` aveva sostituito il vincolo `unique(user_id,
   mestiere_id, data)` di `gest_note` con un indice unico **parziale**. Ma il
   salvataggio usa `upsert ... ON CONFLICT`, e **Postgres non accetta un indice
   parziale come arbitro di ON CONFLICT** (errore 42P10). Nessuna nota si
   salvava piu', per tutti i ruoli.
   **Risolto togliendo `gest_note` dal cestino** (`js/cestino.js`) e rimettendo
   il vincolo intero con **`sql/gest-cestino-fix-note.sql`**, che rimette anche
   in chiaro le note finite nel cestino in quelle ore.
   **LEZIONE: prima di rendere parziale un vincolo di unicita', cercare tutti
   gli `upsert`/`ON CONFLICT` che lo usano come arbitro.**
2. **Report "Incassato" a zero** se `sql/gest-fattura-cassa.sql` non era stato
   eseguito: la query chiedeva `cassa_perc` e `spese` per nome, PostgREST
   rispondeva 400 e il `try/catch` non se ne accorgeva (PostgREST non lancia,
   torna `{error}`). Ora la query fa `select("*")`.
   **LEZIONE: mai chiedere per nome una colonna appena aggiunta in una query
   che deve funzionare anche senza.**
3. **La data di chiusura del lavoro veniva riscritta a ogni salvataggio.** La
   guardia leggeva `lavCache`, che per le imprese NON contiene `data_fatto`
   (l'elenco delle colonne non la include; solo i professionisti fanno `*`).
   Caso vero: l'operaio chiude il lavoro oggi dall'app di cantiere, il capo apre
   "Modifica" per le ore e la data vera spariva. Ora la si chiede al database.
4. **Il Report azzerava l'incassato storico** di chi non usa la sezione Fatture:
   ora, se non c'e' NESSUNA fattura, si torna al vecchio conteggio sui lavori.
5. **La proposta di scadenza tornava a ogni salvataggio**, all'infinito se
   rispondevi No: ora si chiede solo alla CREAZIONE.
6. Nel riquadro dei conti un'impresa leggeva **"Compenso"** (parola da studio):
   per lei e' "Imponibile".

### I problemi veri del percorso impresa
7. **La fattura nata da un preventivo accettato non si collegava al lavoro**:
   `_lavori` non veniva passato, quindi il lavoro restava "da fatturare" per
   sempre e si poteva fatturare due volte. `gest_preventivi.lavoro_id` veniva
   scritto e **non letto da nessuno**: era proprio il dato che serviva.
8. **L'IVA concordata si perdeva** se la fattura nasceva dal lavoro (la strada
   normale): `fattDaUnLavoro` e `fattDaLavoriConferma` mettevano sempre il 10%.
   Un preventivo firmato al 22% diventava una fattura al 10%. Aggiunta
   `_ivaDalPreventivo(lavoroId)`, che va a prendere l'aliquota del preventivo
   accettato di quel lavoro.
9. **"Da fatturare" contato in due modi**: il Riepilogo su `fatt_stato`, la
   sezione Fatture sulla tabella ponte. `fatt_stato` si scrive solo quando la
   fattura viene EMESSA, quindi con una bozza aperta le due schermate si
   contraddicevano. Ora il Riepilogo legge anche `gest_fattura_lavori`, e il
   menu del lavoro non offre piu' "Crea fattura" su qualcosa gia' fatturato.
10. **L'utile del mese conteneva l'IVA** (incassato lordo meno spese nette):
    usciva gonfiato di tutta l'IVA, che non e' tua. Ora usa `fattImponibile`,
    la stessa del Report, e l'etichetta dice "(IVA esclusa)".
11. Un'impresa leggeva **"e le sue 3 pratiche"** eliminando un reparto, e
    "(pratica eliminata)" nello scadenzario: il traduttore gira solo per i
    professionisti, quindi la stringa di partenza non puo' essere gia' in
    linguaggio da studio.
12. **Deep link rotti** per `carte`, `attrezzature`, `richieste`: mancavano
    dalla whitelist.
13. La nota del modulo fattura fornitore prometteva che la spesa sarebbe
    entrata nel margine del lavoro: **non e' vero**, `gest_fatture_fornitori.
    lavoro_id` non e' letto da nessuna parte. Testo corretto per dire come
    stanno le cose.

### Le tre decisioni prese con Alessio (fatte)
Erano rimaste aperte perche' ognuna cambia dei numeri: decise insieme.

**1. I pieni pagati in contanti entrano nei costi.** Prima solo quelli con carta
ci finivano, di rimbalzo, perche' `salvaRifornimento` crea un movimento carta.
Ora Report e Riepilogo leggono `gest_rifornimenti` e contano **solo quelli con
`movimento_id` vuoto**: gli altri sono gia' dentro i movimenti delle carte e
conterebbero due volte. Verificato: 230 € di pieni, di cui 100 con carta ->
contati 230, non 330.

**2. Le fatture dei fornitori entrano nel margine, su una RIGA LORO.**
`gest_fatture_fornitori.lavoro_id` veniva salvato e non letto da nessuno.
Ora il riquadro del margine dice "Lavoro / Spese / **Fatture fornitori** /
Margine", e lo stesso vale nei totali del Report e nell'utile del Riepilogo.
Riga separata e non sommata alle Spese **apposta**: se qualcuno segna la stessa
spesa due volte (una come Spesa del lavoro, una come fattura fornitore) il
doppione si vede invece di sparire dentro un totale unico.

**3. Nella lista Preventivi si vede il numero che vede il CLIENTE.** Prima la
colonna diceva 10.000 (imponibile) e il PDF in mano al cliente 11.000: al
telefono si diceva la cifra sbagliata. Ora la colonna mostra il totale finito
con sotto in piccolo "IVA inclusa"; per gli studi mostra il **da incassare**
della parcella (compenso + cassa + spese + IVA − ritenuta), che e' la cifra del
documento. Allineati anche il totale della sezione e la scheda del Riepilogo:
**tre schermate, un numero solo.** Verificato su 600.000 casi che il numero a
schermo coincida sempre con quello del PDF.

⚠️ Il Riepilogo e il Report ora contano gli STESSI costi (spese lavori, carte,
rifornimenti in contanti, fatture fornitori): se un domani se ne aggiunge uno,
va aggiunto in tutti e due, se no tornano a dare due utili diversi.

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


## 9 agosto 2026 (pomeriggio) — giro di test reale sul profilo Professionista

Test end-to-end fatto insieme ad Alex sul sito in produzione: cliente → pratica →
preventivo/parcella → lettera d'incarico → accettazione → fattura → PDF.
Tutti i numeri della parcella (compenso 2.000, cassa 5% = 100, spese 150,
imponibile 2.250, IVA 495, ritenuta 400, netto 2.345) sono risultati corretti
dal form al PDF: le correzioni di stamattina su cassa e ritenuta reggono su dati veri.

### BUG GROSSO trovato e risolto: il Riepilogo IVA del PDF fattura

Nel PDF, il blocco "Riepilogo IVA" sommava **solo le righe**. Su una parcella con
cassa e spese dichiarava "imponibile 2.000 · imposta 440" mentre due centimetri
sotto addebitava 495. Due numeri diversi nello stesso documento.

L'XML per lo SDI lo faceva **gia' giusto** (in `DatiRiepilogo` cassa e spese
vengono aggiunte all'aliquota prevalente, se no lo SDI scarta il file): mancava
lo stesso passaggio nel PDF, cioe' proprio nel documento che legge il cliente.

Risolto replicando nel PDF le tre righe che l'XML aveva gia'. Verificato con node
su 5 scenari (una aliquota, due aliquote, senza cassa, solo spese, cassa 2%):
la somma dei riepiloghi coincide sempre con imponibile e IVA totali.

**Regola:** PDF e XML devono partire dagli STESSI conti. Se si tocca `fattConti`
o il riepilogo per aliquota, si controllano tutti e due.

### Errori di lingua sistemati

- **451 accenti** in 15 file: `e'`→`è`, `piu'`→`più`, `gia'`→`già`, `cosi'`→`così`,
  `puo'`→`può`, `perche'`→`perché`, `Modalita'`→`Modalità`… Uscivano nei PDF
  (lettera d'incarico, fattura, verbale) e nei suggerimenti a schermo.
  jsPDF con helvetica gestisce benissimo gli accenti: erano scritti male nei modelli.
- Il traduttore per professionisti sostituiva la sola parola e lasciava articoli e
  aggettivi al maschile: *"I pratiche collegate si segnano da soli come fatturati"*.
  Le frasi intere vanno in `_FRASI`, non ci si affida allo swap parola per parola.
- "1 lavoro" nella card fattura vive dentro `.fatt-info`, che sta in `_SKIP_UTENTE`
  (zona che il traduttore salta apposta): la parola giusta va scelta a monte, nel render.
- Il suggerimento sulle aliquote parlava di edilizia (10% ristrutturazione, 4% prima
  casa) anche a un geometra, che fattura sempre al 22%. Ora e' diverso per ruolo.
- "L'importo del preventivo (2.000 €)" mentre la card diceva 2.345: il numero era
  giusto (e' il compenso, che diventa la riga della fattura; cassa/spese/IVA si
  aggiungono dopo, se no si conterebbero due volte) ma la parola era sbagliata.

### Come si sostituisce testo in massa senza rompere niente

Un `piu'` puo' essere un accento mancante **oppure** l'apostrofo che chiude una
stringa JavaScript: `'Sono le foto gia' + String.fromCharCode(39) + ' caricate'`.
Sostituirlo alla cieca rompe la pagina.

Regola usata (verificata): si sostituisce solo se dopo l'apostrofo c'e' uno spazio
seguito da una **lettera** (la frase continua), oppure `: . , ?` seguiti da
spazio/fine riga. Mai se dopo c'e' `+`, `)`, `,`, `;`, `}`.

E soprattutto **tre reti di sicurezza prima di scrivere il file**:
1. `node --check` su ogni blocco `<script>`;
2. confronto dello "scheletro" HTML (tag + nomi attributi) prima/dopo, che becca
   le virgolette di attributo rovinate — cosa che `node --check` non vede;
3. se una delle due fallisce, il file non viene scritto.

Lezione personale: la prima analisi diceva "tutti e 390 i casi sono sicuri" ed era
sbagliata, perche' il comando di controllo usava un `.*` goloso che leggeva
l'ultimo apostrofo della riga invece del primo. Ha salvato la situazione il
controllo automatico, non il ragionamento. **Le verifiche vanno messe prima della
scrittura, non dopo.**

### Non era un bug: preventivo accettato → pratica

Sembrava che il gestionale creasse pratiche doppione. In realta' il controllo
anti-doppione c'e' e funziona: cerca le pratiche aperte **dello stesso cliente**.
Non scattava perche' la pratica di prova non aveva il cliente collegato.
Collegato il cliente, la finestra "A quale pratica lo collego?" e' comparsa.

### Da fare

- Dati del profilo scritti male ("alessio", "rieti"): escono cosi' nei PDF firmati
  dal cliente. Vanno sistemati dal Pannello, non sono un problema di codice.
- Manca da testare: il Cestino (elimina e recupera) e tutto il giro sul profilo Impresa.


## 9 agosto 2026 (sera) — "Elimina per sempre" sicuro, e la lezione sui controlli

Domanda di Alex: *"le pratiche eliminate come si eliminano del tutto? dopo quanto
tempo? anni? mesi?"*. Risposta: **mai**, non c'era nessuna pulizia automatica e
non e' stata aggiunta. In un gestionale con fatture e pratiche un automatismo che
cancella dopo N giorni e' una trappola: quando uno se ne accorge e' tardi.
A cancellare deve essere sempre una persona.

Quello che mancava era il pulsante manuale. Prima "Elimina per sempre" c'era solo
sulle tabelle senza figli; su pratiche, clienti, fatture e reparti no, perche' la
cancellazione a catena del database si sarebbe portata via anche roba viva.

### La soluzione: decide Postgres, non il gestionale

`sql/gest-cestino-elimina.sql` — funzione `gest_cestino_elimina(tabella, id, conferma)`.
Il gestionale la chiama due volte: prima in anteprima, poi per confermare.
L'elenco dei collegamenti NON e' scritto a mano: viene letto da `pg_constraint`,
cioe' dal catalogo del database. Una tabella aggiunta domani viene vista da sola.

**La regola e' "nel dubbio rifiuta".** Si ferma se trova:
- una riga che non e' nel cestino (la perderesti)
- una riga di un altro account
- una chiave composita o che non punta a `id` (non la sa seguire)
- una catena piu' profonda di 8 livelli
- un vincolo `restrict` che farebbe fallire il delete

Le righe che restano ma perdono il riferimento (`on delete set null`: la fattura
di un cliente cancellato) non bloccano, ma vengono **elencate nella conferma**.
La funzione restituisce anche gli `storage_path` dei file da togliere dal bucket.

### Perche' SECURITY DEFINER e non INVOKER

Questa e' la parte importante. Con `security invoker` la funzione legge filtrata
dalle RLS, **ma il CASCADE del database le RLS non le guarda**: quello che la
funzione non vede muore lo stesso. Nel test: reparto mio nel cestino -> mezzo di
un altro account (invisibile) -> scadenza MIA viva. L'anteprima diceva
"non succede niente" e la scadenza spariva. Ora la funzione gira con pieni poteri
e i controlli di proprieta' li fa a mano contro `auth.uid()`.

### Cosa e' stato corretto anche nel gestionale

- La regola di ripiego conteneva `does not exist`, che compare in decine di errori
  Postgres normali: qualsiasi errore vero avrebbe fatto cancellare aggirando il
  controllo. Ristretta a `PGRST202|Could not find the function|schema cache`.
- I file nello storage: eliminando un padre, le foto dei figli sparivano dal
  database ma i file restavano nel bucket per sempre, irraggiungibili.
- `rinfresca` non elencava carte, crediti e calendario: dopo un ripristino la
  sezione restava vuota fino a un F5.
- **Il backup non conteneva quello che sta nel cestino.** Da quando si puo'
  eliminare per sempre era una trappola: scarichi il backup, svuoti il cestino,
  e nel file non c'e' niente. Ora `_fetchAllExport` legge con `sb.raw`.
  ATTENZIONE: la sostituzione va fatta SOLO dentro quella funzione. Nel resto del
  file ci sono 26 letture con lo stesso schema che DEVONO restare filtrate, se no
  le cose eliminate ricompaiono negli elenchi e nei PDF.
- `gest_note` era ancora in `CEST_COSE` pur essendo stata tolta dal cestino.

### Le due lezioni, che valgono per il futuro

**1. Verificare che il file arrivato sia quello provato.** La prima versione della
funzione era stata provata su un Postgres vero e funzionava, ma nel trasferimento
`array_agg` era diventato `array_agh`: il file consegnato non partiva nemmeno.
Non me ne ero accorto perche' non avevo confrontato le impronte.
**Regola: dopo ogni trasferimento, `md5sum` da una parte e dall'altra.**

**2. I revisori vanno fatti lavorare su codice ESEGUIBILE.** Il difetto delle RLS
non si vedeva leggendo: e' saltato fuori solo installando Postgres nel container,
ricreando lo schema con le RLS di Supabase e provando davvero. Ora nel container
c'e' PostgreSQL 16: per qualsiasi funzione SQL futura, prima si prova li'.

### Non risolto, documentato

- I PDF (parcella, lettera d'incarico, conferma d'ordine, verbale) leggono il
  cliente con `sb.from`: se il cliente e' nel cestino stampano "—" invece del
  nome. A schermo l'elenco preventivi ora dice "Nome (nel cestino)", quindi i due
  posti non concordano. Non e' un difetto nuovo, ma va sistemato.
- Restano da testare dal vivo: il giro completo sul profilo Impresa.


## 9 agosto 2026 (sera, 2) — I tooltip: fusi in aiuti.js, non aggiunti accanto

Alex: *"non c'e' tooltip nel gestionale professionisti, mettiamolo"*.

Prima cosa scoperta: **un sistema c'era gia'**, `js/aiuti.js`, con 17 spiegazioni
per il menu (chiave = `data-tab`) e 35 per la barra in alto (chiave = `data-action`).
Ma copriva solo quelle due zone e si spegneva da solo sui telefoni: nel file c'era
scritto `if (!hover) return`, con la motivazione "sul telefono il passaggio sopra
non esiste". Per un geometra in cantiere, che sta sul telefono, era come non averlo.

**Non e' stato aggiunto un secondo sistema** (sarebbe stato: due riquadri diversi,
due grafiche, due file da mantenere). Tutto fuso dentro `aiuti.js`:

- restano i suoi dizionari, che agganciano per `data-tab` / `data-action` /
  `data-aiuto` — piu' solido del cercare il testo;
- aggiunto `AIUTI_TESTO`, chiave = il testo a schermo in minuscolo, per i posti che
  un attributo non ce l'hanno: etichette dei form (cassa previdenziale, ritenuta,
  aliquota, protocollo, codice destinatario…), i numeroni (`.fatt-tot > .l`) e i
  pulsanti delle card;
- aggiunto il **(i) toccabile**: un `<button>` vero, clic sul computer e tocco sul
  telefono. Sul computer il menu continua a funzionare col solo passaggio del mouse
  (il (i) li' non compare); sul telefono il (i) compare anche sul menu, perche' e'
  l'unico modo.

### Due trappole, tutte e due vere

**1. Mai un pulsante dentro un pulsante.** Sulle card le azioni sono `<button>`:
un (i) dentro "Elimina per sempre" avrebbe fatto partire l'eliminazione al tocco.
Se ne mette **uno solo in fondo alla fila**, che spiega tutti i pulsanti insieme,
con `stopPropagation()` sul clic. Verificato: 0 pulsanti premuti per sbaglio.

**2. Il clic che richiudeva subito.** Sul computer: passi il mouse (si apre),
clicchi, e il clic trovava la bolla gia' aperta e la chiudeva. Serve distinguere
"aperta al passaggio" da "fissata col clic" (variabile `fissato`). E il passaggio
del mouse si registra solo dove `(hover: hover)` e' vero, se no sui telefoni il
browser lo simula al tocco e la bolla lampeggia.

### Come si aggiungono altri aiuti

Tre modi, in ordine di precedenza: `data-aiuto="..."` sull'elemento, oppure una
riga in `AIUTI_TAB` / `AIUTI_AZIONE` (chiave = data-tab o data-action), oppure una
riga in `AIUTI_TESTO` (chiave = il testo a schermo, minuscolo, senza "(facoltativo)"
e senza due punti). Un MutationObserver ripassa a ogni cambio di schermata, quindi
le pagine nuove ereditano gli aiuti senza doversene ricordare.

### Provato in un browser vero, non solo letto

Con Playwright, su finestra da computer e su telefono simulato: posizione dei (i),
zero (i) dentro i pulsanti, apertura al clic e al tocco, chiusura con Escape e col
clic fuori, nessuna azione fatta partire per sbaglio, aggancio del contenuto
caricato dopo, nessun raddoppio, zero errori JavaScript.

Un difetto trovato solo cosi': sul telefono il riquadro usciva a destra. Il vecchio
`posiziona()` lo metteva a destra dell'elemento e non ricontrollava il bordo. Ora
c'e' una stretta finale su entrambi i lati. (Attenzione, la prima misura diceva
`innerWidth = 980` su uno schermo da 390: era la **paginetta di prova** senza il tag
`<meta name="viewport">`. Il gestionale ce l'ha. Quando un numero non torna,
sospettare prima del banco di prova che del codice.)

### Due difetti che il banco di prova non poteva vedere (9 agosto, sera)

La funzione girava su un PostgreSQL vero nel container, con 10 scenari e le RLS
accese. Eppure in produzione si e' rotta due volte, e tutte e due le volte perche'
**lo schema di prova non somigliava abbastanza a quello vero**:

1. `DELETE requires a WHERE clause`. Supabase tiene acceso **pg_safeupdate**, che
   rifiuta qualsiasi delete senza where — anche su una tabella temporanea interna.
   In locale quell'estensione non c'era. Risolto con `delete from _cascata_tmp where true`.
2. `column t.id does not exist` (42703). La funzione dava per scontato che ogni
   tabella avesse una colonna `id`. Le **tabelle-ponte** (per esempio il collegamento
   fattura-lavoro) hanno come chiave la coppia delle due colonne, e nel mio schema di
   prova gliel'avevo messa io. Ora si controlla in `pg_attribute`: se `id` non c'e',
   la riga si conta lo stesso con un `gen_random_uuid()` usa e getta, e sotto non si
   scende (senza `id` nessuna chiave esterna puo' puntarla nel modo accettato).

**Regola per la prossima funzione SQL:** ricreare lo schema di prova dai file veri
in `sql/`, non a memoria, e accendere le estensioni che Supabase ha accese. E quando
il gestionale mostra un errore tradotto, l'unico modo per sapere cosa e' successo
davvero e' Rete -> la riga rossa -> Response: li' c'e' il codice Postgres (42703 e
compagnia), che dice esattamente dove guardare.


## Il punto della sera del 9 agosto 2026 (superato, tenuto per memoria)

### Fatto e verificato dal vivo (profilo Professionista)
Giro completo cliente -> pratica -> parcella -> lettera d'incarico -> accettazione
-> fattura -> PDF -> cestino -> elimina per sempre. Tutti i numeri tornano
(compenso 2.000, cassa 100, spese 150, imponibile 2.250, IVA 495, ritenuta 400,
netto 2.345) dal form al PDF. Trovati e risolti lungo la strada: il Riepilogo IVA
del PDF che dichiarava 440 invece di 495, 451 accenti, quattro frasi sgrammaticate,
e tutta la storia dell'"Elimina per sempre" sicuro (tre giri di correzioni).

### Da fare domani
1. **Il giro di test sul profilo Impresa**, uguale a quello fatto per il
   professionista. E' il profilo con piu' utenti, quindi conta di piu'.
2. Se vuole vedere il blocco fiscale: creare una fattura, premere Emetti (cosi'
   prende il numero), metterla nel cestino e provare a eliminarla per sempre.
   Deve rifiutarsi nominando il numero.

### Rimasto aperto, deciso di non farlo oggi
- **I PDF stampano "—" al posto del nome se il cliente e' nel cestino.** Leggono
  con `sb.from`, che filtra. Riguarda parcella, lettera d'incarico, conferma
  d'ordine, verbale (6 punti). A schermo l'elenco preventivi dice "Nome (nel
  cestino)", quindi i due posti non concordano. Non e' un difetto nuovo.
- **Dati del profilo scritti male**: nome studio "alessio", citta' "rieti",
  email con la P maiuscola. Escono cosi' sui PDF che il cliente firma. Si
  sistemano dal Pannello, non e' codice.
- Il titolo della scadenza automatica e' ridondante: "CILA — CILA prova".
- Una ventina di file `.bak-*` da cancellare quando ci si fida.
- Da far confermare a terzi: i codici TipoCassa e la regola RT01/RT02 al
  commercialista, i modelli di lettera d'incarico e conferma d'ordine a un legale.

### Come si lavora (riassunto delle lezioni di oggi)
- Dopo ogni trasferimento di file: **`md5sum` da una parte e dall'altra**. Una
  volta `array_agg` e' arrivato come `array_agh` e il file non partiva.
- Le funzioni SQL si provano su un **PostgreSQL vero** (nel container c'e' il 16),
  ricreando lo schema **dai file in `sql/`**, non a memoria, e con le estensioni
  che Supabase tiene accese (pg_safeupdate).
- Il JavaScript che tocca la pagina si prova con **Playwright**, non solo leggendo.
- Quando il gestionale mostra un errore tradotto, quello vero sta in
  **F12 -> Network -> la riga rossa -> Response**: c'e' il codice Postgres.
- **Niente comandi git dalla cartella collegata**, nemmeno `git status`.


## Il giro di test sul profilo IMPRESA — 10 agosto 2026

Fatto quello che era in programma. **I numeri dell'impresa erano gia' giusti**: il
problema vero stava nel cestino, e non si vedeva cliccando.

### I due buchi che perdevano dati (riprodotti, non sospettati)

Provata la funzione `gest_cestino_elimina` su un **PostgreSQL 16 vero** nel container,
con lo schema ricostruito dai file in `sql/` e con **pg_safeupdate compilato e attivo**.
Entrambi i difetti si aprono nello stesso momento: **svuotando per sempre un REPARTO**
(`gest_mestieri`), che tira dietro fatture, fornitori, ore e mezzi.

**1. `distinct on` senza priorita' sull'esito.** Una riga raggiungibile da due strade
con azioni diverse veniva tenuta **a caso**. Nello schema vero le strade doppie ci sono:
`gest_ore` sta sotto il reparto (cascade), sotto il lavoro (cascade) e sotto la persona
(set null); `gest_fatture_fornitori` sotto reparto e fornitore (cascade) e sotto il
lavoro (set null). Quando vinceva la copia "scollegata", una riga **VIVA** non veniva
contata come ostacolo e il database la cancellava in silenzio. Riprodotto: fattura
fornitore FT-99 mai messa nel cestino, annunciata come "resta ma perde il collegamento",
poi **cancellata**. Anche i conteggi mentivano: anteprima 16, cancellate 40.

**2. Il blocco fiscale si aggirava dal padre.** Il controllo `numero is not null` valeva
solo con `p_tabella = 'gest_fatture'`. Svuotando il reparto, la fattura **emessa 7/2026**
se ne andava comunque: il buco nella numerazione si apriva, cioe' esattamente la cosa che
quel blocco doveva impedire. Ora il rifiuto guarda tutta la catena e risponde
`{"ok":false,"fiscale":"7","fiscali":["7"]}`.

**3. Il vicolo cieco delle note.** `gest-cestino.sql` aveva aggiunto `eliminato_il` a
`gest_note`; poche ore dopo il fix delle note le ha tolte dal cestino, ma **la colonna e'
rimasta** e da allora e' sempre vuota. Per la funzione una nota era quindi sempre "viva":
un reparto con **una sola nota sul calendario** non si poteva svuotare mai, e non c'era
modo di sbloccarsi. Risolto togliendo la colonna (`alter table gest_note drop column
eliminato_il`). **Attenzione: se un domani si rilancia `gest-cestino.sql` la colonna
torna — va rilanciato anche `gest-cestino-elimina-fix.sql`.**

Corretto anche il motivo del rifiuto (era deciso su tutto il gruppo con `bool_or(altrui)`:
2 lavori vivi tuoi + 1 di un altro account diventavano "altro account, n=3") e chiuso il
caso della **vista** chiamata `gest_*` che passava i controlli senza avere chiavi esterne.
Tutto in `sql/gest-cestino-elimina-fix.sql`, lanciato in produzione. `_gest_cascata` non
e' stato toccato: era giusto.

### Fatto anche

- **I 6 documenti col cliente nel cestino** (era la voce in cima al "rimasto aperto"):
  preventivo, conferma d'ordine dal lavoro e dal preventivo, lettera d'incarico, verbale
  form e verbale PDF. Un punto solo, `cliDelDocumento()`, che legge da `sb.raw` — la porta
  di servizio che vede tutto. Il ragionamento: **un documento gia' fatto non cambia perche'
  hai spostato il cliente nel cestino**. A schermo il filtro resta, quindi l'elenco
  preventivi continua a dire "Nome (nel cestino)": ora i due posti concordano. Le letture
  della scheda cliente e del modulo di modifica sono rimaste filtrate di proposito.
- **`titoloScadenza()`**: via il "CILA — CILA prova". Il tipo si mette davanti solo se
  nella descrizione non c'e' gia'. Il confronto ignora maiuscole, accenti e punteggiatura
  (becca anche `C.I.L.A. prova`) e cerca la parola intera, cosi' **SCIA non si nasconde in
  "fascia"**. 24 casi provati.
- **Ultima finestrella piccola convertita**: "Carica foto o video" della Galleria era
  ancora `openSheet()`. Ora e' `openSheetGrande()` a due colonne. Le uniche
  `openSheet()` rimaste sono la definizione della funzione e la vista del giorno del
  calendario, che non e' un form.
- **28 file `.bak-*` (11 MB)** spostati in `_to_delete/bak-9-agosto/`. Nel `.gitignore`
  c'era solo `*.bak`, che **non** copre `.bak-viste`: aggiunti `*.bak-*` e `*.vecchia`.
  Erano a un `git add .` di distanza da GitHub.
- **`docs/da-confermare-al-commercialista.md`**: checklist con i codici veri che il file
  XML scrive oggi (TipoCassa TC03/TC04/TC17/TC22, criterio RT01/RT02, CausalePagamento A,
  TD01/RF01/TP02/MP05, EsigibilitaIVA I) piu' le domande aperte. In fondo la parte per il
  legale.

### Trovato scrivendo quel documento, e piu' urgente dei codici cassa

**IVA allo 0% quando non si e' in forfettario: il file elettronico dichiara il falso.**
Il codice scriveva sempre `Natura N2.2` con la dicitura "operazione non soggetta - regime
forfettario", perche' il controllo era su `if(+al===0)` e non su `if(forf)`. Per un'impresa
edile in regime ordinario lo zero e' quasi sempre l'**inversione contabile del subappalto**
(art. 17 c.6 lett. a-ter DPR 633/72), che vuole un codice diverso (probabilmente N6.7).
**Non e' stato indovinato**: aggiunto un controllo in `fattXmlControllo` che **blocca la
creazione del file XML** e spiega perche'. Il PDF e l'emissione funzionano: si ferma solo
la cosa che direbbe una bugia. Quando arriva la risposta del commercialista va messa una
tendina con il motivo.

### Verificato e a posto (profilo Impresa)

Conti provati con le funzioni vere estratte dal file: 10% semplice, due aliquote 10+22
insieme, ritenuta 4% del condominio, sconto, forfettario con bollo. In tutti i casi il
Riepilogo IVA del PDF quadra col totale, Riepilogo e Fatture danno lo stesso "da
incassare", e il totale del preventivo e' identico a quello della fattura che nasce da
lui. Pagina caricata con Playwright su computer e telefono: zero errori JavaScript, zero
id duplicati, zero testi sotto i 13px.

### Da fare la prossima volta

1. **Il giro cliccando sul profilo Impresa** con dati veri: reparto con cliente, lavoro,
   ore e fattura emessa, tutto nel cestino, e provare a svuotare il reparto. Deve
   rifiutarsi nominando il numero. (La funzione e' provata, la mano dell'utente no.)
2. Portare la risposta del commercialista dentro il codice: tendina del motivo per l'IVA
   a zero, ed eventuale correzione dello sconto (oggi si toglie **dopo** l'IVA).
3. Svuotare `_to_delete/` quando ci si fida: dal ponte non si cancella, lo fa Alex.

### Rimasto aperto

- **Dati del profilo scritti male**: nome studio "alessio", citta' "rieti", email con la
  P maiuscola. Escono cosi' sui PDF che il cliente firma. Si sistemano dal Pannello.
- `fattImponibile()` (Report ed Excel) sottrae lo sconto, `fattConti().imponibile` no: due
  numeri diversi con lo stesso nome. Non e' un errore — servono a due cose — ma il
  commento dice "la stessa formula di fattConti" e non e' vero.
- L'anteprima del conto in fattura conta una quantita' vuota come **0**, il salvataggio
  come **1** (`||0` contro `||1`). Il totale cambia dopo aver salvato. Minore.

### Lezioni di oggi

- **Lo schema di prova va allineato alla mappa VERA delle chiavi esterne**, non a una
  ricostruzione plausibile: la prima versione aveva `gest_fatture.cliente_id` in cascade
  invece che set null, e con quello i due difetti gravi comparivano nel posto sbagliato.
  La query giusta per averla e' in fondo a `sql/gest-cestino-elimina-fix.sql`.
- **Un bug non deterministico va ripetuto piu' volte.** Il difetto 1 sbagliava 4 volte su
  5: una prova sola avrebbe potuto assolverlo.
- **Un difetto trovato va anche smentito.** Due sospetti sono caduti cosi': la quantita' 0
  in `fattImponibile` (il salvataggio non scrive mai 0) e il "file orfano nello storage"
  (il lato JS gia' passa `x.path`).
- ⛔ **Il 10 agosto e' stato lanciato di nuovo `git log` dalla cartella collegata**, contro
  la regola in cima a questo file. Stavolta **nessun `index.lock` e' stato creato** e non
  ha rotto niente — ma e' andata bene, non e' andata giusta. La regola resta: per sapere
  cosa e' cambiato **si guardano i file**.

---

# 10 agosto 2026 (sera) — IL COMPUTO METRICO, DA MOTORE A STRUMENTO

Giornata partita da "stiamo testando il computo metrico" e finita con la funzione
completa. Alessio ha fatto il collaudatore per tre ore: **quasi tutti i difetti gravi
sono usciti da lì**, non dai controlli automatici. Vale la pena ricordarselo.

## Cosa c'è adesso

- **Calcolo** delle misure (parti × lungh. × largh. × alt.) coi vuoti da detrarre. Le
  formule stanno **solo** nel database (viste `gest_computo_voci_calc` e
  `gest_computo_totali`): il gestionale legge, non calcola.
- **PDF** nel formato standard dei computi: tabella unica con `N. | Tariffa |
  Descrizione | Dimensioni (P.U. lungh. largh. alt./peso) | Quantità | Prezzo (unit.
  totale)`, misure riga per riga, "Sommano" per voce, "Sommano il capitolo", riepilogo
  dei capitoli, **A riportare / Riporto** a piè di pagina, intestazione ripetuta.
- **Ribasso** applicato davvero, con gli **oneri della sicurezza fuori dal ribasso**
  (regola delle gare). Una sola funzione: `compRiepilogoDa()`.
- **Da computo a preventivo** con un pulsante. Il ribasso diventa una riga negativa a
  parte, non spalmato sui prezzi.
- **Prezzario** (`gest_prezzi_propri`): sezione sua nel menù, ricerca che perdona
  singolare/plurale, importazione da Excel/CSV, tariffe separate per regione.
- **Correzione di una misura** cliccandoci sopra (prima si poteva solo cancellare).
- La sezione si chiama **Computo metrico** (era "Computi metrici").

## I difetti trovati — tutti sbagliavano i numeri IN SILENZIO

Nessuno di questi dava errore a schermo. È il tipo peggiore: i numeri restano
verosimili e arrivano al committente.

1. **Doppio clic = misura doppia.** Supabase ci mette qualche decimo a rispondere e il
   pulsante restava premibile. Riprodotto 5 volte su 5 con la latenza vera.
   Chiavistello: `compMisSalvo`, non solo il pulsante spento.
2. **L'autofill di Chrome cambiava le misure.** Scrivendo "porta" nella descrizione,
   Chrome riempiva da solo lunghezza e altezza coi valori di settimane prima: porta alta
   2,70 invece di 2,10. Successo **tre volte di fila**. Non basta `autocomplete="off"`
   (Chrome lo ignora quando riconosce il campo): serve anche un **nome a caso** a ogni
   disegno → `_noAuto()`.
3. **Il ribasso non lo applicava nessuno.** Si scriveva, si salvava, e i totali
   restavano pieni. Su una gara è la differenza fra vincere e non vincere.
4. **I vuoti sommati invece che sottratti.** "Si detrae" stava sotto ai campi, lontano, e
   si resettava a ogni misura: sfuggito 3 volte su 3. Spostato **sopra**, subito dopo la
   descrizione, più un avviso se una misura si chiama porta/finestra/vuoto ed è in più.
5. **Importazione che indovinava in silenzio.** Un file con colonne irriconoscibili
   veniva importato lo stesso, prendendo l'intestazione come voce. Ora fa vedere come ha
   capito la prima riga e chiede conferma.
6. **Ricerca lettera per lettera.** Cercando "tramezzo" non trovava "tramezzi". Ora si
   confronta la **radice** (via la vocale finale) e si ignorano accenti e maiuscole.
7. **Grassetto che colava.** Il "Riporto" a inizio pagina lasciava il grassetto acceso:
   la prima lavorazione dopo ogni cambio pagina usciva tutta in grassetto. **Trovato
   guardando la pagina 2 di un PDF di prova**, non dai controlli automatici.
8. **L'anno del prezzario restava appiccicato** scegliendo "non lo dico".

## Le scelte che non vanno ribaltate senza pensarci

- **Il prezzo entra nel computo come una fotografia.** Aggiornando il prezzario, i
  computi già fatti non cambiano. Se no un computo consegnato due anni fa cambierebbe
  totale da solo.
- **Una tariffa nuova non sovrascrive la vecchia**: entra accanto ("Lazio 2025" vicino a
  "Lazio 2023"), col confronto di cosa è cambiato, e la vecchia va nel cestino solo se lo
  dici tu. Sovrascrivere i prezzi cambierebbe un computo in corso sotto gli occhi.
- **La tariffa si sceglie in un posto solo**, sul computo. Prima c'erano due punti che
  dicevano la stessa cosa senza parlarsi (il campo scritto a mano che finisce sul PDF, e
  una tendina dentro la lavorazione): si poteva stampare "Lazio" e pescare i prezzi
  dall'Umbria senza un avviso.
- **Il confronto fra due tariffe si fa per CODICE**, non per descrizione: le descrizioni
  le riscrivono a ogni revisione, i codici no.
- **Doppioni solo dentro la stessa tariffa.** Lo stesso codice in due regioni è normale.

## Da fare la prossima volta

1. **L'archivio delle tariffe regionali dentro TrovaImpresa.** Oggi ogni utente importa
   il file della sua Regione. Se le tariffe stessero già dentro, un tecnico aprirebbe il
   gestionale e troverebbe la sua pronta — probabilmente è la ragione per cui uno studio
   paga l'abbonamento. **Non è una funzione, è un pezzo di prodotto**: venti Regioni,
   formati tutti diversi, aggiornamento annuale, e va verificato che si possano
   ridistribuire in un servizio a pagamento.
2. **Le voci salvate col pulsante ★ prendono `fonte:"mio"`**, che in mezzo a nomi come
   "Tariffa Regione Lazio 2023" non dice niente. Meglio "Le mie voci".
3. **Refuso nei dati di prova di Alessio**: nell'Oggetto del computo c'è scritto
   "ifacimento" invece di "Rifacimento". È suo, si corregge dal campo.
4. Provare l'importazione con una **tariffa regionale vera** (ventimila righe): il
   caricamento va a blocchi di 200, non è mai stato provato oltre le 15 voci.

## Lezioni

- **Il collaudo a mano trova quello che i test non cercano.** L'autofill di Chrome e il
  grassetto colato non sarebbero mai usciti da un controllo automatico: il primo perché
  dipende da cosa il browser si ricorda, il secondo perché va **guardato**. Da qui in
  poi: sui PDF, aprire almeno una pagina interna e guardarla.
- **Un limite va detto, non nascosto.** Dove si tiene in memoria solo una parte
  (500 voci nella ricerca, 5000 righe all'importazione, 8 risultati mostrati), il
  gestionale lo scrive. Un taglio silenzioso si legge come "ho visto tutto".
- **Quando l'utente si arrabbia, di solito ha ragione sul prodotto.** "Ma lo capiranno?
  Perché lo hai messo lì?" ha smontato una scelta fatta perché era la strada più corta —
  ed era giusto smontarla.
- **Istruzioni ambigue fanno danni quanto il codice sbagliato.** "Cancella le tre misure
  con la × a destra" è stato eseguito sulla schermata del computo, dove la × cancella
  l'intera lavorazione. Dire sempre **su quale schermata** si sta parlando.

---

# 11 agosto 2026 — LA POLIZZA SULLA LETTERA D'INCARICO, E L'EMAIL DEL LUNEDÌ

Due lavori in una tornata. Tutti e due provati facendo girare le cose davvero, non
leggendole: **39 prove nel browser** sul gestionale (26 PDF veri scaricati e letti) e
**30 prove** sulla funzione Netlify fatta partire contro un finto Supabase.

## 1. Gli estremi della polizza nella lettera d'incarico

**Perché.** L'art. 9 comma 4 del DL 1/2012 non chiede solo il preventivo scritto: chiede
che il professionista dica al cliente, per iscritto e al momento dell'incarico, **con
quale polizza è assicurato e fino a quanto copre**. La lettera d'incarico usciva senza.
In caso di contestazione è il professionista a restare scoperto.

**Cosa c'è adesso**

- **Dati azienda, colonna destra, riquadro «Polizza professionale»** — solo profilo
  professionista, accanto a Fattura elettronica. Quattro campi: `pol_compagnia`,
  `pol_numero`, `pol_massimale`, `pol_scadenza`. Si scrivono una volta e restano.
- **`polizzaEstremi(az)`** — l'unico punto che decide se la polizza è completa e se è
  scaduta. Il confronto della scadenza è fra testi `aaaa-mm-gg`, che si ordinano da soli:
  niente fusi orari.
- **`incaricoForm`** si ferma PRIMA di aprire il modulo se manca la polizza (messaggio che
  elenca quali dei quattro campi mancano, poi apre i Dati azienda) o se il preventivo non
  ha un cliente.
- **`incaricoPdf`** ripete gli stessi due controlli. Non è pignoleria: fra l'apertura del
  modulo e il clic su «Scarica» si possono aprire i Dati azienda in un'altra scheda e
  svuotarli. Il controllo che conta è quello attaccato alla stampa.
- **Polizza scaduta**: riga rossa dentro il modulo + `gconfirm` prima di stampare. Si può
  stampare lo stesso — capita di consegnare il giorno del rinnovo, e bloccare tutto
  sarebbe peggio del problema.
- **PDF, articolo dopo il Compenso**: titolo, la frase di legge, i quattro dati e la nota
  finale.
- Migrazione: **`sql/gest-azienda-polizza.sql`**.

**Il cliente mancante era un difetto vero, non un extra.** Fino a oggi la lettera si
scaricava anche senza cliente: `cliDelDocumento` restituisce `{}` se `cliente_id` è nullo,
e al posto del committente usciva un trattino. Restava in mano un foglio da firmare
intestato a nessuno. Alla prova a clic di Alessio è saltato fuori al primo tentativo.

## 2. Il riepilogo del lunedì (`netlify/functions/riepilogo-lunedi.js`)

**Su Netlify, non su Supabase**, perché l'impianto c'era già: `promemoria-scadenze.js` usa
lo stesso stampo, Resend è configurato e `SUPABASE_SERVICE_KEY` / `RESEND_API_KEY` sono già
su Netlify. Su Supabase servivano estensioni nuove, chiavi in un altro posto e un secondo
sistema di orari, per lo stesso risultato. Costo: **zero** fino a ~750 iscritti che usano
il gestionale (Resend regala 3.000 email/mese).

- Parte **lunedì 5:30 UTC** = 7:30 con l'ora legale. Da fine ottobre va messo `30 6 * * 1`,
  se no diventa le 6:30.
- Tre sezioni: scadenze dei prossimi 7 giorni, fatture emesse e non pagate, lavori (o
  pratiche) con la data prevista passata. **Formule copiate verbatim dal Riepilogo**, non
  riscritte a mente: totale fattura = imponibile + IVA − sconto + bollo − ritenuta, e
  "scaduta" = emessa con `data + giorni_pagamento < oggi`.
- **Sezione vuota = sezione che sparisce. Settimana pulita = nessuna email.** Tre email
  "va tutto bene" di fila e la quarta non la apre più nessuno.
- Interruttore: `gest_azienda.riepilogo_lunedi`, casella nei Dati azienda (tutti i ruoli,
  accesa di partenza). Migrazione **`sql/gest-azienda-riepilogo-lunedi.sql`**.
- **`const SOLO_A = 'pintoalessio@icloud.com'`** in cima al file: per un mese arriva solo
  ad Alessio. Per aprirla a tutti si mette `null` — una riga, il resto è già scritto.

## I difetti trovati facendo girare le cose

1. **Il blocco della polizza si spezzava fra due pagine.** Titolo e frase in fondo al primo
   foglio, i quattro dati sul secondo senza titolo: chi girava pagina leggeva «Generali,
   500.000» senza sapere di cosa si parlasse. Ora si **misura** l'altezza prima di
   scrivere. Due misure, non una: il **cuore** (titolo + frase + i quattro dati) non si
   spezza mai, la nota finale può andare a capo — pretenderla attaccata costava mezza
   pagina bianca e spesso un terzo foglio per ogni lettera.
   **Trovato aprendo il PDF e guardandolo**, come dice la lezione del 10 agosto.
2. **Gli importi dell'email senza il punto delle migliaia** — usciva `2550,00 €`. Manca
   `useGrouping:true`, la stessa trappola già annotata a commento nel gestionale e non
   copiata. Su Node senza ICU completo `Intl` non raggruppa da solo.
3. **L'email elencava fatture e lavori già nel cestino.** Il gestionale li nasconde con
   `js/cestino.js`, ma la funzione Netlify legge da fuori, senza quel filtro. Chiunque
   scriva codice che legge le tabelle `gest_*` **da fuori dal browser** deve aggiungere
   `.is('eliminato_il', null)`. Vale per tutte le tabelle in `CESTINO_TABELLE`.
4. **Il massimale oltre i 12 interi faceva fallire il salvataggio** con un messaggio del
   database che non spiegava niente: `numeric(12,2)` regge fino a 10 miliardi. Tetto
   client-side a 999.999.999.

## Le scelte che non vanno ribaltate senza pensarci

- **Il riquadro polizza è solo per il profilo professionista**, e in `saveAzienda` si
  scrive **solo se il riquadro c'è davvero** — stessa precauzione della patente a crediti
  al contrario. Se scrivessimo sempre, un'impresa che salva i suoi dati azzererebbe una
  polizza registrata dallo studio.
- **La casella del riepilogo del lunedì invece è per tutti i ruoli**, quindi lì la
  precauzione non serve.
- **La polizza scaduta avvisa, non blocca.** Solo la polizza *mancante* blocca.
- **I clienti nel cestino si leggono lo stesso** per l'email e per i documenti: se hai
  buttato la scheda ma la fattura è ancora da incassare, il nome serve. È la stessa scelta
  già fatta con `_sbTutto` / `sb.raw`.
- **La lettera adesso può essere di 3 pagine** invece di 2: il blocco firme sta tutto
  insieme per l'art. 1341 c.c. e con l'articolo nuovo scivola sul terzo foglio. È il prezzo
  di un adempimento obbligatorio, non un difetto da sistemare.

## Da fare la prossima volta

1. **Lunedì 17 agosto: controllare l'email** e confrontarla col Riepilogo. Se i numeri
   tornano, aprire a tutti (`SOLO_A = null`). Attenzione: se il gestionale di Alessio non
   ha niente in scadenza, **l'email non parte** ed è il comportamento giusto — per la
   prova serve almeno una scadenza dentro i 7 giorni.
2. **Due email lo stesso lunedì.** `promemoria-scadenze.js` gira alle 6:15 tutti i giorni,
   questa alle 7:30 il lunedì: le scadenze compaiono in tutte e due. Prima di aprire a
   tutti, valutare se unirle.
3. **`COSA-MANCA-AL-GESTIONALE.md` non esiste** — Alessio l'ha cercato e non c'è. Quello
   che gli somiglia è `docs/ROADMAP-gestionale.md` (fermo al 31 luglio, numerato 0-5) più
   `BACKLOG.md`. Offerto di scriverlo, non ancora fatto.
4. **L'articolo della polizza non c'è nella conferma d'ordine** delle imprese, e va bene:
   l'obbligo dell'art. 9 riguarda i professionisti. Se un giorno si vuole mettere la RC
   dell'impresa, il riquadro dei Dati azienda va reso visibile anche agli altri ruoli.

## Lezioni

- **Provare la copia sbagliata è peggio che non provare.** La prima tornata di prove nel
  browser girava su una copia del file fatta prima delle ultime modifiche, e dava tutto
  verde su codice vecchio. Da qui in poi lo script di collaudo **ricopia il file vero e
  stampa la sua impronta** prima di partire.
- **Un difetto sul salto pagina si vede solo guardando la pagina.** Confermata la lezione
  del 10 agosto: sui PDF aprire almeno una pagina interna. Qui in più è stata scritta una
  prova che allunga la lettera riga per riga (22 varianti) finché il blocco cambia foglio,
  e controlla che titolo e dati restino sempre insieme.
- **Le trappole già annotate nel file vanno cercate, non ricordate.** Il punto delle
  migliaia era scritto a commento nel gestionale dal primo giorno, ed è stato rifatto
  uguale nella funzione nuova.
- **Chi legge le tabelle da fuori dal browser non ha il cestino.** Ogni script, funzione
  Netlify o Edge Function che tocca le `gest_*` parte senza quel filtro.
- **Istruzioni parziali producono prove parziali.** Nella prova a clic era stato messo
  l'accento solo sulla data di scadenza: Alessio ha compilato solo quella e la lettera si
  è fermata dicendo che mancavano gli altri tre. Quando si chiede di compilare un modulo,
  elencare **tutti** i campi, e avvisare che il campo Massimale accetta solo cifre
  (scrivendo `500.000` il browser lo scarta e resta vuoto).

---

# 11 agosto 2026 (pomeriggio) — I NUMERI CHE SBAGLIAVANO, E LE SPUNTE CHE NON PROTEGGEVANO NIENTE

Tornata partita da un referto (`CONTROLLO-COMPLETO-gestionale.md`) che **non esiste nella
cartella**: era stato prodotto altrove e mai salvato. I numeri di riga citati tornavano tutti,
sfasati di 164 righe, cioè la conta di prima del lavoro del mattino. Verificati uno per uno
prima di toccare qualsiasi cosa: **erano veri tutti e cinque**.

## 1. Un solo posto dove si legge un numero scritto a mano

`_numIt` faceva una cosa sola: virgola → punto. Ma `_numIt` legge anche i **prezzi**
(`#cv-prezzo` della lavorazione e `#pz-prezzo` del prezzario), non solo le misure. Quindi:

    scrivi 1.250,00  ->  salvava 1,25
    scrivi 1 250,00  ->  salvava 1

Un computo da 12.500 € usciva da 12,50, in silenzio, fino a quando lo guardava il cliente.

Adesso c'è **`_numeroIt(testo)`**, in un posto solo, usata sia da `_numIt` sia da `_pzNum`.
La regola: **l'ultimo fra virgola e punto è quello dei decimali, tutti gli altri sono
migliaia**. Più due dettagli che sembrano pignoleria e non lo sono:

- un punto solo con **3 cifre dopo** = migliaia (`1.250` → 1250), **tranne** se prima del
  punto c'è uno zero (`0.500` → 0,50: dopo lo zero non esistono migliaia);
- **più di una virgola** e nessun punto = migliaia all'inglese (`1,250,000`).

## 2. `_pzCol` — l'ordine dei controlli contava, ed era sbagliato

L'unità di misura veniva cercata **prima** del prezzo, e cercava la parola `unit`: la colonna
**«Prezzo unitario»** finiva presa per la colonna dell'unità di misura.

**Il difetto era condizionale, e me ne sono accorto solo facendolo girare.** Se nel file la
colonna U.M. viene *prima*, `C.unita` è già occupata e il prezzo si trova lo stesso. Il buco
si apre solo quando «Prezzo unitario» precede U.M., **o quando la colonna U.M. non c'è**: lì
il prezzo non si trova più e si importa un prezzario intero con tutti i prezzi a zero.
Nel messaggio ad Alessio l'avevo dato per sempre: corretto subito.

Adesso il prezzo si cerca prima, l'unità di misura **rifiuta** un'intestazione che parla di
soldi (`prezzo|importo|costo|euro|valore`), e `Cod.` abbreviato viene riconosciuto (prima si
cercava `codic`, cinque lettere).

## 3. `todayStr()` — l'orologio di Greenwich faceva vivere ieri

`new Date().toISOString().slice(0,10)` dà la data UTC. In Italia d'estate, **fra mezzanotte e
le due**, il gestionale era al giorno prima: una scadenza segnata all'una di notte nasceva
già di ieri, un lavoro di oggi risultava "in ritardo", e la lettera d'incarico stampava la
data sbagliata sul foglio che firma il cliente. Ora legge l'orologio locale, come faceva già
`_giorniDopo`.

## 4. Il calendario che non cambiava mese

`cal.setMonth(cal.getMonth()-1)`: dal 31 marzo chiede il "31 febbraio", che non esiste, e
finisce al 3 marzo. Premevi la freccia e restavi nello stesso mese. In avanti, dal 31 gennaio,
**saltava febbraio di netto**. Adesso ci si sposta sempre al **primo** del mese
(`new Date(y, m±1, 1)`), che tutti i mesi hanno, e l'anno cambia da solo. Si vedeva solo nei
giorni 29, 30 e 31: per questo sembrava capitare a caso.

## 5. IL BUCO GROSSO — le spunte dei permessi non proteggevano niente

**Non era ricostruibile dai file**: le policy RLS e `gest_membri` non stanno in `sql/`, vivono
solo su Supabase. Invece di provare regole inventate (l'errore del 9 agosto), sono state
scritte **due query di sola lettura** per Alessio — `CONTROLLO-permessi-collaboratori.sql` e
`CONTROLLO-collegamenti-tabelle.sql` — e lui ha incollato il risultato. Da lì lo schema di
prova è stato ricostruito **dai dati veri**.

Cosa dicevano le regole vere:

    gest_puo_accedere(impresa) = sei il titolare OPPURE sei un collaboratore 'attivo'

**Non nomina le spunte.** E le policy `*_team_read` dicevano tutte la stessa cosa. Nella app
del dipendente le spunte fanno **solo** `classList.toggle("hidden", ...)`: nascondono i
pulsanti del menu, i dati restano.

Provato su PostgreSQL 16 con quelle regole e `auth.uid()` pilotabile — collaboratore attivo
con spuntato **solo «Lavori»**:

| tabella | doveva | leggeva |
|---|---|---|
| lavori | sì | sì |
| clienti (nome, indirizzo, telefono, email, P.IVA) | **no** | **sì, tutti** |
| fatture + righe (gli importi) | **no** | **sì, tutte** |
| pagamenti | no | no (unica chiusa, e per caso: non ha policy di team) |

**La correzione**: `sql/gest-permessi-collaboratori.sql`. Funzione nuova
`gest_puo_sezione(impresa, sezione)` che guarda davvero la spunta, e le policy di lettura dei
collaboratori riscritte per usarla. Mappa: `clienti`→gest_clienti · `fatture`→gest_fatture +
righe + fattura_lavori · `lavori`→gest_lavori + lavoro_mezzi + mezzi + rifornimenti ·
`calendario`→gest_scadenze · `note`→gest_note (**due** policy sovrapposte, sistemate
entrambe: se no la più larga vince) · `foto`→gest_foto + gest_video.

Le **carte prepagate** non usano una spunta: adesso un collaboratore vede solo **la propria**
(`dipendente_id = m.operatore_id`), che è lo stesso criterio che la regola di scrittura usava
già. Prima leggeva i movimenti delle carte di tutti.

Eseguito su Supabase l'11 agosto: verificato con una query che tutte e 9 le policy sono
quelle nuove.

## Punti verificati e risultati NEGATIVI (tenuti per non rifarli)

- **Il capitolo del computo cancellato**: *falso allarme*. `capitolo_id` è `on delete set
  null`, le viste `gest_computo_voci_calc` / `gest_computo_totali` non toccano i capitoli, e
  sia la schermata sia il PDF hanno già il gruppo «Senza capitolo». Provato: 3 lavorazioni e
  3.700 € prima, 3 lavorazioni e 3.700 € dopo, misure intatte.
- **Mezzi e carte fuori dal Cestino**: *funziona*. Mezzo con 2 pieni + 1 collegamento a lavoro
  + 1 scadenza, carta con 2 movimenti: se ne vanno tutti col padre, e lavoro, cliente e
  fattura restano.

## Le scelte che non vanno ribaltate senza pensarci

- **Una sola funzione per leggere i numeri.** `_numIt` e `_pzNum` chiamano `_numeroIt`. Non
  rimetterne una seconda copia: è esattamente il difetto che si era annidato qui.
- **`gest_puo_accedere` resta**, non è stata toccata: la usano ancora `mestieri_read` e
  `operatori_read`, che devono restare aperte o la app del dipendente non si apre proprio.
- **La polizza scaduta avvisa, non blocca. Le spunte invece bloccano.**
- **Il file dei permessi ha in fondo il blocco per tornare indietro**, commentato. Se un
  collaboratore resta fuori, si rimette tutto com'era in un Run.

## Da fare la prossima volta

1. **`gest_operatori` è l'ultima tabella aperta**: un collaboratore attivo legge telefono,
   codice fiscale, data di nascita, documento e **costo orario** di tutta la squadra. Non c'è
   una spunta per questo e non è stata toccata di iniziativa propria. Va chiusa, ma serve
   decidere prima cosa deve restare visibile (probabilmente solo nome e mansione).
2. **`gest_redeem_invito` è SECURITY DEFINER e accetta qualsiasi codice valido**: il codice
   è `sbRand()`, 6 caratteri base36 (~2,2 miliardi). Non è un buco aperto, ma non c'è nessun
   limite ai tentativi. Da guardare quando i collaboratori diventano tanti.
3. **Provare la app del dipendente vera** con un secondo account: le prove dei permessi sono
   state fatte sul database, non nella `gestionale-operatore.html`.
4. Il referto `CONTROLLO-COMPLETO-gestionale.md` **non esiste nella cartella**: della PARTE 3
   sono stati sistemati solo i punti 1-3, quelli riportati a mano nel messaggio.

## Lezioni

- **Quando le regole non stanno nei file, non si indovinano: si chiedono.** Due query di sola
  lettura, cinque minuti di Alessio, e lo schema di prova è diventato quello vero. Con regole
  inventate la prova avrebbe *assolto* un buco che c'era.
- **Anche lo schema di prova va provato.** La prima ricostruzione non aveva le policy del
  computo: il caso «cancellare il capitolo di un altro account» risultava permesso, e non era
  vero. Un test che gira come superutente **salta l'RLS senza dirlo**: bisogna sempre
  `set role authenticated`.
- **Un difetto condizionale va raccontato come condizionale.** «Tutti i prezzi a zero» era
  vero solo per certi ordini di colonne. Detto male, si perde fiducia in tutto il resto.
- **La correzione va rotta apposta.** La prima versione di `gest_puo_sezione` convertiva la
  spunta con `::boolean`: con un valore storto (`"forse"`) andava in **errore**, cioè rompeva
  la lettura invece di negarla. Ora confronta e basta, senza conversioni.
- **pg_safeupdate non si compila nel container** (mancano gli header di PostgreSQL, apt non
  li scarica). Dichiarato nella scheda di collaudo invece di far finta: al suo posto,
  controllo a mano che non ci siano `delete`/`update` senza `where`.

## 11 agosto 2026 (sera) — chiusa anche gest_operatori

L'ultima tabella rimasta aperta, quella segnata come "da fare la prossima volta" poche ore
prima. `operatori_read` diceva `gest_puo_accedere(user_id)`: un collaboratore attivo leggeva
**tutte** le schede della squadra, e dentro una scheda ci sono telefono, email, codice
fiscale, data di nascita, documento, visita medica, contatto di emergenza, tipo di contratto
e **costo orario**. Cioe' quanto l'impresa paga ogni persona, saputo da tutti.

**Prima di scrivere la regola e' stato letto il codice**, ed e' stata la cosa che ha fatto la
differenza: `gestionale-operatore.html` legge `gest_operatori` in **un punto solo** e chiede
soltanto il **proprio** nome (`select nome ... eq("id", MIO.operatoreId)`). Tutte le altre
letture stanno in `gestionale-app.html`, cioe' nel pannello del titolare, gia' filtrate sul
suo `user_id`. Quindi si poteva stringere al massimo senza rompere niente: **un collaboratore
vede solo la propria scheda**. Nessuna modifica alle pagine.

`sql/gest-operatori-scheda-privata.sql`. Provato sullo schema vero: prima il collaboratore
Mario leggeva anche `Giuseppe Collega · 3405556677 · VRDGPP75B02H501X · 26 €/h`, dopo vede
solo se stesso; il titolare vede tutti e due come prima; la lettura che fa la app del
dipendente funziona ancora. Rifiutati: estraneo, collaboratore sospeso, collaboratore attivo
senza scheda collegata, collaboratore che prova a cambiarsi il costo orario, collaboratore
che prova a collegarsi alla scheda di un collega.

**Le colonne non si nascondono una per una**: o si legge la riga o non si legge. Non esiste
un "vede il nome ma non il costo orario" senza una vista apposta. Se un giorno serve la
**rubrica della squadra** (nome e telefono dei colleghi, per chiamarsi in cantiere), si fa
una vista con dentro solo quelle due colonne: una funzione decisa, non una porta lasciata
aperta.

Con questo il giro dei permessi e' chiuso: nessuna tabella `gest_*` lascia piu' leggere a un
collaboratore roba che non gli spetta.

---

# 11 agosto 2026 (sera, 2) — IL COMPUTO METRICO È CONSEGNABILE: TRE DIFETTI SUL PDF

Domanda di Alessio: «il computo metrico è pronto? posso dire usatelo?». Risposta trovata
costruendo un computo vero (3 capitoli, lavorazioni con misure e detrazioni, ribasso 10%,
oneri della sicurezza), aprendolo nel gestionale e **generando davvero il PDF**.

**A schermo i conti erano già giusti** e coerenti fra elenco, scheda e vista del database.
Tutti e tre i difetti stavano nel **PDF**, cioè nell'unica cosa che finisce in mano al
cliente o al Comune.

## 1. ⚠️ IL METRO QUADRO CHE DIVENTAVA METRO — la trappola da ricordare

`m²` usciva stampato **`m`**, `m³` usciva **`m`**. jsPDF con l'helvetica **non sa disegnare
gli esponenti e invece di sbagliare li butta via in silenzio**.

Provato in isolamento, e questa è la parte che serve sapere:

    €  ->  stampa benissimo
    °  ->  stampa benissimo
    è ò à  ->  stampano benissimo
    ²  ³  ->  SPARISCONO

In un computo metrico è il difetto peggiore possibile: 73 metri quadri di intonaco e 73
metri lineari di cornice sono due lavori e due prezzi diversi, e sulla carta si leggevano
identici. E `UNITA` (riga ~9705) offre `m²` e `m³` come prime due voci: capita quasi sempre.

**Correzione**: `_umPdf(u)` accanto a `eurPdf` (riga ~6391) — `m²`→`mq`, `m³`→`mc`, e
qualsiasi altro esponente in cifra normale. Usata nel PDF del computo e nella descrizione
che `computoAPreventivo` scrive nel preventivo. A schermo restano m² e m³.

**REGOLA GENERALE: qualsiasi testo scritto in un PDF passa da `_umPdf` se può contenere
un'unità di misura.** Vale per i PDF futuri, non solo per il computo.

## 2. Il riquadro dei totali non tornava con la calcolatrice

    Totale dei lavori                            8.468,05
    Oneri sicurezza (non soggetti a ribasso)        75,00
    Ribasso 10%                                -   839,31
    TOTALE                                       7.628,74

Chi lo riceve somma e trova 7.703,74: **75 euro in più**. Il TOTALE era quello giusto — gli
oneri sono GIÀ DENTRO il totale dei lavori — ma stampati così sembravano una somma. A
schermo era scritto bene («**di cui** oneri della sicurezza»); nel PDF quel «di cui» non
c'era. Su un computo per una gara è la prima cosa che ti fanno rispiegare.

Adesso le righe si sommano nell'ordine, e il conto torna riga per riga:

    Totale dei lavori                            8.468,05
    a dedurre oneri della sicurezza            -    75,00
    Importo soggetto a ribasso                   8.393,05
    Ribasso 10%                                -   839,31
    Oneri della sicurezza, non ribassabili     +    75,00
    TOTALE                                       7.628,74

Sui lavori privati (niente oneri) il riquadro resta a due righe più il totale.
La colonna dell'etichetta è passata da 56 a **62 mm**: con 56 la riga più lunga andava a
capo e finiva stampata sopra quella sotto.

## 3. La quantità zero diventava uno nel preventivo

Una lavorazione inserita ma non ancora misurata vale 0 € nel computo. Ma il preventivo,
**in tutti e dieci i punti dove fa i conti**, scrive `(+r.qta||1)`: lo zero viene letto come
"non scritto" e diventa 1. La riga arrivava al cliente a 1 × prezzo unitario — una voce da
1.850 €/corpo gonfiava il preventivo di 1.850 €, e nel PDF compariva pure «1» nella colonna
quantità, come se fosse voluto.

**Il `||1` del preventivo non si tocca**: serve alle righe scritte a mano, dove lasciare la
quantità vuota vuol dire "una". Si è sistemato in `computoAPreventivo`, dove si sa che 0 vuol
dire "non ancora misurata": avvisa con un gconfirm che dice quante sono e perché, e non le
porta. Se il computo è tutto misurato non disturba.

## 4. L'ultima pagina sporca (venuta via con la #2)

Dopo `chiudiCorpo()` il codice chiamava ancora `spazio()`, che chiama `nuovaPagina()`, che
**richiude la tabella una seconda volta** (righe verticali tirate giù nel vuoto), scrive
«A riportare» quando non c'è più niente da riportare, e apre il foglio dopo stampando
**l'intestazione di una tabella vuota** più un «Riporto». Riepilogo e totali finivano
stampati là sotto.

Aggiunto **`spazioFuoriTabella(h)`**: se non ci sta, volta pagina e basta. Da usare in tutto
quello che viene dopo `chiudiCorpo()`.

## Un sospetto verificato ed ERRATO — tenuto per non rifarlo

Il commento a riga ~10872 dice che jsPDF non sa scrivere il simbolo **€** e che per questo
altrove si scrive «EUR». **Non è vero**: provato, l'euro esce perfetto. Se non lo si
controllava si sarebbe "corretto" qualcosa che funziona. Il commento resta lì e va letto con
questa nota accanto: il problema erano gli **esponenti**, non l'euro.

## Cosa NON è stato toccato, ma è stato trovato

Segnalato ad Alessio e lasciato lì. In ordine di quanto peserà:

1. **Duplicare un computo** — il più richiesto in assoluto. Due appartamenti uguali si
   ribattono da capo. Non esiste nessuna azione `comp-dup`.
2. **Rinominare un capitolo**: si può solo cancellare, e cancellandolo tutte le lavorazioni
   finiscono «senza capitolo» e vanno riassegnate una per una dalla tendina.
3. **Spostare una lavorazione su/giù**: `ordine` si scrive alla creazione e non si cambia
   più. Una voce dimenticata resta in fondo per sempre.
4. **IVA / quadro economico**: il computo non ha aliquota, il preventivo sì.
5. **Analisi prezzi** ed **elenco prezzi unitari** in appendice: su un lavoro pubblico li
   chiedono.
6. **Esportazione in Excel**: `caricaXLSX()` c'è già in casa per l'importazione.
7. **Unità di misura dei prezzari importati**: `ppUsa` (riga ~10141) applica l'unità solo se
   combacia esattamente con la lista `UNITA`. I prezzari regionali scrivono `mq`, `mc`, `ml`,
   `cad.` — quindi le voci importate arrivano **senza unità**, e riaprendo la voce e
   premendo Salva l'unità viene scritta a null. Da guardare insieme al punto 5.
8. **Sospetti non verificati**: da quante voci in su PostgREST comincia a tagliare le righe
   senza dirlo (misure del PDF, `gest_computo_voci_calc`, `gest_computo_totali`); il ribasso
   scritto con la virgola in un campo `type=number`; `ppSalva` che può sovrascrivere il
   prezzo della tariffa di un'altra Regione perché cerca per descrizione+codice senza
   filtrare la `fonte`.

## Lezioni

- **Il PDF si guarda, sempre.** Nessun controllo automatico avrebbe trovato il quadratino
  che sparisce: il testo dentro il file PDF conteneva `m²` regolarmente — è il **disegno**
  che perdeva l'esponente. Bisogna aprire la pagina e leggerla con gli occhi.
- **Un riquadro di totali deve tornare con la calcolatrice, non solo essere giusto.** Il
  numero finale era corretto: era la sequenza delle righe a essere impossibile da verificare.
  Per un documento che qualcun altro controlla, le due cose sono ugualmente importanti.
- **Prima di correggere un sospetto, provare a smentirlo.** Sull'euro il sospetto era scritto
  nel codice stesso, e sarebbe stato naturale fidarsi.

---

# 11 agosto 2026 (sera, 3) — COMPUTO: DUPLICA E RINOMINA CAPITOLO

I primi due buchi della lista «cosa manca», chiusi subito dopo il controllo.

## Duplicare un computo — `compDuplica(id)`

Il pulsante **⧉ Duplica** sta nelle azioni della scheda, accanto a PDF ed Elimina
(`compVoci()`), e il dispatcher lo manda su `comp-dup`.

**Le due scelte, decise con Alessio:**

- **Le misure si chiedono ogni volta.** Un `gconfirm` con SÌ/NO spiegati: SÌ = copia
  identica (il secondo appartamento uguale), NO = capitoli, lavorazioni, prezzi e unità ma
  quantità a zero (stesso lavoro su un edificio diverso). Se di misure non ce n'è nessuna la
  domanda non si fa e si chiede solo conferma.
- **Cliente sì, pratica no.** Due appartamenti dello stesso condominio hanno lo stesso
  cliente ma non lo stesso lavoro: due computi agganciati alla stessa pratica farebbero
  contare doppio nel Riepilogo. `lavoro_id` e `preventivo_id` restano vuoti.

La copia nasce sempre **in bozza, con la data di oggi e il numero VUOTO**: un numero inventato
sarebbe un doppione, e datarla come l'originale sarebbe una bugia sul foglio. Finito, apre
subito la copia, perché la prima cosa che si fa è cambiarle il titolo.

**Il punto dove è più facile sbagliare** è riattaccare le lavorazioni al capitolo giusto
*della copia*. Si tiene una mappa vecchio→nuovo, riappaiata per **ordine + titolo** e non
fidandosi dell'ordine in cui l'insert restituisce le righe (non è garantito da nessuna parte,
e sbagliare qui vuol dire lavorazioni finite nel capitolo sbagliato senza accorgersene).
Le misure si scrivono **a blocchi di 200**, come fa l'importazione del prezzario.

### ⚠️ IL DIFETTO TROVATO NELLA CORREZIONE STESSA — vale per tutto il gestionale

Il ripiego («se salta a metà, butto via la copia incompleta») **non funzionava**:

    sb.from("gest_computi").delete()...

`js/cestino.js` intercetta ogni `delete` sulle tabelle del cestino e la trasforma in una
data. Quindi la copia mezza fatta **non spariva: finiva NEL CESTINO**, con dentro i capitoli
e senza le lavorazioni, come se l'avesse buttata l'utente.

Adesso passa dalla **porta di servizio**:

    (sb.raw?sb.raw("gest_computi"):sb.from("gest_computi")).delete()...

**REGOLA: quando si annulla qualcosa che abbiamo appena creato noi, si usa `sb.raw`.** Il
cestino serve a proteggere quello che l'utente ha fatto, non a conservare i nostri scarti.
Trovato facendo guastare il database apposta a metà copia — non leggendo il codice.

## Rinominare (e rinumerare) un capitolo

Prima un capitolo si poteva **solo cancellare**: per un refuso nel titolo bisognava
eliminarlo (e tutte le sue lavorazioni finivano «senza capitolo»), rifarlo, e riaprire una
per una le lavorazioni per riassegnarle dalla tendina. Su un computo da sessanta voci: un
pomeriggio.

Adesso la riga grigia del capitolo si clicca (`comp-cap-edit`) e diventa **Numero + Titolo**
già pieni, con Salva e Annulla. Stato nuovo: `compCapEdit` (id del capitolo in modifica),
azzerato insieme a `compCapNuovo` quando si apre un computo.

**Il numero c'è insieme al titolo di proposito**: il gestionale numera i capitoli con
`max(ordine)+1`, quindi cancellato il capitolo 2 di 3 il prossimo nasce «4» in un computo che
di capitoli ne ha tre. Adesso si corregge a mano. Il numero si può anche **svuotare**
(diventa null, non la stringa "null").

Le lavorazioni **non si muovono**: è lo stesso capitolo, cambia solo come si chiama. È il
controllo su cui si è insistito di più nelle prove.

## Cosa resta della lista «cosa manca al computo»

Fatti: duplicare un computo, rinominare/rinumerare un capitolo.
Restano, in ordine di quanto verranno chiesti:

1. **Spostare una lavorazione su/giù** — `ordine` si scrive alla creazione e non si cambia
   più. Una voce dimenticata resta in fondo per sempre.
2. **Duplicare una singola lavorazione** con le sue misure (stessa parete su tre piani).
3. **IVA / quadro economico** — il computo non ha aliquota, il preventivo sì.
4. **Analisi prezzi** ed **elenco prezzi unitari** in appendice al PDF.
5. **Esportazione in Excel** (`caricaXLSX()` c'è già in casa per l'importazione).
6. **Unità di misura dei prezzari importati** — `ppUsa` applica l'unità solo se combacia con
   la lista `UNITA`, e i prezzari regionali scrivono `mq`/`mc`/`ml`/`cad.`: le voci importate
   arrivano senza unità, e un Salva successivo la scrive a null.

## Da guardare, se dà fastidio

Sotto **ogni** capitolo compare la scritta «clicca per rinominare». Su un computo con dieci
capitoli si ripete dieci volte. È stata lasciata per farlo scoprire; se Alessio la trova
rumorosa, si mostra solo al passaggio del mouse (ma attenzione: al tocco, sul telefono,
l'hover non esiste — servirebbe comunque qualcosa di visibile).

## Lezioni

- **Il ripiego va provato rompendo qualcosa apposta.** «Se salta a metà pulisco» è la classica
  riga che nessuno esegue mai in un test normale: bisogna far fallire il database di
  proposito. Nel finto Supabase basta far rispondere 400 a una tabella scelta.
- **Un finto database che SCRIVE trova cose che uno in sola lettura non vede.**
  `/root/prova/scrivibile.py`: insert con id generato, delete con la catena, e — cosa che era
  sfuggita — la risposta a `.single()` deve essere UN OGGETTO, non una lista, se no
  supabase-js va in errore DOPO che la riga è stata scritta.
- **Quando si copia una gerarchia, non fidarsi dell'ordine delle righe restituite**
  dall'insert multiplo: riappaiare per un dato stabile (qui ordine + titolo).

# 11 agosto 2026 (sera, 4) — COMPUTO: SPOSTARE UNA LAVORAZIONE SU E GIÙ

Era il punto 1 della lista «cosa resta» scritta due ore prima. Adesso è fatto.

## Il problema, in una riga

`ordine` si scriveva alla creazione della voce e non si toccava più. Una lavorazione
dimenticata restava in fondo al suo capitolo **per sempre**, e l'unico modo di rimetterla al
posto giusto era cancellarla e riscriverla — perdendo tutte le sue misure. Un computo si
controlla contro i disegni seguendo l'ordine: se l'ordine non si tocca, non si controlla.

## Cosa si vede adesso

Ogni riga di lavorazione ha due frecce, ↑ e ↓, prima della ×. Compaiono **solo se il capitolo
ha più di una lavorazione**. In cima la ↑ è spenta, in fondo la ↓: spente si vedono lo stesso
(`opacity:.25`), così i pulsanti non ballano da una riga all'altra.

Le frecce spostano **dentro il capitolo**. Per cambiare capitolo si apre la lavorazione e si
sceglie dalla tendina: sono due gesti diversi, e tenerli separati evita di spostare una voce in
un altro capitolo per sbaglio.

## Il codice — `compVoceSposta(id, verso)`, righe ~9934

`verso` = −1 in su, +1 in giù. La parte che conta è **come si riscrive `ordine`**, e perché non
basta scambiare due numeri:

- `ordine` è dell'**intero computo**, non del capitolo. Si prendono i numeri che il gruppo ha
  GIÀ, si rimescolano le voci nell'ordine nuovo e si **ridistribuiscono gli stessi numeri**:
  così il gruppo non invade lo spazio degli altri capitoli e non nascono doppioni.
- Se due voci avessero per sbaglio lo stesso numero (computi vecchi), scambiarli non farebbe
  niente e il pulsante sembrerebbe rotto → in quel caso si **rinumera** il gruppo da `min` in
  poi prima di ridistribuire. Provato: due voci a `ordine=3` diventano 3 e 4 e si spostano.
- Si scrive **solo** quello che cambia (`daScrivere`), con `.eq("user_id",sbUid).select("id")`:
  se torna zero righe modificate lo dice invece di far finta di aver spostato.

Nel `render`: `rigaVoce(v,i,tot)` + `bottoneFreccia(v,verso,primo,ultimo)`; il gruppo si disegna
con `g.voci.map((v,i)=>rigaVoce(v,i,g.voci.length))`.

Dispatcher (righe ~11951):

    if(a==="comp-voce-su")return compVoceSposta(id,-1);
    if(a==="comp-voce-giu")return compVoceSposta(id,1);

## ⚠️ La freccia spenta è `disabled`, non «senza azione»

La riga della lavorazione ha lei stessa `data-action="comp-voce"`. Un bottone senza azione
lascia **rimbalzare il click sulla riga**: cliccavi la ↑ della prima voce e ti si apriva la
lavorazione. Con `disabled` il click non parte proprio e non bulla. Provato apposta:
«e non apre per sbaglio la lavorazione».

## Provato con `/root/prova/sposta.py` — 25 controlli, tutti verdi

Finto Supabase che scrive davvero (`scrivibile.py`), computo con 3 capitoli da 1, 2 e 3
lavorazioni:

- frecce assenti nel capitolo da una voce sola; ↑ spenta sulla prima, ↓ spenta sull'ultima,
  vive in mezzo; le spente non hanno azione appesa
- ↓ sposta e **l'ordine cambia nel database**; ↑ la riporta esatta dov'era
- dal fondo alla cima un passo alla volta, e le frecce si spengono di conseguenza
- misure, importi, capitolo di appartenenza e **totale del computo** invariati
- l'unica tabella scritta è `gest_computo_voci`
- il caso RIFIUTATO: la ↑ della prima non fa niente, **non scrive** e non apre la lavorazione
- ordini duplicati nel database → rinumera invece di bloccarsi
- il resto del computo funziona ancora (nuova lavorazione, riapertura, click sulla riga)

Regressione: `collaudo.py` 39/39, `dup.py`, `rinomina.py`, `qzero.py` tutti verdi, `computo.py`
genera il PDF senza errori JS.

## Il nuovo ordine arriva anche sul PDF e sul preventivo

Verificato che tutte e tre le letture di `gest_computo_voci_calc` che contano sono
`.order("ordine")`: la schermata (riga ~9796), il PDF (~11033) e `computoAPreventivo` (~10933).
Sposti a schermo, esce spostato dappertutto.

## Una cosa imparata sul finto Supabase

`scrivibile.py` **non ordinava**: rispondeva nell'ordine in cui le righe stanno nella lista
Python. Una prova sull'ordine, lì sopra, non valeva niente — avrebbe detto «ok» comunque.
Adesso onora `order=campo.desc` come PostgREST. Regola generale: **il finto database deve
sbagliare dove sbaglia quello vero, e ordinare dove ordina quello vero**, se no il collaudo
misura il finto.

## Cosa resta della lista

Il punto 1 è chiuso. Restano: duplicare una singola lavorazione con le misure; IVA / quadro
economico; analisi prezzi ed elenco prezzi unitari; esportazione in Excel; unità di misura dei
prezzari importati (`ppUsa`).

## Da guardare, se dà fastidio

In un capitolo con una lavorazione sola le frecce non ci sono, quindi la × di quella riga sta
un po' più a destra delle altre. Si nota solo se i capitoli si guardano uno sotto l'altro.

# 11 agosto 2026 (sera, 5) — GLI AIUTI: UNO DICEVA UNA BUGIA, TANTI NON DICEVANO NIENTE

Segnalato da Alessio guardando lo schermo: «dove vedi il tooltip dice una cosa sbagliata, quel
bottone serve per i clienti che fanno delle richieste… poi in alcuni bottoni mancano proprio le
indicazioni».

## 1. ⚠️ IL TOOLTIP CHE PROMETTEVA UNA COSA CHE IL PULSANTE NON FA

`js/aiuti.js`, chiave `richieste`:

    richieste: 'Le richieste di preventivo che arrivano dai clienti di TrovaImpresa.'

La sezione però si chiama **«Cosa ti manca?»** ed è la cassetta dei suggerimenti verso di noi:
l'utente scrive cosa gli serve e glielo costruiamo. Il `data-tab` è rimasto `richieste` da
quando quella sezione faceva un'altra cosa; la frase non è mai stata aggiornata.

Adesso: *«Manca qualcosa nel gestionale? Scrivilo qui: la richiesta arriva a noi, la leggiamo e
la costruiamo.»* — combacia con l'intro della sezione stessa (verificato nella prova).

**Da ricordare:** un aiuto sbagliato è peggio di nessun aiuto, perché promette una funzione che
non esiste. Se un `data-tab` viene riusato per un'altra cosa, la sua chiave in `aiuti.js` va con
lui.

## 2. Cinque voci di menu su diciannove non dicevano niente

Mancavano del tutto in `AIUTI_TAB`: **fornitori, computi, prezzario, crediti, cestino** — cioè
tutte quelle aggiunte dopo che il file era stato scritto. Aggiunte.

## 3. Le stesse voci, dette a uno studio tecnico — `AIUTI_TAB_STUDIO`

Col ruolo `professionista` il menu si rinomina da solo (Attrezzature→Strumenti,
Squadra→Collaboratori, Lavori→Pratiche) ma **gli aiuti restavano quelli dell'impresa edile**:
un geometra sotto «Strumenti» leggeva *«Betoniere, ponteggi, utensili»*.

Aggiunte due mappe parallele, `AIUTI_TAB_STUDIO` e `AIUTI_AZIONE_STUDIO`, con dentro **solo** le
voci che cambiano davvero (7 + 6): per tutte le altre continua a valere la frase unica.

⚠️ **`ruoloUtente` non è leggibile da `aiuti.js`** — è un `let` chiuso dentro lo `<script>` della
pagina, non sta su `window`. Invece di aprirlo (accoppiamento inutile) il ruolo si riconosce
**da come si chiama la voce a schermo**:

    function menuDaStudio(){
      var s=document.querySelector('[data-tab="attrezzature"] span');
      return !!(s && s.textContent.trim()==='Strumenti');
    }

## 4. ⚠️ Il testo c'era già e non lo leggeva nessuno

`AIUTI_TESTO` conteneva da mesi le spiegazioni di «Emetti», «Lettera d'incarico»,
«Accettato → crea lavoro», «Elimina per sempre», «Rimetti a posto», «Segna fatto», «Avvia»…
ma quella lista veniva consultata **solo** per le etichette dei form, i totali e la fila di
pulsanti delle card. Passando il mouse sul pulsante vero non compariva niente.

Una riga in fondo a `testoDi()`:

    return testoPerParola(el.textContent);

e `pulisci()` che toglie i simboletti **davanti** alla scritta («✕ Rifiutato», «⧉ Duplica»,
«👁 Apri scheda», «‹ Indietro»):

    .replace(/^[^a-z0-9à-ÿ]+/, '')

Solo davanti: dentro no, se no si rompe la chiave `accettato → crea lavoro`.

## 5. Pulsanti nuovi spiegati (18) e uno lasciato apposta

Aggiunti: `new-forn`, `new-fattf`, `new-fattf-forn`, `new-computo`, `new-prezzo`, `new-cred`,
`gal-nuovo`, `save-richiesta`, `cerca-azzera`, `pz-vai`, `pz-importa`, `edit-computo`,
`comp-dup`, `comp-pdf`, `del-computo`, `prev-pdf`, `edit-prev`, `del-prev`, `apri-cli`,
`del-cli`, `map`, `incarico-pdf`, `verbale-pdf`, `ordine-pdf`, le tre frecce del calendario
(`cal-prev`/`cal-next`/`cal-today`, che a schermo sono solo «‹ › •»), e `data-aiuto` sul
pulsante **Aiuto** della barra in alto (non aveva `data-action` a cui agganciarsi).

⚠️ **NON è stato aggiunto `new-cli`.** Quei pulsanti hanno già un `title` loro, diverso per
Privato / Azienda / Condominio — e `aiuti.js` il `title` lo TOGLIE quando trova una frase
propria (`el.dataset.titleOff = el.title; el.removeAttribute('title')`, e non lo rimette mai).
Aggiungendo la chiave avremmo perso la distinzione. C'è una prova apposta che lo controlla.

## 6. Un difetto trovato per strada: il filtro della Mappa mezzo tradotto

Sulla Mappa, da professionista, si leggeva **«Pratiche da fare»** accanto a **«Tutti i lavori»**.
`'Tutti i lavori'` non era in `_FRASI`. Aggiunta **dopo** `'Tutti i lavori del reparto'`, che è
più lunga e deve vincere (l'elenco si applica in ordine).

## Provato con `/root/prova/aiuti.py` — 18 controlli, tutti verdi

Passa il mouse su **ogni** voce del menu e su ogni pulsante della barra, come studio e come
impresa, e stampa cosa compare. 19 voci su 19 parlano da professionista, 18 su 18 da impresa.
Più `/tmp/censimento.py`, che gira tutte le sezioni e elenca i pulsanti ancora muti.

## ⚠️ Due trappole della prova, non del gestionale

- **`aiuti.js` nasconde il riquadro a ogni scroll** (giusto, se no resta appeso) e
  `page.hover()` scorre da solo: gli eventi di scorrimento arrivavano DOPO il passaggio del
  mouse e spegnevano l'aiuto delle ultime voci del menu. Si scorre prima, e si aspetta.
- **Dopo uno scorrimento la voce può finire proprio sotto al puntatore fermo**, e allora
  `mouseover` non riparte: entrare in un elemento è un evento, restarci dentro no. Nella prova
  si porta via il mouse (`page.mouse.move(1400,12)`) prima di ogni passaggio.

## Cosa resta muto, e perché va bene così

Solo i **filtri** (`lav-vista`, `prev-filtro`, `fatt-vista`, `scad-vista`, `gal-tipo`,
`gal-media`, `mp-vista`, `comp-filtro`, `attrezzo-filtro`, `ag-stato`, `cred-anno`). Dicono già
il proprio nome — «Bozze», «Scadute», «Solo foto» — e un riquadro che ripete la scritta è
rumore. Gli unici discutibili sono «Archivio» e «Da incassare» sui Lavori: se un utente ci
inciampa, si aggiungono lì.

## Regressione

`collaudo.py` 39/39, `sposta.py`, `dup.py`, `rinomina.py`, `qzero.py` tutti verdi.

# 11 agosto 2026 (sera, 6) — LE SCHEDE DELLE IMPRESE ERANO INVISIBILI SU GOOGLE

Partito da due schermate di Search Console: **663 pagine non indicizzate** contro 357
indicizzate, e la colonna grigia comparsa di colpo verso il 29 luglio. Sembrava un crollo.
Non lo era: il 20 luglio erano state pubblicate le 29 pagine professioni/negozi
(`genera-seo-pagine.js`), Google è tornato a girare tutto il sito e ha **contato** anche
quello che prima non aveva mai aperto. Il verde non è sceso.

Ma cercando la causa è saltato fuori un difetto vero, e grosso.

## 1. Il difetto: ogni scheda impresa diceva a Google di non esistere

`profilo-impresa.html` aveva il canonical **fisso**:

    <link rel="canonical" href="https://trovaimpresa.com/profilo-impresa">

Ogni scheda — `/profilo-impresa?id=46`, `?id=47`, tutte — diceva a Google: «la pagina buona
è /profilo-impresa», cioè quella vuota, senza nessuna impresa dentro. Risultato:
**nessuna vetrina degli iscritti poteva comparire nei risultati di ricerca.** Ed è
esattamente la cosa che TrovaImpresa promette all'impresa quando si iscrive.

Stessa malattia (ma voluta, e va lasciata così) sulle pagine di ricerca: i link
`?citta=X&mestiere=Y` dalle 107 pagine città puntano tutti a `/cerca-artigiani`. Sono le
~565 «Pagina alternativa con tag canonical appropriato» del rapporto.

## 2. La correzione

Uno script inline in `profilo-impresa.html`, messo **dopo** `<title>` e non prima —
il canonical sta in cima al file, prima di `<meta charset>`, e infilare lì 700 byte di
script avrebbe spinto il charset oltre il primo kilobyte, con gli accenti a rischio.

Fa tre cose:

- se `?id=` è un numero (`/^[0-9]{1,12}$/`), riscrive il canonical su sé stessa;
- se l'id manca o è sporco, aggiunge `noindex,follow`: la pagina senza impresa non ha
  niente da mostrare;
- nel ramo «risposta arrivata ma vuota» di `caricaProfilo` (scheda cancellata) aggiunge
  `noindex,follow`, con guardia `if(!document.querySelector('meta[name="robots"]'))` per
  non metterne due.

⚠️ **Il noindex NON va nel ramo dell'errore di rete.** `_profiloKo` viene chiamata anche
quando Supabase non risponde: metterlo lì significherebbe che un guasto di mezz'ora fa
uscire da Google tutte le schede buone. Provato apposta.

**Provato con Playwright su 6 casi** (server locale, chiamate a Supabase intercettate):
scheda vera → canonical con id e nessun robots; senza id → noindex; id inesistente →
noindex; id sporco `<script>` → canonical base + noindex, nessuna injection; **rete KO →
canonical con id e NESSUN noindex**; telefono 390×844 uguale. Zero errori JS, zero id
duplicati. I 9 testi sotto 13px di quella pagina c'erano già prima (confrontato con
l'originale): **non toccati**, segnalati ad Alessio.

Commit `a69f375`.

## 3. `admin.html`: mancava la porta del gestionale professionista

In «Le mie viste» la colonna Gestionali non aveva il link al professionista. Non mancava
il gestionale: è sempre `gestionale-app.html`, che alla riga 520 legge già `?vedi=` e lo
salva in `sessionStorage.ti_vedi_tipo`. Mancava solo il collegamento.

Aggiunto `/gestionale-app.html?vedi=professionista`.

⚠️ **Ho dovuto cambiare anche il link di sopra** in `/gestionale-app.html?vedi=` (con
l'uguale e niente dopo). Senza, restava incastrato: entri da professionista, torni su
«impresa e artigiano» senza parametro, e la riga 520 non tocca la sessione — quindi
continuavi a vedere «pratiche» al posto di «lavori». Il parametro vuoto **cancella**
`ti_vedi_tipo` e fa tornare il ruolo vero dell'account.

Provato estraendo le righe 520-521 verbatim e facendole girare su 5 scenari, compreso
quello che dimostra il difetto col link vecchio. Confermato poi a schermo da Alessio:
«Gestionale Studio / pratiche / collaboratori» contro «Gestionale Multiservizi / lavori /
squadra». Commit `484ab42`.

## 4. Una sbavatura segnalata e NON corretta

Riga 958: il singolare è gestito solo per il professionista —
`tot===1?'pratica totale':'pratiche totali'` — mentre per l'impresa è sempre
`'lavori totali'`. Con un lavoro solo si legge **«1 lavori totali»**. Segnalato, non
toccato: non era stato chiesto.

## 5. I numeri veri del progetto (query fatte fare ad Alessio su Supabase)

- **59 imprese iscritte**, di cui **57 negli ultimi 30 giorni**: il marketplace ha un mese.
- Sparse su **35 città**: Roma 7, Napoli 4, Torino 4, tutto il resto **una sola impresa**.
  Le 107 pagine città sono per **72** vuote — ed è quasi esattamente il numero delle
  «Rilevate ma non indicizzate» (73) del rapporto Google.
- Mestieri scritti in modo incoerente: *Idraulico* / *Idraulica*, *Edilizia / Muratura* /
  *Muratura e strutture*, *Altro* / *Altro (scrivi quale)*. Chi filtra per uno non trova
  l'altro. **Da sistemare.**

Search Console, 3 mesi: 107 clic, 4.520 impressioni, posizione media 13,9. Ma **63 clic su
107 sono query di marca** (`trovaimpresa`, `trova impresa`). Le pagine guida stanno tra
l'8° e il 10° posto con CTR 0,4-1%: il contenuto è già più completo dei concorrenti, manca
l'**autorità** (link in ingresso). Le query dove compare senza clic sono tutte «quanto
costa X»: pubblico giusto, posizione troppo bassa.

## 6. La campagna Meta: pagava tutta Italia

«Nuova campagna Contatti», 8 €/giorno, 182 € in 30 giorni, 35 registrazioni dichiarate a
5,21 €. Ma in **Luoghi** c'era `Inclusione: Italia` (pubblico stimato 8,6-10,1 milioni),
non Roma come Alessio credeva: è una campagna Advantage+ e parte larga. Ecco perché gli
iscritti erano sparsi su 35 città. Ristretta a **Roma, Lazio +40 km**.

## 7. Decisioni prese, da non rimettere in discussione a cuor leggero

- ⛔ **NON creare le 565 pagine mestiere+città.** Con 59 imprese sarebbero quasi tutte
  vuote e trascinerebbero giù anche le pagine buone. Se ne riparla con centinaia di
  iscritti per zona.
- ⛔ **NON riscrivere le guide prezzi.** Controllata `quanto-costa-cambiare-gli-infissi`:
  ha già title col prezzo, description con «casa di 100 mq», il capitolo sul totale di
  casa e la FAQ in JSON-LD. Il problema non è il contenuto.
- La strada per salire dal 9° al 4° posto sono **15-20 link veri**, e il bacino più a
  portata sono i siti delle imprese già iscritte.

## 8. Aperto

- link `/cerca-artigiani.html?...` **con il .html** dentro le 107 pagine città, mentre la
  sitemap li scrive senza: doppioni gratis per Google;
- 7 pagine 404, 5 «duplicata senza canonico», 1 bloccata da robots.txt;
- i mestieri doppi (punto 5);
- «1 lavori totali» (punto 4);
- i 9 testi sotto 13px in `profilo-impresa.html`;
- la seconda gamba: campagna rivolta ai **clienti** di Roma. I primi 3 mesi Premium
  regalati scadono **a metà ottobre**: se alle imprese non arriva nessuna richiesta entro
  allora, non rinnova nessuno.

⚠️ Nota per le prossime sessioni: dal container di Claude **non si arriva a Supabase**
(il proxy blocca `*.supabase.co`, sia da curl sia da WebFetch). Per i dati veri si preparano
query SQL pronte da incollare nel SQL Editor e le lancia Alessio.

---

# 12 agosto 2026 — CONTROLLO GENERALE DELLE 21 VOCI, E 7 TORNATE DI CORREZIONI

Giornata lunga e diversa dalle altre: non si è partiti da una richiesta («fammi
questa cosa»), ma da un **controllo di tutto il menu laterale**, voce per voce,
su **tutti e due i profili** (impresa edile e studio tecnico). Alessio ha chiesto
prima solo la ricerca — «adesso e solo ricerca, non ce fretta, fallo con calma e
accurato» — poi si è lavorato alla lista fino a chiuderla.

Le voci sono **21**, non 19 come pensava lui (mancavano all'appello Mezzi e
Attrezzature, che sono due schede separate).

---

## ⚠️ LA LEZIONE DI OGGI (leggerla prima di rifare un controllo così)

**Ai sub-agenti va data una copia COMPLETA del progetto.** Nel secondo giro di
controllo la cartella data agli esaminatori non conteneva `netlify/` né il file
SQL consegnato quella mattina. Sono usciti **due allarmi grossi e falsi**:

1. «il file `sql/gest-scadenze-ripeti.sql` non esiste» → esisteva;
2. «le email dei promemoria non le manda nessuno» → le manda
   `netlify/functions/promemoria-scadenze.js`, riga finale:
   `exports.handler = schedule('15 6 * * *', handler)` — ogni mattina alle 6:15.

Sono stati verificati a mano prima di scriverli nel rapporto, e messi **in cima**
al rapporto come errori miei. Ma un'ora di lavoro se n'è andata.

**Altri due falsi allarmi**, scoperti provando invece di credere al rapporto:

- «arrotondamenti diversi fra schermo e PDF nel Computo» → **non si riproduce**.
  Provato con due capitoli e centesimi scomodi: riepilogo dei capitoli
  1.440,32 + 5.943,55 = 7.383,87; TOTALE stampato 6.467,26; con la calcolatrice
  (7.383,87 − 51,00) × 87,5% + 51,00 = 6.467,26. E a schermo 6.467 €. Torna tutto.
- «i 7 permessi dei collaboratori scritti e mai letti dal JS» → **sbagliato a
  metà**: `gestionale-operatore.html` ne leggeva **tre** (lavori, clienti,
  fatture). Erano le altre quattro a non fare niente.

Morale: il rapporto di un controllo è una lista di **sospetti**, non di fatti.
Ogni riga va riprodotta prima di toccare il codice.

---

## LE COSE PIÙ GRAVI TROVATE E CHIUSE

### 1. I numeri con la virgola sparivano (la più grossa di tutte)
Dieci caselle erano `type="number"`. Su tastiera italiana si scrive «12,5»: una
casella di quel tipo con la virgola dentro **non restituisce niente**, e il
numero spariva senza un messaggio.

```
scritto            prima      dopo
q.tà 2,5        →   1     →   2,5
prezzo 1.250,50 →   0     →   1250,50
sconto 12,50    →   0     →   12,50
ribasso 12,5    → (niente)→   12,5
```

Erano **quantità e prezzo di ogni voce di fattura e preventivo** (le caselle più
battute del gestionale), sconto, bollo, spese e ritenuta della fattura, importo e
ore del lavoro, spese del preventivo, importo del movimento carta, euro e litri
del rifornimento, ribasso del computo.

Adesso sono `type="text" inputmode="decimal"` (sul telefono esce lo stesso il
tastierino numerico), lette da `_numIt` / `_numRiga`, e il numero torna nella
casella **scritto con la virgola** (`_numTesto`).

### 2. I moduli che si aprivano vuoti e poi cancellavano i dati
`aziendaForm`, `fattForm` e `prevForm` leggevano dal database **senza guardare
l'errore**: se la lettura falliva il modulo si apriva vuoto, e il Salva scriveva
il vuoto sopra i dati veri — con il messaggio «Salvato ✔».

Provato rompendo apposta la connessione: prima il modulo si apriva e i dati si
perdevano, adesso **il modulo non si apre** e dice perché.

In più `saveFattura` e `savePrev` **cancellavano le righe PRIMA di scrivere le
nuove**: un inserimento fallito lasciava la fattura senza nessuna voce. Adesso si
scrive prima e si cancella dopo (provato rompendo la scrittura a metà: la fattura
resta piena).

### 3. «Elimina reparto» prometteva il Cestino e ci metteva 2 tabelle su 11
Il messaggio elencava onestamente le 11 cose dentro il reparto e poi diceva «Va
tutto nel Cestino». In realtà ci finivano solo `gest_lavori` e `gest_mestieri`:
clienti, preventivi, fatture, fornitori, mezzi, persone, carte, scadenze e
computi restavano **vivi e invisibili**. E poi «Elimina per sempre» si rifiutava,
perché li trovava vivi: vicolo cieco.

Adesso si svuotano tutte e 11 (figli prima, reparto per ultimo) e `CEST_FIGLI`
per `gest_mestieri` è costruito **da `REPARTO_CONTENUTO`**, così cancellazione e
ripristino non possono più scollarsi.

### 4. Schermata bianca su iPhone vecchi — una riga
`window.matchMedia(...).addEventListener` senza `try`: su iOS 13 e prima non
esiste `addEventListener` su `matchMedia`, la riga lanciava, e tutto quello che
veniva dopo — **compreso l'avvio dell'applicazione** — non partiva. La riga
gemella 393 righe sopra il `try` ce l'aveva. Adesso c'è il `try` e il ripiego su
`addListener`.

### 5. La cassa previdenziale: due guai in uno
- Il preventivo offriva il **2%**, la tendina della fattura no: passando in
  fattura quei soldi **sparivano dal documento** (su 10.000 € sono 200 €).
- Nel file per lo SDI c'era `f.cassa_tipo || "TC22"`: senza la cassa scritta, il
  file **dichiarava all'Agenzia che era INPS** — falso per un geometra.

Alessio non sapeva a quale cassa corrispondesse il suo 2%. Invece di indovinare,
**si è tolta la domanda**: la tendina unica «percentuale + cassa» è diventata
**due campi separati** — `#fa-cassa-tipo` (l'elenco ufficiale TC01…TC22, verificato
sulle specifiche v1.2.2) e `#fa-cassa` (la percentuale, scritta a mano). Il primo
valore proposto viene **dall'ultima fattura fatta davvero** (`fattUltimaCassa()`),
non da un'ipotesi. Il vecchio `FATT_CASSE` è stato tolto.
Se manca la cassa, `fattXmlControllo` **blocca il file** e la chiede.

### 6. Il preventivo del forfettario diceva un numero, la fattura un altro
Il preventivo proponeva il 22% a tutti e teneva la ritenuta; la fattura, che il
regime RF19 lo sapeva già, metteva tutto a zero.

```
preventivo di 1.000 € in forfettario
prima:  1.000 + cassa 40 + IVA 228,80 − ritenuta 200 = 1.068,80 €
dopo:   1.000 + cassa 40                             = 1.040,00 €
```

`prevForm` adesso legge `gest_azienda` per sapere il regime; in forfettario l'IVA
è bloccata a 0, la ritenuta è disattivata, e `leggiCampiParcella` scrive zero
comunque (rete di sicurezza).

### 7. La Mappa: mezzo indirizzo e cantieri bruciati per sempre
- L'ufficio veniva letto con `.select("nome,indirizzo")`, ma `azIndirizzo()` mette
  insieme via + CAP + città + provincia: partiva la ricerca di
  «Via Verani 18, Italia» e il servizio lo piazzava nella prima che trovava in
  Italia. E siccome il punto dell'ufficio serve anche a **indovinare il comune dei
  cantieri**, il cliente di Fara in Sabina veniva cercato come «Via Roma 10, Rieti».
- Peggio: un **errore 429** («troppe richieste», che il servizio gratuito dà di
  continuo con venti cantieri) veniva scritto in memoria come «questo indirizzo
  non esiste», **per sempre**.

```
prima:  « Via Verani 18, Italia »            « Via Roma 10, Rieti, Italia »
dopo:   « Via Verani 18, 02100 Rieti (RI) »  « Via Roma 10, 02032 Fara in Sabina (RI) »
429 → prima: 2 indirizzi bruciati · dopo: 0
```

Memoria della Mappa passata da `ti_mappa_cache_v2` a **v3** (i punti sbagliati di
ieri vanno buttati), e il Riepilogo adesso legge la stessa costante invece di
riscrivere il nome a mano.

---

## LE ALTRE COSE CHIUSE OGGI (in ordine sparso)

- **Cestino**: errore di rete che non spegne più il cestino ma BLOCCA le
  eliminazioni; prova di accensione su tutte e 18 le tabelle; ripristino a catena;
  aggiornamento automatico; **filtro per reparto** con le viste «Questo reparto /
  Tutti i reparti» (prima si vedeva e si cancellava roba di altri pannelli); il
  pallino conta le **righe** e non i comandi.
- **Fatture**: `fattBasi` unica funzione dei conti; lo sconto riduce l'imponibile
  (1.000 fatture a caso, 0 discrepanze); nota di credito col segno; ordine dei
  blocchi XML; buchi nella numerazione visibili; PDF che non esce dal foglio.
- **Margine**: la manodopera entra nel margine — scheda lavoro, Report, CSV,
  Riepilogo — **e nel «Margine totale»** dei Totali storici, che era rimasto fuori.
- **Riga dei totali**: `renderTabella` esce nel ramo `cards` e con la tabella se ne
  andava anche la riga dei totali. Quattro sezioni la calcolavano da mesi senza
  mostrarla. Adesso è una fascia in cima alla griglia (`.tab-tot`).
- **Ricerca clienti**: guardava 5 campi e non P.IVA, codice fiscale, comune, CAP,
  provincia. Adesso li guarda tutti, e i numeri si confrontano senza spazi né punti.
- **Prezzario**: la colonna del prezzo non veniva riconosciuta con `€/U.M.`, `€`,
  `EUR`, `P.U.`, `Elenco prezzi` → **tutte le voci entravano a 0,00 €** in silenzio.
  Provate 13 intestazioni regionali vere. E se dopo la lettura nessuna voce ha un
  prezzo, l'importazione **si ferma**.
- **Computo**: le note lunghe usavano `spazio()` (la funzione della tabella, con la
  tabella già chiusa) e non venivano spezzate — su 18 righe di nota ne restava **1**
  sul foglio e 17 finivano fuori. La ricerca di riserva nel prezzario **cambiava
  tariffa** senza dirlo: diceva «cerco dentro Tariffa Lazio» e proponeva altro.
- **Galleria**: `loading="lazy"` + firme in blocco riusate per un'ora → da 42
  richieste e tutte le foto intere a **2 richieste** e solo quelle che si guardano;
  `galNomeOp` leggeva `db().dipendenti` (archivio locale morto) e stampava **l'ID
  della persona** sopra la miniatura.
- **Crediti formativi**: 2,5 CFP si salvavano come 0; il **tipo** del corso non
  veniva mai contato, quindi il riquadro poteva dire «sei a posto» con zero crediti
  di deontologia.
- **Traduttore studi tecnici**: `_SKIP_UTENTE` non conteneva `option`, quindi nelle
  27 tendine un cliente «Edilcantiere Srl» diventava «**Edilpratica Srl**».
- **Persone**: adesso si possono eliminare (era l'unica anagrafica senza «Elimina»,
  ed è il motivo per cui la categoria «Persone» del Cestino non si è mai riempita).
  Ore, foto e video **restano**: le ore sono il costo della manodopera di lavori
  già chiusi. L'accesso dal telefono viene revocato.
- **File orfani**: in 8 punti il file restava nel bucket quando la riga non si
  scriveva. Adesso `_fileOrfano()` lo toglie.
- **Backup JSON**: mancavano computi (con capitoli, voci, misure), prezzario,
  carte, movimenti, rifornimenti, note del calendario, elenco foto e video.
- **Dislessia**: da oggi **nessun testo sotto i 13 px** in tutto il gestionale
  (ne sono stati alzati 20). La prova su 21 sezioni × 2 profili × 2 misure non ne
  trova più.
- **Plurali**: «1 lavori aperti» → «1 lavoro aperto», con i singolari aggiunti anche
  al traduttore per gli studi.
- **Codice morto**: tolte `jobCard`, `agendaCard`, `dipById` e tre gestori che
  lavoravano sull'archivio locale morto — fra cui un «Elimina lavoro» che avrebbe
  tolto il lavoro dallo schermo **lasciandolo su Supabase**.

---

## I PERMESSI DELLA SQUADRA — scelta di Alessio

Alla domanda «li togliamo dal modulo o li facciamo funzionare?» ha risposto
**farli funzionare davvero**. Quindi oggi è stato toccato per la prima volta
`gestionale-operatore.html` (l'app che gli operai usano dal telefono): solo
aggiunte, niente tolto.

| permesso | cosa fa adesso |
|---|---|
| calendario | può girare fra i giorni. Senza, vede **solo oggi** |
| lavori | agenda, scadenze, apre i lavori, li segna fatti |
| foto | può **aggiungere** foto/video (quelle del capo le vede comunque) |
| note | può scrivere cosa ha fatto |
| clienti | vede l'elenco clienti |
| fatture | vede le fatture |
| pagamenti | vede la carta aziendale e registra le spese |

Due cose importanti:

- `permessiMai()` — una persona **senza permessi salvati** (creata prima che
  esistessero) non perde niente: si comporta come prima. Provato.
- Non è solo nascondere: `chiedoPermesso()` ferma anche **l'azione**.
- ⚠️ **Da dire sempre ad Alessio**: questo decide cosa l'operaio vede e può fare
  **dall'app**. Non è un lucchetto sul database: quello sono le regole RLS, che
  vanno scritte in SQL. Per un operaio col telefono in mano basta; se un giorno
  serve il lucchetto vero, è un file SQL a parte.

---

## COME È STATO PROVATO (vale la pena rifarlo così)

Alessio non può collaudare: «continuiamo tanto non sono in grado di testare».
Quindi ogni correzione è stata provata **col confronto prima/dopo**, servendo due
copie del gestionale su due porte (`8898` = versione online, `8899` = nuova) e
guidandole con Playwright. Gli script stanno in `/home/claude/work/`
(`prova-serale*.js`, `prova-mappa.js`, `prova-computo.js`, `prova-permessi.js`,
`prova-forfettario.js`, `prova-persone.js`, `prova-prezzario.js`).

Tre attrezzi che sono serviti più di tutti, da riusare:

1. **`stub-guasto.js`** — il finto Supabase con tre interruttori:
   `window.__ROMPI` (una tabella non risponde), `window.__ROMPI_INSERT` (legge ma
   non scrive), `window.__NO_COL` (una colonna non esiste, errore 42703). È così
   che si dimostrano i difetti «se la rete cade», senza aspettare che cada.
2. **`stub-preciso.js`** — come sopra, ma `select("a,b")` restituisce **solo quelle
   colonne**, come fa PostgREST davvero. Senza questo, il difetto della Mappa
   (mezzo indirizzo) **non si vedeva**: lo stub normale restituiva la riga intera e
   il codice sembrava corretto.
3. **Leggere i numeri dentro il PDF**: si intercetta il Blob e si spulciano le
   coppie `x y Td (testo) Tj` nei byte del file. Così si sa a quale **quota in mm**
   è finita ogni scritta, e si dimostra che qualcosa esce dal foglio.

Controlli fissi prima di ogni consegna: `node --check` sui blocchi `<script>`,
`grep openSheet(` (devono restare solo la definizione e la vista del giorno),
accenti sbagliati nei testi visibili, prova delle 21 sezioni con **zero errori
JavaScript**, le **1.000 fatture a caso** con scarto 0,0000 €, e `md5sum` da tutte
e due le parti a ogni consegna.

---

## DOVE SIAMO RIMASTI

**Chiuso**: tutta la lista grave del controllo delle 21 voci.

**Da fare ad Alessio**, se non l'ha ancora fatto:
- il push dell'ultima tornata (permessi + `gestionale-operatore.html`);
- `sql/gest-scadenze-ripeti.sql` su Supabase, una volta sola: senza, le scadenze
  non si ripetono (il gestionale funziona lo stesso e lo dice).

**Restano aperte** (nessuna perde dati):
- numerazione dei preventivi che non guarda né l'anno né il reparto;
- i rifornimenti del Report contati su **tutti** i reparti;
- eliminando un mezzo, le sue scadenze restano orfane;
- `sql/gestionale-mezzi.sql` non crea la colonna `tipo`, che il codice legge e scrive;
- `squadraAdd` crea doppioni se l'invito fallisce;
- eliminare una carta fa salire l'utile del mese senza spiegazione;
- «Incassato» del Report ≠ «Incassato» delle Fatture;
- alla partenza, se il database non risponde, dopo 8 secondi compare «Ancora
  nessun reparto, creane uno» — identico a quello che vede un utente nuovo, e
  invita a creare doppioni;
- il Riepilogo fa 25 letture in 6 ondate (`gest_operatori` letta 3 volte);
- `gest_richieste` non ha nessun file in `sql/`;
- nel Computo, se la lettura delle misure fallisce il PDF stampa «nessuna misura»
  e sotto la quantità: un documento che si contraddice;
- il lucchetto vero sui permessi (RLS), se lo si vuole.

# 13 agosto 2026 — RICONTROLLO DEL 12, POI CINQUE CORREZIONI E LE SPESE ART. 15

Giornata in due tempi. Prima il **ricontrollo** chiesto nel prompt: sono usciti
**14 difetti nuovi** nati il 12 agosto (ne erano previsti 9) e 10 cose vecchie
mai viste. Poi le correzioni, una alla volta, ognuna provata prima della
successiva.

## Chiuso oggi

1. **Elimina reparto si fermava a metà.** Se una tabella bloccava, le precedenti
   erano già nel Cestino e il messaggio diceva «il reparto NON è stato
   eliminato»: vero per il reparto, falso per tutto il resto. Adesso si chiede a
   tutte e 13 le tabelle PRIMA di toccarne una, e se qualcosa va storto lo
   stesso si TORNA INDIETRO (`sb.raw` + `gte("eliminato_il", inizio)`).
2. **`gest_ore` mancava da `REPARTO_CONTENUTO`.** Le ore restavano vive e
   irraggiungibili e «Elimina per sempre» si rifiutava all'infinito: il vicolo
   cieco che il 12 agosto si dava per chiuso era ancora aperto.
3. **Eliminando una persona cambiava il margine di lavori già chiusi** (2.780 →
   2.900 €). Le tariffe si leggono dalla porta di servizio; la media per le ore
   senza nome resta sui soli vivi.
4. **La revoca dell'accesso non veniva controllata.** Se falliva, l'ex
   collaboratore entrava ancora dal telefono e non era più in elenco per essere
   fermato. Adesso se la revoca non riesce non si elimina nessuno, e se fallisce
   la cancellazione l'accesso torna com'era (anche «invitato», non «attivo»).
5. **Lo sconto spariva dal file per lo SDI.** Righe col prezzo pieno, riepilogo
   scontato, mille euro inspiegati. Adesso ogni riga porta il suo
   `<ScontoMaggiorazione>` e i riepiloghi sono la somma delle righe.
6. **Le spese anticipate art. 15** (risposta del commercialista): riga a IVA 0
   con natura N1, due caselle separate in fattura, stesso conto nel preventivo.
   Serve `sql/gest-fattura-spese-art15.sql`.

Più, trovati strada facendo: quantità dei computi scritte a 2 decimali (l'89%
delle righe non tornava col controllo dello SDI), cassa non arrotondata prima
dell'imponibile, prezzi di riga negativi, righe scambiate fra XML e conti,
imponibili negativi, `Math.floor(x*100)` che si mangiava un centesimo sul 4,6%
degli importi.

## ⚠️ LA LEZIONE DI OGGI

**Metà dei difetti gravi di oggi li ho introdotti io correggendo.** Non sono
arrivati ad Alessio solo perché ogni correzione è stata rifatta girare da un
esaminatore diverso, e più volte: sulle fatture sono serviti **nove giri**.

Tre esempi da ricordare:

- `sb.from` staccato dall'oggetto perde il `this`: senza `js/cestino.js` la
  manodopera spariva da TUTTI i margini. **Lo stub non lo mostrava** (il suo
  `from` è una arrow function): è saltato fuori solo scaricando il bundle vero
  di supabase-js e provandolo in pagina.
- `Math.floor(n*100)/100` non è un arrotondamento per difetto: `0.29*100` fa
  `28.999999999999996`. Serve `+1e-9`.
- Una correzione che chiude un caso su 200.000 può aprirne uno al 15%: il cap
  `c2(pieno)` ha prodotto imponibili negativi.

**Morale: quando correggi, il posto dove cercare il difetto nuovo è la riga che
hai appena toccato**, non quelle intorno.

## Le fatture vecchie non si toccano

Una fattura accettata dallo SDI non si corregge a posteriori. Ogni fattura si
porta dietro `spese_regime`, scritto **una volta sola alla creazione** e mai più
aggiornato, nemmeno risalvando. Senza il segno = conto di prima, verificato
identico su 80.000 fatture e su tutti e diciotto i campi.

## DOVE SIAMO RIMASTI

**Da fare ad Alessio:**
- il push (gestionale-app.html, js/cestino.js, sql/gest-fattura-spese-art15.sql);
- lanciare `sql/gest-fattura-spese-art15.sql` su Supabase;
- mandare al commercialista le due domande rimaste in
  `prove-claude/DOMANDE-COMMERCIALISTA.md`: la base della ritenuta con lo sconto
  (400 € su una fattura da 10.000) e la cassa sul rimborso spese imponibile.

**Chiuso anche in serata**: le cinque caselle che perdevano i centesimi (spesa
del lavoro, ore del registro, costo orario, fattura fornitore, carta
dell'operaio), il pallino del Cestino che non scendeva, i testi sotto i 13 px
nell'app dell'operaio, e il giro apri-e-risalva che troncava quantita', prezzi
dei prezzari e misure del computo.

**Restano aperte** (l'elenco completo con i numeri e in
`prove-claude/RICONTROLLO-12ago-sera.md`), in ordine di rischio:

*1. I permessi degli operai — il gruppo piu' grosso e l'unico dove qualcuno
vede quello che non dovrebbe:*
- «Carica fattura PDF» dall'app operaio scrive in gest_foto aggirando il permesso foto;
- la policy `foto_read` di `sql/gest-permessi-collaboratori.sql` toglie
  all'operaio le foto del capo, che la scheda persona gli promette;
- Scadenze: il pulsante guarda «lavori», il database guarda «calendario» →
  sezione muta senza spiegazione;
- senza il permesso «note» l'operaio non puo' piu' nemmeno RILEGGERE le sue;
- persona vecchia con `permessi = {}` resta chiusa fuori col lucchetto;
- «solo Pagamenti» (o solo Fatture, o solo Foto) e' un permesso morto;
- il lucchetto vero sul database (RLS), se lo si vuole.

*2. I file che si perdono:*
- `_fileOrfano` non c'e' nell'app dell'operaio — le foto da cantiere, che sono
  quelle che generano piu' orfani;
- in `salvaLavoro` una foto puo' restare orfana E venire marcata «gia'
  caricata», quindi non si riprova mai piu';
- `_fileOrfano` non guarda l'esito della `remove`.

*3. I conti che non tornano fra due schermate:*
- «Incassato» del Report != «Incassato» delle Fatture;
- eliminare una carta fa salire l'utile del mese senza spiegazione;
- i rifornimenti del Report contati su TUTTI i reparti;
- numerazione dei preventivi che non guarda ne' l'anno ne' il reparto.

*4. Il resto:*
- eliminando un mezzo le sue scadenze restano orfane;
- `sql/gestionale-mezzi.sql` non crea la colonna `tipo`, che il codice usa;
- `gest_richieste` non ha nessun file in `sql/`;
- `squadraAdd` crea doppioni se l'invito fallisce;
- alla partenza, se il database non risponde, compare «Ancora nessun reparto»
  (identico a quello che vede un utente nuovo) e la landing si svuota;
- il Riepilogo fa 25 letture in 6 ondate;
- nel Computo, se la lettura delle misure fallisce il PDF si contraddice;
- il messaggio di eliminazione persona conta le RIGHE invece delle ore, e non
  conta le foto caricate dal telefono;
- Galleria: dopo l'eliminazione resta un'opzione vuota nella tendina;
- il ripristino dal Cestino non ridà l'accesso dal telefono e non lo dice;
- percentuali col punto («Cassa 12.5%») e prezzi di riga a un decimale (18,5);
- i 274 colpi: 16 ridisegni del Cestino durante un'eliminazione (spreco, non
  errore — con la prova di non-regressione scritta PRIMA del codice);
- `1,00 parti` nel modulo di correzione della misura;
- **`gestionale-negozio.html` e `gestionale-noleggio.html`: mai controllati**,
  e hanno gli stessi campi importo/ore ancora `type="number"`.

---

# 13 agosto 2026 (sera) — TRE GRUPPI CHIUSI, E UN BANCO DI PROVA CHE PARLA

Giornata lunga. Sono stati chiusi **tre dei quattro gruppi** rimasti aperti dal
rapporto del 12 agosto, ed è stato costruito il **banco di prova** che il
LEGGIMI di quel giorno chiedeva come «prossimo passo».

Tre spinte in produzione, tutte verificate prima di consegnarle:

| commit | cosa |
|---|---|
| `cd4c67b` | i permessi degli operai |
| `351768e` | i file che si perdono |
| (ultimo) | i conti che non tornano fra due schermate |

## GRUPPO 1 — i permessi degli operai (`cd4c67b`)

Era l'unico gruppo dove il difetto non era un numero sbagliato ma **una persona
che vedeva o faceva quello che non doveva**. Riprodotti tutti e 10 i sospetti
sul file originale prima di toccare una riga: nessun falso allarme.

- **«Carica fattura PDF» non chiedeva niente a nessuno.** Una persona con
  Fatture ✔ e Foto ✘ caricava nel deposito delle foto e scriveva in `gest_foto`,
  scavalcando il permesso col dito. Scelta di Alessio: quel pulsante lo comanda
  la spunta **Fatture**, perché il PDF di una fattura non è una foto di
  cantiere. Uguale nell'app e sul database.
- **Le foto del capo sparivano.** La scheda persona promette «Quelle che
  carichi tu le vede comunque», ma `foto_read` chiedeva la spunta «foto»:
  appena si lanciava quel file, l'operaio senza Foto perdeva le istruzioni
  fotografiche. Adesso legge chi ha «foto» **oppure** «lavori».
- **Le Scadenze mute.** Il pulsante guardava «lavori», il database
  «calendario»: la sezione si apriva e diceva «Nessuna scadenza» anche quando
  ce n'erano. «calendario» non è un permesso sui dati — le scadenze le comanda
  «lavori».
- **Le note sparivano invece di bloccarsi.** Senza il permesso l'operaio non
  rileggeva nemmeno quello che aveva scritto lui. Adesso la casella si legge,
  è grigia, e sotto c'è scritto perché.
- **«Solo Pagamenti», «solo Fatture», «solo Clienti» erano permessi morti.**
  Adesso entrano. Chi ha solo Pagamenti apre l'app e trova la sua carta.
- **La persona vecchia con la casella permessi vuota** non è più chiusa fuori.
- **Nel pannello**: le sette caselle riordinate (prima le quattro che aprono
  una schermata), il preset «Operaio» adesso comprende **Note**, e mentre
  spunti compare un avviso quando la combinazione non apre niente.

Serve aver lanciato `sql/gest-permessi-collaboratori.sql` (fatto, verificato
sulle regole vive con una query).

## GRUPPO 2 — i file che si perdono (`351768e`)

Il peggiore **non era quello scritto nel rapporto**. Nel pannello, salvando un
lavoro con delle foto, il giro non guardava né se il file era salito né se la
riga era stata scritta, e in fondo metteva comunque `f.uploaded=true`.

Fatto girare il pezzo vero, ritagliato dal file di oggi:

- **caricamento fallito** (poco campo in cantiere) → la riga si scriveva lo
  stesso e puntava a un file mai salito. Nel gestionale compariva una foto che
  non si apre; quella vera restava nel telefono, marcata «già caricata»,
  e **non si riprovava mai più**. Persa.
- **riga rifiutata** → file orfano nel deposito, e marcata «già caricata».
- in tutti e due i casi il messaggio diceva **«Lavoro aggiornato ✔»**.

Adesso: niente riga se il file non sale, niente file se la riga non si scrive,
«caricata» solo quando sono andate bene tutte e due, e il messaggio dice quante
sono rimaste indietro (ci riprova al salvataggio dopo).

Nell'app dell'operaio **la pulizia non c'era proprio**: provato, restavano 1
foto e 1 video nel deposito a ogni tentativo andato male. Ed è lì che se ne
accumulano di più, perché si carica dal cantiere.

E `_fileOrfano` non guardava l'esito della `remove`: Supabase non lancia mai
su errore, risponde `{error}` — quel `catch` non prendeva niente.

## GRUPPO 3 — i conti che non tornano fra due schermate

- **«Incassato 2026» era due cose con lo stesso nome.** Su 10.000 € al 22%: le
  Fatture dicevano 12.200 €, il Report 10.000 €. Nessuno dei due sbagliato —
  uno è la cassa, l'altro l'imponibile su cui si fa l'utile. Scarto misurato
  fino a **2.200 € sulla stessa fattura**. Adesso nelle Fatture si chiama
  «Entrato in cassa 2026 — IVA compresa, ritenuta tolta».
- **I rifornimenti non guardavano il reparto**: il gasolio di un reparto
  abbassava l'utile dell'altro. Tenuti dentro quelli senza reparto (sul
  database di Alessio sono 0, controllato) per non far sparire costi vecchi.
- **La carta nel Cestino faceva salire l'utile del mese**: i movimenti si
  chiedevano solo per le carte vive. Adesso si leggono da `sb.raw`, come le
  tariffe delle persone eliminate: **mettere in ordine le carte non riscrive
  la storia**.
- **Il numero dei preventivi** era un contatore unico: a gennaio non ripartiva
  da 1 e due reparti si passavano la stessa serie. Adesso riparte da 1 ogni
  anno **dentro ogni reparto**, e se la lettura non riesce si ferma invece di
  dare un numero già usato.

## IL BANCO DI PROVA — `prove-claude/banco-prove-13ago.zip`

Il punto 0 del prompt. **Un comando, 49 prove, ~15 minuti**, una riga verde o
rossa per ognuna, uscita diversa da zero se anche una sola è rossa.

```
node prova-tutto.js            il giro normale
node prova-tutto.js --lista    elenca e basta
node prova-tutto.js --tutto    anche archivio e diagnostiche
```

⚠️ **Gira nell'ambiente di Claude, non sul computer di Alessio** (serve
Chromium in `/opt/pw-browsers`, PostgreSQL 16, python3). Lo zip va solo
conservato e riallegato: se non c'è, va ricostruito da capo.

Le tre cose che fa e che prima non faceva nessuno:

1. **Rifà gli estratti dei conti dal gestionale di oggi.** `estratto.js`,
   `xmlhead.js`, `xmlbody.js` erano copie a mano incollate il 13 agosto:
   19 righe su 106 non si ritrovavano più nel file vero, e `xmlbody.js` non
   conteneva **nessuno** `<ScontoMaggiorazione>` — era la copia di *prima*
   della correzione dello sconto. Quelle prove dicevano «nessuna difformità»
   controllando codice che non gira più. Adesso si ritagliano a ogni giro, e
   se una funzione non si trova **la prova non parte**.
2. **Controlla l'md5 di quello che le porte servono davvero**, scaricandolo dal
   server. È l'ora persa del 13 agosto, che non si ripete.
3. **Non spaccia per verde quello che non sa leggere.** Quattro colori:
   passata · FALLITA · **già noto** (difetto aperto, ritrovato: giusto così) ·
   **da capire** (gira, ma non è ancora scritto cosa vuol dire passata: non
   conta come passata). Oggi sono 18 «da capire», tutte del Cestino, delle
   persone e delle caselle.

## ⚠️ LA LEZIONE DI OGGI — È CAMBIATA RISPETTO A IERI

Ieri era: *«quando correggi, il difetto nuovo sta nella riga che hai appena
toccato»*. Vale ancora. Ma oggi il tempo l'ha mangiato un'altra cosa.

**Quattro volte su cinque, quando una prova diceva il falso, il bugiardo era
la prova — non il gestionale.**

1. **L'estratto vecchio**: le prove dei conti giravano su codice del 13 agosto
   mattina e dicevano «nessuna difformità».
2. **Il banco che sovrascriveva `gest_membri`**: il ruolo che mettevo per la
   prova non arrivava mai al codice. Tre giri di «nessun difetto» falsi.
3. **Il banco che scriveva nel dizionario condiviso**: una prova si portava
   dietro i permessi di quella prima, e mi ha mostrato una riga rossa su una
   correzione che funziona.
4. **`t-orfani.js` classificata male**: contavo come difetto `foto1.jpg`, una
   riga che sta nei dati finti dall'inizio. Ce l'avevo pure messa in lista.
5. E **`t7-note-vuoto.js` mente per costruzione**: chiede «la nota si legge da
   qualche parte?» guardando `document.body.innerText`, dove il contenuto di
   una casella di testo **non compare mai**. Risponde NO anche quando la nota
   si legge benissimo. Fidandosi si «correggerebbe» una cosa che funziona.

**La domanda da farsi prima di ogni riga rossa, e prima di ogni riga verde:**
*questo lo dice il gestionale, o lo dice la prova?*

Di contorno, due difetti nel banco stesso: l'estrattore **perdeva la parola
`async`** (ogni ritaglio di funzione asincrona veniva fuori spezzato), e il
mio primo `prova-tutto.js` contava un link firmato come se fosse un
caricamento.

**Però il banco ha anche ripagato**, e nello stesso giorno: sul gruppo 3 ha
trovato il **terzo** posto che assegna il numero al preventivo (ne avevo
corretti 2 su 3, contando i posti se n'è accorto lui), e subito dopo il
controllo della sintassi ha fermato una **pagina bianca** — correggendo quel
terzo posto ci avevo messo una variabile che in quella funzione non esiste.

## DOVE SIAMO RIMASTI

**Da fare ad Alessio:**
- il push del gruppo 3, se non è già stato fatto;
- la **prova a clic sull'app dell'operaio** col link di un collaboratore: foto
  del capo visibili, note leggibili e grigie, Scadenze non mute. È l'unico
  pezzo di collaudo che non può fare Claude.

**Restano aperte**, in ordine:

*1. Le tre piccole del pannello (tutte provate):*
- il **ruolo** che sparisce dalla tendina se non è una delle tre scelte, e che
  un Salva qualsiasi **cancella** scrivendo `""`. Il ruolo conta: «segretaria»
  vede tutte le pratiche dello studio, gli altri solo le proprie. Correzione
  già scritta a parole: la tendina si tiene il valore che trova, e Salva non
  scrive mai un ruolo vuoto;
- la **barra del fondatore sul telefono**: 233 px su uno schermo da 360
  (il 29%), e la X la chiude «fino al prossimo caricamento», quindi torna
  sempre. Solo Alessio la vede;
- i **4 account con `tipo` vuoto**: non sono né impresa né artigiano né
  professionista, e vedono le etichette di partenza. Sono persone vere.

*2. Il menu del telefono (visto da Alessio, NON riprodotto):*
Sul pannello, aprendo il ☰ da iPhone, ogni voce diventa un riquadro alto con
dentro una casellina vuota con una **«i»**. Nella prova a 390 px le righe sono
alte 44 px e quelle «i» non ci sono. Sospetto principale: `js/aiuti.js` su
dispositivo touch. **Serve una prova in modalità touch vera**, non un finto
computer stretto.

*3. `gestionale-negozio.html` e `gestionale-noleggio.html`:*
Alessio li vuole fare **separatamente, da soli**, dopo aver finito impresa e
professionisti. Trovato guardando (non ancora riprodotto): non hanno `_numIt`,
e leggono con `parseFloat($("#nm-importo").value)||0`. Con `type="number"`, se
scrivi `12,50` il valore diventa **vuoto** → si salva **0 €**. Una casella si
chiama testualmente «Quantità (anche con la virgola)». Buona notizia: nel
database **non c'è nessun account di tipo «negozio»** (34 artigiano, 27
impresa, 1 professionista, 4 senza tipo), quindi oggi non fa danni a nessuno e
si può lavorare con calma.

*4. Le 18 prove «da capire» del banco*, da classificare una alla volta quando
si lavora su quel gruppo.

*5. Di contorno, trovato leggendo le regole del deposito:* `foto_team_delete`
usa `gest_puo_accedere`, cioè «sei un collaboratore attivo» e basta — non
guarda la spunta «foto». Un collaboratore può cancellare qualsiasi file di
quel deposito. C'era già, non è una regressione, non è in lista.

Più tutto quello che era già scritto nella sezione del 13 agosto mattina e non
è stato toccato: i mezzi, `gest_richieste`, `squadraAdd`, il Riepilogo che fa
25 letture, la Galleria, il ripristino dal Cestino, le percentuali col punto.


---

# 14 agosto 2026 — LA PRIORITÀ 1 SI CHIUDE SENZA SCRIVERE UNA RIGA DI SQL

Giornata corta e strana: **il lavoro grosso era guardare**, non correggere.
La priorità 1 (il lucchetto sul database) si è chiusa **senza scrivere niente**,
e l'unica correzione della giornata è una da tre righe che però nascondeva un
meccanismo che si cancellava le prove da solo.

Una spinta in produzione:

| commit | cosa |
|---|---|
| (ultimo) | il ruolo della persona non si cancella più da solo |

## IL BANCO HA MENTITO PER PRIMO — 4 righe rosse su 50

Al primo giro della giornata, **4 prove del gruppo `nuove` erano rosse**, tutte
con lo stesso messaggio: *«timeout aprendo gestionale-operatore.html»*. Detta
così sembrava una pagina bianca nel gestionale.

Non lo era. Nel log c'era la riga vera:

```
FileNotFoundError: .../servito/js/supabase-real.js
```

`nuove/harness.py` intercetta le chiamate a `cdn.jsdelivr.net` e al loro posto
serve `servito/js/supabase-real.js`, cioè il bundle vero di supabase preso dal
disco. **Nessuno lo metteva lì**: `prova-tutto.js` copiava la sonda ma non quel
file. Senza supabase la pagina non finiva mai di caricare.

Sistemato dentro `allestisci()`. Rifatto il gruppo: **8 su 8 verdi**, comprese
le 19+12+8 prove del gruppo 1.

## PRIORITÀ 1 — il lucchetto sul database: NESSUN BUCO

Guardate tutte e **34** le tabelle `gest_*` leggendo le **regole vive**, non i
file. Tre giri di query, perché i primi due mentivano (vedi la lezione).

**Il risultato:**

- **nessuna tabella col lucchetto spento.** Il caso peggiore — RLS spento più
  `grant select to authenticated`, cioè chiunque sia entrato legge le righe di
  tutti — **non esiste da nessuna parte**;
- **nessun collaboratore legge i costi e i margini.** `gest_spese`, `gest_ore`,
  `gest_computi`, `gest_prezzi_propri`, `gest_fornitori`,
  `gest_fatture_fornitori`, `gest_crediti`: tutte con la sola regola del
  proprietario. Le tre tabelle figlie del computo (`capitoli`, `voci`,
  `misure`) sono anzi **più strette**: proprietario *e* computo padre suo;
- `gest_spese` era l'unica che **non compare in nessun file di `sql/`** — era
  il sospetto numero uno. Ha il lucchetto acceso e una regola sola, del
  proprietario. A posto;
- **`gest_operatori` è la regola NUOVA**: la correzione dell'11 agosto è viva
  sul database. Un collaboratore vede **solo la propria scheda** — codice
  fiscale, documenti e **costo orario** dei colleghi non li legge nessuno;
- **le carte e i movimenti**: un dipendente vede solo la carta intestata a lui
  (`gest_carte.dipendente_id = m.operatore_id`) e i movimenti di quella. Può
  **aggiungerne** — giusto, è lui che spende — ma non modificarli né
  cancellarli: quelle regole non ci sono;
- **le foto**: la scelta a due strade del 13 agosto è viva
  (`tipo='fattura'` → spunta *Fatture*, altrimenti *Foto* **oppure** *Lavori*);
- **`gest_mestieri`** lo legge ogni collaboratore attivo senza guardare nessuna
  spunta (usa ancora la vecchia `gest_puo_accedere`), ma dentro c'è solo
  `id, user_id, nome, colore, icona, ordine, created_at, eliminato_il`: niente
  che non veda già aprendo l'app. Va bene così;
- **`gest_membri`** ha `membri_self`, che fa leggere a ognuno la propria riga.
  È **solo lettura**: nessuno può alzarsi i permessi da solo.

Di contorno, una conferma che vale: il fatto che `gest_lavori`, `gest_clienti`,
`gest_fatture`, `gest_note`, `gest_scadenze` e le altre usino
`gest_puo_sezione` **dimostra che il gruppo 1 del 13 agosto è atterrato davvero
sul database**, non solo nei file.

Le tre query stanno in `prove-claude/query-lucchetti-14ago.sql`,
`query-chi-entra-14ago.sql`, `query-unica-14ago.sql`.

**Non guardato:** le regole del **deposito dei file** (i bucket
`gestionale-foto` e `gestionale-video`). Sono un altro posto. Lì dentro c'è già
`foto_team_delete`, che usa `gest_puo_accedere` — «sei un collaboratore attivo»
e basta, senza guardare la spunta «foto». C'era già, non è una regressione.

## IL RUOLO CHE SI CANCELLA — il difetto che si cancella le impronte

Il 13 sera era rimasto scritto: *«il caso mio (david, ruolo stringa vuota) non è
stato riprodotto: con la stringa vuota la prova mostra Operaio, non il bianco.
Manca un pezzo.»*

Il pezzo era questo: **il `""` di david non è la causa, è il danno già fatto.**

Riprodotto in un browser vero, un valore per volta:

| cosa c'è in `gest_membri.ruolo` | la tendina mostra | Salva scrive |
|---|---|---|
| `"operaio"` / `"preposto"` / `"segretaria"` | la voce giusta | la voce giusta |
| `"Operaio"` (maiuscola) | **BIANCO** | **`""`** |
| `" "` (uno spazio) | **BIANCO** | **`""`** |
| `"capo"` | **BIANCO** | **`""`** |
| `""` | Operaio | `"operaio"` |
| `null` | Operaio | `"operaio"` |

Il giro completo è: nel database c'è un ruolo scritto diverso dalle tre voci →
la tendina si apre in bianco → premi Salva anche solo per cambiare il telefono
→ **scrive `""`** → riapri e adesso mostra «Operaio». **Il difetto si cancella
le impronte da solo**, e quando siamo andati a guardare eravamo già dopo.

Controllato che non ci fossero altre strade: nel gestionale **solo due punti**
scrivono il ruolo (righe 4851 e 4867), tutti e due dalla tendina. Un `""` in
`gest_membri` non può arrivare da nessun'altra parte.

Sul database di Alessio c'è **una persona sola** in squadra, con quel `""` già
scritto: nessuno è a rischio adesso.

**La correzione**, tre punti:

1. `squadraForm` — se il ruolo trovato non è fra le tre voci, gli si fa una voce
   sua, scritta com'è, con accanto «(ruolo non previsto)». Il valore si vede e
   non si perde;
2. `squadraAdd` e 3. `squadraSave` — un ruolo vuoto non si scrive mai: al posto
   di `""` va `operaio`.

## LA PROVA DEL RUOLO È ENTRATA NEL BANCO

`nuove/ruolo-vuoto.py` esisteva dal 13 agosto ma **non era nel comando**.
Adesso è nel gruppo `nuove`.

Attenzione a come si legge: quella prova **non esce con un codice di errore**,
stampa in fondo «N casi, M con il difetto». Con `perEsito: true` sarebbe stata
**verde per sempre** — l'esatto contrario di quello che serve. Quindi ha una
`leggi:` scritta apposta: M deve essere 0, e se la riga del riepilogo non si
trova la prova è rossa (vuol dire che non è arrivata in fondo).

Provata nei due versi: sul file **di prima** 2 casi su 8 con il difetto → riga
**rossa**; sul file **corretto** 8 casi, 0 → riga **verde**.
Una prova che non diventa rossa sul file rotto non prova niente.

**Giro completo a fine giornata: 33 passate, 0 FALLITE, 18 da capire.**

## ⚠️ LA LEZIONE DI OGGI — è la stessa di ieri, tre volte in una mattina

Quella del 13 sera non è cambiata, si è solo confermata:

**Quattro volte su cinque, quando una prova dice il falso, il bugiardo è la
prova — non il gestionale.**

Oggi è successo tre volte, tutte prima di pranzo:

1. **le 4 righe rosse del banco** erano un file mancante, non una pagina bianca;
2. **la prima query di ricognizione cercava il nome della vecchia funzione**
   (`gest_puo_accedere`) mentre il lavoro del 13 usa quella nuova
   (`gest_puo_sezione`). Diceva «solo il titolare» su `gest_lavori`,
   `gest_clienti`, `gest_fatture`, `gest_foto`, `gest_note`, `gest_scadenze` —
   tabelle che i collaboratori leggono eccome. **L'errore è stato riprodotto**
   su un PostgreSQL vero prima di dichiararlo. Corretto cambiando **metodo**,
   non nome: la query nuova non cerca parole, **mostra il testo delle regole** e
   nasconde solo quelle che sono *esattamente* «sono io il proprietario»;
3. **la stessa query tagliava le condizioni a 160 caratteri**, e su
   `gest_operatori` il pezzo che decideva tutto (`m.operatore_id =
   gest_operatori.id`) stava **dopo il taglio**. Cioè: la differenza fra «vede
   solo la propria scheda» e «legge il costo orario di tutti» era esattamente
   nel pezzo tagliato via.

**La domanda da farsi prima di ogni riga rossa, e prima di ogni riga verde:**
*questo lo dice il gestionale, o lo dice la prova?*

E una cosa pratica, che è costata due giri: **l'SQL Editor di Supabase mostra
solo il risultato dell'ULTIMA query.** Se ne servono tre, o se ne manda una
sola, o si mandano una alla volta.

## ✅ IL GRUPPO DEI PERMESSI È CHIUSO ANCHE A MANO

**Alessio ha fatto la prova a clic sull'app dell'operaio**, quella rimasta in
sospeso dal 13 sera: link di un collaboratore con **Lavori ✔, Foto ✘, Note ✘**.
Foto del capo visibili, «Aggiungi foto» assente, casella delle note leggibile e
grigia, Scadenze non mute.

**Esito: va tutto bene.**

Vuol dire che il gruppo 1 — il più grosso dei quattro, e l'unico dove qualcuno
vedeva o faceva quello che non doveva — è chiuso in tutti e tre i modi:
riprodotto prima di toccare il codice, provato dal banco dopo, e **confermato a
mano sul telefono vero da chi lo usa**. Non è rimasto niente in sospeso.

## DOVE SIAMO RIMASTI

**Da fare ad Alessio:**
- il push della correzione del ruolo, se non è già stato fatto.

**Restano aperte**, in quest'ordine — deciso il 14 agosto, con il Computo
spostato **prima** del resto:

*1. Le due piccole del pannello (provate, mancano da correggere):*
- la **barra del fondatore sul telefono**: 233 px su uno schermo da 360 (il
  29%), e la X la chiude «fino al prossimo caricamento», quindi torna sempre.
  Solo Alessio la vede. La prova sta in `nuove/barra-fondatore.py`;
- i **4 account con `tipo` vuoto**: non sono né impresa né artigiano né
  professionista, e vedono le etichette di partenza. Sono persone vere.

*2. Il Computo metrico e il Prezzario — la zona grossa, mai aperta.*
Messa qui di proposito, prima del resto: è la stanza al buio da cui escono i
preventivi, cioè i soldi. Se lì dentro c'è qualcosa di grosso è meglio saperlo
adesso che fra tre sessioni. Oggi si controlla solo che si apra senza errori.
Schema in `sql/gest-computo-metrico.sql`. Due cose già annotate da verificare
lì: il PDF che si contraddice se la lettura delle misure fallisce, e
`1,00 parti` nel modulo di correzione della misura.
Aspettarsi che la lista **cresca** prima di scendere.

*3. Il menu del telefono (visto da Alessio, NON riprodotto):*
Sul pannello, aprendo il ☰ da iPhone, ogni voce diventa un riquadro alto con
dentro una casellina vuota con una **«i»**. Nella prova a 390 px le righe sono
alte 44 px e quelle «i» non ci sono. Sospetto principale: `js/aiuti.js` su
dispositivo touch. **Serve una prova in modalità touch vera** (`hasTouch`,
`isMobile`, il device descriptor di un iPhone), non un finto computer stretto.

*4. I 13 rimasti dal 13 agosto mattina* — letti nel codice, **non riprodotti**.
L'elenco completo è nella sezione «13 agosto 2026», punto *4. Il resto*. In
ordine di quanto fanno male:
- *fanno perdere roba:* il mezzo eliminato lascia le scadenze orfane · il
  ripristino dal Cestino non ridà l'accesso dal telefono e non lo dice ·
  `squadraAdd` crea doppioni se l'invito fallisce;
- *fanno sbagliare i conti:* percentuali col punto («Cassa 12.5%») · prezzi di
  riga a un decimale (18,5);
- *dicono una cosa per un'altra:* «Ancora nessun reparto» quando il database
  non risponde · il messaggio di eliminazione persona conta le righe invece
  delle ore;
- *fastidi, non danni:* la Galleria lascia un'opzione vuota nella tendina · il
  Riepilogo fa 25 letture in 6 ondate · i 274 colpi del Cestino ·
  `gest_richieste` senza file in `sql/` · la colonna `tipo` dei mezzi.

*5. Le 18 prove «da capire» del banco*, da classificare una alla volta quando si
lavora su quel gruppo. **Il traguardo vero è questo:** una sessione intera e
alla fine il banco tutto verde, 0 rosse e 0 «da capire».

*6. Le regole del deposito dei file* (bucket `gestionale-foto` e
`gestionale-video`), mai guardate. Ci sta dentro `foto_team_delete`.

*7. `gestionale-negozio.html` e `gestionale-noleggio.html`:* Alessio li vuole
fare **separatamente, da soli**, dopo aver finito impresa e professionisti.
Confermato il 14 agosto. Trovato guardando (non riprodotto): non hanno `_numIt`,
e leggono con `parseFloat($("#nm-importo").value)||0`. Con `type="number"`, se
scrivi `12,50` il valore diventa **vuoto** → si salva **0 €**. Nel database non
c'è nessun account di tipo «negozio» (34 artigiano, 27 impresa, 1
professionista, 4 senza tipo), quindi oggi non fa danni a nessuno.

**Quanto manca, stimato il 14 agosto:** 6–10 sessioni per la lista com'è oggi,
negozio e noleggio compresi. Ma non è una data: il 12 agosto erano previsti 9
difetti nuovi e ne sono usciti 14. Ogni zona guardata sul serio fa **crescere**
la lista prima di farla scendere, e il Computo è la più grande mai toccata.


---

# 14 agosto 2026 (sera) — LE DUE PICCOLE, IL COMPUTO APERTO, E IL MENU DEL TELEFONO RIPRODOTTO

Sessione lunga e produttiva: **chiusi i punti 1, 2 e 3** della lista del 14
mattina. Il punto 3 (il menu ☰) era «visto ma non riprodotto» da due giorni:
adesso è riprodotto, capito e corretto.

Cinque correzioni, tutte provate nei due versi. **Quattro prove nuove** entrate
nel banco, che passa da 51 a **56 prove nel giro normale**.

| file | cosa cambia |
|---|---|
| `js/fondatore.js` | la barra sul telefono è una riga, e la X si ricorda |
| `js/aiuti.js` | via le «i» dal menu ☰; mai sotto i 13 px |
| `gestionale-app.html` | «Che lavoro fai?» a chi non l'ha mai detto · il PDF del computo non esce monco · «1,00 parti» → «1 parte» |

## 1. LA BARRA DEL FONDATORE — da 233 px a 56

Erano **233 px su uno schermo da 360**, cioè il 29%: i link andavano a capo sei
volte. E la X la chiudeva «fino al prossimo caricamento», quindi tornava sempre.

Adesso, sotto i 760 px: **una riga sola che scorre col dito** (`flex-wrap:nowrap`
+ `overflow-x:auto`), con la X ferma a destra, sopra tutto, sempre raggiungibile.
**56 px, il 7% dello schermo.**

E la X **si ricorda**: scrive in `localStorage` (`ti_barra_chiusa`), quindi la
barra resta chiusa anche ricaricando. Per riaprirla c'è una **linguetta viola
«F»** sul bordo sinistro, a metà altezza — che è anche l'unico modo di farla
tornare, quindi non si perde niente.

Provata nei due versi con `nuove/barra-fondatore.py`, che **c'era dal 13 agosto
ma non era nel comando** — esattamente come `ruolo-vuoto.py` ieri. Adesso c'è.
Sul file di prima: 1 problema su 9 → rossa. Sul corretto: 9 su 9 → verde.

## 2. «CHE LAVORO FAI?» — i 4 account con il tipo vuoto

Sono **registrazioni rimaste a metà**: `imprese.tipo` vuoto *e* `nome_attivita`
vuoto. Il gestionale li trattava come «nessun profilo» e mostrava le etichette
di partenza — quelle dell'impresa edile, **IVA al 10% compresa** — anche a un
geometra. E loro non avevano nessun modo di accorgersene.

Scelta di Alessio: **glielo chiede il gestionale**, non li sistemo io a mano.
Appena entrano, se il tipo manca, compare una `openSheetGrande` con tre voci:
Impresa edile · Artigiano · Studio tecnico, ognuna con scritto cosa cambia.
Si sceglie una volta, si salva, la pagina si ricarica con le etichette giuste.

Vale anche **per chi si registrerà male domani**: è il difetto che si ripara da
solo, non una toppa sui 4 di oggi.

Il salvataggio controlla **tutte e due le cose** — errore *e* zero righe
aggiornate — perché Supabase non lancia mai e «zero righe» non è un errore.
È lo stesso difetto già preso sul piano nella barra del fondatore.

`nuove/tipo-mancante.py`: 15 controlli, compreso il caso brutto (la PATCH
risponde 200 con zero righe: non deve dire «Fatto»). Sul file di prima 9
problemi su 15, sul corretto 0.

## 3. IL COMPUTO METRICO E IL PREZZARIO — prima apertura

**Si aprono tutti, senza un solo errore JavaScript**, su computer e su telefono:
elenco, scheda del computo, lavorazione con le sue misure, prezzario.
`nuove/computo-ricognizione.py`, 22 controlli.

Le **due cose già annotate erano vere tutte e due.**

### Il PDF che si contraddiceva — riprodotto

`computoPdf()` controllava l'errore su capitoli e voci, ma **non** sulla lettura
delle misure. Riprodotto facendo rispondere **500 a quella sola query**:

- il PDF **usciva lo stesso**;
- dentro c'era «Quantità 20,46 mq» per ogni lavorazione, e **sotto nessuna
  misura**: un computo metrico senza il computo delle misure;
- e in fondo il messaggio diceva **«PDF del computo scaricato ✅»**.

È il documento che si manda al cliente, con dentro un buco che non si vede.
Adesso ci si ferma prima di disegnare qualsiasi cosa e si dice perché.
`nuove/computo-pdf-misure.py` legge il PDF vero con `pdftotext` e controlla che
le righe delle misure ci siano davvero — non che il file esista.

### Il «1,00 parti» — vero

`_partiTesto` esisteva dal 10 agosto apposta («le parti sono un conteggio, non
una misura»), ma il **modulo di correzione** usava `_misTesto`. Risultato: nella
riga sopra si leggeva «2 parti», e nella casella due dita più sotto «**2,00**».
La stessa misura scritta in due modi a due dita di distanza.

## 4. IL MENU ☰ SUL TELEFONO — RIPRODOTTO, ed era `aiuti.js`

Era in lista dal 13 agosto come **«visto da Alessio, NON riprodotto»**. Il
motivo per cui non si riproduceva è tutto qui: le prove giravano a 390 px su un
**finto computer stretto**, dove `hover:hover` e `pointer:fine` restano
**accesi**, quindi `conMouse` in `aiuti.js` è `true` e le «i» non le attacca
nessuno. La prova misurava un telefono che non esiste.

Con un iPhone vero secondo Playwright (`hasTouch`, `isMobile`, device
descriptor), `nuove/touch-iphone.py`:

| | finto computer 390px | iPhone vero |
|---|---|---|
| `hover:hover` | **true** | false |
| voci del menu con la «i» | **0 su 18** | **18 su 18** |
| voce più alta | 42 px | **69 px** |

Cioè **esattamente quello che vedeva Alessio**: «ogni voce diventa un riquadro
alto con dentro una casellina vuota con una i».

**La correzione** (scelta di Alessio fra tre): le «i» spariscono **solo dalle
voci del menu ☰** — lì il nome della sezione si spiega da sé, e appena entri la
sezione si presenta con la sua riga. Restano dove servono davvero: le etichette
dei moduli, i totali della fattura, i pulsanti del lavoro.

E di contorno, un difetto che nessuno cercava: **la «i» era scritta a 11 px**
(12 sotto i 560), cioè sotto il minimo di 13 di tutto il gestionale. Adesso 13,
e il cerchietto da 17 a 19 px.

## ⚠️ LA LEZIONE — TRE VOLTE ANCORA, E TUTTE E TRE ERANO MIE

Non è cambiata, e stavolta ha colpito **solo le mie prove**:

1. **la prova del computo diceva «le misure non ci sono»**: guardava i primi 600
   caratteri di `#sheet`, che sono il **prezzario** (colonna sinistra). Le misure
   stanno nella colonna destra, **oltre il taglio**. È il taglio a 160 caratteri
   della query di stamattina, identico, a otto ore di distanza;
2. **la prova touch cercava `.ham`**, che non esiste: il pulsante si chiama
   `.burger`. Non apriva il menu, trovava 0 voci, e stampava **tre righe verdi**
   su un menu chiuso — «0 «i» nel menu, 0 px di altezza, tutto a posto».
   Aggiunta una riga che va **rossa se il menu non si è aperto**: senza quella,
   tre controlli su sette erano verdi per costruzione;
3. **le 4 righe rosse del giro del mattino** erano `sql-collaudo.sh` che cerca i
   file in `../repo/sql` **ignorando `--repo`**. Sembravano le policy rotte.
   Corretto dentro il banco (`env:` per prova, e `GEST_SQL` passato da lì).

**E un errore mio, di metodo:** il primo giro del banco l'ho lanciato *mentre*
modificavo i file. Quel giro non valeva niente ed è stato buttato: il giro buono
è quello fatto alla fine, sui file fermi.

## IL BANCO — 56 prove nel giro normale

Quattro prove nuove nel gruppo `nuove`, tutte con la `leggi:` scritta a mano
(stampano «N controlli, M con problemi» e non escono con un codice di errore:
con `perEsito` sarebbero verdi per sempre):

- `barra-fondatore.py` — c'era, non era nel comando;
- `touch-iphone.py` — il menu su un telefono vero;
- `computo-ricognizione.py` — Computo e Prezzario si aprono;
- `computo-pdf-misure.py` — il PDF non esce senza le misure;
- `tipo-mancante.py` — la domanda compare solo a chi serve, e salva davvero.

Tutte provate **nei due versi**, rosse sul file di prima e verdi sul corretto:
4 su 7 · 6 su 22 · 1 su 4 · 9 su 15.

## DOVE SIAMO RIMASTI

**Da fare ad Alessio:**
- il push di questa sessione.

**Restano aperte**, in quest'ordine:

*1. Il resto del Computo metrico.* Oggi si è controllato che **si apra**, e le
due cose annotate erano vere. Non è stata guardata a fondo: i conti del
riepilogo, il ribasso d'asta, il quadro economico dei lavori pubblici, il
passaggio computo → preventivo (`preventivo_id`), l'importazione di un
prezzario regionale. **La lista crescerà ancora**: è la zona più grande e
finora ne è stata aperta una stanza sola.

*2. I 13 rimasti dal 13 agosto mattina* — letti nel codice, **non riprodotti**.
Elenco completo nella sezione «13 agosto 2026», punto *4. Il resto*.

*3. Le prove «da capire» del banco*, da classificare una alla volta quando si
lavora su quel gruppo. Traguardo: una sessione intera con il banco tutto verde,
0 rosse e 0 «da capire».

*4. Le regole del deposito dei file* (bucket `gestionale-foto` e
`gestionale-video`), mai guardate. Ci sta dentro `foto_team_delete`, che usa
`gest_puo_accedere` senza guardare la spunta «foto». C'era già, non è una
regressione.

*5. `gestionale-negozio.html` e `gestionale-noleggio.html`*, separatamente e
dopo aver finito impresa e professionisti. Confermato di nuovo il 14 sera.

---

# 14 agosto 2026 (notte) — IL COMPUTO METRICO A FONDO: CINQUE DIFETTI, TUTTI SUI SOLDI

Sessione dedicata alla **zona a rischio soldi**, per prima e di proposito.
Cinque difetti, tutti riprodotti prima di toccare una riga. Nessuno era un
falso allarme; due invece erano falsi allarmi delle **mie prove**.

Il banco passa da 56 a **58 prove nel giro normale**: **40 passate, 0 FALLITE.**

| file | cosa cambia |
|---|---|
| `sql/gest-computo-quantita-3-decimali.sql` | **DA LANCIARE**: il computo torna con la calcolatrice |
| `gestionale-app.html` | doppio preventivo · oneri fantasma · sconto senza limiti · il Riepilogo che leggeva un dato in meno |

## 1. IL COMPUTO NON TORNAVA CON LA CALCOLATRICE

Una soglia in marmo, 0,55 × 0,815 m, a 1.850 €/m². Sul documento consegnato:

```
Soglia in marmo    m2    0,448    1.850,00    829,26
```

Chi lo riceve prende la calcolatrice, fa 0,448 × 1.850 e trova **828,80**.

La quantità vera è 0,44825 — cinque decimali, `numeric(16,5)`. Il documento ne
stampa tre, perché in cantiere si misura al millimetro, ma **l'importo veniva
calcolato sui cinque**. Il computo stampava un numero e ne usava un altro.

Nel codice del PDF c'è scritto, parola per parola: *«Chi lo riceve deve poter
rifare il conto con la calcolatrice, se no non se lo fida.»*

Riprodotto su un **PostgreSQL 16 vero**, schema ricostruito dai file in `sql/`,
con misure da cantiere:

| voce | quantità vera | stampata | importo scritto | rifatto a mano |
|---|---|---|---|---|
| Soglia in marmo | 0,44825 | 0,448 | 829,26 | **828,80** |
| Massetto | 1,08859 | 1,089 | 183,37 | **183,44** |
| Cordolo | 21,375 | 21,375 | 2.014,59 | 2.014,59 |

Totale del computo **3.027,22**, rifatto riga per riga **3.026,83**.

**La correzione** sta nella vista, non nel gestionale: la quantità si chiude a
tre decimali e l'importo si calcola su quella. Un posto solo, come da regola
del file dello schema. Sistema **di riflesso** anche il preventivo creato dal
computo, che le quantità le portava già a tre: prima computo e preventivo dello
stesso lavoro chiudevano su due totali diversi.

## 2. DUE CLIC = DUE PREVENTIVI CON LO STESSO NUMERO

Riprodotto nel browser con la rete lenta di un cantiere (1,2 s di ritardo sulla
scrittura): due clic su «Crea il preventivo» → **due preventivi, tutti e due
numero 1**.

Il numero progressivo si calcola **prima** di scrivere, e in quel mezzo secondo
il pulsante resta premibile. Il controllo su `preventivo_id` non bastava:
guarda `compCache`, che al secondo clic non è ancora stata riletta.

Adesso c'è il chiavistello — la variabile, non il pulsante spento — come in
`compMisAdd` dal 10 agosto. Lì c'era, qui no. E il collegamento si segna subito
anche nella copia in memoria, perché `rinfresca()` non è asincrona e non aspetta
la rilettura.

Tutte le nove uscite della funzione riaprono il chiavistello: se no bastava un
errore per bloccare il pulsante fino al ricaricamento.

## 3. GLI ONERI DELLA SICUREZZA FANTASMA

I due campi di gara si vedono **solo** sui computi «Lavori pubblici». Se il
computo torna «privato» spariscono dal modulo, ma restano scritti nelle voci —
`compVoceSalva` li lascia apposta, per non azzerare il lavoro fatto.

`compRiepilogo` però li sommava **sempre**, e lo sconto finiva calcolato su
(totale − oneri) invece che sul totale.

Riprodotto nel browser: computo privato da 100.000 €, 5.000 € di oneri rimasti,
sconto 20% → il gestionale scriveva **81.000 invece di 80.000**. Mille euro, e
nella schermata non c'era **nessun numero che li spiegasse**: il campo che li
causa non si vede più.

«Non soggetti a ribasso» è una regola delle **gare pubbliche**. Su un lavoro
privato quei numeri non contano, e adesso il conto guarda il tipo del computo.

## 4. LO SCONTO SENZA LIMITI

Il campo accettava qualsiasi numero:

- **150%** → totale **−500 €** su un computo da 1.000: i soldi glieli daresti tu;
- **−10%** → il conto **sale** del 10%, e sul PDF si stampava «Ribasso -10,00%».

Adesso il salvataggio si ferma e lo dice, e nel conto c'è comunque il paracadute
per i numeri già scritti nel database.

E gli oneri più grandi del totale non fanno più salire il conto (100 € di lavori
con 500 € di oneri e sconto 10% davano netto 140 €).

## 5. TROVATO CORREGGENDO IL 3: IL RIEPILOGO LEGGEVA UN DATO IN MENO

La query del Riepilogo chiedeva `id,numero,titolo,stato,data,ribasso_perc` —
**senza `tipo`**. Da quando il conto guarda il tipo, il Riepilogo avrebbe
trattato ogni computo come privato e mostrato, per lo stesso computo pubblico,
una cifra diversa da quella dell'elenco.

Due schermate, due numeri: è il difetto delle fatture del 13 agosto, in
un'altra stanza. Trovato **mentre si correggeva**, che è dove il 12 agosto era
già stato scritto di guardare: *«il difetto nuovo sta nella riga che hai appena
toccato»*.

## ⚠️ LA LEZIONE — DUE FALSI ALLARMI, TUTTI E DUE MIEI

1. **«Il ribasso con la virgola vale zero»** sembrava il difetto più grosso di
   tutti: passando `'12,5'` a `compRiepilogo` il conto dava 0. Ma nel gestionale
   vero quella stringa **non arriva mai**: `computoSalva` legge il campo con
   `_numeroIt` (la sua «rete di sicurezza») e nel database ci finisce il numero
   12.5. La prova stava provando una cosa che non succede. Controllo tolto, e al
   suo posto quello che prova il percorso vero, nel browser.
2. **Quattro righe rosse su quattro** nella prova dei soldi: chiamava
   `compNetto()` dalla pagina e riceveva sempre `null`, perché le funzioni del
   gestionale stanno nel loro scope e da fuori non si vedono. Poi, sistemata
   quella, la regex cercava `«81.000,00»` mentre `eur()` scrive **«81.000 €»**,
   senza decimali. Due giri di rosso, zero difetti veri.

**Il conto della sessione: 5 difetti veri nel gestionale, 2 falsi allarmi nelle
prove.** La proporzione di ieri regge ancora.

## COSA DEVE FARE ALESSIO

1. **Lanciare `sql/gest-computo-quantita-3-decimali.sql`** su Supabase (SQL
   Editor → Run). È una sola query, sicura da rilanciare. Senza quella, il
   punto 1 resta aperto: i file HTML da soli non bastano.
2. Il push.

## DOVE SIAMO RIMASTI

**Restano aperte**, in quest'ordine:

*1. Rischio dati — i tre che fanno perdere roba* (letti, non ancora riprodotti):
- **il mezzo eliminato e le sue scadenze.** Guardando il codice: `gest_mezzi`
  passa dal Cestino (`js/cestino.js`), quindi l'eliminazione è una data e la
  cascata `on delete cascade` di `mezzo_id` **non scatta**. Le scadenze restano
  vive e continuano ad avvisare per un mezzo che non c'è più. Da riprodurre;
- il ripristino dal Cestino non ridà l'accesso dal telefono e non lo dice;
- `squadraAdd` crea doppioni se l'invito fallisce.

*2. Rischio conti:* percentuali col punto («Cassa 12.5%») e prezzi di riga a un
decimale (18,5).

*3. Il resto del Computo,* che oggi ha aperto la stanza dei conti ma non tutte:
il quadro economico dei lavori pubblici oltre il riquadro, l'importazione di un
prezzario regionale, i capitoli che il preventivo perde per strada.

*4. Le 18 prove «da capire» del banco.*

*5. Le regole del deposito dei file* (bucket foto e video).

*6. `gestionale-negozio.html` e `gestionale-noleggio.html`*, separatamente.

---

# 14 agosto 2026 (notte, 2) — RISCHIO DATI E RISCHIO CONTI: I CINQUE CHE ERANO SOLO SOSPETTI

I tre «che fanno perdere roba» e i due «che fanno sbagliare i conti» erano in
lista dal **13 agosto mattina** come *letti nel codice, non riprodotti*.
Riprodotti tutti e cinque. **Nessuno era un falso allarme.**

Il banco passa a **60 prove nel giro normale**.

## RISCHIO DATI

### 1. Il furgone venduto che continua ad avvisare

`gest_scadenze.mezzo_id` ha `on delete cascade` nel database, ma col Cestino
quella catena **non scatta mai**: eliminare scrive `eliminato_il`, non cancella
la riga. Riprodotto: eliminato il mezzo, lo Scadenzario diceva ancora
«Revisione del furgone — 01/09/2026», col nome del mezzo e tutto.

Adesso le scadenze vanno nel Cestino **insieme al mezzo**, e tornano su con lui
(`CEST_FIGLI.gest_mezzi`). Prima di eliminare lo dice, coi numeri: «Ha 3
scadenze: vanno nel Cestino insieme a lui e tornano se lo rimetti a posto».

È lo stesso trattamento che il fornitore aveva già dal 12 agosto per le sue
fatture. I mezzi erano rimasti fuori.

⚠️ **Vale da adesso.** I mezzi eliminati prima hanno lasciato le scadenze vive:
`prove-claude/query-scadenze-orfane-14ago.sql` dice se ce ne sono.

### 2. La persona che torna dal Cestino ma dal telefono non entra

Eliminando una persona il gestionale le toglie l'accesso
(`gest_membri.stato='revocato'`) — giusto, se no continuerebbe a entrare da un
elenco dove non compare più.

Ma «Rimetti a posto» rimetteva **solo** `eliminato_il` a null. Lo stato restava
`revocato`: la persona tornava in elenco, sembrava tutto a posto, e la mattina
dopo l'operaio non entrava. Il messaggio diceva «Rimesso a posto ✔».
Riprodotto: **zero scritture su `gest_membri`, nessun avviso.**

L'accesso **non** si riaccende da solo — chi è stato eliminato può non doverci
più entrare, e riaccenderlo di nascosto sarebbe peggio. Ma adesso si dice:
«Rimesso a posto ✔ — ma dal telefono NON entra: apri la sua scheda e rimandale
il link d'invito».

### 3. Le persone doppie quando l'invito non parte

`squadraAdd` scrive in due tabelle: prima la persona, poi il suo invito. Se la
seconda fallisce — la rete che cade in cantiere — la persona resta scritta e la
funzione esce con «Errore invito». Chi ripreme Aggiungi si ritrova **due Mario
Bianchi**, uno senza accesso, e deve capire quale eliminare.
Riprodotto: due tentativi, due persone.

Adesso la persona appena creata si tiene da parte (`_sqOpAppenaCreato`): al
secondo tentativo non se ne fa un'altra, si riprova **solo l'invito**, e il
messaggio lo dice. Provato: due tentativi falliti = **una persona sola**.

## RISCHIO CONTI

### 4. «Cassa previdenziale 12.5%» — col punto

Su fatture, parcelle e incarichi le percentuali finivano stampate **col punto**:
cassa, ritenuta d'acconto, IVA, aliquota di riga. In Italia un numero si scrive
con la virgola, e questi sono documenti che vanno al cliente e al
commercialista. `_pct` esisteva già dal Computo: **quattordici punti** non la
usavano.

### 5. I prezzi a un decimale: «18,5» invece di «18,50»

Le caselle del prezzo di riga (fatture e preventivi) usavano `_numTesto`, che
taglia gli zeri in coda. Un prezzo di 18,50 € si rileggeva «18,5».

Non sbaglia un conto: sbaglia quello che si legge. `_prezzoTesto` esiste dal 13
agosto apposta — *«un prezzo si scrive sempre con ALMENO due decimali»* — e lì
non veniva usata. **È la stessa storia del «1,00 parti» del Computo, al
contrario:** la funzione giusta c'è, e nel posto sbagliato se ne usa un'altra.

I quattro decimali dei prezzari regionali non si perdono (12,3456 resta
12,3456), e una riga nuova resta **vuota**, non «0,00».

## ⚠️ LA LEZIONE — QUATTRO VOLTE, TUTTE MIE

1. **la prova del mezzo** partiva da un mezzo *già* cestinato con la scadenza
   viva: restava rossa anche dopo la correzione, perché quella è la macerie
   lasciata da prima e nessuna modifica al codice torna indietro a sistemarla.
   Si prova l'**azione**, non lo stato;
2. **la prova dei doppioni** faceva fallire la creazione della persona: il finto
   server rispondeva `[]` e il `.select().single()` del gestionale andava in
   errore **prima** di arrivare all'invito. Misurava il banco;
3. e poi, sistemata quella, **contava le chiamate che il suo stesso
   intercettatore rubava**: `«0 persone create»` mentre ne creava due.
   **Verde falso**, il peggiore dei quattro;
4. **la prova dei numeri** pretendeva la funzione nuova (`_prezzoCasella`) e sul
   file di prima non partiva nemmeno — cioè taceva proprio dove il difetto
   c'era. Adesso, se non la trova, usa quella vecchia e diventa rossa. E il
   primo tentativo di sistemarla ha fatto tre rosse false sul file **corretto**,
   perché `let _prezzoCasella` e `function _prezzoCasella` dentro `eval` si
   pestano: si ritaglia come espressione.

**Conto della giornata intera: 13 difetti veri nel gestionale, 8 falsi allarmi
nelle prove.** La proporzione regge da tre giorni.

## COSA DEVE FARE ALESSIO

1. Il push.
2. Lanciare `prove-claude/query-scadenze-orfane-14ago.sql` (guarda e basta):
   se torna righe, sono scadenze di mezzi buttati prima di oggi.

## DOVE SIAMO RIMASTI

**Restano aperte:**

*1. Il resto del Computo* — il quadro economico completo delle gare,
l'importazione di un prezzario regionale, i capitoli che il preventivo perde.

*2. Il resto dei 13 del 13 agosto*, quelli che restano:
- «Ancora nessun reparto» quando il database non risponde (identico a quello che
  vede un utente nuovo);
- il messaggio di eliminazione persona conta le righe invece delle ore e non
  conta le foto caricate dal telefono;
- la Galleria lascia un'opzione vuota nella tendina;
- il Riepilogo fa 25 letture in 6 ondate;
- i 274 colpi del Cestino;
- `gest_richieste` senza nessun file in `sql/`;
- `sql/gestionale-mezzi.sql` non crea la colonna `tipo` che il codice usa.

*3. Le 18 prove «da capire» del banco.*

*4. Le regole del deposito dei file* (bucket foto e video).

*5. `gestionale-negozio.html` e `gestionale-noleggio.html`*, separatamente.

---

# 14 agosto 2026 (notte, 3) — I 7 FASTIDI: LA LISTA DEL 13 AGOSTO SI CHIUDE

Chiusi gli ultimi 7 punti rimasti dal 13 agosto mattina. Due erano **più
grossi** di come erano stati classificati; uno **non l'ho corretto**, e sotto
c'è scritto perché.

Il banco passa a **62 prove nel giro normale**.

| file | cosa cambia |
|---|---|
| `gestionale-app.html` | i reparti che non si leggono · le ore vere · le foto dal telefono · il filtro della Galleria |
| `sql/gest-buchi-schema.sql` | **DA LANCIARE**: `gest_mezzi.tipo` e `gest_richieste` |

## 1. «ANCORA NESSUN REPARTO» — era peggio di un fastidio

`renderLanding` non guardava l'errore della lettura dei reparti. Se la
connessione cadeva, `mest` restava vuoto, la lista si svuotava, e al suo posto
compariva **lo stesso identico messaggio che vede uno appena iscritto**:
«Ancora nessun reparto. Creane uno qui sotto 👇».

Uno con tre reparti pieni di lavori apre il gestionale e legge che non ha
niente. La prima cosa che pensa è di aver perso tutto — e la seconda è di
crearne un altro, che è il modo di fare davvero il danno.

Adesso: i reparti **non si svuotano** (resta quello che il browser ha già in
mano), si dice che è la connessione, c'è un pulsante **Riprova**, e il modulo
«crea reparto» si **nasconde** finché il guasto è in corso.

## 2. IL MESSAGGIO DI ELIMINAZIONE PERSONA — due numeri sbagliati su tre

È il messaggio su cui si decide se eliminare una persona. Due dei tre numeri
erano falsi:

- **le ORE erano le RIGHE.** `_n()` conta con `count:"exact"`: dodici
  registrazioni da otto ore diventavano «12 ore registrate» invece di **96**;
- **le FOTO DAL TELEFONO non si contavano MAI.** L'app dell'operaio scrive
  `operatore: MIO.nome` — il **nome**, «Wahid» — e qui si cercava
  `operatore = <uuid>`. Due cose diverse: il conto tornava **zero sempre**, ed
  è proprio dal telefono che se ne caricano di più.

Adesso le ore si sommano davvero e le foto si cercano per nome (e per id, per
la roba vecchia).

## 3. LA GALLERIA CHE RESTAVA VUOTA

Eliminata l'ultima foto di una persona, quella spariva dalla tendina ma
`galFilter` restava puntato su di lei: tendina su «Tutti», Galleria **vuota**,
e l'unico modo di uscirne era ricaricare la pagina. Adesso, se il valore scelto
non esiste più, il filtro torna su «Tutti». Uguale per il cantiere.

## 4-5. I DUE BUCHI NELLO SCHEMA — `sql/gest-buchi-schema.sql`

`gest_mezzi.tipo` (mezzo / attrezzatura) e la tabella `gest_richieste` **non
compaiono in nessun file di `sql/`**, benché il gestionale le usi tutti i
giorni. Sul database di Alessio ci sono: il buco è nei file, che sono la fonte
di verità dello schema. Chi rifacesse il database da zero avrebbe un gestionale
che si apre e poi dà errore appena tocca la sezione sbagliata.

Provato su un **PostgreSQL 16 vero**: creazione da zero, rilancio (idempotente),
il vincolo che rifiuta un `tipo` inventato, e il lucchetto di `gest_richieste` —
uno non legge le richieste di un altro, non ne scrive per conto di altri, e
**non può riscriversi da solo la risposta** (nessuna policy di update).

## 6-7. LE 25 LETTURE E I 274 COLPI — ⚠️ MISURATI, NON CORRETTI

Questo è il punto onesto della sessione.

**Misurato** con `nuove/quante-letture.py`:

- aprendo un reparto: **25 letture**, e `gest_operatori` chiesta **5 volte** da
  cinque punti diversi (contatori, lavori, squadra, galleria, manodopera);
- il **Cestino non si ridisegna doppio**: 18 letture, una per tabella. I «274
  colpi» non si riproducono all'apertura.

**Non corretto**, di proposito. Ridurre quelle 5 letture vuol dire toccare
**dodici punti** che chiedono la stessa cosa, in zone che oggi funzionano
(squadra, lavori, galleria). In coda a una sessione lunga è esattamente il modo
di infilare un difetto nuovo — ed è scritto qui dentro dal 12 agosto: *il
difetto nuovo nasce nella riga che hai appena toccato*.

Al suo posto c'è una **rete**: la prova fissa i numeri di oggi (25 letture, max
5 sulla stessa tabella) e diventa rossa se qualcuno ne aggiunge. Non risolve lo
spreco: impedisce che peggiori mentre nessuno guarda. Quando la riduzione si
farà, si abbassa il tetto e la prova resta rossa finché non è vera.

## ⚠️ LA LEZIONE — SEI RIGHE ROSSE FALSE, IN TRE MODI NUOVI

1. **chiamavo le funzioni del gestionale dalla pagina** (`renderLanding()`,
   `renderGalleria()`): stanno nel loro scope e da fuori non si vedono. È la
   terza volta oggi che ci casco;
2. **le rotte registrate nell'ordine sbagliato**: in Playwright vince
   l'**ULTIMA** route registrata, non la prima. Le mie «rotte rotte» stavano
   prima di quella generale, che se le mangiava: la prova misurava un
   gestionale a cui non era caduto proprio niente, e chiamava rosso un
   messaggio che non era mai comparso;
3. **contavo un numero che il finto server non sa produrre**: `_nFile` usa
   `count:"exact",head:true`, e l'harness non lo implementa. Il numero non
   arriva mai. Adesso la prova guarda **cosa il gestionale chiede** (le foto
   cercate per nome), non quanto conta.

Aggiunto all'harness `rotte_extra=`: far cadere una lettura **dal primo
caricamento**, che è il caso vero — prima si poteva romperla solo dopo, che è
un caso più facile e diverso.

**Conto della giornata: 20 difetti veri corretti, 14 falsi allarmi nelle
prove.** Quattro su cinque, come dal 13 agosto.

## COSA DEVE FARE ALESSIO

1. Lanciare **`sql/gest-buchi-schema.sql`** su Supabase.
2. Il push.

## DOVE SIAMO RIMASTI

**La lista dei 13 del 13 agosto è chiusa.** Restano:

*1. La riduzione delle letture* (25 all'apertura, `gest_operatori` × 5): tocca
dodici punti, va fatta con calma e da sola. La rete c'è già.

*2. Il resto del Computo* — il quadro economico completo delle gare,
l'importazione di un prezzario regionale, i capitoli che il preventivo perde.

*3. Le 18 prove «da capire» del banco* — il traguardo: 0 rosse e 0 gialle.

*4. Le regole del deposito dei file* (bucket `gestionale-foto` e
`gestionale-video`), mai guardate. Ci sta dentro `foto_team_delete`.

*5. `gestionale-negozio.html` e `gestionale-noleggio.html`*, separatamente e
dopo impresa e professionisti.

**E la cosa che non è codice:** al 14 agosto **nessuno usa ancora il
gestionale**. Le tre zone dove si perdevano soldi o dati sono state guardate e
chiuse; quello che manca adesso non è una correzione, è il primo che lo apre.

---

# 14 agosto 2026 — IL PRIMO MINUTO: DA 11 TOCCHI A 6

Prima volta che si tocca il gestionale **non per correggere un difetto**, ma
perché la strada era troppo lunga. Nasce da un fatto: al 14 agosto **nessuno
dei 61 iscritti usa il gestionale**, e nessuno dei 20 difetti corretti oggi
c'entrava con questo.

## LA MISURA, PRIMA DI TOCCARE NIENTE

`nuove/quanto-lontano-e-il-preventivo.py`: non cerca difetti, **conta una
distanza**. Il caso è quello di Tony, idraulico, uno degli iscritti veri: apre
il gestionale dal telefono, sotto un lavandino, perché il cliente gli ha
chiesto quanto viene. Account nuovo, iPhone vero.

**Prima: 11 tocchi · 7 cose da scrivere · 5 schermate · 2 muri.**

E la prima schermata diceva «Gestionale Multiservizi — SCEGLI IL REPARTO», con
sotto la spiegazione che i reparti non si mischiano. In tutta la schermata
**non comparivano mai le parole «preventivo», «lavoro» o «cliente»**: nessuna
delle tre cose per cui era entrato.

**Dopo: 6 tocchi · 4 da scrivere · 4 schermate · 0 muri.**

## 1. IL PRIMO REPARTO SE LO CREA IL GESTIONALE

I primi tre tocchi servivano solo a creare un «reparto» — parola che a un
idraulico che lavora da solo non dice niente. Adesso, all'account nuovo, il
primo reparto si crea da solo col nome della sua attività
(`imprese.nome_attivita`) e ci si entra dentro subito.

**I tre paletti**, e sono la parte importante:

1. **mai se la lettura è fallita.** Col database giù la lista arriva vuota per
   un guasto, non perché non ha reparti: crearne uno vorrebbe dire aggiungerne
   uno vuoto a chi ne ha tre pieni. È il difetto corretto stamattina, girato
   al contrario;
2. **mai a chi ne ha già uno**;
3. **mai due**, anche con due `renderLanding` di fila (`_repartoAuto`).

Senza nome attività: «I miei lavori» (o «Il mio studio» per i tecnici). Mai
«Reparto 1».

`nuove/primo-reparto.py`, 8 controlli: tutti e tre i paletti provati, più il
nome e l'ingresso automatico.

## 2. IL PDF NON SI FERMA PIÙ ALLA FINE

`prevPdf` diceva: niente Dati azienda, niente PDF — e apriva un modulo da **18
caselle**. Lo stop arrivava nel momento peggiore: preventivo scritto, salvato,
premi «Scarica PDF» e scopri che devi fare altro. Erano gli ultimi 2 tocchi di
11, ed è il punto in cui uno molla, perché pensava di aver finito.

Adesso il PDF **esce lo stesso**, e si vede a un metro che non è da mandare:

- **fascia rossa in cima a ogni pagina**: «BOZZA - NON DA CONSEGNARE: mancano
  il nome dell'attività e la partita IVA»;
- **«BOZZA-» nel nome del file** — è quello che si legge nella cartella dei
  download e nell'allegato dell'email, gli ultimi due posti in cui ci si può
  ancora accorgere;
- il messaggio dice dove metterli, senza obbligare.

Chi i dati ce li ha non vede nessuna differenza.

## 3. LA PRIMA SCHERMATA PARLA DI QUELLO PER CUI È ENTRATO

- «Gestionale Multiservizi / Scegli il reparto» → **«Il tuo gestionale /
  Lavori, preventivi e fatture»**;
- «Ogni reparto è separato: lavori, clienti, squadra e calendario non si
  mischiano» → **«Apri il tuo lavoro qui sotto: dentro ci trovi lavori,
  preventivi, fatture e clienti»**;
- «➕ Nuovo reparto» → «➕ Aggiungi un reparto», con sotto la spiegazione:
  *serve solo se tieni separate due attività, per esempio idraulica e
  giardinaggio*.

I reparti non spariscono: smettono di essere la prima cosa che ti si chiede.

## ⚠️ LA LEZIONE — LA PROVA CHE SEGUE UN PERCORSO CHE NON ESISTE PIÙ

Quattro modi nuovi di sbagliare, tutti nella prova della misura:

1. **premeva «Nuovo reparto» anche dopo la correzione**, perché ripeteva un
   percorso fisso invece di seguire quello che il gestionale offre: il numero
   non sarebbe sceso mai. Adesso guarda se è già dentro e salta;
2. **il finto server non risponde alle scritture**: il reparto automatico non
   nasceva e la misura contava i tocchi di un gestionale a cui non era stato
   dato modo di funzionare;
3. **contava il muro del PDF cercando la parola «azienda» nel messaggio** — e
   il messaggio nuovo la contiene per dire *dove* mettere i dati. Un muro che
   non c'era più, contato per una parola;
4. **contava il tocco del PDF due volte**, una per parte: il totale usciva 7
   invece di 6. Una misura che gonfia il numero è sbagliata quanto una che lo
   sgonfia.

## COSA DEVE FARE ALESSIO

Il push. Nessuna query questa volta.

## DOVE SIAMO RIMASTI

Il gestionale, dal punto di vista dei difetti, è in buona forma: 63 prove,
0 rosse. Quello che resta è **lavoro scelto**:

*1. Il resto del primo minuto.* La misura sta lì e si rilancia: quando si
tocca qualcosa lungo quella strada, si rivede se il numero scende. Prossimi
candidati: il menu ☰ (un tocco solo per arrivare ai Preventivi), e il titolo
obbligatorio del preventivo.

*2. La riduzione delle letture* (25 all'apertura, `gest_operatori` × 5).

*3. Il resto del Computo,* le 18 prove «da capire», il deposito dei file,
negozio e noleggio.

**E la cosa vera:** il gestionale adesso si lascia usare in 6 tocchi. Perché
qualcuno li faccia, serve che sappia che esiste — e quella non è una riga di
codice.

---

# 14 agosto 2026 (notte) — CHI SE N'È ANDATO

Alessio: «vorrei avere una funzione dove mi dice se qualcuno se n'è andato,
ha fatto annulla iscrizione — e nello stesso momento controllare se funziona
annulla iscrizione».

Due domande in una frase, ed è giusto che stiano insieme: la seconda è la
condizione della prima.

## LA COSA DA CAPIRE PRIMA DI TUTTO

La domanda «se n'è andato qualcuno?» oggi **non aveva risposta**. Non è che
il pannello non la mostrava: il dato non esisteva proprio.

`elimina-account.js` faceva una cosa sola — `auth.admin.deleteUser()` — e da
quel momento non restava nessun posto dove fosse scritto che quella persona
c'era. Contare gli iscritti non basta: un numero fermo può voler dire nessuno
entrato e nessuno uscito, oppure tre entrati e tre usciti. Sono due mondi
diversi e da fuori si vedono uguali.

## PRIMA METÀ: «ANNULLA ISCRIZIONE» FUNZIONA?

Verificato sul database vero, non letto:

- tutte e **49** le tabelle agganciate all'account hanno la cascata
  (`confdeltype = 'c'` su tutte, nessuna che blocca): chi chiede di essere
  cancellato viene cancellato davvero, e la cancellazione non può fallire per
  colpa di un vincolo;
- **0 profili rimasti senza account** (71 profili, 72 account: il tuo in più);
- `imprese` sparisce con l'utente.

Quindi sì, funziona. Il problema era l'altro: non restava niente.

## SECONDA METÀ: LA RIGA DI CONGEDO

`sql/iscrizioni-annullate.sql` — una tabella sola, scritta e letta **solo dal
server**: RLS accesa, nessuna policy, `revoke all ... from anon, authenticated`.
Dentro ci sono le email di persone che hanno chiesto di essere cancellate: è
la lista peggiore da far uscire.

**La scelta più importante del file:** `user_id` NON ha `references auth.users`.
Con il collegamento, la riga sparirebbe *nello stesso momento* in cui l'account
viene eliminato — cioè la tabella fatta per ricordare chi se n'è andato si
dimenticherebbe esattamente di chi se n'è andato. E non si vedrebbe mai:
resterebbe lì, vuota, e sembrerebbe che non se ne sia andato nessuno.

`elimina-account.js` adesso scrive quella riga **prima** di cancellare.

## ⚠️ LA REGOLA CHE NON SI TOCCA

**Se la scrittura della riga fallisce, la cancellazione si fa lo stesso.**

Il diritto di una persona a sparire viene prima di qualsiasi statistica — e
viene anche prima della legge, che su questo non lascia margini. Non si fa mai
fallire una cancellazione per non aver potuto prendere nota: sarebbe come non
lasciar disdire un abbonamento perché il registro è pieno.

Sta scritto nel codice in maiuscolo, e la prova `nuove/annulla-iscrizione.js`
rompe la scrittura in quattro modi diversi (database che rifiuta, tabella che
non esiste, connessione che cade, profilo illeggibile) e pretende che
l'account sparisca comunque. Quei quattro controlli sono verdi anche sul file
di prima, ed è giusto: sono la rete, non la novità.

## LA SCHERMATA — E LA BUGIA CHE POTEVA DIRE

`admin.html` → **👋 Chi se n'è andato**. In cima cinque numeri, sotto
l'elenco con filtri.

Il rischio vero di questa schermata non è mostrare male i dati: è che una
**lista vuota vuol dire due cose opposte**.

1. *La tabella non è ancora stata creata* (la query non è stata lanciata).
   Qui «non se n'è andato nessuno» sarebbe la bugia peggiore possibile: si
   legge come una buona notizia mentre vuol dire che non stiamo registrando
   niente. Adesso dice quale file eseguire.
2. *La tabella c'è ed è vuota.* Qui «nessuno» è vero — ma va detto **da
   quando**: chi se n'è andato prima del 14 agosto non c'è e non si recupera.

`nuove/admin-abbandoni.py`, 12 controlli, prova tutte e tre le situazioni.
Nei due versi: sul pannello di prima **11 rossi su 12**, sul nuovo **0**.

Altre due cose corrette lungo la strada, trovate dalla prova:
- `_abDurata(44)` diceva «1 mesi» — sbagliato in italiano, e buttava via
  l'informazione che serve di più (fra 31 e 59 giorni la differenza è tutta).
  I giorni adesso si tengono fino a due mesi;
- `.admin-badge` era a `0.78rem` = **12,48 px**, sotto la soglia dei 13.

Sul database non si dà mai indietro un numero solo dove serve capire: la
durata è la **mediana**, non la media — un account durato tre anni sposterebbe
la media e farebbe sembrare che durano tutti tanto.

## LA DOMANDA DEL PERCHÉ

`cancella-iscrizione.html`: una tendina facoltativa, e **si vede che lo è**
(«se ti va — non è obbligatorio»). Chi vuole solo andarsene preme il pulsante
rosso e non gli si chiede niente. Non è un ostacolo per farlo restare — quelli
fanno arrabbiare e basta — è l'unica occasione in cui si può sapere cosa non
ha funzionato: dopo non c'è più nessuno a cui chiederlo.

## ⚠️ LA LEZIONE — DUE BUGIE, TUTTE E DUE MIE

La prova del pannello ha dato **10 rossi su 12** su un pannello che
funzionava. Due cause, tutte e due nella prova:

1. **La pagina aperta da file://.** Ogni `fetch('/.netlify/functions/...')`
   diventava `file:///.netlify/...`: non esiste, e Playwright non intercetta
   il disco. Poi il CDN di Supabase non rispondeva, `window.supabase` restava
   `undefined`, la riga `.createClient(...)` esplodeva e da lì in poi tutto il
   blocco `<script>` non veniva più eseguito. Le funzioni restavano (si issano
   prima), le `let` no: ecco da dove veniva «Cannot access '_abFiltro' before
   initialization». Sembrava un errore di ordine nel mio codice. Non lo era.
2. **L'ordine delle rotte.** La rotta specifica registrata **prima** di quella
   generale: in Playwright vince l'**ultima**, quindi la generale se la
   mangiava e la pagina riceveva sempre una lista vuota. Tutte e tre le
   situazioni sembravano «non se n'è andato nessuno». *È la stessa trappola in
   cui ero già cascato stamattina con le rotte rotte del gestionale.*

E un **verde bugiardo**, che è peggio: il controllo «non dice che non se n'è
andato nessuno» passava anche sul pannello di prima, dove la sezione non
esiste proprio — casella assente, testo vuoto, «nessuno» non compare, verde.
Una riga verde che sarebbe verde anche a pannello spento non dice niente.

Sono quindici e sedici. La regola regge: **quattro volte su cinque, quando una
prova dice il falso, il bugiardo è la prova.**

## ⚠️ TRE COSE VISTE, NON ANCORA DECISE

Guardando le 49 tabelle che spariscono con l'account, tre non dovrebbero:

1. **`ai_credit_purchases`** — gli acquisti. Sono scritture contabili: chi ha
   pagato ha pagato, e quella riga serve a te anche dopo. **Questa è quella
   con dentro i soldi.**
2. **`segnalazioni`** — spariscono insieme a chi ha segnalato. Se uno segnala
   un annuncio e poi si cancella, la segnalazione svanisce anche se il
   problema resta.
3. **`supporto_messaggi`** — la conversazione di assistenza sparisce.

Nessuna delle tre è stata toccata: vanno decise, non indovinate.

E una quarta: **la tabella `imprese` non sta in nessun file `sql/`.** Esiste
solo sul database. Se domani serve rifarla, non c'è da dove.

## COSA DEVE FARE ALESSIO

1. La query `sql/iscrizioni-annullate.sql` (una sola, tutta insieme).
2. Il push.
3. I clic scritti nella chat.

## DOVE SIAMO RIMASTI

65 prove nel banco, 0 rosse. La lista parte da adesso: chi se n'è andato
prima del 14 agosto non c'è, e non si può recuperare — è la ragione per cui
questa era una cosa da fare subito e non «quando ci sarà tempo». Ogni giorno
che passava era gente di cui non sapremo mai niente.

---

# 14 agosto 2026 (notte, 2) — I SOLDI CHE SPARIVANO

Alessio: «ok partiamo da acquisti».

## IL DIFETTO, RIPRODOTTO

`ai_credit_purchases` era agganciata all'account con la cascata:

    user_id uuid not null references auth.users(id) on delete cascade

Quindi «annulla iscrizione» si portava via anche la ricevuta.

Riprodotto su un **PostgreSQL 16 vero**
(`prove-claude/banco/gest/nuove/soldi-che-spariscono.sql`): Tony compra 50 €
a marzo e 20 a giugno, poi si cancella. La tabella resta a **0 righe e 0
euro**. Con la correzione, gli stessi due acquisti restano e il totale
continua a dire 70.

Il danno non è perdere una riga: è che **il totale dell'anno diventa più
basso e continua a sembrare giusto**. Non se ne accorge nessuno, mai.

## LA CORREZIONE — `sql/acquisti-non-spariscono.sql`

Via il vincolo con la cascata, e `user_id` può restare vuoto.

Due cose fatte apposta:

1. **Il nome del vincolo non è scritto a mano.** Su un database vero può
   chiamarsi in tanti modi: la query lo *cerca* e toglie quello. Scriverlo a
   mano voleva dire una query che dà errore da te e che io non posso provare.
2. **`drop not null` su `user_id`.** Serve al caso in cui qualcuno chieda di
   cancellare anche quel numero: si svuota il campo e **la riga contabile
   resta**. Senza, quella richiesta non si potrebbe esaudire in nessun modo
   se non buttando via la ricevuta. Quasi me lo dimenticavo: è entrato nel
   collaudo come controllo a sé.

## E IL DIRITTO DI SPARIRE

Resta intero: **qui dentro non c'è il nome di nessuno.** Importo, data,
riferimento Stripe. La divisione è questa — TrovaImpresa tiene i NUMERI,
Stripe tiene CHI (ce l'ha già, e per legge lo tiene lui). Si risale da
`payment_reference`.

## IL COLLAUDO — `nuove/soldi-collaudo.sh`

10 controlli su PostgreSQL 16 vero, con la query **vera** di `sql/`, non una
copia. Il primo è il più importante: pretende che **sullo schema di prima la
sparizione succeda davvero**. Se non succede, lo schema di partenza non è
quello del sito e nemmeno i verdi che vengono dopo valgono niente.

Controlla anche quello che **deve** continuare a sparire (i crediti ancora da
spendere: quelli sono roba sua) e che la ricarica dopo un pagamento funzioni
ancora, webhook doppio compreso.

Nei due versi: senza la query **4 problemi su 10**, con la query **0**.

## ⚠️ QUELLO CHE HO TROVATO CERCANDO — È PIÙ GROSSO

Cercando altre strade dei soldi, letto `stripe-webhook-abbonamenti.js`. Fa
questo, e solo questo:

    imprese.piano = 'premium', premium_pagato = true
    imprese.gestionale_attivo = true

**Degli abbonamenti non esiste nessuna riga da nessuna parte.** Non è che
sparisce con la cascata: non viene *mai scritta*. Niente importo, niente
data, niente riferimento Stripe. Solo una spunta sul profilo.

Vuol dire che **anche adesso, con la persona ancora iscritta**, dal database
non si può sapere quando ha pagato, quanto, né quante volte ha rinnovato. E
quando si cancella, sparisce pure la spunta.

Stessa cosa in piccolo per la pubblicità: `annunci_pubblicitari` tiene
`stato='pagato'` e `stripe_session_id`, ma **non il prezzo pagato** — viene
ricalcolato ogni volta da un listino che può cambiare.

Quindi: la tabella sistemata stanotte era **la più piccola delle tre**, ed
era l'unica che almeno esisteva.

⚠️ Il passato non si recupera in nessun caso: quei pagamenti non sono mai
stati scritti. L'unica fonte è Stripe.

## COSA DEVE FARE ALESSIO

1. La query `sql/acquisti-non-spariscono.sql`.
2. La query `prove-claude/query-dove-sono-i-soldi-14ago.sql` (guarda e basta):
   dice quanto è grande il buco degli abbonamenti.
3. Il push.

## DOVE SIAMO RIMASTI

66 prove nel banco, 0 rosse.

Delle tre cose in sospeso ne resta una e mezza: **segnalazioni** e **messaggi
di assistenza**. E se ne è aggiunta una più grande delle tre: **gli
abbonamenti non lasciano traccia**.

---

# 14 agosto 2026 (notte, 3) — (a) I PAGAMENTI SI SCRIVONO

Alessio: «facciamo a b c uno alla volta». Questa è la **a**.

## PERCHÉ ADESSO CHE NON C'È NIENTE

Contati sul database il 14 agosto: **0 Premium paganti, 1 gestionale attivo,
1 annuncio pagato, 0 ricariche di crediti.**

Il buco c'è ma dentro non ci è ancora caduto quasi niente — ed è per questo
che è il momento giusto. Mettere le mani sul percorso dei pagamenti mentre i
soldi passano davvero è un'altra cosa.

⚠️ E i «premium» che si vedono in giro sono quelli **regalati** dal pannello:
`premium_pagato` diventa `true` solo quando paga Stripe.

## COSA C'ERA PRIMA

    imprese.piano = 'premium', premium_pagato = true
    imprese.gestionale_attivo = true

Una spunta. Nessun importo, nessuna data, nessun numero di transazione.
**Non era un dato che spariva con la cascata: non veniva mai scritto.** Anche
con il cliente ancora iscritto e pagante non si poteva sapere quando aveva
pagato, quanto, né quante volte aveva rinnovato.

Per la pubblicità restava `stato='pagato'` e il numero della sessione, ma non
il prezzo — ricalcolato ogni volta da un listino che può cambiare.

## LA TABELLA — `sql/pagamenti.sql`

Niente `references` a `auth.users` né a `imprese`: stessa lezione di
`iscrizioni_annullate`.

Tre scelte che contano:

1. **I soldi si tengono in centesimi, interi.** Stripe li manda così, e sono
   interi apposta: 19,99 non esiste come numero con la virgola nei computer,
   e a forza di somme un centesimo si perde. Gli euro li calcola PostgreSQL
   con `numeric`, che non sbaglia. Il collaudo somma 19,99 tre volte e
   pretende esattamente 59,97.
2. **`riferimento` UNIQUE.** È la riga che impedisce di contare due volte:
   Stripe ripete gli avvisi di suo, e senza questo 99 euro diventano 198.
3. **Una funzione, non un `insert` in due file.** `registra_pagamento()` sta
   nel database: la regola è in un posto solo e vale per tutti e due i
   webhook. Due copie della stessa cosa vuol dire correggerne una sola.
   (Un modulo condiviso in `netlify/functions/` era l'altra strada: scartata
   perché in quella cartella non c'è **nessun** file condiviso oggi, e
   inaugurare quel modo proprio sul percorso dei soldi, senza poter provare
   un deploy da qui, non valeva il rischio.)

## ⚠️ CRITICO — IL REVOKE SULLA FUNZIONE

`registra_pagamento` è `security definer`: scavalca RLS. Se resta eseguibile
da un utente qualsiasi del sito, **quello si scrive incassi finti a piacere**
e la contabilità diventa carta straccia. È la stessa riga che sta sotto
`add_credits_pack` («senza questo revoke un utente si autoricarica crediti»).
È il controllo più importante del collaudo.

## I DUE WEBHOOK

⚠️ **LA REGOLA CHE NON SI TOCCA: se prendere nota fallisce, l'attivazione si
fa lo stesso.** Uno ha pagato, deve avere quello che ha pagato. Non gli si
nega il Premium perché noi non siamo riusciti a scrivere una riga di appunti.
È elimina-account.js visto dall'altra parte.

E non si risponde mai «errore» a Stripe per colpa di quella riga: Stripe
rimanderebbe l'avviso, e l'attivazione si rifarebbe a ripetizione per niente.

**I rinnovi.** Un abbonamento che si rinnova NON rifà
`checkout.session.completed`: quello succede solo la prima volta. L'anno dopo
arriva `invoice.paid`. Senza quel pezzo si registrerebbe il primo pagamento e
nessuno di quelli dopo — il modo più facile di avere una contabilità che
sembra a posto e non lo è.

⚠️ **Perché funzioni, `invoice.paid` va acceso anche dalla parte di Stripe**
(Dashboard > Developers > Webhooks > l'endpoint degli abbonamenti > Select
events). Se non lo si accende, il codice non fa danni: non arriva mai niente.

**E la trappola che quasi mi sfuggiva:** quando uno si abbona, Stripe manda
DUE avvisi per lo stesso pagamento — la sessione e la prima fattura. Hanno
due numeri diversi, quindi l'UNIQUE non li riconosce come lo stesso incasso.
Senza saltare `billing_reason = 'subscription_create'`, **ogni abbonamento
nuovo verrebbe contato due volte**. È entrato nel collaudo come controllo a sé.

## LE PROVE

- `nuove/pagamenti-collaudo.sh` — 10 controlli su PostgreSQL 16 vero, con i
  ruoli di Supabase creati apposta (`anon`, `authenticated`, `service_role`:
  senza, il `grant` in fondo dà errore e la prova accuserebbe una query sana).
  Senza la query: **7 problemi su 10**.
- `nuove/pagamenti-webhook.js` — 14 controlli sui file veri. Sui file di
  prima: **8 problemi su 14**. I 6 che restano verdi sono la rete
  (l'attivazione avviene comunque, la disdetta, l'avviso senza email) — ed è
  giusto che siano verdi anche prima.

## ⚠️ LA LEZIONE — LA DICIASSETTESIMA

Tre righe rosse sul lucchetto, su una query sana. Confrontavo con `"f"`:
`has_table_privilege(...)::text` in PostgreSQL fa **`false`**, non `f`. Le
lettere sole t/f sono come psql *stampa* un booleano, non come si converte.

Sempre la stessa forma: prima di credere al rosso, chiedersi se a parlare è
il database o la prova.

## COSA DEVE FARE ALESSIO

1. La query `sql/pagamenti.sql`.
2. Su Stripe, accendere `invoice.paid` sull'endpoint degli abbonamenti.
3. Il push.

## DOVE SIAMO RIMASTI

68 prove nel banco, 0 rosse.

Restano la **b** (l'annuncio pagato che sparisce con l'impresa) e la **c**
(segnalazioni, messaggi di assistenza, e il resto del gestionale).

Da guardare, prima o poi: la tabella `pagamenti` non ha ancora una schermata
nel pannello. Una tabella che nessuno guarda è a metà strada.

---

# 14 agosto 2026 (notte, 4) — (b) L'ANNUNCIO GIÀ PAGATO, E LA SCHERMATA INCASSI

## LA (b) SI È RISTRETTA DA SOLA

Dopo la (a), i pagamenti *nuovi* della pubblicità finiscono già in
`pagamenti`, che non sparisce con nessuno. Restava solo **l'annuncio pagato
prima**, incassato quando quella tabella non esisteva: di quell'incasso c'è
solo la riga dell'annuncio, e quella se ne va con l'impresa (cascata,
verificato).

⚠️ La riga dell'annuncio **resta giusto che sparisca**: l'annuncio è roba
sua. È la *ricevuta* che deve restare, e adesso sta da un'altra parte.

## ⚠️ L'IMPORTO NON SI INDOVINA

Si poteva ricalcolare dal listino (mensile × mesi − sconto). Non l'ho fatto:
il listino può essere cambiato da allora, e sarebbe venuto fuori un numero
verosimile e forse sbagliato. **Un numero inventato dentro la tabella dei
conti è peggio che non avere la riga** — perché una riga sbagliata sembra
giusta e non la ricontrolla più nessuno.

Quindi: due file. Uno guarda e tira fuori il numero della sessione Stripe,
l'altro si riempie a mano con l'importo letto **su Stripe**.

## `sql/recupera-annuncio-pagato.sql` — LE GUARDIE

Il file **rifiuta di scrivere** in quattro casi, e lo dice a parole:

1. sessione non riempita;
2. importo a zero;
3. **importo sotto i 5 euro** — se per sbaglio si scrive `49` invece di
   `4900`, dentro la contabilità finisce un incasso da 49 centesimi e non se
   ne accorge più nessuno. Per un annuncio pubblicitario, sotto i 5 euro è
   quasi sicuramente questo l'errore;
4. sessione che non corrisponde a nessun annuncio.

Passa da `registra_pagamento`, non da un `insert` a mano: così vale l'UNIQUE
e rilanciarlo non raddoppia l'incasso.

Provato su PostgreSQL 16 in tutti e sei i casi (i quattro rifiuti, la
scrittura giusta, e il rilancio che dice «c'era già»).

⚠️ E la prima versione **non compilava**: due `%` in un `raise notice` e gli
argomenti sulla riga sotto. Sarebbe arrivata ad Alessio come una query che
dà errore. L'ha trovata la prova, non la rilettura.

# LA SCHERMATA — «💶 Incassi» nel pannello

Alessio: «facciamo una tabella pagamenti nel pannello». Una tabella di conti
che nessuno guarda è a metà strada.

In cima: incassato in tutto, questo mese, ultimi 12 mesi, quanti pagamenti, e
un riquadro per prodotto. Sotto: mese per mese, e l'elenco con filtri.

## ⚠️ I CENTESIMI, ANCHE QUI

Il server somma **interi** e manda centesimi; la pagina divide per 100 una
volta sola, alla fine. Sommare euro con la virgola in JavaScript vuol dire
che tre incassi da 19,99 possono fare **59,970000000000006** — e su una
schermata di conti quella coda di zeri distrugge la fiducia in tutto il
resto. La prova somma proprio tre volte 19,99 e pretende `59,97` senza code.

E come per gli abbandoni: **elenco vuoto ≠ non hai incassato niente.** Se la
tabella non c'è, lo dice e nomina il file da lanciare.

`nuove/admin-pagamenti.py`, 12 controlli. Nei due versi: sul pannello di
prima **11 rossi su 12**, sul nuovo **0**.

## COSA DEVE FARE ALESSIO

1. `prove-claude/query-annuncio-da-recuperare-14ago.sql` (guarda e basta).
2. Cercare quel numero su Stripe > Payments e leggere l'importo vero.
3. Riempire e lanciare `sql/recupera-annuncio-pagato.sql`.
4. Il push, e guardare **💶 Incassi** nel pannello.

## DOVE SIAMO RIMASTI

69 prove nel banco, 0 rosse.

Resta la **c**: segnalazioni, messaggi di assistenza, e il resto del
gestionale (le 18 prove «da capire», il Computo, le letture).

---

# 14 agosto 2026 (notte, 5) — ⚠️ HO SBAGLIATO IL TIPO DI `impresa_id`

## COSA AVEVO SBAGLIATO

In `pagamenti` avevo fatto `impresa_id uuid`. Su TrovaImpresa **`imprese.id`
è un NUMERO**: 67, 68, 69.

Non l'ho scoperto rileggendo il codice. L'ho visto in uno schermo che Alessio
ha mandato per un'altra ragione: la riga vera di `annunci_pubblicitari` aveva
`impresa_id  67`.

## PERCHÉ ERA GRAVE

Non per l'errore in sé — per **come sarebbe fallito**.

Al prossimo annuncio pagato il webhook avrebbe provato a infilare `67` in una
colonna `uuid`, PostgreSQL avrebbe rifiutato, e l'incasso **non sarebbe stato
registrato in silenzio**. In silenzio perché quel pezzo, per progetto, non
blocca il cliente: l'annuncio si attiva regolarmente, la pagina risponde
`200`, e la riga non c'è. Tutto sembra funzionare.

È lo stesso schema del difetto che stavamo tappando: un numero che manca e
sembra giusto.

E il file di recupero dell'annuncio avrebbe dato errore.

## LA CORREZIONE — `sql/pagamenti-impresa-id.sql`

`impresa_id` diventa **testo**. Non «numero»: qui dentro è solo un
riferimento per ritrovare le cose, non una chiave su cui il database deve
ragionare (nessun collegamento, apposta). Come testo ci sta il numero di oggi
e ci starebbe un uuid domani.

## ⚠️ E LA TRAPPOLA DENTRO LA CORREZIONE

Cambiando il tipo di un parametro, `create or replace function` **non
sostituisce niente: crea una SECONDA funzione** con lo stesso nome.
Resterebbero tutte e due — e quella nuova nascerebbe **eseguibile da
chiunque**, perché il `revoke` valeva solo per la vecchia. Cioè: un utente
qualsiasi del sito potrebbe scriversi incassi finti.

Quindi il file fa `drop function` con la firma vecchia, e la verifica in
fondo pretende «una sola».

## LE PROVE

Riprodotto su PostgreSQL 16 prima di correggere:
`ERROR: invalid input syntax for type uuid: "67"`.

Controlli nuovi in tutti e due i collaudi:
- `pagamenti-collaudo.sh` → 12 controlli. Sullo schema sbagliato: **4 problemi**.
- `pagamenti-webhook.js` → 16 controlli. Sui file di prima: **10 problemi**.

Il secondo controlla anche il caso in cui Stripe mandasse l'id come numero
invece che come stringa.

## LA LEZIONE — LA DICIOTTESIMA, E DIVERSA DALLE ALTRE

Le altre diciassette erano prove che dicevano il falso. **Questa era un mio
errore vero, che nessuna delle mie prove poteva trovare**: il banco gira su
uno schema che scrivo io, e io lo scrivevo sbagliato allo stesso modo in
tutti e due i posti. Verde da una parte, verde dall'altra, e il difetto in
mezzo.

Quello che l'ha trovato è stato guardare **un dato vero**. Quando una tabella
del sito non sta in nessun file `sql/` (`imprese` è una di quelle — sta
scritto qui sopra dal 14 agosto), il suo schema io non lo so: lo immagino. E
immaginare, su una colonna che tocca i soldi, non basta.

**Regola nuova:** prima di scrivere una colonna che punta a una tabella che
non ho in `sql/`, farmi mandare una riga vera.

## COSA DEVE FARE ALESSIO

1. La query `sql/pagamenti-impresa-id.sql`.
2. Il push.
3. Poi si torna al recupero dell'annuncio.

## DOVE SIAMO RIMASTI

69 prove nel banco, 0 rosse (i controlli sono saliti da 24 a 28 fra le due
prove dei pagamenti).

---

# 14 agosto 2026 (notte, 6) — ⚠️ GLI AVVISI CHE ALESSIO NON HA MAI VISTO

## LA DICIANNOVESIMA, E LA PIÙ IMBARAZZANTE

`sql/recupera-annuncio-pagato.sql` parlava con `raise notice`. Quattro
guardie, ognuna con il suo messaggio scritto in italiano semplice:
«NON HO SCRITTO NIENTE», «hai scritto gli euro invece dei centesimi», e
così via.

**L'SQL Editor di Supabase i NOTICE non li mostra.**

Sullo schermo di Alessio compariva soltanto:

    Success. No rows returned

che si legge come «fatto», e voleva dire «non ho scritto niente».

Le protezioni c'erano ed erano giuste — a fermarsi si fermava davvero. Ma
l'unica cosa che l'utente vedeva diceva il contrario. È esattamente la
forma di bugia che stiamo cacciando da stanotte (elenco vuoto = buona
notizia), scritta da me, dentro il file che doveva proteggerlo.

E non l'ho scoperta provando: il file lo avevo provato sei volte su
PostgreSQL 16, dove i notice **si vedono benissimo**. Il banco gira in un
posto dove quel canale funziona, il cliente sta in un posto dove non
funziona. Verde di qua, muto di là.

## LA CORREZIONE

Il file adesso è **un solo `select`** che risponde con una RIGA DI
RISULTATO, che l'Editor mostra sempre:

    NIENTE SCRITTO — manca l'importo: cambia lo 0 in cima...
    NIENTE SCRITTO — 49 centesimi fanno 0,49 euro: hai scritto gli euro...
    NIENTE SCRITTO — gli annunci pagati sono 2: ...
    SCRITTO: 49,00 euro per l'annuncio dell'impresa 67 — guardalo nel pannello
    C'ERA GIA' — nessun doppione

Provato in sei casi su PostgreSQL 16: ognuno dà la sua riga.

## GLI ALTRI FILE — CONTROLLATI, STANNO A POSTO

`acquisti-non-spariscono.sql`, `pagamenti.sql`, `pagamenti-impresa-id.sql`
e `iscrizioni-annullate.sql` usano i notice **in più**, ma finiscono tutti
con un `select` di verifica: quello si vede, ed è quello che Alessio ha
letto ogni volta («adesso restano», «chiusa», «solo il server»). Il danno
riguardava solo il file del recupero, che di verifica finale non ne aveva
una che dicesse com'era andata.

## ⚠️ REGOLA NUOVA

**Se una query deve dire qualcosa ad Alessio, glielo dice con una riga di
risultato — mai con `raise notice`.** I notice servono a me quando provo
sul PostgreSQL del banco; a lui non arrivano.

E più in generale: quando provo una cosa in un ambiente diverso da quello
dove finirà, devo chiedermi anche **come si vedrà**, non solo se funziona.

---

# 14 agosto 2026 (notte, 7) — (c) LE PROVE CHE NON POTEVANO DIVENTARE ROSSE

Nel banco c'erano **18 prove «da capire»**: giravano da giorni, e nessuno
aveva mai scritto cosa vuol dire «passata». Non potevano diventare rosse.
Diciotto buchi nella rete, e nove proprio sul **Cestino** — che è la rete di
sicurezza di tutto il resto.

## FATTE LE NOVE DEL CESTINO

Ognuna ha adesso la sua regola (`nuove/regole-cestino.js`), scritta leggendo
il log di quando funzionava e mettendoci dentro **la proprietà che conta**,
non «gira»:

- **t1** — buttato via un reparto, tutto quello che il messaggio aveva
  promesso finisce nel Cestino, e **l'azienda non ci finisce mai**.
- **t2** — «Rimetti a posto»: cestino vuoto, pallino spento, dati tutti vivi.
  Se il pallino dicesse 3 e la lista fosse vuota, uno dei due mentirebbe.
- **t3** — la cancellazione si rompe a metà: deve tornare tutto com'era, e il
  reparto deve restare sulla schermata. Mezzo reparto nel cestino è il caso
  che fa paura.
- **t4** — dopo un'interruzione e il ripristino, niente resta indietro.
- **t5** — con un finto Supabase **fedele** (una scrittura senza `.select()`
  risponde `data: null`, come PostgREST vero — in produzione si passa sempre
  di lì): il pallino deve dire quanto c'è **davvero**. Sette momenti, sette
  confronti.
- **t6** — le cose senza reparto (spese, crediti, prezzi, foto, video) devono
  vedersi nel Cestino in tutte e due le viste. Se sparissero, uno le butta
  via e non le ritrova più.
- **r1** — giro intero: 22 cose tornate vive, cestino a zero, **ore
  comprese** (sono quelle che tengono in piedi il margine dei lavori).
- **r3** — dopo un rollback riuscito il pallino torna a zero.
- **r5** — le 18 domande con la rete giù: il pericolo non è sbagliare il
  numero, è **riciclare**. Su un telefono in cantiere vuol dire batteria e
  traffico bruciati senza che nessuno lo sappia.

## ⚠️ E LE REGOLE, CHI LE CONTROLLA?

Una regola è codice come tutto il resto. Se dice sempre verde, quelle nove
prove tornano esattamente quello che erano.

Quindi c'è `nuove/regole-nei-due-versi.js`: fa girare le nove regole su
**quindici log rotti apposta**, uno per ogni modo in cui quella cosa può
andare storta davvero (l'azienda nel cestino, le ore che non tornano, il
pallino che mente, la rete che ricicla), e pretende il **rosso**.
24 controlli, 0 problemi.

**Alla prima passata quattro regole su quindici non se ne accorgevano.** Non
perché fossero cieche: perché rompevo la PRIMA occorrenza nel log, e quasi
tutti stampano lo stato più volte — la regola guardava l'ultima e restava
verde. Sembrava che la regola fosse rotta mentre era la rottura ad aver
mancato il bersaglio. Adesso si rompe sempre l'ultima, e sta scritto nel file.

## ⚠️ UN DIFETTO VERO, RIPRODOTTO — IL COSTO ORARIO

Guardando il log di `caselle: t-dcosto.js` salta fuori questo:

    DB 22.5     -> casella "35"
    DB 12.5     -> casella "35"
    DB 18.125   -> casella "35"

La scheda della persona mostra **35** qualunque cosa ci sia nel database.

Riprodotto a parte, con le sonde: c'è **un solo** operatore (`o1`), la scheda
aperta è la sua, il database dice 18,125 — e la casella dice 35. E la
navigazione avviene davvero: esce dalla sezione Squadra, va su Lavori, torna,
riapre. Il selettore del tab esiste e viene cliccato (controllato).

**Perché conta:** il costo orario entra nel margine di ogni lavoro. Il giro
che fa male è questo — cambi il costo orario dal telefono; sul computer la
scheda mostra ancora il vecchio perché era già caricata; tocchi il numero di
telefono e premi Aggiorna; **il costo vecchio si riscrive sopra al nuovo**,
in silenzio.

Non l'ho corretto: è la prossima cosa.

## RESTANO NOVE

Cinque del gruppo «persone» e quattro di «caselle». Nei loro log ci sono già
due cose da guardare:

1. `caselle: t-prezzo4.js` stampa «prezzi rovinati: 0/6» **anche quando non è
   riuscita ad aprire la voce di computo** («non ho aperto la voce di computo»).
   È un verde che non prova niente, dentro una prova che sembra passata.
2. `persone: t-finale.js` — dopo aver eliminato Wahid, la tendina «chi l'ha
   caricata» mostra una voce con il nome **vuoto** (`o1 => ""`).

## DOVE SIAMO RIMASTI

70 prove nel banco. Le «da capire» sono scese da **18 a 9**.

---

# 14 agosto 2026 (notte, 8) — IL COSTO ORARIO CHE SI RISCRIVE SOPRA

## LA CAUSA, TROVATA

Non era la casella: era **da dove si aprivano le schede**.

`sq-edit` apriva la scheda con quello che c'era in `dipCache`. E `dipCache`
si riempie **solo** quando la sezione Squadra viene ridisegnata. Il **render
pigro** (nel clic sui tab) ridisegna una sezione solo se è segnata «da
rifare» oppure se sta in `SEMPRE = [lavori, agenda, mappa, richieste, mezzi,
attrezzature]`.

**«squadra» non è in quella lista.** Quindi: entri in Squadra, esci, rientri
— e i dati sono ancora quelli di quando sei entrato la prima volta.

## PERCHÉ NON ERA COSMETICO

Il salvataggio manda **tutti** i campi del modulo. Quindi:

1. cambi il costo orario dal telefono → nel database c'è 25;
2. sul computer la scheda è già caricata e mostra 18;
3. correggi il numero di telefono e premi Aggiorna;
4. parte un update con `costo_orario: 18`. **Il 25 è perso.**

In silenzio, su un numero che entra nel margine di ogni lavoro. E vale per
tutta la scheda: mansione, documenti, scadenze della visita medica.

## LA CORREZIONE

`squadraApri(id)`: prima di aprire, la persona si **rilegge dal database**.

Perché così e non aggiungendo «squadra» a `SEMPRE`: quella strada rilegge
tutta la squadra **più** i membri a ogni apertura della sezione — due letture
ogni volta, e stanotte c'è una rete di sicurezza che tiene fermi i conti
delle letture. Così invece è **una lettura sola, e solo quando apri davvero
una scheda**.

Se la rilettura non riesce (rete giù, in cantiere succede), la scheda si apre
**lo stesso** — bloccarla sarebbe peggio — ma con un riquadro arancione che
lo dice: «quello che vedi potrebbe essere vecchio, salvando riscriveresti
sopra». Non si fa credere che quei numeri siano quelli veri.

Anche il percorso dallo Scadenzario («scad-persona») passa adesso di lì: era
la stessa scheda con lo stesso rischio.

## LA PROVA — `nuove/costo-orario-vecchio.py`

Non guarda solo la casella: guarda **cosa parte verso il database quando
salvi**. Cambia solo il telefono, e pretende che l'update NON contenga il
costo vecchio.

Il cambio del dato si fa **sul server finto, non dentro la pagina**: se lo
cambiassi dentro la pagina misurerei me stesso invece del gestionale.

Nei due versi: sul file di prima **2 problemi su 3**, sul corretto **0**.

## DOVE SIAMO RIMASTI

71 prove nel banco. Le «da capire» restano 9 (persone e caselle).

⚠️ Da guardare quando si torna lì: lo stesso **render pigro** vale per tutte
le sezioni che non stanno in `SEMPRE`. Squadra era la più pericolosa perché
il suo modulo riscrive tutto, ma la domanda «quale altra scheda si apre con
dati vecchi e li risalva?» non è ancora stata fatta fino in fondo.

---

# 14 agosto 2026 (notte, 9) — LA SCHEDA SI APRE CLICCANDOLA

Alessio, guardando Squadra sul sito vero: «per entrare si deve premere
Modifica, cosa che non è corretta, perché se uno vuole solo leggere non preme
Modifica ma entra. Questa modifica è già stata fatta in altri settori».

Ha ragione. E ha ragione anche sul «già fatta»: nel **Riepilogo** la scheda
intera si clicca da sempre (`rie-go`).

## PERCHÉ SI ERA PERSA

`renderTabella` accetta un `click` per ogni riga, e Squadra ce l'ha:
`click:{action:"sq-edit"}`. Ma quel `click` finisce **solo nel ramo tabella**.
Da quando ogni sezione disegna **sempre le schede** (e non più la tabella sul
computer), quel ramo non ci passa più nessuno: il `click` è rimasto scritto e
non fa niente.

Non era un pezzo mai fatto: era un pezzo diventato **irraggiungibile** quando
è cambiato il disegno delle sezioni.

## LA CORREZIONE

`schedaJob` accetta `apri:{action,data}` e lo mette sulla scheda intera, con
la classe `job-clic` — che nel CSS **esisteva già** (`cursor:pointer`) e non
la usava nessuno: la strada era segnata a metà.

I pulsanti dentro continuano a comandare, perché il gestionale cerca sempre
il `data-action` **più interno**: premendo «Elimina» parte Elimina.

## LA PROVA — e la trappola che aveva dentro

`nuove/scheda-si-apre-cliccando.py`, 5 controlli. Non prova solo che si apra:
prova che **«Copia link» continui a copiare e basta**. Il rischio di rendere
cliccabile tutta la scheda è di rompere quello che ci sta sopra, e sarebbe
stato uno scambio pessimo — un fastidio via, un guaio dentro.

⚠️ Al primo giro accusava «Copia link» di aprire la scheda. Era falso:
`closeSheet()` toglie la classe `open` dall'overlay ma **lascia il modulo nel
DOM**, quindi cercare `#d-nome` non dice se la scheda è aperta, dice solo che
è stata aperta una volta. La ventunesima prova bugiarda di oggi, e sempre la
stessa forma: prima di credere al rosso, chiedersi chi sta parlando.

Nei due versi: sul file di prima **2 problemi su 5**, sul corretto **0**.

## FATTI SUBITO DOPO: CLIENTI E COMPUTO

La domanda «cosa deve aprire il clic?» se l'era già data il codice: tutti e
due i menu hanno la voce «Apri» come **prima** azione.

- **Clienti** → `apri-cli` («👁 Apri scheda»). È la scheda di **lettura**, non
  il modulo di modifica: è esattamente quella che serve a chi vuole guardare.
- **Computo** → `edit-computo` («✏ Apri il computo»), che apre il computo con
  dentro le **lavorazioni**. Da un computo si entra per vedere le voci, non
  per correggere il titolo: se il clic aprisse solo i dati sarebbe un altro
  giro a vuoto.

La prova adesso è 7 controlli e li copre tutti e tre. Nei due versi: sul file
di prima **4 problemi su 7**, sul corretto **0**.

## RESTANO FUORI, E SI SA PERCHÉ

`schedaJob` lo usano anche **Fatture**, **Mezzi**, **Scadenzario**, **Crediti
formativi** e le righe del **Cestino**. Lì il clic non c'è ancora. Non è una
dimenticanza: per ognuna va deciso cosa deve aprire, e per il Cestino la
domanda è diversa (cliccare una riga la rimette a posto? allora è un'azione
che cambia i dati, e va chiesta prima, non fatta a sorpresa).

## DOVE SIAMO RIMASTI

72 prove nel banco.

---

# 14 agosto 2026 (notte, 10) — L'ELENCO SI LEGGE, LE AZIONI STANNO DENTRO

Alessio: «quello che non capisco e che non mi piace, e che **avevo già
chiesto**, è che le funzioni modifica, elimina, rimuovi, copia devono stare
dentro nelle funzioni, non fuori in anteprima. Perché sembra altro invece che
la squadra».

Aveva ragione, e l'aveva già detto. Con cinque pulsanti addosso a ogni riga
— Modifica, Copia link, Invia su WhatsApp, Rimuovi accesso, Elimina — la
Squadra non sembrava più l'elenco di chi lavora con te: sembrava un pannello
di comandi. **Un elenco si legge**; le cose da fare si trovano dopo, quando
sei entrato.

## COSA CAMBIA

L'anteprima adesso ha: **nome, stato, mansione, telefono** e la nota delle
scadenze. Niente altro.

Dentro la scheda, in fondo, c'è un blocco «Cosa puoi fare con …» con Copia
link, Invia su WhatsApp, Rimuovi accesso ed Elimina. (Modifica non serve più
come voce: la scheda **è** già aperta.)

## LE TRE COSE CHE POTEVANO ROMPERSI, E CHE HO DOVUTO SISTEMARE

1. **Il link d'invito non c'era, dentro la scheda.** «Copia link» e
   «WhatsApp» vivevano sull'anteprima, dove il link era già calcolato da
   `renderDip`. Dentro no: `dipCache` non teneva il `codice`. Adesso lo tiene,
   e il link si ricostruisce lì.
2. **«Rimuovi accesso» ed «Elimina» non chiudevano la scheda.** Da fuori non
   serviva. Da dentro sì: se non si chiude, resti a guardare il modulo di una
   persona che non c'è più — e premendo Salva la riscriveresti.
3. **La riga vuota dei pulsanti.** Senza azioni, `schedaJob` stampava
   comunque il contenitore: un gradino bianco in fondo a ogni scheda. Adesso
   se non ci sono azioni non si stampa niente.

## LA PROVA

`nuove/scheda-si-apre-cliccando.py`, 7 controlli, e adesso pretende **tutte e
due le cose**: che sull'elenco non ci sia **nessun** pulsante addosso alle
schede, e che dentro ci siano **tutte e quattro** le azioni.

Nei due versi: sul file di prima **6 problemi su 7**, sul corretto **0**.

## ⚠️ DA RICORDARE

Questa richiesta era già stata fatta e non era stata eseguita. Quando Alessio
dice «avevo già chiesto», la cosa da fare non è spiegare: è farla, e
controllare se la stessa cosa vale altrove. **Clienti** e **Computo** hanno
ancora i pulsanti sull'anteprima — vanno guardati con lo stesso occhio, ma lì
alcune scorciatoie (Scarica il PDF) forse servono davvero a colpo d'occhio, e
va chiesto invece che deciso.

## DOVE SIAMO RIMASTI

72 prove nel banco, 0 rosse.

---

# 14 agosto 2026 (notte, 11) — RIPRISTINATO: LE SCHEDE TORNANO COM'ERANO

Alessio: «fermati. Tutte e 21 le card sono così e troppo lavoro».

Aveva ragione, e l'errore di impostazione era mio: stavo rifacendo **una
sezione alla volta a mano** — Squadra, Clienti, Computo, Fatture — con altre
diciassette dietro. Sono diciassette occasioni di rompere qualcosa, e nel
frattempo il gestionale sarebbe rimasto mezzo in un modo e mezzo nell'altro,
che per chi lo usa è peggio di com'era.

## COSA È STATO RIMESSO COM'ERA

I tre commit `43e6175`, `06a78ab`, `65cbe81` (schede cliccabili + azioni
dentro) sono stati annullati. `gestionale-app.html` è tornato **identico**
alla versione del commit precedente: md5 `bb6584769470d5e14a8ed3a9c4e7a781`,
byte per byte.

**Resta in piedi la correzione del costo orario** (`squadraApri`): quello è
un difetto vero — la scheda mostrava i dati vecchi e salvando li riscriveva
sopra — non una scelta di grafica.

## ⚠️ DUE LEZIONI, TUTTE E DUE MIE

**1. La strada giusta era una sola modifica, non ventuno.** Tutte le schede
passano da `schedaJob`, e anche i loro pulsanti. La regola «l'anteprima è
pulita, le azioni stanno dentro» si scrive **lì**, una volta: la scheda si
clicca, e i suoi pulsanti viaggiano con lei e vengono attaccati in fondo al
modulo che si apre. Una cosa sola da fare e una sola da provare, e vale anche
per le sezioni che nasceranno dopo.

Quando una richiesta si ripete uguale su venti posti, la domanda giusta non è
«da quale comincio»: è **«dov'è il posto unico da cui passano tutti?»**

**2. Per tornare indietro c'era `git`, e non l'ho usato.** Ho smontato venti
modifiche a mano, una per una, venti minuti. Alessio: «ma non bastava fare un
torna indietro e basta invece che riscrivere?». Sì. Il git sta nella sua
cartella (e lì non tocco niente, per la regola del lock), ma la cosa da dire
era **«fallo tu con una riga»**, non mettersi a smontare.

L'unica cosa fatta bene è stata la verifica: l'md5 alla fine combaciava.

## COSA RESTA PRONTO

`nuove/scheda-si-apre-cliccando.py` — 8 controlli, verde sul lavoro fatto e
rosso sul file di prima — è ancora nel banco, **fuori dal comando**. Il
giorno che si fa la modifica unica si riaccende quella riga e si vede subito
se funziona su tutte.

⚠️ E il **Cestino** resta fuori comunque: lì cliccare una riga la **rimette a
posto**. Non è «entrare», è un'azione che cambia i dati, e non si mette a
sorpresa sotto il dito.

## DOVE SIAMO RIMASTI

71 prove nel banco.

---

# 15 agosto 2026 — IL BLOG: LA PRIMA GUIDA PER CHI IL PREVENTIVO LO SCRIVE

Alessio: «guarda cosa cerca la gente davvero, e dimmi qual è quella da scrivere,
e perché».

## I NUMERI VERI, NON LE STIME

Letti da Search Console, 15 maggio - 13 agosto. **846 query**, e la prima cosa
da sapere è questa: **nessuna riguarda un gestionale.** Non una. Né «software
cantiere», né «gestionale edile».

Le guide che portano tutto:

    quanto-costa-rifare-impianto-idraulico   1.515 impressioni   pos. 8,5
    quanto-costa-cambiare-gli-infissi        1.457               pos. 10,4
    quanto-costa-un-muratore-al-giorno       1.179               pos. 8,4
    quanto-costa-posare-il-pavimento           922               pos. 9,5
    quanto-costa-cappotto-termico              507               pos. 10,2
    quanto-guadagna-un-muratore                485               pos. 6,8

Il filone imprese invece non esiste: «trovare clienti edilizia gratis» 9
impressioni in posizione 41, «come trovare clienti per impresa edile» 2 in
posizione 68. Circa 30 impressioni in tre mesi, tutte oltre la quarta pagina.

## PERCHE' NON «QUANTO COSTA DAVVERO UN'ORA DI OPERAIO»

Era la seconda scelta di Alessio, e sarebbe stato un errore. Le due guide che
funzionano — `quanto-costa-un-muratore-al-giorno` e `quanto-guadagna-un-muratore`
— **hanno già dentro** la tabella del costo per l'impresa, i contributi, la
Cassa Edile e il ricarico 15%+10%. Un terzo articolo avrebbe fatto scegliere a
Google fra tre pagine di casa, e avrebbe perso quella a posizione 8,4.

## LA SCELTA, E COM'E' CAMBIATA IN CORSA

Prima scelta: il **consuntivo di cantiere** — «ci ho guadagnato o rimesso».
Verificato a mano che la prima pagina di Google è vuota di numeri: guidoalberti,
infominds (4.000 parole, un H2 «Esempio di contabilità» **senza un solo
importo**), biblus/ACCA, teamsystem («1 minuto di lettura», una pubblicità
travestita da articolo). Zero euro in tutti.

⚠️ **Poi è saltato fuori un fatto che cambiava tutto: Alessio non ha l'azienda.**
Fa i preventivi per il suo capo. Niente fatture dei fornitori, niente ore vere:
il consuntivo non si poteva fare, e **inventarlo era fuori discussione**.

Quindi si è girato su quello che ha davvero in mano: **un preventivo vero**, di
un lavoro preso. 18 voci, 34.200 € più IVA al 10%.

## L'ARTICOLO — `come-fare-un-preventivo-edile.html`

Le 18 voci pubblicate **in fasce, non in cifre esatte**: quei prezzi sono il
listino del suo capo, e metterlo online era una decisione sua, non mia. Le
fasce contengono il prezzo vero ma il loro centro non lo tradisce (controllato:
nessun centro fascia coincide col prezzo).

Impersonale, per sua scelta. Richiamo «Iscrivi la tua impresa gratis».

## ⚠️ IL DIFETTO TROVATO DOPO, GUARDANDO LO SCHERMO

Il gruppo «Per le imprese» del blog mostrava 3 guide, ma non quella giusta:
**`come-trovare-operai-edili` era rimasto senza `mestiere`** e finiva nel gruppo
di scarto. Stesso problema già capitato a `bonus-edilizi-2026`. Sistemato con
`sql/blog-operai-nel-gruppo-imprese.sql`.

## DOVE SIAMO RIMASTI

Guida online, sitemap e blog aggiornati. Commit `7c780df`.

---

# 15 agosto 2026 (2) — LA FASE 1 NON C'ERA DA FARE

Alessio ha dato un piano di quattro moduli, in ordine. La Fase 1 era
«Scadenzario documenti con avvisi».

**C'era già tutto e tre.**

- `gest_scadenze` esiste, con `avvisa`, `avvisi` (le tappe già spedite),
  `ripeti_mesi` (la scadenza dell'anno dopo nasce da sola)
- i tipi ci sono, riga 6330 di `gestionale-app.html`: **DURC**, Assicurazione,
  Revisione mezzo, Bollo, Tagliando, Certificazione…
- l'email parte da sola: `netlify/functions/promemoria-scadenze.js`, esportata
  con `schedule('15 6 * * *')` — ogni mattina, tappe a **30, 7 e 1 giorno**

Verificato sul database vero con una query di sola lettura
(`prove-claude/controlla-scadenzario.sql`): **14 colonne su 14, nessuna manca.**

⚠️ **Se avessi costruito una sezione «Scadenze» nuova, Alessio si sarebbe
ritrovato DUE scadenzari che non si parlano.** Il DURC scritto in uno e non
nell'altro. Peggio di non averne nessuno.

È la lezione del 14 agosto notte, sezione 11, applicata prima di rompere invece
che dopo: **prima di fare la cosa, chiedersi se il posto c'è già.**

---

# 15 agosto 2026 (3) — IL RAPPORTINO DI CANTIERE (Fase 2a)

## IL BUCO VERO, TROVATO GUARDANDO

Anche la **Fase 3** (cruscotto del margine) era in gran parte costruita:
`margineLavoro()` alla riga 9191 fa già *importo − spese − fatture fornitori −
manodopera*, e la manodopera la calcola da `gest_ore` per costo orario. Si vede
già dentro ogni lavoro, nel Riepilogo e nell'esportazione Excel.

Il buco era uno solo, e stava in mezzo: **`gest_ore` non compare nemmeno una
volta in `gestionale-operatore.html`.** Le ore le poteva scrivere solo il
titolare, dal pannello, la sera, a mano.

Quindi il margine era vero **solo per i lavori in cui qualcuno si era ricordato
di inserirle**. Il gestionale lo diceva già da solo, riga 9111: *«X ore senza il
nome di chi le ha fatte: queste non entrano nel margine»*.

## `sql/gest-rapportini.sql`

Una tabella sola, `gest_rapportini` (lavoro, data, chi l'ha scritto, materiali
a parole, note), più **una colonna** `gest_ore.rapportino_id`.

⚠️ **Niente seconda tabella delle ore.** Due posti dove stanno le ore vuol dire
prima o poi due numeri diversi. Così invece le ore scritte dal telefono entrano
nel margine **dal primo giorno**, senza ricollegare niente.

⚠️ `rapportino_id` è **set null e non cascade**: buttando via un rapportino le
ore restano. Se sparissero, il margine di un lavoro già chiuso cambierebbe da
solo — è il difetto del 12 agosto con le tariffe delle persone eliminate.

**⚠️ IL BUCO TROVATO PROVANDO.** Il capo squadra poteva scrivere ore «sciolte»,
senza rapportino — e poi **non le rivedeva più**: non erano sue e non stavano
sotto un suo rapportino, quindi la regola di lettura non gliele mostrava. Ore
scritte, invisibili a chi le aveva scritte, impossibili da correggere.
Chiuso alla radice: dal telefono `rapportino_id` è obbligatorio. Il titolare
continua a scriverle sciolte come sempre.

26 controlli su PostgreSQL 16.

## `sql/gest-squadra-nomi.sql` — E IL BUCO PIU' GRAVE DELLA GIORNATA

Il capo squadra scrive le ore di tutti, quindi gli servono i nomi dei colleghi.
Ma dall'11 agosto un collaboratore vede **solo la propria scheda** in
`gest_operatori` — giustamente, lì dentro c'è il costo orario.

La porta era già stata disegnata in quel file: *«se un giorno serve la RUBRICA
DELLA SQUADRA si fa una vista con dentro solo quelle due colonne»*. Fatta:
`gest_squadra_nomi`, dentro **id, reparto e nome. E basta.**

**⚠️ LA PRIMA VERSIONE SI POTEVA SCRIVERE.** Nella prova il capo squadra ci ha
infilato dentro una persona finta, che è finita **davvero** in `gest_operatori`.
In PostgreSQL una vista costruita su UNA tabella sola è modificabile, e togliere
il permesso non basta: un `GRANT ALL` dato domani per un'altra ragione la
riaprirebbe **in silenzio**.

Chiusa con `select distinct`, che la rende non scrivibile **per costruzione**:
il database rifiuta inserimento, modifica e cancellazione qualunque permesso ci
sia. Riprovato tutti e tre: rifiutati.

## LA SCHERMATA DAL TELEFONO

Dentro la vista del lavoro, sotto «Cosa devi fare»: data di oggi già messa, la
squadra un nome per riga con **−** e **+** da 52×52 px (mezz'ora per clic), i
materiali a parole, le note, e un pulsante largo quanto lo schermo.

⚠️ **I materiali senza prezzo, e non è una dimenticanza.** Il costo dei
materiali sta già nelle spese e nelle fatture fornitori, e da lì entra già nel
margine. Riscriverlo qui vorrebbe dire contarlo due volte. È la stessa regola
che il gestionale già scrive all'utente alla riga 6213.

## LA PROVA CHE PREMEVA DI PIU'

Fatto finta che il database rifiutasse le ore **senza dare errore** — che è
quello che succede quando un permesso blocca. Senza il controllo l'app avrebbe
detto «Rapportino salvato ✔» con zero ore dentro. Con `.select("id")` dice:

    Rapportino salvato, ma le ore NO: scritte 0 su 2 — dillo al capo

## COSA E' STATO VISTO E NON TOCCATO

Nell'app del dipendente, «Salva note» e «Segna come fatto» fanno
`update(...).eq("id",...)` **senza `.select('id')`**. Un UPDATE che non tocca
nessuna riga NON dà errore: se un giorno i permessi bloccassero quella
scrittura, l'app direbbe «Salvato ✔» a vuoto. Stessa cosa in `oreAdd()` nel
pannello. **Segnalato ad Alessio, non corretto.**

## DOVE SIAMO RIMASTI

Commit `7fcf4db`, `29dbbaa`, `c2b3a57`.

---

# 15 agosto 2026 (4) — I RAPPORTINI SI LEGGONO NEL PANNELLO

Da quando la schermata del telefono è online, «Cosa avete usato» e «Com'è
andata» finivano in `gest_rapportini` e **non li leggeva nessuno**. Una casella
che chiede di scrivere promette un lettore: senza il riquadro, la promessa era
falsa. Per questo è stato fatto subito, prima del «+ Rapido».

Dentro il lavoro, sotto il Registro delle ore: quando, chi l'ha scritto, chi
c'era e quante ore per uno, i materiali, le note. In fondo una riga che tiene
**separate le ore arrivate dal cantiere da quelle messe a mano dal titolare**.

⚠️ **Niente pulsante per eliminare un rapportino.** `gest_rapportini` non sta
nell'elenco dentro `js/cestino.js`: una cancellazione da lì sarebbe **vera e
definitiva** invece di finire nel Cestino. Il Cestino per i rapportini è una
cosa a sé, da fare con calma.

## UNA REGOLA PIEGATA, DETTA PRIMA

Alessio chiede «tabelle con `renderTabella()`, mai card». Qui non è stata usata:
`renderTabella()` è il disegnatore delle **sezioni** — costruisce i pulsanti
delle viste, registra i menu «...» e produce card. Dentro il modulo del lavoro
avrebbe fatto proprio quello che la regola vuole evitare. I tre riquadri
accanto (Spese, Mezzi, Registro delle ore) usano tutti `spesa-row`: è stato
usato quello.

## DOVE SIAMO RIMASTI

Commit `c2b3a57`. E un errore mio corretto subito dopo: avendo aggiunto la
spunta «Rapportini», la frase sotto le caselle contava male — «le ultime tre»
invece di «le altre quattro» (`baf158b`). Corretta facendo **contare al codice**
quante spunte aprono una schermata e quante lavorano dentro, e pretendendo che
la frase dica gli stessi numeri.

---

# 15 agosto 2026 (5) — UNA SCADENZA PUO' ESSERE DI UNA PERSONA

Guardando la scheda di David sullo schermo di Alessio: **«Attestati e patentini»
è un campo di testo libero, senza data.** Ci scrivi «patentino muletto» e quella
cosa **non scade mai e non avvisa nessuno**.

Il patentino del muletto scade. La piattaforma aerea scade. Il primo soccorso
scade. E se scade e l'uomo sale lo stesso, in cantiere non è un fastidio: è il
verbale.

`sql/gest-scadenze-persona.sql`: **una colonna sola**, `operatore_id`. Da lì in
poi funziona tutto quello che c'è già — l'elenco, i colori, il «si ripete», e
l'email a 30/7/1 giorno. Non c'era da costruire niente: c'era solo da poter
dire **a chi**.

⚠️ **set null, non cascade**, come `gest_ore.operatore_id`: se una persona viene
tolta dalla squadra la sua scadenza NON sparisce da sola. Il gestionale la
mostra dicendo «(persona non più in squadra)». Una riga che sparisce in silenzio
è peggio di una riga da buttare a mano.

**⚠️ Un limite del file, trovato provandolo:** `add column if not exists` non
aggiunge il collegamento se la colonna esiste già senza. Il file si limitava a
dire «a metà» invece di sistemare. Adesso il collegamento lo aggiunge se manca.

Aggiunti anche due tipi: **Patentino** e **Idoneità sanitaria**.

Commit `589b4fb`, `6468f0c`.

---

# 15 agosto 2026 (6) — «+ RAPIDO»: TRE TOCCHI DAL CANTIERE

Alessio ha dato un prompt per la nota vocale con l'AI. Tre cose non tornavano,
dette prima di scrivere una riga:

1. **il posto**: il prompt diceva `gestionale-app.html`, ma le mani sporche e i
   ponteggi sono `gestionale-operatore.html` — dove l'assistente AI non è
   nemmeno caricato (zero volte, controllato)
2. **le ore erano appena state fatte**: «oggi io e Wahid 8 ore» è il rapportino
   di un'ora prima
3. **la misura**: 4 tipi di dato per 2 modi di inserirli fanno 8 strade

E una cosa che nel prompt non c'era: **ogni nota vocale è un credito.** Tre al
giorno per 20 giorni sono 60 crediti al mese per persona. I tre tocchi non
costano niente, per sempre.

⚠️ **La decisione migliore era già nel prompt di Alessio**, e va scritta perché
non si perda: *«non registrare audio, apri una casella di testo e lascia che sia
il microfono della tastiera del telefono a trascrivere»*. Niente file audio,
niente permesso al microfono, niente trascrizione da pagare, e funziona su
iPhone e Android perché non dipende da noi. **Non c'è una strada migliore.**

## LA BUONA NOTIZIA PER LA VOCE, QUANDO SI FARA'

`js/ai-integrazione.js` ha già `pannelloCompila(titolo, placeholder, onCompila)`:
un pannello generico «descrivi a parole, ti riempio il modulo», con dentro **la
casella di testo dove si detta**, i crediti, il messaggio quando finiscono, i
numeri all'italiana (1.200,50) e il riempimento tollerante delle tendine.
Riga 460: *«l'AI riempie il form, NON scrive mai nel DB»*.
La nota vocale è **una terza voce lì dentro**, non una strada nuova.

## COS'E' STATO FATTO

Sopra l'elenco dei lavori, un pulsante blu largo quanto lo schermo. Tre tocchi:
**cosa** (ore / materiale / nota / spesa), **quale lavoro** (gli 8 più recenti,
gli aperti prima dei finiti), **conferma** con i valori già proposti — le ore
arrivano con 8 già scritte.

⚠️ **Le ore NON prendono una strada nuova**: creano un rapportino con dentro
solo chi lo scrive. Alessio aveva chiesto di includerle contro il consiglio; si
è fatto come voleva lui, ma da **una porta in più sulla stessa stanza**.

## `sql/gest-spese-cantiere.sql`

La spesa del cantiere (`gest_spese`, quella che entra nel margine) prima la
poteva scrivere solo il titolare. Adesso anche chi ha la spunta **Pagamenti**.

⚠️ **Nessuna spunta nuova.** «Pagamenti» dice già testualmente *«Vede la sua
carta aziendale e registra le spese»*: è la stessa fiducia, non una in più.
⚠️ **Scrivere sì, leggere no.** L'elenco delle spese di un cantiere, in fila,
racconta i margini dell'impresa: non è roba da telefono di cantiere.
Aggiunta la colonna `inserito_da`: una spesa arrivata dal cantiere non deve
essere indistinguibile da una del titolare, perché quei soldi entrano nel
margine.

Commit `1304621`, `54347a7`.

---

# 15 agosto 2026 (7) — LE DUE LEZIONI, E IL BANCO

## LA PRIMA: TRE VOLTE SU QUATTRO LA COSA C'ERA GIA'

Lo **Scadenzario**, le **ore** (`gest_ore`, dal 9 agosto), il **margine**
(`margineLavoro`, con la schermata dentro ogni lavoro). Tutti e tre costruiti,
tutti e tre dati per mancanti dal piano.

Scoperti solo perché si è andati a **guardare i file** invece di credere al
piano. Il piano diceva quattro moduli: ne mancava **uno**, e stava in mezzo —
l'ingresso dei dati dal cantiere.

**La domanda da farsi prima di ogni modulo nuovo: «questa cosa c'è già?»**

## LA SECONDA: OTTO PROVE BUGIARDE SU OTTO

Ogni riga rossa di oggi era la prova, mai il gestionale:

1. la sitemap «senza l'indirizzo nuovo» — il riassuntore non aveva letto tutto
2. i file non trovati sotto `file://` — `/js/` e `/css/` puntano alla radice del disco
3. i pulsanti misurati **0×0** — si misurava una schermata chiusa
4. l'UPDATE «riuscito» che non toccava nessuna riga — **non dà errore**
5. il conteggio delle righe viste, sbagliato nell'attesa
6. `max(uuid)`, che PostgreSQL non sa fare
7. la finestra rimasta aperta che copriva il clic — ed era voluta
8. «Nessun dettaglio» preteso da un rapportino che un dettaglio ce l'aveva

La regola del 14 agosto regge e si rafforza: **prima di credere al rosso,
chiedersi chi sta parlando.**

## IL BANCO — `prove-claude/banco-prove-15ago-rapportino.zip`

Cinque prove nuove in `nuove/`, **fuori dal comando** e si sa perché: sono
scritte in **Node**, mentre il banco apre le pagine con **Playwright da Python**
appoggiandosi a `harness.py`, che usa il bundle vero di supabase-js.
Registrarle così vorrebbe dire righe rosse **per colpa dell'ambiente**.

⚠️ **Il lavoro che manca: portarle su `harness.py`.** Quel giorno si registrano
in `prova-tutto.js`. Stessa scelta già fatta con `scheda-si-apre-cliccando.py`.
Le istruzioni per lanciarle a mano sono in `nuove/LEGGIMI-15ago.md`.

## DOVE SIAMO RIMASTI

71 prove nel banco più 5 fuori dal comando. Nove push:
`7c780df`, `7fcf4db`, `29dbbaa`, `c2b3a57`, `baf158b`, `589b4fb`, `6468f0c`,
`1304621`, `54347a7`.

⚠️ **Nessuno ha ancora usato niente di tutto questo da un telefono vero, in
cantiere.** Il collaudo che conta è David che apre l'app e segna le sue ore.

Cosa resta aperto, in ordine:

1. **La voce** sopra il «+ Rapido», sugli stessi moduli (`pannelloCompila`)
2. Le prove di oggi portate su `harness.py`
3. Il **Cestino per i rapportini** (`js/cestino.js` non li conosce)
4. I due `.select('id')` mancanti segnalati e non toccati
5. Le 9 prove «da capire» del 14 agosto, il render pigro, le cascate di
   `segnalazioni` e `supporto_messaggi`, l'annuncio pagato da recuperare

---

# 15 agosto 2026 (8) — I CREDITI AI LI PAGA L'IMPRESA

`sql/ai-crediti-collaboratori.sql` — lanciato, commit `04f8f2b`.

## IL BLOCCO, TROVATO PRIMA DI SCRIVERE UNA RIGA

`ai_accounts.user_id` è la **chiave primaria**, e `consume_ai_credit` partiva da
`auth.uid()`. Quando David apre l'app del cantiere, chi è collegato è **David**,
non l'impresa: il server cercava i crediti di David — piano `base`, quota 0 — e
rispondeva *«Hai esaurito i crediti AI di questo mese»*. E non era nemmeno vero:
David non li ha mai avuti.

Con quella regola **la voce in cantiere non poteva funzionare per nessuno**.

## LA REGOLA NUOVA, IN UNA RIGA

`public.ai_conto_di(_chi)`: se chi preme è **collaboratore attivo di UNA sola
impresa**, i crediti sono dell'impresa. In tutti gli altri casi sono suoi.

- ⚠️ **Il titolare non cambia di una virgola.** In `gest_membri` non c'è come
  membro di sé stesso: la ricerca non trova niente e si ricade su prima.
- ⚠️ **Due imprese = nessuna.** Non si indovina a chi far pagare: paga lui.
  Indovinare su chi paga è l'errore che non si scopre mai — i soldi spariscono
  da una parte e nessuno guarda dall'altra.
- ⚠️ **`ai_usage_log.usato_da`**: da oggi il registro dice anche CHI li ha
  spesi, non solo di chi erano. Con quattro operai in squadra è la differenza
  fra un registro e un mistero.
- `refund_ai_credit` **non si tocca**: rimborsa partendo dalla riga di registro,
  che è già intestata all'impresa. Si aggiusta da solo.

## ⚠️ L'ERRORE MIO, DETTO PER PRIMO

Avevo riscritto `get_ai_status` partendo da `sql/02-functions.sql`. **Sbagliato:
la versione che gira è quella di `sql/03-assistente.sql`**, che restituisce anche
`help_left`.

Con la mia, nel pannello dell'Assistente la riga *«Domande gratuite rimaste
questo mese»* sarebbe diventata un **trattino** — `js/ai-integrazione.js`, riga
236. Nessun errore, nessun messaggio: solo un numero che sparisce.

Trovato dal confronto **prima/dopo** su PostgreSQL vero, non rileggendo il file.

**La lezione: quando una funzione esiste in più file di `sql/`, quella buona è
l'ULTIMA, non la prima che si trova.**

E l'aiuto gratis **resta di chi preme**: `consume_help_credit` non si tocca. Se
le 30 domande le pagasse l'impresa, quattro operai le brucerebbero al titolare
in una settimana.

## IL BANCO — `prove-claude/banco-crediti-15ago.zip`

Lo schema ricostruito **dai file veri**, le funzioni **copiate verbatim** (non
riscritte a memoria: riscriverle vuol dire provare la propria memoria).

- **12 scenari del titolare, prima e dopo: identici riga per riga**
- **13 prove che devono fallire, tutte verdi**: estraneo, sospeso, invitato,
  due imprese, il titolare che non può spendere i crediti di un altro
- **File rotto di proposito 6 volte**, ogni volta la prova giusta è diventata rossa
- **20 pulsanti premuti nello stesso istante**, 5 giri: sempre un credito solo

⚠️ **Tre bugie del banco, prima che dicesse il vero:** `reset_stato()` non
azzerava `help_used` e una prova si sporcava da sola; un sabotaggio toglieva e
rimetteva la colonna (la funzione la scriveva lo stesso); una prova contava `t`
mentre il database risponde `true`.

---

# 15 agosto 2026 (9) — LA VOCE DAL CANTIERE

`supabase/functions/ai-generate/index.ts` + `gestionale-operatore.html`.

## COM'E' FATTA, IN TRE PEZZI

1. **La dettatura**: il microfono **della tastiera del telefono**. Nessun
   pulsante «parla» dentro l'app.
   ⚠️ **Perché:** `webkitSpeechRecognition` **non c'è su iPhone**. Un pulsante
   scritto nella pagina lì non farebbe niente, e un pulsante che non fa niente è
   peggio di un pulsante che non c'è. Quello di sistema c'è ovunque, parla la
   lingua che ha impostato lui e non chiede permessi in più.
2. **La comprensione**: `dati_rapportino`, prompt **sul server**, costo 1
   credito. Torna `{ore:[{nome,ore}], materiali, note, spesa:{descrizione,importo}}`.
3. **Il controllo**: il telefono riempie il form, lui corregge, poi salva.
   **L'AI non scrive mai nel database** — stessa regola di `dati_cliente` e
   `dati_lavoro`.

## ⚠️ QUELLO CHE TIENE NON E' IL PROMPT, E' IL FILTRO

Al server è scritto «non inventare nomi». **Un prompt è un desiderio, non una
garanzia**: prima o poi un modello ci mette dentro un Marco che non c'è.

La garanzia è `voceRipulisci()` dentro l'app:

- i nomi si confrontano con la **squadra vera di quel lavoro**; chi non c'è
  **non entra**, e viene **scritto in giallo** invece di sparire in silenzio
- `voceStessoNome()` toglie accenti e maiuscole: «LUCA DE LUCA» cade su
  «Luca De Lucà»
- ore **> 24 → 24**, negative buttate, arrotondate alla **mezz'ora**
- stesso nome due volte: si **somma**, non si sdoppia la riga
- l'importo passa da `_numIt` (che sa leggere «42,50»), tetto 1.000.000
- niente permesso «Pagamenti»: la spesa **non si salva**, e glielo si **dice**

**Un'ora sulla persona sbagliata è una busta paga sbagliata, e salta fuori a
fine mese quando nessuno si ricorda più niente.**

## LE ALTRE TRE STRADE RESTANO

«Racconta la giornata» è la **prima** scelta del + Rapido, non l'unica: Ore,
Materiale e Nota restano identiche. Senza campo o senza crediti quelle tre sono
l'unica cosa che funziona, e la voce non deve chiudere l'unica porta che si apre
sempre.

Messaggi diversi per ogni modo di fallire: crediti finiti (e sono **dell'impresa**,
non suoi), piano senza AI, niente rete, risposta senza senso, **funzione non
ancora messa online**. Ognuno finisce con *«segna a mano con Ore»*.

## ⚠️ L'ORA DI ROMA, NON DI LONDRA

`{{OGGI}}` usava `toISOString()`, che dà sempre l'ora di Londra. In estate sono
due ore: **fra mezzanotte e le due di notte il server credeva che fosse ancora
ieri**. Chi dettava un lavoro «domani» all'una se lo ritrovava con la data
sbagliata di un giorno.

Sistemato con `oggiARoma()`: `toLocaleDateString("sv-SE", {timeZone:"Europe/Rome"})`
— `sv-SE` non è un vezzo svedese, è l'unica lingua che scrive AAAA-MM-GG.
Provato su 6 momenti, compreso capodanno (dove sbagliava anche l'anno).

**Segnalato prima e toccato solo dopo il suo sì**: `dati_lavoro` già girava.

## IL DEPLOY: NESSUNA TRACCIA, RISCHIO CHIUSO CON UNA DATA

Non esiste `supabase/config.toml`, né traccia di deploy in nessun file. Il
rischio era sovrascrivere online una versione diversa da quella locale.

Chiuso confrontando **due date**: Supabase diceva «updated 17 days ago» = 29
luglio; il file locale aveva `mtime` **29 luglio 17:48**. Stessa cosa.

## I BANCHI

- `prove-claude/banco-voce-15ago.zip` — 48+12 controlli sulla Edge Function,
  **senza chiamare l'AI**: una prova che confronta parole generate diventa rossa
  da sola dopo una settimana. Si prova tutto quello che sta **intorno**.
  12 sabotaggi.
- `prove-claude/banco-voce-app-15ago.zip` — ~80 controlli nel browser su due
  misure, con **server AI finto e pilotabile**: nome inventato, persona di un
  altro reparto, 30 ore, ore negative, nome doppio, risposta non-JSON, 402,
  niente rete, deploy mancante, e **il database che rifiuta senza dare errore**.
  12 sabotaggi.

⚠️ **Altre tre bugie dei banchi:** una prova **ricopiava** il codice della
pulizia invece di **prenderlo dal file** (togliendolo dal file restava verde);
`rompi.sh` in bash si mangiava le virgolette e due sabotaggi non toccavano
niente (riscritto in Python, e adesso **dice** se non ha toccato niente); la
sessione finta aveva il token ma non l'utente, e la prova accusava il gestionale
di un errore suo.

**Totale della giornata: 14 prove bugiarde, tutte mie, tutte trovate.**

## DOVE SIAMO RIMASTI (fine 15 agosto)

Push della giornata: `7c780df`, `7fcf4db`, `29dbbaa`, `c2b3a57`, `baf158b`,
`589b4fb`, `6468f0c`, `1304621`, `54347a7`, `3c3e5c9`, `04f8f2b`.

⚠️ **Da fare a mano, non è un push:** il **deploy della Edge Function**
`ai-generate` dal pannello Supabase (Edge Functions → ai-generate → Code →
Deploy). Finché non è fatto, «Racconta la giornata» dice *«Questa cosa non è
ancora accesa sul server»* e non si rompe niente.

⚠️ **Nessuno ha ancora dettato un rapportino da un telefono vero.**

Cosa resta aperto, in ordine:

1. **Il Cestino per i rapportini.** La colonna `eliminato_il` su
   `gest_rapportini` **c'è già**. Mancano due elenchi: `TABELLE` in
   `js/cestino.js` (riga ~86) e `CEST_NOMI` in `gestionale-app.html` (riga
   ~11771). Oggi un rapportino eliminato **sparisce per sempre** mentre il
   messaggio promette il cestino.
2. **La guida blog «DURC scaduto: cosa rischi e come non dimenticarlo mai»** —
   parla alle **imprese**, non ai proprietari di casa. Lo Scadenzario c'è già:
   il gestionale entra alla fine, come risposta al problema, mai come vetrina.
3. Le prove Node di oggi portate su `harness.py`
4. I due `.select('id')` mancanti, segnalati e non toccati
5. Le 9 prove «da capire» del 14 agosto, il render pigro (il punto unico è il
   dispatcher intorno a riga 14628), le cascate di `segnalazioni` e
   `supporto_messaggi`, l'annuncio pagato da recuperare

---

## DOVE SIAMO RIMASTI (15 agosto, sera — seconda tornata)

Tre lavori chiusi dopo quelli di sopra, tutti provati e tutti sabotati.

### Cestino dei rapportini (era il punto 1 di ieri)

Nuovo file `sql/gest-rapportini-cestino.sql`: la funzione
`gest_rapportino_cestina(p_id, p_conferma)`, SECURITY DEFINER, che in **una
sola transazione** mette nel cestino il rapportino **e le sue ore**. Serviva
perché il collaboratore non ha (giustamente) il diritto di scrivere su
`gest_ore`: senza la funzione, o non poteva cancellare il suo rapportino, o le
ore restavano vive e il margine del lavoro usciva sbagliato.

Prima chiamata senza conferma = **dice quante ore porta via**. Seconda con
conferma = esegue. `gest_rapportini` aggiunto a `TABELLE` in `js/cestino.js`
(ora 19) e alle liste del Cestino, con il nome vero: *«Rapportino del 14/08 —
Villa Rossi»*, non un codice.

### «Chiedi una funzione» e «Assistenza diretta» in cima al menu

Due riquadri tratteggiati sopra tutto il resto, col numerino dei messaggi non
letti e il pallino rosso sulle tre lineette quando il menu è chiuso. Nuova
sezione chat `#assistenza`, e nell'admin **due liste separate** (supporto dal
sito / supporto gestionale) che però mostrano sempre la **conversazione
intera**, con l'etichetta arancione sui messaggi arrivati dall'altra parte.

⚠️ **Due buchi veri chiusi su `supporto_messaggi`**: un'impresa poteva
**riscrivere le risposte del fondatore** e poteva **svuotare la chat di tutti**
(`TRUNCATE`). Sistemati con `sql/supporto-messaggi-lucchetto.sql` e
`-anon.sql`. Poi TRUNCATE/TRIGGER/REFERENCES tolti su **94 tabelle**, comprese
quelle future (`alter default privileges`). Non era un errore suo: è la postura
predefinita di Supabase.

### Il Riepilogo che si riempie da solo

Prima c'erano sempre **16 schede**, anche in un reparto appena creato: una
parete di «Nessun cliente registrato». Adesso ogni scheda dichiara `dati:` —
se la sua sezione è vuota, la scheda **non viene disegnata**. Se non c'è
proprio niente compare il cartello «Questo reparto è ancora vuoto» con i due
pulsanti *Il primo cliente* / *Il primo preventivo*.

Il riquadro «Tutto in ordine» è rimasto identico. Cestino e «Chiedi una
funzione» non sono schede e non devono diventarlo: c'è una prova apposta.
Corretta anche la riga sotto il titolo, che prometteva ancora «una scheda per
ogni sezione del menu».

### I banchi di questa tornata (in `prove/`)

`banco_browser.js` è arrivato a **327 controlli** su due misure e quattro
profili (`BANCO_SOLO=l3|l4|l5` per girarne solo un pezzo), più `banco_sql.py`
(28), `banco_supporto.py` (22) e quattro serie di sabotaggi: `rompi.py`,
`rompi_browser.py`, `rompi_l3.py`, `rompi_l4.py`, `rompi_l5.py` (16, tutti
visti).

⚠️ **Altre bugie dei banchi trovate oggi:** il banco girava come
**superutente** del database e il sabotaggio «togli security definer» restava
verde; una prova cercava un'etichetta dentro `innerHTML` e la trovava in un
**commento**; una prova del telefono diceva «il pulsante non si vede» perché
non apriva il menu a tre lineette; la prova del Riepilogo scriveva nel database
**di nascosto** invece di usare il modulo, e accusava il gestionale di un
difetto che non esiste (il Riepilogo si ridisegna quando qualcuno **salva**).

⚠️ **Un difetto vero introdotto e trovato dai sabotaggi:** `enterPanel`
accendeva la voce di menu **per posizione** (`i===0`). Aggiungendo i due
riquadri in cima, entrando in un reparto restava acceso il riquadro sbagliato.
Adesso si accende per `data-tab==="riepilogo"`.

### Cosa resta aperto, in ordine

1. **Scheda completa / «Report completo»** — una card sua dentro il Riepilogo
   che apre tutte le sezioni piene, una sotto l'altra, **in sola lettura**
   (niente Cestino, niente «Cosa ti manca?»), con **Crea PDF** e **Stampa**.
   Deciso con lui: **niente grafico** per adesso, **niente interruttore
   nascondi-importi** (*«è un lavoro che non serve a nessuno»*). jsPDF è già
   nel file e si carica solo quando serve.
2. **La guida blog «DURC scaduto»** — parla alle **imprese**. Prima si guarda
   la Search Console (MCP Supermetrics, `ds_id` GW) per capire cosa cercano
   davvero, poi si propone il titolo.
3. Il **deploy a mano della Edge Function `ai-generate`** dal pannello
   Supabase: **non risulta ancora fatto**.
4. Il `×` del registro ore è **12 px** sul telefono (stesso difetto già
   sistemato per i rapportini). `gest_membri` non sta in nessun file di `sql/`.
5. I due `.select('id')` mancanti, le prove Node portate su `harness.py`, le 9
   prove «da capire» del 14 agosto.

---

## DOVE SIAMO RIMASTI (15 agosto, sera — terza tornata)

### ⚠️ IL «REPORT COMPLETO»: FATTO, MESSO ONLINE, E TOLTO IN SERATA

Costruito un «Report completo» che apriva **tutte le sezioni una sotto
l'altra, in sola lettura**, copiando l'HTML che le funzioni vere avevano
prodotto. Provato, sabotato, messo in produzione (commit `1bb9d15`).

**Alessio l'ha aperto e aveva ragione: era un doppione.** Da agosto le sezioni
disegnano SCHEDE, quindi il foglio era la sezione Lavori senza i pulsanti, la
sezione Preventivi senza i pulsanti, e così per tredici volte — stesse card,
stesse posizioni, stesso ordine. A colpo d'occhio la faccia del Riepilogo,
solo più lunga. Dieci fogli A4 per tre lavori. Parole sue: *«identiche card,
identiche posizioni»*, *«non ho mai detto di fare una fotocopia»*.

**Tolto tutto**: sezione, scheda nel Riepilogo, blocco JS, CSS, regole di
stampa e serie di prove l6. Il gestionale torna esattamente com'era prima.

### ⚠️ LE TRE LEZIONI, CHE VALGONO PIÙ DEL CODICE BUTTATO

**1. «Usa le stesse funzioni» era una regola sui CONTI, non su come si vede.**
Alessio l'aveva scritta perché i numeri non si scollassero fra Report e
sezioni. È stata presa come una regola sul disegno, e da lì è uscita la
fotocopia. Le due cose non erano in conflitto: i numeri potevano arrivare
dalle stesse funzioni e il foglio essere lo stesso un documento vero.

**2. La misura giusta stava già nel suo messaggio, e non è stata usata:**
*«in modo che diventi un foglio da portare in riunione o dal commercialista»*.
Bastava chiedersi, prima di consegnare: **questo lo porteresti in riunione?**
La risposta era no, e si vedeva a occhio. Sono state controllate per ore le
cifre, e mai la sola frase che diceva a cosa doveva servire.

**3. La domanda che non gli è stata fatta prima di cominciare:**
*un'impresa smetterebbe di pagare se questa cosa non ci fosse?* No. Nessun
iscritto l'aveva chiesta. E per il commercialista c'è già il pulsante
**Esporta** (Excel con dentro tutto), che per lui è meglio di un foglio
stampato: lo ordina, lo filtra, ci fa le somme.

⚠️ **Prima di costruire una funzione nuova, quella domanda va fatta a lui.**

### Cosa è rimasto di buono

Le prove **l5** (il Riepilogo che si riempie da solo), che erano andate perse
perché non salvate in nessuno zip, sono state **riscritte** insieme a
`rompi_l5.py` (10 sabotaggi, tutti visti). La prova del cliente nuovo passa
dal **modulo vero**, non scrivendo nel database di nascosto — era una delle
bugie del banco di questa giornata.

`prove/banco_browser.js` → **296 controlli, 0 rossi** (`BANCO_SOLO=l3|l4|l5`).
I due semi di prova (reparto pieno / reparto appena creato) sono rimasti come
`SEME_PIENO` e `SEME_VUOTO`.

### Cosa voleva davvero (parole sue, per la prossima volta)

*«Io volevo un pannello con un riepilogo di tutto quello che sta scritto nelle
singole card»* → **una tabella**, righe e colonne, che si aggiorna da sola e
in cui **si caricano solo le voci del gestionale che si compilano**.

Ne è stata scritta e provata una versione (una tabella sola: Voce · Cosa ·
Quando · Stato · Importo, totali per gruppo, 2 pagine A4) e gliene è stata
mandata l'anteprima. **Ha deciso di non farla**, perché l'Excel di «Esporta»
copre già il caso del commercialista. **Non ricostruirla senza che la chieda
lui.**

### Cosa resta aperto, in ordine

1. Il gestionale **usato da un telefono vero in cantiere**: David che apre
   l'app e segna le sue ore. È il collaudo che conta e non l'ha fatto nessuno.
2. Il **Calendario scrive a 12 px** (10,5 sul telefono): `.cal-lav-t` in
   `css/gestionale.css`, riga ~830. Segnalato, non toccato.
3. Il **deploy a mano della Edge Function `ai-generate`**: non risulta fatto
4. La guida blog **«DURC scaduto»**
5. I due `.select('id')` mancanti, le prove Node su `harness.py`, le 9 prove
   «da capire» del 14 agosto

---

## DOVE SIAMO RIMASTI (15 agosto, notte — quarta tornata)

Due lavori: **il blog** e **il collegamento sito → gestionale**. Tutti e due
online. In mezzo è nata una skill che cambia il modo di parlargli.

### ⛔ REGOLA NUOVA: SCRIVI CORTO (skill `scrivi-corto`)

Alessio è **dislessico**: legge lento e con fatica. A metà serata ha scritto:

> «mi serve che scrivi molto di meno io cosi non capisco niente non riesco a
> leggere tutto, scrivi solo l'essenziale»

Erano messaggi pieni di tabelle, titoli e ragionamenti **giusti** — e
illeggibili. **Un consiglio che non si riesce a leggere vale zero.**

La regola è nella skill `scrivi-corto`, che lui ha installato: **massimo 10
righe per messaggio, una domanda per volta**, i dettagli nel file e non in
chat. Vale su qualunque argomento. Leggerla prima di rispondergli.

### Lavoro 1 — Il blog

Prima si sono guardati i numeri veri di Search Console (MCP Supermetrics,
ds_id `GW`), non l'intuito. **Scoperta grossa: il sito sta decollando adesso.**

| Mese | Impressioni | Clic | Posizione |
|---|---|---|---|
| Giugno | 137 | 18 | 17,9 |
| Luglio | 1.055 | 50 | 22,6 |
| **Agosto (14 giorni)** | **7.323** | **68** | **10,6** |

L'85% lo fanno **6 guide**: impianto idraulico, infissi, muratore al giorno,
posare il pavimento, cappotto, quanto guadagna un muratore. Tre di queste
erano a **zero** fino a luglio: ci mettono **4-8 settimane** a partire.

**Pubblicata `quanto-costa-un-idraulico.html`.** Non è un doppione di
`quanto-costa-rifare-impianto-idraulico`: quella parla di **rifare
l'impianto**, questa di **chiamare l'idraulico**. Il taglio l'ha trovato lui:
*«non fanno mai a l'ora, fanno a riparazione»*. Da lì la guida si è spaccata in
due mercati che **nessun concorrente separa** — urgenza (100-140 €) e
programmato (70-95 €) — e questo spiega anche perché i siti di prezzi si
contraddicono tutti: fanno la media di due cose diverse.

Prezzi ricostruiti dal **CCNL Metalmeccanica Artigianato, 3° livello: 1.758
€/mese dal 1° marzo 2026**, non copiati. Fonti scritte in fondo alla pagina.

Accorciati i title di `quanto-costa-un-muratore-al-giorno` (72 → 52 caratteri)
e `quanto-guadagna-un-muratore` (78 → 55), aggiungendo il **prezzo nel
titolo**: erano gli unici due senza. I «25 anni di cantiere» sono usciti dalle
**meta description** (scelta sua: «riscrivila più neutra» → *«tariffe vere di
cantiere, non medie copiate»*). **Il corpo delle due pagine parla ancora di
lui in prima persona: NON toccato, non l'ha chiesto.**

**Detto no** a: guida «cambio caldaia» (doppione di
`quanto-costa-sostituire-la-caldaia`, e tutto il gruppo caldaia fa **10
impressioni in 3 mesi**), «DURC scaduto» (**8 impressioni**, e chi la cerca è
un'impresa con un guaio burocratico, non un cliente), pitture e cartongesso
(**1 impressione in due**).

⚠️ **Errore da non rifare**: gli è stato detto che a posizione 10 il CTR
normale è 2,5%. È un metro **pre-AI-Overview**: sulle ricerche «quanto costa»
oggi il normale è vicino all'**1%**. Il guadagno promesso era gonfiato.

### Lavoro 2 — Le richieste dal sito entrano nel gestionale

**La scoperta che ha reso tutto facile: marketplace e gestionale sono lo
STESSO account.**

```
auth.users.id
  ├─→ imprese.user_id      (scheda marketplace)
  └─→ gest_*.user_id       (gestionale)
preventivi.impresa_id → imprese.id → imprese.user_id
```

Quindi **non si copia e non si sincronizza niente**: il gestionale legge
`preventivi` direttamente, e la policy che c'è già
`preventivi_impresa_select` fa il resto.

**Nuova sezione `dalsito`, etichetta «Richieste dal sito».**
⚠️ **`richieste` era già occupato** da «Chiedi una funzione»: usare lo stesso
id avrebbe rotto tutte e due.

- `sql/gest-dalsito.sql` — tabella `gest_dalsito` (stato) + `gest_dalsito_avvisi`
  (registro email). **`nuova` non si scrive: è l'assenza di riga.**
- **Nessuna colonna aggiunta a `preventivi`**: era la trappola del 6 agosto
  (GRANT + `preventivi_safe` da rifare, pannello in 403).
- I contatti passano da `contatto-preventivo.js`, **mai letti dal database**.
- `prevForm(p)` ora accetta `prevForm(p,preset)`, come `fattForm(f,preset)`.
- `netlify/functions/promemoria-dalsito.js` — email delle 24 ore, cron
  `20 6 * * *`.

### Cose trovate guardando lo schema vero (query su `pg_policies`)

1. **`preventivi.stato` non lo usa nessuno.** Il pannello scrive `risposta`,
   `prezzo_min`, `prezzo_max`, `risposta_at` — **mai `stato`**, che resta
   `in_attesa` per sempre. Colonna morta ma pubblica: non toccarla.
2. ⛔ **Sull'insert pubblico di `preventivi` non si deve MAI aggiungere
   `.select()`.** Provato su Postgres vero: `INSERT ... RETURNING` viene
   rifiutato dalla RLS, perché `anon` non può rileggere la riga appena
   scritta. Oggi `profilo-impresa.html` fa `.insert()` senza `.select()` ed è
   per questo che funziona. Aggiungerlo romperebbe **tutte** le richieste.
3. **`gest_clienti` ha il GRANT SELECT ad `anon`** su nome, email, telefono,
   piva, cod_fiscale. Sembrava grave: **provato, `set role anon` → 0 righe**,
   la RLS regge. Il permesso però non dovrebbe esserci.
4. **Policy doppie**: due SELECT identiche su `preventivi`, tre coppie su
   `imprese`. Innocue, ma confondono.
5. Il pannello fa `update` su `preventivi` **senza `.select('id')`**.
6. **Non c'è più nessuna regola sui contatti oscurati.** Il pay-per-lead è
   stato tolto a luglio: `contatto-preventivo.js` legge `imprese.piano` e
   **non lo usa**. Alessio credeva ci fosse ancora.

### Il collaudo (14 scenari su PostgreSQL 16 vero)

Schema ricostruito con le **policy copiate da Supabase**, non a memoria.
Impresa A vede 2 richieste, B ne vede 1, B non vede quelle di A, chi non ha
fatto login vede 0, `email`/`telefono` danno *permission denied*, B non può
segnarsi la richiesta di A né cancellarne lo stato, stato inventato rifiutato,
doppione rifiutato, e **il cliente anonimo può ancora mandare la richiesta**.

### ⚠️ Difetti miei, trovati DOPO averglieli mandati

1. **«gia' compilato»** invece di «già» nella sezione nuova — proprio la regola
   sugli accenti. Corretto.
2. **La richiesta col preventivo fatto spariva.** Lo stato `preventivo` non
   stava in nessuna vista tranne «Tutte». La vista «Chiuse» è diventata
   **«Fatte»** (preventivo + chiusa). **Controllare sempre che ogni stato stia
   in almeno una vista.**

### Cosa resta aperto, in ordine

1. **L'email delle 24 ore non è mai stata vista partire.** Il file è online e
   provato a tavolino (singolare/plurale, escape, niente contatti dentro), ma
   serve una richiesta vera lasciata lì un giorno.
2. **I pulsanti sulle schede.** Parole sue: *«fuori ci deve essere solo apri e
   poi dentro i vari bottoni elimina salva invia pdf»*. Vale per **tutto il
   gestionale**, non solo per la sezione nuova — Preventivi, Mezzi, Scadenze
   fanno tutte così. Una sezione per volta.
3. **«Modifica» deve diventare «Apri».** *«chi cazzo preme modifica per
   entrare, uno preme entra»*. Ha ragione: «Modifica» è quello che fai dopo.
4. I suoi due prezzi da idraulico (rubinetto 150 €, lavandino 100 € — se erano
   in urgenza i conti tornano al 2% e al 9%): **ha detto di lasciar perdere,
   non riproporli.**
5. Fra 3-4 settimane: guardare su Search Console se la guida dell'idraulico ha
   attecchito e se i titoli nuovi del muratore hanno alzato i clic.
6. ⚠️ Le richieste dalle pagine `cerca-*` mandano **telefono ed email in chiaro
   via email a 5 imprese**, senza nessun controllo. Segnalato, non toccato.

---

## DOVE SIAMO RIMASTI (16 agosto, mattina — la grafica del gestionale)

Giornata quasi tutta sul **vestito** del gestionale, più due cose sul sito.
Il punto 2 e il punto 3 di «cosa resta aperto» di ieri sera sono **fatti**:
fuori dalle schede c'è solo «Apri», e «Modifica» non si chiama più così.

### Come ho lavorato (serve per la prossima volta)

Ho montato un ambiente che **apre il gestionale davvero** con Playwright:
Supabase intercettato e risposto con dati finti, `vendor/supabase.js` servito
in locale (dal container il CDN non si raggiunge), profilo Premium finto per
passare il cancello. Da lì screenshot su 2560, 1440 e 390 px, e controlli
automatici: errori JS, campi che escono dalla finestra, testi sotto i 13 px,
etichette staccate dalla loro casella. **Quasi tutti i difetti di oggi sono
usciti così, non leggendo il codice.**

### Cosa è cambiato, in ordine

1. **Le finestre lunghe a tutto schermo.** C'era un tetto di 1600 px: su uno
   schermo da 2560 restava un terzo grigio. Le finestre **corte** invece
   («Da dove nasce questa fattura») restano finestrelle centrate: a tutto
   schermo erano un lenzuolo bianco con tre righe in cima.
2. **Le colonne si riempiono da sole** (`column-count`, non più griglia a
   caselle fisse). Prima, se la colonna di sinistra era lunga, quella di mezzo
   si allungava con lei e restava mezzo schermo bianco. **Sempre due colonne,
   mai tre**: con tre, quella di destra restava vuota.
3. **Le zone**: provate quattro versioni a schermo (riga blu a lato, fascia
   col titolo, senza schede, numerate). Ha scelto **senza schede**: foglio
   bianco, titolo 24 px con la riga blu spessa sotto. Motivo suo, ed è quello
   giusto: *«è quella che se ci sono spazi vuoti non dà fastidio»* — senza
   riquadri non ci sono scatole mezze vuote da guardare.
4. **Caselle più grandi ovunque**: testo 21 px, alte 66 px. E poi anche le
   **righe degli elenchi** (lavorazioni, spese, ore, rapportini), che erano
   rimaste a 13,5 px, la metà di quello che avevano intorno.
5. **Fuori solo «Apri»**, in tutte le sezioni. Le azioni stanno **in alto
   accanto al titolo**, «Elimina» in fondo a sinistra (lontano dalla X e da
   Salva), in fondo a destra Annulla e Salva.
6. **Si esce sempre con la freccia «← Indietro»** in alto a sinistra. Le × non
   esistono più: zero occorrenze nel file.
7. **Le note del preventivo** diventano un elenco con «+» e «×». **Nel
   database non cambia niente**: sulla colonna `note` si scrive il solito
   testo con un a capo fra una nota e l'altra, quindi i preventivi vecchi si
   riaprono interi e il PDF resta identico.
8. **Aiuti (i) da 33 a 97 frasi**, solo sulle parole difficili (cassa,
   ritenuta, parti uguali, oneri della sicurezza, dati catastali...). Su
   «Città» e «CAP» **niente**: una (i) che non spiega è un pallino in più da
   scansare.
9. **Menu di sinistra**: via il riquadro da ogni voce, il bordo resta solo su
   quella accesa. Passo da 56 a 42 px: da 12 voci visibili a 20 su 20.
10. **Barra in basso sul telefono** (Riepilogo, Lavori, Preventivi, Fatture):
    da due tocchi a uno.

### Il meccanismo da capire prima di toccare le schede

Le azioni di una scheda **non stanno più nel pulsante**: la scheda le mette in
un registro (`AZ_APRI`, chiave `azione:id`), al clic su «Apri» finiscono in
`_azPendenti`, e **`openSheetGrande` se le prende** e le mette in alto
(`azioniSopra`) e in fondo a sinistra (`azioniElimina`). `openSheetGrande`
accetta anche un quarto parametro per le azioni che la finestra si porta da
sola (lo usa il fornitore).
Chi «apre» non si chiama uguale dappertutto: `AZ_APERTURA` è la regola sola
(`edit-*`, `apri-*`, `sq-edit`, `carta-dettaglio`).
**Se un'azione c'è già in fondo alla finestra non viene rimessa in alto** —
senza questo, il Computo usciva con due «PDF» e due «Elimina».

### ⚠️ Difetti MIEI di oggi, trovati provando (e corretti)

1. **La barra viola FONDATORE.** Spinge la pagina giù di 44 px, ma la finestra
   e il menu sono alti 100vh e si incollano a top:0: i loro primi 44 px
   finivano **dietro** la barra. Nella finestra spariva il titolo e la X;
   nel menu spariva mezza «Chiedi una funzione». Corretto in due punti con
   `body:has(#ti-fondatore)`. **Ricordarsene per ogni cosa alta 100vh.**
2. **Il campo Note spezzato fra due colonne**: l'etichetta in una, la casella
   in quella dopo. Il `break-inside:avoid` stava solo sui blocchi `.sh-b`, e
   la finestra del preventivo di blocchi non ne aveva. Adesso c'è anche sui
   campi, e **una prova automatica lo cerca in tutte le finestre**.
3. **Il fumetto della chat copriva «Salva»** (si leggeva «Salv»): la finestra
   a tutto schermo gli finiva sotto. Gli ho lasciato l'angolo libero.
4. **«Modifica» spariva dalle Carte**: il mio filtro toglieva tutto quello che
   comincia per `edit-`, ma lì l'azione che apre è `carta-dettaglio` e
   `edit-carta` è un'altra cosa. L'azione che apre va tolta **una volta sola**,
   dove viene scelta.
5. **Il prezzo tagliato** nelle voci del preventivo («344,1» invece di
   «344,10»): le colonne erano larghe 64 e 92 px, misure buone per il testo da
   14 px di prima.
6. **«e'» invece di «è»** nei testi nuovi dell'assistente. La solita regola.

### Difetto vecchio trovato per strada

**«Rapportini dal cantiere» diventava «Rapportini dal pratica»** sul profilo
professionista: la regola di traduzione `cantiere → pratica` lo prendeva in
pieno. Proteggere la frase intera **non funziona** (il traduttore ripassa
dopo): ho cambiato la scritta in **«Rapportini di giornata»**, che va bene per
tutti e due i profili.

### Sito e admin

- **Assistente TrovaImpresa**: via tutte le emoji, due voci nuove («Il
  gestionale», «Computo metrico»), e il campo libero **risponde da solo** se
  la domanda parla di gestionale/computo/prezzario — prima passava tutto a
  `ai-orienta`, che sa restituire **solo le 4 pagine di ricerca**, e chiedendo
  del gestionale finivi sul pannello pubblico. Attenzione: «preventivo» e
  «fattura» da sole **non** attivano quella risposta, se no chi deve rifare il
  bagno non arriva più alla ricerca.
- **L'assistente adesso decide da solo dove disegnarsi** (`ASSISTENTE_DOVE`):
  homepage, pagine città, pagine di ricerca. Ovunque altro non fa niente. Il
  paletto sta dentro il file, non nelle pagine, così vale a prescindere da chi
  lo carica. ⚠️ **MISTERO NON RISOLTO**: `gestionale-app.html` non lo carica
  (cercato tre volte, anche negli altri script, in Netlify e nelle edge
  functions) eppure lì la nuvoletta si vedeva, e cambiava quando cambiavo il
  file. Da capire se dopo questo push sparisce davvero.
- **Admin, grafico «Crescita iscritti»**: da barre a **linea**, e le 8 caselle
  in cima sono diventate **interruttori** — si spuntano e la loro linea
  compare o sparisce. Cinque serie: imprese, preventivi, città nuove,
  recensioni, segnalazioni. Le altre caselle **non hanno la spunta** perché
  quei dati la storia non ce l'hanno (Premium ha solo `premium_scadenza`,
  Gestionali solo sì/no, Profili da completare è una fotografia di adesso).
  **Un asse solo**, mai due: due scale fanno vedere un legame che non c'è.
  Colori passati al controllo automatico (peggior coppia ΔE 9,4 su 8).

### Cosa resta aperto

1. **`prezzi.html` non nomina il gestionale nemmeno una volta**, e non esiste
   nessuna pagina pubblica che lo spieghi. È la funzione che vale di più e sul
   sito non c'è scritto da nessuna parte. **È la cosa più importante rimasta.**
2. **La ricerca unica** nel gestionale: una casella sola dove scrivi «Verdi» e
   escono cliente, lavori, preventivi e fatture. Oggi ogni sezione ha la sua.
3. **Le sezioni allineate alle finestre**: le pagine dietro sono ancora a
   16-17 px con le schede grigie, le finestre a 21 px su foglio bianco.
4. **«Fattura n. 12/undefined»** — manca l'anno nel titolo.
5. **Il calendario scrive a 12 px** (sotto il minimo) e taglia i nomi a metà,
   con caselle enormi e vuote.
6. Se si vogliono **Premium** e **Gestionali** sul grafico dell'admin servono
   due colonne nuove (`premium_dal`, `gestionale_dal`): si riempiono da domani
   in avanti, il passato non torna.
7. Restano aperti dai giorni prima: l'email delle 24 ore mai vista partire, e
   ⚠️ le richieste dalle pagine `cerca-*` che mandano telefono ed email in
   chiaro a 5 imprese.

---

## DOVE SIAMO REALMENTE RIMASTI (16 agosto, pomeriggio — il programma AI)

Niente codice scritto in questa parte: **solo decisioni**. La sessione era
troppo piena e si riparte da capo con l'elenco qui sotto.

### Quanto costa l'AI (conti fatti su Claude Haiku 4.5: 1 $/MTok in, 5 $/MTok out)

Una chiamata media del gestionale (controllo di un preventivo, ~1.500 token
dentro e ~600 fuori) costa circa **0,0045 $**, cioè meno di mezzo centesimo.
Con **100 crediti al mese** il costo massimo per impresa è circa **0,45 $/mese**,
**5,4 $/anno**. Su un Premium da 49 € (≈40 € netti dopo tasse e Stripe) è
poco più del **13%** del margine, e solo se uno li usa tutti. Nella realtà la
media sarà molto più bassa.

**Decisione di Alessio: 100 crediti al mese** compresi nel Premium, più la
possibilità di comprarne altri che non scadono.

### L'elenco dei lavori, in ordine

**BLOCCO 0 — chiudere il buco dei crediti** ← si parte da qui

Il sistema dei crediti **esiste già** (tabella `ai_accounts`, funzioni
`consume_ai_credit` e `get_ai_status`, colonna `credits_extra` per quelli
comprati che non scadono). Quello che manca:

- `quota_per_piano` oggi dà: base 0, ai 60, ai_pro 300 → va portato a **100**
  per il piano che paga.
- Serve una funzione SQL riservata al `service_role` che **aggiunge i crediti
  comprati** a `ai_accounts.credits_extra`.
- **`ricarica-crediti.html` NON ESISTE** eppure il pulsante «Ricarica 150
  crediti — 19 €» ci punta: oggi chi clicca finisce su una pagina che non c'è.
- Manca `netlify/functions/crea-checkout-crediti.js` (Stripe pagamento
  singolo, da copiare da `crea-checkout-gestionale.js`).
- Manca l'accredito dentro `stripe-webhook-abbonamenti.js`.
  ⚠️ **Punto delicato**: se il webhook sbaglia, uno paga e non riceve i
  crediti. Va provato anche il caso che deve essere rifiutato (webhook
  ripetuto due volte non deve accreditare due volte).

**BLOCCO 1 — «Controlla i tuoi crediti»**
Una schermata sua: quanti ne restano, quando si rinnovano, dove sono finiti
(quali funzioni li hanno consumati). Un contatore sempre visibile e un
avviso quando si scende sotto il 20%.

**BLOCCO 2 — il bollino «AI»**
Come la (i) dei tooltip di `js/aiuti.js`, ma con scritto **AI**: si mette
**solo dove l'intelligenza artificiale lavora davvero**, e toccandolo dice
cosa fa e quanti crediti costa. Mai un bollino dove l'AI non c'è.

**BLOCCO 3 — il controllore dei preventivi** (l'idea di Alessio)
Prima le **regole fisse**, che non costano niente: condominio senza ritenuta
4%, IVA al 22% su una ristrutturazione, preventivo senza note, prezzo a zero,
cliente senza codice fiscale. Poi l'AI per il resto. **Gli avvisi non
bloccano mai**: segnalano e basta, si può andare avanti lo stesso.

**Poi, nell'ordine:** stesso controllore su fatture e pratiche → scontrino
fotografato che si trasforma in spesa → preventivo dettato a voce →
«chiedi ai tuoi dati» (domande in italiano sui propri numeri).

### E in mezzo, i lavori di grafica rimasti (li ha chiesti lui: «aggiungi anche i lavori elencati da te»)

- **Sezioni allineate alle finestre**: le pagine dietro sono ancora a 16-17 px
  con le schede grigie, le finestre a 21 px su foglio bianco. Stona.
- **Ricerca unica**: una casella sola, scrivi «Verdi» ed escono cliente,
  lavori, preventivi e fatture.
- **«Fattura n. 12/undefined»**: manca l'anno.
- **Il calendario**: scrive a 12 px (sotto il minimo dei 13), taglia i nomi a
  metà, e ha caselle enormi e vuote.

### Da non dimenticare (i lavori vecchi ancora aperti)

- **`prezzi.html` non nomina il gestionale nemmeno una volta** e non esiste
  nessuna pagina pubblica che lo spieghi: resta **la cosa più importante
  rimasta**, più importante dell'AI. È la funzione che vale di più e sul sito
  non c'è scritto da nessuna parte.
- ⚠️ **Le richieste dalle pagine `cerca-*` mandano telefono ed email in chiaro
  a 5 imprese in una volta.** È un problema di privacy, non di grafica.
- **L'email delle 24 ore**: non è mai stata vista partire davvero.
- **Grafico admin, Premium e Gestionali**: per metterli sul grafico servono due
  colonne nuove (`premium_dal`, `gestionale_dal`). Si riempiono da domani in
  avanti, il passato non torna.
- ⚠️ **Mistero non risolto**: `gestionale-app.html` non carica
  `js/assistente-trovaimpresa.js` (cercato tre volte) eppure lì la nuvoletta si
  vedeva. Dopo il push va controllato se è davvero sparita.

### L'ordine completo, in una riga

Blocco 0 crediti → Blocco 1 "Controlla i tuoi crediti" → Blocco 2 bollino AI →
Blocco 3 controllore preventivi → fatture e pratiche → scontrino fotografato →
preventivo dettato → "chiedi ai tuoi dati". In mezzo, quando serve una pausa
dall'AI: sezioni allineate alle finestre, ricerca unica, "Fattura
n. 12/undefined", calendario. E prima o poi, la pagina pubblica del gestionale.

---

## IL GIUDIZIO SUL GESTIONALE (16 agosto — chiesto da Alessio, senza addolcirlo)

Numeri veri del file al momento del giudizio: **1 MB, 16.541 righe, 433
funzioni, 366 chiamate a Supabase, 23 sezioni**, `css/gestionale.css` 2.754
righe.

### Quello che è forte davvero

- **Il mestiere è dentro il codice.** IVA 10 e 22 insieme, ritenuta 4% del
  condominio, cassa del professionista, forfettario col bollo da 2 €. È la
  parte che i software fatti dai programmatori sbagliano, perché non sono mai
  stati in cantiere. È il vantaggio vero e non si copia in fretta.
- **Il Cestino come strato unico.** Ogni cancellazione diventa una data, ogni
  lettura salta le righe cancellate, e sta in un posto solo invece che in 48.
  Scelta da persona esperta.
- **`esc()` usata 479 volte** — il nome di un cliente non può rompere la
  pagina. **87 `.select('id')`** dopo le scritture — si verifica che la
  scrittura sia andata davvero. Disciplina che quasi nessuno ha.
- **Un file solo per 4 profili.** Discutibile, ma per chi lavora da solo è la
  scelta giusta: si mantiene una cosa, non quattro.

### Quello che è debole

1. **I conti esistono in più copie.** Il difetto più caro. Riepilogo, Fatture,
   Report ed Excel calcolano la stessa cosa in punti diversi. Finché combaciano
   non si vede; il giorno che cambia una regola in uno solo, il commercialista
   vede due numeri. Non dà errore: dà il numero sbagliato, che è peggio.
2. **Un file da 16.500 righe.** Non è estetica: ogni modifica tocca il vicino
   di casa. E un telefono in cantiere scarica 1 MB prima di vedere qualcosa.
3. **Nessuna rete di protezione automatica.** I banchi in `prove/` esistono ma
   li lancia Claude. Se Alessio pusha da solo, niente lo ferma. **È la cosa che
   manca di più**, perché è quella che lo protegge quando Claude non c'è.
4. **Il pulsante «Ricarica crediti» che porta su una pagina inesistente** non è
   un bug isolato: è il segno di una funzione data per finita senza provare
   l'ultimo clic. La domanda giusta non è «sistemo quello» ma «quanti altri
   pulsanti fanno lo stesso?».
5. **Troppa larghezza, poca profondità.** Lavori, preventivi, fatture,
   calendario, squadra, mezzi, carte, scadenzario, computo, cestino,
   subappalto, offerte di lavoro. Una persona sola. Rischio concreto: 15 cose
   al 60% invece di 5 al 95%. Se si deve scegliere, la catena
   **preventivo → fattura → incasso** dev'essere perfetta, il resto aspetta.
6. **Nessuno sa che esiste.** Non è un difetto tecnico: è **il** difetto.
7. **Il cantiere non ha campo.** Sotto un ponteggio o in un seminterrato non
   c'è linea, e tutto legge da Supabase in diretta. Foto e rapportini
   dovrebbero salvarsi in locale e partire dopo.
8. **L'AI adesso non è la priorità.** È la cosa più divertente da fare e la
   terza per valore. E le prime cinque regole del controllore (condominio senza
   ritenuta, IVA 22% su una ristrutturazione, prezzo a zero…) le fa il codice
   normale: gratis, senza crediti e senza sbagliare mai.

### Il voto, per essere netti

| | |
|---|---|
| Conoscenza del mestiere | **8/10** — sopra la media del settore |
| Solidità di quello che c'è | **6,5/10** — funziona, ma senza rete |
| Manutenibilità | **4/10** — la parte che farà male fra sei mesi |
| Prodotto sul mercato | **3/10** — perché nessuno sa che c'è |

### Le tre cose da fare, in quest'ordine

1. **La pagina pubblica del gestionale** + una riga in `prezzi.html`. Un giorno
   di lavoro. È l'unica delle tre che porta soldi.
2. **Il controllo automatico al push** (Netlify fa fallire la build): sintassi
   dei blocchi `<script>`, nessun `openSheet(` sui form, nessun testo sotto i
   13 px, nessun link interno morto, e i conti confrontati fra le schermate.
   Mezza giornata. Protegge per sempre.
3. **`js/conti.js`** — i calcoli in una copia sola, e tutte le schermate che
   leggono da lì. Non una riscrittura: solo l'estrazione di `fattConti`,
   `fattImponibile`, `calcolaParcella` e i totali del computo.

Poi l'AI. E appena possibile, la faccenda delle pagine `cerca-*` che mandano
telefono ed email in chiaro a 5 imprese: non è una funzione da migliorare, è
una cosa da chiudere.

# 16 agosto 2026 — BLOCCO 0: IL BUCO DEI CREDITI AI SI CHIUDE, CON UN PAGAMENTO VERO

Punto di partenza, dal controllo del 15 agosto sera: **il pulsante «Ricarica 150
crediti — 19€» portava su una pagina che non esisteva.** Cinque cose da fare, in
quest'ordine, tutte sullo stesso buco.

## Quello che ho trovato prima di scrivere una riga

Tre scoperte, tutte peggio del problema di partenza.

**1. `add_credits_pack` c'era già.** Scritta il 15 agosto, mai chiamata da
nessuno. Non andava creata: andava riscritta, perché aveva un difetto grosso —
vedi sotto.

**2. Nessuno aveva l'AI.** La tabella `ai_accounts` esisteva, la funzione
`get_ai_status` esisteva, la Edge Function `ai-generate` esisteva. Ma **niente
in tutto il progetto scriveva mai `plan = 'ai'`**. Zero righe. Ogni impresa
Premium apriva l'assistente e si sentiva rispondere «funzione non disponibile»:
la funzione c'era, la porta era chiusa a chiave e la chiave non l'aveva scritta
nessuno.

**3. Un pagamento di crediti avrebbe regalato il Premium.** Dentro
`stripe-webhook-abbonamenti.js` il ramo che decide cosa fare col pagamento
finiva su `else if (email)`, e Stripe l'email ce la mette sempre. Un acquisto di
crediti da 19 € sarebbe passato per un acquisto di Premium: crediti non
accreditati **e** un anno di Premium regalato. Il ramo `crediti-ai` deve stare
**per primo**, e adesso ci sta.

## Le cinque cose, e come sono fatte

### 1 e 2 — `sql/ai-crediti-blocco0.sql`

Tre pezzi in una query sola per l'SQL Editor, con una riga di risultato alla
fine (mai `raise notice`).

**La quota:** base 0, **ai 100**, ai_pro 300. Cento crediti al mese per chi paga
il Premium.

**`add_credits_pack` riscritta.** Il difetto della versione del 15: registrava la
ricevuta del pagamento e poi accreditava, senza controllare che l'accredito
fosse davvero avvenuto. Se l'`update` non toccava nessuna riga — utente
sconosciuto, riga mancante — la ricevuta restava, Stripe al secondo tentativo si
sentiva rispondere «già fatto», e **i soldi sparivano per sempre**. Adesso:

```sql
  update public.ai_accounts
     set credits_extra = credits_extra + p_credits, updated_at = now()
   where user_id = p_user_id
  returning credits_extra into v_dopo;
  get diagnostics v_righe = row_count;
  if v_righe <> 1 or v_dopo is null then
    raise exception 'crediti non accreditati' using errcode = 'TI001';
  end if;
```

L'eccezione fa tornare indietro anche la ricevuta. Stripe riprova, e la seconda
volta funziona. **La ricevuta e l'accredito vivono o muoiono insieme.**

**`ai_allinea_piano` + trigger su `imprese`.** È la chiave che mancava. Rispecchia
esattamente `haPremium()` di `gestionale-app.html` (riga 16426): piano `premium`
**e** (`premium_scadenza` nulla **oppure** futura). Non tocca mai
`credits_extra` (sono soldi veri, non si azzerano), non tocca mai `ai_pro`, e
azzera `credits_used` solo quando cambia il mese.

```sql
create trigger trg_ai_allinea_piano
  after insert or delete or update of piano, premium_scadenza, premium_pagato, user_id
  on public.imprese for each row execute function public.ai_allinea_da_imprese();
```

La funzione del trigger **si mangia tutti gli errori**: se qualcosa va storto
nell'allineamento dell'AI, il salvataggio del profilo dell'impresa non si deve
bloccare mai. L'AI è un di più; il profilo è il lavoro.

Risultato in produzione: `FATTO`, **76 imprese con l'AI attiva**, 0 ai_pro,
0 crediti comprati, 0 premium senza AI.

### 3 — `netlify/functions/crea-checkout-crediti.js` (nuovo)

Tre tagli: 150 crediti 19 €, 400 crediti 45 €, 1.000 crediti 99 €.
Copiato da `crea-checkout-gestionale.js`, con tre regole scritte nel file:

- **quanti crediti lo decide il server**, mai il browser (se no chiunque compra
  1.000 crediti a 19 €);
- **chi compra si ricava dal token** di Supabase, mai da un'email nel corpo
  della richiesta (se no si ricaricano i crediti a un altro);
- **chi non ha il Premium viene respinto** con 403 `senza_premium`.

### 4 — `ricarica-crediti.html` (nuovo)

La pagina che mancava. Tre tagli, i crediti che hai adesso, e il ritorno da
Stripe.

### 5 — l'accredito dentro `stripe-webhook-abbonamenti.js`

`accreditaCrediti(supabase, s, ev)`, su `checkout.session.completed` e
`checkout.session.async_payment_succeeded`. Rifiuta se `payment_status !== 'paid'`.
La chiave contro il doppio accredito è l'`id` della sessione Stripe passato come
`p_payment_reference`: due webhook uguali, un accredito solo.

**⚠️ Qui ho rotto di proposito la regola del file.** Tutto il resto di
`stripe-webhook-abbonamenti.js` risponde sempre 200, anche quando qualcosa va
storto, per non farsi martellare da Stripe. Per i crediti no: se l'accredito non
riesce, la funzione **risponde 500 apposta**, così Stripe riprova. Il motivo è
scritto nel file: qui dall'altra parte c'è uno che ha pagato. Meglio un
tentativo in più che uno che ha pagato e non ha niente.

## La prova che conta

Il collaudo vero non è «il pagamento va a buon fine». È:

- **due webhook uguali non devono accreditare due volte** — provato, il secondo
  risponde `already_processed`;
- **un webhook fallito non deve lasciare uno pagato e senza crediti** — provato,
  la ricevuta torna indietro con l'accredito.

E poi il giro intero, con soldi veri: pagina → Stripe → **19 € pagati davvero**
→ webhook → crediti in conto. 100 del mese + 150 comprati = **250**.
(I 19 € sono stati rimborsati dopo.)

---

# 16 agosto 2026 (2) — L'AI ESISTEVA E NON LA TROVAVA NESSUNO

Alessio, con le foto in mano: *«compila con AI la trovo solo qui e in nessun
altro posto»*, e poi *«a una grafica orribile minuscola e poco pratica non
capisco come si usa»*.

Aveva ragione due volte.

## La striscia in cima al gestionale

`#ai-striscia` nella home del gestionale: se l'AI è attiva, quanti crediti
restano, dove si usano, e il pulsante per ricaricare. Tre informazioni che prima
non stavano da nessuna parte.

**Una regola dentro:** se `get_ai_status` non risponde, la striscia **sparisce
del tutto**. Non dice mai «AI non attiva» per colpa di una connessione andata:
sarebbe una bugia che fa smettere di provare.

## L'AI dentro il modulo, non in una finestra a parte

Prima l'assistente era una finestrella nera separata: scrivevi lì, e poi
copiavi a mano. Adesso è una **riga dentro il modulo** che stai compilando.
Scrivi la frase come la diresti al telefono, premi, e **le caselle sotto si
riempiono e si illuminano**.

Le regole, tutte provate:

- parte **chiusa**: chi compila a mano non se la trova tra i piedi;
- dice quanto costa (**1 credito**) prima che tu prema;
- con la casella vuota **non chiama l'AI** e non brucia un credito;
- se l'AI risponde male, lo dice **nella riga** e non tocca niente;
- **non salva niente da sola**: riempie, dice quante caselle ha toccato, e
  aspetta te.

Compare solo sui moduli **nuovi** (`isNew`): su un lavoro che stai modificando
riscriverebbe sopra a roba già controllata.

## ⚠️ Un difetto vero, trovato dal banco e non da noi

Il pulsante «Compila con AI» nella sezione Clienti aveva `class="btn add"`.
Ma `tabBottoneTesta()` **nasconde `.sec-head .btn.add` quando la sezione è
vuota**. Risultato: **chi non aveva ancora nessun cliente non vedeva il
pulsante**. Cioè proprio chi ne aveva più bisogno. Cambiato in `class="btn"`.

Non era un difetto di oggi: c'era già. L'ha trovato il banco di prova.

---

# 16 agosto 2026 (3) — I MIEI SBAGLI, DETTI PER PRIMI

Cinque cose sbagliate mie, tutte trovate in produzione o da Alessio, non da me.

**1. Gli accenti scritti con l'apostrofo nei messaggi del server.**
«Riprova piu' tardi», «La sessione e' scaduta». La mia prova sugli accenti
guardava la **pagina**, non i messaggi che arrivano dalla funzione Netlify.
Corretti, e aggiunta la prova C11 che li raccoglie tutti e sei.

**2. Il messaggio dopo il pagamento diceva una bugia.** `dopoIlPagamento()`
leggeva il numero dei crediti **dopo** essere tornato da Stripe. Ma il webhook è
più veloce del rientro: il numero di partenza era già quello finale, quindi non
saliva mai, e dopo 15 secondi diceva «ci mettono più del solito» a uno che i
crediti li aveva già. Adesso il numero **si salva prima** del salto su Stripe.

**3. «piu'» con l'apostrofo dentro quel messaggio lì.** La mia prova sugli
accenti guardava la pagina a circa 900 ms, e quel messaggio compare dopo 15
secondi. Non l'ha mai visto.

**4. Tre numeri illeggibili.** Alessio: *«non dovrebbero essere 350?»*, poi
*«150 più 250?»*. Avevo messo tre numeri grossi in fila — 250, 100, 150 — dove
il primo era la somma degli altri due, e **niente lo diceva**. Rifatto con il
`+` e l'`=` in mezzo. Sul telefono l'`=` restava orfano in fondo alla riga di
sopra: corretto con `.ct-tot`, e aggiunta la prova R10.

**5. Il tempo.** Alessio: *«perché ci vuole così tanto?»*, *«ogni modifica devo
fermarmi un'ora»*. Aveva ragione. La correzione erano 10 minuti, il banco 2, ma
**i sabotaggi sono 9 minuti** e li ho fatti girare quattro volte mentre lui
aspettava.

> **Regola nuova, da qui in poi:** appena il banco è verde, **il file si
> consegna**. I sabotaggi girano dopo, mentre lui fa il push e prova.

## Le prove che non provavano niente

I sabotaggi hanno smascherato **cinque prove mie che erano verdi e non
controllavano niente**, e **due sabotaggi che erano finti loro** (rompevano solo
uno di due pezzi, quindi il codice restava sano). Le più istruttive:

- **9c** si aspettava un errore da RLS su un `update`. RLS **non dà errore**:
  tocca zero righe e sta zitto. Cambiata a confrontare il numero.
- **5a** modificava `nome`, che **non fa scattare il trigger** (`update of piano,
  premium_scadenza, premium_pagato, user_id`). Cambiata a toccare
  `premium_pagato = premium_pagato`.
- **C8** leggeva l'ultima sessione Stripe creata; quando il codice rotto non ne
  creava nessuna, rileggeva quella di prima e restava verde. Adesso pretende una
  sessione **nuova**.
- **M6b** era sempre vera, comunque andasse.
- **M2c** controllava solo che il messaggio fosse lungo più di 5 caratteri: il
  codice rotto rispondeva «Ho riempito 3 caselle» e passava.

Totale della giornata sul Blocco 0: **289 prove, 50 sabotaggi**, tutti a posto.

---

# 16 agosto 2026 (4) — BLOCCO 1: LA PAGINA PUBBLICA DEL GESTIONALE

Dal voto del 15 agosto: *«Nessuno sa che esiste. Non è un difetto tecnico: è
**il** difetto.»* E la prima delle tre cose da fare era esattamente questa.

**Fatta.** Punto 1 di quella lista: chiuso.

## ⚠️ La trappola, trovata prima di scrivere una riga

Il nome deciso era `gestionale-imprese-edili.html`. Ma `robots.txt`, in fondo,
per **tutti** i motori dice:

```
User-agent: *
Disallow: /gestionale-
```

Serve a tenere fuori `gestionale-app.html` e compagnia — giusto, sono pagine
private. Ma **qualunque** indirizzo che comincia per `gestionale-` viene
saltato. La pagina nuova sarebbe stata invisibile a Google, e tutto il blocco
buttato.

Indirizzo cambiato in **`/software-gestionale-imprese-edili`**: non tocca il
blocco, e «software gestionale» è per di più quello che la gente scrive davvero
su Google.

**Adesso è una prova fissa** (`G0`), col suo sabotaggio: se un domani qualcuno
tocca `robots.txt`, la prova diventa rossa.

## I file

| File | Cosa |
|---|---|
| `software-gestionale-imprese-edili.html` | **nuovo** — la pagina |
| `prezzi.html` | la fascia del gestionale (prima la parola non c'era **zero volte**) |
| `sitemap.xml` | la voce nuova |
| `come-fare-un-preventivo-edile.html` | un link |
| `come-trovare-clienti-impresa-edile.html` | un link |
| `come-trovare-operai-edili.html` | un link |
| `img/gestionale-*.webp` | **5 foto nuove**, 330 KB in tutto |

## Le foto: fatte dal gestionale vero, con dati inventati

`prove/foto_gestionale.js` apre `gestionale-app.html` **vero** in Chromium con
un'impresa edile finta ma verosimile (Condominio Le Betulle, cappotto termico,
ripristino balconi) e scatta cinque schermate. Pagina vera, CSS vero, js veri;
finte solo le risposte di Supabase.

**Nessun dato di clienti veri esce da lì.** E le foto si ritagliano dove finisce
il contenuto: al primo giro tagliavo a un'altezza fissa e le schede dell'ultima
riga restavano mozzate a metà — sembrava una pagina rotta.

## Quello che la pagina dice, e quello che NON dice

Sul mercato è normale scrivere che un gestionale «fa la fattura elettronica» e
lasciar credere che la mandi lui. Qui c'è scritto il contrario, in un riquadro
giallo:

> *Non manda la fattura allo SDI al posto tuo e non fa da intermediario fiscale.
> Prepara il file corretto, tu lo carichi dove lo carichi adesso.*

Idem per l'AI: *«non salva niente da solo»*. **Tutte e due sono prove**
(`G7a`, `G7b`) con i loro sabotaggi: se un domani qualcuno le toglie per far
suonare meglio la pagina, il banco diventa rosso.

E niente riferimenti ad Alessio nel testo — è una prova anche quella (`P7`).
Il footer con nome e sede resta: è quello di tutto il sito, ed è un obbligo di
legge.

## Le prove che non provavano niente (di nuovo cinque)

I sabotaggi hanno rifatto lo stesso lavoro di stamattina, e hanno trovato altre
**cinque prove mie che erano verdi per finta**:

| Dicevo di controllare | Perché era una bugia |
|---|---|
| «ci sono tutte e cinque le foto» | contavo solo **quante**. Scritto `gestionale-fattura` invece di `gestionale-fatture`: cinque foto, una rotta, prova verde |
| «ogni domanda dello schema esiste nella pagina» | confrontavo «a parole in comune»: due domande diverse che parlano di gestionale, imprese ed edili passavano per uguali |
| «la pagina dice che allo SDI mandi tu» | la frase sta in **tre** punti; ne toglievo uno e la prova non se ne accorgeva |
| «prezzi.html nomina il gestionale» | la parola stava dentro l'**indirizzo del link**: cancellando tutti i testi restava verde |
| «niente sborda di lato» | guardavo `document.scrollWidth`. ⚠️ Una fascia larga 1100 px dentro uno schermo da 390 **non lo fa crescere**: la pagina sbordava e la prova era verde |

L'ultima è la più importante da ricordare, perché è generale:

> **`scrollWidth` non basta per sapere se una pagina sborda.** Si guarda
> elemento per elemento chi finisce oltre il bordo destro, saltando quelli che
> stanno dentro una cosa che scorre di suo (le tabelle). Il controllo giusto è
> `chiSborda()` in `prove/banco_pagina_gestionale.js`.

E **cinque sabotaggi erano finti loro**: uno cambiava il blocco `GPTBot` di
`robots.txt` invece di quello `*` (a Google non interessa), un altro toglieva la
frase sullo SDI da uno solo dei tre punti in cui sta.

Fine: **67 prove verdi, 28 sabotaggi, tutti giusti.**

## Regola imparata sullo schema di Google

Le domande dentro `FAQPage` devono stare nella pagina **identiche**, non
«simili». Google toglie il riquadro se non combaciano. Quindi il testo del
`<summary>` e il `name` dello schema si scrivono una volta sola e si copiano —
e c'è la prova `P8` che li confronta carattere per carattere.

---

# 16 agosto 2026 (5) — QUELLO CHE RESTA APERTO

Aggiornamento della lista del 15 agosto.

**Chiuso:**

1. ~~La pagina pubblica del gestionale + una riga in `prezzi.html`.~~ **Fatta.**
2. Il buco dei crediti AI. **Chiuso, con un pagamento vero.**

**Aperto, in ordine:**

1. **Il controllo automatico al push.** Netlify fa fallire la build su:
   sintassi dei `<script>`, nessun `openSheet(` sui form, nessun testo sotto i
   13 px, **nessun link interno morto**, e i conti confrontati fra le schermate.
   Mezza giornata, protegge per sempre. Il punto sui link morti non è teorico:
   vedi qui sotto.
2. **`js/conti.js`** — i calcoli in una copia sola.
3. **Le pagine `cerca-*`** che mandano telefono ed email in chiaro a 5 imprese.
   Non è una funzione da migliorare, è una cosa da chiudere.
4. **L'email delle 24 ore** che non si è mai vista partire.
5. Il grafico dell'admin, che vuole `premium_dal` / `gestionale_dal`.
6. Il «Genera con AI» dei Preventivi: ancora la vecchia finestrella separata.

---

# 16 agosto 2026 (6) — LA FINESTRA DEI PIANI: PREZZI CHE NON ESISTONO E PORTE NEL VUOTO

Alessio: *«poi i prezzi vecchi via, togliamoli»*. Dentro `mostraUpgrade()` di
`js/ai-integrazione.js` c'erano due piani in vendita:

```
{ n: 'AI',     p: '299€', d: '150 preventivi/mese' },
{ n: 'AI Pro', p: '599€', d: '600 preventivi/mese', top: true },
```

**Non sono mai esistiti.** L'AI sta dentro il Premium (100 crediti al mese) e i
crediti in più si comprano a pacchetti da `/ricarica-crediti.html`. Quella
finestra prometteva a un'impresa due abbonamenti che non poteva comprare.

## ⚠️ Ma il difetto grosso era un altro, ed è lo stesso di ieri

Cercando i prezzi ho trovato che **due casi su tre mandavano su
`/abbonamento.html`**, e `abbonamento.html` **non esiste nella cartella**.

Ieri: «Ricarica crediti» → pagina inesistente.
Oggi: «Vedi i piani» → pagina inesistente.

**Due volte in due giorni, stesso identico difetto: una funzione data per finita
senza provare l'ultimo clic.**

## Com'è adesso

| Quando compare | Cosa dice | Dove manda |
|---|---|---|
| crediti finiti | i tre pacchetti veri: 150 a 19€, 400 a 45€, 1.000 a 99€ | `/ricarica-crediti.html` |
| non ha l'AI | «L'assistente AI è dentro il Premium» — 49€/anno o 5€/mese | `/prezzi.html` |
| Premium scaduto | Premium 49€/anno, 100 crediti AI al mese | `/prezzi.html` |

Sotto i pacchetti di crediti **non c'è più il «/anno»**: era scritto fisso nel
codice sotto ogni prezzo, ma i crediti si pagano una volta sola e non scadono.
Dirlo «all'anno» era una bugia sui soldi.

## Due misure sotto il minimo, rimaste lì da mesi

Il banco ha trovato che dentro quella finestra `.ai-occhio` era a **11 px** e
`.ai-tag` («Consigliato») a **9 px**. La regola del progetto è che nel gestionale
sotto i 13 px non ci va niente, e valeva anche lì. Portate a 13.

## Il banco

`prove/banco_finestra_piani.js` — **68 prove**. Fa rispondere 402 alla funzione
dell'AI con i tre motivi possibili e guarda la finestra che esce davvero.
Le due che contano:

- **`F2b`** — ⚠️ ogni indirizzo scritto in un `href:` dentro quel file deve
  esistere davvero, confrontato con l'elenco vero della cartella. È la prova che
  ieri non c'era e che avrebbe preso tutti e due i difetti.
- **`F3`** — i prezzi scritti nella finestra devono essere **gli stessi** di
  `prezzi.html` e di `ricarica-crediti.html`. Se un giorno cambia il prezzo del
  Premium e qualcuno si dimentica di questa finestra, il banco diventa rosso.

---

# 16 agosto 2026 (7) — LA LEZIONE DELLA GIORNATA

Tre volte in due giorni un pulsante ha portato su una pagina che non esiste.
Non è sfortuna: è che **nessuno prova l'ultimo clic**, e non c'è niente che lo
provi al posto nostro.

Da qui in poi ogni banco nuovo ha dentro la stessa prova: **tutti i link interni
di quello che tocco devono esistere**, confrontati con l'elenco vero della
cartella (`prove/elenco-file.txt`). È tre righe di codice e ha già preso due
difetti veri in un pomeriggio.

E resta al primo posto della lista il controllo automatico al push, che quella
stessa prova la deve fare su **tutte** le pagine, non solo su quelle che tocco
io.


---

# 18 agosto 2026 — LA ROBA PRIVATA ERA SCARICABILE DA CHIUNQUE

`publish = "."` pubblica TUTTA la cartella, non solo le pagine. Verificato
dal vivo (non letto nel codice): fino a oggi chiunque poteva aprire

    trovaimpresa.com/CLAUDE.md               (422 KB di memoria del progetto)
    trovaimpresa.com/sql/01-schema.sql       (schema del database e lucchetti)
    trovaimpresa.com/netlify/functions/...   (il codice dei server)
    trovaimpresa.com/docs/*.md               (appunti interni)
    trovaimpresa.com/backup/gestionale-app.backup-20260721.html
    trovaimpresa.com/reclutamento-lazio.csv  <-- nomi, telefoni ed email VERI

L'ultimo e' il peggiore: e' l'unico che riguarda dati di altre persone.

**Le chiavi non c'erano** (stanno nelle variabili di Netlify: nel codice
compare solo il nome, `process.env.SUPABASE_SERVICE_KEY`). Non erano
online nemmeno `prove-claude/`, `node_modules/`, `.claude/`, `www/`,
`android/`, `_to_delete/` e i `.bak`: li tiene fuori il `.gitignore`.
Netlify esclude da solo `netlify.toml`.

## La correzione — 20 rinvii in netlify.toml

Rispondono 404 su `/sql/*`, `/tools/*`, `/netlify/*`, `/supabase/*`,
`/docs/*`, `/backup/*`, `CLAUDE.md`, `BACKLOG.md`,
`PROMPT-sessione-nuova.md`, `reclutamento-lazio.csv`,
`sql-gestionale-upgrade.sql`, `package.json`, `package-lock.json`,
`capacitor.config.json`, i due `genera-*.js`, i tre `.py`, `fix-prompt.txt`.

Servono **tutte e tre** le cose in ogni regola, e sono la parte da ricordare:

- `status = 404`
- **`force = true`** -- ⚠️ SENZA QUESTO NON SERVE A NIENTE: se il file
  esiste davvero, Netlify serve il file e salta la regola. Sembra chiusa
  e non lo e'. E' il modo piu' facile di credersi al sicuro senza esserlo.
- `to = "/404.html"` -- una pagina che esiste

⚠️ Stanno **prime di tutte le altre**: Netlify tiene buona la prima regola
che combacia. E **non toccano `/.netlify/functions/...`** (col punto
davanti), che e' l'indirizzo vero da cui girano le funzioni: provato dopo
il deploy, `sitemap-offerte.xml` risponde ancora.

Restano pubblici apposta: `css/`, `img/`, `js/`, `videos/`,
`locandine-meta/`, `logo.svg/`, `robots.txt`, `llms.txt`, le sitemap.

## `404.html` nuovo

Prima non c'era e Netlify serviva la sua pagina di sistema. Adesso c'e'
una pagina in italiano con logo, "Questa pagina non c'e'" e tre vie
d'uscita (home, guide, contatti). Serve anche a tutti i 404 normali.

## Il controllo al push se ne accorge da solo — `controllaRobaPrivata()`

L'elenco non resta completo da solo: fra un mese nasce una cartella nuova
e nessuno si ricorda di chiuderla. Quindi il controllo **guarda la
cartella vera** e pretende che tutto quello che non deve stare online sia
chiuso davvero (404 + force + pagina esistente). Se manca qualcosa, la
pubblicazione si ferma e dice quale.

Cosa considera privato: le cartelle `sql tools netlify supabase docs
backup`, e in radice ogni file `.md .sql .csv .py .txt .json` piu' i due
`genera-*.js`. Fuori dall'elenco apposta: `robots.txt` e `llms.txt`.

⚠️ Se serve aggiungere un attrezzo `.js` da riga di comando, va messo in
`ATTREZZI_PRIVATI` dentro `tools/controllo-push.js`: l'estensione `.js` da
sola non basta, se no accuserebbe i file veri del sito.

## Come e' stato provato (nei due versi, sempre)

- `prove/banco_controllo_push.py`: da 24 a **37 controlli, 0 rossi**.
  I casi nuovi provano anche quello che **non** deve fermare niente
  (`robots.txt`, una cartella che non c'e').
- ⚠️ Sabotato il `netlify.toml` VERO due volte: tolto il blocco di
  `/sql/*` -> rosso; tolto solo il `force = true` dal csv coi dati
  personali -> rosso. **Il caso del `force` mancante e' quello che conta**,
  perche' e' l'unico che sembra a posto guardandolo.
- Il controllo fatto girare sulla **cartella vera** di Alessio (node dal
  ponte): verde in 4 secondi.
- `netlify.toml` letto con un parser TOML: 32 rinvii, nessun doppione.
- Dopo il deploy, provati online uno per uno: `CLAUDE.md`, `sql/`,
  `netlify/functions/`, `docs/`, `reclutamento-lazio.csv` -> tutti 404.
  `prezzi.html`, `404.html` e `sitemap-offerte.xml` -> a posto.

⚠️ **Trappola del banco, trovata subito:** il banco copia il controllo
dentro il finto sito, quindi in ogni prova esiste una cartella `tools/` —
che e' roba da tenere fuori. Senza chiuderla, tutte le prove con un
netlify.toml diventavano rosse per quel motivo li' invece che per quello
che stavano provando. Sistemato con `BASE_NETLIFY` dentro `sito()`.

## La lezione

Il difetto non era in una riga di codice: era in una **riga di
configurazione scritta il primo giorno** (`publish = "."`) e mai piu'
guardata. Nessuna prova la controllava perche' nessuno la considerava
codice. Da qui in poi il controllo al push la guarda a ogni push.


---

# 18 agosto 2026 (2) — IL TELEFONO DEL CLIENTE NON PARTE PIU' A 5 IMPRESE

La seconda meta' del lavoro sulla privacy, rimasta aperta dal 16 agosto.

## Com'era

Il cliente lasciava la richiesta su una pagina «cerca», e **subito**
partivano 5 email con dentro **nome, telefono ed email in chiaro**, piu' il
pulsante «Chiama il cliente». Le imprese non avevano chiesto niente: se lo
trovavano in casella. Chi non apriva nemmeno l'email si era comunque preso
i dati di una persona.

## Com'e' adesso

L'impresa riceve **zona, categoria, cosa cerca e la data**. Niente contatti.
In fondo un pulsante **«Voglio contattarlo»** che porta su
`/prendi-richiesta?t=<codice>`. I contatti compaiono **solo a chi clicca**,
e resta scritto chi e quando (`richieste_inviate.contatto_visto_at`).

**Scelta di Alessio, fra tre proposte: chi clicca, vede.** Tutte e 5 possono
vederli, ma solo se lo chiedono davvero. Nessuna impresa perde un lavoro
perche' e' arrivata seconda, e il cliente non finisce in mano a chi non era
interessato.

## ⚠️ DUE PASSAGGI, E NON E' UN CAPRICCIO

Aprire il link (GET) mostra **solo** il riepilogo e il pulsante. I contatti
escono al **POST**, cioe' dopo un clic vero.

Il motivo: molti sistemi di posta aziendali **aprono da soli i link** delle
email per controllarli. Con un passaggio solo, quel controllo automatico
avrebbe scoperto i contatti e li avrebbe segnati come «chiesti da
un'impresa» — che e' esattamente la bugia che questo lavoro serve a
togliere.

Il link vale **60 giorni**: un'email vecchia di un anno non deve continuare
ad aprire il telefono di una persona. Scaduto, risponde come a un codice
sbagliato: chi provasse i codici a caso non deve capire se ci e' andato
vicino.

## ⚠️ COSA HO TROVATO PREPARANDO IL LAVORO: `richieste_inviate` NON ESISTEVA

Il codice ci scriveva dentro **da sempre**. PostgREST pero' non lancia:
risponde `{error}` e basta, e quella riga non veniva mai controllata.
Conseguenze, tutte in silenzio:

- non c'era **nessuna traccia** di chi avesse ricevuto cosa;
- il tetto di **3 email al giorno per impresa non ha MAI funzionato**,
  perche' la lettura falliva e il conteggio restava vuoto.

E' la stessa forma di difetto del 12 agosto: una scrittura che fallisce e
una che riesce sono identiche, se nessuno guarda l'esito.

## I file

| file | cosa |
|---|---|
| `sql/richieste-contatto-su-richiesta.sql` | crea la tabella vera, col lucchetto |
| `netlify/functions/prendi-richiesta.js` | **nuovo** — la pagina «Voglio contattarlo» |
| `netlify/functions/richiesta-cliente.js` | l'email senza contatti, col codice |
| `netlify.toml` | il rinvio `/prendi-richiesta` |
| 4 x `cerca-*.html` | **la frase del consenso** |
| `sql/prova-prendi-richiesta.sql` (+ `-pulisci`) | la prova dal vivo |

## ⚠️ IL CONSENSO DEVE DIRE QUELLO CHE SUCCEDE DAVVERO

La frase spuntata dal cliente diceva «...che potranno contattarmi
direttamente». Adesso dice:

> «...accetto che la **mia richiesta** venga mandata a un massimo di 5
> attivita' iscritte della mia zona, e che il mio nome, il mio telefono e
> la mia email vengano dati **solo a quelle che chiederanno di
> contattarmi**.»

**Un consenso che descrive il falso non vale niente**, e la frase accettata
si salva in `richieste_clienti.consenso_testo`: se un domani qualcuno
rimettesse il vecchio giro senza cambiare la frase, il cliente avrebbe
accettato una cosa e gliene succederebbe un'altra. Ci sono due prove
apposta (`P5b`, `P5c`) col loro sabotaggio.

## Le scelte da non ribaltare a cuor leggero

- **La riga di registro si scrive PRIMA dell'email**, ed e' lei a contenere
  il codice: se non si scrive, **l'email non parte**. Meglio nessuna email
  che un'email col pulsante che porta nel vuoto.
- **Se l'email non parte, la riga si toglie**: se no il codice resta appeso
  e occupa una delle 3 al giorno.
- **Niente `reply_to` con l'email del cliente**: rimetterebbe dentro
  l'email proprio quello che stiamo togliendo.
- **La nostra copia a info@ resta intera**: e' la copia di Alessio.
- **`impresa_id` e' un NUMERO** (bigint), non un uuid — lezione del 14
  agosto, quando una colonna uuid al posto di un numero fece fallire una
  scrittura in silenzio. E **niente chiave esterna verso `imprese`**: se
  un'impresa si cancella, la riga di registro deve restare.
- **Il permesso al server si da' a mano** (`grant ... to service_role`), non
  si da' per scontato: il 15 agosto sono stati stretti anche i permessi
  automatici sulle tabelle nuove.

## ⚠️ L'INDICE PARZIALE — un mio errore, corretto lo stesso giorno

La prima versione della migrazione aveva
`create unique index ... (token) where token is not null`. In PostgreSQL un
indice unico **lascia gia' passare quanti NULL vuoi**, quindi la parte
«parziale» non serviva a niente — e in cambio rompeva `on conflict (token)`,
che un indice parziale non lo accetta come arbitro. E' la trappola del
9 agosto (le note del calendario). Non ha rotto niente nel codice vero, ma
era una mina: l'ho vista solo perche' la query di prova la usava, girando
su un PostgreSQL 16 vero. Il file adesso toglie da solo l'indice vecchio.

## Come e' stato provato

- **`prove/banco_contatto_su_richiesta.js` — 41 prove, 0 rosse.** Fa girare
  le DUE FUNZIONI VERE contro un finto PostgREST e un finto Resend. Le
  domande sono sempre le stesse: *il telefono esce da dove non deve?*
- **`prove/rompi_contatto_su_richiesta.py` — 16 sabotaggi, tutti giusti**:
  telefono rimesso nell'email, nome rimesso, `reply_to` rimesso, codice
  uguale per tutte, email mandata senza registro, tetti saltati, contatti
  mostrati gia' al GET, scadenza tolta, codice inventato che apre, noindex
  tolto, database giu' spacciato per link sbagliato.
- **`prove/banco_consenso.js` — da 138 a 154 prove**, con `P5b`/`P5c` nuove.
  **15 sabotaggi**, compreso «il consenso torna a promettere il vecchio giro».
- **SQL su PostgreSQL 16 vero**: rilanciabile, il pubblico non legge e non
  scrive, il server si', il token doppio viene rifiutato.
- **Prova dal vivo sul sito online**: creata una richiesta finta (telefono
  399 000 0000, che non esiste), aperto il link → si vedono solo zona,
  categoria e cosa cerca; premuto il pulsante → compaiono nome, telefono ed
  email. Poi buttata via.

## ⚠️ DUE SABOTAGGI MIEI ERANO FINTI (e la lezione del giorno, ancora)

1. «il link scaduto continua ad aprire il telefono» pretendeva rossa anche
   `D5`, che guardava il **GET** — dove i contatti non escono comunque. La
   prova e' stata spostata sul **POST**, che e' il punto dove la porta deve
   essere chiusa davvero.
2. «un codice inventato apre lo stesso la pagina» assegnava un valore a una
   **costante**: il file non partiva proprio e il banco moriva prima di dire
   qualcosa. **Un sabotaggio deve cambiare il COMPORTAMENTO, non impedire al
   programma di partire.** Riscritto togliendo il filtro sul token.

E il solito: **quando un controllo dice che qualcosa e' rotto, il primo
sospettato e' il controllo.** WebFetch mi ha risposto «pagina non trovata»
su una pagina che nel browser di Alessio funzionava benissimo — e per venti
minuti ho cercato un guasto che non c'era.

## Resta aperto

- L'email vera alle imprese **non e' ancora stata vista partire** da una
  richiesta vera. Il giro e' provato pezzo per pezzo e dal vivo sulla
  pagina, ma la prima richiesta vera va guardata.
- `profilo-impresa.html` ha un **altro** form (tabella `preventivi`), che
  manda i contatti all'impresa **scelta dal cliente**: li' e' 1 a 1 e
  voluto, non e' stato toccato.

---

# 18 agosto 2026 (3) — L'AI DENTRO IL MODULO DEI PREVENTIVI

Il punto rimasto a meta' dal 16 agosto: Lavori e Clienti avevano gia' la
riga dell'AI dentro il modulo, i Preventivi no — usavano ancora la
vecchia finestrella separata, quella in cui scrivi da una parte e poi
copi a mano.

## Com'e' adesso

Nel modulo del preventivo **nuovo** c'e' la riga «AI» in cima, chiusa,
con scritto **1 credito**. La apri, scrivi il lavoro a parole, e si
riempiono **Titolo, le voci di costo e le note**. Le voci compaiono una
sotto l'altra, illuminate. Non salva niente da sola.

## La differenza vera con Lavoro e Cliente

Quelli hanno solo caselle singole. Il preventivo no: la sostanza sono le
**RIGHE**. Percio' `AI_MODULI.preventivo` ha, oltre a `campi`, anche
**`extra`** — una funzione (`aiRiempiPreventivo`) che aggiunge le righe e
le note. La macchina di `aiRigaVia` non e' stata toccata: chiama `extra`
se c'e', e il messaggio finale resta uno solo.

⚠️ **Chi aggiunge una sezione nuova con delle righe** rifa' la stessa
cosa: una voce in `AI_MODULI` con `extra`, e basta.

## Le scelte da non ribaltare

- **Quello che hai scritto a mano non si tocca.** Si tolgono solo le
  righe rimaste vuote; se hai gia' due voci tue, quelle dell'AI vanno
  **in fondo alle tue**.
- **I totali vanno rifatti a mano** dopo aver messo le righe:
  `prevTotaleLive()` + il riepilogo IVA/parcella. Si aggiornano
  sull'evento `input`, che scatta quando scrivi TU, non quando le righe
  le mette il programma. Senza, il totale restava a zero con le voci
  gia' scritte sotto — due numeri diversi nella stessa finestra.
- **Un prezzo che l'AI non sa resta una casella VUOTA, non «0,00».**
  Zero e' un prezzo deciso, e verrebbe sommato come tale. Il conto non
  cambia, cambia quello che leggi. **L'ha trovato il banco, non io.**
- **Cliente e Data l'AI NON li riempie**: la feature `preventivo` del
  server risponde solo titolo, voci e note. Per aggiungerli va
  ripubblicata la edge function su Supabase — passaggio a parte dal push.

## ⚠️ UN DIFETTO VERO, NON DI OGGI

Il pulsante «✨ Genera con AI» in cima ai Preventivi aveva
`class="btn add"`. Ma `tabBottoneTesta()` **nasconde `.sec-head .btn.add`
quando la sezione e' vuota**: **chi non aveva ancora nessun preventivo non
vedeva il pulsante.** E' lo **stesso identico difetto** trovato il 16
agosto sui Clienti, nello stesso punto, e nessuno era andato a guardare
se ci fosse anche altrove. Cambiato in `class="btn"`.

⚠️ **Da qui in poi:** ogni pulsante nuovo in una `.sec-head` va guardato
con la sezione VUOTA, non solo con la sezione piena.

## Come e' stato provato

- **`prove/banco_ai_preventivo.js` — 58 prove, 0 rosse.** Fa girare le
  funzioni vere prese verbatim dal file, dentro Chromium.
- **`prove/rompi_ai_preventivo.py` — 17 sabotaggi, tutti giusti.**

## ⚠️ TRE SABOTAGGI MIEI ERANO FINTI (la stessa lezione, di nuovo)

1. Uno assegnava un valore a `d`, che e' una **costante**: il file
   partiva ma la riga esplodeva subito, e il banco restava verde perche'
   il modulo non veniva toccato lo stesso. **E' identico all'errore del
   16 agosto.** Riscritto come `if(false){...}`, che cambia il
   comportamento senza impedire al programma di partire.
2. Uno pretendeva rosse anche prove che chiamano la funzione
   **direttamente** e quindi non passano dal pezzo rotto.
3. Uno ha smascherato **una prova mia verde che non provava niente**: il
   veleno per l'HTML era `<img src=x onerror=...>` **senza virgolette**,
   e senza virgolette quella roba resta dentro `value="..."` comunque.
   Cioe' passava anche togliendo `esc()`. Adesso il veleno le virgolette
   ce le ha.

Commit `9e18d95`.


---

# 18 agosto 2026 (4) — IL CONTROLLORE DEI DOCUMENTI (idea di Alessio)

> «Non ci deve essere un blocco di invio ma solo una segnalazione.»
> «Noi gli segnaliamo solamente, da solo si deve accorgere.»
> «Piu' che la scrittura, anche la compilazione dei documenti da inviare
> al commercialista, ai fornitori, ai clienti.»

## Che cos'e'

Una **macchina sola**, che vive dentro le finestre `openSheetGrande` e
guarda il documento aperto. Ogni sezione ci porta solo **il suo elenco di
regole**. In fondo alla finestra c'e' il tasto
**«Controlla prima di mandarlo»**.

Le parole del tasto le ha scelte lui («se hai dubbi fai controllare
all'AI»), accorciate cosi' perche' dicono **quando** premerlo, non cosa
c'e' dentro: un attimo prima di scaricare il PDF o di mandarlo al
commercialista.

## Le regole del disegno — da non ribaltare

- **Non blocca MAI niente.** Nessun Salva spento, nessun PDF fermato,
  nessuna schermata nascosta. Solo segni. C'e' una prova apposta (F1-F3)
  che conta i pulsanti spenti e pretende zero.
- **Niente tasto «Correggi».** Scelta di Alessio, ed e' quella giusta per
  lui: ti segna dove e ti scrive accanto com'era giusto, ma a battere sei
  tu — cosi' l'errore lo **vedi**, non te lo ritrovi cambiato alle spalle.
- **Due gravita', e la PAROLA conta piu' del colore.**
  `ROSSO = «DA CORREGGERE»` (il documento esce sbagliato),
  `ARANCIO = «DA GUARDARE»` (si puo' mandare, ma e' meglio vederlo).
  Il colore da solo non basta — a chi legge in fretta e a chi i colori
  non li distingue. **Se fosse tutto rosso, dalla terza volta non lo
  guarderebbe piu' nessuno.**
- **Due momenti.** Da solo quando **esci** da una casella (solo quella);
  col tasto, tutto insieme + un toast che conta e ricorda che non blocca.
  **Mentre batti non succede niente**: un segno che si accende sotto le
  dita e' un fastidio, non un aiuto.
- **Il segno sparisce da solo** appena sistemi la casella.
- **Vale anche sui documenti GIA' SALVATI**, non solo sui nuovi: il
  momento in cui serve e' prima di «Scarica PDF».

## ⚠️ NIENTE BOLLINO AI, PER ADESSO

Oggi il tasto fa **solo le regole gratis** — codice normale, costo zero,
immediate, non sbagliano mai. La parte AI (i refusi tipo «ifacimento»,
le voci troppo vaghe) ha bisogno di **ripubblicare `ai-generate` su
Supabase**, che e' un passaggio a parte dal push.
**Finche' l'AI non lavora davvero, il tasto NON porta il bollino AI e non
nomina i crediti**: un bollino dove l'AI non c'e' e' una bugia (regola
del 16 agosto). C'e' la prova H3 che lo controlla.

## Dove si aggiunge una sezione

Si scrive **solo** la sua voce in **`CTR_DOC`**: `caselle` (dove
attaccare l'orecchio), `dentro` (i contenitori delle righe, che nascono
dopo), `regole` (la funzione che restituisce
`[{el, grave:'rosso'|'arancio', dice:'...'}]`).
**La macchina — `ctrLista` / `ctrSegna` / `ctrTogli` / `ctrGuardaUna` /
`ctrGuardaTutto` / `ctrAscolta` / `ctrTastoHTML` — non si tocca.**

## Le regole scritte oggi

**Preventivo** — titolo mancante (rosso) o generico (arancio); voce senza
prezzo, prezzo a zero, nessuna voce (rossi); quantita' a zero, cliente
mancante, data indietro, IVA non indicata (arancioni); e per i
professionisti la **ritenuta**: spuntata con un privato, o non spuntata
con un condominio o un'azienda.

**Fattura** — cliente mancante (**rosso**, non e' un dettaglio), voce
senza prezzo, prezzo a zero, nessuna voce, **data nel futuro** (rossi);
il **bollo da 2 € del forfettario sopra i 77,47 €** (arancio), e la
soglia guarda l'imponibile **meno lo sconto**.

**Lavoro / Pratica** — «cosa c'e' da fare» mancante (rosso), cliente e
importo mancanti (arancioni); e per gli studi la cosa che fa piu' danno:
**pratica DEPOSITATA senza numero di protocollo (rosso)** — e' il numero
con cui il Comune la chiama. Piu' data di deposito, tipo di pratica e
Comune (arancioni).

⚠️ **La stessa frase cambia parola col ruolo**: «Il lavoro» per
un'impresa, «La pratica» per uno studio.
⚠️ **A un'impresa di protocolli e Comuni non si parla mai.**

## ⚠️ LA TRAPPOLA CHE SI RIPETE IN DUE POSTI

Sia `savePrev` sia `saveFattura` **buttano via le righe senza
descrizione** — prezzo compreso, e **senza dire niente**. Percio' in tutte
e due c'e' la regola rossa «c'e' un prezzo senza descrizione: salvando,
questa riga viene buttata via». Non e' un avviso di comodo: e' un dato
che spariva in silenzio.

## Come e' stato provato

- **`prove/banco_controllore.js` — 75 prove, 0 rosse.** Le domande sono
  tre: segnala quello che deve? **sta zitto quando e' tutto a posto?**
  non blocca mai niente?
- **`prove/rompi_controllore.py` — 27 sabotaggi, tutti giusti.**

## ⚠️ I MIEI ERRORI DI QUESTO PEZZO, DETTI PER PRIMI

1. **Gli accenti scritti con l'apostrofo dentro gli avvisi** — «e'»,
   «piu'», «quantita'» — cioe' proprio nelle frasi che legge Alessio.
   E' il **terzo** giorno che questo inciampo torna. Adesso c'e' una
   prova (H13) che raccoglie **tutte** le frasi `dice:"..."` dal file e
   le passa al setaccio, non solo quelle che il banco fa comparire.
2. **Due sabotaggi rompevano due regole insieme**: le frasi del
   preventivo e della fattura ormai si somigliano, e la ricerca ne
   pescava due. Vanno presi col commento sopra, che e' unico.
3. **Una prova verde per il motivo sbagliato**: «a un'impresa non si
   parla di protocolli» passava perche' nel modulo dell'impresa quelle
   caselle **non esistono proprio** — quindi restava verde anche
   togliendo il controllo sul ruolo. Adesso il banco mette in pagina il
   blocco della pratica **apposta** (`forzaPratica`), con lo stato
   «depositata» e il protocollo vuoto.

## Poi, lo stesso giorno: TUTTE E OTTO LE SEZIONI

Alessio: *«invece di farli uno a uno facciamoli tutti»*. E si e' visto
che la macchina reggeva: cinque sezioni nuove sono state **solo elenchi
di regole**, senza toccare una riga di `ctrLista` / `ctrSegna` /
`ctrAscolta` / `ctrGuardaTutto`. E' la prova che il disegno era giusto.

Coperte adesso: **preventivo, fattura, lavoro/pratica, computo metrico,
cliente, fornitore, fattura da pagare, scadenza.**

**Computo metrico** — titolo mancante (rosso); **ribasso oltre il 100%**
(rosso: vorrebbe dire pagare il cliente per lavorare); numero, cliente,
luogo dei lavori e **prezzario non indicato** (arancioni).
⚠️ **Le lavorazioni NON sono caselle del modulo**: sono righe salvate,
in `compVociCache`. Si guardano solo se `compVociCompId` corrisponde a
`ctrComputoId` — il computo aperto — se no su un computo **nuovo** si
leggerebbero le voci di quello di prima. C'e' la prova M9 apposta.

**Cliente** — nome mancante (rosso); **azienda senza partita IVA**
(rosso: la fattura elettronica non si puo' fare); partita IVA che non ha
11 cifre (rosso, e dice **quante ne ha**); email o PEC senza chiocciola
(rosso); codice fiscale mancante o di lunghezza strana, ne' SDI ne' PEC,
nessun contatto (arancioni).
⚠️ **Si contano le CIFRE, non i caratteri** (`ctrCifre`): «IT 012 345
678 90» e' una partita IVA giusta, e segnarla sarebbe un falso allarme.
⚠️ Il codice fiscale a **11** caratteri passa: condomini ed enti ce
l'hanno cosi'.
⚠️ Il tipo si legge da `#c-tipo-box` `data-tipo`, non dal database: nel
modulo si puo' cambiare senza salvare.

**Fornitore** — nome (rosso); partita IVA e contatti (arancioni).

**Fattura da pagare** — fornitore e importo mancanti, importo a zero, e
la **scadenza PRIMA della data della fattura** (rossi: uno dei due
giorni e' scritto male); scadenza vuota (arancio: non entra nello
scadenzario).

**Scadenza** — titolo e data mancanti (rossi); data gia' passata
(arancio: il promemoria non arrivera' piu').

### Le prove che tengono insieme il tutto

`banco_controllore.js`: **115 prove, 0 rosse**. In fondo, tre prove
(H15/H16/H17) girano sull'elenco delle otto sezioni e pretendono che
**ognuna** abbia il suo tasto, il suo orecchio sulle caselle e la sua
voce in `CTR_DOC`. Una regola scritta e non attaccata a niente non si
vede da fuori: da qui in poi il banco se ne accorge.

## Resta aperto su questo pezzo

- **La parte AI del controllo** (refusi, voci vaghe): serve la nuova
  feature nella edge function `ai-generate` e la sua ripubblicazione.
- **Le sezioni ancora scoperte** sono quelle dove non c'e' molto da
  controllare: squadra, mezzi, carte aziendali, corsi.
- **«Spese: −0,00 €»** dentro la scheda del lavoro: un meno davanti a
  zero. Non rompe niente, si legge male.

---

# 18 agosto 2026 (5) — LA GIORNATA LUNGA: GRAFICA, GARA, IMPORTAZIONI

Sei pezzi, tutti chiesti da Alessio nella stessa serata. Qui in ordine.

## 1. «Il filo» — come si incastrano le sezioni

Alessio: *«non lo capisco, non so come funziona»*, riferito al Prezzario.
Il problema non era il codice: era che **quattro sezioni sono una catena
sola** (Prezzario → Computo metrico → Preventivo → Fattura) e da dentro
una non si vedeva.

`FILO` + `filoHTML(qui)` + `filoMetti(sez,qui)`: una striscia sotto la
frase di apertura, con i quattro passi e quello di adesso acceso. I passi
**riusano** `data-action="rie-go"`, che gia' c'era.
⚠️ Mostra solo i passi il cui pulsante di menu **non e' `display:none`**:
al negozio o al noleggio non si parla di computi metrici. Se restano meno
di due passi, la striscia non compare per niente.
Banco: `banco_filo.js`, 26 prove.

## 2. Le schede del Prezzario, il calendario, le scritte

- **Prezzario**: era l'unica sezione con le righe prese in prestito dalle
  spese (`.spesa-row`). Adesso ha le sue schede (`.pz-griglia`/`.pz-card`).
- **Calendario**: `MAX_CELLA` da 4 a 3 e celle piu' alte, il titolo del
  lavoro su due righe invece che troncato.
- **Le scritte delle sezioni**: erano 15-17 px mentre nelle finestre erano
  18-21. Adesso il passo e' lo stesso. Banco `banco_scritte.js` (19 prove)
  **misurando in Chromium**, non leggendo il CSS.

⚠️ **DUE VOLTE, LO STESSO INCIAMPO**: una regola scritta in fondo al CSS
non entrava in gioco perche' piu' sotto ce n'era una piu' forte
(`.wrap section .job-meta`). Si e' visto solo **misurando**. Regola per
sempre: quando si tocca il CSS, si misura prima e dopo.

⚠️ **LA CASELLA DELL'AI SCHIACCIATA** (segnalata da lui con una foto):
645 px → 206 px. Causa: `js/ai-integrazione.js` inietta il suo `<style>`
a runtime, quindi **dopo** `gestionale.css`, e la sua classe `.ai-riga`
aveva lo stesso nome di quella del modulo. Rinominata `.ai-fila`.

## 3. «Fattura n. 12/undefined» e «Spese: −0,00 €»

`fattAnno(f)` (anno scritto → anno della data → «—», mai `undefined`) e
`fattNum(f)`, usate in **sette** posti compreso il PDF e il nome del file
scaricato. `const _meno=n=>(n>0?"−":"")+eur2(n)`.
Banco `banco_anno_meno.js`, 23 prove. La prova D8 cerca **ogni** `f.anno`
attaccato a una scritta: quella e' la rete.

## 4. La lista delle lavorazioni per la GARA (lavori pubblici)

Alessio ha portato il computo di un ingegnere (`CME per impresa.pdf`,
Magliano Sabina). Studiato: **non e' un computo metrico**, e' la *Lista
delle lavorazioni* di una gara — zero misure in 17 pagine, prezzi vuoti
da riempire. Il nostro computo e' **piu' completo**, non meno.

Mancava solo il foglio da consegnare: `computoListaGara(id)`, secondo PDF
del **solo** computo «lavori pubblici». Niente misure, prezzo **in cifre
e in lettere**, in fondo Ribasso / Oneri / Manodopera come righe vuote da
firmare e lo spazio per il timbro.

⚠️ **In gara, se cifre e lettere non combaciano vale quello in LETTERE.**
Per questo `prezzoInLettere` ha il suo banco (`banco_gara.js`, 66 prove)
che rilegge al contrario tutti i numeri da 0 a 99 e cerca le doppie
vocali da 0 a 1200: `ventuno`, `ventotto`, `centotto`, `centottanta`.

## 5. Importare le lavorazioni in un computo (Excel)

Alessio: *«ma se inserisco nel mio computo il computo di questa persona
posso fare un preventivo?»*. Adesso si':
**⬆ Importa le lavorazioni da Excel**, accanto a «+ Aggiungi lavorazione».

⚠️ **LA REGOLA CHE TIENE IN PIEDI TUTTO**: le voci entrano con
`quantita_manuale:true` («a corpo»). Se entrassero «dalle misure»
varrebbero **zero** — le misure non ci sono — e il preventivo le
butterebbe fuori **tutte**, con l'importazione che sembra riuscita.

⚠️ **Le righe senza quantita' si saltano** (TOTALE, Ribasso %, Oneri,
Manodopera stanno in fondo a quasi tutti i file): prima entravano come
lavorazioni da zero euro. Quante se ne saltano **si dice** nella domanda
di conferma. Senza colonna della quantita' non si importa **niente**.

Banco `banco_importa_computo.js` (45 prove): il gruppo E fa girare
`compImporta` **per davvero**, con un finto database che registra cosa gli
arriva, sul vero file delle 87 lavorazioni.
Sabotaggi: `rompi_importa_computo.py`, **11 su 11**.

## 6. Il Prezzario Regione Lazio 2023 (era in lista da giorni)

⚠️ **DETTO PER PRIMO**: «l'importazione di un prezzario regionale» stava
nella lista «resta aperto» in **tre** punti del diario, dal 13 agosto, e
non era mai stata fatta. Alessio se n'e' accorto lui.

Dai CSV open-data della Regione (lo zip lo ha scaricato lui: dal ponte i
file zip non si prendono) sono usciti **quattro Excel**, 12.762 voci, con
il codice nel formato dei computi (`A03.01.009.a`), la descrizione
completa (voce madre **+** variante) e l'unita' della tendina:

- `prezzario-lazio-2023-edili-e-sicurezza.xlsx` — 4.501 (parti A, G, H, S)
- `prezzario-lazio-2023-impianti-elettrici.xlsx` — 2.797 (D)
- `prezzario-lazio-2023-impianti-tecnologici.xlsx` — 2.915 (E)
- `prezzario-lazio-2023-strade-verde-mare.xlsx` — 2.549 (B, C, F)

Quattro e non uno perche' `PZ_IMP_MAX` e' 5.000. Si importano tutti con
**lo stesso nome di tariffa**: i doppioni li salta da solo.

Lo script che li costruisce sta nel contenitore (`lazio_parse.py`,
`lazio_excel.py`), non nella cartella di Alessio.
⚠️ Dentro lo zip ci sono **due alfabeti** (cp1252 e utf-8) e **due
formati** di colonne (la PARTE E ha il codice attaccato: `E01001a`).

⚠️ **UN DIFETTO VERO TROVATO QUI**: `ppUsa` impostava l'unita' **solo se
stava gia' nella tendina**. Il prezzario vero usa anche `mq/cm`, `paio`,
`addetto`: quelle voci entravano nel computo con **l'unita' rimasta da
prima**, in silenzio. Adesso c'e' `_uniMetti`, che l'unita' che manca la
aggiunge. Banco `banco_prezzario_lazio.js`, 51 prove, di cui cinque
prezzi **controllati a mano** riga per riga sul CSV della Regione.

## Come e' stato provato, in tutto

Dieci banchi, tutti verdi nella stessa serata: `banco_ai_preventivo` 60,
`banco_controllore` 139, `banco_prezzario` 23, `banco_filo` 26,
`banco_calendario` 22, `banco_scritte` 19, `banco_anno_meno` 23,
`banco_gara` 66, `banco_importa_computo` 45, `banco_prezzario_lazio` 51.
Piu' i sabotaggi: `rompi_ai_preventivo` 17, `rompi_controllore` 47,
`rompi_importa_computo` 11.

## ⚠️ I MIEI ERRORI DI OGGI, DETTI PER PRIMI

1. **Il prezzario regionale dimenticato in lista per cinque giorni.**
2. **Un Excel consegnato con quattro righe finte in fondo** (i totali):
   sarebbero entrate come lavorazioni. Rifatto con i totali su un foglio
   a parte, e l'importazione adesso le salta comunque.
3. **Accenti scritti con l'apostrofo** in due messaggi che vede l'utente
   («non puo'», «piu'»). Terza volta questo mese.
4. **Quattro sabotaggi finti** (pezzo ambiguo, attese sbagliate, banco che
   esplodeva invece di segnare rosso). Riscritti, adesso 11 su 11.

---

## 18 agosto 2026, sera — quello che era stato fatto

L'AI dentro il modulo dei preventivi · il controllore dei documenti su otto
sezioni · il filo · schede del Prezzario · calendario · scritte piu' grandi ·
`n. 12/undefined` e `−0,00 €` · lista per la gara con i prezzi in lettere ·
importazione delle lavorazioni da Excel · Prezzario Regione Lazio 2023
(4 file, 12.762 voci) · `_uniMetti`.

*(La lista delle cose da fare che stava qui e' stata sostituita da quella in
fondo, del 19 agosto: i punti 2-10 sono stati chiusi nel frattempo.)*

---

## 19 agosto 2026 — I CAPITOLI, IL QUADRO ECONOMICO, E TRE VOLTE IL BANCO CHE MENTE

Giornata lunga. Tre difetti veri trovati e chiusi, due dei quali **fatti da me
in giornata** — e tutti e tre erano passati **con il banco verde**, sempre per
lo stesso motivo. È la lezione più importante del giorno e sta in fondo.

### 1. Le nove prove «da capire» → `banco_persone_e_numeri.js`

Le nove prove rimaste in sospeso dal banco del 15 agosto (`persone:
t-manodopera, t2-prezzo, t3-duelett, t-operatore, t-finale` · `caselle:
t-dcosto, t-qta3, t-prezzo4, t-carta`) erano **fotografie**: stampavano un log
e chi lo leggeva decideva. Un log non diventa rosso da solo, e infatti in
quattro giorni nessuno se n'era accorto.

Riscritte tutte e nove in **un banco solo**, contro il codice di oggi:
**125 prove verdi, 26 sabotaggi su 26 presi.** Il banco del 15 agosto si può
archiviare. Cosa prova:

- **andata e ritorno delle caselle**: un numero scritto, salvato, riletto e
  rimesso nella casella deve tornare identico (12 valori, più prezzi a quattro
  decimali e quantità a cinque);
- **la virgola italiana**, con una tavola scritta a mano da come si scrive un
  numero in Italia, **non copiata da quello che il gestionale risponde oggi**;
- **pannello e telefono d'accordo**: `_numeroIt` e la sua copia in
  `gestionale-operatore.html` devono dare lo stesso numero su ogni caso —
  «1.250» su una carta carburante aveva già fatto 1250 da una parte e 1,25
  dall'altra;
- **il Cestino e il costo orario**: la tariffa di chi sta nel Cestino resta,
  la media la fa solo la squadra viva, e se la lettura dei vivi fallisce la
  media **non** va a zero (zero = manodopera gratis su ogni lavoro);
- **il margine di un lavoro chiuso non si muove** quando una persona finisce
  nel Cestino (3.000 € con 10 h a 22 €/h → 2.780 €, non 2.900 €);
- **il messaggio prima di eliminare una persona** dice il vero: 24 ore e non
  «3 righe», le foto caricate dal telefono contate, i singolari giusti;
- **chi è revocato non entra** dal telefono (`gest_membri.stato = attivo`).

### 2. I capitoli che il preventivo perdeva — E DUE MODI DI SBAGLIARE

**Il difetto di partenza, riprodotto al banco prima di toccare niente:**
`_computoAPreventivo` leggeva le lavorazioni con `.order("ordine")` e le
buttava in un elenco piatto. Ma `ordine` è il contatore di **tutto il computo**
(max+1 su `compVociCache`), mentre le frecce su/giù spostano solo **dentro** un
capitolo. Quindi:

    computo    →  A01 A02 A03 | B01 B02        (come si vede a schermo)
    preventivo →  A01 A02 B01 B02 A03          (com'era)

Sul foglio che legge il cliente le demolizioni finivano dopo gli intonaci. E i
capitoli non arrivavano affatto: 87 righe attaccate.

**La soluzione:** una colonna `sezione boolean` su `gest_preventivo_righe`
(`sql/gest-preventivo-sezioni.sql`). Una riga di capitolo è una riga come le
altre, con `sezione = true`, **qta 0 e prezzo 0** — regola che non si tocca,
perché in sette punti il totale si fa con `(+qta||1)*(+prezzo||0)` e con quei
due zeri il conto fa zero anche dove nessuno sa dei capitoli.

Toccati: `prevRigaHtml` (riga larga, filo blu), `savePrev`, `prevPdf` (fascia
grigia, colonne dei numeri vuote), `ordineForm` e `incaricoForm` (titolo senza
trattino), `fattDaPreventivoId` (i titoli **non** passano in fattura: nel file
elettronico sarebbero DettaglioLinee da 0 €), `compDuplica`.

#### ⚠️⚠️ IL PRIMO INGANNO: LE CHIAVI DEVONO COMBACIARE

Consegnato, provato sul sito con Alessio davanti: **i capitoli non c'erano.**
88 righe, zero titoli, e la colonna esisteva eccome.

Il perché sta dentro **supabase-js**. Quando gli si passa un ELENCO di righe,
lui mette in fondo all'indirizzo `?columns=<unione di TUTTE le chiavi che
trova>` (`PostgrestQueryBuilder.insert`, riga 1123). PostgREST poi scrive OGNI
riga con quell'elenco di colonne, e le righe a cui una chiave manca **se la
prendono a NULL**: il DEFAULT della colonna NON entra in gioco.

Io scrivevo `sezione` **solo sulla riga del capitolo**, apposta, per non
rompere chi non aveva ancora eseguito la migrazione. Risultato: le altre righe
arrivavano con `sezione` a NULL, la colonna è `NOT NULL`, tutta la scrittura
saltava con il **23502** — e il messaggio del 23502 nomina «sezione», quindi
finiva dritto nel ripiego che toglie i capitoli e li dà per persi.

**LA REGOLA: chi scrive righe di preventivo mette `sezione` su TUTTE, mai su
alcune sì e altre no.** Vale per qualunque scrittura di più righe insieme, non
solo per questa colonna.

Il banco era verde perché il finto Supabase accettava chiavi diverse. Adesso
rifiuta come quello vero.

#### La quantità col punto

Sul PDF del preventivo la quantità usciva `20.46` col punto dell'inglese,
mentre la riga sotto diceva `20,46`. Adesso passa da `_numTesto`, come tutto
il resto (`1` resta `1`, non `1,00`). Stessa cosa nel PDF della fattura, dove
la virgola c'era ma non la rete contro la coda della virgola mobile.

**Banco `banco_computo_preventivo.js`: 68 prove verdi, 31 sabotaggi su 31.**

### 3. Il quadro economico dei lavori pubblici

Il computo dice quanto costano i LAVORI; il quadro economico dice quanto costa
l'OPERA. È il numero che finisce nella delibera.

Sta dentro il computo, **solo sui Lavori pubblici**, subito sotto le
lavorazioni. Colonna `quadro_economico jsonb` su `gest_computi`
(`sql/gest-computo-quadro.sql`) — non una tabella nuova: è un elenco corto che
si legge e si scrive sempre tutto insieme col suo computo.

- **A · LAVORI** viene dal computo, non si scrive niente.
- **B · SOMME A DISPOSIZIONE**: undici righe standard che arrivano già scritte
  a zero (lavori in economia, rilievi, allacciamenti, imprevisti 5%,
  acquisizione aree, accantonamenti artt. 60 e 120, spese tecniche, incentivi
  art. 45 al 2%, commissioni e collaudi, IVA sui lavori 10%, IVA e cassa sulle
  spese tecniche). Ogni riga **o in euro o in percentuale del Totale A**: se
  c'è la percentuale, la casella dell'euro si spegne.
- **TOTALE = A + B**, anche sul PDF, in un riquadro suo.

⚠️ **IL COSTO DELLA MANODOPERA NON SI SOMMA**: sta dentro i lavori, è un «di
cui». Sta su una riga sua, indentata e in grigio, fuori da ogni somma. È la
stessa trappola degli oneri della sicurezza chiusa l'11 agosto, e il banco la
prova rifacendo il gesto di chi somma le righe **con la calcolatrice**.

Trovato mentre si guardava la fotografia: `_eur` dei due PDF del computo non
aveva `useGrouping:true`, quindi Intl in italiano lasciava il punto delle
migliaia solo dai cinque numeri in su — sullo stesso foglio «€ 97.000,00» e
«€ 3000,00». Sistemato.

Riferimenti: D.Lgs. 36/2023 come modificato dal D.Lgs. 209/2024; incentivi
art. 45 (il 2% è il tetto); imprevisti di norma fra il 5 e il 10%.

**Banco `banco_quadro_economico.js`: 91 prove verdi, 37 sabotaggi su 37.**

#### ⚠️⚠️ IL SECONDO INGANNO: `$$` È UNA NodeList

Consegnato, e il computo di Alessio è rimasto a **«Sto caricando…» per
sempre**.

Nel gestionale `$$` è `document.querySelectorAll` e basta (riga 471): una
**NodeList**. Ha `forEach`, **non ha `filter` e non ha `map`**. In `qeAggiorna`
c'era un `.filter`. Non dava un numero sbagliato: **spaccava la funzione** — e
siccome `compForm` la chiama PRIMA di `renderCompVoci`, le lavorazioni non
partivano nemmeno.

Una riga sola che spegne una schermata intera. Nel file ci sono già due posti
che fanno la cosa giusta (`Array.from($$(...))`, righe 5113 e 10820): guardarli
prima di scrivere.

### ⚠️⚠️⚠️ LA LEZIONE DEL GIORNO: IL BANCO PIÙ GENTILE DEL MONDO VERO

Tre difetti, tre volte il banco verde. Sempre per la stessa ragione: **il finto
era più generoso del vero.**

| dove | il finto faceva | il vero fa |
|---|---|---|
| `sb.insert([…])` | accettava righe con chiavi diverse | `?columns=` unione → NULL → 23502 |
| `$$` | restituiva un Array (con `filter`) | NodeList: solo `forEach` |
| `eur2` / `_eur` nelle fotografie | scritti a mano, diversi da quelli veri | quelli del file |

**Regola, da qui in avanti: un finto non deve MAI essere più permissivo
dell'oggetto che imita.** Se accetta qualcosa che il browser o il database
rifiutano, il banco non prova il gestionale: prova sé stesso. Quando si scrive
un finto, la domanda è «cosa **rifiuta** quello vero?», non «cosa accetta».

E le fotografie: gli aiuti (`eur2`, `_eur`, `_numTesto`) si **ritagliano dal
file**, non si riscrivono a mano — se no la foto mostra i numeri del banco.

### I banchi di oggi (stanno nel container, in `prove/`)

| banco | prove | sabotaggi |
|---|---|---|
| `banco_persone_e_numeri.js` | 125 | 26 |
| `banco_computo_preventivo.js` | 68 | 31 |
| `banco_quadro_economico.js` | 91 | 37 |
| (dal 18 agosto) ricerca · collegamenti · schermo · controllore AI · numeri · controllore sezioni · operatore · ondate | 352 | 96 |

`_modulo_preventivo.js` sono gli attrezzi condivisi (DOM vero con jsdom, jsPDF
finto, finto Supabase severo). `jsdom` e `jspdf` vanno installati con `npm i`.

⚠️ Un ritaglio finisce **prima** del commento che apre la sezione dopo, non
dentro: chiudere il taglio a metà di un `/* … */` commenta via tutto il pezzo
seguente senza un errore. Successo oggi con `compRiepilogoDa`.

### Un difetto vecchio, trovato e NON toccato

A 390 px (telefono) la casella della descrizione nelle voci del preventivo si
schiaccia a due dita: `.sheet .prev-riga` a `1fr 80px 118px 48px` non lascia
spazio. Vale per **tutte** le righe, anche quelle di prima. Detto ad Alessio,
lasciato lì.

---

# 19 agosto 2026 (2) — «PRENDI I PREZZI DAL PREZZARIO» (il punto 1, finalmente)

Era il punto 1 della lista da sei giorni. Adesso c'e', ed e' stato provato sul
computo vero di Magliano Sabina: **41 prezzi riempiti su 87**.

## Che cos'e'

Un pulsante in fondo alle lavorazioni del computo. Cerca il **codice** dentro
il prezzario e riempie il prezzo. Tre regole lo tengono in piedi:

1. **Si tocca solo quello che e' a ZERO.** Un prezzo gia' scritto e' una
   decisione presa: non si sovrascrive mai, nemmeno se il prezzario dice
   un altro numero.
2. **Si cerca solo dentro la tariffa dichiarata dal computo.** Sul PDF resta
   scritto «Tariffa Regione Lazio»: pescare il prezzo dall'Umbria, su una
   gara, e' un errore che si paga. Se il computo non dichiara nessuna
   tariffa non si tira a indovinare: si dice e ci si ferma.
3. **Nel dubbio non si riempie, si dice.** `A03.01.019.a` nel prezzario ha
   tre sotto-varianti (`.1 .2 .3`) con prezzi diversi: sceglierne una a caso
   e' PEGGIO che lasciare la riga a zero, perche' lo zero si vede e il
   prezzo sbagliato no. Stessa cosa quando l'unita' di misura non combacia
   (scelta di Alessio: «non riempio e te lo dico»).

Alla fine un resoconto sotto le lavorazioni dice quante ne ha riempite e,
**una per una, perche' le altre no**: sotto-varianti · doppioni con prezzi
diversi · unita' diversa · vale zero anche nel prezzario · codice non
trovato · senza codice · codice non cercabile · non scritta dal database.

## Le tre trappole trovate PRIMA di consegnare

- ⚠️ **I codici non si cercano in memoria.** In memoria ce ne stanno 500
  (`PP_MAX`) e il prezzario del Lazio ne ha 12.762: cercare li' dentro
  avrebbe riempito quattro voci su ottanta e sarebbe sembrato che il
  prezzario non c'entrasse niente. Si chiedono al database a blocchi di 30,
  con `or=(codice.ilike.X,codice.ilike.X.*)` — il codice preciso e le sue
  sotto-varianti in un viaggio solo.
- ⚠️ **Le maiuscole non contano, apposta.** Un ingegnere scrive
  `A03.01.019.A` dove la Regione scrive `.a`: con un confronto secco non si
  sarebbe trovato NIENTE su tutto il computo. Per questo `ilike` e non `like`.
- ⚠️ **I codici con `%` o `_` non vanno al database.** Dentro un LIKE sono
  JOLLY: un codice cosi' pescherebbe mezzo prezzario e riempirebbe la riga
  col prezzo di un'altra lavorazione. Si dicono e basta (`_codPulito`).

E un difetto trovato al banco: il finto accettava un prezzo **negativo** dal
prezzario e lo scriveva. Adesso un prezzo che non e' maggiore di zero non si usa.

## Il prezzario del Lazio adesso e' dentro

I quattro Excel del 18 agosto sono stati importati tutti con lo stesso nome
di tariffa, **`Tariffa Regione Lazio`**, identico a quello dichiarato sul
computo: e' cosi' che il pulsante sa dove cercare. I doppioni li salta da solo.

⚠️ Alla prima prova era stato scelto il file sbagliato (il computo di
Magliano invece del prezzario): il gestionale se n'e' accorto — «87 voci, ma
nessuna ha un prezzo» — e non ha importato niente. Il controllo del 12 agosto
ha funzionato sul campo.

## LA GRAFICA — due cose dette da Alessio guardando lo schermo

**1. «non si capisce niente, e' tutto unito e niente li distingue».**
I quattro pulsanti in fondo alle lavorazioni erano `.btn-ghost`: sfondo
trasparente, NIENTE bordo, testo grigio, a 14 px l'uno dall'altro. Sembravano
una riga di testo. Adesso hanno bordo, sfondo, 12 px di distanza e 46 px di
altezza (il dito). Classe `.comp-azioni`, solo per quella fila: nessun'altra
schermata cambia.

**2. «stona» — e aveva ragione.**
L'arancione era stato messo su UN pulsante solo, per farlo staccare dagli
altri tre bianchi. Risultato: sembrava un avviso, non un'azione. Adesso sono
**tutti e quattro arancioni uguali** (scelta sua, la variante D di quattro
mostrate a schermo). ⚠️ **La regola: in una fila di pulsanti, o sono tutti
uguali o quello diverso sembra un allarme.** C'e' una prova apposta: se un
domani uno torna vestito diverso, il banco diventa rosso.

L'arancione e' **#FF6B35, quello del sito**, non il #C2410C scuro del pulsante
AI del 18 agosto («arancione chiaro come nel sito, non scuro come ieri»).
⚠️ Sul sito quell'arancione sta come FILO a sinistra e come segno delle icone,
mai come sfondo pieno col bianco sopra: bianco su #FF6B35 sta a 3,1 a 1.
Qui fa il bordo e la tinta leggera, il testo resta scuro (#9A3412 su #FFF3EC,
oltre 7 a 1).

**3. «perche' mi devo sforzare per vedere il prezzario?»**
Il codice sopra ogni scheda e la riga grigia sotto stavano a 13,5 px. Portati
a 15. Le note delle sezioni a 15,5.

**4. Le descrizioni tagliate a meta' parola.** Nel resoconto un taglio secco a
110 lettere dava «…e l'avvicinamento del», e sembra che manchi un pezzo del
gestionale, non della frase. Adesso `_przAccorcia` torna indietro all'ultimo
spazio.

## Come e' stato provato

| banco | prove | sabotaggi |
|---|---|---|
| `banco_prezzi_prezzario.js` | 72 | 22 |
| `banco_schermata_prezzi.js` (renderCompVoci vera, jsdom) | 15 | 10 |

Piu' la fotografia col CSS vero (`foto_pulsanti.js`): i quattro pulsanti
devono avere **lo stesso identico vestito**, essere alti almeno 44 px e non
uscire di lato, su 1440×900 e su 390×844.

Il finto Supabase (`_finto_supabase.js`) e' severo come chiesto dalla lezione
di stamattina: rifiuta un `or` con una virgola dentro un valore, un indirizzo
oltre gli 8000 caratteri, un `insert` di righe con chiavi diverse, e tratta
`%` e `_` dentro un `ilike` come JOLLY veri.

⚠️ **Quello che il banco NON poteva provare** era il filtro vero contro
PostgREST. Detto ad Alessio prima di consegnare, nella riga onesta della
scheda. Provato poi sul campo: 41 su 87, e i codici veri con le maiuscole
diverse si sono trovati.

## ⚠️ I MIEI ERRORI DI OGGI, DETTI PER PRIMI

1. **Gli ho detto «colonna di sinistra»** dove le lavorazioni stanno a destra:
   ha cercato il pulsante per due schermate.
2. **Ho messo la scheda di collaudo in un riquadro di codice subito sotto la
   riga del git**: ha incollato tutto in Git Bash e la shell si e' impantanata
   al prompt `>`. **Da adesso: la riga del git da sola, la scheda come testo
   normale.**
3. **Il pulsante e' finito in fondo a 88 righe.** Per trovarlo ci e' voluto il
   Ctrl+F. Resta da mettere anche in cima all'elenco.

---

# 19 agosto 2026 (3) — LE REGOLE DEL DEPOSITO DEI FILE

Stava in lista dal 13 agosto, in tre punti del diario, e nel diario era
scritta piccola: «`foto_team_delete` usa `gest_puo_accedere` senza guardare
la spunta foto». Guardandola sul serio era **piu' grossa di cosi'**.

## ⚠️ IL DEPOSITO «FOTO» NON HA DENTRO SOLO LE FOTO

Seguendo i percorsi che costruisce l'app, dentro `gestionale-foto` finiscono
CINQUE cose diverse:

    <impresa>/<lavoro>/…          le foto (e i video, nell'altro deposito)
    <impresa>/fatture/<id>/…      i PDF delle fatture
    <impresa>/clienti/<id>/…      i documenti dei clienti
    <impresa>/fornitori/<id>/…    i documenti dei fornitori
    <impresa>/commercialista/…    i documenti del commercialista

E la regola era una sola per tutte e cinque: `gest_puo_accedere`, cioe' «sei
un collaboratore attivo». **Quindi un operaio con TUTTE le spunte tolte
poteva scaricare le fatture e i documenti del commercialista, e
cancellarli.** Riprodotto al banco prima di toccare niente: 7 file su 7,
legge e cancella, con tutte le spunte a no.

Sulle tabelle `gest_foto`/`gest_video` la spunta c'era dal 13 agosto. Nel
deposito no — e chi passa dal deposito **scavalca la tabella**. La lezione
generale: *quando una regola sta in due posti (tabella e deposito), sistemarne
uno solo non serve a niente.*

## Com'e' adesso — `sql/gest-deposito-file.sql`

- **cancellare dal deposito: SOLO il titolare.** Non e' una restrizione
  inventata: sulle tabelle solo `foto_owner`/`video_owner` cancellano (i
  collaboratori non hanno nessuna regola di DELETE), e
  `gestionale-operatore.html` dal deposito **non cancella mai** — carica e
  basta, controllato riga per riga.
- **fornitori e commercialista: solo il titolare**, anche in lettura. Nell'app
  dell'operaio quelle due sezioni non esistono nemmeno.
- **fatture -> spunta «fatture»**, **clienti -> spunta «clienti»**.
- **cartella di un lavoro** -> leggere: `foto` o `lavori` o `fatture`;
  caricare: `foto` o `fatture`.
- Le sei regole chiamano **una funzione sola**, `gest_puo_file`: sei copie
  della stessa condizione si disallineano (lezione di `compRiepilogoDa`).

### ⚠️ LA TRAPPOLA CHE IL BANCO HA PRESO PRIMA DELLA CONSEGNA

`gestionale-operatore.html` carica i PDF delle fatture **dentro la cartella
del lavoro** (`MIO.impresaId+"/"+lavoro+"/…"`), NON dentro `fatture/`. Se
sulla cartella del lavoro avessi chiesto solo la spunta «foto», una persona
con **Fatture ✔ e Foto ✘ non avrebbe piu' potuto caricare una fattura dal
telefono**: file rifiutato, e lei senza capire perche'. E' la stessa trappola
chiusa il 13 agosto sulle tabelle, presa dall'altro verso.

### ⚠️ IL PERCORSO STORTO

Le regole di prima facevano `((storage.foldername(name))[1])::uuid` a occhi
chiusi. Basta **un** file il cui percorso non comincia con un uuid e la
lettura di TUTTO il deposito va in errore — non «salta quel file»: fallisce
la Galleria intera. Adesso quel pezzo diventa «nessuna impresa», cioe' un no,
senza errori. Provato con un file `cartella_strana/…` dentro il deposito.

## Il secondo buco, trovato leggendo — `sql/gest-deposito-incarichi.sql`

`docinc_insert_any` sul deposito `documenti-incarichi` diceva una cosa sola:
«il file va in quel deposito». Ed era aperta anche ad **`anon`**. La chiave
pubblica del sito sta dentro la pagina (e ci deve stare), quindi **chiunque,
dal mondo, poteva caricare file li' dentro, in cartelle inesistenti, grandi
quanto voleva.** Non e' un dato che esce: e' un deposito che ti riempiono, e
la banda si paga.

Il caricamento senza account **serve e resta** (un cliente che manda un
incarico non ha un account). Adesso pero':

- si carica **solo dentro la cartella di un professionista che esiste**;
- **i 10 MB li fa rispettare il database** (`file_size_limit` sul bucket).
  Prima quel limite stava scritto solo dentro `profilo-impresa.html`.

⚠️ **NIENTE elenco di tipi di file permessi, ed e' una scelta.** La pagina
accetta i `.dwg`, che il browser manda come `application/octet-stream`. Un
elenco dovrebbe per forza accettare «octet-stream», cioe' qualunque file:
sembrerebbe un controllo e non lo sarebbe.

⚠️ **Quello che NON e' chiuso:** uno puo' ancora caricare tanti file da 10 MB
nella cartella di un professionista vero. Contro quello ci vuole un conteggio
delle richieste, non una regola del database. Detto invece che nascosto.

## Come sono stati provati

Su un **PostgreSQL 16 vero**, con `gest_puo_accedere`, `gest_puo_sezione` e
`storage.foldername` **copiate VERBATIM dal database di produzione** (fatte
leggere ad Alessio con tre query di sola lettura, apposta per non ricostruirle
a memoria — e' l'errore del 9 agosto).

| banco | prove | sabotaggi |
|---|---|---|
| deposito foto e video | 392 | 11 |
| deposito incarichi | 127 | 6 |

I sabotaggi rompono **il file vero che va su Supabase**, non una copia: lo
script lo patcha, rimonta il database da zero e ricontrolla.

### ⚠️ DUE VOLTE IL FINTO ERA SBAGLIATO, E SE NE E' ACCORTO IL BANCO

1. **Chi non ha fatto il login non e' «authenticated con l'uid vuoto»: e' un
   altro RUOLO (`anon`).** Una regola scritta `to authenticated` per lui non
   esiste proprio. Il banco lo faceva passare da `authenticated`, cioe'
   provava la cosa sbagliata. Corretto: se non c'e' uid, `set role anon`.
2. **Il finto `storage.buckets` era piu' POVERO del vero** (mancavano
   `file_size_limit` e `allowed_mime_types`) e `imprese` non era leggibile
   dai ruoli `anon`/`authenticated`, mentre sul sito lo e'. Le prove dicevano
   «no» dove il database vero dice «si».

   E' il rovescio della lezione del mattino: un finto non deve essere **piu'
   permissivo** del vero, ma nemmeno **piu' povero** — nel primo caso non
   trova i difetti, nel secondo ne inventa.

### ⚠️ IL BANCO SEGNA ROSSO, NON ESPLODE

Il sabotaggio del percorso storto faceva morire lo script con un messaggio di
psql invece di contare una prova rossa. Adesso l'errore dentro una regola
**e' un no, e si conta**. E l'ordine in cui si montano i pezzi del banco
conta: prima il pilota che non esplode, poi le attese.

---

## DOVE SIAMO RIMASTI (19 agosto 2026, primo pomeriggio)

**Fatto stamattina:** le 9 prove «da capire» riscritte · i capitoli dal computo
al preventivo · la quantita' con la virgola sui PDF · il quadro economico dei
lavori pubblici · il punto delle migliaia sui PDF del computo.

**Fatto a mezzogiorno:** «Prendi i prezzi dal prezzario» (41 su 87 sul computo
vero) · il prezzario del Lazio importato davvero, tariffa «Tariffa Regione
Lazio» · i quattro pulsanti del computo tutti arancioni uguali · il testo del
Prezzario piu' grande · le descrizioni che non si spezzano.

**Fatto nel pomeriggio:** le regole dei due depositi di file.

**Migrazioni SQL eseguite oggi:** `sql/gest-preventivo-sezioni.sql` ·
`sql/gest-computo-quadro.sql` · `sql/gest-deposito-file.sql` ·
`sql/gest-deposito-incarichi.sql`.

**Da fare, in ordine:**

1. **La contabilita' dei lavori (SAL)** — chiesta da Alessio il 19 agosto.
2. **L'analisi dei prezzi** — chiesta da Alessio il 19 agosto. Su un lavoro
   pubblico la chiedono in appendice, con l'elenco dei prezzi unitari.
3. **Il difetto del telefono** sulle righe del preventivo: a 390 px
   `.sheet .prev-riga` a `1fr 80px 118px 48px` schiaccia la descrizione.
4. **Il pulsante dei prezzi anche in cima** all'elenco delle lavorazioni: in
   fondo a 88 righe non lo trova nessuno (ci e' voluto il Ctrl+F).
5. **`cv-candidati/registrazioni`**: stessa famiglia del deposito incarichi.
   La cartella e' gia' bloccata, manca solo il limite di misura.
6. **Il conteggio delle richieste** per fermare chi insiste a caricare file:
   non si fa con una regola del database.

**Sul sito (fermo da giorni):**

7. **95 pagine citta' vuote** in Search Console.
8. **L'email vera alle imprese** non e' mai stata vista partire da una
   richiesta reale.
9. **Il grafico dell'admin** vuole `premium_dal` e `gestionale_dal`.

**⚠️ NETLIFY.** Il sito e' andato in pausa il 19 agosto a meta' mattina: «This
site was paused as it reached its usage limits». Non era un difetto del
codice. Sul piano gratuito ci sono **300 crediti al mese** e **ogni push ne
costa 15** (un deploy): circa **venti push al mese**. Il traffico c'entra poco
(1 GB = 20 crediti). Piani: Personal 9 $/mese (1.000 crediti), Pro 20 $/mese
(da 3.000). **Regola pratica: raggruppare le modifiche in un push solo.**
Il 19 agosto ne sono partiti tre per tre cose che potevano viaggiare insieme.

**Roba di prova da buttare:** i preventivi n. 4, 5 e 6 del reparto «progetto
casa» sono nati dalle prove del 19 agosto.

**⚠️ I banchi di prova stanno nel container, in `prove/`**, come vuole la
regola di Alessio, e spariscono a fine sessione. Quelli del deposito
(`banco_deposito*.sql`, `banco_incarichi*.sql`, `gira_banco*.sh`,
`rompi_deposito.py`, `rompi_incarichi.py`) valgono piu' degli altri, perche'
ricostruirli vuol dire rifarsi dare dal database le tre funzioni verbatim.
La proposta di tenerli in `prove/` nella cartella di Alessio, fuori dal deploy
con un rinvio in `netlify.toml`, resta sul tavolo: **non si sposta niente
finche' non lo dice lui.**

---

# 19 agosto 2026 (4), SERA — IL PIXEL DIETRO IL BANNER, LA MAPPA, IL SAL

## ⛔⛔ IL 62% NON ERA GENTE PERSA: ERA IL PIXEL DIETRO IL BANNER DEI COOKIE

Il punto 1 della lista («su 854 che cliccano ne arrivano 326») e' stato
chiuso in dieci minuti, e la risposta non c'entrava niente con la velocita'.

**Il pixel di Meta sta dentro `cookie-banner.js` e parte SOLO dopo il clic su
«Accetta tutti».** Chi sceglie «Solo tecnici», o chi il banner non lo tocca,
per Meta **non e' mai arrivato**. →326← su →854← fa il **38%**: e' la
percentuale di chi accetta i cookie, non di chi arriva.

⚠️ **La nota vecchia del diario diceva «lo inietta Netlify». Era sbagliata.**
Nasceva da una prova fatta bene ma letta male: Alessio aveva scritto
`typeof fbq` sul suo computer e gli aveva risposto `'function'` — perche' LUI
aveva gia' accettato, e la scelta resta salvata un anno in `localStorage`.
**Una prova fatta da chi ha gia' dato il consenso non prova niente sul
visitatore nuovo.** Cercare la seconda copia del pixel nei file (`grep -rl
connect.facebook.net`) l'ha chiusa: c'e' un posto solo, ed e' cookie-banner.js.

Provato con un browser vero, 9 prove verdi, nei due versi: visitatore nuovo →
`fbq` non esiste; «Solo tecnici» → non esiste; «Accetta tutti» → esiste e
chiama facebook; consenso gia' salvato → parte da solo.

**Corollario che vale anche per i →44← iscritti:** pure quelli sono
sotto-contati, perche' `CompleteRegistration` sta dentro lo stesso
`if (typeof fbq !== 'undefined')`.

## Il contatore delle visite — `sql/conteggio-visite.sql` + `js/conta-visita.js`

Serve un numero che non dipenda dai cookie. Scrive **due righe per apertura**
di pagina nella tabella `public.visite_sito`:

- `fase = 'arrivo'` -> il browser ha eseguito lo script (subito, `async`, in testa)
- `fase = 'visto'`  -> la pagina si e' disegnata E la persona era ancora li' dopo 2 secondi

**`arrivo − visto` = quanti se ne vanno prima di vedere il sito.** E' li' che
si misura la lentezza, quando i dati ci saranno.

Legge `fbclid`, il codice che Meta attacca a ogni clic: `arrivo` con
`da_meta = true` e' il numero da confrontare con gli 854.

⚠️ **`ms_attesa` comprende i 2 secondi di attesa.** Per sapere quanto ci ha
messo la pagina, togliere 2000. Sul computer di Alessio: →3380← ms, cioe'
circa **1,4 secondi** di caricamento.

Niente cookie, niente IP, niente nome. L'id di sessione e' un numero a caso in
`sessionStorage` che muore chiudendo la scheda: statistica di prima parte, non
profilazione, e infatti gira **prima** del banner.

⚠️ `anon` sulla tabella puo' SOLO scrivere, colonna per colonna: `creato_il` e
`id` non sono scrivibili, cosi' nessuno si inventa la data di una visita.
Nessuna policy di lettura: le vede solo `postgres`.

**Deciso: non toccare la campagna Meta per una settimana e rimisurare.**

## LA MAPPA — da →4← imprese a →86←

Il diario diceva «lat e lng vuote per TUTTE». Il valore vero era **4**.
Guardare il valore, non la nota (lezione 8 del mattino, di nuovo).

Numeri veri: 87 imprese · 86 con la citta' · **26** con l'indirizzo · 4 con la
posizione. Quindi la mappa si poteva riempire quasi tutta.

**Deciso da Alessio:** chi ha l'indirizzo va sul punto vero; chi ha solo la
citta' va sulla sua zona, **sparpagliato di poco** (300 m + 250 m per anello,
8 posti per anello) cosi' dieci imprese di Roma non diventano un pallino solo.
Sulla scheda si scrive «**zona di Roma (RM)**», mai un indirizzo che non
abbiamo. Chi e' solo nella sua citta' resta sul centro esatto.

⚠️ **Il riempimento lo lancia Alessio**, non Claude: il container non ha
internet e OpenStreetMap serve. Percio' `tools/riempi-mappa.html`, che **non
va online** (`/tools/*` e' gia' un 404 in netlify.toml) e si apre col doppio
clic. Password digitata da lui, verificata da `admin-dati.js`. Si puo'
rilanciare: salta chi ha gia' la posizione. Risultato: **81 + 4 = 85**, poi
86 al secondo giro (una richiesta a OpenStreetMap era fallita).

⚠️ **`mappa.html` NON usava `lat`/`lng`.** Chiedeva la posizione di ogni
impresa mentre l'utente aspettava: 86 × 1,1 s = **un minuto e mezzo di schermo
vuoto**. Nessun visitatore aspetta tanto — ecco perche' sembrava vuota.
Adesso legge le posizioni dal database e i pallini compaiono subito; il giro
lento resta solo per chi la posizione non ce l'ha.
Il banco l'ha girato anche sul file di PRIMA: **12 prove rosse**. Un banco che
non diventa rosso sul file rotto non prova niente.

⚠️ Correzione detta per prima: «le pagine di ricerca usano gia' lat e lng» era
vero per `cerca-imprese.html`, **falso per `mappa.html`**. E il sospetto che
la mappa fosse vuota per il nome sbagliato (`nome` invece di `nome_attivita`)
e' caduto guardando i dati: `nome` c'e' ed e' pieno su 86 su 87.

## LA CONTABILITA' DEI LAVORI (SAL) — `sql/gest-sal.sql`

⚠️ **Alessio ha detto «non lo so, non e' il mio lavoro».** Gli e' stato
proposto di fermarsi (regola del 15 agosto: se non puo' collaudarlo e nessuno
l'ha chiesto, va in fondo alla lista). Ha risposto: «facciamo SAL poi i
clienti si adeguano». **Costruito su sua decisione esplicita.** Quando la
prima impresa lo usera' davvero, farsi spiegare da LEI come lo fa.

**Le quantita' sono PROGRESSIVE**: in ogni SAL si scrive quanto si e' fatto
DALL'INIZIO, non da ultima volta. Se un mese sbagli a contare, il mese dopo si
raddrizza da solo. E' anche come lo chiede l'Allegato II.14 del D.Lgs.
36/2023: il SAL dice il corrispettivo maturato e gli acconti gia' corrisposti.

    questo SAL = maturato di oggi − maturato del SAL precedente

⚠️ **IL PRECEDENTE E' UNO SOLO, NON LA SOMMA DI TUTTI.** Il maturato del SAL
n.2 comprende gia' dentro il n.1: sommarli conterebbe il lavoro due volte.
Il sabotaggio «somma tutti i precedenti» e' quello che ha fatto diventare
rossa la prova 8.

⚠️ **Il ribasso non si ricalcola nel SAL:** passa da `compRiepilogoDa()`, che
resta l'unico posto dove quella formula esiste. La vista del database da' i
tre numeri grezzi (lordo, oneri sicurezza, manodopera) maturati, e basta.

Provato su un PostgreSQL 16 vero, con lo schema **ricostruito dai file in
`sql/`**, ruoli `anon`/`authenticated`/`service_role` e `auth.uid()` finta
pilotabile: **24 prove verdi**, 7 sabotaggi presi tutti. Fra le prove che
contano: un altro utente non puo' agganciare al proprio SAL una voce del
computo di Alessio (ne leggerebbe descrizione e prezzo dalla vista).
Sullo schermo altre **24 prove**, con le funzioni **ritagliate dal file**
consegnato, e i due lati danno lo stesso numero: 6.000 e 14.000.

Aggiunta `gest_sal` a `CEST_COSE` e all'elenco `TABELLE` di `js/cestino.js`.

**Manca il PDF.** Il SAL si compila e fa i conti, ma non si stampa: e' il
prossimo giro.

## ⛔ I PULSANTI CHE NON SI VEDEVANO — 19 in tutto il gestionale

Detto da Alessio guardando lo schermo, **tre volte su tre schermate diverse**:
«questi bottoni restano sempre invisibili». Aveva ragione.

`.btn-ghost` nasce **senza sfondo e senza bordo**. Su una pagina piena di
caselle bianche col bordo, «+ Aggiungi voce», «+ Aggiungi nota», «+ Aggiungi
nuovo cliente» si leggono come una scritta, non come una cosa da cliccare.
Erano cosi' in **19 punti**: fatture, preventivi, computo, pratiche, quadro
economico, SAL.

Sistemati **tutti insieme con una regola sola** su `.quick-add` in
`css/gestionale.css`: bordo blu 1,5 px, sfondo bianco, 46 px di altezza,
17 px di testo, larghezza piena sotto i 768 px.

⚠️ **La regola sta PRIMA di `.comp-azioni .quick-add` nel file, e ci deve
restare.** I quattro arancioni del computo hanno la stessa specificita': se un
domani questa regola finisse sotto la loro, diventerebbero blu e la fila del
computo tornerebbe come prima. Il banco lo controlla apposta.

9 prove verdi con un browser vero (bordo, sfondo, 46 px, 17 px, colore, i
quattro arancioni ancora arancioni, telefono a 390 px). Col foglio di stile
di prima **5 diventano rosse**.

⚠️ Stessa famiglia: la casella della quantita' nel SAL era **alta due
millimetri**, perche' non sta dentro un `.field` e il CSS del gestionale non
la vestiva. Adesso le misure sono scritte nel tag.

## Migrazioni SQL eseguite oggi (sera)

`sql/conteggio-visite.sql` · `sql/mappa-posizioni.sql` · `sql/gest-sal.sql`

## ⚠️ DUE ERRORI MIEI DI STASERA, DETTI PER PRIMI

1. **La riga del git con una virgoletta di troppo alla fine** (`git push"`).
   Alessio l'ha incollata e Git Bash e' rimasto fermo sul prompt `>` — ed e'
   ESATTAMENTE l'inciampo gia' scritto nel diario di mezzogiorno. Poi, nel
   correggerla, ho storpiato il nome di un file. **La riga del git va riletta
   carattere per carattere prima di mandarla, sempre.**
2. **Dopo il lavoro, `tools/riempi-mappa.html` nasconde il riquadro con
   «Comincia» e non lo rimette.** Alessio ha scritto «non si puo'»: sulla
   pagina non c'era piu' niente da cliccare, e nessuno gli aveva detto che
   bastava un F5. Da rimettere quando si ritocca quella pagina.

## DOVE SIAMO RIMASTI (19 agosto 2026, sera)

**Le tre che vengono prima:**

1. **Leggere il contatore delle visite fra 2-3 giorni.** La query sta in fondo
   a `sql/conteggio-visite.sql`. E' l'unica cosa che risponde davvero alla
   domanda degli →854← clic.
2. **Il PDF dello stato di avanzamento.**
3. **L'errore JavaScript sulla homepage** (`assistente-trovaimpresa.js`
   caricato due volte). Nei file compare **una volta sola** — controllato: la
   seconda copia la mette qualcun altro, quasi sicuramente l'iniezione di
   Netlify, la stessa strada del pixel. **Guardare li', non nel codice.**

**Poi:** l'analisi dei prezzi · la descrizione schiacciata a 390 px sui
preventivi (`.sheet .prev-riga` a `1fr 80px 118px 48px`) · il pulsante del
prezzario anche in cima · il limite di misura su `cv-candidati/registrazioni`
· il conteggio delle richieste di caricamento.

**Sul sito:** le 95 pagine citta' vuote · l'email vera alle imprese · il
grafico dell'admin (`premium_dal`, `gestionale_dal`).

**Pulizie:** i preventivi n. 4, 5 e 6 del reparto «progetto casa» · e in
`imprese` c'e' **una riga completamente vuota**, trovata riempiendo la mappa.

**Decisione che resta ad Alessio:** l'indirizzo sta nel blocco FACOLTATIVO
della registrazione, e 61 imprese su 87 non l'hanno scritto. Senza indirizzo
il pallino resta sulla zona. **Non si cambia il modulo senza il suo via.**

---

# 19 agosto 2026 (5), TARDA SERA — IL PREZZO

Alessio ha chiesto un parere sul business, dicendo «di business non ne so
niente». Non era una domanda tecnica ed e' la piu' importante della giornata.

## Com'era e cosa non tornava

Un piano solo, **Premium 49 € all'anno**. Cioe' **4 € al mese**, per un
prodotto che dentro ha computo metrico, prezzario regionale (12.762 voci),
preventivi, fatture con casse e ritenute, SAL, quadro economico.
[CantieriCloud](https://cantiericloud.com/), concorrente diretto, chiede
**49 € al MESE** per un gestionale che fa meno cose.

⛔ **Il conto che ha deciso tutto:** portare un'impresa iscritta con la
pubblicita' costa **5,47 €**. Se paga una su dieci — percentuale normale — un
cliente pagante costa **54,70 €**. Il prezzo era **49 €**.
**Ogni euro di pubblicita' era un euro perso**, e non per colpa della
pubblicita'.

## La decisione

**Il piano gratuito resta esattamente com'e'. Il Premium passa a 29 € al mese,
oppure 249 € l'anno.** Un piano solo, con dentro tutto — visibilita' e
gestionale. I tre mesi di prova restano: adesso valgono **87 €**, prima 12.

Per 40.000 € di incassi l'anno servono **115-161** clienti paganti invece di
**816**.

⚠️ Strade scartate lungo la discussione, e vale la pena sapere perche':
- **29 € al mese col gestionale a parte e la vetrina gratis**: scartata perche'
  Alessio non voleva due prodotti da spiegare.
- **49 € al mese**: proposta da me (stesso prezzo del concorrente, ma con piu'
  roba dentro). Scartata da lui.
- **Regalare anche la visibilita'**: gliel'ho sconsigliato e l'ha tenuta a
  pagamento. ⛔ **Priorita' nei risultati, visibilita' regionale e spazi
  pubblicitari sono POSTI, e i posti sono limitati: se ce l'hanno tutti non ce
  l'ha nessuno.** Regalarle non le svaluta — le fa smettere di esistere. Sono
  l'unica cosa davvero scarsa che TrovaImpresa ha.
- **Tenere le 87 imprese al vecchio prezzo**: proposto da me, scartato da lui
  con una ragione giusta — **nessuno ha ancora pagato**, quindi non si rompe
  nessuna promessa.

## Le regole del cambio

1. **Il prezzo nuovo vale per tutti.** Nessuno ha ancora pagato.
2. **Va detto PRIMA**, non quando gli chiedi i soldi. Fra due mesi le imprese
   di luglio arrivano in fondo ai tre mesi di regalo: se scoprono il prezzo
   nuovo al momento di pagare, se ne vanno e lo raccontano in giro.
3. **Niente sconti sul prezzo.** Il regalo sono i tre mesi, non il prezzo
   tagliato: uno sconto dice che non valeva quello che chiedevi.
4. **Dentro il database `premium` resta `premium`.** Cambia solo il prezzo e
   quello che si legge a schermo. Rinominare `piano='premium'`, `premium_dal`
   e il resto vorrebbe dire toccare mezzo gestionale per niente.

## Il mercato — i numeri, non le impressioni

**717.000** imprese edili attive in Italia; solo il **20%** usa un software per
i cantieri (**143.000**); il 60% e' fermo a carta ed Excel (**430.000**).
Ne servono 115-161: **una impresa ogni 4.500** di quelle che gia' usano
qualcosa.
⚠️ Il rovescio: il **71%** delle imprese edili ha meno di due dipendenti. Sono
proprio i suoi, e sono i piu' difficili da far pagare.

## ⚠️ LA COSA PIU' IMPORTANTE, E NON E' IL PREZZO

**Il gestionale e' aperto da una settimana e le 87 imprese iscritte non lo
sanno.** Era chiuso per lavori fino a poco fa. Quindi:

- il «una su dieci pagera'» **non e' un dato suo**: e' una media di settore;
- nessuna di quelle 87 ha detto no al gestionale — **non gliel'hanno ancora
  fatto vedere.**

**Prima del prezzo va fatto vedere il prodotto**, e va contato quante lo
aprono. Costa zero e si sa in due settimane. Se non lo apre nessuno, il prezzo
giusto non serve a niente e il problema e' un altro.

Alessio **non vuole mandare email**: l'avviso va messo **dentro il pannello**,
dove le imprese passano gia'.

## I fogli

`IL-PREZZO-i-conti-veri.md` (i conti e le tre strade) e
`IL-PREZZO-la-decisione.md` (la decisione presa, le regole, cosa fare nel
sito). Stanno nella cartella del progetto.

---

# 19 agosto 2026 (6), NOTTE — IL SAL SI CHIUDE: IL FOGLIO E LA FATTURA

Il SAL aveva il database e la schermata, e gli mancavano le due cose per cui
esiste: il **foglio da consegnare** e la **fattura per farsi pagare**.
Adesso ci sono tutte e due.

## 1. Il PDF dello stato di avanzamento — `salPdf()`

Il foglio A4 che si consegna al committente o al direttore dei lavori.
Intestazione (azienda / cliente / lavori / periodo), la tabella delle
lavorazioni (N. · Tariffa · Descrizione · U.M. · Q.tà eseguita · Prezzo
unitario · Importo) e in fondo il riquadro dei conti:

    Lavori eseguiti dall'inizio  −  Ribasso  =  Importo maturato
    −  Gia' liquidato coi SAL prima  =  Importo di questo SAL
    −  Ritenuta di garanzia  =  NETTO DA PAGARE

Sui lavori pubblici stampa anche oneri della sicurezza maturati e costo del
personale, che l'ente chiede sempre.

**⛔ Il PDF NON esce** (e lo dice, invece di uscire monco) quando:
- una delle letture va in errore — e' la lezione del PDF del computo del
  14 agosto: un errore non guardato faceva uscire un foglio col buco dentro e
  il messaggio diceva pure «scaricato ✅»;
- il SAL non ha nessuna lavorazione contata;
- **ci sono modifiche non salvate nelle caselle** — il foglio nasce da quello
  che sta nel database, e un documento che non e' quello che hai davanti e'
  peggio di nessun documento (`salModifiche()`);
- **la somma delle righe stampate non fa il totale del riquadro**: un foglio
  che si contraddice da solo non si consegna.

Fascia rossa «NON DA CONSEGNARE» e prefisso `BOZZA-` nel nome del file se il
SAL e' ancora in bozza, o se mancano nome attivita' / partita IVA.

⚠️ I conti passano da `salConti()` e `compRiepilogoDa()`, le stesse due
funzioni del riquadro a schermo. **Nessuna formula copiata.**

## 2. La fattura dell'acconto — `salAFattura()` / `salFatturaCon()`

Pulsante **«→ Crea la fattura di questo acconto»** dentro la scheda del SAL,
sotto «Il conto» (nel piede non ci stava: su un telefono da 390 px il quarto
pulsante usciva fuori).

**⚠️ La cifra la sceglie Alessio, OGNI VOLTA**, perche' sono due modi veri e
cambiano da committente a committente:
- **per l'intero**: fattura tutto l'avanzamento, e la ritenuta di garanzia la
  trattiene il committente quando paga;
- **al netto**: la ritenuta se la toglie lui dalla fattura, e la riavra' a
  fine lavori con una fattura a parte.
Deciso da lui stasera: **non si sceglie una volta sola, si chiede sempre.**

La fattura nasce di tipo **acconto**, con una riga sola, e la descrizione basta
da sola a dire di quale avanzamento si tratta:
«Stato avanzamento lavori n. 2 del 05/08/2026 — Titolo — lavori eseguiti dal
01/07/2026 al 31/07/2026 (importo al netto della ritenuta di garanzia dello
0,5%, pari a 201,03 €)».

**Non si scrive niente nel database**: si apre `fattForm()` gia' compilato, la
controlla lui e la salva lui.

**⛔ RIFIUTA di partire** se il SAL vale 0 € o e' **negativo** (una fattura in
negativo e' una nota di credito, ed e' un'altra cosa), se ci sono modifiche non
salvate, e **avvisa** se il cliente del computo non sta nell'anagrafica di
quel reparto (la tendina resterebbe su «nessuno» in silenzio).

### `sql/gest-sal-fattura.sql` — ESEGUITA il 19/8 sera
Aggiunge `gest_sal.fattura_id` (`on delete set null`). Serve a non chiedere
**due volte gli stessi soldi**: il SAL dice «gia' fatturato» e chiede conferma
prima di farne un'altra. Stessa idea di `gest_computi.preventivo_id`.
Il collegamento si scrive **solo dopo** che la fattura esiste
(`fattSalInCorso`, in fondo a `fattSalva`).

## 3. Le lezioni di stasera

1. **⛔ IL PULSANTE PICCOLO, ANCORA.** Il pulsante del PDF nell'elenco dei SAL
   era un quadratino da 34 px con dentro la sola icona del foglio. Alessio ha
   guardato lo schermo e ha detto «si vede troppo piccolo, quasi non si vede».
   **La regola `.quick-add` era stata scritta la sera prima apposta, e non e'
   stata usata.** Un'icona da sola non e' un pulsante: ci vuole scritto PDF,
   il bordo e lo sfondo. Adesso e' 99×46 px, bordo blu, testo da 17.
2. **«Spett.le» e sotto un trattino.** Sul computo il cliente e' facoltativo:
   senza cliente il foglio scriveva «Spett.le» e una lineetta. Trovato
   **guardando il PDF vero di Alessio**, non a mente. Se il cliente non c'e',
   non si scrive niente.
3. **⚠️ IL BANCO CHE COPIAVA MALE (lezione n. 2 della lista, di nuovo).**
   Il banco segnava rosso su «m² invece di mq». Era **falso**: l'estrattore
   tagliava `const _umPdf` alla prima riga, perche' quella riga chiude gia'
   tutte le parentesi, e il `.replace()` delle due righe sotto restava fuori.
   **Il finto era piu' povero del vero e ha inventato un difetto che non
   c'era.** Prima di credere a una rossa, guardare cosa sta provando davvero.
4. **⚠️ IL SABOTAGGIO CHE COLPIVA LA FUNZIONE SBAGLIATA.** Il sabotaggio
   «il PDF esce anche con modifiche non salvate» cercava `if(salModifiche(id)){`
   — che da stasera compare **due volte** (salPdf e salAFattura). Rompeva
   l'altra, e il banco restava **tutto verde su un file rotto**. Un pezzo da
   sabotare deve essere **unico**, se no il sabotaggio assolve invece di
   accusare.

## 4. Come sono stati provati (per rifarlo domani)

I banchi stanno nel contenitore di Claude, in `prove/sal-pdf/`, non nella
cartella di Alessio. Si ricostruiscono cosi':

- `estrai.py` tira fuori le funzioni **verbatim** da `gestionale-app.html`
  (mai riscritte a mano). ⚠️ per i `const` aspetta il punto e virgola, se no
  taglia (vedi lezione 3).
- I dati NON sono inventati: schema vero ricreato **dai file di `sql/`** su un
  PostgreSQL 16, e `dati.json` esce dalle viste vere `gest_sal_totali` e
  `gest_sal_righe_calc`.
- `banco.js` (57 prove, PDF letto davvero con pdf-parse) · `banco-fattura.js`
  (39 prove) · `sabotaggi.js` (17 sabotaggi sul file vero: **17 visti, 0
  sfuggiti**) · `browser.js` (apre il file di adesso E quello di prima e
  confronta errori JS, id doppi e testi sotto i 13 px, a 1440×900 e 390×844).
- jsPDF gira in Node con `jspdf/dist/jspdf.node.js`. ⚠️ `save()` e' una
  proprieta' **dell'oggetto**, non del prototipo: si intercetta alla
  costruzione.
- Chromium gia' installato: `executablePath: '/opt/pw-browsers/chromium'`.
  **Non lanciare `playwright install`.**

## 5. Il contatore delle visite — prima lettura (4 ore e mezza)

| | |
|---|---|
| arrivi | 13 (di cui 5 da Meta) |
| visti | 9 (di cui 1 da Meta) |
| persone diverse | 10 (4 da Meta) |

**Il conto al giorno:** 5 arrivi da Meta in 4,5 ore fanno ~**27 al giorno**.
Meta dice **854 clic in 30 giorni**, cioe' **28 al giorno**: **combaciano**.
Ma Meta conta solo **326 arrivi**, cioe' 11 al giorno — il **38%**.
→ **La gente sul sito ci arriva davvero. Il 62% non e' gente persa, e' gente
che non accetta i cookie.** (Con 5 righe non e' una prova: e' il primo indizio,
e va nella direzione giusta.)

⚠️ **Da guardare fra due giorni:** dei 5 arrivati da Meta, **solo 1** e'
arrivato a «visto». Se il rapporto reggesse anche sui numeri grandi, vorrebbe
dire che se ne vanno prima che la pagina si disegni — e li' il problema
sarebbe la velocita', non la pubblicita'. Con 5 righe non prova niente.

## 6. ⛔ IL COMPUTO METRICO NON LO VEDE NESSUNA IMPRESA

Trovato stasera guardando il codice, dopo una domanda di Alessio.

`#tab-computi`, `#tab-prezzario` nascono con `display:none` e li accende
**solo** `adattaMenuProfessionista()`, che parte solo se
`ruoloUtente === 'professionista'`. Quindi **Computo metrico, Prezzario e
(dentro il computo) SAL si vedono solo dagli studi tecnici.**
Un'impresa edile o un artigiano quelle tre voci nel menu **non le ha**.

Non e' un difetto: e' scritto nel file dal 10 agosto — *«per ora accesa solo
per gli studi tecnici, accenderla anche per le imprese edili e' una riga,
quando si decide»*. Quel «quando si decide» non e' mai arrivato.

⚠️ **Perche' conta per i soldi:** il computo col prezzario da 12.762 voci e il
SAL sono la cosa piu' grossa costruita finora, e le **87 imprese iscritte non
possono nemmeno vederla**.

**I due lati della questione, senza sconti:**
- Il computo metrico *estimativo* (quello che va in Comune o in gara) lo redige
  il **tecnico**, non l'impresa. Su questo Alessio ha ragione.
- Ma l'impresa fa **la stessa cosa con un altro nome** — «metratura», «i conti
  del cantiere» — per farsi il preventivo, e oggi la fa su Excel.
- E sul **SAL** la differenza e' netta: sui lavori **pubblici** la contabilita'
  la tiene il direttore dei lavori; sui lavori **privati**, che sono quasi
  tutto quello che fanno le 87 imprese, **non c'e' nessun direttore dei
  lavori** e il SAL se lo fa l'impresa da sola.
- ⚠️ Il rovescio: il **71%** delle imprese edili ha meno di due dipendenti, e
  molte fanno preventivi **a corpo**, una cifra sola. A quelle, tre voci in
  piu' nel menu sono solo confusione.

**⛔ LA DECISIONE RESTA AD ALESSIO, E LA RISPOSTA NON STA NEL CODICE.**
La domanda da fare a **una** delle 87 imprese, prima di accendere niente:
> «Tu quando fai un preventivo, misuri le lavorazioni una per una o dai una
> cifra a corpo?»

---

## DOVE SIAMO RIMASTI (19 agosto 2026, notte)

**Il SAL e' finito**: database, schermata, PDF, fattura dell'acconto.
⚠️ Resta la nota di sempre: **il SAL non e' il mestiere di Alessio.** Quando la
prima impresa lo usera' davvero, farsi spiegare da lei come lo fa, e correggere.

**Chiesto da Alessio per domani, in cima:**

1. **La sezione «Stati di avanzamento» nel menu** (mezza giornata). Tutti i SAL
   di tutti i computi in un elenco solo: quali hai chiesto e quali no, il PDF,
   la fattura. **Il SAL resta attaccato al suo computo** — cambia solo che lo
   trovi anche da fuori. ⛔ Scartata la strada B (un SAL che vive senza
   computo): senza il computo dietro spariscono il «su 20,46 previsti», il
   controllo «hai contato piu' del computo» e il ribasso — diventa una fattura
   con le date.
2. **Ragionare su cosa fare per le imprese** (vedi il punto 6 qui sopra).

**Poi, dalla lista di prima:**
- **Il prezzo nuovo sul sito** — `prezzi.html`, `info-premium.html`,
  `info-free.html` · il riquadro nei quattro pannelli che dice alle 87 imprese
  che il gestionale e' aperto · **il pagamento mensile su Stripe** (il pezzo
  piu' grosso: oggi c'e' solo l'annuale) · l'avviso prima che scadano i tre
  mesi di regalo delle imprese di luglio.
- **L'errore JavaScript sulla homepage** (`PAGINE_REGISTRAZIONE` dichiarato due
  volte). Nei file compare **una volta sola**: guardare l'iniezione di Netlify,
  non il codice.
- **Rileggere il contatore delle visite** fra un paio di giorni: la query sta in
  fondo a `sql/conteggio-visite.sql`.
- L'analisi dei prezzi · la descrizione schiacciata a 390 px sui preventivi
  (`.sheet .prev-riga` a `1fr 80px 118px 48px`) · il pulsante del prezzario
  anche in cima · il limite di misura su `cv-candidati/registrazioni` · il
  conteggio delle richieste di caricamento file.
- **Sul sito:** le 95 pagine citta' vuote · l'email vera alle imprese · il
  grafico dell'admin (`premium_dal`, `gestionale_dal`).
- **Meta:** campagna ferma per una settimana, poi rimisurare. Non toccare
  pubblico, creativita', budget o evento: fa ripartire l'apprendimento da zero.
- **Pulizie:** i preventivi n. 4, 5 e 6 del reparto «progetto casa» · la riga
  completamente vuota in `imprese`.
- **Manca ancora:** il SAL non diventa fattura con un clic *dal cestino*, e non
  c'e' il passaggio SAL → nota di credito. Nessuno dei due e' stato chiesto.

---

# 20 agosto 2026 — LA SEZIONE «STATI DI AVANZAMENTO» (il punto 1)

Prima, per vedere un SAL bisognava entrare nel computo giusto: con dieci
computi si girava fra dieci schede. Adesso c'e' una voce nel menu, sotto
«Prezzario», che li mostra **tutti insieme**.

⛔ **NON e' un SAL che vive senza computo.** La strada B resta scartata. Qui
non si crea niente e non si calcola niente di nuovo: si LEGGE. La riga apre
lo stesso SAL di sempre, dentro il suo computo, con la stessa `salForm()`.

## Cosa c'e' nell'elenco

Ogni riga: **SAL n. X — titolo del computo**, il cliente, la data, il periodo,
quanto e' stato fatto finora, quanto era gia' stato chiesto, quanto e'
trattenuto di ritenuta, e in grassetto **quanto vale questo SAL**.
Il bollino in alto a destra dice a colpo d'occhio come sta: **Bozza**,
**Emesso**, **Fatturato**.

Tre filtri in cima — **Tutti · Da fatturare · Fatturati** — ed e' quello il
«quali ho chiesto e quali no». La fascia col totale cambia col filtro.

I pulsanti della scheda: **Apri** e **PDF** (scritti, con bordo e sfondo — la
regola dei pulsanti del 19 agosto). Sotto i «...»: **Crea la fattura
dell'acconto** ed **Elimina**, come in tutte le altre sezioni.

⚠️ Si vedono **solo i SAL del reparto in cui sei**, e solo quelli il cui
computo e' vivo: un computo nel cestino si porta dietro i suoi SAL.

## ⛔ La voce e' accesa SOLO agli studi tecnici

Come il Computo metrico e il Prezzario (punto 6 del 19 agosto). `#tab-sal`
nasce con `display:none` e lo accende **solo** `adattaMenuProfessionista()`.
**Non e' stata cambiata la decisione**: le 87 imprese non vedono niente di
nuovo. Se un domani il computo si accende anche a loro, questa voce va accesa
**nello stesso punto** — una regola che sta in due posti non si sistema a
meta'.

## Le tre cose che si potevano sbagliare (e dove stanno nel codice)

1. **IL RIBASSO STA SUL COMPUTO, NON SUL SAL.** `salAggiorna()` prende il
   ribasso e il tipo di lavoro da `compCache`. Aprendo un SAL dall'elenco,
   `compCache` poteva non avere quel computo: il conto sarebbe uscito **senza
   ribasso, cioe' piu' alto del vero**, senza nessun errore a schermo.
   → `salApriDaElenco()` rimette in piedi le tre cose che la scheda si aspetta
   di trovare pronte: `salComputoId`, `compCache` (il computo) e `salCache`
   (i SAL di quel computo, che servono a trovare il **SAL precedente**).
2. **«← Torna» deve sapere da dove sei arrivato.** I punti che tornano
   indietro erano DUE (il pulsante in fondo e la fine di `salSalva`): stanno
   tutti e due in `salTorna()`, una funzione sola.
3. **`salElimina` ridisegnava l'elenco sbagliato.** Chiamava `renderSalList()`,
   che esce subito se `#co-sal` non c'e': dall'elenco generale la riga appena
   buttata sarebbe rimasta li' a schermo come se non fosse successo niente.

## Come e' stato provato (per rifarlo domani)

Il banco sta nel contenitore di Claude, in `prove/`, non nella cartella di
Alessio. Si rimonta cosi':

- **I dati non sono inventati.** Schema ricreato **dai file di `sql/`**
  (`gest-computo-metrico` → `quantita-3-decimali` → `quadro` →
  `gestionale-fatture` → `gest-sal` → `gest-sal-fattura`) su un PostgreSQL 16,
  e `prove/dati.json` esce dalle **viste vere** `gest_sal_totali`,
  `gest_sal_righe_calc`, `gest_computo_voci_calc`.
  ⚠️ `gest_mestieri` / `gest_clienti` / `gest_lavori` / `gest_preventivi` non
  stanno in nessun file di `sql/`: nel banco sono tabelle di contorno finte
  (`prove/00-prelude.sql`), e va detto. Il verso che conta — cosa succede al
  SAL quando cancelli il computo — e' scritto nel file vero.
- **I numeri attesi sono rifatti a mano** dentro il banco, non ripresi da
  `salConti()`: se li prendessi da li' proverei solo che `salConti()` e'
  uguale a se stessa.
- `prove/banco-sal-elenco.js`: **71 prove**, su computer 1440×900 e telefono
  390×844, piu' il giro da **impresa edile** (la voce deve restare spenta).
  Zero errori JavaScript, zero id doppi, niente sotto i 13 px, niente che
  sborda.
- `prove/sabotaggi.py`: **15 sabotaggi sul file vero — 15 visti, 0 sfuggiti.**
  Lo script controlla da solo che il pezzo da rompere sia **unico** nel file:
  se compare due volte e' rosso lui (la lezione del 19 agosto).

## Poi, guardando lo schermo: LO STESSO NUMERO DUE VOLTE

Alessio ha aperto la sezione e sulla scheda c'era **231,25 € scritto due
volte**: una come «fatto finora» e una in fondo, in grassetto. Su un SAL
senza ribasso, senza un SAL prima e senza ritenuta le due cifre **sono la
stessa cifra**, e una delle due non aggiunge niente.
→ Adesso «fatto finora» si scrive **solo quando dice una cosa diversa dal
totale** (`_salUguali()`, confronto al centesimo). Due sabotaggi apposta, nei
due versi: sparisce quando non deve, e resta quando non deve.

⚠️ E il banco aveva un terzo buco: `.job-meta span` prendeva ogni riga **due
volte**, perche' le emoji che diventano icone stanno dentro uno `<span>`
annidato. Adesso e' `.job-meta > span`.

## ⚠️ Due errori miei di oggi, detti per primi

1. **Ho scritto la prima spiegazione troppo lunga e troppo tecnica.** Alessio
   ha risposto «non ho capito», e aveva ragione: nomi di funzioni e file al
   posto di cosa cambia per lui.
2. **Il banco ha segnato quattro rosse false**, tutte colpa del banco e non
   del codice: lo spazio unificatore prima del simbolo dell'euro, le emoji che
   il gestionale trasforma in icone (nel testo del pulsante resta la sola
   parola, ed e' giusto cosi'), e la barra dei filtri che «sbordava» pur
   avendo `overflow-x:auto` da sempre. È di nuovo la lezione n. 2: **prima di
   credere a una rossa, guardare cosa sta provando davvero.**
   ⚠️ E il finto Supabase aveva un buco: `.order()` non ordinava niente. Se non
   l'avessi sistemato, la prova sull'ordine dell'elenco sarebbe stata verde per
   caso. Adesso ordina davvero.

## Una cosa detta da Alessio oggi, da non perdere

> «A volte il geometra o l'ingegnere ci consegna il computo **senza prezzi** e
> il preventivo ce lo dobbiamo fare noi sul suo computo. Si puo' fare che
> l'impresa lo carica, lo riempie **col suo prezzario**, mette il ribasso e
> scarica il PDF?»

⚠️ **È la risposta vera al punto 6 di ieri**, e non e' venuta dal codice: e'
venuta da lui. Il computo *estimativo* lo redige il tecnico — ma **il prezzo
lo fa l'impresa**, e oggi lo fa su Excel. Non e' «accendere il computo alle
imprese»: e' un'altra cosa, piu' piccola e piu' utile — **carica il computo
del tecnico, prezzalo col tuo, stampa**. Da progettare insieme prima di
scrivere una riga.

---

## DOVE SIAMO RIMASTI (20 agosto 2026)

**Fatto oggi:** la sezione «Stati di avanzamento» nel menu (punto 1).
Toccato **un solo file**: `gestionale-app.html`. Nessuna migrazione SQL nuova.

**Da fare, in cima:**

1. **Ragionare insieme sul «computo del tecnico da prezzare»** (qui sopra).
   Prima di tutto, la domanda a una delle 87 imprese resta quella di ieri:
   «quando fai un preventivo, misuri le lavorazioni una per una o dai una
   cifra a corpo?»
2. **Il prezzo nuovo sul sito** — `prezzi.html`, `info-premium.html`,
   `info-free.html` · il riquadro nei quattro pannelli · **il pagamento
   mensile su Stripe** (il pezzo piu' grosso) · l'avviso prima che scadano i
   tre mesi di regalo delle imprese di luglio.
3. **L'errore JavaScript sulla homepage** (`PAGINE_REGISTRAZIONE` due volte):
   guardare l'iniezione di Netlify, non il codice.
4. **Rileggere il contatore delle visite** (la query in fondo a
   `sql/conteggio-visite.sql`): dei 5 arrivati da Meta solo 1 e' arrivato a
   «visto».

Poi, in ordine libero: l'analisi dei prezzi · la descrizione schiacciata a
390 px sui preventivi · il pulsante del prezzario anche in cima · il limite di
misura su `cv-candidati/registrazioni` · il conteggio delle richieste di
caricamento file · le 95 pagine citta' vuote · l'email vera alle imprese · il
grafico dell'admin.

**Meta:** campagna ferma per una settimana dal 19 agosto, poi rimisurare.
**Pulizie:** i preventivi n. 4, 5 e 6 del reparto «progetto casa» · la riga
completamente vuota in `imprese`.

---

# 20 agosto 2026 (2) — IL RIEPILOGO NEUTRO: LE ICONE E I PALLINI

Alessio, guardando il Riepilogo: *«queste card le dobbiamo differenziare
l'una dall'altra… vorrei che ad occhio le card attive nel riepilogo siano
collegate visibilmente ai bottoni laterali»*.

Sono state disegnate **quattro schermate finte** e le ha scelte lui guardando
(idea **C**). Il disegno sta nel contenitore di Claude, `mock/riepilogo-idee.html`
— **fuori dalla cartella di Alessio apposta**: lì dentro sarebbe finito online
col primo push.

## La regola, in una riga

**Il colore fa due lavori, e due soltanto:**

- **l'ICONA dice QUALE sezione** — lo stesso colore sulla card e sulla voce
  del menù, così l'occhio le appaia da solo;
- **il PALLINO dice come va** — **rosso se va male, verde se è a posto**.

Tutto il resto è neutro: la barretta a sinistra delle card, il numero grande,
la fascia «Da sistemare oggi» e le righe dentro di lei.

⚠️ **Perché neutro.** Prima la barretta e il numero cambiavano colore col
«tono» della scheda (rosso, arancione, verde, blu): con otto schede accese la
pagina era a scacchi e il colore non si notava più. **Un colore che dice due
cose non ne dice nessuna.**

## ⛔ QUANDO SI ACCENDE IL ROSSO — la regola sta in UN POSTO SOLO

Il pallino di una scheda è rosso **quando la fascia «Da sistemare oggi» nomina
quella sezione come un problema** (`_rieMale`, costruito dalla stessa lista
`DA`), più i casi già segnati da `tono:"err"` (scaduto, in ritardo, in
perdita). Così le due cose **non si possono scollare**: se la fascia dice
«1 lavoro in ritardo», la scheda Lavori ha il pallino rosso, sempre.

⚠️ **IL ROSSO NON SI ACCENDE PERCHÉ UNA SEZIONE HA ROBA DENTRO.** Due computi
non sono un problema, un computo in bozza nemmeno, e un preventivo mandato ieri
neppure. Se si accendesse così sarebbero rossi quasi tutti e non direbbe più
niente. È rosso il preventivo fermo da **più di una settimana**, non quello di
ieri. (Nel primo disegno era sbagliato proprio così, ed è stato corretto prima
di mostrarglielo.)

Due eccezioni scritte a mano, `male:` sulla scheda:
- **Scadenzario:** rosso già a **sette giorni**, non solo da scaduta — una
  scadenza che scade lunedì non si sistema lunedì.
- **Stati di avanzamento:** rosso se c'è un SAL **emesso e non ancora
  fatturato**. Vuol dire **soldi non chiesti**: il conto è già stato consegnato
  al committente. Un SAL in bozza no: è un lavoro in corso.

## Anche il Riepilogo ha la sua scheda «Stati di avanzamento»

Ogni voce del menù ha la sua scheda, e questa è nata insieme alla sezione.
Dentro un `try` suo: se `sql/gest-sal.sql` non fosse stato eseguito la scheda
non compare e il Riepilogo resta intero. I conti passano da `salConti()` +
`compRiepilogoDa()`, come nell'elenco, nella scheda e nel PDF.

## ⚠️ Due trappole trovate DAL BANCO, non a occhio

1. **L'icona si spegneva sulle schede vuote.** `.rie-card.vuota .rc-head svg`
   la rimetteva grigia: la scheda Fatture aveva l'icona grigia mentre nel menù
   era verde — cioè l'aggancio si rompeva proprio dove serviva. E la regola
   stava in **DUE posti** nel CSS: tolta la prima, la scheda restava grigia lo
   stesso. *Una regola che sta in due posti non si sistema a metà.*
2. **Il banco era cieco su due cose.** Guardava la *classe* del pallino e non
   il colore: se rosso e verde fossero stati dipinti uguali sarebbe rimasto
   tutto verde. E riconosceva «icona ancora grigia» da un codice colore scritto
   a mano. Adesso confronta i colori veri e riconosce il grigio perché è lo
   stesso della scritta smorta sotto il numero. **Trovate tutte e due dai
   sabotaggi, non guardando lo schermo.**

## Come è stato provato

- `prove/banco-riepilogo.js`: **32 prove**, computer 1440×900 e telefono
  390×844, più il giro da **impresa edile** e un giro apposta con la **scadenza
  fra 5 giorni** (senza quello, togliere la regola dei sette giorni non faceva
  diventare rossa nessuna prova).
  I dati sono scelti caso per caso perché il rosso e il verde siano tutti e due
  rappresentati: un lavoro in ritardo, un preventivo fermo da 20 giorni, un SAL
  emesso non fatturato → rossi; clienti, computi (**uno in bozza apposta**),
  scadenza a 20 giorni, calendario, fatture → verdi.
- `prove/sabotaggi-riepilogo.py`: **15 sabotaggi sui file veri — 15 visti, 0
  sfuggiti.** Rompe sia `gestionale-app.html` sia `css/gestionale.css`, e
  controlla da solo che ogni pezzo da rompere sia **unico**.

⚠️ **Una voce nuova nel menù va aggiunta anche nel blocco dei colori in
`css/gestionale.css`**, se no la sua icona resta grigia mentre tutte le altre
hanno un colore. Il banco se ne accorge.

## Una cosa lasciata com'era, e va detta

Le scritte piccole rosse dentro le schede (**«4 giorni fa»**, **«scaduta»**)
sono rimaste colorate. Non sono decorazione: dicono *quale* riga è il problema,
e toglierle avrebbe tolto un'informazione. Se Alessio le vuole nere, è una
riga.

---

## DOVE SIAMO RIMASTI (20 agosto 2026, sera)

**Fatto oggi:** la sezione «Stati di avanzamento» nel menù (punto 1) e il
Riepilogo neutro con le icone colorate e i pallini.
File toccati: `gestionale-app.html` e `css/gestionale.css`. Nessuna migrazione
SQL nuova, in tutta la giornata.

**Da fare, in cima:**

1. **Ragionare insieme sul «computo del tecnico da prezzare»** — l'idea di
   Alessio del 20 agosto (vedi la sezione precedente). È la risposta vera al
   punto 6 del 19 agosto.
2. **Il prezzo nuovo sul sito** — `prezzi.html`, `info-premium.html`,
   `info-free.html` · il riquadro nei quattro pannelli · **il pagamento mensile
   su Stripe** (il pezzo più grosso) · l'avviso prima che scadano i tre mesi di
   regalo delle imprese di luglio.
   ⚠️ Il riquadro dentro il gestionale dice ancora **«5€ al mese oppure 49€
   l'anno»**: si è visto nel banco. Va cambiato insieme al resto.
3. **L'errore JavaScript sulla homepage** (`PAGINE_REGISTRAZIONE` due volte):
   guardare l'iniezione di Netlify, non il codice.
4. **Rileggere il contatore delle visite** (query in fondo a
   `sql/conteggio-visite.sql`).

Poi, in ordine libero: l'analisi dei prezzi · la descrizione schiacciata a
390 px sui preventivi · il pulsante del prezzario anche in cima · il limite di
misura su `cv-candidati/registrazioni` · il conteggio delle richieste di
caricamento file · le 95 pagine città vuote · l'email vera alle imprese · il
grafico dell'admin.

**Meta:** campagna ferma per una settimana dal 19 agosto, poi rimisurare.
**Pulizie:** i preventivi n. 4, 5 e 6 del reparto «progetto casa» · la riga
completamente vuota in `imprese`.

---

# 20 agosto 2026 (3) — IL COMPUTO SI APRE ALLE IMPRESE: «COMPUTO DA PREZZARE»

Il «quando si decide» scritto nel file il 10 agosto è arrivato oggi, e non è
arrivato dal codice: è arrivato da una frase di Alessio.

> «A volte il geometra o l'ingegnere ci consegna il computo **senza prezzi** e
> il preventivo ce lo dobbiamo fare noi sul suo computo.»

Il computo *estimativo* lo redige il tecnico — su questo il punto 6 del 19
agosto aveva ragione. Ma **il prezzo lo fa l'impresa**, e oggi lo fa su Excel.

## ⚠️ LA SORPRESA: ERA GIÀ TUTTO COSTRUITO

Cercando cosa mancasse, non mancava niente. Dentro un computo c'erano già:

- **⬆ Importa le lavorazioni da Excel** (18 agosto) — il file del tecnico entra
  in un colpo, con le quantità, e salta da solo le righe «TOTALE» in fondo;
- **€ Prendi i prezzi dal prezzario** (19 agosto) — cerca il codice nel
  prezzario e riempie **solo le righe a zero**, cioè esattamente quelle che il
  tecnico ha lasciato vuote;
- il **ribasso** in percentuale, il **PDF**, e **«Crea il preventivo»**.

**Non c'era una funzione da costruire: c'era una porta da aprire.** È il
contrario del 15 agosto (il «Report completo» costruito e buttato la sera
stessa): quella volta si era costruito senza chiedere, questa volta si è
guardato prima.

## ⛔ E SI CHIAMA IN UN ALTRO MODO — deciso da Alessio

Domanda sua: *«come lo chiamiamo? perché non è un vero computo dove si crea»*.
Aveva ragione: **«Computo metrico» è la parola del tecnico**, di una cosa che
lui CREA. L'impresa quel documento se lo trova in mano.

| | studio tecnico | impresa e artigiano |
|---|---|---|
| voce del menù | Computo metrico | **Computo da prezzare** |
| titolo della sezione | Computo metrico | **Computo da prezzare** |
| scheda del Riepilogo | Computo metrico | **Computo da prezzare** |
| striscia «Come si incastrano» | Computo metrico | **Computo da prezzare** |
| il pulsante del file | ⬆ Importa le lavorazioni da Excel | **⬆ Carica qui il computo del geometra** |

Stessa sezione, due nomi — come «pratica» e «lavoro». Lo studio tecnico non si
accorge di niente. La frase di apertura per l'impresa è riscritta dal punto di
vista di chi il computo lo **riceve**, non di chi lo fa.

**Si accendono tre voci insieme** (`adattaMenuImpresa()`):
- **Computo da prezzare**;
- **Prezzario** — per forza: senza, «Prendi i prezzi dal prezzario» non ha da
  dove pescarli e sarebbe un pulsante che non fa mai niente;
- **Stati di avanzamento** — deciso da Alessio (*«diamola anche a loro, forse
  gli può servire un giorno»*). Sui lavori **privati** non c'è nessun direttore
  dei lavori e il SAL se lo fa l'impresa da sola; e il riquadro dei SAL sta
  dentro il computo comunque.

## ⚠️ IL NOME STA IN QUATTRO POSTI, E IL QUARTO ME L'ERO DIMENTICATO

Menù, titolo della sezione, scheda del Riepilogo, **e la striscia «Come si
incastrano»**. La striscia scriveva ancora «Computo metrico» due centimetri
sotto un titolo che diceva «Computo da prezzare».

**Non l'ha trovato il banco: l'ho visto guardando la fotografia della pagina
vera.** Il banco controllava tre posti su quattro ed era tutto verde. *Una
regola che sta in quattro posti non si sistema in tre.*

Stessa storia per la **scheda del Riepilogo**: quella l'ha trovata il banco.
`renderRiepilogo` leggeva i computi solo se `ruoloUtente === 'professionista'`
— l'impresa avrebbe avuto la sezione nel menù e nessuna scheda che ci porta.
Adesso la lettura parte per tutti.

## Come è stato provato

- `prove/banco-sal-elenco.js`: **80 prove**. Il giro dell'**impresa** e quello
  dello **studio tecnico** sono tutti e due obbligatori: se controllassi solo
  l'impresa, uno che cambia il nome **per tutti** resterebbe verde.
- `prove/banco-riepilogo.js`: **34 prove**. Controlla anche che le tre voci del
  menù siano **accese davvero**: una scheda che porta in una sezione spenta è
  una porta sul vuoto.
- `prove/sabotaggi.py`: **18 sabotaggi** · `prove/sabotaggi-riepilogo.py`:
  **17 sabotaggi**. Tutti visti, nessuno sfuggito. Fra questi, nei due versi:
  «l'impresa legge la parola del tecnico» e «la striscia dice la parola
  dell'impresa **anche allo studio tecnico**».

## Resta aperto su questo pezzo

Alessio: *«facciamole tutte, perché se le può anche caricare da sole»* — cioè
caricare il computo anche in **PDF** e in **foto/scansione**, non solo Excel.
Deciso di farlo **dopo**, e in quest'ordine, per un motivo solo:

⚠️ **L'Excel ha le quantità già scritte; il PDF no.** Su un PDF l'AI legge una
tabella stampata, e se sbaglia una cifra — 20,46 che diventa 2046 — il
preventivo che l'impresa manda al cliente è sbagliato e **ci rimette lei**.
Quando si farà: **conferma riga per riga obbligatoria** prima che entri, col
numero originale scritto accanto. La foto è la stessa strada, ma peggio
(ombre, fogli storti).

---

# 20 agosto 2026 (4) — ⚠️ IL MIO ERRORE: LA PAROLA STAVA IN DIECI POSTI, NON QUATTRO

Poche ore dopo aver consegnato «Computo da prezzare», Alessio ha mandato le
fotografie della pagina vera. Dentro c'era questo:

- il titolo della finestra diceva ancora **«Nuovo computo metrico»**;
- la pagina vuota diceva ancora *«Un computo raccoglie le lavorazioni con le
  loro misure: parti uguali, lunghezza, larghezza, altezza, e i vuoti da
  detrarre»* — che è il discorso del tecnico, non di chi il computo lo riceve.

**Avevo scritto io, il giorno prima, che «il nome sta in quattro posti».** Ne
stava in **dieci**. E il banco era verde su tutte e 80 le prove, perché
controllava esattamente i quattro che avevo cambiato io: **una prova scritta
sui punti che conosci non trova quello che ti sei dimenticato.**

## La correzione: non rincorrere le parole, spostarle

C'è una tabella sola, `_CM`, con le parole delle due categorie, e una funzione
`_cm(k)` che dà quella giusta. Chi deve scrivere «computo» la chiede a lei:
menù, titolo, pulsante «+ Nuovo», pagina vuota, spiegazione, titolo della
finestra, scheda del Riepilogo, striscia «Come si incastrano», elenco del
Cestino, e i due documenti (PDF e nota del preventivo).

⚠️ **Nei MESSAGGI del Cestino la parola è quella neutra** — «2 computi» — e non
passa da `_cm`. Un elenco di conferma non deve inseguire nessuna traduzione.

⚠️ **`get lab()`, non `lab:`.** La lista delle sezioni del Cestino è un `const`
e si costruisce **all'avvio**, quando il ruolo dell'utente non si sa ancora:
scritta `lab:_cm('nome')` restava congelata sulla parola dell'impresa **anche
per lo studio tecnico**. Col getter la parola si chiede quando si disegna.
Questo l'ha trovato il banco nuovo.

## La prova che adesso non si può dimenticare niente

Invece di controllare dei punti scelti da me, il banco **apre le schermate e
legge tutta la pagina** (`document.body.innerText`) cercando la parola
sbagliata, in quattro giri:

| chi | dove passa | non deve mai comparire |
|---|---|---|
| impresa | Riepilogo · sezione · finestra del computo nuovo · Cestino | «computo metrico» |
| impresa senza nemmeno un computo | idem, con la pagina vuota | «computo metrico» |
| studio tecnico | idem | «da prezzare» |
| studio tecnico senza computi | idem | «da prezzare» |

Un posto nuovo dimenticato domani lo trova da sola.

## ⚠️ E UN SABOTAGGIO ERA DIVENTATO DOPPIO — la trappola del 19 agosto, di nuovo

Il sabotaggio «l'elenco non è più ordinato dal più recente» cercava
`sb.from("gest_sal")...order("data",{ascending:false})`, che da oggi compare
**due volte**: la stessa lettura sta anche nella scheda del Riepilogo.
Rompeva l'altra, e il banco restava verde su un file rotto — **assolveva invece
di accusare**. Lo script se n'è accorto da solo (controlla l'unicità del pezzo)
e adesso l'ancora si porta dietro la riga di sopra, che è sua.

## Come è stato provato

`prove/banco-sal-elenco.js` **88 prove** · `prove/banco-riepilogo.js` **34
prove** · `prove/sabotaggi.py` **24 sabotaggi** · `prove/sabotaggi-riepilogo.py`
**17 sabotaggi**. Tutti visti, nessuno sfuggito. Fra i sabotaggi, i due
centrali sono sul cuore della cosa: `_cm()` che dà sempre la parola del tecnico,
e `_cm()` che dà sempre quella dell'impresa.

## La lezione, scritta perché non si ripeta

> **Quando una parola cambia per ruolo, non cambiarla nei posti: spostala in un
> posto.** E la prova non deve guardare i punti che conosci — deve leggere la
> pagina intera e cercare quello che non ci deve stare.

Nasce dal 20 agosto 2026, ed è la sorella della lezione n. 5 («una regola che
sta in due posti non si sistema a metà»): lì erano due, qui erano dieci, e il
rimedio non è contarli meglio — è non averne più di uno.

---

# 20 agosto 2026 (5) — IL COMPUTO CHE ARRIVA IN PDF

L'Excel si leggeva dal 18 agosto. Da oggi lo stesso pulsante — **«⬆ Carica qui
il computo del geometra»** — legge anche il **PDF**.

## ⛔ NON SI FIDA DI UN MODELLO

Un computo italiano lo stampano PriMus, STR, Blumatica e questo gestionale, e
ognuno lo impagina a modo suo. Un lettore costruito sulle colonne di PriMus non
leggerebbe il primo foglio stampato da un altro programma.

Si fida di **una cosa sola**, che c'è in tutti perché è come si scrive un
computo in italiano, non come lo stampa un programma:

```
SOMMANO... mq 174,06                    (PriMus)
Sommano mq 20,460 € 18,50 € 378,51      (questo gestionale)
```

La riga «Sommano» **chiude** una lavorazione e porta con sé unità di misura e
quantità. Quello che sta sopra, fino alla lavorazione prima, è la descrizione.

## ⛔ NIENTE ENTRA SENZA CHE ALESSIO L'ABBIA GUARDATO

Il PDF non è un Excel: è un foglio **stampato**. Se leggo male una cifra —
20,46 che diventa 2046 — il preventivo che l'impresa manda al cliente è
sbagliato e **ci rimette lei**.

Quindi si apre **sempre** la schermata «Controlla quello che ho letto»:
- una riga per lavorazione, con **codice, U.M., quantità e prezzo modificabili**;
- **sotto ogni riga, il pezzo di foglio da cui l'ho presa** (`Sul foglio:
  SOMMANO... mq 174,06`) — senza quello bisognerebbe credermi sulla parola;
- una spunta «la prendo»: chi non convince, si toglie e non entra;
- e la conferma finale dice quante ne sono state tolte.

⚠️ Nel banco c'è una prova apposta: **dopo aver letto il PDF, nel computo non
deve essere entrato ancora niente.** Se un domani qualcuno salta la conferma,
diventa rossa.

## ⚠️ TRE COSE CHE AVREI SBAGLIATO SENZA I FOGLI VERI

Alessio ha mandato due PDF: la **lista di gara di PriMus** che gli ha dato il
suo geometra (87 lavorazioni, prezzi vuoti) e il **computo stampato dal suo
gestionale** (88 lavorazioni, coi prezzi). Sono **lo stesso lavoro**.

1. **Il foglio di PriMus è girato.** È orizzontale, ma dentro il PDF è una
   pagina verticale con `/Rotate 90`: prendendo `it.transform` così com'è, la
   prima riga finiva a `y = −221` e il lettore trovava **zero righe su un
   foglio pieno**. Si raddrizza con `pdfjsLib.Util.transform(vp.transform, …)`.
2. **PriMus scrive le migliaia con l'apostrofo tipografico:** `mq 1´344,00`.
   Senza toglierlo, quel numero non si legge e la lavorazione veniva scartata
   **in silenzio**.
3. **Mi ero fatto un elenco mio delle unità di misura** (mq, mc, cad…) e il
   foglio vero aveva **`ton`** e **`cadauno`**: cinque lavorazioni su
   ottantasette scartate in silenzio. *Un elenco di parole mie non può
   prevedere quello che scrive un geometra.* Adesso la regola non elenca
   niente: dopo «Sommano» viene una parola corta di lettere e **subito dopo un
   numero** — così «Sommano il capitolo € 378,51» resta fuori lo stesso.

E due che ha trovato il banco:

4. **La descrizione veniva tagliata.** Bastavano due numeri per buttare via una
   riga, e su PriMus «8 pedate di larghezza cm 60» spariva: la lavorazione
   arrivava monca e sembrava colpa del PDF. È la lezione n. 2 del 19 agosto.
   Adesso servono **due cose insieme**: numeri con la virgola all'italiana
   **e** incolonnati a destra, dove stanno le dimensioni.
5. **La carta intestata entrava dentro la prima lavorazione.** Il «5» di «Via
   Dante Alighieri, 5» era diventato il **numero della lavorazione n. 1**, e da
   lì in poi il 2, il 3 e il 4 venivano scartati perché «non salivano».
   Adesso una lavorazione comincia **solo** con un numero nella colonna stretta
   **e** del testo accanto.

## ⛔ LA SCANSIONE SI DICE, NON SI INDOVINA

Se dentro il PDF non ci sono lettere (`CP_MIN_LETTERE = 80`), è la fotografia
di un foglio. Il gestionale **lo dice** e si ferma: *«non posso leggerne i
numeri senza inventarmeli, chiedi al geometra il file originale»*. Inventare
una quantità sarebbe la cosa peggiore che può fare.

## ⚠️ ONESTÀ: TRE REGOLE CHE IL BANCO NON RIESCE A PROVARE

Sabotandole, le prove restano **verdi**: sui due fogli veri che ho, quelle
strade sono già protette da un'altra regola. Sono la regola dei numeri che
salgono, quella del «numero + testo accanto» e il controllo dell'unità dopo
«Sommano». **Restano scritte come cintura in più, ma nel codice c'è scritto che
non sono provate.** ⛔ Non si scrive «provata» una cosa che il banco non fa
diventare rossa.

## Come è stato provato

- **`prove/banco-computo-pdf.js` — 20 prove.** Le funzioni sono tirate fuori
  **verbatim** da `gestionale-app.html` da `prove/estrai-lettore-pdf.py` (un
  pezzo intero fra due segni, non funzione per funzione: tagliando sui nomi un
  `const` che finisce due righe sotto resta monco). Girano con la **stessa
  pdf.js 3.11.174** che carica il gestionale.
  **La prova più forte non l'ho scritta io:** i due fogli sono lo stesso
  lavoro, hanno **68 tariffe in comune**, e le quantità devono combaciare
  tutte. Combaciano. E la somma delle righe lette fa **43.495,58 €** contro
  **43.495,59 €** stampato sul foglio di Alessio: un centesimo, per gli
  arrotondamenti riga per riga.
- **`prove/banco-pdf-browser.js` — 14 prove.** Il gestionale vero in Chromium:
  si carica il PDF vero dentro `<input type=file>`, si toglie la spunta a una
  riga, si corregge la quantità di un'altra, e si controlla che entrino 86
  lavorazioni **con la correzione scritta a mano**, non quella letta.
- **`prove/sabotaggi-pdf.py` — 10 sabotaggi, 10 visti.**
- **`prove/sabotaggi-pdf-browser.py` — 6 sabotaggi, 6 visti.**

⚠️ **I due PDF non escono da questo computer.** Dentro ci sono i nomi e
l'indirizzo dei clienti veri del geometra: stanno in `prove/`, nel contenitore
di Claude, e non finiscono in nessun push.

## Altro, dallo stesso giorno

**La «Lista da far prezzare» adesso c'è anche sui lavori privati.** Fino a ieri
compariva solo sui computi «Lavori pubblici», con scritto che su un privato
«non serve a niente». Non era vero: è il foglio con le due colonne dei prezzi
vuote, quello che si manda a un subappaltatore per farsi fare i prezzi da lui —
lo stesso che il geometra manda all'impresa. Cambia solo il nome: in una gara
si chiama «🏛 Lista per la gara», fra privati «📋 Lista da far prezzare».


---

# 20 agosto 2026 (2), SERA — LA SCALA DEL COMPUTO

## Perché

Alessio apre il «Computo da prezzare» appena finito, quello per le imprese, e
scrive: **«è troppo difficile, nessuno lo capisce e troppo complicato»**. Poi:
«non è per me» — cioè: io lo capisco perché l'abbiamo fatto insieme, è
l'impresa che non lo capirà. Poi si ferma e dice la cosa che conta:

> «io volevo un gestionale **schematico a gradoni** che poi tutti compilati
> finivano nel riepilogo. Adesso funzioni dentro altre funzioni, si capiscono?
> Come facciamo a fargli capire i passaggi da fare se uno è alle prime armi?»

E ancora, guardando lo schermo:

> «aggiungi lavorazione, aggiungi capitolo, messi lì non li capisco, forse
> perché non sono geometra» · «oppure sono messi così in basso da non essere
> abbastanza visibili» · «stati avanzamento SAL è in cima in bella vista, poi
> scrollare e ci sono tre funzioni che sembrano quasi non servire».

E infine la frase che decide tutto:

> **«a me serve che il primo che lo userà, che pagherà, è contento di ciò che
> ha acquistato»**.

Ha anche detto una cosa che va scritta e non nascosta: **«nessuno usa il
gestionale»**. Non si aggiungono altre funzioni finché quella che c'è non si
capisce da sola.

**L'idea è sua:** «e se aperto il computo in alto ci sono le varie funzioni,
navbar, per capirci del computo si cerca cosa si vuole, tutti sono a bella
vista e si apre la pagina per intero». Gli ho fatto vedere tre disegni finti
(`mock/computo-navbar.html`, A · B · C) e ha scelto **la A**: barra numerata,
le voci che non è ancora il momento di usare restano visibili ma spente.

## Cos'era prima

La finestra del computo era **una pagina sola**, lunghissima, in due colonne:

- sette caselle di anagrafica (numero, data, titolo, oggetto, dove, cliente,
  lavoro), poi il tipo, lo stato, il prezzario, il ribasso, le note;
- **in alto a destra, in bella vista, gli Stati di avanzamento** — cioè
  l'ULTIMA cosa che si fa, offerta su un computo ancora vuoto;
- **le lavorazioni in fondo a sinistra**, sotto tutto, con tre pulsantini
  arancioni identici (`+ Aggiungi lavorazione`, `⬆ Carica qui il computo del
  geometra`, `+ Aggiungi capitolo`) messi **dopo** una riga che diceva
  «Totale del computo 0,00 €».

L'ordine sullo schermo era **il contrario dell'ordine del lavoro**.

## Cos'è adesso

In cima alla finestra c'è una barra:

**1 Lavorazioni · 2 Prezzi · 3 Ribasso e totale · 4 La scheda · 5 Acconti (SAL)**

- si apre sulle **Lavorazioni**, non sull'anagrafica;
- il numero **1 diventa una spunta verde** appena una lavorazione c'è;
- su un computo **senza lavorazioni**, le voci **2, 3 e 5 sono spente** e, se le
  premi, dicono perché: *«Prima mettici le lavorazioni: senza quelle qui non
  c'è niente da fare»*. Restano **visibili**, non nascoste: chi apre un computo
  nuovo deve vedere che dopo c'è altro, se no crede di aver finito;
- su un computo **appena creato e non ancora salvato** l'unica voce accesa è
  la **4 La scheda**, e si apre lì;
- **dopo «Crea computo» la finestra non si chiude più**: si riapre da sola sul
  computo nuovo, sulla pagina **1 Lavorazioni**, con scritto «adesso mettici le
  lavorazioni». Prima ti lasciava davanti a un elenco senza dirti cosa fare.

E al posto dei tre pulsantini, sul computo vuoto c'è **una cassetta sola con
due strade**: `⬆ Carica qui il computo del geometra` (pieno di blu, perché è la
prima cosa da fare) e `+ Le scrivo io, una per una`. Il capitolo sta sotto,
piccolo, con scritto che si può mettere anche dopo. La riga «Totale del computo
0,00 €» su un computo vuoto non c'è più: non diceva niente.

## ⛔ LA COSA DA NON TOCCARE MAI

**Le pagine ci sono TUTTE nel documento e si nascondono col CSS** (`.copag` /
`.copag.on`). Non si ridisegnano al cambio di voce.

Il motivo è serio: `saveComputo` legge le caselle **per id** (`co-tit`,
`co-num`, `co-rib`, `co-note`…). Se una pagina non fosse disegnata, quelle
caselle non esisterebbero, il salvataggio le leggerebbe **vuote** e ti
**cancellerebbe il titolo perché stavi guardando il ribasso**.

Nel banco c'è una prova apposta, e il sabotaggio che la rompe («cambiando
pagina le caselle nascoste vengono buttate via») la fa diventare rossa.

**Seconda cosa:** una pagina è fatta di **più blocchi** — la 4 ne ha tre (Che
computo è / Per chi, A cosa serve, Note) e la 3 ne ha due (Quadro economico, Il
ribasso). `compPag` li accende **tutti**. Accenderne uno solo era il primo
errore da fare, e c'è il sabotaggio anche per quello.

## ⛔ «RICORDA A PAGINA PIENA» — il secondo errore, stesso giorno

Alessio manda la foto del gestionale vero, online, e scrive tre parole:
**«ricorda a pagina piena»**. La finestra del computo si era rimpicciolita a
una finestrella da 880 px in mezzo allo schermo.

**Perché.** Nel CSS c'erano **dieci regole** che capivano «questa finestra è
lunga, prende tutto lo schermo» guardando se dentro c'era **`.sh-cols`** — le
due colonne. Il computo le colonne non ce le ha più: ha le pagine `.copag`.
Da un momento all'altro il computo è diventato una «finestra corta».

**Come è stato aggiustato — e questa è la parte che conta.** Non aggiungendo
`.copag` a dieci regole (una regola che vive in dieci posti non si aggiusta
mai del tutto). Adesso il nome è **UNO SOLO**: `openSheetGrande` mette la
classe **`sh-lunga`** sulla finestra —

```
if(s.querySelector(".sh-cols,.copag")) s.classList.add("sh-lunga");
```

— e tutte e dieci le regole guardano quella. **Chi domani inventa una terza
forma di finestra la aggiunge in QUELLA riga, non nel CSS.**

**A pagina piena la finestra è larga, il testo no.** Su un monitor da 27" una
riga larga due metri non si legge: la barra sta larga quanto lo schermo (dice
«dove sono» e si vede da lontano), il contenuto sta al centro dentro
1060 px. C'è la prova, e il sabotaggio che la toglie diventa rosso.

⚠️ **La lezione, di nuovo:** *una regola agganciata al nome di un pezzo si
rompe il giorno che quel pezzo cambia nome.* Due volte nello stesso giorno,
per la stessa causa. E **nessuno dei due l'ha trovato un banco**: li ha
trovati Alessio guardando lo schermo.

**E subito dopo, terza volta:** «perché queste finestre piccole?». La
conferma del computo letto dal PDF — **88 righe da controllare una per una** —
si apriva in una finestrella da 880 px con una barretta di scorrimento lunga
un dito. Quella finestra non aveva né le colonne né le pagine, quindi il
gestionale non la considerava lunga. Adesso il segnale è `.cp-riga`, aggiunto
in **quella riga sola**, e il contenuto sta al centro con `.sh-centro`.

Ho controllato **tutte** le chiamate a `openSheetGrande` una per una: le altre
«— NIENTE —» (scegli un lavoro, scegli un preventivo, che tipo di fattura, il
dettaglio della carta) sono davvero corte, e a tutto schermo diventerebbero un
lenzuolo bianco con tre righe in cima. Restano finestrelle **apposta**.

**Ultima cosa dello stesso giro:** la casella del file (`#comp-file`) era
scritta **due volte** — una nella cassetta del computo vuoto, una nella fila
dei pulsanti — ognuna con la sua lista di formati accettati
(`.xlsx .xls .csv .pdf`). Due liste che devono restare uguali per sempre sono
una lista che prima o poi si scolla: adesso la casella è **una sola**
(`_fileIn`), usata da tutti e due i rami. Se ne è accorto un sabotaggio, che
è diventato «non unico» invece di accusare.

## Un errore mio, trovato guardando la foto

Nel CSS c'era una regola che teneva il pulsante **Salva** lontano dal fumetto
della chat, e stava agganciata a **`.sh-cols`** — le due colonne. Il computo le
due colonne non ce le ha più: senza accorgersene, il Salva del computo sarebbe
tornato **sotto il fumetto**. Adesso la regola vale per `.sh-cols` **e** per
`.copag`.

**La lezione:** *una regola agganciata al nome di un pezzo si rompe il giorno
che quel pezzo cambia nome.* E non l'ha trovata il banco: l'ho vista in una
foto dello schermo.

Sempre dalla foto: in fondo al computo ci sono **cinque** pulsanti, e senza il
ritorno a capo le parole si sovrapponevano — «Controlla prima di mandarlo»
finiva **sopra** «Falla leggere anche all'AI». Adesso il piede va a capo. Un
pulsante che non si legge non è un pulsante.

## Come è stato provato

- **`prove/banco-navbar.js` — 66 prove**, il gestionale vero in Chromium.
  Guarda **il pixel, non la classe**: chiede al browser se una cosa *si vede*
  (`offsetParent`), perché una classe `on` con il CSS sbagliato non mostra
  niente e il banco resterebbe verde lo stesso.
  Le prove che contano di più: le caselle nascoste **esistono ancora e hanno
  ancora il loro valore**; si scrive un ribasso stando sulla pagina 3, si
  salva, e **titolo e numero sono ancora nel database**.
- **`prove/sabotaggi-navbar.py` — 21 sabotaggi, 21 visti.** (`SOLO="..."` per
  ripassarne uno solo senza rifare tutto il giro.)
  Uno era **non unico** al primo giro: `const corpo=document.querySelector(
  "#sheet .sh-body")` compare **due volte** nel file (c'è anche in
  `openSheetGrande`), il sabotaggio ne cambiava una sola e il banco restava
  verde. **È la trappola del 19 agosto che torna**, e l'ha presa il controllo
  di unicità dello script. L'ancora adesso è lunga, con il commento sopra.
- **`prove/banco-pdf-browser.js`** ha tre prove in più: la conferma del PDF
  deve stare a pagina piena. **`prove/sabotaggi-pdf-browser.py` — 7 sabotaggi,
  7 visti.**
- Gli altri banchi girano ancora tutti verdi: SAL 88, Riepilogo 34, PDF nel
  browser 17, lettore PDF 20. **225 prove verdi in tutto.**

---

# 20 agosto 2026 (3), SERA — IL CRONOPROGRAMMA

## Perché questo e non altro

Alessio: «fai una lista di questi lavori perché io ho **sia imprese sia
professionisti** nel mio gestionale». Rifatta la lista di PriMus guardando a
chi serve ogni cosa (`prove-claude/CHI-USA-COSA.md`), ne è uscita una sola
voce che serve **forte a tutti e due** e che **nasce dal computo che c'è già**:
il cronoprogramma. Ha scelto quello.

## Com'è fatto

Voce **6 Cronoprogramma** nella barra del computo. Dentro: la data di inizio
del cantiere, una riga per **capitolo** con i giorni che dura, e le barre sul
calendario.

**La durata sta sul CAPITOLO, non sulla singola lavorazione** — scelto da
Alessio fra tre modi. Su un computo da 87 righe scrivere 87 durate è una
serata; in cantiere si ragiona per fasi (Demolizioni, Murature, Impianti):
sei numeri invece di ottantasette.

Le regole del conto:

- i giorni sono **giorni di lavoro**: sabato e domenica non si contano. Un
  cantiere che comincia di sabato comincia il lunedì;
- ogni fase comincia **quando finisce quella prima**;
- con la spunta **«insieme al precedente»** comincia invece nello stesso
  giorno (l'idraulico e l'elettricista che lavorano insieme). La barra di una
  fase in parallelo è **a righe**, per vederlo a colpo d'occhio;
- ⚠️ **dopo un gruppo in parallelo si riparte dalla fase PIÙ LUNGA**, non
  dall'ultima scritta. È il punto dove è più facile sbagliare, e il
  cronoprogramma direbbe una settimana in meno;
- una fase **senza durata** non ha date e **non sposta le altre**: è una riga
  ancora da riempire, non una fase da zero giorni;
- scrivendo un numero il calendario **si rifà subito, senza salvare**.

## ⛔ LE DATE NON SI SCRIVONO, SI CALCOLANO

Nel database ci sono **solo** la data di partenza e le durate:

    gest_computi.data_inizio        quando comincia il cantiere
    gest_computo_capitoli.giorni    quanti giorni di lavoro dura la fase
    gest_computo_capitoli.insieme   comincia insieme alla precedente

Chi comincia quando lo decide `cronoDate`, e basta. Se le date fossero
scritte, spostare l'inizio del cantiere di un giorno le lascerebbe **tutte
sbagliate** senza che nessuno se ne accorga. È la stessa scelta della quantità
delle lavorazioni, che il gestionale legge e non scrive mai.

## Un computo senza capitoli lo dice

I computi che arrivano dal **PDF del geometra nascono senza capitoli** — e
senza capitoli non c'è niente da mettere sul calendario. Prima si sarebbe
vista una pagina vuota senza capire perché. Adesso c'è una cassetta che
spiega e un pulsante che porta alle Lavorazioni, dove i capitoli si creano.

## ⚠️ UN DIFETTO TROVATO DA UN SABOTAGGIO, non da me

Il sabotaggio «le barre non sono più proporzionali» **restava verde**. Motivo:
la formula della barra era scritta **DUE volte** — in `renderCrono` e in
`cronoAnteprima`. Rompendone una, a schermo vinceva l'altra.

È la lezione che torna: **una regola che vive in due posti non si può
aggiustare a metà.** Adesso disegnare una riga è in un posto solo
(`_cgTesto`, `_cgBarra`, `_cgTotale`) e il sabotaggio accusa.

Nota: il difetto non l'ha trovato il banco «normale» — l'ha trovato il
sabotaggio, cioè la prova che il banco stesso funzioni.

## ⚠️ «IL PRATICA COMINCIA IL» — l'ha visto Alessio, non il banco

Prima foto del cronoprogramma online, da **professionista**: sull'etichetta
c'era scritto **«Il pratica comincia il»**.

Avevo scritto «Il **cantiere** comincia il». Per gli studi tecnici il
gestionale riscrive *cantiere* in *pratica* (`_FRASI`, regola corta
`['cantiere','pratica']`) e l'articolo maschile restava lì.

**È la terza volta che questa trappola morde** (la prima: «l'incidenza della
tempo speso»; la seconda: «Nessun pratica aperta»). La regola per la prossima:
⛔ **nelle scritte nuove non si usano parole che passano dalla traduzione.**
Adesso l'etichetta è **«Si comincia il»**: giusta per tutti e due, e non c'è
niente da tenere allineato in due posti.

**E adesso il banco lo vede.** `prove/banco-crono-browser.js` apre il computo
**da professionista**, passa su **tutte e sei le pagine** della barra e cerca
un articolo maschile davanti a una parola femminile (e il contrario). Il
sabotaggio che rimette l'etichetta vecchia lo fa diventare rosso.

## Come è stato provato

- **Il file SQL su un PostgreSQL 16 vero**, schema ricostruito dai file di
  `sql/`: eseguito **due volte** (la seconda non deve rompere niente), colonne
  controllate una per una, e il paletto sulle durate provato **nel verso che
  deve fallire** — 5 entra, −1 e 5000 vengono rifiutati, «vuoto» entra.
- **`prove/banco-crono.js` — 40 prove** sul conto delle date, con le funzioni
  estratte **VERBATIM** dal gestionale (`prove/estrai-crono.py`). C'è dentro un
  cantiere vero di sette fasi con due in parallelo, e la prova che spostando
  l'inizio di **un** giorno tutto si sposta di **un** giorno.
- **`prove/sabotaggi-crono.py` — 11 sabotaggi, 10 accusati.**
  ⚠️ Uno **NON è provato** e sta scritto anche nel codice: tenere la data a
  mezzogiorno invece che a mezzanotte. Ho fatto girare le date su cinque fusi
  con il cambio d'ora di notte (Santiago, Beirut, L'Avana, San Paolo, Teheran)
  per sette anni: **zero differenze**. La cintura resta perché non costa
  niente, ma non si scrive «provata» una cosa che il banco non fa diventare
  rossa.
- **`prove/banco-crono-browser.js` — 41 prove** nel gestionale vero in
  Chromium. La più importante: scrivendo un numero il calendario si rifà **ma
  nel database non deve essere scritto niente** finché non premi Salva.
- **`prove/sabotaggi-crono-browser.py` — 15 sabotaggi, 15 accusati.**
- **Telefono 390×844**: nessun testo sotto i 13 px, niente che esce dallo
  schermo (regola dislessia).
- Gli altri banchi restano verdi: SAL 88, Riepilogo 34, barra del computo 66,
  PDF nel browser 17, lettore PDF 20. **306 prove verdi in tutto.**

⚠️ **Prima del push va eseguito `sql/gest-computo-cronoprogramma.sql` su
Supabase.** Senza, il computo si salva lo stesso (c'è il ripiego, come per il
quadro economico) ma il cronoprogramma dice che manca l'aggiornamento.

---

# 20 agosto 2026 (4), SERA — IL COMPUTO DI VARIANTE

## Perché

I lavori cambiano in corsa: il muro che sotto l'intonaco era diverso, il
cliente che aggiunge un bagno, la quantità vera che non è quella disegnata.
**Sui lavori privati oggi si fa a voce, ed è lì che nascono le liti.**

Era il più piccolo della lista, perché «Duplica» c'era già: mancava solo
farsi ricordare da dove viene la copia.

## Com'è fatto

Dalla scheda del computo: **«± Crea la variante»**, accanto a «Duplica». Fa
una copia **con le misure, sempre** (una variante nasce dal lavoro vero) e si
ricorda **da quale computo viene** e **da quale riga viene ogni riga**.

Nella variante compare la voce **7 Cosa è cambiato** — solo lì: su un computo
normale non ci sarebbe niente da confrontare. Dentro, tre elenchi
(**cambiate · aggiunte · tolte**) e in fondo i tre numeri: computo di
partenza, variante, differenza in euro e in percentuale.

Le lavorazioni **rimaste uguali non compaiono**: in un elenco di ottantasette
righe, le sei cambiate devono saltare all'occhio.

⛔ **Su una variante non si offre di rifarne un'altra.** Una variante della
variante non è più un confronto, è una catena in cui non si capisce più
rispetto a cosa.

## ⛔ PERCHÉ SI CONFRONTA PER origine_id E NON PER CODICE

È la scelta più importante della funzione, e sta in `varConfronta`.

- **Per codice non si può:** due lavorazioni possono avere lo **stesso codice
  di tariffa** in due capitoli diversi (la stessa demolizione al piano terra e
  al primo piano). Si confonderebbero fra loro.
- **Per descrizione nemmeno:** correggere un refuso in una descrizione farebbe
  risultare quella riga **«tolta» e «nuova» insieme** — e la variante direbbe
  una bugia proprio nel documento che serve a non litigare.

Con `origine_id` ogni riga sa da dove viene, sempre. Nel banco ci sono le due
prove apposta, e i due sabotaggi che rimettono i modi sbagliati.

⚠️ **I soldi si confrontano al centesimo, non con «uguale».** Due numeri che
vengono dal database possono differire di un miliardesimo per come sono stati
scritti: una riga mai toccata comparirebbe fra quelle cambiate. Soglie:
**0,005 € sul prezzo**, **0,0005 sulla quantità** (che ha tre decimali).

## ⚠️ UN DIFETTO DEL BANCO, NON DEL GESTIONALE

Provando il pulsante «Crea la variante» le lavorazioni nascevano **senza
`computo_id`**. Sembrava un difetto grosso. Non lo era: era il **finto
Supabase** che onorava `.single()` **solo in lettura**. Un

    insert(...).select("id").single()

tornava un ARRAY invece della riga, il gestionale leggeva `nuovo.id` =
`undefined`, e `JSON.stringify` buttava via la chiave. In produzione Supabase
la riga la restituisce, e infatti «Duplica» funziona da giorni.

**È la lezione numero uno che torna:** *un finto non deve mai essere più
povero del vero* — se no non trova i difetti, **li inventa**. Adesso
`prove/finto-supabase.js` onora `.single()` anche dopo insert, update e
delete.

## Due cose viste in una foto, non dal banco

1. Il **rosso e il verde tingevano anche il codice di tariffa** («A.01» usciva
   rosso). Il colore lì deve dire **una cosa sola**: se quella riga fa salire
   o scendere il conto. Risolto con `> b`, il figlio diretto.
2. (dal giro prima) «Il pratica comincia il».

Fanno tre cose in un giorno trovate guardando lo schermo e non il banco. Vale
la pena continuare a chiedere le foto.

## Come è stato provato

- **Il file SQL su un PostgreSQL 16 vero**: eseguito due volte, i due
  `on delete set null` controllati **nel verso che conta** (cancellato il
  computo di partenza, la variante **resta** con `variante_di` vuoto), e il
  paletto «un computo non può essere la variante di sé stesso» provato nel
  verso che deve **fallire**.
- **`prove/banco-variante.js` — 30 prove** sul confronto, funzione estratta
  **verbatim**. Dentro: due righe con lo stesso codice, una descrizione
  corretta, il miliardesimo, la percentuale che non deve diventare
  «Infinity%», e una variante vera con i conti rifatti a mano.
  ⚠️ **Tre numeri li avevo scritti a mente e li avevo sbagliati: il banco mi
  ha corretto.** È il motivo per cui i conti non si guardano, si fanno girare.
- **`prove/sabotaggi-variante.py` — 12 sabotaggi, 12 accusati.** Tre erano
  scritti male e non potevano accusare (uno non cambiava il comportamento, uno
  rompeva l'estrazione, uno confrontava `Infinity` con `JSON.stringify` — che
  lo trasforma in `null`). Riscritti.
- **`prove/banco-variante-browser.js` — 40 prove** nel gestionale vero,
  compreso **premere il pulsante** e guardare cosa finisce davvero nel
  database.
- **`prove/sabotaggi-variante-browser.py` — 13 sabotaggi, 13 accusati.**
- **Telefono 390×844**: niente sotto i 13 px, niente che esce.
- Tutti gli altri banchi restano verdi. **379 prove verdi in tutto.**

⚠️ **Prima del push va eseguito `sql/gest-computo-variante.sql` su Supabase.**

---

# 20 agosto 2026 (5), SERA — ⛔ IL TESTO DEL PREZZARIO NON SI TOCCA

Alessio manda la foto di una variante appena creata, da **professionista**.
Dentro una lavorazione, in mezzo alla descrizione lunga del prezzario:

> «…nei siti che verranno indicati dalla Direzione dei lavori nell'ambito
> **del pratica** dei materiali riutilizzabili…»

Nel testo vero della Regione Lazio c'è «nell'ambito **del cantiere**».

## Cosa succedeva

Per gli studi tecnici il gestionale riscrive *cantiere* → *pratica*
(`_FRASI` + `localizzaPratiche`). Il traduttore cammina sui nodi di testo e
salta i contenitori elencati in `_SKIP_UTENTE`. **Le lavorazioni del computo
non erano in quell'elenco**, quindi passava anche sul testo del computo.

⛔ **Il testo del computo NON È NOSTRO.** Le descrizioni arrivano dal
**prezzario ufficiale** o dal **PDF del progettista**: in una gara hanno un
valore legale. Riscriverne una parola è come correggere il capitolato di
qualcun altro. Vale anche per i titoli dei capitoli, che li scrive l'utente.

Non era un difetto di oggi — c'è da quando esistono le lavorazioni. Si è
visto adesso perché il computo è arrivato in mano a un professionista.

## Come è stato aggiustato

Una classe sola, **`.cm-testo`**, aggiunta a `_SKIP_UTENTE`, e messa su ogni
pezzo che contiene testo del computo:

- la lavorazione nell'elenco (`renderCompVoci`)
- il titolo del capitolo
- il confronto della variante (`nomeVoce`)
- il cronoprogramma (i titoli delle fasi)
- la conferma del PDF (`.cp-desc`)
- il SAL (la riga della lavorazione)

**Un posto solo:** chi domani disegna una schermata nuova col testo di una
lavorazione dentro si mette `cm-testo` e non ci pensa più.

## Provato

`prove/banco-crono-browser.js` apre il computo **da professionista** con una
lavorazione che contiene *«nell'ambito del cantiere»* e *«Direzione dei
lavori»*, e controlla che restino **identiche, parola per parola**. Due
sabotaggi (togliere `.cm-testo` dall'elenco, e toglierlo dalla lavorazione)
lo fanno diventare rosso.

**Sempre dalla stessa foto:** la barra delle voci aveva una barra di
scorrimento che non serviva — il padding grande stava su tutti e due i lati e
si sommava alla larghezza. Adesso sta solo a sinistra, che è quello che serve
per allineare le voci al contenuto centrato.

⚠️ **Fanno QUATTRO difetti in un giorno trovati guardando le foto e non dal
banco** («Il pratica comincia il», il Salva sotto il fumetto, il codice di
tariffa colorato, il testo del prezzario). *Chiedere le foto è la prova più
economica che abbiamo.*

---

# 20 agosto 2026 (6), SERA — IL GESTIONALE TORNA CHIUSO

## La decisione di Alessio, con le sue parole

> «io voglio solamente fare un bel gestionale completo e metterlo a pagamento.
> Tra un mese inizio a incassare, tra un anno, non importa.»
>
> «**prima si costruisce la casa poi si vende**»

⛔ **E una cosa che avevo sbagliato io, due volte di fila.** Gli ho fatto
domande sui clienti — quanti sono, chi usa il gestionale, quanti pagherebbero
— quando lui mi aveva già detto cosa voleva. Risposta: *«non mi interessa,
come te lo devo dire»*. È la seconda volta in due giorni (ieri: «non dico
fermati a lavorare ma ad ascoltarmi»).
**Quando Alessio dice cosa vuole, si fa quello. I numeri si portano solo se
li chiede.**

## Cosa è stato fatto

**`var MANUTENZIONE = true;`** (riga ~22141). Il gestionale è chiuso a tutti
tranne le email in `AMMESSI` (oggi solo la sua) e a chi ha il link
`?chiave=apri`. Si finisce con calma e si riapre quando vale i soldi che si
chiedono.

**E la schermata è stata riscritta.** Prima diceva che il gestionale sarebbe
stato compreso senza pagare nulla in più: quella riga la leggevano le imprese
entrate a luglio e legava le mani sul prezzo. Adesso dice **cosa c'è dentro**,
**perché è chiuso** («vogliamo darvelo finito, non a metà») e **dove andrà a
finire** (il Premium). ⛔ **Nessuna cifra e nessuna promessa.**

⚠️ **Chi tocca quel testo: non rimetterci dentro un impegno.** Ci sono quattro
sabotaggi apposta che diventano rossi se ricompare «gratis», «non dovrai
pagare nulla», una cifra in euro, o se sparisce il perché.

## Una cosa che è cambiata nei banchi

Con la porta chiusa, i banchi entravano «di straforo»: il gate copriva la
pagina ma loro leggevano il DOM sotto e restavano verdi. Adesso **entrano
dalla porta prevista**, con `?chiave=apri` nell'indirizzo. Così se un domani
la porta si rompe, i banchi se ne accorgono invece di scavalcarla.

## Provato

- **`prove/banco-gate.js` — 19 prove.** Un'impresa qualunque trova chiuso;
  non legge nessuna promessa né cifra; Alessio entra; la chiave apre anche a
  chi **non** ha il Premium (e senza chiave quello vede la schermata del
  Premium, non la manutenzione).
- **`prove/sabotaggi-gate.py` — 9 sabotaggi, 9 accusati.** Uno restava verde:
  la chiave è gestita in **due posti** (`ammesso()` e `decidi()`) e rompendone
  uno l'altro rimediava. I due però fanno cose diverse — uno salta la
  manutenzione, l'altro anche il Premium — e la prova che li distingue adesso
  c'è.
- Tutti gli altri banchi restano verdi.

---

## DOVE SIAMO RIMASTI (20 agosto 2026, notte)

**Fatto oggi — dieci cose, tutte online.** Cinque push:
`2bbfd23` · `f572d83` · `214a03a` · `430cdf3` · (+1 finale).

1. la sezione **«Stati di avanzamento»** nel menù;
2. il **Riepilogo neutro** con le icone colorate e i pallini rosso/verde;
3. il **computo aperto alle imprese** come «Computo da prezzare»;
4. **il computo che arriva in PDF**, con la conferma riga per riga;
5. la **«Lista da far prezzare»** anche sui lavori privati;
6. **la scala del computo** — la barra numerata, la cassetta al posto dei tre
   pulsantini, la finestra che si riapre dopo «Crea computo»;
7. **a pagina piena** — il computo e la conferma del PDF (classe `sh-lunga`);
8. **il cronoprogramma** — voce 6 (`sql/gest-computo-cronoprogramma.sql` ✅ già
   eseguito su Supabase);
9. **il computo di variante** — voce 7, solo sulle varianti
   (`sql/gest-computo-variante.sql` ✅ già eseguito su Supabase);
10. ⛔ **il testo del prezzario non si tocca più** (`.cm-testo`);
11. ⛔ **il gestionale è tornato CHIUSO** (`MANUTENZIONE = true`) con la
    schermata riscritta senza promesse.

**379 prove verdi · 80 sabotaggi, 79 accusano.** L'unico che non accusa è
dichiarato nel codice (il mezzogiorno delle date del cronoprogramma).

---

**DA FARE, IN QUESTO ORDINE**

⛔ **LA DIREZIONE, decisa da Alessio la sera del 20 agosto:
«prima si costruisce la casa poi si vende».**
Il gestionale è chiuso. **Si costruisce.** Il prezzo, i clienti e l'incasso
NON sono l'argomento: non riportarli finché non li tira fuori lui.

**1. FINIRE IL GESTIONALE.** Cosa manca, dalla lista
`prove-claude/CHI-USA-COSA.md` (c'è scritto a chi serve ogni cosa, impresa o
professionista):
   - **l'analisi dei prezzi** — quando una lavorazione non sta nel prezzario.
     Piccola-media, e apre i professionisti;
   - **il PDF del cronoprogramma** e **il PDF della variante** — oggi si
     vedono solo a schermo, e in una gara vanno consegnati stampati;
   - **il POS** (piano di sicurezza) — è l'unica cosa che un'impresa è
     obbligata per legge ad avere. ⚠️ Grosso, e si fa **con un consulente
     vero** che controlla i modelli, o non si fa;
   - **la contabilità pubblica completa** — sei documenti, solo per chi fa
     direzione lavori su appalti pubblici;
   - **i formati di scambio** — dopo il lettore del PDF serve molto meno.

**QUANDO IL PREZZO TORNERÀ ATTUALE** (e solo allora): 29 € al mese oppure
249 € l'anno, il prezzo vecchio è in **17 posti** già trovati — `prezzi.html`
(anche il testo per Google) · `info-premium.html` ·
`software-gestionale-imprese-edili.html` (7 punti) · i quattro **pannelli** ·
le quattro **registrazioni** · `pubblicita.html` · `termini-condizioni.html` ·
`admin.html` · `js/assistente-trovaimpresa.js` · `js/ai-integrazione.js` ·
`netlify/functions/ai-claude.js` ·
`netlify/functions/controlla-scadenze-premium.js`.
✅ Il pagamento **mensile su Stripe c'è già**: in
`netlify/functions/crea-checkout-abbonamento.js` ci sono i due price id.
⚠️ Gli **artigiani non pagheranno mai**: sono clienti non paganti.

**2. L'avviso alle imprese di luglio** — hanno tre mesi in regalo che stanno
per scadere. La mail c'è (`controlla-scadenze-premium.js`) ma dice il prezzo
vecchio.

**3. L'errore JavaScript sulla homepage** (`PAGINE_REGISTRAZIONE` due volte):
⚠️ guardare **l'iniezione di Netlify**, non il codice.

**4. Rileggere il contatore delle visite** (query in fondo a
`sql/conteggio-visite.sql`).

**5. Poi, dal gestionale:** l'analisi dei prezzi · la contabilità pubblica
completa (⚠️ prima **contare** quanti studi fanno davvero direzione lavori) ·
il POS (⚠️ solo con un consulente vero) · i formati di scambio · il computo da
una foto (⚠️ prima **chiedere a un'impresa come le arriva il computo**).

**6. Il sito:** le 95 pagine città vuote · l'email vera alle 87 imprese · il
grafico dell'admin · la descrizione schiacciata a 390 px sui preventivi · il
limite di misura su `cv-candidati`/`registrazioni` · il conteggio delle
richieste di caricamento file · il pulsante del prezzario anche in cima.

**Meta:** campagna ferma per una settimana dal 19 agosto, poi rimisurare.
**Pulizie:** i preventivi n. 4, 5 e 6 del reparto «progetto casa» · la riga
completamente vuota in `imprese`.

⚠️ **Le due liste lunghe stanno in `prove-claude/`:**
`LAVORI-DA-FARE.md` (tutti i lavori, con le crocette) ·
`COSA-HA-PRIMUS-CHE-NOI-NO.md` e `CHI-USA-COSA.md` (a chi serve cosa, imprese
contro professionisti).

⚠️ **LA COSA PIÙ UTILE IMPARATA OGGI:** quattro difetti su quattro li ha
trovati **Alessio guardando le foto dello schermo**, non i banchi — «Il
pratica comincia il», il Salva sotto il fumetto della chat, il codice di
tariffa colorato di rosso, il testo del prezzario riscritto. **Chiedere le
foto è la prova più economica che abbiamo.** Chiederle sempre, dopo ogni
consegna.

---

## DOVE SIAMO RIMASTI (21 agosto 2026)

**Fatto oggi: i due PDF che mancavano.** Due push.

1. **Il PDF del cronoprogramma** (voce 6) — foglio **orizzontale**: le fasi,
   i giorni, le date, le barre sul calendario con i mesi scritti sopra, il
   riquadro coi giorni di lavoro e la data di consegna, e la firma.
2. **Il PDF del computo di variante** (voce 7) — cambiate, aggiunte, tolte,
   ognuna con «prima» e «adesso», e in fondo partenza · variante · differenza
   con la percentuale. Due firme: committente e impresa.
3. I pulsanti: **«Scarica il cronoprogramma»** in fondo alla pagina 6 e
   **«Scarica il computo di variante»** in fondo alla pagina 7.

⛔ **NIENTE SQL.** I due fogli non chiedono al database niente che non ci
fosse già: `sql/gest-computo-cronoprogramma.sql` e
`sql/gest-computo-variante.sql` erano già stati eseguiti il 20 agosto.

---

### LE REGOLE NUOVE (nate da difetti veri di oggi)

**1. Una formula sta in UN POSTO SOLO, e adesso i posti sono due: lo schermo
e la carta.** Il foglio stampato NON rifà nessun conto: chiama `cronoDate`,
`cronoScala`, `_cgBarraPerc`, `_cgGiorniLav`, `varConfronta` — le stesse che
disegnano lo schermo. Per farlo sono state estratte funzioni nuove da quelle
che c'erano:

- `_cgBarraPerc(r,primo,arco)` → dove comincia e quanto è larga una barra, in
  percentuale. La usano `_cgBarra` (schermo) e `cronoPdf` (carta).
- `_cgGiorniLav(primo,ultimo)` → i giorni di lavoro. La usano `_cgTotale`
  (la riga blu) e `cronoPdf`.
- `cronoScala(righe)` → primo giorno, ultimo giorno, arco. Erano tre righe
  copiate in `renderCrono` e `cronoAnteprima`: col PDF sarebbero diventate
  tre copie.
- `_cgGiorno(y,m,g)` → **l'ora di tutte le date del cronoprogramma si decide
  qui**: mezzogiorno. Prima stava dentro `_cgData`; `cronoMesi` se la sarebbe
  scritta per conto suo, e bastava cambiarne una per far ballare di un'ora i
  conti dei giorni.

**2. Il foglio esce da quello che è SALVATO, non dalle caselle.**
`cronoModifiche(id)` confronta le caselle con le durate lette dal database:
se qualcosa è cambiato, ci si ferma e si dice di salvare. Senza, bastava
cambiare i giorni di una fase e premere subito il PDF per portare in gara un
calendario diverso da quello sullo schermo. È la stessa rete che ha già il
SAL (`salModifiche`).

**3. Prima di stampare la variante si fa la prova del nove.** Le righe
stampate (cambiate + aggiunte − tolte) devono fare **esattamente** la
differenza del riquadro in fondo. Se non la fanno, il foglio non esce: meglio
nessun PDF che un PDF che non dimostra il suo stesso totale.

**4. ⚠️ IL NOME DI UN PULSANTE SI GUARDA SULLA SCHERMATA INTERA, NON SULLA
PAGINA DA SOLA.** I due pulsanti nuovi si chiamavano tutti e due «Scarica il
PDF» — e in cima alla stessa schermata c'era già un «Scarica il PDF» che
scarica il computo metrico. Tre pulsanti, stesso nome, tre documenti diversi.
Visto da Alessio in una foto; il banco leggeva la pagina 6 da sola.

**5. `.sh-nota` nasce con `margin-top:-4px`.** Sta bene sotto una casella,
non sotto una fila di pulsanti: lì la scritta grigia risulta incollata.
Rimediato con `.cg-salva + .sh-nota` e `.var-stampa + .sh-nota`.

---

### DIFETTI VECCHI TROVATI PER STRADA

- ✅ **«Lista per la gara»: sopra ogni gruppo c'era scritto sempre
  «Capitolo».** Il codice cercava `g.cap.nome`, ma nel database il capitolo
  si chiama `titolo` (e `numero`). Nel PDF del computo era già giusto: era
  sbagliato solo lì. Sistemato.
- ✅ **Le migliaia senza il punto sul foglio della variante.** Sul primo
  foglio uscito dal banco si leggeva «€ 11.001,00» nel riquadro e «2220,00»
  due colonne più su. È lo stesso difetto del 19 agosto sul quadro economico:
  `Intl` in italiano mette il punto solo dai cinque numeri in su.
  ⚠️ **`useGrouping:true` va messo su OGNI helper di numeri di OGNI PDF**,
  non solo su quello dei totali.
- ✅ **«le 1 righe rimaste uguali».** Il singolare mancava.

⛔ **RESTANO DUE RIGHE, nella sola «Lista per la gara» (`computoListaGara`):**
il **telefono non si stampa mai** (il codice cerca `az.telefono`, la colonna
si chiama `az.tel`) e l'indirizzo esce **senza CAP, città e provincia**
(usa `az.indirizzo` invece di `azIndirizzo(az)`). Detto ad Alessio, non
ancora fatto.

---

### COME SONO STATI PROVATI

I banchi stanno nel contenitore di Claude, in `prove/`, e vanno rifatti ogni
sessione. Le funzioni si prendono **dal file vero** con `estrai.js` /
`estrai-pdf.js`: niente copia-incolla a mano.

- **`banco.js` — 70 verdi.** Le date, il parallelo, i mesi, il confronto
  della variante. Su una ristrutturazione bagno vera (sei fasi) e su un
  rifacimento tetto vero. Compreso il giro su **sette fusi orari** con l'ora
  legale che cambia di notte.
- **`banco-fogli.js` — 101 verdi.** `cronoPdf` e `variantePdf` girano per
  davvero con **jsPDF 2.5.1** (la stessa versione che scarica il gestionale),
  e il PDF si **rilegge** con `pdftotext`: se una cosa non c'è scritta sopra,
  non c'è. ⚠️ **Le barre non stanno nel testo**: si leggono i rettangoli dal
  flusso del PDF e si confrontano coi numeri di `_cgBarraPerc`. Senza questo,
  un sabotaggio che sposta tutte le barre lasciava il banco verde.
  Provati anche 40 fasi e 45 righe cambiate: il foglio si spezza e
  l'intestazione si ripete.
- **`banco-parole.js` — 23 verdi.** I messaggi dei due fogli si prendono dal
  file vero e si fanno passare dal traduttore vero (`_swapPratiche`): se uno
  cambia per uno studio tecnico, è rosso. Nasce da «Il pratica comincia il».
- **`banco-uguale.js` — 4 verdi.** ⚠️ **La versione di IERI contro quella di
  OGGI**, su 4.000 cantieri finti: **19.580 barre confrontate, tutte
  identiche**, più 800 confronti di variante. È la prova che il riordino
  delle funzioni non ha cambiato niente a schermo.
- **`apri.js` — 16 verdi.** La pagina si apre in Chromium a 1440×900 e
  390×844: zero errori JavaScript, zero id doppi, niente testo sotto i 13 px.
- **`sabotaggi.js` — 22 su 22 accusati.**
- **`sabotaggi-fogli.js` — 22 su 22 accusati.**

**Totale: 214 verdi · 44 sabotaggi, 42 accusati.**

⚠️ **I DUE SABOTAGGI DICHIARATI**, che il banco NON fa diventare rossi:
1. tutte le date tenute a **mezzanotte** invece che a mezzogiorno (era già
   dichiarato il 20 agosto: provato su cinque fusi e sette anni, zero
   differenze — il mezzogiorno resta perché non costa niente);
2. l'`i>0` tolto dal controllo del parallelo: sulla prima fase i due rami
   finiscono nello stesso punto.
Non si scrive «provata» una cosa che il banco non accusa.

⚠️ **UNA TRAPPOLA DEL BANCO, non del gestionale:** `JSON.stringify(Infinity)`
vale `"null"`. Il sabotaggio «la percentuale si calcola anche con la partenza
a zero» restava verde perché il confronto passava da `JSON.stringify`. Su
`Infinity`, `NaN` e `-0` si confronta con `===`, mai con `JSON.stringify`.

⚠️ **E UNA DI jsPDF:** `class X extends jsPDF` **non funziona** — il
costruttore restituisce un oggetto suo e il `save` della sottoclasse non
viene mai chiamato. Il PDF si generava e il banco non lo vedeva. Si avvolge
l'istanza, non si eredita.

---

**DA FARE, IN QUESTO ORDINE** — la direzione non cambia: «prima si
costruisce la casa poi si vende». Il gestionale è chiuso
(`MANUTENZIONE = true`). Prezzo, clienti e incasso NON sono l'argomento.

1. **L'analisi dei prezzi** — quando una lavorazione non sta nel prezzario:
   materiali, manodopera, noli, spese generali, utile. Piccola-media, e apre
   i professionisti. **È la prossima.**
2. Le due righe della «Lista per la gara» (telefono e indirizzo, qui sopra).
3. Il POS (⚠️ solo con un consulente vero) · la contabilità pubblica
   completa (⚠️ prima **contare** quanti studi fanno direzione lavori) · i
   formati di scambio · il computo da una foto (⚠️ prima **chiedere a
   un'impresa come le arriva il computo**).
4. Il sito e le cose rotte: l'errore JavaScript sulla homepage
   (`PAGINE_REGISTRAZIONE`, ⚠️ guardare **l'iniezione di Netlify**) · il
   contatore delle visite · la descrizione schiacciata a 390 px sui
   preventivi · il limite di misura su `cv-candidati`/`registrazioni` · le 95
   pagine città vuote · l'email vera alle 87 imprese · il grafico dell'admin.

⚠️ **LA COSA PIÙ UTILE, ANCORA OGGI:** i due difetti che i banchi non hanno
visto li ha visti **Alessio in una foto dello schermo** — i tre pulsanti con
lo stesso nome e la scritta incollata. Un banco legge la pagina che gli dici
di leggere; una foto mostra la schermata intera. **Chiedere la foto dopo ogni
consegna, sempre.**

---

## DOVE SIAMO RIMASTI (21 agosto 2026, sera)

⛔ **IL DIFETTO PIÙ GRAVE DELLA GIORNATA, e non l'ha visto nessun banco.**

### La variante non confrontava niente

`gest_computo_voci.origine_id` è stata aggiunta il 20 agosto e viene
scritta giusta. **Ma il gestionale non legge la tabella: legge la VISTA**
`gest_computo_voci_calc`, che elenca le colonne UNA PER UNA — e
`origine_id` non era fra quelle.

Risultato: alla pagina «Cosa è cambiato» arrivava sempre vuoto, e
`varConfronta` faceva l'unica cosa che poteva: **AGGIUNTA ogni riga della
variante, TOLTA ogni riga dell'originale**. Su una variante appena creata,
identica al computo di partenza, la pagina elencava tutte le lavorazioni
**due volte** invece di dire «non è cambiato niente». Su quella di Alessio:
88 righe elencate due volte.

⚠️ **E IL TOTALE IN FONDO ERA GIUSTO.** Le righe uguali si annullano
comunque, quindi la differenza finale tornava — ed è per questo che né i
numeri né la «prova del nove» del PDF se ne sono accorti.

**Risolto con `sql/gest-variante-origine-vista.sql`** ✅ (già eseguito su
Supabase il 21 agosto sera). Usa `create or replace` e mette `origine_id`
**in fondo**: così `gest_computo_totali`, `gest_sal_righe_calc` e
`gest_sal_totali` restano dove sono invece di essere buttate giù e
riscritte a memoria.

### ⛔ LE DUE REGOLE CHE NASCONO DA QUI

**1. UNA COLONNA AGGIUNTA A UNA TABELLA NON ARRIVA DA SOLA IN UNA VISTA.**
Le viste del gestionale elencano le colonne per nome. Chi aggiunge una
colonna che il gestionale deve **leggere** si deve chiedere **da dove la
legge**: se la legge da una vista, va aggiunta anche lì.

**2. IL GESTIONALE NON DEVE MAI MENTIRE SE MANCA UN AGGIORNAMENTO.**
`varVistaSenzaOrigine(orig,nuove)` guarda se la **colonna** è arrivata (non
il valore: su un computo normale `origine_id` è legittimamente vuoto su
tutte le righe). Se non c'è, la pagina 7 mostra il riquadro «esegui
`sql/gest-variante-origine-vista.sql`» e il PDF si rifiuta di stampare.
Meglio una pagina che dice cosa fare, che una pagina che racconta una bugia
con l'aria di essere giusta.

### ⛔ E LA REGOLA SUL BANCO CHE MI HA INGANNATO

Il finto Supabase del banco restituiva le righe **con** `origine_id`,
perché gliel'avevo scritto io. La vista vera non ce l'aveva. **È la lezione
del 9 agosto, ripetuta: «lo schema di prova non somigliava abbastanza a
quello vero».**

Adesso `banco-fogli.js` ha `COLONNE_VISTA` — le 17 colonne lette da un
**PostgreSQL 16 vero** con lo schema ricostruito dai file di `sql/` — e il
finto Supabase **taglia tutto quello che la vista non espone**. Con sopra
il sabotaggio «togli l'avviso»: se il banco resta verde, non si è imparato
niente.

⚠️ **REGOLA GENERALE PER I BANCHI:** un finto database deve restituire
**esattamente le colonne che restituisce quello vero**, né una in più né
una in meno. Una colonna di troppo nasconde un difetto; una di meno ne
inventa uno.

### Lo zero non è «in più», e non è rosso

Il colore si sceglieva con `diff>=0`, e lo zero ci finiva dentro: si
leggeva **«In più + 0,00 € (+0%)» in rosso**. Capita anche per davvero, non
solo su una variante appena creata: se togli 500 € da una lavorazione e ne
aggiungi 500 su un'altra, la differenza è zero.
Adesso: **«Nessuna differenza — 0,00 €»**, in nero, senza percentuale.
Schermo e foglio stampato. ⚠️ La soglia è il **centesimo**, non lo zero
esatto: due millesimi di euro si stampano comunque «0,00», e un documento
che scrive «IN PIÙ € 0,00» si contraddice da solo.

### Le prove, a fine giornata
**238 verdi · 48 sabotaggi, 46 accusati** (2 dichiarati).
`banco.js` 70 · `banco-fogli.js` 124 · `banco-parole.js` 24 ·
`banco-uguale.js` 4 (19.580 barre ieri contro oggi) · `apri.js` 16.

⚠️ **Nel contenitore c'è anche un PostgreSQL 16 vero**, con
`pg_safeupdate` compilato a mano (non sta nei repo: si prende da
`github.com/eradman/pg-safeupdate` e si compila con
`postgresql-server-dev-16`). Lo schema si ricostruisce dai file di `sql/`
eseguiti in fila: `gest-computo-metrico` → `quantita-3-decimali` →
`quadro` → `sal` → `cronoprogramma` → `variante`. Servono prima un
`auth.users`, un `auth.uid()` pilotabile con
`set_config('request.jwt.claim.sub', ...)` e i ruoli `anon` /
`authenticated`, e quattro tabelle madri segnaposto (`gest_mestieri`,
`gest_clienti`, `gest_lavori`, `gest_preventivi`) — **dichiarate come tali**,
perché quello che conta sono le chiavi esterne del lato che referenzia, che
vengono dai file veri.

### ⚠️ IL CONTO DELLA GIORNATA
**Tre difetti trovati da Alessio guardando le foto dello schermo. Zero
trovati dai banchi.** I tre pulsanti con lo stesso nome, la scritta
incollata, lo zero rosso. Il quarto — la variante che non confrontava — l'ho
trovato leggendo lo schema del database, non provando il codice.
**Chiedere la foto dopo ogni consegna. Sempre.**

**LA PROSSIMA: l'analisi dei prezzi.** La decisione è già presa: **l'analisi
comanda il prezzo** (niente «usa questo prezzo» da premere). Serve un
`sql/gest-analisi-prezzi.sql` con la tabella delle righe, le due percentuali
sulla lavorazione (spese generali 13-17%, utile 10%) e la vista che fa il
conto; poi `gest_computo_voci_calc` prende il prezzo da lì con un
`coalesce`, **sempre con `create or replace` e le colonne nuove in fondo**.
⚠️ Il prezzo dell'analisi va chiuso a **2 decimali**, non a 4: è quello che
si stampa, e l'importo deve tornare con la calcolatrice.

---

## L'ANALISI DEI PREZZI — il database, fatto il 21 agosto sera

✅ **`sql/gest-analisi-prezzi.sql` eseguito su Supabase.** Manca solo la
schermata: il conto e le regole sono già tutti nel database.

**Cosa c'è adesso**
- `gest_analisi_righe` — le righe dell'analisi, attaccate alla LAVORAZIONE
  (`voce_id`, `on delete cascade`). `tipo` = materiale · manodopera · nolo ·
  altro, con un check che rifiuta tutto il resto.
- `gest_computo_voci.an_spese_perc` / `an_utile_perc` — vuote vuol dire le
  percentuali di legge, **15%** e **10%**, scritte nella vista e non nel
  codice.
- `gest_analisi_totali` — il conto: costi → spese generali → utile → prezzo.
- `gest_computo_voci_calc` — il prezzo **viene dall'analisi se c'è**, se no
  resta quello scritto a mano (`coalesce`). Nuova colonna in fondo:
  `prezzo_da_analisi`.

**⛔ LE REGOLE DA NON PERDERE**
1. **L'analisi è per UNA unità di misura.** Se la lavorazione è al metro
   quadro, l'analisi dice quanto costa un metro quadro. È l'errore più
   facile da fare, e su un documento di gara si vede subito perché il prezzo
   esce fuori scala di cento volte. **Va scritto sulla schermata**, non solo
   nel file SQL.
2. **L'utile è il 10% di (costi + spese generali)**, non dei soli costi. Su
   una gara pubblica è la differenza fra un documento accettato e uno
   contestato.
3. **Il prezzo si chiude a DUE decimali**, non a quattro: è quello che si
   stampa, e l'importo si calcola su quello. Se ne avesse quattro, il foglio
   non tornerebbe più con la calcolatrice.
4. **`gest_analisi_totali` elenca SOLO le lavorazioni che hanno davvero
   delle righe** (`join`, non `left join`). Con un `left join` ogni
   lavorazione entrerebbe con costi a zero e il prezzo scritto a mano
   verrebbe schiacciato a zero.
5. Il file **si ferma da solo** se `gest-variante-origine-vista.sql` non è
   stato eseguito, invece di togliere alla variante la colonna che le serve.

**Come è stato provato** — `banco-analisi.sql` su un **PostgreSQL 16 vero**
(schema ricostruito dai file di `sql/`, `pg_safeupdate` acceso, `auth.uid()`
pilotabile): **36 verdi**. `sabotaggi-analisi.sh`: **16 su 16 accusati**.
Provati anche: il caso che deve essere RIFIUTATO (tipo inventato, numeri
negativi, 150% di spese, riga attaccata a una lavorazione che non esiste),
la riga di un altro account (non la vede e non la scrive, nemmeno
firmandola col nome di Alessio), la cancellazione a cascata, e un `delete`
senza `where`.

⚠️ **DUE TRAPPOLE DEL BANCO, non del gestionale** (valgono per tutti i banchi
SQL futuri):
- **In SQL il vuoto non è falso.** Una prova che risponde `NULL` non è né
  verde né rossa: spariva dal conto. Un sabotaggio vero è rimasto verde per
  questo. Ogni esito va passato da `coalesce(cond,false)`.
- **Un banco che scrive mentre finge di essere un altro account** ha bisogno
  del permesso di scrivere sulla sua tabella dei risultati: senza, le prove
  della RLS — le più importanti — sparivano in silenzio.

**DA FARE DOMANI:** la schermata dell'analisi dentro la scheda della
lavorazione (sotto le misure), e poi il PDF «Analisi dei prezzi», che in una
gara si consegna.

---

## L'ANALISI DEI PREZZI — la schermata, fatta il 21 agosto notte

✅ **Online.** Dentro la scheda della lavorazione, colonna di destra, sotto
«Le misure»: **«Come è fatto il prezzo»**.

- in cima, grande: **serve solo se la lavorazione non sta nel prezzario**, e
  quello che scrivi è per **una unità** (cambia da solo con l'unità di misura
  della lavorazione: «un metro quadro», «un'ora», «una tonnellata»)
- righe raggruppate **Materiali · Manodopera · Noli e mezzi · Altro**, ognuna
  col suo totale
- in fondo **costi diretti → spese generali % → utile % → prezzo**, in blu
- le due percentuali si cambiano lì dentro e **si salvano da sole**
- la casella «Prezzo unitario» a sinistra **si spegne** e mostra il prezzo
  costruito, con sotto scritto perché
- ⚠️ `compVoceSalva` **non scrive `prezzo_unitario`** quando l'analisi
  comanda (`anAttiva`): se no il prezzo scritto a mano verrebbe schiacciato,
  e togliendo l'analisi ti ritroveresti come «prezzo tuo» l'ultimo numero
  calcolato da lei.

### ⛔ TRE DIFETTI DELLA SERA, TUTTI VISTI DA ALESSIO IN UNA FOTO

**1. «un metonnelitrolataro quintaleuadro».** Per scrivere «un metro quadro»
al posto di «m²» avevo messo una fila di `.replace()`. Quelli dopo il primo
mordevano DENTRO la parola già scritta: la «t» di «metro» diventava
«tonnellata», la «l» «litro», la «q» «quintale».
⛔ **Una fila di `.replace()` su una parola che i `.replace()` prima hanno
già scritto è sempre sbagliata. Ci vuole una tabella** (`AN_UNO`).

**2. L'unità si scriveva a mano.** Nella lavorazione l'unità è una tendina;
nell'analisi l'avevo fatta a testo libero — e il quadratino di «m²» sulla
tastiera non si sa fare (Alt+0178 col tastierino). Alessio ha scritto «m2».
⛔ **Due modi diversi per la stessa cosa nella stessa schermata sono un
difetto**, anche quando funzionano tutti e due. Adesso è una tendina con le
stesse unità + «— la scrivo io —» per sacco, viaggio, q.li.

**3. «Muratore» diventava «Disegnatore CAD».** Alessio ha scritto «Muratore»
nella Manodopera e sullo schermo si leggeva «Disegnatore CAD»: le righe
dell'analisi le scrive l'utente, ma non avevano la protezione `.cm-testo`.
Nel database era salvato giusto — mentiva solo lo schermo.
⛔ **OGNI testo scritto dall'utente che finisce a schermo va dentro
`.cm-testo`.** E ⚠️ **anche le domande di `gconfirm` passano dal
traduttore**: nella domanda prima di eliminare NON si mette il nome scritto
da lui («Tolgo questa riga dal prezzo?», non «Tolgo «Muratore»…»).

⚠️ «Manodopera» con la MAIUSCOLA non viene tradotta, «manodopera» minuscola
sì (diventa «tempo speso»). Nelle etichette va sempre maiuscola.

### Come è stata provata
`banco-analisi-schermo.js` — **43 verdi**: renderAnalisi e le sue sorelle
sono estratte verbatim dal file vero e girano in **Chromium col CSS vero**,
poi si LEGGE quello che c'è scritto sullo schermo. Compreso il caso «il
database non è stato aggiornato», il telefono a 390 px, e il giro dal
traduttore vero per lo studio tecnico.
`sabotaggi-analisi-schermo.js` — **17 su 17 accusati**.

**A fine giornata: 295 verdi · 65 sabotaggi, 65 accusati** (più 36 verdi e
16 sabotaggi sul PostgreSQL vero).

⚠️ **IL CONTO VERO DELLA GIORNATA: sei difetti trovati da Alessio guardando
le foto dello schermo. Zero dai banchi.** I banchi provano quello che gli
dici di provare; una foto mostra la schermata intera. **Chiedere la foto
dopo ogni consegna, sempre, e guardarla davvero.**

**DA FARE:** il **PDF dell'analisi dei prezzi**, che in una gara si
consegna. Poi le due righe della «Lista per la gara» (telefono e indirizzo).

---

## ⛔ SPEZZARE `gestionale-app.html` — LA REGOLA È CAMBIATA (21 agosto 2026, notte)

⚠️ **PIÙ SU IN QUESTO FILE, E NEI PROMPT VECCHI, C'È SCRITTO «non spezzare
gestionale-app.html in venti file, è no». QUELLA REGOLA NON VALE PIÙ.**
Deciso da Alessio la sera del 21 agosto, con questa motivazione, che è sua:

> «se serve, serve — meglio oggi che ci stiamo lavorando e nessuno lo ha già
> acquistato»

Il file è a **1,3 MB e 23.000 righe**. Ogni modifica va ragionata su tutto, e
ogni funzione nuova lo rende più grosso. Il rischio non è oggi: è il giorno che
qualcuno tocca una riga senza leggere i commenti sopra, e ne rompe un'altra a
diecimila righe di distanza. **Se si rompe adesso si rompe ad Alessio; fra sei
mesi si romperebbe a chi ha pagato.**

### COME SI FA

**⛔ NON venti file. Tre o quattro**, e solo pezzi che stanno in piedi da soli
(per esempio: tutti i PDF; tutti i conti del computo). Non è una novità:
`js/cestino.js` e `js/aiuti.js` fanno già così.

**⛔ SPEZZARE NON VUOL DIRE RISCRIVERE.** È un **taglio puro**: le funzioni si
spostano di file **senza cambiare un carattere dentro**. Se durante il taglio
si trova qualcosa da sistemare, si scrive e si fa **dopo, in un push a parte**.
Mescolare uno spostamento e una correzione vuol dire non sapere più quale delle
due ha rotto le cose.

**⛔ LA PROVA, e non se ne accettano altre al posto di questa:**
si **rimettono insieme i pezzi** nell'ordine di caricamento e si confronta col
file di partenza, **carattere per carattere**. Se la somma dei pezzi è identica
all'originale, il gestionale non *può* comportarsi diversamente: è una prova
che o è verde o è rossa, senza forse.
Sopra ci vanno comunque **tutti i banchi** (stessi numeri di prima) e la pagina
aperta in Chromium a 1440×900 e 390×844, zero errori JavaScript.

### ⚠️ LE COSE DA GUARDARE PRIMA DI TAGLIARE

- **L'ordine di caricamento.** I `<script src>` si eseguono in fila: chi usa
  una costante deve essere caricato dopo chi la dichiara.
- **Quello che parte da solo** appena il file è letto: `new MutationObserver`,
  `setTimeout(_iconizza,0)`, gli osservatori delle traduzioni. Devono partire
  ancora dopo le cose che usano.
- **`const` e `let` in cima al blocco.** Fra `<script>` classici lo spazio dei
  nomi è condiviso: un nome dichiarato due volte è un errore che spegne tutta
  la pagina.
- **Niente nomi doppi.** In un file solo due funzioni con lo stesso nome si
  sovrascrivono in silenzio; separandole l'errore diventa rumoroso, ed è meglio
  saperlo prima.

### PERCHÉ NON È UN LAVORO «DI PULIZIA»

Quando è stata aggiunta l'analisi dei prezzi (21 agosto) sono state controllate
quattro cose che con l'analisi non c'entravano niente: che `compVoceSalva` non
riscrivesse il prezzo, che il traduttore non riscrivesse «Muratore» (**non
controllata, e infatti il difetto è uscito**), che l'id `an-uni` non fosse già
usato, che la classe CSS nuova non si scontrasse. **In un file solo, ogni
modifica è una modifica a tutto.** Questo è il costo che si paga ogni volta.

---

## ✅ SPEZZATO `gestionale-app.html` (22 agosto 2026)

**Fatto.** Da **23.328 righe / 1,34 MB** a **14.992 righe / 884 KB**.
Fuori **8.365 righe**, il 36%, in **quattro file** dentro `js/`.

| File | Righe | Cosa c'è dentro |
|---|---|---|
| `js/gest-fatture.js` | 1.967 | i conti della fattura, la numerazione, l'elenco, il modulo, la nota di credito, il PDF, **l'XML per lo SDI** |
| `js/gest-computo.js` | 2.717 | computi e lavorazioni, le misure, il riepilogo, il quadro economico, `varConfronta`, **tutto il cronoprogramma**, la barra 1·2·3·4·5, il prezzario di voce, **l'analisi dei prezzi** |
| `js/gest-sal-prezzario.js` | 1.624 | i SAL (conti, elenco, scheda, PDF, dal SAL alla fattura), la sezione Prezzario, l'importazione da file, dal computo al preventivo |
| `js/gest-computo-pdf.js` | 2.057 | il prezzo in lettere, `computoPdf`, `computoListaGara`, `cronoPdf`, `variantePdf`, il quadro stampato, il computo che arriva in PDF, «prendi i prezzi dal prezzario», l'import delle lavorazioni |

I quattro tag stanno alle righe **502-505**, **prima** del blocco inline (riga 506).
⛔ **L'ordine conta:** l'ultima riga del blocco è `load()`, che accende il
gestionale. Quando parte, i quattro pezzi devono essere già caricati.

### ⛔ LA COSA PIÙ IMPORTANTE DA SAPERE: NON C'È PIÙ LA SCATOLA

Il blocco grosso era chiuso in `(function(){ … })();`. **Un file staccato non ci
può stare dentro**: il browser carica un file per volta, e i nomi dentro una
scatola non escono. Quelle due righe sono state tolte.

**Dentro le funzioni non è cambiato un carattere.** Ma adesso gli **860 nomi**
(547 funzioni + 313 fra costanti e variabili) sono visibili a tutta la pagina.
Prima di farlo sono stati contati, e tutti e sette i conti sono venuti zero:

1. nomi di funzione doppi fra i 547 → **nessuno**
2. nomi di costante/variabile doppi fra i 313 → **nessuno**
3. nomi che si scontrano col browser (`open`, `name`, `close`, `status`, `top`, `print`, `find`…) → **nessuno**
4. nomi che si scontrano con `cestino.js`, `foto-upload.js`, `ai-integrazione.js`, `fondatore.js`, `aiuti.js` → **nessuno** (quei cinque hanno la loro scatola)
5. `return` a metà del blocco → **nessuno**
6. `var` in cima → **nessuno**
7. punti dove il codice scrive `window.qualcosa` con lo stesso nome di una funzione di dentro → **nessuno**

⚠️ **DA QUI IN POI, OGNI FUNZIONE NUOVA HA UN NOME PUBBLICO.** Prima di
aggiungerne una, controllare che il nome non esista già — non solo nel
gestionale, ma anche negli altri `js/` caricati nella stessa pagina.

⚠️ **Quello che parte da solo** sta in due posti soli, ed è rimasto tutto nel
blocco inline: **in cima** (l'aggancio a Supabase, gli osservatori delle
traduzioni e delle icone, `setTimeout(_iconizza,0)`, `_deepTab`) e **in fondo**
(i clic del menù, la barra del telefono, i filtri, `load()`).
**Nei quattro pezzi non c'è niente che parte da solo:** solo funzioni,
costanti e tabelle già scritte. Per questo l'ordine di caricamento fra i
quattro pezzi non conta.

### COME SONO STATI PROVATI

⛔ **`prove/banco-identico.js` — 14 verdi.** La prova che aveva chiesto
Alessio, e nessun'altra al posto sua: rimette i quattro pezzi al loro posto
dentro il blocco rimasto, ci rimette la scatola, e confronta col file di ieri
**carattere per carattere**. `md5 8259cb3789d99e7d0ecd831a2b4d1b18` su tutti e
due. **1.314.637 caratteri identici.**
`prove/sabotaggi-identico.js` — **12 su 12 accusati**: una lettera cambiata,
uno spazio in più, una riga tolta, una riga in più, l'a capo finale tolto, un
tag `script` spostato **dopo** il blocco, un tag tolto, due pezzi scambiati,
l'html cambiato sopra e sotto, un accento rovinato.

**`prove/apri.js` — 18 verdi.** Il gestionale **vecchio** e il **nuovo**
aperti tutti e due in Chromium, a **1440×900** e a **390×844**, e confrontati:
zero errori JavaScript nuovi, nessun `ReferenceError`/`SyntaxError`/nome
dichiarato due volte, **tutte le 547 funzioni e le 313 costanti rispondono
all'appello**, nessun id doppio, stesso titolo, stesse 25 sezioni, stesse 24
voci di menù, e **premute tutte e 24 le voci** una per una: stesse identiche
lamentele del vecchio (2 contro 2, sono le chiamate a Supabase senza login).
`prove/sabotaggi-apri.js` — **8 su 8 accusati**, compreso «la scatola rimessa
attorno a un pezzo» (i nomi tornerebbero nascosti) e «un nome dichiarato due
volte».

**Totale dello spezzamento: 32 verdi · 20 sabotaggi, 20 accusati.**

⚠️ **I BANCHI DI IERI NON SONO STATI RIFATTI**, e va detto invece di lasciarlo
capire: il codice dentro i quattro pezzi è **identico byte per byte**, quindi
ributterebbero le stesse funzioni sugli stessi numeri. Quello che l'identità
**non** copre è la scatola tolta — ed è esattamente quello che copre
`apri.js`. ⚠️ **Ma `estrai.js` e `estrai-pdf.js` di domani devono cercare le
funzioni anche nei quattro file nuovi, non solo in `gestionale-app.html`:**
`cronoPdf`, `variantePdf`, `computoPdf`, `_cgBarraPerc`, `cronoScala`,
`varConfronta`, `renderAnalisi` **non stanno più nell'html**.

### ⚠️ UNO SBAGLIO MIO, DETTO PRIMA CHE LO TROVI LUI

Nel piano consegnato ad Alessio prima di tagliare c'era scritto **«582
funzioni e 342 costanti»**. Sbagliato: quel conto contava anche le parole
`function`, `const` e `let` scritte **dentro i commenti e dentro le stringhe**.
I numeri veri sono **547 e 313**. Non cambia niente del taglio (i conti degli
scontri sono stati rifatti sulla lista pulita e sono sempre zero), ma il numero
detto era gonfio.
⛔ **Regola: prima di contare i nomi in un file, si tolgono commenti e
stringhe.** `prove/nomi.js` lo fa.

### COSA NON È STATO FATTO, DI PROPOSITO

Niente correzioni per strada. Restano da fare, in un push a parte:
le due righe della **«Lista per la gara»** (`az.telefono` → `az.tel`,
`az.indirizzo` → `azIndirizzo(az)`), che adesso stanno in
`js/gest-computo-pdf.js`.

---

## ⛔ L'APICE INVERSO DENTRO IL CSS — il difetto del 18 agosto, trovato il 22

**Visto da Alessio in una foto della Console**, un minuto dopo il push dello
spezzamento. La scritta rossa era:

```
Uncaught (in promise) ReferenceError: riga is not defined
    at stili (ai-integrazione.js:703:52)
    at HTMLDocument.avvia (ai-integrazione.js:778:5)
```

⚠️ **NON c'entrava niente con lo spezzamento.** `js/ai-integrazione.js` è del
18 agosto, non è stato toccato e non era nel commit. Ma è comparsa lì, dopo
quel push, e per un minuto è sembrata colpa sua.

### Cos'era

`stili()` scrive tutto il CSS dell'AI dentro una **stringa a template**, fra
due apici inversi (righe 679 → 766). Il 18 agosto, per spiegare perché la
classe era stata rinominata, è stato scritto **dentro quel CSS** un commento
con i nomi delle classi fra apici inversi:

> QUESTA CLASSE SI CHIAMAVA \`.ai-riga\`, COME QUELLA …
> Rinominata in \`.ai-fila\`, che qui dentro è solo sua.

Per JavaScript **quel primo apice CHIUDE la stringa**. Da lì in poi il
commento non è più un commento: `.ai-riga` diventa `.ai` **meno** `riga`, e
`riga` non esiste. Colonna 52 della riga 703: esattamente il primo apice.

⛔ **E il file passava `node --check`**: non è un errore di sintassi, è un
errore che salta fuori solo **quando la funzione gira**.

### Cosa rompeva, dal 18 al 22 agosto

`stili()` moriva **prima** di `document.head.appendChild(s)`. Quindi:
**l'AI del gestionale era senza NESSUNO stile, e `caricaStato()` non partiva
mai** — niente contatore dei crediti. Su ogni iscritto, per quattro giorni.

### ⛔ LE REGOLE CHE NASCONO DA QUI

**1. Dentro una stringa a template non si scrive MAI un apice inverso, nemmeno
dentro un commento.** Un commento dentro un template non è un commento: è
testo, e l'apice è un carattere che chiude. Per citare un nome lì dentro si
usano le virgolette basse « ».

**2. Il banco deve fare il LOGIN.** `ai-integrazione.js` comincia con
`if(!getToken()) return;`. Il banco che apriva la pagina non era loggato,
quindi `stili()` **non partiva nemmeno**, e il difetto restava invisibile.
Adesso `prove/banco-ai-stili.js` mette un finto token in `localStorage`
(`sb-…-auth-token`) prima di caricare la pagina. **Senza login, di quel file
non si prova niente.**

**3. `Uncaught (in promise)` non passa da `pageerror`.** Il primo banco
scritto per questo difetto restava verde sulla riga «nessun errore» perché
raccoglieva solo `pageerror`. Va aggiunto un ascoltatore su
`unhandledrejection`. ⚠️ E il messaggio è `riga is not defined`: **non
contiene la parola `ReferenceError`**, quindi filtrare su quella parola non
basta.

### Come è stato provato
`prove/banco-ai-stili.js` — **7 verdi** sul file sistemato, **6 rosse** su
quello di ieri. Fa il login finto, apre la pagina in Chromium, e poi
**rilegge il foglio di stile installato**: ci deve essere `.ai-fila` (che
stava dopo il punto di rottura), l'ultima regola `.ai-help-foot`, e il pezzo
`@media(max-width:560px)` che sta in fondo a tutto. Se il CSS è troncato,
è rosso.
`prove/trappola-backtick.js` — passa al setaccio **tutti** i file js della
pagina cercando la stessa trappola: **è solo lì**. I quattro pezzi nuovi
sono puliti.
`prove/sabotaggi-rattoppi.js` — **8 su 8 accusati**.

---

## ⛔ «1 preventivo senza risposta — Fermi da più di una settimana» (22 agosto)

Sempre dalla stessa foto. Il **titolo** il singolare ce l'aveva (`nn()`), la
**riga sotto** no: era una stringa fissa al plurale.
⚠️ **Stessa famiglia di «le 1 righe rimaste uguali» del 21 agosto.**

⛔ **REGOLA: quando un titolo passa da `nn()`, la riga sotto deve passare
dallo stesso numero.** Un avviso che dice «1» in alto e «vanno» sotto si
contraddice da solo.

`prove/banco-plurale.js` — **12 verdi**, **4 rosse** sul file di prima.
Prende `nn()` e il blocco dell'avviso **verbatim dal file vero** e li fa
girare con 1, 2, 3 e 10: titolo e riga sotto devono essere sempre dello
stesso numero.

---

## ⛔ UN BANCO SEMPRE ROSSO NON PROVA NIENTE, COME UNO SEMPRE VERDE (22 agosto)

**Sbaglio mio, e va scritto.** La prima tornata di `sabotaggi-apri.js` è stata
**interrotta a metà** (troppo lenta, due minuti di tetto) mentre il quarto
sabotaggio era ancora in piedi: ha lasciato in giro un `gest-fatture.js` con
una parentesi in meno. La tornata dopo ha preso **quel file rotto** come punto
di partenza — e ha dichiarato «**8 su 8 accusati**» mentre il banco era rosso
comunque, con o senza sabotaggi. Quel numero, dato ad Alessio, non valeva
niente.

⛔ **REGOLA: prima di sabotare, il banco va fatto girare SENZA sabotaggi e
deve essere VERDE.** Se è già rosso, ci si ferma. La guardia è adesso in cima
a `sabotaggi-apri.js` e a `sabotaggi-rattoppi.js`.
⛔ **E chi sabota ripristina i file anche se viene ammazzato**: un tetto di
tempo troppo corto è un modo di sporcare i file di lavoro.

Rifatto da capo con la partenza pulita: `apri.js` **18 verdi**,
`sabotaggi-apri.js` **8 su 8**, questa volta per davvero.

**Il conto del secondo push del 22 agosto: 37 verdi · 16 sabotaggi, 16
accusati.**

⚠️ **E il conto vero della giornata, di nuovo: due difetti, tutti e due
trovati da Alessio in una foto dello schermo. Zero dai banchi.**

---

## ✅ L'ANALISI DEI PREZZI IN PDF (22 agosto 2026)

Il foglio che in una gara si consegna quando una lavorazione non sta nel
prezzario. ⛔ **Niente SQL:** il database è a posto dal 21 agosto.

**Dove si preme:** in fila con gli altri documenti del computo —
`✏ Apri il computo · 📄 Scarica il computo metrico · 🏛 Lista per la gara ·`
**`🧮 Scarica l'analisi dei prezzi`** `· → Crea il preventivo · ⧉ Duplica ·`
`± Crea la variante · 🗑 Elimina`

⚠️ **Il primo pulsante si chiamava «📄 Scarica il PDF» e basta.** Con
l'analisi di fianco sarebbero diventati due pulsanti che non dicono cosa
scaricano: è l'inciampo del 21 agosto (tre pulsanti «Scarica il PDF» sulla
stessa schermata), evitato prima e non dopo. Adesso dice **«Scarica il computo
metrico»**.

**Che documento è.** **Uno solo per tutto il computo**, non uno per
lavorazione: in gara l'«analisi dei nuovi prezzi» è un allegato unico. Dentro
solo le lavorazioni col prezzo costruito, e in cima c'è scritto quante sono e
quante no. Se non ne ha nessuna, **il PDF non esce**: esce il messaggio che
dice perché.

**Per ogni lavorazione:** numero e tariffa **gli stessi del computo metrico**,
la descrizione, l'unità e «l'analisi è per un metro quadro»; le righe
raggruppate Materiali · Manodopera · Noli e mezzi · Altro col totale di
gruppo; e in fondo costi diretti → spese generali % → utile % → **prezzo per
una unità**, col prezzo scritto in lettere. Firma dell'impresa sui privati,
due firme (Direttore dei Lavori + impresa) sui lavori pubblici.

### ⛔ LE REGOLE RISPETTATE (e perché)

1. **Il foglio non rifà nessun conto.** Legge `gest_analisi_totali`, la stessa
   vista che legge la schermata. Tre posti che guardano lo stesso numero, non
   tre che lo calcolano.
2. **`_compGruppi(voci,capitoli)`** mette le voci nell'ordine in cui le numera
   `computoPdf`: chi legge il foglio deve poter tornare al computo e ritrovare
   la riga. ⚠️ **Lo stesso raggruppamento è ancora scritto a mano dentro
   `computoPdf` e `computoListaGara`:** NON le ho toccate — spostare un pezzo
   di un documento che funziona nello stesso push in cui se ne aggiunge uno
   nuovo vuol dire non sapere più quale dei due ha rotto le cose. Il banco
   tiene le due copie **verbatim** e controlla che diano lo stesso ordine:
   se una delle tre cambia, diventa rosso. **L'unificazione va fatta in un
   push suo.**
3. **`AN_UNO`**, la tabella dello schermo, per «un metro quadro» / «un'ora»:
   mai una fila di `.replace()` (il «metonnelitrolataro» del 21 agosto).
4. **`_umPdf`**: sul foglio si scrive «mq» e «mc». jsPDF il quadratino non lo
   sa disegnare e **lo butta via in silenzio**.
5. **`useGrouping:true` su OGNI aiutante di numeri**, non solo sui totali.
6. **Le descrizioni non passano da nessuna traduzione**: «Muratore» sul foglio
   resta «Muratore» anche per uno studio tecnico. È contenuto dell'utente.

### ⛔ LA PROVA DEL NOVE — tre controlli, prima di disegnare qualsiasi cosa
1. le righe stampate fanno i **costi diretti**;
2. costi + spese generali + utile fanno il **prezzo**;
3. ⚠️ **il prezzo dell'analisi è lo stesso che il computo usa per quella
   lavorazione** (`gest_computo_voci_calc.prezzo_unitario`).

Il terzo è il motivo per cui questo foglio esiste: **in gara non si consegnano
due documenti che si contraddicono.** Se non torna, il PDF non esce. Soglia:
il **centesimo**, non lo zero esatto.
E se manca la colonna `prezzo_da_analisi` (SQL non eseguito) il foglio non
mente: dice cosa eseguire. Si guarda la **colonna**, non il valore.

### ⚠️ TRE DIFETTI VISTI GUARDANDO IL FOGLIO STAMPATO, NON IL CODICE
1. **«PREZZO PER UN METRO QUADRO» usciva dal riquadro blu** e finiva sopra il
   «diconsi euro». Su «UN PEZZO» no, perché è più corto: **il difetto si
   vedeva solo su certe unità di misura.** Adesso si misura quanto è largo il
   prezzo, si spezza l'etichetta in quante righe servono e **il riquadro
   cresce** — vale anche per le unità scritte a mano, lunghe quanto vuoi.
2. **«Costi diretti» era incollato alla tabella** e sembrava una riga della
   tabella senza bordi. Stesso difetto della scritta grigia attaccata ai
   pulsanti del 21 agosto.
3. ⛔ **Una pagina cominciava con «Costi diretti … PREZZO PER UN METRO
   QUADRO» e basta**, senza dire di quale lavorazione fosse. Adesso una
   lavorazione **non si spezza se ci sta intera** (si misura prima quanto è
   alto tutto il blocco), e quando è troppo lunga in cima alla pagina dopo
   c'è **«N. 4 · Tariffa NP.02 — segue»**.

### COME È STATO PROVATO
- **`banco-analisi-pdf.js` — 93 verdi.** `analisiPdf` presa **verbatim** dal
  file vero con `estrai.js`, fatta girare con **jsPDF 2.5.1** su un finto
  Supabase, e il PDF **riletto con `pdftotext`**.
  ⚠️ **Le colonne del finto database vengono dai file di `sql/`** (`colonne.js`
  le legge dal `create view` e dal `create table`), non dalla mia memoria: è
  la lezione del 21 agosto, quando una colonna di troppo nascose il difetto
  più grave della giornata.
  ⚠️ **E il banco legge i RETTANGOLI dentro il flusso del PDF**, non solo il
  testo: una scritta che esce da un riquadro nel testo non si vede. È la
  lezione delle barre del cronoprogramma. Attenzione al verso: jsPDF scrive
  `x  (297-y)  w  -h re`, con l'altezza **negativa** — il bordo di sopra è
  297 meno il numero che si legge, non 297 meno numero meno altezza.
- **`banco-analisi-casi.js` — 47 verdi.** I dodici casi in cui il foglio NON
  deve uscire, il singolare, i lavori pubblici, il foglio che si spezza col
  «segue», l'unità scritta a mano lunga, e i messaggi passati dal traduttore
  vero (`_swapPratiche` estratto dal file vero).
- **`apri.js` — 18 verdi**, la pagina aperta in Chromium a 1440×900 e 390×844.
- **`sabotaggi-analisi-pdf.js` — 22 su 22 accusati.**

**Totale: 158 verdi · 22 sabotaggi, 22 accusati.**

⛔ **UNA REGOLA NUOVA SUI SABOTAGGI: L'ANCORA DEVE ESSERE UNICA.**
`doc.text("Pag. "+p+" di "+np,R,290,…)` è scritta identica anche dentro
`variantePdf`: `replace()` ha cambiato **quella**, il foglio dell'analisi è
rimasto intatto, e il sabotaggio risultava «non accusato» pur non avendo
sabotato niente. Lo stesso è successo con `if(senzaCap.length)gruppi.push(…)`,
che sta sia in `_compGruppi` sia in `computoPdf` — lì il sabotaggio risultava
«accusato» per il motivo sbagliato. Adesso `uno()` **si ferma** se l'ancora
compare più di una volta.

### ⚠️ E UN QUARTO DIFETTO, VISTO NELLA FOTO DEL 22 AGOSTO

Nella lista delle lavorazioni si leggeva, una sotto l'altra:

> `A.01.002` · demolizione di tramezzi in laterizio — **20,46 m²** × 18,50 €
> `A03.01.009.a` · Demolizione di muratura… — **174,06 mq** × 20,01 €

**Due modi di scrivere la stessa unità nella stessa lista.** La prima l'ha
scelta dalla tendina, la seconda è arrivata da un prezzario importato.

⛔ **Per il PDF dell'analisi era un difetto vero:** `AN_UNO` ha le chiavi
della tendina (`m²`, `m³`, `cad`…). Su una lavorazione con unità `mq` non
trovava niente e il foglio avrebbe scritto **«l'analisi è per una unità di
mq»** e **«PREZZO PER UNA UNITÀ DI MQ»** invece di «un metro quadro». Su un
documento di gara sembra un errore del programma.

**Risolto in `_anPdfUno`:** prima si prova la chiave così com'è, poi si passa
da **`_uniPiatta`** — la stessa funzione che usa l'importazione del prezzario
per capire se due unità sono la stessa cosa — e si torna alla chiave della
tendina (`AN_PIATTA`). Coperte: `mq · mc · ml · pz · n. · nr · pezzo`.
⛔ **Una tabella, non una fila di `.replace()`.**

⚠️ **RESTA DA FARE, ed è un difetto suo:** *a schermo* le due unità si
leggono ancora diverse («m²» e «mq») nella stessa lista. Il foglio stampato
adesso è coerente, la schermata no. È la regola del 21 agosto — «due modi
diversi per la stessa cosa nella stessa schermata sono un difetto». Messo in
lista come n. 26.

**Totale del PDF dell'analisi, a fine giornata: 165 verdi · 24 sabotaggi, 24
accusati.**

---

## ⛔ IL CENTESIMO CHE NON TORNAVA (22 agosto 2026) — «si somma quello che si stampa»

**Trovato facendo la somma a mano sul PRIMO foglio vero stampato da Alessio**,
non nel codice. Riprodotto poi su un PostgreSQL 16 vero coi suoi tre numeri:

```
COM'ERA:   costi 25,7900   spese 3,8685   utile 2,9659   prezzo 32,6200
stampati:  25,79 + 3,87 + 2,97 = 32,63    ma nel riquadro: 32,62
```

E non era solo lì: anche i totali dei tre gruppi (8,93 + 14,63 + 2,24 =
25,80) non facevano i costi diretti (25,79). **Due centesimi in due punti
diversi, sullo stesso foglio di gara.**

⛔ **LA REGOLA: SI SOMMA QUELLO CHE SI STAMPA.** Ogni numero si chiude a DUE
decimali *prima* di entrare nella somma dopo:
`importo di riga → totale del gruppo → costi diretti → spese → utile → prezzo`,
e il prezzo è la somma dei tre numeri stampati, **senza nessun round finale**.
È la stessa scelta della quantità a tre decimali (19 agosto) e del prezzo a
due (21 agosto), portata fino in fondo.

✅ **`sql/gest-analisi-arrotondamento.sql`** — da eseguire su Supabase.
Riscrive `gest_analisi_totali` (stessi nomi, stesso ordine, stessi tipi:
`create or replace` non tocca le viste attaccate) e aggiunge
**`gest_analisi_righe_calc`**, che espone l'importo di riga già chiuso a due
decimali.

⛔ **L'IMPORTO DI RIGA ADESSO LO DÀ IL DATABASE.** Schermata e PDF se lo
calcolavano da soli: due copie della stessa formula, per giunta in virgola
mobile, dove `0,35 × 8,50` vale 2,9749999999999996 e diventa **2,97** mentre
il conto esatto fa **2,98**. Adesso lo leggono. Anche i totali dei quattro
gruppi si leggono da `gest_analisi_totali` invece di rifarli.

⚠️ **E il banco non deve rifare quella formula.** Il finto database del banco
arrotonda **come `numeric`**, con gli interi (`importoRiga` in
`prove/dati-veri.js`): se usasse i float non vedrebbe mai la differenza fra
«sommo i numeri lunghi» e «sommo quelli stampati», cioè proprio il difetto.

### ⚠️ E UN ERRORE MIO, TROVATO DAL BANCO POCHE ORE DOPO AVER SCRITTO LA REGOLA

Avevo dichiarato **`AN_COL` in due file** (`gest-computo.js` e
`gest-computo-pdf.js`). Da quando la scatola non c'è più i nomi in cima ai
file sono **pubblici**: risultato `Identifier 'AN_COL' has already been
declared`, e con lui morivano **tutti i PDF del computo**.
L'ha visto `apri.js`. ⛔ Adesso c'è **`prove/nomi-doppi.js`**: in un secondo
confronta gli 866 nomi dei cinque file e si fa girare **prima** di aprire il
browser. **La regola scritta la mattina non basta: ci vuole il banco.**

### COME È STATO PROVATO
- **`banco-analisi-sql.sql` — 16 verdi su un PostgreSQL 16 vero** (installato
  nel contenitore, schema minimo con `gest_computo_voci` e
  `gest_analisi_righe`). Fra le prove: `0,35 × 8,50 = 2,98`, i tre numeri
  stampati fanno il prezzo su tutte le analisi, l'utile è il 10% di
  (costi+spese), la lavorazione senza righe non compare, le colonne restano
  13 e l'importo è in fondo.
  **`sabotaggi-analisi-sql.sh` — 9 su 9 accusati**, compreso «rimetti la
  vista di ieri».
- `banco-analisi-pdf.js` **106 verdi** (con le due prove nuove: «il foglio
  torna con la calcolatrice» e «le righe fanno il totale del gruppo», lette
  dal foglio stampato) · `banco-analisi-casi.js` **59** ·
  `apri.js` **18** · `nomi-doppi.js` **2**.
  `sabotaggi-analisi-pdf.js` **28 su 28** · `sabotaggi-apri.js` **8 su 8**.

**Totale della giornata sull'analisi: 201 verdi · 45 sabotaggi, 45 accusati.**

⚠️ **UN SABOTAGGIO L'HO TOLTO INVECE DI DICHIARARLO.** «Solo le spese
generali a quattro decimali» non produce mai un foglio sbagliato: provato su
tutti i costi da 0,01 a 4.000,00 € con le percentuali di legge, la somma dei
numeri stampati fa sempre il prezzo. Il centesimo nasceva dall'**utile** e
dalle **righe**, non dalle spese generali.
⛔ Un sabotaggio che non può rompere niente non è una prova: è un numero
gonfiato. Si toglie e si scrive perché.

---

## ✅ LE DUE RIGHE DELLA «LISTA PER LA GARA» (22 agosto 2026) — e una terza

**n. 21 e 22 della lista, chiuse.** Nell'intestazione di `computoListaGara`:

- ⛔ **`az.telefono` NON ESISTE**: nella tabella `gest_azienda` la colonna si
  chiama **`az.tel`**. Il numero non veniva stampato **mai**, e non usciva
  nessun errore: usciva un **vuoto**. L'impresa consegnava alla stazione
  appaltante un documento senza il proprio telefono.
- ⛔ **`az.indirizzo` è la SOLA VIA**: CAP, città e provincia stanno in
  colonne loro. Ci vuole **`azIndirizzo(az)`**, la stessa che usano gli altri
  quattro fogli.

Negli altri PDF era già giusto: sbagliava solo lì.

⚠️ **LA PROVA CHE CONTA:** l'intestazione della Lista è adesso **identica**,
carattere per carattere, a quella dell'Analisi dei prezzi. Sono due fogli che
l'impresa consegna **insieme**: non possono avere due intestazioni diverse.
`prove/banco-lista-gara.js` le confronta.

### ⛔ E LA TERZA VOLTA DEL PUNTO DELLE MIGLIAIA

Guardando il foglio stampato: nella colonna TOTALE si leggeva **«1140,77»** e
due righe sotto **«12.639,88»**.

⚠️ **Intl in italiano mette il punto da solo SOLO dai cinque numeri in su**:
il difetto si vede **unicamente sui numeri di quattro cifre**. È per questo
che è sopravvissuto al **19 agosto** (quadro economico) e al **21**
(variante) — quelle volte i numeri sbagliati erano di cinque cifre.

Mancava in **quattro punti**: `_d2` e `_q3` di `computoListaGara` e gli stessi
due di **`computoPdf`** (lì un totale di 3.482,94 usciva «3482,94»).
Sistemati tutti e quattro.

⛔ **`prove/banco-migliaia.js`** — conta i **17** formattatori di numeri di
tutti e cinque i file e diventa rosso se a uno manca `useGrouping`. Le
percentuali (`_pc`, `_pct`, `_perc`) sono l'unica eccezione, dichiarata per
nome: 15,00 % non vuole il punto e non arriva mai a mille.
**Una regola scritta in CLAUDE.md non basta: ci vuole il banco.** È la
seconda volta oggi che lo imparo (l'altra era `AN_COL` dichiarata due volte).

### Come è stato provato
`banco-lista-gara.js` **20 verdi** — il telefono, l'indirizzo intero,
l'intestazione confrontata con l'altro foglio, l'azienda che ha solo la via
(niente virgola appesa), l'azienda senza telefono (niente «Tel» a vuoto), e
nessun numero di quattro cifre senza il punto.
`sabotaggi-lista-gara.js` **7 su 7 accusati**, compresi i due difetti veri
rimessi al loro posto.

**A fine giornata: 207 verdi · 52 sabotaggi, 52 accusati** (di cui 16 verdi e
9 sabotaggi su un PostgreSQL 16 vero).

---

## ⛔ UN SUGGERIMENTO SENZA «Es.» SEMBRA UNA CASELLA GIÀ COMPILATA (22 agosto 2026)

Nei **Dati azienda**, sotto «Dove sei», le caselle dicevano:

| casella | suggerimento | com'era |
|---|---|---|
| Via e numero | «**Es.** Via Dante Alighieri, 5» | ✅ si capiva |
| CAP | «02100» | ⛔ sembrava scritto |
| Città | «Rieti» | ⛔ sembrava scritto |
| Provincia | «RI» | ⛔ sembrava scritto |

**Conseguenza:** quelle tre caselle sono rimaste **vuote per mesi**, e
`azIndirizzo(az)` stampava la sola via su **OGNI** PDF — preventivi, fatture,
computo metrico, SAL, lista per la gara, analisi dei prezzi.

⚠️ **E la coincidenza peggiora tutto: l'esempio era l'indirizzo VERO di
Alessio.** La schermata sembrava piena anche a lui. Trovato il 22 agosto
guardando una sua foto, mentre cercavamo perché l'indirizzo usciva corto —
non era il codice, era una casella vuota che sembrava piena.

⛔ **REGOLA: un `placeholder` che potrebbe essere scambiato per un valore va
scritto «Es. …».** Vale doppio quando l'esempio è verosimile: un CAP, una
città, una targa, un codice fiscale.

✅ Sistemato: «Es. 02100», «Es. Rieti», «Es. RI».
`prove/banco-suggerimenti.js` — **9 verdi**: prende il blocco «Dove sei» dal
file vero e controlla che tutte e quattro le caselle comincino con «Es. ».

⚠️ **RESTA DA GUARDARE:** nel gestionale ci sono **118 suggerimenti**, e ~51
non cominciano con «Es.». Il banco li elenca senza far diventare rosso niente
(guarda solo i Dati azienda). Il più sospetto è il codice fiscale del cliente:
**«RSSMRA80A01H501U»**, che sembra un dato vero identico a quelli veri.
Messo in lista come n. 27.

---

## ✅ IL TRADUTTORE DENTRO LE FINESTRE DELL'AI (n. 23 — 22 agosto 2026)

**Erano DUE cose sbagliate, non una**, e la seconda non l'avevo vista:

1. ⛔ **Le finestre dell'AI si attaccano a `document.body`**, cioè fuori da
   `#appview` e `#sheet`: l'osservatore delle traduzioni non le ha mai viste.
2. ⛔ **E anche se le avesse viste non sarebbe cambiato niente:** nessuna di
   quelle frasi era in **`_FRASI`**. `_swapPratiche` le lasciava intatte tutte
   e cinque. Provato prima di scrivere una riga di codice — ed è per questo
   che la diagnosi di stamattina («il traduttore non ci arriva») era **metà**.

### Come è stato risolto
- **Cinque frasi nuove in `_FRASI`** (le parole restano in un posto solo).
  ⛔ **DALLE PIÙ LUNGHE ALLE PIÙ CORTE:** l'elenco si applica in ordine e
  «Descrivi il lavoro» è l'inizio di «Descrivi il lavoro come lo racconteresti
  al cliente». Se stesse prima, la lunga non scatterebbe mai e uscirebbe
  «Descrivi **la pratica** come **lo** racconteresti».
- **`_traduciDentro(root)`** — il walker, staccato da `localizzaPratiche()`,
  che continua a chiamarlo sui suoi due contenitori.
- **`window.gestTraduci(elemento)`** — il ponte per chi vive fuori dal blocco.
  Non fa niente se non è uno studio tecnico.
- **`js/ai-integrazione.js`**: dopo ognuno dei **quattro**
  `document.body.appendChild(ov)`, `if(window.gestTraduci)window.gestTraduci(ov)`.

⛔ **Perché non ho allargato l'osservatore a tutta la pagina:** si
risveglierebbe a ogni respiro del DOM. Chi crea una finestra sua la fa
tradurre quando l'ha attaccata: una riga, e nessun costo continuo.

### Come è stato provato
`prove/banco-ai-parole.js` — **28 verdi**. Il traduttore e il ponte sono presi
**verbatim dal file vero** (`estrai.js` sa estrarre anche un
`window.nome=function(){…}`), e la traduzione gira **in Chromium** su una
finestra finta: titolo, testo, `placeholder`, `title`.
Fra le prove: l'ordine delle frasi lunghe/corte, quello che **non** si deve
toccare (le domande sui clienti, le fatture, l'esempio col condominio), e
**per un'impresa edile non cambia niente**.
`prove/sabotaggi-ai-parole.js` — **8 su 8 accusati**.

⚠️ **UN LIMITE DICHIARATO, non una prova verde:** il `placeholder` di una
**textarea** non viene tradotto, perché `textarea` sta in `_SKIP_UTENTE` (che
serve a proteggere quello che l'utente scrive DENTRO). Ma il suggerimento
grigio l'abbiamo scritto noi: dentro un preventivo, a un geometra, l'AI
suggerisce ancora «Giovedì prossimo taglio siepe da Le Betulle».
⛔ Non si scrive «provata» una cosa che il banco non accusa: **n. 28 in
lista**, e va fatto in un push suo perché tocca tutto il gestionale.

---

## ✅ LA FINESTRA DELL'AI PIÙ GRANDE (22 agosto 2026)

Da **720 px** a **1400 px**, deciso da Alessio guardandola: su un monitor da
1920 era un francobollo in mezzo allo schermo.

Cresce **una riga sola** in `js/ai-integrazione.js`, e crescono insieme tutte
e quattro le finestre (Aiuto, Genera con AI, compila il modulo).
⛔ `.ai-box--sm` (440 px) viene DOPO e resta piccola: è la finestrella dei
messaggi corti, che larga non avrebbe senso.

### ⚠️ E UNA COSA TROVATA MISURANDO, NON LEGGENDO IL CSS
`max-width:1400px` **non** dava una finestra da 1400: senza
`box-sizing:border-box` quel numero è il **contenuto**, e col bordo interno
(28+28) la finestra usciva **1456**. La misura scritta non era quella vera.
Aggiunto `box-sizing:border-box`.

### Come è stato provato
`prove/banco-ai-finestra.js` — **9 verdi**. Apre la finestra in Chromium e la
**misura** a 1920×1080, 1440×900, 1000×800 e 390×844: la larghezza vera, che
stia dentro lo schermo, e che la finestrella piccola resti piccola.
`prove/sabotaggi-ai-finestra.js` — **5 su 5 accusati**.

⚠️ **Un sabotaggio l'ho cambiato invece di dichiararlo:** «larghezza in px
fissi» non rompe niente, perché `.ai-ov` è un flex e la finestra si stringe
lo stesso (`flex-shrink` vale 1 di suo). Al suo posto c'è quello che rompe
davvero: `flex-shrink:0`.


# 21 agosto 2026 — L'ERRORE ROSSO SULLA HOMEPAGE: LO METTEVA NETLIFY

Sulla console di `trovaimpresa.com`, per chiunque aprisse la pagina principale:

    Uncaught SyntaxError: Identifier 'PAGINE_REGISTRAZIONE'
    has already been declared   (assistente-trovaimpresa.js)

## ⛔ PRIMA GUARDARE, POI DIRE

Nella cartella il tag c'era **una volta sola**, e la costante pure. Ho aperto la
homepage locale in Chromium: **zero errori**. Poi ho fatto la prova al
contrario — un secondo `script` dello stesso file — ed è uscito **esattamente**
quel messaggio. Da lì la diagnosi non era più un'ipotesi: **online quel file
gira due volte**.

Il sorgente vero (`Ctrl+U`, `Ctrl+F`, «1/2») lo ha confermato: **riga 1584**
quello scritto a mano, **riga 1587** uno **appiccicato alla chiusura del body,
sulla stessa riga**.

## CHI LO METTEVA

**Netlify.** Lo «snippet injection» del pannello, che infila un pezzo di codice
in fondo a **tutte** le pagine — così l'assistente compare ovunque senza toccare
237 file. Sulla home il tag c'era già scritto a mano: due volte, e la pagina si
ferma.

⚠️ **Non è in nessun file della cartella, e non è in `netlify.toml`.** Ho
controllato anche l'edge function `geo.js`: non tocca l'HTML. Se un domani
l'assistente sparisce da tutto il sito, il posto da guardare è il **pannello**.

## LA CORREZIONE

**Una riga tolta da `index.html`**, sostituita da un commento che spiega perché
lì non c'è niente. Il file `js/assistente-trovaimpresa.js` non è stato toccato.

## ⛔ LA TRAPPOLA DENTRO IL MIO STESSO COMMENTO

La prima versione del commento conteneva la **chiusura del body** scritta per
esteso, per spiegare dove Netlify infila il suo pezzo. Il banco è diventato
rosso: Netlify (e il banco) infilano prima della **PRIMA** chiusura che
trovano, e con quel commento la prima era **dentro il commento**. Risultato:
l'iniezione finiva commentata e **l'assistente spariva dalla home**.

⛔ **In un commento non si scrivono tag veri.** Vale per la chiusura del body e
per quella di uno script. Adesso è una prova del banco, non solo una frase qui:
la chiusura del body deve comparire **una volta sola** in tutta la pagina, e
nessun commento deve contenere un tag script.

⚠️ È la stessa famiglia dell'errore del 18 agosto (i backtick dentro un commento
dentro un template CSS): **un commento non è un posto neutro.**

## IL BANCO

`prove/banco-homepage.js` — rifà la pagina **come la serve Netlify**, cioè con
l'iniezione, e la apre davvero in Chromium a **1440x900** e **390x844**:
nessun errore, lo script arriva **una volta sola**, la bolla dell'assistente
c'è, la guardia `__assistenteTI` è accesa. Più il caso «e se Netlify non
iniettasse più niente».

**12 verdi su 12.** `prove/sabotaggi-homepage.js` — **4 su 4 accusati**:
il tag rimesso a mano, la chiusura del body dentro il commento, un tag script
dentro il commento, il commento lasciato aperto.


## ⚠️ `prove-claude/` E' IN .gitignore — non metterlo nei blocchi git

Nel blocco del 21 agosto ci avevo messo `prove-claude/LAVORI-DA-FARE.md`, e git
ha risposto «The following paths are ignored by one of your .gitignore files».
Il push e' andato lo stesso (index.html e CLAUDE.md), ma la riga era inutile.

**La lista dei lavori vive solo sul computer di Alessio, ed e' giusto cosi'.**
Nei blocchi git ci vanno solo i file che stanno davvero nel repo.


# 21 agosto 2026 (2) — LE STRISCE DELLE SEZIONI DIVENTANO NEUTRE

Alessio, dopo avermi mandato cinque schermate (Riepilogo, Pratiche, Preventivi,
Fatture, Computo metrico): *«questo e' il riepilogo pulito neutro»*, e poi
*«le voglio come il riepilogo, fai tu»*.

Il 20 agosto il **Riepilogo** era diventato neutro. Le **19 pagine** che si
aprono dal menu di sinistra erano rimaste indietro: barretta arancione sulle
Pratiche e sui Computi, **cinque barrette di quattro colori diversi in fila**
sulle Fatture, arancione sui due riquadri dei Preventivi.

## LA REGOLA — la stessa del Riepilogo

⛔ **IL COLORE STA SOLO DOVE C'E' ANCHE LA PAROLA.**

- **restano colorati**: la pastiglia di stato («Bozza», «Accettato», «Pagata»)
  e il pallino che le sta accanto — li' il colore accompagna un testo, e chi
  non distingue rosso e verde legge comunque;
- **diventano neutri**: le barrette a sinistra e i numeri grandi.

## COSA HO TOCCATO — solo `css/gestionale.css`, sei punti

1. `.wrap section .card.t-*` — barretta, numero ed etichetta
2. `.wrap section .job:has(.pall.*)` — le schede dei Lavori
3. `#fatture .fatt-tot.t-*` — i cinque riquadri delle Fatture, barretta e numero
4. `.wrap section .job.t-*` — le schede di preventivi, computi, fatture
5. `.num-c--err` / `.num-c--attesa` — i riquadri di Preventivi, Computi, Scadenzario
6. `.num-c--err .num-n` — il numero dentro

⚠️ **Le classi `t-*` non si tolgono**: le usa il resto del gestionale. Qui
semplicemente non colorano piu'. E la barretta **resta larga 5px**: e' stata
scolorita, non cancellata — se un giorno serve un colore, il posto c'e'.

⚠️ `css/gestionale.css` lo carica anche `ricarica-crediti.html`, che pero' non
usa nessuna di queste classi: controllato, li' non cambia niente.

## ⚠️ COSA HO LASCIATO FUORI, ED E' UNA SCELTA

- `.ai-str--pochi` — la striscia dell'AI in cima alla home del gestionale
- `.ctr-str--rosso` / `--arancio` — la striscia dei controlli sulla scheda:
  ha sfondo e testo suoi, e' un avviso, non una decorazione
- `.lav-media .lsc-r.rit` e `#fornitori .ff-r.rit` — le righe rosse «in
  ritardo» dentro Lavori e Fornitori

Non erano nelle schermate che mi ha mandato. **Se le vuole neutre anche
quelle, e' un secondo giro** — e va detto invece di farlo di nascosto.

## IL BANCO

`prove/banco-strisce.js` — apre in Chromium una pagina fatta col **CSS vero**
e **misura il colore che il browser calcola**, non legge il file.

⛔ **Due domande, non una**: (1) le barrette e i numeri sono neutri? (2) il
colore che DEVE restare — pastiglia e pallino — e' ancora li'? Un banco che
guardasse solo la prima direbbe «verde» anche dopo aver spento tutto.

**31 verdi su 31.** `prove/sabotaggi-strisce.js` — **9 su 9 accusati**: i
sette che rimettono il colore dov'era, e i **due che spengono la pastiglia e
il pallino** — quelli servono a dimostrare che la terza parte del banco non
e' una formalita'.


## 21 agosto 2026 (3) — ANCHE LA PAGINA INIZIALE DEL GESTIONALE

*«sistema anche la pagina iniziale del gestionale»*.

Le card dei reparti (giardiniere, pulizia, progetto casa, elettricista) avevano
una **riga colorata in cima**, scritta a mano dentro l'HTML:

    style="border-top:4px solid ${p.a}"

Quattro reparti = quattro righe di quattro colori diversi. E il colore del
reparto **lo diceva gia' l'icona**, due centimetri sotto.

⛔ **Tolta la riga, tenuta l'icona.** Il colore del reparto non si perde:
resta sull'icona e sul pallino accanto al nome quando entri dentro — dove
`enterPanel` gia' scriveva, dal 20 agosto, *«il colore del reparto resta solo
come pallino accanto al nome»*. La landing era rimasta indietro.

⚠️ **La striscia dell'AI («249 crediti da usare») NON e' stata toccata**, ed
e' una scelta: quando i crediti stanno finendo diventa arancione **e scrive
«— stanno finendo»**. Colore e parola insieme: rispetta gia' la regola.

## IL BANCO

`prove/banco-landing.js` — **estrae `_landingDisegna` verbatim** da
gestionale-app.html e la fa girare per davvero in Chromium col CSS vero, su
quattro reparti finti. Misura il bordo calcolato, non legge il file.
**19 verdi su 19.**

`prove/sabotaggi-landing.js` — **5 su 5 accusati**.

## ⛔ UN SABOTAGGIO NON ACCUSATO — ed era colpa dei DATI, non del banco

«conto i lavori sbagliati: da fare diventa il totale» **non veniva accusato**.
Non perche' il banco fosse cieco: perche' i miei lavori di prova erano
**tutti «da_fare»**, e allora «3 da fare» e «3 totali» danno lo stesso numero
qualunque cosa si scriva.

⛔ **Un dato di prova tutto uguale non prova niente.** Aggiunto un lavoro
«fatto»: adesso il giardiniere dice «3 da fare · 4 pratiche totali», i due
numeri sono diversi, e il sabotaggio viene accusato.


## ⚠️ 21 agosto 2026 — LA BARRETTA CHE AVEVO TOLTO SENZA ACCORGERMENE

Alessio, guardando la pagina iniziale sistemata: *«pero' hai tolto il bordo
laterale sinistro piu' scuro»*. Aveva ragione.

Togliendo la riga colorata in cima alle card dei reparti, quelle card sono
rimaste con **quattro lati uguali**, tutti grigio chiaro. Le schede del
Riepilogo invece la barretta ce l'hanno: `.rie-card` ha
`border-left:5px solid var(--bordo-forte)`, ed e' **grigia ma piu' scura**
degli altri bordi.

⛔ **«Neutro» non vuol dire «senza».** Il 20 agosto la barretta del Riepilogo
e' stata **scolorita, non cancellata**: resta larga 5px e piu' scura, ed e' il
segno che tiene insieme tutte le schede del gestionale. Sulla landing l'avevo
fatta sparire del tutto, e la card non somigliava piu' a niente.

Rimessa: `.panel-card{border-left:5px solid var(--bordo-forte)}`.

Il banco adesso lo controlla su tutte e quattro le card: larghezza **5px**,
colore **--bordo-forte**, e **piu' scura del bordo sopra**. Due sabotaggi
nuovi — «tolgo la barretta» e «la faccio chiara come gli altri bordi» —
**accusati tutti e due**.

**banco-landing: 31 verdi su 31 · sabotaggi-landing: 7 su 7 accusati.**


# 21 agosto 2026 (4) — LA FINESTRA «NUOVO REPARTO»

Alessio: *«miglioriamo questo reparto e troppo sempliciotto, anche le emoji
sono orribili, aggiungiamo piu opzioni»*. E poi, rimandandomi la foto delle
card a colori: *«queste per esempio mi piacciono»*.

## ⛔ AVEVO CAPITO MALE, E ME L'HA CORRETTO LUI

Credevo volesse **altre** emoji. Voleva **le emoji**. Nel gestionale non le
vede mai: `_iconizza` le sostituisce TUTTE con un disegnino grigio a tratto.
Nella tendina del reparto vedeva quattordici tratti grigi tutti uguali.

## LA REGOLA NUOVA: `.no-ico`

`_ICO_SKIP` adesso contiene anche `.no-ico`. Dove c'e' quella classe,
**l'emoji resta emoji**. Sono due posti soli, e sono i due dove l'icona e'
una **scelta dell'utente**: la tendina e la card che ne esce.

⛔ **Nel resto del gestionale non cambia niente**: menu, pulsanti e schede
tengono i disegnini grigi, e il banco lo controlla (se sparissero anche
fuori, sarebbe rosso).

## COSA C'E' DENTRO ADESSO

- **53 icone** (erano 14), in **sei gruppi col nome sopra**: Muratura e
  struttura · Impianti · Finiture · Esterni e verde · Studio tecnico ·
  Generiche
- **12 colori** (erano 8)
- **l'anteprima**: la card si vede **mentre** scegli, ed e' la stessa che
  disegna la pagina iniziale (stesse classi, stesso CSS)
- i bottoni delle icone da 42 a **46 px**, emoji a **23 px**: sotto i 22
  certe emoji diventano una macchia

## ⛔ LE DUE COSE CHE NON SI POSSONO FARE, E PERCHE'

1. **Non si toglie un'icona dalla lista.** I reparti gia' creati tengono la
   loro emoji dentro `gest_mestieri.icona`: se sparisce di li', quella card
   resta senza niente. Nella prima stesura avevo perso **🏠**, che il
   reparto «progetto casa» usa. L'ha trovato il banco.
2. **Non si toccano i primi 8 colori.** `a` e' la chiave con cui i reparti
   si ritrovano la palette (`COLORI.find(c=>c.a===m.colore)`). Cambiarne uno
   li scollega e l'icona finisce scura su scuro.
   ⚠️ Quindi i **quattro blu quasi uguali restano**, e restano anche i due
   incoerenti (pallino blu, sfondo verde). Sistemarli vuol dire prima
   spostare i dati nel database: e' un lavoro suo, non un ritocco.
   I quattro aggiunti in fondo (verde, rosso mattone, verde-acqua, indaco)
   hanno le tre tinte coerenti, come dev'essere.

⛔ **Le emoji si scrivono col selettore di variante** (🏗️ ⛏️ ❄️ ☀️ 🖌️ 🏛️
🗺️ 🛠️ 🏷️). Senza, Windows le disegna in bianco e nero: era il problema del
10 agosto con 🏷, e allora si era risposto togliendo TUTTE le emoji. Il
difetto era la scrittura, non le emoji.

## IL BANCO — e i quattro sabotaggi che l'hanno rifatto

`prove/banco-reparto.js` estrae **verbatim** `panelForm`, `_panelAnteprima`,
`_iconizza`, `_ICONS`, `_ICO_SKIP`, `ICONE_GRUPPI` e `COLORI`, e li fa girare
in Chromium col CSS vero. L'unica cosa finta e' `openSheetGrande`.

**22 verdi su 22 · 11 sabotaggi, 11 accusati.**

⛔ **Ma alla prima corsa i sabotaggi accusati erano 7 su 11**, e tutti e
quattro i buchi erano **del banco**, non del codice:

1. `_ICO_SKIP` lo **riscrivevo a mano** nel banco: provavo la mia copia, non
   quella del gestionale. Adesso si estrae dal file.
2. il MutationObserver era **vuoto** (`()=>{}`): nel gestionale vero
   **richiama `_iconizza`**. Con l'osservatore spento il banco guardava
   un'anteprima che nessuno aveva mai provato a trasformare.
3. l'anteprima partiva con **🔨**, che `_ICONS` non conosce: non c'era niente
   da trasformare, e il sabotaggio passava. Adesso il banco sceglie prima
   un'emoji che `_iconizza` conosce davvero (🧱).
4. non misuravo **la dimensione** dei bottoni, e non controllavo che l'icona
   cliccata fosse **quella accesa**.

⚠️ La lezione e' la stessa di stamattina coi dati tutti uguali: **un banco
che gira su una copia addomesticata del mondo non prova niente.** Le quattro
prove nuove sono nate da qui.


# 21 agosto 2026 (5) — LE ICONE DEL REPARTO LE DISEGNIAMO NOI

Alessio, in tre colpi: *«le emoji sono brutte, avevo chiesto di cambiarle»* ·
*«bisogna scrollare»* · *«i colori spostali e cambiamo quei cerchi cosi
bruttini»*.

## ⛔ IL PUNTO CHE MI ERA SFUGGITO PER DUE GIRI

**Le emoji non le disegniamo noi: le disegna Windows.** Quindi non si possono
migliorare, e quelle che il computer non ha escono come **quadratini bianchi**
— ne sono usciti **sette** nella sua tendina (scala, pietra, legno, sega,
finestra, specchio, pianta), tutte del blocco Unicode U+1FA70..U+1FAFF.

Gli ho messo davanti **tre schermate**: emoji · disegno a tratto colorato ·
disegno bianco su fondo pieno. **Ha scelto la 2.**

## COM'E' ADESSO

- **50 icone disegnate da noi** (`ICO_REPARTO`), a tratto, **del colore del
  reparto** — anche quelle della tendina, che seguono il colore scelto
- ⛔ **la chiave resta l'emoji**: i reparti gia' creati hanno l'emoji dentro
  `gest_mestieri.icona`, e cosi' **non serve spostare nessun dato**
- ⛔ **sette disegni fuori lista**: le emoji che Windows non ha non si possono
  piu' SCEGLIERE, ma il disegno ce l'hanno lo stesso — se no chi si era preso
  la scala si ritroverebbe la riserva (il martello)
- **a sinistra** nome, anteprima e colori · **a destra** le icone: ci sta tutto
  senza scorrere
- **i colori sono piastrelle** 44x34 con la **spunta** su quello scelto: i
  pallini da 30px non si vedevano e non dicevano se erano accesi

## IL BANCO

`prove/banco-reparto.js` — **27 verdi su 27**. Fra le prove nuove:
- **ogni icona ha un disegno suo**, e nessuna cade sulla riserva (e' la prova
  che non me ne sono dimenticata nessuna)
- **non ci sono due icone col disegno identico** (il copia-incolla sbagliato)
- **nessuna emoji del blocco U+1FA70..U+1FAFF** nella lista — controllata
  numero per numero, cosi' i quadratini non tornano una terza volta
- le piastrelle dei colori sono larghe almeno 40px e hanno la spunta

`prove/sabotaggi-reparto.js` — **15 su 15 accusati**.

## ⛔ TRE SABOTAGGI TOLTI, E VA DETTO

I tre su `.no-ico` **non venivano piu' accusati**, e non perche' il banco
fosse cieco: da quando le icone sono disegni, togliere `.no-ico` non rompe
niente — non c'e' nessuna emoji da trasformare. **Un sabotaggio che non puo'
fare danno non prova niente**, e tenerlo in lista gonfia il punteggio. Sono
stati sostituiti con altri che il danno lo fanno davvero (rimettere le emoji,
rimettere in lista la scala, togliere un disegno, dare a due icone lo stesso
disegno).

⚠️ E uno l'ho dovuto riscrivere due volte: «do alla lampadina il disegno del
fulmine» all'inizio **concatenava** i due disegni invece di sostituirli, e
cosi' il risultato non era uguale a nessuno dei due e la prova non poteva
accusarlo.


## ⛔ 21 agosto 2026 — IL DEPLOY SI E' FERMATO, ED E' COLPA MIA

Alessio ha pushato, e Netlify ha risposto **Deploy failed** su `main@30d4fca`.
Non era un guasto: era `tools/controllo-push.js` che faceva il suo mestiere.

Due cose bloccavano:

1. **`css/gestionale.css` riga 3859: un testo da 12 px.** Il titolino dei
   gruppi di icone che avevo scritto io. ⛔ **Niente testo sotto i 13 px** e'
   una regola del progetto — e sta scritta, per giunta, dentro il CSS della
   striscia dell'AI che avevo letto quella mattina stessa. Portato a 13.
2. **`netlify.toml`**: `IL-PREZZO-i-conti-veri.md` e `IL-PREZZO-la-decisione.md`
   (del 19 agosto) stavano in root senza rinvio, e sarebbero finiti online
   scaricabili da chiunque. Aggiunti al blocco «LA ROBA CHE NON DEVE STARE
   ONLINE».

## ⛔ LA REGOLA CHE MI MANCAVA: PRIMA DI DARGLI IL BLOCCO GIT, ESEGUIRE IL CONTROLLO

    node tools/controllo-push.js

Gira in 5 secondi sulla sua cartella e dice esattamente cosa fermerebbe la
pubblicazione. **Va eseguito PRIMA di consegnare**, insieme all'md5 — non
dopo, quando il deploy e' gia' rosso e lui sta guardando lo schermo.

⚠️ Da oggi la consegna e' quattro cose, non tre:
  1. i banchi verdi e i sabotaggi accusati
  2. **`node tools/controllo-push.js` → «il sito puo' andare online»**
  3. md5 uguale sui due lati
  4. il blocco git

⚠️ Il sito online **non e' mai cambiato**: il controllo si e' fermato prima di
pubblicare, che e' esattamente il motivo per cui esiste. Nessun danno — solo
mezz'ora persa e una schermata rossa che si poteva evitare.


# 21 agosto 2026 (6) — «L'HO CANCELLATO E TORNA»

Alessio: *«due reparti cancellati perche sono tornati?»*, e poi la frase che
ha sbloccato tutto: *«si sono andati via ma a volte tornano»*.

## ⛔ LA PRIMA IPOTESI ERA SBAGLIATA, E L'HA SMONTATA UNA DATA

Avevo puntato il dito su `backfillMestieri`, che ricrea nel database i reparti
rimasti nella memoria del browser. Ipotesi bella, e sbagliata.

Una riga di SQL l'ha demolita:

    giardiniere — creato 19/06   ·   pulizia — creato 21/06
    progetto casa — creato 09/08 ·   elettricista — creato 15/08

**Date vecchie.** Se fossero stati ricreati avrebbero la data di oggi. Non
erano tornati: **non erano mai stati cancellati.**

⚠️ La lezione: una diagnosi che spiega bene i sintomi non e' una diagnosi.
`created_at` costava trenta secondi e ha risparmiato mezza giornata su una
correzione inutile.

## IL DIFETTO VERO

Dentro `delPanel` **tutta** la cancellazione dal database vive in un
`if(sb && sbUid && p.mestiere_id)`. Se una delle tre manca — login scaduto,
o una scheda che nel browser ha perso il collegamento — quel pezzo viene
**saltato**. Ma subito dopo il reparto veniva tolto dall'elenco lo stesso, e
il gestionale scriveva **«Reparto eliminato»**.

Sparito dallo schermo, vivo nel database. Alla riapertura l'elenco si rifa'
dal database, e il reparto torna. **Ecco il «a volte»**: dipende da cosa e'
rimasto in Chrome.

## LA REGOLA

⛔ **SE NON SI PUO' CANCELLARE DAL DATABASE, NON SI CANCELLA NEMMENO DALLO
SCHERMO.** Un reparto che resta con una spiegazione e' meglio di uno che
sparisce e ritorna: la seconda volta non sai piu' di che cosa fidarti.

E' la stessa famiglia della bugia del 12 agosto («sono gia' nel Cestino, vai
a riprenderle» quando non c'erano).

## IL BANCO

`prove/banco-delpanel.js` — `delPanel` estratta **verbatim** e fatta girare
con un **finto Supabase che REGISTRA le chiamate**: cosi' si vede non solo
cosa dice il gestionale, ma **cosa ha davvero chiesto al database**.

**13 verdi su 13.** La prova che conta e' la terza: *«con tutto a posto deve
cancellare davvero»*. Senza quella, avrei potuto bloccare tutto e sembrare a
posto — una cura peggiore del male.

`prove/sabotaggi-delpanel.js` — **5 su 5 accusati**.

## ⛔ DUE TRAPPOLE NEI MIEI SABOTAGGI, TROVATE NELLO STESSO GIRO

1. **Ancora ambigua.** Usavo `if(!sb||!sbUid){` come ancora: quella stringa
   compare **35 volte** nel gestionale, e `replace()` colpiva la prima, in
   tutt'altra funzione. Il sabotaggio non accusava. E' la stessa trappola del
   22 agosto (`doc.text("Pag. "...)` che stava in due funzioni).
   ⛔ Adesso c'e' una **guardia**: se un sabotaggio cambia piu' di sei righe,
   il file lo rifiuta e lo dichiara «ANCORA AMBIGUA (colpa mia)».
2. **La guardia contava male.** Confrontava riga per riga in parallelo:
   togliere un `return;` sposta tutto quello che segue, e diceva **6510
   differenze** per una riga in meno. Adesso conta le righe che ci sono in uno
   e non nell'altro, da tutte e due le parti.

# 21 agosto 2026 (7) — IL TITOLO CHE CONTRADDICEVA LA SCHEDA

Sul Riepilogo: «**1 preventivo senza risposta**», e due centimetri sotto la
scheda Preventivi con «**2** in attesa di risposta».

Non erano numeri sbagliati: sono due conti diversi — uno e' «fermo da piu' di
una settimana», l'altro «in attesa». Ma sullo stesso schermo, con **le stesse
parole** e numeri diversi, sembra un errore del gestionale.

⛔ **Quando due conti diversi stanno sulla stessa schermata, il titolo deve
dire cosa li distingue.** Adesso: «1 preventivo **fermo da piu' di una
settimana**», e la riga sotto non lo ripete piu' — dice cosa fare.


# 21 agosto 2026 (8) — I SEGNAPOSTO CHE SEMBRANO DATI (n. 27, chiuso)

`gestionale-app.html`, **22 caselle**. Nessun altro file toccato.

## ⛔ I «51» NON ERANO 51 — E IL FILTRO DEL BANCO NE NASCONDEVA TRE

`prove/banco-suggerimenti.js` diceva «51 senza Es.». Guardandoli uno per uno:
**7 falsi allarmi** (scritti `${...}`, con «Es.» dentro tutti i rami),
**24 istruzioni** che vanno bene così («Una prestazione per riga»).
Restavano **19** veri.

⛔ **Ma il filtro di quel banco escludeva `^\d+$`, `^0000`, `^IT\.\.`**, e così
si teneva fuori proprio la famiglia di difetti che cercava:

- `c-cap` diceva **`02100`** — lo **stesso identico difetto** dei Dati azienda
  del 22 agosto, sulla scheda del CLIENTE, e nessuno l'aveva visto;
- `a-piva` diceva **`01234567890`**;
- `a-pol-mass` diceva **`500000`**.

⚠️ **Un filtro che toglie rumore toglie anche prove.** Erano 22, non 19.

## LE DUE FAMIGLIE

1. **Sembrano un dato vero**: `RSSMRA80A01H501U` (codice fiscale cliente),
   `02100`, `Rieti`, `RI`, `01234567890`, `500000`.
2. **Ripetono l'etichetta**: sopra c'era scritto «Telefono», dentro «Numero».
   La casella non diceva niente di nuovo, e a colpo d'occhio sembrava piena.
   `Foglio` · `Particella` · `Sub` · `Nome` · `Numero` (×2) · `Via, città` ·
   `Indirizzo / scala / piano` (×2) · `Titolo del capitolo` ·
   `Descrizione voce` · `Q.tà` · `Prezzo €` · `Indirizzo del cantiere` ·
   `Indirizzo dell'immobile` · `Nome della rivendita...`

## ⚠️ LE DUE CASELLE STRETTE — chieste prima, misurate dopo

`Q.tà` → «Es. 12» e `Prezzo €` → «Es. 24,00» stanno nella riga del preventivo,
quella schiacciata a 390 px. **Non ho deciso a occhio**: il banco le apre in
Chromium a 1440x900 e a 390x844 e misura `scrollWidth <= clientWidth`.
A 390 px: 78≤78 e 116≤116. Ci stanno.

## IL BANCO — e la guardia che serve a domani

`prove/banco-segnaposto.js` — **99 verdi su 99**. Quattro parti:

1. le 22 caselle dicono il testo nuovo **e** il vecchio non c'è più;
2. ⛔ **LA GUARDIA**: ogni segnaposto del gestionale o comincia con «Es. », o
   sta nell'elenco delle ISTRUZIONI scritto dentro il banco. **Un segnaposto
   nuovo fuori elenco fa diventare il banco rosso.** Ed è provata anche al
   contrario: le si dà «Mario Rossi» inventato e deve accusarlo;
3. i ternari `${...?...:...}` **si cercano nel file**, non si elencano a mano:
   ogni ramo dopo il `?` deve dire «Es. ». Così vale anche per quelli che
   nasceranno domani;
4. Chromium col CSS vero: casella vuota, segnaposto intero, grigio e non nero,
   testo mai sotto i 13 px.

`prove/sabotaggi-segnaposto.js` — **14 su 14 accusati**.
Con la guardia in cima («se il banco è già rosso mi fermo») e il ripristino
dei file anche se lo script viene ammazzato.

## ⛔ TRE ANCORE AMBIGUE, TROVATE DALLA GUARDIA E NON DA ME

Alla prima corsa: **11 su 14, e 3 «ANCORA AMBIGUA (colpa mia)»**.
`placeholder="Es. 02100"` sta **in due schede** (cliente e Dati azienda), e
`placeholder="Es. Rieti"` **otto volte**. Il sabotaggio colpiva la prima, che
era l'altra scheda. Rimediato mettendo nell'ancora **l'id del campo**:
`id="c-cap" value="${esc(c.cap||"")}" placeholder="Es. 02100"`.

⚠️ È la stessa trappola di `doc.text("Pag. "...)` — e questa volta se n'è
accorta la guardia, non Alessio.

## RESTA FUORI, ED È UNA SCELTA

- **n. 28**, il segnaposto della `textarea` che non si traduce: è un altro
  difetto (`_SKIP_UTENTE`), va nel suo push. Si vede su `j-desc` riga 7694.
- `IT..` sull'IBAN e `0` / `—` / `30` sulle caselle dei numeri: sono
  istruzioni, non dati. Lasciati, e messi nell'elenco del banco.

**Consegna: banchi verdi · `node tools/controllo-push.js` verde · md5 uguale ·
un push solo.**


# 21 agosto 2026 (9) — IL SUGGERIMENTO GRIGIO DELLA CASELLA GRANDE (n. 28, chiuso)

`gestionale-app.html`, un file solo.

## IL DIFETTO

`textarea` stava in `_SKIP_UTENTE`, la lista che protegge **quello che
l'utente scrive DENTRO**. Ma quella lista veniva usata anche per gli
**attributi** — e il `placeholder` l'abbiamo scritto noi.

Risultato: a un geometra il gestionale offriva ancora
«Giovedì prossimo taglio siepe da Le Betulle, ci va Marco».

## LA CORREZIONE — tre pezzi

1. ⛔ **DUE LISTE, NON UNA.** `_SKIP_ATTRIBUTI` **si ricava** da
   `_SKIP_UTENTE` togliendo solo `textarea`:
   `_SKIP_UTENTE.split(',').filter(s=>s!=='textarea').join(',')`.
   Non si riscrive a mano: se domani si aggiunge una classe da proteggere,
   la protezione vale per tutte e due senza che nessuno se lo ricordi.
2. ⛔ **IL GIRO SUI SEGNAPOSTO ERA SCRITTO DUE VOLTE**, identico, in
   `_traduciDentro` e in `localizzaPratiche`. Adesso e' una funzione sola,
   `_traduciAttributi(root)`. *Una regola che sta in due posti non si
   sistema a meta'* — la seconda copia avrebbe continuato a saltare le
   textarea.
3. **Sei frasi nuove in `_FRASI`.**

## ⛔ ARRIVARCI NON BASTA: LA FRASE DEVE ESSERE IN ELENCO

E' la lezione del 22 agosto, ed e' ricomparsa identica. Aperta la strada alle
textarea, **quattro frasi che il traduttore raggiungeva gia'** restavano com'erano
perche' nessuno le aveva messe in `_FRASI`:

- «Cerca un nome: cliente, **lavoro**, preventivo, fattura» (la ricerca in alto)
- «Cerca cliente, indirizzo, **lavoro**»
- «Apri il **lavoro**» (un `title`)
- «Es. Carta Mario, Carta **cantiere** Nord»

⚠️ **E l'ultima e' peggio delle altre: cambiava, ma male.** Senza la sua riga
intera, la regola corta su «cantiere» la faceva diventare
«Carta **pratica** Nord», che non vuol dire niente.
⛔ **Non basta chiedersi «cambia?»: si guarda in che cosa cambia.** Il banco
adesso confronta il risultato **esatto**, non solo «diverso da prima».

Le due frasi decise con Alessio:
- l'esempio dell'AI → «Martedì prossimo rilievo per la CILA in via Verdi 12,
  ci va Marco, 350 euro»
- la nota della fattura fornitore → «Es. visure catastali per la pratica di
  Via Roma»

## LASCIATE APPOSTA, E VA DETTO

«Condominio Le Betulle … amministratore Rossi» e «Con amministratore: codice
fiscale, niente partita IVA» **non si traducono**: per un geometra il
condominio e il suo amministratore sono clienti veri. Sta gia' scritto in
`_FRASI` dal 9 agosto, e adesso e' anche una prova del banco — con il motivo
scritto accanto, se no fra un mese sembra una dimenticanza.

## IL BANCO — sempre nei due versi

`prove/banco-traduttore-attributi.js` — **40 verdi su 40**.

- quello che abbiamo scritto noi (`placeholder` **e** `title`) **deve** cambiare;
- ⛔ quello che ha scritto l'utente — il testo **dentro** la casella, i nomi,
  le descrizioni del computo dentro `.cm-testo` — **non deve** cambiare.
  Un banco che guardasse solo il primo verso direbbe «verde» anche dopo aver
  spento tutte le protezioni;
- **tutte** le frasi del gestionale che contengono una parola da tradurre
  vengono passate a `_swapPratiche`: se una resta com'era ed e' fuori
  dall'elenco delle «lasciate apposta», e' rosso;
- e il giro sui segnaposto deve comparire **una volta sola** nel file.

`prove/sabotaggi-traduttore-attributi.js` — **12 su 12 accusati**,
fra cui «rimetto textarea negli attributi» (il difetto di partenza),
«tolgo textarea dai testi» (il verso opposto: tradurrebbe la roba di Alessio),
«rimetto il giro scritto due volte» e «tolgo la frase della carta».

**Consegna: banchi verdi · controllo-push verde · md5 uguale · un push solo.**


# 21 agosto 2026 (10) — TRE LAVORI, UN PUSH SOLO

`gestionale-app.html` · `js/gest-computo.js` · `js/gest-computo-pdf.js`.
Niente SQL, niente CSS.

## n. 26 — «m²» e «mq» nella stessa lista

Nell'elenco delle lavorazioni una riga diceva «20,46 m²» e quella sotto
«174,06 mq»: la prima scelta dalla tendina, la seconda arrivata da un
prezzario importato.

Nasce **`_umSchermo(u)`** accanto a `_uniPiatta`, e la usano tutti e **sei**
i posti dove un'unità si LEGGE (elenco lavorazioni, confronto della variante
×2, prezzario, analisi, spese).

⛔ **SI CAMBIA SOLO QUELLO CHE SI LEGGE.** Nel database resta quello che ha
scritto il prezzario, e la **casella U.M. della scheda** continua a mostrarlo
tale e quale: lì si sta CORREGGENDO un dato, e un dato non si riscrive alle
spalle di chi lo guarda. Il banco lo controlla, ed è un sabotaggio.

⛔ **IN TABELLA CI SONO SOLO `m2` E `m3`.** `_uniPiatta` appiattisce «ml» e
«m» tutte e due su «m» — giusto per CONFRONTARE, sbagliato per SCRIVERE: a
schermo «ml» e «m» sono due parole diverse. Un'unità che non è in tabella si
scrive come l'ha scritta lui. Anche questo è un sabotaggio («metto anche m
in tabella»).

⚠️ Sul foglio stampato si va **nell'altro verso** (`_umPdf`: «m²» → «mq»),
perché jsPDF il quadratino non lo sa disegnare. Le due direzioni convivono, e
il banco controlla tutte e due.

## n. 5 — la gru, il cantiere, il piccone

Rifatte in `ICO_REPARTO`. Il **cantiere** adesso è un **cono stradale** (la
transenna a 26 px era un rettangolo con dentro dei graffi). Le chiavi restano
le emoji: nessun dato da spostare.

⚠️ **Il piccone mi ha preso cinque tentativi.** Le prime due versioni erano
un piccone *verticale*: uscivano un ombrello e una palma. Un attrezzo si
riconosce dalla **posa**, non dai dettagli — il manico va in diagonale.
Le ho disegnate tutte e cinque e le ho guardate prima di proporne una.

## n. 6 — un raggruppamento solo

`_compGruppi` era scritta a mano **anche** dentro `computoPdf` e dentro
`computoListaGara`: tre copie che dovevano dare lo stesso ordine, perché il
numero della lavorazione dev'essere lo stesso su tutti i documenti che si
consegnano insieme. Adesso le altre due la chiamano.

⚠️ **`banco-analisi-pdf.js` è diventato rosso da solo**, e ha fatto il suo
mestiere: teneva le due copie verbatim. Riscritto: adesso controlla che di
copie ce ne sia **UNA** (`perCap[` non esiste più, `senzaCap` compare una
volta sola) e confronta l'ordine con un raggruppamento **rifatto a mano nel
banco** — ⛔ una funzione confrontata con se stessa non prova niente.

## I BANCHI

| banco | verdi |
|---|---|
| `prove/banco-unita.js` | 48 |
| `prove/banco-icone.js` | 20 |
| `prove/banco-analisi-pdf.js` | 107 |

`prove/sabotaggi-unita-icone-gruppi.js` — **14 su 14 accusati**.

⛔ **UNA PROVA CHE HO DOVUTO BUTTARE.** La prima stesura di `banco-icone.js`
leggeva tutti i numeri dentro il path e chiedeva che stessero fra 0 e 24:
ha accusato **45 icone su 57, tutte sane**. In un path SVG i numeri dopo una
«c» sono **spostamenti**, non posizioni. La misura vera la sa dare solo il
browser: adesso il banco apre le 57 icone in Chromium e legge il `getBBox` —
nessuna vuota, nessuna che sborda, nessuna grande come un francobollo.

**Consegna: banchi verdi · controllo-push verde · md5 uguale · un push solo.**


# ⛔ 21 agosto 2026 — I NUMERI VERI DELLA PUBBLICITÀ

Letti per la prima volta, e cambiano i conti di prima.

## 1. Il contatore delle visite (`sql/leggi-visite.sql`)

Tre giorni di dati (19-21 agosto):

| | |
|---|---|
| persone arrivate dalla pubblicità | →50← |
| di quelle, hanno visto la pagina | →54%← |
| la pagina si disegna in | →1,3← s |

## 2. Cosa dice Meta per gli stessi tre giorni

Letti dal collegamento Supermetrics (Facebook Ads, account `act_1941850939646360`):

| giorno | clic sul link | «arrivi» (landing page views) | speso |
|---|---|---|---|
| 19/8 | 25 | 8 | 7,22 € |
| 20/8 | 10 | 2 | 8,19 € |
| 21/8 | 15 | 2 | 5,05 € |
| **totale** | **→50←** | **→12←** | **20,46 €** |

## ⛔ IL 62% NON ERA GENTE PERSA — ADESSO È PROVATO

**→50← clic pagati, →50← persone arrivate sul sito.** Non se ne perde per
strada praticamente nessuno.

Ma Meta dichiara «arrivati» **→12←**, e il contatore ne vede **→27←** che
hanno guardato la pagina. **Meta ne vede meno della metà**, perché il pixel
sta dietro il banner dei cookie.

⚠️ Quindi ogni numero del pannello di Meta va letto sapendo che è
sotto-contato di circa la metà. Non è un guasto: è il consenso ai cookie, e
non si aggira — si tiene solo il proprio contatore come metro.

## ⛔ UN'IMPRESA ISCRITTA COSTA →2,97← €, NON →5,47←

`sql/leggi-iscrizioni.sql`, letto sul database (`auth.users`, non `imprese`:
è il numero vero anche se il trigger inciampa):

| | |
|---|---|
| iscritte negli ultimi 30 giorni | →81← |
| al giorno | →2,7← |
| ultimi 7 giorni | →18← (→2,6← al giorno) |
| di quelle del mese, col profilo | →80← su →81← |
| iscritte da sempre | →89← |

→240,66← € spesi ÷ →81← iscritte = **→2,97← € l'una**. Il conto vecchio
(→5,47← €) era fatto sui →44← che vedeva Meta: era quasi il doppio del vero.

⚠️ E sono quasi tutte della pubblicità: prima della campagna il sito aveva
→8← iscritte in tutto.

✅ **Il trigger `completa_profilo_extra` tiene**: 80 profili su 81.

## ⚠️ QUELLO CHE ANCORA NON SI SA

Se una su dieci paga, un cliente costa →30← € e rende →249-348←: si ripaga
il primo mese. **Ma «una su dieci» è una supposizione**: finora hanno pagato
**zero** imprese, perché il gestionale è chiuso e i tre mesi sono in regalo.
Il primo numero vero arriverà quando scadranno i tre mesi delle imprese di
luglio.

## L'APPRENDIMENTO DI META — e una correzione mia

Meta impara solo da quello che **vede lui**: ne vede ~→10← a settimana e
gliene servono →50←. Cioè **cinque volte** il budget, ~→40← € al giorno.
⛔ Avevo detto ad Alessio «~18 € al giorno» e **era sbagliato**: quel numero
partiva dagli eventi VERI, non da quelli che Meta riesce a contare.

Alessio ha deciso: **si tiene l'evento «Contatti»** (vuole iscritti, non
visite) e **non si tocca niente fino al 26 agosto**.
Conseguenza da accettare: con 8 € al giorno **l'apprendimento non si
chiuderà**. La campagna porta iscritti lo stesso, solo meno bene.

## ⚠️ UNA DECISIONE CHE RESTA DI ALESSIO

L'avviso del prezzo nuovo alle imprese di luglio (il punto 4d).
**Chiesto il 21 agosto, risposta: «è un lavoro che ancora io devo decidere».**
Non proporlo di nuovo finché non è lui a riprenderlo.


# 21 agosto 2026 (11) — TRE PEZZI DEL GESTIONALE

`gestionale-app.html` · `css/gestionale.css` · `js/gest-computo.js`.

## 1. A 390 px la descrizione del preventivo era larga →66← px

Misurata in Chromium, non a occhio: quantità (80) + prezzo (118) + la × (48)
+ tre spazi si prendono →270← px dei 390, e alla colonna che conta ne
restavano →66←. Ci stava «Demolizio».

⛔ **Quattro colonne in 390 px non ci stanno.** Sotto i →560← px la riga va a
capo: descrizione sopra su tutta la larghezza, quantità · prezzo · × sotto.
Adesso a 390 px la descrizione è larga **→338←** px.

⚠️ Fatto con `grid-template-areas`: **l'HTML non si tocca**, si sposta solo
la posizione delle caselle che il gestionale già scrive.
⚠️ La riga del **capitolo** ha due caselle sole: senza una regola sua
avrebbe ereditato le aree della riga lunga e la × sarebbe finita a capo da
sola. È un sabotaggio del banco.

## 2. Il pulsante del prezzario adesso sta anche in cima

Con ottanta lavorazioni bisognava scorrere tutto l'elenco per trovarlo.
⛔ **Scritto una volta sola** (`_btnPrezzi`), messo in due posti. Due copie
scritte a mano diventerebbero due pulsanti diversi al primo ritocco.
⚠️ Si vede solo se c'è davvero un prezzo a zero, come prima.

## 3. La riga rossa dello Scadenzario (n. 4, l'ultima delle tre strisce)

Le tre lasciate fuori il 21 sono state guardate una per una:

- la striscia dell'AI diventa arancione **e scrive** «— stanno finendo» → ok
- le due strisce dei controlli sono avvisi con testo loro → ok
- le righe rosse dei **Fornitori** dicono «scaduta 3 giorni fa» → ok
- ⛔ ma nello **Scadenzario** la riga diventava rossa e accanto c'era scritto
  solo «3 giorni fa». Chi non distingue il rosso non sapeva che era passata.

⛔ **Il colore non si toglie: si aggiunge la parola.** Adesso dice
«scaduta 3 giorni fa», la stessa forma dei Fornitori.

### ⚠️ E UN RAMO INUTILE, TROVATO DA UN SABOTAGGIO

Nella prima stesura avevo scritto anche `(rit?'q-passato':q.classe)`.
**Non faceva niente**: `quando()` restituisce già `q-passato` per una data
passata che non sia segnata fatta. Il sabotaggio «tolgo la pastiglia rossa»
non veniva accusato — non perché il banco fosse cieco, ma perché non c'era
niente da rompere. Tolto.

⛔ **Un sabotaggio non accusato va capito, non aggirato**: due volte su tre
il difetto sta nel banco, la terza sta nel codice che non serviva.

## I BANCHI

| banco | verdi |
|---|---|
| `prove/banco-riga-preventivo.js` | 62 |
| `prove/banco-scadenza-parola.js` | 25 |

`prove/sabotaggi-riga-preventivo.js` — **10 su 10** ·
`prove/sabotaggi-scadenza-parola.js` — **7 su 7**.

⚠️ Fra i sabotaggi ce ne sono due che servono a proteggere quello che **NON**
va cambiato: «spengo la striscia dell'AI» e «spengo le righe dei Fornitori».
Devono essere accusati anche loro.

⛔ E uno di quei due all'inizio **non veniva accusato**: il banco controllava
che la CLASSE `.ai-str--pochi` esistesse, non che ci fosse ancora il COLORE.
Bastava togliere la riga del bordo e passava. Adesso guarda la regola intera.

**Restano sul gestionale: il PDF dello stato avanzamento (SAL).**


# ✅ 21 agosto 2026 — IL GESTIONALE È FINITO (la lista del 21 è chiusa)

| n. | cosa | esito |
|---|---|---|
| 27 | i segnaposto che sembrano dati | fatto (22 caselle) |
| 28 | il segnaposto della casella grande non si traduce | fatto |
| 26 | «m²» e «mq» nella stessa lista | fatto |
| 4 | le tre strisce lasciate fuori | guardate: due andavano bene, la terza sistemata |
| 5 | la gru, il cantiere, il piccone | ridisegnati |
| 6 | unificare `_compGruppi` | fatto |

## ⛔ IL PDF DEL SAL NON MANCAVA: C'ERA GIÀ

Nel prompt della sessione c'era scritto **«Manca il PDF»**, ed era la voce
n. 2 di «da dove si riparte». **Non era vero.** Quella riga veniva dalla
sezione della **sera** del 19 agosto; il foglio è stato costruito la **notte
stessa** (`salPdf()`, sezione «19 agosto 2026 (6), NOTTE — IL SAL SI CHIUDE»).

Il pulsante **📄 PDF** sta in tre posti: nell'elenco dei SAL dentro il
computo, nell'elenco unico e dentro la scheda. Il foglio stampa già numero e
data · periodo · righe con quantità eseguita e importo · maturato · già
liquidato coi SAL precedenti · ritenuta di garanzia · netto da pagare.

⛔ **PRIMA DI COSTRUIRE, SI GUARDA SE C'È GIÀ.** Trenta secondi di
`grep salPdf` hanno risparmiato una giornata intera di lavoro doppio.
È la stessa famiglia della regola del 15 agosto («prima di costruire,
chiedere se serve») e della lezione del 19 («guarda il VALORE, non il nome»).

⚠️ E la causa vera: **una nota vecchia lasciata in una lista**. Quando una
cosa si chiude, va tolta dalla lista lo stesso giorno — se no il giorno dopo
qualcuno la rifà.

**Da qui in poi si lavora sul sito.** Il primo pezzo: le 95 pagine città
vuote in Search Console.


# 21 agosto 2026 (12) — UNA PAGINA, UN INDIRIZZO SOLO (Google)

Primo pezzo di lavoro sul sito. →19← file: le →18← guide «quanto costa…»
più `netlify.toml`.

## ⛔ PRIMA DI RIEMPIRE LE 95 PAGINE CITTÀ, HO GUARDATO I NUMERI

Letti da Search Console (collegamento Supermetrics), ultimi 3 mesi:

| | impressioni | clic |
|---|---|---|
| le →6← guide «quanto costa…» | →8.100← | →57← |
| tutte e →106← le pagine città | ~→130← | →1← |
| il sito intero | ~→9.000← | ~→180← |

⛔ **«Riempire le 95 pagine città» è tanto lavoro per niente.** Non è stato
fatto, ed è una scelta presa sui numeri, non a sensazione.

## IL DIFETTO VERO, TROVATO GUARDANDO GLI STESSI NUMERI

Alcune pagine città stanno su Google **in due indirizzi**:
`/imprese-bologna` **e** `/imprese-bologna.html`.

Su Bologna la `.html` prendeva →22← impressioni in posizione →44←, quella
giusta →1← impressione. Google le legge come due pagine diverse e si divide
i voti. Stessa cosa su Rieti, Lecce, Parma, Vibo Valentia.

**La causa:** il canonical ha sempre detto l'indirizzo senza `.html`, ma il
sito linkava l'altro — **→216← link** dentro le →18← guide, cioè proprio le
pagine con più visite, quelle che passano più valore.

## LA CORREZIONE — due pezzi, e servono tutti e due

1. i →216← link nelle guide perdono il `.html`;
2. →106← regole `301` in `netlify.toml`, una per città, per quello che
   Google ha **già** in pancia.

⚠️ **`force = true` è obbligatorio**: il file `imprese-bologna.html` esiste
davvero, e senza `force` Netlify serve il file e salta la regola. È la stessa
trappola scritta nel file per le regole del 404.
⚠️ **301, non 302**: a Google si dice che il trasloco è definitivo.
⚠️ **Scritte una per una, non con un jolly**: il jolly di Netlify prende
tutto fino alla fine dell'indirizzo, quindi `/imprese-*` non sa togliere il
`.html` e si rimanderebbe da solo, all'infinito.
⚠️ Stanno **dopo** le regole del 404: Netlify tiene buona la prima che
combacia, e la roba privata deve restare chiusa.

## ⚠️ IN TUTTO IL SITO I LINK CON `.html` SONO ANCORA →2.643←

Qui sono stati sistemati solo quelli verso le città. Il resto è un lavoro
suo: tocca ~230 file in un colpo, e se qualcosa si rompe non si sa quale
pezzo è stato. **Deciso con Alessio di fermarsi alle città.**

## IL BANCO

`prove/banco-un-indirizzo.js` — **23 verdi**. Guarda nei due versi:
- nelle guide non resta nessun link con `.html`;
- ⛔ **ma ogni link deve portare su una pagina che ESISTE** — togliere il
  `.html` da un link che poi va nel vuoto sarebbe peggio del difetto;
- rimettendo il `.html` ogni guida torna **identica** al file di prima: è la
  prova che non è cambiato nient'altro;
- le →106← regole ci sono tutte, una sola per città, tutte 301 con `force`,
  nessuna che rimandi a se stessa;
- le →22← regole del 404 sono ancora tutte lì e mandano ancora al 404;
- e `netlify.toml` viene riletto da un **lettore TOML vero** (`tomllib`),
  non a occhio: se una virgoletta manca, è rosso.

`prove/sabotaggi-un-indirizzo.js` — **11 su 11 accusati**.

⛔ **Un sabotaggio non accusato, e la lezione è la stessa di stamattina:**
«tolgo una regola del 404» passava, perché il banco **contava** le righe
`/404.html` invece di guardarle una per una. Contare non è controllare.


# ⛔ 21 agosto 2026 (13) — I QUADRATINI BIANCHI ERANO SUL SITO PUBBLICO

Trovato guardando una **fotografia dello schermo** che Alessio ha mandato per
un'altra cosa: sotto «Falegnami», su `imprese-bologna`, c'era un quadratino
bianco al posto dell'icona.

⛔ **Le emoji non le disegniamo noi: le disegna Windows.** Quelle del blocco
U+1FA70–U+1FAFF (2019-2021) il suo Segoe UI Emoji non le ha. Era già successo
il 10 agosto con 🏷 e il 21 nella tendina del reparto. Questa volta erano sul
**sito pubblico**, e le vedeva ogni visitatore.

**→122← emoji su →115← pagine**, fra cui la **homepage** (sotto «Infissi») e
`quanto-costa-ristrutturare-casa`, una delle guide che porta più gente.

## ⚠️ LA TRAPPOLA: LA STESSA EMOJI VOLEVA DIRE TRE COSE

`🪵` stava per **Falegnami** sulle 106 pagine città, per **Pavimento** sui
calcolatori e per **Carpentiere** sulle offerte di lavoro.

⛔ **Un cambio unico avrebbe messo la porta al posto del pavimento.** Si
guarda l'ETICHETTA accanto, non l'emoji. È un sabotaggio del banco, ed è il
secondo più importante di tutti.

## LA TABELLA

| etichetta | prima | adesso |
|---|---|---|
| Falegnami / Falegname | 🪵 🪚 | 🚪 |
| Carpentiere | 🪵 | ⚒️ |
| Pavimentista / Pavimento | 🪨 🪵 | ⬛ |
| Infissi / finestre | 🪟 | 🖼️ |

⚠️ Le quattro nuove sono state scelte **anche** perché libere: su
`offerte-lavoro` il martello `🔨` e il quadrato marrone `🟫` erano già presi
da «Da 3 a 5 anni» e da «Piastrellista».
⚠️ **Provate sul suo computer prima di scriverle**: gliele ho messe in chat e
gli ho chiesto se le vedeva tutte e quattro. Sono le sue emoji, non le mie.
⛔ `⚒️` e `🖼️` si scrivono **col selettore di variante**: senza, Windows le
disegna in bianco e nero.

## ⛔ QUELLO CHE NON È STATO TOCCATO, E PERCHÉ

`gestionale-app.html` e `gestionale-config.html`: lì l'emoji è la **chiave**
di un disegno nostro (o della scelta salvata nel database). Cambiarla
scollegherebbe i reparti già creati. `gestionale-negozio` e
`gestionale-noleggio` sono vietati.

## ⚠️ UNA COSA SEGNALATA E NON TOCCATA

`.bak-riepiva-123811.html` sta nella cartella principale, quindi **è online**
e chiunque può aprirlo. Non è stato toccato: **decide Alessio** se chiuderlo
come gli altri file di scorta.

## IL BANCO

`prove/banco-quadratini.js` — **40 verdi** su undici pagine vere.
Non guarda solo che il quadratino sia sparito: controlla che ogni emoji nuova
stia **accanto alla sua etichetta**, e il verso opposto — che la porta non sia
finita dove c'era il pavimento.
⚠️ Sulla homepage i riquadri con l'icona grande sono **sei**: un primo banco
guardava solo il primo che capitava, e un sabotaggio passava.

`prove/sabotaggi-quadratini.js` — **8 su 8 accusati**, fra cui «il cambio
unico» e «tolgo il selettore di variante».

⚠️ E il conto della giornata, di nuovo: **il difetto più visibile di oggi
l'ha trovato una foto dello schermo di Alessio, non un banco.**


# 21 agosto 2026 (14) — LE →7← PAGINE «NON TROVATE»: NE ERA ROTTA →1←

`netlify.toml` · `robots.txt`.

## ⛔ UN ELENCO NON SI CONTA, SI LEGGE RIGA PER RIGA

Search Console diceva **683 pagine non indicizzate, 9 motivi**. Guardati:

| motivo | pagine | cos'è |
|---|---|---|
| Pagina alternativa con tag canonical appropriato | **574** | ⛔ **non è un difetto**: è Google che ha capito e ha unito i doppioni. Sono i `.html` sistemati oggi: quel numero scende da solo. |
| Rilevata, ma non indicizzata | 81 | le pagine città vuote: Google le conosce e non le apre |
| Scansionata, ma non indicizzata | 12 | le ha aperte e non le ha ritenute utili |
| Non trovata (404) | 7 | ← guardate una per una, sotto |
| Duplicata senza URL canonico | 5 | da guardare un'altra volta |
| le altre quattro | 1 ciascuna | |

⚠️ **E prima di questa tabella avevo detto ad Alessio che «Google tiene
fuori due terzi del sito». Era sbagliato**, e gliel'ho detto subito: 574 su
683 sono il sistema che funziona, non un guasto. **Non si commenta un numero
senza aver visto da cosa è fatto.**

## LE SETTE «NON TROVATE», UNA PER UNA

| indirizzo | esito |
|---|---|
| `/registrazione` | ✅ già sistemata il **16 agosto** |
| `/registrazione.html` | ✅ già sistemata il 16 agosto |
| `/disdetta.html` | ✅ già sistemata il 16 agosto |
| `/rest/v1/candidati_lavoro` | non è una pagina |
| `/rest/v1/candidati_lavoro?user_id=eq` | non è una pagina |
| `/storage/v1/object/public/cv-candidati/` | non è una pagina |
| `/auth/v1/signup` | non è una pagina |
| **`/preventivo.html`** | ⛔ **l'unico difetto vero** |

⚠️ Le date di scansione delle prime tre erano **più vecchie della
correzione**: Google mostra l'ultima volta che ci è passato, non lo stato di
adesso. Rifarle sarebbe stato lavoro doppio.

## LE QUATTRO DI SUPABASE — DA DOVE ARRIVANO

Non sono link: **Googlebot legge il JavaScript dentro le pagine e prende per
link le stringhe che sembrano indirizzi.** In `registrazione-candidato.html`
ci sono scritte `'/rest/v1/candidati_lavoro?user_id=eq.'` e
`'/storage/v1/object/public/cv-candidati/'`, che nel codice si concatenano a
`SUPABASE_URL` — ma il crawler vede solo il pezzo.
⚠️ **`SUPABASE_URL` non è vuota**: è una costante scritta a mano nel file.
Controllato prima di dire che era un difetto.

Chiuse in `robots.txt` con tre righe. ⛔ **Dentro il gruppo `User-agent: *`
che c'era già**, non in un gruppo nuovo: due gruppi con lo stesso nome sono
ambigui e ogni motore li tratta a modo suo. **Alla prima stesura l'avevo
fatto sbagliato**, ed è diventato un sabotaggio del banco.

## LA CORREZIONE VERA

`/preventivo.html` e `/preventivo` → **301 su `/cerca-imprese`**: era la
vecchia pagina della richiesta di preventivo, e oggi quel mestiere lo fa la
ricerca delle imprese.

## I BANCHI

`prove/banco-404.js` — **39 verdi**. Controlla il rinvio nuovo, che i quattro
vecchi (registrazione, disdetta) siano ancora al loro posto, che i 106 delle
città e le 22 del 404 non si siano rotti, che `netlify.toml` sia ancora un
TOML valido letto da `tomllib`, e che `robots.txt` abbia **un solo** gruppo
`User-agent: *`.

⛔ **E il verso opposto, che qui è quello che conta di più:** nove indirizzi
che devono restare APERTI a Google (la home, una pagina città, una guida,
`/cerca-imprese`, `/prezzi`, `/blog`…) vengono controllati uno per uno. Un
`Disallow: /` scritto per sbaglio spegnerebbe il sito su Google in una notte.

`prove/sabotaggi-404.js` — **11 su 11 accusati**, fra cui «chiudo tutto il
sito», «chiudo per sbaglio le pagine città» e «le tre righe in un gruppo
nuovo» (l'errore che avevo fatto davvero).


# ⛔ 21 agosto 2026 — I PREZZI DELLA PAGINA MURATORE: DECISIONE DI ALESSIO

**I prezzi restano quelli che ci sono. Non si toccano.**

## Come ci si era arrivati

Su Google, →13← ricerche diverse sul muratore fanno →262← impressioni in due
mesi con **zero clic**, in posizione 12-29. Cinque di quelle chiedono la
tariffa **oraria**.

⛔ **Ma la sezione c'era già.** La pagina ha la tariffa oraria per tutti e
quattro i livelli e il conto di dove finiscono i soldi. **Guardare prima di
costruire** ha risparmiato una serata — di nuovo.

## Cosa è stato confrontato (e resta agli atti, non sul sito)

Il prezzario Regione Lazio 2023, già dentro il gestionale
(`sql/leggi-costo-orario.sql`, provato su PostgreSQL vero):

| livello | prezzario, €/ora | la pagina dice |
|---|---|---|
| 1° comune | 30,35 | ~18 |
| 2° qualificato | 33,70 | ~20 |
| 3° specializzato | 36,28 | ~23 |
| 4° alt. specializzato | 38,23 | ~26 |

E la parte **«in tasca» della pagina è giusta**: verificata su un cedolino
vero di giugno 2026 → →13,96← € netti l'ora, la pagina dice 13,75-14,40. ✓

## ⛔ PERCHÉ NON SI È CAMBIATO NIENTE

Cambiare il costo si porta dietro il prezzo al cliente (→305-390← invece di
210-280) e quindi **il titolo della pagina**, che è quello che porta la gente
da Google. Messo davanti alla scelta, Alessio ha risposto:

> «a me mi metti in difficoltà con questi numeri non li so. lascia i prezzi
> vecchi»

⛔ **E aveva ragione lui.** I numeri della pagina sono i prezzi **di mercato**,
quelli che conosce da 25 anni di cantiere. Il prezzario è un'altra cosa: serve
per i **lavori pubblici**. Gliel'ho messi davanti come se fossero la stessa
cosa, e non lo sono. **Errore mio.**

⚠️ **NON RIPROPORLO.** Se un domani questo confronto torna utile, si riparte
da qui — ma la decisione è sua e oggi è: i prezzi restano.

## ⚠️ SUL CEDOLINO

Della busta paga sono stati presi **solo** netto, ore e paga oraria. Codice
fiscale, indirizzo, nome dell'azienda: non usati, non scritti da nessuna
parte, non finiscono online. Nemmeno qui.


# ⛔ 21 agosto 2026 — CONTROLLO TOTALE DEL GESTIONALE, PRIMA DI APRIRLO

Chiesto da Alessio: *«prima di metterlo online devi fare un controllo totale sul
gestionale imprese e professionisti … dimmi se ci sono falle»*.

Il rapporto intero sta in **`prove-claude/CONTROLLO-GESTIONALE.md`** (non va
online, `prove-claude/` è in `.gitignore`). Qui resta solo quello che serve a
chi riprende il lavoro.

## COME È STATO FATTO

Sei controlli in parallelo, ognuno sul suo pezzo: integrità del codice ·
database · sicurezza · professionisti · regole del progetto · conti e documenti.
La pagina **aperta davvero in Chromium** a 1440×900 e 390×844, le misure lette
dal browser e non dal CSS, i conti delle fatture **rifatti con Node** sulle
funzioni vere estratte dai file.

## ⛔ UN ERRORE MIO, DETTO PER PRIMO

Nel rapporto avevo messo fra le cose che fermano l'apertura che **email e
telefono delle imprese sono scaricabili da chiunque**. Guardando le pagine
pubbliche: sono **pubblici per scelta** — sono il pulsante «Chiama» e il link
mail su `profilo-impresa.html`. Non è una falla, è il prodotto.
⚠️ Quello che resta davvero è che un concorrente **scarica tutta la lista in
un colpo** (`select('*')` su `imprese`, `to anon using (true)`), e per chiudere
quello serve una vista tipo `preventivi_safe` e toccare molte pagine pubbliche:
non è una correzione da mezz'ora. Rimandato, e scritto perché non torni fra le
«cose veloci».

⛔ **La lezione: prima di chiamare falla una cosa, si guarda a cosa serve.**

## CHIUSO OGGI — NEL DATABASE (tre query, già eseguite)

**1. `sql/blocco-piano-premium.sql`** — chiunque si regalava il Premium.
La regola `imprese_update_owner` lascia modificare TUTTE le colonne della
propria riga, `piano` e `premium_pagato` comprese: dalla console del browser
si scriveva `piano='premium', premium_pagato=true` e il Premium non scadeva
più (il controllo notturno guarda solo chi ha una `premium_scadenza` scritta).
- Un guardiano `before insert or update` rimette il piano com'era.
- ⚠️ Passano: `service_role` (Stripe, il controllo notturno), l'SQL Editor, e
  **l'account del fondatore** — l'eccezione è legata alla mail
  `pintoalessio@icloud.com`, e serve al pulsante «Piano» di `js/fondatore.js`.
  Deciso da Alessio: *«lascialo solo per me»*.
- ⚠️ Sull'INSERT non si blocca il piano (se no salterebbe il regalo dei 3 mesi):
  si forza solo `premium_pagato=false`, così nessuno nasce «già pagante» e
  quindi senza scadenza.
- Banco su **PostgreSQL 16 vero** con finto Supabase (ruoli, `auth.uid()`, e il
  trigger del regalo copiato dal file vero): **9 verdi · 6 sabotaggi su 6**.

**2. `sql/blocco-recensioni-finte.sql`** — le recensioni le scriveva chiunque.
`rls-batch5-feedback.sql` aveva `for insert to anon, authenticated with check
(true)`: senza account si scrivevano cento stelline a sé stessi o cento
recensioni brutte a un concorrente.
- ⚠️ Si è potuto chiudere perché **nessuna pagina scrive le recensioni dal
  browser**: passano da `netlify/functions/recensione-invia.js`, che gira con
  `service_role`. La lettura resta aperta a tutti.
- Banco nei due versi: **prima** della correzione le prove 1 e 2 sono ROSSE
  (l'anonimo scrive davvero), **dopo** sono verdi e le altre due restano verdi.

**3. `sql/ai-orienta-tetto.sql`** — il contatore del tetto dell'AI (sotto).
Tabella `ai_orienta_uso` + funzione `ai_orienta_segna(_ip)`, che conta in una
chiamata sola quante ne ha fatte quell'indirizzo oggi e quante in tutto.
Il `+1` è dentro l'`insert … on conflict do update`, quindi due richieste nello
stesso istante non si sovrascrivono. **6 verdi.**

## CHIUSO OGGI — NEI FILE (un push solo, 9 file + 3 sql)

**4. `netlify/functions/ai-orienta.js` — era un rubinetto aperto.**
Nessun controllo, nessun tetto, nessun limite di lunghezza, `claude-opus-4-5`
con **1000 token** per un JSON di tre righe, e il testo del visitatore
**incollato dentro le istruzioni**.
⚠️ Qui **non si può chiedere un accesso**: chi scrive nella nuvoletta è un
visitatore. Quindi non una porta ma un tetto, e tre reti:
1. da dove arriva (Origin/Referer): solo il nostro sito e le anteprime Netlify;
2. quante ne ha già fatte oggi (il contatore del punto 3): 15 per indirizzo,
   400 in tutto — cambiabili dalle variabili di Netlify (`AI_ORIENTA_TETTO_IP`,
   `AI_ORIENTA_TETTO_GIORNO`) **senza push**;
3. la risposta è accettata **solo** se è una delle quattro categorie previste, e
   **la pagina la decide la function**, non il modello.
- max_tokens **200**, e il modello si cambia da Netlify (`AI_ORIENTA_MODELLO`).
- ⚠️ Col tetto pieno **non dà errore**: risponde una cosa che il browser non
  riconosce, e la nuvoletta mostra da sola i quattro pulsanti (`fallback()` in
  `js/assistente-trovaimpresa.js`). Il visitatore non si accorge di niente.
- ⚠️ Se il contatore non risponde si va avanti lo stesso: meglio un assistente
  che funziona che uno rotto. Il tetto vero sulla spesa restano i 200 token.
- **14 verdi · 7 sabotaggi su 7.**

**5. `netlify/functions/ai-claude.js` — si fidava del browser.**
L'impresa arrivava come `impresa_id` nel messaggio e nessuno controllava chi
chiamasse. Gli id delle imprese sono pubblici, quindi con l'id di un altro si
bruciavano le sue 30 chiamate al giorno **e gli si scrivevano righe in
`ai_richieste`** (prompt e risposta scelti da chi chiamava) che lui si ritrova
nel pannello.
- Adesso l'impresa si ricava dall'**accesso** (`auth.getUser(token)`), come già
  fa `crea-checkout-crediti.js`. L'`impresa_id` del messaggio è **ignorato**.
- ⚠️ Aggiunto anche il controllo della **scadenza** del Premium, che prima non
  c'era: chi aveva finito i tre mesi continuava finché il controllo notturno
  non passava.
- ⛔ Ha richiesto **12 punti in 4 file**: `pannello-impresa` · `artigiano` ·
  `professionisti` · `negozio`, tre chiamate per pannello. Nasce
  `_aiIntestazioni()` in ognuno, che attacca `Authorization: Bearer <token>`.
  **Una chiamata nuova a `ai-claude` che non passa da lì torna 401.**
- **12 verdi · 4 sabotaggi su 4.**

**6. `gestionale-app.html` — se un pezzo non arriva, adesso lo dice.**
Da quando il file è spezzato, `RENDER_TAB` (riga ~3161) era **l'unico punto del
blocco che nominava subito le funzioni dei quattro file esterni**. Se uno dei
quattro non arrivava (rete di cantiere, un 503), quella riga lanciava
ReferenceError e **da lì in giù non veniva eseguito più niente**: la pagina
iniziale si disegnava lo stesso e poi nessuna scheda si apriva, senza un
messaggio. Provato davvero con un 503 finto su `js/gest-computo.js`.
- Adesso i nomi si cercano a runtime (`_rt(nome)`): se manca, compare un avviso
  rosso in cima e la singola scheda dice cosa fare.
- ⚠️ Chi sposta una funzione di sezione in un altro file non deve fare niente
  lì: basta che resti una funzione di primo livello.

**7. `js/gest-fatture.js` — la partita IVA coi punti faceva scartare l'XML.**
`fattXmlControlla` valida con `pulita()` (riga ~1603), quindi `012.345.678.97`
**passa il controllo**; poi `fattXmlCostruisci` la scriveva nel file così
com'era. Lo SDI scarta: `IdCodice` vuole 11 cifre. ⚠️ E **il nome del file era
già giusto** (lì le cifre si estraevano a parte): il file si chiamava bene e
dentro era sbagliato.
- Nasce `xpul()` dentro `fattXmlCostruisci`, usata su partita IVA e codice
  fiscale, di chi emette e di chi riceve.
- ⚠️ **Il banco carica il file vero in una VM e genera l'XML per davvero**, poi
  lo rilegge: niente copia-incolla di funzioni a mano.

**8. `js/gest-fatture.js` — «Rimborso spese» non aggiornava il conto.**
`#fa-spese-iva` mancava dall'elenco dei campi ascoltati. Stesso difetto già
preso il 12 agosto su `#fa-cassa` e `#fa-spese`, su un campo aggiunto dopo.
⚠️ **Se domani nasce un altro campo che entra nel conto, la sua riga va aggiunta
in quell'elenco**, se no il riquadro mente di nuovo.

**9. `js/gest-sal-prezzario.js` — il SAL nasceva con la data di ieri.**
Due punti (righe ~324 e ~498) usavano `toISOString().slice(0,10)`, cioè l'ora di
Greenwich: d'estate, fra mezzanotte e le due, uno stato di avanzamento aperto
oggi portava la data di **ieri**. È un documento contabile che si firma.
Era la correzione dell'11 agosto (`todayStr()`): questi due erano rimasti
indietro **perché stanno in un altro file**.

**Fatture (7 e 8): 8 verdi · 4 su 4. SAL (9): 4 verdi · 2 su 2.
Le pagine aperte in Chromium, vecchio contro nuovo: 18 verdi, zero errori nuovi.**

## ⛔ LE REGOLE NUOVE DI OGGI

**1. UN SABOTAGGIO CHE NON PUÒ FARE DANNO VA RISCRITTO, NON CONTATO.**
«Tolgo il controllo dell'accesso» in `ai-claude` restava **verde**: senza gettone
il secondo controllo (`getUser`) blocca lo stesso. Il sabotaggio era sul punto
sbagliato. Riscritto sul controllo che il danno lo fa davvero, ed è rosso.

**2. UN BANCO SU UN DATABASE SPORCO DÀ VERDI E ROSSI FINTI.**
La prima corsa del banco del piano dava rosso su prove sane: il database di
prova teneva ancora lo stato della corsa precedente. E una prova era **verde per
il motivo sbagliato** (`set local` fuori da una transazione non fa niente, quindi
`auth.uid()` era nullo e l'update non toccava nessuna riga). Adesso il banco
**ricostruisce il database da zero a ogni corsa** e ha una controprova in cima
che verifica che il finto Supabase stia davvero fingendo la persona giusta.

**3. CERCARE UNA SCRITTA NEL FILE NON È CONTROLLARE.**
La prova sul «Rimborso spese» cercava `"#fa-spese-iva"` in tutto il file — e c'è
anche nel modulo e nel salvataggio, quindi restava verde col sabotaggio addosso.
Adesso **estrae l'elenco dei campi ascoltati** e guarda dentro quello.
È la stessa lezione del 21 agosto sulle regole del 404.

## ⛔ COSA RESTA, IN ORDINE

**Prima di aprire a chiunque**
1. **Il paywall del gestionale vive solo nel browser.** `haPremium()` mostra o
   nasconde il cancello in JavaScript; nel database **nessuna policy `gest_*`
   nomina il piano**. Un account free usa il gestionale intero saltando il
   cancello. È il punto 1.1 del rapporto, ed è un lavoro vero: o una funzione
   `ha_premium()` dentro ~40 policy, o un altro disegno.
2. **`sql/gest-computo-metrico.sql` è una mina.** Riga ~298: cancella e ricrea
   `gest_computo_voci_calc` con la versione **vecchia** (senza `origine_id` e
   senza `prezzo_da_analisi`), non ha guardie, e in cima c'è scritto «Sicuro da
   rilanciare» — mentre il gestionale, in **14 messaggi d'errore**, invita
   l'utente a eseguirlo. Chi lo fa: la variante torna a elencare tutto due
   volte e **tutti i prezzi costruiti con l'analisi tornano in silenzio a quelli
   scritti a mano**. Stesso innesco in `gest-computo-quantita-3-decimali.sql`.
   Serve una guardia in cima a tutti e due.
3. **La lista delle imprese scaricabile in blocco** (il punto 1.5 corretto qui
   sopra): vista pubblica + pagine da cambiare.

**Prima di far fare una fattura vera**
4. **Il totale del preventivo non è la somma di quello che si stampa.**
   `gestionale-app.html:11593` somma i numeri pieni, le righe si stampano
   arrotondate. Provato: sei righe da 2,675 m² × 3,74 € → il foglio scrive
   **60,03**, la colonna sommata a mano fa **60,00**, e la fattura dice
   **60,00**. La parte fattura è già giusta: è il preventivo che non segue la
   regola «si somma quello che si stampa».
5. **I dati che si perdono senza dirlo.** I due che contano:
   `gestionale-app.html:10739` (le **ore del lavoro** scritte dentro un `catch`
   vuoto → Report ed esportazioni sbagliano ore e margine) e
   `gestionale-operatore.html:1888` (il collaboratore legge «Segnato come
   fatto» e per il titolare il lavoro resta aperto). Poi il fornitore eliminato
   che resta nel «da pagare», le scadenze del mezzo eliminato, e il computo che
   può generare **due preventivi**.

**Prima di far entrare un geometra**
6. **La ricerca in alto riscrive i nomi dei clienti.** `gestionale-app.html:14257`:
   `.ct-t` e `.ct-s` non sono in `_SKIP_UTENTE`, quindi un cliente
   «Edilcantiere Srl» appare «Edilpratica Srl». Nel database è giusto: mente lo
   schermo. Stessa cosa in `rigaCompatta` (`.riga-sub`, nome cliente) e nei
   titoli delle finestre (`.sh-head h3`).
7. **Sul telefono il menù resta «Lavori» per sempre**: `#barra-basso` (riga 458)
   sta **fuori** da `#appview`, che è dove guarda `localizzaPratiche`.
8. **Quattro frasi sgrammaticate**: «Nessun rapportino dal **pratica**», «lo lega
   al **pratica** giusto», «fa sparire **la tempo speso**», «**all'**collaboratore»
   (due punti). Più i cinque avvisi vuoti della schermata principale
   (righe 4332-4337) che non sono in `_FRASI`.
9. **`js/aiuti-gestionale.js` non è caricato da nessuna pagina**: sessanta
   spiegazioni scritte apposta per lo studio (protocollo, cassa, ritenuta,
   imponibile) sono spente. Nessun `<script src>` lo include.

**Legge, non interfaccia — non cominciare senza chiederglielo**
10. **Alla Pubblica Amministrazione non si può fatturare**: formato fisso
    `FPR12` (serve `FPA12`), il codice destinatario è preteso di 7 caratteri
    mentre quello degli uffici pubblici ne ha 6, e manca la **scissione dei
    pagamenti**. Per un'impresa edile i lavori pubblici sono metà del mestiere.
11. **Il subappaltatore edile non può emettere nemmeno una fattura**: qualunque
    riga a IVA 0% blocca il file, e il **reverse charge** (art. 17 c.6 lett. a)
    vuole `N6.7`, che nel progetto non esiste.
    ⚠️ Tutti e due vogliono prima una risposta del commercialista.

**Da guardare su Supabase (non si sa dai file)**
12. `gest_carte_saldo` e `gest_mezzi_carburante` sono viste **create a mano**, non
    in `sql/`, e vengono interrogate per id senza filtro sull'utente: se non sono
    `security_invoker` mostrano saldi e consumi **di tutti**.
    `select relname, reloptions from pg_class where relname in (...)`.
13. Tre file SQL citati nei messaggi d'errore del gestionale **non esistono**
    nella cartella: `aggiungi-commercialista.sql`, `supporto-origine.sql`,
    `supporto-messaggi-lucchetto.sql`. All'utente viene consigliato un rimedio
    che non può eseguire.

✅ **`gest_membri` è a posto**, controllato con una query: RLS accesa e
l'inserimento ristretto a `impresa_id = auth.uid()`. Era il punto da cui
dipendeva tutto il sistema dei collaboratori, ed era l'unico non verificabile
dai file.

## ⛔ DUE VOCI DA TOGLIERE DALLE LISTE (erano già fatte)

Il prompt di questa sessione le dava per aperte, e non lo erano — è la lezione
del 21 agosto sul PDF del SAL, ricomparsa identica:
- **«non spezzare `gestionale-app.html`»**: è già spezzato in quattro file
  dentro `js/`, e la regola l'ha cambiata Alessio la sera del 21.
- **«l'analisi dei prezzi»**: fatta tutta — database, schermata e PDF.
- **«le due righe della Lista per la gara»**: fatte.

⛔ **Quando una cosa si chiude, va tolta dalla lista lo stesso giorno.**


# ⛔ 21 agosto 2026, SERA — IL PUSH DELLA SICUREZZA, E DUE MIEI SBAGLI

## COSA È ONLINE E FUNZIONA

Push `755b6ba` (12 file) + `73359e8` (memoria) + `51d2520` (il ritorno indietro).

1. **`netlify/functions/ai-orienta.js`** — la nuvoletta del sito aveva un rubinetto
   aperto: nessun controllo, nessun tetto, `claude-opus-4-5` con 1000 token per un
   JSON di tre righe, e il testo del visitatore incollato **dentro** le istruzioni.
   Adesso: solo dal nostro sito (Origin), testo tagliato a 300 caratteri, tetto di
   **15 al giorno per indirizzo e 400 in tutto** (`sql/ai-orienta-tetto.sql`),
   `max_tokens` **200**, il modello cambiabile da Netlify (`AI_ORIENTA_MODELLO`), e
   **la pagina la decide la function**, non il modello. Col tetto pieno non dà
   errore: risponde una cosa che il browser non riconosce e la nuvoletta mostra da
   sola i quattro pulsanti. ✅ Provato in produzione: il contatore ha registrato.
2. **`js/gest-fatture.js`** — la partita IVA scritta coi punti finiva nel file
   elettronico così com'era (lo SDI scarta). Ora passa da `xpul()`, come nel
   controllo. E `#fa-spese-iva` è entrato nell'elenco dei campi che aggiornano
   «Il conto».
3. **`js/gest-sal-prezzario.js`** — i due `toISOString()` rimasti: il SAL nasceva
   con la data di ieri fra mezzanotte e le due. Ora `todayStr()`.
4. **`gestionale-app.html`** — se uno dei quattro file esterni non arriva, adesso
   compare un avviso rosso in cima invece di lasciare la pagina muta (`_rt()`).

**Nel database, già eseguiti:** `blocco-piano-premium.sql` ·
`blocco-recensioni-finte.sql` · `ai-orienta-tetto.sql`.

## ⛔ SBAGLIO N. 1 — HO CONCLUSO DA UN INDIZIO SOLO

Il preventivo AI del pannello ha risposto **504** (tempo scaduto). Ho visto che la
mia modifica a `ai-claude.js` aggiungeva un passaggio prima di chiamare il
modello, ho visto un 504 anche sull'assistente di supporto, e **ho concluso che
il mio codice bloccava la function**. Ho fatto rimettere il file com'era.

**Il ritorno indietro non ha risolto niente**: col codice vecchio il preventivo dà
504 uguale. Quindi la mia modifica non c'entrava, e quel push è stato sprecato.

⛔ **LA REGOLA: quando una function va in timeout, si guarda il REGISTRO DI
NETLIFY prima di toccare il codice.** Lì c'è scritto quanti secondi ci ha messo e
dove si è fermata. Io ho tirato a indovinare da un sintomo, e ho indovinato male.
È la stessa famiglia della lezione del 21 mattina («una diagnosi che spiega bene i
sintomi non è una diagnosi»): allora bastarono trenta secondi di `created_at`,
qui bastava aprire il registro.

## ⛔ SBAGLIO N. 2 — `HEAD~1` QUANDO I COMMIT ERANO DUE

Per il ritorno indietro gli avevo dato `git checkout HEAD~1 -- ...`. Ma Alessio
aveva fatto **due** commit (i 12 file, poi `CLAUDE.md`), quindi `HEAD~1` era
proprio il commit con la modifica dentro: git ha risposto «nothing to commit».
⛔ **Per tornare indietro si usa il numero del commit, non `HEAD~1`.** Il numero
si legge nella riga del push precedente (`e236d97..755b6ba`).

## ⛔ IL DIFETTO VERO, CHE RESTA APERTO: IL PREVENTIVO AI VA IN TIMEOUT

`netlify/functions/ai-claude.js`, azione `preventivo`: `claude-sonnet-4-5` con
`max_tokens: 4096`. Le chiamate riuscite scrivono **~2.300 token**, che sono
decine di secondi di scrittura; Netlify taglia la function molto prima.

- ✅ 17:20 del 21 agosto: riuscito, descrizione corta.
- ⛔ 19:45: 504, con «ristrutturazione completa chiavi in mano, demolizione,
  mattonelle, sanitari, rubinetteria e impianti» — cioè un lavoro grosso.

⚠️ **Non è rotto da stasera: è fragile da sempre, e cade proprio sui lavori
grossi**, che sono quelli che contano. In `ai_richieste` non resta traccia delle
volte che cade, perché la riga si scrive DOPO la risposta del modello: quindi il
difetto è invisibile nei conti.

**Da fare, e prima di tutto guardare il registro di Netlify:** o si accorcia
quello che il modello deve scrivere, o il preventivo si costruisce a pezzi
(prima le voci, poi i prezzi), o si passa a una function che lavora in
background e il pannello ripassa a ritirare. ⚠️ L'assistente di **supporto**
invece funziona: è haiku e scrive quattro righe.

## ✅ LA FALLA CHE ERA TORNATA APERTA — RICHIUSA la notte del 21 agosto (vedi la sezione in fondo)

Con il ritorno indietro, `ai-claude.js` **si fida di nuovo dell'`impresa_id` che
gli manda il browser**: con l'id di un altro iscritto (pubblico) si bruciano le
sue 30 chiamate al giorno e gli si scrivono righe in `ai_richieste`.

⚠️ **I quattro pannelli però mandano già il gettone della sessione**
(`_aiIntestazioni()`, 12 punti, tuttora online e innocui): quando si rifà il
controllo lato function, **dal lato browser non c'è più niente da fare**.
Il controllo nuovo deve avere un **tempo massimo** (4 secondi) e non poter restare
appeso.

## COSE VISTE NELLE FOTO, PICCOLE, DA SISTEMARE

- `index.html` — il pulsante arancione dice «Vedi gli artigiani di **roma**»:
  la città arriva dall'indirizzo minuscola e non viene rimessa in maiuscolo.
- `pannello-*.html` — nella pagina «Preventivo AI» spunta a sinistra **una mappa
  dell'Europa** larga un terzo dello schermo. Non c'entra niente.
- `pannello-*.html` — la risposta dell'assistente mostra il **cancelletto** `#`
  del titolo invece di trasformarlo: `chiediSupportoAI` converte solo `**grassetto**`.
- La striscia arancione «Non ho trovato la risposta · Contatta assistenza» sembra
  un secondo modo di chiedere all'AI: è invece il messaggio che arriva ad Alessio.
  Meglio «Scrivi al team di TrovaImpresa».


# ✅ 21 agosto 2026, NOTTE — LA FALLA DI `ai-claude.js` È RICHIUSA

Ripresa dal punto 2 della lista («da dove si riparte»). **Un file solo**:
`netlify/functions/ai-claude.js`. Nei quattro pannelli non è stato toccato
niente: `_aiIntestazioni()` era già online in tutti e 12 i punti, e infatti è
bastato il lato function.

## COSA È CAMBIATO

1. **L'`impresa_id` che manda il browser è IGNORATO.** L'impresa si ricava
   dall'accesso: `auth.getUser(token)` → `imprese.user_id`. Da lì in giù esiste
   un solo id (`impresaId`), usato **sia** per il conteggio delle 30 al giorno
   **sia** per le righe di `ai_richieste`. Con l'id di un altro iscritto adesso
   non si brucia più niente e non gli si scrive più niente nel pannello.
2. **Riga non allineata**: se non c'è nessuna impresa con quel `user_id`, si
   ripiega sull'**email dell'accesso** (`utente.email`), mai su quella del
   messaggio — che si può scrivere a mano dalla console. Chi si era iscritto
   prima di avere l'account continua a funzionare.
3. ⚠️ **Tempo massimo di 4 secondi** (`conTempo()`, costante `TEMPO_ACCESSO`)
   sui due controlli d'accesso: chi sei, e quale impresa sei. Se Supabase non
   risponde la function **non resta appesa** fino al taglio di Netlify: chiude
   con 401 e un messaggio da leggere («La sessione è scaduta. Rientra e
   riprova.»). Il timer viene sempre spento (`finally`), e ha `unref()`.
4. **La scadenza del Premium adesso si guarda** — prima no: chi aveva finito i
   tre mesi continuava finché il controllo notturno non passava. Stessa regola
   di `crea-checkout-crediti.js`: piano fra `premium/mensile/annuale` **e**
   `premium_scadenza`, se c'è, non passata.
5. Nessuna riga in `ai_richieste` viene più scritta **prima** di sapere chi
   chiama: senza accesso valido non si scrive niente a nessuno.

## IL BANCO — sempre nei due versi

`prove/ai-claude/` (nel contenitore di Claude, non nella cartella di Alessio):
`banco.js` · `sabotaggi.js` · un finto `@supabase/supabase-js` che registra
**le query fatte** e **le righe scritte**, così le prove guardano dentro e non
contano soltanto.

**24 verdi · 8 sabotaggi su 8 accusati.**

Il sabotaggio più importante è **S1: il file com'era prima**, che fa diventare
rosse 20 prove su 24 — compresa «l'impresa_id del browser è ignorato». Gli
altri sette rompono un punto per volta: il log sull'id del browser, il
conteggio sull'id del browser, via la scadenza, via il tetto dei 4 secondi,
porta aperta senza gettone, ripiego sull'email del browser, accesso non
verificato.

⚠️ **Ripescata la lezione del pomeriggio** («un sabotaggio che non può fare
danno non prova niente»): togliere solo il controllo del gettone lasciava
verde, perché il secondo controllo bloccava lo stesso. Per questo i sabotaggi
sono scritti sui punti che il danno lo fanno davvero — l'id usato per contare e
per scrivere — e non sulla porta d'ingresso.

## LA PROVA IN PRODUZIONE

Alessio ha aperto il pannello artigiano, sezione Assistenza, e ha chiesto «come
si ricevono le recensioni?»: risposta arrivata regolarmente col gettone della
sessione. ✅

## COSE VISTE NELLA FOTO, ANCORA DA SISTEMARE

- La **mappa dell'Europa** a sinistra c'è anche nella pagina Assistenza del
  pannello, non solo nel Preventivo AI: quindi non è del riquadro dell'AI, è
  più a monte.
- La striscia gialla «Non ho trovato la risposta · Contatta assistenza» sembra
  un secondo modo di chiedere all'AI: meglio «Scrivi al team di TrovaImpresa».

## ⛔ COSA RESTA APERTO (invariato)

Il **preventivo AI in timeout (504)** sui lavori grossi è ancora lì, e questo
push non lo tocca. ⚠️ Prima di mettere mano al codice: **il registro di
Netlify**, come dice la lezione della sera del 21.


# ✅ 21 agosto 2026, TARDA SERA — IL TIMEOUT DEL PREVENTIVO, E I NOMI DEI GESTIONALI

## 1. IL PREVENTIVO AI NON VA PIÙ IN TIMEOUT (punto 1 della lista: CHIUSO)

⛔ **Perché cadeva.** Non si era rotto niente: Netlify taglia una function
normale a **26 secondi**, e sui lavori grossi il modello scrive ~2.300
parole-macchina, cioè il doppio del tempo. Alle 17:20 (descrizione corta)
riusciva, alle 19:45 («ristrutturazione chiavi in mano») no. Alessio ha contato
i secondi a mente: «21, forse 26». Quello era il muro.

⚠️ La lezione della sera («guarda il registro di Netlify») resta valida e non è
stata aggirata: il registro non è stato aperto, ma la strada scelta **toglie di
mezzo la domanda**, perché il tetto passa da 26 secondi a 15 minuti.

**Deciso da Alessio: la strada definitiva, non la scorciatoia.** («io sono
sempre per fare un lavoro migliore e definitivo»)

- **`sql/ai-lavori.sql`** (nuovo, già eseguito): la tabella dove il preventivo
  viene depositato mentre si scrive. Lucchetto: ognuno legge SOLO i suoi
  (`impresa_id in (select id from imprese where user_id = auth.uid())`, lo
  stesso schema di `rls-batch1`); dal browser non si scrive niente.
  ⛔ **`imprese.id` è un NUMERO (bigint), non un uuid** come nelle altre
  tabelle. Scritto uuid, il file non parte proprio: «incompatible types: uuid
  and bigint». Preso sul database vero, dopo che il banco aveva dato verde
  perché il suo schema di prova aveva l'id uuid — **è la trappola del 9 agosto,
  ricomparsa identica: lo schema di prova si copia da quello vero, non si
  immagina.** Adesso c'è un sabotaggio apposta (S6) che rifà quello sbaglio e
  il banco si ferma subito.
- **`netlify/functions/ai-preventivo-background.js`** (nuovo): il nome che
  finisce per `-background.js` è quello che dice a Netlify «rispondi 202 subito
  e lascia lavorare fino a 15 minuti». ⛔ Se qualcuno lo rinomina, il tetto
  torna a 26 secondi e il difetto ricompare. Dentro: gli stessi controlli
  d'accesso di `ai-claude.js` (gettone, impresa dall'accesso, Premium con
  scadenza, tetto 30 al giorno), la riga «in_corso» creata **prima** di
  chiamare il modello, un tempo massimo di 4 minuti sul modello
  (AbortController), e in ogni finale la riga viene chiusa: mai lasciata
  «in_corso». ⚠️ Nel registro di Netlify adesso resta scritto **quanti secondi
  ci ha messo**: il numero che quella sera non aveva nessuno.
- **I 4 pannelli**: nasce `_aiPreventivo(prompt, mostra)` accanto a
  `_aiIntestazioni()`. Manda il lavoro, riceve 202, e **ripassa a ritirare ogni
  due secondi** leggendo `ai_lavori` (fino a 5 minuti; se la riga non nasce
  entro mezzo minuto avvisa che la sessione è scaduta). Sostituisce le **due**
  chiamate per pannello: la lettera del «Preventivo AI» degli Strumenti e le
  voci del preventivo dentro la scheda. ⚠️ Erano due, non una: la stima data ad
  Alessio («un punto per pannello») era sbagliata ed è stata corretta subito.

**Banchi:** function 22 verdi · 9 sabotaggi su 9 · SQL su PostgreSQL 16 vero 13
verdi · 6 sabotaggi su 6 · l'attesa nel pannello (funzione estratta dal file
vero, orologio finto per provare i 5 minuti) 12 verdi · 6 sabotaggi su 6 · le 4
pagine aperte in Chromium a due misure, zero errori nuovi.

⚠️ **Due lezioni sui banchi, di stasera:**
1. Un sabotaggio SQL («do il permesso di scrivere a chi ha l'account») restava
   VERDE: senza una regola permissiva il lucchetto blocca lo stesso. Riscritto
   sul punto che il danno lo fa davvero — **la regola copiata a occhio**, che è
   esattamente com'era nata la falla delle recensioni.
2. Una prova che girava a vuoto restava **zitta** invece di diventare rossa.
   Adesso una prova che non finisce entro dieci secondi è rossa.

✅ Provato in produzione da Alessio: preventivo generato senza errori.

## 2. I NOMI DEI GESTIONALI — decisione di Alessio

**La domanda era: si può dividere il gestionale impresa da quello dei
professionisti?** I numeri messi sul tavolo: sono **24.323 righe** (15.361 la
pagina + 9.000 i quattro file), e quello che cambia davvero fra impresa e
studio sono **~101 punti**, meno dell'1%. Dividere = due copie del 99% che è
uguale, e ogni correzione pagata due volte.

⛔ **Deciso: NON si divide.** Un motore solo, una faccia per mestiere — come
era già stato fatto per lo studio tecnico.

`gestionale-app.html`: nasce `_NOMI_GESTIONALE` + `nomeGestionale()` +
`applicaNomeGestionale()`, **un punto solo** che decide il nome e lo scrive nel
titolo grande e nella linguetta del browser:
- impresa → **Gestionale impresa**
- artigiano → **Gestionale artigiano**
- professionista → **Gestionale studio** (scelto da Claude su delega: è la
  parola che il gestionale usa già dentro — gruppo «Studio tecnico» — quindi
  non si introduce un terzo termine)
- chi non ha ancora scelto il tipo → **Il tuo gestionale**, come prima.

⚠️ Il nome dello studio prima stava scritto **dentro** il ramo del
professionista: spostato nell'unico punto, se no la stessa regola finiva in due
posti. C'è un sabotaggio (S3) che diventa rosso se qualcuno la rimette lì.

Nei 4 pannelli il riquadro grande dice adesso «Apri gestionale impresa /
artigiano / studio / negozio».

**Banco:** 11 verdi · 5 sabotaggi su 5 · gestionale aperto in Chromium (vecchio
contro nuovo, due misure): zero errori nuovi, e **i quattro nomi provati dentro
la pagina vera**.

## ⛔ 3. IL GESTIONALE È CHIUSO, E LA PORTA PER ALESSIO C'ERA GIÀ

Alessio ha chiesto «perché non mi apri il gestionale?»: è `MANUTENZIONE = true`
(riga ~15272), deciso da lui il 20 agosto. Claude si è offerto di costruirgli
un'eccezione — **e l'eccezione esisteva già**: `AMMESSI` con la sua mail, più la
scorciatoia **`?chiave=apri`**. È la lezione n. 1 («prima di costruire, guarda
se c'è già»), ricomparsa: trenta secondi di lettura del file l'avrebbero evitata.

⚠️ **Perché la sua mail non basta:** `ammesso()` guarda l'email scritta nella
riga `imprese` (`row.email`), non quella dell'accesso. Se nella riga c'è
un'altra mail, il fondatore si chiude fuori da solo. Query per verificarlo (non
ancora eseguita):
`select i.email, u.email from public.imprese i join auth.users u on u.id=i.user_id where u.email='pintoalessio@icloud.com';`
Se sono diverse, la correzione è far guardare tutte e due le mail.

⛔ **Prima di aprirlo a tutti resta il punto vero: il cancello del Premium vive
solo nel browser** (punto 3 della lista). Un account free si prende il
gestionale intero.

## ⛔ 4. IL PREVENTIVO AI: I PREZZI SONO IL DOPPIO DEL VERO

Su un bagno da 15 mq ha scritto **14.600 € + IVA**. Alessio: «un bagno completo
di tutto, anche lavandino, rubinetti e porta, **6/7 mila a Rieti**; a Roma in un
quartiere di lusso, zona difficile, al decimo piano, aumenta». Il bagno di
riferimento è di **6 mq**.

Cosa è sbagliato, oltre al prezzo:
- ⚠️ **L'IVA**: mette 10% su tutto. Sanitari e rubinetteria sono «beni
  significativi»: il 10% vale solo fino al valore della manodopera, il resto va
  al 22%. Su un bagno capita sempre. **Da confermare col commercialista.**
- **Si inventa cose sull'impresa**: showroom, assicurazione RC, sopralluogo
  gratuito, garanzie. Roba che decide Alessio, non l'AI.
- **Nessun aggancio a Rieti**: le istruzioni di quella schermata
  (`generaPreventivoDash`) dicono solo «un preventivo professionale con stima
  dei costi». Quelle delle voci (`generaVociPreventivoAI`) invece nominano
  Rieti/Lazio 2026 — ed è per questo che lì i numeri sono più sensati.
- **I simboli**: `#`, `**` e le tabelle escono come sono, perché il riquadro è
  una casella di testo semplice.

⛔ **La regola della skill guide-prezzi vale anche qui: i prezzi sono i SUOI,
non si inventano.** Nelle istruzioni nuove l'AI dovrà scrivere «da valutare in
sopralluogo» quando non ha un riferimento sicuro, invece di sparare una cifra.

Mancano ancora, chiesti e non ancora avuti: €/mq di una ristrutturazione
completa a Rieti · la giornata di un operaio · quanto aggiunge Roma in
percentuale.

## LA FINESTRELLA DEL PREVENTIVO — segnalato da Alessio

Nel «Preventivo AI» degli Strumenti il riquadro è alto quattro righe per un
preventivo di due pagine, e **non si può salvare, stampare, cancellare né
capire che si può modificare** (il testo È modificabile: è una textarea, ma non
si vede). Proposto e non ancora fatto: riquadro alto il triplo, «Stampa / Salva
come PDF», «Svuota e rifai», e una riga che dica che si può correggere a mano.
⚠️ Salvare nello Storico preventivi NON è un lavoro da mezz'ora: lo storico
vuole le voci una per una (descrizione, quantità, prezzo), questo è una lettera.

## ⛔ IL PROSSIMO PERCORSO: IL GESTIONALE ARTIGIANO

Aperto da Alessio: «iniziamo un nuovo percorso: gestionale artigiano», e poi
«via gli strumenti da tutti i pannelli, non servono a niente, nessuno pagherebbe
per averli».

Il foglio per decidere è in **`prove-claude/GESTIONALE-ARTIGIANO.md`** (non va
online). In sintesi:
- Il tipo **artigiano c'è già** nel database (`imprese.tipo`), non va aggiunto.
- ⛔ Oggi l'artigiano **cade nel ramo dell'impresa edile** (`adattaMenuImpresa`)
  e si ritrova accesi **Computo metrico, Prezzario e Stati di avanzamento** —
  roba da appalti che un idraulico non aprirà mai.
- Le 22 voci sono divise in tre gruppi: 10 nel cuore, 8 da decidere con lui
  (Fornitori, Mezzi, Attrezzature, Squadra, Agenda operatore, Report, Carte,
  Mappa), 4 da togliere (le tre da appalti + Crediti formativi).
- Le parole: per lo studio «Lavori» è già diventato «Pratiche». Per l'artigiano
  la domanda è se «Lavori» debba diventare «Interventi».

⚠️ Alessio ha detto **«aspetta a partire, devo capire»**: il foglio è suo, si
parte quando lo dice lui.


# ✅ 21 agosto 2026, NOTTE FONDA — VIA IL RIQUADRO «STRUMENTI» DAI 4 PANNELLI

Deciso da Alessio: *«prima cosa facciamo sparire gli strumenti, non servono
più, compreso preventivo AI, perché poi saranno all'interno del gestionale»*.
È il punto 2 della lista «da dove si riparte»: **CHIUSO**.

## COSA È STATO TOLTO

Il riquadro **🛠️ Strumenti** con le sue **7 caselle** — Calcolatrice edile ·
Agenda · Scadenze fiscali · Promemoria · Preventivi · Storico preventivi ·
Preventivo AI — da `pannello-impresa` · `artigiano` · `professionisti` ·
`negozio`. Nient'altro è stato toccato.

Dietro ogni casella non c'era una finestrella: c'era una **schermata intera**
del pannello. Quindi sono andate via, in ogni file:
- il riquadro (~38 righe);
- le **7 schermate** `sec-calcolatrice`, `sec-agenda`, `sec-scadenze-fiscali`,
  `sec-preventivo-ai`, `sec-promemoria`, `sec-crea-preventivo`,
  `sec-storico-preventivi` — da 21 schermate a 14, provato nel browser vero;
- lo `<script src="strumenti-comuni.js">` (agenda, scadenze fiscali,
  promemoria). ⚠️ **Il file `strumenti-comuni.js` è rimasto nella cartella ma
  non lo carica più nessuno.** Si può cancellare quando si vuole.
- ~20 funzioni per pannello rimaste senza porta, compresa `_aiPreventivo`
  (l'attesa del preventivo in background) e `generaVociPreventivoAI`.

**Righe: impresa 6.467→5.372 · artigiano 5.714→4.620 · professionisti
6.680→5.596 · negozio 6.226→5.133.** In tutto **~4.400 righe in meno.**

⛔ **`strumenti-cantiere.js` NON è stato toccato**: sono i Cantieri, che non
stavano negli Strumenti. Restano.

## ⚠️ COSA VUOL DIRE, IN CONCRETO

1. **Il Preventivo AI dei pannelli non esiste più.** Era l'unico posto dove
   vivevano `ai-preventivo-background.js` e `sql/ai-lavori.sql` (il lavoro
   della notte del 21). ⛔ **Quella strada adesso non la usa nessuno**: la
   function e la tabella restano lì, pronte, ma scollegate.
2. **Nel gestionale il Preventivo AI c'è già** — sezione Preventivi, pulsante
   «✨ Genera con AI» (`new-prev-ai` → `prevForm(null,null,true)`), più
   «Compila con AI» su clienti, lavori, fatture e computo. ⛔ Ma passa da
   un'**altra strada**: la Edge Function Supabase `ai-generate`
   (`js/ai-integrazione.js`, `AI.dati`), col sistema a **crediti** — e i
   crediti nascono a **zero per tutti** (`ai_accounts.monthly_quota = 0`).
   **Quindi oggi, nel gestionale, l'AI non parte per nessuno.**
   ⚠️ Sono due mondi paralleli: Netlify+background (gratis, 15 minuti) contro
   Supabase+crediti (tetto 26 secondi). **Prima o poi va scelta una sola
   strada.** Non deciso: Alessio ha detto di togliere e basta.
3. **I dati vecchi restano nel database ma senza porta**: `agenda_appuntamenti`,
   `scadenze_fiscali`, `promemoria`, `preventivi_creati`. Nessuna pagina le
   nomina più. Chi ci aveva scritto qualcosa non lo rivede. Le tabelle NON sono
   state cancellate.

## IL BANCO — sempre nei due versi

`prove/strumenti/` (nel contenitore di Claude, non nella cartella di Alessio):
`banco.js` · `sabotaggi.js`. Le prove **guardano dentro**: leggono il
JavaScript con un lettore vero (acorn), non cercano scritte.

**14 verdi · 12 sabotaggi su 12 accusati · le 4 pagine aperte in Chromium a
due misure (1440×900 e 390×844), vecchio contro nuovo: zero errori nuovi.**

⚠️ **Tre lezioni di stanotte, tutte già scritte qui sopra e ricomparse:**

1. **Un `document.addEventListener` scritto a mano non è «chiamato da
   nessuno»: gira da solo.** Teneva in vita tutto il Preventivo AI dopo che la
   sua schermata era sparita. Una pulizia che guarda solo «chi mi chiama» non
   lo vede.
2. **Cercare una scritta nel file non è controllare** (lezione del 21
   pomeriggio, ricomparsa identica). La prova «l'assistenza è rimasta in
   piedi» cercava `_aiIntestazioni` nel testo — e il nome resta anche quando
   la funzione è sparita e solo la **chiamata** è rimasta: cioè proprio quando
   il file è rotto. Adesso guarda che sia **dichiarata**.
3. **Un sabotaggio appeso in fondo al file non fa danno**: fuori dai tag
   `<script>` è testo, non codice. Due sabotaggi restavano verdi per questo.
   Riscritti **dentro** l'ultimo blocco di codice.

⛔ E una regola nuova: **il codice già morto prima non si tocca.** La prima
corsa della pulizia si stava portando via anche `mostraLogin`, `avviaMFA`,
`caricaSessioneConDati` — roba morta da chissà quando, che non c'entrava col
lavoro di stasera. Adesso la pulizia calcola prima cosa era già orfano e lo
lascia dov'è; c'è un sabotaggio (S10) che diventa rosso se qualcuno riallarga
il taglio.

## ⚠️ DUE COSE TROVATE E **NON TOCCATE** (c'erano già da prima)

1. ⛔ **`pannello-impresa.html` finisce a metà frase.** L'ultimo `<script>`
   non è mai chiuso: il file si interrompe dentro
   `sottoscriviRealtimeMessaggi()`, alla riga `msgRealtimeChannel` — senza
   punto e virgola, senza `}`, senza `</script>`, senza `</body>`.
   23 `<script` aperti, 22 chiusi. **Verificato: è identico nel file di prima,
   non l'ha causato questo lavoro.** Conseguenza probabile: quel blocco non
   parte, quindi **i messaggi in tempo reale del pannello impresa sono
   spenti**. Da guardare, è grosso.
2. **La mappa dell'Europa a sinistra** (vista nelle foto di Alessio): è
   `#sidebar-map`, un Leaflet aperto a `setView([41.9, 12.5], 5)` in fondo a
   tutti e 4 i pannelli. Non c'entra col riquadro dell'AI ed è per questo che
   si vedeva anche nella pagina Assistenza. Zoom 5 = mezza Europa.

## COME È STATA FATTA

Non a mano: uno script (`taglia.py`, nel contenitore) che
1. toglie il riquadro e le 7 schermate contando i `<div>` per trovare dove
   finiscono;
2. toglie gli ascoltatori che guardavano pulsanti spariti;
3. toglie **a giro** le funzioni che non si raggiungono più partendo da fuori
   (dall'HTML e dal codice che gira da solo) — così cadono anche quelle che si
   chiamavano fra loro in tondo;
4. toglie le intestazioni a commento rimaste appese sopra il vuoto.

⛔ Una funzione si toglie **solo** se il suo nome non compare più da nessuna
parte, nemmeno negli altri file che la pagina carica.


## ✅ CHIUSO SUBITO DOPO — LA CODA DI `pannello-impresa.html`

Alessio: *«sistemiamolo adesso»*. Fatto, ed era **più grosso di come l'avevo
raccontato**.

⛔ **Non erano «i messaggi in tempo reale»: era TUTTA la chat del pannello
impresa.** Il file si interrompeva a
`  msgRealtimeChannel` — senza il resto della riga, senza `}`, senza
`</script>`, senza `</html>`. Il browser, arrivato a fine file, scarta
**l'intero blocco** di codice: cioè le **224 righe** della chat.

**Provato nel browser vero** (`prove/strumenti/prova-chat-impresa.js`), prima
e dopo:
- PRIMA: `sottoscriviRealtimeMessaggi` → **non esiste**, `renderMessaggioChat`
  → **non esiste**. Cioè la sezione Messaggi del pannello impresa era morta.
- ADESSO: esistono tutte e due.

⚠️ **E in console non compariva NIENTE**: zero errori di sintassi, in tutti e
due i casi. Un blocco `<script>` che finisce con il file viene chiuso in
silenzio dal browser e buttato via senza un fiato. **Un difetto muto**: per
questo nessuno se n'era accorto.

**La coda non è stata inventata.** È identica, riga per riga, a quella degli
altri tre pannelli (artigiano, professionisti, negozio): stesso canale
`chat_messaggi_impresa_ + impresaCorrente.id`, stesso filtro, stesso
`.subscribe()`. Confrontato tutto il blocco Messaggi: **224 righe su 224
identiche** all'artigiano, mancava solo la coda.

**Due prove nuove al banco** (adesso 16 verdi · 14 sabotaggi su 14):
- *nessun pannello finisce a metà frase*: `<script>` aperti = chiusi, e il
  file finisce con `</html>`;
- *i messaggi in tempo reale sono attaccati davvero*: dentro la funzione ci
  devono essere `sb.channel(`, `postgres_changes`, `chat_messaggi` e
  `.subscribe()`.

⚠️ **Due sabotaggi hanno insegnato qualcosa, di nuovo:**
1. La prova «il codice non si legge peggio di prima» **confrontava vecchio
   contro nuovo** — e siccome `pannello-impresa.html` era già rotto in coda,
   una graffa in più nello stesso file **non la faceva diventare rossa**: uno
   contro uno, «non peggio». ⛔ **Un difetto vecchio che resta lì fa da
   scudo a quelli nuovi.** Ora che il file è sano la misura è assoluta: zero
   blocchi illeggibili, punto.
2. Il sabotaggio «tolgo `.subscribe()`» restava verde: di `.subscribe()` nel
   pannello negozio ce ne sono **due**, e colpiva la prima, che è di un altro
   canale e non fa danno ai messaggi. Riscritto sull'ultima, quella dentro la
   funzione dei messaggi.


## ✅ 21 agosto, NOTTE FONDA — «VAI DAL CLIENTE»: L'INDIRIZZO NELLA BARRA LATERALE

Chiesto da Alessio: *«possiamo aggiungere una funzione, scrivere un indirizzo
se vuole sapere che strada fare per arrivare a un nuovo cliente»*, e poi
*«scriviamo la via e gli appare un pin che poi allarga l'immagine fino a
capire dove sta»*, e *«non a tutta pagina»*.

### ⛔ PRIMA: DUE MIEI SBAGLI, DETTI PER PRIMI

1. **Stavo per togliere la mappa della barra laterale.** Avevo letto «è senza
   scopo» come «toglila». Alessio: *«la mappa sta in tutti i pannelli perché
   la devi togliere?»* e poi *«non la togliere, non ho chiesto quello»*.
   Aveva ragione: **una cosa che sta in tutti e quattro i pannelli è una
   scelta, non un residuo.** ⛔ La regola: quando una cosa è ripetuta ovunque,
   prima di toglierla si chiede a cosa serviva. La rimozione era rimasta solo
   nel contenitore di Claude: **sui file di Alessio non è mai arrivata.**
2. L'avevo fatta **a tutta pagina**. Bocciato: *«non a tutta pagina»*. Ora è
   un riquadro al centro, con il pannello che si vede dietro.

### COSA FA

Nella barra laterale, **sotto la mappa**: «📍 Devi andare da un cliente?», un
campo per l'indirizzo e il pulsante **«Vedi dove sta»** (anche col tasto invio).
Scritto l'indirizzo, si apre **un riquadro grande al centro** (760×560, mai
oltre l'80% dello schermo) con la mappa allo **zoom 17** — la via con le case
intorno — e il segnalino sul punto. Sotto, due pulsanti: **«🧭 Fammi strada»**,
che apre il navigatore del telefono, e «Chiudi».

- ⛔ **Il navigatore è quello vero, non disegnato da noi**: su iPhone Mappe di
  Apple, altrove Google Maps. Una linea dentro un riquadro non ha voce, né
  traffico, né «gira a destra»: a chi guida non serve.
- Il punto di partenza **non si scrive**: lo mette il telefono, che sa dov'è.
  Così non si chiede la posizione a nessuno.
- Gli indirizzi si trasformano in punti con **Nominatim** (OpenStreetMap), lo
  stesso servizio che usa già `mappa.html`: gratis, senza chiavi. Si chiede
  solo l'Italia, una risposta sola, e ogni indirizzo si chiede **una volta**
  (poi resta in memoria per quella sessione).

### ⛔ UN FILE SOLO: `js/vai-dal-cliente.js`

Nei 4 pannelli è stata aggiunta **una riga sola**:
`<script src="/js/vai-dal-cliente.js" defer></script>`, subito dopo Leaflet.
Tutto il resto — schermata, stile e comportamento — sta nel file nuovo, che si
attacca da solo sotto `#sidebar-map`.

⚠️ È la regola «una regola che sta in due posti non si sistema a metà»: una
correzione qui vale per impresa, artigiano, studio e negozio. Se fosse stato
copiato quattro volte, ogni ritocco andava pagato quattro volte.

### IL BANCO — nei due versi

`prove/vai-dal-cliente/` (nel contenitore di Claude): `banco.js` ·
`sabotaggi.js`. Le prove aprono la pagina **in un browser vero**, con un
**finto Nominatim** e un **finto Leaflet** che registrano cosa gli viene
chiesto: quale punto, quale zoom, quanti segnalini, quale indirizzo web.

**19 verdi · 19 sabotaggi su 19 accusati.**

Quello che le prove guardano davvero: il riquadro **non** è a tutta pagina ·
lo zoom è stretto sulla via · il navigatore va sulle coordinate giuste ·
iPhone→Mappe e Android→Google Maps · si chiude con Esc, col pulsante e
cliccando fuori ma **non** cliccando dentro · «indirizzo che non esiste» e
«rete che non risponde» sono detti **diversi** · col servizio fermo il
pulsante **torna cliccabile** · un nome con del codice dentro **non** diventa
codice · sul telefono il riquadro ci sta e i pulsanti sono grandi abbastanza.

⚠️ **Tre cose imparate stanotte, sui banchi:**
1. **Il banco ha trovato un difetto vero prima di Alessio**: sul telefono il
   pulsante «Fammi strada» era alto **39 px**. Sotto i 44 il dito lo sbaglia.
2. **La prova era comunque troppo generosa.** Chiedeva «almeno 40», e un
   sabotaggio che lo riduceva a 43 restava verde. ⛔ Una prova va scritta sulla
   misura che conta davvero (44), non su una comoda.
3. **Due sabotaggi erano scritti sul punto sbagliato.** «Rimetto il riquadro a
   tutta pagina» cambiava solo la larghezza massima, ma restava il margine
   attorno — quindi non era a tutta pagina e la prova aveva ragione a stare
   verde. Riscritti dove il danno si fa davvero.

### ⛔ CORREZIONE, la sera stessa: NIENTE FINESTRA

Prima versione: apriva un riquadro grande al centro. Bocciata da Alessio —
*«non capisco perché si deve aprire, lasciala così come sta, aggiungi
solamente una via con la città e basta»*, e *«tanto lavoro che vuoi fare non
serve»*.

⛔ **La lezione: quando chiede una cosa piccola, si fa quella piccola.** Aveva
chiesto un campo per l'indirizzo; è arrivato un campo, una finestra, un
riquadro con l'intestazione, tre pulsanti e la chiusura con Esc. Il resto era
roba che non aveva chiesto — e ogni pezzo in più è un pezzo da mantenere.

**Come è adesso, e basta così:** sotto la mappa della barra laterale c'è un
campo. Scrivi «Via Roma 12, Rieti», premi «Vedi dove sta» (o invio), e **la
mappa che sta già lì** si sposta sul punto col segnalino, zoom 17. Sotto
compare **«🧭 Fammi strada»**, che apre il navigatore del telefono. Nessuna
finestra si apre, niente copre il pannello.

**Banco rifatto: 18 verdi · 19 sabotaggi su 19.** C'è una prova apposta —
la n. 3 — che gira per la pagina a cercare qualsiasi cosa larga più di mezzo
schermo comparsa sopra il pannello: se un domani qualcuno rimette una
finestra, diventa rossa.


# ⛔ 21 agosto 2026, FINE SERATA — L'ORDINE DEI PROSSIMI TRE LAVORI

Deciso da Alessio prima di chiudere. **Si riparte da qui, in quest'ordine.**

## 1. IL GESTIONALE ARTIGIANO — deciso tutto, si costruisce e si collauda
### ✅ FATTO il 22 agosto 2026 — il resoconto è l'ultima sezione del file.

⛔ **NON è un file suo. È la terza faccia di `gestionale-app.html`**, come lo
studio tecnico. Alessio ha chiesto due volte se non fosse meglio un file
separato; la risposta, con i numeri sul tavolo, è no: 24.323 righe di cui
cambia meno dell'1%, e un file separato vuol dire pagare due volte ogni
correzione. **Confermato da lui.** Non ridiscuterlo.

**Le 22 voci, segnate da Alessio il 21 sera** (foglio in
`prove-claude/GESTIONALE-ARTIGIANO.md`):

- **Restano, 15**: Riepilogo · Lavori · Clienti · Preventivi · Fatture ·
  Scadenzario · Calendario · Richieste dal sito · Galleria · Cestino
  (le 10 del cuore) **+ Fornitori · Mezzi · Attrezzature · Report · Mappa**.
- **Si spengono, 7**: Computo metrico · Prezzario · Stati di avanzamento ·
  Crediti formativi (le 4 da appalti) **+ Squadra · Agenda operatore · Carte**.
- **Le parole**: «Lavori» diventa **«Lavori e interventi»**. ⚠️ Non
  «Interventi» e basta: Alessio ha chiesto di tenere **tutte e due le
  parole**, così va bene sia a chi fa cantieri sia a chi fa mezze giornate.

⚠️ **Il nodo da non dimenticare**: Attrezzature resta ma Squadra si spegne, e
in Attrezzature c'è «chi ce l'ha in mano», che pesca dalla Squadra. Per
l'artigiano quel campo va cambiato in una **nota scritta a mano**, se no è una
tendina vuota.

**Come si fa**: nasce `adattaMenuArtigiano()` accanto a
`adattaMenuProfessionista()` (riga ~963) — oggi l'artigiano cade dentro
`adattaMenuImpresa()` (riga ~1071), ed è da lì che gli arrivano computo,
prezzario e SAL. ⛔ **Si nasconde soltanto**: i dati restano nel database e
tornano da soli se cambia il tipo. Un file toccato, un push.

## 2. IL GESTIONALE NEGOZIO — «un lavoro iniziato e mai finito»

Parole di Alessio: *«è rimasto molto indietro, come i professionisti»*.
`gestionale-negozio.html` è un file **davvero separato**, e con ragione: ha un
mestiere suo (magazzino, giacenze, scarico merce). 204 KB contro 934.
⚠️ Il prezzo che paga è che **le correzioni fatte sul gestionale principale lì
non arrivano mai**. Quello che si sa già essere aperto (dal 7 agosto):
`esc()` sui dati nelle card `neg_*` (self-XSS) · il banner di errore-lettura
sul riepilogo · la numerazione dei preventivi fatta dal browser (max+1, due
dispositivi = due preventivi con lo stesso numero).

## 3. IL GESTIONALE NOLEGGIO — da far entrare dentro gli altri due

Idea di Alessio: *«nelle imprese ci possono stare noleggiatori e nei negozi
noleggi di attrezzature»*. **Ha ragione, e i numeri gli danno ragione:**
- `gestionale-noleggio.html` è **2.233 righe**: non è un gestionale, è già un
  **modulo**;
- usa **tre sole tabelle sue** — `nol_mezzi`, `nol_clienti`, `nol_noleggi` —
  e per il resto pesca già da `gest_clienti`, `gest_lavori`, `gest_azienda`,
  `neg_prodotti`, `neg_fornitori`: **è già imparentato con impresa e negozio**;
- ⛔ **oggi non è collegato a niente**: l'unico posto che ci porta è un link in
  `admin.html`. Non esiste un tipo «noleggio» fra le iscrizioni, quindi
  nessun iscritto può arrivarci. 159 KB fermi.

Come diventerà: una **sezione «Noleggio»** che si accende solo per chi dice
«io noleggio», spenta per tutti gli altri.

⚠️ **Da controllare PRIMA di attaccarlo a qualcuno**: le tre tabelle `nol_*`
**non hanno un file SQL nel progetto** — sono state create a mano su Supabase,
quindi nessuno sa com'è fatto il loro lucchetto. È lo stesso rischio già
segnalato per `gest_carte_saldo` e `gest_mezzi_carburante`. Query da fare:
`select relname, relrowsecurity from pg_class where relname like 'nol\_%';`

## ⛔ UNO SBAGLIO MIO, DELLA SERA

Alessio aveva scritto: **non aprire `gestionale-negozio.html` e
`gestionale-noleggio.html`**. Per rispondere alla sua domanda sul noleggio ho
letto dentro `gestionale-noleggio.html` l'elenco delle tabelle e il numero di
righe. Solo quello, non il contenuto — ma la regola era secca, e gliel'ho
detto subito. ⚠️ La prossima volta si chiede prima.


# ✅ 22 agosto 2026 — IL GESTIONALE ARTIGIANO, LA TERZA FACCIA

Punto 1 della lista «da dove si riparte»: **CHIUSO**. Un file toccato,
`gestionale-app.html`. Nessun file nuovo, nessuna tabella nuova, nessuna query.

## COSA VEDE ADESSO L'ARTIGIANO

**15 voci**: Riepilogo · Lavori e interventi · Clienti · Preventivi · Fatture ·
Scadenzario · Calendario · Richieste dal sito · Galleria · Cestino ·
Fornitori · Mezzi · Attrezzature · Report · Mappa.

**7 spente**: Computo metrico · Prezzario · Stati di avanzamento ·
Crediti formativi · Squadra · Agenda operatore · Carte.

⛔ **Si nasconde soltanto**: i dati restano nel database e le voci tornano da
sole se `imprese.tipo` cambia. Nessuna cancellazione.

## COME È FATTO

- Nasce **`adattaMenuArtigiano()`** accanto a `adattaMenuProfessionista()`, e
  nel bivio di `logRuoloUtente()` c'è un ramo nuovo: prima l'artigiano cadeva
  in `adattaMenuImpresa()`, ed **è da lì** che gli arrivavano computo,
  prezzario e SAL.
- ⚠️ **Le voci non erano tutte accese allo stesso modo.** `computi`,
  `prezzario`, `sal` e `crediti` nell'HTML nascono già con `display:none`: le
  accendeva **solo** il ramo dell'impresa (le prime tre) e quello del
  professionista (tutte e quattro). All'artigiano bastava non passare di lì.
  Quelle da spegnere davvero a mano erano tre: `squadra`, `agenda`, `carte`.
  Le altre quattro le rimetto a `none` lo stesso, esplicitamente: se un domani
  qualcuno le accende in un terzo posto, l'artigiano non se le ritrova addosso
  in silenzio.
- La parola: **«Lavori» → «Lavori e interventi»**, tutte e due, come chiesto.

## ⛔ E QUI HO SBAGLIATO, PER LA SECONDA VOLTA LO STESSO SBAGLIO

Avevo scritto «la parola sta in TRE posti» — menu, titolo della sezione, barra
in basso del telefono — e mi ero convinto che bastasse. **Alessio ha mandato la
fotografia del gestionale vero, online: la scheda del Riepilogo diceva ancora
«Lavori».**

⚠️ È lo **stesso identico inciampo del computo, il 20 agosto**: lì erano dieci
posti invece di quattro, e anche lì il quarto dimenticato era **la scheda del
Riepilogo**. Sta scritto in questo file, e l'ho rifatto uguale un mese dopo.

⛔ Ha anche chiesto se non fosse un effetto del suo pannello admin. **No**: la
barra FONDATORE («Vedi come: Artigiano») mette `ruoloUtente='artigiano'` prima
del bivio, quindi quello che vede lì è **esattamente** quello che vede un
artigiano vero. Il difetto era vero.

**La correzione, e stavolta fatta come si deve:** la parola non si rincorre più
posto per posto. Chi la deve **scrivere** la chiede a **`_lav()`**, che è
l'unico che la sa (artigiano → «Lavori e interventi», studio → «Pratiche»,
impresa → «Lavori»); chi la deve **riscrivere** nell'HTML già stampato lo fa in
`adattaMenuArtigiano()`. In tutto **sei** posti: menu · titolo sezione · barra
del telefono · scheda del Riepilogo · la ricerca in alto · l'esportazione
Excel · il Cestino · la striscia dei crediti AI.

E soprattutto: **la prova 21 legge OGNI scritta della pagina dell'artigiano e
cerca la parola sbagliata**, come il banco del computo. Se un domani nasce un
settimo posto, diventa rossa da sola. Cercare i posti a mano non funziona:
la volta dopo se ne dimentica un altro.

## ⛔ IL PEZZO CHE NON ERA NELLA LISTA: IL RIEPILOGO

Nascondere la voce del menu **non basta**: il Riepilogo disegna una scheda per
ogni voce, e ogni scheda è un pulsante che porta dentro la sezione. Senza
questo pezzo l'artigiano avrebbe trovato le schede **Squadra, Agenda
operatore, Carte, Computo e SAL** nella sua prima schermata, e un clic lo
avrebbe portato in una sezione senza voce di menu.

Era già successo il 10 agosto agli studi tecnici, e la toppa di allora
(`_proNascosto`) sapeva solo dei professionisti. Adesso l'elenco delle voci
spente sta in **un posto solo**, `tabNascosti()` / `tabNascosto()`, e lo
chiedono tutti e due: il menu e il Riepilogo. È la regola «una regola che sta
in due posti non si sistema a metà».

⚠️ `tabNascosto()` **non guarda il `display` del pulsante**: il Riepilogo può
disegnarsi prima che il menu sia stato adattato, e leggerebbe «acceso» per
tutti. Guarda il ruolo.

Effetto in più: all'artigiano il Riepilogo **non fa nemmeno le due letture**
dei computi (`gest_computi`, `gest_computo_totali`).

## ⚠️ DUE COSE CONTROLLATE PRIMA DI COSTRUIRE, E ANDATE DIVERSAMENTE

1. **Il nodo «chi ce l'ha in mano» in Attrezzature NON ESISTE.** In memoria era
   scritto che Attrezzature pesca il nome dalla Squadra e che spegnendo la
   Squadra sarebbe rimasta una tendina vuota. Guardato nel codice
   (`mezzoForm`): non c'è nessuna tendina. C'è una **nota libera**, con dentro
   scritto «Dove si trova, chi lo usa, promemoria». Niente da cambiare.
2. **La tendina «Chi ci va» nella scheda del LAVORO** invece esiste davvero e
   pesca dalla squadra: con Squadra spenta l'artigiano non può aggiungere
   nessuno, quindi gli resta vuota. Chiesto ad Alessio: **«per adesso
   lasciala»**. Resta com'è, di proposito.

## IL BANCO — nei due versi

`prove/artigiano/` (nel contenitore di Claude): `banco.js` · `sabotaggi.js`.
Le prove aprono la pagina in un **Chromium vero**, a due misure, con un finto
Supabase.

**23 verdi · 24 sabotaggi su 24 accusati.**

⚠️ **La cosa che ha fatto la differenza: i dati finti dovevano essere PIENI.**
`rieCard()` non disegna la scheda se la sezione è vuota (`o.dati===false`). Con
un database finto vuoto, la prova «la scheda Squadra non c'è» sarebbe stata
verde **anche col difetto dentro**. Perciò il finto database ha una squadra,
delle carte, dei lavori assegnati, un computo e un SAL — e c'è la prova 14 che
verifica che all'**impresa** quelle stesse schede **ci sono**: se sparissero da
tutti, la prova 13 non proverebbe niente.

⚠️ **Un sabotaggio ha corretto me, non il codice.** «adattaMenuArtigiano gira
anche per l'impresa edile»: mi aspettavo che lo accusasse la prova 8, e la
prova 8 è restata verde — perché chiama `adattaMenuImpresa()` **a mano** e
quindi non passa dal bivio. Lo accusa la prova 20, che il bivio lo percorre
davvero. L'attesa era sbagliata, non la prova.

## ⛔ COSA RESTA APERTO

L'ordine di Alessio non cambia: **2. gestionale negozio · 3. gestionale
noleggio**, poi i prezzi del preventivo AI, il paywall nel database, la mina di
`sql/gest-computo-metrico.sql`, il totale del preventivo, i dati che si
perdono, la lista del geometra, le 5 pagine duplicate in Search Console e le
piccole.


# ✅ 22 agosto 2026 — I DOCUMENTI DELLA PRATICA (i PDF)

Punto 1a della lista nuova: **CHIUSO**. Un file toccato,
`gestionale-app.html`. Nessun SQL, nessuna tabella nuova, nessuna query.

## IL BUCO

Nella scheda del lavoro/pratica si potevano mettere **solo immagini e video**
(`accept="image/*"`). Quello che un geometra ha in mano su una pratica è
tutt'altro: **visura catastale, planimetria, elaborato, ricevuta di protocollo
del Comune**. Sono PDF, e non avevano un posto: restavano in una cartella sul
computer, e otto mesi dopo — quando il Comune chiede l'integrazione — il
fascicolo nel gestionale era a metà.

⚠️ **Il magazzino c'era già.** Bucket `gestionale-foto`, tabella `gest_foto`,
e i PDF li accetta da sempre: lo fanno la fattura in PDF e i documenti dei
fornitori. **Mancava solo la porta.**

## COSA C'È ADESSO

Nella scheda del lavoro, sotto «Foto e video», un blocco **📎 Documenti di
questo lavoro**: l'elenco dei file col nome e la data, «Apri», «Elimina», e il
pulsante «＋ Aggiungi documento». **Non miniature**: un PDF non si guarda come
una foto, si apre.

- Vale per **tutti**, non solo per lo studio tecnico. Stessa schermata, zero
  righe in più, e anche un'impresa ha PDF da tenere lì (capitolato, permesso,
  DURC del subappaltatore). Deciso così e detto ad Alessio prima di partire.
- Sta **chiuso finché il lavoro non è salvato**: un documento ha bisogno di un
  `lavoro_id` a cui attaccarsi. Stessa regola delle spese e delle ore.
- Le funzioni sono copiate riga per riga da quelle dei documenti del
  **fornitore**: stessa tabella, stesso deposito, stesso modo di aprire e
  eliminare. Cambia solo `lavoro_id` invece di `fornitore_id`, e
  `tipo:"documento"`.

## ⛔ IL PEZZO CHE POTEVA ROMPERE TUTTO IL RESTO

`gest_foto` non tiene solo le foto: ora dentro ci sono anche i documenti. E
**chi disegna le foto assume sempre un `<img>`** — un PDF ci sarebbe entrato
come immagine rotta.

I posti da cui i documenti devono restare fuori erano **quattro**: il
contatore Galleria del **Riepilogo**, il contatore dentro la **scheda del
lavoro**, la **Galleria**, e le foto del **verbale**. Tre di questi
conoscevano già la parola «fattura», scritta a mano in ognuno.

⛔ **Adesso l'elenco sta in un posto solo**: `TIPI_NON_FOTO` (+ `_nonFotoSql`
per PostgREST e `_nonFoto` per il JavaScript). Se domani nasce un quinto tipo
di file, si aggiunge lì e basta. Era la quarta volta in tre giorni che la
stessa regola provava a stare in più posti.

## ⚠️ TRE COSE CHE HA TROVATO IL BANCO, NON L'OCCHIO

1. ⛔ **Un apice rovescio dentro un commento HTML ha spezzato tutto il file.**
   Il commento che ho scritto sta **dentro una stringa a template** di
   JavaScript (il modulo del lavoro si costruisce così): un apice rovescio la
   chiude, e da lì in poi non è più codice. Il file smetteva di funzionare
   **tutto insieme e in silenzio**. L'ha visto il controllo che legge il
   JavaScript con un lettore vero (acorn), non l'occhio. Ora c'è scritto sul
   posto: ⛔ niente apici rovesci in quel commento.
2. **`renderDocLavoro()` non era atteso**: il messaggio «Documento eliminato»
   arrivava mentre l'elenco mostrava ancora il documento. Due `await`.
3. ⚠️ **Il Cestino è acceso**, quindi eliminare un documento lo mette nel
   Cestino e **il file NON si tocca**: se si togliesse, il ripristino darebbe
   un documento rotto. C'è una prova per tutti e due i casi.

## IL BANCO — nei due versi

`prove/documenti-lavoro/` (nel contenitore di Claude): `banco.js` ·
`sabotaggi.js` · `finto-supabase.js`.

**20 verdi · 23 sabotaggi su 23 accusati.**

⛔ **La cosa che ha fatto la differenza: il finto Supabase applica i filtri
davvero.** Quello di stamattina rispondeva sempre con tutte le righe e
ignorava `eq`/`neq`/`not`: con un finto così, la prova «i documenti non
compaiono nella Galleria» sarebbe stata verde **anche col filtro tolto**.
Questo applica eq · neq · in · not-in · is, fa funzionare `update()` (serve al
Cestino, che trasforma ogni `delete` in una data) e registra upload, insert e
file rimossi.

⚠️ **E tre prove sono state riscritte perché non potevano diventare rosse:**
- «su un lavoro nuovo il blocco resta chiuso» era verde sempre — il modulo del
  lavoro nuovo quel blocco non ce l'ha proprio;
- «i documenti non entrano nel verbale» guardava solo le letture già fatte, e
  il verbale non lo apriva nessuno: adesso lo apre davvero;
- «il file esce dal deposito» chiedeva una cosa che col Cestino acceso non
  succede mai: spezzata in due prove, una col Cestino acceso e una spento.

⚠️ **E il banco stesso poteva mentire**: quando un sabotaggio lo faceva
cadere, l'assenza di righe rosse veniva letta come «nessuna prova rossa» —
cioè come un sabotaggio non accusato. Adesso un banco che non arriva in fondo
viene segnalato a parte: **va guardato, non ignorato.**


# ✅ 22 agosto 2026 — LE ORE DIVENTANO UNA PARCELLA

Punto 1b: **CHIUSO**. Due file: `gestionale-app.html` e un file SQL nuovo,
`sql/gest-azienda-tariffa-oraria.sql` (⚠️ **da eseguire su Supabase**).

## IL BUCO

Le ore si segnavano già bene — giorno, chi, quante, cosa ha fatto — e poi
finivano lì. Per uno studio la parcella spesso **nasce dalle ore**: tre
sopralluoghi, sei ore di disegno, due al Comune. Quel conto si rifaceva a
mano, su un foglio.

## COSA C'È ADESSO

Nel «⏱ Registro delle ore» della scheda della pratica c'è
**«💶 Porta le ore nella parcella»** (per l'impresa: «…nel preventivo»), che
compare **solo se delle ore ci sono**. Premendolo si apre una parcella nuova,
già col cliente e il titolo della pratica, e **una riga per persona** con la
quantità uguale alle sue ore.

- ⚠️ **Una riga per PERSONA, non per giorno.** Un cliente non vuole leggere
  quaranta righe da mezz'ora: vuole sapere quante ore e a quanto. Le ore
  segnate dal titolare (senza un nome) fanno una riga sola.
- Cliente e titolo si prendono da **quello che è aperto sullo schermo**, non
  da una seconda lettura: così valgono anche le modifiche non ancora salvate.

## ⛔ IL PREZZO — LA DECISIONE DI ALESSIO

Chiesto a lui: prezzo vuoto o tariffa che si riempie da sola? Risposta:
**«facciamo entrambe — si riempie da sola, se non gli va bene lo cancella e
riempie a mano»**. La casella del prezzo era già scrivibile, quindi il «a
mano» non è costato niente.

Nasce **`gest_azienda.tariffa_oraria`** e la casella **«Quanto chiedi
all'ora»** nei Dati azienda.

⛔ **NON è il costo del collaboratore.** `gest_operatori.costo_orario` è
quanto COSTA lui, e serve al Report per dire se un lavoro ci ha guadagnato.
Usarlo come prezzo vorrebbe dire **fatturare al cliente il proprio costo**.
C'è un sabotaggio apposta (S9) che diventa rosso se qualcuno li confonde.

⚠️ **Senza tariffa il prezzo arriva VUOTO, non a zero.** Uno zero sembra un
prezzo; il vuoto si vede che manca. E la nota nel modulo dice dove si mette la
tariffa una volta per tutte.

⚠️ **Se la query SQL non è stata eseguita non si rompe niente**: la casella
non compare (saveAzienda lascia cadere la colonna, come fa già per la polizza
e la patente) e le righe arrivano senza prezzo.

## IL BANCO — nei due versi

`prove/ore-parcella/` (nel contenitore di Claude): `banco.js` ·
`sabotaggi.js`, col finto Supabase condiviso `prove/finto-supabase.js`.

**20 verdi · 23 sabotaggi su 23 accusati.**

⚠️ **Quattro prove rosse su cinque erano colpa del BANCO, non del codice**, e
capirle una per una è servito:
- il finto Supabase non sapeva fare `upsert()` — i Dati azienda si salvano
  così, quindi «la tariffa non si scrive» era una bugia del banco;
- non sapeva fare `.insert(...).select().single()`;
- ⛔ trattava un **elenco** di righe come se fosse **una riga sola**: la prova
  «le voci si salvano» diceva «1 riga, descrizione vuota». Le voci di un
  preventivo si scrivono tutte insieme;
- la tendina dei clienti nel banco era vuota, quindi il cliente non si poteva
  nemmeno scegliere.

⛔ **E una lezione nuova: il banco premeva la funzione, non il pulsante.**
Chiamare `orePortaInParcella()` a mano lasciava il filo fra il pulsante e la
funzione **senza nessuna prova**: tagliato quel filo (S4), il banco restava
tutto verde. Adesso il clic parte dal pulsante vero e passa da `data-action`.

⚠️ **Il finto Supabase adesso è UNO SOLO** (`prove/finto-supabase.js`), usato
da tutti e due i banchi di oggi. Prima erano due copie, e una correzione
andava pagata due volte.


# ✅ 22 agosto 2026 — LE MISURE DEL PREVENTIVO AI, E IL CLIENTE NUOVO

Due file: `gestionale-app.html` e `supabase/functions/ai-generate/index.ts`
(⚠️ quest'ultimo **non passa da Netlify**: va pubblicato su Supabase).

## ⛔ IL PUNTO 3 DELLA LISTA NON ESISTEVA PIÙ

Era «i prezzi del preventivo AI sono il doppio: 14.600 € per un bagno».
Alessio l'ha provato sulla pagina vera davanti a me: **6.445 € per un bagno da
8 mq chiavi in mano**, dentro il suo numero (6.000-7.000 € per un 6 mq a
Rieti). Quei 14.600 € erano del **vecchio** Preventivo AI dei pannelli, quello
sparito la notte del 21 con gli Strumenti.

⛔ Gli avevo proposto un lavoro grosso sui prezzi **senza aver provato prima
se il difetto c'era ancora**. È la lezione «guarda se c'è già», rifatta
identica. Provare costava un clic.

## IL DIFETTO VERO: LE MISURE

Alessio aveva scritto «rifacimento bagno completo chiavi in mano, piastrelle,
sanitari...» **senza dire quanto era grande**. L'AI:

1. si è data da sola «bagno standard di circa 8 mq»;
2. l'ha scritto **solo nella nota in fondo**, dove non lo legge nessuno;
3. e poi **non ha nemmeno usato la sua stessa misura**: 8 mq di pavimento e
   **12 mq di pareti**. Un bagno da 8 mq rivestito a 2 metri fa **21-23 mq**.

⛔ **Una quantità che manca è peggio di un prezzo sbagliato.** Il prezzo
strano si vede; il rivestimento dimezzato no — il totale «sembra giusto» e
l'impresa ci rimette la posa di mezzo bagno.

⚠️ **E l'altezza vale metà del conto**, come ha fatto notare Alessio: lo
stesso bagno rivestito a 1 metro fa 9 mq invece di 21.

## COSA C'È ADESSO

**Nel gestionale**, sotto la casella dell'AI, una riga fissa: «Scrivi anche
**quanti mq** e **fino a che altezza vanno le piastrelle**: se no le quantità
me le invento io».

⚠️ **Deciso da Alessio a metà lavoro.** Avevo costruito e collaudato un
controllo che si fermava a chiedere le misure prima di chiamare l'AI (gratis,
senza spendere un credito). Lui: *«forse non serve richiedere i mq, basta
scriverlo»*. Buttato e rifatto: **si scrive, non si chiede.** Nessuna
interruzione, nessun clic in più.

**Nell'istruzione della funzione**, le regole che mancavano:
- usa SOLO le misure che ti dà l'utente, non inventarne;
- il pavimento è i mq della stanza; **le pareti si ricavano dal perimetro**
  (≈ 4 × radice dei mq) per l'altezza del rivestimento, **meno 2 mq per la
  porta**;
- se l'altezza non te la dà, usa 2 m e **dillo nella PRIMA riga delle note**;
- stuccatura, battiscopa e silicone dalle stesse misure: le quantità devono
  tornare fra loro;
- se una misura manca e non si ricava: quantità 1, prezzo 0, e nelle note che
  va misurata. **Non inventare una quantità per far tornare il totale.**

## ✅ E IL CLIENTE NUOVO DENTRO IL PREVENTIVO

Segnalato da Alessio con la pagina davanti: nella scheda del **lavoro** c'è
«+ Aggiungi nuovo cliente», nel **preventivo** no. Toccava uscire, creare il
cliente e ricominciare.

⛔ Non si poteva copiare il pulsante del lavoro: quello (`quick-cli`) apre il
modulo del cliente **al posto** del preventivo e avvisa che quel che hai
scritto va perso. Su un lavoro sono tre caselle, su un preventivo sono dieci
voci.

Adesso: **«+ Nuovo cliente»** apre una casella lì dov'è la tendina, scrivi il
**nome**, premi Aggiungi e il cliente nasce ed è già scelto. Niente finestre
sopra, niente uscita, niente perso. Telefono e indirizzo si completano dopo,
dai Clienti.

⚠️ Se un cliente con quel nome c'è già (confronto tollerante: maiuscole,
spazi, accenti) **non si crea un doppione**: si sceglie quello. Due «Rossi
Mario» in rubrica sono un guaio che si scopre mesi dopo, sulle fatture.

## IL BANCO — nei due versi

`prove/misure-preventivo/`: `banco.js` · `sabotaggi.js`.
**18 verdi · 25 sabotaggi su 25 accusati.**
Rifatti anche gli altri tre banchi di oggi sul file nuovo: artigiano 23,
documenti 20, ore 20 — tutti verdi.

## ⚠️ TRE LEZIONI, TUTTE GIÀ SCRITTE QUI SOPRA E RICOMPARSE

1. ⛔ **Un apice rovescio dentro un commento HTML ha spezzato il file. DUE
   VOLTE OGGI.** Quei commenti stanno dentro stringhe a template di
   JavaScript: un apice rovescio le chiude e il file muore tutto insieme, in
   silenzio. Adesso c'è scritto sul posto, in tutti e due i punti.
2. ⛔ **Il banco premeva la funzione, non il pulsante.** Il sabotaggio «torna
   il modo vecchio, apri il modulo cliente» restava **verde**, perché la prova
   chiamava `pvCliSalva()` a mano invece di premere «Aggiungi». Stessa
   identica lezione di stamattina, ricomparsa nel pomeriggio.
3. ⛔ **Cercare una parola non è controllare.** Due sabotaggi restavano verdi
   perché la parola cercata compariva anche altrove: «porta» stava pure
   nell'esempio, «prima riga delle note» pure nelle regole sopra. Le prove
   adesso cercano la **frase della regola**, non la parola.

⚠️ E una quarta, sul contare: la prova sugli apici rovesci della funzione
contava se erano **pari in tutto il file**. Due in più dentro l'istruzione
tengono il conto pari e spezzano lo stesso la stringa. Adesso si contano
**dentro il blocco**: devono essere esattamente due.


# ✅ 22 agosto 2026 — LA MINA DEI DUE FILE SQL DEL COMPUTO

Punto 4 della lista: **CHIUSO**. Due file toccati, tutti e due in `sql/`.
⚠️ **Questo push non costa crediti Netlify**: sono solo `.sql` e `.md`, e un
push senza file del sito non fa ripartire la pubblicazione.

## COS'ERA

`sql/gest-computo-metrico.sql` e `sql/gest-computo-quantita-3-decimali.sql`
fanno `drop view` su **`gest_computo_voci_calc`** e la ricreano **com'era il
giorno in cui sono stati scritti** (10 e 14 agosto).

Ma da allora quella vista è cresciuta due volte:
- **20 agosto**: le è stata aggiunta `origine_id`, che serve alla schermata
  «Cosa è cambiato» del computo di variante;
- **21 agosto**: le è stato aggiunto il **prezzo costruito con l'analisi**
  (`coalesce(a.prezzo, v.prezzo_unitario)`) e la colonna `prezzo_da_analisi`.

⛔ Rilanciando i vecchi, **i prezzi dell'analisi tornavano di colpo a quelli
scritti a mano**, e la variante perdeva la sua colonna. Nessun errore, nessun
avviso: i numeri cambiavano e basta. E il gestionale, in **quattordici**
punti, invita a eseguire quei file.

Era un fucile carico dentro la cartella.

## LA GUARDIA

In cima a tutti e due, **prima di qualsiasi `drop`**, un blocco che guarda se
`gest_computo_voci_calc` ha già `origine_id` o `prezzo_da_analisi`. Se le ha,
si ferma con `raise exception` e dice cosa fare al posto suo:

> «FERMO QUI, e per il tuo bene. […] Se ti serve rifare le viste, esegui
> `sql/gest-variante-origine-vista.sql` e poi `sql/gest-analisi-prezzi.sql`.»

⚠️ **`raise exception`, non `raise notice`.** Un avviso si legge e si va
avanti lo stesso; qui deve fermarsi davvero. (La regola «mai `raise notice`»
resta: quella parla di quando una query deve *dirmi* qualcosa, e infatti in
fondo a tutti e due c'è adesso una **riga di risultato**.)

⚠️ **Su un database vuoto la guardia lascia passare**: la prima installazione
deve funzionare come prima.

## IL BANCO — e stavolta con un Postgres vero

`prove/guardia-sql/`: `banco.sh` · `sabotaggi.sh`.

⛔ **Non è stato provato a occhio, e non sul database di Alessio.** Nel
contenitore si accende un **PostgreSQL vero**, si costruisce la vista nei due
stati (vecchia e nuova) e si guarda cosa fa il file davvero.

**16 verdi · 9 sabotaggi su 9 accusati.**

Le prove: la guardia c'è · sta **prima** del primo `drop` · sulla vista
vecchia lascia passare · su un database vuoto lascia passare · sulla vista
nuova **ferma** · il messaggio dice anche cosa fare · basta `origine_id` da
sola per fermarla · in fondo c'è la riga di risultato e non un `raise notice`.

⚠️ **Una prova è nata rossa per colpa sua**: «la guardia sta prima del primo
drop» cercava `drop view` con un grep, e trovava la parola **dentro il
commento della guardia** — quindi diceva «troppo tardi» sbagliando. Cercare
una scritta non è controllare: adesso guarda solo le righe che sono davvero
SQL, non i commenti.

⚠️ **E un sabotaggio era un doppione senza accorgersene**: «la guardia finisce
dopo il drop» era scritto con lo stesso comando di «tolgo la guardia», quindi
la prova sulla posizione restava senza nessun sabotaggio. Riscritto: adesso la
guardia viene **spostata in fondo** davvero.

## ⚠️ COSA RESTA APERTO SU QUESTO

I **quattordici** messaggi del gestionale che invitano a eseguire
`gest-computo-metrico.sql` non sono stati toccati: adesso sono innocui
(il file si ferma da solo e spiega), ma chi li legge va comunque verso il file
sbagliato. Da sistemare quando si passa di lì.


# ✅ 22 agosto 2026 — IL NOME CHE SI CAMBIAVA DA SOLO, E LA BARRA DEL GEOMETRA

Un file: `gestionale-app.html`. Due voci della lista del geometra, chiuse.

## ⛔ 1. «Edilcantiere» diventava «Edilpratica»

Nella ricerca in alto, allo studio tecnico, i **nomi dei clienti** venivano
riscritti. La colpa non era della ricerca: era del traduttore. L'elenco
`_FRASI` si applicava **come pezzo di testo**, quindi «cantiere» veniva
trovato e cambiato **anche dentro un'altra parola**.

⚠️ **È la terza volta che questo difetto esce, sempre da una porta diversa:**
- 12 agosto: le **tendine** («Edilcantiere Srl» in un `<option>`);
- 20 agosto: il **testo del prezzario** («nell'ambito del PRATICA»);
- oggi: la **ricerca in alto**.

⛔ Ogni volta si era chiuso **il posto**, mai **la causa**. Adesso è chiusa la
causa: le voci fatte di **una sola parola** (sono 16 su 138) si cambiano
**solo quando quella parola sta da sola**. Le frasi, che hanno gli spazi
dentro e in un nome non ci finiscono, restano come prima.

⚠️ **Niente lookbehind nell'espressione**: su Safari vecchi non c'è e
l'intero blocco morirebbe. Si tiene il carattere di prima in un gruppo e lo si
rimette.

⚠️ **E la cintura resta**: `.ct-t` e `.ct-s` (le righe dei risultati) sono
entrate in `_SKIP_UTENTE`. Sono due difese diverse, per due casi diversi:
la regola della parola intera salva «Edil**cantiere**»; l'elenco dei
contenitori salva un cliente che si chiama davvero «**Muratore** Giuseppe» —
lì la parola è intera, e solo il `_SKIP_UTENTE` la protegge.

## ✅ 2. Sul telefono la barra in basso diceva «Lavori»

Il traduttore guardava dentro `#appview` e `#sheet`. **`#barra-basso` sta
fuori da tutti e due**, quindi al geometra tutto diceva «Pratiche» tranne la
barra del telefono. Aggiunta all'elenco: una parola sola, in un posto
dimenticato.

## IL BANCO — nei due versi

`prove/geometra/`: `banco.js` · `sabotaggi.js`.
**13 verdi · 11 sabotaggi su 11 accusati.**
Rifatti anche gli altri quattro banchi di oggi: artigiano 23 · documenti 20 ·
ore 20 · misure 18. Tutti verdi.

⚠️ **Quattro sabotaggi sono nati muti, e nessuno è stato aggirato:**
1. «il confine vale solo a sinistra» non lo accusava nessuno: **mancava il
   caso a destra** («cantieristica»). Aggiunto.
2. «tolgo `.ct-s` dai contenitori dell'utente» restava verde perché il nome
   di prova era «Edilcantiere», che ormai è protetto **dall'altra difesa**.
   Cambiato il cliente di prova in «Muratore Giuseppe», dove la parola è
   intera e solo il `_SKIP_UTENTE` può salvarla.
3. «il traduttore gira anche per l'artigiano» restava verde perché «Lavori e
   interventi» il traduttore non la tocca: la prova era verde **per fortuna,
   non per merito**. Adesso guarda la cosa vera — che per l'artigiano il
   traduttore **non parta proprio**.
4. «un apice rovescio nel commento» non faceva danno: quel commento è un
   commento JavaScript normale. Spostato dove il danno si fa davvero — un
   commento HTML **dentro una stringa a template**.

## ⚠️ COSA RESTA DELLA LISTA DEL GEOMETRA

- le **quattro frasi sgrammaticate**: non si sa quali siano, serve la
  segnalazione di Alessio;
- **`js/aiuti-gestionale.js` non è caricato da nessuna pagina**: o si collega
  o si butta. Da decidere con lui.
