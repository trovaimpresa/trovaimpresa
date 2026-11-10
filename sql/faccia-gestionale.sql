-- 10 nov 2026 — «Sei anche un professionista?» su tutti i dispositivi.
-- Prima la scelta stava solo nel telefono (localStorage). Adesso sta qui:
--   null            = il gestionale del suo tipo (impresa o artigiano)
--   'professionista' = la faccia dello studio tecnico
-- Il tipo vero (imprese.tipo) NON cambia. La scrive il proprietario
-- (regola imprese_update_owner); imprese_blocca_piano non la tocca.
-- Gia' eseguito su Supabase (migrazione faccia_gestionale_10nov2026).
alter table public.imprese add column if not exists faccia_gestionale text;
alter table public.imprese drop constraint if exists imprese_faccia_gestionale_ck;
alter table public.imprese add constraint imprese_faccia_gestionale_ck
  check (faccia_gestionale is null or faccia_gestionale = 'professionista');
