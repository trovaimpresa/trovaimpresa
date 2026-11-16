-- =====================================================================
-- TrovaImpresa — IL NOME DEL TECNICO CHE FIRMA IL COMPUTO
-- 16 nov 2026. Sicuro da rilanciare.
--
-- Una casella nei Dati azienda, solo per lo studio tecnico:
--   tecnico_firma -> «Geom. Mario Rossi»
-- Esce in fondo al PDF del computo metrico, sotto «IL TECNICO», sopra la
-- riga di timbro e firma. Vuota: esce il nome dello studio.
-- =====================================================================
alter table if exists public.gest_azienda
  add column if not exists tecnico_firma text;

comment on column public.gest_azienda.tecnico_firma is
  'Studio tecnico: nome e titolo di chi firma il computo metrico (es. Geom. Mario Rossi).';
