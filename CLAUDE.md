# Memoria progetto — TrovaImpresa

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
