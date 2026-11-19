-- =====================================================================
-- 19 nov 2026 — L'ACCONTO NEL PREVENTIVO
-- Richiesta di Spazio Giardino (Roma, artigiano) da «Chiedi una funzione».
-- GIA' ESEGUITO il 19 nov 2026 (da Claude, col connettore Supabase).
-- Si puo' rieseguire: non rompe niente.
--   acconto      = euro fissi
--   acconto_perc = percentuale del TOTALE per il cliente (se c'e', vince lei)
-- ⛔ La regola sta in prevAcconto() di js/gest-preventivi.js.
--    Nessun totale cambia: sono solo due righe sotto il totale.
-- =====================================================================
alter table public.gest_preventivi add column if not exists acconto numeric;
alter table public.gest_preventivi add column if not exists acconto_perc numeric;
notify pgrst, 'reload schema';
