# PROMPT PER LA PROSSIMA SESSIONE — finire di smontare gestionale-app.html

Copia tutto quello che sta sotto la riga e incollalo in una sessione nuova di Cowork.

---

Ciao. Oggi finiamo un lavoro cominciato il 6 settembre 2026: smontare a fette il file
`gestionale-app.html` di TrovaImpresa. La cartella è `C:\Users\Utente\Downloads\trovaimpresa`
(in Cowork si apre come `$HOME/mnt/trovaimpresa`).

**Prima di toccare qualsiasi cosa leggi, in questo ordine:**

1. `CLAUDE.md`, l'ultima sezione: «IL 6 SETTEMBRE 2026 — POMERIGGIO: IL COMPUTO E LO SMONTAGGIO»
2. `prove-claude/banchi-fissi/smontaggio/banco-fette.js` — il banco che protegge questo lavoro
3. `LAVORI-APERTI.md`

## DOVE SIAMO

`gestionale-app.html` era **17.048 righe** (626 di HTML, il resto JavaScript scritto dentro
la pagina; il CSS è già tutto fuori in `css/`). Sono già state staccate 3 fette:

- `js/gest-documenti-pdf.js` (1.093 righe) — i 4 documenti in PDF
- `js/gest-galleria-mappa.js` (607) — Galleria e Mappa
- `js/gest-report.js` (263) — Report

**Adesso il file è a 15.089 righe.** Ne restano 5 di fette, e poi ci si ferma.

## COME SI STACCA UNA FETTA — il metodo, già collaudato 3 volte

I file staccati **non sono chiusi dentro una IIFE**: vivono nello stesso spazio del codice
della pagina, quindi vedono `sb`, `sbUid`, `esc`, `eur2`, `toast`, `$` e tutti gli aiuti
comuni senza che nessuno glieli passi. Quindi staccare è: **taglia, incolla in un file
nuovo, aggiungi un `<script src>`** accanto agli altri `gest-*.js` (riga ~608).
Non si riscrive nessuna logica.

### Le 3 regole che sono costate care

1. ⛔ **Un nome dichiarato due volte spegne TUTTA la pagina al caricamento.** Schermo bianco,
   subito, per tutti. La prova 3 del banco lo controlla su tutti i file aperti.
   (I file *chiusi* dentro una IIFE — `gest-chat.js`, `aiuti.js`, `fondatore.js`,
   `ai-integrazione.js` — non si scontrano con nessuno.)

2. ⛔ **Al primo livello di un file staccato non si può USARE niente che stia nella pagina.**
   Il 6 settembre `const GAL_VUOTO = _SVGV + '...'` ha ucciso il file alla prima riga e
   Galleria e Mappa sono rimaste vuote **senza nessun messaggio d'errore**. Nominare una
   cosa della pagina dentro una funzione va bene; usarla subito no.
   La prova 5 del banco lo controlla.

3. ⛔ **Gli aiuti comuni non si portano via.** Se una funzione dentro la fetta è usata anche
   da altre sezioni, resta nel nucleo e si taglia intorno. Già successo con `_fileOrfano`
   (usato in 8 punti) e con `_fetchAllExport`/`esportaExcel`.

### La procedura, passo per passo

1. **Scriviti i numeri PRIMA.** Apri le sezioni che stai per toccare e segnati cosa dicono
   (quante foto, quanti clienti, che totali). È l'unica difesa contro i guasti muti.
2. Trova i confini veri con uno script, non a occhio: elenca le funzioni di primo livello
   con le loro righe e scegli un blocco contiguo.
3. Controlla chi usa quei nomi da fuori e che nessuno si scontri con i file già staccati.
4. Taglia, scrivi il file nuovo con un commento in testa che spiega **cosa c'è dentro,
   cosa NON c'è e perché**, aggiungi il `<script src>`.
5. Aggiungi 3 righe alla tabella `FETTE` in cima a `banco-fette.js`.
6. `node prove-claude/banchi-fissi/smontaggio/banco-fette.js` → deve essere tutto verde.
   Poi `--sabota` → devono uscire rosse.
7. `node tools/controllo-push.js`
8. Dai ad Alessio **un blocco git solo**, che comincia sempre con `rm -f .git/index.lock`.
9. **Aspetta che lui pubblichi**, poi collauda dal vivo nel gestionale e **riconta i numeri
   del passo 1**.

