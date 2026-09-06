# Prompt per la sessione nuova — dopo la sera del 6 settembre 2026

Copia tutto quello che sta sotto la riga e incollalo in una sessione nuova di Cowork.

⚠️ Gli altri file `PROMPT-*.md` e `prompt-nuova-sessione.md` in questa cartella
sono VECCHI (4 e 5 settembre, noleggio, smontaggio). Questo e' quello buono.

---

Ciao. Lavoriamo su TrovaImpresa, cartella `C:\Users\Utente\Downloads\trovaimpresa`
(in Cowork si apre come `$HOME/mnt/trovaimpresa`).

Prima di toccare qualsiasi cosa leggi, in questo ordine:

1. `CLAUDE.md`, le ultime due sezioni: «IL 6 SETTEMBRE 2026 — POMERIGGIO» e
   «IL 6 SETTEMBRE 2026 — SERA: SEI FETTE IN UNA SESSIONE»
2. `LAVORI-APERTI.md`, la sezione in cima
3. `prove-claude/banchi-fissi/smontaggio/banco-fette.js`

## COME PARLARE AD ALESSIO

Non e' un tecnico di formazione: ogni operazione va spiegata **a clic**, con
passaggi numerati (dove andare, quale pulsante, cosa incollare, cosa deve
vedere dopo). Numeri e commit isolati coi marcatori →così←. Prima di toccare i
file per qualcosa che si vede a schermo, gli fai vedere **l'anteprima**
(computer E telefono) e aspetti il suo ok. A fine lavoro: riassunto e passo
successivo consigliato. Se hai un'opinione diversa dalla sua, gliela dici —
vuole il parere onesto, compreso cosa non funziona.

## LE REGOLE DI FERRO

- ⛔ Claude non lancia git senza `--no-optional-locks`. In sola lettura sempre
  `git --no-optional-locks status/log`. Se `.git/index.lock` c'e' gia', si
  SPOSTA (`mv .git/index.lock _to_delete/`), non si insiste.
- ⛔ Ogni blocco git per Alessio comincia con `rm -f .git/index.lock`.
- ⛔ Una cosa per volta: push e collaudo dal vivo in mezzo. Mai due lavori in
  un push solo.
- ⛔ Prima di toccare una sezione, ci si SCRIVONO i numeri che mostra; dopo il
  push si ricontano. E' l'unica difesa contro i guasti muti.
- ⛔ Ogni lavoro ha un banco in `prove-claude/banchi-fissi/`, e il banco va
  provato anche col `--sabota`: se sabotato non diventa rosso, non sta
  misurando niente.
- ⛔ Prima del push: `node tools/controllo-push.js`.
- ⚠️ Netlify ci mette fino a un minuto e mezzo. Un →404← subito dopo il push
  non e' un guasto: si riprova.

## DOVE SIAMO

Il →6← settembre `gestionale-app.html` e' passato da →17.048← a →12.638←
righe (−→26%←) staccando →9← file `js/gest-*.js`. Il resto e' il nucleo: non
si spezza oltre senza motivo.

Restano **quattro** problemi aperti, in ordine di importanza. Fanne **uno per
volta**, e fermati dopo ognuno per il collaudo.

---

## PROBLEMA 1 — LA STESSA FORMULA IN DUE POSTI (il piu' grave)

Il conto dei costi della sicurezza sta in `compRiepilogo()` dentro
`js/gest-computo.js` **e** nella vista di database `gest_computo_totali`. Sono
gemelli e devono dare lo stesso numero. Sopra c'e' scritto un commento che dice
«si cambiano insieme» — **ma un commento non e' una protezione**. E' gia'
successo con le fatture: la stessa formula in tre posti, tre numeri diversi.

E dal →6← settembre ce n'e' un secondo: il filtro sulla **FASE** del noleggio,
`(fase||'fuori') !== 'prenotato'`, sta in `js/gest-riepilogo.js` (riga ~→278←)
**e** in `js/gest-report.js` (riga ~→130←). Oggi sono allineati; prima si erano
gia' scollati una volta, e adesso stanno in due file diversi.

