# Prompt per la sessione nuova — dopo il 4 settembre 2026

Sono Alex, fondatore e unico sviluppatore di TrovaImpresa (trovaimpresa.com).

## Prima di toccare qualsiasi cosa, leggi

1. `CLAUDE.md` nella cartella del progetto — soprattutto la sezione
   **«4 SETTEMBRE 2026 — LE QUATTRO REGISTRAZIONI DIVENTANO UNA SCHERMATA»**,
   che è l'ultima, e la sezione **«DOVE SONO I FILE»** in cima.
2. `LAVORI-APERTI.md` (radice del progetto) — il quaderno dei lavori a metà.
   **Aggiornalo alla fine della sessione**: sposta in FATTO quello che chiudi.
3. Le tue memorie: `/preferences.md`, `/areas/lavori-aperti.md`,
   `/areas/profilo-pubblico.md`, `/areas/pannelli-imprese.md`.

## Come lavoriamo — regole che non si discutono

- La cartella è `C:\Users\Utente\Downloads\trovaimpresa`, in Cowork si apre come
  `$HOME/mnt/trovaimpresa`. Non cercare altrove.
- ⛔ **Niente comandi git dalla mia cartella, nemmeno in sola lettura.**
  Un `git status` una volta ha creato un `index.lock` che mi ha bloccato i commit
  per ore. Il `git push` lo faccio io: tu mi dai il blocco pronto da incollare.
- Ho la **dislessia**: rispondi corto, frasi brevi, niente muri di testo.
  I numeri isolali con i marcatori →così←. Niente gergo.
- **Non spiegarmi le cose che si capiscono da sole** dentro le interfacce.
- Se non mi capisci dopo →2← giri, dammi →3-4← opzioni da scegliere invece di
  interpretare (AskUserQuestion).
- **Prima di costruire una cosa, cerca se c'è già.** Il 4 settembre hai costruito
  una barra «profilo completo» che esisteva già da agosto.
- **Collaudo obbligatorio**: niente è «fatto» finché non è girato davvero.
  I banchi stanno in `prove-claude/banchi-fissi/` (nel `.gitignore`):
  `gira-conti.sh` · `gira-computo.sh` · `gira-assistenza-ai.sh` ·
  `gira-pagine.sh` (che lancia anche il banco delle registrazioni) · `gira-fascia.sh`.
- **Un banco nuovo va sabotato** prima di dichiararlo buono: se resta verde quando
  rompi il codice vero, sta misurando se stesso.
- **Su una grafica, guarda lo screenshot** prima di dire «fatto»: i banchi misurano
  la grandezza delle scritte, non il contrasto (il 4 set una pagina è finita blu su blu).
- Alla fine di ogni lavoro voglio **un riassunto** e **il passo che mi consigli**.

---

# I LAVORI, IN QUEST'ORDINE

## 1. ⭐ Preventivo: la foto allegata non arriva mai — IL PRIMO
**Dov'è**: `profilo-impresa.html` (sezione `#sec-preventivo`, funzione `inviaPreventivo`),
`netlify/functions/notifica-preventivo.js`.

**Il problema**: il cliente allega una foto alla richiesta di preventivo, la foto non
arriva mai. Il caricamento va sul bucket `foto-lavori`, che accetta solo l'impresa
loggata — il cliente non è loggato, quindi fallisce **in silenzio**: nessuno se ne accorge.

**Da fare**:
- bucket nuovo `preventivi-allegati`, privato, con insert da `anon` su
  `preventivi/<impresa_id>/…` e select per l'impresa proprietaria
- colonna `preventivi.allegati` di tipo `jsonb`
- più file insieme: foto, PDF, computo, DWG — max →10← MB l'uno
- gli allegati devono vedersi in tutti e →4← i pannelli
- il conteggio degli allegati nell'email di notifica

**Collaudo**: una richiesta di prova con →2← file, controllando che l'impresa li apra
davvero dal pannello. E che se il file è troppo grande lo dica, invece di fallire zitto.