⛔ **Una fetta per volta.** Push e collaudo in mezzo. Se ne stacchi tre insieme e qualcosa
si rompe, non sai quale delle tre.

⛔ **Claude non lancia git senza `--no-optional-locks`.** Ogni git che tocca l'indice lascia
`.git/index.lock`, che Claude non ha il permesso di cancellare sul computer di Alessio: da
quel momento ogni git suo si ferma con «Unable to create index.lock». È già successo 3 volte.
In sola lettura si usa sempre `git --no-optional-locks status` / `log`. Se il lock c'è già,
si SPOSTA (`mv .git/index.lock _to_delete/`), non si insiste.

## LE 5 FETTE, IN ORDINE DI RISCHIO

### Passo 1 — Fetta B · IL RIEPILOGO  (~750 righe, rischio BASSO)
`renderRiepilogo` sta a **riga 4113** ed è un blocco unico di 750 righe. È la più pulita
che resta: si stacca tutta intera. → `js/gest-riepilogo.js`
Numeri da segnarsi prima: tutte le schede del Riepilogo (lavori in ritardo, preventivi
fermi, mezzi con scadenza, totali).

### Passo 2 — Fetta D · SQUADRA E SCADENZE DELLE PERSONE  (~600 righe, rischio BASSO)
Da `squadraForm` (riga 6178) fino alla fine di `dipElimina` (riga 6381 + 166) e il blocco
delle scadenze delle persone. → `js/gest-squadra.js`
⚠️ Attenzione a `dipCache`: la usano anche la Galleria e l'Agenda. Se è dichiarata dentro
il blocco, resta nel nucleo.

### Passo 3 — Fetta C · PREVENTIVI  (~700 righe, rischio MEDIO)
`prevForm` (12288), `savePrev` (12456), `prevToLavoro` (12592) e il decreto parametri.
→ `js/gest-preventivi.js`
⚠️ `prevPdf` è **già** in `gest-documenti-pdf.js`: non riportarlo indietro.
⚠️ `prevCache` la leggono altri: controlla prima di portarla via.

### Passo 4 — Fetta F · CLIENTI, FORNITORI, DATI AZIENDA  (~900 righe, rischio BASSO)
`renderClienti` (5861), `cliForm` (9099), `renderFornitori` (7158), `fornForm` (7456),
`aziendaForm` (9972), `saveAzienda` (10106). Sono blocchi **sparsi**: o si fanno due file
(`gest-clienti-fornitori.js` e `gest-azienda.js`) o si fa un taglio per volta.
⚠️ `delPanel` (9749) NON è di questa fetta: è il pannello di eliminazione generale.

### Passo 5 — Fetta E · MEZZI, ATTREZZATURE, NOLEGGIO  (~800 righe, rischio MEDIO)
`renderMezzi`/`renderAttrezzature` (6586) e il noleggio. → `js/gest-mezzi.js`
⚠️ Il noleggio ha il filtro sulla FASE (`fuori`/`rientrato`) che sta in **due punti** —
Riepilogo e Report — e i due si erano già scollati una volta. Se la fetta B è già uscita,
uno dei due è in `gest-riepilogo.js` e l'altro in `gest-report.js`: **scrivilo nei commenti
di tutti e due**.

### NON FARE la fetta H
Il «foglio» che si apre (`closeSheet`, `ctInit`, ~1.100 righe) e la chat aperta da fuori
sono l'unica parte ad alto rischio: le tocca mezzo gestionale. Lasciala dov'è, a meno che
Alessio non lo chieda.

## QUANDO SI FINISCE
Fatte tutte e 5, il file arriva intorno alle **11.000 righe**. Le ultime 11.000 sono il
nucleo — aiuti comuni, tabelle, menu, stato condiviso — e spezzare quello sarebbe peggio
del male. Non insistere oltre.

## COME PARLARE AD ALESSIO
Non è un tecnico di formazione. Ogni operazione va spiegata **a clic**, con passaggi
numerati. I numeri e i commit vanno isolati coi marcatori →così←. A fine lavoro vuole
**un riassunto** e il **passo successivo consigliato**. Se hai un'opinione diversa dalla
sua, gliela dici — vuole il parere onesto, compreso cosa non funziona. E prima di toccare
i file per qualsiasi cosa che **si vede a schermo**, gli fai vedere prima l'anteprima
(computer E telefono).

Comincia dal **Passo 1** e fermati dopo quello, per il collaudo.
