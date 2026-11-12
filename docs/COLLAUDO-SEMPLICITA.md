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
| Sezione vuota: dice cosa fare e ha il pulsante | [x] | [x] |
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
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [x] | [x] |
| Errori in italiano chiaro, che dicono come rimediare | [x] | [x] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
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
| Salvare, modificare, cestino, recuperare: tutto funziona | [x] | [x] |

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

**11 nov 2026 — ripreso (ok di Alex sulle foto):**
Misurato: titolo, filtri, lista e schede dal 413 al 1797 px sul 1920; dal 16 al 359 sul telefono. Clic: nuovo 1 · al cliente 2 (Apri → Invia) · lavoro 2 (Apri → Accettato).
Provato sul sito vero: preventivo di prova 3 × 12,35 = 37,05 €; modificato a 4 × 12,35 = 49,40 €; nel cestino; ripreso (49,40 €); buttato per sempre. Zero errori in console.
Problemi trovati: (1) senza rete la lista diceva «Ancora nessun preventivo — Crea il primo» (stesso difetto in Lavori, Clienti e Fatture); (2) Salva senza titolo: solo un messaggino scuro di 2 secondi, casella non segnata; (3) «Eliminare questo preventivo?» non diceva quale e faceva credere che sparisse.
Fatto: `listaNonLetta()` + `letturaKo()` (js/gest-schede-clienti.js), riquadro rosso con Riprova (`lista-riprova`) in Preventivi, Lavori, Clienti, Fatture — la lista di prima non si cancella; `campoManca()` (js/gest-ai-moduli.js): casella rossa con la frase sotto, ci va il cursore, messaggio rosso; «Mettere nel cestino «titolo»? Lo riprendi dal Cestino quando vuoi.» + «Preventivo nel cestino: lo riprendi da lì».
Provato col finto Supabase a 1920 e 375: le 4 liste senza rete → riquadro rosso, Riprova → lista giusta; titolo e voce mancanti segnati; domanda del cestino col nome. Zero errori.

## 3.4 — App · Lavori (artigiano: Interventi · studio: Pratiche)

**Le 3 cose che ci fa l'artigiano:** (a) segnare un lavoro nuovo · (b) segnare un lavoro finito · (c) fare la fattura del lavoro


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [x] | [x] |
| Errori in italiano chiaro, che dicono come rimediare | [x] | [x] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
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
| Salvare, modificare, cestino, recuperare: tutto funziona | [x] | [x] |

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

**11 nov 2026 — ripreso:**
Misurato: tutto dal 413 al 1797 px sul 1920. Clic veri: nuovo 1 · finito 2 (Apri → Segna fatto) · fattura 2 (Apri → Crea fattura, che da finito è la prima).
Provato sul sito vero: lavoro di prova 123,45 € (totale 2.150,50 → 2.273,95 €), modificato a 200 € (2.350,50 €), segnato fatto («Finiti e non ancora incassati 200,00 €»), nel cestino, ripreso, buttato per sempre. «Oggi» vuoto: «Niente in programma per oggi».
Problemi trovati: (1) Salva senza descrizione: «Compila Descrizione e Data» nero; (2) il correttore delle parole fermava il primo «Crea lavoro» senza dirlo; (3) dopo ogni lavoro con data: «ti avviso 30 giorni prima…» anche per un lavoro fra 9 giorni; (4) «Eliminare questo lavoro?» senza il nome; (5) il messaggio copriva i pulsanti in fondo alla finestra (tutte le finestre).
Fatto: campoManca su descrizione, data, importo; «Ho corretto le parole: guarda e premi di nuovo «Crea lavoro»» (vale anche per Noleggio e app operaio); avvisi solo quelli che arriveranno davvero (lavoro di oggi: nessuna domanda); «Mettere nel cestino «nome»?»; il messaggio sta sopra la barra dei pulsanti.
Provato col finto Supabase a 1920 e 375: tutto come nelle foto, zero errori.

## 3.5 — App · Clienti

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un cliente · (b) trovare il telefono di un cliente · (c) vedere i lavori e le fatture di un cliente


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 1 / 1 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [x] | [x] |
| Errori in italiano chiaro, che dicono come rimediare | [x] | [x] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
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
| Salvare, modificare, cestino, recuperare: tutto funziona | [x] | [x] |

Problemi trovati (7 nov 2026, prima):
1. Quattro pulsanti in alto («+ Privato», «+ Azienda», «+ Condominio», «Compila con AI»), nessuno principale; il tipo si sceglie già dentro il modulo.
2. La scheda del cliente non mostrava i suoi lavori, preventivi e fatture (bisognava cercare il nome in alto).
3. Casella «Cerca nome…» con la scritta piccola.

Clic contati (prima): aggiungere 1 · telefono 1 (Apri) · lavori e fatture del cliente 3+ (casella in alto, scrivere, scegliere).

Fatto (sul banco, push a fine giornata): un solo «+ Nuovo cliente» blu; casella di ricerca a 17 px; nella scheda del cliente il riquadro «I suoi lavori, preventivi e fatture» (`cliStoria` in gest-commercialista.js), righe che si aprono con `window.apriCosa`. Alex ha risposto «ok» alla domanda se lo voleva.
Provato DAL VIVO sui dati veri (iniettato nella pagina): lavoro 450,50 €, preventivo 805,00 € IVA esclusa, fatture 982,10 € e 1.100,00 € — uguali alle altre sezioni e alle viste del database; preventivo, fattura e lavoro si aprono.
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).

**11 nov 2026 — ripreso:**
Misurato: dal 413 al 1797 px sul 1920. Provato sul sito vero: cliente di prova creato, città aggiunta, nel cestino, ripreso, buttato per sempre.
Problemi trovati: (1) due caselle «Cerca» una sopra l'altra (quella in alto cerca già nei clienti, anche P.IVA e codice fiscale); (2) telefono ed email nella lista non si toccavano; (3) nella scheda il pulsante blu era «Mappa», anche senza indirizzo; (4) «Scrivi il nome» nero (anche Squadra, Fornitori, Mezzi, Carte, Reparto); (5) «Eliminare questo cliente?» senza nome, e «2 lavori collegate».
Fatto (anteprima, in attesa dell'ok): casella dei Clienti nascosta come quella dei Lavori; telefono ed email toccabili; nella scheda «Chiama» blu (se c'è il numero), «Mappa» solo con l'indirizzo; campoManca sul nome in 6 moduli; «Mettere nel cestino «nome»? Collegati: 1 lavoro. Restano dove sono.»
Provato col finto Supabase a 1920 e 375: zero errori.

## 3.6 — App · Fatture

**Le 3 cose che ci fa l'artigiano:** (a) fare una fattura · (b) segnare una fattura pagata · (c) mandarla allo SdI / scaricare il PDF


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 2 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [x] | [x] |
| Errori in italiano chiaro, che dicono come rimediare | [x] | [x] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
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
| Salvare, modificare, cestino, recuperare: tutto funziona | [x] | [x] |

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

