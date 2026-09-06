# Prompt sessione nuova — IL GESTIONALE OPERATORE per tutti e 4 i ruoli

Sono Alex, fondatore e unico sviluppatore di TrovaImpresa (trovaimpresa.com).
Questo lavoro è **uno solo**: far funzionare il gestionale dell'operaio
(`gestionale-operatore.html`) per **impresa, artigiano, professionista e negozio**.

Leggi PRIMA `CLAUDE.md` (le due sezioni del **4 SETTEMBRE 2026**) e `LAVORI-APERTI.md`.
Memorie: `/preferences.md`, `/areas/gestionale.md`, `/areas/pannelli-imprese.md`.

## Come lavoriamo (non sono un tecnico)

- Rispondi **corto**. I numeri isolali così: →12←
- Spiegami le operazioni **a clic, con passaggi numerati**
- Modifica **solo** quello che ti chiedo
- **Mai comandi git dalla mia cartella**, nemmeno `git status`. Dammi il blocco pronto:
  `node tools/controllo-push.js && git add … && git commit -m "…" && git push`
- **Il collaudo dal vivo dopo il push lo fai tu**, da solo, senza che te lo chieda.
  Trappola della cache: apri con `?fresco=1` e verifica che la pagina caricata
  contenga davvero la modifica prima di cliccare
- Ogni modifica ha il suo **banco**, e il banco deve diventare **rosso** sulla
  versione pubblicata: se no non misura niente
- A fine lavoro: **riassunto**

---

# COS'È GIÀ FATTO (non rifarlo)

`gestionale-operatore.html` (→1.978← righe) **esiste e funziona**. L'ho provato
dal vivo il →4← settembre: entra, mostra agenda, calendario, scadenze e il
pulsante «+ Rapido».

**Non è un'app separata**: scrive nelle stesse tabelle del gestionale del capo —
`gest_ore`, `gest_rapportini`, `gest_spese`, `gest_foto`, `gest_video`,
`gest_lavori`, `gest_clienti`, `gest_carte_movimenti`, `gest_scadenze`.
Le ore dell'operaio entrano nella manodopera del cantiere. Nessuna copia, nessun
travaso. **Questa parte è fatta bene, non toccarla.**

**L'operaio entra con un codice invito** (`gest_membri`, pagina
`gestionale-invito.html`). Il capo gli dà →7← permessi a spunte: calendario,
lavori, foto, note, clienti, fatture, pagamenti (+ `rapportini`).

**I permessi comandano davvero anche sul database**: c'è la funzione
`gest_puo_sezione(user_id, sezione)` usata dentro le regole RLS di `gest_ore`,
`gest_rapportini`, `gest_lavori`, `gest_spese`, `gest_foto`, `gest_video`,
`gest_fatture`, `gest_clienti`, `gest_scadenze`, `gest_carte_movimenti`.
⚠️ Il commento dentro `gestionale-operatore.html` dice ancora il contrario
(«non è un lucchetto sul database, il lucchetto vero sono le RLS»): **è vecchio,
va corretto** — le RLS ci sono.

**Cosa può fare l'operaio oggi**, dal pulsante «+ Rapido»:
`🎙 Racconta la giornata` (detta a voce, l'AI ne tira fuori ore/materiali/spese e
lui conferma) · `Ore` · `Materiale` (senza prezzi) · `Nota` · `Spesa`.

---

# IL LAVORO — in quest'ordine

## 1. ⛔ IL BUCO GROSSO: l'ARTIGIANO non può invitare nessuno

In `gestionale-app.html` c'è questa riga:

```
const TAB_NASCOSTI_ART=['squadra','agenda','carte'];
```

Per il ruolo **artigiano** la sezione **Squadra è nascosta**. Verificato dal vivo
sul mio account (sono artigiano): nella barra ci sono →21← voci e «Squadra» non
c'è. Quindi **un artigiano non può invitare un operaio**: la pagina per farlo non
è raggiungibile, e tutto il gestionale operatore per lui non esiste.

E gli artigiani sono i miei iscritti più numerosi:
artigiano →62← · impresa →44← · professionista →6← · senza tipo →4←.

