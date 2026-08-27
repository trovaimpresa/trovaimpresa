# Prompt per la sessione nuova — il giro della merce nel negozio
(Scritto la sera del 26 agosto 2026. Da incollare in una sessione Cowork nuova.)

Ciao. Sono Alessio, TrovaImpresa. Si continua sul **gestionale negozio**.

Prima di tutto: leggi `CLAUDE.md` nella cartella del progetto
(`C:\Users\Utente\Downloads\trovaimpresa`, che in Cowork si apre come
`$HOME/mnt/trovaimpresa`). In fondo c'è la sezione che ti serve:

**«26 AGOSTO 2026 — IL NEGOZIO CHE FUNZIONA, E IL BANCO CHE MANCAVA A DUE
GESTIONALI SU TRE»**

Leggila tutta, ma soprattutto due pezzi:
- **«⛔ IL BUCO VERO DEL NEGOZIO, TROVATO A FINE GIORNATA»** — è il lavoro
  di questa sessione.
- **«⛔ LA LEZIONE PIÙ CARA DELLA GIORNATA — il finto restituiva le righe
  VERE»** — se scrivi banchi, quella regola vale sempre.

---

## Come lavoriamo — le regole che valgono sempre

* Rispondimi in italiano, semplice e pratico. Messaggi corti, massimo una
  decina di righe: ho la dislessia. **Una cosa per volta, e una domanda per
  volta.** Se mi dai tre istruzioni insieme mi perdo.
* ⛔ **Mai testo sotto i 13 px**, da nessuna parte.
* ⛔ **Nessun comando git dalla cartella collegata, nemmeno in sola lettura.**
  Un `git status` una volta ha creato un `.git/index.lock` fantasma e mi ha
  bloccato i commit per ore. **Il push lo faccio io da Git Bash.**
* Il blocco git me lo dai su **una riga**, preceduto da
  `node tools/controllo-push.js`. ⚠️ `prove-claude/` è nel `.gitignore`: se lo
  metti nel `git add` la catena `&&` si rompe e il push non parte.
* ⛔ **I file me li scrivi tu direttamente in cartella** (`device_commit_files`)
  e mi confermi l'**md5 verificato sul posto**. Non farmi scaricare niente
  dalla chat.
* Le **query SQL una per volta**, e ognuna deve rispondere con **una riga
  sola**: la lancio io nell'SQL Editor di Supabase e ti incollo la risposta.
* I banchi di prova stanno nel **tuo** contenitore. Lo zip finito va in
  `prove-claude/`.
* ⚠️ Se non capisco una domanda, **non me la rifare a parole**: costruiscila,
  fotografala, fammela vedere.
* ⛔ **Chiedimi prima di costruire cose che non ti ho chiesto.** Una lista non
  è un ordine. Un difetto invece si sistema e basta.
* **Consegna = quattro cose:** banco verde · controllo verde · md5 uguale
  dalle due parti · blocco git. Più i passi numerati da cliccare.

---

## Lo stato dei banchi (tutti verdi, al 26 agosto)

| gestionale | prove | sabotaggi | zip in `prove-claude/` |
|---|---|---|---|
| Noleggio | 808 | — | `banco-noleggio-25ago-4.zip` |
| Negozio — funzionamento | **245** | **84** | `banco-negozio-funziona-26ago.zip` |
| Negozio — scritte 13 px | 17 | 4 | `banco-negozio-26ago.zip` |
| Imprese — funzionamento | **89** | **25** | `banco-imprese-funziona-26ago.zip` |

Come si fanno girare (scompatta lo zip nel tuo contenitore):

```
mkdir -p /root/lavoro && ln -sfn <la copia del sito> /root/lavoro/sito
export TZ=Europe/Rome
node prove/negozio-funziona/banco.js       # 245 prove, ~3 minuti
node prove/impresa-funziona/banco.js       #  89 prove, ~3 minuti
SOLO=C node prove/negozio-funziona/banco.js   # una famiglia per volta
```

⚠️ L'email del finto utente deve essere `pintoalessio@icloud.com`: il cancello
(`js/gate-gestionale.js`) fa entrare solo quella.

⚠️ Dentro ogni zip c'è un `COME-SI-USA*.md` che dice **cosa il banco NON
prova**. Leggilo prima di fidarti del numero verde.

---

## ⛔ IL LAVORO DI QUESTA SESSIONE

**Il giro della merce nel negozio: merce che entra, merce che esce, e la
giacenza che ne è la conseguenza.**

Oggi nel negozio quelle sono **tre cose scollegate**:

| dove | cosa fa | cosa NON fa |
|---|---|---|
| Preventivo accettato | scarica il magazzino ✔ e scrive il movimento ✔ | — |
| **Movimenti → «Vendita»** (riga ~2504) | scrive una riga | ⛔ **non scala il magazzino**, e il prodotto è **testo scritto a mano** (`nm-prodotto`), non collegato a `neg_prodotti` |
| **Magazzino → + / −** | aggiorna `neg_prodotti.quantita` | ⛔ **non scrive nessun movimento**: la giacenza cambia e non si sa perché |

