# LAVORI APERTI — TrovaImpresa

Il quaderno dei lavori a metà. UN solo file, sempre questo.
Ogni sessione lo aggiorna alla fine: sposta le voci finite in FATTO, aggiunge quelle nuove.
Ogni voce ha: [da quando] cosa · dove · cosa manca.

Ultimo aggiornamento: venerdì 4 settembre 2026 (sera)

---

## 🔴 DA FINIRE — iniziati e lasciati a metà

- [dal 3 set] **Preventivo: la foto allegata non arriva mai** · `profilo-impresa.html` (#sec-preventivo, inviaPreventivo), `netlify/functions/notifica-preventivo.js` · manca: bucket `preventivi-allegati` (anon insert, select impresa), colonna `preventivi.allegati jsonb`, più file insieme (foto/PDF/DWG max 10 MB), visibili nei 4 pannelli, conteggio nell'email. ⭐ PRIMO IN ORDINE DI ALEX
- [dal 1 set] **pannello-negozio.html rimasto indietro** · testata vecchia (gli altri 3 hanno testata nuova, «Riposiziona», 4 carte gestionale) e copertina che non si carica (scrive in `<id impresa>/banner` invece che nella cartella dell'`user_id`, RLS blocca) · copiare dai pannelli buoni (`stessa-forma`), riscrivere il blocco intero, non regex
- [dal 1 set] **Pulsante «📱 Mobile» dell'Anteprima non fa niente** · nei 4 pannelli, `anteprimaDevice()` usa `max-width` invece di `width` · aggiustare e mostrare la foto dell'anteprima telefono
- [dal 4 set] **Testi sotto i 13 px nelle 4 pagine di registrazione** (trovati dal banco delle pagine) · `registrazione-*.html` · `.step-label` →11←px ×4 («Anagrafica»…), contatore «0/200» →11←px, riga «I tuoi dati sono al sicuro» e link «Privacy Policy» →12←px, footer e le →5← email →12,8←px · Alex ha la dislessia: da portare a 13 px o piu'
- [dal 1 set] **4 pezzi di CSS sotto i 13 px** · `profilo-impresa.html`: `.cdh` 9, `.cd` 12, `.cd.oggi` 11, `.ms-l` 10 · PRIMA cercare se qualcosa le usa ancora; se no si buttano, se sì a 13 px
- [dal 2 set] **Cancellazione chat lato impresa cancella anche la copia del cliente** · 4 pannelli, bottone «🗑 Elimina conversazione» (DELETE diretta su `chat_messaggi`) · manca: tabella `chat_nascoste` con RLS, elenco che salta le nascoste, bottone «Togli dal mio elenco» · dettagli in `prove-claude/LAVORI-DA-FARE.md` · mezza giornata
- [dal 2 set] **Registrazione artigiano, 3 difetti visti dal vivo** · `registrazione-artigiano.html` · (1) ⚠️ Lazio → Rieti: «nella tendina c'è solo Rieti» — CONTROLLATO IL 4 SET: `js/geo-italia.js` è stato aggiornato il 3 set e adesso contiene →7.904← comuni, provincia di Rieti →73← (c'è Amatrice). Sembra GIÀ SISTEMATO: serve solo una prova dal vivo per confermare; (2) «Terzo mestiere» sta fuori dal riquadro chiuso; (3) dopo «Avanti» la pagina non torna in cima · passo 4 «Logo» e conferma finale mai provati
- [dal 3 set] **`recensioni-impresa.html` non è in nessuna sitemap** · sitemap · aggiungerle
- [dal 22 lug] **Registrazione: passare `options.data` nel signUp** e togliere l'insert manuale in `imprese` (il trigger `on_auth_user_created` già crea il profilo) · 4 pagine registrazione-*
- [dal 22 lug] **Contattare via email i 10 utenti recuperati** per far completare il profilo
- [da lug] **Bandi & Opportunità fermo su CORS** · soluzione trovata: Netlify Function · mai fatta
- [da lug] **Elimina recensioni admin non funziona** (dopo il revert ad8ed55) · `admin.html` · ⚠️ da verificare se è ancora vero
- [da lug] **RATING MEDIO in pannello-artigiano mostra «—»** · ⚠️ il 3 set il rating è stato spostato dalla vecchia colonna: verificare se è già sistemato
- [dal 25 apr] **Bug piano free/pro «binario» nei pannelli** (Premium mostrati come Free) · `BACKLOG.md` · ⚠️ vecchio di 4 mesi, il piano Pro non esiste più: verificare se è ancora vero, altrimenti chiudere
- [da lug] **App Android (Capacitor)** · progetto inizializzato, prova dal vivo rimandata finché non c'è un telefono Android
- [da lug] **Demo B Arcade (pannello impresa) da registrare; Demo A da rifare** · `perche-registrarsi.html`

## 🟡 DA FARE — concordati, non ancora iniziati (ordine di Alex, 3 set)

0. [4 set] ⭐ **Replicare la registrazione corta sulle altre 3 categorie** (impresa, negozio, professionista) — SOLO dopo aver visto se sull'artigiano le iscrizioni salgono. Il modello è `registrazione-artigiano.html`
0b. [4 set] **Il pannello per completare il profilo**: chi si iscrive col modulo corto deve trovare nel pannello un posto chiaro dove mettere P.IVA, telefono, indirizzo, descrizione, foto, logo, orari, zone, 2°/3° mestiere — con la barra «profilo completo al x%». È il pezzo che regge tutta la scelta del modulo corto

1. [3 set] **Preventivo: domande guidate per tipo di lavoro** (bagno → mq, piano, ascensore; tetto → mq, copertura…) · `profilo-impresa.html`
2. [3 set] **Mail di riepilogo al cliente** con link «stato della tua richiesta» + pulsante WhatsApp dopo l'invio
3. [3 set] **«Copia il link» della pagina recensioni** nel pannello, sotto «Le tue recensioni» · 4 pannelli
4. [3 set] **Richiamo automatico**: fra 7 giorni a chi non ha aperto il gestionale; «conferma la mail» ai →24← che non l'hanno fatto
5. [30 ago] **Homepage più compatta sul telefono** (tutto più piccolo: scritte, logo, bottoni) · deciso: DOPO aver chiuso i difetti del pannello pubblico
6. [3 set] **Guide impianti con la Parte E della Tariffa Lazio 2023** (idraulico, elettrico, condizionatore, caldaia) · Alex deve scaricare e allegare la Parte E · dopo il controllo GSC del 10 set
7. [4 set] **Portare nel banco delle pagine anche le altre pagine** (prezzi, blog, pubblicita, contatti, cerca-*, le guide, le pagine citta): oggi guarda le →10← di casa
8. [4 set] **Un banco per il CONTO del computo** (quantità × prezzo, ribasso %, oneri sicurezza): oggi i banchi del computo provano solo chi vede cosa e che le sezioni si aprano · `prove-claude/banchi-fissi/computo/`
9. [set] **Collegare l'agente del lunedì alle skill nuove** man mano che si aggiungono

## ⚖️ DA DECIDERE — tocca ad Alex, Claude non decide

- **Il logo di TrovaImpresa nella barra della scheda pubblica** viene sostituito dal logo dell'impresa · per Alex «il visitatore perde il riferimento» · fare due foto affiancate e scegliere
- **Gli orari**: colonna vuota su tutte le imprese · prima contare dal DB quante ne hanno uno, poi figura con le due strade (riempire / togliere)
- **Cancellare o no la recensione di prova** (id 19, scheda 36)
- **Quanto vale un credito chat** · ricordarglielo quando si arriva lì. Il «nodo dei 49 €» è CHIUSO
- **Il cliente che aspetta da →42← giorni** una risposta su una richiesta di incarico a un professionista (visto il 4 set) · rispondere a mano? avvisare il professionista? proporla ad altri?
- **Deposito del marchio TrovaImpresa** (UIBM, classi 35/37/42, ~185 € via SPID) · disponibile, mai depositato

## 💡 IDEE — parcheggiate, non promesse

- Barra «profilo completo al x%» nel pannello (→44← imprese su →82← senza descrizione e non lo sanno)
- Recensioni chieste dalle imprese ai loro clienti (pulsante nel pannello) · ⚠️ PRIMA provarlo a mano su →5← imprese di Rieti, poi scrivere il codice
- Un negozio finto nel database per poter provare il ramo negozio
- Incarico senza risposta dopo 3 giorni → proposto agli altri professionisti della zona (4 set)
- Rinvio automatico dell'email di conferma dopo 3 giorni a chi non ha cliccato (4 set)
- Card «Parla subito con TrovaImpresa» nei pannelli (chat diretta con l'admin)
- Anteprima del profilo pubblico dentro il pannello
- Potenziare `quanto-guadagna-un-muratore.html` (già compare per «stipendio muratore»)
- Nuove fonti di ricavo oltre gestionale e pubblicità: qualcosa che le imprese comprino volentieri e costi poco tempo (2 set)
- Collaudo dal vivo di `assistenza-ai-e-computo` (3 domande alla chat + computo di prova con totale →937,99←): da fare la prima volta con Alex presente

## ✅ FATTO — ultimi 14 giorni (per chiudere il cerchio, poi si cancella)

- [4 set] **Registrazione artigiano in UNA schermata**: da →4← passi e →26← caselle a →1← schermata e →7← caselle (nome, email, password, mestiere, regione, provincia, città + spunta termini). Email e password adesso sono in cima. Tolti i piani/prezzi dall'ultimo passo, messa in cima la riga «iscriversi e restare è gratis». Backup: `prove-claude/registrazione-artigiano-prima-mini-4set.html`
- [4 set] Skill `controllo-settimanale-sito` + primo controllo con la skill; agente del lunedì collegato alla skill; questo quaderno; skill `lavori-aperti`; skill `conti-tornano`, `assistenza-ai-e-computo` e `pagine-nel-browser` con i banchi tirati fuori dagli zip (chat AI →168← verdi) e messi in `prove-claude/banchi-fissi/` (conti →34← verdi sul PC, computo →55←+→33← verdi nella nuvola)
- [3 set] Ispettore del lunedì; email gestionale a 89 imprese; archivio «Email inviate» in admin; allegati foto/PDF nella chat di assistenza (gestionale + 4 pannelli); Personalizza pannello a tutta pagina; risposta alle recensioni + pagina `recensioni-impresa.html`; guide infissi/pavimento/imbiancare/cappotto con la Tariffa Lazio
- [2 set] Lista dei 10: chiusi 1, 2, 3, 5, 6 (pastiglie mestieri, linguetta recensioni, limit 50, bollino P.IVA, titolo/descrizione foto)
- [1 set] Banchi rossi del 31 ago; testata nuova su 3 pannelli; copertina; WhatsApp mostrato; meta e sitemap
