-- =====================================================================
-- TrovaImpresa — Fornitore sulle spese dei lavori (Fornitori, Fase 2)
-- Da salvare come  sql/gest-spese-fornitore.sql
-- Incolla tutto in Supabase > SQL Editor > Run
-- Richiede: sql/gest-fornitori.sql già eseguito (Fase 1).
--
-- Aggiunge solo una colonna: ogni spesa di un lavoro può dire da quale
-- fornitore viene. Così si ottiene "quanto ho speso da ogni fornitore
-- quest'anno" e "quanto materiale è andato su quel cantiere".
-- Se il fornitore viene eliminato, la spesa resta (set null).
-- =====================================================================

alter table public.gest_spese
  add column if not exists fornitore_id uuid references public.gest_fornitori(id) on delete set null;

create index if not exists gest_spese_fornitore_idx on public.gest_spese (fornitore_id);

-- VERIFICA
-- select fornitore_id from public.gest_spese limit 1;   -- la colonna esiste
