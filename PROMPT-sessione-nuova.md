# Prompt per la sessione nuova — il Noleggio fuori dal reparto
(Scritto la sera del 24 agosto 2026. Da incollare in una sessione Cowork nuova.)

Ciao. Sono Alessio, TrovaImpresa. Si continua sul gestionale noleggio.

Prima di tutto: leggi `CLAUDE.md` nella cartella del progetto
(`C:\Users\Utente\Downloads\trovaimpresa`, che in Cowork si apre come
`$HOME/mnt/trovaimpresa`). In fondo ci sono due sezioni che ti servono tutte
e due:

- **«24 AGOSTO 2026 — IL COLLAUDO DEL NOLEGGIO, E I TREDICI DIFETTI»**
- **«LA DECISIONE DI FINE GIORNATA — IL NOLEGGIO VA FUORI DAL REPARTO»**

Il referto completo del collaudo sta in
`prove-claude/NOLEGGIO-collaudo-24-agosto.md`.

---

## Come lavoriamo — le regole che valgono sempre

* Rispondimi in italiano, semplice e pratico. Messaggi corti, massimo una
  decina di righe: ho la dislessia. **Una cosa per volta, e una domanda per
  volta.** Se mi dai tre istruzioni insieme mi perdo.
* ⛔ **Nessun comando git dalla cartella collegata, nemmeno in sola lettura.**
  Un `git status` una volta ha creato un `.git/index.lock` fantasma e mi ha
  bloccato i commit per ore. Il push lo faccio io da Git Bash.
* Il blocco git me lo dai su **una riga**, preceduto da
  `node tools/controllo-push.js`. ⚠️ `prove-claude/` è nel `.gitignore`: se
  lo metti nel `git add` la catena `&&` fallisce e il push non parte.
* ⛔ **I file me li scrivi tu direttamente in cartella** (`device_commit_files`)
  e mi confermi l'md5 verificato sul posto. Non farmi scaricare niente dalla
  chat.
* Le **query SQL una per volta**, e ognuna deve rispondere con **una riga
  sola**: la lancio io nell'SQL Editor di Supabase e ti incollo la risposta.
* I banchi di prova stanno nel tuo contenitore, in `prove/` — mai nella mia
  cartella. **Ogni cosa che sistemi diventa una prova sul banco.**
* Prima di consegnare: guarda il risultato in un browser e fai la fotografia.
  **Se un foglio si può scaricare (PDF), scaricalo davvero.**
* **Consegna = quattro cose:** banco verde · controllo verde · md5 uguale
  dalle due parti · blocco git.
* ⚠️ **Prima di costruire qualsiasi cosa nuova, chiedimi se mi serve** — non
  come la voglio. Una funzione nuova solo quando me la chiede un'impresa che
  paga. Un difetto invece si sistema e basta.

---

## Il banco di prova

Il pacchetto è `prove-claude/banco-noleggio-24ago.zip`. Scompattalo in
`prove/` nel tuo contenitore e mettici dentro anche `vendor/` e `foto/`.

```
prove/noleggio-prezzo/schermo.js ..... 563 prove   (apre la pagina in Chromium)
prove/noleggio-prezzo/banco.js ........ 55 prove   (il conto, senza browser)
prove/noleggio-prezzo/sabotaggi.js .... 14 sabotaggi
prove/noleggio-scritte/banco.js ....... 21 prove   (i prezzi scritti all'italiana)
prove/noleggio-importo/banco.js ....... 39 prove   (l'importo, le date, il cantiere)
prove/noleggio-pdf/banco.js ........... 35 prove   (scarica i PDF VERI)
prove/noleggio-menu/banco.js .......... 16 prove
                                     ────────────
                                       730 prove · tutte verdi
```

Come si fanno girare (il sito di prova è una copia dei miei file):

```
SITO=/root/lavoro/sito node prove/noleggio-importo/banco.js
```

Il finto Supabase sta dentro `prove/noleggio-importo/banco.js` e lo riusa
anche il banco del PDF. ⚠️ L'email del finto utente deve essere
`pintoalessio@icloud.com`: il cancello (`js/gate-gestionale.js`) è in
manutenzione e fa entrare solo quella.

---

## ⛔ IL LAVORO DI QUESTA SESSIONE

**Spostare il Noleggio fuori dal reparto, a livello azienda.**

Oggi il pulsante «Noleggio» sta nel menù di sinistra **dentro un reparto**, e
aprendo `gestionale-noleggio.html` la pagina mi chiede in quale reparto sono.
Deve stare **fuori**, nella schermata dei reparti, accanto a «Dati azienda ·
Commercialista · Backup (JSON) · Esporta dati».

