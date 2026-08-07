-- =====================================================================
-- TrovaImpresa — Fornitori 2.0: documenti + collegamento marketplace
-- Da salvare come  sql/gest-fornitori-plus.sql
-- Incolla tutto in Supabase > SQL Editor > Run
-- Richiede: sql/gest-fornitori.sql già eseguito.
--
-- 1. Il fornitore può essere COLLEGATO a un negozio iscritto a TrovaImpresa
--    (inizio del ponte marketplace: in futuro i suoi preventivi arriveranno
--    direttamente qui).
-- 2. Documenti allegati al fornitore (listini, contratti, fatture in PDF):
--    stessa tabella gest_foto usata per i documenti del cliente.
-- =====================================================================

-- NOTA: imprese.id è BIGINT (numero), non uuid come le tabelle gest_*.
alter table public.gest_fornitori
  add column if not exists trovaimpresa_id bigint references public.imprese(id) on delete set null;

alter table public.gest_foto
  add column if not exists fornitore_id uuid references public.gest_fornitori(id) on delete cascade;

create index if not exists gest_foto_fornitore_idx on public.gest_foto (fornitore_id);

-- VERIFICA
-- select trovaimpresa_id from public.gest_fornitori limit 1;  -- colonna ok
-- select fornitore_id   from public.gest_foto      limit 1;  -- colonna ok
