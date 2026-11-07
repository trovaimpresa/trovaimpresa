# COLLAUDO DELLA SEMPLICITÀ — il gestionale

Aperto il 7 novembre 2026. È il quinto giro di semplificazione: questa volta
**non si chiude finché tutte le caselle non sono verdi** e un agente separato,
che non ha visto il lavoro, non trova ZERO problemi rifacendo il giro da capo.

Prima di questo file non esisteva nessun collaudo della semplicità: si è
partiti da zero (cercato in `docs/`, nella radice e in `CLAUDE.md`).

Insieme a questo file c'è `docs/REGOLE-SEMPLICITA.md` (si scrive man mano che
le regole vengono decise). Da oggi ogni modifica al gestionale si controlla con
questi due file.

---

# 0. LE DECISIONI GIÀ PRESE — non si riaprono senza chiederlo ad Alex

Trovate in `CLAUDE.md` prima di cominciare:

- **Riepilogo/Assistente coi suoi riquadri**: «lo voglio così come lo abbiamo
  fatto» (30/09). Le schede compaiono già da sole solo se c'è roba dentro.
- **La riga sotto il titolo di Preventivi** («Puoi scriverlo a mano, dettarlo
  all'AI…»): «serve questa informazione» (30/09).
- **Chat con AI**: niente benvenuto, niente domande di esempio (29/08).
- **Menu corto** (6/11): in vista Assistente, Preventivi, Computo, Lavori,
  Fatture, Clienti, Calendario; il resto in «Tutto il resto» a gruppi; Aiuto in
  fondo. Lo studio ha il Computo in vista; l'artigiano ha «Interventi».
- **Finestre**: sempre `openSheetGrande()` a due colonne, mai quella piccola.
- **Parole semplici** (30/09) solo per artigiano e impresa; lo studio tecnico
  tiene le sue parole tecniche. PDF e XML fiscali non si toccano.
- **Il centro dell'app resta bianco**, lo stile blu a quadretti sta solo nel
  menu e nella barra in alto (3/10).
- **Testo mai sotto i 13 px** (regola dislessia), meglio grande.

---

# 1. L'INVENTARIO

## 1.1 I gestionali

| gestionale | file | per chi | sezioni |
|---|---|---|---|
| App (impresa · artigiano · studio tecnico) | `gestionale-app.html` + 60 file in `js/gest-*.js` | il titolare | 24 voci di menu + schermata reparti + barra in alto |
| Noleggio | `gestionale-noleggio.html` + `js/nol-*.js` | chi noleggia mezzi | 16 voci (3 forse nascoste) |
| App operaio | `gestionale-operatore.html` | l'operaio dal telefono | 1 schermata + 5 schede + scheda lavoro |

Il negozio (`gestionale-negozio.html`) NON è in questo lavoro: non è stato
chiesto.

## 1.2 Il menu dell'App, com'è oggi (7 nov 2026)

- **In vista (7):** Assistente · Preventivi · Computo · Lavori · Fatture ·
  Clienti · Calendario — più «Ricarica crediti».
- **«Tutto il resto», 4 gruppi (fino a 18):**
  Ogni giorno → Chat con AI, Giornate, Richieste dal sito, Promemoria,
  Scadenzario, Agenda operatore ·
  Squadra e mezzi → Squadra, Mezzi, Attrezzature ·
  Conti e documenti → Tasse e fisco, Prezzario, Stati di avanzamento,
  Fornitori, Carte, Report, Crediti formativi (solo studio) ·
  Archivio → Galleria, Mappa, Cestino.
- **Aiuto (in fondo):** Chiedi una funzione · Assistenza diretta.
- **Barra in alto (sul telefono dentro ☰):** Dati azienda · Commercialista ·
  Copia dei dati · Scarica per Excel · Aiuto.
- Lo studio non vede Mezzi e Carte; «Squadra» diventa «Collaboratori».

Totale: **circa 30 posti dove cliccare** prima ancora di entrare in una sezione.

## 1.3 Quanto si usano davvero (misurato nel database il 7/11)

Account che hanno almeno una riga (conta anche i dati di prova di Alex):

| sezione | account | righe |
|---|---:|---:|
| Lavori | 8 | 27 |
| Clienti | 8 | 31 |
| Preventivi | 8 | 26 |
| Squadra | 7 | 13 |
| Scadenzario | 6 | 15 |
| Computo | 5 | 17 |
| Fatture | 5 | 28 |
| Fornitori | 4 | 15 |
| Chat con AI | 3 | 118 messaggi |
| Spese, Carte, Note, Mezzi, Rapportini | 3 | pochi |
| SAL, Galleria | 2 | pochi |
| Noleggio, Promemoria, Timbrature | 1 | pochi |

Reparti creati: 38 da 33 account. **Quasi tutti entrano, creano il reparto, e
si fermano lì o poco dopo.** È il segno più chiaro che la partenza va resa più
semplice.

---

# 2. I CONTI — tutti quelli che fa il gestionale

Per ognuno: dove sta la formula, chi la usa, e i doppioni già noti o sospetti.
**Ogni sospetto va prima smentito** (regola: «prova a smentirti»).

| conto | dove sta la formula | chi la usa | doppioni |
|---|---|---|---|
| Fattura (imponibile, sconto, IVA 22/10/4/0, cassa, ritenuta, bollo, totale, netto) | `fattConti` / `fattImponibile` in `js/gest-fatture.js` | schermata Fatture, PDF, XML SdI, Riepilogo, Report, Cestino | **vista `gest_fatture_totali` + `chat_soldi()`** in Supabase: specchio scritto a mano (29/08) → da confrontare con casi veri |
| Fattura in tempo reale nel modulo | `fattTotaleLive` (`js/gest-fatture.js`) | modulo fattura | **rifà il conto per conto suo** («stessa base di fattConti», riga 792): da confrontare |
| Preventivo impresa (righe, sconto, IVA) | `prevTotaleLive`, `aggiornaRiepilogoIvaImpresa` (`js/gest-preventivi.js`) | modulo, PDF (`js/gest-documenti-pdf.js`) | **`invConti` in `js/gest-invia-cliente.js` copia l'ordine del PDF** (scritto nel codice: «se cambia l'uno, va cambiato l'altro») |
| Parcella studio (compenso + cassa + spese + IVA − ritenuta) | `calcolaParcella` (`js/gest-preventivi.js`) | modulo, PDF, Invia al cliente, Riepilogo | **vista `gest_preventivi_totali`** in Supabase (copia SQL) |
| Computo (lordo, sicurezza, manodopera, ribasso) | `compRiepilogoDa` / `compRiepilogo` (`js/gest-computo.js`) | computo, PDF computo, SAL, Riepilogo | importo di riga anche nel database (21/08): da confrontare |
| SAL (maturato, precedente, questo SAL) | `salConti` (`js/gest-sal-prezzario.js`) | SAL, PDF, fattura del SAL | — |
| Quadro economico | `qeCalcola` (`js/gest-computo.js`) | computo | — |
| Incassati / da incassare / da fatturare | `js/gest-fatture.js` (riquadri) + `js/gest-riepilogo.js` | Fatture, Assistente, Report | Riepilogo e Report contano le spese da 4 fonti: **`fvSpese` in `js/gest-fisco-vivere.js` ripete l'elenco** |
| Report (incassi e spese per mese, guadagno per lavoro) | `js/gest-report.js` | Report, Excel | vedi riga sopra |
| Tasse stimate, ravvedimento, bollo forfettario | `js/gest-fisco-tasse.js` | Tasse e fisco | — |
| Giornate (giorni per persona) | `giorTotali` (`js/gest-giornate.js`) | Giornate, PDF del mese | — |
| Ore del rapportino | `_oreSalvaTotale` (`js/gest-ore-spese.js`) | rapportini | — |
| Noleggio: prezzo a ore/giorni | `nolCalcolaOra` (`js/nol-numeri-conto-mezzi.js`), `js/noleggio-prezzo.js` | Noleggi | — |
| **Noleggio: fattura** | `fattnolTotali` (`js/nol-fatture.js`) | Fatture del noleggio | **seconda formula della fattura**: niente bollo, niente ritenuta, somma senza arrotondare riga per riga → da confrontare con `fattConti` |
| Rendimento del noleggio | `js/nol-*.js` | Rendimento | — |
| Cifre della Chat con AI | `netlify/functions/chat-gestionale.mjs` → legge le viste | Chat, email del lunedì | dipende dalle due viste qui sopra |
| Arrotondamento al centesimo | `_cent2`, `_centPerc` (`js/centesimi.js`) | tutti | unico: bene |

**I casi da rifare a mano per ogni conto** (minimo 3, scelti fra questi):
cifre coi centesimi (es. 3 × 12,35) · IVA 22, 10, 4 e 0 · due aliquote nella
stessa fattura · sconto · ritenuta 4% (condominio) e 20% (studio) · cassa 4% e
5% · bollo 2 € del forfettario · importo zero · nota di credito.



# 3. LA LISTA DI CONTROLLO, SEZIONE PER SEZIONE

Ogni riga ha due caselle: **PC** (1920) e **Tel** (380 px). `[ ]` = da fare · `[x]` = fatto e provato · `[-]` = non serve in questa sezione (scritto perché).


## 3.1 — App · Schermata dei reparti (la prima che si vede)

**Le 3 cose che ci fa l'artigiano:** (a) entrare nel mio reparto · (b) creare un reparto nuovo · (c) cambiare i dati dell'azienda


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.2 — App · Assistente (era «Riepilogo»)

**Le 3 cose che ci fa l'artigiano:** (a) vedere cosa c'è da fare oggi · (b) dire una cosa a voce o scriverla · (c) vedere quanto devo incassare


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.3 — App · Preventivi

**Le 3 cose che ci fa l'artigiano:** (a) fare un preventivo nuovo · (b) mandarlo al cliente (PDF / WhatsApp / link) · (c) trasformarlo in lavoro o in fattura


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.4 — App · Lavori (artigiano: Interventi · studio: Pratiche)

**Le 3 cose che ci fa l'artigiano:** (a) segnare un lavoro nuovo · (b) segnare un lavoro finito · (c) fare la fattura del lavoro


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.5 — App · Clienti

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un cliente · (b) trovare il telefono di un cliente · (c) vedere i lavori e le fatture di un cliente


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.6 — App · Fatture

**Le 3 cose che ci fa l'artigiano:** (a) fare una fattura · (b) segnare una fattura pagata · (c) mandarla allo SdI / scaricare il PDF


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.7 — App · Computo metrico (+ Prezzario + Stati di avanzamento)

**Le 3 cose che ci fa l'artigiano:** (a) caricare il computo del geometra · (b) metterci i prezzi · (c) farne un preventivo o un SAL


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.8 — App · Squadra (studio: Collaboratori)

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un operaio · (b) invitarlo nell'app operaio · (c) vedere le scadenze dei documenti (visite, corsi)


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.9 — App operaio · Prima schermata: Timbratura + Segna la giornata

**Le 3 cose che ci fa l'artigiano:** (a) timbrare entrata e uscita · (b) segnare la giornata (ore, materiali) · (c) fare una foto al lavoro


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.10 — App operaio · Schede Lavori · Foto · Preventivi · Chat · Archivio

**Le 3 cose che ci fa l'artigiano:** (a) aprire il lavoro di oggi · (b) scrivere al capo · (c) registrare una spesa con la carta


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.11 — App · Scadenzario

**Le 3 cose che ci fa l'artigiano:** (a) segnare una scadenza (DURC, revisione) · (b) vedere cosa scade questo mese · (c) segnarla fatta


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.12 — App · Calendario · Agenda operatore · Promemoria

**Le 3 cose che ci fa l'artigiano:** (a) vedere i lavori della settimana · (b) scrivere una nota su un giorno · (c) farsi ricordare una cosa


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.13 — App · Fornitori · Carte · spese

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un fornitore · (b) segnare una fattura del fornitore pagata · (c) segnare una spesa della carta


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.14 — App · Mezzi · Attrezzature (studio: Strumenti)

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un mezzo · (b) segnare la revisione / il bollo · (c) vedere dove sta un attrezzo


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.15 — App · Giornate

**Le 3 cose che ci fa l'artigiano:** (a) dettare la giornata di tutti · (b) vedere i giorni di un operaio nel mese · (c) scaricare il PDF del mese


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.16 — App · Richieste dal sito

**Le 3 cose che ci fa l'artigiano:** (a) leggere una richiesta nuova · (b) chiamare / scrivere al cliente · (c) farne un preventivo


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.17 — App · Chat con AI

**Le 3 cose che ci fa l'artigiano:** (a) fare una domanda sui miei numeri · (b) farmi riempire un modulo · (c) aprire la cosa che mi indica


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.18 — App · Tasse e fisco

**Le 3 cose che ci fa l'artigiano:** (a) vedere quanto mi resta dopo le tasse · (b) sollecitare un cliente che non paga · (c) sapere le prossime scadenze


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.19 — App · Report

**Le 3 cose che ci fa l'artigiano:** (a) vedere incassi e spese del mese · (b) vedere quanto ho guadagnato su un lavoro · (c) scaricare per il commercialista


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.20 — App · Galleria · Mappa

**Le 3 cose che ci fa l'artigiano:** (a) trovare le foto di un lavoro · (b) vedere i cantieri sulla mappa · (c) aprire la strada per un cantiere


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.21 — App · Cestino

**Le 3 cose che ci fa l'artigiano:** (a) ritrovare una cosa buttata · (b) rimetterla a posto · (c) buttarla per sempre


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.22 — App · Crediti formativi (solo studio)

**Le 3 cose che ci fa l'artigiano:** (a) segnare un corso fatto · (b) vedere quanti crediti mancano · (c) scaricare l'attestato


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.23 — App · Aiuto: Chiedi una funzione · Assistenza diretta · Ricarica crediti

**Le 3 cose che ci fa l'artigiano:** (a) chiedere aiuto a una persona · (b) chiedere una cosa nuova · (c) comprare crediti AI


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.24 — App · Barra in alto: Dati azienda · Commercialista · Copia dei dati · Excel

**Le 3 cose che ci fa l'artigiano:** (a) mettere logo, P.IVA, IBAN · (b) mandare i documenti al commercialista · (c) salvare una copia dei dati


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.25 — Noleggio · Riepilogo

**Le 3 cose che ci fa l'artigiano:** (a) vedere cosa esce e cosa rientra oggi · (b) vedere chi deve pagare · (c) vedere i mezzi fermi


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.26 — Noleggio · Noleggi (+ Calendario)

**Le 3 cose che ci fa l'artigiano:** (a) fare un noleggio nuovo · (b) segnare il mezzo rientrato · (c) fare la fattura del noleggio


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.27 — Noleggio · Mezzi

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un mezzo col prezzo · (b) vedere se è libero · (c) segnare manutenzione / revisione


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.28 — Noleggio · Clienti

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un cliente · (b) vedere i suoi noleggi · (c) vedere quanto deve


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.29 — Noleggio · Fatture · Cauzioni

**Le 3 cose che ci fa l'artigiano:** (a) fare una fattura · (b) segnarla pagata · (c) restituire una cauzione


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.30 — Noleggio · Contratti e documenti · Foto e video

**Le 3 cose che ci fa l'artigiano:** (a) stampare il contratto · (b) farlo firmare · (c) fotografare il mezzo all'uscita


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.31 — Noleggio · Rendimento

**Le 3 cose che ci fa l'artigiano:** (a) vedere quanto ha reso un mezzo · (b) vedere il mezzo che rende meno · (c) confrontare i mesi


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.32 — Noleggio · Prodotti · Magazzino · Movimenti · Fornitori (da verificare se si vedono)

**Le 3 cose che ci fa l'artigiano:** (a) — · (b) — · (c) —


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.33 — Noleggio · Promemoria · Cestino

**Le 3 cose che ci fa l'artigiano:** (a) farsi ricordare una cosa · (b) ritrovare una cosa buttata · (c) rimetterla a posto


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: _ / _ / _ | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [ ] | [ ] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [ ] | [ ] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_

---

# 4. L'ORDINE DI LAVORO PROPOSTO (da far approvare ad Alex)

Prima quello che si usa di più (vedi 1.3), e prima di tutto la porta d'ingresso,
perché è lì che oggi la gente si ferma.

1. Schermata dei reparti + Assistente — 3.1, 3.2
2. Preventivi — 3.3
3. Lavori — 3.4
4. Clienti — 3.5
5. Fatture — 3.6 (con la fattura del Noleggio, per il conto doppio)
6. Squadra + App operaio — 3.8, 3.9, 3.10
7. Scadenzario — 3.11
8. Computo + Prezzario + SAL — 3.7
9. Calendario · Agenda · Promemoria — 3.12
10. Fornitori · Carte · spese — 3.13
11. Il resto dell'App — 3.14 → 3.24
12. Noleggio — 3.25 → 3.33
13. Il menu intero (prima/dopo, niente si cancella: si sposta)
14. Il giro finale dell'agente separato

# 5. DIARIO DEL COLLAUDO

| data | sezione | cosa è cambiato | push |
|---|---|---|---|
| 7 nov 2026 | — | inventario e lista di controllo | → solo docs ← |
