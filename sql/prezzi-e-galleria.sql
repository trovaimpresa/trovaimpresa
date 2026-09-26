-- =====================================================================
-- 26 settembre 2026 — I PREZZI DELL'IMPRESA E LA GALLERIA DEI LAVORI
-- (idee prese da Thumbtack e da Houzz, scelte da Alessio)
--
-- 1. `prezzi_impresa`: l'impresa scrive quanto costano, piu' o meno, i suoi
--    lavori («Rifacimento bagno completo — da 6.000 € a lavoro finito»).
--    Li scrive dal pannello, li legge chiunque sulla scheda pubblica.
-- 2. `galleria_lavori`: una vista sulle foto che le imprese hanno GIA'
--    caricato in «Foto dei lavori» (lavori_foto), con accanto nome, citta'
--    e mestiere dell'impresa. La usa la pagina /lavori-realizzati.
--
-- ⛔ Nessuna colonna nuova su `imprese` o su `lavori_foto`: qui si aggiunge
--    soltanto. Se si butta via tutto con le due `drop` in fondo, il sito
--    torna com'era.
-- ⛔ La galleria mostra SOLO quello che la scheda pubblica mostra gia':
--    foto con «Mostra nel profilo pubblico» acceso, di imprese che stanno in
--    `imprese_pubbliche` (email confermata, non di prova, vetrina accesa).
-- =====================================================================

create table if not exists public.prezzi_impresa (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  voce        text not null check (length(btrim(voce)) between 2 and 120),
  prezzo      numeric(12,2) not null check (prezzo > 0 and prezzo < 10000000),
  unita       text not null default 'lavoro'
              check (unita in ('lavoro','mq','metro','ora','giorno','pezzo')),
  a_partire_da boolean not null default true,
  nota        text check (nota is null or length(nota) <= 200),
  ordine      integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists prezzi_impresa_owner_idx
  on public.prezzi_impresa (owner_id, ordine, created_at);

alter table public.prezzi_impresa enable row level security;

-- chiunque legge (sono fatti per stare sulla scheda pubblica)...
drop policy if exists prezzi_select_tutti on public.prezzi_impresa;
create policy prezzi_select_tutti on public.prezzi_impresa
  for select to anon, authenticated using (true);

-- ...ma scrive solo il proprietario, e solo roba sua
drop policy if exists prezzi_scrive_owner on public.prezzi_impresa;
create policy prezzi_scrive_owner on public.prezzi_impresa
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- tetto: 40 prezzi a impresa. Una scheda con 300 righe non la legge nessuno,
-- e chi ci prova per sbaglio (un doppio clic lungo) non riempie la tabella.
create or replace function public.prezzi_impresa_tetto()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.prezzi_impresa where owner_id = new.owner_id) >= 40 then
    raise exception 'Hai gia'' 40 prezzi: togline uno prima di aggiungerne un altro.';
  end if;
  return new;
end $$;

drop trigger if exists prezzi_impresa_tetto on public.prezzi_impresa;
create trigger prezzi_impresa_tetto before insert on public.prezzi_impresa
  for each row execute function public.prezzi_impresa_tetto();

revoke execute on function public.prezzi_impresa_tetto() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- LA GALLERIA
-- security_invoker: chi legge la vista passa dalle regole di lavori_foto
-- (vede solo le foto pubbliche) e da imprese_pubbliche (solo imprese vere).
-- ---------------------------------------------------------------------
create or replace view public.galleria_lavori with (security_invoker = true) as
select lf.id,
       lf.foto,
       nullif(btrim(lf.titolo), '')      as titolo,
       nullif(btrim(lf.descrizione), '') as descrizione,
       lf.created_at,
       ip.id            as impresa_id,
       coalesce(nullif(btrim(ip.nome_attivita), ''), ip.nome) as impresa_nome,
       ip.citta,
       ip.provincia,
       ip.tipo,
       ip.mestiere,
       ip.logo_url
  from public.lavori_foto lf
  join public.imprese_pubbliche ip on ip.user_id = lf.owner_id
 where lf.pubblico = true
   and coalesce(lf.foto, '') <> '';

grant select on public.galleria_lavori to anon, authenticated;

-- per tornare indietro:
--   drop view if exists public.galleria_lavori;
--   drop table if exists public.prezzi_impresa;
--   drop function if exists public.prezzi_impresa_tetto();
