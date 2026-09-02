# Prompt per la sessione nuova — 3 settembre 2026
(Da incollare in una sessione Cowork nuova.)

Ciao. Sono Alessio, TrovaImpresa (`trovaimpresa.com`). La cartella è
`C:\Users\Utente\Downloads\trovaimpresa`, che in Cowork si apre come
`$HOME/mnt/trovaimpresa`.

**Prima di scrivere una riga di codice, leggi in `CLAUDE.md` l'ultimo
capitolo:**

> **«2 SETTEMBRE 2026 — LA SCHEDA CHE SI FA CERCARE, E LE QUATTRO CARTE DEL
> GESTIONALE»**

Leggilo tutto, ma soprattutto due pezzi, perché sono costati un'ora:

* **«⛔ LE QUATTRO CARTE DEL GESTIONALE — E L'ORA BRUCIATA»**
* **«⛔ TRE TRAPPOLE IN CUI SONO RICASCATO OGGI»**

---

## Come lavoriamo — le regole che valgono sempre

* Rispondimi in italiano, semplice e pratico. Messaggi corti, massimo una
  decina di righe: **ho la dislessia**. Una cosa per volta e una domanda per
  volta.
* ⛔ **Non farmi scegliere fra alternative scritte.** Se non capisci cosa
  voglio, **non rifarmi la domanda a parole e non propormi «A o B»**:
  costruiscilo, fotografalo, fammelo vedere. E se te lo ripeto due volte,
  **chiedimi un disegno**: te lo faccio a penna e te lo fotografo.
* ⛔ **Mai testo sotto i 13 px**, da nessuna parte. Mai testo tagliato a metà.
* ⛔ **Colori e misure**: si copiano da quelli già nel file. Un colore o una
  misura nuovi **me li chiedi prima**.
* ⛔ **Nessun comando git dalla cartella collegata, nemmeno `git status`.**
  Una volta ha creato un `.git/index.lock` fantasma e mi ha bloccato i commit
  per ore. **Il push lo faccio io da Git Bash.**
* Il blocco git me lo dai su **una riga sola**, preceduto da
  `node tools/controllo-push.js`, e nel `git add` **solo i file toccati**.
  ⚠️ `prove-claude/` è nel `.gitignore`: se lo metti nella riga, `git add`
  fallisce e la catena `&&` si ferma senza pubblicare niente.
* ⛔ **I file e le figure me li scrivi tu direttamente in cartella**
  (`device_commit_files`), con l'**md5 verificato dalle due parti**.
  **Io non scarico niente dalla chat**, nemmeno le immagini.
* Le **query SQL una per volta**, e ognuna deve rispondere con **una riga
  sola**: la lancio io nell'SQL Editor di Supabase e ti incollo la risposta.
* **Tutto quello che scrivi nel mio database durante le prove lo cancelli
  dopo**, facendomi vedere il conto prima e dopo.
* ⛔ **Non tocchi title, meta, canonical e JSON-LD senza chiedermelo.**
* **Mai una conferma dietro l'altra.** Se è un difetto, lo sistemi. Se è una
  cosa nuova, me lo chiedi **una volta sola**. Se dico «non so», decidi tu e
  me lo spieghi in una riga.

### ⛔ La consegna è SEI cose, sempre — anche per due righe

1. **banco verde** (nel `prove-claude/`, col «metro»: deve girare anche sulla
   copia di prima e diventare rosso)
2. **`node tools/controllo-push.js` verde**
3. **md5 uguale dalle due parti**
4. **la scheda di collaudo** (skill `collaudo-obbligatorio`)
5. **il blocco git su una riga**
6. **i passi numerati da cliccare** («PROVA TU COSÌ»)

Se ne manca una, non è consegnata.

---

## ⛔ Da fare per prima cosa, se non l'ho ancora pushato

L'ultima consegna del 2 settembre è **in cartella ma forse non online**.
Chiedimi se l'ho pushata; se no, ridammi la riga:

