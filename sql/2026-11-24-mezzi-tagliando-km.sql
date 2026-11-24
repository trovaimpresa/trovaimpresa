-- ============================================================
-- IL TAGLIANDO A KM DEI MEZZI — 24 novembre 2026
-- «Si fa ogni N km» e «ultimo fatto a N km». Il prossimo e'
-- ultimo + ogni; i km di adesso sono gest_mezzi.km_attuali, che
-- si aggiornano da soli con le uscite e i rientri
-- (sql/2026-11-24-mezzi-uscite.sql).
-- Avvisa quando mancano 1.000 km o meno: scheda del mezzo,
-- Assistente («Parti da qui») ed email del lunedi'.
-- Additivo: vuoto = nessun tagliando seguito, come prima.
-- ============================================================
alter table public.gest_mezzi add column if not exists tagliando_ogni_km   numeric;
alter table public.gest_mezzi add column if not exists tagliando_ultimo_km numeric;