## 2. Le prestazioni del professionista non hanno una casella nel pannello
**Dov'è**: `modifica-profilo.html`, sezione `#sec-professionista`.
Erano nel vecchio modulo di registrazione (spunte: «i clienti ti trovano cercando la
singola prestazione»), il 4 settembre la registrazione è stata accorciata e quelle
spunte sono sparite. La colonna `prestazioni` in `imprese` **esiste già**.
Da fare: rimettere le spunte in Modifica profilo, leggerle e salvarle.

## 3. Prodotti e Marchi del negozio non li mostra nessuno
Le colonne `prodotti` e `marchi` sono state aggiunte a `imprese` il 4 settembre e il
negozio le compila da `modifica-profilo.html`, ma **nessuna pagina pubblica le legge**.
Da fare: mostrarle sulla scheda pubblica `profilo-impresa.html` quando il tipo è negozio.

## 4. `pannello-negozio.html` è rimasto indietro
Due cose:
- **testata vecchia**: gli altri →3← pannelli hanno la testata nuova, il «Riposiziona»
  e le →4← carte del gestionale
- **la copertina non si carica**: scrive in `<id impresa>/banner` invece che nella
  cartella dell'`user_id`, e la regola RLS la blocca
Da fare: copiare dai pannelli buoni (regola `stessa-forma`), **riscrivendo il blocco
intero**, non con sostituzioni a pezzi.

## 5. `gestionale-config.html` è TRONCATO
Nel file ci sono →3← `<script` ma solo →2← `</script>`, non c'è `</html>`, e il codice
si interrompe a metà riga (`...eq("id",d.dataset`). L'ultimo blocco non gira.
**Non indovinare il pezzo mancante**: recuperalo dall'ultima versione buona (me lo dici
e lo recupero io dal mio Git) e poi rimetti la riga
`<script src="/js/freccia-indietro.js"></script>` prima di `</body>`, che oggi manca
solo su questa pagina.

## 6. Il tasto «📱 Mobile» dell'Anteprima non fa niente
Nei →4← pannelli: `anteprimaDevice()` usa `max-width` invece di `width`.
Aggiustare e farmi vedere la foto dell'anteprima telefono.

## 7. Cancellare una chat dal lato impresa cancella anche la copia del cliente
Nei →4← pannelli, bottone «🗑 Elimina conversazione»: fa una DELETE diretta su
`chat_messaggi`, quindi sparisce anche al cliente.
Serve: tabella `chat_nascoste` con RLS, l'elenco che salta le nascoste, e il bottone
che diventa «Togli dal mio elenco». Dettagli in `prove-claude/LAVORI-DA-FARE.md`.
È mezza giornata: non iniziarlo se ne resta meno.

## 8. Collegare la visita all'iscrizione
`visite_sito` registra ogni arrivo con un campo `sessione`, ma quando uno crea
l'account nessuno collega le due cose. Salvando la sessione (o direttamente la
provenienza) al momento del `signUp` si saprebbe **quante iscrizioni** arrivano da
ogni canale, non solo quante visite. Oggi la card «Da dove arrivano» in `admin.html`
conta solo le visite.

## 9. Le scritte troppo piccole rimaste
- il **footer** del sito è a →12,8←px su **tutte** le pagine, e dentro le →5← email
- →4← regole CSS in `profilo-impresa.html`: `.cdh` →9←px, `.cd` →12←px,
  `.cd.oggi` →11←px, `.ms-l` →10←px — **prima controlla se qualcosa le usa ancora**:
  se non le usa nessuno si buttano, se le usa qualcosa vanno portate a →13←px
Sotto i →13←px non leggo.

## 10. Il controllo colonne-fantasma è cieco e ha la lista vecchia
`prove-claude/controllo-colonne.js`:
- guarda solo le chiavi scritte dentro `.update({...})` e **non vede
  `.update(variabile)`**. In `modifica-profilo.html` l'oggetto si chiama `dati` e si
  riempie con `Object.assign`: per questo il difetto della colonna `albo` è
  sopravvissuto giorni e l'ha trovato un'iscritta vera, non il controllo.