Per un negozio quello è **il giro principale della giornata**. Solo la strada
del preventivo lo fa bene.

### ⚠️ Prima di scrivere una riga, chiedimi queste cose

Non decidere da solo: sono decisioni mie, non tecniche.

1. Quando registro una **vendita** nei Movimenti, il prodotto lo devo
   **scegliere dal magazzino** o lo devo poter ancora **scrivere a mano**?
   (Ci sono cose che vendo e non tengo a magazzino.)
2. Se lo scelgo dal magazzino, la vendita **scala la giacenza da sola**?
   E se scendo sotto zero, cosa deve fare?
3. Quando correggo la giacenza dal **Magazzino** (l'inventario, la rottura,
   il calo), voglio che lasci una **traccia** nei movimenti? Con che parola —
   «rettifica»? Oggi i tipi sono due soli: `vendita` e `ordine`.
4. Un **ordine al fornitore** che arriva deve **caricare** il magazzino?

Fammi vedere le alternative con una figura, non con un elenco a parole.

### Cose da sapere prima di toccare

* `neg_movimenti` ha: `tipo` (`vendita` | `ordine`) · `prodotto` (testo) ·
  `quantita` · `importo` · `controparte` · `data_mov` · `note`.
  **Non ha un `prodotto_id`.** Se serve, è una colonna nuova → una query SQL.
* ⛔ **Il terzo tipo di movimento è pericoloso**: fino a stamattina esisteva
  un `uscita` che nessuno riconosceva, e faceva contare una vendita fra le
  spese. Se nasce un `rettifica`, vanno aggiornati **tutti** i posti che
  leggono `tipo`: elenco movimenti, riepilogo (venduto/ordinato del mese),
  report, export Excel e CSV.
* Ogni cosa che cambi **diventa una prova sul banco** (famiglia B o F di
  `prove/negozio-funziona/banco.js`) e un **sabotaggio**.

---

## Se avanza tempo, in ordine

1. **Il collaudo a mano del negozio**, che ho rimandato: listini, cestino,
   barra, «Da sistemare oggi», ricerca. Sono 31 passi numerati — accompagnami
   uno per volta, con la foto di cosa devo vedere.
2. **Il resto del banco delle imprese**: il PDF e l'XML della fattura (è la
   fine della strada dei soldi e non lo prova nessuno), la parcella dello
   studio tecnico (cassa e ritenuta), poi cestino, ricerca, calendario,
   squadra, ore e spese.
3. **Fatture del negozio**: dice ancora «Lavori finiti da fatturare». Non è
   una parola da cambiare, è una decisione mia — in un negozio si fattura un
   preventivo accettato. Fammi vedere come sarebbe, poi decido.
4. **LA GRAFICA DEL NEGOZIO — vedi in fondo a questo file.** Le schede e le
   finestre grandi sono fatte, ma il negozio **sembra ancora un altro
   programma**. E' il lavoro piu' grosso che resta.

## Le due decisioni mie ancora ferme

* **Il nodo dei 49 €** (la collisione fra i piani).
* **Quanto vale un credito chat.**

Non decidere tu: ricordamele quando arriviamo lì.

---

## Dove sono le cose

* Il negozio: `gestionale-negozio.html` — md5 al 27 agosto sera
  `d9c9462d12067ab75c2ea6b0f3ab3f9a`.
* Le imprese: `gestionale-app.html` (~950 KB). Il conto della fattura sta
  **fuori**, in `js/gest-fatture.js`: se cerchi il codice della fattura nella
  pagina non lo trovi.
* Il noleggio: `gestionale-noleggio.html`. Il suo conto: `js/noleggio-prezzo.js`.
* Il cestino: `js/cestino.js` (md5 `20fbce9af3b0f167d9eb81c3d7a7bf41`).
  Il cancello: `js/gate-gestionale.js`.
* ✅ Dal 27 agosto `gestionale-negozio.html` **carica `css/gestionale.css`**
  (oltre a `css/mobile.css`). Le classi buone del gestionale ci sono gia':
  **si usano, non si riscrivono.** Il 27 agosto sera sono state tolte 169
  righe di stile doppie proprio per questo.
* Le query già eseguite oggi: `sql/neg-preventivi-cestino.sql` (risposta 1) e
  `sql/neg-listini.sql` (risposta 4).
* Il controllo prima di pubblicare: `node tools/controllo-push.js`.


---

# ⛔ IL LAVORO CHE MI PREME DI PIU': LA GRAFICA DEL NEGOZIO


## IL LAVORO

**`gestionale-negozio.html` ha una grafica tutta sua. Va rifatta uguale a
`gestionale-app.html` (il gestionale imprese).**

Non «somigliante»: **uguale**. Il negozio deve sembrare la stessa applicazione,
con dentro le parole del negozio.

Il file da cui si copia è **`gestionale-app.html`** + **`css/gestionale.css`**.
Da ieri il negozio carica già `css/gestionale.css`: **le classi buone ci sono
già, basta usarle** invece di riscriverne di nuove.