```
node tools/controllo-push.js && git add pannello-artigiano.html && git commit -m "Gestionale: quattro carte per gestionale, il nome in mezzo, bottoni tutti blu" && git push
```

`pannello-artigiano.html` — md5 `581eda1a1d134f91cb0d1d28dc598fbf`

---

## IL LAVORO DI QUESTA SESSIONE

### 1. Le quattro carte sugli altri pannelli (la prima cosa)

Le quattro carte del gestionale esistono **solo in `pannello-artigiano.html`**.
Vanno portate identiche in:

* `pannello-impresa.html`
* `pannello-professionisti.html`

⚠️ **Non tagliare e incollare a occhio.** Il 2 settembre una sostituzione
automatica ha incastrato le carte una dentro l'altra. Si riscrive il blocco da
un generatore e poi **si contano i pezzi**: `<div` contro `</div>`, quante
carte (8), quanti id doppi (0), e il banco `banco-4-carte-gestionale.js` va
fatto girare su tutti e tre i pannelli.

⛔ `pannello-negozio.html` **resta fuori**: ha la testata vecchia e la
copertina rotta. Quello è un lavoro a parte.

### 2. La quarta casella «Contatti» sugli altri pannelli

Stessa cosa: la casella «quante persone ti hanno cercato questo mese» sta solo
nell'artigiano. Banco: `banco-contatore-contatti.js`.

### 3. Titolo e descrizione delle foto dei lavori

Sono **già nel database** (76 foto su 134 ce l'hanno) e **non si vedono da
nessuna parte**. È roba scritta: si accende e basta.

### 4. L'elenco delle richieste di contatto nel pannello

La tabella `contatti` adesso si riempie. Manca la pagina che dice
all'impresa **chi** l'ha cercata e **quando**.

---

## Il resto aperto, in ordine di quanto pesa

* **`pannello-negozio.html`**: ultima testata vecchia, e la copertina non si
  carica (scrive in `<id impresa>/banner.<ext>` invece che nella cartella
  dell'`user_id`: le regole RLS lo bloccano).
* **La cancellazione della chat dal lato impresa** — scritta in
  `prove-claude/LAVORI-DA-FARE.md`.
* Il **logo di TrovaImpresa nella barra della scheda** viene sostituito dal
  logo personalizzato dell'impresa. Mai deciso se è voluto.
* Il pulsante **«📱 Mobile»** dell'Anteprima nei pannelli non funziona.
* Gli **orari** sono una colonna vuota su tutte: da riempire o da togliere.
* I **4 pezzi di CSS sotto i 13px** rimasti dai widget tolti (`.cdh` 9,
  `.cd` 12, `.cd.oggi` 11, `.ms-l` 10): da buttare o no.
* Serve un **negozio finto**: nel database non esiste nessun `negozio`.
* La **barra «profilo completo al x%»** nel pannello: 44 imprese su 82 non
  hanno una descrizione e non lo sanno.

## Le due decisioni mie ancora ferme

* **Il nodo dei 49 €** (la collisione fra i piani).
* **Quanto vale un credito chat.**

Non decidere tu: ricordamele quando arriviamo lì.

---

## Dove sono le cose

* I pannelli: `pannello-artigiano.html` (il riferimento), `pannello-impresa.html`,
  `pannello-professionisti.html`, `pannello-negozio.html` (vecchio).
* La scheda pubblica: `profilo-impresa.html`.
* Il gestionale imprese: `gestionale-app.html` (~950 KB); il conto della
  fattura sta **fuori**, in `js/gest-fatture.js`.
* Lo stile del gestionale: `css/gestionale.css` (le carte sono `.rie-card`,
  riga ~1263).
* I banchi: `prove-claude/` (46 file, tutti verdi al 2 settembre sera).
* Il controllo prima di pubblicare: `node tools/controllo-push.js`.
* Le figure delle ultime consegne: `prove-claude/figura-4-quadrate.png`.
