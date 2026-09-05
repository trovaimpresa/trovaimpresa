# Prompt sessione nuova — TrovaImpresa, dal 6 settembre 2026

Sono Alex, fondatore e unico sviluppatore di TrovaImpresa (trovaimpresa.com).
Leggi PRIMA `CLAUDE.md` (le sezioni del **5 SETTEMBRE 2026**, in fondo al file)
e `LAVORI-APERTI.md` (la parte «NATI IL 5 SETTEMBRE», in cima).
Memorie: `/preferences.md`, `/areas/gestionale.md`, `/areas/lavori-aperti.md`.

## Come lavoriamo (non sono un tecnico)

- Rispondi **corto**. I numeri isolali cosi': →12←
- Spiegami le operazioni **a clic, con passaggi numerati**
- Modifica **solo** quello che ti chiedo
- **Mai comandi git dalla mia cartella**, nemmeno `git status`. Dammi il blocco pronto:
  `node tools/controllo-push.js && git add … && git commit -m "…" && git push`
- **Il collaudo dal vivo dopo il push lo fai tu**, da solo, senza che te lo chieda.
  Trappola della cache: leggi la pagina con `?fresco=…` che cambia ogni volta e
  `no-store`, e verifica che contenga davvero la modifica **prima** di cliccare
- Ogni modifica ha il suo **banco**, e il banco deve diventare **rosso** col
  codice di prima: se no non misura niente
- A fine lavoro: **riassunto**

---

# COS'E' GIA' FATTO (non rifarlo)

Il →5← settembre 2026 e' stata una giornata lunga: →7← push. Il **gestionale
operatore funziona per tutti e →4← i ruoli**, provato dall'invito al rapportino
salvato con operai VERI (non finti): →48← prove sul database.

