-- =====================================================================
-- LA SCHEDA PUBBLICA SI PUO' SPEGNERE — 15 settembre 2026
-- migrazione applicata su Supabase con il nome `vetrina_attiva_15set2026`
--
-- ⛔ IL DIFETTO CHE CHIUDE: da oggi si entra anche dalla porta del
-- gestionale (registrazione-*.html?da=gestionale). Chi entra da li' non
-- scrive ne' mestiere ne' citta': non vuole clienti, vuole un programma.
-- Se la sua scheda finiva lo stesso nelle ricerche, il cliente trovava
-- una scheda vuota. Una scheda vuota fa male a lui E al sito.
--
-- La soluzione: una colonna sola, `imprese.vetrina_attiva`.
--   - true  = la scheda esce nelle ricerche (e' il valore di sempre)
--   - false = la scheda non esce, ma l'account e il gestionale sono interi
--
-- ⚠️ DEFAULT true. Le 132 imprese che c'erano gia' non si toccano:
-- prima 103 visibili, dopo 103 visibili. Verificato dentro una
-- transazione annullata (begin; ... rollback;) prima di applicare.
--
-- L'interruttore per riaccenderla sta nei tre pannelli, in coda alla
-- pagina (blocco «INTERRUTTORE DELLA SCHEDA PUBBLICA»). Senza quello
-- la porta del gestionale sarebbe una gabbia.
-- =====================================================================


-- 1) la colonna -------------------------------------------------------
alter table public.imprese
  add column if not exists vetrina_attiva boolean not null default true;

comment on column public.imprese.vetrina_attiva is
  'false = la scheda non esce nelle ricerche. La mettono a false solo le '
  'iscrizioni fatte dalla porta del gestionale (?da=gestionale). '
  'Si riaccende dal pannello, card «Scheda pubblica».';


-- 2) la vista pubblica ------------------------------------------------
-- ⚠️ COALESCE e non `= true` secco: se un giorno la colonna tornasse
-- null per un qualsiasi motivo, la scheda deve restare VISIBILE, non
-- sparire. Il difetto che fa sparire le schede e' peggio di quello che
-- ne mostra una di troppo.
--
-- NOTA: qui sotto c'e' solo il pezzo che cambia. La vista vera elenca
-- tutte le colonne una per una; e' stata ricreata con
-- `create or replace view` tenendo l'elenco identico e aggiungendo in
-- fondo al WHERE la terza condizione:
--
--   WHERE COALESCE(is_test, false) = false
--     AND COALESCE(email_confermata, false) = true
--     AND COALESCE(vetrina_attiva, true) = true;    <-- nuova


-- 3) il trigger che crea il profilo alla registrazione ----------------
-- `crea_profilo_impresa()` legge i dati che il modulo di iscrizione
-- mette in `raw_user_meta_data`. Adesso legge anche `vetrina_attiva`.
--
-- ⚠️ NON si usa il cast `::boolean`: i metadati arrivano come testo e
-- una stringa storta (vuota, 'si', 'x') farebbe saltare tutta la
-- registrazione con un errore di conversione. Si confronta il testo:
--
--   (lower(coalesce(new.raw_user_meta_data->>'vetrina_attiva','')) <> 'false')
--
-- Cosi' l'unico modo di nascere spenti e' scrivere esattamente 'false'.
-- Tutto il resto — metadato assente, vuoto, sbagliato — nasce ACCESO,
-- che e' il comportamento di sempre.
--
-- Provato davvero, con tre finti utenti dentro una transazione annullata:
--   marketplace ('true')  -> ACCESA
--   gestionale  ('false') -> SPENTA
--   valore storto ('x')   -> ACCESA
-- Dopo il rollback: 0 account di prova rimasti.


-- 4) controlli da rifare se si tocca questa roba ----------------------
-- begin;
--   select count(*) from public.imprese;                  -- 132
--   select count(*) from public.imprese_pubbliche;        -- 103
--   update public.imprese set vetrina_attiva = false
--    where id = (select id from public.imprese_pubbliche limit 1);
--   select count(*) from public.imprese_pubbliche;        -- 102
-- rollback;
