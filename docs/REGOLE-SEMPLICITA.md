# REGOLE DELLA SEMPLICITÀ — il gestionale

Nate dal collaudo del 7 novembre 2026 (`docs/COLLAUDO-SEMPLICITA.md`).
**Ogni modifica futura al gestionale si controlla con queste regole.**
Si aggiungono man mano che vengono decise con Alex: qui sotto solo quelle già
ferme prima di cominciare.

## Già decise
1. Per chi è: un artigiano di 55 anni, poco pratico, da computer (1920) e da
   telefono (380 px). Se ci riesce da solo, senza spiegazioni, va bene.
2. Testo mai sotto i 13 px; tutto grande e ben leggibile sul 1920.
3. Colore = stato: rosso solo problemi veri, ambra attesa, verde fatto, blu in corso.
4. Una formula dei soldi sta in UN posto solo. Lo stesso numero è uguale
   ovunque: schermo, riepilogo, PDF, email, Chat AI, vista `gest_fatture_totali`.
5. Finestre: sempre `openSheetGrande()` a due colonne.
6. Niente spiegazioni addosso a cose che si capiscono da sole.
7. Niente si cancella: si sposta (menu «...», «Tutto il resto»).

## Decise il 7 nov 2026 (schermata dei reparti + Assistente)
8. **Una colonna sola, misurata.** Nella schermata dei reparti tutto sta in
   1000 px (sul 1920: da 452 a 1452 px). Niente blocchi con larghezze loro.
9. **La cosa principale viene prima.** Quello che si usa ogni volta (i reparti)
   sta in alto; il resto (crediti AI, note) sotto. Si sposta, non si cancella.
10. **Un pulsante, un nome.** Lo stesso pulsante si chiama uguale dappertutto
    (fuori, dentro, nel menu del telefono). Niente «Backup»: «Salva una copia
    dei dati». Niente «Esporta»: «Scarica per Excel».
11. **Pulsanti sul telefono alti almeno 44 px.**
12. **Pallini a tre colori, sempre col perché.** Rosso = scaduto, in ritardo,
    in perdita. Ambra = in attesa (preventivo fermo, bozza da mandare,
    richiesta da leggere, scadenza entro 7 giorni). Verde = a posto. Sotto un
    pallino rosso o ambra non si scrive mai «Niente da segnalare»: si scrive il
    perché.
13. **Un'azione, un posto.** Le scorciatoie stanno tutte insieme; niente
    pulsanti da soli in mezzo alla pagina.
14. **Ogni scheda ha un solo «Apri».** Le altre azioni stanno dentro, in alto
    (la prima in blu). Sul telefono, se una scheda ha più pulsanti, vanno sotto
    il testo, mai in una colonna a destra che schiaccia il nome.
15. **Blu = in corso.** Un mezzo fuori, un lavoro avviato: non è un problema,
    non è rosso.
16. **Lo stesso numero è uguale in tutte le schermate.** Se due schermate
    contano la stessa cosa (scadute, da incassare, cauzioni, bolli) usano la
    stessa regola; se contano cose diverse lo scrivono («qui nel gestionale e
    del Noleggio»). I noleggi ai tuoi reparti non si incassano e non si
    fatturano, in nessuna schermata.
17. **Le scritte che vendono si verificano coi conti.** «Il più conveniente»
    solo se costa davvero meno degli altri.
18. **Niente scritte sotto i 14 px, testi a 16.** Le etichette piccole
    (stato) a 14, tutto il resto almeno 16. Niente tagliato con «…» sul
    telefono: va a capo.
19. **Uno zero è grigio.** Né verde né rosso, e senza segno.

## Da decidere durante il lavoro
- misure (testo, pulsanti, margini) — si misurano sulla prima sezione e valgono per tutte
- dove sta il pulsante principale
- quanti clic al massimo per le cose di tutti i giorni
- l'elenco delle parole vietate e delle parole giuste
