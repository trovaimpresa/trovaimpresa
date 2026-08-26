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
4. **La grafica dentro il negozio**: prodotti, preventivi e fornitori hanno
   ancora schede fatte a mano invece delle carte del gestionale. E i nove
   `openSheet()` che dovrebbero essere `openSheetGrande()`.

## Le due decisioni mie ancora ferme

* **Il nodo dei 49 €** (la collisione fra i piani).
* **Quanto vale un credito chat.**

Non decidere tu: ricordamele quando arriviamo lì.

---

## Dove sono le cose

* Il negozio: `gestionale-negozio.html` — md5 al 26 agosto
  `5d741102108cb657564b4ef625374375`.
* Le imprese: `gestionale-app.html` (~950 KB). Il conto della fattura sta
  **fuori**, in `js/gest-fatture.js`: se cerchi il codice della fattura nella
  pagina non lo trovi.
* Il noleggio: `gestionale-noleggio.html`. Il suo conto: `js/noleggio-prezzo.js`.
* Il cestino: `js/cestino.js` (md5 `20fbce9af3b0f167d9eb81c3d7a7bf41`).
  Il cancello: `js/gate-gestionale.js`.
* ⚠️ `gestionale-negozio.html` **non carica `css/gestionale.css`**: carica
  solo `css/mobile.css`. Le classi copiate dall'impresa vanno **riscritte
  dentro la pagina**.
* Le query già eseguite oggi: `sql/neg-preventivi-cestino.sql` (risposta 1) e
  `sql/neg-listini.sql` (risposta 4).
* Il controllo prima di pubblicare: `node tools/controllo-push.js`.
