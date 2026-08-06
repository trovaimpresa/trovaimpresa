-- =====================================================================
-- TrovaImpresa — Note del giorno sul calendario
-- Da salvare come  sql/gest-note.sql
-- Incolla tutto in Supabase > SQL Editor > Run
--
-- Prima le note del calendario vivevano solo nel browser (localStorage):
-- cambiavi dispositivo o svuotavi la cronologia e sparivano per sempre.
-- Ora stanno su Supabase come tutto il resto. Il gestionale sposta da solo
-- le vecchie note del browser al primo avvio dopo questa migrazione.
-- =====================================================================

create table if not exists public.gest_note (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)           on delete cascade,
  mestiere_id uuid not null references public.gest_mestieri(id) on delete cascade,
  data        date not null,
  testo       text not null,
  created_at  timestamptz not null default now(),

  -- una nota sola per giorno per reparto: il salvataggio fa upsert su questa
  unique (user_id, mestiere_id, data)
);

create index if not exists gest_note_user_idx on public.gest_note (user_id, mestiere_id);

-- ---------------------------------------------------------------------
-- RLS — pattern standard del progetto
-- ---------------------------------------------------------------------
alter table public.gest_note enable row level security;

-- Il titolare: pieno controllo sulle proprie note
drop policy if exists "gest_note_own" on public.gest_note;
create policy "gest_note_own" on public.gest_note
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- I collaboratori attivi: SOLA LETTURA, come per mezzi e scadenze
drop policy if exists "gest_note_team_read" on public.gest_note;
create policy "gest_note_team_read" on public.gest_note
  for select using (
    exists (
      select 1 from public.gest_membri m
      where m.membro_id  = auth.uid()
        and m.impresa_id = gest_note.user_id
        and m.stato      = 'attivo'
    )
  );

-- ---------------------------------------------------------------------
-- VERIFICA
-- ---------------------------------------------------------------------
-- select count(*) from public.gest_note;   -- deve dare 0
