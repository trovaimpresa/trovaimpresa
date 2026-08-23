-- ============================================================
-- TrovaImpresa — LE FOTO E I VIDEO DEL NOLEGGIO
-- 23 agosto 2026
--
-- PERCHE' SERVE
-- Chiesto da Alessio: «si fotografa un mezzo e si fa sempre un video del
-- mezzo, per assicurarsi che quando rientra non presenti danni non
-- dichiarati». E' la carta che fa vincere le discussioni sui danni: senza
-- la foto di come e' uscito, al rientro e' parola contro parola.
--
-- COSA AGGIUNGE
-- Una tabella sola, nol_media, che tiene: di che noleggio si tratta, se e'
-- il momento dell'USCITA o del RIENTRO, se e' una foto o un video, dove sta
-- il file, quanto pesa e una nota.
--
-- ⛔ NON TOCCA NIENTE DI QUELLO CHE C'E' GIA'. Crea una tabella nuova e
--    basta. Si puo' rilanciare quante volte si vuole.
--
-- I FILE NON HANNO BISOGNO DI NIENTE DI NUOVO
-- Vanno nei due magazzini che ci sono gia': «gestionale-foto» e
-- «gestionale-video», dentro la cartella <tuo-id>/noleggio/<id-noleggio>/.
-- Le regole dello storage fanno passare sempre il titolare della cartella,
-- quindi non serve toccarle (verificato in sql/gest-deposito-file.sql,
-- funzione gest_puo_file: «il titolare passa sempre, su tutto»).
--
-- Si esegue nell'SQL Editor di Supabase. In fondo risponde con una riga.
-- ============================================================

create table if not exists public.nol_media (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  noleggio_id  uuid,
  mezzo_id     uuid,
  -- 'uscita' = com'era quando e' partito · 'rientro' = com'e' tornato
  momento      text not null default 'uscita',
  -- 'foto' oppure 'video'
  genere       text not null default 'foto',
  storage_path text not null,
  nome_file    text,
  nota         text,
  byte         bigint,
  created_at   timestamptz default now(),
  -- il cestino: qui non si cancella, si mette una data
  eliminato_il timestamptz
);

-- i collegamenti veri: se sparisce il noleggio spariscono le sue foto,
-- se sparisce il mezzo la foto resta ma perde il collegamento
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_media_noleggio_fk') then
    alter table public.nol_media
      add constraint nol_media_noleggio_fk
      foreign key (noleggio_id) references public.nol_noleggi(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nol_media_mezzo_fk') then
    alter table public.nol_media
      add constraint nol_media_mezzo_fk
      foreign key (mezzo_id) references public.nol_mezzi(id) on delete set null;
  end if;
end $$;

-- solo due valori, scritti nel database e non solo nella pagina
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_media_momento_ck') then
    alter table public.nol_media
      add constraint nol_media_momento_ck check (momento in ('uscita','rientro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nol_media_genere_ck') then
    alter table public.nol_media
      add constraint nol_media_genere_ck check (genere in ('foto','video'));
  end if;
end $$;

create index if not exists nol_media_noleggio_idx on public.nol_media(noleggio_id, momento);
create index if not exists nol_media_user_idx     on public.nol_media(user_id);
create index if not exists nol_media_cestino_idx  on public.nol_media(user_id, eliminato_il)
  where eliminato_il is not null;

-- ------------------------------------------------------------
-- IL LUCCHETTO: ognuno vede e tocca solo la sua roba
-- ------------------------------------------------------------
alter table public.nol_media enable row level security;

drop policy if exists "nol_media_select" on public.nol_media;
drop policy if exists "nol_media_insert" on public.nol_media;
drop policy if exists "nol_media_update" on public.nol_media;
drop policy if exists "nol_media_delete" on public.nol_media;

create policy "nol_media_select" on public.nol_media
  for select to authenticated using (user_id = auth.uid());
create policy "nol_media_insert" on public.nol_media
  for insert to authenticated with check (user_id = auth.uid());
create policy "nol_media_update" on public.nol_media
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "nol_media_delete" on public.nol_media
  for delete to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA: deve dire  tabella=1  regole=4
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='nol_media')            as tabella,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='nol_media')               as regole;
