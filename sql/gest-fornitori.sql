-- =====================================================================
-- TrovaImpresa — Fornitori dell'impresa
-- Da salvare come  sql/gest-fornitori.sql
-- Incolla tutto in Supabase > SQL Editor > Run
--
-- Idea di Alessio (7 agosto 2026): l'impresa tiene qui le rivendite e i
-- negozi dove compra il materiale, con le fatture da pagare e le loro
-- scadenze. E' la meta' "soldi in uscita" che mancava al gestionale.
-- Fase 3 futura: collegare questi fornitori ai negozi iscritti a
-- TrovaImpresa (ponte marketplace).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ANAGRAFICA FORNITORI
-- ---------------------------------------------------------------------
create table if not exists public.gest_fornitori (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)           on delete cascade,
  mestiere_id uuid          references public.gest_mestieri(id) on delete cascade,

  nome        text not null,          -- "Edil Market Rossi"
  categoria   text,                   -- "Rivendita edile", "Ferramenta", ...
  telefono    text,
  email       text,
  piva        text,
  indirizzo   text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists gest_fornitori_user_idx on public.gest_fornitori (user_id, mestiere_id);

-- ---------------------------------------------------------------------
-- 2. FATTURE DA PAGARE (passive: quelle che il fornitore fa all'impresa)
--    Se si elimina il fornitore, vanno via anche le sue fatture (cascade,
--    la conferma nell'app lo dice chiaro). Il lavoro collegato e'
--    facoltativo: se il lavoro viene eliminato, la fattura resta.
-- ---------------------------------------------------------------------
create table if not exists public.gest_fatture_fornitori (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)             on delete cascade,
  mestiere_id  uuid          references public.gest_mestieri(id)   on delete cascade,
  fornitore_id uuid not null references public.gest_fornitori(id)  on delete cascade,
  lavoro_id    uuid          references public.gest_lavori(id)     on delete set null,

  numero       text,                                  -- "124/2026"
  data         date,                                  -- data della fattura
  importo      numeric(12,2) not null default 0,
  scadenza     date,                                  -- da pagare entro
  stato        text not null default 'da_pagare',
  data_pagata  date,
  note         text,
  created_at   timestamptz not null default now(),

  constraint gest_fatt_forn_stato_ok check (stato in ('da_pagare','pagata'))
);

create index if not exists gest_fatt_forn_user_idx on public.gest_fatture_fornitori (user_id, mestiere_id);
create index if not exists gest_fatt_forn_forn_idx on public.gest_fatture_fornitori (fornitore_id);

-- ---------------------------------------------------------------------
-- 3. RLS — solo il titolare (i collaboratori non vedono i conti coi fornitori)
-- ---------------------------------------------------------------------
alter table public.gest_fornitori          enable row level security;
alter table public.gest_fatture_fornitori  enable row level security;

drop policy if exists "gest_fornitori_own" on public.gest_fornitori;
create policy "gest_fornitori_own" on public.gest_fornitori
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gest_fatt_forn_own" on public.gest_fatture_fornitori;
create policy "gest_fatt_forn_own" on public.gest_fatture_fornitori
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- VERIFICA
-- ---------------------------------------------------------------------
-- select count(*) from public.gest_fornitori;          -- deve dare 0
-- select count(*) from public.gest_fatture_fornitori;  -- deve dare 0