**Cosa voglio**: che l'artigiano possa avere la sua squadra come gli altri.
Un idraulico o un giardiniere con →2← ragazzi è esattamente il caso d'uso.
⚠️ Prima di togliere `squadra` da quella riga, **cerca nel codice e in `CLAUDE.md`
se era una scelta voluta** e dimmi cosa hai trovato: se era voluta ne riparliamo,
se era una svista si toglie.
Controlla anche cosa fanno `agenda` e `carte` nella stessa riga: se le tolgo tutte
e tre cosa cambia?

## 2. Lo stato dei quattro ruoli — verificalo tu, uno per uno

| ruolo | com'è messo | cosa devi fare |
|---|---|---|
| **impresa** (`gestionale-app.html`) | Squadra visibile | provare il giro completo e dirmi se funziona |
| **professionista** (stessa pagina) | Squadra visibile, si chiama «Collaboratori» | **verificare**: un collaboratore di studio ha bisogno delle stesse cose di un muratore? (ore su una pratica, non su un cantiere) |
| **negozio** (`gestionale-negozio.html`, pagina a parte) | ha la sua sezione `squadra` e usa `gest_membri`/`gest_operatori` (→11← richiami) | **verificare che il giro invito → entrata → rapportino funzioni davvero**: è una pagina diversa, potrebbe essere rimasta indietro |
| **artigiano** | ⛔ Squadra NASCOSTA | punto 1 |

Per ognuno: parti dall'invito, arriva fino al rapportino salvato, e dimmi dove si
rompe. **Non fidarti del codice: apri le pagine.**

## 3. ⛔ Non l'ho MAI provato davvero, e non me ne accorgevo

