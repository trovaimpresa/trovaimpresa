-- =====================================================================
-- LE SCELTE DEL CLIENTE — 26 settembre 2026 (idea presa da Buildertrend)
--
-- L'impresa mette, per un lavoro, le cose che il cliente deve scegliere
-- (piastrelle, sanitari, colori...) con due o piu' possibilita'. Il cliente
-- apre un link sul telefono, sceglie e conferma.
--
-- ⛔ IL CLIENTE NON ENTRA MAI NEL DATABASE. Passa da
--    netlify/functions/scelte-cliente.js, che riconosce il link segreto
--    (gest_scelte_link.token) e scrive col service role SOLO la scelta.
--    Qui sotto quindi nessuna regola per «anon»: niente e' leggibile senza
--    essere l'impresa.
-- ⛔ Niente colonna eliminato_il: una scelta tolta si toglie davvero.
--    Il cestino (js/cestino.js) guarda solo le tabelle che conosce, e una
--    scelta buttata nel cestino continuerebbe a vederla il cliente.
-- ✅ Eseguito su Supabase il 26 set 2026 (migrazione gest_scelte_26set2026).
-- =====================================================================

create table if not exists public.gest_scelte (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mestiere_id  uuid references public.gest_mestieri(id) on delete cascade,
  lavoro_id    uuid not null references public.gest_lavori(id) on delete cascade,
  titolo       text not null check (char_length(titolo) between 1 and 120),
  -- [{"nome":"Gres 20x120","prezzo":"compreso","foto":"<path nel bucket>"}]
  opzioni      jsonb not null default '[]'::jsonb check (jsonb_typeof(opzioni) = 'array'),
  scelta       integer check (scelta is null or scelta >= 0),
  scelta_nome  text,
  nota_cliente text check (nota_cliente is null or char_length(nota_cliente) <= 500),
  scelto_il    timestamptz,
  ordine       integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists gest_scelte_lavoro_idx on public.gest_scelte(lavoro_id);

create table if not exists public.gest_scelte_link (
  lavoro_id     uuid primary key references public.gest_lavori(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  token         text not null unique check (char_length(token) between 20 and 64),
  confermato_il timestamptz,
  aperto_il     timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.gest_scelte      enable row level security;
alter table public.gest_scelte_link enable row level security;

drop policy if exists gest_scelte_own on public.gest_scelte;
create policy gest_scelte_own on public.gest_scelte
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists gest_scelte_team_read on public.gest_scelte;
create policy gest_scelte_team_read on public.gest_scelte
  for select using (public.gest_puo_accedere(user_id));

drop policy if exists gest_scelte_link_own on public.gest_scelte_link;
create policy gest_scelte_link_own on public.gest_scelte_link
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ⛔ Il lavoro deve essere DELL'IMPRESA che scrive: senza questo un
--    iscritto potrebbe attaccare scelte (e un link) al lavoro di un altro
--    conoscendone l'id.
create or replace function public.gest_scelte_controlla_lavoro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from gest_lavori l where l.id = new.lavoro_id and l.user_id = new.user_id) then
    raise exception 'Lavoro non tuo' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.gest_scelte_controlla_lavoro() from public, anon, authenticated;
drop trigger if exists gest_scelte_lavoro_tuo on public.gest_scelte;
create trigger gest_scelte_lavoro_tuo before insert or update of lavoro_id, user_id on public.gest_scelte
  for each row execute function public.gest_scelte_controlla_lavoro();
drop trigger if exists gest_scelte_link_lavoro_tuo on public.gest_scelte_link;
create trigger gest_scelte_link_lavoro_tuo before insert or update of lavoro_id, user_id on public.gest_scelte_link
  for each row execute function public.gest_scelte_controlla_lavoro();