Sono chiusi: l'artigiano ha di nuovo Squadra/Agenda/Carte · il gestionale si
apre sulla schermata dei reparti · la prima schermata dell'operaio e' un bottone
(«📝 Segna la giornata») · l'app operaio e' dentro il gestionale (pulsante
accanto al Noleggio, card in Squadra, QR) · l'operaio rilegge e corregge le sue
spese · il lavoro di oggi e' in cima e gia' scelto · l'operaio tocca **solo i
lavori suoi, e solo lo stato** · le parole cambiano col mestiere (studio e
negozio non leggono piu' di premiscelato) · il negozio puo' finalmente scrivere
il rapportino · **l'elenco iscritti non si scarica piu' in blocco** (da →117←
imprese con email a →0←) · la mappa e' tornata a funzionare.

## ⛔ GLI ATTREZZI CHE ADESSO CI SONO — usali, non rifarli

**Nel database ci sono QUATTRO operai VERI**, password `ProvaOperaio2026!`:
- `prova.operaio@trovaimpresa.com` — dentro la MIA impresa (artigiano), codice PROVA1
- `prova.operaio.impresa@trovaimpresa.com` — «PROVA Impresa edile», PROVA2
- `prova.collaboratore.studio@trovaimpresa.com` — «PROVA Studio tecnico», PROVA3
- `prova.commesso.negozio@trovaimpresa.com` — «PROVA Ferramenta», PROVA4

Le tre imprese finte hanno `is_test` acceso: sul sito non si vedono.
⚠️ **Prima di dire che un permesso funziona, fallo girare da loro**: finche'
l'operaio e' il titolare, `gest_puo_sezione` risponde «il titolare passa
sempre» e qualunque buco resta invisibile. E' cosi' che sono stati trovati →7←
buchi che nessun banco aveva mai visto.

**I banchi** (`prove-claude/banchi-fissi/`): `operatore/` con →4← file e
`imprese-pubbliche/` con →2←. Si lanciano con
`bash prove-claude/banchi-fissi/gira-operatore.sh`. Quelli `.sql` si incollano
nell'SQL Editor di Supabase: sono tutti dentro `BEGIN … ROLLBACK`, non lasciano
niente.

---

# IL LAVORO — in quest'ordine

## 1. ⛔ `tools/rimanda-conferme.js` non funziona piu' — e sono →24← persone

E' il programmino che rimanda la mail di conferma a chi non l'ha mai cliccata.
Legge `imprese` con la **chiave pubblica**, e da quando la tabella e' chiusa
trova →0← righe. Vuole `email` e `email_confermata`, che dalla vista pubblica
non escono apposta.

**Cosa voglio**: che torni a funzionare con la **chiave di servizio**
(`SUPABASE_SERVICE_ROLE_KEY`), non con quella pubblica. La chiave ce l'ho io:
dimmi **a clic** dove metterla e come lanciarlo, e non scrivertela mai in un
file che va su Git.
⚠️ Poi dimmi **quanti sono davvero** oggi quelli senza conferma, e **prima di
mandare niente fammi leggere il testo dell'email**: lo approvo io.

## 2. Il controllo colonne-fantasma e' cieco a meta'

`prove-claude/controllo-colonne.js` guarda solo i `.select({...})` e **non vede
gli indirizzi scritti a mano** tipo `rest/v1/imprese?select=id,nome,...`.
E' per questo che `mappa.html` chiedeva →5← colonne inesistenti, il database
rispondeva **400** e la mappa e' stata **vuota per settimane** senza che nessuno
lo sapesse.
⚠️ E' la voce →14← del quaderno, ma piu' grave di come era scritta: quella
parlava di `.update(variabile)`, questa e' un'altra strada cieca.

**Cosa voglio**: che il controllo guardi anche le stringhe `rest/v1/<tabella>?…
select=…` e le confronti con `colonne-vere.txt`. E che, prima di dire «tutto a
posto», mi dica **quante strade ha guardato**: se ne guarda →3← su →40← voglio
saperlo.

## 3. L'operaio legge i rapportini dei colleghi

`gest_rapportini_team_read` chiede solo il permesso «rapportini», non che il
rapportino sia suo. E' lo stesso buco chiuso il →5← set sui lavori, ma solo in
lettura (scrivere e correggere gia' li puo' solo sui suoi).
**Cosa voglio**: decidere insieme se stringere. Fammi la domanda giusta prima
di toccare — un capo squadra che scrive le ore di tutti forse i rapportini dei
colleghi li deve vedere davvero.

## 4. ⚖️ DA DECIDERE INSIEME — il punto che avevo rimandato

Ai gestionali da cantiere degli altri (Fluida, busybusy, Connecteam, Raken)
manca a me questo, e il →5← settembre avevo detto di **non costruire niente
senza avermelo chiesto prima**:

1. **Timbratura entrata/uscita** — oggi l'operaio scrive «→8← ore» a memoria
2. **Funziona senza campo (offline)** — nella mia pagina non c'e' **una riga**
   di gestione offline: in un cantiere senza linea le ore si perdono e lui non
   lo sa
3. **GPS sulla timbratura** (dove e' stata fatta)
4. **Ferie / permessi / malattia** chiesti dall'app

⚠️ **La domanda da farmi e' sempre la stessa**: *un'impresa smetterebbe di
pagare TrovaImpresa se questa cosa non ci fosse?* Se la risposta e' no, va in
fondo alla lista.
⚠️ Se ne facciamo uno, **timbratura e offline vanno insieme**: una timbratura
che si perde senza campo e' peggio di non averla.

## 5. Le voci vecchie del quaderno

In `LAVORI-APERTI.md` ci sono ancora: il noleggio «prenotato» contato come spesa
(voce →6←), la visita collegata all'iscrizione, i →10← utenti recuperati mai
contattati (voce **C**), le →5← pagine di registrazione troncate (voce **E**),
il profilo finto «Admin TrovaImpresa» non segnato come prova (voce **F**), gli
allegati che restano nel magazzino quando cancello un preventivo (voce **D**),
le →23← finestrelle piccole del Noleggio.

---

# DA DOVE PARTIRE

1. Il punto **1** — non e' codice, sono →24← persone gia' mie che non sto
   raggiungendo
2. Il punto **2** — finche' il controllo e' cieco, lo stesso difetto della
   mappa puo' tornare in qualsiasi pagina
3. Il punto **3**, se decidiamo di stringerlo
4. Il punto **4** solo se te lo dico io

Alla fine aggiorna `LAVORI-APERTI.md` e la sezione di oggi in `CLAUDE.md`.
