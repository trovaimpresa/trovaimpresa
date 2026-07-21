-- ============================================================
-- UPGRADE GESTIONALE ARTIGIANI/IMPRESE — TrovaImpresa
-- Incolla tutto in Supabase > SQL Editor > Run
-- Crea: gest_spese (costi cantiere), gest_preventivi, gest_preventivo_righe
-- ============================================================

-- 1) SPESE / MATERIALI per lavoro (costi cantiere)
create table if not exists gest_spese (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lavoro_id uuid not null references gest_lavori(id) on delete cascade,
  descrizione text not null,
  importo numeric not null default 0,
  data date default current_date,
  created_at timestamptz default now()
);
alter table gest_spese enable row level security;
drop policy if exists "gest_spese_own" on gest_spese;
create policy "gest_spese_own" on gest_spese
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_gest_spese_lavoro on gest_spese(lavoro_id);
create index if not exists idx_gest_spese_user on gest_spese(user_id);

-- 2) PREVENTIVI
create table if not exists gest_preventivi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mestiere_id uuid references gest_mestieri(id) on delete cascade,
  cliente_id uuid references gest_clienti(id) on delete set null,
  lavoro_id uuid references gest_lavori(id) on delete set null,
  numero int not null default 1,
  titolo text not null,
  note text,
  stato text not null default 'bozza', -- bozza | inviato | accettato | rifiutato
  data date default current_date,
  created_at timestamptz default now()
);
alter table gest_preventivi enable row level security;
drop policy if exists "gest_preventivi_own" on gest_preventivi;
create policy "gest_preventivi_own" on gest_preventivi
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_gest_prev_user on gest_preventivi(user_id, mestiere_id);

-- 3) RIGHE PREVENTIVO
create table if not exists gest_preventivo_righe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preventivo_id uuid not null references gest_preventivi(id) on delete cascade,
  descrizione text not null,
  qta numeric not null default 1,
  prezzo numeric not null default 0,
  ordine int default 0
);
alter table gest_preventivo_righe enable row level security;
drop policy if exists "gest_prev_righe_own" on gest_preventivo_righe;
create policy "gest_prev_righe_own" on gest_preventivo_righe
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_gest_prev_righe on gest_preventivo_righe(preventivo_id);