Usa la skill **`stessa-forma`**: si apre il file di riferimento e si copia riga
per riga. Non si inventa un colore, non si inventa una misura.

---

## QUELLO CHE HO GIÀ TROVATO (non ripartire da zero)

### 1. La barra in alto — la più visibile

| | IMPRESE | NEGOZIO oggi |
|---|---|---|
| classe | `.topbar` (sta in `css/gestionale.css`, riga ~733) | `.topbar-neg`, **scritta a mano dentro la pagina** |
| a sinistra | freccia indietro + pallino colorato + **nome del reparto** + «Reparto attivo» (`.tb-left` / `.tb-id`) | **niente** — il reparto sta nella colonna |
| pulsanti | 5: Dati azienda · **Commercialista** · Backup · Esporta · **Aiuto** (bianco, `.tb-help`) | 3: Dati azienda · Backup · **Esporta i miei dati** (giallo) |
| colore | blu del gestionale | blu scuro diverso |

⛔ **Mancano «Commercialista» e «Aiuto».** «Esporta i miei dati» giallo non
esiste nel gestionale: nelle imprese è «Esporta», uguale agli altri.

**Da fare:** buttare `.topbar-neg` (markup + CSS locale) e mettere lo **stesso
identico blocco `<header class="topbar">`** delle imprese (`gestionale-app.html`
righe ~174-190), con il nome del reparto dentro. Se un pulsante nel negozio non
ha senso, **chiedimelo prima di toglierlo** — non deciderlo da solo.

### 2. Il Riepilogo — la differenza più grossa

- **Imprese**: una **griglia di carte**. Ogni carta = icona colorata in un
  quadratino, titolo, pallino verde/rosso a destra, **numerone**, una riga di
  spiegazione, e **due righe di elenco** sotto una linea.
  Le funzioni sono `rieCard()` e `numCard()`; lo stile sta in
  `css/gestionale.css` (~1137-1300 e ~3651-3678).
- **Negozio**: sei **riquadri piatti** (PRODOTTI · SOTTO SCORTA · MOVIMENTI ·
  VALORE MAGAZZINO · Venduto · Acquistato) e poi un elenco a parte. Nessuna carta.

**Da fare:** il Riepilogo del negozio diventa una griglia di carte come le
imprese — una carta per sezione (Prodotti, Magazzino, Movimenti, Preventivi,
Clienti, Fatture, Fornitori, Report, Calendario, Galleria), con dentro le due
righe più utili.

### 3. La colonna di sinistra

- **Imprese**: in cima **subito le due card** («Chiedi una funzione»,
  «Assistenza diretta»), poi i gruppi. Nessun pulsante grande.
- **Negozio**: in cima il nome del reparto, poi **«+ Nuovo prodotto»** blu, poi
  le due card.

### 4. E TUTTO IL RESTO

⚠️ **Quello sopra è solo quello che si vede dal Riepilogo.** Alessio ha detto:
**«non è solo il riepilogo, è tutto il gestionale negozio, tutte le sue
funzioni»**. Quindi:

**Prima cosa da fare, prima di toccare il codice:**
apri le stesse sezioni nei due gestionali, **fotografale una accanto all'altra**
(Playwright + Chromium sono già nel contenitore, il finto del negozio è
`finto-negozio.js`, quello delle imprese `finto-impresa.js`), e fai **l'elenco
completo** delle differenze, sezione per sezione:

Riepilogo · Prodotti · Magazzino · Movimenti · Preventivi · Clienti · Fatture ·
Fornitori · Report · Calendario · Galleria · Cestino · e le finestre che si aprono.

Poi **mostra le foto affiancate ad Alessio** e fatti dire da dove partire.

---

## COME SI LAVORA (le regole che valgono sempre)

- **Una cosa per volta**, finita e consegnata, prima della prossima.
- ⛔ **Mai testo sotto i 13 px.**
- ⛔ **Nessun comando git dalla cartella collegata.** Il push lo fa Alessio.
  Il blocco git su **una riga**, preceduto da `node tools/controllo-push.js`,
  e nel `git add` **solo i file toccati** (`prove-claude/` è nel `.gitignore`).
- ⛔ **I file li scrive Claude direttamente in cartella** (`device_commit_files`),
  con l'**md5 verificato sul posto**. Alessio non scarica niente dalla chat.
- **Consegna = quattro cose:** banco verde · controllo verde · md5 uguale dalle
  due parti · blocco git. Più i passi numerati da cliccare.
- I banchi del negozio: **298 prove** (funzionamento) + **17** (scritte).
  Devono restare verdi.
- ⚠️ Se Alessio non capisce, **non rispiegare a parole: costruisci la figura,
  fotografala, fagliela vedere.**

---

## LA COSA PIÙ IMPORTANTE

Alessio ha dovuto dire **cinque volte** che la grafica del negozio è diversa,
e ogni volta gli è stato risposto che era a posto. **Non è a posto.**

Prima di dire «fatto», **metti le due foto una accanto all'altra e guardale**.
Se non sembrano la stessa applicazione, non è fatto.