- `prove-claude/colonne-vere.txt` è del 30 agosto e dà →15← falsi allarmi: va rifatto
  con la query che sta scritta in cima allo stesso file.

## 11. `recensioni-impresa.html` non è in nessuna sitemap
Aggiungerle.

## 12. Bandi & Opportunità, fermo su CORS da luglio
La soluzione era già stata trovata (una Netlify Function che fa da ponte), mai scritta.

## 13. I →10← utenti recuperati, mai contattati
Da luglio: →10← iscritti recuperati a mano a cui non è mai stata mandata l'email per
completare il profilo. Prima di scrivere, chiedimi il testo: le email agli iscritti le
approvo io.

---

# COSE CHE DEVO DECIDERE IO — non decidere al posto mio

Portamele quando arriviamo lì, con due foto affiancate o due numeri, non con un parere:

- **Il logo di TrovaImpresa nella barra della scheda pubblica** viene sostituito dal
  logo dell'impresa: per me il visitatore perde il riferimento. Due foto e scelgo.
- **Gli orari**: la colonna è vuota su tutte le imprese. Prima contami dal database
  quante ne hanno uno, poi le due strade: riempirla o toglierla.
- **La recensione di prova** (id →19←, scheda →36←): cancellarla o no.
- **Quanto vale un credito chat.**
- **Il cliente che aspetta da →42← giorni** una risposta a una richiesta di incarico a
  un professionista: rispondo io a mano? avviso il professionista? la propongo ad altri?
- **Il deposito del marchio** TrovaImpresa (UIBM, classi 35/37/42, ~→185←€ via SPID).
- **Il bottone del logo è solo Premium**: per un iscritto Free la voce «Logo» della
  fascia «profilo completo» non si potrà mai spuntare. Apriamo il logo a tutti e
  teniamo Premium solo la copertina?

---

# ATTIVITÀ GIÀ PROGRAMMATA — non rifarla

**11 settembre 2026, ore 9:00** gira da sola nella nuvola: «Ha funzionato la
registrazione corta?». Confronta gli iscritti di adesso con i numeri di partenza
fissati il 4 settembre (→24← iscritti in →14← giorni = →1,71← al giorno, su →1.236←
visite, cioè l'→1,9←% di chi arrivava) e mi manda il rapporto per notifica ed email.
Se stiamo lavorando insieme quel giorno, non rifare lo stesso conto a mano.

---

# COSA È STATO FATTO IL 4 SETTEMBRE — così non lo rifai

- Tutte e →4← le registrazioni portate da →4← passi a **→1← schermata con →7← caselle**
- La domanda «come ci hai conosciuto?» sulla schermata finale di tutte e →4←
- La card «🧭 Da dove arrivano» nel pannello admin (vista `arrivi_per_canale` +
  `netlify/functions/admin-arrivi.js`)
- Sistemati →2← salvataggi del profilo che erano rotti (professionista: scriveva
  `albo` invece di `numero_albo`; negozio: `nome_negozio` invece di `nome_attivita`)
- I campi tolti dalla registrazione hanno tutti una casa in `modifica-profilo.html`
- Freccia «Indietro» uguale in tutta l'area riservata (`js/freccia-indietro.js`,
  →13← pagine) — manca solo su `gestionale-config.html`, che è troncato (lavoro →5←)
- `modifica-profilo.html` rifatta: tre quarti di pagina, scritte più grandi e scure,
  la descrizione in una scheda sua
- La card del pannello si chiama «Completa il tuo profilo»
- Tolti →2← riquadri che non facevano niente (Video profilo, AI integrata)
- La fascia «profilo completo» conta anche WhatsApp, CAP e il logo (solo ai Premium)
- Banchi nuovi: `banco-registrazione.js` (→76← verdi) e `banco-fascia-profilo.js` (→15← verdi)
