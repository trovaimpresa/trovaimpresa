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
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 3 / 1 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [x] | [x] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. La parola «reparto» nella nota non si vedeva (blu scuro su fondo blu).
2. I crediti AI stavano sopra i reparti: sul telefono il primo reparto arrivava a 640 px.
3. Tre larghezze diverse (640, 900, 1100 px): niente allineato.
4. Stesso pulsante con due nomi: «Salva una copia dei dati»/«Backup», «Esporta dati»/«Esporta».
5. «Ricarica» alto 38 px sul telefono.

Fatto (push `3a6ab22`): crediti sotto i reparti; una colonna di 1000 px (misurato: tutto da 452 a 1452 px); «reparto» bianco; nomi uguali dentro e fuori («Salva una copia dei dati», «Scarica per Excel»; lo studio resta com'era, decisione del 30/09); «Ricarica» 44 px; scritte piccole a 17 px. Sul telefono il primo reparto ora sta a 428 px.

Ancora aperto: «Sezione vuota» (un account senza reparti non l'ho visto), «Errori» e «salva/cestino» (creare e buttare un reparto sull'account vero: da fare insieme ad Alex, o su un reparto di prova). «Uguale alle altre sezioni»: si spunta col giro del menu.


## 3.2 — App · Assistente (era «Riepilogo»)

**Le 3 cose che ci fa l'artigiano:** (a) vedere cosa c'è da fare oggi · (b) dire una cosa a voce o scriverla · (c) vedere quanto devo incassare


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 0 / 1 / 1 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [x] | [x] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [-] | [-] |

Problemi trovati (7 nov 2026, prima):
1. Pallini ROSSI su cose in attesa (preventivi, bozze, richieste da leggere).
2. Riquadri che si contraddicevano: «Niente da segnalare» / «Nessuna fattura da incassare» col pallino rosso.
3. «Fotografa» era un pulsante da solo in mezzo alla pagina.
4. In alto «Backup» (inglese) ed «Esporta»: altri nomi rispetto alla schermata dei reparti.

Fatto (push `3a6ab22` + `8760c43`): pallino a tre colori (rosso = scaduto/in ritardo/in perdita, ambra = in attesa e scadenze entro 7 giorni, verde = a posto) dalla stessa fascia «Da sistemare», mai più «Niente da segnalare» sotto un pallino non verde; «Fotografa un foglio» fra le scorciatoie (il vecchio pulsante resta nascosto); nomi uguali. Provato dal vivo: giardiniere (artigiano) e giro dello studio tecnico.

Conti: bozze 982,10 + 1.100,00 = 2.082,10 € uguale in Assistente e Fatture; da incassare 0 € uguale. I tre casi a mano (centesimi, IVA, ritenuta) si fanno nella sezione Fatture: l'Assistente legge gli stessi totali (`totaleFatt`).

Ancora aperto: «Allineato» (le schede del riepilogo hanno larghezze loro, decise con Alex il 30/09 — da misurare nel giro del menu), «Sezione vuota» (reparto nuovo non visto), «Errori» (rete giù: c'è il banner rosso del 6/08, non riprovato oggi).
La finestrella delle stelline «Come ti trovi col gestionale?» resta com'è: Alex non ha risposto alla domanda.


## 3.3 — App · Preventivi

**Le 3 cose che ci fa l'artigiano:** (a) fare un preventivo nuovo · (b) mandarlo al cliente (PDF / WhatsApp / link) · (c) trasformarlo in lavoro o in fattura


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [x] | [x] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [x] | [x] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. Due pulsanti principali («+ Nuovo preventivo» bianco, «Genera con AI» viola più forte).
2. Nell'elenco prezzi mischiati: 982,10 CON IVA accanto a 2.800,00 SENZA, totale in cima senza.
3. Telefono: filtri tagliati («Acce…»), titolo schiacciato da «Bozza», schede alte mezzo schermo.
4. Preventivo aperto: 8 pulsanti piccoli (15 px) in fila; sul telefono «Crea la fattura» fuori schermo.
5. Telefono: in fondo 5 pulsanti uno sotto l'altro (266 px, un terzo dello schermo).
6. La formula dell'IVA del preventivo copiata in 6 posti.

Clic contati (prima): nuovo preventivo 1 · mandarlo al cliente 2 (Apri → Invia) · diventa lavoro 2 (Apri → Accettato).

Fatto (sul banco, push a fine giornata): un pulsante principale blu per sezione (vale per tutte); righe sempre «IVA esclusa» + «con IVA …» sotto; filtri a capo; nella finestra 3 azioni in vista (Invia, Accettato → lavoro, Crea la fattura) e il resto + Elimina in «Altro ▾» (vale per tutte le finestre); telefono: barra in fondo 2×2 (135 px), AI «Controllo AI · 1 credito»; formula IVA unica `prevContiImpresa()` (gest-preventivi.js) usata da modulo, elenco, PDF, Invia al cliente, conferma d'ordine.
Conti: 7 casi a mano + 12 preventivi veri del database = schermo, banco e vista `gest_preventivi_totali` uguali; un sabotaggio della formula viene accusato.
Da fare dopo il push: collaudo dal vivo, computer e telefono, e spunta delle caselle.


## 3.4 — App · Lavori (artigiano: Interventi · studio: Pratiche)

**Le 3 cose che ci fa l'artigiano:** (a) segnare un lavoro nuovo · (b) segnare un lavoro finito · (c) fare la fattura del lavoro


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [x] | [x] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [-] | [-] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. Pallino rosso con scritta «Da fare» sui lavori in ritardo; «In corso» ambra come «Da fare».
2. Totale in cima (2.330,50 €) ma nessun importo nelle righe.
3. «+ Nuovo» a destra qui, a sinistra nei Preventivi.
4. Lavoro aperto: 9 pulsanti piccoli in alto.
5. Telefono: filtri tagliati («Pro…»).

Clic contati (prima): nuovo lavoro 1 · segnarlo finito 2 (Apri → Segna fatto) · fattura del lavoro 3 (Apri → … → Crea fattura).

Fatto (sul banco, push a fine giornata): scritta «In ritardo» col rosso, pallino blu per «In corso»; importo su ogni riga; «+ Nuovo…» sempre a destra (tutte le sezioni); finestra: in vista Segna fatto · Foto · Avvia, e quando è finito Crea fattura (per prima) · Foto · Riapri, il resto in «Altro ▾».
Conti: 300 + 400 + 1.000 + 450,50 + 180 = 2.330,50 € = totale a schermo = database.
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).


## 3.5 — App · Clienti

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un cliente · (b) trovare il telefono di un cliente · (c) vedere i lavori e le fatture di un cliente


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 1 / 1 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [-] | [-] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [-] | [-] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. Quattro pulsanti in alto («+ Privato», «+ Azienda», «+ Condominio», «Compila con AI»), nessuno principale; il tipo si sceglie già dentro il modulo.
2. La scheda del cliente non mostrava i suoi lavori, preventivi e fatture (bisognava cercare il nome in alto).
3. Casella «Cerca nome…» con la scritta piccola.

Clic contati (prima): aggiungere 1 · telefono 1 (Apri) · lavori e fatture del cliente 3+ (casella in alto, scrivere, scegliere).

Fatto (sul banco, push a fine giornata): un solo «+ Nuovo cliente» blu; casella di ricerca a 17 px; nella scheda del cliente il riquadro «I suoi lavori, preventivi e fatture» (`cliStoria` in gest-commercialista.js), righe che si aprono con `window.apriCosa`. Alex ha risposto «ok» alla domanda se lo voleva.
Provato DAL VIVO sui dati veri (iniettato nella pagina): lavoro 450,50 €, preventivo 805,00 € IVA esclusa, fatture 982,10 € e 1.100,00 € — uguali alle altre sezioni e alle viste del database; preventivo, fattura e lavoro si aprono.
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).


