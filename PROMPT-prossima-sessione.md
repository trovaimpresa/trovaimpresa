# Prompt per la sessione nuova — il GESTIONALE NEGOZIO e i negozi che non si iscrivono
Copia tutto quello che sta sotto la riga e incollalo in una sessione nuova di Cowork.

⚠️ Gli altri file `PROMPT-*.md` e `prompt-nuova-sessione.md` in questa cartella sono VECCHI (4, 5 e 6 settembre: noleggio, smontaggio, i quattro problemi — tutti chiusi). **Questo è quello buono.**

---

Ciao. Lavoriamo su TrovaImpresa, cartella `C:\Users\Utente\Downloads\trovaimpresa` (in Cowork si apre come `$HOME/mnt/trovaimpresa`).

Prima di toccare qualsiasi cosa leggi, in questo ordine:

1. `LAVORI-APERTI.md`, la sezione in cima: **«IL 6 SETTEMBRE (notte) — IL GESTIONALE NEGOZIO E I NEGOZI CHE NON SI ISCRIVONO»**. C'è già tutto misurato: non rifare il giro.
2. `CLAUDE.md`, l'ultima sezione: «IL 6 SETTEMBRE 2026 — NOTTE: I QUATTRO PROBLEMI RIMASTI»
3. `gestionale-negozio.html` e `gestionale-app.html`, per vedere la differenza con i tuoi occhi

## COME PARLARE AD ALESSIO
Non è un tecnico di formazione: ogni operazione va spiegata a clic, con passaggi numerati (dove andare, quale pulsante, cosa incollare, cosa deve vedere dopo). Numeri e commit isolati coi marcatori →così←. Prima di toccare i file per qualcosa che si vede a schermo, gli fai vedere l'anteprima (computer E telefono) e aspetti il suo ok. A fine lavoro: riassunto e passo successivo consigliato. Se hai un'opinione diversa dalla sua, gliela dici — vuole il parere onesto, compreso cosa non funziona.

## LE REGOLE DI FERRO
* ⛔ Claude non lancia git senza `--no-optional-locks`. In sola lettura sempre `git --no-optional-locks status/log`. Se `.git/index.lock` c'è già, si SPOSTA (`mv .git/index.lock _to_delete/`), non si insiste.
* ⛔ Ogni blocco git per Alessio comincia con `rm -f .git/index.lock`.
* ⛔ Una cosa per volta: push e collaudo dal vivo in mezzo. Mai due lavori in un push solo.
* ⛔ Prima di toccare una sezione, ci si SCRIVONO i numeri che mostra; dopo il push si ricontano. È l'unica difesa contro i guasti muti.
* ⛔ Ogni lavoro ha un banco in `prove-claude/banchi-fissi/`, e il banco va provato anche col `--sabota`: se sabotato non diventa rosso, non sta misurando niente. E ogni prova che conta qualcosa deve STAMPARE il numero.
* ⛔ Prima del push: `node tools/controllo-push.js`.
* ⚠️ Netlify ci mette fino a un minuto e mezzo. Un →404← subito dopo il push non è un guasto: si riprova.
* ⚠️ `prove-claude/` è nel `.gitignore`: i banchi non vanno mai nel `git add`.
* ⛔ Claude NON crea account e non preme il pulsante finale di una registrazione. Riempie il modulo con dati finti, arriva fino al pulsante, e controlla nel database cosa succederebbe.

## DOVE SIAMO
La notte del →6← settembre sono stati chiusi i quattro problemi rimasti dopo lo smontaggio (le formule gemelle, il gestionale lento, la tastiera, le spiegazioni): commit →67f5355←, →0323ebc←, →0e1e1c9←, →4124d06←. Il gestionale delle IMPRESE è a posto.

Poi Alessio ha detto una cosa: **«il gestionale negozio l'ho sempre lasciato indietro e ho sbagliato»**. È stato misurato quanto, ed è stata provata la registrazione dal vivo.

**Il risultato è controintuitivo e va tenuto a mente: la registrazione negozio FUNZIONA.** Modulo intero, cascata regione→provincia→città giusta, trigger che copia i campi, →0← errori nel registro dei trigger in →30← giorni, →3← mesi di Premium regalati che arrivano davvero. **I negozi non si iscrivono perché la porta è rotta: la porta funziona.** Il problema è prima della porta.

