# Backlog

Vuoto. I lavori aperti stanno tutti in `LAVORI-APERTI.md`, che e' l'unico
quaderno: questo file resta solo perche' qualche vecchia nota lo cita.

⛔ 5 settembre 2026 — CHIUSA l'unica voce che c'era, «Bug binario piano
free/pro su 5 pannelli imprese» (aperta il 25 aprile 2026: «il codice assume
solo Free/Pro, gli utenti Premium appaiono come Free»).
Perche' si chiude senza fare niente:
- il piano **Pro non esiste piu'** nel listino;
- nella tabella `imprese` la colonna `piano` ha **un solo valore su tutte e
  →116← le righe: `premium`**. Non esiste nessun Free e nessun Pro da
  confondere;
- nei →4← pannelli non c'e' **nessun** confronto con `'pro'` (cercato), e
  `inizializza()` fa gia' il contrario di quello che diceva la voce: porta
  `mensile` e `annuale` dentro `premium` prima di decidere.
Era una voce vecchia di →4← mesi che descriveva un mondo che non c'e' piu'.