## 3.6 — App · Fatture

**Le 3 cose che ci fa l'artigiano:** (a) fare una fattura · (b) segnare una fattura pagata · (c) mandarla allo SdI / scaricare il PDF


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [x] | [x] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. DIFETTO: descrizione delle voci larga 72 px (il microfono `dt-box` aveva rotto la regola del 30/09).
2. Riga dell'elenco: cliente scritto due volte, «nessun PDF allegato» inutile.
3. Sotto l'importo non si diceva se l'IVA è dentro.
4. Le (i) degli aiuti alte 19 px.

Clic contati (prima): nuova fattura 1 · segnarla pagata 2 (Apri → Segna pagata) · PDF 2 · SDI 2.

Fatto (sul banco, push a fine giornata): descrizione su tutta la riga; cliente una volta sola; «IVA compresa» / «netto da incassare»; (i) da 30 px; in vista Emetti o Segna pagata · Crea il PDF · Invia allo SDI, resto in «Altro ▾».
Conti: 7 casi a mano (due aliquote coi centesimi 155,20; sconto 990; ritenuta 4% 2.750 → 2.650; IVA 4% 32,09; zero; bollo 102; nota di credito) verdi con `fattConti` del sito vero; 19 fatture vere = vista `gest_fatture_totali` (attenzione: nella vista `totale` è il NETTO da incassare, `totale_documento` il totale della fattura).
Sospetti da guardare (non difetti, non toccati): la ritenuta non è arrotondata al centesimo prima di togliere (con 4% e 20% non succede mai niente; con aliquote strane potrebbe sbagliare di 1 centesimo); `fattConti` usa il regime dell'azienda di oggi, il PDF quello scritto sulla fattura.
Da fare dopo il push: collaudo dal vivo, computer e telefono; la fattura del Noleggio (`fattnolTotali`) si guarda con la sezione Noleggio.


