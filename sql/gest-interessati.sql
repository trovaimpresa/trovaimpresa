-- ============================================================
-- TrovaImpresa — Lista "Avvisami quando il gestionale e' pronto"
-- Da eseguire una volta sola su Supabase (SQL Editor).
-- ============================================================

create table if not exists public.gest_interessati (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  email      text,
  avvisato   boolean not null default false,   -- lo metti a true quando gli hai scritto
  created_at timestamptz not null default now()
);

alter table public.gest_interessati enable row level security;

-- Ognuno puo' iscriversi e rivedere solo la propria riga.
-- Tu la leggi tutta dalla pagina admin (service_role).
drop policy if exists "gest_interessati insert proprio" on public.gest_interessati;
create policy "gest_interessati insert proprio" on public.gest_interessati
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "gest_interessati update proprio" on public.gest_interessati;
create policy "gest_interessati update proprio" on public.gest_interessati
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "gest_interessati select proprio" on public.gest_interessati;
create policy "gest_interessati select proprio" on public.gest_interessati
  for select to authenticated
  using (auth.uid() = user_id);

-- Chi ha chiesto di essere avvisato, con i dati dell'impresa.
create or replace view public.gest_interessati_lista as
select
  gi.id,
  gi.user_id,
  coalesce(i.nome_attivita, i.nome, 'Senza nome') as nome_attivita,
  coalesce(gi.email, i.email)                     as email,
  i.tipo,
  i.citta,
  i.piano,
  gi.avvisato,
  gi.created_at
from public.gest_interessati gi
left join public.imprese i on i.user_id = gi.user_id
order by gi.created_at desc;

revoke all on public.gest_interessati_lista from anon, authenticated;
