Riprendiamo il lavoro su TrovaImpresa — gestionale noleggio.

## Chi sono e come voglio lavorare

Sono Alessio, fondatore e unico sviluppatore di TrovaImpresa (trovaimpresa.com), un marketplace italiano per trovare imprese edili e artigiani. Sviluppo web HTML/CSS/JS, backend Supabase, deploy su Netlify. Ho la dislessia: niente testi sotto i 13px, mai, da nessuna parte.

Regole fisse, valgono per tutta la sessione:
- Rispondimi in italiano, messaggi corti, una cosa alla volta.
- Dammi codice pronto da copiare e incollare, senza spiegazioni teoriche.
- Chiedimi prima di costruire cose che non ti ho chiesto.
- I comandi git NON lanciarli tu: scrivimeli e li lancio io nel mio terminale.
- Le query SQL una alla volta.
- Prima di consegnarmi qualsiasi modifica: collaudo completo (vedi in fondo) e scheda di collaudo compilata.
- Alla fine di ogni consegna dammi i passi numerati per provare io con i click.

## DOVE STANNO I FILE — leggi questo per primo

I file veri stanno sul mio computer, nella cartella collegata a Cowork:

    C:\Users\Utente\Downloads\trovaimpresa

Dal tuo lato la vedi montata come `$HOME/mnt/trovaimpresa` (usala con `mcp__remote-devices__device_bash` o `device_list_dir`). Se non la vedi, chiedimi di collegarla dall'app.

I file che contano:
- `gestionale-noleggio.html` — il gestionale noleggio mezzi, è quello su cui lavoriamo
- `gestionale-app.html` — il gestionale per imprese e artigiani, diviso in reparti (serve come modello, vedi sotto)
- `css/gestionale.css` — foglio di stile condiviso dalle due pagine
- `js/gate-gestionale.js` — lo script che protegge l'accesso alle due pagine
- `js/noleggio-prezzo.js` — il motore che fa i conti del noleggio (le formule stanno lì, fuori dalla pagina, apposta)

**Come si lavora sui file:** portali nel tuo spazio di lavoro con `mcp__remote-devices__device_stage_files`, modificali lì, poi consegnameli con `SendUserFile` seguito da `mcp__remote-devices__device_commit_files` sul percorso vero. Verifica sempre l'md5 da tutte e due le parti prima di dirmi che è fatto.

**Attenzione al foglio di stile condiviso:** `gestionale-app.html` e `gestionale-noleggio.html` caricano tutte e due `css/gestionale.css`, e quel foglio usa gli stessi nomi di classe generici (`.kpi`, `.money`, `.fatt-tot`, `.job`) per widget che nelle due pagine sono cose diverse. Il foglio esterno viene caricato DOPO lo `<style>` interno alla pagina, quindi a parità di specificità vince lui e le modifiche fatte nello `<style>` interno sembrano non funzionare. Mi ha già fatto perdere tempo due volte. La soluzione già adottata: scrivere le regole del noleggio col prefisso `#app-root` (il div che avvolge tutta la pagina), così vincono sempre.

## Cosa è già fatto e funziona

1. **Tag facoltativo del reparto sui noleggi.** Quando compilo un nuovo noleggio posso associarlo a un reparto (il campo è `#nn-reparto`, salva la colonna `mestiere_id`). Se lo lascio vuoto è un noleggio a cliente esterno e si vede solo nella sezione Noleggi. Se scelgo un reparto, il noleggio prende il cartellino 🏷 col nome del reparto e conta come spesa interna nel Riepilogo di quel reparto dentro `gestionale-app.html`. Testato con 7 casi incrociati (somma di più noleggi sullo stesso reparto, isolamento tra reparti diversi, filtro del mese, noleggi senza reparto, cambio di reparto, rimozione del reparto): tutti verdi, e l'ho provato anche io a mano coi dati veri in produzione.

2. **Stile delle card del noleggio, primo giro.** Fondo bianco, angoli 16px, bordo sottile, niente ombra da ferme, ombra e sollevamento solo al passaggio del mouse, numeri neri (tolti i colori arancio/blu/verde per categoria). Fatto su `.kpi`, `.money`, `.nol-card`, `.fatt-tot`, `.job`, tutte scritte col prefisso `#app-root`.

3. **Tolta dal Riepilogo del noleggio la sezione "Magazzino e negozio"** (Prodotti, Sotto scorta, Movimenti, Valore magazzino, Venduto, Acquistato). Leggeva davvero le tabelle `neg_prodotti` e `neg_movimenti`, ma erano dati del gestionale Negozio e in quella pagina non servivano a nessuno. Tolta anche la query, così la pagina non fa più chiamate inutili a Supabase.

## Cosa manca — è il lavoro da fare adesso

Le card del gestionale noleggio devono diventare **identiche a quelle del Riepilogo del gestionale impresa**. Il modello da copiare è la funzione `rieCard()` in `gestionale-app.html` (intorno a riga 3778) insieme alla classe `.rie-card` in `css/gestionale.css` (righe 1137-1300 circa). Guardale prima di toccare qualsiasi cosa.