**11 nov 2026 — ripreso:**
Clic veri: nuova 2 (Nuova fattura → «Vuota» o «Da lavori finiti») · pagata 2 · PDF/SDI 2.
Provato sul sito vero: bozza di prova 3 × 12,35 = 37,05 + IVA 10% 3,71 = 40,76 €; modificata a 4 × 12,35 = 49,40 + 4,94 = 54,34 €; nel cestino, ripresa, buttata per sempre.
Problemi trovati: (1) i 3 riquadri stretti a sinistra (la griglia teneva 6 colonne); (2) «mancano le n.1…» senza dire cosa fare; (3) voce mancante = riquadro «La fattura non è stata salvata… manda questa schermata ad Alessio» (l'iscritto non sa chi è; anche in Galleria); (4) la formula della ritenuta copiata in fattTotaleLive; (5) bozza: «Eliminare questa bozza di fattura?» senza nome; nel Cestino «del 11/11/2026» e «1 righe della fattura»; (6) sul telefono i riquadri alti spingevano l'elenco sotto lo schermo.
Fatto: 3 colonne piene; «…eliminata per sempre: se l'avevi mandata al cliente, dillo al commercialista»; campoManca sulla voce, errori veri → «scrivici da Aiuto → Assistenza diretta»; fattTotaleLive usa fattConti (ritenuta chiusa al centesimo, con 4% e 20% non cambia niente); «Mettere nel cestino la bozza di «cliente» del …?»; Cestino: «Fattura in bozza del … — cliente», singolare con 1; telefono: un riquadro = una riga.
Noleggio: la sua fattura (`fattnolTotali`) resta per la 3.29.

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

Collaudo dal vivo (11 nov 2026) sul computo da 88 voci («progetto casa»), senza toccare niente: scritte tutte ≥14 px (solo le «i» a 13), Prezzario a pezzi da 60, SAL ok. Sistemato:
2. Telefono: la fila dei passi restava all'inizio, al passo 6 non si vedeva dove eri → `compPag` mette il passo aperto al centro.
3. Tolte due spiegazioni inutili: «Da qui comincia tutto…» e «clicca per rinominare» sotto i capitoli (si rinomina lo stesso cliccando il nome).


## 3.8 — App · Squadra (studio: Collaboratori)

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un operaio · (b) invitarlo nell'app operaio · (c) vedere le scadenze dei documenti (visite, corsi)


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 2 / 1 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [x] | [x] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
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
| Salvare, modificare, cestino, recuperare: tutto funziona | [x] | [x] |

Problemi trovati (7 nov 2026, prima):
1. Prima delle persone tre riquadri (spiegazione app, «Preventivi da controllare» vuoto, numero WhatsApp).
2. «Visita medica scaduta» in giallo come «sta per scadere».
3. «+ Persona» diverso dagli altri «+ Nuovo…».

Fatto (sul banco, push a fine giornata): persone in cima, sotto la card dell'app e il numero WhatsApp; «Preventivi da controllare» solo se c'è qualcosa; scaduto rosso; «+ Nuova persona» (anche nel messaggio dell'app operaio, js/op-base.js).
Conti: nessun conto in questa sezione (il costo orario si guarda con Giornate e Report).
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).

**11 nov 2026 — ripreso:**
Provato sul sito vero: persona di prova aggiunta (nome mancante → casella rossa), nel cestino («Eliminare «PROVA COLLAUDO» dalla squadra? … Va nel cestino»), ripresa (avvisa che dal telefono non entra più), buttata per sempre.
DIFETTO NEL DATABASE trovato: «Elimina per sempre» di una persona (e di un mezzo) dava «structure of query does not match function result type». `_gest_cascata` restituisce gli id come uuid, ma `gest_rifornimenti` ha l'id bigint. Corretto con `sql/cestino-id-non-uuid.sql` (migrazione `cestino_id_non_uuid_11nov2026`, ok di Alex): l'id conta solo se è uuid; se una tabella con id di altro tipo si cancellasse a catena e avesse figli, la funzione si ferma. Riprovato dal vivo: «Eliminato per sempre».
Anche: «Operaio3519095949» attaccati → «Operaio · numero», il numero si tocca.
Allineamento: 405–1789 invece di 413–1797 solo perché qui c'è la barra di scorrimento (8 px): non è un difetto.
La casella «Cerca nome, ruolo, telefono» resta: la ricerca in alto non cerca le persone.

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

**11 nov 2026 (sera) — ripreso dal vivo** (aperta da Alex, l'app si vede «come david»):
Clic veri: Entrata 1 · Uscita 1 · ore della giornata 4 (Segna la giornata → Ore → lavoro → Conferma, con 8 già messo). Senza rete la timbratura va in coda sul telefono e parte da sola (`tmb_coda_v1`). Niente sotto i 14 px; telefono tutto dal 14 al 361.
Prova lasciata: una timbratura di david di 1 minuto (18:44–18:45 dell'11 nov). Le timbrature non si cancellano apposta (sono il registro): si vede nelle Giornate.
Problemi trovati: (1) sul telefono «Metti l'app sul telefono» stava sopra la timbratura e spingeva «Entrata» sotto lo schermo; (2) sul computer l'app era una striscia di 520 px con le scritte piccole.
Fatto (anteprima, in attesa dell'ok): il riquadro dell'icona va sotto «Scrivi al capo»; sopra i 1000 px tutto ingrandito di 1,35 (la colonna passa da 492 a 664 px).

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

**11 nov 2026 (sera) — collaudo dal vivo** (come «david»):
Clic veri: aprire il lavoro 1 (si tocca la scheda) · scrivere al capo 1 («Scrivi al capo» o la Chat) · spesa con la carta 2-3 (Segna la giornata → La giornata completa). Mappa nel lavoro giusta. Foto, Preventivi, Chat: vuote dicono cosa fare. Niente sotto i 14 px.
Problemi trovati: (1) nel lavoro «‹ Torna» scritto piccolo, mentre la prima schermata ha «← Indietro» (due modi di uscire); (2) in Archivio i lavori del giorno stavano SOPRA il calendario: toccavi un giorno e il risultato cambiava fuori dallo schermo.
Fatto (anteprima, in attesa dell'ok): «← Indietro» uguale alla prima schermata; prima il calendario, sotto i lavori del giorno.

## 3.11 — App · Scadenzario

**Le 3 cose che ci fa l'artigiano:** (a) segnare una scadenza (DURC, revisione) · (b) vedere cosa scade questo mese · (c) segnarla fatta


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [x] | [x] |
| UN solo pulsante principale, ben visibile | [x] | [x] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [x] | [x] |
| Le 3 cose tipiche in pochi clic — clic contati: 1 / 1 / 2 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [x] | [x] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [x] | [x] |
| Sezione vuota: dice cosa fare e ha il pulsante | [x] | [x] |
| Errori in italiano chiaro, che dicono come rimediare | [x] | [x] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [x] | [x] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [x] | [x] |
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
| Salvare, modificare, cestino, recuperare: tutto funziona | [x] | [x] |

Problemi trovati (7 nov 2026, prima):
1. Pulsanti con due nomi («Apri la scheda» / «Apri»).
2. «Aperta» per le scadenze lontane: non si capiva.
3. «+ Nuova scadenza» bianco (sistemato dalla regola generale).

Clic contati (prima e dopo): nuova scadenza 1 · cosa scade (filtro «Prossime») 1 · segnarla fatta 2.
Fatto (sul banco, push a fine giornata): tutti «Apri»; «In tempo» al posto di «Aperta». Colori già giusti: Scaduta rosso, In scadenza ambra, Fatta verde.
Collaudo dal vivo (push `fecdb00`, 7 nov sera): computer 1920 e telefono 380, account di Alex, console vuota, niente fuori schermo. Restano vuote le caselle che non si possono provare senza cambiare dati veri (salva/cestino/recupera) o che non si sono viste (sezione vuota, errori).

**11 nov 2026 (sera) — ripreso:**
Provato sul sito vero: scadenza di prova (30/06/2027, senza email) creata, segnata fatta (2 clic: Apri → Segna fatta), nel cestino, ripresa, buttata per sempre. Le righe dei mezzi aprono la scheda del mezzo.
Problemi trovati: (1) «Scrivi il titolo» nero anche col tipo già scelto (DURC); (2) «Eliminare questa scadenza?» senza nome.
Fatto: se il titolo è vuoto si usa il tipo (una casella in meno) e nella riga il tipo non si ripete; data mancante → casella rossa; «Mettere nel cestino «nome»?». Anche nel Noleggio (lì il messaggio resta, senza casella rossa).

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

Problemi trovati (7 nov 2026, prima):
1. Calendario: il pulsante per tornare a oggi era un puntino «•».
2. Calendario sul computer: il giorno di oggi quasi non si vedeva (sul telefono c'è già il riquadro «Oggi · sabato 7 novembre»).
3. Agenda operatore: nelle righe non c'era CHI ci va, e c'era il totale senza gli importi delle righe.
4. Promemoria: a posto.

Fatto (sul banco, nel prossimo push): «Oggi» al posto del puntino; oggi col bordo blu e la scritta; nell'Agenda «👷 nome» (o «nessuno assegnato») e l'importo su ogni riga.
Conti: totale Agenda 2.330,50 € = somma dei 5 lavori (stessi del Lavori).

Collaudo dal vivo (11 nov 2026): le correzioni del 7 nov sono online. Trovati e sistemati:
5. Calendario: i lavori in ritardo stavano nei mesi passati e il mese sembrava vuoto → riga rossa «⚠ N lavori in ritardo · Vedi» in cima, porta a Lavori filtrato (stessa regola `lavFiltra`).
6. Giorno aperto: titolo «12/11/2026» → «Giovedì 12 novembre 2026»; «Nessun lavoro in questa data» → «Niente in programma».
7. Giorno aperto: «Nota / promemoria del giorno» → «Nota del giorno» (la nota non avvisa, i Promemoria sì).
8. Agenda: «Da fare» due volte → la linguetta in alto si chiama «Lavori».
9. Tolto il promemoria «PROVA di Claude» rimasto da settembre.


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

Problemi trovati (7 nov 2026, prima):
1. Fornitori: tre pulsanti blu uguali (colpa della regola «+ Nuovo blu» di oggi); «Fotografa una fattura» e «+ Fattura da pagare» fanno la stessa azione (`new-fattf`).
2. Riga del fornitore con 3 pulsanti (Chiama, WhatsApp, Apri scheda).
3. Carte: a posto.

Fatto (sul banco, nel prossimo push): blu solo «+ Fattura da pagare» (a destra), gli altri due bianchi; sulla riga solo «Apri» (Chiama e WhatsApp stanno nella scheda: controllato).
Controllato in tutto il file: nessun'altra sezione ha più di un «+ Nuovo» blu.

Collaudo dal vivo (11 nov 2026): le correzioni del 7 nov sono online. Trovati e sistemati:
4. Carta, nuovo movimento: partiva da «Ricarica» → parte da «Spesa» (la cosa di tutti i giorni); tolto lo «0» grigio che sembrava scritto; importo vuoto → casella rossa (campoManca).
5. Eliminare fornitore, fattura del fornitore, carta: la domanda dice quale e che va nel Cestino (`window.chiediCestino`, in gest-ai-moduli.js: una funzione sola).
6. Eliminare un movimento della carta: NON va nel Cestino (alimenta il saldo) → «Eliminare per sempre «Gasolio» (− 42,50 €)? Il saldo della carta cambia».
7. Senza rete Carte diceva «nessuna carta» → riquadro «Non riesco a leggere» col Riprova (regola 20); anche Fornitori ha il Riprova.


## 3.14 — App · Mezzi · Attrezzature (studio: Strumenti)

**Le 3 cose che ci fa l'artigiano:** (a) aggiungere un mezzo · (b) segnare la revisione / il bollo · (c) vedere dove sta un attrezzo

**Problemi trovati (7 nov, PC 1920 + tel 380):** sezione già pulita (un pulsante «+ Nuovo mezzo», righe con «Apri», niente fuori schermo). Un solo difetto: un mezzo con una scadenza passata aveva l'etichetta «Disponibile» in VERDE.
**Fatto (ok di Alex):** con una scadenza passata l'etichetta diventa «Da rinnovare» in rosso (`mezzoCard` in js/gest-mezzi.js; manutenzione e fuori uso restano). Attrezzature: vuota, dice cosa fare, niente da cambiare.
**Conti:** carburante (spesa e km/l) viene dalla vista, non rifatto qui: nessuna formula nuova.

**Collaudo dal vivo (11 nov 2026), trovato e sistemato:**
- Le date scritte nel modulo del mezzo (assicurazione, revisione, collaudo, verifica) NON entravano nella vista `gest_mezzi_scadenze` (conta solo lo Scadenzario): un'assicurazione scaduta lasciava il mezzo «Disponibile». Adesso `mezzoDate()` in js/gest-mezzi.js mette insieme le due fonti (stesse 4 date del calendario): riga e tabella dicono QUALE e quando («⚠ Assicurazione: scadeva il 15/10/2026»), stato «Da rinnovare» anche nella tabella, prossima scadenza compresa quella del modulo.
- Modulo: la spiegazione di 3 righe → una («Bollo, tagliando e le altre: pulsante + Scadenza qui in alto»); «ogni quanti mesi» non mostra più «0».
- ⚠️ Da guardare: il Riepilogo e gli avvisi email leggono ancora la sola vista? (non controllato).


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

**Problemi trovati (7 nov, PC 1920 + tel 380):** due pulsanti principali (blu «PDF del mese» + arancione «Compila la giornata»), e col mese vuoto il PDF uscirebbe bianco; «Oppure scrivila a mano» a 15 px.
**Fatto (ok di Alex):** «PDF del mese» si vede solo se nel mese c'è almeno una giornata (`renderGiornate`); «scrivila a mano» a 17 px.
**Conti:** i totali per persona e luogo stanno in `giorTotali`, usata sia a schermo sia nel PDF: una sola formula.

**Collaudo dal vivo (11 nov 2026):** già in ordine (PC e telefono, niente fuori schermo, ultime in cima). Sistemato: la domanda per cancellare diceva «Cancello questa giornata e le sue ore?» ma va nel Cestino → «Mettere nel cestino la giornata di sab 29 agosto (david)? La riprendi dal Cestino» (regola 22). Tolta la giornata di prova del 15 agosto («RAPPORTINO DI PROVA»).


| | PC | Tel |
|---|:-:|:-:|
| **Semplicità** | | |
| Si capisce in 3 secondi a cosa serve | [ ] | [ ] |
| UN solo pulsante principale, ben visibile | [ ] | [ ] |
| Le cose rare non stanno in mezzo (menu «...» o più in basso) | [ ] | [ ] |
| Le 3 cose tipiche in pochi clic — clic contati: 2 / 0 / 1 | [x] | [x] |
| Parole semplici, di cantiere, niente inglese | [ ] | [ ] |
| Niente spiegazioni addosso a cose che si capiscono da sole | [ ] | [ ] |
| Sezione vuota: dice cosa fare e ha il pulsante | [ ] | [ ] |
| Errori in italiano chiaro, che dicono come rimediare | [ ] | [ ] |
| **Grafica** | | |
| Testi, pulsanti e icone GRANDI sul 1920 | [ ] | [ ] |
| Allineato sulla stessa colonna sinistra e destra (misurato) | [ ] | [ ] |
| Uguale alle altre sezioni (testata, pulsanti, misure) | [ ] | [ ] |
| Telefono 380 px: niente fuori schermo, pulsanti facili, niente scritte tagliate | [x] | [x] |
| Colori = stato (rosso problema, ambra attesa, verde fatto, blu in corso) | [ ] | [ ] |
| **Conti** | | |
| Ogni conto rifatto A MANO con almeno 3 casi | [ ] | [ ] |
| Lo stesso numero è uguale OVUNQUE | [ ] | [ ] |
| Nessuna formula copiata in due posti | [ ] | [ ] |
| **Funziona** | | |
| Provato DAL VIVO sul sito vero, account di Alex | [x] | [-] |
| Console senza errori | [ ] | [ ] |
| Salvare, modificare, cestino, recuperare: tutto funziona | [ ] | [ ] |

Problemi trovati: _(si scrive dopo la foto del «prima»)_


## 3.16 — App · Richieste dal sito

**Le 3 cose che ci fa l'artigiano:** (a) leggere una richiesta nuova · (b) chiamare / scrivere al cliente · (c) farne un preventivo

**Problemi trovati (7 nov):** sul TELEFONO la scheda era rotta (nome sotto l'etichetta «Nuova», pulsanti sopra le scritte: due pulsanti larghi nella colonna destra della riga). Due pulsanti uguali invece di uno. Schede «Da fare» e «Nuove» quasi uguali. Riquadro «2 richieste» doppione. Spiegazione di 3 righe.
**Fatto (ok di Alex):** un solo «Apri» (`ds-apri` aggiunto ad `AZ_APERTURA`); dentro, in alto, «Crea il preventivo» (blu) e «Segna chiusa» — le porta la finestra da sola (`dsApri` passa `dsVoci(r)`), cosi' ci sono anche aprendo dal Riepilogo o dalla ricerca. Schede: Da fare · Fatte · Tutte. Via il riquadro del conteggio. Spiegazione in 1 riga.
**Conti:** nessun conto in questa sezione.

**Collaudo dal vivo (11 nov 2026):** le correzioni del 7 nov sono online (sul tuo account nessuna richiesta). Sistemato: senza rete diceva «Ancora nessuna richiesta» → «Non riesco a leggere» col Riprova (`dsCarica` torna null, regola 20; chi la chiama altrove usa `||[]`); la pagina vuota ha il pulsante «Guarda la tua pagina» (apre la scheda pubblica).


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

**Problemi trovati (7 nov):** il pulsante «+» (allega foto/PDF) non diceva cosa fa; sul telefono «+», «Parla», «Manda» su tre righe a tutta larghezza; sul computer archivio largo 244 px con titoli su 3 righe e scritte a 13-14 px; la × per buttare una chat era 26 px.
**Fatto (ok di Alex):** «+» → «📎 Foto»; telefono: Foto · Parla · Manda in una riga; computer: archivio 320 px, scritte 15-16 px, × 36 px (css/gestionale-stile.css, js/gest-chat.js). La chat resta vuota, senza spiegazioni (decisione del 29 ago).
**Conti:** «Ti restano N messaggi» viene da `chat_stato()` sul server: nessun conto nel browser.

**Collaudo dal vivo (11 nov 2026, senza mandare messaggi):** le correzioni del 7 nov sono online. Sistemato: la × buttava la chat al primo tocco e la chat NON va nel Cestino → adesso chiede «Buttare la chat «…»? Non va nel Cestino: non si recupera» (`svuotaUna`). Buttate le 24 chat dei miei collaudi (dal 6 al 10 nov); restano le 9 più vecchie.


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

**Conti rifatti a mano (7 nov, profilo forfettario artigiano, coeff 86%):** proiezione 43.900 × 365/311 = 51.522,51 ✓; reddito 44.309,36 → INPS 4.521,36 + 24% × 25.501,36 = 10.641,69 ✓; imposta 15% × 33.667,69 = 5.050,15 ✓; totale 15.691,84 ✓; al mese 1.307,65 ✓; «31 € ogni 100» = 30,46 arrotondato in su ✓; rata INPS 1.130,34 ✓; secondo acconto 2.525,08 + 3.060,17 = 5.585,24 ✓; mora 6.802 € × 10,40% × 120 gg = 232,57 ✓; legale 2.452 € × 1,6% × 87 gg = 9,35 ✓; «Quanto ti resta» 43.900 − 12.200 − 13.371,24 = 18.328,76 ✓.
**Problemi trovati:** (1) «ti devono 18.878,61 € scaduti» in Quanto ti resta contro 17.353,00 € in Farsi pagare: la differenza era la fattura 1 del Noleggio (1.525,61 €), contata solo da una parte; (2) nei «prossimi 3 mesi» mancava il bollo delle fatture (28 € al 30/11) che «Le tue tasse» mette: la mappa dei bolli si costruiva solo lì; (3) «+ 0,00 €» in verde; (4) totale delle tasse in rosso.
**Fatto (ok di Alex):** la riga dice «17.353,00 € qui nel gestionale e 1.525,61 € del Noleggio»; `ftBolli(ff)` in js/gest-fisco-tasse.js, usata da Le tue tasse, Quanto ti resta e Chat AI del fisco (una formula sola); zeri grigi (`fvZero`); totale tasse scuro con icona grigia.
**Resta da decidere (non fatto):** «Farsi pagare» non vede le fatture del Noleggio (i solleciti stanno su `gest_fatture`).


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

**Problemi trovati (7 nov):** sul TELEFONO la pagina usciva dallo schermo (la griglia prendeva i 581 px del grafico, schermo 380): totali tagliati; nomi dei lavori tagliati («PROVA …»); due «Scarica per Excel» (barra e Report) che fanno cose diverse; «Totali storici» non diceva di essere del solo reparto, e il margine negativo accanto a lavori tutti in guadagno non si capiva.
**Fatto (ok di Alex):** griglia `minmax(0,1fr)` e nomi a capo sul telefono; il pulsante del Report si chiama «Scarica il report»; titolo «Totali di questo reparto» + «Il margine conta solo i soldi già incassati».
**Conti:** Taglio albero 1.000 − 0 − 337,50 = 662,50 ✓; margine 0 − 337,50 = −337,50 ✓; incassato 0 ✓ (nel reparto giardiniere ci sono solo 2 fatture in bozza: controllato sul database).


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

**Galleria — problemi trovati (7 nov):** sul telefono i filtri «Mostra» e «Quando» uscivano dallo schermo (scritte tagliate); foto piccole (150 px sul 1920, una per riga a mezzo schermo sul telefono).
**Fatto (ok di Alex):** filtri uno per riga sul telefono; foto in griglia, minimo 230 px sul computer, due per riga sul telefono (css/gestionale-stile.css).
**Mappa — problemi trovati (7 nov):** sul telefono la riga sotto il cantiere tagliata («00 giorni fa · comun…»); «100 giorni fa» in rosso senza dire perché; avviso «cantieri senza distanza» di 4 righe.
**Fatto (ok di Alex):** riga a capo sul telefono; «in ritardo (100 giorni fa)»; avviso in 2 righe (js/gest-galleria-mappa.js). Distanze: in linea d'aria, calcolate dal servizio mappe, nessun conto di soldi.


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

**Problemi trovati (7 nov):** sul TELEFONO schede rotte (nome in una colonna stretta, pulsanti «Rimetti a posto»/«Elimina per sempre» sopra le scritte) — stesso difetto di Richieste: la riga con due pulsanti li mette nella colonna di destra; spiegazione in alto di 6 righe (e diceva «Tutti i reparti qui sopra» mentre sta sotto); casella di ricerca tagliata.
**Fatto (ok di Alex):** regola generale in css/gestionale-stile.css: sul telefono ogni scheda con 2+ pulsanti va in colonna (nome, dettagli, pulsanti) — vale per tutte le sezioni; spiegazione in 1 riga; ricerca a tutta larghezza.
**Conti:** nessuno. Nota: i numeri accanto ai tipi («Voci del tuo elenco prezzi 200») contano le righe caricate (213 su 2.562), non tutte.


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

**Collaudo (7 nov, giro di prova studio):** conto 3 + 10 = 13 di 30, mancano 17 ✓. Un solo «+ Nuovo corso», righe con «Apri». Riquadro rosso a novembre con 13/30: giusto (sotto il 60% a fine anno è un problema vero). Unico difetto: il conto per tipo a 14 px e il pulsante dell'anno a 15 px → portati a 16.


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

**Ricarica crediti — conti rifatti (7 nov):** 19/150 = 12,7 c («circa 13») ✓; 45/400 = 11,25 c ✓; 99/1000 = 9,9 c («circa 10») ✓; messaggi 9/300 = 3 c ✓, 25/1000 = 2,5 c ✓, 69/3000 = 2,3 c ✓.
**Problemi trovati:** sul pacchetto da 1.000 messaggi «Il più conveniente» — FALSO, quello da 3.000 costa meno a messaggio; scritte a 13–15 px; spiegazione in alto di 5 righe; colonna stretta (880 px) sul 1920.
**Fatto (ok di Alex):** «Il più scelto»; tutto almeno 16 px (l'etichetta 15); colonna 1000 px; spiegazione in 2 righe (ricarica-crediti.html).


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

**Problemi trovati (7 nov, computer):** pulsanti a 13 px alti 34; cinque pulsanti tutti uguali, anche quelli rari; la freccia in alto a sinistra senza scritta.
**Fatto (ok di Alex):** pulsanti 16 px alti 44; «Salva una copia» e «Scarica per Excel» dentro «Altro ▾» (si chiude toccando fuori); «← Reparti». Sul telefono le copie nel menu ☰ restano tutte e cinque.


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

**Riepilogo — conti (7 nov, sul database):** da incassare = noleggi ESTERNI non pagati 630 + 1.050,50 = 1.680,50 ✓ (quello interno da 1.080 escluso, giusto); cauzioni in deposito 500 ✓.
**Problemi trovati:** «Fuori adesso» col pallino rosso come «In ritardo» (doppione, e avere mezzi fuori è normale); righe sotto i titoli a 14 px e tagliate.
**Fatto (ok di Alex):** `nolDett` accetta "corso" = pallino blu; «Fuori adesso» blu; righe a 16 px intere.


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

**Problemi trovati (7 nov):** nelle schede dei noleggi le due righe «sub2» (date / importo) avevano la stessa area della griglia e finivano UNA SOPRA L'ALTRA, illeggibili (PC e telefono); sul telefono «Apri» a destra stringeva il testo su 7 righe; il noleggio a un tuo reparto diceva «da pagare»; etichette a 13 px.
**Fatto (ok di Alex):** righe in colonna (gestionale-noleggio.html); sul telefono «Apri» sotto; «al tuo reparto, non si incassa» (js/nol-salva-noleggio.js); etichette 14 px, Apri e barra 16 px; «Esporta in Excel» → «Scarica per Excel».

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

**Collaudo (7 nov):** un pulsante principale, riga con «Apri», listino giorno/settimana/mese/cauzione leggibile. Valgono le correzioni comuni delle liste (3.26).

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

**Collaudo (7 nov):** «+ Nuovo cliente», righe con «Apri». Valgono le correzioni comuni delle liste (3.26).

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

**Conti (7 nov):** fattura n. 1 imponibile 1.250,50 + IVA 22% = 1.525,61 ✓ (= «Emesse, da incassare»).
**Problemi trovati:** «Noleggi da fatturare 3» contava anche il noleggio a un tuo reparto, che non si fattura; spiegazione di 4 righe.
**Fatto (ok di Alex):** escluso chi ha `mestiere_id` (js/nol-fatture.js) → 2; spiegazione in 2 righe.
**Resta (non toccato):** la formula del totale del Noleggio (`fattnolTotali`) è separata da quella dell'App (vedi «doppioni» in cima).

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

**Conti (7 nov):** reso 1.080 + 630 + 1.050,50 = 2.760,50 ✓. **Difetto:** «Ancora da incassare 2.760,50» contro 1.680,50 nel Riepilogo — qui contava anche il noleggio a un tuo reparto; e le cauzioni si contavano «non rientrato» invece di «in deposito» (due formule diverse per la stessa cosa).
**Fatto:** stesse regole del Riepilogo (`mestiere_id` escluso, `cauStatoDi(x)==="in_deposito"`) in js/nol-verbale-rendimento.js → 1.680,50 e 500; spiegazione da 3 righe a 1.

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

**Problemi trovati (7 nov):** pulsanti «Segna fatto / Modifica / Elimina» a 13 px; etichette a 13 px in tutte le liste del Noleggio.
**Fatto:** pulsanti 16 px alti 44, etichette 14 px (gestionale-noleggio.html). Nessuna scritta fuori schermo sul telefono in Calendario, Cauzioni, Documenti, Rendimento, Promemoria, Cestino, Prodotti, Magazzino, Movimenti, Fornitori.

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
| 11 nov 2026 | 3.3 Preventivi · 3.4 Lavori | errori senza rete, caselle che mancano, cestino col nome, messaggio sopra i pulsanti | → in attesa dell'ok ← |
| 7 nov 2026 | 3.3–3.11 (senza 3.10) + 3.7 | vedi le schede; collaudo dal vivo trovato 1 difetto: nel lavoro aperto «Segna fatto» non era per primo (sistemato, va nel prossimo push) | →fecdb00← |


## Giro dell'agente separato — 7 nov 2026, sera
Primo giro: **22 problemi** (nessun errore in console, tutti i conti rifatti a mano tornano). Chiusi:
1 descrizioni delle voci del preventivo tagliate → casella che va a capo (`textarea.pr-desc`, cresce da sola, Invio non va a capo) ·
2 saldo della carta in carattere Times (Playfair mai caricato) → carattere del gestionale; data a 15 px ·
3 Agenda operatore: tendina fuori schermo sul telefono → larga quanto lo schermo ·
4–5 scheda lavoro: testi a 13 px → 15; «Apri in Google Maps» 21 px → 44; «Cosa è stato fatto (consuntivo)» → «Cosa è stato fatto» (lo studio tiene la parola) ·
6 titolo del computo con doppio spazio → corretto, va a capo sul telefono ·
7 schede cliente/fornitore: etichette 13,5 → 15; collegamenti telefono/email alti 40; pulsanti 44 ·
8 tondini «i» 30 px → 40 sul telefono; + e − della mappa 40 ·
9 titolo in Mappa tagliato → va a capo ·
10 scritta della ricerca tagliata sul telefono → «Cerca un nome» ·
11 numeretti del menu 13 px → 14; id doppio `cnt-crediti` → Crediti formativi ora `cnt-cfp` ·
12 Report: «Migliori clienti (per fatturato)» contava i lavori → «(per valore dei lavori)»; margine col segno «−» ·
13 «Pagata» / «Ha pagato» → sempre «Ha pagato» ·
14 nomi nel Cestino tagliati a metà parola → «…» ·
15 Noleggio: pallino verde su uno zero → grigio ·
16 titoli dei riquadri soldi tagliati → vanno a capo ·
17 pulsanti di stato tagliati nella scheda (telefono) → due per riga ·
18–19 pulsanti e scritte a 13 px nelle schede e nella barra del Noleggio → 15–16 ·
20 Rendimento: mancavano 1.080 € senza dire perché → «ai tuoi reparti 1.080,00 € (non si incassano)» ·
21 Ricarica: due uscite → una sola, «Torna al gestionale» alta 44 ·
22 Ricarica sul telefono: «26 + 0» andava a capo male → griglia.
Lasciato com'è (scelta): «metti da parte 31 € su 100» è 30,46 arrotondato in su apposta (meglio un euro in più da parte).

Secondo giro dell'agente: 18 chiusi, 4 a metà, 2 nuovi (descrizione del preventivo più piccola dei numeri e non allineata). Chiusi: Report con la riga «il guadagno di ogni lavoro è sul suo prezzo, anche se non è ancora stato pagato»; Noleggio «+ Nuovo lavoro» e numeretti del menu a 16/14 px; Rendimento: anche la riga del mezzo dice «ai tuoi reparti 1.080,00 € (non si incassano)»; Ricarica: anche il «Torna al gestionale» in fondo alto 44; preventivo: la descrizione prende la stessa grandezza di quantità e prezzo e le caselle della riga sono alte uguali; tondini «i»: zona da toccare 44x44 centrata.

Terzo giro dell agente (7 nov, notte): tutti e 7 i punti chiusi, nessun problema nuovo, zero errori in console. **Collaudo chiuso a ZERO problemi.**
Da sapere (non un difetto provato): nel Noleggio il numeretto del Cestino nel menu compare solo dopo aver aperto il Cestino.


## 8 nov 2026 — Prezzario e Stati di avanzamento (erano rimasti indietro)
**Prezzario — problemi:** una × su ogni voce che la buttava con un tocco (dentro la voce c'è già «Metti nel cestino»); la scritta diceva «vedi le 1000» ma se ne vedono 60 alla volta; ricerca e «Importa» a 14 px; sul telefono nome della voce tagliato a una riga e mezza.
**Fatto (ok di Alex):** «Apri» al posto della ×; «ne vedi 60 alla volta, le più usate prima»; ricerca 17 px alta 48, Importa 16 px alto 44; sul telefono fino a 3 righe.
**Stati di avanzamento — conti:** SAL n. 10 (reparto «progetto casa»): 12,50 m² × 32,64 € = 408,00 € ✓ (nessun ribasso), uguale in elenco e nel riquadro in alto.
**Problemi:** «Fai un SAL» a 14 px → 16, alto 44. Il pulsante «📄 PDF» accanto ad «Apri» RESTA: decisione del 19 agosto (il PDF è il motivo per cui l'elenco esiste).
**Chiedi una funzione · Assistenza diretta (8 nov):** funzionano; troppo da leggere. Fatto (ok di Alex): spiegazioni da 3 righe a 1 in tutte e due (anche nelle copie del Noleggio), «Cosa succede dopo» in 1 riga, «Manda la richiesta» alto 48.
**Noleggio, numerino del Cestino (8 nov):** si vedeva solo dopo aver aperto il Cestino. Ora si conta all avvio (solo il conto, una domanda per tabella; se una non risponde resta com era).
**Telefono (8 nov):** Prezzario, Stati di avanzamento, Chiedi una funzione, Assistenza: niente fuori schermo, niente sotto i 14 px, pulsanti >= 40, zero errori.


## 10 nov 2026 — Il computo con l'AI (ok di Alex sulle foto)
**Giro dal vivo prima di cominciare:** 28 sezioni aperte da computer e da telefono, zero errori in console, niente fuori schermo; conti del computo rifatti a mano (22,41 × 22,00 = 493,02; ribasso 10% → 443,72).
**Buco trovato:** la Chat con AI non sapeva scrivere in un computo («non ho questo attrezzo»), chiamava «+ Aggiungi voce» il pulsante «+ Aggiungi lavorazione» e raccontava i suoi passi.
**Fatto:** attrezzi `compila_computo` e `prezzi_computo` in `chat-gestionale.mjs` (non scrivono niente); file nuovo `js/gest-computo-ai.js` con le schermate «Controlla le lavorazioni» e «Controlla i prezzi» (stesse righe del PDF del geometra, entra solo chi ha la spunta, un prezzo già messo non si tocca); nel computo i pulsanti viola «Aggiungi con l'AI» e «Metti i prezzi con l'AI», che portano alla chat.
**Limite detto ad Alex:** i prezzi con l'AI vedono 25 righe per volta.
**Telefono:** niente sotto i 14 px, niente fuori schermo, pulsanti alti 50.
**10 nov, secondo pezzo — la chat ti ci porta:** segnalino nuovo `[vai:SEZIONE]` / `[vai:SEZIONE:SCHEDA]` (elenco chiuso in `js/gest-chat.js`, il nome sul pulsante si legge dal menu) e `[apri:comp:ID]` per aprire un computo (`ctApriComp` in `js/gest-ricerca.js`). Riga «a corpo» senza quantità: entra con 1.
**10 nov, grafica dell'Assistente (proposta C, scelta da Alex su 3 foto):** testata blu a quadretti su `#ass-box` (anche Noleggio), righe di «Poi ci sono anche» col fondo dello stato (rosso chiaro / giallo chiaro) e pallino; testo nero, bordo blu. Alex: le decisioni vecchie non sono obbligatorie, si possono riaprire.
**10 nov, elenchi più vivi (ok di Alex sulle foto):** riga del totale blu a quadretti, scheda aperta blu, stati come etichette colorate (rosso chiaro in ritardo, giallo da fare/bozza, celeste in corso/inviato, verde fatto/pagata), pulsante principale blu scuro, spiegazione sotto il titolo nera a 16 px, spazio in fondo per «Parla». Prima di pubblicare: controllo dei contrasti su tutte le sezioni (trovata e corretta la scritta scura sulla riga blu).
**10 nov, computi lunghi:** attrezzi `righe_senza_prezzo` (solo le righe a zero, 30 per volta, con quante ne restano) e `cerca_prezzi` (fino a 30 ricerche nel prezzario in un colpo, per codice di tariffa e per parola). Un pezzo da 30 per messaggio: si ripreme «Metti i prezzi con l'AI» per le successive.
**10 nov, prezzi del computo = 5 messaggi (deciso da Alex):** un pezzo da 30 righe costa 0,13–0,16 $ di AI; il server scrive 4 righe «utente» in più (già svuotate, conversazione a parte) così `chat_stato` le conta; chi usa i messaggi comprati ne scala altri 4. La spunta ce l'hanno solo i prezzi trovati per codice di tariffa.
**10 nov, Giornate: si corregge anche quello scritto a mano.** Il racconto dettato passava già dall'AI; la casella «Cosa avete fatto» di «Oppure scrivila a mano» e quella di «modifica» no (provato dal vivo: restava «abiamo taliato»). Ora `js/correggi-giornata.js` conosce `gior-cosa-N` e `gior-mod-t`, e i loro Salva.
**10 nov, la giornata al centro (ok di Alex sulla foto):** in Giornate ogni giorno è una scheda con quello che c'è (foto, spese, benzina e km, fatture) e quattro pulsanti: Foto · Spesa · Benzina e km · Fattura o bolla. In cima al mese i totali. Nessuna tabella nuova: `gest_foto`, `gest_spese`, `gest_rifornimenti`, `gest_fatture_fornitori`. File `js/gest-giornate-extra.js`.

## 10 nov 2026 — Acquisti del mese (punto 2 di «Giornate al centro»)

- Tabella nuova `gest_acquisti` (sql/gest-acquisti.sql, già eseguita su Supabase).
- Funzione nuova su Supabase `ai-fattura` (già pubblicata): legge la fattura come prima E le righe della merce. `ai-cantiere` non è stata toccata; se `ai-fattura` non risponde il modulo legge come prima, senza merce.
- Modulo «Fattura da pagare»: riquadro «Cosa hai comprato» (js/gest-acquisti.js). Una bolla senza importo salva solo la merce.
- «Acquisti del mese» in Fornitori e in Giornate: somma le righe uguali, PDF da scaricare o inviare.
- Provato: somma e modi di contare (pa = paia, sac = sacchi) con Node; salvataggio, lista e PDF sul sito vero con 9 righe finte poi tolte; lettura di una fattura finta con 5 prodotti, trasporto e riga di solo testo: 5 righe giuste su 5, trasporto e testo saltati, 6,6 secondi.
- Da sapere: «30 gg d.f.f.m.» è stato letto come 30 giorni secchi (06/12) e non fine mese (31/12). Succedeva già prima: la scadenza va sempre controllata.
- Non fatto: le righe di merce dalla foto fatta con «Parla» (js/gest-parla.js) e il Noleggio (non ha i Fornitori).

## 10 nov 2026 — Squadra fatta come Giornate (punto 3) e «le ultime in cima»

- Squadra: una scheda grande per persona (js/gest-squadra-giornate.js) coi giorni del mese presi da gest_ore, striscia di quadretti, avvisi, tre tasti (Giornate, Messaggi, Scheda). «Giornate» apre il mese della persona. Niente di nuovo nel database. Se il file non si carica resta la tabella di prima.
- Regola nuova di Alessio: «le giornate salvate, le fatture o le foto in cima devono rimanere sempre le ultime salvate, altrimenti bisogna sempre scorrere». Applicata a: fatture da pagare (prima per scadenza, ora per data di salvataggio; pagate in fondo), foto e spese dentro Giornate, righe degli Acquisti del mese, giorni della persona in Squadra. Giornate era già così.
- Non fatto: la Squadra del Noleggio (è un file diverso).

## 10 nov 2026 — «Sei anche un professionista?»

- Pulsante in fondo al menu di sinistra, solo per impresa e artigiano (js/gest-anche-pro.js). Se dice sì, il gestionale si vede come studio tecnico (Computo metrico vero, Pratiche, Parcella, Crediti formativi) ma Mezzi, Carte e Giornate restano dove sono.
- Niente nel database: il tipo dell'iscritto non cambia. La scelta sta nel telefono (localStorage `ti_faccia_<utente>`), la legge logRuoloUtente in js/gest-reparti.js. Si torna indietro dallo stesso pulsante.
- Limite detto ad Alessio: la scelta vale per quel telefono o computer, non segue l'utente sugli altri. Per farla seguire serve una colonna nel database.


## 11 nov 2026 — revisione del 10 nov, parte 3 e 4

Provato oggi (finto Supabase a 1920 e 375 + sito vero, account di Alex):
- **Assistente**: reparto vuoto = «Il tuo primo preventivo in 3 passi» con un solo pulsante per il passo di adesso (sezione vuota: fatto). «Il tuo mese» (incassato senza IVA = lo stesso `incMese` del Report, giornate = `giorGruppi` come la sezione Giornate, preventivi accettati = `accettato_il`). Riga rossa «N cose in fattura non tornano con le bolle» (stessa `bfConfronta` di Acquisti del mese, mese in corso e mese scorso).
- **Giornate**: «Come ieri» (solo se l'ultima giornata è di questa settimana) → Salva → giornata di oggi scritta: provato. Telefono 375: niente fuori schermo, niente sotto 13 px. Dal vivo sul sito: si apre (Tel dal vivo non provato: `[-]`).
- **Fatture**: sul telefono «8.000,00 €» usciva dal riquadro (la riga «Telefono» era spuntata per sbaglio): adesso sotto i 520 px i riquadri vanno a una colonna.
- **PDF veri** (fatti girare col codice vero e jsPDF vero, letti pagina per pagina): preventivo con sconto (830,00 − 1% = 821,70; IVA 22% = 180,77; totale 1.002,47 €: giusto), ricevuta (1.250,50 € «milleduecentocinquanta/50»: giusto), Acquisti del mese (3 pagine; corretto «10 sacco» → «10 sacchi» e «e'» → «è»).
- **Studio tecnico e Noleggio a 1920**: zero errori, zero testi sotto 13 px, niente fuori schermo.
- **Spunta verde / X rossa** (`tiSpunta` in js/ti-finestra.js): fattura pagata, fattura emessa, lavoro finito, preventivo accettato, giornata salvata, mezzo rientrato (Noleggio), giornata mandata (app operaio), primi passi finiti, fattura del fornitore contro le bolle.

Non provato: la voce «Parla» (il microfono nel browser dell'app è bloccato: la prova la fa Alex dal telefono) e la foto di una bolla letta dall'AI sul sito vero (costa un credito: da fare con Alex).

## 11 nov 2026 (sera) — 3.18 → 3.33 tutte insieme (Alex: «falle tutte insieme senza chiedermi ogni volta»)
Provate dal vivo sul suo account, computer 1440 e telefono 390, senza salvare niente. Le correzioni del 7 nov sono tutte online; nessuna scritta fuori schermo, nessun errore di rete.
**App:**
- 3.18 Tasse e fisco, 3.19 Report, 3.21 Cestino, 3.22 Crediti formativi (nascosto per l'artigiano: giusto), 3.24 Barra in alto: niente da cambiare.
- 3.20 Galleria: eliminare una foto/video diceva «Eliminare questa foto?» ma va nel Cestino → `chiediCestino` + «Foto nel cestino: la riprendi da lì» (regola 22).
- 3.23 Assistenza diretta: tolte le scritte «Invio manda · Maiusc+Invio» e «I messaggi nuovi compaiono da soli» (decisione del 29 ago: niente spiegazioni nelle chat). Anche nel Noleggio.
**Noleggio:**
- Calendario: il pulsante per tornare a oggi era «•» → «Oggi» (come nell'App, 3.12).
- Spiegazioni da 3-4 righe ridotte a una: Cauzioni, Contratti e documenti, Foto e video, Cestino, Galleria.
- Promemoria vuoto: la riga sotto era a 13 px → 15.
- Eliminare una foto: ora dice se va nel Cestino (`cestFrase`).
- Riepilogo, Clienti, Mezzi, Noleggi, Fatture, Prodotti, Magazzino, Fornitori, Movimenti, Rendimento: a posto.

## 12 nov 2026 — giro del controllore separato (computer 1440 e telefono 390)
Trovati 14 difetti (3 gravi). Niente sotto i 14 px, niente fuori schermo, nessun errore al caricamento; le modifiche dell'11 nov funzionano.
**Gravi, corretti oggi (regola 20, senza rete):** il riquadro rosso «Non riesco a leggere… Riprova» adesso c'è anche in Mezzi, Attrezzature, Squadra, Scadenzario, Calendario, Agenda, Report, Promemoria, Galleria, Mappa, Cestino e in «Da fare adesso» di Tasse e fisco (diceva «Niente di urgente»). Noleggio: funzione nuova `nolNonLetto` in js/nol-base.js, usata da Mezzi, Clienti, Noleggi, Fatture (i tre riquadri mostrano «—», non 0,00 €), Cauzioni, Promemoria.
**12 nov, corretti anche:** Riprova (e niente «TypeError») in Computo, Prezzario, Stati di avanzamento, Giornate, Assistenza diretta, Farsi pagare e Assistenza del Noleggio (`nonLettaHTML` in js/gest-schede-clienti.js); casella rossa in Promemoria (testo e giorno) e in Nuova voce del Prezzario (`campoManca`). Il Promemoria del Noleggio resta col messaggio (lì `campoManca` non c'è).
**12 nov, domande di «elimina» (regola 22):** funzione nuova `chiediVia(cosa,nelCestino,sotto)` in js/gest-ai-moduli.js. Nel Cestino: riga di ore, spesa, documento (lavoro, cliente, fornitore), corso. Per sempre: pieno, ricevuta; nel Noleggio lavoro e persona (col nome).
**12 nov, ritocchi:** Report: gli zeri sono grigi e senza segno (`_repZero`); Cestino vuoto: una riga sola; telefono: numero ed email da toccare alti 44 px (`a.cli-link`). «Preve…» nella barra in basso NON è un difetto: sul telefono vero (360, 370, 375 px) «Preventivi» ci sta, lo tagliava solo il riquadro di prova con la barra di scorrimento.
**12 nov, deciso da Alex:** il pulsante in basso sul telefono si chiama «Assistente» come nel menu (era «Oggi»).
**12 nov, deciso da Alex:** «Il tuo primo preventivo in 3 passi» non si vede più a chi ha già una fattura emessa o un lavoro finito (js/gest-primi-passi.js).
**12 nov, Report «Ore per operatore»:** contava solo la casella «ore» del lavoro; ora conta le righe di gest_ore, le stesse della manodopera (`righe` da caricaManodopera).
**Lasciato com'è (scelta di Alex):** le scritte «Leaflet / OpenStreetMap» a 12 px nella Mappa: è la firma della cartina.
**12 nov, ultime quattro:** Noleggio: casella rossa nel Promemoria (`nolCampoManca` in js/nol-base.js); la domanda di «elimina» dice il nome del documento (lavoro, cliente, fornitore); Report: ore con la virgola; le ricevute di pagamento eliminate compaiono nel Cestino e si riprendono (CEST_COSE).
**Giro del controllore chiuso il 12 nov 2026:** 15 difetti trovati, 13 corretti, 1 non era un difetto, 1 lasciato per scelta.
Provato dal vivo dopo il push (→8b05aba←): 12 sezioni dell'App e 6 del Noleggio mostrano il riquadro rosso senza rete e con «Riprova» tornano i dati; console pulita.
**12 nov, Noleggio — mezzo «Disponibile» ma fuori (corretto):** in Mezzi lo stato si legge anche dai noleggi aperti con `nolFaseDi` (IN RITARDO · N giorni / FUORI / PRENOTATO, stesse parole e colori dell'elenco Noleggi); nel Riepilogo «Fuori adesso» e «In ritardo» contano i mezzi, non i noleggi.

## 12 nov 2026 (pomeriggio) — secondo giro del controllore separato (computer 1440, telefono 375 e 360 emulato)
Trovati 17 difetti (4 gravi, tutti nel Noleggio senza rete). Nell'App le correzioni del mattino funzionano: 26 sezioni col riquadro rosso, 11 domande di «elimina», 10 caselle rosse, numeri uguali, console pulita.
**Gravi, corretti (regola 20 nel Noleggio):** Riepilogo (trattino al posto dei numeri, pallini grigi, riquadro rosso sopra le schede: prima diceva «Nessun mezzo in ritardo. Tutto sotto controllo»), Prodotti, Magazzino, Fornitori, Movimenti (dicevano «Nessun prodotto. Aggiungine uno.»), Rendimento (0,00 € e «Nessun mezzo»), Contratti e documenti (usciva «TypeError: Failed to fetch»), Foto e video (diceva «esegui il file sql»: ora solo se la tabella manca davvero).
**App, corretti:** Mezzi legge lo stato anche dai noleggi aperti (`mezziNolMap` in js/gest-mezzi.js: «In ritardo · N giorni», «Fuori a noleggio», «Prenotato» — l'escavatore era «Disponibile» qui e «In ritardo · 73 giorni» nel Noleggio); la domanda di «elimina» del mezzo dice il nome e il Cestino (`chiediVia`); Assistente: due bozze mai mandate non sono più «in attesa di risposta» ma «bozze da mandare»; Chiedi una funzione senza rete col riquadro rosso; Prezzario «Mettere nel cestino «…»?»; Report: il meno scritto in un modo solo.
**Telefono, corretti:** Lavoro · Registro delle ore una casella sotto l'altra (usciva a 385 su 375); Computo vuoto: «Carica qui il computo del geometra» va a capo; la «i» di aiuto a 15 px, tonda, col dito su 44 px; numero ed email a 44 px anche nelle schede aperte.
**Noleggio, ritocchi:** uno zero è grigio anche nel numero (`nrc-zero`); il Calendario dice «N noleggi in ritardo» (il Riepilogo conta i mezzi); la domanda di «elimina» non dice più «questa scheda» tra virgolette.
**12 nov, ok di Alex sulle foto — fatti anche questi due:** Noleggio sul telefono col menu come nell'App (pulsante con le tre righe, menu a tutto schermo, barra in basso Riepilogo · Noleggi · Mezzi · Fatture; «Dati azienda» sul telefono è «Azienda» perché «+ Nuovo noleggio» ci stia intero) in js/nol-menu-telefono.js; Computo coi 6 passi su due colonne. **Erano (prima dell'ok):** sul telefono il menu del Noleggio è una striscia di 20 voci da scorrere di lato (e «+ Nuovo noleggio» è tagliato); nel Computo i passi dal 3 al 6 sono nascosti a destra.
**Non provato:** le ricevute eliminate nel Cestino (serve una ricevuta vera), Chat con AI, «Parla», PDF, app operaio, studio tecnico, Noleggio a 360 px.


## 12 nov 2026 (sera) — terzo giro del controllore separato (computer 1440, telefono 375 e 360 emulato)
Trovati 24 difetti (5 gravi: 4 nel Noleggio, 1 nell'App). Console e rete senza errori; le modifiche del secondo giro funzionano.
**Gravi, corretti:** Noleggio sul telefono: con una finestra aperta la barra in basso copriva «Salva» e «Annulla» (ora la barra sparisce: `body:has(.overlay.open) #barra-basso`); Noleggio senza rete: Calendario (diceva «0 noleggi in ritardo», ora riquadro rosso in js/nol-registratore-calendario.js), Cestino (diceva «Il cestino è vuoto», js/nol-cestino.js), Cauzioni (alla prima apertura «€ 0», ora «—»); App senza rete: Crediti formativi (diceva «esegui sql/…», ora solo se la tabella manca davvero, js/gest-preventivi.js).
**Corretto anche:** Calendario del Noleggio, «Oggi» era tagliato («Ogg»).
**12 nov (sera), corretti anche gli altri (push unico):** Noleggio: casella rossa con la frase sotto in Mezzo, Cliente, Noleggio, Fattura, Prodotto, Fornitore, Movimento (`nolCampoManca`) e nella Ricevuta di pagamento dell'App (`campoManca`); la domanda di «elimina» parla come l'App («Mettere nel cestino la fattura «n. 1 di …»?», il noleggio col cliente) in js/nol-card-righe-stampa.js; «Noleggi in ritardo» al posto di «Mezzi in ritardo»; a 360 px il titolo non finisce sotto le tre righe e il Rendimento sta nello schermo; in Assistenza e Chiedi una funzione sul telefono «Parla» che galleggia non c'è (copriva la casella); Chiedi una funzione senza rete col riquadro rosso; zeri grigi in Calendario, Fatture, Cauzioni (`nol-zero`); pallino «Guidami» a 44 px. App: Computo pieno sul telefono, la riga va a capo e la «×» resta dentro (css); Tasse e fisco › Quanto ti resta: zero senza segno, il meno scritto in un modo solo, senza incassi niente «stai lavorando in perdita»; Farsi pagare: riga «In più, nel Noleggio: … di fatture scadute»; arrivando dal Noleggio c'è «← Torna al Noleggio» (js/gest-torna-noleggio.js); «l'Assistente ti avvisa» al posto di «il Riepilogo»; zeri grigi in Fatture, Assistente, Squadra (`zero-grigio`); SAL «su … previsti» a 14 px; filtri di Agenda e Galleria e quantità/prezzo della fattura a 44 px; «2 fatture in bozza… la più vecchia ferma da…»; via il «1000» accanto a Prezzario.
**12 nov (sera), deciso da Alex — chiusi anche gli ultimi due:** negli Stati di avanzamento il filtro «Da fatturare» si chiama «Non fatturati» (in Fatture «Da fatturare» conta i lavori finiti; qui c'erano dentro anche gli acconti in bozza); il numerino su «Computo da prezzare» si conta all'ingresso nel reparto (`renderContatori`), e conta le bozze.
**Non provato:** le ricevute eliminate nel Cestino (non ce n'erano), se «elimina» fa quello che dice (sempre risposto No), PDF, «Parla», app operaio, studio tecnico.
**12 nov (sera), il banco automatico:** `tools/banco-gestionale.js` (regola 25). Apre gestionale-app e gestionale-noleggio a 1440, 375 e 360 px con utente e database finti: 44 sezioni misurate per larghezza, 14 finestre «nuovo» (Salva si tocca, niente fuori schermo, casella rossa a modulo vuoto), 44 sezioni senza rete (riquadro rosso con Riprova, niente parole tecniche). Sabotato apposta in tre punti (barra sopra «Salva», Cestino «vuoto» senza rete, casella non rossa): li ha accusati tutti e tre. Al primo giro ha trovato un difetto mio: a 360 px il pulsante «Oggi» allargato faceva uscire il Calendario di 6 px (corretto). Su GitHub parte da solo a ogni push che tocca il gestionale (`.github/workflows/banco-gestionale.yml`): non ferma Netlify, avvisa.
**12 nov (notte), il banco coi dati finti:** `tools/banco-dati-finti.js` — poche righe INVENTATE per 24 tabelle (colonne vere, lette dal database il 12 nov), con dentro apposta i casi scomodi: nomi lunghissimi, un lavoro in ritardo, un mezzo fuori da troppo, una fattura scaduta, una giacenza a zero. Il finto database applica i filtri (reparto, cestino, stato). In più il banco adesso apre la prima scheda di ogni sezione (23 schede: sta nello schermo, «Salva» si tocca), legge 19 domande di «elimina» (devono dire il nome e dove va) e senza rete confronta il prima e il dopo (niente «vuoto» nuovo, nessun numero che va a zero). **Al primo giro ha trovato 3 difetti veri, corretti:** Fornitori dell'App, «Pagata» e «Modifica» a 13,5 px (`.btn-sm` a 14 px, 44 px sul telefono); Rendimento del Noleggio che usciva di 7 px anche a 375 px con un importo a quattro cifre; la domanda di «elimina» di una fattura emessa non diceva dove va (ora «Va nel Cestino: la riprendi quando vuoi»). Il giro intero dura circa 15 minuti.
