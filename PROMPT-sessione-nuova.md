# Prompt per la sessione nuova — 4 settembre 2026

Sono Alex, fondatore e unico sviluppatore di TrovaImpresa (trovaimpresa.com). Leggi PRIMA
`CLAUDE.md` (soprattutto la sezione «3 SETTEMBRE 2026») e le memorie `/areas/recensioni.md`,
`/areas/profilo-pubblico.md`, `/areas/personalizza-pannello.md`, `/preferences.md`.
Regole: rispondi corto (skill `scrivi-corto`), un pannello alla volta, copia la grafica da una
pagina che esiste già (`stessa-forma`), foto di prova prima di dire «fatto» (`grafica-uguale`),
mai comandi git dalla mia cartella: mi dai il blocco `node tools/controllo-push.js && git add … && git push`.
Se non mi capisci dopo 2 giri, dammi 3-4 opzioni da scegliere invece di interpretare.

## Ieri (3 set) abbiamo fatto
- Ispettore automatico del lunedì (Cowork), email del gestionale a 89 imprese, archivio «Email inviate» in admin
- Allegati foto/PDF nella chat di assistenza (gestionale + 4 pannelli)
- Personalizza pannello a tutta pagina nei 4 pannelli
- Risposta alle recensioni (pannello → pagina pubblica `recensioni-impresa.html`), scheda con la card
  «Guarda le recensioni lasciate da altri clienti», modulo preventivo con «← Torna»

## Oggi si parte da qui (in quest'ordine)
1. **Richiesta di preventivo — allegati veri.** Oggi la foto non arriva mai (bucket `foto-lavori` accetta
   solo l'impresa, il cliente non è loggato). Fare: bucket `preventivi-allegati` (privato, anon insert su
   `preventivi/<impresa_id>/…`, select per l'impresa proprietaria), colonna `preventivi.allegati jsonb`,
   più file insieme (foto, PDF computo, progetto, DWG, max 10 MB), visibili e scaricabili nella sezione
   Preventivi dei 4 pannelli, conteggio nell'email `notifica-preventivo`.
2. **Domande guidate per tipo di lavoro** nel modulo preventivo (bagno → mq, piano, ascensore; tetto → mq,
   tipo copertura; …).
3. Mail di riepilogo al cliente con link «stato della tua richiesta»; pulsante WhatsApp dopo l'invio.
4. Nel pannello, sotto «Le tue recensioni», il tasto «Copia il link» della pagina recensioni.

Prima di toccare il preventivo: leggi `profilo-impresa.html` (sezione `#sec-preventivo`, funzione
`inviaPreventivo`), `netlify/functions/notifica-preventivo.js` e come i 4 pannelli mostrano i preventivi.
Costruisci prima nell'artigiano, mandami la foto, poi replica.

Da decidere quando me lo chiedi: cancellare o no la recensione di prova (id 19, scheda 36).