Com'è fatta quella card, dall'alto in basso:
- una riga con l'icona SVG colorata della sezione dentro un riquadrino dal fondo tenue, poi il titolo della sezione in grassetto, e all'estrema destra un pallino da 13px verde o rosso che dice se lì dentro qualcosa va male
- il numerone (44px, peso 800, nero)
- l'etichetta (16px, grigia)
- una riga di separazione, e sotto fino a due righe di dettaglio (etichetta a sinistra, valore a destra)
- tutta la card ha bordo sinistro spesso 5px, angoli 16px, e si solleva al passaggio del mouse

Le card del noleggio oggi hanno solo numero + etichetta + sottotitolo: va rifatta la struttura HTML, non basta cambiare i colori. È questo il punto che avevo chiesto e che non è ancora fatto.

Due tappe, in quest'ordine:

**Tappa 1 — le 11 card di numeri.** Cinque nel Riepilogo (Mezzi, Fuori adesso, In ritardo, Liberi, Prenotati), tre sempre nel Riepilogo (Incassato dai noleggi, Da incassare, Cauzioni in deposito), tre nella sezione Fatture, tre nella sezione Cauzioni.

Due cose da sapere prima di partire: servono icone SVG nuove, perché in `gestionale-app.html` la funzione `rieIco()` copia l'SVG dal pulsante del menu laterale, ma i pulsanti del menu del noleggio sono solo testo e l'SVG non ce l'hanno. E il pallino verde/rosso va acceso con la stessa logica del gestionale impresa: rosso solo quando lì dentro c'è davvero un problema (mezzi in ritardo, cauzioni da svincolare, fatture scadute), non semplicemente perché quella sezione ha qualcosa dentro.

**Tappa 2 — le card degli elenchi.** La classe `.nol-card`, usata in Clienti, Mezzi, Noleggi, Prodotti, Magazzino, Fornitori, Movimenti, Calendario, Fatture, Cauzioni, Contratti e documenti, Foto e video, Cestino. Il problema è che è scritta a mano in 16 punti diversi del file, ognuno col suo `style="border-top-color:..."` dentro l'attributo. Prima conviene raccoglierle tutte in una funzione unica, poi cambiare solo quella. Da fare dopo la tappa 1, non insieme.

## Una decisione di stile già presa, da rispettare

Il 20 agosto ho deciso che le card sono neutre: il colore fa due lavori soli, l'icona dice QUALE sezione e il pallino dice se lì dentro qualcosa va male. I numeri non si colorano per categoria, se no otto card accese insieme fanno una pagina a scacchi e il colore non dice più niente. Sta scritto nei commenti dentro `css/gestionale.css`, non andare contro.

## Il collaudo — obbligatorio prima di ogni consegna

Le prove Playwright esistenti (stanno nella cartella delle prove del tuo spazio di lavoro, non nel mio progetto — se non le trovi chiedimi):
- `noleggio-menu/banco.js`
- `noleggio-importo/banco.js` — 39 prove
- `noleggio-scritte/banco.js` — 21 prove
- `noleggio-pdf/banco.js` — 35 prove
- `noleggio-prezzo/schermo.js` — 561 prove su due formati di schermo, ci mette più di 2 minuti: dagli almeno 500 secondi di tempo o ti sembra bloccato quando invece sta lavorando

Devono essere tutte verdi. Più: controllo della sintassi (estrai i blocchi `<script>` dal file e passali a `node --check` uno per uno — non dare il file .html direttamente a node, non lo digerisce), zero errori JavaScript in console, zero id duplicati, zero testi sotto i 13px, provato a 1440x900 e a 390x844.

**Come apri la pagina con Playwright:** `gestionale-noleggio.html` è protetta da `js/gate-gestionale.js`, che ha la manutenzione accesa e in più un controllo sul piano Premium. Aggiungi `?chiave=apri` all'indirizzo e il cancello si apre: è la scorciatoia che c'è già dentro lo script. Serve anche che la finta sessione usi la mail `pintoalessio@icloud.com`, che è quella nella lista degli ammessi.

**Tre inciampi già trovati, per non ricascarci:**
- `rieCard()` in `gestionale-app.html` disegna solo le prime 2 righe di dettaglio (`slice(0,2)`): se ne aggiungi una terza sparisce senza dire niente e sembra che il dato non arrivi.
- Salvando un noleggio su un mezzo già impegnato nella stessa data parte un `confirm()`. Playwright di suo lo annulla, e il salvataggio non parte mai: metti `page.on('dialog', d => d.accept())` all'inizio dello script di prova.
- Il pulsante per creare un noleggio è `data-action="new-noleggio"` nella sezione Noleggi, ma quello in alto a destra nella barra è `data-action="new-nol"`. Sono due nomi diversi, non uno solo.

Comincia dalla tappa 1.
