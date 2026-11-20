-- =====================================================================
-- TrovaImpresa — IL LAVORO SVOLTO DELLA GIORNATA (20 novembre 2026)
-- Giornate: per ogni giornata (= un rapportino) il testo per il CLIENTE,
-- scritto dall'impresa o dall'AI guardando le foto prima e dopo.
-- Finisce nel PDF «Resoconto del lavoro» (js/gest-giornate-extra.js).
-- Gia' eseguito dal connettore: migrazione giornata_didascalia_20nov2026.
-- Sicuro da rilanciare. Le regole di accesso sono quelle di gest_rapportini.
-- =====================================================================
alter table public.gest_rapportini add column if not exists didascalia text;
comment on column public.gest_rapportini.didascalia is 'Il lavoro svolto nella giornata, scritto per il cliente (PDF Resoconto del lavoro). 20 nov 2026.';