### Perché (non è un capriccio grafico)

Il mezzo è **uno solo per tutta l'azienda**. Se il Noleggio sta dentro il
reparto, lo stesso escavatore va messo due volte — una per reparto — e due
reparti possono darlo allo stesso cliente nello stesso giorno. Il controllo
delle sovrapposizioni scritto il 23 agosto smette di funzionare.

### ✅ La buona notizia, già verificata

**Nessuna tabella `nol_*` filtra per reparto.** Mezzi, noleggi, cauzioni,
media e fatture del noleggio sono **già** a livello azienda. Le 40 occorrenze
di `mestiere_id` in `gestionale-noleggio.html` servono tutte alle tabelle
`gest_*` condivise col gestionale artigiano:

```
riga 1016, 4466, 4468, 4628, 5451  ->  gest_lavori
riga 5550, 5681                    ->  gest_clienti
riga 5565                          ->  gest_operatori
riga 5654, 5655                    ->  gest_scadenze
```

**I dati sono già giusti.** Cambia solo da dove ci si arriva.

### Cosa va fatto, in ordine

1. In `gestionale-app.html`: togliere «Noleggio» dal menù del reparto e
   metterlo nella **schermata dei reparti**, accanto a «Dati azienda».
2. In `gestionale-noleggio.html`: togliere la **schermata della scelta del
   reparto** all'ingresso, e la barra in alto che dice «casa · CATEGORIA
   CASA» con «← Riepilogo».
3. ⚠️ **Il punto delicato:** le sezioni del noleggio che oggi sono nascoste
   ma presenti (Agenda operatore, Lavori, Condomini, Squadra, Scadenzario)
   leggono `gest_*` filtrando per reparto. Senza reparto, `curMestiere()`
   torna vuoto. **Dimmi cosa hai trovato e cosa proponi PRIMA di toccarle** —
   probabilmente vanno tolte del tutto dalla pagina del noleggio, ma non
   decidere da solo.
4. Il banco del menù (`prove/noleggio-menu/banco.js`) oggi prova proprio il
   comportamento vecchio («la prima volta si vede la scelta del reparto»):
   va riscritto, non aggirato.

---

## Se avanza tempo, in ordine

1. **Misurare lo spazio del deposito.** Una query sola che dica quanti MB
   stanno adesso nei bucket `gestionale-foto` e `gestionale-video` e quanti
   file. ⛔ Solo misurare: l'avviso «spazio quasi pieno» **non** va nel
   gestionale delle imprese — lo spazio lo pago io, quindi semmai va nel
   **pannello Admin**. E il caricamento **non** fallisce in silenzio, l'ho
   già verificato: se lo spazio finisce te lo dice.
2. **Portale cliente**: un link dove il cliente vede i suoi noleggi e le sue
   carte. ⚠️ Chiedimi prima se mi serve.
3. **Modulo ponteggi** (PiMUS, libretto). ⚠️ Chiedimi prima se mi serve.
4. Quattro righe con l'accento scritto con l'apostrofo in
   `gestionale-noleggio.html` (una sta nel messaggio delle fatture: «era
   gia' su un'altra fattura»). Erano già lì da prima.

## Una domanda mia rimasta in sospeso

Volevo che un noleggio collegato a un reparto comparisse anche nel riepilogo
di quel reparto. Tu mi hai chiesto una cosa a cui non ho ancora risposto, e
la risposta serve prima di scrivere qualsiasi cosa:

> Quando su un noleggio scrivo «reparto: progetto casa», è un **incasso** di
> quel reparto (l'ho noleggiato a un cliente) o un **costo** (ho usato il mio
> mezzo in un mio cantiere)?

Rifammela quando arriviamo lì.

---

## Dove sono le cose

* La pagina del noleggio: `gestionale-noleggio.html` (~400 KB, una sola).
* Il gestionale artigiano: `gestionale-app.html` (~950 KB).
* Il conto del noleggio: `js/noleggio-prezzo.js` (fuori dalla pagina apposta).
* Il cestino: `js/cestino.js`. Il cancello: `js/gate-gestionale.js`.
* Le query già eseguite: `sql/noleggio-*.sql`, `sql/clienti-uno-solo.sql`,
  e l'ultima di oggi `sql/noleggio-numero-contratto.sql`.
* I referti: `prove-claude/NOLEGGIO-referto-23-agosto.md` e
  `prove-claude/NOLEGGIO-collaudo-24-agosto.md`.