## 3.7 — App · Computo metrico (+ Prezzario + Stati di avanzamento)

**Le 3 cose che ci fa l'artigiano:** (a) caricare il computo del geometra · (b) metterci i prezzi · (c) farne un preventivo o un SAL


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [x] | [x] |
| Lo stesso numero è uguale OVUNQUE | [x] | [x] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. La stessa spiegazione due volte (riga sotto il titolo + riquadro «Ti è arrivato il computo del geometra?»).
Il computo aperto era già semplice: in vista «Crea il preventivo», il resto in «Altro ▾».

Fatto (sul banco): riga nascosta per impresa e artigiano (resta il riquadro col pulsante arancione). Studio invariato.
Conti a mano: 2 × 4,50 × 2,70 = 24,30 − porta 0,90 × 2,10 = 1,89 → 22,41 m² × 22 € = 493,02 € − ribasso 10% = 443,72 € = schermo = vista `gest_computo_totali`.
Ancora da guardare: SAL e Prezzario (pagine del computo con numeri a 14 px).


## 3.8 — App · Squadra (studio: Collaboratori)

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un operaio · (b) invitarlo nell'app operaio · (c) vedere le scadenze dei documenti (visite, corsi)


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 1 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [-] | [-] |
| Lo stesso numero è uguale OVUNQUE | [-] | [-] |
| Nessuna formula copiata in due posti | [-] | [-] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. Prima delle persone tre riquadri (spiegazione app, «Preventivi da controllare» vuoto, numero WhatsApp).
2. «Visita medica scaduta» in giallo come «sta per scadere».
3. «+ Persona» diverso dagli altri «+ Nuovo…».

Fatto (sul banco, push a fine giornata): persone in cima, sotto la card dell'app e il numero WhatsApp; «Preventivi da controllare» solo se c'è qualcosa; scaduto rosso; «+ Nuova persona» (anche nel messaggio dell'app operaio, js/op-base.js).
Conti: nessun conto in questa sezione (il costo orario si guarda con Giornate e Report).
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).


## 3.9 — App operaio · Prima schermata: Timbratura + Segna la giornata

**Le 3 cose che ci fa l'artigiano:** (a) timbrare entrata e uscita · (b) segnare la giornata (ore, materiali) · (c) fare una foto al lavoro


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 1 / 2 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [-] | [-] |
| Lo stesso numero è uguale OVUNQUE | [-] | [-] |
| Nessuna formula copiata in due posti | [-] | [-] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima, telefono 380 — visto dal browser di Alex, dove l'app si apre come «david»; niente premuto):
1. «Segna la giornata» due volte (pulsante grande + «Segna la giornata di oggi» dentro «Le mie giornate»).
2. «Le mie giornate» fra il pulsante e i lavori: i lavori di oggi arrivavano a 1.100 px.

Fatto (sul banco, push a fine giornata): un solo «Segna la giornata»; «Le mie giornate» in fondo (js/op-giornate.js). Misurato: niente esce dallo schermo, pulsanti ≥ 44 px, unica scritta sotto 16 px «Indietro» (15 px).
⚠️ Non provati dal vivo (servono le azioni vere dell'operaio): Entrata/Uscita, Segna la giornata, foto, spese. Da provare con Alex o con un operaio vero.


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
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 1 / 2 | [ ] | [ ] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [x] | [x] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [x] | [x] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [-] | [-] |
| Lo stesso numero è uguale OVUNQUE | [-] | [-] |
| Nessuna formula copiata in due posti | [-] | [-] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [x] |
| Console senza errori | [x] | [x] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati (7 nov 2026, prima):
1. Pulsanti con due nomi («Apri la scheda» / «Apri»).
2. «Aperta» per le scadenze lontane: non si capiva.
3. «+ Nuova scadenza» bianco (sistemato dalla regola generale).

Clic contati (prima e dopo): nuova scadenza 1 · cosa scade (filtro «Prossime») 1 · segnarla fatta 2.
Fatto (sul banco, push a fine giornata): tutti «Apri»; «In tempo» al posto di «Aperta». Colori già giusti: Scaduta rosso, In scadenza ambra, Fatta verde.
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).


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

# 3bis. DA GUARDARE NEL GIRO DEL MENU (trovati strada facendo)
- Due elementi con lo stesso id `cnt-crediti`: il numero di «Ricarica crediti» e quello di «Crediti formativi» (studio). Uno dei due contatori può finire nel posto sbagliato.

# 4. L'ORDINE DI LAVORO (approvato da Alex il 7 nov 2026)

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
| 7 nov 2026 | 3.1 Reparti · 3.2 Assistente | vedi le due schede qui sopra | →3a6ab22← →8760c43← |
| 7 nov 2026 | 3.3–3.11 (senza 3.10) + 3.7 | vedi le schede; collaudo dal vivo trovato 1 difetto: nel lavoro aperto «Segna fatto» non era per primo (sistemato, va nel prossimo push) | →fecdb00← |
