-- =====================================================================
-- TrovaImpresa — L'ALBO E IL NUMERO DI ISCRIZIONE DELLO STUDIO TECNICO
-- 13 nov 2026 (lista «MANCA», voce 17). Sicuro da rilanciare.
--
-- Due caselle nei Dati azienda, solo per lo studio tecnico:
--   albo_nome   -> «Ordine degli Ingegneri della Provincia di Rieti»
--   albo_numero -> «A1234»
-- Escono in una riga sola (azAlbo in js/gest-azienda.js) nella parcella,
-- nella lettera d'incarico, nella fattura e nella scheda della pratica.
-- Facoltative: impresa e artigiano non le vedono.
-- =====================================================================
alter table if exists public.gest_azienda
  add column if not exists albo_nome   text,
  add column if not exists albo_numero text;

comment on column public.gest_azienda.albo_nome is
  'Studio tecnico: albo o Ordine di iscrizione (es. Ordine degli Ingegneri di Rieti).';
comment on column public.gest_azienda.albo_numero is
  'Studio tecnico: numero di iscrizione all''albo.';
