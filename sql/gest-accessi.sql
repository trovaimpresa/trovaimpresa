-- ============================================================
-- TrovaImpresa — Tracciamento utilizzo del gestionale
-- Da eseguire una volta sola su Supabase (SQL Editor).
-- Serve a sapere CHI apre il gestionale e QUANTO SPESSO.
-- ============================================================

-- 1) Tabella degli accessi
create table if not exists public.gest_accessi (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text,
  pagina      text,
  ha_accesso  boolean default true,   -- false = ha aperto ma ha trovato il paywall
  created_at  timestamptz not null default now()
);

create index if not exists gest_accessi_user_idx on public.gest_accessi(user_id);
create index if not exists gest_accessi_data_idx on public.gest_accessi(created_at desc);

-- 2) RLS: ognuno scrive e legge solo le proprie righe.
--    Tu (admin) leggerai tramite la Netlify function con service_role.
alter table public.gest_accessi enable row level security;

drop policy if exists "gest_accessi insert proprio" on public.gest_accessi;
create policy "gest_accessi insert proprio" on public.gest_accessi
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "gest_accessi select proprio" on public.gest_accessi;
create policy "gest_accessi select proprio" on public.gest_accessi
  for select to authenticated
  using (auth.uid() = user_id);

-- 3) Vista riepilogo: una riga per impresa, con ultimo accesso e conteggi.
--    Non ha grant per anon: la legge solo il service_role dalla function admin.
create or replace view public.gest_accessi_riepilogo as
select
  i.id                as impresa_id,
  i.user_id           as user_id,
  i.nome_attivita     as nome_attivita,
  i.nome              as nome,
  i.email             as email,
  i.tipo              as tipo,
  i.citta             as citta,
  i.piano             as piano,
  i.gestionale_attivo as gestionale_attivo,
  max(a.created_at)   as ultimo_accesso,
  count(a.id) filter (where a.created_at > now() - interval '7 days')  as accessi_7gg,
  count(a.id) filter (where a.created_at > now() - interval '30 days') as accessi_30gg,
  count(a.id)                                                          as accessi_totali
from public.imprese i
left join public.gest_accessi a on a.user_id = i.user_id
group by i.id, i.user_id, i.nome_attivita, i.nome, i.email, i.tipo, i.citta, i.piano, i.gestionale_attivo;

revoke all on public.gest_accessi_riepilogo from anon, authenticated;