Quello che serve non e' riscrivere le formule: e' **un banco che le confronta
da solo e diventa rosso quando si scollano**, cosi' se ne accorge la macchina
invece di Alessio davanti a una gara. Progettalo tu, spiegagli come funziona e
fallo girare anche col `--sabota`.

---

## PROBLEMA 2 — IL GESTIONALE E' LENTO A RISPONDERE

Dopo ogni salvataggio la lista si ridisegna con →1-2← secondi di ritardo. Su un
computo da sessanta voci si sente. **Il danno vero non e' l'attesa: e' che
inganna.** Alessio ha creduto due volte che una riga non fosse stata salvata
quando invece c'era.

Prima misura, poi proponi: dove se ne vanno quei secondi (una lettura in piu'?
un ridisegno intero invece che della sola riga? il «render pigro»?). Poi decidi
con lui se la cura e' far tornare la risposta piu' in fretta o **far vedere
subito che il salvataggio e' andato** — spesso la seconda vale piu' della prima.

---

## PROBLEMA 3 — LE SCHEDE DEI REPARTI NON SONO PULSANTI

`gestionale-app.html`, riga ~→2184←:

    <div class="panel-card" data-action="enter" data-p="${p.id}">
      <button class="pc-del" data-action="del-panel" data-id="${p.id}" title="Elimina reparto">🗑</button>

La scheda e' un `div`: da tastiera non ci si arriva. Il cestino e' un
`<button>`: da tastiera ci si arriva. **Sull'unica scheda di una schermata si
puo' cancellare un reparto ma non entrarci.** E' un danno che fa male una volta
sola e in modo definitivo.

Guarda anche se lo stesso schema (`div` con `data-action`) c'e' altrove nel
gestionale: se si', dillo, non aggiustarne uno solo di nascosto.

---

## PROBLEMA 4 — LE SPIEGAZIONI A MACCHIA DI LEOPARDO

La sezione **Ore** ha →4← righe di spiegazione addosso; il **computo** ha
paragrafi lunghi in cima; altre sezioni non hanno niente.

La regola di Alessio, del →29← agosto: **niente spiegazioni addosso alle cose
che si capiscono da sole** — «tutti sanno usare una chat». Nella Chat con AI ha
fatto togliere la riga sotto il titolo, il messaggio di benvenuto, le domande di
esempio e la scritta sui tasti. La stessa regola non e' stata applicata
dappertutto.

⚠️ Non e' un taglio a tappeto: certe spiegazioni dicono cose che a occhio non si
capiscono (perche' il costo orario entra nel margine, cosa fa il ribasso).
Quelle restano. Fai prima un **giro completo** e portagli un elenco: sezione per
sezione, cosa toglieresti e cosa terresti e perche'. **Fagli vedere l'anteprima
prima di toccare i file.**

---

## SE AVANZA TEMPO — il resto dello smontaggio (facoltativo)

Due blocchi non sono usciti, e non perche' siano difficili: sono i punti dove il
gestionale si tiene insieme.

- **C · Preventivi** — →1.112← righe contigue, ma dentro ci sono **sei** aiuti
  che li chiamano altri file gia' staccati: `prevCache`, `impRiga`,
  `calcolaParcella`, `_rigaSezione`, `_scriviRighePrev`, `AVVISO_SEZIONI`.
  Vanno tagliati **intorno**, in sei punti.
- **F3 · Clienti** — →3← pezzi lontani, `cliIndirizzo` e `_rigaDato` da
  schivare, e in mezzo `commForm`/`saveComm`/`docCommApri`, che e' il
  **commercialista** e coi clienti non c'entra.

La tabella completa di chi chiama cosa sta in `CLAUDE.md`, sezione della sera
del →6← settembre. Non rifare quel lavoro: leggilo.

⛔ **E la lezione piu' importante del →6← settembre:** il banco
`banco-fette.js` era andato **cieco** — saltava un intero file per via di un
IIFE annidato — **e continuava a dire ✅ verde**. E' stato scoperto solo perche'
un numero di passaggio era rimasto →8← invece di →9←. **Ogni prova che conta
qualcosa deve stampare il numero, e quel numero va letto.** Se metti mano a un
banco, controlla prima che stia ancora guardando quello che dice di guardare.

Comincia dal Problema →1← e fermati dopo quello.
