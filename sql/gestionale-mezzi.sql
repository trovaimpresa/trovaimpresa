-- =====================================================================
-- TrovaImpresa — Mezzi e attrezzature
-- Da salvare come  sql/gestionale-mezzi.sql
-- Incolla tutto in Supabase > SQL Editor > Run
--
-- Scelte progettuali:
-- 1. Le scadenze (revisione, bollo, assicurazione, tagliando) NON sono
--    colonne di gest_mezzi: si agganciano a gest_scadenze con mezzo_id.
--    Cosi' riusano la logica "scaduta / in scadenza" gia' esistente.
-- 2. Un lavoro puo' usare piu' mezzi -> tabella ponte gest_lavoro_mezzi.
-- 3. Policy collaboratori inclusa da subito (lezione di gest_scadenze).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ANAGRAFICA MEZZI E ATTREZZATURE
-- ---------------------------------------------------------------------
create table if not exists public.gest_mezzi (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)          on delete cascade,
  mestiere_id  uuid          references public.gest_mestieri(id) on delete cascade,

  nome         text not null,               -- "Furgone Ducato", "Piattaforma 20mt"
  categoria    text not null default 'mezzo',  -- 'mezzo' | 'attrezzatura'
  targa        text,                        -- targa o matricola
  stato        text not null default 'disponibile',
                                            -- 'disponibile' | 'in_uso' | 'manutenzione' | 'fuori_uso'
  note         text,
  created_at   timestamptz not null default now(),

  constraint gest_mezzi_categoria_ok
    check (categoria in ('mezzo', 'attrezzatura')),
  constraint gest_mezzi_stato_ok
    check (stato in ('disponibile', 'in_uso', 'manutenzione', 'fuori_uso'))
);

create index if not exists gest_mezzi_user_idx     on public.gest_mezzi (user_id);
create index if not exists gest_mezzi_mestiere_idx on public.gest_mezzi (mestiere_id);

-- ---------------------------------------------------------------------
-- 2. SCADENZE COLLEGATE AL MEZZO
--    Aggiunge solo la colonna: la tabella e la logica sono le tue.
-- ---------------------------------------------------------------------
alter table public.gest_scadenze
  add column if not exists mezzo_id uuid references public.gest_mezzi(id) on delete cascade;

create index if not exists gest_scadenze_mezzo_idx on public.gest_scadenze (mezzo_id);

-- ---------------------------------------------------------------------
-- 3. QUALI MEZZI SU QUALE LAVORO (tabella ponte)
--    Salvata separatamente dopo saveJob, come si fa per le spese.
-- ---------------------------------------------------------------------
create table if not exists public.gest_lavoro_mezzi (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id)         on delete cascade,
  lavoro_id  uuid not null references public.gest_lavori(id) on delete cascade,
  mezzo_id   uuid not null references public.gest_mezzi(id)  on delete cascade,
  created_at timestamptz not null default now(),

  -- lo stesso mezzo non puo' essere aggiunto due volte allo stesso lavoro
  unique (lavoro_id, mezzo_id)
);

create index if not exists gest_lavoro_mezzi_lavoro_idx on public.gest_lavoro_mezzi (lavoro_id);
create index if not exists gest_lavoro_mezzi_mezzo_idx  on public.gest_lavoro_mezzi (mezzo_id);

-- ---------------------------------------------------------------------
-- 4. RLS — pattern standard del progetto
-- ---------------------------------------------------------------------
alter table public.gest_mezzi        enable row level security;
alter table public.gest_lavoro_mezzi enable row level security;

-- Il titolare: pieno controllo sui propri mezzi
drop policy if exists "gest_mezzi_own" on public.gest_mezzi;
create policy "gest_mezzi_own" on public.gest_mezzi
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gest_lavoro_mezzi_own" on public.gest_lavoro_mezzi;
create policy "gest_lavoro_mezzi_own" on public.gest_lavoro_mezzi
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- I collaboratori attivi: SOLA LETTURA.
-- Serve perche' l'operaio in cantiere deve vedere quali mezzi gli
-- sono stati assegnati, ma non deve poter modificare l'anagrafica.
-- Senza questa policy la sezione risulta vuota per la squadra:
-- e' esattamente il problema gia' capitato con gest_scadenze.
drop policy if exists "gest_mezzi_team_read" on public.gest_mezzi;
create policy "gest_mezzi_team_read" on public.gest_mezzi
  for select using (
    exists (
      select 1 from public.gest_membri m
      where m.membro_id  = auth.uid()
        and m.impresa_id = gest_mezzi.user_id
        and m.stato      = 'attivo'
    )
  );

drop policy if exists "gest_lavoro_mezzi_team_read" on public.gest_lavoro_mezzi;
create policy "gest_lavoro_mezzi_team_read" on public.gest_lavoro_mezzi
  for select using (
    exists (
      select 1 from public.gest_membri m
      where m.membro_id  = auth.uid()
        and m.impresa_id = gest_lavoro_mezzi.user_id
        and m.stato      = 'attivo'
    )
  );

-- ---------------------------------------------------------------------
-- 5. VISTA: mezzi con la prossima scadenza
--    Serve alla card del mezzo per mostrare "Revisione tra 12 giorni".
-- ---------------------------------------------------------------------
create or replace view public.gest_mezzi_scadenze as
select
  m.id                                     as mezzo_id,
  m.user_id,
  m.mestiere_id,
  m.nome,
  m.categoria,
  m.targa,
  m.stato,
  min(s.data_scadenza) filter (where s.stato = 'aperta') as prossima_scadenza,
  count(s.id) filter (
    where s.stato = 'aperta' and s.data_scadenza < current_date
  )                                        as scadenze_scadute,
  count(s.id) filter (
    where s.stato = 'aperta'
      and s.data_scadenza >= current_date
      and s.data_scadenza <= current_date + interval '30 days'
  )                                        as scadenze_vicine
from public.gest_mezzi m
left join public.gest_scadenze s on s.mezzo_id = m.id
group by m.id, m.user_id, m.mestiere_id, m.nome, m.categoria, m.targa, m.stato;

-- La vista eredita la RLS delle tabelle sottostanti solo con
-- security_invoker: senza, mostrerebbe i mezzi di tutti.
alter view public.gest_mezzi_scadenze set (security_invoker = true);

-- ---------------------------------------------------------------------
-- 6. VERIFICA
-- ---------------------------------------------------------------------
-- select count(*) from public.gest_mezzi;              -- deve dare 0
-- select count(*) from public.gest_lavoro_mezzi;       -- deve dare 0
-- select mezzo_id from public.gest_scadenze limit 1;   -- colonna esiste
