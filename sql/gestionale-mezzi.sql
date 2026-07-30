-- ============================================================
-- TrovaImpresa — GESTIONALE: sezione MEZZI E ATTREZZATURE
--
-- Crea:
--   1. gest_mezzi          -> anagrafica mezzi/attrezzature (per reparto)
--   2. gest_lavoro_mezzi   -> quali mezzi sono stati usati su un lavoro
--   3. gest_scadenze.mezzo_id -> collega una scadenza a un mezzo
--   4. gest_mezzi_scadenze -> vista di riepilogo scadenze per mezzo
--
-- Stesso modello di gest_clienti: isolamento user_id + mestiere_id,
-- RLS "owner_all" come sql/rls-batch1-gestionale.sql.
--
-- Eseguire nell'SQL Editor di Supabase. E' idempotente: si puo'
-- rieseguire senza rompere niente.
-- ============================================================


-- ---------- 1. ANAGRAFICA MEZZI ----------

create table if not exists public.gest_mezzi (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mestiere_id uuid references public.gest_mestieri(id) on delete cascade,
  nome        text not null,
  categoria   text not null default 'mezzo',
  targa       text,
  stato       text not null default 'disponibile',
  note        text,
  created_at  timestamptz not null default now()
);

-- categoria: mezzo | attrezzatura
alter table public.gest_mezzi drop constraint if exists gest_mezzi_categoria_chk;
alter table public.gest_mezzi add constraint gest_mezzi_categoria_chk
  check (categoria in ('mezzo','attrezzatura'));

-- stato: disponibile | in_uso | manutenzione | fuori_uso
alter table public.gest_mezzi drop constraint if exists gest_mezzi_stato_chk;
alter table public.gest_mezzi add constraint gest_mezzi_stato_chk
  check (stato in ('disponibile','in_uso','manutenzione','fuori_uso'));

create index if not exists gest_mezzi_user_idx     on public.gest_mezzi(user_id);
create index if not exists gest_mezzi_mestiere_idx on public.gest_mezzi(mestiere_id);

alter table public.gest_mezzi enable row level security;
drop policy if exists "owner_all" on public.gest_mezzi;
create policy "owner_all" on public.gest_mezzi
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ---------- 2. MEZZI USATI SU UN LAVORO ----------

create table if not exists public.gest_lavoro_mezzi (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  lavoro_id  uuid not null references public.gest_lavori(id) on delete cascade,
  mezzo_id   uuid not null references public.gest_mezzi(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- lo stesso mezzo non si aggiunge due volte allo stesso lavoro
create unique index if not exists gest_lavoro_mezzi_uniq
  on public.gest_lavoro_mezzi(lavoro_id, mezzo_id);
create index if not exists gest_lavoro_mezzi_mezzo_idx on public.gest_lavoro_mezzi(mezzo_id);

alter table public.gest_lavoro_mezzi enable row level security;
drop policy if exists "owner_all" on public.gest_lavoro_mezzi;
create policy "owner_all" on public.gest_lavoro_mezzi
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ---------- 3. SCADENZE COLLEGATE A UN MEZZO ----------
-- Revisione, bollo, tagliando, assicurazione... vivono nello scadenzario
-- che gia' c'e': basta il riferimento al mezzo (facoltativo).

alter table public.gest_scadenze
  add column if not exists mezzo_id uuid references public.gest_mezzi(id) on delete set null;

create index if not exists gest_scadenze_mezzo_idx on public.gest_scadenze(mezzo_id);


-- ---------- 4. VISTA RIEPILOGO SCADENZE PER MEZZO ----------
-- Una riga per mezzo. La card del mezzo legge da qui per scrivere
-- "Revisione tra 12 giorni" oppure "2 scadenze scadute".
--
-- security_invoker = true: la vista applica l'RLS di chi interroga,
-- altrimenti mostrerebbe i mezzi di tutti.

drop view if exists public.gest_mezzi_scadenze;
create view public.gest_mezzi_scadenze
with (security_invoker = true) as
select
  m.id          as mezzo_id,
  m.user_id     as user_id,
  m.mestiere_id as mestiere_id,
  count(s.id) filter (
    where s.stato is distinct from 'fatta'
  )::int as aperte,
  count(s.id) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza < current_date
  )::int as scadute,
  min(s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ) as prossima_data,
  (array_agg(s.titolo order by s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ))[1] as prossimo_titolo,
  (array_agg(s.tipo_pratica order by s.data_scadenza) filter (
    where s.stato is distinct from 'fatta' and s.data_scadenza >= current_date
  ))[1] as prossimo_tipo
from public.gest_mezzi m
left join public.gest_scadenze s
  on s.mezzo_id = m.id and s.user_id = m.user_id
group by m.id, m.user_id, m.mestiere_id;

grant select on public.gest_mezzi_scadenze to authenticated;
