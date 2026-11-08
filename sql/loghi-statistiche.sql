-- 8 nov 2026 — I NUMERI DEI LOGHI IN PROVA
-- I loghi gratis (fino al 4 feb 2027) si vedono e si cliccano, ma nessuno li
-- contava. Una riga per impresa per giorno: quante volte il logo e' stato
-- visto e quante cliccato. A fine prova servono per la mail «il tuo logo e'
-- stato visto N volte».
-- Scrive SOLO la funzione conta_logo (security definer): il browser non
-- tocca la tabella. Legge il proprietario dell'impresa e il fondatore.

create table if not exists public.loghi_statistiche (
  impresa_id bigint not null references public.imprese(id) on delete cascade,
  giorno     date   not null default current_date,
  viste      integer not null default 0,
  clic       integer not null default 0,
  primary key (impresa_id, giorno)
);

alter table public.loghi_statistiche enable row level security;

drop policy if exists loghi_statistiche_select on public.loghi_statistiche;
create policy loghi_statistiche_select on public.loghi_statistiche
  for select to authenticated
  using (
    exists (select 1 from public.imprese i where i.id = impresa_id and i.user_id = auth.uid())
    or public.sono_il_fondatore()
  );

revoke all on public.loghi_statistiche from anon;
grant select on public.loghi_statistiche to authenticated;

create or replace function public.conta_logo(p_impresa bigint, p_tipo text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_tipo is null or p_tipo not in ('vista', 'clic') then return; end if;
  if current_date > date '2027-02-04' then return; end if;
  if not exists (
    select 1 from imprese
    where id = p_impresa and logo_url is not null and logo_url <> ''
  ) then return; end if;

  insert into loghi_statistiche (impresa_id, giorno, viste, clic)
  values (p_impresa, current_date,
          case when p_tipo = 'vista' then 1 else 0 end,
          case when p_tipo = 'clic'  then 1 else 0 end)
  on conflict (impresa_id, giorno) do update set
    viste = loghi_statistiche.viste + (case when p_tipo = 'vista' then 1 else 0 end),
    clic  = loghi_statistiche.clic  + (case when p_tipo = 'clic'  then 1 else 0 end);
end;
$$;

revoke all on function public.conta_logo(bigint, text) from public;
grant execute on function public.conta_logo(bigint, text) to anon, authenticated;
