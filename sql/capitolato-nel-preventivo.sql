-- =====================================================================
-- 16 ottobre 2026 — IL CAPITOLATO STA DENTRO IL PREVENTIVO
-- Una colonna sola, nessuna tabella nuova: il capitolato segue il preventivo
-- (Cestino, ripristino, eliminazione) senza toccare gli elenchi del cestino
-- e dei reparti. Formato:
--   {voci:[{titolo,cosa,materiali,compreso,escluso}], dove, inizio, durata,
--    pagamenti, garanzie, note, aggiornato}
-- GIA' ESEGUITO su Supabase il 16 ott 2026 (verificato: jsonb, 1 riga in
-- information_schema). Rieseguirlo non fa danni.
-- =====================================================================
alter table public.gest_preventivi add column if not exists capitolato jsonb;
comment on column public.gest_preventivi.capitolato is 'Capitolato del preventivo: {voci:[{titolo,cosa,materiali,compreso,escluso}], dove, inizio, durata, pagamenti, garanzie, note, aggiornato}. Una colonna sola: il capitolato segue il preventivo (cestino, copie, eliminazione) senza una tabella a parte.';