Quello che è stato trovato:
* ⛔ **Nella vetrina ogni negozio si chiamerebbe «Negozio»** — `cerca-negozi.html` riga →517← usa `i.nome_negozio`, una colonna che NON esiste, e la riga →553← non la chiede nel `select`. Il ripiego è la parola «Negozio».
* ⛔ **«Negozi» non sta nel menu in alto** — `cerca-artigiani` è linkata da →163← pagine, `cerca-negozi` da →43←.
* In cinque mesi: →64← artigiani, →45← imprese, →6← professionisti, **→0← negozi**.

## LA FILA DI DOMANI, in ordine

⛔ **Una per volta, con push e collaudo dal vivo in mezzo. Non prenderne due insieme.**

### A1 · Il nome vero del negozio nella vetrina — →10← minuti
`cerca-negozi.html`: la card deve scrivere `nome_attivita` (o `nome`), non `nome_negozio`. Guarda anche che il `select` di riga →553← porti su la colonna giusta. ⚠️ Serve un modo per VEDERLO: nel database c'è un solo negozio ed è finto (`is_test`), quindi dalla vetrina pubblica non esce. Decidi tu come collaudarlo e spiegalo ad Alessio.

### A2 · «Negozi» nel menu in alto — ~→1← ora
Da →43← a →163← pagine. ⚠️ Prima di toccare →120← file, fai vedere ad Alessio l'anteprima del menu nuovo (computer E telefono): una voce in più in una barra che sul telefono è già stretta si vede subito se sta o non sta.

### C1 · Il banco «stessa forma» — →mezza giornata←
**È la cosa che conta più di tutte.** Il negozio resta indietro non per disattenzione ma perché **niente lo dice**: →228← commit sull'app contro →47← sul negozio in →30← giorni, e nessun campanello. Serve un banco che confronti i due file — sezioni, funzioni condivise, js caricati, protezioni — e diventi **rosso quando l'app prende una cosa che il negozio non ha**. Progettalo tu, spiegagli come funziona, e fallo girare anche col `--sabota`.
⚠️ Esiste già una skill che si chiama `stessa-forma`: guardala prima, magari c'è già metà del lavoro.

### B1 · La sezione «Dal sito» nel gestionale negozio — →mezza giornata←
Un negozio ha una scheda pubblica e riceve richieste come tutti gli altri, e quelle richieste **non arrivano da nessuna parte**. È il collegamento marketplace → gestionale, cioè l'unica cosa che questo gestionale ha e i concorrenti no. Nel gestionale delle imprese la sezione si chiama `dalsito`: si copia da lì, non si reinventa.

### Se avanza tempo (facoltativo)
* **A3** le altre →6← pagine che nominano `nome_negozio` — →30← min
* **A4** il `<form>` nelle →4← registrazioni: oggi premere Invio non manda niente, e sul telefono il tasto «Vai» è quello che tutti premono — →30← min
* **A5** il testo sotto la password promette «maiuscole, numeri e simboli» ma il controllo vero è solo →8← caratteri — →5← min
* **B2** «Assistenza» e «Richieste» nel negozio — →2← ore
* **B3** «Controlla prima di mandarlo» (non è AI: sono regole) — →2← ore
* **B4** «✨ Compila con AI» (`ai-integrazione.js` è già caricato, manca l'aggancio) — →2← ore
* **B7** l'ascoltatore Invio/barra spaziatrice e i →5← comandi-non-comandi del negozio — →30← min

## ⚖️ LA DOMANDA CHE DECIDE ALESSIO, e va fatta PRIMA di cominciare
I negozi sono una strada da percorrere o no? In cinque mesi ne sono arrivati →0←. Se la risposta è no, meglio saperlo prima di spendere una giornata: si fanno solo A1 e A3 (sono difetti veri che sporcano il sito comunque) e si lascia stare il resto. Se la risposta è sì, si parte da A1 e A2, che insieme sono un'ora.

⛔ **E LA LEZIONE DELLA NOTTE DEL →6←, che vale anche qui:** misurare cambia la cura. Due delle tre ipotesi di Alessio sulla lentezza del gestionale erano sbagliate, e solo il numero lo diceva. Prima di aggiustare qualcosa perché «sembra il problema», misuralo.

Comincia chiedendogli la domanda qui sopra, e poi fai A1 e fermati.