Nel database c'è **un solo** operatore, e sono io: in `gest_membri` la riga ha
`impresa_id` e `membro_id` **uguali** (l'operatore «david» è il mio stesso account).

Il problema: la funzione dei permessi dice *«il titolare passa sempre»*
(`_impresa = auth.uid()`). Quindi quando entro come david **salto tutti i
controlli** e non vedo mai quello che vede un operaio vero. Qualunque difetto di
permessi mi resterebbe invisibile.

**Cosa voglio**: dimmi **a clic** come mi creo un operaio finto VERO — un secondo
indirizzo email, non il mio — così posso provare la pagina come la vede lui.
Poi provala tu con quell'account e dimmi cosa vede e cosa non vede.

## 4. I difetti già trovati il 4 settembre

- **La spesa si scrive ma non si rilegge**: `gest_spese` ha la regola per
  *inserire* (`gest_spese_team_insert`) ma **nessuna regola per leggere**.
  L'operaio sbaglia una cifra e non può né vederla né correggerla. Da decidere:
  gli si fa vedere solo quello che ha scritto lui, o niente?
- **`gest_squadra_nomi` ha →0← righe**: controlla se serve ancora o è roba morta
- **Nessun banco di prova** per `gestionale-operatore.html`: è l'unica parte del
  gestionale senza. Va fatto, con un finto Supabase che sappia distinguere
  **titolare** e **operaio con permessi diversi** — se no prova solo se stesso
- Il commento vecchio sulle RLS (vedi sopra)

## 5. Cosa manca rispetto agli altri gestionali — DA DECIDERE INSIEME

Ho fatto cercare come sono fatti i prodotti concorrenti (italiani: Fluida,
myAedes, Hopperix, TeamSystem Cantieri; internazionali: busybusy, ClockShark,
Raken, Fieldwire, Procore, Housecall Pro).

**Il nocciolo che hanno tutti, e che a me manca:**

1. **Timbratura entrata/uscita.** Oggi il mio operaio scrive «→8← ore» a fine
   giornata, a memoria. Tutti gli altri hanno il pulsante *entro / esco*
2. **Funziona senza campo (offline).** Un cantiere in campagna non ha linea: se
   l'operaio segna le ore e non salva, quelle ore sono perse e lui non lo sa.
   Nella mia pagina non c'è **una riga** di gestione offline
3. **GPS sulla timbratura** (dove è stata fatta). In Italia si fermano lì; il
   geofencing vero ce l'hanno solo gli americani
4. **Ferie / permessi / malattia** chiesti da app

**Dove sono già avanti** (non buttarlo via): i permessi granulari, e soprattutto
il **rapportino dettato a voce con l'AI** — non l'ho trovato in nessuno dei
prodotti guardati.

⚠️ **NON costruire niente di questi 4 senza avermelo chiesto prima.**
La domanda da farmi è: *un'impresa smetterebbe di pagare TrovaImpresa se questa
cosa non ci fosse?* Se la risposta è no, va in fondo alla lista.
Se decidiamo di farne uno, **timbratura e offline vanno insieme**: una timbratura
che si perde senza campo è peggio di non averla.

## 6. ⛔ LA PRIMA SCHERMATA — il difetto di forma, e costa poco

Il →4← settembre ho fatto guardare come si presenta davvero l'app dell'operaio
negli altri gestionali: schede App Store e Google Play (con gli screenshot), pagine
tour, e soprattutto le **guide di assistenza scritte per l'operaio**, che
raccontano il flusso tocco per tocco. →12← prodotti guardati, →8← con materiale
utile; i →3← italiani più vicini a noi (TeamSystem Cantieri, myAedes, Hopperix)
**non mostrano nessuna schermata in pubblico**.

**I tocchi contati** (i miei contati sulla pagina vera, gli altri letti dalle
guide — quelli segnati *stima* sono dedotti dal testo, non contati sull'app):

| | tocchi per timbrare | passaggi per il rapportino |
|---|---|---|
| **il mio** | non ce l'ho | **→4←** (`+ Rapido` → `Ore` → lavoro → `Conferma`) |
| Buildertrend | — | →4← |
| Raken | — | →9← |
| Fluida 🇮🇹 | →2← *(stima)* | non trovato |
| Connecteam | →2-3← *(stima)* | non trovato |

**Sul rapportino sono già alla pari dei migliori, e meglio di Raken.**
E due cose le ho già indovinate: la foto va **dritta alla fotocamera**
(`capture="environment"`, non la galleria) e c'è la **nota vocale** — che fra
tutti i prodotti guardati ce l'hanno solo Raken e Buildertrend, e nessuno nella
forma mia (l'AI compila il rapportino, non trascrive e basta).

**Quello che hanno TUTTI nella prima schermata e io no:**

- la **timbratura è un pulsante dedicato**, mai dentro un menu
- il **GPS si accende solo mentre si timbra**, non sempre
- la foto è **agganciata** al cantiere o al compito
- **offline con sincronizzazione** automatica

**⛔ IL DIFETTO DI FORMA: la mia prima schermata è un CALENDARIO, la loro è un
BOTTONE.** Apri `gestionale-operatore.html` e vedi il mese, →30← quadratini dei
giorni e «Lavori di oggi»; il pulsante `+ Rapido` sta in mezzo alla pagina.
Fluida e Connecteam aprono su **una cosa sola, grande**. Per un muratore con i
guanti e lo schermo sporco, un calendario da →30← caselle è un campo minato.

**QUESTO LAVORO VOGLIO FARLO, ed è mezz'ora**: non c'è codice nuovo, si sposta
quello che c'è già.

1. In cima, **un pulsante grosso** — «📝 Segna la giornata» — che apre lo stesso
   `+ Rapido` di adesso
2. Sotto, **i lavori di oggi**
3. Il **calendario più giù**, per chi lo cerca

⚠️ Il motore non si tocca: `rvApri()` e i suoi passi restano quelli.
Fammi vedere la **foto** della schermata nuova prima di dire «fatto», e provala
alla larghezza di un telefono, non del computer.

**Seconda cosa piccola, decidiamo insieme**: la scelta del lavoro è una lista.
Con →3← lavori va bene, con →40← diventa pesante — Fluida il cantiere lo indovina
col GPS. Un rimedio da poco: **il lavoro di oggi già in cima e preselezionato**,
gli altri sotto.

---

# DA DOVE PARTIRE

1. Il punto **1** (l'artigiano) — prima cercare se era voluto, poi dirmelo
2. Il punto **3** (l'operaio finto vero) — spiegami i clic, poi provalo tu
3. Il giro completo sui **4 ruoli** (punto 2) e dimmi dove si rompe
4. Il punto **6** (la prima schermata): è mezz'ora e si vede subito
5. I difetti del punto **4**
6. Solo dopo, e solo se te lo dico io, il punto **5** (timbratura, offline, GPS,
   ferie)

Alla fine aggiorna `LAVORI-APERTI.md` e la sezione di oggi in `CLAUDE.md`.
